/* V2.6 (docs/FINISHES_PLAN.md F3), the client: "customise different areas of the house in a fluid way, ie colour of walls": tap a wall or a
   ceiling in any of the house's rooms; its card has the colours as a tray (tap one: the room changes at once), where it goes (this wall,
   this room, the whole house), Undo, and As it is (hold it: the house as drawn; let go: your colours). Kept on this device (S.fin: room ->
   slot -> colour), drawn through F2's palette (20_go.js finish). The living room keeps its own Look. */
let finScope = "room", finHeld = null;
const FIN_UNDO = [];
const FIN_NAMES = ["back", "front", "east", "west", "ceiling"];
function finSwatches() {   // the paints to start with: the living room's (the client's pale mint first), and white
  const L = [["#f4f3ef", "White"]];
  for (const [k, p] of Object.entries(R.PAINTS || {})) { const hex = p.hex || p[0], nm = String(p.name || p.label || p[1] || k).replace(/\s*\(#[0-9a-f]{6}\)/i, "").split(",")[0]; if (hex) L.push([hex, nm]); }
  return L;
}
const finShort = nm => nm.replace(/^(Farrow & Ball|Little Greene|Dulux|Crown|Valspar)\s+/, "").replace(/\s+No\.\s*\d+$/, "");   // say less: the tray shows "Card Room Green"
function finAt(hit) {   // a tap on a wall or a ceiling of the house: its room and side (as the palette's shader reads them)
  const m = hit && hit.object && hit.object.material, hk = m && m.userData && m.userData.hk;
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
  for (const [room, sl] of Object.entries(S.fin || {})) for (const [s, hex] of Object.entries(sl)) if (FIN.rooms.includes(room)) finish(room, FIN_NAMES[+s], hex);
}
function finSet(room, slot, hex) {   // by the scope: this wall, this room's walls (or ceiling), the whole house's
  FIN_UNDO.push(JSON.stringify(S.fin || {})); if (FIN_UNDO.length > 20) FIN_UNDO.shift();
  S.fin = S.fin || {};
  const ceil = slot === 4, slots = ceil ? [4] : finScope === "wall" ? [slot] : [0, 1, 2, 3], rooms = finScope === "house" ? FIN.rooms : [room];
  for (const r of rooms) { const o = S.fin[r] = S.fin[r] || {}; for (const s of slots) { if (hex) o[s] = hex; else delete o[s]; } if (!Object.keys(o).length) delete S.fin[r]; }
  finApplyAll(); store.set(KEY, S);
  const nm = (finSwatches().find(([h]) => h.toLowerCase() === String(hex).toLowerCase()) || [0, hex])[1];
  toast(`${finScope === "house" ? "Whole house" : roomName(room)}: ${ceil ? "ceiling" : finScope === "wall" ? `the ${FIN_NAMES[slot]} wall` : "walls"} ${hex ? nm : "as drawn"}`);
}
function finCard(id) {   // [title, now, buttons, -, the tray]
  const [, room, s] = id.split(":"), slot = +s, ceil = slot === 4, now = finGet(room, slot);
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
  if (on && !finHeld) { finHeld = FIN.pal.image.data.slice(); for (let i = 3; i < finHeld.length; i += 4) FIN.pal.image.data[i] = 0; }
  else if (!on && finHeld) { FIN.pal.image.data.set(finHeld); finHeld = null; }
  FIN.pal.needsUpdate = true; dirty();
}
if (act) {
  act.addEventListener("click", e => {
    const b = e.target.closest("[data-finc],[data-finsc],[data-finundo]"); if (!b || !actId || !actId.startsWith("fin:")) return;
    e.stopPropagation(); const [, room, s] = actId.split(":");
    if (b.dataset.finsc) finScope = b.dataset.finsc;
    else if (b.dataset.finundo) { const prev = FIN_UNDO.pop(); if (prev != null) { S.fin = JSON.parse(prev); finApplyAll(); store.set(KEY, S); toast("Undone"); } }
    else finSet(room, +s, b.dataset.finc || null);
    renderAct();
  }, true);
  act.addEventListener("change", e => { if (e.target.dataset.finany && actId && actId.startsWith("fin:")) { const [, room, s] = actId.split(":"); finSet(room, +s, e.target.value); renderAct(); } });
  act.addEventListener("pointerdown", e => { if (e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) act.addEventListener(ev, () => finHold(false));
  act.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && e.target.closest("[data-finhold]")) { e.preventDefault(); finHold(true); } });
  act.addEventListener("keyup", e => { if (e.target.closest("[data-finhold]")) finHold(false); });
}
