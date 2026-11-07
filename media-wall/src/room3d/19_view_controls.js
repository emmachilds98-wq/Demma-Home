/* V2.72 (REAL_PLAN N18), the client: "allow better controls in overhead and angled views of the house so I can control the screen better
   on iPhone and pc". Over the house (its floors' Angled and Overhead): Overhead works like a map: one finger or a left-drag moves it, the
   ground under the finger staying under it; two fingers pinch and twist; a right-drag turns. Angled orbits 10°–85° above the ground.
   Either way the point you look at stays round the house; arrows or W A S D move, Q E turn, + − (R F) zoom, held keys smooth; a double-tap
   on the ground (no room there) centres it */
const mapMode = () => S.view === "house" ? (hfview === "top" ? "top" : "angle") : null;
const MAP_POLAR = { top: [0.003, 0.003], angle: [5 * Math.PI / 180, 80 * Math.PI / 180] };   // from straight up: Angled 85° to 10° above the ground
let mapWas;
function mapConf(m) {   // the drags as a map's (Overhead) or an orbit's; the rooms keep theirs
  if (m === mapWas) return; mapWas = m;
  const top = m === "top", B = controls.mouseButtons;
  B.LEFT = top ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; B.RIGHT = top ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
  controls.touches.ONE = top ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.panSpeed = m ? 1 : 0.6;        // a drag moves the ground as far as the finger
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
/* two fingers' twist turns the view round the ground between them (a pinch and a two-finger drag are the orbit's own) */
const TW = new Map(); let twA = null;
const twAngle = () => { const [a, b] = [...TW.values()]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
function mapTwist(da, x, y) {
  const r = canvas.getBoundingClientRect(), t = controls.target, cam = camera.position, p = new THREE.Vector3();
  ray.setFromCamera(new THREE.Vector2((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1), camera);
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -t.y), p) || p.distanceTo(t) > 60) p.copy(t);
  const Y = new THREE.Vector3(0, 1, 0);
  t.sub(p).applyAxisAngle(Y, da).add(p); cam.sub(p).applyAxisAngle(Y, da).add(p); dirty();
}
canvas.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; TW.set(e.pointerId, [e.clientX, e.clientY]); twA = TW.size === 2 ? twAngle() : null; });
canvas.addEventListener("pointermove", e => {
  if (!TW.has(e.pointerId)) return; TW.set(e.pointerId, [e.clientX, e.clientY]);
  if (TW.size !== 2 || twA === null || !mapMode() || tween || !controls.enabled) return;
  const a = twAngle(); let d = a - twA; twA = a; d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(d) < 0.5) { const [p, q] = [...TW.values()]; mapTwist(d, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
});
for (const ev of ["pointerup", "pointercancel"]) canvas.addEventListener(ev, e => { TW.delete(e.pointerId); twA = TW.size === 2 ? twAngle() : null; });
/* a double-tap (a double-click) on the ground over the house, with no room there to stand in: the view glides to centre on it */
function mapCentre(e) {
  if (!mapMode() || tween) return false;
  ray.setFromCamera(ndc(e), camera); const t = controls.target, p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) || p.distanceTo(t) > 60) return false;
  const d = p.sub(t).setY(0), cm = v => [-v.x / M, v.y / M, v.z / M];
  flyTo(cm(camera.position.clone().add(d)), cm(t.clone().add(d)), baseFov, true, false, 450); return true;
}
/* the orbit's own update, each frame: the drags and limits for where you are, the held keys, and the view kept round the house */
{ const upd = controls.update;
  controls.update = function (dt) {
    const m = mapMode(); mapConf(m);
    if (m && !tween && hfview === "top" && camera.position.clone().sub(controls.target).normalize().y < 0.95) {   // the whole house's own view (H, Whole house): Angled again
      hfview = "angle"; qsa("[data-hfview]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === "angle"))); return this.update(dt); }
    const keyed = mapKeys(m), [lo, hi] = m && !tween ? MAP_POLAR[m] : [0, Math.PI];
    controls.minPolarAngle = lo; controls.maxPolarAngle = hi;
    const ch = upd.call(this, dt);
    return (m && !tween && mapHold()) || ch || keyed;
  }; }
{ const T = { angle: "From an angle: drag to turn, right-drag to move, scroll to zoom · arrows move, Q E turn, + − zoom",
              top: "From straight above: drag to move, right-drag or two fingers to turn, scroll or pinch to zoom · arrows move, Q E turn, + − zoom" };
  qsa("[data-hfview]").forEach(b => { if (T[b.dataset.hfview]) b.title = T[b.dataset.hfview]; }); }
