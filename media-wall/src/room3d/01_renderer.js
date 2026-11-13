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
/* v39: a PC asks for the high-performance GPU; a real graphics card starts in HD and keeps full resolution while moving unless slow */
const GPU = (() => { try { const c = gl.getContext(), e = c.getExtension("WEBGL_debug_renderer_info"); return String(e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER)); } catch (e) { return ""; } })();
/* N124: a desktop browser that hides the card's name (no maker, not software) is taken as one with a card; slowDev still decides */
const MASKED = !SMALL && !matchMedia("(pointer: coarse)").matches && !/nvidia|geforce|rtx|gtx|quadro|amd|radeon|ati\b|intel|apple|adreno|mali|immortalis|xclipse|powervr|qualcomm|arm\b|swiftshader|llvmpipe|software|basic render|microsoft|vmware|virtualbox|parallels|mesa|google/i.test(GPU);
const BIG_GPU = MASKED || !matchMedia("(pointer: coarse)").matches && /nvidia|geforce|rtx|gtx|quadro|radeon\s*(rx|pro|r9)|radeon\(tm\) rx|intel.*\barc\b|apple m\d/i.test(GPU) && !/swiftshader|llvmpipe|software|basic render/i.test(GPU);
if (BIG_GPU) S.quality = "hd";   // V2.25: a real card opens in HD on every visit (a saved Fast too) and never steps itself down (17_render_loop, 13_edit_room)
/* v39: a phone draws at its own sharpness; a capable chip (Apple GPU, Adreno 6xx+, Mali-G57+, Immortalis, Xclipse) goes on to HD */
const GOOD_PHONE = SMALL && /apple gpu|adreno[^0-9]*([6-9]\d{2})|mali-g(5[7-9]|6\d|7\d|[1-9]\d{2})|immortalis|xclipse/i.test(GPU);
if (GOOD_PHONE && !S.picked) S.quality = "hd";   // V1.11: a capable phone starts in HD with the shade, the glow and 2048 shadows; if slow it steps down (3× to 2×, the shade, Fast)
const HI = BIG_GPU || GOOD_PHONE, LOWD = SMALL && !GOOD_PHONE;   // LOWD: a phone without a capable chip, the only one still drawn lighter
const LIVE_SHADOW = HI ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap, LIVE_MAP = HI ? 2048 : 1024;   // v44: a real graphics card gets the pictures' soft 2048 shadows live
gl.shadowMap.type = LIVE_SHADOW;   // v14.1: PCF while you look round; the saved HD pictures use soft shadows
gl.shadowMap.autoUpdate = false;          // v14.1: shadows don't move with the camera, so they're redrawn only when the room changes
const reshadow = () => { gl.shadowMap.needsUpdate = true; };
/* v35: the lights the renderer sees are a fixed set per quality (an "off" light at zero; one shadow-casting head a bar in HD), so a
   switch builds no shaders; a light in a hideable group moves to the always-shown lightRig. still() (LIVE false) draws as it always did */
let LIVE = true;
const lightRig = new THREE.Group(); lightRig.name = "lightRig";
const RIGGED = [];
function shownChain(o) { for (; o && o.parent; o = o.parent) if (!o.visible) return false; return true; }
function lightIn(l) {                 // in the renderer's set for this quality
  /* v73: in the house's views only the sky, the sun and the house's own lights are in the set (the living room's 36 are not) */
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
/* v35: hidden parts (the open table, the chairs, ...) drawn one at a time at 1 × 1 (camera layer 31, three's own colour space and
   tone mapping) once the room is still a second, so their shaders are ready before they're shown; again after a quality change */
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
/* V3.23: where shaders build in parallel, hidden parts are asked for a dozen at a time (compileClipped) beside the page */
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
/* V2.64: three builds for the cutting planes of whatever it drew last, so the scene compiles in groups that share planes, each after
   a speck with those planes is drawn off screen (prime) */
function compileClipped(cam, shownOnly, roots) {   // shownOnly: what's shown now (the rooms' warm-up), not every hidden part too; roots: only these hidden parts (V3.23)
  const key = m => gl.localClippingEnabled && m.clippingPlanes && m.clippingPlanes.length ? m.clippingPlanes.length + (m.clipIntersection ? "i" : "u") : "0";
  const G = new Map(), D = new Map(), put = (M, k, o, m) => { if (!M.has(k)) M.set(k, []); M.get(k).push([o, m]); };
  const each = roots ? f => roots.forEach(r => r.traverse(f)) : f => scene[shownOnly ? "traverseVisible" : "traverse"](f);
  each(o => { const m = [].concat(o.material || [])[0]; if (m && (o.isMesh || o.isLine || o.isPoints || o.isSprite)) put(G, key(m), o, o.material); });
  const lit = []; scene.traverseVisible(l => { if (l.isLight) lit.push(l); });   // N35: the shadows' own materials: a one-of-a-kind stand-in put on each caster for the asking (and taken off)
  if (gl.shadowMap.enabled) { const pts = new Set(lit.filter(l => l.castShadow).map(l => !!l.isPointLight));   // N180: the hidden parts' shadows too (a lower-floor piece's sun shadow built mid-walk)
    const sig = lit.map(l => l.type + +l.castShadow).sort().join(), wide = !LITS.has(sig) && LITS.size > 0 && (shownOnly || roots);   // N182: a shadow's shader carries the count of lights on, so each set seen is kept and every set asked for;
    if (!LITS.has(sig)) LITS.set(sig, lit);   // a new set (the living room's lights on) takes every caster's, hidden ones too: else a lower-floor piece built its own on the way down
    for (const pt of pts) (wide ? f => scene.traverse(f) : each)(o => { if (!o.isMesh || !o.castShadow || !o.material) return; const d = Array.isArray(o.material) ? o.material.map(m => depthMat(m, pt)) : depthMat(o.material, pt), d0 = [].concat(d)[0]; put(D, "s" + (d0.clipShadows ? key(d0) : "0"), o, d); }); }
  const jobs = [], was = gl.getRenderTarget();
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  try {
    for (const [k, objs] of [...G, ...D]) {   // the shadows' into a plain target, as theirs are
      if (k[0] === "s") gl.setRenderTarget(PRE.rtAO);
      prime(k === "s0" ? null : objs[0][1], cam);
      const was_ = objs.map(([o]) => o.material); objs.forEach(([o, m]) => { o.material = m; });
      try { if (k[0] === "s") for (const L of LITS.values()) jobs.push(gl.compileAsync({ traverse: f => objs.forEach(([o]) => f(o)), traverseVisible: f => L.forEach(f) }, cam, PRIMES));   // the shadows': no fog, as three's; in every set of lights
        else jobs.push(gl.compileAsync({ traverse: f => objs.forEach(([o]) => f(o)), traverseVisible() {} }, cam, scene)); }
      finally { objs.forEach(([o], i) => { o.material = was_[i]; }); }
    }
  } finally { gl.setRenderTarget(was); }
  return Promise.all(jobs);
}
const PRIME = new THREE.Mesh(new THREE.PlaneGeometry(1e-4, 1e-4), new THREE.MeshBasicMaterial()), PRIMES = new THREE.Scene().add(PRIME);   // the speck (one tiny unlit shader a plane set) drawn into the 1 × 1 target
PRIME.frustumCulled = false;
function prime(mat, cam) {
  const m = [].concat(mat || {})[0], p = PRIME.material, su = gl.shadowMap.needsUpdate;
  p.clippingPlanes = m.clippingPlanes && m.clippingPlanes.length ? m.clippingPlanes : null; p.clipIntersection = !!m.clipIntersection;
  gl.shadowMap.needsUpdate = false;
  try { gl.render(PRIMES, cam); } finally { gl.shadowMap.needsUpdate = su; }
}
const LITS = new Map();   // N182: each set of lights a warm-up has seen (by kind and shadow), for the shadows' shaders
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
/* V2.66 (N13): the shade's and glow's shaders built in the warm-up, textures sent in slices, shadows drawn a frame before the first
   picture, so no one frame does it all */
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
const GEO_DONE = new WeakSet(), GEO_Q = []; let geoT = 0, geoH = null;   // V3.51 (N103): a room's shapes uploaded after its warm-up's shaders, a few between frames, drawn 1 × 1 in one plain material
function geoWarm(list) {
  for (const o of list) if (o.isMesh && o.geometry && !GEO_DONE.has(o.geometry) && o.onBeforeRender === THREE.Object3D.prototype.onBeforeRender) { GEO_DONE.add(o.geometry); GEO_Q.push(o); }
  if (GEO_Q.length && !geoT) geoT = setTimeout(geoStep, 0);
}
const GEO_C = new WeakSet(); let geoP = null;   // V3.69 (N123): each queued shape's plain-material variant compiled beside the page (compileAsync) before it's drawn
function geoStep() {
  geoT = 0; if (!PRE.rt) return;
  if (!geoH) { geoH = new THREE.Scene(); geoH.overrideMaterial = new THREE.MeshBasicMaterial(); geoH.matrixWorldAutoUpdate = false; geoP = new THREE.Scene(); geoP.matrixWorldAutoUpdate = false; }
  const fresh = GEO_Q.filter(o => !GEO_C.has(o));
  if (fresh.length) { fresh.forEach(o => GEO_C.add(o)); geoP.children = fresh.filter(o => !o.isSkinnedMesh && !o.isBatchedMesh).map(o => { const m = o.isInstancedMesh ? new THREE.InstancedMesh(o.geometry, geoH.overrideMaterial, 1) : new THREE.Mesh(o.geometry, geoH.overrideMaterial); if (o.instanceColor) m.instanceColor = o.instanceColor; m.matrixAutoUpdate = false; m.matrixWorldAutoUpdate = false; m.matrixWorld.copy(o.matrixWorld); m.receiveShadow = o.receiveShadow; m.layers.mask = o.layers.mask; return m; });   // as it's drawn: a mirrored shape's own variant
    const was = gl.getRenderTarget(); let job = Promise.resolve();
    try { gl.setRenderTarget(PRE.rt); job = gl.compileAsync(geoP, camera); } catch (e) {} finally { gl.setRenderTarget(was); geoP.children = []; }
    geoT = -1; job.catch(() => {}).then(() => { geoT = setTimeout(geoStep, 0); }); return; }
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
/* v40: GTAO in HD pictures and live on a real card (aoLive); the warm-up draws into a target of the composer's kind so the shaders
   match. N46: the shade reads that target's depth (no second normals pass) */
const AO = { c: null, g: null };
let houseLite = /[?&]houselite\b/.test(location.search);   // v73 (B): a house under 25 fps in HD drops its AO and draws at 1× for the visit (?houselite forces it)
/* V1.1: a capable phone in HD that runs under 14 ms gets the shade and glow, lighter (phoneAO); off for the visit past 30 ms */
let phoneAO = GOOD_PHONE, phoneAOoff = false, phoneCap = 2;   // V1.11: on from the start; phoneCap: the phone's sharpness
/* V2.64: an iPhone starts at 2× (4× anti-aliasing) and in HD always draws through the composer, the shade on or off, so the speed
   check never rebuilds the shaders in sight */
const PHONE_HD = GOOD_PHONE && !BIG_GPU, dragLite = () => PHONE_HD && postLive();
/* V3.39 (N91): while you walk, look or drag, a PC skips the shade and the glow as the phone does (same shaders); they come back a
   quarter of a second after you stop. ?fullmove keeps them on */
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
    AO.b = new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.4, 2.2); AO.c.addPass(AO.b); bloomLevels(S.tod === "day");   // v48: a soft glow round what's brighter than white, in HD on a real card and in every saved picture
    AO.c.addPass(new OutputPass());
  }
  AO.c.setPixelRatio(pr); AO.c.setSize(w, h);
  return AO.c;
}
function draw() {                     // a frame: through the composer with AO, or straight to the screen
  backdrop();   // V3.64 (N115): Above and On its own over the cream, not black (19_view_controls.js)
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
// v31: it stops soon after you let go; a drag, pinch or scroll moves it about half as far
const DAMP = 0.2; controls.dampingFactor = DAMP;   // V2.60: per 60th of a second (17_render_loop scales it to the frame)
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.6; controls.panSpeed = 0.6;
controls.zoomToCursor = true;   // V1.29 (U2), the client: "how quick the render can ... zoom": a scroll or a pinch goes towards what you point at, not the middle
controls.addEventListener("change", () => { dirty(); if (typeof syncEye === "function") syncEye(); });

