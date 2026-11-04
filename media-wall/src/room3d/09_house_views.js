let houseG = null;     // v54: the whole house, drafted (The whole house view)
const HOUSEV = n => n === "house" || (!!R.HOUSE3 && !!(VIEWS[n] || {}).box);   // v60: the views that show the built house (a room's own, from inside it)
const ROOMV = () => R.HOUSE3 && (VIEWS[S.view] || {}).box;                       // v61: in one of the house's rooms: its walls keep the eye in
/* v78b, the client: "add the viewing buttons to the living room also, it doesnt have the in it, above, on its own buttons like all other
   rooms": the living room is drawn on its own (not in the house), so its three are its own views: from the window, the whole room from
   above, and the room from the hall's corner with its ceiling off */
const LIV_RMODE = { in: "window", stand: "livstand", above: "room", alone: "livalone" };
/* V1.6, the client: "give every room a wide angle within the room as if you're there viewing option": Be there, in every room (the living
   room too): from its door at standing eye height, a wide lens, level; dragging looks round from where you stand (View's "Look round from
   here"), put back as it was on the way out */
const STAND_FOV = 80, STAND_EYE = 160;
let standCam = null, standSpot = null;   // V1.53: standSpot, where a double-click or the figure puts you down ([x, z, dx, dz], room cm)
function standLook(on) {
  if (on) { if (standCam === null) standCam = S.cam; S.cam = "look"; }
  else if (standCam !== null) { S.cam = standCam; standCam = null; } else return;
  applyCam(false); syncButtons();
}
function standIn() {
  const v = VIEWS[S.view], rr = ((R.HOUSE3 && R.HOUSE3.rooms) || {})[VIEW_ROOM[S.view]], fy = rr ? rr[4] : 0;
  standLook(true);
  if (standSpot) { const [x, z, dx, dz] = standSpot; standSpot = null;
    flyTo([x, fy + STAND_EYE, z], [x + dx * 100, fy + STAND_EYE - 10, z + dz * 100], STAND_FOV, false, false, 900); return; }
  flyTo([v.eye[0], fy + STAND_EYE, v.eye[2]], [v.at[0], fy + STAND_EYE - 10, v.at[2]], STAND_FOV, false);
}
const LIVV = () => !HOUSEV(S.view) && !!VIEWS[S.view];
function syncRmode() {
  if (typeof syncStick === "function") try { syncStick(); } catch (e) {}   // V1.32: the walk's stick
  const rm = qs("#r3d-rmode"); if (!rm) return;
  const liv = LIVV(), cur = liv ? (S.view === "room" ? "above" : S.view === "livalone" ? "alone" : S.view === "livstand" ? "stand" : "in") : RMODE;
  rm.hidden = !(ROOMV() || liv); qsa("[data-rmode]", rm).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.rmode === cur)));
}
const HFLOOR = {};     // v55: its floors (lower, ground, first) and the outside (gardens, the alley), for the floor picker
let hfloor = "all", hidReal = [], hidLay = [], hfview = "angle";   // v74: a floor seen from an angle or from straight above
const ROOMLIGHTS = [];   // v69 (B3): two warm ceiling lights that go to the room you're in (a fixed set: no shader rebuilds)
let roomKey = "";
/* v69, the client: "increasing the render quality to be more realistic like our living room version": in a room of the house, its
   ceiling lights on (the nearest two to the view), and the sun's shadow box moved over that room (it covered the living room only) */
function placeRoomLights() {
  if (!ROOMLIGHTS.length || !sun) return;
  const v = VIEWS[S.view] || {}, b = R.HOUSE3 && v.box, list = [];
  if (b) { const cx = (b[0] + b[1]) / 2, cz = (b[4] + b[5]) / 2;
    for (const F of Object.values(R.HOUSE3.floors)) for (const L of F.lights || [])
      if (L.x >= b[0] - 30 && L.x <= b[1] + 30 && L.z >= b[4] - 30 && L.z <= b[5] + 30 && L.y > b[2] && L.y < b[3] + 60) list.push(L);
    list.sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz)); }
  const day = S.tod === "day";
  const rr = b && R.HOUSE3.rooms && R.HOUSE3.rooms[VIEW_ROOM[S.view]], area = rr ? (rr[1] - rr[0]) * (rr[3] - rr[2]) / 1e4 : 10;
  const ks = Math.min(1.3, Math.max(0.75, Math.sqrt(area / 10)));   // v72 (B2): a big room's light reaches its corners, a small one doesn't glare
  ROOMLIGHTS.forEach((l, k) => { const L = list[k]; l.visible = !!L; if (L) { l.position.copy(v3(L.x, L.y - 40, L.z)); l.intensity = (day ? 1.2 : 3.2) * ks; } });
  const key = b ? b.join() : "";
  if (key === roomKey) return; roomKey = key;
  const d = b ? v3((b[0] + b[1]) / 2, 0, (b[4] + b[5]) / 2).sub(sun.userData.t0).setY(0) : new THREE.Vector3();
  sun.position.copy(sun.userData.p0).add(d); sun.target.position.copy(sun.userData.t0).add(d); sun.target.updateMatrixWorld();
  reshadow();
}
/* v69 (B3) had each room's own reflections caught when you entered it (a cube camera round the whole scene, then every house material
   recompiled). v73, the client: "consistent crashing on PC when accessing rooms": that froze the page for seconds each time (and leaked
   a texture a visit), long enough for a PC's graphics driver to give up; phones never ran it. Now one neutral room reflection, made once,
   is on the house's materials from the start (no recompiles), each surface reflecting by its finish */
let HMATS = null, HENV = null;
/* V1.31 (U6): the house's materials one-sided (every piece is a closed solid): half the drawing where faces turn away, and no shadow
   acne from back faces; ?double for the old way, to compare */
const HOUSE_SIDE = /[?&]double\b/.test(location.search) ? THREE.DoubleSide : THREE.FrontSide;
function houseEnv() {
  if (!HENV) { const pm = new THREE.PMREMGenerator(gl), rs = new RoomEnvironment(); HENV = pm.fromScene(rs, 0.04).texture; pm.dispose(); rs.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  return HENV;
}
const finishEnv = m => m.userData.hk === "glass" ? 0.3 : m.roughness <= 0.3 ? 0.9 : m.roughness <= 0.6 ? 0.6 : 0.45;   // v72 (B3): gloss, satin, matt
let RMODE = "in", hidMode = [], RPLANES = [];   // v71: how a room of the house is seen (in it, above, on its own) and what that put away
const HPARTS = {};     // v68: the house's moving pieces (the master bedroom's ottoman lid), each its own group on its hinge
/* v55: the floor picker. All lifts the floors apart (the first floor up, the lower ground floor down) so each one shows; First, Ground and
   Lower show the house up to that floor, the ones above taken off (Lower takes the living room itself off too); only the top floor's
   labels show, or every floor's in All */
function applyFloors() {
  if (!houseG) return;
  const on = S.view === "house", sel = on ? hfloor : "all", ex = sel === "all" && !R.HOUSE3 ? 330 : 0;   // v58: Outside, the house closed (no lifting)
  if (HFLOOR.roof) HFLOOR.roof.visible = sel === "all";
  if (HFLOOR.first) { HFLOOR.first.position.y = ex * M; HFLOOR.first.visible = sel === "all" || sel === "first"; }
  if (HFLOOR.lower) HFLOOR.lower.position.y = -ex * M;
  if (HFLOOR.ground) HFLOOR.ground.visible = sel !== "lower";
  const top = sel === "all" ? null : sel;
  for (const k of ["lower", "ground", "first", "out"]) if (HFLOOR[k]) HFLOOR[k].traverse(o => { if (o.userData.hlabel) o.visible = labelsOn && (k === "out" ? on : (top ? top === k : !R.HOUSE3)); });   // v57: Hide labels hides these too
  if (rmodeG) rmodeG.traverse(o => { if (o.userData.rlabel) o.visible = labelsOn; });   // v72 (B5): the room's name in Above
  hidReal.forEach(o => o.visible = true); hidReal = []; hidLay.forEach(o => o.layers.enable(0)); hidLay = [];
  if (HMATS && HMATS.earth) HMATS.earth.visible = !(on && sel === "lower");   // V1.53: the earth over the secret room (under the garage) off, so the lower floor shows
  if (on && sel === "lower") scene.children.forEach(o => { if (o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o.visible) { o.visible = false; hidReal.push(o); } });
  qsa("[data-hfloor]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfloor === hfloor)));
  const fl = qs("#r3d-floors"); if (fl) fl.hidden = !on;
  // v64, client: "make sure I can take this off when needed so I can look at just my own house" and "whole house plus gardens": in
  // The whole house the gardens (both, the alley, the street in front) and next door only when switched on; inside a room, the gardens
  // show through its windows
  const showG = !on || !!S.hgarden;
  if (HFLOOR.out) HFLOOR.out.visible = showG;
  if (garden3d && houseG.visible) garden3d.visible = showG;
  if (HFLOOR.street) HFLOOR.street.visible = !!S.hstreet;
  if (HFLOOR.nextThings) HFLOOR.nextThings.visible = !!S.hstreet;
  qsa("[data-htog]").forEach(b => b.setAttribute("aria-pressed", String(!!S[b.dataset.htog])));
  const fv = qs("#r3d-fview"); if (fv) { fv.hidden = !on; qsa("[data-hfview]", fv).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === hfview))); }   // v74
  syncRmode();   // v71
  /* v73, the client: "still extremely slow": standing in a room, only what can be seen from it is drawn: its own floor, the group with
     its ceiling (the lower floor's are in the ground floor's, the first floor's in the roof's), the floor its stairs lead to (the landing,
     the hall), the outside through its windows; the living room only from the landing (v81: down the stairwell) */
  if (INSIDE() && R.HOUSE3.rooms) {   // V1.10: Be there too (it drew the whole house)
    const rid = VIEW_ROOM[S.view], rr = R.HOUSE3.rooms[rid];
    if (rr) {
      const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(rr[4])];
      const see = new Set([fk, { lower: "ground", ground: "first", first: "roof" }[fk], "out", "street", "nextThings"]);   // V1.47: the outside by evening too, in the evening's light (V1.15 hid it: it stayed in daylight)
      for (const k of ["street", "nextThings"]) if (HFLOOR[k]) HFLOOR[k].visible = true;   // V1.10: next door and the street through the windows
      if (rid === "landing") see.add("ground");
      if (rid === "hall") see.add("lower");
      for (const [k, g] of Object.entries(HFLOOR)) if (!see.has(k) && g.visible) { g.visible = false; hidReal.push(g); }
      // v81: the hall and the garage don't see it either (its door is shut; the hall has the door's own face): 600 draws there, now 160
      const lr = o => o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o !== view && o.visible;
      const peek = rid === "hall" && doorOpen(HPARTS["door.living_door"]);   // V1.38: its door open, the living room through it
      if (rid !== "landing" && !peek) scene.children.forEach(o => { if (lr(o)) { o.visible = false; hidReal.push(o); } });
      else if (rid === "landing") {   // v81: from the landing (its eye at x 402 or less) the living room shows only down the stairwell (from 408): each piece clear of
        // the flight's side is left out of the camera's layer (not hidden, so a switch on or off meanwhile still holds): 556 draws, now about 250
        const lim = -(R.STAIR_X[0] - 3) * M, bb = new THREE.Box3(); scene.updateMatrixWorld();
        scene.children.forEach(o => { if (lr(o)) o.traverse(m => { if ((m.isMesh || m.isPoints || m.isLine) && !m.isInstancedMesh && m.layers.isEnabled(0)) {
          const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
          if (bb.copy(g.boundingBox).applyMatrix4(m.matrixWorld).min.x > lim) { m.layers.disable(0); hidLay.push(m); } } }); }); }
    }
  }
  if (houseG && R.HOUSE3 && S.view === "livstand") {   // V1.38: standing in the living room with its door open: the ground floor through it
    houseG.visible = doorOpen(HPARTS["door.living_door"]);
    if (houseG.visible) for (const [k, g] of Object.entries(HFLOOR)) if (k !== "ground" && g.visible) { g.visible = false; hidReal.push(g); }
  }
  drawRooms(); brandPlace(); outdoor();
  requestAnimationFrame(() => { measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())); fadeRows(); });   // V1.30: the rows above may have changed
  dirty();
}
/* V1.30 (U3): a row with more to slide to fades at its right edge */
function fadeRows() { qsa(".r3d-floors:not(.r3d-rmode)").forEach(el => el.classList.toggle("more", el.scrollWidth - el.clientWidth - el.scrollLeft > 4)); }
document.addEventListener("scroll", e => { if (e.target.classList && e.target.classList.contains("r3d-floors")) fadeRows(); }, true);
/* V1.2: the brand's second line says where you are: the whole house, a floor, a room */
function brandPlace() {
  /* V1.30 (U3): only the tools that work where you are: in the house's views Room, Look and Edit (the living room's) step aside; in the
     house's own rooms Plan · Build · Buy too (the media wall's plan) */
  const hv = HOUSEV(S.view), hr = !!ROOMV(); document.body.classList.toggle("hv", hv); document.body.classList.toggle("hroom", hr);
  if (hv && window.DemmaTools && DemmaTools.isOpen() && ["room", "look"].some(k => { const d = qs("#r3d-dp-" + k); return d && !d.hidden; })) DemmaTools.close();
  const el = document.getElementById("brand-place"); if (!el) return;
  let t = "The living room";
  if (S.view === "house") t = { first: "The first floor", ground: "The ground floor", lower: "The lower floor" }[hfloor] || "The whole house";
  else if (ROOMV()) { const id = VIEW_ROOM[S.view], L = id && id !== "living" && Object.values(R.HOUSE3.floors).flatMap(F => F.labels || []).find(l => l.id === id); t = (L && L.name) || (VIEWS[S.view] || {}).label || t; }
  el.textContent = t;
  canvas.setAttribute("aria-label", `${t} in 3D: drag to look round, scroll or pinch to zoom; standing (Be there), W A S D or the arrow keys walk, Q and E turn`);   // V1.43: says where you are (it always said the living room)
}
/* v64, client: "by floor individually where you can choose to pick a room to focus on": on a floor, its rooms as buttons; a room with
   its own view goes into it, the others are looked at from above */
const ROOM_VIEW = { living: "room", kitchen: "kitchen", bed3: "office", bed2: "bed2", master: "master", bathroom: "bath",
  landing: "landing", hall: "hall", garage: "garage", wc: "wc" };   // v66: every room a person stands in has its own view
/* v74, the client: "let me view overhead and the default view for each floor as a whole too": a floor picked (or the whole house),
   Angled looks at it from the house view's direction, Overhead from straight above, each far enough to take in all its rooms */
/* V1.54, the client: "make sure this new view mode works on iPhones and most mobiles": on a phone the floors' and rooms' buttons take the
   top of the screen and the dock its foot, so a view from above is framed into what's left between them: [its share of the height, how
   far its middle sits below the screen's (px)] */
function freeFrame() {
  if (camera.aspect >= 1 || typeof stage === "undefined" || !stage) return [1, 0];
  const st = stage.getBoundingClientRect(), H = st.height; let top = 0, bot = 0;
  for (const el of document.querySelectorAll(".brand, .r3d-mini, #r3d-floors, #r3d-hrooms, #r3d-rmode, .hnav")) { const r = el.getBoundingClientRect();
    if (r.width && r.height && r.bottom - st.top < H * 0.5) top = Math.max(top, r.bottom - st.top); }
  const dk = document.querySelector(".r3d-dock"); if (dk) { const r = dk.getBoundingClientRect(); if (r.height && r.top - st.top > H * 0.5) bot = st.bottom - r.top; }
  return [Math.max(0.4, (H - top - bot) / H), (top - bot) / 2];
}
function fromAbove(cx, y, cz, dist, fov) {  // straight down on (cx, y, cz) from dist (cm) over it, into the free part of a phone's screen
  const house = S.view === "house";       // over the house, measureShift's view offset already centres it between them (V1.30): kept up to date, the size only here
  if (house && typeof measureShift === "function") measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen()));
  const [k, sh] = freeFrame(), D = dist / k, oz = house ? 0 : -sh * 2 * D * Math.tan(fitFov(fov) * Math.PI / 360) / Math.max(1, stage ? stage.clientHeight : 1);   // the screen's up is -z
  flyTo([cx, y + D, cz + 1 + oz], [cx, y, cz + oz], fov, true, REDUCE);
}
function floorCam() {
  if (S.view !== "house" || !R.HOUSE3) return;
  if (hfloor === "all" && hfview === "angle") { setView("house"); return; }
  const fy = { first: 260, ground: 0, lower: -260 }[hfloor] ?? 0;
  // v80: the living room too (it's drawn on its own, not in the house's rooms): the ground floor's Overhead left it out of the picture
  const rs = [...Object.values(R.HOUSE3.rooms || {}), [0, R.W, R.WINDOW_Z, R.RECESS_Z, 0]].filter(r => hfloor === "all" || r[4] === fy);
  if (!rs.length) return;
  const x0 = Math.min(...rs.map(r => r[0])), x1 = Math.max(...rs.map(r => r[1])), z0 = Math.min(...rs.map(r => r[2])), z1 = Math.max(...rs.map(r => r[3]));
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, y = hfloor === "all" ? 540 : fy;
  const fit = (fov, sx, sy) => { const v = fitFov(fov) * Math.PI / 360, h = Math.atan(Math.tan(v) * camera.aspect); return (camera.aspect < 1 ? 1.12 : 1.25) * Math.max(sx / 2 / Math.tan(h), sy / 2 / Math.tan(v)); };
  // V1.53, the client: "improve overhead views": a long lens from high up (the walls stand straight, not leaning out), and from above (flyTo's
  // fourth is "above": REDUCE there had held the eye to 6 m, so a floor never fitted)
  if (hfview === "top") { fromAbove(cx, y, cz, 60 + fit(26, w, d), 26); return; }   // V1.29 (U2): flown, not cut
  const H = VIEWS.house, dir = new THREE.Vector3(H.eye[0] - H.at[0], H.eye[1] - H.at[1], H.eye[2] - H.at[2]).normalize();
  const r = 0.5 * Math.hypot(w, d, 235), v = 25 * Math.PI / 180, hh = Math.atan(Math.tan(v) * camera.aspect), D = (camera.aspect < 1 ? 0.5 : 0.9) * r / Math.sin(Math.min(v, hh));   // the floors below show under it too (V1.53: a phone closer, now it's not held to 6 m)
  flyTo([cx + dir.x * D, y + dir.y * D, cz + dir.z * D], [cx, y + 40, cz], 50, true, REDUCE);
}
function drawRooms() {
  const box = qs("#r3d-hrooms"); if (!box) return;
  const on = S.view === "house" && hfloor !== "all" && !!R.HOUSE3;
  box.hidden = !on; if (!on) return;
  const list = ((R.HOUSE3.floors[hfloor] || {}).labels || []).slice();
  if (hfloor === "ground") list.unshift({ id: "living", name: "Living room" });
  const key = hfloor + list.length;
  if (box.dataset.k === key) return;
  box.dataset.k = key;
  box.innerHTML = list.map(L => `<button type="button" data-hroom="${L.id}">${L.name}</button>`).join("");
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-hfloor]"); if (b) { hfloor = b.dataset.hfloor; applyFloors(); floorCam(); return; }
  const fvb = e.target.closest("[data-hfview]"); if (fvb) { hfview = fvb.dataset.hfview; applyFloors(); floorCam(); return; }   // v74
  if (e.target.closest("#r3d-pick")) { setBare(!document.body.classList.contains("bare")); return; }
  const tg = e.target.closest("[data-htog]"); if (tg) { S[tg.dataset.htog] = !S[tg.dataset.htog]; store.set(KEY, S); applyFloors(); return; }
  const r = e.target.closest("[data-hroom]"); if (!r || !R.HOUSE3) return;
  const id = r.dataset.hroom, v = ROOM_VIEW[id];
  if (v) { setView(v); return; }
  const L = ((R.HOUSE3.floors[hfloor] || {}).labels || []).find(l => l.id === id); if (!L) return;
  flyTo([L.x + 30, L.y + 520, L.z + 280], [L.x, L.y - 150, L.z], 50, true);
});
let livLeaf = null;   // V1.38: the living room door's leaf (turned with the house's door.living_door)
let winGlass, sun, view, ledMat, ceilGlow, ceilMat, lboxFace, laserDots, runLed, curtOpen, curtShut, pcGlow, pcLight;
// v17: the PC lit up behind its clear side window: glowing fan rings (three front, one rear), an RGB strip along the top, a light inside
function pcLit() {
  const [cw, ch, cd] = R.PC_CASE, [cz1, cz0] = R.PC_Z, st = R.PC_SHELF_TOP, x = 2.5 + cw - 4.2;
  pcGlow = new THREE.Group();
  const ringM = new THREE.MeshBasicMaterial({ color: "#3fe3b0", toneMapped: false }), rgbM = new THREE.MeshBasicMaterial({ color: "#b46cff", toneMapped: false });
  const ring = (y, z, r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r * M, 0.0035, 8, 32), ringM); m.position.copy(v3(x, y, z)); m.rotation.y = Math.PI / 2; pcGlow.add(m); };
  for (const y of [st + 11, st + 23.5, st + 36]) ring(y, cz1 - 2.6, 5.2);
  ring(st + 36, cz0 + 2.2, 4.8);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, (cd - 6) * M), rgbM); strip.position.copy(v3(2.5 + cw - 1.5, st + ch - 2, (cz0 + cz1) / 2)); pcGlow.add(strip);
  const ramM = new THREE.MeshBasicMaterial({ color: "#ff5ad1", toneMapped: false });
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.007), ramM); r.position.copy(v3(4.5, st + 37.2, cz0 + 21.85 + k * 1.3)); pcGlow.add(r); }
  shell.add(pcGlow);
  pcLight = new THREE.PointLight("#9d7bff", 3, 0.6, 2); pcLight.userData.accent = 3; pcLight.position.copy(v3(2.5 + cw / 2, st + ch / 2, (cz0 + cz1) / 2)); shell.add(pcLight);
}
// v17: "i also have deep window sills that allow for lots of plants there": a row of pots along the sill, upright and trailing
