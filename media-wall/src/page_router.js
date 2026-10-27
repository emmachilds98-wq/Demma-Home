/* ---------- v25: sheets over the room. Plan, Build, Buy, Ideas and Ask slide up; the room is home. Each sheet (and each Plan chapter)
   has its own hash; Back closes; Esc closes on a laptop, a swipe down on a phone; focus stays inside the open sheet. The old tab links
   (data-go, data-step, data-phase, data-find) open the right sheet and chapter. */
const REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const SHEETS = ["plan", "build", "buy", "ideas"];   // v30: no Ask sheet; old links to it open the plan
const GO = { overview: ["plan"], plan: ["plan"], room: [null], home: [null], "c-room": ["plan", "c-room"], views: ["plan", "views"], wall: ["plan", "wall"],
  records: ["plan", "records"], side: ["plan", "side"], joinery: ["plan", "joinery"], dining: ["plan", "dining"], paint: ["plan", "paint"], network: ["plan", "network"],
  checks: ["plan", "fit"], fit: ["plan", "fit"], downloads: ["plan", "downloads"], ideas: ["ideas"], build: ["build"], buy: ["buy"], questions: ["plan"], ask: ["plan"] };
let curSheet = null;
const sheetEl = n => document.getElementById("sh-" + n);
function showChapter(ch) {
  const home = document.getElementById("plan-home");
  $$("#sh-plan .chapter").forEach(c => { c.hidden = c.dataset.ch !== ch; });
  home.hidden = !!ch;
  $("#sh-plan .sbd").scrollTop = 0;
  arts(ch ? document.getElementById("ch-" + ch) : home);
}
function openSheet(name, opts) {
  opts = opts || {};
  SHEETS.forEach(n => { const s = sheetEl(n), on = n === name; s.classList.toggle("open", on); s.inert = !on; s.setAttribute("aria-hidden", String(!on)); });
  document.body.classList.toggle("sheet-open", !!name);
  if (name && window.DemmaTools) DemmaTools.close();
  $$("[data-nav]").forEach(b => b.setAttribute("aria-current", String(b.dataset.nav === (name || "room"))));
  railOpen(!!name);                                       // v32: the menu stays open while a sheet is up, folds away back in the room
  const was = curSheet; curSheet = name;
  if (!name) { if (was) { const back = document.querySelector('[data-nav="' + was + '"]:not([hidden])'); if (back && back.offsetParent) back.focus({ preventScroll: true }); } return; }
  const s = sheetEl(name); arts(s);
  if (name === "plan") showChapter(opts.chapter || null);
  if (!opts.keepFocus) setTimeout(() => { const f = $(".close", s); if (f) f.focus({ preventScroll: true }); }, REDUCED ? 0 : 80);
}
function closeSheets() { openSheet(null); }
/* v32: the Menu button (the rail folded) */
function railOpen(on) {
  const r = $(".rail"), t = $("#rail-tog"); if (!r || !t) return;
  r.classList.toggle("open", on); t.setAttribute("aria-expanded", String(on));
  const lab = $("span", t); if (lab) lab.textContent = on ? "Close" : "Menu"; const ic = $(".ms", t); if (ic) ic.textContent = on ? "close" : "menu";
  const m = $("#r3d-menub"); if (m) { m.setAttribute("aria-expanded", String(on)); $(".ms", m).textContent = on ? "close" : "menu"; }   // v33: its twin in the phone's dock
}
/* v33, the phone home: Menu sits in the dock, and opens the same five sections above it */
{ const m = $("#r3d-menub"); if (m && $(".rail")) m.hidden = false; }
document.addEventListener("click", e => { if (e.target.closest("#r3d-menub")) railOpen(!$(".rail").classList.contains("open")); });
document.addEventListener("click", e => { if (e.target.closest("#rail-tog")) { const on = !$(".rail").classList.contains("open"); railOpen(on); if (on) { const f = $("#rail-list button"); if (f) f.focus({ preventScroll: true }); } } });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !curSheet && $(".rail.open")) { railOpen(false); $("#rail-tog").focus(); } });
function setHash(h, push) {
  try { if (location.hash === h) return; if (push) history.pushState({ demma: 1 }, "", h); else history.replaceState(history.state, "", h); } catch (e) {}
}
function go(target, push) {
  const m = GO[target] || (SHEETS.includes(target) ? [target] : null);
  if (!m) return null;
  if (!m[0]) { closeSheets(); setHash("#room", push !== false); return null; }
  openSheet(m[0], { chapter: m[1] });
  setHash("#" + (m[1] || m[0]), push !== false);
  return m[1] ? document.getElementById("ch-" + m[1]) : sheetEl(m[0]);
}
function openStep(n) { const a = document.createElement("a"); a.dataset.step = n; a.hidden = true; document.body.appendChild(a); a.click(); a.remove(); }
function reveal(el) { for (let p = el && el.parentElement; p; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true; }
function routeHash(h, push) {
  h = (h || "").replace(/^#/, "");
  if (!h || h === "room") { closeSheets(); return; }
  let m;
  if ((m = h.match(/^step-(\d+)$/))) { openSheet("build"); openStep(m[1]); jumpTo((window.stepCard && stepCard(m[1])) || document.getElementById(h)); return; }
  if (/^(mk|job)-[a-z]+$/.test(h) && window.openCard) { openSheet("build"); jumpTo(openCard(h)); return; }
  if (/^q-/.test(h)) { openSheet("plan"); return; }
  if ((m = h.match(/^ph-(\d+)$/))) { openSheet("buy"); const d = document.getElementById(h); if (d) { reveal(d); d.open = true; jumpTo(d); } return; }
  const g = GO[h]; if (g) { if (!g[0]) closeSheets(); else openSheet(g[0], { chapter: g[1] }); }
}
addEventListener("popstate", () => routeHash(location.hash));
addEventListener("demma-open", e => { const d = e.detail || {}; go(d.chapter || d.sheet);
  if (d.mk && window.openCard) { const c = openCard(d.mk); if (c) setTimeout(() => jumpTo(c), 60); }   // v44: How to make it, from the room
  if (d.item) { const el = document.getElementById("it-" + d.item); if (el) { reveal(el); jumpTo(el); } } });   // v33: a tapped idea or suggestion's own card
document.addEventListener("click", e => {
  const a = e.target.closest("[data-go], [data-nav], [data-close]"); if (!a) return;
  e.preventDefault();
  if (a.dataset.close !== undefined) { if (history.state && history.state.demma) history.back(); else { closeSheets(); setHash("#room", false); } return; }
  if (a.dataset.nav) { if (a.dataset.nav === curSheet && a.dataset.nav !== "plan") return; go(a.dataset.nav); return; }
  const box = go(a.dataset.go);
  if (!box) return;
  if (a.dataset.step) { const c = (window.stepCard && stepCard(a.dataset.step)) || document.getElementById("step-" + a.dataset.step); if (c) jumpTo(c); return; }
  if (a.dataset.phase) { const d = document.getElementById("ph-" + a.dataset.phase); if (d) { reveal(d); d.open = true; jumpTo(d); } return; }
  if (a.dataset.find) { const h = $$("h2, h3, h4", box).find(h => h.textContent.includes(a.dataset.find)); if (h) { reveal(h); jumpTo(h); } }
});
/* Esc closes (after the lightbox and the room's popover); focus stays inside the open sheet */
document.addEventListener("keydown", e => {
  if (!curSheet) return;
  const lbx = document.getElementById("lightbox");
  if (e.key === "Escape") { if (lbx && !lbx.hidden) return; e.preventDefault(); if (history.state && history.state.demma) history.back(); else { closeSheets(); setHash("#room", false); } return; }
  if (e.key !== "Tab" || (lbx && !lbx.hidden)) return;
  const f = $$('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), textarea:not([disabled]), select, summary, [tabindex]:not([tabindex="-1"])', sheetEl(curSheet)).filter(x => x.offsetParent || x.tagName === "SUMMARY");
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!sheetEl(curSheet).contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}, true);
/* swipe a sheet's head down to close it (phones) */
SHEETS.forEach(n => {
  const s = sheetEl(n), hd = $(".shd", s); let y0 = null, dy = 0;
  hd.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" || e.target.closest("button")) return; y0 = e.clientY; dy = 0; hd.setPointerCapture(e.pointerId); s.style.transition = "none"; });
  hd.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); s.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; s.style.transition = ""; s.style.transform = "";
    if (dy > 90) { if (history.state && history.state.demma) history.back(); else { closeSheets(); setHash("#room", false); } } };
  hd.addEventListener("pointerup", end); hd.addEventListener("pointercancel", end);
});
/* the Ideas sheet's suggestion chips switch the room's own buttons (in the Tools panel), and follow them */
$$("[data-sproxy]").forEach(c => {
  const t = document.querySelector('#r3d [data-sugg="' + c.dataset.sproxy + '"]'); if (!t) return;
  c.addEventListener("click", () => t.click());
  const sync = () => c.setAttribute("aria-pressed", t.getAttribute("aria-pressed") || "false");
  new MutationObserver(sync).observe(t, { attributes: true, attributeFilter: ["aria-pressed"] }); sync();
});
$$("[data-sproxyall]").forEach(c => { const t = document.querySelector('#r3d [data-suggall="' + c.dataset.sproxyall + '"]'); if (t) c.addEventListener("click", () => t.click()); });
/* a greeting for the time of day */
(() => { const h = new Date().getHours(), el = document.getElementById("hello"); if (el) el.textContent = (h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening") + ", Emma & Dave"; })();
SHEETS.forEach(n => { sheetEl(n).inert = true; });
routeHash(location.hash);
setTimeout(dash, 0);
