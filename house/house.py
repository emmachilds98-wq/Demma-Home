"""v53: the whole house as data, for the 3D model and the plans (house/HOUSE.md says where each fact came from).

Sizes are the selling agent's (metres, width × depth as the agent wrote them) until the client measures; `use` is the client's; `notes`
are the client's corrections of 25 Oct 2026 (media-wall/inputs/plan_*_corrected_25oct.jpg), "confirm" where it's our reading.
The living room's measured geometry is media-wall/src/geometry.py; it wins over anything here."""

FACING = 14.0          # the back of the house, degrees east of north (OpenStreetMap)

FLOORS = {
    "lower": dict(name="Lower ground floor", area_m2=34.3, level="the garden", rooms=[
        dict(id="kitchen", name="Kitchen", size=(3.79, 3.66), windows=["back"], doors=["garden (back, left)"],
             notes=["a second cupboard by the store, its door facing the kitchen's entrance: a cubby with two doors (client)"]),
        dict(id="kitchen_cupboard", name="Cupboard by the store", size=None, notes=["door faces the kitchen's entrance, beside the store's door (client)"]),
        dict(id="wc", name="WC", size=(1.64, 1.88), windows=["back"], notes=["the small sink on the kitchen-side wall (client)"]),
        dict(id="lower_landing", name="Landing and stairs up", size=None),
        dict(id="lower_store", name="Store", size=None),
        dict(id="secret", name="The secret room", size=None, notes=["the client's name for the unexcavated space under the garage"]),
    ]),
    "ground": dict(name="Ground floor", area_m2=39.4, level="the street", rooms=[
        dict(id="living", name="Living room", size=(4.95, 3.65), measured=(4.67, 3.47, 2.35), windows=["back, right of centre"],
             notes=["chimney breast to the garage side (solid)", "solid block in the window wall's left corner"]),
        dict(id="hall", name="Entrance hall and stairs up", size=None, notes=["solid wall beside the stairs"]),
        dict(id="front_stores", name="Two stores by the front door", size=None),
        dict(id="garage", name="Garage", size=None),
    ]),
    "first": dict(name="First floor", area_m2=40.1, level="bedrooms", rooms=[
        dict(id="bathroom", name="Bathroom", size=(2.04, 2.38), windows=["back"],
             notes=["the sink cabinet on the left wall, the toilet ahead under the window (client)", "bath along the right",
                    "solid walls top left and by the door: more shape than drawn"]),
        dict(id="bed2", name="Bedroom 2", use="Spare room", size=(2.91, 3.65), windows=["back"], notes=["the roof slope on the right wall: the dormer roof (client)"]),
        dict(id="master", name="Master bedroom", size=(2.91, 4.45), windows=["front"]),
        dict(id="bed3", name="Bedroom 3", use="Office and gaming room", size=(2.04, 2.17), windows=["front"]),
        dict(id="airing", name="Boiler cupboard", size=None),
        dict(id="landing", name="Landing", size=None, notes=["more square than the plan shows (client)", "the green mark at the top of the stairs is its rough size (client)"]),
    ]),
}
GARDENS = {
    "back": dict(length_m=25.0, notes=["lawn the width of the house, path down the left, patio by the house, fences both sides (photos)"]),
    "front": dict(length_m=None, notes=["end of terrace; porch with a white pediment on the left, white up-and-over garage door on the right",
                                        "concrete drive in front of the garage; a small lawn left of it with a low brick wall; a lawn strip right, by "
                                        "the neighbour's fence, with a young tree (photo_house_front_25oct.png); sizes to come"]),
}

if __name__ == "__main__":
    for k, f in FLOORS.items():
        print(f["name"], f"{f['area_m2']} m²")
        for r in f["rooms"]:
            print("  ", r["name"] + (f" ({r['use']})" if r.get("use") else ""), r.get("size") or "size to come")


# ---------------------------------------------------------------- v54: the whole-house draft for the 3D room
# Each floor's rooms as rectangles traced on the client's corrected plans (media-wall/inputs/plan_*_corrected_25oct.jpg), in that
# image's pixels (x to the right = towards the east, y down = from the back of the house to the front), with the plan's scale
# (v55, client: "The kitchen is directly under the living room and bathroom and bedroom 2 above that. It is 2 floors at the front and 3
# at the back as it's on a hill": the floors stacked, shift 0, each at its height)
# (pixels a metre, from the agent's room sizes) and its north-east interior corner. draft() turns them into the 3D room's centimetres:
# x from the living room's east wall (+ = west), z from the back wall's inside (the window wall) towards the front. Rough: the agent's
# sizes and our tracing until the client's measurements come.
PLANS = {
    "lower": dict(scale=149.0, east=985, north=285, y=-260.0, h=230.0, shift=0.0, title="Lower ground floor · the garden level", rooms=[
        ("kitchen", (420, 285, 985, 830)), ("wc", (262, 285, 405, 560)), ("lower_landing", (262, 565, 405, 715)),
        ("lower_stairs", (262, 715, 405, 900)), ("lower_store", (262, 900, 535, 1110)), ("lower_store_1", (405, 840, 535, 900)), ("secret", (555, 850, 985, 1515))],
        solids=[("kitchen_cupboard", (535, 700, 690, 830))],
        fixtures=[],                                     # v57: the maroon mark, the WC's small sink; v67: modelled from the photo (model.wc)
        windows=[(640, 960, "n"), (262, 405, "n")], doors=[(470, 590, "n")]),
    "ground": dict(scale=150.0, east=965, north=270, y=0.0, h=235.0, shift=0.0, title="Ground floor · the street level", rooms=[
        ("hall", (225, 830, 515, 1380)), ("front_store_w", (225, 1390, 290, 1495)), ("front_store_e", (420, 1390, 515, 1495)),
        ("porch", (290, 1390, 420, 1495)), ("garage", (535, 830, 965, 1505))],
        solids=[("hall_wall", (225, 830, 365, 1000))],
        windows=[], doors=[(290, 420, "s"), (555, 945, "s")]),
    "first": dict(scale=146.0, east=975, north=295, y=260.0, h=235.0, shift=0.0, title="First floor · the bedrooms", rooms=[
        ("bathroom", (240, 295, 530, 650)), ("bed2", (550, 300, 975, 840)), ("landing", (380, 660, 530, 1195)),
        ("first_stairs", (240, 800, 380, 1050)), ("landing_top", (240, 1050, 380, 1195)), ("airing", (545, 860, 690, 1000)),
        ("master", (690, 860, 975, 1520)), ("master_b", (550, 1000, 690, 1520)), ("bed3", (240, 1215, 530, 1525))],
        solids=[("bath_corner", (240, 295, 330, 380))],   # v77: "landing_wall" (the plan's black mark by the stairs) out: it's the bathroom's box (model BATH_1)
        fixtures=[],                                     # v65: the bathroom's are modelled from the client's photos (model.bathroom)
        slopes=[("bed2_slope", (820, 300, 975, 520))],   # v57, client: the black block is "the dormer roof": a sloping ceiling, low at the east
        windows=[(310, 460, "n"), (560, 820, "n"), (700, 850, "s"), (310, 460, "s")], doors=[]),
}
NAMES = {"kitchen": ("Kitchen", ""), "wc": ("WC", ""), "lower_landing": ("Landing", ""), "lower_stairs": ("Stairs up", ""),
         "lower_store": ("Store", ""), "lower_store_1": ("", ""), "secret": ("The secret room", "under the garage"), "kitchen_cupboard": ("Cupboard", "by the store"),
         "hall": ("Entrance hall", "stairs up"), "front_store_w": ("Store", ""), "front_store_e": ("Store", ""), "porch": ("Front door", ""),
         "garage": ("Garage", ""), "hall_wall": ("", ""), "bathroom": ("Bathroom", "sink left, toilet ahead"), "bed2": ("Bedroom 2", "music room"),
         "landing": ("Landing", ""), "first_stairs": ("Stairs down", ""), "landing_top": ("Landing", "top of the stairs · rough"),
         "airing": ("Boiler cupboard", "towels and boxes"), "master": ("Master bedroom", ""), "master_b": ("", ""), "bed3": ("Bedroom 3", "office and gaming"),
         "bath_corner": ("", ""), "landing_wall": ("", ""), "bed2_slope": ("Roof slope", "to measure"),
         "wc_toilet": ("", ""), "wc_sink": ("", ""), "bath_sink": ("", ""), "bath_toilet": ("", ""), "bath_bath": ("", "")}


def draft(win_z=-309.0):
    """The floors for the 3D room: each room's x0, x1, z0, z1 (cm), name, use, size (m); solids; windows and doors as wall spans."""
    out = []
    for k, P in PLANS.items():
        s, E, N = P["scale"], P["east"], P["north"]
        cx = lambda px: round((E - px) / s * 100 + P["shift"], 1)
        cz = lambda py: round(win_z + (py - N) / s * 100, 1)
        rect = lambda r: dict(x0=cx(r[2]), x1=cx(r[0]), z0=cz(r[1]), z1=cz(r[3]))
        agent = {r["id"]: r.get("size") for f in FLOORS.values() for r in f["rooms"]}
        size = lambda i, r: agent.get(i) or (round((r[2] - r[0]) / s, 2), round((r[3] - r[1]) / s, 2))   # the agent's size where it gives one
        rooms = [dict(id=i, **rect(r), name=NAMES[i][0], use=NAMES[i][1], w=size(i, r)[0], d=size(i, r)[1]) for i, r in P["rooms"]]
        solids = [dict(id=i, **rect(r), name=NAMES[i][0], use=NAMES[i][1]) for i, r in P["solids"]]
        fixtures = [dict(id=i, **rect(r), h=h) for i, r, h in P.get("fixtures", [])]
        slopes = [dict(id=i, **rect(r), name=NAMES[i][0], use=NAMES[i][1]) for i, r in P.get("slopes", [])]
        side = lambda t: [dict(x0=cx(a[1]), x1=cx(a[0]), side=a[2]) for a in t]
        zs = [r["z0"] for r in rooms] + [r["z1"] for r in rooms]
        out.append(dict(id=k, title=P["title"], y=P["y"], h=P["h"], shift=P["shift"], rooms=rooms, solids=solids, fixtures=fixtures, slopes=slopes,
                        windows=side(P["windows"]), doors=side(P["doors"]), zn=min(zs), zs=max(zs)))
    return out
