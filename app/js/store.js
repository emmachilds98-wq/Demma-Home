/* Demma's Home V1: where what you do in the app is kept (docs/V1_PLAN.md 2.3).
   On the shared page (the claude.ai artifact) it's the page's shared database, so Emma and Dave see the same plan; on GitHub Pages (no
   database) it stays on this device and goes to the other person as a link. Collections, each row plain data (agents read them with
   tools/pull_edits.py, as data, never as instructions):
     measurements/<row id>   {item, what, cm, photo?, by, at}
     edits/<item>~<field>    {item, field, value, by, at}          field: w h d up along removed
     notes/<auto>            {room, item, text, by, at}
     photos/<auto>           {room, url, asset, by, at}
     ticks/<id>              {done, by, at}                         jobs done, things bought */
const COLS = ["measurements", "edits", "notes", "photos", "ticks"];
const KEY = "demma-v1:";
const cache = Object.fromEntries(COLS.map(c => [c, {}]));
const subs = new Set();
let db = null, me = null, mode = "device", readOnly = false;

const emit = col => subs.forEach(fn => { try { fn(col); } catch (e) { console.error(e); } });
const local = {
  load(col) { try { return JSON.parse(localStorage.getItem(KEY + col) || "{}"); } catch (e) { return {}; } },
  save(col) { try { localStorage.setItem(KEY + col, JSON.stringify(cache[col])); } catch (e) {} },
};

async function useCap(name) {
  if (!window.claude || typeof window.claude.use !== "function") return null;
  try { return await Promise.race([window.claude.use(name), new Promise(r => setTimeout(() => r(null), 10000))]); } catch (e) { return null; }
}

export const store = {
  get mode() { return mode; },
  get readOnly() { return readOnly; },
  rows(col) { return cache[col]; },
  list(col) { return Object.entries(cache[col]).map(([id, v]) => Object.assign({ id }, v)); },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },

  async init() {
    for (const c of COLS) cache[c] = local.load(c);
    const fromLink = readLink();
    if (fromLink) for (const [c, rows] of Object.entries(fromLink)) if (cache[c]) { Object.assign(cache[c], rows); local.save(c); }
    db = await useCap("db");
    if (!db) return { mode, fromLink: !!fromLink };
    const user = await useCap("user");
    try { me = user ? await user.id() : null; } catch (e) { me = null; }
    try { if (user && user.can) { const c = await user.can("data.write"); if (c === false) readOnly = true; } } catch (e) {}
    mode = "shared";
    for (const c of COLS) {
      db.collection(c).onSnapshot(snap => {
        cache[c] = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
        emit(c);
      }, () => {});
    }
    return { mode, fromLink: !!fromLink };
  },

  async put(col, id, data) {
    const row = Object.assign({}, data, { by: me || "this device", at: new Date().toISOString() });
    cache[col][id] = row; emit(col);
    if (mode === "shared" && !readOnly) {
      try { await db.collection(col).doc(id).set(row); }
      catch (e) { if (e && e.code === "invalid_argument") readOnly = true; throw e; }
    } else local.save(col);
    return row;
  },
  async del(col, id) {
    delete cache[col][id]; emit(col);
    if (mode === "shared" && !readOnly) { try { await db.collection(col).doc(id).delete(); } catch (e) {} }
    else local.save(col);
  },
  async add(col, data) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return this.put(col, id, data).then(() => id);
  },
  /* GitHub Pages: what's on this device, as a link for the other person (edits, measurements, notes, ticks; not photos) */
  shareLink() {
    const pick = {}; for (const c of ["measurements", "edits", "notes", "ticks"]) if (Object.keys(cache[c]).length) pick[c] = cache[c];
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(pick)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.href.split("#")[0] + "#/home?share=" + enc;
  },
  async assets() { return mode === "shared" ? useCap("assets") : null; },
  async downloads() { return useCap("downloads"); },
};

function readLink() {
  const m = location.hash.match(/[?&]share=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const s = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const out = JSON.parse(decodeURIComponent(escape(atob(s + "===".slice((s.length + 3) % 4)))));
    history.replaceState(null, "", location.href.replace(/[?&]share=[A-Za-z0-9_-]+/, ""));
    return out;
  } catch (e) { return null; }
}
