/* V2.6 (docs/FINISHES_PLAN.md F3), the client: "customise different areas of the house in a fluid way, ie colour of walls": tap a wall or a
   ceiling in any of the house's rooms; its card has the colours as a tray (tap one: the room changes at once), where it goes (this wall,
   this room, the whole house), Undo, and As it is (hold it: the house as drawn; let go: your colours). Kept on this device (S.fin: room ->
   slot -> colour), drawn through F2's palette (20_go.js finish). The living room keeps its own Look. */
let finScope = "room", finHeld = null;
const FIN_UNDO = [];
const FIN_NAMES = ["back", "front", "east", "west", "ceiling", "floor"];
/* V2.7 (F4): the floors in the tray: the house's own floor materials (their photos, house/textures), laid as a room's new floor; the mean
   colour of each photo is its swatch */
const FIN_FLOORS = [["carpet_grey", "Grey carpet"], ["carpet", "Oatmeal carpet"], ["laminate", "Laminate"], ["oak", "Oak boards"], ["pine", "Pine boards"],
  ["tile_f", "Pale tiles"], ["marble", "Black marble"], ["quarry", "Quarry tiles"]];
const FIN_FLOOR_KEYS = new Set(["carpet_grey", "carpet", "laminate", "board", "oak", "pine", "tile_f", "marble", "quarry", "concrete", "vinyl", "earth"]);
const finFloorCol = k => { const pm = ((R.HOUSE3 || {}).photo_meta || {})[k]; return (pm && pm.avg) || ((((R.HOUSE3 || {}).mats || {})[k]) || ["#999999"])[0]; };
let FIN_LAID = [];
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
  dirty();
}
function finSwatches() {   // the paints to start with: the living room's (the client's pale mint first), and white
  const L = [["#f4f3ef", "White"]];
  for (const [k, p] of Object.entries(R.PAINTS || {})) { const hex = p.hex || p[0], nm = String(p.name || p.label || p[1] || k).replace(/\s*\(#[0-9a-f]{6}\)/i, "").split(",")[0]; if (hex) L.push([hex, nm]); }
  return L;
}
const finShort = nm => nm.replace(/^(Farrow & Ball|Little Greene|Dulux|Crown|Valspar)\s+/, "").replace(/\s+No\.\s*\d+$/, "");   // say less: the tray shows "Card Room Green"
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
  if (hk === "stairpaint") ri = FIN.rooms.indexOf("landing") + 1;
  else { const o = ceil ? 0 : 3, fl = yc < 0 ? 0 : yc < 260 ? 1 : 2;
    const i = Math.max(0, Math.min(FIN.W - 1, Math.floor((xc - n.x * o) / 2))), j = Math.max(0, Math.min(FIN.H - 1, Math.floor((zc + n.z * o + 309) / 2)));
    ri = FIN.map.image.data[(fl * FIN.H + j) * FIN.W + i]; }
  if (!ri) return null;
  const nx = -n.x, nz = n.z, slot = ceil ? 4 : Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 2 : 3) : (nz > 0 ? 0 : 1);
  return { room: FIN.rooms[ri - 1], slot };
}
function finGet(room, slot) { return ((S.fin || {})[room] || {})[slot] || null; }
function finApplyAll() {   // what's kept, into the palette (on start, after Undo)
  if (!finSetup()) return; finish(null, "walls", null); finish(null, "ceiling", null);
  for (const [room, sl] of Object.entries(S.fin || {})) for (const [s, hex] of Object.entries(sl)) if (+s < 5 && FIN.rooms.includes(room)) finish(room, FIN_NAMES[+s], hex);
  finFloorApply();
}
function finSet(room, slot, hex) {   // by the scope: this wall, this room's walls (or ceiling), the whole house's
  FIN_UNDO.push(JSON.stringify(S.fin || {})); if (FIN_UNDO.length > 20) FIN_UNDO.shift();
  S.fin = S.fin || {};
  const ceil = slot === 4, flr = slot === 5, slots = flr ? [5] : ceil ? [4] : finScope === "wall" ? [slot] : [0, 1, 2, 3];
  const rooms = finScope === "house" ? FIN.rooms : flr && finScope === "floor" ? finStorey(room) : [room];
  for (const r of rooms) { const o = S.fin[r] = S.fin[r] || {}; for (const s of slots) { if (hex) o[s] = hex; else delete o[s]; } if (!Object.keys(o).length) delete S.fin[r]; }
  finApplyAll(); store.set(KEY, S);
  if (flr) { const nm = (FIN_FLOORS.find(([k]) => k === hex) || [0, "as drawn"])[1]; toast(`${finScope === "floor" ? "Whole floor" : roomName(room)}: floor ${hex ? nm : "as drawn"}`); return; }
  const nm = (finSwatches().find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
  toast(`${finScope === "house" ? "Whole house" : roomName(room)}: ${ceil ? "ceiling" : finScope === "wall" ? `the ${FIN_NAMES[slot]} wall` : "walls"} ${hex ? nm : "as drawn"}`);
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
  return [`${roomName(room)}: the floor`, nm, [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), btn("As it is (hold)", { finhold: "1" }), ...(now ? [btn("As drawn", { finf: "" })] : [])], null, tray];
}
function finCard(id) {   // [title, now, buttons, -, the tray]
  const [, room, s] = id.split(":"), slot = +s, ceil = slot === 4, now = finGet(room, slot);
  if (slot === 5) return finFloorCard(room);
  if (finScope === "floor") finScope = "room";
  if (ceil && finScope === "wall") finScope = "room";
  const nm = now ? ((finSwatches().find(([h]) => h.toLowerCase() === now.toLowerCase()) || [0, now])[1]) : "As drawn";
  const scopes = ceil ? [["room", "This room"], ["house", "Whole house"]] : [["wall", "This wall"], ["room", "This room"], ["house", "Whole house"]];
  const tray = `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Where it goes">${scopes.map(([k, t]) => `<button type="button" data-finsc="${k}" aria-pressed="${finScope === k}">${t}</button>`).join("")}</div>`
    + `<div class="r3d-fintray" role="group" aria-label="Colours">${finSwatches().map(([h, t]) => `<button type="button" class="sw" data-finc="${h}" style="--c:${h}" aria-pressed="${!!now && now.toLowerCase() === h.toLowerCase()}" title="${t}" aria-label="${t}"><i></i><span>${finShort(t)}</span></button>`).join("")}`
    + `<label class="sw any" title="Any colour"><input type="color" data-finany="1" value="${now || "#f4f3ef"}" aria-label="Any colour"><span>Any</span></label></div></div>`;
  return [`${roomName(room)}: ${ceil ? "the ceiling" : finScope === "wall" ? `the ${FIN_NAMES[slot]} wall` : "the walls"}`, nm,
    [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), btn("As it is (hold)", { finhold: "1" }), ...(now ? [btn("As drawn", { finc: "" })] : [])], null, tray];
}
function finHold(on) {   // As it is: while held, the palette empty (the house as drawn); let go, your colours back
  if (!FIN.pal) return;
  if (on && !finHeld) { finHeld = FIN.pal.image.data.slice(); for (let i = 3; i < finHeld.length; i += 4) FIN.pal.image.data[i] = 0; FIN_LAID.forEach(m => m.visible = false); }
  else if (!on && finHeld) { FIN.pal.image.data.set(finHeld); finHeld = null; FIN_LAID.forEach(m => m.visible = true); }
  FIN.pal.needsUpdate = true; dirty();
}
if (act) {
  act.addEventListener("click", e => {
    const b = e.target.closest("[data-finc],[data-finf],[data-finsc],[data-finundo]"); if (!b || !actId || !actId.startsWith("fin:")) return;
    e.stopPropagation(); const [, room, s] = actId.split(":");
    if (b.dataset.finsc) finScope = b.dataset.finsc;
    else if (b.dataset.finundo) { const prev = FIN_UNDO.pop(); if (prev != null) { S.fin = JSON.parse(prev); finApplyAll(); store.set(KEY, S); toast("Undone"); } }
    else if ("finf" in b.dataset) finSet(room, 5, b.dataset.finf || null);
    else finSet(room, +s, b.dataset.finc || null);
    renderAct();
  }, true);
  act.addEventListener("change", e => { if (e.target.dataset.finany && actId && actId.startsWith("fin:")) { const [, room, s] = actId.split(":"); finSet(room, +s, e.target.value); renderAct(); } });
  act.addEventListener("pointerdown", e => { if (e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) act.addEventListener(ev, () => finHold(false));
  act.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  act.addEventListener("keyup", e => { if (e.target.closest("[data-finhold]")) finHold(false); });
}
