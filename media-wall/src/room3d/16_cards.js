/* ---------------------------------------------------------------- v30, client: "make function so say i click the dining cabinet i can
   manage options to open it, close it etc as goes for drawers and other items i can interact with". A tap on the room (not a drag, not
   in Edit room) finds what's under it and opens a card of what it can do. The card's buttons are the room's own controls (data-dining,
   data-chairs, data-drawers, data-tog...), so they work, and stay in step with the Tools panel, exactly as its buttons do. */
const act = qs("#r3d-act");
let actId = null, actXY = null, tapDown = null;
const clippedAt = p => CLIP.every(pl => pl.distanceToPoint(p) < 0);           // the cutaway hides what's on the far side of both planes
const under = (o, g) => { if (!g) return false; for (; o; o = o.parent) if (o === g) return true; return false; };
function pickItem(e) {
  ray.setFromCamera(ndc(e), camera);
  const cutAway = q => RPLANES.some(pl => pl.distanceToPoint(q) < 0);             // v71: not what a room's view has cut away
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h.point) && !(selBox && h.object === selBox) && !cutAway(h.point));
  if (!hit) return null;
  const o = hit.object, p = hit.point;
  const near = (obj, r) => !!obj && obj.getWorldPosition(new THREE.Vector3()).distanceTo(p) < r * M;
  const BL = HPARTS.bed_lift;                                                    // v71: the master's ottoman bed: its card
  if (BL && houseG && houseG.visible) { const bx = new THREE.Box3().setFromObject(BL.g); bx.min.y -= 0.6; bx.expandByScalar(0.03); if (bx.containsPoint(p)) return "hbed"; }
  if (houseG && houseG.visible) for (const [k, P] of Object.entries(HPARTS)) if (k.startsWith("door.") && under(o, P.g)) return "hdoor:" + k;   // V1.26
  if (houseG && houseG.visible && o.material && /^blind/.test(o.material.userData.hk || "")) return "hblinds";   // V1.47: a blind (or its roller): its card
  if (houseG && houseG.visible && DS() && under(o, houseG)) { const k = housePiece([hit], q => cutAway(q)); if (k && HIT(k)) return "hitem:" + k; }   // V1.50: a piece: its size
  if (HPARTS["door.living_door"] && under(o, livLeaf)) return "hdoor:door.living_door";   // V1.38: the living room's side of its door
  if (S.site === "C" && (under(o, cab) || under(o, optC))) return "cab";
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
const MAKE_CARD = { recordtable: "mk-recordtable", ctable: "mk-ctable", wallcabs: "mk-wallcabs", alcoveshelves: "mk-alcove", doorshelf: "mk-doorshelf", shelfboxes: "mk-doorshelf" };   // v44
function actItems(id) {     // [title, how it is now, buttons]
  const folded = S.dining === "folded", lv = k => (S.lv[k] ?? 0) > 0;
  if (id === "hbed") { const P_ = HPARTS.bed_lift, up = !!(P_ && (P_.tw ? P_.tw.to === 1 : P_.t > 0.5));   // v71, the client: the bed as a card, like the living room's
    return ["Your ottoman bed", up ? "Lifted on its struts: four storage boxes inside" : "Pine, the base lifts from the foot", [
      btn(up ? "Lower the bed" : "Lift the bed", { hbed: up ? "down" : "up" }), ...(ROOMV() && RMODE !== "above" ? [btn("See it from above", { rmode: "above" })] : [])]]; }
  if (id.startsWith("hitem:")) { const k = id.slice(6), it = HIT(k); if (!it) return null;   // V1.50: a piece in the house, its size
    return [it.n, pieceLine(k), [btn("Change its size", { actopen: "hsize:" + k }), ...(pieceDelta(k).some(Boolean) ? [btn("As planned", { hreset: k })] : [])]]; }
  if (id.startsWith("hsize:")) { const k = id.slice(6), it = HIT(k); if (!it) return null; const c = pieceNow(k), door = it.k === "door";
    return [it.n, pieceLine(k), [btn("Done", { actopen: "hitem:" + k }), btn("As planned", { hreset: k })],
      FIELDS.filter(([f]) => !(door && (f === "h" || f === "up"))).map(([f, t]) => [f, t, cmR(c[f])])]; }
  if (id === "hblinds") return ["The blinds", S.blinds ? "Down" : "Rolled up", [btn(S.blinds ? "Roll them up" : "Pull them down", { tog: "blinds" })]];   // V1.47
  if (id.startsWith("hdoor:")) { const k = id.slice(6), P = HPARTS[k]; if (!P) return null; const op = doorOpen(P);   // V1.26: a door's card
    const any = Object.entries(HPARTS).some(([q, Q]) => q.startsWith("door.") && doorOpen(Q));
    return [P.label || "The door", op ? (Math.abs(P.angle) < 89 ? "Open as far as it goes" : "Open") : "Shut", [
      btn(op ? "Shut it" : "Open it", { hdoor: k }), btn(any ? "Shut every door" : "Open every door", { hdoors: any ? "shut" : "open" }),
      ...(DS() && HIT(k.slice(5)) ? [btn("Change its size", { actopen: "hsize:" + k.slice(5) })] : [])]]; }
  if (id === "nowplay") return ["Now playing, on the ledge", `${NOWP[S.nowp % NOWP.length].name}`, [   // v39: which LP faces out
      btn("‹", { nowp: "-1" }, false, "q", "The one before"), btn("›", { nowp: "1" }, false, "q", "The next one"),
      btn("A photo of yours", { nowpic: "1" }), btn("Look at it", { view: "breast" })]];
  if (id === "measure") { const d = MEAS.d;                               // v39: measure in 3D
    return ["Measure", d ? `${d.toFixed(1)} cm between them (${MEAS.dh.toFixed(1)} across, ${MEAS.dv.toFixed(1)} up)` : MEAS.a ? "Now tap the second point" : "Tap the first point in the room", [
      btn("Measure again", { measure: "again" }), btn("Done", { measure: "done" })]]; }
  if (id.startsWith("opt:")) {                                            // v39: Try options' card: this place's options, ‹ › through them
    const [, pl, ix] = id.split(":"), L = placeOpts(pl); if (!L.length) return null;
    const i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i], on = optOn(it), firm = isFirm(it);
    return [it.title + (firm ? " (your plan)" : ""), `${g.title} · ${i + 1} of ${L.length} · ${it.size}${it.cost ? ` · £${it.cost[0]}–${it.cost[1]}` : ""}`, [
      btn("‹", { optcyc: `${pl}:${i - 1}` }, false, "q", "The one before"), btn("›", { optcyc: `${pl}:${i + 1}` }, false, "q", "The next one"),
      on ? btn("Keep it", { optkeep: "1" }, true) : btn("Try it", { optcyc: `${pl}:${i}` }),
      ...(it.aim ? [btn("See it", { optsee: g.k })] : []), btn("Back to my plan", { optclear: "1" })]];
  }
  if (id === "cab" && S.site !== "C") id = "table";
  if (id === "table" && S.site === "C") id = "cab";
  if (id === "cab") {
    const sl = S.cab === "sliding", d = cabDoors();
    const st = !folded ? `Open for ${S.dining}: the table is out` : d.table ? "Packed away, the table door open" : d.chairs ? "Packed away, the chair door open" : (S.cabw === "80" ? "Packed away: the table and four of the six chairs inside" : "Packed away: the table and the six chairs inside");
    return [S.cabw === "80" ? "The dining cabinet, 80-wide table" : "The dining cabinet", st, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded away" : "Fold it away", { dining: "folded" }, folded),
      ...(folded ? [btn(d.table ? "Shut the table door" : "Open the table door", { tdoor: d.table ? "shut" : "open" }),
                    btn(d.chairs ? "Shut the chair door" : "Open the chair door", { chairs: d.chairs ? "cupboard" : "open" })] : []),
      btn("Watch it open, step by step", { showopen: "1" }),
      btn(S.cabw === "80" ? "Show the 90-wide table (the plan)" : "Show the 80-wide version (10 shorter)", { cabw: S.cabw === "80" ? "90" : "80" }),
      btn("Look at it", { view: "dining" }), btn("How to make it", { actmk: "mk-cabinet" }), btn("Read about it", { actgo: "dining" })]];
  }
  if (id === "table") return [S.site === "A" ? "The flip-top on the breast (the alternative)" : "The flip-top by the stairs (the alternative)", folded ? "Folded" : `Open for ${S.dining}`, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded" : "Fold it", { dining: "folded" }, folded), btn("Show the dining cabinet", { site: "C" }), btn("Look at it", { view: "dining" })]];
  if (id === "wall") return ["The media wall", S.drawers ? "Every drawer pulled out" : "Drawers shut", [
      btn(S.drawers ? "Push the drawers in" : "Pull the drawers out", { drawers: S.drawers ? "in" : "out" }),
      btn(lv("bias") ? "TV off" : "TV on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"),
      btn("Choose the LP on the ledge", { actopen: "nowplay" }),               // v39: "a now playing swap: tap the turntable"
      btn("Look at it", { view: "wall" }), btn("How to make it", { actmk: "mk-base" }), btn("Read about it", { actgo: "wall" })]];
  if (id === "tv") return ["The TV", lv("bias") ? "On, its bias light behind it" : "Off", [
      btn(lv("bias") ? "Turn it off" : "Turn it on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"), btn("Look at it", { view: "sofa" })]];
  if (id === "lamp" || id === "bar1" || id === "bar2") return fixCard(id, lv(id));
  if (id === "curtains") return ["The curtains", S.curtains ? "Drawn" : "Open", [btn(S.curtains ? "Open them" : "Draw them", { tog: "curtains" })]];
  if (id === "lbox") return ["Your OBEGRÄNSAD light box", S.lbox ? "On" : "Off", [btn(S.lbox ? "Turn it off" : "Turn it on", { tog: "lbox" })]];
  if (id === "pc") return ["Your PC", S.pc ? "Lit" : "Dark", [btn(S.pc ? "Lights off" : "Lights on", { tog: "pc" }), btn("Look at it", { view: "pc" }), btn("How to make it", { actmk: "mk-sidewall" }), btn("Read about it", { actgo: "side" })]];
  if (id === "beside") { const B = R.BESIDE, cur = S.beside;           // v34
    return ["Beside the cabinet", (B.opts[cur] || {}).name || cur, [
      ...Object.entries(B.opts).map(([k, o]) => btn(o.name, { beside: k }, cur === k)),
      ...(cur === "bar" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),   // v37
      ...(cur === "trolley" ? [btn(S.trolley === "out" ? (cabDoors().table ? "Park it by the wall (once the table is folded)" : "Park it by the wall") : (cabDoors().table ? "Pull it out (once the table is folded)" : "Pull it out for dinner"), { trolley: S.trolley === "out" ? "park" : "out" })] : []),
      ...(cur === "bar" ? [btn("How to make it", { actmk: "mk-bar" })] : []), btn("Look at it", { view: "beside" }), btn("Read about it", { actgo: "dining" })]]; }
  if (id === "records") return ["Your vinyl stand", S.lp ? "The front record of each bay lifted out" : "Two face-out bays on top, LPs filed below", [
      btn(S.lp ? "Put the records back" : "Lift out the front records", { lp: S.lp ? "in" : "out" }),
      btn(S.ideas.clean ? "Take away the record-care caddy" : "Add a record-care caddy (an idea)", { idea: "clean" }, !!S.ideas.clean),
      btn("Move it", { actedit: "records" })]];
  if (id.startsWith("sg:") || id.startsWith("id:")) {
    const sg = id.startsWith("sg:"), k = id.slice(3), nm = ((sg ? PD.sugg : PD.ideas)[k] || [k])[0], it = sg && MOV["sg_" + k];
    if (!(sg ? S.sugg : S.ideas)[k]) return null;                        // taken away: the card closes
    const firm = R.FIRM && (sg ? R.FIRM.sugg : R.FIRM.ideas || []).includes(k);   // v38: the client's picks are the plan (v43: the C-table too)
    return [nm, firm ? "In your plan" : sg ? "An option: not in the plan's costs" : "An idea: not in the plan's costs", [
      ...(firm && MAKE_CARD[k] ? [btn("How to make it", { actmk: MAKE_CARD[k] })] : []),   // v44: its card in Build
      ...(k === "blind" ? [btn(S.blind === "up" ? "Pull it down" : "Roll it up", { blind: S.blind === "up" ? "down" : "up" })] : []),
      ...(k === "barcase" || k === "barside" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),
      ...(k === "liftcoffee" ? [btn(S.ctop ? "Put the top down" : "Lift the top", { ctop: S.ctop ? "down" : "up" })] : []),
      ...(k === "recordtable" ? [btn(S.ctop ? "Close the lid" : "Lift the lid", { ctop: S.ctop ? "down" : "up" })] : []),   // v38
      ...(k === "stairdrawers" ? [btn(S.sdraw ? "Push the drawers in" : "Pull the drawers out", { sdraw: S.sdraw ? "in" : "out" })] : []),   // v37
      ...(sg ? (SVAR[k] || []).map(([v, n]) => btn(n, { svar: `${k}:${v}` }, svarOf(k) === v)) : []),
      ...(it && !it.fixed ? [btn("Move it", { actedit: it.id })] : []),
      btn("Take it away", sg ? { sugg: k } : { idea: k }), btn("See its card", { actideas: (sg ? "sugg-" : "idea-") + k })]]; }
  if (id === "mov:pouf") return ["Your storage ottoman", S.lid ? "The lid off: your board games in three layers, the cards along one side" : "Navy velvet, its padded lid on: your games and cards inside", [   // v34
      btn(S.lid ? "Put the lid back" : "Lift the lid", { lid: S.lid ? "on" : "off" }), btn("Move it", { actedit: "pouf" }), btn("Read about it", { actgo: "c-room" })]];
  if (id.startsWith("mov:")) { const it = MOV[id.slice(4)]; if (!it) return null;
    return [it.label, it.fixed ? "Built in: it can come off, but not move" : "Drag it in Edit room, or change its colour", [btn(it.fixed ? "Take it off or put it back" : "Move it", { actedit: it.id })]]; }
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
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && h.object.material !== measMat && !clippedAt(h.point)); ray.near = near0;
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
    ...(id === "lamp" ? [btn("Move it", { actedit: "lamp" })] : [])]];
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
function renderAct() {
  const items = actId && actItems(actId);
  if (!items) { closeAct(); return; }
  const [title, st, bs] = items;
  qs("#r3d-act-h").textContent = title; qs("#r3d-act-st").textContent = st;
  qsa(".r3d-actmore", act).forEach(m => m.remove());
  const box = qs("#r3d-acts"); box.textContent = "";
  qsa(".r3d-actfields").forEach(m => m.remove());
  if (items[3]) { const w = document.createElement("div"); w.className = "r3d-actfields";   // V1.50: a piece's sizes, a stepper each
    w.innerHTML = items[3].map(([f, t, v]) => `<div class="fld"><span>${t}</span><span class="stp"><button type="button" data-hstep="${f}" data-by="-1" aria-label="${t}: 1 cm less">−</button>`
      + `<input type="number" inputmode="decimal" step="1" value="${v}" data-hfield="${f}" aria-label="${t} in cm"><button type="button" data-hstep="${f}" data-by="1" aria-label="${t}: 1 cm more">+</button></span></div>`).join("")
      + `<p class="note">${DS() && DS().mode === "shared" ? "Saved for you both as you go" : "Saved on this device · Send in Measure shares it"}</p>`;
    box.before(w); }
  if (/^(hitem|hsize):/.test(actId)) selOf(actId.split(":")[1]); else if (!EMBED) clearSel();
  // v39 (the approved redesign): a card shows its first three buttons; everything else sits under Details
  let shownN = 0, into = box, more = null;
  for (const b of bs) {
    if (shownN >= 3 && !more) { more = document.createElement("details"); more.className = "r3d-actmore"; more.open = actMoreOpen;
      more.innerHTML = '<summary>Details</summary><div class="acts"></div>'; more.addEventListener("toggle", () => { actMoreOpen = more.open; placeAct(); }); box.after(more); into = more.querySelector(".acts"); }
    if (b.sep) { const h = document.createElement("span"); h.className = "r3d-actsep"; h.textContent = b.sep; (shownN >= 3 ? into : box).appendChild(h); continue; }   // v38
    shownN++;
    const el = document.createElement("button"); el.type = "button"; el.textContent = b.label;
    for (const [k, v] of Object.entries(b.attrs)) el.dataset[k] = v;
    if (b.cls) el.className = b.cls; if (b.aria) { el.setAttribute("aria-label", b.aria); el.title = b.aria; }
    if (b.on !== undefined) el.setAttribute("aria-pressed", String(!!b.on));
    into.appendChild(el);
  }
  placeAct();
}
function placeAct() {
  if (!actXY) return;
  const sw = stage.clientWidth, sh = stage.clientHeight, pw = act.offsetWidth || 300, ph = act.offsetHeight || 200;
  const left = Math.max(12, Math.min(sw - pw - 12, actXY[0] - pw / 2));
  const below = actXY[1] + 22 + ph < sh - 90, top = below ? actXY[1] + 22 : Math.max(12, actXY[1] - ph - 22);
  act.style.left = left + "px"; act.style.top = top + "px"; act.style.setProperty("--ax", (actXY[0] - left) + "px");
  act.classList.toggle("above", !below);
}
let actMoreOpen = false;
function openAct(id, xy) {
  if (popId) closePop(); clearAim();
  if (String(id).split(":").slice(0, 2).join(":") !== String(actId || "").split(":").slice(0, 2).join(":")) actMoreOpen = false;   // v39: a new card opens folded
  actId = id; actXY = xy; act.hidden = false; renderAct();
  if (!act.hidden) { const f = qs("#r3d-acts button"); if (f) f.focus({ preventScroll: true }); }
}
function closeAct() { actId = null; if (act) act.hidden = true; clearAim(); if (!EMBED) clearSel(); }
if (act) {
  act.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("x")) { closeAct(); return; }
    const d = b.dataset;
    if (d.actgo) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan", chapter: d.actgo } })); return; }
    if (d.actmk) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "build", mk: d.actmk } })); return; }   // v44
    if (d.actideas) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "ideas", item: d.actideas } })); return; }   // v34
    if (d.actedit) { const id = d.actedit; closeAct(); setEdit(true); select(id); return; }
    if (fixAct(d, e.shiftKey)) return;                                   // v38: a fixture's turn, its heads
    if (d.optcyc) { const [pl, ix] = d.optcyc.split(":"), L = placeOpts(pl), i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i];   // v39
      if (!optOn(it)) optPick(g.k, it.v); actId = `opt:${pl}:${i}`; renderAct(); return; }
    if (d.optkeep) { closeAct(); return; }
    if (d.actopen) { actId = d.actopen; renderAct(); if (d.actopen.startsWith("hsize:")) { const f = qs(".r3d-actfields input"); if (f) f.focus({ preventScroll: true }); } return; }
    if (d.hstep && actId) { const k = actId.split(":")[1], f = d.hstep, v = clampF(f, cmR(pieceNow(k)[f] + +d.by)), inp = qs(`.r3d-actfields [data-hfield="${f}"]`);   // V1.50
      if (inp) inp.value = v; setPiece(k, f, v); return; }
    if (d.hreset) { const k = d.hreset, ds = DS(); if (!ds) return;
      Promise.all(Object.entries(ds.rows("edits")).filter(([, v]) => v && v.item === k).map(([rid]) => ds.del("edits", rid))).then(() => { if (actId) renderAct(); }); return; }
    if (d.nowp) { S.nowp = ((S.nowp || 0) + +d.nowp + NOWP.length) % NOWP.length; applyNow(); store.set(KEY, S); renderAct(); return; }
    if (d.nowpic) { pickNowPic(); return; }
    if (d.measure) { if (d.measure === "done") { endMeasure(); closeAct(); } else { clearMeasure(); renderAct(); } return; }
    if (d.view) setTimeout(closeAct, 0);                     // the room flies there; the card has done its job
  });
  act.addEventListener("input", e => { const el = e.target; if (!el.dataset || !el.dataset.hfield || !actId) return;   // V1.50: a typed size, kept once you pause
    const k = actId.split(":")[1], f = el.dataset.hfield, v = parseFloat(el.value); if (!isFinite(v)) return;
    clearTimeout(sizeT); sizeT = setTimeout(() => setPiece(k, f, clampF(f, cmR(v))), 450); });
  canvas.addEventListener("pointerdown", e => { tapDown = (S.edit || e.button > 0) ? null : [e.clientX, e.clientY, e.timeStamp]; if (actId) closeAct(); });   // review after v48: the touch's own time, so a slow frame between down and up can't turn a tap into a long press
  canvas.addEventListener("pointerup", e => {
    const t = tapDown; tapDown = null;
    if (!t || S.edit || Math.hypot(e.clientX - t[0], e.clientY - t[1]) > 6 || e.timeStamp - t[2] > 600) return;
    if (MEAS.on) { measureTap(e); return; }                                   // v39: measure in 3D
    const now = e.timeStamp, dbl = lastTap && now - lastTap.t < 380 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    lastTap = dbl ? null : { t: now, x: e.clientX, y: e.clientY };
    if (dbl && floorHop(e)) return;                                           // v41: a double-tap on the floor flies you there
    if (EMBH) { EMBH.tap(e); return; }                                        // V1: in the app, a tap names the piece to the app
    let id = pickItem(e); if (!id) return;
    const r = stage.getBoundingClientRect();
    if (id.startsWith("hdoor:")) swingDoor(id.slice(6), !doorOpen(HPARTS[id.slice(6)]));   // V1.26: a tap opens or shuts it, its card says which
    if (tryOpts) { const pl = placeOf(id); if (pl) id = `opt:${pl}:${placeIx(pl, id)}`; }             // v39: Try options: what else could go here
    openAct(id, [e.clientX - r.left, e.clientY - r.top]);
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

