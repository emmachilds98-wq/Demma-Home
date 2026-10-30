"""Demma's Home V1.2: the front door's check, on the built site (index.html, the old design back). At the iPhone 15 Pro's size (393 × 852,
touch) and a desktop's (1920 × 1080): no script errors, nothing off the right edge, it opens on the whole house and the brand says so, the
floors pill is one row on the phone, the photos arrive after the first picture (V1.9), and the dock's Measure lists every open size, keeps a number typed in and counts it. Screenshots go
to _shots/ (the workflow keeps them with the run).

python3 tools/check_site.py [site dir]      exits non-zero on any failure; THREE_LOCAL serves three.js where the CDN is blocked"""
import http.server, json, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw, localcdn  # noqa: E402

SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site").resolve()
SHOTS = ROOT / "_shots"
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
            pg.on("console", lambda m: errs.append(m.text[:300]) if m.type == "error" and "favicon" not in m.text and "fonts.g" not in m.text else None)
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
            if errs: fails.append(f"{w}: errors: {errs[:4]}")
            ctx.close()
        b.close()
    httpd.shutdown()
    for f in fails: print("FAIL ", f)
    print(f"site check: the front door at 393 and 1920, opens on the house, its {photos} photo sets after, Measure keeps a number, {len(fails)} failed; screenshots in _shots/")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
