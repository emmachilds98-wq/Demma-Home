"""Diagrams for the plan (v13: less cladding, stairs up, drawer layouts; v12, v11 layout: drawn from geometry.py, the measured room), as standalone SVG strings (Inter, light theme)."""
import geometry as G


INK = "#1f1f1f"; MUTED = "#6b6862"; LINE = "#cfcabf"; BOXF = "#f6f5f2"; BAND = "#efeeea"
BLUE = "#2a73d9"
GAME_F, GAME_S = "#e3ecfb", "#5b8ad6"
VIN_F, VIN_S = "#fbe6da", "#e07b4f"
SND_F, SND_S = "#dcf2e8", "#2fa47a"
FONT = 'font-family="Inter, sans-serif"'


def t(x, y, s, size=12, anchor="start", weight=400, fill=INK, extra=""):
    return f'<text x="{x}" y="{y}" {FONT} font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>'
def rect(x, y, w, h, fill=BOXF, stroke=LINE, rx=6, sw=1.2, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'
def node(x, y, w, h, title, sub=None, bold=True, fill="#fff", stroke=LINE):
    o = [rect(x, y, w, h, fill, stroke)]
    if sub:
        o.append(t(x + w / 2, y + h / 2 - 2, title, 12.5, "middle", 600 if bold else 400))
        o.append(t(x + w / 2, y + h / 2 + 13, sub, 10.5, "middle", 400, MUTED))
    else:
        o.append(t(x + w / 2, y + h / 2 + 4.5, title, 12.5, "middle", 600 if bold else 400))
    return "\n".join(o)
def wire(points, color=LINE, sw=1.4, dash=None):
    d = "M" + " L".join(f"{a},{b}" for a, b in points)
    da = f'stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" {da}/>'

def bar_heads(n):
    """v15: each bar's heads for the plans, from the same list as the renders: (offset along the bar, colour, (aim x, aim z))."""
    import render as R
    hs = G.BAR1_HEADS if n == 1 else R.spot_heads2()
    return [(h[0], h[1], (h[3][0], h[3][2])) for h in hs]


def _bar_rect(X, Y, bx, bz, w, fill="#ddd9d0", stroke="#999", rx=0):
    """A spot bar seen from above (84 long, w px wide), along z since v15."""
    if G.BAR_AXIS == "z":
        x0, x1 = X(bx), X(bx)
        y0, y1 = sorted((Y(bz - 42), Y(bz + 42)))
        return f'<rect x="{x0 - w / 2:.1f}" y="{y0:.1f}" width="{w}" height="{y1 - y0:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'
    xa, xb = sorted((X(bx - 42), X(bx + 42)))
    return f'<rect x="{xa:.1f}" y="{Y(bz) - w / 2:.1f}" width="{xb - xa:.1f}" height="{w}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'

def svg(w, h, body, title=None, sub=None):
    head = []
    top = 0
    if title:
        head.append(t(0, 16, title, 14.5, "start", 650))
        top = 22
    if sub:
        head.append(t(0, top + 16, sub, 11.5, "start", 400, MUTED))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%">'
            + "\n".join(head) + body + "</svg>")
def _fmt(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")

# ------------------------------------------------------------------ network
def network():
    o = []
    W = 760
    bands = [("Top floor · bedroom 3 and the landing", 56, 178), ("Living room", 246, 214), ("Kitchen", 472, 74)]
    for name, y, h in bands:
        o.append(rect(0, y, W, h, BAND, "#e2e0da", 8))
        o.append(t(14, y + 20, name, 11.5, "start", 500, MUTED))
    o.append(node(14, 84, 128, 42, "Virgin Hub 5", "modem mode"))
    o.append(node(170, 84, 128, 42, "Deco A (main)", "router + Wi-Fi"))
    o.append(node(326, 84, 136, 42, "Switch 1", "8-port gigabit · new"))
    o.append(wire([(142, 105), (170, 105)]))
    o.append(wire([(298, 105), (326, 105)]))
    ends = [("PC 1", 72, False), ("PC 2", 108, False), ("Projector, master · optional", 144, True), ("Music room, bedroom 2 · optional", 180, True)]
    for name, y, opt in ends:
        o.append(node(530, y - 13, 220, 26, name, bold=False, fill="#fff" if not opt else "#fbfaf7"))
        o.append(wire([(462, 105 if not opt else 118), (505, 105 if not opt else 118), (505, y), (530, y)], LINE if not opt else BLUE, 1.4 if not opt else 1.8, None if not opt else "5 3"))
    o.append(t(710, 222, "1 port spare", 10.5, "end", 400, MUTED))
    o.append(node(170, 350, 128, 42, "Deco B", f"high shelf, {G.HIGH_TOP:g} cm"))
    o.append(node(326, 350, 136, 42, "Switch 2", "8-port, in the channel"))
    devs = ["Xbox Series X", "Xbox One", "Xbox 360", "PS3", "PC (side wall)", "LG C6 TV"]
    for i, d in enumerate(devs):
        y = 264 + i * 30
        o.append(node(560, y, 150, 24, d, bold=False))
        o.append(wire([(462, 371), (520, 371), (520, y + 12), (560, y + 12)]))
    o.append(t(710, 454, "1 port spare", 10.5, "end", 400, MUTED))
    o.append(wire([(298, 371), (326, 371)]))
    o.append(node(170, 496, 128, 40, "Deco C", "kitchen Wi-Fi"))
    o.append(wire([(380, 126), (380, 220), (234, 220), (234, 350)], BLUE, 2.4))
    o.append(t(244, 242, "Cat6 run 1", 10.5, "start", 500, BLUE))
    o.append(wire([(410, 126), (410, 210), (740, 210), (740, 516), (298, 516)], BLUE, 2.4))
    o.append(t(730, 506, "Cat6 run 2 (straight to the kitchen)", 10.5, "end", 500, BLUE))
    o.append(wire([(0, 570), (28, 570)], BLUE, 2.4)); o.append(t(36, 574, "Cat6 run between rooms", 11, "start", 400, MUTED))
    o.append(wire([(220, 570), (248, 570)])); o.append(t(256, 574, "short Cat6 patch lead", 11, "start", 400, MUTED))
    o.append(wire([(420, 570), (448, 570)], BLUE, 1.8, "5 3")); o.append(t(456, 574, "optional run, if you want it wired", 11, "start", 400, MUTED))
    return svg(W, 584, "\n".join(o), "Every floor has its own Cat6 link back to bedroom 3",
               "Deco A and Switch 1 live with the Hub 5 and the gaming PCs in bedroom 3; two spare ports can wire the projector and the music room")


# ------------------------------------------------------------------ record trays detail
def drawer():
    import math
    W, H = 860, 590
    o = []
    s = 5.0
    ox, oy = 268, 520
    Z = lambda cm: ox + cm * s
    Y = lambda cm: oy - cm * s
    o.append(t(0, 62, "Side section through bay 3", 12, "start", 600))
    o.append(f'<line x1="{Z(-36)}" y1="{oy}" x2="{Z(52)}" y2="{oy}" stroke="#b9b4a8" stroke-width="1.4"/>')
    o.append(f'<rect x="{Z(44)}" y="{Y(86)}" width="12" height="{86*s}" fill="#e4ddd0"/>')
    o.append(t(Z(44) + 16, Y(84), "back", 10, "start", 400, MUTED))
    o.append(t(Z(44) + 16, Y(84) + 12, "wall", 10, "start", 400, MUTED))
    o.append(t(Z(42), Y(60), "4 cm", 9, "middle", 400, MUTED))
    o.append(t(Z(42), Y(60) + 11, "channel", 9, "middle", 400, MUTED))
    o.append(f'<rect x="{Z(0)}" y="{Y(73)}" width="{40*s}" height="{1.8*s}" fill="#efe2c8" stroke="#c9a77a"/>')
    o.append(f'<rect x="{Z(0)}" y="{Y(1.8)}" width="{40*s}" height="{1.8*s}" fill="#efe2c8" stroke="#c9a77a"/>')
    o.append(f'<rect x="{Z(0)}" y="{Y(73)}" width="{40*s}" height="{73*s}" fill="none" stroke="#8f8a80" stroke-width="1.3"/>')
    o.append(f'<rect x="{Z(-2)}" y="{Y(76)}" width="{46*s}" height="{3*s}" fill="#e9dccb" stroke="#c9b79f"/>')
    o.append(t(Z(20), Y(76) - 5, "oak worktop 3, at 76: the turntable sits on it", 9.5, "middle", 500))
    lean = math.radians(10); hgt = 31.4 * math.cos(lean); dzl = 31.4 * math.sin(lean)
    def tier(yb, ghost=0.0):
        oz = -ghost
        op = 0.55 if ghost else 1
        da = 'stroke-dasharray="4 3"' if ghost else ""
        o.append(f'<rect x="{Z(oz)}" y="{Y(yb + 12)}" width="{40*s}" height="{12*s}" fill="none" stroke="#c9a77a" stroke-width="0.9" opacity="{op}" {da}/>')
        o.append(f'<rect x="{Z(oz)}" y="{Y(yb + 1.2)}" width="{40*s}" height="{1.2*s}" fill="#f1dfc4" stroke="#c9a77a" opacity="{op}"/>')
        for i in range(11):
            zb = oz + 2.6 + i * 2.6
            o.append(f'<line x1="{Z(zb)}" y1="{Y(yb + 1.2)}" x2="{Z(zb + dzl)}" y2="{Y(yb + 1.2 + hgt)}" stroke="{VIN_S}" stroke-width="{2.4 if i == 0 else 1.1}" opacity="{op}"/>')
        o.append(f'<rect x="{Z(oz - 0.6)}" y="{Y(yb + 5.0)}" width="{1.5*s}" height="{5.0*s}" fill="#e9c9a4" stroke="{VIN_S}" opacity="{op}"/>')
    tier(2.3); tier(37.0); tier(37.0, ghost=30)
    o.append(t(Z(-12), Y(37 + 36), "pulls out 30+ cm", 10, "middle", 600, VIN_S))
    o.append(t(Z(21), Y(20), "~90 LPs face-out,", 10.5, "middle", 650))
    o.append(t(Z(21), Y(20) + 13, "leaning back 10°", 10, "middle", 400, MUTED))
    xx = Z(-27)
    o.append(f'<line x1="{xx}" y1="{Y(0)}" x2="{xx}" y2="{Y(76)}" stroke="#cfcabf"/>')
    for h in (0, 3.5, 34.4, 38.2, 69.1, 76):
        o.append(f'<line x1="{xx - 4}" y1="{Y(h)}" x2="{xx + 4}" y2="{Y(h)}" stroke="#9a958b"/>')
    for h, lab, dy in [(0, "0 floor", 4), (3.5, "3.5 lower base", -1), (34.4, "34.4 sleeves", 9), (38.2, "38.2 upper base", -2), (69.1, "69.1 sleeves", 9), (76, "76 top", 0)]:
        o.append(t(xx - 7, Y(h) + dy, lab, 9, "end", 400, MUTED))
    o.append(t(Z(18), oy + 18, "carcass 18 mm birch ply, 60 × 40 × 73, back open to the channel · crates 40 deep on 400 mm runners", 10, "middle", 400, MUTED))
    o.append(t(Z(18), oy + 32, "12 mm base, 9 mm sides, 5 cm oak lip · 2.6 and 2.1 cm finger room (top panel at 71.2)", 10, "middle", 400, MUTED))
    # v16: bay 3 from above: the slim column, the divider, the LP crate
    k = 4.3
    px0, py0 = 560, 110
    b0 = G.B3_IN[0]
    PX = lambda c: px0 + (c - b0) * k
    PY = lambda c: py0 + (40 - c) * k
    o.append(t(px0 - 10, 62, "Bay 3 from above (v16)", 12, "start", 600))
    o.append(f'<rect x="{PX(b0)}" y="{PY(40)}" width="{(G.B3_IN[1] - b0)*k}" height="{40*k}" fill="none" stroke="#8f8a80" stroke-width="1.3"/>')
    o.append(t(PX((b0 + G.B3_IN[1]) / 2), PY(40) - 8, f"ply carcass, {G.B3_IN[1] - b0:.1f} inside", 10, "middle", 400, MUTED))
    o.append(f'<rect x="{PX(G.B3_DIV[0])}" y="{PY(40)}" width="{(G.B3_DIV[1] - G.B3_DIV[0])*k}" height="{40*k}" fill="#e7d6b8" stroke="#c9a77a"/>')
    for (a_, b_) in ((G.SLIM_BOX_X[0] - G.RUN, G.SLIM_BOX_X[0]), (G.SLIM_BOX_X[1], G.B3_DIV[0]), (G.B3_DIV[1], G.REC_BOX_X[0]), (G.REC_BOX_X[1], G.B3_IN[1])):
        o.append(f'<rect x="{PX(a_)}" y="{PY(39.5)}" width="{(b_ - a_)*k}" height="{39.5*k}" fill="#e4e4e4" stroke="#999" stroke-width="0.6"/>')
    # the LP crate
    r0, r1 = G.REC_BOX_X
    o.append(f'<rect x="{PX(r0)}" y="{PY(40)}" width="{(r1 - r0)*k}" height="{40*k}" fill="{VIN_F}" stroke="{VIN_S}"/>')
    o.append(f'<rect x="{PX(r0 + 0.9)}" y="{PY(39.1)}" width="{G.TRAY_INSIDE*k}" height="{38.2*k}" fill="#fff7f1" stroke="{VIN_S}" stroke-opacity="0.4"/>')
    lx = r0 + 0.9 + (G.TRAY_INSIDE - G.LP) / 2
    for i in range(26):
        zz = 2.6 + i * 1.2
        o.append(f'<rect x="{PX(lx)}" y="{PY(zz + 0.4)}" width="{G.LP*k}" height="{0.5*k}" fill="{VIN_S}" opacity="{0.75 - i*0.02}"/>')
    o.append(t(PX((r0 + r1) / 2), PY(22) - 4, "LP crate", 11, "middle", 650, extra='paint-order="stroke" stroke="#fff7f1" stroke-width="4"'))
    o.append(t(PX((r0 + r1) / 2), PY(22) + 10, f"~{G.TRAY_LPS} face-out", 10, "middle", 400, MUTED, extra='paint-order="stroke" stroke="#fff7f1" stroke-width="4"'))
    # the slim drawer (a games one)
    q0, q1 = G.SLIM_BOX_X
    o.append(f'<rect x="{PX(q0)}" y="{PY(40)}" width="{(q1 - q0)*k}" height="{40*k}" fill="{GAME_F}" stroke="{GAME_S}"/>')
    o.append(f'<rect x="{PX(q0 + G.SLIM_SIDE)}" y="{PY(40 - G.SLIM_SIDE)}" width="{G.SLIM_INSIDE*k}" height="{(40 - 2 * G.SLIM_SIDE)*k}" fill="#f6f8fb" stroke="{GAME_S}" stroke-opacity="0.4"/>')
    gx = q0 + G.SLIM_SIDE + (G.SLIM_INSIDE - G.GAME_CASE[0]) / 2
    for i in range(G.SLIM_DRAWERS[0]["n"]):
        zz = 2.6 + i * 1.45
        o.append(f'<rect x="{PX(gx)}" y="{PY(zz + 0.5)}" width="{G.GAME_CASE[0]*k}" height="{0.7*k}" fill="{GAME_S}" opacity="{0.8 - i*0.025}"/>')
    o.append(t(PX((q0 + q1) / 2), PY(43.5), "games", 10, "middle", 650, GAME_S))
    o.append(f'<rect x="{PX(G.B3_IN[0] + 0.2)}" y="{PY(0)}" width="{(G.FACE_STILE[0] - G.B3_IN[0] - 0.4)*k}" height="{1.5*k}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    o.append(f'<rect x="{PX(G.FACE_STILE[1] + 0.2)}" y="{PY(0)}" width="{(G.B3_IN[1] - G.FACE_STILE[1] - 0.4)*k}" height="{1.5*k}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    yy = PY(0) + 24
    o.append(t(PX((q0 + q1) / 2), yy, f"{q1 - q0:.1f}", 9.5, "middle", 600, GAME_S))
    o.append(t(PX(sum(G.B3_DIV) / 2), yy, "1.2", 9.5, "middle", 600, MUTED))
    o.append(t(PX((r0 + r1) / 2), yy, f"{r1 - r0:.1f}", 9.5, "middle", 600, VIN_S))
    cx = PX((b0 + G.B3_IN[1]) / 2)
    o.append(t(cx, yy + 18, f"LP crate {r1 - r0:.1f} × 40, a {G.TRAY_INSIDE:.1f} trough: LPs snug, no dead space", 10, "middle", 400, MUTED))
    o.append(t(cx, yy + 32, f"slim drawers {q1 - q0:.1f} × 40, {G.SLIM_INSIDE:.1f} inside: DVD-size cases face-out", 10, "middle", 400, MUTED))
    o.append(t(cx, yy + 46, "12 mm ply divider · 12.7 mm runners each side", 10, "middle", 400, MUTED))
    o.append(t(cx, yy + 60, "an LP crate is about 30 kg full: open one at a time", 10, "middle", 500, VIN_S))
    return svg(W, H, "\n".join(o), "Bay 3: two LP crates under the turntable, a slim game column beside them",
               "Section left through the LP crates, plan right. Pull a crate and flip through the covers like a record shop browser; the slim drawers flip the same way for games")


def game_drawer():
    import math
    W, H = 860, 590
    o = []
    s = 6.0
    ox, oy = 250, 470
    Z = lambda cm: ox + cm * s
    Y = lambda cm: oy - (cm + 9) * s      # frame stands on the 9 cm plinth
    o.append(t(0, 70, "Side section through bay 1", 12, "start", 600))
    o.append(f'<rect x="{Z(2)}" y="{Y(0)}" width="{36*s}" height="{9*s}" fill="#efe2c8" stroke="#c9a77a"/>')
    o.append(t(Z(20), Y(-4.5) + 4, "9 cm plinth", 10, "middle", 500))
    o.append(f'<line x1="{Z(-34)}" y1="{oy}" x2="{Z(52)}" y2="{oy}" stroke="#b9b4a8" stroke-width="1.4"/>')
    o.append(f'<line x1="{Z(44)}" y1="{oy}" x2="{Z(44)}" y2="{Y(48)}" stroke="#b9b4a8" stroke-width="2"/>')
    o.append(t(Z(44) + 4, Y(44), "wall", 10, "start", 400, MUTED))
    o.append(f'<rect x="{Z(0)}" y="{Y(46)}" width="{40*s}" height="{46*s}" fill="none" stroke="#8f8a80" stroke-width="1.3"/>')
    o.append(f'<rect x="{Z(1)}" y="{Y(28.6)}" width="{36*s}" height="{1.8*s}" fill="#e7e2d6" stroke="#bdb8ad"/>')
    o.append(rect(Z(6), Y(36.9), 25.8 * s, 8.3 * s, GAME_F, GAME_S, 3))
    o.append(t(Z(19), Y(33.6), "Xbox 360 above (16 cm row)", 10, "middle", 500))
    o.append(f'<rect x="{Z(0)}" y="{Y(1.6)}" width="{40*s}" height="{1.6*s}" fill="#e7e2d6" stroke="#bdb8ad"/>')
    # drawer box 35 deep
    o.append(f'<rect x="{Z(0)}" y="{Y(18.1)}" width="{35*s}" height="{15.5*s}" fill="none" stroke="#c9a77a" stroke-width="1.2"/>')
    o.append(f'<rect x="{Z(0)}" y="{Y(3.5)}" width="{35*s}" height="{0.9*s}" fill="#f1dfc4" stroke="#c9a77a"/>')
    o.append(f'<rect x="{Z(1)}" y="{Y(11)}" width="{33*s}" height="{3.5*s}" fill="none" stroke="#7a7a7a" stroke-dasharray="3 2"/>')
    o.append(f'<rect x="{Z(-0.6)}" y="{Y(9.1)}" width="{2*s}" height="{6.5*s}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    lean = math.radians(13); hgt = 19 * math.cos(lean); dzl = 19 * math.sin(lean)
    for i in range(6):
        zb = 2.4 + i * 1.45
        o.append(f'<line x1="{Z(zb)}" y1="{Y(3.5)}" x2="{Z(zb + dzl)}" y2="{Y(3.5 + hgt)}" stroke="{GAME_S}" stroke-width="{2.2 if i == 0 else 1.2}"/>')
    o.append(f'<rect x="{Z(14.2)}" y="{Y(12.5)}" width="{0.6*s}" height="{9*s}" fill="#e9c9a4" stroke="#c9a77a"/>')
    o.append(f'<rect x="{Z(14.9)}" y="{Y(17)}" width="{19*s}" height="{13.5*s}" fill="{GAME_F}" stroke="{GAME_S}"/>')
    o.append(f'<rect x="{Z(14.9)}" y="{Y(17)}" width="{19*s}" height="{1.4*s}" fill="{GAME_S}"/>')
    o.append(t(Z(24.4), Y(10.5), "case on its edge,", 10, "middle", 500))
    o.append(t(Z(24.4), Y(10.5) + 13, "spine (title) on top", 10, "middle", 400, MUTED))
    o.append(t(Z(24.4), Y(17) - 6, "you read here", 10, "middle", 600, GAME_S))
    o.append(t(Z(-13), Y(13), "display bin:", 10, "middle", 600))
    o.append(t(Z(-13), Y(13) + 12, "covers face out", 9.5, "middle", 400, MUTED))
    # ghost pulled out
    o.append(f'<rect x="{Z(-30)}" y="{Y(18.1)}" width="{35*s}" height="{15.5*s}" fill="none" stroke="{GAME_S}" stroke-dasharray="4 3" opacity="0.6"/>')
    o.append(t(Z(-24), Y(18.1) - 6, "rolls out 30 cm", 10, "middle", 600, GAME_S))
    o.append(f'<line x1="{Z(-3)}" y1="{Y(1.6)}" x2="{Z(-3)}" y2="{Y(26.8)}" stroke="{MUTED}" stroke-width="1"/>')
    o.append(t(Z(-4), Y(24), "25.2 cm", 10, "end", 400, MUTED))
    o.append(t(Z(-4), Y(24) + 12, "row", 10, "end", 400, MUTED))
    o.append(t(Z(-4), Y(24) + 26, "base 11.6", 10, "end", 400, MUTED))
    o.append(t(Z(-4), Y(24) + 38, "from floor", 10, "end", 400, MUTED))
    o.append(t(Z(18), oy + 18, "box 35 cm deep on 350 mm full-extension soft-close runners", 10, "middle", 400, MUTED))
    o.append(t(Z(18), oy + 32, "5 cm free behind the box, then the 4 cm cable channel", 10, "middle", 400, MUTED))
    o.append(t(Z(18), oy + 46, "bins: 19 cm cases leaning 13°, about 18.5 cm tall", 10, "middle", 400, MUTED))
    # plan view
    k = 5.2
    px0, py0 = 548, 112
    PX = lambda c: px0 + c * k
    PY = lambda c: py0 + (35 - c) * k
    o.append(t(px0 - 20, 70, "Top view, drawer pulled out", 12, "start", 600))
    o.append(f'<rect x="{PX(0)}" y="{PY(35)}" width="{54.3*k}" height="{35*k}" fill="#f1dfc4" stroke="#c9a77a"/>')
    o.append(f'<rect x="{PX(1.2)}" y="{PY(33.8)}" width="{51.9*k}" height="{32.6*k}" fill="#fbfaf7" stroke="#e6e3dc"/>')
    x = 1.5
    for kind, n, tt, ln, f, st in [("PS2", 15, 1.4, 19, "#dfe6f7", "#3a5fb8"), ("360", 12, 1.4, 19, "#e3f3e2", "#3f9a4c"),
                                    ("f", 1, 2.0, 19, "#e9c9a4", VIN_S), ("One", 9, 1.2, 17, "#d7efdc", "#2a7c3f")]:
        x0 = x
        for i in range(n):
            o.append(f'<rect x="{PX(x)}" y="{PY(14.9+ln)}" width="{tt*k}" height="{ln*k}" fill="{f}" stroke="{st}" stroke-width="0.7"/>')
            x += tt + (0.1 if kind == "f" else 0)
        if kind != "f":
            o.append(t((PX(x0) + PX(x)) / 2, PY(14.9 + ln) - 6, kind, 10.5, "middle", 600))
    o.append(t(PX(36.4), PY(14.9) + 26, "", 1))
    o.append(f'<rect x="{PX(1.2)}" y="{PY(14.8)}" width="{51.9*k}" height="{0.6*k}" fill="#e9c9a4"/>')
    for (a, b, lab) in [(1.2, 17.2, "Xbox bin"), (37.1, 53.1, "PS2 bin")]:
        o.append(f'<rect x="{PX(a)}" y="{PY(14.2)}" width="{(b-a)*k}" height="{12.6*k}" fill="{GAME_F}" stroke="{GAME_S}" stroke-opacity="0.5"/>')
        o.append(t(PX((a + b) / 2), PY(8.5), lab, 10.5, "middle", 600))
        o.append(t(PX((a + b) / 2), PY(8.5) + 12, "6 face out", 9.5, "middle", 400, MUTED))
    o.append(t(PX(27.15), PY(8.5), "tray", 10.5, "middle", 600))
    o.append(t(PX(27.15), PY(8.5) + 12, "cards, pads", 9.5, "middle", 400, MUTED))
    o.append(f'<rect x="{PX(-1.3)}" y="{PY(1.4)}" width="{56.9*k}" height="{2*k}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    o.append(t(PX(27.15), PY(0) + 24, "front: oak lip with finger pull, matching the record drawer", 10, "middle", 400, MUTED))
    o.append(t(PX(27.15), PY(0) + 38, "back row: 15 PS2 + 12 Xbox 360 + follower block + 9 Xbox One", 10, "middle", 400, MUTED))
    o.append(t(PX(27.15), PY(0) + 52, "box 54.3 × 35 cm outside · 51.9 cm inside · 16 cm bins, 18.7 cm tray", 10, "middle", 400, MUTED))
    return svg(W, H, "\n".join(o), "The game drawer: covers on show at the front, every title readable from above at the back",
               "Bay 1, bottom row. Section left, plan right. Nothing stands behind anything else")


AUD = "#d9822b"

def arrow(x1, y1, x2, y2, col=LINE, w=1.4, dash=None):
    da = f'stroke-dasharray="{dash}"' if dash else ""
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - 7 * math.cos(ang), y2 - 7 * math.sin(ang)
    px, py = 3.5 * math.sin(ang), -3.5 * math.cos(ang)
    return (f'<line x1="{x1}" y1="{y1}" x2="{hx:.1f}" y2="{hy:.1f}" stroke="{col}" stroke-width="{w}" {da}/>'
            f'<path d="M{x2},{y2} L{hx+px:.1f},{hy+py:.1f} L{hx-px:.1f},{hy-py:.1f}Z" fill="{col}"/>')


def path_arrow(points, col=LINE, w=1.4, dash=None):
    out = wire(points[:-1] + [points[-1]], col, w, dash)
    (x1, y1), (x2, y2) = points[-2], points[-1]
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - 7 * math.cos(ang), y2 - 7 * math.sin(ang)
    px, py = 3.5 * math.sin(ang), -3.5 * math.cos(ang)
    return out + f'<path d="M{x2},{y2} L{hx+px:.1f},{hy+py:.1f} L{hx-px:.1f},{hy-py:.1f}Z" fill="{col}"/>'


def av():
    W, H = 760, 560
    o = []
    G = "#9a958b"
    src = [("PC", None, 70), ("Xbox Series X", None, 112), ("Xbox One", None, 168), ("Xbox 360", None, 206),
           ("PS3", None, 244), ("PS2", "component + optical", 300), ("PS1", "RGB SCART", 348),
           ("Turntable", None, 420), ("Phone", None, 476)]
    for name, sub, y in src:
        o.append(node(0, y - 16, 128, 32, name, sub, bold=(sub is not None)))
    o.append(node(196, 166, 120, 100, "HDMI switch", "5-in-1, auto"))
    o.append(node(196, 300, 120, 62, "RetroTINK", "6X CE"))
    o.append(node(196, 404, 120, 32, "Phono preamp", bold=False))
    o.append(rect(392, 50, 130, 230, "#efeeea", "#d6d2c8", 8))
    o.append(t(457, 150, "LG OLED C6", 12.5, "middle", 650))
    o.append(t(457, 166, "55 in", 10.5, "middle", 400, MUTED))
    for lab, y in [("HDMI 1", 70), ("HDMI 3", 112), ("HDMI 4", 216), ("HDMI 2 eARC", 260)]:
        o.append(t(400, y + 4, lab, 10, "start", 500, MUTED))
    o.append(rect(590, 214, 170, 290, SND_F, SND_S, 8))
    o.append(t(675, 240, "Hisense 5.1 soundbar", 12, "middle", 650))
    o.append(t(675, 255, "+ wireless sub and rears", 10, "middle", 400, MUTED))
    for lab, y in [("HDMI eARC (from TV)", 280), ("Optical in", 318), ("AUX 3.5 mm in", 422), ("Bluetooth", 476)]:
        o.append(t(600, y + 4, lab, 10, "start", 500, INK))
    o.append(t(675, 360, "no HDMI inputs, so", 9.5, "middle", 400, MUTED))
    o.append(t(675, 372, "picture goes via the TV", 9.5, "middle", 400, MUTED))
    # picture paths (grey)
    o.append(arrow(128, 70, 392, 70, G)); o.append(t(260, 64, "4K up to 165 Hz", 10, "middle", 400, MUTED))
    o.append(arrow(128, 112, 392, 112, G)); o.append(t(260, 106, "4K 120 Hz", 10, "middle", 400, MUTED))
    for y in (168, 206, 244):
        o.append(arrow(128, y, 196, y if y != 244 else 244, G))
    o.append(arrow(128, 300, 196, 318, G))
    o.append(arrow(128, 348, 196, 344, G))
    o.append(arrow(256, 300, 256, 266, G)); o.append(t(262, 288, "HDMI", 9.5, "start", 400, MUTED))
    o.append(arrow(316, 216, 392, 216, G))
    o.append(arrow(128, 420, 196, 420, AUD))
    # sound paths (orange)
    o.append(path_arrow([(522, 260), (556, 260), (556, 280), (590, 280)], AUD, 1.8))
    o.append(path_arrow([(128, 292), (160, 292), (160, 284), (370, 284), (370, 318), (590, 318)], AUD, 1.8))
    o.append(t(380, 312, "PS2 optical straight to the soundbar (5.1)", 9.5, "start", 500, AUD))
    o.append(path_arrow([(316, 420), (590, 422)], AUD, 1.8))
    o.append(path_arrow([(128, 476), (590, 476)], AUD, 1.4, "5 4"))
    o.append(t(360, 470, "Bluetooth, phones only", 9.5, "middle", 400, AUD))
    o.append(wire([(0, 540), (28, 540)], G, 1.4)); o.append(t(36, 544, "picture (HDMI, sound travels with it)", 11, "start", 400, MUTED))
    o.append(wire([(300, 540), (328, 540)], AUD, 1.8)); o.append(t(336, 544, "sound straight to the soundbar", 11, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "Everything sounds through the Hisense: directly where it can, via the TV where it can't",
               "The soundbar has no HDMI inputs, so HDMI sources reach it over eARC; vinyl, PS2 audio and phones go straight in")


# ------------------------------------------------------------------ joinery details (artisan oak version)
def joints():
    W, H = 860, 500
    o = []
    OAKF, OAKS, END = "#ecd3ae", "#b88a55", "#d7b483"
    k = 7.0
    ax, ay = 40, 110
    PX = lambda c: ax + 60 + c * k
    PZ = lambda c: ay + c * k
    o.append(t(0, 70, "A · Wedged through-tenons, from above", 12, "start", 600))
    o.append(f'<line x1="{PX(-9)}" y1="{PZ(0)}" x2="{PX(14)}" y2="{PZ(0)}" stroke="#8f8a80" stroke-width="3"/>')
    o.append(t(PX(14) + 4, PZ(0) + 4, "wall", 10, "start", 400, MUTED))
    o.append(rect(PX(-9), PZ(0), 9 * k, 30 * k, OAKF, OAKS, 0))
    o.append(t(PX(-4.5), PZ(5), "Series X", 10, "middle", 500))
    o.append(t(PX(-4.5), PZ(5) + 12, "shelf, 30 deep", 9.5, "middle", 400, MUTED))
    o.append(t(PX(-4.5), PZ(25) + 14, "room ↓", 9.5, "middle", 400, MUTED))
    o.append(rect(PX(0), PZ(0), 4.5 * k, 30 * k, "#f4e3c6", OAKS, 0))
    o.append(t(PX(2.25), PZ(33), "upright", 10, "middle", 500))
    o.append(t(PX(2.25), PZ(33) + 12, "4.5 × 30", 9.5, "middle", 400, MUTED))
    o.append(rect(PX(3.3), PZ(0), 1.2 * k, 7 * k, OAKF, OAKS, 0, 0.8, 'stroke-dasharray="2 2"'))
    o.append(rect(PX(4.5), PZ(0), 2.5 * k, 7 * k, "#e9dccb", OAKS, 0, 0.8))
    o.append(t(PX(7.5), PZ(3) + 3, "ledge housed here,", 9, "start", 500))
    o.append(t(PX(7.5), PZ(3) + 14, "0–7 from the wall", 9, "start", 400, MUTED))
    for zc in (12.0, 20.0):
        o.append(rect(PX(0), PZ(zc - 3), 4.5 * k, 6 * k, END, OAKS, 0, 1, 'fill-opacity="0.85"'))
        o.append(f'<line x1="{PX(3.2)}" y1="{PZ(zc)}" x2="{PX(4.5)}" y2="{PZ(zc)}" stroke="#4a2f19" stroke-width="2"/>')
    o.append(t(PX(7.3), PZ(12) + 4, "tenons 6 wide, 2.4 thick,", 9.5, "start", 500))
    o.append(t(PX(7.3), PZ(12) + 16, "at 12 and 20 from the wall", 9.5, "start", 400, MUTED))
    o.append(t(PX(7.3), PZ(20) + 10, "flush on the TV side,", 9.5, "start", 500))
    o.append(t(PX(7.3), PZ(20) + 22, "so they can't touch the TV", 9.5, "start", 400, MUTED))
    bx = 330
    FX = lambda c: bx + 60 + c * k
    FY = lambda c: ay + 120 - c * k
    o.append(t(bx, 70, "B · The same joint from the front", 12, "start", 600))
    o.append(rect(FX(0), FY(14), 4.5 * k, 28 * k, "#f4e3c6", OAKS, 0))
    o.append(rect(FX(-11), FY(2), 11 * k, 4 * k, OAKF, OAKS, 0))
    o.append(f'<path d="M{FX(0)},{FY(1.2)} L{FX(3)},{FY(1.2)} L{FX(4.5)},{FY(1.55)} L{FX(4.5)},{FY(-1.55)} L{FX(3)},{FY(-1.2)} L{FX(0)},{FY(-1.2)}Z" fill="{END}" stroke="{OAKS}"/>')
    o.append(f'<line x1="{FX(2.2)}" y1="{FY(0)}" x2="{FX(4.5)}" y2="{FY(0)}" stroke="#4a2f19" stroke-width="1.6"/>')
    o.append(f'<path d="M{FX(4.5)},{FY(0.35)} L{FX(2.6)},{FY(0)} L{FX(4.5)},{FY(-0.35)}Z" fill="#7a4e2b"/>')
    o.append(t(FX(8), FY(0) + 4, "oak wedge in a saw kerf,", 9.5, "start", 500))
    o.append(t(FX(8), FY(0) + 16, "glued and driven home", 9.5, "start", 400, MUTED))
    o.append(t(FX(8), FY(4.2), "mortise flared 3–4 mm", 9.5, "start", 500))
    o.append(t(FX(8), FY(4.2) + 12, "top and bottom, outside face", 9.5, "start", 400, MUTED))
    o.append(t(FX(-5.5), FY(2) - 8, "Series X shelf, 4 thick", 9.5, "middle", 500))
    o.append(t(FX(2.25), FY(14) - 8, "upright", 9.5, "middle", 500))
    o.append(t(bx, FY(-14) + 22, "The kerf runs flat, so the wedge spreads", 9.5, "start", 400, MUTED))
    o.append(t(bx, FY(-14) + 34, "the tenon up and down, along the upright's", 9.5, "start", 400, MUTED))
    o.append(t(bx, FY(-14) + 46, "grain, and can't split it.", 9.5, "start", 400, MUTED))
    cx = 640
    QX = lambda c: cx + 40 + c * k
    o.append(t(cx - 20, 70, "C · Housed shelf, pegged", 12, "start", 600))
    o.append(f'<line x1="{QX(-8)}" y1="{PZ(0)}" x2="{QX(12)}" y2="{PZ(0)}" stroke="#8f8a80" stroke-width="3"/>')
    o.append(rect(QX(-8), PZ(0), 9.2 * k, 30 * k, OAKF, OAKS, 0))
    o.append(rect(QX(0), PZ(0), 4.5 * k, 30 * k, "#f4e3c6", OAKS, 0, 1, 'fill-opacity="0.9"'))
    o.append(rect(QX(0), PZ(0.5), 1.2 * k, 29.5 * k, OAKF, OAKS, 0, 0.8, 'stroke-dasharray="2 2"'))
    o.append(rect(QX(1.2), PZ(19), 1.3 * k, 8 * k, END, OAKS, 0))
    o.append(f'<rect x="{QX(1.1)}" y="{PZ(24.5)}" width="{1.0*k}" height="{5.5*k}" fill="#7a4e2b"/>')
    o.append(t(QX(5.5), PZ(4) + 4, "housing 1.2 deep,", 9.5, "start", 500))
    o.append(t(QX(5.5), PZ(4) + 16, "full depth", 9.5, "start", 400, MUTED))
    o.append(t(QX(5.5), PZ(20) + 4, "stub tenon 2.5", 9.5, "start", 500))
    o.append(t(QX(5.5), PZ(26.5) + 4, "10 mm oak peg", 9.5, "start", 500))
    o.append(t(QX(5.5), PZ(26.5) + 16, "from the front edge", 9.5, "start", 400, MUTED))
    o.append(t(QX(-4), PZ(33), "high shelf / ledge", 10, "middle", 500))
    o.append(t(QX(-4), PZ(33) + 12, "seen from above", 9.5, "middle", 400, MUTED))
    notes = [f"Through-tenons (A, B): the Series X shelf (top {G.RZ_SHELF_TOP:g}) passes through the left upright on two tenons, 12 and 20 cm from the wall, wedged and planed flush: proud, they'd touch the TV.",
             f"Housed and pegged (C): the three lengths of the high shelf (top {G.HIGH_TOP:g}) and the record ledge (top {G.LEDGE_TOP:g}). The peg shows as a dark dot on the upright's face.",
             f"Uprights: {G.UPRIGHT_LEN:g} long, worktop to ceiling, each on two 10 mm dowels into the worktop, scribed to the ceiling, with two concealed brackets. The left one also screws to the side wall, and the wrap ledge meets its front edge on two dowels."]
    for i, n in enumerate(notes):
        o.append(t(0, 420 + i * 22, "• " + n, 10, "start", 400, INK))
    return svg(W, H, "\n".join(o), "Artisan oak: how the joints work",
               "Drawn to scale at 7 px per cm. The joints carry the load and are left on show, finished in hardwax oil")


# ------------------------------------------------------------------ house plan (v9, from the Rightmove floor plans, corrected)
WALL = "#3a3a38"; ROOMF = "#fbfaf6"; HATCH = "#c9c3b5"

def house():
    """Three floors side by side, to scale (about 52 px per m), traced from the agent's plan, with the measured
    living room features, the chimney breast, the kitchen brick cupboard and the sloped ceilings added."""
    W, H = 860, 620
    k = 52.0
    o = []
    defs = ('<defs><pattern id="slope" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
            '<line x1="0" y1="0" x2="0" y2="8" stroke="#b8b1a2" stroke-width="2"/></pattern>'
            '<pattern id="brick" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#d9a48a"/>'
            '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#b5785e" stroke-width="0.8"/></pattern></defs>')
    o.append(defs)
    def floor(ox, oy, title, sub):
        o.append(t(ox, oy - 30, title, 12.5, "start", 650))
        o.append(t(ox, oy - 15, sub, 10, "start", 400, MUTED))
        return (lambda m: ox + m * k), (lambda m: oy + m * k)
    def room(X, Y, x1, y1, x2, y2, name=None, dims=None, fill=ROOMF):
        o.append(f'<rect x="{X(x1):.1f}" y="{Y(y1):.1f}" width="{(x2-x1)*k:.1f}" height="{(y2-y1)*k:.1f}" fill="{fill}" stroke="{WALL}" stroke-width="2.2"/>')
        if name:
            cx, cy = (X(x1) + X(x2)) / 2, (Y(y1) + Y(y2)) / 2
            o.append(t(cx, cy - (4 if dims else -4), name, 10, "middle", 650))
            if dims:
                o.append(t(cx, cy + 9, dims, 8.5, "middle", 400, MUTED))
    def deco(X, Y, x, y, lab, anchor="start", dx=9):
        o.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="6" fill="#fff" stroke="{BLUE}" stroke-width="2.2"/>')
        o.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="2" fill="#4fd17a"/>')
        o.append(t(X(x) + (dx if anchor == "start" else -dx), Y(y) + 3.5, lab, 9.5, anchor, 650, BLUE))
    X, Y = floor(14, 92, "Lower ground floor", "kitchen, WC · about 34 m²")
    room(X, Y, 0, 0, 1.04, 1.9, "WC", None, "#eaf2f4")
    room(X, Y, 0, 1.9, 1.04, 3.69, None)
    o.append(t(X(0.52), Y(2.9), "stairs", 8.5, "middle", 400, MUTED))
    room(X, Y, 1.04, 0, 4.81, 3.69, "Kitchen", "3.79 × 3.66 m", "#fdf6e3")
    room(X, Y, 0, 3.69, 1.77, 5.5, "Store")
    o.append(f'<rect x="{X(1.77):.1f}" y="{Y(3.69):.1f}" width="{(4.81-1.77)*k:.1f}" height="{(8.15-3.69)*k:.1f}" fill="#e6e3dc" stroke="{WALL}" stroke-width="2.2"/>')
    o.append(t(X(3.3), Y(5.9), "under the garage", 8.5, "middle", 400, MUTED))
    o.append(f'<rect x="{X(1.92):.1f}" y="{Y(3.10):.1f}" width="{1.175*k:.1f}" height="{0.59*k:.1f}" fill="url(#brick)" stroke="#8f5b45" stroke-width="1.4"/>')
    o.append(t(X(2.5), Y(3.02), "brick cupboard", 8.5, "middle", 650, "#8f5b45"))
    deco(X, Y, 3.3, 2.95, "Deco C", "start")
    o.append(t(X(3.45), Y(2.6), "on the outside of the", 8, "start", 400, MUTED))
    o.append(t(X(3.45), Y(2.6) + 10, "cupboard, up high", 8, "start", 400, MUTED))
    o.append(f'<circle cx="{X(3.2):.1f}" cy="{Y(3.55):.1f}" r="4" fill="{BLUE}"/>')
    o.append(t(X(3.3), Y(3.55) + 4, "Cat6 from above", 8, "start", 600, BLUE))
    # ground floor: the agent's outline, the measured living room features
    X, Y = floor(300, 92, "Ground floor", "living room (measured 4.67 × 3.47 m), hall, garage")
    LW, LD = 4.95, 3.65
    room(X, Y, 0, 0, LW, LD, None, None, "#fdf6e3")
    e = lambda m: LW - m               # distance from the east wall -> x on this plan
    ax0 = e(G.ALC_W / 100)
    bx0 = e((G.ALC_W + G.BREAST_W) / 100)
    o.append(f'<rect x="{X(bx0):.1f}" y="{Y(LD - G.ALC_D/100):.1f}" width="{G.BREAST_W/100*k:.1f}" height="{G.ALC_D/100*k:.1f}" fill="url(#brick)" stroke="{WALL}" stroke-width="2"/>')
    o.append(f'<rect x="{X(ax0):.1f}" y="{Y(LD - G.BASE_D/100):.1f}" width="{G.ALC_W/100*k:.1f}" height="{G.BASE_D/100*k:.1f}" fill="#e9d3b4" stroke="#b88a55" stroke-width="1.2"/>')
    o.append(f'<rect x="{X(e(G.TABLE_X[1]/100)):.1f}" y="{Y(LD - (G.ALC_D + G.FOLDED_D)/100):.1f}" width="{G.TABLE[0]/100*k:.1f}" height="{max(G.FOLDED_D/100*k, 3):.1f}" fill="#d9b48a" stroke="#9c6a3f" stroke-width="1"/>')
    o.append(t(X(ax0 + 0.93), Y(LD - 0.62), "media wall", 8.5, "middle", 650, "#7a5130"))
    o.append(t(X(e(G.TABLE_CX/100)), Y(LD - 0.62), "dining wall", 8, "middle", 650, "#7a5130"))
    o.append(t(X(1.1), Y(1.0), "Living room", 10, "middle", 650))
    o.append(t(X(1.1), Y(1.0) + 13, "4.67 × 3.47 m measured", 8.5, "middle", 400, MUTED))
    o.append(f'<rect x="{X(e(3.08)):.1f}" y="{Y(-0.06):.1f}" width="{2.35*k:.1f}" height="5" fill="#cfe3f2" stroke="#7aa6c8"/>')
    o.append(t(X(e(1.9)), Y(0.0) + 14, "window", 8, "middle", 400, MUTED))
    room(X, Y, 0, LD, 1.96, 7.3, "Hall")
    room(X, Y, 1.96, LD, 5.05, 8.15, "Garage")
    room(X, Y, 0, 7.3, 0.5, 8.15)
    room(X, Y, 1.25, 7.3, 1.96, 8.15)
    dx_ = bx0 - 0.12
    o.append(f'<path d="M{X(dx_):.1f},{Y(LD):.1f} A{0.8*k},{0.8*k} 0 0 1 {X(dx_ - 0.8):.1f},{Y(LD - 0.8):.1f}" fill="none" stroke="#9a958b" stroke-dasharray="3 2"/>')
    o.append(t(X(dx_ - 0.45), Y(LD - 0.15), "door?", 8, "middle", 400, MUTED))
    deco(X, Y, e(1.73), LD - 0.2, "Deco B", "start", 9)
    o.append(f'<circle cx="{X(e(G.PEND_X/100)):.1f}" cy="{Y(1.735):.1f}" r="4" fill="#e8b53f" stroke="#8a6a1a"/>')
    o.append(t(X(e(G.PEND_X/100)) - 8, Y(1.735) + 4, "spot bars", 8, "end", 500, "#8a6a1a"))
    o.append(f'<circle cx="{X(e(G.BAR2_X/100)):.1f}" cy="{Y((G.BAR2_Z - G.WINDOW_Z)/100):.1f}" r="4" fill="#e8b53f" stroke="#8a6a1a"/>')
    for i in range(int(LW * 4)):
        o.append(f'<circle cx="{X(0.12 + i*0.25):.1f}" cy="{Y(0.06):.1f}" r="1" fill="#e0a43a"/>')
    # 1st floor
    X, Y = floor(590, 92, "1st floor", "bedrooms, bathroom · about 40 m²")
    room(X, Y, 0, 0, 1.96, 2.36, "Bathroom", "2.04 × 2.38 m", "#eaf2f4")
    room(X, Y, 1.96, 0, 5.05, 3.69, None, None, "#fdf3d6")
    o.append(t(X(3.5), Y(2.2), "Bedroom 2", 10, "middle", 650)); o.append(t(X(3.5), Y(2.2) + 13, "spare · music room", 8.5, "middle", 400, MUTED))
    room(X, Y, 0, 2.36, 1.96, 5.95, "Landing")
    room(X, Y, 1.96, 3.69, 5.05, 8.15, None, None, "#fdf3d6")
    o.append(t(X(3.9), Y(6.0), "Master", 10, "middle", 650)); o.append(t(X(3.9), Y(6.0) + 13, "projector", 8.5, "middle", 400, MUTED))
    room(X, Y, 1.96, 3.69, 2.96, 4.75, None, None, "#ece8df")
    o.append(t(X(2.46), Y(4.12), "airing", 8, "middle", 650))
    o.append(t(X(2.46), Y(4.12) + 10, "cupboard", 8, "middle", 650))
    room(X, Y, 0, 5.95, 1.96, 8.15, None, None, "#fdf3d6")
    o.append(t(X(0.98), Y(7.55), "Bedroom 3", 10, "middle", 650)); o.append(t(X(0.98), Y(7.55) + 13, "gaming PCs, Hub 5", 8.5, "middle", 400, MUTED))
    for (x1, x2) in ((0, 1.96), (1.96, 5.05)):
        o.append(f'<rect x="{X(x1):.1f}" y="{Y(0):.1f}" width="{(x2-x1)*k:.1f}" height="{0.9*k:.1f}" fill="url(#slope)" opacity="0.8"/>')
    o.append(t(X(2.5), Y(0.55), "sloped ceiling, low at the back wall", 8, "middle", 600, "#6b6455"))
    deco(X, Y, 0.55, 6.75, "Deco A + Switch 1", "start", 10)
    o.append(wire([(X(0.55), Y(6.75)), (X(0.55), Y(4.25)), (X(2.4), Y(4.25))], BLUE, 2.4))
    o.append(f'<circle cx="{X(2.4):.1f}" cy="{Y(4.25):.1f}" r="4" fill="{BLUE}"/>')
    o.append(t(X(0.62), Y(5.3), "Cat6 across the landing,", 8.5, "start", 600, BLUE))
    o.append(t(X(0.62), Y(5.3) + 11, "down through the", 8.5, "start", 600, BLUE))
    o.append(t(X(0.62), Y(5.3) + 22, "airing cupboard floor", 8.5, "start", 600, BLUE))
    o.append(wire([(X(2.7), Y(4.6)), (X(3.4), Y(5.6))], BLUE, 1.8, "5 3"))
    o.append(wire([(X(2.7), Y(3.85)), (X(3.3), Y(2.9))], BLUE, 1.8, "5 3"))
    o.append(t(X(3.45), Y(5.75), "optional", 8, "start", 500, BLUE))
    o.append(t(X(3.35), Y(2.75), "optional", 8, "start", 500, BLUE))
    ly = H - 36
    o.append(f'<circle cx="8" cy="{ly - 4}" r="6" fill="#fff" stroke="{BLUE}" stroke-width="2.2"/>'); o.append(t(20, ly, "Deco unit", 10, "start", 400, MUTED))
    o.append(wire([(100, ly - 4), (128, ly - 4)], BLUE, 2.4)); o.append(t(134, ly, "Cat6 run", 10, "start", 400, MUTED))
    o.append(wire([(200, ly - 4), (228, ly - 4)], BLUE, 1.8, "5 3")); o.append(t(234, ly, "optional run", 10, "start", 400, MUTED))
    o.append(f'<rect x="318" y="{ly - 10}" width="16" height="12" fill="url(#brick)"/>'); o.append(t(340, ly, "chimney breast / brick cupboard", 10, "start", 400, MUTED))
    o.append(f'<rect x="530" y="{ly - 10}" width="16" height="12" fill="url(#slope)"/>'); o.append(t(552, ly, "sloped ceiling", 10, "start", 400, MUTED))
    o.append(f'<circle cx="650" cy="{ly - 4}" r="2" fill="#e0a43a"/><circle cx="658" cy="{ly - 4}" r="2" fill="#e0a43a"/>'); o.append(t(668, ly, "LED strip round the ceiling", 10, "start", 400, MUTED))
    o.append(t(0, H - 12, "Outline traced from the agent's plan (north, the window side, at the top). The living room's alcove, chimney breast and windows are placed from your measurements.", 9, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "The house: where the Decos and Cat6 runs go",
               "Deco A and Switch 1 move to bedroom 3 with the Hub 5. Both Cat6 runs drop through the airing cupboard, right over the media wall's corner")


# ------------------------------------------------------------------ front elevation
def front():
    s = 2.05
    W, H = 860, 650
    ox, oy = 104, 576
    X = lambda cm: ox + cm * s
    Y = lambda cm: oy - cm * s
    g = G
    o = []
    o.append(f'<rect x="{X(0)}" y="{Y(g.CEIL)}" width="{g.ALC_W*s}" height="{g.CEIL*s}" fill="#f8f7f4" stroke="{LINE}" stroke-width="1.2"/>')
    o.append(f'<rect x="{X(g.ALC_W)}" y="{Y(g.CEIL)}" width="{g.BREAST_W*s}" height="{g.CEIL*s}" fill="#f1efe9" stroke="{LINE}" stroke-width="1.2"/>')
    o.append(t(X(g.ALC_W + g.BREAST_W / 2), Y(g.CEIL) + 15, f"chimney breast, {_fmt(g.BREAST_W)} wide:", 10, "middle", 500, MUTED))
    o.append(t(X(g.ALC_W + g.BREAST_W / 2), Y(g.CEIL) + 28, "the table is by the stairs", 10, "middle", 400, MUTED))
    o.append(t(X(g.ALC_W / 2), Y(g.CEIL) - 6, f"alcove {_fmt(g.ALC_W)} wide, {_fmt(g.ALC_D)} deep, ceiling {_fmt(g.CEIL)}", 10.5, "middle", 500, MUTED))
    o.append(f'<line x1="{X(-25)}" y1="{oy}" x2="{X(312)}" y2="{oy}" stroke="#b9b4a8" stroke-width="1.4"/>')
    # height scale
    hx = g.BREAST_X[1] + 3
    o.append(f'<line x1="{X(hx)}" y1="{Y(0)}" x2="{X(hx)}" y2="{Y(g.CEIL)}" stroke="#cfcabf"/>')
    for h, lab, dy in [(0, "0", 4), (9, "9 plinth", 6), (76, "76 worktop · table down", 0), (116.55, "116.5 TV centre", 4),
                       (130, "130 lid · 134 Series X shelf", 4), (153.3, "153.3 table up · 155.4 ledges", 4), (196, "196 high shelf", 4), (235, "235", 4)]:
        o.append(f'<line x1="{X(hx)-3}" y1="{Y(h)}" x2="{X(hx)+3}" y2="{Y(h)}" stroke="#9a958b"/>')
        o.append(t(X(hx) + 6, Y(h) + dy, lab, 9.5, "start", 400, MUTED))
    # high shelf, books, box, print, the 7-inch, Deco B
    o.append(rect(X(0), Y(g.HIGH_TOP), g.ALC_W * s, g.HIGH_T * s, "#e9dccb", "#c9b79f", 1))
    bk0 = g.UP_L[1] + 1.5 if g.MW_SWAP else 6.0
    bx0 = g.UP_L[1] + 65.0 if g.MW_SWAP else 70.0
    o.append(rect(X(bk0), Y(g.HIGH_TOP + 28), 56 * s, 28 * s, "#ecebe7", LINE, 2))
    o.append(t(X(bk0 + 28), Y(g.HIGH_TOP + 12), "books, up to 30 tall", 9.5, "middle", 400, MUTED))
    o.append(rect(X(bx0), Y(g.HIGH_TOP + 22.5), 30 * s, 22.5 * s, "#ecebe7", LINE, 2))
    o.append(t(X(bx0 + 15), Y(g.HIGH_TOP + 9), "box", 9.5, "middle", 400, MUTED))
    o.append(rect(X(g.RZ[0] + 2.5), Y(g.HIGH_TOP + 21.3), 21.3 * s, 21.3 * s, VIN_F, VIN_S, 1))
    o.append(t(X(g.RZ[0] + 13.2), Y(g.HIGH_TOP + 9), "7-inch", 8.5, "middle", 500, VIN_S))
    dx = (g.UP_R[0] if g.MW_SWAP else g.ALC_W) - 15
    o.append(rect(X(dx), Y(g.HIGH_TOP + 11.4), 11 * s, 11.4 * s, "#fff", LINE, 8))
    o.append(t(X(dx + 5.5), Y(g.HIGH_TOP + 16), "Deco B", 9.5, "middle", 600))
    o.append(wire([(X(g.ALC_W - 2), Y(g.CEIL)), (X(g.ALC_W - 2), Y(g.HIGH_TOP + 15)), (X(dx + 9), Y(g.HIGH_TOP + 9))], BLUE, 1.6))
    # uprights, ledge, Series X shelf
    for (a, b) in (g.UP_L, g.UP_R):
        o.append(f'<rect x="{X(a)}" y="{Y(g.CEIL)}" width="{g.UP_T*s}" height="{(g.CEIL-g.WORKTOP)*s}" fill="#e9d3b4" stroke="#b88a55"/>')
    o.append(rect(X(g.UP_L[1]), Y(g.LEDGE_TOP), g.TV_GAP * s, (g.LEDGE_TOP - g.LEDGE_UNDER) * s, "#e9dccb", "#b88a55", 1))
    for i in range(4):
        o.append(f'<rect x="{X(g.UP_L[1] + 0.45 + i * g.LP)}" y="{Y(g.LEDGE_LP_TOP)}" width="{g.LP*s}" height="{31.1*s}" fill="{VIN_F}" stroke="{VIN_S}" stroke-opacity="0.6"/>')
    o.append(t(X(g.TV_CX), Y(172), f"record ledge, top {_fmt(g.LEDGE_TOP)} · 4 LPs face-out", 9.5, "middle", 500, VIN_S))
    o.append(rect(X(g.RZ[0]), Y(g.RZ_SHELF_TOP), g.RZ_W * s, g.RZ_SHELF_T * s, "#e9dccb", "#c9b79f", 1))
    fx = g.FAN_STAND[0]
    o.append(rect(X(g.SX_X[0]), Y(g.RZ_SHELF_TOP + 6.5), fx * s, 6.5 * s, GAME_F, GAME_S, 2))
    cx0 = g.SX_X[0] + (fx - 15.1) / 2
    o.append(rect(X(cx0), Y(g.SX_TOP), 15.1 * s, 30.1 * s, GAME_F, GAME_S, 3))
    o.append(t(X(g.SX_X[0] + fx / 2), Y(156), "Series X", 9.5, "middle", 650))
    o.append(t(X(g.SX_X[0] + fx / 2), Y(156) + 11, "fan stand", 8.5, "middle", 400, MUTED))
    o.append(t(X(g.RZ[0] + 2), Y(g.SX_TOP + 6), f"{_fmt(g.HIGH_UNDER - g.SX_TOP)} clear above", 8, "start", 400, MUTED))
    o.append(rect(X(g.RZ[0] + 4), Y(g.RZ_SHELF_TOP - g.RZ_SHELF_T), g.PREAMP[0] * s, g.PREAMP[1] * s, VIN_F, VIN_S, 1, 1, 'stroke-dasharray="3 2"'))
    o.append(t(X(g.RZ[0] + 16), Y(g.RZ_SHELF_TOP - 6.8), "preamp under", 8, "start", 500, VIN_S))
    # TV
    o.append(rect(X(g.TV_X[0]), Y(g.TV_TOP), g.TV_W * s, g.TV_H * s, "#ebeae6", "#c9c5bb", 4))
    o.append(t(X(g.TV_CX), Y(122), "LG OLED C6 55 in", 12.5, "middle", 650))
    o.append(t(X(g.TV_CX), Y(122) + 15, f"{_fmt(g.TV_W)} × {_fmt(g.TV_H)} · centre 116.5 · {_fmt(g.TV_CX)} from the side wall", 10, "middle", 400, MUTED))
    o.append(t(X(g.TV_CX), Y(122) + 29, (f"{_fmt(-g.TV_SHIFT)} cm off the alcove's centre: in line with the sofa" if g.MW_SWAP else f"{_fmt(g.TV_SHIFT)} cm off the alcove's centre, towards the side wall"), 10, "middle", 600, BLUE))
    o.append(rect(X(g.TV_CX - 23.5), Y(g.WORKTOP + 1.6), 47 * s, 1.6 * s, "#d8d5ce", "#bdb8ad", 1))
    # soundbar, turntable and its lid, 10-gang
    o.append(rect(X(g.TV_CX - 46), Y(g.WORKTOP + 6), 92 * s, 6 * s, SND_F, SND_S, 2))
    o.append(rect(X(g.DECK_X[0]), Y(g.WORKTOP + g.DECK[1]), g.DECK[0] * s, g.DECK[1] * s, VIN_F, VIN_S, 3))
    o.append(t(X(g.DECK_X[0] + g.DECK[0] / 2), Y(g.WORKTOP + 5), "Turntable", 9.5, "middle", 600))
    o.append(f'<rect x="{X(g.DECK_X[0])}" y="{Y(g.LID_CLEAR_TO)}" width="{g.DECK[0]*s}" height="{(g.LID_CLEAR_TO-g.WORKTOP-g.DECK[1])*s}" fill="none" stroke="#b9b4a8" stroke-dasharray="4 3"/>')
    o.append(t(X(g.DECK_X[0] + g.DECK[0] / 2), Y(112), "lid opens", 9, "middle", 400, MUTED))
    o.append(t(X(g.DECK_X[0] + g.DECK[0] / 2), Y(112) + 11, "into here", 9, "middle", 400, MUTED))
    o.append(f'<rect x="{X(g.ALC_W - 66 if g.MW_SWAP else 10)}" y="{Y(80.5)}" width="{56*s}" height="{4.5*s}" fill="none" stroke="{VIN_S}" stroke-dasharray="4 3"/>')
    # worktop
    o.append(rect(X(0), Y(g.WORKTOP), g.ALC_W * s, 3 * s, "#e9dccb", "#c9b79f", 1))
    def cell(x1, x2, y1, y2, label, sub, kind):
        f, st = {"g": (GAME_F, GAME_S), "v": (VIN_F, VIN_S), "s": (SND_F, SND_S), "n": ("#f6f5f2", "#bdb8ad")}[kind]
        o.append(f'<rect x="{X(x1)}" y="{Y(y2)}" width="{(x2-x1)*s}" height="{(y2-y1)*s}" fill="{f}" stroke="{st}" stroke-opacity="0.55" stroke-width="1"/>')
        cy = (Y(y2) + Y(y1)) / 2
        o.append(t((X(x1) + X(x2)) / 2, cy - 1, label, 10, "middle", 600))
        if sub:
            o.append(t((X(x1) + X(x2)) / 2, cy + 11, sub, 8.5, "middle", 400, MUTED))
    P_ = g.PLINTH
    (b1a, b1b), (b2a, b2b), (b3a, b3b) = g.BAYS
    pl0, pl1 = min(b1a, b2a) - g.FILLER, max(b1b, b2b) + (g.FILLER if g.MW_SWAP else 0)   # v38: the plinth under bays 1 and 2
    o.append(f'<rect x="{X(pl0)}" y="{Y(P_)}" width="{(pl1 - pl0)*s}" height="{P_*s}" fill="#efece6" stroke="#bdb8ad"/>')
    pxa, pxb = g.PLINTH_DRAWER["x"]
    o.append(rect(X(pxa), Y(g.PLINTH_DRAWER["y"][1]), (pxb - pxa) * s, 6 * s, "#f6f5f2", "#9a958b", 1, 1, 'stroke-dasharray="3 2"'))
    o.append(t(X((pxa + pxb) / 2), Y(1.2), "hidden drawer", 8, "middle", 500, MUTED))
    i1, i2 = b1a + 1.6, b1b - 1.6
    inw = g.SUB_IN_WALL
    cell(i1, i2, P_ + 46.4, P_ + 62.4, "Xbox One + HDMI switch" if inw else "Xbox One + brick", "16 row · brick at the back" if inw else "16 row", "g")
    cell(i1, i2, P_ + 28.6, P_ + 44.6, "Xbox 360 + RetroTINK" if inw else "Xbox 360 + brick", "16 row · brick at the back" if inw else "16 row", "g")
    cell(i1, i2, P_ + 1.6, P_ + 26.8, "Game drawer", "~48 games", "g")
    i1, i2 = b2a + 1.6, b2b - 1.6
    cell(i1, i2, P_ + 38.7, P_ + 62.4, "PS3 + controllers", "23.7 row", "g")
    if inw:   # v13.5: the sub's column on the left, the PS2 over the PS1 on the right
        cell(g.SUB_COL[0], g.SUB_COL[1], g.SUB_COL_FLOOR, g.SUB_COL_TOP, "", "", "s")
        o.append(rect(X(g.SUB_IN["x"][0]), Y(g.SUB_IN["y"][1]), g.SUB[0] * s, g.SUB[1] * s, SND_F, SND_S, 2))
        o.append(f'<circle cx="{X((g.SUB_IN["x"][0] + g.SUB_IN["x"][1]) / 2):.1f}" cy="{Y((g.SUB_IN["y"][0] + g.SUB_IN["y"][1]) / 2):.1f}" r="{8.25 * s:.1f}" fill="none" stroke="{SND_S}" stroke-width="1.2"/>')
        o.append(t(X((g.SUB_COL[0] + g.SUB_COL[1]) / 2), Y(g.SUB_IN["y"][1]) + 11, "sub", 10, "middle", 650, SND_S))
        o.append(t(X((g.SUB_COL[0] + g.SUB_COL[1]) / 2), Y(g.SUB_COL_FLOOR) - 3, "3 cm riser", 8, "middle", 400, MUTED))
        cell(g.PS_COL[0], g.PS_COL[1], P_ + 20.4, P_ + 36.9, "PS2", "16.5 row", "g")
        cell(g.PS_COL[0], g.PS_COL[1], P_ + 1.6, P_ + 18.6, "PS1", "17 row", "g")
    else:
        cell(i1, i2, P_ + 20.4, P_ + 36.9, "PS2 + HDMI switch", "16.5 row", "g")
        cell(i1, i2, P_ + 1.6, P_ + 18.6, "PS1 + RetroTINK", "17 row", "g")
    # v16: bay 3 split: the slim column (two game drawers, the pads drawer) and the LP column under the turntable
    i1, i2 = g.REC_BOX_X[0] - g.RUN, b3b - 1.8
    cell(i1, i2, g.TRAY_UPPER[0], g.TRAY_TOP_PANEL, "LP crate", f"~{g.TRAY_LPS} face-out", "v")
    cell(i1, i2, 1.8, g.TRAY_UPPER[0] - 2, "LP crate", f"~{g.TRAY_LPS} face-out", "v")
    j1, j2 = b3a + 1.8, g.B3_DIV[0]
    for k_, d_ in enumerate(g.SLIM_DRAWERS):
        top_ = g.SLIM_DRAWERS[k_ + 1]["yb"] - 0.6 if k_ + 1 < len(g.SLIM_DRAWERS) else g.TRAY_TOP_PANEL
        cell(j1, j2, d_["yb"], top_, "pads" if d_["kind"] == "pads" else "games", "" if d_["kind"] == "pads" else f"~{d_['n']}", "g")
    o.append(f'<rect x="{X(g.B3_DIV[0])}" y="{Y(71.2)}" width="{(g.B3_DIV[1] - g.B3_DIV[0])*s}" height="{69.4*s}" fill="#e7d6b8" stroke="#c9a77a" stroke-width="0.6"/>')
    for a in (b1a, b2a):
        o.append(f'<rect x="{X(a)}" y="{Y(73)}" width="{60*s}" height="{64*s}" fill="none" stroke="#8f8a80" stroke-width="1.3"/>')
    o.append(f'<rect x="{X(b3a)}" y="{Y(73)}" width="{60*s}" height="{73*s}" fill="none" stroke="#8f8a80" stroke-width="1.3"/>')
    for a, b, lab in [(b1a, b1b, "60 · BESTÅ"), (b2a, b2b, "60 · BESTÅ"), (b3a, b3b, "60 · ply: games | LPs")]:
        o.append(t((X(a) + X(b)) / 2, oy + 16, lab, 9.5, "middle", 400, MUTED))
    # v16: the table is by the stairs (the default), so the breast takes the "now playing" ledge under the two framed LPs; option A's
    # folded flip-top is dashed where it would go
    x0, x1 = g.TABLE_X
    o.append(f'<rect x="{X(x0)}" y="{Y(g.FOLDED_TOP)}" width="{g.TABLE[0]*s}" height="{(g.FOLDED_TOP - g.WORKTOP + 4)*s}" fill="none" stroke="{BLUE}" stroke-dasharray="5 3"/>')
    o.append(t(X(g.TABLE_CX), Y(g.FOLDED_TOP) + 13, "option A: the flip-top folds here", 8.5, "middle", 600, BLUE))
    L = g.NOW_LEDGE
    o.append(rect(X(L["x"][0]), Y(L["top"]), (L["x"][1] - L["x"][0]) * s, L["t"] * s, "#e9dccb", "#b88a55", 0, 1.2))
    gap = (L["x"][1] - L["x"][0] - L["n"] * g.LP) / (L["n"] + 1)
    for i in range(L["n"]):
        xa = L["x"][0] + gap + i * (g.LP + gap)
        o.append(rect(X(xa), Y(L["top"] + g.LP), g.LP * s, g.LP * s, VIN_F, VIN_S, 1))
    o.append(t(X((L["x"][0] + L["x"][1]) / 2), Y(L["top"]) + 13, f"“now playing” oak ledge, top {_fmt(L['top'])}", 9, "middle", 600, VIN_S))
    cxc = g.TABLE_CX
    for i in range(2):
        x0_ = cxc - 4 - 34 + i * 42
        o.append(rect(X(x0_), Y(g.FRAMES_Y + 34), 34 * s, 34 * s, "#fff", "#8f8a80", 1))
    o.append(t(X(cxc), Y(g.FRAMES_Y + 40), "framed LPs", 9.5, "middle", 400, MUTED))
    # the socket on the side wall (shown just outside the alcove)
    o.append(f'<rect x="{X(-6)}" y="{Y(34.3)}" width="{3.5*s}" height="{8.6*s}" rx="1" fill="#fff" stroke="#d0573b" stroke-width="1.3"/>')
    o.append(t(X(-8), Y(42), "double socket", 8.5, "end", 600, "#d0573b"))
    o.append(t(X(-8), Y(42) + 10, "on the side wall", 8.5, "end", 600, "#d0573b"))
    ly = H - 12
    for i, (lab, f, st) in enumerate([("Gaming", GAME_F, GAME_S), ("Vinyl", VIN_F, VIN_S), ("Sound", SND_F, SND_S)]):
        o.append(rect(i * 100, ly - 11, 14, 14, f, st, 3)); o.append(t(i * 100 + 20, ly + 1, lab, 11, "start", 400, MUTED))
    o.append(f'<line x1="300" y1="{ly-4}" x2="326" y2="{ly-4}" stroke="#b9b4a8" stroke-dasharray="4 3"/>')
    o.append(t(332, ly + 1, "keep clear / hidden / other position", 11, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "The media wall and the chimney breast from the front, to scale",
               ("The TV in line with the sofa, the turntable, Series X and records on the left, the consoles and games under the TV. Heights in cm" if g.MW_SWAP else
                "The TV between oak uprights nearer the side wall, the turntable zone on its right, three bays below (bay 3: games beside the LP crates); the “now playing” ledge on the breast. Heights in cm"))


# ------------------------------------------------------------------ room plans (north, the window, at the top; east on the right)
def _room(o, k, ox, oy, xmin=0.0, label_walls=True, table=True):
    """Draw the measured room outline and return X(x), Y(z): x in cm from the east wall, z in render coordinates."""
    g = G
    X = lambda x: ox + (g.ROOM_W - x) * k
    Y = lambda z: oy + (z - g.WINDOW_Z) * k
    sx0, sx1 = g.STAIR_X
    sd = g.ALC_D - g.STAIR_D
    pts_ = [(0, g.WINDOW_Z), (g.ROOM_W, g.WINDOW_Z), (g.ROOM_W, sd), (sx0, sd), (sx0, g.BREAST_D_WEST), (g.BREAST_X[1], g.BREAST_D_WEST),
            (g.BREAST_X[1], 0), (g.ALC_W, 0), (g.ALC_W, g.ALC_D), (0, g.ALC_D)]
    o.append('<defs><pattern id="brick3" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#d9a48a"/>'
             '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#b5785e" stroke-width="0.8"/></pattern>'
             '<pattern id="hatch3" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#c9c3b5" stroke-width="2"/></pattern></defs>')
    o.append('<polygon points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + f'" fill="#fbfaf6" stroke="{WALL}" stroke-width="3"/>')
    o.append(f'<rect x="{X(g.BREAST_X[1]):.1f}" y="{Y(0):.1f}" width="{g.BREAST_W*k:.1f}" height="{g.ALC_D*k:.1f}" fill="url(#brick3)" stroke="{WALL}" stroke-width="2"/>')
    o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(sd):.1f}" width="{(g.ROOM_W - sx0)*k:.1f}" height="{(g.ALC_D - sd)*k:.1f}" fill="#efebe2" stroke="#9a958b"/>')
    # v13: the stairs go UP to the first floor: treads, and an arrow up the flight (drawn rising away from the room; to confirm)
    zz = sd + 6
    while zz < g.ALC_D:
        o.append(f'<line x1="{X(g.ROOM_W):.1f}" y1="{Y(zz):.1f}" x2="{X(sx0):.1f}" y2="{Y(zz):.1f}" stroke="#b9b4a8" stroke-width="1"/>')
        zz += g.STAIR_GOING
    ax = X((sx0 + g.ROOM_W) / 2)
    o.append(f'<line x1="{ax:.1f}" y1="{Y(sd + 4):.1f}" x2="{ax:.1f}" y2="{Y(g.ALC_D - 3):.1f}" stroke="{INK}" stroke-width="1.6"/>')
    o.append(f'<path d="M{ax - 4:.1f},{Y(g.ALC_D - 9):.1f} L{ax:.1f},{Y(g.ALC_D - 2):.1f} L{ax + 4:.1f},{Y(g.ALC_D - 9):.1f}" fill="none" stroke="{INK}" stroke-width="1.6"/>')
    o.append(t(ax + 6, Y(sd + 14), "UP", 9, "start", 700))
    # window and radiator
    o.append(f'<rect x="{X(g.WINDOW_X[1]):.1f}" y="{Y(g.WINDOW_Z) - 4:.1f}" width="{(g.WINDOW_X[1]-g.WINDOW_X[0])*k:.1f}" height="8" fill="#cfe3f2" stroke="#7aa6c8"/>')
    o.append(f'<rect x="{X(g.RADIATOR_X[1]):.1f}" y="{Y(g.WINDOW_Z) + 5:.1f}" width="{(g.RADIATOR_X[1]-g.RADIATOR_X[0])*k:.1f}" height="6" fill="#eceae4" stroke="#b9b4a8"/>')
    # door, swinging into the room, hinged on the breast side (client confirmed)
    hx = g.DOOR_X[0]
    r = g.DOOR_SWING
    o.append(f'<path d="M{X(hx + r):.1f},{Y(g.BREAST_D_WEST):.1f} A{r*k:.1f},{r*k:.1f} 0 0 1 {X(hx):.1f},{Y(g.BREAST_D_WEST - r):.1f}" fill="none" stroke="#9a958b" stroke-dasharray="3 2"/>')
    o.append(f'<line x1="{X(hx):.1f}" y1="{Y(g.BREAST_D_WEST):.1f}" x2="{X(hx):.1f}" y2="{Y(g.BREAST_D_WEST - r):.1f}" stroke="#9a958b" stroke-width="1.5"/>')
    # media wall base and TV
    o.append(f'<rect x="{X(g.ALC_W):.1f}" y="{Y(g.BASE_FRONT_Z):.1f}" width="{g.ALC_W*k:.1f}" height="{g.BASE_D*k:.1f}" fill="#e9d3b4" stroke="#b88a55" stroke-width="1.2"/>')
    for (a, b) in (g.UP_L, g.UP_R):
        o.append(f'<rect x="{X(b):.1f}" y="{Y(g.ALC_D - g.UP_D):.1f}" width="{g.UP_T*k:.1f}" height="{g.UP_D*k:.1f}" fill="#b88a55"/>')
    o.append(f'<rect x="{X(g.TV_X[1]):.1f}" y="{Y(g.TV_PANEL_Z[0]):.1f}" width="{g.TV_W*k:.1f}" height="{max(g.TV_D*k, 2):.1f}" fill="#222"/>')
    o.append(f'<rect x="{X(g.DECK_X[1]):.1f}" y="{Y(g.DECK_Z[0]):.1f}" width="{g.DECK[0]*k:.1f}" height="{g.DECK[2]*k:.1f}" fill="{VIN_F}" stroke="{VIN_S}"/>')
    # v16: the pipe boxing in the window's west corner (hollow, floor to ceiling)
    pb = g.PIPE_BOX
    o.append(f'<rect x="{X(pb["x"][1]):.1f}" y="{Y(pb["z"][0]):.1f}" width="{(pb["x"][1] - pb["x"][0])*k:.1f}" height="{(pb["z"][1] - pb["z"][0])*k:.1f}" fill="url(#hatch3)" stroke="{WALL}" stroke-width="2"/>')
    # the table packed away: v29, the dining cabinet under the shelf by the stairs (the plan); the breast's "now playing" ledge
    if not table:
        pass
    elif g.DINING_SITE == "stairs":
        C = g.OPTC
        o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(C["z"][1]):.1f}" width="{C["d"]*k:.1f}" height="{(C["z"][0] - C["z"][1])*k:.1f}" fill="#e9d3b4" stroke="#9c6a3f"/>')
        L = g.NOW_LEDGE
        o.append(f'<rect x="{X(L["x"][1]):.1f}" y="{Y(-L["d"]):.1f}" width="{(L["x"][1] - L["x"][0])*k:.1f}" height="{L["d"]*k:.1f}" fill="#e9d3b4" stroke="#b88a55"/>')
    else:
        x0, x1 = g.TABLE_X
        o.append(f'<rect x="{X(x1):.1f}" y="{Y(-g.FOLDED_D):.1f}" width="{g.TABLE[0]*k:.1f}" height="{g.FOLDED_D*k:.1f}" fill="#d9b48a" stroke="#9c6a3f"/>')
    return X, Y


def _side_wall(o, X, Y, k):
    """The wrap ledge and the PC shelf on the side wall: above the sofa, so drawn after it."""
    g = G
    o.append(f'<rect x="{X(g.WRAP_D):.1f}" y="{Y(g.WRAP_Z[1]):.1f}" width="{g.WRAP_D*k:.1f}" height="{(g.WRAP_Z[0]-g.WRAP_Z[1])*k:.1f}" fill="#e9d3b4" stroke="#b88a55"/>')
    o.append(f'<rect x="{X(g.PC_SHELF_D):.1f}" y="{Y(g.PC_SHELF_Z[1]):.1f}" width="{g.PC_SHELF_D*k:.1f}" height="{(g.PC_SHELF_Z[0]-g.PC_SHELF_Z[1])*k:.1f}" fill="#e9d3b4" stroke="#b88a55" fill-opacity="0.9"/>')
    o.append(f'<rect x="{X(2.5 + g.PC_CASE[0]):.1f}" y="{Y(g.PC_Z[1]):.1f}" width="{g.PC_CASE[0]*k:.1f}" height="{g.PC_CASE[2]*k:.1f}" fill="{GAME_F}" stroke="{GAME_S}"/>')


def _sofa(o, X, Y, k, label=True):
    g = G
    x0, x1 = g.SOFA_X
    zb, zf = g.SOFA_BACK_Z, g.SOFA_FRONT_Z
    cx1, ze = g.CHAISE_X[1], g.CHAISE_END_Z
    pts_ = [(x0, zb), (x1, zb), (x1, zf), (cx1, zf), (cx1, ze), (x0, ze)]
    o.append('<polygon points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + '" fill="#ecebe6" stroke="#b9b4a8" stroke-width="1.4" stroke-linejoin="round"/>')
    back = [(x0, zb), (x1, zb), (x1, zb + 22), (x0 + 22, zb + 22), (x0 + 22, ze), (x0, ze)]
    o.append('<polygon points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in back) + '" fill="#dfddd6" stroke="none"/>')
    if label:
        o.append(t((X(cx1) + X(x1)) / 2, Y((zb + zf) / 2) + 4, f"L-sofa, about {_fmt(g.SOFA_W)} × {_fmt(g.SOFA_D)} (blue cord)", 9.5, "middle", 650))


def living_plan():
    """The living room from above, to scale, from the measured sketch. North (the window) at the top, east on the right."""
    W, H = 860, 610
    k = 1.2
    g = G
    o = []
    X, Y = _room(o, k, 150, 64)
    _sofa(o, X, Y, k)
    _side_wall(o, X, Y, k)

    # v29: the dining cabinet is the plan: its table's open outline; the breast keeps the "now playing" ledge
    C = g.OPTC
    bx0, bx1 = C["tx"]
    z0, z1 = C["tz"]
    o.append(f'<rect x="{X(bx1):.1f}" y="{Y(z1):.1f}" width="{(bx1 - bx0)*k:.1f}" height="{(z0 - z1)*k:.1f}" fill="none" stroke="#9c6a3f" stroke-dasharray="5 3"/>')
    o.append(t(X((bx0 + bx1) / 2), Y((z0 + z1) / 2) + 3, f"the cabinet's table open, {_fmt(C['len'])} × {_fmt(C['top'][0])}", 8.5, "middle", 500, "#9c6a3f"))
    o.append(t(X(g.ROOM_W) - C["d"] * k / 2, Y(C["z"][1]) - 6, "dining cabinet", 8.5, "middle", 650, "#7a5130"))
    o.append(t(X(g.ROOM_W) + 30, Y(sum(g.SHELF_B["z"]) / 2) - 50, "your shelf above", 8.5, "middle", 500, MUTED))
    pb = g.PIPE_BOX
    o.append(t(X(pb["x"][0]) - 4, Y(pb["z"][1]) + 12, "pipe boxing", 8.5, "end", 600, MUTED))
    mwx = (g.BAYS[0][0] + g.BAYS[0][1]) / 2 if g.MW_SWAP else g.ALC_W / 2      # v38: clear of the sub
    o.append(t(X(mwx), Y(g.BASE_FRONT_Z) + 22, "media wall, 46 deep", 9, "middle", 650, "#7a5130"))
    o.append(t(X(mwx), Y(g.BASE_FRONT_Z) + 34, ("TV in line with the sofa · deck left" if g.MW_SWAP else "TV 25 cm nearer the side wall · deck right"), 8.5, "middle", 400, "#7a5130"))
    o.append(t(X(g.TABLE_CX), Y(0) + 26, "breast · “now playing” ledge", 9.5, "middle", 650, "#8f5b45"))
    o.append(t(X(g.ROOM_W - 30), Y(g.ALC_D - g.STAIR_D) - 6, "stairs UP to the first floor: a post and two slats", 9, "middle", 400, MUTED))
    o.append(t(X(g.DOOR_X[0] + 42), Y(g.BREAST_D_WEST) - 6, "door opens in · hinge by the breast", 9, "middle", 600, "#d0573b"))
    # side-wall labels
    o.append(t(X(0) + 10, Y((g.WRAP_Z[0] + g.WRAP_Z[1]) / 2) + 4, "one oak run: 4 LPs, then", 9, "start", 600, "#7a5130"))
    o.append(t(X(0) + 10, Y((g.PC_SHELF_Z[0] + g.PC_SHELF_Z[1]) / 2) + 4, "the PC at 155.4, over the sofa's open end", 9, "start", 600, GAME_S))
    # coffee table, sub, rears
    cx, cz = g.COFFEE["x"], g.COFFEE["z"]
    o.append(rect(X(cx[1]), Y(cz[0]), (cx[1] - cx[0]) * k, (cz[1] - cz[0]) * k, "#f3efe6", "#c9c5bb", 6))
    o.append(t(X((cx[0] + cx[1]) / 2), Y((cz[0] + cz[1]) / 2) + 3, "coffee table", 8.5, "middle", 400, MUTED))
    px_, pz_ = g.SOFA_POUF["x"], g.SOFA_POUF["z"]       # v23: the sofa's ottoman
    o.append(rect(X(px_[1]), Y(pz_[0]), (px_[1] - px_[0]) * k, (pz_[1] - pz_[0]) * k, "#c9d3e6", "#34507f", 6))
    o.append(t(X((px_[0] + px_[1]) / 2), Y((pz_[0] + pz_[1]) / 2) + 3, "your ottoman", 8.5, "middle", 600, "#34507f"))
    sx, sz = g.SUB_POS["x"], g.SUB_POS["z"]
    o.append(rect(X(sx[1]), Y(sz[0]), (sx[1] - sx[0]) * k, (sz[1] - sz[0]) * k, SND_F, SND_S, 3))
    o.append(t(X(sx[1]) - 5, Y(sz[0]) - 4, "sub", 9, "end", 600, SND_S))
    if not g.SUB_IN_WALL:
        bxx_, bzz_ = (g.SUB_HOOD if g.PLAIN else g.SUB_BOX)["x"], (g.SUB_HOOD if g.PLAIN else g.SUB_BOX)["z"]
        o.append(rect(X(bxx_[1]), Y(bzz_[0]), (bxx_[1] - bxx_[0]) * k, (bzz_[1] - bzz_[0]) * k, "none", "#b88a55", 1, 1.4, 'stroke-dasharray="3 2"'))
    o.append(rect(X(16), Y(-280), 14 * k, 15 * k, SND_F, SND_S, 3))
    o.append(rect(X(g.SOFA_X[1] + 14), Y(-296), 15 * k, 14 * k, SND_F, SND_S, 3))
    o.append(t(X(g.SOFA_X[1] + 7), Y(-296) - 4, "rear", 8, "middle", 400, MUTED))
    o.append(t(X(0) + 10, Y(-272) + 4, "rear, on the wall", 8, "start", 400, MUTED))
    # sockets
    o.append(rect(X(0) - 7, Y(g.SOCKET["z"]) - 8, 7, 16, "#fff", "#d0573b", 1))
    o.append(t(X(0) + 10, Y(g.SOCKET["z"]) + 4, "double socket", 9, "start", 600, "#d0573b"))
    z2 = g.SOCKET2["z"]                    # v23: the client's sockets, as they are
    o.append(rect(X(0) - 7, Y(z2) - 8, 7, 16, "#fff", "#d0573b", 1))
    o.append(t(X(0) + 10, Y(z2) - 4, "double socket behind the sofa:", 8.5, "start", 600, "#d0573b"))
    o.append(t(X(0) + 10, Y(z2) + 7, "the rear speakers", 8.5, "start", 400, "#d0573b"))
    x3 = g.SOCKET3["x"]
    o.append(rect(X(x3) - 8, Y(g.WINDOW_Z), 16, 7, "#fff", "#d0573b", 1))
    o.append(t(X(x3), Y(g.WINDOW_Z) - 8, "double socket: lamp, grow lights", 8.5, "middle", 600, "#d0573b"))
    # the two spot bars
    for (bx, bz, heads, lab) in [(g.PEND_X, g.PEND_Z, bar_heads(1), "bar 1, existing rose"), (g.BAR2_X, g.BAR2_Z, bar_heads(2), "bar 2, existing point")]:
        rx_, ry_ = X(bx), Y(bz)
        o.append(_bar_rect(X, Y, bx, bz, 4))
        for dx, col, (tx_, tz_) in heads:
            hxz = g.bar_head_xz(bx, bz, dx)
            hx_, hy_ = X(hxz[0]), Y(hxz[1])
            tx, ty = X(tx_), Y(tz_)
            ln = max(((tx - hx_) ** 2 + (ty - hy_) ** 2) ** 0.5, 1)
            ex, ey = hx_ + (tx - hx_) / ln * min(48, ln), hy_ + (ty - hy_) / ln * min(48, ln)
            o.append(f'<circle cx="{hx_:.1f}" cy="{hy_:.1f}" r="5" fill="{col}" stroke="#555" stroke-width="0.6"/>')
            o.append(arrow(hx_, hy_, ex, ey, col, 1.4))
        o.append(t(rx_, min(Y(bz - 42), Y(bz + 42)) - 8 if g.BAR_AXIS == "z" else ry_ - 10, lab, 9, "middle", 600, "#8a6a1a"))
    # LED strip round the ceiling (dotted)
    sd = g.ALC_D - g.STAIR_D
    pts_ = [(0, g.WINDOW_Z), (g.ROOM_W, g.WINDOW_Z), (g.ROOM_W, sd), (g.STAIR_X[0], sd), (g.STAIR_X[0], g.BREAST_D_WEST), (g.BREAST_X[1], g.BREAST_D_WEST),
            (g.BREAST_X[1], 0), (g.ALC_W, 0), (g.ALC_W, g.ALC_D), (0, g.ALC_D)]
    o.append('<polygon points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + '" fill="none" stroke="#e0a43a" stroke-width="1.4" stroke-dasharray="1 4" stroke-linecap="round"/>')
    # viewing lines: from the middle of the sofa and from the end of the chaise
    tvx, tvz = X(g.TV_CX), Y(g.TV_PANEL_Z[0])
    sm = ((g.SOFA_X[0] + g.SOFA_X[1]) / 2 + 40, g.WINDOW_Z + g.EYES_FROM_WINDOW)
    o.append(f'<line x1="{X(sm[0]):.1f}" y1="{Y(sm[1]):.1f}" x2="{tvx:.1f}" y2="{tvz:.1f}" stroke="{BLUE}" stroke-width="1.4" stroke-dasharray="5 3"/>')
    o.append(f'<line x1="{X(50):.1f}" y1="{Y(g.CHAISE_EYES_Z):.1f}" x2="{tvx:.1f}" y2="{tvz:.1f}" stroke="{BLUE}" stroke-width="1.4" stroke-dasharray="5 3"/>')
    o.append(t(X(sm[0]) + 8, Y(sm[1]) - 34, f"eyes to screen about {g.VIEW_DIST/100:.2f} m", 9.5, "start", 650, BLUE))
    o.append(t(X(97) - 8, Y(-70), f"from the end of the sofa's return, {g.TV_PANEL_Z[0] - g.CHAISE_EYES_Z:.0f} cm" + ("" if g.MW_SWAP else ", square on"), 9, "end", 600, BLUE))
    # dimensions
    def hdim(e1, e2, n, lab, below=True):
        o.append(f'<line x1="{X(e1):.1f}" y1="{n:.1f}" x2="{X(e2):.1f}" y2="{n:.1f}" stroke="{MUTED}"/>')
        for e_ in (e1, e2):
            o.append(f'<line x1="{X(e_):.1f}" y1="{n-4:.1f}" x2="{X(e_):.1f}" y2="{n+4:.1f}" stroke="{MUTED}"/>')
        o.append(t((X(e1) + X(e2)) / 2, n + (13 if below else -5), lab, 9.5, "middle", 400, MUTED))
    hdim(0, g.ROOM_W, Y(g.ALC_D) + 44, f"{_fmt(g.ROOM_W*10)} mm, east to west")
    hdim(0, g.ALC_W, Y(g.ALC_D) + 22, f"alcove {_fmt(g.ALC_W*10)}")
    hdim(g.ALC_W, g.BREAST_X[1], Y(g.ALC_D) + 22, f"breast {_fmt(g.BREAST_W*10)}")
    hdim(g.BREAST_X[1], g.STAIR_X[0], Y(g.ALC_D) + 22, "about 1045 (to confirm)")
    o.append(f'<line x1="{X(g.ROOM_W) - 30:.1f}" y1="{Y(g.WINDOW_Z):.1f}" x2="{X(g.ROOM_W) - 30:.1f}" y2="{Y(g.ALC_D):.1f}" stroke="{MUTED}"/>')
    o.append(t(X(g.ROOM_W) - 36, Y(-150), f"{_fmt(g.ROOM_D*10)} mm", 9.5, "end", 400, MUTED))
    o.append(t(X(g.ROOM_W) - 36, Y(-150) + 12, "window to alcove back", 9, "end", 400, MUTED))
    o.append(t(X((g.WINDOW_X[0] + g.WINDOW_X[1]) / 2), Y(g.WINDOW_Z) - 10, f"window {_fmt(g.WINDOW_X[1]-g.WINDOW_X[0])} · radiator below", 9.5, "middle", 400, MUTED))
    o.append(t(150, H - 10, f"Ceiling {_fmt(g.CEIL*10)} mm. Sofa from your notes (long side to 40 cm short of the window's end; return {_fmt(g.SOFA_D)} assumed). Both spot bars run from the TV towards the window.", 9, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "The living room from above, as you measured it",
               "To scale, north at the top. Media wall in the alcove, one oak run on the side wall over the sofa, the dining cabinet under your shelf by the stairs, two spot bars")


def seating():
    """The dining table for four, six and eight, to scale, with the clearances that matter."""
    W, H = 860, 500
    g = G
    k = 0.72
    o = []
    cw, cd = g.CHAIR[0], g.CHAIR[1]
    def chair(X, Y, cx, cz, face):
        if face in ("+z", "-z"):
            x0, z0 = cx - cw / 2, cz - cd / 2
            w_, d_ = cw, cd
        else:
            x0, z0 = cx - cd / 2, cz - cw / 2
            w_, d_ = cd, cw
        o.append(f'<rect x="{X(x0 + w_):.1f}" y="{Y(z0):.1f}" width="{w_*k:.1f}" height="{d_*k:.1f}" rx="3" fill="#f1e1c8" stroke="#b88a55"/>')
    panels = ([("Four, on the breast", "the flip-top open: two down each side", "A4"),
               ("Six, on the breast", "three down each side, elbows in", "A6"),
               ("Seven, by the stairs", "three a side and one at the end", "B7")] if g.TABLE_STYLE == "fliptop" else
              [("Four, at the wall", "everyday: the table down on its brackets", "four"),
               ("Six, in the room", "lifted off, with the leaf: 170 × 80 on eight legs", "six"),
               ("Eight, with the leaf", "plus a 60 × 80 leaf on four more legs", "eight")])
    for i, (title, sub, mode) in enumerate(panels):
        ox = 6 + i * 288
        oy = 108
        # this panel shows the west part of the room: x from 120 to 467
        X = lambda x, ox=ox: ox + (g.ROOM_W - x) * k
        Y = lambda z, oy=oy: oy + (z - g.WINDOW_Z) * k
        sd = g.ALC_D - g.STAIR_D
        pts_ = [(120, g.WINDOW_Z), (g.ROOM_W, g.WINDOW_Z), (g.ROOM_W, sd), (g.STAIR_X[0], sd), (g.STAIR_X[0], g.BREAST_D_WEST), (g.BREAST_X[1], g.BREAST_D_WEST),
                (g.BREAST_X[1], 0), (g.ALC_W, 0), (g.ALC_W, g.ALC_D), (120, g.ALC_D)]
        o.append('<polyline points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + f'" fill="#fbfaf6" stroke="{WALL}" stroke-width="2.4"/>')
        o.append(f'<line x1="{X(120):.1f}" y1="{Y(g.WINDOW_Z):.1f}" x2="{X(120):.1f}" y2="{Y(g.ALC_D):.1f}" stroke="#cfcabf" stroke-dasharray="4 4"/>')
        o.append(f'<rect x="{X(g.BREAST_X[1]):.1f}" y="{Y(0):.1f}" width="{g.BREAST_W*k:.1f}" height="{g.ALC_D*k:.1f}" fill="url(#brick3)" stroke="{WALL}" stroke-width="1.6"/>')
        o.append(f'<rect x="{X(g.ALC_W):.1f}" y="{Y(g.BASE_FRONT_Z):.1f}" width="{(g.ALC_W - 120)*k:.1f}" height="{g.BASE_D*k:.1f}" fill="#e9d3b4" stroke="#b88a55"/>')
        o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(sd):.1f}" width="{(g.ROOM_W - g.STAIR_X[0])*k:.1f}" height="{(g.ALC_D - sd)*k:.1f}" fill="url(#hatch3)" stroke="#9a958b"/>')
        hx, r = g.DOOR_X[0], g.DOOR_SWING
        o.append(f'<path d="M{X(hx + r):.1f},{Y(g.BREAST_D_WEST):.1f} A{r*k:.1f},{r*k:.1f} 0 0 1 {X(hx):.1f},{Y(g.BREAST_D_WEST - r):.1f}" fill="none" stroke="#d0573b" stroke-dasharray="3 2"/>')
        o.append(f'<rect x="{X(g.RADIATOR_X[1]):.1f}" y="{Y(g.WINDOW_Z) + 3:.1f}" width="{(g.RADIATOR_X[1]-g.RADIATOR_X[0])*k:.1f}" height="4" fill="#eceae4" stroke="#b9b4a8"/>')
        # the sofa's west end
        x1s, zf, zb = g.SOFA_X[1], g.SOFA_FRONT_Z, g.SOFA_BACK_Z
        o.append(f'<rect x="{X(x1s):.1f}" y="{Y(zb):.1f}" width="{(x1s - 120)*k:.1f}" height="{(zf - zb)*k:.1f}" fill="#ecebe6" stroke="#b9b4a8"/>')
        o.append(t((X(x1s) + X(120)) / 2, Y((zb + zf) / 2) + 3, "sofa", 9, "middle", 600, MUTED))
        o.append(f'<rect x="{X(g.TABLE_X[1]):.1f}" y="{Y(-g.RAIL[2]):.1f}" width="{g.TABLE[0]*k:.1f}" height="{g.RAIL[2]*k:.1f}" fill="#d9b48a"/>')
        if not g.SUB_IN_WALL:   # v13.5: the sub is in the alcove base now, out of the dining area
            sxx, szz = g.SUB_POS["x"], g.SUB_POS["z"]
            o.append(f'<rect x="{X(sxx[1]):.1f}" y="{Y(szz[0]):.1f}" width="{(sxx[1]-sxx[0])*k:.1f}" height="{(szz[1]-szz[0])*k:.1f}" fill="{SND_F}" stroke="{SND_S}"/>')
            bxx_, bzz_ = (g.SUB_HOOD if g.PLAIN else g.SUB_BOX)["x"], (g.SUB_HOOD if g.PLAIN else g.SUB_BOX)["z"]
            o.append(f'<rect x="{X(bxx_[1]):.1f}" y="{Y(bzz_[0]):.1f}" width="{(bxx_[1]-bxx_[0])*k:.1f}" height="{(bzz_[1]-bzz_[0])*k:.1f}" fill="none" stroke="#b88a55" stroke-width="1.3" stroke-dasharray="3 2"/>')
        # the table and chairs
        if mode in ("A4", "A6"):          # v15: the flip-top on the breast, open towards the window
            tx0, tx1 = g.TABLE_X
            tz0, tz1 = g.OPEN_Z[1], g.OPEN_Z[0]
            zm = (tz0 + tz1) / 2
            n = 2 if mode == "A4" else 3
            step = (tz1 - tz0) / n
            seats = []
            for j in range(n):
                cz = tz1 - step * (j + 0.5)
                seats += [(tx0 - cd / 2 + 8, cz, "+x"), (tx1 + cd / 2 - 8, cz, "-x")]
        elif mode == "B7":                # v15: the flip-top on the stairs wall, open into the room
            tz0, tz1 = g.TABLE_B_Z[1], g.TABLE_B_Z[0]
            tx0, tx1 = g.TABLE_B_OPEN_X
            zm = (tz0 + tz1) / 2
            step = (tx1 - tx0) / 3
            seats = [(tx0 - cd / 2 + 8, zm, "+x")]
            for j in range(3):
                cx = tx1 - step * (j + 0.5)
                seats += [(cx, tz1 + cd / 2 - 8, "-z"), (cx, tz0 - cd / 2 + 8, "+z")]
        elif mode == "four":
            tx0, tx1 = g.TABLE_X
            tz0, tz1 = g.TABLE_Z[1], g.TABLE_Z[0]
            zm = (tz0 + tz1) / 2
            seats = [(tx0 - cd / 2 + 8, zm, "+x"), (tx1 + cd / 2 - 8, zm, "-x"),
                     (g.TABLE_CX - 27.5, tz0 - cd / 2 + 8, "+z"), (g.TABLE_CX + 27.5, tz0 - cd / 2 + 8, "+z")]
        else:
            tx0, tx1 = g.SIX_X if mode == "six" else g.EIGHT_X
            tz0, tz1 = g.FREE_Z[1], g.FREE_Z[0]
            zm = (tz0 + tz1) / 2
            n = 2 if mode == "six" else 3
            step = (tx1 - tx0) / n
            seats = [(tx0 - cd / 2 + 8, zm, "+x"), (tx1 + cd / 2 - 8, zm, "-x")]
            for j in range(n):
                xc = tx0 + step * (j + 0.5)
                seats += [(xc, tz0 - cd / 2 + 8, "+z"), (xc, tz1 + cd / 2 - 8, "-z")]
        for (cx_, cz_, f_) in seats:
            chair(X, Y, cx_, cz_, f_)
        o.append(f'<rect x="{X(tx1):.1f}" y="{Y(tz0):.1f}" width="{(tx1-tx0)*k:.1f}" height="{(tz1-tz0)*k:.1f}" fill="#d9b48a" stroke="#9c6a3f" stroke-width="1.4"/>')
        if mode in ("A4", "A6"):
            o.append(f'<line x1="{X(tx0):.1f}" y1="{Y(g.TABLE_Z[1]):.1f}" x2="{X(tx1):.1f}" y2="{Y(g.TABLE_Z[1]):.1f}" stroke="#7a5130" stroke-dasharray="3 2"/>')
        elif mode == "B7":
            o.append(f'<line x1="{X(g.TABLE_B_X[0]):.1f}" y1="{Y(tz0):.1f}" x2="{X(g.TABLE_B_X[0]):.1f}" y2="{Y(tz1):.1f}" stroke="#7a5130" stroke-dasharray="3 2"/>')
        elif mode == "eight" or (mode == "six" and g.SIX_LEAF):
            xj = tx0 + g.TABLE[0]
            o.append(f'<line x1="{X(xj):.1f}" y1="{Y(tz0):.1f}" x2="{X(xj):.1f}" y2="{Y(tz1):.1f}" stroke="#7a5130" stroke-dasharray="3 2"/>')
        o.append(t((X(tx0) + X(tx1)) / 2, Y(zm) + 4, "110 × 160" if mode in ("A4", "A6", "B7") else f"{_fmt(tx1 - tx0)} × {_fmt(g.TABLE[1])}", 9, "middle", 650, "#5a3a20"))
        # the clearances that matter
        def vdim(x, za, zb_, lab, col=BLUE):
            o.append(f'<line x1="{X(x):.1f}" y1="{Y(za):.1f}" x2="{X(x):.1f}" y2="{Y(zb_):.1f}" stroke="{col}" stroke-width="1.2"/>')
            o.append(t(X(x) + 4, (Y(za) + Y(zb_)) / 2 + 3, lab, 8.5, "start", 600, col))
        def hdim2(xa, xb, z, lab, col=BLUE):
            o.append(f'<line x1="{X(xa):.1f}" y1="{Y(z):.1f}" x2="{X(xb):.1f}" y2="{Y(z):.1f}" stroke="{col}" stroke-width="1.2"/>')
            o.append(t((X(xa) + X(xb)) / 2, Y(z) - 4, lab, 8.5, "middle", 600, col))
        if mode in ("A4", "A6"):
            vdim(g.TABLE_CX, tz0, g.SOFA_FRONT_Z, f"{_fmt(tz0 - g.SOFA_FRONT_Z)} to the sofa", "#9a5f0c")
        elif mode == "B7":
            vdim(tx0 + 12, tz1, g.STAIRS_WALL_Z[0], f"{_fmt(g.STAIRS_WALL_Z[0] - tz1)} to the stairs")
            vdim(tx0 + 12, tz0, g.WINDOW_Z, f"{_fmt(tz0 - g.WINDOW_Z)} to the window")
        elif mode == "four":
            vdim(g.TABLE_CX + 50, tz0, g.SOFA_FRONT_Z, f"{_fmt(tz0 - g.SOFA_FRONT_Z)} to the sofa")
        else:
            vdim(tx1 - 10, tz1, 0, f"{_fmt(-tz1)} to the breast")
            vdim(tx1 - 10, tz0, g.WINDOW_Z, f"{_fmt(tz0 - g.WINDOW_Z)} to the window")
            hdim2(tx1, g.ROOM_W, zm - 30, f"{_fmt(g.ROOM_W - tx1)} to the wall", "#9a5f0c" if g.ROOM_W - tx1 < g.CLEAR_OK else BLUE)
            if tx0 < g.SOFA_X[1]:
                vdim(tx0 + 8, tz0, g.SOFA_FRONT_Z, f"{_fmt(tz0 - g.SOFA_FRONT_Z)} to the sofa", "#9a5f0c")
        o.append(t(ox, 64, title, 12, "start", 650))
        o.append(t(ox, 79, sub, 9.5, "start", 400, MUTED))
    o.append('<defs><pattern id="brick3" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#d9a48a"/>'
             '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#b5785e" stroke-width="0.8"/></pattern>'
             '<pattern id="hatch3" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#c9c3b5" stroke-width="2"/></pattern></defs>')
    notes = [f"Per diner: {_fmt(g.DINE_W)} cm of table edge (55 at a squeeze). Table edge to a wall: {_fmt(g.CLEAR_MIN)} cm is a tight minimum, {_fmt(g.CLEAR_OK)} to aim for, {_fmt(g.CLEAR_WALK)}+ to walk behind someone seated.",
             ("The flip-top never leaves the wall; the dashed line is the joint where the half flips out on its gate leg. Red: the door's swing." if g.TABLE_STYLE == "fliptop" else
              "Six and eight: slide the coffee table to the window first. The dashed red arc is the door's swing if it opens into the room: the chairs on that side need it shut while you eat."),
             f"Chairs drawn at IKEA TERJE size ({_fmt(cw)} × {_fmt(cd)}, seat {_fmt(g.CHAIR[3])}): {_fmt(g.TABLE_TOP - g.CHAIR[3])} cm from seat to table top, the usual 25–30."]
    for i, n in enumerate(notes):
        o.append(t(0, 432 + i * 20, "• " + n, 9.8, "start", 400, INK))
    return svg(W, H, "\n".join(o), "The flip-top table for four, six or seven" if g.TABLE_STYLE == "fliptop" else "The dining table for four, six or eight",
               "To scale, the west half of the room from above, window at the top. Red: the door's swing. Blue: the clearances that matter")


def dining_section():
    """Side section through the chimney breast at the table's centre line, room on the left."""
    W, H = 860, 610
    g = G
    s = 2.05
    ox, oy = 600, 590
    Z = lambda cm: ox - cm * s           # cm in front of the breast's face
    Y = lambda cm: oy - cm * s
    o = []
    o.append(f'<line x1="{Z(150)}" y1="{Y(0)}" x2="{Z(-12)}" y2="{Y(0)}" stroke="#8f8a80" stroke-width="1.6"/>')
    o.append(f'<rect x="{Z(0)}" y="{Y(205)}" width="{12*s}" height="{205*s}" fill="url(#brick4)" stroke="#8f5b45"/>')
    o.append('<defs><pattern id="brick4" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#e2b9a4"/>'
             '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#c08a72" stroke-width="0.8"/></pattern></defs>')
    o.append(t(Z(-12) + 4, Y(120), "chimney", 9.5, "start", 500, "#8f5b45"))
    o.append(t(Z(-12) + 4, Y(120) + 12, "breast", 9.5, "start", 500, "#8f5b45"))
    # backboard
    rt, Hr, Dr = g.RAIL_TOP, g.RAIL[1], g.RAIL[2]
    o.append(rect(Z(Dr), Y(rt), Dr * s, Hr * s, "#e9dccb", "#b88a55", 0))
    # the table folded up (solid) and down (dashed)
    tt, td = g.TABLE[2], g.TABLE[1]
    o.append(rect(Z(Dr + tt), Y(g.FOLDED_TOP), tt * s, td * s, "#f1e1c8", "#9c6a3f", 0, 1.4))
    o.append(rect(Z(Dr + td), Y(g.TABLE_TOP), td * s, tt * s, "none", BLUE, 0, 1.4, 'stroke-dasharray="5 3"'))
    o.append(f'<path d="M{Z(Dr + td)},{Y(g.TABLE_TOP) - 4} A{td*s},{td*s} 0 0 1 {Z(Dr) - 4},{Y(g.FOLDED_TOP)}" fill="none" stroke="{BLUE}" stroke-width="1" stroke-dasharray="2 4"/>')
    # Hebgo: folded (solid), open (dashed)
    arm, bh = g.HEBGO
    o.append(rect(Z(Dr + 0.6), Y(rt), 0.6 * s, (bh - 1) * s, "#9a9c9f", "#6f7174", 0))
    o.append(rect(Z(Dr + 2.6), Y(rt), 2.0 * s, (arm - 0.5) * s, "#c7c9cc", "#6f7174", 0))
    o.append(f'<path d="M{Z(Dr + 0.6)},{Y(rt - 2.4)} L{Z(Dr + arm)},{Y(rt - 2.4)} M{Z(Dr + 0.6)},{Y(rt - bh + 2)} L{Z(Dr + 31)},{Y(rt - 2.4)}" stroke="{BLUE}" stroke-width="2" fill="none" stroke-dasharray="5 3"/>')
    # lift-off hinge and turn button
    o.append(f'<circle cx="{Z(Dr + 0.6)}" cy="{Y(rt)}" r="5" fill="#fff" stroke="#55585b" stroke-width="1.6"/>')
    o.append(rect(Z(2.4), Y(g.FOLDED_TOP + 3), 2.4 * s, 3 * s, "#c48c57", "#7a5130", 0))
    # frames
    o.append(rect(Z(2.2), Y(g.FRAMES_Y + 34), 2 * s, 34 * s, "#333", "#111", 0))
    # the sub on its riser, on its side to the breast, beyond the cut
    if not g.SUB_IN_WALL:   # v13.5: nothing under the table now; the sub is in the alcove base
        sd_ = -g.SUB_POS["z"][0]
        ys_ = g.SUB_HOOD["feet"] + g.SUB_HOOD["base"] if g.PLAIN else 5
        o.append(rect(Z(sd_), Y(ys_ + g.SUB[1]), (sd_ - 2) * s, g.SUB[1] * s, SND_F, SND_S, 2, 1, 'stroke-dasharray="4 3"'))
        o.append(t(Z(sd_ / 2 + 1), Y(22), "sub", 9, "middle", 600, SND_S))
        bd_, bh_ = (-g.SUB_HOOD["z"][0], g.SUB_HOOD["h"]) if g.PLAIN else (-g.SUB_BOX["z"][0], g.SUB_BOX["h"])
        o.append(rect(Z(bd_), Y(bh_), bd_ * s, bh_ * s, "none", "#b88a55", 1, 1.3, 'stroke-dasharray="4 3"'))
        o.append(t(Z(bd_) - 4, Y(bh_ / 2), "oak cover" if g.PLAIN else "slatted box", 8.5, "end", 600, "#8a5a32"))
    # a chair pulled up to the table, room side
    w, d, h, sh = g.CHAIR
    cz0 = Dr + td - 8                     # its front edge 8 under the table
    o.append(f'<path d="M{Z(cz0)},{Y(sh)} L{Z(cz0 + d - 4)},{Y(sh)} M{Z(cz0 + 2)},{Y(0)} L{Z(cz0 + 2)},{Y(sh)} M{Z(cz0 + d - 5)},{Y(0)} L{Z(cz0 + d - 5)},{Y(h)} M{Z(cz0 + d - 6)},{Y(h - 3)} L{Z(cz0 + d - 3)},{Y(h - 16)}" stroke="#b88a55" stroke-width="3" fill="none" stroke-linecap="round"/>')
    o.append(t(Z(cz0 + d / 2), Y(sh) + 14, "chair, seat 48", 9, "middle", 500, "#7a5130"))
    # labels
    lab = [(g.FOLDED_TOP, Dr + tt, f"table folded up, top edge {_fmt(g.FOLDED_TOP)}", -6),
           (g.TABLE_TOP + 4, Dr + td, f"table down: top {_fmt(g.TABLE_TOP)}, {_fmt(td)} from the breast", 0),
           (rt - bh + 4, Dr, f"oak backboard {_fmt(g.RAIL[0])} × {_fmt(Hr)} × {_fmt(Dr)}", 0),
           (rt - arm + 8, Dr + 2.6, "Hebgo arm folded down", 0),
           (g.FRAMES_Y + 20, 2.2, "framed LPs", 0)]
    for (y, z, txt, dy) in lab:
        o.append(f'<line x1="{Z(z)}" y1="{Y(y)}" x2="{Z(z) - 14}" y2="{Y(y)}" stroke="#b9b4a8"/>')
        o.append(t(Z(z) - 18, Y(y) + 3.5 + dy, txt, 9.5, "end", 500))
    o.append(t(Z(Dr + 0.6) + 8, Y(rt) + 14, "lift-off hinge", 9, "start", 600, "#55585b"))
    o.append(t(Z(Dr + 46), Y(rt - 14), "Hebgo arm out, 58: locks on its own", 9, "middle", 600, BLUE))
    o.append(t(Z(2.4) + 8, Y(g.FOLDED_TOP + 2), "turn button", 9, "start", 500, "#7a5130"))
    # height scale
    hx = Z(-26)
    o.append(f'<line x1="{hx}" y1="{Y(0)}" x2="{hx}" y2="{Y(205)}" stroke="#cfcabf"/>')
    for hgt, txt in [(0, "0"), (rt - bh, f"{_fmt(rt - bh)}"), (g.TABLE_TOP, f"{_fmt(rt)} hinge · {_fmt(g.TABLE_TOP)} top"),
                     (g.FOLDED_TOP, f"{_fmt(g.FOLDED_TOP)}"), (g.FRAMES_Y, f"{_fmt(g.FRAMES_Y)}"), (rt - arm, f"{_fmt(rt - arm)}")]:
        o.append(f'<line x1="{hx - 3}" y1="{Y(hgt)}" x2="{hx + 3}" y2="{Y(hgt)}" stroke="#9a958b"/>')
        o.append(t(hx + 6, Y(hgt) + 3.5, txt, 9, "start", 400, MUTED))
    notes = ["Everyday: folded flat, about 7 cm off the breast, held at the top by two turn buttons.",
             "For four: lift the top edge a little, turn the buttons, lower it onto the two brackets as they swing out and lock.",
             f"For six or eight: with it down, slide it {5} cm sideways off the lift-off hinges' pins, screw in four oak legs from the leaf's frame,",
             f"and stand it in the room with the leaf: the top is then {_fmt(g.LEG_H + g.TABLE[2])} cm. Two people lift it: about 18 kg."]
    for i, n in enumerate(notes):
        o.append(t(0, 70 + i * 17, "• " + n, 9.8, "start", 400, INK))
    return svg(W, H, "\n".join(o), "The dining wall in section: folded, down, or off the wall",
               "Through the chimney breast at the table's centre, to scale, room on the left. Solid: folded. Dashed blue: down for four")


def sound():
    """The sound layout on the room plan."""
    W, H = 860, 470
    k = 1.1
    g = G
    o = []
    X, Y = _room(o, k, 170, 60)
    _sofa(o, X, Y, k, label=False)
    _side_wall(o, X, Y, k)
    o.append(rect(X(g.TV_CX + 46), Y(-7), 92 * k, 9 * k, SND_F, SND_S, 2))
    o.append(t(X(g.TV_CX), Y(-7) - 6, "soundbar under the TV", 9.5, "middle", 600, SND_S))
    sx, sz = g.SUB_POS["x"], g.SUB_POS["z"]
    o.append(rect(X(sx[1]), Y(sz[0]), (sx[1] - sx[0]) * k, (sz[1] - sz[0]) * k, SND_F, SND_S, 3))
    if g.SUB_IN_WALL:   # v13.5: in bay 2, under the TV, the driver facing the room
        xm = (sx[0] + sx[1]) / 2
        o.append(arrow(X(xm), Y(sz[0]), X(xm), Y(sz[0] - 55), SND_S, 2))
        o.append(t(X(xm) - 14, Y(sz[0] - 30), "sub in bay 2, under the TV,", 9.5, "end", 600, SND_S))
        o.append(t(X(xm) - 14, Y(sz[0] - 30) + 13, f"facing the room; port {g.SUB_PORT_GAP:.1f} cm from the wall", 9, "end", 400, MUTED))
    else:
        o.append(arrow(X(sx[0]), Y((sz[0] + sz[1]) / 2), X(sx[0] - 50), Y((sz[0] + sz[1]) / 2), SND_S, 2))
        o.append(t(X((sx[0] + sx[1]) / 2), Y(sz[0]) - 26, "sub under an oak cover on the dining wall," if g.PLAIN else "sub in a slatted oak box under the dining wall,", 9.5, "middle", 600, SND_S))
        o.append(t(X((sx[0] + sx[1]) / 2), Y(sz[0]) - 13, (f"no sides: driver and port fire freely; port {g.HEBGO_X[1] - 1.4 - g.SUB_POS['x'][1]:.0f} cm clear" if g.PLAIN else f"port {g.SUB_BOX['x'][1] - g.SUB_POS['x'][1]:.0f} cm from its slats"), 9, "middle", 400, MUTED))
    for (x, z, lab) in [(16, -280, "rear, on the side wall"), (g.SOFA_X[1] + 14, -296, "rear, on a stand")]:
        o.append(rect(X(x), Y(z), 15 * k, 15 * k, SND_F, SND_S, 3))
        o.append(t(X(x) + (10 if x < 100 else -6), Y(z) + 30, lab, 9, "start" if x < 100 else "end", 600, SND_S))
    o.append(wire([(X(23), Y(-280)), (X(23), Y(-302)), (X(279), Y(-302)), (X(279), Y(-296))], VIN_S, 1.6, "5 3"))
    o.append(t(X(g.SOFA_X[1] + 14) + 6, Y(-296) + 42, "linked by a cable behind the sofa", 9, "end", 500, VIN_S))
    o.append(rect(X(g.DECK_X[1]), Y(g.DECK_Z[0]), g.DECK[0] * k, g.DECK[2] * k, VIN_F, VIN_S, 2))
    o.append(t(X(g.DECK_X[0]) - 4, Y(g.DECK_Z[0]) - 4, "turntable", 9, "end", 600, VIN_S))
    d_ = ((g.SUB_POS["x"][1] - g.DECK_X[0]) ** 2 + (g.SUB_POS["z"][1] - g.DECK_Z[0]) ** 2) ** 0.5
    o.append(t(X(120), Y(-60), (f"sub to deck about {d_/100:.1f} m, in the same base: riser under the sub, feet under the deck" if g.SUB_IN_WALL else f"sub to deck about {d_/100:.1f} m, on separate furniture"), 9, "middle", 400, MUTED))
    return svg(W, H, "\n".join(o), "Sound: the sub on the front wall with the TV, the rears behind the sofa",
               "To scale, north at the top. The sub is wireless: on the front wall it blends with the soundbar, out of the way of feet")


def power():
    W, H = 860, 640
    o = []
    o.append(node(0, 70, 160, 58, "Double socket", "side wall, by the records bay" if G.MW_SWAP else "side wall, in front of bay 1"))
    o.append(t(80, 146, "left · right (the retro switch)", 9.5, "middle", 500, MUTED))
    o.append(rect(196, 60, 330, 330, "#fbfaf7", LINE, 8))
    o.append(t(361, 82, "Your 10-gang, behind the TV", 12.5, "middle", 650))
    o.append(t(361, 97, "lying flat on the worktop · both sides left on", 10, "middle", 400, MUTED))
    items = ["LG C6 TV (standby: pixel refresh)", "Soundbar", "Subwoofer (lead along the channel)", "Xbox Series X (lead in the groove)",
             "USB charger: fan stand, pad dock, bias light, HDMI switch", "Deco B (12 V lead in the groove)", "Switch 2", "Turntable", "Phono preamp", "PC (its lead in the side wall's conduit)"]
    for i, it in enumerate(items):
        y = 112 + i * 27
        o.append(rect(206, y, 310, 22, VIN_F if it in ("Turntable", "Phono preamp") else (SND_F if i < 3 else "#f4f3ef"), LINE, 4))
        o.append(t(216, y + 15, it, 10.2, "start", 500 if it != "Spare" else 400, INK if it != "Spare" else MUTED))
    o.append(rect(546, 60, 300, 330, "#fbfaf7", LINE, 8))
    o.append(t(696, 82, "6-way for the retro set", 12.5, "middle", 650))
    o.append(t(696, 97, "in the channel behind bay 1" if G.SUB_IN_WALL else "in the channel behind bay 2", 10, "middle", 400, MUTED))
    for i, it in enumerate(["Xbox One", "Xbox 360", "PS3", "PS2", "PS1", "RetroTINK USB plug (5 V 2 A)"]):
        y = 112 + i * 36
        o.append(rect(558, y, 276, 28, GAME_F, LINE, 4))
        o.append(t(568, y + 18, it, 10.5, "start", 500, INK))
    o.append(t(696, 344, "the wall socket's right-hand switch", 10, "middle", 600, GAME_S))
    o.append(t(696, 358, "turns the whole retro set off", 10, "middle", 400, MUTED))
    o.append(wire([(160, 92), (178, 92), (178, 230), (196, 230)], VIN_S, 1.8))
    o.append(wire([(160, 106), (170, 106), (170, 404), (696, 404), (696, 390)], VIN_S, 1.8))
    o.append(t(430, 420, "one strip per socket, never one plugged into another", 10, "middle", 500, VIN_S))
    notes = ["The socket on the side wall is a single today: you swap it for a double at the same spot (like for like, your own job: step 3).",
             "The retro switch moves to the wall: with the TV 2 cm from the left upright, the 10-gang's own switches can't be reached any more.",
             "Rear speakers: your double socket behind the sofa's short side (v23). Your lamp and the grow lights: the double behind the plant stand.",
             ("The sub plugs into the 10-gang: its lead drops through the worktop's slot to the back of bay 2. Both spot bars use existing ceiling points." if G.SUB_IN_WALL else "The sub plugs into the 10-gang: its lead runs along the channel and the breast's skirting. Both spot bars use existing ceiling points."),
             "Load check: the 10-gang about 1.55 kW with everything on, PC included (850 W at most); the 6-way up to 0.8 kW. Each under 13 A (3 kW).",
             "Check the 10-gang is surge-protected; if not, use a surge-protected one for the TV and consoles. Label both outlets."]
    for i, n in enumerate(notes):
        o.append(t(0, 460 + i * 24, "• " + n, 10.3, "start", 400, INK))
    return svg(W, H, "\n".join(o), "Power map: your 10-gang (now with the PC) plus a 6-way for the retro set",
               "Everything modern on the left outlet, always on; the five retro consoles and the RetroTINK on the right, switched at the wall")


def routes():
    W, H = 860, 470
    o = []
    s = 1.42
    g = G
    side_len = 250.0                    # how much of the side wall to unfold
    ox, oy = 18 + side_len * s, 414
    X = lambda cm: ox + cm * s
    Y = lambda cm: oy - cm * s
    F = lambda z: ox - (g.ALC_D - z) * s     # the side wall folded flat: z -> x on the drawing
    o.append(f'<rect x="{F(g.ALC_D - side_len)}" y="{Y(g.CEIL)}" width="{side_len*s}" height="{g.CEIL*s}" fill="#f3f2ee" stroke="{LINE}" stroke-dasharray="4 3"/>')
    o.append(t(F(-100), Y(g.CEIL) + 14, "side wall, folded flat", 10, "middle", 500, MUTED))
    o.append(f'<rect x="{X(0)}" y="{Y(g.CEIL)}" width="{g.ALC_W*s}" height="{g.CEIL*s}" fill="#f8f7f4" stroke="{LINE}"/>')
    o.append(f'<rect x="{X(g.ALC_W)}" y="{Y(g.CEIL)}" width="{g.BREAST_W*s}" height="{g.CEIL*s}" fill="#f1efe9" stroke="{LINE}"/>')
    o.append(f'<line x1="{F(g.ALC_D - side_len)}" y1="{oy}" x2="{X(310)}" y2="{oy}" stroke="#b9b4a8" stroke-width="1.4"/>')
    o.append(rect(X(0), Y(76), g.ALC_W * s, 3 * s, "#e9dccb", "#c9b79f", 1))
    o.append(rect(X(0), Y(73), g.ALC_W * s, 73 * s, "#fbfaf7", "#d6d2c8", 1))
    for a, b in g.BAYS:
        o.append(f'<rect x="{X(a)}" y="{Y(73)}" width="{(b-a)*s}" height="{73*s}" fill="none" stroke="#e2ded5"/>')
    o.append(rect(X(g.TABLE_X[0]), Y(g.FOLDED_TOP), g.TABLE[0] * s, (g.FOLDED_TOP - g.RAIL_TOP + g.RAIL[1]) * s, "#fbf3ec", "#e0c9b4", 1))
    o.append(t(X(g.TABLE_CX), Y(110), "dining wall: no power", 9.5, "middle", 600, VIN_S))
    o.append(rect(X(g.TV_X[0]), Y(g.TV_TOP), g.TV_W * s, g.TV_H * s, "#ebeae6", "#c9c5bb", 3))
    o.append(t(X(g.TV_CX), Y(119), "TV", 11, "middle", 600, MUTED))
    o.append(rect(X(0), Y(g.HIGH_TOP), g.ALC_W * s, 4 * s, "#e9dccb", "#c9b79f", 1))
    dxd = (g.UP_R[0] if g.MW_SWAP else g.ALC_W) - 15
    MX = (lambda x: g.ALC_W - x) if g.MW_SWAP else (lambda x: x)     # v38: the swapped wall's routes, mirrored
    o.append(rect(X(dxd), Y(g.HIGH_TOP + 11.4), 11 * s, 11.4 * s, "#fff", LINE, 8))
    o.append(t(X(dxd + 5.5), Y(g.HIGH_TOP + 15), "Deco B", 9, "middle", 500))
    for (a, b) in (g.UP_L, g.UP_R):
        o.append(f'<rect x="{X(a)}" y="{Y(g.CEIL)}" width="{g.UP_T*s}" height="{(g.CEIL-76)*s}" fill="#f1e1c8" stroke="#b88a55"/>')
    o.append(rect(X(g.RZ[0]), Y(g.RZ_SHELF_TOP), g.RZ_W * s, 4 * s, "#e9dccb", "#c9b79f", 1))
    o.append(rect(X(g.SX_X[0] + 2.7), Y(g.SX_TOP), 15.1 * s, 36.6 * s, GAME_F, GAME_S, 2))
    o.append(t(X(g.SX_X[0] + 10), Y(g.SX_TOP) - 4, "Series X", 9, "middle", 600, GAME_S))
    o.append(rect(X(g.RZ[0] + 4), Y(g.RZ_SHELF_TOP - 4), 11 * s, 4.5 * s, "#fff", VIN_S, 2))
    o.append(t(X(g.RZ[0] + 4) - 3, Y(g.RZ_SHELF_TOP - 7.5), "preamp", 8.5, "end", 600, VIN_S))
    o.append(rect(X(g.DECK_X[0]), Y(90.2), g.DECK[0] * s, 14.2 * s, VIN_F, VIN_S, 2))
    o.append(t(X(g.DECK_X[0] + 22), Y(90.2) - 4, "deck", 9.5, "middle", 600, VIN_S))
    o.append(rect(X(MX(66) if g.MW_SWAP else 10), Y(80.5), 56 * s, 4.5 * s, VIN_F, VIN_S, 2))
    o.append(t(X(MX(38)), Y(73) + 14, "10-gang", 9.5, "middle", 600, VIN_S))
    rx6 = (MX(44) if g.MW_SWAP else 10) if g.SUB_IN_WALL else 66
    o.append(rect(X(rx6), Y(5.5), 34 * s, 4.5 * s, GAME_F, GAME_S, 2))
    o.append(t(X(rx6 + 17), Y(5.5) - 4, "retro 6-way", 9, "middle", 600, GAME_S))
    # the side wall: ledge, PC shelf and PC, sub on the floor, sockets
    o.append(rect(F(g.WRAP_Z[1]), Y(g.LEDGE_TOP), (g.WRAP_Z[0] - g.WRAP_Z[1]) * s, 2.4 * s, "#e9dccb", "#c9b79f", 1))
    o.append(rect(F(g.PC_SHELF_Z[1]), Y(g.PC_SHELF_TOP), (g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1]) * s, 4 * s, "#e9dccb", "#c9b79f", 1))
    o.append(rect(F(g.PC_Z[1]), Y(g.PC_SHELF_TOP + g.PC_CASE[1]), g.PC_CASE[2] * s, g.PC_CASE[1] * s, GAME_F, GAME_S, 3))
    o.append(t(F((g.PC_Z[0] + g.PC_Z[1]) / 2), Y(g.PC_SHELF_TOP + 22), "PC", 11, "middle", 650))
    sxx = g.SUB_POS["x"]
    sy0, sy1 = (g.SUB_IN["y"][0], g.SUB_IN["y"][1]) if g.SUB_IN_WALL else (0, 34.4)
    o.append(rect(X(sxx[0]), Y(sy1), (sxx[1] - sxx[0]) * s, (sy1 - sy0) * s, SND_F, SND_S, 2))
    o.append(t(X((sxx[0] + sxx[1]) / 2), Y(sy1) - 3, "sub", 9, "middle", 600, SND_S))
    o.append(f'<rect x="{F(g.ALC_D - side_len)}" y="{Y(80)}" width="{(g.CHAISE_END_Z - g.ALC_D + side_len)*s}" height="{80*s}" fill="none" stroke="#c9c5bb" stroke-dasharray="3 3"/>')
    o.append(t(F(-170), Y(40), "sofa (beyond)", 9, "middle", 400, MUTED))
    DATA = BLUE; MAINS = VIN_S; DC = "#2fa47a"; AUD = "#b07a1f"
    o.append(rect(F(g.SOCKET["z"]) - 4, Y(34.3), 8 * s, 8.6 * s, "#fff", MAINS, 2))
    o.append(t(F(g.SOCKET["z"]), Y(34.3) - 4, "socket", 9, "middle", 600, MAINS))
    z2 = g.SOCKET2["z"]                    # v23: the client's double socket behind the sofa's return
    o.append(rect(F(z2) - 7, Y(34.3), 14.6 * s, 8.6 * s, "#fff", MAINS, 2))
    o.append(t(F(z2) + 8, Y(34.3) - 15, "double socket behind the sofa:", 8.5, "middle", 600, MAINS))
    o.append(t(F(z2) + 8, Y(34.3) - 4, "the rear speakers", 8.5, "middle", 400, MAINS))
    tz = g.PC_SHELF_Z[1] + 3
    o.append(wire([(F(tz), Y(g.PC_SHELF_TOP - 4)), (F(tz), Y(8)), (X(-1), Y(8)), (X(4), Y(5)), (X(110), Y(5)), (X(110), Y(76))], DATA, 2.2))
    o.append(t(F(tz) + 6, Y(100), "HDMI (active optical) + Cat6:", 9, "start", 500, DATA))
    o.append(t(F(tz) + 6, Y(100) + 11, "in conduit chased into the wall," if g.PLAIN else "trunking down to the skirting,", 9, "start", 400, MUTED))
    o.append(t(F(tz) + 6, Y(100) + 22, "behind the skirting into the plinth" if g.PLAIN else "along it into the plinth", 9, "start", 400, MUTED))
    o.append(wire([(F(tz) - 4, Y(g.PC_SHELF_TOP - 4)), (F(tz) - 4, Y(11)), (X(-1), Y(11)), (X(MX(9)), Y(11)), (X(MX(9)), Y(76))], MAINS, 1.6))
    o.append(t(F(tz) + 6, Y(66), "PC mains lead: its own", 9, "start", 500, MAINS))
    o.append(t(F(tz) + 6, Y(66) + 11, "conduit, to the 10-gang", 9, "start", 400, MUTED))
    gd = g.UP_R[0] + 2.25                                            # Deco B's groove: the breast end's upright
    gx = g.UP_L[1] - 2.25 if g.MW_SWAP else gd                       # the Series X and the vinyl: the upright beside the turntable zone
    sxs = g.SX_X[1] if g.MW_SWAP else g.SX_X[0]
    o.append(wire([(X(dxd), Y(g.HIGH_TOP + 2)), (X(gd), Y(g.HIGH_TOP + 2)), (X(gd), Y(76)), (X(MX(40)), Y(78))], DC, 2.2, "6 3"))
    o.append(wire([(X(sxs), Y(g.RZ_SHELF_TOP + 3)), (X(gx + 1), Y(g.RZ_SHELF_TOP + 3)), (X(gx + 1), Y(76)), (X(MX(118)), Y(70)), (X(MX(118)), Y(6))], DATA, 1.6))
    if g.MW_SWAP:
        o.append(t(X(dxd) - 24, Y(g.HIGH_TOP + 16), "Deco B's leads: the right upright's groove", 9, "end", 500, DC))
        o.append(t(X(g.UP_L[1]) + 4, Y(186), "Series X leads and the vinyl audio,", 9, "start", 500, DATA))
        o.append(t(X(g.UP_L[1]) + 4, Y(186) + 11, "in the groove behind the left upright", 9, "start", 400, MUTED))
    else:
        o.append(t(X(g.UP_R[0]) - 4, Y(176), "Deco 12 V lead, its patch lead", 9, "end", 500, DC))
        o.append(t(X(g.UP_R[0]) - 4, Y(176) + 11, "and the Series X's leads, in", 9, "end", 500, DATA))
        o.append(t(X(g.UP_R[0]) - 4, Y(176) + 22, "the groove behind the right upright", 9, "end", 400, MUTED))
    o.append(wire([(X(g.ALC_W - 2), Y(g.CEIL)), (X(g.ALC_W - 2), Y(g.HIGH_TOP + 14)), (X(dxd + 9), Y(g.HIGH_TOP + 9))], DATA, 1.6))
    o.append(t(X(g.ALC_W + 3), Y(g.CEIL) + 14, "Cat6 in through the ceiling", 9, "start", 500, DATA))
    o.append(wire([(X(g.DECK_X[0] + 30), Y(86)), (X(g.DECK_X[0] + 30), Y(110)), (X(g.RZ[0] + 9), Y(g.RZ_SHELF_TOP - 4))], AUD, 1.8))
    o.append(wire([(X(g.RZ[0] + 6), Y(g.RZ_SHELF_TOP - 4)), (X(gx - 1), Y(124)), (X(gx - 1), Y(77)), (X(g.TV_CX + 30), Y(79))], AUD, 1.8))
    o.append(t(X(g.RZ[0] + 26), Y(116), "deck → preamp → soundbar AUX", 9, "middle", 500, AUD))
    o.append(wire([(F(g.SOCKET["z"]), Y(25.7)), (F(g.SOCKET["z"]), Y(3)), (X(MX(14)), Y(3)), (X(MX(14)), Y(76))], MAINS, 1.8))
    o.append(wire([(F(g.SOCKET["z"]) + 4, Y(25.7)), (F(g.SOCKET["z"]) + 4, Y(1.5)), (X(rx6 if g.MW_SWAP else 66), Y(1.5))], MAINS, 1.8))
    if g.MW_SWAP:
        o.append(wire([(X(MX(20)), Y(77)), (X(MX(20)), Y(4)), (X(sxx[1]), Y(4)), (X(sxx[1]), Y(10))], MAINS, 1.4))
    else:
        o.append(wire([(X(20), Y(77)), (X(20), Y(4)), (X(g.ALC_W), Y(4)), (X(sxx[0]), Y(4)), (X(sxx[0]), Y(10))], MAINS, 1.4))
    for i, (c, lab, d) in enumerate([(DATA, "HDMI / Cat6", None), (MAINS, "mains leads", None), (DC, "12 V DC lead", "6 3"), (AUD, "vinyl audio", None)]):
        o.append(wire([(i * 210, 452), (i * 210 + 28, 452)], c, 2.2, d)); o.append(t(i * 210 + 36, 456, lab, 10.5, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "Cable routes: everything ends in the channel behind the base",
               "Front view, schematic, with the side wall folded flat to the left so the PC's route shows; the sub sits in bay 2")


def pc_shelf():
    W, H = 860, 470
    o = []
    g = G
    s = 1.2
    # plan view (from above). Side wall on the left, the alcove at the top.
    ox, oy = 40, 104
    Xp = lambda cm: ox + cm * s           # out from the side wall
    Yp = lambda z: oy + (g.WRAP_Z[0] - z) * s
    o.append(t(0, 70, "From above", 12, "start", 600))
    o.append(f'<line x1="{Xp(0)}" y1="{Yp(g.ALC_D)}" x2="{Xp(0)}" y2="{Yp(-240)}" stroke="#8f8a80" stroke-width="3"/>')
    o.append(t(Xp(0) - 4, Yp(-60), "side wall", 9.5, "end", 400, MUTED, 'transform="rotate(-90 %.1f %.1f)"' % (Xp(0) - 8, Yp(-60))))
    o.append(f'<line x1="{Xp(0)}" y1="{Yp(g.ALC_D)}" x2="{Xp(110)}" y2="{Yp(g.ALC_D)}" stroke="#8f8a80" stroke-width="3"/>')
    o.append(t(Xp(60), Yp(g.ALC_D) - 6, "alcove back wall", 9.5, "middle", 400, MUTED))
    o.append(rect(Xp(0), Yp(g.ALC_D), g.UP_T * s, g.UP_D * s, "#b88a55", "#9c6a3f", 0))
    o.append(rect(Xp(0), Yp(g.ALC_D), 110 * s, (g.ALC_D - g.BASE_FRONT_Z) * s, "#f1e4d2", "#c9a77a", 0, 1, 'fill-opacity="0.5"'))
    o.append(t(Xp(60), Yp(10), "media wall base", 9.5, "middle", 500, "#9c6a3f"))
    o.append(rect(Xp(0), Yp(g.WRAP_Z[0]), g.WRAP_D * s, (g.WRAP_Z[0] - g.WRAP_Z[1]) * s, "#e9d3b4", "#b88a55", 0))
    o.append(t(Xp(g.WRAP_D) + 6, Yp(-50), "record ledge, 7 deep, 134 long:", 9.5, "start", 600, "#7a5130"))
    o.append(t(Xp(g.WRAP_D) + 6, Yp(-50) + 12, "4 LPs face-out, from the upright", 9.5, "start", 400, MUTED))
    o.append(rect(Xp(2), Yp(g.CHAISE_END_Z), 95 * s, (g.CHAISE_END_Z + 240) * s, "#ecebe6", "#b9b4a8", 6, 1.2, 'fill-opacity="1"'))
    o.append(rect(Xp(0), Yp(g.PC_SHELF_Z[0]), g.PC_SHELF_D * s, (g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1]) * s, "#f1e4d2", "#c9a77a", 2))
    o.append(rect(Xp(2.5), Yp(g.PC_Z[0]), g.PC_CASE[0] * s, g.PC_CASE[2] * s, GAME_F, GAME_S, 3))
    o.append(t(Xp(14), Yp(-152), "PC", 12, "middle", 650))
    o.append(f'<line x1="{Xp(25.5)}" y1="{Yp(g.PC_Z[0])}" x2="{Xp(25.5)}" y2="{Yp(g.PC_Z[1])}" stroke="#2fa47a" stroke-width="4"/>')
    o.append(t(Xp(30), Yp(-150), "glass to the room", 9.5, "start", 600, "#2fa47a"))
    if g.PLAIN:   # v13: no screen; a brush grommet at the back corner, leads straight into conduit in the wall
        o.append(f'<circle cx="{Xp(3.4):.1f}" cy="{Yp(g.PC_SHELF_Z[1] + 4):.1f}" r="{2.4 * s:.1f}" fill="#3a3b3f"/>')
        o.append(t(Xp(30), Yp(g.PC_Z[1] - 3) + 4, "brush grommet: leads into the wall", 9.5, "start", 500, VIN_S))
    else:
        o.append(rect(Xp(1), Yp(g.PC_Z[1] - 2.5), 26 * s, 2 * s, "#d9b48a", VIN_S, 1))
        o.append(t(Xp(30), Yp(g.PC_Z[1] - 3) + 4, "slatted screen over the ports", 9.5, "start", 500, VIN_S))
    o.append(rect(Xp(4), Yp(g.PC_SHELF_Z[1] + 23), 9 * s, 18 * s, "#e8e6e1", "#9a958b", 2))
    o.append(t(Xp(30), Yp(g.PC_SHELF_Z[1] + 14) + 4, "pad dock", 9.5, "start", 500, MUTED))
    o.append(t(Xp(60), Yp(-215), "the sofa's return", 10, "middle", 600, MUTED))
    o.append(t(Xp(60), Yp(-215) + 12, "(chaise end at the top)", 9, "middle", 400, MUTED))
    # elevation, looking at the side wall from the room: the alcove on the right
    ex, ey = 478, 432
    k = 1.32
    E = lambda z: ex + (z + 240) * k
    V = lambda y: ey - y * k
    o.append(t(ex - 40, 70, "From the room, looking at the side wall", 12, "start", 600))
    o.append(f'<line x1="{E(-240)}" y1="{V(0)}" x2="{E(g.ALC_D)}" y2="{V(0)}" stroke="#b9b4a8" stroke-width="1.4"/>')
    o.append(f'<line x1="{E(-240)}" y1="{V(g.CEIL)}" x2="{E(g.ALC_D)}" y2="{V(g.CEIL)}" stroke="#b9b4a8" stroke-width="1.4"/>')
    o.append(rect(E(g.ALC_D - g.UP_D), V(g.CEIL), g.UP_D * k, (g.CEIL - g.WORKTOP) * k, "#f1e1c8", "#b88a55", 0))
    o.append(rect(E(g.BASE_FRONT_Z), V(g.WORKTOP), (g.ALC_D - g.BASE_FRONT_Z) * k, g.WORKTOP * k, "#f1e4d2", "#c9a77a", 0))
    o.append(rect(E(g.WRAP_Z[1]), V(g.LEDGE_TOP), (g.WRAP_Z[0] - g.WRAP_Z[1]) * k, 2.4 * k, "#e9dccb", "#b88a55", 0))
    for i in range(4):
        z1 = g.WRAP_Z[0] - 1.5 - i * (g.LP + 1.4)
        o.append(rect(E(z1 - g.LP), V(g.LEDGE_LP_TOP), g.LP * k, 31.1 * k, VIN_F, VIN_S, 0, 0.8))
    o.append(rect(E(g.PC_SHELF_Z[1]), V(g.PC_SHELF_TOP), (g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1]) * k, 4 * k, "#e9dccb", "#b88a55", 0))
    o.append(rect(E(g.PC_Z[1]), V(g.PC_SHELF_TOP + g.PC_CASE[1]), g.PC_CASE[2] * k, g.PC_CASE[1] * k, GAME_F, GAME_S, 2))
    o.append(t(E((g.PC_Z[0] + g.PC_Z[1]) / 2), V(180), "PC", 10.5, "middle", 650))
    # the sofa's return in side view: seat 45, back 80
    o.append(f'<path d="M{E(-240)},{V(0)} L{E(-240)},{V(g.SOFA_H)} L{E(g.CHAISE_END_Z + 22)},{V(g.SOFA_H)} L{E(g.CHAISE_END_Z + 22)},{V(62)} L{E(g.CHAISE_END_Z)},{V(62)} L{E(g.CHAISE_END_Z)},{V(0)}" fill="#ecebe6" stroke="#b9b4a8"/>')
    o.append(t(E(-200), V(40), "sofa", 9.5, "middle", 600, MUTED))
    hx = E(-240) - 6
    for hgt, lab in [(g.SOFA_H, f"{_fmt(g.SOFA_H)} sofa back"), (g.PC_SHELF_TOP - g.PC_SHELF_T, f"{_fmt(g.PC_SHELF_TOP - g.PC_SHELF_T)} shelf underside"),
                     (g.PC_SHELF_TOP + g.PC_CASE[1], f"{_fmt(g.PC_SHELF_TOP + g.PC_CASE[1])} PC top"), (g.CEIL, f"{_fmt(g.CEIL)}")]:
        o.append(f'<line x1="{hx - 3}" y1="{V(hgt)}" x2="{hx + 3}" y2="{V(hgt)}" stroke="#9a958b"/>')
        o.append(t(hx - 6, V(hgt) + 3.5, lab, 9, "end", 400, MUTED))
    o.append(t(E(-100), V(118), f"{_fmt(g.PC_SHELF_TOP - g.PC_SHELF_T - g.SOFA_H)} cm between the sofa's back and the shelf", 9.5, "middle", 600, BLUE))
    return svg(W, H, "\n".join(o), "The side wall: the ledge wraps the corner, the PC sits above the sofa",
               "One oak line at 155.4 cm: the record ledge from the upright, then the PC shelf over the end of the sofa, clear of the TV's sightlines")


def section():
    """A: through the middle of the alcove. B: through the turntable zone. Both to scale, room on the left."""
    W, H = 860, 710
    o = []
    s = 2.3
    g = G
    oy = 650
    Y = lambda cm: oy - cm * s
    # ---- A: through the alcove at the TV's centre line
    ox = 742
    Z = lambda cm: ox - cm * s      # cm in front of the alcove's back wall
    o.append(t(Z(150), 76, "A · Through the TV", 12, "start", 600))
    o.append(f'<line x1="{Z(-6)}" y1="{Y(0)}" x2="{Z(150)}" y2="{Y(0)}" stroke="#8f8a80" stroke-width="1.6"/>')
    o.append(f'<line x1="{Z(-6)}" y1="{Y(g.CEIL)}" x2="{Z(150)}" y2="{Y(g.CEIL)}" stroke="#8f8a80" stroke-width="1.6"/>')
    o.append(f'<rect x="{Z(0)}" y="{Y(g.CEIL)}" width="14" height="{g.CEIL*s}" fill="#dcd8cf"/>')
    o.append(t(Z(0) + 18, Y(120), "back wall", 9.5, "start", 400, MUTED))
    o.append(f'<line x1="{Z(g.ALC_D)}" y1="{Y(0)}" x2="{Z(g.ALC_D)}" y2="{Y(g.CEIL)}" stroke="#c9b6a4" stroke-dasharray="6 4"/>')
    o.append(t(Z(g.ALC_D) - 3, Y(g.CEIL) + 14, f"breast face, {_fmt(g.ALC_D)} out", 9, "end", 500, "#9a7b62"))
    o.append(t(Z(150), Y(g.CEIL) - 6, f"ceiling {_fmt(g.CEIL)}", 9.5, "start", 400, MUTED))
    o.append(f'<rect x="{Z(g.UP_D)}" y="{Y(g.CEIL)}" width="{g.UP_D*s}" height="{(g.CEIL-g.WORKTOP)*s}" fill="#f1e1c8" stroke="#b88a55" stroke-dasharray="5 3"/>')
    o.append(t(Z(15), Y(176), "oak upright", 9.5, "middle", 600, "#9c6a3f"))
    o.append(t(Z(15), Y(176) + 12, "beyond, 30 deep", 9, "middle", 400, MUTED))
    o.append(rect(Z(g.HIGH_D), Y(g.HIGH_TOP), g.HIGH_D * s, g.HIGH_T * s, "#e9dccb", "#c9a77a", 1))
    o.append(t(Z(g.HIGH_D) - 4, Y(g.HIGH_TOP) + 4, f"high shelf {_fmt(g.HIGH_D)} deep, top {_fmt(g.HIGH_TOP)}", 9.5, "end", 500))
    o.append(rect(Z(18), Y(g.HIGH_TOP + 28), 17 * s, 28 * s, GAME_F, GAME_S, 2))
    o.append(rect(Z(g.LEDGE_D), Y(g.LEDGE_TOP), g.LEDGE_D * s, (g.LEDGE_TOP - g.LEDGE_UNDER) * s, "#e9dccb", "#c9a77a", 1))
    o.append(f'<line x1="{Z(4.6)}" y1="{Y(g.LEDGE_TOP)}" x2="{Z(0.3)}" y2="{Y(g.LEDGE_LP_TOP)}" stroke="{VIN_S}" stroke-width="3"/>')
    o.append(t(Z(g.LEDGE_D) - 4, Y(g.LEDGE_TOP) + 4, f"record ledge 7 deep, top {_fmt(g.LEDGE_TOP)}", 9.5, "end", 500))
    pz0, pz1 = g.ALC_D - g.TV_PANEL_Z[1], g.ALC_D - g.TV_PANEL_Z[0]
    o.append(rect(Z(pz1), Y(g.TV_TOP), (pz1 - pz0) * s, g.TV_H * s, "#e3e2de", "#b9b4a8", 2))
    o.append(rect(Z(25), Y(g.WORKTOP + 1.6), 23 * s, 1.6 * s, "#d8d5ce", "#bdb8ad", 1))
    o.append(t(Z(pz1) - 4, Y(119), "TV on its stand, centre 116.5", 9.5, "end", 500))
    o.append(rect(Z(45), Y(g.WORKTOP + 6), 9 * s, 6 * s, SND_F, SND_S, 2))
    o.append(t(Z(40.5), Y(g.WORKTOP + 6) - 4, "soundbar", 9, "middle", 500))
    o.append(rect(Z(g.BASE_D), Y(g.WORKTOP), g.BASE_D * s, 3 * s, "#e9dccb", "#c9a77a", 1))
    o.append(t(Z(g.BASE_D) - 4, Y(g.WORKTOP) + 3, f"oak worktop {_fmt(g.BASE_D)} deep, top 76", 9.5, "end", 500))
    o.append(t(Z(g.BASE_D) - 4, Y(g.WORKTOP) + 15, "slot behind the TV for its leads", 9, "end", 400, MUTED))
    fz0 = g.CHAN
    o.append(f'<rect x="{Z(fz0 + g.FRAME_D)}" y="{Y(73)}" width="{g.FRAME_D*s}" height="{64*s}" fill="#fbfaf7" stroke="#8f8a80" stroke-width="1.3"/>')
    o.append(f'<rect x="{Z(fz0 + 38)}" y="{Y(9)}" width="{36*s}" height="{9*s}" fill="#efe2c8" stroke="#c9a77a"/>')
    o.append(t(Z(fz0 + 20), Y(4.5) + 3.5, "plinth + drawer", 9, "middle", 500))
    o.append(t(Z(fz0 + 20), Y(44), "BESTÅ frame", 10, "middle", 600))
    o.append(t(Z(fz0 + 20), Y(44) + 12, "60 × 40 × 64", 9.5, "middle", 400, MUTED))
    o.append(t(Z(fz0 + 20), Y(44) + 24, "back panel off", 9.5, "middle", 400, MUTED))
    o.append(f'<line x1="{Z(fz0)}" y1="{Y(67)}" x2="{Z(0)}" y2="{Y(67)}" stroke="#555" stroke-width="2.5"/>')
    o.append(rect(Z(3.2), Y(34), 2.6 * s, 26 * s, "#eef2fb", BLUE, 1, 1, 'stroke-dasharray="3 2"'))
    o.append(rect(Z(g.BASE_D), Y(73), g.FACE * s, 73 * s, "#ecd3ae", "#b88a55", 0))
    o.append(t(Z(g.BASE_D) - 4, Y(36), "oak face frame 2;", 9.5, "end", 500, "#9c6a3f"))
    o.append(t(Z(g.BASE_D) - 4, Y(36) + 12, "its bottom rail hides", 9.5, "end", 400, MUTED))
    o.append(t(Z(g.BASE_D) - 4, Y(36) + 24, "the plinth", 9.5, "end", 400, MUTED))
    for yy, lab, col in [(67, "anti-tip bracket", INK), (22, "4 cm channel", BLUE)]:
        o.append(f'<line x1="{Z(0.5)}" y1="{Y(yy)}" x2="{Z(-3)}" y2="{Y(yy)}" stroke="#b9b4a8"/>')
        o.append(t(Z(-3) + 3, Y(yy) + 3.5, lab, 9, "start", 500, col))
    o.append(f'<line x1="{Z(0)}" y1="{Y(-8)}" x2="{Z(g.BASE_D)}" y2="{Y(-8)}" stroke="{MUTED}"/>')
    o.append(t((Z(0) + Z(g.BASE_D)) / 2, Y(-8) + 14, f"{_fmt(g.BASE_D)}: {_fmt(g.BASE_PROUD)} proud of the breast", 9.5, "middle", 400, MUTED))
    # ---- B: through the turntable zone
    bx = 360
    Q = lambda cm: bx - cm * s
    o.append(t(10, 76, "B · Through the turntable zone", 12, "start", 600))
    o.append(f'<line x1="{Q(-6)}" y1="{Y(0)}" x2="{Q(130)}" y2="{Y(0)}" stroke="#8f8a80" stroke-width="1.6"/>')
    o.append(f'<line x1="{Q(-6)}" y1="{Y(g.CEIL)}" x2="{Q(130)}" y2="{Y(g.CEIL)}" stroke="#8f8a80" stroke-width="1.6"/>')
    o.append(f'<rect x="{Q(0)}" y="{Y(g.CEIL)}" width="14" height="{g.CEIL*s}" fill="#dcd8cf"/>')
    o.append(f'<line x1="{Q(g.ALC_D)}" y1="{Y(0)}" x2="{Q(g.ALC_D)}" y2="{Y(g.CEIL)}" stroke="#c9b6a4" stroke-dasharray="6 4"/>')
    o.append(f'<rect x="{Q(g.CHAN + 40)}" y="{Y(73)}" width="{40*s}" height="{73*s}" fill="#fbf3ec" stroke="#8f8a80" stroke-width="1.3"/>')
    for yb in (g.TRAY_LOWER[0], g.TRAY_UPPER[0]):
        o.append(f'<rect x="{Q(g.CHAN + 40)}" y="{Y(yb + 12)}" width="{40*s}" height="{12*s}" fill="none" stroke="#c9a77a"/>')
        o.append(f'<line x1="{Q(g.CHAN + 36)}" y1="{Y(yb + 1.2)}" x2="{Q(g.CHAN + 31)}" y2="{Y(yb + 31)}" stroke="{VIN_S}" stroke-width="2.2"/>')
    o.append(t(Q(g.CHAN + 20), Y(56), "upper tray", 9.5, "middle", 600))
    o.append(t(Q(g.CHAN + 20), Y(20), "lower tray", 9.5, "middle", 600))
    o.append(rect(Q(g.BASE_D), Y(g.WORKTOP), g.BASE_D * s, 3 * s, "#e9dccb", "#c9a77a", 1))
    o.append(rect(Q(g.BASE_D), Y(73), g.FACE * s, 73 * s, "#ecd3ae", "#b88a55", 0))
    dz0, dz1 = g.ALC_D - g.DECK_Z[1], g.ALC_D - g.DECK_Z[0]
    o.append(rect(Q(dz1), Y(g.WORKTOP + g.DECK[1]), g.DECK[2] * s, g.DECK[1] * s, VIN_F, VIN_S, 2))
    o.append(t(Q((dz0 + dz1) / 2), Y(g.WORKTOP + 5), "deck", 9.5, "middle", 600))
    o.append(f'<path d="M{Q(dz0 + 1)},{Y(g.WORKTOP + g.DECK_BODY_H)} L{Q(dz0 + 3)},{Y(g.LID_TOP_OPEN)}" stroke="#9a958b" stroke-width="2" stroke-dasharray="4 3"/>')
    o.append(t(Q(dz0 + 4), Y(g.LID_TOP_OPEN) - 4, f"lid open, about {_fmt(round(g.LID_TOP_OPEN))}", 9, "end", 500, MUTED))
    o.append(rect(Q(g.RZ_SHELF_D), Y(g.RZ_SHELF_TOP), g.RZ_SHELF_D * s, g.RZ_SHELF_T * s, "#e9dccb", "#c9a77a", 1))
    o.append(t(Q(g.RZ_SHELF_D) - 4, Y(g.RZ_SHELF_TOP) + 4, f"Series X shelf, top {_fmt(g.RZ_SHELF_TOP)}", 9.5, "end", 500))
    o.append(rect(Q(1.5 + g.PREAMP[2]), Y(g.RZ_SHELF_TOP - g.RZ_SHELF_T), g.PREAMP[2] * s, g.PREAMP[1] * s, VIN_F, VIN_S, 1))
    o.append(t(Q(1.5 + g.PREAMP[2]) - 4, Y(g.RZ_SHELF_TOP - 7), "preamp, hung under", 9, "end", 500, VIN_S))
    zs = 4.0
    o.append(rect(Q(g.RZ_SHELF_D - zs), Y(g.RZ_SHELF_TOP + 6.5), 20.5 * s, 6.5 * s, GAME_F, GAME_S, 1))
    o.append(rect(Q(g.RZ_SHELF_D - zs - 2.7), Y(g.SX_TOP), 15.1 * s, 30.1 * s, GAME_F, GAME_S, 2))
    o.append(t(Q(g.RZ_SHELF_D - zs + 6) - 6, Y(150), "Series X", 9.5, "end", 600, GAME_S))
    o.append(t(Q(g.RZ_SHELF_D - zs + 6) - 6, Y(150) + 12, f"{_fmt(g.HIGH_UNDER - g.SX_TOP)} clear above", 9, "end", 400, MUTED))
    o.append(rect(Q(g.HIGH_D), Y(g.HIGH_TOP), g.HIGH_D * s, g.HIGH_T * s, "#e9dccb", "#c9a77a", 1))
    if g.MW_SWAP:   # v38: over the turntable now, the framed 7-inch and the print lean on the wall; Deco B is at the breast end
        o.append(rect(Q(1.6), Y(g.HIGH_TOP + 21.3), 1.6 * s, 21.3 * s, VIN_F, VIN_S, 1))
        o.append(t(Q(1.6) - 6, Y(g.HIGH_TOP + 10), "framed 7-inch and print", 9, "end", 600, VIN_S))
    else:
        o.append(rect(Q(16), Y(g.HIGH_TOP + 11.4), 11 * s, 11.4 * s, "#fff", LINE, 6))
        o.append(t(Q(10.5), Y(g.HIGH_TOP + 16), "Deco B", 9, "middle", 600))
    o.append(f'<line x1="{Q(0)}" y1="{Y(-8)}" x2="{Q(g.BASE_D)}" y2="{Y(-8)}" stroke="{MUTED}"/>')
    o.append(t((Q(0) + Q(g.BASE_D)) / 2, Y(-8) + 14, f"deck 35.2 deep on a {_fmt(g.BASE_D)} worktop", 9.5, "middle", 400, MUTED))
    return svg(W, H, "\n".join(o), "How the wall goes together, layer by layer",
               "Side sections to scale, room on the left. Dashed: the upright and the breast's face beyond the cut, and the deck's lid open")


def why_layout():
    W, H = 860, 400
    s = 2.55
    ox = 20
    X = lambda cm: ox + cm * s
    o = []
    def strip(y, segs, h=34):
        for a, b, lab, kind in segs:
            f, st = {"g": (GAME_F, GAME_S), "v": (VIN_F, VIN_S), "s": (SND_F, SND_S), "o": ("#e9d3b4", "#b88a55"), "w": ("#f1efe9", "#bdb8ad"), "d": ("#f1e1c8", "#9c6a3f")}[kind]
            o.append(f'<rect x="{X(a)}" y="{y}" width="{(b-a)*s}" height="{h}" fill="{f}" stroke="{st}" stroke-width="1"/>')
            if lab:
                o.append(t((X(a) + X(b)) / 2, y + h / 2 + 4, lab, 9.5, "middle", 500))
    g = G
    o.append(t(0, 62, "v10: the TV in the middle, the vinyl cabinet on the breast", 12, "start", 650))
    strip(74, [(0, 25.25, "Series X", "g"), (25.25, 29.75, "", "o"), (29.75, 156.25, "TV gap 126.5", "w"), (156.25, 160.75, "", "o"), (160.75, 186, "dock", "w"),
               (186, 286, "vinyl cabinet: deck + browser on top", "v")])
    strip(112, [(0, 3, "", "w"), (3, 63, "Xbox 60", "g"), (63, 123, "PlayStation 60", "g"), (123, 183, "sub 60", "s"), (183, 186, "", "w"), (186, 286, "record trays · LPs", "v")])
    o.append(t(X(g.BREAST_X[1]) + 8, 95, "above the worktop", 9.5, "start", 400, MUTED))
    o.append(t(X(g.BREAST_X[1]) + 8, 133, "below the worktop", 9.5, "start", 400, MUTED))
    o.append(t(0, 172, f"v11: the TV {_fmt(g.TV_SHIFT)} cm nearer the side wall, the dining wall on the breast", 12, "start", 650))
    strip(186, [(g.UP_L[0], g.UP_L[1], "", "o"), (g.UP_L[1], g.UP_R[0], f"TV gap {_fmt(g.TV_GAP)}", "w"), (g.UP_R[0], g.UP_R[1], "", "o"),
                (g.RZ[0], g.RZ[1], f"turntable {_fmt(g.RZ_W)}", "v"), (g.TABLE_X[0], g.TABLE_X[1], "fold-down table", "d")])
    strip(224, [(0, 3, "", "w"), (3, 63, "Xbox 60", "g"), (63, 123, "PlayStation 60", "g"), (123, 183, "record trays 60", "v"), (183, 186, "", "w"),
                (g.TABLE_X[0], g.TABLE_X[1], "brackets fold flat", "d")])
    o.append(f'<line x1="{X(0)}" y1="276" x2="{X(g.ALC_W)}" y2="276" stroke="{MUTED}"/>')
    o.append(t(X(g.ALC_W / 2), 290, f"alcove {_fmt(g.ALC_W)}: the TV's gap from the side wall, then a {_fmt(g.RZ_W)} cm zone", 9.5, "middle", 400, MUTED))
    o.append(t(X(g.TABLE_CX), 290, f"breast {_fmt(g.BREAST_W)}", 9.5, "middle", 400, MUTED))
    notes = [f"Moving the TV {_fmt(g.TV_SHIFT)} cm left joins the two {_fmt(25.25)} cm side gaps into one {_fmt(g.RZ_W)} cm zone: wide enough for a 45.2 cm turntable, with 2.65 cm each side.",
             "The Series X moves up onto a shelf over the deck, above the lid's swing, with 15 cm of air each side. The records sit in bay 3, right under the deck.",
             "That frees the chimney breast for a fold-down dining table; the sub, which is wireless, moves to the floor by the side wall."]
    for i, n in enumerate(notes):
        o.append(t(0, 326 + i * 20, "• " + n, 10, "start", 400, INK))
    return svg(W, H, "\n".join(o), "What moved in v11",
               "To scale, from the side wall. Top: v10. Bottom: v11")



if __name__ == "__main__":
    for name, fn in [("network", network), ("front", front), ("drawer", drawer), ("sound", sound), ("game", game_drawer), ("av", av), ("power", power),
                     ("routes", routes), ("pcshelf", pc_shelf), ("section", section), ("joints", joints), ("house", house), ("living", living_plan),
                     ("why", why_layout), ("seating", seating), ("dining", dining_section)]:
        open(f"d_{name}.svg", "w").write(fn().replace('width="100%"', 'width="860"'))
    print("ok")


# ------------------------------------------------------------------ v12: storage options, every space to one scale
def storage():
    """What fits each space in the wall, drawn to one scale (2.2 px per cm), with counts and the overflow options."""
    g = G
    k = 2.2
    W, H = 900, 1080
    o = []
    OAKF, OAKL = "#e7cfae", "#b98a55"
    DARK = "#3b3833"; LP_C = ["#d24a3a", "#1f3a52", "#f0c24b", "#14806d", "#e8603c", "#6a8f5a"]

    def panel(x, y, w, h, title, sub):
        o.append(rect(x, y, w, h, "#fbfaf6", "#e2ded4", 10))
        o.append(t(x + 14, y + 22, title, 12.5, "start", 650))
        o.append(t(x + 14, y + 38, sub, 10.5, "start", 400, MUTED))

    def space(x, y, wcm, hcm, label=None):
        o.append(rect(x, y, wcm * k, hcm * k, "#fff", OAKL, 2, 1.6))
        if label:
            o.append(t(x + wcm * k / 2, y + hcm * k + 13, label, 9.5, "middle", 500, MUTED))

    def item(x, y, wcm, hcm, fill, label=None, col="#fff", size=8.5):
        o.append(rect(x, y, wcm * k, hcm * k, fill, "none", 1.5, 0))
        if label:
            o.append(t(x + wcm * k / 2, y + hcm * k / 2 + 3, label, size, "middle", 600, col))

    # A · bays 1 and 2, front view inside each frame
    x0, y0 = 0, 56
    panel(x0, y0, 440, 250, "Bays 1 and 2: inside each BESTÅ frame", "56.8 wide × 40 deep inside; rows as planned, front view")
    if g.SUB_IN_WALL:   # v13.5: the bricks at the back of their rows (not seen from the front); the sub's column in bay 2
        bays_ = (("Bay 1 · Xbox", [(16, [(33.3, 7.9, DARK, "Xbox One"), (12.7, 2.5, "#55524c", "switch")]),
                                   (16, [(30.9, 8.3, "#e9e6df", "Xbox 360"), (20, 4.5, "#8a8a90", "RetroTINK")]),
                                   (25.2, [(54.3, 15, OAKF, "game drawer · ~48")])]),
                 ("Bay 2 · PlayStation + sub", [(23.7, [(32.5, 9.8, DARK, "PS3"), (20, 12, "#c9b48e", "pads")]),
                                                (16.5, [(24.6, 0.01, "none", None), (30.2, 7.8, DARK, "PS2")]),
                                                (17, [(24.6, 0.01, "none", None), (27, 6, "#d8d5ce", "PS1")])]))
    else:
        bays_ = (("Bay 1 · Xbox", [(16, [(33.3, 7.9, DARK, "Xbox One"), (17, 4.8, "#55524c", "brick")]),
                                   (16, [(30.9, 8.3, "#e9e6df", "Xbox 360"), (21, 6, "#55524c", "brick")]),
                                   (25.2, [(54.3, 15, OAKF, "game drawer · ~48")])]),
                 ("Bay 2 · PlayStation", [(23.7, [(32.5, 9.8, DARK, "PS3"), (20, 12, "#c9b48e", "pads")]),
                                          (16.5, [(30.2, 7.8, DARK, "PS2"), (12.7, 2.5, "#55524c", "switch")]),
                                          (17, [(27, 6, "#d8d5ce", "PS1"), (23, 8, "#8a8a90", "RetroTINK")])]))
    for b, (name, rows) in enumerate(bays_):
        bx, by = x0 + 22 + b * 208, y0 + 58
        space(bx, by, 56.8, 59.4, name)
        yy = by
        for rh, things in rows:
            xx = bx + 2
            for (w_, h_, f_, lab) in things:
                item(xx, yy + (rh - h_) * k, w_, h_, f_, lab, "#fff" if f_ in (DARK, "#55524c", "#8a8a90") else INK, 7.5)
                xx += w_ * k + 3
            yy += rh * k
            part = g.SUB_IN_WALL and b == 1 and rh == 16.5        # the part shelf under the PS2 stops at the divider
            o.append(f'<line x1="{bx + (24.6 * k if part else 0):.1f}" y1="{yy:.1f}" x2="{bx + 56.8 * k:.1f}" y2="{yy:.1f}" stroke="{OAKL}" stroke-width="1.2"/>')
        if g.SUB_IN_WALL and b == 1:
            sy = by + 23.7 * k
            o.append(f'<line x1="{bx + 24 * k:.1f}" y1="{sy:.1f}" x2="{bx + 24 * k:.1f}" y2="{sy + 35.3 * k:.1f}" stroke="{OAKL}" stroke-width="1.6"/>')
            item(bx + 1 * k, sy + (35.3 - 3 - 29.4) * k, 21.4, 29.4, "#3a3b3e", "sub", "#fff", 8)
            item(bx + 0.5 * k, sy + (35.3 - 3) * k, 22.4, 3, "#8a8a90")
    o.append(t(x0 + 14, y0 + 236, "Swap any 16 cm row for two KUGGIS boxes, 26 × 35 × 15, side by side (52 of 56.8 wide).", 9.5, "start", 400, MUTED))

    # B · bay 3, from above (v16: an LP crate beside a slim game drawer)
    x0, y0 = 460, 56
    panel(x0, y0, 440, 250, "Bay 3 from above: LP crate and slim drawer", f"56.4 inside: a {G.SLIM_BOX_X[1] - G.SLIM_BOX_X[0]:.1f} slim drawer, the divider, a {G.TRAY_BOX[0]:.1f} LP crate")
    tx, ty = x0 + 30, y0 + 62
    space(tx, ty, 56.4, 40)
    sx_ = (G.SLIM_BOX_X[0] - G.B3_IN[0]) * k
    rx_ = (G.REC_BOX_X[0] - G.B3_IN[0]) * k
    item(tx + sx_, ty + 2 * k, G.SLIM_BOX_X[1] - G.SLIM_BOX_X[0], 36, "#e7eefb")
    item(tx + rx_, ty + 2 * k, G.TRAY_BOX[0], 36, "#efe6d6")
    for i in range(5):
        item(tx + rx_ + (0.9 + (G.TRAY_INSIDE - G.LP) / 2) * k, ty + (3 + i * 6.5) * k, G.LP, 5.2, LP_C[i % 6])
        item(tx + sx_ + (G.SLIM_SIDE + (G.SLIM_INSIDE - G.GAME_CASE[0]) / 2) * k, ty + (3 + i * 6.5) * k, G.GAME_CASE[0], 5.2, ["#3a5fb8", "#3f9a4c", "#2a2c31"][i % 3])
    o.append(t(tx + 28 * k, ty + 40 * k + 14, "games | divider | LPs: no dead space", 9.5, "middle", 500, MUTED))
    o.append(t(x0 + 222, y0 + 92, f"≈ {G.TRAY_LPS} LPs a crate, two crates", 12, "start", 650))
    o.append(t(x0 + 222, y0 + 110, f"= {2 * G.TRAY_LPS} LPs, all face-out", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 222, y0 + 128, f"beside them {G.SLIM_GAMES} games face-out", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 222, y0 + 146, "and a drawer for pads and remotes", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 222, y0 + 164, f"trough {G.TRAY_INSIDE:.1f}: thick outer sleeves fit", 10.5, "start", 400, MUTED))

    # C · plinth drawer, from above
    x0, y0 = 0, 326
    panel(x0, y0, 440, 200, "Hidden plinth drawer, from above", "box 52 × 34 × 5 inside, under bay 2; finger pull, not push-to-open")
    px_, py_ = x0 + 30, y0 + 58
    space(px_, py_, 52, 34)
    for i in range(4):
        for j in range(2):
            item(px_ + (0.5 + i * 12.8) * k, py_ + (2 + j * 15) * k, 12.5, 14.2, "#9fb7c9" if (i + j) % 2 else "#b6c9d6", "×4" if (i, j) == (0, 0) else None, INK)
    o.append(t(x0 + 160, y0 + 92, "32 PS1 games flat", 12, "start", 650))
    o.append(t(x0 + 160, y0 + 110, "jewel cases 14.2 × 12.5 × 1, 8 stacks of 4", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 160, y0 + 128, "or: remotes, spare pads, cables, manuals", 10.5, "start", 400, MUTED))

    # D · the ledges and the Series X shelf, front view
    x0, y0 = 460, 326
    panel(x0, y0, 440, 200, "Series X shelf, front view", "50.5 wide, 134 to the high shelf at 192: 58 clear")
    sx_, sy_ = x0 + 30, y0 + 52
    space(sx_, sy_, 50.5, 58)
    item(sx_ + 15 * k, sy_ + (58 - 6.5) * k, 20.5, 6.5, "#1c1d1f")
    item(sx_ + (15 + 2.7) * k, sy_ + (58 - 6.5 - 30.1) * k, 15.1, 30.1, "#151617", "Series X", "#fff", 7.5)
    o.append(t(x0 + 170, y0 + 92, "15 air each side, 21.4 above", 12, "start", 650))
    o.append(t(x0 + 170, y0 + 110, "Microsoft: at least 4 above, 10–15", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 170, y0 + 124, "recommended all round", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 170, y0 + 146, "Under it: the deck, lid opens to 121", 10.5, "start", 400, MUTED))

    # E · high shelf, two ways
    x0, y0 = 0, 546
    panel(x0, y0, 900, 244, "High shelf, front view: as planned, or as LP overflow", ("186 long, 30 deep, 39 clear to the ceiling; the left-hand 50.5 keeps the framed 7-inch and the print" if G.MW_SWAP else "186 long, 30 deep, 39 clear to the ceiling; the right-hand 50.5 keeps Deco B and the framed 7-inch"))
    hx, hy = x0 + 30, y0 + 58
    for row, lab in ((0, "As planned"), (1, "As LP overflow")):
        yy = hy + row * 92
        space(hx, yy, 186, 30)
        o.append(t(hx + 186 * k + 14, yy + 30, lab, 11.5, "start", 650))
        o.append(f'<line x1="{hx + 126.5 * k:.1f}" y1="{yy}" x2="{hx + 126.5 * k:.1f}" y2="{yy + 30 * k}" stroke="{OAKL}" stroke-width="3"/>')
        item(hx + 140 * k, yy + (30 - 11.4) * k, 11, 11.4, "#f3f1ec", "Deco", INK, 7)
        item(hx + 160 * k, yy + (30 - 20) * k, 20, 20, "#1a1a1a", "7-inch", "#fff", 7)
        if row == 0:
            for i in range(40):
                hh = 22 + (i * 7) % 8
                item(hx + (1 + i * 2.5) * k, yy + (30 - hh) * k, 2.3, hh, LP_C[i % 6])
            item(hx + 102 * k, yy + (30 - 14) * k, 22, 14, "#a8a49c", "box", INK, 7.5)
        else:
            n = int(126.5 / 0.33)
            for i in range(0, 126):
                item(hx + i * k, yy + (30 - 30) * k, 0.8, 30, LP_C[i % 6])
            o.append(t(hx, yy + 30 * k + 14, f"≈ {n // 10 * 10} LPs spine-out at about 3.3 mm each; a 31.4 sleeve overhangs the 30 cm shelf by 1.4", 9.5, "start", 500, MUTED))
    o.append(t(x0 + 30, y0 + 58 + 30 * k + 14, "about 1 m of books, a lidded box, a print", 9.5, "start", 500, MUTED))

    # F · PC shelf, from above, and the keyboard tray
    x0, y0 = 0, 802
    panel(x0, y0, 440, 220, "PC shelf, from above", "82 along the wall × 28 out, at 155.4; keyboard tray in a 7 cm housing under it")
    sx_, sy_ = x0 + 26, y0 + 56
    space(sx_, sy_, 82, 28, "side wall along the top · alcove to the right")
    item(sx_ + (82 - 4 - 45) * k, sy_ + 2.5 * k, 45, 23, "#121314", "PC 45 × 23", "#fff", 8)
    item(sx_ + (82 - 4 - 45 - 2.5 - 2) * k, sy_ + 1 * k, 2, 26, OAKL)
    item(sx_ + 6 * k, sy_ + 4 * k, 18, 9, "#3a3b3f", "pads", "#fff", 7.5)
    o.append(t(x0 + 26, y0 + 56 + 28 * k + 34, "Keyboard tray: 300 mm runners, rolls 25 cm out; the housing stops 12 short", 10, "start", 400, MUTED))
    o.append(t(x0 + 26, y0 + 56 + 28 * k + 48, "of the sofa end so the cables drop past it. Full-size wireless keyboard and mouse.", 10, "start", 400, MUTED))

    # G · overflow
    x0, y0 = 460, 802
    panel(x0, y0, 440, 220, "If the collection outgrows the wall", "two overflow options, both face-out or spine-out to match")
    o.append(t(x0 + 14, y0 + 66, "1 · LPs spine-out on the high shelf: about 380 more", 11.5, "start", 650))
    o.append(t(x0 + 14, y0 + 82, "No building; books move to the second option's top.", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 14, y0 + 110, "2 · A second record unit, west of the sofa, under the window", 11.5, "start", 650))
    o.append(t(x0 + 14, y0 + 126, "Another LP column like bay 3 (40 × 46 × 73, two crates): 180 LPs.", 10.5, "start", 400, MUTED))
    o.append(t(x0 + 14, y0 + 142, "At x 300–360 it leaves 123 cm to the table set for six (100 to walk).", 10.5, "start", 400, MUTED))
    space(x0 + 30, y0 + 158, 60, 20)
    item(x0 + 30 + 2 * k, y0 + 158 + 3 * k, 26.6, 14, "#efe6d6", "tray", INK, 7.5)
    item(x0 + 30 + 31 * k, y0 + 158 + 3 * k, 26.6, 14, "#efe6d6", "tray", INK, 7.5)
    o.append(t(x0 + 30 + 60 * k + 12, y0 + 158 + 26, "front view, 60 × 73 (shown at half height)", 9.5, "start", 400, MUTED))

    o.append(t(0, H - 26, "All to one scale, 2.2 px per cm. Sizes: KUGGIS box 26 × 35 × 15 (IKEA); jewel case 142 × 125 × 10 mm (Wikipedia: Optical disc packaging);", 10, "start", 400, MUTED))
    o.append(t(0, H - 12, "consoles, sleeves, Series X and the trays from the fit proof (section 3 of the plan).", 10, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "Storage options: what fits each space, to scale",
               "Front views and views from above of every storage space in the wall, with counts, and where the overflow would go")


def drawer_layouts():
    """v13, client: "show the drawer layouts". Where every drawer sits in the base (front view), then each one from
    above, all to one scale, with its compartments, what goes in them and how many, and its runners."""
    g = G
    W, H = 1120, 820
    o = []
    OAKF, OAKL, PLY = "#efe2c8", "#b98a55", "#f1dfc4"
    GA, GB, GC = "#5b8ad6", "#7c8a99", VIN_S         # game drawer, plinth drawer, record trays
    LP_C = ["#d24a3a", "#1f3a52", "#f0c24b", "#14806d", "#e8603c", "#6a8f5a"]

    # ---- A: the base from the front, 3.6 px per cm, each drawer picked out
    k = 3.6
    ox, oy = 40, 96 + 76 * k
    X = lambda cm: ox + cm * k
    Y = lambda cm: oy - cm * k
    o.append(t(0, 70, "Where each drawer is: the alcove base from the front", 12.5, "start", 650))
    o.append(f'<rect x="{X(0)}" y="{Y(76)}" width="{g.ALC_W * k}" height="{3 * k}" fill="#e9dccb" stroke="#c9b79f"/>')
    o.append(f'<rect x="{X(0)}" y="{Y(73)}" width="{g.ALC_W * k}" height="{73 * k}" fill="#fbfaf6" stroke="#8f8a80" stroke-width="1.3"/>')
    for (a, b) in g.BAYS:
        o.append(f'<rect x="{X(a)}" y="{Y(73)}" width="{(b - a) * k}" height="{73 * k}" fill="none" stroke="#cfcabf"/>')
    o.append(f'<rect x="{X(g.BAYS[0][0])}" y="{Y(g.PLINTH)}" width="{(g.BAYS[1][1] - g.BAYS[0][0]) * k}" height="{g.PLINTH * k}" fill="{OAKF}" stroke="#c9a77a"/>')
    for i, (a, b) in enumerate(g.BAYS):
        o.append(t(X((a + b) / 2), Y(76) - 8, g.BAY_NAMES[i], 10.5, "middle", 600, MUTED))
    def mark(x1, x2, y1, y2, col, letter, lab):
        o.append(f'<rect x="{X(x1)}" y="{Y(y2)}" width="{(x2 - x1) * k}" height="{(y2 - y1) * k}" fill="{col}" fill-opacity="0.22" stroke="{col}" stroke-width="1.6"/>')
        o.append(f'<circle cx="{X((x1 + x2) / 2)}" cy="{Y((y1 + y2) / 2)}" r="11" fill="#fff" stroke="{col}" stroke-width="1.6"/>')
        o.append(t(X((x1 + x2) / 2), Y((y1 + y2) / 2) + 4.5, letter, 12, "middle", 700, col))
        return lab
    b1, b2, b3 = g.BAYS
    pxa, pxb = g.PLINTH_DRAWER["x"]
    labs = [
        mark(b1[0] + 1.6, b1[1] - 1.6, g.PLINTH + 2.6, g.PLINTH + 2.6 + 15.5, GA, "A", "A · Game drawer: bay 1, bottom row (11.6–27.1 up)"),
        mark(pxa, pxb, g.PLINTH_DRAWER["y"][0], g.PLINTH_DRAWER["y"][1], GB, "B", "B · Plinth drawer: hidden under bay 2 (1.6–7.6 up)"),
        mark(g.REC_BOX_X[0], g.REC_BOX_X[1], g.TRAY_UPPER[0], g.TRAY_UPPER[0] + 12, GC, "C", f"C · Upper LP crate: bay 3, right ({g.TRAY_UPPER[0]:g}–{g.TRAY_UPPER[2]:g} up)"),
        mark(g.REC_BOX_X[0], g.REC_BOX_X[1], g.TRAY_LOWER[0], g.TRAY_LOWER[0] + 12, GC, "D", f"D · Lower LP crate: bay 3, right ({g.TRAY_LOWER[0]:g}–{g.TRAY_LOWER[2]:g} up)"),
    ] + [mark(g.SLIM_BOX_X[0], g.SLIM_BOX_X[1], d_["yb"], d_["yb"] + 10, GA, L_, f"{L_} · Slim drawer, {'pads and remotes' if d_['kind'] == 'pads' else 'games'}: bay 3, left ({d_['yb']:g} up)")
         for L_, d_ in zip("GFE", reversed(G.SLIM_DRAWERS))][::-1]
    # the fixed rows, faint, for orientation
    for (x1, x2, y1, y2, lab) in [(b1[0] + 5, b1[0] + 38.3, 46.4 + 9, 54.3 + 9, "Xbox One"), (b1[0] + 5, b1[0] + 35.9, 28.6 + 9, 36.9 + 9, "Xbox 360"),
                                  (b2[0] + 3.5, b2[0] + 36, 38.7 + 9, 48.5 + 9, "PS3"), (b2[0] + 3.5, b2[0] + 33.7, 20.4 + 9, 28.2 + 9, "PS2"),
                                  (b2[0] + 3.5, b2[0] + 30.5, 1.6 + 9, 7.6 + 9, "PS1")]:
        o.append(f'<rect x="{X(x1)}" y="{Y(y2)}" width="{(x2 - x1) * k}" height="{(y2 - y1) * k}" fill="#eceae4" stroke="#d6d2c8"/>')
        o.append(t(X((x1 + x2) / 2), Y((y1 + y2) / 2) + 3.5, lab, 9, "middle", 500, MUTED))
    o.append(f'<line x1="{X(0)}" y1="{oy}" x2="{X(g.ALC_W)}" y2="{oy}" stroke="#9a958b" stroke-width="1.4"/>')
    o.append(t(X(g.ALC_W / 2), oy + 18, f"{g.ALC_W:g} wide: 3 + 60 + 60 + 60 + 3 · worktop at 76 · front view, 3.6 px per cm", 10, "middle", 400, MUTED))
    lx = X(g.ALC_W) + 28
    for i, lab in enumerate(labs):
        col = (GA, GB, GC, GC, GA, GA, GA)[i]
        o.append(f'<circle cx="{lx + 9}" cy="{Y(66) + i * 26 - 4}" r="5" fill="{col}"/>')
        o.append(t(lx + 22, Y(66) + i * 26, lab, 10.5, "start", 600))
    n_ = len(labs)
    o.append(t(lx + 22, Y(66) + n_ * 26, "Open one LP crate at a time: full, one is about 30 kg.", 10, "start", 400, MUTED))
    o.append(t(lx + 22, Y(66) + n_ * 26 + 15, "Anti-tip brackets fix the base to the wall first.", 10, "start", 400, MUTED))
    o.append(t(lx + 22, Y(66) + n_ * 26 + 30, "Every front: a plain oak lip, finger pull underneath.", 10, "start", 400, MUTED))

    # ---- B: each drawer from above, 5 px per cm, front (the room) at the bottom
    s = 5.0
    top = 470
    def plan(x0, title, sub, wcm, dcm):
        o.append(t(x0, top - 30, title, 12.5, "start", 650))
        o.append(t(x0, top - 14, sub, 10.5, "start", 400, MUTED))
        PX = lambda c: x0 + c * s
        PY = lambda c: top + 8 + (dcm - c) * s
        o.append(f'<rect x="{PX(0)}" y="{PY(dcm)}" width="{wcm * s}" height="{dcm * s}" fill="{PLY}" stroke="#c9a77a"/>')
        return PX, PY
    def dim(x1, x2, y, lab, col=MUTED):
        o.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{col}" stroke-width="0.9"/>')
        for xx in (x1, x2):
            o.append(f'<line x1="{xx}" y1="{y - 4}" x2="{xx}" y2="{y + 4}" stroke="{col}" stroke-width="0.9"/>')
        o.append(t((x1 + x2) / 2, y - 5, lab, 9.5, "middle", 500, col))

    # A · game drawer
    PX, PY = plan(30, "A · Game drawer", "box 54.3 × 35 · 350 mm soft-close runners · rolls out 30", 54.3, 35)
    o.append(f'<rect x="{PX(1.2)}" y="{PY(33.8)}" width="{51.9 * s}" height="{32.6 * s}" fill="#fbfaf7" stroke="#e6e3dc"/>')
    x = 1.5
    for kind, n, tt, ln, f, st in [("PS2", 15, 1.4, 19, "#dfe6f7", "#3a5fb8"), ("360", 12, 1.4, 19, "#e3f3e2", "#3f9a4c"),
                                    ("f", 1, 2.0, 19, "#e9c9a4", VIN_S), ("One", 9, 1.2, 17, "#d7efdc", "#2a7c3f")]:
        x0_ = x
        for i in range(n):
            o.append(f'<rect x="{PX(x)}" y="{PY(14.9 + ln)}" width="{tt * s}" height="{ln * s}" fill="{f}" stroke="{st}" stroke-width="0.6"/>')
            x += tt + (0.1 if kind == "f" else 0)
        if kind != "f":
            o.append(t((PX(x0_) + PX(x)) / 2, PY(14.9 + ln / 2) + 4, f"{n}", 11, "middle", 700, st, 'paint-order="stroke" stroke="#fff" stroke-width="4"'))
            o.append(t((PX(x0_) + PX(x)) / 2, PY(14.9 + ln) - 4, kind, 9.5, "middle", 600))
    o.append(f'<rect x="{PX(1.2)}" y="{PY(14.8)}" width="{51.9 * s}" height="{0.6 * s}" fill="#e9c9a4"/>')
    for (a, b, lab) in [(1.2, 17.2, "Xbox bin"), (37.1, 53.1, "PS2 bin")]:
        o.append(f'<rect x="{PX(a)}" y="{PY(14.2)}" width="{(b - a) * s}" height="{12.6 * s}" fill="{GAME_F}" stroke="{GAME_S}" stroke-opacity="0.6"/>')
        o.append(t(PX((a + b) / 2), PY(8.8), lab, 10, "middle", 650))
        o.append(t(PX((a + b) / 2), PY(8.8) + 12, "6 face-out", 9.5, "middle", 400, MUTED))
    o.append(t(PX(27.15), PY(8.8), "tray", 10, "middle", 650))
    o.append(t(PX(27.15), PY(8.8) + 12, "cards, a pad", 9.5, "middle", 400, MUTED))
    o.append(f'<rect x="{PX(-1.3)}" y="{PY(1.4)}" width="{56.9 * s}" height="{2 * s}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    yb = PY(0) + 22
    dim(PX(1.2), PX(17.2), yb, "16"); dim(PX(17.8), PX(36.5), yb, "18.7"); dim(PX(37.1), PX(53.1), yb, "16")
    o.append(t(PX(27.15), yb + 18, "back: 36 spine-up, titles on top (19 cm cases on edge)", 9.5, "middle", 400, MUTED))
    o.append(t(PX(27.15), yb + 31, "front: 12 face-out · about 48 games in all", 9.5, "middle", 600, GA))

    # B · plinth drawer
    PX, PY = plan(400, "B · Hidden plinth drawer", "box 52 × 34 × 5 inside · 300 mm runners · finger pull", 54.4, 36.4)
    o.append(f'<rect x="{PX(1.2)}" y="{PY(35.2)}" width="{52 * s}" height="{34 * s}" fill="#fbfaf7" stroke="#e6e3dc"/>')
    for i in range(4):
        for j in range(2):
            xx, zz = 1.7 + i * 12.9, 2.2 + j * 16.2
            o.append(f'<rect x="{PX(xx)}" y="{PY(zz + 14.2)}" width="{12.5 * s}" height="{14.2 * s}" rx="2" fill="#b6c9d6" stroke="{GB}" stroke-width="0.8"/>')
            o.append(t(PX(xx + 6.25), PY(zz + 7.1) + 4, "×4", 10, "middle", 650, INK))
    o.append(f'<rect x="{PX(0)}" y="{PY(1.2)}" width="{54.4 * s}" height="{1.6 * s}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    yb = PY(0) + 22
    dim(PX(1.7), PX(14.2), yb, "12.5")
    o.append(t(PX(27.2), yb + 18, "32 PS1 games flat: 8 stacks of 4 jewel cases", 9.5, "middle", 600, GB))
    o.append(t(PX(27.2), yb + 31, "or remotes, spare pads, cables and manuals", 9.5, "middle", 400, MUTED))

    # C and D · the LP crates (v16: snug, under the turntable)
    bw = g.TRAY_BOX[0]
    PX, PY = plan(745, "C and D · LP crates", f"box {bw:.1f} × 40 · 400 mm runners", bw, 40)
    o.append(f'<rect x="{PX(0.9)}" y="{PY(39.1)}" width="{g.TRAY_INSIDE * s}" height="{38.2 * s}" fill="#fff7f1" stroke="{VIN_S}" stroke-opacity="0.4"/>')
    lx_ = 0.9 + (g.TRAY_INSIDE - g.LP) / 2
    for i in range(26):
        zz = 2.6 + i * 1.3
        o.append(f'<rect x="{PX(lx_)}" y="{PY(zz + 0.45)}" width="{g.LP * s}" height="{0.55 * s}" fill="{LP_C[i % 6]}" opacity="0.85"/>')
    o.append(t(PX(bw / 2), PY(20), "LPs", 11, "middle", 700, "#fff", 'paint-order="stroke" stroke="#3b3833" stroke-width="3"'))
    o.append(f'<rect x="{PX(-0.7)}" y="{PY(1.5)}" width="{(bw + 1.4) * s}" height="{1.5 * s}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    yb = PY(0) + 22
    dim(PX(0.9), PX(bw - 0.9), yb, f"trough {g.TRAY_INSIDE:.1f}: snug, no dead space")
    o.append(t(PX(bw / 2), yb + 18, "face-out, leaning back 10°", 9.5, "middle", 400, MUTED))
    o.append(t(PX(bw / 2), yb + 31, f"~{g.TRAY_LPS} LPs each · two crates", 9.5, "middle", 600, GC))
    # E, F and G · the slim drawers
    sw = g.SLIM_BOX_X[1] - g.SLIM_BOX_X[0]
    PX, PY = plan(950, "E, F, G · Slim drawers", f"{sw:.1f} × 40 · 400 mm", sw, 40)
    o.append(f'<rect x="{PX(g.SLIM_SIDE)}" y="{PY(40 - g.SLIM_SIDE)}" width="{g.SLIM_INSIDE * s}" height="{(40 - 2 * g.SLIM_SIDE) * s}" fill="#f6f8fb" stroke="{GA}" stroke-opacity="0.4"/>')
    gx = g.SLIM_SIDE + (g.SLIM_INSIDE - g.GAME_CASE[0]) / 2
    for i in range(g.SLIM_DRAWERS[0]["n"]):
        zz = 2.6 + i * 1.45
        o.append(f'<rect x="{PX(gx)}" y="{PY(zz + 0.5)}" width="{g.GAME_CASE[0] * s}" height="{0.75 * s}" fill="{["#3a5fb8", "#3f9a4c", "#2a2c31"][i % 3]}" opacity="0.85"/>')
    o.append(f'<rect x="{PX(-0.6)}" y="{PY(1.5)}" width="{(sw + 1.2) * s}" height="{1.5 * s}" fill="#e9c9a4" stroke="{VIN_S}"/>')
    yb = PY(0) + 22
    dim(PX(g.SLIM_SIDE), PX(sw - g.SLIM_SIDE), yb, f"{g.SLIM_INSIDE:.1f}")
    o.append(t(PX(sw / 2), yb + 18, f"E, F: ~{g.SLIM_DRAWERS[0]['n']} games", 9.5, "middle", 600, GA))
    o.append(t(PX(sw / 2), yb + 31, "each, face-out", 9.5, "middle", 400, MUTED))
    o.append(t(PX(sw / 2), yb + 44, "G: 4 pads, remotes,", 9.5, "middle", 600, GA))
    o.append(t(PX(sw / 2), yb + 57, "a charging lead", 9.5, "middle", 400, MUTED))

    o.append(t(0, H - 26, "Plans drawn from above at 5 px per cm, front (the room) at the bottom; the elevation at 3.6 px per cm. Sizes: BESTÅ frame 60 × 40 × 64 (IKEA);", 10, "start", 400, MUTED))
    o.append(t(0, H - 12, "game cases 19 × 13.5 × 1.4 and 17 × 13.5 × 1.2; jewel case 14.2 × 12.5 × 1; LP sleeve 31.4; pads 16 × 10.6 × 6.6; runners Emuca 400 mm, Accuride 350 mm (see the fit proof).", 10, "start", 400, MUTED))
    return svg(W, H, "\n".join(o), "The drawer layouts: where each drawer is and what goes in it",
               "Seven drawers in the alcove base, all to scale: A the game drawer, B the hidden plinth drawer, C and D the LP crates, E to G the slim drawers beside them")



def sub_box():
    """v13.2: the sub's oak cover, to scale: from the end and from above. No sides and no front: a backboard on the breast carries
    a solid top over the sub (the spill shield) and a tray with a low lip; the top sits 3 cm over the sub, so it can't tip."""
    g = G
    hb = g.SUB_HOOD
    W, H = 900, 470
    k = 5.0
    o = []
    OAKF, OAKL = "#e7cfae", "#9c6a3f"
    x0, x1 = hb["x"]; z0 = hb["z"][0]
    ft, bt, tp, fr, lip, ov, hh = hb["feet"], hb["base"], hb["top"], hb["front"], hb["lip"], hb["over"], hb["h"]
    bk = hb["back"]
    sx0, sx1 = g.SUB_POS["x"]; sz0, sz1 = g.SUB_POS["z"]
    L, D = x1 - x0, -z0
    def panel(px, title, sub):
        o.append(t(px, 70, title, 12.5, "start", 650))
        o.append(t(px, 86, sub, 10, "start", 400, MUTED))
    # A · end view, from the east: the open end, the driver. Across: distance out from the breast (breast on the left).
    ox, oy = 40, 118 + (hh + 4) * k
    panel(0, "From the end: open all round", "no sides, no front; the cover is held by the backboard")
    E = lambda dd: ox + 10 + dd * k
    Y = lambda y: oy - y * k
    o.append(f'<rect x="{E(0) - 8}" y="{Y(hh + 3)}" width="8" height="{(hh + 3) * k}" fill="url(#brick4)" stroke="{WALL}"/>')
    o.append(f'<line x1="{E(0) - 14}" y1="{Y(0)}" x2="{E(D + ov) + 30}" y2="{Y(0)}" stroke="#9a958b" stroke-width="1.4"/>')
    for fd in (2.0, D - 4):
        o.append(rect(E(fd), Y(ft), 3 * k, ft * k, "#333", "none", 0))
    o.append(rect(E(0), Y(hh), bk * k, (hh - ft) * k, "#c9a27a", OAKL, 0))                                          # backboard
    o.append(rect(E(bk), Y(ft + bt), (D - bk) * k, bt * k, OAKF, OAKL, 0))                                           # base tray
    o.append(rect(E(D - 1.2), Y(ft + bt + lip), 1.2 * k, lip * k, OAKF, OAKL, 0))                                   # its lip
    d0, d1 = -sz1, -sz0
    o.append(rect(E(d0), Y(ft + bt + g.SUB[1]), (d1 - d0) * k, g.SUB[1] * k, "#2b2b2d", "#111", 3))                  # the sub's grille face
    cx_, cy_ = (E(d0) + E(d1)) / 2, Y(ft + bt + g.SUB[1] / 2)
    o.append(f'<circle cx="{cx_}" cy="{cy_}" r="{8.25 * k}" fill="#3a3b3e" stroke="#666"/>')
    o.append(f'<circle cx="{cx_}" cy="{cy_}" r="{2.5 * k}" fill="#222"/>')
    o.append(rect(E(0), Y(hh), (D + ov) * k, tp * k, "#d9b48a", OAKL, 0))                                             # solid top
    lx = E(D + ov) + 10
    o.append(t(lx, Y(hh) + 8, f"cover {_fmt(tp)}: the spill shield, drip groove", 9.5, "start", 600, OAKL))
    o.append(t(lx, Y(hh - tp) + 18, f"3 over the sub: it can't tip", 9.5, "start", 500, MUTED))
    o.append(t(lx, Y(hh / 2), "open front: nothing to knock", 9.5, "start", 600, OAKL))
    o.append(t(lx, Y(ft + bt + lip) + 2, f"tray, {_fmt(lip)} cm lip all round", 9.5, "start", 500, MUTED))
    o.append(t(E(0) - 10, Y(hh / 2), "backboard", 9, "end", 600, OAKL))
    o.append(t((E(0) + E(D)) / 2, Y(0) + 18, f"breast on the left · {_fmt(D)} out · {_fmt(hh)} tall", 10, "middle", 500, MUTED))
    # B · plan, from above: the air paths
    px, py = 330, 112
    panel(px, "From above, the cover lifted off (seen from the room)", "nothing in front of the driver, the port or the room")
    X = lambda x: px + 130 + (x - x0) * k
    Zp = lambda z: py + 20 + (0 - z) * k
    o.append(f'<rect x="{X(x0 - 14)}" y="{Zp(0) - 8}" width="{(L + 28) * k}" height="8" fill="url(#brick4)" stroke="{WALL}"/>')
    o.append(t(X((x0 + x1) / 2), Zp(0) - 12, "chimney breast", 9.5, "middle", 500, MUTED))
    for ax in (g.HEBGO_X[0], g.HEBGO_X[1]):
        o.append(rect(X(ax - 1.4), Zp(-3), 2.8 * k, 3 * k, "#d6d8da", "#8a8c8f", 0))
    o.append(rect(X(x0 - ov), Zp(0), (L + 2 * ov) * k, (-z0 + ov) * k, "#fbf6ee", OAKL, 0, 1.2, 'stroke-dasharray="5 4"'))   # the top's outline
    o.append(rect(X(x0), Zp(0), L * k, bk * k, "#c9a27a", OAKL, 0))                                                    # backboard
    o.append(rect(X(x0), Zp(z0 + 1.2), L * k, 1.2 * k, OAKF, OAKL, 0))                                                 # front lip
    o.append(rect(X(sx0), Zp(sz1), (sx1 - sx0) * k, (sz1 - sz0) * k, "#2b2b2d", "#111", 2))
    o.append(t(X((sx0 + sx1) / 2), Zp((sz0 + sz1) / 2) + 4, "sub", 10, "middle", 650, "#fff"))
    zc = Zp((sz0 + sz1) / 2)
    o.append(arrow(X(sx0), zc, X(g.HEBGO_X[0] + 3) - 6, zc, SND_S, 2.4))
    o.append(arrow(X(sx1), zc, X(g.HEBGO_X[1] - 3) + 6, zc, SND_S, 2.4))
    o.append(t(X(sx0) - 6, zc - 10, "driver", 10, "end", 650, SND_S))
    o.append(t(X(sx1) + 6, zc - 10, "port", 10, "start", 650, SND_S))
    o.append(t(X(sx1) + 6, zc + 22, f"{_fmt(g.HEBGO_X[1] - 1.4 - sx1)} clear (15+ advised)", 9.5, "start", 500, MUTED))
    o.append(t(X(sx0) - 6, zc + 22, f"{_fmt(sx0 - g.HEBGO_X[0] - 1.4)} to the arm", 9.5, "end", 500, MUTED))
    o.append(t(X((x0 + x1) / 2), Zp(z0) + 26, f"cover {_fmt(L + 2 * ov)} × {_fmt(D + ov)} on a {_fmt(L)} × {_fmt(hh)} backboard, solid oak, hardwax oil", 10, "middle", 500))
    o.append(t(X((x0 + x1) / 2), Zp(z0) + 41, "the folded table's brackets either side; the room is below this plan", 9.5, "middle", 400, MUTED))
    o.append('<defs><pattern id="brick4" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#d9a48a"/>'
             '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#b5785e" stroke-width="0.8"/></pattern></defs>')
    notes = ["No sides and no front: the sub stands in the open, so nothing sits in front of its driver (east), its port (west) or the room.",
             "Spills: the solid oak cover overhangs 1 cm with a drip groove, so a drink knocked off the table runs off its edge, not onto the sub.",
             "Knocks: the cover sits 3 cm over the sub, and rocking it over its edge would lift it about 7 cm, so it can't fall over; the tray's",
             "    2 cm lip stops it sliding. The backboard screws to the solid breast. For eight at the table, unscrew it and stand the sub by the base."]
    for i, n in enumerate(notes):
        o.append(t(0 if not n.startswith("    ") else 10, 380 + i * 17, ("• " + n) if not n.startswith("    ") else n.strip(), 9.6, "start", 400, INK))
    return svg(W, H, "\n".join(o), "The sub's oak cover: no sides, a solid top for spills, and it can't tip",
               "To scale, 5 px per cm. Left: from the east end. Right: from above with the cover lifted off")


def leaf_case():
    """v13.6: the leaf carries the legs. The leaf from underneath with all eight legs clipped inside its oak frame, a
    section through the frame and the clips, and the steps from folded to six at the table."""
    g = G
    W, H = 860, 800
    o = []
    OAKF, OAKS, LEGF = "#f1e1c8", "#9c6a3f", "#d9a46c"
    lw_, lf_ = g.LEG
    fr = g.LEAF_FRAME
    L80, L60 = g.LEAF[1], g.LEAF[0]
    # ---------- A: from underneath (80 across, 60 down), 5 px/cm
    s = 5.0
    ax, ay = 24, 96
    X = lambda cm: ax + cm * s            # along the leaf's 80 (the legs' length)
    Y = lambda cm: ay + cm * s            # across its 60
    o.append(t(ax, ay - 16, "A · The leaf from underneath, legs stored", 11.5, "start", 650))
    o.append(rect(X(0), Y(0), L80 * s, L60 * s, OAKF, OAKS, 6, 1.4))
    fx0, fy0 = fr["inset_z"], fr["inset_x"]
    fo_z, fo_x = g.LEAF_FRAME_OUT[1], g.LEAF_FRAME_OUT[0]
    tt_ = fr["t"]
    o.append(rect(X(fx0), Y(fy0), fo_z * s, fo_x * s, "#c48c57", "#7a5130", 0, 1.2))
    o.append(rect(X(fx0 + tt_), Y(fy0 + tt_), (fo_z - 2 * tt_) * s, (fo_x - 2 * tt_) * s, "#ead6b8", "#7a5130", 0, 1))
    # the eight legs, heads (bolts) at the left end rail, feet in clips near the right
    inner_x0 = fy0 + tt_
    first = inner_x0 + (g.LEAF_FRAME_IN[0] - g.LEG_STORE_W) / 2 + g.LEG_CLIP[1] / 2
    head = fx0 + tt_                       # the leg's top end face against the end rail
    for k in range(8):
        cy = first + k * g.LEG_PITCH
        x0, x1 = X(head), X(head + g.LEG_H)
        a, b = lw_ / 2 * s, lf_ / 2 * s
        o.append(f'<path d="M{x0},{Y(cy) - a} L{x1},{Y(cy) - b} L{x1},{Y(cy) + b} L{x0},{Y(cy) + a} Z" fill="{LEGF}" stroke="{OAKS}" stroke-width="1"/>')
        o.append(f'<line x1="{X(head - g.LEG_BOLT)}" y1="{Y(cy)}" x2="{x0}" y2="{Y(cy)}" stroke="#55585b" stroke-width="3"/>')   # bolt in the rail
        cx_ = head + g.LEG_H - g.LEG_CLIP_FROM_FOOT
        o.append(rect(X(cx_ - g.LEG_CLIP[2] / 2), Y(cy - g.LEG_CLIP[1] / 2), g.LEG_CLIP[2] * s, g.LEG_CLIP[1] * s, "#9a9c9f", "#55585b", 1, 1))
    # the leaf's own four inserts (its legs when it's in use), inside the frame's corners
    ix, iz = g.LEAF_LEG_IN
    for (zz, xx) in ((iz, ix), (L80 - iz, ix), (iz, L60 - ix), (L80 - iz, L60 - ix)):
        o.append(f'<circle cx="{X(zz)}" cy="{Y(xx)}" r="5" fill="#d8b04a" stroke="#7a5a12" stroke-width="1.2"/>')
    # labels, all outside the leaf so nothing sits under the legs
    lx = X(L80) + 14
    def lab(px, py, ty, txt, sub=None, via=None):
        if via is None:
            o.append(f'<path d="M{px},{py} L{lx - 4},{ty}" stroke="#9a958b" fill="none"/>')
        else:                              # an elbow: along a clear band of the leaf, then out to the label
            o.append(f'<path d="M{px},{py} L{px},{via} L{X(L80) + 4},{via} L{lx - 4},{ty}" stroke="#9a958b" fill="none"/>')
        o.append(t(lx, ty + 4, txt, 9.8, "start", 600))
        if sub:
            o.append(t(lx, ty + 16, sub, 9, "start", 400, MUTED))
    lab(X(L80 - iz), Y(ix), Y(3), "Brass inserts for the leaf's own legs", f"{_fmt(ix)} in from the joint and the end, {_fmt(iz)} from the sides")
    lab(X(L80 - fx0 - tt_ / 2), Y(27), Y(27), f"Oak frame, {_fmt(fo_z)} × {_fmt(fo_x)}", f"rails {_fmt(fr['h'])} deep × {_fmt(tt_)}; it stiffens the leaf too")
    clip_x = X(head + g.LEG_H - g.LEG_CLIP_FROM_FOOT)
    lab(clip_x, Y(first - g.LEG_CLIP[1] / 2), Y(14), "Sprung clip at each foot",
        f"45 mm steel clip, {_fmt(g.LEG_CLIP_FROM_FOOT)} cm up the leg", via=Y(1.2))
    last = first + 7 * g.LEG_PITCH
    lab(X(head + 30), Y(last), Y(44), f"Eight oak legs, {_fmt(g.LEG_H)} long", f"{_fmt(lw_)} tapering to {_fmt(lf_)}, at {_fmt(g.LEG_PITCH)} cm centres", via=Y(L60 - 2.1))
    lab(X(head - g.LEG_BOLT / 2), Y(last), Y(57), "Each bolt sits in a hole in the end rail", "so a leg can't slide or rattle", via=Y(L60 - 0.8))
    # dimensions
    o.append(f'<path d="M{X(0)},{Y(L60) + 14} L{X(L80)},{Y(L60) + 14}" stroke="{MUTED}"/>')
    o.append(t(X(L80 / 2), Y(L60) + 28, f"leaf {_fmt(L80)} (the table's depth) × {_fmt(L60)}, {_fmt(g.LEAF[2])} thick", 9.5, "middle", 500, MUTED))
    o.append(t(X(0), Y(L60) + 44, f"Inside the frame {_fmt(g.LEAF_FRAME_IN[1])} × {_fmt(g.LEAF_FRAME_IN[0])}: the legs take {_fmt(g.LEG_H + g.LEG_BOLT)} × {_fmt(g.LEG_STORE_W)}, and {_fmt(lw_)} of the {_fmt(fr['h'])} depth.", 9.5, "start", 400, INK))
    # ---------- B: section across the legs, through the clips, 7 px/cm
    s2 = 7.0
    bx, by = 24, Y(L60) + 92
    o.append(t(bx, by - 18, "B · Section through the frame and the clips (leaf upside down, as you unclip it)", 11.5, "start", 650))
    BX = lambda cm: bx + cm * s2
    BY = lambda cm: by + cm * s2
    o.append(rect(BX(0), BY(0), L60 * s2, g.LEAF[2] * s2, OAKF, OAKS, 0, 1.2))
    for xx in (fy0, fy0 + fo_x - tt_):
        o.append(rect(BX(xx), BY(g.LEAF[2]), tt_ * s2, fr["h"] * s2, "#c48c57", "#7a5130", 0, 1))
    leg_at = lf_ + (lw_ - lf_) * g.LEG_CLIP_FROM_FOOT / g.LEG_H
    for k in range(8):
        cy = first + k * g.LEG_PITCH
        o.append(f'<path d="M{BX(cy - g.LEG_CLIP[1] / 2)},{BY(g.LEAF[2])} L{BX(cy - g.LEG_CLIP[1] / 2)},{BY(g.LEAF[2] + leg_at * 0.7)} '
                 f'Q{BX(cy)},{BY(g.LEAF[2] + leg_at + 1.0)} {BX(cy + g.LEG_CLIP[1] / 2)},{BY(g.LEAF[2] + leg_at * 0.7)} L{BX(cy + g.LEG_CLIP[1] / 2)},{BY(g.LEAF[2])}" '
                 f'fill="none" stroke="#55585b" stroke-width="1.6"/>')
        o.append(rect(BX(cy - leg_at / 2), BY(g.LEAF[2] + 0.15), leg_at * s2, leg_at * s2, LEGF, OAKS, 0, 1))
    # labels under the section, inside the drawing's width
    yl = BY(g.LEAF[2] + fr["h"]) + 22
    o.append(t(BX(0), yl, f"leaf {_fmt(g.LEAF[2])}", 9.5, "start", 500, MUTED))
    o.append(t(BX(fy0), yl + 14, f"frame rail {_fmt(tt_)} × {_fmt(fr['h'])}", 9.5, "start", 500, MUTED))
    o.append(t(BX(L60 / 2), yl, f"legs {_fmt(leg_at)} square at the clip, {_fmt(g.LEG_PITCH)} apart", 9.5, "middle", 500, MUTED))
    o.append(t(BX(L60), yl + 14, f"{_fmt(fr['h'] - lw_)} cm to spare under the thickest part", 9.5, "end", 500, MUTED))
    # ---------- C: the steps, on the right of B
    cx0 = BX(L60) + 40
    cy0 = by - 18
    o.append(t(cx0, cy0, "C · From folded to six at the table", 11.5, "start", 650))
    steps_ = [("Clear the table and fold it down onto its brackets.", ""),
              ("Two of you slide it 5 cm sideways off the hinge pins,", "lift it off and lay it face down on a blanket."),
              ("Turn the leaf over beside it and unclip the eight legs:", "pull each foot out of its clip, lift the bolt out."),
              ("Screw four legs into the table's inserts and four into", "the leaf's, hand-tight. Stand both up."),
              ("Butt the leaf to the table's west end on its two dowels,", "close the two clips underneath. 170 × 80."),
              (f"Set it {_fmt(-g.FREE_Z[0])} cm off the breast, chairs round.", "Packing away is the same, backwards.")]
    for i, (a, b) in enumerate(steps_):
        yy = cy0 + 26 + i * 36
        o.append(f'<circle cx="{cx0 + 10}" cy="{yy}" r="10" fill="{BLUE}"/>')
        o.append(t(cx0 + 10, yy + 4, str(i + 1), 10.5, "middle", 700, "#fff"))
        o.append(t(cx0 + 28, yy + 1, a, 9.8, "start", 500))
        if b:
            o.append(t(cx0 + 28, yy + 14, b, 9.8, "start", 400, MUTED))
    # ---------- the why, along the bottom
    yb = H - 58
    notes = ["Why the leaf: the folded table stays a plain oak panel, nothing new stands in the room, and the leaf, with every leg inside it,",
             f"goes wherever the chairs are kept. Leaf, frame and legs together weigh about {0.7 / 1000 * (L60 * L80 * g.LEAF[2] + 2 * tt_ * fr['h'] * (fo_x + g.LEAF_FRAME_IN[1]) + 8 * g.LEG_H * ((lw_ + lf_) / 2) ** 2):.0f} kg.",
             f"Set aside: folding legs under the table (they'd show on the folded panel and stand it about 5 cm further off the wall), a box under",
             "the dining wall (where the breast-side chairs push back with six seated), and the plinth drawer (too short for 71 cm legs)."]
    for i, nn in enumerate(notes):
        o.append(t(0, yb + i * 15, nn, 9.8, "start", 400, INK))
    return svg(W, H, "\n".join(o), "The leaf carries the legs: a slim oak frame underneath holds all eight",
               "To scale. A from underneath, B in section, C the steps from folded to six")


def light_scene(key, table=False):
    """v13.7: one lighting scene on the room plan, from above: every light layer drawn at the scene's level (glow size and
    strength), the room dimmed by how much light there is overall. Levels from scenes.py. v25: the three presets; table=True draws
    the flip-top open by the stairs with the table rule on top (scenes.TABLE_BOOST). The old five (SCENES_V24) still draw."""
    import scenes as SC
    g = G
    sc = next(s for s in SC.SCENES + SC.SCENES_V24 if s[0] == key)
    if table:
        sc = (sc[0], sc[1], sc[2], SC.boosted(sc[3]), sc[4])
    lv = {k: v / 100 for k, v in sc[3].items()}
    W, H = 860, 560
    k = 1.25
    o = []
    X, Y = _room(o, k, 16, 74)
    _sofa(o, X, Y, k, label=False)
    _side_wall(o, X, Y, k)
    if table:             # v29: the dining cabinet's table open (the plan), under bar 2
        ox0, ox1 = g.OPTC["tx"]
        za, zb = sorted(g.OPTC["tz"])
        o.append(f'<rect x="{X(ox1):.1f}" y="{Y(za):.1f}" width="{(ox1 - ox0)*k:.1f}" height="{(zb - za)*k:.1f}" fill="#d9b48a" stroke="#9c6a3f"/>')
    if key == "dinner":   # the table set for four at the wall
        x0, x1 = g.TABLE_X
        zo = g.OPEN_Z[1] if g.TABLE_STYLE == "fliptop" else g.TABLE_Z[1]
        o.append(f'<rect x="{X(x1):.1f}" y="{Y(zo):.1f}" width="{g.TABLE[0]*k:.1f}" height="{(g.TABLE_Z[0] - zo)*k:.1f}" fill="#d9b48a" stroke="#9c6a3f"/>')
    # dim the room by the scene's overall light
    total = (lv["strip"] * 1.0 + lv["bar1"] * 0.8 + lv["bar2"] * 0.6 + lv["uprights"] * 0.4 + lv["lamp"] * 0.3) / 3.1
    dark = 0.62 * (1 - total)
    o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(g.WINDOW_Z):.1f}" width="{g.ROOM_W*k:.1f}" height="{g.ROOM_D*k:.1f}" fill="#0d1410" opacity="{dark:.2f}"/>')
    o.append('<defs><radialGradient id="lglow"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.95"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="bglow"><stop offset="0" stop-color="#cfe3ff" stop-opacity="0.95"/><stop offset="1" stop-color="#cfe3ff" stop-opacity="0"/></radialGradient></defs>')
    o.append(f'<clipPath id="roomclip"><rect x="{X(g.ROOM_W):.1f}" y="{Y(g.WINDOW_Z):.1f}" width="{g.ROOM_W*k:.1f}" height="{g.ROOM_D*k:.1f}"/></clipPath>')
    def glow(x, z, r, v, grad="lglow"):
        if v > 0:
            o.append(f'<circle clip-path="url(#roomclip)" cx="{X(x):.1f}" cy="{Y(z):.1f}" r="{r * k * (0.45 + 0.55 * v):.1f}" fill="url(#{grad})" opacity="{0.25 + 0.75 * v:.2f}"/>')
    # ceiling strip: round the room's edge, 4 in from the walls
    if lv["strip"] > 0:
        e = 4
        sd = g.ALC_D - g.STAIR_D
        pts_ = [(e, g.WINDOW_Z + e), (g.ROOM_W - e, g.WINDOW_Z + e), (g.ROOM_W - e, sd - e), (g.STAIR_X[0] - e, sd - e), (g.STAIR_X[0] - e, g.BREAST_D_WEST - e),
                (g.BREAST_X[1] + e, g.BREAST_D_WEST - e), (g.BREAST_X[1] + e, -e), (g.ALC_W - e, -e), (g.ALC_W - e, g.ALC_D - e), (e, g.ALC_D - e)]
        d = "M" + " L".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + " Z"
        o.append(f'<path d="{d}" fill="none" stroke="#ffd27a" stroke-width="{2 + 9 * lv["strip"]:.1f}" stroke-opacity="{0.25 + 0.6 * lv["strip"]:.2f}" stroke-linejoin="round"/>')
    # the uprights' grooves, the bias light
    for (a, b) in (g.UP_L, g.UP_R):
        glow((a + b) / 2, g.ALC_D - g.UP_D / 2, 34, lv["uprights"])
    if lv["bias"] > 0:
        glow(g.TV_CX, g.TV_PANEL_Z[1] + 2, 60, lv["bias"], "bglow")
    # the bars: beams to their aims, glows where they land
    bars = [(g.PEND_X, g.PEND_Z, lv["bar1"], bar_heads(1), "bar 1"), (g.BAR2_X, g.BAR2_Z, lv["bar2"], bar_heads(2), "bar 2")]
    for bx, bz, v, heads, name in bars:
        for dx, col, (ax, az) in heads:
            hx, hz = g.bar_head_xz(bx, bz, dx)
            if v > 0:
                o.append(f'<line x1="{X(hx):.1f}" y1="{Y(hz):.1f}" x2="{X(ax):.1f}" y2="{Y(az):.1f}" stroke="{col}" stroke-width="{1 + 3 * v:.1f}" stroke-opacity="{0.25 + 0.6 * v:.2f}"/>')
                glow(ax, az, 34, v * 0.8)
        o.append(_bar_rect(X, Y, bx, bz, 6, '#f4f1ea', '#8a857a', 3))
        for dx, col, _ in heads:
            hx, hz = g.bar_head_xz(bx, bz, dx)
            o.append(f'<circle cx="{X(hx):.1f}" cy="{Y(hz):.1f}" r="5.5" fill="{col}" stroke="#555" stroke-width="0.8" opacity="{1 if v > 0 else 0.45}"/>')
    lx, lz = g.SOFA_X[1] + 16, g.SOFA_BACK_Z + 22
    glow(lx, lz, 46, lv["lamp"])
    o.append(f'<circle cx="{X(lx):.1f}" cy="{Y(lz):.1f}" r="6" fill="#f4f1ea" stroke="#8a857a"/>')
    # level labels, outside the room on the left (west) side, one row per layer
    lab_x = X(0) + 20
    for i, (lk, name, ctl) in enumerate(SC.LAYERS):
        y = 96 + i * 66
        v = sc[3][lk]
        o.append(t(lab_x, y, name.replace(", between the TV and the sofa", "").replace(", by the door", ""), 10.5, "start", 650))
        o.append(t(lab_x, y + 15, SC.level_word(v) + " · " + ctl, 9.5, "start", 400, MUTED))
        o.append(f'<rect x="{lab_x:.1f}" y="{y + 23:.1f}" width="200" height="6" rx="3" fill="#e6e2d8"/>')
        if v:
            o.append(f'<rect x="{lab_x:.1f}" y="{y + 23:.1f}" width="{2 * v:.0f}" height="6" rx="3" fill="#d9a032"/>')
    o.append(t(X(g.ALC_W / 2), Y(g.BASE_FRONT_Z) + 18, "media wall", 9, "middle", 650, "#7a5130"))
    o.append(t(X(g.TABLE_CX), Y(0) + 22, "dining wall", 9, "middle", 650, "#8f5b45"))
    o.append(t(X(g.ROOM_W), Y(g.ALC_D) + 34, "From above, to scale: the window at the top, the media wall bottom right. Glows show each light's level.", 9.5, "start", 400, MUTED))
    if table:
        return svg(W, H, "\n".join(o), f"Lighting: {sc[1]}, with the table open", "The table rule on top of the preset: bar 2 between 45 and 55, the ceiling strip at most 40, bar 1 at most 15, the TV's bias light off")
    return svg(W, H, "\n".join(o), f"Lighting {'preset' if key in ('bright', 'cosy', 'film') else 'scene'}: {sc[1]}", sc[2])


def dining_sites():
    """v14: the two places the fold-down table can live, side by side, to scale. v15: the flip-top, open, at each."""
    W, H = 900, 600
    g = G
    k = 1.05
    o = []
    cw, cd = g.CHAIR[0], g.CHAIR[1]
    TAB, TABS = "#d9b48a", "#9c6a3f"
    for i, site in enumerate(("breast", "stairs")):
        ox, oy = 10 + i * 452, 110
        X = lambda x, ox=ox: ox + (g.ROOM_W - x) * k
        Y = lambda z, oy=oy: oy + (z - g.WINDOW_Z) * k
        sd = g.ALC_D - g.STAIR_D
        pts_ = [(130, g.WINDOW_Z), (g.ROOM_W, g.WINDOW_Z), (g.ROOM_W, sd), (g.STAIR_X[0], sd), (g.STAIR_X[0], g.BREAST_D_WEST), (g.BREAST_X[1], g.BREAST_D_WEST),
                (g.BREAST_X[1], 0), (g.ALC_W, 0), (g.ALC_W, g.ALC_D), (130, g.ALC_D)]
        o.append('<polyline points="' + " ".join(f"{X(a):.1f},{Y(b):.1f}" for a, b in pts_) + f'" fill="#fbfaf6" stroke="{WALL}" stroke-width="2.4"/>')
        o.append(f'<rect x="{X(g.BREAST_X[1]):.1f}" y="{Y(0):.1f}" width="{g.BREAST_W*k:.1f}" height="{g.ALC_D*k:.1f}" fill="#e2b9a4" stroke="{WALL}" stroke-width="1.6"/>')
        o.append(t(X(g.TABLE_CX), Y(g.ALC_D / 2) + 4, "chimney breast", 8.5, "middle", 600, "#8f5b45"))
        pb = g.PIPE_BOX                     # v16: the pipe boxing in the window's west corner
        o.append(f'<rect x="{X(pb["x"][1]):.1f}" y="{Y(pb["z"][0]):.1f}" width="{(pb["x"][1] - pb["x"][0])*k:.1f}" height="{(pb["z"][1] - pb["z"][0])*k:.1f}" fill="#d8d3c8" stroke="{WALL}" stroke-width="1.4"/>')
        o.append(f'<rect x="{X(g.ALC_W):.1f}" y="{Y(g.BASE_FRONT_Z):.1f}" width="{(g.ALC_W - 130)*k:.1f}" height="{g.BASE_D*k:.1f}" fill="#e9d3b4" stroke="#b88a55"/>')
        o.append(t(X((g.ALC_W + 130) / 2), Y(g.BASE_FRONT_Z) + 18, "media wall", 8.5, "middle", 600, "#8a5a32"))
        o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(sd):.1f}" width="{(g.ROOM_W - g.STAIR_X[0])*k:.1f}" height="{(g.ALC_D - sd)*k:.1f}" fill="#eeeae1" stroke="#9a958b"/>')
        o.append(t(X((g.ROOM_W + g.STAIR_X[0]) / 2), Y(sd) + 16, "stairs", 8.5, "middle", 600, MUTED))
        o.append(t(X((g.ROOM_W + g.STAIR_X[0]) / 2), Y(sd) + 27, "up ↓", 8, "middle", 400, MUTED))
        hx, r = g.DOOR_X[0], g.DOOR_SWING
        o.append(f'<path d="M{X(hx + r):.1f},{Y(g.BREAST_D_WEST):.1f} A{r*k:.1f},{r*k:.1f} 0 0 1 {X(hx):.1f},{Y(g.BREAST_D_WEST - r):.1f} L{X(hx):.1f},{Y(g.BREAST_D_WEST):.1f}" fill="#fbe7e1" fill-opacity="0.6" stroke="#d0573b" stroke-dasharray="3 2"/>')
        o.append(t(X(hx + r / 2), Y(g.BREAST_D_WEST - r / 2) + 4, "door swing", 8, "middle", 600, "#d0573b"))
        x1s, zf, zb = g.SOFA_X[1], g.SOFA_FRONT_Z, g.SOFA_BACK_Z
        o.append(f'<rect x="{X(x1s):.1f}" y="{Y(zb):.1f}" width="{(x1s - 130)*k:.1f}" height="{(zf - zb)*k:.1f}" fill="#ecebe6" stroke="#b9b4a8"/>')
        o.append(t((X(x1s) + X(130)) / 2, Y((zb + zf) / 2) + 3, "sofa", 9, "middle", 600, MUTED))
        # the stairs wall's shelf (high), and the pendant point
        s0, s1 = g.SHELF_B["z"]
        o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(s1):.1f}" width="{g.SHELF_B["d"]*k:.1f}" height="{(s0 - s1)*k:.1f}" fill="none" stroke="#33302b" stroke-width="1.3" stroke-dasharray="6 3"/>')
        def pendant():
            o.append(f'<circle cx="{X(g.BAR2_X):.1f}" cy="{Y(g.BAR2_Z):.1f}" r="5" fill="#f0c24b" stroke="#9a7404"/>')
            o.append(t(X(g.BAR2_X) + 8, Y(g.BAR2_Z) + 3, "pendant point", 8, "start", 700, "#9a7404"))
        def chair(cx, cz, face):
            if face in ("+z", "-z"):
                x0, z0, w_, d_ = cx - cw / 2, cz - cd / 2, cw, cd
            else:
                x0, z0, w_, d_ = cx - cd / 2, cz - cw / 2, cd, cw
            o.append(f'<rect x="{X(x0 + w_):.1f}" y="{Y(z0):.1f}" width="{w_*k:.1f}" height="{d_*k:.1f}" rx="3" fill="#f1e1c8" stroke="#b88a55"/>')
        def dim(a, b, lab, col=BLUE, anchor="middle", dx=0, dy=-4):
            o.append(f'<line x1="{X(a[0]):.1f}" y1="{Y(a[1]):.1f}" x2="{X(b[0]):.1f}" y2="{Y(b[1]):.1f}" stroke="{col}" stroke-width="1.2"/>')
            o.append(t((X(a[0]) + X(b[0])) / 2 + dx, (Y(a[1]) + Y(b[1])) / 2 + dy, lab, 8.5, anchor, 650, col))
        tuck = 8
        def gate(xa, xb, za, zb_):       # the joint (dashed) and the gate leg's two feet
            o.append(f'<line x1="{X(xa):.1f}" y1="{Y(za):.1f}" x2="{X(xb):.1f}" y2="{Y(zb_):.1f}" stroke="#7a5130" stroke-dasharray="3 2"/>')
        if site == "breast":
            tx0, tx1 = g.TABLE_X
            tz0, tz1 = g.OPEN_Z[1], g.OPEN_Z[0]
            step = (tz1 - tz0) / 3
            for j in range(3):
                cz = tz1 - step * (j + 0.5)
                chair(tx0 - cd / 2 + tuck, cz, "+x"); chair(tx1 + cd / 2 - tuck, cz, "-x")
            o.append(f'<rect x="{X(tx1):.1f}" y="{Y(tz0):.1f}" width="{(tx1-tx0)*k:.1f}" height="{(tz1-tz0)*k:.1f}" fill="{TAB}" stroke="{TABS}" stroke-width="1.4"/>')
            gate(tx0, tx1, g.TABLE_Z[1], g.TABLE_Z[1])
            o.append(t(X(g.TABLE_CX), Y((tz0 + tz1) / 2) + 4, "110 × 160", 9, "middle", 650, "#5a3a20"))
            o.append(t(X(tx1 + cd) - 4, Y(tz1 - 20), "first chair:", 8, "end", 600, "#d0573b"))
            o.append(t(X(tx1 + cd) - 4, Y(tz1 - 20) + 10, "in the door's swing", 8, "end", 600, "#d0573b"))
            o.append(t(X(g.ROOM_W) + g.SHELF_B["d"] * k + 6, Y((s0 + s1) / 2), "your 2 m shelf (high),", 8.5, "start", 600, "#33302b"))
            o.append(t(X(g.ROOM_W) + g.SHELF_B["d"] * k + 6, Y((s0 + s1) / 2) + 11, "OBEGRÄNSAD, laser, plant", 8.5, "start", 400, MUTED))
            pendant()
            dim((g.TABLE_CX, tz0), (g.TABLE_CX, g.SOFA_FRONT_Z), f"{_fmt(tz0 - g.SOFA_FRONT_Z)} to the sofa: no end seat", dx=4, anchor="start", dy=4, col="#9a5f0c")
            title, sub = "A · On the chimney breast: up to six", "the flip-top open towards the window, three a side; folded flat every day"
            notes = ["+ next to the media wall; the stairs wall keeps the shelf, lamp and hat",
                     "+ four sit with room to spare, six elbows-in",
                     "− no seat at the end: the sofa is 34 beyond it",
                     "− the west side's first chair sits in the door's swing"]
        else:
            tz0, tz1 = g.TABLE_B_Z[1], g.TABLE_B_Z[0]
            tx0, tx1 = g.TABLE_B_OPEN_X
            step = (tx1 - tx0) / 3
            for j in range(3):
                cx = tx1 - step * (j + 0.5)
                chair(cx, tz1 + cd / 2 - tuck, "-z"); chair(cx, tz0 - cd / 2 + tuck, "+z")
            chair(tx0 - cd / 2 + tuck, (tz0 + tz1) / 2, "+x")
            o.append(f'<rect x="{X(tx1):.1f}" y="{Y(tz0):.1f}" width="{(tx1-tx0)*k:.1f}" height="{(tz1-tz0)*k:.1f}" fill="{TAB}" stroke="{TABS}" stroke-width="1.4"/>')
            gate(g.TABLE_B_X[0], g.TABLE_B_X[0], tz0, tz1)
            o.append(t(X((tx0 + tx1) / 2), Y((tz0 + tz1) / 2) + 4, "110 × 160", 9, "middle", 650, "#5a3a20"))
            pendant()
            o.append(t(X(g.ROOM_W) + g.SHELF_B["d"] * k + 6, Y(s1) + 10, "your 2 m shelf above it", 8.5, "start", 600, "#33302b"))
            title, sub = "B · Under your shelf, by the stairs: up to seven", "the flip-top open into the room, three a side and one at the end"
            notes = ["+ seven at a squeeze, five with room; right under the pendant point",
                     "+ out of the door's swing; frees the breast for the “now playing” ledge",
                     "− the side chairs are tight: 43 to the stairs' foot, 33 to the window",
                     "− the lamp moves while it's open; check the wall before fixing the brackets"]
        o.append(t(ox, 70, title, 13, "start", 700))
        o.append(t(ox, 86, sub, 9.5, "start", 400, MUTED))
        for j, n_ in enumerate(notes):
            o.append(t(ox, oy + (g.ALC_D - g.WINDOW_Z) * k + 22 + j * 15, n_, 9.5, "start", 500, "#2f7a4a" if n_.startswith("+") else "#a3352b"))
    return svg(W, H, "\n".join(o), "The alternative, the flip-top: on the chimney breast or the stairs wall",
               "Both to scale, the flip-top open at its fullest, the west half of the room from above (window at the top). The plan is the dining cabinet; these are the flip-top's two places.")

def fliptop():
    """v15: the flip-top gate-leg table in section through its centre line, to scale: folded on the wall (left) and open (right),
    with the three moves between them."""
    W, H = 900, 560
    g = G
    s = 1.55
    o = []
    tw, td, tt = g.TABLE
    lw_, ld_, lt_ = g.FLIP["leaf"]
    Dr, rt, Hr = g.RAIL[2], g.RAIL_TOP, g.RAIL[1]
    gt = g.FLIP["gate_t"]
    OAKF, OAKS = "#e9cfa8", "#9c6a3f"
    def panel(ox, oy, title, sub):
        Z = lambda cm: ox - cm * s
        Y = lambda cm: oy - cm * s
        o.append(f'<line x1="{Z(185)}" y1="{Y(0)}" x2="{Z(-10)}" y2="{Y(0)}" stroke="#8f8a80" stroke-width="1.6"/>')
        o.append(rect(Z(0), Y(200), 10 * s, 200 * s, "url(#brick5)", "#8f5b45", 0))
        o.append(rect(Z(3), Y(rt), 3 * s, Hr * s, OAKF, OAKS, 0))                       # backboard
        o.append(rect(Z(Dr), Y(rt), (Dr - 3) * s, 4 * s, "#dcb98d", OAKS, 0))             # hinge rail
        o.append(t(ox - 90 * s, oy - 205 * s, title, 12, "middle", 650))
        o.append(t(ox - 90 * s, oy - 205 * s + 15, sub, 9.5, "middle", 400, MUTED))
        return Z, Y
    # folded
    Z, Y = panel(300, 520, "Folded on the wall, every day", f"{_fmt(g.FOLDED_D)} off the wall, top edge {_fmt(g.FOLDED_TOP)}")
    o.append(rect(Z(3 + gt), Y(rt + td - 6), gt * s, (td - 8) * s, "#d6b48a", OAKS, 0, 1, 'stroke-dasharray="3 2"'))
    o.append(rect(Z(3 + gt + lt_), Y(rt + ld_), lt_ * s, ld_ * s, OAKF, OAKS, 0))
    o.append(rect(Z(Dr + tt), Y(rt + td), tt * s, td * s, "#f1e1c8", OAKS, 0, 1.4))
    arm, bh = g.HEBGO
    o.append(rect(Z(3.6), Y(rt), 0.6 * s, (bh - 5) * s, "#9a9c9f", "#6f7174", 0))
    for (y, z, txt) in [(rt + td - 10, Dr + tt, "the top: its plain oak underside to the room"), (rt + 50, 3 + gt + lt_, "the half, flipped onto the top"),
                        (rt + 25, 3 + gt, "its gate leg, folded flat"), (rt - 2, Dr, f"hinge rail {_fmt(Dr - 3)} on the backboard")]:
        o.append(f'<line x1="{Z(z)}" y1="{Y(y)}" x2="{Z(z) - 24}" y2="{Y(y)}" stroke="#b9b4a8"/>')
        o.append(t(Z(z) - 28, Y(y) + 3.5, txt, 9.5, "end", 500))
    # open
    Z, Y = panel(870, 520, "Open: 110 × 160, still on the wall", f"top {_fmt(g.TABLE_TOP)} all along; the gate leg at the far end")
    z0, z1 = -g.OPEN_Z[0], -g.OPEN_Z[1]
    zj = -g.TABLE_Z[1]
    o.append(rect(Z(zj), Y(g.TABLE_TOP), (zj - z0) * s, tt * s, "#f1e1c8", OAKS, 0, 1.4))
    o.append(rect(Z(z1), Y(g.TABLE_TOP), (z1 - zj) * s, lt_ * s, OAKF, OAKS, 0, 1.4))
    o.append(f'<line x1="{Z(zj)}" y1="{Y(g.TABLE_TOP) - 4}" x2="{Z(zj)}" y2="{Y(g.TABLE_TOP - tt) + 4}" stroke="#5a3a20" stroke-width="2"/>')
    o.append(f'<path d="M{Z(3.6)},{Y(rt - 2.4)} L{Z(3 + arm)},{Y(rt - 2.4)} M{Z(3.6)},{Y(rt - bh + 2)} L{Z(31)},{Y(rt - 2.4)}" stroke="#6f7174" stroke-width="2.4" fill="none"/>')
    lz = z1 - g.FLIP["hinge_in"] - g.LEG[0] / 2
    o.append(rect(Z(lz + g.LEG[0] / 2), Y(g.GATE_LEG_H), g.LEG[0] * s, g.GATE_LEG_H * s, "#dcb98d", OAKS, 0))
    o.append(rect(Z(lz + 1), Y(g.GATE_LEG_H), 2 * s, g.FLIP["apron"][0] * s, "#c99d6b", OAKS, 0))
    for (y, z, txt, anc, dx) in [(g.TABLE_TOP + 8, (z0 + zj) / 2, f"the top {_fmt(tw)} × {_fmt(td)}", "middle", 0),
                                 (g.TABLE_TOP - 14, (z0 + zj) / 2 - 6, "on two Hebgo brackets", "middle", 0),
                                 (g.TABLE_TOP + 8, (zj + z1) / 2, f"the half {_fmt(lw_)} × {_fmt(ld_)}", "middle", 0),
                                 (g.TABLE_TOP + 22, zj, f"{g.FLIP['hinges']} brass flip-top hinges at the joint", "middle", 0),
                                 (g.GATE_LEG_H / 2 + 6, lz, "the gate leg:", "start", 10),
                                 (g.GATE_LEG_H / 2 - 6, lz, "two oak legs and an apron,", "start", 10),
                                 (g.GATE_LEG_H / 2 - 18, lz, "hinged under the half", "start", 10)]:
        o.append(t(Z(z) + dx, Y(y), txt, 9.5, anc, 500))
    o.append(f'<line x1="{Z(z0)}" y1="{Y(-8)}" x2="{Z(z1)}" y2="{Y(-8)}" stroke="{BLUE}" stroke-width="1.2"/>')
    o.append(t(Z((z0 + z1) / 2), Y(-8) + 14, f"{_fmt(z1 - z0)} of table, {_fmt(z1)} out from the wall", 9.5, "middle", 600, BLUE))
    o.append('<defs><pattern id="brick5" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#e2b9a4"/>'
             '<path d="M0,3 H10 M5,0 V3 M0,3 V6 M10,3 V6" stroke="#c08a72" stroke-width="0.8"/></pattern></defs>')
    steps = ["To open: turn the two buttons and lower the pair onto the brackets as they swing out and lock (two people: about 37 kg).",
             "Flip the half over onto the room side: it opens on its hinges to lie flush with the top. Swing the gate leg down until it stops.",
             "To fold: gate leg up flat, half back over onto the top, then lift the pair up to the wall and turn the buttons."]
    for i, n in enumerate(steps):
        o.append(t(0, 62 + i * 17, f"{i + 1}. " + n, 9.8, "start", 400, INK))
    return svg(W, H, "\n".join(o), "The flip-top table: folded, and open",
               "In section through its centre line, to scale, the wall on the right of each. It never comes off the wall, and there's no leaf to store.")


def chair_storage():
    """v19: the stairs wall seen from the room, to scale: the table folded under your shelf; v20: four folded chairs, two on each hook, in the gap at its
    window end, and why the gap at the stair end and the space under the stairs are only maybes."""
    g = G
    W, H = 900, 850
    k = 2.55
    z0, z1 = 0.0, g.WINDOW_Z                       # left edge: the door wall's line; right edge: the window wall
    ox, oy = 30, 120
    X = lambda z: ox + (z0 - z) * k
    Y = lambda y: oy + (g.CEIL - y) * k
    cw, cdep, ch = g.CHAIR_FOLDED
    CS = g.CHAIR_STORE
    hz0, hz1 = CS["hooks"]["z"]
    sg0, sg1 = CS["stair_gap"]
    o = []
    o.append(f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - z1) * k}" height="{g.CEIL * k}" fill="#f4f1ea" stroke="{WALL}" stroke-width="2"/>')
    # the stairs: the flight rising away from the room, seen end-on past the stair box's face
    sz = g.STAIRS_WALL_Z[0]
    o.append(f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - sz) * k}" height="{g.CEIL * k}" fill="#e6e0d3" stroke="#9a958b"/>')
    for i in range(10):
        y = (i + 1) * g.STAIR_RISE
        o.append(f'<line x1="{X(z0)}" y1="{Y(y)}" x2="{X(sz)}" y2="{Y(y)}" stroke="#b8b09f" stroke-width="1"/>')
    o.append(t(X((z0 + sz) / 2), Y(130), "stairs", 11, "middle", 650, MUTED))
    o.append(t(X((z0 + sz) / 2), Y(130) + 14, "(up)", 10, "middle", 400, MUTED))
    # the stair's foot: keep clear
    o.append(f'<rect x="{X(sz)}" y="{Y(g.CEIL)}" width="{(sz - sg0) * k}" height="{g.CEIL * k}" fill="#fbe7e1" fill-opacity="0.55"/>')
    o.append(t(X((sz + sg0) / 2), Y(40), "keep clear:", 9.5, "middle", 650, "#a3352b"))
    o.append(t(X((sz + sg0) / 2), Y(40) + 12, "the stairs' foot", 9.5, "middle", 400, "#a3352b"))
    # the pipe boxing in the window corner
    pb = g.PIPE_BOX
    o.append(f'<rect x="{X(pb["z"][1])}" y="{Y(g.CEIL)}" width="{(pb["z"][1] - pb["z"][0]) * k}" height="{g.CEIL * k}" fill="#d8d3c8" stroke="{WALL}" stroke-width="1.4"/>')
    o.append(t(X((pb["z"][0] + pb["z"][1]) / 2), Y(120), "pipe", 9.5, "middle", 600, MUTED))
    o.append(t(X((pb["z"][0] + pb["z"][1]) / 2), Y(120) + 12, "boxing", 9.5, "middle", 600, MUTED))
    # your shelf
    sb = g.SHELF_B
    o.append(f'<rect x="{X(sb["z"][0])}" y="{Y(sb["top"])}" width="{(sb["z"][0] - sb["z"][1]) * k}" height="{sb["t"] * k}" fill="#2a2a2b"/>')
    o.append(t(X((sb["z"][0] + sb["z"][1]) / 2), Y(sb["top"]) - 6, "your 2 m shelf (underside at " + _fmt(sb["top"] - sb["t"]) + ")", 10, "middle", 600))
    # the table, folded
    tz0, tz1 = g.TABLE_B_Z
    o.append(f'<rect x="{X(tz0)}" y="{Y(g.FOLDED_TOP)}" width="{(tz0 - tz1) * k}" height="{(g.FOLDED_TOP - g.RAIL_TOP + g.RAIL[1]) * k}" fill="#e9d3b4" stroke="#b88a55" stroke-width="1.4"/>')
    o.append(t(X((tz0 + tz1) / 2), Y(115), "the flip-top, folded", 11, "middle", 650, "#5a3a20"))
    o.append(t(X((tz0 + tz1) / 2), Y(115) + 14, f"{_fmt(g.FOLDED_D)} off the wall", 9.5, "middle", 400, "#5a3a20"))
    # v20: the chair cupboard in the gap, its doors drawn see-through so the four chairs inside show
    CB = CS["cupboard"]
    cz = (hz0 + hz1) / 2
    o.append(f'<rect x="{X(hz0)}" y="{Y(CB["h"])}" width="{(hz0 - hz1) * k}" height="{CB["h"] * k}" fill="#e9d3b4" fill-opacity="0.55" stroke="#9c6a3f" stroke-width="2"/>')
    o.append(f'<rect x="{X(hz0)}" y="{Y(CB["shelf_y"] + CB["t"])}" width="{(hz0 - hz1) * k}" height="{CB["t"] * k}" fill="#b88a55"/>')                      # the shelf
    o.append(f'<line x1="{X(hz0)}" y1="{Y(CB["shelf_y"])}" x2="{X(hz1)}" y2="{Y(CB["shelf_y"])}" stroke="#9c6a3f" stroke-width="1.4"/>')                       # the doors' meeting line
    for y0_ in (CB["plinth"], CB["shelf_y"] + CB["t"]):
        ya, yb = y0_, y0_ + ch
        xa, xb = X(cz + cw / 2), X(cz - cw / 2)
        o.append(f'<rect x="{xa}" y="{Y(yb)}" width="{cw * k}" height="{ch * k}" rx="4" fill="none" stroke="#9c6a3f" stroke-dasharray="5 3"/>')
        o.append(f'<rect x="{xa + 5 * k}" y="{Y(yb - 6)}" width="{(cw - 10) * k}" height="{24 * k}" rx="3" fill="none" stroke="#b88a55" stroke-dasharray="3 3"/>')
        o.append(t((xa + xb) / 2, Y((ya + yb) / 2) + 4, "2 chairs", 11, "middle", 700, "#5a3a20"))
        o.append(t((xa + xb) / 2, Y((ya + yb) / 2) + 17, "one behind the other", 8.5, "middle", 500, "#5a3a20"))
    for yk in (CB["shelf_y"] * 0.55, CB["shelf_y"] + (CB["h"] - CB["shelf_y"]) * 0.55):
        o.append(f'<circle cx="{X(hz0) + 6}" cy="{Y(yk)}" r="2.6" fill="#5a3a20"/>')                                                                       # push latches
    o.append(t(X(hz0) - 6, Y(165), "the chair cupboard →", 10.5, "end", 700, "#2f7a4a"))
    o.append(t(X(hz0) - 6, Y(165) + 12, f"{_fmt(hz0 - hz1)} × {_fmt(CB['d'])} × {_fmt(CB['h'])}, two doors", 9.5, "end", 500, "#2f7a4a"))
    # dimensions
    def dz(za, zb, y, lab, col=BLUE, dy=-5):
        o.append(f'<line x1="{X(za)}" y1="{Y(y)}" x2="{X(zb)}" y2="{Y(y)}" stroke="{col}" stroke-width="1.3"/>')
        for zz in (za, zb):
            o.append(f'<line x1="{X(zz)}" y1="{Y(y) - 5}" x2="{X(zz)}" y2="{Y(y) + 5}" stroke="{col}" stroke-width="1.3"/>')
        o.append(t((X(za) + X(zb)) / 2, Y(y) + dy, lab, 10, "middle", 700, col))
    def dy_(z, ya, yb, lab, col=BLUE):
        o.append(f'<line x1="{X(z)}" y1="{Y(ya)}" x2="{X(z)}" y2="{Y(yb)}" stroke="{col}" stroke-width="1.3"/>')
        o.append(t(X(z) + 5, (Y(ya) + Y(yb)) / 2 + 4, lab, 9.5, "start", 700, col))
    dz(hz0, hz1, -6, f"{_fmt(hz0 - hz1)} gap · chairs {_fmt(cw)} wide", dy=14)
    dz(sg0, sg1, -6, f"{_fmt(sg0 - sg1)}: {_fmt(cw - (sg0 - sg1))} too narrow", "#a3352b", dy=14)
    dy_(hz1 + 3, CS["cupboard"]["h"], sb["top"] - sb["t"], f"{_fmt(sb['top'] - sb['t'] - CS['cupboard']['h'])}")
    o.append(t(X(hz0) - 6, Y(CS["cupboard"]["shelf_y"]) + 4, f"shelf at {_fmt(CS['cupboard']['shelf_y'])} →", 9, "end", 600, BLUE))
    o.append(f'<line x1="{X(z0) - 8}" y1="{Y(0)}" x2="{X(z1) + 8}" y2="{Y(0)}" stroke="{WALL}" stroke-width="2.4"/>')
    o.append(t(X(z0), Y(0) + 40, "← door wall (south)", 9.5, "start", 500, MUTED))
    o.append(t(X(z1), Y(0) + 40, "window wall (north) →", 9.5, "end", 500, MUTED))
    notes = [f"1 · The chair cupboard (with the flip-top): four folded chairs packed away beside the table, {_fmt(CS['cupboard']['d'])} deep like the pipe boxing; about £120–240.",
             f"2 · All six inside: build it {_fmt(CS['cupboard']['d6'])} deep, three chairs deep ({_fmt(CS['cupboard']['d6'] - CS['cupboard']['d'])} proud of the boxing). Or keep chairs five and six in the garage.",
             "3 · Cheaper: two 200 mm storage hooks in the same gap hold the same four on show, £8–15."]
    for i, n_ in enumerate(notes):
        o.append(t(0, Y(0) + 68 + i * 17, n_, 10.2, "start", 500 if i else 650, INK if i else "#2f7a4a"))
    return svg(W, H, "\n".join(o), "With the flip-top (the alternative): keeping its chairs, the stairs wall packed away",
               f"To scale (1 cm = {k} px). The table doesn't change or move; an oak cupboard beside it holds four folded chairs ({_fmt(cw)} × {_fmt(cdep)} × {_fmt(ch)}); doors drawn see-through.")


def chair_options():
    """v23, client: "explore any further ways we can build the chairs into the table build": three ways, each cut through the stairs
    wall to scale (the wall on the right, the room on the left): the chair cupboard beside the table (the plan), four chairs hung behind
    the folded top on a deeper backboard, and a fold-down oak seat in the gap at the stair end."""
    g = G
    k, H0 = 1.45, 450
    cw, cdep, ch = g.CHAIR_FOLDED
    B, S, C = g.BEHIND_TOP, g.WALL_SEAT, g.CHAIR_STORE["cupboard"]
    rail, top_t, top_h, y_top = g.RAIL[2], g.TABLE[2], g.TABLE[1], g.RAIL_TOP
    OAK, OAKS, CH, CHS, RED = "#d9b07a", "#9a6634", "#e8e3d8", "#8a857a", "#a3352b"
    o = []
    def panel(px, title, sub):
        wx = px + 250                                  # the wall's face
        Xp = lambda d: wx - d * k                      # d: cm out from the wall into the room
        Yp = lambda y: H0 - y * k
        o.append(f'<rect x="{wx}" y="{Yp(g.CEIL)}" width="14" height="{g.CEIL * k}" fill="{HATCH}" stroke="{WALL}" stroke-width="1.4"/>')
        o.append(f'<line x1="{px}" y1="{Yp(0)}" x2="{wx + 14}" y2="{Yp(0)}" stroke="{WALL}" stroke-width="1.6"/>')
        o.append(f'<rect x="{Xp(g.SHELF_B["d"])}" y="{Yp(g.SHELF_B["top"])}" width="{g.SHELF_B["d"] * k}" height="{g.SHELF_B["t"] * k}" fill="#2a2c2e"/>')
        o.append(t(px, Yp(g.CEIL) - 30, title, 12.5, "start", 700))
        for i, line in enumerate(sub):
            o.append(t(px, Yp(g.CEIL) - 14 + i * 13, line, 10, "start", 400, MUTED))
        return Xp, Yp
    def table(Xp, Yp, off, label=True):                # the folded table: the rail (gate and folded half behind the top) and the top
        o.append(rect(Xp(off), Yp(y_top + top_h), (off - (off - rail)) * k, top_h * k, "#efe2cc", OAKS, 1, 1))
        o.append(rect(Xp(off + top_t), Yp(y_top + top_h), top_t * k, top_h * k, OAK, OAKS, 1, 1.2))
        if label:
            o.append(t(Xp(off + top_t) - 5, Yp(y_top + top_h / 2), "folded top", 9.5, "end", 600, OAKS))
            o.append(t(Xp(off + top_t) - 5, Yp(y_top + top_h / 2) + 12, f"{_fmt(off + top_t)} off the wall", 9.5, "end", 400, MUTED))
    def chair(Xp, Yp, d, y0, dashed=False):
        o.append(rect(Xp(d + cdep), Yp(y0 + ch), cdep * k, ch * k, CH, CHS, 2, 1, 'stroke-dasharray="3 2"' if dashed else ""))
    # 1 · the plan (v20): the chair cupboard beside the table, flush with the pipe boxing
    Xp, Yp = panel(10, "1 · The plan: the cupboard beside", [f"{_fmt(C['d'])} deep, {_fmt(C['h'])} tall, next to the table", "four chairs inside, two on each level"])
    o.append(rect(Xp(C["d"]), Yp(C["h"] + C["plinth"]), C["d"] * k, (C["h"] + C["plinth"]) * k, "none", OAKS, 1, 1.2, 'stroke-dasharray="5 3"'))
    for d in (0.6, 0.6 + cdep + 0.3):
        chair(Xp, Yp, d, C["plinth"], True); chair(Xp, Yp, d, C["shelf_y"] + C["t"], True)
    table(Xp, Yp, rail)
    o.append(t(Xp(C["d"]) - 4, Yp(C["h"]) + 14, "the cupboard,", 9.5, "end", 600, OAKS))
    o.append(t(Xp(C["d"]) - 4, Yp(C["h"]) + 26, "beside it (dashed)", 9.5, "end", 400, MUTED))
    # 2 · four chairs hung behind the folded top
    Xp, Yp = panel(330, "2 · Behind the folded top", [f"the backboard {_fmt(B['gap'])} deeper: two chairs deep,", "two across, on hooks; an upstand hides their feet"])
    hang = y_top - B["upstand"] + 1
    for d in (B["hook"], B["hook"] + cdep):
        chair(Xp, Yp, d, hang)
    o.append(rect(Xp(B["hook"]), Yp(hang + ch + 6), B["hook"] * k, 8 * k, "#6e6a62", "#3a3a38", 1, 1))
    table(Xp, Yp, B["rail"])
    o.append(rect(Xp(B["rail"] + top_t), Yp(y_top), (B["rail"] + top_t) * k, B["upstand"] * k, OAK, OAKS, 1, 1))
    o.append(t(Xp(B["rail"] / 2), Yp(y_top - B["upstand"]) + 14, f"{_fmt(B['upstand'])} oak upstand", 9.5, "middle", 600, OAKS))
    o.append(t(Xp(B["gap"] / 2), Yp(hang + ch + 12), "4 chairs, hidden", 9.5, "middle", 700, CHS))
    # 3 · a fold-down oak seat in the gap at the stair end
    Xp, Yp = panel(650, "3 · A fold-down seat at the stair end", [f"oak, {_fmt(S['w'])} × {_fmt(S['d'])}, on two folding bench brackets", f"in the {_fmt(g.CHAIR_STORE['stair_gap'][0] - g.CHAIR_STORE['stair_gap'][1])} gap: a fifth seat, always there"])
    o.append(rect(Xp(S["fold"] + S["t"]), Yp(S["h"] + S["d"] - 2), S["t"] * k, S["d"] * k, OAK, OAKS, 1, 1.2))
    o.append(rect(Xp(S["fold"]), Yp(S["h"] + 10), S["fold"] * k, 30 * k, "#8e8a82", "#3a3a38", 1, 1))
    o.append(t(Xp(S["fold"] + S["t"]) - 5, Yp(S["h"] + S["d"] / 2), "folded:", 9.5, "end", 600, OAKS))
    o.append(t(Xp(S["fold"] + S["t"]) - 5, Yp(S["h"] + S["d"] / 2) + 12, f"{_fmt(S['fold'] + S['t'])} proud", 9.5, "end", 400, MUTED))
    o.append(rect(Xp(S["d"]), Yp(S["h"]), S["d"] * k, S["t"] * k, "none", OAKS, 1, 1.2, 'stroke-dasharray="4 3"'))
    o.append(f'<line x1="{Xp(0)}" y1="{Yp(S["h"] - 26)}" x2="{Xp(S["d"] - 3)}" y2="{Yp(S["h"])}" stroke="#8e8a82" stroke-width="2" stroke-dasharray="4 3"/>')
    o.append(t(Xp(S["d"]) - 6, Yp(S["h"]) + 4, f"open: {_fmt(S['d'])} deep, {_fmt(S['h'])} high", 9.5, "end", 600, OAKS))
    notes = [("1", "the plan (v20): about £120–240; six inside if it's built 31 deep"),
             ("2", f"about £40–80 (hooks, a deeper oak backboard and an upstand); the table stands {_fmt(B['rail'] + top_t)} off the wall, {_fmt(B['gap'])} further into the room, open too"),
             ("3", "about £50–90 (two brackets and an oak seat); goes with 1 or 2: four or six chairs put away, and a fifth seat that's always there")]
    for i, (n, s_) in enumerate(notes):
        o.append(t(10, H0 + 32 + i * 15, f"{n} · {s_}", 10.5, "start", 600 if i == 0 else 400, INK if i == 0 else MUTED))
    return svg(970, H0 + 32 + 3 * 15 + 10, "\n".join(o), "Building the chairs into the table: three ways, cut through the stairs wall",
               "To scale (1 cm = 1.45 px), the wall on the right. The plan stays as 1; 2 and 3 are options that need your say.")



# ------------------------------------------------------------------ v26: option C, the dining cabinet
OAKF, OAKS, OAKD = "#e9d3b4", "#b88a55", "#9c6a3f"


def option_c_elevation():
    """The stairs wall from the room, to scale: one oak cabinet under your shelf, the table standing up in its bay at the stair end
    with a drawer under it and the linen shelf over it; six folded chairs in the chair bay, four on the floor and two on the shelf.
    v29: the two sliding doors drawn see-through over them."""
    g, C = G, G.OPTC
    W, H = 900, 860
    k = 2.55
    z0, z1 = 0.0, g.WINDOW_Z
    ox, oy = 30, 110
    X = lambda z: ox + (z0 - z) * k
    Y = lambda y: oy + (g.CEIL - y) * k
    cw, cdep, ch = g.CHAIR_FOLDED
    o = [f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - z1) * k}" height="{g.CEIL * k}" fill="#f4f1ea" stroke="{WALL}" stroke-width="2"/>']
    sz = g.STAIRS_WALL_Z[0]
    o.append(f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - sz) * k}" height="{g.CEIL * k}" fill="#e6e0d3" stroke="#9a958b"/>')
    for i in range(10):
        y = (i + 1) * g.STAIR_RISE
        o.append(f'<line x1="{X(z0)}" y1="{Y(y)}" x2="{X(sz)}" y2="{Y(y)}" stroke="#b8b09f" stroke-width="1"/>')
    o.append(t(X((z0 + sz) / 2), Y(130), "stairs", 11, "middle", 650, MUTED))
    o.append(f'<rect x="{X(sz)}" y="{Y(g.CEIL)}" width="{(sz - C["z"][0]) * k}" height="{g.CEIL * k}" fill="#fbe7e1" fill-opacity="0.55"/>')
    o.append(t(X((sz + C["z"][0]) / 2), Y(40), "keep clear:", 9.5, "middle", 650, "#a3352b"))
    o.append(t(X((sz + C["z"][0]) / 2), Y(40) + 12, "the stairs' foot", 9.5, "middle", 400, "#a3352b"))
    pb = g.PIPE_BOX
    o.append(f'<rect x="{X(pb["z"][1])}" y="{Y(g.CEIL)}" width="{(pb["z"][1] - pb["z"][0]) * k}" height="{g.CEIL * k}" fill="#d8d3c8" stroke="{WALL}" stroke-width="1.4"/>')
    sb = g.SHELF_B
    o.append(f'<rect x="{X(sb["z"][0])}" y="{Y(sb["top"])}" width="{(sb["z"][0] - sb["z"][1]) * k}" height="{sb["t"] * k}" fill="#2a2a2b"/>')
    o.append(t(X((sb["z"][0] + sb["z"][1]) / 2), Y(sb["top"]) - 6, f"your 2 m shelf (underside at {_fmt(sb['top'] - sb['t'])})", 10, "middle", 600))
    # the cabinet
    ca, cb = C["z"]
    o.append(f'<rect x="{X(ca)}" y="{Y(C["h"])}" width="{(ca - cb) * k}" height="{C["h"] * k}" fill="{OAKF}" stroke="{OAKD}" stroke-width="2"/>')
    bt0, bt1 = C["bay_t"]; bc0, bc1 = C["bay_c"]
    o.append(f'<line x1="{X(bt1 - C["t"] / 2)}" y1="{Y(C["h"])}" x2="{X(bt1 - C["t"] / 2)}" y2="{Y(0)}" stroke="{OAKD}" stroke-width="2"/>')
    # the table bay: the folded table's underside in its apron frame, the legs folded inside, the drawer under it
    tz0, tz1 = C["tz"]; py = C["pivot"][1]; tl = C["top"][1]
    o.append(f'<rect x="{X(tz0)}" y="{Y(py + tl)}" width="{(tz0 - tz1) * k}" height="{tl * k}" fill="#dfc29c" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<rect x="{X(tz0) + 2 * k}" y="{Y(py + tl) + 2 * k}" width="{(tz0 - tz1 - 4) * k}" height="{(tl - 4) * k}" fill="none" stroke="{OAKS}" stroke-width="1"/>')
    for z in (C["cz"] + 13, C["cz"] - 13):
        o.append(f'<rect x="{X(z + 2)}" y="{Y(py + tl - 6)}" width="{4 * k}" height="{(tl - 12) * k}" fill="#cfae84" stroke="{OAKD}" stroke-width="0.8"/>')
    o.append(t(X(C["cz"]), Y(py + tl / 2) - 6, "the table,", 11, "middle", 700, "#5a3a20"))
    o.append(t(X(C["cz"]), Y(py + tl / 2) + 8, "folded double,", 10, "middle", 500, "#5a3a20"))
    o.append(t(X(C["cz"]), Y(py + tl / 2) + 21, "standing up", 10, "middle", 500, "#5a3a20"))
    o.append(f'<rect x="{X(tz0)}" y="{Y(py - 7)}" width="{(tz0 - tz1) * k}" height="{(py - 7 - C["plinth"]) * k}" fill="{OAKF}" stroke="{OAKD}" stroke-width="1.2"/>')
    o.append(t(X(C["cz"]), Y((py - 7 + C["plinth"]) / 2) + 4, "drawer: mats, coasters", 9.5, "middle", 600, "#5a3a20"))
    o.append(f'<rect x="{X(tz0)}" y="{Y(C["h"] - C["t"])}" width="{(tz0 - tz1) * k}" height="{(C["h"] - C["t"] - C["folded_top"]) * k}" fill="#efe2cf" stroke="{OAKD}" stroke-width="1.2"/>')
    o.append(t(X(C["cz"]), Y((C["h"] + C["folded_top"]) / 2) + 4, "linen shelf: cloth, napkins, runner", 9.5, "middle", 600, "#5a3a20"))
    o.append(f'<circle cx="{X(C["cz"])}" cy="{Y(py - 3.5)}" r="3.2" fill="{BLUE}"/>')
    o.append(t(X(tz1) - 4, Y(py - 3.5) + 4, f"← piano hinge at {_fmt(py)}", 9, "start", 700, BLUE))
    # the chair bay (v27): six folded chairs, two across; two deep on the floor, one deep on the shelf with the seat pads in front
    o.append(f'<rect x="{X(bc0)}" y="{Y(C["shelf_y"] + C["t"])}" width="{(bc0 - bc1) * k}" height="{C["t"] * k}" fill="{OAKS}"/>')
    zm = (bc0 + bc1) / 2
    o.append(f'<line x1="{X(zm)}" y1="{Y(C["h"])}" x2="{X(zm)}" y2="{Y(C["plinth"])}" stroke="{OAKD}" stroke-width="1.2" stroke-dasharray="6 3"/>')
    for y0_, lab, sub in ((C["plinth"], "2 chairs", "two deep"), (C["shelf_y"] + C["t"], "1 chair", "+ seat pads")):
        for cz in (zm + cw / 2 + 2, zm - cw / 2 - 2):
            xa = X(cz + cw / 2)
            o.append(f'<rect x="{xa}" y="{Y(y0_ + ch)}" width="{cw * k}" height="{ch * k}" rx="4" fill="none" stroke="{OAKD}" stroke-dasharray="5 3"/>')
            o.append(t(xa + cw * k / 2, Y(y0_ + ch / 2) + 4, lab, 11, "middle", 700, "#5a3a20"))
            o.append(t(xa + cw * k / 2, Y(y0_ + ch / 2) + 17, sub, 8.5, "middle", 500, "#5a3a20"))
    # v29: the two sliding doors, see-through, and which way each goes
    o.append(f'<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="{BLUE}"/></marker></defs>')
    for kd, lab in (("A", "door A: slides over B to open the table"), ("B", "door B: slides behind A for the chairs")):
        za, zb = C["doors"][kd]["shut"]
        y1 = C["plinth"] + 0.3 + C["door_h"]
        o.append(f'<rect x="{X(za):.1f}" y="{Y(y1):.1f}" width="{(za - zb) * k:.1f}" height="{C["door_h"] * k:.1f}" fill="{OAKF}" fill-opacity="0.28" stroke="{OAKD}" stroke-width="1.8"/>')
        zs = za - 5 if kd == "A" else zb + 5
        o.append(f'<rect x="{X(zs) - 1.25 * k:.1f}" y="{Y(118):.1f}" width="{2.5 * k:.1f}" height="{26 * k:.1f}" rx="3" fill="#3a2b20"/>')
        o.append(t(X((za + zb) / 2), Y(-36), lab, 9.5, "middle", 700, BLUE))          # under the dimensions, clear of the inside's labels
        sgn = 1 if kd == "A" else -1
        xm = X((za + zb) / 2)
        o.append(f'<path d="M{xm - 40 * sgn:.1f},{Y(-36) + 9:.1f} L{xm + 40 * sgn:.1f},{Y(-36) + 9:.1f}" stroke="{BLUE}" stroke-width="1.6" marker-end="url(#arr)"/>')
    o.append(f'<line x1="{X(ca):.1f}" y1="{Y(C["h"] - C["t_top"]) + 2:.1f}" x2="{X(cb):.1f}" y2="{Y(C["h"] - C["t_top"]) + 2:.1f}" stroke="#8d9196" stroke-width="2.4"/>')
    # dimensions
    def dz(za, zb, y, lab, col=BLUE, dy=-5):
        o.append(f'<line x1="{X(za)}" y1="{Y(y)}" x2="{X(zb)}" y2="{Y(y)}" stroke="{col}" stroke-width="1.3"/>')
        for zz in (za, zb):
            o.append(f'<line x1="{X(zz)}" y1="{Y(y) - 5}" x2="{X(zz)}" y2="{Y(y) + 5}" stroke="{col}" stroke-width="1.3"/>')
        o.append(t((X(za) + X(zb)) / 2, Y(y) + dy, lab, 10, "middle", 700, col))
    dz(ca, cb, -7, f"{_fmt(ca - cb)} long · {_fmt(C['d'])} deep · {_fmt(C['h'])} tall", dy=15)
    dz(tz0, tz1, -20, f"table {_fmt(C['top'][0])} wide", dy=15)
    o.append(t(X(ca) + 4, Y(C["folded_top"]) - 3, f"top edge {_fmt(C['folded_top'])} →", 9, "end", 600, BLUE))
    o.append(f'<line x1="{X(z0) - 8}" y1="{Y(0)}" x2="{X(z1) + 8}" y2="{Y(0)}" stroke="{WALL}" stroke-width="2.4"/>')
    o.append(t(X(z0), Y(0) + 46, "← door wall", 9.5, "start", 500, MUTED))
    o.append(t(X(z1), Y(0) + 46, "window wall →", 9.5, "end", 500, MUTED))
    return svg(W, H, "\n".join(o), "The sliding cabinet (the alternative), packed away",
               f"The stairs wall from the room, to scale (1 cm = {k} px). Two sliding doors (drawn see-through): the table stands up behind door A, the six chairs behind door B.")


def option_c_section():
    """A cut through the table bay, wall on the right: the halves standing up face to face behind door A, then down on their legs."""
    g, C = G, G.OPTC
    W, H = 900, 780
    k = 3.3
    xR = g.ROOM_W + 2
    ox, oy = 40, 60
    xL = C["tx"][0] - 6
    X = lambda x: ox + (x - xL) * k            # room x on the left .. the wall on the right
    Y = lambda y: oy + (200 - y) * k
    o = []
    o.append(f'<rect x="{X(g.ROOM_W)}" y="{Y(200)}" width="10" height="{200 * k}" fill="url(#hatch3)" stroke="{WALL}" stroke-width="2"/>')
    o.append('<defs><pattern id="hatch3" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#c9c3b5" stroke-width="2"/></pattern></defs>')
    o.append(f'<line x1="{X(C["tx"][0] - 6)}" y1="{Y(0)}" x2="{X(g.ROOM_W) + 10}" y2="{Y(0)}" stroke="{WALL}" stroke-width="2.4"/>')
    # the cabinet's side, in outline
    o.append(f'<rect x="{X(C["front"])}" y="{Y(C["h"])}" width="{C["d"] * k}" height="{C["h"] * k}" fill="none" stroke="{OAKD}" stroke-width="1.4" stroke-dasharray="4 3"/>')
    o.append(f'<rect x="{X(C["inner"])}" y="{Y(C["pivot"][1])}" width="{C["in_d"] * k}" height="{7 * k}" fill="{OAKS}"/>')
    o.append(f'<rect x="{X(C["inner"])}" y="{Y(C["pivot"][1] - 7)}" width="{C["door"] * k}" height="{(C["pivot"][1] - 7 - C["plinth"]) * k}" fill="{OAKF}" stroke="{OAKD}"/>')
    o.append(t(X(C["inner"]) + 10, Y(20), "drawer", 9.5, "start", 600, "#5a3a20"))
    # v29: door A on the front track (dashed: it slides away before the table comes down), and the doors' 5 cm
    xa = C["door_x"]["front"][0]
    o.append(f'<rect x="{X(xa):.1f}" y="{Y(C["plinth"] + 0.3 + C["door_h"]):.1f}" width="{C["door"] * k:.1f}" height="{C["door_h"] * k:.1f}" fill="#e9d3b4" stroke="{OAKD}" stroke-dasharray="5 3"/>')
    o.append(t(X(xa) - 6, Y(C["h"] - 2), "door A: slide it away", 9.5, "end", 700, "#5a3a20"))
    o.append(t(X(xa) - 6, Y(C["h"] - 2) + 13, "before the table comes down", 9, "end", 500, "#5a3a20"))
    o.append(f'<line x1="{X(C["front"]):.1f}" y1="{Y(C["h"]) - 10:.1f}" x2="{X(C["inner"]):.1f}" y2="{Y(C["h"]) - 10:.1f}" stroke="{BLUE}" stroke-width="1.2"/>')
    o.append(t(X(C["front"]) - 4, Y(C["h"]) - 6, f"the doors and their track: {_fmt(C['slide'])}", 9, "end", 700, BLUE))
    px, py = C["pivot"]; tt = C["top"][2]; tl = C["top"][1]; ap = C["apron"]
    # folded: the stack standing in the bay (dashed)
    o.append(f'<rect x="{X(px)}" y="{Y(py + tl)}" width="{(2 * tt + 0.3 + ap) * k}" height="{tl * k}" fill="#f1e2cc" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    o.append(f'<rect x="{X(C["inner"])}" y="{Y(py + tl)}" width="{ap * k}" height="{tl * k}" fill="#e9d3b4" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    o.append(t(X(C["front"]) - 8, Y(py + tl) - 16, "folded:", 10, "end", 700, "#5a3a20"))
    o.append(t(X(C["front"]) - 8, Y(py + tl) - 3, f"{_fmt(C['stack'])} deep, top at {_fmt(C['folded_top'])}", 9.5, "end", 500, "#5a3a20"))
    # open: the two halves, the legs
    jx, tx0, tx1 = C["joint_x"], C["tx"][0], C["tx"][1]
    o.append(f'<rect x="{X(tx0)}" y="{Y(py + tt)}" width="{(tx1 - tx0) * k}" height="{tt * k + 1}" fill="#d9b48a" stroke="{OAKD}" stroke-width="1.4"/>')
    for a, b in ((tx0 + 0.5, jx - 0.5), (jx + 0.5, tx1 - ap)):
        o.append(f'<rect x="{X(a)}" y="{Y(py)}" width="{(b - a) * k}" height="{ap * k}" fill="none" stroke="{OAKS}" stroke-width="1"/>')   # the aprons
    o.append(f'<line x1="{X(jx)}" y1="{Y(py + tt) - 6}" x2="{X(jx)}" y2="{Y(py) + 6}" stroke="{BLUE}" stroke-width="1.6"/>')
    o.append(t(X(jx), Y(py + tt) - 10, "flip-top hinges", 9.5, "middle", 700, BLUE))
    for lx in sorted({round(l[0], 1) for l in C["legs"]}):
        o.append(f'<rect x="{X(lx - C["leg"][0] / 2)}" y="{Y(C["leg_h"])}" width="{C["leg"][0] * k}" height="{C["leg_h"] * k}" fill="#cfae84" stroke="{OAKD}"/>')
    o.append(f'<circle cx="{X(px)}" cy="{Y(py)}" r="4" fill="{BLUE}"/>')
    # v29.1: the label left of door A's dashed line (it sat on top of it), a short leader to the hinge
    o.append(f'<line x1="{X(xa) - 4:.1f}" y1="{Y(py) + 14:.1f}" x2="{X(px) - 4:.1f}" y2="{Y(py) + 3:.1f}" stroke="{BLUE}" stroke-width="1"/>')
    o.append(t(X(xa) - 6, Y(py) + 18, "piano hinge", 9.5, "end", 700, BLUE))
    o.append(f'<path d="M{X(px - 70)},{Y(py + 6)} A{70 * k},{70 * k} 0 0 1 {X(px - 4)},{Y(py + 70)}" fill="none" stroke="{BLUE}" stroke-width="1.4" stroke-dasharray="5 3" marker-end="none"/>')
    def dx(xa, xb, y, lab, dy=-6):
        o.append(f'<line x1="{X(xa)}" y1="{Y(y)}" x2="{X(xb)}" y2="{Y(y)}" stroke="{BLUE}" stroke-width="1.3"/>')
        for xx in (xa, xb):
            o.append(f'<line x1="{X(xx)}" y1="{Y(y) - 5}" x2="{X(xx)}" y2="{Y(y) + 5}" stroke="{BLUE}" stroke-width="1.3"/>')
        o.append(t((X(xa) + X(xb)) / 2, Y(y) + dy, lab, 10, "middle", 700, BLUE))
    dx(tx0, jx, py + 26, f"outer half {_fmt(tl)}")
    dx(jx, tx1, py + 26, f"inner half {_fmt(tl)}")
    dx(tx0, tx1, -12, f"open: {_fmt(C['len'])} from the cabinet, the top at {_fmt(g.TABLE_TOP)}", dy=16)
    o.append(t(X(tx0 + 12), Y(C["leg_h"] / 2), f"legs {_fmt(C['leg_h'])}, folding", 9.5, "start", 600, "#5a3a20"))
    return svg(W, H, "\n".join(o), "The sliding cabinet: how the table comes down",
               "Cut through the table bay, wall on the right. Folded (dashed): standing up behind door A. Open: slide A away, swing it down, flip the outer half.")


def option_c_plan():
    """The room from above with the dining cabinet open for six (v27): three on the stair side, three on the window side, the coffee
    table where it is; the ottoman pushed to the sofa."""
    g, C = G, G.OPTC
    W, H = 860, 680
    k = 1.62
    o = []
    X, Y = _room(o, k, 40, 70, table=False)
    _sofa(o, X, Y, k, label=False)
    cof = g.COFFEE
    o.append(f'<rect x="{X(cof["x"][1]):.1f}" y="{Y(cof["z"][0]):.1f}" width="{(cof["x"][1] - cof["x"][0]) * k:.1f}" height="{(cof["z"][1] - cof["z"][0]) * k:.1f}" fill="#d8d3c8" stroke="#6b6862"/>')
    o.append(t(X((cof["x"][0] + cof["x"][1]) / 2), Y((cof["z"][0] + cof["z"][1]) / 2) + 4, "coffee table (stays put)", 8.5, "middle", 600))
    P_ = g.SOFA_POUF
    o.append(f'<rect x="{X(P_["x"][1]):.1f}" y="{Y(P_["z"][0]):.1f}" width="{P_["w"] * k:.1f}" height="{P_["d"] * k:.1f}" fill="none" stroke="#a3352b" stroke-dasharray="4 3"/>')
    o.append(t(X((P_["x"][0] + P_["x"][1]) / 2), Y(P_["z"][0]) + 12, "ottoman: to the sofa", 8.5, "middle", 600, "#a3352b"))
    # the stairs' foot, kept clear
    sz = g.STAIRS_WALL_Z[0]
    o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(sz):.1f}" width="{(g.ROOM_W - g.STAIR_X[0]) * k:.1f}" height="{(sz - C["z"][0]) * k:.1f}" fill="#fbe7e1" fill-opacity="0.8"/>')
    # your plant stand in the window corner
    pl = g.PLANT_LAYOUTS["corner"]["plants"]; PS = g.PLANT_STAND
    o.append(f'<rect x="{X(pl[0] + PS["w"] / 2):.1f}" y="{Y(pl[1] - PS["d"] / 2):.1f}" width="{PS["w"] * k:.1f}" height="{PS["d"] * k:.1f}" fill="#e6f0dc" stroke="#6f9a5a"/>')
    o.append(t(X(pl[0]), Y(pl[1]) + 4, "plant stand", 8.5, "middle", 600, "#3f6a2e"))
    # the cabinet
    ca, cb = C["z"]
    o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(cb):.1f}" width="{C["d"] * k:.1f}" height="{(ca - cb) * k:.1f}" fill="{OAKF}" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<text x="{X(g.ROOM_W - C["d"] / 2):.1f}" y="{Y((C["bay_c"][0] + C["bay_c"][1]) / 2):.1f}" {FONT} font-size="9" font-weight="700" fill="#5a3a20" text-anchor="middle" transform="rotate(-90 {X(g.ROOM_W - C["d"] / 2):.1f} {Y((C["bay_c"][0] + C["bay_c"][1]) / 2):.1f})">chair bay (empty)</text>')
    # v29: the two doors, door A slid over door B (the table out)
    for kd, tr in (("A", "front"), ("B", "back")):
        za, zb = C["doors"][kd]["slid" if kd == "A" else "shut"]; x0, x1 = C["door_x"][tr]
        o.append(f'<rect x="{X(x1):.1f}" y="{Y(za):.1f}" width="{(x1 - x0) * k:.1f}" height="{(za - zb) * k:.1f}" fill="{OAKD}"/>')
    # the open table, its joint and legs
    tx0, tx1 = C["tx"]; tz0, tz1 = C["tz"]
    o.append(f'<rect x="{X(tx1):.1f}" y="{Y(tz1):.1f}" width="{(tx1 - tx0) * k:.1f}" height="{(tz0 - tz1) * k:.1f}" fill="#d9b48a" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<line x1="{X(C["joint_x"]):.1f}" y1="{Y(tz1):.1f}" x2="{X(C["joint_x"]):.1f}" y2="{Y(tz0):.1f}" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    for lx, lz in C["legs"]:
        o.append(f'<rect x="{X(lx + C["leg"][0] / 2):.1f}" y="{Y(lz - C["leg"][1] / 2):.1f}" width="{C["leg"][0] * k:.1f}" height="{C["leg"][1] * k:.1f}" fill="{OAKD}"/>')
    o.append(t(X((tx0 + tx1) / 2), Y(C["cz"]) + 4, f"table {_fmt(C['len'])} × {_fmt(C['top'][0])}", 11, "middle", 700, "#5a3a20"))
    # the six chairs, numbered
    cw, cd = g.CHAIR[0], g.CHAIR[1]
    for i, (x, z, f) in enumerate(C["seats"]["six"]):
        w_, d_ = (cd, cw) if f == "e" else (cw, cd)
        o.append(f'<rect x="{X(x + w_ / 2):.1f}" y="{Y(z - d_ / 2):.1f}" width="{w_ * k:.1f}" height="{d_ * k:.1f}" rx="4" fill="#fff" stroke="{BLUE}" stroke-width="1.4"/>')
        o.append(t(X(x), Y(z) + 4, str(i + 1), 11, "middle", 700, BLUE))
    st_side = C["tz"][0] + g.CHAIR[1] - g.CHAIR_TUCK
    sl, wl = C["front"] - C["tx"][0], C["front"] - max(C["tx"][0], g.SOFA_X[1])
    o.append(t(X(C["tx"][0] + 5), Y(st_side) + 14, f"stair side: 3 at {sl / 3:.1f}", 9.5, "start", 700, BLUE))
    o.append(t(X(g.SOFA_X[1]) - 4, Y(C["tz"][1] - g.CHAIR[1] + g.CHAIR_TUCK) - 6, f"window side: 3 at {wl / 3:.1f}", 9.5, "end", 700, BLUE))
    return svg(W, H, "\n".join(o), "The sliding cabinet open for six",
               "From above, to scale. Door A slid over door B; three on the stair side, three on the window side, all in comfort; the coffee table stays where it is.")


# ---------------------------------------------------------------- v27: build drawings for the dining cabinet (step 11)
def _dim(o, x1, y1, x2, y2, lab, col=None, off=0, size=9.5, anchor="middle"):
    """A dimension line with end ticks and a label at its middle (horizontal or vertical)."""
    col = col or BLUE
    o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="1.2"/>')
    if y1 == y2:
        for x in (x1, x2):
            o.append(f'<line x1="{x:.1f}" y1="{y1 - 4:.1f}" x2="{x:.1f}" y2="{y1 + 4:.1f}" stroke="{col}" stroke-width="1.2"/>')
        o.append(t((x1 + x2) / 2, y1 - 5 + off, lab, size, anchor, 700, col))
    else:
        for y in (y1, y2):
            o.append(f'<line x1="{x1 - 4:.1f}" y1="{y:.1f}" x2="{x1 + 4:.1f}" y2="{y:.1f}" stroke="{col}" stroke-width="1.2"/>')
        o.append(t(x1 + 6 + off, (y1 + y2) / 2 + 4, lab, size, "start", 700, col))


def option_c_carcass():
    """The cabinet's carcass from the front, doors and table off, to scale: every panel and the heights you mark out."""
    g, C = G, G.OPTC
    L = C["z"][0] - C["z"][1]
    k = 3.2
    W, H = 900, 800
    ox, oy = 60, 70
    X = lambda u: ox + u * k                 # u: cm from the cabinet's stair end
    Y = lambda y: oy + (C["h"] - y) * k
    t_ = C["t"]
    bt = C["bay_t"][0] - C["bay_t"][1]
    part_u = t_ + bt                          # the partition's stair-side face
    o = []
    o.append(f'<rect x="{X(0)}" y="{Y(C["h"])}" width="{L * k}" height="{C["h"] * k}" fill="#f6efe3" stroke="{OAKD}" stroke-width="2"/>')
    for u0, w in ((0, t_), (L - t_, t_), (part_u, t_)):                                      # the two ends and the partition
        o.append(f'<rect x="{X(u0)}" y="{Y(C["h"])}" width="{w * k}" height="{C["h"] * k}" fill="{OAKF}" stroke="{OAKD}"/>')
    o.append(f'<rect x="{X(t_)}" y="{Y(C["h"])}" width="{(L - 2 * t_) * k}" height="{C["t_top"] * k}" fill="{OAKF}" stroke="{OAKD}"/>')   # the top, 19 mm (the top track's groove under it)
    o.append(f'<line x1="{X(t_)}" y1="{Y(C["h"] - C["t_top"]) + 2}" x2="{X(L - t_)}" y2="{Y(C["h"] - C["t_top"]) + 2}" stroke="#8d9196" stroke-width="3"/>')
    o.append(f'<line x1="{X(t_)}" y1="{Y(C["plinth"]) - 1}" x2="{X(L - t_)}" y2="{Y(C["plinth"]) - 1}" stroke="#8d9196" stroke-width="2"/>')
    o.append(t(X((part_u + L) / 2), Y(C["h"] - C["t_top"]) + 16, "the double top track, in a 16 mm groove under the top", 9, "middle", 700, "#6b6f74"))
    o.append(t(X((part_u + L) / 2), Y(C["plinth"]) - 6, "the bottom guide, in a 6 mm groove", 9, "middle", 700, "#6b6f74"))
    o.append(f'<rect x="{X(t_)}" y="{Y(C["plinth"])}" width="{(L - 2 * t_) * k}" height="{C["plinth"] * k}" fill="{OAKS}" stroke="{OAKD}"/>')   # the plinth and floor
    rail_y = C["pivot"][1] - 7
    o.append(f'<rect x="{X(t_)}" y="{Y(C["pivot"][1])}" width="{bt * k}" height="{7 * k}" fill="#c9a074" stroke="{OAKD}"/>')                 # the hinge rail
    o.append(f'<rect x="{X(t_)}" y="{Y(C["flap"][0])}" width="{bt * k}" height="{t_ * k}" fill="{OAKF}" stroke="{OAKD}"/>')                   # the linen floor
    o.append(f'<rect x="{X(part_u + t_)}" y="{Y(C["shelf_y"] + t_)}" width="{(L - part_u - 2 * t_) * k}" height="{t_ * k}" fill="{OAKF}" stroke="{OAKD}"/>')   # the chair shelf
    lab = lambda u, y, s, w=700: o.append(t(X(u), Y(y), s, 10, "middle", w, "#5a3a20"))
    lab(t_ + bt / 2, (C["plinth"] + rail_y) / 2 + 2, "drawer")
    lab(t_ + bt / 2, (C["plinth"] + rail_y) / 2 - 4, f"opening {_fmt(bt)} × {_fmt(rail_y - C['plinth'])}", 500)
    lab(t_ + bt / 2, (C["pivot"][1] + C["flap"][0]) / 2 + 2, "the table stands up here")
    lab(t_ + bt / 2, (C["pivot"][1] + C["flap"][0]) / 2 - 5, f"(two halves, {_fmt(C['top'][1])} tall)", 500)
    lab(t_ + bt / 2, (C["flap"][1] + C["flap"][0]) / 2 - 1, "linen space")
    lab(t_ + bt / 2, C["pivot"][1] - 3.5 - 1.5, "hinge rail", 600)
    cc = (part_u + t_ + L - t_) / 2
    lab(cc, (C["plinth"] + C["shelf_y"]) / 2, "4 chairs, 2 across, 2 deep")
    lab(cc, (C["shelf_y"] + C["h"]) / 2, "2 chairs + the seat pads")
    # dimensions: lengths across the bottom, heights down the right
    yb = Y(0) + 26
    _dim(o, X(0), yb, X(L), yb, f"{_fmt(L)} overall")
    _dim(o, X(t_), yb + 26, X(part_u), yb + 26, f"table bay {_fmt(bt)} inside")
    _dim(o, X(part_u + t_), yb + 26, X(L - t_), yb + 26, f"chair bay {_fmt(L - part_u - 2 * t_)} inside")
    xr = X(L) + 18
    for y, s in ((C["h"], f"{_fmt(C['h'])} top"), (C["flap"][0], f"{_fmt(C['flap'][0])} linen floor (top face)"), (C["folded_top"], f"{_fmt(C['folded_top'])} table's top edge, folded"),
                 (C["shelf_y"] + t_, f"{_fmt(C['shelf_y'] + t_)} chair shelf (top face)"), (C["pivot"][1], f"{_fmt(C['pivot'][1])} hinge rail top = piano hinge"),
                 (rail_y, f"{_fmt(rail_y)} hinge rail underside"), (C["plinth"], f"{_fmt(C['plinth'])} plinth")):
        o.append(f'<line x1="{X(L)}" y1="{Y(y):.1f}" x2="{xr - 2}" y2="{Y(y):.1f}" stroke="{BLUE}" stroke-width="0.8" stroke-dasharray="3 2"/>')
        o.append(t(xr, Y(y) + 3.5, s, 9, "start", 700, BLUE))
    o.append(t(X(0), Y(C["h"]) - 12, "stair end", 9.5, "start", 600, MUTED))
    o.append(t(X(L), Y(C["h"]) - 12, "window end (2 short of the pipe boxing)", 9.5, "end", 600, MUTED))
    return svg(W, H, "\n".join(o), "The sliding cabinet's carcass, from the front",
               f"Doors, drawer and table off; heights to each panel's top face. Ends, 19 mm top and floor {_fmt(C['d'])} deep; inside {_fmt(C['in_d'])} deep, {_fmt(C['slide'])} back for the doors.")


def option_c_halves():
    """The table's two halves from underneath, open, to scale: the breadboard ends, the aprons, where each leg and hinge goes."""
    g, C = G, G.OPTC
    tw, tl, tt = C["top"]
    k = 3.6
    W, H = 900, 470
    ox, oy = 70, 110
    X = lambda a: ox + a * k                 # a: cm from the wall end of the inner half, along the table
    Y = lambda b: oy + b * k                 # b: cm across the table
    L = 2 * tl
    ap = C["apron"]
    o = []
    for a0, name in ((0, "inner half (on the piano hinge)"), (tl, "outer half (flips over)")):
        o.append(f'<rect x="{X(a0)}" y="{Y(0)}" width="{tl * k}" height="{tw * k}" fill="#efdcc0" stroke="{OAKD}" stroke-width="1.8"/>')
        for e in (a0, a0 + tl - 7):                                                          # breadboard ends, 7 wide
            o.append(f'<rect x="{X(e)}" y="{Y(0)}" width="{7 * k}" height="{tw * k}" fill="#e3c9a3" stroke="{OAKD}" stroke-width="0.8"/>')
        # the apron frame: 2 thick, its long rails 4 in from the sides, its short rails 3 in from the ends (the inner half's stops 4.6 short
        # of its wall end: that strip rests on the hinge rail)
        e0 = ap if a0 == 0 else 3
        o.append(f'<rect x="{X(a0 + e0) + k:.1f}" y="{Y(4) + k:.1f}" width="{(tl - e0 - 3 - 2) * k:.1f}" height="{(tw - 10) * k:.1f}" fill="none" stroke="{OAKS}" stroke-width="{2 * k}"/>')
        o.append(t(X(a0 + tl / 2), Y(tw / 2) - 8, name, 10.5, "middle", 700, "#5a3a20"))
        o.append(t(X(a0 + tl / 2), Y(tw / 2) + 7, f"{_fmt(tl)} × {_fmt(tw)} × {_fmt(tt)}", 10, "middle", 500, "#5a3a20"))
    # the legs, folded flat inside the aprons (open, they stand where the squares are)
    lg = C["leg"]
    li, ls = C["leg_in"], tw / 2 - 4 - 2 - lg[1] / 2
    inner = [(tl - li, tw / 2 + s * 13) for s in (-1, 1)]      # on the inner half, against the end rail by the joint, 32 in from each side
    outer = [(L - li, tw / 2 + s * ls) for s in (-1, 1)]       # on the outer half, in the corners at the far end
    for a, b in inner + outer:
        o.append(f'<rect x="{X(a) - lg[0] * k / 2:.1f}" y="{Y(b) - lg[1] * k / 2:.1f}" width="{lg[0] * k:.1f}" height="{lg[1] * k:.1f}" fill="{OAKD}"/>')
    o.append(t(X(tl - li) - 10, Y(tw / 2) + 28, f"inner legs: centres {_fmt(li)} from the joint, 32 in from each side", 9, "end", 700, BLUE))
    o.append(t(X(L), Y(tw) + 14, f"outer legs: in the corners, centres {_fmt(li)} from the end and the sides", 9, "end", 700, BLUE))
    # the joint's three flip-top hinges and the piano hinge at the wall end
    for b in (10, tw / 2, tw - 10):
        o.append(f'<rect x="{X(tl) - 2.5:.1f}" y="{Y(b) - 3.5 * k / 2:.1f}" width="5" height="{3.5 * k:.1f}" fill="{BLUE}"/>')
    o.append(t(X(tl), Y(0) - 8, "3 flip-top hinges at the joint: 10 in from each side and the middle", 9.5, "middle", 700, BLUE))
    o.append(f'<rect x="{X(0) - 6}" y="{Y(0)}" width="5" height="{tw * k}" fill="{BLUE}"/>')
    o.append(t(X(0) - 10, Y(tw / 2), "piano hinge", 9.5, "end", 700, BLUE))
    o.append(t(X(0) - 10, Y(tw / 2) + 13, f"cut to {_fmt(tw)}", 9, "end", 500, BLUE))
    yb = Y(tw) + 30
    yb += 12
    _dim(o, X(0), yb, X(tl), yb, f"{_fmt(tl)}")
    _dim(o, X(tl), yb, X(L), yb, f"{_fmt(tl)}")
    _dim(o, X(0), yb + 26, X(L), yb + 26, f"{_fmt(L)} open")
    _dim(o, X(L) + 22, Y(0), X(L) + 22, Y(tw), f"{_fmt(tw)}")
    return svg(W, H, "\n".join(o), "The table's two halves, from underneath",
               f"Laid out open, to scale. Breadboard ends 7 wide; apron frame 2 × {_fmt(ap)}, 4 in from the sides, 3 from the ends; legs fold inside it.")


# ---------------------------------------------------------------- v30: the compact dining cabinet (the plan); option_c_* above: the sliding one
def cab_elevation():
    """The stairs wall from the room, to scale: the two oak boxes under your shelf, the doors drawn see-through over what's behind them,
    which way each door turns, and the bare wall the compact cabinet gives back by the pipe boxing."""
    g, C = G, G.CAB
    W, H = 900, 880
    k = 2.55
    z0, z1 = 0.0, g.WINDOW_Z
    ox, oy = 30, 110
    X = lambda z: ox + (z0 - z) * k
    Y = lambda y: oy + (g.CEIL - y) * k
    cw, cdep, ch = g.CHAIR_PADDED["folded"]   # v33: your padded chairs
    o = [f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - z1) * k}" height="{g.CEIL * k}" fill="#f4f1ea" stroke="{WALL}" stroke-width="2"/>']
    sz = g.STAIRS_WALL_Z[0]
    o.append(f'<rect x="{X(z0)}" y="{Y(g.CEIL)}" width="{(z0 - sz) * k}" height="{g.CEIL * k}" fill="#e6e0d3" stroke="#9a958b"/>')
    for i in range(10):
        y = (i + 1) * g.STAIR_RISE
        o.append(f'<line x1="{X(z0)}" y1="{Y(y)}" x2="{X(sz)}" y2="{Y(y)}" stroke="#b8b09f" stroke-width="1"/>')
    o.append(t(X((z0 + sz) / 2), Y(130), "stairs", 11, "middle", 650, MUTED))
    o.append(f'<rect x="{X(sz)}" y="{Y(g.CEIL)}" width="{(sz - C["z"][0]) * k}" height="{g.CEIL * k}" fill="#fbe7e1" fill-opacity="0.55"/>')
    o.append(t(X((sz + C["z"][0]) / 2), Y(40), "keep clear:", 9.5, "middle", 650, "#a3352b"))
    o.append(t(X((sz + C["z"][0]) / 2), Y(40) + 12, "the stairs' foot", 9.5, "middle", 400, "#a3352b"))
    pb = g.PIPE_BOX
    o.append(f'<rect x="{X(pb["z"][1])}" y="{Y(g.CEIL)}" width="{(pb["z"][1] - pb["z"][0]) * k}" height="{g.CEIL * k}" fill="#d8d3c8" stroke="{WALL}" stroke-width="1.4"/>')
    sb = g.SHELF_B
    o.append(f'<rect x="{X(sb["z"][0])}" y="{Y(sb["top"])}" width="{(sb["z"][0] - sb["z"][1]) * k}" height="{sb["t"] * k}" fill="#2a2a2b"/>')
    o.append(t(X((sb["z"][0] + sb["z"][1]) / 2), Y(sb["top"]) - 6, f"your 2 m shelf (underside at {_fmt(sb['top'] - sb['t'])})", 10, "middle", 600))
    # the bare wall it gives back
    fz0, fz1 = C["z"][1], pb["z"][1]
    o.append(f'<rect x="{X(fz0)}" y="{Y(C["h"])}" width="{(fz0 - fz1) * k}" height="{C["h"] * k}" fill="#e3efe0" fill-opacity="0.6" stroke="#6f9a5a" stroke-dasharray="5 3"/>')
    for i, s_ in enumerate(("bare wall:", f"{_fmt(C['freed'])} back", "the table door", "lies back over", "it while you eat")):
        o.append(t(X((fz0 + fz1) / 2), Y(120) + i * 13, s_, 9.5, "middle", 700 if i < 2 else 500, "#3f6a2e"))
    # the two boxes
    for a, b in (C["z_t"], C["z_c"]):
        o.append(f'<rect x="{X(a)}" y="{Y(C["h"])}" width="{(a - b) * k}" height="{C["h"] * k}" fill="{OAKF}" stroke="{OAKD}" stroke-width="2"/>')
    o.append(f'<line x1="{X(C["z_t"][1])}" y1="{Y(C["h"])}" x2="{X(C["z_t"][1])}" y2="{Y(0)}" stroke="{OAKD}" stroke-width="2.6"/>')
    # the table box: the folded table, the linen shelf over it, two chairs lying in the base under the hinge rail
    tz0, tz1 = C["tz"]; py = C["pivot"][1]; tl = C["top"][1]
    o.append(f'<rect x="{X(tz0)}" y="{Y(py + tl)}" width="{(tz0 - tz1) * k}" height="{tl * k}" fill="#dfc29c" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<rect x="{X(tz0) + 2 * k}" y="{Y(py + tl) + 2 * k}" width="{(tz0 - tz1 - 4) * k}" height="{(tl - 4) * k}" fill="none" stroke="{OAKS}" stroke-width="1"/>')
    o.append(t(X(C["cz"]), Y(py + tl / 2) - 6, "the table,", 11, "middle", 700, "#5a3a20"))
    o.append(t(X(C["cz"]), Y(py + tl / 2) + 8, "folded double,", 10, "middle", 500, "#5a3a20"))
    o.append(t(X(C["cz"]), Y(py + tl / 2) + 21, "standing up", 10, "middle", 500, "#5a3a20"))
    bt0, bt1 = C["bay_tz"]
    o.append(f'<rect x="{X(bt0)}" y="{Y(py)}" width="{(bt0 - bt1) * k}" height="{7 * k}" fill="#c9a074" stroke="{OAKD}"/>')
    o.append(f'<circle cx="{X(C["cz"])}" cy="{Y(py - 3.5)}" r="3.2" fill="{BLUE}"/>')
    o.append(f'<rect x="{X(C["cz"] + ch / 2)}" y="{Y(C["base"][0] + cw)}" width="{ch * k}" height="{cw * k}" rx="4" fill="none" stroke="{OAKD}" stroke-dasharray="5 3"/>')
    o.append(t(X(C["cz"]), Y(C["base"][0] + cw / 2) - 2, "2 chairs lying", 11, "middle", 700, "#5a3a20"))
    o.append(t(X(C["cz"]), Y(C["base"][0] + cw / 2) + 11, "on their sides, two deep", 8.5, "middle", 500, "#5a3a20"))
    o.append(f'<rect x="{X(bt0)}" y="{Y(C["h"] - C["t_top"])}" width="{(bt0 - bt1) * k}" height="{(C["h"] - C["t_top"] - C["linen"][0] + C["t"]) * k}" fill="#efe2cf" stroke="{OAKD}" stroke-width="1.2"/>')
    o.append(t(X(C["cz"]), Y((C["h"] + C["folded_top"]) / 2) + 4, "linen shelf: cloth, napkins, runner", 9.5, "middle", 600, "#5a3a20"))
    # the chair box: four standing, two deep on its floor and two deep on its shelf
    bc0, bc1 = C["bay_cz"]
    o.append(f'<rect x="{X(bc0)}" y="{Y(C["shelf_y"] + C["t"])}" width="{(bc0 - bc1) * k}" height="{C["t"] * k}" fill="{OAKS}"/>')
    for y0_ in (C["plinth"], C["shelf_y"] + C["t"]):
        xa = X(C["chair_z"] + cw / 2)
        o.append(f'<rect x="{xa}" y="{Y(y0_ + ch)}" width="{cw * k}" height="{ch * k}" rx="4" fill="none" stroke="{OAKD}" stroke-dasharray="5 3"/>')
        o.append(t(xa + cw * k / 2, Y(y0_ + ch / 2) + 4, "2 chairs", 11, "middle", 700, "#5a3a20"))
        o.append(t(xa + cw * k / 2, Y(y0_ + ch / 2) + 17, "two deep", 8.5, "middle", 500, "#5a3a20"))
    # the doors, see-through; each one's knuckle (the piano hinge) and which way it turns
    o.append(f'<defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="{BLUE}"/></marker></defs>')
    y_b, y_t = C["plinth"] + C["gap"], C["plinth"] + C["gap"] + C["door_h"]
    for (za, zb), hz, lab in ((C["door_t"], C["door_t"][1], "table door: turns back flat over the chair door"),
                               (C["door_c"], C["door_c"][0], "chair door: turns back over the table door")):
        o.append(f'<rect x="{X(za):.1f}" y="{Y(y_t):.1f}" width="{(za - zb) * k:.1f}" height="{C["door_h"] * k:.1f}" fill="{OAKF}" fill-opacity="0.28" stroke="{OAKD}" stroke-width="1.8"/>')
        o.append(f'<line x1="{X(hz):.1f}" y1="{Y(y_t) + 4:.1f}" x2="{X(hz):.1f}" y2="{Y(y_b) - 4:.1f}" stroke="#7d8287" stroke-width="2.6"/>')
        free = za if hz == zb else zb
        zs = free - 5 if free == za else free + 5
        o.append(f'<rect x="{X(zs) - 1.25 * k:.1f}" y="{Y(118):.1f}" width="{2.5 * k:.1f}" height="{26 * k:.1f}" rx="3" fill="#3a2b20"/>')
    yl = Y(-38)
    o.append(t(X(C["z_t"][0]) + 4, yl, "table door: turns back flat towards the window →", 9.5, "start", 700, BLUE))
    o.append(t(X(C["z_c"][1]) - 4, yl + 16, "← chair door: turns back towards the stairs", 9.5, "end", 700, BLUE))
    def dz(za, zb, y, lab, col=BLUE, dy=15):
        o.append(f'<line x1="{X(za)}" y1="{Y(y)}" x2="{X(zb)}" y2="{Y(y)}" stroke="{col}" stroke-width="1.3"/>')
        for zz in (za, zb):
            o.append(f'<line x1="{X(zz)}" y1="{Y(y) - 5}" x2="{X(zz)}" y2="{Y(y) + 5}" stroke="{col}" stroke-width="1.3"/>')
        o.append(t((X(za) + X(zb)) / 2, Y(y) + dy, lab, 10, "middle", 700, col))
    dz(C["z"][0], C["z"][1], -7, f"{_fmt(C['len'])} long · {_fmt(C['d'])} deep · {_fmt(C['h'])} tall")
    dz(C["z_t"][0], C["z_t"][1], -20, f"table box {_fmt(C['z_t'][0] - C['z_t'][1])}")
    dz(C["z_c"][0], C["z_c"][1], -20, f"chair box {_fmt(C['z_c'][0] - C['z_c'][1])}")
    o.append(t(X(C["z"][0]) + 4, Y(C["folded_top"]) - 3, f"top edge {_fmt(C['folded_top'])} →", 9, "end", 600, BLUE))
    o.append(t(X(bt1) - 4, Y(py - 3.5) + 4, f"← piano hinge at {_fmt(py)}", 9, "start", 700, BLUE))
    o.append(f'<line x1="{X(z0) - 8}" y1="{Y(0)}" x2="{X(z1) + 8}" y2="{Y(0)}" stroke="{WALL}" stroke-width="2.4"/>')
    o.append(t(X(z0), Y(0) + 70, "← door wall", 9.5, "start", 500, MUTED))
    o.append(t(X(z1), Y(0) + 70, "window wall →", 9.5, "end", 500, MUTED))
    return svg(W, H, "\n".join(o), "The compact dining cabinet, packed away",
               f"The stairs wall from the room, to scale (1 cm = {k} px). Doors see-through: the table and two chairs behind the table door, four chairs behind the chair door.")


def cab_carcass():
    """The two boxes from the front, doors and table off, to scale: every panel and the heights you mark out."""
    g, C = G, G.CAB
    L = C["len"]
    k = 3.6
    W, H = 900, 830
    ox, oy = 60, 70
    X = lambda u: ox + u * k                 # u: cm from the stair end
    Y = lambda y: oy + (C["h"] - y) * k
    t_ = C["t"]
    lt, lc = C["z_t"][0] - C["z_t"][1], C["z_c"][0] - C["z_c"][1]
    o = []
    for u0, w_ in ((0, lt), (lt, lc)):
        o.append(f'<rect x="{X(u0)}" y="{Y(C["h"])}" width="{w_ * k}" height="{C["h"] * k}" fill="#f6efe3" stroke="{OAKD}" stroke-width="2"/>')
        for e in (u0, u0 + w_ - t_):
            o.append(f'<rect x="{X(e)}" y="{Y(C["h"])}" width="{t_ * k}" height="{C["h"] * k}" fill="{OAKF}" stroke="{OAKD}"/>')
        o.append(f'<rect x="{X(u0 + t_)}" y="{Y(C["h"])}" width="{(w_ - 2 * t_) * k}" height="{C["t_top"] * k}" fill="{OAKF}" stroke="{OAKD}"/>')
        o.append(f'<rect x="{X(u0 + t_)}" y="{Y(C["plinth"])}" width="{(w_ - 2 * t_) * k}" height="{t_ * k}" fill="{OAKF}" stroke="{OAKD}"/>')
        o.append(f'<rect x="{X(u0 + t_ + 0.5)}" y="{Y(C["plinth"] - t_)}" width="{(w_ - 2 * t_ - 1) * k}" height="{(C["plinth"] - t_) * k}" fill="#3a2f26"/>')
    rail_y, py = C["rail"]
    o.append(f'<rect x="{X(t_)}" y="{Y(py)}" width="{C["bay_t"] * k}" height="{7 * k}" fill="#c9a074" stroke="{OAKD}"/>')
    o.append(f'<rect x="{X(t_)}" y="{Y(C["linen"][0])}" width="{C["bay_t"] * k}" height="{t_ * k}" fill="{OAKF}" stroke="{OAKD}"/>')
    o.append(f'<rect x="{X(lt + t_)}" y="{Y(C["shelf_y"] + t_)}" width="{C["bay_c"] * k}" height="{t_ * k}" fill="{OAKF}" stroke="{OAKD}"/>')
    lab = lambda u, y, s, w=700, sz=10: o.append(t(X(u), Y(y), s, sz, "middle", w, "#5a3a20"))
    ct, cc = t_ + C["bay_t"] / 2, lt + t_ + C["bay_c"] / 2
    lab(ct, (C["plinth"] + rail_y) / 2 + 4, "the base: two chairs")
    lab(ct, (C["plinth"] + rail_y) / 2 - 3, f"lying on their sides ({_fmt(C['bay_t'])} × {_fmt(rail_y - C['plinth'])})", 500)
    lab(ct, (py + C["linen"][0]) / 2 + 2, "the table stands up here")
    lab(ct, (py + C["linen"][0]) / 2 - 5, f"(two halves, {_fmt(C['top'][1])} tall)", 500)
    lab(ct, (C["linen"][1] + C["linen"][0]) / 2 - 1, "linen space")
    lab(ct, py - 3.5 - 1.5, "hinge rail", 600)
    lab(cc, (C["plinth"] + C["shelf_y"]) / 2 + 3, "2 chairs,", sz=9.5)
    lab(cc, (C["plinth"] + C["shelf_y"]) / 2 - 3, "two deep", 500, 9.5)
    lab(cc, (C["shelf_y"] + C["h"]) / 2 + 3, "2 chairs,", sz=9.5)
    lab(cc, (C["shelf_y"] + C["h"]) / 2 - 3, "two deep", 500, 9.5)
    yb = Y(0) + 26
    _dim(o, X(0), yb, X(L), yb, f"{_fmt(L)} overall")
    _dim(o, X(t_), yb + 26, X(lt - t_), yb + 26, f"table box {_fmt(C['bay_t'])} inside")
    _dim(o, X(lt + t_), yb + 26, X(L - t_), yb + 26, f"{_fmt(C['bay_c'])} inside")
    xr = X(L) + 18
    for y, s in ((C["h"], f"{_fmt(C['h'])} top"), (C["linen"][0], f"{_fmt(C['linen'][0])} linen shelf (top face)"), (C["folded_top"], f"{_fmt(C['folded_top'])} table's top edge, folded"),
                 (C["shelf_y"] + t_, f"{_fmt(C['shelf_y'] + t_)} chair shelf (top face)"), (py, f"{_fmt(py)} hinge rail top = piano hinge"),
                 (rail_y, f"{_fmt(rail_y)} hinge rail underside"), (C["plinth"], f"{_fmt(C['plinth'])} floor (top face)")):
        o.append(f'<line x1="{X(L)}" y1="{Y(y):.1f}" x2="{xr - 2}" y2="{Y(y):.1f}" stroke="{BLUE}" stroke-width="0.8" stroke-dasharray="3 2"/>')
        o.append(t(xr, Y(y) + 3.5, s, 9, "start", 700, BLUE))
    o.append(t(X(0), Y(C["h"]) - 12, "stair end", 9.5, "start", 600, MUTED))
    o.append(t(X(L), Y(C["h"]) - 12, f"window end ({_fmt(C['freed'])} short of the pipe boxing)", 9.5, "end", 600, MUTED))
    return svg(W, H, "\n".join(o), "The compact cabinet's two boxes, from the front",
               f"Doors and table off; heights to each panel's top face. Ends, tops and floors {_fmt(C['d'])} deep; inside {_fmt(C['in_d'])} deep, {_fmt(C['door'] + C['gap'])} back for the inset doors.")


def cab_section():
    """A cut through the table box, wall on the right: the door, the table standing up 4 back from it,
    two chairs lying in the base, then the table down on its legs."""
    g, C = G, G.CAB
    W, H = 900, 780
    k = 3.3
    ox, oy = 40, 60
    xL = C["tx"][0] - 6
    X = lambda x: ox + (x - xL) * k
    Y = lambda y: oy + (200 - y) * k
    o = []
    o.append(f'<rect x="{X(g.ROOM_W)}" y="{Y(200)}" width="10" height="{200 * k}" fill="url(#hatch4)" stroke="{WALL}" stroke-width="2"/>')
    o.append('<defs><pattern id="hatch4" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#c9c3b5" stroke-width="2"/></pattern></defs>')
    o.append(f'<line x1="{X(C["tx"][0] - 6)}" y1="{Y(0)}" x2="{X(g.ROOM_W) + 10}" y2="{Y(0)}" stroke="{WALL}" stroke-width="2.4"/>')
    o.append(f'<rect x="{X(C["front"])}" y="{Y(C["h"])}" width="{C["d"] * k}" height="{C["h"] * k}" fill="none" stroke="{OAKD}" stroke-width="1.4" stroke-dasharray="4 3"/>')
    px, py = C["pivot"]; tt = C["top"][2]; tl = C["top"][1]; ap = C["apron"]
    o.append(f'<rect x="{X(C["rail_x"][0])}" y="{Y(py)}" width="{(C["rail_x"][1] - C["rail_x"][0]) * k}" height="{7 * k}" fill="{OAKS}"/>')   # the hinge rail (v31: set back behind the pads)
    o.append(f'<rect x="{X(C["inner"] + C["pads"])}" y="{Y(C["linen"][0])}" width="{C["linen_d"] * k}" height="{C["t"] * k}" fill="{OAKS}"/>')   # the linen shelf (the same)
    # the two chairs lying in the base, two deep
    cw, cdep, ch = g.CHAIR_PADDED["folded"]   # v33: your padded chairs
    for j in range(2):
        x0 = C["inner"] + 0.3 + j * (cdep + 0.3)
        o.append(f'<rect x="{X(x0):.1f}" y="{Y(C["base"][0] + cw):.1f}" width="{cdep * k:.1f}" height="{cw * k:.1f}" rx="3" fill="#f3e7d2" stroke="{OAKD}" stroke-dasharray="4 2"/>')
    o.append(t(X(C["front"]) - 6, Y(C["base"][0] + cw / 2), "two chairs lying,", 9.5, "end", 700, "#5a3a20"))
    o.append(t(X(C["front"]) - 6, Y(C["base"][0] + cw / 2) + 13, f"two deep ({_fmt(2 * cdep)} of {_fmt(C['in_d'])})", 9, "end", 500, "#5a3a20"))
    # the door, shut
    o.append(f'<rect x="{X(C["front"]):.1f}" y="{Y(C["plinth"] + C["gap"] + C["door_h"]):.1f}" width="{C["door"] * k:.1f}" height="{C["door_h"] * k:.1f}" fill="#e9d3b4" stroke="{OAKD}" stroke-dasharray="5 3"/>')
    o.append(t(X(C["front"]) - 6, Y(C["h"] - 2), "the table door: open it,", 9.5, "end", 700, "#5a3a20"))
    o.append(t(X(C["front"]) - 6, Y(C["h"] - 2) + 13, "it turns back flat (180°)", 9, "end", 500, "#5a3a20"))
    # folded: the stack standing in the bay, 4 back from the door (dashed)
    o.append(f'<rect x="{X(px)}" y="{Y(py + tl)}" width="{(2 * tt + 0.3 + ap) * k}" height="{tl * k}" fill="#f1e2cc" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    o.append(f'<rect x="{X(px - ap)}" y="{Y(py + tl)}" width="{ap * k}" height="{tl * k}" fill="#e9d3b4" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    o.append(f'<line x1="{X(C["front"]):.1f}" y1="{Y(C["h"]) - 10:.1f}" x2="{X(px - ap):.1f}" y2="{Y(C["h"]) - 10:.1f}" stroke="{BLUE}" stroke-width="1.2"/>')
    o.append(t(X(C["front"]) + 2, Y(C["h"]) - 14, f"door {_fmt(C['door'] + C['gap'])} + {_fmt(C['pads'])}", 9, "start", 700, BLUE))
    # open: the two halves, the aprons, the legs
    jx, tx0, tx1 = C["joint_x"], C["tx"][0], C["tx"][1]
    o.append(f'<rect x="{X(tx0)}" y="{Y(py + tt)}" width="{(tx1 - tx0) * k}" height="{tt * k + 1}" fill="#d9b48a" stroke="{OAKD}" stroke-width="1.4"/>')
    for a, b in ((tx0 + 0.5, jx - 0.5), (jx + 0.5, tx1 - ap)):
        o.append(f'<rect x="{X(a)}" y="{Y(py)}" width="{(b - a) * k}" height="{ap * k}" fill="none" stroke="{OAKS}" stroke-width="1"/>')
    o.append(f'<line x1="{X(jx)}" y1="{Y(py + tt) - 6}" x2="{X(jx)}" y2="{Y(py) + 6}" stroke="{BLUE}" stroke-width="1.6"/>')
    o.append(t(X(jx), Y(py + tt) - 10, "flip-top hinges", 9.5, "middle", 700, BLUE))
    for lx in sorted({round(l[0], 1) for l in C["legs"]}):
        o.append(f'<rect x="{X(lx - C["leg"][0] / 2)}" y="{Y(C["leg_h"])}" width="{C["leg"][0] * k}" height="{C["leg_h"] * k}" fill="#cfae84" stroke="{OAKD}"/>')
    o.append(f'<circle cx="{X(px)}" cy="{Y(py)}" r="4" fill="{BLUE}"/>')
    o.append(f'<line x1="{X(C["front"]) - 4:.1f}" y1="{Y(py) + 14:.1f}" x2="{X(px) - 4:.1f}" y2="{Y(py) + 3:.1f}" stroke="{BLUE}" stroke-width="1"/>')
    o.append(t(X(C["front"]) - 6, Y(py) + 18, "piano hinge", 9.5, "end", 700, BLUE))
    o.append(f'<path d="M{X(px - 70)},{Y(py + 6)} A{70 * k},{70 * k} 0 0 1 {X(px - 4)},{Y(py + 70)}" fill="none" stroke="{BLUE}" stroke-width="1.4" stroke-dasharray="5 3"/>')
    def dx(xa, xb, y, lab, dy=-6):
        o.append(f'<line x1="{X(xa)}" y1="{Y(y)}" x2="{X(xb)}" y2="{Y(y)}" stroke="{BLUE}" stroke-width="1.3"/>')
        for xx in (xa, xb):
            o.append(f'<line x1="{X(xx)}" y1="{Y(y) - 5}" x2="{X(xx)}" y2="{Y(y) + 5}" stroke="{BLUE}" stroke-width="1.3"/>')
        o.append(t((X(xa) + X(xb)) / 2, Y(y) + dy, lab, 10, "middle", 700, BLUE))
    dx(tx0, jx, py + 26, f"outer half {_fmt(tl)}")
    dx(jx, tx1, py + 26, f"inner half {_fmt(tl)}")
    dx(tx0, tx1, -12, f"open: {_fmt(C['len_open'])} from its hinge, the top at {_fmt(g.TABLE_TOP)}", dy=16)
    o.append(t(X(tx0 + 12), Y(C["leg_h"] / 2), f"legs {_fmt(C['leg_h'])}, folding", 9.5, "start", 600, "#5a3a20"))
    o.append(t(X(C["front"]) - 6, Y(152), f"folded: {_fmt(C['stack'])} deep,", 9.5, "end", 700, "#5a3a20"))
    o.append(t(X(C["front"]) - 6, Y(152) + 13, f"its top at {_fmt(C['folded_top'])}", 9, "end", 500, "#5a3a20"))
    return svg(W, H, "\n".join(o), "The compact cabinet: how the table comes down",
               "Through the table box, wall on the right. Folded (dashed): 4 back from the door, two chairs lying under it. Open: the door turned back, the table down.")


def cab_plan():
    """The room from above with the compact cabinet open for six: the table door turned back flat over the chair door and the bare wall
    beyond it, three on the stair side, three on the window side, the coffee table where it is."""
    g, C = G, G.CAB
    W, H = 860, 680
    k = 1.62
    o = []
    X, Y = _room(o, k, 40, 70, table=False)
    _sofa(o, X, Y, k, label=False)
    cof = g.COFFEE
    o.append(f'<rect x="{X(cof["x"][1]):.1f}" y="{Y(cof["z"][0]):.1f}" width="{(cof["x"][1] - cof["x"][0]) * k:.1f}" height="{(cof["z"][1] - cof["z"][0]) * k:.1f}" fill="#d8d3c8" stroke="#6b6862"/>')
    o.append(t(X((cof["x"][0] + cof["x"][1]) / 2), Y((cof["z"][0] + cof["z"][1]) / 2) + 4, "coffee table (stays put)", 8.5, "middle", 600))
    P_ = g.SOFA_POUF
    o.append(f'<rect x="{X(P_["x"][1]):.1f}" y="{Y(P_["z"][0]):.1f}" width="{P_["w"] * k:.1f}" height="{P_["d"] * k:.1f}" fill="none" stroke="#a3352b" stroke-dasharray="4 3"/>')
    o.append(t(X((P_["x"][0] + P_["x"][1]) / 2), Y(P_["z"][0]) + 12, "ottoman: to the sofa", 8.5, "middle", 600, "#a3352b"))
    sz = g.STAIRS_WALL_Z[0]
    o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(sz):.1f}" width="{(g.ROOM_W - g.STAIR_X[0]) * k:.1f}" height="{(sz - C["z"][0]) * k:.1f}" fill="#fbe7e1" fill-opacity="0.8"/>')
    pl = g.PLANT_LAYOUTS["corner"]["plants"]; PS = g.PLANT_STAND
    o.append(f'<rect x="{X(pl[0] + PS["w"] / 2):.1f}" y="{Y(pl[1] - PS["d"] / 2):.1f}" width="{PS["w"] * k:.1f}" height="{PS["d"] * k:.1f}" fill="#e6f0dc" stroke="#6f9a5a"/>')
    o.append(t(X(pl[0]), Y(pl[1]) + 4, "plant stand", 8.5, "middle", 600, "#3f6a2e"))
    # the two boxes, and the doors: the table door turned back flat, the chair door shut
    for a, b in (C["z_t"], C["z_c"]):
        o.append(f'<rect x="{X(g.ROOM_W):.1f}" y="{Y(b):.1f}" width="{C["d"] * k:.1f}" height="{(a - b) * k:.1f}" fill="{OAKF}" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<rect x="{X(C["front"] + C["door"]):.1f}" y="{Y(C["door_c"][1]):.1f}" width="{C["door"] * k:.1f}" height="{C["door_cw"] * k:.1f}" fill="{OAKD}"/>')
    za, zb = C["door_t_open"]
    o.append(f'<rect x="{X(C["front"] - 2 * C["knuckle"]):.1f}" y="{Y(zb):.1f}" width="{C["door"] * k:.1f}" height="{(za - zb) * k:.1f}" fill="{OAKD}"/>')
    o.append(f'<path d="M{X(C["front"]):.1f},{Y(C["door_t"][0]):.1f} A{C["door_tw"] * k:.1f},{C["door_tw"] * k:.1f} 0 0 0 {X(C["front"]):.1f},{Y(zb):.1f}" fill="none" stroke="{BLUE}" stroke-width="1" stroke-dasharray="4 3"/>')
    o.append(t(X(C["door_t_face"]) + 5, Y((za + zb) / 2 - 38), "table door,", 8.5, "start", 700, BLUE))
    o.append(t(X(C["door_t_face"]) + 5, Y((za + zb) / 2 - 38) + 11, "turned back flat", 8.5, "start", 500, BLUE))
    o.append(f'<text x="{X(g.ROOM_W - C["d"] / 2):.1f}" y="{Y(C["chair_z"]):.1f}" {FONT} font-size="8.5" font-weight="700" fill="#5a3a20" text-anchor="middle" transform="rotate(-90 {X(g.ROOM_W - C["d"] / 2):.1f} {Y(C["chair_z"]):.1f})">chair box</text>')
    tx0, tx1 = C["tx"]; tz0, tz1 = C["tz"]
    o.append(f'<rect x="{X(tx1):.1f}" y="{Y(tz1):.1f}" width="{(tx1 - tx0) * k:.1f}" height="{(tz0 - tz1) * k:.1f}" fill="#d9b48a" stroke="{OAKD}" stroke-width="1.6"/>')
    o.append(f'<line x1="{X(C["joint_x"]):.1f}" y1="{Y(tz1):.1f}" x2="{X(C["joint_x"]):.1f}" y2="{Y(tz0):.1f}" stroke="{OAKD}" stroke-dasharray="4 3"/>')
    for lx, lz in C["legs"]:
        o.append(f'<rect x="{X(lx + C["leg"][0] / 2):.1f}" y="{Y(lz - C["leg"][1] / 2):.1f}" width="{C["leg"][0] * k:.1f}" height="{C["leg"][1] * k:.1f}" fill="{OAKD}"/>')
    o.append(t(X((tx0 + tx1) / 2), Y(C["cz"]) + 4, f"table {_fmt(C['len_open'])} × {_fmt(C['top'][0])}", 11, "middle", 700, "#5a3a20"))
    cw, cd = g.CHAIR_PADDED["w"], g.CHAIR_PADDED["d"]   # v33: your padded chairs
    for i, (x, z, f) in enumerate(C["seats"]["six"]):
        w_, d_ = (cd, cw) if f == "e" else (cw, cd)
        o.append(f'<rect x="{X(x + w_ / 2):.1f}" y="{Y(z - d_ / 2):.1f}" width="{w_ * k:.1f}" height="{d_ * k:.1f}" rx="4" fill="#fff" stroke="{BLUE}" stroke-width="1.4"/>')
        o.append(t(X(x), Y(z) + 4, str(i + 1), 11, "middle", 700, BLUE))
    st_side = C["tz"][0] + g.CHAIR_PADDED["d"] - g.CHAIR_TUCK
    sl, wl = C["front"] - C["tx"][0], C["front"] - max(C["tx"][0], g.SOFA_X[1])
    o.append(t(X(C["tx"][0] + 5), Y(st_side) + 14, f"stair side: 3 at {sl / 3:.1f}", 9.5, "start", 700, BLUE))
    o.append(t(X(g.SOFA_X[1]) - 4, Y(C["tz"][1] - g.CHAIR_PADDED["d"] + g.CHAIR_TUCK) - 6, f"window side: 3 at {wl / 3:.1f}", 9.5, "end", 700, BLUE))
    return svg(W, H, "\n".join(o), "The compact cabinet open for six",
               "From above, to scale. The table door turned back flat over the chair door and the wall beyond (dashed: its swing); three a side, all in comfort.")
