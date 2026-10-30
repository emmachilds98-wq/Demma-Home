"""Demma's Home V1.13 (docs/QUALITY_PLAN.md Q4): every room by day in HD on one sheet, after the photos land: each round's proof and
the client's quick look. The whole house, the living room, then each of the house's rooms from its own view (In it).

python3 tools/gallery.py [site dir] [--evening]      writes _shots/gallery.jpg (gallery_evening.jpg), each picture in _shots/gallery/;
THREE_LOCAL as check_site.py"""
import http.server, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw, localcdn  # noqa: E402

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
TOD = "evening" if "--evening" in sys.argv else "day"   # V1.14: by evening too (the rooms' own lights)
SITE = pathlib.Path(ARGS[0] if ARGS else ROOT / "_site").resolve()
OUT = ROOT / "_shots" / "gallery"
W, H, COLS = 1280, 800, 4


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageDraw
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    shots = []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        pg = b.new_context(viewport={"width": W, "height": H}, service_workers="block").new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
        pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
        pg.evaluate("() => R3D.photos()"); pg.wait_for_timeout(8000)                      # the photos decoded and on the card
        views = pg.evaluate("() => { const V = R3D._dbg.VIEWS; return [['house', 'The whole house'], ['room', 'The living room']]"
                            ".concat(Object.entries(V).filter(([k, v]) => v.box).map(([k, v]) => [k, v.label || k])); }")
        pg.add_style_tag(content=".r3d-dock, .r3d-mini, .r3d-planbar, .r3d-stickers, header, .brand, .topbar { visibility: hidden !important; }")
        for k, name in views:
            pg.evaluate(f"() => R3D.set({{ view: '{k}', tod: '{TOD}', quality: 'hd' }})"); pg.wait_for_timeout(5000)
            f = OUT / f"{k}{'_eve' if TOD == 'evening' else ''}.png"; pg.screenshot(path=str(f)); shots.append((f, pg.evaluate("() => (document.getElementById('brand-place') || {}).textContent") or name))
            print("shot", k, flush=True)
        b.close()
    httpd.shutdown()
    rows = -(-len(shots) // COLS)
    sheet = Image.new("RGB", (COLS * W // 2, rows * (H // 2 + 28)), "#151a16"); d = ImageDraw.Draw(sheet)
    for i, (f, name) in enumerate(shots):
        x, y = (i % COLS) * W // 2, (i // COLS) * (H // 2 + 28)
        sheet.paste(Image.open(f).convert("RGB").resize((W // 2, H // 2), Image.LANCZOS), (x, y + 28)); d.text((x + 8, y + 8), name, fill="#f2efe6")
    name = "gallery_evening.jpg" if TOD == "evening" else "gallery.jpg"
    sheet.save(ROOT / "_shots" / name, quality=88)
    print(f"gallery: {len(shots)} views by {TOD} in HD, _shots/{name}")


if __name__ == "__main__":
    main()
