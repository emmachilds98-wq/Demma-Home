/* V2.6 (docs/FINISHES_PLAN.md F3), the client: "customise different areas of the house in a fluid way, ie colour of walls": tap a wall or a
   ceiling in any of the house's rooms; its card has the colours as a tray (tap one: the room changes at once), where it goes (this wall,
   this room, the whole house), Undo, and Hold to compare (the house as planned till you let go). Kept on this device (S.fin: room ->
   slot -> colour), drawn through F2's palette (20_go.js finish). The living room keeps its own Look. */
let finScope = "room", finHeld = null, livHeld = null;
/* N5 (REAL_PLAN R7, the finishes plan's F8): the living room on the house's rows. Its colours stay where its own Look keeps them (S.paint,
   S.walls, S.ceil, S.skirt: drawn pixel for pixel as before); as a row it reads 0-3 its walls, 4 its ceiling, 11-16 its six walls by name
   (media, breast, door, stairs, window, PC), 17 the skirting, the door and its frame. So a tap on its wall opens the house's card, and the
   schemes, Undo, Copy and Paste and Send carry it with the rest of the house */
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
const finPush = () => { FIN_UNDO.push(JSON.stringify(finAll())); if (FIN_UNDO.length > 20) FIN_UNDO.shift(); };
const finSlotName = (room, slot) => room === LIVR && slot >= 11 && slot <= 16 ? WALLS[slot - 11][1].toLowerCase() : room === LIVR && slot === 17 ? "skirting and door" : `${FIN_NAMES[slot]} wall`;
const FIN_UNDO = [];
const FIN_NAMES = ["back", "front", "east", "west", "ceiling", "floor"];
/* V2.7 (F4): the floors in the tray: the house's own floor materials (their photos, house/textures), laid as a room's new floor; the mean
   colour of each photo is its swatch */
const FIN_FLOORS = [["carpet_grey", "Grey carpet"], ["carpet", "Oatmeal carpet"], ["laminate", "Laminate"], ["oak", "Oak boards"], ["pine", "Pine boards"],
  ["tile_f", "Pale tiles"], ["marble", "Black marble"], ["quarry", "Quarry tiles"],
  ["herring", "Herringbone oak"], ["lvt_grey", "Grey oak LVT"], ["porcelain", "Stone porcelain"]];   // V3.14 (N56): upgrades to try (fit.SOURCES upfloors)
const FIN_FLOOR_KEYS = new Set([...FIN_FLOORS.map(([k]) => k), "board", "concrete", "vinyl", "earth"]);
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
  return `<div class="r3d-finsc" role="group" aria-label="Bulbs">${chips(FIN_BULBS, "finbulb", b.k || "2700")}</div>`
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
      for (const [geos, mat] of [[white, FIN.mat3("upvc")], [glow, FIN.mat3("bulb")], [shade, FIT_SHADE]]) if (geos.length) {
        const me = new THREE.Mesh(mergeGeometries(geos), mat); geos.forEach(q => q.dispose()); me.castShadow = false; me.userData.finFit = L.room; into.add(me); FIT_LAID.push(me); } } }
  dirty();
}
function finFitTray(room) {
  const now = finGet(room, 8) || "";
  return `<span class="r3d-finlab">Light fitting</span><div class="r3d-finsc" role="group" aria-label="Light fitting">`
    + [["", "As planned"], ...FIN_FITS].map(([v, t]) => `<button type="button" data-finfit="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`;
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
/* N5c (REAL_PLAN R7): curtains at a room's windows (house/survey_data OPENINGS, R.HOUSE3.windows_in), kept as its row [19]: a pole a
   little wider than the window, two panels drawn back in folds, from just over the head to the sill (sill length: clear of a worktop under it), 14 cm into the room (clear
   of a radiator). The living room's own are its Look's (S.decor.curtains) */
const FIN_CURT = [["linen", "Linen", "#e6e0d2"], ["sage", "Sage", "#8b9878"], ["blue", "Deep blue", "#34507f"], ["rust", "Rust", "#a65a38"], ["charcoal", "Charcoal", "#4a4d52"]];
const LIV_CURT = [["hessian", "Your hessian"], ["linen", "Linen"], ["sage", "Sage"], ["blue", "Deep blue"], ["rust", "Rust"]];
let CURT_LAID = []; const CURT_MATS = {};
function houseMat(key, m) { const P = HMATS.paint; houseClip(m, P && CLIPSRC.get(P) || [], !!(P && P.clipIntersection)); HMATS[key] = m; return m; }   // with the house's, so a floor's cut takes it too
const curtMat = k => CURT_MATS[k] || (CURT_MATS[k] = houseMat(`curt_${k}`, new THREE.MeshStandardMaterial({ color: (FIN_CURT.find(([q]) => q === k) || [])[2] || CURTAIN_COLS[k] || "#e6e0d2", roughness: 0.95, side: THREE.DoubleSide })));
function finWindows(room) {   // a room's windows: the piece of floor furthest out at the window's middle is the room it's in
  const out = [];
  for (const [f, side, x0, x1, sill, head] of R.HOUSE3.windows_in || []) { const xm = (x0 + x1) / 2, Y = (R.HOUSE3.finish_floor_y || {})[f] || []; let best = null;
    (R.HOUSE3.finish_pieces[f] || []).forEach(([ri, a, b, z0, z1], i) => { const z = side === "n" ? z0 : z1; if (a <= xm && b >= xm && (!best || (side === "n" ? z < best.z : z > best.z))) best = { ri, z, y: Y[i] || 0 }; });
    if (best && FIN.rooms[best.ri] === room) out.push({ f, s: side === "n" ? 1 : -1, x0, x1, sill, head, yf: best.y, z: best.z }); }
  return out;
}
function finCurtApply() {
  if (!finSetup() || !houseG) return;
  for (const m of CURT_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } CURT_LAID = [];
  const pole = CURT_MATS.pole || (CURT_MATS.pole = houseMat("curt_pole", new THREE.MeshStandardMaterial({ color: "#3b3a38", roughness: 0.4, metalness: 0.6 })));
  for (const [room, sl] of Object.entries(S.fin || {})) { const k = sl[19]; if (!k || !FIN.rooms.includes(room)) continue;
    for (const w of finWindows(room)) { const g = HFLOOR[w.f]; if (!g) continue;
      const top = w.yf + Math.min(w.head + 12, (R.HOUSE3.ceil || 235) - 5), bot = w.yf + w.sill + 1, h = top - bot, pw = (w.x1 - w.x0) * 0.3 + 15, zc = w.z + w.s * 14, geos = [];
      for (const xa of [w.x0 - 15, w.x1 + 15 - pw]) { const q = new THREE.PlaneGeometry(pw * M, h * M, 12, 1), P = q.attributes.position;
        for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin((P.getX(i) / (pw * M) + 0.5) * Math.PI * 6) * 0.025);
        if (w.s < 0) q.rotateY(Math.PI); const c = v3(xa + pw / 2, bot + h / 2, zc); q.translate(c.x, c.y, c.z); q.computeVertexNormals(); geos.push(q); }
      const cloth = new THREE.Mesh(mergeGeometries(geos), curtMat(k)); geos.forEach(q => q.dispose());
      const rod = new THREE.CylinderGeometry(0.012, 0.012, (w.x1 - w.x0 + 40) * M, 10); rod.rotateZ(Math.PI / 2); const c = v3((w.x0 + w.x1) / 2, top + 3, zc); rod.translate(c.x, c.y, c.z);
      for (const me of [cloth, new THREE.Mesh(rod, pole)]) { me.receiveShadow = true; me.castShadow = true; me.userData.finRoom = room; g.add(me); CURT_LAID.push(me); } } }
  dirty();
}
/* N5d (REAL_PLAN R7): the bedding's colour, a room's row [20], through the palette (20_go.js: the duvet and pillows, slot 5); on the bed's card */
const FIN_BED = [["#f4f1eb", "White"], ["#a3a29e", "Grey"], ["#8b9878", "Sage"], ["#34507f", "Deep blue"], ["#a65a38", "Rust"], ["#c9a03f", "Mustard"], ["#d9a9a0", "Blush"]];
function finBedTray(room) {
  const now = finGet(room, 20) || "";
  return `<div class="r3d-fin"><span class="r3d-finlab">Bedding</span><div class="r3d-fintray" role="group" aria-label="Bedding">`
    + [["", "As planned"], ...FIN_BED].map(([h, t]) => `<button type="button" class="sw" data-finbed="${h}" style="--c:${h || "#e9e5dc"}" aria-pressed="${now === h}" title="${t}" aria-label="${t}"><i></i><span>${t}</span></button>`).join("") + `</div></div>`;
}
/* N5e (REAL_PLAN R7): a picture on a wall: a print in a 52 × 72 frame (IKEA RIBBA 50 × 70: fit.SOURCES ribba), its middle 150 cm up,
   in the middle of the wall you tapped (the room's biggest piece of floor), 2 cm off it. Row [21] the print, [22] the wall (0-3, as the
   palette's sides). Drawn here, nothing downloaded. A plant is the catalogue's (N7: Add a piece here) */
const FIN_PICS = [["arches", "Arches"], ["sun", "Sunset"], ["leaves", "Leaves"], ["lines", "Lines"]];
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
/* N29 (FINISHES_PLAN F9): wallpaper on one wall of a room: row [24] the paper, [25] the wall (0-3, as the palette's sides), on the
   room's biggest piece of floor. Drawn here at its real repeat (a tile is the roll's width by the repeat), lined up from the wall's
   corner, round its doors and windows, up to its ceiling (a slope too). Sizes from real rolls (fit.SOURCES wallpaper); the rolls counted
   from the wall's width and height: drops of the height and a repeat, plus one roll spare */
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
/* N57 (REAL_PLAN section 14): panelling on a wall, to try (fit.SOURCES panels): Shaker, 97 × 9 mm MDF strips to 120 high in the wall's own
   colour (a rail on the skirting, one at the top, stiles about 55 apart and at a door's sides); Oak slats, floor to ceiling, 27 wide with 13
   gaps, 12 deep on 9 mm of black felt. Real boxes, round the doors and windows, under a slope; one draw each kind a room */
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
/* N29 (FINISHES_PLAN F11): the colours each paint's own maker pairs with it (fit.SOURCES pairings), the hex their pages give: Farrow &
   Ball's three Colour Schemes (an accent and a trim each), Little Greene's related whites and neutrals, coordinating, an accent, a dark */
const FIN_PAIRS = {
  card_room: [["#e3ded0", "Farrow & Ball School House White No. 291"], ["#c5bdac", "Farrow & Ball Drop Cloth No. 283"], ["#889b9b", "Farrow & Ball Oval Room Blue No. 85"],
    ["#b19c8d", "Farrow & Ball Dead Salmon No. 28"], ["#464d4a", "Farrow & Ball Studio Green No. 93"], ["#6f4449", "Farrow & Ball Preference Red No. 297"]],
  treron: [["#e6e0d2", "Farrow & Ball Slipper Satin No. 2004"], ["#e3dcc7", "Farrow & Ball Lime White No. 1"], ["#dbd4bf", "Farrow & Ball Off-White No. 3"],
    ["#c7bfab", "Farrow & Ball Old White No. 4"], ["#caccba", "Farrow & Ball Eddy No. 301"], ["#b0af9b", "Farrow & Ball French Gray No. 18"]],
  sage: [["#f8f4e3", "Little Greene Stock"], ["#e9e6d5", "Little Greene Portland Stone Pale"], ["#e1dbc6", "Little Greene Green Stone Light"], ["#d2ceb8", "Little Greene Green Stone"],
    ["#cab49c", "Little Greene Lute"], ["#c09f66", "Little Greene Bassoon"], ["#5371b8", "Little Greene Mambo"], ["#132019", "Little Greene Obsidian Green"]] };
const finPairs = hex => { const k = hex && Object.keys(R.PAINTS || {}).find(q => R.PAINTS[q].hex.toLowerCase() === hex.toLowerCase()); return (k && FIN_PAIRS[k]) || []; };
function finCurtTray(room) {
  const liv = room === LIVR, now = liv ? S.decor.curtains : finGet(room, 19) || "";
  if (!liv && !finWindows(room).length) return "";
  return `<span class="r3d-finlab">Curtains</span><div class="r3d-finsc" role="group" aria-label="Curtains">`
    + (liv ? LIV_CURT : [["", "None"], ...FIN_CURT]).map(([v, t]) => `<button type="button" data-fincurt="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`;
}
/* N5b (REAL_PLAN R7): a rug in any room, from the living room's four (its Arches, jute, deep blue, sage stripes): kept as the room's row
   [18]; laid in the middle of the room's biggest piece of floor, the biggest standard UK size that leaves 35 cm round it (Argos: 60×100,
   80×150, 120×170, 160×230, 200×290: fit.SOURCES rugsizes), its long side along the room's. The living room's own is its Look's (S.decor.rug) */
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
    for (const [s, v] of Object.entries(sl)) { const k = +s, ok = k <= 4 || k === 9 || k === 10 || k === 20 || (room === LIVR && k >= 11 && k <= 17) ? /^#[0-9a-f]{6}$/i.test(v) : k === 5 ? floors.has(v) : k === 6 ? bulbs.has(v) : k === 7 ? lux.has(v) : k === 8 ? FIN_FITS.some(([f]) => f === v) : k === 18 ? v === "none" || FIN_RUGS.some(([f]) => f === v) : k === 19 ? [...FIN_CURT, ...LIV_CURT].some(([f]) => f === v) : k === 21 ? FIN_PICS.some(([f]) => f === v) : k === 22 ? ["0", "1", "2", "3"].includes(String(v)) : k === 23 ? !!HCAT[v] && HCAT[v].k === "plant" : k === 24 ? FIN_PAPERS.some(([f]) => f === v) : k === 25 || k === 27 ? ["0", "1", "2", "3"].includes(String(v)) : k === 26 ? FIN_PANELS.some(([f]) => f === v) : false;
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
  for (const [room, P] of Object.entries(PAPER_AT)) { const nm = (FIN_PAPERS.find(([k]) => k === P.k) || [0, P.k])[1];   // N29: the wallpaper's rolls
    rows.push(`<div class="ms-erow"><b>${roomName(room)}</b> ${FIN_NAMES[+(finGet(room, 25) || 0)]} wall, ${nm}: ${(P.L / 100).toFixed(1)} × ${(P.H / 100).toFixed(1)} m, ${P.rolls} rolls (1 spare), about £${P.cost}</div>`); }
  const la = A[LIVR]; if (la && livChanged()) { const by = {};   // N5: the living room's, by its six walls
    for (const k of LIV_W) { const w = la.walls[k], hex = S.walls[k] || paintHex(); if (w) by[hex] = (by[hex] || 0) + w[0]; }
    for (const [hex, m2] of Object.entries(by)) { const l = lit(m2); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> walls, ${paint(hex)}: ${m2.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); }
    if (la.ceiling) { const hex = chHex("ceil"), l = lit(la.ceiling); rows.push(`<div class="ms-erow"><b>${roomName(LIVR)}</b> ceiling, ${paint(hex)}: ${la.ceiling.toFixed(1)} m², about ${l} L (${tins(l)} × 2.5 L)</div>`); } }
  const T = R.HOUSE3 ? upsAll()[1] : { n: 0 }; if (T.n) rows.push(`<div class="ms-erow"><b>All the changes</b> ${T.n}, about ${upRange(T.lo, T.hi) || "£0"}</div>`);   // N40: the house's total, sent with the rest
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
  if (!finSetup()) return; finish(null, "walls", null); finish(null, "ceiling", null); finish(null, "bedding", null);
  if (houseG) { houseG.updateMatrixWorld(true); FIN.inv.copy(houseG.matrixWorld).invert(); }   // N5d: the bedding finds its room in the house's own frame
  for (const [room, sl] of Object.entries(S.fin || {})) for (const [s, hex] of Object.entries(sl)) if ((+s < 5 || +s === 20) && FIN.rooms.includes(room)) finish(room, +s === 20 ? "bedding" : FIN_NAMES[+s], hex);
  finFloorApply(); finOut(); storeEdits(); if (typeof placeRoomLights === "function") { roomKey = ""; placeRoomLights(); } finTakes(); finSchDraw();
}
/* V2.38 (FINISHES_PLAN F12, the outside): our window frames' outside face (model.window's frame_out: white inside, as foiled frames) and
   the front door's (door_out), from the frames' usual colours (RAL) and the paints; kept as S.fin.outside[9] and [10] */
const FIN_OUT = [["#f5f5f2", "White"], ["#383e42", "Anthracite grey (RAL 7016)"], ["#b5b8b1", "Agate grey (RAL 7038)"], ["#0a0a0a", "Black (RAL 9005)"], ["#fdf4e3", "Cream (RAL 9001)"]];
const finOut = () => { for (const [s, k] of [[9, "frame_out"], [10, "door_out"]]) { const m = HMATS && HMATS[k]; if (m) m.color.set(!finHeld && finGet("outside", s) || R.HOUSE3.mats[k][0]); } dirty(); };
const finName = hex => ([...FIN_OUT, ...finSwatches(), ...Object.values(FIN_PAIRS).flat()].find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
const finSw = (L, now) => L.map(([h, t]) => `<button type="button" class="sw" data-finc="${h}" style="--c:${h}" aria-pressed="${!!now && now.toLowerCase() === h.toLowerCase()}" title="${t}" aria-label="${t}"><i></i><span>${finShort(t)}</span></button>`).join("");
function finSet(room, slot, hex) {   // by the scope: this wall, this room's walls (or ceiling), the whole house's
  finPush(); S.fin = S.fin || {};
  if (room === LIVR || (finScope === "house" && slot <= 4)) {   // N5: the living room's own Look; Whole house takes it in too
    const one = room === LIVR && finScope === "wall" && slot >= 11; livFin(slot, hex, one);
    if (room === LIVR && finScope !== "house") { store.set(KEY, S); finTakes(); finSchDraw();
      toast(`${roomName(room)}: ${slot === 4 ? "ceiling" : slot === 17 ? "skirting and door" : one ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? finName(hex) : "as planned"}`); return; }
    if (slot >= 11) slot = 0; }
  if (room === "outside") { const o = S.fin.outside = S.fin.outside || {}; if (hex) o[slot] = hex; else delete o[slot]; if (!Object.keys(o).length) delete S.fin.outside;
    finOut(); store.set(KEY, S); toast(`Outside: ${slot === 9 ? "the window frames" : "the front door"} ${hex ? finName(hex) : "white, as planned"}`); return; }
  const ceil = slot === 4, flr = slot === 5, slots = flr ? [5] : ceil ? [4] : finScope === "wall" ? [slot] : [0, 1, 2, 3];
  const rooms = finScope === "house" ? FIN.rooms : flr && finScope === "floor" ? finStorey(room) : [room];
  for (const r of rooms) { const o = S.fin[r] = S.fin[r] || {}; for (const s of slots) { if (hex) o[s] = hex; else delete o[s]; } if (!Object.keys(o).length) delete S.fin[r]; }
  finApplyAll(); store.set(KEY, S);
  if (flr) { const nm = (FIN_FLOORS.find(([k]) => k === hex) || [0, "as planned"])[1]; toast(`${finScope === "floor" ? "Whole floor" : roomName(room)}: floor ${hex ? nm : "as planned"}`); return; }
  const nm = finName(hex);
  toast(`${finScope === "house" ? "Whole house" : roomName(room)}: ${ceil ? "ceiling" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "walls"} ${hex ? nm : "as planned"}`);
}
function finBtns(changed, reset, room) {   // N68: a colour or floor card's buttons, the same on each: Undo, As planned, Hold to compare, then (under More) Copy, Paste
  return [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(changed ? [btn("As planned", reset)] : []), btn("Hold to compare", { finhold: "1" }, undefined, "", "Hold to compare: the room as planned till you let go"), ...finCopyBtns(room)];
}
function finStorey(room) {   // the rooms on the same floor as this one
  const P = R.HOUSE3.finish_pieces || {};
  for (const f of ["lower", "ground", "first"]) { const ids = [...new Set((P[f] || []).map(p => FIN.rooms[p[0]]))]; if (ids.includes(room)) return ids; }
  return [room];
}
function finFloorCard(room) {   // V2.7 (F4): a room's floor: the carpets, laminate, boards and tiles
  if (finScope !== "room" && finScope !== "floor") finScope = "room";
  const now = finGet(room, 5), nm = now ? (FIN_FLOORS.find(([k]) => k === now) || [0, now])[1] : "As planned";
  const tray = `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${[["room", "This room"], ["floor", "Whole floor"]].map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Floors">${FIN_FLOORS.map(([k, t]) => `<button type="button" class="sw" data-finf="${k}" style="--c:${finFloorCol(k)}" aria-pressed="${now === k}" title="${t}" aria-label="${t}"><i></i><span>${t}</span></button>`).join("")}</div></div>`;
  const more = `<div class="r3d-fin">${finRugTray(room)}${room !== LIVR && (R.HOUSE3.rooms || {})[room] ? plantTray(room) : ""}</div>`;   // N5: the rug, a plant (N68: under More)
  return [`${roomName(room)}: the floor`, nm, finBtns(now, { finf: "" }, room), null, tray, more];
}
function finCard(id) {   // [title, now, buttons, -, the tray]
  const [, room, s] = id.split(":"), slot = +s, ceil = slot === 4, now = finGet(room, slot);
  if (slot === 5) return finFloorCard(room);
  if (slot === 20) return [`${roomName(room)}: the bedding`, now ? (FIN_BED.find(([h]) => h === now) || [0, now])[1] : "As planned", FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : [], null, finBedTray(room)];
  if (room === "outside") return [`Outside: ${slot === 9 ? "the window frames" : "the front door"}`, now ? finName(now) : "White, as planned",
    [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(now ? [btn("As planned", { finc: "" })] : [])], null,
    `<div class="r3d-fin"><div class="r3d-fintray" role="group" aria-label="Colours">${finSw([...FIN_OUT, ...finSwatches().slice(1)], now)}<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f5f5f2"}" aria-label="Any colour"><span>Any</span></label></div></div>`];
  const liv = room === LIVR, named = liv && slot >= 11 && slot <= 16, drawn = liv ? (slot === 0 ? S.paint === DEF.paint && !Object.keys(S.walls).length : named ? !S.walls[LIV_W[slot - 11]] : !now) : !now;
  if (finScope === "floor" || (liv && slot === 17)) finScope = "room";
  if ((ceil || (liv && !named)) && finScope === "wall") finScope = "room";
  const nm = drawn ? "As planned" : finName(now);
  const scopes = liv && slot === 17 ? [] : ceil || (liv && !named) ? [["room", "This room"], ["house", "Whole house"]] : [["wall", "This wall"], ["room", "This room"], ["house", "Whole house"]];
  const tray = `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${scopes.map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Colours">${finSw(finSwatches(), now)}`
    + `<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f4f3ef"}" aria-label="Any colour"><span>Any</span></label>`
    + `<label class="sw pic" title="A colour from a photo"><i><span class="ms" aria-hidden="true">photo_camera</span></i><input type="file" accept="image/*" data-finpic="1" aria-label="A colour from a photo"><span>Photo</span></label></div>`
    + (now ? `<span class="r3d-finlab">Shades of it</span><div class="r3d-fintray" role="group" aria-label="Shades of it">${finShades(now).map(([h, t]) => `<button type="button" class="sw" data-finc="${h}" style="--c:${h}" aria-pressed="false" title="${t}, ${h}" aria-label="${t}, ${h}"><i></i><span>${t}</span></button>`).join("")}</div>` : "")
    + (finPairs(now).length ? `<span class="r3d-finlab">Goes with it (its maker's pick)</span><div class="r3d-fintray" role="group" aria-label="Goes with it">${finSw(finPairs(now), null)}</div>` : "")
    + (FIN_PIC ? `<div class="r3d-finpic"><img src="${FIN_PIC.url}" data-finpicimg="1" alt="Your photo: tap a colour in it"><span class="r3d-finlab">Tap a colour in your photo</span></div>` : "")
    + `</div>`;
  const more = (ceil && !liv ? `<span class="r3d-finlab">Bulbs</span>${finBulbTray(room)}${finFitTray(room)}` : "") + (ceil || (liv && slot === 17) ? "" : finCurtTray(room) + (liv ? "" : finPicTray(room, slot) + finPaperTray(room, slot) + finPanelTray(room, slot)));   // N68: under More
  return [`${roomName(room)}: ${ceil ? "the ceiling" : liv && slot === 17 ? "skirting and door" : finScope === "wall" ? `the ${finSlotName(room, slot)}` : "the walls"}`, nm,
    finBtns(!drawn, { finc: "" }, room), null, tray, more && `<div class="r3d-fin">${more}</div>`];
}
function finHold(on) {   // Hold to compare: while held, the palette empty (the house as drawn); let go, your colours back
  if (!FIN.pal) return;
  if (on && !finHeld) { livHeld = JSON.stringify([S.paint, S.custom, S.walls, S.ceil, S.skirt]); livSet({});   // N5: the living room as the plan has it too
    finHeld = FIN.pal.image.data.slice(); for (let i = 3; i < finHeld.length; i += 4) FIN.pal.image.data[i] = 0; FIN_LAID.forEach(m => m.visible = false); RUG_LAID.forEach(m => m.visible = false); CURT_LAID.forEach(m => m.visible = false); PIC_LAID.forEach(m => m.visible = false); PAPER_LAID.forEach(m => m.visible = false); PANEL_LAID.forEach(m => m.visible = false); FIT_LAID.forEach(m => m.visible = false); Object.values(FIN_PEND).forEach(g => g.visible = true); }
  else if (!on && finHeld) { [S.paint, S.custom, S.walls, S.ceil, S.skirt] = JSON.parse(livHeld); livHeld = null; repaint(); syncButtons(); updateCaption();
    FIN.pal.image.data.set(finHeld); finHeld = null; FIN_LAID.forEach(m => m.visible = true); RUG_LAID.forEach(m => m.visible = true); CURT_LAID.forEach(m => m.visible = true); PIC_LAID.forEach(m => m.visible = true); PAPER_LAID.forEach(m => m.visible = true); PANEL_LAID.forEach(m => m.visible = true); FIT_LAID.forEach(m => m.visible = true); for (const [r, g] of Object.entries(FIN_PEND)) g.visible = !finGet(r, 8); }
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
      toast(`${roomName(room)}: ${ff.dataset.finfit ? (FIN_FITS.find(([v]) => v === ff.dataset.finfit) || [0, ""])[1].toLowerCase() : "the light as planned"}`); renderAct(); return; }
    const pb = e.target.closest("[data-finpic2]");
    if (pb && actId && actId.startsWith("fin:")) { e.stopPropagation(); const [, room, sl] = actId.split(":"), v = pb.dataset.finpic2; finPush(); S.fin = S.fin || {};
      const o = S.fin[room] = S.fin[room] || {}; if (v) { o[21] = v; o[22] = String(Math.min(3, +sl)); } else { delete o[21]; delete o[22]; } if (!Object.keys(o).length) delete S.fin[room];
      finPicApply(); store.set(KEY, S); finSchDraw(); toast(`${roomName(room)}: ${v ? (FIN_PICS.find(([k]) => k === v) || [0, v])[1].toLowerCase() + " print" : "no picture"}`); renderAct(); return; }
    const wp = e.target.closest("[data-finpaper]");
    if (wp && actId && actId.startsWith("fin:")) { e.stopPropagation(); const [, room, sl] = actId.split(":"), v = wp.dataset.finpaper; finPush(); S.fin = S.fin || {};   // N29: the wallpaper, on this wall
      const o = S.fin[room] = S.fin[room] || {}; if (v) { o[24] = v; o[25] = String(Math.min(3, +sl)); } else { delete o[24]; delete o[25]; } if (!Object.keys(o).length) delete S.fin[room];
      finPaperApply(); finTakes(); store.set(KEY, S); finSchDraw(); toast(`${roomName(room)}: ${v ? (FIN_PAPERS.find(([k]) => k === v) || [0, v])[1].toLowerCase() + " wallpaper" : "no wallpaper"}`); renderAct(); return; }
    const pn = e.target.closest("[data-finpanel]");
    if (pn && actId && actId.startsWith("fin:")) { e.stopPropagation(); const [, room, sl] = actId.split(":"), v = pn.dataset.finpanel; finPush(); S.fin = S.fin || {};   // N57: panelling, on this wall
      const o = S.fin[room] = S.fin[room] || {}; if (v) { o[26] = v; o[27] = String(Math.min(3, +sl)); } else { delete o[26]; delete o[27]; } if (!Object.keys(o).length) delete S.fin[room];
      finPanelApply(); finTakes(); store.set(KEY, S); finSchDraw(); toast(`${roomName(room)}: ${v ? (FIN_PANELS.find(([k]) => k === v) || [0, v])[1].toLowerCase() + " panelling" : "no panelling"}`); renderAct(); return; }
    const db = e.target.closest("[data-finbed]");
    if (db && actId && (actId === "hbed" || actId.startsWith("hitem:") || actId.startsWith("fin:"))) { e.stopPropagation(); const room = actId === "hbed" ? "master" : actId.startsWith("fin:") ? actId.split(":")[1] : (HIT(actId.slice(6)) || {}).r; if (!room) return;
      const v = db.dataset.finbed; finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {}; if (v) o[20] = v; else delete o[20]; if (!Object.keys(o).length) delete S.fin[room];
      finApplyAll(); store.set(KEY, S); toast(`${roomName(room)}: ${v ? (FIN_BED.find(([h]) => h === v) || [0, v])[1].toLowerCase() + " bedding" : "the bedding as planned"}`); renderAct(); return; }
    const cb = e.target.closest("[data-fincurt]");
    if (cb && actId && actId.startsWith("fin:")) { e.stopPropagation(); const room = actId.split(":")[1], v = cb.dataset.fincurt; finPush(); S.fin = S.fin || {};
      if (room === LIVR) { S.decor.curtains = v || DEF.decor.curtains; applyDecor(); syncButtons(); }
      else { const o = S.fin[room] = S.fin[room] || {}; if (v) o[19] = v; else delete o[19]; if (!Object.keys(o).length) delete S.fin[room]; finCurtApply(); }
      store.set(KEY, S); finSchDraw(); toast(`${roomName(room)}: ${v ? ([...FIN_CURT, ...LIV_CURT].find(([k]) => k === v) || [0, v])[1].toLowerCase() + " curtains" : "no curtains"}`); renderAct(); return; }
    const rb = e.target.closest("[data-finrug]");
    if (rb && actId && actId.startsWith("fin:")) { e.stopPropagation(); const room = actId.split(":")[1], v = rb.dataset.finrug; finPush(); S.fin = S.fin || {};
      const o = S.fin[room] = S.fin[room] || {}; if (v) o[18] = v; else delete o[18]; if (!Object.keys(o).length) delete S.fin[room];
      finRugApply(); store.set(KEY, S); finSchDraw(); toast(`${roomName(room)}: ${v ? (FIN_RUGS.find(([k]) => k === v) || [0, v])[1].toLowerCase() + " rug" : "no rug"}`); renderAct(); return; }
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
      if (room === LIVR) livSet(FIN_COPY.sl); else S.fin[room] = Object.fromEntries(Object.entries(FIN_COPY.sl).filter(([k]) => +k <= 10 || (+k >= 18 && +k <= 27)));
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
