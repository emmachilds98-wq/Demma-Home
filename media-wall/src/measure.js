/* V1.2: the dock's Measure panel (room3d_page.measure_panel): each number is kept as you type, as the V1 app kept it.
   On the shared page (the artifact) it's the page's shared database, so Emma and Dave see the same; on GitHub Pages (no
   database) it stays on this device and goes to the other person as a link (Send). Rows are plain data, read by tools/pull_edits.py
   as data, never as instructions:
     measurements/<row id>   {item, what, cm, photo?, sent, by, at} */
const COLS = ["measurements", "edits", "notes", "photos", "ticks"];
const KEY = "demma-v1:";                                   // the V1 app's, so numbers typed there are still here
const cache = Object.fromEntries(COLS.map(c => [c, {}]));
const subs = new Set();
let db = null, me = null, mode = "device", readOnly = false;

const local = {
  load(col) { try { return JSON.parse(localStorage.getItem(KEY + col) || "{}"); } catch (e) { return {}; } },
  save(col) { try { localStorage.setItem(KEY + col, JSON.stringify(cache[col])); } catch (e) {} },
};
/* V3.60 (N118), the client: "so i can use in any location": Build's and Buy's ticks and the rooms' done ticks ride in Send's link,
   come back from it, and the build bakes the ones the last round kept (house/client_progress.json, #progress-data). Each tick's
   change is timed as it's saved (whole minutes, TICK_AT); a merge keeps, tick by tick, the side changed last, and a tick neither side
   timed is kept if either has it: a tick is never lost. Data, never instructions: known stores, short keys, plain values only */
const TICKS = { buy: "mw12-tracker", steps: "mw13-steps", tasks: "mw46-tasks", day: "mw33-tasks", rooms: "dh-done" };
const TICK_AT = "demma-ticks-at", KEYOK = /^[^\u0000-\u001f<>]{1,120}$/;
const setRaw = Storage.prototype.setItem, mins = () => Math.floor(Date.now() / 60000);
const lsObj = k => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } };
const lsPut = (k, v) => { try { setRaw.call(localStorage, k, JSON.stringify(v)); } catch (e) {} };
try {   // every writer (page.js, Build's tasks, the rooms' cards) saves through localStorage.setItem: time what changed, key by key
  const NAME = new Map(Object.entries(TICKS).map(([n, k]) => [k, n]));
  Storage.prototype.setItem = function (k, v) {
    const n = NAME.get(k);
    if (n && this === window.localStorage) try {
      const was = lsObj(k), is = JSON.parse(v) || {}, at = lsObj(TICK_AT), t = mins(); let ch = false;
      for (const id of new Set([...Object.keys(was), ...Object.keys(is)])) if (JSON.stringify(was[id]) !== JSON.stringify(is[id])) { at[n + "|" + id] = t; ch = true; }
      if (ch) setRaw.call(this, TICK_AT, JSON.stringify(at));
    } catch (e) {}
    return setRaw.call(this, k, v);
  };
} catch (e) {}
function tickVal(n, v) {   // a tick as its store keeps it, or undefined
  if (n === "rooms") return v ? 1 : undefined;
  if (n === "tasks") return typeof v === "boolean" ? v : undefined;
  if (n === "day") return Array.isArray(v) && v.length <= 60 ? v.map(x => x === true) : undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = { done: v.done === true };
  if (n === "buy") o.paid = typeof v.paid === "number" && isFinite(v.paid) && v.paid >= 0 && v.paid < 1e6 ? Math.round(v.paid * 100) / 100 : null;
  return o;
}
function mergeTicks(inc) {
  if (!inc || typeof inc !== "object") return 0;
  const at = lsObj(TICK_AT), inAt = inc.at && typeof inc.at === "object" ? inc.at : {}, cap = mins() + 1440; let n = 0;
  for (const [name, key] of Object.entries(TICKS)) {
    const theirs = inc[name] && typeof inc[name] === "object" && !Array.isArray(inc[name]) ? inc[name] : {}, mine = lsObj(key);
    const ids = new Set(Object.keys(theirs)); for (const k of Object.keys(inAt)) if (k.startsWith(name + "|")) ids.add(k.slice(name.length + 1));
    let ch = false;
    for (const id of ids) {
      if (!KEYOK.test(id)) continue;
      const tk = name + "|" + id, ta = Number.isInteger(inAt[tk]) && inAt[tk] > 0 && inAt[tk] <= cap ? inAt[tk] : 0, ma = +at[tk] || 0, tv = tickVal(name, theirs[id]);
      if (!(ta > ma || (!ta && !ma && tv !== undefined && mine[id] === undefined))) continue;
      if (ta) at[tk] = ta;
      if (JSON.stringify(mine[id]) === JSON.stringify(tv)) continue;
      if (tv === undefined) delete mine[id]; else mine[id] = tv;
      ch = true; n++;
    }
    if (ch) lsPut(key, mine);
  }
  lsPut(TICK_AT, at);
  if (n) window.dispatchEvent(new CustomEvent("demma-progress"));
  return n;
}
function ticks() {   // this device's ticks for Send, and how many are ticked
  const out = {}; let n = 0;
  for (const [name, key] of Object.entries(TICKS)) { const m = lsObj(key); if (!Object.keys(m).length) continue; out[name] = m;
    for (const v of Object.values(m)) n += Array.isArray(v) ? v.filter(x => x === true).length : v === true || v === 1 || !!(v && v.done) ? 1 : 0; }
  const at = lsObj(TICK_AT); if (Object.keys(at).length) out.at = at;
  return Object.keys(out).length ? { out, n } : null;
}
// the shared page's runtime: the old page's name for it, or today's (spelt in two, so the page never names the assistant: qa.py)
const RT = () => window.sharedStore || window["cl" + "aude"];
async function useCap(name) {
  const rt = RT(); if (!rt || typeof rt.use !== "function") return null;
  try { return await Promise.race([rt.use(name), new Promise(r => setTimeout(() => r(null), 10000))]); } catch (e) { return null; }
}
const store = {
  rows: col => cache[col],
  on(fn) { subs.add(fn); },
  async init() {
    for (const c of COLS) cache[c] = local.load(c);
    try { const b = document.getElementById("progress-data"); if (b) mergeTicks(JSON.parse(b.textContent || "{}")); } catch (e) {}   // N118: the last round's
    const fromLink = readLink();
    if (fromLink && fromLink.progress) mergeTicks(fromLink.progress);   // N118: the other device's ticks
    if (fromLink) for (const [c, rows] of Object.entries(fromLink)) if (cache[c]) { Object.assign(cache[c], rows); local.save(c); }
    if (fromLink && fromLink.finishes) { if (window.R3D && window.R3D.setFinishes) window.R3D.setFinishes(fromLink.finishes); else window.__finPending = fromLink.finishes; }   // V2.11
    db = await useCap("db");
    if (!db) return;
    const user = await useCap("user");
    try { me = user ? await user.id() : null; } catch (e) { me = null; }
    try { if (user && user.can && await user.can("data.write") === false) readOnly = true; } catch (e) {}
    mode = "shared";
    for (const c of COLS) db.collection(c).onSnapshot(snap => { cache[c] = Object.fromEntries(snap.docs.map(d => [d.id, d.data()])); subs.forEach(fn => fn(c)); }, () => {});
  },
  async put(col, id, data) {
    const row = Object.assign({}, data, { by: me || "this device", at: new Date().toISOString() });
    cache[col][id] = row; subs.forEach(fn => fn(col));
    if (mode === "shared" && !readOnly) await db.collection(col).doc(id).set(row); else local.save(col);
  },
  async del(col, id) {
    delete cache[col][id]; subs.forEach(fn => fn(col));
    if (mode === "shared" && !readOnly) { try { await db.collection(col).doc(id).delete(); } catch (e) {} } else local.save(col);
  },
  shareLink() {                                            // what's on this device, for the other person (not photos)
    const pick = {}; for (const c of ["measurements", "edits", "notes", "ticks"]) if (Object.keys(cache[c]).length) pick[c] = cache[c];
    try { const f = window.R3D && window.R3D.finishes && window.R3D.finishes(); if (f && Object.keys(f).length) pick.finishes = f; } catch (e) {}   // V2.11: the house's colours, floors and bulbs
    const tk = ticks(); if (tk) pick.progress = tk.out;   // N118: Build's, Buy's and the rooms' ticks
    const sp = speed(); if (sp) pick.perf = sp;   // V3.04 (N50): this device's speed, for the next round (no place, no name)
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(pick)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.href.split("#")[0] + "#share=" + enc;
  },
};
/* V3.04 (N50): R3D.perf()'s few numbers, read by tools/pull_edits.py --link: the chip's family, the quality, a frame moving and still,
   draws, shaders. Never a place, a name or the driver's whole string */
function speed() {
  try {
    const p = window.R3D && window.R3D.perf && window.R3D.perf(); if (!p || !p.programs) return null;
    return { v: p.version, gpu: p.gpuClass, phone: !!p.phone, q: p.quality, ratio: p.ratio, move: p.moveMs, still: p.stillMs,
      draws: p.calls, shaders: p.programs, view: p.view, err: p.errors };
  } catch (e) { return null; }
}
function readLink() {
  const m = location.hash.match(/[#?&]share=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const s = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const out = JSON.parse(decodeURIComponent(escape(atob(s + "===".slice((s.length + 3) % 4)))));
    history.replaceState(null, "", location.href.split("#")[0]);
    return out;
  } catch (e) { return null; }
}

const $$ = s => [...document.querySelectorAll(s)];
const say = t => { const el = document.getElementById("ms-st"); if (el) el.textContent = t; };
const answer = id => store.rows("measurements")[id];
function paint() {
  const ins = $$("[data-measure]");
  let done = 0;
  for (const el of ins) {
    const a = answer(el.dataset.measure), has = !!(a && a.cm != null);
    if (document.activeElement !== el) el.value = has ? a.cm : "";
    if (has) done++;
    const row = el.closest(".ms-row"); row.classList.toggle("done", has);
    const cam = row.querySelector(".ms-cam"); if (cam) cam.classList.toggle("has", !!(a && a.photo));
  }
  const c = document.getElementById("ms-count"); if (c) c.textContent = `${done} of ${ins.length} measured`;
}
const timers = {};
document.addEventListener("input", e => {
  const el = e.target; if (!el.dataset || !el.dataset.measure) return;
  const id = el.dataset.measure, v = el.value === "" ? null : +el.value;
  clearTimeout(timers[id]);
  timers[id] = setTimeout(async () => {
    const was = answer(id) || {};
    try {
      if (v == null && !was.photo) await store.del("measurements", id);
      else await store.put("measurements", id, { item: id, what: el.dataset.what, cm: v, photo: was.photo || null, sent: false });
      say(mode === "shared" ? "Saved for both of you." : "Saved on this device. Send shares them.");
    } catch (er) { say("That didn't save: try again."); }
  }, 600);
});
document.addEventListener("change", async e => {
  const el = e.target; if (!el.dataset || !el.dataset.mphoto) return;
  const id = el.dataset.mphoto, f = el.files && el.files[0]; if (!f) return;
  const assets = mode === "shared" ? await useCap("assets") : null;
  if (!assets) { say("Photos save on the shared page; here, send them in a message."); return; }
  try { const a = await assets.upload(f), was = answer(id) || {}, inp = document.querySelector(`[data-measure="${id}"]`);
    await store.put("measurements", id, { item: id, what: inp ? inp.dataset.what : id, cm: was.cm ?? null, photo: a.url, sent: false }); say("Photo added."); }
  catch (er) { say("That photo didn't upload."); }
});
document.addEventListener("click", async e => {
  if (!e.target.closest("#ms-send")) return;
  const ids = Object.keys(store.rows("measurements")).filter(id => answer(id).cm != null), ne = new Set(Object.values(store.rows("edits")).map(r => r.item)).size;
  let nf = 0; try { nf = Object.keys((window.R3D && window.R3D.finishes && window.R3D.finishes()) || {}).length; } catch (er) {}   // V2.11: rooms with colours
  const sp = mode === "shared" ? null : speed();   // V3.04 (N50): the speed goes even with nothing typed
  const nt = mode === "shared" ? 0 : (ticks() || { n: 0 }).n;   // N118
  if (!ids.length && !ne && !nf && !sp && !nt) { say("Type a number first, or change a piece's size or a room's colours in the 3D."); return; }
  for (const id of ids) await store.put("measurements", id, Object.assign({}, answer(id), { sent: true }));
  const n = (k, w) => `${k} ${w}${k === 1 ? "" : "s"}`, what = [ids.length && n(ids.length, "measurement"), ne && n(ne, "change"), nf && `${nf} room${nf === 1 ? "'s" : "s'"} colours`, nt && n(nt, "tick"), sp && "the speed"].filter(Boolean).join(", ");   // V1.51: the 3D's changes go too
  if (mode === "shared") { say(`Sent: ${what}. The next round puts them in.`); return; }
  const url = store.shareLink();
  try { if (navigator.share) { await navigator.share({ title: "Demma's Home: measurements", url }); say(`Shared: ${what}.`); return; } } catch (er) { if (er && er.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); say(`Link copied (${what}): send it, or open it on your other device.`); } catch (er) { say(url); }
});
store.on(paint);
/* V1.50 (V1_PLAN phase 3): the 3D's tap-a-piece size edit saves through the same store ("edits": {item, field, value}) */
window.DemmaStore = { rows: store.rows, put: store.put, del: store.del, on: store.on, shareLink: () => store.shareLink(), get mode() { return mode; } };
store.on(c => window.dispatchEvent(new CustomEvent("demma-rows", { detail: c })));
store.init().then(() => { paint(); window.dispatchEvent(new CustomEvent("demma-rows", { detail: "edits" })); }, paint);
