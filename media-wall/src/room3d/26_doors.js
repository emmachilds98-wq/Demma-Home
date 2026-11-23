/* N226: each door its own, or every door from any door's card (All doors): its leaf (the plan's cottage boards, four-panel, shaker,
   flush, half-glazed; the office's bifold its fields) and its handle (a lever on a rose or a knob; chrome, matt black or brass), kept in
   S.fin.doors as "leaf.handle": slot 70 every door, 71 + its number in DOOR_IDS one door (finClean: doorOk), so Undo, Hold to compare,
   the look link, saved looks and Send carry them. Drawn on the door's own part in the house's materials (its leaf's, the gaps', glass,
   chrome, black, brass), no new shader; the plan's boards, levers and hinges hidden under hers. Prices: fit.SOURCES n226doors */
const DOOR_IDS = ["wc_door", "bath_door", "bed2_door", "master_door", "bed3_door"];
const DOOR_LEAVES = [["plan", "Cottage", 32, 32], ["panel", "Four-panel", 34, 44], ["shaker", "Shaker", 120, 120], ["flush", "Flush", 35, 35], ["glazed", "Half-glazed", 112, 112]];   // key, name, £ a leaf (Wickes)
const DOOR_HANDS = [["l", "Lever"], ["k", "Knob"]];
const DOOR_FINS = [["chrome", "Chrome", "#d9dbde"], ["black", "Matt black", "#2a2a2c"], ["brass", "Brass", "#c9b58a"]];
const DOOR_HP = { lchrome: [12, 12], lblack: [12, 12], lbrass: [15, 25], kchrome: [16, 16], kblack: [15, 15], kbrass: [16, 16] };   // a pair, £
const DOOR_FOLDP = [92, 155], DOOR_HANG = [60, 120];   // a bifold leaf (Wickes Chester to Marlow); hanging a new leaf (E)
let DOOR_SC = null;   // the door whose card is set to All doors
function doorOk(k, v) { return k >= 70 && k <= 75 && /^(plan|cottage|panel|shaker|flush|glazed)\.[lk](chrome|black|brass)$/.test(v || ""); }
const doorFold = id => !!((HPARTS["door." + id] || {}).kids || []).length || id === "bed3_door";
const doorPlan = id => doorFold(id) ? "plan.kchrome" : "plan.lchrome";
const doorSpec = id => { const o = (S.fin || {}).doors || {}, i = DOOR_IDS.indexOf(id); return i < 0 ? null : o[71 + i] || o[70] || null; };
const doorLeafPlan = (id, l) => l === "plan" || (l === "cottage" && !doorFold(id));
const doorIsPlan = (id, v) => { const [l, h] = String(v).split("."); return doorLeafPlan(id, l) && h === doorPlan(id).split(".")[1]; };
function doorSay(id, v) {
  const [l, h] = String(v || doorPlan(id)).split("."), fin = (DOOR_FINS.find(([k]) => k === h.slice(1)) || [0, h])[1].toLowerCase();
  return `${l === "plan" && doorFold(id) ? "the plan's fields" : l === "plan" || l === "cottage" ? "cottage boards" : upNm(DOOR_LEAVES, l).toLowerCase()}, ${fin} ${h[0] === "k" ? "knob" : "lever"}`;
}
function doorCost(id, v) {
  if (!v || doorIsPlan(id, v)) return [0, 0]; const [l, h] = v.split("."), c = [0, 0], add = p => { c[0] += p[0]; c[1] += p[1]; };
  if (!doorLeafPlan(id, l)) { add(doorFold(id) ? DOOR_FOLDP : (DOOR_LEAVES.find(([k]) => k === l) || [0, 0, 32, 32]).slice(2)); add(DOOR_HANG); }
  if (h !== doorPlan(id).split(".")[1]) add(DOOR_HP[h] || [12, 25]);
  return c;
}
/* the leaf in its part's own frame: u along it from the hinge, v up it, w across it from its middle (cm) */
function doorFrame(g) {
  const ms = g.children.filter(c => c.isMesh && !c.userData.dr), hk = c => c.material && c.material.userData.hk, L = ms.find(c => hk(c) === "door_leaf"); if (!L) return null;
  L.geometry.computeBoundingBox(); const b = L.geometry.boundingBox, A = b.max.x - b.min.x > b.max.z - b.min.z ? "x" : "z", T = A === "x" ? "z" : "x", near = Math.abs(b.min[A]) < Math.abs(b.max[A]);
  return { L, gap: ms.filter(c => hk(c) === "gap"), ch: ms.filter(c => hk(c) === "chrome"), A, T, h0: near ? b.min[A] : b.max[A], dir: near ? 1 : -1, y0: b.min.y, tc: (b.min[T] + b.max[T]) / 2,
    W: (b.max[A] - b.min[A]) / M, H: (b.max.y - b.min.y) / M, TH: (b.max[T] - b.min[T]) / M };
}
const doorAt = (F, u, v, w) => ({ [F.A]: F.h0 + F.dir * u * M, y: F.y0 + v * M, [F.T]: F.tc + w * M });
function dbox(L, F, ua, ub, va, vb, wa, wb) {
  const s = { [F.A]: Math.abs(ub - ua) * M, y: Math.abs(vb - va) * M, [F.T]: Math.abs(wb - wa) * M }, c = doorAt(F, (ua + ub) / 2, (va + vb) / 2, (wa + wb) / 2);
  const g = new THREE.BoxGeometry(s.x, s.y, s.z); g.translate(c.x, c.y, c.z); L.push(g);
}
function drod(L, F, u, v, wa, wb, r, ball) {   // a round across the leaf (a rose, a neck), or a knob's ball
  const g = ball ? new THREE.SphereGeometry(r * M, 16, 12) : new THREE.CylinderGeometry(r * M, r * M, Math.abs(wb - wa) * M, 16), c = doorAt(F, u, v, (wa + wb) / 2);
  if (ball) g.scale(F.T === "x" ? 0.8 : 1, 1, F.T === "z" ? 0.8 : 1); else if (F.T === "z") g.rotateX(Math.PI / 2); else g.rotateZ(Math.PI / 2);
  g.translate(c.x, c.y, c.z); L.push(g);
}
const dring = (L, F, u0, u1, v0, v1, d, wa, wb) => { dbox(L, F, u0, u0 + d, v0, v1, wa, wb); dbox(L, F, u1 - d, u1, v0, v1, wa, wb); dbox(L, F, u0 + d, u1 - d, v0, v0 + d, wa, wb); dbox(L, F, u0 + d, u1 - d, v1 - d, v1, wa, wb); };
function doorLeafGeos(F, leaf, o) {   // o: { leaf, gap, glass } lists
  const { W, H } = F, t = F.TH / 2, p = Math.max(0.3, t - 0.6), S2 = [-1, 1];
  if (leaf === "flush") return;   // the plain leaf
  if (leaf === "cottage") { const n = Math.max(2, Math.round(W / 12.5)); for (let k = 1; k < n; k++) for (const s of S2) dbox(o.gap, F, W * k / n - 0.3, W * k / n + 0.3, 1, H - 1.3, s * t, s * (t + 0.3)); return; }
  const sw = Math.min(11, W * 0.15), br = Math.min(20, H * 0.1), tr = Math.min(11, H * 0.06), mid = leaf !== "shaker", mun = mid && W > 55;
  const rows = mid ? [[br, 90], [106, H - tr]] : [[br, H - tr]], cols = mun ? [[sw, W / 2 - 5], [W / 2 + 5, W - sw]] : [[sw, W - sw]];
  dbox(o.leaf, F, 0, sw, 0, H, -t, t); dbox(o.leaf, F, W - sw, W, 0, H, -t, t);   // the stiles, the rails, the muntin
  for (const [a, b] of [[0, br], [H - tr, H], ...(mid ? [[90, 106]] : [])]) dbox(o.leaf, F, sw, W - sw, a, b, -t, t);
  if (mun) for (const [a, b] of rows) dbox(o.leaf, F, W / 2 - 5, W / 2 + 5, a, b, -t, t);
  rows.forEach(([v0, v1], ri) => cols.forEach(([u0, u1]) => {
    if (leaf === "glazed" && ri === rows.length - 1) { dbox(o.glass, F, u0, u1, v0, v1, -0.3, 0.3); for (const s of S2) dring(o.leaf, F, u0, u1, v0, v1, 1.4, s * 0.3, s * 1.1); return; }
    dbox(o.leaf, F, u0, u1, v0, v1, -p, p);   // the panel, in from each face
    for (const s of S2) if (leaf === "shaker") dring(o.gap, F, u0, u1, v0, v1, 0.4, s * p, s * (p + 0.05)); else { dring(o.leaf, F, u0, u1, v0, v1, 1.2, s * p, s * (t - 0.25)); dring(o.gap, F, u0 + 1.2, u1 - 1.2, v0 + 1.2, v1 - 1.2, 0.3, s * p, s * (p + 0.05)); }
  }));
}
function doorHandGeos(F, h, fold, L) {   // the handle each face at the latch edge (V1.22's lever), the hinges (V1.25's three) on a hung door
  const t = F.TH / 2, lat = F.W - (fold ? 3.5 : 7), v = fold ? 98.5 : 100.5;
  for (const s of [-1, 1]) { const w = q => s * (t + q);
    if (h === "l") { drod(L, F, lat, v, w(0), w(0.8), 2.6); dbox(L, F, lat - 0.7, lat + 0.7, v - 0.7, v + 0.7, w(0.8), w(4.2)); dbox(L, F, lat - 12.8, lat + 0.8, v - 0.9, v + 0.9, w(4.2), w(5.8)); }
    else { drod(L, F, lat, v, w(0), w(0.8), 2.9); drod(L, F, lat, v, w(0.8), w(2.8), 0.9); drod(L, F, lat, v, w(4.6), w(4.6), 2.6, true); } }
  if (!fold) for (const y of [18, 93, 168]) dbox(L, F, -0.2, 1, y - 0.5, y + 7.1, -(t + 0.4), t + 0.4);
}
function doorLay(g, geos, m, id) {
  if (!geos.length) return; const geo = mergeGeometries(geos); geos.forEach(q => q.dispose()); if (!geo) return;
  const me = new THREE.Mesh(worldUV(geo, m.userData.hk), m); me.castShadow = !m.transparent; me.receiveShadow = true; me.userData.dr = 1; me.userData.door = id; g.add(me);
}
function doorApply() {   // what's kept, drawn on each door (Hold to compare and As it is: the plan's)
  if (!houseG || !FIN.mat3) return; let n = 0;
  for (const id of DOOR_IDS) { const P = HPARTS["door." + id]; if (!P) continue;
    const v = finHeld ? null : doorSpec(id), key = v && !doorIsPlan(id, v) ? v : ""; if ((P.g.userData.dk || "") === key) continue; P.g.userData.dk = key; n++;
    const fold = doorFold(id), [leaf, hand] = (key || doorPlan(id)).split("."), pl = doorLeafPlan(id, leaf), ph = hand === doorPlan(id).split(".")[1];
    [[P.g, true], ...(P.kids || []).map(K => [K.g, false])].forEach(([g, top]) => {
      for (const c of [...g.children]) if (c.userData.dr) { g.remove(c); c.geometry.dispose(); }
      const F = doorFrame(g); if (!F) return;
      F.L.visible = pl || leaf === "flush" || leaf === "cottage"; F.gap.forEach(c => { c.visible = pl; }); if (top) F.ch.forEach(c => { c.visible = ph; });
      const o = { leaf: [], gap: [], glass: [], metal: [] }; if (!pl) doorLeafGeos(F, leaf, o); if (top && !ph) doorHandGeos(F, hand[0], fold, o.metal);
      doorLay(g, o.leaf, F.L.material, id); doorLay(g, o.gap, FIN.mat3("gap"), id); doorLay(g, o.glass, FIN.mat3("glass"), id); doorLay(g, o.metal, FIN.mat3(hand.slice(1)), id); });
    if (RDOORS) for (const r of RDOORS.list) if (r[0] === "door." + id) r[3] = leaf === "glazed";   // the room behind seen through its glass
  }
  if (n) { if (typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); } dirty(); }
}
{ const b0 = bathApply;   // drawn whenever the finishes are (finFloorApply, a floor rebuilt, Hold to compare)
  // eslint-disable-next-line no-func-assign
  bathApply = (...a) => { const r = b0(...a); doorApply(); return r; }; }
/* the card: the door's own (or All doors), its leaf, its handle, the handle's finish; The plan's, Undo, Hold to compare, the room's changes */
function doorCard(k, c) {
  const id = k.slice(5), it = HIT(id); if (!DOOR_IDS.includes(id) || !c) return c;
  const all = DOOR_SC === id, o = (S.fin || {}).doors || {}, v = all ? o[70] || doorSpec(id) : doorSpec(id), [l, h] = (v || doorPlan(id)).split("."), cost = upRange(...doorCost(id, v).map(Math.round));
  c[1] = [c[1], finCap(doorSay(id, v)), all ? "all doors" : cost].filter(Boolean).join(" · ");
  c[2].push(...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...((all ? Object.keys(o).length : v && !doorIsPlan(id, v)) ? [btn("The plan's", { dplan: "1" })] : []),
    btn("Hold to compare", { finhold: "1" }, undefined, "", "Hold to compare: the doors as planned till you let go"), ...(it ? upsBtn(it.r) : []));
  const ch = (k2, L, now, lab) => `<div class="r3d-finsc" role="group" aria-label="${lab}">${L.map(([q, t]) => `<button type="button" data-${k2}="${q}" aria-pressed="${now === q}">${t}</button>`).join("")}</div>`;
  const leaves = doorFold(id) ? [["plan", "Fields"], ["cottage", "Cottage"], ...DOOR_LEAVES.slice(1)] : DOOR_LEAVES;
  c[3] = null; c[4] = `<div class="r3d-fin">${ch("dscope", [["one", "This door"], ["all", "All doors"]], all ? "all" : "one", "Which doors")}`
    + `<span class="r3d-finlab">Door</span>${ch("dleaf", leaves, doorFold(id) || l !== "cottage" ? l : "plan", "The door")}<span class="r3d-finlab">Handle</span>${ch("dhand", DOOR_HANDS, h[0], "Handle")}`
    + `<div class="r3d-fintray" role="group" aria-label="Finish">${DOOR_FINS.map(([q, t, hx]) => `<button type="button" class="sw" data-dfin="${q}" style="--c:${hx}" aria-pressed="${h.slice(1) === q}" title="${t}" aria-label="${t}"><i></i><span>${t}</span></button>`).join("")}</div></div>`;
  return c;
}
function doorSet(id, v) {   // this door (null: back to All doors or the plan's), or every door on All doors
  finPush(); S.fin = S.fin || {}; const o = S.fin.doors = Object.assign({}, S.fin.doors), i = DOOR_IDS.indexOf(id), all = DOOR_SC === id;
  if (all) { for (const q of Object.keys(o)) delete o[q]; if (v) o[70] = v; }
  else if (!v || (doorIsPlan(id, v) && !o[70])) delete o[71 + i]; else o[71 + i] = v;
  if (!Object.keys(o).length) delete S.fin.doors;
  store.set(KEY, S); doorApply(); finSchDraw(); toast(`${all ? "All doors" : (HIT(id) || { n: "The door" }).n}: ${doorSay(id, all ? o[70] : doorSpec(id))}`);
}
if (act) act.addEventListener("click", e => {
  const b = e.target.closest("[data-dleaf],[data-dhand],[data-dfin],[data-dscope],[data-dplan],[data-finundo]"), id = GS.actId && GS.actId.startsWith("hdoor:door.") ? GS.actId.slice(11) : null;
  if (!b || !DOOR_IDS.includes(id)) return; e.stopPropagation(); const d = b.dataset;
  if (d.finundo) { const prev = FIN_UNDO.pop(); if (prev != null) { finRestore(JSON.parse(prev)); finApplyAll(); store.set(KEY, S); toast("Undone"); } }
  else if (d.dscope) DOOR_SC = d.dscope === "all" ? id : null;
  else if (d.dplan) doorSet(id, DOOR_SC === id ? null : doorPlan(id));
  else { const [l, h] = ((DOOR_SC === id && ((S.fin || {}).doors || {})[70]) || doorSpec(id) || doorPlan(id)).split(".");   // All doors: from this one as it is
    doorSet(id, d.dleaf ? `${d.dleaf}.${h}` : d.dhand ? `${l}.${d.dhand}${h.slice(1)}` : `${l}.${h[0]}${d.dfin}`); }
  renderAct();
}, true);
/* Changes: each door not the plan's, in the room it opens into */
{ const ups0 = roomUps;
  // eslint-disable-next-line no-func-assign
  roomUps = room => { const L = ups0(room), D = upDone();
    for (const id of DOOR_IDS) { const it = HIT(id), v = doorSpec(id); if (!it || it.r !== room || !v || doorIsPlan(id, v)) continue;
      const c = doorCost(id, v), k = `door.${id}=${v}`; L.push({ k, t: `${it.n}: ${doorSay(id, v)}`, lo: Math.round(c[0]), hi: Math.round(c[1]), done: !!D[room + "|" + k] }); }
    return L; }; }
