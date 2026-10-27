"""Builds every render and diagram image the plan, the out/ folder and the viewer use (v13).
python3 make_images.py          -> SVGs here, PNGs for the PDF here, HD PNGs in ../out, viewer JPGs in art/
python3 make_images.py renders  -> the renders only (skips the plan diagrams)
"""
import sys
import pathlib, re
from PIL import Image, ImageDraw, ImageFont
import render as R, shot
from build_doc import VERSION, LABEL   # v30: the HD renders carry the plan's version (they were typed in by hand)
try:
    import diagrams as D
except Exception:      # diagrams mid-edit: renders can still be built with `renders`
    D = None

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / "out"
ART = HERE / "art"
FONT = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT_R = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
ART_SCALE = 1.5     # v13.5: the page's renders in HD, 3300 wide


def svgs():
    names = R.all_svgs()
    for n, s in names.items():
        (HERE / f"{n}.svg").write_text(s)
    return names


PLANS = [("house", "House plan - Decos and Cat6"), ("living", "Living room plan - L-sofa and dining"), ("seating", "Dining layouts - four, six and eight"), ("storage", "Storage options - what fits each space"), ("drawers", "Drawer layouts - where each drawer is and what goes in it")]


def main(diagrams=True):
    svgs()
    W, H, KW = R.W, R.H, R.W + R.KEYW
    jobs = [
        # for the PDF
        ("v13_join_key.svg", "render_v13_join_key_scene.png", W, H, 1.1),
        ("v13_join_clean.svg", "render_v13_join_clean.png", W, H, 1.1),
        ("v13_dining_four.svg", "render_v13_dining_four.png", W, H, 1.1),
        ("v13_dining_six.svg", "render_v13_dining_six.png", W, H, 1.1),
        # HD, labelled, for the client
        ("v13_join_clean.svg", OUT / f"Media wall {LABEL} - artisan oak - pale mint, table by the stairs (HD).png", W, H, 2.0),
        ("v13_join_key.svg", OUT / f"Media wall {LABEL} - artisan oak - numbered key (HD).png", KW, H, 2.0),
        ("v13_join_dims.svg", OUT / f"Media wall {LABEL} - artisan oak - heights and widths (HD).png", W, H, 2.0),
        # v33: the flip-top is set aside, so its two HD pictures are no longer made (its drawn views stay for the page's art)
        ("v13_side.svg", OUT / f"Media wall {LABEL} - the PC side wall (HD).png", W, H, 2.0),
        ("v13_side.svg", "render_v13_side.png", W, H, 1.1),
        ("v13_drawers.svg", "render_v13_drawers.png", W, H, 1.1),
        ("v13_drawers.svg", OUT / f"Media wall {LABEL} - every drawer out (HD).png", W, H, 2.0),
    ]
    for k in ("mint", "card_room", "sage", "treron", "deep"):
        jobs.append((f"v13_paint_{k}_joinery.svg", f"p_{k}.png", W, H, 0.5))
        for st, tag in (("joinery", "join"), ("four", "four"), ("six", "six"), ("side", "side"), ("drawers", "drawers")):
            jobs.append((f"v13_paint_{k}_{st}.svg", f"art_{tag}_{k}.png", W, H, ART_SCALE))
    for k in R.SKIRT_OPTIONS:
        jobs.append((f"v13_skirt_{k}.svg", f"skirt_{k}.png", W, H, 1.0))
    jobs.append(("v13_join_key.svg", "art_key_join.png", KW, H, ART_SCALE))
    for v in ("join", "four", "six", "drawers", "side"):      # v13.2: the light measurement overlays, transparent
        jobs.append((f"v13_m_{v}.svg", f"dims_{v}.png", W, H, ART_SCALE, True))
    # plan diagrams as images for out/ and the viewer
    for name, label in (PLANS if diagrams else []):
        fn = {"house": D.house, "living": D.living_plan, "seating": D.seating, "storage": D.storage, "drawers": D.drawer_layouts}[name]
        s = fn()
        vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', s)
        w, h = int(vb.group(1)), int(vb.group(2))
        (HERE / f"d_{name}.svg").write_text(s.replace('width="100%"', f'width="{w}"'))
        jobs.append((f"d_{name}.svg", OUT / f"{label}.png", w, h, 2.4))
    shot.shots([(HERE / j[0] if isinstance(j[0], str) else j[0], HERE / j[1] if isinstance(j[1], str) else j[1]) + tuple(j[2:]) for j in jobs])

    # paint grid: the oak version in four greens
    tiles = [("mint", "Your pale mint, #dbffc8 (chosen)"), ("card_room", "Farrow & Ball Card Room Green No. 79 (until v50)"),
             ("sage", "Little Greene Sage Green No. 80"), ("treron", "Farrow & Ball Treron No. 292")]
    tw, th, gap = 1100, 700, 24
    grid = Image.new("RGB", (2 * tw + 3 * gap, 2 * (th + 44) + 3 * gap), "#f4efe4")
    f = ImageFont.truetype(FONT, 26)
    for i, (k, lab) in enumerate(tiles):
        im = Image.open(HERE / f"p_{k}.png").convert("RGB").resize((tw, th))
        x, y = gap + (i % 2) * (tw + gap), gap + (i // 2) * (th + 44 + gap)
        grid.paste(im, (x, y + 44))
        ImageDraw.Draw(grid).text((x, y + 6), lab, font=f, fill="#14261d")
    grid.save(HERE / "paint_grid.png")
    grid.save(OUT / "Paint options - four greens.png")

    # skirting options: the same corner of the room in three skirting colours
    crop = (880, 1010, 1700, 1250)   # the breast and recess skirting, under the folded table (v12/v13 camera)
    labs = {"wall": "Pale mint, eggshell (recommended)", "green_smoke": "Green Smoke (darker edge)", "off_white": "Soft off-white"}
    cw, ch = crop[2] - crop[0], crop[3] - crop[1]
    strip = Image.new("RGB", (3 * cw + 4 * gap, ch + 60 + 2 * gap), "#f4efe4")
    for i, k in enumerate(R.SKIRT_OPTIONS):
        im = Image.open(HERE / f"skirt_{k}.png").convert("RGB").crop(crop)
        x = gap + i * (cw + gap)
        strip.paste(im, (x, gap + 52))
        ImageDraw.Draw(strip).text((x, gap + 8), labs[k], font=f, fill="#14261d")
    strip.save(HERE / "skirting_options.png")
    strip.save(OUT / "Skirting options with the pale mint.png")

    # viewer images, HD (v13.5): WebP at 1.5 x the render's 2200 width keeps each one near 100 KB
    ART.mkdir(exist_ok=True)
    for p in HERE.glob("art_*.png"):
        Image.open(p).convert("RGB").save(ART / (p.stem.replace("art_key_", "key_") + ".webp"), "WEBP", quality=86, method=6)
        p.unlink()
    for p in HERE.glob("dims_*.png"):
        Image.open(p).convert("RGBA").save(ART / (p.stem + ".webp"), "WEBP", quality=90, method=6)
        p.unlink()
    for p in list(HERE.glob("p_*.png")) + list(HERE.glob("skirt_*.png")):
        p.unlink()
    print("images ok")


if __name__ == "__main__":
    main(diagrams="renders" not in sys.argv[1:])
