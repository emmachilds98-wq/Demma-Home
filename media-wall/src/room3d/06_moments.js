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
  showStop(false); const { sugg, ...set } = m.set; Object.assign(S, set);
  if (sugg) S.sugg = Object.assign({}, S.sugg, { [sugg.slice(1)]: true });                       // v37: "+key" switches a suggestion on
  if (set.beside) extrasRule("beside", set.beside, true);
  if (m.set.scene) { S.lv = Object.assign({}, SCENES[m.set.scene].levels); S.master = 100; }
  applyState(); syncButtons(); if (m.aim) flyTo(m.aim.eye, m.aim.at, m.aim.fov); else setView(m.view); toast(m.say);
}
/* v31: "Watch it open". v32, client: "slow down the playback of the table opening to show clearly how it puts together and opens in a
   slow and clear manner": thirteen steps, about forty seconds, on the show's own clock, each step on a card (what you do, a bar; back,
   pause, next, stop). Every part's place is worked out from the clock, so pausing or stepping back and on is exact. Looking round
   doesn't stop it (the camera then stays where you put it); Stop, Esc or any other button does, and leaves the table out for six. */
let SH = null;
function showSteps(P) {
  const C = P.C, st = [], add = (title, text, dur, acts, view) => { if (acts === null) return; st.push({ title, text, dur, acts, view }); };
  const each = (list, to, gap, ms, from = 0) => list.map((a, i) => [a, to, from + i * gap, ms]);
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
function showOpen() {
  showStop(false); if (tourSt) tourEnd(); closeAct();
  Object.assign(S, { site: "C", dining: "folded", tdoor: false, chairs: "cupboard" });
  cabSnap = true; applyState(); cabSnap = false; syncButtons();
  const P = cabP(); if (!P) return;
  CAB_TW.clear();
  // each part's keyframes: [time s, p, linear], held between its moves
  const steps = showSteps(P), tracks = new Map();
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
  SH = { P, steps, tracks, T, t: 0, i: -1, paused: false, last: performance.now(), own: false };
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
  SH = null; root.classList.remove("touring"); qs("#r3d-show").hidden = true;
  const b = qs('[data-show="pause"]'); if (b) { b.setAttribute("aria-label", "Pause"); b.querySelector(".ms").textContent = "pause"; }
  if (finish) { Object.assign(S, { site: "C", dining: "six", tdoor: false, chairs: "cupboard" }); applyState(); syncButtons(); }
}
/* v17: the ideas (ideas.py), each its own group, all hidden until its button is on */
const IDEA_G = {};
let ideaLed;
/* v20: the decor to try (S.decor): set by applyDecor() */
let rugMesh, curtCloth, caseFrameM, cushG, coffeeG, floorMat, shelfMat;
/* v21: suggested furniture and decor (ideas.SUGGEST, the same keys), each on or off (S.sugg); the floor pieces move in Edit room */
const SUGG_G = {};
/* v34, client: "i like the large glass display case on the chimney breast": it's in the plan, so it's on the breast whenever the table
   isn't (the flip-top's site A, set aside) */
const caseOn = () => S.site !== "A" && S.plants !== "breast";   // layout B's plant stand (158 tall) stands in front of the breast
/* v34: more things that work from a tap (placeWork): the blind rolls up and down, the front records lift out of the vinyl stand, the
   trolley beside the cabinet pulls out for dinner; each an anim, eased by the cabinets' tween */
const WORK = {};
