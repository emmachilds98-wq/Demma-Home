"""V2.4 (docs/FINISHES_PLAN.md F1): every wall, ceiling and floor face knows its room, and each room its surfaces with their areas.

A face's room is the room 1 cm out from it (an inside wall's two faces, two rooms). The walls are the `paint` boxes and profiles (and the
stair wall's `stairpaint`), the ceilings the `ceiling` and `artex` ones, the floors each room's finish (model.FLOOR_FINISH). The living
room's walls come from its measured shell (model.living_shell), its ceiling and floor from its outline. Areas in m², net of the holes
(the model cuts doors and windows out of the boxes). Nothing on the site reads this yet: F2's palette will, face by face."""
import model as M

WALLS, CEILS = {"paint", "stairpaint"}, {"ceiling", "artex"}
FLOORS = set(M.FLOOR_FINISH.values())
JOIN = {"first_stairs": "landing"}                                # the stairwell's walls are the landing's
SIDE = {(1, 0): "east", (-1, 0): "west", (0, 1): "back", (0, -1): "front"}   # by the way the face looks into its room (x runs west, z to the front)
OUT = 1.0                                                       # how far out from a face its room is looked for


def _pieces():
    out = {}
    for f in M.FLOOR_Y:
        rs, well = M.rooms(f), M.stair_well(f)                         # N210: no floor over a stairwell (the landing's carpet covered its hole)
        out[f] = [(JOIN.get(p["room"], p["room"]), *q) for p in rs if p["room"] != "living" and p["room"] not in M.VOID
                  for q in M._minus((p["x0"], p["x1"], p["z0"], p["z1"]), well)]
    return out


PIECES = _pieces()


def _band(f):
    return M.FLOOR_Y[f], M.FLOOR_Y[f] + M.CEIL


def _in_poly(u, v, pts):
    c = False
    for k in range(len(pts)):
        (u0, v0), (u1, v1) = pts[k], pts[k - 1]
        if (v0 > v) != (v1 > v) and u < (u1 - u0) * (v - v0) / (v1 - v0) + u0:
            c = not c
    return c


def faces():
    """Every surface face, split by storey and by room: (room, kind, side, area cm², material, floor, a wall's (axis, line, u0, u1, y0, y1)). A wall's face runs on past rooms
    (the party wall the house's whole depth), so each room gets the length of it along its own outline."""
    e = M.export()
    raw = []                                                     # (kind, m, axis of the plane, plane, normal sign, u0, u1, y0, y1) or a floor/ceiling rect
    over = []                                                    # the stair wall's profile: the paint behind it isn't counted again
    slopes = []                                                  # (x, z and y just up from its foot, area, material)
    for g, F in e["floors"].items():
        for m, boxes in F["boxes"].items():
            kind = "wall" if m in WALLS else "ceiling" if m in CEILS else "floor" if m in FLOORS else None
            if not kind:
                continue
            for b in boxes:
                x0, y0, z0, x1, y1, z1 = b[:6]
                if kind == "wall":
                    if y1 - y0 < 30:                             # a sill, a lip: not a wall
                        continue
                    raw += [("wall", m, "x", x0, -1, z0, z1, y0, y1), ("wall", m, "x", x1, 1, z0, z1, y0, y1),
                            ("wall", m, "z", z0, -1, x0, x1, y0, y1), ("wall", m, "z", z1, 1, x0, x1, y0, y1)]
                else:
                    raw.append((kind, m, x0, x1, z0, z1, y0 if kind == "ceiling" else y1))
        for P in F.get("prisms", []):
            if P["m"] in CEILS and P["axis"] == "x":             # N214: a sloped ceiling (the roof rooms', the flight's underside): its long edge across
                L = max(((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) ** 0.5 for p, q in zip(P["pts"], P["pts"][1:] + P["pts"][:1]))
                lo, hi = min(P["pts"], key=lambda q: q[1]), max(P["pts"], key=lambda q: q[1])
                slopes.append(((P["a"] + P["b"]) / 2, lo[0] + (5 if hi[0] > lo[0] else -5), lo[1], L * (P["b"] - P["a"]), P["m"]))
            if P["m"] not in WALLS or P["axis"] == "y":
                continue
            us = [q[0] for q in P["pts"]]; vs = [q[1] for q in P["pts"]]
            for sgn, c in ((-1, P["a"]), (1, P["b"])):
                raw.append(("wallp", P["m"], P["axis"], c, sgn, min(us), max(us), min(vs), max(vs), P["pts"]))
            if P["m"] == "stairpaint":
                over.append((P["axis"], P["a"], P["b"], P["pts"]))
    out = []
    for x, z, y, a, m in slopes:                                 # its room: the one at its foot
        f = max((k for k in M.FLOOR_Y if M.FLOOR_Y[k] - 1 <= y), key=lambda k: M.FLOOR_Y[k])
        rid = next((p[0] for p in PIECES[f] if p[1] <= x <= p[2] and p[3] <= z <= p[4]), None)
        out.append((rid, "slope", None, a, m, f, None))
    for r in raw:
        if r[0] in ("wall", "wallp"):
            kind, m, ax, c, sgn, u0, u1, y0, y1 = r[:9]
            pts = r[9] if kind == "wallp" else None
            for f in M.FLOOR_Y:
                b0, b1 = _band(f); ya, yb = max(y0, b0), min(y1, b1)
                if yb - ya < 1:
                    continue
                for rid, px0, px1, pz0, pz1 in PIECES[f]:
                    q = c + sgn * OUT
                    if ax == "x":
                        if not (px0 <= q <= px1): continue
                        ua, ub = max(u0, pz0), min(u1, pz1)
                    else:
                        if not (pz0 <= q <= pz1): continue
                        ua, ub = max(u0, px0), min(u1, px1)
                    if ub - ua < 1:
                        continue
                    lay = m != "stairpaint" and any(o[0] == ax and o[1] - 1 <= c <= o[2] + 1 for o in over)   # the stair wall's paint lies on it
                    if pts is None and not lay:
                        area = (ub - ua) * (yb - ya)
                    else:                                        # a profile, or a plain face with the stair wall's on it: count by its cells
                        n = 0; step = 5.0; uu = ua + step / 2
                        while uu < ub:
                            yy = ya + step / 2
                            while yy < yb:
                                inside = _in_poly(uu, yy, pts) if pts else True
                                covered = lay and any(o[0] == ax and o[1] - 1 <= c <= o[2] + 1 and _in_poly(uu, yy, o[3]) for o in over)
                                n += inside and not covered; yy += step
                            uu += step
                        area = n * step * step
                    if area >= 1:
                        out.append((rid, "wall", SIDE[(sgn, 0) if ax == "x" else (0, sgn)], area, m, f, (ax, c, ua, ub, ya, yb)))
        else:
            kind, m, x0, x1, z0, z1, y = r
            if kind == "floor":                                  # the storey it's the floor of (the garage's at the street's level, 15 down)
                f = min(M.FLOOR_Y, key=lambda k: abs(y - M.FLOOR_Y[k]))
                if abs(y - M.FLOOR_Y[f]) > 16:
                    continue
            else:                                                # the storey under it (the lower floor's are in the ground floor's group)
                f = max((k for k in M.FLOOR_Y if M.FLOOR_Y[k] + 150 <= y), key=lambda k: M.FLOOR_Y[k], default=None)
                if f is None:
                    continue
            for rid, px0, px1, pz0, pz1 in PIECES[f]:
                a = max(0.0, min(x1, px1) - max(x0, px0)) * max(0.0, min(z1, pz1) - max(z0, pz0))
                if a >= 1:
                    out.append((rid, kind, None, a, m, f, None))
    return out


def _living():
    """The living room's own surfaces, from its measured shell."""
    L = M.living_shell()
    walls, named = {}, {}
    for w in L["walls"]:
        u0, u1 = sorted(w["u"]); y0, y1 = w["y"]
        a = (u1 - u0) * (y1 - y0) - sum((h[1] - h[0]) * (h[3] - h[2]) for h in w.get("holes", []))
        n = w["n"]; side = SIDE[(int(n[0]), int(n[2]))]
        walls.setdefault(side, [0.0, 0])
        walls[side][0] += a; walls[side][1] += 1
        named[w["paint"]] = named.get(w["paint"], 0.0) + a   # N5: by the walls Look names (media, breast, door, stairs, window, pc)
    fx0, fz0, fx1, fz1 = L["floor"]
    ceil = sum((x1 - x0) * (z1 - z0) for x0, x1, z0, z1 in L["ceiling"])   # its pieces are [x0, x1, z0, z1]
    return walls, ceil, (fx1 - fx0) * (fz1 - fz0), named


SIDES = ("back", "front", "east", "west")                      # the palette's columns 0-3
NEAR, WIDE, SMALL = 2.0, 15.0, 1e3                               # a point is on a wall within 2 cm of its line and its span; a wall 15 along and 0.1 m² at least


def walls(F=None):
    """N214: each room's walls as built, each to take its own colour: {room: [[side 0-3, line0, line1, u0, u1, m²], ...]}, by side, then
    along it. A side's faces join into one wall where their lines lie within 4 cm and their spans meet within 4 (a door or a window leaves
    its lintel and sill on the line; a lining stands 2 proud of its wall); a chimney breast's face and its alcoves, an L's two walls, a
    dormer's cheeks are walls of their own. A face under 15 along or 0.1 m² (a wall's end at a door, a strip) keeps its side's colour."""
    by = {}
    for rid, kind, side, a, m, f, g in F or faces():
        if kind == "wall" and m == "paint" and rid:
            by.setdefault((rid, SIDES.index(side)), []).append([g[1], g[1], g[2], g[3], a])
    holes = [(d["axis"], d["line"], d["a"] - 8, d["b"] + 8) for f in M.FLOOR_Y for d in M.doors(f)] + \
            [("x", M.BACK if o["side"] == "n" else M.FRONT, o["x"][0] - 8, o["x"][1] + 8) for o in M.D.OPENINGS]   # with their frames
    out = {}
    for (rid, si), L in sorted(by.items()):
        gs = []
        for q in L:
            hit = [w for w in gs if q[0] - w[1] <= 2 * NEAR and w[0] - q[1] <= 2 * NEAR and (
                (q[2] - w[3] <= 2 * NEAR and w[2] - q[3] <= 2 * NEAR) or any(   # their spans meet, or a door's or window's hole lies between them
                    ax == "xxzz"[si] and abs(ln - q[0]) < 30 and h0 <= min(q[3], w[3]) + 1 and max(q[2], w[2]) - 1 <= h1 for ax, ln, h0, h1 in holes))]
            for w in hit:
                gs.remove(w); q = [min(q[0], w[0]), max(q[1], w[1]), min(q[2], w[2]), max(q[3], w[3]), q[4] + w[4]]
            gs.append(q)
        out.setdefault(rid, []).extend([si, round(w[0], 1), round(w[1], 1), round(w[2], 1), round(w[3], 1), round(w[4] / 1e4, 2)]
                                       for w in sorted(gs, key=lambda w: w[2]) if w[3] - w[2] >= WIDE and w[4] >= SMALL)
    return out


def wall_at(W, rid, si, c, u):
    """The walls (indices in W[rid]) a point on a side's face lies on, as the page's shader finds them."""
    return [i for i, w in enumerate(W.get(rid, [])) if w[0] == si and w[1] - NEAR <= c <= w[2] + NEAR and w[3] - NEAR <= u <= w[4] + NEAR]


def by_room():
    """{room: {walls: [{side, area, faces, finish}], ceiling, floor, slope: {area, faces, finish}, faces: walls()}}, areas in m²."""
    res, F = {}, faces()
    W = walls(F)
    for rid, kind, side, a, m, f, _ in F:
        if not rid:
            continue
        R = res.setdefault(rid, {"walls": {}, "ceiling": None, "floor": None, "slope": None})
        if kind == "wall":
            w = R["walls"].setdefault(side, dict(side=side, area=0.0, faces=0, finish=m))
            w["area"] += a; w["faces"] += 1
            if m == "stairpaint":
                w["finish"] = "stairpaint"
        else:
            s = R[kind] or dict(area=0.0, faces=0, finish=m)
            s["area"] += a; s["faces"] += 1; R[kind] = s
    lw, lc, lf, _ = _living()
    res["living"] = {"walls": {s: dict(side=s, area=a, faces=n, finish="living") for s, (a, n) in lw.items()},
                     "ceiling": dict(area=lc, faces=len(M.living_shell()["ceiling"]), finish="living"), "floor": dict(area=lf, faces=1, finish="carpet"), "slope": None}
    out = {}
    for rid, R in res.items():
        m2 = lambda v: round(v / 1e4, 2)
        out[rid] = dict(walls=[dict(w, area=m2(w["area"])) for w in sorted(R["walls"].values(), key=lambda w: w["side"])],
                        **{k: dict(R[k], area=m2(R[k]["area"])) if R[k] else None for k in ("ceiling", "floor", "slope")}, faces=W.get(rid, []))
    return out


if __name__ == "__main__":
    for rid, s in sorted(by_room().items()):
        w = " ".join(f"{x['side']} {x['area']}" for x in s["walls"])
        print(f"{rid:18} walls {w:60} ceiling {s['ceiling'] and s['ceiling']['area']}  floor {s['floor'] and s['floor']['area']}")
