/* N225: the bathroom's and the WC's own: the tiles (S.fin slot 90) and their grout (91), the WC's toilet (92) and basin (93), the taps'
   and fittings' finish (94), the bath's panel (95). A card each, `fin:<room>:9n` (finCard), so Undo, Hold to compare, Copy, the look link,
   saved looks and Send carry them as any slot (finClean: bathOk). Drawn with the house's own materials, no new shader: the tiles by the
   tiles' material's own maps swapped for drawn ones; the plan's suite folded away (as the plan's blinds, winPlanHide) and the new one
   built in `sanitary`, `gloss` and the taps' metal; the plan's taps and panel lifted into the finish's material. Sizes and prices:
   fit.SOURCES n225tiles, n225suites, n225fittings */
const BATH_ROOMS = { bathroom: "stone", wc: "tile_w" };   // each room's tiles' material (only it uses it)
const BATH_TILES = [["metro", "White metro", 15, 7.5, "#f3f2ed", 23, "bond"], ["square", "Square white", 10, 10, "#f1f0eb", 48, "grid"],
  ["large", "Large white", 60, 30, "#eeede8", 16, "bond"], ["sage", "Sage metro", 15, 7.5, "#a3b496", 21.33, "bond"], ["zellige", "Zellige-look", 10, 10, "#eeeadf", 36.86, "zel"]];   // key, name, W × H cm, colour, £ a m² (n225tiles)
const BATH_GROUT = [["white", "White grout", "#e6e5e0"], ["grey", "Grey grout", "#9a9a96"], ["charcoal", "Charcoal grout", "#47484a"]];
const BATH_LOO = [["portland", "Portland close coupled", 35, 66, 79, 75, "cc"], ["cleve", "Cleveland close coupled", 36.5, 62, 80.5, 150, "cc"],
  ["bliss", "Bliss back to wall", 35, 52, 40, 205, "btw"], ["siena", "Siena wall hung", 36, 52, 42, 353.32, "hung"]];   // W × D × H, £ (the Siena with its Duplo frame)
const BATH_BASIN = [["emma", "Emma pedestal", 42, 32, 85, 309, "ped"], ["galeria", "Galeria semi pedestal", 45, 37, 45, 189, "semi"],
  ["corner", "Newport corner", 45, 46, 16.5, 45, "corner"], ["vanity", "Compact vanity", 40.5, 22.5, 90.5, 97, "van"]];   // W along the wall × D out × H, £
const BATH_TAPS = [["chrome", "Chrome", "#d9dbde", "chrome", 79], ["black", "Matt black", "#2a2a2c", "black", 79], ["brass", "Brushed brass", "#c9b58a", "brass", 75]];   // a Mariz mixer each (n225fittings)
const BATH_PANEL = [["white", "White gloss", "#f1f0ec", "gloss", 32], ["grey", "Grey gloss", "#8e9396", "gloss", 129.99], ["oakfx", "Oak effect", "#b8844f", "oak", 149]];
const BATH_LIST = { 90: BATH_TILES, 91: BATH_GROUT, 92: BATH_LOO, 93: BATH_BASIN, 94: BATH_TAPS, 95: BATH_PANEL };
const BATH_WHAT = { 90: "tiles", 91: "grout", 92: "toilet", 93: "basin", 94: "taps", 95: "bath panel" };
const BATH_METAL = ["chrome", "black", "handle_black"];
const bathOk = (room, k, v) => !!BATH_ROOMS[room] && !!BATH_LIST[k] && (k < 92 || k === 94 || (k === 95 ? room === "bathroom" : room === "wc")) && BATH_LIST[k].some(([q]) => q === v);
const bathRow = (k, v) => (BATH_LIST[k] || []).find(([q]) => q === v) || null;
const bathNow = (room, k) => !finHeld && bathOk(room, k, finGet(room, k)) ? finGet(room, k) : null;
const bathArea = room => { let a = 0; for (const G of Object.values(R.HOUSE3.floors || {})) for (const b of ((G.boxes || {})[BATH_ROOMS[room]] || [])) {
  const d = [b[3] - b[0], b[4] - b[1], b[5] - b[2]].sort((p, q) => q - p); a += d[0] * d[1] / 1e4; } return a; };   // the tiled faces as built, m²
function bathCost(room, k, v) {   // [lo, hi] £
  const r = bathRow(k, v); if (!r) return [0, 0];
  if (k === 90) { const a = bathArea(room), g = finGet(room, 91) ? [10, 11] : [0, 0]; return [a * (1.1 * r[5] + 20) + g[0], a * (1.1 * r[5] + 50) + g[1]]; }   // +10% cuts, a tiler £20–50 a m²
  if (k === 94) return room === "bathroom" ? [r[4], r[4] * 3] : [r[4], r[4]];   // the bathroom's basin, bath and shower (E: three)
  return k === 91 ? [0, 0] : [r[5] ?? r[4], r[5] ?? r[4]];
}
/* the tiles: a 60 cm square drawn as the pattern (map, its relief, its shine), repeated over the material's own photo size */
const BATH_P = 60, BATH_TEX = {}, BATH_ORIGM = new WeakMap();
function bathTex(k, gk, m) {
  const id = `${k}|${gk}|${m.userData.hk}`; if (BATH_TEX[id]) return BATH_TEX[id];
  const [, , tw, th, col, , pat] = bathRow(90, k), gc = (bathRow(91, gk) || BATH_GROUT[1])[2], px = LOWD ? 256 : 512, s = px / BATH_P, gw = Math.max(2, 0.3 * s), bv = Math.max(1, 0.25 * s);
  const tiles = []; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = 0, r = 0; y < BATH_P - 0.01; y += th, r++) { const off = pat === "bond" && r % 2 ? tw / 2 : 0;
    for (let x = -off; x < BATH_P - 0.01; x += tw) tiles.push([x * s, y * s, tw * s, th * s, rnd()]); }
  const each = (g, f) => { for (const [x, y, w, h, q] of tiles) for (const dx of [0, -px, px]) if (x + dx < px && x + dx + w > 0) f(g, x + dx, y, w, h, q); };   // a bond's half tiles wrap
  const rough = v => Math.max(0, Math.min(255, Math.round(v / Math.max(0.05, m.roughness) * 255)));
  const T = { map: canvasTex(px, px, g => { g.fillStyle = gc; g.fillRect(0, 0, px, px);
      each(g, (g, x, y, w, h, q) => { const c = new THREE.Color(col); if (pat === "zel") c.offsetHSL(0, 0, (q - 0.5) * 0.08);
        g.fillStyle = "#" + c.getHexString(); g.fillRect(x + gw / 2, y + gw / 2, w - gw, h - gw);
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(1, "rgba(0,0,0,0.05)"); g.fillStyle = gr; g.fillRect(x + gw / 2, y + gw / 2, w - gw, h - gw);
        if (pat === "zel") { g.fillStyle = `rgba(0,0,0,${0.03 + q * 0.04})`; for (let i = 0; i < 3; i++) g.fillRect(x + w * rnd(), y + h * rnd(), w * 0.2, h * 0.15); } }); }, true) };
  if (m.normalMap) T.nor = canvasTex(px, px, g => { g.fillStyle = "rgb(128,128,255)"; g.fillRect(0, 0, px, px);
    each(g, (g, x, y, w, h) => { const a = x + gw / 2, b = y + gw / 2, W = w - gw, H = h - gw;   // each tile's edge rounded down into the joint
      g.fillStyle = "rgb(70,128,235)"; g.fillRect(a, b, bv, H); g.fillStyle = "rgb(186,128,235)"; g.fillRect(a + W - bv, b, bv, H);
      g.fillStyle = "rgb(128,186,235)"; g.fillRect(a, b, W, bv); g.fillStyle = "rgb(128,70,235)"; g.fillRect(a, b + H - bv, W, bv); }); }, false);
  if (m.roughnessMap) T.rough = canvasTex(px, px, g => { const t = rough(pat === "zel" ? 0.14 : 0.07), j = rough(0.9);
    g.fillStyle = `rgb(${j},${j},${j})`; g.fillRect(0, 0, px, px); g.fillStyle = `rgb(${t},${t},${t})`; each(g, (g, x, y, w, h) => g.fillRect(x + gw / 2, y + gw / 2, w - gw, h - gw)); }, false);
  const sz = (houseTex(m.userData.hk) || { size: [0.6, 0.6] }).size, oy = m.userData.hk === "tile_w" ? 0 : -(((R.HOUSE3.rooms.bathroom || [0, 0, 0, 0, 260])[4] / 100 / (BATH_P / 100)) % 1);   // the bathroom's rows from its floor; the WC's panel from its corner (gridFrom)
  for (const t of Object.values(T)) { t.repeat.set(sz[0] * 100 / BATH_P, sz[1] * 100 / BATH_P); t.offset.set(0, oy); }
  return (BATH_TEX[id] = T);
}
function bathTiles() {
  if (!HMATS) return;
  for (const [room, hk] of Object.entries(BATH_ROOMS)) { const m = HMATS[hk]; if (!m) continue;
    const o = BATH_ORIGM.get(m) || (BATH_ORIGM.set(m, { map: m.map, nor: m.normalMap, rough: m.roughnessMap }), BATH_ORIGM.get(m)), k = bathNow(room, 90);
    const T = k ? bathTex(k, bathNow(room, 91) || "grey", m) : { map: o.map, nor: o.nor, rough: o.rough };
    m.map = T.map; if (o.nor) m.normalMap = T.nor || o.nor; if (o.rough) m.roughnessMap = T.rough || o.rough; }
}
/* the plan's pieces folded away or lifted into another material, region by region: [floor, box (house cm), keys, material or null, test] */
const BATH_ORIG = new WeakMap(); let BATH_LAID = [], BATH_FOLD = 0;
const bathBox = (id, pad = 1, y0, y1) => { const it = HIT(id); if (!it) return null; const b = it.b; return [b[0] - pad, y0 ?? b[1] - pad, b[2] - pad, b[3] + pad, y1 ?? b[4] + pad, b[5] + pad]; };
const bathIn = (b, x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
function bathMat(k) {   // a house material, or the panel's grey: the gloss's own program (its hooks carried over), its colour
  if (k !== "grey") return FIN.mat3(k);
  if (!HMATS.bath_grey) { const g = FIN.mat3("gloss"), m = g.clone(); m.onBeforeCompile = g.onBeforeCompile; m.customProgramCacheKey = g.customProgramCacheKey;
    m.color.set("#8e9396"); m.userData.hk = "gloss"; MATS.push(m); HMATS.bath_grey = m; }
  return HMATS.bath_grey;
}
function bathRegions() {
  const R_ = [], wc = HIT("wc.basin") && HIT("wc.toilet"), loo = bathNow("wc", 92), bas = bathNow("wc", 93), tap = r => bathNow(r, 94), pan = bathNow("bathroom", 95);
  if (wc && loo) R_.push(["lower", bathBox("wc.toilet"), ["primrose", "chrome"], null]);
  if (wc && bas) R_.push(["lower", bathBox("wc.basin", 1, HIT("wc.basin").b[1] - 40), ["primrose", "chrome"], null]);
  if (wc && bas === "corner") R_.push(["lower", [383, -205, -310, 389, -20, -303], ["upvc"], null]);   // the riser up the corner, boxed in behind the basin
  if (wc && tap("wc")) { const m = bathRow(94, tap("wc"))[3];
    if (!bas) R_.push(["lower", bathBox("wc.basin", 1, HIT("wc.basin").b[1] - 40), ["chrome"], m, null, "fin:wc:94"]); if (!loo) R_.push(["lower", bathBox("wc.toilet"), ["chrome"], m, null, "fin:wc:94"]); }
  if (tap("bathroom") && HIT("bath.vanity") && HIT("bath.bath")) { const m = bathRow(94, tap("bathroom"))[3];
    R_.push(["first", bathBox("bath.vanity", 1, HIT("bath.vanity").b[1] + 85), BATH_METAL, m, null, "fin:bathroom:94"], ["first", bathBox("bath.bath"), BATH_METAL, m, null, "fin:bathroom:94"]); }
  if (pan && HIT("bath.bath")) { const b = HIT("bath.bath").b, top = b[1] + 52;   // its open side and its end, under the rim
    R_.push(["first", bathBox("bath.bath", 1, b[1] - 1, top), ["sanitary"], pan === "grey" ? "grey" : bathRow(95, pan)[3], (p, n) => (n[0] > 0.6 && p[0] >= b[3] - 1.5) || (n[2] > 0.6 && p[2] >= b[5] - 1.5), "fin:bathroom:95"]); }
  return R_.filter(r => r[1]);
}
function bathFold(regs) {   // each floor mesh of a key named: as built, then its region's faces lifted (a mesh of the new material) or folded to a point
  let n = 0;
  for (const fk of ["lower", "first"]) { const g = HFLOOR[fk]; if (!g) continue; const mine = regs.filter(r => r[0] === fk);
    for (const me of g.children) { const hk = me.isMesh && me.userData.fm && (me.material.userData || {}).hk; if (!hk) continue;
      const P = me.geometry.attributes.position, st = BATH_ORIG.get(P), use = mine.filter(r => r[2].includes(hk)); if (!use.length && !st) continue;
      const a = st || P.array.slice(); if (!st) BATH_ORIG.set(P, a); P.array.set(a); n++;
      const I = me.geometry.index, N = me.geometry.attributes.normal, tri = I ? I.count / 3 : P.count / 3, at = i => [-a[3 * i] / M, a[3 * i + 1] / M, a[3 * i + 2] / M];
      for (const [, b, , to, test, card] of use) { const off = new Set(), pos = [], nor = [];
        for (let t = 0; t < tri; t++) { const v = [0, 1, 2].map(c => I ? I.getX(3 * t + c) : 3 * t + c), p = v.map(at); if (!p.every(q => bathIn(b, ...q))) continue;
          if (test) { const nn = [0, 1, 2].map(c => v.reduce((s, i) => s + (c === 0 ? -N.getX(i) : c === 1 ? N.getY(i) : N.getZ(i)), 0) / 3), lo = [0, 1, 2].map(c => Math.min(...p.map(q => q[c])));
            if (!test(lo, nn)) continue; }
          for (const i of v) { off.add(i); if (to) { pos.push(a[3 * i], a[3 * i + 1], a[3 * i + 2]); nor.push(N.getX(i), N.getY(i), N.getZ(i)); } } }
        if (!to) for (let i = 0; i < P.count; i++) { const q = at(i); if (bathIn(b, ...q)) off.add(i); }
        if (to && pos.length) { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
          geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); bathLay(g, geo, to, card); }
        const k0 = [...off][0]; if (k0 !== undefined) for (const i of off) P.array.copyWithin(3 * i, 3 * k0, 3 * k0 + 3); }
      P.needsUpdate = true; if (!use.length) BATH_ORIG.delete(P); } }
  return n;
}
function bathLay(g, geo, k, card) {   // a mesh of the house's material k on floor group g (tapped: its card)
  const m = bathMat(k), me = new THREE.Mesh(m.map ? worldUV(geo, m.userData.hk) : geo, m);
  if (BAKE.mats && BAKE.mats.has(m)) geo.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(geo.attributes.position.count * 2), 2, true));
  me.castShadow = me.receiveShadow = true; me.userData.bath = card; g.add(me); BATH_LAID.push(me); return me;
}
/* the WC's new suite, built in house cm on its back wall (the toilet) and its east wall (the basin), from the plan's places */
const BATH_PAN = [[0, 0], [8, 0], [9, 3], [8.5, 14], [10.5, 24], [14, 33], [16, 39], [16, 41], [14.5, 41.5], [12.5, 39], [6, 27], [0, 25]];   // house/model.py PAN, SEAT, BOWL
const BATH_SEAT = [[11.5, 0], [16, 0], [16.8, 1.2], [16, 2.6], [11.5, 2.6], [11, 1.3], [11.5, 0]];
const BATH_BOWL = [[0, 0], [4, 0], [5, 1.5], [13, 12], [16, 15], [16, 16], [14.5, 16], [12, 13], [4, 3.5], [0, 3.5]];
function bathGeo() {
  const P = { loo: {}, bas: {} }; let L = P.loo; const put = (k, g) => { (L[k] = L[k] || []).push(g.index ? g.toNonIndexed() : g); if (g.index) g.dispose(); };
  const box = (k, x0, y0, z0, x1, y1, z1, r = 1) => { const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const q = new RoundedBoxGeometry(w * M, h * M, d * M, 2, Math.min(r, Math.min(w, h, d) / 2.2) * M), c = v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); q.translate(c.x, c.y, c.z); put(k, q); };
  const lathe = (k, cx, y0, cz, prof, sx, sz, hy = 1) => { const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r * M, h * hy * M)), LOWD ? 12 : 28);
    g.scale(sx, 1, sz); const c = v3(cx, y0, cz); g.translate(c.x, c.y, c.z); put(k, g); };
  const metal = (room, plan) => bathRow(94, bathNow(room, 94) || plan)[3];
  const mixer = (x, y, z, along) => { const k = metal("wc", "chrome");   // a mono mixer: its body, spout out from the wall, lever on top
    lathe(k, x, y, z, [[0, 0], [2.4, 0], [1.8, 1], [1.5, 13], [0, 13]], 1, 1); box(k, x, y + 11.5, z - 1, x + (along ? 0 : 9), y + 13.5, z + 1 + (along ? 9 : 0), 0.8); box(k, x - 1, y + 13, z - 0.6, x + 4, y + 14, z + 0.6, 0.4); };
  const loo = bathRow(92, bathNow("wc", 92)), bas = bathRow(93, bathNow("wc", 93)), y = (R.HOUSE3.rooms.wc || [0, 0, 0, 0, -260])[4], out = { P, boxes: {} };
  if (loo) { const [, , W, D, H, , kind] = loo, t = HIT("wc.toilet").b, tx = (t[0] + t[3]) / 2, zb = t[2], hw = W / 2, seat = kind === "hung" ? 42 : 40;
    const back = kind === "cc" ? 13 : 20, pz0 = zb + back, pd = kind === "cc" ? D - back : D, cz = pz0 + pd / 2, sx = (hw - 1) / 16, sz = pd / 2 / 16;
    if (kind === "cc") { box("sanitary", tx - hw, y + 40, zb, tx + hw, y + H - 3, zb + 17, kind === "cc" && loo[0] === "cleve" ? 1 : 3);   // its cistern, the lid over it, the button
      box("sanitary", tx - hw - 0.5, y + H - 3, zb - 0.3, tx + hw + 0.5, y + H, zb + 18, 1.2); lathe(metal("wc", "chrome"), tx, y + H, zb + 9, [[0, 0], [2.2, 0], [2.2, 0.6], [0, 0.6]], 1, 1); }
    else { const uw = kind === "hung" ? 30 : 25, uh = kind === "hung" ? 84 : 82;   // the boxed frame or the unit it backs on, its flush plate
      box("gloss", tx - uw, y, zb, tx + uw, y + uh, zb + 20, 0.8); box(metal("wc", "chrome"), tx - 8, y + uh - 22, zb + 20, tx + 8, y + uh - 6, zb + 20.6, 0.3); }
    const py = kind === "hung" ? y + 17 : y, ph = seat - (kind === "hung" ? 17 : 0);
    lathe("sanitary", tx, py, cz, BATH_PAN, sx, sz, ph / 41.5); box("sanitary", tx - hw + 3, py, pz0, tx + hw - 3, py + ph - 1, cz, 3);   // the pan, its back to the wall or the cistern
    lathe("sanitary", tx, y + seat, cz, BATH_SEAT, (hw - 0.5) / 16, sz);
    out.boxes.loo = [tx - hw, y, zb, tx + hw, y + Math.max(H, seat + 3), zb + (kind === "cc" ? D : back + D)]; }
  L = P.bas;
  if (bas) { const [, , W, D, H, , kind] = bas, pb = HIT("wc.basin").b, xe = pb[0], bc = (pb[2] + pb[5]) / 2, rim = y + (kind === "ped" || kind === "semi" ? 85 : kind === "van" ? H : 80);
    if (kind === "corner") { const zb = (HIT("wc.toilet") || { b: [0, 0, pb[2] - 66] }).b[2], c = 17;   // in the back corner, its deck along both walls
      lathe("sanitary", xe + c, rim - 16, zb + c, BATH_BOWL, c / 16, c / 16); box("sanitary", xe, rim - 6, zb, xe + 32, rim, zb + 8); box("sanitary", xe, rim - 6, zb, xe + 8, rim, zb + 32);
      mixer(xe + 5, rim, zb + 5, false); out.boxes.bas = [xe, rim - H, zb, xe + 34, rim + 14, zb + 34]; }
    else { const hw = W / 2, cx = xe + D / 2;
      if (kind === "van") { box("gloss", xe, y, bc - hw, xe + D - 1, y + H - 12, bc + hw, 0.8); box("gloss", xe + D - 1.8, y + 10, bc - hw + 0.3, xe + D, y + H - 12.3, bc + hw - 0.3, 0.6);   // the cabinet, its door, the basin on it
        box("sanitary", xe, y + H - 12, bc - hw - 0.5, xe + D + 0.5, y + H, bc + hw + 0.5, 2); lathe("sanitary", cx + 1, y + H - 9.6, bc, BATH_BOWL, (D / 2 - 4) / 16, (hw - 5) / 16, 0.6);
        box(metal("wc", "chrome"), xe + D, y + 50, bc - 6, xe + D + 2.5, y + 51.5, bc + 6, 0.5); }
      else { lathe("sanitary", cx, rim - 16, bc, BATH_BOWL, D / 2 / 16, hw / 16); box("sanitary", xe, rim - 6, bc - hw * 0.8, xe + 9, rim, bc + hw * 0.8, 2);   // the bowl, its deck for the tap
        if (kind === "ped") lathe("sanitary", xe + 13, y, bc, [[0, 0], [10, 0], [9.5, 1.5], [7, 8], [6, 55], [7.5, 64], [10, rim - y - 16], [0, rim - y - 16]], 0.9, 1.1);   // the pedestal to the floor
        else lathe("sanitary", xe + 12, rim - H, bc, [[0, 0], [8, 0], [9, 18], [11, H - 16], [0, H - 16]], 1, 1.2); }   // the half pedestal (the trap behind it)
      mixer(xe + 5, rim, bc, false); out.boxes.bas = [xe, kind === "ped" || kind === "van" ? y : rim - H, bc - hw, xe + D, rim + 14, bc + hw]; } }
  return out;
}
function bathApply() {   // what's kept, drawn (Hold to compare and As it is: the plan's)
  if (!finSetup() || !FIN.mat3 || !houseG || !HMATS) return;
  for (const m of BATH_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } BATH_LAID = [];
  bathTiles();
  const n = bathFold(bathRegions());
  const g = HFLOOR.lower;
  if (g) for (const [pc, L] of Object.entries(bathGeo().P)) for (const [k, geos] of Object.entries(L)) { const geo = mergeGeometries(geos); geos.forEach(q => q.dispose());
    if (geo) bathLay(g, geo, k, pc === "loo" ? "fin:wc:92" : "fin:wc:93"); }
  if (n || BATH_FOLD) { BATH_FOLD = n; if (typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); } }
  dirty();
}
/* a tap: the tiles, the WC's suite, a tap or the shower, the bath's panel: its card (23_finish.js winAt asks first) */
function bathAt(o, p) {
  if (o.userData.bath) return o.userData.bath;
  const hk = (o.material && !Array.isArray(o.material) && o.material.userData.hk) || "";
  for (const [room, k] of Object.entries(BATH_ROOMS)) if (hk === k) return `fin:${room}:90`;
  const fk = ["lower", "first"].find(f => HFLOOR[f] && under(o, HFLOOR[f])); if (!fk || !HIT("wc.toilet") || !HIT("bath.bath")) return null;
  const q = HFLOOR[fk].worldToLocal(p.clone()), x = -q.x / M, y = q.y / M, z = q.z / M, inn = (id, y0) => { const b = bathBox(id, 2, y0); return b && bathIn(b, x, y, z); };
  if (fk === "lower") return inn("wc.toilet") && ["primrose", "chrome"].includes(hk) ? "fin:wc:92" : inn("wc.basin", HIT("wc.basin").b[1] - 40) && ["primrose", "chrome"].includes(hk) ? "fin:wc:93" : null;
  if (BATH_METAL.includes(hk) && (inn("bath.vanity", HIT("bath.vanity").b[1] + 85) || inn("bath.bath"))) return "fin:bathroom:94";
  return hk === "sanitary" && inn("bath.bath") && y < HIT("bath.bath").b[1] + 52 && x > HIT("bath.bath").b[3] - 3 ? "fin:bathroom:95" : null;
}
/* the card: the room and what's on it, a row of swatches (a toilet's or basin's names), The plan's; the WC's its other pieces */
function bathCard(room, k) {
  if (!BATH_ROOMS[room] || !BATH_LIST[k] || (k === 95 && room !== "bathroom") || ((k === 92 || k === 93) && room !== "wc")) return null;
  if (k === 91) k = 90;
  const v = finGet(room, k), r = bathOk(room, k, v) ? bathRow(k, v) : null, u = r && roomUps(room).find(q => q.k === `${k}=${v}`), cost = u ? upRange(u.lo, u.hi) : "";
  const plan = { 90: room === "wc" ? "White 15 × 15" : "Stone-effect 60 × 30", 92: "Primrose, low level", 93: "Primrose, wall hung", 94: room === "wc" ? "Chrome" : "Black and chrome", 95: "White" }[k];
  let st = r ? [k === 90 ? `${r[2]} × ${r[3]} cm, ${(bathRow(91, finGet(room, 91)) || BATH_GROUT[1])[1].toLowerCase()}` : "", cost].filter(Boolean).join(" · ") : `The plan's: ${plan.toLowerCase()}`;
  if (r && (k === 92 || k === 93)) { const b = bathGeo().boxes[k === 92 ? "loo" : "bas"], why = b ? roomWhy(b, "wc", k === 92 ? "wc.toilet" : "wc.basin") : [];
    st = [`${r[2]} × ${r[3]} × ${r[4]} cm`, why.length ? why[0] : "Fits", cost, "Wickes"].join(" · "); }
  const bs = [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(r ? [btn("The plan's", { bath: `${k}:` })] : []),
    btn("Hold to compare", { finhold: "1" }, undefined, "", "Hold to compare: as planned till you let go"),
    ...[[90, "Tiles"], [92, "Toilet"], [93, "Basin"], [94, "Taps"], [95, "Bath panel"]].filter(([q]) => q !== k && bathCard.has(room, q)).map(([q, t]) => btn(t, { actopen: `fin:${room}:${q}` })), ...finCopyBtns(room)];
  const sw = (q, L, now) => `<div class="r3d-fintray" role="group" aria-label="${finCap(BATH_WHAT[q])}">${L.map(x => `<button type="button" class="sw" data-bath="${q}:${x[0]}" style="--c:${q === 90 ? x[4] : q === 91 ? x[2] : q === 94 || q === 95 ? x[2] : "#f1f1ee"}" aria-pressed="${now === x[0]}" title="${x[1]}" aria-label="${x[1]}"><i></i><span>${q === 91 ? x[1].replace(/ grout$/, "") : x[1]}</span></button>`).join("")}</div>`;
  const tray = `<div class="r3d-fin">${sw(k, BATH_LIST[k], r ? v : null)}${k === 90 && r ? `<span class="r3d-finlab">Grout</span>${sw(91, BATH_GROUT, finGet(room, 91) || "grey")}` : ""}</div>`;
  return [`${roomName(room)} · ${finCap(BATH_WHAT[k])}`, r ? `${r[1]} · ${st}` : st, bs, null, tray];
}
bathCard.has = (room, k) => k === 90 || k === 94 || (k === 95 ? room === "bathroom" : (k === 92 || k === 93) && room === "wc");
function bathSet(room, k, v) {
  finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
  if (v) { o[k] = v; if (k === 90 && !o[91]) o[91] = "grey"; } else { delete o[k]; if (k === 90) delete o[91]; }
  if (!Object.keys(o).length) delete S.fin[room];
  store.set(KEY, S); bathApply(); finSchDraw();
  const r = bathRow(k, v); toast(`${roomName(room)}: ${r ? r[1].toLowerCase() : `the plan's ${BATH_WHAT[k]}`}`);
}
if (act) act.addEventListener("click", e => {
  const b = e.target.closest("[data-bath]"); if (!b || !GS.actId || !GS.actId.startsWith("fin:")) return;
  e.stopPropagation(); const [k, v] = b.dataset.bath.split(":"), room = GS.actId.split(":")[1];
  if (bathOk(room, +k, v) || !v) bathSet(room, +k, v || null); renderAct();
}, true);
/* Changes: each one by its area or its price */
{ const ups0 = roomUps;
  // eslint-disable-next-line no-func-assign
  roomUps = room => { const L = ups0(room); if (!BATH_ROOMS[room]) return L; const o = (S.fin || {})[room] || {}, D = upDone();
    for (const k of [90, 92, 93, 94, 95]) { const r = bathOk(room, k, o[k]) && bathRow(k, o[k]); if (!r) continue;
      const c = bathCost(room, k, o[k]), key = `${k}=${o[k]}${k === 90 ? "." + (o[91] || "") : ""}`;
      L.push({ k: key, t: `${finCap(BATH_WHAT[k])}: ${r[1]}${k === 90 ? `, ${(bathArea(room) * 1.1).toFixed(1)} m²` : ""}`, lo: Math.round(c[0]), hi: Math.round(c[1]), done: !!D[room + "|" + key] }); }
    return L; }; }
