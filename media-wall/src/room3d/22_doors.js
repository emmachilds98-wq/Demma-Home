/* N226 (REAL_PLAN section 29): each door hers: its leaf (the plan's cottage boards, four panel, shaker, flush, half glazed) and its handle
   (the plan's chrome lever, a matt black lever, a black knob), from the door's card (hinged doors; the office's bifold stays as planned): This door, or All doors. Kept in S.fin.doors: slot 70
   all of them, 71 + n each (n: the door in the house file's order, `doorIds`), "style.handle". Drawn in the door's own part (it swings with
   it): the leaf's, the boards' and the chrome's geometry swapped for ones made here, glass and black from the house's own materials (no new
   shader); the plan's back on The plan's, held and As it is. Costed by fit.SOURCES n226doors (a door, its handles, hanging it) */
const DOOR_STYLES = [["cottage", "Cottage boards", 0], ["four", "Four panel", 85], ["shaker", "Shaker", 120], ["flush", "Flush", 42], ["glazed", "Half glazed", 112]];
const DOOR_HANDLES = [["lever", "Chrome lever", 0], ["black", "Black lever", 15], ["knob", "Black knob", 26]], DOOR_HANG = [100, 350];   // £ a door, a pair of handles; hanging a door
let DOOR_SCOPE = "door"; const DOOR0 = new WeakMap(), DOOR_ON = new Set();
function doorIds() { const F = (R.HOUSE3 || {}).floors || {}; return Object.values(F).flatMap(f => Object.entries(f.parts || {}).filter(([k, P]) => k.startsWith("door.") && (P.boxes || {}).door_leaf && !Object.keys(P.parts || {}).length).map(([k]) => k)).sort(); }
const doorOk = (k, v) => { const [s, h] = String(v).split("."); return (k === 70 || (k > 70 && k - 71 < doorIds().length)) && DOOR_STYLES.some(([q]) => q === s) && DOOR_HANDLES.some(([q]) => q === h); };
function doorNow(pk) {   // {s, h, own, all}: this door's own, all doors', or the plan's
  const i = doorIds().indexOf(pk), v = i < 0 ? null : finGet("doors", 71 + i), a = finGet("doors", 70), [s, h] = String(v || a || "cottage.lever").split(".");
  return { s, h, own: !!v, all: !v && !!a, plan: !v && !a };
}
const doorSay = q => `${upNm(DOOR_STYLES, q.s)}, ${upNm(DOOR_HANDLES, q.h).toLowerCase()}`;
function doorCost(q) { const st = DOOR_STYLES.find(([k]) => k === q.s) || DOOR_STYLES[0], h = (DOOR_HANDLES.find(([k]) => k === q.h) || DOOR_HANDLES[0])[2];
  return st[2] ? [st[2] + h + DOOR_HANG[0], st[2] + h + DOOR_HANG[1]] : [h, h + 20]; }   // a new leaf hung; only the handles: yours to fit
function doorUps(room, add) {   // Changes: each door of this room styled her way (its item's room)
  doorIds().forEach(pk => { const it = HIT(pk.slice(5)), q = doorNow(pk); if (!it || it.r !== room || q.plan || (q.s === "cottage" && q.h === "lever")) return;
    add(`door=${pk}=${q.s}.${q.h}`, `${it.n}: ${doorSay(q).toLowerCase()}`, doorCost(q)); });
}
/* the part's own frame in cm (as house/model.py drew it): the leaf's box from its mesh, the hinge's end from its pivot */
function doorFrame(P) {
  const lm = P.g.children.find(c => c.isMesh && (c.material.userData || {}).hk === "door_leaf"); if (!lm) return null;
  const g0 = (DOOR0.get(lm) || {}).geometry || lm.geometry; g0.computeBoundingBox(); const b = g0.boundingBox, p = P.g.position;
  const x0 = -(b.max.x + p.x) / M, x1 = -(b.min.x + p.x) / M, y0 = (b.min.y + p.y) / M, y1 = (b.max.y + p.y) / M, z0 = (b.min.z + p.z) / M, z1 = (b.max.z + p.z) / M;
  const ax = x1 - x0 > z1 - z0 ? "x" : "z", [a0, a1, f0, f1] = ax === "x" ? [x0, x1, z0, z1] : [z0, z1, x0, x1], pa = ax === "x" ? -p.x / M : p.z / M;
  return { lm, ax, a0, a1, f0, f1, y0, y1, hinge: Math.abs(pa - a0) < Math.abs(pa - a1) ? a0 : a1, latch: Math.abs(pa - a0) < Math.abs(pa - a1) ? a1 : a0, p };
}
function doorGeos(F, s, h) {   // {mk: [geometries]} in the part's frame: the leaf (with its opening when glazed), its mouldings, glass, a handle each face
  const out = {}, put = (mk, g) => (out[mk] = out[mk] || []).push(g), { ax, a0, a1, f0, f1, y0, y1, latch, hinge, p } = F;
  const box = (mk, u0, v0, t0, u1, v1, t1) => { const [x0, x1, z0, z1] = ax === "x" ? [u0, u1, t0, t1] : [t0, t1, u0, u1], g = new THREE.BoxGeometry(Math.abs(x1 - x0) * M, Math.abs(v1 - v0) * M, Math.abs(z1 - z0) * M), c = v3((x0 + x1) / 2, (v0 + v1) / 2, (z0 + z1) / 2);
    g.translate(c.x - p.x, c.y - p.y, c.z - p.z); put(mk, g); };
  const H = y1 - y0, st = 11, top = 11, bot = 19, mid = y0 + H * 0.47, gl = s === "glazed", go = y0 + H * 0.5;
  if (gl) { box("door_leaf", a0, y0, f0, a1, go, f1); box("door_leaf", a0, y1 - top, f0, a1, y1, f1); box("door_leaf", a0, go, f0, a0 + st, y1 - top, f1); box("door_leaf", a1 - st, go, f0, a1, y1 - top, f1);
    box("glass", a0 + st, go, (f0 + f1) / 2 - 0.3, a1 - st, y1 - top, (f0 + f1) / 2 + 0.3); }
  else box("door_leaf", a0, y0, f0, a1, y1, f1);
  for (const [t0, t1] of [[f1, f1 + 0.5], [f0 - 0.5, f0]]) {   // each face's mouldings: the stiles and rails proud of its panels, a shadow line round each panel
    const fr = (va, vb, ua = a0 + st, ub = a1 - st) => { box("gap", ua, va, t0 === f1 ? f1 : f0 - 0.15, ub, va + 0.5, t0 === f1 ? f1 + 0.15 : f0); box("gap", ua, vb - 0.5, t0 === f1 ? f1 : f0 - 0.15, ub, vb, t0 === f1 ? f1 + 0.15 : f0);
      box("gap", ua, va, t0 === f1 ? f1 : f0 - 0.15, ua + 0.5, vb, t0 === f1 ? f1 + 0.15 : f0); box("gap", ub - 0.5, va, t0 === f1 ? f1 : f0 - 0.15, ub, vb, t0 === f1 ? f1 + 0.15 : f0); };
    if (s === "flush") continue;
    box("door_leaf", a0, y0, t0, a0 + st, y1, t1); box("door_leaf", a1 - st, y0, t0, a1, y1, t1); box("door_leaf", a0 + st, y1 - top, t0, a1 - st, y1, t1); box("door_leaf", a0 + st, y0, t0, a1 - st, y0 + bot, t1);
    if (s === "four") { const um = (a0 + a1) / 2; box("door_leaf", a0 + st, mid - 6, t0, a1 - st, mid + 6, t1); box("door_leaf", um - 5, y0 + bot, t0, um + 5, y1 - top, t1);
      for (const [va, vb] of [[y0 + bot, mid - 6], [mid + 6, y1 - top]]) { fr(va, vb, a0 + st, um - 5); fr(va, vb, um + 5, a1 - st); } }
    else if (gl) { box("door_leaf", a0 + st, go - 6, t0, a1 - st, go, t1); fr(y0 + bot, go - 6); }
    else fr(y0 + bot, y1 - top); }
  const u = latch - Math.sign(latch - hinge) * 7, back = Math.sign(hinge - latch), hy = y0 + 100.5;   // the handle by the latch edge, the lever pointing back to the hinge
  if (h !== "lever") for (const [f, o] of [[f1, 1], [f0, -1]]) {
    const at = (du, dv, dt, r0, r1, len) => { const g = new THREE.CylinderGeometry(r1 * M, r0 * M, len * M, 16); if (o < 0) g.rotateX(Math.PI);   // its wide end out from this face
      if (ax === "x") g.rotateX(Math.PI / 2); else g.rotateZ(Math.PI / 2); const c = ax === "x" ? v3(u + du, hy + dv, f + o * dt) : v3(f + o * dt, hy + dv, u + du); g.translate(c.x - p.x, c.y - p.y, c.z - p.z); put("handle_black", g); };
    at(0, 0, 0.4, 2.7, 2.7, 0.8); at(0, 0, 2.6, 0.8, 0.8, 3.6);   // the rose, the spindle
    if (h === "knob") at(0, 0, 5.6, 1.3, 2.8, 3.2); else box("handle_black", Math.min(u, u + back * 12.5), hy - 0.75, o > 0 ? f + 3.6 : f - 5.2, Math.max(u, u + back * 12.5), hy + 0.75, o > 0 ? f + 5.2 : f - 3.6); }
  return out;
}
function doorLevers(F, me, off) {   // the plan's chrome levers taken out (their faces folded to a point), its hinges kept; back when off is false
  const P = me.geometry.attributes.position, st = DOOR0.get(me) || {}; if (!st.pos) { st.pos = P.array.slice(); DOOR0.set(me, st); }
  P.array.set(st.pos); if (off) { const pa = F.ax === "x" ? -F.p.x / M : F.p.z / M; let k = -1;
    for (let i = 0; i < P.count; i++) { const q = F.ax === "x" ? -(st.pos[3 * i] + F.p.x) / M : (st.pos[3 * i + 2] + F.p.z) / M; if (Math.abs(q - pa) > 20) { if (k < 0) k = i; P.array.copyWithin(3 * i, 3 * k, 3 * k + 3); } } }
  P.needsUpdate = true;
}
function doorApply() {   // every door: her style in its part, or the plan's back
  if (!R.HOUSE3 || !FIN.mat3) return; let n = 0;
  for (const pk of doorIds()) { const P = HPARTS[pk]; if (!P || !P.g) continue; const F = doorFrame(P); if (!F) continue;
    const q = finHeld ? { s: "cottage", h: "lever" } : doorNow(pk), key = `${q.s}.${q.h}`, st = DOOR0.get(F.lm) || {};
    if ((st.key || "cottage.lever") === key) continue; n++;
    for (const me of P.g.children.filter(c => c.userData.door226)) { P.g.remove(me); me.geometry.dispose(); }
    const gap = P.g.children.find(c => c.isMesh && (c.material.userData || {}).hk === "gap"), ch = P.g.children.find(c => c.isMesh && (c.material.userData || {}).hk === "chrome");
    if (!st.geometry) { st.geometry = F.lm.geometry; DOOR0.set(F.lm, st); }
    st.key = key; const plan = key === "cottage.lever";
    if (F.lm.geometry !== st.geometry) F.lm.geometry.dispose();
    if (gap) gap.visible = q.s === "cottage"; if (ch) doorLevers(F, ch, q.h !== "lever");
    if (q.s === "cottage" && !plan) F.lm.geometry = st.geometry;
    if (plan) { F.lm.geometry = st.geometry; DOOR_ON.delete(pk); continue; }
    const G = doorGeos(F, q.s, q.h); DOOR_ON.add(pk);
    for (const [mk, geos] of Object.entries(G)) { if (q.s === "cottage" && mk !== "handle_black") { geos.forEach(g => g.dispose()); continue; }
      const m = FIN.mat3(mk), mg = worldUV(mergeGeometries(geos), mk); geos.forEach(g => g.dispose());
      if (mk === "door_leaf") { if (st.geometry.attributes.uv1 && !mg.attributes.uv1) mg.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(mg.attributes.position.count * 2), 2, true)); F.lm.geometry = mg; continue; }
      const me = new THREE.Mesh(mg, m); me.castShadow = !m.transparent; me.receiveShadow = true; me.userData.door226 = true; P.g.add(me); } }
  if (n && typeof joinDrop === "function") { joinDrop(); if (typeof roomCull === "function") roomCull(true); }
  dirty();
}
function doorTray(pk) {   // the door's card: This door · All doors, its leaf, its handle
  const q = doorNow(pk), sc = (k, t) => `<button type="button" data-doorsc="${k}" aria-pressed="${DOOR_SCOPE === k}">${t}</button>`;
  return `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${sc("door", "This door")}${sc("all", "All doors")}</div>`
    + `<span class="r3d-finlab">Its leaf</span><div class="r3d-finsc" role="group" aria-label="Its leaf">${DOOR_STYLES.map(([k, t]) => `<button type="button" data-doorst="${k}" aria-pressed="${!q.plan && q.s === k}">${t}</button>`).join("")}</div>`
    + `<span class="r3d-finlab">Its handle</span><div class="r3d-finsc" role="group" aria-label="Its handle">${DOOR_HANDLES.map(([k, t]) => `<button type="button" data-doorh="${k}" aria-pressed="${!q.plan && q.h === k}">${t}</button>`).join("")}</div></div>`;
}
const doorLine = pk => { const q = doorNow(pk), c = q.plan ? null : doorCost(q); return q.plan ? "The plan's: cottage boards, chrome lever" : [doorSay(q), q.all ? "all doors" : "", c && c[1] ? upRange(...c) : ""].filter(Boolean).join(" · "); };
function doorSet(pk, s, h) {   // her style on this door or all of them (null: the plan's)
  const i = doorIds().indexOf(pk); if (i < 0) return; finPush(); S.fin = S.fin || {}; const o = S.fin.doors = S.fin.doors || {}, v = s ? `${s}.${h}` : null;
  if (DOOR_SCOPE === "all") { for (const k of Object.keys(o)) delete o[k]; if (v && v !== "cottage.lever") o[70] = v; }
  else if (v) o[71 + i] = v; else delete o[71 + i];
  if (!Object.keys(o).length) delete S.fin.doors;
  store.set(KEY, S); doorApply(); finSchDraw(); toast(`${DOOR_SCOPE === "all" ? "All doors" : (HPARTS[pk] || {}).label || "The door"}: ${v ? doorSay(doorNow(pk)).toLowerCase() : "the plan's"}`);
}
if (act) act.addEventListener("click", e => { const b = e.target.closest("[data-doorst],[data-doorh],[data-doorsc],[data-doorplan],[data-finundo]");
  if (!b || !GS.actId || !GS.actId.startsWith("hdoor:")) return; const pk = GS.actId.slice(6); if (!doorIds().includes(pk)) return; e.stopPropagation(); const d = b.dataset, q = doorNow(pk);
  if (d.doorsc) DOOR_SCOPE = d.doorsc;
  else if (d.finundo) { const prev = FIN_UNDO.pop(); if (prev != null) { finRestore(JSON.parse(prev)); finApplyAll(); store.set(KEY, S); toast("Undone"); } }
  else if (d.doorplan) doorSet(pk, null);
  else doorSet(pk, d.doorst || q.s, d.doorh || q.h);
  renderAct(); }, true);
