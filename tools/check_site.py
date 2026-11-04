"""Demma's Home V1.2: the front door's check, on the built site (index.html, the old design back). At the iPhone 15 Pro's size (393 × 852,
touch) and a desktop's (1920 × 1080): no script errors, nothing off the right edge, it opens on the whole house and the brand says so, the
floors pill is one row on the phone, the photos arrive after the first picture (V1.9), a walk goes from the hall into the living room, up its stairs and back (V1.38), and the dock's Measure lists every open size, keeps a number typed in and counts it. Screenshots go
to _shots/ (the workflow keeps them with the run).

python3 tools/check_site.py [site dir]      exits non-zero on any failure; THREE_LOCAL serves three.js where the CDN is blocked"""
import http.server, json, pathlib, socketserver, sys, threading
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
  R3D.set({ view: "hall" }); await sl(1500); document.querySelector('[data-rmode="stand"]').click(); await sl(2500);
  await go(357, -100, 60, () => at()[1] < -60); await go(437, -100, 30, () => at()[0] > 432); await go(437, -60, 10, () => at()[1] > -62);
  await go(437, 600, 40, () => D.WALK.feet > 255 && at()[1] > 215); const top = D.WALK.feet;
  await go(330, 230, 12, () => at()[0] < 340); await go(437, 230, 12, () => at()[0] > 432); await go(437, -300, 40, () => at()[1] < -70);
  await go(357, -10, 20, () => at()[0] < 362); await go(357, 400, 30, () => at()[1] > 150);
  return { seen, top: Math.round(top), end: D.S.view }; }"""
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
            if phone:                                           # V1.38: walk into the living room, up to the landing and back out (the small screen: quicker frames)
                pg.click("#r3d-dt-measure"); pg.wait_for_timeout(500)
                wk = pg.evaluate(WALK)
                want = ["hall", "livstand", "landing", "livstand", "hall"]
                got = [v for i, v in enumerate(wk["seen"]) if i == 0 or v != wk["seen"][i - 1]]
                if got != want or wk["top"] < 255: fails.append(f"{w}: the walk into the living room went {got}, its feet up to {wk['top']} (want {want}, 260)")
                pg.screenshot(path=str(SHOTS / f"site-{w}-walk.png"))
            if errs: fails.append(f"{w}: errors: {errs[:4]}")
            ctx.close()
        b.close()
    httpd.shutdown()
    for f in fails: print("FAIL ", f)
    print(f"site check: the front door at 393 and 1920, opens on the house, its {photos} photo sets after, Measure keeps a number, a walk into the living room and up its stairs, {len(fails)} failed; screenshots in _shots/")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
