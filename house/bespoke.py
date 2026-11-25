"""N289 (Emma, 25 Nov 2026: "design any bespoke furniture needed to fit our design if you can't find available furniture"): made to
measure where the shops fall short. Each piece is drawn to its place's size (house/places.py) in the house's style (artisan oak, the
living room's and the office's look) by one parametric builder in room3d/08_house_catalogue.js (its `look`), with its boards and
fittings, a rough cost from cited prices (fit.SOURCES: snowdonoak, wickesply, runners350, joinerday) and one line: what, where, size,
cost, source. Options only: no build steps or buy rows till she picks one.

Two sorts: each N288 gap (places.gaps(), but the small-plant corners: any pot does) gets the piece that fits it; and the plan's named
made-to-measure pieces (REAL_PLAN N289) where a place takes them: over-door shelves, the records unit and its face-out ledge, the
under-slope cupboard, the under-stairs pull-outs, the hall bench with shoes under it, alcove shelves over a cupboard.
python3 house/bespoke.py prints them; check_model.py runs checks()."""
import functools
import sys
import model as M
import places as P

OAK_M2 = 184.50 / 3 / (0.6 * 1.2)        # SOURCES snowdonoak: 18 mm oak board, 600 × 1200, £184.50 for three: £85 a m²
PLY_M2 = 22.50 / (0.607 * 1.829)         # SOURCES wickesply: 12 mm ply, 607 × 1829, £22.50: £20 a m²
RUNNERS = 9.49                           # SOURCES runners350: soft-close ball-bearing runners, 350 mm, a pair
DAY = (198, 300)                         # SOURCES joinerday: a joiner's day, UK average £198 (hamuch) to £300 (Checkatrade)
WASTE = 1.25                             # a quarter more board for the cuts (E)
HINGE, PEG, CASTOR = 3.0, 2.75, 3.29     # a hinge (E), SOURCES pegrail's oak peg, castor50

# Each type: its name, the builder (`look`), what it is in a line, and from the place's (w, d, h): its size, oak and ply in m², its
# fittings [(what, how many, £ each)], a joiner's days. Sizes in cm.
def _oak(*faces):
    return sum(a * b for a, b in faces) / 1e4


TYPES = {
    "overdoor": dict(n="Over-door oak shelf", look="st_tenshelf", what="an oak shelf over the door on two tenoned brackets",
                     size=lambda w, d, h: (w - 1, min(d, 20), min(h, 22)),
                     oak=lambda W, D, H: _oak((W, D), (D, 18), (D, 18)), fit=lambda W, D, H: [("screws and plugs", 1, 4)], days=0.5),
    "records": dict(n="Records unit, face-out on top", look="st_lpcab", what="two rows of three LP bays, a face frame, a shut bay for the deck's kit",
                    size=lambda w, d, h: (w, min(d, 36), min(h, 80)),
                    oak=lambda W, D, H: _oak((H, D), (H, D), (W, D), (W, D), (W, D), (H, D), (H, D), (W, 10)), ply=lambda W, D, H: _oak((W, H)),
                    fit=lambda W, D, H: [("hinges", 2, HINGE)], days=2),
    "faceout": dict(n="Face-out record ledge", look="st_faceout", what="a lipped oak ledge, three sleeves face-out",
                    size=lambda w, d, h: (w, min(d, 9), min(h, 34)), oak=lambda W, D, H: _oak((W, D), (W, 4)),
                    fit=lambda W, D, H: [("screws and plugs", 1, 4)], days=0.25),
    "slope": dict(n="Under-slope cupboard", look="mf_slope", what="an oak cupboard whose top follows the roof, two doors, a shelf",
                  size=lambda w, d, h: (w, min(d, 45), h), oak=lambda W, D, H: _oak((W, H), (D, H), (D, H), (W, D), (W, D)), ply=lambda W, D, H: _oak((W, H)),
                  fit=lambda W, D, H: [("hinges", 4, HINGE), ("knobs", 2, 4)], days=1.5),
    "pullout": dict(n="Under-stairs pull-outs", look="mf_pullout", what="two oak-fronted ply towers on runners, shelves inside",
                    size=lambda w, d, h: (w, d, h), oak=lambda W, D, H: _oak((W, H)), ply=lambda W, D, H: _oak((D, H), (D, H), (D, H), (D, H), *[(W, D)] * 5),
                    fit=lambda W, D, H: [("heavy runners, a pair", 2, RUNNERS * 3), ("handles", 2, 6)], days=2),
    "bench": dict(n="Hall bench, shoes under", look="mf_bench", what="an oak seat over two open shoe shelves",
                  size=lambda w, d, h: (w, min(d, 35), 45), oak=lambda W, D, H: _oak((W, D), (D, H), (D, H), (W, D), (W, D), (W, 7)),
                  fit=lambda W, D, H: [], days=1),
    "alcove": dict(n="Alcove shelves over a cupboard", look="mf_alcove", what="a low oak cupboard, 40 deep, with open shelves over it to 200",
                   size=lambda w, d, h: (w, min(d, 40), min(h, 200)), oak=lambda W, D, H: _oak((W, 80), (W, 40), (W, D), (H, D), (H, D), *[(W, 25)] * 4),
                   ply=lambda W, D, H: _oak((W, H)), fit=lambda W, D, H: [("hinges", 4, HINGE), ("knobs", 2, 4)], days=2),
    "wallcab": dict(n="Shallow oak wall cabinet", look="mf_wallcab", what="a slim oak cabinet over the basin, one door, a shelf",
                    size=lambda w, d, h: (w, min(d, 15), h), oak=lambda W, D, H: _oak((W, H), (D, H), (D, H), (W, D), (W, D), (W, D)),
                    ply=lambda W, D, H: _oak((W, H)), fit=lambda W, D, H: [("hinges", 2, HINGE), ("a knob", 1, 4)], days=1),
    "sidetable": dict(n="Slim oak side table", look="mf_sidetable", what="a narrow oak table with a shelf, for a cup and a lamp at the sofa's arm",
                      size=lambda w, d, h: (w - 1, d - 1, min(h, 60)), oak=lambda W, D, H: _oak((W, D), (W, D), (H, D), (H, D)),
                      fit=lambda W, D, H: [], days=0.5),
    "lamp": dict(n="Slim oak floor lamp", look="mf_lamp", what="a square oak stem on a weighted foot, a linen drum shade",
                 size=lambda w, d, h: (min(w, d), min(w, d), min(h, 150)), oak=lambda W, D, H: _oak((W, W), (H, 16)),
                 fit=lambda W, D, H: [("lamp kit, flex and holder", 1, 15), ("linen drum shade", 1, 20)], days=0.5),
    "pegboard": dict(n="Oak pegboard", look="st_oakpeg", what="an oak board drilled for oak pegs, a lipped shelf",
                     size=lambda w, d, h: (w, min(d, 10), h), oak=lambda W, D, H: _oak((W, H), (W, D)),
                     fit=lambda W, D, H: [("oak pegs", 8, PEG)], days=0.5),
    "airer": dict(n="Ceiling pulley airer, made to length", look="st_airer", what="cast-iron rack ends, four pine laths cut to the place, a pulley",
                  size=lambda w, d, h: (w, min(d, 38), min(h, 17)), oak=lambda W, D, H: 0,
                  fit=lambda W, D, H: [("Clothesmaid kit with laths cut to length", 1, 74.99 + 15 * max(0, (W - 90) / 30))], days=0.25),
}
# The plan's named pieces, where a place takes them (a nook's id, or the place's own); the gaps' pieces by what their place takes.
NAMED = {"records": "records", "faceout": "faceout", "bath_slope": "slope", "store": "pullout", "hall_floor3": "bench",
         "landing_floor4": "alcove", "landing_floor5": "alcove"}
GAP_TYPE = {"wall": "wallcab", "lamp": "lamp", "table": "sidetable"}


def _type_for(p, gap):
    """The type a place gets: its named piece, an over-door shelf over a door, or for a gap the piece its kinds take."""
    if p["id"] in NAMED:
        return NAMED[p["id"]]
    if p["at"] == "over door":
        return "overdoor"
    if not gap:
        return None
    if p["id"] == "pegboard":
        return "pegboard"
    if p["at"] == "ceiling":
        return "airer"
    for k in ("table", "lamp", "wall"):
        if k in p["kinds"]:
            return GAP_TYPE[k]
    return None


def _slope(p):
    """An under-slope place: the roof's height over each end of the wall it backs on, (at the low coordinate, at the high one)."""
    b, f0 = p["box"], M.FLOOR_Y["first"]
    if p["back"][0] == "x":
        return tuple(round(M.headroom(b[0], b[3], z) - f0 - 1, 1) for z in (b[2] + 1, b[5] - 1))
    return tuple(round(min(M.headroom(x, x + 1, z) for z in (b[2], b[5])) - f0 - 1, 1) for x in (b[0] + 1, b[3] - 2))


@functools.lru_cache(None)
def _all():
    G, out = P.gaps(), []
    for p in P.places():
        gap = p["id"] in G and not G[p["id"]].startswith("only a small plant")
        t = _type_for(p, gap)
        if not t:
            continue
        T = TYPES[t]
        W, D, H = (round(v, 1) for v in T["size"](p["w"], p["d"], p["h"]))
        ends = None
        if t == "slope":
            ends = _slope(p)
            H = min(max(ends), 180)
        oak, ply = T["oak"](W, D, H) * WASTE, T.get("ply", lambda *a: 0)(W, D, H) * WASTE
        fit = T["fit"](W, D, H)
        mats = oak * OAK_M2 + ply * PLY_M2 + sum(n * c for _w, n, c in fit)
        lo, hi = round(mats + T["days"] * DAY[0], -1), round(mats + T["days"] * DAY[1], -1)
        boards = ", ".join(x for x in (f"{oak:.2f} m² of 18 mm oak" if oak else "", f"{ply:.2f} m² of 12 mm ply" if ply else "") if x)
        fits = ", ".join(f"{n} {w}" if n > 1 else w for w, n, _c in fit)
        size = f"{W:g} × {D:g} × {H:g}" + (f" (the roof {min(ends):g} to {max(ends):g})" if ends else "")
        out.append(dict(id=f"mf_{p['id']}", place=p["id"], room=p["room"], type=t, n=T["n"], look=T["look"], w=W, d=D, h=H, ends=ends,
                        boards=boards, fittings=fits, days=T["days"], cost=(lo, hi), gap=gap,
                        line=f"{T['n']}: {T['what']}; {P.NAMES[p['room']]}, {p['n'][0].lower() + p['n'][1:]}; {size} cm; "
                             f"about £{lo:,.0f}–{hi:,.0f} ({boards}{', ' if boards and fits else ''}{fits}; "
                             f"a joiner {T['days']:g} day{'s' if T['days'] > 1 else ''}; fit.SOURCES madefit)"))
    return out


def pieces():
    """Every made-to-fit piece: dict(id, place, room, type, n, look, w, d, h, ends (an under-slope piece's roof heights at each end),
    boards, fittings, days, cost (lo, hi £), gap (made for an N288 gap), line)."""
    return [dict(m) for m in _all()]


def for_page():
    """data/ideas.json's "made" rows: [id, place, look, name, w, d, h, lo £, hi £, line, ends]."""
    return [[m["id"], m["place"], m["look"], m["n"], m["w"], m["d"], m["h"], m["cost"][0], m["cost"][1], m["line"], m["ends"]] for m in _all()]


def checks():
    """Each piece inside its place (W, D, H; an under-slope piece under the roof at both ends), a builder for its look, a cost; every
    N288 gap but the small-plant corners has its piece."""
    import pathlib
    js = (pathlib.Path(__file__).resolve().parents[1] / "media-wall/src/room3d/08_house_catalogue.js").read_text()
    bad, PL = [], {p["id"]: p for p in P.places()}
    for m in _all():
        p = PL[m["place"]]
        if m["w"] > p["w"] + 0.5 or m["d"] > p["d"] + 0.5 or (m["h"] > p["h"] + 0.5 and not m["ends"]):
            bad.append(f"{m['id']}: {m['w']} × {m['d']} × {m['h']} over its place {p['w']} × {p['d']} × {p['h']}")
        if m["ends"] and min(m["ends"]) < p["h"] - 2:
            bad.append(f"{m['id']}: its low end {min(m['ends'])} under the place's {p['h']}")
        if f"  {m['look']}: {{" not in js:
            bad.append(f"{m['id']}: no builder {m['look']}")
        if not 0 < m["cost"][0] <= m["cost"][1]:
            bad.append(f"{m['id']}: no cost")
    G = P.gaps()
    made = {m["place"] for m in _all()}
    bad += [f"{g}: a gap with no piece" for g, why in G.items() if not why.startswith("only a small plant") and g not in made]
    return [("made to fit (N289): each piece in its place, drawn, costed; every gap has one", not bad,
             "; ".join(bad) or f"{len(_all())} pieces, {sum(m['gap'] for m in _all())} for gaps")]


if __name__ == "__main__":
    for n, ok, note in checks():
        print("PASS" if ok else "FAIL", n, note)
    for m in pieces():
        print(f"  {m['room']:11} {m['place']:16} {m['line']}")
