/* V2.74 (REAL_PLAN N18), the client: "allow better controls in overhead and angled views of the house so I can control the screen better
   on iPhone and pc". V3.08, the client: "When in overhead and angled views it has strange movement too on mobile and pc. Not intuitive":
   a finger in Angled swung the house round, a drag lagged and slid on, a pinch zoomed off the floor. Now over the house (Outside, a floor's
   Angled and Overhead) the drags are a map's, the same on a phone and a PC: one finger or a left-drag moves the ground with it (the spot
   under the finger stays under it; a flick glides on); two fingers pinch to zoom and twist to turn round the spot between them, and in
   Angled slide up or down together to tilt; the wheel zooms to the pointer; a right-drag (or Shift + drag) turns and tilts round the
   middle. Angled tilts 10°–85° above the ground, Overhead stays flat. Arrows or W A S D move, Q E turn, + − (R F) zoom; a double-tap on
   the ground (no room there) centres it */
const mapMode = () => S.view === "house" && !walking() ? (hfview === "top" ? "top" : "angle") : null;
const MAP_POLAR = { top: [0.003, 0.003], angle: [5 * Math.PI / 180, 80 * Math.PI / 180] };   // from straight up: Angled 85° to 10° above the ground
function mapConf(m) {   // the orbit's own drags off over the house (ours below), on again in the rooms
  controls.enablePan = !m; controls.enableZoom = !m && S.cam !== "look"; controls.enableRotate = !m && !inPlace();
  controls.minDistance = m ? 2 : 0.3;
}
let MAPBOX = null;
function mapBox() {   // the house's rooms (m, the world's x), and round them the gardens when they show
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
  if ((!MAPK.size && !MAPONCE.size) || !m || tween) { MAPONCE.clear(); return false; }
  if (typeof PRE !== "undefined") PRE.idleT = now;   // the warm-up waits while you move
  const cam = camera.position, t = controls.target, k = Math.max(dt, MAPONCE.size ? 0.08 : 0) * (mapFast ? 2.5 : 1), on = c => MAPK.has(c) || MAPONCE.has(c) ? 1 : 0;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
  const fwd = new THREE.Vector3(0, 1, 0).cross(right), dist = cam.distanceTo(t);
  const mv = right.multiplyScalar(on("r") - on("l")).add(fwd.multiplyScalar(on("f") - on("b"))).multiplyScalar(dist * 0.9 * k);
  cam.add(mv); t.add(mv);
  const turn = on("tl") - on("tr"); if (turn) cam.sub(t).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * 1.4 * k).add(t);
  const z = on("dn") - on("u"); if (z) { const off = cam.clone().sub(t), l = off.length(), n = Math.min(controls.maxDistance, Math.max(controls.minDistance, l * Math.exp(z * 1.3 * k))); cam.copy(t).addScaledVector(off, n / l); }
  for (const c of MAPK.keys()) MAPK.set(c, true); MAPONCE.clear();
  return true;
}
document.addEventListener("keydown", e => {   // before the walk's own (14_views_walk.js), which steps over the house a press at a time
  mapFast = e.shiftKey;
  const m = mapMode(); if (!m || walking()) return;
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
  const m = mapMode(), t = controls.target, off = camera.position.clone().sub(t), [lo, hi] = MAP_POLAR[m];
  off.applyAxisAngle(MAPY, da);
  if (db && m === "angle") { const sp = new THREE.Spherical().setFromVector3(off); sp.phi = Math.min(hi, Math.max(lo, sp.phi + db)); off.setFromSpherical(sp); }
  camera.position.copy(t).add(off); camera.lookAt(t);
}
const mapTwo = () => { const [a, b] = [...MAPPT.values()]; return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, d: Math.hypot(b[0] - a[0], b[1] - a[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]), p: [a, b] }; };
function mapStart(e) {
  MVEL.set(0, 0, 0); MTRK.length = 0;
  if (MAPPT.size === 2) { MAPD = Object.assign(mapTwo(), { k: "two", how: null, mv: new Set() }); MAPD.p0 = MAPD.p; return; }
  const turn = e.pointerType === "mouse" && (e.button === 2 || e.button === 1 || e.shiftKey);
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
canvas.addEventListener("pointermove", e => {
  if (!MAPPT.has(e.pointerId)) return; MAPPT.set(e.pointerId, [e.clientX, e.clientY]);
  if (!MAPD || !mapMode() || tween) return;
  const H = Math.max(1, canvas.clientHeight), k = 3.5 / H;   // a turn: about a third of a circle for the screen's height
  if (MAPD.k === "pan") {
    const g = mapGround(e.clientX, e.clientY); if (!g) return;
    const d = MAPD.g.clone().sub(g).setY(0); mapShift(d);
    MTRK.push([e.timeStamp, d]); while (MTRK.length > 6 || (MTRK.length && e.timeStamp - MTRK[0][0] > 100)) MTRK.shift();
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
        mapRound(g0, Math.abs(da) < 0.5 ? da : 0, n.d > 10 ? MAPD.d / n.d : 1); } }
    Object.assign(MAPD, { x: n.x, y: n.y, d: n.d, a: n.a });
  } else return;
  if (typeof PRE !== "undefined") PRE.idleT = performance.now(); dirty();
});
for (const ev of ["pointerup", "pointercancel"]) canvas.addEventListener(ev, e => {
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
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1), g = mapGround(e.clientX, e.clientY) || controls.target.clone();
  mapRound(g, 0, Math.exp(Math.max(-1, Math.min(1, dy * (e.ctrlKey ? 0.01 : 0.0015))))); dirty();
}, { passive: false });
let glT = 0;
function mapGlide() {   // the flick slowing to a stop, frame-rate free
  const now = performance.now(), dt = Math.min(0.1, (now - (glT || now)) / 1000); glT = now;
  if (MVEL.lengthSq() < 0.01 || MAPPT.size || tween) { MVEL.set(0, 0, 0); return false; }
  mapShift(MVEL.clone().multiplyScalar(dt)); MVEL.multiplyScalar(Math.exp(-5 * dt)); return true;
}
/* a double-tap (a double-click) on the ground over the house, with no room there to stand in: the view glides to centre on it */
function mapCentre(e) {
  if (!mapMode() || tween) return false;
  ray.setFromCamera(ndc(e), camera); const t = controls.target, p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) || p.distanceTo(t) > 60) return false;
  const d = p.sub(t).setY(0), cm = v => [-v.x / M, v.y / M, v.z / M];
  flyTo(cm(camera.position.clone().add(d)), cm(t.clone().add(d)), baseFov, true, false, 450); return true;
}
/* the orbit's own update, each frame: the drags and limits for where you are, the held keys, the glide, and the view kept round the house */
{ const upd = controls.update;
  controls.update = function (dt) {
    const m = mapMode(); mapConf(m);
    if (m && !tween && hfview === "top" && camera.position.clone().sub(controls.target).normalize().y < 0.95) {   // the whole house's own view (H, Whole house): Angled again
      hfview = "angle"; qsa("[data-hfview]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === "angle"))); return this.update(dt); }
    const keyed = mapKeys(m), glid = m && mapGlide(), [lo, hi] = m && !tween ? MAP_POLAR[m] : [0, Math.PI];
    controls.minPolarAngle = lo; controls.maxPolarAngle = hi;
    const ch = upd.call(this, dt);
    return (m && !tween && mapHold()) || ch || keyed || glid;
  }; }
{ const T = { angle: "From an angle: drag to move, right-drag or two fingers to turn and tilt, scroll or pinch to zoom",
              top: "From straight above: drag to move, right-drag or two fingers to turn, scroll or pinch to zoom" };
  qsa("[data-hfview]").forEach(b => { if (T[b.dataset.hfview]) b.title = T[b.dataset.hfview]; }); }
