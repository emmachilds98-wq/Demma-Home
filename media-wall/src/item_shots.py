"""v32, client: "i want you to add function to add the new suggested furniture and decor in the room to see how it might look, i want all
suggested extra items, furniture and more to have full renders, nothing half HD or drawn".

A full HD 3D still of every idea (ideas.IDEAS), every suggestion (ideas.SUGGEST) and every piece in Edit room's Add list (room3d.js
CATALOGUE), each from its own close look. OPTS is how the room is set for it (the same options the plan page's "Show it in my room"
button sends, so the room flies to that look with the piece switched on); AIM is the camera: an eye, the point it looks at (room cm)
and a field of view. shot3d.py renders SHOTS with the rest."""
import ideas

# the Add list, in the order Edit room shows it: (key, the label the room uses)
ADD = [("armchair", "Armchair"), ("sidetable", "Side table"), ("plant", "Tall floor plant"), ("bookcase", "Slim bookcase"), ("beanbag", "Beanbag"),
       ("footstool", "Footstool"), ("cushion", "Floor cushion"), ("crate", "Record crate"), ("rattan", "Rattan armchair"),
       ("ladder", "Blanket ladder (oak)"), ("bench", "Oak bench"), ("arclamp", "Arc floor lamp"), ("vase", "Floor vase with grasses"),
       ("pouffe", "Knitted pouffe"), ("basket", "Seagrass basket (throws)"), ("mirror", "Floor mirror (oak)"), ("lantern", "Lantern and candles")]
FLOOR = (362.0, -150.0)                       # the floor the dining table opens over, clear while it's folded
WALL = (444.0, -160.0)                        # against the dining cabinet's front (the slot past its end is narrower than the mirror)
ON_WALL = {"bookcase": 15.0, "ladder": 15.0, "mirror": 4.0}   # half its depth: these stand against it, facing the room

BASE = dict(site="C", cab="compact", dining="folded", tdoor=False, chairs="cupboard", scene="bright", tod="day", master=100)
EVENING = dict(scene="cosy", tod="evening")
SUGG_STATE = {"fairy": EVENING, "candles": EVENING, "shelfled": EVENING, "lantern": EVENING, "pclamp": EVENING, "barcase": dict(barflap=True, **EVENING), "bartrolley": dict(beside="trolley", trolley="out", dining="six", layout={"lamp": {"off": True}}, **EVENING),
              "runner": dict(dining="six"), "cablights": dict(tdoor=True, **EVENING), "hanger": {}, "blind": {},
              "barside": dict(barflap=True, **EVENING), "liftcoffee": dict(ctop=True), "recordtable": dict(ctop=True)}
SUGG_STATE.update(stairdrawers=dict(sdraw=True))   # v37: the step drawers pulled out
IDEA_STATE = {"sync": dict(scene="film", tod="evening"), "plantlight": dict(scene="film", tod="evening"), "night": dict(scene="film", tod="evening")}

# the cameras (room cm): eye, look-at, fov. Set by eye from test renders: the eye kept clear of the ottoman in the middle of the room
AIM = {
    "3d_id_case": ([245, 150, -150], [245, 175, 0], 50), "3d_id_glass": ([271, 205, 2], [191, 157, -318], 52),
    "3d_id_ctable": ([269, 103, -154], [63, 35, -129], 52), "3d_id_sync": ([286, 205, -210], [68, 117, 38], 52),
    "3d_id_cushions": ([250, 150, -120], [120, 70, -260], 55), "3d_id_plantlight": ([300, 125, -195], [392, 90, -300], 55),
    "3d_id_rugpad": ([300, 150, -130], [318, 0, -50], 45), "3d_id_button": ([385, 145, -60], [304, 122, 28], 46),
    "3d_id_night": ([330, 150, -110], [437, 70, 20], 55), "3d_id_clean": ([292, 58, -62], [271, 18, -12], 40),
    "3d_sg_floorplant": ([150, 150, -170], [30, 90, -80], 50), "3d_sg_sidetable": ([190, 130, -200], [76, 35, -108], 48),
    "3d_sg_pouffe": ([290, 130, -40], [175, 20, -95], 48), "3d_sg_art": ([150, 145, -200], [2, 135, -262], 48),
    "3d_sg_clock": ([330, 150, -120], [357, 200, 35], 50), "3d_sg_tray": ([230, 140, -100], [150, 45, -166], 45),
    "3d_sg_fairy": ([190, 150, -120], [190, 215, -300], 62), "3d_sg_hanger": ([190, 150, -170], [107, 170, -297], 48),
    "3d_sg_trail": ([200, 160, -90], [171, 195, 20], 48), "3d_sg_throw": ([170, 120, -80], [55, 45, -145], 50),
    "3d_sg_pclamp": ([142, 205, -170], [13, 170, -198], 52), "3d_sg_basket": ([360, 130, -170], [322, 25, -70], 48),
    "3d_sg_candles": ([360, 175, -190], [455, 200, -252], 45), "3d_sg_runner": ([36, 190, -175], [363, 95, -133], 52),
    "3d_sg_floorcush": ([230, 120, -60], [118, 15, -98], 48), "3d_sg_lantern": ([380, 130, -180], [325, 30, -283], 48),
    "3d_sg_mirror": ([125, 150, -190], [32, 150, -305], 46), "3d_sg_shelfled": ([118, 205, -132], [444, 191, -184], 52),
    "3d_sg_barcase": ([245, 140, -130], [245, 115, 0], 48), "3d_sg_bartrolley": ([235, 165, -285], [345, 55, -245], 55), "3d_sg_blind": ([190, 150, -130], [190, 150, -305], 62),
    "3d_sg_cablights": ([300, 130, -110], [455, 140, -133], 50),
    # v36: the third bar, the blankets' basket, more storage, the plant shelf
    "3d_sg_barside": ([170, 140, -150], [0, 112, -44], 50), "3d_sg_blanketbasket": ([175, 130, -45], [24, 40, -102], 48),
    "3d_sg_liftcoffee": ([240, 135, -95], [148, 45, -166], 46), "3d_sg_recordtable": ([150, 150, -250], [148, 40, -160], 48),
    "3d_sg_cotswoldbasket": ([175, 130, -45], [24, 40, -102], 48), "3d_sg_doorshelf": ([330, 150, -150], [357, 212, 35], 50),
    "3d_sg_shelfboxes": ([320, 175, -200], [455, 205, -185], 50),
    # v37: more storage (the window corner's three, the alcove shelves, the wall cabinets, the step drawers, the hook rail)
    "3d_sg_stairdrawers": ([330, 115, -150], [437, 28, -30], 46), "3d_sg_alcoveshelves": ([290, 165, -150], [391, 185, -300], 52),
    "3d_sg_windowseat": ([290, 140, -160], [391, 40, -290], 50), "3d_sg_hallbench": ([290, 140, -160], [391, 40, -295], 50),
    "3d_sg_wardrobe": ([240, 150, -110], [390, 115, -285], 58), "3d_sg_wallcabs": ([185, 150, -140], [5, 175, -251], 50),
    "3d_sg_overdoor": ([335, 140, -110], [357, 180, 35], 50),
    "3d_sg_growlights": ([391, 120, -170], [391, 95, -293], 50),   # v43
    "3d_sg_curtainmotor": ([190, 170, -150], [190, 200, -297], 60),
    "3d_sg_lpledges": ([140, 140, -210], [0, 120, -211], 55),
    "3d_sg_cordlamp": ([170, 125, -30], [62, 70, -128], 45),
    "3d_sg_stairscurtain": ([280, 165, -175], [425, 115, -5], 68),     # v78: the curtain across the foot of the stairs; v81 and its open side
}
_LOOK = {"armchair": 40, "sidetable": 25, "plant": 45, "beanbag": 28, "footstool": 20, "cushion": 7, "crate": 16, "rattan": 40, "bench": 22,
         "arclamp": 95, "vase": 65, "pouffe": 20, "basket": 26, "lantern": 23}
for _k, _y in _LOOK.items():           # the floor pieces, seen from by the door across the floor the table opens over
    AIM[f"3d_add_{_k}"] = ([285, 160 if _y > 60 else 135, -50], [FLOOR[0], _y, FLOOR[1]], 55 if _y > 60 else 44)
AIM["3d_add_arclamp"] = ([318, 175, -25], [348, 110, -150], 62)   # it arcs 180 up and 90 over
AIM["3d_add_vase"] = ([280, 150, -55], [362, 75, -150], 50)
for _k in ON_WALL:                     # the ones against the stairs wall
    AIM[f"3d_add_{_k}"] = ([290, 125, -175], [432, 92, -160], 60)


def sugg_opts(k):
    return dict(BASE, **SUGG_STATE.get(k, {}), sugg={k: True})


def idea_opts(k):
    if k == "cushions":
        return dict(BASE, decor={"cushions": "rust"})
    return dict(BASE, **IDEA_STATE.get(k, {}), ideas={k: True})


def add_opts(k):
    x, z = (WALL[0] - ON_WALL[k], WALL[1]) if k in ON_WALL else FLOOR
    return dict(BASE, added=[{"id": "add_" + k, "type": k, "x": x, "z": z, **({"rot": 90} if k in ON_WALL else {})}],
                layout={"add_" + k: {"rot": 90}} if k in ON_WALL else {})


def items():
    """[(stem, kind, key, title, options)] for every idea, suggestion and Add-list piece."""
    out = [(f"3d_id_{k}", "idea", k, t, idea_opts(k)) for k, t, *_ in ideas.IDEAS]
    out += [(f"3d_sg_{k}", "sugg", k, t, sugg_opts(k)) for k, t, *_ in ideas.SUGGEST]
    out += [(f"3d_add_{k}", "add", k, lab, add_opts(k)) for k, lab in ADD]
    return out


def with_aim(stem, opts):
    a = AIM.get(stem)
    return dict(opts, aim=dict(eye=a[0], at=a[1], fov=a[2])) if a else opts


def shots():
    """For shot3d.SHOTS: (stem, options, title for ../out)."""
    kind = {"idea": "IDEA (not in the plan)", "sugg": "SUGGESTED", "add": "EDIT ROOM, ADD"}
    firm = set(__import__("geometry").FIRM["sugg"])                    # v38: the client's picks are the plan, not suggestions
    lab = lambda kd, k: "YOUR PLAN" if kd == "sugg" and k in firm else kind[kd]
    return [(stem, with_aim(stem, o), f"{lab(kd, k)} - {t.replace('“', '').replace('”', '')}") for stem, kd, k, t, o in items()]
