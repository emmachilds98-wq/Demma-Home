/* N304, the client (27 Nov 2026): "do a review of the bottom ui buttons to be better equipped for every room and not just for the living
   room ... make it fluid with other capabilities and functions". The dock follows where you are (dockSync, from brandPlace):
   the living room keeps its own panels; in any other room Room opens that room's card (its ideas, + a piece, taken out, changes, colours,
   lights), View its lights, Look its walls, ceiling and floor, Measure its sizes first; from outside Room is the garden's ideas; over a
   floor (no room yet) it steps aside. The same five buttons in every room, so nothing is learnt twice */
function dockRoom() {   // the house's room you're in (the living room too), or null: the whole house, a floor
  if (!R.HOUSE3 || !ROOMV()) return null; const r = (GS.RMODE === "stand" && GS.hereRoom) || VIEW_ROOM[S.view];
  return r && (r === LIVR || (R.HOUSE3.rooms || {})[r]) ? r : null;
}
const dockYard = () => typeof ixRoom === "function" && ixRoom() === "garden";
function dockSync() { try { dockSync1(); } catch (e) { /* called while the page's parts still load: the last line here runs it */ } }
function dockSync1() {
  const hv = document.body.classList.contains("hv"), room = hv ? dockRoom() : LIVR, house = !!room && room !== LIVR, yard = hv && !room && dockYard();
  document.body.classList.toggle("dock-room", house); document.body.classList.toggle("dock-none", hv && !room && !yard);
  const b = qs("#r3d-dt-room"); if (b) { const i = b.querySelector(".ms"), t = [...b.childNodes].find(n => n.nodeType === 3);
    if (i) i.textContent = yard ? "yard" : "chair"; if (t) t.textContent = yard ? "Garden" : "Room";
    b.title = yard ? "The garden's ideas" : house ? `${roomName(room)}: ideas, add a piece, changes` : "The living room: set-ups, the table, options"; }
  if (!house) return; const nm = roomName(room);
  const lh = qs("#r3d-lookhereh"); if (lh) lh.textContent = nm;
  const vh = qs("#r3d-viewhereh"); if (vh) vh.textContent = `The lights in the ${nm.toLowerCase().replace(/^the /, "")}`;
  dockMeasure(room);
}
function dockMeasure(room) {   // the room's sizes first in Measure, under the tape measure
  const p = qs("#r3d-dp-measure"); if (!p) return; const g = p.querySelector(`[data-mroom="${room}"]`);
  p.querySelectorAll(".ms-here").forEach(e => e.classList.remove("ms-here")); if (!g) return; g.classList.add("ms-here");
  const tape = p.querySelector("#r3d-measure"), first = tape && tape.closest(".grp"); if (first && first.nextElementSibling !== g) first.after(g);
}
function dockAt(room) {   // where + a piece goes: by you, in the room (Add a piece here takes the last tap's spot)
  const r = H3R(room); if (!r) return; const x = -camera.position.x / M, z = camera.position.z / M, inR = p => p && p[0] >= r[0] && p[0] <= r[1] && p[2] >= r[2] && p[2] <= r[3];
  if (!inR(TAPAT)) TAPAT = [Math.min(r[1] - 30, Math.max(r[0] + 30, x)), r[4], Math.min(r[3] - 30, Math.max(r[2] + 30, z))];
}
const dockMid = () => [stage.clientWidth / 2, stage.clientHeight * 0.3];
function dockOpen(id) { if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close(); if (GS.actId === id) { closeAct(); return; } openAct(id, dockMid()); }
function hereCard(room) {   // [title, how it is now, buttons]: a room's card from the dock
  if (!R.HOUSE3 || !H3R(room)) return null; const s = upSum(roomUps(room)), outs = roomOuts(room), ds = DS();
  return [roomName(room), s.n ? `${s.n} ${s.n === 1 ? "change" : "changes"}${s.hi ? " · " + upRange(s.lo, s.hi) : ""}` : "As planned", [
    ...(typeof ixRoom === "function" && ixRoom() === room ? [btn("Ideas", { hereix: room })] : []),
    ...(ds ? [btn("Add a piece", { hadd: room }), btn("Your own piece", { hownadd: room })] : []),
    ...(outs.length ? [btn(`Taken out (${outs.length})`, { actopen: "hout:" + room })] : []), ...upsBtn(room),
    btn("Walls", { actopen: `fin:${room}:0` }), btn("Floor", { actopen: `fin:${room}:5` }), btn("Lights", { actopen: "hlit:" + room }),
    GS.RMODE === "above" ? btn("Be there", { rmode: "stand" }) : btn("From above", { rmode: "above" })]];
}
function litCard(room) {   // a room's lights: its bulbs (warm to daylight), how bright, its fitting
  if (!R.HOUSE3 || !H3R(room)) return null; const fb = finBulb(room);
  return [`${roomName(room)}: the lights`, `${(FIN_BULBS.find(([v]) => v === (fb.k || "2700")) || [0, "Warm"])[1]} bulbs, ${((FIN_LUX.find(([v]) => +v === fb.lux) || [0, "normal"])[1]).toLowerCase()}`,
    [btn("Back to the room", { actopen: "here:" + room })], null, `<div class="r3d-fin"><span class="r3d-finlab">The bulbs</span>${finBulbTray(room)}${finFitTray(room)}</div>`];
}
document.addEventListener("click", e => {   // Room in a house room or the garden: its card, not the living room's panel (before DRAWER_JS's own)
  const b = e.target.closest("#r3d-dt-room"); if (!b || !document.body.classList.contains("hv")) return;
  const room = dockRoom(); if (room === LIVR) return; e.stopImmediatePropagation(); e.preventDefault();
  if (room) { dockAt(room); dockOpen("here:" + room); } else if (dockYard()) { if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close(); ixOpen("garden"); }
}, true);
root.addEventListener("click", e => {   // the panels' This room buttons: View's lights, Look's walls, ceiling and floor
  const b = e.target.closest("[data-herecard]"); if (!b) return; const room = dockRoom(); if (!room || room === LIVR) return;
  const k = b.dataset.herecard; dockOpen(k === "lit" ? "hlit:" + room : `fin:${room}:${k}`);
});
if (act) act.addEventListener("click", e => {   // the room card's Ideas: the room's set-ups, as the Ideas pill
  const b = e.target.closest("[data-hereix]"); if (!b || performance.now() - actAt < 350) return; e.stopPropagation(); ixOpen(b.dataset.hereix);
}, true);
window.addEventListener("demma-tools", () => { const r = dockRoom(); if (r && r !== LIVR) dockMeasure(r); });
dockSync();
