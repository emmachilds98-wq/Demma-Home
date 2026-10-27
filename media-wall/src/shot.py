"""Rasterise SVG/HTML files to PNG with headless Chromium.
python3 shot.py in.svg out.png width height [scale]
From Python: shots([(in, out, w, h, scale), ...]) renders many with one browser."""
import sys, glob, pathlib
from playwright.sync_api import sync_playwright


def _launch(p):
    return __import__("pw").launch(p)


def shots(jobs):
    with sync_playwright() as p:
        b = _launch(p)
        for job in jobs:
            src, out, w, h, scale = job[:5]
            clear = len(job) > 5 and job[5]       # a transparent overlay (v13.2)
            pg = b.new_page(viewport={"width": int(w), "height": int(h)}, device_scale_factor=float(scale))
            pg.goto(pathlib.Path(src).resolve().as_uri())
            pg.wait_for_timeout(300)
            pg.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": int(w), "height": int(h)}, omit_background=bool(clear))
            pg.close()
            print(out)
        b.close()


if __name__ == "__main__":
    a = sys.argv[1:]
    shots([(a[0], a[1], int(a[2]), int(a[3]), float(a[4]) if len(a) > 4 else 1.5)])
