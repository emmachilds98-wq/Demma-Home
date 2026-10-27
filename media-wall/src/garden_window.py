"""v48: the garden through the 3D room's window, seen from the living room: art/garden_day.webp and art/garden_dusk.webp.

The client's photos of the view (inputs/photo_view_full_24oct.jpg, the whole view; photo_view_wide_24oct.jpg and
photo_view_centre_24oct.jpg fill its edges) were taken from the window upstairs,
one storey above the living room (the roof's tiles show under the window). Each photo's direction was found from the fences, which
run straight out from the house (their vanishing point), and the centre photo was matched to the wide one on fence posts and the
neighbour's shed. The view is rebuilt from the living room's eye, 2.6 m lower, by laying the photos onto the garden (the lawn as a
ground 6.7 m below the camera, a wall 25 m out, the far fence, for the rest) and looking at that from the living room. The result is one perspective
picture from geometry.GARDEN_VIEW's eye, straight out and level; room3d.js hangs it as a plane d out so it lines up from the room.
Needs opencv-python-headless (pip) to run; the outputs are committed."""
import numpy as np, cv2
import geometry as G
from PIL import Image, ImageFilter, ImageDraw, ImageChops, ImageEnhance

IN = str(__import__("pathlib").Path(__file__).resolve().parents[1] / "inputs") + "/"
F = 1400.0                                   # the phone's focal length in pixels (2000 × 1500 frames; checked on the man's height)
CAM_H = 6.7                                  # the upstairs camera above the lawn (m)
EYE = np.array([0.45, -2.6, 0.4])            # the living room's eye (window centre, 150 up, 60 in) from the upstairs camera (m)
WALL = 25.0                                  # the far fence, 25 m out (the client, v49; the lawn runs to the trees at about 17)
TX, TUP, TDN = G.GARDEN_VIEW["tan"]           # the picture spans ±70° across, 40° up, 65° down (tangents)
OW = 4096; OH = int(round(OW * (TUP + TDN) / (2 * TX)))

def Rm(yaw, pitch, roll):   # rows: the camera's right, down and forward in the world (x right, y up, z out); yaw + = right, pitch + = up
    sy, cy, sp, cp = np.sin(yaw), np.cos(yaw), np.sin(pitch), np.cos(pitch)
    fwd = np.array([sy * cp, sp, cy * cp]); right = np.array([cy, 0, -sy]); down = np.array([sp * sy, -cp, sp * cy])
    return np.array([np.cos(roll) * right + np.sin(roll) * down, -np.sin(roll) * right + np.cos(roll) * down, fwd])
CAMS = {   # photo, (yaw, pitch, roll) in degrees, focal length (px); first the one that sees most, then the ones that fill in
    # the full view (the ultra-wide lens, 103° across): fitted to the wide photo on ten points (fence posts, the trampoline, the
    # warehouse, the conifer, the shed), 19 px apart on average; it puts the lawn's end 17.1 m out (the others: 16.6)
    "full": ("photo_view_full_24oct.jpg", (2.0, -6.0, -5.0), 800.0),
    "wide": ("photo_view_wide_24oct.jpg", (20.6, -6.1, 0.0), F),
    "centre": ("photo_view_centre_24oct.jpg", (1.8, -26.3, -1.0), F),
}
def valid(name, h, w):
    m = np.ones((h, w), np.uint8)
    yy, xx = np.mgrid[0:h, 0:w]
    if name == "full": m[xx < 215 + 0.075 * yy] = 0; m[yy > 1462 - xx * 0.043 - 12] = 0                   # the open casement; the gutter
    if name == "wide": m[(xx > 1300) & (yy > 1500 - (xx - 1330) * (230 / 670) - 12)] = 0                 # the roof tiles, bottom right
    if name == "centre": m[yy < 398] = 0; m[yy > 1288] = 0                                              # the transom and above; the gutter and below
    return m

# the rays from the living room's eye, through each pixel of the picture
u = (np.arange(OW) + 0.5) / OW * 2 * TX - TX
v = TUP - (np.arange(OH) + 0.5) / OH * (TUP + TDN)
D = np.stack(np.broadcast_arrays(u[None, :], v[:, None], np.ones((OH, OW))), -1); D /= np.linalg.norm(D, axis=-1, keepdims=True)
with np.errstate(divide="ignore", invalid="ignore"):
    tg = np.where(D[..., 1] < 0, (-CAM_H - EYE[1]) / D[..., 1], np.inf)          # to the lawn
    tw = (WALL - EYE[2]) / D[..., 2]                                               # to the far wall
X = EYE + D * np.minimum(tg, tw)[..., None]                                        # where each ray meets the garden

layers = {}
for name, (fn, (yw, pt, rl), fl) in CAMS.items():
    img = cv2.cvtColor(cv2.imread(IN + fn), cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w = img.shape[:2]; R = Rm(*np.radians([yw, pt, rl]))
    c = X @ R.T
    with np.errstate(divide="ignore", invalid="ignore"):
        mx = (w / 2 + fl * c[..., 0] / c[..., 2]).astype(np.float32); my = (h / 2 + fl * c[..., 1] / c[..., 2]).astype(np.float32)
    mx[c[..., 2] <= 0] = -1; my[c[..., 2] <= 0] = -1
    m = valid(name, h, w)
    dist = cv2.distanceTransform(np.pad(m, 1), cv2.DIST_L2, 5)[1:-1, 1:-1]          # fade out near the frame's edges
    wt = np.clip(dist / 70.0, 0, 1).astype(np.float32)
    col = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    wgt = cv2.remap(wt, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    layers[name] = (col, wgt)

# the living room's own video frame (inputs/photo_garden_window_24oct.jpg) for the ground nearer the house, which the roof hides
# upstairs. Taken from the room (so no garden needed to move it), f 980, turned 7° left, 17° down (fitted on the birches and the shed)
vid = cv2.cvtColor(cv2.imread(IN + "photo_garden_window_24oct.jpg"), cv2.COLOR_BGR2RGB).astype(np.float32)
c = D @ Rm(*np.radians([-7.0, -17.0, 0.0])).T
with np.errstate(divide="ignore", invalid="ignore"):
    mx = (360 + 980 * c[..., 0] / c[..., 2]).astype(np.float32); my = (640 + 980 * c[..., 1] / c[..., 2]).astype(np.float32)
vm = np.zeros(vid.shape[:2], np.uint8); vm[600:1050] = 1                       # the ground only: not the trees, not the window's frame
vwt = np.clip(cv2.distanceTransform(np.pad(vm, 1), cv2.DIST_L2, 5)[1:-1, 1:-1] / 60.0, 0, 1).astype(np.float32)
layers["room"] = (cv2.remap(vid, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0),
                  cv2.remap(vwt, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0))

# in turn: each photo's colour matched to what's already there where both see the same thing (other days, other light), then it
# fills only what the ones before it don't cover
out = np.zeros((OH, OW, 3), np.float32); tot = np.zeros((OH, OW), np.float32)
for name in list(CAMS) + ["room"]:
    col, wgt = layers[name]
    both = (tot > 0.5) & (wgt > 0.5)
    if both.sum() > 1000:
        for k in range(3):
            a, b = col[..., k][both], out[..., k][both] / tot[both]
            col[..., k] = (col[..., k] - a.mean()) * (b.std() / max(a.std(), 1e-3)) + b.mean()
    w2 = wgt * np.clip(1 - tot, 0, 1)
    out += col * w2[..., None]; tot += w2
out /= np.maximum(tot, 1e-6)[..., None]
have = tot > 0.02

# the far left, which neither photo sees: the gardens on the right, mirrored (the fences still run to the same point), then whatever is
# still missing (the sky above the photos, the ground under the roof) pulled in softly from the nearest colours
mir, mw = out[:, ::-1], np.clip(tot, 0, 1)[:, ::-1] * (np.arange(OW) < OW / 2)[None, :]
mw = mw * (1 - np.clip(tot, 0, 1))
out = (out * np.clip(tot, 0, 1)[..., None] + mir * mw[..., None]) / np.maximum(np.clip(tot, 0, 1) + mw, 1e-6)[..., None]
tot = np.clip(tot, 0, 1) + mw
def fill(img, ok):
    pyr = [(img * ok[..., None], ok.astype(np.float32))]
    while min(pyr[-1][1].shape) > 4:
        a, m = pyr[-1]; pyr.append((cv2.pyrDown(a), cv2.pyrDown(m)))
    mean = (img * ok[..., None]).sum((0, 1)) / max(ok.sum(), 1)
    a, m = pyr[-1]; acc = np.where(m[..., None] > 1e-6, a / np.maximum(m, 1e-6)[..., None], mean)
    for a, m in reversed(pyr[:-1]):
        up = cv2.resize(acc, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LINEAR)
        mm = np.clip(m * 4, 0, 1)[..., None]
        acc = a / np.maximum(m, 1e-6)[..., None] * mm + up * (1 - mm)
    return acc
k = np.clip(tot, 0, 1)
filled = fill(out, k)
out = out * k[..., None] + filled * (1 - k[..., None])

day = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
day = ImageEnhance.Color(ImageEnhance.Contrast(day).enhance(1.10)).enhance(1.12)        # a little of the haze off
day.save(str(__import__("pathlib").Path(__file__).resolve().parent / "art") + "/garden_day.webp", quality=80, method=6)

# dusk: blue hour. Exposure down, cooler, less colour; the sky a deep blue fading to dusky lilac at the horizon; the room's own light
# on the ground under the window
d = np.asarray(day).astype(np.float32) / 255; H, W = d.shape[:2]
L = 0.2126 * d[..., 0] + 0.7152 * d[..., 1] + 0.0722 * d[..., 2]
grey = L[..., None]
d2 = grey + (d - grey) * 0.55
d2 = np.power(np.clip(d2, 0, 1), 1.25) * 0.56 * np.array([0.84, 0.93, 1.16])[None, None, :] + np.array([0.015, 0.02, 0.04])
hor = TUP / (TUP + TDN)                                                            # the horizon's row (0..1)
yy = np.linspace(0, 1, H)[:, None]
sat = d.max(-1) - d.min(-1)
sky = np.clip((L - 0.62) / 0.16, 0, 1) * np.clip((hor + 0.04 - yy) / 0.06, 0, 1) * np.clip((0.2 - sat) / 0.12, 0, 1)
sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
top, low = np.array([0.13, 0.17, 0.33]), np.array([0.40, 0.38, 0.52])
t = np.clip(yy / hor, 0, 1)[..., None]
out = d2 * (1 - sky[..., None]) + (top * (1 - t) + low * t) * sky[..., None]
im = Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))
glow = Image.new("L", (W, H), 0); ImageDraw.Draw(glow).ellipse([W * 0.3, H * 0.80, W * 0.7, H * 1.25], fill=150)
glow = glow.filter(ImageFilter.GaussianBlur(120))
im = Image.composite(ImageChops.screen(im, Image.new("RGB", (W, H), (255, 186, 110))), im, glow.point(lambda p: int(p * 0.42)))
im.save(str(__import__("pathlib").Path(__file__).resolve().parent / "art") + "/garden_dusk.webp", quality=80, method=6)
print("garden view", OW, "x", OH)
