"""Demma's Home V1.34 (docs/UPGRADE_REVIEW.md U9, 4.2): each room's view beside the client's photo it was modelled from, at the photo's
shape, and the 3D's edges (red) laid over the photo: where a size is wrong, its lines don't meet. Each round's accuracy proof, as the
gallery is the look's (house/evidence/compare_*.jpg were made by hand before).

python3 tools/compare.py [site dir]      writes _shots/compare/<view>.jpg and _shots/compare.jpg (all on one sheet); THREE_LOCAL as
check_site.py. The views' cameras are where the photos were taken only roughly (VIEWS in room3d.js): move a view's eye to its photo's
spot and the overlay says how close the room is. V1.40: CAMS, from tools/camfit.py, stands each view where its photo was taken. Built pictures only: nothing here is committed (the photos are already in the repo)."""
import http.server, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
import pw, localcdn  # noqa: E402

SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site").resolve()
OUT = ROOT / "_shots" / "compare"
IN = ROOT / "media-wall/inputs"
# the view and the photo it was made from (room3d.js VIEWS' notes, house/EVIDENCE.md)
PAIRS = [("kitchen", "photo_kitchen_wide_30oct.jpg"), ("bath", "photo_bathroom_from_door_27oct.jpg"), ("hall", "photo_hall_to_living_25oct.jpg"),
         ("office", "photo_office_wide_25oct.jpg"), ("master", "photo_master_bed_25oct.jpg"), ("landing", "photo_landing_from_office_26oct.jpg"),
         ("wc", "photo_wc_25oct.jpg"), ("front", "photo_house_front_25oct.png"), ("rear", "photo_house_rear_24oct.jpg")]
W = 720
# V1.40 (Next 2): where each photo was taken, found by tools/camfit.py (the 3D's edges fitted to the photo's): {view: {eye, at, fov}}
CAMS = {"office": {"eye": [263.0, 432.5, 282], "at": [369.3, 390.5, 446.1], "fov": 75.0}, "landing": {"eye": [330, 443.8, 220.0], "at": [330.9, 380.2, 30.4], "fov": 70}, "wc": {"eye": [415.0, -96.9, -132.0], "at": [423.6, -140.0, -327.1], "fov": 70}, "kitchen": {"eye": [182.0, -105.0, -300], "at": [30.9, -138.0, -426.8], "fov": 78.0}, "hall": {"eye": [415.0, 153.8, 405.0], "at": [416.1, 101.4, 212.0], "fov": 75},
        "bath": {"eye": [307.4, 378.9, 26.0], "at": [349.5, 422.4, -164.6], "fov": 90.9}, "master": {"eye": [268, 371.4, 240], "at": [91.9, 298.6, 300.8], "fov": 74}}   # the fits that read true (the hall's in part); V2.90 (N34) the bathroom (0.42) and the master (0.41) from hand starts (camfit.START)
# V2.90 (N34): the doors open in each photo (shut in the 3D, the bathroom's photo is all door)
OPEN = {"bath": ["door.bath_door"]}
# V2.75 (N21): the outside, the whole house with the street and the gardens on, seen from where the agent's photos were taken (by eye)
OUTSIDE = {"front": {"eye": [-20, 190, 1150], "at": [300, 300, 450], "fov": 72}, "rear": {"eye": [180, -110, -1537], "at": [180, -60, -337], "fov": 61}}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageFilter, ImageOps, ImageDraw
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    sheets = []
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        for view, photo in PAIRS:
            if not (IN / photo).exists():
                print("no photo", photo); continue
            ph = ImageOps.exif_transpose(Image.open(IN / photo)).convert("RGB")
            h = round(W * ph.height / ph.width); ph = ph.resize((W, h))
            ctx = b.new_context(viewport={"width": W, "height": h}, device_scale_factor=1, service_workers="block")
            pg = ctx.new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
            pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html?noao"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
            pg.evaluate("R3D.photos()"); pg.evaluate(f"R3D.set({{view: '{'house' if view in OUTSIDE else view}', tod: 'day', hstreet: true, hgarden: true}})"); pg.wait_for_timeout(3500)
            for k in OPEN.get(view, []):
                pg.evaluate("k => R3D._dbg.swingDoor(k, true)", k); pg.wait_for_timeout(1500)
            if view in OUTSIDE:
                pg.evaluate("a => { R3D.set({ aim: Object.assign({ above: true }, a) }); const c = R3D._dbg.camera; c.clearViewOffset(); c.updateProjectionMatrix(); R3D._dbg.scene.traverse(o => { if (o.userData.hlabel) o.visible = false; }); }", OUTSIDE[view]); pg.wait_for_timeout(2500)
            elif view in CAMS:                                  # V1.40: standing where the photo was taken (standing: not pulled back into the room's box)
                pg.evaluate("document.querySelector('[data-rmode=\"stand\"]').click()"); pg.wait_for_timeout(2500)
                pg.evaluate("a => R3D.set({ aim: a })", CAMS[view]); pg.wait_for_timeout(1500)
            pg.evaluate("document.body.classList.add('bare'); document.querySelectorAll('.r3d-mini, .brand, .r3d-toast, .r3d-stick').forEach(e => e.style.visibility = 'hidden')")
            pg.wait_for_timeout(600)
            shot = OUT / f"{view}_3d.png"; pg.screenshot(path=str(shot)); ctx.close()
            r = Image.open(shot).convert("RGB")
            edges = r.convert("L").filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
            over = Image.blend(ph, Image.new("RGB", ph.size, "white"), 0.25); over.paste(Image.new("RGB", ph.size, (230, 30, 30)), mask=edges)
            row = Image.new("RGB", (W * 3 + 20, h + 30), "white"); row.paste(ph, (0, 30)); row.paste(r, (W + 10, 30)); row.paste(over, (2 * W + 20, 30))
            ImageDraw.Draw(row).text((6, 8), f"{view}: the photo · the 3D · the 3D's edges over the photo", fill="black")
            row.save(OUT / f"{view}.jpg", quality=84); sheets.append(row); print("compare", view, photo)
        b.close()
    httpd.shutdown()
    if sheets:
        sheet = Image.new("RGB", (sheets[0].width, sum(s.height for s in sheets)), "white"); y = 0
        for s in sheets:
            sheet.paste(s, (0, y)); y += s.height
        sheet.save(ROOT / "_shots" / "compare.jpg", quality=80)
    print(f"compare: {len(sheets)} views beside their photos in _shots/compare.jpg")
    return 0


if __name__ == "__main__":
    sys.exit(main())
