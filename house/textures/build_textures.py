"""v70 (BUILD_SPEC phase 3): CC0 photo-textures from Poly Haven for the house's outside and floors, toned to the client's photos.
    python3 house/textures/build_textures.py <folder of the 2k downloads>     (writes house/textures/<key>_map.jpg / _nor.jpg, 1024 px)
Each comes in as <asset>_diff.jpg and <asset>_nor.jpg (polyhaven.com, CC0); the sources and sizes are in house/SOURCES.md."""
import sys, json, pathlib
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
# key in the viewer: (Poly Haven asset, its real size in m, saturation, brightness, warmth)
SET = {"brick": ("red_brick_03", 1.05, 1.3, 1.22, 1.12),           # the front photo: orange-red stretchers, light mortar (V2.75: 14 courses a tile, 7.5 each as real ones)
       "tile": ("roof_09", 2.4, 0.75, 0.93, 1.08),                   # the brown interlocking concrete tiles (V1.47: 2.4, each about 30 across as real ones; 4.0 made them 50; V2.75: as light as the photos', was 0.58)
       "concrete": ("brushed_concrete", 2.5, 0.6, 1.25, 1.0),       # the drive
       "road": ("asphalt_02", 3.0, 0.8, 1.0, 1.0),
       "paving": ("rectangular_paving", 2.0, 0.6, 1.15, 1.0),       # the pavement
       "laminate": ("laminate_floor_02", 1.7, 0.25, 0.95, 1.0)}     # the WC's and the lower landing's grey wood-effect
# v72 (B3): the carpets, from ambientCG (CC0; its _Color and _NormalGL saved as <asset>_diff / _nor): the pile tinted to the
# photos' colour (the grey of the bedrooms, landing, hall and stairs; the oatmeal elsewhere) so its light and shade stay, the hue is ours
TINT = {"carpet_grey": ("Carpet012", 0.5, "#6f6f73"), "carpet": ("Carpet012", 0.5, "#cdbfa6"),
        "lawn": ("sparse_grass", 2.0, "#5a7838"),   # V1.3: the lawn's light and shade in the back photo's green (the photo's own grass is mostly dry)
        # V1.12, the client: "best textures": the rooms' own materials (house/model.py's names) get real grain and plaster in their colours;
        # optional: how much steeper the relief (smooth plaster's is a hair, gone at the room's distance), then the photo's contrast (painted
        # plaster is all but even: its look is the relief; the pine's knots softened; the oak's fine grain brought up)
        "pine": ("coated_pine", 1.0, "#c99a55", 1, 0.55), "pine_dark": ("coated_pine", 1.0, "#7a5a30", 1, 0.55),
        "birch": ("white_maple_veneer", 0.8, "#dcc8a2", 1, 1.3), "oak": ("oak_veneer_01", 1.0, "#b9864f", 1, 1.6),
        # V2.2, the client: "ensure walls are all smooth but ceilings have the popcorn artex type ceiling": no plaster photo (the walls flat
        # emulsion, every ceiling the artex below)
        "worktop": ("granite_tile_03", 0.6, "#26282a", 1, 1.4),   # V1.13 (QUALITY_PLAN Q2): the kitchen's black speckled worktop (one tile of it)
        # V1.21 (Q1/Q6): the soft things' real weave in their colours (they were flat): the bedding cotton poplin (the pillows and mattresses
        # share it: room3d.js), the curtains linen, bedroom 2's bed leather, the sofa-bed and the blanket wool
        "duvet": ("stretch_poplin", 0.25, "#e9e6df", 1, 0.6), "curtain": ("rough_linen", 0.4, "#f4f3ef", 1, 0.6),
        "leather": ("brown_leather", 0.5, "#1f1d1d", 1, 1.0), "lycksele": ("caban", 0.3, "#5b6b78", 1, 1.0), "check": ("jersey_melange", 0.3, "#7d7e86", 1, 1.0)}
CROP = {"granite_tile_03": (0.02, 0.02, 0.31, 0.31)}   # V1.13: a part of the photo, as fractions (one tile, clear of the grout lines)
# V1.13 (Q2): made here, not photographed: artex (stipple), the kitchen's and the lower landing's ceilings in the client's photos of 30 Oct:
# key: (real size m, colour); a height field of soft random peaks, its normal map and a faint shade in the hollows
STIPPLE = {"artex": (0.5, "#f3f2ee")}
# V3.76 (REAL_PLAN N110, from #232): the peaks finer and softer, nearer the kitchen's and the lower landing's photos of 30 Oct (a fine, low stipple):
# 3x the peaks, a third smaller, rounded (no flat clipped tops), a little under half the slope; 768 px (0.65 mm, a 4K screen's pixel a
# metre off): (px, peaks a pixel, blur as a share of px, gain, slope)
STIPPLE_LOOK = dict(px=768, dens=1 / 10, blur=1 / 480, gain=2.0, k=2.5)
SRC = {"Carpet012": "https://ambientcg.com/view?id=Carpet012"}
PX = {}                                                          # sizes other than 1024 px (V1.11, the client: "i dont want these low res versions, best textures"; was 512)
# V2.81 (REAL_PLAN N32): no finer than a pixel can show at the nearest a view comes, on a 4K screen (80° across 2160 px: 0.65 mm a metre
# away): a floor is 1.6 m under the eye (1 mm), the soft things a metre off (0.65 mm). These were twice as fine (0.25-0.5 mm a pixel); the
# rest stay, and the living room's oak keeps its 2048 (the client asked for it, V1.11)
PX.update(carpet=512, carpet_grey=512, check=512, lycksele=512, duvet=512)
# V3.58 (REAL_PLAN N109): room in the photo budget: one picture of a key at a size of its own, where no view comes near enough to need
# more (the road, never closer than the drive: 5.9 mm a pixel; the lawn's and the brick's relief, which a standing eye reads at 2-4 m;
# the living room's curtain and sofa weave relief, a hair at a metre): key_kind: px
PX.update(road_map=512, road_nor=512, lawn_nor=512, brick_nor=512, lr_hessian_nor=512, lr_cord_nor=512)
# V4.4 (N141): the same for the soft things a view comes a metre from (0.65 mm a pixel there): bedroom 2's leather relief (0.5 m a copy) and
# the curtains' linen (0.4 m), 1024 to 768
PX.update(leather_nor=768, curtain_map=768, curtain_nor=768)
# V1.1: the living room's own surfaces, the photo as it is (room3d.js matches each to its drawn texture's average colour as it loads,
# so the parts keep their colours and only the grain, weave and relief are real): key: (asset, real size m, map px, normal px, turn,
# relief). The oak is turned a quarter so its grain runs along the boards, as the drawn oak's does; 0 px leaves that picture out. Veneer
# and smooth plaster have only a hair of relief, gone at 256-512 px: relief scales it so it reads at the room's distance
PLAIN = {"lr_oak": ("oak_veneer_01", 0.6, 2048, 1024, True, 6), "lr_hessian": ("hessian_380", 0.6, 1024, 1024, False, 1.5),   # V1.11: twice as sharp
         "lr_cord": ("ribbed_corduroy", 0.6, 0, 1024, False, 1.5)}


def turn(im, normal):
    """a quarter turn anticlockwise; a normal map's arrows turn with it (x, y) -> (-y, x)"""
    im = im.rotate(90, expand=True)
    if normal:
        r, g, b = im.split()
        im = Image.merge("RGB", (g.point(lambda v: 255 - v), r, b))
    return im


def relief(im, k):
    """a normal map's slopes made k times steeper (x and y scaled, z made up so each arrow stays one long)"""
    if k == 1:
        return im
    import numpy as np
    a = np.asarray(im, dtype=np.float32) / 127.5 - 1
    a[..., :2] = (a[..., :2] - a[..., :2].mean((0, 1))) * k   # centred first: a slight lean in the photo would tilt the whole wall's light
    a[..., 2] = np.sqrt(np.clip(1 - (a[..., :2] ** 2).sum(-1), 0.05, 1))
    a /= np.linalg.norm(a, axis=-1, keepdims=True)
    return Image.fromarray(((a + 1) * 127.5).clip(0, 255).astype("uint8"))


def tone(im, sat, bri, warm):
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Brightness(im).enhance(bri)
    if warm != 1.0:
        r, g, b = im.split()
        r = r.point(lambda v: min(255, int(v * warm))); b = b.point(lambda v: int(v / warm))
        im = Image.merge("RGB", (r, g, b))
    return im


def tint(im, col, k=1.0):
    """the picture's light and shade (its grey, scaled so its mean is the colour's) in the colour's hue; k scales its contrast"""
    from PIL import ImageStat
    g = im.convert("L"); m = ImageStat.Stat(g).mean[0] or 1
    if k != 1.0:
        g = g.point(lambda v: max(0, min(255, int(m + (v - m) * k))))
    c = [int(col[i:i + 2], 16) for i in (1, 3, 5)]
    return Image.merge("RGB", [g.point(lambda v, k=k: min(255, int(v * k / m))) for k in c])


def load(src, aid, kind):
    """<asset>_diff.jpg or _nor.jpg, cropped when CROP says"""
    im = Image.open(src / f"{aid}_{kind}.jpg").convert("RGB")
    if aid in CROP:
        x0, y0, x1, y1 = CROP[aid]; im = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
    return im


def stipple(px, col, seed=7, dens=1 / 30, blur=1 / 340, gain=3.0, k=6.0):
    """artex: soft peaks (blurred random dots, clipped, so the tops stay rounded), the normal map from its slopes, the colour shaded
    3 % in the hollows; tiles seamlessly (the dots wrap)"""
    import numpy as np
    from PIL import ImageFilter
    rng = np.random.default_rng(seed)
    a = np.zeros((px, px), np.float32)
    n = int(px * px * dens)
    ys, xs = rng.integers(0, px, n), rng.integers(0, px, n)
    a[ys, xs] = rng.uniform(0.4, 1.0, n)
    big = np.tile(a, (3, 3))                                       # blur across the seams, then take the middle
    im = Image.fromarray((big * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(px * blur))
    h = np.asarray(im, np.float32)[px:2 * px, px:2 * px] / 255
    h = np.clip(h / (h.max() or 1) * gain, 0, 1)
    gy, gx = np.gradient(h)
    nrm = np.dstack([-gx * k, gy * k, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    c = np.array([int(col[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
    shade = 0.97 + 0.03 * h
    return (Image.fromarray(np.clip(c * shade[..., None], 0, 255).astype("uint8")),
            Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")))


def main(src):
    src = pathlib.Path(src); meta = json.loads((HERE / "textures.json").read_text()) if (HERE / "textures.json").exists() else {}
    jobs = [(k, a, sz, lambda d, t=t: tone(d, *t), 1) for k, (a, sz, *t) in SET.items()] + [(k, a, sz, lambda d, c=c, x=x: tint(d, c, *x[1:2]), (x or [1])[0]) for k, (a, sz, c, *x) in TINT.items()]
    for key, aid, size, look, rk in jobs:
        if not (src / f"{aid}_diff.jpg").exists():          # keep what's built when a download isn't to hand
            continue
        px = PX.get(key, 1024)
        d = load(src, aid, "diff").resize((px, px), Image.LANCZOS)
        look(d).save(HERE / f"{key}_map.jpg", quality=78, optimize=True)
        n = src / f"{aid}_nor.jpg"
        if n.exists():
            relief(load(src, aid, "nor").resize((px, px), Image.LANCZOS), rk).save(HERE / f"{key}_nor.jpg", quality=82, optimize=True)
        meta[key] = dict(asset=aid, size=size, url=SRC.get(aid, f"https://polyhaven.com/a/{aid}"), licence="CC0")
    for key, (aid, size, mpx, npx, tq, rk) in PLAIN.items():
        if not (src / f"{aid}_nor.jpg").exists():
            continue
        for kind, px, f in (("map", mpx, f"{aid}_diff.jpg"), ("nor", npx, f"{aid}_nor.jpg")):
            if not px:
                (HERE / f"{key}_{kind}.jpg").unlink(missing_ok=True); continue
            im = Image.open(src / f).convert("RGB").resize((px, px), Image.LANCZOS)
            im = relief(im, rk) if kind == "nor" else im
            (turn(im, kind == "nor") if tq else im).save(HERE / f"{key}_{kind}.jpg", quality=76 if kind == "map" else 80, optimize=True)
        meta[key] = dict(asset=aid, size=size, url=SRC.get(aid, f"https://polyhaven.com/a/{aid}"), licence="CC0")
    for key, (size, col) in STIPPLE.items():
        m, n = stipple(col=col, **STIPPLE_LOOK)
        m.save(HERE / f"{key}_map.jpg", quality=82, optimize=True); n.save(HERE / f"{key}_nor.jpg", quality=84, optimize=True)
        meta[key] = dict(asset="made by build_textures.stipple", size=size, url="", licence="ours")
    share(meta)
    print("textures", len(meta))


def buff():
    """V1.26: the secret room's pale buff brick (the client's photos down the hatch), toned from the red brick's photo (no new download):
    its light and shade kept, the hue the photos' cream; the same relief."""
    from PIL import ImageOps
    g = ImageOps.autocontrast(Image.open(HERE / "brick_map.jpg").convert("L"), cutoff=1)
    ImageOps.colorize(g, black="#7d6e55", white="#f2ead6", mid="#cdbd98").save(HERE / "brick_buff_map.jpg", quality=86)
    meta = json.loads((HERE / "textures.json").read_text())
    meta["brick_buff"] = dict(meta["brick"], asset=meta["brick"]["asset"] + " (toned buff)", like="brick")   # its relief is brick's
    share(meta)


# V1.30 (U5, docs/UPGRADE_REVIEW.md): where a surface's shine varies (the wood's grain, a floor's wear, the worktop's speckle, the tiles'
# weathering), Poly Haven's roughness map of the same asset, 512 px grey (one number each before: every board shone the same all over).
# room3d.js keeps each material's roughness on average (it divides by the map's mean, photo_meta "rough"); the same crop and turn as the photo
# (asset, contrast round its mean: the laminate's and pine's wear is a few % as photographed, raised so it reads at a room's distance;
# the worktop, concrete and paving vary 1-2%: left out)
ROUGH = {"laminate": ("laminate_floor_02", 3), "pine": ("coated_pine", 2), "pine_dark": ("coated_pine", 2), "birch": ("white_maple_veneer", 1.5),
         "oak": ("oak_veneer_01", 1), "tile": ("roof_09", 1)}


def rough():
    """python3 house/textures/build_textures.py --rough   fetches each 1k roughness map from Poly Haven's API (CC0) into <key>_rough.jpg"""
    import io, urllib.request
    get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "demmas-home-build/1.0"})).read()
    got = {}
    from PIL import ImageStat
    for key, (aid, k) in ROUGH.items():
        if aid not in got:
            files = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
            got[aid] = Image.open(io.BytesIO(get(files["Rough"]["1k"]["jpg"]["url"]))).convert("L")
        im = got[aid]
        if aid in CROP:
            a, b, c, d = CROP[aid]; w, h = im.size; im = im.crop((int(a * w), int(b * h), int(c * w), int(d * h)))
        im = im.resize((512, 512), Image.LANCZOS); m = ImageStat.Stat(im).mean[0]
        # centred on 0.85: room3d.js divides each material's roughness by the map's mean, which has to stay at or under 1 for the average
        # to hold (pine's map averaged 0.31: its 0.55 wanted 1.8)
        im.point(lambda v: max(0, min(255, round(217 + (v - m) * k)))).save(HERE / f"{key}_rough.jpg", quality=82, optimize=True)
        print("rough", key, aid)


# V2.37 (REAL_PLAN R3): the client's tiles drawn at their real sizes (house/HOUSE.md): the bathroom's black marble-effect 60 × 60 floor and
# grey stone-effect 60 × 30 walls, the kitchen's black bevelled metro 20 × 10 in light grout (the photos); each with its relief (the grout
# sunk, the metro's bevel) and its shine (glazed faces, matt grout). key: (texture's size m, px, tile w × h cm, face, grout, grout mm,
# bevel mm, the face's look, face and grout roughness, every other row along by (V2.40: the bathroom's photo: its wall tiles stacked)
TILED = {"marble": (1.2, 1024, (60, 60), "#141416", "#38383c", 2, 1, "veins", (0.1, 0.8), 0),
         "stone": (1.2, 1024, (60, 30), "#cbc6bd", "#9d978c", 2.5, 1, "stone", (0.4, 0.85), 0),
         "metro": (0.4, 512, (20, 10), "#131416", "#c9c5bd", 2, 5, "", (0.06, 0.85), 0.5),
         "porcelain": (2.4, 1024, (120, 60), "#d6d0c4", "#b8b1a4", 2, 0.5, "lime", (0.5, 0.85), 0.5),   # V3.14 (N56): an upgrade floor
         "tile_w": (0.6, 512, (15, 15), "#f2f2ef", "#c9c7c0", 2, 1.5, "", (0.08, 0.85), 0)}   # V3.43 (N95): the WC's white 15 × 15 splashback (the photo), was a drawn canvas


def fbm(px, seed, base=4, octaves=5, stretch=1):
    """soft noise 0..1 that wraps (each octave's grid tiled 3 × 3, smoothed, the middle kept); stretch: finer down than across (streaks)"""
    import numpy as np
    rng, out, amp = np.random.default_rng(seed), np.zeros((px, px), np.float32), 1.0
    for o in range(octaves):
        g = np.tile(rng.random(((base << o) * stretch, base << o)).astype(np.float32), (3, 3))
        out += amp * np.asarray(Image.fromarray(g).resize((px * 3,) * 2, Image.BICUBIC))[px:2 * px, px:2 * px]; amp *= 0.5
    return (out - out.min()) / (np.ptp(out) or 1)


def tiles():
    """python3 house/textures/build_textures.py --tiles   writes <key>_map, _nor and _rough.jpg for TILED (no download: ours)"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (size, px, (tw, th), face, grout, gmm, bmm, look, (rf, rg), bond) in TILED.items():
        cm = size * 100 / px                                                   # cm a pixel
        y, x = np.mgrid[0:px, 0:px].astype(np.float32) * cm
        row = np.floor(y / th); off = (row % 2) * tw * bond                    # every other course along (the metro's half a tile)
        col = np.floor((x - off) / tw) % round(size * 100 / tw)
        lx, ly = (x - off) % tw, y % th
        d = np.minimum(np.minimum(lx, tw - lx), np.minimum(ly, th - ly))       # to the tile's nearest edge
        g = gmm / 20; inG = d < g
        h = np.where(inG, 0.0, np.clip((d - g) / max(bmm / 10, cm), 0, 1))
        h = np.where(inG, 0, 1 - (1 - h) ** 2) * (0.25 + bmm / 10 * 0.4)      # cm: the grout 2.5 mm down (V3.32, N84: was 1.5, lost at a room's distance), the bevel's rise
        ti = (row * 7 + col * 3) % 11                                          # each tile its own
        c0 = np.array([int(face[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        yi, xi = np.mgrid[0:px, 0:px]
        if look == "veins":                                                    # V3.32 (N84): the photo's Nero Marquina look: hairline white veins
            sh = lambda f, s=1: f[(yi + (ti * 89 * s).astype(int)) % px, (xi + (ti * 53 * s).astype(int)) % px]   # each tile its own run
            def line(n, w):                                                    # a level line of soft noise, w px wide whatever its slope
                gy_, gx_ = np.gradient(n); return np.exp(-(np.abs(n - 0.5) / (np.hypot(gx_, gy_) + 1e-4) / w) ** 2)
            rs = np.random.default_rng(5); A = np.radians(35 + rs.normal(0, 18, 11)); P = rs.uniform(70, 110, 11); Q = rs.random(11)
            t_ = ti.astype(int); ca, sa = np.cos(A[t_]), np.sin(A[t_])                # each tile its own slant, spacing and place
            u1 = (lx * ca + ly * sa) / P[t_] + Q[t_] + sh(fbm(px, 11, 3, 5)) * 0.35   # the big veins: one or two a tile, drifting on the slant
            u2 = (lx * -sa + ly * ca) / 26 + sh(fbm(px, 12, 4, 5), 2) * 1.1              # hairline branches off them, across
            u3 = (lx * np.cos(A[t_] + 0.5) + ly * np.sin(A[t_] + 0.5)) / (P[t_] * 0.6) + Q[t_] * 3 + sh(fbm(px, 15, 4, 5), 4) * 0.5   # a fainter one crossing
            main, fine, third = (0.5 + 0.5 * np.sin(u * 2 * np.pi) for u in (u1, u2, u3))
            mask, cloud = sh(fbm(px, 13, 3, 4), 3), fbm(px, 14, 3, 5)
            near = line(main, 90)                                              # the branches only by a big vein, as in the photo
            vein = np.maximum.reduce([line(main, 1.3) * np.clip(mask * 1.8 - 0.3, 0, 1), line(fine, 0.6) * near * np.clip(mask * 2.5 - 1.2, 0, 1) * 0.7,
                              line(third, 0.8) * np.clip(1.6 - mask * 2.6, 0, 1) * 0.45])
            halo = line(main, 7) * 0.06                                        # a faint grey bloom beside the big vein, not a glow
            k = 0.86 + 0.32 * cloud + ((ti % 5) - 2) * 0.02                    # charcoal clouds, a shade apart tile to tile
            col_ = c0[None, None] * k[..., None] + np.clip(vein + halo, 0, 1)[..., None] * (np.array([226, 226, 230]) - c0)
        elif look == "stone":                                                  # V2.40 (the photo): a travertine look: bands of thin grey
            sh = lambda f: f[(yi + (ti * 97).astype(int)) % px, xi]           # each tile its own run of the stone
            m, st = fbm(px, 21, 6, 5), sh(fbm(px, 22, 3, 6, 24))               # fine streaks along the tile, a shade apart tile to tile
            ln = (1 - np.abs(st * 2 - 1)) ** 12 * np.clip((sh(fbm(px, 23, 3, 4, 8)) - 0.35) * 2.5, 0, 1)   # and thin darker veins in them
            k = 1 + (st - 0.5) * 0.15 + (m - 0.5) * 0.05 + ((ti % 5) - 2) * 0.015 - ln * 0.14
            col_ = c0[None, None] * k[..., None]; h = h + np.where(inG, 0, (m - 0.5) * 0.02)
        elif look == "lime":                                                   # V3.14: a limestone print: soft clouds, fine specks, each tile its own
            sh = lambda f: f[(yi + (ti * 131).astype(int)) % px, (xi + (ti * 57).astype(int)) % px]
            m, f2, sp = sh(fbm(px, 61, 3, 6)), sh(fbm(px, 62, 8, 4)), sh(fbm(px, 63, 64, 2))
            k = 1 + (m - 0.5) * 0.09 + (f2 - 0.5) * 0.04 - np.clip(sp - 0.82, 0, 1) * 0.6 + ((ti % 5) - 2) * 0.01
            col_ = c0[None, None] * k[..., None]
        else:                                                                  # V3.32 (N84): glazed, each tile a hair its own shade
            col_ = c0[None, None] * (0.95 + 0.06 * fbm(px, 31, 4, 3) + ((ti % 5) - 2) * 0.025)[..., None]
        # V3.32 (N84): a glazed or polished face is never quite flat: each tile laid a hair off level (lippage) and its glaze a little
        # wavy, so the reflections break tile to tile as in the photos (a step or two of the normal map's 8 bits; the metro's handmade
        # wave most); the joint's shadow under the tile's lip, and the grout's sand
        rs = np.random.default_rng(len(key) * 31); tilt = rs.normal(0, 1, (11, 2)) * (0.012 if look else 0.02)
        wav = fbm(px, 71, 3, 3) * (0.03 if look else 0.08)
        h = h + np.where(inG, fbm(px, 42, 48, 2) * 0.03, tilt[ti.astype(int), 0] * (lx - tw / 2) + tilt[ti.astype(int), 1] * (ly - th / 2) + wav)
        col_ = col_ * (1 - 0.14 * np.clip(1 - (d - g) / 0.35, 0, 1) ** 2)[..., None]   # the tile's edge darker into the joint
        gc = np.array([int(grout[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        col_ = np.where(inG[..., None], gc * ((0.94 + 0.08 * fbm(px, 41, 16, 3)) * (0.82 + 0.18 * np.clip(d / g * 1.4, 0, 1)))[..., None], col_)
        gy, gx = np.gradient(h, cm)                                            # cm per cm, rows down the picture
        nrm = np.dstack([-gx, gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
        rface = rf * (0.8 + 0.4 * fbm(px, 72, 2, 4))                           # V3.32: the shine a little uneven (wear, a wipe), never patchy
        Image.fromarray(np.clip(col_, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=84, optimize=True)
        Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=88, optimize=True)
        Image.fromarray((np.where(inG, rg, rface) * 255).astype("uint8")).resize((px // 2,) * 2, Image.BOX).save(HERE / f"{key}_rough.jpg", quality=88)
        meta[key] = dict(asset="made by build_textures.tiles", size=size, url="", licence="ours")
        print("tiles", key)
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


# V2.56 (REAL_PLAN R3, N8): the finishes no photo covers, made here (no download): key: (texture's size m, px, kind). uPVC's faint
# orange peel; gloss paint's (the skirting, the doors, the newel and rail) orange peel with the brush's strokes along it; brushed metal's
# grain (the steel); these three are white detail maps (the viewer keeps each material's own colour over them, 20_go.js TINT). The
# dormer's cheeks, as the back photo: dark-stained timber weatherboards 15 high, each lapped over the one below, the grain along them.
MADE = {"upvc": (0.5, 512, "peel"), "gloss": (0.5, 512, "paint"), "brushed": (0.3, 512, "brushed"), "hung": (0.6, 1024, "boards"),
        "joinery": (0.6, 512, "timber")}   # N111: the doors and their frames: painted timber, the grain's lines under the satin


def finishes():
    """python3 house/textures/build_textures.py --finishes   writes <key>_map, _nor and _rough.jpg for MADE (ours)"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (size, px, kind) in MADE.items():
        cm = size * 100 / px
        peel = fbm(px, 51, 24, 3)                                             # a few mm across: the skin a spray or a mould leaves
        if kind == "peel":
            h = peel * 0.015; tone = 1 - 0.012 * fbm(px, 52, 4, 3); r = 0.85 + (peel - 0.5) * 0.06
        elif kind == "paint":
            st = fbm(px, 53, 2, 6, 40)                                         # the brush's strokes, long along the board
            h = peel * 0.01 + st * 0.02; tone = 1 - 0.015 * st; r = 0.85 + (st - 0.5) * 0.1
        elif kind == "timber":                                                 # growth lines up the board (a leaf's v), wavering, filled by the paint
            import numpy as np
            x = np.mgrid[0:px, 0:px][1].astype(np.float32) / px
            w = fbm(px, 56, 1, 4, 3).T                                         # the lines' slow wander (wraps: whole cycles a picture)
            ln = (0.5 + 0.5 * np.cos(2 * np.pi * (14 * x + 1.5 * w))) ** 6     # 14 thin ridges a picture, ~4 cm apart, wide flats
            st = fbm(px, 57, 2, 6, 40).T                                       # the brush, along them
            h = peel * 0.008 + st * 0.012 + ln * 0.035; tone = 1 - 0.012 * st - 0.01 * ln; r = 0.8 + (st - 0.5) * 0.08 - 0.04 * ln
        elif kind == "brushed":
            st = fbm(px, 54, 1, 7, 160)                                        # fine grain one way, a hair deep
            h = st * 0.006; tone = 0.97 + 0.05 * st; r = 0.85 + (st - 0.5) * 0.25
        else:                                                                  # weatherboards: rows down the picture, 4 boards
            y = np.mgrid[0:px, 0:px][0].astype(np.float32) * cm; bh = 15.0
            f = (y % bh) / bh                                                  # 0 at a board's top, 1 at its lapped foot
            row = np.floor(y / bh).astype(int)
            gr = fbm(px, 55, 1, 7, 60)                                         # the grain along the board (across the picture)
            h = 1.2 * f + 0.05 * gr                                            # each board thicker to its foot, then a step to the next
            c0 = np.array([94, 61, 44], np.float32)
            k = 0.86 + 0.18 * gr + 0.06 * ((row * 5) % 3 - 1) - 0.5 * np.clip(1 - f / 0.16, 0, 1) ** 1.5 + 0.1 * np.clip((f - 0.94) / 0.06, 0, 1)   # each board its own; the shadow under the lap
            col_ = c0[None, None] * k[..., None]; r = 0.85 + (gr - 0.5) * 0.1
        if kind != "boards":
            col_ = np.repeat((250 * tone)[..., None], 3, -1)
        gy, gx = np.gradient(h, cm)
        nrm = np.dstack([-gx, gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
        Image.fromarray(np.clip(col_, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=86, optimize=True)
        Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=88, optimize=True)
        Image.fromarray((np.clip(r, 0, 1) * 255).astype("uint8")).resize((px // 2,) * 2, Image.BOX).save(HERE / f"{key}_rough.jpg", quality=88)
        meta[key] = dict(asset="made by build_textures.finishes", size=size, url="", licence="ours")
        print("finishes", key)
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


# V3.14 (N56): three upgrade floors to try (23_finish.js FIN_FLOORS), made here from the oak veneer's own grain (no download), drawn to
# real products' sizes (fit.SOURCES "upfloors"): key: (texture's size m, px, kind, block or plank w × l cm, tone (sat, bright, warm))
# herring: 90 × 450 engineered oak blocks, 4V bevelled, laid herringbone at 45° (repeats every 2 × 9 × 5 × √2 cm along both ways);
# lvt_grey: grey oak LVT planks 17.8 wide, micro-bevelled, ends staggered (each 124.6 long, 2% over 121.9, so the picture repeats in 7 rows);
# porcelain (in TILED): 120 × 60 stone-effect porcelain, 2 mm grout, half-bond
UPFLOORS = {"herring": (2 * 0.09 * 5 * 2 ** 0.5, 1024, "herring", (9, 45), (0.7, 1.12, -4)),
            "lvt_grey": (7 * 0.178, 1024, "planks", (17.8, 124.6), (0.12, 1.12, -6)),
            "board": (1.2, 512, "boards", (15, 120), (0.35, 1.25, 2))}   # V3.53 (N105): the stores' and cupboards' floorboards (a drawn canvas): 15 cm pine-pale boards


def floors():
    """python3 house/textures/build_textures.py --floors   writes <key>_map, _nor and _rough.jpg for UPFLOORS from oak_map (ours)"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    src = np.asarray(Image.open(HERE / "oak_map.jpg").convert("RGB"), np.float32)   # 1 m of veneer, the grain down the picture
    sp = src.shape[0] / 100.0                                                         # its px a cm
    for key, (size, px, kind, (bw, bl), (sat, bri, warm)) in UPFLOORS.items():
        rng = np.random.default_rng(len(key) * 7)
        cm = size * 100 / px
        y, x = np.mgrid[0:px, 0:px].astype(np.float32) * cm
        if kind == "herring":                                                         # in blocks' widths, turned 45°: rows of steps
            a, b = (x + y) / 2 ** 0.5 / bw, (y - x) / 2 ** 0.5 / bw; n = bl / bw
            bid, u, v = np.full(x.shape, -1, np.int64), np.zeros_like(x), np.zeros_like(x)   # which block, along it and across it (cm)
            for m in range(-12, 13):                                                  # (k % 2n, m % 2) names a block within the repeat
                qa, qb = a - m * n, b + m * n
                k = np.floor(qb); hit = (bid < 0) & (qa >= k) & (qa < k + n)          # a block along a: [k, k+n] × [k, k+1]
                bid = np.where(hit, ((k % (2 * n)) * 4 + (m % 2) * 2).astype(np.int64), bid); u = np.where(hit, (qa - k) * bw, u); v = np.where(hit, (qb - k) * bw, v)
                k = np.floor(qa) - n; hit = (bid < 0) & (qb >= k + 1 - n) & (qb < k + 1)   # one across: [k+n, k+n+1] × [k+1-n, k+1]
                bid = np.where(hit, ((k % (2 * n)) * 4 + (m % 2) * 2 + 1).astype(np.int64), bid); u = np.where(hit, (qb - (k + 1 - n)) * bw, u); v = np.where(hit, (qa - k - n) * bw, v)
            idx = bid                                                                 # a block a repeat away is the same one: (its step mod 2n, its row mod 2, which way)
        else:                                                                         # planks along y, rows across x, ends staggered
            row = np.floor(x / bw); u0 = (y + (row * 0.37 % 1) * bl) % bl
            idx = row.astype(np.int64); u, v = u0, x - row * bw
        nb = int(idx.max()) + 1
        ox, oy, kk = rng.random(nb) * (100 - bw), rng.random(nb) * 100, 0.86 + 0.28 * rng.random(nb)   # each its own run of the veneer, a shade apart
        sx = ((ox[idx] + v) * sp).astype(int) % src.shape[1]; sy = ((oy[idx] + u) * sp).astype(int) % src.shape[0]
        col = src[sy, sx] * kk[idx][..., None]
        g = col.mean(-1, keepdims=True); col = g + (col - g) * sat                     # the finish's colour: oiled natural, or grey
        col = col * bri + np.array([warm, warm * 0.3, -warm], np.float32)
        if kind == "planks": col = col * 0.55 + np.array([150, 146, 140], np.float32) * 0.45   # a grey wash over the grain (LVT's print)
        d = np.minimum(np.minimum(u, bl - u), np.minimum(v, bw - v))                    # to the block's nearest edge (cm)
        bev = 0.25 if kind == "herring" else 0.12                                       # 4V; LVT's micro-bevel
        e = np.clip(d / bev, 0, 1); col = col * (0.62 + 0.38 * e)[..., None]
        gr = (src[sy, sx].mean(-1) / 255)                                               # the grain's relief (brushed): darker sinks
        h = (1 - (1 - e) ** 2) * 0.1 + gr * 0.02
        gy, gx = np.gradient(h, cm)
        tl = rng.normal(0, 0.012, (nb, 2)); gx = gx + tl[idx, 0]; gy = gy + tl[idx, 1]   # V3.35 (N86): each board a hair off level, its sheen its own
        nrm = np.dstack([-gx, gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
        r = np.where(e < 1, 0.8, 0.55 if kind == "herring" else 0.45) + (gr - 0.5) * 0.1
        Image.fromarray(np.clip(col, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=84, optimize=True)
        Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=86, optimize=True)
        Image.fromarray((np.clip(r, 0, 1) * 255).astype("uint8")).resize((px // 2,) * 2, Image.BOX).save(HERE / f"{key}_rough.jpg", quality=86)
        meta[key] = dict(asset="made by build_textures.floors (from oak_veneer_01)", size=round(size, 4), url="", licence="ours")
        print("floors", key, nb, "pieces")
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


# V3.35 (N86): the laminate's planks read as planks: Poly Haven's normal map is all but flat, so the joints (its picture's dark 1-2 px lines:
# a row every 128 px, each row's end joints) are cut into it as a micro-bevelled V (0.6 mm), and each plank laid a hair off level as real
# boards are (the sheen breaks plank to plank, a step or two of the normal map's 8 bits). Once: textures.json notes it ("seams")
SEAMS = {"laminate": (0.06, 0.012)}   # key: (groove cm, a plank's tilt)


def seams():
    """python3 house/textures/build_textures.py --seams   cuts the joints into <key>_nor.jpg from <key>_map.jpg (no download)"""
    import numpy as np
    from PIL import ImageFilter
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (depth, tilt) in SEAMS.items():
        if meta[key].get("seams"):
            print("seams", key, "already cut"); continue
        g = np.asarray(Image.open(HERE / f"{key}_map.jpg").convert("L"), np.float32); px = g.shape[0]; cm = meta[key]["size"] * 100 / px
        rows = np.where(g.mean(1) < g.mean() - 20)[0]                         # the long joints: rows far darker than the rest
        rows = [r for i, r in enumerate(rows) if not i or r - rows[i - 1] > 4]
        seam = np.zeros_like(g); seam[rows] = 1; pid = np.zeros(g.shape, np.int64)
        edges = rows + [rows[0] + px]
        for i, (a, b) in enumerate(zip(edges, edges[1:])):                    # each row of planks, its end joints
            ys = np.arange(a + 3, b - 2) % px; c = g[ys].mean(0)
            ends = np.where(c < c.mean() - 25)[0]; ends = [e for j, e in enumerate(ends) if not j or e - ends[j - 1] > 4]
            for e in ends: seam[ys, e] = 1
            cut = [0] + list(ends) + [px]
            for j, (u, v) in enumerate(zip(cut, cut[1:])): pid[np.ix_(ys, np.arange(u, v))] = i * 16 + j
            if ends: pid[np.ix_(ys, np.arange(ends[-1], px))] = i * 16       # the last plank wraps round to the first
        v = np.asarray(Image.fromarray((seam * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0)), np.float32) / 255
        h = -depth * np.clip(v / (v.max() or 1) * 1.6, 0, 1)
        rs = np.random.default_rng(9); t = rs.normal(0, tilt, (pid.max() + 1, 2)); y, x = np.mgrid[0:px, 0:px] * cm
        gy, gx = np.gradient(h, cm); gx = gx + t[pid, 0]; gy = gy + t[pid, 1]
        n0 = np.asarray(Image.open(HERE / f"{key}_nor.jpg").convert("RGB"), np.float32) / 127.5 - 1   # the photo's own relief kept
        sx, sy = n0[..., 0] / np.maximum(n0[..., 2], 0.2), n0[..., 1] / np.maximum(n0[..., 2], 0.2)
        nrm = np.dstack([sx - gx, sy + gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
        Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=88, optimize=True)
        meta[key]["seams"] = True
        print("seams", key, len(rows), "rows,", int(seam.sum()), "px of joint")
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


# V3.40 (N92): the kitchen's worktop is a polished black speckled laminate in the photos, not rough stone: the granite photo's relief
# (steepened 1.4 for a room's distance, V1.13) broke every reflection into grit. Its relief kept at a quarter (a polished face's faint
# ripple), and a roughness map from the speckle: the pale flecks glassier than the black between (the shine glints, as the photo's does).
# Once: textures.json notes it ("polished"). key: (relief kept, roughness spread round its mean)
POLISH = {"worktop": (0.25, 0.35)}


def polish():
    """python3 house/textures/build_textures.py --polish   flattens <key>_nor.jpg and writes <key>_rough.jpg from <key>_map.jpg"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (keep, spread) in POLISH.items():
        if meta[key].get("polished"):
            print("polish", key, "already done"); continue
        n = np.asarray(Image.open(HERE / f"{key}_nor.jpg").convert("RGB"), np.float32) / 127.5 - 1
        n[..., :2] *= keep; n[..., 2] = np.sqrt(np.clip(1 - (n[..., :2] ** 2).sum(-1), 0.05, 1))
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        Image.fromarray(((n + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=86, optimize=True)
        g = np.asarray(Image.open(HERE / f"{key}_map.jpg").convert("L").resize((512, 512), Image.LANCZOS), np.float32) / 255
        z = (g - g.mean()) / (g.std() or 1)                                   # a fleck's paleness, in spreads
        r = 0.85 * (1 - spread * np.tanh(z * 0.8))                            # pale: glassier; the dark between: a touch duller
        Image.fromarray((np.clip(r, 0, 1) * 255).astype("uint8")).save(HERE / f"{key}_rough.jpg", quality=78, optimize=True)
        meta[key]["polished"] = True
        print("polish", key)
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


# V3.43 (N95): the birch pieces (the music room's desk, the shelves and trays) read as flat beige: the maple veneer's photo, tinted, kept a
# 4-level spread round its mean (a real birch face shows its figure and its darker lines from across a room). Its light and shade steepened
# round the mean, the darker lines a touch more amber (as lacquered birch yellows). Once: textures.json notes it ("contrast").
# key: (steeper by, the darker lines' warmth)
CONTRAST = {"birch": (3.0, 0.35), "concrete": (0.55, 0.0, 0.7)}   # concrete (N96): the trowel swirls at half, the brown three-tenths left


def contrast():
    """python3 house/textures/build_textures.py --contrast   steepens <key>_map.jpg's light and shade in place (no download)"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (k, warm, *grey) in CONTRAST.items():
        if meta[key].get("contrast"):
            print("contrast", key, "already done"); continue
        a = np.asarray(Image.open(HERE / f"{key}_map.jpg").convert("RGB"), np.float32)
        m = a.mean((0, 1)); L = a.mean(-1, keepdims=True); d = L - L.mean()
        out = a + d * (k - 1)                                                 # the same hue, the shade k times as deep
        out = out + np.clip(-d, 0, None) * warm * np.array([0.25, 0.0, -0.6])  # the darker lines warmer
        if grey:                                                              # the hue taken toward its grey by that part
            out = out + (out.mean(-1, keepdims=True) - out) * grey[0]; m = m + (m.mean() - m) * grey[0]
        out = out - (out.mean((0, 1)) - m)                                    # the mean kept: MATS's colour holds
        Image.fromarray(np.clip(out, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=84, optimize=True)
        meta[key]["contrast"] = k
        print("contrast", key, round(float(L.std()), 1), "->", round(float(out.mean(-1).std()), 1))
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


def flakes():
    """python3 house/textures/build_textures.py --flakes   V3.50 (N102): the garage's chipboard box read as flat tan card: pressed wood
    chips, a few mm each, light and dark, lying every way, a hair of relief between them (map, relief, roughness: the marble's mix)"""
    import numpy as np
    from PIL import ImageDraw, ImageFilter
    meta = json.loads((HERE / "textures.json").read_text())
    key, size, px = "chipboard", 0.6, 512
    rng = np.random.default_rng(99)
    tone = Image.new("L", (px, px), 128); hgt = Image.new("L", (px, px), 0)
    dt, dh = ImageDraw.Draw(tone), ImageDraw.Draw(hgt)
    for _ in range(26000):                                                    # the chips, smallest last so they lie on top
        x, y = rng.random(2) * px; L = rng.uniform(1.5, 7.0); W = L * rng.uniform(0.15, 0.4); a = rng.random() * np.pi
        c, s_ = np.cos(a), np.sin(a)
        pts = [(x + c * u - s_ * v, y + s_ * u + c * v) for u, v in ((-L, -W), (L, -W), (L, W), (-L, W))]
        t = int(np.clip(rng.normal(128, 34) - (60 if rng.random() < 0.08 else 0), 10, 240)); h = int(rng.uniform(60, 255))   # one in twelve a dark bark chip
        for ox in (-px, 0, px):                                               # drawn again across each edge: it tiles
            for oy in (-px, 0, px):
                q = [(u + ox, v + oy) for u, v in pts]
                dt.polygon(q, fill=t); dh.polygon(q, fill=h)
    t = np.asarray(tone, np.float32) / 128 - 1
    t = t * 0.2 + 0.05 * (fbm(px, 98, 3, 3) - 0.5)                           # each chip ±20 %, a slow cloud over the sheet
    base = np.array([200, 173, 128], np.float32)                              # MATS chipboard
    col_ = base[None, None] * (1 + t)[..., None]
    col_ = col_ * (1 - 0.35 * np.clip(-t, 0, None))[..., None] + np.clip(-t, 0, None)[..., None] * np.array([-18, -10, 0], np.float32)   # the dark chips browner
    cm = size * 100 / px
    h = np.asarray(hgt.filter(ImageFilter.GaussianBlur(0.4)), np.float32) / 255 * 0.02
    gy, gx = np.gradient(h, cm)
    nrm = np.dstack([-gx, gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    r = 0.85 + (np.asarray(hgt, np.float32) / 255 - 0.6) * 0.12
    Image.fromarray(np.clip(col_, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=78, optimize=True)
    Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=84, optimize=True)
    Image.fromarray((np.clip(r, 0, 1) * 255).astype("uint8")).resize((px // 2,) * 2, Image.BOX).save(HERE / f"{key}_rough.jpg", quality=80)
    meta[key] = {"asset": "made by build_textures.flakes", "size": size, "url": "", "licence": "ours"}
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")
    print("flakes", key)


def js_rnd(seed, n):
    """02_textures.js rnd(seed): the same Park-Miller numbers, so a map made here is the one the page drew"""
    import numpy as np
    out = np.empty(n, np.float64)
    for i in range(n):
        seed = seed * 16807 % 2147483647; out[i] = (seed - 1) / 2147483646
    return out


def fabrics():
    """python3 house/textures/build_textures.py --fabrics   V4.4 (N141): the sofa bed's chenille (V3.75), made here, not drawn by the page at
    every load (two 512 squares a pixel at a time, on the page's thread): chenille_map, near white, heathered (its plies in 4 px loops, a
    faint twill, a soft mottle), tinted by the piece's colour; chenille_pile_map, the loops' height for its relief (a bump: grey, not
    sRGB). 20 cm a tile, as drawn; the numbers are 02_textures.js's own (rnd 73 and 74), pixel for pixel"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    px, T = 512, 2 * np.pi / 512
    y, x = np.mgrid[0:px, 0:px]
    cy = y >> 2
    cells = lambda s: js_rnd(s, 128 * 128).astype(np.float32).astype(np.float64)   # its Float32Array
    c = cells(73)[cy * 128 + (((x + (cy & 1) * 2) >> 2) & 127)]
    ply = np.where(c < 0.22, -30, np.where(c > 0.84, 22, (c - 0.5) * 14))
    k = 228 + ply + 4 * np.sin((x + y) * np.pi / 4) + 4 * np.sin(3 * x * T + 1) * np.sin(2 * y * T) + 3 * np.sin((5 * x + 7 * y) * T)
    k = np.clip(k, 0, 255)
    rgb = np.rint(np.dstack([k, np.minimum(255, k + 2), k - 3])).clip(0, 255).astype("uint8")
    sx = x + (cy & 1) * 2; fx, fy = (sx & 3) - 1.5, (y & 3) - 1.5
    dome = np.maximum(0, 1 - (fx * fx + fy * fy) / 5)
    h = 128 + (dome * (0.55 + cells(74)[cy * 128 + ((sx >> 2) & 127)] * 0.9) - 0.55) * 90 + 10 * np.sin((x + y) * np.pi / 4)
    Image.fromarray(rgb).save(HERE / "chenille_map.jpg", quality=86, optimize=True)
    Image.fromarray(np.rint(h).clip(0, 255).astype("uint8")).save(HERE / "chenille_pile_map.jpg", quality=90, optimize=True)
    for key in ("chenille", "chenille_pile"):
        meta[key] = {"asset": "made by build_textures.fabrics", "size": 0.2, "url": "", "licence": "ours"}
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")
    print("fabrics", "chenille", "chenille_pile")


def share(meta):
    """V2.81 (N32): a picture an earlier key has already (the two carpets' pile, the pines' relief) goes once: the later key drops its copy
    and says like=<key> (export3d reads that key's file for any it lacks; only when it lacks nothing else that key has); then textures.json"""
    own = lambda k: {x: HERE / f"{k}_{x}.jpg" for x in ("map", "nor", "rough") if (HERE / f"{k}_{x}.jpg").exists()}
    for i, k in enumerate(meta):
        mine = own(k)
        for o in list(meta)[:i]:
            theirs = own(o)
            same = [x for x in mine if x in theirs and mine[x].read_bytes() == theirs[x].read_bytes()]
            if same and not meta[o].get("like") and not set(theirs) - set(mine):
                for x in same: mine[x].unlink()
                meta[k]["like"] = o; break
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


def slim():
    """python3 house/textures/build_textures.py --slim   the pictures in place brought to PX's sizes (no download), then share()"""
    meta = json.loads((HERE / "textures.json").read_text())
    for k, px in PX.items():
        for kind, q in (("map", 78), ("nor", 82), ("rough", 82)):
            if k.endswith(("_map", "_nor", "_rough")) and not k.endswith("_" + kind): continue   # N109: one picture of a key
            f = HERE / (f"{k}.jpg" if k.endswith(("_map", "_nor", "_rough")) else f"{k}_{kind}.jpg")
            if f.exists() and Image.open(f).width > px:
                im = Image.open(f); im.convert(im.mode).resize((px, px), Image.LANCZOS).save(f, quality=q, optimize=True); print("slim", f.name, px)
    share(meta)


if __name__ == "__main__":
    {"--buff": buff, "--rough": rough, "--tiles": tiles, "--finishes": finishes, "--floors": floors, "--slim": slim, "--seams": seams, "--polish": polish, "--contrast": contrast, "--flakes": flakes, "--fabrics": fabrics}.get((sys.argv[1:] or [""])[0], lambda: main(sys.argv[1]))()
