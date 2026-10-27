// Demma's Home __LABEL__: opens from the device after the first visit (Phase 8). The app, its data and the 3D page come from the network
// first (so a new round shows at once) and from the device when offline; pictures, fonts, three.js and the 3D's data and script (named
// by their contents, room/scene.<hash>.json and room/room3d.<hash>.js) from the device first.
const C = "demmas-home-__V__";
const SHELL = ["./", "index.html", "manifest.webmanifest", "app/tokens.css", "app/app.css", "app/js/app.js", "app/js/model.js", "app/js/store.js",
  "app/js/viewer.js", "app/js/ui.js", "app/js/edit.js", "data/house.json", "data/media.json", "data/next.json", "data/projects/index.json"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {})); });
const KEEP = "demmas-home-3d";                                                       // the hashed 3D files outlive a round's cache
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== KEEP).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const keep = (r, res) => { if (res && res.ok) { const cp = res.clone(), stem = new URL(r.url).pathname.replace(/\.[0-9a-f]{10}\.(js|json)$/, "");
  caches.open(KEEP).then(async c => { for (const k of await c.keys()) if (new URL(k.url).pathname.startsWith(stem + ".")) await c.delete(k); await c.put(r, cp); }); } return res; };   // one of each: the last round's goes
const put = (r, res) => { if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; };
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (/\.pdf$/.test(u.pathname)) return;                                            // the PDFs from the network only
  if (/\.[0-9a-f]{10}\.(js|json)$/.test(u.pathname)) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res)))); return; }   // named by their contents: never stale
  const fresh = r.mode === "navigate" || (u.origin === location.origin && /\.(html|js|css|json|webmanifest)$|\/$/.test(u.pathname));
  if (fresh) { e.respondWith(fetch(r).then(res => put(r, res)).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./")))); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res))));
});
