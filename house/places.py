"""N286 (Emma, 25 Nov 2026: "make specific fittings for areas that you deem would fit and make sense to have furniture"): every room's
places, designed. A place is a named area of a room (inside its real walls, never its bounding box), the side it backs onto, what belongs
there (the catalogue's kinds and their uses) and what never goes there, with one line why (docs/DESIGN.md's rules). Ideas (N287) only
ever puts a piece in a place that takes it.

Two sorts, one list: the walls' places, found by walking each real wall of the room in 5 cm steps (a piece backed onto it, clear of the
house, the doors' swings, the walks kept clear and the slopes: storage_ideas._tester, the same test the storage ideas pass), cut where its
height changes and named from what's beside it; N243's nooks (storage_ideas.spots: over the doors, ledges, the ceiling airers); and the
open floor (a rug's or a table's, the biggest clear rectangle). Each kind's rules are KINDS; each room's design ROOMS.
python3 house/places.py prints them; check_model.py runs checks()."""
import functools
import sys
import model as M
import storage_ideas as SI

FY = M.FLOOR_Y
STEP = 10.0

# What each room is for and the kinds that belong in it at all (HCAT kinds: 08_house_catalogue.js). DESIGN.md "Each room".
ROOMS = {
    "living": ("sitting, the screen, the records", ["shelves", "unit", "seat", "lamp", "table", "plant", "rug"]),
    "kitchen": ("cooking, the bar, the laundry", ["unit", "shelves", "trolley", "table", "dchair", "plant"]),
    "wc": ("a small room: only slim storage", ["shelves", "unit"]),
    "hall": ("the way in: coats, shoes, the keys", ["shoes", "seat", "unit", "shelves", "plant", "rug"]),
    "lower_store": ("kept things, the washer dryer", ["shelves", "unit", "chest", "shoes"]),
    "landing": ("a way through: slim pieces, books on show", ["shelves", "unit", "plant", "rug"]),
    "bathroom": ("towels and the bathroom's things", ["unit", "shelves", "chest"]),
    "bed2": ("the music room: records, the desk, a chair to listen", ["shelves", "unit", "seat", "lamp", "rug", "chest", "desk", "plant"]),
    "master": ("sleeping and clothes: calm, low pieces", ["wardrobe", "chest", "bedside", "seat", "lamp", "rug", "shelves", "plant"]),
    "bed3": ("the office and the drying room", ["desk", "shelves", "unit", "chest", "seat", "lamp", "rug", "plant"]),
    "garage": ("tools, bikes, the boxes", ["shelves", "unit", "chest", "shoes"]),
    "garden": ("eating and sitting out", ["gtable", "gchair", "gsofa", "plant"]),
}
NAMES = {"living": "the living room", "kitchen": "the kitchen", "wc": "the WC", "hall": "the hall", "lower_store": "the store",
         "landing": "the landing", "bathroom": "the bathroom", "bed2": "bedroom 2", "master": "the master bedroom", "bed3": "the office",
         "garage": "the garage", "garden": "the garden"}

# Each kind's rules: depth it needs (cm), least width, least height, room kept in front (DESIGN.md "Room to move"), where it goes
# ("wall": backed on one, "open": on the open floor, "corner"), and its rule in a line.
KINDS = {
    "wardrobe": dict(d=50, w=79, h=180, clr=90, on="wall", why="a long blank wall, 90 cm in front to open the doors and choose"),
    "chest": dict(d=35, w=40, h=60, clr=75, on="wall", why="drawers on a wall, 75 cm to pull them out and stand"),
    "bedside": dict(d=30, w=35, h=45, clr=0, on="wall", why="at the bed's side, its top near the mattress"),
    "desk": dict(d=45, w=80, h=75, clr=90, on="wall", why="under or beside a window, 90 cm behind for the chair, never its back to the door"),
    "shelves": dict(d=20, w=35, h=75, clr=60, on="wall", why="on a wall, 60 cm in front to reach"),
    "unit": dict(d=30, w=40, h=45, clr=60, on="wall", why="a low unit on a wall, 60 cm in front to open it"),
    "shoes": dict(d=20, w=45, h=40, clr=60, on="wall", why="by a door in, where shoes come off"),
    "seat": dict(d=60, w=55, h=75, clr=45, on="wall", why="a chair with 45 cm for the legs and a lamp at its shoulder"),
    "lamp": dict(d=25, w=25, h=130, clr=0, on="corner", why="a lamp in a corner, by a seat or the bed"),
    "plant": dict(d=30, w=30, h=60, clr=0, on="corner", why="a plant in a corner, out of the way"),
    "table": dict(d=60, w=60, h=75, clr=90, on="open", why="a table on the open floor, 90 cm round it to pull out a chair"),
    "dchair": dict(d=45, w=45, h=75, clr=0, on="open", why="round the table"),
    "trolley": dict(d=45, w=60, h=90, clr=50, on="wall", why="a trolley on a wall by the worktop"),
    "rug": dict(d=80, w=80, h=1, clr=0, on="open", why="on the open floor, 20–45 cm of floor showing at the walls"),
    "gtable": dict(d=60, w=60, h=75, clr=90, on="open", why="on the lawn by the house, 90 cm round it"),
    "gchair": dict(d=55, w=55, h=70, clr=0, on="open", why="round the table"),
    "gsofa": dict(d=75, w=130, h=75, clr=45, on="open", why="facing the garden, 45 cm in front"),
}
# N243's nooks: their uses to kinds
USE_KINDS = {"books": ["shelves"], "records": ["shelves", "unit"], "display": ["shelves", "unit"], "boxes": ["shelves", "unit", "chest"],
             "games": ["shelves", "unit"], "media": ["unit"], "shoes": ["shoes"], "coats": ["shelves"], "toys": ["chest", "shelves"],
             "laundry": ["unit"], "plants": ["plant"], "lamp": ["lamp"], "side": ["table"], "chest": ["chest"]}
OUT_DOORS = {"hall_porch", "front_door", "back_door", "garage_door", "living_door", "store_door"}   # where shoes and coats come off


def _parts(rid):
    """The room's real outline: its traced pieces [(x0, x1, z0, z1)] and its floor."""
    if rid == "living":
        lv = M.living_shell()["box"]
        return "ground", [tuple(lv)]
    L = [(f, r) for f in FY for r in M.rooms(f) if r["room"] == rid]
    return L[0][0], [(r["x0"], r["x1"], r["z0"], r["z1"]) for _f, r in L]


def inside(b, rid):
    """Is box b's footprint inside the room's real walls (its pieces, not their bounding box)? 1 cm spare."""
    if rid == "garden":
        g = _yard()
        return g[0] - 1 <= b[0] and b[3] <= g[1] + 1 and g[2] - 1 <= b[2] and b[5] <= g[3] + 1
    _f, P = _parts(rid)
    xs = [b[0] + 1 + (b[3] - b[0] - 2) * i / 8 for i in range(9)]
    zs = [b[2] + 1 + (b[5] - b[2] - 2) * i / 8 for i in range(9)]
    return all(any(p[0] <= x <= p[1] and p[2] <= z <= p[3] for p in P) for x in xs for z in zs)


def _yard():
    return [M.RO["e"] + 20, M.RO["w"] - 90, M.RO["n"] - 700, M.RO["n"] - 100, M.D.LEVELS["lawn"]]   # export3d's yard (N280)


@functools.lru_cache(None)
def _test():
    return SI._tester()


RES = {n for n, _b, _p in SI.reserves()}


def _why(b, rid, back, soft=False):
    """What box b hits (storage_ideas' test) or leaves (the room's real walls). soft: only the house (a piece's front room may cross a
    walk or a door's swing)."""
    bad = [] if inside(b, rid) else ["outside its room"]
    if rid == "garden":
        return bad
    bad += [w for w in _test()[0](b, rid, back) if w != "outside its room"]
    if soft:
        bad = [w for w in bad if "swing" not in w and w not in RES and "back not on" not in w]
    return bad


def _items(rid, floor):
    """The room's pieces and openings: [(id, kind, name, box)]."""
    bb = SI._bb()
    grp = {k for k, v in M.GROUP.items() if v == rid} | {rid}
    return [(k, v["kind"], v["name"], bb[k]) for k, v in M.ITEMS.items() if k in bb and (v["room"] in grp or v.get("floor") == floor and
            v["kind"] in ("door", "window") and inside([bb[k][0] - 30, 0, bb[k][2] - 30, bb[k][3] + 30, 0, bb[k][5] + 30], rid))]


def _cells(rid):
    """Walk each real wall: [(side, line, a, hmax, face)] a 5 cm cell's tallest free piece (45 deep) backed on it."""
    f, P = _parts(rid)
    y0, out = FY[f], []
    for p in P:
        for side in ("x0", "x1", "z0", "z1"):
            ax = 0 if side[0] == "x" else 2                      # the wall's normal axis
            line = p[0 if side == "x0" else 1 if side == "x1" else 2 if side == "z0" else 3]
            a0, a1 = (p[2], p[3]) if ax == 0 else (p[0], p[1])
            s = 1 if side[1] == "0" else -1                      # into the room
            a = a0
            while a + STEP <= a1 + 0.01:
                best = 0
                ok = lambda h: not _why(_box(ax, line, s, a, a + STEP, y0, 30, h), rid, side)
                if ok(45):                                       # most cells are blocked: try the lowest first, then the tallest
                    best = next(h for h in (210, 180, 120, 90, 75, 45) if ok(h))
                out.append((side, line, a, best, s))
                a += STEP
    return f, out


def _box(ax, line, s, a0, a1, y0, d, h):
    """A piece's box backed on the wall at line, 2 cm off it (the skirting), d deep into the room (s), along a0..a1."""
    n0, n1 = sorted((line + s * 2, line + s * (2 + d)))
    return [n0, y0, a0, n1, y0 + h, a1] if ax == 0 else [a0, y0, n0, a1, y0 + h, n1]


def _wall_places(rid):
    f, C = _cells(rid)
    y0, out = FY[f], []
    runs, cur = [], None
    for c in C + [(None, 0, 0, 0, 0)]:
        side, line, a, h, s = c
        if cur and side == cur[0] and line == cur[1] and abs(a - cur[3]) < 0.1 and h == cur[4]:
            cur[3] = a + STEP
            continue
        if cur and cur[4] >= 45 and cur[3] - cur[2] >= 35:
            runs.append(cur)
        cur = [side, line, a, a + STEP, h, s] if side else None
    its = _items(rid, f)
    for side, line, a0, a1, h, s in runs:
        ax = 0 if side[0] == "x" else 2
        d = next((d for d in (60, 50, 45, 40, 35, 30) if not _why(_box(ax, line, s, a0, a1, y0, d, h), rid, side)), 0)
        if not d:
            continue
        b = _box(ax, line, s, a0, a1, y0, d, h)
        clr = next((c for c in (90, 75, 60, 45) if not _why(_box(ax, line + s * (d + 2), s, a0, a1, y0, c, 100), rid, None, soft=True)), 0)
        out.append(_describe(rid, f, dict(at="floor", back=side, box=[round(v, 1) for v in b], w=round(a1 - a0, 1), d=d, h=h, clr=clr), its))
    return out


def _describe(rid, f, p, its):
    """Name the place from what's beside it; what belongs (KINDS against its size and context), what never goes there, why."""
    b, side = p["box"], p["back"]
    ax, al = (0, 2) if side[0] == "x" else (2, 0)
    near = lambda q, m=30: q[al] - m < b[al + 3] and b[al] < q[al + 3] + m
    on_wall = lambda q, m=25: (q[ax] - m <= b[ax] <= q[ax + 3] + m) if side[1] == "0" else (q[ax] - m <= b[ax + 3] <= q[ax + 3] + m)
    win = [(n, q) for i, k, n, q in its if k == "window" and near(q, 0) and on_wall(q, 45)]
    sw = {d["id"]: (d, M.hang(f, d, 1.75)) for d in M.doors(f)}
    grow = [b[0] - 30, b[1], b[2] - 30, b[3] + 30, b[4], b[5] + 30]
    doors = [(i, n, q) for i, k, n, q in its if k == "door" and (M.swing_into(sw[i][0], sw[i][1], grow, FY[f]) > 0 if i in sw else near(q, 40) and q[al + 3] - q[al] < 200)]
    rads = [n for i, k, n, q in its if k == "radiator" and near(q, 10) and on_wall(q)]
    furn = [(n, q) for i, k, n, q in its if k in ("furniture", "appliance", "fitting", "radiator") and near(q, 8) and on_wall(q, 70)
            and q[4] > FY[f] + 20 and q[1] < FY[f] + 150]                 # a piece standing beside it (not a floor cover or a fanlight)
    never = []
    if win:
        sill = min(q[1] for _n, q in win) - FY[f] - 3
        if p["h"] > sill:
            p["h"] = max(0, round(sill))
            p["box"][4] = round(FY[f] + p["h"], 1)
        never.append(f"the window's sill and curtains (under {p['h']:.0f} cm)")
    never += [f"{n[0].lower() + n[1:]}'s swing" for _i, n, _q in doors]
    never += [f"the face of {n[0].lower() + n[1:]}" for n in rads]
    if f == "first" and p["h"] < 180:
        never.append("the slope's low end")
    mid = lambda q: (q[al] + q[al + 3]) / 2
    if win:
        name = "Under the window"
    elif furn:
        n, _q = min(furn, key=lambda t: abs(mid(t[1]) - mid(b)))
        name = f"Beside {n[0].lower() + n[1:]}"
    elif doors:
        name = f"By {doors[0][1][0].lower() + doors[0][1][1:]}"
    else:
        bed = [q for i, k, n, q in its if "bed" in i and k == "furniture"]
        name = "The wall facing the bed" if bed and not near(bed[0], 0) else f"The {_side_name(side)}"
    corner = p["w"] <= 80 or any(abs(b[al] - q) < 3 or abs(b[al + 3] - q) < 3 for q in _ends(rid, side, b))
    entry = any(i in OUT_DOORS for i, _n, _q in doors) or rid in ("hall", "garage")
    beds = [q for i, k, n, q in its if i.endswith(".bed") or i == "master.bed"]
    kinds = []
    for k in ROOMS[rid][1]:
        R = KINDS[k]
        if R["on"] == "open" or p["w"] + 1 < R["w"] or p["d"] + 1 < R["d"] or p["h"] + 1 < R["h"] or p["clr"] + 1 < R["clr"]:
            continue
        if k == "wardrobe" and win:
            continue
        if k == "desk" and not (win or any(near(q, 100) and on_wall(q, 45) for _n, q in [(n, q) for i, kk, n, q in its if kk == "window"])):
            continue
        if k == "desk" and any(not on_wall(q, 60) and q[ax] * 0 == 0 and _faces(b, side, q) for _i, _n, q in doors):
            continue
        if k == "shoes" and not entry:
            continue
        if k == "bedside" and not any(near(q, 5) and on_wall(q, 5) for q in beds):
            continue
        if R["on"] == "corner" and not corner:
            continue
        kinds.append(k)
    p.update(room=rid, n=name, kinds=kinds, never=never, why="; ".join(KINDS[k]["why"] for k in kinds[:2]) or "too tight for a piece")
    return p


def _side_name(side):
    """The wall's side in words: the house's front faces the street (high z), its east end is x0."""
    return {"z1": "front wall", "z0": "back wall", "x0": "east wall", "x1": "west wall"}[side]


def _ends(rid, side, b):
    """The ends of the wall run the place is on (the room's corners along it)."""
    _f, P = _parts(rid)
    al = 2 if side[0] == "x" else 0
    return [v for p in P for v in ((p[2], p[3]) if al == 2 else (p[0], p[1]))]


def _faces(b, side, q):
    """Is door box q on the wall facing this place (a desk there sits with its back to the door)?"""
    ax = 0 if side[0] == "x" else 2
    return (q[ax] > b[ax + 3] + 100) if side[1] == "0" else (q[ax + 3] < b[ax] - 100)


def _open_place(rid):
    """The open floor's biggest clear rectangle (20 cm grid, clear of the house to 75 high): a rug's; a table's when also clear of the
    walks and the swings with 90 round it."""
    f, P = _parts(rid) if rid != "garden" else ("ground", [tuple(_yard()[:4])])
    y0 = FY[f] if rid != "garden" else _yard()[4]
    X0, X1, Z0, Z1 = min(p[0] for p in P), max(p[1] for p in P), min(p[2] for p in P), max(p[3] for p in P)
    g = 20.0
    nx, nz = int((X1 - X0) // g), int((Z1 - Z0) // g)
    free = [[not _why([X0 + i * g, y0, Z0 + j * g, X0 + (i + 1) * g, y0 + 75, Z0 + (j + 1) * g], rid, None, soft=True) for i in range(nx)] for j in range(nz)]
    best, H = (0, 0, 0, 0, 0), [0] * nx
    for j in range(nz):                                              # the biggest rectangle of free cells (histograms)
        H = [H[i] + 1 if free[j][i] else 0 for i in range(nx)]
        st = []
        for i in range(nx + 1):
            h = H[i] if i < nx else 0
            s0 = i
            while st and st[-1][1] >= h:
                s0, hh = st.pop()
                if hh * (i - s0) > best[0]:
                    best = (hh * (i - s0), s0, i, j - hh + 1, j + 1)
            st.append((s0, h))
    _a, i0, i1, j0, j1 = best
    if not _a:
        return None
    b = [X0 + i0 * g, y0, Z0 + j0 * g, X0 + i1 * g, y0 + 1, Z0 + j1 * g]
    w, d = b[3] - b[0], b[5] - b[2]
    if min(w, d) < 80:
        return None
    walks = not _why([b[0], y0, b[2], b[3], y0 + 75, b[5]], rid, None)
    kinds = [k for k in ROOMS[rid][1] if KINDS[k]["on"] == "open" and (k == "rug" or walks and min(w, d) >= KINDS[k]["d"] + 2 * KINDS[k]["clr"] * (k in ("table", "gtable")))]
    kinds = [k for k in kinds if not (k == "dchair" and "table" not in kinds or k == "gchair" and "gtable" not in kinds)]   # chairs go round a table
    if not kinds:
        return None
    return dict(room=rid, n="The open floor" if rid != "garden" else "The lawn", at="open", back=None, box=[round(v, 1) for v in b],
                w=round(w, 1), d=round(d, 1), h=1, clr=0, kinds=kinds, never=[] if walks else ["the walks through the room (a rug only)"],
                why="; ".join(KINDS[k]["why"] for k in kinds[:2]))


def _nooks():
    """N243's spots as places: their own kinds from their uses (only those the room takes)."""
    out = []
    for s in SI.spots():
        ks = ROOMS.get(s["room"], ("", []))[1]
        kinds = sorted({k for u in s["uses"] for k in USE_KINDS.get(u, []) if k in ks})
        if s["at"] in ("wall", "over door", "ceiling"):
            kinds = ["wall"]                                        # a hung piece (the catalogue's "on": "wall"), shelves and ledges
        out.append(dict(room=s["room"], n=s["n"], at=s["at"], back=s["back"], box=s["box"], w=s["w"], d=s["d"], h=s["h"], clr=0, kinds=kinds,
                        never=[], why=f"made for it: {', '.join(s['uses'][:3])}", nook=s["id"]))
    return out


@functools.lru_cache(None)
def _all():
    out = []
    for rid in ROOMS:
        if rid not in ("living", "garden"):
            L = [p for p in _wall_places(rid) if p["kinds"]]
            out += L
        o = _open_place(rid)
        if o:
            out.append(o)
    out += _nooks()
    seen = {}
    for p in out:                                                   # ids and names unique in their room
        base = p.get("nook") or f"{p['room']}_{p['at']}"
        seen[base] = seen.get(base, 0) + 1
        p["id"] = base if p.get("nook") else f"{base}{seen[base]}"
    for rid in ROOMS:
        L = [p for p in out if p["room"] == rid]
        for n in {p["n"] for p in L}:
            S = [p for p in L if p["n"] == n]
            if len(S) > 1:
                for p in S:
                    p["n"] = f"{n}, {_side_name(p['back'])}" if p["back"] in ("x0", "x1", "z0", "z1") and not n.startswith("The ") else n
            S = [p for p in L if p["n"].startswith(n)]
            for i, p in enumerate([q for q in S if [r["n"] for r in S].count(q["n"]) > 1][1:], 2):
                p["n"] = f"{p['n']} ({i})"
    return out


def places():
    """Every place: dict(id, room, n, at, back, box [x0, y0, z0, x1, y1, z1] house cm, w along its wall, d, h, clr in front, kinds,
    never, why)."""
    return [dict(p) for p in _all()]


def for_page():
    """data/ideas.json v2's places (N287 reads them)."""
    return [dict(id=p["id"], room=p["room"], n=p["n"], at=p["at"], back=p["back"], b=p["box"], w=p["w"], d=p["d"], h=p["h"], clr=p["clr"],
                 kinds=p["kinds"], never=p["never"], why=p["why"]) for p in _all()]


def checks():
    """[(name, ok, note)]: each place in its room's real walls, clear of the house, the swings, the walks and the windows; every room has
    places; every place takes a kind; its kinds belong in its room."""
    bad, P = [], _all()
    for p in P:
        if p["at"] == "open":
            b = p["box"][:4] + [p["box"][1] + 75] + p["box"][5:]
            w = _why(b, p["room"], None, soft="rug" in p["kinds"] and len(p["kinds"]) == 1)
        elif p.get("nook"):
            w = [] if inside(p["box"], p["room"]) or p["room"] == "living" else ["outside its room"]   # the rest: storage_ideas.checks
        else:
            w = _why(p["box"], p["room"], p["back"])
        if w:
            bad.append(f"{p['id']}: {'; '.join(sorted(set(w)))}")
        if not p["kinds"]:
            bad.append(f"{p['id']}: takes nothing")
        off = [k for k in p["kinds"] if k != "wall" and k not in ROOMS[p["room"]][1]]
        if off:
            bad.append(f"{p['id']}: {', '.join(off)} don't belong in {p['room']}")
    rooms = {p["room"] for p in P}
    bad += [f"no place in {r}" for r in ROOMS if r not in rooms]
    ids = [p["id"] for p in P]
    bad += [f"{i} twice" for i in sorted({i for i in ids if ids.count(i) > 1})]
    return [("places (N286): each inside its room, clear of the house, swings and walks; every room has some", not bad,
             "; ".join(bad) or f"{len(P)} places in {len(rooms)} rooms")]


if __name__ == "__main__":
    for n, ok, note in checks():
        print("PASS" if ok else "FAIL", n, note)
    for p in places():
        if "--all" in sys.argv or not p.get("nook"):
            print(f"{p['room']:11} {p['id']:16} {p['n'][:38]:38} {p['w']:5g}×{p['d']:<4g}×{p['h']:<4g} clr {p['clr']:<3} {','.join(p['kinds'])}"
                  + (f"  · never: {'; '.join(p['never'])}" if p["never"] else ""))
