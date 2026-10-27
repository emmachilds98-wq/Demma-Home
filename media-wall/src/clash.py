"""v38: the clash check. Every piece of the client's plan (geometry.FIRM) as a box in room cm (x from the side wall, y up, z negative into
the room), and what moves (the cabinet's two doors swinging, the table and six chairs out, the step drawers out, the lift-top up). It
reports any two that overlap, and any pair closer than 1 cm that isn't meant to touch. qa.py fails on a clash.
    python3 clash.py        prints the report"""
import math
import geometry as G
import ideas

EPS = 0.05          # an overlap smaller than half a millimetre is a touch, not a clash
ONE_PIECE = (("sofa seat", "sofa back", "chaise"),)                    # parts of one thing: never a clash with each other
MEANT = {frozenset(("dining cabinet", "bar")): "a 3 mm shadow gap, scribed",
         frozenset(("chaise", "C-table's foot and upright")): "its foot slips 3 under the sofa's edge, on purpose"}   # gaps under 1 cm on purpose
# v39: the rear speakers' poles stand in the 3 cm between the radiator and the sofa; their flat bases slide under the radiator
for _i in (1, 2):
    for _p in ("base", "pole"):
        for _o in ("sofa seat", "sofa back", "chaise", "radiator", "curtains, drawn"):
            MEANT[frozenset((f"rear speaker {_i}'s {_p}", _o))] = "the gap behind the sofa"
MEANT[frozenset(("radiator", "curtains, drawn"))] = "the curtains hang just clear of the radiator"
for _i in (1, 2):
    MEANT[frozenset((f"rear speaker {_i}", "curtains, drawn"))] = "the speaker sits just in front of the curtains"
for _o in ("sofa seat", "sofa back", "chaise"):
    MEANT[frozenset((_o, "curtains, drawn"))] = "the curtains hang just behind the sofa"


def box(name, x, y, z):
    return (name, tuple(sorted(x)), tuple(sorted(y)), tuple(sorted(z)))


def pieces():
    """The plan's pieces, as boxes."""
    g, b = G, []
    W = g.ROOM_W
    # the media wall: the base unit, the uprights, the TV, the turntable and the Series X
    b.append(box("media wall base", (0, g.ALC_W), (0, g.WORKTOP), (g.BASE_FRONT_Z, g.ALC_D)))
    for nm, (x0, x1) in (("left upright", g.UP_L), ("right upright", g.UP_R)):
        b.append(box(nm, (x0, x1), (g.WORKTOP, g.CEIL), (g.ALC_D - g.UP_D, g.ALC_D)))
    b.append(box("TV", g.TV_X, (g.TV_BOTTOM, g.TV_TOP), g.TV_PANEL_Z))
    b.append(box("turntable", g.DECK_X, (g.WORKTOP, g.WORKTOP + g.DECK[1]), g.DECK_Z))
    b.append(box("Series X shelf", g.RZ, (g.RZ_SHELF_TOP - g.RZ_SHELF_T, g.RZ_SHELF_TOP), (g.ALC_D - g.RZ_SHELF_D, g.ALC_D)))
    # the side wall: the ledge's wrap and the PC shelf, the PC on it, the wall cabinets
    b.append(box("side-wall ledge", (0, g.WRAP_D), (g.LEDGE_UNDER, g.LEDGE_TOP), g.WRAP_Z))
    b.append(box("PC shelf", (0, g.PC_SHELF_D), (g.PC_SHELF_TOP - g.PC_SHELF_T, g.PC_SHELF_TOP), g.PC_SHELF_Z))
    b.append(box("PC", (0, g.PC_CASE[0]), (g.PC_SHELF_TOP, g.PC_SHELF_TOP + g.PC_CASE[1]), g.PC_Z))
    wc = g.WALL_CABS
    b.append(box("wall cabinets", (0, g.EKET[1]), (wc["y0"], wc["y0"] + g.EKET[2]), wc["z"]))
    # the chimney breast: the glass case, the "now playing" ledge, your vinyl stand under it
    c = ideas.CASE
    b.append(box("glass case", c["x"], c["y"], (-c["d"], 0)))
    nl = g.NOW_LEDGE
    b.append(box("now-playing ledge", nl["x"], (nl["top"] - nl["t"], nl["top"]), (-nl["d"], 0)))
    lay = g.PLANT_LAYOUTS["corner"]
    rx, rz, _f = lay["records"]; RS = g.RECORD_SHELF
    b.append(box("vinyl stand", (rx - RS["w"] / 2, rx + RS["w"] / 2), (0, RS["h"]), (rz - RS["d"] / 2, rz + RS["d"] / 2)))
    # the window corner: the plant stand, the alcove shelves; the lamp at the sofa's west end
    px, pz, _f = lay["plants"]; PS = g.PLANT_STAND
    b.append(box("plant stand", (px - PS["w"] / 2, px + PS["w"] / 2), (0, PS["h"]), (pz - PS["d"] / 2, pz + PS["d"] / 2)))
    al = g.ALCOVE_SHELVES
    for i, top in enumerate(al["tops"]):
        b.append(box(f"alcove shelf {i + 1}", al["x"], (top - al["t"], top), (g.WINDOW_Z, g.WINDOW_Z + al["d"])))
    lx, lz = g.FLOOR_LAMP_SPOTS["sofa"][1]; r = g.FLOOR_LAMP["base"] / 2
    b.append(box("red lamp", (lx - r, lx + r), (0, g.FLOOR_LAMP["h"]), (lz - r, lz + r)))
    # the sofa (the seat and its back), the coffee table, the ottoman, the basket, the rear speakers
    sx0, sx1 = g.SOFA_X
    b.append(box("sofa seat", (sx0, sx1), (0, 45), (g.SOFA_BACK_Z, g.SOFA_FRONT_Z)))
    b.append(box("sofa back", (sx0, sx1), (0, g.SOFA_H), (g.SOFA_BACK_Z, g.SOFA_BACK_Z + 20)))
    b.append(box("chaise", g.CHAISE_X, (0, 45), (g.SOFA_BACK_Z, g.CHAISE_END_Z)))
    b.append(box("record table", g.COFFEE["x"], (0, g.RECORD_TABLE["h"]), g.COFFEE["z"]))      # v38: the plan's coffee table
    import ideas as _I                                                                              # v43: the C-table, in the plan
    T, ze = _I.CTABLE, g.CHAISE_END_Z
    b.append(box("C-table's top", T["x"], (T["top"] - T["t"], T["top"]), (ze - T["over"], ze - T["over"] + T["depth"])))
    b.append(box("C-table's foot and upright", T["x"], (0, T["top"] - T["t"]), (ze - 3, ze - T["over"] + T["depth"])))
    po = g.SOFA_POUF
    b.append(box("ottoman", po["x"], (0, po["h"]), po["z"]))
    bb = g.BLANKET_BASKET
    b.append(box("blanket basket", bb["x"], (0, bb["h"]), bb["z"]))
    ST, SP = g.REAR_STAND, g.REAR_SPK                            # v39: each rear speaker as its base, pole and speaker
    for i, (x, z) in enumerate(g.REAR_SPOTS):
        b.append(box(f"rear speaker {i + 1}'s base", (x - ST["base"][0] / 2, x + ST["base"][0] / 2), (0, ST["base"][2]), ST["base_z"]))
        b.append(box(f"rear speaker {i + 1}'s pole", (x - ST["pole"] / 2, x + ST["pole"] / 2), (ST["base"][2], ST["top"]), (ST["pole_z"] - ST["pole"] / 2, ST["pole_z"] + ST["pole"] / 2)))
        b.append(box(f"rear speaker {i + 1}", (x - SP[0] / 2, x + SP[0] / 2), (ST["top"], ST["top"] + SP[1]), (z - SP[2] / 2, z + SP[2] / 2)))
    b.append(box("radiator", g.RADIATOR_X, g.RADIATOR_Y, (g.WINDOW_Z + 3.0, g.RADIATOR_FACE)))
    CU = g.CURTAIN                                                 # the drawn curtains, their folds' depth either way
    x0, x1, hw = g.WINDOW_X[0] - CU["ext"], g.WINDOW_X[1] + CU["ext"], g.REAR_SPK[0] / 2 + 2
    flat = sorted((sx - hw - 6, sx + hw + 6) for sx, _z in g.REAR_SPOTS if x0 < sx < x1)   # behind a pole the cloth lies flat at the dent
    for a0, a1 in zip([x0] + [f[1] for f in flat], [f[0] for f in flat] + [x1]):
        b.append(box("curtains, drawn", (a0, a1), (CU["drop_to"], CU["rail_y"]), (CU["z"] - CU["amp"], CU["z"] + CU["amp"])))
    for f0, f1 in flat:
        b.append(box("curtains, drawn", (f0, f1), (CU["drop_to"], CU["rail_y"]), (ST["dent"] - 0.05, ST["dent"] + 0.05)))
    # the stairs wall: the dining cabinet, the bar beside it, your black shelf and what's on it, the hanging plant's strands
    C = g.CAB
    b.append(box("dining cabinet", (C["front"], W), (0, C["h"]), C["z"]))
    B = g.BAR_BUILT
    b.append(box("bar", (W - B["front"], W), (0, B["shelf2"][0]), B["z"]))
    sb = g.SHELF_B
    b.append(box("black shelf", (W - sb["d"], W), (sb["top"] - sb["t"], sb["top"]), sb["z"]))
    LB = g.LIGHTBOX
    b.append(box("light box", (W - 1 - LB["d"], W - 1), (sb["top"], sb["top"] + LB["h"]), LB["z"]))
    K = g.KUGGIS
    for i, (za, zb) in enumerate(g.SHELF_BOXES):
        b.append(box(f"box on the shelf {i + 1}", (W - K[1] - 0.5, W - 0.5), (sb["top"], sb["top"] + K[2]), (zb, zb + K[0])))
    pb = g.PLANT_B
    b.append(box("hanging plant's strands", strands_x(), (sb["top"] - sb["t"] - pb["trail"][1], sb["top"] - sb["t"]), strands_z()))
    # over the hall door; the step drawers (shut)
    ds = g.DOOR_SHELF
    b.append(box("shelf over the door", ds["x"], (ds["y"], ds["top"]), (G.BREAST_D_WEST - ds["d"], G.BREAST_D_WEST)))
    return b


def strands_x():
    """Where the hanging plant's strands fall, across the room: off the shelf's front (v15 to v37), or (v38) through its end's gap."""
    sb = G.SHELF_B
    if getattr(G, "PLANT_THROUGH_GAP", False):
        return (G.ROOM_W - sb["d"], G.ROOM_W - 1)
    return (G.ROOM_W - sb["d"] - 3, G.ROOM_W - sb["d"] + 3)


def strands_z():
    pb, sb = G.PLANT_B, G.SHELF_B
    if getattr(G, "PLANT_THROUGH_GAP", False):
        return (G.PIPE_BOX["z"][1] + 1.0, sb["z"][1] - 1.5)
    return (pb["z"] - pb["pot"] / 2, pb["z"] + pb["pot"] / 2)


def overlap(a, b):
    """How far two boxes overlap on each axis (all three positive: a clash)."""
    return [min(a[i][1], b[i][1]) - max(a[i][0], b[i][0]) for i in (1, 2, 3)]


def gap(a, b):
    """The smallest gap between two boxes that overlap on the other two axes (None if they don't face each other)."""
    o = overlap(a, b)
    for i in range(3):
        if o[i] < 0 and all(o[j] > EPS for j in range(3) if j != i):
            return -o[i]
    return None


# the moving parts: a door as a half-disc swept round its hinge (on the room's side of the wall), or a box that moves
def door_sweeps():
    C = G.CAB
    xh = C["front"]
    t_hinge = C["door_t"][1] - C["hinge_gap"]                  # the table door: hinged at its window end, it turns 180° to lie back
    c_hinge = C["door_c"][0]                                   # the chair door: hinged at its stair end, it lies back over the table door
    return [("table door's swing", (xh, t_hinge), C["door_tw"], (C["plinth"] if "plinth" in C else 3.0, 3.0 + C["door_h"])),
            ("chair door's swing", (xh, c_hinge), C["door_cw"], (3.0, 3.0 + C["door_h"]))]


def in_sweep(bx, sweep, step=1.0):
    """Does a box reach into a door's swept half-disc (x <= the hinge line, within its radius), at the door's heights?"""
    name, (hx, hz), rad, (y0, y1) = sweep
    if min(bx[2][1], y1) - max(bx[2][0], y0) <= EPS:
        return False
    (x0, x1), (z0, z1) = bx[1], bx[3]
    x1 = min(x1, hx)
    if x0 >= x1:
        return False
    # the nearest point of the box's footprint to the hinge
    nx, nz = min(max(hx, x0), x1), min(max(hz, z0), z1)
    return math.hypot(nx - hx, nz - hz) < rad - EPS


def dining_pieces():
    """The table out for six and its chairs."""
    C, ch = G.CAB, G.CHAIR_PADDED
    po = G.SOFA_POUF
    out = [box("open table", C["tx"], (0, G.TABLE_TOP), C["tz"]), box("ottoman at its dinner spot", po["dinner"]["x"], (0, po["h"]), po["dinner"]["z"])]
    for i, (x, z, f) in enumerate(C["seats"]["six"]):
        out.append(box(f"chair {i + 1}", (x - ch["w"] / 2, x + ch["w"] / 2), (0, ch["h"]), (z - ch["d"] / 2, z + ch["d"] / 2)))
    return out


def moving_pieces():
    """The step drawers out, the lift-top up (each against everything else)."""
    out = []
    D = G.STAIR_DRAWERS
    for i in range(D["n"]):
        zr = G.ALC_D - G.STAIR_D + 6 + G.STAIR_GOING * i
        y = G.STAIR_RISE * i + 1.4
        out.append(box(f"step drawer {i + 1}, out", (G.STAIR_X[0] + D["inset"], G.STAIR_X[1] - D["inset"]), (y, y + D["h"]),
                       (zr - (D["depth"] - 8), zr)))
    Rt, cf = G.RECORD_TABLE, G.COFFEE
    # v38: the record table's lid, open on its piano hinge along the TV side (stood up about 80°, the stays' stop)
    out.append(box("record table's lid, open", cf["x"], (Rt["h"], Rt["h"] + Rt["d"]), (cf["z"][1] - Rt["lid"] - 9.0, cf["z"][1])))
    return out


def bar_sweeps():
    """v38: each spot bar turns on its rose (the client: "turning the light fixture as a whole"): the 84 bar and its 15-wide shades sweep a
    circle round the rose, down to the shades' drop. [(name, rose (x, z), radius, (y0, y1))]"""
    r = G.BAR[0] / 2 + 7.5
    y = (G.CEIL - G.BAR[2], G.CEIL)
    return [("spot bar 1's turning circle", (G.PEND_X, G.PEND_Z), r, y), ("spot bar 2's turning circle", (G.BAR2_X, G.BAR2_Z), r, y)]


def wall_room(x, z):
    """The distance from a point to the nearest wall face (the side walls, the window, the breast's face or the alcove's back)."""
    back = G.ALC_D if x < G.ALC_W else 0.0
    return min(x, G.ROOM_W - x, z - G.WINDOW_Z, back - z)


def in_circle(bx, sweep):
    name, (cx, cz), rad, (y0, y1) = sweep
    if min(bx[2][1], y1) - max(bx[2][0], y0) <= EPS:
        return False
    (x0, x1), (z0, z1) = bx[1], bx[3]
    nx, nz = min(max(cx, x0), x1), min(max(cz, z0), z1)
    return math.hypot(nx - cx, nz - cz) < rad - EPS


def ceiling_pieces():
    """v38 (item 12): the feature ceilings to try (options), as boxes: the beams, the coffers' ribs, the LED cove round the walls."""
    CD, C, out = G.CEIL_DESIGNS, G.CEIL, []
    B = CD["beams"]
    out += [box(f"ceiling beam at x {x:g}", (x - B["w"] / 2, x + B["w"] / 2), (C - B["d"], C), (z0, z1)) for x, z0, z1 in B["runs"]]
    K = CD["coffers"]
    out += [box(f"coffer rib at x {x:g}", (x - K["w"] / 2, x + K["w"] / 2), (C - K["d"], C), (z0, z1)) for x, z0, z1 in K["runs"]]
    out += [box(f"coffer rib at z {z:g}", (0, K["x_to"]), (C - K["d"], C), (z - K["w"] / 2, z + K["w"] / 2)) for z in K["z"]]
    V, W, WZ = CD["cove"], G.ROOM_W, G.WINDOW_Z
    out += [box("LED cove, window wall", (0, W), (C - V["h"], C), (WZ, WZ + V["d"])),
            box("LED cove, side wall", (0, V["d"]), (C - V["h"], C), (WZ, 0)),
            box("LED cove, chimney breast", G.BREAST_X, (C - V["h"], C), (-V["d"], 0)),
            box("LED cove, by the door", (G.BREAST_X[1], G.DOOR_X[1] + 1.5), (C - V["h"], C), (G.BREAST_D_WEST - V["d"], G.BREAST_D_WEST))]
    return out


def report():
    """[(kind, a, b, detail)]: kind "clash" (fails) or "close" (under 1 cm apart, a note)."""
    P = pieces()
    out = []
    for i, a in enumerate(P):
        for b in P[i + 1:]:
            if any(a[0] in grp and b[0] in grp for grp in ONE_PIECE) or frozenset((a[0], b[0])) in MEANT:
                continue
            o = overlap(a, b)
            if all(v > EPS for v in o):
                out.append(("clash", a[0], b[0], f"overlap {o[0]:.1f} × {o[1]:.1f} × {o[2]:.1f}"))
            else:
                gp = gap(a, b)
                if gp is not None and EPS < gp < 1.0:
                    out.append(("close", a[0], b[0], f"{gp:.1f} apart"))
    for sw in door_sweeps():
        for p in P:
            if p[0] in ("dining cabinet",):
                continue
            if in_sweep(p, sw):
                out.append(("clash", sw[0], p[0], f"inside its {sw[2]:.1f} swing"))
    for sw in bar_sweeps():                                     # v38: a turned bar clears the walls and anything up at its height
        clear = wall_room(*sw[1]) - sw[2]
        if clear < 0:
            out.append(("clash", sw[0], "a wall", f"{-clear:.1f} into it at some angles"))
        elif clear < 1.0:
            out.append(("close", sw[0], "a wall", f"{clear:.1f} clear"))
        for p in P:
            if in_circle(p, sw):
                out.append(("clash", sw[0], p[0], "inside it at some angles"))
    for c in ceiling_pieces():                                  # v38: the ceiling designs clear the bars' circles and the pieces
        for sw in bar_sweeps():
            if in_circle(c, sw):
                out.append(("clash", c[0], sw[0], "inside it at some angles"))
        for p in P:
            o = overlap(c, p)
            if all(v > EPS for v in o):
                out.append(("clash", c[0], p[0], f"overlap {o[0]:.1f} × {o[1]:.1f} × {o[2]:.1f}"))
    skip = {"dining cabinet", "sofa seat", "sofa back", "chaise", "ottoman"}   # the table opens from the cabinet; chairs stop short of the sofa (fit.py); the ottoman moves
    D = dining_pieces()
    for i, d in enumerate(D):
        for p in P + D[i + 1:]:
            if p[0] in skip or (d[0] == "open table" and p[0].startswith("chair")):   # the chairs tuck 8 under its edge (CHAIR_TUCK)
                continue
            o = overlap(d, p)
            if all(v > EPS for v in o):
                out.append(("clash", d[0] + " (dining for six)", p[0], f"overlap {o[0]:.1f} × {o[1]:.1f} × {o[2]:.1f}"))
    for m in moving_pieces():
        for p in P:
            if p[0] == "record table" and m[0].startswith("record table"):
                continue
            o = overlap(m, p)
            if all(v > EPS for v in o):
                out.append(("clash", m[0], p[0], f"overlap {o[0]:.1f} × {o[1]:.1f} × {o[2]:.1f}"))
    return out


if __name__ == "__main__":
    r = report()
    for kind, a, b, d in r:
        print(f"{kind:6} {a}  ×  {b}: {d}")
    print(f"{sum(1 for x in r if x[0] == 'clash')} clashes, {sum(1 for x in r if x[0] == 'close')} close")
