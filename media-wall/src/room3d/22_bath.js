/* N225 (REAL_PLAN section 29): the bathroom's and the WC's tiles her own: a tile (S.fin[room][90]) and its grout ([91]), from a tap on the
   tiles. Drawn by swapping the tiled material's own maps (the bathroom's walls `stone`, the WC's splashback `tile_w`: only those rooms have
   them) for ones drawn here at the tile's size and bond, so no new shader; the plan's back on The plan's, while held and As it is. Costed
   by the tiled area +10%, the grout and a tiler (fit.SOURCES n225tiles). The toilets and basins swap as pieces (08_house_catalogue.js) */
const TILE_ROOMS = { bathroom: "stone", wc: "tile_w", kitchen: "metro" }, TILE_PLAN = { bathroom: "stone-effect 60 × 30", wc: "white 15 × 15", kitchen: "black metro 20 × 10" };   // N224: the kitchen's splashback too
const TILE_STYLES = [["metro", "White metro", 15, 7.5, "#f1f0ec", 0.5, 0, 23], ["sage", "Sage metro", 15, 7.5, "#a3b39b", 0.5, 0, 21.33],
  ["square", "White square", 10, 10, "#f2f2ef", 0, 0, 48], ["zellige", "Zellige", 10, 10, "#eeece4", 0, 1, 36.86], ["large", "Large white", 60, 30, "#efeeea", 0, 0, 16],
  ["gsage", "Sage glass", 60, 75, "#95a38a", 0, 2, 231], ["gcream", "Cream glass", 60, 75, "#ebe3cf", 0, 2, 200], ["gblack", "Black glass", 60, 75, "#1e1f21", 0, 2, 178]];   // key, name, W × H cm, face, bond, handmade (2: a glass panel, the kitchen's), £ a m² (fit.SOURCES n225tiles, n224glass)
const tileStyles = room => TILE_STYLES.filter(q => q[6] !== 2 || room === "kitchen");
const TILE_GROUT = [["white", "White", "#ecebe6"], ["grey", "Grey", "#a3a29d"], ["charcoal", "Charcoal", "#4a4b4d"]], TILE_FIT = [20, 50], TILE_BAG = [10, 11];   // a tiler £ a m²; a bag of grout
const TILE_TEX = {}, TILE0 = new WeakMap();   // the drawn maps by tile, grout and material; each material's own (not in userData: three copies that as JSON)
const tileOk = (room, k, v) => !!TILE_ROOMS[room] && (k === 90 ? tileStyles(room).some(([q]) => q === v) : k === 91 && TILE_GROUT.some(([q]) => q === v));
function tileOf(room) { const st = tileStyles(room).find(([q]) => q === finGet(room, 90)); return st ? { st, g: TILE_GROUT.find(([q]) => q === finGet(room, 91)) || TILE_GROUT[0] } : null; }
function tileAt(hit) {   // a tap on the tiles: their room's card
  const m = hit && hit.object && hit.object.material, hk = m && !Array.isArray(m) && m.userData && m.userData.hk;
  const room = hk && Object.keys(TILE_ROOMS).find(r => TILE_ROOMS[r] === hk); return room ? { room, slot: 90 } : null;
}
function tileArea(room) {   // m² tiled: each tile box's face (its two longest sides), on its room's floor
  const H = R.HOUSE3 || {}, r = (H.rooms || {})[room], F = r && (H.floors || {})[HCFK[String(r[4])]], L = (F && (F.boxes || {})[TILE_ROOMS[room]]) || [];
  return L.reduce((t, b) => { const d = [b[3] - b[0], b[4] - b[1], b[5] - b[2]].sort((p, q) => q - p); return t + d[0] * d[1] / 1e4; }, 0);
}
function tileUps(room, add) {   // Changes: the tiles by their area (+10% for cuts), a bag of grout, a tiler
  const q = tileOf(room); if (!q) return; const A = tileArea(room) || 2;
  if (q.st[6] === 2) { add(`90=${q.st[0]}`, `Splashback: ${q.st[1]}, ${A.toFixed(1)} m²`, [A * q.st[7], A * q.st[7] * 1.25]); return; }   // N224: glass, self-adhesive (made to measure costs more)
  add(`90=${q.st[0]}.${q.g[0]}`, `Tiles: ${q.st[1]}, ${q.g[1].toLowerCase()} grout, ${A.toFixed(1)} m²`, [A * 1.1 * q.st[7] + TILE_BAG[0] + A * TILE_FIT[0], A * 1.1 * q.st[7] + TILE_BAG[1] + A * TILE_FIT[1]]);
}
/* a square of whole tiles about 60 cm a side, drawn at the tile's size as build_textures.tiles draws the plan's: the grout 2 mm and sunk,
   each tile's glazed edge rounded and a hair its own shade and level; the handmade ones wavier and more mottled */
function tileTex(st, g, hk) {
  const key = `${st[0]}.${g[0]}.${hk}`; if (TILE_TEX[key]) return TILE_TEX[key];
  const [, , tw0, th0, face, bond, hand] = st, glass = hand === 2, tw = glass ? 60 : tw0, th = glass ? 60 : th0, n = Math.max(1, Math.round(60 / tw)), span = n * tw, rows = Math.round(span / th);
  const px = SMALL ? 512 : 1024, cm = span / px, gw = glass ? 0.04 : 0.1, bev = hand ? 0.3 : 0.12, hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), F = hex(face), G = hex(g[2]);
  let s = 9 + st[0].length * 31; const rn = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const T = Array.from({ length: rows * n }, () => [rn(), rn(), rn(), rn()]);   // each tile: its shade, its tilt both ways, its wave
  const hgt = new Float32Array(px * px), col = new Uint8ClampedArray(px * px * 4), rgh = new Uint8ClampedArray(px * px * 4), nrm = new Uint8ClampedArray(px * px * 4);
  for (let j = 0; j < px; j++) { const y = (j + 0.5) * cm, row = Math.floor(y / th), ly = y - row * th, off = (row % 2) * tw * bond;
    for (let i = 0; i < px; i++) { const xx = (i + 0.5) * cm - off, c = Math.floor(xx / tw), lx = xx - c * tw, t = T[row * n + ((c % n) + n) % n];
      const d = glass ? Math.min(lx, tw - lx) : Math.min(lx, tw - lx, ly, th - ly), p = j * px + i, q = p * 4; let k, r;
      if (d < gw) { if (glass) { r = 0.2; hgt[p] = 0.1; for (let e = 0; e < 3; e++) col[q + e] = F[e] * 0.7; col[q + 3] = 255; rgh[q] = rgh[q + 1] = rgh[q + 2] = r * 255; rgh[q + 3] = 255; continue; }   // a panel's seam
        k = (0.82 + 0.18 * Math.min(1, d / gw * 1.4)) * (0.95 + rn() * 0.08); r = 0.9; hgt[p] = rn() * 0.01; for (let e = 0; e < 3; e++) col[q + e] = G[e] * k; }
      else if (glass) { hgt[p] = 0.3; const k = 0.97 + 0.05 * (ly / th); r = 0.04; for (let e = 0; e < 3; e++) col[q + e] = F[e] * k; }   // N224: the panel's face, a hair lighter up
      else { const e1 = Math.min(1, (d - gw) / bev), mot = hand ? Math.sin(lx * 1.3 + t[3] * 9) * Math.sin(ly * 1.1 + t[0] * 7) : 0;
        hgt[p] = (1 - (1 - e1) * (1 - e1)) * 0.3 + (t[1] - 0.5) * 0.02 * (lx - tw / 2) + (t[2] - 0.5) * 0.02 * (ly - th / 2) + mot * (hand ? 0.05 : 0);
        k = (hand ? 0.88 + t[0] * 0.14 + mot * 0.03 : 0.97 + t[0] * 0.05) * (1 - 0.14 * Math.pow(Math.max(0, 1 - (d - gw) / 0.35), 2));   // the edge darker into the joint
        r = hand ? 0.12 + t[3] * 0.06 : 0.07 + t[3] * 0.03; for (let e = 0; e < 3; e++) col[q + e] = F[e] * k; }
      col[q + 3] = 255; rgh[q] = rgh[q + 1] = rgh[q + 2] = r * 255; rgh[q + 3] = 255; } }
  for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) {   // the relief: its slope, rows down the picture (as build_textures)
    const h = (a, b) => hgt[((b + px) % px) * px + (a + px) % px], gx = (h(i + 1, j) - h(i - 1, j)) / (2 * cm), gy = (h(i, j + 1) - h(i, j - 1)) / (2 * cm), l = Math.hypot(gx, gy, 1), q = (j * px + i) * 4;
    nrm[q] = (-gx / l + 1) * 127.5; nrm[q + 1] = (gy / l + 1) * 127.5; nrm[q + 2] = (1 / l + 1) * 127.5; nrm[q + 3] = 255; }
  const rep = ((houseTex(hk) || {}).size || [0.6, 0.6]).map(v => v * 100 / span);   // the photo's metres a repeat over the pattern's
  const tex = (a, srgb) => { const t = canvasTex(px, px, gc => gc.putImageData(new ImageData(a, px, px), 0, 0), srgb); t.repeat.set(rep[0], rep[1]); return t; };
  return (TILE_TEX[key] = { map: tex(col, true), normalMap: tex(nrm, false), roughnessMap: tex(rgh, false) });
}
function tileApply() {   // each tiled room's material: her tiles' maps, or its own (only the maps it has: no new program)
  if (!HMATS || !FIN.mat3) return;
  for (const [room, hk] of Object.entries(TILE_ROOMS)) { const m = HMATS[hk] || FIN.mat3(hk); if (!m || !m.map) continue;
    if (!TILE0.has(m)) TILE0.set(m, { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: m.roughness });
    const o = TILE0.get(m), q = !finHeld && tileOf(room), T = q && tileTex(q.st, q.g, hk);
    for (const f of ["map", "normalMap", "roughnessMap"]) if (o[f]) m[f] = T ? T[f] : o[f];
    m.roughness = T && o.roughnessMap ? 1 : o.roughness; }
  dirty();
}
function tileSet(room, style, grout) {   // her tile (null: the plan's, its grout with it), a grout with it
  finWrite(room, style ? Object.assign({ 90: style }, grout ? { 91: grout } : {}) : { 90: null, 91: null }); const q = tileOf(room);
  toast(`${roomName(room)}: ${q ? (q.st[6] === 2 ? `${q.st[1].toLowerCase()} splashback` : `${q.st[1].toLowerCase()} tiles, ${q.g[1].toLowerCase()} grout`) : "the plan's tiles"}`);
}
function tileCard(room) {   // [title, now, buttons, -, the tray]: the tiles, then their grout
  const q = tileOf(room), u = q && roomUps(room).find(x => x.k.startsWith("90="));
  const glass = q && q.st[6] === 2, st = q ? [glass ? q.st[1] : `${q.st[1]}, ${q.g[1].toLowerCase()} grout`, u ? upRange(u.lo, u.hi) : ""].filter(Boolean).join(" · ") : `The plan's: ${TILE_PLAN[room]}`;
  const bs = finButtons(q && ["The plan's", { tileplan: "1" }], "the tiles as planned", room === "kitchen" ? [btn("The units", { actopen: "fin:kitchen:92" })] : room === "bathroom" ? [btn("Taps and mirror", { actopen: "fin:bathroom:95" })] : []);   // N224, N225
  return [`${roomName(room)}: ${room === "kitchen" ? "the splashback" : "the tiles"}`, st, bs, null, `<div class="r3d-fin">${finTray("Tiles", tileStyles(room).map(([k, t, w, h, c]) => finSwatch("tile", k, `${t}, ${w} × ${h} cm`, c, q && q.st[0] === k, t)).join(""), false)}`
    + (q && !glass ? finTray("Grout", TILE_GROUT.map(([k, t, c]) => finSwatch("grout", k, t, c, q.g[0] === k)).join("")) : "") + `</div>`];
}
cardOn("[data-tile],[data-grout],[data-tileplan]", id => /^fin:[a-z0-9_]+:90$/.test(id), (d, id) => { const room = id.split(":")[1];   // N254: the cards' router
  tileSet(room, d.tileplan ? null : d.tile || finGet(room, 90), d.grout || null); });
/* N225 (its second half): the bathroom's taps, filler and shower in a finish of hers (slot 95) and its bath panel (96), from a tap on
   either: the fittings and the panel are their own materials (house/model.py `bfit`, `bpanel`), a finish its colour, metal and shine,
   an oak panel the oak's photo swapped in (as the kitchen's fronts): no new shader. Costed by fit.SOURCES n225fit */
const BATH_FITS = [["black", "Matt black", "#151517", 0, 0.4, [0, 0]], ["chrome", "Chrome", "#e4e6e9", 0.9, 0.08, [145, 210]], ["brass", "Brushed brass", "#b08d57", 0.85, 0.35, [245, 330]],
  ["nickel", "Brushed nickel", "#a9a9a4", 0.85, 0.3, [230, 320]]];   // key, name, colour, metal, shine, £ a basin mixer and a bath shower mixer
const BATH_PANELS = [["white", "White", "#e7e8e6", [0, 0]], ["oakwood", "Oak", "#b8844f", [70, 140]], ["sage", "Sage", "#8b9878", [45, 90]], ["navy", "Deep blue", "#34507f", [45, 90]], ["charcoal", "Charcoal", "#4a4d52", [45, 90]]];
const BATH_FIT_LAB = [80, 150];   // a plumber's half day to swap the taps
const bathOk = (room, k, v) => room === "bathroom" && ((k === 95 && BATH_FITS.some(([q]) => q === v)) || (k === 96 && BATH_PANELS.some(([q]) => q === v)) || (k === 97 && BATH_MIRS.some(([q]) => q === v)));
const bathNow = () => ({ f: finGet("bathroom", 95) || slotPlan(95), p: finGet("bathroom", 96) || slotPlan(96), m: finGet("bathroom", 97) || slotPlan(97) });   // the plan's: 23_finish.js SLOTS
function bathAt(hit) { const m = hit && hit.object && hit.object.material, hk = m && !Array.isArray(m) && (m.userData || {}).hk; return hk === "bfit" || hk === "bpanel" || (hit && hit.object.userData.bmir) ? { room: "bathroom", slot: 95 } : null; }
function bathUps(add) {
  const q = bathNow(), f = BATH_FITS.find(([k]) => k === q.f), p = BATH_PANELS.find(([k]) => k === q.p);
  if (q.f !== "black") add(`95=${q.f}`, `Taps and shower: ${f[1].toLowerCase()}`, [f[5][0] + BATH_FIT_LAB[0], f[5][1] + BATH_FIT_LAB[1]]);
  if (q.p !== "white") add(`96=${q.p}`, `Bath panel: ${p[1].toLowerCase()}`, p[3]);
  const mi = BATH_MIRS.find(([k]) => k === q.m); if (mi) add(`97=${q.m}`, `Mirror: ${mi[1].toLowerCase()}`, mi[7]);
}
function bathApply() {   // the fittings' finish, the panel's colour (oak: its photo)
  if (!HMATS || !FIN.mat3) return; const q = finHeld ? { f: "black", p: "white", m: "oak" } : bathNow(), Fm = HMATS.bfit || FIN.mat3("bfit"), Pm = HMATS.bpanel || FIN.mat3("bpanel");
  if (Fm) { kitSwap(Fm, null); const o = KIT0.get(Fm), f = BATH_FITS.find(([k]) => k === q.f); if (q.f === "black") { Fm.color.copy(o.color); Fm.metalness = o.metalness; Fm.roughness = o.roughness; } else { Fm.color.set(f[2]); Fm.metalness = f[3]; Fm.roughness = f[4]; } }
  if (Pm) { kitSwap(Pm, q.p === "oakwood" ? kitTex("oakwood", "bpanel") : null); const o = KIT0.get(Pm);
    if (q.p === "white") Pm.color.copy(o.color); else if (q.p === "oakwood") Pm.color.set("#ffffff"); else capWhite(Pm.color.set((BATH_PANELS.find(([k]) => k === q.p) || [])[2])); }
  mirApply(q.m); dirty();
}
function bathSet(slot, v) {
  finWrite("bathroom", { [slot]: v }); const q = bathNow();
  toast(`Bathroom: ${slot === 95 ? upNm(BATH_FITS, q.f).toLowerCase() + " taps and shower" : slot === 97 ? (q.m === "oak" ? "the plan's mirror" : upNm(BATH_MIRS, q.m).toLowerCase() + " mirror") : upNm(BATH_PANELS, q.p).toLowerCase() + " bath panel"}`);
}
function bathCard() {   // [title, now, buttons, -, the tray]
  const q = bathNow(), plan = q.f === "black" && q.p === "white" && q.m === "oak", L = roomUps("bathroom").filter(u => /^9[567]=/.test(u.k)), lo = L.reduce((a, u) => a + u.lo, 0), hi = L.reduce((a, u) => a + u.hi, 0);
  const st = plan ? "The plan's: black taps, white panel, oak mirror" : [`${upNm(BATH_FITS, q.f)} taps, ${upNm(BATH_PANELS, q.p).toLowerCase()} panel, ${q.m === "oak" ? "oak" : upNm(BATH_MIRS, q.m).toLowerCase()} mirror`, hi ? upRange(lo, hi) : ""].filter(Boolean).join(" · ");
  const bs = finButtons(!plan && ["The plan's", { bathplan: "1" }], "as planned", [btn("The tiles", { actopen: "fin:bathroom:90" }),
    ...[["bath.toilet", "Toilet"], ["bath.vanity", "Vanity"]].filter(([id]) => typeof swapKind === "function" && swapKind(id)).map(([id, t]) => btn(t, { actopen: "hswap:" + id }))]);   // the bathroom's own suites: its Swap it (08_house_catalogue.js)
  return ["Bathroom: taps, panel, mirror", st, bs, null, `<div class="r3d-fin">${finTray("Taps and shower", BATH_FITS.map(([k, t, c]) => finSwatch("bathf", k, t, c, q.f === k)).join(""))}`
    + finTray("Bath panel", BATH_PANELS.map(([k, t, c]) => finSwatch("bathp", k, t, c, q.p === k)).join(""))
    + finTray("Mirror", [["oak", "Oak, the plan's", 0, 0, 0, 0, "#b8844f"], ...BATH_MIRS].map(r => finSwatch("bathm", r[0], r[1], r[6], q.m === r[0])).join("")) + `</div>`];
}
cardOn("[data-bathf],[data-bathp],[data-bathm],[data-bathplan]", id => id === "fin:bathroom:95", d => {   // N254: the cards' router
  if (d.bathplan) { finWrite("bathroom", { 95: null, 96: null, 97: null }); toast("Bathroom: the plan's taps, panel and mirror"); }
  else if (d.bathf) bathSet(95, d.bathf); else if (d.bathm) bathSet(97, d.bathm); else bathSet(96, d.bathp); });
/* N225 (its rest): the bathroom's mirror hers (slot 97): round, a mirror cabinet, arched in black or brass. The plan's oak frame and its
   light bar folded away (their faces to a point, as the plan's blinds), hers drawn on the wall from the house's own materials (no new
   shader), the bar over its top; the plan's back while held. fit.SOURCES n225mirror */
const BATH_MIRS = [["round", "Round, black", 50, 50, 3, "black", "#1d1d1f", [25, 25]], ["cabinet", "Mirror cabinet", 50, 60, 13, "gloss", "#e7e8e6", [40, 40]],
  ["arch", "Arched, black", 50, 80, 3, "black", "#2a2a2c", [45, 45]], ["brass", "Arched, brass", 50, 80, 3, "brass", "#c9b58a", [50, 50]]];   // key, name, W × H × D cm, its frame's (or body's) material, swatch, £ (IKEA LINDBYN 50, NYSJÖN 50 × 13 × 60; B&Q Aveli 500 × 800)
const MIR_HK = new Set(["oak", "mirror", "black", "led"]), MIR_ORIG = new WeakMap(); let MIR_LAID = [];
function mirBox() { const it = HIT("bath.mirror"); return it ? (typeof pieceBox === "function" ? pieceBox("bath.mirror") : it.b) : null; }
function mirHide(b, on) {   // the plan's frame, glass, bar and strip in the mirror's box: folded to a point (on), or back
  const key = on ? b.map(Math.round).join() : ""; let n = 0;
  houseG.traverse(me => { const hk = me.isMesh && me.material && !Array.isArray(me.material) && (me.material.userData || {}).hk; if (!MIR_HK.has(hk) || me.userData.bmir) return;
    const P = me.geometry.attributes.position, st = MIR_ORIG.get(P); if (st ? st.key === key : !key) return;   // a roomCull twin shares its attribute: once
    const a = st ? st.a : P.array.slice(); MIR_ORIG.set(P, { a, key }); P.array.set(a);
    if (on) { let k = -1; for (let i = 0; i < P.count; i++) { const x = -a[3 * i] / M, y = a[3 * i + 1] / M, z = a[3 * i + 2] / M;
      if (x > b[3] - 6 && x < b[3] + 1 && y > b[1] - 1 && y < b[4] + 4 && z > b[2] - 1 && z < b[5] + 1) { if (k < 0) k = i; P.array.copyWithin(3 * i, 3 * k, 3 * k + 3); } } }
    P.needsUpdate = true; n++; });
  if (n && typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); }
}
function mirGeos(st, b) {   // {material: [geometries]}: her mirror on the wall's face at the plan's middle, its bottom where the plan's was
  const [, , W, H, D] = st, xf = b[3], y0 = b[1], zc = (b[2] + b[5]) / 2, out = {}, put = (mk, g) => (out[mk] = out[mk] || []).push(g);
  const outline = (w, h, u0 = 0, v0 = 0, P = new THREE.Shape()) => { if (st[0] === "round") P.absarc(u0, v0 + w / 2, w / 2, 0, Math.PI * 2, false);
    else if (st[0] === "cabinet") { P.moveTo(u0 - w / 2, v0); P.lineTo(u0 + w / 2, v0); P.lineTo(u0 + w / 2, v0 + h); P.lineTo(u0 - w / 2, v0 + h); P.lineTo(u0 - w / 2, v0); }
    else { P.moveTo(u0 - w / 2, v0); P.lineTo(u0 + w / 2, v0); P.lineTo(u0 + w / 2, v0 + h - w / 2); P.absarc(u0, v0 + h - w / 2, w / 2, 0, Math.PI, false); P.lineTo(u0 - w / 2, v0); }
    return P; };
  const rect = (u0, v0, u1, v1) => { const P = new THREE.Shape(); P.moveTo(u0, v0); P.lineTo(u1, v0); P.lineTo(u1, v1); P.lineTo(u0, v1); P.lineTo(u0, v0); return P; };
  const ext = (mk, P, t0, t1) => {   // a shape on the wall (u along it, v up), out from t0 to t1 cm: into the house's frame, wound back (x is mirrored into the world)
    const g = new THREE.ExtrudeGeometry(P, { depth: t1 - t0, bevelEnabled: false, curveSegments: 24 }), A = g.attributes.position, c = new THREE.Vector3();
    for (let i = 0; i < A.count; i++) { c.copy(v3(xf - t0 - A.getZ(i), y0 + A.getY(i), zc + A.getX(i))); A.setXYZ(i, c.x, c.y, c.z); }
    const L = Object.values(g.attributes); for (let i = 0; i + 2 < A.count; i += 3) for (const a of L) for (let e = 0; e < a.itemSize; e++) { const j = (i + 1) * a.itemSize + e, k = (i + 2) * a.itemSize + e, t = a.array[j]; a.array[j] = a.array[k]; a.array[k] = t; }
    g.deleteAttribute("normal"); g.computeVertexNormals(); g.clearGroups(); put(mk, g); };
  if (st[0] === "cabinet") { ext(st[5], outline(W, H), 0, D); ext("mirror", rect(-W / 2 + 0.6, 0.6, 0.15, H - 0.6), D, D + 0.5); ext("mirror", rect(-0.15, 0.6, W / 2 - 0.6, H - 0.6), D + 0.7, D + 1.2); }   // NYSJÖN: its body, two sliding mirror doors
  else { const f = 2.2, P = outline(W, H); P.holes.push(outline(W - 2 * f, H - 2 * f, 0, f)); ext(st[5], P, 0, D); ext("mirror", outline(W - 2 * f + 0.4, H - 2 * f + 0.4, 0, f - 0.2), 0.6, D - 0.6); }
  const top = H + 1, bw = Math.min(40, W - 6), bd = st[0] === "cabinet" ? D + 1 : 4.6;   // the light bar over its top, its lit strip under
  ext("black", rect(-bw / 2, top, bw / 2, top + 2.5), 0, bd); ext("led", rect(-bw / 2 + 1, top - 0.4, bw / 2 - 1, top), 0.8, bd - 0.8);
  return out;
}
function mirApply(k) {   // her mirror (k: its key, "oak" the plan's) on the bathroom's wall, or the plan's back
  if (!houseG || !R.HOUSE3 || !FIN.mat3) return;
  AFTER_FLOOR.set("bath", bathApply);   // N255: a floor rebuilt (a swap, an edit) drops what's laid on it: laid again
  for (const me of MIR_LAID) { me.parent && me.parent.remove(me); me.geometry.dispose(); } MIR_LAID = [];
  const st = BATH_MIRS.find(([q]) => q === k), b = mirBox(), r = (R.HOUSE3.rooms || {}).bathroom, g = r && HFLOOR[HCFK[String(r[4])]];
  if (!b || !g) return; mirHide(b, !!st); if (!st) return;
  for (const [mk, geos] of Object.entries(mirGeos(st, b))) { const m = FIN.mat3(mk), mg = mergeGeometries(geos); geos.forEach(q => q.dispose()); if (!mg || !m) continue;
    const geo = m.map ? worldUV(mg, mk) : mg; if (m.lightMap && !geo.attributes.uv1) geo.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(geo.attributes.position.count * 2), 2, true));
    const me = new THREE.Mesh(geo, m); me.castShadow = mk !== "led"; me.receiveShadow = true; me.userData.bmir = true; g.add(me); MIR_LAID.push(me); }
}
