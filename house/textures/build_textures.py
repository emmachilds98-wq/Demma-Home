"""v70 (BUILD_SPEC phase 3): CC0 photo-textures from Poly Haven for the house's outside and floors, toned to the client's photos.
    python3 house/textures/build_textures.py <folder of the 2k downloads>     (writes house/textures/<key>_map.jpg / _nor.jpg, 1024 px)
Each comes in as <asset>_diff.jpg and <asset>_nor.jpg (polyhaven.com, CC0); the sources and sizes are in house/SOURCES.md."""
import sys, json, pathlib
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
# key in the viewer: (Poly Haven asset, its real size in m, saturation, brightness, warmth)
SET = {"brick": ("red_brick_03", 1.0, 1.3, 1.22, 1.12),            # the front photo: orange-red stretchers, light mortar
       "tile": ("roof_09", 4.0, 0.75, 0.58, 1.08),                   # the brown interlocking concrete tiles
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
        "paint": ("white_plaster_02", 1.6, "#f1ede5", 4, 0.12), "ceiling": ("white_plaster_02", 1.6, "#f3f2ee", 4, 0.12)}
SRC = {"Carpet012": "https://ambientcg.com/view?id=Carpet012"}
PX = {}                                                          # sizes other than 1024 px (V1.11, the client: "i dont want these low res versions, best textures"; was 512)
# V1.1: the living room's own surfaces, the photo as it is (room3d.js matches each to its drawn texture's average colour as it loads,
# so the parts keep their colours and only the grain, weave and relief are real): key: (asset, real size m, map px, normal px, turn,
# relief). The oak is turned a quarter so its grain runs along the boards, as the drawn oak's does; 0 px leaves that picture out. Veneer
# and smooth plaster have only a hair of relief, gone at 256-512 px: relief scales it so it reads at the room's distance
PLAIN = {"lr_oak": ("oak_veneer_01", 0.6, 2048, 1024, True, 6), "lr_hessian": ("hessian_380", 0.6, 1024, 1024, False, 1.5),   # V1.11: twice as sharp
         "lr_cord": ("ribbed_corduroy", 0.6, 0, 1024, False, 1.5), "lr_plaster": ("white_plaster_02", 1.6, 0, 1024, False, 6)}


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


def main(src):
    src = pathlib.Path(src); meta = json.loads((HERE / "textures.json").read_text()) if (HERE / "textures.json").exists() else {}
    jobs = [(k, a, sz, lambda d, t=t: tone(d, *t), 1) for k, (a, sz, *t) in SET.items()] + [(k, a, sz, lambda d, c=c, x=x: tint(d, c, *x[1:2]), (x or [1])[0]) for k, (a, sz, c, *x) in TINT.items()]
    for key, aid, size, look, rk in jobs:
        if not (src / f"{aid}_diff.jpg").exists():          # keep what's built when a download isn't to hand
            continue
        px = PX.get(key, 1024)
        d = Image.open(src / f"{aid}_diff.jpg").convert("RGB").resize((px, px), Image.LANCZOS)
        look(d).save(HERE / f"{key}_map.jpg", quality=78, optimize=True)
        n = src / f"{aid}_nor.jpg"
        if n.exists():
            relief(Image.open(n).convert("RGB").resize((px, px), Image.LANCZOS), rk).save(HERE / f"{key}_nor.jpg", quality=82, optimize=True)
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
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1))
    print("textures", len(meta))


if __name__ == "__main__":
    main(sys.argv[1])
