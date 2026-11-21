"""Demma's Home V1.13 (docs/QUALITY_PLAN.md Q4): every room by day in HD on one sheet, after the photos land: each round's proof and
the client's quick look. The whole house, the living room, then each of the house's rooms from its own view (In it).

python3 tools/gallery.py [site dir] [--evening]      writes _shots/gallery.jpg (gallery_evening.jpg), each picture in _shots/gallery/;
python3 tools/gallery.py [site dir] --catalogue [k,k]  V3.02 (N45): each of Add a piece's pieces (or those named) on its own in the garage,
                                                      from its front: _shots/catalogue.jpg; THREE_LOCAL as check_site.py
python3 tools/gallery.py [site dir] --diff REF [--views k,k]   N190: the same views from REF (main's build) and the site, compared pixel by
                                                      pixel: a line a view (the share of pixels that moved), _shots/diff/<view>.jpg (REF | site | where)"""
import http.server, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw, localcdn  # noqa: E402

ARGS = [a for i, a in enumerate(sys.argv[1:]) if not a.startswith("--") and sys.argv[i] not in ("--diff", "--views")]
TOD = "evening" if "--evening" in sys.argv else "day"   # V1.14: by evening too (the rooms' own lights)
SITE = pathlib.Path(ARGS[0] if ARGS else ROOT / "_site").resolve()
OUT = ROOT / "_shots" / "gallery"
W, H, COLS = 1280, 800, 4


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


# V3.02 (N45): a piece added in the middle of the garage, seen from the garage's corner in front of it
CAT = """async (k) => { const D = R3D._dbg, ds = window.DemmaStore, sl = ms => new Promise(r => setTimeout(r, ms)), r = D.H3.rooms.garage, id = 'add.' + k.replace(/[^a-z0-9]/g, '').slice(0, 12);
  const gone = async () => { await Promise.all(Object.entries(ds.rows('edits')).filter(([, v]) => v && v.field === 'add').map(([q]) => ds.del('edits', q))); };
  await gone(); await ds.put('edits', id + '~add', { item: id, field: 'add', value: k, room: 'garage', x: (r[0] + r[1]) / 2, z: (r[2] + r[3]) / 2 - 20, y: r[4] });
  for (let i = 0; i < 200 && !D.PICK.ground.some(p => p.id === id); i++) await sl(150);
  const it = D.H3.items[id]; if (!it) return 'not added';
  const b = it.b, o = it.ax === 'z' ? 0 : 2, lo = b[o] - r[o], hi = r[o + 1] - b[o + 3], front = hi < lo ? -1 : 1, M = 0.01;
  const ca = [r[0] + 12, r[1] - 12], cb = [r[2] + 12, r[3] - 12], mid = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2];
  const at = ca.flatMap(x => cb.map(z => [x, z])).filter(([x, z]) => ((o ? z : x) - (o ? mid[2] : mid[0])) * front > 0)
    .sort((p, q) => Math.hypot(q[0] - mid[0], q[1] - mid[2]) - Math.hypot(p[0] - mid[0], p[1] - mid[2]))[0];
  const dx = at[0] - mid[0], dz = at[1] - mid[2], L = Math.hypot(dx, dz), f = Math.min(1, (Math.max(b[3] - b[0], b[4] - b[1], b[5] - b[2]) * 1.3 + 70) / L);
  D.controls.target.set(-mid[0] * M, mid[1] * M, mid[2] * M); D.camera.position.set(-(mid[0] + dx * f) * M, Math.min(b[4] + 40, r[4] + 200) * M, (mid[2] + dz * f) * M);
  D.controls.update(); await sl(2500); return 'ok'; }"""


def catalogue(only):
    import re
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageDraw
    keys = [k for k in re.findall(r'^  (\w+): \{ n: "', (ROOT / "media-wall/src/room3d/08_house_catalogue.js").read_text(), re.M) if not only or k in only]
    out = ROOT / "_shots" / "catalogue"; out.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    shots = []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        pg = b.new_context(viewport={"width": 900, "height": 700}, service_workers="block").new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
        pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
        pg.add_style_tag(content=".r3d-dock, .r3d-mini, .r3d-planbar, .r3d-stickers, header, .brand, .topbar, #r3d-act, .r3d-me { visibility: hidden !important; }")
        pg.evaluate("() => R3D.set({ view: 'garage', tod: 'day', quality: 'hd' })"); pg.wait_for_timeout(6000)
        for k in keys:
            res = pg.evaluate(CAT, k); f = out / f"{k}.jpg"; pg.screenshot(path=str(f), type="jpeg", quality=88); shots.append((f, k)); print(k, res, flush=True)
        b.close()
    httpd.shutdown()
    w, h, cols = 450, 350, 5
    sheet = Image.new("RGB", (cols * w, -(-len(shots) // cols) * (h + 22)), "#151a16"); d = ImageDraw.Draw(sheet)
    for i, (f, k) in enumerate(shots):
        x, y = (i % cols) * w, (i // cols) * (h + 22); sheet.paste(Image.open(f).convert("RGB").resize((w, h), Image.LANCZOS), (x, y + 22)); d.text((x + 6, y + 5), k, fill="#f2efe6")
    sheet.save(ROOT / "_shots" / "catalogue.jpg", quality=88)
    print(f"catalogue: {len(shots)} pieces, _shots/catalogue.jpg")


def shoot(site, out, only=None):
    """Each fixed view of `site` by TOD in HD, a PNG each in `out`: [(file, name)]."""
    from playwright.sync_api import sync_playwright
    out.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(site))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    shots = []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        pg = b.new_context(viewport={"width": W, "height": H}, service_workers="block").new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
        pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
        pg.evaluate("() => R3D.photos()"); pg.wait_for_timeout(8000)                      # the photos decoded and on the card
        pg.evaluate("""async () => { let n = -1, k = 0; for (let i = 0; i < 90 && k < 3; i++) { await new Promise(r => setTimeout(r, 1000));   // N196: till no more land (a KTX2's transcode is slow here)
          const T = new Set(); R3D._dbg.scene.traverse(o => { for (const m of [].concat(o.material || [])) for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t && t.image && t.image.width > 4) T.add(t); });
          k = T.size === n ? k + 1 : 0; n = T.size; } }""")
        views = pg.evaluate("() => { const V = R3D._dbg.VIEWS; return [['house', 'The whole house'], ['room', 'The living room']]"
                            ".concat(Object.entries(V).filter(([k, v]) => v.box).map(([k, v]) => [k, v.label || k])); }")
        pg.add_style_tag(content=".r3d-dock, .r3d-mini, .r3d-planbar, .r3d-stickers, header, .brand, .topbar { visibility: hidden !important; }")
        for k, name in views:
            if only and k not in only:
                continue
            pg.evaluate(f"() => R3D.set({{ view: '{k}', tod: '{TOD}', quality: 'hd' }})"); pg.wait_for_timeout(5000)
            f = out / f"{k}{'_eve' if TOD == 'evening' else ''}.png"; pg.screenshot(path=str(f)); shots.append((f, pg.evaluate("() => (document.getElementById('brand-place') || {}).textContent") or name))
            print("shot", k, flush=True)
        b.close()
    httpd.shutdown()
    return shots


def diff(ref, only):
    """N190: a code-only change should move no view; a looks change shows where it moved. A pixel 'moved' if any channel is off by more
    than 8 (the soft shadows' and GTAO's noise stays under it)."""
    import numpy as np
    from PIL import Image
    a, b, out = shoot(ref, OUT.parent / "ref", only), shoot(SITE, OUT, only), OUT.parent / "diff"; out.mkdir(parents=True, exist_ok=True)
    moved = 0
    for (fa, name), (fb, _) in zip(a, b):
        x, y = (np.asarray(Image.open(f).convert("RGB")).astype(int) for f in (fa, fb))
        m = np.abs(x - y).max(2) > 8; share = m.mean() * 100; moved += share > 0.5
        where = np.where(m[..., None], [255, 40, 160], y // 3).astype("uint8")
        Image.fromarray(np.hstack([x, y, where]).astype("uint8")).resize((W * 3 // 2, H // 2)).save(out / f"{fa.stem}.jpg", quality=85)
        print(f"{fa.stem}: {share:.2f}% moved{'' if share <= 0.5 else '  <-'}")
    print(f"pixels: {len(a)} views, {moved} moved (over 0.5%), _shots/diff/")
    return moved


def main():
    from PIL import Image, ImageDraw
    shots = shoot(SITE, OUT)
    rows = -(-len(shots) // COLS)
    sheet = Image.new("RGB", (COLS * W // 2, rows * (H // 2 + 28)), "#151a16"); d = ImageDraw.Draw(sheet)
    for i, (f, name) in enumerate(shots):
        x, y = (i % COLS) * W // 2, (i // COLS) * (H // 2 + 28)
        sheet.paste(Image.open(f).convert("RGB").resize((W // 2, H // 2), Image.LANCZOS), (x, y + 28)); d.text((x + 8, y + 8), name, fill="#f2efe6")
    name = "gallery_evening.jpg" if TOD == "evening" else "gallery.jpg"
    sheet.save(ROOT / "_shots" / name, quality=88)
    print(f"gallery: {len(shots)} views by {TOD} in HD, _shots/{name}")


if __name__ == "__main__":
    if "--diff" in sys.argv:
        only = sys.argv[sys.argv.index("--views") + 1].split(",") if "--views" in sys.argv else None
        sys.exit(1 if diff(pathlib.Path(sys.argv[sys.argv.index("--diff") + 1]).resolve(), only) else 0)
    if "--catalogue" in sys.argv:
        catalogue([k for a in ARGS[1:] for k in a.split(",")])
    else:
        main()
