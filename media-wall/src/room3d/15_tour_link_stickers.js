/* ---------------------------------------------------------------- v28: the guided tour (room3d_page.tour)
   Each stop flies to its view (slower than a tap) and shows its caption; a stop's own choices (the cabinet open) are put back after it.
   Touching the room, Esc or End stops it. Reduced motion: no flying, the same stops. */
const TOURD = JSON.parse((document.getElementById("tour-data") || {}).textContent || '{"stops":[]}');
const REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const FLY = 2200, DWELL = 5200;
let tourSt = null;
function tourStart() {
  if (!TOURD.stops.length) return;
  if (S.edit) qs("#r3d-editdone")?.click();
  window.DemmaTools?.close(); closePop();
  tourSt = { i: -1, keep: {}, timer: 0, paused: false, t0: 0 };
  root.classList.add("touring"); qs("#r3d-tour").hidden = false;
  tourGo(0);
}
function tourGo(i) {
  if (!tourSt) return;
  const stops = TOURD.stops; clearTimeout(tourSt.timer);
  if (i >= stops.length) { tourEnd(); return; }
  i = Math.max(0, i); tourSt.i = i;
  const st = stops[i], keep = tourSt.keep;
  for (const k of Object.keys(keep)) if (!(st.set && k in st.set)) { S[k] = keep[k]; delete keep[k]; }   // put back the last stop's choices
  if (st.set) for (const [k, v] of Object.entries(st.set)) { if (!(k in keep)) keep[k] = S[k]; S[k] = v; }
  applyState(); syncButtons();
  setView(st.view, REDUCE, FLY);
  qs("#r3d-tourn").textContent = `Stop ${i + 1} of ${stops.length}`;
  qs("#r3d-tourh").textContent = st.title; qs("#r3d-tourp").textContent = st.text;
  qs("#r3d-tourbar").style.width = `${(i + 1) / stops.length * 100}%`;
  tourSt.t0 = performance.now();
  if (!tourSt.paused) tourSt.timer = setTimeout(() => tourGo(i + 1), (REDUCE ? 0 : FLY) + DWELL);
}
function tourCtl(c) {
  if (!tourSt) return;
  if (c === "stop") { tourEnd(); return; }
  if (c === "next") { tourGo(tourSt.i + 1); return; }
  if (c === "prev") { tourGo(tourSt.i - 1); return; }
  if (c === "pause") {
    tourSt.paused = !tourSt.paused; const b = qs('[data-tour="pause"]');
    b.setAttribute("aria-label", tourSt.paused ? "Carry on" : "Pause"); b.querySelector(".ms").textContent = tourSt.paused ? "play_arrow" : "pause";
    clearTimeout(tourSt.timer); if (!tourSt.paused) tourSt.timer = setTimeout(() => tourGo(tourSt.i + 1), DWELL);
  }
}
function tourEnd() {
  if (!tourSt) return;
  clearTimeout(tourSt.timer);
  const keep = tourSt.keep; tourSt = null;
  if (Object.keys(keep).length) { Object.assign(S, keep); applyState(); syncButtons(); }
  root.classList.remove("touring"); qs("#r3d-tour").hidden = true;
  qs("#r3d-tourbtn")?.focus({ preventScroll: true });
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && tourSt) { e.preventDefault(); tourEnd(); } else if (e.key === "Escape" && SH) { e.preventDefault(); showStop(true); } });

/* ---------------------------------------------------------------- v28: "copy link to this view"
   The look (where you stand and every choice, not Edit room's moves) as a plain #look-<token> (base64url JSON), which the page's
   router leaves alone. The link is always the GitHub Pages page, so anyone can open it. */
const LOOK_STR = { site: ["A", "B", "C"], dining: ["folded", "four", "six"], chairs: null, plants: null, seat: ["off", "up", "down"], scene: null, tod: ["evening", "day"], paint: null, lamp: null, cab: ["compact", "sliding"], cabw: ["90", "80"], beside: null,
                   blind: ["down", "up"], trolley: ["park", "out"], sofa: ["mine", "bed"] };   // V3.71: the sofa   // v30: which cabinet; v31: beside it; v34: the blind, the trolley
const LOOK_BOOL = ["drawers", "curtains", "lbox", "laser", "pc", "grow", "tdoor", "foot", "lp", "lid", "barflap", "ctop", "sdraw", "scopen", "sbed", "stools", "made"];   // v37: the step drawers   // v31: the open table's floor; v34: a record lifted out
const HEX = /^#[0-9a-f]{6}$/i;
const cm = v => [-v.x / M, v.y / M, v.z / M].map(n => Math.round(n));
function lookOf() {
  const o = { v: S.view, c: [...cm(camera.position), ...cm(controls.target), Math.round(baseFov)] };
  for (const k of Object.keys(LOOK_STR)) o[k] = S[k];
  for (const k of LOOK_BOOL) if (S[k] !== DEF[k]) o[k] = S[k] ? 1 : 0;
  if (S.paint === "custom") o.custom = S.custom;
  if (S.ceil !== "match") o.ceil = S.ceil;
  const ws = Object.fromEntries(Object.entries(S.walls).filter(([k, v]) => k in WALL_NAME && HEX.test(v || ""))); if (Object.keys(ws).length) o.walls = ws;   // v38
  if (S.skirt !== "match") o.skirt = S.skirt;
  const dd = {}; for (const k of Object.keys(DEF.decor)) if (S.decor[k] !== DEF.decor[k]) dd[k] = S.decor[k];
  if (Object.keys(dd).length) o.decor = dd;
  const on = m => Object.keys(m).filter(k => m[k]);
  if (on(S.sugg).length) o.sugg = on(S.sugg);
  if (on(S.ideas).length) o.ideas = on(S.ideas);
  const sv = {}; for (const k of on(S.sugg)) if (svarOf(k) !== SVAR[k]?.[0][0]) sv[k] = svarOf(k);
  if (Object.keys(sv).length) o.svar = sv;
  if (!(sameAsScene() && S.master === 100)) { o.lv = S.lv; o.master = S.master; o.col = S.col; }
  if (Object.keys(S.fix).length) o.fix = S.fix;                                                     // v38: each fixture's turn
  if (Object.keys(S.head).length) o.head = S.head;                                                  //       and each head's settings
  if ((S.warm ?? 50) !== DEF.warm) o.warm = S.warm;                                                  // v50: Warmth, and Edit room's moves
  if (Object.keys(S.layout).length) o.layout = S.layout;                                             //      and added pieces
  if (S.added.length) o.added = S.added;
  return o;
}
const b64u = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = t => decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/"))));
function lookUrl() {
  const here = location.href.split("#")[0], local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /github\.io$/.test(location.hostname);
  return (local ? here : TOURD.pages) + "#look-" + b64u(JSON.stringify(lookOf()));
}
/* V1.19, the client: "take more buttons off easily and make it clear how": Hide buttons takes every button off but Show (Esc too).
   V2.66 (N20, fewer buttons): Hide labels and Hide buttons are one button: its first tap the labels, its next the buttons; Show
   brings both back */
function pickSync() {
  const pk = qs("#r3d-pick"); if (!pk) return;
  const bare = document.body.classList.contains("bare"), [ic, t] = bare ? ["visibility", "Show"] : labelsOn ? ["label_off", "Hide labels"] : ["visibility_off", "Hide buttons"];
  pk.setAttribute("aria-pressed", String(bare)); pk.title = t; pk.querySelector(".ms").textContent = ic; pk.querySelector(".t").textContent = t;
}
function setBare(on) {
  if (on && labelsOn) { setLabels(false); return; }
  document.body.classList.toggle("bare", on);
  if (on) toast("Tap Show for the buttons"); else if (!labelsOn) { setLabels(true); return; }
  pickSync();
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("bare")) { e.preventDefault(); setBare(false); } });
function toast(t, undo) {   // the clock starts once two frames have drawn (applying a look can recompile the room first)
  const el = qs("#r3d-toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t);
  el.classList.toggle("act", !!undo);   // V3.75: a button on it (Put back), and longer to reach it
  if (undo) { const b = document.createElement("button"); b.type = "button"; b.textContent = "Put back"; Object.assign(b.dataset, undo); b.addEventListener("click", () => { el.hidden = true; }); el.append(" ", b); }
  requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, undo ? 6000 : 3200); }));
}
function copyLook() {
  const url = lookUrl(), st = qs("#r3d-linkst");
  const shown = () => { st.innerHTML = ""; const i = document.createElement("input"); i.readOnly = true; i.value = url; i.className = "r3d-linkbox"; i.setAttribute("aria-label", "The link to this view"); st.append("Copy this link: ", i); i.focus(); i.select(); };
  const done = () => { st.textContent = "Copied. Paste it into a message: it opens the room just like this."; toast("Link copied"); };
  try { navigator.clipboard.writeText(url).then(done, shown); } catch (e) { shown(); }
}
function applyLook(tok) {
  let o; try { o = JSON.parse(unb64u(tok)); } catch (e) { return false; }
  if (!o || typeof o !== "object") return false;
  const ok = (k, v) => typeof v === "string" && (LOOK_STR[k] ? LOOK_STR[k].includes(v) : k === "scene" ? v in SCENES : k === "plants" ? v in R.PLANT_LAYOUTS : k === "paint" ? (v in R.PAINTS || v === "custom") : /^[a-z0-9_]{1,24}$/i.test(v));
  for (const k of Object.keys(LOOK_STR)) if (ok(k, o[k])) S[k] = o[k];
  for (const k of LOOK_BOOL) if (k in o) S[k] = !!o[k];
  if (HEX.test(o.custom || "")) S.custom = o.custom;
  S.walls = {}; if (o.walls && typeof o.walls === "object") for (const [k, v] of Object.entries(o.walls)) if (k in WALL_NAME && HEX.test(v || "")) S.walls[k] = v;   // v38
  S.ceil = HEX.test(o.ceil || "") ? o.ceil : "match"; S.skirt = HEX.test(o.skirt || "") ? o.skirt : "match";
  S.decor = Object.assign({}, DEF.decor); if (o.decor && typeof o.decor === "object") for (const k of Object.keys(DEF.decor)) if (typeof o.decor[k] === "string") S.decor[k] = o.decor[k];
  const set = a => Object.fromEntries((Array.isArray(a) ? a : []).filter(k => typeof k === "string").map(k => [k, true]));
  S.sugg = set(o.sugg); S.ideas = set(o.ideas);
  S.svar = {}; if (o.svar && typeof o.svar === "object") for (const [k, v] of Object.entries(o.svar)) if (SVAR[k]?.some(x => x[0] === v)) S.svar[k] = v;
  if (o.lv && typeof o.lv === "object") { S.lv = Object.assign({}, SCENES[S.scene].levels); for (const k of LAYERS) if (Number.isFinite(+o.lv[k])) S.lv[k] = Math.max(0, Math.min(100, +o.lv[k])); S.master = Number.isFinite(+o.master) ? Math.max(0, Math.min(100, +o.master)) : 100; }
  else { S.lv = Object.assign({}, SCENES[S.scene].levels); S.master = 100; }
  if (o.col && typeof o.col === "object") for (const k of Object.keys(DEF.col)) if (HEX.test(o.col[k] || "")) S.col[k] = o.col[k];
  S.fix = {}; if (o.fix && typeof o.fix === "object") for (const k of Object.keys(FIX_NAME)) if (Number.isFinite(+o.fix[k])) S.fix[k] = Math.max(-180, Math.min(180, +o.fix[k]));   // v38
  S.head = {}; if (o.head && typeof o.head === "object") for (const [k, h] of Object.entries(o.head)) {
    if (!/^(bar1|bar2|lamp):[0-5]$/.test(k) || !h || typeof h !== "object") continue;
    const c = {}; if (h.on === false) c.on = false;
    for (const [f, lo, hi] of [["lv", 0, 100], ["yaw", -90, 90], ["tilt", -60, 60]]) if (Number.isFinite(+h[f])) c[f] = Math.max(lo, Math.min(hi, +h[f]));
    if (HEX.test(h.col || "")) c.col = h.col; if (Object.keys(c).length) S.head[k] = c; }
  if (Number.isFinite(+o.warm)) S.warm = Math.max(0, Math.min(100, +o.warm)); else S.warm = DEF.warm;   // v50
  if (o.layout || o.added) {   // v50: the furniture moved or added in Edit room
    const ID = /^[a-z0-9_:-]{1,40}$/i, lay = {}, add = [];
    if (o.layout && typeof o.layout === "object") for (const [id, L] of Object.entries(o.layout)) { if (!ID.test(id) || !L || typeof L !== "object") continue;
      const c = {}; for (const f of ["x", "z", "rot"]) if (Number.isFinite(+L[f])) c[f] = +L[f]; if (HEX.test(L.col || "")) c.col = L.col; if (L.off) c.off = true; lay[id] = c; }
    if (Array.isArray(o.added)) for (const a of o.added.slice(0, 40)) if (a && CATALOGUE[a.type] && ID.test(a.id || "") && Number.isFinite(+a.x) && Number.isFinite(+a.z))
      add.push({ type: a.type, id: a.id, x: +a.x, z: +a.z, ...(Number.isFinite(+a.rot) ? { rot: +a.rot } : {}), ...(HEX.test(a.col || "") ? { col: a.col } : {}) });
    restoreLayout({ layout: lay, added: add });
  }
  applyState(); syncButtons();
  setView(o.v in VIEWS ? o.v : "room", true);
  const c = Array.isArray(o.c) && o.c.length === 7 && o.c.every(Number.isFinite) ? o.c : null;
  if (c) { camera.position.copy(v3(c[0], c[1], c[2])); controls.target.copy(v3(c[3], c[4], c[5])); baseFov = Math.max(20, Math.min(90, c[6])); camera.fov = fitFov(baseFov); camera.updateProjectionMatrix(); controls.update(); updateCut(); dirty(); }
  store.set(KEY, S);
  return true;
}
function lookFromHash() {
  const m = (location.hash || "").match(/^#look-([A-Za-z0-9_-]+)$/); if (!m) return;
  if (applyLook(m[1])) toast("Opened the shared view");
  try { history.replaceState(history.state, "", "#room"); } catch (e) {}
}
addEventListener("hashchange", () => { if (started) lookFromHash(); });

let cutSide = "";
function updateCut() {        // which wall the camera is outside of, if any (only in the views from above, before you walk)
  let side = "", best = 0;
  if (freeAbove()) {
    const x = -camera.position.x / M, z = camera.position.z / M;
    for (const [k, v] of Object.entries({ win: R.WINDOW_Z - z, stairs: x - R.W, pc: -x, wall: z - R.ALC_D })) if (v > best) { best = v; side = k; }
  }
  if (side === cutSide) return false;
  cutSide = side; const A = CLIP[0], n = A.normal;
  if (side === "win") { n.set(0, 0, 1); A.constant = -(R.WINDOW_Z + CUT_IN) * M; }
  else if (side === "stairs") { n.set(1, 0, 0); A.constant = (R.W - CUT_IN) * M; }
  else if (side === "pc") { n.set(-1, 0, 0); A.constant = -CUT_IN * M; }
  else if (side === "wall") { n.set(0, 0, -1); A.constant = -12 * M; }
  else { n.set(0, 0, 1); A.constant = 1e3; }
  reshadow();
  return true;
}
/* ---------------------------------------------------------------- v25: the numbered stickers on the room
   Each has an anchor in room cm (room3d_page.hotspots). Every frame the camera moves it is projected to the stage; a sticker behind
   the camera or off the picture hides; one on a wall seen from behind (and not opened by the cutaway) fades. Tapping one opens the
   popover under it: Open in the plan (the page's Plan sheet, at that chapter) and Fly here (the matching view). */
const HOTS = JSON.parse((document.getElementById("hotspots-data") || {}).textContent || "[]");
const stickEls = {}; qsa(".stk").forEach(b => { stickEls[b.dataset.hot] = b; });
const pop = qs("#r3d-pop"), stage = qs(".r3d-stage");
let popId = null;
const _p = new THREE.Vector3();
let labelsOn = true; try { labelsOn = localStorage.getItem("mw26-labels") !== "off"; } catch (e) {}
function setLabels(on) {
  labelsOn = on; try { localStorage.setItem("mw26-labels", on ? "on" : "off"); } catch (e) {}
  if (!on) { closePop(); Object.values(stickEls).forEach(el => { el.hidden = true; }); }
  document.getElementById("r3d")?.classList.toggle("nolabels", !on);
  applyFloors();
  pickSync(); dirty();   // V2.66: the one Hide button says what its next tap does
}
// v35: each label's size is read once (and again after a resize or the fonts arriving), not every frame: reading it straight after
// moving the labels made the browser lay the page out again for each label, each frame
const stickSz = el => el._sz || (el.offsetWidth ? (el._sz = [el.offsetWidth, el.offsetHeight]) : [140, 40]);
const stickReset = () => { for (const k in stickEls) if (stickEls[k]) stickEls[k]._sz = null; };
addEventListener("resize", () => { stickReset(); keepOut = null; }); if (document.fonts) document.fonts.ready.then(() => { stickReset(); dirty(); });
/* V3.56 (N117, the phone's Above: "Window corner" cut off, the labels on top of each other): the biggest are placed first, each at the
   first clear spot near its pin (down, up, then aside), 8 px from the others, off the bars, the stick and the figure; one with no room
   is dropped (so the smallest go first). From above (Above, On its own) none is faded as "behind": every wall is seen from above */
let keepOut = null, keepT = 0;
function keepOuts() {   // the overlays' boxes on the stage, read at most twice a second (not every frame: no layout per label)
  const now = performance.now(); if (keepOut && now - keepT < 500) return keepOut;
  const r = stage.getBoundingClientRect(); keepT = now; keepOut = [];
  qsa(".brand, .hnav, .r3d-mini, .r3d-dock, .r3d-stick, .r3d-peg").forEach(e => { const q = e.getBoundingClientRect(); if (q.width && q.height) keepOut.push([q.left - r.left, q.top - r.top, q.right - r.left, q.bottom - r.top]); });
  return keepOut;
}
function placeStickers() {
  if (!HOTS.length || !started || !labelsOn) return;
  const w = stage.clientWidth, h = stage.clientHeight, cx = -camera.position.x / M, cz = camera.position.z / M, ko = keepOuts(), G = 8;
  const placed = [], want = [];
  const fromAbove = RMODE === "above" || RMODE === "alone" || ((VIEWS[S.view] || {}).above && !walked);
  for (const H of HOTS) {
    const el = stickEls[H.id]; if (!el) continue;
    _p.copy(v3(...H.at)).project(camera);
    const off = HOUSEV(S.view) || _p.z > 1 || _p.z < -1 || Math.abs(_p.x) > 1.02 || Math.abs(_p.y) > 1.02;   // v54: the house's own labels in The whole house
    if (off) { if (!el.hidden) el.hidden = true; if (popId === H.id) closePop(); continue; }
    const [ew, eh] = stickSz(el); want.push({ H, el, ew, eh, x: (_p.x + 1) / 2 * w, y: (1 - _p.y) / 2 * h });
  }
  want.sort((a, b) => b.ew * b.eh - a.ew * a.eh);
  const clear = (x, y, ew, eh) => x - ew / 2 >= 4 + railR && x + ew / 2 <= w - 4 && y - eh / 2 >= 4 && y + eh / 2 <= h - 4
    && !(cover && x + ew / 2 > cover.left && x - ew / 2 < cover.right && y + eh / 2 > cover.top && y - eh / 2 < cover.bottom)   // v26: not under the Tools panel
    && !ko.some(([l, t, r, b]) => x + ew / 2 + G > l && x - ew / 2 - G < r && y + eh / 2 + G > t && y - eh / 2 - G < b)
    && !placed.some(q => Math.abs(x - q.x) < (ew + q.w) / 2 + G && Math.abs(y - q.y) < (eh + q.h) / 2 + G);
  for (const { H, el, ew, eh, x: px, y: py } of want) {
    const x0 = Math.max(ew / 2 + 4 + railR, Math.min(w - ew / 2 - 4, px)), step = 12, side = (ew + G) / 2;
    let at = null;   // the nearest clear spot: 12 px at a time down and up (as far as three labels' height), then half a label aside
    for (let k = 0; k <= 3 * (eh + G) / step && !at; k++) for (const [dx, dy] of k ? [[0, k * step], [0, -k * step], [side, k * step], [-side, k * step], [side, -k * step], [-side, -k * step]] : [[0, 0], [side, 0], [-side, 0]]) {
      const x = Math.max(ew / 2 + 4 + railR, Math.min(w - ew / 2 - 4, x0 + dx)), y = py + dy;
      if (clear(x, y, ew, eh)) { at = [x, y]; break; }
    }
    if (!at) { if (!el.hidden) el.hidden = true; if (popId === H.id) closePop(); continue; }   // no room: dropped
    if (el.hidden) el.hidden = false;
    placed.push({ x: at[0], y: at[1], w: ew, h: eh });
    el.style.left = at[0] + "px"; el.style.top = at[1] + "px";
    const behind = !fromAbove && H.nrm && !(H.cut && H.cut === cutSide) && ((cx - H.at[0]) * H.nrm[0] + (cz - H.at[2]) * H.nrm[1]) < 0;
    el.classList.toggle("behind", !!behind);
    if (popId === H.id) placePop(el);
  }
}
function placePop(el) {
  const sw = stage.clientWidth, x = parseFloat(el.style.left), y = parseFloat(el.style.top), pw = 290;
  const left = Math.max(12, Math.min(sw - pw - 12, x - pw / 2));
  pop.style.left = left + "px"; pop.style.top = (y + 30) + "px"; pop.style.setProperty("--ax", (x - left) + "px");
}
function openPop(id) {
  const H = HOTS.find(h => h.id === id); if (!H) return;
  if (popId) stickEls[popId].setAttribute("aria-expanded", "false");
  popId = id; const el = stickEls[id]; el.setAttribute("aria-expanded", "true");
  pop.style.setProperty("--h", H.hue);
  qs("#r3d-pop-h").textContent = H.name;                                 // v39: three places, no numbers
  const ul = qs(".facts", pop); ul.textContent = "";
  H.facts.forEach(f => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
  const pcs = qs(".r3d-pcs", pop); pcs.textContent = "";                // v46: its pieces, each opening its card in Build
  (H.pieces || []).forEach(([cid, title]) => { const li = document.createElement("li"), b = document.createElement("button"), pr = window.PIECEP && PIECEP.of(cid);
    b.type = "button"; b.dataset.mk = cid; b.innerHTML = `<span>${title}</span><small>${pr ? `${pr.done} of ${pr.total}` : ""}</small><i class="ms" aria-hidden="true">chevron_right</i>`;
    li.appendChild(b); pcs.appendChild(li); });
  pop.hidden = false; placePop(el); (qs(".r3d-pcs button", pop) || qs(".acts button", pop)).focus({ preventScroll: true }); syncPlaces();
}
function closePop() { if (popId && stickEls[popId]) stickEls[popId].setAttribute("aria-expanded", "false"); popId = null; if (pop) pop.hidden = true; try { syncPlaces(); } catch (e) {} }
qsa(".stk").forEach(b => b.addEventListener("click", e => { e.stopPropagation();
  if (tryOpts && placeOpts(b.dataset.hot).length) { const r = stage.getBoundingClientRect(), q = b.getBoundingClientRect(); openAct(`opt:${b.dataset.hot}:${placeIx(b.dataset.hot)}`, [q.left + q.width / 2 - r.left, q.bottom - r.top]); return; }   // v39
  popId === b.dataset.hot ? closePop() : openPop(b.dataset.hot); }));
if (pop) pop.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const H = HOTS.find(h => h.id === popId);
  if (b.classList.contains("x")) { const was = popId; closePop(); if (was) stickEls[was].focus(); return; }
  if (!H) return;
  if (b.dataset.popgo === "fly") { setView(H.view); closePop(); }
  else if (b.dataset.popgo === "plan") { closePop(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan", chapter: H.chapter } })); }
});
canvas.addEventListener("pointerdown", () => { if (popId) closePop(); });
document.addEventListener("click", e => { if (e.target.closest("#r3d-pop [data-mk]")) closePop(); }, true);   // v46: a piece opens in Build
/* v33, the phone home: the places strip under the room; a tap flies to the place and opens its card, docked above the dock */
qsa("[data-place]").forEach(b => b.addEventListener("click", e => {
  e.stopPropagation(); const H = HOTS.find(h => h.id === b.dataset.place); if (!H) return;
  if (popId === H.id) { closePop(); return; }
  if (SH) showStop(true); setView(H.view); if (!labelsOn) setLabels(true);
  setTimeout(() => { placeStickers(); if (stickEls[H.id] && !stickEls[H.id].hidden) openPop(H.id); else openPopAt(H.id); }, 950);
}));
function openPopAt(id) {    // the place's pin is off the picture: the card still opens (docked on a phone)
  const el = stickEls[id]; if (!el) return; el.style.left = (stage.clientWidth / 2) + "px"; el.style.top = "60px"; openPop(id);
}
function syncPlaces() { qsa("[data-place]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.place === popId))); root.classList.toggle("popped", !!popId); }
document.addEventListener("keydown", e => { if (e.key === "Escape" && popId) { const was = popId; closePop(); stickEls[was].focus(); } });
new ResizeObserver(() => placeStickers()).observe(stage);
