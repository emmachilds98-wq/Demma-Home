/* ---------------------------------------------------------------- render loop, only when something changed */
let houseLite = /[?&]houselite\b/.test(location.search);   // v73 (B): a house under 25 fps in HD drops its AO and draws at 1× for the visit (?houselite forces it)
/* V1.1: a capable phone in HD that runs under 14 ms gets the shade and glow, lighter (phoneAO); off for the visit past 30 ms */
let phoneAO = GOOD_PHONE, phoneAOoff = false, phoneCap = 2;   // V1.11: on from the start; phoneCap: the phone's sharpness
let moveLite = false;   // V3.39 (N91): the shade and glow off while you move (01_renderer.js MOVE_LITE)
let still_t = 0, lowRes = false, dragT = 0, slowDev = !HI, capDue = false;   // v35: slowDev until the speed check says otherwise (v39: not on a real graphics card)
const MV = []; let mvLast = 0;   // v39: the gaps between frames while the room moves: slow ones turn on the lower resolution while you drag
function dirty() { GS.need = Math.max(GS.need, 2); }
function fullRatio() { const d = window.devicePixelRatio || 1; if (SMALL && !BIG_GPU) return Math.min(d, GOOD_PHONE ? phoneCap : 1.5); if (S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view) && !BIG_GPU) return houseLite ? 1 : Math.min(d, 1.5);   // V2.25: a real card draws the house as sharp as a room   // V1.11: a real graphics card draws the house at 2× too   // v73: the house at the screen's own sharpness (no supersampling: it's many times the living room's drawing)
  return S.quality === "hd" ? (BIG_GPU ? Math.min(d, 2, pxCap()) : Math.min(d, 1.5)) : Math.min(d, 1); }
/* N296 (Emma, 27 Nov: "pc is slow, makes fan speed high and then is slow to walk and seems not smooth"): a real card draws HD at most
   about 4.2 million pixels (2560 x 1600; a 4K screen at 1.5x was 8.3 million: twice the shading of every light, the shade and the
   glow), never under 0.75x; ?px=N for another budget (millions) */
const PX_BUDGET = (+(location.search.match(/[?&]px=([\d.]+)/) || [])[1] || 4.2) * 1e6;
function pxCap() { const a = Math.max(1, canvas.clientWidth * canvas.clientHeight); return Math.max(0.75, Math.sqrt(PX_BUDGET / a)); }   // V2.30: a real card at the screen's own sharpness, as a game (4× anti-aliasing smooths the edges; it drew 1.5× on top: 2.25 times the pixels)   // v39: phones at their own sharpness; v44: a real graphics card draws HD at 1.5–2×; v50: Fast on a PC at full size (was 0.85×)
const fitFov = (fov, asp = camera.aspect) => asp >= 16 / 9 ? fov : Math.min(95, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * (asp < 0.8 ? 1.45 : 16 / 9) / asp) * 180 / Math.PI);   // v21: narrower screens widen the field of view to take in as much of the room as at 16:9 (v33: portrait, tighter)
function sizeRenderer(sharp) {   // sharp: only the sharpness changed (N240: a lens you set stays)
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (!started) { start(); return; }
  // v14.1: while you drag, the picture renders at a lower resolution; it sharpens again as soon as you stop
  gl.setPixelRatio(lowRes && !dragLite() ? (BIG_GPU ? Math.max(0.75, fullRatio() * 0.6) : Math.max(0.5, fullRatio() * 0.5)) : fullRatio());   // N240: a card measured slow a little less soft   // V2.64: a phone in HD keeps its sharpness (aoLive)
  gl.setSize(w, h, false);
  if (sharp === true) { dirty(); return; }
  camera.aspect = w / h; if (!GS.tween) camera.fov = fitFov(GS.baseFov); applyShift(); dirty();
}
/* v26: with the Tools panel open, the room slides into the space beside it (laptop: left of the panel; phone: above it, half way) */
const shift = { x: 0, y: 0 }; let cover = null;   // cover: the open panel's box, so stickers under it hide
function applyShift() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w && h && (shift.x || shift.y)) camera.setViewOffset(w, h, shift.x, shift.y, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
let railR = 0;   // the right edge of the page's section rail (laptop), so stickers stay clear of it
function measureShift(open) {
  const p = document.getElementById("r3d-panel"), w = canvas.clientWidth, h = canvas.clientHeight, rail = document.querySelector(".rail");
  railR = rail && getComputedStyle(rail).display !== "none" ? rail.getBoundingClientRect().right + 6 : 0;
  shift.x = shift.y = 0; cover = null;
  if (open && p && !p.hidden && w) {
    const r = p.getBoundingClientRect(); cover = r;
    if (innerWidth >= 900) shift.x = Math.round(Math.max(0, w - r.left - railR) / 2);
    else shift.y = Math.round(Math.max(0, h - r.top) / 4);
  } else if (S.view === "house" && w) {   // V1.30 (U3): on a phone the house sits in the middle of the space under the buttons; V3.27: on a computer too (the rows are along the top since V2.76)
    let top = 0; for (const el of document.querySelectorAll(".r3d-mini > :not([hidden]), .brand, .r3d-gear")) { const r = el.getBoundingClientRect(); if (r.height) top = Math.max(top, r.bottom); }
    const dock = document.querySelector(".r3d-dock"), bot = dock ? dock.getBoundingClientRect().top : h;
    if (top > 0 && bot > top) shift.y = -Math.round(((top + bot) / 2 - h / 2) + (innerWidth >= 900 ? (bot - top) * 0.12 : 0));   // V3.27: a computer's house drawn above its aim (the roof under the rows): a little lower
  }
  applyShift(); dirty();
}
addEventListener("demma-tools", e => requestAnimationFrame(() => measureShift(!!e.detail)));
addEventListener("resize", () => measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())));
requestAnimationFrame(() => { measureShift(false); setLabels(labelsOn); });
new ResizeObserver(sizeRenderer).observe(canvas);
controls.addEventListener("start", () => { GS.moving = true; });
controls.addEventListener("end", () => { GS.moving = false; });
const LIVING = [];   // V1.31 (U4): from outside, the living room's furniture, lights and fittings are left out unless the eye is near its window
function livingFromOutside() {
  const k = camera.position.x + "," + camera.position.z + S.view + GS.hfloor + !GS.tween + !!R.HOUSE3;   // N322: only when the eye or the view moved
  if (k === livingFromOutside.k) return false; livingFromOutside.k = k;
  const x = -camera.position.x / M, z = camera.position.z / M, wx = (R.WINDOW_X[0] + R.WINDOW_X[1]) / 2;
  const want = !!R.HOUSE3 && S.view === "house" && GS.hfloor === "all" && !GS.tween && !(z < R.WINDOW_Z - 20 && Math.hypot(x - wx, z - R.WINDOW_Z) < 4000);   // V1.47, the client: "see in and out of the windows at all times": from anywhere behind the house (the garden is 25 m; was 14)
  if (want === GS.livOut) return false;
  GS.livOut = want;
  for (const o of LIVING) { if (o === view) continue; if (want) { o.userData.livWas = o.visible; o.visible = false; } else if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; } }
  if (!want) applyFloors();   // the floor or the room you've gone to hides what it hides (Lower, a room's own view) again
  reshadow(); return true;
}
function livShow() {   // V2.98 (N37): what's put away shown again for a moment (applyState sets what shows), then put back by livingFromOutside
  if (!GS.livOut) return false; GS.livOut = false; livingFromOutside.k = "";
  for (const o of LIVING) if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; }
  return true;
}
/* V1.35: where two room names would overlap on a phone, the smaller room's steps aside */
/* N322: the labels listed once a floor and view (not each frame), decluttered only when the camera or the screen changed */
const DCL = { key: "", L: [], cam: new THREE.Matrix4(), proj: new THREE.Matrix4(), wh: "" };
function declutter() {
  if (!houseG || !houseG.visible || !canvas.clientWidth) return;
  const key = S.view + GS.hfloor + GS.roomKey + GS.RMODE + labelsOn + houseG.children.length, wh = canvas.clientWidth + "x" + canvas.clientHeight;
  if (key !== DCL.key) { DCL.key = key; DCL.wh = ""; DCL.L = []; houseG.traverseVisible(o => { if (o.isSprite && o.userData.hlabel && o.userData.px) DCL.L.push(o); });
    DCL.L.sort((a, b) => (b.userData.area || 1e9) - (a.userData.area || 1e9)); }
  else if (wh === DCL.wh && DCL.cam.equals(camera.matrixWorld) && DCL.proj.equals(camera.projectionMatrix)) return;
  DCL.wh = wh; DCL.cam.copy(camera.matrixWorld); DCL.proj.copy(camera.projectionMatrix);
  const L = DCL.L; if (L.length < 2) return;
  const W = canvas.clientWidth, H = canvas.clientHeight, v = new THREE.Vector3(), kept = [];
  for (const s_ of L) {
    s_.getWorldPosition(v).project(camera); const [w, h] = s_.userData.px, x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
    const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2], hit = v.z > 1 || kept.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    s_.material.visible = !hit; if (!hit) kept.push(r);
  }
}
/* V3.41 (N93): the welcome card's slow turn draws at most 60 times a second at its 60 Hz speed, waits while the window is hidden and
   rests after a minute (on a 155 Hz screen it drew every frame through the composer) */
const SPIN = { t0: 0, at: 0 };
/* N321: the loop rests when nothing is due (no draw asked, no move, glide, walk, warm-up, upload or mirror step) and 2 s have passed:
   no frame asked each vsync for ever (battery, fans). dirty(), GS.need, a press, a key or the wheel wake it */
const LOOP = { raf: 0, busyT: 0, asleep: false, t: -1, on: false };   // on: from the first frame (20_5_go.js starts it)
function wake() { if (LOOP.raf || !LOOP.on) return; if (LOOP.asleep) { LOOP.asleep = false; frame.last = 0; mvLast = 0; } LOOP.raf = requestAnimationFrame(frame); }
{ let n = GS.need; Object.defineProperty(GS, "need", { get: () => n, set: v => { n = v; if (v > 0) wake(); } }); }
["pointerdown", "pointermove", "keydown", "keyup", "wheel", "touchstart"].forEach(t => addEventListener(t, e => { if (t !== "pointermove" || e.buttons) wake(); }, { passive: true, capture: true }));
addEventListener("visibilitychange", wake); addEventListener("focus", wake);
function busy(now) {   // something still due: keep asking for frames
  const shut = glLost || (document.body.classList.contains("sheet-open") && !SH && !GS.tween);
  if (GS.need > 0 && !shut || GS.tween || GS.moving || SH || controls.autoRotate || probe > 0 || lowRes || moveLite || shStag.left) return true;
  if (walking() && (WALK.v.lengthSq() > 1e-5 || WALK.keys.size)) return true;
  if (PRE.queue.length && LIVE || PRE.busy || WARMB || UPQ.length || upShade) return true;
  return now - LOOP.busyT < 2000;   // the pause the warm-up, the mirrors and the sharpness wait for
}
function frame(now) {
  if (now === LOOP.t) return; LOOP.t = now; LOOP.raf = 0; LOOP.on = true;   // one frame a vsync, whoever asked
  tick(now); if (frame.drawn === now) LOOP.busyT = now;
  if (!canvas.clientWidth) { LOOP.asleep = true; return; }   // the ResizeObserver wakes it
  if (busy(now)) wake(); else LOOP.asleep = !LOOP.raf;
}
function tick(now) {
  if (livingFromOutside()) GS.need = 2;
  if (!canvas.clientWidth) return;
  if (controls.autoRotate && (now - SPIN.t0 > 60000 || !document.hasFocus())) controls.autoRotate = false;   // at rest after a minute, or with the window behind another
  const spin = controls.autoRotate && !GS.moving && !GS.tween && !walking();
  if (spin && now - SPIN.at < 14.5) return; if (spin) SPIN.at = now;   // 60 a second at most (the frames between skipped whole: no update, no draw)
  if (GS.tween) {
    const k = Math.min(1, (now - GS.tween.t0) / (GS.tween.dur || 900)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(GS.tween.from.eye, GS.tween.to.eye, e);
    controls.target.lerpVectors(GS.tween.from.at, GS.tween.to.at, e);
    camera.fov = GS.tween.from.fov + (GS.tween.to.fov - GS.tween.from.fov) * e; camera.updateProjectionMatrix();
    if (k >= 1) { GS.tween = null; if (S.cam === "look") seatLook(); syncEye(); }   // v31: looking round, the turning point comes back in front of you
    GS.need = 2;
  }
  const gap = (now - (frame.last || now)) / 1000, dt = Math.min(0.1, gap); frame.last = now;
  controls.dampingFactor = 1 - Math.pow(1 - DAMP, Math.max(dt, 1 / 240) * 60);   // V2.60: the glide eases the same fifth each 60th of a second, at any frame rate
  const changed = controls.update(spin ? dt : null);   // V3.41: the turn by the time passed (three's own is a step a frame)
  if (changed) { GS.need = 2; lostCheck(); }
  if (cabTween(now)) GS.need = 2;                                    // v30: the cabinet's doors swinging or sliding
  if (liftTick(now)) GS.need = 2;                                    // v68: Lift the bed
  if (showTick(now)) GS.need = 2;                                    // v32: "Watch it open"
  const walked = walkSteps(Math.min(0.25, gap)) | lookTick(dt); if (walked) { GS.need = 2; syncEye(); }   // V3.28: and a mouse's look round, let out frame by frame   // V1.32 (U7)   // V2.30: dt to 100 ms (it held each step to 50: a slow frame slowed the walk)
  if (!GS.tween && !freeAbove() && !walking() && (clampRoom(camera.position) | clampRoom(controls.target, true) | collide())) GS.need = 2;   // v17: never outside the room; v41: nor in the furniture
  const active = GS.moving || changed || !!GS.tween || walked;   // V2.73 (N17): a walk too
  if (active) LOOP.busyT = now;
  if (active && mvLast && now - mvLast < 1000) { const g_ = now - mvLast; if (now - (FT.worstT || 0) > 3000 || g_ >= (FT.worst || 0)) { FT.worst = g_; FT.worstT = now; } }   // V3.29: the longest gap while moving (the last 3 s), for ?perf
  if (active && mvLast && now - mvLast < 250) { MV.push(now - mvLast); if (MV.length >= 24) { const m = MV.sort((a, b) => a - b)[12]; MV.length = 0; FT.mv = m;
    if (m > 50 && !SMALL) tooSlow();   // N296: a PC walking at under 20 a second in HD: Fast
    if (m > 28) slowDev = true; else if (m < 14 && !lowRes && HI) slowDev = false;   // N240: a real card too (it never stepped down: a slow frame stayed slow)
    if (PHONE_HD && lowRes && m > 24 && phoneCap > 1.5) capDue = true;   // V2.73 (N17): still slow with the lighter drawing
    if (m > 40 && !BIG_GPU && !houseLite && S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view)) { houseLite = true; sizeRenderer(); toast("A lighter drawing for the house on this computer"); } } }
  mvLast = active ? now : 0;
  // v35: lower resolution only while a drag on a slow device has lasted a moment (each switch is a new drawing buffer)
  const go = GS.moving || (walked && (dragLite() || BIG_GPU));   // N240: a PC's walk and mouse look too, when slow   // V2.73 (N17): a phone's walk draws without the shade and glow as a drag does; past 24 ms a frame it drops to 1.5× once, while still
  if (go && slowDev) { if (!dragT) dragT = now; still_t = now; if (!lowRes && now - dragT > 150) { lowRes = true; dragLite() ? dirty() : sizeRenderer(true); } }
  else { dragT = 0; if (active) still_t = now; else if (lowRes && now - still_t > 250) { lowRes = false; if (capDue) { capDue = false; phoneCap = 1.5; sizeRenderer(); } else dragLite() ? dirty() : sizeRenderer(true); } }
  /* V3.54 (N106): an iPhone in HD leaves out the shade and glow while it moves too (the same shaders), back a quarter second after */
  if (MOVE_LITE && (BIG_GPU || PHONE_HD)) { if (active || walking() && (WALK.v.lengthSq() > 1e-5 || WALK.keys.size)) { if (!moveLite) moveLite = true; } else if (moveLite && now - still_t > 250) { moveLite = false; GS.need = Math.max(GS.need, 1); } }   // V3.39 (N91)
  if (updateCut()) GS.need = 2;
  upStep(now, active || walking());                                // V2.64: the photos onto the graphics chip a few at a time
  if (probe > 0 && !lowRes) GS.need = Math.max(GS.need, 1);                 // v35: the speed check's three frames come first, at the start
  if (GS.need === 0 && !active && !SH && probe === 0 && now - preT > 120 && now - PRE.idleT > 400) {   // v35: hidden parts' shaders, off screen
    if (mirrorStep()) GS.need = Math.max(GS.need, 1);   // V3.57 (N107): a mirror's room, a face a still frame
    else if (PARALLEL()) { if (!WARMB && now - PRE.idleT > 400 && !warmSwitch()) precompileBatch(); }   // V3.23: rooms first, then the hidden parts, built beside the page
    else { const t0 = performance.now(); while (precompileStep() && performance.now() - t0 < 10) {} if (!PRE.queue.length && now - PRE.idleT > 1500) warmSwitch(); }
    preT = now; }   // V2.42: a room's visit only after a real pause   // v39: as many as fit in 10 ms, sooner
  if (glLost || (document.body.classList.contains("sheet-open") && !SH && !GS.tween)) return;   // v35: nothing drawn behind the Plan's sheets (the last picture stays)
  if (GS.need > 0 && !(probe > 0) && now - (frame.drawn || 0) < (slowDev && !SMALL ? 30 : BIG_GPU ? 12 : 0)) return;   // N296: a slow computer at most about 33 a second (it ran flat out, fans loud)   // N296: at most about 72 pictures a second on a fast screen (144 Hz drew 144, the card flat out)
  if (GS.need > 0) {
    frame.drawn = now;
    const t = probe > 0 && !lowRes ? performance.now() : 0;
    const f0 = performance.now(); syncRig(); declutter(); const shq = shStag(active || walking() && (WALK.v.lengthSq() > 1e-5 || WALK.keys.size > 0)); try { draw(); } finally { shStagEnd(shq); } if (!START_MS.firstAt) { START_MS.firstAt = Math.round(performance.now()); START_MS.firstMs = Math.round(performance.now() - f0); dispatchEvent(new Event("r3d-first")); } FT.calls = gl.info.render.calls; FT.tris = gl.info.render.triangles; GS.need--; placeStickers(); FT[FT.n++ % 60] = performance.now() - f0;   // V2.66 (N13): r3d-first, the first picture (the landing's first screen goes)
    if (t) { const c = gl.getContext(); c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, PX); probeT.push(performance.now() - t); probe--; if (!probe) autoQuality(); }
  }
}
/* N240: the walk by the time passed, to a quarter second, in steps of a 20th (at 140 cm a second × the frame's time held to 0.1 s, a
   frame rate under ten walked slower than you meant; each step collides on its own, so a long frame never goes through a wall) */
function walkSteps(t) { let w = false; do { const s = Math.min(t, 0.05); w = walkTick(s) || w; t -= s; } while (t > 1e-4); return w; }
const SH_STAG = SMALL && !BIG_GPU && !/[?&]fullmove\b/.test(location.search);   // V3.56 (N122): on a phone, while moving, the shadows are redrawn a light a frame (a doorway frame 876 draws to 626); still, all at once
function shStag(moving_) {   // the lights left out this frame (their autoUpdate off for the one draw), or null
  const sm = gl.shadowMap, req = sm.needsUpdate; if (!SH_STAG || !sm.enabled) return null;
  if (!moving_ || !(req || shStag.left)) { if (shStag.left) { shStag.left = null; sm.needsUpdate = true; } return null; }   // still: the rest at once
  const vk = S.view + GS.hfloor + GS.hereRoom + S.quality;   // N322: the shadow lights listed once a view, again when a redraw is asked (a door, a light)
  if (req || vk !== shStag.vk || !shStag.ls) { shStag.vk = vk; shStag.ls = []; scene.traverseVisible(o => { if (o.isLight && o.castShadow && o.shadow && o.shadow.autoUpdate) shStag.ls.push(o); }); }
  const ls = shStag.ls.filter(l => l.parent && l.visible);
  if (ls.length < 2) { shStag.left = null; return null; }
  if (req || !shStag.left) shStag.left = new Set(ls);   // a new redraw asked (a door, a light): every light again
  const pick = ls.find(l => shStag.left.has(l)) || ls[0]; shStag.left.delete(pick); if (!shStag.left.size) shStag.left = null;
  for (const l of ls) if (l !== pick) l.shadow.autoUpdate = false;
  sm.needsUpdate = true; return ls;
}
function shStagEnd(ls) {
  if (!ls) return;
  for (const l of ls) l.shadow.autoUpdate = true;
  if (shStag.left) GS.need = Math.max(GS.need, 2);   // the next light next frame (2: this frame's own need-- follows)
}
let probe = 3; const probeT = [], PX = new Uint8Array(4);   // v14.1: if this device takes too long over a full HD frame, drop to Fast (unless you picked a quality yourself)
let preT = 0;
const FT = []; FT.n = 0;   // v35: the last 60 frames' times, for R3D.perf()
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[s.length >> 1].toFixed(1) : null; };
// V3.04 (N50): the graphics chip's family only ("RTX 5070", "Apple GPU"), never the driver's whole string
const gpuClass = () => MASKED ? "hidden" : (GPU.match(/[rg]tx\s?\d{3,4}\w*|radeon[^,()]*?\d{3,4}\w*|apple (gpu|m\d\w*)|adreno\D{0,4}\d{3}|mali-\w+|immortalis-\w+|xclipse \d+|intel[^,()]*?(arc|iris|uhd)\s?\w*|swiftshader|llvmpipe/i) || ["other"])[0];
function perfInfo() {   // v35: the counts to watch each round (R3D.perf())
  const i = gl.info, ls = [];
  scene.traverseVisible(o => { if (o.isLight) ls.push(o); });
  return { calls: FT.calls, triangles: FT.tris, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length,
    lights: ls.length, shadows: ls.filter(l => l.castShadow).length, quality: S.quality, ratio: gl.getPixelRatio(), frameMs: med(FT),
    warm: PRE.queue.length, errors: store.get("r3d-errors", []).length, caught: CAUGHT.n, caughtAt: CAUGHT.at.join(" "), gpu: GPU.slice(0, 80), bigGpu: BIG_GPU, ao: aoLive(), goodPhone: GOOD_PHONE, slowDev,   // v39: which graphics card, and whether it starts in HD
    gpuClass: gpuClass(), phone: SMALL, version: R.VERSION || "", moveMs: FT.mv ? +FT.mv.toFixed(1) : null, worstMs: FT.worst ? Math.round(FT.worst) : null, stillMs: med(probeT), view: S.view };   // V3.04 (N50): a frame while moving (24 frames' middle), a whole still frame (the start's check), for Send
}
if (/[?&]perf\b/.test(location.search)) {   // v35: ?perf shows the counts in a corner   // V3.04 (N50): in fewer words; Measure's Send carries them too
  const box = document.createElement("div"); box.className = "r3d-perf";
  box.style.cssText = "position:absolute;left:8px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:30;padding:6px 9px;border-radius:10px;background:rgba(0,0,0,.72);color:#fff;font:12px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre";
  const txt = document.createElement("div"), cp = document.createElement("button");   // N296 (Emma, 27 Nov: "make this copy pastable"): Copy, one line to paste
  cp.type = "button"; cp.textContent = "Copy"; cp.style.cssText = "pointer-events:auto;margin-top:4px;font:inherit;padding:2px 10px;border-radius:8px;border:0;background:#fff;color:#000;cursor:pointer";
  cp.addEventListener("click", () => { const p = perfInfo(), e = store.get("r3d-errors", []).slice(-3).map(x => String(x && (x.msg || x.message || x)).slice(0, 120));
    const line = `${p.version} ${p.quality} ${p.view} · moving ${p.moveMs ?? "-"} ms · worst ${p.worstMs ?? "-"} ms · still ${p.stillMs ?? "-"} ms · ${p.calls} draws · ${p.programs} shaders · ${p.lights} lights · ratio ${+p.ratio.toFixed(2)} · ${canvas.clientWidth}x${canvas.clientHeight} @${window.devicePixelRatio || 1} · slow ${p.slowDev} · ${GPU.slice(0, 120)}${p.caught ? ` · caught ${p.caught} (${p.caughtAt})` : ""}${e.length ? " · errors: " + e.join(" | ") : ""}`;
    const done = () => { cp.textContent = "Copied"; setTimeout(() => (cp.textContent = "Copy"), 1500); };
    (navigator.clipboard ? navigator.clipboard.writeText(line) : Promise.reject()).then(done, () => { prompt("Copy this", line); }); });
  box.append(txt, cp); root.append(box);
  setInterval(() => { if (!gl || !started) return; const p = perfInfo(), ms = v => v == null ? "–" : v + " ms";
    txt.textContent = `${p.quality.toUpperCase()} · moving ${ms(p.moveMs)} · worst ${ms(p.worstMs)} · still ${ms(p.stillMs)}\n${p.gpuClass} · ${+p.ratio.toFixed(2)}×${lowRes ? " (lower while moving)" : ""} · ${p.calls} draws · ${p.programs} shaders${p.errors ? " · " + p.errors + " errors" : ""}`; }, 1000);   // V3.29: the chip, the sharpness, the worst gap
}
let hdNo = false;
function tooSlow() {   // N296: HD stepped down to Fast for this visit, with why
  if (S.quality !== "hd" || hdNo || /[?&]hd\b/.test(location.search)) return false;
  hdNo = true; S.quality = "fast"; S.picked = false; applyLight(); syncButtons(); probe = 3; probeT.length = 0;
  const soft = /swiftshader|llvmpipe|software|basic render|microsoft/i.test(GPU);
  toast(soft || !BIG_GPU ? "Fast on this computer: the browser isn't using the graphics card (turn on graphics acceleration in its settings)" : "Fast on this computer: HD drew too slowly");
  return true;
}
function autoQuality() {
  const ms = probeT.sort((a, b) => a - b)[1];
  if (S.quality === "fast") slowDev = ms > 30;
  if (S.quality === "hd" && GOOD_PHONE && !BIG_GPU) {   // V1.1: the shade and glow on a quick phone (also when you picked HD), measured again with them on
    if (ms > 30 && phoneCap > 2) { phoneCap = 2; sizeRenderer(); dirty(); probe = 3; probeT.length = 0; return; }   // V1.11: sharpness gives way first
    if (phoneAO && ms > 30) { phoneAO = false; phoneAOoff = true; dirty(); return; }
    if (!phoneAO && !phoneAOoff && ms < 14) { phoneAO = true; dirty(); probe = 3; probeT.length = 0; return; }
  }
  /* N296 (Emma, 27 Nov: the PC "still 218.7 ms", the fans loud): a whole still picture over 100 ms is Fast on any device, HD picked or not
     (a real card at that speed is the browser drawing without it); ?hd keeps HD */
  if (ms > 100 && tooSlow()) return;
  if (S.picked) return;
  if (S.quality === "fast" && !hdNo && (!SMALL || GOOD_PHONE) && ms < (SMALL ? 18 : 20)) {   // v35: quick in Fast: on to HD, once, while the room is still (v39: capable phones too)
    S.quality = "hd"; applyLight(); syncButtons(); probe = 3; probeT.length = 0;
  } else if (ms > (SMALL ? 45 : 70) && S.quality === "hd" && !BIG_GPU) {   // v39: a phone goes back sooner
    S.quality = "fast"; applyLight(); syncButtons();
    qs("#r3d-savest").textContent = "Switched to Fast for this device; pick HD for shadows (saved pictures always have them).";
  }
}

