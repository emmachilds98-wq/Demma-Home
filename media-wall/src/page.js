const use = n => (window.sharedStore && window.sharedStore.use) ? window.sharedStore.use(n) : Promise.resolve(null);
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ---------- pictures borrowed from the viewer's set (each embedded once); each sheet's pictures load when it opens */
function arts(el) { if (el) $$("img[data-art]:not([src])", el).forEach(im => { const u = DATA.img[im.dataset.art]; if (u) im.src = u; }); }
function jumpTo(el) { if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" })); }

/* v24: chips for the sections in a long chapter (a sidebar on wide screens) */
$$(".toc").forEach(nav => {
  const hs = $$(".doc h2, .doc h3, .block > h2.ptitle, .block > .qhead > h2.ptitle", nav.parentElement), bs = [];
  nav.parentElement.classList.add("has-toc");                  // v24: a sticky sidebar on wide screens
  hs.forEach((h, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip" + (h.tagName === "H2" ? " h2" : "");
    b.textContent = h.textContent.replace(/:.*$/, ""); b.addEventListener("click", () => jumpTo(h));
    nav.appendChild(b); bs.push(b);
  });
  if ("IntersectionObserver" in window) {                     // the section you're reading is marked
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { const k = hs.indexOf(e.target); bs.forEach((b, j) => b.classList.toggle("on", j === k)); } }); },
      { root: null, rootMargin: "-80px 0px -70% 0px" });
    hs.forEach(h => io.observe(h));
  }
});
/* ---------- the render viewer */
const NAMES = { mint: "your pale mint (#dbffc8), the chosen colour", card_room: "Farrow & Ball Card Room Green No. 79", treron: "Farrow & Ball Treron No. 292", sage: "Little Greene Sage Green No. 80", deep: "the deep forest green from earlier versions" };
const VIEWS = { join: "Artisan oak media wall", side: "The PC side wall, seen from the room", drawers: "Every drawer out" };
const view = Object.assign({ style: "join", paint: "mint", key: false, dims: false }, store.get("mw13-view", {}));
if (!view.v51) { view.v51 = 1; view.paint = "mint"; }   // v51, client: "Switch to the pale mint": once, a saved view moves to it
const shot = $("#shot"), cap = $("#cap"), keyBtn = $("#k-key"), dims = $("#dims"), dimsBtn = $("#k-dims");
function draw() {
  if (!VIEWS[view.style]) view.style = "join";
  if (view.style !== "join") view.key = false;
  shot.src = view.key ? DATA.img["key_" + view.style] : DATA.img["art_" + view.style + "_" + view.paint];
  shot.alt = VIEWS[view.style] + (view.key ? " with numbered key" : " in " + NAMES[view.paint]);
  $$("[data-style]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.style === view.style)));
  $$("[data-paint]").forEach(b => { b.setAttribute("aria-pressed", String(!view.key && b.dataset.paint === view.paint)); b.disabled = view.key; });
  keyBtn.setAttribute("aria-pressed", String(view.key));
  keyBtn.disabled = view.style !== "join";
  dims.src = DATA.img["dims_" + view.style];
  dims.hidden = !view.dims || view.key;
  dimsBtn.setAttribute("aria-pressed", String(view.dims && !view.key));
  dimsBtn.disabled = view.key;
  cap.textContent = view.key
    ? ("Full numbered key for the artisan oak build, in Card Room Green. Game drawer and lower record tray pulled out 30 cm. Dashed lines are hidden: gold for data, audio and low-voltage leads, coral for mains. The numbers are listed in the Media wall tab.")
    : view.style === "six" ? "The flip-top open on its gate leg (110 × 160), still on the wall, set for six (three a side), in " + NAMES[view.paint] + ". The camera stands in line with the alcove's edge so both spot bars show."
    : view.style === "drawers" ? "Every drawer out, in " + NAMES[view.paint] + ": the game drawer and the upper record tray 30 cm out, the hidden plinth drawer 25 cm out. In use, open one record tray at a time."
    : view.style === "side" ? "The PC side wall in " + NAMES[view.paint] + ": the ledge round the corner, the PC on its shelf with the keyboard tray, its leads inside the wall, the sofa below; dashed, the chimney breast's outline and the alcove's depth: 38 of the 46 cm base inside it, 8 proud; the media wall end-on at the right (the breast cut away)."
    : VIEWS[view.style] + ", shown in " + NAMES[view.paint] + ". Evening light, drawn to the measured room.";
  store.set("mw13-view", view);
}
$$("[data-style]").forEach(b => b.addEventListener("click", () => { view.style = b.dataset.style; draw(); }));
$$("[data-paint]").forEach(b => b.addEventListener("click", () => { view.paint = b.dataset.paint; draw(); }));
keyBtn.addEventListener("click", () => { view.key = !view.key; draw(); });
dimsBtn.addEventListener("click", () => { view.dims = !view.dims; draw(); });
draw();

/* ---------- full size (HD) */
const lb = $("#lightbox"), lbImg = $("#lb-img"), lbDims = $("#lb-dims"), lbScroll = $("#lb-scroll");
$("#k-full").addEventListener("click", () => {
  lbImg.src = shot.src; lbImg.alt = shot.alt;
  lbDims.src = dims.src; lbDims.hidden = dims.hidden;
  lb.hidden = false; document.body.style.overflow = "hidden";
  requestAnimationFrame(() => { lbScroll.scrollLeft = (lbScroll.scrollWidth - lbScroll.clientWidth) / 2; lbScroll.scrollTop = (lbScroll.scrollHeight - lbScroll.clientHeight) / 2; });
  $("#lb-close").focus();
});
function closeLb() { lb.hidden = true; document.body.style.overflow = ""; $("#k-full").focus(); }
$("#lb-close").addEventListener("click", closeLb);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) closeLb(); });
let drag = null;
lbScroll.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") { drag = { x: e.clientX, y: e.clientY, l: lbScroll.scrollLeft, t: lbScroll.scrollTop }; lbScroll.setPointerCapture(e.pointerId); } });
lbScroll.addEventListener("pointermove", e => { if (drag) { lbScroll.scrollLeft = drag.l - (e.clientX - drag.x); lbScroll.scrollTop = drag.t - (e.clientY - drag.y); } });
lbScroll.addEventListener("pointerup", () => { drag = null; });

/* ---------- fit proof filter */
$("#fit-only").addEventListener("click", e => {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  e.currentTarget.setAttribute("aria-pressed", String(on));
  $("#fit-zones").classList.toggle("fitonly", on);
  $$("#fit-zones details.zone").forEach(d => { if (on && d.querySelector("tr.r-tight, tr.r-check")) d.open = true; });
});

/* ---------- v25: the Plan sheet's opening view, read from the page's own state: three rings, Up next, the build bar */
function ring(id, n, t) { const a = document.getElementById(id), c = a && a.querySelector(".vl"); if (!c) return; const L = 2 * Math.PI * 34; c.style.strokeDasharray = L; c.style.strokeDashoffset = L * (1 - (t ? n / t : 0)); }
function dash() {
  const st = $$(".step"), sd = $$(".step.done"), next = st.find(x => !x.classList.contains("done"));
  const tk = window.PIECEP ? PIECEP.tasks : [sd.length, st.length];   // v46: tasks, not steps
  $("#d-steps").textContent = tk[0] + "/" + tk[1]; ring("d-steps-bar", tk[0], tk[1]);
  $$("#segbar i").forEach(i => i.classList.toggle("on", !!document.querySelector("#step-" + i.dataset.s + ".done")));
  const nx = $("#d-next"), nb = $("#d-nextdone");
  if (next) { nx.textContent = $("h3", next).textContent; $("#d-nextn").textContent = next.dataset.s; $("#d-nextmeta").textContent = $(".smeta", next).textContent; nb.hidden = false; nb.dataset.s = next.dataset.s; $("#d-nextgo").dataset.step = next.dataset.s; }
  else { nx.textContent = "Every step done"; $("#d-nextn").textContent = "✓"; $("#d-nextmeta").textContent = "The build is finished: enjoy the room."; nb.hidden = true; }
  const bi = $$("#tracker li[data-kind=buy]"), bd = bi.filter(x => x.classList.contains("done"));
  $("#d-buy").textContent = bd.length + "/" + bi.length; ring("d-buy-bar", bd.length, bi.length);
  const paid = $$("#tracker .paid input").reduce((a, i) => a + (parseFloat(i.value) || 0), 0);
  $("#d-paid").textContent = "\u00a3" + Math.round(paid).toLocaleString("en-GB") + " paid so far";
  if (window.PICKS) PICKS.paint();
}
let dashQ = false;
const dashSoon = () => { if (!dashQ) { dashQ = true; requestAnimationFrame(() => { dashQ = false; dash(); }); } };
["#steps-ol", "#tracker"].forEach(s => { const el = $(s); if (el) new MutationObserver(dashSoon).observe(el, { subtree: true, attributes: true, attributeFilter: ["class"] }); });
document.addEventListener("input", dashSoon);
$("#d-nextdone").addEventListener("click", e => { const cb = document.getElementById("sd-" + e.currentTarget.dataset.s); if (cb && !cb.checked && !cb.disabled) { cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true })); } });
/* links into the 3D room with its options set */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-r3d]");
  if (!b) return;
  const o = JSON.parse(b.dataset.r3d);
  closeSheets();                 // v25: the room is the home screen
  if (window.R3D) window.dispatchEvent(new CustomEvent("r3d-set", { detail: o })); else window.__r3dPending = o;
});
/* the 3D gallery opens in the full-size viewer */
$$(".g3d").forEach(b => b.addEventListener("click", () => {
  const im = $("img", b);
  lbImg.src = im.src; lbImg.alt = im.alt; lbDims.hidden = true;
  lb.hidden = false; document.body.style.overflow = "hidden"; $("#lb-close").focus();
}));

/* ---------- shared state: tracker, build steps (v30: the questions and their answers are gone) */
let db = null, user = null, myId = null, readOnly = false;
const tstate = {};            // tracker/<id> bodies as saved
const sstate = {};            // steps/<n> bodies as saved
const chains = {};            // one write at a time per document
function write(path, body) {
  const run = () => db.doc(path).set(body);
  chains[path] = (chains[path] || Promise.resolve()).then(run, run);
  return chains[path];
}
function onWriteError(e, stEl) {
  if (e && e.code === "invalid_argument") { readOnly = true; lockInputs(); }
  if (stEl) { stEl.textContent = e && e.code === "quota_exceeded" ? "The page's storage is full." : "Couldn't save. Try again in a moment."; stEl.className = "st err"; }
}
function lockInputs() { $$(".items input, .sdone input").forEach(el => el.disabled = true); }

$("#copy-cuts").addEventListener("click", async () => {
  const box = $("#cuts-box"), st = $("#cuts-st");
  try { await navigator.clipboard.writeText(box.value); st.textContent = "Copied. Paste it into an email to the timber merchant."; box.hidden = true; }
  catch (e) { box.hidden = false; box.focus(); box.select(); st.textContent = "Select the text below and copy it."; }
});

/* tracker and the cost chart */
const local = store.get("mw12-tracker", {});
const money = v => "£" + (Math.round(v * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
function tget(id) { return (db ? tstate[id] : local[id]) || null; }
function paintTracker() {
  let done = 0, paid = 0, leftLo = 0, leftHi = 0, jobs = 0, jobsDone = 0, buys = 0;   // v33: one count, the things to buy; the jobs apart
  const phPaid = {};
  DATA.track.forEach(r => {
    const s = tget(r.id), isDone = s ? !!s.done : r.done;
    const li = document.querySelector('[data-t="' + r.id + '"]'), cb = li.querySelector("input[type=checkbox]"), pd = li.querySelector("input[type=number]");
    cb.checked = isDone; li.classList.toggle("done", isDone);
    if (pd && document.activeElement !== pd) pd.value = s && typeof s.paid === "number" ? s.paid : "";
    if (r.kind === "buy") { buys++; if (isDone) done++; else { leftLo += r.lo || 0; leftHi += r.hi || 0; } } else { jobs++; if (isDone) jobsDone++; }
    if (s && typeof s.paid === "number") { paid += s.paid; phPaid[r.phase] = (phPaid[r.phase] || 0) + s.paid; }
  });
  $$("details.phase").forEach(d => {
    const lis = $$(".items li[data-t]", d), n = lis.filter(li => li.classList.contains("done")).length;
    $(".pd", d).textContent = n + " of " + lis.length + " done";
  });
  DATA.phases.forEach(p => {
    const row = document.querySelector('.crow[data-ph="' + p.idx + '"]'), v = phPaid[p.name] || 0;
    $(".cpaid", row).style.width = Math.min(100, 100 * v / DATA.top) + "%";
    $(".cpv", row).textContent = v ? "paid " + money(v) : "";
  });
  $("#t-done").textContent = done + " of " + buys;
  $("#t-jobs").textContent = jobsDone + " of " + jobs;
  $("#t-paid").textContent = money(paid);
  $("#t-left").hidden = !done; $("#t-left").textContent = !done ? "nothing ticked yet" : leftHi ? "about " + money(leftLo) + "–" + money(leftHi).slice(1) + " still to buy" : "everything bought";
}
function saveTrack(id, patch) {
  const r = DATA.track.find(x => x.id === id);
  const cur = tget(id) || { done: r.done, paid: null };
  const body = Object.assign({}, cur, patch);
  if (!db) { local[id] = body; store.set("mw12-tracker", local); paintTracker(); return; }
  body.by = myId; body.at = new Date().toISOString();
  tstate[id] = body; paintTracker();
  write("tracker/" + id, body).catch(e => onWriteError(e, null));
}
DATA.track.forEach(r => {
  const li = document.querySelector('[data-t="' + r.id + '"]');
  li.querySelector("input[type=checkbox]").addEventListener("change", e => saveTrack(r.id, { done: e.target.checked }));
  const pd = li.querySelector("input[type=number]");
  if (pd) pd.addEventListener("change", e => {
    const v = e.target.value === "" ? null : Math.max(0, Math.round(parseFloat(e.target.value) * 100) / 100);
    saveTrack(r.id, { paid: Number.isFinite(v) ? v : null });
  });
});
$$("[data-filter]").forEach(b => b.addEventListener("click", () => {
  $$("[data-filter]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  const t = $("#tracker");
  t.classList.toggle("f-left", b.dataset.filter === "left");
  t.classList.toggle("f-jobs", b.dataset.filter === "jobs");
  t.classList.toggle("f-buys", b.dataset.filter === "buys");   // v33
  if (b.dataset.filter !== "all") $$("details.phase", t).forEach(d => d.open = true);
}));
paintTracker();

/* build steps */
const slocal = store.get("mw13-steps", {});
function sget(n) { return (db ? sstate["s" + n] : slocal["s" + n]) || null; }
function paintSteps() {
  let done = 0;
  $$(".step").forEach(li => {
    const s = sget(li.dataset.s), on = !!(s && s.done), cb = $(".sdone input", li);
    cb.checked = on; li.classList.toggle("done", on);
    if (on) done++;
  });
  $("#s-count").textContent = done + " of " + DATA.steps + " steps done";
  $("#s-bar").style.width = (100 * done / DATA.steps) + "%";
}
$$(".step").forEach(li => {
  $(".sdone input", li).addEventListener("change", e => {
    const body = { done: e.target.checked };
    if (!db) { slocal["s" + li.dataset.s] = body; store.set("mw13-steps", slocal); paintSteps(); return; }
    body.by = myId; body.at = new Date().toISOString();
    sstate["s" + li.dataset.s] = body; paintSteps();
    write("steps/s" + li.dataset.s, body).catch(err => onWriteError(err, null));
  });
});
paintSteps();

/* light up what this view can do */
(async () => {
  const [d, u] = await Promise.all([use("db"), use("user")]);
  user = u;
  if (!d) {
    $("#t-note").textContent = "Each phase names the step it's for. Ticks and amounts stay on this device only.";
    const sn = $("#s-note"); if (sn) sn.textContent = "Ticks are kept on this device only.";
    return;
  }
  db = d;
  try { myId = u ? await u.id() : null; } catch (e) { myId = null; }
  let canWrite = null;
  try { canWrite = u ? await u.can("data.write") : null; } catch (e) {}
  if (canWrite === false) { readOnly = true; lockInputs(); }
  db.collection("tracker").onSnapshot(snap => {
    snap.docChanges().forEach(ch => { if (ch.type === "removed") delete tstate[ch.doc.id]; else tstate[ch.doc.id] = ch.doc.data(); });
    paintTracker();
  }, () => {});
  db.collection("steps").onSnapshot(snap => {
    snap.docChanges().forEach(ch => { if (ch.type === "removed") delete sstate[ch.doc.id]; else sstate[ch.doc.id] = ch.doc.data(); });
    paintSteps();
  }, () => {});
})();
(() => {
  // v13.7: lighting scene buttons
  const sb = document.getElementById("scene-btns");
  if (!sb) return;
  sb.addEventListener("click", e => {
    const b = e.target.closest("button[data-scene]"); if (!b) return;
    sb.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    document.querySelectorAll(".scene").forEach(d => { d.hidden = d.dataset.sc !== b.dataset.scene; });
  });
})();
(() => {
  // v13.6: show one part of the build at a time
  const bar = document.getElementById("part-filter");
  if (!bar) return;
  const note = document.getElementById("pf-note");
  const pick = part => {
    bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.part === part)));
    let shown = 0;
    document.querySelectorAll(".steps-list > li.step").forEach(li => {
      const on = !part || li.dataset.parts.split("|").includes(part);
      li.hidden = !on; if (on) shown++;
    });
    note.textContent = part ? ("Showing " + shown + " of " + DATA.steps + " steps: " + part + ".") : "";
    try { localStorage.setItem("mw-part", part); } catch (e) {}
  };
  bar.addEventListener("click", e => { const b = e.target.closest("button[data-part]"); if (b) pick(b.dataset.part); });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-step]");
    if (a) { const li = document.getElementById("step-" + a.dataset.step); if (li && li.hidden) pick(""); }
  }, true);
  let saved = "";
  try { saved = localStorage.getItem("mw-part") || ""; } catch (e) {}
  if (saved && bar.querySelector('button[data-part="' + saved.replace(/"/g, "") + '"]')) pick(saved);
})();

/* ---------- v25: the celebration: a dark pill toast, and an 18-dot confetti burst (no burst, and no springs, with reduced motion) */
const toastEl = document.getElementById("toast"), DOTS = [50, 165, 300, 95, 235, 345, 25, 70, 125];
let toastT = 0;
function cheer(msg, from) {
  toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2200);
  if (REDUCED) return;
  const r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 140, width: 0, height: 0 };
  const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
  box.style.left = (r.left + r.width / 2) + "px"; box.style.top = (r.top + r.height / 2) + "px";
  for (let i = 0; i < 18; i++) { const d = document.createElement("i"), a = (i / 18) * Math.PI * 2, R = 60 + Math.random() * 70;
    d.style.background = `oklch(0.78 0.14 ${DOTS[i % DOTS.length]})`; d.style.setProperty("--dx", Math.cos(a) * R + "px"); d.style.setProperty("--dy", Math.sin(a) * R - 30 + "px"); box.appendChild(d); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 1000);
}
document.addEventListener("change", e => {
  const t = e.target; if (t.type !== "checkbox" || !t.checked) return;
  const step = t.closest(".step");
  if (step && t.closest(".sdone")) { const left = $$(".step").filter(s => !s.classList.contains("done") && s !== step).length;
    cheer(left ? `Step ${step.dataset.s} done! ${left} to go` : "Every step done!", t); return; }
  if (t.closest("#tracker")) cheer("Ticked off!", t);
});

/* v32: the cost overview: copy it as a shopping list, open every piece */
document.addEventListener("click", e => {
  const b = e.target.closest("#co-copy, #co-all"); if (!b) return;
  if (b.id === "co-all") { const all = $$(".cpiece"), open = all.some(d => !d.open); all.forEach(d => d.open = open); b.textContent = open ? "Close them all" : "Open them all"; return; }
  const t = $("#co-text").value, st = $("#co-st"), done = () => { st.textContent = "Copied: paste it into a note or a message."; };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => { prompt("Copy the list:", t); });
  else prompt("Copy the list:", t);
});

/* ---------- v33, from the design review (plan_ui.py): the open choices (Decide), the ideas shortlist, and build day. The picks are kept
   on this device and, where the page has a shared store, for both of you (the "picks" collection); the plan's totals and the buy list follow. */
window.PICKS = (() => {
  const K = "mw33-picks", TK = "mw33-tasks", D = DATA.decide, SH = DATA.short, BD = DATA.bday;
  const st = Object.assign({ decide: {}, short: {} }, store.get(K, {}));
  let tasks = store.get(TK, {});
  const fm = v => "£" + Math.round(v).toLocaleString("en-GB");
  const rng = (lo, hi) => Math.round(lo) === Math.round(hi) ? fm(lo) : fm(lo) + "–" + fm(hi).slice(1);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const txt = (sel, t) => { const el = $(sel); if (el) el.textContent = t; };
  function save(part) {
    store.set(K, st);
    if (db && !readOnly) write("picks/" + part, { v: st[part], by: myId || "", at: new Date().toISOString() }).catch(e => onWriteError(e));
  }
  function toRoom(o) { if (window.R3D) window.dispatchEvent(new CustomEvent("r3d-set", { detail: o })); else window.__r3dPending = o; }
  // what the picks add to the plan: the piece beside the cabinet, and each idea moved in
  function added() {
    const out = [];
    D.forEach(d => { const o = d.options.find(x => x.v === st.decide[d.key]); if (o && o.cost[1] > 0) out.push({ key: "decide:" + d.key, name: o.label + " beside the cabinet", lo: o.cost[0], hi: o.cost[1] }); });
    Object.keys(st.short).forEach(k => { if (st.short[k] && SH[k]) out.push({ key: k, name: SH[k].name, lo: SH[k].lo, hi: SH[k].hi, idea: true }); });
    return out;
  }
  function paint() {
    const ad = added(), lo = ad.reduce((a, x) => a + x.lo, 0), hi = ad.reduce((a, x) => a + x.hi, 0), tot = rng(DATA.plan[0] + lo, DATA.plan[1] + hi);
    const ideas = ad.filter(x => x.idea), ilo = ideas.reduce((a, x) => a + x.lo, 0), ihi = ideas.reduce((a, x) => a + x.hi, 0);
    txt("#d-total", tot); txt("#t-plan", tot);
    txt("#sb-count", ideas.length ? `${ideas.length} ${ideas.length === 1 ? "idea" : "ideas"} moved into the plan: +${rng(ilo, ihi)}` : "Nothing added to the plan yet");
    txt("#sb-total", "The plan: " + tot);
    $$("[data-short]").forEach(b => { const on = !!st.short[b.dataset.short]; b.setAttribute("aria-pressed", String(on));
      const t = $(".t", b), i = $(".ms", b); if (t) t.textContent = on ? "In the plan" : "Add to plan"; if (i) i.textContent = on ? "check" : "add"; });
    const pk = $("#picked");
    if (pk) { pk.hidden = !ad.length; txt("#picked-sum", ad.length ? `+${rng(lo, hi)} · the plan with them: ${tot}` : "");
      $("#picked-l").innerHTML = ad.map(x => `<li><span>${esc(x.name)}</span><span class="m">${rng(x.lo, x.hi)}</span><button type="button" class="btn" data-unpick="${esc(x.key)}">Take out</button></li>`).join(""); }
    const ma = $("#mo-added"); if (ma) { ma.hidden = !ad.length; txt("#mo-addv", "+" + rng(lo, hi)); }
    // the buy list follows the picks
    const pads = $("[data-pickpads]"); if (pads) { const v = st.decide.pads; pads.textContent = v ? `in ${v[0].toUpperCase() + v.slice(1)} (your pick)` : "in Olive (or Honey or Ivory)"; }
    $$('[data-picknote="cabw"]').forEach(n => { n.hidden = st.decide.cabw !== "80"; });
    // waiting on you, and the third ring
    const wl = $("#waitl");
    if (wl) wl.innerHTML = D.map((d, i) => { const o = d.options.find(x => x.v === st.decide[d.key]), first = o || d.options.find(x => x.art) || d.options[0];
      const pic = first.art && DATA.img[first.art] ? `<img src="${DATA.img[first.art]}" alt="" loading="lazy">` : first.swatch ? `<span class="sw" style="background:${first.swatch}"></span>` : `<span class="sw ic"><span class="ms" aria-hidden="true">toggle_on</span></span>`;
      return `<li class="${o ? "made" : ""}"><button type="button" data-decide-open="${i}">${pic}<span class="wt"><b>${esc(d.title)}</b><span>${o ? "Your pick: " + esc(o.label) : esc(d.q)}</span></span><span class="go">${o ? "Change" : "Choose"}</span></button></li>`; }).join("");
    const made = D.filter(d => st.decide[d.key]).length;
    // v33, client: "optimise the workflow and ensure we complete the plan": the next three things, one from each part of the plan
    const n3 = $("#next3");
    if (n3) {
      const di0 = D.findIndex(d => !st.decide[d.key]), step = BD.find(s => !$("#step-" + s.n + ".done"));
      const PP = window.PIECEP, cur = PP ? PP.current() : null, allDone = PP ? PP.tasks[1] > 0 && PP.tasks[0] === PP.tasks[1] : !step;   // v46: a piece, not a step
      const need = step ? DATA.track.filter(r => r.kind === "buy" && step.buy.includes(r.phase) && !(tget(r.id) ? tget(r.id).done : r.done)) : [];
      const lo = need.reduce((a, r) => a + (r.lo || 0), 0), hi = need.reduce((a, r) => a + (r.hi || 0), 0);
      const card = (h, ic, k, t, sub, btn, attrs) => `<div class="n3" style="--h:${h}"><span class="ms" aria-hidden="true">${ic}</span><div><span class="label">${k}</span><b>${esc(t)}</b><span>${esc(sub)}</span></div><button type="button" class="btn" ${attrs}>${btn}</button></div>`;
      n3.innerHTML = '<h2>Your next three</h2><div class="n3s">'
        + (di0 >= 0 ? card(280, "how_to_vote", "Decide", D[di0].title, `${D.length - made} of ${D.length} choices still open`, "Choose", `data-decide-open="${di0}"`)
                    : card(280, "how_to_vote", "Decide", "Every choice made", "Change any of them from Waiting on you", "Review", 'data-decide-open="0"'))
        + (cur ? card(50, "construction", "Carry on", cur.title, `${cur.done} of ${cur.total} done`, "Open", `data-mk="${cur.id}"`)
               : allDone ? card(50, "construction", "Build", "Every piece done", "Enjoy the room", "Your room", 'data-go="build"')
               : card(50, "construction", "Build", "Start with any piece", "Tap a place in the room, or pick a piece", "Your room", 'data-go="build"'))
        + (() => {   // v46: what's still to buy for the piece you're on, else everything left
          const left = DATA.track.filter(r => r.kind === "buy" && !(tget(r.id) ? tget(r.id).done : r.done));
          const pl = cur ? $$(`#${cur.id} input[data-buyproxy]`).filter(i => !i.checked).length : 0;
          return pl ? card(165, "shopping_bag", "Buy for " + cur.title, `${pl} ${pl === 1 ? "thing" : "things"} still to buy`, "Ticks match the buy list", "Its list", `data-mk="${cur.id}" data-tab="buy"`)
               : card(165, "shopping_bag", "Buy", left.length ? `${left.length} things still to buy` : "Everything bought", `${DATA.track.filter(r => r.kind === "buy").length} on the list`, "The list", 'data-go="buy"');
        })()
        + "</div>";
    }
    txt("#d-choice", made + "/" + D.length); ring("d-choice-bar", made, D.length);
    $$("[data-decide=\"cabw\"]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === (st.decide.cabw || ""))));
  }
  /* Decide: one choice per screen */
  const ov = $("#decide"); let di = 0, back = null;
  function show(el, on) { el.hidden = !on; document.body.classList.toggle("ov-open", !!$(".ov:not([hidden])")); }
  function openDecide(i) { back = document.activeElement; di = Math.max(0, Math.min(D.length - 1, +i || 0)); renderDecide(); show(ov, true); const f = $("[aria-checked=true]", ov) || $(".dcopts button", ov); if (f) f.focus(); }
  function renderDecide() {
    const d = D[di], v = st.decide[d.key];
    txt("#dc-n", `${di + 1} of ${D.length}`); txt("#dc-h", d.title); txt("#dc-q", d.q); txt("#dc-buy", d.buy);
    $("#dc-opts").innerHTML = d.options.map(o => {
      const pic = o.art && DATA.img[o.art] ? `<img src="${DATA.img[o.art]}" alt="">` : o.swatch ? `<span class="sw" style="background:${o.swatch}"></span>` : `<span class="sw ic"><span class="ms" aria-hidden="true">toggle_on</span></span>`;
      return `<button type="button" role="radio" aria-checked="${o.v === v}" data-dv="${esc(o.v)}">${pic}<span class="dt"><b>${esc(o.label)}</b><span>${esc(o.note)}</span>${o.cost[1] > 0 ? `<em>+${rng(o.cost[0], o.cost[1])}</em>` : ""}</span></button>`; }).join("");
    $("#dc-prev").disabled = di === 0; txt("#dc-next", di === D.length - 1 ? "Done" : "Next");
  }
  function pick(v) {
    const d = D[di], o = d.options.find(x => x.v === v); if (!o) return;
    st.decide[d.key] = v; save("decide"); renderDecide(); paint();
    const room = { pads: { decor: { pads: v }, merge: true }, cabw: { cabw: v }, beside: { beside: v } }[d.key];   // the room follows, without moving the camera
    if (room) toRoom(room);
    cheer(`${d.title}: ${o.label}`, $(`[data-dv="${v}"]`, ov));
  }
  function closeOv(el) { show(el, false); if (back && back.focus) back.focus({ preventScroll: true }); }
  $("#dc-opts").addEventListener("click", e => { const b = e.target.closest("[data-dv]"); if (b) pick(b.dataset.dv); });
  $("#dc-opts").addEventListener("keydown", e => {   // a radio group: the arrows move through the options
    const bs = $$("[data-dv]", ov), i = bs.indexOf(document.activeElement); if (i < 0) return;
    const j = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!j) return;
    e.preventDefault(); bs[(i + j + bs.length) % bs.length].focus();
  });
  $("#dc-prev").addEventListener("click", () => { if (di > 0) { di--; renderDecide(); } });
  $("#dc-next").addEventListener("click", () => { if (di < D.length - 1) { di++; renderDecide(); } else closeOv(ov); });
  $("#dc-room").addEventListener("click", () => { const d = D[di], o = d.options.find(x => x.v === st.decide[d.key]) || d.options[0]; show(ov, false); closeSheets(); toRoom(o.r3d); });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-decide-open], #d-choice-bar"); if (a) { e.preventDefault(); e.stopImmediatePropagation(); openDecide(a.dataset.decideOpen || 0); return; }
    const c = e.target.closest("[data-decide]"); if (c) { const i = D.findIndex(d => d.key === c.dataset.decide); if (i >= 0) { di = i; pick(c.dataset.v); } return; }
    const s = e.target.closest("[data-short]");
    if (s) { const k = s.dataset.short, on = !st.short[k]; if (on) st.short[k] = true; else delete st.short[k]; save("short"); paint();
      if (on && SH[k]) cheer(`Added to the plan: +${rng(SH[k].lo, SH[k].hi)}`, s); return; }
    const u = e.target.closest("[data-unpick]");
    if (u) { const k = u.dataset.unpick; if (k.startsWith("decide:")) delete st.decide[k.slice(7)]; else delete st.short[k]; save(k.startsWith("decide:") ? "decide" : "short"); paint(); return; }
    const x = e.target.closest("[data-ov-close]"); if (x) closeOv(x.closest(".ov"));
  }, true);
  document.addEventListener("keydown", e => { if (e.key !== "Escape") return; const o = $(".ov:not([hidden])"); if (o) { e.stopPropagation(); closeOv(o); } }, true);
  /* build day: one step on one screen */
  const bd = $("#bday"); let cur = null;
  function openDay(n) { back = document.activeElement; cur = BD.find(s => s.n === +n); if (!cur) return; renderDay(); show(bd, true); $(".bdtasks button", bd)?.focus(); }
  function renderDay() {
    const s = cur, t = tasks[s.n] || [], done = !!$("#step-" + s.n + ".done");
    const im = $("#bd-img"); im.src = DATA.img[s.art] || ""; im.alt = "The room for step " + s.n;
    txt("#bd-n", `Step ${s.n} of ${BD.length} · ${s.who} · ${s.time}`); txt("#bd-h", s.title); txt("#bd-watcht", s.watch);
    $("#bd-bar").innerHTML = BD.map(x => `<i class="${$("#step-" + x.n + ".done") ? "on" : x.n === s.n ? "cur" : ""}"></i>`).join("");
    $("#bd-tasks").innerHTML = s.do.map((d, i) => `<li><button type="button" aria-pressed="${!!t[i]}" data-task="${i}"><span class="bx" aria-hidden="true">${t[i] ? "✓" : ""}</span><span class="tx">${d}</span></button></li>`).join("");
    $("#bd-tools").innerHTML = s.tools.map(x => `<span class="chip">${x}</span>`).join("");
    const rows = DATA.track.filter(r => r.kind === "buy" && s.buy.includes(r.phase)), got = rows.filter(r => { const v = tget(r.id); return v ? !!v.done : r.done; }).length;
    txt("#bd-parts", rows.length ? `Its ${rows.length} things to buy · ${got} bought` : "Nothing to buy for it");
    $("#bd-parts").disabled = !rows.length;
    const k = t.filter(Boolean).length;
    txt("#bd-done", done ? `Step ${s.n} done ✓` : k === s.do.length ? `Mark step ${s.n} done` : `${k} of ${s.do.length} tasks · Mark done`);
  }
  $("#bd-tasks").addEventListener("click", e => { const b = e.target.closest("[data-task]"); if (!b) return; const i = +b.dataset.task, t = tasks[cur.n] = tasks[cur.n] || [];
    t[i] = !t[i]; store.set(TK, tasks); renderDay(); const nb = $(`[data-task="${i}"]`, bd); if (nb) nb.focus(); });
  $("#bd-done").addEventListener("click", e => { const cb = document.getElementById("sd-" + cur.n); if (cb && !cb.disabled) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change", { bubbles: true })); } setTimeout(renderDay, 50); });
  $("#bd-watch").addEventListener("click", () => { show(bd, false); closeSheets(); toRoom(cur.r3d); });
  $("#bd-parts").addEventListener("click", () => { const a = $(`#step-${cur.n} .sbuy a`); show(bd, false); if (a) a.click(); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-bday]"); if (b) openDay(b.dataset.bday); });
  /* the picks from the shared store, when there is one */
  (async () => {
    for (let i = 0; i < 40 && !db; i++) await new Promise(r => setTimeout(r, 250));
    if (!db) return;
    db.collection("picks").onSnapshot(snap => {
      snap.docChanges().forEach(ch => { if (ch.type !== "removed" && (ch.doc.id === "decide" || ch.doc.id === "short")) st[ch.doc.id] = (ch.doc.data() || {}).v || {}; });
      store.set(K, st); paint(); if (!ov.hidden) renderDecide();
    }, () => {});
  })();
  return { paint, openDecide, openDay };
})();
PICKS.paint();
