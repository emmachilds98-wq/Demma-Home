"""Media wall concept render, v12 (v11 layout; v12 adds the dining view for six and the west end):
v11: drawn to the real room (alcove 186 × 38, ceiling 235) in cm,
with a simple one-point perspective. Every dimension comes from geometry.py.
v11: the TV 25 cm nearer the side wall, the turntable and Series X in the right-hand zone, records in bay 3,
the record ledge wrapping round onto the side wall with the PC above the sofa, the fold-down dining wall on the
chimney breast (folded, or set for four) and a second spot bar.
Usage: python3 render.py  -> v11_*.svg (then shot.py for PNGs)
"""
import math, random
import geometry as G

W, H = 2200, 1400
SHIFT = 205         # scene drawn lower so the ceiling, the rose and the spotlight bar fit in frame
S = 4.15            # px per cm at the breast-face plane (z = 0)
X0, Y0 = 470, 1000  # px of the east wall / floor at z = 0
EYE_X, EYE_Y = 120.0, 112.0   # camera: between the TV and the turntable, seated eye height
VX = X0 + EYE_X * S
VY = Y0 - EYE_Y * S
D = 505.0           # camera distance in front of the breast face, cm

XOFF = YOFF = ZOFF = 0.0   # offsets applied by P(), used to place whole groups
REC = None                 # v14: a list while recording boxes for the 3D viewer (see export3d.py)
CAM_DEFAULT = (EYE_X, X0, S, SHIFT)


def camera(eye_x, x0, s, shift):
    """Move the camera. The default looks at the alcove; the dining view (v12) stands in line with the breast's reveal,
    so nothing in the alcove hides behind the breast, and pulls back to take in the west end and the second bar."""
    global EYE_X, X0, S, SHIFT, VX, VY
    EYE_X, X0, S, SHIFT = eye_x, x0, s, shift
    VX = X0 + EYE_X * S
    VY = Y0 - EYE_Y * S


# v12: the default view pulls back (4.15 -> 3.4 px/cm) so the whole south wall fits, from the PC on the side wall to the
# second spot bar by the door and the stairwell; v11's tighter framing is CAM_V11.
CAM_V11 = CAM_DEFAULT
CAM_DEFAULT = (120.0, 290.0, 3.4, 150)
camera(*CAM_DEFAULT)

CEIL, ALC_W, ALC_D = G.CEIL, G.ALC_W, G.ALC_D
WORKTOP = G.WORKTOP
RAISE = G.PLINTH     # bays 1-2 stand on a 9 cm plinth
UP_L, UP_R = G.UP_L, G.UP_R
# v38: MW_SWAP mirrors the upper wall (MX, about the alcove's middle) and moves bays 1 and 3 whole (B1X, B3X)
MX = (lambda x: ALC_W - x) if G.MW_SWAP else (lambda x: x)
B1X = G.BAYS[0][0] - G.FILLER
B3X = G.BAYS[2][0] - G.FILLER - 2 * G.BAY_W
RZ_GX = UP_L[1] - 2.25 if G.MW_SWAP else UP_R[0] + 2.25   # the groove behind the upright beside the turntable zone
DECO_X = (UP_R[0] if G.MW_SWAP else ALC_W) - 4.0 - 11.0    # Deco B on the high shelf's breast end, by the Cat6 corner
# the high shelf: books (56 cm of them) and the lidded box over the TV; v38 moves the framed print over the turntable, beside the 7-inch
BOOKS_END = UP_L[1] + 57.5 if G.MW_SWAP else 62.0
BOX_X = UP_L[1] + 65.0 if G.MW_SWAP else 70.0
PRINT_X = G.RZ[0] + 27.0 if G.MW_SWAP else 106.0
BX1 = G.BREAST_X[1]  # west edge of the chimney breast
STYLE = "joinery"    # "joinery" (main) or "slats"
STAIRS_3D = False    # v38: export3d sets it while recording the stairwell (the 3D room builds the flight itself)


def at(off, fn, *a, **kw):
    """Draw fn() lifted by off cm."""
    return place(0, off, 0, fn, *a, **kw)


def place(dx, dy, dz, fn, *a, **kw):
    """Draw fn() with its local coordinates shifted by (dx, dy, dz) cm."""
    global XOFF, YOFF, ZOFF
    old = (XOFF, YOFF, ZOFF)
    XOFF, YOFF, ZOFF = XOFF + dx, YOFF + dy, ZOFF + dz
    try:
        return fn(*a, **kw)
    finally:
        XOFF, YOFF, ZOFF = old


VIEW = "front"   # "front": looking at the media wall (south); "side": looking at the side (east) wall, v12


def cam_pos():
    """The camera's position in room coordinates."""
    return (D, EYE_Y, EYE_X) if VIEW == "side" else (EYE_X, EYE_Y, -D)


class P3(tuple):
    """v14: a projected point that remembers where it is in the room, so a recorded polygon can be rebuilt in 3D."""


def P(x, y, z):
    x, y, z = x + XOFF, y + YOFF, z + ZOFF
    w = (x, y, z)
    if VIEW == "side":       # across the picture = along the side wall (z), depth = distance from it (x)
        x, z = z, -x
    k = D / (D + z)
    q = (VX + (X0 + x * S - VX) * k, VY + (Y0 - y * S - VY) * k)
    if REC is None:
        return q
    q = P3(q)
    q.w = tuple(round(v, 2) for v in w)
    return q


def K(z, x=0.0):
    """Perspective scale at local depth z (px per cm = S * K); the side view measures depth along x."""
    if VIEW == "side":
        return D / (D - (x + XOFF))
    return D / (D + z + ZOFF)


def pts(*p):
    return " ".join(f"{a:.1f},{b:.1f}" for a, b in p)


def poly(points, fill, extra=""):
    if REC is not None and fill != "none" and points and all(isinstance(q, P3) for q in points):
        REC.append(("poly", [q.w for q in points], fill, extra))
    return f'<polygon points="{pts(*points)}" fill="{fill}" {extra}/>'


def quad_front(x, y, z, w, h, fill, extra=""):
    return poly([P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)], fill, extra)


def box(x, y, z, w, h, d, front, top=None, side=None, bottom=None, extra=""):
    """Axis-aligned box. (x,y,z) = front-bottom-left; extends +x, +y (up), +z (back).
    Side faces are culled against the camera in world coordinates (offsets included)."""
    top = top or front
    side = side or front
    bottom = bottom or side
    gx, gy, gz = x + XOFF, y + YOFF, z + ZOFF
    if REC is not None:   # v14: the 3D viewer's scene is every box the renderer draws, in room coordinates
        REC.append((round(gx, 2), round(gy, 2), round(gz, 2), round(w, 2), round(h, 2), round(d, 2), front, top, side, extra))
    cx, cy, cz = cam_pos()
    out = []
    if cx > gx + w:      # right (+x) face visible
        out.append(poly([P(x + w, y, z), P(x + w, y, z + d), P(x + w, y + h, z + d), P(x + w, y + h, z)], side, extra))
    if cx < gx:          # left face visible
        out.append(poly([P(x, y, z), P(x, y, z + d), P(x, y + h, z + d), P(x, y + h, z)], side, extra))
    if cy > gy + h:      # top visible
        out.append(poly([P(x, y + h, z), P(x + w, y + h, z), P(x + w, y + h, z + d), P(x, y + h, z + d)], top, extra))
    if cy < gy:          # underside visible
        out.append(poly([P(x, y, z), P(x + w, y, z), P(x + w, y, z + d), P(x, y, z + d)], bottom, extra))
    if cz > gz + d:      # back face (only the side view sees one)
        out.append(quad_front(x, y, z + d, w, h, side, extra))
    if cz < gz:          # front face
        out.append(quad_front(x, y, z, w, h, front, extra))
    if REC is not None:  # the box is already recorded whole: drop the faces poly() just recorded for it
        while REC and REC[-1][0] == "poly":
            REC.pop()
    return "\n".join(out)


def path(pts_, col, w=2.4, dash="7 5", op=0.95):
    q = [P(*p) for p in pts_]
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in q)
    da = f'stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" {da} opacity="{op}" stroke-linejoin="round"/>'


def art_on(q, blocks):
    """Paint simple rectangles of colour onto a projected quad q (bl, br, tr, tl): sleeve art."""
    def L(u, v):
        bl, br, tr, tl = q
        bx_ = bl[0] + (br[0] - bl[0]) * u; by_ = bl[1] + (br[1] - bl[1]) * u
        tx_ = tl[0] + (tr[0] - tl[0]) * u; ty_ = tl[1] + (tr[1] - tl[1]) * u
        return (bx_ + (tx_ - bx_) * v, by_ + (ty_ - by_) * v)
    if REC is not None and all(isinstance(p_, P3) for p_ in q):   # v14.1: the 3D export gets the sleeve art too
        bl, br, tr, tl = (p_.w for p_ in q)
        nx = [(br[i] - bl[i]) for i in range(3)]; ny = [(tl[i] - bl[i]) for i in range(3)]
        nrm = [nx[1] * ny[2] - nx[2] * ny[1], nx[2] * ny[0] - nx[0] * ny[2], nx[0] * ny[1] - nx[1] * ny[0]]
        ln = math.sqrt(sum(c * c for c in nrm)) or 1.0
        def L3(u, v, k):   # bilinear on the quad, lifted off it (towards the viewer) a little more for each layer
            pt = [bl[i] + nx[i] * u + ny[i] * v + (tr[i] - br[i] - ny[i]) * u * v - nrm[i] / ln * 0.06 * (k + 1) for i in range(3)]
            q_ = P3(L(u, v)); q_.w = tuple(round(c, 3) for c in pt); return q_
        return "\n".join(poly([L3(u1, v1, k), L3(u2, v1, k), L3(u2, v2, k), L3(u1, v2, k)], c) for k, (c, u1, u2, v1, v2) in enumerate(blocks))
    return "\n".join(poly([L(u1, v1), L(u2, v1), L(u2, v2), L(u1, v2)], c) for (c, u1, u2, v1, v2) in blocks)

# ---------------------------------------------------------------- shared with v9 (unchanged drawings)
def ellipse_flat(cx, y, cz, rx, rz, fill, extra="", n=48):
    """Horizontal ellipse/circle on the plane at height y."""
    p = [P(cx + rx * math.cos(t), y, cz + rz * math.sin(t)) for t in [2 * math.pi * i / n for i in range(n)]]
    return poly(p, fill, extra)

def text(x, y, s, size=13, anchor="start", weight=500, fill="#f3ead8", op=1.0, extra=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="Inter, sans-serif" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" fill-opacity="{op}" text-anchor="{anchor}" '
            f'paint-order="stroke" stroke="#10241b" stroke-opacity="0.55" stroke-width="3" '
            f'stroke-linejoin="round" {extra}>{s}</text>')

G_WALL   = "#2f5b46"   # deep green, lit wall facing camera

G_LEFT0  = "#21443a"   # left wall, near camera (darker)

G_LEFT1  = "#2a5141"   # left wall, near alcove

G_REVR   = "#28503e"

G_REVT   = "#1d3d30"

G_FELT   = "#16271f"

G_FRAME  = "#2d5a44"

G_FRAME_T = "#3a6b53"

G_FRAME_S = "#244a38"

GH = 'filter="url(#grainH)"'; GV = 'filter="url(#grainV)"'

OAK = "#c48c57"; OAK_T = "#d9a46c"; OAK_S = "#9c6a3f"; OAK_D = "#a87443"

BLK = "#18191a"; BLK_T = "#2a2c2e"; BLK_S = "#0e0f10"

WHT = "#ece9e2"; WHT_T = "#f7f5f0"; WHT_S = "#cfcac0"

def defs():
    return f'''<defs>
  <linearGradient id="leftwall" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{G_LEFT0}"/><stop offset="1" stop-color="{G_LEFT1}"/></linearGradient>
  <linearGradient id="rightwall" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{G_LEFT1}"/><stop offset="1" stop-color="{G_LEFT0}"/></linearGradient>
  <pattern id="brick" width="22" height="15" patternUnits="userSpaceOnUse">
    <rect width="22" height="15" fill="#9d5b3f"/><path d="M0 7.5H22M0 15H22M11 0V7.5M0 7.5V15M22 7.5V15" stroke="#c9b9a3" stroke-width="1.1"/></pattern>
  <linearGradient id="backwall" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2c5643"/><stop offset="1" stop-color="#2a5340"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9a9c9f"/><stop offset="1" stop-color="#77797c"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1b1638"/><stop offset="0.45" stop-color="#4a2d5e"/>
    <stop offset="0.72" stop-color="#c0566a"/><stop offset="0.88" stop-color="#f2a65e"/>
    <stop offset="1" stop-color="#f6c97c"/></linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff2c4" stop-opacity="1"/><stop offset="0.35" stop-color="#ffd68a" stop-opacity="0.7"/>
    <stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
  <radialGradient id="bias" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#eef3ff" stop-opacity="0.55"/><stop offset="0.6" stop-color="#d9e4ff" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#d9e4ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="ledDown" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffcf8a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient>
  <linearGradient id="bayLight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f6dcae"/><stop offset="1" stop-color="#b99c74"/></linearGradient>
  <linearGradient id="bayLightW" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4f1ea"/><stop offset="1" stop-color="#cdc7bb"/></linearGradient>
  <linearGradient id="bayBack" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3b3226"/><stop offset="1" stop-color="#1c1813"/></linearGradient>
  <linearGradient id="seriesGlow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3dff8a" stop-opacity="0.55"/><stop offset="1" stop-color="#3dff8a" stop-opacity="0"/></linearGradient>
  <linearGradient id="pot" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#b8603c"/><stop offset="1" stop-color="#d0794f"/></linearGradient>
  <linearGradient id="art1" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e9b44c"/><stop offset="0.5" stop-color="#e2683c"/><stop offset="1" stop-color="#7a2e5a"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.05"/></linearGradient>
  <radialGradient id="pcglow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#40e0b0" stop-opacity="0.35"/><stop offset="1" stop-color="#40e0b0" stop-opacity="0"/></radialGradient>
  <radialGradient id="warmpool" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffc77a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffc77a" stop-opacity="0"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="grainV" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.55 0.012" numOctaves="2" seed="4" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.16  0 0 0 0 0.06  1.5 0 0 0 -0.62" result="s"/>
    <feComposite in="s" in2="SourceGraphic" operator="in" result="c"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="c"/></feMerge></filter>
  <filter id="grainH" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.010 0.5" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.16  0 0 0 0 0.06  1.5 0 0 0 -0.62" result="s"/>
    <feComposite in="s" in2="SourceGraphic" operator="in" result="c"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="c"/></feMerge></filter>
  <linearGradient id="shadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.30"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="shadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="shadeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="ledWash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3b3" stop-opacity="0.42"/><stop offset="1" stop-color="#ffe3b3" stop-opacity="0"/></linearGradient>
  <radialGradient id="lantern" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.7" stop-color="#fbeed6"/><stop offset="1" stop-color="#ecd7b0"/></radialGradient>
  <radialGradient id="lanternGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd896" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd896" stop-opacity="0"/></radialGradient>
  <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>'''

def _line(a, b, col, w=1.2, extra=""):
    return f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{col}" stroke-width="{w}" {extra}/>'

def xbox360(x, y, z):
    """Original Xbox 360 lying flat: 30.9 W x 8.3 H x 25.8 D. White body, grey vent panel on top,
    concave front with disc tray slot, ring-of-light power button at the right."""
    o = [box(x, y, z, 30.9, 8.3, 25.8, "#ecebe6", "#f5f4f0", "#d6d4ce")]
    # grey vent panel on the top surface (the side intake when stood upright)
    o.append(poly([P(x + 2.5, y + 8.31, z + 3), P(x + 28.4, y + 8.31, z + 3), P(x + 28.4, y + 8.31, z + 23), P(x + 2.5, y + 8.31, z + 23)], "#b9b8b3"))
    for i in range(9):
        zz = z + 4.5 + i * 2.0
        o.append(_line(P(x + 3.5, y + 8.32, zz), P(x + 27.4, y + 8.32, zz), "#9c9b96", 0.8))
    # concave front: slightly darker inset band, disc tray slot, ring of light, eject, USB flap
    o.append(quad_front(x + 1.0, y + 0.9, z - 0.01, 28.9, 6.5, "#e3e2dc"))
    o.append(quad_front(x + 2.0, y + 5.2, z - 0.02, 20.5, 0.45, "#7d7c78"))
    c = P(x + 26.6, y + 4.6, z - 0.03)
    r = 1.6 * S * K(z)
    o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r:.1f}" fill="#f7f7f4" stroke="#b5b4af" stroke-width="1"/>')
    o.append(f'<path d="M{c[0]:.1f},{c[1]-r*0.8:.1f} A{r*0.8:.1f},{r*0.8:.1f} 0 0 1 {c[0]+r*0.8:.1f},{c[1]:.1f}" fill="none" stroke="#61d04f" stroke-width="2"/>')
    o.append(quad_front(x + 23.0, y + 4.1, z - 0.03, 1.4, 0.9, "#cfcec9"))
    o.append(quad_front(x + 22.2, y + 1.4, z - 0.03, 6.0, 1.6, "#dad9d4"))
    return "\n".join(o)

def xboxone(x, y, z):
    """Original Xbox One: 33.3 W x 7.9 H x 27.4 D. Black; glossy left of the top, vented right;
    slot-loading drive at the front left, white Xbox button at the front right."""
    o = [box(x, y, z, 33.3, 7.9, 27.4, "#161718", "#1b1c1e", "#0e0f10")]
    o.append(poly([P(x + 0.3, y + 7.91, z + 0.3), P(x + 19, y + 7.91, z + 0.3), P(x + 19, y + 7.91, z + 27), P(x + 0.3, y + 7.91, z + 27)], "#2e3033"))
    for i in range(12):
        xx = x + 20 + i * 1.1
        o.append(_line(P(xx, y + 7.92, z + 1.5), P(xx, y + 7.92, z + 26), "#0b0b0c", 0.9))
    o.append(quad_front(x + 2.5, y + 4.8, z - 0.01, 14.5, 0.35, "#050505"))
    c = P(x + 31.0, y + 4.3, z - 0.02)
    o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="3.4" fill="#f4f4f4" opacity="0.92"/>')
    o.append(quad_front(x + 26.0, y + 1.6, z - 0.02, 1.4, 0.5, "#3a3b3e"))
    return "\n".join(o)

def ps1(x, y, z):
    """Original PlayStation: 27 W x 6 H x 18.8 D. Grey; round disc lid on the top left with three
    round buttons beside it; two controller ports and two memory card slots on the front."""
    o = [box(x, y, z, 27, 6.0, 18.8, "#c3c1bc", "#d2d0cb", "#a9a7a1")]
    # lid (raised round area) and its ring
    o.append(ellipse_flat(x + 10, y + 6.01, z + 10.2, 6.6, 6.6, "#b9b7b2"))
    o.append(ellipse_flat(x + 10, y + 6.02, z + 10.2, 5.6, 5.6, "#c8c6c1"))
    o.append(ellipse_flat(x + 10, y + 6.03, z + 10.2, 1.0, 1.0, "#8f8d88"))
    for (bx_, bz_) in [(x + 21.5, z + 5.0), (x + 21.5, z + 9.5), (x + 21.5, z + 14.0)]:
        o.append(ellipse_flat(bx_, y + 6.03, bz_, 1.1, 1.1, "#9e9c97"))
    # front: memory card slots above, controller ports below
    for xx in (x + 3.0, x + 9.5):
        o.append(quad_front(xx, y + 3.9, z - 0.01, 4.6, 0.45, "#4a4945"))
        o.append(quad_front(xx + 0.4, y + 1.2, z - 0.01, 3.8, 1.6, "#3a3936"))
    o.append(quad_front(x + 17.0, y + 0.6, z - 0.01, 9.5, 0.25, "#a9a7a1"))
    return "\n".join(o)

def ps2(x, y, z):
    """Original ('fat') PS2 lying flat: 30.2 W x 7.8 H x 18.3 D. Black; disc tray across the upper
    front, ports at the lower left, reset/eject at the right, blue PS logo strip."""
    o = [box(x, y, z, 30.2, 7.8, 18.3, "#141416", "#1d1e21", "#0c0c0d")]
    for i in range(10):     # ribbed top
        zz = z + 1.5 + i * 1.6
        o.append(_line(P(x + 1.0, y + 7.81, zz), P(x + 29.2, y + 7.81, zz), "#0a0a0b", 0.8))
    o.append(quad_front(x + 0.6, y + 4.0, z - 0.01, 29.0, 3.2, "#1c1d20"))     # tray face
    o.append(quad_front(x + 0.6, y + 3.9, z - 0.02, 29.0, 0.15, "#000"))
    o.append(quad_front(x + 2.0, y + 4.6, z - 0.02, 0.8, 2.0, "#2c4bb0"))     # vertical logo strip
    for xx in (x + 4.0, x + 8.4):
        o.append(quad_front(xx, y + 2.3, z - 0.02, 3.4, 0.35, "#050505"))   # memory card slots
        o.append(quad_front(xx + 0.2, y + 0.6, z - 0.02, 3.0, 1.2, "#050505"))  # controller ports
    o.append(quad_front(x + 25.0, y + 1.4, z - 0.02, 1.5, 0.9, "#2e7d3c"))   # reset (green)
    o.append(quad_front(x + 27.0, y + 1.4, z - 0.02, 1.5, 0.9, "#2b55c8"))   # eject (blue)
    return "\n".join(o)

def ps3(x, y, z):
    """Original PS3: 32.5 W x 9.8 H x 27.4 D. Glossy black with a silver band and slot drive."""
    o = [box(x, y, z, 32.5, 9.8, 27.4, "#121214", "#2f3035", "#0a0a0b")]
    o.append(poly([P(x + 1, y + 9.81, z + 1), P(x + 31.5, y + 9.81, z + 1), P(x + 31.5, y + 9.81, z + 11), P(x + 1, y + 9.81, z + 11)], "#3a3b41", 'opacity="0.6"'))
    o.append(quad_front(x + 0.4, y + 3.0, z - 0.01, 31.7, 0.35, "#8e9096"))     # silver band
    o.append(quad_front(x + 4.0, y + 6.4, z - 0.02, 16.0, 0.3, "#000"))       # disc slot
    o.append(quad_front(x + 27.0, y + 6.2, z - 0.02, 1.0, 0.5, "#3c3d42"))
    o.append(quad_front(x + 29.0, y + 6.2, z - 0.02, 1.0, 0.5, "#3c3d42"))
    return "\n".join(o)

REC_OPEN = 0.0      # lower record drawer

REC_OPEN_UP = 0.0   # upper record drawer

def _lq(q, u, v):
    """A point inside a quad (bottom-left, bottom-right, top-right, top-left) at (u, v)."""
    bl, br, tr, tl = q
    bx_ = bl[0] + (br[0] - bl[0]) * u; by_ = bl[1] + (br[1] - bl[1]) * u
    tx_ = tl[0] + (tr[0] - tl[0]) * u; ty_ = tl[1] + (tr[1] - tl[1]) * u
    return (bx_ + (tx_ - bx_) * v, by_ + (ty_ - by_) * v)


def _lip(x1, x2, yb, oz, h=5.0, pull=14.0):
    """An oak drawer lip with the finger pull cut in its underside, centred."""
    o = [box(x1, yb, oz - 0.6, x2 - x1, h, 1.5, OAK, OAK_T, OAK_S, extra=GH)]
    cx = (x1 + x2) / 2
    a, b = P(cx - pull / 2, yb + h, oz - 0.61), P(cx + pull / 2, yb + h, oz - 0.61)
    o.append(f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{(a[0]+b[0])/2:.1f},{a[1]+7:.1f} {b[0]:.1f},{b[1]:.1f}Z" fill="#7a5130"/>')
    return "\n".join(o)


PLY, PLY_T, PLY_S = "#d9c09a", "#e8d3b0", "#b99e78"


def record_tier(yb, open_cm, part="all"):
    """v16: a face-out LP crate in bay 3's right-hand column, under the turntable (absolute x). Box 34.86 x 40 on 400 mm runners:
    9 mm sides, 12 mm base with a felt top, a low front; the LPs lean back 10 degrees in a 33 cm trough, the snug width record shops
    use, and flip by their top edges. About 90 LPs a crate."""
    o = []
    oz = -open_cm
    bx1, bx2 = G.REC_BOX_X
    if part == "lip":
        return _lip(bx1 - 0.7, bx2 + 0.7, yb, oz)
    ix1, ix2 = bx1 + 0.9, bx2 - 0.9
    yt = yb + 1.2
    if open_cm > 0:
        o.append(poly([P(bx1, 0.05, oz), P(bx2 + 3, 0.05, oz), P(bx2 + 3, 0.05, oz + 34), P(bx1, 0.05, oz + 34)], "#000", 'opacity="0.2" filter="url(#soft)"'))
    o.append(box(bx1, yb, oz + 39.1, bx2 - bx1, 12, 0.9, PLY, PLY_T, PLY_S))            # back
    o.append(box(bx1, yb, oz, 0.9, 12, 40, PLY, PLY_T, "#ead7b6"))                      # left side
    o.append(box(bx1, yb, oz, bx2 - bx1, 1.2, 40, "#cdb38a", "#5a5148"))               # base, felt top
    lean = math.radians(10)
    hgt, dzl = G.LP * math.cos(lean), G.LP * math.sin(lean)
    x1 = ix1 + (G.TRAY_INSIDE - G.LP) / 2
    x2 = x1 + G.LP
    cols = ["#2c2c2c", "#e9e3d3", "#3a6ea5", "#c8452f", "#f0c24b", "#1f1f1f", "#6a8f5a", "#b3307a", "#efe6d2", "#2f3e5c", "#d27a2e"]
    for i, col in enumerate(cols):
        zb = oz + 31.0 - i * 2.6
        q = [P(x1, yt, zb), P(x2, yt, zb), P(x2, yt + hgt, zb + dzl), P(x1, yt + hgt, zb + dzl)]
        o.append(poly(q, col, 'stroke="#000" stroke-opacity="0.25" stroke-width="0.6"'))
    zf = oz + 2.6
    fq = [P(x1, yt, zf), P(x2, yt, zf), P(x2, yt + hgt, zf + dzl), P(x1, yt + hgt, zf + dzl)]
    art = ([("#f1e7d0", 0, 1, 0, 1), ("#e8603c", 0.08, 0.92, 0.55, 0.92), ("#24427a", 0.08, 0.58, 0.12, 0.5), ("#f1b83f", 0.62, 0.92, 0.12, 0.5)]
           if yb < 10 else
           [("#1f3a52", 0, 1, 0, 1), ("#e9b44c", 0, 1, 0, 0.42), ("#d8613e", 0.12, 0.88, 0.5, 0.9), ("#f5e6c6", 0.35, 0.65, 0.58, 0.82)])
    for (c, u1, u2, v1, v2) in art:
        o.append(poly([_lq(fq, u1, v1), _lq(fq, u2, v1), _lq(fq, u2, v2), _lq(fq, u1, v2)], c))
    o.append(poly(fq, "none", 'stroke="#000" stroke-opacity="0.3" stroke-width="0.8"'))
    if yb < 10:
        cc = _lq(fq, 0.5, 0.71)
        o.append(f'<circle cx="{cc[0]:.1f}" cy="{cc[1]:.1f}" r="10" fill="#1b1b1b"/>')
        o.append(f'<circle cx="{cc[0]:.1f}" cy="{cc[1]:.1f}" r="3.6" fill="#e8603c"/>')
    o.append(box(ix2, yb, oz, 0.9, 12, 40, PLY, PLY_T, PLY_S))                          # right side
    o.append(box(bx1, yb, oz, bx2 - bx1, 4.5, 0.9, PLY, PLY_T, PLY_S))                  # low front panel
    if open_cm > 0:
        a, b = P(bx2 + 0.05, yb + 6, oz + 1), P(bx2 + 0.05, yb + 6, oz + 38)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#9aa0a6" stroke-width="5"/>')
        o.append(record_tier(yb, open_cm, "lip"))
    return "\n".join(o)


SLIM_OPEN = 0.0      # how far the middle slim drawer (games) is out


GAME_ARTS = [("#1d2f6b", [(0, 1, 0.88, 1, "#0f0f12"), (0.06, 0.94, 0.1, 0.84, "#2a5aa6"), (0.15, 0.85, 0.5, 0.78, "#f1e7d0"), (0.25, 0.75, 0.16, 0.44, "#e8603c")]),
             ("#2c8f3e", [(0, 1, 0.86, 1, "#3fae54"), (0.08, 0.92, 0.1, 0.8, "#1a2a3a"), (0.2, 0.8, 0.45, 0.72, "#e0b43a"), (0.3, 0.7, 0.18, 0.4, "#c84b34")]),
             ("#202226", [(0, 1, 0.87, 1, "#0d0d0f"), (0.07, 0.93, 0.1, 0.83, "#7b2d3a"), (0.18, 0.82, 0.46, 0.74, "#f0c24b"), (0.3, 0.7, 0.14, 0.38, "#efe6d2")])]


def slim_drawer(d, open_cm, part="all"):
    """v16: one of the three slim drawers in bay 3's left-hand column (absolute x): 6 mm birch-ply box 15.26 x 40 on 400 mm runners,
    14.06 inside. "games": DVD-size cases face-out, leaning back 10 degrees, flipped like the records (about 22 a drawer);
    "pads": two pads on edge each side of a divider strip, the TV and soundbar remotes, and a USB-C charging lead through the back."""
    o = []
    oz = -open_cm
    yb = d["yb"]
    bx1, bx2 = G.SLIM_BOX_X
    if part == "lip":
        return _lip(bx1 - 0.6, bx2 + 0.6, yb, oz, 5.0, 8.0)
    t = G.SLIM_SIDE
    ix1, ix2 = bx1 + t, bx2 - t
    yt = yb + 1.2
    if open_cm > 0:
        o.append(poly([P(bx1, 0.05, oz), P(bx2 + 3, 0.05, oz), P(bx2 + 3, 0.05, oz + 34), P(bx1, 0.05, oz + 34)], "#000", 'opacity="0.2" filter="url(#soft)"'))
    o.append(box(bx1, yb, oz + 40 - t, bx2 - bx1, 10, t, PLY, PLY_T, PLY_S))           # back
    o.append(box(bx1, yb, oz, t, 10, 40, PLY, PLY_T, "#ead7b6"))                       # left side
    o.append(box(bx1, yb, oz, bx2 - bx1, 1.2, 40, "#cdb38a", "#5a5148"))              # base, felt top
    if d["kind"] == "games":
        lean = math.radians(10)
        cw, ch, ct = G.GAME_CASE
        hgt, dzl = ch * math.cos(lean), ch * math.sin(lean)
        x1 = ix1 + (G.SLIM_INSIDE - cw) / 2
        x2 = x1 + cw
        n = 9
        for i in range(n - 1, -1, -1):
            zb = oz + 2.6 + i * 1.45 * 2.4
            col, art = GAME_ARTS[(i + (0 if yb < 10 else 1)) % len(GAME_ARTS)]
            q = [P(x1, yt, zb), P(x2, yt, zb), P(x2, yt + hgt, zb + dzl), P(x1, yt + hgt, zb + dzl)]
            o.append(poly(q, col, 'stroke="#000" stroke-opacity="0.3" stroke-width="0.6"'))
            if i == 0:
                for (u1, u2, v1, v2, c) in art:
                    o.append(poly([_lq(q, u1, v1), _lq(q, u2, v1), _lq(q, u2, v2), _lq(q, u1, v2)], c))
    else:
        pw, pd, ph = G.PAD
        o.append(box(ix1 + G.SLIM_INSIDE / 2 - 0.3, yt, oz + 1.5, 0.6, 5, 37, PLY, PLY_T, PLY_S))   # centre strip
        for k, (xa, col) in enumerate([(ix1 + 0.2, "#f2f2f0"), (ix1 + G.SLIM_INSIDE / 2 + 0.5, "#1c1d20")]):
            for j in range(2):
                zb = oz + 18.5 + j * 9.0
                o.append(box(xa, yt, zb, ph - 0.2, pd, 8.0, col, "#2a2b2e" if k else "#e2e2df", "#bdbdb9" if not k else "#121214"))
        o.append(box(ix1 + 0.4, yt, oz + 2.0, 4.2, 2.2, 14.5, "#1a1a1c", "#2b2b2e"))        # TV remote
        o.append(box(ix1 + 5.2, yt, oz + 2.0, 4.0, 2.0, 12.0, "#26272a", "#35363a"))        # soundbar remote
        o.append(box(ix1 + 9.8, yt, oz + 3.0, 3.6, 1.6, 9.0, "#ececea", "#f7f7f5"))         # streaming remote
        a, b = P(ix2 - 1.2, yt + 0.6, oz + 39), P(ix2 - 2.0, yt + 0.6, oz + 17)
        o.append(f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{b[0]+6:.1f},{(a[1]+b[1])/2:.1f} {b[0]:.1f},{b[1]:.1f}" fill="none" stroke="#222" stroke-width="1.6"/>')
    o.append(box(ix2, yb, oz, t, 10, 40, PLY, PLY_T, PLY_S))                           # right side
    o.append(box(bx1, yb, oz, bx2 - bx1, 4.0, t, PLY, PLY_T, PLY_S))                   # low front
    if open_cm > 0:
        a, b = P(bx2 + 0.05, yb + 5, oz + 1), P(bx2 + 0.05, yb + 5, oz + 38)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#9aa0a6" stroke-width="4"/>')
        o.append(slim_drawer(d, open_cm, "lip"))
    return "\n".join(o)

GAME_OPEN = 0.0

def game_drawer(open_cm, part="all"):
    """Bay 1 roll-out game drawer: two front-facing display bins + centre tray, spine-up rows behind.
    Box 54.3 wide x 35 deep (350 mm runners on the BESTÅ sides), base at 2.6 cm."""
    o = []
    oz = -open_cm
    bx1, bx2 = 2.87, 57.13
    if part == "lip":
        o.append(box(1.6, 2.6, oz - 0.6, 56.8, 6.5, 2.0, OAK, OAK_T, OAK_S))
        a, b = P(24, 2.6 + 6.5, oz - 0.61), P(34, 2.6 + 6.5, oz - 0.61)
        o.append(f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{(a[0]+b[0])/2:.1f},{a[1]+9:.1f} {b[0]:.1f},{b[1]:.1f}Z" fill="#7a5130"/>')
        return "\n".join(o)
    ix1, ix2 = bx1 + 1.2, bx2 - 1.2
    yb, yt = 2.6, 3.5          # box base bottom / top
    side_h = 15.5
    PLY, PLY_T, PLY_S = "#d9c09a", "#e8d3b0", "#b99e78"
    if open_cm > 0:
        o.append(poly([P(bx1, 0.05, oz), P(bx2 + 3, 0.05, oz), P(bx2 + 3, 0.05, oz + 30), P(bx1, 0.05, oz + 30)], "#000", 'opacity="0.22" filter="url(#soft)"'))
    # back panel, left side (inner face shows), base
    o.append(box(bx1, yb, oz + 33.8, bx2 - bx1, side_h, 1.2, PLY, PLY_T, PLY_S))
    o.append(box(bx1, yb, oz, 1.2, side_h, 35, PLY, PLY_T, "#ead7b6"))
    o.append(box(ix1, yb, oz, ix2 - ix1, 0.9, 33.8, "#cdb38a", "#5a5148"))   # base with dark felt top
    # ---- back zone: spine-up cases, lengthwise front-to-back, titles on top
    z0 = oz + 14.9
    x = ix1 + 0.3
    groups = [("ps2", 15, 1.4), ("x360", 12, 1.4), ("follower", 1, 2.0), ("one", 9, 1.2)]
    rnd = random.Random(21)
    for kind, n, t in groups:
        for i in range(n):
            if kind == "follower":
                o.append(box(x, yt, z0, t, 12, 19, "#c79a63", "#d9ad75", "#a87d4a"))
                x += t + 0.1
                continue
            if kind == "ps2":
                front, top = "#1d2f6b", rnd.choice(["#0f0f12", "#e9e6df", "#121722"])
                band = "#2c4bb0"
            elif kind == "x360":
                front, top, band = "#2c8f3e", "#f2f1ec", "#5ab845"
            else:
                front, top, band = "#1f7a37", rnd.choice(["#f2f1ec", "#1c1c1c"]), "#3fae54"
            h = 13.5
            o.append(box(x, yt, z0, t * 0.97, h, 19 if kind != "one" else 17, front, top, front))
            # title strip + console band on the spine (seen from above)
            ln = 19 if kind != "one" else 17
            o.append(poly([P(x + 0.35, yt + h + 0.01, z0 + 2.5), P(x + t * 0.97 - 0.35, yt + h + 0.01, z0 + 2.5),
                           P(x + t * 0.97 - 0.35, yt + h + 0.01, z0 + ln - 5.5), P(x + 0.35, yt + h + 0.01, z0 + ln - 5.5)],
                          "#8d8a84" if top.startswith("#f") or top.startswith("#e") else "#d8d4cc", 'opacity="0.75"'))
            o.append(poly([P(x, yt + h + 0.02, z0 + ln - 3.2), P(x + t * 0.97, yt + h + 0.02, z0 + ln - 3.2),
                           P(x + t * 0.97, yt + h + 0.02, z0 + ln), P(x, yt + h + 0.02, z0 + ln)], band))
            x += t
    # divider between back zone and front bins
    o.append(box(ix1, yt, oz + 14.2, ix2 - ix1, 9, 0.6, PLY, PLY_T, PLY_S))
    # ---- front zone: two display bins (16 wide) + centre tray
    lb, rb = (ix1, ix1 + 16.0), (ix2 - 16.0, ix2)
    o.append(box(lb[1], yt, oz + 1.2, 0.6, 9, 13, PLY, PLY_T, PLY_S))
    o.append(box(rb[0] - 0.6, yt, oz + 1.2, 0.6, 9, 13, PLY, PLY_T, PLY_S))
    # centre tray: memory cards, a pad, a few manuals
    o.append(box(lb[1] + 2, yt, oz + 3, 6, 1.5, 5, "#2b2b2e", "#3a3a3e"))
    o.append(box(lb[1] + 9.5, yt, oz + 3.5, 6.5, 1.2, 4, "#e8e5de", "#f4f2ec"))
    o.append(box(lb[1] + 2, yt, oz + 9, 15, 4.5, 4, "#1b1c1e", "#2a2b2e", "#111"))
    lean = math.radians(13)
    hgt, dzl = 19 * math.cos(lean), 19 * math.sin(lean)
    def bin_cases(xa, xb, palette, art):
        cx = (xa + xb) / 2
        x1, x2 = cx - 6.75, cx + 6.75
        n = 6
        for i in range(n - 1, -1, -1):
            zb = oz + 2.4 + i * 1.45
            c = palette[i % len(palette)]
            q = [P(x1, yt, zb), P(x2, yt, zb), P(x2, yt + hgt, zb + dzl), P(x1, yt + hgt, zb + dzl)]
            o.append(poly(q, c, 'stroke="#000" stroke-opacity="0.3" stroke-width="0.6"'))
            if i == 0:
                def L(u, v):
                    bl, br, tr, tl = q
                    bx_ = bl[0] + (br[0] - bl[0]) * u; by_ = bl[1] + (br[1] - bl[1]) * u
                    tx_ = tl[0] + (tr[0] - tl[0]) * u; ty_ = tl[1] + (tr[1] - tl[1]) * u
                    return (bx_ + (tx_ - bx_) * v, by_ + (ty_ - by_) * v)
                for (u1, u2, v1, v2, col) in art:
                    o.append(poly([L(u1, v1), L(u2, v1), L(u2, v2), L(u1, v2)], col))
    xbox_art = [(0, 1, 0.86, 1, "#3fae54"), (0.08, 0.92, 0.1, 0.8, "#1a2a3a"), (0.2, 0.8, 0.45, 0.72, "#e0b43a"),
                (0.3, 0.7, 0.18, 0.4, "#c84b34")]
    ps2_art = [(0, 1, 0.88, 1, "#0f0f12"), (0.06, 0.94, 0.1, 0.84, "#2a5aa6"), (0.15, 0.85, 0.5, 0.78, "#f1e7d0"),
               (0.25, 0.75, 0.16, 0.44, "#e8603c")]
    bin_cases(*lb, ["#2c8f3e", "#1f7a37", "#2c8f3e"], xbox_art)
    bin_cases(*rb, ["#1d2f6b", "#13214f"], ps2_art)
    # right side (outer face + runner)
    o.append(box(ix2, yb, oz, 1.2, side_h, 35, PLY, PLY_T, PLY_S))
    if open_cm > 0:
        a, b = P(bx2 + 0.05, 9.5, oz + 1), P(bx2 + 0.05, 9.5, oz + 34)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#9aa0a6" stroke-width="5"/>')
    # oak front lip with finger pull (overlay front)
    o.append(box(1.6, yb, oz - 0.6, 56.8, 6.5, 2.0, OAK, OAK_T, OAK_S))
    a, b = P(24, yb + 6.5, oz - 0.61), P(34, yb + 6.5, oz - 0.61)
    o.append(f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{(a[0]+b[0])/2:.1f},{a[1]+9:.1f} {b[0]:.1f},{b[1]:.1f}Z" fill="#7a5130"/>')
    return "\n".join(o)

LC = "#f3e9d4"

def dim_line(a, b, label=None, lpos=None, tick=7, size=13, anchor="middle", op=0.75):
    out = [f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{LC}" stroke-opacity="{op}" stroke-width="1.2"/>']
    ang = math.atan2(b[1] - a[1], b[0] - a[0]) + math.pi / 2
    for p in (a, b):
        dx, dy = math.cos(ang) * tick / 2, math.sin(ang) * tick / 2
        out.append(f'<line x1="{p[0] - dx:.1f}" y1="{p[1] - dy:.1f}" x2="{p[0] + dx:.1f}" y2="{p[1] + dy:.1f}" stroke="{LC}" stroke-opacity="{op}" stroke-width="1.2"/>')
    if label:
        lx, ly = lpos if lpos else ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 7)
        out.append(text(lx, ly, label, size=size, anchor=anchor, op=0.92))
    return "\n".join(out)

def _hull(pts_):
    pts_ = sorted(set((round(x, 2), round(y, 2)) for x, y in pts_))
    if len(pts_) < 3:
        return pts_
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts_:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts_):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def _norm(v):
    l = math.sqrt(sum(c * c for c in v)); return tuple(c / l for c in v)

def _cone(apex, d, length, r0, r1, n=28):
    """Projected silhouette of a cone frustum along unit vector d from apex; returns (hull, mouth ring, mouth centre)."""
    d = _norm(d)
    a = (0.0, 1.0, 0.0) if abs(d[1]) < 0.9 else (1.0, 0.0, 0.0)
    u = _norm((a[1] * d[2] - a[2] * d[1], a[2] * d[0] - a[0] * d[2], a[0] * d[1] - a[1] * d[0]))
    w = (d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0])
    m = tuple(apex[i] + d[i] * length for i in range(3))
    ring0 = [P(*[apex[i] + r0 * (math.cos(t) * u[i] + math.sin(t) * w[i]) for i in range(3)]) for t in [2 * math.pi * k / n for k in range(n)]]
    ring1 = [P(*[m[i] + r1 * (math.cos(t) * u[i] + math.sin(t) * w[i]) for i in range(3)]) for t in [2 * math.pi * k / n for k in range(n)]]
    return _hull(ring0 + ring1), ring1, m

def plate(title, sub, x=24, y=None, w=640):
    """Label plate on the plain renders."""
    w = max(w, round(40 + 7.0 * len(sub)), round(40 + 10.5 * len(title)))   # v12: grows with the caption so it never runs past the box
    title, sub = title.replace("&", "&amp;"), sub.replace("&", "&amp;")
    y = H - 24 - 66 if y is None else y
    return (f'<rect x="{x}" y="{y}" width="{w}" height="66" rx="10" fill="#f4efe4" opacity="0.94"/>'
            f'<text x="{x + 20}" y="{y + 29}" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#14261d">{title}</text>'
            f'<text x="{x + 20}" y="{y + 51}" font-family="Inter, sans-serif" font-size="13" fill="#5f5a50">{sub}</text>')

def key_panel2(x0, items, title, sub, step=26.5):
    o = [f'<rect x="{x0}" y="0" width="{KEYW}" height="{H}" fill="#f4efe4"/>',
         f'<text x="{x0 + 36}" y="54" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="#14261d">{title}</text>',
         f'<text x="{x0 + 36}" y="78" font-family="Inter, sans-serif" font-size="13" fill="#5f5a50">{sub}</text>']
    y = 104
    for it in items:
        if it[0] == H_:
            y += 10
            o.append(f'<text x="{x0 + 36}" y="{y + 4}" font-family="Inter, sans-serif" font-size="11.5" font-weight="700" letter-spacing="1.2" fill="#6b6455">{it[1].upper()}</text>')
            o.append(f'<line x1="{x0 + 36}" y1="{y + 11}" x2="{x0 + KEYW - 36}" y2="{y + 11}" stroke="#d8d0bf" stroke-width="1"/>')
            y += 28
            continue
        n, _, label = it
        o.append(f'<circle cx="{x0 + 50}" cy="{y - 5}" r="12" fill="#fff" stroke="#14261d" stroke-width="1.4"/>')
        o.append(f'<text x="{x0 + 50}" y="{y - 0.7}" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#14261d" text-anchor="middle">{n}</text>')
        o.append(f'<text x="{x0 + 74}" y="{y}" font-family="Inter, sans-serif" font-size="14" fill="#1f1f1f">{label}</text>')
        y += step
    o.append(f'<text x="{x0 + 36}" y="{H - 28}" font-family="Inter, sans-serif" font-size="12" fill="#6b6455">Dashed lines are hidden: gold for data and low-voltage leads, coral for mains.</text>')
    return "\n".join(o)

def drawer_inset(x0=24, y0=852, num=16):
    """Top-down detail of the game drawer, drawn as a card on the floor area."""
    k = 5.4
    w, h = 345, 285
    o = [f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="10" fill="#f4efe4" opacity="0.96"/>',
         f'<circle cx="{x0 + 24}" cy="{y0 + 24}" r="12" fill="#fff" stroke="#14261d" stroke-width="1.4"/>',
         f'<text x="{x0 + 24}" y="{y0 + 28.5}" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#14261d" text-anchor="middle">{num}</text>',
         f'<text x="{x0 + 44}" y="{y0 + 29}" font-family="Inter, sans-serif" font-size="13.5" font-weight="600" fill="#14261d">Game drawer from above, pulled out</text>']
    ox, oy = x0 + (w - 54.3 * k) / 2, y0 + 50
    X = lambda c: ox + c * k
    Y = lambda c: oy + (35 - c) * k   # z=0 (front) at the bottom
    o.append(f'<rect x="{X(0)}" y="{Y(35)}" width="{54.3*k}" height="{35*k}" fill="#d9c09a" stroke="#a88a62"/>')
    o.append(f'<rect x="{X(1.2)}" y="{Y(33.8)}" width="{51.9*k}" height="{32.6*k}" fill="#5a5148"/>')
    rnd = random.Random(21)
    x = 1.5
    for kind, n, t, ln in [("ps2", 15, 1.4, 19), ("x360", 12, 1.4, 19), ("f", 1, 2.0, 19), ("one", 9, 1.2, 17)]:
        for i in range(n):
            if kind == "f":
                o.append(f'<rect x="{X(x)}" y="{Y(14.9+ln)}" width="{t*k}" height="{ln*k}" fill="#c79a63"/>')
                x += t + 0.1; continue
            col = {"ps2": rnd.choice(["#0f0f12", "#e9e6df", "#121722"]), "x360": "#f2f1ec", "one": rnd.choice(["#f2f1ec", "#1c1c1c"])}[kind]
            band = {"ps2": "#2c4bb0", "x360": "#5ab845", "one": "#3fae54"}[kind]
            o.append(f'<rect x="{X(x)}" y="{Y(14.9+ln)}" width="{t*k*0.92}" height="{ln*k}" fill="{col}" stroke="#00000033" stroke-width="0.5"/>')
            o.append(f'<rect x="{X(x)}" y="{Y(14.9+ln)}" width="{t*k*0.92}" height="{3*k}" fill="{band}"/>')
            tc = "#8d8a84" if col.startswith("#f") or col.startswith("#e") else "#d8d4cc"
            o.append(f'<rect x="{X(x)+2}" y="{Y(14.9+ln-4.5)}" width="{max(t*k*0.92-4,1)}" height="{(ln-9)*k}" fill="{tc}" opacity="0.7"/>')
            x += t
    o.append(f'<rect x="{X(1.2)}" y="{Y(14.8)}" width="{51.9*k}" height="{0.6*k}" fill="#d9c09a"/>')
    for (a, b, lab, col) in [(1.2, 17.2, "Xbox bin", "#2c8f3e"), (37.1, 53.1, "PS2 bin", "#1d2f6b")]:
        o.append(f'<rect x="{X(a)}" y="{Y(14.2)}" width="{(b-a)*k}" height="{12.6*k}" fill="#e9dcc5"/>')
        for j in range(6):
            o.append(f'<rect x="{X((a+b)/2-6.75)}" y="{Y(2.6+j*1.45+1.3)}" width="{13.5*k}" height="{1.25*k}" fill="{col}" opacity="{1 - j*0.1}"/>')
        o.append(f'<text x="{X((a+b)/2)}" y="{Y(12.2)}" font-family="Inter, sans-serif" font-size="10.5" fill="#3d382f" text-anchor="middle">{lab}</text>')
    o.append(f'<rect x="{X(17.8)}" y="{Y(14.2)}" width="{18.7*k}" height="{12.6*k}" fill="#efe6d4"/>')
    o.append(f'<text x="{X(27.15)}" y="{Y(7.5)}" font-family="Inter, sans-serif" font-size="10.5" fill="#3d382f" text-anchor="middle">tray</text>')
    o.append(f'<rect x="{X(-1.3)}" y="{Y(1.4)}" width="{56.9*k}" height="{2*k}" fill="#c48c57"/>')
    o.append(f'<text x="{X(27.15)}" y="{Y(24.3)}" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#f4efe4" text-anchor="middle" paint-order="stroke" stroke="#14261d" stroke-width="3">spines up · ~36 games</text>')
    o.append(f'<text x="{x0 + w/2}" y="{y0 + h - 12}" font-family="Inter, sans-serif" font-size="11" fill="#5f5a50" text-anchor="middle">front ↓ · box 54 × 35 cm · 350 mm runners</text>')
    return "\n".join(o)

def record_inset(x0=1545, y0=330, num=26):
    """v16: an LP crate from above: 34.86 x 40, the 33 cm trough, LPs face-out."""
    k = 4.6
    bw, bd = G.TRAY_BOX
    w, h = 245, 236
    o = [f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="10" fill="#f4efe4" opacity="0.96"/>',
         f'<circle cx="{x0 + 24}" cy="{y0 + 24}" r="12" fill="#fff" stroke="#14261d" stroke-width="1.4"/>',
         f'<text x="{x0 + 24}" y="{y0 + 28.5}" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#14261d" text-anchor="middle">{num}</text>',
         f'<text x="{x0 + 42}" y="{y0 + 29}" font-family="Inter, sans-serif" font-size="12.5" font-weight="600" fill="#14261d">LP crate from above</text>']
    ox, oy = x0 + (w - bw * k) / 2, y0 + 40
    X = lambda c: ox + c * k
    Y = lambda c: oy + (bd - c) * k * 0.85
    o.append(f'<rect x="{X(0)}" y="{Y(bd)}" width="{bw*k}" height="{bd*k*0.85}" fill="#d9c09a" stroke="#a88a62"/>')
    o.append(f'<rect x="{X(0.9)}" y="{Y(bd - 0.9)}" width="{G.TRAY_INSIDE*k}" height="{(bd - 1.8)*k*0.85}" fill="#5a5148"/>')
    cols = ["#e9e3d3", "#2f3e5c", "#c8452f", "#f0c24b", "#1f1f1f", "#6a8f5a", "#3a6ea5", "#b3307a"]
    lx = 0.9 + (G.TRAY_INSIDE - G.LP) / 2
    for i in range(40):
        zz = 3.0 + i * 0.78
        o.append(f'<rect x="{X(lx)}" y="{Y(zz + 0.5)}" width="{G.LP*k}" height="{max(0.5*k*0.85 - 0.3, 0.8)}" fill="{cols[i % 8]}"/>')
    o.append(f'<rect x="{X(-0.7)}" y="{Y(1.4)}" width="{(bw + 1.4)*k}" height="{1.5*k}" fill="#c48c57"/>')
    o.append(f'<text x="{X(bw / 2)}" y="{Y(22)}" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#f4efe4" text-anchor="middle" paint-order="stroke" stroke="#14261d" stroke-width="3">~{G.TRAY_LPS} LPs</text>')
    o.append(f'<text x="{x0 + w/2}" y="{y0 + h - 22}" font-family="Inter, sans-serif" font-size="10" fill="#5f5a50" text-anchor="middle">33 cm trough · all face-out, no gaps</text>')
    o.append(f'<text x="{x0 + w/2}" y="{y0 + h - 9}" font-family="Inter, sans-serif" font-size="10" fill="#5f5a50" text-anchor="middle">box 34.9 × 40 · 400 mm runners</text>')
    return "\n".join(o)

PAINT_OLD = ["#16271f", "#1d3d30", "#21443a", "#22432f", "#244a38", "#244a39", "#264c3a", "#28503e", "#2a5141",
             "#2a5340", "#2b5643", "#2c5643", "#2d5a44", "#2d5a46", "#2f5b46", "#315c48", "#335f4a", "#33604a",
             "#346650", "#3a6b53", "#3a6d55", "#3b6e56", "#3d7259", "#447a60"]

PAINT = "soft"          # "soft" (v8) or "deep" (v7)

SOFT_HUE, SOFT_S, SOFT_L = 98 / 360, 0.135, 0.505   # base wall, lit, in evening light

def set_paint(hexcode, sat_boost=1.4, light=0.95):
    """Derive the lit-wall base from a paint's screen colour. Screen colours of paints are approximate,
    and the render's warm evening light pushes them a touch greener and darker."""
    import colorsys
    global SOFT_HUE, SOFT_S, SOFT_L, PAINT
    r, g, b = [int(hexcode[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    SOFT_HUE, SOFT_S, SOFT_L, PAINT = h, s * sat_boost, l * light, "soft"
    global SOFT_RGB
    SOFT_RGB = (r, g, b) if l > 0.6 else None   # v51: a pale paint is shaded by darkening its own colour (HSL at full saturation went neon)

PAINTS = {   # approximate screen colours (pontata.com)
    "mint": ("#dbffc8", "Your pale mint (#dbffc8), Valspar mixed at B&Q"),   # v51, the client's own colour (their saved plan)
    "card_room": ("#899081", "Farrow & Ball Card Room Green No. 79"),
    "treron": ("#8b8a77", "Farrow & Ball Treron No. 292"),
    "sage": ("#77815c", "Little Greene Sage Green No. 80"),
}

MAIN_PAINT = "mint"   # v51, client: their phone plan, "Switch to the pale mint" (v9 to v50: card_room)

SOFT_RGB = None

def _soft(h):
    import colorsys
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    _, l, s = colorsys.rgb_to_hls(r, g, b)
    if SOFT_RGB:   # v51: the old shade's lightness, as a fraction of the paint's own, in evening light (0.62 to 0.92)
        k = min(0.92, 0.62 + 0.3 * (l / 0.36))
        return "#%02x%02x%02x" % tuple(round(c * k * 255) for c in SOFT_RGB)
    nl = min(0.80, SOFT_L * (l / 0.25) ** 0.8)
    ns = SOFT_S * (s / 0.32)
    nr, ng, nb = colorsys.hls_to_rgb(SOFT_HUE, nl, ns)
    return "#%02x%02x%02x" % (round(nr * 255), round(ng * 255), round(nb * 255))

def repaint(svg):
    if PAINT != "soft":
        return svg
    for h in PAINT_OLD:
        svg = svg.replace(h, _soft(h)).replace(h.upper(), _soft(h))
    return svg


# =============================================================== v11 scene
G_RECESS = "#264c3a"     # the recess west of the breast, a touch darker than the lit breast face
SKIRT = None             # None = painted in the wall colour (eggshell); or a 5-tuple of colours
DINING = "folded"        # the dining wall: "folded" (everyday) or "four" (down at the wall, set for four)
SOFA_GHOST = False       # the L-sofa drawn see-through (numbered and dimension views)
BX0 = G.BREAST_X[0]
RZ = G.RZ
STEEL, STEEL_T, STEEL_S = "#4a4d50", "#5d6064", "#36383b"
BEECH, BEECH_T, BEECH_S = "#cfa575", "#ddb78a", "#b08756"


def bay_interior(x1, x2, y1, y2, d=40.0):
    side_l, side_r, floor_c = "#d9c29b", "#b89b72", "#cbb085"
    return "\n".join([quad_front(x1, y1, d, x2 - x1, y2 - y1, "url(#bayBack)"),
                      poly([P(x1, y1, 0), P(x1, y1, d), P(x1, y2, d), P(x1, y2, 0)], side_l),
                      poly([P(x2, y1, 0), P(x2, y1, d), P(x2, y2, d), P(x2, y2, 0)], side_r),
                      poly([P(x1, y1, 0), P(x2, y1, 0), P(x2, y1, d), P(x1, y1, d)], floor_c)])


def ply_shelf(x1, x2, y, d=36.0):
    return box(x1, y, 1.0, x2 - x1, 1.8, d, "#d8c39f", "#e6d2ae", "#b99e78")


def face_frame(x1, x2, holes, top=73.0):
    """Oak (or painted) face frame with openings: holes = [(xa, xb, y_bottom)], openings run up to 71."""
    outer = [P(x1, 0, 0), P(x2, 0, 0), P(x2, top, 0), P(x1, top, 0)]
    d = "M" + " L".join(f"{p[0]:.1f},{p[1]:.1f}" for p in outer) + " Z"
    for (a, b, yb) in holes:
        h = [P(a, yb, 0), P(b, yb, 0), P(b, top - 2.0, 0), P(a, top - 2.0, 0)]
        d += " M" + " L".join(f"{p[0]:.1f},{p[1]:.1f}" for p in h) + " Z"
    fill = OAK if STYLE == "joinery" else G_FRAME
    if REC is not None:   # v14: the face frame, with its openings, for the 3D viewer
        REC.append(("frame", round(x1 + XOFF, 2), round(x2 + XOFF, 2), round(top + YOFF, 2), round(ZOFF, 2),
                    [(round(a + XOFF, 2), round(b + XOFF, 2), round(yb + YOFF, 2)) for a, b, yb in holes], fill))
    return (f'<path d="{d}" fill="{fill}" fill-rule="evenodd" {GH if STYLE == "joinery" else ""}/>'
            f'<path d="{d}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="1"/>')


def worktop_top(x1, x2, d, th=3.0, y=73.0):
    o = [box(x1, y, 0, x2 - x1, th, d, OAK, OAK_T, OAK_D, extra=GH)]
    if STYLE == "joinery":
        o.append(_line(P(x1, y + th - 0.4, -0.01), P(x2, y + th - 0.4, -0.01), "#ecc28c", 1.4))
    return "\n".join(o)


def disc_x(xp, yc, zc, r, fill, extra="", n=40):
    """A circle on the plane x = xp (a face that looks into the room from the side wall)."""
    return poly([P(xp, yc + r * math.sin(t), zc + r * math.cos(t)) for t in [2 * math.pi * i / n for i in range(n)]], fill, extra)


def disc_z(xc, yc, zp, r, fill, extra="", n=40):
    """A circle on the plane z = zp (a face towards the camera)."""
    return poly([P(xc + r * math.cos(t), yc + r * math.sin(t), zp) for t in [2 * math.pi * i / n for i in range(n)]], fill, extra)


# ------------------------------------------------------------- the room
def rug():
    """v15: "a nice design rug that fits": 230 × 160 (geometry.RUG) in front of the sofa, from the return's seat to past the breast and
    30 short of the base. A cream ground with a deep blue border (the sofa), and big overlapping arches in rust, ochre and sage."""
    (x0, x1), (z0, z1), b = G.RUG["x"], G.RUG["z"], G.RUG["border"]
    cream, rust, ochre, blue, sage = G.RUG_COLS
    y = 0.15
    flat = lambda pts_: [P(x, y, z) for x, z in pts_]
    o = [poly(flat([(x0 + 3, z0 - 3), (x1 + 3, z0 - 3), (x1 + 3, z1 - 3), (x0 + 3, z1 - 3)]), "#000", 'opacity="0.18" filter="url(#soft)"')]
    o.append(poly(flat([(x0, z0), (x1, z0), (x1, z1), (x0, z1)]), blue))
    o.append(poly(flat([(x0 + b, z0 + b), (x1 - b, z0 + b), (x1 - b, z1 - b), (x0 + b, z1 - b)]), cream))
    def arch(cx, cz, r, w, col):            # a half-ring standing on the line z = cz, opening towards the window
        outer = [(cx + r * math.cos(t), cz - r * math.sin(t)) for t in [math.pi * i / 24 for i in range(25)]]
        inner = [(cx + (r - w) * math.cos(t), cz - (r - w) * math.sin(t)) for t in [math.pi * (24 - i) / 24 for i in range(25)]]
        pts_ = [(min(max(x, x0 + b), x1 - b), min(max(z, z0 + b), z1 - b)) for x, z in outer + inner]
        o.append(poly(flat(pts_), col))
    zc = z1 - b - 18
    for cx, r, col in ((x0 + 62, 46, rust), (x0 + 128, 58, ochre), (x0 + 172, 40, sage), (x0 + 112, 30, blue)):
        arch(cx, zc, r, 9, col)
        arch(cx, zc, r - 15, 4, col)
    o.append(poly(flat([(x0 + b + 6, z0 + b + 14), (x1 - b - 6, z0 + b + 14), (x1 - b - 6, z0 + b + 18), (x0 + b + 6, z0 + b + 18)]), rust))
    for i in range(9):                       # a row of ochre dots along the window end
        cx = x0 + b + 18 + i * (x1 - x0 - 2 * b - 36) / 8
        o.append(ellipse_flat(cx, y + 0.01, z0 + b + 30, 3.2, 3.2, ochre))
    return "\n".join(o)


def room():
    o = []
    o.append(f'<rect x="0" y="{-SHIFT - 60}" width="{W}" height="{H + SHIFT + 120}" fill="url(#backwall)"/>')
    RW = 260.0
    zr = G.BREAST_D_WEST
    far = BX1 + RW
    # the recess west of the breast, with the door to the hall (drawn where the agent's plan shows it: to confirm)
    o.append(quad_front(BX1, 0, zr, RW, CEIL, G_RECESS))
    o.append(poly([P(BX1, 0, 0), P(far, 0, 0), P(far, 0, zr), P(BX1, 0, zr)], "#77797c"))
    dx1, dx2, dh = G.DOOR_X[0], G.DOOR_X[1], 198
    # v20, client: "door of room is also white": the door and its frame stay white (not drenched in the wall colour), in the recess's shade
    o.append(quad_front(dx1 - 6, 0, zr - 0.2, (dx2 - dx1) + 12, dh + 6, "#dedbd3"))
    o.append(quad_front(dx1, 0, zr - 0.4, dx2 - dx1, dh, "#d3cfc6"))
    for (py1, py2) in ((112, 186), (14, 98)):
        o.append(quad_front(dx1 + 9, py1, zr - 0.5, dx2 - dx1 - 18, py2 - py1, "none", 'stroke="#b3ada2" stroke-width="1.6"'))
    o.append(box(dx2 - 9, 100, zr - 2.5, 7, 1.2, 2, "#c9c4b8", "#e2ddd2", "#a9a49a"))
    # the alcove: back wall, reveal (the breast's east side) and floor
    o.append(quad_front(0, 0, ALC_D, ALC_W, CEIL, "#244a39"))
    o.append(poly([P(ALC_W, 0, 0), P(ALC_W, CEIL, 0), P(ALC_W, CEIL, ALC_D), P(ALC_W, 0, ALC_D)], G_REVR))
    o.append(poly([P(0, 0, 0), P(ALC_W, 0, 0), P(ALC_W, 0, ALC_D), P(0, 0, ALC_D)], "#6d6f72"))
    # the east (side) wall, continuous into the alcove
    o.append(poly([P(0, CEIL, -470), P(0, CEIL, ALC_D), P(0, 0, ALC_D), P(0, 0, -470)], "url(#leftwall)"))
    # ceiling: one plane at 235 over the room, alcove and recess
    cl = [P(0, CEIL, ALC_D), P(ALC_W, CEIL, ALC_D), P(ALC_W, CEIL, 0), P(BX1, CEIL, 0), P(BX1, CEIL, zr), P(far, CEIL, zr),
          (W + 10, P(far, CEIL, zr)[1]), (W + 10, -SHIFT - 40), (-10, -SHIFT - 40), P(0, CEIL, -470)]
    o.append(poly(cl, "#33604a"))
    for a, b in ((P(ALC_W, CEIL, 0), P(BX1, CEIL, 0)), (P(BX1, CEIL, 0), P(BX1, CEIL, zr)), (P(BX1, CEIL, zr), P(far, CEIL, zr))):
        o.append(_line(a, b, "#264c3a", 1.5))
    o.append(_line(P(BX1, 0, 0), P(BX1, CEIL, 0), "#21443a", 1.4))
    # room floor
    fl = [P(0, 0, 0), P(BX1, 0, 0), P(BX1, 0, zr), P(far, 0, zr), (W + 10, P(far, 0, zr)[1]), (W + 10, H + 10), P(0, 0, -470)]
    o.append(poly(fl, "url(#floor)"))
    # skirting, 6 cm, in the wall colour (eggshell): east wall, across the breast, the recess
    sk = SKIRT or ("#346650", "#3d7259", "#2b5643", "#2d5a46", "#3b6e56")
    sh = G.SKIRT_H
    bf = G.BASE_FRONT_Z
    o.append(poly([P(0, 0, bf), P(0, sh, bf), P(0, sh, -470), P(0, 0, -470)], sk[3]))
    o.append(poly([P(0, sh, bf), P(1.8, sh, bf), P(1.8, sh, -470), P(0, sh, -470)], sk[4]))
    o.append(box(BX0, 0, -1.8, G.BREAST_W, sh, 1.8, sk[0], sk[1], sk[2]))
    o.append(box(BX1, 0, zr - 1.8, dx1 - 6 - BX1, sh, 1.8, sk[0], sk[1], sk[2]))
    o.append(box(dx2 + 6, 0, zr - 1.8, far - dx2 - 6, sh, 1.8, sk[0], sk[1], sk[2]))
    o.append(rug())
    o.append(west_end(sk))
    return "\n".join(o)


def west_end(sk):
    """The stairwell in the south-west corner, next to the door, behind a wooden banister so you see into it (client, v12
    comment). v13, client: the stairs go UP to the first floor. Drawn rising away from the room, from the floor by the
    banister's newel towards the hall and on up through an opening in the ceiling; the banister rakes up the open (door)
    side. Direction and sizes drawn roughly until the client sends a photo of that end."""
    o = []
    sx0, sx1 = G.STAIR_X
    sz = ALC_D - G.STAIR_D                      # the stair's front edge, on the room side, about -41
    zb = G.BREAST_D_WEST                        # the recess back wall line
    wx = G.ROOM_W
    rise, going = G.STAIR_RISE, G.STAIR_GOING
    o.append(poly([P(wx, 0, zb), P(wx, CEIL, zb), P(wx, CEIL, -470), P(wx, 0, -470)], "url(#rightwall)"))   # v17: one wall, right back to the recess line
    zw = G.WINDOW_Z                             # v65: the skirting stops at the window wall (it ran on to -470 and out through the 3D house)
    o.append(poly([P(wx, 0, sz), P(wx, sh_ := G.SKIRT_H, sz), P(wx, sh_, zw), P(wx, 0, zw)], sk[3]))
    # beyond the recess wall line the flight is in the hall: seen only through the stairwell opening (the gap in the
    # recess wall over the stair, and the opening in the ceiling above it), so that part is clipped to those openings
    far_z = sz + 6 + 11 * going
    land_z = sz + 6 + (G.STAIR_N - 1) * going + G.LANDING_D    # v38: the stairwell's walls run on to the landing's far end
    hole = [P(sx0, 0, zb), P(sx1, 0, zb), P(sx1, CEIL, zb), P(sx0, CEIL, zb)]
    # v13.2, client: the opening to upstairs starts just after the door, over the banister, and runs to the west wall
    hx0 = G.DOOR_X[1] + 1.5
    ceil_hole = [P(hx0, CEIL, sz), P(sx1, CEIL, sz), P(sx1, CEIL, far_z), P(hx0, CEIL, far_z)]
    cid = f"well{abs(hash((round(VX), round(S * 100), VIEW))) % 100000}"
    o.append(f'<clipPath id="{cid}"><polygon points="{pts(*hole)}"/><polygon points="{pts(*ceil_hole)}"/></clipPath>')
    near, far = [], []
    wh = G.LANDING_Y + 6.0                                    # v38: the stairwell's walls run up past the landing
    far.append(quad_front(sx0, 0, land_z, sx1 - sx0, wh, "#1d3d30"))
    # v17, client: "up the wall of the stairs is all one wall with no turns ... it should have the same colour making one wall clear": the
    # west wall carries on up the stairwell in the colour its room part ends in (the 3D room paints it with the walls)
    far.append(poly([P(sx1, 0, zb), P(sx1, wh, zb), P(sx1, wh, land_z), P(sx1, 0, land_z)], "#2a5141"))
    far.append(poly([P(sx0, 0, zb), P(sx0, wh, zb), P(sx0, wh, land_z), P(sx0, 0, land_z)], "#244a38"))
    # looking up through the opening: the stairwell's walls carry on up to the landing's ceiling
    up = CEIL + 255.0
    hcid = cid + "c"
    near.append(f'<clipPath id="{hcid}"><polygon points="{pts(*ceil_hole)}"/></clipPath><g clip-path="url(#{hcid})">')
    near.append(poly(ceil_hole, "#2b3530"))
    near.append(poly([P(hx0, up, sz), P(sx1, up, sz), P(sx1, up, far_z), P(hx0, up, far_z)], "#33604a"))     # the landing's ceiling, painted
    near.append(poly([P(sx1, CEIL, sz), P(sx1, up, sz), P(sx1, up, far_z), P(sx1, CEIL, far_z)], "#2a5141"))  # the same west wall, carrying on up
    near.append(quad_front(hx0, CEIL, far_z, sx1 - hx0, up - CEIL, "#244a38"))                               # the far wall, painted
    # the living room's ceiling stops here: its edge shows as a shallow lip (the floor's depth) where it cuts off the view up the stairs
    near.append(quad_front(hx0, CEIL, sz + 0.1, sx1 - hx0, 22.0, "#33604a"))
    # v23, client: "at the top of the stairs you have a random placed bannister end that floats above the room, remove that": the
    # landing's balusters and handrail (drawn above the ceiling, with no landing floor in the 3D room) are gone
    near.append('</g>')
    near.append(_line(ceil_hole[0], ceil_hole[1], "#264c3a", 1.4))
    # the flight: oak treads on risers in the wall colour, the first riser 6 cm behind the stair's front edge
    WOOD, WOOD_T, WOOD_S = "#b07a46", "#c89060", "#8a5c33"
    for i in reversed(range(G.STAIR_N - 1)):       # far, higher steps first (v38: all twelve treads to the landing)
        if STAIRS_3D:
            break                       # v38: the 3D room builds the flight as one solid
        z0 = sz + 6 + i * going
        y1 = (i + 1) * rise
        tgt = far if z0 >= zb else near
        tgt.append(box(sx0, 0, z0, sx1 - sx0, y1 - 2.2, going, "#2d5a46", "#c48c57", "#244a38"))     # v17: ends under the tread (no z-fight)
        tgt.append(box(sx0, y1 - 2.2, z0 - 1.5, sx1 - sx0, 2.2, going + 1.5, WOOD, WOOD_T, WOOD_S))
    # the closed string on the door side, raking up with the flight. v23, client: "i think its plasterboard under the stairs and bricks on
    # the side wall that support it": the string is a 24 cm board along the rake, and below it the flight stands on a brick side wall
    # (url(#brick): a brick pattern here, a brick texture in the 3D room); the plasterboard underside is out of sight in the hall
    za = sz + 6
    ry = lambda z: max(rise, (z - za) / going * rise)
    sb = lambda z: max(0.0, ry(z) - G.STAIR_STRING)
    def string(z1, z2):
        return poly([P(sx0 - 0.6, sb(z1), z1), P(sx0 - 0.6, sb(z2), z2), P(sx0 - 0.6, ry(z2), z2), P(sx0 - 0.6, ry(z1), z1)], G.BANISTER["col"][0])   # v41: painted white, as in your photo
    # v27, client: "paint the bricking on the stairs it has wall infront": the brick is behind a wall, so it's painted like the room
    def brick(z1, z2):
        return poly([P(sx0 - 0.5, 0, z1), P(sx0 - 0.5, 0, z2), P(sx0 - 0.5, sb(z2), z2), P(sx0 - 0.5, sb(z1), z1)], "url(#leftwall)")
    zbr = za + G.STAIR_STRING / rise * going        # where the string's underside leaves the floor
    if not STAIRS_3D:
        far.append(brick(zb, far_z)); far.append(string(zb, far_z))
        near.append(brick(zbr, zb)); near.append(string(za, zb))
    # the banister (v17, client: "bannister could be improved"): a solid raking handrail 6.5 wide × 5.5 deep at 90 over the nosings, a base
    # rail capping the string, 3.2 cm square balusters at 10.5 centres (a 10 cm sphere mustn't pass: Approved Document K), and 9 × 9 newels
    # with a capped, pyramid top at the foot (the wall side has no rail or newel). Every face is a convex quad, so the 3D room builds it cleanly.
    rail_h, nw = 90.0, 9.0
    hy = lambda z: ry(z) + rail_h
    xc = sx0 - 3.0
    def rake(xa, xb, yfn, z1, z2, col):          # a raking strip's top face between two x's
        return poly([P(xa, yfn(z1), z1), P(xb, yfn(z1), z1), P(xb, yfn(z2), z2), P(xa, yfn(z2), z2)], col)
    def side(x, yt, yb, z1, z2, col):           # a raking strip's side face at x, between two heights
        return poly([P(x, yb(z1), z1), P(x, yb(z2), z2), P(x, yt(z2), z2), P(x, yt(z1), z1)], col)
    BN = G.BANISTER; WH, WH_T, WH_S = BN["col"]; ht = BN["slat_t"] / 2
    def rail(z1, z2):                            # v41, your photo: two flat slats on edge, white, no spindles between them
        q = []
        for above, hh in BN["slats"]:
            top, bot = (lambda z, a=above: ry(z) + a), (lambda z, a=above, h_=hh: ry(z) + a - h_)
            q += [side(xc + ht, top, bot, z1, z2, WH_S), side(xc - ht, top, bot, z1, z2, WH), rake(xc - ht, xc + ht, top, z1, z2, WH_T)]
        return q
    def base_rail(z1, z2):                       # the low wall's capping, white
        top, bot = (lambda z: ry(z) + 3.0), ry
        return [side(sx0 + 1.9, top, bot, z1, z2, WH_S), side(sx0 - 3.1, top, bot, z1, z2, WH), rake(sx0 - 3.1, sx0 + 1.9, top, z1, z2, WH_T)]
    zt = sz + nw / 2                             # v45, client: "bannister does not connect to the bottom pole": the slats now start inside the post (they
                                                 # began 6 past its far face), and run up to the wall by the door, and stop there
    far += base_rail(zb, sz + 6 + (G.STAIR_N - 1) * going)
    near += base_rail(zt, zb)
    near += rail(zt, zb)
    o.append(f'<g clip-path="url(#{cid})">' + "\n".join(far) + '</g>')
    o.extend(near)
    def newel(x, z, h):                          # v41, your photo: a plain square post, flat-topped, white
        return box(x, 0, z, nw, h, nw, WH, WH_T, WH_S)
    o.append(newel(sx0 - nw / 2, sz, BN["newel_h"]))    # client: "i have no bannister or rail on wall side, only on the side closest into the room"
    return "\n".join(o)


def slats():
    o = []
    y0, y1 = WORKTOP, CEIL
    o.append(quad_front(0, y0, ALC_D, ALC_W, y1 - y0, G_FELT))
    x = 1.0
    rnd = random.Random(4)
    while x < ALC_W - 2:
        c = rnd.choice(["#bf8853", "#c58f59", "#b98250", "#c99560", "#b57d4b"])
        o.append(quad_front(x, y0, ALC_D, 2.6, y1 - y0, c))
        o.append(quad_front(x + 2.1, y0, ALC_D, 0.5, y1 - y0, "#9b6a3e", 'opacity="0.6"'))
        x += 4.0
    return "\n".join(o)


BOOK_COLS = ["#2f3e5c", "#c8452f", "#e0b43a", "#1f6f8b", "#efe6d2", "#3a3a3a", "#6a8f5a", "#b3307a", "#d27a2e", "#14806d"]


def high_shelf():
    o = []
    th, y = G.HIGH_T, G.HIGH_UNDER
    z0 = ALC_D - G.HIGH_D
    top = G.HIGH_TOP
    if STYLE == "slats":
        o.append(poly([P(0, y - 32, ALC_D - 0.1), P(ALC_W, y - 32, ALC_D - 0.1), P(ALC_W, y, ALC_D - 0.1), P(0, y, ALC_D - 0.1)], "url(#ledDown)"))
    o.append(box(0, y, z0, ALC_W, th, G.HIGH_D, OAK, OAK_T, OAK_S, "#8e6038", GH))
    if STYLE == "joinery":
        o.append(_line(P(0, y + th - 0.4, z0 - 0.01), P(ALC_W, y + th - 0.4, z0 - 0.01), "#e9bd86", 1.2))
    rnd = random.Random(9)

    def books(xa, xb, zb=20.0):
        x = xa
        while True:
            tw = rnd.choice([2.2, 2.6, 3.0, 3.4, 4.0, 2.0])
            if x + tw > xb:
                return x
            th_ = rnd.choice([21.6, 23.4, 24.0, 19.8, 25.0, 28.0, 29.5, 24.0])
            o.append(box(x, top, zb, tw, th_, rnd.choice([15.5, 16, 17]), rnd.choice(BOOK_COLS), side="#222"))
            o.append(box(x + tw * 0.2, top + th_ * 0.62, zb - 0.01, tw * 0.6, 1.0, 0.1, "#f2efe6"))
            x += tw + 0.1
    xe = books(UP_L[1] + 1.5, BOOKS_END)
    o.append(box(xe + 0.3, top, 20, 1.8, 16, 15, OAK, OAK_T, OAK_S))
    bx = BOX_X     # one lidded box for cables and controllers
    o.append(box(bx, top, 18, 30, 21, 19, "#a7a29a", "#bcb7ae", "#8f8a82"))
    o.append(box(bx, top + 21, 18, 30, 1.5, 19, "#b3aea6", "#c4bfb6", "#9a958c"))
    o.append(_line(P(bx + 11, top + 13, 17.99), P(bx + 19, top + 13, 17.99), "#77736b", 2))
    o.append(box(PRINT_X, top, 33, 22, 24, 2, "url(#art1)", side="#555"))          # framed print
    # right of the TV: the framed "now playing" 7-inch and Deco B
    fx = RZ[0] + 2.5
    o.append(box(fx, top, 32, 21.3, 21.3, 1.6, "#141414", "#222", "#0d0d0d"))
    q = [P(fx + 1.5, top + 1.5, 31.98), P(fx + 19.8, top + 1.5, 31.98), P(fx + 19.8, top + 19.8, 31.98), P(fx + 1.5, top + 19.8, 31.98)]
    o.append(art_on(q, [("#f0c24b", 0, 1, 0, 1), ("#1f3a52", 0.12, 0.88, 0.12, 0.88), ("#e8603c", 0.3, 0.7, 0.3, 0.7)]))
    c = P(fx + 10.65, top + 10.65, 31.97)
    o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{1.4 * S * K(32):.1f}" fill="#f6efe0"/>')
    dx = DECO_X
    o.append(box(dx, top, 22, 11, 11.4, 11, WHT, WHT_T, WHT_S, extra='rx="6"'))
    if STYLE == "joinery":   # 12 V lead and patch lead along the back of the shelf into the groove behind the right upright
        a_, b_, c_ = P(dx + 1, top + 0.3, 32.5), P(UP_R[0] - 2 if G.MW_SWAP else UP_R[1] + 4, top + 0.3, 36.5), P(UP_R[0] + 2.25, top + 0.3, ALC_D - 0.4)
        o.append(f'<path d="M{a_[0]:.1f},{a_[1]:.1f} Q{b_[0]:.1f},{b_[1]:.1f} {c_[0]:.1f},{c_[1]:.1f}" stroke="#2b2b2b" stroke-width="2.2" fill="none"/>')
    st, en = P(dx + 8, top + 8, 33), P(ALC_W - 2.5, CEIL, ALC_D - 2.5)    # Cat6 down from the ceiling corner
    o.append(f'<path d="M{st[0]:.1f},{st[1]:.1f} Q{en[0]-6:.1f},{st[1]-10:.1f} {en[0]:.1f},{en[1]:.1f}" stroke="#7d8c84" stroke-width="2" fill="none" opacity="0.85"/>')
    return "\n".join(o)


def series_x(sx0, y0, sz0):
    """Xbox Series X standing on its fan stand: stand 20.5 square, console 15.1 x 15.1 x 30.1."""
    fx, fy, fz = G.FAN_STAND
    o = [box(sx0, y0, sz0, fx, fy, fz, "#1c1d1f", "#2a2b2d", "#141516")]
    o.append(poly([P(sx0, y0 + fy, sz0), P(sx0 + fx, y0 + fy, sz0), P(sx0 + fx, y0, sz0), P(sx0, y0, sz0)], "url(#seriesGlow)", 'opacity="0.9"'))
    o.append(box(sx0 + 0.2, y0 + 0.05, sz0 - 0.1, fx - 0.4, 0.9, 0.1, "#3dff8a", extra='opacity="0.85"'))
    cw, ch, cd = G.SERIES_X
    cx0, cz0 = sx0 + (fx - cw) / 2, sz0 + (fz - cd) / 2
    yb = y0 + fy
    o.append(box(cx0, yb, cz0, cw, ch, cd, "#151617", "#1f2a22", "#0d0e0f"))
    if yb + ch < EYE_Y:
        o.append(ellipse_flat(cx0 + cw / 2, yb + ch + 0.05, cz0 + cd / 2, 6.2, 6.2, "#0b2a17"))
        o.append(ellipse_flat(cx0 + cw / 2, yb + ch + 0.1, cz0 + cd / 2, 4.6, 4.6, "#2fbf62", 'opacity="0.55"'))
    else:   # seen from below: the green glow of the vent on the shelf above isn't visible, show the rim light instead
        o.append(quad_front(cx0 + 0.6, yb + ch - 1.0, cz0 - 0.02, cw - 1.2, 0.6, "#2fbf62", 'opacity="0.55"'))
    p = P(cx0 + 1.7, yb + ch - 2.2, cz0 - 0.01)
    o.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.2" fill="#f1f1f1"/>')
    o.append(quad_front(cx0 + 2.0, yb + ch - 9.5, cz0 - 0.02, 0.4, 6.5, "#050505"))      # disc slot
    return "\n".join(o)


def rz_slats():
    """v12: a slatted oak panel on the back wall of the turntable zone, worktop to the high shelf, on battens.
    v13 (PLAIN): gone; the turntable zone is the painted wall, like the rest of the alcove."""
    if STYLE != "joinery" or G.PLAIN:
        return ""
    sw, sg, sd = G.RZ_SLATS
    x1, x2 = RZ[0] + 0.3, RZ[1] - 0.3
    o = [quad_front(x1, WORKTOP, ALC_D - 0.3, x2 - x1, G.HIGH_UNDER - WORKTOP, "#3a2a1c")]
    n = int((x2 - x1 + sg) // (sw + sg))
    xs0 = x1 + (x2 - x1 - (n * sw + (n - 1) * sg)) / 2
    for k in range(n):
        xs = xs0 + k * (sw + sg)
        o.append(box(xs, WORKTOP, ALC_D - sd, sw, G.HIGH_UNDER - WORKTOP, sd - 0.3, "#c48c57" if k % 2 else "#bd8550", OAK_T, OAK_S, extra=GV))
    return "\n".join(o)


def rz_shelf():
    """The right-hand zone: an oak shelf at 134 between the right upright and the reveal (through-tenoned into the
    upright), the Series X on its fan stand on it, the phono preamp hung underneath at the back."""
    o = []
    th, top, d = G.RZ_SHELF_T, G.RZ_SHELF_TOP, G.RZ_SHELF_D
    z0 = ALC_D - d
    x1, x2 = RZ
    if STYLE == "slats":
        o.append(poly([P(x1 + 1, top - 34, ALC_D - 0.1), P(x2 - 1, top - 34, ALC_D - 0.1), P(x2 - 1, top - th, ALC_D - 0.1), P(x1 + 1, top - th, ALC_D - 0.1)], "url(#ledDown)"))
    o.append(box(x1, top - th, z0, x2 - x1, th, d, OAK, OAK_T, OAK_S, extra=GH))
    pw, ph, pd = G.PREAMP
    zp = ALC_D - 1.5 - pd - (G.RZ_SLATS[2] if STYLE == "joinery" and not G.PLAIN else 0.0)
    o.append(box(x1 + 4, top - th - ph, zp, pw, ph, pd, "#26272a", "#35363a", "#1c1d1f"))
    o.append(box(x1 + 5, top - th - ph + 1.4, zp - 0.02, 0.9, 0.9, 0.05, "#5aa8ff"))
    o.append(series_x(G.SX_X[0], top, z0 + 4.0))
    return "\n".join(o)


def tv():
    o = []
    x, w, y, h = G.TV_X[0], G.TV_W, G.TV_BOTTOM, G.TV_H
    z = G.TV_PANEL_Z[0]
    cx = G.TV_CX
    o.append(box(cx - G.TV_STAND_W / 2, WORKTOP, 13, G.TV_STAND_W, 1.6, G.TV_STAND_D, "#2a2a2c", "#3a3a3d", "#202022"))
    o.append(box(cx - 6, WORKTOP + 1.6, z + 1.0, 12, y - WORKTOP, 3, "#232325"))
    o.append(box(x, y, z, w, h, G.TV_D, "#0d0d0f", "#202022", "#151517"))
    a, b = P(x + 0.6, y + h - 0.6, z), P(x + w - 0.6, y + 0.6, z)
    sx, sy, sw, sh = a[0], a[1], b[0] - a[0], b[1] - a[1]
    o.append(f'<svg x="{sx:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="{sh:.1f}" viewBox="0 0 100 57.6" preserveAspectRatio="none">'
             f'<rect width="100" height="57.6" fill="url(#screen)"/>'
             f'<circle cx="62" cy="40" r="22" fill="url(#sun)"/>'
             f'<path d="M0,44 L10,36 L19,41 L30,30 L41,39 L52,33 L60,38 L71,28 L82,37 L92,32 L100,36 L100,57.6 L0,57.6Z" fill="#3a2550" opacity="0.95"/>'
             f'<path d="M0,49 L12,43 L25,47 L38,41 L50,46 L63,42 L76,48 L88,43 L100,47 L100,57.6 L0,57.6Z" fill="#24183a"/>'
             f'<path d="M0,53 L20,50 L40,53 L58,50 L80,54 L100,51 L100,57.6 L0,57.6Z" fill="#150f24"/>'
             f'</svg>')
    return "\n".join(o)


LEDGE_ART = [
    [("#1f3a52", 0, 1, 0, 1), ("#e9b44c", 0, 1, 0, 0.42), ("#d8613e", 0.12, 0.88, 0.5, 0.9)],
    [("#efe6d2", 0, 1, 0, 1), ("#2f3e5c", 0.1, 0.9, 0.55, 0.9), ("#c8452f", 0.3, 0.7, 0.15, 0.45)],
    [("#14806d", 0, 1, 0, 1), ("#f0c24b", 0.2, 0.8, 0.2, 0.8), ("#1f1f1f", 0.42, 0.58, 0.42, 0.58)],
    [("#2c2c2c", 0, 1, 0, 1), ("#e8603c", 0.08, 0.92, 0.1, 0.3), ("#efe6d2", 0.08, 0.92, 0.66, 0.9)],
]
WRAP_ART = [
    [("#e9e3d3", 0, 1, 0, 1), ("#c8452f", 0.1, 0.9, 0.1, 0.5), ("#1f1f1f", 0.1, 0.9, 0.62, 0.9)],
    [("#2f3e5c", 0, 1, 0, 1), ("#f0c24b", 0.25, 0.75, 0.25, 0.75)],
    [("#d27a2e", 0, 1, 0, 1), ("#efe6d2", 0.1, 0.9, 0.55, 0.92), ("#14806d", 0.1, 0.45, 0.1, 0.45)],
    [("#6a8f5a", 0, 1, 0, 1), ("#1f1f1f", 0.3, 0.7, 0.3, 0.7), ("#e9b44c", 0.45, 0.55, 0.45, 0.55)],
]
TENON_Z = (ALC_D - 20.0, ALC_D - 12.0)    # tenon centres, 12 and 20 cm from the wall


def uprights():
    """Two solid oak uprights, worktop to ceiling, 4.5 thick, 30 deep, against the back wall: the left one is now a
    corner post against the side wall. The high shelf and record ledge are housed and pegged; the Series X shelf passes
    through the right upright on flush wedged tenons (they'd foul the TV if they stood proud); LED grooves wash the wall."""
    o = []
    UP, UP_T_, UP_S, UP_IN = "#c08a52", "#d6a26a", "#a06c3a", "#b17d47"
    zf = ALC_D - G.UP_D
    for xe, side in ((UP_L[1], 1), (UP_R[0], -1)):
        a, b = P(xe, 79, ALC_D - 0.2), P(xe + side * 18, G.HIGH_UNDER - 4, ALC_D - 0.2)
        o.append(f'<rect x="{min(a[0], b[0]):.1f}" y="{b[1]:.1f}" width="{abs(b[0]-a[0]):.1f}" height="{a[1]-b[1]:.1f}" fill="#ffd9a0" opacity="0.10" filter="url(#softer)"/>')
    # record ledge between the uprights, four LPs leaning on the wall
    lx0 = UP_L[1]
    o.append(box(lx0, G.LEDGE_UNDER, ALC_D - G.LEDGE_D, G.TV_GAP, G.LEDGE_TOP - G.LEDGE_UNDER, G.LEDGE_D, UP, UP_T_, UP_S, extra=GH))
    lean = math.radians(8); hgt = G.LP * math.cos(lean); dzl = G.LP * math.sin(lean)
    for i, art in enumerate(LEDGE_ART):
        x0 = lx0 + 0.45 + i * G.LP
        zb = ALC_D - 4.6
        q = [P(x0, G.LEDGE_TOP, zb), P(x0 + G.LP, G.LEDGE_TOP, zb), P(x0 + G.LP, G.LEDGE_TOP + hgt, zb + dzl), P(x0, G.LEDGE_TOP + hgt, zb + dzl)]
        o.append(art_on(q, art))
        o.append(poly(q, "none", 'stroke="#000" stroke-opacity="0.35" stroke-width="0.8"'))
    o.append(box(lx0, G.LEDGE_TOP, ALC_D - G.LEDGE_D, G.TV_GAP, G.LEDGE_LIP, 0.9, UP, UP_T_, UP_S))
    for (x1, x2) in (UP_L, UP_R):
        o.append(box(x1, WORKTOP, zf, G.UP_T, CEIL - WORKTOP, G.UP_D, UP, UP_T_, UP_IN, extra=GV))
        o.append(_line(P(x1 + 0.5, WORKTOP, zf - 0.02), P(x1 + 0.5, CEIL, zf - 0.02), "#e7b57c", 1))
        o.append(_line(P(x2 - 0.5, WORKTOP, zf - 0.02), P(x2 - 0.5, CEIL, zf - 0.02), "#8f5e33", 1))
        p = P((x1 + x2) / 2, G.HIGH_TOP - 2.0, zf - 0.03)      # peg where the high shelf is housed
        o.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.6" fill="#5e3d22"/><circle cx="{p[0]-0.6:.1f}" cy="{p[1]-0.6:.1f}" r="1" fill="#8a5c36"/>')
    for up in ((UP_L, UP_R) if G.MW_SWAP else (UP_R,)):   # and where the ledge is housed (v37: the left one is behind the wrap)
        p = P((up[0] + up[1]) / 2, G.LEDGE_TOP - 1.2, zf - 0.03)
        o.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.4" fill="#5e3d22"/>')
    for xe in (UP_L[1], UP_R[0]):
        o.append(_line(P(xe, 79, 22), P(xe, G.HIGH_UNDER - 3, 22), "#ffe2b0", 2, 'opacity="0.85"'))
    # flush wedged through-tenons on the right upright's TV face (the Series X shelf)
    xf = UP_L[1] + 0.03 if G.MW_SWAP else UP_R[0] - 0.03
    th_t = 2.4
    ym = G.RZ_SHELF_TOP - 0.8 - th_t / 2
    for zc in TENON_Z:
        o.append(poly([P(xf, ym - th_t / 2, zc - 3.0), P(xf, ym - th_t / 2, zc + 3.0), P(xf, ym + th_t / 2, zc + 3.0), P(xf, ym + th_t / 2, zc - 3.0)], "#a8743f", 'stroke="#7e5128" stroke-width="0.8"'))
        o.append(_line(P(xf - 0.01, ym, zc - 2.6), P(xf - 0.01, ym, zc + 2.6), "#4a2f19", 1.6))
    return "\n".join(o)


def led_lines():
    """Warm LED strips under the shelves (slat version only; the oak version uses the upright grooves)."""
    if STYLE != "slats":
        return ""
    o = []
    for (x1, x2, y, z) in [(1, ALC_W - 1, G.HIGH_UNDER, 12), (RZ[0] + 1, RZ[1] - 1, G.RZ_SHELF_TOP - G.RZ_SHELF_T, 16)]:
        o.append(_line(P(x1, y - 0.1, z), P(x2, y - 0.1, z), "#ffe2b0", 2.2, 'opacity="0.9"'))
    return "\n".join(o)


# ------------------------------------------------------------- the side wall: the ledge wraps the corner, the PC above the sofa
def side_run():
    """v15: the side wall's oak run: one board line from the corner post to past the PC, 4 thick, top 155.4. Its front edge is 7 off the
    wall along the LPs and sweeps out to 28 under the PC (geometry.side_run_depth), with a 5 cm radius on the end; a warm LED strip in a
    groove under the front edge washes the wall below."""
    o = []
    za, zb = G.SIDE_RUN_Z
    top, th = G.LEDGE_TOP, G.SIDE_RUN_T
    under = top - th
    R_ = G.SIDE_END_R
    zs = [za]
    z = za
    while z > zb:
        z -= 1.0 if G.SIDE_SWEEP[1] - 2 <= z <= G.SIDE_SWEEP[0] + 2 or z < zb + R_ + 1 else 6.0
        zs.append(max(z, zb))
    def d(z):
        dd = G.side_run_depth(z)
        if z < zb + R_:                      # the rounded end
            u = (zb + R_) - z
            dd = G.PC_SHELF_D - R_ + math.sqrt(max(R_ * R_ - u * u, 0.0))
        return dd
    edge = [(d(z), z) for z in zs]
    cam = cam_pos()
    if G.SIDE_GLOW and VIEW in ("front", "side"):   # the wash on the wall below the front edge
        o.append(poly([P(0.05, under, za), P(0.05, under, zb), P(0.05, under - 46, zb + 6), P(0.05, under - 46, za)], "#ffd9a0",
                      'opacity="0.16" filter="url(#softer)"'))
    def strip_(y, col, extra=""):                    # the top or underside as convex quads (the 3D builder fans each polygon)
        for (x1, z1), (x2, z2) in zip(edge, edge[1:]):
            o.append(poly([P(0, y, z1), P(0, y, z2), P(x2, y, z2), P(x1, y, z1)], col, f'stroke="{col}" stroke-width="0.6" ' + extra))
    if cam[1] < under:                               # the underside, seen from below
        strip_(under, OAK_D)
    segs = []
    for (x1, z1), (x2, z2) in zip(edge, edge[1:]):
        mid = ((x1 + x2) / 2, top - th / 2, (z1 + z2) / 2)
        segs.append((-sum((cam[i] - mid[i]) ** 2 for i in range(3)), [P(x1, under, z1), P(x2, under, z2), P(x2, top, z2), P(x1, top, z1)]))
    for _, q in sorted(segs, key=lambda t: t[0]):
        o.append(poly(q, OAK, 'stroke="#9c6a3f" stroke-width="0.4" ' + GH))
    o.append(poly([P(0, under, zb), P(edge[-1][0], under, zb), P(edge[-1][0], top, zb), P(0, top, zb)], OAK_S))   # the end
    strip_(top, OAK_T)
    if G.SIDE_GLOW:                                  # the strip itself, a warm line under the front edge
        pts_ = " ".join(f"{P(x - 1.2, under - 0.2, z)[0]:.1f},{P(x - 1.2, under - 0.2, z)[1]:.1f}" for x, z in edge[::2])
        o.append(f'<polyline points="{pts_}" fill="none" stroke="#fff1d0" stroke-width="2" opacity="0.9"/>')
    return "\n".join(o)


def wrap():
    o = []
    za, zb = G.WRAP_Z
    L = za - zb
    top = G.LEDGE_TOP
    o.append(side_run())
    lean = math.radians(8)
    hgt, dxl = G.LP * math.cos(lean), G.LP * math.sin(lean)
    xb = 4.8
    for i, art in enumerate(WRAP_ART):
        z1 = za - 1.5 - i * (G.LP + 1.4)
        z2 = z1 - G.LP
        q = [P(xb, top, z1), P(xb, top, z2), P(xb - dxl, top + hgt, z2), P(xb - dxl, top + hgt, z1)]
        o.append(art_on(q, art))
        o.append(poly(q, "none", 'stroke="#000" stroke-opacity="0.35" stroke-width="0.8"'))
    o.append(box(G.WRAP_D - 0.9, top, G.SIDE_SWEEP[0], 0.9, G.LEDGE_LIP, za - G.SIDE_SWEEP[0], OAK, OAK_T, OAK_S))   # the LPs' lip, along the 7 cm part
    # the PC end of the run (v15: the same board, swept out to 28), over the end of the sofa's return; concealed brackets inside it
    pa, pb = G.PC_SHELF_Z
    st, th, d = G.PC_SHELF_TOP, G.PC_SHELF_T, G.PC_SHELF_D
    # v6.1's roll-out keyboard tray: a 7 cm oak housing under the shelf, stopping 12 cm short of the sofa end for the cables
    kh = G.KB_TRAY["h"]
    hz0, hz1 = pb + 12.0, pa
    o.append(box(0, st - th - kh, hz0, d, kh, hz1 - hz0, OAK, OAK_T, OAK_S, extra=GH))
    o.append(quad_front(1.5, st - th - kh + 1.2, hz0 - 0.03, d - 3, kh - 2.4, "#8a5a32") if VIEW == "side" else "")
    if VIEW == "side":
        o.append(poly([P(d + 0.02, st - th - kh + 1.0, hz0 + 3), P(d + 0.02, st - th - kh + 1.0, hz1 - 3), P(d + 0.02, st - th - 1.0, hz1 - 3), P(d + 0.02, st - th - 1.0, hz0 + 3)], "#b9824c"))
        a, b = P(d + 0.04, st - th - kh + 1.8, (hz0 + hz1) / 2 - 7), P(d + 0.04, st - th - kh + 1.8, (hz0 + hz1) / 2 + 7)
        o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#5e3d22" stroke-width="3" stroke-linecap="round"/>')
    cw, ch, cd = G.PC_CASE
    cz1, cz0 = G.PC_Z
    cx1 = 2.5
    zsc = cz0 - 2.5
    sw_, sg_ = G.PC_SCREEN_SLAT

    def screen():
        """v6.1's slatted oak screen over the back of the case: open at the top for the exhaust, slats 1.2 apart."""
        q = []
        if STYLE == "joinery":
            q.append(box(1.0, st, zsc, 2.5, 48, 2.0, OAK_D, OAK_T, OAK_S))
            q.append(box(24.5, st, zsc, 2.5, 48, 2.0, OAK_D, OAK_T, OAK_S))
            q.append(box(3.5, st, zsc, 21, 3.0, 2.0, OAK_D, OAK_T, OAK_S))
            n = int((21 + sg_) // (sw_ + sg_))
            xs0 = 3.5 + (21 - (n * sw_ + (n - 1) * sg_)) / 2
            for k in range(n):
                q.append(box(xs0 + k * (sw_ + sg_), st + 3.0, zsc + 0.2, sw_, 45, 1.6, OAK, OAK_T, OAK_S, extra=GV))
        else:
            q.append(box(1.0, st, zsc, 26, 48, 1.2, "#1d1a17", "#1d1a17", "#16130f"))
            for k in range(8):
                q.append(box(1.2 + k * 3.25, st, zsc - 0.2, 2.1, 48, 1.6, OAK, OAK_T, OAK_S))
        return "\n".join(q)

    if VIEW == "side" and not G.PLAIN:       # from the side the screen is beyond the case: draw it first
        o.append(screen())
    # v18, client: "PC internals still not visible, there is a clear side panel": the case is drawn as its five steel panels (wall side,
    # top, bottom, the alcove end with the front fans, the rear) and a clear glass side to the room, so the parts inside show
    PCK = ("#121314", "#1d1f21", "#0d0e0f")
    o.append(box(cx1, st, cz0, 0.8, ch, cd, *PCK))                       # the wall side
    o.append(box(cx1, st, cz0, cw, 0.8, cd, *PCK))                       # the floor of the case
    o.append(box(cx1, st, cz0, cw, ch, 0.8, *PCK))                       # the rear, by the window
    o.append(box(cx1, st, cz1 - 1.5, cw, ch, 1.5, *PCK))                 # the front, towards the alcove
    o.append(pc_internals(cx1, st, cz0, cz1, cw, ch))
    o.append(box(cx1, st + ch - 1.0, cz0, cw, 1.0, cd, *PCK))            # the top, drawn after the parts so it sits over them
    gx = cx1 + cw + 0.02
    side = [P(gx, st + 1, cz0 + 1), P(gx, st + 1, cz1 - 1), P(gx, st + ch - 1, cz1 - 1), P(gx, st + ch - 1, cz0 + 1)]
    o.append(poly(side, "url(#glass)"))
    squash = 1.0 if VIEW == "side" else 0.42
    for (yy, zz) in [(st + 36, cz1 - 5.5), (st + 23.5, cz1 - 5.5), (st + 11, cz1 - 5.5)]:
        pc = P(gx, yy, zz); k = K(zz, gx)
        o.append(f'<ellipse cx="{pc[0]:.1f}" cy="{pc[1]:.1f}" rx="{4.6 * S * k * squash:.1f}" ry="{5.4 * S * k:.1f}" fill="none" stroke="#3fe3b0" stroke-width="3" opacity="0.9"/>')
    pc = P(gx, st + 35, cz0 + 8); k = K(cz0 + 8, gx)
    o.append(f'<ellipse cx="{pc[0]:.1f}" cy="{pc[1]:.1f}" rx="{3.6 * S * k * squash:.1f}" ry="{4.2 * S * k:.1f}" fill="none" stroke="#8b7cf0" stroke-width="2.5"/>')
    o.append(_line(P(gx, st + 18, cz1 - 16), P(gx, st + 18, cz0 + 9), "#8b7cf0", 3))
    o.append(poly(side, "url(#glass)", 'stroke="#2c3b36" stroke-width="1.5"'))
    if VIEW != "side" and not G.PLAIN:
        o.append(screen())
    if G.PLAIN:   # v13: a brush grommet at the shelf's back corner; the leads drop straight into a chased conduit
        o.append(ellipse_flat(3.4, st + 0.02, pb + 4.0, 2.4, 2.4, "#1d1e20"))
    # pad charging dock and two pads, beyond the screen
    dz = pb + 5.0
    o.append(box(4, st, dz, 9, 2.2, 18, "#2a2b2e", "#3a3b3f", "#1d1e20"))
    o.append(box(5.5, st + 2.2, dz + 2, 4.5, 6, 6.5, "#1c1d1f", "#2a2b2e"))
    o.append(box(5.5, st + 2.2, dz + 10, 4.5, 5.5, 6.5, "#e8e6e1", "#f5f3ee", "#cfccc5"))
    # v12: a slatted oak spine over the cable drop, shelf to skirting; then painted trunking along the skirting to the base
    sh = G.SKIRT_H
    spx, spz = G.SPINE
    tz = pb + 1.0
    end = G.BASE_FRONT_Z
    if G.PLAIN:   # v13: no spine and no trunking: the leads run in conduit chased into the solid wall, plastered and painted over
        return "\n".join(o)
    o.append(box(0, sh, tz, spx, st - th - sh, spz, "#3a2a1c", "#3a2a1c", "#2c2016"))
    o.append(box(0, sh, tz, spx, st - th - sh, 1.0, OAK_D, OAK_T, OAK_S))
    o.append(box(0, sh, tz + spz - 1.0, spx, st - th - sh, 1.0, OAK_D, OAK_T, OAK_S))
    yy = sh + 2.0
    while yy < st - th - 3.0:
        o.append(box(0, yy, tz + 0.6, spx + 0.4, 2.0, spz - 1.2, OAK, OAK_T, OAK_S))
        yy += 3.4
    o.append(poly([P(0.3, sh, tz + spz), P(0.3, sh + 3, tz + spz), P(0.3, sh + 3, end), P(0.3, sh, end)], "#3a6d55"))
    o.append(poly([P(0.3, sh + 3, tz + spz), P(2.0, sh + 3, tz + spz), P(2.0, sh + 3, end), P(0.3, sh + 3, end)], "#447a60"))
    return "\n".join(o)


def subwoofer():
    """The Hisense sub under the dining wall on its oak riser, inside a slatted oak box that lifts off (v12): about 40%
    open on the front and both ends so the sound and the rear port's air get out, a solid top, hands and feet kept out."""
    o = []
    if G.SUB_IN_WALL:   # v13.5: the sub stands in bay 2 (drawn with the bays); the dining wall keeps none
        return ""
    xa, xb = G.SUB_POS["x"]
    za, zb = G.SUB_POS["z"]
    if G.PLAIN:   # v13.2: the sub's oak cover: no sides, no front; a backboard on the breast, a solid top over it, a lipped tray
        hb = G.SUB_HOOD
        hx0, hx1 = hb["x"]; hz0, hz1 = hb["z"]
        ft, bt, tp, lip, ov, bk = hb["feet"], hb["base"], hb["top"], hb["lip"], hb["over"], hb["back"]
        yb = ft + bt                                  # the sub stands on the base tray
        ytu = hb["h"] - tp                            # the top's underside
        o.append(poly([P(hx0 - 3, 0.05, hz0 - 3), P(hx1 + 4, 0.05, hz0 - 3), P(hx1 + 4, 0.05, hz1), P(hx0 - 3, 0.05, hz1)], "#000", 'opacity="0.22" filter="url(#soft)"'))
        o.append(box(hx0, 0, -bk, hx1 - hx0, hb["h"], bk, OAK_D, OAK_T, OAK_S, extra=GV))                       # backboard on the breast
        for fx in (hx0 + 2, hx1 - 5):                 # rubber feet
            o.append(box(fx, 0, hz0 + 1, 3, ft, 3, "#2b2b2b"))
        o.append(box(hx0, ft, hz0, hx1 - hx0, bt, hz1 - hz0 - bk, OAK_D, OAK_T, OAK_S, extra=GH))               # base tray
        for lx in (hx0, hx1 - 1.2):                                                                              # end lips
            o.append(box(lx, ft + bt, hz0, 1.2, lip, hz1 - hz0 - bk, OAK, OAK_T, OAK_S))
        o.append(box(xa, yb, za, xb - xa, G.SUB[1], zb - za, "#1a1a1b", "#2b2b2d", "#111112"))                 # the sub, its grille to the east
        zc, yc = (za + zb) / 2, yb + G.SUB[1] / 2
        o.append(disc_x(xa - 0.03, yc, zc, 8.6, "#3a3b3e", 'stroke="#555" stroke-width="1"'))                  # perforated metal grille
        o.append(disc_x(xa - 0.05, yc, zc, 7.6, "#0c0c0c"))
        o.append(disc_x(xa - 0.07, yc, zc, 2.5, "#2a2a2c"))
        o.append(box(hx0, ft + bt, hz0, hx1 - hx0, lip, 1.2, OAK, OAK_T, OAK_S))                                  # front lip
        o.append(box(hx0 - ov, ytu, hz0 - ov, hx1 - hx0 + 2 * ov, tp, hz1 - hz0 + ov, OAK, OAK_T, OAK_S, extra=GH))   # the cover: spill shield
        o.append(_line(P(hx0 - ov, ytu + 0.4, hz0 - ov - 0.02), P(hx1 + ov, ytu + 0.4, hz0 - ov - 0.02), "#8f5e33", 1.0))   # drip groove line
        return "\n".join(o)
    bx0, bx1 = G.SUB_BOX["x"]
    bz0, bz1 = G.SUB_BOX["z"]
    bh = G.SUB_BOX["h"]
    o.append(poly([P(bx0 - 3, 0.05, bz0 - 4), P(bx1 + 4, 0.05, bz0 - 4), P(bx1 + 4, 0.05, bz1), P(bx0 - 3, 0.05, bz1)], "#000", 'opacity="0.22" filter="url(#soft)"'))
    o.append(box(xa - 2, 0, za - 2, xb - xa + 4, 5, zb - za + 2, OAK_D, OAK_T, OAK_S, extra=GH))
    o.append(box(xa, 5, za, xb - xa, G.SUB[1], zb - za, "#1a1a1b", "#2b2b2d", "#111112"))
    zc, yc = (za + zb) / 2, 5 + G.SUB[1] / 2
    o.append(disc_x(xa - 0.03, yc, zc, 7.6, "#0c0c0c", 'stroke="#3a3a3c" stroke-width="2"'))
    o.append(disc_x(xa - 0.05, yc, zc, 2.5, "#2a2a2c"))
    o.append(sub_box())
    return "\n".join(o)


def sub_box():
    o = []
    bx0, bx1 = G.SUB_BOX["x"]
    bz0, bz1 = G.SUB_BOX["z"]
    bh = G.SUB_BOX["h"]
    sw, sg, st = G.SUB_BOX_SLAT
    post, rail, top_t = 3.0, 3.0, 2.0
    LT, LS = "#cf9a63", "#a87443"
    # the two ends first (the camera sees one of them), then the front, then the top
    for xe in (bx0, bx1 - st):
        o.append(box(xe, 0, bz0 + post, st, rail, bz1 - bz0 - post, OAK, OAK_T, OAK_S))
        span = bz1 - bz0 - post
        n = int((span - 1.0 + sg) // (sw + sg))
        for k in range(n):
            zz = bz0 + post + 0.5 + k * (sw + sg)
            o.append(box(xe, rail, zz, st, bh - rail - top_t, sw, OAK, LT, LS))
    for xp in (bx0, bx1 - post):
        o.append(box(xp, 0, bz0, post, bh - top_t, post, OAK_D, OAK_T, OAK_S, extra=GV))
    o.append(box(bx0 + post, 0, bz0, bx1 - bx0 - 2 * post, rail, st, OAK, OAK_T, OAK_S))
    span = bx1 - bx0 - 2 * post
    n = int((span + sg) // (sw + sg))
    x_start = bx0 + post + (span - (n * sw + (n - 1) * sg)) / 2
    for k in range(n):
        xs = x_start + k * (sw + sg)
        o.append(box(xs, rail, bz0, sw, bh - rail - top_t, st, "#c48c57" if k % 2 else "#bf8650", LT, LS, extra=GV))
    o.append(box(bx0 - 0.5, bh - top_t, bz0 - 0.5, bx1 - bx0 + 1, top_t, bz1 - bz0 + 0.5, OAK, OAK_T, OAK_S, extra=GH))
    return "\n".join(o)


def sofa():
    """The end of the L-sofa (assumed 247 × 168, until measured), drawn see-through and cut away 70 cm back from its
    end, so the base, the sub and the PC shelf above stay visible."""
    if not SOFA_GHOST:
        return ""
    g = 'fill-opacity="0.14" stroke="#f3ead8" stroke-opacity="0.7" stroke-width="1.4" stroke-dasharray="7 5"'
    c = "#f3ead8"
    x0 = G.SOFA_X[0]
    cx1, ze = G.CHAISE_X[1], G.CHAISE_END_Z
    cut = ze - 70.0
    o = [box(x0, 0, cut, cx1 - x0, 45, ze - cut, c, extra=g),                 # the return's seat, along the side wall
         box(x0, 45, cut, 22, G.SOFA_H - 45, ze - 22 - cut, c, extra=g),      # its back against the side wall
         box(x0, 45, ze - 22, cx1 - x0, 17, 22, c, extra=g)]                  # the arm at its end
    a, b = P(x0, 0, cut), P(cx1, 0, cut)
    o.append(text((a[0] + b[0]) / 2, a[1] - 8, "sofa continues to the window", size=11.5, anchor="middle", op=0.85))
    return "\n".join(o)


# ------------------------------------------------------------- the base unit in the alcove (local z: 0 = front)
def unit():
    return place(0, 0, G.BASE_FRONT_Z, _unit)


def _unit():
    o = []
    o.append(poly([P(-1, 0.05, 0), P(ALC_W + 1, 0.05, 0), P(ALC_W + 1, 0.05, -10), P(-1, 0.05, -10)], "#000", 'opacity="0.18" filter="url(#soft)"'))

    def bay1():
        # bay 1 (Xbox) in its own BESTÅ coordinates 0..60 (v38: placed at bay 1, which MW_SWAP moves to the TV's end)
        q = []
        q.append(bay_interior(1.6, 58.4, 1.6, 62.4))
        q.append(poly([P(1.6, 62.4, 2), P(58.4, 62.4, 2), P(58.4, 40, 2), P(1.6, 40, 2)], "url(#warmpool)", 'opacity="0.9"'))
        q.append(ply_shelf(1.6, 58.4, 26.8)); q.append(ply_shelf(1.6, 58.4, 44.6))
        if G.SUB_IN_WALL:
            # v13.5: the bricks lie flat at the back of their rows, by the power leads; the RetroTINK and the HDMI
            # switch take the fronts they free
            q.append(box(36.5, 28.6, 27, 21, 6, 10, "#262628", "#333336", "#1a1a1c"))          # Xbox 360 brick, at the back
            q.append(xbox360(5, 28.6, 6))
            q.append(box(37.5, 28.6, 6, 20, 4.5, 15, "#2a2b2e", "#3a3b3f", "#1a1b1d")); q.append(box(39, 30.4, 5.99, 1.6, 0.6, 0.1, "#79b8ff"))
            q.append(box(39.5, 46.4, 30, 17, 4.8, 7.5, "#262628", "#333336", "#1a1a1c"))       # Xbox One brick, at the back
            q.append(xboxone(5, 46.4, 6))
            q.append(box(41, 46.4, 4, 12.7, 2.5, 5.9, "#1f1f22", "#303034")); q.append(box(42, 47.2, 3.99, 1, 0.5, 0.1, "#ff5a4a"))
        else:
            q.append(xbox360(5, 28.6, 6)); q.append(box(38.5, 28.6, 9, 18, 6.2, 10, "#262628", "#333336", "#1a1a1c"))
            q.append(xboxone(5, 46.4, 6)); q.append(box(40.5, 46.4, 9, 16, 5.6, 9, "#262628", "#333336", "#1a1a1c"))
        if GAME_OPEN == 0:
            q.append(game_drawer(0))
        return "\n".join(q)

    def bays12():
        # bay 2 (PlayStation) 60..120 in the BESTÅ coordinates of v9 (bay 1 was 0..60 beside it)
        q = []
        q.append(bay_interior(61.6, 118.4, 1.6, 62.4))
        q.append(poly([P(61.6, 62.4, 2), P(118.4, 62.4, 2), P(118.4, 40, 2), P(61.6, 40, 2)], "url(#warmpool)", 'opacity="0.9"'))
        if G.SUB_IN_WALL:
            # v13.5: bay 2's lower part splits: the sub's column on the left (under the TV), a 12 mm ply divider,
            # and the PS2 over the PS1 on a part shelf on the right
            c0, c1 = G.SUB_COL[0] - G.FILLER, G.SUB_COL[1] - G.FILLER
            p0, p1 = G.PS_COL[0] - G.FILLER, G.PS_COL[1] - G.FILLER
            sx0, sx1 = G.SUB_IN["x"][0] - G.FILLER, G.SUB_IN["x"][1] - G.FILLER
            ys, (sw, sh, sd) = 1.6 + G.SUB_RISER_H, G.SUB
            q.append(box(c1, 1.6, 2, G.SUB_DIV_T, 35.3, 38, "#d8c39f", "#e6d2ae", "#b99e78"))   # the divider
            q.append(ply_shelf(p0, p1, 18.6)); q.append(ply_shelf(61.6, 118.4, 36.9))
            q.append(ps1(p0 + 2.6, 1.6, 6))
            q.append(ps2(p0 + 1.0, 20.4, 6))
            q.append(box(sx0 - 0.5, 1.6, 2, sw + 1, G.SUB_RISER_H, sd - 2, "#3a3d3a", "#4a4e4a", "#2c2f2c"))   # isolation riser
            q.append(box(sx0, ys, 0.05, sw, sh, sd, "#1a1a1b", "#2b2b2d", "#111112"))           # the sub, driver to the room
            q.append(disc_z(sx0 + sw / 2, ys + sh / 2, 0.0, 8.6, "#3a3b3e", 'stroke="#555" stroke-width="1"'))
            q.append(disc_z(sx0 + sw / 2, ys + sh / 2, -0.02, 7.6, "#0c0c0c"))
            q.append(disc_z(sx0 + sw / 2, ys + sh / 2, -0.04, 2.5, "#2a2a2c"))
        else:
            q.append(ply_shelf(61.6, 118.4, 18.6)); q.append(ply_shelf(61.6, 118.4, 36.9))
            q.append(ps1(63.5, 1.6, 6))
            q.append(box(93.5, 1.6, 8, 20, 4.5, 15, "#2a2b2e", "#3a3b3f", "#1a1b1d")); q.append(box(95, 3.4, 7.99, 1.6, 0.6, 0.1, "#79b8ff"))
            q.append(ps2(63.5, 20.4, 6))
            q.append(box(97, 20.4, 3, 13, 2.4, 7, "#1f1f22", "#303034")); q.append(box(98, 21.2, 2.99, 1, 0.5, 0.1, "#ff5a4a"))
        q.append(ps3(63.5, 38.7, 6))
        q.append(box(99, 38.7, 4, 17.5, 10, 16, "#c9a26a", "#d8b480", "#a98455"))
        for i in range(5):
            q.append(box(99.2, 39.5 + i * 2, 3.99, 17.1, 0.25, 0.1, "#a8834f"))
        return "\n".join(q)
    o.append(place(G.BAYS[1][0] - 60.0, RAISE, 0, bays12))
    o.append(place(G.BAYS[0][0], RAISE, 0, bay1))

    # bay 3: 18 mm ply carcass from the floor. v16: a 12 mm ply divider splits it: the LP column on the right, under the turntable (two
    # snug face-out crates), the slim column on the left (two face-out game drawers, the pads and remotes drawer on top)
    b3a, b3b = G.BAYS[2]
    o.append(bay_interior(b3a + 1.8, b3b - 1.8, 1.8, 71.2))
    o.append(poly([P(b3a + 1.8, 71.2, 2), P(b3b - 1.8, 71.2, 2), P(b3b - 1.8, 48, 2), P(b3a + 1.8, 48, 2)], "url(#warmpool)", 'opacity="0.9"'))
    o.append(box(G.B3_DIV[0], 1.8, 2, G.B3_DIV[1] - G.B3_DIV[0], 69.4, 38, "#d8c39f", "#e6d2ae", "#b99e78"))
    if REC_OPEN_UP == 0:
        o.append(record_tier(G.TRAY_UPPER[0], 0))
    if REC_OPEN == 0:
        o.append(record_tier(G.TRAY_LOWER[0], 0))
    for k, d in enumerate(G.SLIM_DRAWERS):
        if not (k == 1 and SLIM_OPEN > 0):
            o.append(slim_drawer(d, 0))

    (b1a, b1b), (b2a, b2b), _ = G.BAYS
    o.append(face_frame(0, ALC_W, [(b1a + 2.6, b1b - 2.6, 11.6), (b2a + 2.6, b2b - 2.6, 11.6), (b3a + 2.6, G.FACE_STILE[0], 2.6), (G.FACE_STILE[1], b3b - 2.6, 2.6)]))
    o.append(_line(P(min(b1a, b2a) - G.FILLER, 9, -0.02), P(max(b1b, b2b) + G.FILLER, 9, -0.02), "#000", 1, 'stroke-opacity="0.2"'))   # v38: the plinth's line under bays 1 and 2
    # the hidden slim drawer in the plinth under bay 2: a push-to-open front in the bottom rail
    pxa, pxb = G.PLINTH_DRAWER["x"]
    pya, pyb = G.PLINTH_DRAWER["y"]
    o.append(quad_front(pxa, pya, -0.03, pxb - pxa, pyb - pya, "none", 'stroke="#000" stroke-opacity="0.32" stroke-width="1.2"'))
    if PLINTH_OPEN > 0:
        o.append(plinth_drawer(PLINTH_OPEN))
    o.append(place(G.BAYS[0][0], RAISE, 0, lambda: game_drawer(GAME_OPEN) if GAME_OPEN > 0 else game_drawer(0, "lip")))
    o.append(record_tier(G.TRAY_UPPER[0], REC_OPEN_UP) if REC_OPEN_UP > 0 else record_tier(G.TRAY_UPPER[0], 0, "lip"))
    o.append(record_tier(G.TRAY_LOWER[0], REC_OPEN) if REC_OPEN > 0 else record_tier(G.TRAY_LOWER[0], 0, "lip"))
    for k, d in enumerate(G.SLIM_DRAWERS):
        o.append(slim_drawer(d, SLIM_OPEN) if (k == 1 and SLIM_OPEN > 0) else slim_drawer(d, 0, "lip"))
    o.append(worktop_top(0, ALC_W, G.BASE_D))
    # brush-lined cable slot behind the TV, and a grommet behind the deck
    sl0, sl1 = G.TV_CX - 53.75, G.TV_CX + 52.25                              # v38: the slot follows the TV, the grommet the deck
    o.append(poly([P(sl0, 76.02, 41), P(sl1, 76.02, 41), P(sl1, 76.02, 44.5), P(sl0, 76.02, 44.5)], "#2a1f16", 'opacity="0.85"'))
    o.append(ellipse_flat((G.DECK_X[0] + G.DECK_X[1]) / 2, 76.02, 42.5, 3.0, 1.6, "#2a1f16", 'opacity="0.85"'))
    return "\n".join(o)


PLINTH_OPEN = 0.0


def plinth_drawer(open_cm):
    """v13.2: the hidden plinth drawer under bay 2, pulled out: a 12 mm ply box 52 x 34 x 5 inside with 32 PS1 games in
    eight stacks of four, and its oak front with the finger pull underneath."""
    o = []
    pxa, pxb = G.PLINTH_DRAWER["x"]
    pya, pyb = G.PLINTH_DRAWER["y"]
    bw, bd, bh = G.PLINTH_DRAWER["box"]
    zf = G.BASE_FRONT_Z - open_cm
    bx0 = (pxa + pxb) / 2 - bw / 2 - 1.2
    PLY, PLY_T, PLY_S = "#d9c09a", "#e8d3b0", "#b99e78"
    o.append(poly([P(bx0, 0.05, zf), P(bx0 + bw + 2.4, 0.05, zf), P(bx0 + bw + 2.4, 0.05, zf + 30), P(bx0, 0.05, zf + 30)], "#000", 'opacity="0.2" filter="url(#soft)"'))
    o.append(box(bx0, pya, zf + 1.2, bw + 2.4, bh + 1.2, 1.2, PLY, PLY_T, PLY_S))                            # back... far side drawn first
    o.append(box(bx0, pya, zf + 1.2 + bd, bw + 2.4, bh + 1.2, 1.2, PLY, PLY_T, PLY_S))
    o.append(box(bx0, pya, zf + 1.2, 1.2, bh + 1.2, bd + 1.2, PLY, PLY_T, PLY_S))
    o.append(box(bx0 + 1.2, pya, zf + 1.2, bw, 1.2, bd, "#cdb38a", "#5a5148"))                              # base, felt
    for i in range(4):
        for j in range(2):
            xx, zz = bx0 + 1.7 + i * 12.9, zf + 2.4 + j * 16.2
            for kk in range(4):
                o.append(box(xx, pya + 1.2 + kk * 1.0, zz, 12.5, 1.0, 14.2, "#cfd6dc" if kk % 2 else "#e4e8ec", "#f3f5f7", "#aab3bb"))
            o.append(poly([P(xx + 1, pya + 5.21, zz + 1), P(xx + 11.5, pya + 5.21, zz + 1), P(xx + 11.5, pya + 5.21, zz + 13.2), P(xx + 1, pya + 5.21, zz + 13.2)],
                          ["#1f3a52", "#c8452f", "#e0b43a", "#14806d", "#2f3e5c", "#d27a2e", "#6a8f5a", "#b3307a"][(i + j * 4) % 8]))
    o.append(box(bx0 + bw + 1.2, pya, zf + 1.2, 1.2, bh + 1.2, bd + 1.2, PLY, PLY_T, PLY_S))
    o.append(box(pxa - 1, pya, zf - 0.8, pxb - pxa + 2, pyb - pya, 2.0, OAK, OAK_T, OAK_S, extra=GH))      # the oak front
    return "\n".join(o)


def deck():
    """A deck the size of an Audio-Technica AT-LP120XUSB (45.2 x 35.2 x 14.2 with lid), the worst case allowed for,
    on the worktop in the right-hand zone."""
    o = []
    dw, dh, dd = G.DECK
    x0 = G.DECK_X[0]
    z0 = G.DECK_Z[0]
    y0 = WORKTOP
    for fx_, fz_ in ((x0 + 3, z0 + 3), (x0 + dw - 6, z0 + 3)):
        o.append(box(fx_, y0, fz_, 3, 1.2, 3, "#3a3a3a"))
    o.append(box(x0, y0 + 1.2, z0, dw, 9.0, dd, "#1c1c1e", "#2c2c2f", "#121213"))
    o.append(quad_front(x0 + 0.4, y0 + 1.6, z0 - 0.02, dw - 0.8, 0.5, "#6d6d72"))
    cxp, czp = x0 + 18.5, z0 + dd / 2 + 0.5
    o.append(ellipse_flat(cxp, y0 + 10.4, czp, 15.5, 15.5, "#4a4a4e"))
    o.append(ellipse_flat(cxp, y0 + 11.0, czp, 15, 15, "#0b0b0c"))
    o.append(ellipse_flat(cxp, y0 + 11.1, czp, 4.5, 4.5, "#d4553f"))
    o.append(ellipse_flat(x0 + 4, y0 + 10.25, z0 + 5, 1.8, 1.8, "#d0d0d4"))                     # start/stop
    o.append(box(x0 + dw - 4.5, y0 + 10.2, z0 + 14, 1.2, 0.4, 14, "#8a8a90"))                   # pitch slider
    a, b = P(x0 + dw - 9, y0 + 12.2, z0 + dd - 6), P(x0 + 30, y0 + 12.2, z0 + 8)
    o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#cfcfd2" stroke-width="2.5"/>')
    o.append(box(x0 + dw - 11, y0 + 10.2, z0 + dd - 4, 4, 2.6, 4, "#9a9aa0"))
    o.append(box(x0, y0 + 10.2, z0, dw, 4.0, dd, "url(#glass)", "url(#glass)", "url(#glass)", extra='stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"'))
    return "\n".join(o)


def worktop_items():
    o = []
    # soundbar centred under the TV at the front edge, 92 x 6 x 9
    sw, sh_, sd = G.SOUNDBAR
    o.append(box(G.TV_CX - sw / 2, WORKTOP, -7, sw, sh_, sd, "#1b1c1e", "#2a2b2d", "#121314"))
    for i in range(40):
        o.append(box(G.TV_CX - sw / 2 + 1.5 + i * 2.25, WORKTOP + 0.8, -7.01, 0.9, 4.4, 0.05, "#26272a"))
    o.append(deck())
    return "\n".join(o)


# ------------------------------------------------------------- the dining wall on the chimney breast
def pc_internals(cx1, st, cz0, cz1, cw, ch):
    """v17, client: "add a lit up PC internals to make it clear of what it is, it has a clear side window". Seen through the glass (the
    case's +x side faces the room): the motherboard on the far side, the PSU shroud along the bottom, a graphics card across the middle,
    a tower cooler and four RAM sticks above it, three front fans (alcove end) and one rear fan. Boxes, so the 3D room has them too; the
    3D room lights the fan rings and an RGB strip, and puts a small light inside."""
    o = []
    gin = cx1 + cw - 1.0                                                                     # just inside the glass
    o.append(box(cx1 + 1.0, st + 9.5, cz0 + 2.0, 0.8, ch - 12.0, cz1 - cz0 - 10.0, "#16201f", "#1d2a28", "#101716"))     # motherboard
    o.append(box(cx1 + 1.0, st + 0.8, cz0 + 1.0, cw - 2.4, 8.5, cz1 - cz0 - 2.0, "#1b1d20", "#26292d", "#141518"))        # PSU shroud
    o.append(box(cx1 + 2.0, st + 16.5, cz0 + 3.0, 12.0, 4.2, 30.0, "#24272b", "#34383d", "#1a1c1f"))                     # graphics card
    o.append(box(cx1 + 13.8, st + 16.9, cz0 + 4.0, 0.3, 3.4, 26.0, "#d6d9dc"))                                           # its backplate edge
    o.append(box(cx1 + 2.0, st + 25.5, cz0 + 11.0, 13.0, 12.0, 7.0, "#8d9196", "#a4a8ad", "#6f7378"))                    # tower cooler
    o.append(box(cx1 + 2.0, st + 25.5, cz0 + 18.0, 13.0, 12.0, 2.5, "#1b1c1e", "#2a2b2e", "#141516"))                    # its fan
    for k in range(4):                                                                                                   # RAM
        o.append(box(cx1 + 2.0, st + 26.0, cz0 + 21.5 + k * 1.3, 4.0, 11.0, 0.7, "#2a2d31", "#d94bd0", "#1e2023"))
    for yy in (st + 11.0, st + 23.5, st + 36.0):                                                                          # front fans
        o.append(box(cx1 + 3.0, yy - 6.0, cz1 - 4.0, cw - 6.0, 12.0, 2.5, "#151617", "#1f2022", "#0f1011"))
    o.append(box(cx1 + 3.0, st + 30.0, cz0 + 0.8, cw - 6.0, 12.0, 2.5, "#151617", "#1f2022", "#0f1011"))                 # rear fan
    return "\n".join(o)


def fliptop_wall():
    """v15: the flip-top gate-leg table. The oak backboard carries a 7.3 cm hinge rail; the 110 × 80 top hinges on its front edge and sits
    on two Hebgo brackets; a second 110 × 80 oak half is hinged to the top's front edge on three brass card-table hinges and opens out on
    a folding oak gate leg, so the table runs 160 into the room and never comes off the wall. Folded, the half and its gate sit behind the
    top, against the breast."""
    o = []
    x0, x1 = G.TABLE_X
    tw, td, tt = G.TABLE
    L, Hr, Dr = G.RAIL
    rt = G.RAIL_TOP
    lw_, ld_, lt_ = G.FLIP["leaf"]
    o.append(box(x0, rt - Hr, -3.0, L, Hr, 3.0, OAK, OAK_T, OAK_S, extra=GH))                         # the backboard
    o.append(box(x0, rt - 4.0, -Dr, L, 4.0, Dr - 3.0, OAK_D, OAK_T, OAK_S, extra=GH))                  # the hinge rail on its top
    arm, bh = G.HEBGO
    for bx in G.HEBGO_X:
        o.append(box(bx - 1.6, rt - bh + 1, -3.6, 3.2, bh - 5, 0.6, STEEL, STEEL_T, STEEL_S))
        if DINING == "folded":
            o.append(box(bx - 1.4, rt - arm, -5.6, 2.8, arm - 4.5, 2.0, STEEL, STEEL_T, STEEL_S))
        else:
            o.append(box(bx - 1.4, rt - 2.4, -3.0 - arm, 2.8, 2.4, arm - 0.6, STEEL, STEEL_T, STEEL_S))
            a, b, c, d = P(bx, rt - bh + 2, -3.6), P(bx, rt - bh + 5, -3.6), P(bx, rt - 2.4, -33), P(bx, rt - 2.4, -29)
            o.append(poly([a, c, d, b], STEEL_S))
    for hx in (x0 + 12, (x0 + x1) / 2, x1 - 12):       # three lift-off hinges on the rail's front edge
        o.append(box(hx - 5, rt - 0.4, -Dr - 0.5, 10, 0.9, 1.2, "#8a8c8f", "#a2a4a7", "#6f7174"))
    bb = G.BREADBOARD
    if DINING == "folded":
        g_t = G.FLIP["gate_t"]
        o.append(box(x0 + 6, rt + 2, -3.0 - g_t, tw - 12, td - 6, g_t, OAK_D, OAK_T, OAK_S))           # the folded gate, against the breast
        o.append(box(x0, rt + 0.2, -3.0 - g_t - lt_, lw_, ld_, lt_, OAK, OAK_T, OAK_S, extra=GH))      # the half, flipped behind the top
        zt = -Dr - tt - 0.3
        o.append(box(x0, rt + 0.2, zt, tw, td, tt, OAK, OAK_T, OAK_S, extra=GH))                       # the top, folded up: its underside to the room
        # v17: the breadboard joints, pegs and the hinge line as thin boxes (lines aren't carried into the 3D room)
        for xl in (x0 + bb, x1 - bb):
            o.append(box(xl - 0.15, rt + 0.4, zt - 0.06, 0.3, td - 0.8, 0.06, "#8f5e33"))
        for (ea, eb) in ((x0, x0 + bb), (x1 - bb, x1)):
            for py in (rt + 14, rt + td / 2, rt + td - 14):
                o.append(box((ea + eb) / 2 - 0.5, py - 0.5, zt - 0.08, 1.0, 1.0, 0.08, "#5e3d22"))
        o.append(box(x0, rt + 0.1, zt - 0.06, tw, 0.4, 0.06, "#5a3a20"))
        for bxx in (x0 + 16, x1 - 16):                   # turn buttons on the breast hold it up
            o.append(box(bxx - 2.6, G.FOLDED_TOP + 0.4, -2.4, 5.2, 2.6, 2.2, OAK_D, OAK_T, OAK_S))
        o.append(breast_frames())
        return "\n".join(o)
    # open: the top on its brackets, the half flipped out beyond it on the gate leg
    z0, z1 = G.OPEN_Z
    zj = G.TABLE_Z[1]                                    # the joint
    gl = G.GATE_LEG_H
    lw, lf = G.LEG
    ins, gin = G.FLIP["inset"], G.FLIP["hinge_in"]
    ah, at = G.FLIP["apron"]
    o.append(poly([P(x0 - 6, 0.05, zj), P(x1 + 6, 0.05, zj), P(x1 + 6, 0.05, z1 - 6), P(x0 - 6, 0.05, z1 - 6)], "#000", 'opacity="0.16" filter="url(#soft)"'))
    def tleg(cx, cz):
        q = []
        segs = 24
        for k in range(segs):
            y0, y1 = gl * k / segs, gl * (k + 1) / segs
            wv = lf + (lw - lf) * (k + 0.5) / segs
            q.append(box(cx - wv / 2, y0, cz - wv / 2, wv, y1 - y0 + 0.02, wv, OAK, OAK_T, OAK_S))
        q.append(box(cx - lf / 2, 0, cz - lf / 2, lf, 0.4, lf, "#2b2622"))
        return q
    lz = z1 + gin + lw / 2
    o.append(box(x0 + ins, gl - ah, lz - at / 2, tw - 2 * ins, ah, at, OAK_D, OAK_T, OAK_S))           # the gate's apron
    o += tleg(x0 + ins + lw / 2, lz)
    o += tleg(x1 - ins - lw / 2, lz)
    o.append(box(x0, rt, zj, tw, tt, -zj + z0, OAK, OAK_T, OAK_S, extra=GH))                            # the top
    o.append(box(x0, rt, z1, lw_, lt_, zj - z1, OAK, OAK_T, OAK_S, extra=GH))                           # the half
    top = rt + tt
    # v17: the breadboard ends as thin boxes with their three pegs, the joint, and the three brass flip-top hinges showing on top across it
    for (za, zb_) in ((zj, z0), (z1, zj)):
        for (ea, eb) in ((x0, x0 + bb), (x1 - bb, x1)):
            o.append(box(ea, top, za, eb - ea, 0.05, zb_ - za, OAK_D, OAK_T, OAK_S, extra=GV))
            for k in range(3):
                pz = za + (zb_ - za) * (k + 1) / 4
                o.append(box((ea + eb) / 2 - 0.5, top + 0.05, pz - 0.5, 1.0, 0.04, 1.0, "#5e3d22"))
    o.append(box(x0, top, zj - 0.3, tw, 0.06, 0.6, "#6b4527"))                                           # the joint
    hw, hl = G.FLIP["hinge"]
    for hx in (x0 + 12, (x0 + x1) / 2, x1 - 12):
        o.append(box(hx - hl / 2, top + 0.02, zj - hw / 2, hl, 0.1, hw, "#c9a24a", "#e0bf6a", "#a8842f"))   # brass, flush in the top
    o.append(quad_front(x0, rt, z1 - 0.02, tw, tt, OAK_S))
    o.append(table_settings(x0, x1, z0, z1, top, n_side=2 if DINING == "four" else 3))
    o.append(breast_frames())
    return "\n".join(o)


SITE = G.DINING_SITE        # v16: "stairs" by default: the table on the stairs wall, the breast free
SITE_NOW = SITE


def now_playing():
    """v16: with the table by the stairs, an oak "now playing" ledge on the chimney breast beside the turntable: 7 deep with a 1.5 lip,
    for the sleeve of the record that's on and the next two, leaning back 8 degrees."""
    L = G.NOW_LEDGE
    x0, x1 = L["x"]
    y, d, t, lip = L["top"], L["d"], L["t"], L["lip"]
    o = [box(x0, y - t, -d, x1 - x0, t, d, OAK, OAK_T, OAK_S, extra=GH), box(x0, y, -d, x1 - x0, lip, 1.2, OAK, OAK_T, OAK_S)]
    lean = math.radians(8)
    hgt, dz = G.LP * math.cos(lean), G.LP * math.sin(lean)
    gap = (x1 - x0 - L["n"] * G.LP) / (L["n"] + 1)
    arts = [[("#e9e3d3", 0, 1, 0, 1), ("#c8452f", 0.12, 0.88, 0.12, 0.62), ("#1f1f1f", 0.38, 0.62, 0.7, 0.9)],
            [("#2f3e5c", 0, 1, 0, 1), ("#f0c24b", 0, 1, 0.78, 1), ("#efe6d2", 0.2, 0.8, 0.2, 0.66)],
            [("#14806d", 0, 1, 0, 1), ("#e8603c", 0.1, 0.5, 0.1, 0.9), ("#f1e7d0", 0.55, 0.9, 0.1, 0.9)]]
    for i in range(L["n"]):
        xa = x0 + gap + i * (G.LP + gap)
        q = [P(xa, y, -d + 2.0), P(xa + G.LP, y, -d + 2.0), P(xa + G.LP, y + hgt, -d + 2.0 + dz), P(xa, y + hgt, -d + 2.0 + dz)]
        o.append(art_on(q, arts[i % 3]))
        o.append(poly(q, "none", 'stroke="#000" stroke-opacity="0.3" stroke-width="0.8"'))
    return "\n".join(o)


def record_shelf():
    """v18.1, the client's vinyl stand (their listing): 70 × 32 × 78, a black steel frame whose front posts rise to 63 and slope back to the
    rear posts at 78; rustic wood: a bottom shelf with four wire dividers 19.5 tall, an upper shelf at about 46 with a 10 cm front board,
    a wooden divider making two bays of 32.3, two back boards. In layout A (the recommendation) it stands on the breast under the
    “now playing” ledge, LPs face-out."""
    lay = G.PLANT_LAYOUTS[G.PLANT_LAYOUT]
    cx, cz, facing = lay["records"]
    if facing != -1:                     # in the window corner: out of these views
        return ""
    Rs = G.RECORD_SHELF
    w, d, h, ft = Rs["w"], Rs["d"], Rs["h"], Rs["frame_top"]
    x0, z0 = cx - w / 2, cz - d / 2                     # z0: the front (room side)
    ST = (Rs["steel"], "#2a2a2d", "#141416")
    WD = (Rs["col"], "#8e6340", "#5e3d22")
    p_ = 2.0
    o = []
    for xx in (x0, x0 + w - p_):                       # the rear posts, full height
        o.append(box(xx, 0, z0 + d - p_, p_, h, p_, *ST))
    o.append(box(x0, h - 10.0, z0 + d - 3.0, w, 6.0, 1.6, *WD))                       # back boards
    o.append(box(x0, h - 22.0, z0 + d - 3.0, w, 6.0, 1.6, *WD))
    o.append(box(x0 + p_, Rs["bottom_y"], z0 + d - 3.0, w - 2 * p_, 10.0, 1.6, *WD))  # the bottom shelf's back board
    o.append(box(x0 + p_, Rs["bottom_y"], z0, w - 2 * p_, 2.0, d, *WD))              # bottom shelf
    arts = [[("#e9e3d3", 0, 1, 0, 1), ("#2f3e5c", 0.15, 0.85, 0.15, 0.7)], [("#d24b33", 0, 1, 0, 1), ("#f3d27a", 0.1, 0.9, 0.62, 0.9)],
            [("#1f1f1f", 0, 1, 0, 1), ("#e8e1cf", 0.3, 0.7, 0.3, 0.7)], [("#14806d", 0, 1, 0, 1), ("#efe6d2", 0.1, 0.9, 0.1, 0.45)]]
    lp = G.LP
    # the bottom shelf: LPs face-out, the front one showing, a wire divider in front of it
    yb = Rs["bottom_y"] + 2.0
    q = [P(x0 + (w - lp) / 2, yb, z0 + 6.0), P(x0 + (w + lp) / 2, yb, z0 + 6.0), P(x0 + (w + lp) / 2, yb + lp * 0.98, z0 + 6.0 + lp * 0.17), P(x0 + (w - lp) / 2, yb + lp * 0.98, z0 + 6.0 + lp * 0.17)]
    o.append(art_on(q, arts[2])); o.append(poly(q, "none", 'stroke="#000" stroke-opacity="0.3" stroke-width="0.8"'))
    for k in range(Rs["wires"]):                       # the wire dividers: thin steel V's across the shelf
        xx = x0 + 10.0 + k * (w - 20.0) / (Rs["wires"] - 1)
        o.append(box(xx, yb, z0 + 3.0, 0.5, Rs["wire_h"], 0.5, *ST))
    # the upper shelf, its front board, the divider and two LPs face-out, one a bay
    sy = Rs["shelf_y"]
    o.append(box(x0 + p_, sy, z0, w - 2 * p_, 2.0, d, *WD))
    o.append(box(x0 + w / 2 - 1.0, sy + 2.0, z0 + 4.0, 2.0, h - sy - 6.0, d - 7.0, *WD))
    for i_, bx in enumerate((x0 + p_, x0 + w / 2 + 1.0)):
        bw = w / 2 - p_ - 1.0
        q = [P(bx + (bw - lp) / 2, sy + 2.0, z0 + 4.0), P(bx + (bw + lp) / 2, sy + 2.0, z0 + 4.0),
             P(bx + (bw + lp) / 2, sy + 2.0 + lp * 0.96, z0 + 4.0 + lp * 0.28), P(bx + (bw - lp) / 2, sy + 2.0 + lp * 0.96, z0 + 4.0 + lp * 0.28)]
        o.append(art_on(q, arts[i_ % 2])); o.append(poly(q, "none", 'stroke="#000" stroke-opacity="0.3" stroke-width="0.8"'))
    o.append(box(x0 + p_, sy + 2.0, z0, w - 2 * p_, Rs["lip"], 1.6, *WD))            # the 10 cm front board
    for xx in (x0, x0 + w - p_):                       # the front posts to 63, the slope back to the rear posts' tops, the front rail
        o.append(box(xx, 0, z0, p_, ft, p_, *ST))
        o.append(poly([P(xx, ft, z0), P(xx + p_, ft, z0), P(xx + p_, h, z0 + d - p_), P(xx, h, z0 + d - p_)], ST[0]))
    o.append(box(x0, ft - 6.0, z0 + 1.0, w, 1.2, 1.2, *ST))
    return "\n".join(o)


def dining_wall():
    """An oak backboard on the breast carries a 110 × 80 solid oak top on lift-off hinges and two Hebgo folding
    brackets. Everyday it stands folded up against the breast; down, it seats four at the wall."""
    if SITE_NOW == "stairs":            # v16: the table is on the stairs wall (out of these views): the breast has its ledge and frames
        return record_shelf() + "\n" + now_playing() + "\n" + breast_frames()
    if G.TABLE_STYLE == "fliptop":
        return fliptop_wall()
    o = []
    x0, x1 = G.TABLE_X
    tw, td, tt = G.TABLE
    L, Hr, Dr = G.RAIL
    rt = G.RAIL_TOP
    o.append(box(x0, rt - Hr, -Dr, L, Hr, Dr, OAK, OAK_T, OAK_S, extra=GH))
    arm, bh = G.HEBGO
    for bx in G.HEBGO_X:
        o.append(box(bx - 1.6, rt - bh + 1, -Dr - 0.6, 3.2, bh - 1, 0.6, STEEL, STEEL_T, STEEL_S))           # wall plate
        if DINING != "four":
            o.append(box(bx - 1.4, rt - arm, -Dr - 2.6, 2.8, arm - 0.5, 2.0, STEEL, STEEL_T, STEEL_S))       # arm folded down
        else:
            o.append(box(bx - 1.4, rt - 2.4, -Dr - arm, 2.8, 2.4, arm - 0.6, STEEL, STEEL_T, STEEL_S))       # arm out under the top
            a, b, c, d = P(bx, rt - bh + 2, -Dr - 0.6), P(bx, rt - bh + 5, -Dr - 0.6), P(bx, rt - 2.4, -Dr - 33), P(bx, rt - 2.4, -Dr - 29)
            o.append(poly([a, c, d, b], STEEL_S))
    for hx in (x0 + 12, (x0 + x1) / 2, x1 - 12):       # three lift-off hinges on the backboard's top edge
        o.append(box(hx - 5, rt - 0.4, -Dr - 0.5, 10, 0.9, 1.2, "#8a8c8f", "#a2a4a7", "#6f7174"))
    if DINING == "folded":
        zt = -Dr - tt - 0.3
        o.append(box(x0, rt + 0.2, zt, tw, td, tt, OAK, OAK_T, OAK_S, extra=GH))
        bb = G.BREADBOARD
        if G.PLAIN:       # v13: a plain oiled oak underside between the pegged breadboard ends: no reeds
            o.append(_line(P(x0 + bb, rt + 0.4, zt - 0.02), P(x0 + bb, rt + td - 0.4, zt - 0.02), "#8f5e33", 1.2))
            o.append(_line(P(x1 - bb, rt + 0.4, zt - 0.02), P(x1 - bb, rt + td - 0.4, zt - 0.02), "#8f5e33", 1.2))
            for (ea, eb) in ((x0, x0 + bb), (x1 - bb, x1)):
                for py in (rt + 14, rt + td / 2, rt + td - 14):
                    c = P((ea + eb) / 2, py, zt - 0.04)
                    o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="2.0" fill="#5e3d22"/>')
                for py in (rt + 7, rt + td - 7):
                    o.append(disc_z((ea + eb) / 2, py, zt - 0.05, 1.6, "#d4ac55", 'stroke="#8f6d26" stroke-width="0.8"'))
            o.append(_line(P(x0, rt + 0.2, zt - 0.02), P(x1, rt + 0.2, zt - 0.02), "#5a3a20", 1.8))
            o.append(_line(P(x0 + 1, rt + td - 0.6, zt - 0.06), P(x1 - 1, rt + td - 0.6, zt - 0.06), "#e9bd86", 1.2))
            for bxx in (x0 + 16, x1 - 16):
                o.append(box(bxx - 2.6, G.FOLDED_TOP + 0.4, -2.4, 5.2, 2.6, 2.2, OAK_D, OAK_T, OAK_S))
            o.append(breast_frames())
            return "\n".join(o)
        rw, rg, rd = G.REED
        zr = zt - rd
        # the reeded underside: oak strips between the breadboard ends, so folded it reads as a fluted oak panel
        o.append(quad_front(x0 + bb, rt + 2.6, zt - 0.02, tw - 2 * bb, td - 5.2, "#7d5130"))
        n = int((tw - 2 * bb - 2.0 + rg) // (rw + rg))
        x_start = x0 + bb + (tw - 2 * bb - (n * rw + (n - 1) * rg)) / 2
        for k in range(n):
            xs = x_start + k * (rw + rg)
            o.append(box(xs, rt + 3.0, zr, rw, td - 6.0, rd, "#c6915c" if k % 2 else "#be8852", "#d9a46c", "#9c6a3f"))
            o.append(_line(P(xs + rw * 0.35, rt + 3.4, zr - 0.02), P(xs + rw * 0.35, rt + td - 3.4, zr - 0.02), "#e2b47e", 0.7, 'opacity="0.7"'))
        for (ea, eb) in ((x0, x0 + bb), (x1 - bb, x1)):                                                   # breadboard ends, pegged
            o.append(box(ea, rt + 0.2, zr, eb - ea, td, rd, OAK_D, OAK_T, OAK_S, extra=GV))
            for py in (rt + 14, rt + td / 2, rt + td - 14):
                c = P((ea + eb) / 2, py, zr - 0.04)
                o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="2.0" fill="#5e3d22"/>')
            for py in (rt + 7, rt + td - 7):                                                          # brass inserts for the legs
                o.append(disc_z((ea + eb) / 2, py, zr - 0.05, 1.6, "#d4ac55", 'stroke="#8f6d26" stroke-width="0.8"'))
        o.append(box(x0, rt + 0.2, zr, tw, 2.2, rd, OAK, OAK_T, OAK_S))                                  # rails top and bottom frame the reeds
        o.append(box(x0, rt + td - 2.2, zr, tw, 2.0, rd, OAK, OAK_T, OAK_S))
        o.append(_line(P(x0, rt + 0.2, zr - 0.02), P(x1, rt + 0.2, zr - 0.02), "#5a3a20", 1.8))          # the hinge line
        o.append(_line(P(x0 + 1, rt + td - 0.6, zr - 0.06), P(x1 - 1, rt + td - 0.6, zr - 0.06), "#e9bd86", 1.2))
        for bxx in (x0 + 16, x1 - 16):                   # turn buttons on the breast hold it up
            o.append(box(bxx - 2.6, G.FOLDED_TOP + 0.4, -2.4, 5.2, 2.6, 2.2, OAK_D, OAK_T, OAK_S))
    elif DINING == "six":                                # the top is off its hinges, out in the room on four legs
        for bxx in (x0 + 16, x1 - 16):
            o.append(box(bxx - 2.6, G.FOLDED_TOP + 0.4, -2.4, 5.2, 2.6, 2.2, OAK_D, OAK_T, OAK_S))
    else:
        o.append(box(x0, rt, -Dr - td, tw, tt, td, OAK, OAK_T, OAK_S, extra=GH))
        bb = G.BREADBOARD
        for (ea, eb) in ((x0, x0 + bb), (x1 - bb, x1)):
            o.append(poly([P(ea, rt + tt + 0.01, -Dr - td), P(eb, rt + tt + 0.01, -Dr - td), P(eb, rt + tt + 0.01, -Dr), P(ea, rt + tt + 0.01, -Dr)], OAK_D, GV))
            o.append(quad_front(ea, rt, -Dr - td - 0.02, eb - ea, tt, OAK_S))
        o.append(table_settings())
    o.append(breast_frames())
    return "\n".join(o)


def table_settings(x0=None, x1=None, zb=None, zf=None, y=None, n_side=None):
    """Plates, glasses, a jug and a candle: four at the wall (two on the room side, one at each end), or six with the
    table out in the room (two each side, one at each end)."""
    o = []
    if n_side:     # v15 flip-top, open: n places down each long side (the table runs out from the wall, along z)
        y += 0.02
        cx, zm = (x0 + x1) / 2, (zb + zf) / 2
        step = (zb - zf) / n_side
        for j in range(n_side):
            pz = zb - step * (j + 0.5)
            for px, gx_ in ((x0 + 15, x0 + 25), (x1 - 15, x1 - 25)):
                o.append(ellipse_flat(px, y, pz, 12.5, 12.5, "#efe9df", 'stroke="#cfc6b6" stroke-width="0.8"'))
                o.append(ellipse_flat(px, y + 0.05, pz, 8.5, 8.5, "#e4dccd"))
                o.append(box(gx_ - 3, y, pz + 10, 6, 10, 6, "url(#glass)", "url(#glass)", "url(#glass)", extra='stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.8"'))
        o.append(box(cx - 5, y, zm - 4, 10, 18, 9, "#3f6f8f", "#4f7f9f", "#2f5f7f"))                 # jug
        o.append(box(cx - 2, y, zm - 30, 4, 14, 4, "#efe6d2", "#f7f0e2", "#d9cfbc"))                # candle
        c = P(cx, y + 15.5, zm - 28)
        o.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="3" ry="5" fill="#ffd27a" opacity="0.9"/>')
        o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="22" fill="#ffd27a" opacity="0.18" filter="url(#soft)"/>')
        return "\n".join(o)
    four = x0 is None
    if four:
        x0, x1 = G.TABLE_X
        zb, zf, y = G.TABLE_Z[0], G.TABLE_Z[1], G.TABLE_TOP
    y += 0.02
    cx, zm = (x0 + x1) / 2, (zb + zf) / 2
    ha, hb_ = (cx - 27.5, cx + 27.5) if four else (x0 + (x1 - x0) / 4, x0 + 3 * (x1 - x0) / 4)   # v13.1: six spread along the 170
    places = [(ha, zf + 15), (hb_, zf + 15), (x0 + 15, zm), (x1 - 15, zm)]
    glasses = [(ha + 14.5, zf + 30), (hb_ + 13.5, zf + 30), (x0 + 25, zm + 16), (x1 - 25, zm - 16)]
    if not four:
        places += [(ha, zb - 15), (hb_, zb - 15)]
        glasses += [(ha - 13.5, zb - 30), (hb_ - 14.5, zb - 30)]
    for (px, pz) in places:
        o.append(ellipse_flat(px, y, pz, 12.5, 12.5, "#efe9df", 'stroke="#cfc6b6" stroke-width="0.8"'))
        o.append(ellipse_flat(px, y + 0.05, pz, 8.5, 8.5, "#e4dccd"))
        o.append(box(px + 15, y, pz - 8, 1.0, 0.3, 16, "#c9cbcd"))
        o.append(box(px - 16, y, pz - 8, 1.0, 0.3, 16, "#c9cbcd"))
    for (gx_, gz_) in glasses:
        o.append(box(gx_ - 3, y, gz_ - 3, 6, 10, 6, "url(#glass)", "url(#glass)", "url(#glass)", extra='stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.8"'))
    o.append(box(cx - 5, y, zm - 4, 10, 18, 9, "#3f6f8f", "#4f7f9f", "#2f5f7f"))                 # jug
    o.append(box(cx + 10, y, zm - 2, 4, 14, 4, "#efe6d2", "#f7f0e2", "#d9cfbc"))                # candle
    c = P(cx + 12, y + 15.5, zm)
    o.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="3" ry="5" fill="#ffd27a" opacity="0.9"/>')
    o.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="22" fill="#ffd27a" opacity="0.18" filter="url(#soft)"/>')
    return "\n".join(o)


def chair(cx, cz, face):
    """A folding chair the size of IKEA's TERJE (43 × 49, seat 48, back to 78), facing the table."""
    w, d, h, sh = G.CHAIR
    o = []
    def bx(a0, a1, b0, b1, y0, y1, col=(BEECH, BEECH_T, BEECH_S)):
        # a: across the chair, b: along the way it faces (b0 = back)
        if face == "+z":
            return box(cx - w / 2 + a0, y0, cz - d / 2 + b0, a1 - a0, y1 - y0, b1 - b0, *col)
        if face == "+x":
            return box(cx - d / 2 + b0, y0, cz - w / 2 + a0, b1 - b0, y1 - y0, a1 - a0, *col)
        if face == "-z":
            return box(cx - w / 2 + a0, y0, cz + d / 2 - b1, a1 - a0, y1 - y0, b1 - b0, *col)
        return box(cx + d / 2 - b1, y0, cz - w / 2 + a0, b1 - b0, y1 - y0, a1 - a0, *col)
    leg = 2.6
    o.append(bx(0, leg, d - 6, d - 6 + leg, 0, sh - 2))
    o.append(bx(w - leg, w, d - 6, d - 6 + leg, 0, sh - 2))
    o.append(bx(1, w - 1, 9, d - 1, sh - 2.4, sh))                  # seat
    o.append(bx(0, leg, 4, 4 + leg, 0, h))                          # back legs, up to the top rail
    o.append(bx(w - leg, w, 4, 4 + leg, 0, h))
    o.append(bx(leg, w - leg, 4.2, 6.0, h - 16, h - 3))             # back panel
    return "\n".join(o)


def dining_chairs():
    if G.TABLE_STYLE == "fliptop":          # v15: chairs down both long sides of the open table (two a side for four, three for six)
        if DINING == "folded":
            return ""
        x0, x1 = G.TABLE_X
        w, d, h, sh = G.CHAIR
        z0, z1 = G.OPEN_Z
        n = 2 if DINING == "four" else 3
        step = (z0 - z1) / n
        tuck = 8.0
        o = []
        for j in range(n):
            cz = z0 - step * (j + 0.5)
            o += [chair(x0 - d / 2 + tuck, cz, "+x"), chair(x1 + d / 2 - tuck, cz, "-x")]
        return "\n".join(o)
    if DINING == "six":
        return free_table()
    if DINING != "four":
        return ""
    x0, x1 = G.TABLE_X
    w, d, h, sh = G.CHAIR
    zm = (G.TABLE_Z[0] + G.TABLE_Z[1]) / 2
    zf = G.TABLE_Z[1]
    tuck = 8.0
    o = [chair(x0 - d / 2 + tuck, zm, "+x"), chair(x1 + d / 2 - tuck, zm, "-x")]
    o += [chair(G.TABLE_CX - 27.5, zf - d / 2 + tuck, "+z"), chair(G.TABLE_CX + 27.5, zf - d / 2 + tuck, "+z")]
    return "\n".join(o)


def free_table():
    """Six (v13.1: with the leaf, 170 × 80) or eight: the top lifted off its hinges onto four oak legs (v13.6), the leaf on four more,
    out in the room 75 cm off the breast; for six, two a side and one at each end. Breast-side chairs stand clear of the sub's box."""
    w, d, h, sh = G.CHAIR
    x0, x1 = G.SIX_X
    zb, zf = G.FREE_Z                    # breast side, room side
    tw, td, tt = G.TABLE
    top = G.LEG_H + tt
    zm = (zb + zf) / 2
    xj = x0 + tw if G.SIX_LEAF else x1   # the joint between the table and the leaf
    o = []
    o.append(poly([P(x0 - 6, 0.05, zb + 6), P(x1 + 6, 0.05, zb + 6), P(x1 + 6, 0.05, zf - 6), P(x0 - 6, 0.05, zf - 6)], "#000", 'opacity="0.18" filter="url(#soft)"'))
    n = 2
    step = (x1 - x0) / n
    xs = [x0 + step * (j + 0.5) for j in range(n)]
    o += [chair(xc, zb + d / 2 - 8, "-z") for xc in xs]
    o += [chair(x0 - d / 2 + 8, zm, "+x"), chair(x1 + d / 2 - 8, zm, "-x")]
    # v13.6: tapered oak legs (4.5 to 3 on their two inside faces) on brass inserts, no plates. The table's four sit in its
    # breadboard ends, 6 in from the long edges; the leaf's four sit inside the corners of its oak frame.
    lw, lf = G.LEG
    bbc = G.BREADBOARD / 2
    legs = [(x0 + bbc, zb - 6, 1, -1), (xj - bbc, zb - 6, -1, -1), (x0 + bbc, zf + 6, 1, 1), (xj - bbc, zf + 6, -1, 1)]
    if G.SIX_LEAF:
        ix, iz = G.LEAF_LEG_IN
        legs += [(xj + ix, zb - iz, 1, -1), (x1 - ix, zb - iz, -1, -1), (xj + ix, zf + iz, 1, 1), (x1 - ix, zf + iz, -1, 1)]
    def leg(cx, cz, sx, sz):
        o = []
        segs = 28
        for k in range(segs):
            y0, y1 = G.LEG_H * k / segs, G.LEG_H * (k + 1) / segs
            wv = lf + (lw - lf) * (k + 0.5) / segs           # wider at the top
            # outside faces stay flush with the top's corner: shrink towards the table's inside
            ox = cx - sx * lw / 2                            # outside face x
            oz = cz - sz * lw / 2
            bx0 = ox if sx > 0 else ox - wv
            bz0 = oz if sz > 0 else oz - wv
            o.append(box(bx0, y0, bz0, wv, y1 - y0 + 0.02, wv, OAK, OAK_T, OAK_S))
        o.append(box(cx - lw / 2, 0, cz - lw / 2, lf, 0.4, lf, "#2b2622"))                   # felt glide
        return o
    for L in legs:                                           # the breast side first: it's further from the camera
        if L[3] < 0:
            o += leg(*L)
    front_rail = []
    if G.SIX_LEAF:
        fr = G.LEAF_FRAME
        fx0, fx1 = xj + fr["inset_x"], x1 - fr["inset_x"]
        fz0, fz1 = zf + fr["inset_z"], zb - fr["inset_z"]      # room side .. breast side
        fy = G.LEG_H - fr["h"]
        t = fr["t"]
        o.append(box(fx0, fy, fz1 - t, fx1 - fx0, fr["h"], t, OAK_D, OAK_T, OAK_S))       # the breast-side rail
        o.append(box(fx0, fy, fz0, t, fr["h"], fz1 - fz0, OAK_D, OAK_T, OAK_S))           # the end rails
        o.append(box(fx1 - t, fy, fz0, t, fr["h"], fz1 - fz0, OAK_D, OAK_T, OAK_S))
        front_rail.append(box(fx0, fy, fz0, fx1 - fx0, fr["h"], t, OAK_D, OAK_T, OAK_S))  # the room-side rail, in front of the leaf's legs
    for L in legs:
        if L[3] > 0:
            o += leg(*L)
    o += front_rail
    o.append(box(x0, G.LEG_H, zf, x1 - x0, tt, td, OAK, OAK_T, OAK_S, extra=GH))
    bb = G.BREADBOARD
    for (ea, eb) in ((x0, x0 + bb), (xj - bb, xj)) + (((x1 - bb, x1),) if G.SIX_LEAF else ()):
        o.append(poly([P(ea, top + 0.01, zf), P(eb, top + 0.01, zf), P(eb, top + 0.01, zb), P(ea, top + 0.01, zb)], OAK_D, GV))
        o.append(quad_front(ea, G.LEG_H, zf - 0.02, eb - ea, tt, OAK_S))
    if G.SIX_LEAF:
        o.append(_line(P(xj, top + 0.02, zf), P(xj, top + 0.02, zb), "#6b4527", 1.4))
    o.append(table_settings(x0, x1, zb, zf, top))
    zn = zf - d / 2 + 8
    o += [chair(xc, zn, "+z") for xc in xs]
    return "\n".join(o)


def breast_frames():
    """Two framed LPs on the chimney breast, above the folded table."""
    o = []
    fw, gap, y0 = 34.0, 8.0, G.FRAMES_Y
    cx = G.TABLE_CX
    arts = [[("#efe6d2", 0, 1, 0, 1), ("#d24a3a", 0.1, 0.9, 0.5, 0.9), ("#1f3a52", 0.1, 0.6, 0.1, 0.45), ("#f0c24b", 0.62, 0.9, 0.1, 0.45)],
            [("#14806d", 0, 1, 0, 1), ("#f0e6d0", 0.18, 0.82, 0.18, 0.82), ("#1f1f1f", 0.4, 0.6, 0.4, 0.6), ("#e8603c", 0.0, 1.0, 0.0, 0.12)]]
    for i, art in enumerate(arts):
        x0 = cx - gap / 2 - fw + i * (fw + gap)
        o.append(box(x0, y0, -2.2, fw, fw, 2.0, "#151515", "#242424", "#0e0e0e"))
        o.append(quad_front(x0 + 1.3, y0 + 1.3, -2.21, fw - 2.6, fw - 2.6, "#f3eee4"))
        q = [P(x0 + 1.3, y0 + 1.3, -2.22), P(x0 + fw - 1.3, y0 + 1.3, -2.22), P(x0 + fw - 1.3, y0 + fw - 1.3, -2.22), P(x0 + 1.3, y0 + fw - 1.3, -2.22)]
        o.append(art_on(q, art))
    return "\n".join(o)


def plant(xc=440.0, zc=-60.0):
    o = []
    base = P(xc, 0, zc)
    k = K(zc)
    s = S * k
    x, y = base
    pw_top, pw_bot, ph = 30 * s, 23 * s, 28 * s
    o.append(f'<ellipse cx="{x:.1f}" cy="{y + 2:.1f}" rx="{pw_bot * 0.7:.1f}" ry="{6 * k:.1f}" fill="#000" opacity="0.25" filter="url(#soft)"/>')
    rnd = random.Random(11)
    leaves = []
    for i in range(34):
        ang = rnd.uniform(-2.7, -0.45)
        r = rnd.uniform(25, 85) * k
        lx = x + math.cos(ang) * r * 1.35
        ly = y - ph - 6 * k + math.sin(ang) * r
        rot = math.degrees(ang) + rnd.uniform(-25, 25)
        col = rnd.choice(["#2f7a3f", "#3a8f4a", "#24683a", "#4aa35a", "#2c6f3a"])
        leaves.append(f'<ellipse cx="{lx:.1f}" cy="{ly:.1f}" rx="{rnd.uniform(16, 26) * k:.1f}" ry="{rnd.uniform(6, 9) * k:.1f}" fill="{col}" transform="rotate({rot:.1f} {lx:.1f} {ly:.1f})"/>')
    for i in range(12):
        lx = x + rnd.uniform(-20, 20) * k; ly = y - ph - rnd.uniform(0, 40) * k
        o.append(f'<line x1="{x:.1f}" y1="{y - ph:.1f}" x2="{lx:.1f}" y2="{ly:.1f}" stroke="#2a5a2e" stroke-width="2"/>')
    o.extend(leaves)
    o.append(f'<path d="M{x - pw_top / 2:.1f},{y - ph:.1f} L{x + pw_top / 2:.1f},{y - ph:.1f} L{x + pw_bot / 2:.1f},{y:.1f} L{x - pw_bot / 2:.1f},{y:.1f}Z" fill="url(#pot)"/>')
    o.append(f'<rect x="{x - pw_top / 2 - 3:.1f}" y="{y - ph - 4:.1f}" width="{pw_top + 6:.1f}" height="{9 * k:.1f}" fill="#c76d45"/>')
    return "\n".join(o)


def glow_overlays():
    c = P(G.TV_CX, G.TV_CENTRE, ALC_D - 0.5)
    return f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="330" ry="235" fill="url(#bias)"/>'


# ------------------------------------------------------------- lighting
def ceiling_leds():
    """The existing LED strip: on the ceiling facing down, right round the room's edge: east wall, the alcove's back
    wall and reveal, across the breast, round its west side and along the recess."""
    o = []
    y = CEIL - 0.6
    zr = G.BREAST_D_WEST
    sx0, sz, wx = G.DOOR_X[1] + 1.5, ALC_D - G.STAIR_D, G.ROOM_W   # v13.2: the strip follows the stairwell opening's edge
    runs = [((0.8, -260), (0.8, ALC_D - 0.8)), ((0.8, ALC_D - 0.8), (ALC_W - 0.8, ALC_D - 0.8)),
            ((ALC_W - 0.8, ALC_D - 0.8), (ALC_W - 0.8, -0.8)), ((ALC_W - 0.8, -0.8), (BX1 + 0.8, -0.8)),
            ((BX1 + 0.8, -0.8), (BX1 + 0.8, zr - 0.8)), ((BX1 + 0.8, zr - 0.8), (sx0 - 0.8, zr - 0.8)),
            ((sx0 - 0.8, zr - 0.8), (sx0 - 0.8, sz - 0.8)), ((sx0 - 0.8, sz - 0.8), (wx - 0.8, sz - 0.8)),
            ((wx - 0.8, sz - 0.8), (wx - 0.8, -300))]
    walls = [((0.1, -260), (0.1, ALC_D - 0.1)), ((0, ALC_D - 0.1), (ALC_W, ALC_D - 0.1)), ((ALC_W - 0.1, ALC_D), (ALC_W - 0.1, 0)),
             ((ALC_W, -0.1), (BX1, -0.1)), ((BX1, zr - 0.1), (sx0, zr - 0.1)), ((sx0, sz - 0.1), (wx, sz - 0.1)),
             ((wx - 0.1, sz), (wx - 0.1, -300))]
    for (x0, z0), (x1, z1) in walls:
        q = [P(x0, CEIL, z0), P(x1, CEIL, z1), P(x1, CEIL - 26, z1), P(x0, CEIL - 26, z0)]
        o.append(poly(q, "#ffe3b3", 'opacity="0.20" filter="url(#softer)"'))
    for (x0, z0), (x1, z1) in runs:
        pa, pb = P(x0, y, z0), P(x1, y, z1)
        o.append(_line(pa, pb, "#ffe7bd", 7, 'opacity="0.45" filter="url(#soft)"'))
        o.append(_line(pa, pb, "#fff6e2", 2.2))
    return "\n".join(o)


def wall_shadows():
    o = [quad_front(0, WORKTOP, ALC_D - 0.05, 7, CEIL - WORKTOP, "url(#shadeL)"),
         quad_front(ALC_W - 7, WORKTOP, ALC_D - 0.05, 7, CEIL - WORKTOP, "url(#shadeR)")]
    for (x1, x2, yu, dh) in [(0, ALC_W, G.HIGH_UNDER, 7), (UP_L[1], UP_R[0], G.LEDGE_UNDER, 5),
                             (RZ[0], RZ[1], G.RZ_SHELF_TOP - G.RZ_SHELF_T, 6)]:
        o.append(quad_front(x1, yu - dh, ALC_D - 0.1, x2 - x1, dh, "url(#shadeDown)"))
    return "\n".join(o)


# x offset on the bar, shade, stem, and what each head is aimed at (a point in the room)
SPOT_HEADS = G.BAR1_HEADS   # v15: the bar runs from the TV towards the window; offsets are along it (see geometry.BAR1_HEADS)


def spot_heads2():
    """The second bar, on the existing pendant point by the stairs, running TV to window (v15): pink down onto the way in at its door
    end, sage on the framed LPs, blue and mustard on the table."""
    ty, tz = (G.TABLE_TOP, -45.0) if DINING == "four" else (115.0, -6.0)
    tx = G.TABLE_CX
    if G.TABLE_STYLE == "fliptop" and DINING != "folded":   # v15: the open flip-top runs out from the breast
        ty, tz = G.TABLE_TOP, sum(G.OPEN_Z) / 2
    elif DINING == "six":
        tx, ty, tz = sum(G.SIX_X) / 2, G.LEG_H + G.TABLE[2], sum(G.FREE_Z) / 2
    # v17: straight down, spread a little along the bar, whatever the table is doing
    return [(off, *col, (G.BAR2_X, 0.0, G.BAR2_Z + off * G.HEAD_SPREAD)) for off, col in ((31.5, G.PINK), (10.5, G.SAGE), (-10.5, G.BLUE), (-31.5, G.MUSTARD))]


def spot_bar(cx, cz, spots):
    """A 4-head semi-flush spotlight bar in the style of Dunelm's Wolston: white bar, conical shades in four colours with
    light-wood toppers, 84 cm long with a 22.4 cm drop."""
    o = []
    cam = cam_pos()
    for dx, col, stem, tgt in spots:
        c = P(*tgt)
        rx, ry = (130, 95) if tgt[2] > -10 else (165, 62)   # v15: wider, fainter pools (the bulbs are smart and set softer)
        o.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="{rx}" ry="{ry}" fill="#fff1d2" opacity="0.09" filter="url(#softer)"/>')
    o.append(ellipse_flat(cx, CEIL - 0.05, cz, 6.5, 6.5, "#f3f1ec", 'stroke="#d8d4cc" stroke-width="1"'))
    o.append(box(cx - 6, CEIL - 2.6, cz - 6, 12, 2.5, 12, "#efede8", "#f7f5f0", "#dcd8d0"))
    if G.BAR_AXIS == "z":   # v15: the bar runs from the TV towards the window
        o.append(box(cx - 1.1, CEIL - 3.8, cz - 42, 2.2, 1.3, 84, "#f2f0eb", "#fbfaf6", "#d9d5cc"))
    else:
        o.append(box(cx - 42, CEIL - 3.8, cz - 1.1, 84, 1.3, 2.2, "#f2f0eb", "#fbfaf6", "#d9d5cc"))
    def at_(h):
        x_, z_ = G.bar_head_xz(cx, cz, h[0])
        return (x_, CEIL - 6.5, z_)
    def aim(h):
        return _norm(tuple(h[3][i] - at_(h)[i] for i in range(3)))
    heads = sorted(spots, key=lambda h: -(at_(h)[2] + aim(h)[2]))
    for h in heads:
        dx, col, stem, _ = h
        apex = at_(h)
        x0, z0 = apex[0], apex[2]
        a_, b_ = P(x0, CEIL - 3.8, z0), P(x0, CEIL - 6.5, z0)
        o.append(f'<line x1="{a_[0]:.1f}" y1="{a_[1]:.1f}" x2="{b_[0]:.1f}" y2="{b_[1]:.1f}" stroke="{stem}" stroke-width="3.2" stroke-linecap="round"/>')
        dn = aim(h)
        th, _, tm = _cone(apex, dn, 3.8, 1.1, 1.9)
        sh, ring, m = _cone(tm, dn, 13.0, 1.9, 7.5)
        tomouth = _norm(tuple(cam[i] - m[i] for i in range(3)))
        facing = sum(dn[i] * tomouth[i] for i in range(3)) > 0.05
        o.append(poly(sh, col, 'stroke="#00000022" stroke-width="0.8"'))
        if facing:
            o.append(poly(ring, "#fffaf0", f'stroke="{col}" stroke-width="1.2"'))
            cc = P(*m)
            o.append(f'<circle cx="{cc[0]:.1f}" cy="{cc[1]:.1f}" r="16" fill="#fff4dc" opacity="0.55" filter="url(#soft)"/>')
        o.append(poly(th, "#d6a873", 'stroke="#a8784a" stroke-width="0.6"'))
    return "\n".join(o)


def pendant():
    return spot_bar(G.PEND_X, G.PEND_Z, SPOT_HEADS) + "\n" + spot_bar(G.BAR2_X, G.BAR2_Z, spot_heads2())


def wall_socket():
    """The room's sockets (v23, the client's three: geometry.SOCKETS), about 30 cm up. The one in front of bay 1 becomes a double
    and carries the media wall's leads; the doubles behind the sofa's return and behind the plant stand are drawn as they are."""
    o = []
    for so in G.SOCKETS:
        xc, zc, yc, n = so["x"], so["z"], so["y"], so["gang"]
        half = 7.3 if n == 2 or so is G.SOCKETS[0] else 4.3
        y1, y2 = yc - 4.3, yc + 4.3
        if so["wall"] == "x":      # on the side wall (x = 0), facing the room
            o.append(poly([P(0.4, y1, zc - half), P(0.4, y1, zc + half), P(0.4, y2, zc + half), P(0.4, y2, zc - half)], "#f4f2ed", 'stroke="#c9c5bc" stroke-width="1"'))
            for zz in ((zc - 3.5, zc + 3.5) if half > 5 else (zc,)):
                o.append(poly([P(0.9, yc - 2.5, zz - 1.6), P(0.9, yc - 2.5, zz + 1.6), P(0.9, yc + 2.0, zz + 1.6), P(0.9, yc + 2.0, zz - 1.6)], "#e9e6df", 'stroke="#b9b4aa" stroke-width="0.8"'))
        else:                      # on the window wall (z = WINDOW_Z), facing the room
            zf = zc + 0.4
            o.append(poly([P(xc - half, y1, zf), P(xc + half, y1, zf), P(xc + half, y2, zf), P(xc - half, y2, zf)], "#f4f2ed", 'stroke="#c9c5bc" stroke-width="1"'))
            for xx in (xc - 3.5, xc + 3.5):
                o.append(poly([P(xx - 1.6, yc - 2.5, zf + 0.5), P(xx + 1.6, yc - 2.5, zf + 0.5), P(xx + 1.6, yc + 2.0, zf + 0.5), P(xx - 1.6, yc + 2.0, zf + 0.5)], "#e9e6df", 'stroke="#b9b4aa" stroke-width="0.8"'))
    zc, yc = G.SOCKET["z"], G.SOCKET["y"]       # the media wall's two leads from the first socket
    for zz in (zc - 3.5, zc + 3.5):
        a_, b_, c_ = P(1.2, yc - 2.5, zz), P(1.6, 6, zz + 2), P(1.2, 3, G.BASE_FRONT_Z - 0.5)
        o.append(f'<path d="M{a_[0]:.1f},{a_[1]:.1f} Q{b_[0]:.1f},{b_[1]:.1f} {c_[0]:.1f},{c_[1]:.1f}" stroke="#f0eee8" stroke-width="2.6" fill="none"/>')
    return "\n".join(o)


def services(show_hidden):
    """Hidden routes, dashed in the numbered views. Gold: data, audio and low-voltage. Coral: mains."""
    if not show_hidden:
        return ""
    o = []
    GOLD, CORAL = "#ffd37a", "#ff9b7a"
    bf = G.BASE_FRONT_Z
    groove_x, deco_x = RZ_GX, UP_R[0] + 2.25
    gang = (MX(12), WORKTOP + 1, 34)
    # Deco B's leads: along the shelf, down the groove behind the right upright, through the worktop to the 10-gang and Switch 2
    o.append(path([(DECO_X + 5, G.HIGH_TOP + 1, 31), (deco_x, G.HIGH_TOP + 1, ALC_D - 0.5), (deco_x, 77, ALC_D - 0.5),
                   (deco_x, 70, 35), (MX(60), 70, 35), (MX(40), WORKTOP + 1, 34)], GOLD))
    # Cat6 from the airing cupboard above, through the ceiling in the alcove's right corner
    o.append(path([(ALC_W - 2.5, CEIL, ALC_D - 2.5), (ALC_W - 2.5, G.HIGH_TOP + 6, ALC_D - 2.5), (182, G.HIGH_TOP + 6, 28)], GOLD))
    # vinyl: deck -> preamp under the shelf -> down the groove -> along the back of the worktop -> soundbar AUX
    pre = (RZ[0] + 9, G.RZ_SHELF_TOP - 7, 30)
    o.append(path([(G.DECK_X[0] + 34, 86, 28), (G.DECK_X[0] + 34, 110, 33), pre], GOLD, 2.0))
    o.append(path([pre, (groove_x, 125, ALC_D - 0.5), (groove_x, 77, ALC_D - 0.5), (MX(100), 77, 33), (MX(100), 77, 4), (G.TV_CX + 30, 79, 1)], GOLD, 2.0))
    # Series X: HDMI and power down the groove
    sxc = (G.SX_X[0] + G.SX_X[1]) / 2
    o.append(path([(sxc, G.RZ_SHELF_TOP + 3, 33), (groove_x + 0.5, G.RZ_SHELF_TOP + 3, ALC_D - 0.5), (groove_x + 0.5, 78, ALC_D - 0.5), (MX(118), 78, 34)], GOLD, 1.8))
    # PC: HDMI down the trunking, along the skirting, into the plinth notch and the channel
    o.append(path([(1.2, G.PC_SHELF_TOP - 6, G.PC_SHELF_Z[1] + 3), (1.2, 8, G.PC_SHELF_Z[1] + 3), (1.2, 8, bf - 0.5), (5, 5, 36), (110, 5, 36), (110, 77, 34)], GOLD, 2.0))
    # mains from the side-wall socket: left outlet to the 10-gang behind the TV, right outlet (the retro switch) to the 6-way
    o.append(path([(1.5, 4, G.SOCKET["z"] - 2), (1.5, 4, bf - 0.5), (1.5 if G.MW_SWAP else 4, 4, bf + 20), (1.5 if G.MW_SWAP else 4, 4, 35), (MX(14), 6, 35), (MX(14), 77, 33), gang], CORAL, 2.0))
    o.append(path([(1.5, 3, G.SOCKET["z"] + 2), (1.5, 3, bf - 0.5), (6, 3, 36), (MX(66) if not G.MW_SWAP else MX(44), 3, 36)], CORAL, 2.0))
    # the sub's mains from the 10-gang: down the slot, along the channel to bay 3's end, out at the reveal, along the breast's skirting
    if G.SUB_IN_WALL:   # v13.5: the sub's lead from the 10-gang, down the slot to the back of bay 2
        sx = (G.SUB_IN["x"][0] + G.SUB_IN["x"][1]) / 2
        o.append(path([(MX(20), 77, 34), (MX(20), 4, 36), (sx, 4, 36), (sx, G.SUB_IN["y"][0] + 4, G.SUB_IN["z"][1] + 1)], CORAL, 1.8))
    else:
        sx = G.SUB_POS["x"][0] + 4
        o.append(path([(20, 77, 34), (20, 4, 36), (182, 4, 36), (185, 4, -1), (sx, 4, -1)], CORAL, 1.8))
    # the 10-gang lying behind the TV; the retro 6-way in the channel (behind bay 1 now: bay 2's back is the sub's port)
    six = (10, 1, 44, 5.5, 36) if G.SUB_IN_WALL else (66, 1, 100, 5.5, 36)
    for (xa, ya, xb, yb, z) in ((10, WORKTOP, 66, WORKTOP + 4.5, 34), six):
        xa, xb = sorted((MX(xa), MX(xb)))
        p1, p2 = P(xa, ya, z), P(xb, yb, z)
        o.append(f'<rect x="{p1[0]:.1f}" y="{p2[1]:.1f}" width="{p2[0]-p1[0]:.1f}" height="{p1[1]-p2[1]:.1f}" fill="{GOLD}" fill-opacity="0.15" stroke="{GOLD}" stroke-width="2" stroke-dasharray="6 4"/>')
    return "\n".join(o)


# ------------------------------------------------------------- dimensions
def dimensions():
    o = ['<g id="dims">']
    bf = G.BASE_FRONT_Z
    a, b = P(0, CEIL, bf), P(ALC_W, CEIL, bf)
    o.append(dim_line(a, b, f"alcove {G.ALC_W:g} wide · {G.ALC_D:g} deep · floor to ceiling", ((a[0] + b[0]) / 2 + 60, a[1] + 18)))
    a, b = P(ALC_W, CEIL - 8, -1), P(BX1, CEIL - 8, -1)
    o.append(dim_line(a, b, f"chimney breast {G.BREAST_W:g} · the dining wall", ((a[0] + b[0]) / 2, a[1] + 20)))
    a, b = P(RZ[0], 224, 0), P(RZ[1], 224, 0)
    o.append(dim_line(a, b, f"{G.RZ_W:g} · turntable zone", ((a[0] + b[0]) / 2, a[1] - 8), size=14))
    a, b = P(0, 214, 0), P(G.TV_CX, 214, 0)
    o.append(dim_line(a, b, f"TV centre {G.TV_CX:g} from the side wall", ((a[0] + b[0]) / 2 + (40 if G.MW_SWAP else 0), a[1] - 8), size=14))
    lx = BX1 + 2
    a, b = P(lx, 0, 0), P(lx, CEIL, 0)
    o.append(_line(a, b, LC, 1.2, 'stroke-opacity="0.6"'))
    ticks = [(0, "0 floor"), (G.WORKTOP, f"{G.WORKTOP:g} worktop · dining table, down"), (G.TV_CENTRE, f"{G.TV_CENTRE:.1f} TV centre"),
             (G.LID_CLEAR_TO, f"{G.LID_CLEAR_TO:g} lid clear · Series X shelf {G.RZ_SHELF_TOP:g}"),
             (G.FOLDED_TOP, f"{G.FOLDED_TOP:g} table folded up"),
             (G.LEDGE_TOP + 3, f"{G.LEDGE_TOP:g} record ledges, both walls"),
             (G.HIGH_TOP, f"{G.HIGH_TOP:g} high shelf, {G.HIGH_D:g} deep"), (CEIL, f"{CEIL:g} ceiling · heights in cm")]
    for h, lab in ticks:
        hh = G.LEDGE_TOP if "ledges" in lab else h
        p = P(lx, hh, 0)
        o.append(f'<line x1="{p[0] - 5:.1f}" y1="{p[1]:.1f}" x2="{p[0] + 5:.1f}" y2="{p[1]:.1f}" stroke="{LC}" stroke-opacity="0.75" stroke-width="1.2"/>')
        dy = {G.TV_CENTRE: 6, G.FOLDED_TOP: 9, G.LEDGE_TOP + 3: -5}.get(h, 0)
        o.append(text(p[0] + 10, p[1] + 4.5 + dy, lab, size=14.5))
    # bays along the floor in front of the base
    zf = bf - (max(GAME_OPEN, REC_OPEN) + 4 if max(GAME_OPEN, REC_OPEN) > 0 else 1)
    named = sorted(zip(G.BAYS, ["60 · Xbox bay + game drawer", "60 · PlayStation bay", "60 · record trays"]))
    edges = [b[0] for b, _ in named] + [named[-1][0][1]]
    o.append(_line(P(edges[0], 0, zf), P(edges[-1], 0, zf), LC, 1.2, 'stroke-opacity="0.7"'))
    labels = [n for _, n in named]
    for i, e in enumerate(edges):
        p = P(e, 0, zf)
        o.append(f'<line x1="{p[0]:.1f}" y1="{p[1] - 5:.1f}" x2="{p[0]:.1f}" y2="{p[1] + 5:.1f}" stroke="{LC}" stroke-opacity="0.75" stroke-width="1.2"/>')
        if i < 3:
            m = P((e + edges[i + 1]) / 2, 0, zf)
            o.append(text(m[0], m[1] + 19, labels[i], size=12.5, anchor="middle"))
    # the dining table's width, on the floor in front of the breast
    zt = (G.TABLE_Z[1] - 6) if DINING == "four" else -14.0
    x0, x1 = G.TABLE_X
    a, b = P(x0, 0, zt), P(x1, 0, zt)
    o.append(dim_line(a, b, f"oak table {G.TABLE[0]:g} × {G.TABLE[1]:g}, folds up", ((a[0] + b[0]) / 2, a[1] + 20), size=14))
    if GAME_OPEN > 0:
        x_ = G.BAYS[0][0] + 55.4
        a, b = P(x_, 0.2, bf - 0.6), P(x_, 0.2, bf - GAME_OPEN - 0.6)
        o.append(dim_line(a, b, op=0.75))
        o.append(text(b[0] - 12, b[1] - 2, f"rolls out {GAME_OPEN:g} cm", size=11.5, anchor="end"))
    # lid clearance above the deck
    p1, p2 = P(G.DECK_X[0], WORKTOP + G.DECK[1], G.DECK_Z[0]), P(G.DECK_X[1], G.LID_CLEAR_TO, G.DECK_Z[0])
    o.append(f'<rect x="{p1[0]:.1f}" y="{p2[1]:.1f}" width="{p2[0] - p1[0]:.1f}" height="{p1[1] - p2[1]:.1f}" fill="none" stroke="{LC}" stroke-opacity="0.55" stroke-width="1.1" stroke-dasharray="5 4"/>')
    o.append(text((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 + 4, "lid clearance to 130", size=11, anchor="middle", op=0.85))
    p = P(BX1 + 52, 214, G.BREAST_D_WEST)
    o.append(text(p[0], p[1], "door to the hall (to confirm)", size=11.5, anchor="middle", op=0.8))
    o.append('</g>')
    return "\n".join(o)


# ------------------------------------------------------------- v13.2: light measurement overlays, one per view
MC = "#fff1b0"     # the overlay's colour: a light, warm yellow with a dark halo so it reads on oak and on green


def _m(a, b, label, lpos=None, size=15.5, tick=9):
    out = [f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#10241b" stroke-opacity="0.45" stroke-width="4"/>',
           f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{MC}" stroke-width="1.8"/>']
    ang = math.atan2(b[1] - a[1], b[0] - a[0]) + math.pi / 2
    for p in (a, b):
        dx, dy = math.cos(ang) * tick / 2, math.sin(ang) * tick / 2
        out.append(f'<line x1="{p[0] - dx:.1f}" y1="{p[1] - dy:.1f}" x2="{p[0] + dx:.1f}" y2="{p[1] + dy:.1f}" stroke="{MC}" stroke-width="1.8"/>')
    lx, ly = lpos if lpos else ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 8)
    out.append(text(lx, ly, label, size=size, anchor="middle", weight=650, fill=MC))
    return "\n".join(out)


def m3(p, q, label, dx=0, dy=-8, size=15.5):
    a, b = P(*p), P(*q)
    return _m(a, b, label, ((a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy), size)


def measure_layer(kind):
    """Rough sizes in cm, in a light colour, to lay over a render and check it against the real room."""
    g = G
    bf = g.BASE_FRONT_Z
    o = ['<g id="measure">']
    if kind == "drawers":
        # the game drawer (bay 1), the upper record tray (bay 3), the plinth drawer (bay 2), as pulled out in this view
        gx0 = g.FILLER + 2.87; gz = bf - GAME_OPEN
        o.append(m3((gx0, g.PLINTH + 2.6 + 15.5, gz - 0.6), (gx0 + 54.3, g.PLINTH + 2.6 + 15.5, gz - 0.6), "game drawer 54 wide", dy=-10))
        o.append(m3((gx0 - 1.5, g.PLINTH + 2.6, gz), (gx0 - 1.5, g.PLINTH + 2.6, gz + 35), "35 deep", dx=-40, dy=-4))
        o.append(m3((gx0 - 1.5, 0.5, bf), (gx0 - 1.5, 0.5, gz), f"out {GAME_OPEN:g}", dx=-34, dy=8))
        tx0, tx1 = g.REC_BOX_X; tz = bf - REC_OPEN_UP; ty = g.TRAY_UPPER[0] + 12
        o.append(m3((tx0, g.TRAY_UPPER[0] - 0.5, tz - 0.6), (tx1, g.TRAY_UPPER[0] - 0.5, tz - 0.6), f"LP crate {g.TRAY_BOX[0]:.1f} wide", dy=20))
        o.append(m3((tx1 + 1, g.TRAY_UPPER[0], tz), (tx1 + 1, g.TRAY_UPPER[0], tz + 40), "40 deep", dx=34, dy=4))
        o.append(m3((tx1 + 1.5, 0.5, bf), (tx1 + 1.5, 0.5, tz), f"out {REC_OPEN_UP:g}", dx=34, dy=8))
        o.append(m3((tx0 + 0.9, ty + 2, tz + 3), (tx1 - 0.9, ty + 2, tz + 3), f"trough {g.TRAY_INSIDE:.1f}", dy=-6, size=14))
        sx0, sx1 = g.SLIM_BOX_X; sz = bf - SLIM_OPEN; sy = g.SLIM_DRAWERS[1]["yb"]
        o.append(m3((sx0, sy - 0.5, sz - 0.6), (sx1, sy - 0.5, sz - 0.6), f"game drawer {sx1 - sx0:.1f} wide", dy=34, size=14))
        px0, px1 = g.PLINTH_DRAWER["x"]; pz = bf - PLINTH_OPEN
        o.append(m3((px0, g.PLINTH_DRAWER["y"][1] + 0.5, pz - 0.8), (px1, g.PLINTH_DRAWER["y"][1] + 0.5, pz - 0.8), f"plinth drawer 52 × 34 × 5, out {PLINTH_OPEN:g}", dy=26))
        o.append(m3((-1, g.PLINTH + 2.6, bf), (-1, g.PLINTH + 2.6 + 15.5, bf), "11.6–27 up", dx=-42, dy=4, size=14))
        o.append(m3((g.BAYS[2][1] + 0.5, g.TRAY_LOWER[0], bf), (g.BAYS[2][1] + 0.5, g.TRAY_UPPER[0], bf), "crates at 2.3 and 37", dx=60, dy=4, size=14))
    elif kind in ("four", "six") and g.TABLE_STYLE == "fliptop":   # v15: the flip-top, open
        x0, x1 = g.TABLE_X; z0, z1 = g.OPEN_Z; top = g.TABLE_TOP
        o.append(m3((x0, top + 1, z1), (x1, top + 1, z1), f"table {g.TABLE[0]:g} wide", dy=-12))
        o.append(m3((x1 + 2, top, z1), (x1 + 2, top, z0), f"{g.OPEN_LEN:g} long: top 80 + half 80", dx=60))
        o.append(m3((x0 - 3, 0, z1), (x0 - 3, top, z1), f"top at {top:g}", dx=-40, dy=0))
        o.append(m3((x0, 0.5, z1 - 2), (x0, 0.5, g.SOFA_FRONT_Z), f"{z1 - g.SOFA_FRONT_Z:.1f} to the sofa", dx=-50, dy=0, size=14))
    elif kind == "four":
        x0, x1 = g.TABLE_X; zf = g.TABLE_Z[1]; top = g.TABLE_TOP
        o.append(m3((x0, top + 1, zf), (x1, top + 1, zf), f"table {g.TABLE[0]:g} wide", dy=-12))
        o.append(m3((x1 + 2, top, zf), (x1 + 2, top, -g.RAIL[2]), f"{g.TABLE[1]:g} deep", dx=36))
        o.append(m3((x0 - 3, 0, zf), (x0 - 3, top, zf), f"top at {top:g}", dx=-40, dy=0))
        o.append(m3((x1 + 22, 0, zf - 20), (x1 + 22, g.CHAIR[3], zf - 20), f"seat {g.CHAIR[3]:g}", dx=34, dy=0, size=14))
    elif kind == "six":
        x0, x1 = g.SIX_X; zb, zf = g.FREE_Z; top = g.LEG_H + g.TABLE[2]
        o.append(m3((x0, top + 1, zf), (x1, top + 1, zf), f"{x1 - x0:g} × {g.TABLE[1]:g}: table {g.TABLE[0]:g} + leaf {g.LEAF[0]:g}", dy=-12))
        o.append(m3((x1 + 3, 0, zf), (x1 + 3, top, zf), f"top at {top:.1f}", dx=46, dy=0))
        o.append(m3((x1 - 8, 0.5, zb), (x1 - 8, 0.5, 0), f"{-zb:g} to the breast", dx=-60, dy=-4))
        o.append(m3((x1, 0.5, (zb + zf) / 2), (g.ROOM_W, 0.5, (zb + zf) / 2), f"{g.ROOM_W - x1:g} to the wall", dy=-8))
        o.append(m3((x0, 0.5, zf - 2), (x0 + (x1 - x0) / 2, 0.5, zf - 2), f"{(x1 - x0) / 2:g} a diner", dy=20, size=14))
    else:   # the main view
        o.append(m3((0, CEIL - 3, bf), (ALC_W, CEIL - 3, bf), f"alcove {g.ALC_W:g} wide", dy=18))
        o.append(m3((ALC_W, CEIL - 10, -1), (BX1, CEIL - 10, -1), f"breast {g.BREAST_W:g}", dy=18))
        o.append(m3((g.TV_X[0], g.TV_BOTTOM - 1.5, g.TV_PANEL_Z[0]), (g.TV_X[1], g.TV_BOTTOM - 1.5, g.TV_PANEL_Z[0]), f"TV {g.TV_W:g} wide", dy=-8))
        o.append(m3((g.TV_X[1] - 6, g.TV_BOTTOM, g.TV_PANEL_Z[0]), (g.TV_X[1] - 6, g.TV_TOP, g.TV_PANEL_Z[0]), f"{g.TV_H:g} tall", dx=-34, dy=0))
        o.append(m3((UP_L[1], g.LEDGE_UNDER - 2, 8), (UP_R[0], g.LEDGE_UNDER - 2, 8), f"{g.TV_GAP:g} between the uprights", dy=-8, size=14.5))
        o.append(m3((RZ[0], g.WORKTOP + 0.5, bf), (RZ[1], g.WORKTOP + 0.5, bf), f"{g.RZ_W:g}", dy=16, size=14.5))
        o.append(m3((RZ[1] - 2, g.WORKTOP, 12), (RZ[1] - 2, g.RZ_SHELF_TOP - g.RZ_SHELF_T, 12), f"{g.LID_CLEAR_TO - g.WORKTOP:g} lid room", dx=-40, dy=0, size=14))
        o.append(m3((-1, 0, bf), (-1, g.WORKTOP, bf), f"{g.WORKTOP:g}", dx=-18, dy=0))
        for i, (a_, b_) in enumerate(g.BAYS):
            o.append(m3((a_, 1, bf - 1), (b_, 1, bf - 1), f"{b_ - a_:g}", dy=18, size=14.5))
        o.append(m3((ALC_W + 2, g.HIGH_TOP, 8), (ALC_W + 2, CEIL, 8), f"{CEIL - g.HIGH_TOP:g} to ceiling", dx=-48, dy=0, size=14))
        x0, x1 = g.TABLE_X
        o.append(m3((x0, g.FOLDED_TOP + 2, -6), (x1, g.FOLDED_TOP + 2, -6), f"table {g.TABLE[0]:g} wide, folded", dy=-8))
        o.append(m3((x1 + 2, g.RAIL_TOP, -6), (x1 + 2, g.FOLDED_TOP, -6), f"{g.TABLE[1]:g}", dx=18, dy=0))
        if g.SUB_IN_WALL:
            o.append(m3((g.SUB_COL[0], g.SUB_COL_TOP + 1, bf - 0.5), (g.SUB_COL[1], g.SUB_COL_TOP + 1, bf - 0.5), f"sub {g.SUB_COL[1] - g.SUB_COL[0]:g}", dy=-6, size=14))
        else:
            hb = g.SUB_HOOD
            o.append(m3((hb["x"][0] - 1, hb["h"] + 2, hb["z"][0]), (hb["x"][1] + 1, hb["h"] + 2, hb["z"][0]), "sub cover 37", dy=-8, size=14))
            o.append(m3((hb["x"][1] + 3, 0, hb["z"][0]), (hb["x"][1] + 3, hb["h"], hb["z"][0]), f"{hb['h']:g}", dx=18, dy=0, size=14))
        d0, d1 = g.DOOR_X
        o.append(m3((d0, 200, g.BREAST_D_WEST - 1), (d1, 200, g.BREAST_D_WEST - 1), f"door about {d1 - d0:g}", dy=-8, size=14))
        o.append(m3((d1 - 4, 0, g.BREAST_D_WEST - 1), (d1 - 4, 198, g.BREAST_D_WEST - 1), "198", dx=-20, dy=0, size=14))
        o.append(m3((0.5, 0, -150), (0.5, g.PC_SHELF_TOP, -150), f"PC shelf {g.PC_SHELF_TOP:g}", dx=52, dy=0, size=14))
        o.append(m3((g.PEND_X + 50, CEIL, g.PEND_Z), (g.PEND_X + 50, CEIL - g.BAR[2], g.PEND_Z), f"bar drop {g.BAR[2]:g}", dx=48, dy=0, size=14))
    o.append(text(24, H - SHIFT - 112, "Rough sizes in cm, to check against the room · the plan's fit proof has the exact ones", size=14, weight=650, fill=MC))
    o.append('</g>')
    return "\n".join(o)


# ------------------------------------------------------------- keys
H_ = "H"
JOIN_KEY = [
    (H_, "Oak joinery"),
    (1, (UP_R[0] + 2.25, 205, 8), f"Solid oak uprights, 4.5 × 30, worktop to ceiling ({G.UPRIGHT_LEN:g} long)"),
    (2, ((UP_R[0] + UP_R[1]) / 2, 140, 8), "The right upright is a corner post against the breast") if G.MW_SWAP else
    (2, (2.25, 140, 8), "The left upright is a corner post against the side wall"),
    (3, (UP_L[1] if G.MW_SWAP else UP_R[0], G.RZ_SHELF_TOP - 2, TENON_Z[0]), f"Flush wedged tenons carry the Series X shelf ({G.RZ_SHELF_TOP:g})"),
    (4, (UP_L[1] + 8 if G.MW_SWAP else 50, 214, 20), f"High shelf, top {G.HIGH_TOP:g}: books up to 30 cm"),
    (5, (G.TV_CX, 172, 34), "Record ledge above the TV: 4 LPs face-out"),
    (6, (3.5, 172, -60), "The oak run wraps the corner: 4 more LPs face-out"),
    (7, (UP_R[0], 104, 22), "LED groove in each upright: a smart colour strip washes the wall"),
    (8, (RZ[0] + 12.6, 207, 31), "High shelf, over the turntable: a small framed sleeve"),
    (H_, "On the worktop"),
    (9, (G.TV_X[0] + 35, 140, 26), f"LG OLED C6 55in · centre {G.TV_CENTRE:.1f} high, {G.TV_CX:g} from the side wall"),
    (10, (G.TV_CX - 30, 79, -7), "Soundbar · eARC, optical and AUX inputs"),
    (11, (G.DECK_X[0] + 14, 94, G.DECK_Z[0] + 4), "Turntable (AT-LP120X size allowed) · lid clear to 130"),
    (12, (G.SX_X[0] + 10, 156, 16), "Xbox Series X on its fan stand · 15 cm air each side"),
    (13, (RZ[0] + 9, G.RZ_SHELF_TOP - 6.5, 26), "Phono preamp, hung under the shelf at the back"),
    (14, (180, 74.6, G.BASE_FRONT_Z), f"Solid oak worktop {G.ALC_W:g} × {G.BASE_D:g} × 3, top at 76"),
    (H_, "In the alcove base"),
    (15, (93, 5, G.BASE_FRONT_Z), "Oak face frame; its bottom rail hides the 9 cm plinth"),
    (16, (23 + B1X, 59.4, G.BASE_FRONT_Z + 6), "Xbox One + HDMI switch · its brick flat at the back" if G.SUB_IN_WALL else "Xbox One + power brick · bay 1 top row"),
    (17, (23 + B1X, 41.6, G.BASE_FRONT_Z + 6), "Xbox 360 + RetroTINK · its brick flat at the back" if G.SUB_IN_WALL else "Xbox 360 + power brick · bay 1 middle row"),
    (18, (15 + B1X, 24, "drawer"), "Game drawer: 2 face-out bins, spine-up rows behind"),
    (19, (83, 52.5, G.BASE_FRONT_Z + 6), "PS3 + controller basket · bay 2 top row"),
    (20, (106, 33.3, G.BASE_FRONT_Z + 6) if G.SUB_IN_WALL else (83, 33.3, G.BASE_FRONT_Z + 6), "PS2 · bay 2, beside the sub" if G.SUB_IN_WALL else "PS2 + HDMI switch · bay 2 middle row"),
    (21, (106, 15.5, G.BASE_FRONT_Z + 6) if G.SUB_IN_WALL else (78, 15.5, G.BASE_FRONT_Z + 6), "PS1 · under the PS2" if G.SUB_IN_WALL else "PS1 + RetroTINK · bay 2 bottom row"),
    (22, (162.5 + B3X, 56, G.BASE_FRONT_Z + 1), f"Upper record tray: an LP crate, ~{G.TRAY_LPS} face-out, under the turntable"),
    (23, (162.5 + B3X, 22, "tray"), "Lower LP crate: the same, shown pulled out"),
    (23, (133.7 + B3X, 62, G.BASE_FRONT_Z + 1), "Slim drawer: pads and remotes, a charging lead"),
    (23, (133.7 + B3X, 30, G.BASE_FRONT_Z + 1), f"Two slim game drawers: ~{G.SLIM_DRAWERS[0]['n']} games each, face-out"),
    (24, (93, 4.6, G.BASE_FRONT_Z - 0.1), "Hidden slim drawer in the plinth, finger pull"),
    *([(34, ((G.SUB_IN["x"][0] + G.SUB_IN["x"][1]) / 2, 36, G.SUB_IN["z"][0]), "Sub · bay 2, under the TV, on an isolation riser")] if G.SUB_IN_WALL else []),
    (H_, "The chimney breast (the table is by the stairs)"),
    (25, ((G.NOW_LEDGE["x"][0] + G.NOW_LEDGE["x"][1]) / 2, G.NOW_LEDGE["top"] + 16, -5), "“Now playing” oak ledge: what's on and the next two"),
    (29, (G.TABLE_CX + 21, G.FRAMES_Y + 17, -2.3), "Two framed LPs above"),
    (H_, "The side wall"),
    (30, (25.5, 182, -150), "PC on the oak run, above the sofa's open end"),
    (31, (3.4, G.PC_SHELF_TOP + 3, G.PC_SHELF_Z[1] + 4), "Brush grommet: the PC's leads drop into the wall"),
    (32, (8, 160, -197), "Pad charging dock"),
    (33, (0.3, 120, -160), "PC cables chased into the wall: no spine, no trunking"),
    (33, (14, G.PC_SHELF_TOP - 8, -160), "Keyboard tray under the shelf, rolls out (v6.1)"),
    (H_, "Power, network and light"),
    (36, (DECO_X + 5.5, 203, 22), "Deco B: leads in the groove behind the right upright"),
    (37, (0.3, 36, G.SOCKET["z"]), "Double socket: its right switch is the retro switch"),
    (38, (MX(38), 78.6, 34), "10-gang extension, hidden behind the TV"),
    (39, (95, CEIL - 0.6, ALC_D - 0.8), "LED strip round the ceiling edge (as now)"),
    (40, (G.PEND_X, 226, G.PEND_Z), "Smart spot bar on the existing rose, TV to window"),
    (41, (G.BAR2_X, 222, G.BAR2_Z), "Second smart spot bar, existing point by the door"),
    (41, (G.STAIR_X[0] - 0.2, 45, 5), "Stairs UP to the first floor, beside the door (direction to confirm)"),
]

def _numbered(items):
    out, n = [], 0
    for it in items:
        if it[0] == H_:
            out.append(it)
        else:
            n += 1
            out.append((n, it[1], it[2]))
    return out


JOIN_KEY = _numbered(JOIN_KEY)

SLAT_TOP = [
    (H_, "Slat wall"),
    (1, (115, 172, ALC_D), "Oak slat panels on battens, worktop to ceiling"),
    (2, (50, 214, 20), f"High shelf on hidden cleats, top {G.HIGH_TOP:g}"),
    (3, (RZ[0] + 6, G.RZ_SHELF_TOP - 2, 20), f"Series X shelf on hidden cleats, top {G.RZ_SHELF_TOP:g}"),
    (4, (93, G.HIGH_UNDER - 0.2, 12), "Warm LED strip under each shelf"),
    (5, (3.5, 172, -60), "Record ledge on the side wall: 4 LPs face-out"),
]


def slat_key():
    """The slat key: its own top group, then the rest of the oak key from 'On the worktop' on, renumbered."""
    rest = JOIN_KEY[[i for i, it in enumerate(JOIN_KEY) if it == (H_, "On the worktop")][0]:]
    out, n = list(SLAT_TOP), len([i for i in SLAT_TOP if i[0] != H_])
    swap = {"Deco B: leads in the groove behind the right upright": "Deco B: leads down the batten gap behind the slats"}
    for it in rest:
        if it[0] == H_:
            out.append(it)
        else:
            n += 1
            out.append((n, it[1], swap.get(it[2], it[2])))
    return out


def callouts(items):
    o = ['<g id="callouts">']
    for it in items:
        if it[0] == H_:
            continue
        n, (x, y, z), _ = it
        if z == "drawer":
            z = G.BASE_FRONT_Z - GAME_OPEN + 4
        elif z == "tray":
            z = G.BASE_FRONT_Z - REC_OPEN + 1
        cx, cy = P(x, y, z)
        o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="15" fill="#000" opacity="0.25" filter="url(#soft)"/>')
        o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="13.5" fill="#f7f1e3" stroke="#10241b" stroke-width="1.6"/>')
        o.append(f'<text x="{cx:.1f}" y="{cy + 4.6:.1f}" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#10241b" text-anchor="middle">{n}</text>')
    o.append('</g>')
    return "\n".join(o)


KEYW = 660
INSET_DRAWER = (1840, 820) if G.MW_SWAP else (24, 905)   # v38: by the stairs, clear of the records bay
INSET_RECORD = (330, -127)


CAM_SIX = (185.0, 180.0, 3.6, 120)   # the dining view: in line with the reveal, pulled back to show the west end


CAM_DRAWERS = (93.0, 579.0, 5.6, 255)   # v13.2: in close on the base, every drawer out


def build(*a, dining="folded", cam=None, **kw):
    """One render. The dining view for six and the drawers view move the camera, then put it back."""
    if dining != "six" and cam is None:
        return _build(*a, dining=dining, **kw)
    camera(*(cam or CAM_SIX))
    try:
        return _build(*a, dining=dining, **kw)
    finally:
        camera(*CAM_DEFAULT)


def _build(with_dims=True, numbered=False, game_open=0.0, rec_open=0.0, style="joinery", rec_open_up=0.0, label=None,
           dining="folded", ghost=None, plinth_open=0.0, measure=None, slim_open=0.0):
    global GAME_OPEN, REC_OPEN, STYLE, REC_OPEN_UP, DINING, SOFA_GHOST, PLINTH_OPEN, SLIM_OPEN, SITE_NOW
    REC_OPEN_UP, STYLE, GAME_OPEN, REC_OPEN, DINING, PLINTH_OPEN = rec_open_up, style, game_open, rec_open, dining, plinth_open
    SLIM_OPEN = slim_open
    SITE_NOW = "breast" if dining != "folded" else SITE      # v16: the table's own renders are option A; the rest show the default site
    SOFA_GHOST = bool(ghost)
    if measure:   # v13.2: only the light measurement layer, on a transparent page, to lay over the same view
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + defs()
                + f'<g transform="translate(0,{SHIFT})">' + measure_layer(measure) + '</g></svg>')
    key = JOIN_KEY if STYLE == "joinery" else slat_key()
    kw = KEYW if numbered else 0
    width = W + kw
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{H}" viewBox="0 0 {width} {H}">', defs(),
         f'<svg x="0" y="0" width="{W}" height="{H}" viewBox="0 0 {W} {H}" overflow="hidden">',
         f'<g transform="translate(0,{SHIFT})">', room(), ceiling_leds()]
    o.append(wall_shadows() if STYLE == "joinery" else slats())
    o.append(glow_overlays())
    o.append(high_shelf())
    o.append(led_lines())
    o.append(tv())
    if STYLE == "joinery":
        o.append(uprights())
    o.append(rz_slats())
    o.append(rz_shelf())
    o.append(unit())
    o.append(worktop_items())
    o.append(dining_wall())
    o.append(wrap())
    o.append(wall_socket())
    o.append(subwoofer())
    o.append(dining_chairs())
    o.append(services(numbered))
    o.append(sofa())
    o.append(sofa_pouf())
    o.append(pendant())
    if with_dims:
        o.append(dimensions())
    if numbered:
        drawer_n = [it[0] for it in key if it[0] != H_ and "Game drawer" in it[2]][0]
        tray_n = [it[0] for it in key if it[0] != H_ and "Upper record tray" in it[2]][0]
        o.append(drawer_inset(*INSET_DRAWER, num=drawer_n))
        o.append(record_inset(*INSET_RECORD, num=tray_n))
        o.append(callouts(key))
    o.append('</g>')
    if label:
        o.append(plate(*label))
    o.append('</svg>')
    if numbered:
        title = "Key: artisan oak media wall" if STYLE == "joinery" else "Key: slat wall alternative"
        o.append(key_panel2(W, key, title, f"v38 · TV in line with the sofa · turntable, Series X and records on the left · alcove 186 × 38, ceiling 235 · sizes in cm", step=23.4))
    o.append('</svg>')
    return repaint("\n".join(o))


# ------------------------------------------------------------- v12: the PC side wall, seen from the room
CAM_SIDE = (-125.0, 1300.0, 3.6, 60)   # eye along the wall (z), x of the wall at px, px/cm, shift
SIDE_EYE_Y = 125.0
SOFA_COL = ("#8c8276", "#a0968a", "#776e63")


def sofa_pouf():
    """v23, client: "the sofa has a ottoman poufe type thing that is the size of a chair on the sofa, its square, blue corduroy
    matching the sofa": on the rug beside the coffee table."""
    P_ = G.SOFA_POUF
    C, T, SD = G.SOFA_CORD[0], G.SOFA_CORD[1], G.SOFA_CORD[2]
    return "\n".join([box(P_["x"][0] + 4, 0, P_["z"][0] + 4, P_["w"] - 8, 4, P_["d"] - 8, "#111214"),
                      box(P_["x"][0], 4, P_["z"][0], P_["w"], P_["h"] - 4, P_["d"], C, T, SD)])


def sofa_solid():
    """v15: the client's sofa: blue corduroy, an L with the long side under the window ending about 40 cm short of the window's west
    end, two seats then the corner seat, the return along the side wall (168 assumed). Plinth, seat bases, plump seat and back cushions
    with the cord's channels, an arm at the long side's end; no cushion (the client: "you can remove the white cushion"). v16: "towards the
    tv it has no edge that covers the end. it is an open seat with one larger cushion that goes around towards the back making an ottoman
    type end": no arm on the return; one long seat cushion runs to its open end, the back cushion stopping just short of it."""
    C, T, SD, RIB = G.SOFA_CORD                       # cord: face, top, side, channels
    x0 = G.SOFA_X[0]
    zb, zf, ze = G.SOFA_BACK_Z, G.SOFA_FRONT_Z, G.CHAISE_END_Z
    cx1, mx1 = G.CHAISE_X[1], G.SOFA_X[1]
    arm, bk, ph, sb, st, ah, bh = 20.0, 20.0, 8.0, 40.0, 52.0, 62.0, G.SOFA_H
    o = []
    def ribs_x(x, za, zb_, ya, yb_, step=3.2):           # cord channels on a face looking along +x
        y = ya + step
        while y < yb_ - 1:
            o.append(_line(P(x + 0.05, y, za + 1), P(x + 0.05, y, zb_ - 1), RIB, 1.0, 'opacity="0.5"'))
            y += step
    def ribs_z(z, xa, xb_, ya, yb_, step=3.2):           # ... and on a face looking along +z
        y = ya + step
        while y < yb_ - 1:
            o.append(_line(P(xa + 1, y, z + 0.05), P(xb_ - 1, y, z + 0.05), RIB, 1.0, 'opacity="0.5"'))
            y += step
    o.append(poly([P(x0, 0.05, zb), P(mx1 + 6, 0.05, zb), P(mx1 + 6, 0.05, zf + 6), P(cx1 + 6, 0.05, zf + 6), P(cx1 + 6, 0.05, ze + 6), P(x0, 0.05, ze + 6)],
                  "#000", 'opacity="0.25" filter="url(#soft)"'))
    # the back along the side wall and along the window wall (frames), then the plinth
    ott = G.SOFA_OTTOMAN                              # v17: the return's last 20 cm has no back: the seat wraps round to the wall
    o.append(box(x0, ph, zb, bk, bh - ph, ze - ott - zb, C, T, SD))
    o.append(box(x0, ph, zb, mx1 - x0, bh - ph, bk, C, T, SD))
    o.append(box(x0 + 3, 0, zb + 3, mx1 - x0 - 6, ph, zf - zb - 6, "#111214"))
    o.append(box(x0 + 3, 0, zf - 3, cx1 - x0 - 6, ph, ze - zf, "#111214"))
    # seat bases
    o.append(box(x0 + bk, ph, zb + bk, mx1 - arm - x0 - bk, sb - ph, zf - zb - bk, C, T, SD))
    o.append(box(x0 + bk, ph, zf, cx1 - x0 - bk, sb - ph, ze - zf, C, T, SD))
    ribs_z(zf, cx1, mx1 - arm, ph, sb)
    ribs_x(cx1, zf, ze, ph, sb)
    ribs_z(ze, x0 + bk, cx1, ph, sb)                     # v16: the open end, facing the TV
    # the long side: the corner seat (x0+bk .. cx1), then two seats to the arm
    n = G.SOFA_SEATS
    seat_w = (mx1 - arm - cx1) / n
    xs = [(x0 + bk + 16, cx1)] + [(cx1 + i * seat_w + 0.5, cx1 + (i + 1) * seat_w - 0.5) for i in range(n)]
    # back cushions, plump, leaning on the frames: along the side wall, then one per seat along the window
    o.append(box(x0 + bk, st - 2, zf + 2, 16, bh - st + 2, ze - ott - 1 - zf - 2, C, T, SD))
    ribs_x(x0 + bk + 16, zf + 2, ze - ott - 1, st, bh - 2)
    ribs_z(ze - ott - 1, x0, x0 + bk + 16, st, bh - 2)                                                # the back's open end
    o.append(box(x0 + bk, st - 2, zb + bk + 32, 16, bh - st + 2, zf + 1 - zb - bk - 32, C, T, SD))
    ribs_x(x0 + bk + 16, zb + bk + 32, zf + 1, st, bh - 2)
    for (xa, xb) in xs:
        o.append(box(xa, st - 2, zb + bk, xb - xa, bh - st + 2, 16, C, T, SD))
        ribs_z(zb + bk + 16, xa, xb, st, bh - 2)
    # seat cushions: the corner, two on the long side, one on the return
    for (xa, xb) in xs:
        o.append(box(xa, sb, zb + bk + 16, xb - xa, st - sb, zf - zb - bk - 16 + 1, C, T, SD))
        ribs_z(zf + 1, xa, xb, sb, st, 2.6)
    o.append(box(x0 + bk + 16, sb, zf + 1.5, cx1 - x0 - bk - 16, st - sb, ze - 1 - zf - 1.5, C, T, SD))   # one long cushion to the end
    o.append(box(x0, ph, ze - ott, bk + 16, st - ph, ott - 1, C, T, SD))                                 # ... wrapping round to the wall
    ribs_z(ze - 1, x0, x0 + bk + 16, ph, st, 2.6)
    ribs_x(cx1, zf + 1.5, ze - 1, sb, st, 2.6)
    ribs_z(ze - 1, x0 + bk, cx1, sb, st, 2.6)
    if G.SOFA_CUSHION:
        o.append(box(x0 + bk + 18, st - 1, zb + bk + 17, 34, 30, 11, "#a19c95", "#b4afa8", "#8b867f"))
    # the arm at the long side's end (the return's end is open, v16)
    o.append(box(mx1 - arm, ph, zb, arm, ah - ph, zf - zb, C, T, SD))
    ribs_z(zf, mx1 - arm, mx1, ph, ah)
    return "\n".join(o)


def curtains(far=480.0):
    """v15: the client's curtains: Dunelm hessian, pencil pleat, to the floor, on a 28 mm wooden pole with rings and ball finials just under
    the ceiling strip, running 30 cm past the window each side; drawn open, stacked either side of the window (geometry.CURTAIN)."""
    c = G.CURTAIN
    wz = c["z"]                                  # v17: in front of the deep sill and the radiator
    wx0, wx1 = G.WINDOW_X
    y0, y1 = c["drop_to"], c["rail_y"]
    pc = c["pole_col"]
    o = [box(wx0 - c["ext"], y1, wz - 1.4, wx1 - wx0 + 2 * c["ext"], c["pole"], c["pole"], pc, "#c08d5c", "#8a5e36")]   # the wooden pole
    for xf in (wx0 - c["ext"] - c["finial"] / 2, wx1 + c["ext"] + c["finial"] / 2):                             # ball finials
        q = P(xf, y1 + c["pole"] / 2, wz)
        o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{c["finial"] / 2 * S * K(wz, xf):.1f}" fill="{pc}" stroke="#7a5130" stroke-width="0.8"/>')
    import colorsys
    r, g_, b_ = [int(c["col"][i:i + 2], 16) / 255 for i in (1, 3, 5)]
    h, l, s_ = colorsys.rgb_to_hls(r, g_, b_)
    shade = lambda k: "#%02x%02x%02x" % tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, max(0, min(1, l * k)), s_))
    for xa in (wx0 - c["ext"], wx1 + c["ext"] - c["stack"]):
        n = c["folds"]
        w = c["stack"] / n
        for i in range(n):
            xl, xr = xa + i * w, xa + (i + 1) * w
            if xl > far:
                continue
            q = [P(xl, y0, wz), P(min(xr, far), y0, wz), P(min(xr, far), y1, wz), P(xl, y1, wz)]
            o.append(poly(q, shade(1.07 if i % 2 else 0.84)))
        hq = [P(xa, y1 - 9, wz - 0.1), P(min(xa + c["stack"], far), y1 - 9, wz - 0.1), P(min(xa + c["stack"], far), y1 - 1, wz - 0.1), P(xa, y1 - 1, wz - 0.1)]
        o.append(poly(hq, shade(0.95), 'opacity="0.6"'))   # the pencil-pleat heading
    return "\n".join(o)


def side_room():
    o = [f'<rect x="0" y="{-SHIFT - 60}" width="{W}" height="{H + SHIFT + 120}" fill="#2c5643"/>']
    wz0, az = G.WINDOW_Z, ALC_D
    far = 480.0
    o.append(poly([P(0, CEIL, wz0), P(0, CEIL, az), (W + 10, P(0, CEIL, az)[1]), (W + 10, -SHIFT - 60), (-10, -SHIFT - 60), (-10, P(0, CEIL, wz0)[1])], "#33604a"))
    o.append(poly([P(0, 0, wz0), P(0, 0, az), (W + 10, P(0, 0, az)[1]), (W + 10, H + 10), (-10, H + 10), (-10, P(0, 0, wz0)[1])], "url(#floor)"))
    o.append(poly([P(0, 0, wz0), P(0, CEIL, wz0), P(0, CEIL, az), P(0, 0, az)], "#2d5a46"))                 # the side wall
    o.append(poly([P(0, 0, wz0), P(0, CEIL, wz0), P(far, CEIL, wz0), P(far, 0, wz0)], "#2a5141"))           # window wall
    wx0, wx1 = G.WINDOW_X
    o.append(poly([P(wx0, 88, wz0 + 0.2), P(wx0, 212, wz0 + 0.2), P(min(wx1, far), 212, wz0 + 0.2), P(min(wx1, far), 88, wz0 + 0.2)], "#d9e2dc"))
    o.append(poly([P(wx0, 88, wz0 + 0.3), P(wx0, 212, wz0 + 0.3), P(wx0 + 5, 212, wz0 + 0.3), P(wx0 + 5, 88, wz0 + 0.3)], "#f1efe9"))
    o.append(box(wx0 - 4, G.SILL["y"] - G.SILL["t"], wz0, min(wx1, far) - wx0 + 8, G.SILL["t"], G.SILL["nose"], "#f1efe9", "#fbfaf6", "#d9d5cc"))   # v17: the deep sill's nose
    rx0, rx1 = G.RADIATOR_X
    o.append(poly([P(rx0, 15, wz0 + 4), P(rx0, 70, wz0 + 4), P(min(rx1, far), 70, wz0 + 4), P(min(rx1, far), 15, wz0 + 4)], "#ece9e2"))
    o.append(curtains(far))
    o.append(poly([P(0, 0, az), P(0, CEIL, az), P(ALC_W, CEIL, az), P(ALC_W, 0, az)], "#244a39"))         # alcove back wall
    sk = SKIRT or ("#346650", "#3d7259", "#2b5643", "#2d5a46", "#3b6e56")
    o.append(poly([P(0.2, 0, wz0), P(0.2, G.SKIRT_H, wz0), P(0.2, G.SKIRT_H, az), P(0.2, 0, az)], sk[3]))
    # the LED strip, ceiling edge, facing down
    for (a, b) in (((0.8, wz0 + 1), (0.8, az - 0.8)), ((0.8, wz0 + 0.8), (300, wz0 + 0.8)), ((0.8, az - 0.8), (ALC_W - 0.8, az - 0.8))):
        pa, pb = P(a[0], CEIL - 0.6, a[1]), P(b[0], CEIL - 0.6, b[1])
        o.append(_line(pa, pb, "#ffe7bd", 7, 'opacity="0.45" filter="url(#soft)"'))
        o.append(_line(pa, pb, "#fff6e2", 2.2))
    q = [P(0.1, CEIL, wz0), P(0.1, CEIL, az), P(0.1, CEIL - 26, az), P(0.1, CEIL - 26, wz0)]
    o.append(poly(q, "#ffe3b3", 'opacity="0.20" filter="url(#softer)"'))
    return "\n".join(o)


def media_end_on():
    """The media wall from the side, end-on, drawn as its main pieces in the order the side camera needs."""
    o = []
    bf = G.BASE_FRONT_Z
    o.append(box(0, 0, bf, ALC_W, G.CARCASS_TOP, G.BASE_D, OAK, OAK_T, OAK_S, extra=GH))
    for (b0, b1) in G.BAYS:
        o.append(quad_front(b0 + 2.5, 12, bf - 0.03, b1 - b0 - 5, G.CARCASS_TOP - 15, "#2a2119"))
    o.append(box(0, G.CARCASS_TOP, bf, ALC_W, G.WT, G.BASE_D, OAK, OAK_T, OAK_S, extra=GH))
    zf = ALC_D - G.UP_D
    o.append(box(UP_L[0], WORKTOP, zf, G.UP_T, CEIL - WORKTOP, G.UP_D, OAK, OAK_T, OAK_S, extra=GV))
    o.append(box(UP_L[1], G.HIGH_UNDER, zf, UP_R[0] - UP_L[1], G.HIGH_T, G.HIGH_D, OAK, OAK_T, OAK_S, extra=GH))
    o.append(box(UP_L[1], G.LEDGE_UNDER, ALC_D - G.LEDGE_D, G.TV_GAP, G.LEDGE_TOP - G.LEDGE_UNDER, G.LEDGE_D, OAK, OAK_T, OAK_S))
    o.append(tv())
    o.append(box(G.TV_CX - G.SOUNDBAR[0] / 2, WORKTOP, bf + 2, G.SOUNDBAR[0], G.SOUNDBAR[1], G.SOUNDBAR[2], "#1b1b1c", "#2a2a2c", "#121213"))
    o.append(box(UP_R[0], WORKTOP, zf, G.UP_T, CEIL - WORKTOP, G.UP_D, OAK, OAK_T, OAK_S, extra=GV))
    o.append(box(RZ[0], G.HIGH_UNDER, zf, RZ[1] - RZ[0], G.HIGH_T, G.HIGH_D, OAK, OAK_T, OAK_S, extra=GH))   # v38: over the turntable zone
    o.append(rz_slats())
    o.append(rz_shelf())
    o.append(deck())
    return "\n".join(o)


def side_alcove():
    """v13.1, client: make it clear in the side view how much of the media wall the alcove takes in. The chimney breast is cut
    away so the wall reads end-on; its outline is drawn as a ghost on the reveal plane, with the depths dimensioned: the alcove
    is 38 deep, so the 46 cm base sits 38 inside it and 8 proud, and the 30 cm uprights and shelves sit wholly inside."""
    o = []
    x = ALC_W + 0.5
    az, bf, uf = ALC_D, G.BASE_FRONT_Z, ALC_D - G.UP_D
    ghost = [P(x, 0, 0), P(x, CEIL, 0), P(x, CEIL, az), P(x, 0, az)]
    o.append(poly(ghost, "#c9a27a", 'opacity="0.16"'))
    o.append(poly(ghost, "none", 'stroke="#f3e9d4" stroke-width="2" stroke-dasharray="9 6" opacity="0.9"'))
    o.append(text(*P(x, CEIL - 10, az / 2), "chimney breast, cut away", size=15, anchor="middle"))
    o.append(text(P(x, CEIL - 10, az / 2)[0], P(x, CEIL - 10, az / 2)[1] + 17, "(its face is the alcove's opening)", size=13, anchor="middle", op=0.85))
    def zdim(y, za, zb_, lab, dy=-8, size=13):
        a_, b_ = P(x, y, za), P(x, y, zb_)
        o.append(dim_line(a_, b_, lab, ((a_[0] + b_[0]) / 2, a_[1] + dy), size=size))
    zdim(G.CEIL - 40, 0, az, f"alcove {az:g} deep", size=15.5)
    zdim(G.HIGH_TOP + 8, uf, az, f"uprights and shelves {G.UP_D:g}: all inside", dy=-8, size=14)
    zdim(52, 0, az, f"{az:g} of the base inside", dy=-8, size=14.5)
    zdim(52, bf, 0, f"{-bf:g} proud", dy=-8, size=14.5)
    zdim(22, bf, az, f"base and worktop {G.BASE_D:g} deep", dy=-8, size=14.5)
    # the 8 cm that stands proud of the breast, picked out on the base's end
    pr = [P(x + 0.1, 0, bf), P(x + 0.1, WORKTOP, bf), P(x + 0.1, WORKTOP, 0), P(x + 0.1, 0, 0)]
    o.append(poly(pr, "#ffd37a", 'opacity="0.28"'))
    return "\n".join(o)


def measure_side():
    g = G
    o = ['<g id="measure">']
    pa, pb = g.PC_SHELF_Z
    st = g.PC_SHELF_TOP
    o.append(m3((g.PC_SHELF_D + 1, 0, pa + 4), (g.PC_SHELF_D + 1, st, pa + 4), f"PC shelf {st:g} up", dx=60, dy=0))
    o.append(m3((g.PC_SHELF_D + 1, g.SOFA_H, pb + 8), (g.PC_SHELF_D + 1, st - g.PC_SHELF_T - g.KB_TRAY["h"], pb + 8), f"{st - g.PC_SHELF_T - g.KB_TRAY['h'] - g.SOFA_H:g} over the sofa back", dx=-92, dy=0))
    o.append(m3((g.CHAISE_X[1] + 1, 0, g.CHAISE_END_Z), (g.CHAISE_X[1] + 1, g.SOFA_H, g.CHAISE_END_Z), f"sofa {g.SOFA_H:g} high", dx=-60, dy=0))
    o.append(m3((2.5 + g.PC_CASE[0], st, g.PC_Z[0] + 2), (2.5 + g.PC_CASE[0], st + g.PC_CASE[1], g.PC_Z[0] + 2), f"PC {g.PC_CASE[1]:g}", dx=40, dy=0, size=14))
    za, zb = g.WRAP_Z
    o.append(m3((g.WRAP_D, g.LEDGE_TOP + 34, za), (g.WRAP_D, g.LEDGE_TOP + 34, zb), f"wrap ledge {za - zb:g} long, 4 LPs", dy=-8))
    o.append(m3((0.5, 0, g.SOCKET["z"] - 12), (0.5, g.SOCKET["y"], g.SOCKET["z"] - 12), f"socket {g.SOCKET['y']:g} up", dx=-50, dy=0, size=14))
    o.append(text(24, H - SHIFT - 112, "Rough sizes in cm, to check against the room · the plan's fit proof has the exact ones", size=14, weight=650, fill=MC))
    o.append('</g>')
    return "\n".join(o)


def build_side(label=None, measure=False):
    """The PC side wall: the ledge wrapping the corner, the PC shelf and its keyboard tray, the sofa below, and the media wall
    end-on at the right (the dining wall left out), with the alcove's depth dimensioned (v13.1)."""
    global VIEW, EYE_Y, STYLE, DINING
    old = (VIEW, EYE_Y, (EYE_X, X0, S, SHIFT))
    VIEW, EYE_Y, STYLE, DINING = "side", SIDE_EYE_Y, "joinery", "folded"
    camera(*CAM_SIDE)
    try:
        if measure:
            return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + defs()
                    + f'<g transform="translate(0,{SHIFT})">' + measure_side() + '</g></svg>')
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">', defs(),
             f'<g transform="translate(0,{SHIFT})">', side_room(), wall_socket(), wrap(), media_end_on(),
             sofa_solid(), side_alcove(),
             spot_bar(G.PEND_X, G.PEND_Z, SPOT_HEADS), '</g>']
        if label:
            o.append(plate(*label))
        o.append('</svg>')
        return repaint("\n".join(o))
    finally:
        VIEW, EYE_Y = old[0], old[1]
        camera(*old[2])


def all_svgs():
    """Every render the plan and the viewer use."""
    global PAINT, SKIRT
    out = {}
    from build_doc import VERSION, LABEL   # v30: the labels carry the plan's version (they were typed in by hand)
    set_paint(PAINTS[MAIN_PAINT][0])
    sub = PAINTS[MAIN_PAINT][1] + " · drawn to the measured room, evening light"
    six_sub = ("The flip-top open on its gate leg, 110 × 160, still on the wall · both spot bars · three a side" if G.TABLE_STYLE == "fliptop" else
               "Lifted off with its leaf, 170 × 80, 75 cm off the breast · both spot bars · two a side, one at each end")
    out["v13_join_key"] = build(with_dims=True, numbered=True, style="joinery", game_open=30, rec_open=30)
    out["v13_join_clean"] = build(with_dims=False, style="joinery", label=(f"Artisan oak media wall · {LABEL}, the dining cabinet by the stairs", sub))
    out["v13_join_dims"] = build(with_dims=True, style="joinery")
    out["v13_dining_four"] = build(with_dims=False, style="joinery", dining="four",
                                   label=(f"Option A, the alternative: the flip-top on the chimney breast, set for four · {LABEL}", "Flip-top gate-leg oak table, still on the wall · " + sub))
    out["v13_dining_six"] = build(with_dims=False, style="joinery", dining="six",
                                  label=(f"Option A, the alternative: the flip-top on the breast, set for six · {LABEL}", six_sub))
    dkw = dict(with_dims=False, style="joinery", cam=CAM_DRAWERS, game_open=30, rec_open_up=30, plinth_open=25, slim_open=30)
    out["v13_drawers"] = build(**dkw, label=(f"Every drawer out · {LABEL}", "Game drawer, upper LP crate and a slim game drawer 30 out, plinth drawer 25 out (one LP crate at a time)"))
    out["v13_m_join"] = build(with_dims=False, style="joinery", measure="join")
    out["v13_m_four"] = build(with_dims=False, style="joinery", dining="four", measure="four")
    out["v13_m_six"] = build(with_dims=False, style="joinery", dining="six", measure="six")
    out["v13_m_drawers"] = build(**dkw, measure="drawers")
    out["v13_m_side"] = build_side(measure=True)
    out["v13_side"] = build_side(label=(f"The PC side wall · {LABEL}", "One oak run sweeping out to the PC, its glass side showing the parts inside, its LED strip underneath, cables chased into the wall, the sofa's open end below"))
    for k, (hx, name) in PAINTS.items():
        set_paint(hx)
        lab = name + (" · chosen" if k == MAIN_PAINT else "")
        for st in ("joinery",):
            out[f"v13_paint_{k}_{st}"] = build(with_dims=False, style=st, label=(lab,
                                               ("Artisan oak" if st == "joinery" else "Slat wall") + " version · walls, ceiling and skirting in the one colour"))
        out[f"v13_paint_{k}_four"] = build(with_dims=False, style="joinery", dining="four", label=(lab, "The flip-top open, set for four"))
        out[f"v13_paint_{k}_six"] = build(with_dims=False, style="joinery", dining="six", label=(lab, "The flip-top open, set for six"))
        out[f"v13_paint_{k}_drawers"] = build(**dkw, label=(lab, "Every drawer out: game drawer, upper record tray, plinth drawer"))
        out[f"v13_paint_{k}_side"] = build_side(label=(lab, "The PC side wall: the ledge, the PC shelf and keyboard tray, no trunking"))
    PAINT = "deep"
    deep = "Deep forest green · earlier colour, for comparison"
    for st in ("joinery",):
        out[f"v13_paint_deep_{st}"] = build(with_dims=False, style=st, label=(deep, "Artisan oak version" if st == "joinery" else "Slat wall version"))
    out["v13_paint_deep_four"] = build(with_dims=False, style="joinery", dining="four", label=(deep, "The flip-top open, set for four"))
    out["v13_paint_deep_six"] = build(with_dims=False, style="joinery", dining="six", label=(deep, "The table set for six, out in the room"))
    out["v13_paint_deep_drawers"] = build(**dkw, label=(deep, "Every drawer out"))
    out["v13_paint_deep_side"] = build_side(label=(deep, "The PC side wall"))
    set_paint(PAINTS[MAIN_PAINT][0])
    for k, sk in SKIRT_OPTIONS.items():
        SKIRT = sk
        out[f"v13_skirt_{k}"] = build(with_dims=False, style="joinery")
    SKIRT = None
    return out


# skirting options: (front, top, side, east-wall face, east-wall top); None = in the wall colour
SKIRT_OPTIONS = {"wall": None,
                 "green_smoke": ("#56604f", "#646e5c", "#4a5345", "#4d5747", "#5e6857"),
                 "off_white": ("#e9e4d8", "#f3efe5", "#d6d0c2", "#ddd8cb", "#efeadf")}


if __name__ == "__main__":
    for name, s in all_svgs().items():
        open(f"{name}.svg", "w").write(s)
    print("ok")
