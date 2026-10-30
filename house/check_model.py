"""v58: the whole-house model's checks (phase 1). Prints a table; exits non-zero on any FAIL. Also draws each floor's plan
(house/out/plan_<floor>.svg) and lays the model over the client's corrected plans (house/evidence/overlay_<floor>.jpg)."""
import pathlib, sys
import model as Mo
import survey_data as D
import house as H

ROOT = pathlib.Path(__file__).resolve().parent
rows = []


def check(name, ok, note, warn=False):
    rows.append(("PASS" if ok else ("WARN" if warn else "FAIL"), name, note))


def inside(r, fp):
    xs = [p[0] for p in fp]; zs = [p[1] for p in fp]
    return min(xs) - 1 <= r["x0"] and r["x1"] <= max(xs) + 1 and min(zs) - 1 <= r["z0"] and r["z1"] <= max(zs) + 1


def overlap(a, b):
    return max(0, min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])) * max(0, min(a["z1"], b["z1"]) - max(a["z0"], b["z0"]))


# 1. The plans read to the living room's scale: each floor's depth about the same
for f, P in D.PLAN_PX.items():
    *_, sx, sz = Mo.cal(f)
    check(f"{f}: scale even both ways", abs(sx / sz - 1) < 0.04, f"{sx * 100:.1f} across, {sz * 100:.1f} down (px a metre)")

# 2. Rooms inside the house, not overlapping
for f in Mo.FLOOR_Y:
    rs = Mo.rooms(f); fp = Mo.footprint(f)
    bad = [r["id"] for r in rs if not inside(r, fp)]
    check(f"{f}: rooms inside the outline", not bad, ", ".join(bad) or f"{len(rs)} pieces")
    clash = [(a["id"], b["id"]) for i, a in enumerate(rs) for b in rs[i + 1:] if overlap(a, b) > 400]
    check(f"{f}: no rooms overlapping", not clash, str(clash) if clash else "none")

# 3. The living room, measured
liv = next(r for r in Mo.rooms("ground") if r["id"] == "living")
check("living room 467 × 347 (measured)", liv["x1"] - liv["x0"] == D.LIVING["w"] and abs((38 - D.INSIDE["back"]) - D.LIVING["d"]) < 0.5, "the house's inside width is its width")

# 4. Stacking (the client: "The kitchen is directly under the living room and bathroom and bedroom 2 above that")
sz = Mo.room_sizes()
k, b, b2 = sz["kitchen"], sz["bathroom"], sz["bed2"]
check("kitchen under the living room", overlap(k, liv) / ((k["x1"] - k["x0"]) * (k["z1"] - k["z0"])) > 0.9, f"{overlap(k, liv) / ((k['x1'] - k['x0']) * (k['z1'] - k['z0'])):.0%} of it")
for r, n in ((b, "bathroom"), (b2, "bedroom 2")):
    fr = overlap(r, liv) / ((r["x1"] - r["x0"]) * (r["z1"] - r["z0"]))
    check(f"{n} over the living room", fr > 0.85, f"{fr:.0%} of it")

# 5. Openings inside their walls, below the ceilings
for op in D.OPENINGS:
    ok = 5 <= op["x"][0] < op["x"][1] <= D.INSIDE["w"] - 5 and op["sill"] < op["head"] <= D.LEVELS["ceil"]
    check(f"opening {op['id']}", ok, f"{op['x'][0]:.0f}–{op['x'][1]:.0f}, {op['sill']:.0f}–{op['head']:.0f}")
for op in D.OPENINGS:
    if op.get("dormer"):
        ok = Mo.DM["x"][0] + Mo.DM["t"] < op["x"][0] and op["x"][1] < Mo.DM["x"][1] - Mo.DM["t"] and Mo.FLOOR_Y["first"] + op["sill"] > Mo.under_back(Mo.DM["face"])
        check(f"{op['id']} in the dormer's face", ok, f"sill {Mo.FLOOR_Y['first'] + op['sill']:.0f} over the slope's {Mo.under_back(Mo.DM['face']):.0f}")

# 6. Doors on a wall between two rooms
for f in Mo.FLOOR_Y:
    rs = Mo.rooms(f)
    for d in Mo.doors(f):
        near = [r["id"] for r in rs if (d["axis"] == "x" and min(abs(r["z0"] - d["line"]), abs(r["z1"] - d["line"])) < 16 and r["x0"] - 2 <= d["a"] and d["b"] <= r["x1"] + 2)
                or (d["axis"] == "z" and min(abs(r["x0"] - d["line"]), abs(r["x1"] - d["line"])) < 16 and r["z0"] - 2 <= d["a"] and d["b"] <= r["z1"] + 2)]
        check(f"{f}: {d['id']} on a wall", len(near) >= 1, ", ".join(near) or "no room edge")

# 7. Stairs: floor to floor exactly
st = Mo.stair()
check("lower flight rises floor to floor", abs(st["n"] * st["rise"] - (Mo.FLOOR_Y["ground"] - Mo.FLOOR_Y["lower"])) < 0.1, f"{st['n']} × {st['rise']}")
G = __import__("importlib").util
sp = G.spec_from_file_location("geometry", ROOT.parent / "media-wall/src/geometry.py"); Gm = G.module_from_spec(sp); sp.loader.exec_module(Gm)
top = Gm.ALC_D - Gm.STAIR_D + 6 + (Gm.STAIR_N - 1) * Gm.STAIR_GOING
cxf, czf, *_ = Mo.cal("first")
plan_top = czf(1050)
lt = next(r for r in Mo.rooms("first") if r["id"] == "landing_top")
check("the living room's flight reaches the first-floor landing", abs(top - lt["z0"]) < 3,
      f"its top step at z {top:.0f}, the landing fitted to it (the plans read {plan_top:.0f}: count the steps to confirm)")

# 8. The roof: the dormer covers bedroom 2 (the client's flat roof), the ridge over everything
check("bedroom 2 full height past its low wall: the dormer, then the slope over the ceiling", Mo.ZC_BACK <= Mo.DORMER_BACK,
      f"v68 (the back slope {D.ROOF['pitch_back']:g}°): the slope passes the ceiling at z {Mo.ZC_BACK:.0f}, the dormer meets it at {Mo.DORMER_BACK:.0f}")
check("ridge over the dormer", Mo.RIDGE_Y > Mo.DM["top"] + 30, f"ridge {Mo.RIDGE_Y:.0f}, dormer {Mo.DM['top']:.0f}")
check("front rooms full height", Mo.under_front(Mo.FRONT) >= Mo.FLOOR_Y["first"] + Mo.CEIL - 1, f"the front slope at the wall {Mo.under_front(Mo.FRONT):.0f}")

# 9. v63: the client's two 1 m wardrobes in the alcove behind the airing cupboard
W = D.MASTER["wardrobes"]
have = next(r["x0"] for r in Mo.rooms("first") if r["id"] == "airing")      # v64: the alcove, fitted (survey_data.FIT)
need = W["n"] * W["w"]
check("master: the wardrobes fit the alcove", need <= have, f"they need {need:.0f}, the alcove (fitted) {have:.0f}: measure it to confirm")
dep = next(r["z1"] for r in Mo.rooms("first") if r["id"] == "airing") - next(r["z0"] for r in Mo.rooms("first") if r["id"] == "master")
# v78b, the client: the boiler cupboard's door "wider towards the bedroom 1": the cupboard 10 wider that way, so its end stands 10 past
# the wardrobes' fronts (v65: "as deep as the kallax wardrobe and aligns with boiler cupboard"; measure which still holds)
# v81, the client: the cupboard's door "to fit between the two bedrooms": the cupboard 15 wider again, its end 25 past them (measure)
check("master: the wardrobes in the alcove, the boiler cupboard's end at most 25 past their fronts (client)", 0 <= dep - W["d"] <= 25,
      f"alcove {dep:.0f} deep (fitted), wardrobes {W['d']:.0f}: the cupboard's end {dep - W['d']:.0f} past their fronts")
# v68: the master bedroom's storage for two; the office 2.25 m (the client)
MA = D.MASTER; bd = MA["bed"]; mrz = (next(r["z0"] for r in Mo.rooms("first") if r["id"] == "airing" or r["id"] == "master_b"), Mo.FRONT)
sides = [s_ for s_ in MA["bedsides"] if s_[1] <= bd["z"][0] or s_[0] >= bd["z"][1]]
check("master: a bedside each side of the bed", len(sides) == 2 and MA["bedsides"][0][1] <= bd["z"][0] and MA["bedsides"][1][0] >= bd["z"][1],
      f"bed z {bd['z'][0]:.0f}–{bd['z'][1]:.0f}, bedsides {', '.join(f'{a_:.0f}–{b_:.0f}' for a_, b_ in MA['bedsides'])}")
mw = next(p_ for p_ in D.OPENINGS if p_["id"] == "master_window")
check("master: the chest under the window, below its sill", mw["x"][0] <= MA["chest"]["x"][0] and MA["chest"]["x"][1] <= mw["x"][1] and MA["chest"]["h"] < mw["sill"],
      f"chest x {MA['chest']['x'][0]:.0f}–{MA['chest']['x'][1]:.0f}, {MA['chest']['h']:.0f} high; the window x {mw['x'][0]:.0f}–{mw['x'][1]:.0f}, sill {mw['sill']:.0f}")
mz0 = next(r["z0"] for r in Mo.rooms("first") if r["id"] == "master"); wf = mz0 + MA["wardrobes"]["d"]
inway = [n for n, z in (("a bedside", MA["bedsides"][0][0]), ("the bed", bd["z"][0])) if z < wf + 60]
check("master: 60 clear in front of the wardrobes (client: nothing blocks them)", not inway, ", ".join(inway) or f"the fronts at z {wf:.0f}, the nearest piece from {min(MA['bedsides'][0][0], bd['z'][0]):.0f}")
import math as _m
foot = Mo.FLOOR_Y["first"] + 38 + (bd["x"][1] - bd["x"][0] - 8) * _m.sin(_m.radians(bd["lift"])) + 30
check("master: the bed lifts clear of the ceiling", foot < Mo.FLOOR_Y["first"] + Mo.CEIL - 5, f"lifted {bd['lift']:.0f}°, the mattress's foot at {foot - Mo.FLOOR_Y['first']:.0f} under 235")
top = Mo.FLOOR_Y["first"] + MA["wardrobes"]["h"] + MA["wardrobes"]["top_boxes"]
check("master: the boxes on the wardrobes under the ceiling", top <= Mo.FLOOR_Y["first"] + Mo.CEIL, f"to {top - Mo.FLOOR_Y['first']:.0f} of 235")
b3 = next(r for r in Mo.rooms("first") if r["id"] == "bed3"); bw = next(p_ for p_ in D.OPENINGS if p_["id"] == "bed3_window")
check("office: 2.25 m on the desk side (client)", abs(b3["z1"] - b3["z0"] - 225) < 1.5, f"{b3['z1'] - b3['z0']:.1f} (z {b3['z0']:.1f}–{b3['z1']:.1f})")
check("office: the window in the middle of the front wall (client)", abs((bw["x"][0] + bw["x"][1]) / 2 - (b3["x0"] + b3["x1"]) / 2) < 1,
      f"the window's middle x {(bw['x'][0] + bw['x'][1]) / 2:.1f}, the room's {(b3['x0'] + b3['x1']) / 2:.1f}")
check("office: the desk wall to wall", D.OFFICE["desk"]["z"][0] - b3["z0"] < 2 and b3["z1"] - D.OFFICE["desk"]["z"][1] < 2, f"z {D.OFFICE['desk']['z'][0]:.1f}–{D.OFFICE['desk']['z'][1]:.1f}")
mr = next(r for r in Mo.rooms("first") if r["id"] == "master")
ma = next(r for r in Mo.rooms("first") if r["id"] == "airing")
check("master: past the alcove (the client's landing; the agent read 4.45)", 350 <= mr["z1"] - ma["z1"] <= 460, f"{mr['z1'] - ma['z1']:.0f} from the alcove's front to the front wall: smaller (client: 'rather wide')")
b2_ = Mo.room_sizes()["bed2"]
check("bedroom 2 bigger behind the master's wardrobes (client)", b2_["z1"] - b2_["z0"] > 350, f"{(b2_['x1'] - b2_['x0']) / 100:.2f} × {(b2_['z1'] - b2_['z0']) / 100:.2f} m at its longest (an L)")
check("master: a king bed (150 × 200) in its frame fits with 60 round it", MA["bed"]["z"][1] - MA["bed"]["z"][0] >= 160 and MA["chest"]["z"][0] - MA["bed"]["z"][1] >= 60, f"the frame {MA['bed']['x'][1] - MA['bed']['x'][0]:.0f} × {MA['bed']['z'][1] - MA['bed']['z'][0]:.0f}")
# v81, the client: the hall's radiator "shifted roughly half a meter to the left", its switch "above the rad slightly to the right between
# rad and shoe rack"; the bathroom's slope "actually cuts off and becomes straight again" (over the sink)
Hh_ = D.HALL; rk_ = min(r_["z"][0] for r_ in Hh_["racks"] if r_["x"][0] < D.WALL_HALL + 10)
check("hall: the radiator clear of the tall rack, its switch between them (client)", Hh_["radiator"]["z"][1] < Hh_["switch_z"] and Hh_["switch_z"] + 8.5 < rk_,
      f"radiator to {Hh_['radiator']['z'][1]:.0f}, switch {Hh_['switch_z']:.0f}–{Hh_['switch_z'] + 8.5:.0f}, the rack from {rk_:.0f}")
# v82, their photo from the door: the slope stops at a beam across the room at the dormer's front; the dormer's ceiling at its underside
B_ = D.BATH; bw_ = next(p_ for p_ in D.OPENINGS if p_["id"] == "bath_window"); ms_ = B_["slope_y0"] + (B_["mirror"]["z"][0] - B_["box_z"]) * (B_["beam_y"] - B_["slope_y0"]) / (Mo.DORMER_BACK - B_["box_z"])
check("bathroom: the slope up to the beam at the dormer's front, straight up from there; the dormer's ceiling over the window (client)",
      bw_["head"] + 5 <= B_["beam_y"] < Mo.CEIL - 10 and ms_ > B_["mirror"]["y"][1] + 5,
      f"the beam's underside {B_['beam_y']:.0f} (its face {Mo.CEIL - B_['beam_y']:.0f}), the window's head {bw_['head']:.0f}; over the mirror's far edge the slope at {ms_:.0f}")
# v69, the client: the landing's doors in order from the bathroom corner
L_ = next(r for r in Mo.rooms("first") if r["id"] == "landing"); dd = {d_["id"]: d_ for d_ in Mo.doors("first")}
air_ = next(r for r in Mo.rooms("first") if r["id"] == "airing")
AR_ = 6.0                                                          # v78: frame to frame (the model's architraves are 6 wide)
gaps = [dd["bed2_door"]["a"] - AR_ - L_["z0"], dd["airing_door"]["a"] - AR_ - (dd["bed2_door"]["b"] + AR_), dd["master_door"]["a"] - AR_ - (dd["airing_door"]["b"] + AR_)]
endg = L_["z1"] - (dd["master_door"]["b"] + AR_)
# V1.18: a standard door and out past the wardrobes' front (survey_data.AIRING). V1.8, the client: the cupboard out into both bedrooms, its end in the master at the wardrobes' front ("adjust as needed"): its door in
# it, straight after bedroom 2's; the wall from it to the master's door plain (v81's frames meeting no longer holds)
wf_ = next(r for r in Mo.rooms("first") if r["id"] == "master")["z0"] + D.MASTER["wardrobes"]["d"]
check("landing: bedroom 2's door in the corner, the boiler cupboard's straight after it and within the cupboard, about 40 to the end (client)",
      gaps[0] <= 3 and 0 <= gaps[1] < 1 and gaps[2] >= 0 and air_["z0"] <= dd["airing_door"]["a"] and dd["airing_door"]["b"] <= air_["z1"]
      and abs(air_["z1"] + D.AIRING["wall_master"] - wf_ - D.AIRING["into_master"]) < 1 and 25 <= endg <= 50,   # V1.18: out past the wardrobes' front
      f"gaps {', '.join(f'{g:.0f}' for g in gaps)}, the cupboard {air_['z1'] - air_['z0']:.0f}, {D.AIRING['into_master']:.1f} past the wardrobes' front, {endg:.0f} to the corridor's end")
sw_ = D.SWITCHES_AT[("master_door", "landing")] + 4.25
# v78b, the client: the master's door "slightly closer to the lightswitch": the switch stays, just right of the door's frame
fr_ = dd["master_door"]["b"] + AR_
check("landing: the master's switch just right of its frame, in the gap (client)", 3 <= sw_ - 4.25 - fr_ <= 10 and sw_ + 4.25 < L_["z1"] - 5,
      f"its plate {sw_ - 4.25 - fr_:.1f} off the frame, {L_['z1'] - sw_ - 4.25:.1f} to the corridor's end")
for did, rid in (("bed2_door", "bed2"), ("airing_door", "airing"), ("master_door", "master_b")):
    r_ = next(r for r in Mo.rooms("first") if r["id"] == rid)
    n_ = next((r for r in Mo.rooms("first") if r["id"] == "bed2_1"), None)
    if rid == "bed2" and n_ and abs(n_["z0"] - r_["z1"]) < 0.5:   # v75: with its door's nook (bed2_1) by the landing wall, if there is one
        r_ = dict(r_, z1=max(r_["z1"], n_["z1"]))
    check(f"landing: {did} opens into {rid}", r_["z0"] <= dd[did]["a"] and dd[did]["b"] <= r_["z1"], f"door {dd[did]['a']:.1f}–{dd[did]['b']:.1f}, the room {r_['z0']:.1f}–{r_['z1']:.1f}")
# v77, the client's photos from the stairs and the office: the bathroom door in the corner beside bedroom 2's, the short wall the banister
# ends at beside it, the stairwell open to the landing and a little further back than it (the bathroom's corner over the bottom step)
rs_ = {r["id"]: r for r in Mo.rooms("first")}; bd_ = next(q for q in Mo.doors("first") if q["id"] == "bath_door")
pier_ = rs_["landing"]["x1"] - (bd_["b"] + 6)
check("landing: the bathroom door in the corner by bedroom 2's, the short wall beside it", 0 <= bd_["a"] - 6 - rs_["landing"]["x0"] <= 5 and 30 <= pier_ <= 50,
      f"{bd_['a'] - 6 - rs_['landing']['x0']:.1f} from the corner, the short wall {pier_:.1f}")
check("landing: open to the stairwell, the stairwell from the bottom step", rs_["first_stairs"]["z0"] < rs_["landing"]["z0"] and rs_["first_stairs"]["z0"] == -41.0,
      f"the stairwell from {rs_['first_stairs']['z0']:.1f}, the landing from {rs_['landing']['z0']:.1f} (the living room's stair front -41)")
# v69 (B7), the client: "only put in solutions that save or optimise space": nothing in a door's swing (each opens into its room)
def _foot():
    MA_, Mu_, O_ = D.MASTER, D.MUSIC, D.OFFICE
    cb_ = Mu_["chairbed"]; kx_ = Mu_["kallax"]; dk_ = Mu_["desk"]
    out = {"master_door": [("the bed", MA_["bed"]["x"], MA_["bed"]["z"]), ("the chest", MA_["chest"]["x"], MA_["chest"]["z"])] +
                          [("a bedside", (0.0, 35.0), z_) for z_ in MA_["bedsides"]],
           "bed2_door": [("the desk", dk_["x"], dk_["z"]), ("the desk's return", dk_["ret"]["x"], dk_["ret"]["z"]),
                         ("the chair-bed", cb_["x"], (cb_["z1"] - cb_["d"], cb_["z1"])), ("the Kallax", kx_["x"], (kx_["z0"], kx_["z0"] + kx_["d"]))],
           "bed3_door": [("the desk", O_["desk"]["x"], O_["desk"]["z"])]}
    return out
for did, pieces in _foot().items():
    d_ = next(q for q in Mo.doors("first") if q["id"] == did); w_ = d_["b"] - d_["a"] - 4
    if d_["axis"] == "z":                                         # on the landing's wall, opening west into the room
        swx, swz = (d_["line"] - 6 - w_, d_["line"] - 6), (d_["a"], d_["b"])
    else:                                                         # the office's, opening south into it (a bifold folds to half)
        w2 = w_ / 2 if did in D.BIFOLD else w_
        swx, swz = (d_["a"], d_["b"]), (d_["line"] + 6, d_["line"] + 6 + w2)
    hit = [n for n, xr, zr in pieces if xr[0] < swx[1] and xr[1] > swx[0] and zr[0] < swz[1] and zr[1] > swz[0]]
    check(f"clear swing: {did}", not hit, ", ".join(hit) or f"x {swx[0]:.0f}–{swx[1]:.0f}, z {swz[0]:.0f}–{swz[1]:.0f} clear")
# v70: "60 to pass" (the client: only things that save space): the main way through each furnished room
MA_, Mu_, O_ = D.MASTER, D.MUSIC, D.OFFICE
mb_ = next(r for r in Mo.rooms("first") if r["id"] == "master_b"); b3_ = next(r for r in Mo.rooms("first") if r["id"] == "bed3")
m1_ = next(r for r in Mo.rooms("first") if r["id"] == "master_1")   # v73: past the alcove the wall is 19 in
foot_x = m1_["x1"] if MA_["bed"]["z"][1] > m1_["z0"] else mb_["x1"]
ways = [("master: past the bed's foot to the window", foot_x - MA_["bed"]["x"][1]),
        ("master: from the wardrobes to the bedside", MA_["bedsides"][0][0] - (mz0 + MA_["wardrobes"]["d"])),
        ("master: from the bed to the chest", MA_["chest"]["z"][0] - MA_["bed"]["z"][1]),
        ("music room: past the chair-bed to the desk", 270.0 - Mu_["chairbed"]["x"][1]),
        ("office: from the chairs to the wall", O_["chair"][0] - 25 - b3_["x0"])]
for n, w in ways:
    own = n.startswith("master: past the bed's foot")             # v73: the client's own bed in their own room: a question for them, not a fail
    check(f"60 to pass: {n}", w >= 60, f"{w:.0f} wide" + ("" if w >= 60 else (": the wall 19 in past the alcove (client): does the bed sit another way? (measure)" if own and w < 55 else ": tight, a person turns sideways (measure)")), warn=w >= 55 or own)
# 10. v66: bedroom 2 as the music room: the day bed opens clear of the fixed pieces; the guitars and the amp move for a guest
Mu = D.MUSIC; dk = Mu["desk"]; cb = Mu["chairbed"]; kx = Mu["kallax"]
open_z = cb["z1"] - cb["bed_l"]
fixed = {"desk": dict(x=dk["x"], z=dk["z"]), "the desk's return": dk["ret"], "Kallax": dict(x=kx["x"], z=(kx["z0"], kx["z0"] + kx["d"]))}
hit = [k for k, v in fixed.items() if v["z"][1] > open_z and v["x"][0] < cb["x"][1] and v["x"][1] > cb["x"][0]]
check("music room: the chair-bed opens clear of the desk and the Kallax", not hit, ", ".join(hit) or f"open, it reaches z {open_z:.0f}")
kout = kx["z0"] + kx["d"] + kx["drawer_d"]
inway = [k for k, v in {"the chair-bed (open)": dict(x=cb["x"], z=(open_z, cb["z1"])), "the guitars": dict(x=(46, 74), z=(Mu["guitars"][0][1] - 22, Mu["guitars"][1][1] + 22)),
         "the desk": dict(x=dk["x"], z=dk["z"])}.items() if v["x"][0] < kx["x"][1] and v["x"][1] > kx["x"][0] and v["z"][0] < kout]
check("music room: the Kallax drawers pull out clear (client)", not inway, ", ".join(inway) or f"out to z {kout:.0f}")
b2 = next(r for r in Mo.rooms("first") if r["id"] == "bed2"); dr2 = next(d_ for d_ in Mo.doors("first") if d_["id"] == "bed2_door")
dw = dr2["b"] - dr2["a"] - 4; spare = (b2["x1"] - b2["x0"]) - Mu["double_bed"]["l"] - dw
check("music room: a double bed in front of the door, the door fully open (client)", spare >= 0,
      f"the bed {Mu['double_bed']['l']:.0f} + the door's swing {dw:.0f} in {b2['x1'] - b2['x0']:.0f}: {spare:.0f} spare")
check("music room: the 88-key under the desk on its tray", dk["tray"]["y"] + 2 + Mu["keyboard"]["h"] < dk["h"] - dk["t"],
      f"its top at {dk['tray']['y'] + 2 + Mu['keyboard']['h']:.0f}, the desk's underside {dk['h'] - dk['t']:.0f}; keys at {Mu['keyboard']['key_y']:.0f}")
gx1 = 74
check("music room: the guitars clear of the chair-bed", gx1 < cb["x"][0], f"the stand to x {gx1}, the chair-bed from {cb['x'][0]:.0f}")
headroom = Mo.headroom(Mu["amp"]["x"][0], Mu["amp"]["x"][1], (Mu["amp"]["z"][0] + Mu["amp"]["z"][1]) / 2) - Mo.FLOOR_Y["first"]
check("music room: the amp fits in the corner", Mu["amp"]["h"] + 5 < headroom, f"{Mu['amp']['h']:.0f} high under a ceiling of {headroom:.0f}")
check("music room: the Kallax in front of the low wall", kx["h"] <= D.BED2["low_wall"] and abs(kx["z0"] - D.BED2["block_z"]) < 1,
      f"{kx['h']:.0f} high against the {D.BED2['low_wall']:.0f} wall at z {D.BED2['block_z']:.1f}")
# v68: the kitchen's left corner (the client)
K_ = D.KITCHEN; kw = next(p_ for p_ in D.OPENINGS if p_["id"] == "kitchen_window"); dwp = next(p_ for p_ in K_["north"] if p_[0] == "dishwasher")
check("kitchen: the dishwasher by the corner, the sink just left of it under the window (client)",
      K_["north"][0][0] == "corner" and K_["north"][1][0] == "dishwasher" and dwp[2] <= K_["sink"][0] < dwp[2] + 15 and kw["x"][0] <= K_["sink"][0] and K_["sink"][1] <= kw["x"][1],
      f"dishwasher x {dwp[1]}–{dwp[2]}, the sink {K_['sink'][0]}–{K_['sink'][1]}, the window {kw['x'][0]:.0f}–{kw['x'][1]:.0f}")
# v66: the kitchen's cupboard in line with the fridge (the client)
kc = next(r for r in Mo.rooms("lower") if r["id"] == "kitchen_cupboard")
fr = next((a, b) for k_, a, b in D.KITCHEN["south"] if k_ == "fridge")
check("kitchen: the cupboard in line with the fridge (client)", abs(kc["z0"] - (36.2 - 60.0)) < 1, f"its front at z {kc['z0']:.1f}, the fridge's at {36.2 - 60:.1f}")
# v73, the client: the bar "in line across the wall", the boiler "in the corner next to the door above this table. it should not
# overlap the door", "no unit on left of washing machine"
K_ = D.KITCHEN; kd_ = next(q for q in Mo.doors("lower") if q["id"] == "kitchen_door"); kr_ = next(r for r in Mo.rooms("lower") if r["id"] == "kitchen")
check("kitchen: the bar flush on the door's wall (client)", abs(K_["bar"]["x"][1] - kr_["x1"]) < 0.5, f"its back at x {K_['bar']['x'][1]:.1f}, the wall {kr_['x1']:.1f}")
sw_k = (kd_["b"] - kd_["a"] - 4)                                   # the leaf swings into the kitchen, hinged at the stairs end
check("kitchen: the door's frame and swing clear the bar and the boiler", K_["bar"]["z"][1] <= kd_["a"] - 6 and K_["boiler"]["z"][1] <= kd_["a"] - 6,
      f"the door {kd_['a']:.1f}–{kd_['b']:.1f} (frame from {kd_['a'] - 6:.1f}), the bar to {K_['bar']['z'][1]:.1f}, the boiler to {K_['boiler']['z'][1]:.1f}; the leaf swings {sw_k:.0f} towards the stairs")
lo_, hi_ = next(r for r in Mo.rooms("lower") if r["id"] == "lower_landing")["z0"], next(r for r in Mo.rooms("lower") if r["id"] == "lower_landing")["z1"]
check("kitchen: the door opens onto the landing", lo_ <= kd_["a"] and kd_["b"] <= hi_ + 0.5, f"door {kd_['a']:.1f}–{kd_['b']:.1f}, the landing {lo_:.1f}–{hi_:.1f}")
check("kitchen: the washing machine at the run's end (client: no unit left of it)", K_["north"][-1][0] == "washer", f"the run ends {K_['north'][-1][0]} at x {K_['north'][-1][2]:.0f}")
# v73, the client: the back door "next to where that side board ends", the bar "a table along that whole wall", the boiler "on the corner
# of the room on the right end of the table if you're looking from the oven", the cupboards "flush with the wall bar around 5cm"
OP_ = {o_["id"]: o_ for o_ in D.OPENINGS}; bd_, kw_ = OP_["back_door"], OP_["kitchen_window"]; wt_end = K_["north"][-1][2]
check("kitchen: the back door next to the worktop's end, clear of the window and the bar", 0 <= bd_["x"][0] - wt_end <= 6 and bd_["x"][0] - kw_["x"][1] >= 5 and bd_["x"][1] <= K_["bar"]["x"][0],
      f"worktop to {wt_end}, door {bd_['x'][0]:.0f}–{bd_['x'][1]:.0f}, window to {kw_['x'][1]:.0f}, the bar from {K_['bar']['x'][0]:.1f}")
check("kitchen: the bar along the whole wall, back wall to the door's frame", abs(K_["bar"]["z"][0] - kr_["z0"]) < 0.5 and 0 <= (kd_["a"] - 6) - K_["bar"]["z"][1] <= 3,
      f"z {K_['bar']['z'][0]:.1f} to {K_['bar']['z'][1]:.1f} ({K_['bar']['z'][1] - K_['bar']['z'][0]:.0f} long); the back wall {kr_['z0']:.1f}, the frame {kd_['a'] - 6:.1f}")
check("kitchen: the boiler in the back corner over the bar's far end", K_["boiler"]["z"][0] - kr_["z0"] <= 5 and K_["bar"]["z"][0] <= K_["boiler"]["z"][0],
      f"boiler z {K_['boiler']['z'][0]:.0f}–{K_['boiler']['z'][1]:.0f}")
ek_ = [k for k, a, b in K_["east"]]; ci_ = ek_.index("cooker")
wu_ = K_["wall_units"]
check("kitchen: one unit between the oven and the back corner, two to the front corner (client)", ek_[:ci_] == ["corner", "unit_dd"] and ek_[ci_ + 1:] == ["unit_dd", "unit_dd", "corner"], " · ".join(ek_))
check("kitchen: the wall cupboards: 2 left of the oven 5 from the wall, 3 right, 3 small towards the fridge (client)",
      wu_["east"][0][2] == 2 and abs(wu_["east"][0][0] - (kr_["z0"] + 5)) < 1 and wu_["east"][1][2] == 3 and wu_["south"][0][2] == 3,
      f"left {wu_['east'][0][0]}–{wu_['east'][0][1]} ×{wu_['east'][0][2]}, right {wu_['east'][1][0]}–{wu_['east'][1][1]} ×{wu_['east'][1][2]}, front ×{wu_['south'][0][2]}")
# v66: the stairs and the hall line up with the living room's measured door and flight (the client)
st = Mo.stair(); fs = next(r for r in Mo.rooms("first") if r["id"] == "first_stairs")
check("stairs: both stairwells over the living room's flight (59 wide)", st["x0"] == Gm.STAIR_X[0] and fs["x0"] == Gm.STAIR_X[0], f"lower flight x {st['x0']:.0f}–{st['x1']:.0f}, the first floor's stairwell from {fs['x0']:.0f}, the flight {Gm.STAIR_X[0]:.0f}–{Gm.STAIR_X[1]:.0f}")
check("hall: floor all across the living room's door", Gm.DOOR_X[1] <= Gm.STAIR_X[0] - 2.2, f"the door x {Gm.DOOR_X[0]:.1f}–{Gm.DOOR_X[1]:.1f}, the stairs' wall from x {Gm.STAIR_X[0] - 2.2:.1f}")
# 11. v65: the cupboards either side of the porch; v69: the garage side's the meters, the other the bins (the client)
rs = {r["id"]: r for r in Mo.rooms("ground")}
e = rs["front_store_e"]; b = D.PORCH["bin_240"]
iw, idp = e["x1"] - e["x0"] - 2, e["z1"] - e["z0"] - 2
check("entrance: the meter cupboard narrower, the hall's wall in line with the living room's breast (client)", e["x0"] == D.WALL_HALL == rs["hall"]["x0"] and iw < 45,
      f"{iw:.0f} wide inside (the plans read 58; client: about half: measure), {idp:.0f} deep: the electric box and the gas meter")
check("hall: the living room's door inside the hall, 12 from its wall (as in the living room)", rs["hall"]["x0"] <= Gm.DOOR_X[0], f"the wall at {rs['hall']['x0']:.1f}, the door from {Gm.DOOR_X[0]:.1f}")
w_ = rs["front_store_w"]; iw_ = w_["x1"] - w_["x0"] - 2
check("entrance: a 240 L bin in the bin cupboard", b["w"] <= iw_, f"{iw_:.0f} wide inside, the bin {b['w']:.0f}: the plans read it too narrow: measure, which bins?", warn=True)
# 12. v65: nothing flickers outside (two faces in one plane): house/zfight.py
import zfight
ps = zfight.pairs()
check("no flicker on the outside", not zfight.outside(ps), f"{len(zfight.outside(ps))} pairs on the outside faces, roof edges or street ({len(ps)} inside walls and floors, out of sight)")

# --------------------------------------------------------------------- the drawings
OUT = ROOT / "out"; OUT.mkdir(exist_ok=True)
EV = ROOT / "evidence"
for f in Mo.FLOOR_Y:
    rs = Mo.rooms(f); s = 0.8
    w, h = 560 * s, 900 * s
    X = lambda x: (520 - x) * s; Z = lambda z: (z + 360) * s
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" font-family="sans-serif" font-size="11">',
             '<rect width="100%" height="100%" fill="#fff"/>']
    fp = Mo.footprint(f)
    parts.append('<polygon points="' + " ".join(f"{X(x):.1f},{Z(z):.1f}" for x, z in fp) + '" fill="none" stroke="#9a4b36" stroke-width="22" stroke-opacity="0.55"/>')
    for r in rs:
        if r["id"] == "living":
            fill = "#efe7d2"
        else:
            fill = "#f5f1e8"
        parts.append(f'<rect x="{X(r["x1"]):.1f}" y="{Z(r["z0"]):.1f}" width="{(r["x1"] - r["x0"]) * s:.1f}" height="{(r["z1"] - r["z0"]) * s:.1f}" fill="{fill}" stroke="#333" stroke-width="1"/>')
    for rid, r in sz.items():
        if r["floor"] == f and r["name"]:
            parts.append(f'<text x="{X((r["x0"] + r["x1"]) / 2):.1f}" y="{Z((r["z0"] + r["z1"]) / 2):.1f}" text-anchor="middle">{r["name"]} {(r["x1"] - r["x0"]) / 100:.2f} × {(r["z1"] - r["z0"]) / 100:.2f}</text>')
    for d in Mo.doors(f):
        if d["axis"] == "x":
            parts.append(f'<line x1="{X(d["a"]):.1f}" y1="{Z(d["line"]):.1f}" x2="{X(d["b"]):.1f}" y2="{Z(d["line"]):.1f}" stroke="#c0392b" stroke-width="4"/>')
        else:
            parts.append(f'<line x1="{X(d["line"]):.1f}" y1="{Z(d["a"]):.1f}" x2="{X(d["line"]):.1f}" y2="{Z(d["b"]):.1f}" stroke="#c0392b" stroke-width="4"/>')
    for op in D.OPENINGS:
        if op["floor"] == f:
            z = Mo.BACK - 14 if op["side"] == "n" else Mo.FRONT + 14
            parts.append(f'<line x1="{X(op["x"][0]):.1f}" y1="{Z(z):.1f}" x2="{X(op["x"][1]):.1f}" y2="{Z(z):.1f}" stroke="#2e86c1" stroke-width="6"/>')
    parts.append(f'<text x="10" y="20" font-size="14">{H.PLANS[f]["title"]} (model, back at the top; red doors, blue windows)</text></svg>')
    (OUT / f"plan_{f}.svg").write_text("\n".join(parts))
    # over the client's plan: the model's rooms in that plan's pixels
    try:
        from PIL import Image, ImageDraw
        img = Image.open(ROOT.parent / f"media-wall/inputs/plan_{ {'lower': 'lower_ground', 'ground': 'ground', 'first': 'first'}[f] }_corrected_25oct.jpg".replace(" ", "")).convert("RGB")
        P = D.PLAN_PX[f]; *_, sx, szz = Mo.cal(f)
        px = lambda x: P["E"] - x / sx; py = lambda z: P["N"] + (z - Mo.BACK) / szz
        dr = ImageDraw.Draw(img)
        for r in rs:
            dr.rectangle([px(r["x1"]), py(r["z0"]), px(r["x0"]), py(r["z1"])], outline=(0, 140, 255), width=4)
        img.convert("RGB").save(EV / f"overlay_{f}.jpg", quality=80)
    except Exception as e:                      # noqa: BLE001
        check(f"{f}: overlay drawn", False, str(e))

# V1 (Phase 1): the house file: every named piece has an id, a name, a room that exists and a source; every open measurement a room
import export_house as XH, re as _re
_h = XH.house(); _rooms = {r["id"] for r in _h["rooms"]} | {"airing", "porch", "front_store_w", "front_store_e", "lower_store", "kitchen_cupboard"}
_bad = [i["id"] for i in _h["items"] if not (_re.fullmatch(r"[a-z0-9_.]+", i["id"]) and i["name"] and i["src"] and i["room"] in _rooms)]
check("house file: every piece has an id, a name, a room and a source", not _bad, ", ".join(_bad[:8]) or f"{len(_h['items'])} pieces")
_dup = len(_h["items"]) - len({i["id"] for i in _h["items"]})
check("house file: no two pieces share an id", not _dup, f"{_dup} repeated" if _dup else "all different")
_need = [i["id"] for i in _h["items"] if i["kind"] in ("door", "window", "radiator") and i["room"] != "living" and not i.get("opening") and i["kind"] != "radiator"]
check("house file: every door and window has its opening", not _need, ", ".join(_need) or "all")
_mr = [m["id"] for m in _h["measure"] if m["room"] not in _rooms]
check("house file: every open measurement is in a room", not _mr, ", ".join(_mr) or f"{len(_h['measure'])} rows")
check("house file: the client's edits all applied", not _h["problems"], "; ".join(_h["problems"]) or "none waiting or all in")

w = max(len(r[1]) for r in rows)
for st_, n, note in rows:
    print(f"{st_:4}  {n:<{w}}  {note}")
fails = [r for r in rows if r[0] == "FAIL"]
print(f"\n{len(rows)} checks, {len(fails)} failed, {sum(r[0] == 'WARN' for r in rows)} to measure")
sys.exit(1 if fails else 0)
