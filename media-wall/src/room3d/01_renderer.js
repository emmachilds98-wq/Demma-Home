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
  if (LIVE && R.HOUSE3 && HOUSEV(S.view)) return !!(l.isHemisphereLight || l.userData.sun || (l.userData.houseLight && (!l.userData.win || S.quality === "hd")));   // V2.39: a window's daylight in HD
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
  camera.layers.set(31); gl.setRenderTarget(aoLive() ? PRE.rtAO : PRE.rt);
  try { gl.render(scene, camera); } finally {
    gl.setRenderTarget(was); camera.layers.mask = mask;
    shown.forEach(c => { c.visible = false; }); tagged.forEach(c => c.layers.disable(31));
  }
  PRE.done++;
  return true;
}
/* v40, client: "better rendering and graphics": ambient occlusion (three's GTAO), the soft shade where things meet. Always in the HD
   pictures; live in HD on a real graphics card (aoLive). With it the room draws into the composer's target (linear, tone-mapped at the
   end), so the warm-up draws into a target of the same kind and the shaders match. */
const AO = { c: null, g: null };
/* v73 (B): if the house still runs under 25 frames a second in HD (the gaps while it moves), it drops its ambient occlusion and draws at
   1× (the living room keeps its HD); once, for this visit (?houselite forces it, for a check) */
let houseLite = /[?&]houselite\b/.test(location.search);
/* V1.1, the client's iPhones (15 Pro, 16): a capable phone in HD whose frames are quick (under 14 ms) gets the PCs' shade and glow too
   (phoneAO, from autoQuality), lighter (8 samples, 2× anti-aliasing); off again for the visit if its frames then pass 30 ms */
let phoneAO = GOOD_PHONE, phoneAOoff = false, phoneCap = 3;   // V1.11: on from the start; phoneCap: the phone's sharpness, 3× until slow
const aoLive = () => S.quality === "hd" && (BIG_GPU || phoneAO || /[?&]ao\b/.test(location.search)) && !/[?&]noao\b/.test(location.search) && !(houseLite && R.HOUSE3 && HOUSEV(S.view));   // ?ao tries it anywhere
function aoComposer(w, h, pr) {
  if (!AO.c) {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: SMALL ? (GOOD_PHONE ? 4 : 0) : 4 });   // anti-aliased, as on screen
    AO.c = new EffectComposer(gl, rt); AO.c.addPass(new RenderPass(scene, camera));
    AO.g = new GTAOPass(scene, camera, w, h); AO.g.blendIntensity = 0.9;
    { const gs = AO.g.setSize.bind(AO.g); AO.g.setSize = (w_, h_) => LIVE ? gs(Math.ceil(w_ / 2), Math.ceil(h_ / 2)) : gs(w_, h_); }   // V2.30: the soft shade at half size while you look round (a quarter of its cost); the saved pictures at full
    AO.g.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: SMALL && !GOOD_PHONE ? 8 : 16, distanceFallOff: 1 });
    AO.g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: SMALL && !GOOD_PHONE ? 8 : 16 });
    clipMat(AO.g.normalMaterial);                                    // the cutaway cuts the depth it shades from, too
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
  if (aoLive()) { const sz = gl.getSize(new THREE.Vector2()); if (!AO.c || AO.w !== sz.x || AO.h !== sz.y || AO.pr !== gl.getPixelRatio()) { aoComposer(sz.x, sz.y, gl.getPixelRatio()); AO.w = sz.x; AO.h = sz.y; AO.pr = gl.getPixelRatio(); }
    gl.info.autoReset = false; gl.info.reset(); AO.c.render(); gl.info.autoReset = true; }   // the count covers every pass
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
controls.dampingFactor = 0.2;
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.6; controls.panSpeed = 0.6;
controls.zoomToCursor = true;   // V1.29 (U2), the client: "how quick the render can ... zoom": a scroll or a pinch goes towards what you point at, not the middle
controls.addEventListener("change", () => { dirty(); if (typeof syncEye === "function") syncEye(); });

