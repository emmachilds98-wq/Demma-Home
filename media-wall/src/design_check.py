"""N283: the living room's design check. The rules in docs/DESIGN.md (N282) run on the measured plan (geometry, clash.pieces); what
fails gets a fix: a real piece that fits (house/data/N243_catalogue.json) or one to make, with its steps. As a project (projects/README.md)
that Build shows beside the media wall's pieces.
    python3 design_check.py      prints the check"""
import json, math, pathlib
import geometry as G
import clash

ROOT = pathlib.Path(__file__).resolve().parents[2]
CAT = {p["name"]: p for p in json.loads((ROOT / "house/data/N243_catalogue.json").read_text())}


def boxes():
    return {n: (x, y, z) for n, x, y, z in clash.pieces()}


def checks():
    """[(rule, what we have, ok, the fix or None)]: each number from the plan's geometry."""
    B, out = boxes(), []
    sofa_front = G.SOFA_FRONT_Z
    chaise_front = G.CHAISE_X[1]
    cx, cz = G.COFFEE["x"], G.COFFEE["z"]
    gap = cz[0] - sofa_front
    out.append(("Sofa to coffee table: 40–45 cm", f"{gap:.0f} cm", 35 <= gap <= 50, None))
    ott = B["ottoman"]
    span = max(cx[1], ott[0][1]) - cx[0]
    out.append(("Coffee table about ⅔ the sofa", f"the table and the ottoman together {span:.0f} of the sofa's {G.SOFA_W:.0f}",
                span >= 0.55 * G.SOFA_W, None))
    rx, rz = G.RUG["x"], G.RUG["z"]
    off_s, off_c = rz[0] - sofa_front, rx[0] - chaise_front
    out.append(("Rug under the seats' front legs", f"it starts {off_s:.0f} cm short of the sofa and {off_c:.0f} short of the chaise",
                off_s < -5 and off_c < -5, "rug"))
    tv = ((G.TV_X[0] + G.TV_X[1]) / 2, (G.TV_PANEL_Z[0] + G.TV_PANEL_Z[1]) / 2)
    diag = math.hypot(G.TV_W, G.TV_H)
    seats = {"the chaise": ((G.CHAISE_X[0] + G.CHAISE_X[1]) / 2, -160.0), "the sofa's middle": ((G.CHAISE_X[1] + G.SOFA_X[1]) / 2, -250.0)}
    d = {k: math.hypot(x - tv[0], z - tv[1]) for k, (x, z) in seats.items()}
    out.append(("TV: sit 1.2–1.6 × its diagonal away (4K)", ", ".join(f"{k} {v / diag:.1f} ×" for k, v in d.items()),
                any(1.2 <= v / diag <= 1.6 for v in d.values()), None))
    out.append(("TV's middle within 15 cm of seated eye height (about 105)", f"{G.TV_CENTRE:.0f} cm", abs(G.TV_CENTRE - 105) <= 15, None))
    walk = B["dining cabinet"][0][0] - ott[0][1]
    out.append(("Walkway from the door: 90 cm", f"{walk:.0f} cm between the ottoman and the dining cabinet", walk >= 90, None))
    front = min(B["plant stand"][2][0], B["media wall base"][2][0]) - cz[1]
    out.append(("Coffee table to the media wall: 60 cm at least", f"{front:.0f} cm to the plant stand", front >= 60, None))
    lamp = B["red lamp"]
    lx, lz = (lamp[0][0] + lamp[0][1]) / 2, (lamp[2][0] + lamp[2][1]) / 2
    far = math.hypot(lx - seats["the chaise"][0], lz - seats["the chaise"][1])
    out.append(("A lamp at each seat's shoulder (60–100 cm)", f"the chaise's nearest lamp {far / 100:.1f} m away", far <= 100, "lamp"))
    return out


def corner():
    """The free floor at the chaise's end, against the side wall: from the chaise to the blanket basket, out to the rug."""
    B = boxes()
    z0, z1 = B["chaise"][2][1], B["blanket basket"][2][0]          # -128 .. -62
    return dict(z=(z0, z1), long=round(z1 - z0, 1), out=round(RUG_NEW["x"][0] - 2.0, 1))


# the fix for the rug: the same 160 × 230, laid 13 cm towards the sofa and the chaise (10 cm under each), clear of the plant stand
RUG_NEW = dict(x=(G.CHAISE_X[1] - 10.0, G.CHAISE_X[1] - 10.0 + 230.0), z=(G.SOFA_FRONT_Z - 10.0, G.SOFA_FRONT_Z - 10.0 + 160.0))
TABLE = dict(w=40.0, d=30.0, h=50.0, t=G.WT, shelf_y=12.0)       # the lamp table, from the worktop's 3 cm oak offcut
LAMP = CAT["ÅRSTID floor lamp"]


def project():
    """The check as a project: Check (the rules), then the three fixes, each a piece with its tasks."""
    C, B, c = checks(), boxes(), corner()
    ps = B["plant stand"][2][0]
    tb, lp = TABLE, LAMP
    cut = [("Top", tb["w"], tb["d"]), ("Side", tb["h"] - tb["t"], tb["d"]), ("Side", tb["h"] - tb["t"], tb["d"]),
           ("Shelf", tb["w"] - 2 * tb["t"], tb["d"])]
    need = tb["d"] + lp["d"]
    pieces = [
        dict(key="lf-check", title="The design check", what="The design rules run on your measured room: what passes, what to fix.",
             time="", who="", cost=[0, 0], buy=[], checks=[[r, h, "✓" if ok else "✗"] for r, h, ok, _f in C],
             tasks=[dict(id="lf-read", title="Read the check", how=["Each line: the rule, then your room's number from the plan. Sources: docs/DESIGN.md."])]),
        dict(key="lf-rug", title="Lay the rug under the seats' front legs",
             what=f"Same 160 × 230 rug, moved 13 cm towards the sofa and 13 towards the chaise: 10 cm under each, so the seating "
                  f"and the rug read as one; {ps - RUG_NEW['z'][1]:.0f} cm still clear of the plant stand.",
             time="10 min", who="You", cost=[0, 0], buy=[],
             tasks=[dict(id="lf-rug1", title="Slide the rug 13 cm under the sofa and the chaise",
                         how=["Lift the sofa's front edge a little and slide the rug under it until 10 cm is under.",
                              "Do the same at the chaise.", f"Check: {ps - RUG_NEW['z'][1]:.0f} cm of floor between the rug and the plant stand."])]),
        dict(key="lf-lamp", title="A lamp for the chaise",
             what=f"The chaise is the best seat for the TV but has no lamp near it. A slim floor lamp at its end, against the side wall "
                  f"({lp['retailer']} {lp['name']}, {lp['w']:.0f} cm base, {lp['h']:.0f} tall, £{lp['price']:.0f}). The socket on the side wall is about a metre away.",
             time="15 min", who="You", cost=[lp["price"], lp["price"]], buy=["lf-b-lamp"],
             tasks=[dict(id="lf-lamp1", title="Stand the lamp at the chaise's end, against the side wall",
                         how=[f"Floor there: {c['long']:.0f} cm from the chaise to the blanket basket; the lamp takes {lp['d']:.0f}, the table {tb['d']:.0f}: {need:.0f} in all.",
                              "Run its lead along the skirting to the side wall's socket; a warm 2700 K bulb."])]),
        dict(key="lf-table", title="Make an oak lamp table",
             what=f"A small table at the chaise's end, {tb['w']:.0f} × {tb['d']:.0f} × {tb['h']:.0f} (the chaise's seat is 45: within 5), "
                  f"in the same 3 cm oak as the media wall's top, made from its offcut: a top, two sides and a shelf, joined with dowels.",
             time="½ day", who="You", cost=[5, 10], buy=["lf-b-dowel", "lf-b-felt"],
             cut=[dict(part=n, size=f"{a:.0f} × {b:.0f} × {tb['t']:.0f}") for n, a, b in cut],
             tasks=[dict(id="lf-t1", title="Check the offcut",
                         how=["After the media wall's top (186 × 46) is cut from the 300 × 62 board, about 114 × 62 is left.",
                              f"Mark two rows {tb['d']:.0f} wide along it (with the saw cut, 61 of the 62)."]),
                    dict(id="lf-t2", title="Cut the four parts",
                         how=[f"Row 1: the top {tb['w']:.0f} and a side {tb['h'] - tb['t']:.0f}. Row 2: a side {tb['h'] - tb['t']:.0f} and the shelf {tb['w'] - 2 * tb['t']:.0f}.",
                              "Cut on the track saw used for the worktop; sand the cut edges to 180."]),
                    dict(id="lf-t3", title="Drill for the dowels",
                         how=["Two 8 mm dowels at each joint: the top onto each side, the shelf between the sides.",
                              f"Use a dowel jig; the shelf's top {tb['shelf_y']:.0f} cm up; 20 mm deep each side."]),
                    dict(id="lf-t4", title="Glue up and clamp",
                         how=["Glue the shelf between the sides first, check it's square (the diagonals match), then the top.",
                              "Clamp for an hour; wipe the squeeze-out with a damp cloth."]),
                    dict(id="lf-t5", title="Oil it with the media wall",
                         how=["Round the edges with 120 grit; two coats of the same hardwax oil as the worktop.",
                              "Felt pads under the sides; stand it against the side wall at the chaise's end, the lamp beside it."])]),
    ]
    buy = [dict(id="lf-b-lamp", phase="The living room's design check", item=f"{lp['retailer']} {lp['name']} ({lp['finish']})", qty=1,
                lo=lp["price"], hi=lp["price"], url=lp["url"]),
           dict(id="lf-b-dowel", phase="The living room's design check", item="8 mm beech dowels, a pack (E)", qty=1, lo=3, hi=6),
           dict(id="lf-b-felt", phase="The living room's design check", item="Felt pads (E)", qty=1, lo=2, hi=4)]
    lo, hi = sum(b["lo"] for b in buy), sum(b["hi"] for b in buy)
    return dict(id="living-design", name="The living room: design check", room="living", cost=[lo, hi],
                what="The design rules on your measured room, and three fixes: the rug, a lamp, a table to make.",
                places=[dict(id="design", name="The living room: design check", pieces=pieces)], buy=buy,
                phases=[dict(n=1, name="The living room's design check", lo=lo, hi=hi)],
                options=[dict(name="A bigger rug, 170 × 240", size="170 × 240", lo=100, hi=250)],
                files=[dict(name="The rules and their sources", href="https://github.com/emmachilds98-wq/Demma-Home/blob/main/docs/DESIGN.md")])


if __name__ == "__main__":
    for r, h, ok, f in checks():
        print(f"{'PASS' if ok else 'FIX '}  {r}: {h}")
    print("corner", corner(), "rug", RUG_NEW)
