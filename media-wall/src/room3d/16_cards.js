/* ---------------------------------------------------------------- v30, client: "make function so say i click the dining cabinet i can
   manage options to open it, close it etc as goes for drawers and other items i can interact with". A tap on the room (not a drag, not
   in Edit room) finds what's under it and opens a card of what it can do. The card's buttons are the room's own controls (data-dining,
   data-chairs, data-drawers, data-tog...), so they work, and stay in step with the Tools panel, exactly as its buttons do. */
const act = qs("#r3d-act");
let actId = null, actXY = null, tapDown = null, TAPAT = null;
const clippedAt = h => [].concat(h.object.material).some(m => m && m.clippingPlanes === CLIP) && CLIP.every(pl => pl.distanceToPoint(h.point) < 0);   // the cutaway hides what's on the far side of both planes (V2.38: only what it cuts: from out front, the front door was let through to the hall behind)
const under = (o, g) => { if (!g) return false; for (; o; o = o.parent) if (o === g) return true; return false; };
function pickItem(e) {
  ray.setFromCamera(ndc(e), camera);
  const cutAway = q => RPLANES.some(pl => pl.distanceToPoint(q) < 0);             // v71: not what a room's view has cut away
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h) && !(selBox && h.object === selBox) && !cutAway(h.point));
  if (!hit) return null;
  const o = hit.object, p = hit.point; TAPAT = [-p.x / M, p.y / M, p.z / M];   // V2.46: where a floor was tapped (Add a piece here)
  const near = (obj, r) => !!obj && obj.getWorldPosition(new THREE.Vector3()).distanceTo(p) < r * M;
  const BL = HPARTS.bed_lift;                                                    // v71: the master's ottoman bed: its card
  if (BL && houseG && houseG.visible) { const bx = new THREE.Box3().setFromObject(BL.g); bx.min.y -= 0.6; bx.expandByScalar(0.03); if (bx.containsPoint(p)) return "hbed"; }
  if (houseG && houseG.visible) for (const [k, P] of Object.entries(HPARTS)) if (k.startsWith("door.") && under(o, P.g)) return "hdoor:" + k;   // V1.26
  if (houseG && houseG.visible && o.material && /^blind/.test(o.material.userData.hk || "")) return "hblinds";   // V1.47: a blind (or its roller): its card
  if (houseG && houseG.visible && DS() && under(o, houseG)) { const k = housePiece([hit], q => cutAway(q)); if (k && HIT(k)) return "hitem:" + k; }   // V1.50: a piece: its size
  if (houseG && houseG.visible && under(o, houseG)) { const fa = finAt(hit); if (fa) return "fin:" + fa.room + ":" + fa.slot; }   // V2.6 (FINISHES F3): a wall or a ceiling: its colour
  if (HPARTS["door.living_door"] && under(o, livLeaf)) return "hdoor:door.living_door";   // V1.38: the living room's side of its door
  { const ud = (o.material && !Array.isArray(o.material) && o.material.userData) || {};   // N5 (REAL_PLAN R7): the living room's walls, ceiling and skirting: the house's colours card
    if (ud.hk === "stairpaint" || (ud.ratio !== undefined && (under(o, shell) || under(o, fixtures)))) { const ch = ud.hk ? "w:stairs" : ud.ch;
      return "fin:living:" + (ch === "ceil" ? 4 : ch === "trim" ? 17 : ch.startsWith("w:") ? 11 + Math.max(0, LIV_W.indexOf(ch.slice(2))) : 0); } }
  if (S.site === "C" && under(o, cab)) return "cab";
  if (under(o, lamp)) return "lamp";
  if (under(o, bar1)) return "bar1";
  if (under(o, bar2)) return "bar2";
  if (under(o, curtOpen) || under(o, curtShut)) return "curtains";
  if (o === tvScreen) return "tv";
  if (o === lboxFace) return "lbox";
  if (under(o, pcGlow)) return "pc";
  for (const g of Object.values(BES)) if (under(o, g)) return "beside";       // v34: more things work from a tap
  const obj = g => (g && g.isObject3D ? g : g && g.pivot);                  // a floor suggestion is a movable (its pivot)
  for (const [k, g] of Object.entries(IDEA_G)) if (under(o, obj(g))) return "id:" + k;
  for (const [k, g] of Object.entries(SUGG_G)) if (under(o, obj(g))) return "sg:" + k;
  if (MOV.records && under(o, MOV.records.pivot)) return "records";
  let m = o; while (m && !m.userData.movId) m = m.parent;
  if (m && MOV[m.userData.movId]) return "mov:" + m.userData.movId;
  for (const [k, g] of Object.entries(G)) if (under(o, g)) {
    if (k === "unit_in" || k === "unit_out") return "wall";
    if (k === "now_ledge") return "nowplay";                                   // v39: the LP facing out on the ledge
    if (/^[AB]_/.test(k)) return "table";
    if (near(tvScreen, 70)) return "tv";                                       // the TV's own frame and stand are in the room's fixed parts
    if (near(lboxFace, 30)) return "lbox";
    if (near(pcLight, 40)) return "pc";
    return null;
  }
  return null;
}
const btn = (label, attrs, on, cls, aria) => ({ label, attrs, on, cls, aria });
/* V2.46 (N7): a swap's card (‹ › through the pieces of its kind, yours first) and an added piece's (‹ › through the catalogue, a row of its
   kinds to jump to); each press shows it in the room at once */
const HCAT_ADD = ["plant", "snake", "monstera", "olive", "armchair", "sidetable", "floorlamp", "rug", "bookcase", "cubes", "ladder", "chest3", "chest6", "tallboy", "bsdrawer", "bswhite", "bslegs",
  "desklegs", "deskdrawers", "trestle", "bench", "pouffe", "wardrobe2", "sliding", "openrail", "divan", "oakbed", "metalbed"];
function hcatCard(id) {
  const k = id.split(":")[1], it = HIT(k); if (!it) return null;
  const nav = (i, at) => [btn("‹", { [at]: `${k}:${i - 1}` }, false, "q", "The one before"), btn("›", { [at]: `${k}:${i + 1}` }, false, "q", "The next one")];
  if (id.startsWith("hswap:")) { const kind = swapKind(k); if (!kind) return null;
    const L = [null, ...hcOf(kind)], i = Math.max(0, L.indexOf(pieceNow(k).swap)), C = HCAT[L[i]];
    return [C ? C.n : it.n + " (yours)", `${HCAT_KINDS[kind]} · ${i + 1} of ${L.length} · ${C ? C.src : "as planned"}`, [...nav(i, "hswapgo"), btn("Keep it", { actopen: "hitem:" + k }, true)]]; }
  if (it.look) { const L = plantKeys(), i = Math.max(0, L.indexOf(it.add)), C = HCAT[it.add];   // N5: a room's plant, from Look
    return [C.n, `${roomName(it.look)}'s plant · ${i + 1} of ${L.length} · ${C.src}`, [...nav(i, "haddgo"), btn("Keep it", { actopen: "hitem:" + k }, true), btn("Remove", { hremove: k })]]; }
  const i = Math.max(0, HCAT_ADD.indexOf(it.add)), C = HCAT[it.add];
  return [C.n, `${i + 1} of ${HCAT_ADD.length} · ${C.src}`, [...nav(i, "haddgo"), btn("Keep it", { actopen: "hitem:" + k }, true), btn("Remove", { hremove: k })], null,
    `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Kinds">${Object.entries(HCAT_KINDS).map(([q, t]) => `<button type="button" data-hcatk="${k}:${q}" aria-pressed="${C.k === q}">${t}</button>`).join("")}</div></div>`];
}
/* N23 (REAL_PLAN section 7), the client: "helps me keep track and plan those upgrades": a room's card of its changes (Look's and Edit's),
   each a tap to tick done, with a rough cost; Plan has the house's total, room by room. Ticks in dh-done (Measure's Send carries them, N118), a tick's key
   carries the choice, so a new choice starts unticked. Costs E: typical UK retail and trade prices, Nov 2026, a room's floor by its area */
const UPC = { walls: [40, 80], wall: [15, 35], ceil: [20, 40], skirt: [15, 35], bulbs: [10, 30], rug: [40, 160], curt: [30, 100], bed: [25, 70], pic: [15, 60],
  frames: [150, 600], door_out: [30, 150], door: [150, 500], window: [400, 1500],
  floor: { carpet_grey: [20, 45], carpet: [20, 45], laminate: [20, 40], oak: [50, 90], pine: [30, 60], tile_f: [35, 70], marble: [80, 150], quarry: [45, 85], herring: [70, 115], lvt_grey: [45, 75], porcelain: [60, 110] },   // a m², laid (N56: fit.SOURCES upfloors)
  fit: { bare: [5, 15], drum: [20, 60], globe: [25, 70], dome: [15, 45], spots: [40, 120] },
  kind: { bed: [200, 550], wardrobe: [150, 450], chest: [60, 220], bedside: [30, 100], desk: [60, 220], shelves: [40, 160], seat: [100, 350], plant: [10, 45], more: [25, 120] },
  piece: { sofa3: [449, 590], dresser: [155, 200], tvbench: [120, 185] },   // N58: each its own (fit.SOURCES hcmore2), delivery in the top
  plant: { plant: [35, 90], snake: [15, 40], monstera: [30, 90], olive: [60, 160] },   // N40: each plant in its pot, as big as the catalogue's
  paper: [10, 200], panel: [40, 300] };   // N57: on top of the packs: glue, caulk, paint, up to a carpenter's day   // N40: on top of the rolls (the tray's count and price): paste and a brush, up to a decorator's day
const UPK = "dh-done";
const upDone = () => { try { return JSON.parse(localStorage.getItem(UPK) || "{}") || {}; } catch (e) { return {}; } };
const upNm = (L, k) => (L.find(r => r[0] === k) || [0, k])[1];
const upCat = (key, C) => UPC.piece[key] || C.k === "plant" && UPC.plant[key] || UPC.kind[C.k];
function roomUps(room) {   // [{k, t, lo, hi}]: what's changed in a room
  const H = R.HOUSE3 || {}, L = [], add = (k, t, c = [0, 0], n = 1) => L.push({ k, t, lo: Math.round(c[0] * n), hi: Math.round(c[1] * n) });
  if (room === "outside") { const o = (S.fin || {}).outside || {};
    if (o[9]) add("9=" + o[9], "Window frames: " + finName(o[9]), UPC.frames); if (o[10]) add("10=" + o[10], "Front door: " + finName(o[10]), UPC.door_out); return L; }
  const liv = room === LIVR, o = liv ? Object.assign({}, (S.fin || {})[LIVR], livRow()) : (S.fin || {})[room] || {}, r = (H.rooms || {})[room], m2 = r ? (r[1] - r[0]) * (r[3] - r[2]) / 1e4 : 12;
  if (liv) {   // the living room's own Look, and its ideas and suggestions not in the plan
    const ws = Object.entries(S.walls).filter(([, v]) => LIV_HEX.test(v || ""));
    if (S.paint !== DEF.paint) add("p=" + paintHex(), "Walls: " + finName(paintHex()), UPC.walls);
    ws.forEach(([w, v]) => add(`w${w}=${v}`, `${(WALLS.find(q => q[0] === w) || [0, w])[1]}: ${finName(v)}`, UPC.wall));
    if (o[4]) add("4=" + o[4], "Ceiling: " + finName(o[4]), UPC.ceil); if (o[17]) add("17=" + o[17], "Skirting and door: " + finName(o[17]), UPC.skirt);
    for (const k of Object.keys(DEF.decor)) if (S.decor[k] !== DEF.decor[k] && PD.decor[k]) { const c = k === "rug" ? UPC.rug : k === "curtains" ? UPC.curt : k === "cushions" && PD.ideas.cushions ? PD.ideas.cushions.slice(1) : [0, 0];
      add(`d${k}=${S.decor[k]}`, `${PD.decor[k][0]}: ${PD.decor[k][1][S.decor[k]] || S.decor[k]}`, c); }
    picks().filter(i => !i.plan && i.kind !== "Decor").forEach(i => add("i=" + i.name, i.name, [i.lo, i.hi]));
  } else {
    const ws = [0, 1, 2, 3].filter(s => o[s]);
    if (ws.length) add("w=" + ws.map(s => o[s]).join(), "Walls: " + [...new Set(ws.map(s => finName(o[s])))].join(", "), ws.length > 1 ? UPC.walls : UPC.wall);
    if (o[4]) add("4=" + o[4], "Ceiling: " + finName(o[4]), UPC.ceil);
    if (o[5]) add("5=" + o[5], "Floor: " + upNm(FIN_FLOORS, o[5]), UPC.floor[o[5]] || [30, 60], m2);
    if (o[18]) add("18=" + o[18], o[18] === "none" ? "Rug: none" : "Rug: " + upNm(FIN_RUGS, o[18]), o[18] === "none" ? [0, 0] : UPC.rug);
    if (o[19]) add("19=" + o[19], "Curtains: " + upNm(FIN_CURT, o[19]), UPC.curt);
    if (o[20]) add("20=" + o[20], "Bedding: " + upNm(FIN_BED, o[20]), UPC.bed);
    if (o[21]) add("21=" + o[21], "Picture: " + upNm(FIN_PICS, o[21]), UPC.pic);
    if (o[23] && HCAT[o[23]]) add("23=" + o[23], "Plant: " + HCAT[o[23]].n, UPC.plant[o[23]] || UPC.kind.plant);
    const P = FIN_PAPERS.find(([q]) => q === o[24]), A = PAPER_AT[room];   // N40: the rolls as the 3D counted them (3 to 6 till it's laid)
    if (P) add(`24=${P[0]}${o[25] || 0}`, `Wallpaper: ${P[1]}${A ? `, ${A.rolls} rolls` : ""}`, A ? [A.cost + UPC.paper[0], A.cost + UPC.paper[1]] : [P[5] * 3, P[5] * 6]);
    const Q = FIN_PANELS.find(([q]) => q === o[26]), B = PANEL_AT[room];   // N57: the packs as the 3D counted them
    if (Q) add(`26=${Q[0]}${o[27] || 0}`, `Panelling: ${Q[1]}${B ? `, ${B.packs} ${Q[0] === "slat" ? "panels" : "packs"}` : ""}`, B ? [B.cost + UPC.panel[0], B.cost + UPC.panel[1]] : [Q[2] * 2, Q[2] * 8]);
  }
  if (o[6] || o[7]) add(`6=${o[6]}${o[7]}`, "Bulbs: " + [o[6] && upNm(FIN_BULBS, o[6]), o[7] && upNm(FIN_LUX, o[7])].filter(Boolean).join(", "), UPC.bulbs);
  if (o[8]) add("8=" + o[8], "Light: " + upNm(FIN_FITS, o[8]), UPC.fit[o[8]]);
  if (DS()) for (const [id, it] of Object.entries(H.items || {})) {   // Edit: the house's pieces in this room, moved, swapped, added or taken out
    if (it.r !== room || it.look || !(it.add || pieceDelta(id).some(Boolean))) continue; const c = pieceNow(id), C = HCAT[it.add || c.swap];
    if (c.removed) add(id + "~x", "Out: " + it.n);
    else if (it.add && C) add(id + "~a=" + it.add, "Added: " + C.n, upCat(it.add, C));
    else if (c.swap && C) add(id + "~s=" + c.swap, `${it.n}: ${C.n}`, upCat(c.swap, C));
    else { const [, dW, dH] = pieceDelta(id), op = it.op && (dW || dH);
      add(`${id}~m=${[c.w, c.h, c.up, c.along, c.out, c.turn].map(cmR).join()}`, (op ? "Resized: " : "Moved: ") + it.n, op ? UPC[it.k] || UPC.door : [0, 0]); }
  }
  const D = upDone(); L.forEach(u => { u.done = !!D[room + "|" + u.k]; }); return L;
}
const upRange = (lo, hi) => hi ? `£${lo.toLocaleString("en-GB")}${hi > lo ? "–" + hi.toLocaleString("en-GB") : ""}` : "";
function upSum(L) { return { n: L.length, d: L.filter(u => u.done).length, lo: L.reduce((a, u) => a + u.lo, 0), hi: L.reduce((a, u) => a + u.hi, 0) }; }
const upRooms = () => R.HOUSE3 ? [...new Set(["outside", LIVR, ...Object.keys(R.HOUSE3.rooms || {})])].filter(r => r === "outside" || roomName(r)) : [];
function upsCard(room) {
  const L = roomUps(room), s = upSum(L);
  return [`${room === "outside" ? "Outside" : roomName(room)}: changes`, L.length ? `${s.d} of ${s.n} done${s.hi ? " · " + upRange(s.lo, s.hi) : ""}` : "Nothing changed yet",
    [btn("All rooms", { upsall: "1" })], null,
    `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Tap one when it's done">${L.map(u => `<button type="button" data-updone="${encodeURIComponent(u.k)}" aria-pressed="${u.done}">${u.done ? "✓ " : ""}${u.t}${u.hi ? ` · ${upRange(u.lo, u.hi)}` : ""}</button>`).join("")}</div></div>`];
}
const upsBtn = room => { const n = room && roomUps(room).length; return n ? [btn(`Changes (${n})`, { actopen: "ups:" + room })] : []; };
function upsAll() {   // [rows a room, the house's total]: Plan's and Measure's (N40) the same
  const rows = upRooms().map(r => [r, upSum(roomUps(r))]).filter(([, s]) => s.n);
  return [rows, rows.reduce((a, [, s]) => ({ n: a.n + s.n, d: a.d + s.d, lo: a.lo + s.lo, hi: a.hi + s.hi }), { n: 0, d: 0, lo: 0, hi: 0 })]; }
function upsPlan() {   // Plan: the house's total, a row a room (tap: stand in it, its card open)
  const box = document.getElementById("ups-l"), tot = document.getElementById("ups-tot"); if (!box || !tot || !R.HOUSE3) return;   // the Plan sheet: outside the 3D's root
  const [rows, T] = upsAll();
  tot.textContent = T.n ? `${upRange(T.lo, T.hi) || "£0"} · ${T.d} of ${T.n} done` : "none yet";
  box.innerHTML = rows.length ? rows.map(([r, s]) => `<li data-upsroom="${r}" role="button" tabindex="0"><span class="mn">${r === "outside" ? "Outside" : roomName(r)} · ${s.d}/${s.n}</span><span class="mb"><i style="width:${(s.d / s.n * 100).toFixed(0)}%"></i></span><span class="mv">${upRange(s.lo, s.hi) || "£0"}</span></li>`).join("")
    : '<li><span class="mn">Tap a wall, a floor or a piece in a room to change it</span></li>';
  window.dispatchEvent(new CustomEvent("demma-ups"));   // N119: Plan's hello, rings and next three follow
}
window.DemmaUps = () => { if (!R.HOUSE3) return null;   // N119: the house's changes for Plan's home (page.js), and the next room with some not done
  const [rows, T] = upsAll(), nx = rows.find(([, s]) => s.d < s.n);
  return { T, range: upRange(T.lo, T.hi), next: nx && { room: nx[0], name: nx[0] === "outside" ? "Outside" : roomName(nx[0]), d: nx[1].d, n: nx[1].n, range: upRange(nx[1].lo, nx[1].hi) } }; };
{ const sh = document.getElementById("sh-plan"); if (sh) new MutationObserver(() => { if (sh.classList.contains("open")) upsPlan(); }).observe(sh, { attributes: true, attributeFilter: ["class"] }); }
{ const mp = document.getElementById("r3d-dp-measure"); if (mp) new MutationObserver(() => { if (!mp.hidden) finTakes(); }).observe(mp, { attributes: true, attributeFilter: ["hidden"] }); }   // N40: Measure's total, fresh
document.addEventListener("click", e => { const li = e.target.closest("[data-upsroom]"); if (li) upsGo(li.dataset.upsroom); });
document.addEventListener("keydown", e => { const li = e.key === "Enter" && e.target.closest && e.target.closest("[data-upsroom]"); if (li) upsGo(li.dataset.upsroom); });
function upsGo(room) {
  window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "room" } }));
  const card = () => setTimeout(() => openAct("ups:" + room, [stage.clientWidth / 2, stage.clientHeight * 0.3]), 120);
  if (ROOM_VIEW[room]) return goRoom(ROOM_VIEW[room], false, card);   // V3.23: once there (it may build first)
  if (room === "outside" && S.view !== "house") setView("house");
  card();
}
const MAKE_CARD = { recordtable: "mk-recordtable", ctable: "mk-ctable", wallcabs: "mk-wallcabs", alcoveshelves: "mk-alcove", doorshelf: "mk-doorshelf", shelfboxes: "mk-doorshelf" };   // v44
/* V3.80 (N149), the client (12 Nov): "Make sure anything that I can remove can be re added via the ui menu": in every room, as the
   living room's Room → Taken out: a room's floor card says what's out of it and puts each back (Measure's list and the toast still do) */
const roomOuts = rm => DS() && R.HOUSE3 ? Object.keys(R.HOUSE3.items || {}).filter(k => { const it = HIT(k); return it && it.r === rm && !it.add && pieceNow(k).removed; }) : [];
function actItems(id) {     // [title, how it is now, buttons]
  const folded = S.dining === "folded", lv = k => (S.lv[k] ?? 0) > 0;
  if (id === "hbed") { const P_ = HPARTS.bed_lift, up = !!(P_ && (P_.tw ? P_.tw.to === 1 : P_.t > 0.5));   // v71, the client: the bed as a card, like the living room's
    return ["Ottoman bed", up ? "Lifted: four storage boxes inside" : "Pine; the base lifts from the foot", [
      btn(up ? "Lower the bed" : "Lift the bed", { hbed: up ? "down" : "up" }), ...(ROOMV() && RMODE !== "above" ? [btn("View from above", { rmode: "above" })] : [])], null, finBedTray("master")]; }   // N5d: its bedding
  if (id.startsWith("fin:")) { const c = finCard(id), [, rm, sl] = id.split(":");   // V2.6: a wall's or a ceiling's colours (23_finish.js)
    if (c && sl === "5" && DS() && TAPAT && R.HOUSE3 && (R.HOUSE3.rooms || {})[rm] && rm !== "living") c[2].unshift(btn("Add a piece here", { hadd: rm }));   // V2.46 (N7): from the catalogue
    const outs = sl === "5" ? roomOuts(rm) : []; if (c && outs.length) c[2].splice(1, 0, btn(`Taken out (${outs.length})`, { actopen: "hout:" + rm }));   // V3.80 (N149): what's out of the room, to put back
    if (c) c[2].push(...upsBtn(rm));   // N23: the room's changes (N68: after the card's own buttons)
    return c; }
  if (id.startsWith("hout:")) { const rm = id.slice(5), outs = roomOuts(rm); if (!outs.length) return null;   // V3.80 (N149): a room's taken-out pieces, a tap each to put back
    return [`${roomName(rm)}: taken out`, outs.length === 1 ? "1 piece" : `${outs.length} pieces`, [...outs.map(k => btn("↩ " + HIT(k).n, { hputback: k })), ...(outs.length > 1 ? [btn("Put all back", { hputall: rm })] : [])]]; }
  if (id.startsWith("ups:")) return upsCard(id.slice(4));   // N23
  if (id.startsWith("hswap:") || id.startsWith("hadd:")) return hcatCard(id);   // V2.46 (N7): swap a piece, or which piece you've added
  if (id.startsWith("hitem:")) { const k = id.slice(6), it = HIT(k); if (!it) return null;   // V1.50: a piece in the house, its size
    const sw = pieceNow(k).swap;
    return [sw ? HCAT[sw].n : it.n, pieceLine(k), [btn(it.op ? "Change its size" : "Move or resize", { actopen: "hsize:" + k }), ...(it.add ? [btn(it.look ? "Change plant" : "Change piece", { actopen: "hadd:" + k })] : swapKind(k) ? [btn("Swap it", { actopen: "hswap:" + k })] : []),
      ...(pieceDelta(k).some(Boolean) && !it.add ? [btn("As planned", { hreset: k })] : []), ...(it.op ? [] : [btn("Take it out", { hremove: k })]),
      ...(it.k === "window" || /^(back|garage)_door$/.test(k) ? [btn("Colour outside", { actopen: "fin:outside:9" })] : []), ...upsBtn(it.r)], null,   // V2.38 (F12): its frame's outside
      it.k === "light" && it.r ? `<div class="r3d-fin"><span class="r3d-finlab">The bulbs</span>${finBulbTray(it.r)}${finFitTray(it.r)}</div>` : /\.bed$/.test(k) && it.r ? finBedTray(it.r) : null]; }   // N5d: a bed's bedding   // V2.9: a light's bulbs; V2.15: its fitting
  if (id.startsWith("hsize:")) { const k = id.slice(6), it = HIT(k); if (!it) return null; const c = pieceNow(k), door = it.k === "door";
    return [it.n, pieceLine(k), [btn("Done", { actopen: "hitem:" + k }), ...(canTurn(k) ? [btn("Turn", { hturn: k })] : []), ...(it.add ? [] : [btn("As planned", { hreset: k })])],
      FIELDS.filter(([f]) => !(door && (f === "h" || f === "up")) && !(f === "out" && it.op)).map(([f, t]) => [f, t, cmR(c[f])])]; }
  if (id === "hblinds") return ["The blinds", S.blinds ? "Down" : "Rolled up", [btn(S.blinds ? "Roll them up" : "Pull them down", { tog: "blinds" })]];   // V1.47
  if (id.startsWith("hdoor:")) { const k = id.slice(6), P = HPARTS[k]; if (!P) return null; const op = doorOpen(P);   // V1.26: a door's card
    const any = Object.entries(HPARTS).some(([q, Q]) => q.startsWith("door.") && doorOpen(Q));
    return [P.label || "The door", op ? (Math.abs(P.angle) < 89 ? "Open as far as it goes" : "Open") : "Shut", [
      btn(op ? "Shut it" : "Open it", { hdoor: k }), ...(k === "door.hall_porch" ? [btn("Colour outside", { actopen: "fin:outside:10" })] : []),   // V2.38 (F12)
      btn(any ? "Shut all doors" : "Open all doors", { hdoors: any ? "shut" : "open" }), ...(DS() && HIT(k.slice(5)) ? [btn("Change its size", { actopen: "hsize:" + k.slice(5) })] : [])]]; }
  if (id === "nowplay") return ["Now playing", `${NOWP[S.nowp % NOWP.length].name}`, [   // v39: which LP faces out
      btn("‹", { nowp: "-1" }, false, "q", "The one before"), btn("›", { nowp: "1" }, false, "q", "The next one"),
      btn("Your photo", { nowpic: "1" }), btn("Look at it", { view: S.plants === "breast" ? "corner" : "breast" })]];
  if (id === "measure") { const d = MEAS.d;                               // v39: measure in 3D
    return ["Measure", d ? `${d.toFixed(1)} cm between them (${MEAS.dh.toFixed(1)} across, ${MEAS.dv.toFixed(1)} up)` : MEAS.a ? "Tap the second point" : "Tap the first point", [
      btn("Measure again", { measure: "again" }), btn("Done", { measure: "done" })]]; }
  if (id.startsWith("opt:")) {                                            // v39: Try options' card: this place's options, ‹ › through them
    const [, pl, ix] = id.split(":"), L = placeOpts(pl); if (!L.length) return null;
    const i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i], on = optOn(it), firm = isFirm(it);
    return [it.title + (firm ? " (your plan)" : ""), `${g.title} · ${i + 1} of ${L.length} · ${it.size}${it.cost ? ` · £${it.cost[0]}–${it.cost[1]}` : ""}`, [
      btn("‹", { optcyc: `${pl}:${i - 1}` }, false, "q", "The one before"), btn("›", { optcyc: `${pl}:${i + 1}` }, false, "q", "The next one"),
      on ? btn("Keep it", { optkeep: "1" }, true) : btn("Try it", { optcyc: `${pl}:${i}` }),
      ...(it.aim ? [btn("See it", { optsee: g.k })] : []), btn("My plan", { optclear: "1" })]];
  }
  if (id === "cab" && S.site !== "C") id = "table";
  if (id === "table" && S.site === "C") id = "cab";
  if (id === "cab") {
    const d = cabDoors();
    const st = !folded ? `Open for ${S.dining}: the table is out` : d.table ? "Packed away, the table door open" : d.chairs ? "Packed away, the chair door open" : (S.cabw === "80" ? "Packed away: table and four chairs inside" : "Packed away: table and six chairs inside");
    return [S.cabw === "80" ? "The dining cabinet, 80-wide table" : "The dining cabinet", st, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded away" : "Fold it away", { dining: "folded" }, folded),
      ...(folded ? [btn(d.table ? "Shut the table door" : "Open the table door", { tdoor: d.table ? "shut" : "open" }),
                    btn(d.chairs ? "Shut the chair door" : "Open the chair door", { chairs: d.chairs ? "cupboard" : "open" })] : []),
      btn("Watch it open", { showopen: "1" }),
      btn(S.cabw === "80" ? "Show the 90-wide (plan)" : "Show the 80-wide", { cabw: S.cabw === "80" ? "90" : "80" }),
      btn("Look at it", { view: "dining" }), btn("How to make it", { actmk: "mk-cabinet" }), btn("Read about it", { actgo: "dining" })]];
  }
  if (id === "table") return [S.site === "A" ? "The flip-top on the breast (the alternative)" : "The flip-top by the stairs (the alternative)", folded ? "Folded" : `Open for ${S.dining}`, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded" : "Fold it", { dining: "folded" }, folded), btn("Show the dining cabinet", { site: "C" }), btn("Look at it", { view: "dining" })]];
  if (id === "wall") return ["The media wall", S.drawers ? "Every drawer pulled out" : "Drawers shut", [
      btn(S.drawers ? "Push the drawers in" : "Pull the drawers out", { drawers: S.drawers ? "in" : "out" }),
      btn(lv("bias") ? "TV off" : "TV on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"),
      btn("The LP on the ledge", { actopen: "nowplay" }),               // v39: "a now playing swap: tap the turntable"
      btn("Look at it", { view: "wall" }), btn("How to make it", { actmk: "mk-base" }), btn("Read about it", { actgo: "wall" })]];
  if (id === "tv") return ["The TV", lv("bias") ? "On, its bias light behind it" : "Off", [
      btn(lv("bias") ? "Turn it off" : "Turn it on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"), btn("Look at it", { view: "sofa" })]];
  if (id === "lamp" || id === "bar1" || id === "bar2") return fixCard(id, lv(id));
  if (id === "curtains") return ["The curtains", S.curtains ? "Drawn" : "Open", [btn(S.curtains ? "Open them" : "Draw them", { tog: "curtains" })]];
  if (id === "lbox") return ["OBEGRÄNSAD light box", S.lbox ? "On" : "Off", [btn(S.lbox ? "Turn it off" : "Turn it on", { tog: "lbox" })]];
  if (id === "pc") return ["Your PC", S.pc ? "Lit" : "Dark", [btn(S.pc ? "Lights off" : "Lights on", { tog: "pc" }), btn("Look at it", { view: "pc" }), btn("How to make it", { actmk: "mk-sidewall" }), btn("Read about it", { actgo: "side" })]];
  if (id === "beside") { const B = R.BESIDE, cur = S.beside;           // v34
    return ["Beside the cabinet", (B.opts[cur] || {}).name || cur, [
      ...Object.entries(B.opts).map(([k, o]) => btn(o.name, { beside: k }, cur === k)),
      ...(cur === "bar" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),   // v37
      ...(cur === "trolley" ? [btn(S.trolley === "out" ? (cabDoors().table ? "Park it (fold the table first)" : "Park it by the wall") : (cabDoors().table ? "Pull it out (fold the table first)" : "Pull it out"), { trolley: S.trolley === "out" ? "park" : "out" })] : []),
      ...(cur === "bar" ? [btn("How to make it", { actmk: "mk-bar" })] : []), btn("Look at it", { view: "beside" }), btn("Read about it", { actgo: "dining" })]]; }
  if (id === "records") return ["Vinyl stand", S.lp ? "Front records lifted out" : "Two face-out bays, LPs filed below", [
      btn(S.lp ? "Put the records back" : "Lift out the front records", { lp: S.lp ? "in" : "out" }),
      btn(S.ideas.clean ? "Remove the record caddy" : "Add a record caddy", { idea: "clean" }, !!S.ideas.clean),
      btn("Move it", { actedit: "records" }), btn("Take it out", { takeout: "mov:records" })]];
  if (id.startsWith("sg:") || id.startsWith("id:")) {
    const sg = id.startsWith("sg:"), k = id.slice(3), nm = ((sg ? PD.sugg : PD.ideas)[k] || [k])[0], it = sg && MOV["sg_" + k];
    if (!(sg ? S.sugg : S.ideas)[k]) return null;                        // taken away: the card closes
    const firm = R.FIRM && (sg ? R.FIRM.sugg : R.FIRM.ideas || []).includes(k);   // v38: the client's picks are the plan (v43: the C-table too)
    return [nm, firm ? "In your plan" : sg ? "An option, not costed" : "An idea, not costed", [
      ...(firm && MAKE_CARD[k] ? [btn("How to make it", { actmk: MAKE_CARD[k] })] : []),   // v44: its card in Build
      ...(k === "blind" ? [btn(S.blind === "up" ? "Pull it down" : "Roll it up", { blind: S.blind === "up" ? "down" : "up" })] : []),
      ...(k === "barcase" || k === "barside" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),
      ...(k === "liftcoffee" ? [btn(S.ctop ? "Put the top down" : "Lift the top", { ctop: S.ctop ? "down" : "up" })] : []),
      ...(k === "recordtable" ? [btn(S.ctop ? "Close the lid" : "Lift the lid", { ctop: S.ctop ? "down" : "up" })] : []),   // v38
      ...(k === "stairscurtain" ? [btn(S.scopen ? "Draw it across" : "Open it", { scopen: S.scopen ? "shut" : "open" })] : []),   // V3.31
      ...(k === "stairdrawers" ? [btn(S.sdraw ? "Push the drawers in" : "Pull the drawers out", { sdraw: S.sdraw ? "in" : "out" })] : []),   // v37
      ...(sg ? (SVAR[k] || []).map(([v, n]) => btn(n, { svar: `${k}:${v}` }, svarOf(k) === v)) : []),
      ...(it && !it.fixed ? [btn("Move it", { actedit: it.id })] : []), ...(k === "liftcoffee" || k === "recordtable" ? [btn("Move it", { actedit: "coffee" })] : []),
      btn("Take it out", { takeout: k === "liftcoffee" || k === "recordtable" ? "mov:coffee" : (sg ? "sugg:" : "idea:") + k }),   // V3.75: the table goes, not just its top (Room → Taken out)
      btn("Read about it", { actideas: (sg ? "sugg-" : "idea-") + k })]]; }
  if (id === "mov:pouf") return ["Storage ottoman", S.lid ? "Lid off: games in three layers, cards along one side" : "Navy velvet: games and cards inside", [   // v34
      btn(S.lid ? "Put the lid back" : "Lift the lid", { lid: S.lid ? "on" : "off" }), btn("Move it", { actedit: "pouf" }), btn("Take it out", { takeout: "mov:pouf" }), btn("Read about it", { actgo: "c-room" })]];
  if (id === "mov:sofa") return ["Your sofa", "Blue corduroy, as now", [   // V3.71: the swap is on its card
      btn("Try the green sofa bed", { sofa: "bed" }), btn("Move it", { actedit: "sofa" }), btn("Take it out", { takeout: "mov:sofa" }), btn("From above", { view: "plan" })]];
  if (id === "mov:sofa2" || id === "mov:chaise2") { const B = R.SOFABED, ch = id === "mov:chaise2", up = Object.values(S.hr || {}).some(Boolean);
    /* V3.75, client: "the sofa matches the listing ... with all its features ... Upgrade and improve ui cards": what it does first (the bed,
       the headrests, the stools), the five headrests a row of their own, each flipping up on its hinge; then the chaise, the show, moving
       it, taking it out, yours back and the listing itself */
    const heads = `<div class="r3d-fin"><span class="r3d-finlab">Headrests: tap one to flip it up or down</span><div class="r3d-finsc" role="group" aria-label="Headrests">${
      ["Arm seat", "Middle", "Corner", "Corner side", "Side end"].map((nm, i) => `<button type="button" data-hr="${i}" aria-pressed="${!!(S.hr && S.hr[i])}">${nm}</button>`).join("")}</div></div>`;
    if (ch) return ["Its storage chaise", `${B.chaise.w} × ${B.chaise.d}, ${B.chaise.h} high · the lid lifts on gas struts`, [
      btn(S.lid ? "Shut the chaise" : "Open the chaise", { lid: S.lid ? "on" : "off" }), btn("Move the chaise", { actedit: "chaise2" }), btn("Take the chaise out", { takeout: id }),
      btn("The sofa bed", { actopen: "mov:sofa2" })]];
    return [B.name, S.sbed ? "Bed pulled out, level with the seats" : `${B.w} × ${B.d}, ${B.h} high · seat ${B.seat_h} high, ${B.seat_d} deep · Blade Green`, [
      btn(S.sbed ? "Push the bed in" : "Pull the bed out", { sbed: S.sbed ? "in" : "out" }),
      btn(up ? "Headrests down" : "Headrests up", { hrall: up ? "down" : "up" }),
      btn(S.stools ? "Push the stools in" : "Pull the stools out", { stools: S.stools ? "in" : "out" }),   // V3.74
      btn(S.lid ? "Shut the chaise" : "Open the chaise", { lid: S.lid ? "on" : "off" }), btn("Watch the bed open", { showopen: "bed" }),
      btn("Move it", { actedit: "sofa2" }), btn("Take it out", { takeout: id }), btn("Back to my sofa", { sofa: "mine" }),
      btn("The listing", { actlink: "https://www.amazon.co.uk/dp/B0HDC8WYBT" }), btn("From above", { view: "plan" })], null, heads]; }
  if (id.startsWith("mov:")) { const it = MOV[id.slice(4)]; if (!it) return null;
    return [it.label.replace(/ \(suggested\)$/, ""), it.fixed ? "Built in: it comes off, but doesn't move" : `${Math.round(it.w)} × ${Math.round(it.d)} cm`, [   // V3.75: its size; turn or take it out from here
      btn(it.fixed ? "Take off or put back" : "Move it", { actedit: it.id }), ...(it.fixed || it.lamp ? [] : [btn("Turn it", { turnit: it.id })]), btn("Take it out", { takeout: "mov:" + it.id })]]; }
  return null;
}
/* v38: a fixture's card: on or off, turn it as a whole (15° a tap, 5° with Shift held), then one head at a time */
const actHead = { bar1: 0, bar2: 0, lamp: 0 };
function headNames(id) {
  if (id === "lamp") return ["Top (green)", "Middle (pink)", "Bottom (purple)"];
  const spec = id === "bar1" ? R.BAR1 : (bar2 && bar2.userData.spec) || R.BAR1, names = { "#a9c7ab": "Sage", "#a7d0d8": "Blue", "#e8b53f": "Mustard", "#e79c95": "Pink" };
  return spec.heads.map((h, i) => names[(h.col || "").toLowerCase()] || `Head ${i + 1}`);
}
/* v39 (item 6's floor line): while a fixture's card is open, a line from its chosen head to where its beam lands, and a ring there */
const AIMG = { g: null, k: "" };
function clearAim() { if (AIMG.g) { scene.remove(AIMG.g); AIMG.g.traverse(o => o.geometry && o.geometry.dispose()); AIMG.g = null; AIMG.k = ""; dirty(); } }
function showAim(k) {
  clearAim(); const id = k.split(":")[0], l = (lights[id] || []).find(x => x.userData.hk === k); if (!l || !l.isSpotLight) return;
  scene.updateMatrixWorld(); const p = l.getWorldPosition(new THREE.Vector3()), dir = l.target.getWorldPosition(new THREE.Vector3()).sub(p).normalize();
  const near0 = ray.near; ray.set(p, dir); ray.near = 0.2;
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && h.object.material !== measMat && !clippedAt(h)); ray.near = near0;
  const end = hit ? hit.point : p.clone().addScaledVector(dir, p.y / Math.max(0.05, -dir.y)), len = end.distanceTo(p);
  const g = AIMG.g = new THREE.Group(); g.renderOrder = 998;
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, len, 6), measMat); line.position.copy(p).add(end).multiplyScalar(0.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); line.renderOrder = 998; g.add(line);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 32), measMat), nrm = hit && hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
  ring.position.copy(end).addScaledVector(nrm, 0.005); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm); ring.renderOrder = 998; g.add(ring);
  scene.add(g); AIMG.k = k; dirty();
}
function fixCard(id, on) {
  const d = fixDeg(id), names = headNames(id), i = Math.min(actHead[id] || 0, names.length - 1), k = `${id}:${i}`, h = headOf(k);
  requestAnimationFrame(() => { if (actId) showAim(k); });                 // v39: where this head lands
  const ci = HEAD_COLS.findIndex(c => c[0] === (h.col || null)), aim = [h.yaw ? `${h.yaw > 0 ? "right" : "left"} ${Math.abs(h.yaw)}°` : "", h.tilt ? `${h.tilt > 0 ? "up" : "down"} ${Math.abs(h.tilt)}°` : ""].filter(Boolean).join(", ");
  const st = `${on ? "On" : "Off"} · ${d ? `turned ${d}°` : "at the plan's angle"} · ${names[i]}: ${h.on === false ? "off" : `${h.lv ?? 100}%`}${aim ? `, aimed ${aim}` : ""}`;
  return [FIX_NAME[id], st, [
    btn(on ? "Turn it off" : "Turn it on", { layer: id + ":" + (on ? "off" : "on") }),
    { sep: "Turn the whole fixture" },
    btn("⟲ 15°", { fixturn: `${id}:-15` }, undefined, "sm", "Turn it 15° anticlockwise (Shift: 5°)"), btn("⟳ 15°", { fixturn: `${id}:15` }, undefined, "sm", "Turn it 15° clockwise (Shift: 5°)"),
    ...(d || Object.keys(S.head).some(x => x.startsWith(id + ":")) ? [btn("Reset", { fixreset: id }, undefined, "sm", "Back to the plan's angle and aims")] : []),
    { sep: "Each head" },
    ...names.map((n, j) => btn(n, { headsel: `${id}:${j}` }, j === i)),
    { sep: names[i] },
    btn(h.on === false ? "On" : "Off", { headtog: k }, undefined, "sm", h.on === false ? "Switch this head on" : "Switch this head off"),
    btn("−", { headlv: `${k}:-20` }, undefined, "sm", "Dim this head"), btn("+", { headlv: `${k}:20` }, undefined, "sm", "Brighten this head"),
    btn("←", { headaim: `${k}:yaw:-10` }, undefined, "q", "Aim it left"), btn("→", { headaim: `${k}:yaw:10` }, undefined, "q", "Aim it right"),
    btn("↑", { headaim: `${k}:tilt:10` }, undefined, "q", "Aim it up"), btn("↓", { headaim: `${k}:tilt:-10` }, undefined, "q", "Aim it down"),
    btn(`Colour: ${HEAD_COLS[Math.max(0, ci)][1]}`, { headcol: k }),
    ...(id === "lamp" ? [btn("Move it", { actedit: "lamp" }), btn("Take it out", { takeout: "mov:lamp" })] : [])]];
}
function fixAct(d, fine) {             // the card's fixture and head buttons; true if one was handled
  const keyOf = v => v.split(":").slice(0, 2).join(":"), edit = (k, f) => { const h = Object.assign({}, headOf(k)); f(h); if (Object.keys(h).length) S.head[k] = h; else delete S.head[k]; };
  if (d.fixturn) { const [id, st] = d.fixturn.split(":"); const step = fine ? Math.sign(+st) * 5 : +st; S.fix[id] = (((fixDeg(id) + step) % 360) + 540) % 360 - 180; if (!S.fix[id]) delete S.fix[id]; }
  else if (d.fixreset) { delete S.fix[d.fixreset]; for (const k of Object.keys(S.head)) if (k.startsWith(d.fixreset + ":")) delete S.head[k]; }
  else if (d.headsel) { const [id, i] = d.headsel.split(":"); actHead[id] = +i; renderAct(); return true; }
  else if (d.headtog) edit(d.headtog, h => { if (h.on === false) delete h.on; else h.on = false; });
  else if (d.headlv) { const k = keyOf(d.headlv), st = +d.headlv.split(":")[2]; edit(k, h => { const v = Math.max(0, Math.min(100, (h.lv ?? 100) + st)); if (v === 100) delete h.lv; else h.lv = v; if (v > 0) delete h.on; }); }
  else if (d.headaim) { const [id, i, ax, st] = d.headaim.split(":"), k = `${id}:${i}`, lim = ax === "tilt" ? 60 : 90;
    edit(k, h => { const v = Math.max(-lim, Math.min(lim, (h[ax] || 0) + (fine ? Math.sign(+st) * 5 : +st))); if (v) h[ax] = v; else delete h[ax]; }); }
  else if (d.headcol) edit(d.headcol, h => { const ci = HEAD_COLS.findIndex(c => c[0] === (h.col || null)), nx = HEAD_COLS[(Math.max(0, ci) + 1) % HEAD_COLS.length][0]; if (nx) h.col = nx; else delete h.col; });
  else return false;
  applyState(); syncButtons(); return true;
}
/* N68 (REAL_PLAN section 15), the client: "go through UI areas and info also and review how to improve and clean up these areas": every
   card the same shape: its name, how it is now, its main tray, three buttons, then More (the other buttons and trays: a wall's curtains,
   picture, wallpaper and panelling, a floor's rug and plant); a card never runs past the top pills or the dock: it scrolls inside */
function renderAct() {
  const items = actId && actItems(actId);
  if (!items) { closeAct(); return; }
  const [title, st, bs, fields, tray, extra] = items;
  qs("#r3d-act-h").textContent = title; qs("#r3d-act-st").textContent = st;
  qsa(".r3d-actmore", act).forEach(m => m.remove());
  const box = qs("#r3d-acts"); box.textContent = "";
  qsa(".r3d-actfields").forEach(m => m.remove()); qsa(".r3d-fin", act).forEach(m => m.remove());
  if (tray) { const w = document.createElement("div"); w.innerHTML = tray; box.before(w.firstElementChild); }   // V2.6: a wall's colours
  if (fields) { const w = document.createElement("div"); w.className = "r3d-actfields";   // V1.50: a piece's sizes, a stepper each
    w.innerHTML = fields.map(([f, t, v]) => `<div class="fld"><span>${t}</span><span class="stp"><button type="button" data-hstep="${f}" data-by="-1" aria-label="${t}: 1 cm less">−</button>`
      + `<input type="number" inputmode="decimal" step="1" value="${v}" data-hfield="${f}" aria-label="${t} in cm"><button type="button" data-hstep="${f}" data-by="1" aria-label="${t}: 1 cm more">+</button></span></div>`).join("")
      + `<p class="note">${DS() && DS().mode === "shared" ? "Saved for you both" : "Saved on this device"}</p>`;
    box.before(w); }
  if (/^(hitem|hsize|hswap|hadd):/.test(actId)) selOf(actId.split(":")[1]); else clearSel();
  // v39 (the approved redesign): a card shows its first three buttons; everything else sits under More
  let shownN = 0, more = null;
  const fold = () => { if (!more) { more = document.createElement("details"); more.className = "r3d-actmore"; more.open = actMoreOpen;
    more.innerHTML = '<summary>More</summary><div class="acts"></div>'; more.addEventListener("toggle", () => { actMoreOpen = more.open; placeAct(); }); box.after(more); }
    return more.querySelector(".acts"); };
  if (extra) { const w = document.createElement("div"); w.innerHTML = extra; fold().before(w.firstElementChild); }
  for (const b of bs) {
    const into = shownN >= 3 ? fold() : box;
    if (b.sep) { const h = document.createElement("span"); h.className = "r3d-actsep"; h.textContent = b.sep; into.appendChild(h); continue; }   // v38
    shownN++;
    const el = document.createElement("button"); el.type = "button"; el.textContent = b.label;
    for (const [k, v] of Object.entries(b.attrs)) el.dataset[k] = v;
    if (b.cls) el.className = b.cls; if (b.aria) { el.setAttribute("aria-label", b.aria); el.title = b.aria; }
    if (b.on !== undefined) el.setAttribute("aria-pressed", String(!!b.on));
    into.appendChild(el);
  }
  if (more && !fold().children.length) fold().remove();
  qsa(".acts", act).forEach(a => { a.style.maxHeight = "none"; a.style.overflowY = "visible"; });   // the card scrolls as one, not a box in it
  placeAct();
}
function placeAct() {
  if (!actXY || act.hidden) return;
  act.style.maxHeight = ""; act.style.overflowY = "";
  const sr = stage.getBoundingClientRect(), sw = stage.clientWidth, sh = stage.clientHeight, sheet = matchMedia("(max-width: 899px)").matches;   // a phone's card is a sheet over the dock (room3d_page.py)
  let top0 = 12;   // clear of the brand, Plan · Build · Buy and the view's pills
  for (const el of document.querySelectorAll(".brand, .hnav, .r3d-mini")) { const r = el.getBoundingClientRect(); if (r.height && r.top - sr.top < sh / 3) top0 = Math.max(top0, r.bottom - sr.top + 8); }
  const fit = room => { if (act.offsetHeight > room) { const cs = getComputedStyle(act); act.style.maxHeight = Math.max(160, room - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) + "px"; act.style.overflowY = "auto"; } };
  if (sheet) { fit(act.getBoundingClientRect().bottom - sr.top - top0); return; }
  fit(sh - 90 - top0);
  const pw = act.offsetWidth || 300, ph = act.offsetHeight || 200;
  const left = Math.max(12, Math.min(sw - pw - 12, actXY[0] - pw / 2));
  const below = actXY[1] + 22 + ph < sh - 90, top = Math.max(top0, Math.min(sh - 90 - ph, below ? actXY[1] + 22 : actXY[1] - ph - 22));
  act.style.left = left + "px"; act.style.top = top + "px"; act.style.setProperty("--ax", (actXY[0] - left) + "px");
  act.classList.toggle("above", !below);
}
addEventListener("resize", () => { if (actId) placeAct(); });
let actMoreOpen = false;
function openAct(id, xy) {
  if (popId) closePop(); clearAim();
  if (String(id).split(":").slice(0, 2).join(":") !== String(actId || "").split(":").slice(0, 2).join(":")) actMoreOpen = false;   // v39: a new card opens folded
  actId = id; actXY = xy; act.hidden = false; actAt = performance.now(); root.classList.add("actopen"); renderAct();   // V2.6: (the figure steps aside on a phone)
  if (!act.hidden) { const f = qs("#r3d-acts button"); if (f) f.focus({ preventScroll: true }); }
}
const DBL_MS = +(window.__r3dDblMs || 380);   // a double-tap's two taps within this (a test rig whose touches wait on slow frames can widen it)
let tapT = 0, actAt = 0;   // V2.42: tapT, a click's card waiting out a double-click; V1.54: when the card opened: a phone's click from the same tap lands on it (a sheet at the foot) and mustn't press its button
function closeAct() { actId = null; root.classList.remove("actopen"); if (act) act.hidden = true; clearAim(); clearSel(); }
if (act) {
  act.addEventListener("pointerdown", e => {   // V1.54: the second tap of a double-tap that lands on the card the first one opened: still a double-tap
    // V2.42: a mouse's too (a double-click's second click pressed the card's button under it: the bed's "See it from above", a floor's colour)
    if (!lastTap || e.timeStamp - lastTap.t > (e.pointerType === "mouse" ? 650 : DBL_MS) || Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) > 30) return;
    lastTap = null; e.preventDefault(); e.stopPropagation(); closeAct(); actAt = performance.now(); floorHop(e);
  }, true);
  act.addEventListener("click", e => {
    if (performance.now() - actAt < 350) { e.preventDefault(); e.stopPropagation(); return; }   // V1.54: the tap that opened it, not a press
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("x")) { closeAct(); return; }
    const d = b.dataset;
    if (d.actgo) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan", chapter: d.actgo } })); return; }
    if (d.actmk) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "build", mk: d.actmk } })); return; }   // v44
    if (d.actideas) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "ideas", item: d.actideas } })); return; }   // v34
    if (d.actedit) { const id = d.actedit; closeAct(); setEdit(true); select(id); return; }
    if (d.actlink) { window.open(d.actlink, "_blank", "noopener"); return; }                              // V3.75: the listing
    if (fixAct(d, e.shiftKey)) return;                                   // v38: a fixture's turn, its heads
    if (d.optcyc) { const [pl, ix] = d.optcyc.split(":"), L = placeOpts(pl), i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i];   // v39
      if (!optOn(it)) optPick(g.k, it.v); actId = `opt:${pl}:${i}`; renderAct(); return; }
    if (d.optkeep) { closeAct(); return; }
    if (d.updone && actId && actId.startsWith("ups:")) { const D = upDone(), k = actId.slice(4) + "|" + decodeURIComponent(d.updone); if (D[k]) delete D[k]; else D[k] = 1;   // N23: a change done, or not yet
      try { localStorage.setItem(UPK, JSON.stringify(D)); } catch (er) {} renderAct(); return; }
    if (d.upsall) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan" } })); const u = document.getElementById("ups"); if (u) { u.open = true; setTimeout(() => u.scrollIntoView({ block: "start" }), 80); } return; }
    if (d.actopen) { actId = d.actopen; renderAct(); if (d.actopen.startsWith("hsize:")) { const f = qs(".r3d-actfields input"); if (f) f.focus({ preventScroll: true }); } return; }
    if (d.hstep && actId) { const k = actId.split(":")[1], f = d.hstep, v = clampF(f, cmR(pieceNow(k)[f] + +d.by)), inp = qs(`.r3d-actfields [data-hfield="${f}"]`);   // V1.50
      if (inp) inp.value = v; setPiece(k, f, v); return; }
    if (d.hadd && TAPAT) { const r = R.HOUSE3.rooms[d.hadd], id = "add." + Math.random().toString(36).slice(2, 10), ds = DS(); if (!r || !ds) return;   // V2.46 (N7)
      ds.put("edits", id + "~add", { item: id, field: "add", value: HCAT_ADD[0], room: d.hadd, x: cmR(TAPAT[0]), z: cmR(TAPAT[2]), y: cmR(Math.max(r[4], Math.min(r[4] + 5, TAPAT[1]))) }).catch(() => toast("That didn't save: try again"));
      actId = "hadd:" + id; renderAct(); return; }
    if (d.hswapgo || d.haddgo || d.hcatk) { const [k, x] = (d.hswapgo || d.haddgo || d.hcatk).split(":"), it = HIT(k), ds = DS(); if (!it || !ds) return;
      if (d.hswapgo) { const L = [null, ...hcOf(swapKind(k))], v = L[((+x % L.length) + L.length) % L.length]; setPiece(k, "swap", v).then(() => { if (actId) renderAct(); }); return; }
      if (it.look) { const L = plantKeys(); plantSet(it.look, L[((+x % L.length) + L.length) % L.length]); renderAct(); return; }
      const n = HCAT_ADD.length, v = d.haddgo ? HCAT_ADD[((+x % n) + n) % n] : HCAT_ADD.find(q => HCAT[q].k === x), row = ds.rows("edits")[k + "~add"]; if (!row || !v) return;
      ds.put("edits", k + "~add", Object.assign({}, row, { value: v })).then(() => { if (actId) renderAct(); }); return; }
    if (d.finplant != null && actId && actId.startsWith("fin:")) { plantSet(actId.split(":")[1], d.finplant || null); renderAct(); return; }   // N5
    if (d.hremove && HIT(d.hremove) && HIT(d.hremove).look) { const r = HIT(d.hremove).look; closeAct(); plantSet(r, null); return; }
    if (d.hremove && HIT(d.hremove) && HIT(d.hremove).add) { const k = d.hremove, ds = DS(); closeAct();   // an added piece: its rows go
      Promise.all(Object.entries(ds.rows("edits")).filter(([, v]) => v && v.item === k).map(([rid]) => ds.del("edits", rid))).then(() => toast("Removed")); return; }
    if (d.hremove) { const k = d.hremove; closeAct(); setPiece(k, "removed", true).then(() => toast(`${HIT(k).n} taken out`, { hputback: k })); return; }   // V2.34; V3.75: Put back on the toast (Measure's Changed list too)
    if (d.hturn) { setPiece(d.hturn, "turn", (pieceNow(d.hturn).turn + 1) % 4); return; }   // V2.33: a quarter turn each press
    if (d.hreset) { const k = d.hreset, ds = DS(); if (!ds) return;
      Promise.all(Object.entries(ds.rows("edits")).filter(([, v]) => v && v.item === k && v.field !== "add").map(([rid]) => ds.del("edits", rid))).then(() => { if (actId) renderAct(); }); return; }
    if (d.nowp) { S.nowp = ((S.nowp || 0) + +d.nowp + NOWP.length) % NOWP.length; applyNow(); store.set(KEY, S); renderAct(); return; }
    if (d.nowpic) { pickNowPic(); return; }
    if (d.measure) { if (d.measure === "done") { endMeasure(); closeAct(); } else { clearMeasure(); renderAct(); } return; }
    if (d.view) setTimeout(closeAct, 0);                     // the room flies there; the card has done its job
  });
  act.addEventListener("input", e => { const el = e.target; if (!el.dataset || !el.dataset.hfield || !actId) return;   // V1.50: a typed size, kept once you pause
    const k = actId.split(":")[1], f = el.dataset.hfield, v = parseFloat(el.value); if (!isFinite(v)) return;
    clearTimeout(sizeT); sizeT = setTimeout(() => setPiece(k, f, clampF(f, cmR(v))), 450); });
  let lastPtr = "mouse";
  canvas.addEventListener("pointerdown", e => { lastPtr = e.pointerType; }, true);
  canvas.addEventListener("dblclick", e => { if (S.edit || MEAS.on || lastPtr !== "mouse") return; clearTimeout(tapT); e.preventDefault(); floorHop(aimed(e)); });   // V1.53: on a PC, a double-click stands you there (a phone's double-tap is the pointerup's: iOS can send a dblclick too)
  canvas.addEventListener("pointerdown", e => { e = aimed(e); tapDown = (S.edit || e.button > 0) ? null : [e.clientX, e.clientY, e.timeStamp]; if (actId) closeAct(); });   // review after v48: the touch's own time, so a slow frame between down and up can't turn a tap into a long press
  canvas.addEventListener("pointerup", e => {
    e = aimed(e); const t = tapDown; tapDown = null;
    if (!t || S.edit || Math.hypot(e.clientX - t[0], e.clientY - t[1]) > 6 || e.timeStamp - t[2] > Math.max(600, DBL_MS)) return;
    if (MEAS.on) { measureTap(e); return; }                                   // v39: measure in 3D
    const now = e.timeStamp, dbl = lastTap && now - lastTap.t < DBL_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    lastTap = dbl ? null : { t: now, x: e.clientX, y: e.clientY };
    const mouse = e.pointerType === "mouse"; clearTimeout(tapT);
    if (dbl && (mouse || floorHop(e))) return;                               // v41: a double-tap on the floor flies you there (V1.53: a mouse's double-click: dblclick)
    let id = pickItem(e); if (!id) return;
    const r = stage.getBoundingClientRect(), xy = [e.clientX - r.left, e.clientY - r.top];
    const go = () => {
      if (id.startsWith("hdoor:")) { swingDoor(id.slice(6), !doorOpen(HPARTS[id.slice(6)])); if (mlookOn()) return; }   // V1.26: a tap opens or shuts it, its card says which (V2.31: with mouse look, just that)
      if (mlookOn()) document.exitPointerLock();                              // V2.31: a card needs the pointer
      if (tryOpts) { const pl = placeOf(id); if (pl) id = `opt:${pl}:${placeIx(pl, id)}`; }           // v39: Try options: what else could go here
      openAct(id, xy); if (mouse) actAt = 0; };   // V1.54: only a finger's tap sends its click onto the card
    /* V2.42, the client: "movement is difficult again": a click's card waits out a double-click, so a double-click walks you there and
       opens nothing (its first click opened the card under the pointer and its second pressed a button on it) */
    if (mouse) tapT = setTimeout(go, DBL_MS); else go();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && actId) closeAct(); });
}
function setAbove(show) {   // the floor above (the stairwell's upper walls) hides in the views from above
  const hs = houseG && houseG.visible;                                         // v72: in the house the house's own stairwell stands there (the
  scene.traverse(o => { if (o.name === "above") o.visible = show && !hs; });   // living room's green upper wall showed through the landing)
  if (view) view.visible = show;                                               // v56: the plain sky only from inside (from above it read as a pale slab)
}
/* v53, client: "Can you make the garden visible through the window at any angle": the garden picture stays in every view, the views from
   above too (v52 showed it only once the camera was inside the room) */

