let garden3d = null;   // v53: the back garden as ground, in the views from above
let HBUILD = null;     // V1: builds (or rebuilds, with edits) one floor of the house
const HEDITS = {};     // V1 (Phase 3): the client's edits, {item id: {from: box, to: box, op?: the opening's old and new edges}}
const mapAx = (v, f0, f1, t0, t1) => (f1 - f0 < 0.01 ? v + (t0 - f0) : t0 + (v - f0) * (t1 - t0) / (f1 - f0));
/* V2.33 (REAL_PLAN R6): a piece turned a quarter (E.turn, 1-3) about the centre of its new box, after its size and place: a box's x and z
   swap round that centre, a turned shape's centre goes round with it, a profile's extrusion changes axis (turnPrism) */
const turnBox = (b, cx, cz) => [cx - (b[5] - cz), b[1], cz + (b[0] - cx), cx - (b[2] - cz), b[4], cz + (b[3] - cx)].map(v => Math.round(v * 10) / 10);
function editXf(E) {
  const f = editScale(E), q = (E.turn || 0) % 4; if (!q || E.removed) return f;
  const cx = (E.to[0] + E.to[3]) / 2, cz = (E.to[2] + E.to[5]) / 2;
  const g = b => { let o = f(b); for (let i = 0; i < q; i++) o = turnBox(o, cx, cz); return o; };
  return Object.assign(g, { scale: f, turn: q, cx, cz });
}
function editScale(E) {   // one edited piece's boxes: a door or window keeps its frames' widths (piecewise along its wall), the rest scale
  const op = E.op;
  if (E.removed) return () => null;                                         // taken out (Remove): its boxes aren't drawn
  return b => {
    const out = b.slice();
    for (let k = 0; k < 3; k++) {
      let f0 = E.from[k], f1 = E.from[k + 3], t0 = E.to[k], t1 = E.to[k + 3];
      if (op && ((k === 0 && op.axis === "x") || (k === 2 && op.axis === "z"))) { f0 = op.a; f1 = op.b; t0 = op.a2; t1 = op.b2; }
      else if (op && k === 1) { f0 = op.y0; f1 = op.y1; t0 = op.y02; t1 = op.y12; }
      const m = v => (op && v <= f0 + 0.01) ? v + (t0 - f0) : (op && v >= f1 - 0.01) ? v + (t1 - f1) : mapAx(v, f0, f1, t0, t1);
      out[k] = m(b[k]); out[k + 3] = m(b[k + 3]);
    }
    return out.map(v => Math.round(v * 10) / 10);
  };
}
function followOps(b, ops) {   // a wall's pieces round an opening: their edges at the opening's old edges go to its new ones
  let out = null;
  for (const op of ops) {
    const k = op.axis === "x" ? 0 : 2, c = op.axis === "x" ? 2 : 0;
    if (b[c + 3] < op.line - 16 || b[c] > op.line + 16) continue;
    if (b[4] < op.y0 - 30 || b[1] > op.y1 + 400) continue;
    const o = out || (out = b.slice());
    if (Math.abs(o[k + 3] - op.a) < 0.25) o[k + 3] = op.a2;
    if (Math.abs(o[k] - op.a) < 0.25) o[k] = op.a2;
    if (Math.abs(o[k] - op.b) < 0.25) o[k] = op.b2;
    if (Math.abs(o[k + 3] - op.b) < 0.25) o[k + 3] = op.b2;
    if (o[k] > op.a - 0.25 && o[k + 3] < op.b + 0.25 || (o[k] >= op.a2 - 0.25 && o[k + 3] <= op.b2 + 0.25)) {   // over or under the opening
      if (Math.abs(o[1] - op.y1) < 0.25) o[1] = op.y12;
      if (Math.abs(o[4] - op.y0) < 0.25) o[4] = op.y02;
    }
  }
  return out || b;
}
function editedFloor(fk, F) {
  const tags = F.tags || [], ids = Object.keys(HEDITS).filter(id => tags.includes(id));
  if (!ids.length) return F;
  const xf = {}; ids.forEach(id => { xf[tags.indexOf(id)] = editXf(HEDITS[id]); });
  const ops = ids.map(id => HEDITS[id].op).filter(Boolean);
  const mapList = (list, bt) => { const ob = [], ot = [];                    // the boxes and their tags, kept side by side
    list.forEach((b, i) => { const t = bt ? bt[i] : -1, nb = xf[t] ? xf[t](b) : ops.length ? followOps(b, ops) : b; if (nb) { ob.push(nb); ot.push(t); } });
    return [ob, ot]; };
  const boxes = {}, bt = {};
  for (const [m, list] of Object.entries(F.boxes)) [boxes[m], bt[m]] = mapList(list, (F.bt || {})[m]);
  const lathes = (F.lathes || []).filter(L => !(xf[L.t] && HEDITS[tags[L.t]].removed)).map(L => { const f = xf[L.t]; if (!f) return L; const E = HEDITS[tags[L.t]];
    const sx = (E.to[3] - E.to[0]) / Math.max(0.1, E.from[3] - E.from[0]), sz = (E.to[5] - E.to[2]) / Math.max(0.1, E.from[5] - E.from[2]);
    const c = f([L.c[0], L.c[1], L.c[2], L.c[0], L.c[1], L.c[2]]), s = [L.s[0] * sx, L.s[1] * sz];
    return Object.assign({}, L, { c: [c[0], c[1], c[2]], s: f.turn % 2 ? [s[1], s[0]] : s }); });
  const prisms = (F.prisms || []).filter(P => !(xf[P.t] && HEDITS[tags[P.t]].removed)).map(P => mapPrism(P, xf[P.t]));
  const parts = {}; for (const [k, P] of Object.entries(F.parts || {})) { const pb = {}, pt = {}; for (const [m, list] of Object.entries(P.boxes)) [pb[m], pt[m]] = mapList(list, (P.bt || {})[m]);
    const t = Object.values(P.bt || {}).flat().find(q => xf[q]), f = t != null ? xf[t] : null;   // V1.50: a resized door swings from its hinge, its handle with it
    const pv = f ? f([P.pivot[0], P.pivot[1], P.pivot[2], P.pivot[0], P.pivot[1], P.pivot[2]]) : null;
    parts[k] = Object.assign({}, P, { boxes: pb, bt: pt }, f ? { pivot: pv.slice(0, 3), prisms: (P.prisms || []).map(Q => mapPrism(Q, f)) } : {}); }
  return Object.assign({}, F, { boxes, bt, lathes, prisms, parts });
}
function turnPrism(P, cx, cz) {   // V2.33: a profile turned a quarter about (cx, cz)
  const rx = (x, z) => [cx - (z - cz), cz + (x - cx)];
  if (P.axis === "y") return Object.assign({}, P, { pts: P.pts.map(([u, w]) => rx(u, w)) });
  if (P.axis === "x") { const [za, zb] = [cz + (P.a - cx), cz + (P.b - cx)]; return Object.assign({}, P, { axis: "z", a: Math.min(za, zb), b: Math.max(za, zb), pts: P.pts.map(([u, w]) => [cx - (u - cz), w]) }); }
  const [xa, xb] = [cx - (P.a - cz), cx - (P.b - cz)];
  return Object.assign({}, P, { axis: "x", a: Math.min(xa, xb), b: Math.max(xa, xb), pts: P.pts.map(([u, w]) => [cz + (u - cx), w]) });
}
function mapPrism(P, f) {
  if (!f) return P;
  if (f.turn) { let Q = mapPrism(P, f.scale); for (let i = 0; i < f.turn; i++) Q = turnPrism(Q, f.cx, f.cz); return Q; }
  if (P.axis === "y") { const pts = P.pts.map(([u, w]) => { const q = f([u, 0, w, u, 0, w]); return [q[0], q[2]]; }), ab = f([0, P.a, 0, 0, P.b, 0]);   // V1.14
      return Object.assign({}, P, { pts, a: ab[1], b: ab[4] }); }
    const pts = P.pts.map(([u, w]) => { const q = P.axis === "x" ? f([0, w, u, 0, w, u]) : f([u, w, 0, u, w, 0]); return P.axis === "x" ? [q[2], q[1]] : [q[0], q[1]]; });
    const ab = P.axis === "x" ? f([P.a, 0, 0, P.b, 0, 0]) : f([0, 0, P.a, 0, 0, P.b]); return Object.assign({}, P, { pts, a: P.axis === "x" ? ab[0] : ab[2], b: P.axis === "x" ? ab[3] : ab[5] });
}
/* V1.50 (V1_PLAN phase 3, the old app's Edit in the old design): tap a piece in the house and change its size. Each piece's boxes, by its
   tag, find what a tap is on; the changes are Measure's "edits" rows ({item, field, value}: measure.js's store, so Send shares them),
   with the same arithmetic as tools/pull_edits.py, which folds them into house/survey_data.py. */
const PICK = {}, PARTED = new Set();   // V2.33: pieces with a part that swings or lifts (they don't turn)
const wbox = b => new THREE.Box3(new THREE.Vector3(-b[3] * M, b[1] * M, b[2] * M), new THREE.Vector3(-b[0] * M, b[4] * M, b[5] * M));
function pickable(fk, F) {
  const tags = F.tags || [], list = [];
  for (const [m, boxes] of Object.entries(F.boxes)) { if (m === "contact") continue; const bt = (F.bt || {})[m] || [];
    boxes.forEach((b, i) => { if (bt[i] >= 0) list.push({ id: tags[bt[i]], b: wbox(b) }); }); }
  for (const L of F.lathes || []) if (L.t >= 0) { const r = Math.max(...L.p.map(q => q[0])), h = Math.max(...L.p.map(q => q[1]));
    list.push({ id: tags[L.t], b: wbox([L.c[0] - r * L.s[0], L.c[1], L.c[2] - r * L.s[1], L.c[0] + r * L.s[0], L.c[1] + h, L.c[2] + r * L.s[1]]) }); }
  for (const P of Object.values(F.parts || {})) for (const [m, boxes] of Object.entries(P.boxes)) { const bt = (P.bt || {})[m] || [];
    boxes.forEach((b, i) => { if (bt[i] >= 0) { list.push({ id: tags[bt[i]], b: wbox(b) }); PARTED.add(tags[bt[i]]); } }); }
  PICK[fk] = list;
}
function housePiece(hits, cut) {   // the piece whose box the ray meets first, at or just behind the first surface it hits
  const d0 = hits.length ? hits[0].distance : Infinity; let best = null; const q = new THREE.Vector3();
  for (const [fk, list] of Object.entries(PICK)) { const g = HFLOOR[fk]; if (!g || !shown(g)) continue;
    for (const it of list) { if (!ray.ray.intersectBox(it.b, q) || cut(q, g)) continue; const d = ray.ray.origin.distanceTo(q);
      if (d <= d0 + 0.05 && (!best || d < best.d)) best = { id: it.id, d }; } }
  return best ? best.id : null;
}
/* the picked piece: a dashed outline round its box and its size on a tag (the design's Edit mode) */
const SEL = { g: null };
function clearSel() { if (!SEL.g) return; scene.remove(SEL.g); SEL.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } }); SEL.g = null; dirty(); }
function selPiece(o) {
  clearSel(); if (!o || !o.box) return;
  const b = o.box, g = new THREE.Group(), bx = wbox(b), size = bx.getSize(new THREE.Vector3()), c = bx.getCenter(new THREE.Vector3());
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.02, size.y + 0.02, size.z + 0.02));
  const line = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: "#fff1bf", dashSize: 0.04, gapSize: 0.025, depthTest: false, transparent: true, toneMapped: false }));
  line.computeLineDistances(); line.position.copy(c); line.renderOrder = 997; g.add(line);
  if (o.label) {
    const cv = document.createElement("canvas"), x = cv.getContext("2d"); cv.width = 320; cv.height = 112;
    x.fillStyle = "#fff1bf"; x.beginPath(); x.roundRect ? x.roundRect(4, 4, 312, 104, 52) : x.rect(4, 4, 312, 104); x.fill();
    x.fillStyle = "#1d2a22"; x.font = "600 54px Figtree, system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(o.label, 160, 60);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, toneMapped: false })); sp.renderOrder = 999;
    const d = camera.position.distanceTo(c), s = Math.max(0.12, Math.min(0.9, d * 0.09)); sp.scale.set(s, s * 112 / 320, 1);
    sp.position.set(c.x, bx.min.y - s * 0.28, c.z); g.add(sp);
  }
  g.traverse(q => { q.raycast = () => {}; }); SEL.g = g; scene.add(g); dirty();
}
/* edits: rebuild only the floors whose pieces changed */
let pend = null;
function applyHEdits(map) {
  const before = new Set(Object.keys(HEDITS));
  for (const k of Object.keys(HEDITS)) if (!map[k]) delete HEDITS[k];
  Object.assign(HEDITS, map);
  const touched = new Set([...before, ...Object.keys(map)]);
  if (!houseG || !HBUILD) return;
  for (const [fk, F] of Object.entries(R.HOUSE3.floors)) if ((F.tags || []).some(id => touched.has(id))) (pend = pend || new Set()).add(fk);
  if (pend) requestAnimationFrame(() => { const fs = pend; pend = null; if (!fs) return;
    for (const fk of fs) HBUILD(fk, editedFloor(fk, R.HOUSE3.floors[fk])); solidDirty(); reshadow(); dirty(); });
}
const HIT = id => (((R.HOUSE3 || {}).items) || {})[id];
const DS = () => window.DemmaStore || null;
/* V2.32 (REAL_PLAN R6, the client: "keep working on the full upgrade"): a piece moves out from its wall too ("out": across the other way
   on the floor), not only along it; doors and windows stay in their walls */
const FIELDS = [["w", "Width"], ["h", "Height"], ["up", "Up from the floor"], ["along", "Along the wall"], ["out", "Out from the wall"]];
function pieceNow(id) {
  const it = HIT(id), e = {}, ds = DS();
  if (ds) for (const v of Object.values(ds.rows("edits") || {})) if (v && v.item === id && (typeof v.value === "number" || v.field === "removed")) e[v.field] = v.value;
  return { w: e.w ?? it.s[0], h: e.h ?? it.s[1], up: e.up ?? it.s[2], along: e.along ?? it.al, out: it.op ? 0 : e.out ?? 0, turn: canTurn(id) ? (e.turn ?? 0) % 4 : 0, removed: e.removed === true };
}
const canTurn = id => { const it = HIT(id); return !!it && !it.op && !PARTED.has(id); };
function pieceDelta(id) { const it = HIT(id), c = pieceNow(id); return [c.along - it.al, c.w - it.s[0], c.h - it.s[1], c.up - it.s[2], c.out, c.turn, c.removed]; }
function pieceBox(id) {
  const it = HIT(id), [dA, dW, dH, dU, dO] = pieceDelta(id), k = it.ax === "z" ? 2 : 0, o = 2 - k, b = it.b.slice();
  b[k] += dA; b[k + 3] += dA + dW; b[1] += dU; b[4] += dU + dH; b[o] += dO; b[o + 3] += dO;
  const q = pieceNow(id).turn; return q % 2 ? turnBox(b, (b[0] + b[3]) / 2, (b[2] + b[5]) / 2) : b;   // V2.33: its outline turned too
}
function storeEdits() {   // Measure's rows, as the engine's edits (HEDITS)
  if (!DS() || !R.HOUSE3) return;
  const out = {};
  for (const [id, it] of Object.entries(R.HOUSE3.items || {})) {
    if (!pieceDelta(id).some(Boolean)) continue; const [dA, dW, dH, dU] = pieceDelta(id);
    if (pieceNow(id).removed) { out[id] = { from: it.b, to: it.b, removed: true }; continue; }   // V2.34: taken out (Measure's As planned puts it back)
    const q = pieceNow(id).turn, to = pieceBox(id), E = { from: it.b, to: q % 2 ? turnBox(to, (to[0] + to[3]) / 2, (to[2] + to[5]) / 2) : to, turn: q }, o = it.op;   // to: before the turn (editXf turns it)
    if (o) E.op = { axis: o.axis, line: o.line, a: o.a, b: o.b, y0: o.y0, y1: o.y1, a2: o.a + dA, b2: o.b + dA + dW, y02: o.y0 + dU, y12: o.y1 + dU + dH };
    out[id] = E;
  }
  const was = JSON.stringify(HEDITS), now = JSON.stringify(out);
  if (was !== now) applyHEdits(out);
}
function paintEdits() {   // V1.51: Measure's list of the sizes changed in the 3D: a piece's name flies to it, As planned puts it back
  const box = document.getElementById("ms-elist"), grp = document.getElementById("ms-edits"); if (!box || !grp || !DS()) return;
  const ids = [...new Set(Object.values(DS().rows("edits") || {}).map(v => v && v.item))].filter(id => HIT(id) && pieceDelta(id).some(Boolean));
  grp.hidden = !ids.length;
  const W = { w: "wide", h: "high", up: "up", along: "along", out: "out", turn: "quarter turns" };
  box.innerHTML = ids.map(id => { const it = HIT(id), c = pieceNow(id), was = { w: it.s[0], h: it.s[1], up: it.s[2], along: it.al, out: 0, turn: 0 };
    const ch = c.removed ? "taken out" : Object.keys(W).filter(k => Math.abs(c[k] - was[k]) > 0.05).map(k => `${cmR(c[k])} ${W[k]}, was ${cmR(was[k])}`).join(" · ");
    return `<div class="ms-row ms-erow"><button type="button" class="t ms-ego" data-epiece="${id}">${it.n}<small>${ch}</small></button><button type="button" class="btn" data-ereset="${id}">As planned</button></div>`; }).join("");
}
document.addEventListener("click", e => {
  const g = e.target.closest("[data-epiece]"), x = e.target.closest("[data-ereset]"); if (!g && !x) return;
  const id = (g || x).dataset[g ? "epiece" : "ereset"], ds = DS(); if (!HIT(id) || !ds) return;
  if (x) { Object.entries(ds.rows("edits")).filter(([, v]) => v && v.item === id).forEach(([rid]) => ds.del("edits", rid)); return; }
  const v = ROOM_VIEW[HIT(id).r]; if (window.DemmaTools) window.DemmaTools.close();
  if (v && v !== S.view) setView(v);
  let n = 0; const mark = () => (tween && n++ < 60) ? setTimeout(mark, 150) : selOf(id); setTimeout(mark, 300);   // outlined once the fly ends
});
window.addEventListener("demma-rows", e => { if (e.detail !== "edits") return; storeEdits(); paintEdits();
  if (actId && /^hsize:|^hitem:/.test(actId)) { const id = actId.split(":")[1]; selOf(id); const st = qs("#r3d-act-st"); if (st) st.textContent = actItems(actId)[1]; } });
const cmR = v => Math.round(v * 10) / 10;
const clampF = (f, v) => Math.max(f === "along" || f === "up" || f === "out" ? -500 : 1, Math.min(1000, v));
function selOf(id) { const it = HIT(id); if (!it) { clearSel(); return; } const c = pieceNow(id); selPiece({ box: pieceBox(id), label: `${Math.round(c.w)} × ${Math.round(c.h)}` }); }
const pieceLine = id => { const it = HIT(id), c = pieceNow(id), ed = pieceDelta(id).some(Boolean);
  return `${cmR(c.w)} wide, ${cmR(c.h)} high, ${cmR(c.up)} up` + (ed ? " · changed by you" : it.g ? " · a guess: measure it" : ""); };
let sizeT = 0;
async function setPiece(id, field, v) {
  const it = HIT(id), ds = DS(); if (!it || !ds) return;
  const base = field === "along" ? it.al : field === "out" || field === "turn" ? 0 : field === "removed" ? false : it.s[["w", "h", "up"].indexOf(field)], rid = `${id}~${field}`;
  try { if (v == null || Math.abs(v - base) < 0.05) { if (ds.rows("edits")[rid]) await ds.del("edits", rid); }
        else await ds.put("edits", rid, { item: id, field, value: v }); }
  catch (e) { toast("That didn't save: try again"); }
}
