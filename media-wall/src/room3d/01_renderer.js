/* ---------------------------------------------------------------- renderer */
let canvas = qs("canvas");
let gl;
try {
  gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  root.classList.add("nogl");
  msg.innerHTML = 'Your browser can’t show the 3D room here (no WebGL). The <a href="#views" data-go="views">drawn views</a> show every option.';
  throw e;
}
gl.debug.checkShaderErrors = !!navigator.webdriver || /[?&]debug\b/.test(location.search);   // V3.45 (N97), the client 10 Nov 2026: "smooth motion like im there when walking through the house": each new shader asked the graphics card for its error log, a wait of its own; the checks (and CI) keep it, ?debug too
gl.outputColorSpace = THREE.SRGBColorSpace;
gl.toneMapping = THREE.AgXToneMapping;   // v44: AgX over ACES: the wall reads nearer Card Room Green and the glass case and window keep their highlights
/* v39, client: "PC should be using GPU in order to speed up and keep frames high since most PCs will have 1060 or higher": the renderer
   asks for the high-performance GPU; a PC whose browser reports a real graphics card starts in HD (no Fast-then-HD second set of shaders
   to build) and keeps full resolution while you move unless its frames actually slow down. */
const GPU = (() => { try { const c = gl.getContext(), e = c.getExtension("WEBGL_debug_renderer_info"); return String(e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER)); } catch (e) { return ""; } })();
const BIG_GPU = !matchMedia("(pointer: coarse)").matches && /nvidia|geforce|rtx|gtx|quadro|radeon\s*(rx|pro|r9)|radeon\(tm\) rx|intel.*\barc\b|apple m\d/i.test(GPU) && !/swiftshader|llvmpipe|software|basic render/i.test(GPU);
/* V2.25, the client: "the main access point will be a gaming pc with a graphics card (5070 & 3060) so no lighter model should be used on
   pc ... best version with best performance and quality should be on pc": a real card (whatever the window's width) opens in HD on every
   visit, a saved Fast too (a driver reset used to save one for good), and never steps itself down (17_render_loop, 13_edit_room) */
if (BIG_GPU) S.quality = "hd";
/* v39, client: "Mobile ... is slow and doesn't render full quality expected". Phones drew at 0.85 of a CSS pixel (a third of a 3× screen's
   sharpness) and never left Fast. Now a phone draws at its own sharpness (2× on a capable chip, 1.5× otherwise; halved only while you
   move), and a capable chip (any iPhone's Apple GPU, Adreno 6xx and up, Mali-G57 and up, Immortalis, Xclipse) goes on to HD when its
   first frames are quick, and back to Fast if HD runs slow. */
const GOOD_PHONE = SMALL && /apple gpu|adreno[^0-9]*([6-9]\d{2})|mali-g(5[7-9]|6\d|7\d|[1-9]\d{2})|immortalis|xclipse/i.test(GPU);
/* V1.11, the client: "i dont want these low res versions, best textures, quality and performance on the PC and mobile": a capable phone
   (their iPhones) starts in HD at its screen's own sharpness with the shade, the glow and the PCs' soft 2048 shadows; if its frames run
   slow it gives way a step at a time (3× to 2×, then the shade, then Fast) rather than starting low */
if (GOOD_PHONE && !S.picked) S.quality = "hd";
const HI = BIG_GPU || GOOD_PHONE, LOWD = SMALL && !GOOD_PHONE;   // LOWD: a phone without a capable chip, the only one still drawn lighter
const LIVE_SHADOW = HI ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap, LIVE_MAP = HI ? 2048 : 1024;   // v44: a real graphics card gets the pictures' soft 2048 shadows live
gl.shadowMap.type = LIVE_SHADOW;   // v14.1: PCF while you look round; the saved HD pictures use soft shadows
gl.shadowMap.autoUpdate = false;          // v14.1: shadows don't move with the camera, so they're redrawn only when the room changes
const reshadow = () => { gl.shadowMap.needsUpdate = true; };
/* v35, client: "it currently still crashes in the shared version ... it also is a bit slow on the render sometimes becoming HD".
   three.js builds every material's shader for the number of lights it can see and how many cast shadows, so each light switched on or
   off (a scene, the table rule, a suggestion, a hidden group with a light in it) rebuilt about 20 shaders: 10 s for "Film", 21 s to open
   the table. Now, while you use the room, the lights the renderer sees are a fixed set for each quality (Fast leaves out the area lights
   and every other bar head, as before), a light that's "off" is turned down to nothing, and only one head on each spot bar casts a
   shadow (HD). A light inside something that can be hidden (an idea, a suggestion, the cabinet's bars) moves to an always-shown rig that
   follows it: always in HD's set (at nothing while hidden), never in Fast's (their glowing materials still show). While still() renders a picture (LIVE false) every light
   behaves as it always did, so the saved pictures don't change. */
let LIVE = true;
const lightRig = new THREE.Group(); lightRig.name = "lightRig";
const RIGGED = [];
function shownChain(o) { for (; o && o.parent; o = o.parent) if (!o.visible) return false; return true; }
function lightIn(l) {                 // in the renderer's set for this quality
  /* v73, the client: "still extremely slow" on a PC: in the house's views the living room's 36 lights (spot heads, area lights, LEDs),
     turned down to nothing, were still in every pixel's sums, two of them drawing shadows. There, only the sky, the sun and the room's
     own two ceiling lights are in the set (the shaders change once, going between the living room and the house) */
  if (LIVE && R.HOUSE3 && HOUSEV(S.view)) return !!(l.isHemisphereLight || l.userData.sun || (l.userData.houseLight && (!(l.userData.win || l.userData.hdOnly) || S.quality === "hd")));   // V3.57: and the last two ceiling lights   // V2.39: a window's daylight in HD
  if (l.userData.win) return false;
  const hd = S.quality === "hd";
  if (l.userData.owner) return hd;     // an idea's or a suggestion's light: always in HD's set (at nothing while it's hidden), never in Fast's
  if (l.isRectAreaLight) return hd;
  if (l.userData.fill) return !hd;      // v46: Fast's stand-ins for the area lights
  if (!hd && l.userData.barIx !== undefined) return l.userData.barIx % 2 === 0;
  return true;
}
function adoptLight(l, scn) {
  if (l.userData.adopted) return;
  l.userData.adopted = true;
  let v = l.visible, i = l.intensity, cs = l.castShadow;
  const owner = l.parent && l.parent !== scn && l.parent !== fixtures ? l.parent : null;
  if (owner) { l.userData.owner = owner; l.userData.lp = l.position.clone(); lightRig.add(l); RIGGED.push(l); }
  const on = () => v && (!owner || shownChain(owner));
  Object.defineProperty(l, "visible", { configurable: true, get: () => (LIVE ? lightIn(l) : on()), set: x => { v = x; } });
  Object.defineProperty(l, "intensity", { configurable: true, get: () => (on() ? i : 0), set: x => { i = x; } });
  Object.defineProperty(l, "castShadow", { configurable: true, set: x => { cs = x; },
    get: () => (LIVE ? S.quality === "hd" && ((l.isSpotLight && (l === lights.bar1[0] || l === lights.bar2[0])) || !!l.userData.sun) : cs) });   // v48: and the sun
}
function adoptLights(scn) {           // after anything that builds lights (the start, applyState, Edit room's add)
  const found = []; scn.traverse(o => { if (o.isLight && !o.userData.adopted) found.push(o); });
  found.forEach(l => adoptLight(l, scn));
}
/* v35: the first time the table opened, 18 shaders compiled for the parts that had been hidden (the open table, the chairs round it,
   the plates): 18 s here, a freeze on a phone. three's compile() can't make them ahead (it doesn't set up the cutaway's clipping, so
   its shaders don't match), so once the room is on screen and still, each hidden part is drawn on its own (camera layer 31: the part
   and every light) into a 1 × 1 target that three treats like the screen (same colour space and tone mapping, so the same shaders):
   its shaders are then ready when you open the table or switch something on. Nothing on screen changes, so there's no redraw after.
   One part at a time, only after a second with no taps or drags; again after a quality change */
const PRE = { queue: [], done: 0, rt: null, idleT: 0 };
function precompile() {
  PRE.queue.length = 0;
  const hiddenUp = o => { for (let p = o.parent; p; p = p.parent) if (!p.visible) return true; return false; };
  scene.traverse(o => { if (!o.isLight && o.visible === false && !hiddenUp(o)) PRE.queue.push(o); });
}
function precompileStep() {           // from the frame loop, when nothing's moving: one hidden part, drawn off screen
  if (!PRE.queue.length || !LIVE || (gl.shadowMap.enabled && gl.shadowMap.needsUpdate)) return false;   // never while the shadows are due a redraw
  const o = PRE.queue.shift(), shown = [], tagged = [];
  if (o.visible !== false || !o.parent) return true;
  if (!PRE.rt) { PRE.rt = new THREE.WebGLRenderTarget(1, 1); PRE.rt.isXRRenderTarget = true; PRE.rt.texture.colorSpace = gl.outputColorSpace; }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });   // v40: like the composer's (AO live)
  scene.traverse(c => { if (c.isLight) c.layers.enable(31); });
  o.traverse(c => { if (!c.isLight) { if (c.visible === false) { shown.push(c); c.visible = true; } if (!c.layers.isEnabled(31)) { tagged.push(c); c.layers.enable(31); } } });
  const mask = camera.layers.mask, was = gl.getRenderTarget();
  camera.layers.set(31); gl.setRenderTarget(postLive() ? PRE.rtAO : PRE.rt);
  try { gl.render(scene, camera); } finally {
    gl.setRenderTarget(was); camera.layers.mask = mask;
    shown.forEach(c => { c.visible = false; }); tagged.forEach(c => c.layers.disable(31));
  }
  PRE.done++;
  return true;
}
/* V3.23: where the browser builds shaders in parallel (Chrome on a PC, Safari), the hidden parts are asked for a dozen at a time
   (compileClipped), not drawn one by one: each draw waited for its shaders, on Windows the driver's compiler (a second or more each,
   the page held); now they build beside the page, which keeps answering */
function precompileBatch() {
  if (PRE.busy || !PRE.queue.length || !LIVE || (gl.shadowMap.enabled && gl.shadowMap.needsUpdate)) return false;
  const roots = PRE.queue.splice(0, 12).filter(o => o.visible === false && o.parent);
  if (!roots.length) return true;
  if (!PRE.rt) { PRE.rt = new THREE.WebGLRenderTarget(1, 1); PRE.rt.isXRRenderTarget = true; PRE.rt.texture.colorSpace = gl.outputColorSpace; }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const was = gl.getRenderTarget(); let job;
  try { gl.setRenderTarget(postLive() ? PRE.rtAO : PRE.rt); job = compileClipped(camera, false, roots); } catch (e) { job = Promise.resolve(); } finally { gl.setRenderTarget(was); }
  PRE.busy = true; Promise.race([job.catch(() => {}), new Promise(r => setTimeout(r, 8000))]).then(() => { PRE.busy = false; PRE.done += roots.length; });
  return true;
}
/* V2.64, the client's iPhone froze on the first tap on a floor: three's compileAsync (the start's shaders, built in parallel where the
   browser can: Safari and Chrome have KHR_parallel_shader_compile) builds every shader for the cutting planes of whatever was drawn
   last, so the house's 6 planes and the living room's 2 never matched and were built again, one at a time, on the frame that first
   showed them (34 to 44: seconds on a phone). Now the scene is compiled in groups with the same planes, each after a speck with those
   planes is drawn off screen (prime: which sets three's planes to its) */
function compileClipped(cam, shownOnly, roots) {   // shownOnly: what's shown now (the rooms' warm-up), not every hidden part too; roots: only these hidden parts (V3.23)
  const key = m => gl.localClippingEnabled && m.clippingPlanes && m.clippingPlanes.length ? m.clippingPlanes.length + (m.clipIntersection ? "i" : "u") : "0";
  const G = new Map(), D = new Map(), put = (M, k, o, m) => { if (!M.has(k)) M.set(k, []); M.get(k).push([o, m]); };
  (roots ? f => roots.forEach(r => r.traverse(f)) : f => scene[shownOnly ? "traverseVisible" : "traverse"](f))(o => { const m = [].concat(o.material || [])[0]; if (m && (o.isMesh || o.isLine || o.isPoints || o.isSprite)) put(G, key(m), o, o.material); });
  /* N35 (V2.87): and the shadows' own: three draws each caster into a shadow with a material of its own (cut, mapped or not) that it
     can't be asked to build ahead, so a stand-in like it, one of a kind, is put on each caster for the asking (and taken off) */
  const lit = []; scene.traverseVisible(l => { if (l.isLight) lit.push(l); });
  if (gl.shadowMap.enabled && !roots) { const pts = new Set(lit.filter(l => l.castShadow).map(l => !!l.isPointLight));
    for (const pt of pts) scene.traverseVisible(o => { if (!o.isMesh || !o.castShadow || !o.material) return; const d = Array.isArray(o.material) ? o.material.map(m => depthMat(m, pt)) : depthMat(o.material, pt), d0 = [].concat(d)[0]; put(D, "s" + (d0.clipShadows ? key(d0) : "0"), o, d); }); }
  const jobs = [], was = gl.getRenderTarget();
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  try {
    for (const [k, objs] of [...G, ...D]) {   // the shadows' into a plain target, as theirs are
      if (k[0] === "s") gl.setRenderTarget(PRE.rtAO);
      prime(k === "s0" ? null : objs[0][1], cam);
      const was_ = objs.map(([o]) => o.material); objs.forEach(([o, m]) => { o.material = m; });
      try { jobs.push(k[0] === "s" ? gl.compileAsync({ traverse: f => objs.forEach(([o]) => f(o)), traverseVisible: f => lit.forEach(f) }, cam, PRIMES)   // the shadows': no fog, as three's
        : gl.compileAsync({ traverse: f => objs.forEach(([o]) => f(o)), traverseVisible() {} }, cam, scene)); }
      finally { objs.forEach(([o], i) => { o.material = was_[i]; }); }
    }
  } finally { gl.setRenderTarget(was); }
  return Promise.all(jobs);
}
/* three builds for the cutting planes of whatever it drew last: a speck with the same planes (and no lights: one tiny shader for each
   set, ever), drawn into the 1 × 1 target. It drew one of the group's own pieces (N35: its shader then built on the spot) */
const PRIME = new THREE.Mesh(new THREE.PlaneGeometry(1e-4, 1e-4), new THREE.MeshBasicMaterial()), PRIMES = new THREE.Scene().add(PRIME);
PRIME.frustumCulled = false;
function prime(mat, cam) {
  const m = [].concat(mat || {})[0], p = PRIME.material, su = gl.shadowMap.needsUpdate;
  p.clippingPlanes = m.clippingPlanes && m.clippingPlanes.length ? m.clippingPlanes : null; p.clipIntersection = !!m.clipIntersection;
  gl.shadowMap.needsUpdate = false;
  try { gl.render(PRIMES, cam); } finally { gl.shadowMap.needsUpdate = su; }
}
const DEPTHS = new Map();   // kept, never disposed: one disposed would take its shader with it
function depthMat(m, pt) {   // as three's getDepthMaterial makes it (PCF shadows)
  const side = m.shadowSide != null ? m.shadowSide : [THREE.BackSide, THREE.FrontSide, THREE.DoubleSide][m.side];
  const clip = m.clipShadows && m.clippingPlanes && m.clippingPlanes.length ? m.clippingPlanes.length + (m.clipIntersection ? "i" : "u") : "";
  const k = [pt, side, !!m.map, !!m.alphaMap, m.alphaTest > 0, !!(m.displacementMap && m.displacementScale), !!m.wireframe, clip].join();
  let d = DEPTHS.get(k); if (!d) DEPTHS.set(k, d = pt ? new THREE.MeshDistanceMaterial() : new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
  Object.assign(d, { side, map: m.map, alphaMap: m.alphaMap, alphaTest: m.alphaTest, wireframe: m.wireframe, clipShadows: m.clipShadows, clippingPlanes: m.clippingPlanes, clipIntersection: m.clipIntersection,
    displacementMap: m.displacementMap, displacementScale: m.displacementScale, displacementBias: m.displacementBias });
  return d;
}
/* V2.66 (N13), the client 7 Nov 2026: "iPhone is running better but there's still some initial freezing": after the warm-up the first
   picture still built 16 shaders one after another (the shade's, the glow's, their output, the shadows' depth), drew every shadow and
   sent about 220 textures, all in one frame. Now the shade's and the glow's shaders are asked for in the warm-up with the rest (in
   parallel where the browser can), every texture is sent in short slices while it waits, and the shadows are drawn a frame before the
   first picture (off screen), so no one frame does it all */
function postWarm() {                 // the composer's own shaders, in parallel (01's aoComposer made early)
  if (!postLive() || !gl.compileAsync) return Promise.resolve();
  const sz = gl.getSize(new THREE.Vector2()); aoComposer(sz.x, sz.y, gl.getPixelRatio()); AO.w = sz.x; AO.h = sz.y; AO.pr = gl.getPixelRatio();
  const scr = new THREE.Scene(), tgt = new THREE.Scene(), geo = new THREE.PlaneGeometry(2, 2), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fake = { outputColorSpace: gl.outputColorSpace, toneMapping: gl.toneMapping, setRenderTarget() {}, render() {}, clear() {}, getRenderTarget: () => null };
  for (const p of AO.c.passes) {
    if (p instanceof OutputPass) { try { p.render(fake, null, AO.c.readBuffer); } catch (e) {} scr.add(new THREE.Mesh(geo, p.material)); continue; }   // its defines are set as it first draws
    for (const v of Object.values(p)) for (const m of [].concat(v)) if (m && m.isShaderMaterial) tgt.add(new THREE.Mesh(geo, m));
  }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const was = gl.getRenderTarget();
  try { gl.setRenderTarget(PRE.rtAO); gl.render(new THREE.Mesh(geo, new THREE.MeshBasicMaterial()), cam);   // three builds for the cutting planes last drawn: none here
    const a = gl.compileAsync(tgt, cam); gl.setRenderTarget(null); return Promise.all([a, gl.compileAsync(scr, cam)]); }
  catch (e) { return Promise.resolve(); } finally { gl.setRenderTarget(was); }
}
function texWarm() {                  // every texture onto the chip in slices of 8 ms while the shaders build (none in the first frame)
  const T = new Set();
  scene.traverse(o => { for (const m of [].concat(o.material || [])) for (const k in m) { const t = m[k]; if (t && t.isTexture && !t.isRenderTargetTexture && t.image) T.add(t); } });
  const L = [...T], step = () => { const t0 = performance.now(); while (L.length && performance.now() - t0 < 8) { try { gl.initTexture(L.pop()); } catch (e) {} } if (L.length) setTimeout(step, 0); };
  step();
}
/* V3.51 (N103), the client 10 Nov 2026: "i want smooth motion like im there when walking through the house": a room's shaders were
   built ahead, but its shapes went to the graphics card on the frame that first showed them (from the hall, 305 shapes, 15 MB, in
   the one frame by the living room's door). Now a room's shapes go after its warm-up's shaders, a few at a time between frames,
   drawn at 1 × 1 in one plain material (no lights: no new shaders); nothing with its own before-draw step (the room's stickers) */
const GEO_DONE = new WeakSet(), GEO_Q = []; let geoT = 0, geoH = null;
function geoWarm(list) {
  for (const o of list) if (o.isMesh && o.geometry && !GEO_DONE.has(o.geometry) && o.onBeforeRender === THREE.Object3D.prototype.onBeforeRender) { GEO_DONE.add(o.geometry); GEO_Q.push(o); }
  if (GEO_Q.length && !geoT) geoT = setTimeout(geoStep, 0);
}
function geoStep() {
  geoT = 0; if (!PRE.rt) return;
  if (!geoH) { geoH = new THREE.Scene(); geoH.overrideMaterial = new THREE.MeshBasicMaterial(); geoH.matrixWorldAutoUpdate = false; }
  const was = gl.getRenderTarget(), su = gl.shadowMap.needsUpdate, au = gl.shadowMap.autoUpdate, ar = gl.info.autoReset, t0 = performance.now();
  try { gl.shadowMap.autoUpdate = false; gl.info.autoReset = false; gl.setRenderTarget(PRE.rt);
    while (GEO_Q.length && performance.now() - t0 < 3) {
      const o = GEO_Q.splice(0, 6), fc = o.map(m => m.frustumCulled); o.forEach(m => { m.frustumCulled = false; });
      geoH.children = o; try { gl.render(geoH, camera); } finally { geoH.children = []; o.forEach((m, i) => { m.frustumCulled = fc[i]; }); } }
  } catch (e) { GEO_Q.length = 0; }
  finally { gl.setRenderTarget(was); gl.shadowMap.needsUpdate = su; gl.shadowMap.autoUpdate = au; gl.info.autoReset = ar; }
  if (GEO_Q.length) geoT = setTimeout(geoStep, 16);
}
function preDraw() {                  // the frame before the first: the shadows (and their depth shaders) drawn off screen, at 1 × 1
  livingFromOutside();               // what the first frame hides first (outside, the living room), so its shadows aren't drawn twice
  if (!gl.shadowMap.enabled) return; reshadow();   // V2.72: always (the start may have drawn them already: their depth shaders weren't built)
  if (!PRE.rt) { PRE.rt = new THREE.WebGLRenderTarget(1, 1); PRE.rt.isXRRenderTarget = true; PRE.rt.texture.colorSpace = gl.outputColorSpace; }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const was = gl.getRenderTarget(); gl.setRenderTarget(postLive() ? PRE.rtAO : PRE.rt);
  try { gl.render(scene, camera); } finally { gl.setRenderTarget(was); }
}
/* v40, client: "better rendering and graphics": ambient occlusion (three's GTAO), the soft shade where things meet. Always in the HD
   pictures; live in HD on a real graphics card (aoLive). With it the room draws into the composer's target (linear, tone-mapped at the
   end), so the warm-up draws into a target of the same kind and the shaders match. N46: the shade reads that target's depth
   (cut by the cutaway as drawn) instead of drawing the scene a second time for its normals: HD's draws about halved */
const AO = { c: null, g: null };
/* v73 (B): if the house still runs under 25 frames a second in HD (the gaps while it moves), it drops its ambient occlusion and draws at
   1× (the living room keeps its HD); once, for this visit (?houselite forces it, for a check) */
let houseLite = /[?&]houselite\b/.test(location.search);
/* V1.1, the client's iPhones (15 Pro, 16): a capable phone in HD whose frames are quick (under 14 ms) gets the PCs' shade and glow too
   (phoneAO, from autoQuality), lighter (8 samples, 2× anti-aliasing); off again for the visit if its frames then pass 30 ms */
let phoneAO = GOOD_PHONE, phoneAOoff = false, phoneCap = 2;   // V1.11: on from the start; phoneCap: the phone's sharpness
/* V2.64, the client: "the phone version on my iPhone is freezing on load after first move and is quite laggy": the iPhone drew at its
   screen's 3× (2.25 times 2×'s pixels, every frame through the shade and the glow) and the speed check then stepped it to 2× in its
   first seconds, a new set of buffers each step; it starts at 2× now (with 4× anti-aliasing, as sharp to the eye at a phone's size).
   And a phone in HD always draws through the composer, the shade on or off: the shaders for a target and for the screen differ, so
   the shade going off after the speed check built every shader in sight again (15 to 30 programs: seconds on a phone) */
const PHONE_HD = GOOD_PHONE && !BIG_GPU, dragLite = () => PHONE_HD && postLive();
/* V3.39 (N91), the client 10 Nov 2026: "pc is getting better but still some stutter when moving, i want smooth motion like im there when
   walking through the house". The phone leaves out the soft shade and the glow while it moves and is smooth; a PC kept both on every
   frame of a walk, on a 144-165 Hz screen close to the frame's whole time (6-7 ms), so a frame now and then missed its turn: an uneven
   step, a stutter. Now a PC does as the phone does: while you walk, look round or drag, the shade and the glow wait (the same shaders,
   the passes skipped, nothing rebuilt), and they come back a quarter of a second after you stop. ?fullmove keeps them on */
let moveLite = false;
const MOVE_LITE = !/[?&]fullmove\b/.test(location.search);
const postLive = () => S.quality === "hd" && (BIG_GPU || GOOD_PHONE || /[?&]ao\b/.test(location.search)) && !/[?&]noao\b/.test(location.search);   // V2.64: drawn through the composer
const aoLive = () => postLive() && (BIG_GPU || phoneAO || /[?&]ao\b/.test(location.search)) && !(houseLite && R.HOUSE3 && HOUSEV(S.view)) && !(dragLite() && lowRes) && !moveLite;   // ?ao tries it anywhere; V2.64: a slow phone leaves the shade out while you drag, not the sharpness (no new buffers)
function aoComposer(w, h, pr) {
  if (!AO.c) {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: SMALL ? (GOOD_PHONE ? 4 : 0) : 4, depthTexture: new THREE.DepthTexture(w, h) });   // anti-aliased, as on screen
    AO.c = new EffectComposer(gl, rt); AO.c.renderTarget2.depthTexture = new THREE.DepthTexture(w, h);   // a depth of its own (a clone shares the first's GL texture)
    AO.c.addPass(new RenderPass(scene, camera));
    AO.g = new GTAOPass(scene, camera, w, h); AO.g.blendIntensity = 0.9; AO.g.setGBuffer(rt.depthTexture);   // N46: shades from the picture's own depth (normals from it), no second pass
    { const gs = AO.g.setSize.bind(AO.g); AO.g.setSize = (w_, h_) => LIVE ? gs(Math.ceil(w_ / 2), Math.ceil(h_ / 2)) : gs(w_, h_); }   // V2.30: the soft shade at half size while you look round (a quarter of its cost); the saved pictures at full
    AO.g.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: SMALL && !GOOD_PHONE ? 8 : 16, distanceFallOff: 1 });
    AO.g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: SMALL && !GOOD_PHONE ? 8 : 16 });
    AO.c.addPass(AO.g);
    // v48 §5, client: "improving the renders graphics and quality": a soft glow round what's brighter than white (the LED strips, the lamp's
    // shades, the lit spot heads, the screen), in HD on a real graphics card and in every saved picture; the phone's Fast view has none
    AO.b = new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.4, 2.2); AO.c.addPass(AO.b); bloomLevels(S.tod === "day");
    AO.c.addPass(new OutputPass());
  }
  AO.c.setPixelRatio(pr); AO.c.setSize(w, h);
  return AO.c;
}
function draw() {                     // a frame: through the composer with AO, or straight to the screen
  backdrop();   // V3.59 (N115): Above and On its own over the cream, not black (19_view_controls.js)
  if (postLive()) { const sz = gl.getSize(new THREE.Vector2()); if (!AO.c || AO.w !== sz.x || AO.h !== sz.y || AO.pr !== gl.getPixelRatio()) { aoComposer(sz.x, sz.y, gl.getPixelRatio()); AO.w = sz.x; AO.h = sz.y; AO.pr = gl.getPixelRatio(); }
    const glow = AO.b.enabled; if ((dragLite() && lowRes) || moveLite) AO.b.enabled = false;   // V2.73 (N17): no glow on a phone while it moves (its 10 passes); back as it stops; V3.39: a PC's too (moveLite)
    AO.g.enabled = aoLive(); if (AO.g.depthTexture !== AO.c.readBuffer.depthTexture) AO.g.setGBuffer(AO.c.readBuffer.depthTexture);   // the target the scene draws into this frame
    gl.info.autoReset = false; gl.info.reset(); AO.c.render(); gl.info.autoReset = true; AO.b.enabled = glow; }   // the count covers every pass
  else gl.render(scene, camera);
}
function syncRig() {                  // each frame: a rigged light follows its owner, and leaves with it (a rebuilt cabinet)
  for (let k = RIGGED.length - 1; k >= 0; k--) {
    const l = RIGGED[k], o = l.userData.owner;
    let top = o; while (top && top.parent) top = top.parent;
    if (!l.parent || !o || top !== scene) { lightRig.remove(l); RIGGED.splice(k, 1); continue; }
    o.updateWorldMatrix(true, false); l.position.copy(l.userData.lp).applyMatrix4(o.matrixWorld);
  }
}
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0d100e");
scene.fog = new THREE.Fog("#cbd8e3", 1e4, 2e4);   // V1.3: the haze over the whole house (outdoor()); here from the start, so turning it up builds no shaders
const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 120);   // v54: far enough for the whole house and the garden
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.maxDistance = 6;          // v17: 6 m inside the room (the views from above lift it), never closer than 30 cm
controls.minDistance = 0.3;
controls.screenSpacePanning = false;   // v17: a right-drag slides along the floor
// v31, client: "make camera movement easier ... sometimes the movement is quite uncontrollable": it stops soon after you let go,
// and a drag, a pinch or a scroll moves it about half as far
const DAMP = 0.2; controls.dampingFactor = DAMP;   // V2.60: per 60th of a second (17_render_loop scales it to the frame)
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.6; controls.panSpeed = 0.6;
controls.zoomToCursor = true;   // V1.29 (U2), the client: "how quick the render can ... zoom": a scroll or a pinch goes towards what you point at, not the middle
controls.addEventListener("change", () => { dirty(); if (typeof syncEye === "function") syncEye(); });

