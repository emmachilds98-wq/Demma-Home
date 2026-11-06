"""v70 (BUILD_SPEC phase 3): CC0 photo-textures from Poly Haven for the house's outside and floors, toned to the client's photos.
    python3 house/textures/build_textures.py <folder of the 2k downloads>     (writes house/textures/<key>_map.jpg / _nor.jpg, 1024 px)
Each comes in as <asset>_diff.jpg and <asset>_nor.jpg (polyhaven.com, CC0); the sources and sizes are in house/SOURCES.md."""
import sys, json, pathlib
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
# key in the viewer: (Poly Haven asset, its real size in m, saturation, brightness, warmth)
SET = {"brick": ("red_brick_03", 1.0, 1.3, 1.22, 1.12),            # the front photo: orange-red stretchers, light mortar
       "tile": ("roof_09", 2.4, 0.75, 0.58, 1.08),                   # the brown interlocking concrete tiles (V1.47: 2.4, each about 30 across as real ones; 4.0 made them 50)
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
SRC = {"Carpet012": "https://ambientcg.com/view?id=Carpet012"}
PX = {}                                                          # sizes other than 1024 px (V1.11, the client: "i dont want these low res versions, best textures"; was 512)
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


def stipple(px, col, seed=7):
    """artex: soft peaks (blurred random dots, clipped, so the tops stay rounded), the normal map from its slopes, the colour shaded
    3 % in the hollows; tiles seamlessly (the dots wrap)"""
    import numpy as np
    from PIL import ImageFilter
    rng = np.random.default_rng(seed)
    a = np.zeros((px, px), np.float32)
    n = px * px // 30
    ys, xs = rng.integers(0, px, n), rng.integers(0, px, n)
    a[ys, xs] = rng.uniform(0.4, 1.0, n)
    big = np.tile(a, (3, 3))                                       # blur across the seams, then take the middle
    im = Image.fromarray((big * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(px / 340))
    h = np.asarray(im, np.float32)[px:2 * px, px:2 * px] / 255
    h = np.clip(h / (h.max() or 1) * 3, 0, 1)
    gy, gx = np.gradient(h)
    k = 6.0
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
        m, n = stipple(1024, col)
        m.save(HERE / f"{key}_map.jpg", quality=82, optimize=True); n.save(HERE / f"{key}_nor.jpg", quality=84, optimize=True)
        meta[key] = dict(asset="made by build_textures.stipple", size=size, url="", licence="ours")
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1))
    print("textures", len(meta))


def buff():
    """V1.26: the secret room's pale buff brick (the client's photos down the hatch), toned from the red brick's photo (no new download):
    its light and shade kept, the hue the photos' cream; the same relief."""
    from PIL import ImageOps
    g = ImageOps.autocontrast(Image.open(HERE / "brick_map.jpg").convert("L"), cutoff=1)
    ImageOps.colorize(g, black="#7d6e55", white="#f2ead6", mid="#cdbd98").save(HERE / "brick_buff_map.jpg", quality=86)
    (HERE / "brick_buff_nor.jpg").write_bytes((HERE / "brick_nor.jpg").read_bytes())
    meta = json.loads((HERE / "textures.json").read_text())
    meta["brick_buff"] = dict(meta["brick"], asset=meta["brick"]["asset"] + " (toned buff)")
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


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
# bevel mm, the face's look, face and grout roughness)
TILED = {"marble": (1.2, 1024, (60, 60), "#141416", "#38383c", 2, 1, "veins", (0.1, 0.8)),
         "stone": (1.2, 1024, (60, 30), "#cbc6bd", "#9d978c", 2.5, 1, "stone", (0.4, 0.85)),
         "metro": (0.4, 512, (20, 10), "#131416", "#c9c5bd", 2, 5, "", (0.06, 0.85))}


def fbm(px, seed, base=4, octaves=5):
    """soft noise 0..1 that wraps (each octave's grid tiled 3 × 3, smoothed, the middle kept)"""
    import numpy as np
    rng, out, amp = np.random.default_rng(seed), np.zeros((px, px), np.float32), 1.0
    for o in range(octaves):
        g = np.tile(rng.random((base << o,) * 2).astype(np.float32), (3, 3))
        out += amp * np.asarray(Image.fromarray(g).resize((px * 3,) * 2, Image.BICUBIC))[px:2 * px, px:2 * px]; amp *= 0.5
    return (out - out.min()) / (np.ptp(out) or 1)


def tiles():
    """python3 house/textures/build_textures.py --tiles   writes <key>_map, _nor and _rough.jpg for TILED (no download: ours)"""
    import numpy as np
    meta = json.loads((HERE / "textures.json").read_text())
    for key, (size, px, (tw, th), face, grout, gmm, bmm, look, (rf, rg)) in TILED.items():
        cm = size * 100 / px                                                   # cm a pixel
        y, x = np.mgrid[0:px, 0:px].astype(np.float32) * cm
        row = np.floor(y / th); off = (row % 2) * tw / 2                       # every other course half a tile along (not the 60 × 60s)
        if tw == th: off = 0 * off
        col = np.floor((x - off) / tw) % round(size * 100 / tw)
        lx, ly = (x - off) % tw, y % th
        d = np.minimum(np.minimum(lx, tw - lx), np.minimum(ly, th - ly))       # to the tile's nearest edge
        g = gmm / 20; inG = d < g
        h = np.where(inG, 0.0, np.clip((d - g) / max(bmm / 10, cm), 0, 1))
        h = np.where(inG, 0, 1 - (1 - h) ** 2) * (0.15 + bmm / 10 * 0.4)      # cm: the grout 1.5 mm down, the bevel's rise
        ti = (row * 7 + col * 3) % 11                                          # each tile its own
        c0 = np.array([int(face[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        if look == "veins":                                                    # white veins across black on the slant, hairlines off them
            n, n2, mk = fbm(px, 11, 3, 5), fbm(px, 12, 5, 5), fbm(px, 13, 4, 4); ph = ti * 1.7
            v1 = 1 - np.abs(np.sin((x * 0.6 + y * 0.8) / 11 + n * 3.2 + ph))
            v2 = 1 - np.abs(np.sin((x * 0.9 - y * 0.45) / 5 + n2 * 4 + ph * 2))
            vein = v1 ** 16 * (0.45 + 0.55 * mk) + v2 ** 40 * 0.55 * np.clip(mk * 2 - 0.7, 0, 1) + v1 ** 3 * 0.08
            col_ = c0[None, None] * (0.92 + n2[..., None] * 0.25) + np.clip(vein, 0, 1)[..., None] * (np.array([228, 228, 232]) - c0)
        elif look == "stone":                                                  # soft mottle and faint beds, a shade apart tile to tile
            m = fbm(px, 21, 6, 5); s = fbm(px, 22, 2, 3)
            k = 1 + (m - 0.5) * 0.16 + (s - 0.5) * 0.05 + ((ti % 5) - 2) * 0.012
            col_ = c0[None, None] * k[..., None]; h = h + np.where(inG, 0, (m - 0.5) * 0.02)
        else:
            col_ = c0[None, None] * (0.97 + 0.06 * fbm(px, 31, 4, 3))[..., None]
        gc = np.array([int(grout[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
        col_ = np.where(inG[..., None], gc * (0.94 + 0.08 * fbm(px, 41, 16, 3))[..., None], col_)
        gy, gx = np.gradient(h, cm)                                            # cm per cm, rows down the picture
        nrm = np.dstack([-gx, gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
        Image.fromarray(np.clip(col_, 0, 255).astype("uint8")).save(HERE / f"{key}_map.jpg", quality=84, optimize=True)
        Image.fromarray(((nrm + 1) * 127.5).clip(0, 255).astype("uint8")).save(HERE / f"{key}_nor.jpg", quality=88, optimize=True)
        Image.fromarray((np.where(inG, rg, rf) * 255).astype("uint8")).resize((px // 2,) * 2, Image.BOX).save(HERE / f"{key}_rough.jpg", quality=88)
        meta[key] = dict(asset="made by build_textures.tiles", size=size, url="", licence="ours")
        print("tiles", key)
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1) + "\n")


if __name__ == "__main__":
    {"--buff": buff, "--rough": rough, "--tiles": tiles}.get((sys.argv[1:] or [""])[0], lambda: main(sys.argv[1]))()
