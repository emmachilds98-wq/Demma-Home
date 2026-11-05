/* ---------------------------------------------------------------- the controls */
function press(attr, val) { qsa(`[data-${attr}]`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === String(val)))); }
const sameAsScene = () => LAYERS.every(k => (S.lv[k] ?? 0) === (SCENES[S.scene].levels[k] ?? 0));
/* v36, client: "make sure its clear how to manage all these options in the 3D room": Extras opens on a row per need (ideas.OPTION_GROUPS):
   a bar (pick one of three places), the games in the ottoman, the blankets (pick one), more storage (any), the plant shelf. Picking
   shows it and flies the camera there; the row's caption says where it goes, its size and a rough cost */
const OPT = JSON.parse((document.getElementById("opt-data") || {}).textContent || '{"groups":[]}');
const optGroup = k => OPT.groups.find(g => g.k === k);
function optOn(it) {
  if (it.set.sugg) return !!S.sugg[it.set.sugg] && (it.set.sugg !== "bartrolley" || S.beside === "trolley");
  if (it.set.beside) return S.site === "C" && S.beside === it.set.beside;
  if ("lid" in it.set) return !!S.lid === it.set.lid;
  return false;
}
/* v37: one thing per place. The window corner takes one of the seat, the bench or the cupboard; the cupboard fills the corner the
   alcove shelves would hang in, and leaves only a slot to reach the far end of the wall beside the dining cabinet, so it and the
   beside pieces (the built-in bar, the shoe cabinets, the rail, the trolley...) take turns */
function extrasRule(kind, k, on) {
  if (!on) return;
  const off = (...ks) => { S.sugg = Object.assign({}, S.sugg); ks.forEach(x => { if (x !== k) S.sugg[x] = false; }); };
  if (kind === "sugg") {
    if (["windowseat", "hallbench", "wardrobe"].includes(k)) off("windowseat", "hallbench", "wardrobe");
    if (k === "wardrobe") { off("alcoveshelves", "bartrolley"); if (S.beside !== "clear") { S.beside = "clear"; toast("The cupboard takes the wall beside the cabinet"); } }
    if (k === "alcoveshelves") off("wardrobe");
  }
  if (kind === "beside" && k !== "clear") { if (S.sugg.wardrobe) off("wardrobe"); if (k !== "trolley") off("bartrolley"); }
}
function optSet(it, on) {
  if (it.set.sugg) { S.sugg = Object.assign({}, S.sugg, { [it.set.sugg]: on }); if (on && S.layout["sg_" + it.set.sugg]) delete S.layout["sg_" + it.set.sugg].off; }
  if (it.set.beside) S.beside = on ? it.set.beside : (S.beside === it.set.beside ? "clear" : S.beside);
  if ("lid" in it.set && on) S.lid = it.set.lid;
  if (on && (it.set.beside || it.set.sugg === "bartrolley")) { S.site = "C"; S.cab = "compact"; }
  if (on && it.set.sugg === "bartrolley") S.beside = "trolley";                                    // the slim trolley, dressed as a bar
  if (on && it.set.beside && S.sugg.bartrolley) S.sugg = Object.assign({}, S.sugg, { bartrolley: false });   // the rail takes its place
  if (on && it.set.sugg === "barcase" && S.plants === "breast") S.plants = "corner";
  if (it.set.sugg) extrasRule("sugg", it.set.sugg, on); else if (it.set.beside) extrasRule("beside", it.set.beside, on);   // v37
}
function optPick(gk, v) {
  const g = optGroup(gk); if (!g) return;
  const it = g.items.find(i => i.v === v);
  if (g.mode === "one") { for (const o of g.items) if (o !== it && optOn(o)) optSet(o, false); if (it) optSet(it, true); }
  else if (g.mode === "any" && it) optSet(it, !optOn(it));
  else if (it) optSet(it, true);
  applyState();
  if (it && optOn(it)) optSee(gk, it);
}
/* v39 (the approved redesign): the room opens on your plan; Try options shows what else could go in each place (tap a place or a piece,
   then ‹ › on its card), and the plan bar says how many options are on and what they add to the plan or take off it. Back to my plan
   (or Try options off) puts everything back. */
let tryOpts = false;
const FIRMS = new Set((R.FIRM && R.FIRM.sugg) || []);
const PLACE_GROUPS = { wall: ["storage"], dining: ["bar"], sofa: ["coffee", "blankets", "corner"] };
const placeOpts = pl => (PLACE_GROUPS[pl] || []).flatMap(gk => { const g = optGroup(gk); return g ? g.items.map(it => [g, it]) : []; });
const isFirm = it => (it.set.sugg && FIRMS.has(it.set.sugg)) || (it.set.beside && R.FIRM && it.set.beside === R.FIRM.beside);
function placeOf(id) {                    // the place whose options include the piece you tapped
  const k = id.startsWith("sg:") ? id.slice(3) : null;
  for (const pl of Object.keys(PLACE_GROUPS)) for (const [, it] of placeOpts(pl)) {
    if (k && it.set.sugg === k) return pl;
    if ((id === "beside" || id.startsWith("bes")) && it.set.beside) return pl;
  }
  if (id === "cab") return "dining";
  return null;
}
function placeIx(pl, id) {                // which option the card opens on: the one you tapped, else the one that's on, else the first
  const L = placeOpts(pl), k = id && id.startsWith("sg:") ? id.slice(3) : null;
  let i = k ? L.findIndex(([, it]) => it.set.sugg === k) : -1;
  if (i < 0) i = L.findIndex(([, it]) => optOn(it));
  return Math.max(0, i);
}
const besideCost = k => { for (const g of OPT.groups) for (const it of g.items) if (it.set.beside === k && it.cost) return it.cost; return [0, 0]; };
function optDelta() {
  let n = 0, lo = 0, hi = 0;
  for (const [k, on] of Object.entries(S.sugg)) if (on && !FIRMS.has(k) && PD.sugg[k]) { n++; lo += PD.sugg[k][1]; hi += PD.sugg[k][2]; }
  let off = 0; for (const k of FIRMS) if (!S.sugg[k] && PD.sugg[k]) { off++; lo -= PD.sugg[k][1]; hi -= PD.sugg[k][2]; }   // a pick taken away: a swap counts once
  const FI = new Set((R.FIRM && R.FIRM.ideas) || []);                                           // v43: the C-table is in the plan
  for (const [k, on] of Object.entries(S.ideas)) if (on && !FI.has(k) && PD.ideas[k]) { n++; lo += PD.ideas[k][1]; hi += PD.ideas[k][2]; }
  for (const k of FI) if (!S.ideas[k] && PD.ideas[k]) { off++; lo -= PD.ideas[k][1]; hi -= PD.ideas[k][2]; }
  const fb = R.FIRM ? R.FIRM.beside : "clear";
  if (S.beside !== fb) { n++; const c = besideCost(S.beside), f = besideCost(fb); lo += c[0] - f[0]; hi += c[1] - f[1]; }
  return { n: Math.max(n, off), lo, hi };
}
const gbp = v => "£" + Math.round(Math.abs(v)).toLocaleString("en-GB");
function updatePlanBar() {
  const el = qs("#r3d-plansum"); if (!el) return;
  const P = PD.plan || [0, 0];
  if (!tryOpts) { el.textContent = `Your plan · ${gbp(P[0])}–${gbp(P[1]).slice(1)}`; return; }
  const d = optDelta();
  if (!d.n) { el.textContent = "Tap a place to try something"; return; }
  const sign = (d.lo + d.hi) / 2 >= 0 ? "+" : "−", a = Math.min(Math.abs(d.lo), Math.abs(d.hi)), b = Math.max(Math.abs(d.lo), Math.abs(d.hi));
  el.textContent = `${d.n} option${d.n > 1 ? "s" : ""} on · ${sign}${gbp(a)}–${gbp(b).slice(1)}`;
}
/* v40.2: back to a good view whenever you're lost, orbiting (not looking round from a spot); v68, the client: "take out the whole room
   button for a whole house button": the whole house, every floor; pick a floor, then a room */
function wholeRoom() {
  if (SH) showStop(true);
  if (actId) closeAct();
  if (S.cam === "look") { S.cam = "orbit"; applyCam(false); syncButtons(); }
  if (R.HOUSE) hfloor = "all";
  setView(R.HOUSE ? "house" : "room"); qs("#r3d-home")?.classList.remove("lost");
}
/* v68, the client: the lift-up bed: Lift the bed raises the ottoman's lid from the foot on its struts (the four boxes inside), again lowers it */
function liftBed(on) {
  const P = HPARTS.bed_lift; if (!P) return;
  P.tw = { a: P.t, to: on ? 1 : 0, t0: performance.now() }; dirty();
  if (actId === "hbed") renderAct();                             // v71: the card follows (where the lid is going)
}
function partPose(P, t) {   // three's x is flipped: the foot rises (about z), a door turns into its room (about y); its own parts with it
  t = t ?? P.t;
  if (P.axis === "y") P.g.rotation.y = -t * P.angle * Math.PI / 180; else P.g.rotation.z = -t * P.angle * Math.PI / 180;
  if (livLeaf && P === HPARTS["door.living_door"]) livLeaf.rotation.y = P.g.rotation.y;   // V1.38: the room's own leaf with it
  for (const K of P.kids || []) partPose(K, t);
}
function liftTick(now) {   // each frame while a part moves (the frame loop, like the cabinet's doors)
  let on = false;
  for (const P of Object.values(HPARTS)) { if (!P.tw) continue;
    const k = Math.max(0, Math.min(1, (now - P.tw.t0) / 900)), e = k * k * (3 - 2 * k); P.t = P.tw.a + (P.tw.to - P.tw.a) * e;
    partPose(P); on = true; if (k >= 1) P.tw = null; }
  return on;
}
/* V1.26, the client: "i'd like to be able to open and close doors now at will": tap a door, it opens (or shuts) on its hinge; its card
   opens or shuts every door. The bathroom's stops on the bath (house/survey_data.DOOR_HANG) */
const doorOpen = P => !!(P && (P.tw ? P.tw.to === 1 : P.t > 0.5));
function swingDoor(k, on) {
  const P = HPARTS[k]; if (!P) return;
  P.tw = { a: P.t, to: on ? 1 : 0, t0: performance.now() }; dirty();
  S.doors = Object.assign({}, S.doors, { [k]: on ? 1 : 0 }); store.set(KEY, S);   // V1.26b: remembered
  if (k === "door.living_door") setTimeout(() => { applyFloors(); reshadow(); }, on ? 0 : 950);   // V1.38: what's seen through it (once it's shut)
}
function swingAll(on) { for (const k of Object.keys(HPARTS)) if (k.startsWith("door.")) swingDoor(k, on); if (actId) renderAct(); }
/* v71, the client: "three ways to view the room": in it (wide), from above (the ceiling and the floors over it cut away), and the room on
   its own (the house cut to the room's walls, everything else put away), so nothing clips into it */
const VIEW_ROOM = Object.fromEntries(Object.entries(ROOM_VIEW).map(([r, v]) => [v, r]));
/* v72 (B5): Above writes the room's name over its floor, faint (Hide labels hides it); On its own lays a soft shadow under the room so it
   doesn't float. One small group in the house, rebuilt on each change */
let rmodeG = null;
function rmodeDress(rr, rid) {
  if (rmodeG) { rmodeG.traverse(o => { if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); o.geometry.dispose(); } }); rmodeG.parent && rmodeG.parent.remove(rmodeG); rmodeG = null; }
  if (!rr || !houseG || RMODE === "in") return;
  const [x0, x1, z0, z1, fy] = rr, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  rmodeG = new THREE.Group(); houseG.add(rmodeG);
  const flat = (tex, sw, sd, y, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sw * M, sd * M), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.copy(v3(cx, y, cz)); m.raycast = () => {}; rmodeG.add(m); return m; };   // never in a tap's way
  if (RMODE === "alone") {
    const tex = canvasTex(256, 256, (g, W, H) => { g.clearRect(0, 0, W, H);   // a pale floor fading out, the room's shadow darker in its middle
      let gr = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2); gr.addColorStop(0, "rgba(226,221,211,0.9)"); gr.addColorStop(0.55, "rgba(226,221,211,0.55)"); gr.addColorStop(1, "rgba(226,221,211,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      gr = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W * 0.36); gr.addColorStop(0, "rgba(40,36,30,0.55)"); gr.addColorStop(0.7, "rgba(40,36,30,0.3)"); gr.addColorStop(1, "rgba(40,36,30,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    flat(tex, w * 2.2 + 80, d * 2.2 + 80, fy - 31, 1).renderOrder = -1;
  } else if (RMODE === "above") {
    const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(fy)], Ls = ((R.HOUSE3.floors[fk] || {}).labels || []);
    const L = Ls.filter(l => l.x >= x0 - 5 && l.x <= x1 + 5 && l.z >= z0 - 5 && l.z <= z1 + 5).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
    const name = (L && L.name) || rid; if (!name) return;
    const tex = canvasTex(1024, 256, (g, W, H) => { g.clearRect(0, 0, W, H); g.font = "600 120px Figtree, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.lineWidth = 14; g.strokeStyle = "rgba(20,24,22,0.55)"; g.strokeText(name, W / 2, H / 2); g.fillStyle = "rgba(255,252,245,0.95)"; g.fillText(name, W / 2, H / 2); });
    const tw = Math.min(w * 0.8, d * 0.8 * 4, 260), lab = flat(tex, tw, tw / 4, fy + 100, 0.75);   // over the furniture, under the camera
    lab.material.depthTest = false; lab.renderOrder = 998; lab.userData.rlabel = true; lab.visible = labelsOn;
  }
}
function setRmode(m, quiet) {
  RMODE = ROOMV() && m !== "in" ? m : "in";
  if (RMODE !== "stand") standLook(false);
  if (typeof brandPlace === "function") brandPlace();   // V1.60: standing names the room you're in
  const rid = VIEW_ROOM[S.view], rr = (RMODE === "above" || RMODE === "alone") && R.HOUSE3 && (R.HOUSE3.rooms || {})[rid];
  const planes = [];
  if (rr) { const [x0, x1, z0, z1, fy] = rr, top = fy + (R.HOUSE3.ceil || 235) - 3, g = 15, P = (x, y, z, c) => new THREE.Plane(new THREE.Vector3(x, y, z), c * M);
    planes.push(P(0, -1, 0, top));                                                    // the ceiling and everything over it off
    if (RMODE === "alone") planes.push(P(1, 0, 0, x1 + g), P(-1, 0, 0, -(x0 - g)), P(0, 1, 0, -(fy - 30)), P(0, 0, 1, -(z0 - g)), P(0, 0, -1, z1 + g)); }
  RPLANES = planes;
  for (const m_ of Object.values(HMATS || {})) { m_.clippingPlanes = planes; m_.clipIntersection = false; m_.clipShadows = planes.length > 0; m_.needsUpdate = true; }   // union: outside any plane goes
  for (const k of ["tile", "ceiling", "shade_ceil"]) if (HMATS && HMATS[k]) HMATS[k].visible = !rr;   // V1.33: and the ceilings' shade   // v81: the roof's tiles off too (its low eaves lay over the bathroom's corner from above); v82 the ceilings and slopes below the cut (the bathroom's dormer ceiling)
  hidMode.forEach(o => o.visible = true); hidMode = []; applyFloors();
  if (rr && (RMODE === "alone" || rr[4] < 0)) scene.children.forEach(o => { if (o !== houseG && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o.visible) { o.visible = false; hidMode.push(o); } });
  if (rr && RMODE === "alone") { const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(rr[4])];   // only the room's own floor
    for (const [k, g] of Object.entries(HFLOOR)) if (k !== fk && !(fk === "first" && k === "roof") && g.visible) { g.visible = false; hidMode.push(g); } }   // V2.10, the client: "walls are clipping out when not necessary": a first-floor room's walls under the roof (its gable, dormer cheeks, slopes) are in the roof's group: kept, the planes trim it
  rmodeDress(rr, rid);
  if (rr) { const [x0, x1, z0, z1, fy] = rr, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    // far enough that the room fills the screen, whatever its shape (a phone stands it up the screen's long side)
    const fit = (fov, sx, sy) => { const v = fitFov(fov) * Math.PI / 360, h = Math.atan(Math.tan(v) * camera.aspect); return 1.35 * Math.max(sx / 2 / Math.tan(h), sy / 2 / Math.tan(v)); };   // V1.53: a margin, the room clear of the buttons
    if (RMODE === "above") fromAbove(cx, fy, cz + d * 0.04, 40 + fit(32, w, d), 32);   // V1.54: between a phone's buttons   // V1.29 (U2): flown, not cut; V1.53: a longer lens, from above (it was held to 6 m)
    else { const r = 0.5 * Math.hypot(w, d, 235), v = 22.5 * Math.PI / 180, h = Math.atan(Math.tan(v) * camera.aspect), D = (camera.aspect < 1 ? 0.62 : 0.85) * r / Math.sin(Math.min(v, h));   // the room's sphere in the narrower side (v72: a phone stands closer)
      const sx = Math.sign(233 - cx) || 1, sz = Math.sign(95 - cz) || 1;   // from the house's middle: over its inside walls, the outside wall behind
      flyTo([cx + sx * D * 0.4, fy + 60 + D * 0.78, cz + sz * D * 0.48], [cx, fy + 50, cz], 45, true, REDUCE); } }
  else if (RMODE === "stand") standIn();
  else if (!quiet) setView(S.view);
  reshadow(); dirty();
}
qs("#r3d-home")?.addEventListener("click", wholeRoom);
qs("#r3d-wallsel")?.addEventListener("change", e => { lookWall = e.target.value; syncButtons(); });   // v41: which wall the paints go on
document.addEventListener("keydown", e => { if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName)) wholeRoom(); });
let lostT = 0;
function lostCheck() {   // inside the room and nearly facing a wall, or looking at the floor or ceiling close up: the button glows, once a while
  const now = performance.now(); if (now - lostT < 1500 || S.edit) return; lostT = now;
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  const dist = camera.position.distanceTo(controls.target), tooSteep = Math.abs(d.y) > 0.93 && camera.position.y < R.CEIL * M;
  const b = qs("#r3d-home"); if (!b) return;
  if ((dist < 0.12 || tooSteep) && !b.classList.contains("lost")) { b.classList.add("lost"); setTimeout(() => b.classList.remove("lost"), 5000); }
}
function backToPlan() {                   // the plan: your picks, the bar beside the cabinet, no ideas
  S.sugg = Object.assign({}, DEF.sugg); S.svar = Object.assign({}, DEF.svar); S.ideas = Object.assign({}, DEF.ideas); S.beside = DEF.beside;
  S.barflap = S.lid = S.ctop = S.sdraw = false; S.trolley = "park"; applySvar(); applyState();
}
function setTry(on) {
  tryOpts = !!on; root.classList.toggle("trying", tryOpts);
  const t = qs("#r3d-try"); if (t) t.setAttribute("aria-checked", String(tryOpts));
  const bk = qs("#r3d-back"); if (bk) bk.hidden = !tryOpts;
  if (!tryOpts) { closeAct(); backToPlan(); } else { window.DemmaTools?.close(); toast("Tap a place to see what else could go there"); }
  updatePlanBar();
}
qs("#r3d-try")?.addEventListener("click", () => setTry(!tryOpts));
qs("#r3d-back")?.addEventListener("click", () => setTry(false));
function optSee(gk, it) {
  const g = optGroup(gk); it = it || (g && g.items.find(optOn));
  if (!it) { toast("Pick one first: the room shows it"); return; }
  if (it.aim && it.aim.view) setView(it.aim.view); else if (it.aim) flyTo(it.aim.eye, it.aim.at, it.aim.fov || 55);
}
function syncOpts() {
  for (const g of OPT.groups) {
    const on = g.items.filter(optOn);
    qsa(`[data-opt^="${g.k}:"]`).forEach(b => { const v = b.dataset.opt.split(":")[1], it = g.items.find(i => i.v === v);
      b.setAttribute("aria-pressed", String(v === "none" ? !on.length : !!(it && optOn(it)))); });
    const cap = qs(`[data-optcap="${g.k}"]`); if (!cap) continue;
    const say = it => `${it.title} (${it.size}${it.cost ? `; about £${it.cost[0]}–${it.cost[1]}` : ""}). ${it.where}`;
    cap.textContent = on.length ? on.map(say).join(" ") + (g.mode === "any" ? "" : " " + g.note.split(".").slice(1).join(".").trim()) : g.note;
  }
}
function syncButtons() {
  press("site", S.site); press("dining", S.dining); press("scene", S.scene); press("tod", S.tod);
  qsa("[data-scene]").forEach(b => b.classList.toggle("adjusted", b.dataset.scene === S.scene && !(sameAsScene() && S.master === 100)));   // v25: "Bright · adjusted"
  const ln = qs("#r3d-litst"); if (ln) ln.textContent = SCENES[S.scene].name + (sameAsScene() && S.master === 100 ? "" : " · adjusted") + (S.tod === "day" ? " · daytime" : "");
  const bn = qs("#r3d-boost"); if (bn) bn.hidden = !tableOpen(); press("lamp", S.lamp);
  const wh = (lookWall === "all" ? paintHex() : chHex("w:" + lookWall)).toLowerCase();                 // v38: the paint row shows the chosen wall's paint
  qsa("[data-paint]").forEach(b => b.setAttribute("aria-pressed", String(lookWall === "all" ? S.paint === b.dataset.paint : R.PAINTS[b.dataset.paint].hex.toLowerCase() === wh)));
  const ws = qs("#r3d-wallsel"); if (ws && ws.value !== lookWall) ws.value = lookWall;   // v41: the wall picker is a list now
  qsa("[data-lookwall]").forEach(b => { const k = b.dataset.lookwall; b.setAttribute("aria-pressed", String(k === lookWall)); const i = b.querySelector("i"); if (i) i.style.setProperty("--c", k === "all" ? paintHex() : chHex("w:" + k)); });
  const wm = qs("[data-wallmatch]"); if (wm) { wm.hidden = lookWall === "all"; wm.disabled = !S.walls[lookWall]; }
  press("drawers", S.drawers ? "out" : "in"); press("quality", S.quality); press("view", S.view);
  press("ceil", S.ceil); press("skirt", S.skirt); press("hceil", S.hceil && S.hceil !== "white" ? "" : "white"); press("plants", S.plants); press("chairs", S.chairs); press("seat", S.seat);
  press("cab", S.cab); press("cabw", S.cabw); press("tdoor", S.tdoor ? "open" : "shut");                                   // v30
  press("cam", S.cam); press("pad", S.pad ? "on" : "off"); press("foot", S.foot ? "on" : "off"); press("beside", S.beside); syncEye();   // v31
  qsa("[data-tog]").forEach(b => b.setAttribute("aria-pressed", String(!!S[b.dataset.tog])));
  qsa("[data-idea]").forEach(b => b.setAttribute("aria-pressed", String(!!S.ideas[b.dataset.idea])));
  qsa("[data-sugg]").forEach(b => b.setAttribute("aria-pressed", String(!!S.sugg[b.dataset.sugg])));
  qsa("[data-svar]").forEach(b => { const [k, v] = b.dataset.svar.split(":"); b.setAttribute("aria-pressed", String(svarOf(k) === v)); });   // v28
  let anyOn = false; qsa("[data-svrow]").forEach(r => { const on = !!S.sugg[r.dataset.svrow]; r.hidden = !on; anyOn = anyOn || on; });
  const svn = qs("#r3d-svnone"); if (svn) svn.hidden = anyOn;
  qsa("[data-decor]").forEach(b => { const [k, v] = b.dataset.decor.split(":"); b.setAttribute("aria-pressed", String(S.decor[k] === v)); });
  qs("#r3d-custom").value = lookWall === "all" ? S.custom : chHex("w:" + lookWall);
  qsa("[data-paintcustom]").forEach(b => b.setAttribute("aria-pressed", String(lookWall === "all" ? S.paint === "custom" && S.custom.toLowerCase() === b.dataset.paintcustom.toLowerCase() : wh === b.dataset.paintcustom.toLowerCase())));
  if (S.ceil !== "match" && qs("#r3d-ceil")) qs("#r3d-ceil").value = S.ceil;
  if (/^#[0-9a-f]{6}$/i.test(S.hceil || "") && qs("#r3d-hceil")) qs("#r3d-hceil").value = S.hceil;
  if (S.skirt !== "match" && qs("#r3d-skirt")) qs("#r3d-skirt").value = S.skirt;
  const warmWord = w => w < 25 ? "candle" : w < 45 ? "warm" : w <= 55 ? "warm white" : w < 80 ? "soft white" : "neutral";
  qsa("[data-lv]").forEach(i => { const k = i.dataset.lv, v = k === "master" ? S.master : k === "warm" ? (S.warm ?? 50) : (S.lv[k] ?? 0); i.value = v;
    qs(`[data-lvout="${k}"]`).textContent = k === "warm" ? warmWord(v) : `${Math.round(v)}%`; });
  qsa("[data-col]").forEach(i => { i.value = S.col[i.dataset.col] || WARM; });
  syncOpts();                                                                                       // v36
  if (actId) renderAct();                                                                           // v30: the item's card follows
}
root.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !root.contains(b)) return;
  const d = b.dataset;
  if (d.show) { showCtl(d.show); return; }
  if (SH) { if (d.view || d.walk || d.eye || d.level || b.id === "r3d-reset" || b.id === "r3d-full") SH.own = true; else if (!d.showopen) showStop(true); }   // v32: the camera's buttons leave the show running
  if (d.view) { setView(d.view); return; }
  if (d.rmode) { if (LIVV()) setView(LIV_RMODE[d.rmode]); else setRmode(d.rmode); if (actId) closeAct(); return; }   // v71: in it, from above, on its own (v78b: the living room's views)
  if (d.hbed) { liftBed(d.hbed === "up"); return; }                          // v71: the bed's card
  if (d.hdoor) { swingDoor(d.hdoor, !doorOpen(HPARTS[d.hdoor])); if (actId) renderAct(); return; }   // V1.26: a door's card
  if (d.hdoors) { swingAll(d.hdoors === "open"); return; }
  if (d.walk) { if (e.detail === 0) walk(d.walk); return; }   // v31: a pointer moves on pointerdown (held, it repeats); Enter or Space here
  if (d.eye) { lift(+d.eye); return; }
  if (d.level) { levelView(); return; }
  if (d.site) { S.site = d.site; applyState(); if (S.view === "dining") setView("dining"); }
  else if (d.dining) { S.dining = d.dining; S.tdoor = false; applyState(); if (S.view === "dining") setView("dining"); }   // v30: folding it shuts the door too
  else if (d.cab) { S.cab = d.cab; S.site = "C"; applyState(); if (S.view === "dining" || S.view === "chairs") setView(S.view); }   // v30: the compact or the sliding cabinet
  else if (d.cabw) { S.cabw = d.cabw; applyState(); if (S.view === "dining" || S.view === "chairs") setView(S.view); }              // v33: the table 90 or 80 wide
  else if (d.tdoor) { S.tdoor = d.tdoor === "open"; if (S.tdoor && S.chairs === "open") S.chairs = "cupboard"; applyState(); }
  else if (d.scene) S.scene = d.scene, S.lv = Object.assign({}, SCENES[d.scene].levels), S.master = 100, applyLight(), updateCaption(), store.set(KEY, S);   // tapping the tile again resets it
  else if (d.tod) S.tod = d.tod, applyLight(), updateCaption(), store.set(KEY, S);
  else if (d.ceil) S.ceil = d.ceil, repaint(), store.set(KEY, S), dirty();
  else if (d.hceil) S.hceil = d.hceil, hceilApply(), syncButtons(), store.set(KEY, S), dirty();   // V2.2: the house's ceilings white again
  else if (d.skirt) S.skirt = d.skirt, repaint(), store.set(KEY, S), dirty();
  else if (d.colreset) S.col[d.colreset] = WARM, applyLight(), store.set(KEY, S);
  else if (d.tog) S[d.tog] = !S[d.tog], applyLight(), store.set(KEY, S);
  else if (d.layer) { const [k, v] = d.layer.split(":"); S.lv = Object.assign({}, S.lv, { [k]: v === "on" ? (SCENES[S.scene].levels[k] || 60) : 0 }); applyLight(); updateCaption(); store.set(KEY, S); }   // v30: a light on or off from a card
  else if (d.opt) { const [gk, v] = d.opt.split(":"); optPick(gk, v); }                            // v36: the option rows
  else if (d.optsee) { optSee(d.optsee); return; }
  else if (d.ctop) { S.ctop = d.ctop === "up"; applyState(); }                                       // v36: the lift-top coffee table
  else if (d.sugg || d.suggall) {     // v21: a suggestion on or off (a piece you'd removed in Edit room comes back), or all of them
    const keys = d.sugg ? [d.sugg] : qsa("[data-sugg]").map(x => x.dataset.sugg), on = d.sugg ? !S.sugg[d.sugg] : d.suggall === "on";
    S.sugg = Object.assign({}, S.sugg); keys.forEach(k => { S.sugg[k] = on; if (S.layout["sg_" + k]) delete S.layout["sg_" + k].off; });
    if (on && keys.includes("bartrolley")) { S.beside = "trolley"; S.site = "C"; S.cab = "compact"; }   // v34: it's the slim trolley, dressed
    if (on && keys.includes("barcase") && S.plants === "breast") S.plants = "corner";                  // v34: under the case, on a free breast
    if (d.sugg) extrasRule("sugg", d.sugg, on);                                                        // v37: one thing per place
    else if (on) { S.sugg.hallbench = S.sugg.wardrobe = false; S.sugg.windowseat = true; S.sugg.alcoveshelves = true; }   // all on: the corner takes the seat
    applyState(); }
  else if (d.optclear) {                                                                               // v37: every extra off, back to the plan
    backToPlan(); closeAct(); toast("Back to your plan"); }                                            // v39: your picks stay (they're the plan)
  else if (d.svar) { const [k, v] = d.svar.split(":"); S.svar = Object.assign({}, S.svar, { [k]: v }); applySvar(); placeAll(); updateCaption(); store.set(KEY, S); dirty(); }   // v28
  else if (d.tour) { tourCtl(d.tour); return; }
  else if (b.id === "r3d-tourbtn") { tourStart(); return; }
  else if (b.id === "r3d-link") { copyLook(); return; }
  else if (d.decor) {           // v20: decor; picking what's in the case (or its frame) shows the case, which hangs with the table by the stairs
    const [k, v] = d.decor.split(":"), was = caseOn(); S.decor = Object.assign({}, S.decor, { [k]: v });
    if ((k === "fill" || k === "frame") && S.site === "A") S.site = "C";                              // v27: the case needs the breast free (v34: it's the plan)
    applyState(); if ((k === "fill" || k === "frame") && !was) setView("breast"); }
  else if (d.idea) S.ideas = Object.assign({}, S.ideas, { [d.idea]: !S.ideas[d.idea] }), applyLight(), placeAll(), updateCaption(), store.set(KEY, S);
  else if (d.plants) {           // v18: the layout puts the stand and the shelf back on their spots for it
    S.plants = d.plants; for (const k of ["plants", "records"]) if (S.layout[k]) { delete S.layout[k].x; delete S.layout[k].z; delete S.layout[k].rot; }
    applyState(); }
  else if (d.feature) {                                                                                // v39, item 13: feature-wall presets
    S.walls = {}; if (d.feature !== "none") S.walls[d.feature] = "#5e6a5b"; repaint(); updateCaption(); store.set(KEY, S); dirty(); }
  else if (d.lookwall) lookWall = d.lookwall;                                                        // v38: which wall the paints go on
  else if (d.wallmatch) setWall(lookWall, "match"), repaint(), updateCaption(), store.set(KEY, S), dirty();
  else if (d.paint) (lookWall === "all" ? (S.paint = d.paint) : setWall(lookWall, d.paint)), repaint(), updateCaption(), store.set(KEY, S), dirty();
  else if (d.lamp) S.lamp = d.lamp, applyState();
  else if (d.drawers) S.drawers = d.drawers === "out", applyState();
  else if (d.chairs) { S.chairs = d.chairs; if (d.chairs === "open") S.tdoor = false; applyState(); }   // v30: one door open at a time
  else if (d.seat) S.seat = d.seat, applyState();
  else if (d.cam) S.cam = d.cam, applyCam(), store.set(KEY, S);
  else if (d.moment) { playMoment(d.moment); return; }                                              // v31
  else if (d.showopen) { showOpen(); return; }
  else if (d.blind) { S.blind = d.blind; applyState(); }
  else if (d.barflap) { S.barflap = d.barflap === "open"; applyState(); }                          // v34: the drinks cabinet's front
  else if (d.lid) { S.lid = d.lid === "off"; applyState(); }                                       // v34: the storage ottoman's lid                                          // v34
  else if (d.lp) { S.lp = d.lp === "out"; applyState(); }
  else if (d.trolley) { S.trolley = d.trolley; if (d.trolley === "out") { S.beside = "trolley"; S.site = "C"; S.cab = "compact"; } applyState(); }
  else if (d.beside) { S.beside = d.beside; if (d.beside !== "clear") { S.site = "C"; S.cab = "compact"; } extrasRule("beside", d.beside, true); applyState(); }   // v31; v37: one thing per place
  else if (d.sdraw) { S.sdraw = d.sdraw === "out"; applyState(); }                                // v37: the drawers in the bottom steps
  else if (d.foot) { S.foot = d.foot === "on"; if (S.foot) { S.site = "C"; S.dining = "folded"; } applyState(); }
  else if (d.pad) S.pad = d.pad === "on", applyPad(), store.set(KEY, S);
  else if (d.quality) S.quality = d.quality, S.picked = true, applyLight(), store.set(KEY, S);
  else if (b.id === "r3d-full") { const st = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.())?.catch?.(() => {}); return; }
  else if (d.paintcustom) (lookWall === "all" ? (S.custom = d.paintcustom, S.paint = "custom") : setWall(lookWall, d.paintcustom)), repaint(), updateCaption(), store.set(KEY, S), dirty();   // v25: Deep green, a ready-made custom colour
  else if (b.id === "r3d-reset") { setView(S.view); return; }
  else return;
  syncButtons();
});
qs("#r3d-custom").addEventListener("input", e => { if (lookWall === "all") { S.custom = e.target.value; S.paint = "custom"; } else setWall(lookWall, e.target.value); repaint(); syncButtons(); updateCaption(); store.set(KEY, S); dirty(); });
// v15: the sliders, the colour bulbs, and the ceiling and skirting paints
root.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (d.lv) { const v = +t.value; if (d.lv === "master") S.master = v; else if (d.lv === "warm") S.warm = v; else S.lv[d.lv] = v; syncButtons(); applyLight(); updateCaption(); store.set(KEY, S); }
  else if (d.col) { S.col[d.col] = t.value; applyLight(); }
  else if (t.id === "r3d-ceil") { S.ceil = t.value; press("ceil", ""); repaint(); dirty(); }
  else if (t.id === "r3d-hceil") { S.hceil = t.value; press("hceil", ""); hceilApply(); dirty(); }
  else if (t.id === "r3d-skirt") { S.skirt = t.value; press("skirt", ""); repaint(); dirty(); }
  else if (t.id === "r3d-eye") { lift(+t.value); const o = qs("#r3d-eyeout"); if (o) o.textContent = `${t.value} cm`; return; }   // v31
  else return;
  store.set(KEY, S);
});

