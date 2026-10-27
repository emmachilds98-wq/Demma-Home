"""v70 (BUILD_SPEC phase 3): CC0 photo-textures from Poly Haven for the house's outside and floors, toned to the client's photos.
    python3 house/textures/build_textures.py <folder of the 1k downloads>     (writes house/textures/<key>_map.jpg / _nor.jpg, 512 px)
Each comes in as <asset>_diff.jpg and <asset>_nor.jpg (polyhaven.com, CC0); the sources and sizes are in house/SOURCES.md."""
import sys, json, pathlib
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
# key in the viewer: (Poly Haven asset, its real size in m, saturation, brightness, warmth)
SET = {"brick": ("red_brick_03", 1.0, 1.3, 1.22, 1.12),            # the front photo: orange-red stretchers, light mortar
       "tile": ("roof_09", 4.0, 0.75, 0.58, 1.08),                   # the brown interlocking concrete tiles
       "lawn": ("sparse_grass", 2.0, 1.15, 1.35, 1.0),
       "concrete": ("brushed_concrete", 2.5, 0.6, 1.25, 1.0),       # the drive
       "road": ("asphalt_02", 3.0, 0.8, 1.0, 1.0),
       "paving": ("rectangular_paving", 2.0, 0.6, 1.15, 1.0),       # the pavement
       "laminate": ("laminate_floor_02", 1.7, 0.25, 0.95, 1.0)}     # the WC's and the lower landing's grey wood-effect
# v72 (B3): the carpets, from ambientCG (CC0; its _Color and _NormalGL saved as <asset>_diff / _nor): the pile tinted to the
# photos' colour (the grey of the bedrooms, landing, hall and stairs; the oatmeal elsewhere) so its light and shade stay, the hue is ours
TINT = {"carpet_grey": ("Carpet012", 0.5, "#6f6f73"), "carpet": ("Carpet012", 0.5, "#cdbfa6")}
SRC = {"Carpet012": "https://ambientcg.com/view?id=Carpet012"}
PX = {}                                                          # sizes other than 512 px (the carpets at 0.5 m are already 1 px a mm)


def tone(im, sat, bri, warm):
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Brightness(im).enhance(bri)
    if warm != 1.0:
        r, g, b = im.split()
        r = r.point(lambda v: min(255, int(v * warm))); b = b.point(lambda v: int(v / warm))
        im = Image.merge("RGB", (r, g, b))
    return im


def tint(im, col):
    """the picture's light and shade (its grey, scaled so its mean is the colour's) in the colour's hue"""
    from PIL import ImageStat
    g = im.convert("L"); m = ImageStat.Stat(g).mean[0] or 1
    c = [int(col[i:i + 2], 16) for i in (1, 3, 5)]
    return Image.merge("RGB", [g.point(lambda v, k=k: min(255, int(v * k / m))) for k in c])


def main(src):
    src = pathlib.Path(src); meta = json.loads((HERE / "textures.json").read_text()) if (HERE / "textures.json").exists() else {}
    jobs = [(k, a, sz, lambda d, t=t: tone(d, *t)) for k, (a, sz, *t) in SET.items()] + [(k, a, sz, lambda d, c=c: tint(d, c)) for k, (a, sz, c) in TINT.items()]
    for key, aid, size, look in jobs:
        if not (src / f"{aid}_diff.jpg").exists():          # keep what's built when a download isn't to hand
            continue
        px = PX.get(key, 512)
        d = Image.open(src / f"{aid}_diff.jpg").convert("RGB").resize((px, px), Image.LANCZOS)
        look(d).save(HERE / f"{key}_map.jpg", quality=78, optimize=True)
        n = src / f"{aid}_nor.jpg"
        if n.exists():
            Image.open(n).convert("RGB").resize((px, px), Image.LANCZOS).save(HERE / f"{key}_nor.jpg", quality=82, optimize=True)
        meta[key] = dict(asset=aid, size=size, url=SRC.get(aid, f"https://polyhaven.com/a/{aid}"), licence="CC0")
    (HERE / "textures.json").write_text(json.dumps(meta, indent=1))
    print("textures", len(meta))


if __name__ == "__main__":
    main(sys.argv[1])
