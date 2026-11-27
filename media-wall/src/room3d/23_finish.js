/* V2.6 (F3): tap a wall or ceiling in any room: its card's colour tray, where it goes (wall, room, house), Undo, Hold to compare.
   Kept on this device (S.fin: room -> slot -> colour), drawn through 20_go.js finish. */
let NOWV = false;      // V3.90 (N151): As it is: the house without your colours and changes, shown only (nowMode)
let finScope = "room", finHeld = null, livHeld = null;
/* N5 (F8): the living room on the house's rows, its colours where its Look keeps them: 0-3 walls, 4 ceiling, 11-16 its six named walls,
   17 the skirting, door and frame; so schemes, Undo, Copy, Paste and Send carry it */
const LIVR = "living", LIV_W = WALLS.map(([k]) => k), LIV_HEX = /^#[0-9a-f]{6}$/i;
const livChanged = () => S.paint !== DEF.paint || Object.keys(S.walls).length > 0 || S.ceil !== "match" || S.skirt !== "match" || S.decor.rug !== DEF.decor.rug || S.decor.curtains !== DEF.decor.curtains;
function livRow() {
  const o = {}, h = paintHex(); [0, 1, 2, 3].forEach(s => o[s] = h); if (LIV_HEX.test(S.ceil)) o[4] = S.ceil; if (LIV_HEX.test(S.skirt)) o[17] = S.skirt;
  LIV_W.forEach((k, i) => { if (LIV_HEX.test(S.walls[k] || "")) o[11 + i] = S.walls[k]; }); if (S.decor.rug !== DEF.decor.rug) o[18] = S.decor.rug; if (S.decor.curtains !== DEF.decor.curtains) o[19] = S.decor.curtains; return o;
}
function livBase(hex) {   // the walls' paint: one of the paints by its key, else your own colour; none: the plan's (pale mint)
  const k = hex && Object.keys(R.PAINTS).find(q => R.PAINTS[q].hex.toLowerCase() === hex.toLowerCase());
  if (!hex) S.paint = DEF.paint; else if (k) S.paint = k; else { S.paint = "custom"; S.custom = hex; }
}
function livSet(o) {   // a row back into the living room's own Look (none: it stays as it is)
  if (!o) return; livBase([0, 1, 2, 3].map(s => o[s]).find(Boolean)); S.ceil = o[4] || "match"; S.skirt = o[17] || "match"; S.walls = {};
  LIV_W.forEach((k, i) => { if (o[11 + i]) setWall(k, o[11 + i]); }); S.decor.rug = o[18] || DEF.decor.rug; S.decor.curtains = o[19] || DEF.decor.curtains; applyDecor(); repaint(); syncButtons(); updateCaption();
}
function livFin(slot, hex, one) {   // one surface of the living room to a colour (null: as the plan has it)
  if (slot === 4) S.ceil = hex || "match"; else if (slot === 17) S.skirt = hex || "match";
  else if (one && slot >= 11) setWall(LIV_W[slot - 11], hex || "match"); else { livBase(hex); S.walls = {}; }
  repaint(); syncButtons(); updateCaption();
}
const finAll = (all = true) => Object.assign({}, S.fin || {}, all || livChanged() ? { [LIVR]: livRow() } : {});   // every room's row, the living room's too
function finRestore(o) { const c = finClean(o), L = c[LIVR]; delete c[LIVR]; S.fin = c; livSet(L); }
const finPush = () => { if (NOWV) nowMode(false); histPush(); };   // V3.90: a colour picked works on your plan
const finSlotName = (room, slot) => room === LIVR && slot >= 11 && slot <= 16 ? WALLS[slot - 11][1].toLowerCase() : slot === 17 ? (room === LIVR ? "skirting and door" : "woodwork") : slot === 29 ? "slopes" : slot >= 30 ? finWallName(room, slot) : `${FIN_NAMES[slot]} wall`;
/* N214: each wall as built (the house file's finish_walls: [side, line from, to, along from, to, m²]) its own colour in slot 30 + its
   number; This wall means it; a side with more than one says which, "the west wall (2 of 3)", counted along it */
const finWalls = room => (((R.HOUSE3 || {}).finish_walls || {})[room]) || [];
const finSide = (room, slot) => slot >= 30 ? (finWalls(room)[slot - 30] || [0])[0] : Math.min(3, slot);
function finWallName(room, slot) { const L = finWalls(room), w = L[slot - 30] || [0], on = L.filter(q => q[0] === w[0]);
  return `${FIN_NAMES[w[0]]} wall${on.length > 1 ? ` (${on.indexOf(w) + 1} of ${on.length})` : ""}`; }
const finSlopeHex = (room, v) => v === "walls" ? [0, 1, 2, 3].map(s => finGet(room, s)).find(Boolean) || R.HOUSE3.mats.paint[0] : v;   // the slopes with the walls: the back wall's, they rise from it
const finLook = (s, v) => (s <= 4 || s === 9 || s === 10 || s === 17 || (s >= 29 && s < 70)) && LIV_HEX.test(v || "") || (s === 29 && v === "walls") || (s >= 70 && /^[a-z]{4,8}(\.[a-z]{3,8})?$/.test(v || ""));   // the look link's colour rows; N227: a window's dressing
/* N263: one history for every change: colours, floors, the living room's moves, the house's moves, adds, swaps and Ideas (its edits
   rows, seen as they change: a burst of rows is one step). Undo · Redo on a pill after a change, Ctrl+Z / Ctrl+Shift+Z anywhere */
const UNDO_H = { past: [], future: [], he: null, want: null, wantT: 0, burst: 0, quiet: 0, t: 0 }, HIST_KEYS = ["ideas", "sugg", "svar", "gone", "beside"];
const histNow = he => JSON.stringify({ fin: finClean(finAll()), he: he || heOf(), lay: layNow(), s: Object.fromEntries(HIST_KEYS.map(k => [k, S[k]])) });
function histPush(snap) {
  const s = snap || histNow(); if (UNDO_H.past[UNDO_H.past.length - 1] !== s) UNDO_H.past.push(s);
  if (UNDO_H.past.length > 30) UNDO_H.past.shift(); UNDO_H.future = []; UNDO_H.burst = Date.now() + 500; histPill();
}
function histPut(snap) {
  const o = JSON.parse(snap); nowOff(); UNDO_H.want = JSON.stringify(o.he); UNDO_H.wantT = Date.now();
  for (const k of HIST_KEYS) if (o.s[k] !== undefined) S[k] = o.s[k];
  finRestore(o.fin); restoreLayout(o.lay); if (DS()) heWear(o.he, DS());
  applyLight(); placeAll(); finApplyAll(); updateCaption(); store.set(KEY, S);
}
function histStep(back) {
  const from = back ? UNDO_H.past : UNDO_H.future, to = back ? UNDO_H.future : UNDO_H.past; if (!from.length) return;
  to.push(histNow()); histPut(from.pop()); toast(back ? "Undone" : "Redone"); histPill(); if (GS.actId) renderAct();
}
const histUndo = () => histStep(true), histRedo = () => histStep(false);
function histReset() { UNDO_H.past = []; UNDO_H.future = []; UNDO_H.quiet = Date.now() + 1500; histPill(); }   // a look shown or put away starts afresh
function histSeen() {   // the house's edits rows changed: a step, unless Undo, Redo or a burst made it
  const now = JSON.stringify(heOf()), was = UNDO_H.he, t = Date.now(); UNDO_H.he = now; if (was == null || now === was) return;
  if (UNDO_H.want != null && t - UNDO_H.wantT < 3000) { if (now === UNDO_H.want) UNDO_H.want = null; return; }
  UNDO_H.want = null; if (t < UNDO_H.quiet) return; if (t < UNDO_H.burst) { UNDO_H.burst = t + 500; return; }
  histPush(histNow(JSON.parse(was)));
}
function histPill() {
  const p = document.getElementById("r3d-hist"); undoBtn(); if (!p) return;
  p.querySelector("[data-hist=undo]").disabled = !UNDO_H.past.length; p.querySelector("[data-hist=redo]").disabled = !UNDO_H.future.length;
  p.hidden = !UNDO_H.past.length && !UNDO_H.future.length; clearTimeout(UNDO_H.t); UNDO_H.t = setTimeout(() => { p.hidden = true; }, 8000);
}
addEventListener("demma-rows", e => { if (e.detail === "edits" && DS()) histSeen(); });
document.getElementById("r3d-hist")?.addEventListener("click", e => { const b = e.target.closest("[data-hist]"); if (b) b.dataset.hist === "undo" ? histUndo() : histRedo(); });
document.addEventListener("keydown", e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
  const k = e.key.toLowerCase(); if (k !== "z" && k !== "y") return; e.preventDefault(); (k === "y" || e.shiftKey) ? histRedo() : histUndo();
});
const FIN_NAMES = ["back", "front", "east", "west", "ceiling", "floor"];
/* V2.7 (F4): the floors: the house's own floor photos; each swatch the photo's mean colour */
const FIN_FLOORS = [["carpet_grey", "Grey carpet"], ["carpet", "Oatmeal carpet"], ["laminate", "Laminate"], ["oak", "Oak boards"], ["pine", "Pine boards"],
  ["tile_f", "Pale tiles"], ["marble", "Black marble"], ["quarry", "Quarry tiles"],
  ["herring", "Herringbone oak"], ["lvt_grey", "Grey oak LVT"], ["porcelain", "Stone porcelain"]];   // V3.14 (N56): upgrades to try (fit.SOURCES upfloors)
const FIN_FLOOR_KEYS = new Set([...FIN_FLOORS.map(([k]) => k), "board", "concrete", "vinyl", "earth"]);
const finFloorCol = k => { const pm = ((R.HOUSE3 || {}).photo_meta || {})[k]; return (pm && pm.avg) || ((((R.HOUSE3 || {}).mats || {})[k]) || ["#999999"])[0]; };
let FIN_LAID = [];
/* V2.9 (F5): a room's bulbs (2700 K to 5000 K, how bright) on its two ceiling lights (09 placeRoomLights) */
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
  return `<div class="r3d-finsc" role="group" aria-label="Bulbs">${chips(FIN_BULBS, "finbulb", b.k || "2700")}</div>`
    + `<div class="r3d-finsc" role="group" aria-label="How bright">${chips(FIN_LUX, "finlux", b.lux === 1 ? "1" : String(b.lux))}</div>`;
}
const FIN_FITS = [["bare", "Bare bulb"], ["drum", "Drum shade"], ["globe", "Globe"], ["dome", "Flush dome"], ["spots", "Four spots"]];   // V2.15 (F5): the fitting at the ceiling point (E: a 40 drum, a 25 globe, a 32 dome, GU10 spots 45 out)
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
      for (const [geos, mat] of [[white, FIN.mat3("upvc")], [glow, FIN.mat3("bulb")], [shade, FIT_SHADE]]) if (geos.length) {
        const me = new THREE.Mesh(mergeGeometries(geos), mat); geos.forEach(q => q.dispose()); me.castShadow = false; me.userData.finFit = L.room; into.add(me); FIT_LAID.push(me); } } }
  dirty();
}
function finFitTray(room) {
  const now = finGet(room, 8) || "";
  return `<span class="r3d-finlab">Light fitting</span><div class="r3d-finsc" role="group" aria-label="Light fitting">`
    + [["", "The plan's"], ...FIN_FITS].map(([v, t]) => `<button type="button" data-finfit="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`;
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
  finFitApply(); finRugApply(); finCurtApply(); finPicApply(); finPaperApply(); finPanelApply(); dirty();
}
/* N5c: curtains at a room's windows (row [19]): a pole a little wider than the window, two panels drawn back, head to sill (clear of a
   worktop), 14 cm in (clear of a radiator). The living room's are its Look's.
   N227: each window dressed on its own: slot 70 + its number among its room's windows (winsOf), "kind.finish" or "none": curtains, a
   roller or Roman blind (a fabric), shutters (a finish); none set, the room's curtains (19), else the plan's (bedroom 2's and the
   office's roller blinds, hidden under her own). Drawn in the curtains' cloth, the pole's metal, the window frames' white, the oak;
   rough costs a window: fit.SOURCES windress */
const FIN_CURT = [["linen", "Linen", "#e6e0d2"], ["sage", "Sage", "#8b9878"], ["blue", "Deep blue", "#34507f"], ["rust", "Rust", "#a65a38"], ["charcoal", "Charcoal", "#4a4d52"]];
const LIV_CURT = [["hessian", "Your hessian"], ["linen", "Linen"], ["sage", "Sage"], ["blue", "Deep blue"], ["rust", "Rust"]];
const WIN_KINDS = [["curtains", "Curtains"], ["roller", "Roller blind"], ["roman", "Roman blind"], ["shutters", "Shutters"], ["none", "Nothing"]];
const WIN_SHUT = [["white", "White", "#f1efe9"], ["oak", "Oak", "#b48a5a"], ["grey", "Grey", "#8e9296"], ["sage", "Sage", "#8b9878"]];
const winFabs = k => k === "shutters" ? WIN_SHUT : FIN_CURT;
let WIN_ALL = null; const WIN_ORIG = new WeakMap();
function winAll() {   // every window but the living room's: its item, room, floor, side (1: the room is to +z), span, sill, head, its room's floor and inside face
  if (WIN_ALL || !R.HOUSE3 || !R.HOUSE3.finish_pieces) return WIN_ALL || [];
  const H = R.HOUSE3, its = Object.entries(H.items || {}).filter(([, v]) => v.k === "window" && v.op);
  return WIN_ALL = (H.windows_in || []).map(([f, side, x0, x1, sill, head]) => { const m = its.find(([, v]) => v.op.a === x0 && v.op.b === x1); if (!m) return null;
    const xm = (x0 + x1) / 2, Y = (H.finish_floor_y || {})[f] || []; let best = null;   // the piece of floor furthest out at its middle
    (H.finish_pieces[f] || []).forEach(([, a, b, z0, z1], i) => { const z = side === "n" ? z0 : z1; if (a <= xm && b >= xm && (!best || (side === "n" ? z < best.z : z > best.z))) best = { z, y: Y[i] || 0 }; });
    const b = m[1].b, z = b && Math.abs(b[5] - b[2]) < 40 && b[3] - b[0] < x1 - x0 + 20 ? (side === "n" ? b[5] : b[2]) : best && best.z;   // its frame's room side (a dormer's sits in from the room's edge)
    return best && { id: m[0], room: m[1].r, n: m[1].n, f, s: side === "n" ? 1 : -1, x0, x1, sill, head, yf: best.y, z }; }).filter(Boolean);
}
const winsOf = room => winAll().filter(w => w.room === room);
const winOf = id => { const w = winAll().find(q => q.id === id); return w ? `win:${w.room}:${winsOf(w.room).indexOf(w)}` : null; };   // a window's card by its item
const winPlan = w => Object.entries(R.HOUSE3.items || {}).some(([k, v]) => /\.blind$/.test(k) && v.r === w.room && v.b && v.b[0] < w.x1 && v.b[3] > w.x0);   // the plan's roller blind there
const winOk = (room, k, v) => { const [a, b] = String(v).split("."); return !!winsOf(room)[k - 70] && (a === "none" ? b === undefined : WIN_KINDS.some(([q]) => q === a) && winFabs(a).some(([q]) => q === b)); };
function winNow(room, j) {   // {k, c, own}: her own, the room's curtains, or the plan's
  const v = finGet(room, 70 + j); if (v) { const [k, c] = v.split("."); return { k, c: c || null, own: true }; }
  const c = finGet(room, 19); if (c) return { k: "curtains", c, room: true };
  return { k: winPlan(winsOf(room)[j] || {}) ? "roller" : "none", c: null, plan: true };
}
const winArea = w => Math.max(0.5, (w.x1 - w.x0) * (w.head - w.sill) / 1e4);
const winCost = (w, v) => { const k = String(v).split(".")[0]; return k === "shutters" ? UPC.shut.map(p => p * winArea(w)) : k === "roller" ? UPC.roller : k === "roman" ? UPC.roman : k === "curtains" ? UPC.curt : [0, 0]; };
const winSay = (k, c) => k === "none" ? "nothing" : `${upNm(WIN_KINDS, k).toLowerCase()}${c ? ", " + upNm(winFabs(k), c).toLowerCase() : ""}`;
let CURT_LAID = []; const CURT_MATS = {};
function houseMat(key, m) { const P = HMATS.paint; houseClip(m, P && CLIPSRC.get(P) || [], !!(P && P.clipIntersection)); HMATS[key] = m; return m; }   // with the house's, so a floor's cut takes it too
const curtMat = k => CURT_MATS[k] || (CURT_MATS[k] = houseMat(`curt_${k}`, new THREE.MeshStandardMaterial({ color: (FIN_CURT.find(([q]) => q === k) || [])[2] || CURTAIN_COLS[k] || "#e6e0d2", roughness: 0.95, side: THREE.DoubleSide })));
const shutMat = k => k === "white" ? FIN.mat3("upvc") : k === "oak" ? FIN.mat3("oak")
  : CURT_MATS["s_" + k] || (CURT_MATS["s_" + k] = houseMat(`shut_${k}`, new THREE.MeshStandardMaterial({ color: (WIN_SHUT.find(([q]) => q === k) || [])[2] || "#f1efe9", roughness: 0.6 })));
function winGeos(w, k, c) {   // [[geometries, material]] for a window dressed: z counts into the room from its inside face
  const top = w.yf + w.head, bot = w.yf + w.sill, H = top - bot, W = w.x1 - w.x0, F = [], M3 = [], S3 = [], at = (x, y, z) => v3(x, y, w.z + w.s * z);
  const box = (L, xa, xb, ya, yb, za, zb) => { const g = new THREE.BoxGeometry((xb - xa) * M, (yb - ya) * M, (zb - za) * M), q = at((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2); g.translate(q.x, q.y, q.z); L.push(g); return g; };
  const rod = (L, xa, xb, y, z, r) => { const g = new THREE.CylinderGeometry(r * M, r * M, (xb - xa) * M, 12); g.rotateZ(Math.PI / 2); const q = at((xa + xb) / 2, y, z); g.translate(q.x, q.y, q.z); L.push(g); };
  const cloth = (xa, xb, ya, yb, z, wave) => { const g = new THREE.PlaneGeometry((xb - xa) * M, (yb - ya) * M, wave ? 12 : 1, 1), P = g.attributes.position;
    if (wave) for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin((P.getX(i) / ((xb - xa) * M) + 0.5) * Math.PI * 6) * 0.025);
    if (w.s < 0) g.rotateY(Math.PI); const q = at((xa + xb) / 2, (ya + yb) / 2, z); g.translate(q.x, q.y, q.z); g.computeVertexNormals(); F.push(g); };
  const xa = w.x0 - 4, xb = w.x1 + 4;   // a blind face-fixed, 4 cm past the window each side
  if (k === "curtains") { const ct = w.yf + Math.min(w.head + 12, (R.HOUSE3.ceil || 235) - 5), pw = W * 0.3 + 15;
    for (const x of [w.x0 - 15, w.x1 + 15 - pw]) cloth(x, x + pw, bot + 1, ct, 14, true);
    rod(M3, w.x0 - 20, w.x1 + 20, ct + 3, 14, 1.2); }
  else if (k === "roller") { const yb = top - H * 0.42;   // a tube over the window, the cloth down to under half way, a weighted bar
    rod(F, xa, xb, top + 6, 5, 3.5); cloth(xa + 1, xb - 1, yb, top + 6, 8.6, false); box(M3, xa + 1, xb - 1, yb - 2.5, yb, 7.6, 9.6);
    box(M3, xa - 1.5, xa, top + 1, top + 10, 0, 9); box(M3, xb, xb + 1.5, top + 1, top + 10, 0, 9); }
  else if (k === "roman") { const yb = top - H * 0.38;   // a headrail in its cloth, the face down to its folds stacked at the foot
    box(F, xa, xb, top + 2, top + 9, 0, 6); cloth(xa, xb, yb + 12, top + 2, 6.4, false);
    for (let i = 0; i < 4; i++) rod(F, xa, xb, yb + 3.2 + i * 3.4, 7.6 - i * 0.5, 3.2); }
  else if (k === "shutters") {   // in the opening, on its sill: an L-frame, panels of two tiers, louvres half open (63 mm: fit.SOURCES windress)
    box(S3, w.x0 - 4, w.x1 + 4, top, top + 4, 0, 2.5); box(S3, w.x0 - 4, w.x0, bot, top, 0, 2.5); box(S3, w.x1, w.x1 + 4, bot, top, 0, 2.5);
    const n = W > 130 ? 4 : 2, pw = W / n, mid = bot + H / 2;
    for (let i = 0; i < n; i++) { const p0 = w.x0 + i * pw + 0.3, p1 = p0 + pw - 0.6;
      box(S3, p0, p0 + 4.5, bot, top, 0.5, 3.5); box(S3, p1 - 4.5, p1, bot, top, 0.5, 3.5);
      for (const [ya, yb] of [[bot, bot + 9], [mid - 3.5, mid + 3.5], [top - 7, top]]) box(S3, p0 + 4.5, p1 - 4.5, ya, yb, 0.8, 3.2);
      for (const [ya, yb] of [[bot + 9, mid - 3.5], [mid + 3.5, top - 7]]) for (let y = ya + 3; y < yb - 2; y += 5.2) {   // a louvre: a board 6.3 deep turned 40°
        const g = new THREE.BoxGeometry((p1 - p0 - 9) * M, 0.9 * M, 6.3 * M), q = at((p0 + p1) / 2, y, 2); g.rotateX(0.7); g.translate(q.x, q.y, q.z); S3.push(g); } } }
  return [[F, () => curtMat(c)], [M3, () => CURT_MATS.pole || (CURT_MATS.pole = houseMat("curt_pole", new THREE.MeshStandardMaterial({ color: "#3b3a38", roughness: 0.4, metalness: 0.6 })))], [S3, () => shutMat(c)]];
}
function finCurtApply() {
  if (!finSetup() || !houseG) return;
  if (!AFTER_FLOOR.has("win")) AFTER_FLOOR.set("win", () => { finFloorApply(); doorApply(); });   // N227, N255: a floor rebuilt (an edit) drops what's laid on it: laid again
  for (const m of CURT_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } CURT_LAID = [];
  for (const w of winAll()) { const g = HFLOOR[w.f], j = winsOf(w.room).indexOf(w), now = winNow(w.room, j); if (!g || now.plan || now.k === "none") continue;
    for (const [geos, mat] of winGeos(w, now.k, now.c)) if (geos.length) { const m = mat(), me = new THREE.Mesh(m.map ? worldUV(mergeGeometries(geos), m.userData.hk) : mergeGeometries(geos), m); geos.forEach(q => q.dispose());
      me.receiveShadow = true; me.castShadow = true; me.userData.finRoom = w.room; me.userData.win = `win:${w.room}:${j}`; me.visible = !finHeld; g.add(me); CURT_LAID.push(me); } }
  winPlanHide(); dirty();
}
function winPlanHide() {   // the plan's roller blinds where she's dressed the window her own way (their faces folded to a point; back while Hold to compare)
  if (!houseG) return; const off = finHeld ? [] : winAll().filter(w => finGet(w.room, 70 + winsOf(w.room).indexOf(w)) && winPlan(w)), key = off.map(w => w.id).join(); let n = 0;
  houseG.traverse(me => { const hk = me.isMesh && me.material && me.material.userData && me.material.userData.hk; if (hk !== "blind" && hk !== "blind_cloth") return;
    const P = me.geometry.attributes.position, st = WIN_ORIG.get(P); if (st ? st.key === key : !key) return;   // a roomCull twin shares its attribute: once
    const a = st ? st.a : P.array.slice(); WIN_ORIG.set(P, { a, key }); P.array.set(a);
    for (const w of off) { let k = -1; for (let i = 0; i < P.count; i++) { const x = -a[3 * i] / M, y = a[3 * i + 1] / M, z = a[3 * i + 2] / M;
      if (x > w.x0 - 8 && x < w.x1 + 8 && y > w.yf + w.sill - 5 && y < w.yf + w.head + 15 && Math.abs(z - w.z) < 25) { if (k < 0) k = i; P.array.copyWithin(3 * i, 3 * k, 3 * k + 3); } } }
    P.needsUpdate = true; n++; });
  if (n && typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); }
}
/* N5d (REAL_PLAN R7): the bedding's colour, a room's row [20], through the palette (20_go.js: the duvet and pillows, slot 5); on the bed's card */
const FIN_BED = [["#f4f1eb", "White"], ["#a3a29e", "Grey"], ["#8b9878", "Sage"], ["#34507f", "Deep blue"], ["#a65a38", "Rust"], ["#c9a03f", "Mustard"], ["#d9a9a0", "Blush"]];
function finBedTray(room) {
  const now = finGet(room, 20) || "";
  return `<div class="r3d-fin">${finTray("Bedding", [["", "The plan's"], ...FIN_BED].map(([h, t]) => finSwatch("finbed", h, t, h || "#e9e5dc", now === h)).join(""))}</div>`;
}
const FIN_PICS = [["arches", "Arches"], ["sun", "Sunset"], ["leaves", "Leaves"], ["lines", "Lines"]];   // N5e: a print in a 52 × 72 frame (IKEA RIBBA: fit.SOURCES ribba), its middle 150 up, mid-wall, 2 off it; row [21] the print, [22] the wall
let PIC_LAID = []; const PIC_MATS = {};
function picTex(k) {
  return canvasTex(256, 358, (g, w, h) => {
    g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h); const m = 22;
    if (k === "arches") ["#c7643a", "#e0a26e", "#8b9878", "#f3eee4"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); const r = 96 - i * 22; g.arc(w / 2, h - 70, r, Math.PI, 0); g.lineTo(w / 2 + r, h - 70); g.fill(); });
    else if (k === "sun") { g.fillStyle = "#e9c9a0"; g.fillRect(m, m, w - 2 * m, h * 0.6); g.fillStyle = "#c7643a"; g.beginPath(); g.arc(w / 2, h * 0.5, 52, 0, Math.PI * 2); g.fill(); g.fillStyle = "#34507f"; g.fillRect(m, h * 0.6, w - 2 * m, h * 0.4 - m); }
    else if (k === "leaves") { g.strokeStyle = "#4f6b45"; g.fillStyle = "#6f8a5f"; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h - m); g.lineTo(w / 2, m + 20); g.stroke();
      for (let i = 0; i < 7; i++) { const y = h - 70 - i * 36, d = i % 2 ? 1 : -1; g.beginPath(); g.ellipse(w / 2 + d * 34, y, 36, 13, d * -0.5, 0, Math.PI * 2); g.fill(); } }
    else { const C = ["#1f1f21", "#c7643a", "#8b9878", "#34507f"]; g.lineWidth = 9; g.lineCap = "round"; for (let i = 0; i < 6; i++) { g.strokeStyle = C[i % 4]; g.beginPath(); g.moveTo(m + 20, m + 40 + i * 48); g.bezierCurveTo(w * 0.3, m + i * 52, w * 0.7, m + 90 + i * 40, w - m - 20, m + 30 + i * 50); g.stroke(); } }
  });
}
function finBig(room) {   // a room's biggest piece of floor: where its rug, picture and wallpaper go
  let best = null;
  ["lower", "ground", "first"].forEach(f => (R.HOUSE3.finish_pieces[f] || []).forEach(([ri, x0, x1, z0, z1], i) => {
    const a = (x1 - x0) * (z1 - z0); if (FIN.rooms[ri] === room && (!best || a > best.a)) best = { a, f, x0, x1, z0, z1, y: ((R.HOUSE3.finish_floor_y || {})[f] || [])[i] || 0 }; }));
  return best;
}
function finPicApply() {
  if (!finSetup() || !houseG) return;
  for (const m of PIC_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } PIC_LAID = [];
  const frame = PIC_MATS.frame || (PIC_MATS.frame = houseMat("pic_frame", new THREE.MeshStandardMaterial({ color: "#1f1f21", roughness: 0.5 })));
  for (const [room, sl] of Object.entries(S.fin || {})) { const k = sl[21]; if (!k || !FIN.rooms.includes(room)) continue;
    const best = finBig(room);
    const g = best && HFLOOR[best.f]; if (!g) continue;
    const side = +(sl[22] || 0), alongX = side < 2, c = alongX ? [(best.x0 + best.x1) / 2, side === 0 ? best.z0 + 4 : best.z1 - 4] : [side === 2 ? best.x0 + 4 : best.x1 - 4, (best.z0 + best.z1) / 2];
    const box = new THREE.BoxGeometry(52 * M, 72 * M, 4 * M), face = new THREE.PlaneGeometry(46 * M, 66 * M); face.translate(0, 0, 2.05 * M);
    for (const q of [box, face]) { q.rotateY([0, Math.PI, -Math.PI / 2, Math.PI / 2][side]); const p = v3(c[0], best.y + 150, c[1]); q.translate(p.x, p.y, p.z); }
    const art = PIC_MATS[k] || (PIC_MATS[k] = houseMat(`pic_${k}`, new THREE.MeshStandardMaterial({ map: picTex(k), roughness: 0.85 })));
    for (const me of [new THREE.Mesh(box, frame), new THREE.Mesh(face, art)]) { me.castShadow = true; me.receiveShadow = true; me.userData.finRoom = room; g.add(me); PIC_LAID.push(me); } }
  dirty();
}
function finPicTray(room, slot) {
  const now = finGet(room, 21) || "", here = +(finGet(room, 22) || 0) === slot;
  return `<span class="r3d-finlab">Picture${now && !here ? " (on another wall)" : ""}</span><div class="r3d-finsc" role="group" aria-label="Picture">`
    + [["", "None"], ...FIN_PICS].map(([v, t]) => `<button type="button" data-finpic2="${v}" aria-pressed="${(here || !v) && now === v}">${t}</button>`).join("") + `</div>`;
}
/* N29 (F9): wallpaper on one wall (row [24] the paper, [25] the wall) at its real repeat from the corner, round openings, to the ceiling;
   rolls from real sizes (fit.SOURCES wallpaper): drops of the height plus a repeat, one spare */
const FIN_PAPERS = [["fine", "Fine stripe", 52, 1000, 53, 60], ["wide", "Wide stripe", 52, 1000, 64, 70], ["flower", "Wildflower", 52, 1000, 53, 60]];   // key, name, roll width and length (cm), repeat (cm), £ a roll
let PAPER_LAID = []; const PAPER_MATS = {}, PAPER_AT = {};
function paperTex(k, rep) {
  return canvasTex(256, Math.round(256 * rep / 52), (g, w, h) => {
    if (k === "fine") { g.fillStyle = "#e2e8e6"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#9db3b7" : "#c6d4d4"; g.fillRect(i * w / 8 + 8, 0, i % 2 ? 5 : 12, h); } }
    else if (k === "wide") { g.fillStyle = "#26344f"; g.fillRect(0, 0, w, h); g.fillStyle = "#30405f"; g.fillRect(w / 4, 0, w / 4, h); g.fillRect(3 * w / 4, 0, w / 4, h);
      g.fillStyle = "#c4a35a"; for (const x of [w / 4, w / 2, 3 * w / 4, w]) g.fillRect(x - 2, 0, 3, h); }
    else { g.fillStyle = "#2f5f62"; g.fillRect(0, 0, w, h); const r = rnd(7);
      for (let i = 0; i < 9; i++) { const x = (i % 3) * w / 3 + w / 6 + (r() - 0.5) * 30, y = Math.floor(i / 3) * h / 3 + h / 6 + 12 + (r() - 0.5) * 24;
        g.strokeStyle = "#b8794a"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 34); g.quadraticCurveTo(x + 6, y + 10, x, y - 24); g.stroke();
        g.fillStyle = "#d9c7a8"; for (let j = 0; j < 5; j++) { const a = j * 1.26; g.beginPath(); g.ellipse(x + Math.cos(a) * 7, y - 26 + Math.sin(a) * 7, 5, 3, a, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = "#6f9a7c"; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * 9, y + 8, 9, 3.5, d * 0.6, 0, Math.PI * 2); g.fill(); } } }
  });
}
function finWallRun(room, side, walls, ceils) {   // a room's wall (0–3) as a run: its face, ends, the doors and windows on it, the ceiling over it (N29; N57 shares it)
  const b = finBig(room), g = b && HFLOOR[b.f]; if (!g) return null;
  const ray = new THREE.Raycaster(), CEIL = R.HOUSE3.ceil || 235, zw = side < 2, s = side % 2 ? -1 : 1, ri = FIN.rooms.indexOf(room);
  let c = [b.z0, b.z1, b.x0, b.x1][side], u0 = zw ? b.x0 : b.z0, u1 = zw ? b.x1 : b.z1;
  for (const q of R.HOUSE3.finish_pieces[b.f] || []) if (q[0] === ri && Math.abs([q[3], q[4], q[1], q[2]][side] - c) < 1) {   // the room's other pieces along the same wall
    const [a0, a1] = zw ? [q[1], q[2]] : [q[3], q[4]]; if (a0 <= u1 + 1 && a1 >= u0 - 1) { u0 = Math.min(u0, a0); u1 = Math.max(u1, a1); } }
  const at = (u, y) => zw ? v3(u, b.y + y, c) : v3(c, b.y + y, u), nrm = zw ? new THREE.Vector3(0, 0, s) : new THREE.Vector3(-s, 0, 0);
  g.updateMatrixWorld(true); const W = g.matrixWorld, Wi = W.clone().invert(), back = nrm.clone().negate().transformDirection(W), face = [];
  for (let u = u0 + 15; u < u1 - 10; u += 40) for (const y of [60, 150]) {   // the wall's own face (a lining may stand proud of the floor's edge)
    ray.set(at(u, y).add(nrm.clone().multiplyScalar(40 * M)).applyMatrix4(W), back); const h = ray.intersectObjects(walls, false)[0];
    if (h) { const d = h.point.clone().applyMatrix4(Wi).sub(at(u, y).add(nrm.clone().multiplyScalar(40 * M))).length() / M; if (d < 80) face.push(40 - d); } }
  face.sort((p, q) => p - q); c += s * ((face.length ? face[face.length >> 1] : 0) + 0.5);
  const ops = Object.values(R.HOUSE3.items || {}).map(it => it.op).filter(o => o && o.axis === (zw ? "x" : "z") && Math.abs(o.line - c) < 45 && o.y1 > b.y + 5 && o.y0 < b.y + CEIL)
    .map(o => [Math.max(u0, o.a), Math.min(u1, o.b), o.y0 - b.y, o.y1 - b.y]).filter(o => o[1] - o[0] > 1);
  const us = [], tops = [];   // the ceiling over the wall, every 26 cm
  for (let u = u0; ; u = Math.min(u1, u + 26)) { ray.set(at(u, 100).add(nrm.clone().multiplyScalar(3 * M)).applyMatrix4(W), new THREE.Vector3(0, 1, 0));
    const h = ray.intersectObjects(ceils, false)[0], y = h ? h.point.clone().applyMatrix4(Wi).y / M - b.y : CEIL; us.push(u); tops.push(Math.min(CEIL, y > 30 ? y : CEIL)); if (u >= u1) break; }
  const top = u => { let i = 1; while (i < us.length - 1 && us[i] < u) i++; const t = (u - us[i - 1]) / ((us[i] - us[i - 1]) || 1); return tops[i - 1] + (tops[i] - tops[i - 1]) * Math.max(0, Math.min(1, t)); };
  return { b, g, at, nrm, u0, u1, ops, us, tops, top };
}
const finHouseFaces = () => { const ceils = [], walls = []; houseG.traverse(o => { const q = o.isMesh && o.material && FIN.kind[(o.material.userData || {}).hk]; if (q === 1) ceils.push(o); else if (q === 0) walls.push(o); }); return { walls, ceils }; };
function finPaperApply() {
  if (!finSetup() || !houseG) return;
  for (const m of PAPER_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } PAPER_LAID = [];
  for (const k of Object.keys(PAPER_AT)) delete PAPER_AT[k];
  const { walls, ceils } = finHouseFaces();
  for (const [room, sl] of Object.entries(S.fin || {})) { const P = FIN_PAPERS.find(([q]) => q === sl[24]); if (!P || !FIN.rooms.includes(room) || room === LIVR) continue;
    const [k, , rw, rl, rep, cost] = P, side = +(sl[25] || 0), Wr = finWallRun(room, side, walls, ceils); if (!Wr) continue;
    const { g, at, nrm, u0, u1, ops, us, tops, top } = Wr;
    const cut = [...new Set([...us, ...ops.flatMap(o => [o[0], o[1]])])].filter(u => u >= u0 && u <= u1).sort((p, q) => p - q), pos = [], uv = [];
    const tri = (A, B, C) => { const [a, bb, cc] = [A, B, C].map(([u, y]) => at(u, y)); if (bb.clone().sub(a).cross(cc.clone().sub(a)).dot(nrm) < 0) { [B, C] = [C, B]; }
      for (const [u, y] of [A, B, C]) { const p = at(u, y); pos.push(p.x, p.y, p.z); uv.push((u - u0) / rw, y / rep); } };
    for (let i = 1; i < cut.length; i++) { const ua = cut[i - 1], ub = cut[i], um = (ua + ub) / 2; if (ub - ua < 0.5) continue;
      let y = 0; const quad = (y0, ta, tb) => { if (ta - y0 < 1 && tb - y0 < 1) return; tri([ua, y0], [ub, y0], [ub, tb]); tri([ua, y0], [ub, tb], [ua, ta]); };
      for (const o of ops.filter(o => o[0] <= um && o[1] >= um).sort((p, q) => p[2] - q[2])) { if (o[2] > y) quad(y, Math.min(o[2], top(ua)), Math.min(o[2], top(ub))); y = Math.max(y, o[3]); }
      if (y < Math.min(top(ua), top(ub))) quad(y, top(ua), top(ub)); }
    if (!pos.length) continue;
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const mat = PAPER_MATS[k] || (PAPER_MATS[k] = houseMat(`paper_${k}`, new THREE.MeshStandardMaterial({ map: paperTex(k, rep), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })));
    const me = new THREE.Mesh(geo, mat); me.receiveShadow = true; me.userData.finRoom = room; me.userData.finWall = side; g.add(me); PAPER_LAID.push(me);
    const L = u1 - u0, H = Math.max(...tops), per = Math.max(1, Math.floor(rl / (H + rep))), rolls = Math.ceil(Math.ceil(L / rw) / per) + 1;
    PAPER_AT[room] = { k, L, H, rolls, cost: rolls * cost }; }
  dirty();
}
/* N57: panelling (fit.SOURCES panels): Shaker MDF strips to 120 in the wall's colour, or oak slats floor to ceiling on black felt; real
   boxes round openings, one draw a kind a room */
const FIN_PANELS = [["shaker", "Shaker", 36.97, 8 * 240], ["slat", "Oak slats", 71.99, 60 * 240]];   // key, name, £ a pack, what a pack covers (cm of strip; cm² of panel)
let PANEL_LAID = []; const PANEL_AT = {};
function finPanelApply() {
  if (!finSetup() || !houseG || !FIN.mat3) return;
  for (const m of PANEL_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } PANEL_LAID = [];
  for (const k of Object.keys(PANEL_AT)) delete PANEL_AT[k];
  const F = finHouseFaces();
  for (const [room, sl] of Object.entries(S.fin || {})) { const P = FIN_PANELS.find(([q]) => q === sl[26]); if (!P || !FIN.rooms.includes(room) || room === LIVR) continue;
    const side = +(sl[27] || 0), Wr = finWallRun(room, side, F.walls, F.ceils); if (!Wr) continue;
    const { g, at, nrm, u0, u1, ops, top } = Wr, zw = side < 2, parts = { a: [], b: [] }; let strip = 0;
    const box = (L, ua, ub, ya, yb, d0, d1) => { if (ub - ua < 0.3 || yb - ya < 0.3) return; const q = new THREE.BoxGeometry((zw ? ub - ua : d1 - d0) * M, (yb - ya) * M, (zw ? d1 - d0 : ub - ua) * M);
      const p = at((ua + ub) / 2, (ya + yb) / 2).add(nrm.clone().multiplyScalar((d0 + d1) / 2 * M)); q.translate(p.x, p.y, p.z); L.push(q); };
    const clipV = (ua, ub, ya, yb) => { let r = [[ya, Math.min(yb, top(ua) - 0.5, top(ub) - 0.5)]];   // a strip up the wall, round the openings
      for (const o of ops) if (o[0] < ub && o[1] > ua) r = r.flatMap(([a, c]) => [[a, Math.min(c, o[2])], [Math.max(a, o[3]), c]]); return r.filter(([a, c]) => c - a > 1); };
    const clipH = (ua, ub, ya, yb) => { let r = [[ua, ub]];   // a rail along it
      for (const o of ops) if (o[2] < yb && o[3] > ya) r = r.flatMap(([a, c]) => [[a, Math.min(c, o[0])], [Math.max(a, o[1]), c]]); return r.filter(([a, c]) => c - a > 1); };
    if (P[0] === "shaker") { const w = 9.7, t = 0.9, y0 = 10, y1 = 120, at_ = new Set([u0, u1 - w]);
      const n = Math.max(1, Math.round((u1 - u0 - w) / 55)); for (let i = 1; i < n; i++) at_.add(u0 + (u1 - u0 - w) * i / n);
      for (const o of ops) if (o[2] < y0 + w) { at_.add(o[0] - w); at_.add(o[1]); }
      for (const ya of [y0, y1 - w]) for (const [a, c] of clipH(u0, u1, ya, ya + w)) { box(parts.a, a, c, ya, ya + w, 0, t); strip += c - a; }
      for (const u of at_) if (u >= u0 - 0.1 && u + w <= u1 + 0.1) for (const [a, c] of clipV(u, u + w, y0 + w, y1 - w)) { box(parts.a, u, u + w, a, c, 0, t); strip += c - a; } }
    else { const H = Math.max(...Wr.tops);
      for (let u = u0 + 0.65; u + 2.7 <= u1; u += 4) for (const [a, c] of clipV(u - 0.65, u + 3.35, 0, H)) { box(parts.b, u - 0.65, u + 3.35, a, c, 0, 0.9); box(parts.a, u, u + 2.7, a, c, 0.9, 2.1); } }
    const hex = finGet(room, side) || finGet(room, 0) || R.HOUSE3.mats.paint[0];
    const mats = P[0] === "shaker" ? { a: PANEL_AT["m" + hex] || (PANEL_AT["m" + hex] = houseMat("panel_" + hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 }))) } : { a: FIN.mat3("oak"), b: FIN.mat3("felt") };
    for (const [k, L] of Object.entries(parts)) { if (!L.length) continue; const geo = mergeGeometries(L); L.forEach(q => q.dispose());
      const me = new THREE.Mesh(P[0] === "slat" && k === "a" ? worldUV(geo, "oak") : geo, mats[k]); me.castShadow = me.receiveShadow = true; me.userData.finRoom = room; me.userData.finWall = side; g.add(me); PANEL_LAID.push(me); }
    const L = u1 - u0, packs = P[0] === "shaker" ? Math.ceil(strip * 1.1 / P[3]) : Math.ceil(L / 60) * Math.ceil(Math.max(...Wr.tops) / 240);
    PANEL_AT[room] = { k: P[0], packs, cost: Math.round(packs * P[2]) }; }
  dirty();
}
function finPanelTray(room, slot) {
  const now = finGet(room, 26) || "", here = +(finGet(room, 27) || 0) === slot, A = PANEL_AT[room];
  return `<span class="r3d-finlab">Panelling${now && !here ? " (on another wall)" : now && A ? `: ${A.packs} ${A.k === "slat" ? "panels" : "packs"}, ~£${A.cost}` : ""}</span><div class="r3d-finsc" role="group" aria-label="Panelling">`
    + [["", "None"], ...FIN_PANELS].map(([v, t]) => `<button type="button" data-finpanel="${v}" aria-pressed="${(here || !v) && now === v}">${t}</button>`).join("") + `</div>`;
}
function finPaperTray(room, slot) {
  const now = finGet(room, 24) || "", here = +(finGet(room, 25) || 0) === slot, A = PAPER_AT[room];
  return `<span class="r3d-finlab">Wallpaper${now && !here ? " (on another wall)" : now && A ? `: ${A.rolls} rolls, ~£${A.cost}` : ""}</span><div class="r3d-finsc" role="group" aria-label="Wallpaper">`
    + [["", "None"], ...FIN_PAPERS].map(([v, t]) => `<button type="button" data-finpaper="${v}" aria-pressed="${(here || !v) && now === v}">${t}</button>`).join("") + `</div>`;
}
/* N29 (F11): each paint's maker's pairings (fit.SOURCES pairings), the hex their pages give */
const FIN_PAIRS = {
  card_room: [["#e3ded0", "Farrow & Ball School House White No. 291"], ["#c5bdac", "Farrow & Ball Drop Cloth No. 283"], ["#889b9b", "Farrow & Ball Oval Room Blue No. 85"],
    ["#b19c8d", "Farrow & Ball Dead Salmon No. 28"], ["#464d4a", "Farrow & Ball Studio Green No. 93"], ["#6f4449", "Farrow & Ball Preference Red No. 297"]],
  treron: [["#e6e0d2", "Farrow & Ball Slipper Satin No. 2004"], ["#e3dcc7", "Farrow & Ball Lime White No. 1"], ["#dbd4bf", "Farrow & Ball Off-White No. 3"],
    ["#c7bfab", "Farrow & Ball Old White No. 4"], ["#caccba", "Farrow & Ball Eddy No. 301"], ["#b0af9b", "Farrow & Ball French Gray No. 18"]],
  sage: [["#f8f4e3", "Little Greene Stock"], ["#e9e6d5", "Little Greene Portland Stone Pale"], ["#e1dbc6", "Little Greene Green Stone Light"], ["#d2ceb8", "Little Greene Green Stone"],
    ["#cab49c", "Little Greene Lute"], ["#c09f66", "Little Greene Bassoon"], ["#5371b8", "Little Greene Mambo"], ["#132019", "Little Greene Obsidian Green"]] };
const finPairs = hex => { const k = hex && Object.keys(R.PAINTS || {}).find(q => R.PAINTS[q].hex.toLowerCase() === hex.toLowerCase()); return (k && FIN_PAIRS[k]) || []; };
function finCurtTray(room) {   // the living room's curtains (its Look); N227: any other room's windows, each to its own card
  const liv = room === LIVR, now = liv ? S.decor.curtains : "", W = liv ? [] : winsOf(room);
  if (!liv) return W.length ? `<span class="r3d-finlab">${W.length > 1 ? "Its windows" : "Its window"}</span><div class="r3d-finsc" role="group" aria-label="Windows">`
    + W.map((w, j) => { const q = winNow(room, j); return `<button type="button" data-actopen="win:${room}:${j}">${W.length > 1 ? `${j + 1}: ` : ""}${finCap(winSay(q.k, q.c))}</button>`; }).join("") + `</div>` : "";
  return `<span class="r3d-finlab">Curtains</span><div class="r3d-finsc" role="group" aria-label="Curtains">`
    + LIV_CURT.map(([v, t]) => `<button type="button" data-fincurt="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`;
}
/* N227: a window's card: what's on it now, the kinds, a row of its fabrics or finishes; The plan's; the frame's own card */
function winCard(id) {
  const [, room, j] = id.split(":"), w = winsOf(room)[+j]; if (!w) return null;
  const q = winNow(room, +j), cost = q.own ? upRange(...winCost(w, finGet(room, 70 + +j)).map(Math.round)) : "";
  const st = q.plan ? `The plan's: ${q.k === "roller" ? `a roller blind, ${S.blinds ? "down" : "rolled up"}` : "nothing"}` : [finCap(winSay(q.k, q.c)), q.room ? "the room's" : cost].filter(Boolean).join(" · ");
  const bs = finButtons(q.own ? ["The plan's", { winplan: "1" }] : q.plan && q.k === "roller" && [S.blinds ? "Roll it up" : "Pull it down", { tog: "blinds" }], "the window as planned",
    [...(HIT(w.id) ? [btn("The frame", { actopen: "hitem:" + w.id })] : []), ...upsBtn(room)]);
  const L = q.k === "none" ? [] : winFabs(q.k);
  return [w.n, st, bs, null, `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="What's on it">${WIN_KINDS.map(([k, t]) => `<button type="button" data-winkind="${k}" aria-pressed="${!q.plan && q.k === k}">${t}</button>`).join("")}</div>`
    + (L.length ? finTray(q.k === "shutters" ? "Finishes" : "Fabrics", L.map(([k, t, h]) => finSwatch("winfab", k, t, h, !q.plan && q.c === k)).join(""), false) : "") + `</div>`];
}
function winAt(o, p) {   // a tap on a window's glass or frame, or what's on it: its card
  if (o.userData.win) return o.userData.win;
  const hk = (o.material && !Array.isArray(o.material) && o.material.userData.hk) || ""; if (!/^(glass|upvc|frame_out|blind|curt_|shut_)/.test(hk)) return null;
  for (const w of winAll()) { const g = HFLOOR[w.f]; if (!g) continue; const q = g.worldToLocal(p.clone()), x = -q.x / M, y = q.y / M, z = q.z / M;
    if (x > w.x0 - 10 && x < w.x1 + 10 && y > w.yf + w.sill - 10 && y < w.yf + w.head + 16 && Math.abs(z - w.z) < 30) return `win:${w.room}:${winsOf(w.room).indexOf(w)}`; }
  return null;
}
function winSet(room, j, v) {   // her own on one window (null: the plan's; "none" where the plan has nothing: the plan's)
  const w = winsOf(room)[j]; if (!w) return;
  if (v === "none" && !winPlan(w) && !finGet(room, 19)) v = null;
  finWrite(room, { [70 + j]: v }); const q = winNow(room, j); toast(`${w.n}: ${q.plan ? "the plan's" : winSay(q.k, q.c)}`);
}
/* N5b: a rug in any room (row [18]) mid-floor, the biggest UK size leaving 35 cm round (fit.SOURCES rugsizes), long side along the room's */
const FIN_RUGS = [["yours", "Arches"], ["jute", "Jute"], ["blue", "Deep blue"], ["stripes", "Sage stripes"]], RUG_SIZES = [[290, 200], [230, 160], [170, 120], [150, 80], [100, 60]];
let RUG_LAID = []; const RUG_MATS = {};
function rugMats(k) {
  if (RUG_MATS[k]) return RUG_MATS[k];
  const edge = new THREE.MeshStandardMaterial({ color: (RUG_LOOKS[k] || {}).edge || R.RUG.cols[3], roughness: 1 }), top = new THREE.MeshStandardMaterial({ map: rugTex(k), roughness: 1 });
  houseMat(`rug_edge_${k}`, edge); houseMat(`rug_top_${k}`, top);
  return (RUG_MATS[k] = [edge, edge, top, edge, edge, edge]);
}
function finRugApply() {
  if (!finSetup() || !houseG) return;
  for (const m of RUG_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } RUG_LAID = [];
  for (const [room, sl] of Object.entries(S.fin || {})) { const k = sl[18]; if (!k || k === "none" || !FIN.rooms.includes(room)) continue;
    const best = finBig(room);
    const g = best && HFLOOR[best.f]; if (!g) continue;
    const W = best.x1 - best.x0, D = best.z1 - best.z0, lng = Math.max(W, D) - 70, shrt = Math.min(W, D) - 70, sz = RUG_SIZES.find(([a, b]) => a <= lng && b <= shrt); if (!sz) continue;
    const geo = new THREE.BoxGeometry(sz[0] * M, 1 * M, sz[1] * M); if (D > W) geo.rotateY(Math.PI / 2);
    geo.translate(-(best.x0 + best.x1) / 2 * M, (best.y + (sl[5] ? 0.3 : 0) + 0.55) * M, (best.z0 + best.z1) / 2 * M);
    const me = new THREE.Mesh(geo, rugMats(k)); me.receiveShadow = true; me.userData.finRoom = room; g.add(me); RUG_LAID.push(me); }
  dirty();
}
function finRugTray(room) {
  const now = finGet(room, 18) || "";
  return `<span class="r3d-finlab">Rug</span><div class="r3d-finsc" role="group" aria-label="Rug">`
    + [["", "None"], ...FIN_RUGS].map(([v, t]) => `<button type="button" data-finrug="${v}" aria-pressed="${(now || "") === v}">${t}</button>`).join("") + `</div>`;
}
function finSwatches() {   // the paints to start with: the living room's (the client's pale mint first), and white
  const L = [["#f4f3ef", "White"]];
  for (const [k, p] of Object.entries(R.PAINTS || {})) { const hex = p.hex || p[0], nm = String(p.name || p.label || p[1] || k).replace(/\s*\(#[0-9a-f]{6}\)/i, "").split(",")[0]; if (hex) L.push([hex, nm]); }
  return L;
}
/* V2.35 (F11): two lighter and two darker of a picked colour, in sRGB lightness */
function finShades(hex) {
  const hsl = {}; new THREE.Color(hex).getHSL(hsl, THREE.SRGBColorSpace);
  return [0.16, 0.08, -0.08, -0.16].map(d => ["#" + new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0.04, Math.min(0.97, hsl.l + d)), THREE.SRGBColorSpace).getHexString(), d > 0 ? "Lighter" : "Darker"])
    .filter(([h], i, L) => h.toLowerCase() !== hex.toLowerCase() && L.findIndex(([g]) => g === h) === i);
}
const finShort = nm => nm.replace(/^(Farrow & Ball|Little Greene|Dulux|Crown|Valspar)\s+/, "").replace(/\s+No\.\s*\d+$/, "").replace(/\s*\(RAL \d+\)$/, "");   // say less: the tray shows "Card Room Green"
function finAt(hit) {   // a tap on a wall or a ceiling of the house: its room and side (as the palette's shader reads them)
  const m = hit && hit.object && hit.object.material, hk = m && m.userData && m.userData.hk, tl = tileAt(hit) || kitAt(hit) || bathAt(hit); if (tl) return tl;   // N225: the tiles; N224: the kitchen's units
  if (hit && hit.object && hit.object.userData.finWall != null) return { room: hit.object.userData.finRoom, slot: hit.object.userData.finWall };   // N29: the wallpaper's wall
  if (hit && hit.object && hit.object.userData.finRoom) return { room: hit.object.userData.finRoom, slot: 5 };   // a floor laid by the tray
  if (hk && FIN_FLOOR_KEYS.has(hk) && finSetup() && hit.face && hit.face.normal.y > 0.7) {   // a room's floor (from above it)
    const p = hit.point, xc = -p.x / M, zc = p.z / M, yc = p.y / M + 20, fl = yc < 0 ? 0 : yc < 260 ? 1 : 2;
    const ri = FIN.map.image.data[(fl * FIN.H + Math.max(0, Math.min(FIN.H - 1, Math.floor((zc + 309) / 2)))) * FIN.W + Math.max(0, Math.min(FIN.W - 1, Math.floor(xc / 2)))];
    return ri ? { room: FIN.rooms[ri - 1], slot: 5 } : null; }
  if (FIN.kind[hk] === 2 && finSetup()) {   // N5d: a bed's duvet or pillows: the room's bedding
    const p = hit.point, fl = p.y / M < 0 ? 0 : p.y / M < 260 ? 1 : 2, ri = FIN.map.image.data[(fl * FIN.H + Math.max(0, Math.min(FIN.H - 1, Math.floor((p.z / M + 309) / 2)))) * FIN.W + Math.max(0, Math.min(FIN.W - 1, Math.floor(-p.x / M / 2)))];
    return ri ? { room: FIN.rooms[ri - 1], slot: 20 } : null; }
  if (!(hk in FIN.kind) || !finSetup() || !hit.face) return null;
  const p = hit.point, n = hit.face.normal, xc = -p.x / M, zc = p.z / M, yc = p.y / M, ceil = FIN.kind[hk] === 1, wood = FIN.kind[hk] === 3;
  let ri;
  { const o = ceil ? 0 : 3, fl = yc < 0 ? 0 : yc < 260 ? 1 : 2;
    const i = Math.max(0, Math.min(FIN.W - 1, Math.floor((xc - n.x * o) / 2))), j = Math.max(0, Math.min(FIN.H - 1, Math.floor((zc + n.z * o + 309) / 2)));
    const at = (x, z) => FIN.map.image.data[(fl * FIN.H + Math.max(0, Math.min(FIN.H - 1, Math.floor((z + 309) / 2)))) * FIN.W + Math.max(0, Math.min(FIN.W - 1, Math.floor(x / 2)))];
    ri = FIN.map.image.data[(fl * FIN.H + j) * FIN.W + i];
    for (let d = 4; wood && !ri && d <= 32; d += 4) ri = at(xc + d, zc) || at(xc - d, zc) || at(xc, zc + d) || at(xc, zc - d); }   // V4.46: a door's lining, as the shader finds it
  if (!ri) return null;
  const nx = -n.x, nz = n.z, slot = wood ? 17 : ceil ? 4 : Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 2 : 3) : (nz > 0 ? 0 : 1), room = FIN.rooms[ri - 1];
  if (ceil) return { room, slot: Math.abs(n.y) > 0.2 && Math.abs(n.y) < 0.95 && ((R.HOUSE3.finish_areas || {})[room] || {}).slope ? 29 : 4 };   // N214: a slope's own card
  const ln = slot < 2 ? zc : xc, al = slot < 2 ? xc : zc, i = slot < 4 ? finWalls(room).findIndex(([s, l0, l1, a0, a1], k) => s === slot && FIN.cols[room][k] && ln > l0 - 2 && ln < l1 + 2 && al > a0 - 2 && al < a1 + 2) : -1;
  return { room, slot: i < 0 ? slot : 30 + i };   // N214: the wall it's on, as the shader finds it
}
/* N253 (C1): the finish slots in one table. A row is a slot or a run of them (n to): what it holds (name); ok, a value coming in (a
   link, Send, a saved look, the plan's scheme) checked; plan, the plan's own (a write of it keeps nothing); paint, drawn through the
   palette as [part, colour]; apply, how it's drawn again after a change; ups, its line in Changes (the rooms but the living room's own
   Look); copy, Paste takes it to another room. finClean, finApplyAll, roomUps, finWrite and Paste loop over it. The doors' row is the
   "doors" room's own (slot 70 all of them, 71 + n each) */
const finIn = (L, v) => L.some(([q]) => q === v), finHexOk = v => LIV_HEX.test(v || ""), finSideOk = v => ["0", "1", "2", "3"].includes(String(v));
const finLights = () => { GS.roomKey = ""; placeRoomLights(); dirty(); };
const SLOTS = [
  { n: 0, to: 3, name: "walls", ok: finHexOk, paint: (r, k, v) => [FIN_NAMES[k], v], apply: () => finApplyAll(), copy: true,
    ups: (r, o, add) => { const ws = [0, 1, 2, 3].filter(s => o[s]);
      if (ws.length) add("w=" + ws.map(s => o[s]).join(), "Walls: " + [...new Set(ws.map(s => finName(o[s])))].join(", "), ws.length > 1 ? UPC.walls : UPC.wall); } },
  { n: 4, name: "ceiling", ok: finHexOk, paint: (r, k, v) => ["ceiling", v], apply: () => finApplyAll(), copy: true,
    ups: (r, o, add) => { if (o[4]) add("4=" + o[4], "Ceiling: " + finName(o[4]), UPC.ceil); } },
  { n: 5, name: "floor", ok: v => finIn(FIN_FLOORS, v), apply: () => finApplyAll(), copy: r => r !== FIN_OWN,
    ups: (r, o, add, m2) => { const fa = (((R.HOUSE3 || {}).finish_areas || {})[r]) || {};   // N209: the floor laid now is no change; a new one by its area
      if (o[5] && o[5] !== fa.fk) add("5=" + o[5], "Floor: " + upNm(FIN_FLOORS, o[5]), UPC.floor[o[5]] || [30, 60], fa.floor || m2); } },
  { n: 6, name: "bulbs", ok: v => finIn(FIN_BULBS, v), plan: "2700", apply: () => finLights(), copy: true,
    ups: (r, o, add) => { if (o[6] || o[7]) add(`6=${o[6]}${o[7]}`, "Bulbs: " + [o[6] && upNm(FIN_BULBS, o[6]), o[7] && upNm(FIN_LUX, o[7])].filter(Boolean).join(", "), UPC.bulbs); } },
  { n: 7, name: "how bright", ok: v => finIn(FIN_LUX, v), plan: "1", apply: () => finLights(), copy: true },
  { n: 8, name: "light fitting", ok: v => finIn(FIN_FITS, v), apply: () => { finFitApply(); finLights(); }, copy: true,
    ups: (r, o, add) => { if (o[8]) add("8=" + o[8], "Light: " + upNm(FIN_FITS, o[8]), UPC.fit[o[8]]); } },
  { n: 9, name: "window frames outside", ok: finHexOk, apply: () => finOut(), copy: true,
    ups: (r, o, add) => { if (o[9]) add("9=" + o[9], "Window frames: " + finName(o[9]), UPC.frames); } },
  { n: 10, name: "front door outside", ok: finHexOk, apply: () => finOut(), copy: true,
    ups: (r, o, add) => { if (o[10]) add("10=" + o[10], "Front door: " + finName(o[10]), UPC.door_out); } },
  { n: 11, to: 16, name: "the living room's six walls", ok: (v, r) => r === LIVR && finHexOk(v) },
  { n: 17, name: "woodwork", ok: finHexOk, paint: (r, k, v) => ["woodwork", v], apply: () => finApplyAll(),   // N216
    ups: (r, o, add) => { if (o[17]) add("17=" + o[17], "Woodwork: " + finName(o[17]), UPC.skirt); } },
  { n: 18, name: "rug", ok: v => v === "none" || finIn(FIN_RUGS, v), apply: () => finRugApply(), copy: true,
    ups: (r, o, add) => { if (o[18]) add("18=" + o[18], o[18] === "none" ? "Rug: none" : "Rug: " + upNm(FIN_RUGS, o[18]), o[18] === "none" ? [0, 0] : UPC.rug); } },
  { n: 19, name: "curtains", ok: v => finIn(FIN_CURT, v) || finIn(LIV_CURT, v), apply: () => finCurtApply(), copy: true,
    ups: (r, o, add) => { if (o[19]) add("19=" + o[19], "Curtains: " + upNm(FIN_CURT, o[19]), UPC.curt); } },
  { n: 20, name: "bedding", ok: finHexOk, paint: (r, k, v) => ["bedding", v], apply: () => finApplyAll(), copy: true,
    ups: (r, o, add) => { if (o[20]) add("20=" + o[20], "Bedding: " + upNm(FIN_BED, o[20]), UPC.bed); } },
  { n: 21, name: "picture", ok: v => finIn(FIN_PICS, v), apply: () => finPicApply(), copy: true,
    ups: (r, o, add) => { if (o[21]) add("21=" + o[21], "Picture: " + upNm(FIN_PICS, o[21]), UPC.pic); } },
  { n: 22, name: "the picture's wall", ok: finSideOk, apply: () => finPicApply(), copy: true },
  { n: 23, name: "plant", ok: v => !!HCAT[v] && HCAT[v].k === "plant", apply: () => storeEdits(), copy: true,
    ups: (r, o, add) => { if (o[23] && HCAT[o[23]]) add("23=" + o[23], "Plant: " + HCAT[o[23]].n, UPC.plant[o[23]] || UPC.kind.plant); } },
  { n: 24, name: "wallpaper", ok: v => finIn(FIN_PAPERS, v), apply: () => { finPaperApply(); finTakes(); }, copy: true,
    ups: (r, o, add) => { const P = FIN_PAPERS.find(([q]) => q === o[24]), A = PAPER_AT[r];   // N40: the rolls as the 3D counted them (3 to 6 till it's laid)
      if (P) add(`24=${P[0]}${o[25] || 0}`, `Wallpaper: ${P[1]}${A ? `, ${A.rolls} rolls` : ""}`, A ? [A.cost + UPC.paper[0], A.cost + UPC.paper[1]] : [P[5] * 3, P[5] * 6]); } },
  { n: 25, name: "the wallpaper's wall", ok: finSideOk, apply: () => { finPaperApply(); finTakes(); }, copy: true },
  { n: 26, name: "panelling", ok: v => finIn(FIN_PANELS, v), apply: () => { finPanelApply(); finTakes(); }, copy: true,
    ups: (r, o, add) => { const Q = FIN_PANELS.find(([q]) => q === o[26]), B = PANEL_AT[r];   // N57: the packs as the 3D counted them
      if (Q) add(`26=${Q[0]}${o[27] || 0}`, `Panelling: ${Q[1]}${B ? `, ${B.packs} ${Q[0] === "slat" ? "panels" : "packs"}` : ""}`, B ? [B.cost + UPC.panel[0], B.cost + UPC.panel[1]] : [Q[2] * 2, Q[2] * 8]); } },
  { n: 27, name: "the panelling's wall", ok: finSideOk, apply: () => { finPanelApply(); finTakes(); }, copy: true },
  { n: 28, name: "storage ideas", apply: () => storeEdits(),   // N212: "id" or "id:a shop's key" each, by commas
    ok: (v, r) => typeof v === "string" && v.split(",").every(q => { const [id, key, x] = q.split(":"), I = IDEAS().find(i => i.id === id && i.room === r); return !!I && x == null && (!key || (I.o || []).some(o => o[0] === key)); }),
    ups: (r, o, add) => { for (const q of String(o[28] || "").split(",").filter(Boolean)) { const [id, key] = q.split(":"), I = IDEAS().find(i => i.id === id && i.room === r); if (!I) continue;   // N244: a shop's buy its price, the plan's its range
      const hk = key && ideaOptKey(I, key); add("28=" + q, `${I.n}: ${hk ? HCAT[hk].n + " · " + HCAT[hk].shop : "made to the spot"}`, ideaCost(I, key)); } } },
  { n: 29, name: "slopes", ok: v => v === "walls" || finHexOk(v), paint: (r, k, v) => ["slopes", finSlopeHex(r, v)], apply: () => finApplyAll(), copy: true,   // N214
    ups: (r, o, add) => { if (o[29]) add("29=" + o[29], "Slopes: " + (o[29] === "walls" ? "with the walls" : finName(o[29])), UPC.ceil); } },
  { n: 30, to: 69, name: "each wall", ok: (v, r, k) => !!finWalls(r)[k - 30] && finHexOk(v), paint: (r, k, v) => [k, v], apply: () => finApplyAll(),   // N214: each wall as built
    ups: (r, o, add) => finWalls(r).forEach((w, k) => { const h = o[30 + k]; if (h) add(`${30 + k}=${h}`, `${finCap(finSlotName(r, 30 + k))}: ${finName(h)}`, UPC.wall); }) },
  { n: 70, to: 89, name: "each window", ok: (v, r, k) => winOk(r, k, v), apply: () => finCurtApply(), copy: (r, k, v) => winOk(r, k, v),   // N227
    ups: (r, o, add) => winsOf(r).forEach((w, j) => { const v = o[70 + j]; if (v) add(`${70 + j}=${v}`, `${w.n}: ${winSay(...v.split("."))}`, winCost(w, v)); }) },
  { n: 90, name: "tiles", ok: (v, r, k) => tileOk(r, k, v), apply: () => tileApply(), ups: (r, o, add) => { if (o[90] && TILE_ROOMS[r]) tileUps(r, add); } },   // N225
  { n: 91, name: "grout", ok: (v, r, k) => tileOk(r, k, v), apply: () => tileApply() },
  { n: 92, name: "unit fronts", ok: (v, r, k) => kitOk(r, k, v), plan: "white", apply: () => kitApply(), ups: (r, o, add) => { if (r === "kitchen") kitUps(add); } },   // N224
  { n: 93, name: "handles", ok: (v, r, k) => kitOk(r, k, v), plan: "black", apply: () => kitApply() },
  { n: 94, name: "worktop", ok: (v, r, k) => kitOk(r, k, v), plan: "black", apply: () => kitApply() },
  { n: 95, name: "taps and shower", ok: (v, r, k) => bathOk(r, k, v), plan: "black", apply: () => bathApply(), ups: (r, o, add) => { if (r === "bathroom") bathUps(add); } },   // N225
  { n: 96, name: "bath panel", ok: (v, r, k) => bathOk(r, k, v), plan: "white", apply: () => bathApply() },
  { n: 97, name: "mirror", ok: (v, r, k) => bathOk(r, k, v), plan: "oak", apply: () => bathApply() }];
const SLOT_DOORS = { n: 70, to: 199, name: "doors", ok: (v, r, k) => doorOk(k, v), apply: () => doorApply() };   // N226: S.fin.doors
function slotOf(k, room) { if (!Number.isInteger(k)) return null; if (room === "doors") return k >= 70 ? SLOT_DOORS : null; return SLOTS.find(d => k >= d.n && k <= (d.to || d.n)) || null; }
const slotPlan = (k, room) => (slotOf(k, room) || {}).plan || null;
function finWrite(room, patch, push = true) {   // N253: one room's slots (a value that's none or the plan's: nothing kept), saved, drawn again by its rows
  if (push) finPush(); const F = S.fin = S.fin || {}, o = F[room] = F[room] || {};
  for (const [s, v] of Object.entries(patch)) if (v && v !== slotPlan(+s, room)) o[s] = v; else delete o[s];
  if (!Object.keys(o).length) delete F[room];
  store.set(KEY, S); for (const f of new Map(Object.keys(patch).map(s => (slotOf(+s, room) || {}).apply).filter(Boolean).map(f => [String(f), f])).values()) f(); finSchDraw();   // each way of drawing once
}
/* V2.11 (F6): the finishes ride Measure's Send link; checked as data coming in (each slot by its row) */
function finClean(o) {
  const out = {};
  for (const [room, sl] of Object.entries(o && typeof o === "object" ? o : {})) { if (!/^[a-z0-9_]{1,30}$/.test(room) || !sl || typeof sl !== "object") continue;
    for (const [s, v] of Object.entries(sl)) { const k = +s, d = slotOf(k, room); if (d && d.ok && d.ok(v, room, k)) (out[room] = out[room] || {})[k] = v; } }
  return out;
}
function finImport(o) { const c = finClean(o); if (!Object.keys(c).length) return false; finPush(); finRestore(c); store.set(KEY, S); finApplyAll(); toast("Their colours, floors and bulbs"); return true; }
/* V2.12 (F7): what the choices take, from R.HOUSE3.finish_areas: two coats at ~12 m² a litre in 2.5 L tins; floors +10% */
function finTakes() {
  const box = qs("#ms-takes"), list = qs("#ms-tlist"), A = (R.HOUSE3 || {}).finish_areas || {}; if (!box || !list) return;
  const paint = hex => (finSwatches().find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
  const lit = m2 => Math.ceil(m2 * 2 / 12 * 2) / 2, tins = l => Math.ceil(l / 2.5), rows = [];
  for (const [room, sl] of Object.entries(S.fin || {})) { const a = A[room]; if (!a) continue;
    const by = {}, own = finWalls(room).map((w, k) => [w, sl[30 + k]]).filter(([, h]) => h), sa = a.slope || 0, sh = sl[29] && finSlopeHex(room, sl[29]);   // N214: each wall's own by its area, the slopes
    for (const [side, i] of [["back", 0], ["front", 1], ["east", 2], ["west", 3]]) { const w = a.walls[side]; if (!w || w[1] === "stairpaint") continue;
      const mine = own.filter(([q]) => q[0] === i); for (const [q, h] of mine) by[h] = (by[h] || 0) + q[5];
      if (sl[i]) by[sl[i]] = (by[sl[i]] || 0) + Math.max(0, w[0] - mine.reduce((t, [q]) => t + q[5], 0)); }
    if (sh && sa) by[sh] = (by[sh] || 0) + sa;
    for (const [hex, m2] of Object.entries(by)) { const l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> walls, ${paint(hex)}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (sl[4] && a.ceiling) { const m2 = a.ceiling + (sh ? 0 : sa), l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> ceiling, ${paint(sl[4])}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (sl[5] && a.floor) { const f = FIN_FLOORS.find(([k]) => k === sl[5]); rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> floor, ${f ? f[1] : sl[5]}: ${a.floor.toFixed(1)} m², ${(a.floor * 1.1).toFixed(1)} m² to buy</div>`); } }
  for (const [room, P] of Object.entries(PAPER_AT)) { const nm = (FIN_PAPERS.find(([k]) => k === P.k) || [0, P.k])[1];   // N29: the wallpaper's rolls
    rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> ${FIN_NAMES[+(finGet(room, 25) || 0)]} wall, ${nm}: ${(P.L / 100).toFixed(1)} × ${(P.H / 100).toFixed(1)} m, ${P.rolls} rolls (1 spare), about £${P.cost}</div>`); }
  const la = A[LIVR]; if (la && livChanged()) { const by = {};   // N5: the living room's, by its six walls
    for (const k of LIV_W) { const w = la.walls[k], hex = S.walls[k] || paintHex(); if (w) by[hex] = (by[hex] || 0) + w[0]; }
    for (const [hex, m2] of Object.entries(by)) { const l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> walls, ${paint(hex)}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (la.ceiling) { const hex = chHex("ceil"), l = lit(la.ceiling); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> ceiling, ${paint(hex)}: ${la.ceiling.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); } }
  const T = R.HOUSE3 ? upsAll()[1] : { n: 0 }; if (T.n) rows.push(`<div class="ms-erow"><b>All the changes</b> ${T.n}, about ${upRange(T.lo, T.hi) || "£0"}</div>`);   // N40: the house's total, sent with the rest
  list.innerHTML = rows.join(""); box.hidden = !rows.length;
}
let FIN_COPY = null;   // V2.13 (F6): Copy / Paste a room's look
/* N221: saved looks: the colours, floors and furniture edits together ({name, fin, he, lay}), named, a few on this device as chips in
   Look (an old {name, fin} is a look of colours only); a tap wears one (Put back on its toast), As it is and The plan always there.
   Send carries them (R3D.looks, Measure's link) to the plan (tools/pull_edits.py: house/looks.json, the PDF's Saved looks).
   N222: a look shown, not worn (a link from another device, The plan): the device's own set aside (ASIDE: its S, its edits rows in a
   copy), nothing saved till Keep it; Back to mine (or Esc) puts it back as it was */
const FSK = "dh-fin-schemes", LOOK_MAX = 8;
let ASIDE = null, LOOK_PREV = null;
function finSchemes() { try { const L = JSON.parse(localStorage.getItem(FSK) || "[]"); return Array.isArray(L) ? L.filter(x => x && typeof x.name === "string" && x.fin && typeof x.fin === "object") : []; } catch (e) { return []; } }
const heRow = q => { if (!Array.isArray(q)) return null; const [item, field, value, room, x, z, y] = q, v = field === "add" ? { item, field, value, room, x, z, y } : { item, field, value }; return heOk(v) ? v : null; };
const heOf = () => DS() ? Object.values(DS().rows("edits") || {}).filter(heOk).map(v => [v.item, v.field, v.value, ...(v.field === "add" ? [v.room, v.x, v.z, v.y] : [])]).sort((a, b) => `${a[0]}~${a[1]}` < `${b[0]}~${b[1]}` ? -1 : 1) : [];
function heWear(a, ds) {   // the house's edits rows as the look has them: the page's own rows it lacks taken out, its rows put in
  const want = {}, have = ds.rows("edits") || {}, F = ["item", "field", "value", "room", "x", "z", "y"];
  for (const q of (Array.isArray(a) ? a : []).slice(0, 200)) { const v = heRow(q); if (v) want[`${v.item}~${v.field}`] = v; }
  for (const [id, v] of Object.entries(have)) if (heOk(v) && !want[id]) ds.del("edits", id);
  for (const [id, v] of Object.entries(want)) if (!have[id] || F.some(k => have[id][k] !== v[k])) ds.put("edits", id, v);
}
function lookMem() {   // N222: while a look is shown the edits rows are a copy in memory (Measure's own store, and Send, untouched)
  const real = window.DemmaStore; if (!ASIDE || ASIDE.real || !real) return;
  const mem = JSON.parse(JSON.stringify(real.rows("edits") || {})), fire = () => dispatchEvent(new CustomEvent("demma-rows", { detail: "edits" }));
  ASIDE.real = real;
  window.DemmaStore = { rows: c => c === "edits" ? mem : real.rows(c), put: async (c, id, d) => { if (c === "edits") { mem[id] = Object.assign({}, d); fire(); } },
    del: async (c, id) => { if (c === "edits") { delete mem[id]; fire(); } }, on: real.on, shareLink: real.shareLink, get mode() { return real.mode; } };
}
function lookHe(a) { const go = () => { lookMem(); if (DS()) heWear(a, DS()); }; if (DS()) go(); else addEventListener("demma-rows", go, { once: true }); }   // a link opens before Measure's store is up
const layNow = () => JSON.parse(JSON.stringify({ layout: S.layout || {}, added: S.added || [] }));
const lookNow = () => ({ fin: finClean(finAll()), he: heOf(), lay: layNow() });
const lookKey = (x, now) => JSON.stringify([finClean(now ? finAll(!!(x.fin || {})[LIVR]) : x.fin), x.he ? (now ? heOf() : x.he) : 0, x.lay ? (now ? layNow() : x.lay) : 0]);
function planFin() { const c = finClean((((R.HOUSE3 || {}).plan_finishes || {}).rooms) || {}); delete c[LIVR]; return c; }
function nowOff() { if (!NOWV) return; finHold(false); NOWV = false; root.classList.remove("nowfade"); const b = qs("#r3d-now"); if (b) b.setAttribute("aria-pressed", "false"); placeAll(); }
function lookPut(L) {   // a look onto the page: its colours and floors, the living room's moves, the house's edits (saved unless one is shown)
  nowOff(); finRestore(L.fin || {}); if (L.lay) restoreLayout({ layout: L.lay.layout || {}, added: Array.isArray(L.lay.added) ? L.lay.added : [] });
  if (Array.isArray(L.he)) lookHe(L.he); store.set(KEY, S); finApplyAll();
}
function lookAside(title, plan) {   // N222: the device's own set aside, once, before a look is shown over it
  nowOff();
  if (!ASIDE) { ASIDE = { s: JSON.stringify(S), fin: JSON.parse(JSON.stringify(finAll(false))) }; lookMem(); histReset(); }
  ASIDE.title = title; ASIDE.plan = !!plan;
}
function lookPill() {
  root.classList.toggle("theirs", !!ASIDE); const p = document.getElementById("r3d-theirs");
  if (p) { p.hidden = !ASIDE; if (ASIDE) p.querySelector("b").textContent = ASIDE.title; } finSchDraw(); ixPill();   // N244: the Ideas pill on while its set-ups show
}
function lookMine() {   // Back to mine: the device's own as it was (its S, its rows); nothing was saved while the look showed
  if (!ASIDE) return; nowOff(); const A = ASIDE, s = JSON.parse(A.s); ASIDE = null; if (A.real) window.DemmaStore = A.real;
  restoreLayout({ layout: s.layout || {}, added: s.added || [] });
  for (const [k, v] of Object.entries(s)) if (k !== "view" && k !== "layout" && k !== "added") S[k] = v;
  applyDecor(); repaint(); applyState(); syncButtons(); updateCaption(); finApplyAll();
  histReset(); dispatchEvent(new CustomEvent("demma-rows", { detail: "edits" })); lookPill(); toast("Yours");
}
function lookKeep() {   // Keep it: the shown look becomes this device's own
  if (!ASIDE) return; const A = ASIDE, he = heOf(); ASIDE = null;
  if (A.real) { window.DemmaStore = A.real; heWear(he, A.real); }
  store.set(KEY, S); lookPill(); toast("Kept: it's yours now");
}
const finSent = () => JSON.parse(JSON.stringify(ASIDE ? ASIDE.fin : finAll(false)));   // Send carries the device's own, even while a look shows
function lookSlim(x) {   // for Send: each room's slots but the plan's (the living room's whole), the edits and the living room's moves
  const P = planFin(), fin = {};
  for (const [r, sl] of Object.entries(finClean(x.fin))) { const o = r === LIVR ? sl : Object.fromEntries(Object.entries(sl).filter(([s, v]) => (P[r] || {})[s] !== v)); if (Object.keys(o).length) fin[r] = o; }
  const rows = lookRows(x);   // N231: what it changes and its rough cost, for the plan's page
  return Object.assign({ name: x.name, fin }, rows.length ? { rows } : {}, x.he && x.he.length ? { he: x.he } : {}, x.lay && (Object.keys(x.lay.layout || {}).length || (x.lay.added || []).length) ? { lay: x.lay } : {});
}
/* N231: a saved look's rough cost, a row a change as Changes prices it: its rooms' rows (the plan's own left out) with the device's set
   aside a moment, the living room's against the plan's paint, its pieces' edits by the catalogue; [[room, what, lo, hi]], kept by the look */
const LOOK_ROWS = new Map();
function lookRows(L) {
  if (!R.HOUSE3) return []; const key = JSON.stringify([L.fin, L.he, L.lay]); if (LOOK_ROWS.has(key)) return LOOK_ROWS.get(key);
  const P = planFin(), fin = finClean(L.fin), lv = fin[LIVR] || {}, out = [], add = (r, t, c) => { if (c && c[1]) out.push([r, t, Math.round(c[0]), Math.round(c[1])]); };
  delete fin[LIVR]; for (const [r, sl] of Object.entries(fin)) { for (const s of Object.keys(sl)) if ((P[r] || {})[s] === sl[s]) delete sl[s]; if (!Object.keys(sl).length) delete fin[r]; }
  const s0 = S.fin; S.fin = fin; try { for (const r of upRooms()) if (r !== LIVR) for (const u of roomUps(r, true)) add(r, u.t, [u.lo, u.hi]); } finally { S.fin = s0; }
  const ph = ((R.PAINTS || {})[DEF.paint] || {}).hex || "";
  if (lv[0] && lv[0].toLowerCase() !== ph.toLowerCase()) add(LIVR, "Walls: " + finName(lv[0]), UPC.walls);
  for (let s = 11; s <= 16; s++) if (lv[s]) add(LIVR, `${finCap(finSlotName(LIVR, s))}: ${finName(lv[s])}`, UPC.wall);
  if (lv[4]) add(LIVR, "Ceiling: " + finName(lv[4]), UPC.ceil); if (lv[17]) add(LIVR, "Skirting and door: " + finName(lv[17]), UPC.skirt);
  if (lv[18]) add(LIVR, "Rug", UPC.rug); if (lv[19]) add(LIVR, "Curtains", UPC.curt);
  const E = {}; for (const [id, f, v, room] of Array.isArray(L.he) ? L.he : []) Object.assign(E[id] = E[id] || { room }, { [f]: v });
  for (const [id, e] of Object.entries(E)) { const it = HIT(id), k = e.add || e.swap, C = HCAT[k] || HCAT[hcOwn(k)], r = (it && it.r) || e.room || "";
    if (e.removed || !r) continue; if (C) add(r, `${e.add ? "Added" : (it ? it.n : "A piece") + ":"} ${C.n}`, upCat(k, C));
    else if (it && it.op && (e.w != null || e.h != null)) add(r, "Resized: " + it.n, UPC[it.k] || UPC.door); }
  for (const v of Object.values((L.lay || {}).layout || {})) if (v && v.sw && HCAT[v.sw]) add(LIVR, HCAT[v.sw].n, upCat(v.sw, HCAT[v.sw]));
  LOOK_ROWS.set(key, out); return out;
}
const lookCost = L => lookRows(L).reduce((a, q) => [a[0] + q[2], a[1] + q[3]], [0, 0]);
function lookDiff(L) {   // Hold to compare's toast: the look against the device's own (their middles)
  const [lo, hi] = lookCost(L), [ml, mh] = lookCost(lookNow()), d = Math.round(((lo + hi) - (ml + mh)) / 2 / 10) * 10;   // yours priced the same way (the plan's scheme no change)
  return Math.abs(d) < 20 ? "About the same as yours" : `About £${Math.abs(d).toLocaleString("en-GB")} ${d > 0 ? "more" : "less"} than yours`;
}
function finSchDraw() {
  const box = qs("#r3d-finschl"); if (!box) return; const L = finSchemes(), esc = t => String(t).replace(/[<&"]/g, "");
  box.innerHTML = `<button type="button" data-lookas="now" aria-pressed="${NOWV}">As it is</button><button type="button" data-lookas="plan" aria-pressed="${!!ASIDE && ASIDE.plan}">The plan</button>`
    + L.map((x, i) => { const [lo, hi] = lookCost(x); return `<span class="r3d-mysc"><button type="button" data-finsch="${i}" aria-pressed="${!ASIDE && !NOWV && lookKey(x) === lookKey(x, true)}" title="Hold to compare">${esc(x.name)}${hi ? ` · ${upRange(lo, hi)}` : ""}</button><button type="button" class="r3d-myx" data-finschdel="${i}" aria-label="Delete ${esc(x.name)}">×</button></span>`; }).join("");
}
function finSchSave() {
  const inp = qs("#r3d-finschname"), name = ((inp && inp.value.trim()) || `Look ${finSchemes().length + 1}`).slice(0, 24);
  const L = finSchemes().filter(x => x.name !== name); L.push(Object.assign({ name }, lookNow()));
  try { localStorage.setItem(FSK, JSON.stringify(L.slice(-LOOK_MAX))); } catch (e) { toast("That didn't save: this device is full"); return; }
  if (inp) inp.value = ""; finSchDraw(); toast(`Saved: ${name}`);
}
function finSchUse(i) {   // one tap wears it; Put back on the toast for what was on before
  const x = finSchemes()[i]; if (!x) return; if (ASIDE) lookMine(); nowOff(); LOOK_PREV = lookNow(); finPush();
  lookPut(x); toast(x.name, { lookback: "1" });
}
function lookPlan() {   // The plan: shown over yours (set aside), tap again or Back to mine
  if (ASIDE && ASIDE.plan) { lookMine(); return; }
  lookAside("The plan", true); lookPut({ fin: Object.assign(planFin(), { [LIVR]: {} }), he: [], lay: { layout: {}, added: [] } }); lookPill();
}
function finCopyBtns(room) {   // on a room's card: Copy this room (when it has a look of its own), Paste another's
  const L = [];
  if (FIN_COPY && FIN_COPY.room !== room) L.push(btn(`Paste ${roomName(FIN_COPY.room)}'s look`, { finpaste: "1" }));
  if (room === LIVR || Object.keys((S.fin || {})[room] || {}).length) L.push(btn("Copy this room", { fincopy: "1" }));
  return L;
}
let FIN_PIC = null;   // V2.13 (F6): a colour from a photo: tap a spot (a 7 px average)
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
  if (!finSetup()) return; FIN.pal.image.data.fill(0); FIN.pal.needsUpdate = true;
  if (houseG) { houseG.updateMatrixWorld(true); FIN.inv.copy(houseG.matrixWorld).invert(); }   // N5d: the bedding finds its room in the house's own frame
  for (const [room, sl] of Object.entries(S.fin || {})) if (FIN.rooms.includes(room)) for (const [s, v] of Object.entries(sl)) { const k = +s, d = slotOf(k, room);   // N253: the rows drawn through the palette
    if (d && d.paint) finish(room, ...d.paint(room, k, v)); }
  finFloorApply(); tileApply(); kitApply(); bathApply(); doorApply(); finOut(); storeEdits(); if (typeof placeRoomLights === "function") { GS.roomKey = ""; placeRoomLights(); } finTakes(); finSchDraw();
}
/* V2.38 (F12): the window frames' and front door's outside colours (RAL), S.fin.outside[9] and [10] */
const FIN_OUT = [["#f5f5f2", "White"], ["#383e42", "Anthracite grey (RAL 7016)"], ["#b5b8b1", "Agate grey (RAL 7038)"], ["#0a0a0a", "Black (RAL 9005)"], ["#fdf4e3", "Cream (RAL 9001)"]];
const finOut = () => { for (const [s, k] of [[9, "frame_out"], [10, "door_out"]]) { const m = HMATS && HMATS[k]; if (m) m.color.set(!finHeld && finGet("outside", s) || R.HOUSE3.mats[k][0]); } dirty(); };
const finKnown = hex => [...FIN_OUT, ...finSwatches(), ...IX_PAINTS, ...Object.values(FIN_PAIRS).flat()].find(([h]) => h.toLowerCase() === String(hex).toLowerCase());
/* N213: her own colours: a code typed (#dbffc8, dbffc8 or #dbf), named "your colour #DBFFC8"; "Yours" offers each one she's put on a
   wall, ceiling or outside (not a paint's, not the plan's) on every wall's card; nothing new kept (they're read from her rows) */
const finHex = v => { let t = String(v || "").trim().replace(/^#/, "").toLowerCase(); if (/^[0-9a-f]{3}$/.test(t)) t = t.replace(/./g, c => c + c); return /^[0-9a-f]{6}$/.test(t) ? "#" + t : null; };
const finPlanHex = () => new Set(Object.values((((R.HOUSE3 || {}).plan_finishes || {}).rooms) || {}).flatMap(sl => Object.values(sl || {})).filter(v => LIV_HEX.test(v)).map(v => v.toLowerCase()));
const finName = hex => { const k = finKnown(hex); return k ? k[1] : !LIV_HEX.test(hex || "") ? hex : finPlanHex().has(hex.toLowerCase()) ? "the plan's colour" : "your colour " + hex.toUpperCase(); };
const finCap = t => t.charAt(0).toUpperCase() + t.slice(1);
function finMine() {
  const plan = finPlanHex(), out = new Set();
  for (const sl of Object.values(finAll(false))) for (const [s, v] of Object.entries(sl || {})) { const k = +s;
    if ((k <= 4 || k === 9 || k === 10 || (k >= 11 && k <= 17) || k >= 29) && LIV_HEX.test(v || "") && !plan.has(v.toLowerCase()) && !finKnown(v)) out.add(v.toLowerCase()); }
  return [...out].slice(0, 8);
}
const finSw = (L, now) => L.map(([h, t]) => finSwatch("finc", h, t, h, !!now && now.toLowerCase() === h.toLowerCase(), finShort(t))).join("");
function finSet(room, slot, hex) {   // by the scope: this wall, this room's walls (or ceiling), the whole house's
  finPush(); S.fin = S.fin || {};
  if (room === LIVR || (finScope === "house" && (slot <= 4 || slot >= 30))) {   // N5: the living room's own Look; Whole house takes it in too
    const one = room === LIVR && finScope === "wall" && slot >= 11; livFin(slot, hex, one);
    if (room === LIVR && finScope !== "house") { store.set(KEY, S); finTakes(); finSchDraw();
      toast(`${roomName(room)}: ${slot === 4 ? "ceiling" : slot === 17 ? "skirting and door" : one ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? finName(hex) : "as planned"}`); return; }
    if (slot >= 11) slot = 0; }
  if (room === "outside") { const o = S.fin.outside = S.fin.outside || {}; if (hex) o[slot] = hex; else delete o[slot]; if (!Object.keys(o).length) delete S.fin.outside;
    finOut(); store.set(KEY, S); toast(`Outside: ${slot === 9 ? "the window frames" : "the front door"} ${hex ? finName(hex) : "white, as planned"}`); return; }
  const ceil = slot === 4, flr = slot === 5, wood = slot === 17, slope = slot === 29, slots = flr ? [5] : ceil ? [4] : wood ? [17] : slope ? [29] : finScope === "wall" ? [slot] : [0, 1, 2, 3];
  if (flr && room === FIN_OWN) return;
  if (wood && finScope === "house") livFin(17, hex);   // N216: Whole house's woodwork takes the living room's skirting and door too
  const rooms = finScope === "house" ? FIN.rooms.filter(r => !wood || r !== LIVR) : flr && finScope === "floor" ? finStorey(room).filter(r => r !== FIN_OWN) : [room];
  for (const r of rooms) { const o = S.fin[r] = S.fin[r] || {}, v = flr && hex === "plan" ? finPlanFloor(r) : hex; for (const s of slots) { if (v) o[s] = v; else delete o[s]; }
    if (slots.length === 4) for (const k of Object.keys(o)) if (+k >= 30 && +k < 70) delete o[k];   // N214: the room's (or house's) walls: each wall's own goes
    if (!Object.keys(o).length) delete S.fin[r]; }
  finApplyAll(); store.set(KEY, S);
  if (flr) { toast(`${finScope === "floor" ? "Whole floor" : roomName(room)}: ${hex === "plan" ? "the plan's floor" : "floor " + finFloorName(hex)}`); return; }
  const nm = slope && hex === "walls" ? "with the walls" : finName(hex);
  toast(`${finScope === "house" ? "Whole house" : roomName(room)}: ${ceil ? "ceiling" : wood ? "woodwork" : slope ? "the slopes" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? nm : slope ? "with the ceiling" : "as planned"}`);
}
function finBtns(changed, reset, room) {   // N68: a colour or floor card's buttons, the same on each: Undo, As planned, Hold to compare, then (under More) Copy, Paste
  return finButtons(changed && ["The plan's", reset], "the room as planned", finCopyBtns(room));
}
function finStorey(room) {   // the rooms on the same floor as this one
  const P = R.HOUSE3.finish_pieces || {};
  for (const f of ["lower", "ground", "first"]) { const ids = [...new Set((P[f] || []).map(p => FIN.rooms[p[0]]))]; if (ids.includes(room)) return ids; }
  return [room];
}
/* N209: each room's floor from its card: the plan's (house/plan_finishes.json), the one laid now (finish_areas fk), or theirs; the garage's slab stays its own */
const FIN_OWN = "garage", FIN_AS = { board: "Floorboards", concrete: "Concrete slab", earth: "Bare earth", vinyl: "Vinyl" };
const finPlanFloor = room => ((((R.HOUSE3 || {}).plan_finishes || {}).rooms || {})[room] || {})[5] || null;
const finLaid = room => ((((R.HOUSE3 || {}).finish_areas || {})[room]) || {}).fk || null;
const finFloorName = k => (FIN_FLOORS.find(([q]) => q === k) || [0, FIN_AS[k] || k || "As it is"])[1];
function finFloorCard(room) {   // V2.7 (F4): a room's floor: the carpets, laminate, boards and tiles; N209: "Bedroom 2 · Grey carpet"
  if (finScope !== "room" && finScope !== "floor") finScope = "room";
  const now = finGet(room, 5), plan = finPlanFloor(room), laid = finLaid(room), own = room === FIN_OWN, u = now && now !== plan && now !== laid && roomUps(room).find(q => q.k === "5=" + now);
  const st = own ? "Its own" : now && now === plan ? "The plan's" : now && now !== laid ? ["Your pick", u ? upRange(u.lo, u.hi) : ""].filter(Boolean).join(" · ") : "As it is";
  const bs = finButtons(now !== plan && !own && ["The plan's", { finf: "plan" }], "the room as it is", finCopyBtns(room));
  const tray = own ? null : `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${[["room", "This room"], ["floor", "Whole floor"]].map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + finTray("Floors", FIN_FLOORS.map(([k, t]) => finSwatch("finf", k, t, finFloorCol(k), now === k)).join(""), false) + `</div>`;
  const more = `<div class="r3d-fin">${finRugTray(room)}${room !== LIVR && (R.HOUSE3.rooms || {})[room] ? plantTray(room) + ideaTray(room) : ""}</div>`;   // N5: the rug, a plant (N68: under More); N212: its storage ideas
  return [`${roomName(room)} · ${finFloorName(now || laid)}`, st, bs, null, tray, more];
}
let FIN_TAB = null;   // N265: the wall card's chip (Paint · Paper · Panels · Picture · Curtains) and the card it's on
function finCard(id) {   // [title, now, buttons, -, the tray]
  const [, room, s] = id.split(":"), slot = +s, ceil = slot === 4, slope = slot === 29, v = finGet(room, slot);   // N214: a wall's own, else its side's; the slopes' own colour
  const now = slope ? (LIV_HEX.test(v || "") ? v : null) : v || (slot >= 30 ? finGet(room, finSide(room, slot)) : null);
  if (slot === 5) return finFloorCard(room);
  if (slot === 90) return tileCard(room);   // N225
  if (slot === 92) return kitCard();   // N224
  if (slot === 95) return bathCard();   // N225: the taps and the bath panel
  if (slot === 20) return [`${roomName(room)}: the bedding`, now ? (FIN_BED.find(([h]) => h === now) || [0, now])[1] : "The plan's", finButtons(), null, finBedTray(room)];
  if (room === "outside") return [`Outside: ${slot === 9 ? "the window frames" : "the front door"}`, now ? finCap(finName(now)) : "White, as planned",
    finButtons(now && ["The plan's", { finc: "" }]), null,
    `<div class="r3d-fin"><div class="r3d-fintray" role="group" aria-label="Colours">${finSw([...FIN_OUT, ...finSwatches().slice(1)], now)}<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f5f5f2"}" aria-label="Any colour"><span>Any</span></label></div></div>`];
  const liv = room === LIVR, named = liv && slot >= 11 && slot <= 16, drawn = liv ? (slot === 0 ? S.paint === DEF.paint && !Object.keys(S.walls).length : named ? !S.walls[LIV_W[slot - 11]] : !now) : slope ? !v : !now;
  if (finScope === "floor" || (liv && slot === 17) || slope) finScope = "room";
  const wood = slot === 17;   // N216: a room's skirting, door leaves, frames and radiators
  if ((ceil || wood || (liv && !named)) && finScope === "wall") finScope = "room";
  const nm = slope && !now ? (v ? "With the walls" : "With the ceiling") : drawn ? "The plan's" : finCap(finName(now)), mine = finMine();
  const scopes = slope ? [["", "With the ceiling"], ["walls", "With the walls"]] : liv && slot === 17 ? [] : ceil || wood || (liv && !named) ? [["room", "This room"], ["house", "Whole house"]] : [["wall", "This wall"], ["room", "This room"], ["house", "Whole house"]];
  const tabs = ceil || wood || slope ? [] : [["paint", "Paint"], ...(liv ? [] : [["paper", "Paper"], ["panels", "Panels"], ["picture", "Picture"]]), ...(finCurtTray(room) ? [["curtains", "Curtains"]] : [])];
  if (!FIN_TAB || FIN_TAB.id !== id || !tabs.some(([k]) => k === FIN_TAB.k)) FIN_TAB = { id, k: "paint" };   // N265: a wall's card opens on its paint
  const chips = tabs.length ? `<div class="r3d-finsc" role="group" aria-label="What's on it">${tabs.map(([k, t]) => `<button type="button" data-fintab="${k}" aria-pressed="${FIN_TAB.k === k}">${t}</button>`).join("")}</div>` : "";
  const side = finSide(room, slot), other = { paper: () => finPaperTray(room, side), panels: () => finPanelTray(room, side), picture: () => finPicTray(room, side), curtains: () => finCurtTray(room) }[FIN_TAB.k];
  const tray = other ? `<div class="r3d-fin">${chips}${other()}</div>` : `<div class="r3d-fin">${chips}<div class="r3d-finsc" role="group" aria-label="${slope ? "The slopes" : "Where it goes"}">${scopes.map(([k, t]) => `<button type="button" data-fin${slope ? "slope" : "sc"}="${k}" aria-pressed="${slope ? (v || "") === k : finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Colours">${finSw(finSwatches(), now)}`
    + `<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f4f3ef"}" aria-label="Any colour"><span>Any</span></label>`
    + `<label class="sw hex" title="A colour's code"><input type="text" data-finhex="1" value="${now ? now.toUpperCase() : ""}" placeholder="#hex" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="characters" enterkeyhint="done" aria-label="A colour's code, like #DBFFC8"><span>Code</span></label>`
    + `<label class="sw pic" title="A colour from a photo"><i><span class="ms" aria-hidden="true">photo_camera</span></i><input type="file" accept="image/*" data-finpic="1" aria-label="A colour from a photo"><span>Photo</span></label></div>`
    + (mine.length ? `<span class="r3d-finlab">Yours</span><div class="r3d-fintray" role="group" aria-label="Your colours">${finSw(mine.map(h => [h, h.toUpperCase()]), now)}</div>` : "")
    + (now ? finTray("Shades of it", finShades(now).map(([h, t]) => finSwatch("finc", h, `${t}, ${h}`, h, false, t)).join("")) : "")
    + (finPairs(now).length ? `<span class="r3d-finlab">Goes with it (its maker's pick)</span><div class="r3d-fintray" role="group" aria-label="Goes with it">${finSw(finPairs(now), null)}</div>` : "")
    + (FIN_PIC ? `<div class="r3d-finpic"><img src="${FIN_PIC.url}" data-finpicimg="1" alt="Your photo: tap a colour in it"><span class="r3d-finlab">Tap a colour in your photo</span></div>` : "")
    + `</div>`;
  const more = ceil && !liv ? `<span class="r3d-finlab">Bulbs</span>${finBulbTray(room)}${finFitTray(room)}` : "";   // N68: under More; N265: a wall's paper, panels, picture and curtains on its chips
  return [`${roomName(room)}: ${ceil ? "the ceiling" : wood ? (liv ? "skirting and door" : "the woodwork") : slope ? "the slopes" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "the walls"}`, nm,
    [...finBtns(!drawn && !slope, { finc: "" }, room), ...(!liv && !ceil && !wood && !slope ? [btn("Woodwork", { actopen: `fin:${room}:17` })] : []),   // N216: its skirting, doors, frames and radiators
      ...(ceil && ((R.HOUSE3.finish_areas || {})[room] || {}).slope ? [btn("Slopes", { actopen: `fin:${room}:29` })] : [])], null, tray, more && `<div class="r3d-fin">${more}</div>`];   // N214
}
function finHold(on) {   // Hold to compare: while held, the palette empty (the house as drawn); let go, your colours back
  // V3.90: the living room's own colours, rug and curtains held apart from the house's palette (that waits for the house; As it is doesn't)
  if (on && livHeld === null) { livHeld = JSON.stringify([S.paint, S.custom, S.walls, S.ceil, S.skirt, S.decor.rug, S.decor.curtains]); livSet({}); }
  else if (!on && livHeld !== null) { [S.paint, S.custom, S.walls, S.ceil, S.skirt, S.decor.rug, S.decor.curtains] = JSON.parse(livHeld); livHeld = null; applyDecor(); repaint(); syncButtons(); updateCaption(); }
  if (!FIN.pal) return;
  if (on && !finHeld) {    finHeld = FIN.pal.image.data.slice(); for (let i = 3; i < finHeld.length; i += 4) FIN.pal.image.data[i] = 0; FIN_LAID.forEach(m => m.visible = false); RUG_LAID.forEach(m => m.visible = false); CURT_LAID.forEach(m => m.visible = false); PIC_LAID.forEach(m => m.visible = false); PAPER_LAID.forEach(m => m.visible = false); PANEL_LAID.forEach(m => m.visible = false); FIT_LAID.forEach(m => m.visible = false); Object.values(FIN_PEND).forEach(g => g.visible = true); }
  else if (!on && finHeld) {    FIN.pal.image.data.set(finHeld); finHeld = null; FIN_LAID.forEach(m => m.visible = true); RUG_LAID.forEach(m => m.visible = true); CURT_LAID.forEach(m => m.visible = true); PIC_LAID.forEach(m => m.visible = true); PAPER_LAID.forEach(m => m.visible = true); PANEL_LAID.forEach(m => m.visible = true); FIT_LAID.forEach(m => m.visible = true); for (const [r, g] of Object.entries(FIN_PEND)) g.visible = !finGet(r, 8); }
  FIN.pal.needsUpdate = true; finOut(); winPlanHide(); tileApply(); kitApply(); bathApply(); doorApply();   // N227: the plan's blinds back while held; N225: the plan's tiles
}
/* V3.90 (N151): As it is: the house without Look's colours, Edit's moves, adds and take-outs (set aside, not changed); tap again for
   your plan. Nothing saves while on (store.set holds off); Edit or a colour picked switches it off first */
function nowMode(on) {
  on = !!on; if (on === NOWV) return;
  root.classList.add("nowfade");
  setTimeout(() => {
    if (on) { NOWV = true; finHold(true); applyHEdits({}); }
    else { finHold(false); NOWV = false; storeEdits(); }
    placeAll(); syncButtons(); dirty();
    const b = qs("#r3d-now"); if (b) b.setAttribute("aria-pressed", String(on)); finSchDraw();
    toast(on ? "As it is now (tap again for your plan)" : "Your plan");
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("nowfade")));
  }, 160);
}
{ const set0 = store.set.bind(store); store.set = (k, v) => { if ((NOWV || ASIDE) && k === KEY) return; set0(k, v); }; }
qs("#r3d-now")?.addEventListener("click", () => nowMode(!NOWV));
qs("#r3d-finschsave")?.addEventListener("click", finSchSave);
qs("#r3d-finschname")?.addEventListener("keydown", e => { if (e.key === "Enter") finSchSave(); });
let LOOK_HOLD = null;   // N231: a saved look's chip held: shown over yours (set aside) till let go, the difference on a toast; no wear on its click
qs("#r3d-finschl")?.addEventListener("pointerdown", e => { const b = e.target.closest("[data-finsch]"); if (!b || ASIDE || NOWV) return; const i = +b.dataset.finsch;
  LOOK_HOLD = { t: setTimeout(() => { const x = finSchemes()[i]; if (!x || ASIDE) return; LOOK_HOLD.on = true; const say = lookDiff(x); lookAside(x.name); lookPut(x); toast(`${x.name}: ${say}`); }, 350) }; });
for (const ev of ["pointerup", "pointercancel"]) document.addEventListener(ev, () => { if (!LOOK_HOLD) return; clearTimeout(LOOK_HOLD.t);
  if (LOOK_HOLD.on) { LOOK_HOLD.skip = true; lookMine(); setTimeout(() => { LOOK_HOLD = null; }, 0); } else LOOK_HOLD = null; });
qs("#r3d-finschl")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
  if (LOOK_HOLD && LOOK_HOLD.skip) { LOOK_HOLD = null; return; }
  if (b.dataset.finschdel) { const L = finSchemes(); L.splice(+b.dataset.finschdel, 1); try { localStorage.setItem(FSK, JSON.stringify(L)); } catch (er) {} finSchDraw(); }
  else if (b.dataset.finsch) finSchUse(+b.dataset.finsch);
  else if (b.dataset.lookas === "now") nowMode(!NOWV); else if (b.dataset.lookas === "plan") lookPlan(); });
document.addEventListener("click", e => { const b = e.target.closest("[data-lookkeep],[data-lookmine],[data-lookback]"); if (!b) return;   // N221, N222: the pill, the toast's Put back
  if (b.dataset.lookkeep) lookKeep(); else if (b.dataset.lookmine) lookMine();
  else if (LOOK_PREV) { const p = LOOK_PREV; LOOK_PREV = null; lookPut(p); toast("Put back"); } });
document.addEventListener("keydown", e => { if (e.key === "Escape" && ASIDE && !e.defaultPrevented && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) { e.preventDefault(); lookMine(); } });
finSchDraw();
/* N254 (C2): the finish cards' buttons through the one click router (16_cards.js cardOn): a selector, which cards, what it does */
const cardRoom = id => id === "hbed" ? "master" : id.startsWith("fin:") ? id.split(":")[1] : id.startsWith("hlit:") ? id.slice(5) : id.startsWith("hitem:") ? (HIT(id.slice(6)) || {}).r : null;
const onFin = id => id.startsWith("fin:"), onFinItem = id => onFin(id) || id.startsWith("hitem:") || id.startsWith("hlit:");   // N304: the dock's lights card
const finSaid = (L, v, what, none) => v ? (L.find(([k]) => k === v) || [0, v])[1].toLowerCase() + what : none;
cardOn("[data-winkind],[data-winfab],[data-winplan]", id => id.startsWith("win:"), (d, id) => { const [, room, j] = id.split(":"), q = winNow(room, +j);   // N227: a window's card
  winSet(room, +j, d.winplan ? null : d.winkind === "none" ? "none" : d.winkind ? `${d.winkind}.${q.k === d.winkind && q.c ? q.c : winFabs(d.winkind).some(([k]) => k === q.c) ? q.c : winFabs(d.winkind)[0][0]}` : `${q.k}.${d.winfab}`); });
cardOn("[data-finfit]", onFinItem, (d, id) => { const room = cardRoom(id); if (!room) return false;
  finWrite(room, { 8: d.finfit }); toast(`${roomName(room)}: ${finSaid(FIN_FITS, d.finfit, "", "the light as planned")}`); });
cardOn("[data-finslope]", onFin, (d, id) => finSet(cardRoom(id), 29, d.finslope || null));   // N214: the slopes with the ceiling or the walls
cardOn("[data-finpic2]", onFin, (d, id) => { const room = cardRoom(id), v = d.finpic2;
  finWrite(room, { 21: v, 22: v && String(finSide(room, +id.split(":")[2])) }); toast(`${roomName(room)}: ${finSaid(FIN_PICS, v, " print", "no picture")}`); });
cardOn("[data-finpaper]", onFin, (d, id) => { const room = cardRoom(id), v = d.finpaper;   // N29: the wallpaper, on this wall
  finWrite(room, { 24: v, 25: v && String(finSide(room, +id.split(":")[2])) }); toast(`${roomName(room)}: ${finSaid(FIN_PAPERS, v, " wallpaper", "no wallpaper")}`); });
cardOn("[data-finpanel]", onFin, (d, id) => { const room = cardRoom(id), v = d.finpanel;   // N57: panelling, on this wall
  finWrite(room, { 26: v, 27: v && String(finSide(room, +id.split(":")[2])) }); toast(`${roomName(room)}: ${finSaid(FIN_PANELS, v, " panelling", "no panelling")}`); });
cardOn("[data-finbed]", id => id === "hbed" || onFinItem(id), (d, id) => { const room = cardRoom(id); if (!room) return false;
  finWrite(room, { 20: d.finbed }); toast(`${roomName(room)}: ${finSaid(FIN_BED, d.finbed, " bedding", "the bedding as planned")}`); });
cardOn("[data-fincurt]", onFin, (d, id) => { const room = cardRoom(id), v = d.fincurt;
  if (room === LIVR) { finPush(); S.decor.curtains = v || DEF.decor.curtains; applyDecor(); syncButtons(); store.set(KEY, S); finSchDraw(); }   // its Look's own
  else finWrite(room, { 19: v });
  toast(`${roomName(room)}: ${finSaid([...FIN_CURT, ...LIV_CURT], v, " curtains", "no curtains")}`); });
cardOn("[data-finrug]", onFin, (d, id) => { const room = cardRoom(id); finWrite(room, { 18: d.finrug }); toast(`${roomName(room)}: ${finSaid(FIN_RUGS, d.finrug, " rug", "no rug")}`); });
cardOn("[data-finbulb],[data-finlux]", onFinItem, (d, id) => { const room = cardRoom(id); if (!room) return false;
  finWrite(room, d.finbulb ? { 6: d.finbulb } : { 7: d.finlux });   // the plan's 2700 K, normal: nothing kept
  const fb = finBulb(room); toast(`${roomName(room)}: ${(FIN_BULBS.find(([v]) => v === (fb.k || "2700")) || [0, ""])[1].toLowerCase()} bulbs, ${(FIN_LUX.find(([v]) => +v === fb.lux) || [0, "normal"])[1].toLowerCase()}`); });
cardOn("[data-finpicimg]", onFin, (d, id, b, e) => { const hex = finPicAt(b, e); if (!hex) return false; finSet(cardRoom(id), +id.split(":")[2], hex); });
cardOn("[data-fintab]", onFin, (d, id) => { FIN_TAB = { id, k: d.fintab }; });   // N265: a wall card's chip
cardOn("[data-finc],[data-finf],[data-finsc],[data-fincopy],[data-finpaste]", onFin, (d, id) => { const [, room, s] = id.split(":");
  if (d.finsc) finScope = d.finsc;
  else if (d.fincopy) { FIN_COPY = { room, sl: Object.assign({}, finAll()[room]) }; toast(`Copied ${roomName(room)}: tap another room, then Paste`); }
  else if (d.finpaste) { if (!FIN_COPY) return; finPush(); S.fin = S.fin || {};   // N5: the living room's own six walls and skirting stay its own
    if (room === LIVR) livSet(FIN_COPY.sl); else S.fin[room] = Object.fromEntries(Object.entries(FIN_COPY.sl).filter(([q, v]) => { const r = slotOf(+q, room); return !!r && (typeof r.copy === "function" ? r.copy(room, +q, v) : !!r.copy); }));   // N253: the rows Paste takes
    finApplyAll(); store.set(KEY, S); toast(`${roomName(room)}: ${roomName(FIN_COPY.room)}'s look`); }
  else if ("finf" in d) finSet(room, 5, d.finf || null);
  else finSet(room, +s, d.finc || null); });
if (act) {
  act.addEventListener("change", e => { if (e.target.dataset.finpic) { finPicLoad(e.target.files && e.target.files[0]); return; } if ((e.target.dataset.finany || e.target.dataset.finhex) && GS.actId && GS.actId.startsWith("fin:")) {
    const [, room, s] = GS.actId.split(":"), hex = e.target.dataset.finhex ? finHex(e.target.value) : e.target.value; if (!hex) { toast("A colour's code, like #DBFFC8"); return; }
    finSet(room, +s, hex); renderAct(); } });
  act.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset && e.target.dataset.finhex) { e.preventDefault(); e.target.dispatchEvent(new Event("change", { bubbles: true })); } });   // N213: Enter sets the code
  act.addEventListener("pointerdown", e => { if (e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) act.addEventListener(ev, () => finHold(false));
  act.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  act.addEventListener("keyup", e => { if (e.target.closest("[data-finhold]")) finHold(false); });
}
