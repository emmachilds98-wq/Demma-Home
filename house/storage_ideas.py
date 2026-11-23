"""N212 (Emma, 21 Nov 2026: "keep storage in mind as its a strange shaped house and needs to be adequate for all our things and displays /
knick nacks"), redrawn to her brief by N223 (23 Nov 2026: "I want storage ideas that are unique and don't take up lots of space so various
small to medium unless there's adequate space, it should be fit with similar design to the living room and office bedroom 3"): small and
medium pieces, each made for its spot in the media wall's and the office's artisan oak (the oak board, through-tenons, a face frame,
face-out ledges); options to look at, never in the plan's build or buy lists (CLAUDE.md: core plan vs options). Each idea is one line
(what, where, size, rough cost, source) and one or more pieces placed in the house's own numbers (survey_data, model): a made piece's size
is its spot's, its cost the oak it takes at the board's price (oak(): media-wall/src/fit.py SOURCES "snowdonoak"); a bought one is a real
product's size and price.

What they keep (DECISIONS, 21 Nov): 100-300 LPs with room to grow, under 2 m of books and games, clothes and shoes, tech, cables and hobby
kit, knick-knacks to show. now() says what each room holds, dead() the odd spaces measured from the model, ideas() what fits them.
The 3D draws a piece with room3d/08_house_catalogue.js's builders (its `cat`, an "idea" kind, the house's own artisan oak), only once it's
shown (Look's floor card, More: Storage ideas); checks() proves each fits (check_model.py). docs/STORAGE.md has the numbers.
python3 house/storage_ideas.py prints them."""
import functools
import math
import model as M
import survey_data as D

FY = M.FLOOR_Y
BOARD = (184.50 / 3, 0.6 * 1.2)   # fit.SOURCES "snowdonoak": an 18 mm oak furniture board 600 × 1200, £184.50 a pack of three
PLY = 22.50                       # fit.SOURCES "wickesply": a 12 mm ply sheet 607 × 1829
MADE = "made to the spot: 18 mm oak board"


def oak(m2, lo=0.0, hi=None):
    """A made piece's rough cost (lo, hi), £5s: its oak (m², a quarter more for the cuts) at the board's price, then to the whole boards
    it takes; plus what else it needs (lo, and hi if more)."""
    r5 = lambda v: int(5 * math.ceil(v / 5 - 1e-9))
    a = m2 * 1.25
    return r5(a * BOARD[0] / BOARD[1] + lo), r5(math.ceil(a / BOARD[1]) * BOARD[0] + (lo if hi is None else hi))


def _room(rid):
    return next(r for f in FY for r in M.rooms(f) if r["id"] == rid)


def _door(did):
    return next(d for f in FY for d in M.doors(f) if d["id"] == did)


@functools.lru_cache(None)
def _bb():
    import export_house
    return export_house._bboxes(M.export())


def _box(iid):
    return _bb()[iid]


def ideas():
    """[dict(id, room, n, what, where, size, cost, ref, src, parts=[dict(cat, box, back)])]: box [x0, y0, z0, x1, y1, z1] in house cm,
    back the side of the box against its wall ("x0", "x1", "z0", "z1"): the piece faces away from it."""
    y1, yl, yg = FY["first"], FY["lower"], FY["ground"]
    out = []
    add = lambda **k: out.append(k)
    # ---------------------------------------------------------------- bedroom 2, the music room: records, face-out ledges, the gear
    mu, kx = D.MUSIC, D.MUSIC["kallax"]
    za = kx["z0"] + kx["d"] + kx["drawer_d"] + 1.0                        # past the Kallax drawers pulled out
    # LP bays 34 high, 33 deep inside (fit "crate": 32.5-33 for a 31.4 sleeve), about 50 LPs to 33 cm of bay (fit "kallax24")
    add(id="records", room="bed2", n="Record cabinet", ref=["snowdonoak", "crate", "kallax24", "wickesply"], cost=oak(2.45, PLY),
        size="110 × 36 × 80", what="a low oak cabinet with a face frame, two rows of three bays: about 250 LPs on edge, one bay shut for the deck's kit",
        where="bedroom 2, the side wall past the slope", src=f"{MADE}; LP bays 34 × 33 inside",
        parts=[dict(cat="st_lpcab", box=[2.0, y1, za, 38.0, y1 + 80.0, za + 110.0], back="x0")])
    add(id="faceout", room="bed2", n="Face-out record ledges", ref=["snowdonoak", "media"], cost=oak(0.26), size="2 × 110 × 9",
        what="two oak ledges with a lip, as the media wall's: six LPs face-out, the ones playing now",
        where="bedroom 2, over the record cabinet", src=f"{MADE}; LP sleeves 31.4",
        parts=[dict(cat="st_faceout", box=[0.0, y1 + v, za, 9.0, y1 + v + 34.0, za + 110.0], back="x0") for v in (116.0, 158.0)])
    cb = mu["chairbed"]
    add(id="pegboard", room="bed2", n="Oak pegboard", ref=["snowdonoak", "oakdowel"], cost=oak(0.36, 5, 15), size="56 × 56",
        what="an oak pegboard over the amp, oak pegs and a small shelf: leads, pedals, picks, the headphones",
        where="bedroom 2, the front wall over the amp", src=f"{MADE}; oak dowel pegs",
        parts=[dict(cat="st_oakpeg", box=[4.0, y1 + 100.0, cb["z1"] - 10.0, 60.0, y1 + 156.0, cb["z1"]], back="z1")])
    # ---------------------------------------------------------------- the master bedroom: ledges over the bed, boxes over the door
    ms = D.MASTER
    (bz0, bz1), bs, hb = ms["bed"]["z"], ms["bedsides"], y1 + ms["bed"]["head_h"]      # the headboard's top
    mid = (bz0 + bz1) / 2
    add(id="ledges", room="master", n="Ledges over the bed", ref="snowdonoak", cost=oak(0.24), size="120 and 2 × 40, 9 deep",
        what="oak ledges with a lip in one line over the bed and the bedsides: frames, a plant, the small things",
        where="master bedroom, the wall behind the bed", src=MADE,
        parts=[dict(cat="st_ledge", box=[0.0, hb + 4.0, c - w / 2, 9.0, hb + 30.0, c + w / 2], back="x0")   # one line, over the headboard
               for c, w in [(mid, 120.0)] + [((a + b) / 2, 40.0) for a, b in bs]])
    md, mx = _door("master_door"), _room("master_b")["x1"]
    add(id="overdoor", room="master", n="A shelf over the door", ref="snowdonoak", cost=oak(0.22), size="90 × 20",
        what="an oak shelf on two through-tenoned brackets over the door: lidded boxes of the off-season and the hats",
        where="master bedroom, over its door", src=f"{MADE}; the media wall's wedged tenons",
        parts=[dict(cat="st_tenshelf", box=[mx - 22.0, y1 + 211.0, md["a"] - 6.0, mx, y1 + 234.0, md["a"] + 84.0], back="x1")])
    # ---------------------------------------------------------------- bedroom 3, the office: the cables and the bits
    of = D.OFFICE
    hz = (of["pc"]["z"][1] + 2 + 346.0) / 2                               # between the two PCs' gear (the second's starts at 346)
    add(id="drawers", room="bed3", n="Oak drawers under the desk", ref=["snowdonoak", "wickesply", "castor50"], cost=oak(1.0, PLY + 4 * 3.29),
        size="28 × 43 × 69", what="a slim oak tower of six drawers on castors between the two PCs: cables, chargers, controllers, the hobby bits",
        where="bedroom 3, under the desk", src=f"{MADE}; ply drawer boxes; four 50 mm castors",
        parts=[dict(cat="st_drawers", box=[D.INSIDE["w"] - 3.0 - 43.0, y1, hz - 14.0, D.INSIDE["w"] - 3.0, y1 + 69.0, hz + 14.0], back="x1")])
    # N241 (Emma, 23 Nov: "books as well as other things and drying clothes"): the office the house's drying room (a radiator, a window
    # to open, a door to shut): a pulley airer over the window, hoisted; the books in a slim tower in the window's corner (over the door
    # the bifold's swing and the fanlight's woodwork are in the way; the desk has its shelf)
    ofr = _room("bed3")
    add(id="airer", room="bed3", n="A ceiling pulley airer", ref="pulleyairer", cost=(75, 99), size="90 × 35",
        what="a pulley airer over the radiator by the window: four laths, hoisted to 17 under the ceiling, lowered to load; dries over the radiator's heat",
        where="bedroom 3, over the window", src="Clothesmaid ceiling airer 0.9 m, £74.99; Cast in Style 6 laths £99",
        parts=[dict(cat="st_airer", box=[345.0, y1 + M.CEIL - 17.0, ofr["z1"] - 35.0, 435.0, y1 + M.CEIL - 0.5, ofr["z1"]], back="z1")])
    add(id="booktower", room="bed3", n="An oak book tower", ref="snowdonoak", cost=oak(1.35), size="50 × 30 × 200",
        what="a slim oak bookcase, six shelves of books and games, in the corner between the cube shelves and the window: about 3 m of spines",
        where="bedroom 3, the window's corner", src=MADE,
        parts=[dict(cat="st_books", box=[283.0, y1, ofr["z1"] - 32.0, 333.0, y1 + 200.0, ofr["z1"] - 2.0], back="z1")])   # clear of the skirting and the window board
    # ---------------------------------------------------------------- the landing: books over the doors, a lit case at the stairs' top
    la, b2 = _room("landing"), _door("bed2_door")
    sy = y1 + D.DOOR_H + 10.0                                             # over the frames' heads (204) and bedroom 2's cap
    add(id="books", room="landing", n="Books over the doors", ref="snowdonoak", cost=oak(0.40), size="2 × 80 × 20",
        what="two oak shelves on through-tenoned brackets over bedroom 2's and the boiler cupboard's doors: paperbacks and game cases, 1.6 m",
        where="the landing, over the doors", src=f"{MADE}; the media wall's wedged tenons",
        parts=[dict(cat="st_tenshelf", box=[la["x0"], sy, z0, la["x0"] + 20.0, y1 + M.CEIL - 0.5, z0 + 80.0], back="x0")
               for z0 in (b2["a"] - 7.0, b2["a"] + 73.0)])
    lt = _room("landing_top")
    gl = max(0.3, (0.51 * 0.76 + 2 * 0.51 * 0.09))                        # its front and two shelves (m², the 0.3 the least charged)
    add(id="glasscase", room="landing", n="A lit glass case", ref=["snowdonoak", "glasscut", "wickesply", "cablight"],
        cost=oak(0.32, gl * 75 + PLY + 17, gl * 95 + PLY + 17), size="55 × 80 × 12",
        what="the living room's glass case made small: an oak frame, a glass front and two glass shelves, a light under its top",
        where="the landing, the end wall at the top of the stairs", src=f"{MADE}; toughened glass cut to size; a USB cabinet light",
        parts=[dict(cat="st_glass", box=[lt["x0"] + 15.0, y1 + 115.0, lt["z1"] - 12.0, lt["x0"] + 70.0, y1 + 195.0, lt["z1"]], back="z1")])
    # ---------------------------------------------------------------- the hall: coats over the bench, the keys over the radiator
    hm, ra = _box("hall.mirror"), _box("hall.radiator")
    hx = _room("hall")["x1"]
    add(id="hooks", room="hall", n="Peg rail and a hat shelf", ref=["pegrail", "snowdonoak"], cost=oak(0.22, 35 + 5 * 2.75), size="79 × 22 × 30",
        what="a Shaker oak peg rail under an oak hat shelf, past the mirror: coats and bags on five pegs, hats and gloves on top",
        where="the hall, over the bench", src="Willow & Stone oak backplate cut to 79, five oak pegs; the shelf made to the spot",
        parts=[dict(cat="st_pegshelf", box=[hx - 22.0, yg + 160.0, hm[5] + 2.0, hx, yg + 190.0, hm[5] + 81.0], back="x1")])
    add(id="radshelf", room="hall", n="A shelf over the radiator", ref="floatshelf", cost=(25, 30), size="90 × 23",
        what="an oak floating shelf over the radiator: keys, post and a tray for the small things",
        where="the hall, over the radiator", src="B&Q oak floating shelf 90 × 23, £24.99",
        parts=[dict(cat="st_float", box=[_room("hall")["x0"], yg + 85.0, (ra[2] + ra[5]) / 2 - 45.0, _room("hall")["x0"] + 23.0, yg + 105.0,
                                         (ra[2] + ra[5]) / 2 + 45.0], back="x0")])
    # ---------------------------------------------------------------- the kitchen: the cookbooks over the bar
    boiler = _box("kitchen.boiler")
    kx1 = _room("kitchen")["x1"]
    add(id="barshelf", room="kitchen", n="A shelf over the bar", ref="floatshelf", cost=(25, 30), size="90 × 23",
        what="an oak floating shelf over the breakfast bar, past the boiler: the cookbooks and the jars",
        where="the kitchen, over the bar", src="B&Q oak floating shelf 90 × 23, £24.99",
        parts=[dict(cat="st_float", box=[kx1 - 23.0, yl + 148.0, boiler[5] + 10.0, kx1, yl + 175.0, boiler[5] + 100.0], back="x1")])
    # ---------------------------------------------------------------- the store under the stairs (room for a bigger piece): tech and hobby kit
    sd, sx1 = _door("store_door"), _box("lower.stair_box")[0]
    H, r = M.hang("lower", sd, 1.75), sd["b"] - sd["a"]                   # the door opens in from its west end: past its arc
    z0 = sd["line"] + H["side"] * ((r * r - (sx1 - 30.5 - H["hinge"]) ** 2) ** 0.5 + 2.0)
    add(id="store", room="lower_store", n="Shelves in the store", ref=["wickesply", "snowdonoak", "kuggis"], cost=oak(0.20, 3 * PLY), size="89 × 30 × 179",
        what="ply shelves with oak lips, as the media wall's crates, on the flight's boxed side: boxes of tech, cables and hobby kit",
        where="the store under the stairs", src="made to the spot: 12 mm ply, oak lips; KUGGIS boxes",
        parts=[dict(cat="st_store", box=[sx1 - 30.5, yl, z0, sx1 - 0.5, yl + 179.0, z0 + 89.0], back="x1")])
    for i in out:
        for p in i["parts"]:
            p["box"] = [round(v, 1) for v in p["box"]]
            p["ax"] = "z" if p["back"][0] == "x" else "x"                 # the axis it runs along
            p["flip"] = p["back"][1] == "1"                               # its back on the box's high side
    return out


def for_3d():
    """What the 3D needs (R.HOUSE3.storage): each idea, its one line, its pieces."""
    return [dict(id=i["id"], room=i["room"], n=i["n"], line=f"{i['what']} · {i['size']} · £{i['cost'][0]}–{i['cost'][1]} · {i['src']}",
                 parts=[dict(cat=p["cat"], b=p["box"], ax=p["ax"], flip=p["flip"]) for p in i["parts"]]) for i in ideas()]


def rows():
    """The plan's table: (what, where, size, (lo, hi), source)."""
    return [(f"{i['n']}: {i['what']}", i["where"], i["size"], i["cost"], i["src"]) for i in ideas()]


# ------------------------------------------------------------------------------------------------ what each room holds now
NOW = {   # room: [(item id, what it holds)]: the model's storage pieces (their outer size from the model, litres)
    "master": [("master.wardrobe1", "a rail 1 m, a shelf, three drawers, boxes on top"), ("master.wardrobe2", "the same"),
               ("master.bed", "the ottoman: four boxes 60 × 40 × 25 under the mattress"), ("master.bedside203", "three drawers"),
               ("master.bedside409", "three drawers"), ("master.chest", "drawers under the window")],
    "bed2": [("music.kallax", "eight cubes, four with two drawers each"), ("music.desk", "the 88-key's tray, no drawers")],
    "bed3": [("office.cubes1", "12 open cubes, artisan oak"), ("office.cubes2", "12 more"), ("office.shelf", "the shelf over the desk"),
             ("office.pegboard", "the pegboard")],
    "landing": [("airing.shelves", "the boiler cupboard's towel shelves"), ("airing.boxes", "its boxes on the floor")],
    "hall": [("hall.rack1", "shoes"), ("hall.rack2", "shoes"), ("hall.bench", "a seat, shoes under")],
    "kitchen": [("kitchen.units", "the base units"), ("kitchen.wall_units", "the wall cupboards")],
}


def now():
    """{room: [(name, what, litres outer)]}."""
    out = {}
    for rid, L in NOW.items():
        out[rid] = []
        for iid, what in L:
            b = _box(iid)
            out[rid].append((M.ITEMS[iid]["name"], what, round((b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]) / 1000)))
    return out


def dead():
    """[(room, the space, size, litres, what it's for)]: the odd spaces, measured from the model."""
    y1, out = FY["first"], []
    bz, bx, lw = D.BED2["block_z"], D.BED2["block_x"], D.BED2["low_wall"]
    n, L = 40, 0.0
    for i in range(n):                                                    # behind the low wall: under the slope, from the back wall to the wall
        za, zb_ = M.BACK + (bz - M.BACK) * i / n, M.BACK + (bz - M.BACK) * (i + 1) / n
        L += (min(lw, M.headroom(1, 2, (za + zb_) / 2) - y1)) * (zb_ - za) * bx
    out.append(("bed2", "the eaves behind the low wall", f"{bx:.0f} × {bz - M.BACK:.0f}, {M.headroom(1, 2, M.BACK) - y1:.0f} to {lw:.0f} high",
                round(L / 1000), "shut: the Kallax drawers stand in front of it (a hatch would need them moved)"))
    kx = D.MUSIC["kallax"]
    over = sum((M.headroom(1, 2, bz + (i + 0.5) * kx["d"] / 10) - y1 - kx["h"]) * kx["d"] / 10 for i in range(10)) * (kx["x"][1] - kx["x"][0])
    out.append(("bed2", "over the Kallax, under the slope", f"{kx['x'][1] - kx['x'][0]:.0f} × {kx['d']:.0f}, a wedge 3 to 50 high", round(over / 1000),
                "a row of boxes on top"))
    head = y1 + D.DOOR_H + 10.0
    for rid, did in (("landing", "bed2_door"), ("landing", "airing_door"), ("landing", "master_door"), ("master", "master_door")):
        d = _door(did)
        w = d["b"] - d["a"] + 14
        out.append((rid, f"over {d['id'].replace('_door', '').replace('bed2', 'bedroom 2').replace('airing', 'the boiler cupboard').replace('master', 'the master')}'s door",
                    f"{w:.0f} × 20, {y1 + M.CEIL - head:.0f} high", round(w * 20 * (y1 + M.CEIL - head) / 1000), "a shelf of books or boxes"))
    st, sb = _room("lower_store"), _box("lower.stair_box")
    a = (sb[0] - st["x0"]) * (st["z1"] - st["z0"])
    out.append(("lower_store", "the store under the stairs, west of the flight", f"{sb[0] - st['x0']:.0f} × {st['z1'] - st['z0']:.0f}, {M.CEIL:.0f} high",
                round(a * M.CEIL / 1000), "empty: shelves on the flight's side, the washer dryer's corner kept"))
    mb = _box("master.bed")
    out.append(("master", "under the bed", f"{mb[3] - mb[0]:.0f} × {mb[5] - mb[2]:.0f}", 4 * 60, "used: the ottoman's four boxes"))
    out.append(("master", "the way past the bed's foot", f"{M.room_sizes()['master']['x1'] - mb[3]:.0f} wide", 0, "kept clear (tight already)"))
    lt = _room("landing_top")
    out.append(("landing", "the end wall at the top of the stairs", f"{lt['x1'] - lt['x0']:.0f} wide, {M.CEIL:.0f} high", 0, "a wall for display"))
    ra = _box("hall.radiator")
    out.append(("hall", "over the radiator", f"{ra[5] - ra[2]:.0f} long", 0, "a shelf for the keys and post"))
    bo = _box("kitchen.boiler")
    out.append(("kitchen", "the wall over the bar past the boiler", f"{_box('kitchen.bar')[5] - bo[5]:.0f} long, the bar's top to the ceiling",
                0, "a shelf for the cookbooks"))
    out.append(("secret", "the unexcavated space under the garage", "", 0, "not usable without digging out"))
    return out


# what a piece may touch: the floors it stands on, the walls it's fixed to (a box's face, not into it: a part is tested 0.5 in from its
# faces), the house's shade and contact boxes (drawn, not solid)
SOFT = {"contact", "shade", "rug", "carpet", "carpet_grey", "laminate", "vinyl", "tile_f", "herring", "lvt_grey", "porcelain", "board"}


def reserves():
    """Space kept clear: (name, box, the piece it's for or None): the Kallax drawers pulled out, the walk past the master's bed, the loft
    hatch's opening, the hall's walk from the front door to the living room's, the store's washer dryer corner (the client, 5 Nov) and its
    walk; bedroom 2's walk from its door to the desk (check_model's "60 to pass" past the chair-bed). N217: the page's swaps and adds keep
    clear of them too (export3d "fit"), but of a piece's own (a swapped Kallax needn't keep its drawers' space)."""
    y1, yl, yg = FY["first"], FY["lower"], FY["ground"]
    kx, st, h, mb = D.MUSIC["kallax"], _room("lower_store"), D.LANDING["hatch"], _box("master.bed")
    kz = kx["z0"] + kx["d"]
    hl, b2, d2 = _room("hall"), _room("bed2"), _door("bed2_door")
    return [("the Kallax drawers' pull", [kx["x"][0], y1, kz, kx["x"][1], y1 + 80, kz + kx["drawer_d"]], "music.kallax")] + [(n, b, None) for n, b in [
            ("the walk past the master's bed", [mb[3], y1, mb[2], M.room_sizes()["master"]["x1"], y1 + 200, mb[5]]),
            ("the walk to the desk", [b2["x1"] - 60.0, y1, D.MUSIC["desk"]["ret"]["z"][1], b2["x1"], y1 + 200, d2["b"]]),
            ("the loft hatch's opening", [h["x"][0], y1 + 150, h["z"][0], h["x"][1], y1 + M.CEIL, h["z"][1]]),
            ("the hall's walk (70 wide)", [hl["x0"] + 4.5, yg, hl["z0"], hl["x0"] + 74.5, yg + 200, 260.0]),
            ("the hall's walk to the front door", [330.0, yg, 260.0, 420.0, yg + 200, hl["z1"]]),
            ("the washer dryer's corner (60 × 60)", [st["x0"], yl, st["z1"] - 60.0, st["x0"] + 60.0, yl + 90.0, st["z1"]]),
            ("the walk into the store (55 wide)", [st["x0"], yl, st["z0"], st["x0"] + 55.0, yl + 200.0, st["z1"] - 60.0])]]


def checks():
    """[(name, ok, note)]: each piece in its room, clear of the house's boxes, the doors' swings, the slopes and the space kept clear; its
    back on a wall or a fixed box; its source cited."""
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "media-wall/src"))
    import fit
    e = M.export()
    sizes = M.room_sizes()
    over = lambda a, b, s=0.5: all(a[i] + s < b[i + 3] and b[i] < a[i + 3] - s for i in range(3))

    def swept(d, H, b, y0):
        """Does box b cut the door's swing (as it opens, model.swing_into: from its hinge, on the side it opens to, 205 high)?"""
        return M.swing_into(d, H, b, y0) > 0.5
    swings = [(f, d, M.hang(f, d, 1.75)) for f in FY for d in M.doors(f) if d["id"] not in ("store_w", "store_e", "hall_porch")]
    swings += [("ground", d, M.hang("ground", d, 1.75)) for d in M.doors("ground") if d["id"] == "hall_porch"]
    res, seen = [], set()
    for i in ideas():
        bad = []
        for p in i["parts"]:
            b, rm = p["box"], sizes[i["room"]]
            if not (rm["x0"] - 1 <= b[0] and b[3] <= rm["x1"] + 1 and rm["z0"] - 1 <= b[2] and b[5] <= rm["z1"] + 1):
                bad.append("outside its room")
            fk = rm["floor"]
            F = e["floors"][fk]
            tags = F.get("tags", [])
            solid = []
            for m, L in F["boxes"].items():
                if m in SOFT or m.startswith("shade"):
                    continue
                for q, t in zip(L, F.get("bt", {}).get(m, [-1] * len(L))):
                    solid.append(q)
                    if over(b, q):
                        bad.append(f"{m} of {tags[t] if t >= 0 else 'the shell'}")
            bad += [f"{d['id']}'s swing" for f, d, H in swings if f == fk and swept(d, H, b, FY[f])]
            bad += [n for n, q, _ in reserves() if over(b, q)]
            if fk == "first":
                top = min(M.headroom(b[0], b[3], z) for z in (b[2], b[5]))
                if b[4] > top + 0.5:
                    bad.append(f"the slope ({top - FY['first']:.0f} there)")
            k, hi = {"x": 0, "z": 2}[p["back"][0]], p["back"][1] == "1"          # its back: on its room's wall, or on a fixed box's face
            c = b[k + 3] if hi else b[k]
            wall = rm["x1" if k == 0 else "z1"] if hi else rm["x0" if k == 0 else "z0"]
            o = [j for j in (0, 1, 2) if j != k]
            fixed = solid + [q for iid, q in _bb().items() if M.ITEMS.get(iid, {}).get("kind") == "fixed"]   # a boxed-in flight's side
            on = abs(c - wall) <= 3 or any(abs((q[k] if hi else q[k + 3]) - c) <= 2 and all(q[j] < b[j + 3] and b[j] < q[j + 3] for j in o) for q in fixed)
            if not on:
                bad.append(f"its back not on a wall ({abs(c - wall):.0f} off)")
        for ref in (i["ref"] if isinstance(i["ref"], list) else [i["ref"]]):
            if ref not in fit.SOURCES:
                bad.append(f"no source {ref}")
        if i["id"] in seen:
            bad.append("its id twice")
        seen.add(i["id"])
        res.append((f"storage idea {i['id']}: fits", not bad, "; ".join(sorted(set(bad))) or f"{i['room']}, {i['size']}"))
    # the ideas' pieces against each other (two shown at once)
    P = [(i["id"], p["box"]) for i in ideas() for p in i["parts"]]
    cl = sorted({f"{a} and {c}" for n, (a, b) in enumerate(P) for c, d in P[n + 1:] if a != c and over(b, d)})
    res.append(("storage ideas: clear of each other", not cl, "; ".join(cl) or f"{len(P)} pieces"))
    return res


if __name__ == "__main__":
    for n, ok, note in checks():
        print("PASS" if ok else "FAIL", n, note)
    print("\nnow:")
    for rid, L in now().items():
        for n, w, l in L:
            print(f"  {rid:8} {n}: {w} ({l} L outer)")
    print("\nodd spaces:")
    for r in dead():
        print("  ", r)
    print("\nideas:")
    for r in rows():
        print("  ·", r)
