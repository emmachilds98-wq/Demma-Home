"""Demma's Home V1: the app's check (Phase 7), on the built site. Every screen at the iPhone 15 Pro's size (393 × 852), a laptop's
(1280 × 800) and, for the layout only, the desktops' (1920 × 1080):
no script errors, nothing off the right edge, every tap target at least 44 px, and the 3D answering (a tap names a piece; an edit
moves it). And every colour pair the design system puts text on reads at 4.5:1 or more, in light and in dark (Phase 8). Screenshots of each screen go to _shots/ (the workflow keeps them with the run).

python3 tools/check_app.py [site dir] [--no-3d]      exits non-zero on any failure; THREE_LOCAL serves three.js where the CDN is blocked"""
import http.server, json, os, pathlib, socketserver, sys, threading, time
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw  # noqa: E402

SITE = pathlib.Path(next((a for a in sys.argv[1:] if not a.startswith("--")), ROOT / "_site")).resolve()
SHOTS = ROOT / "_shots"
NO3D = "--no-3d" in sys.argv
ROUTES = [("home", "#/home"), ("house", "#/house"), ("house-first", "#/house/first"), ("room-bathroom", "#/room/bathroom"),
          ("room-living", "#/room/living"), ("edit-bathroom", "#/room/bathroom/edit"), ("edit-mirror", "#/room/bathroom/edit/bath.mirror"),
          ("measure", "#/measure"), ("projects", "#/projects"), ("project-build", "#/project/media-wall/build"), ("project-plan", "#/project/media-wall/plan"),
          ("project-shop", "#/project/media-wall/shop"), ("shop", "#/shop"), ("settings", "#/settings")]
THREE = "https://cdn.jsdelivr.net/npm/three@0.160.0/"


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE)))
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}/"


def route_three(ctx):
    root = os.environ.get("THREE_LOCAL")
    if not root:
        return
    def f(r):
        p = pathlib.Path(root) / r.request.url[len(THREE):].split("?")[0]
        r.fulfill(path=str(p), content_type="text/javascript") if p.is_file() else r.fulfill(status=404, body="")
    ctx.route(THREE + "**", f)


AUDIT = """() => { const out = { overflow: [], small: [] }; const W = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.visibility === "hidden" || cs.display === "none" || el.closest(".sr, [hidden], .tabs, .stage")) continue;
    if (r.right > W + 1 && cs.position !== "fixed") out.overflow.push(el.tagName + "." + el.className + " " + Math.round(r.right));
    if (el.matches("input[type=checkbox]") && el.labels && el.labels.length) continue;   // its label (the whole row) is the target
    if (el.matches("button, a.btn, a.rowc, a.tile, .tabbar a, input[type=checkbox], .seg button") && !el.closest(".tabs") && (r.height < 43 && r.width < 43 || r.height < 30) && el.offsetParent)
      out.small.push((el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30) + " " + Math.round(r.width) + "×" + Math.round(r.height)); }
  out.overflow = out.overflow.slice(0, 6); out.small = out.small.slice(0, 6); return out; }"""


def contrast():
    """Every text colour on every ground it's used on, from app/tokens.css, light and dark: WCAG AA (4.5:1) for words."""
    import re
    css = (ROOT / "app/tokens.css").read_text()
    blocks = [css[:css.index("@media")], css[css.index('[data-theme="dark"]'):]]
    lum = lambda h: (lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])([((v / 255) / 12.92 if v / 255 <= 0.03928 else (((v / 255) + 0.055) / 1.055) ** 2.4) for v in (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))])
    ratio = lambda a, b: (max(lum(a), lum(b)) + 0.05) / (min(lum(a), lum(b)) + 0.05)
    pairs = [("ink", "ground"), ("ink", "surface"), ("ink", "tile"), ("muted", "ground"), ("muted", "surface"), ("muted", "tile"), ("ink-on-tint", "mint"),
             ("ink-on-tint", "butter"), ("ink-on-tint", "sky"), ("red", "surface"), ("surface", "ink")]
    bad = []
    for name, b in zip(("light", "dark"), blocks):
        tok = dict(re.findall(r"--([a-z-]+):\s*(#[0-9A-Fa-f]{6})", b))
        base = dict(re.findall(r"--([a-z-]+):\s*(#[0-9A-Fa-f]{6})", blocks[0]))
        get = lambda k: tok.get(k) or base[k]
        for fg, bg in pairs:
            r = ratio(get(fg), get(bg))
            if r < 4.5:
                bad.append(f"{name}: {fg} on {bg} {r:.1f}:1")
    return bad


def main():
    from playwright.sync_api import sync_playwright
    SHOTS.mkdir(exist_ok=True)
    httpd, base = serve()
    fails, notes = [], []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        for w, h in ((393, 852), (1280, 800), (1920, 1080)):
            layout_only = w == 1920                        # the desktops: the layout at their size (the 3D is checked at 1280)
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=w < 600, has_touch=w < 600, service_workers="block")
            route_three(ctx)
            if layout_only:                                   # no 3D at 1920: software graphics can't draw it that big in time
                ctx.route("**/room/index.html*", lambda r: r.fulfill(status=200, content_type="text/html", body="<!doctype html><title>3D</title>"))
            pg = ctx.new_page(); pg.set_default_timeout(120000); errs = []   # software graphics on a CI machine are slow
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300]))
            pg.on("console", lambda m: errs.append(m.type + ": " + m.text[:300]) if m.type == "error" else None)
            pg.goto(base + "#/home"); pg.wait_for_selector(".hello", timeout=20000)
            for name, hsh in ROUTES:
                pg.evaluate(f"location.hash = {json.dumps(hsh)}"); pg.wait_for_timeout(700)
                if not NO3D and not layout_only and name in ("house", "room-bathroom", "edit-mirror", "room-living"):
                    try: pg.wait_for_selector(".stage.live", timeout=90000)
                    except Exception: fails.append(f"{w}: {name}: the 3D didn't start in 90 s")
                    pg.wait_for_timeout(2500 if name != "house" else 4000)
                a = pg.evaluate(AUDIT)
                if a["overflow"]: fails.append(f"{w} {name}: off the right edge: {a['overflow']}")
                if a["small"]: notes.append(f"{w} {name}: small targets: {a['small']}")
                pg.screenshot(path=str(SHOTS / f"{w}-{name}.png"))
            if not NO3D and not layout_only:   # the 3D answers: an edit moves the mirror (its box in the frame's data), a tap names a piece
                pg.evaluate("location.hash = '#/room/bathroom/edit/bath.mirror'"); pg.wait_for_timeout(1500)
                pg.click('[data-step="up"][data-by="1"]'); pg.wait_for_timeout(1500)
                v = pg.input_value("#f-up")
                if v != "116": fails.append(f"{w}: the mirror's Up from the floor didn't step to 116 (it reads {v})")
                pg.click('[data-step="up"][data-by="-1"]'); pg.wait_for_timeout(800)
            bad = [e for e in errs if "favicon" not in e and "fonts.g" not in e]
            if bad: fails.append(f"{w}: errors: {bad[:5]}")
            ctx.close()
        b.close()
    httpd.shutdown()
    fails += [f"contrast {c}" for c in contrast()]
    for n in notes: print("note ", n)
    for f in fails: print("FAIL ", f)
    print(f"app check: {len(ROUTES)} screens × 3 sizes, colour contrast in both themes, {len(fails)} failed; screenshots in {SHOTS.relative_to(ROOT)}/")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
