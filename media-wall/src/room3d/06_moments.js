/* v31: suggested set-ups (Layout): several choices at once, then a flight to the view that shows them */
const MOMENTS = {
  dinner:  { set: { site: "C", dining: "six", tdoor: false, scene: "cosy", tod: "evening", curtains: true }, view: "dining",
             say: "Dinner for six: the table out, the curtains drawn, the lights low, bar 2 up over the table" },
  four:    { set: { site: "C", dining: "four", tdoor: false, scene: "bright", tod: "day", curtains: false }, view: "sit",
             say: "Lunch for four: the table out, two a side, from your seat at the end" },
  film:    { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "film", tod: "evening", curtains: true }, view: "sofa",
             say: "Film night: everything packed away, the lights down" },
  morning: { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "bright", tod: "day", curtains: false }, view: "room",
             say: "An everyday morning: the cabinet shut, the room clear" },
  // v37: the ottoman's games out, cosy; and drinks at the bar built in beside the cabinet, its doors open (v38: the record table's lid stays down to play on)
  games:   { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "cosy", tod: "evening", curtains: true, lid: true, ctop: false },
             aim: { eye: [300, 150, -60], at: [200, 35, -170], fov: 52 }, say: "Games night: the ottoman's lid off, the lights cosy" },
  drinks:  { set: { site: "C", cab: "compact", dining: "folded", tdoor: false, chairs: "cupboard", scene: "cosy", tod: "evening", beside: "bar", barflap: true },
             aim: { eye: [345, 138, -180], at: [460, 108, -262], fov: 46 }, say: "Drinks: the bar beside the cabinet open, glasses down from the rail" },
};
function playMoment(k) {
  const m = MOMENTS[k]; if (!m) return;
  showStop(false); const set = m.set; Object.assign(S, set);
  if (set.beside) extrasRule("beside", set.beside, true);
  if (m.set.scene) { S.lv = Object.assign({}, SCENES[m.set.scene].levels); S.master = 100; }
  applyState(); syncButtons(); if (m.aim) flyTo(m.aim.eye, m.aim.at, m.aim.fov); else setView(m.view); toast(m.say);
}
/* v31–v32: "Watch it open": thirteen steps, about forty seconds, on the show's own clock, each on a card; every place worked out from
   the clock, so pause and step are exact. Stop, Esc or another button ends it with the table out for six. */
let SH = null;
function showSteps(P) {
  const C = P.C, st = [], add = (title, text, dur, acts, view) => { st.push({ title, text, dur, acts, view }); };
  const each = (list, to, gap, ms) => list.map((a, i) => [a, to, i * gap, ms]);
  const rig = (a, b, ms) => [[P.rig, RIG[b], 0, ms, true]];
  if (P.sl) {
    add("Packed away", "The table stands folded on its hinge rail behind door A; the six chairs and their pads are behind door B.", 2.6, [], "chairs");
    add("Slide door B open", "It runs on the back track, in behind door A.", 3, [[P.doorC, 1, 0, 2.4]]);
    add("Take out the pads and the chairs", "The six pads first, then the chairs, the front ones first. Folded, each is 9 deep.", 1.6 + P.stand.length * 0.55, each(P.stand, 1, 0.55, 1.2));
    add("Slide door B shut", "", 2.6, [[P.doorC, 0, 0, 2.1]]);
    add("Slide door A open", "It runs on the front track, over door B. The table is behind it, folded face to face.", 3.3, [[P.doorT, 1, 0, 2.7]], "dining");
  } else {
    add("Packed away", `Everything is inside: the table on its hinge rail and the six padded chairs, in a cabinet ${Math.round(C.len)} long and ${C.d} deep.`, 2.6, [], "chairs");
    add("Open the chair door", "It turns right round on its piano hinge and lies back against the table door.", 3.2, [[P.doorC, 1, 0, 2.6]]);
    add("Take out four chairs", "Two from the floor and two from the shelf, the front ones first. Folded, each is 10 thick.", 4.1, each(P.stand, 1, 0.7, 1.4));
    add("Shut the chair door", "", 2.7, [[P.doorC, 0, 0, 2.2]]);
    add("Open the table door", "It turns the other way, towards the window. The folded table is behind it.", 3.4, [[P.doorT, 1, 0, 2.8]], "dining");
    if (P.base.length) add("Take out two more chairs", "The two lying in the base slide out, the front one first.", 3.2, each(P.base, 1, 0.7, 1.4));
  }
  add("Tilt the table out", "Both halves together, folded face to face, turn out on the piano hinge at the rail.", 3.3, rig(0, 1, 2.8), "unfold");
  add("Fold down the first two legs", "They swing down from under the first half and lock on their brackets.", 2.7, rig(1, 2, 2.2));
  add("Lower it onto them", "The first half comes down level, held by the hinge at the rail and its two legs.", 3.1, rig(2, 3, 2.6));
  add("Flip the second half over", "It turns over on the three flip-top hinges at the joint, its own legs still folded under it.", 3.9, rig(3, 4, 3.4));
  add("Fold down its two legs", "", 2.3, rig(4, 5, 1.8));
  add("Lay it flat", `The joint closes flush: the table is ${Math.round(C.len_open || C.len)} long and ${Math.round(C.top[0])} wide.`, 2.6, rig(5, 6, 1.8));
  add("Six sit down", "The padded chairs unfold round it.", 4.6, each(P.seats.six, 0, 0.35, 1.2));
  return st;
}
const BED_AIM = [[300, 150, -60], [150, 30, -200], 58];   // V3.71: the green sofa bed's own show on the same clock and card: the coffee table steps aside, the bed pulls out, then all goes back
function bedSteps() {
  const B = R.SOFABED, w = B.w - B.corner - B.arm, l = B.seat_d + B.bed_out;   // the two seats and the top: 128 × 128
  return [
    { title: "The sofa", text: "Seats up, the coffee table where it stands.", dur: 2.4, acts: [], aim: BED_AIM },
    { title: "Move the coffee table", text: `It goes ${Math.round(WORK.cof.out || 0)} towards the media wall, clear of the bed.`, dur: 3, acts: [[WORK.cof, 1, 0, 2.4]] },
    { title: "Pull it up and out", text: "By the two loops under the middle seats: it lifts a little and rolls out on its castors, a hand past where it rests.", dur: 3.6, acts: [[WORK.sbed, 0.5, 0, 3, true]] },
    { title: "Lift the top", text: "The padded top rises on its black frame to the seats' height.", dur: 2.6, acts: [[WORK.sbed, 0.8, 0, 2, true]] },
    { title: "Clip it back", text: `Push it back against the seats: it sits level with them, about ${Math.round(w)} × ${Math.round(l)} to sleep on.`, dur: 2.4, acts: [[WORK.sbed, 1, 0, 1.6, true]] },
    { title: "A bed", text: "", dur: 2.2, acts: [] },
    { title: "Put it away", text: "Pull it off the seats, lower the top, push it back under.", dur: 5, acts: [[WORK.sbed, 0.8, 0, 1.2, true], [WORK.sbed, 0.5, 1.4, 1.6, true], [WORK.sbed, 0, 3.2, 1.8, true]] },
    { title: "The coffee table back", text: "", dur: 3, acts: [[WORK.cof, 0, 0, 2.4]] }];
}
function showOpen(kind) {
  showStop(false); if (tourSt) tourEnd(); closeAct();
  const bed = kind === "bed";
  if (bed) Object.assign(S, { sofa: "bed", sbed: false }); else Object.assign(S, { site: "C", dining: "folded", tdoor: false, chairs: "cupboard" });
  cabSnap = true; applyState(); cabSnap = false; syncButtons();
  const P = bed ? {} : cabP(); if (!P) return;
  CAB_TW.clear();
  const steps = bed ? bedSteps() : showSteps(P), tracks = new Map();   // each part's keyframes: [time s, p, linear], held between its moves
  let T = 0;
  for (const s of steps) {
    s.t0 = T;
    for (const [a, to, at, ms, lin] of s.acts) {
      if (!tracks.has(a)) tracks.set(a, [[0, a.p, false]]);
      const tr = tracks.get(a), from = tr[tr.length - 1][1];
      tr.push([T + at, from, false], [T + at + ms, to, !!lin]);
    }
    T += s.dur;
  }
  SH = { P, steps, tracks, T, t: 0, i: -1, paused: false, last: performance.now(), own: false, kind: bed ? "bed" : "cab" };
  root.classList.add("touring"); qs("#r3d-show").hidden = false;
  showCard(); dirty();
}
function showPose(t) {
  for (const [a, tr] of SH.tracks) {
    let v = tr[tr.length - 1][1];
    for (let j = 1; j < tr.length; j++) if (t < tr[j][0]) {
      const [t0, v0] = tr[j - 1], [t1, v1, lin] = tr[j], k = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
      v = v0 + (v1 - v0) * (lin ? k : ease(k)); break;
    }
    a.set(v);
  }
  reshadow();
}
function showCard() {
  const i = SH.steps.reduce((n, s, j) => (SH.t >= s.t0 ? j : n), 0), s = SH.steps[i];
  qs("#r3d-showbar").style.width = `${Math.min(100, SH.t / SH.T * 100)}%`;
  if (i === SH.i) return;
  SH.i = i;
  qs("#r3d-shown").textContent = `Step ${i + 1} of ${SH.steps.length}`;
  qs("#r3d-showh").textContent = s.title; qs("#r3d-showp").textContent = s.text; qs("#r3d-showp").hidden = !s.text;
  if (s.view && !SH.own) setView(s.view, false, 1600);
  if (s.aim && !SH.own) flyTo(...s.aim);                                                         // V3.71: the sofa bed's show
}
function showTick(now) {         // from the frame loop
  if (!SH) return false;
  const dt = Math.min(100, now - SH.last); SH.last = now;
  if (!SH.paused) SH.t += dt / 1000;
  if (SH.t >= SH.T) { SH.t = SH.T; showPose(SH.T); showStop(true); return true; }
  showPose(SH.t); showCard();
  return true;
}
function showCtl(c) {
  if (!SH) return;
  if (c === "stop") { showStop(true); return; }
  if (c === "pause") {
    SH.paused = !SH.paused; const b = qs('[data-show="pause"]');
    b.setAttribute("aria-label", SH.paused ? "Carry on" : "Pause"); b.querySelector(".ms").textContent = SH.paused ? "play_arrow" : "pause";
    return;
  }
  const i = SH.i, s = SH.steps;
  if (c === "next") { if (i + 1 >= s.length) { showStop(true); return; } SH.t = s[i + 1].t0; }
  if (c === "prev") SH.t = s[Math.max(0, SH.t - s[i].t0 < 1 ? i - 1 : i)].t0;
  showPose(SH.t); showCard(); dirty();
}
function showStop(finish = true) {
  if (!SH) return;
  const bed = SH.kind === "bed";
  SH = null; root.classList.remove("touring"); qs("#r3d-show").hidden = true;
  const b = qs('[data-show="pause"]'); if (b) { b.setAttribute("aria-label", "Pause"); b.querySelector(".ms").textContent = "pause"; }
  if (finish && bed) { S.sbed = false; applyState(); syncButtons(); }                              // V3.71: the bed goes back in
  else if (finish) { Object.assign(S, { site: "C", dining: "six", tdoor: false, chairs: "cupboard" }); applyState(); syncButtons(); }
}
const IDEA_G = {};   // v17: the ideas (ideas.py), each its own group, all hidden until its button is on
let ideaLed;
let rugMesh, curtCloth, caseFrameM, cushG, coffeeG, floorMat, shelfMat;   // v20: the decor to try (S.decor): set by applyDecor()
const SUGG_G = {};   // v21: suggested furniture and decor (ideas.SUGGEST, the same keys), each on or off (S.sugg); the floor pieces move in Edit room
const caseOn = () => S.site !== "A" && !(S.plants === "breast" && S.sugg.alcoveshelves);   // v34: the glass display case is on the breast whenever the table isn't (site A, set aside)
const caseBreast = () => caseOn() && S.plants !== "breast";   // V3.14: with the plants on the breast (the plan) the case and the "now playing" ledge hang over the vinyl stand left of the window
function placeCorner() {
  const K = R.IDEAS.case_corner, C = R.IDEAS.case, on = S.plants === "breast", ox = -((C.x[0] + C.x[1]) / 2 + (K.x[0] + K.x[1]) / 2) * M;
  for (const g of [IDEA_G.case, G.now_ledge]) if (g) { g.rotation.y = on ? Math.PI : 0; g.position.x = on ? ox : 0; g.position.z = on ? K.z * M : 0; }
}
const WORK = {};   // v34: things that work from a tap (placeWork): the blind, the records, the trolley; each an anim eased by the cabinets' tween
