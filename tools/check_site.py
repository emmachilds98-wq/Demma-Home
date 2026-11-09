"""Demma's Home V1.2: the front door's check, on the built site (index.html, the old design back). At the iPhone 15 Pro's size (393 × 852,
touch) and a desktop's (1920 × 1080): no script errors, nothing off the right edge, it opens on the whole house and the brand says so, the
floors pill is one row on the phone, the photos arrive after the first picture (V1.9), a walk goes from the hall into the living room, up its stairs and back (V1.38), and the dock's Measure lists every open size, keeps a number typed in and counts it. Screenshots go
to _shots/ (the workflow keeps them with the run). V2.75 (N26): the speed budget (tools/perf_budget.json) on four paths, the bytes of a
first visit, the shaders built by the first picture and the draws for the house and the living room; the numbers go to _shots/perf.json.

python3 tools/check_site.py [site dir]      exits non-zero on any failure; THREE_LOCAL serves three.js where the CDN is blocked"""
import http.server, json, pathlib, socketserver, sys, threading, time
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw, localcdn  # noqa: E402

SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site").resolve()
SHOTS = ROOT / "_shots"
# V1.38: a walk from the hall into the living room, up its stairs to the landing (feet at the first floor), back down and out to the hall
WALK = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), seen = [];
  const at = () => { const c = D.camera.position; return [-c.x * 100, c.z * 100]; };
  const go = async (x, z, n, done) => { for (let i = 0; i < n && !done(); i++) { const c = D.camera.position, dx = -x / 100 - c.x, dz = z / 100 - c.z, l = Math.hypot(dx, dz) || 1;
    D.controls.target.set(c.x + dx / l, c.y - 0.05, c.z + dz / l); D.controls.update(); D.walkMove(0, 1, 0, 0.1); if (seen[seen.length - 1] !== D.S.view) seen.push(D.S.view); if (i % 4 == 3) await sl(220); } };
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300); };   // V1.48: until the fly in ends (a slow machine's frames outlast a fixed wait)
  if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close();   // V1.48: no panel re-framing the view while walking
  R3D.set({ view: "hall" }); await settle(); document.querySelector('[data-rmode="stand"]').click(); await settle();
  const legs = [], leg = n => legs.push(n + " " + at().map(Math.round).join(",") + " " + Math.round(D.WALK.feet ?? -1) + " " + D.S.view);
  await go(339, -100, 60, () => at()[1] < -60); leg("in"); await go(400, -66, 20, () => at()[0] > 396); await go(437, -66, 15, () => at()[0] > 432); leg("foot");   // V1.57: to the stairs' foot, not into the cabinet by them (437, -100 was inside it); V2.94: through the narrower door's middle (339), clear of the wider flight's low wall (its corner at z -39)
  await go(437, 600, 40, () => D.WALK.feet > 255 && at()[1] > 215); const top = D.WALK.feet; leg("top");
  await go(437, 205, 10, () => at()[1] < 207); await go(300, 60, 15, () => false); await sl(400); const stay = Math.round(D.WALK.feet); leg("bed2way");   // V1.55: for bedroom 2 from the stairs' top: still on the landing
  await go(437, 230, 15, () => at()[1] > 226);
  await go(330, 230, 12, () => at()[0] < 340); await go(437, 230, 12, () => at()[0] > 432); await go(437, -300, 40, () => at()[1] < -70); leg("down");
  await go(339, -70, 20, () => at()[0] < 344); await go(339, 400, 40, () => at()[1] > 150);   // V2.94: along the room to the door's middle, then out (not across the wider flight's foot)
  leg("out");
  await go(445, 320, 30, () => false); await go(450, 250, 20, () => false); leg("under");   // V1.57: in the hall under the living room's stairs: still the hall
  await go(430, 320, 30, () => at()[1] > 315); await go(430, -90, 160, () => D.WALK.feet < -250); const low = Math.round(D.WALK.feet); leg("lower");   // down the lower stairs: the lower floor
  await go(430, 330, 160, () => D.WALK.feet > -5 && at()[1] > 300); leg("back");
  return { seen, top: Math.round(top), stay, low, end: D.S.view, legs }; }"""
# V1.43 (V1_PLAN phase 8, access): every visible control has a name; the 3D's label says where you are (the brand's second line)
ACCESS = """() => { const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest("[hidden]"); };
  const noname = [...document.querySelectorAll("button, a[href], [role=button], input, select, textarea")].filter(el => vis(el) && !(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.value || (el.labels && el.labels[0] && el.labels[0].textContent) || "").trim()).map(el => el.outerHTML.slice(0, 80));
  const c = document.querySelector(".r3d-stage canvas"), place = (document.getElementById("brand-place") || {}).textContent || "";
  return { noname: noname.slice(0, 4), label: c && c.getAttribute("aria-label").startsWith(place) ? "" : (c && c.getAttribute("aria-label")) }; }"""
# V2.97 (N42): every control in the page, shut panels and a card's too: a name a screen reader can say (an icon's word isn't one); none
# with a positive tabindex; on a PC Tab reads the top row before the 3D, and Esc shuts the top card, then the panel, the focus back on its bubble
NAMES = r"""() => { const nm = el => { const l = el.getAttribute("aria-label"); if (l) return l;
    const lb = el.getAttribute("aria-labelledby"); if (lb) return lb.split(/\s+/).map(i => (document.getElementById(i) || {}).textContent || "").join(" ");
    if (el.labels && el.labels.length) return [...el.labels].map(x => x.textContent).join(" ");
    const c = el.cloneNode(true); c.querySelectorAll("[aria-hidden=true], .ms").forEach(x => x.remove()); c.querySelectorAll("img[alt]").forEach(i => i.replaceWith(i.alt));
    return [c.textContent, el.title, /^(button|submit|reset)$/.test(el.type) && el.value, el.placeholder].filter(Boolean).join(" "); };
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]"); };
  const all = [...document.querySelectorAll("button, [role=button], [role=tab], [role=switch], input:not([type=hidden]), select, textarea, summary, a[href]")];
  const bad = all.filter(el => (el.childNodes.length || vis(el)) && !/[\p{L}\p{N}]/u.test(nm(el)));   // an empty one hidden is filled as it opens
  return { n: all.length, bad: bad.slice(0, 5).map(el => el.outerHTML.slice(0, 120)), pos: [...document.querySelectorAll("[tabindex]")].filter(e => +e.getAttribute("tabindex") > 0).length }; }"""
# V2.96 (N39): Back from a room brings you out to the house (one step, room to room taking its place), not off the site
BACK = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), out = [];
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300); };
  R3D.set({ view: "kitchen" }); await settle(); R3D.set({ view: "master" }); await settle(); out.push(D.S.view, (history.state || {}).r3d);   // not history.length: an earlier step forward (PERF's) is counted till replaced
  history.back(); await settle(); out.push(D.S.view, location.pathname.endsWith("index.html") || location.pathname.endsWith("/"));
  return out; }"""
# V1.53: the first floor from overhead fits the screen (flyTo had held it to 6 m), and the figure dropped on bedroom 3 stands you there
FIN3 = """async () => { const sl = ms => new Promise(r => setTimeout(r, ms)), cv = document.querySelector('.r3d canvas'), out = {};   // V2.6 (FINISHES F3)
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && R3D._dbg.flying; i++) await sl(200); await sl(600); };
  const tap = (x, y) => { const r = cv.getBoundingClientRect(), o = { clientX: r.left + x, clientY: r.top + y, bubbles: true, pointerId: 1, button: 0, isPrimary: true, pointerType: 'mouse' };
    cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); cv.dispatchEvent(new MouseEvent('click', o)); };
  const card = () => { const a = document.querySelector('#r3d-act'); return a && !a.hidden ? a.querySelector('#r3d-act-h').textContent : null; };
  for (const [view, name] of [['bed2', 'Bedroom 2'], ['master', 'Master bedroom'], ['kitchen', 'Kitchen']]) {
    R3D.set({ view }); await settle(); let got = null;
    for (const fy of [0.3, 0.2, 0.4, 0.15]) { for (const fx of [0.15, 0.85, 0.3, 0.7, 0.5]) { tap(cv.clientWidth * fx, cv.clientHeight * fy); await sl(700);   // V2.42: a mouse click's card waits out a double-click (380 ms)
      const h = card(); if (h && h.startsWith(name + ': the')) { got = h; break; } const c = document.querySelector('#r3d-act button'); if (h && c) c.click(); await sl(150); } if (got) break; }
    if (got) { const sw = document.querySelector('[data-finc="#899081"]'); if (sw) sw.click(); await sl(300);
      const kept = JSON.stringify((R3D._dbg.S.fin || {})); out[view] = [got, kept.includes('#899081')];
      const un = document.querySelector('[data-finundo]'); if (un) un.click(); await sl(200); const c = document.querySelector('#r3d-act button'); if (c) c.click(); await sl(150); }
    else out[view] = [null, false]; }
  return out; }"""
DROP = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), cv = document.querySelector('.r3d canvas');
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300); };
  if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close();
  R3D.set({ view: 'house' }); await settle(); document.querySelector('[data-hfloor=first]').click(); await sl(500); document.querySelector('[data-hfview=top]').click(); await settle();
  const scr = id => { const r = D.H3.rooms[id], v = new D.THREE.Vector3(-(r[0] + r[1]) / 2 / 100, r[4] / 100, (r[2] + r[3]) / 2 / 100).project(D.camera); return [(v.x + 1) / 2 * cv.clientWidth, (1 - v.y) / 2 * cv.clientHeight]; };
  const off = ['bed3', 'master', 'bed2', 'bathroom', 'landing'].filter(id => { const [x, y] = scr(id); return x < 0 || y < 0 || x > cv.clientWidth || y > cv.clientHeight; });
  const b = document.getElementById('r3d-peg'), r = b.getBoundingClientRect(), c = cv.getBoundingClientRect(), [x, y] = scr('bed3');
  const o = (X, Y) => ({ clientX: X, clientY: Y, bubbles: true, pointerId: 9, button: 0, isPrimary: true });
  b.dispatchEvent(new PointerEvent('pointerdown', o(r.left + 10, r.top + 10))); b.dispatchEvent(new PointerEvent('pointermove', o(r.left - 30, r.top - 30)));
  b.dispatchEvent(new PointerEvent('pointermove', o(c.left + x, c.top + y))); const gb = () => (document.querySelector('.r3d-pegghost b') || {}).textContent; for (let i = 0; i < 50 && !gb(); i++) await sl(100); const said = gb();   // V1.54: worked out on the next frame
  b.dispatchEvent(new PointerEvent('pointerup', o(c.left + x, c.top + y))); await settle();
  return { off, said, view: D.S.view, mode: D.RMODE, eye: Math.round(D.camera.position.y * 100) };
}"""
# V1.54: a phone's double-tap, sent as real touches: on the master bedroom's bed from overhead (the first tap opens the bed's card at the
# foot of the screen, its click mustn't press it, and the second tap still counts), then where it stood you
TAPAT = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), cv = document.querySelector('.r3d canvas');
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300); };
  R3D.set({ view: 'house' }); await settle(); document.querySelector('[data-hfloor=first]').click(); await sl(500); document.querySelector('[data-hfview=top]').click(); await settle();
  const r = D.H3.rooms.master, v = new D.THREE.Vector3(-(r[0] + r[1]) / 2 / 100, r[4] / 100, (r[2] + r[3]) / 2 / 100).project(D.camera), c = cv.getBoundingClientRect();
  return [c.left + (v.x + 1) / 2 * cv.clientWidth, c.top + (1 - v.y) / 2 * cv.clientHeight + 15]; }"""
STOOD = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)); await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300);
  return { view: D.S.view, mode: D.RMODE, card: D.actId, eye: Math.round(D.camera.position.y * 100) }; }"""
# V1.57: through every door between two rooms you stand in, both ways: you end in the far room's view at its floor (bedroom 3's chair
# and three doorways' hairline floor gaps stopped a walk dead); the cupboards' doors aren't walked
DOORS = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), M = 0.01;
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(150); await sl(200); };
  if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close();
  const RV = { living: "livstand", kitchen: "kitchen", bed3: "office", bed2: "bed2", master: "master", bathroom: "bath", landing: "landing", hall: "hall", wc: "wc", lower_landing: "kitchen" };
  const roomOf = (x, y, z) => { const L = D.H3.living.box; if (x > L[0] && x < L[1] && z > L[2] && z < L[3] && y > -30 && y < 240) return "living";
    for (const [id, r] of Object.entries(D.H3.rooms)) if (RV[id] && x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3] && y >= r[4] - 30 && y <= r[4] + 240) return id; return null; };
  const bad = []; let n = 0;
  for (const [id, it] of Object.entries(D.H3.items)) {
    if (it.k !== "door" || !it.op || /cupboard|airing/.test(id)) continue;
    const o = it.op, mid = (o.a + o.b) / 2, fy = o.y0, P = s => o.axis === "x" ? [mid, o.line + s] : [o.line + s, mid], A = P(-60), B = P(60);
    const ra = roomOf(A[0], fy + 1, A[1]), rb = roomOf(B[0], fy + 1, B[1]); if (!ra || !rb || ra === rb) continue;
    for (const [S0, S1, r1, r0] of [[A, B, rb, ra], [B, A, ra, rb]]) {
      R3D.set({ view: RV[r0] }); await settle(); if (RV[r0] !== "livstand") { document.querySelector('[data-rmode=stand]').click(); await settle(); }
      D.camera.position.set(-S0[0] * M, (fy + 160) * M, S0[1] * M); D.WALK.feet = fy; D.controls.target.set(-S1[0] * M, (fy + 150) * M, S1[1] * M); D.controls.update();
      for (let i = 0; i < 60; i++) { const c = D.camera.position, dx = -S1[0] * M - c.x, dz = S1[1] * M - c.z, l = Math.hypot(dx, dz); if (l < 0.06) break;
        D.controls.target.set(c.x + dx / l, c.y - 0.05, c.z + dz / l); D.controls.update(); D.walkMove(0, 1, 0, 0.1); if (i % 5 == 4) await sl(40); }
      await sl(300); n++;
      if (D.S.view !== RV[r1] || Math.abs(D.WALK.feet - fy) > 10) bad.push(`${id} ${r0}->${r1}: ended in ${D.S.view} at ${Math.round(D.WALK.feet)}`);
    }
  }
  return { n, bad };
}"""
SIZE = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), cv = document.querySelector('.r3d canvas');
  if (window.DemmaTools) window.DemmaTools.close();
  R3D.set({ view: 'office' }); await sl(800); for (let i = 0; i < 300 && D.flying; i++) await sl(100); await sl(300);
  const it = Object.values(D.PICK).flat().find(q => q.id === 'office.desk'); if (!it) return { err: 'no desk in PICK' };
  const c = it.b.getCenter(new D.THREE.Vector3()).project(D.camera), r = cv.getBoundingClientRect();
  const o = { clientX: r.left + (c.x + 1) / 2 * cv.clientWidth, clientY: r.top + (1 - c.y) / 2 * cv.clientHeight, bubbles: true, pointerId: 1, button: 0, isPrimary: true };
  cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); await sl(600);   // V1.54: past the card's first 350 ms (a tap's own click)
  const card = D.actId, b = document.querySelector('#r3d-act [data-actopen^="hsize:"]'); if (!b) return { card };
  b.click(); await sl(200); document.querySelector('#r3d-act [data-hstep="w"][data-by="1"]').click(); await sl(600);
  const row = JSON.parse(localStorage.getItem('demma-v1:edits') || '{}')['office.desk~w'], ed = !!D.HEDITS['office.desk'];
  const listed = !document.getElementById('ms-edits').hidden && document.getElementById('ms-elist').textContent.includes('The oak desk');   // V1.51: Measure lists it
  document.querySelector('#r3d-act [data-hreset]').click(); await sl(600);
  return { card, row: row ? row.value : null, ed, listed, after: Object.keys(D.HEDITS).length, gone: document.getElementById('ms-edits').hidden };
}"""
SWAP = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), cv = document.querySelector('.r3d canvas'), q = s => document.querySelector(s), ds = window.DemmaStore;
  const wait = async f => { for (let i = 0; i < 200 && !f(); i++) await sl(150); return !!f(); };
  R3D.set({ view: 'master' }); await sl(800); for (let i = 0; i < 300 && D.flying; i++) await sl(100); await sl(300);
  const it = Object.values(D.PICK).flat().find(p => p.id === 'master.chest'); if (!it) return { err: 'no chest in PICK' };
  const c = it.b.getCenter(new D.THREE.Vector3()).project(D.camera), r = cv.getBoundingClientRect();
  const o = { clientX: r.left + (c.x + 1) / 2 * cv.clientWidth, clientY: r.top + (1 - c.y) / 2 * cv.clientHeight, bubbles: true, pointerId: 1, button: 0, isPrimary: true };
  cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); await sl(600);
  const b = q('#r3d-act [data-actopen^="hswap:"]'); if (!b) return { card: D.actId }; b.click(); await sl(200); q('#r3d-act [data-hswapgo$=":1"]').click();
  const swapped = await wait(() => D.HEDITS['master.chest'] && D.HEDITS['master.chest'].swap === 'chest3' && D.PICK.first.some(p => p.id === 'master.chest'));
  await ds.put('edits', 'add.check~add', { item: 'add.check', field: 'add', value: 'plant', room: 'master', x: 240, z: 220, y: 260 });
  const added = await wait(() => D.PICK.first.some(p => p.id === 'add.check'));
  await Promise.all(Object.entries(ds.rows('edits')).filter(([, v]) => v && /^(master[.]chest|add[.]check)$/.test(v.item)).map(([k]) => ds.del('edits', k)));
  const gone = await wait(() => !D.PICK.first.some(p => p.id === 'add.check') && !D.HEDITS['master.chest']);
  if (D.actId) q('#r3d-act .x').click();
  D.openAct('fin:bed2:5'); await sl(600); q('#r3d-act [data-finplant="snake"]').click();   // N5: the room's plant, from Look's floor card
  const planted = await wait(() => D.PICK.first.some(p => p.id === 'plant.bed2')) && JSON.stringify(R3D.finishes().bed2 || {}).includes('snake');
  q('#r3d-act [data-finplant=""]').click(); const unplanted = await wait(() => !D.PICK.first.some(p => p.id === 'plant.bed2')); if (D.actId) q('#r3d-act .x').click();
  return { swapped, added, gone, planted, unplanted };
}"""
OFF = """() => { const W = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed" || el.closest("[hidden], .sheet, .r3d-panel, .r3d-floors, .lightbox, .r3d-stage")) continue;
    if (r.right > W + 1) out.push(el.tagName + "." + el.className + " " + Math.round(r.right)); }
  return out.slice(0, 5); }"""


# V2.75 (N26), "nothing guards the gains": every resource kept, the first picture's shaders noted, and a graphics chip named (an iPhone's,
# an RTX's) so software graphics take the client's own devices' paths (HD from the start)
PERF_INIT = """performance.setResourceTimingBufferSize(4000);
(() => { const gpu = %s; if (gpu) for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) { const g = C.prototype.getParameter;
  C.prototype.getParameter = function (p) { return p === 0x9245 || p === 0x9246 ? gpu : g.call(this, p); }; } })();
if (%s) try { localStorage.setItem("mw18-3d", JSON.stringify({ quality: "hd", picked: true })); } catch (e) {}   // HD held (no step down mid-count)
addEventListener("r3d-first", () => { window.__first = R3D._dbg.gl.info.programs.length; });
(() => { let fr = 0; const L = new WeakMap(), raf = requestAnimationFrame, P = WebGL2RenderingContext.prototype, lk = P.linkProgram, up = P.useProgram; window.__spot = 0;
  window.requestAnimationFrame = cb => raf(t => { fr++; window.__fr = fr; cb(t); });   // N54: a shader built on the frame that first draws with it (a freeze on a real device)
  P.linkProgram = function (q) { L.set(q, fr); return lk.call(this, q); };
  P.useProgram = function (q) { if (L.has(q)) { if (L.get(q) === fr) window.__spot++; L.delete(q); } return up.call(this, q); }; })();"""
# N54: from the whole house into the living room once the house's warm-up has visited it: no shader built on the spot
SPOT = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 300 && !(D.WARMED.has("livstand" + D.S.quality) && !D.PRE.queue.length); i++) await sl(1000);
  await sl(2000); const n = window.__spot; R3D.set({ view: "livstand" }); await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(3000);
  return window.__spot - n; }"""
PERF = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms));
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(1200); };
  await R3D.photos(); let n = -1, k = 0;                       // the first visit: until nothing more is fetched for 3 s
  for (let i = 0; i < 90 && k < 3; i++) { await sl(1000); const m = performance.getEntriesByType("resource").length; k = m === n ? k + 1 : 0; n = m; }
  const nav = performance.getEntriesByType("navigation")[0]; let bytes = nav ? nav.encodedBodySize : 0;
  for (const e of performance.getEntriesByType("resource")) if (e.name.startsWith(location.origin)) bytes += e.encodedBodySize;
  const still = async () => { const g = D.gl.shadowMap; let c = 1e9;   // a frame's draws while you move: the shadows' redraw (a room change) left out
    const fresh = async () => { const f = window.__fr || 0; for (let i = 0; i < 100 && (window.__fr || 0) < f + 2; i++) await sl(200); };   // V3.26: a frame drawn since (CI's frames take seconds: 600 ms read the fly's last, house and room both, 770-945)
    for (let i = 0; i < 3; i++) { g.needsUpdate = false; D.controls.dispatchEvent({ type: "change" }); await sl(600); await fresh(); c = Math.min(c, R3D.perf().calls); }
    g.needsUpdate = true; D.controls.dispatchEvent({ type: "change" }); return c; };
  const h = await still();                                     // the house as it opens (R3D.set shows the living room from outside: 91 more draws)
  R3D.set({ view: "livstand" }); await settle(); const l = await still(); R3D.set({ view: "house" }); await settle();
  return { first_visit_mb: +(bytes / 1e6).toFixed(2), shaders_first: window.__first ?? -1, draws_house: h, draws_living: l, quality: R3D.perf().quality }; }"""
BUDGET = json.loads((ROOT / "tools/perf_budget.json").read_text())
# the client's iPhones and PCs (tools/perf_budget.json "paths"): Apple graphics and an RTX start in HD
HD_PATHS = (("iphone", 393, 852, True, "Apple GPU"), ("rtx", 1280, 800, False, "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)"))


def over_budget(path, got):
    want = BUDGET["paths"][path]
    return [f"{path}: {k} {got.get(k)} over {v}" for k, v in want.items() if not k.startswith("_") and not 0 <= (got.get(k) or 0) <= v]


# V3.07: Edit room on a phone, "Look round from here" on: a finger dragging the ottoman moves it, not the view (it turned the view too)
EDITPT = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)); if (window.DemmaTools && DemmaTools.isOpen()) DemmaTools.close();
  R3D.set({ view: 'room' }); await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200);
  D.S.edit || document.getElementById('r3d-editbtn').click(); document.querySelector('[data-cam=look]').click(); await sl(2500);   // V3.23: CI's slow frames took Edit's switch past 0.5 s (main red twice)
  const b = new D.THREE.Box3().setFromObject(D.MOV.pouf.pivot), v = b.getCenter(new D.THREE.Vector3()).setY(b.max.y * 0.6).project(D.camera), r = document.querySelector('.r3d canvas').getBoundingClientRect();
  return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }"""
EDITAT = "() => { const D = R3D._dbg, c = D.camera.position, t = D.controls.target; return [c.x, c.y, c.z, t.x, t.y, t.z, D.MOV.pouf.pivot.position.x, D.MOV.pouf.pivot.position.z]; }"


def edit_drag(pg, w):
    x, y = pg.evaluate(EDITPT); a = pg.evaluate(EDITAT); cdp = pg.context.new_cdp_session(pg)
    T = lambda t, X=0, Y=0: cdp.send("Input.dispatchTouchEvent", {"type": t, "touchPoints": [] if t == "touchEnd" else [{"x": X, "y": Y, "id": 1}]})
    T("touchStart", x, y); pg.wait_for_timeout(400)
    for i in range(1, 7): T("touchMove", x + 8 * i, y - 4 * i); pg.wait_for_timeout(100)
    T("touchEnd"); pg.wait_for_timeout(2500); z = pg.evaluate(EDITAT)
    cam, moved = max(abs(p - q) for p, q in zip(a[:6], z[:6])), max(abs(a[6] - z[6]), abs(a[7] - z[7]))
    pg.evaluate("() => { document.getElementById('r3d-undo').click(); document.querySelector('[data-cam=orbit]').click(); document.getElementById('r3d-editbtn').click(); R3D.set({ view: 'house' }); }"); pg.wait_for_timeout(1500)
    return [] if cam < 1e-4 and moved > 0.05 else [f"{w}: dragging the ottoman in Edit (Look round on): the view moved {cam:.3f} m, the ottoman {moved:.3f} m (want the view still, the ottoman moved)"]


def stick_all(pg, w):
    """V3.15: the phone's stick in every view: over the house it moves the map, in a room's Above too, in its In it it stands you there"""
    out, at = [], "() => { const t = R3D._dbg.controls.target, s = document.querySelector('.r3d-stick'); return [t.x, t.z, getComputedStyle(s).display, R3D._dbg.RMODE]; }"
    for how, go in (("the house", "R3D.set({ view: 'house' })"), ("the hall's Above", "R3D.set({ view: 'hall' }); setTimeout(() => document.querySelector('[data-rmode=above]').click(), 1500)"),
                    ("the hall's In it", "document.querySelector('[data-rmode=in]').click()")):
        pg.evaluate(f"() => {{ {go}; }}"); pg.wait_for_timeout(4000); a = pg.evaluate(at)
        x, y = pg.evaluate("() => { const r = document.querySelector('.r3d-stick').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x, y - 40, steps=3); pg.wait_for_timeout(2500); pg.mouse.up(); pg.wait_for_timeout(800); z = pg.evaluate(at)
        moved = max(abs(a[0] - z[0]), abs(a[1] - z[1]))
        if a[2] == "none" or (z[3] != "stand" if "In it" in how else moved < 0.05):   # In it: the flight down to your eyes takes CI's slow frames, standing is the proof
            out.append(f"{w}: the stick in {how}: shown {a[2]!r}, moved {moved:.2f} m, then {z[3]!r} (want shown, moving, In it standing you there)")
    pg.evaluate("() => R3D.set({ view: 'house' })"); pg.wait_for_timeout(1500)
    return out


def names_keys(pg, w):
    """V2.97 (N42): names everywhere (the page as it opens, a door's card in the kitchen, Edit's list), Esc one at a time; on a PC Tab"""
    out, D = [], "R3D._dbg"
    def check(when):
        r = pg.evaluate(NAMES)
        if r["bad"]: out.append(f"{w}: {when}, controls with no name: {r['bad']}")
        if r["pos"]: out.append(f"{w}: {r['pos']} with a positive tabindex (Tab jumps out of reading order)")
    check("as it opens")
    pg.evaluate(f"() => {{ {D}.openAct('hdoor:door.living_door', [400, 300]); R3D.set({{ view: 'kitchen' }}); }}"); pg.wait_for_timeout(1500); check("a door's card, the kitchen")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    if pg.evaluate(f"() => {D}.actId"): out.append(f"{w}: Esc didn't shut the door's card")
    pg.evaluate(f"() => {{ {D}.S.edit || document.getElementById('r3d-editbtn').click(); document.getElementById('r3d-add').click(); }}"); pg.wait_for_timeout(800); check("Edit's list")
    pg.keyboard.press("Escape"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    if pg.evaluate(f"() => {D}.S.edit"): out.append(f"{w}: two Esc didn't shut Edit's list and then Edit")
    pg.evaluate("() => R3D.set({ view: 'house' })"); pg.wait_for_timeout(1500)
    if w < 600: return out
    seen = []
    pg.evaluate("() => document.querySelector('.brand').focus()")   # from the brand, top left
    for _ in range(40):
        pg.keyboard.press("Tab")
        k = pg.evaluate("() => { const a = document.activeElement; return a.tagName === 'CANVAS' ? '3D' : a.closest('.r3d-mini') ? 'top' : a.closest('.r3d-dock') ? 'dock' : '' }")
        if k and (not seen or seen[-1] != k): seen.append(k)
        if k == "dock": break
    if seen[:3] != ["top", "3D", "dock"]: out.append(f"{w}: Tab goes {seen} (want the top row, the 3D, the dock)")
    pg.click("#r3d-dt-look"); pg.wait_for_timeout(500)
    pg.evaluate(f"() => {D}.openAct('hdoor:door.living_door', [400, 300])"); pg.wait_for_timeout(500)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    one = pg.evaluate(f"() => [!!{D}.actId, DemmaTools.isOpen()]")
    pg.evaluate("() => document.querySelector('#r3d-panel .r3d-px').focus()"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    two = pg.evaluate("() => [DemmaTools.isOpen(), document.activeElement.id]")
    if one != [False, True] or two != [False, "r3d-dt-look"]:
        out.append(f"{w}: Esc with a card over the Look panel: card {one[0]}, panel {one[1]}, then panel {two[0]}, focus on {two[1]!r} (want the card shut, then the panel, the focus back on Look)")
    return out


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    from playwright.sync_api import sync_playwright
    SHOTS.mkdir(exist_ok=True)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/"
    rows = len(json.loads((SITE / "data/house.json").read_text())["measure"])
    photos = len(json.loads((ROOT / "house/textures/textures.json").read_text()))
    fails, perf = [], {}
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        for w, h in ((393, 852), (1920, 1080)):
            phone = w < 600
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=phone, has_touch=phone, service_workers="block")
            ctx.add_init_script(PERF_INIT % ("null", "false"))
            if phone: ctx.add_init_script("window.__r3dDblMs = 20000;")   # V1.54: this rig hands each touch on only after a slow frame (~0.5 s here, seconds on GitHub), so its double-tap and tap allow longer (only two taps are sent)
            pg = ctx.new_page(); pg.set_default_timeout(300000); localcdn.route(pg); errs = []   # V1.5: CI's software graphics draw the whole house at 1920 in ~20 s a frame; a screenshot took over 120 s
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300]))
            pg.on("console", lambda m: errs.append(m.text[:300]) if (m.type == "error" and "favicon" not in m.text and "fonts.g" not in m.text) or "INVALID_" in m.text else None)   # V1.12: and any WebGL error (a photo sent into a texture too small for it, V1.9-V1.11)
            pg.goto(base + "index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000); pg.wait_for_timeout(3000)
            view, place = pg.evaluate("() => [R3D._dbg.S.view, (document.getElementById('brand-place') || {}).textContent]")
            if view != "house": fails.append(f"{w}: opens on {view!r}, not the whole house")
            if place != "The whole house": fails.append(f"{w}: the brand says {place!r}")
            got = pg.evaluate("() => R3D.photos()")   # V1.9: the photos come after the first picture (their own file)
            if got != photos: fails.append(f"{w}: {got} of {photos} photo sets arrived")
            name = "phone" if phone else "computer"                # V2.75 (N26): the budget, Fast's two paths (no graphics card)
            perf[name] = pg.evaluate(PERF); fails += over_budget(name, perf[name])
            off = pg.evaluate(OFF)
            if off: fails.append(f"{w}: off the right edge: {off}")
            pg.screenshot(path=str(SHOTS / f"site-{w}-house.png"))
            acc = pg.evaluate(ACCESS)
            if acc["noname"]: fails.append(f"{w}: controls with no name: {acc['noname']}")
            if acc["label"]: fails.append(f"{w}: the 3D's label doesn't say where you are: {acc['label']!r}")
            fails += names_keys(pg, w)
            if phone:
                fails += edit_drag(pg, w) + stick_all(pg, w)
                bk = pg.evaluate(BACK)
                if bk != ["master", "master", "house", True]: fails.append(f"{w}: two rooms, then Back: {bk} (want ['master', 'master', 'house', True]: one step, out to the house)")
            pg.click("[data-hfloor=first]"); pg.wait_for_timeout(2500)
            if phone:
                fh = pg.evaluate("() => document.getElementById('r3d-floors').getBoundingClientRect().height")
                if fh > 48: fails.append(f"{w}: the floors pill wraps ({fh:.0f} px tall)")
            place = pg.evaluate("() => document.getElementById('brand-place').textContent")
            if place != "The first floor": fails.append(f"{w}: on the first floor the brand says {place!r}")
            pg.screenshot(path=str(SHOTS / f"site-{w}-first.png"))
            pg.click("#r3d-dt-measure"); pg.wait_for_timeout(800)
            n = pg.evaluate("() => document.querySelectorAll('#r3d-dp-measure [data-measure]').length")
            if n != rows: fails.append(f"{w}: Measure lists {n} sizes, the house file {rows}")
            pg.fill("#r3d-dp-measure [data-measure]", "123")   # V2.75: wait for the save (a 600 ms debounce behind a frame that takes seconds in CI), not a fixed 1.2 s: it failed main's V2.74 run and four PRs
            try: pg.wait_for_function("() => { const r = JSON.parse(localStorage.getItem('demma-v1:measurements') || '{}'), f = document.querySelector('#r3d-dp-measure [data-measure]').dataset.measure; return r[f] && r[f].cm === 123; }", timeout=60000)
            except Exception: pass
            kept = pg.evaluate("() => JSON.parse(localStorage.getItem('demma-v1:measurements') || '{}')")
            first = pg.evaluate("() => document.querySelector('#r3d-dp-measure [data-measure]').dataset.measure")
            if (kept.get(first) or {}).get("cm") != 123: fails.append(f"{w}: Measure didn't keep the number typed ({kept})")
            cnt = pg.evaluate("() => document.getElementById('ms-count').textContent")
            if not cnt.startswith("1 of"): fails.append(f"{w}: Measure counts {cnt!r}")
            pg.screenshot(path=str(SHOTS / f"site-{w}-measure.png"))
            if phone:                                           # V1.50: tap a piece, change its size, put it back
                pg.click("#r3d-dt-measure"); pg.wait_for_timeout(500)
                sz = pg.evaluate(SIZE)
                if sz.get("card") != "hitem:office.desk" or not sz.get("row") or not sz.get("ed") or not sz.get("listed") or sz.get("after") or not sz.get("gone"):
                    fails.append(f"{w}: tapping the office desk and widening it: {sz} (want its card, a row of 223.9, the 3D changed, Measure listing it, then back as planned)")
                pg.screenshot(path=str(SHOTS / f"site-{w}-size.png"))
                sw = pg.evaluate(SWAP)                          # V2.46 (N7): swap the master's chest for another, add a plant from the catalogue, both back
                if sw != {"swapped": True, "added": True, "gone": True, "planted": True, "unplanted": True}:
                    fails.append(f"{w}: swapping the master bedroom's chest, adding a plant, bedroom 2's plant from Look: {sw} (want each drawn, then gone)")
            if phone:                                           # V2.5 (FINISHES_PLAN F2): a room's walls and ceiling through the palette, then back
                fn = pg.evaluate("() => [R3D.finish('bed2', 'walls', '#3a6b5a'), R3D.finish('bed2', 'ceiling', '#e8c0c8'), R3D.finish('nowhere', 'walls', '#000000'), R3D.finish(null, 'walls', null), R3D.finish(null, 'ceiling', null)]")
                if fn != [True, True, False, True, True]:
                    fails.append(f"{w}: R3D.finish on bedroom 2's walls and ceiling, a room that isn't, then all back: {fn} (want [true, true, false, true, true])")
            if not phone:                                       # V2.6 (FINISHES F3): tap a wall in three rooms, a colour, Undo
                f3 = pg.evaluate(FIN3)
                bad = {k: v for k, v in f3.items() if not v[0] or not v[1]}
                if bad:
                    fails.append(f"{w}: tapping a wall and a colour in three rooms: {f3} (want each room's walls' card, the colour kept, then undone)")
            if phone:                                           # V2.13 (FINISHES F6): a scheme saved, another set, the first back in one tap
                sc = pg.evaluate("""async () => { const sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), was = R3D.finishes();
                  try { localStorage.removeItem('dh-fin-schemes'); } catch (e) {}
                  R3D.setFinishes({ bed2: { 0: '#899081', 5: 'oak', 8: 'dome' } }); await sl(200); q('#r3d-finschname').value = 'A'; q('#r3d-finschsave').click();
                  R3D.setFinishes({ landing: { 4: '#e8c0c8' } }); await sl(200); q('[data-finsch="0"]').click(); await sl(300);
                  const got = JSON.stringify(R3D.finishes()); try { localStorage.removeItem('dh-fin-schemes'); } catch (e) {} R3D.setFinishes(was); return got; }""")
                if sc != '{"bed2":{"0":"#899081","5":"oak","8":"dome"}}':
                    fails.append(f"{w}: the house's colours saved as a scheme, others set, the scheme back: {sc} (want bedroom 2's back wall, oak floor and flush dome)")
            if phone:                                           # V1.53: the floor from overhead, then the figure dropped in
                dr = pg.evaluate(DROP)
                if dr.get("off") or dr.get("said") != "Bedroom 3" or dr.get("view") != "office" or dr.get("mode") != "stand" or abs(dr.get("eye", 0) - 420) > 15:
                    fails.append(f"{w}: the first floor from overhead and the figure dropped on bedroom 3: {dr} (want every room on screen, 'Bedroom 3', standing in the office at 420)")
                pg.screenshot(path=str(SHOTS / f"site-{w}-drop.png"))
            if phone:                                           # V1.54: a real double-tap stands you there, the bed's card notwithstanding
                x, y = pg.evaluate(TAPAT); cdp = ctx.new_cdp_session(pg)
                for _ in range(2):
                    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]}); cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); time.sleep(0.12)
                tp = pg.evaluate(STOOD)
                if tp.get("view") != "master" or tp.get("mode") != "stand" or tp.get("card") or abs(tp.get("eye", 0) - 420) > 15:
                    fails.append(f"{w}: a double-tap (touches) on the master bedroom from overhead: {tp} (want standing in it at 420, no card)")
            if phone:                                           # V1.38: walk into the living room, up to the landing and back out (the small screen: quicker frames)
                wk = pg.evaluate(WALK)
                want = ["hall", "livstand", "landing", "livstand", "hall", "kitchen", "hall"]
                got = [v for i, v in enumerate(wk["seen"]) if i == 0 or v != wk["seen"][i - 1]]
                if wk.get("low", 0) > -250: fails.append(f"{w}: down the lower stairs from the hall the feet got to {wk.get('low')} (want -260); legs {wk['legs']}")
                if wk.get("stay", 0) < 255: fails.append(f"{w}: heading for bedroom 2 from the top of the living room's stairs took the walk down them (feet {wk.get('stay')}); legs {wk['legs']}")
                if got != want or wk["top"] < 255: fails.append(f"{w}: the walk into the living room went {got}, its feet up to {wk['top']} (want {want}, 260); legs {wk['legs']}")
                pg.screenshot(path=str(SHOTS / f"site-{w}-walk.png"))
            if phone:                                           # V1.57: every door, both ways (after the walk: it moves the walker by hand)
                dr = pg.evaluate(DOORS)
                if dr.get("bad") or dr.get("n", 0) < 10: fails.append(f"{w}: walking through the doors ({dr.get('n')} walks): {dr.get('bad')}")
            if errs: fails.append(f"{w}: errors: {errs[:4]}")
            ctx.close()
        for name, w, h, phone, gpu in HD_PATHS:                    # V2.75 (N26): the budget on the client's devices' paths, HD from the start
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=phone, has_touch=phone, service_workers="block")
            ctx.add_init_script(PERF_INIT % (json.dumps(gpu), "true")); pg = ctx.new_page(); pg.set_default_timeout(600000); localcdn.route(pg); errs = []
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300]))
            pg.goto(base + "index.html"); pg.wait_for_function("window.R3D && window.R3D.ready && window.__first", timeout=600000)
            perf[name] = pg.evaluate(PERF); perf[name]["shaders_spot"] = pg.evaluate(SPOT); fails += over_budget(name, perf[name])
            if perf[name]["quality"] != "hd": fails.append(f"{name}: drawn in {perf[name]['quality']}, not HD")
            if errs: fails.append(f"{name}: errors: {errs[:4]}")
            ctx.close()
        b.close()
    (SHOTS / "perf.json").write_text(json.dumps(perf, indent=1))
    httpd.shutdown()
    for f in fails: print("FAIL ", f)
    print("speed: " + " · ".join(f"{k} {v['first_visit_mb']} MB, {v['shaders_first']} shaders first, draws {v['draws_house']} house {v['draws_living']} living room" + (f", {v['shaders_spot']} built on the spot into it" if "shaders_spot" in v else "") for k, v in perf.items()))
    print(f"site check: the front door at 393 and 1920, opens on the house, its {photos} photo sets after, every control named (shut panels, a card, Edit's list too), Esc one layer a press, Tab the top row then the 3D, Measure keeps a number, a piece resized from a tap, one swapped and one added, a wall's colour in three rooms, the figure dropped in, a double-tap there, through every door both ways, a walk into the living room and up its stairs, Back from a room to the house, down to the lower floor and back, the speed budget on 4 paths, {len(fails)} failed; screenshots in _shots/")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
