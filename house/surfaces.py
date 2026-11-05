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
        out[f] = [(JOIN.get(p["room"], p["room"]), p["x0"], p["x1"], p["z0"], p["z1"]) for p in M.rooms(f) if p["room"] != "living"]
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
    """Every surface face, split by storey and by room: (room, kind, side, area cm², material, floor). A wall's face runs on past rooms
    (the party wall the house's whole depth), so each room gets the length of it along its own outline."""
    e = M.export()
    raw = []                                                     # (kind, m, axis of the plane, plane, normal sign, u0, u1, y0, y1) or a floor/ceiling rect
    over = []                                                    # the stair wall's profile: the paint behind it isn't counted again
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
            if P["m"] not in WALLS or P["axis"] == "y":
                continue                                         # a sloped ceiling's profile: counted with the slopes' boxes
            us = [q[0] for q in P["pts"]]; vs = [q[1] for q in P["pts"]]
            for sgn, c in ((-1, P["a"]), (1, P["b"])):
                raw.append(("wallp", P["m"], P["axis"], c, sgn, min(us), max(us), min(vs), max(vs), P["pts"]))
            if P["m"] == "stairpaint":
                over.append((P["axis"], P["a"], P["b"], P["pts"]))
    out = []
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
                        out.append((rid, "wall", SIDE[(sgn, 0) if ax == "x" else (0, sgn)], area, m, f))
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
                    out.append((rid, kind, None, a, m, f))
    return out


def _living():
    """The living room's own surfaces, from its measured shell."""
    L = M.living_shell()
    walls = {}
    for w in L["walls"]:
        u0, u1 = sorted(w["u"]); y0, y1 = w["y"]
        a = (u1 - u0) * (y1 - y0) - sum((h[1] - h[0]) * (h[3] - h[2]) for h in w.get("holes", []))
        n = w["n"]; side = SIDE[(int(n[0]), int(n[2]))]
        walls.setdefault(side, [0.0, 0])
        walls[side][0] += a; walls[side][1] += 1
    fx0, fz0, fx1, fz1 = L["floor"]
    ceil = sum((x1 - x0) * (z1 - z0) for x0, x1, z0, z1 in L["ceiling"])   # its pieces are [x0, x1, z0, z1]
    return walls, ceil, (fx1 - fx0) * (fz1 - fz0)


def by_room():
    """{room: {walls: [{side, area, faces, finish}], ceiling: {area, faces, finish}, floor: {...}}}, areas in m²."""
    res = {}
    for rid, kind, side, a, m, f in faces():
        if not rid:
            continue
        R = res.setdefault(rid, {"walls": {}, "ceiling": None, "floor": None})
        if kind == "wall":
            w = R["walls"].setdefault(side, dict(side=side, area=0.0, faces=0, finish=m))
            w["area"] += a; w["faces"] += 1
            if m == "stairpaint":
                w["finish"] = "stairpaint"
        else:
            s = R[kind] or dict(area=0.0, faces=0, finish=m)
            s["area"] += a; s["faces"] += 1; R[kind] = s
    lw, lc, lf = _living()
    res["living"] = {"walls": {s: dict(side=s, area=a, faces=n, finish="living") for s, (a, n) in lw.items()},
                     "ceiling": dict(area=lc, faces=len(M.living_shell()["ceiling"]), finish="living"), "floor": dict(area=lf, faces=1, finish="carpet")}
    out = {}
    for rid, R in res.items():
        m2 = lambda v: round(v / 1e4, 2)
        out[rid] = dict(walls=[dict(w, area=m2(w["area"])) for w in sorted(R["walls"].values(), key=lambda w: w["side"])],
                        ceiling=dict(R["ceiling"], area=m2(R["ceiling"]["area"])) if R["ceiling"] else None,
                        floor=dict(R["floor"], area=m2(R["floor"]["area"])) if R["floor"] else None)
    return out


if __name__ == "__main__":
    for rid, s in sorted(by_room().items()):
        w = " ".join(f"{x['side']} {x['area']}" for x in s["walls"])
        print(f"{rid:18} walls {w:60} ceiling {s['ceiling'] and s['ceiling']['area']}  floor {s['floor'] and s['floor']['area']}")
