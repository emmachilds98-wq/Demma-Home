"""Demma's Home V1 (Phase 4): a still of every place, so a screen shows a picture at once and the 3D fades in over it.

python3 tools/stills.py [site dir]     -> <site>/stills/<place>.webp (960 × 720): the whole house, each floor, each room

Drives the built 3D page (room/index.html?embed) headless, the same messages the app sends (room3d.js, the bridge at its end).
Software graphics, so a minute or two for the lot; tools/build.py --stills runs it, and the workflow does on every push."""
import http.server, json, os, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src")); sys.path.insert(0, str(ROOT / "tools"))
import pw  # noqa: E402

SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("DEMMA_SITE") or ROOT / "_site").resolve()
PLACES = [("house", dict(house=True, floor="all", fview="angle")), ("floor_first", dict(house=True, floor="first", fview="angle")),
          ("floor_ground", dict(house=True, floor="ground", fview="angle")), ("floor_lower", dict(house=True, floor="lower", fview="angle")),
          ("living", dict(room="living", mode="above"))]
SETTLE = """() => { const c = R3D._dbg.camera.position, k = c.x.toFixed(4) + c.y.toFixed(4) + c.z.toFixed(4);
  window.__n = window.__k === k ? (window.__n || 0) + 1 : 0; window.__k = k; return window.__n >= 3; }"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image
    import check_app
    house = json.loads((SITE / "data/house.json").read_text())
    rooms = [(r["id"], dict(room=r["id"], mode="in")) for r in house["rooms"] if r["id"] != "living" and r["w"] * r["d"] >= 3000]
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/"
    out = SITE / "stills"; out.mkdir(exist_ok=True)
    tmp = out / "_shot.png"
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        ctx = b.new_context(viewport={"width": 960, "height": 720}, device_scale_factor=1)
        check_app.route_three(ctx)
        pg = ctx.new_page()
        pg.goto(base + "room/index.html?embed")
        pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
        for name, msg in PLACES + rooms:
            pg.evaluate("m => window.postMessage(Object.assign({src: 'demma', cmd: 'go', instant: true}, m), '*')", msg)
            pg.wait_for_timeout(1200)
            try: pg.wait_for_function(SETTLE, polling=400, timeout=30000)
            except Exception: pass
            pg.wait_for_timeout(1500)
            pg.screenshot(path=str(tmp))
            Image.open(tmp).convert("RGB").save(out / f"{name}.webp", "WEBP", quality=78, method=5)
            print("still", name, flush=True)
        b.close()
    tmp.unlink(missing_ok=True)
    httpd.shutdown()


if __name__ == "__main__":
    main()
