/* ---------------------------------------------------------------- render loop, only when something changed */
let need = 2, moving = false, still_t = 0, lowRes = false, dragT = 0, slowDev = !HI, capDue = false;   // v35: slowDev until the speed check says otherwise (v39: not on a real graphics card)
const MV = []; let mvLast = 0;   // v39: the gaps between frames while the room moves: slow ones turn on the lower resolution while you drag
function dirty() { need = Math.max(need, 2); }
function fullRatio() { const d = window.devicePixelRatio || 1; if (SMALL && !BIG_GPU) return Math.min(d, GOOD_PHONE ? phoneCap : 1.5); if (S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view) && !BIG_GPU) return houseLite ? 1 : Math.min(d, 1.5);   // V2.25: a real card draws the house as sharp as a room   // V1.11: a real graphics card draws the house at 2× too   // v73: the house at the screen's own sharpness (no supersampling: it's many times the living room's drawing)
  return S.quality === "hd" ? (BIG_GPU ? Math.min(d, 2) : Math.min(d, 1.5)) : Math.min(d, 1); }   // V2.30: a real card at the screen's own sharpness, as a game (4× anti-aliasing smooths the edges; it drew 1.5× on top: 2.25 times the pixels)   // v39: phones at their own sharpness; v44: a real graphics card draws HD at 1.5–2×; v50: Fast on a PC at full size (was 0.85×)
/* v21: narrower screens (phones show the room at 4:3) widen the field of view so every view takes in as much of the room across as at 16:9 */
let baseFov = 50;
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
  } else if (S.view === "house" && innerWidth < 600 && w) {   // V1.30 (U3): on a phone the house sits in the middle of the space under the buttons
    let top = 0; for (const el of document.querySelectorAll(".r3d-mini > :not([hidden]), .brand")) { const r = el.getBoundingClientRect(); if (r.height) top = Math.max(top, r.bottom); }
    const dock = document.querySelector(".r3d-dock"), bot = dock ? dock.getBoundingClientRect().top : h;
    if (top > 0 && bot > top) shift.y = -Math.round(((top + bot) / 2 - h / 2));
  } else if (S.view === "house" && innerWidth >= 900 && w) {   // V2.46: on a computer the house sits left of the floors' and rooms' rows (their labels were under them)
    let left = w; for (const el of document.querySelectorAll("#r3d-floors:not([hidden]), #r3d-hrooms:not([hidden])")) { const r = el.getBoundingClientRect(); if (r.width) left = Math.min(left, r.left); }
    shift.x = Math.round(Math.max(0, w - left - 16) / 4);   // a quarter: half the rows' width, so the floor still fits
  }
  applyShift(); dirty();
}
addEventListener("demma-tools", e => requestAnimationFrame(() => measureShift(!!e.detail)));
addEventListener("resize", () => measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())));
requestAnimationFrame(() => { measureShift(false); setLabels(labelsOn); });
new ResizeObserver(sizeRenderer).observe(canvas);
controls.addEventListener("start", () => { moving = true; });
controls.addEventListener("end", () => { moving = false; });
/* V1.31 (U4): from outside (The whole house, Outside) the living room's furniture, lights and fittings were drawn behind the house's
   walls: about 440 of 659 draws. They're left out unless the eye is near its window at the back, where you can see in */
const LIVING = []; let livOut = false;
function livingFromOutside() {
  const x = -camera.position.x / M, z = camera.position.z / M, wx = (R.WINDOW_X[0] + R.WINDOW_X[1]) / 2;
  const want = !!R.HOUSE3 && S.view === "house" && hfloor === "all" && !tween && !(z < R.WINDOW_Z - 20 && Math.hypot(x - wx, z - R.WINDOW_Z) < 4000);   // V1.47, the client: "see in and out of the windows at all times": from anywhere behind the house (the garden is 25 m; was 14)
  if (want === livOut) return false;
  livOut = want;
  for (const o of LIVING) { if (o === view) continue; if (want) { o.userData.livWas = o.visible; o.visible = false; } else if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; } }
  if (!want) applyFloors();   // the floor or the room you've gone to hides what it hides (Lower, a room's own view) again
  reshadow(); return true;
}
function livShow() {   // V2.97 (N37): what's put away shown again for a moment (applyState sets what shows), then put back by livingFromOutside
  if (!livOut) return false; livOut = false;
  for (const o of LIVING) if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; }
  return true;
}
/* V1.35, found in V1.30: on a phone a floor's room names overlapped (the landing's and the boiler cupboard's). Where two would, the
   smaller room's steps aside until there's room again */
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
function frame(now) {
  requestAnimationFrame(frame);
  if (livingFromOutside()) need = 2;
  if (!canvas.clientWidth) return;
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / (tween.dur || 900)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(tween.from.eye, tween.to.eye, e);
    controls.target.lerpVectors(tween.from.at, tween.to.at, e);
    camera.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * e; camera.updateProjectionMatrix();
    if (k >= 1) { tween = null; if (S.cam === "look") seatLook(); syncEye(); }   // v31: looking round, the turning point comes back in front of you
    need = 2;
  }
  const dt = Math.min(0.1, (now - (frame.last || now)) / 1000); frame.last = now;
  /* V2.60, the client: "make it fluid and smooth": the glide after a drag eased a fifth of the way each frame, so it ran out twice as fast
     on a 120 Hz screen as on a 60 Hz one and jumped when a frame ran long; now the same fifth each 60th of a second, at any frame rate */
  controls.dampingFactor = 1 - Math.pow(1 - DAMP, Math.max(dt, 1 / 240) * 60);
  const changed = controls.update();
  if (changed) { need = 2; lostCheck(); }
  if (cabTween(now)) need = 2;                                    // v30: the cabinet's doors swinging or sliding
  if (liftTick(now)) need = 2;                                    // v68: Lift the bed
  if (showTick(now)) need = 2;                                    // v32: "Watch it open"
  const walked = walkTick(dt); if (walked) { need = 2; syncEye(); }   // V1.32 (U7)   // V2.30: dt to 100 ms (it held each step to 50: a slow frame slowed the walk)
  if (!tween && !freeAbove() && !walking() && (clampRoom(camera.position) | clampRoom(controls.target, true) | collide())) need = 2;   // v17: never outside the room; v41: nor in the furniture
  const active = moving || changed || !!tween || walked;   // V2.73 (N17): a walk too
  if (active && mvLast && now - mvLast < 250) { MV.push(now - mvLast); if (MV.length >= 24) { const m = MV.sort((a, b) => a - b)[12]; MV.length = 0;
    if (m > 28 && !BIG_GPU) slowDev = true; else if (m < 14 && !lowRes && HI) slowDev = false;
    if (PHONE_HD && lowRes && m > 24 && phoneCap > 1.5) capDue = true;   // V2.73 (N17): still slow with the lighter drawing
    if (m > 40 && !BIG_GPU && !houseLite && S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view)) { houseLite = true; sizeRenderer(); toast("A lighter drawing for the house on this computer"); } } }
  mvLast = active ? now : 0;
  // v35: the lower resolution only while you hold and drag the room on a slow device, and only once the drag has lasted a moment:
  // each switch resizes the canvas (a new drawing buffer), which cost more than it saved after a tap, a fly-to or a Look change
  /* V2.73 (N17), the client: "minimise movement and view lag when moving in first person": a walk on the phone (the stick, the keys) is
     moving too, so it draws without the shade and the glow as a drag does (no new buffers); and if its frames still run past 24 ms, the
     phone draws at 1.5× from the next pause, once for the visit (the one resize, while still) */
  const go = moving || (walked && dragLite());
  if (go && slowDev) { if (!dragT) dragT = now; still_t = now; if (!lowRes && now - dragT > 150) { lowRes = true; dragLite() ? dirty() : sizeRenderer(); } }
  else { dragT = 0; if (active) still_t = now; else if (lowRes && now - still_t > 250) { lowRes = false; if (capDue) { capDue = false; phoneCap = 1.5; sizeRenderer(); } else dragLite() ? dirty() : sizeRenderer(); } }
  if (updateCut()) need = 2;
  upStep(now, active || walking());                                // V2.64: the photos onto the graphics chip a few at a time
  if (probe > 0 && !lowRes) need = Math.max(need, 1);                 // v35: the speed check's three frames come first, at the start
  if (need === 0 && !active && !SH && probe === 0 && now - preT > 120 && now - PRE.idleT > 400) {   // v35: hidden parts' shaders, off screen
    const t0 = performance.now(); while (precompileStep() && performance.now() - t0 < 10) {} if (!PRE.queue.length && now - PRE.idleT > 1500) warmSwitch(); preT = now; }   // V2.42: a room's visit only after a real pause   // v39: as many as fit in 10 ms, sooner
  if (glLost || (document.body.classList.contains("sheet-open") && !SH && !tween)) return;   // v35: nothing drawn behind the Plan's sheets (the last picture stays)
  if (need > 0) {
    const t = probe > 0 && !lowRes ? performance.now() : 0;
    const f0 = performance.now(); syncRig(); declutter(); draw(); if (!START_MS.firstAt) { START_MS.firstAt = Math.round(performance.now()); START_MS.firstMs = Math.round(performance.now() - f0); dispatchEvent(new Event("r3d-first")); } FT.calls = gl.info.render.calls; FT.tris = gl.info.render.triangles; need--; placeStickers(); FT[FT.n++ % 60] = performance.now() - f0;   // V2.66 (N13): r3d-first, the first picture (the landing's first screen goes)
    if (t) { const c = gl.getContext(); c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, PX); probeT.push(performance.now() - t); probe--; if (!probe) autoQuality(); }
  }
}
// v14.1: if this device takes too long over a full HD frame, drop to Fast (unless you picked a quality yourself)
let probe = 3; const probeT = [], PX = new Uint8Array(4);
let preT = 0;
const FT = []; FT.n = 0;   // v35: the last 60 frames' times, for R3D.perf()
function perfInfo() {   // v35: the counts to watch each round (R3D.perf())
  const i = gl.info, ls = [], ms = FT.slice().sort((a, b) => a - b);
  scene.traverseVisible(o => { if (o.isLight) ls.push(o); });
  return { calls: FT.calls, triangles: FT.tris, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length,
    lights: ls.length, shadows: ls.filter(l => l.castShadow).length, quality: S.quality, ratio: gl.getPixelRatio(), frameMs: ms.length ? +ms[ms.length >> 1].toFixed(1) : null,
    warm: PRE.queue.length, errors: store.get("r3d-errors", []).length, gpu: GPU.slice(0, 80), bigGpu: BIG_GPU, ao: aoLive(), goodPhone: GOOD_PHONE, slowDev };   // v39: which graphics card, and whether it starts in HD
}
if (/[?&]perf\b/.test(location.search)) {   // v35: ?perf in the address shows the counts in a corner (for a screenshot)
  const box = document.createElement("div"); box.className = "r3d-perf";
  box.style.cssText = "position:absolute;left:8px;bottom:8px;z-index:30;padding:6px 9px;border-radius:10px;background:rgba(0,0,0,.72);color:#fff;font:12px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre";
  root.append(box); let n0 = FT.n, t0 = performance.now();
  setInterval(() => { if (!gl || !started) return; const p = perfInfo(), t = performance.now(), fps = (FT.n - n0) * 1000 / (t - t0); n0 = FT.n; t0 = t;
    box.textContent = `${p.quality} · ${fps.toFixed(0)} frames/s · ${p.frameMs} ms\ncalls ${p.calls} · tris ${Math.round(p.triangles / 1000)}k · shaders ${p.programs}\nlights ${p.lights} · shadows ${p.shadows} · ratio ${p.ratio} · errors ${p.errors}`; }, 1000);
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

