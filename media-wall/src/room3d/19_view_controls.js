/* V2.74 (REAL_PLAN N18), the client: "allow better controls in overhead and angled views of the house so I can control the screen better
   on iPhone and pc". V3.08, the client: "When in overhead and angled views it has strange movement too on mobile and pc. Not intuitive":
   a finger in Angled swung the house round, a drag lagged and slid on, a pinch zoomed off the floor. Now over the house (Outside, a floor's
   Angled and Overhead) the drags are a map's, the same on a phone and a PC: one finger or a left-drag moves the ground with it (the spot
   under the finger stays under it; a flick glides on); two fingers pinch to zoom and twist to turn round the spot between them, and in
   Angled slide up or down together to tilt; the wheel zooms to the pointer; a right-drag (or Shift + drag) turns and tilts round the
   middle. Angled tilts 10°–85° above the ground, Overhead stays flat. Arrows or W A S D move, Q E turn, + − (R F) zoom; a double-tap on
   the ground (no room there) centres it */
const mapMode = () => walking() ? null : S.view === "house" ? (hfview === "top" ? "top" : "angle")   // V3.09: a room's Above too (the living room's is at an angle)
  : ROOMV() && RMODE === "above" ? "top" : S.view === "room" ? "angle" : null;
/* V3.15: the rest of the views from above (a room's On its own, the living room's own, Bird's eye, Dolls' house): the keys and the stick glide
   there too (they stepped a key's repeat at a time); the orbit keeps its drags */
const freeMode = () => !walking() && !mapMode() && !eyeView() && !!VIEWS[S.view] ? "free" : null;
const MAP_POLAR = { top: [0.003, 0.003], angle: [5 * Math.PI / 180, 80 * Math.PI / 180] };   // from straight up: Angled 85° to 10° above the ground
const mapPolar = m => m === "angle" && S.view === "house" && hfloor === "all" ? [5 * Math.PI / 180, 87 * Math.PI / 180] : MAP_POLAR[m];   // V3.68: Outside down to 3°, eye to eye with the house (a floor's walls would hide it lower)
function mapConf(m) {   // the orbit's own drags off over the house (ours below), on again in the rooms
  controls.enablePan = !m; controls.enableZoom = !m && S.cam !== "look"; controls.enableRotate = !m && !inPlace();
  controls.minDistance = m ? 2 : 0.3;
}
let MAPBOX = null;
function mapBox() {   // the house's rooms (m, the world's x), and round them the gardens when they show; a room's Above: the room and 2 m round it
  const rr = S.view === "room" ? [0, R.W, R.WINDOW_Z, R.RECESS_Z] : S.view !== "house" && R.HOUSE3 && (R.HOUSE3.rooms || {})[VIEW_ROOM[S.view]];
  if (rr) return [-(rr[1] + 200) * M, -(rr[0] - 200) * M, (rr[2] - 200) * M, (rr[3] + 200) * M];
  if (!MAPBOX && R.HOUSE3) { const rs = [...Object.values(R.HOUSE3.rooms || {}), [0, R.W, R.WINDOW_Z, R.RECESS_Z]];
    MAPBOX = [Math.min(...rs.map(r => r[0])), Math.max(...rs.map(r => r[1])), Math.min(...rs.map(r => r[2])), Math.max(...rs.map(r => r[3]))]; }
  if (!MAPBOX) return null;
  const g = S.hgarden || S.hstreet ? 1500 : 500, [x0, x1, z0, z1] = MAPBOX;
  return [-(x1 + g) * M, -(x0 - g) * M, (z0 - g) * M, (z1 + g) * M];
}
function mapHold() {   // the point looked at back within the box, the eye with it (no turn)
  const b = mapBox(), t = controls.target; if (!b) return false;
  const d = new THREE.Vector3(Math.min(b[1], Math.max(b[0], t.x)) - t.x, Math.min(6, Math.max(-3, t.y)) - t.y, Math.min(b[3], Math.max(b[2], t.z)) - t.z);
  if (d.lengthSq() < 1e-10) return false;
  t.add(d); camera.position.add(d); return true;
}
/* the keys: held, a smooth glide each frame (it was a step a key's repeat); a tap shorter than a frame still steps */
const MAPK = new Map(), MAPONCE = new Set(), MAP_KEYS = Object.assign({}, WALK_KEYS, { "+": "u", "=": "u", "-": "dn", _: "dn" });
let mapT = 0, mapFast = false;
function mapKeys(m) {
  const now = performance.now(), dt = Math.min(0.1, (now - (mapT || now)) / 1000); mapT = now;
  const [sx, sy] = WALK.stick, stk = sx * sx + sy * sy > 0.004;   // V3.15: the phone's stick, as far as it's pushed
  if ((!MAPK.size && !MAPONCE.size && !stk) || !m || tween) { MAPONCE.clear(); return false; }
  if (typeof PRE !== "undefined") PRE.idleT = now;   // the warm-up waits while you move
  const cam = camera.position, t = controls.target, k = Math.max(dt, MAPONCE.size ? 0.08 : 0) * (mapFast ? 2.5 : 1), on = c => MAPK.has(c) || MAPONCE.has(c) ? 1 : 0;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
  const fwd = new THREE.Vector3(0, 1, 0).cross(right), dist = cam.distanceTo(t);
  const mv = right.multiplyScalar(on("r") - on("l") + sx).add(fwd.multiplyScalar(on("f") - on("b") + sy)).multiplyScalar(dist * 0.9 * k);
  cam.add(mv); t.add(mv);
  const turn = on("tl") - on("tr"); if (turn) cam.sub(t).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * 1.4 * k).add(t);
  const z = on("dn") - on("u"); if (z) { const off = cam.clone().sub(t), l = off.length(), n = Math.min(controls.maxDistance, Math.max(controls.minDistance, l * Math.exp(z * 1.3 * k))); cam.copy(t).addScaledVector(off, n / l); }
  for (const c of MAPK.keys()) MAPK.set(c, true); MAPONCE.clear();
  return true;
}
document.addEventListener("keydown", e => {   // before the walk's own (14_views_walk.js), which steps over the house a press at a time
  mapFast = e.shiftKey;
  const m = mapMode() || freeMode(); if (!m || walking()) return;
  if (!(e.target === document.body || root.contains(e.target)) || e.altKey || e.ctrlKey || e.metaKey || /^(input|select|textarea)$/i.test(e.target.tagName)) return;
  const key = e.key.toLowerCase(), c = MAP_KEYS[key];
  if (!c || (e.target.tagName === "BUTTON" && key.startsWith("arrow"))) return;   // arrows still move between buttons
  e.preventDefault(); e.stopImmediatePropagation(); if (!MAPK.has(c)) MAPK.set(c, false); dirty();
}, true);
const mapUp = c => { if (MAPK.get(c) === false) { MAPONCE.add(c); dirty(); } MAPK.delete(c); };
document.addEventListener("keyup", e => { mapFast = e.shiftKey; const c = MAP_KEYS[e.key.toLowerCase()]; if (!c) return;
  if (c === "u" || c === "dn") { mapUp("u"); mapUp("dn"); } else mapUp(c); });   // + let go after Shift comes up as =
addEventListener("blur", () => MAPK.clear());
/* the drags: the ground is the level looked at (the target's); each move puts the camera where the spot first touched is under the finger */
const MAPGP = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), MAPY = new THREE.Vector3(0, 1, 0), MAPPT = new Map();
let MAPD = null;   // the drag now: { k: "pan" | "two" | "turn", ... }
const MVEL = new THREE.Vector3(), MTRK = [];   // the flick's speed (m/s), from the last moves
function mapGround(x, y, out = new THREE.Vector3()) {   // the ground under a point on the screen, null over the horizon
  const r = canvas.getBoundingClientRect(); MAPGP.constant = -controls.target.y; camera.updateMatrixWorld();
  ray.setFromCamera(new THREE.Vector2((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1), camera);
  const p = ray.ray.intersectPlane(MAPGP, out); return p && p.distanceTo(camera.position) < 150 ? p : null;
}
const mapShift = d => { camera.position.add(d); controls.target.add(d); };
function mapRound(p, a, s) {   // turn by a round the upright through p, then zoom by s towards it (the spot p stays where it is on screen)
  const t = controls.target, cam = camera.position;
  if (a) { t.sub(p).applyAxisAngle(MAPY, a).add(p); cam.sub(p).applyAxisAngle(MAPY, a).add(p); }
  if (s !== 1) { const l = cam.distanceTo(t); s = Math.min(controls.maxDistance, Math.max(controls.minDistance, l * s)) / l;
    t.sub(p).multiplyScalar(s).add(p); cam.sub(p).multiplyScalar(s).add(p); }
  camera.lookAt(t);
}
function mapTilt(da, db) {   // round the middle: turn by da, lean by db (towards the horizon), inside the view's limits
  const m = mapMode(), t = controls.target, off = camera.position.clone().sub(t), [lo, hi] = mapPolar(m);
  off.applyAxisAngle(MAPY, da);
  if (db && m === "angle") { const sp = new THREE.Spherical().setFromVector3(off); sp.phi = Math.min(hi, Math.max(lo, sp.phi + db)); off.setFromSpherical(sp); }
  camera.position.copy(t).add(off); camera.lookAt(t);
}
/* V3.68 (N125), the client 11 Nov 2026: "the pc navigation doesnt feel right still. when looking at the house from the outside, its hard to
   look into floors easily and swing camera where i want it". On a PC from an angle a left-drag now swings the view round the spot grabbed
   (the wall, window or floor under the mouse, not the middle of the ground), a right-drag (or Shift + drag) moves the ground; the wheel and a
   pinch go towards what's under them (they went to the ground behind a wall); Outside goes down to 3° above the ground */
let MAPPK = null;   // the last pick: [x, y, time, point]: the eased wheel asks each frame, one ray a turn of it
function mapPick(x, y) {   // what's drawn under a point on the screen (within 60 m), else the ground looked at
  if (MAPPK && Math.abs(MAPPK[0] - x) + Math.abs(MAPPK[1] - y) < 3 && performance.now() - MAPPK[2] < 400) return MAPPK[3].clone();
  const r = canvas.getBoundingClientRect(); camera.updateMatrixWorld();
  ray.setFromCamera(new THREE.Vector2((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1), camera);
  const h = ray.intersectObjects(scene.children, true).find(q => q.distance < 60 && q.object.isMesh && shown(q.object) && q.object.material && q.object.material.visible !== false && !clippedAt(q));
  const p = h ? h.point : mapGround(x, y); if (p) MAPPK = [x, y, performance.now(), p.clone()]; return p;
}
function mapSwing(da, db, p) {   // turn by da round the upright through p and lean by db round the level line through it, inside Angled's limits
  const t = controls.target, cam = camera.position, [lo, hi] = mapPolar("angle");
  t.sub(p).applyAxisAngle(MAPY, da).add(p); cam.sub(p).applyAxisAngle(MAPY, da).add(p);
  const off = cam.clone().sub(t), phi = Math.acos(Math.max(-1, Math.min(1, off.y / off.length()))), b = Math.min(hi, Math.max(lo, phi + db)) - phi;
  if (b) { const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
    t.sub(p).applyAxisAngle(ax, b).add(p); cam.sub(p).applyAxisAngle(ax, b).add(p); }
  camera.lookAt(t);
}
const mapTwo = () => { const [a, b] = [...MAPPT.values()]; return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, d: Math.hypot(b[0] - a[0], b[1] - a[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]), p: [a, b] }; };
function mapStart(e) {
  MVEL.set(0, 0, 0); MTRK.length = 0;
  if (MAPPT.size === 2) { MAPD = Object.assign(mapTwo(), { k: "two", how: null, mv: new Set() }); MAPD.p0 = MAPD.p; MAPD.zp = mapPick(MAPD.x, MAPD.y); return; }
  const alt = e.button === 2 || e.button === 1 || e.shiftKey, mouse = e.pointerType === "mouse";
  if (mouse && mapMode() === "angle" && !alt) {   // V3.68: a PC's left-drag from an angle swings round the spot grabbed
    const p = mapPick(e.clientX, e.clientY);
    if (p) { const t = controls.target, d = t.clone().sub(camera.position).normalize(), l = p.clone().sub(camera.position).dot(d);   // the middle brought to the spot's depth: nothing moves on screen
      if (l > controls.minDistance) t.copy(camera.position).addScaledVector(d, l);
      MAPD = { k: "swing", x: e.clientX, y: e.clientY, p }; return; }
  }
  const turn = mouse && alt && mapMode() !== "angle";
  const g = turn ? null : mapGround(e.clientX, e.clientY);
  MAPD = turn ? { k: "turn", x: e.clientX, y: e.clientY } : g ? { k: "pan", g } : null;
}
canvas.addEventListener("pointerdown", () => mapConf(mapMode()), true);   // after the walk's (14), which turns the orbit's drag on
canvas.addEventListener("pointerdown", e => {   // a piece grabbed in Edit never gets here (13 stops its press on the root)
  if (!mapMode() || tween) { MAPPT.clear(); MAPD = null; return; }
  mapConf(mapMode()); MAPPT.set(e.pointerId, [e.clientX, e.clientY]); if (MAPPT.size > 2) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  mapStart(e); moving = true; if (typeof PRE !== "undefined") PRE.idleT = performance.now(); dirty();
});
root.addEventListener("pointerdown", e => {   // a finger on a sticker still drags and pinches (the living room's are over the middle); a tap still opens it
  if (e.pointerType === "touch" && MAPPT.size < 2 && e.target.closest(".stk") && mapMode() && !tween) { MAPPT.set(e.pointerId, [e.clientX, e.clientY]); mapStart(e); moving = true; }
}, true);
addEventListener("pointermove", e => {
  if (!MAPPT.has(e.pointerId)) return; MAPPT.set(e.pointerId, [e.clientX, e.clientY]);
  if (!MAPD || !mapMode() || tween) return;
  const H = Math.max(1, canvas.clientHeight), k = 3.5 / H;   // a turn: about a third of a circle for the screen's height
  if (MAPD.k === "pan") {
    const g = mapGround(e.clientX, e.clientY); if (!g) return;
    const d = MAPD.g.clone().sub(g).setY(0); mapShift(d);
    MTRK.push([e.timeStamp, d]); while (MTRK.length > 6 || (MTRK.length && e.timeStamp - MTRK[0][0] > 100)) MTRK.shift();
  } else if (MAPD.k === "swing") {
    mapSwing((e.clientX - MAPD.x) * k, (e.clientY - MAPD.y) * k, MAPD.p); MAPD.x = e.clientX; MAPD.y = e.clientY;   // V4.1 (N158), the client: "it moves backwards to what i would have thought": the view goes the way you drag
    if (!mapSwing.hint && S.view === "house") { mapSwing.hint = 1; toast("Drag swings round · right-drag moves · First, Ground or Lower to look in"); }
  } else if (MAPD.k === "turn") {
    mapTilt(-(e.clientX - MAPD.x) * k, -(e.clientY - MAPD.y) * k); MAPD.x = e.clientX; MAPD.y = e.clientY;
  } else if (MAPPT.size === 2) {
    const n = mapTwo();
    if (!MAPD.how) {   // two fingers sliding up or down side by side lean the view (Angled); anything else pinches, twists and moves it
      const dy = n.p.map((q, i) => q[1] - MAPD.p0[i][1]), dx = n.p.map((q, i) => q[0] - MAPD.p0[i][0]);
      const far = Math.max(...dy.map(Math.abs), ...dx.map(Math.abs)); MAPD.mv.add(e.pointerId);   // each finger's move comes on its own
      if (far < 8 || (MAPD.mv.size < 2 && far < 30)) return;
      MAPD.how = mapMode() === "angle" && dy[0] * dy[1] > 0 && dy.every((v, i) => Math.abs(v) > 2 * Math.abs(dx[i])) && Math.abs(n.d - MAPD.d) < 20 && Math.abs(Math.cos(MAPD.a)) > 0.5 ? "lean" : "map";
    }
    if (MAPD.how === "lean") mapTilt(0, -(n.y - MAPD.y) * k);
    else { const g0 = mapGround(MAPD.x, MAPD.y), g1 = g0 && mapGround(n.x, n.y);
      if (g1) { mapShift(g0.clone().sub(g1).setY(0)); camera.updateMatrixWorld(); const da = Math.atan2(Math.sin(n.a - MAPD.a), Math.cos(n.a - MAPD.a));
        mapRound(g0, Math.abs(da) < 0.5 ? da : 0, 1); if (n.d > 10) mapRound(MAPD.zp || g0, 0, MAPD.d / n.d); } }   // V3.68: the pinch towards what was under the fingers
    Object.assign(MAPD, { x: n.x, y: n.y, d: n.d, a: n.a });
  } else return;
  if (typeof PRE !== "undefined") PRE.idleT = performance.now(); dirty();
});
for (const ev of ["pointerup", "pointercancel"]) addEventListener(ev, e => {
  if (!MAPPT.delete(e.pointerId)) return;
  if (MAPD && MAPD.k === "pan" && MTRK.length > 1 && e.timeStamp - MTRK[MTRK.length - 1][0] < 60) {   // a flick: the ground glides on
    const dt = Math.max(0.016, (MTRK[MTRK.length - 1][0] - MTRK[0][0]) / 1000); MTRK.slice(1).forEach(q => MVEL.add(q[1])); MVEL.divideScalar(dt);
    const top = 2 * camera.position.distanceTo(controls.target); if (MVEL.length() > top) MVEL.setLength(top); }   // a hard flick: at most 2/5 of the view's distance
  MAPD = null; MTRK.length = 0;
  if (MAPPT.size === 1) { const [id, q] = [...MAPPT][0]; mapStart({ pointerId: id, pointerType: "touch", clientX: q[0], clientY: q[1], button: 0 }); }   // one finger left on: it moves the ground again
  if (!MAPPT.size) moving = false; dirty();
});
canvas.addEventListener("wheel", e => {   // towards the spot under the pointer; a trackpad's pinch (Ctrl + wheel) the same, finer steps
  if (!mapMode() || tween) return; e.preventDefault(); MVEL.set(0, 0, 0);
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1), g = mapPick(e.clientX, e.clientY) || controls.target.clone();
  mapRound(g, 0, Math.exp(Math.max(-1, Math.min(1, dy * (e.ctrlKey ? 0.01 : 0.0015))))); dirty();
}, { passive: false });
let glT = 0;
function mapGlide() {   // the flick slowing to a stop, frame-rate free
  const now = performance.now(), dt = Math.min(0.1, (now - (glT || now)) / 1000); glT = now;
  if (MVEL.lengthSq() < 0.01 || MAPPT.size || tween) { MVEL.set(0, 0, 0); return false; }
  mapShift(MVEL.clone().multiplyScalar(dt)); MVEL.multiplyScalar(Math.exp(-5 * dt)); return true;
}
/* a double-tap (a double-click) over the house where there's no room to stand in: the view glides to centre on it. V4.5 (N168, N159's rest):
   on a PC it centres on the spot clicked itself (the roof, a wall, the garden, not the ground's level behind it), and a double-click that
   lands on the house's outside centres there rather than dropping you through the roof; one on a room's floor or inside stands you there as
   before. The angle and the distance are kept (the view slides, its limits hold); a phone's double-tap stands you in the same places */
const mouseEv = e => !e.pointerType || e.pointerType === "mouse";
function mapOut(e) {   // a PC's double-click over the house that lands on its outside (or nothing): [the spot] to centre on, else null
  if (!mapMode() || tween || !mouseEv(e)) return null;
  const p = mapPick(e.clientX, e.clientY); if (!p) return null;
  const q = p.clone().addScaledVector(p.clone().sub(camera.position).normalize(), -0.05);   // this side of what was hit
  return standRoomAt(-q.x / M, q.y / M - 1, q.z / M) ? null : p;
}
function mapCentre(e, at) {
  if (!mapMode() || tween) return false;
  const t = controls.target, p = at || mapPick(e.clientX, e.clientY);   // a phone's too: what's under the finger (it took the ground's level behind a roof, 10 m off)
  if (!p || p.distanceTo(t) > 60) return false;
  const b = mapBox(); if (b) { p.x = Math.min(b[1], Math.max(b[0], p.x)); p.z = Math.min(b[3], Math.max(b[2], p.z)); }
  p.y = Math.min(6, Math.max(-3, p.y));   // mapHold's limits: nothing jumps when the glide ends
  const d = p.sub(t), cm = v => [-v.x / M, v.y / M, v.z / M];
  flyTo(cm(camera.position.clone().add(d)), cm(t.clone().add(d)), baseFov, true, false, 450); return true;
}
/* the orbit's own update, each frame: the drags and limits for where you are, the held keys, the glide, and the view kept round the house */
{ const upd = controls.update;
  controls.update = function (dt) {
    const m = mapMode(); mapConf(m);
    if (m && !tween && S.view === "house" && hfview === "top" && camera.position.clone().sub(controls.target).normalize().y < 0.95) {   // the whole house's own view (H, Whole house): Angled again
      hfview = "angle"; qsa("[data-hfview]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === "angle"))); return this.update(dt); }
    const keyed = mapKeys(m || freeMode()), glid = m && mapGlide(), [lo, hi] = m && !tween ? mapPolar(m) : [0, Math.PI];
    controls.minPolarAngle = lo; controls.maxPolarAngle = hi;
    const ch = upd.call(this, dt);
    const cut = floorCut();   // V3.68: a floor cut under the eye as it comes down (09)
    return (m && !tween && mapHold()) || ch || keyed || glid || cut;
  }; }
{ const T = { angle: "From an angle: drag to swing round (a finger moves), right-drag to move, double-click to centre, scroll or pinch to zoom",
              top: "From straight above: drag to move, right-drag or two fingers to turn, double-click to centre, scroll or pinch to zoom" };
  qsa("[data-hfview]").forEach(b => { if (T[b.dataset.hfview]) b.title = T[b.dataset.hfview]; }); }
/* V3.26, the client 9 Nov 2026: "i want pc to be better ... it is still clunky i want fluid like the mobile version". A phone's pinch
   zooms smoothly; a mouse wheel jumped a notch at a time (the orbit 3 %, the map 16 %, a walk 11 cm, all in one frame). Now each notch is
   eased out over about a fifth of a second, frame by frame, and the same total arrives: the room, the map and a walk all glide. A
   trackpad's pinch (Ctrl + wheel) and a sideways scroll come as they are */
{ const EASED = new WeakSet(); let pend = 0, at = null, raf = 0, tw = 0;
  const step = now => { const dt = Math.min(0.25, Math.max(0.001, (now - tw) / 1000)); tw = now;
    let d = pend * (1 - Math.exp(-dt / 0.07)); if (Math.abs(pend - d) < 3) d = pend; pend -= d;
    const ev = new WheelEvent("wheel", { deltaY: d, deltaMode: 0, clientX: at[0], clientY: at[1], shiftKey: at[2], bubbles: true, cancelable: true });
    EASED.add(ev); canvas.dispatchEvent(ev); raf = pend ? requestAnimationFrame(step) : 0; };
  root.addEventListener("wheel", e => {
    if (e.target !== canvas || EASED.has(e) || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); e.stopPropagation();
    const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    if (pend && Math.sign(dy) !== Math.sign(pend)) pend = 0;   // the other way: the rest of the last notch dropped
    pend += dy; at = [e.clientX, e.clientY, e.shiftKey];
    if (!raf) { tw = performance.now() - 16; raf = requestAnimationFrame(step); }
  }, { capture: true, passive: false }); }
/* V3.64 (REAL_PLAN N115): no black void. A room's Above and On its own (the living room's too) sit on the page's cream by day and a warm
   grey by evening, not the black or the sky. The colour only (no picture, no shader); through the HD composer the cream is passed in
   so that after its AgX and exposure it comes out the same cream as on Fast. The whole house and the rooms from inside keep theirs */
const BACKDROP = { day: "#f1e9da", evening: "#6b645a" };
const BD = { on: false, key: "", saved: new THREE.Color(), want: new THREE.Color(), set: new THREE.Color() };
const backdropView = () => !walking() && (LIVV() ? S.view === "room" || S.view === "livalone" : !!ROOMV() && (RMODE === "above" || RMODE === "alone") || S.view === "house" && hfloor !== "all");   // V3.79 (N144): a floor on its own too (it sat on the sky's blue)
function agxIn(c, e) {   // the colour that three's AgX (r160) at exposure e turns into c (linear), by a few steps of Newton's kind
  const mv = (m, v) => [0, 1, 2].map(i => m[i] * v[0] + m[3 + i] * v[1] + m[6 + i] * v[2]);   // GLSL mat3 (by columns) times v
  const R = [0.6274, 0.0691, 0.0164, 0.3293, 0.9195, 0.0880, 0.0433, 0.0113, 0.8956], S2 = [1.6605, -0.1246, -0.0182, -0.5876, 1.1329, -0.1006, -0.0728, -0.0083, 1.1187];
  const I = [0.856627, 0.137319, 0.111898, 0.095121, 0.761242, 0.076799, 0.048252, 0.101439, 0.811302], O = [1.127101, -0.14133, -0.14133, -0.110607, 1.157824, -0.110607, -0.016494, -0.016494, 1.251936];
  const agx = x => mv(S2, mv(O, mv(I, mv(R, x).map(v => v * e)).map(v => { v = Math.min(1, Math.max(0, (Math.log2(Math.max(v, 1e-10)) + 12.47393) / 16.5)); const v2 = v * v, v4 = v2 * v2;
    return 15.5 * v4 * v2 - 40.14 * v4 * v + 31.96 * v4 - 6.868 * v2 * v + 0.4298 * v2 + 0.1191 * v - 0.00232; })).map(v => Math.pow(Math.max(0, v), 2.2)));
  const t = [c.r, c.g, c.b], x = t.slice();
  for (let n = 0; n < 40; n++) { const y = agx(x); for (let k = 0; k < 3; k++) x[k] = Math.min(1e3, Math.max(1e-5, x[k] * Math.pow(Math.max(t[k], 1e-5) / Math.max(y[k], 1e-5), 1.5))); }
  return c.setRGB(x[0], x[1], x[2], THREE.LinearSRGBColorSpace);
}
function backdrop() {   // each frame, before it's drawn (01_renderer.js draw): the lights' own background kept aside and given back after
  const bg = scene.background; if (!bg || !bg.isColor) return;
  if (!backdropView()) { if (BD.on) { if (bg.equals(BD.set)) bg.copy(BD.saved); BD.on = false; } return; }
  const post = postLive(), key = S.tod + post + gl.toneMappingExposure;
  if (key !== BD.key) { BD.key = key; BD.want.set(BACKDROP[S.tod === "day" ? "day" : "evening"]); if (post && gl.toneMapping === THREE.AgXToneMapping) agxIn(BD.want, gl.toneMappingExposure); }
  if (BD.on && bg.equals(BD.want)) return;
  if (!BD.on || !bg.equals(BD.set)) BD.saved.copy(bg);   // the light's own (it set it again since)
  bg.copy(BD.want); BD.set.copy(BD.want); BD.on = true;
}
/* V4.8 (N174): ⋯ puts As it is and Hide labels out beside it; a tap anywhere else or Esc tucks them away */
const MORE = qs("#r3d-more"), moreOpen = on => { MORE.closest(".r3d-mini").classList.toggle("more", on); MORE.setAttribute("aria-expanded", String(on)); };
if (MORE) { MORE.addEventListener("click", () => moreOpen(MORE.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("pointerdown", e => { if (MORE.getAttribute("aria-expanded") === "true" && !e.target.closest(".r3d-mini")) moreOpen(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && MORE.getAttribute("aria-expanded") === "true") moreOpen(false); }); }
