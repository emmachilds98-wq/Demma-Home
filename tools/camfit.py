"""Demma's Home V1.40 (docs/UPGRADE_REVIEW.md Next 2): stand the 3D's camera where each of the client's photos was taken. For each pair in
compare.PAIRS it nudges the eye (x, y, z), the aim (turn, tilt) and the lens one at a time, keeping a change when the 3D's edges sit closer
to the photo's (the F-score of edges within 4 px each way, both pictures softened first), halving the steps each pass. It prints each
camera for compare.CAMS, where the comparison then stands; what still misses after that is the room's sizes, not the camera.

python3 tools/camfit.py [view ...]      (the site built first; about a minute and a half a view in a test browser)"""
import http.server, io, json, math, pathlib, socketserver, sys, threading
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src")); sys.path.insert(0, str(ROOT / "tools"))
import pw, localcdn, compare  # noqa: E402

SITE = ROOT / "_site"
STEP = dict(x=40.0, y=15.0, z=40.0, yaw=10.0, pitch=6.0, fov=8.0)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def edges(im, W, H):
    """The strongest 6% of each picture's brightness changes (softened first), its border left out (it reads as an edge in both)."""
    from PIL import ImageFilter
    import numpy as np
    g = np.asarray(im.convert("L").resize((W, H)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32)
    m = np.zeros_like(g)
    m[1:-1, 1:-1] = np.hypot(g[1:-1, 2:] - g[1:-1, :-2], g[2:, 1:-1] - g[:-2, 1:-1])
    m[:6], m[-6:], m[:, :6], m[:, -6:] = 0, 0, 0, 0
    return m > max(4.0, float(np.percentile(m, 94)))


def grow(m, r):
    import numpy as np
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


def score(P, P4, R):
    n = R.sum()
    if n < 50:
        return 0.0
    p = (R & P4).sum() / n
    r = (P & grow(R, 4)).sum() / max(1, P.sum())
    return 0.0 if p + r == 0 else 2 * p * r / (p + r)


def cam_of(c):
    yw, pt = math.radians(c["yaw"]), math.radians(c["pitch"])
    d = (math.sin(yw) * math.cos(pt), math.sin(pt), math.cos(yw) * math.cos(pt))   # room cm: yaw 0 looks to +z, 90 to +x
    eye = [c["x"], c["y"], c["z"]]
    return dict(eye=[round(v, 1) for v in eye], at=[round(eye[i] + d[i] * 200, 1) for i in range(3)], fov=round(c["fov"], 1))


def start_of(v):
    (ex, ey, ez), (ax, ay, az) = v["eye"], v["at"]
    dx, dy, dz = ax - ex, ay - ey, az - ez
    return dict(x=ex, y=ey, z=ez, yaw=math.degrees(math.atan2(dx, dz)), pitch=math.degrees(math.atan2(dy, math.hypot(dx, dz))), fov=v.get("fov", 70))


def main(only):
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageOps
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Quiet, directory=str(SITE))); httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    out = {}
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL)
        for view, photo in compare.PAIRS:
            if only and view not in only:
                continue
            ph = ImageOps.exif_transpose(Image.open(compare.IN / photo)).convert("RGB")
            W = 360; H = round(W * ph.height / ph.width)
            P = edges(ph, W, H); P4 = grow(P, 4)
            ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1, service_workers="block")
            pg = ctx.new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
            pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html?noao"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
            pg.evaluate("R3D.photos()"); pg.evaluate(f"R3D.set({{view: '{view}', tod: 'day'}})"); pg.wait_for_timeout(2500)
            pg.evaluate("document.querySelector('[data-rmode=\"stand\"]').click()"); pg.wait_for_timeout(2500)   # standing: nothing pulls the eye back into the room's box
            pg.evaluate("document.body.classList.add('bare'); document.querySelectorAll('.r3d-mini, .brand, .r3d-toast, .r3d-stick').forEach(e => e.style.visibility = 'hidden')")
            v = compare.CAMS.get(view) or pg.evaluate(f"(() => {{ const V = R3D._dbg.VIEWS['{view}']; return {{ eye: V.eye, at: V.at, fov: 70 }}; }})()")
            c = start_of(v)
            bx = pg.evaluate(f"R3D._dbg.VIEWS['{view}'].box")    # [x0, x1, y0, y1, z0, z1]: the eye stays in the room (or its doorway, 40 on) at a phone's height
            fy = -260.0 if bx[2] < -100 else 260.0 if bx[2] > 200 else 0.0   # its floor (the views' boxes start a little over it)
            ok = lambda t: bx[0] - 40 <= t["x"] <= bx[1] + 40 and bx[4] - 40 <= t["z"] <= bx[5] + 40 and fy + 110 <= t["y"] <= fy + 190
            c["y"] = min(max(c["y"], fy + 110), fy + 190)

            def render(c):
                pg.evaluate("a => R3D.set({ aim: a })", cam_of(c)); pg.wait_for_timeout(350)
                return score(P, P4, edges(Image.open(io.BytesIO(pg.screenshot())), W, H))
            best = render(c); s0 = best; step = dict(STEP)
            for _ in range(4):                                # each step size until a pass finds nothing better (four at most), then half
                for _pass in range(4):
                    moved = False
                    for k in ("yaw", "pitch", "fov", "x", "z", "y"):
                        for sgn in (1, -1):
                            t = dict(c); t[k] += sgn * step[k]
                            if (k == "fov" and not 35 <= t[k] <= 100) or not ok(t):
                                continue
                            s = render(t)
                            if s > best:
                                best, c, moved = s, t, True
                                break
                    if not moved:
                        break
                step = {k: v / 2 for k, v in step.items()}
            out[view] = cam_of(c); render(c)
            r = Image.open(io.BytesIO(pg.screenshot())).convert("RGB"); ctx.close()
            import numpy as np
            sm = ph.resize((W, H)); ov = np.asarray(sm).copy(); ov[edges(r, W, H)] = (230, 30, 30)   # the fitted 3D's edges over the photo
            row = Image.new("RGB", (W * 2 + 10, H), "white"); row.paste(sm, (0, 0)); row.paste(Image.fromarray(ov), (W + 10, 0))
            (ROOT / "_shots").mkdir(exist_ok=True); row.save(ROOT / "_shots" / f"camfit_{view}.jpg", quality=85)
            print(f"{view}: edges matched {s0:.3f} -> {best:.3f}  {json.dumps(out[view])}", flush=True)
        b.close()
    httpd.shutdown()
    print(json.dumps(out, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
