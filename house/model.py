"""v58: the whole house as one model (phase 1), built from house/survey_data.py (the sizes, each with its source) and the client's
corrected plans as traced in house/house.py (PLANS: pixels per plan). build() gives the rooms, walls with their openings cut out, windows
and doors, floors, the stairs, the fittings and the roof; export() is what the 3D room draws (R.HOUSE3 in scene3d.json).

Coordinates as survey_data.py says (cm; x from the living room's east wall going west, z from the breast face to the front, y up). The
living room itself is the measured model's (media-wall/src): here it is only a neighbour, so nothing is drawn over it."""
import math
import house as H
import survey_data as D

K = math.tan(math.radians(D.ROOF["pitch"]))                 # the front slope
KB = math.tan(math.radians(D.ROOF.get("pitch_back", D.ROOF["pitch"])))   # v68: the back slope, steeper (the client's photos)
T_OUT, T_IN = D.WALLS["outer"], D.WALLS["inner"]
BACK, FRONT, WIDTH = D.INSIDE["back"], D.INSIDE["back"] + D.INSIDE["d"], D.INSIDE["w"]      # -309, 499.4 (v68), 467
RO = dict(n=BACK - T_OUT, s=FRONT + T_OUT, e=-T_OUT, w=WIDTH + D.WALLS["party"])           # the outside faces
FLOOR_Y = {"lower": D.LEVELS["lower"], "ground": D.LEVELS["ground"], "first": D.LEVELS["first"]}
CEIL = D.LEVELS["ceil"]
SLAB = D.LEVELS["slab"]
GROUP = {"lower_store_2": "lower_store", "master_b": "master", "master_1": "master", "bed2_1": "bed2", "bathroom_1": "bathroom", "landing_top": "landing", "kitchen_1": "kitchen", "kitchen_2": "kitchen", "lower_store_1": "lower_store"}   # traced pieces of one room
SPLIT = {"kitchen": [(420, 285, 985, 700), (420, 700, 535, 830), (690, 700, 985, 830)]}   # the kitchen round its cupboard (the plan)
VOID = {"first_stairs"}                                                     # the stairwell: no floor
NO_WALLS = {"living", "first_stairs"}
ROOF_E, ROOF_B = D.ROOF["eaves_front"], D.ROOF["eaves_back"]
DM = D.ROOF["dormer"]


def cal(floor):
    """The plan's pixels to cm, at the living room's scale (survey_data.PLAN_PX)."""
    P = D.PLAN_PX[floor]
    sx, sz = D.INSIDE["w"] / (P["E"] - P["W"]), D.INSIDE["plan_d"] / (P["S"] - P["N"])
    out = FRONT - (BACK + D.INSIDE["plan_d"])                    # v68: the front wall further out than the plans read
    def cz(py):
        z = BACK + (py - P["N"]) * sz
        return z + out if z > D.FRONT_OUT[floor] else z
    return (lambda px: (P["E"] - px) * sx), cz, sx, sz


def footprint(floor):
    """The inside outline, (x, z) points: a rectangle above ground; at the lower ground floor an L (the store and the stairs end under
    the hall, the secret room runs on under the garage to the front: the corrected plan)."""
    if floor != "lower":
        return [(0.0, BACK), (WIDTH, BACK), (WIDTH, FRONT), (0.0, FRONT)]
    cx, cz, *_ = cal("lower")
    xs, zs = round(cx(555), 1), round(cz(1110), 1)
    st = stair(); ze = round(st["z1"] + 2, 1)            # v80: round the flight's top two steps (they ran on through the store's end wall
    if ze > zs:                                          # to the hall's door down): the store under them, the wall in front of the top step
        return [(0.0, BACK), (WIDTH, BACK), (WIDTH, ze), (st["x0"], ze), (st["x0"], zs), (xs, zs), (xs, FRONT), (0.0, FRONT)]
    return [(0.0, BACK), (WIDTH, BACK), (WIDTH, zs), (xs, zs), (xs, FRONT), (0.0, FRONT)]


# ------------------------------------------------------------------------------------------------ the roof's heights
def under_back(z):            # the back slope's underside: through the back wall plate at its outside face
    return ROOF_B + (z - RO["n"]) * KB


def under_front(z):
    return ROOF_E + (RO["s"] - z) * K


RIDGE_Z = (ROOF_E - ROOF_B + RO["s"] * K + RO["n"] * KB) / (K + KB)
RIDGE_Y = under_back(RIDGE_Z)
DORMER_BACK = RO["n"] + (DM["top"] - ROOF_B) / KB                         # where its flat roof meets the back slope
ZC_BACK = RO["n"] + (FLOOR_Y["first"] + CEIL - ROOF_B) / KB                # where the back slope reaches the first floor's ceiling


def headroom(x0, x1, z):
    """The underside of the roof over a point on the first floor (the dormer's ceiling where it covers, else the slopes), capped at the
    first floor's ceiling."""
    top = FLOOR_Y["first"] + CEIL
    if DM["x"][0] <= x0 and x1 <= DM["x"][1] and z <= DORMER_BACK:
        return top
    return min(top, under_back(z), under_front(z))


# ------------------------------------------------------------------------------------------------ rooms
def rooms(floor):
    cx, cz, *_ = cal(floor)
    P = H.PLANS[floor]
    fp = footprint(floor)
    xs = sorted({p[0] for p in fp}); zs = sorted({p[1] for p in fp})
    snap = lambda v, ref: min(ref, key=lambda r: abs(r - v)) if min(abs(r - v) for r in ref) < 9 else v
    out = []
    pieces = []
    for rid, rect in P["rooms"] + [r for r in P["solids"] if r[0] == "kitchen_cupboard"]:
        if rid in SPLIT:                                         # an L-shaped room traced as one rectangle: its pieces
            pieces += [(rid if i == 0 else f"{rid}_{i}", r) for i, r in enumerate(SPLIT[rid])]
        else:
            pieces.append((rid, rect))
    for rid, (a, b, c, d) in pieces:
        x0, x1 = sorted((cx(c), cx(a))); z0, z1 = sorted((cz(b), cz(d)))
        r = dict(id=rid, room=GROUP.get(rid, rid), x0=round(snap(x0, xs), 1), x1=round(snap(x1, xs), 1), z0=round(snap(z0, zs), 1), z1=round(snap(z1, zs), 1))
        nm = H.NAMES.get(rid, ("", "")) if rid == GROUP.get(rid, rid) or rid in H.NAMES else ("", "")
        r.update(name=nm[0], use=nm[1])
        out.append(r)
    for r in out:                                                # v64: fitted to what the client has (survey_data.FIT)
        r.update(D.FIT.get(floor, {}).get(r["id"], {}))
    if floor == "first":                                         # v72: bedroom 2 on behind the master's wardrobes (survey_data.BED2_1)
        b1 = D.BED2_1
        if b1:                                                   # v75 the door's nook; v76 none
            out.append(dict(id="bed2_1", room="bed2", x0=b1["x"][0], x1=b1["x"][1], z0=b1["z"][0], z1=b1["z"][1], name="", use=""))
        b_ = D.BATH_1                                            # v77: the bathroom's corner over the bottom of the flight
        out.append(dict(id="bathroom_1", room="bathroom", x0=b_["x"][0], x1=b_["x"][1], z0=b_["z"][0], z1=b_["z"][1], name="", use=""))
        A, by = D.AIRING, {r["id"]: r for r in out}             # V1.8: the boiler cupboard out into both bedrooms (survey_data.AIRING)
        wf = by["master"]["z0"] + D.MASTER["wardrobes"]["d"]     # in the master, in line with the wardrobes' front
        bz = by["bed2"]["z1"] - A["into_bed2"]                   # into bedroom 2
        a, b2 = by["airing"], by["bed2"]
        out.append(dict(id="bed2_1", room="bed2", x0=b2["x0"], x1=a["x0"], z0=bz, z1=b2["z1"], name="", use=""))   # beside it, to the old wall
        b2["z1"] = bz
        a["z0"], a["z1"] = bz + A["wall_bed2"], wf                 # its end at the wardrobes' front, the wall's face just past it
        by["master_b"]["z0"] = wf + A["wall_master"]
        m1 = D.MASTER_1                                          # v73: the master past the little alcove by its door
        out.append(dict(id="master_1", room="master", x0=m1["x"][0], x1=m1["x"][1], z0=m1["z"][0], z1=m1["z"][1], name="", use=""))
    if floor == "lower":                                         # v80: the store on under the flight's top steps, to the hall's door down
        fp = footprint("lower"); st = stair()
        if len(fp) > 6:
            out.append(dict(id="lower_store_2", room="lower_store", x0=st["x0"], x1=WIDTH, z0=fp[4][1], z1=fp[2][1], name="", use=""))
    if floor == "ground":                                        # the measured living room, a neighbour only
        out.append(dict(id="living", room="living", x0=0.0, x1=WIDTH, z0=BACK, z1=38.0, name="", use=""))
    return out


def solids(floor):
    cx, cz, *_ = cal(floor)
    out = []
    for rid, (a, b, c, d) in H.PLANS[floor]["solids"]:
        if rid in ("kitchen_cupboard", "hall_wall", "bath_corner"):  # a room now; the stair enclosure; the roof's slope (below)
            continue
        x0, x1 = sorted((cx(c), cx(a))); z0, z1 = sorted((cz(b), cz(d)))
        out.append(dict(id=rid, x0=round(x0, 1), x1=round(x1, 1), z0=round(z0, 1), z1=round(z1, 1)))
    return out


def room_sizes():
    """Each room's size (m), its pieces together: what the labels and the checks use."""
    out = {}
    for f in FLOOR_Y:
        for r in rooms(f):
            if r["room"] in ("living",) or r["room"] in VOID:
                continue
            o = out.setdefault(r["room"], dict(floor=f, x0=r["x0"], x1=r["x1"], z0=r["z0"], z1=r["z1"], name=r["name"], use=r["use"]))
            o.update(x0=min(o["x0"], r["x0"]), x1=max(o["x1"], r["x1"]), z0=min(o["z0"], r["z0"]), z1=max(o["z1"], r["z1"]))
            if r["name"] and not o["name"]:
                o.update(name=r["name"], use=r["use"])
    return out


# ------------------------------------------------------------------------------------------------ doors and openings
def doors(floor):
    cx, cz, *_ = cal(floor)
    out = []
    for did, kind, at, (a, b) in D.DOORS_PX[floor]:
        if kind == "h":
            x0, x1 = sorted((cx(a), cx(b))); out.append(dict(id=did, axis="x", line=round(cz(at), 1), a=round(x0, 1), b=round(x1, 1)))
        else:
            z0, z1 = sorted((cz(a), cz(b))); out.append(dict(id=did, axis="z", line=round(cx(at), 1), a=round(z0, 1), b=round(z1, 1)))
    if floor == "ground":
        import importlib.util, pathlib
        sp = importlib.util.spec_from_file_location("geometry", pathlib.Path(__file__).resolve().parents[1] / "media-wall/src/geometry.py")
        G = importlib.util.module_from_spec(sp); sp.loader.exec_module(G)
        out.append(dict(id="living_door", axis="x", line=41.0, a=G.DOOR_X[0], b=G.DOOR_X[1]))
    for d in out:                                                # v65: fitted (survey_data.FIT_DOORS)
        if d["id"] in D.FIT_DOORS:
            d["a"], d["b"] = D.FIT_DOORS[d["id"]]
        if d["id"] in D.FIT_DOOR_LINE:                           # v73: a door whose wall moved (the bathroom's)
            d["line"] = D.FIT_DOOR_LINE[d["id"]]
    return out


# V1 (Phase 1): the names the app shows for the doors and windows, and the room each belongs to
DOOR_NAMES = {"wc_door": ("The WC door", "wc"), "kitchen_door": ("The kitchen door", "kitchen"), "store_door": ("The store's chalkboard door", "lower_store"),
              "cupboard_door": ("The cupboard's chalkboard door", "kitchen_cupboard"), "hall_porch": ("The front door", "hall"),
              "store_w": ("The left bin cupboard's door", "front_store_w"), "store_e": ("The right bin cupboard's door", "front_store_e"),
              "bath_door": ("The bathroom door", "bathroom"), "bed2_door": ("Bedroom 2's door", "bed2"), "airing_door": ("The boiler cupboard door", "airing"),
              "master_door": ("The master bedroom door", "master"), "bed3_door": ("The office's bifold door", "bed3"), "living_door": ("The living room door", "hall")}
WINDOW_NAMES = {"kitchen_window": ("The kitchen window", "kitchen"), "back_door": ("The back door", "kitchen"), "wc_window": ("The WC window", "wc"),
                "living_window": ("The living room window", "living"), "front_door": ("The porch", "porch"), "garage_door": ("The garage door", "garage"),
                "bed2_window": ("Bedroom 2's window", "bed2"), "bath_window": ("The bathroom window", "bathroom"),
                "master_window": ("The master bedroom window", "master"), "bed3_window": ("The office window", "bed3")}


def door_src(did):
    if did == "living_door":
        return "M"
    return "fitted" if did in D.FIT_DOORS else "P (the plans)"


def door_data(did):
    return ("FIT_DOORS", did) if did in D.FIT_DOORS else ("DOORS_PX", did)


def room_at(floor, x, z):
    """The room a point is in (or next to, within 15), for the pieces that don't say."""
    best = None
    for r in rooms(floor):
        d = max(r["x0"] - x, x - r["x1"], r["z0"] - z, z - r["z1"], 0)
        if d <= 15 and (best is None or d < best[0]) and r["room"] not in VOID:
            best = (d, r["room"])
    return best[1] if best else ""


# ------------------------------------------------------------------------------------------------ geometry helpers
ITEMS = {}   # V1 (Phase 1): every named piece: {id: {name, room, kind, src, data, axis, floor}}; its boxes carry its tag


class Out:
    def __init__(self, floor=None):
        self.boxes, self.prisms, self.labels, self.parts, self.lathes = {}, [], [], {}, []
        self.floor, self.tag, self.tags, self.bt = floor, None, [], {}   # V1: the item each box belongs to (bt: per material, an index into tags)

    def item(self, iid, name, room, kind="furniture", src="E", data=None, axis=None, measure=None):
        """V1 (Phase 1): every box drawn from here on (until the next item, or end()) belongs to this piece, so the app can tap it, name it,
        measure it and edit it. src: where its size comes from (M measured, P the plans, F/B the photos, client, E our estimate); data: the
        survey_data entry it's drawn from (a path), which tools/pull_edits.py writes the client's edits back to; axis: the way its wall runs
        (x or z), so "along the wall" means something."""
        if iid not in ITEMS:                                 # the first call names it; later ones (a loop's next piece) only tag
            ITEMS[iid] = dict(name=name, room=room, kind=kind, src=src, data=data, axis=axis, floor=self.floor,
                              measure=(src.strip().startswith("E") or src == "fitted") if measure is None else measure)
        if iid not in self.tags:
            self.tags.append(iid)
        self.tag = iid
        return self

    def end(self):
        self.tag = None

    def _t(self):
        return self.tags.index(self.tag) if self.tag else -1

    def box(self, m, x0, y0, z0, x1, y1, z1):
        x0, x1 = sorted((x0, x1)); y0, y1 = sorted((y0, y1)); z0, z1 = sorted((z0, z1))
        if x1 - x0 < 0.2 or y1 - y0 < 0.2 or z1 - z0 < 0.2:
            return
        self.boxes.setdefault(m, []).append([round(v, 1) for v in (x0, y0, z0, x1, y1, z1)])
        self.bt.setdefault(m, []).append(self._t())

    def prism(self, m, axis, a, b, pts):
        self.prisms.append(dict(m=m, axis=axis, a=round(a, 1), b=round(b, 1), pts=[[round(u, 1), round(v, 1)] for u, v in pts], t=self._t()))

    def lathe(self, m, cx, y0, cz, prof, sx=1.0, sz=1.0):
        """v70: a turned shape (a pan, a bowl, a seat): the profile [(radius, height)] from y0, turned about the upright through (cx, cz),
        stretched sx along x and sz along z (oval)."""
        self.lathes.append(dict(m=m, c=[round(cx, 1), round(y0, 1), round(cz, 1)], p=[[round(r, 2), round(h, 2)] for r, h in prof], s=[round(sx, 3), round(sz, 3)], t=self._t()))

    def part(self, name, pivot, axis, angle):
        """v68: a piece that moves in the viewer (the ottoman's lid): its own boxes, turning `angle` degrees about `axis` through `pivot`."""
        p = Out(self.floor); p.tags, p.tag = self.tags, self.tag   # V1: the lid belongs to the bed
        self.parts[name] = dict(pivot=[round(v, 1) for v in pivot], axis=axis, angle=angle, out=p); return p

    def json(self):
        return dict(boxes=self.boxes, prisms=self.prisms, labels=self.labels, lathes=self.lathes, tags=self.tags, bt=self.bt,
                    parts={k: dict(pivot=v["pivot"], axis=v["axis"], angle=v["angle"], boxes=v["out"].boxes, bt=v["out"].bt) for k, v in self.parts.items()})


def wall(o, m, axis, line0, line1, a0, a1, y0, y1, holes=()):
    """A straight wall as boxes round its openings. axis "x": runs along x from a0 to a1, between z line0 and line1; "z": along z.
    holes: (a, b, sill, head) in the wall's own along-coordinate and absolute heights."""
    hs = sorted((max(a0, h[0]), min(a1, h[1]), max(y0, h[2]), min(y1, h[3])) for h in holes if h[1] > a0 and h[0] < a1)
    put = (lambda a, b, ya, yb: o.box(m, a, ya, line0, b, yb, line1)) if axis == "x" else (lambda a, b, ya, yb: o.box(m, line0, ya, a, line1, yb, b))
    # v78: a grid through every opening's sides, sill and head, so each piece meets the next edge to edge. Pieces that only shared
    # part of an edge (a full-height pier beside the piece over a door) left a hairline crack on the face, up from each door's frame
    xs = sorted({a0, a1} | {v for h in hs for v in h[:2]}); ys = sorted({y0, y1} | {v for h in hs for v in h[2:] if y0 < v < y1})
    for a, b in zip(xs, xs[1:]):
        for ya, yb in zip(ys, ys[1:]):
            ca, cy = (a + b) / 2, (ya + yb) / 2
            if b - a > 0.05 and not any(h[0] < ca < h[1] and h[2] < cy < h[3] for h in hs):
                put(a, b, ya, yb)


def window(o, side, x0, x1, y0, y1, design, face):
    """A white uPVC window or door in an outside wall: frame, glass, glazing bars; set 4 in from the outside face `face` (z)."""
    if design == "porch":                    # v65: the open porch: no frame in the outside wall
        return
    s = 1 if side == "s" else -1
    zo = face - s * 4                        # the frame's outer plane
    zi = zo - s * 7
    W, fr = "upvc", 6.0
    o.box(W, x0, y0, zo, x0 + fr, y1, zi); o.box(W, x1 - fr, y0, zo, x1, y1, zi)
    o.box(W, x0, y1 - fr, zo, x1, y1, zi); o.box(W, x0, y0, zo, x1, y0 + fr, zi)
    zg = (zo + zi) / 2
    if design in ("front", "garage"):
        return
    o.box("glass", x0 + fr, y0 + fr, zg - 0.5, x1 - fr, y1 - fr, zg + 0.5)
    w, h = x1 - x0, y1 - y0
    if design == "casement":                 # two or three sections, a transom with top lights (the photos)
        n = 3 if w > 140 else 2
        for i in range(1, n):
            xm = x0 + w * i / n; o.box(W, xm - 3, y0, zo, xm + 3, y1, zi)
        yt = y0 + h * 0.78; o.box(W, x0, yt - 2.5, zo, x1, yt + 2.5, zi)
    elif design in ("bars", "glazed", "living"):   # Georgian bars
        cols = max(2, round(w / 30)); rows = max(2, round(h / 32))
        if design == "glazed":
            o.box(W, x0, y0 + 95, zo, x1, y0 + 104, zi); o.box(W, x0 + fr, y0 + fr, zo, x1 - fr, y0 + 40, zi)   # the mid rail, a kick panel
        for i in range(1, cols):
            xm = x0 + w * i / cols; o.box(W, xm - 0.8, y0, zg - 1.4, xm + 0.8, y1, zg + 1.4)
        for j in range(1, rows):
            ym = y0 + h * j / rows; o.box(W, x0, ym - 0.8, zg - 1.4, x1, ym + 0.8, zg + 1.4)


# ------------------------------------------------------------------------------------------------ the floors
FLOOR_FINISH = {"bed3": "carpet_grey", "bed2": "carpet_grey", "master": "carpet_grey", "master_b": "carpet_grey", "master_1": "carpet_grey", "kitchen": "laminate", "kitchen_1": "laminate", "kitchen_2": "laminate", "lower_store_1": "board", "wc": "laminate", "bathroom": "marble", "garage": "concrete", "secret": "earth", "porch": "quarry",
                "lower_store": "board", "kitchen_cupboard": "board", "front_store_w": "board", "front_store_e": "board", "airing": "board",
                "lower_landing": "laminate", "lower_stairs": "board", "hall": "carpet_grey", "landing": "carpet_grey", "landing_top": "carpet_grey", "bathroom_1": "marble", "lower_store_2": "board"}   # v67: the photos


def walls_for(o, floor, rs, ds, y0, y1):
    """Inner walls: on every room edge that isn't the outside wall, out to the next room (half the gap, or all of it next to the measured
    living room, which draws its own wall face), with the doors cut through."""
    fp = footprint(floor)
    outer_x = {p[0] for p in fp}; outer_z = {p[1] for p in fp}

    def near(v, ref):
        return any(abs(v - r) < 3 for r in ref)

    for r in rs:
        if r["id"] in NO_WALLS:
            continue
        for axis, line, out_dir, a0, a1 in (("x", r["z0"], -1, r["x0"], r["x1"]), ("x", r["z1"], 1, r["x0"], r["x1"]),
                                             ("z", r["x0"], -1, r["z0"], r["z1"]), ("z", r["x1"], 1, r["z0"], r["z1"])):
            if near(line, outer_z if axis == "x" else outer_x) and _on_outline(fp, axis, line, a0, a1):
                continue
            # the facing rooms, their gap and whether they're the same room (then no wall where they touch)
            gaps, skip, open_ = [], [], []
            for q in rs:
                if q is r:
                    continue
                qa0, qa1 = (q["x0"], q["x1"]) if axis == "x" else (q["z0"], q["z1"])
                if qa1 <= a0 + 1 or qa0 >= a1 - 1:
                    continue
                qline = (q["z0"] if out_dir > 0 else q["z1"]) if axis == "x" else (q["x0"] if out_dir > 0 else q["x1"])
                gap = (qline - line) * out_dir
                if -1 <= gap <= 30:
                    if q["room"] == r["room"] and gap < 3:
                        skip.append((max(a0, qa0), min(a1, qa1)))
                    elif q["room"] in VOID and r["room"] == "landing" and gap < 3:
                        # v77, the client: "There is no door on the stairwell to the upstairs": the landing is open to the stairwell (the
                        # banister guards it); since v66 a thin wall stood there full height, along the banister and across the top step
                        skip.append((max(a0, qa0), min(a1, qa1))); open_.append(skip[-1])
                    else:
                        gaps.append((gap, q))
            if not gaps and open_ and _covers(skip, a0, a1):
                continue                          # v77: open all along (the landing over the stairwell): no stub at its ends either
            if gaps:
                g, q = min(gaps, key=lambda t: t[0])
                t = g if q["id"] == "living" or q["room"] in VOID else max(g / 2, 2.0)   # v77: the stairwell draws no wall, so this side takes the whole gap
            else:
                t = T_IN / 2
            if q_is_living(gaps) and t < 1:
                continue
            l0, l1 = sorted((line, line + out_dir * t))
            holes = [(d["a"], d["b"], y0 - SLAB, y0 + D.DOOR_H) for d in ds if d["axis"] == axis and l0 - 16 <= d["line"] <= l1 + 16]
            ext = 0 if axis == "z" else t        # close the corners
            # v78: an opening that reaches the edge's end runs on past it, so no stub of wall stands loose in the room beyond (a
            # post stood over the master's bed where its three pieces meet)
            holes += [(s0 - (ext + 1 if s0 <= a0 + 1 else 0), s1 + (ext + 1 if s1 >= a1 - 1 else 0), y0 - SLAB - 1, y1 + 1) for s0, s1 in skip]
            if floor == "first" and axis == "z" and DM["x"][0] < l0 and l1 < DM["x"][1]:
                a0 = max(a0, DM["face"] + DM["t"])   # inside the dormer's face, not through it
            for seg in _split_dormer(floor, axis, a0 - ext, a1 + ext):
                top = y1 if floor != "first" else min(y1, _wall_top(axis, seg, l0, l1))
                o.end()
                wall(o, "paint", axis, l0, l1, seg[0], seg[1], y0 - SLAB, top, holes)
            for d in ds:                          # the doors' frames (architraves), on both faces
                if d["axis"] == axis and l0 - 16 <= d["line"] <= l1 + 16 and a0 - 1 <= d["a"] and d["b"] <= a1 + 1:
                    # v65: on this room's own face only (the next room's wall carries the other), lapping 0.8 into the opening
                    o.item(d["id"], *DOOR_NAMES.get(d["id"], (d["id"], r["room"])), kind="door", src=door_src(d["id"]), data=door_data(d["id"]), axis=axis)
                    for zf in ((l0 - 1.2,) if out_dir > 0 else (l1,)):
                        put = (lambda xa, ya, xb, yb: o.box("upvc", xa, ya, zf, xb, yb, zf + 1.2)) if axis == "x" else (lambda xa, ya, xb, yb: o.box("upvc", zf, ya, xa, zf + 1.2, yb, xb))
                        put(d["a"] - 6, y0, d["a"] + 0.8, y0 + D.DOOR_H + 6); put(d["b"] - 0.8, y0, d["b"] + 6, y0 + D.DOOR_H + 6)
                        put(d["a"] - 6, y0 + D.DOOR_H - 0.8, d["b"] + 6, y0 + D.DOOR_H + 6)
                        # v72 (B4): a torus profile: a raised round by the opening, 3 wide, 0.8 proud (E: a 69 × 18 torus architrave)
                        r0, r1 = (zf - 0.75, zf) if out_dir > 0 else (zf + 1.2, zf + 1.95)   # (its face 0.05 off any wall's end)
                        rid = (lambda xa, ya, xb, yb: o.box("upvc", xa, ya, r0, xb, yb, r1)) if axis == "x" else (lambda xa, ya, xb, yb: o.box("upvc", r0, ya, xa, r1, yb, xb))
                        rid(d["a"] - 3.2, y0, d["a"] - 0.2, y0 + D.DOOR_H + 2.8); rid(d["b"] + 0.2, y0, d["b"] + 3.2, y0 + D.DOOR_H + 2.8)
                        rid(d["a"] - 0.2, y0 + D.DOOR_H - 0.2, d["b"] + 0.2, y0 + D.DOOR_H + 2.8)


def _covers(spans, a0, a1):
    """Whether the spans cover a0..a1 (to 1 cm)."""
    at = a0
    for s0, s1 in sorted(spans):
        if s0 > at + 1:
            return False
        at = max(at, s1)
    return at >= a1 - 1


def q_is_living(gaps):
    return any(q["id"] == "living" for _, q in gaps)


def _on_outline(fp, axis, line, a0, a1):
    """Does this edge lie along the outline (an outside wall)?"""
    for (xa, za), (xb, zb) in zip(fp, fp[1:] + fp[:1]):
        if axis == "x" and abs(za - zb) < 0.1 and abs(za - line) < 3 and min(xa, xb) - 3 <= a0 and a1 <= max(xa, xb) + 3:
            return True
        if axis == "z" and abs(xa - xb) < 0.1 and abs(xa - line) < 3 and min(za, zb) - 3 <= a0 and a1 <= max(za, zb) + 3:
            return True
    return False


def _split_dormer(floor, axis, a0, a1):
    if floor != "first" or axis != "x":
        return [(a0, a1)]
    cuts = sorted({a0, a1, *[c for c in DM["x"] if a0 < c < a1]})
    return list(zip(cuts, cuts[1:]))


def _wall_top(axis, seg, l0, l1):
    if axis == "x":
        return headroom(seg[0], seg[1], min(l0, l1))
    return min(headroom(l0, l1, seg[0]), headroom(l0, l1, seg[1]))


def outer_walls(o, floor):
    """The outside walls: brick outside (18), plaster inside (10); the windows and doors cut through and filled."""
    y0 = FLOOR_Y[floor] - (15 if floor == "lower" else SLAB)
    fp = footprint(floor)
    area = sum(xa * zb - xb * za for (xa, za), (xb, zb) in zip(fp, fp[1:] + fp[:1]))
    ops = [op for op in D.OPENINGS if op["floor"] == floor and not op.get("dormer")]
    n = len(fp)

    def layers(i):                                               # an edge's (outer thickness, plaster's gap + thickness)
        (xa, za), (xb, zb) = fp[i % n], fp[(i + 1) % n]
        if abs(za - zb) < 0.1:
            return T_OUT, (1.0 if floor == "ground" and abs(za - BACK) < 1 else 0.0) + 10
        party = abs(xa - WIDTH) < 1
        return (D.WALLS["party"] if party else T_OUT), (1.0 if floor == "ground" else 0.0) + (2 if party else 10)
    for i in range(n):
        (xa, za), (xb, zb) = fp[i], fp[(i + 1) % n]
        prev, nxt = fp[i - 1], fp[(i + 2) % n]
        conv = lambda p, q, r: ((q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0])) * area > 0
        c0, c1 = conv(prev, fp[i], fp[(i + 1) % n]), conv(fp[i], fp[(i + 1) % n], nxt)
        # v65: the corners without two faces in one plane (the client saw white strips flicker in the brick): the walls along x take the
        # outside corner whole (to the end wall's own thickness), the end walls only reach past their plaster; plaster only to plaster
        x_run = abs(za - zb) < 0.1
        nb0, nb1 = layers(i - 1), layers(i + 1)
        e0 = (nb0[0] if x_run else layers(i - 1)[1]) if c0 else 0
        e1 = (nb1[0] if x_run else layers(i + 1)[1]) if c1 else 0
        p0 = nb0[1] if (x_run and c0) else 0
        p1 = nb1[1] if (x_run and c1) else 0
        if abs(za - zb) < 0.1:                                   # runs along x
            axis, line = "x", za
            side = "n" if abs(line - BACK) < 1 else "s"
            out = -1 if side == "n" else 1
            if abs(line - BACK) > 1 and abs(line - FRONT) > 1:   # the lower floor's step (under the hall): earth on its far side
                out = 1
            lo, hi = (xa, xb) if xa < xb else (xb, xa)
            ea, eb = (e0, e1) if xa < xb else (e1, e0)
            pa, pb = (p0, p1) if xa < xb else (p1, p0)
            a0, a1 = lo - ea, hi + eb
        else:
            axis, line = "z", xa
            side = "e" if abs(line) < 1 else "w"
            out = -1 if side == "e" else 1
            lo, hi = (za, zb) if za < zb else (zb, za)
            ea, eb = (e0, e1) if za < zb else (e1, e0)
            pa, pb = 0, 0
            a0, a1 = lo - ea, hi + eb
        t_out = D.WALLS["party"] if side == "w" and abs(line - WIDTH) < 1 else T_OUT
        top = _outer_top(floor, axis, side)
        holes = []
        for op in ops:
            if op["side"] == side and axis == "x" and abs(line - (BACK if side == "n" else FRONT)) < 1:
                holes.append((op["x"][0], op["x"][1], FLOOR_Y[floor] + op["sill"], FLOOR_Y[floor] + op["head"]))
        living = floor == "ground" and (side == "n" or (axis == "z" and lo < 38))
        gap = 1.0 if living else 0.0                        # clear of the measured room's own wall faces
        inner = (line + out * gap, line + out * (gap + 10))
        brick = (line + out * (gap + 10), line + out * t_out)
        if side == "w" and t_out < T_OUT:                    # the party wall: plaster 2 on our side, the rest shared
            inner, brick = (line + out * gap, line + out * (gap + 2)), (line + out * (gap + 2), line + out * t_out)
        if not living:
            wall(o, "paint", axis, min(inner), max(inner), lo - pa, hi + pb, y0, top, holes)
        elif axis == "z":                                    # v66: past the living room (it draws its own), the hall's and the garage's walls plastered
            wall(o, "paint", axis, min(inner), max(inner), 38.0, hi + pb, y0, top, holes)
        wall(o, "party" if side == "w" else "brick", axis, min(brick), max(brick), a0, a1, y0, top, holes)
        o.end()
        for op in ops:
            if op.get("skip") and op["side"] == side and axis == "x" and abs(line - BACK) < 1:
                o.item(op["id"], *WINDOW_NAMES.get(op["id"], (op["id"], "")), kind="window" if op["kind"] == "window" else "door", src=op["src"], data=("OPENINGS", op["id"]), axis="x")
                living_window(o, op, line + out * t_out, FLOOR_Y[floor])
            if op["side"] == side and axis == "x" and not op.get("skip") and abs(line - (BACK if side == "n" else FRONT)) < 1:
                face = line + out * t_out
                yb = FLOOR_Y[floor] + op["sill"]; yt = FLOOR_Y[floor] + op["head"]
                o.item(op["id"], *WINDOW_NAMES.get(op["id"], (op["id"], "")), kind="window" if op["kind"] == "window" else "door", src=op["src"], data=("OPENINGS", op["id"]), axis="x")
                window(o, side, op["x"][0], op["x"][1], yb, yt, op["design"], face)
                if op["design"] not in ("porch", "garage", "front"):   # v66: the reveal plastered inside (it showed brick), a window board
                    zfr = face - out * 11                                # the frame's inner plane
                    za_, zb_ = sorted((line, zfr))
                    x0_, x1_ = op["x"]
                    o.box("paint", x0_, yb, za_, x0_ + 1.5, yt, zb_); o.box("paint", x1_ - 1.5, yb, za_, x1_, yt, zb_)
                    o.box("paint", x0_ + 1.5, yt - 1.5, za_, x1_ - 1.5, yt, zb_)
                    if op["kind"] == "window":
                        zb0, zb1 = sorted((line - out * 3, zfr))
                        o.box("sill_board", x0_ - 3, yb, zb0, x1_ + 3, yb + 2, zb1)
                if op["kind"] == "window":                       # the sill, proud of the wall
                    o.box("upvc", op["x"][0] - 4, yb - 4, face - out * 6, op["x"][1] + 4, yb + 0.6, face + out * 4)
                _door_leaf(o, op, side, face, yb, yt)


def living_window(o, op, face, y):
    """The living room's window as seen from the garden (the room draws its own inside, which the cutaway takes away from out here):
    its measured opening, the design read off the back photo (geometry.WINDOW_DESIGN: three sections, top lights, Georgian bars), on
    the outside face, clear of the room's own frame behind it."""
    import importlib.util, pathlib
    sp = importlib.util.spec_from_file_location("geometry", pathlib.Path(__file__).resolve().parents[1] / "media-wall/src/geometry.py")
    G = importlib.util.module_from_spec(sp); sp.loader.exec_module(G)
    WD = G.WINDOW_DESIGN
    x0, x1 = op["x"]; y0, y1 = y + op["sill"], y + op["head"]
    za, zb = face + 0.5, face + 2.0
    W = "upvc"; fr = WD["frame"]; ww, wh = x1 - x0, y1 - y0; ty = y0 + WD["top"] * wh
    o.box("glass", x0, y0, za + 0.6, x1, y1, za + 0.9)
    for xa, ya, xb, yb in ((x0, y0, x0 + fr, y1), (x1 - fr, y0, x1, y1), (x0, y0, x1, y0 + fr), (x0, y1 - fr, x1, y1), (x0, ty - WD["transom"] / 2, x1, ty + WD["transom"] / 2)):
        o.box(W, xa, ya, za, xb, yb, zb)
    sx, secs = x0, []
    for f in WD["sections"]:
        secs.append((sx, sx + f * ww)); sx += f * ww
    for _, b in secs[:-1]:
        o.box(W, b - WD["mullion"] / 2, y0, za, b + WD["mullion"] / 2, y1, zb)
    for i, (a, b) in enumerate(secs):
        n = WD["cols"][i]
        for k in range(1, n):
            xm = a + (b - a) * k / n; o.box(W, xm - WD["bar"] / 2, y0 + fr, za, xm + WD["bar"] / 2, ty, za + 1.2)
        for r in range(1, WD["rows"]):
            ym = y0 + fr + (ty - y0 - fr) * r / WD["rows"]; o.box(W, a, ym - WD["bar"] / 2, za, b, ym + WD["bar"] / 2, za + 1.2)
    o.box(W, x0 - 4, y0 - 4, face - 4, x1 + 4, y0 + 0.6, face + 4)


def _outer_top(floor, axis, side):
    if floor == "lower":
        return FLOOR_Y["ground"] - SLAB
    if floor == "ground":
        return FLOOR_Y["first"] - SLAB
    return {"n": ROOF_B, "s": ROOF_E}.get(side, FLOOR_Y["first"])   # the gables are prisms (roof())


def _door_leaf(o, op, side, face, yb, yt):
    s = 1 if side == "s" else -1
    z = face - s * 9
    x0, x1 = op["x"]
    if op["design"] == "front":                                       # white, two small panes high up
        o.box("upvc", x0 + 6, yb, z, x1 - 6, yt - 6, z - s * 5)
        for xa in (x0 + 18, (x0 + x1) / 2 + 4):
            o.box("glass", xa, yt - 50, z + s * 0.5, xa + (x1 - x0) / 2 - 22, yt - 22, z + s * 1.5)
        o.box("brass", x1 - 18, yb + 98, z + s * 1, x1 - 14, yb + 112, z + s * 3)
    elif op["design"] == "garage":                                    # the up-and-over door, its ribs
        o.box("upvc", x0 + 4, yb, z, x1 - 4, yt - 4, z - s * 3)
        for k in range(1, 8):
            yy = yb + (yt - yb) * k / 8; o.box("rib", x0 + 4, yy - 0.6, z + s * 0.5, x1 - 4, yy + 0.6, z + s * 1.2)


def _minus(r, h):
    """A rectangle (x0, x1, z0, z1) less a hole: up to four pieces."""
    if not h or h[0] >= r[1] or h[1] <= r[0] or h[2] >= r[3] or h[3] <= r[2]:
        return [r]
    x0, x1, z0, z1 = r; hx0, hx1, hz0, hz1 = max(h[0], x0), min(h[1], x1), max(h[2], z0), min(h[3], z1)
    out = [(x0, x1, z0, hz0), (x0, x1, hz1, z1), (x0, hx0, hz0, hz1), (hx1, x1, hz0, hz1)]
    return [p for p in out if p[1] - p[0] > 0.2 and p[3] - p[2] > 0.2]


def _geometry():
    import importlib.util, pathlib
    sp = importlib.util.spec_from_file_location("geometry", pathlib.Path(__file__).resolve().parents[1] / "media-wall/src/geometry.py")
    G = importlib.util.module_from_spec(sp); sp.loader.exec_module(G)
    return G


Gm = _geometry()                                                   # the measured living room's numbers (its door, its flight)


def floors_and_fittings(o, floor, rs):
    y = FLOOR_Y[floor]
    for r in rs:
        if r["id"] in ("living",) or r["room"] in VOID:
            continue
        yy = D.LEVELS["garage"] if r["id"] == "garage" else y
        bot = yy - SLAB if floor != "first" else y - SLAB + 1          # clear of the living room's ceiling
        well = None
        if floor == "ground":                                          # v65: open over the lower flight (its top tread showed through the hall's carpet)
            st = stair(); well = (st["x0"], st["x1"], 38.0, st["z1"])
        for x0, x1, z0, z1 in _minus((r["x0"] - 5, r["x1"] + 5, r["z0"] - 5, r["z1"] + 5), well):
            o.box("slab", x0, bot, z0, x1, yy - 1.5, z1)
        for x0, x1, z0, z1 in _minus((r["x0"], r["x1"], r["z0"], r["z1"]), well):
            o.box(FLOOR_FINISH.get(r["id"], "carpet"), x0, yy - 1.5, z0, x1, yy, z1)
    if floor == "ground":                                              # the hall over the lower flight: a void, a low wall round it
        st = stair()
        # v66: the living room's flight runs on into the hall (its stand-in landing to z 319): boxed in from the hall, full height (the hall
        # saw its mint side), clear of the living room's door (to x 398.5); v67 (the photos): in the box's end, the door down to the lower
        # stairs, a grille over it
        z0f = Gm.ALC_D - Gm.STAIR_D + 6
        zl1 = z0f + (Gm.STAIR_N - 1) * Gm.STAIR_GOING + Gm.LANDING_D
        xs = Gm.STAIR_X[0] - 2.2
        o.box("paint", xs, y - SLAB, 38.0, Gm.STAIR_X[0] - 0.4, y + CEIL, zl1)
        dx0, dx1 = D.HALL["door"]
        wall(o, "paint", "x", zl1, zl1 + 1.8, xs, WIDTH, y - SLAB, y + CEIL, [(dx0, dx1, y - SLAB, y + D.DOOR_H)])
        if D.HALL.get("door_leaf", True):   # V1.12, the client's photos: the frame stands empty (its hinges' marks only)
            o.box("door_white", dx0 + 0.8, y + 0.5, zl1 + 0.2, dx1 - 0.8, y + D.DOOR_H - 0.8, zl1 + 1.6)
            o.box("chrome", dx0 + 4, y + 100, zl1 + 1.6, dx0 + 13, y + 102, zl1 + 5)
        for xa, xb, ya, yb in ((dx0 - 6, dx0 + 0.8, y, y + D.DOOR_H + 6), (dx1 - 0.8, dx1 + 6, y, y + D.DOOR_H + 6), (dx0 - 6, dx1 + 6, y + D.DOOR_H - 0.8, y + D.DOOR_H + 6)):
            o.box("upvc", xa, ya, zl1 + 1.8, xb, yb, zl1 + 3.0)
        o.box("grille", dx0 + 8, y + D.DOOR_H + 9, zl1 + 1.8, dx1 - 8, y + D.DOOR_H + 27, zl1 + 2.4)
    cx, cz, *_ = cal(floor)
    for fid, (a, b, c, d), h in H.PLANS[floor].get("fixtures", []):
        x0, x1 = sorted((cx(c), cx(a))); z0, z1 = sorted((cz(b), cz(d)))
        o.box("fitting", x0 + 2, y, z0 + 2, x1 - 2, y + h, z1 - 2)
    for s in solids(floor):
        o.box("paint", s["x0"], y, s["z0"], s["x1"], min(y + CEIL, headroom(s["x0"], s["x1"], s["z0"])) if floor == "first" else y + CEIL, s["z1"])


def stair():
    cx, cz, *_ = cal("lower")
    S = D.LOWER_STAIR
    x0, x1 = S.get("x") or sorted((cx(S["x_px"][1]), cx(S["x_px"][0])))   # v66: fitted to the living room's flight
    z0 = cz(S["z0_px"])
    return dict(x0=round(x0, 1), x1=round(x1, 1), z0=round(z0, 1), z1=round(z0 + S["n"] * S["going"], 1), n=S["n"], rise=S["rise"], going=S["going"])


def stairs(o):
    st = stair(); y0 = FLOOR_Y["lower"]
    for i in range(st["n"]):
        za = st["z0"] + i * st["going"]; top = y0 + (i + 1) * st["rise"]
        o.box("carpet_grey", st["x0"] + 1, top - st["rise"] - 14, za, st["x1"] - 1, top, za + st["going"] + 2)   # v67: grey carpet (the photo)
    yl = lambda z: y0 + (z - st["z0"]) / st["going"] * st["rise"]                        # v67: the handrail on the left going down
    za, zb = st["z0"] + st["going"], st["z1"] - st["going"]
    o.prism("upvc", "x", WIDTH - 7, WIDTH - 2, [(za, yl(za) + 88), (zb, yl(zb) + 88), (zb, yl(zb) + 96), (za, yl(za) + 96)])


def first_floor_slopes(o):
    """Under the back slope, outside the dormer: the closed-off eaves (the client's black marks: bedroom 2's "dormer roof", the
    bathroom's corner) as wedges, the slope's underside above them on to the ceiling."""
    y = FLOOR_Y["first"]
    zc = ZC_BACK                                                   # where the slope reaches the ceiling
    # v62, the client's photo of bedroom 2: the block is the closed-off corner by the window (to z -166, 98 out from the side wall);
    # past it the slope is open, a sloping ceiling over the chest, the airer and the bed's head; the dormer's side drops to it
    bz, bx = D.BED2["block_z"], D.BED2["block_x"]
    o.prism("eaves", "x", 0.0, bx, [(BACK, y), (BACK, under_back(BACK) - 2), (bz, under_back(bz) - 2), (bz, y)])   # just under the roof (no flicker)
    o.prism("ceiling", "x", 0.0, DM["x"][0] + DM["t"], [(bz, under_back(bz) - 3), (zc, under_back(zc) - 3), (zc, under_back(zc) + 1), (bz, under_back(bz) + 1)])   # v66: on under the cheek (its underside showed as a dark line)   # v65: up into the roof (no dark line at the cheek)
    # v65: no plaster at the dormer's side here (it lay in the cheek's outside face and showed white from the garden; the cheek's own
    # plaster faces the room)
    # v65, the client's photos of the bathroom: the low corner is a tiled box (to the slim cabinet), the slope open over the vanity.
    # v68, the client: "the wall above the sink doesnt incline across the whole wall. it goes up to around the sink area then changes angles
    # to be more straight": the box flat-topped at its photo's height, the slope from its top edge at the roof's pitch to the ceiling (by
    # the sink), then the wall straight up to the door end (the room is full height there)
    # v81, the client: "a large incline wall that covers most the sink area ... it actually cuts off and becomes straight again"; v82, their
    # photo from the door: a short straight rise over the tiles, the slope at the roof's pitch to the beam at the dormer's front, then
    # straight up (the beam's face, upper_ceilings) to the ceiling by the door
    B = D.BATH; xa, xb, zb_, hb = B["strip_x"], WIDTH, B["box_z"], B["slope_y0"]
    zr = RO["n"] + (y + hb + 2 - ROOF_B) / KB                      # v69: where the roof's underside is the box's height
    box_ = [(BACK, y), (BACK, min(y + hb, under_back(BACK) - 2))] + ([(zr, y + hb)] if zr > BACK else []) + [(zb_, y + hb), (zb_, y)]
    o.prism("eaves", "x", xa, xb, box_)                            # v69: under the roof (the steeper slope showed it outside)
    yb_ = y + B["beam_y"]
    o.prism("ceiling", "x", xa, xb, [(zb_, y + hb), (DORMER_BACK, yb_), (DORMER_BACK, yb_ + 2), (zb_, y + hb + 2)])   # to the beam's underside


def roof(o):
    """The tiled roof: the long back slope (over the living room's window), the front slope, the gable at the east end, the party wall's
    top at the west, the flat-roofed dormer over the bathroom and bedroom 2 (the client), fascias and gutters."""
    t = D.ROOF["t"] / math.cos(math.radians(D.ROOF["pitch"]))      # the tiles' depth, upright, on the front slope
    tb = D.ROOF["t"] / math.cos(math.atan(KB))                     # v68: and on the steeper back slope
    ov = D.ROOF["overhang"]
    xe, xw = RO["e"] - D.ROOF["verge"], RO["w"]
    zb, zf = RO["n"] - ov, RO["s"] + ov
    back = lambda z0, z1: [(z0, under_back(z0)), (z1, under_back(z1)), (z1, under_back(z1) + tb), (z0, under_back(z0) + tb)]
    o.prism("tile", "x", xe, DM["x"][0], back(zb, RIDGE_Z))
    o.prism("tile", "x", DM["x"][1], xw, back(zb, RIDGE_Z))
    o.prism("tile", "x", DM["x"][0], DM["x"][1], back(zb, DM["face"]))
    o.prism("tile", "x", DM["x"][0], DM["x"][1], back(DORMER_BACK, RIDGE_Z))
    o.prism("tile", "x", xe, xw, [(RIDGE_Z, RIDGE_Y), (zf, under_front(zf)), (zf, under_front(zf) + t), (RIDGE_Z, RIDGE_Y + t)])
    o.box("ridge", xe, RIDGE_Y + t - 4, RIDGE_Z - 9, xw, RIDGE_Y + t + 6, RIDGE_Z + 9)
    y1 = FLOOR_Y["first"]                                          # v65: over the end walls, inside the back and front walls (no shared faces)
    gable = [(BACK - 10, y1), (BACK - 10, ROOF_B), (RO["n"], ROOF_B), (RIDGE_Z, RIDGE_Y), (RO["s"], ROOF_E), (FRONT + 10, ROOF_E), (FRONT + 10, y1)]
    o.prism("brick", "x", RO["e"], RO["e"] + T_OUT - 10, gable)
    o.prism("paint", "x", RO["e"] + T_OUT - 10, 0.0, gable)
    o.prism("paint", "x", WIDTH, WIDTH + 2, gable)                 # v61: plaster on our side (the office's wall showed brick)
    o.prism("party", "x", WIDTH + 2, RO["w"], gable)
    for z, y, s in ((zb, under_back(zb), -1), (zf, under_front(zf), 1)):         # fascias and gutters
        o.box("upvc", xe, y - 18, z, xw, y + 2, z + s * 2.5)
        o.box("upvc", xe, y - 16, z + s * 2.5, xw, y - 6, z + s * 12)
    # the dormer: its face with the two windows (tile-hung round them), its cheeks, the flat roof and its white fascia
    yf, x0, x1 = FLOOR_Y["first"], DM["x"][0], DM["x"][1]
    zo, zi = DM["face"], DM["face"] + DM["t"]
    base = under_back(zo)
    ops = [op for op in D.OPENINGS if op.get("dormer")]
    holes = [(op["x"][0], op["x"][1], yf + op["sill"], yf + op["head"]) for op in ops]
    wall(o, "hung", "x", zo, zi - 3, x0, x1, base, DM["top"], holes)
    wall(o, "paint", "x", zi - 3, zi, x0, x1, base, DM["top"], holes)   # v62: plaster inside (the room showed the hung tiles)
    o.box("paint", x0, yf - SLAB, BACK, x1, base + 2, zi)            # v62: under the dormer's face, down to the floor (no gap to the roof)
    for op in ops:
        o.item(op["id"], *WINDOW_NAMES.get(op["id"], (op["id"], "")), kind="window", src=op["src"], data=("OPENINGS", op["id"]), axis="x")
        window(o, "n", op["x"][0], op["x"][1], yf + op["sill"], yf + op["head"], op["design"], zo)
        o.box("upvc", op["x"][0] - 3, yf + op["sill"] - 4, zo - 5, op["x"][1] + 3, yf + op["sill"] + 0.6, zo + 4)
    o.end()
    for xa, xb in ((x0, x0 + DM["t"]), (x1 - DM["t"], x1)):
        o.prism("hung", "x", xa, xb, [(zo, base), (zo, DM["top"]), (DORMER_BACK, DM["top"])])
        xi = xb if xa == x0 else xa - 1                              # v62: plaster on the side the room sees
        if xa == x0:
            o.prism("paint", "x", xi, xi + 1, [(zi, under_back(zi)), (zi, DM["top"] - 0.5), (DORMER_BACK, DM["top"] - 0.5)])   # v65: inside only
        else:                                                      # v69, the client: by the toilet the wall goes up from the tiled box
            B = D.BATH; hb = yf + B["box_h"]                         # straight; over the box's front it slopes first (v82: to the beam)
            o.prism("paint", "x", xi, xi + 1, [(zi, hb), (zi, yf + B["beam_y"]), (DORMER_BACK, yf + B["beam_y"]), (B["box_z"], yf + B["slope_y0"]), (B["box_z"], hb)])
    # v69, the client: "improve the roof top there": the flat roof falls 4 to the front (GRP on a deck), a slim white fascia with a grey
    # drip trim along its top, the white soffit under it, a gutter along the front into a downpipe onto the main roof, lead where the
    # flat roof meets the slope
    tp, rt = DM["top"], DM["roof_t"]
    o.prism("felt", "x", x0 - 4.5, x1 + 4.5, [(zo - 8, tp), (DORMER_BACK - 1, tp), (DORMER_BACK - 1, tp + rt), (zo - 8, tp + rt - 4)])
    o.box("upvc", x0 - 6, tp - 4, zo - 10, x1 + 6, tp + rt - 4, zo - 8)                 # the fascia, 15 high
    o.box("upvc", x0 - 6, tp - 4, zo - 8, x1 + 6, tp - 3, zo)                            # the soffit back to the face
    o.box("trim", x0 - 7, tp + rt - 4, zo - 11, x1 + 7, tp + rt - 1, zo - 6)            # the drip trim
    for xa in (x0 - 6, x1 + 3):
        o.box("upvc", xa, tp - 4, zo - 8, xa + 3, tp + rt - 4 + 4 * (zo - 8 - min(zo - 8, DORMER_BACK - 0.5)) / (DORMER_BACK - zo), DORMER_BACK - 0.5)
        o.prism("trim", "x", xa - 1, xa + 4, [(zo - 8, tp + rt - 4), (DORMER_BACK - 0.5, tp + rt), (DORMER_BACK - 0.5, tp + rt + 3), (zo - 8, tp + rt - 1)])
    o.box("gutter", x0 - 6, tp - 4, zo - 20, x1 + 6, tp + 4, zo - 10.5)                  # the gutter, its downpipe at the bathroom's end
    zp = zo - 16
    o.box("gutter", x1 - 2, under_back(zp) + D.ROOF["t"] / math.cos(math.atan(KB)) - 2, zp - 3, x1 + 4, tp - 4, zp + 3)
    o.prism("lead", "x", x0 - 4.5, x1 + 4.5, [(DORMER_BACK - 1, tp + rt), (DORMER_BACK - 1, tp + rt + 1.2),
            (DORMER_BACK + 20, under_back(DORMER_BACK + 20) + D.ROOF["t"] / math.cos(math.atan(KB)) + 1.2), (DORMER_BACK + 20, under_back(DORMER_BACK + 20) + D.ROOF["t"] / math.cos(math.atan(KB)))])
    # the downpipes: the back's at the west corner (the photo), the front's on the party line
    o.box("upvc", WIDTH - 12, FLOOR_Y["lower"], RO["n"] - 9, WIDTH - 5, under_back(zb) - 6, RO["n"] - 2)
    o.box("upvc", WIDTH + 2, D.LEVELS["drive"], RO["s"] + 2, WIDTH + 9, ROOF_E - 6, RO["s"] + 9)


def porch(o):
    """The front door's surround (the front photo): two pilasters, a white pediment, the red step. v65, the client: "there's a step
    before the front door and 2 cupboards, one left and right, then front door ahead": the open porch, a bin cupboard each side with a
    white door into the porch, the white front door ahead (two small panes high up, as the photo's), the bins inside."""
    op = next(p for p in D.OPENINGS if p["id"] == "front_door")
    x0, x1 = op["x"]; zf = RO["s"]
    for xa in (x0 - 20, x1 + 2):
        o.box("upvc", xa, 0, zf, xa + 18, 222, zf + 16)
    o.box("upvc", x0 - 26, 222, zf, x1 + 26, 238, zf + 22)
    o.prism("upvc", "z", zf, zf + 22, [(x0 - 30, 238), (x1 + 30, 238), ((x0 + x1) / 2, 278)])
    o.box("quarry", x0 - 22, D.LEVELS["drive"] - 1.5, zf, x1 + 22, 0, zf + 34)           # the step (v66: its foot in the lawn, no gap)
    o.box("quarry", x0 + 0.3, -1.5, FRONT - 0.5, x1 - 0.3, 0.4, zf + 0.5)                             # the threshold through the wall
    gar = next(p for p in D.OPENINGS if p["id"] == "garage_door")
    o.box("soldier", gar["x"][0] - 14, gar["head"] + 0.4, zf - 0.5, gar["x"][1] + 14, gar["head"] + 22, zf + 1.2)
    ds = {d["id"]: d for d in doors("ground")}
    for did, side in (("store_w", -1), ("store_e", 1)):                                  # the cupboards' doors, shut, white
        d = ds[did]; x = d["line"]
        o.box("upvc", x - 1.5, 0.5, d["a"] + 1, x + 1.5, D.DOOR_H - 1, d["b"] - 1)
        o.box("chrome", x + side * 1.5, 98, d["a"] + 6, x + side * 4, 101, d["a"] + 14)
    d = ds["hall_porch"]; z = d["line"]                                                  # the front door, ahead
    o.box("upvc", d["a"] + 1, 0.5, z - 2.2, d["b"] - 1, D.DOOR_H - 1, z + 2.2)
    w = d["b"] - d["a"]
    for xa in (d["a"] + 12, d["a"] + w / 2 + 4):
        o.box("glass", xa, D.DOOR_H - 50, z + 2.2, xa + w / 2 - 16, D.DOOR_H - 22, z + 2.8)
    o.box("brass", d["b"] - 14, 98, z + 2.2, d["b"] - 10, 112, z + 4.2)
    o.box("brass", (d["a"] + d["b"]) / 2 - 14, 75, z + 2.2, (d["a"] + d["b"]) / 2 + 14, 79, z + 3.2)   # the letterbox
    P_, rs = D.PORCH, {r["id"]: r for r in rooms("ground")}
    e, wst = rs["front_store_e"], rs["front_store_w"]
    # v69, the client: the garage side's cupboard "houses my electric box and my gas meter": both on its back wall
    Mt = D.METERS; ez = e["z0"] + 0.5
    el, ga = Mt["electric"], Mt["gas"]
    ex0 = e["x0"] + 6
    o.box("fitting", ex0, el["y"], ez, ex0 + el["w"], el["y"] + el["h"], ez + el["d"])                 # the electric meter box
    o.box("glass_dark", ex0 + 8, el["y"] + 30, ez + el["d"], ex0 + 22, el["y"] + 40, ez + el["d"] + 0.3)   # its meter's display
    o.box("steel", ex0 + el["w"] / 2 - 2, 0, ez + 2, ex0 + el["w"] / 2 + 2, el["y"], ez + 6)           # the cable down
    gx0 = e["x0"] + 8
    o.box("fitting", gx0, ga["y"], ez, gx0 + ga["w"], ga["y"] + ga["h"], ez + ga["d"])                 # the gas meter
    o.box("primrose", gx0 + ga["w"] / 2 - 1.2, ga["y"] + ga["h"], ez + 4, gx0 + ga["w"] / 2 + 1.2, el["y"] - 5, ez + 7)   # its pipe
    # the bins: the client's other cupboard is the bin cupboard
    for k in range(2):                                                                    # the left (west) one: recycling boxes, stacked
        bb = P_["box"]; y0_ = 0.5 + k * bb["h"]
        o.box("recycle", wst["x0"] + 2.5, y0_, FRONT - 0.5 - bb["w"], min(wst["x1"] - 0.5, wst["x0"] + 2.5 + bb["d"]), y0_ + bb["h"] - 0.5, FRONT - 0.5)


def _house_shell(o, span, gcol):
    """One house of the terrace in our own coordinates (its inside end wall at x 0, as ours), as a simple solid building: the brick
    cross-section, the roof, the dormer, the porch, every window and door from survey_data.OPENINGS, its front and back gardens.
    span: its outside x range (an end house from its gable, -28; a middle one from the party wall's middle, -15; to the next, 482)."""
    x0, x1 = span
    t = D.ROOF["t"] / math.cos(math.radians(D.ROOF["pitch"]))
    tb = D.ROOF["t"] / math.cos(math.atan(KB))                    # v68: the steeper back slope
    prof = [(RO["n"], D.LEVELS["lawn"] - 15), (RO["n"], ROOF_B), (RIDGE_Z, RIDGE_Y), (RO["s"], ROOF_E), (RO["s"], D.LEVELS["drive"] - 6)]   # v65: into the ground
    zb, zf = RO["n"] - D.ROOF["overhang"], RO["s"] + D.ROOF["overhang"]
    o.prism("brick", "x", x0, x1, prof)
    o.prism("tile", "x", x0, x1, [(zb, under_back(zb)), (RIDGE_Z, RIDGE_Y), (RIDGE_Z, RIDGE_Y + tb), (zb, under_back(zb) + tb)])
    o.prism("tile", "x", x0, x1, [(RIDGE_Z, RIDGE_Y), (zf, under_front(zf)), (zf, under_front(zf) + t), (RIDGE_Z, RIDGE_Y + t)])
    o.box("ridge", x0, RIDGE_Y + t - 4, RIDGE_Z - 9, x1, RIDGE_Y + t + 6, RIDGE_Z + 9)
    for z, y, s in ((zb, under_back(zb), -1), (zf, under_front(zf), 1)):
        o.box("upvc", x0, y - 18, z, x1, y + 2, z + s * 2.5)
    d0, d1 = DM["x"]                                              # the dormer at the back, as ours
    o.box("hung", d0, under_back(DM["face"]), DM["face"], d1, DM["top"], DORMER_BACK - 40)
    o.box("felt", d0 - 6, DM["top"], DM["face"] - 8, d1 + 6, DM["top"] + DM["roof_t"], DORMER_BACK)
    for op in D.OPENINGS:                   # on the face of a solid building: frames just proud, dark panes behind them
        fy = FLOOR_Y[op["floor"]]
        xa, xb, ya, yb = op["x"][0], op["x"][1], fy + op["sill"], fy + op["head"]
        if op.get("dormer"):
            o.box("pane", xa + 1, ya + 1, DM["face"] - 0.6, xb - 1, yb - 1, DM["face"] - 0.2)
            window(o, "n", xa, xb, ya, yb, "casement", DM["face"] - 6)
            continue
        s = -1 if op["side"] == "n" else 1
        face = (RO["n"] if s < 0 else RO["s"]) + s * 6
        pz = face - s * 6
        if op["design"] == "garage":
            o.box(gcol, xa, ya, pz, xb, yb, pz + s * 2)
            for k_ in range(1, 8):
                yy = ya + (yb - ya) * k_ / 8; o.box("rib", xa, yy - 0.6, pz + s * 2, xb, yy + 0.6, pz + s * 2.6)
        elif op["design"] in ("front", "porch"):                     # v65: the open porch as ours: dark inside, the door set back, a step
            dr = D.LEVELS["drive"]
            o.box("porch_in", xa, ya, pz, xb, yb, pz + s * 0.6)
            o.box("upvc", xa + 14, ya, pz + s * 0.6, xb - 14, yb - 8, pz + s * 1.2)
            o.box("upvc", xa - 26, 222, pz, xb + 26, 238, pz + s * 22)
            o.prism("upvc", "z", pz, pz + 22, [(xa - 30, 238), (xb + 30, 238), ((xa + xb) / 2, 278)])
            for xx in (xa - 20, xb + 2):
                o.box("upvc", xx, dr, pz, xx + 18, 222, pz + s * 16)
            o.box("quarry", xa - 22, dr - 5.5, pz + s * 0.3, xb + 22, ya, pz + s * 34)
        else:
            o.box("pane", xa + 1, ya + 1, pz + s * 0.2, xb - 1, yb - 1, pz + s * 0.6)
            window(o, op["side"], xa, xb, ya, yb, "bars" if op["design"] in ("living", "glazed") else op["design"], face)
    gx = (30.0, 270.0)                                            # its drive, front lawn, the pavement and road, its back lawn and fence
    dr = D.LEVELS["drive"]                                         # v65: every layer from one base, side by side (no shared planes)
    o.box("concrete", gx[0], dr - 6, RO["s"], gx[1], dr, RO["s"] + 550)
    o.box("lawn", x0, dr - 6, RO["s"], gx[0], dr - 1, RO["s"] + 550)
    o.box("lawn", gx[1], dr - 6, RO["s"], x1, dr - 1, RO["s"] + 550)
    o.box("earth", x0, -275, RO["s"], x1, dr - 6, RO["s"] + 1250)
    o.box("paving", x0, dr - 6, RO["s"] + 550, x1, dr + 1, RO["s"] + 750)
    o.box("road", x0, dr - 6, RO["s"] + 750, x1, dr - 2, RO["s"] + 1250)
    o.box("lawn", x0, D.LEVELS["lawn"] - 3, RO["n"] - 2500, x1, D.LEVELS["lawn"] - 1, RO["n"])
    o.box("fence", x1 - 2, D.LEVELS["lawn"], RO["n"] - 2500, x1 + 2, D.LEVELS["lawn"] + 180, RO["n"])
    o.box("fence", x0, D.LEVELS["lawn"], RO["n"] - 2504, x1, D.LEVELS["lawn"] + 180, RO["n"] - 2500)   # V1.4: and its far one, 25 m out


def _copy(src, dst, M):
    """src's pieces into dst with x mapped by M (a shift, or a mirror)."""
    for m, lst in src.boxes.items():
        for b in lst:
            xa, xb = sorted((M(b[0]), M(b[3])))
            dst.box(m, xa, b[1], b[2], xb, b[4], b[5])
    for P in src.prisms:
        if P["axis"] == "x":
            a, b = sorted((M(P["a"]), M(P["b"])))
            dst.prism(P["m"], "x", a, b, P["pts"])
        else:
            dst.prism(P["m"], "z", P["a"], P["b"], [(M(u), v) for u, v in P["pts"]])


def street(o):
    """The houses round ours (the photos and the client), simple solid buildings so it sits in its street: the terrace running on to the
    west, as ours (next door's garage blue, then black); v64, the client: "Houses on the right of the alley are just mirrors of the
    design of my house ie garage left door right, living room leads to the left": two mirrored houses past the alley, the first with
    its end wall to the alley. Each with its gardens. Shown only when the client switches Next door on."""
    W = WIDTH + 2 * D.WALLS["party"]
    P = D.WALLS["party"]
    for k, gcol in ((1, "garage_blue"), (2, "garage_black")):           # west: shifted copies
        h = Out(); _house_shell(h, (-P, RO["w"]), gcol)
        dx = RO["w"] + (k - 1) * W + P
        _copy(h, o, lambda x, dx=dx: dx + x)
    ax = -125.0                                                           # the alley's far side (its fence at -121)
    for k, (span, gcol) in enumerate((((-T_OUT, RO["w"]), "garage_white"), ((-P, RO["w"]), "garage_blue"))):
        h = Out(); _house_shell(h, span, gcol)
        base = ax - T_OUT if k == 0 else ax - (RO["w"] + T_OUT) - P - (k - 1) * W   # the first's gable at the alley; the next shares its party wall
        _copy(h, o, lambda x, base=base: base - x)                       # mirrored: its x runs east


def kitchen(o):
    """v60: the kitchen as it is, from the client's photos (survey_data.KITCHEN): the L of units, the appliances, the worktop, the metro
    tiles, the wall units, the sink and tap, the breakfast bar and its chairs, the LED battens."""
    K, y0 = D.KITCHEN, FLOOR_Y["lower"]
    TOP, WT, DEEP, LEG = 90.0, 3.8, 60.0, 12.0
    Y = lambda h: y0 + h
    def piece(kind, run, a, b):
        # the box in house cm for a run: north (along x, at the back wall), east (along z, at x 0), south (along x, at the front wall)
        if run == "north":
            return (a, b, BACK, BACK + DEEP, "+z")
        if run == "east":
            return (0.0, DEEP, a, b, "+x")
        return (a, b, 36.2 - DEEP, 36.2, "-z")
    def front(face, x0, x1, z0, z1, ya, yb, m, inset=0.0):
        # a panel on a unit's front: face says which way it looks
        if face == "+z":
            o.box(m, x0 + inset, ya, z1, x1 - inset, yb, z1 + 1.8)
        elif face == "-z":
            o.box(m, x0 + inset, ya, z0 - 1.8, x1 - inset, yb, z0)
        else:
            o.box(m, x1, ya, z0 + inset, x1 + 1.8, yb, z1 - inset)
    def handle(face, x0, x1, z0, z1, y, along=None):
        c = along if along is not None else ((x0 + x1) / 2 if face != "+x" else (z0 + z1) / 2)
        if face == "+z":
            o.box("black", c - 0.8, y - 5, z1 + 1.8, c + 0.8, y + 5, z1 + 4.5)
        elif face == "-z":
            o.box("black", c - 0.8, y - 5, z0 - 4.5, c + 0.8, y + 5, z0 - 1.8)
        else:
            o.box("black", x1 + 1.8, y - 5, c - 0.8, x1 + 4.5, y + 5, c + 0.8)
    o.item("kitchen.units", "The kitchen units and appliances", "kitchen", src="client's photos + standard sizes (E)", data=("KITCHEN",), measure=False)
    for run in ("north", "east", "south"):
        for kind, a, b in K[run]:
            x0, x1, z0, z1, face = piece(kind, run, a, b)
            if kind in ("fridge", "washer", "dishwasher", "cooker"):
                o.item("kitchen." + kind, {"fridge": "The fridge-freezer", "washer": "The washing machine", "dishwasher": "The dishwasher", "cooker": "The cooker"}[kind], "kitchen", kind="appliance", src="client's photos + E (standard size)", data=("KITCHEN", run), axis="x" if run != "east" else "z")
            else:
                o.item("kitchen.units", "The kitchen units and appliances", "kitchen")
            if kind == "fridge":
                o.box("gloss", x0 + 1, Y(1), z0 + 1, x1 - 1, Y(180), z1 - 1)
                o.box("gap", x0 + 1, Y(118), z0 - 0.3, x1 - 1, Y(119), z1 + 0.3) if face != "+x" else None
                front(face, x0, x1, z0, z1, Y(130), Y(152), "steel_dark", inset=16)        # its water dispenser
                continue
            if kind in ("washer", "dishwasher", "cooker"):
                col = {"washer": "black_app", "dishwasher": "gloss", "cooker": "black_app"}[kind]
                o.box(col, x0 + 0.5, Y(0), z0 + 1, x1 - 0.5, Y(85 if kind != "cooker" else 90.5), z1 - 1)   # v65: the hob just proud of the worktop
                if kind == "washer":
                    o.prism("glass_dark", "z", z1 - 1, z1 + 0.5, [(x0 + 30 + 17 * math.cos(i * math.pi / 4), Y(42) + 17 * math.sin(i * math.pi / 4)) for i in range(8)])
                if kind == "cooker":
                    front(face, x0, x1, z0, z1, Y(18), Y(62), "glass_dark", inset=6)
                    for i, (u, v) in enumerate(((0.3, 0.3), (0.7, 0.3), (0.3, 0.7), (0.7, 0.7))):
                        cx_, cz_ = x0 + (x1 - x0) * u, z0 + (z1 - z0) * v
                        o.box("ring", cx_ - 8, Y(90.5), cz_ - 8, cx_ + 8, Y(91.3), cz_ + 8)
                    front(face, x0, x1, z0, z1, Y(72), Y(84), "black", inset=3)
                if kind == "dishwasher":
                    front(face, x0, x1, z0, z1, Y(78), Y(84), "gap", inset=3)
                continue
            # a unit: carcass on legs, a drawer over a door (or two doors), black T-handles
            o.box("gloss", x0 + 0.5, Y(LEG), z0 + 1, x1 - 0.5, Y(TOP - WT), z1 - 1)
            for lx, lz in ((x0 + 5, z0 + 5), (x1 - 5, z0 + 5), (x0 + 5, z1 - 5), (x1 - 5, z1 - 5)):
                o.box("black", lx - 1.5, Y(0), lz - 1.5, lx + 1.5, Y(LEG), lz + 1.5)
            if kind == "corner":
                continue
            front(face, x0, x1, z0, z1, Y(71), Y(72), "gap", inset=0.5)
            handle(face, x0, x1, z0, z1, Y(79))
            handle(face, x0, x1, z0, z1, Y(62))
    # the worktops (black speckled) and the sink
    o.item("kitchen.worktop", "The worktops and sink", "kitchen", src="client's photos + E", data=("KITCHEN", "sink"), axis="x")
    o.box("worktop", 0, Y(TOP - WT), BACK, max(b for _, _, b in K["north"]), Y(TOP), BACK + DEEP + 2)   # v68: to the run's end
    o.box("worktop", 0, Y(TOP - WT), BACK, DEEP + 2, Y(TOP), 36.2)
    o.box("worktop", 0, Y(TOP - WT), 36.2 - DEEP - 2, 135, Y(TOP), 36.2)
    s0, s1 = K["sink"]
    o.box("steel", s0, Y(TOP), BACK + 8, s1, Y(TOP + 0.5), BACK + 50)
    o.box("steel_dark", s0 + 4, Y(TOP + 0.2), BACK + 12, s1 - 4, Y(TOP + 0.6), BACK + 46)
    o.box("steel", (s0 + s1) / 2 - 1.5, Y(TOP), BACK + 4, (s0 + s1) / 2 + 1.5, Y(TOP + 38), BACK + 7)          # the spring tap
    o.box("steel", (s0 + s1) / 2 - 1.5, Y(TOP + 35), BACK + 4, (s0 + s1) / 2 + 1.5, Y(TOP + 38), BACK + 26)
    # the metro tiles: worktop to the wall units on the east and front walls, to the ceiling behind the cooker
    o.item("kitchen.tiles", "The metro tiles", "kitchen", kind="finish", src="client's photos", measure=False)
    o.box("metro", 0, Y(TOP), BACK + DEEP, 0.8, Y(145), 36.2)
    t0, t1 = K["tiles_to_ceiling"]
    o.box("metro", 0, Y(145), t0, 0.8, Y(CEIL), t1)
    o.box("metro", 0, Y(TOP), 35.4, 135, Y(145), 36.2)
    # the wall units, 30 deep, gloss doors with handles near the bottom
    o.item("kitchen.wall_units", "The wall cupboards", "kitchen", src="client (counted) + E", data=("KITCHEN", "wall_units"), measure=False)
    for a, b, n in K["wall_units"]["east"]:                         # v73: each run's doors as the client counts them
        o.box("gloss", 0, Y(145), a, 30, Y(215), b); o.box("gloss", 0, Y(215), a, 32, Y(220), b)
        for i in range(1, n):
            zz = a + (b - a) * i / n; o.box("gap", 30, Y(146), zz - 0.3, 30.3, Y(214), zz + 0.3)
        for i in range(n):
            handle("+x", 0, 30, a, b, Y(152), along=a + (b - a) * (i + 0.5) / n + (b - a) / n * 0.3)
    for a, b, n in K["wall_units"]["south"]:
        o.box("gloss", a, Y(145), 36.2 - 30, b, Y(215), 36.2); o.box("gloss", a, Y(215), 36.2 - 32, b, Y(220), 36.2)
        for i in range(1, n):
            xx = a + (b - a) * i / n; o.box("gap", xx - 0.3, Y(146), 36.2 - 30.3, xx + 0.3, Y(214), 36.2 - 30)
        for i in range(n):
            handle("-z", a, b, 6.2, 36.2, Y(152), along=a + (b - a) * (i + 0.5) / n + (b - a) / n * 0.3)
    p_ = K["pipes"]                                                  # v73: the pipes up the back corner, in the cupboards' 5 cm
    for i, dx in enumerate((0.0, 2.2)):
        o.box("pc_white", p_["x"][0] + dx, Y(TOP), p_["z"][0] + i * 1.2, p_["x"][0] + dx + 1.6, Y(CEIL), p_["z"][0] + i * 1.2 + 1.6)
    a, b = K["wall_units"]["over_fridge"]
    o.box("gloss", a, Y(185), 36.2 - 32, b, Y(220), 36.2)
    # the breakfast bar on chrome legs, two black chairs
    o.item("kitchen.bar", "The breakfast bar", "kitchen", src="client v73 + E", data=("KITCHEN", "bar"), axis="z")
    B = K["bar"]
    o.box("worktop", B["x"][0], Y(B["h"] - 3.8), B["z"][0], B["x"][1], Y(B["h"]), B["z"][1])
    for lx, lz in ((B["x"][0] + 8, B["z"][0] + 8), (B["x"][0] + 8, B["z"][1] - 8)):        # v73: fixed to the wall, legs on the room side
        o.box("chrome", lx - 1.5, Y(0), lz - 1.5, lx + 1.5, Y(B["h"] - 3.8), lz + 1.5)
    o.box("chrome", B["x"][1] - 3, Y(B["h"] - 8), B["z"][0] + 10, B["x"][1], Y(B["h"] - 3.8), B["z"][1] - 10)   # the batten on the wall
    o.item("kitchen.boiler", "The boiler", "kitchen", kind="fitting", src="client v73 + E (combi)", data=("KITCHEN", "boiler"), axis="z")
    bo = K["boiler"]; xw = B["x"][1]                                                    # v73: the boiler over the bar, by the door
    o.box("fitting", xw - bo["d"], Y(bo["y"][0]), bo["z"][0], xw, Y(bo["y"][1]), bo["z"][1])
    o.box("glass_dark", xw - bo["d"] - 0.3, Y(bo["y"][0] + 40), (bo["z"][0] + bo["z"][1]) / 2 - 8, xw - bo["d"], Y(bo["y"][0] + 48), (bo["z"][0] + bo["z"][1]) / 2 + 8)
    for dz in (-12, -4, 4, 12):                                                         # its pipes down the wall to the bar
        zc = (bo["z"][0] + bo["z"][1]) / 2 + dz
        o.box("chrome", xw - 4, Y(B["h"]), zc - 1, xw - 2, Y(bo["y"][0]), zc + 1)
    o.item("kitchen.chairs", "The bar chairs", "kitchen", src="E", measure=False)
    for cx_, cz_ in K["chairs"]:
        o.box("black", cx_ - 22, Y(45), cz_ - 22, cx_ + 22, Y(50), cz_ + 22)
        o.box("black", cx_ - 22, Y(50), cz_ - 22, cx_ - 18, Y(92), cz_ + 22)
        for lx, lz in ((cx_ - 19, cz_ - 19), (cx_ + 19, cz_ - 19), (cx_ - 19, cz_ + 19), (cx_ + 19, cz_ + 19)):
            o.box("chrome", lx - 1, Y(0), lz - 1, lx + 1, Y(45), lz + 1)
    # the LED battens on the ceiling (the photo)
    o.item("kitchen.lights", "The LED battens", "kitchen", kind="light", src="client's photo", measure=False)
    for zc in (-200.0, -90.0):
        o.box("led", 100, Y(CEIL - 5), zc - 3, 250, Y(CEIL - 1), zc + 3)


def chalk_doors(o, floor):
    """The client's chalkboard doors: the store's and the cupboard's in the kitchen's cubby (at right angles, on your right as you walk
    in), and the airing cupboard's upstairs. Shut, on the room side of their openings; the cupboard's has its two vents."""
    y = FLOOR_Y[floor]
    for d in doors(floor):
        if d["id"] not in D.CHALK_DOORS:
            continue
        o.item(d["id"], *DOOR_NAMES.get(d["id"], (d["id"], "")), kind="door", src=door_src(d["id"]), data=door_data(d["id"]), axis=d["axis"])
        if d["axis"] == "x":
            z = d["line"] - 4
            o.box("chalk", d["a"] + 1, y, z, d["b"] - 1, y + D.DOOR_H - 1, z + 3.5)
            o.box("black", d["b"] - 12, y + 98, z - 3, d["b"] - 4, y + 101, z)
        else:
            x = d["line"] + 1
            o.box("chalk", x, y, d["a"] + 1, x + 3.5, y + D.DOOR_H - 1, d["b"] - 1)
            o.box("steel", x + 3.5, y + 98, d["b"] - 12, x + 6, y + 104, d["b"] - 6)
            if d["id"] == "cupboard_door":
                for ya, yb in ((22, 58), (160, 180)):
                    o.box("grille", x + 3.5, y + ya, d["a"] + 14, x + 4.5, y + yb, d["b"] - 14)


def office(o):
    """v61: bedroom 3, the office, as the client plans it: the straight oak desk along the shelf wall, the stacked monitors on a pole,
    the white PC under the desk, the keyboard, a desk chair; the overhead shelf (it stays) with its ivy, the white pegboard; the radiator
    under the window and the dark roller blind (the photos)."""
    O, y0 = D.OFFICE, FLOOR_Y["first"]
    W = WIDTH                                                      # the party wall's face
    d = O["desk"]
    o.item("office.desk", "The oak desk", "bed3", src="E (size), client (wall to wall)", data=("OFFICE", "desk"), axis="z")
    o.box("oak", d["x"][0], y0 + d["h"] - d["t"], d["z"][0], d["x"][1], y0 + d["h"], d["z"][1])
    for z in (d["z"][0] + 4, d["z"][1] - 16):                      # black steel legs, a frame each end (v68: clear of the radiator)
        o.box("black", d["x"][0] + 4, y0, z, d["x"][0] + 8, y0 + d["h"] - d["t"], z + 4)
        o.box("black", d["x"][1] - 8, y0, z, d["x"][1] - 4, y0 + d["h"] - d["t"], z + 4)
        o.box("black", d["x"][0] + 4, y0 + d["h"] - d["t"] - 5, z, d["x"][1] - 4, y0 + d["h"] - d["t"], z + 4)
    o.item("office.shelf", "The shelf over the desk", "bed3", src="F (the photo)", data=("OFFICE", "shelf"), axis="z")
    s = O["shelf"]
    o.box("black", W - s["d"], y0 + s["y"], s["z"][0], W, y0 + s["y"] + s["t"], s["z"][1])
    for z in (s["z"][0] + 20, s["z"][0] + 60, s["z"][1] - 40):    # a few things on it: books, a jar, a pot
        o.box(("books", "jar", "pot")[int(z) % 3], W - 18, y0 + s["y"] + s["t"], z, W - 4, y0 + s["y"] + s["t"] + 16, z + 14)
    o.item("office.ivy", "The ivy along the top", "bed3", kind="decor", src="client's photo", measure=False)
    o.box("ivy", W - 3, y0 + CEIL - 12, BACK + 583, W, y0 + CEIL - 4, FRONT)          # the ivy along the top of the wall
    o.box("ivy", 283, y0 + CEIL - 12, FRONT - 3, W, y0 + CEIL - 4, FRONT)
    o.item("office.pegboard", "The pegboard", "bed3", src="E (IKEA SKÅDIS size)", data=("OFFICE", "pegboard"), axis="z")
    pb = O["pegboard"]
    o.box("pegboard", W - 1.5, y0 + pb["y"][0], pb["z"][0], W, y0 + pb["y"][1], pb["z"][1])
    for i, z in enumerate((pb["z"][0] + 12, pb["z"][0] + 36, pb["z"][0] + 58)):
        o.box("upvc", W - 9, y0 + pb["y"][0] + 10 + i * 12, z, W - 1.5, y0 + pb["y"][0] + 20 + i * 12, z + 9)
    o.item("office.monitors", "The stacked monitors", "bed3", src="E (27-inch)", data=("OFFICE", "monitors"), axis="z")
    m = O["monitors"]; zc = (m["z"][0] + m["z"][1]) / 2
    o.box("black", W - 12, y0 + d["h"], zc - 2, W - 8, y0 + m["y0"] + 2 * m["h"] + m["gap"] + 2, zc + 2)   # the pole
    for k in range(2):
        yb = y0 + m["y0"] + k * (m["h"] + m["gap"])
        o.box("black", W - 18, yb, m["z"][0], W - 15, yb + m["h"], m["z"][1])
        o.box("screen", W - 18.3, yb + 1.5, m["z"][0] + 1.5, W - 18, yb + m["h"] - 1.5, m["z"][1] - 1.5)
    o.box("pink", d["x"][0] + 6, y0 + d["h"], zc - 18, d["x"][0] + 19, y0 + d["h"] + 3, zc + 18)             # its pink keyboard
    o.item("office.dual", "The side-by-side setup", "bed3", src="E (24-inch)", data=("OFFICE", "dual"), axis="z")
    du = O["dual"]; zm = (du["z"][0] + du["z"][1]) / 2                # v66: the second setup, side by side, by the window
    o.box("black", W - 22, y0 + d["h"], zm - 12, W - 6, y0 + d["h"] + 1.5, zm + 12)                          # the stand's foot
    o.box("black", W - 15, y0 + d["h"], zm - 2, W - 11, y0 + du["y0"] + du["h"] / 2, zm + 2)
    for za, zb in ((du["z"][0], zm - 0.5), (zm + 0.5, du["z"][1])):
        o.box("black", W - 21, y0 + du["y0"], za, W - 18, y0 + du["y0"] + du["h"], zb)
        o.box("screen", W - 21.3, y0 + du["y0"] + 1.2, za + 1.2, W - 21, y0 + du["y0"] + du["h"] - 1.2, zb - 1.2)
    o.box("black", d["x"][0] + 6, y0 + d["h"], zm - 22, d["x"][0] + 20, y0 + d["h"] + 3, zm + 22)           # its black keyboard
    o.box("black", d["x"][0] + 8, y0 + d["h"], zm + 28, d["x"][0] + 14, y0 + d["h"] + 3, zm + 34)
    mz = du["z"][1] - 6                                                                                       # the mic on its boom arm
    o.box("black", W - 6, y0 + d["h"], mz - 3, W - 2, y0 + d["h"] + 40, mz + 3)
    o.box("black", W - 30, y0 + d["h"] + 38, mz - 1.5, W - 4, y0 + d["h"] + 41, mz + 1.5)
    o.box("steel", W - 34, y0 + d["h"] + 22, mz - 3, W - 28, y0 + d["h"] + 38, mz + 3)
    o.item("office.pc2", "The glass PC", "bed3", src="E (mid-tower)", data=("OFFICE", "pc2"), axis="z")
    p2 = O["pc2"]                                                                                             # its glass PC under the desk
    o.box("pc_white", p2["x"][0], y0, p2["z"][0], p2["x"][1], y0 + p2["h"], p2["z"][1])
    o.box("pc_glow", p2["x"][0] - 0.3, y0 + 3, p2["z"][0] + 2, p2["x"][0], y0 + p2["h"] - 3, p2["z"][1] - 2)
    o.box("black", d["x"][0] + 8, y0 + d["h"], zc + 24, d["x"][0] + 14, y0 + d["h"] + 3, zc + 30)            # the mouse
    o.item("office.pc", "The white PC", "bed3", src="E (mid-tower)", data=("OFFICE", "pc"), axis="z")
    pc = O["pc"]
    o.box("pc_white", pc["x"][0], y0, pc["z"][0], pc["x"][1], y0 + pc["h"], pc["z"][1])
    o.box("pc_glow", pc["x"][0] - 0.3, y0 + 3, pc["z"][0] + 2, pc["x"][0], y0 + pc["h"] - 3, pc["z"][1] - 2)   # its glass side, lit
    o.item("office.chairs", "The desk chairs", "bed3", src="E", measure=False)
    for cx, cz in (O["chair"], O["chair2"]):                       # a desk chair at each setup, facing the desk
        o.box("black", cx - 26, y0 + 46, cz - 26, cx + 26, y0 + 54, cz + 26)
        o.box("black", cx - 32, y0 + 54, cz - 25, cx - 24, y0 + 125, cz + 25)
        o.box("chrome", cx - 3, y0 + 8, cz - 3, cx + 3, y0 + 46, cz + 3)
        o.box("black", cx - 28, y0, cz - 3, cx + 28, y0 + 8, cz + 3); o.box("black", cx - 3, y0, cz - 28, cx + 3, y0 + 8, cz + 28)
    o.item("office.radiator", "The office radiator", "bed3", kind="radiator", src="F + E", data=("OFFICE", "radiator"), axis="x")
    r = O["radiator"]                                              # under the window, and the blind down
    radiator(o, "x", FRONT - 3, -1, r["x"][0], r["x"][1], y0 + r["y"][0], y0 + r["y"][1])
    o.item("office.blind", "The roller blind", "bed3", kind="decor", src="client's photo", measure=False)
    op = next(p for p in D.OPENINGS if p["id"] == "bed3_window")
    o.box("blind", op["x"][0] + 4, y0 + op["sill"] + 20, FRONT - 1.5, op["x"][1] - 4, y0 + op["head"], FRONT - 0.5)
    o.box("blind", op["x"][0] + 2, y0 + op["head"] - 2, FRONT - 6, op["x"][1] - 2, y0 + op["head"] + 6, FRONT - 0.5)


def bed2(o):
    """v62: bedroom 2 as it is (the client's photo): the desk under the dormer window with its monitor, laptop and chair, the blind; the
    red gloss shelving against the block with a box and a screen on it, the cat tree; the chest and the airer under the slope; the double
    bed with its black headboard against the side wall; a low table by the door."""
    B, y = D.BED2, FLOOR_Y["first"]
    zi = DM["face"] + DM["t"]                                      # the dormer face's inside
    d = B["desk"]
    o.item("bed2.desk", "The black desk", "bed2", src="E", data=("BED2", "desk"), axis="x")
    if "desk" in D.BED2_KEEP:                                      # v66: the music room clears the room (music())
        o.box("black", d["x"][0], y + d["h"] - 3, d["z"][0], d["x"][1], y + d["h"], d["z"][1])
        for lx in (d["x"][0] + 3, d["x"][1] - 6):
            o.box("black", lx, y, d["z"][0] + 3, lx + 3, y + d["h"] - 3, d["z"][1] - 3)
    # v64: the desk only (the client keeps the desk, the bed, the drawers and the red shelving)
    o.item("bed2.blind", "The blind", "bed2", kind="decor", src="client's photo", measure=False)
    op = next(p for p in D.OPENINGS if p["id"] == "bed2_window")   # the blind, half down
    o.box("blind", op["x"][0] + 3, y + op["head"] - 70, zi + 0.5, op["x"][1] - 3, y + op["head"], zi + 1.5)
    o.box("blind", op["x"][0] + 1, y + op["head"] - 2, zi, op["x"][1] - 1, y + op["head"] + 7, zi + 7)
    o.item("bed2.shelving", "The red shelving", "bed2", src="E (77 × 147 × 39)", data=("BED2", "shelving"), axis="z")
    if "shelving" in D.BED2_KEEP:
        s = B["shelving"]; x0, x1, z0, z1, h, T = s["x"][0], s["x"][1], s["z"][0], s["z"][1], s["h"], 3.8   # 2 × 4 cubes, open to the room
        for za, zb in ((z0, z0 + T), (z1 - T, z1), ((z0 + z1) / 2 - 1, (z0 + z1) / 2 + 1)):
            o.box("red_gloss", x0, y, za, x1, y + h, zb)
        for k in range(5):
            yy = y + (h - T) * k / 4
            o.box("red_gloss", x0, yy, z0, x1, yy + T, z1)
        o.box("red_back", x0 + 0.3, y + 0.3, z0 + 0.3, x0 + 1.3, y + h - 0.3, z1 - 0.3)
    o.item("bed2.chest", "The black chest of drawers", "bed2", src="E", data=("BED2", "chest"), axis="z")
    if "chest" in D.BED2_KEEP:
        c = B["chest"]                                             # v64: its side on the side wall, standing out, drawers to the bed
        o.box("black", c["x"][0], y, c["z"][0], c["x"][1], y + c["h"], c["z"][1])
        for k in range(1, 4):
            o.box("gap", c["x"][0] + 1, y + c["h"] * k / 4 - 0.4, c["z"][1], c["x"][1] - 1, y + c["h"] * k / 4 + 0.4, c["z"][1] + 0.3)
        for k in range(4):
            cx_ = (c["x"][0] + c["x"][1]) / 2
            o.box("chrome", cx_ - 6, y + c["h"] * (k + 0.55) / 4, c["z"][1] + 0.3, cx_ + 6, y + c["h"] * (k + 0.55) / 4 + 1.5, c["z"][1] + 2.5)
    if "bed" not in D.BED2_KEEP:                                   # v65: the music room's day bed instead (music())
        return
    o.item("bed2.bed", "The double bed", "bed2", src="E (135 × 190)", data=("BED2", "bed"), axis="z")
    b_ = B["bed"]; bx0, bx1, bz0, bz1 = b_["x"][0], b_["x"][1], b_["z"][0], b_["z"][1]
    o.box("leather", bx0, y, bz0, bx0 + 8, y + b_["head_h"], bz1)
    o.box("leather", bx0 + 8, y + 8, bz0, bx1, y + 32, bz1)
    o.box("upvc", bx0 + 10, y + 32, bz0 + 4, bx1 - 3, y + 52, bz1 - 4)
    o.box("check", bx0 + 40, y + 52, bz0 + 2, bx1 - 1, y + 58, bz1 - 2)
    for pz in (bz0 + 8, (bz0 + bz1) / 2 + 3):
        o.box("pot", bx0 + 10, y + 52, pz, bx0 + 42, y + 64, pz + 62)


def boiler(o):
    """The boiler cupboard (the client's word for it). v76, the client: "It also actually just houses towels and boxes for stuff no
    boiler" (the boiler is in the kitchen: kitchen()): two shelves of folded towels, storage boxes on the floor (E: 60 deep shelves)."""
    r = next(q for q in rooms("first") if q["id"] == "airing"); y = FLOOR_Y["first"]
    o.item("airing.shelves", "The towel shelves", "airing", src="client (towels and boxes) + E", measure=False)
    for sy, cols in ((95, ("duvet", "cloth4", "cloth1")), (150, ("cloth4", "duvet", "cloth6"))):
        o.box("wardrobe", r["x0"] + 1, y + sy, r["z0"] + 1, r["x1"] - 1, y + sy + 2, r["z1"] - 1)   # a shelf
        n = 3; zw = (r["z1"] - r["z0"] - 8) / n
        for i, c in enumerate(cols):                                                              # folded towels on it
            za = r["z0"] + 4 + i * zw
            o.box(c, r["x0"] + 6, y + sy + 2, za, r["x0"] + 44, y + sy + 16 + (i % 2) * 4, za + zw - 2)
    o.item("airing.boxes", "The storage boxes", "airing", src="E", measure=False)
    for i in range(2):                                                                            # boxes for stuff on the floor
        za = r["z0"] + 3 + i * ((r["z1"] - r["z0"] - 6) / 2)
        o.box("storebox", r["x0"] + 4, y, za, r["x0"] + 46, y + 32, za + (r["z1"] - r["z0"] - 6) / 2 - 2)
    o.box("storebox", r["x0"] + 6, y + 32, r["z0"] + 8, r["x0"] + 40, y + 56, r["z0"] + 30)


def master(o):
    """v63: the master bedroom: the pine ottoman bed in the middle facing the door (slatted headboard, panelled base, mattress, duvet);
    v68 storage for two: a pine bedside each side, the chest under the window, the ottoman's lid lifting on its struts over four boxes
    (the viewer's Lift the bed), the two wardrobe frames fitted out alike, a BILLY between them and the bed."""
    M_, y = D.MASTER, FLOOR_Y["first"]
    b = M_["bed"]; x0, x1, z0, z1 = b["x"][0], b["x"][1], b["z"][0], b["z"][1]
    o.item("master.bed", "The pine ottoman bed", "master", src="E (king, 150 × 200)", data=("MASTER", "bed"), axis="z")
    o.box("pine", x0, y, z0, x0 + 6, y + b["head_h"], z0 + 6); o.box("pine", x0, y, z1 - 6, x0 + 6, y + b["head_h"], z1)      # headboard posts
    o.box("pine", x0, y + b["head_h"] - 8, z0, x0 + 5, y + b["head_h"], z1); o.box("pine", x0, y + 62, z0, x0 + 5, y + 70, z1)
    n = 13
    for k in range(n):                                             # the slats
        zz = z0 + 10 + (z1 - z0 - 20) * (k + 0.5) / n
        o.box("pine", x0 + 1, y + 70, zz - 2.5, x0 + 4, y + b["head_h"] - 8, zz + 2.5)
    T = 2.0                                                        # the ottoman: a panelled pine box, open at the top
    o.box("pine", x0 + 6, y, z0, x1, y + 4, z1)
    o.box("pine", x0 + 6, y + 4, z0, x1, y + 36, z0 + T); o.box("pine", x0 + 6, y + 4, z1 - T, x1, y + 36, z1)
    o.box("pine", x1 - T, y + 4, z0 + T, x1, y + 36, z1 - T); o.box("pine", x0 + 6, y + 4, z0 + T, x0 + 6 + T, y + 36, z1 - T)
    o.box("pine_dark", x1, y + 6, z0 + 8, x1 + 0.4, y + 32, z1 - 8)
    bx = b["boxes"]                                                # four storage boxes inside, two by two
    for i in range(2):
        for j in range(2):
            xa = x0 + 6 + T + 8 + i * (bx["w"] + 6); za = (z0 + z1) / 2 + (j - 1) * (bx["d"] + 4) + 2
            o.box("storebox", xa, y + 4, za, xa + bx["w"], y + 4 + bx["h"], za + bx["d"])
    hx, hy = x0 + 6 + T, y + 36                                    # the lid hinges at the head end; the struts lift the foot
    lid = o.part("bed_lift", (hx, hy, (z0 + z1) / 2), "z", b["lift"])
    lid.box("pine", hx, hy, z0, x1, hy + 2, z1)                    # the slatted lid (the mattress's base)
    lid.box("mattress", x0 + 8, y + 38, z0 + 4, x1 - 3, y + 60, z1 - 4)  # mattress
    lid.box("duvet", x0 + 50, y + 60, z0 + 2, x1 - 1, y + 66, z1 - 2)
    lid.box("duvet", x0 + 50, y + 62, z0 + 1, x0 + 68, y + 70, z1 - 1)   # v72 (B4): turned down at the pillows,
    for za, zb in ((z0 + 0.5, z0 + 2.5), (z1 - 2.5, z1 - 0.5)):      # draped down the sides and over the foot
        lid.box("duvet", x0 + 52, y + 42, za, x1 - 1, y + 64, zb)
    lid.box("duvet", x1 - 2.5, y + 42, z0 + 2, x1 - 0.5, y + 64, z1 - 2)
    for pz in (z0 + 10, (z0 + z1) / 2 + 3):
        lid.box("pot", x0 + 9, y + 60, pz, x0 + 45, y + 72, pz + 66)
    for za, zb in M_["bedsides"]:                                  # pine bedside drawers, round knobs
        o.item(f"master.bedside{int(za)}", "A pine bedside", "master", src="E", data=("MASTER", "bedsides"), axis="z")
        o.box("pine", 0, y + 6, za, 35, y + 60, zb)
        for k in range(3):
            yy = y + 8 + k * 17
            o.box("pine_dark", 35, yy + 15.5, za + 1, 35.3, yy + 16.5, zb - 1)
            o.box("pine_dark", 35, yy + 7, (za + zb) / 2 - 1.5, 37.5, yy + 10, (za + zb) / 2 + 1.5)
        for fx, fz in ((4, za + 4), (31, za + 4), (4, zb - 4), (31, zb - 4)):
            o.box("pine_dark", fx - 2.5, y, fz - 2.5, fx + 2.5, y + 6, fz + 2.5)
    o.item("master.chest", "The pine chest of drawers", "master", src="E", data=("MASTER", "chest"), axis="x")
    c = M_["chest"]                                                # under the window, its drawers facing the room
    o.box("pine", c["x"][0], y + 6, c["z"][0], c["x"][1], y + c["h"], c["z"][1])
    for k in range(1, 4):
        yy = y + 6 + (c["h"] - 6) * k / 4
        o.box("pine_dark", c["x"][0] + 1, yy - 0.5, c["z"][0] - 0.3, c["x"][1] - 1, yy + 0.5, c["z"][0])
    for k in range(4):
        yy = y + 6 + (c["h"] - 6) * (k + 0.5) / 4
        for fx in (c["x"][0] + 20, c["x"][1] - 20):
            o.box("pine_dark", fx - 1.5, yy - 1.5, c["z"][0] - 2.5, fx + 1.5, yy + 1.5, c["z"][0])
    cols = ["#3d4a5c", "#b9b2a6", "#7a2f2f", "#2f3b2f", "#d8d2c4", "#555555", "#9b8b6e"]
    w = M_["wardrobes"]; zb_ = next(r["z0"] for r in rooms("first") if r["id"] == "master") + 0.5   # the alcove's back wall (v69: fitted)
    # v65, the client: "only the frames with no doors right now"; v68 one each, fitted out alike
    T_, zf_ = 1.8, zb_ + w["d"] - 0.3
    for k in range(w["n"]):
        o.item(f"master.wardrobe{k + 1}", "Wardrobe " + str(k + 1), "master", src="client (two 1 m) + E", data=("MASTER", "wardrobes"), axis="x")
        xa, xb = w["x0"] + k * w["w"] + 0.5, w["x0"] + (k + 1) * w["w"] - 0.5
        o.box("wardrobe", xa, y, zb_, xa + T_, y + w["h"], zf_); o.box("wardrobe", xb - T_, y, zb_, xb, y + w["h"], zf_)
        o.box("wardrobe", xa + T_, y + w["h"] - T_, zb_, xb - T_, y + w["h"], zf_); o.box("wardrobe", xa + T_, y, zb_ + 2, xb - T_, y + 8, zf_)
        o.box("wardrobe_back", xa + T_, y + 8, zb_, xb - T_, y + w["h"] - T_, zb_ + 0.6)
        for d_ in range(w["drawers"]):                             # three KOMPLEMENT drawers at the bottom, white fronts, a pull each
            ya = y + 8 + d_ * w["drawer_h"]
            o.box("wardrobe", xa + T_ + 0.3, ya + 0.3, zf_ - 2, xb - T_ - 0.3, ya + w["drawer_h"] - 0.3, zf_)
            o.box("chrome", (xa + xb) / 2 - 8, ya + w["drawer_h"] / 2 - 0.6, zf_, (xa + xb) / 2 + 8, ya + w["drawer_h"] / 2 + 0.6, zf_ + 1.5)
        yd = y + 8 + w["drawers"] * w["drawer_h"]
        o.box("wardrobe", xa + T_, yd, zb_ + 0.6, xb - T_, yd + 1.8, zf_)
        o.box("wardrobe", xa + T_, y + 175, zb_ + 0.6, xb - T_, y + 176.8, zf_)            # the top shelf, the rail under it
        o.box("chrome", xa + T_, y + 165, zb_ + w["d"] / 2 - 1, xb - T_, y + 167, zb_ + w["d"] / 2 + 1)
        for i in range(10):
            cx_ = xa + 8 + i * (w["w"] - 16) / 10
            o.box("cloth%d" % ((i + 3 * k) % len(cols)), cx_, y + 90 + (i % 3) * 12, zb_ + 8, cx_ + 5.5, y + 163, zb_ + w["d"] - 8)
        for i in range(2):                                         # folded on the top shelf; boxes on top of the frame to the ceiling
            o.box("cloth%d" % ((i + k) % len(cols)), xa + 10 + i * 42, y + 176.8, zb_ + 8, xa + 44 + i * 42, y + 190, zb_ + 42)
            o.box("storebox", xa + 3 + i * 47, y + w["h"], zb_ + 4, xa + 47 + i * 47, y + w["h"] + w["top_boxes"], zb_ + w["d"] - 6)


def music(o):
    """v66: bedroom 2 as the best music room for the space (the client: "remove everything ... 2 guitars, amp, large keyboard with more to
    come, you can choose other items"); v68 (survey_data.MUSIC): the custom L desk under the window and along the landing wall, the 88-key
    on a pull-out tray under it, the chair-bed against the front wall, the Kallax with its drawers across the alcove, the guitars and the
    amp in the front corner, acoustic panels, a rug."""
    Mu, y = D.MUSIC, FLOOR_Y["first"]
    o.item("music.rug", "The rug", "bed2", kind="decor", src="E", data=("MUSIC", "rug"), axis="x")
    r = Mu["rug"]
    o.box("rug", r["x"][0], y, r["z"][0], r["x"][1], y + 1, r["z"][1])
    o.item("music.chairbed", "The LYCKSELE chair-bed", "bed2", src="IKEA LYCKSELE (E placed)", data=("MUSIC", "chairbed"), axis="x")
    cb = Mu["chairbed"]; x0, x1 = cb["x"]; z1 = cb["z1"]; z0 = z1 - cb["d"]   # LYCKSELE: a black frame, a fold-out cushion, its back
    o.box("black", x0, y, z0 + 4, x0 + 3, y + 20, z1 - 4); o.box("black", x1 - 3, y, z0 + 4, x1, y + 20, z1 - 4)
    o.box("black", x0, y + 18, z0 + 4, x1, y + 21, z0 + 7)
    o.box("lycksele", x0 + 2, y + 21, z0, x1 - 2, y + 42, z1 - 22)                  # the seat
    o.box("lycksele", x0 + 2, y + 21, z1 - 22, x1 - 2, y + cb["h"], z1 - 2)         # the back, leaning on the wall
    o.box("pot", x0 + 8, y + 42, z1 - 34, x1 - 8, y + 62, z1 - 22)                  # a cushion
    o.item("music.desk", "The L desk", "bed2", src="E (custom)", data=("MUSIC", "desk"), axis="x")
    dk = Mu["desk"]; dx0, dx1 = dk["x"]; dz0, dz1 = dk["z"]; dy = y + dk["h"]        # the L desk in birch ply
    rt = dk["ret"]
    o.box("birch", dx0, dy - dk["t"], dz0, dx1, dy, dz1)
    o.box("birch", rt["x"][0], dy - dk["t"], rt["z"][0], rt["x"][1], dy, rt["z"][1])
    o.box("birch", dx0, y, dz0, dx0 + 2, dy - dk["t"], dz1 - 2)                    # the end panel by the alcove
    o.box("birch", rt["x"][0], y, rt["z"][1] - 2, rt["x"][1], dy - dk["t"], rt["z"][1])  # the return's end panel
    o.box("birch", rt["x"][0], y, dz0, rt["x"][0] + 2, dy - dk["t"], dz0 + 8)      # a leg in the corner's front
    o.box("birch", dx0 + 2, dy - dk["t"] - 8, dz0, dx1, dy - dk["t"], dz0 + 2)      # the modesty rail at the back
    o.item("music.keyboard", "The 88-key on its tray", "bed2", src="E (88-key)", data=("MUSIC", "keyboard"), axis="x")
    tr = dk["tray"]; kb = Mu["keyboard"]                                        # the pull-out tray, the 88-key on it, half out
    tz1 = dz1 + 18
    o.box("birch", kb["x"][0] - 4, y + tr["y"], tz1 - tr["d"], kb["x"][1] + 4, y + tr["y"] + 2, tz1)
    for rx in (kb["x"][0] - 6, kb["x"][1] + 4):
        o.box("steel", rx, y + tr["y"], dz0 + 10, rx + 2, y + tr["y"] + 3, dz1)      # the runners
    ky0 = y + tr["y"] + 2
    o.box("black", kb["x"][0], ky0, tz1 - kb["d"] - 2, kb["x"][1], ky0 + kb["h"], tz1 - 2)
    o.box("porcelain", kb["x"][0] + 3, ky0 + kb["h"] - 6, tz1 - 2 - 15, kb["x"][1] - 3, ky0 + kb["h"] - 4, tz1 - 1.7)   # the keys
    for k in range(52):
        xx = kb["x"][0] + 3 + (kb["x"][1] - kb["x"][0] - 6) * k / 52
        o.box("black", xx - 0.3, ky0 + kb["h"] - 4, tz1 - 2 - 15, xx + 0.3, ky0 + kb["h"] - 3, tz1 - 8) if k % 7 not in (2, 6) else None
    o.item("music.monitors", "The riser and monitors", "bed2", src="E", data=("MUSIC", "monitors"), axis="x")
    o.box("black", dx0 + 2, dy + dk["riser"] - 2, dz0 + 1, dx1 - 2, dy + dk["riser"], dz0 + 26)   # the riser, the monitors, the screen
    for lx in (dx0 + 4, (dx0 + dx1) / 2 - 2, dx1 - 8):
        o.box("black", lx, dy, dz0 + 3, lx + 4, dy + dk["riser"] - 2, dz0 + 24)
    my = dy + dk["riser"]
    for mx, mz in Mu["monitors"]:
        o.box("black", mx, my, mz, mx + 17, my + 25, mz + 22)
        o.box("ring", mx + 3, my + 4, mz + 22, mx + 14, my + 15, mz + 22.4)
        o.box("ring", mx + 6, my + 17, mz + 22, mx + 11, my + 22, mz + 22.4)
    cx_ = (dx0 + dx1) / 2
    o.box("screen", cx_ - 28, my + 6, dz0 + 4, cx_ + 28, my + 38, dz0 + 6)
    o.box("black", cx_ - 22, dy, dz1 - 20, cx_ + 22, dy + 2.5, dz1 - 6)              # a computer keyboard
    o.box("red_gloss", rt["x"][0] + 20, dy, rt["z"][0] + 30, rt["x"][0] + 42, dy + 4.5, rt["z"][0] + 50)   # the interface on the return
    o.item("music.chair", "The desk chair", "bed2", src="E", measure=False)
    hx, hz = Mu["chair"]                                           # the chair, facing the desk
    o.box("black", hx - 25, y + 52, hz - 25, hx + 25, y + 60, hz + 25)
    o.box("black", hx - 24, y + 60, hz + 18, hx + 24, y + 122, hz + 25)
    o.box("chrome", hx - 3, y + 8, hz - 3, hx + 3, y + 52, hz + 3)
    o.box("black", hx - 28, y, hz - 3, hx + 28, y + 8, hz + 3); o.box("black", hx - 3, y, hz - 28, hx + 3, y + 8, hz + 28)
    o.item("music.kallax", "The Kallax with drawers", "bed2", src="IKEA KALLAX (E placed)", data=("MUSIC", "kallax"), axis="x")
    kx = Mu["kallax"]; ka, kb_ = kx["x"]; kz0, kz1 = kx["z0"], kx["z0"] + kx["d"]; T = 3.8   # the Kallax, white, open to the room
    for xa in (ka, (ka + kb_) / 2 - 0.8, kb_ - T):
        o.box("wardrobe", xa, y, kz0, xa + (1.6 if xa not in (ka, kb_ - T) else T), y + kx["h"], kz1)
    cell = (kx["h"] - T) / kx["rows"]
    for k in range(kx["rows"] + 1):
        o.box("wardrobe", ka, y + k * cell, kz0, kb_, y + k * cell + T, kz1)
    o.box("wardrobe_back", ka, y, kz0, kb_, y + kx["h"], kz0 + 0.6)
    cw = (kb_ - ka - 2 * T - 1.6) / 2
    n = 0
    for k in range(kx["rows"]):                                    # the drawer inserts in the bottom rows, two drawers each
        for c in range(kx["cols"]):
            xa = ka + T + c * (cw + 1.6); ya = y + k * cell + T
            if n < kx["drawers"]:
                for dd in range(2):
                    yy = ya + dd * (cell - T) / 2
                    o.box("wardrobe", xa + 0.4, yy + 0.4, kz1 - 1.6, xa + cw - 0.4, yy + (cell - T) / 2 - 0.4, kz1)
                    o.box("chrome", xa + cw / 2 - 5, yy + (cell - T) / 4 - 0.6, kz1, xa + cw / 2 + 5, yy + (cell - T) / 4 + 0.6, kz1 + 1.2)
            elif (k + c) % 2:
                o.box("cloth%d" % ((k + c) % 7), xa + 3, ya, kz0 + 6, xa + cw - 3, ya + 22, kz1 - 6)   # a box, records
            n += 1
    o.item("music.amp", "The amp", "bed2", src="E (1 × 12 combo)", data=("MUSIC", "amp"), axis="z")
    a = Mu["amp"]; ax0, ax1 = a["x"]; az0, az1 = a["z"]            # the amp, a 1 × 12 combo, its face to the room
    o.box("black", ax0, y, az0, ax1, y + a["h"], az1)
    o.box("grille", ax1, y + 4, az0 + 3, ax1 + 0.4, y + a["h"] - 12, az1 - 3)
    o.box("amp_grille", ax1 + 0.1, y + 5, az0 + 4, ax1 + 0.5, y + a["h"] - 13, az1 - 4)
    o.box("steel", ax0 + 4, y + a["h"], az0 + 6, ax1 - 4, y + a["h"] + 0.6, az1 - 6)     # the control panel, the handle
    o.box("black", (ax0 + ax1) / 2 - 2, y + a["h"] + 0.6, (az0 + az1) / 2 - 9, (ax0 + ax1) / 2 + 2, y + a["h"] + 3, (az0 + az1) / 2 + 9)
    o.box("black", 30.0, y, (az0 + az1) / 2 - 20, 44.0, y + 4, (az0 + az1) / 2 + 20)  # a pedalboard in front of it
    o.item("music.guitars", "The two guitars", "bed2", src="client + E", data=("MUSIC", "guitars"), axis="z")
    o.box("black", 46, y + 0.5, Mu["guitars"][0][1] - 22, 74, y + 3, Mu["guitars"][1][1] + 22)   # the double stand's foot
    for k, (gx, gz) in enumerate(Mu["guitars"]):                   # two guitars, face to the room: an electric and an acoustic
        body = "guitar_red" if k == 0 else "pine"
        o.box(body, gx - 4, y + 8, gz - 13, gx + 4, y + 30, gz + 13)          # the lower bout
        o.box(body, gx - 4, y + 30, gz - 10, gx + 4, y + 48, gz + 10)         # the upper bout
        o.box("pine_dark", gx - 1.5, y + 48, gz - 2.5, gx + 2.5, y + 104, gz + 2.5)   # the neck
        o.box("black", gx - 2, y + 104, gz - 4, gx + 2.5, y + 120, gz + 4)            # the head
        o.box("black", gx + 4, y + 22, gz - 5, gx + 4.4, y + 38, gz + 5)              # the pickguard / sound hole
        o.box("black", gx - 6, y + 4, gz - 1, gx - 2, y + 60, gz + 1)                 # the stand's upright
    o.item("music.panels", "The acoustic panels", "bed2", kind="decor", src="E", data=("MUSIC", "panels"), measure=False)
    for kind, a1, a2, py in Mu["panels"]:                          # acoustic panels at the desk's side reflection points
        if kind == "x":
            o.box("panel", a1 - 0.5, y + py, a2, a1 + 1.0, y + py + 60, a2 + 60)
        else:
            o.box("panel", a1, y + py, a2, a1 + 5, y + py + 60, a2 + 60)


def bathroom(o):
    """v65: the bathroom as it is (the client's two photos, survey_data.BATH): the white gloss vanity and the slim cabinet on the side wall
    under the slope, the tiled box in the low corner, the toilet under the window, the bath along the right with its rail, curtain and
    black shower head, stone-effect wall tiles (the floor's black marble is its finish)."""
    B, y = D.BATH, FLOOR_Y["first"]
    zi = DM["face"] + DM["t"]                                      # the window wall's inside
    xw = WIDTH - 0.5                                               # the side wall (the party wall's plaster)
    o.item("bath.vanity", "The vanity unit", "bathroom", src="client's photo + E (85?)", data=("BATH", "vanity"), axis="z")
    v = B["vanity"]; za, zb = v["z"]; xc = xw - v["d"]
    o.box("gloss", xc + 3, y, za + 1, xw, y + 10, zb - 1)          # plinth, set back
    o.box("gloss", xc, y + 10, za, xw, y + v["top"] - 4, zb)        # carcass
    o.box("fitting", xw - v["basin_d"], y + v["top"] - 4, za - 1, xw, y + v["top"], zb + 1)      # the basin's top
    o.box("porcelain", xw - v["basin_d"] + 6, y + v["top"] + 0.1, za + 8, xw - 10, y + v["top"] + 0.4, zb - 8)   # its bowl, seen from above
    sec = [za, za + 28, za + 56.5, zb]                              # a drawer over a door at the far end, two doors nearer the door
    for zz in sec[1:-1]:
        o.box("gap", xc - 0.3, y + 11, zz - 0.3, xc, y + v["top"] - 5, zz + 0.3)
    o.box("gap", xc - 0.3, y + 64, sec[0] + 1, xc, y + 64.6, sec[1] - 1)
    for zz in (sec[1] - 4, sec[2] + 4, (sec[2] + sec[3]) / 2 + 4):  # chrome bar handles, upright on the doors
        o.box("chrome", xc - 2.5, y + 40, zz - 0.6, xc, y + 56, zz + 0.6)
    o.box("chrome", xc - 2.5, y + 72, (sec[0] + sec[1]) / 2 - 7, xc, y + 73.2, (sec[0] + sec[1]) / 2 + 7)
    zt = (za + zb) / 2                                              # the black waterfall tap
    o.box("black", xw - 8, y + v["top"], zt - 1.5, xw - 4, y + v["top"] + 22, zt + 1.5)
    o.box("black", xw - 16, y + v["top"] + 18, zt - 2.5, xw - 4, y + v["top"] + 22, zt + 2.5)
    o.item("bath.slim", "The slim cabinet", "bathroom", src="client's photo + E", data=("BATH", "slim"), axis="z")
    sl = B["slim"]; s0, s1 = sl["z"]                                # the slim cabinet, its round vents
    o.box("gloss", xw - sl["d"], y + 0.3, s0, xw, y + sl["h"], s1)
    for yy in (22, 44, 66):
        o.box("gap", xw - sl["d"] - 0.3, y + yy - 4, (s0 + s1) / 2 - 4, xw - sl["d"], y + yy + 4, (s0 + s1) / 2 + 4)
    o.item("bath.toilet", "The toilet", "bathroom", src="client's photo + E", data=("BATH", "toilet"), axis="x")
    t = B["toilet"]; tx0, tx1 = t["x"]                              # the close-coupled toilet under the window
    o.box("fitting", tx0, y + 40, zi + 0.5, tx1, y + t["cistern_h"], zi + 18)
    toilet(o, "fitting", tx0 + 2, tx1 - 2, zi + 18, zi + t["d"], y, y + 40)   # v70: the pan and the seat, turned
    o.box("duvet", tx0 + 6, y + t["cistern_h"], zi + 3, tx0 + 17, y + t["cistern_h"] + 10, zi + 14)   # the roll on the cistern
    o.item("bath.bath", "The bath, rail and curtain", "bathroom", src="client's photo + E (170?)", data=("BATH", "bath"), axis="z")
    b = B["bath"]; bx0, bx1 = b["x"]; bz0, bz1 = zi + 0.3, zi + b["l"]   # the bath, its panel and rim
    hb_ = b["h"] - 3                                                # v70: the bath hollow: its panel, its sides, the tub's floor
    o.box("gloss", bx0, y, bz0, bx1, y + 12, bz1)
    for (x0, x1, z0, z1) in ((bx0, bx0 + 6, bz0, bz1), (bx1 - 6, bx1, bz0, bz1), (bx0 + 6, bx1 - 6, bz0, bz0 + 6), (bx0 + 6, bx1 - 6, bz1 - 6, bz1)):
        o.box("gloss", x0, y + 12, z0, x1, y + hb_, z1)
    o.box("fitting", bx0 + 6, y + 12, bz0 + 6, bx1 - 6, y + 13, bz1 - 6)
    for (x0, x1, z0, z1) in ((bx0, bx1, bz0, bz0 + 6), (bx0, bx1, bz1 - 6, bz1), (bx0, bx0 + 6, bz0, bz1), (bx1 - 6, bx1, bz0, bz1)):
        o.box("fitting", x0, y + b["h"] - 3, z0, x1, y + b["h"], z1)
    o.box("black", (bx0 + bx1) / 2 - 3, y + 13, bz0 + 22, (bx0 + bx1) / 2 + 3, y + 13.3, bz0 + 28)   # the plug, in the tub
    ry = y + B["rail_y"]; rx = bx1 - 1                              # the rail: along the bath's open side and across its end
    o.box("chrome", rx - 1, ry, bz0 + 4, rx + 1, ry + 2, bz1)
    o.box("chrome", bx0 + 0.5, ry, bz1 - 2, rx + 1, ry + 2, bz1)
    for (cx, cz) in ((rx, bz0 + 6), (rx, bz1 - 1), (bx0 + 3, bz1 - 1)):        # v82: up to the dormer's ceiling (the beam's, by the door end)
        o.box("chrome", cx - 0.5, ry + 2, cz - 0.5, cx + 0.5, y + (B["beam_y"] if cz < DORMER_BACK else CEIL), cz + 0.5)
    for k in range(6):                                             # the curtain, drawn back to the door end (v69: in folds)
        za_ = bz1 - 16 + k * 2.4; dx = 1.6 * (k % 2)
        o.box("curtain", rx - 2.5 + dx, y + 50 + (k % 3), za_, rx - 0.5 + dx, ry, za_ + 2.6)
    o.box("black", bx0 + 0.6, y + 120, bz1 - 22, bx0 + 2.5, y + 192, bz1 - 20)    # the riser and the black shower head
    o.box("black", bx0 + 2.5, y + 190, bz1 - 28, bx0 + 14, y + 194, bz1 - 14)
    o.item("bath.tiles", "The wall tiles and the tiled box", "bathroom", kind="finish", src="client's photo + E", data=("BATH", "tiles"), measure=False)
    T, til = "stone", B["tiles"]                                   # the wall tiles, just proud of each wall
    op = next(p for p in D.OPENINGS if p["id"] == "bath_window")
    o.box(T, bx0 - 0.6, y, zi - 0.4, xa_ := B["strip_x"] - 1.4, y + til["sill"] - 0.4, zi + 0.4)
    o.box(T, bx0 - 0.6, y + til["sill"] - 0.4, zi - 0.4, op["x"][0] - 0.4, y + til["bath"], zi + 0.4)
    o.box(T, bx0 - 0.8, y, bz0, bx0 - 0.2, y + til["bath"], bz1)    # behind the bath
    o.box(T, xa_ - 0.4, y, zi, xa_ + 0.4, y + til["cheek"], B["box_z"])   # the box's side (v81: level with its top, as the photo)
    o.box(T, B["strip_x"], y, B["box_z"] - 0.4, xw, y + B["box_h"] - 0.5, B["box_z"] + 0.4)   # the box's front (v68: flat-topped)
    o.box(T, xw - 0.4, y, B["box_z"] + 0.4, xw + 0.4, y + til["sink"], -84.5)   # behind the vanity
    o.item("bath.mirror", "Mirror", "bathroom", src="client's photo (27 Oct) + E", data=("BATH", "mirror"), axis="z")
    m = B["mirror"]; (m0, m1), (my0, my1) = m["z"], m["y"]              # v82 (the photo): the mirror over the basin, a thin wood frame, its light bar
    o.box("oak", xw - 2.6, y + my0, m0, xw - 0.4, y + my1, m1)
    o.box("steel", xw - 3.0, y + my0 + 1.5, m0 + 1.5, xw - 2.6, y + my1 - 1.5, m1 - 1.5)   # the glass (as the hall's mirror)
    o.box("black", xw - 5, y + my1 + 1, (m0 + m1) / 2 - 20, xw - 0.4, y + my1 + 3.5, (m0 + m1) / 2 + 20)


SKIRT_ROOMS = {"hall", "landing", "landing_top", "bed3", "master", "master_b", "master_1", "bed2", "kitchen", "kitchen_1", "kitchen_2", "wc", "lower_landing"}
SKIRT_H, SKIRT_T = 10.0, 1.5                                       # E: a 94 mm torus skirting
DOOR_LEAF = {"wc_door": "door_white", "kitchen_door": "door_white", "bath_door": "door_white", "bed2_door": "door_white",
             "master_door": "door_white", "bed3_door": "door_white"}   # v73, the client: the bathroom's is white too (the wood was an old photo)


def skirting(o, floor, rs):
    """v66: skirting round the rooms people use (BUILD_SPEC phase 2), stopping at the doors' frames, the stairwells and the low corners."""
    y = FLOOR_Y[floor]; ds = doors(floor); byid = {r["id"]: r for r in rs}
    zi = DM["face"] + DM["t"]
    for r in rs:
        if r["id"] not in SKIRT_ROOMS:
            continue
        for axis, line, inward, a0, a1 in (("x", r["z0"], 1, r["x0"], r["x1"]), ("x", r["z1"], -1, r["x0"], r["x1"]),
                                            ("z", r["x0"], 1, r["z0"], r["z1"]), ("z", r["x1"], -1, r["z0"], r["z1"])):
            cuts, off = [], 0.0
            for q in rs:                                             # open to its own other pieces, and to a stairwell
                if q is r:
                    continue
                qa0, qa1 = (q["x0"], q["x1"]) if axis == "x" else (q["z0"], q["z1"])
                qline = (q["z1"] if inward > 0 else q["z0"]) if axis == "x" else (q["x1"] if inward > 0 else q["x0"])
                if abs(qline - line) < 1 and (q["room"] == r["room"] or q["room"] in VOID):
                    cuts.append((qa0, qa1)); continue
                g = (line - qline) * inward                              # the gap to the room across
                if -1 <= g <= 30 and qa1 > a0 + 1 and qa0 < a1 - 1 and q["id"] not in NO_WALLS:
                    off = max(off, max(g / 2, 2.0) - g)                  # its wall reaching into this room (they touch: 2)
            for d in ds:
                if d["axis"] == axis and abs(d["line"] - line) < 16:
                    cuts.append((d["a"] - 6, d["b"] + 6))
            if floor == "ground" and r["id"] == "hall" and axis == "z" and inward < 0:
                cuts.append((r["z0"], stair()["z1"]))               # over the lower flight
            if floor == "first" and axis == "x" and abs(line - BACK) < 1:     # the back: only the dormer's face, inside it
                line = zi; cuts += [(a0, DM["x"][0] + DM["t"]), (DM["x"][1] - DM["t"], a1)]
            if floor == "first" and r["id"] == "bed2":                        # not inside the block
                if axis == "z" and inward > 0:
                    cuts.append((r["z0"], D.BED2["block_z"]))
            segs = [(a0, a1)]
            for c0, c1 in cuts:
                nxt = []
                for s0, s1 in segs:
                    if c1 <= s0 or c0 >= s1:
                        nxt.append((s0, s1)); continue
                    if c0 > s0: nxt.append((s0, c0))
                    if c1 < s1: nxt.append((c1, s1))
                segs = nxt
            for s0, s1 in segs:
                if s1 - s0 < 3:
                    continue
                l0, l1 = sorted((line + inward * off, line + inward * (off + SKIRT_T)))
                t0, t1 = sorted((line + inward * off, line + inward * (off + SKIRT_T - 0.6)))   # v72 (B4): the torus's top, stepped back
                if axis == "x":
                    o.box("skirting", s0, y, l0, s1, y + SKIRT_H - 2.5, l1); o.box("skirting", s0, y + SKIRT_H - 2.5, t0, s1, y + SKIRT_H, t1)
                else:
                    o.box("skirting", l0, y, s0, l1, y + SKIRT_H - 2.5, s1); o.box("skirting", t0, y + SKIRT_H - 2.5, s0, t1, y + SKIRT_H, s1)


def door_leaves(o, floor):
    """v66: the doors between the rooms, shut, with a lever handle each side (the cupboards' are chalk_doors and porch)."""
    y = FLOOR_Y[floor]
    for d in doors(floor):
        o.item(d["id"], *DOOR_NAMES.get(d["id"], (d["id"], "")), kind="door", src=door_src(d["id"]), data=door_data(d["id"]), axis=d["axis"])
        m = DOOR_LEAF.get(d["id"])
        if not m:
            continue
        a, b, L = d["a"] + 0.8, d["b"] - 0.8, d["line"]
        hy = y + 100
        if d["id"] in D.BIFOLD and d["axis"] == "x":               # v69: a white bifold, shut: two panels on a top track, a knob
            mid = (a + b) / 2
            for pa, pb in ((a, mid - 0.3), (mid + 0.3, b)):
                o.box(m, pa, y + 1.5, L - 1.5, pb, y + D.DOOR_H - 3, L + 1.5)
                for ya, yb in ((y + 12, y + 92), (y + 108, y + D.DOOR_H - 14)):   # each panel's two recessed fields
                    for s_ in (-1, 1):
                        o.box("gap", pa + 6, ya, L + s_ * 1.5, pb - 6, ya + 0.6, L + s_ * 1.8)
                        o.box("gap", pa + 6, yb - 0.6, L + s_ * 1.5, pb - 6, yb, L + s_ * 1.8)
                        o.box("gap", pa + 6, ya, L + s_ * 1.5, pa + 6.6, yb, L + s_ * 1.8)
                        o.box("gap", pb - 6.6, ya, L + s_ * 1.5, pb - 6, yb, L + s_ * 1.8)
            o.box("steel", a - 0.8, y + D.DOOR_H - 3, L - 2, b + 0.8, y + D.DOOR_H - 0.5, L + 2)      # the track
            for s_ in (-1, 1):
                o.box("chrome", mid - 5, hy - 2, L + s_ * 1.5, mid - 2, hy + 2, L + s_ * 4.5)
            continue
        if d["axis"] == "x":
            o.box(m, a, y + 0.5, L - 1.75, b, y + D.DOOR_H - 0.8, L + 1.75)
            for s_ in (-1, 1):
                o.box("chrome", b - 13, hy, L + s_ * 1.75, b - 4, hy + 2, L + s_ * 5.5)
        else:
            o.box(m, L - 1.75, y + 0.5, a, L + 1.75, y + D.DOOR_H - 0.8, b)
            for s_ in (-1, 1):
                o.box("chrome", L + s_ * 1.75, hy, b - 13, L + s_ * 5.5, hy + 2, b - 4)
        if m == "door_white":                                        # v72 (B4): cottage doors (the landing photos): six boards, five V-joints a face
            for k in range(1, 6):
                c = a + (b - a) * k / 6
                for s_ in (-1, 1):
                    if d["axis"] == "x":
                        o.box("gap", c - 0.3, y + 1.5, L + s_ * 1.75, c + 0.3, y + D.DOOR_H - 1.8, L + s_ * 2.05)
                    else:
                        o.box("gap", L + s_ * 1.75, y + 1.5, c - 0.3, L + s_ * 2.05, y + D.DOOR_H - 1.8, c + 0.3)


def switches(o, floor):
    """v69 (B5): a white light switch beside each room door on both sides (120 up, the latch side: E), not on cupboards or the porch."""
    y = FLOOR_Y[floor] + 117
    rs = [r for r in rooms(floor) if r["id"] not in NO_WALLS and r["room"] not in VOID]
    for d in doors(floor):
        if any(k in d["id"] for k in ("store", "cupboard", "airing", "porch", "front")):
            continue
        L, a, b = d["line"], d["a"], d["b"]
        for r in rs:
            if d["axis"] == "z":
                lo, hi, face, out = r["z0"], r["z1"], None, 0
                if abs(r["x1"] - L) < 10: face, out = r["x1"], -1
                elif abs(r["x0"] - L) < 10: face, out = r["x0"], 1
            else:
                lo, hi, face, out = r["x0"], r["x1"], None, 0
                if abs(r["z1"] - L) < 10: face, out = r["z1"], -1
                elif abs(r["z0"] - L) < 10: face, out = r["z0"], 1
            if face is None or hi <= a or lo >= b:
                continue
            p0 = b + 9 if b + 18 < hi else a - 17                    # beyond the frame, the latch side, inside the room's wall
            p0 = D.SWITCHES_AT.get((d["id"], r["id"]), p0)            # v72: where the client says it is
            if p0 < lo + 1:
                continue
            o.item(f"switch.{d['id']}.{r['id']}", "A light switch", r["room"], kind="switch", src="client" if (d["id"], r["id"]) in D.SWITCHES_AT else "E (latch side, 120 up)", axis=d["axis"])
            if d["axis"] == "z":
                o.box("fitting", face + out * 0.1, y, p0, face + out * 0.9, y + 8.5, p0 + 8.5)
            else:
                o.box("fitting", p0, y, face + out * 0.1, p0 + 8.5, y + 8.5, face + out * 0.9)


def sockets(o, floor):
    """v70 (B5): white double sockets where the rooms need them (survey_data.SOCKETS)."""
    for f, axis, line, out, pos, yy in D.SOCKETS:
        if f != floor:
            continue
        o.item(f"socket.{floor}.{D.SOCKETS.index((f, axis, line, out, pos, yy))}", "A double socket", room_at(floor, line if axis == "z" else pos, pos if axis == "z" else line), kind="socket", src="E (where you'd use one)", axis=axis)
        y = FLOOR_Y[floor] + yy
        if axis == "z":
            o.box("fitting", line + out * 0.1, y, pos - 7.25, line + out * 1.0, y + 8.5, pos + 7.25)
            for dz in (-3.5, 3.5):
                o.box("black", line + out * 1.0, y + 3, pos + dz - 1.1, line + out * 1.3, y + 5.5, pos + dz + 1.1)
        else:
            o.box("fitting", pos - 7.25, y, line + out * 0.1, pos + 7.25, y + 8.5, line + out * 1.0)
            for dx in (-3.5, 3.5):
                o.box("black", pos + dx - 1.1, y + 3, line + out * 1.0, pos + dx + 1.1, y + 5.5, line + out * 1.3)


def contacts(o, floor):
    """v72 (B2): a soft contact shadow under each standing piece (the viewer draws "contact" as a soft dark patch, darkest under the
    middle): they sit on the floor instead of floating, phones too (no ambient occlusion there)."""
    y = FLOOR_Y[floor] + 0.2
    fp = []
    if floor == "first":
        MA, Mu, O, B = D.MASTER, D.MUSIC, D.OFFICE, D.BATH
        mz0 = next(r["z0"] for r in rooms("first") if r["id"] == "master")
        fp += [(MA["bed"]["x"], MA["bed"]["z"]), (MA["chest"]["x"], MA["chest"]["z"]), ((0.0, 200.0), (mz0, mz0 + MA["wardrobes"]["d"]))]
        fp += [((0.0, 35.0), z) for z in MA["bedsides"]]
        dk, cb, kx = Mu["desk"], Mu["chairbed"], Mu["kallax"]
        fp += [(dk["x"], dk["z"]), (dk["ret"]["x"], dk["ret"]["z"]), (cb["x"], (cb["z1"] - cb["d"], cb["z1"])), (kx["x"], (kx["z0"], kx["z0"] + kx["d"])),
               (Mu["amp"]["x"], Mu["amp"]["z"])]
        fp += [(O["desk"]["x"], O["desk"]["z"])]
        v = B["vanity"]; fp += [((WIDTH - v["d"], WIDTH), v["z"]), (B["bath"]["x"], (DM["face"] + DM["t"], DM["face"] + DM["t"] + B["bath"]["l"])),
                                (B["toilet"]["x"], (DM["face"] + DM["t"] + 18, DM["face"] + DM["t"] + B["toilet"]["d"]))]
    elif floor == "ground":
        H_ = D.HALL; fp += [(H_["bench"]["x"], H_["bench"]["z"])] + [(r["x"], r["z"]) for r in H_["racks"]]
    elif floor == "lower":
        t = D.WC["toilet"]; fp += [(t["x"], (BACK + 12, BACK + t["d"]))]
    for (x0, x1), (z0, z1) in fp:
        g = 6.0
        o.box("contact", x0 - g, y, z0 - g, x1 + g, y + 0.3, z1 + g)


def radiator(o, axis, wall, out, a0, a1, y0, y1):
    """v69 (B5): a white steel panel radiator as the photos: a double panel with its fins on top, on two brackets, a valve each end.
    axis: the wall runs along x (a front or back wall at z=wall) or z (a side wall at x=wall); out: +1/-1, the room's side."""
    def put(m, p0, p1, d0, d1, ya, yb):                            # p along the wall, d out from it
        if axis == "x":
            o.box(m, p0, ya, wall + out * d0, p1, yb, wall + out * d1)
        else:
            o.box(m, wall + out * d0, ya, p0, wall + out * d1, yb, p1)
    put("upvc", a0, a1, 3.0, 5.0, y0, y1)                          # the back panel, the convector fins, the front panel
    n = max(4, int((a1 - a0) / 3.0))
    for k in range(n):
        p = a0 + 1 + (a1 - a0 - 2) * k / n
        put("rib", p, p + 0.8, 5.0, 8.0, y0 + 3, y1 - 2)
    put("upvc", a0, a1, 8.0, 10.0, y0, y1)
    for k in range(int((a1 - a0) / 4.5)):                          # the front panel's vertical pressings
        p = a0 + 2 + k * 4.5
        put("gap", p, p + 0.4, 10.0, 10.25, y0 + 2, y1 - 2)
    put("upvc", a0 + 0.5, a1 - 0.5, 4.5, 9.5, y1, y1 + 0.6)       # the grille on top
    for p in (a0 - 4, a1 + 1):                                     # the valves
        put("chrome", p, p + 3, 5.0, 8.0, y0 - 6, y0 + 2)


def hall(o):
    """v67: the hall as the photos show it: the orange tapestry on the stairs' box (v69: hung, folds, its border and tree), the mirror over the bench on the party wall, a shoe rack
    each side of the front door, the radiator opposite."""
    Hh, y = D.HALL, FLOOR_Y["ground"]
    xs = Gm.STAIR_X[0] - 2.2
    o.item("hall.tapestry", "The tapestry", "hall", kind="decor", src="client's photo + E (214 × 230)", data=("HALL", "tapestry"), axis="z")
    t = Hh["tapestry"]                                                         # v69: on the box's side, from the corner by the door down
    ze = Gm.ALC_D - Gm.STAIR_D + 6 + (Gm.STAIR_N - 1) * Gm.STAIR_GOING + Gm.LANDING_D - 1.5   # the box's end (floors_and_fittings' zl1)
    hz0 = next(r["z0"] for r in rooms("ground") if r["id"] == "hall")
    zt0, ze = t["z"] if t["z"] else (hz0 + 0.5, ze)                            # v81: the whole wall, the hall's back corner to the end
    tw, ya, yb = ze - zt0, y + t["y"][0], y + t["y"][1]
    o.box("chrome", xs - 1.2, yb, zt0 + 0.5, xs - 0.2, yb + 1, ze + 1)     # the hanging wire's clips
    n = max(10, round(tw / 15))
    for k in range(n):                                                         # soft folds: strips a little in and out
        za, zb = zt0 + tw * k / n, zt0 + tw * (k + 1) / n
        dx = 0.4 + 0.9 * (k % 2)
        o.box("tapestry", xs - dx - 0.5, ya + (k % 3) * 0.8, za, xs - dx, yb, zb)
    xf = xs - 1.9                                                              # the print, on the front of the folds
    for za, zb, y0_, y1_ in ((zt0, zt0 + 7, ya, yb), (ze - 7, ze, ya, yb), (zt0, ze, yb - 9, yb), (zt0, ze, ya + 2, ya + 10)):
        o.box("tapestry_dark", xf, y0_, za, xf + 0.3, y1_, zb)                 # the darker border
    zc_ = (zt0 + ze) / 2
    kz, ky = min(1.4, tw / 150), (yb - ya) / 218                                # v81: the tree drawn for 150 × 218, grown with the cloth
    o.box("ink", xf - 0.3, ya + 18 * ky, zc_ - 2.5, xf, ya + 120 * ky, zc_ + 2.5)   # the tree: its trunk, roots, branches, leaves
    for dz, dy, w_, h_ in ((-14, 14, 28, 2), (-9, 10, 18, 2)):
        o.box("ink", xf - 0.3, ya + dy * ky, zc_ + dz * kz, xf, ya + dy * ky + h_, zc_ + (dz + w_) * kz)
    for lvl, span in ((120, 26), (140, 38), (160, 46), (180, 40), (198, 28)):
        ly_, sp_ = ya + lvl * ky, span * kz
        o.box("ink", xf - 0.3, ly_ - 22 * ky, zc_ - 1.5, xf, ly_, zc_ + 1.5) if lvl > 120 else None
        o.box("ink", xf - 0.3, ly_ - 1, zc_ - sp_, xf, ly_ + 1, zc_ + sp_)
        for e in (-1, 1):
            o.box("ink", xf - 0.3, ly_ + 1, zc_ + e * sp_ - 1, xf, ly_ + 9, zc_ + e * sp_ + 1)
    for i_ in range(26):                                                       # leaves round the crown
        a_ = i_ / 26 * 2 * math.pi
        lz, ly = zc_ + 52 * kz * math.cos(a_), ya + 165 * ky + 42 * ky * math.sin(a_)
        if ya + 20 < ly < yb - 12:
            o.box("ink", xf - 0.3, ly - 2, lz - 2, xf, ly + 2, lz + 2)
    o.item("hall.mirror", "The hall mirror", "hall", src="client's photo + E", data=("HALL", "mirror"), axis="z")
    m = Hh["mirror"]; xw = WIDTH + 1                                           # the party wall's plaster face (the hall's side)
    o.box("steel", xw - 2.4, y + m["y"][0], m["z"][0], xw, y + m["y"][1], m["z"][1])
    o.box("glass", xw - 2.6, y + m["y"][0] + 3, m["z"][0] + 3, xw - 2.4, y + m["y"][1] - 3, m["z"][1] - 3)
    o.item("hall.bench", "The bench", "hall", src="client's photo + E", data=("HALL", "bench"), axis="z")
    b = Hh["bench"]
    o.box("black", b["x"][0], y, b["z"][0], b["x"][1] - 1.5, y + b["h"], b["z"][1])
    o.box("check", b["x"][0] + 2, y + b["h"], b["z"][0] + 6, b["x"][1] - 3, y + b["h"] + 4, b["z"][1] - 6)
    for r in Hh["racks"]:                                                      # black shoe racks, shoes on the shelves
        o.item(f"hall.rack{Hh['racks'].index(r) + 1}", "Shoe rack " + str(Hh["racks"].index(r) + 1), "hall", src="client's photo + E", data=("HALL", "racks"), axis="z")
        x0, x1, z0, z1, h = r["x"][0], r["x"][1], r["z"][0], r["z"][1], r["h"]
        for xx in (x0, x1 - 1.5):
            for zz in (z0, z1 - 1.5):
                o.box("black", xx, y, zz, xx + 1.5, y + h, zz + 1.5)
        n = int(h // 22)
        for k in range(n):
            yy = y + 6 + k * (h - 8) / n
            o.box("black", x0 + 1.5, yy, z0 + 1.5, x1 - 1.5, yy + 1, z1 - 1.5)
            o.box(("cloth4", "cloth0", "cloth5", "duvet")[k % 4], x0 + 3, yy + 1, z0 + 3, x1 - 3, yy + 9, z1 - 3)
    o.item("hall.radiator", "The hall radiator", "hall", kind="radiator", src="client's photo + E", data=("HALL", "radiator"), axis="z")
    r = Hh["radiator"]
    radiator(o, "z", D.WALL_HALL, 1, r["z"][0], r["z"][1], y + r["y"][0], y + r["y"][1])   # v69: on the moved wall
    o.item("hall.switch", "The hall light switch", "hall", kind="switch", src="client v81", data=("HALL", "switch_z"), axis="z")
    sz = Hh["switch_z"]                                                        # v81: its switch, between it and the tall rack
    o.box("fitting", D.WALL_HALL + 0.1, y + 117, sz, D.WALL_HALL + 0.9, y + 125.5, sz + 8.5)
    # v81: the living room's door, its hall face (the viewer leaves the living room out of the hall's view: it's behind this door);
    # just proud of the living room's own leaf (z 40-44), so the two never share a face
    o.item("living_door", "The living room door", "hall", kind="door", src="M", axis="x", measure=False)
    ld = next(d for d in doors("ground") if d["id"] == "living_door"); hz = next(r["z0"] for r in rooms("ground") if r["id"] == "hall")
    o.box("door_white", ld["a"], y + 0.5, hz - 0.6, ld["b"], y + D.DOOR_H - 0.8, hz - 0.1)
    o.box("chrome", ld["b"] - 12, y + 100, hz - 0.1, ld["b"] - 3, y + 102, hz + 3.7)


# v70: the suite's turned shapes, radius 16 at the rim (stretched to each piece's size)
PAN = [(0, 0), (8, 0), (9, 3), (8.5, 14), (10.5, 24), (14, 33), (16, 39), (16, 41), (14.5, 41.5), (12.5, 39), (6, 27), (0, 25)]
SEAT = [(11.5, 0), (16, 0), (16.8, 1.2), (16, 2.6), (11.5, 2.6), (11, 1.3), (11.5, 0)]
BOWL = [(0, 0), (4, 0), (5, 1.5), (13, 12), (16, 15), (16, 16), (14.5, 16), (12, 13), (4, 3.5), (0, 3.5)]


def toilet(o, m, x0, x1, z0, z1, y, seat_y):
    """A pan from the floor to the seat (its hollow bowl), the seat ring on it, oval to fit x0–x1 by z0–z1."""
    cx, cz, hx, hz = (x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2
    o.lathe(m, cx, y, cz, [(r, h * (seat_y - y) / 41.5) for r, h in PAN], hx / 16, hz / 16)
    o.lathe(m, cx, seat_y, cz, SEAT, (hx + 0.5) / 16, (hz + 0.5) / 16)


def wc(o):
    """v67: the WC as its photo: the yellow low-level cistern under the window and its flush pipe, the yellow pan, the small yellow basin on
    the wall to the right of the door with four white tiles over it, the roll holder, white pipes (survey_data.WC)."""
    W, y = D.WC, FLOOR_Y["lower"]
    zb = BACK + 0.3
    o.item("wc.toilet", "The WC toilet", "wc", src="client's photo + E", data=("WC", "toilet"), axis="x")
    c = W["cistern"]
    o.box("primrose", c["x"][0], y + c["y"][0], zb, c["x"][1], y + c["y"][1], zb + c["d"])
    o.box("chrome", c["x"][1] - 6, y + c["y"][1] - 8, zb + c["d"], c["x"][1] + 2, y + c["y"][1] - 6, zb + c["d"] + 3)
    t = W["toilet"]; tx = (t["x"][0] + t["x"][1]) / 2
    o.box("primrose", tx - 2, y + 40, zb + 6, tx + 2, y + c["y"][0], zb + 10)                  # the flush pipe
    toilet(o, "primrose", t["x"][0] + 3, t["x"][1] - 3, zb + 12, zb + t["d"] - 2, y, y + 39)   # v70: the pan and the seat, turned
    o.box("primrose", t["x"][0] + 1, y + 42, zb + 14, t["x"][1] - 1, y + 46, zb + 18)
    xe = 374.6 + 0.3                                                                          # the east wall's face
    o.item("wc.basin", "The small basin", "wc", src="client's photo + E", data=("WC", "basin"), axis="z")
    bs = W["basin"]; z0, z1 = bs["z"]
    o.lathe("primrose", xe + bs["d"] / 2, y + bs["rim"] - 16, (z0 + z1) / 2, BOWL, bs["d"] / 2 / 16, (z1 - z0) / 2 / 16)   # v70: a bowl
    o.box("chrome", xe + 3, y + bs["rim"], z1 - 9, xe + 9, y + bs["rim"] + 7, z1 - 6)
    o.item("wc.tiles", "The tiles over the basin", "wc", kind="finish", src="client's photo", measure=False)
    tl = W["tiles"]; zm = (tl["z"][0] + tl["z"][1]) / 2; ym = (tl["y"][0] + tl["y"][1]) / 2
    for za_, zb_ in ((tl["z"][0], zm - 0.3), (zm + 0.3, tl["z"][1])):
        for ya_, yb_ in ((tl["y"][0], ym - 0.3), (ym + 0.3, tl["y"][1])):
            o.box("tile_w", xe - 0.2, y + ya_, za_, xe + 0.6, y + yb_, zb_)
    o.box("chrome", xe, y + 92, z0 - 32, xe + 7, y + 94, z0 - 14)                              # the roll holder
    o.box("duvet", xe + 2, y + 80, z0 - 28, xe + 6, y + 92, z0 - 18)
    o.item("wc.pipes", "The pipes", "wc", kind="fitting", src="client's photo", measure=False)
    o.box("upvc", 374.6 + 1, y + 60, zb, WIDTH - 1, y + 63, zb + 3)                             # the white pipes
    o.box("upvc", WIDTH - 5, y + 60, zb, WIDTH - 2, y + 200, zb + 3)


def landing(o):
    """v67: the landing as its photos: the white post-and-rail balustrade along the stairwell, the loft hatch, a smoke alarm, the
    bathroom door's fanlight."""
    L, y = D.LANDING, FLOOR_Y["first"]
    fs = next(r for r in rooms("first") if r["id"] == "first_stairs")
    x0, x1 = L["rail_x"]; h = L["rail_h"]
    za = max(fs["z0"], next(r for r in rooms("first") if r["id"] == "landing")["z0"])        # v77: from the short wall by the bathroom door
    o.item("landing.banister", "The banister", "landing", kind="fitting", src="client's photos + E", data=("LANDING", "rail_x"), axis="z")
    for zz in (za, (za + fs["z1"]) / 2 - 4.5, fs["z1"] - 9):                                   # the posts
        o.box("upvc", x0 - 2, y, zz, x1 + 1, y + h + 8, zz + 9)
    o.box("upvc", x0 - 1, y + h - 7, za, x1 + 0.5, y + h, fs["z1"])                          # the top rail, two rails under it
    for yy in (35.0, 62.0):
        o.box("upvc", x0, y + yy, za, x1 - 1, y + yy + 9, fs["z1"])
    o.box("upvc", x0, y, za, x1 - 1, y + 9, fs["z1"])                                         # its foot
    # v77: the side of the short wall by the bathroom door (in line with the door, the banister ends at it), back to the bathroom's wall
    # over the stairs (the stairwell opens a little further back than the landing, for the headroom)
    o.end()
    bt = next(r for r in rooms("first") if r["id"] == "bathroom")
    o.box("paint", bt["x1"], y - SLAB, fs["z0"], bt["x1"] + (za - bt["z1"]) / 2, y + CEIL, bt["z1"])
    o.item("landing.hatch", "The loft hatch", "landing", kind="fitting", src="client's photos + E", data=("LANDING", "hatch"), axis="x")
    hx, hz = L["hatch"]["x"], L["hatch"]["z"]; yc = y + CEIL                                  # the loft hatch
    o.box("upvc", hx[0] - 4, yc - 1.5, hz[0] - 4, hx[1] + 4, yc - 0.3, hz[1] + 4)
    o.box("gloss", hx[0], yc - 2.2, hz[0], hx[1], yc - 1.5, hz[1])
    o.item("landing.smoke", "The smoke alarm", "landing", kind="fitting", src="E", measure=False)
    o.box("upvc", 330, yc - 4, 60, 342, yc - 0.3, 72)                                          # the smoke alarm
    o.item("landing.fanlights", "The fanlights over the doors", "landing", kind="fitting", src="client v78 + E", data=("LANDING", "fanlight"), measure=False)
    fa, fb = L["fanlight"]
    rs = {r["id"]: r for r in rooms("first")}
    # the bathroom door's fanlight; v78, the client: "the bedroom 3 also has the same window above the door that the bathroom has"
    for did, faces in (("bath_door", ((rs["landing"]["z0"] - 0.1, rs["landing"]["z0"] + 0.4), (rs["bathroom"]["z1"] - 0.4, rs["bathroom"]["z1"] + 0.1))),
                       ("bed3_door", ((rs["landing"]["z1"] - 0.4, rs["landing"]["z1"] + 0.1), (rs["bed3"]["z0"] - 0.1, rs["bed3"]["z0"] + 0.4)))):
        d = next(d_ for d_ in doors("first") if d_["id"] == did)
        for za_, zb_ in faces:
            o.box("glass", d["a"], y + fa, za_, d["b"], y + fb, zb_)
            o.box("upvc", d["a"] - 6, y + fb, za_ - 0.4, d["b"] + 6, y + fb + 5, zb_ + 0.4)


def pendants(o, floor):
    """v67: a ceiling rose, flex and bulb where the photos show one (the WC's has its shade)."""
    y = FLOOR_Y[floor] + CEIL
    ids = {r["id"] for r in rooms(floor)}
    for rid, (px, pz) in D.PENDANTS.items():
        if rid not in ids:
            continue
        o.item("light." + rid, "The ceiling light", rid, kind="light", src="client's photos", data=("PENDANTS", rid), measure=False)
        o.box("upvc", px - 5, y - 2, pz - 5, px + 5, y - 0.3, pz + 5)
        if rid == "wc":
            o.box("primrose", px - 7, y - 32, pz - 7, px + 7, y - 6, pz + 7)
            o.box("upvc", px - 7.2, y - 24, pz - 7.2, px + 7.2, y - 16, pz + 7.2)
        else:
            o.box("upvc", px - 0.4, y - 34, pz - 0.4, px + 0.4, y - 2, pz + 0.4)
            o.box("led", px - 3, y - 41, pz - 3, px + 3, y - 34, pz + 3)


def upper_ceilings(o):
    """The first floor's ceilings (they were open to the roof): in the roof's group, so First still looks in from above."""
    y = FLOOR_Y["first"] + CEIL
    zc = ZC_BACK                                                     # where the back slope reaches the ceiling
    for r in rooms("first"):
        if r["room"] in VOID:
            continue
        # v65, the client saw "a flat sheet through the top dormer roof": a flat ceiling only where the room is full height (under the
        # dormer, or past where the slope reaches it); elsewhere the slope is the ceiling (first_floor_slopes)
        cuts = sorted({r["x0"], r["x1"], *[c for c in DM["x"] if r["x0"] < c < r["x1"]]})
        for xa, xb in zip(cuts, cuts[1:]):
            inside = DM["x"][0] <= xa and xb <= DM["x"][1]
            za = max(r["z0"], DM["face"] + DM["t"]) if inside else max(r["z0"], zc)   # v69: inside the dormer's face, not through it
            if r["room"] == "bathroom":
                za = max(r["z0"], DORMER_BACK)                         # v82: behind the beam the dormer's ceiling is lower (below)
            if za < r["z1"] - 1:
                o.box("ceiling", xa, y, za, xb, y + 2, r["z1"])
    # v82, the client's photo from the bathroom's door: the dormer's ceiling over the toilet and the bath just over the window, and the
    # beam across the whole room at the dormer's front, its face to the door, up to the ceiling there
    yb_ = FLOOR_Y["first"] + D.BATH["beam_y"]; bx0 = min(r["x0"] for r in rooms("first") if r["room"] == "bathroom")
    o.box("ceiling", bx0, yb_, DM["face"] + DM["t"], DM["x"][1] - DM["t"], yb_ + 2, DORMER_BACK - 2)
    o.box("ceiling", bx0, yb_, DORMER_BACK - 2, WIDTH, y + 2, DORMER_BACK)


def lower_ceilings(o):
    """The lower floor's ceilings, under the floor above (they were open to it): white, in the ground floor's group so the Lower button
    still looks in from above."""
    y = FLOOR_Y["lower"] + CEIL
    for r in rooms("lower"):
        if r["id"] in ("lower_stairs",):
            continue
        o.box("artex" if r["id"] in D.ARTEX else "ceiling", r["x0"], y - 2, r["z0"], r["x1"], y, r["z1"])   # V1.13: artex where the photos show it


def build():
    res = {}
    ITEMS.clear()
    for floor in FLOOR_Y:
        o = Out(floor)
        rs, ds = rooms(floor), doors(floor)
        y = FLOOR_Y[floor]
        steps = [lambda: walls_for(o, floor, rs, ds, y, y + CEIL), lambda: outer_walls(o, floor), lambda: floors_and_fittings(o, floor, rs),
                 lambda: skirting(o, floor, rs), lambda: door_leaves(o, floor)]
        if floor == "lower":
            steps += [lambda: stairs(o), lambda: kitchen(o), lambda: wc(o)]
        if floor == "ground":
            steps += [lambda: lower_ceilings(o), lambda: hall(o)]
        if floor == "first":
            steps += [lambda: office(o), lambda: bed2(o), lambda: master(o), lambda: boiler(o), lambda: bathroom(o), lambda: music(o), lambda: landing(o)]
        steps += [lambda: chalk_doors(o, floor), lambda: pendants(o, floor), lambda: switches(o, floor), lambda: sockets(o, floor), lambda: contacts(o, floor)]
        if floor == "first":
            steps.append(lambda: first_floor_slopes(o))
        if floor == "ground":
            steps.append(lambda: porch(o))
        for step in steps:                                   # V1: no piece's tag runs on into the next builder
            o.end(); step(); o.end()
        sizes = room_sizes()
        for rid, r in sizes.items():
            if r["floor"] == floor and r["name"] and (r["x1"] - r["x0"]) * (r["z1"] - r["z0"]) >= 5000:   # say less: no labels on the tiny stores
                w, d = (r["x1"] - r["x0"]) / 100, (r["z1"] - r["z0"]) / 100
                o.labels.append(dict(id=rid, name=r["name"], use=r["use"] if len(r["use"]) <= 16 else "", w=round(w, 1), d=round(d, 1), x=round((r["x0"] + r["x1"]) / 2, 1),
                                     z=round((r["z0"] + r["z1"]) / 2, 1), y=y + 150))
        res[floor] = o
    o = Out("roof"); roof(o); o.end(); upper_ceilings(o); o.end(); res["roof"] = o
    o = Out("street"); street(o); o.end(); res["street"] = o
    return res


MATS = {   # colour, roughness (the 3D room's materials; phase 3 swaps in textures)
    "brick": ("#9a4b36", 0.92), "party": ("#9a4b36", 0.92), "soldier": ("#83402e", 0.9), "paint": ("#f1ede5", 0.85),
    "upvc": ("#f5f5f2", 0.35), "glass": ("#dfe9ee", 0.03), "artex": ("#f3f2ee", 0.97), "brass": ("#c9b58a", 0.3), "rib": ("#e2e2de", 0.5),
    "tile": ("#7b5a4b", 0.85), "ridge": ("#6d4c3f", 0.85), "hung": ("#6f4636", 0.85), "felt": ("#3d3b3a", 0.9),
    "slab": ("#cfc8bb", 0.95), "carpet": ("#cdbfa6", 1.0), "tile_f": ("#d9d4cb", 0.6), "vinyl": ("#cdd8da", 0.6), "concrete": ("#a8a49c", 0.95),
    "earth": ("#8a8173", 1.0), "porch_in": ("#a7a49c", 0.9), "bin": ("#2f3236", 0.6), "recycle": ("#2b5d9a", 0.6), "quarry": ("#b25a43", 0.7), "board": ("#c4b79f", 0.9), "oak": ("#b07a46", 0.55), "fitting": ("#f6f6f3", 0.3),
    "eaves": ("#e7e1d6", 0.9), "garage_blue": ("#2c3b63", 0.45), "garage_white": ("#ecebe7", 0.4), "garage_black": ("#26282a", 0.45), "timber": ("#8a5a35", 0.8), "pane": ("#3a4550", 0.08),
    "gloss": ("#f4f4f1", 0.12), "gap": ("#9b9a95", 0.6), "black": ("#1d1d1f", 0.5), "black_app": ("#1f2023", 0.35), "glass_dark": ("#17191c", 0.1),
    "ring": ("#2b2c2e", 0.6), "steel": ("#c8cacc", 0.25), "steel_dark": ("#8e9195", 0.35), "worktop": ("#26282a", 0.35), "metro": ("#111214", 0.12),
    "chrome": ("#d9dbde", 0.15), "porcelain": ("#e4e6e8", 0.2), "primrose": ("#e3cf5c", 0.25), "tile_w": ("#f2f2ef", 0.2), "tapestry": ("#d9892a", 0.95), "tapestry_dark": ("#a85a14", 0.95), "ink": ("#22180f", 0.9), "skirting": ("#f3f1eb", 0.4), "sill_board": ("#f5f4f0", 0.35), "door_white": ("#efece5", 0.35), "door_wood": ("#b0713f", 0.5), "rug": ("#5b5e66", 1.0), "guitar_red": ("#9b1c1c", 0.25), "amp_grille": ("#2a2a2c", 0.95), "pink": ("#f2c6d6", 0.4), "panel": ("#3b4250", 1.0), "wardrobe_back": ("#e8e6df", 0.6),
    "cloth0": ("#3d4a5c", 0.95), "cloth1": ("#b9b2a6", 0.95), "cloth2": ("#7a2f2f", 0.95), "cloth3": ("#2f3b2f", 0.95), "cloth4": ("#d8d2c4", 0.95), "cloth5": ("#555555", 0.95), "cloth6": ("#9b8b6e", 0.95), "curtain": ("#f4f3ef", 0.9), "stone": ("#cbc6bd", 0.5), "marble": ("#141416", 0.15), "led": ("#ffffff", 0.3), "chalk": ("#222423", 0.85), "storebox": ("#c9c1b2", 0.95), "contact": ("#000000", 1.0), "mattress": ("#f0eee8", 0.9), "trim": ("#5a5d60", 0.5), "gutter": ("#f2f2ef", 0.4), "lead": ("#6c7072", 0.55), "birch": ("#dcc8a2", 0.7), "lycksele": ("#5b6b78", 0.95), "grille": ("#e8dcc4", 0.6), "ceiling": ("#f3f2ee", 0.95),
    "laminate": ("#a9a39a", 0.7), "oak": ("#b8844f", 0.55), "screen": ("#0d0f12", 0.15), "pc_white": ("#eeeeec", 0.3), "pc_glow": ("#dfe6ff", 0.2),
    "pegboard": ("#f4f4f2", 0.6), "ivy": ("#2f5a2b", 0.8), "blind": ("#4a4d52", 0.9), "books": ("#8a3b2e", 0.8), "jar": ("#d9a441", 0.4), "pot": ("#e8e3d8", 0.5),
    "carpet_grey": ("#6f6f73", 1.0), "red_gloss": ("#c8201e", 0.15), "red_back": ("#9d1714", 0.4), "cat": ("#bdbcb8", 1.0), "sisal": ("#cdb88f", 0.9),
    "pink": ("#e8607a", 0.8), "pine": ("#c99a55", 0.55), "pine_dark": ("#7a5a30", 0.6), "wardrobe": ("#f2f1ec", 0.35), "duvet": ("#e9e6df", 0.95), "leather": ("#1f1d1d", 0.45), "check": ("#7d7e86", 0.95),
    "lawn": ("#5f7043", 1.0), "paving": ("#bdb8ae", 0.95), "road": ("#59595c", 0.95), "fence": ("#6b5644", 0.9),
}


def room_lights(floor):
    """v69 (B3): each room's ceiling light: the photos' pendant where there is one (PENDANTS), else the room's middle (E: every room has
    a ceiling point); the viewer lights the room you're in from here."""
    y = FLOOR_Y[floor] + CEIL
    out = []
    for rid, r in room_sizes().items():
        if r["floor"] != floor or any(k in rid for k in ("store_", "airing", "stairs", "cupboard", "porch")):
            continue
        px, pz = D.PENDANTS.get(rid, ((r["x0"] + r["x1"]) / 2, (r["z0"] + r["z1"]) / 2))
        out.append(dict(room=rid, x=round(px, 1), y=round(y - (2 if floor != "first" else 2), 1), z=round(pz, 1)))
    return out


def export():
    out = {k: v.json() for k, v in build().items()}
    for f in FLOOR_Y:                                            # v69: the rooms' ceiling lights
        if f in out:
            out[f]["lights"] = room_lights(f)
    return dict(mats=MATS, floors=out, ridge=[round(RIDGE_Z, 1), round(RIDGE_Y, 1)], est=True)



if __name__ == "__main__":
    e = export()
    n = sum(len(v) for f in e["floors"].values() for v in f["boxes"].values())
    print("boxes", n, "prisms", sum(len(f["prisms"]) for f in e["floors"].values()), "ridge", e["ridge"], "dormer back", round(DORMER_BACK, 1))
    for rid, r in room_sizes().items():
        print(f"  {r['floor']:6} {rid:16} {(r['x1'] - r['x0']) / 100:.2f} × {(r['z1'] - r['z0']) / 100:.2f} m")
