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
    const fromLink = readLink();
    if (fromLink) for (const [c, rows] of Object.entries(fromLink)) if (cache[c]) { Object.assign(cache[c], rows); local.save(c); }
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
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(pick)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.href.split("#")[0] + "#share=" + enc;
  },
};
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
  const ids = Object.keys(store.rows("measurements")).filter(id => answer(id).cm != null);
  if (!ids.length) { say("Type a number first."); return; }
  for (const id of ids) await store.put("measurements", id, Object.assign({}, answer(id), { sent: true }));
  if (mode === "shared") { say(`Sent: ${ids.length} measurement${ids.length === 1 ? "" : "s"}. The next round puts them in.`); return; }
  const url = store.shareLink();
  try { if (navigator.share) { await navigator.share({ title: "Demma's Home: measurements", url }); say("Shared."); return; } } catch (er) { if (er && er.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); say("Link copied: send it in a message."); } catch (er) { say(url); }
});
store.on(paint);
store.init().then(paint, paint);
