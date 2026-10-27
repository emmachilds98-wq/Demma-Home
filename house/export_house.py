"""V1 (Phase 1): one house file the app and the checks both read.

python3 house/export_house.py [out.json]   -> house/house.json (or out.json); house/house.schema.json says its shape.

The model (model.py, from survey_data.py) stays the maker of the geometry; this adds what the app needs to know about it: the floors,
the rooms (name, floor, size, ceiling), every named piece (Phase 1's items: id, name, room, kind, its box, its sizes, where its sizes
come from and whether it's a guess to measure), the open measurements (measure.py), and the living room's shell and fixed pieces
(Phase 5: the measured room, from media-wall/src/geometry.py). The 3D geometry itself goes to the viewer in scene3d.json (R.HOUSE3),
each box tagged with its item."""
import json, pathlib, sys
import model as M
import survey_data as D
import measure
import client_edits

HERE = pathlib.Path(__file__).parent
G = M.Gm                                                          # the measured living room (media-wall/src/geometry.py)
FLOOR_NAME = {"lower": "Lower", "ground": "Ground", "first": "First"}
FRAME = 6.0                                                       # a door frame's width each side (model.walls_for)


def _bboxes(export):
    """Each item's box: round everything tagged with it, on every floor (boxes, turned shapes, profiles, moving parts)."""
    bb = {}
    def add(iid, x0, y0, z0, x1, y1, z1):
        b = bb.get(iid)
        bb[iid] = [x0, y0, z0, x1, y1, z1] if not b else [min(b[0], x0), min(b[1], y0), min(b[2], z0), max(b[3], x1), max(b[4], y1), max(b[5], z1)]
    for f, F in export["floors"].items():
        tags = F.get("tags", [])
        for m, boxes in F["boxes"].items():
            for b, t in zip(boxes, F.get("bt", {}).get(m, [])):
                if t >= 0:
                    add(tags[t], *b)
        for L in F.get("lathes", []):
            if L.get("t", -1) >= 0:
                (cx, y0, cz), p, (sx, sz) = L["c"], L["p"], L["s"]
                r = max(q[0] for q in p); h = max(q[1] for q in p)
                add(tags[L["t"]], cx - r * sx, y0, cz - r * sz, cx + r * sx, y0 + h, cz + r * sz)
        for P in F.get("prisms", []):
            if P.get("t", -1) >= 0:
                us = [q[0] for q in P["pts"]]; vs = [q[1] for q in P["pts"]]
                if P["axis"] == "x":
                    add(tags[P["t"]], P["a"], min(vs), min(us), P["b"], max(vs), max(us))
                else:
                    add(tags[P["t"]], min(us), min(vs), P["a"], max(us), max(vs), P["b"])
        for part in F.get("parts", {}).values():
            for m, boxes in part["boxes"].items():
                for b, t in zip(boxes, part.get("bt", {}).get(m, [])):
                    if t >= 0:
                        add(tags[t], *b)
    return {k: [round(v, 1) for v in b] for k, b in bb.items()}


def _src(it):
    """The client's own number wins: once pull_edits has written to an item's data, its source is the client's."""
    if it.get("data"):
        key = ".".join(map(str, it["data"]))
        for k, s in client_edits.SOURCES.items():
            if k == key or k.startswith(key + "."):
                return s, False
    return it["src"], it["measure"]


def items(export):
    bbs = _bboxes(export)
    doors = {d["id"]: (f, d) for f in M.FLOOR_Y for d in M.doors(f)}
    ops = {op["id"]: op for op in D.OPENINGS}
    out = []
    for iid, it in M.ITEMS.items():
        b = bbs.get(iid)
        if not b:
            continue
        fy = M.FLOOR_Y.get(it["floor"], M.FLOOR_Y["first"] if it["floor"] == "roof" else 0)
        src, meas = _src(it)
        row = dict(id=iid, name=it["name"], room=it["room"], floor=it["floor"] if it["floor"] in M.FLOOR_Y else "first", kind=it["kind"],
                   box=b, src=src, measure=bool(meas), axis=it["axis"], data=list(it["data"]) if it["data"] else None)
        ax = it["axis"]
        w = (b[3] - b[0]) if ax != "z" else (b[5] - b[2])
        d = (b[5] - b[2]) if ax != "z" else (b[3] - b[0])
        size = dict(w=round(w, 1), h=round(b[4] - b[1], 1), d=round(d, 1), up=round(b[1] - fy, 1))
        if iid in doors:                                          # a door: its opening, not its frames
            f, dd = doors[iid]
            size.update(w=round(dd["b"] - dd["a"], 1), h=D.DOOR_H, up=0.0)
            row["opening"] = dict(axis=dd["axis"], line=dd["line"], a=dd["a"], b=dd["b"], y0=M.FLOOR_Y[f], y1=M.FLOOR_Y[f] + D.DOOR_H, frame=FRAME)
        if iid in ops:                                            # a window or an outside door: its opening in the wall
            op = ops[iid]
            size.update(w=round(op["x"][1] - op["x"][0], 1), h=round(op["head"] - op["sill"], 1), up=op["sill"])
            row["opening"] = dict(axis="x", line=M.BACK if op["side"] == "n" else M.FRONT, a=op["x"][0], b=op["x"][1],
                                  y0=M.FLOOR_Y[op["floor"]] + op["sill"], y1=M.FLOOR_Y[op["floor"]] + op["head"], frame=0.0)
        row["size"] = size
        out.append(row)
    return out


def living_items():
    """Phase 5 (data): the measured living room's shell and fixed pieces, by id, in the house's coordinates (the same as the room's)."""
    W, Z0, Zb = G.ROOM_W, G.WINDOW_Z, G.ALC_D
    sx, (dx0, dx1) = G.STAIR_X, G.DOOR_X
    rows = [
        ("living.window", "The living room window", "window", [G.WINDOW_X[0], 88.0, Z0 - 10, G.WINDOW_X[1], 212.0, Z0], "M (height E)", "x"),
        ("living.radiator", "The living room radiator", "radiator", [G.RADIATOR_X[0], 15.0, Z0, G.RADIATOR_X[1], 72.0, Z0 + 10], "M (height E)", "x"),
        ("living.breast", "The chimney breast", "fixed", [G.BREAST_X[0], 0.0, 0.0, G.BREAST_X[1], G.CEIL, Zb], "M", "x"),
        ("living.alcove", "The alcove (the media wall's)", "fixed", [0.0, 0.0, 0.0, G.ALC_W, G.CEIL, Zb], "M", "x"),
        ("living.recess", "The recess by the door", "fixed", [G.BREAST_X[1], 0.0, 0.0, sx[0], G.CEIL, Zb], "M (to confirm)", "x"),
        ("living.stairs", "The stairs up", "fixed", [sx[0], 0.0, Zb - G.STAIR_D, sx[1], G.CEIL, Zb], "M + photos (fitted)", "z"),
        ("living.door", "The living room door", "door", [dx0, 0.0, Zb, dx1, D.DOOR_H, Zb + 4], "E (the agent's plan)", "x"),
        ("living.nwbox", "The box in the window corner", "fixed", [W - G.NW_BOX[0], 0.0, Z0, W, G.NW_BOX[1] if G.NW_BOX[1] > 30 else 22.0, Z0 + G.NW_BOX[1]], "M (what it is: to confirm)", "x"),
        ("living.mediawall", "The media wall", "project", [0.0, 0.0, -8.0, G.ALC_W, G.CEIL, Zb], "the plan (geometry.py, fit.py)", "x"),
    ]
    out = []
    for iid, name, kind, b, src, ax in rows:
        b = [round(v, 1) for v in b]
        out.append(dict(id=iid, name=name, room="living", floor="ground", kind=kind, box=b, src=src, measure=src.startswith("E") or "confirm" in src,
                        axis=ax, data=None, project="media-wall" if kind == "project" else None,
                        size=dict(w=round(b[3] - b[0] if ax == "x" else b[5] - b[2], 1), h=round(b[4] - b[1], 1),
                                  d=round(b[5] - b[2] if ax == "x" else b[3] - b[0], 1), up=round(b[1], 1))))
    return out


def rooms():
    sizes = M.room_sizes()
    out = [dict(id="living", name="Living room", floor="ground", use="the media wall project", box=[0.0, 0.0, G.WINDOW_Z, G.ROOM_W, G.CEIL, G.ALC_D],
                w=G.ROOM_W, d=G.ROOM_D, ceil=G.CEIL, src="M", project="media-wall", pieces=[[0.0, G.WINDOW_Z, G.ROOM_W, G.ALC_D]])]
    for rid, r in sizes.items():
        if not r["name"]:
            continue
        pcs = [[p["x0"], p["z0"], p["x1"], p["z1"]] for p in M.rooms(r["floor"]) if p["room"] == rid]
        out.append(dict(id=rid, name=r["name"], floor=r["floor"], use=r["use"], box=[r["x0"], M.FLOOR_Y[r["floor"]], r["z0"], r["x1"], M.FLOOR_Y[r["floor"]] + M.CEIL, r["z1"]],
                        w=round(r["x1"] - r["x0"], 1), d=round(r["z1"] - r["z0"], 1), ceil=M.CEIL, src="P + fitted", pieces=pcs))
    return out


def house():
    e = M.export()
    its = items(e) + living_items()
    rs = rooms()
    meas = measure.rows()
    for r in rs:
        r["to_measure"] = sum(1 for m in meas if m["room"] == r["id"])
        r["items"] = sum(1 for i in its if i["room"] == r["id"])
    return dict(version=(HERE.parent / "VERSION").read_text().strip(), units="cm",
                axes="x from the living room's east wall going west, y up from the living room's floor, z from its chimney breast's face to the front",
                floors=[dict(id=f, name=FLOOR_NAME[f], y=y) for f, y in M.FLOOR_Y.items()],
                rooms=rs, items=its, measure=meas, problems=client_edits.PROBLEMS)


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "house.json"
    h = house()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(h, ensure_ascii=False, separators=(",", ":")))
    print(f"house.json: {len(h['rooms'])} rooms, {len(h['items'])} items ({sum(i['measure'] for i in h['items'])} to measure), "
          f"{len(h['measure'])} open measurements, {out.stat().st_size // 1024} KB")
