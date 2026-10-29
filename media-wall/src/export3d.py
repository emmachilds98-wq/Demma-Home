"""v14: exports the scene for the 3D room on the plan page (build_viewer.py).

The 3D room is built from the same drawing code as the HD renders: render.py records every box, polygon and face frame it
draws, in room coordinates, and this groups them by what they are and what state they're in (drawers in or out, the table
folded, down for four or out for six). The room's shell, the TV's picture, the lights and the floor lamp are built in the
browser from the numbers in "room" below. Site B (the table under the shelf by the stairs) is the same dining wall turned
90° onto the west wall.

python3 export3d.py   -> scene3d.json here
"""
import json, pathlib, re
import geometry as G
import render as R

HERE = pathlib.Path(__file__).parent
SKIP_FILL = {"#2b3530"}                     # the dark plug render.py draws over the stairwell's ceiling opening
URL_FILL = {"url(#glass)": "glass", "url(#art1)": "art", "url(#bayBack)": "#2a2219", "url(#bayLight)": "#e0c393",
            "url(#bayLightW)": "#e4e0d6", "url(#pot)": "#c46c45", "url(#screen)": "screen",
            "url(#brick)": "brick", "url(#leftwall)": "#2c5643", "url(#rightwall)": "#2c5643", "url(#backwall)": "#2c5643"}



def _house_draft():   # v54: the whole house, drafted from the client's corrected plans (house/house.py)
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "house"))
    import house
    return house.draft(G.WINDOW_Z)

def _house3():   # v58: the whole house built (house/model.py: walls, openings, floors, stairs, the roof), sizes deduced until measured
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "house"))
    import model
    e = model.export()
    import base64, json as _j                               # v70: the CC0 photo-textures (house/textures, made by build_textures.py), inline
    td = pathlib.Path(model.__file__).resolve().parent / "textures"
    meta = _j.loads((td / "textures.json").read_text()) if (td / "textures.json").exists() else {}
    b64 = lambda f: "data:image/jpeg;base64," + base64.b64encode(f.read_bytes()).decode() if f.exists() else None
    e["photo_tex"] = {k: dict(map=b64(td / f"{k}_map.jpg"), nor=b64(td / f"{k}_nor.jpg"), size=m["size"]) for k, m in meta.items()}
    seen = {}                                               # V1.1: a picture two keys share (the carpets' pile) goes once; the other says "@key.map"
    for k, t in e["photo_tex"].items():
        for f in ("map", "nor"):
            if t[f] in seen: t[f] = "@" + seen[t[f]]
            elif t[f]: seen[t[f]] = f"{k}.{f}"
    # v71: each room's outline and floor level (the viewer's From above and On its own views cut the house to it)
    e["rooms"] = {rid: [r["x0"], r["x1"], r["z0"], r["z1"], model.FLOOR_Y[r["floor"]]] for rid, r in model.room_sizes().items()}
    e["ceil"] = model.CEIL
    e["plants"] = getattr(model.D, "PLANTS", [])                # V1.3: the gardens' plants (survey_data.PLANTS: where, how big, the source)
    e["beyond"] = getattr(model.D, "BEYOND", None)               # V1.4: past the far fence (survey_data.BEYOND): the low building, the hill
    e["things"] = getattr(model.D, "GARDEN_THINGS", [])          # V1.6: the table and chairs, next door's trampoline and sheds
    st = e["floors"].get("street", {}).get("boxes", {})          # V1.6: next door's back lawns and fences, for the living room's window
    lawn = model.D.LEVELS["lawn"]
    e["next_gardens"] = {k: [b for b in st.get(k, []) if b[1] <= lawn + 1 and b[4] <= lawn + 200] for k in ("lawn", "fence")}
    e.update(front=model.RO["s"], back=model.RO["n"], garage=[0.0, next(r["x1"] for r in model.rooms("ground") if r["id"] == "garage")], hall=[model.D.WALL_HALL, model.RO["w"]], drive=model.D.LEVELS["drive"], lawn=model.D.LEVELS["lawn"])   # V1.3: the ground beyond, at the street's and the garden's levels
    return e

def _fill(f):
    if f.startswith("url("):
        return URL_FILL.get(f)
    return f.lower()


def _flags(extra):
    fl = "g" if "grain" in extra else ""
    m = re.search(r'(?<![-\w])opacity="([\d.]+)"', extra)
    if m and float(m.group(1)) < 0.99:
        fl += f"o{float(m.group(1)):g}"
    return fl


def _keep_poly(fill, extra):
    """Glows, soft shadows and light pools are the 2D renders' stand-ins for light: the 3D room has real light."""
    if fill is None or fill in SKIP_FILL:
        return False
    if "url(#soft" in extra or "fill-opacity" in extra:
        return False
    return True


def encode(recs, keep_polys=True):
    out = []
    for r in recs:
        if r[0] == "poly":
            _, pts, fill, extra = r
            f = _fill(fill)
            if not keep_polys or not _keep_poly(f, extra) or len(pts) < 3:
                continue
            out.append(["p", [c for q in pts for c in q], f, _flags(extra)])
        elif r[0] == "frame":
            _, x1, x2, top, z, holes, fill = r
            out.append(["f", x1, x2, top, z, holes, _fill(fill)])
        else:
            x, y, z, w, h, d, front, top, side, extra = r
            f = _fill(front)
            if f is None or "fill-opacity" in extra or "url(#soft" in extra:
                continue
            t, s = _fill(top or front), _fill(side or front)
            out.append(["b", x, y, z, w, h, d, f, t if t != f else 0, s if s != f else 0, _flags(extra)])
    return out


def rec(fn, *a, **kw):
    R.REC = []
    try:
        fn(*a, **kw)
        return R.REC
    finally:
        R.REC = None


def state(dining="folded", game=0.0, rec_up=0.0, rec_lo=0.0, plinth=0.0, slim=0.0):
    R.VIEW, R.STYLE, R.DINING = "front", "joinery", dining
    R.GAME_OPEN, R.REC_OPEN_UP, R.REC_OPEN, R.PLINTH_OPEN, R.SLIM_OPEN = game, rec_up, rec_lo, plinth, slim
    R.SITE_NOW = "breast"            # the dining wall is recorded on the breast; site B turns it onto the stairs wall
    R.SOFA_GHOST = False


def to_site_b(items):
    """Turn the dining wall from the breast (along +x, out towards -z) onto the west wall (along -z, out towards -x),
    about the table's centre: x' = ROOM_W + z, z' = TABLE_B_CZ - (x - TABLE_CX)."""
    W, CX, CZ = G.ROOM_W, G.TABLE_CX, G.TABLE_B_CZ
    out = []
    for it in items:
        if it[0] == "b":
            _, x, y, z, w, h, d, *rest = it
            out.append(["b", round(W + z, 2), y, round(CZ - (x + w - CX), 2), d, h, w, *rest])
        elif it[0] == "p":
            c = it[1]
            nc = []
            for i in range(0, len(c), 3):
                x, y, z = c[i:i + 3]
                nc += [round(W + z, 2), y, round(CZ - (x - CX), 2)]
            out.append(["p", nc, *it[2:]])
    return out


def strip(items, drop):
    ds = {json.dumps(d) for d in drop}
    return [i for i in items if json.dumps(i) not in ds]


def scene():
    state()
    fixed = []
    sk = ("#346650", "#3d7259", "#2b5643", "#2d5a46", "#3b6e56")
    R.STAIRS_3D = True                                                                       # v38: the flight itself is built solid in 3D
    stairs = [i for i in encode(rec(R.west_end, sk)) if i[0] == "b" or i[2] != "#2c5643"]   # the stairs; the shell is built in 3D
    R.STAIRS_3D = False
    for i in stairs:                                                                          # v26: flagged "s", so Look's oak finish leaves them be
        i[-1] = (i[-1] or "") + "s"
    fixed += stairs
    for fn in (R.high_shelf, R.tv, R.uprights, R.rz_shelf, R.worktop_items, R.wrap, R.wall_socket):   # v23: the sockets
        fixed += encode(rec(fn))
    groups = {"fixed": fixed, "sofa": encode(rec(R.sofa_solid))}   # v19: the sofa is its own group, so edit mode can move it
    groups["unit_in"] = encode(rec(R.unit))
    state(game=30, rec_up=30, plinth=25, slim=30)
    groups["unit_out"] = encode(rec(R.unit))
    state()
    frames = encode(rec(R.breast_frames))
    groups["frames"] = frames
    bar2 = {}
    for st in ("folded", "four", "six"):
        state(dining=st)
        # v39: the flip-top table's groups (A_ and B_) are gone: since v33 the room always opens on the compact cabinet, so they were
        # sent and never shown. bar 2's spots below still use their keys.
        bar2[f"A_{st}"] = R.spot_heads2()
        bx = (G.TABLE_B_OPEN_X[0] + G.TABLE_B_OPEN_X[1]) / 2 if st != "folded" else G.ROOM_W - 2.0   # v15: over the open flip-top
        by = G.TABLE_TOP if st != "folded" else G.FOLDED_TOP - 30.0
        bar2[f"B_{st}"] = bar2[f"A_{st}"]   # v17: every head straight down, whichever wall the table is on
    state()
    groups["now_ledge"] = encode(rec(R.now_playing))   # v16: with the table by the stairs, the breast's "now playing" ledge (v18: its own group)

    def bar(cx, cz, heads):
        return {"x": cx, "z": cz, "axis": G.BAR_AXIS, "heads": [{"dx": dx, "col": col, "stem": stem, "tgt": list(tgt)} for dx, col, stem, tgt in heads]}
    room_spec = {
        "W": G.ROOM_W, "CEIL": G.CEIL, "ALC_W": G.ALC_W, "ALC_D": G.ALC_D, "BREAST_X": G.BREAST_X, "RECESS_Z": G.BREAST_D_WEST,
        "DOOR_X": G.DOOR_X, "DOOR_H": 198.0, "STAIR_X": G.STAIR_X, "STAIR_FRONT": G.ALC_D - G.STAIR_D, "STAIR_RISE": G.STAIR_RISE, "STAIR_GOING": G.STAIR_GOING, "STAIR_N": G.STAIR_N, "BANISTER": G.BANISTER, "SUN": G.SUN, "GARDEN": G.GARDEN, "HOUSE": _house_draft(), "HOUSE3": _house3(), "LANDING_D": G.LANDING_D, "STAIR_STRING": G.STAIR_STRING,
        "WELL_X0": G.DOOR_X[1] + 1.5, "WINDOW_Z": G.WINDOW_Z, "WINDOW_X": G.WINDOW_X, "WINDOW_Y": G.WINDOW_Y, "PC_CASE": G.PC_CASE, "PC_Z": G.PC_Z, "PC_SHELF_TOP": G.PC_SHELF_TOP, "WINDOW_REVEAL": G.WINDOW_REVEAL, "WINDOW_DESIGN": G.WINDOW_DESIGN, "GARDEN_VIEW": G.GARDEN_VIEW, "SILL": G.SILL,
        "RADIATOR_X": G.RADIATOR_X, "RADIATOR_Y": G.RADIATOR_Y, "SKIRT_H": G.SKIRT_H,
        "TV_X": G.TV_X, "UP_L": G.UP_L, "UP_R": G.UP_R, "TV_Y": (G.TV_BOTTOM, G.TV_TOP), "TV_Z": G.TV_PANEL_Z[0],
        "SHELF_B": G.SHELF_B, "FRAMES_Y": G.FRAMES_Y, "TABLE_A": {"x": G.TABLE_X, "z": G.TABLE_Z, "cx": G.TABLE_CX},
        "TABLE_B": {"x": G.TABLE_B_X, "z": G.TABLE_B_Z, "cz": G.TABLE_B_CZ}, "SIX": {"x": G.SIX_X, "z": G.FREE_Z}, "OPEN_Z": G.OPEN_Z, "TABLE_B_OPEN_X": G.TABLE_B_OPEN_X,
        "IDEAS": __import__("ideas").SPOTS, "PLANT_STAND": G.PLANT_STAND, "RECORD_SHELF": G.RECORD_SHELF, "PLANT_LAYOUTS": G.PLANT_LAYOUTS, "LAMP_DEFAULT": G.LAMP_DEFAULT, "LP": G.LP, "CHAIR_STORE": G.CHAIR_STORE, "WALL_SEAT": G.WALL_SEAT, "SOFA_POUF": G.SOFA_POUF, "CHAIR_FOLDED": G.CHAIR_FOLDED, "HOOK": G.HOOK, "SOFA": {"x": G.SOFA_X, "back": G.SOFA_BACK_Z, "front": G.SOFA_FRONT_Z, "end": G.CHAISE_END_Z, "chaise_x": G.CHAISE_X},
        "COFFEE": G.COFFEE, "LAMP": G.FLOOR_LAMP,
        "LAMP_SPOTS": {k: {"label": v[0], "x": v[1][0], "z": v[1][1]} for k, v in G.FLOOR_LAMP_SPOTS.items()},
        "SITES": G.DINING_SITES, "PAINT_OLD": R.PAINT_OLD, "PAINT_BASE": "#2d5a46",
        "PAINTS": {k: {"hex": v[0], "name": v[1]} for k, v in R.PAINTS.items()},
        "BAR1": bar(G.PEND_X, G.PEND_Z, R.SPOT_HEADS), "BAR2": {k: bar(G.BAR2_X, G.BAR2_Z, v) for k, v in bar2.items()},
        "LED_Y": G.CEIL - 0.6, "RZ": G.RZ, "HIGH_UNDER": G.HIGH_UNDER, "WORKTOP": G.WORKTOP,
        # v15: the side run's front edge (for its LED strip), the soft furnishings and the stairs wall's things
        "SIDE_RUN": {"under": G.LEDGE_TOP - G.SIDE_RUN_T,
                     "edge": [[round(G.side_run_depth(z), 2), z] for z in range(int(G.SIDE_RUN_Z[0]), int(G.SIDE_RUN_Z[1]) - 1, -4)]},
        "SOFA_CORD": G.SOFA_CORD, "CARPET": G.CARPET_COL, "RUG": {**G.RUG, "cols": G.RUG_COLS}, "CURTAIN": G.CURTAIN,
        "LIGHTBOX": G.LIGHTBOX, "LASER": G.LASER, "PIPE_BOX": G.PIPE_BOX, "PLANT_B": G.PLANT_B, "HAT_PEG": G.HAT_PEG, "HATS": G.HATS,
        "LAMP_BODY": G.LAMP_BODY, "LAMP_RGB": G.LAMP_HEADS_RGB,
    }
    room_spec["OPTC"] = G.OPTC                 # v26: option C, the dining cabinet (v27: the plan) (built in the browser)
    room_spec["CAB"] = G.CAB                   # v30: the compact dining cabinet, the plan (OPTC: the sliding one, the alternative)
    room_spec["CAB80"] = G.CAB80   # v33: the more compact version, an 80-wide table
    room_spec["CHAIR_PADDED"] = G.CHAIR_PADDED   # v33: the grey padded chairs, drawn at the table
    room_spec["BESIDE"] = G.BESIDE             # v31: what could stand beside it
    from build_doc import VERSION, LABEL
    room_spec["VERSION"] = LABEL             # v30: the plan's version, for the name of a picture saved from the 3D room
    room_spec.update(REAR_SPK=G.REAR_SPK, REAR_STAND=G.REAR_STAND, REAR_SPOTS=G.REAR_SPOTS)   # v27: your rear speakers on their stands
    room_spec["CHAIR"] = G.CHAIR; room_spec["SOFA_POUF"] = G.SOFA_POUF
    room_spec["OTTOMAN"] = G.OTTOMAN; room_spec["DRINKS"] = G.DRINKS   # v34: the storage ottoman; the drinks cabinet under the case
    # v36: a third bar, the ottoman's games and cards, the blankets' basket, more storage, the plant shelf
    for k in ("BAR_SIDE", "OTTO_GAMES", "GAME_BOX", "CARD_DECK", "THROW_FOLDED", "BLANKET_BASKET", "LIFT_COFFEE", "KUGGIS", "DOOR_SHELF", "SHELF_BOXES", "ARCHITRAVE",
              "THROW_LONG", "BLANKET_COTSWOLD", "RECORD_TABLE", "KALLAX", "CEIL_DESIGNS"):   # v38: the better basket, the record table, the ceiling designs
        room_spec[k] = getattr(G, k)
    # v37: the built-in bar beside the cabinet, its glass rail, the shoe cabinets, the window corner's three, the alcove shelves, the
    # wall cabinets, the step drawers, the over-door rail
    for k in ("BAR_BUILT", "BAR_RAIL", "BAR_GLASS_H", "TRONES", "CORNER", "WINDOW_SEAT", "HALL_BENCH", "WARDROBE", "ALCOVE_SHELVES", "EKET", "WALL_CABS",
              "STAIR_DRAWERS", "OVERDOOR", "STAIR_CURTAIN", "FIRM", "ENHET", "PLANT_THROUGH_GAP"):   # v38: FIRM, the client's plan
        room_spec[k] = getattr(G, k)
    return {"room": room_spec, "groups": groups}


def main():
    sc = scene()
    p = HERE / "scene3d.json"
    p.write_text(json.dumps(sc, separators=(",", ":")))
    n = {k: len(v) for k, v in sc["groups"].items()}
    print("scene3d.json", round(p.stat().st_size / 1024), "KB", n)


if __name__ == "__main__":
    main()
