/* ---------------------------------------------------------------- render loop, only when something changed */
let need = 2, moving = false, still_t = 0, lowRes = false, dragT = 0, slowDev = !HI, capDue = false;   // v35: slowDev until the speed check says otherwise (v39: not on a real graphics card)
const MV = []; let mvLast = 0;   // v39: the gaps between frames while the room moves: slow ones turn on the lower resolution while you drag
function dirty() { need = Math.max(need, 2); }
function fullRatio() { const d = window.devicePixelRatio || 1; if (SMALL && !BIG_GPU) return Math.min(d, GOOD_PHONE ? phoneCap : 1.5); if (S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view) && !BIG_GPU) return houseLite ? 1 : Math.min(d, 1.5);   // V2.25: a real card draws the house as sharp as a room   // V1.11: a real graphics card draws the house at 2× too   // v73: the house at the screen's own sharpness (no supersampling: it's many times the living room's drawing)
  return S.quality === "hd" ? (BIG_GPU ? Math.min(d, 2) : Math.min(d, 1.5)) : Math.min(d, 1); }   // V2.30: a real card at the screen's own sharpness, as a game (4× anti-aliasing smooths the edges; it drew 1.5× on top: 2.25 times the pixels)   // v39: phones at their own sharpness; v44: a real graphics card draws HD at 1.5–2×; v50: Fast on a PC at full size (was 0.85×)
let baseFov = 50;   // v21: narrower screens (phones show the room at 4:3) widen the field of view so every view takes in as much of the room across as at 16:9
const fitFov = (fov, asp = camera.aspect) => asp >= 16 / 9 ? fov : Math.min(95, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * (asp < 0.8 ? 1.45 : 16 / 9) / asp) * 180 / Math.PI);   // v33: portrait, tighter
function sizeRenderer() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (!started) { start(); return; }
  // v14.1: while you drag, the picture renders at a lower resolution; it sharpens again as soon as you stop
  gl.setPixelRatio(lowRes && !dragLite() ? Math.max(0.5, fullRatio() * 0.5) : fullRatio());   // V2.64: a phone in HD keeps its sharpness (aoLive)
  gl.setSize(w, h, false);
  camera.aspect = w / h; if (!tween) camera.fov = fitFov(baseFov); applyShift(); dirty();
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
    let top = 0; for (const el of document.querySelectorAll(".r3d-mini > :not([hidden]), .brand")) { const r = el.getBoundingClientRect(); if (r.height) top = Math.max(top, r.bottom); }
    const dock = document.querySelector(".r3d-dock"), bot = dock ? dock.getBoundingClientRect().top : h;
    if (top > 0 && bot > top) shift.y = -Math.round(((top + bot) / 2 - h / 2) + (innerWidth >= 900 ? (bot - top) * 0.12 : 0));   // V3.27: a computer's house drawn above its aim (the roof under the rows): a little lower
  }
  applyShift(); dirty();
}
addEventListener("demma-tools", e => requestAnimationFrame(() => measureShift(!!e.detail)));
addEventListener("resize", () => measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())));
requestAnimationFrame(() => { measureShift(false); setLabels(labelsOn); });
new ResizeObserver(sizeRenderer).observe(canvas);
controls.addEventListener("start", () => { moving = true; });
controls.addEventListener("end", () => { moving = false; });
const LIVING = []; let livOut = false;   // V1.31 (U4): from outside, the living room's furniture, lights and fittings are left out unless the eye is near its window
function livingFromOutside() {
  const x = -camera.position.x / M, z = camera.position.z / M, wx = (R.WINDOW_X[0] + R.WINDOW_X[1]) / 2;
  const want = !!R.HOUSE3 && S.view === "house" && hfloor === "all" && !tween && !(z < R.WINDOW_Z - 20 && Math.hypot(x - wx, z - R.WINDOW_Z) < 4000);   // V1.47, the client: "see in and out of the windows at all times": from anywhere behind the house (the garden is 25 m; was 14)
  if (want === livOut) return false;
  livOut = want;
  for (const o of LIVING) { if (o === view) continue; if (want) { o.userData.livWas = o.visible; o.visible = false; } else if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; } }
  if (!want) applyFloors();   // the floor or the room you've gone to hides what it hides (Lower, a room's own view) again
  reshadow(); return true;
}
function livShow() {   // V2.98 (N37): what's put away shown again for a moment (applyState sets what shows), then put back by livingFromOutside
  if (!livOut) return false; livOut = false;
  for (const o of LIVING) if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; }
  return true;
}
/* V1.35: where two room names would overlap on a phone, the smaller room's steps aside */
function declutter() {
  if (!houseG || !houseG.visible || !canvas.clientWidth) return;
  const L = []; houseG.traverseVisible(o => { if (o.isSprite && o.userData.hlabel && o.userData.px) L.push(o); });
  if (L.length < 2) return;
  const W = canvas.clientWidth, H = canvas.clientHeight, v = new THREE.Vector3(), kept = [];
  L.sort((a, b) => (b.userData.area || 1e9) - (a.userData.area || 1e9));
  for (const s_ of L) {
    s_.getWorldPosition(v).project(camera); const [w, h] = s_.userData.px, x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
    const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2], hit = v.z > 1 || kept.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    s_.material.visible = !hit; if (!hit) kept.push(r);
  }
}
/* V3.41 (N93): the welcome card's slow turn draws at most 60 times a second at its 60 Hz speed, waits while the window is hidden and
   rests after a minute (on a 155 Hz screen it drew every frame through the composer) */
const SPIN = { t0: 0, at: 0 };
function frame(now) {
  requestAnimationFrame(frame);
  if (livingFromOutside()) need = 2;
  if (!canvas.clientWidth) return;
  if (controls.autoRotate && (now - SPIN.t0 > 60000 || !document.hasFocus())) controls.autoRotate = false;   // at rest after a minute, or with the window behind another
  const spin = controls.autoRotate && !moving && !tween && !walking();
  if (spin && now - SPIN.at < 14.5) return; if (spin) SPIN.at = now;   // 60 a second at most (the frames between skipped whole: no update, no draw)
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / (tween.dur || 900)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(tween.from.eye, tween.to.eye, e);
    controls.target.lerpVectors(tween.from.at, tween.to.at, e);
    camera.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * e; camera.updateProjectionMatrix();
    if (k >= 1) { tween = null; if (S.cam === "look") seatLook(); syncEye(); }   // v31: looking round, the turning point comes back in front of you
    need = 2;
  }
  const dt = Math.min(0.1, (now - (frame.last || now)) / 1000); frame.last = now;
  controls.dampingFactor = 1 - Math.pow(1 - DAMP, Math.max(dt, 1 / 240) * 60);   // V2.60: the glide eases the same fifth each 60th of a second, at any frame rate
  const changed = controls.update(spin ? dt : null);   // V3.41: the turn by the time passed (three's own is a step a frame)
  if (changed) { need = 2; lostCheck(); }
  if (cabTween(now)) need = 2;                                    // v30: the cabinet's doors swinging or sliding
  if (liftTick(now)) need = 2;                                    // v68: Lift the bed
  if (showTick(now)) need = 2;                                    // v32: "Watch it open"
  const walked = walkTick(dt) | lookTick(dt); if (walked) { need = 2; syncEye(); }   // V3.28: and a mouse's look round, let out frame by frame   // V1.32 (U7)   // V2.30: dt to 100 ms (it held each step to 50: a slow frame slowed the walk)
  if (!tween && !freeAbove() && !walking() && (clampRoom(camera.position) | clampRoom(controls.target, true) | collide())) need = 2;   // v17: never outside the room; v41: nor in the furniture
  const active = moving || changed || !!tween || walked;   // V2.73 (N17): a walk too
  if (active && mvLast && now - mvLast < 1000) { const g_ = now - mvLast; if (now - (FT.worstT || 0) > 3000 || g_ >= (FT.worst || 0)) { FT.worst = g_; FT.worstT = now; } }   // V3.29: the longest gap while moving (the last 3 s), for ?perf
  if (active && mvLast && now - mvLast < 250) { MV.push(now - mvLast); if (MV.length >= 24) { const m = MV.sort((a, b) => a - b)[12]; MV.length = 0; FT.mv = m;
    if (m > 28 && (!BIG_GPU || MASKED)) slowDev = true; else if (m < 14 && !lowRes && HI) slowDev = false;
    if (PHONE_HD && lowRes && m > 24 && phoneCap > 1.5) capDue = true;   // V2.73 (N17): still slow with the lighter drawing
    if (m > 40 && !BIG_GPU && !houseLite && S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view)) { houseLite = true; sizeRenderer(); toast("A lighter drawing for the house on this computer"); } } }
  mvLast = active ? now : 0;
  // v35: lower resolution only while a drag on a slow device has lasted a moment (each switch is a new drawing buffer)
  const go = moving || (walked && dragLite());   // V2.73 (N17): a phone's walk draws without the shade and glow as a drag does; past 24 ms a frame it drops to 1.5× once, while still
  if (go && slowDev) { if (!dragT) dragT = now; still_t = now; if (!lowRes && now - dragT > 150) { lowRes = true; dragLite() ? dirty() : sizeRenderer(); } }
  else { dragT = 0; if (active) still_t = now; else if (lowRes && now - still_t > 250) { lowRes = false; if (capDue) { capDue = false; phoneCap = 1.5; sizeRenderer(); } else dragLite() ? dirty() : sizeRenderer(); } }
  /* V3.54 (N106): an iPhone in HD leaves out the shade and glow while it moves too (the same shaders), back a quarter second after */
  if (MOVE_LITE && (BIG_GPU || PHONE_HD)) { if (active || walking() && (WALK.v.lengthSq() > 1e-5 || WALK.keys.size)) { if (!moveLite) moveLite = true; } else if (moveLite && now - still_t > 250) { moveLite = false; need = Math.max(need, 1); } }   // V3.39 (N91)
  if (updateCut()) need = 2;
  upStep(now, active || walking());                                // V2.64: the photos onto the graphics chip a few at a time
  if (probe > 0 && !lowRes) need = Math.max(need, 1);                 // v35: the speed check's three frames come first, at the start
  if (need === 0 && !active && !SH && probe === 0 && now - preT > 120 && now - PRE.idleT > 400) {   // v35: hidden parts' shaders, off screen
    if (mirrorStep()) need = Math.max(need, 1);   // V3.57 (N107): a mirror's room, a face a still frame
    else if (PARALLEL()) { if (!WARMB && now - PRE.idleT > 400 && !warmSwitch()) precompileBatch(); }   // V3.23: rooms first, then the hidden parts, built beside the page
    else { const t0 = performance.now(); while (precompileStep() && performance.now() - t0 < 10) {} if (!PRE.queue.length && now - PRE.idleT > 1500) warmSwitch(); }
    preT = now; }   // V2.42: a room's visit only after a real pause   // v39: as many as fit in 10 ms, sooner
  if (glLost || (document.body.classList.contains("sheet-open") && !SH && !tween)) return;   // v35: nothing drawn behind the Plan's sheets (the last picture stays)
  if (need > 0) {
    const t = probe > 0 && !lowRes ? performance.now() : 0;
    const f0 = performance.now(); syncRig(); declutter(); const shq = shStag(active || walking() && (WALK.v.lengthSq() > 1e-5 || WALK.keys.size > 0)); try { draw(); } finally { shStagEnd(shq); } if (!START_MS.firstAt) { START_MS.firstAt = Math.round(performance.now()); START_MS.firstMs = Math.round(performance.now() - f0); dispatchEvent(new Event("r3d-first")); } FT.calls = gl.info.render.calls; FT.tris = gl.info.render.triangles; need--; placeStickers(); FT[FT.n++ % 60] = performance.now() - f0;   // V2.66 (N13): r3d-first, the first picture (the landing's first screen goes)
    if (t) { const c = gl.getContext(); c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, PX); probeT.push(performance.now() - t); probe--; if (!probe) autoQuality(); }
  }
}
const SH_STAG = SMALL && !BIG_GPU && !/[?&]fullmove\b/.test(location.search);   // V3.56 (N122): on a phone, while moving, the shadows are redrawn a light a frame (a doorway frame 876 draws to 626); still, all at once
function shStag(moving_) {   // the lights left out this frame (their autoUpdate off for the one draw), or null
  const sm = gl.shadowMap, req = sm.needsUpdate; if (!SH_STAG || !sm.enabled) return null;
  if (!moving_ || !(req || shStag.left)) { if (shStag.left) { shStag.left = null; sm.needsUpdate = true; } return null; }   // still: the rest at once
  const ls = []; scene.traverseVisible(o => { if (o.isLight && o.castShadow && o.shadow && o.shadow.autoUpdate) ls.push(o); });
  if (ls.length < 2) { shStag.left = null; return null; }
  if (req || !shStag.left) shStag.left = new Set(ls);   // a new redraw asked (a door, a light): every light again
  const pick = ls.find(l => shStag.left.has(l)) || ls[0]; shStag.left.delete(pick); if (!shStag.left.size) shStag.left = null;
  for (const l of ls) if (l !== pick) l.shadow.autoUpdate = false;
  sm.needsUpdate = true; return ls;
}
function shStagEnd(ls) {
  if (!ls) return;
  for (const l of ls) l.shadow.autoUpdate = true;
  if (shStag.left) need = Math.max(need, 2);   // the next light next frame (2: this frame's own need-- follows)
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
    warm: PRE.queue.length, errors: store.get("r3d-errors", []).length, gpu: GPU.slice(0, 80), bigGpu: BIG_GPU, ao: aoLive(), goodPhone: GOOD_PHONE, slowDev,   // v39: which graphics card, and whether it starts in HD
    gpuClass: gpuClass(), phone: SMALL, version: R.VERSION || "", moveMs: FT.mv ? +FT.mv.toFixed(1) : null, worstMs: FT.worst ? Math.round(FT.worst) : null, stillMs: med(probeT), view: S.view };   // V3.04 (N50): a frame while moving (24 frames' middle), a whole still frame (the start's check), for Send
}
if (/[?&]perf\b/.test(location.search)) {   // v35: ?perf shows the counts in a corner   // V3.04 (N50): in fewer words; Measure's Send carries them too
  const box = document.createElement("div"); box.className = "r3d-perf";
  box.style.cssText = "position:absolute;left:8px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:30;padding:6px 9px;border-radius:10px;background:rgba(0,0,0,.72);color:#fff;font:12px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre";
  root.append(box);
  setInterval(() => { if (!gl || !started) return; const p = perfInfo(), ms = v => v == null ? "–" : v + " ms";
    box.textContent = `${p.quality.toUpperCase()} · moving ${ms(p.moveMs)} · worst ${ms(p.worstMs)} · still ${ms(p.stillMs)}\n${p.gpuClass} · ${+p.ratio.toFixed(2)}×${lowRes ? " (lower while moving)" : ""} · ${p.calls} draws · ${p.programs} shaders${p.errors ? " · " + p.errors + " errors" : ""}`; }, 1000);   // V3.29: the chip, the sharpness, the worst gap
}
function autoQuality() {
  const ms = probeT.sort((a, b) => a - b)[1];
  if (S.quality === "fast") slowDev = ms > 30;
  if (S.quality === "hd" && GOOD_PHONE && !BIG_GPU) {   // V1.1: the shade and glow on a quick phone (also when you picked HD), measured again with them on
    if (ms > 30 && phoneCap > 2) { phoneCap = 2; sizeRenderer(); dirty(); probe = 3; probeT.length = 0; return; }   // V1.11: sharpness gives way first
    if (phoneAO && ms > 30) { phoneAO = false; phoneAOoff = true; dirty(); return; }
    if (!phoneAO && !phoneAOoff && ms < 14) { phoneAO = true; dirty(); probe = 3; probeT.length = 0; return; }
  }
  if (S.picked) return;
  if (S.quality === "fast" && (!SMALL || GOOD_PHONE) && ms < (SMALL ? 18 : 20)) {   // v35: quick in Fast: on to HD, once, while the room is still (v39: capable phones too)
    S.quality = "hd"; applyLight(); syncButtons(); probe = 3; probeT.length = 0;
  } else if (ms > (SMALL ? 45 : 70) && S.quality === "hd" && !BIG_GPU) {   // v39: a phone goes back sooner
    S.quality = "fast"; applyLight(); syncButtons();
    qs("#r3d-savest").textContent = "Switched to Fast for this device; pick HD for shadows (saved pictures always have them).";
  }
}

