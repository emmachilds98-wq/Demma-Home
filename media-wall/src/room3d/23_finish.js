/* V2.6 (docs/FINISHES_PLAN.md F3), the client: "customise different areas of the house in a fluid way, ie colour of walls": tap a wall or a
   ceiling in any of the house's rooms; its card has the colours as a tray (tap one: the room changes at once), where it goes (this wall,
   this room, the whole house), Undo, and As it is (hold it: the house as drawn; let go: your colours). Kept on this device (S.fin: room ->
   slot -> colour), drawn through F2's palette (20_go.js finish). The living room keeps its own Look. */
let finScope = "room", finHeld = null, livHeld = null;
/* N5 (REAL_PLAN R7, the finishes plan's F8): the living room on the house's rows. Its colours stay where its own Look keeps them (S.paint,
   S.walls, S.ceil, S.skirt: drawn pixel for pixel as before); as a row it reads 0-3 its walls, 4 its ceiling, 11-16 its six walls by name
   (media, breast, door, stairs, window, PC), 17 the skirting, the door and its frame. So a tap on its wall opens the house's card, and the
   schemes, Undo, Copy and Paste and Send carry it with the rest of the house */
const LIVR = "living", LIV_W = WALLS.map(([k]) => k), LIV_HEX = /^#[0-9a-f]{6}$/i;
const livChanged = () => S.paint !== DEF.paint || Object.keys(S.walls).length > 0 || S.ceil !== "match" || S.skirt !== "match";
function livRow() {
  const o = {}, h = paintHex(); [0, 1, 2, 3].forEach(s => o[s] = h); if (LIV_HEX.test(S.ceil)) o[4] = S.ceil; if (LIV_HEX.test(S.skirt)) o[17] = S.skirt;
  LIV_W.forEach((k, i) => { if (LIV_HEX.test(S.walls[k] || "")) o[11 + i] = S.walls[k]; }); return o;
}
function livBase(hex) {   // the walls' paint: one of the paints by its key, else your own colour; none: the plan's (pale mint)
  const k = hex && Object.keys(R.PAINTS).find(q => R.PAINTS[q].hex.toLowerCase() === hex.toLowerCase());
  if (!hex) S.paint = DEF.paint; else if (k) S.paint = k; else { S.paint = "custom"; S.custom = hex; }
}
function livSet(o) {   // a row back into the living room's own Look (none: it stays as it is)
  if (!o) return; livBase([0, 1, 2, 3].map(s => o[s]).find(Boolean)); S.ceil = o[4] || "match"; S.skirt = o[17] || "match"; S.walls = {};
  LIV_W.forEach((k, i) => { if (o[11 + i]) setWall(k, o[11 + i]); }); repaint(); syncButtons(); updateCaption();
}
function livFin(slot, hex, one) {   // one surface of the living room to a colour (null: as the plan has it)
  if (slot === 4) S.ceil = hex || "match"; else if (slot === 17) S.skirt = hex || "match";
  else if (one && slot >= 11) setWall(LIV_W[slot - 11], hex || "match"); else { livBase(hex); S.walls = {}; }
  repaint(); syncButtons(); updateCaption();
}
const finAll = (all = true) => Object.assign({}, S.fin || {}, all || livChanged() ? { [LIVR]: livRow() } : {});   // every room's row, the living room's too
function finRestore(o) { const c = finClean(o), L = c[LIVR]; delete c[LIVR]; S.fin = c; livSet(L); }
const finPush = () => { FIN_UNDO.push(JSON.stringify(finAll())); if (FIN_UNDO.length > 20) FIN_UNDO.shift(); };
const finSlotName = (room, slot) => room === LIVR && slot >= 11 && slot <= 16 ? WALLS[slot - 11][1].toLowerCase() : room === LIVR && slot === 17 ? "skirting and door" : `${FIN_NAMES[slot]} wall`;
const FIN_UNDO = [];
const FIN_NAMES = ["back", "front", "east", "west", "ceiling", "floor"];
/* V2.7 (F4): the floors in the tray: the house's own floor materials (their photos, house/textures), laid as a room's new floor; the mean
   colour of each photo is its swatch */
const FIN_FLOORS = [["carpet_grey", "Grey carpet"], ["carpet", "Oatmeal carpet"], ["laminate", "Laminate"], ["oak", "Oak boards"], ["pine", "Pine boards"],
  ["tile_f", "Pale tiles"], ["marble", "Black marble"], ["quarry", "Quarry tiles"]];
const FIN_FLOOR_KEYS = new Set(["carpet_grey", "carpet", "laminate", "board", "oak", "pine", "tile_f", "marble", "quarry", "concrete", "vinyl", "earth"]);
const finFloorCol = k => { const pm = ((R.HOUSE3 || {}).photo_meta || {})[k]; return (pm && pm.avg) || ((((R.HOUSE3 || {}).mats || {})[k]) || ["#999999"])[0]; };
let FIN_LAID = [];
/* V2.9 (F5, in part): a room's bulbs: their colour (warm 2700 K to daylight 5000 K) and how bright, on the room's ceiling lights. On the
   ceiling's card and a light's own card; the two ceiling lights that follow you (09_house_views.js placeRoomLights) take them */
const FIN_BULBS = [["2700", "Warm"], ["3000", "Neutral"], ["4000", "Cool"], ["5000", "Daylight"]], FIN_LUX = [["0.6", "Soft"], ["1", "Normal"], ["1.4", "Bright"]];
function kelvinHex(k) {   // a bulb's colour temperature as a colour (Tanner Helland's fit)
  const t = k / 100; let r = 255, g, b;
  if (t <= 66) { g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.133); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); return "#" + c(r) + c(g) + c(b);
}
function finBulb(room) { const o = (S.fin || {})[room] || {}; return { k: o[6] || null, lux: o[7] ? +o[7] : 1 }; }
function finBulbTray(room) {
  const b = finBulb(room), chips = (L, a, cur) => L.map(([v, t]) => `<button type="button" data-${a}="${v}" aria-pressed="${String(cur) === v}">${t}</button>`).join("");
  return `<div class="r3d-finsc" role="group" aria-label="The bulbs">${chips(FIN_BULBS, "finbulb", b.k || "2700")}</div>`
    + `<div class="r3d-finsc" role="group" aria-label="How bright">${chips(FIN_LUX, "finlux", b.lux === 1 ? "1" : String(b.lux))}</div>`;
}
/* V2.15 (F5): the fitting: what hangs at the room's ceiling point, in place of the one drawn (the photos' pendant, or none): a bare bulb,
   a drum shade, an opal globe, a flush dome or four spots (E: typical sizes: a 40 drum, a 25 globe, a 32 dome, GU10 spots 45 out) */
const FIN_FITS = [["bare", "Bare bulb"], ["drum", "Drum shade"], ["globe", "Globe"], ["dome", "Flush dome"], ["spots", "Four spots"]];
const FIT_DROP = { bare: 40, drum: 36, globe: 33, dome: 9, spots: 5 };   // how far below the ceiling the room's light sits
let FIT_LAID = [], FIT_SHADE = null;
function finFitDrop(room) { const k = finGet(room, 8); return k ? FIT_DROP[k] : 40; }
function finFitApply() {
  if (!FIN.mat3 || !houseG) return;
  for (const m of FIT_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } FIT_LAID = [];
  for (const [r, g] of Object.entries(FIN_PEND)) g.visible = !finGet(r, 8);
  const seg = typeof LOWD !== "undefined" && LOWD ? 12 : 28, lathe = (prof, x, y, z) => { const g = new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a * M, b * M)), seg), c = v3(x, y, z); g.translate(c.x, c.y, c.z); return g; };
  const rod = (x, y0, y1, z) => { const g = new THREE.CylinderGeometry(0.35 * M, 0.35 * M, (y1 - y0) * M, 6), c = v3(x, (y0 + y1) / 2, z); g.translate(c.x, c.y, c.z); return g; };
  FIT_SHADE = FIT_SHADE || new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.95, side: THREE.DoubleSide, emissive: "#ffe2b8", emissiveIntensity: 0.12 });
  for (const [f, F] of Object.entries((R.HOUSE3 || {}).floors || {})) { const into = HFLOOR[f]; if (!into) continue;
    for (const L of F.lights || []) { const k = finGet(L.room, 8); if (!k) continue; const { x, z } = L, y = L.y + 2, white = [], glow = [], shade = [];
      const rose = () => white.push(lathe([[0, 0], [4, 0], [5, 0.6], [5, 1.7], [0, 1.7]], x, y - 2, z));
      const bulb = d => { white.push(rod(x, y - d, y - 2, z), lathe([[0, 0], [1.7, 0], [1.7, 4], [1.2, 4.6], [0, 4.6]], x, y - d - 4, z));
        glow.push(lathe([[0, 0], [1.6, 0.3], [2.7, 1.4], [3.1, 3], [2.7, 4.8], [1.6, 6.6], [1.3, 8.5], [0, 8.5]], x, y - d - 12.5, z)); };
      if (k === "bare") { rose(); bulb(33); }
      else if (k === "drum") { rose(); bulb(26); shade.push(lathe([[20, 0], [20, 22], [19.6, 22], [19.6, 0.4]], x, y - 44, z)); }
      else if (k === "globe") { rose(); white.push(rod(x, y - 22, y - 2, z)); glow.push(lathe([[0, 0], [5, 0.6], [9.5, 4], [12.5, 10], [12.5, 15], [9.5, 21], [4, 24.3], [3, 25], [0, 25]], x, y - 47, z)); }
      else if (k === "dome") { white.push(lathe([[0, 0], [16.5, 0], [16.5, 1.2], [0, 1.2]], x, y - 1.2, z)); glow.push(lathe([[0, 0], [8, 0.6], [13, 2.6], [15.8, 5.4], [16, 7.2], [0, 7.2]], x, y - 8.4, z)); }
      else if (k === "spots") for (const [dx, dz] of [[-45, -45], [45, -45], [-45, 45], [45, 45]]) { white.push(lathe([[0, 0], [4.3, 0], [4.3, 0.8], [0, 0.8]], x + dx, y - 0.8, z + dz));
        glow.push(lathe([[0, 0], [3.2, 0], [3.2, 0.9], [0, 0.9]], x + dx, y - 1.7, z + dz)); }
      for (const [geos, mat] of [[white, FIN.mat3("upvc")], [glow, FIN.mat3("led")], [shade, FIT_SHADE]]) if (geos.length) {
        const me = new THREE.Mesh(mergeGeometries(geos), mat); geos.forEach(q => q.dispose()); me.castShadow = false; me.userData.finFit = L.room; into.add(me); FIT_LAID.push(me); } } }
  dirty();
}
function finFitTray(room) {
  const now = finGet(room, 8) || "";
  return `<span class="r3d-finlab">The light</span><div class="r3d-finsc" role="group" aria-label="The light">`
    + [["", "As it is"], ...FIN_FITS].map(([v, t]) => `<button type="button" data-finfit="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`;
}
function finFloorApply() {   // every room with a floor chosen: a thin floor on its pieces, in that material (only then: nothing added otherwise)
  if (!finSetup() || !FIN.mat3 || !houseG) return;
  for (const m of FIN_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } FIN_LAID = [];
  ["lower", "ground", "first"].forEach(f => { const g = HFLOOR[f]; if (!g) return;
    const P = R.HOUSE3.finish_pieces[f] || [], Y = (R.HOUSE3.finish_floor_y || {})[f] || [], by = {};
    P.forEach(([ri, x0, x1, z0, z1], i) => { const room = FIN.rooms[ri], k = finGet(room, 5); if (!k) return;
      const geo = new THREE.BoxGeometry((x1 - x0) * M, 0.3 * M, (z1 - z0) * M); geo.translate(-(x0 + x1) / 2 * M, (Y[i] + 0.15) * M, (z0 + z1) / 2 * M);
      ((by[room + "|" + k] = by[room + "|" + k] || { room, k, geos: [] }).geos).push(geo); });
    for (const { room, k, geos } of Object.values(by)) { const mat = FIN.mat3(k), me = new THREE.Mesh(worldUV(mergeGeometries(geos), k), mat);
      me.receiveShadow = true; me.userData.finRoom = room; me.userData.finFloor = f; geos.forEach(q => q.dispose()); g.add(me); FIN_LAID.push(me); } });
  finFitApply(); dirty();
}
function finSwatches() {   // the paints to start with: the living room's (the client's pale mint first), and white
  const L = [["#f4f3ef", "White"]];
  for (const [k, p] of Object.entries(R.PAINTS || {})) { const hex = p.hex || p[0], nm = String(p.name || p.label || p[1] || k).replace(/\s*\(#[0-9a-f]{6}\)/i, "").split(",")[0]; if (hex) L.push([hex, nm]); }
  return L;
}
/* V2.35 (FINISHES_PLAN F11, colours that go with it): under a picked colour, two lighter and two darker of it (its lightness in sRGB, as
   the eye sees steps), a tap each, as any swatch */
function finShades(hex) {
  const hsl = {}; new THREE.Color(hex).getHSL(hsl, THREE.SRGBColorSpace);
  return [0.16, 0.08, -0.08, -0.16].map(d => ["#" + new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0.04, Math.min(0.97, hsl.l + d)), THREE.SRGBColorSpace).getHexString(), d > 0 ? "Lighter" : "Darker"])
    .filter(([h], i, L) => h.toLowerCase() !== hex.toLowerCase() && L.findIndex(([g]) => g === h) === i);
}
const finShort = nm => nm.replace(/^(Farrow & Ball|Little Greene|Dulux|Crown|Valspar)\s+/, "").replace(/\s+No\.\s*\d+$/, "").replace(/\s*\(RAL \d+\)$/, "");   // say less: the tray shows "Card Room Green"
function finAt(hit) {   // a tap on a wall or a ceiling of the house: its room and side (as the palette's shader reads them)
  const m = hit && hit.object && hit.object.material, hk = m && m.userData && m.userData.hk;
  if (hit && hit.object && hit.object.userData.finRoom) return { room: hit.object.userData.finRoom, slot: 5 };   // a floor laid by the tray
  if (hk && FIN_FLOOR_KEYS.has(hk) && finSetup() && hit.face && hit.face.normal.y > 0.7) {   // a room's floor (from above it)
    const p = hit.point, xc = -p.x / M, zc = p.z / M, yc = p.y / M + 20, fl = yc < 0 ? 0 : yc < 260 ? 1 : 2;
    const ri = FIN.map.image.data[(fl * FIN.H + Math.max(0, Math.min(FIN.H - 1, Math.floor((zc + 309) / 2)))) * FIN.W + Math.max(0, Math.min(FIN.W - 1, Math.floor(xc / 2)))];
    return ri ? { room: FIN.rooms[ri - 1], slot: 5 } : null; }
  if (!(hk in FIN.kind) || !finSetup() || !hit.face) return null;
  const p = hit.point, n = hit.face.normal, xc = -p.x / M, zc = p.z / M, yc = p.y / M, ceil = FIN.kind[hk] === 1;
  let ri;
  { const o = ceil ? 0 : 3, fl = yc < 0 ? 0 : yc < 260 ? 1 : 2;
    const i = Math.max(0, Math.min(FIN.W - 1, Math.floor((xc - n.x * o) / 2))), j = Math.max(0, Math.min(FIN.H - 1, Math.floor((zc + n.z * o + 309) / 2)));
    ri = FIN.map.image.data[(fl * FIN.H + j) * FIN.W + i]; }
  if (!ri) return null;
  const nx = -n.x, nz = n.z, slot = ceil ? 4 : Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 2 : 3) : (nz > 0 ? 0 : 1);
  return { room: FIN.rooms[ri - 1], slot };
}
/* V2.11 (F6, in part): the finishes go with Measure's Send link (measure.js) and come in from one; checked as data: rooms and slots by
   their shape, colours as #hex, floors and bulbs from the trays' own lists */
function finClean(o) {
  const out = {}, floors = new Set(FIN_FLOORS.map(([k]) => k)), bulbs = new Set(FIN_BULBS.map(([v]) => v)), lux = new Set(FIN_LUX.map(([v]) => v));
  for (const [room, sl] of Object.entries(o && typeof o === "object" ? o : {})) { if (!/^[a-z0-9_]{1,30}$/.test(room) || !sl || typeof sl !== "object") continue;
    for (const [s, v] of Object.entries(sl)) { const k = +s, ok = k <= 4 || k === 9 || k === 10 || (room === LIVR && k >= 11 && k <= 17) ? /^#[0-9a-f]{6}$/i.test(v) : k === 5 ? floors.has(v) : k === 6 ? bulbs.has(v) : k === 7 ? lux.has(v) : k === 8 ? FIN_FITS.some(([f]) => f === v) : k === 23 ? !!HCAT[v] && HCAT[v].k === "plant" : false;
      if (ok) (out[room] = out[room] || {})[k] = v; } }
  return out;
}
function finImport(o) { const c = finClean(o); if (!Object.keys(c).length) return false; finPush(); finRestore(c); store.set(KEY, S); finApplyAll(); toast("Their colours, floors and bulbs"); return true; }
/* V2.12 (F7): what the choices take, from each room's surfaces' areas (house/surfaces.py via R.HOUSE3.finish_areas): the walls by colour
   (two coats at about 12 m² a litre, in 2.5 L tins), the ceiling the same, the floor's m² with 10% for cutting; in Measure */
function finTakes() {
  const box = qs("#ms-takes"), list = qs("#ms-tlist"), A = (R.HOUSE3 || {}).finish_areas || {}; if (!box || !list) return;
  const paint = hex => (finSwatches().find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
  const lit = m2 => Math.ceil(m2 * 2 / 12 * 2) / 2, tins = l => Math.ceil(l / 2.5), rows = [];
  for (const [room, sl] of Object.entries(S.fin || {})) { const a = A[room]; if (!a) continue;
    const by = {}; for (const [side, i] of [["back", 0], ["front", 1], ["east", 2], ["west", 3]]) { const w = a.walls[side]; if (!sl[i] || !w || w[1] === "stairpaint") continue; by[sl[i]] = (by[sl[i]] || 0) + w[0]; }
    for (const [hex, m2] of Object.entries(by)) { const l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> walls, ${paint(hex)}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (sl[4] && a.ceiling) { const l = lit(a.ceiling); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> ceiling, ${paint(sl[4])}: ${a.ceiling.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (sl[5] && a.floor) { const f = FIN_FLOORS.find(([k]) => k === sl[5]); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> floor, ${f ? f[1] : sl[5]}: ${a.floor.toFixed(1)} m², ${(a.floor * 1.1).toFixed(1)} m² to buy</div>`); } }
  const la = A[LIVR]; if (la && livChanged()) { const by = {};   // N5: the living room's, by its six walls
    for (const k of LIV_W) { const w = la.walls[k], hex = S.walls[k] || paintHex(); if (w) by[hex] = (by[hex] || 0) + w[0]; }
    for (const [hex, m2] of Object.entries(by)) { const l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> walls, ${paint(hex)}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (la.ceiling) { const hex = chHex("ceil"), l = lit(la.ceiling); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> ceiling, ${paint(hex)}: ${la.ceiling.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); } }
  list.innerHTML = rows.join(""); box.hidden = !rows.length;
}
/* V2.13 (F6): a room's look copied to another (Copy this room on its card; Paste on any other room's), and the whole house's colours, floors
   and bulbs saved as named schemes (Look: The house's colours), switched in one tap; kept on this device */
let FIN_COPY = null;
const FSK = "dh-fin-schemes";
function finSchemes() { try { const L = JSON.parse(localStorage.getItem(FSK) || "[]"); return Array.isArray(L) ? L : []; } catch (e) { return []; } }
function finSchDraw() {
  const box = qs("#r3d-finschl"); if (!box) return; const L = finSchemes(), now = x => JSON.stringify(finClean(finAll(!!(x.fin || {})[LIVR]))), esc = t => String(t).replace(/[<&"]/g, "");
  box.innerHTML = L.length ? L.map((x, i) => `<span class="r3d-mysc"><button type="button" data-finsch="${i}" aria-pressed="${JSON.stringify(finClean(x.fin)) === now(x)}">${esc(x.name)}</button><button type="button" class="r3d-myx" data-finschdel="${i}" aria-label="Delete ${esc(x.name)}">×</button></span>`).join("")
    : '<span class="caption">None yet: tap a wall, a ceiling or a floor in any room, then name it here.</span>';
}
function finSchSave() {
  const inp = qs("#r3d-finschname"), name = ((inp && inp.value.trim()) || `Scheme ${finSchemes().length + 1}`).slice(0, 24);
  const L = finSchemes().filter(x => x.name !== name); L.push({ name, fin: finClean(finAll()) });
  try { localStorage.setItem(FSK, JSON.stringify(L.slice(-12))); } catch (e) {} if (inp) inp.value = ""; finSchDraw(); toast(`Saved: ${name}`);
}
function finSchUse(i) {
  const x = finSchemes()[i]; if (!x) return; finPush();
  finRestore(x.fin); store.set(KEY, S); finApplyAll(); toast(x.name);
}
function finCopyBtns(room) {   // on a room's card: Copy this room (when it has a look of its own), Paste another's
  const L = [];
  if (FIN_COPY && FIN_COPY.room !== room) L.push(btn(`Paste ${roomName(FIN_COPY.room)}'s look`, { finpaste: "1" }));
  if (room === LIVR || Object.keys((S.fin || {})[room] || {}).length) L.push(btn("Copy this room", { fincopy: "1" }));
  return L;
}
/* V2.13 (F6): a colour from a photo: choose one (it stays on this device, drawn small), tap a spot in it, and that's the colour (a 7 px
   average, so one stray pixel doesn't decide it) */
let FIN_PIC = null;
function finPicLoad(file) {
  if (!file || !/^image\//.test(file.type)) return;
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { const k = Math.min(1, 480 / Math.max(img.width, img.height)), cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k)); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url); FIN_PIC = { cv, url: cv.toDataURL("image/jpeg", 0.85) }; renderAct(); };
  img.onerror = () => { URL.revokeObjectURL(url); toast("That photo wouldn't open"); };
  img.src = url;
}
function finPicAt(el, e) {   // the colour under a tap on the photo
  if (!FIN_PIC) return null; const r = el.getBoundingClientRect(), cv = FIN_PIC.cv;
  const sc = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * sc) / 2, oy = (r.height - cv.height * sc) / 2;
  const x = Math.round((e.clientX - r.left - ox) / sc), y = Math.round((e.clientY - r.top - oy) / sc); if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return null;
  const x0 = Math.max(0, x - 3), y0 = Math.max(0, y - 3), d = cv.getContext("2d").getImageData(x0, y0, Math.min(7, cv.width - x0), Math.min(7, cv.height - y0)).data, t = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) { t[0] += d[i]; t[1] += d[i + 1]; t[2] += d[i + 2]; }
  const n = d.length / 4; return "#" + t.map(v => Math.round(v / n).toString(16).padStart(2, "0")).join("");
}
function finGet(room, slot) { return ((room === LIVR ? livRow() : (S.fin || {})[room]) || {})[slot] || null; }
function finApplyAll() {   // what's kept, into the palette (on start, after Undo)
  if (!finSetup()) return; finish(null, "walls", null); finish(null, "ceiling", null);
  for (const [room, sl] of Object.entries(S.fin || {})) for (const [s, hex] of Object.entries(sl)) if (+s < 5 && FIN.rooms.includes(room)) finish(room, FIN_NAMES[+s], hex);
  finFloorApply(); finOut(); storeEdits(); if (typeof placeRoomLights === "function") { roomKey = ""; placeRoomLights(); } finTakes(); finSchDraw();
}
/* V2.38 (FINISHES_PLAN F12, the outside): our window frames' outside face (model.window's frame_out: white inside, as foiled frames) and
   the front door's (door_out), from the frames' usual colours (RAL) and the paints; kept as S.fin.outside[9] and [10] */
const FIN_OUT = [["#f5f5f2", "White"], ["#383e42", "Anthracite grey (RAL 7016)"], ["#b5b8b1", "Agate grey (RAL 7038)"], ["#0a0a0a", "Black (RAL 9005)"], ["#fdf4e3", "Cream (RAL 9001)"]];
const finOut = () => { for (const [s, k] of [[9, "frame_out"], [10, "door_out"]]) { const m = HMATS && HMATS[k]; if (m) m.color.set(!finHeld && finGet("outside", s) || R.HOUSE3.mats[k][0]); } dirty(); };
const finName = hex => ([...FIN_OUT, ...finSwatches()].find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
const finSw = (L, now) => L.map(([h, t]) => `<button type="button" class="sw" data-finc="${h}" style="--c:${h}" aria-pressed="${!!now && now.toLowerCase() === h.toLowerCase()}" title="${t}" aria-label="${t}"><i></i><span>${finShort(t)}</span></button>`).join("");
function finSet(room, slot, hex) {   // by the scope: this wall, this room's walls (or ceiling), the whole house's
  finPush(); S.fin = S.fin || {};
  if (room === LIVR || (finScope === "house" && slot <= 4)) {   // N5: the living room's own Look; Whole house takes it in too
    const one = room === LIVR && finScope === "wall" && slot >= 11; livFin(slot, hex, one);
    if (room === LIVR && finScope !== "house") { store.set(KEY, S); finTakes(); finSchDraw();
      toast(`${roomName(room)}: ${slot === 4 ? "ceiling" : slot === 17 ? "skirting and door" : one ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? finName(hex) : "as drawn"}`); return; }
    if (slot >= 11) slot = 0; }
  if (room === "outside") { const o = S.fin.outside = S.fin.outside || {}; if (hex) o[slot] = hex; else delete o[slot]; if (!Object.keys(o).length) delete S.fin.outside;
    finOut(); store.set(KEY, S); toast(`Outside: ${slot === 9 ? "the window frames" : "the front door"} ${hex ? finName(hex) : "white, as drawn"}`); return; }
  const ceil = slot === 4, flr = slot === 5, slots = flr ? [5] : ceil ? [4] : finScope === "wall" ? [slot] : [0, 1, 2, 3];
  const rooms = finScope === "house" ? FIN.rooms : flr && finScope === "floor" ? finStorey(room) : [room];
  for (const r of rooms) { const o = S.fin[r] = S.fin[r] || {}; for (const s of slots) { if (hex) o[s] = hex; else delete o[s]; } if (!Object.keys(o).length) delete S.fin[r]; }
  finApplyAll(); store.set(KEY, S);
  if (flr) { const nm = (FIN_FLOORS.find(([k]) => k === hex) || [0, "as drawn"])[1]; toast(`${finScope === "floor" ? "Whole floor" : roomName(room)}: floor ${hex ? nm : "as drawn"}`); return; }
  const nm = finName(hex);
  toast(`${finScope === "house" ? "Whole house" : roomName(room)}: ${ceil ? "ceiling" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? nm : "as drawn"}`);
}
function finStorey(room) {   // the rooms on the same floor as this one
  const P = R.HOUSE3.finish_pieces || {};
  for (const f of ["lower", "ground", "first"]) { const ids = [...new Set((P[f] || []).map(p => FIN.rooms[p[0]]))]; if (ids.includes(room)) return ids; }
  return [room];
}
function finFloorCard(room) {   // V2.7 (F4): a room's floor: the carpets, laminate, boards and tiles
  if (finScope !== "room" && finScope !== "floor") finScope = "room";
  const now = finGet(room, 5), nm = now ? (FIN_FLOORS.find(([k]) => k === now) || [0, now])[1] : "As drawn";
  const tray = `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${[["room", "This room"], ["floor", "Whole floor"]].map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Floors">${FIN_FLOORS.map(([k, t]) => `<button type="button" class="sw" data-finf="${k}" style="--c:${finFloorCol(k)}" aria-pressed="${now === k}" title="${t}" aria-label="${t}"><i></i><span>${t}</span></button>`).join("")}</div></div>`;
  return [`${roomName(room)}: the floor`, nm, [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), btn("As it is (hold)", { finhold: "1" }), ...(now ? [btn("As drawn", { finf: "" })] : []), ...finCopyBtns(room)], null, tray];
}
function finCard(id) {   // [title, now, buttons, -, the tray]
  const [, room, s] = id.split(":"), slot = +s, ceil = slot === 4, now = finGet(room, slot);
  if (slot === 5) return finFloorCard(room);
  if (room === "outside") return [`Outside: ${slot === 9 ? "the window frames" : "the front door"}`, now ? finName(now) : "White, as drawn",
    [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(now ? [btn("As drawn", { finc: "" })] : [])], null,
    `<div class="r3d-fin"><div class="r3d-fintray" role="group" aria-label="Colours">${finSw([...FIN_OUT, ...finSwatches().slice(1)], now)}<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f5f5f2"}" aria-label="Any colour"><span>Any</span></label></div></div>`];
  const liv = room === LIVR, named = liv && slot >= 11 && slot <= 16, drawn = liv ? (slot === 0 ? S.paint === DEF.paint && !Object.keys(S.walls).length : named ? !S.walls[LIV_W[slot - 11]] : !now) : !now;
  if (finScope === "floor" || (liv && slot === 17)) finScope = "room";
  if ((ceil || (liv && !named)) && finScope === "wall") finScope = "room";
  const nm = drawn ? "As drawn" : finName(now);
  const scopes = liv && slot === 17 ? [] : ceil || (liv && !named) ? [["room", "This room"], ["house", "Whole house"]] : [["wall", "This wall"], ["room", "This room"], ["house", "Whole house"]];
  const tray = `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${scopes.map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Colours">${finSw(finSwatches(), now)}`
    + `<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f4f3ef"}" aria-label="Any colour"><span>Any</span></label>`
    + `<label class="sw pic" title="A colour from a photo"><i><span class="ms" aria-hidden="true">photo_camera</span></i><input type="file" accept="image/*" data-finpic="1" aria-label="A colour from a photo"><span>Photo</span></label></div>`
    + (now ? `<span class="r3d-finlab">Lighter and darker</span><div class="r3d-fintray" role="group" aria-label="Lighter and darker">${finShades(now).map(([h, t]) => `<button type="button" class="sw" data-finc="${h}" style="--c:${h}" aria-pressed="false" title="${t}, ${h}" aria-label="${t}, ${h}"><i></i><span>${t}</span></button>`).join("")}</div>` : "")
    + (FIN_PIC ? `<div class="r3d-finpic"><img src="${FIN_PIC.url}" data-finpicimg="1" alt="Your photo: tap a colour in it"><span class="r3d-finlab">Tap a colour in your photo</span></div>` : "")
    + (ceil && !liv ? `<span class="r3d-finlab">The bulbs</span>${finBulbTray(room)}${finFitTray(room)}` : "") + `</div>`;
  return [`${roomName(room)}: ${ceil ? "the ceiling" : liv && slot === 17 ? "skirting and door" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "the walls"}`, nm,
    [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), btn("As it is (hold)", { finhold: "1" }), ...(!drawn ? [btn("As drawn", { finc: "" })] : []), ...finCopyBtns(room)], null, tray];
}
function finHold(on) {   // As it is: while held, the palette empty (the house as drawn); let go, your colours back
  if (!FIN.pal) return;
  if (on && !finHeld) { livHeld = JSON.stringify([S.paint, S.custom, S.walls, S.ceil, S.skirt]); livSet({});   // N5: the living room as the plan has it too
    finHeld = FIN.pal.image.data.slice(); for (let i = 3; i < finHeld.length; i += 4) FIN.pal.image.data[i] = 0; FIN_LAID.forEach(m => m.visible = false); FIT_LAID.forEach(m => m.visible = false); Object.values(FIN_PEND).forEach(g => g.visible = true); }
  else if (!on && finHeld) { [S.paint, S.custom, S.walls, S.ceil, S.skirt] = JSON.parse(livHeld); livHeld = null; repaint(); syncButtons(); updateCaption();
    FIN.pal.image.data.set(finHeld); finHeld = null; FIN_LAID.forEach(m => m.visible = true); FIT_LAID.forEach(m => m.visible = true); for (const [r, g] of Object.entries(FIN_PEND)) g.visible = !finGet(r, 8); }
  FIN.pal.needsUpdate = true; finOut();
}
qs("#r3d-finschsave")?.addEventListener("click", finSchSave);
qs("#r3d-finschname")?.addEventListener("keydown", e => { if (e.key === "Enter") finSchSave(); });
qs("#r3d-finschl")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.finschdel) { const L = finSchemes(); L.splice(+b.dataset.finschdel, 1); try { localStorage.setItem(FSK, JSON.stringify(L)); } catch (er) {} finSchDraw(); }
  else if (b.dataset.finsch) finSchUse(+b.dataset.finsch); });
finSchDraw();
if (act) {
  act.addEventListener("click", e => {
    const ff = e.target.closest("[data-finfit]");
    if (ff && actId && (actId.startsWith("fin:") || actId.startsWith("hitem:"))) { e.stopPropagation();
      const room = actId.startsWith("fin:") ? actId.split(":")[1] : (HIT(actId.slice(6)) || {}).r; if (!room) return;
      finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
      if (ff.dataset.finfit) o[8] = ff.dataset.finfit; else delete o[8]; if (!Object.keys(o).length) delete S.fin[room];
      store.set(KEY, S); finFitApply(); roomKey = ""; placeRoomLights();
      toast(`${roomName(room)}: ${ff.dataset.finfit ? (FIN_FITS.find(([v]) => v === ff.dataset.finfit) || [0, ""])[1].toLowerCase() : "the light as it is"}`); renderAct(); return; }
    const bb = e.target.closest("[data-finbulb],[data-finlux]");
    if (bb && actId && (actId.startsWith("fin:") || actId.startsWith("hitem:"))) { e.stopPropagation();
      const room = actId.startsWith("fin:") ? actId.split(":")[1] : (HIT(actId.slice(6)) || {}).r; if (!room) return;
      finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
      if (bb.dataset.finbulb) { if (bb.dataset.finbulb === "2700") delete o[6]; else o[6] = bb.dataset.finbulb; }
      else { if (bb.dataset.finlux === "1") delete o[7]; else o[7] = bb.dataset.finlux; }
      if (!Object.keys(o).length) delete S.fin[room];
      store.set(KEY, S); roomKey = ""; placeRoomLights(); dirty();
      const fb = finBulb(room); toast(`${roomName(room)}: ${(FIN_BULBS.find(([v]) => v === (fb.k || "2700")) || [0, ""])[1].toLowerCase()} bulbs, ${(FIN_LUX.find(([v]) => +v === fb.lux) || [0, "normal"])[1].toLowerCase()}`);
      renderAct(); return; }
    const pi = e.target.closest("[data-finpicimg]");
    if (pi && actId && actId.startsWith("fin:")) { e.stopPropagation(); const hex = finPicAt(pi, e); if (hex) { const [, room, s] = actId.split(":"); finSet(room, +s, hex); renderAct(); } return; }
    const b = e.target.closest("[data-finc],[data-finf],[data-finsc],[data-finundo],[data-fincopy],[data-finpaste]"); if (!b || !actId || !actId.startsWith("fin:")) return;
    e.stopPropagation(); const [, room, s] = actId.split(":");
    if (b.dataset.finsc) finScope = b.dataset.finsc;
    else if (b.dataset.fincopy) { FIN_COPY = { room, sl: Object.assign({}, finAll()[room]) }; toast(`Copied ${roomName(room)}: tap another room, then Paste`); }
    else if (b.dataset.finpaste && FIN_COPY) { finPush(); S.fin = S.fin || {};   // N5: the living room's own six walls and skirting stay its own
      if (room === LIVR) livSet(FIN_COPY.sl); else S.fin[room] = Object.fromEntries(Object.entries(FIN_COPY.sl).filter(([k]) => +k <= 10 || +k === 23));
      finApplyAll(); store.set(KEY, S); toast(`${roomName(room)}: ${roomName(FIN_COPY.room)}'s look`); }
    else if (b.dataset.finundo) { const prev = FIN_UNDO.pop(); if (prev != null) { finRestore(JSON.parse(prev)); finApplyAll(); store.set(KEY, S); toast("Undone"); } }
    else if ("finf" in b.dataset) finSet(room, 5, b.dataset.finf || null);
    else finSet(room, +s, b.dataset.finc || null);
    renderAct();
  }, true);
  act.addEventListener("change", e => { if (e.target.dataset.finpic) { finPicLoad(e.target.files && e.target.files[0]); return; } if (e.target.dataset.finany && actId && actId.startsWith("fin:")) { const [, room, s] = actId.split(":"); finSet(room, +s, e.target.value); renderAct(); } });
  act.addEventListener("pointerdown", e => { if (e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) act.addEventListener(ev, () => finHold(false));
  act.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  act.addEventListener("keyup", e => { if (e.target.closest("[data-finhold]")) finHold(false); });
}
