"""Demma's Home V1.2: the front door's check, on the built site (index.html, the old design back). At the iPhone 15 Pro's size (393 × 852,
touch) and a desktop's (1920 × 1080): no script errors, nothing off the right edge, it opens on the whole house and the brand says so, the
floors pill is one row on the phone, the photos arrive after the first picture (V1.9), a walk goes from the hall into the living room, up its stairs and back (V1.38), and the dock's Measure lists every open size, keeps a number typed in and counts it. Screenshots go
to _shots/ (the workflow keeps them with the run).

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
  await go(357, -100, 60, () => at()[1] < -60); leg("in"); await go(437, -100, 30, () => at()[0] > 432); await go(437, -60, 10, () => at()[1] > -62); leg("foot");
  await go(437, 600, 40, () => D.WALK.feet > 255 && at()[1] > 215); const top = D.WALK.feet; leg("top");
  await go(330, 230, 12, () => at()[0] < 340); await go(437, 230, 12, () => at()[0] > 432); await go(437, -300, 40, () => at()[1] < -70); leg("down");
  await go(357, -10, 20, () => at()[0] < 362); await go(357, 400, 30, () => at()[1] > 150);
  leg("out"); return { seen, top: Math.round(top), end: D.S.view, legs }; }"""
# V1.43 (V1_PLAN phase 8, access): every visible control has a name; the 3D's label says where you are (the brand's second line)
ACCESS = """() => { const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest("[hidden]"); };
  const noname = [...document.querySelectorAll("button, a[href], [role=button], input, select, textarea")].filter(el => vis(el) && !(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.value || (el.labels && el.labels[0] && el.labels[0].textContent) || "").trim()).map(el => el.outerHTML.slice(0, 80));
  const c = document.querySelector(".r3d-stage canvas"), place = (document.getElementById("brand-place") || {}).textContent || "";
  return { noname: noname.slice(0, 4), label: c && c.getAttribute("aria-label").startsWith(place) ? "" : (c && c.getAttribute("aria-label")) }; }"""
# V1.53: the first floor from overhead fits the screen (flyTo had held it to 6 m), and the figure dropped on bedroom 3 stands you there
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
OFF = """() => { const W = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed" || el.closest("[hidden], .sheet, .r3d-panel, .r3d-floors, .lightbox, .r3d-stage")) continue;
    if (r.right > W + 1) out.push(el.tagName + "." + el.className + " " + Math.round(r.right)); }
  return out.slice(0, 5); }"""


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
    fails = []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        for w, h in ((393, 852), (1920, 1080)):
            phone = w < 600
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=phone, has_touch=phone, service_workers="block")
            if phone: ctx.add_init_script("window.__r3dDblMs = 3000;")   # V1.54: this rig hands each touch on only after a slow frame (~0.5 s), so its double-tap and tap allow longer
            pg = ctx.new_page(); pg.set_default_timeout(300000); localcdn.route(pg); errs = []   # V1.5: CI's software graphics draw the whole house at 1920 in ~20 s a frame; a screenshot took over 120 s
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300]))
            pg.on("console", lambda m: errs.append(m.text[:300]) if (m.type == "error" and "favicon" not in m.text and "fonts.g" not in m.text) or "INVALID_" in m.text else None)   # V1.12: and any WebGL error (a photo sent into a texture too small for it, V1.9-V1.11)
            pg.goto(base + "index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000); pg.wait_for_timeout(3000)
            view, place = pg.evaluate("() => [R3D._dbg.S.view, (document.getElementById('brand-place') || {}).textContent]")
            if view != "house": fails.append(f"{w}: opens on {view!r}, not the whole house")
            if place != "The whole house": fails.append(f"{w}: the brand says {place!r}")
            got = pg.evaluate("() => R3D.photos()")   # V1.9: the photos come after the first picture (their own file)
            if got != photos: fails.append(f"{w}: {got} of {photos} photo sets arrived")
            off = pg.evaluate(OFF)
            if off: fails.append(f"{w}: off the right edge: {off}")
            pg.screenshot(path=str(SHOTS / f"site-{w}-house.png"))
            acc = pg.evaluate(ACCESS)
            if acc["noname"]: fails.append(f"{w}: controls with no name: {acc['noname']}")
            if acc["label"]: fails.append(f"{w}: the 3D's label doesn't say where you are: {acc['label']!r}")
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
            pg.fill("#r3d-dp-measure [data-measure]", "123"); pg.wait_for_timeout(1200)
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
                want = ["hall", "livstand", "landing", "livstand", "hall"]
                got = [v for i, v in enumerate(wk["seen"]) if i == 0 or v != wk["seen"][i - 1]]
                if got != want or wk["top"] < 255: fails.append(f"{w}: the walk into the living room went {got}, its feet up to {wk['top']} (want {want}, 260); legs {wk['legs']}")
                pg.screenshot(path=str(SHOTS / f"site-{w}-walk.png"))
            if errs: fails.append(f"{w}: errors: {errs[:4]}")
            ctx.close()
        b.close()
    httpd.shutdown()
    for f in fails: print("FAIL ", f)
    print(f"site check: the front door at 393 and 1920, opens on the house, its {photos} photo sets after, every control named, Measure keeps a number, a piece resized from a tap, the figure dropped in, a double-tap there, a walk into the living room and up its stairs, {len(fails)} failed; screenshots in _shots/")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
