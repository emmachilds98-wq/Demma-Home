/* N224: the kitchen's look, the splashback first (Emma, 23 Nov): its splashback (S.fin.kitchen slot 96), the units' fronts' colour (97),
   the handles (98, "style.finish": the plan's bar, a long bar, knob or cup in black, chrome, steel or brass; "none", push to open) and the
   worktop (99). A card each, `fin:kitchen:9n`, so Undo, Hold to compare, Copy and Paste, the look link, saved looks and Send carry them as
   any slot (finClean: kitOk). Drawn as 24_bath.js draws, with the house's own materials and no new shader: a tile by the metro's own maps
   swapped (bathTex), a quartz or concrete top by the worktop's; the fronts and a glass panel in copies of the gloss and the boiler's
   enamel (their programs); the plan's faces lifted or folded away (kitFold, its own originals). Prices: fit.SOURCES n224 */
const KIT = "kitchen";
const KIT_SPLASH = [["paint", "Painted"], ["metro", "White metro"], ["sage", "Sage metro"], ["zellige", "Zellige-look"], ["square", "Square white"],
  ["glass", "White glass", "#eeeeea"], ["smoke", "Grey glass", "#70757a"], ["mint", "Mint glass", "#dbffc8"]];   // the tiles' rows are BATH_TILES' (n225tiles)
const KIT_STYLE = [["plan", "Bar", 2.33, 7], ["bar", "Long bar", 2.67, 8.5], ["knob", "Knob", 3, 3], ["cup", "Cup", 3.5, 3.67], ["none", "None", 4.99, 4.99]];   // £ each
const KIT_HFIN = [["black", "Matt black", "#2a2a2c", "handle_black"], ["chrome", "Chrome", "#d9dbde", "chrome"], ["steel", "Brushed steel", "#b4b7ba", "steel"], ["brass", "Brushed brass", "#c9b58a", "brass"]];
const KIT_TOP = [["oak", "Solid oak", "#b8844f", 471], ["quartz", "White quartz-look", "#e6e4df", 195], ["concrete", "Concrete-look", "#9d9a94", 130]];   // £ a 3 m length
const KIT_WHAT = { 96: "splashback", 97: "fronts", 98: "handles", 99: "worktop" };
const KIT_APP = ["kitchen.fridge", "kitchen.dishwasher", "kitchen.washer", "kitchen.cooker"];
const kitHandle = v => { const [s, f] = String(v || "").split("."); return s === "none" && f === undefined ? ["none", null] : s !== "none" && KIT_STYLE.some(([q]) => q === s) && KIT_HFIN.some(([q]) => q === f) ? [s, f] : null; };
const kitOk = (room, k, v) => room === KIT && typeof v === "string" && (k === 96 ? KIT_SPLASH.some(([q]) => q === v) : k === 97 ? LIV_HEX.test(v) : k === 98 ? !!kitHandle(v) : k === 99 && KIT_TOP.some(([q]) => q === v));
const kitNow = k => !finHeld && kitOk(KIT, k, finGet(KIT, k)) ? finGet(KIT, k) : null;
const kitRow = (L, v) => L.find(([q]) => q === v) || null;
const kitTile = v => BATH_TILES.some(([q]) => q === v);
const kitPad = (b, p = 0.05) => [b[0] - p, b[1] - p, b[2] - p, b[3] + p, b[4] + p, b[5] + p];
const kitRoom = () => ((R.HOUSE3 || {}).rooms || {})[KIT];
function kitBoxes(key) {   // the kitchen's boxes of a material, as built (house cm)
  const r = kitRoom(), L = ((((R.HOUSE3 || {}).floors || {}).lower || {}).boxes || {})[key] || []; if (!r) return [];
  return L.filter(b => { const x = (b[0] + b[3]) / 2, y = (b[1] + b[4]) / 2, z = (b[2] + b[5]) / 2; return x > r[0] && x < r[1] && z > r[2] && z < r[3] && y > r[4] && y < r[4] + 300; });
}
const kitFronts = () => kitBoxes("gloss").filter(b => !KIT_APP.some(id => { const it = HIT(id); return it && bathIn(kitPad(it.b, 1), (b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2); }));   // the units, not the fridge's or dishwasher's
const kitHandles = () => kitBoxes("handle_black").filter(b => b[4] - b[1] >= 9 && Math.min(b[3] - b[0], b[5] - b[2]) < 2);   // the units' bars (not the air fryer's)
const kitArea = () => kitBoxes("metro").reduce((t, b) => { const d = [b[3] - b[0], b[4] - b[1], b[5] - b[2]].sort((p, q) => q - p); return t + d[0] * d[1] / 1e4; }, 0);
let KIT_TOPM = 0;
function kitTopM() {   // metres of 60 cm worktop, the runs' and the bar's tops as laid (their corners once)
  if (KIT_TOPM) return KIT_TOPM; const B = kitBoxes("worktop"); if (!B.length) return 0; let a = 0;
  const x0 = Math.min(...B.map(b => b[0])), x1 = Math.max(...B.map(b => b[3])), z0 = Math.min(...B.map(b => b[2])), z1 = Math.max(...B.map(b => b[5]));
  for (let x = x0 + 1; x < x1; x += 2) for (let z = z0 + 1; z < z1; z += 2) if (B.some(b => x > b[0] && x < b[3] && z > b[2] && z < b[5])) a += 4;
  return (KIT_TOPM = a / 1e4 / 0.6);
}
function kitCost(k, v) {   // [lo, hi] £
  const N = kitHandles().length;
  if (k === 96) { const A = kitArea(), t = kitTile(v) && bathRow(90, v), n = Math.ceil(A / 0.675);
    return t ? [A * (1.1 * t[5] + 20) + 10, A * (1.1 * t[5] + 50) + 11] : v === "paint" ? [25, 250] : [n * 75, n * 100 * 2]; }   // a tiler £20–50 a m²; glass 90 × 75 panels
  if (k === 97) return [Math.max(2, Math.ceil(N / 8)) * 25, N * 80];   // tins yourself, or sprayed
  if (k === 98) { const h = kitHandle(v), s = h && kitRow(KIT_STYLE, h[0]); return s ? [N * s[2], N * s[3]] : [0, 0]; }
  const t = kitRow(KIT_TOP, v), n = Math.ceil(kitTopM() / 3); return t ? [n * t[3], n * t[3] + 350] : [0, 0];
}
function kitSay(k, v) {   // her pick in words
  if (k === 97) return finCap(finName(v));
  if (k === 98) { const h = kitHandle(v); return h[0] === "none" ? "None, push to open" : `${kitRow(KIT_STYLE, h[0])[1]}, ${kitRow(KIT_HFIN, h[1])[1].toLowerCase()}`; }
  return (kitRow(k === 96 ? KIT_SPLASH : KIT_TOP, v) || bathRow(90, v) || [0, v])[1];
}
/* a quartz-look or concrete-look top: drawn over the worktop's own photo's 60 cm (its relief and shine kept) */
const KIT_TOPTEX = {};
function kitTopTex(k) {
  if (KIT_TOPTEX[k]) return KIT_TOPTEX[k];
  const px = LOWD ? 256 : 512; let s = k === "quartz" ? 5 : 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return (KIT_TOPTEX[k] = canvasTex(px, px, (g, w, h) => {
    g.fillStyle = k === "quartz" ? "#e3e1dc" : "#a29f99"; g.fillRect(0, 0, w, h);
    if (k === "concrete") for (let i = 0; i < 140; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 70, c = rnd() > 0.5 ? "255,255,255" : "40,38,35", a = 0.04 + rnd() * 0.05;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);   // soft clouds, wrapped so the 60 cm repeats unseen
        gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); } }
    const C = k === "quartz" ? ["#b8b6b1", "#cdcac4", "#f5f4f1", "#9d9b97"] : ["#7c7974", "#c3c0ba"];
    for (let i = 0; i < (k === "quartz" ? 2600 : 1400); i++) { g.fillStyle = C[i % C.length]; g.globalAlpha = 0.3 + rnd() * 0.5; const r = (k === "quartz" ? 0.6 + rnd() * 1.6 : 1 + rnd()) * px / 512; g.fillRect(rnd() * w, rnd() * h, r, r); }
    g.globalAlpha = 1; }, true));
}
/* a copy of a house material in her colour: its program (its hooks and clipping carried over) */
function kitMat(base, hex, key) {
  const id = `kit_${key}_${hex.slice(1).toLowerCase()}`; if (HMATS[id]) return HMATS[id];
  const g = FIN.mat3(base), m = g.clone(); m.onBeforeCompile = g.onBeforeCompile; m.customProgramCacheKey = g.customProgramCacheKey; m.clippingPlanes = g.clippingPlanes;
  m.color.set(hex); if (!m.map || (houseTex(base) || {}).tint) capWhite(m.color); m.userData.hk = base; MATS.push(m); return (HMATS[id] = m);
}
/* the plan's faces of a material in the kitchen's boxes lifted into another material (a mesh of it) or folded to a point, as bathFold */
const KIT_ORIG = new WeakMap(), KIT_ORIGM = new WeakMap(); let KIT_LAID = [], KIT_FOLD = 0, KIT_WT0 = null;
function kitFold(regs) {   // [key, boxes, material or null, card]
  const g = HFLOOR.lower; if (!g) return 0; let n = 0;
  for (const me of g.children) { const hk = me.isMesh && me.userData.fm && (me.material.userData || {}).hk; if (!hk) continue;
    const P = me.geometry.attributes.position, st = KIT_ORIG.get(P), use = regs.filter(r => r[0] === hk); if (!use.length && !st) continue;
    const a = st || P.array.slice(); if (!st) KIT_ORIG.set(P, a); P.array.set(a); n++;
    const I = me.geometry.index, N = me.geometry.attributes.normal, tri = I ? I.count / 3 : P.count / 3, at = i => [-a[3 * i] / M, a[3 * i + 1] / M, a[3 * i + 2] / M];
    for (const [, B, to, card] of use) { const off = new Set(), pos = [], nor = [];
      for (let t = 0; t < tri; t++) { const v = [0, 1, 2].map(c => I ? I.getX(3 * t + c) : 3 * t + c), p = v.map(at); if (!B.some(b => p.every(q => bathIn(b, ...q)))) continue;
        for (const i of v) { off.add(i); if (to) { pos.push(a[3 * i], a[3 * i + 1], a[3 * i + 2]); nor.push(N.getX(i), N.getY(i), N.getZ(i)); } } }
      if (to && pos.length) { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); kitLay(g, geo, to, card); }
      const k0 = [...off][0]; if (k0 !== undefined) for (const i of off) P.array.copyWithin(3 * i, 3 * k0, 3 * k0 + 3); }
    P.needsUpdate = true; if (!use.length) KIT_ORIG.delete(P); }
  return n;
}
function kitLay(g, geo, m, card) {
  const me = new THREE.Mesh(m.map ? worldUV(geo, m.userData.hk) : geo, m);
  if (BAKE.mats && BAKE.mats.has(m)) geo.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(geo.attributes.position.count * 2), 2, true));
  me.castShadow = me.receiveShadow = true; me.userData.kit = card; g.add(me); KIT_LAID.push(me); return me;
}
/* the new handles where the plan's bars were: a long bar (along a drawer, up a door), a knob, a cup */
function kitHandleGeo(style) {
  const r = kitRoom(), out = [], mid = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2];
  for (const b of kitHandles()) {
    const ax = b[3] - b[0] > b[5] - b[2] ? 0 : 2, al = 2 - ax, c = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2], s = Math.sign(mid[ax / 2] - c[ax]) || 1;
    const f = s > 0 ? b[ax] : b[ax + 3], h = c[1] - r[4], drawer = h > 70 && h < 90, dy = h > 120 ? 4 : 0;   // a wall unit's long bar kept on its door
    const at = (o, u, y) => { const q = [0, 0, 0]; q[ax] = f + s * o; q[al] = c[al] + u; q[1] = c[1] + y; return v3(q[0], q[1], q[2]); };
    const box = (o0, o1, u0, u1, y0, y1, rr) => { const eo = o1 - o0, eu = u1 - u0, ey = y1 - y0, wx = ax === 0 ? eo : eu, wz = ax === 0 ? eu : eo;
      const g = new RoundedBoxGeometry(wx * M, ey * M, wz * M, 2, Math.min(rr, Math.min(wx, ey, wz) / 2.2) * M), p = at((o0 + o1) / 2, (u0 + u1) / 2, (y0 + y1) / 2);
      g.translate(p.x, p.y, p.z); out.push(g.toNonIndexed()); g.dispose(); };
    if (style === "bar") { if (drawer) { box(2.2, 3.4, -8, 8, -0.6, 0.6, 0.6); for (const u of [-6.4, 6.4]) box(0, 2.3, u - 0.5, u + 0.5, -0.5, 0.5, 0.2); }
      else { box(2.2, 3.4, -0.6, 0.6, dy - 8, dy + 8, 0.6); for (const y of [-6.4, 6.4]) box(0, 2.3, -0.5, 0.5, dy + y - 0.5, dy + y + 0.5, 0.2); } }
    else if (style === "cup") { box(0, 2.4, -4.5, 4.5, -1.6, 1.4, 1.2); box(2.3, 2.5, -3.6, 3.6, -1.4, -0.2, 0.1); }   // its shell, the lip under it
    else { const g = new THREE.LatheGeometry([[0, 0], [0.7, 0], [0.7, 1.4], [1.5, 1.9], [1.6, 2.6], [1.3, 3.1], [0, 3.2]].map(([x, y]) => new THREE.Vector2(x * M, y * M)), LOWD ? 10 : 20);
      const d = ax === 0 ? new THREE.Vector3(-s, 0, 0) : new THREE.Vector3(0, 0, s), p = at(0, 0, 0);   // the knob out from the front (house x is the scene's -x)
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)); g.translate(p.x, p.y, p.z); out.push(g.toNonIndexed()); g.dispose(); }
  }
  return out;
}
function kitApply() {   // what's kept, drawn (Hold to compare and As it is: the plan's)
  if (!finSetup() || !FIN.mat3 || !houseG || !HMATS || !HFLOOR.lower || !kitRoom()) return;
  for (const m of KIT_LAID) { m.parent && m.parent.remove(m); m.geometry.dispose(); } KIT_LAID = [];
  const sp = kitNow(96), fr = kitNow(97), hd = kitHandle(kitNow(98)), wt = kitNow(99), regs = [], P = B => B.map(b => kitPad(b));
  const mm = HMATS.metro; if (mm) { if (!KIT_ORIGM.has(mm)) KIT_ORIGM.set(mm, { map: mm.map, nor: mm.normalMap, rough: mm.roughnessMap }); const o = KIT_ORIGM.get(mm), T = sp && kitTile(sp) ? bathTex(sp, "grey", mm) : null;
    mm.map = T ? T.map : o.map; if (o.nor) mm.normalMap = (T && T.nor) || o.nor; if (o.rough) mm.roughnessMap = (T && T.rough) || o.rough; }
  const wm = HMATS.worktop; if (wm) { KIT_WT0 = KIT_WT0 || wm.map; wm.map = wt === "quartz" || wt === "concrete" ? kitTopTex(wt) : KIT_WT0; }
  if (sp === "paint") regs.push(["metro", P(kitBoxes("metro")), null, null]);
  else if (sp && !kitTile(sp)) regs.push(["metro", P(kitBoxes("metro")), kitMat("fitting", kitRow(KIT_SPLASH, sp)[2], "glass"), "fin:kitchen:96"]);
  if (fr) regs.push(["gloss", P(kitFronts()), kitMat("gloss", fr, "front"), "fin:kitchen:97"]);
  if (hd && hd[0] !== "plan") regs.push(["handle_black", P(kitHandles()), null, null]);
  else if (hd && hd[1] !== "black") regs.push(["handle_black", P(kitHandles()), FIN.mat3(kitRow(KIT_HFIN, hd[1])[3]), "fin:kitchen:98"]);
  if (wt === "oak") regs.push(["worktop", P(kitBoxes("worktop")), FIN.mat3("oak"), "fin:kitchen:99"]);
  const n = kitFold(regs);
  if (hd && hd[0] !== "plan" && hd[0] !== "none") { const L = kitHandleGeo(hd[0]), geo = L.length && mergeGeometries(L); L.forEach(q => q.dispose());
    if (geo) kitLay(HFLOOR.lower, geo, FIN.mat3(kitRow(KIT_HFIN, hd[1])[3]), "fin:kitchen:98"); }
  if (n || KIT_FOLD) { KIT_FOLD = n; if (typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); } }
  dirty();
}
/* a tap on the splashback (or the wall where it was), a unit's front, a handle or the worktop: its card (23_finish.js winAt asks) */
function kitAt(o, p) {
  if (o.userData.kit) return o.userData.kit;
  const hk = (o.material && !Array.isArray(o.material) && o.material.userData.hk) || "", r = kitRoom(), g = HFLOOR.lower;
  if (!r || !g || !["metro", "gloss", "worktop", "handle_black", "paint"].includes(hk) || !under(o, g)) return null;
  const q = g.worldToLocal(p.clone()), x = -q.x / M, y = q.y / M, z = q.z / M, inn = B => B.some(b => bathIn(kitPad(b, 2), x, y, z));
  if (x < r[0] || x > r[1] || z < r[2] || z > r[3] || y < r[4] || y > r[4] + 300) return null;
  if (hk === "paint") return finGet(KIT, 96) === "paint" && inn(kitBoxes("metro")) ? "fin:kitchen:96" : null;
  return hk === "metro" ? "fin:kitchen:96" : hk === "worktop" ? "fin:kitchen:99" : hk === "handle_black" ? (inn(kitHandles()) ? "fin:kitchen:98" : null) : inn(kitFronts()) ? "fin:kitchen:97" : null;
}
/* the card: what's on it, one row of swatches (the handles: their shapes, then their finish), The plan's; the kitchen's other cards */
function kitCard(room, k) {
  if (room !== KIT || !KIT_WHAT[k]) return null;
  const v = finGet(room, k), ok = kitOk(room, k, v), cost = ok ? upRange(...kitCost(k, v).map(Math.round)) : "", N = kitHandles().length;
  const plan = { 96: "black metro", 97: "white gloss", 98: "black bars", 99: "black speckled laminate" }[k];
  const t = ok && k === 96 && kitTile(v) && bathRow(90, v), more = !ok ? "" : k === 96 ? (t ? `${t[2]} × ${t[3]} cm` : v === "paint" ? "the walls' colour" : `${Math.ceil(kitArea() / 0.675)} panels 90 × 75`)
    : k === 99 ? `${Math.ceil(kitTopM() / 3)} lengths of 3 m` : `${N} ${k === 97 ? "fronts" : "handles"}`;
  const st = ok ? [kitSay(k, v), more, cost].filter(Boolean).join(" · ") : `The plan's: ${plan}`;
  const bs = [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(ok ? [btn("The plan's", { kit: `${k}:` })] : []),
    btn("Hold to compare", { finhold: "1" }, undefined, "", "Hold to compare: as planned till you let go"),
    ...[96, 97, 98, 99].filter(q => q !== k).map(q => btn(finCap(KIT_WHAT[q]), { actopen: `fin:${KIT}:${q}` })), ...(k === 96 && v === "paint" ? [btn("The walls", { actopen: `fin:${KIT}:2` })] : []), ...finCopyBtns(room)];
  const sw = (a, L, now, col, extra = "") => `<div class="r3d-fintray" role="group" aria-label="${finCap(KIT_WHAT[k])}">${L.map(x => `<button type="button" class="sw" data-kit="${a}:${x[0]}" style="--c:${col(x)}" aria-pressed="${String(now).toLowerCase() === String(x[0]).toLowerCase()}" title="${x[1]}" aria-label="${x[1]}"><i></i><span>${finShort(x[1])}</span></button>`).join("")}${extra}</div>`;
  const wall = [0, 1, 2, 3].map(s => finGet(KIT, s)).find(Boolean) || ((R.HOUSE3.mats || {}).paint || ["#f1ede5"])[0];
  let tray;
  if (k === 96) tray = sw(96, KIT_SPLASH, ok ? v : null, x => x[0] === "paint" ? wall : kitTile(x[0]) ? bathRow(90, x[0])[4] : x[2]);
  else if (k === 97) { const L = [...finSwatches(), ...["#caccba", "#b0af9b", "#132019", "#5371b8"].map(h => finKnown(h)).filter(Boolean)], mine = finMine().filter(h => !L.some(([q]) => q.toLowerCase() === h));
    tray = sw(97, L, ok ? v : null, x => x[0], `<label class="sw any" title="Any colour"><input type="color" data-kitany="1" value="${ok ? v : "#ebeae6"}" aria-label="Any colour"><span>Any</span></label>`
        + `<label class="sw hex" title="A colour's code"><input type="text" data-kithex="1" value="${ok ? v.toUpperCase() : ""}" placeholder="#hex" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="characters" enterkeyhint="done" aria-label="A colour's code, like #DBFFC8"><span>Code</span></label>`)
      + (mine.length ? `<span class="r3d-finlab">Yours</span>${sw(97, mine.map(h => [h, h.toUpperCase()]), ok ? v : null, x => x[0])}` : ""); }
  else if (k === 98) { const h = kitHandle(v) || ["plan", "black"];
    tray = `<div class="r3d-finsc" role="group" aria-label="Handles">${KIT_STYLE.map(([q, n]) => `<button type="button" data-kit="98s:${q}" aria-pressed="${h[0] === q}">${n}</button>`).join("")}</div>`
      + (h[0] === "none" ? "" : sw("98f", KIT_HFIN, h[1], x => x[2])); }
  else tray = sw(99, KIT_TOP, ok ? v : null, x => x[2]);
  return [`${roomName(room)} · ${finCap(KIT_WHAT[k])}`, st, bs, null, `<div class="r3d-fin">${tray}</div>`];
}
function kitSet(k, v) {
  if (k === 98 && v === "plan.black") v = null;
  finPush(); S.fin = S.fin || {}; const o = S.fin[KIT] = S.fin[KIT] || {};
  if (v) o[k] = v; else delete o[k]; if (!Object.keys(o).length) delete S.fin[KIT];
  store.set(KEY, S); kitApply(); finSchDraw();
  toast(`${roomName(KIT)}: ${v ? kitSay(k, v).toLowerCase() : `the plan's ${KIT_WHAT[k]}`}`);
}
if (act) {
  act.addEventListener("click", e => {
    const b = e.target.closest("[data-kit]"); if (!b || !GS.actId || !GS.actId.startsWith(`fin:${KIT}:`)) return;
    e.stopPropagation(); const [a, v] = b.dataset.kit.split(":"), h = kitHandle(finGet(KIT, 98)) || ["plan", "black"];
    if (a === "98s") kitSet(98, v === "none" ? "none" : `${v}.${h[1] || "black"}`);
    else if (a === "98f") kitSet(98, `${h[0] === "none" ? "plan" : h[0]}.${v}`);
    else if (!v || kitOk(KIT, +a, v)) kitSet(+a, v || null);
    renderAct();
  }, true);
  act.addEventListener("change", e => { const t = e.target; if (!(t.dataset.kitany || t.dataset.kithex) || GS.actId !== `fin:${KIT}:97`) return;
    const hex = t.dataset.kithex ? finHex(t.value) : t.value; if (!hex || !LIV_HEX.test(hex)) { toast("A colour's code, like #DBFFC8"); return; } kitSet(97, hex.toLowerCase()); renderAct(); });
  act.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset && e.target.dataset.kithex) { e.preventDefault(); e.target.dispatchEvent(new Event("change", { bubbles: true })); } });
}
/* Changes: each by its length, area or count */
{ const ups0 = roomUps;
  // eslint-disable-next-line no-func-assign
  roomUps = room => { const L = ups0(room); if (room !== KIT) return L; const o = (S.fin || {})[KIT] || {}, D = upDone();
    for (const k of [96, 97, 98, 99]) { if (!kitOk(KIT, k, o[k])) continue; const c = kitCost(k, o[k]), key = `${k}=${o[k]}`;
      L.push({ k: key, t: `${finCap(KIT_WHAT[k])}: ${kitSay(k, o[k])}`, lo: Math.round(c[0]), hi: Math.round(c[1]), done: !!D[KIT + "|" + key] }); }
    return L; }; }
