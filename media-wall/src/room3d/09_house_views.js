let houseG = null;     // v54: the whole house, drafted (The whole house view)
const HOUSEV = n => n === "house" || (!!R.HOUSE3 && !!(VIEWS[n] || {}).box);   // v60: the views that show the built house (a room's own, from inside it)
const ROOMV = () => R.HOUSE3 && (VIEWS[S.view] || {}).box;                       // v61: in one of the house's rooms: its walls keep the eye in
/* v78b: the living room is drawn on its own, so its In it, Above and On its own are its own views */
const LIV_RMODE = { in: "window", stand: "livstand", above: "room", alone: "livalone" };
/* V1.6: Be there, in every room: from its door at eye height, a wide lens, level; a drag looks round from there */
const STAND_FOV = 80, STAND_EYE = 160, GO_MS = 550;   // V2.42: a double-click's glide there (0.9 s before)
let standCam = null, standSpot = null;   // V1.53: standSpot, where a double-click or the figure puts you down ([x, z, dx, dz], room cm)
function standLook(on) {
  if (on) { if (standCam === null) standCam = S.cam; S.cam = "look"; }
  else if (standCam !== null) { S.cam = standCam; standCam = null; } else return;
  applyCam(false); syncButtons();
}
function standIn() {
  const v = VIEWS[S.view], rr = ((R.HOUSE3 && R.HOUSE3.rooms) || {})[VIEW_ROOM[S.view]], fy = rr ? rr[4] : 0;
  standLook(true);
  if (standSpot) { const [x, z, dx, dz, ms] = standSpot; standSpot = null;   // V2.42: as quick as asked (it was always 0.9 s: the client, "no slow change of view")
    flyTo([x, fy + STAND_EYE, z], [x + dx * 100, fy + STAND_EYE - 10, z + dz * 100], STAND_FOV, false, false, ms || GO_MS); return; }
  const [x, z] = R.HOUSE3 ? freeSpot(v.eye[0], fy, v.eye[2]) : [v.eye[0], v.eye[2]];   // V1.59: not inside a worktop or a desk
  hereRoom = ((R.HOUSE3 && standRoomAt(x, fy + 1, z)) || [VIEW_ROOM[S.view]])[0]; brandPlace();
  flyTo([x, fy + STAND_EYE, z], [v.at[0] + x - v.eye[0], fy + STAND_EYE - 10, v.at[2] + z - v.eye[2]], STAND_FOV, false, false, 600);
}
const LIVV = () => !HOUSEV(S.view) && !!VIEWS[S.view];
/* V2.43: a room you pick stands you in it at your eyes (Be there); In it, Above and On its own a tap away. R3D.set, the tour and links
   keep each view as it is */
function goRoom(v, now, after) {
  if (v === "room") v = "livstand";
  if (!now) return readyThen(v, () => { goRoom(v, true); if (after) after(); });   // V3.23: its shaders built first where they aren't (no freeze on a PC)
  const far = S.view === "house" || !HOUSEV(S.view) !== !HOUSEV(v);
  setView(v); if (VIEWS[v] && VIEWS[v].box) setRmode("stand");
  if (tween && far) tween.dur = Math.max(tween.dur, 1100);   // from the whole house, a glide in, not a dive
}
/* V2.96 (N39): a room is a step in the history, so Back brings you out to the house, not off the site (setView calls roomHist) */
const HIST = Math.random().toString(36).slice(2);
let histPop = false, histBack = false;
function roomHist() {
  if (!started || histPop || histBack || !R.HOUSE) return;   // a step back on its way: its popstate syncs
  const st = history.state || {};
  try {
    if (S.view !== "house") { if (st.r3d) history.replaceState({ ...st, r3d: S.view }, ""); else history.pushState({ r3d: S.view, k: HIST }, ""); }
    else if (st.r3d && st.k === HIST) { histBack = true; history.back(); }
    else if (st.r3d) history.replaceState(null, "");
  } catch (e) {}
}
addEventListener("popstate", e => {
  if (!started || !R.HOUSE) return;
  if (histBack) { histBack = false; roomHist(); return; }   // our own step back: if a room was picked meanwhile, its step again
  const v = (e.state && e.state.r3d) || "house";
  if (v === S.view || (v !== "house" && !VIEWS[v])) return;
  histPop = true; try { if (v === "house") wholeRoom(); else goRoom(v, true); } finally { histPop = false; }
});
function syncRmode() {
  if (typeof syncStick === "function") try { syncStick(); } catch (e) {}   // V1.32: the walk's stick
  const rm = qs("#r3d-rmode"); if (!rm) return;
  const liv = LIVV(), cur = liv ? (S.view === "room" ? "above" : S.view === "livalone" ? "alone" : S.view === "livstand" ? "stand" : "in") : RMODE;
  rm.hidden = !(ROOMV() || liv); qsa("[data-rmode]", rm).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.rmode === cur)));
}
const HFLOOR = {};     // v55: its floors (lower, ground, first) and the outside (gardens, the alley), for the floor picker
const OUTLAZY = {};   // N181: what's built the first time it shows (20_go buildHouse: the gardens, next door's things)
function outNeed(k) { const f = OUTLAZY[k]; if (!f) return; delete OUTLAZY[k]; f(); reshadow(); }
let hfloor = "all", hidReal = [], hidLay = [], hfview = "angle";   // v74: a floor seen from an angle or from straight above
const ROOMLIGHTS = [], WINLIGHTS = [];   // v69 (B3): warm ceiling lights round the room you're in (a fixed set: no shader rebuilds); V2.39: and windows'. V3.57: six and three (Fast four and none)
let roomKey = "";
/* V3.57 (N108): every room's lights on, each at its own room's level, whichever room you're in: the set holds the room's own and its
   nearest neighbours' (its floor first), so nothing dims or brightens through a door; each light reaches about its own room */
const LK = 0.65, WK = 40;   // V3.57: the ceiling lights and the windows with the neighbours on: about as bright as before, one room lit alone
function roomArea(id) { const r = R.HOUSE3.rooms && R.HOUSE3.rooms[id]; return r ? (r[1] - r[0]) * (r[3] - r[2]) / 1e4 : 10; }
function roomReach(id) { const r = R.HOUSE3.rooms && R.HOUSE3.rooms[id]; return r ? Math.min(7, Math.max(3.6, Math.hypot(r[1] - r[0], r[3] - r[2]) * M * 1.1 + 1.2)) : 7; }
function lightAt(l, L, day, hd) {   // one light, as its own room has it
  const fb = typeof finBulb === "function" && L.room ? finBulb(L.room) : { k: null, lux: 1 };   // V2.9: the room's bulbs (23_finish.js)
  if (L.reach) { l.distance = L.reach * M; l.position.copy(v3(L.x, L.y, L.z)); l.intensity = day ? 0 : L.k * fb.lux; l.color.set(L.col); return; }   // V2.48: a lamp, by evening
  const ks = Math.min(1.3, Math.max(0.75, Math.sqrt(roomArea(L.room) / 10)));   // v72 (B2): a big room's light reaches its corners, a small one doesn't glare
  const drop = L.drop != null && !(typeof finGet === "function" && finGet(L.room, 8)) ? L.drop : typeof finFitDrop === "function" ? finFitDrop(L.room) : 40;   // the kitchen's battens are flush
  l.distance = roomReach(L.room);
  l.position.copy(v3(L.x, L.y - drop, L.z)); l.intensity = (day ? 3 : hd ? 8.6 : 5.4) * LK * ks * fb.lux * (L.drop != null ? 0.6 : 1);   // two battens share the room's light; LK: the neighbours on too, each a little less (as bright as one room lit alone)
  if (fb.k) l.color.set(kelvinHex(+fb.k)); else l.color.copy(warmColour());   // V3.19: the living room's bulbs' colour (one Warmth for the house) unless the room's own
}
/* V3.76 (N116): a lit bulb's faint warm glow on the ceiling round it: one shared additive disc a pendant, in the room's pendant group;
   shown in a room only (no shader in the first picture) */
let HALO = null;
function bulbHalos() {
  if (HALO || !R.HOUSE3 || !Object.keys(FIN_PEND).length) return HALO;
  const tex = canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,0.42)"); r.addColorStop(0.65, "rgba(255,255,255,0.1)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: "#ffcf98", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  HALO = { mat, ms: [] };   // V3.77: the meshes hidden, not the material: a hidden material's shader was still built for the first picture (21 to 22); hidden meshes wait for the idle warm-up (precompile)
  const geo = new THREE.CircleGeometry(48 * M, 28); geo.rotateX(Math.PI / 2);   // facing down
  for (const F of Object.values(R.HOUSE3.floors)) for (const L of F.lights || []) { const g = FIN_PEND[L.room]; if (!g || L.drop != null) continue;
    const me = new THREE.Mesh(geo, mat); me.position.copy(v3(L.x, L.y + 1.6, L.z)); me.renderOrder = 4; me.userData.halo = true; me.visible = false; g.add(me); HALO.ms.push(me); }
  return HALO;
}
function haloShow() {
  const h = bulbHalos(); if (!h) return;
  const on = !!ROOMV() && (RMODE === "in" || RMODE === "stand") && !(HMATS && HMATS.ceiling && !HMATS.ceiling.visible), day = S.tod === "day";
  for (const me of h.ms) me.visible = on; if (!on) return;
  h.mat.color.copy(warmColour()); h.mat.opacity = day ? 0.1 : 0.26;
}
/* v69: in a room of the house, its ceiling lights on and the sun's shadow box over it */
function placeRoomLights() {
  if (!ROOMLIGHTS.length || !sun) return;
  haloShow();   // V3.76 (N116)
  const v = VIEWS[S.view] || {}, b = R.HOUSE3 && v.box, day = S.tod === "day", hd = S.quality === "hd";
  const rid = b && VIEW_ROOM[S.view], rr = rid && R.HOUSE3.rooms && R.HOUSE3.rooms[rid];
  const list = [];
  if (b) { const cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2, cz = (b[4] + b[5]) / 2;
    const seen = typeof roomSees === "function" ? roomSees([rid]) : new Set();   // the rooms seen from it (open doors, a flight's top or foot: the hall's lower flight and landing, the client's "Lit stairs and landing below") before the rest
    const near = L => (L.room === rid ? -1e6 : seen.has(L.room) ? -5e5 : 0) + Math.hypot(L.x - cx, L.z - cz) + Math.abs(L.y - cy) * 3;
    for (const F of Object.values(R.HOUSE3.floors)) { for (const L of F.lights || []) list.push([near(L), L]);
      if (!day) for (const L of F.lamps || []) list.push([near(L) + (L.room === rid ? 1000 : 400), L]); }   // a room's lamp after its ceiling light
    list.sort((p, q) => p[0] - q[0]); }
  const n = hd ? ROOMLIGHTS.length : Math.min(4, ROOMLIGHTS.length);   // Fast: four (20_go.js: the last two are HD's)
  ROOMLIGHTS.forEach((l, k) => { const L = k < n && list[k] && list[k][1]; l.visible = !!L; if (L) lightAt(l, L, day, hd); });
  /* V2.39 (R1): a window lights the room as the sky does through it, an area light the opening's size facing in and a little down.
     V3.57: the room's two biggest, then the nearest room's biggest */
  const op = it => it.op && it.op.axis === "x" && it.op, sz = it => (it.op.b - it.op.a) * (it.op.y1 - it.op.y0);
  let ws = [];
  if (rr) { const cx = (b[0] + b[1]) / 2, cz = (b[4] + b[5]) / 2, all = Object.values(R.HOUSE3.items || {}).filter(it => it.k === "window" && op(it) && R.HOUSE3.rooms[it.r]);
    const own = all.filter(it => it.r === rid).sort((p, q) => sz(q) - sz(p)).slice(0, 2);
    const dist = it => { const r = R.HOUSE3.rooms[it.r]; return Math.hypot((r[0] + r[1]) / 2 - cx, (r[2] + r[3]) / 2 - cz) + Math.abs(r[4] - rr[4]) * 3 - sz(it) / 1e3; };
    ws = own.concat(all.filter(it => it.r !== rid).sort((p, q) => dist(p) - dist(q))).slice(0, WINLIGHTS.length); }
  /* V3.30 (living room quality): by day 60, the living room's window's 70 for its size (10 left the rooms flat, lit by the even fill) */
  WINLIGHTS.forEach((l, k) => { const it = ws[k], o = it && it.op; l.visible = !!o; if (!o) return; const r = R.HOUSE3.rooms[it.r];
    const cx = (o.a + o.b) / 2, cy = (o.y0 + o.y1) / 2, d = Math.sign((r[2] + r[3]) / 2 - o.line) || 1;
    l.width = (o.b - o.a) * M; l.height = (o.y1 - o.y0) * M; l.position.copy(v3(cx, cy, o.line + d * 3)); l.lookAt(v3(cx, cy - 40, o.line + d * 100));
    l.intensity = day ? WK : 3; l.color.set(day ? "#eef0f2" : "#7d89b8"); });   // V3.57: WK, the neighbours' windows on too
  const key = b ? b.join() : "";
  if (key === roomKey) return; roomKey = key;
  const d = b ? v3((b[0] + b[1]) / 2, 0, (b[4] + b[5]) / 2).sub(sun.userData.t0).setY(0) : new THREE.Vector3();
  sun.position.copy(sun.userData.p0).add(d); sun.target.position.copy(sun.userData.t0).add(d);
  /* V3.33 (N85): a room whose biggest window looks out of the front has the front's sun, its patch on the floor */
  if (ws[0] && ws[0].r === rid && ws[0].op.line > (rr[2] + rr[3]) / 2) { const t = v3((b[0] + b[1]) / 2, b[2], (b[4] + b[5]) / 2);
    sun.target.position.copy(t); sun.position.copy(t).addScaledVector(dayLight.position.clone().sub(dayLight.target.position).normalize(), sun.userData.p0.distanceTo(sun.userData.t0)); }
  sun.target.updateMatrixWorld();
  reshadow();
}
/* v73: one neutral room reflection, made once, on the house's materials from the start (v69's per-room cube camera froze PCs) */
let HMATS = null, HENV = null;
/* V1.31 (U6): the house's materials one-sided (every piece a closed solid); ?double for the old way */
const HOUSE_SIDE = /[?&]double\b/.test(location.search) ? THREE.DoubleSide : THREE.FrontSide;
function houseEnv() {
  if (!HENV) { const pm = new THREE.PMREMGenerator(gl), rs = new RoomEnvironment(); HENV = pm.fromScene(rs, 0.04).texture; pm.dispose(); rs.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  return HENV;
}
/* V3.57 (N107): the hall's and bathroom's mirrors show their room: in HD, once you've paused, the room drawn round the mirror a face a
   frame (six, never while you move), blurred as the house's reflection; no shader added. Again for the evening */
const MIR = { done: {}, face: 0, key: null, cc: null, rt: null, white: null };
const NOMIR = /[?&]nomirror\b/.test(location.search);   // ?nomirror: the painted sheen, as before
const MIRROR_AT = { hall: "hall.mirror", bathroom: "bath.mirror" };
function mirrorStep() {
  const here = RMODE === "stand" ? hereRoom : VIEW_ROOM[S.view], m = HMATS && HMATS.mirror, it = MIRROR_AT[here], b = it && R.HOUSE3 && R.HOUSE3.items && R.HOUSE3.items[it] && R.HOUSE3.items[it].b;
  if (!m || !b || !postLive() || NOMIR || !ROOMV() || !(RMODE === "in" || RMODE === "stand") || !m.envMap) return false;
  const key = here + S.tod;
  if (MIR.done[here] && MIR.done[here].key === key) { if (m.envMap === MIR.done[here].tex) return false; mirrorUse(m, MIR.done[here].tex); return true; }
  if (MIR.key !== key) { MIR.key = key; MIR.face = 0; }
  if (!MIR.rt) { MIR.rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType }); MIR.cc = new THREE.CubeCamera(0.03, 40, MIR.rt); }
  const cc = MIR.cc; if (cc.coordinateSystem !== gl.coordinateSystem) { cc.coordinateSystem = gl.coordinateSystem; cc.updateCoordinateSystem(); }
  cc.position.copy(v3(b[0] - 4, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2)); cc.updateMatrixWorld(true);   // just in front of the glass (both face into their rooms, -x)
  const prev = gl.getRenderTarget(), vis = m.visible; m.visible = false;
  gl.setRenderTarget(MIR.rt, MIR.face); gl.render(scene, cc.children[MIR.face]); gl.setRenderTarget(prev); m.visible = vis;
  if (++MIR.face < 6) return true;
  MIR.face = 0; const pm = new THREE.PMREMGenerator(gl), tex = pm.fromCubemap(MIR.rt.texture).texture; pm.dispose();
  const old = MIR.done[here]; MIR.done[here] = { key, tex }; mirrorUse(m, tex); if (old && old.tex !== tex) old.tex.dispose();
  return true;
}
const mirWhite = () => MIR.white || (MIR.white = canvasTex(4, 4, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); }, true));
function mirrorUse(m, tex) {
  m.userData.real = true; m.envMap = tex; m.envMapIntensity = 1; m.metalness = 1; m.roughness = 0.03; m.color.set("#f4f6f6"); m.map = mirWhite(); dirty();
}
/* N185: until the room lands (and on Fast) the glass shows a plain room at once (the stock neutral one reflects as flat grey): cream walls,
   a pale ceiling and its light, a darker floor, a window and a door, made as the neutral room is (its plain kind of material: no shader
   added). A slight green-grey tint. A phone drawn lighter has no reflection: the painted sheen stays */
function mirrorRoom() {
  if (MIR.room) return MIR.room;
  const sc = new THREE.Scene(), box = new THREE.BoxGeometry(1, 1, 1), lin = (c, k) => new THREE.Color(c).multiplyScalar(k);
  const put = (col, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: col })); o.position.set(x, y, z); o.scale.set(sx, sy, sz); sc.add(o); };
  const wall = lin("#efe6d6", 1), band = lin("#a89a88", 1);   // the room round the camera (the glass looks along -x into its room)
  for (const [x, z, sx, sz] of [[-2.1, 0, 0.2, 4.4], [2.1, 0, 0.2, 4.4], [0, -2.1, 4.4, 0.2], [0, 2.1, 4.4, 0.2]]) {
    put(wall, x, 0, z, sx, 4, sz); put(band, x * 0.97, -1, z * 0.97, sx, 1.2, sz); }                     // walls, a tiled band below
  put(lin("#f6f3ec", 1.1), 0, 1.6, 0, 4.4, 0.2, 4.4); put(lin("#5e554b", 1), 0, -1.6, 0, 4.4, 0.2, 4.4);   // ceiling, floor
  put(lin("#ffffff", 6), 0, 1.48, 0, 0.5, 0.04, 0.5);                                                       // its light
  for (const [x, z, a] of [[-1.98, 1, 0], [0.4, 1.98, 1]]) { const w = a ? [1.4, 1.1, 0.04] : [0.04, 1.1, 1.2];
    put(lin("#fbfbf8", 1), x, 0.45, z, w[0] + 0.12 * a, 1.22, w[2] + 0.12 * (1 - a)); put(lin("#eaf0f4", 3.2), x * 0.995, 0.45, z * 0.995, ...w);   // two windows in white frames,
    put(lin("#fbfbf8", 1), x * 0.99, 0.45, z * 0.99, a ? 0.05 : 0.04, 1.1, a ? 0.04 : 0.05); }                                              // a bar up the middle
  put(lin("#7d6a55", 1), -1.9, -0.35, -0.9, 0.04, 2.3, 0.85); put(lin("#f4f1ea", 1.2), 1.98, 0.2, -0.6, 0.04, 0.9, 1.4);   // a wood door, a pale cabinet
  const pm = new THREE.PMREMGenerator(gl); MIR.room = pm.fromScene(sc, 0).texture; pm.dispose();
  box.dispose(); sc.traverse(o => { if (o.material) o.material.dispose(); });
  return MIR.room;
}
function mirrorFirst(m) {
  if (!m.envMap || NOMIR) return;
  m.envMap = mirrorRoom(); m.userData.real = true; m.userData.envK = 6.25;   // real: the stock room never swapped back in (11_lights); envLevels: 0.16 × 6.25
  m.metalness = 1; m.roughness = 0.04; m.color.set("#e2eae8"); m.map = mirWhite(); m.envMapIntensity = 1;
}
const finishEnv = m => m.userData.hk === "glass" ? (S.tod === "day" ? 0.3 : 0.75) : m.userData.hk === "screen" ? 0.18 : m.roughness <= 0.3 ? 0.9 : m.roughness <= 0.6 ? 0.6 : 0.45;   // v72 (B3): gloss, satin, matt; V3.32 (N82): a screen that's off dark glass, as the living room's TV (the bright stock room in it read as a whiteboard)
let HENVK = 1;
/* V3.52 (N104): the glass by the time of day: frosted glows by day, dark with the room's light by evening; clear catches more of the room
   by evening. Colours and strengths only */
function glassTod(m) {
  const k = m.userData.hk, day = S.tod === "day";
  if (k === "glass_frost") { m.opacity = 0.97; m.depthWrite = true;   // all but opaque: it hides the dusk veil behind it (the veil drew over it as flat navy)
    m.color.set(day ? "#e8edef" : "#69717f"); m.emissive.set(day ? "#eef0e6" : "#1f2738"); m.emissiveIntensity = day ? (S.view === "house" ? 0.35 : 1.9) : 0.6; }   // from outside by day a pale pane, not a lamp
  if (k === "glass") m.opacity = day ? 0.14 : 0.3;
  if (m.envMap && (k === "glass" || k === "glass_frost")) m.envMapIntensity = finishEnv(m) * HENVK;
}
/* the street's evening (buildStreet): its lamps and a third of the windows opposite lit warm; an emissive each, no shader built */
const STREET_LIT = [];
const streetTod = () => { const eve = S.tod !== "day"; for (const m of STREET_LIT) { m.emissive.set(m.userData.glowCol); m.emissiveIntensity = eve ? m.userData.glow : 0; } };
const glassAll = () => { if (HMATS) for (const k of ["glass", "glass_frost"]) if (HMATS[k]) glassTod(HMATS[k]); streetTod(); };
function houseEnvK(k) {   // V2.21 (REAL_PLAN R1): the house's reflections scaled (an evening in a room: its own light leads)
  if (!HMATS || k === HENVK) return; HENVK = k;
  for (const m of Object.values(HMATS)) if (m && m.envMap && "envMapIntensity" in m) m.envMapIntensity = m.userData.real ? 1 : finishEnv(m) * k;   // V3.57: a mirror shows its room as it is
  for (const m of paintMats.values()) if (m && m.envMap && m.userData.hk) m.envMapIntensity = finishEnv(m) * k;
}
let RMODE = "in", hidMode = [], RPLANES = [];   // v71: how a room of the house is seen (in it, above, on its own) and what that put away
const FIN_PEND = {};   // V2.15 (FINISHES F5): each room's own ceiling light, its own group (20_go.js), for a fitting to stand in for it
const HPARTS = {};     // v68: the house's moving pieces (the master bedroom's ottoman lid), each its own group on its hinge
/* v55: the floor picker. All lifts the floors apart; First, Ground and Lower show the house up to that floor (Lower takes the living
   room off too); only the top floor's labels show, or every floor's in All */
function applyFloors() {
  if (!houseG) return;
  const on = S.view === "house", sel = on ? hfloor : "all", ex = sel === "all" && !R.HOUSE3 ? 330 : 0;   // v58: Outside, the house closed (no lifting)
  if (houseG.visible) { if (!on || S.hgarden) outNeed("out"); if (!on || S.hstreet) outNeed("nextThings"); }   // N181: built the first time they show
  /* V2.10: the first floor on its own keeps its roof's group (gable, dormer cheeks, slopes), only the coverings and ceilings off */
  const roofWalls = sel === "first";
  if (HFLOOR.roof) HFLOOR.roof.visible = sel === "all" || roofWalls;
  if (HMATS) for (const k of ["tile", "ridge", "felt", "lead", "ceiling", "artex", "shade_ceil"]) { const m = HMATS[k]; if (!m) continue;
    if (roofWalls && m.visible) { m.visible = false; m.userData.offForFloor = true; } else if (!roofWalls && m.userData.offForFloor) { m.visible = true; m.userData.offForFloor = false; } }
  if (HMATS && !livClipOn) {   // and cut at its ceiling's height (the party wall's plaster runs on up the gable to the ridge)
    if (!FLCLIP) FLCLIP = [new THREE.Plane(new THREE.Vector3(0, -1, 0), ((R.HOUSE3 && R.HOUSE3.rooms.landing) ? R.HOUSE3.rooms.landing[4] + (R.HOUSE3.ceil || 235) + 3 : 498) * M)];
    floorCut(true);   // V3.68: every floor on its own is cut (at its ceiling, lower as the eye comes down)
    for (const m of Object.values(HMATS)) { const was = CLIPSRC.get(m) || [], want = sel !== "all" ? FLCLIP : (was === FLCLIP ? RPLANES : was);
      if (want !== was) houseClip(m, want, false); } }
  if (HFLOOR.first) { HFLOOR.first.position.y = ex * M; HFLOOR.first.visible = sel === "all" || sel === "first"; }
  if (HFLOOR.lower) HFLOOR.lower.position.y = -ex * M;
  if (HFLOOR.ground) HFLOOR.ground.visible = sel !== "lower";
  const top = sel === "all" ? null : sel;
  for (const k of ["lower", "ground", "first", "out"]) if (HFLOOR[k]) HFLOOR[k].traverse(o => { if (o.userData.hlabel) o.visible = labelsOn && (k === "out" ? on : (top ? top === k : !R.HOUSE3)); });   // v57: Hide labels hides these too
  if (rmodeG) rmodeG.traverse(o => { if (o.userData.rlabel) o.visible = labelsOn; });   // v72 (B5): the room's name in Above
  hidReal.forEach(o => o.visible = true); hidReal = []; hidLay.forEach(o => o.layers.enable(0)); hidLay = [];
  roomUncull();   // V2.71 (N16)
  if (HMATS && HMATS.earth) HMATS.earth.visible = !(on && sel === "lower");   // V1.53: the earth over the secret room (under the garage) off, so the lower floor shows
  if (on && sel === "lower") scene.children.forEach(o => { if (o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o.visible) { o.visible = false; hidReal.push(o); } });
  qsa("[data-hfloor]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfloor === hfloor)));
  const fl = qs("#r3d-floors"); if (fl) fl.hidden = !on;
  // v64: in The whole house the gardens and next door only when switched on; inside a room they show through its windows
  const showG = !on || !!S.hgarden;
  if (HFLOOR.out) HFLOOR.out.visible = showG;
  if (garden3d && houseG.visible) garden3d.visible = showG;
  if (HFLOOR.street) HFLOOR.street.visible = !!S.hstreet;
  if (HFLOOR.nextThings) HFLOOR.nextThings.visible = !!S.hstreet;
  qsa("[data-htog]").forEach(b => b.setAttribute("aria-pressed", String(!!S[b.dataset.htog])));
  const fv = qs("#r3d-fview"); if (fv) { fv.hidden = !on; qsa("[data-hfview]", fv).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === hfview))); }   // v74
  syncRmode();   // v71
  /* v73: standing in a room, only what can be seen from it is drawn: its floor, the group with its ceiling, the floor its stairs lead to,
     the outside through its windows; the living room only from the landing (v81: down the stairwell) */
  if (INSIDE() && R.HOUSE3.rooms) {   // V1.10: Be there too (it drew the whole house)
    const rid = VIEW_ROOM[S.view], rr = R.HOUSE3.rooms[rid];
    if (rr) {
      const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(rr[4])];
      const see = new Set([fk, { lower: "ground", ground: "first", first: "roof" }[fk], "out", "street", "nextThings"]);   // V1.47: the outside by evening too, in the evening's light (V1.15 hid it: it stayed in daylight)
      for (const k of ["street", "nextThings"]) if (HFLOOR[k]) HFLOOR[k].visible = true;   // V1.10: next door and the street through the windows
      /* V3.49 (N101): a first-floor room with its door open onto the landing sees down the stairwell too, so it draws what the landing does */
      const well = rid === "landing" || (fk === "first" && roomSees([rid]).has("landing"));
      if (well) see.add("ground");
      if (rid === "hall") see.add("lower");
      for (const [k, g] of Object.entries(HFLOOR)) if (!see.has(k) && g.visible) { g.visible = false; hidReal.push(g); }
      // v81: the hall and the garage don't see it either (its door is shut; the hall has the door's own face): 600 draws there, now 160
      const lr = o => o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o !== view && o.visible;
      const peek = rid === "hall" && doorOpen(HPARTS["door.living_door"]);   // V1.38: its door open, the living room through it
      if (!well && !peek) scene.children.forEach(o => { if (lr(o)) { o.visible = false; hidReal.push(o); } });
      else if (well) {   // v81: from the landing (its eye at x 402 or less) the living room shows only down the stairwell (from 408): each piece clear of
        // the flight's side is left out of the camera's layer (not hidden, so a switch on or off meanwhile still holds): 556 draws, now about 250
        const lim = -(R.STAIR_X[0] - 3) * M, bb = new THREE.Box3(); scene.updateMatrixWorld();
        scene.children.forEach(o => { if (lr(o)) o.traverse(m => { if ((m.isMesh || m.isPoints || m.isLine) && !m.isInstancedMesh && m.layers.isEnabled(0)) {
          const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
          if (bb.copy(g.boundingBox).applyMatrix4(m.matrixWorld).min.x > lim) { m.layers.disable(0); hidLay.push(m); } } }); }); }
    }
  }
  if (houseG && R.HOUSE3 && S.view === "livstand") {   // V1.38: standing in the living room with its door open: the ground floor through it
    /* V2.0: looking up the stairs, the landing and its ceiling; the floors cut away below the landing over the room */
    const open = doorOpen(HPARTS["door.living_door"]); houseG.visible = true;
    for (const [k, g] of Object.entries(HFLOOR)) if (!(k === "first" || k === "roof" || (open && k === "ground")) && g.visible) { g.visible = false; hidReal.push(g); }
  }
  livClip(!!(houseG && houseG.visible && R.HOUSE3 && S.view === "livstand"));
  roomCull(false);
  drawRooms(); brandPlace(); outdoor();
  requestAnimationFrame(() => { measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())); fadeRows(true); });   // V1.30: the rows above may have changed
  dirty();
}
/* V2.71 (N16): standing in a room, of the floors shown only that room is drawn, the rooms seen from it (through open or glazed doors, at a
   flight's ends) and the walls, slabs, stairs and roof; the outside only where one has a window or a door out. A room left out is cut from
   its meshes by draw range (at most three twins sharing a buffer); a door that swings asks again (swingDoor) */
const RLINK = [["lower_landing", "lower_stairs", 0], ["lower_stairs", "hall", 1], ["hall", "landing", 2]];   // open to each other, and what it costs: one space (the lower flight), the short flight down, the long flight up
let RDOORS = null, CULLM = [], CULLG = [], cullKey = "";
function roomDoors() {   // each door's part and the rooms either side ("out": outside); and which rooms see out (a window, a door out, the porch's front door)
  if (RDOORS) return RDOORS;
  const rooms = R.HOUSE3.rooms, out = new Set(["porch"]), list = [], glazed = {};
  for (const F of Object.values(R.HOUSE3.floors)) for (const [pk, P] of Object.entries(F.parts || {})) if ((P.boxes || {}).glass) glazed[pk] = true;
  const at = (x, y, z) => { let best = null, ba = Infinity;
    for (const [id, r] of Object.entries(rooms)) if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3] && y >= r[4] - 5 && y <= r[4] + 230) { const a = (r[1] - r[0]) * (r[3] - r[2]); if (a < ba) { ba = a; best = id; } }
    return best; };
  for (const [id, it] of Object.entries(R.HOUSE3.items || {})) { const o = it.op; if (!o) continue;
    if (it.k === "window") { out.add(it.r); continue; }
    if (it.k !== "door" || id === "living_door") continue;   // the living room's: its own rule (applyFloors)
    const m = (o.a + o.b) / 2, y = o.y0 + 20, side = d => o.axis === "x" ? at(m, y, o.line + d) : at(o.line + d, y, m);
    const a = side(-15), b = side(15), pk = "door." + id;
    if (!a && !b) { out.add(it.r); continue; }
    if (!a || !b) out.add(a || b);
    list.push([pk, a || "out", b || "out", !!glazed[pk]]); }
  return (RDOORS = { list, out });
}
function roomSees(seeds) {   // the rooms seen from these: through two open (or glazed) doors at most, or a flight's top or foot
  const { list } = roomDoors(), cost = new Map(seeds.filter(Boolean).map(r => [r, 0])), todo = [...cost.keys()];
  const open = (pk, gz) => gz || !HPARTS[pk] || doorOpen(HPARTS[pk]);   // a door with no leaf of its own (the cupboards', the back door): as open
  while (todo.length) { const r = todo.shift(), c = cost.get(r), add = (q, k) => { if (q && c + k <= 2 && !(cost.get(q) <= c + k)) { cost.set(q, c + k); if (q !== "out") todo.push(q); } };
    for (const [a, b, k] of RLINK) if (a === r) add(b, k); else if (b === r) add(a, k);
    for (const [pk, a, b, gz] of list) if ((a === r || b === r) && open(pk, gz)) add(a === r ? b : a, 1); }
  return new Set(cost.keys());
}
function roomUncull() {
  for (const me of CULLM) { me.geometry.setDrawRange(0, Infinity); me.layers.enable(0); for (const t of me.userData.twins || []) t.visible = false; }
  CULLG.forEach(g => g.visible = true); CULLM = []; CULLG = [];
}
function houseJoin(on) {   // V2.98 (N37): not culling by room (the house from outside), the floors shown drawn a material at a time (20_go joinBuild)
  const ks = on && houseG && houseG.visible && R.HOUSE3 ? JOIN_FL.filter(k => HFLOOR[k] && HFLOOR[k].visible) : [];
  const run = ks.length > 1 && JOIN_FL.indexOf(ks[ks.length - 1]) - JOIN_FL.indexOf(ks[0]) === ks.length - 1 ? new Set(ks) : null;
  if (!run && !HJOIN) return;
  if (!HJOIN) joinBuild();
  for (const me of HJOIN.list) { let a = Infinity, b = 0;
    for (const [fk, s, n] of me.userData.span) if (run && run.has(fk)) { a = Math.min(a, s); b = Math.max(b, s + n); }
    me.visible = b > a; me.geometry.setDrawRange(me.visible ? a : 0, me.visible ? b - a : Infinity);
    for (const [fk, , , src] of me.userData.span) if (me.visible && run.has(fk)) src.layers.disable(0); else src.layers.enable(0); }
  HJOIN.G.visible = !!run;
}
function roomCull(again) {   // again: a door swung (only this part of applyFloors)
  if (again) { if (!houseG) return; roomUncull(); }
  const liv = S.view === "livstand" && houseG && houseG.visible && R.HOUSE3 && R.HOUSE3.rooms;
  houseJoin(!liv && !(INSIDE() && houseG && R.HOUSE3 && R.HOUSE3.rooms));
  if (!liv && !(INSIDE() && houseG && R.HOUSE3 && R.HOUSE3.rooms)) { if (again) dirty(); if (cullKey) { cullKey = ""; reshadow(); } return; }
  const seeds = liv ? ["landing", doorOpen(HPARTS["door.living_door"]) && "hall"]   // from the living room: up its stairs, and the hall through its door
    : [VIEW_ROOM[S.view], hereRoom, ...Object.keys(WALK_VIEW).filter(k => WALK_VIEW[k] === S.view)];
  const see = roomSees(seeds), { out } = roomDoors();
  if (![...see].some(r => r === "out" || out.has(r))) for (const k of ["out", "street", "nextThings"]) { const g = HFLOOR[k]; if (g && g.visible) { g.visible = false; CULLG.push(g); } }
  const twin = me => { const g = new THREE.BufferGeometry(), src = me.geometry;
    if (!src.boundingSphere) src.computeBoundingSphere();
    if (src.index) g.setIndex(src.index); for (const [k, a] of Object.entries(src.attributes)) g.setAttribute(k, a); g.boundingSphere = src.boundingSphere;
    const t = new THREE.Mesh(g, me.material); t.castShadow = me.castShadow; t.receiveShadow = me.receiveShadow; t.renderOrder = me.renderOrder; t.visible = false;
    me.parent.add(t); return t; };
  houseG.traverse(me => {
    const rr = me.userData.rooms; if (!rr || !me.visible) return;
    const runs = [];
    for (const [id, a, n] of rr) if (!id || see.has(id)) { const L = runs[runs.length - 1]; if (L && L[1] === a) L[1] = a + n; else runs.push([a, a + n]); }
    if (runs.length === 1 && runs[0][0] === 0 && runs[0][1] === rr[rr.length - 1][1] + rr[rr.length - 1][2]) return;   // all of it
    CULLM.push(me);
    if (!runs.length) { me.layers.disable(0); return; }
    for (let i = runs.length - 2; i >= 0; i--) if (runs[i + 1][0] - runs[i][1] < 30000) runs.splice(i, 2, [runs[i][0], runs[i + 1][1]]);   // a small gap drawn through (a draw costs more than 10,000 triangles)
    while (runs.length > 3) { let k = 0; for (let i = 1; i < runs.length - 1; i++) if (runs[i + 1][0] - runs[i][1] < runs[k + 1][0] - runs[k][1]) k = i;   // the closest two as one
      runs.splice(k, 2, [runs[k][0], runs[k + 1][1]]); }
    me.geometry.setDrawRange(runs[0][0], runs[0][1] - runs[0][0]);
    const tw = me.userData.twins || (me.userData.twins = []);
    for (let i = 1; i < runs.length; i++) { const t = tw[i - 1] || (tw[i - 1] = twin(me)); t.geometry.setDrawRange(runs[i][0], runs[i][1] - runs[i][0]); t.visible = true; } });
  /* V2.98 (N37): and what moves or swaps (a room's light, a bed, a wardrobe's doors) where its room is left out, and a door seen from neither side */
  const off = g => g.traverse(me => { if (me.isMesh && me.layers.isEnabled(0)) { me.layers.disable(0); CULLM.push(me); } });
  for (const [r, g] of Object.entries(FIN_PEND)) if (!see.has(r)) off(g);
  const dside = {}; for (const [pk, a, b] of roomDoors().list) dside[pk] = [a, b];
  for (const [pk, P] of Object.entries(HPARTS)) { const d = dside[pk], r = P.g.userData.room; if (d ? !see.has(d[0]) && !see.has(d[1]) : r && !see.has(r)) off(P.g); }
  const key = [...see].sort().join() + CULLG.length;
  if (again) dirty();
  if (key !== cullKey) { cullKey = key; reshadow(); }
}
/* V3.68 (N125): a floor on its own is cut at its ceiling, and below that a metre under the eye in 20 cm steps, so you look in over its
   walls. One plane moved: no shader built */
function floorCut(now) {
  const fy = { first: 260, ground: 0, lower: -260 }[hfloor]; if (!FLCLIP || fy == null || S.view !== "house") return false;
  const top = fy + (R.HOUSE3.ceil || 235) + 3, c = Math.min(top, Math.max(fy + 90, Math.round((camera.position.y / M - 100) / 20) * 20)) * M;
  if (Math.abs(FLCLIP[0].constant - c) < 1e-4) return false;
  FLCLIP[0].constant = c; if (!now) reshadow(); return true;
}
let LIVCLIP = null, livClipOn = false, FLCLIP = null;   // V2.0: in the living room's own view the house only above the landing's floor over the room
/* V2.64: three builds a shader for each number of cutting planes, so the house's materials always carry 6 (the unused far off) and a cut
   changes numbers, not shaders; the living room's own view (2 planes, cutting where both do) is its own set, built by the warm-up.
   CLIPSRC: the planes as asked for */
const CLIPSRC = new WeakMap(), NOCUT = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e4), PADDED = new WeakMap();
function houseClip(m, P, inter) {
  CLIPSRC.set(m, P);
  let use = P; if (!inter) { use = PADDED.get(P); if (!use) PADDED.set(P, use = [...P, ...Array(Math.max(0, 6 - P.length)).fill(NOCUT)]); }
  const n = use.length, k = !!inter;
  m.clippingPlanes = use; m.clipShadows = true;
  if (m.userData.clipN !== n || m.clipIntersection !== k) { m.clipIntersection = k; m.userData.clipN = n; m.needsUpdate = true; }
}
function livClip(on) {
  if (!HMATS || (!on && !livClipOn)) return; livClipOn = on;   // (setRmode may have put its own planes back meanwhile)
  if (on && !LIVCLIP) LIVCLIP = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -R.HOUSE3.rooms.landing[4] * M + 0.01), new THREE.Plane(new THREE.Vector3(0, 0, 1), -(R.RECESS_Z + 2) * M)];
  for (const m of Object.values(HMATS)) { const P = on && m.userData.hk !== "stairpaint" ? LIVCLIP : RPLANES;   // the stair wall goes down to the room's ceiling (not over it)
    if (CLIPSRC.get(m) !== P || m.clipIntersection !== (P === LIVCLIP)) houseClip(m, P, P === LIVCLIP); }
}
/* V1.30 (U3): a row with more to slide to fades at its right edge */
function fadeRows(show) {   // V3.79 (N144): a fade at either end with more; show: the chosen floor or room slid into view (never on a scroll: you're sliding)
  qsa(".r3d-floors:not(.r3d-rmode)").forEach(el => {
    if (show && el.scrollWidth > el.clientWidth) { const b = el.querySelector('button[aria-pressed="true"]:not(.tog)'); if (b) { const l = b.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft, r = l + b.offsetWidth;
      if (l < el.scrollLeft + 8) el.scrollLeft = Math.max(0, l - 32); else if (r > el.scrollLeft + el.clientWidth - 8) el.scrollLeft = r - el.clientWidth + 40; } }
    el.classList.toggle("more", el.scrollWidth - el.clientWidth - el.scrollLeft > 4); el.classList.toggle("less", el.scrollLeft > 4); });
}
document.addEventListener("scroll", e => { if (e.target.classList && e.target.classList.contains("r3d-floors")) fadeRows(); }, true);
/* V1.2: the brand's second line says where you are: the whole house, a floor, a room */
let hereRoom = null;                                   // V1.60: the room you stand in (walkRoom, goStand)
const HERE_NAME = { lower_landing: "Lower landing", lower_stairs: "Lower stairs" };
function brandPlace() {
  /* V1.30 (U3): only the tools that work where you are: in the house's views Room and Edit step aside and Look keeps the house's colours;
     in the house's rooms Plan · Build · Buy too */
  const hv = HOUSEV(S.view), hr = !!ROOMV(); document.body.classList.toggle("hv", hv); document.body.classList.toggle("hroom", hr);
  if (hv && window.DemmaTools && DemmaTools.isOpen() && ["room"].some(k => { const d = qs("#r3d-dp-" + k); return d && !d.hidden; })) DemmaTools.close();
  const el = document.getElementById("brand-place"); if (!el) return;
  let t = "The living room";
  if (S.view === "house") t = { first: "The first floor", ground: "The ground floor", lower: "The lower floor" }[hfloor] || "The whole house";
  else if (ROOMV() && RMODE === "stand" && hereRoom && hereRoom !== "living" && (ROOM_VIEW[hereRoom] || WALK_VIEW[hereRoom]) === S.view)
    t = HERE_NAME[hereRoom] || roomName(hereRoom) || t;   // V1.60: standing, the room you're in (the lower landing has the kitchen's view)
  else if (ROOMV()) { const id = VIEW_ROOM[S.view], L = id && id !== "living" && Object.values(R.HOUSE3.floors).flatMap(F => F.labels || []).find(l => l.id === id); t = (L && L.name) || (VIEWS[S.view] || {}).label || t; }
  el.textContent = t;
  canvas.setAttribute("aria-label", `${t} in 3D: drag to look round; in a room, scroll or W and S walk, the left and right arrows or Q and E turn, A and D step aside, Ctrl + scroll the lens`);   // V1.43: says where you are (it always said the living room)
}
/* v64: on a floor, its rooms as buttons; a room with its own view goes into it, the others are seen from above */
const ROOM_VIEW = { living: "room", kitchen: "kitchen", bed3: "office", bed2: "bed2", master: "master", bathroom: "bath",
  landing: "landing", hall: "hall", garage: "garage", wc: "wc" };   // v66: every room a person stands in has its own view
/* v74: a floor (or the whole house) picked, Angled looks from the house view's direction, Overhead straight down, far enough for all its rooms */
/* V1.54: on a phone a view from above is framed between the top buttons and the dock: [its share of the height, its middle's drop (px)] */
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
/* V4.2 (N159): the whole house framed to the screen, on a phone's tall screen as on a PC's wide one, from VIEWS.house's side */
function fitHouseView() {
  if (!R.HOUSE3 || hfloor !== "all") return false;
  const H = VIEWS.house; if (!fitHouseView.e0) { fitHouseView.e0 = H.eye.slice(); fitHouseView.a0 = H.at.slice(); }
  const rs = [...Object.values(R.HOUSE3.rooms || {}), [0, R.W, R.WINDOW_Z, R.RECESS_Z, 0]];
  const x0 = Math.min(...rs.map(r => r[0])), x1 = Math.max(...rs.map(r => r[1])), z0 = Math.min(...rs.map(r => r[2])), z1 = Math.max(...rs.map(r => r[3]));
  const c = [(x0 + x1) / 2, 380, (z0 + z1) / 2], e0 = fitHouseView.e0, a0 = fitHouseView.a0;
  const dir = new THREE.Vector3(e0[0] - a0[0], e0[1] - a0[1], e0[2] - a0[2]).normalize();
  // the house's box between the top row and the dock, its width in 80% of the screen (a binary search on the distance), then centred there
  const cam = camera.clone(), cw = v3(c[0], c[1], c[2]), pts = [];
  for (let k = 0; k < 8; k++) pts.push(v3(k & 1 ? x1 : x0, k & 2 ? 860 : 0, k & 4 ? z1 : z0));
  const span = (D, P = pts) => { cam.position.copy(v3(c[0] + dir.x * D, c[1] + dir.y * D, c[2] + dir.z * D)); cam.lookAt(cw); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let a = 9, b = -9, e = 9, f = -9; for (const q of P) { const n = q.clone().project(cam); a = Math.min(a, n.x); b = Math.max(b, n.x); e = Math.min(e, n.y); f = Math.max(f, n.y); } return [a, b, e, f]; };
  // N171: a phone stood up fits the house's own walls to 70% of the width (the box's corners left it at about 45%), its height between the rows
  const tall = camera.aspect < 1, walls = tall ? rs.flatMap(r => [r[0], r[1]].flatMap(x => [r[2], r[3]].flatMap(z => [0, 780].map(y => v3(x, y, z))))) : null, k0 = tall ? freeFrame()[0] : 1;
  if (tall) cam.fov = fitFov(H.fov);   // the lens it will have (a phone's is widened), not the one it has now
  const ok = D => { const [a, b, e, f] = span(D); if (!tall) return b - a < 1.75 && f - e < 1.45;   // the box is bigger than the house it holds (its roof, its corners), so it may reach past the space a little
    const [p, q, g, h] = span(D, walls); return q - p < 1.5 && h - g < 1.8 * k0; };   // the walls up to the ridge
  let lo = 600, hi = 20000; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; }
  hi *= S.hstreet ? 2 : S.hgarden ? 1.5 : 1;   // N171: Gardens and Next door stand back to take in what they add
  const [a, b, e, f] = tall ? span(hi, walls) : span(hi), hh = hi * M * Math.tan(cam.fov * Math.PI / 360), right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const sh = right.multiplyScalar((a + b) / 2 * hh * cam.aspect).add(up.multiplyScalar(((e + f) / 2 - 0.03) * hh));   // the box's middle to the space's
  const room = w => [-w.x / M, w.y / M, w.z / M], eye = cam.position.clone().add(sh), at = cw.clone().add(sh);
  H.at = room(at); H.eye = room(eye); return tall;
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
  // V1.53: overhead a long lens from high up (the walls straight); flyTo's fourth is "above" (REDUCE held the eye to 6 m)
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
  const tg = e.target.closest("[data-htog]"); if (tg) { S[tg.dataset.htog] = !S[tg.dataset.htog]; store.set(KEY, S); applyFloors(); if (S.view === "house" && hfloor === "all") setView("house"); return; }   // N171: and stand back for them
  const r = e.target.closest("[data-hroom]"); if (!r || !R.HOUSE3) return;
  const id = r.dataset.hroom, v = ROOM_VIEW[id];
  if (v) { goRoom(v); return; }
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
