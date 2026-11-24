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
import sys
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
    same = lambda P: all([round(q["box"][j + 3] - q["box"][j], 1) for j in range(3)] == [round(P[0]["box"][j + 3] - P[0]["box"][j], 1) for j in range(3)] for q in P)
    return [dict(id=i["id"], room=i["room"], n=i["n"], line=f"{i['what']} · {i['size']} · £{i['cost'][0]}–{i['cost'][1]} · {i['src']}",
                 each=same(i["parts"]),   # N242: a bought option goes in each of its pieces' places (two like shelves), else the first's
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


# ------------------------------------------------------------------------------------------------ N243: places for storage and furniture
# Emma, 23 Nov 2026: "Expand the catalogue you offer for options and where they go to." Each spot is a box the house leaves free (read from
# the model: survey_data, model, the living room's plan in media-wall/src/geometry.py), clear of the doors' swings, the walks and the windows
# as an idea's piece is (checks); what kinds of thing suit it; the catalogue's pieces that fit it (spot_fits). Options to look at only.
USES = ("records", "books", "games", "media", "shoes", "coats", "toys", "laundry", "display", "boxes", "plants",
        "sofa", "armchair", "coffee", "side", "dining", "desk", "bed", "lamp", "rug", "chest", "wardrobe")
# each idea's spot (its first piece's box): what suits it
IDEA_USES = {"records": ["records", "media"], "faceout": ["records", "display"], "pegboard": ["media", "boxes"], "ledges": ["display", "plants"],
             "overdoor": ["boxes", "books"], "drawers": ["media", "boxes"], "airer": ["laundry"], "booktower": ["books", "games", "display"],
             "books": ["books", "games"], "glasscase": ["display"], "hooks": ["coats"], "radshelf": ["boxes", "display"],
             "barshelf": ["books", "display"], "store": ["boxes", "media", "toys"]}


def _new_spots():
    """[dict(id, room, n, at, box, back, uses)]: at "floor" (stands on it; it may turn), "wall" (hung, its back on the wall), "over door",
    "alcove", "slope" (under the roof), "ceiling" (hung from it), "top" (stands on a fixed piece); box [x0, y0, z0, x1, y1, z1] the most
    it may take, house cm; back the side against the wall (the piece faces away from it), "y1" the ceiling."""
    yl, yg, y1, C = FY["lower"], FY["ground"], FY["first"], M.CEIL
    out = []
    sp = lambda i, room, n, at, box, back, uses: out.append(dict(id=i, room=room, n=n, at=at, box=[round(v, 1) for v in box], back=back, uses=uses))
    hd = lambda f: FY[f] + 211.0                                            # over a door's frame head (204) and its swing (205)
    top = lambda f: FY[f] + C - 2.0                                         # 2 under the ceiling
    # ------------------------------------------------ the living room (its plan's pieces from media-wall/src/clash.py)
    G = M.Gm
    wc, wz = G.WALL_CABS, G.WRAP_Z
    sp("lr_overledge", "living", "Over the side wall's ledge", "wall", [0, 195.0, wz[1] + 6, 22.0, 230.0, wz[0] - 8], "x0",
       ["books", "display", "records", "plants"])
    sp("lr_cabtop", "living", "On the wall cabinets", "top", [0, wc["y0"] + G.EKET[2] + 1, wc["z"][1], G.EKET[1], C - 2.0, wc["z"][0]], "x0",
       ["display", "plants", "boxes"])
    lx = G.FLOOR_LAMP_SPOTS["sofa"][1][0] - G.FLOOR_LAMP["base"] / 2
    sp("lr_armend", "living", "By the sofa's arm, at the window", "floor", [G.SOFABED_X[1] + 5, 0, G.SOFA_BACK_Z + 1, lx - 2, G.WINDOW_Y[0] - 3,
       G.SOFA_BACK_Z + 30], "z0", ["side", "plants", "lamp", "records", "display"])
    # ------------------------------------------------ the kitchen
    k, kd, b = _room("kitchen"), _door("kitchen_door"), _box("kitchen.boiler")
    sp("k_overdoor", "kitchen", "Over the kitchen door", "over door", [k["x1"] - 20, hd("lower"), kd["a"] - 3, k["x1"], top("lower"), kd["b"] + 3], "x1",
       ["books", "boxes", "display"])
    sp("k_airer", "kitchen", "Over the floor by the washer", "ceiling", [105.0, yl + C - 34, -250.0, 225.0, yl + C, -204.0], "y1", ["laundry"])
    # ------------------------------------------------ the WC
    w = _room("wc")
    sp("wc_shelf", "wc", "Beside the window, over the toilet", "wall", [w["x1"] - 18, yl + 130, w["z0"] + 14, w["x1"], yl + 225, w["z0"] + 57], "x1",
       ["boxes", "display", "plants"])
    sp("wc_cab", "wc", "Over the basin", "wall", [w["x0"], yl + 140, -245.0, w["x0"] + 15, yl + 200, -195.0], "x0", ["boxes", "display"])
    sp("wc_corner", "wc", "The corner past the toilet", "floor", [w["x1"] - 28, yl, -237.0, w["x1"] - 2, yl + 80, -200.0], "x1", ["boxes", "laundry"])
    # ------------------------------------------------ the bathroom (the back slope over its east side)
    bt, bd = _room("bathroom"), _door("bath_door")
    sp("bath_overdoor", "bathroom", "Over the bathroom door", "over door", [bd["a"], hd("first"), bt["z1"] - 22, bd["b"], top("first"), bt["z1"] - 2], "z1",
       ["boxes", "display"])
    b1 = _room("bathroom_1")
    sp("bath_tower", "bathroom", "Beside the vanity", "floor", [b1["x1"] - 32, y1, -82.0, b1["x1"] - 2, y1 + 180, b1["z1"] - 2], "x1", ["boxes", "laundry"])
    sp("bath_slope", "bathroom", "Under the slope past the toilet", "slope", [412.0, y1, -250.0, b1["x1"] - 2, M.headroom(412.0, b1["x1"] - 2, -250.0) - 1, -195.0],
       "x1", ["laundry", "boxes"])
    # ------------------------------------------------ the hall
    h, fd, ld = _room("hall"), _door("hall_porch"), _door("living_door")
    sp("hall_overfront", "hall", "Over the front door", "over door", [fd["a"] - 5, hd("ground"), h["z1"] - 20, fd["b"] + 5, top("ground"), h["z1"]], "z1",
       ["boxes", "books", "display"])
    sp("hall_overliving", "hall", "Over the living room door", "over door", [h["x0"] + 2, hd("ground"), h["z0"], 376.0, top("ground"), h["z0"] + 20], "z0",
       ["books", "display", "boxes"])
    sp("hall_bymirror", "hall", "Past the mirror, by the stairs", "floor", [h["x1"] - 29, yg, 264.0, h["x1"] - 2, yg + 90, 291.0], "x1",
       ["shoes", "side", "boxes", "plants"])
    sp("hall_stairside", "hall", "High along the stairs' side", "wall", [360.0, hd("ground"), 70.0, 378.0, top("ground"), 250.0], "x1", ["books", "display"])
    # ------------------------------------------------ the landing
    la, b3 = _room("landing"), _door("bed3_door")
    sp("land_overbath", "landing", "Over the bathroom door", "over door", [bd["a"], hd("first"), la["z0"] + 2, bd["b"], top("first"), la["z0"] + 22], "z0",
       ["books", "boxes", "display"])
    sp("land_overoffice", "landing", "Over the office door", "over door", [b3["a"] - 5, hd("first"), la["z1"] - 22, b3["b"] + 5, top("first"), la["z1"] - 2], "z1",
       ["books", "games", "boxes"])
    sp("land_byoffice", "landing", "By the office door, under the switch", "floor", [la["x0"] + 2, y1, 234.0, la["x0"] + 24, y1 + 110, la["z1"] - 2], "x0",
       ["books", "display", "plants", "boxes"])
    # ------------------------------------------------ under the stairs (the store)
    st = _room("lower_store")
    sp("store_overwasher", "lower_store", "Over the washer dryer", "wall", [st["x0"], yl + 92, st["z1"] - 25, st["x0"] + 60, top("lower"), st["z1"]], "z1",
       ["laundry", "boxes"])
    sd, sx1 = _door("store_door"), _box("lower.stair_box")[0]
    H, r = M.hang("lower", sd, 1.75), sd["b"] - sd["a"]
    zs = sd["line"] + H["side"] * ((r * r - (sx1 - 30.5 - H["hinge"]) ** 2) ** 0.5 + 2.0) + 90.0   # past the store idea's shelves
    sp("store_end", "lower_store", "The store's far end, past the shelves", "floor", [st["x0"] + 61.0, yl, zs, sx1 - 0.5, yl + 200, st["z1"] - 2], "x1",
       ["boxes", "media", "toys", "laundry", "shoes"])
    sp("store_high", "lower_store", "High over the way in", "wall", [st["x0"], yl + 206, st["z0"] + 9, st["x0"] + 20, top("lower"), st["z1"] - 63], "x0",
       ["boxes", "coats"])
    # ------------------------------------------------ bedroom 2
    b2, d2 = _room("bed2"), _door("bed2_door")
    sp("bed2_overdoor", "bed2", "Over its door", "over door", [b2["x1"] - 20, hd("first"), d2["a"] - 3, b2["x1"], top("first"), d2["b"] + 3], "x1",
       ["records", "books", "boxes", "display"])
    # ------------------------------------------------ the master bedroom
    ms, m1 = _room("master"), _room("master_1")
    sp("master_corner", "master", "The corner past the bedside", "floor", [ms["x0"] + 2, y1, 453.0, 47.0, y1 + 200, ms["z1"] - 2], "x0",
       ["laundry", "plants", "lamp", "books", "display"])
    sp("master_bywindow", "master", "Past the bed's foot, by the window", "floor", [m1["x1"] - 37, y1, 410.0, m1["x1"] - 2, y1 + 200, 452.0], "x1",
       ["books", "display", "boxes", "shoes", "chest"])
    # ------------------------------------------------ bedroom 3, the office
    of = _room("bed3")
    sp("office_low", "bed3", "Under the cube shelves", "floor", [270.5, y1, 308.0, 300.5, y1 + 108, 344.0], "x0",
       ["boxes", "media", "games", "books"])
    sp("office_overdoor", "bed3", "Over its door", "over door", [b3["a"] - 5, hd("first"), of["z0"] + 2, b3["b"] + 5, top("first"), of["z0"] + 22], "z0",
       ["books", "games", "boxes"])
    # ------------------------------------------------ the garage
    g = _room("garage")
    sp("garage_wall", "garage", "The garage's side wall", "floor", [g["x0"], yg - 15, 100.0, g["x0"] + 45, yg + 200, 235.0], "x0",
       ["boxes", "toys", "shoes", "coats"])
    return out


@functools.lru_cache(None)
def _spots():
    out = []
    for i in ideas():                                                     # the ideas' own places first (their pieces' boxes)
        p = i["parts"][0]
        b = p["box"]
        at = "ceiling" if p["cat"] == "st_airer" else "floor" if b[1] in FY.values() else "over door" if i["id"] in ("overdoor", "books") else "wall"
        out.append(dict(id=i["id"], room=i["room"], n=i["where"].split(", ", 1)[-1].capitalize(), at=at, box=b, back=p["back"],
                        uses=IDEA_USES.get(i["id"], ["boxes"]), idea=i["id"], new=False))
    out += [dict(s, new=True) for s in _new_spots()]
    for s in out:
        b, k = s["box"], s["back"]
        a = 2 if k in ("x0", "x1") else 0                                 # along its wall
        s["w"], s["d"], s["h"] = round(b[a + 3] - b[a], 1), round(b[2 - a + 3] - b[2 - a], 1), round(b[4] - b[1], 1)
        if k == "y1":
            s["w"], s["d"] = round(b[3] - b[0], 1), round(b[5] - b[2], 1)
        s["face"] = {"x0": "+x", "x1": "-x", "z0": "+z", "z1": "-z", "y1": "down"}[k]
    return out


def spots():
    """Every place a piece can go: the ideas' own and N243's (see _new_spots), each with w (along its wall), d (out from it), h, its facing."""
    return [dict(s) for s in _spots()]


# a catalogue piece's uses from its kind, where its row gives none (N219's rooms' pieces)
KIND_USES = {"records": ["records", "toys", "media"], "shelves": ["books", "display", "games"], "display": ["display"], "shoes": ["shoes"],
             "chest": ["boxes", "chest"], "bedside": ["boxes", "side"], "tv": ["media", "games"], "sideboard": ["media", "boxes"],
             "lamp": ["lamp"], "coffee": ["coffee"], "side": ["side"], "console": ["side", "display"], "dining": ["dining"], "seat": ["armchair"],
             "rug": ["rug"], "desk": ["desk"], "bed": ["bed"], "wardrobe": ["wardrobe"], "deskchair": [], "stool": [], "toilet": [], "basin": []}
AT_ON = {"floor": "floor", "slope": "floor", "alcove": "floor", "top": "floor", "wall": "wall", "over door": "wall", "ceiling": "ceil"}


def piece_on(q):
    """Where a catalogue piece goes: "floor", "wall" (hung) or "ceil"."""
    return q.get("on") or ("wall" if str(q.get("look", "")).startswith("st_") else "floor")


def piece_uses(q):
    """What a piece is for: its row's "use", else (N242) its spots' uses, else its kind's."""
    if q.get("use"):
        return q["use"]
    if q.get("spots"):
        return sorted({u for i in q["spots"] for u in IDEA_USES.get(i, [])})
    return KIND_USES.get(q["kind"], [])


def fits_spot(q, s):
    """Does catalogue piece q go in spot s: its kind of place, a use the spot suits, its size (a free-standing piece may turn; 1 cm spare)."""
    if piece_on(q) != AT_ON[s["at"]] or not set(piece_uses(q)) & set(s["uses"]):
        return False
    w, d, h = q["w"], q["d"], q.get("h") or 1
    if h > s["h"] + 1:
        return False
    ok = lambda a, b: a <= s["w"] + 1 and b <= s["d"] + 1
    return ok(w, d) or (s["at"] in ("floor", "top", "ceiling") and ok(d, w))


@functools.lru_cache(None)
def _fits():
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "media-wall/src"))
    import fit
    out = {s["id"]: [] for s in _spots()}
    for q in fit.shop_pieces() + fit.opt_pieces() + fit.cat_pieces():
        key = fit.shop_key(q)
        for s in _spots():
            if (s["id"] in q.get("spots", []) or fits_spot(q, s)) and key not in out[s["id"]]:
                out[s["id"]].append(key)
    return out


def spot_fits():
    """{spot id: [catalogue keys (fit.shop_key) that fit it]}: N219's, N242's (its own spots too) and N243's pieces."""
    return {k: list(v) for k, v in _fits().items()}


def _tester():
    """The fit test the ideas and the spots share: why(box, room, back) -> [what it hits]: outside its room, the house's solid boxes (and in
    the living room its plan's pieces), the doors' swings, the space kept clear, the slopes or the ceiling, its back off a wall ("y1": off
    the ceiling; None: free-standing, no back to test)."""
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "media-wall/src"))
    e = M.export()
    sizes = dict(M.room_sizes())
    lv = M.living_shell()
    sizes["living"] = dict(floor="ground", x0=lv["box"][0], x1=lv["box"][1], z0=lv["box"][2], z1=lv["box"][3])
    over = lambda a, b, s=0.5: all(a[i] + s < b[i + 3] and b[i] < a[i + 3] - s for i in range(3))
    swings = [(f, d, M.hang(f, d, 1.75)) for f in FY for d in M.doors(f) if d["id"] not in ("store_w", "store_e", "hall_porch")]
    swings += [("ground", d, M.hang("ground", d, 1.75)) for d in M.doors("ground") if d["id"] == "hall_porch"]
    solid = {}
    for fk, F in e["floors"].items():
        tags, L = F.get("tags", []), []
        for m, B in F["boxes"].items():
            if m in SOFT or m.startswith("shade"):
                continue
            L += [(q, f"{m} of {tags[t] if t >= 0 else 'the shell'}") for q, t in zip(B, F.get("bt", {}).get(m, [-1] * len(B)))]
        solid[fk] = L
    fixed = {fk: [q for q, _n in L] for fk, L in solid.items()}
    fixed_items = [q for iid, q in _bb().items() if M.ITEMS.get(iid, {}).get("kind") == "fixed"]   # a boxed-in flight's side
    living = [([x[0], y[0], z[0], x[1], y[1], z[1]], n) for n, x, y, z in _living_pieces()]          # the living room's plan (its own scene)

    def why(b, rid, back):
        rm, bad = sizes[rid], []
        if not (rm["x0"] - 1 <= b[0] and b[3] <= rm["x1"] + 1 and rm["z0"] - 1 <= b[2] and b[5] <= rm["z1"] + 1):
            bad.append("outside its room")
        fk = rm["floor"]
        bad += [n for q, n in solid[fk] + (living if rid == "living" else []) if over(b, q)]
        bad += [f"{d['id']}'s swing" for f, d, H in swings if f == fk and M.swing_into(d, H, b, FY[f]) > 0.5]
        bad += [n for n, q, _ in reserves() if over(b, q)]
        top = FY[fk] + M.CEIL
        if fk == "first":
            top = min(M.headroom(b[0], b[3], z) for z in (b[2], b[5]))
            if b[4] > top + 0.5:
                bad.append(f"the slope ({top - FY['first']:.0f} there)")
        elif b[4] > top + 0.5:
            bad.append("the ceiling")
        if back == "y1":
            if abs(b[4] - top) > 3:
                bad.append(f"not on the ceiling ({abs(b[4] - top):.0f} off)")
        elif back:
            k, hi = {"x": 0, "z": 2}[back[0]], back[1] == "1"          # its back: on its room's wall, or on a fixed box's face
            c = b[k + 3] if hi else b[k]
            wall = rm["x1" if k == 0 else "z1"] if hi else rm["x0" if k == 0 else "z0"]
            o = [j for j in (0, 1, 2) if j != k]
            on = abs(c - wall) <= 3 or any(abs((q[k] if hi else q[k + 3]) - c) <= 2 and all(q[j] < b[j + 3] and b[j] < q[j + 3] for j in o)
                                           for q in fixed[fk] + fixed_items)
            if not on:
                bad.append(f"its back not on a wall ({abs(c - wall):.0f} off)")
        return bad
    return why, over


def _living_pieces():
    """The living room's plan as boxes (media-wall/src/clash.py: its own scene, in the house's numbers), and the face-out LPs on the side
    wall's ledge (sleeves 31.4 standing on it)."""
    import clash
    G = M.Gm
    return clash.pieces() + [("the LPs on the side wall's ledge", (0, 9), (G.LEDGE_TOP, G.LEDGE_TOP + 33), (G.WRAP_Z[1], G.WRAP_Z[0]))]


def checks():
    """[(name, ok, note)]: each piece in its room, clear of the house's boxes, the doors' swings, the slopes and the space kept clear; its
    back on a wall or a fixed box; its source cited. N243: each new spot the same; every room has one; every catalogue piece fits one."""
    why, over = _tester()
    import fit
    res, seen = [], set()
    for i in ideas():
        bad = []
        for p in i["parts"]:
            bad += why(p["box"], i["room"], p["back"])
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
    S, bad = spots(), []
    for s in S:
        if s["new"]:
            b = why(s["box"], s["room"], None if s["at"] in ("floor", "slope", "alcove") else s["back"])
            if b:
                bad.append(f"{s['id']}: {'; '.join(sorted(set(b)))}")
    ids = [s["id"] for s in S]
    bad += [f"{q} twice" for q in sorted({q for q in ids if ids.count(q) > 1})]
    rooms = {s["room"] for s in S}
    bad += [f"no spot in {r}" for r in sorted({"living", "kitchen", "wc", "bathroom", "hall", "landing", "lower_store", "bed2", "master", "bed3"} - rooms)]
    res.append(("storage spots (N243): each clear, one in every room", not bad, "; ".join(bad) or f"{len(S)} spots in {len(rooms)} rooms"))
    F, cat = spot_fits(), fit.cat_pieces()
    placed = {k for L in F.values() for k in L}
    empty = [s["id"] for s in S if not F[s["id"]]]
    nosrc = [q["name"] for q in cat if fit.shop_key(q) not in fit.SOURCES]
    keys = [fit.shop_key(q) for q in cat]
    twice = sorted({q["name"] for q, k in zip(cat, keys) if keys.count(k) > 1})
    nosrc += [f"{u} (not a use)" for u in sorted({u for x in cat + S for u in (piece_uses(x) if "kind" in x else x["uses"])} - set(USES))]
    res.append(("catalogue (N243): each piece cited, each spot with pieces that fit", not empty and not nosrc and not twice,
                "; ".join([f"nothing fits {i}" for i in empty] + [f"no source {n}" for n in nosrc] + [f"{n} twice" for n in twice])
                or f"{len(cat)} pieces from {len({q['retailer'] for q in cat})} shops; {len(placed)} of all the shops' pieces fit a spot"))
    return res


# rooms a piece of furniture suits (N244's set-ups): by its use
ROOM_USES = {"living": ["sofa", "armchair", "coffee", "side", "lamp", "rug", "records", "books", "display", "media", "plants", "games"],
             "kitchen": ["dining", "boxes", "laundry", "books"], "wc": ["boxes"], "bathroom": ["boxes", "laundry"],
             "hall": ["shoes", "coats", "side", "boxes", "rug"], "landing": ["books", "display", "rug"], "lower_store": ["boxes", "laundry", "toys", "media"],
             "bed2": ["records", "media", "armchair", "desk", "books", "games", "lamp", "rug", "bed"],
             "master": ["bed", "chest", "wardrobe", "side", "lamp", "rug", "armchair", "display", "laundry"],
             "bed3": ["desk", "books", "games", "media", "boxes", "armchair", "lamp", "rug", "laundry"], "garage": ["boxes", "toys", "shoes", "coats"]}


def for_page():
    """N243's data for the page (_site/data/ideas.json, written by tools/build.py; fetched when wanted, not in the page): the spots, the
    catalogue's rows, what fits where and which rooms suit what. The shape: docs/NOTES.md ("N243: the ideas data")."""
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "media-wall/src"))
    import fit, export3d
    F = spot_fits()
    rows = {}
    for q in fit.shop_pieces() + fit.opt_pieces() + fit.cat_pieces():
        r = export3d.cat_row(q)
        rows.setdefault(r[0], r)
    used = {k for L in F.values() for k in L}
    return dict(v=1, cols=["key", "kind", "look", "name", "shop", "w", "d", "h", "price", "url", "mat", "mat2", "count", "on", "uses"],
                spots=[dict(id=s["id"], room=s["room"], n=s["n"], at=s["at"], b=s["box"], back=s["back"], face=s["face"], w=s["w"], d=s["d"], h=s["h"],
                            uses=s["uses"], **({"idea": s["idea"]} if s.get("idea") else {})) for s in _spots()],
                pieces=list(rows.values()), fits=F, rooms=ROOM_USES, n=dict(spots=len(_spots()), pieces=len(rows), placed=len(used)))


if __name__ == "__main__" and "--page" in sys.argv:          # N243: tools/build.py writes the page's ideas data (_site/data/ideas.json)
    import json, pathlib
    _out = pathlib.Path(sys.argv[sys.argv.index("--page") + 1])
    _out.parent.mkdir(parents=True, exist_ok=True)
    _out.write_text(json.dumps(for_page(), separators=(",", ":"), ensure_ascii=False))
    print(_out.name, round(_out.stat().st_size / 1024), "KB")
elif __name__ == "__main__":
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
    print("\nspots (N243):")
    F = spot_fits()
    for s in spots():
        print(f"  {s['room']:11} {s['id']:16} {s['at']:9} {s['w']:g} × {s['d']:g} × {s['h']:g}  {','.join(s['uses'])}: {len(F[s['id']])} fit")
