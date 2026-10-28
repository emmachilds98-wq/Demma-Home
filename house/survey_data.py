"""v58: the house's sizes until the client measures (phase 0 stand-in). Every number is deduced from what we have, and says how.

Coordinates are the 3D room's: centimetres; x from the living room's east wall going west, z from its chimney breast's face (the window
wall's inside face is z -309, the front of the house +z), y up from the living room's floor.

Sources: M = measured by the client (inputs/room_sketch_accurate_mm.png); P = read off the client's corrected plans (inputs/
plan_*_corrected_25oct.jpg) at the living room's scale; F = the agent's front photo (inputs/photo_house_front_25oct.png), the garage
door (a standard 7 ft × 6 ft 6 in up-and-over, 213 × 198) for scale; B = the agent's back photo (inputs/photo_house_rear_24oct.jpg),
the living room's measured window (235 wide, 73 from the east wall) for scale; E = our estimate (usual UK construction).
When the client measures, the measured number replaces ours here (and the source becomes M)."""

# The living room, measured (M). It runs the house's full width inside, so it is the ruler for every plan.
LIVING = dict(w=467.0, d=347.0, ceil=235.0, window_x=(73.0, 308.0), window_y=(88.0, 212.0), src="M (window height E)")

# Each corrected plan's inside faces in its own pixels (P): east, west, back (north), front (south). Its scale: the inside width in
# pixels over the living room's measured 467; the depth then reads about 780 on all three floors (ground 779, first 781).
PLAN_PX = {
    "lower": dict(E=985, W=262, N=285, S=1515),
    "ground": dict(E=965, W=225, N=270, S=1505),
    "first": dict(E=975, W=240, N=295, S=1525),
}
# v68, the client: "the office / bedroom 3 is 2.25m wide on the desk side": the landing can't give way (its photo), so the front wall is
# 28.4 further out than the plans read (front inside face 499.4; the master bedroom 4.5 m, the agent's 4.45). The plans keep their scale
# (plan_d); past FRONT_OUT[floor] (cm on the plans' scale) everything moves out with the wall. On the ground floor the porch and the two
# cupboards keep the plans' depth and the hall runs on (measure them).
INSIDE = dict(w=467.0, d=808.4, plan_d=780.0, back=-309.0)   # P + client: the front inside face at -309 + 808.4 = 499.4
FRONT_OUT = {"lower": 440.0, "ground": 380.0, "first": 440.0}
AGENT_OVER = round((4.95 / 4.67 + 3.65 / 3.47) / 2, 3)  # the agent's labels read ~5% big (4.95 × 3.65 against the measured 4.67 × 3.47)

# Levels (E unless said): the living room's measured 235 ceiling with 25 of floor between storeys; the garage and the drive a step down.
LEVELS = dict(lower=-260.0, ground=0.0, first=260.0, ceil=235.0, slab=25.0, garage=-15.0, drive=-15.0, lawn=-260.0)

# V1.3: the plants in the gardens (B, E until measured). The cordyline: the back photo (photo_house_rear_24oct.jpg) shows it beside the
# concrete path near the right-hand (west) fence, about 4.5 m out from the house; nearer the camera than the house, its crown stands to
# about the living room window's top: about 5.6 m tall, forking at about 2 m into six heads of long narrow leaves (each about 110 long),
# the crown about 3.8 m across; its trunk about 26 thick at the foot
PLANTS = [dict(id="cordyline", kind="cordyline", x=370.0, y=-260.0, z=-787.0, h=560.0, fork=200.0, heads=6, spread=380.0, r=13.0, leaf=110.0,
               src="B: the back photo (photo_house_rear_24oct.jpg), sized against the house (E)")]

WALLS = dict(outer=28.0, inner=10.0, party=15.0)        # E: cavity brick 28; stud and block partitions 10; half the party wall

# The roof (F, B, E). Front: the gutter sits just over the first-floor windows, about 480 over the drive (F) → the wall plate at the
# first floor's ceiling, 495. Back: the gutter just over the living room's window (B) → the wall plate at 270, a little over the first
# floor: the back bedrooms are in the roof (the client: "built in a loft conversion"), so the flat-roofed dormer (the client) gives them
# their height. Pitch 35° (E, typical concrete-tile roof). The dormer: from the photo, 21% of the width in from the east end and 14% from
# the west (B), matching the black marks on the first-floor plan (bedroom 2's slope 98 wide, the bathroom's corner 57) (P); its flat
# roof at 530 (E) meets the back slope 34 in front of the breast face: it covers bedroom 2 almost exactly (P: bedroom 2 ends at 37).
# v68, three of the client's photos agree the back slope is steeper: in the bathroom the slope meets the ceiling by the sink (it "doesnt
# incline across the whole wall. it goes up to around the sink area then changes angles to be more straight"); in bedroom 2 the Kallax
# (147 high) stands in front of the low wall; outside, the dormer's windows sit right on the tiles. The back slope 50° (B + client), the
# front stays 35° (F, E); the ridge rises.
ROOF = dict(pitch=35.0, pitch_back=50.0, eaves_front=495.0, eaves_back=270.0, overhang=25.0, verge=12.0, t=22.0,
            dormer=dict(x=(90.0, 412.0), face=-300.0, top=530.0, t=12.0, roof_t=15.0))

# Openings in the outside walls: floor, side (n back, s front, e east), x span, sill and head over that floor.
OPENINGS = [
    dict(id="kitchen_window", floor="lower", side="n", x=(40.0, 220.0), sill=90.0, head=210.0, kind="window", design="bars", src="B (width), client v73 (centred on the sink, the door moved), E (height)"),
    dict(id="back_door", floor="lower", side="n", x=(228.0, 304.0), sill=0.0, head=205.0, kind="door", design="glazed", src="client v73: \"next to where that side board ends\" (the worktop, 225)"),
    dict(id="wc_window", floor="lower", side="n", x=(410.0, 460.0), sill=120.0, head=205.0, kind="window", design="bars", src="B"),
    dict(id="living_window", floor="ground", side="n", x=LIVING["window_x"], sill=LIVING["window_y"][0], head=LIVING["window_y"][1],
         kind="window", design="living", src="M", skip=True),          # the living room draws its own
    dict(id="front_door", floor="ground", side="s", x=(344.0, 426.0), sill=0.0, head=205.0, kind="door", design="porch", src="F + P (the porch's width)"),
    dict(id="garage_door", floor="ground", side="s", x=(44.0, 257.0), sill=-15.0, head=183.0, kind="door", design="garage", src="F"),
    dict(id="bed2_window", floor="first", side="n", x=(112.0, 262.0), sill=90.0, head=210.0, kind="window", design="casement", src="B + P", dormer=True),
    dict(id="bath_window", floor="first", side="n", x=(294.0, 394.0), sill=90.0, head=210.0, kind="window", design="casement", src="B + P", dormer=True),
    dict(id="master_window", floor="first", side="s", x=(56.0, 239.0), sill=75.0, head=200.0, kind="window", design="casement", src="F"),
    dict(id="bed3_window", floor="first", side="s", x=(317.4, 413.4), sill=75.0, head=200.0, kind="window", design="casement", src="F + P"),
]

# Doors between rooms, read off the plans (P, pixels on that floor's plan): "h" a wall running east-west at plan y, "v" one running
# north-south at plan x; span in the other direction. The living room's door is the measured model's (geometry.DOOR_X).
DOORS_PX = {
    "lower": [("wc_door", "h", 562, (290, 380)), ("kitchen_door", "v", 412, (600, 700)), ("store_door", "h", 836, (420, 530)),
              ("cupboard_door", "v", 535, (712, 818))],
    "ground": [("hall_porch", "h", 1385, (300, 410)), ("store_w", "v", 290, (1400, 1488)), ("store_e", "v", 420, (1400, 1488))],
    "first": [("bath_door", "h", 652, (395, 480)), ("bed2_door", "v", 545, (700, 815)), ("airing_door", "v", 545, (885, 990)),
              ("master_door", "v", 545, (1040, 1150)), ("bed3_door", "h", 1205, (400, 520))],
}
DOOR_H = 198.0                                          # the living room's door (export3d DOOR_H), E for the rest

# The lower flight: from the lower landing up to the hall, rising towards the front, under the living room's flight (P: the lower
# plan's stairs and "UP"; the store is under it, HOUSE.md). 13 risers of 20 (260 floor to floor), goings 22 (Approved Document K).
LOWER_STAIR = dict(x_px=(262, 405), z0_px=715, n=13, rise=20.0, going=22.0, src="P + E",
                   x=(408.0, 467.0))   # v66, the client: "make the door align with the given gap from the hallway to the living room, the
                                       # living room has accurate measurements so adjust the other rooms": under the living room's flight
                                       # (geometry.STAIR_X, 59 wide); the plan's 92 put its side wall across the doorway

# v60: the kitchen as it is (the client's photos, inputs/photo_kitchen_*_25oct.jpg): an L of white gloss units with black T-handles on
# legs along the east wall (x 0) and the front wall, the sink and washing machine under the window, a slimline dishwasher, a black
# freestanding cooker with the metro tiles to the ceiling behind it, the fridge-freezer by the boxed-in cupboard, a black speckled
# worktop, wall units, a breakfast bar on chrome legs, a grey wood-effect floor. Standard sizes (E): base units 60 deep, worktop at 90
# (3.8 thick), wall units 30 deep from 145 to 215; appliances 60 wide (the dishwasher 45, the cooker 50, the fridge-freezer 55 × 180).
# Runs in kitchen cm (x from the east wall, z as the house); each piece: (kind, from, to) along its wall.
# v68, the client: "dishwasher on left with sink above slightly to the left": along the window the dishwasher next to the corner, the
# sink just left of it under the window, then the washer and a unit; a unit where the dishwasher was on the tiled wall.
KITCHEN = dict(
    north=[("corner", 0, 60), ("dishwasher", 60, 105), ("unit_dd", 105, 165), ("washer", 165, 225)],   # fronts face the room (south); v73, the client: "no unit on left of washing machine"
    east=[("corner", -309, -249), ("unit_dd", -249, -204), ("cooker", -204, -154),                          # v73, the client: "only one cabinet there"
          ("unit_dd", -154, -84), ("unit_dd", -84, -14), ("corner", -14, 36)],                               # fronts face west
    south=[("unit_dd", 60, 97.5), ("unit_dd", 97.5, 135), ("fridge", 135, 190)],                              # fronts face north
    sink=(111, 159), tiles_to_ceiling=(-214, -154),
    # v73, the client: "two wall cupboards to the left of the oven ... pretty much flush with the wall bar around 5cm for where pipes run
    # up the corner", "3 cabinets on the wall to the right of the oven then 3 small cabinets on the right wall towards the fridge":
    # (from, to, doors)
    wall_units=dict(east=[(-304, -214, 2), (-154, 36, 3)], south=[(30, 135, 3)], over_fridge=(135, 190)), pipes=dict(x=(1.0, 4.0), z=(-307.5, -304.5)),
    # v73, the client: "the kitchen bar on the left as you come in is in line across the wall. then the boiler is in the corner next to
    # the door above this table. it should not overlap the door": the bar fixed flush on the door's wall (legs on its room side only),
    # the boiler on that wall over the bar's door end (E: a combi 40 wide, 70 high, 30 deep, its underside at 150)
    # v73: "it should be a table along that whole wall, boiler goes on the corner of the room on the right end of the table if you're
    # looking from the oven": from the back wall to the kitchen door's frame; the boiler in the back corner over its far end
    bar=dict(x=(304.8, 364.8), z=(-309.0, -108.0), h=92.0), chairs=[(276, -250), (276, -170)],
    boiler=dict(z=(-305.0, -265.0), y=(150.0, 220.0), d=30.0),
    src="client's photos (positions) + standard sizes (E)")
CHALK_DOORS = ["store_door", "cupboard_door", "airing_door"]
# v65, the client: "remember to include the bin cupboards in my entrance doorway too. there's a step before the front door and 2
# cupboards, one left and right, then front door ahead": the porch is open to the street (the front photo: white inside, the door set
# back); the stores either side are the bin cupboards (white doors into the porch). Bins (E): a 240 L wheelie bin 58 × 74 × 107 (EN 840),
# kerbside recycling boxes 60 × 40 × 35. Left and right as you face the house: left the west cupboard, right the east.
PORCH = dict(bin_240=dict(w=58.0, d=74.0, h=107.0), box=dict(w=60.0, d=40.0, h=35.0), src="client (layout) + EN 840 / standard boxes (E)")     # the client: chalkboard doors, the two in the cubby and upstairs

# v61: bedroom 3, the office, as the client plans it (inputs/photo_office_*_25oct.jpg: "the desk will be replaced with a straight oak
# desk. One of the PCs will go to the living room but the one next to another setup will stay. As well as the overhead shelf"). The
# room: x 283–467, z 274–499 (v68; the front wall, its window x 327–423); the side wall the shelf is on is the party wall (x 467).
# Sizes E: a desk 74 high, 70 deep, 180 long; 27-inch monitors (62 × 37, stacked on a pole); a mid-tower PC 23 × 46 × 45; the shelf
# 160 × 25 at 205 (from the photo, just under the ivy); a 76 × 56 pegboard (IKEA SKÅDIS size) under it by the corner.
# v66, the client: "remember its two setups in the bedroom 3 also side by side. it can be seen in the image i gave you": along the
# party wall from the back, the stacked pair (pink keyboard, the white PC under the desk), then by the window the side-by-side pair
# (two 24-inch, 54 × 33: E; black keyboard, the mic on its boom arm, the glass PC under the desk). The oak desk runs wall to wall.
# v68: the room 225 deep (z 274.4–499.4), the window in the middle of the front wall (x 326.9–422.9), the desk wall to wall.
OFFICE = dict(desk=dict(x=(397.0, 467.0), z=(275.5, 498.4), h=74.0, t=3.0),
              dual=dict(z=(388.0, 496.0), y0=96.0, h=33.0), pc2=dict(x=(414.0, 460.0), z=(446.0, 492.0), h=45.0), chair2=(370.0, 443.0),
              shelf=dict(z=(300.0, 488.0), d=25.0, y=205.0, t=4.0), pegboard=dict(z=(406.0, 482.0), y=(118.0, 174.0)),
              monitors=dict(z=(290.0, 352.0), y0=96.0, h=37.0, gap=3.0), pc=dict(x=(414.0, 460.0), z=(288.0, 311.0), h=45.0),
              chair=(370.0, 321.0), radiator=dict(x=(332.4, 417.4), y=(15.0, 65.0)),   # v69: the tall cupboard out (the client: "we will not be keeping it")
              src="client's photos (what goes where) + standard sizes (E)")

# v62: bedroom 2 as it is (inputs/photo_bedroom2_25oct.jpg, from its door looking towards the alley side): the block (the closed-off
# eaves outside the dormer, x 0–98, from the back wall to z -166: the plan's black mark), the slope open past it over the side wall;
# the black desk under the dormer window, the red gloss shelving (2 × 4 cubes, 77 × 147 × 39) against the block, a cat tree, the black
# chest of drawers and the airer under the slope, the double bed (135 × 190) with its black headboard against the side wall, grey carpet.
# Standard sizes (E), placed off the photo.
# v68, the client: "music room has enough space to have a double bed infront of the door and still open the door the full way ... as well as
# having the kallax drawers across the alcove and able to pull those drawers out": the block's low wall stands where the 50° slope is 150
# high over the floor (the Kallax, 147, in front of it in the old photo), so the alcove in front of it is the Kallax's.
LOW_WALL = 150.0
_block_z = round(INSIDE["back"] - WALLS["outer"] + (LEVELS["first"] + LOW_WALL - ROOF["eaves_back"]) / __import__("math").tan(__import__("math").radians(ROOF["pitch_back"])), 1)
BED2 = dict(block_z=_block_z, block_x=98.0, low_wall=LOW_WALL,   # v68: from the slope (v64 had fitted -180, the plan read -166)
            desk=dict(x=(140.0, 268.0), z=(-288.0, -230.0), h=74.0), chair=(205.0, -195.0),
            shelving=dict(x=(98.0, 137.0), z=(-292.0, -215.0), h=147.0), cat_tree=(160.0, -180.0),
            chest=dict(x=(0.0, 55.0), z=(-180.0, -138.0), h=95.0), airer=dict(x=(50.0, 92.0), z=(-160.0, -112.0), h=125.0),
            bed=dict(x=(0.0, 205.0), z=(-107.0, 35.0), head_h=105.0), side_table=dict(x=(225.0, 268.0), z=(-112.0, -64.0), h=50.0),
            src="client's photo (what goes where) + standard sizes (E)")

# v63: the master bedroom (the client's photo, not stored: a person is in it): the pine ottoman bed (lift-up base, slatted headboard)
# "in the middle facing the door", its headboard on the end wall (x 0); pine bedside drawers each side; a pine chest of drawers; grey
# carpet. One bedside on the left of the bed, the chest on its right (the photo). The client's "two 1m kallax wardrobes" go "Left wall behind airing cupboard": side by side along the back wall of the alcove
# (x 0 to the airing cupboard at 181, by the plan). Sizes E: a king bed 150 × 200 (frame 162 × 212); wardrobes 100 × 58 × 201 each;
# bedsides 40 × 35 × 60; chest 80 × 45 × 80.
# v68, the client: storage for two. The bed in the middle of the open wall (z 107–499); the same pine bedside each side; the chest under
# the window, lower than its sill (75); the ottoman lifts from the foot on gas struts, four 60 × 40 × 25 boxes inside (E). In each 1 m
# frame, one each: a top shelf, a hanging rail, three KOMPLEMENT drawers (100 × 58, 16 high: ikea.com), boxes on top to the ceiling. A
# BILLY (40 × 28 × 202: ikea.com) between the wardrobes and the bed.
MASTER = dict(bed=dict(x=(0.0, 212.0), z=(228.0, 390.0), head_h=118.0, lift=50.0, boxes=dict(w=60.0, d=40.0, h=25.0)),
              bedsides=[(186.0, 226.0), (392.0, 432.0)],   # v72: centred on the wall past the alcove (118.5–499.4); the king 150 × 200 in its pine frame
              chest=dict(x=(107.5, 187.5), z=(454.4, 499.4), h=72.0), wardrobes=dict(x0=0.0, w=100.0, n=2, d=58.0, h=201.0,
              drawer_h=16.0, drawers=3, top_boxes=30.0),   # v69: no BILLY (it blocked a wardrobe): only floor-free storage
              alcove=(0.0, 202.0), src="client (layout, the wardrobes' gap) + standard sizes (E) + ikea.com (KOMPLEMENT, BILLY)")

# v65: the bathroom as it is (inputs/photo_bathroom_sink_25oct.jpg from the door, photo_bathroom_bath_25oct.jpg towards the window): on
# the left the white gloss vanity (85, basin, black tap) against the side wall under the slope, a slim white cabinet beyond it, then the
# tiled box in the low corner (the plan's black mark), its side the dormer's cheek; ahead the close-coupled toilet under the frosted
# window; the bath (170 × 70) along the right from the window wall to by the door, a ceiling-hung rail, a white curtain, a black shower
# head; stone-effect grey wall tiles 60 × 30, black marble-effect floor tiles 60 × 60. Sizes E (standard), placed off the photos.
BATH = dict(strip_x=400.0, box_z=-191.0, box_h=125.0, slope_y0=133.0, beam_y=219.0, mirror=dict(z=(-151.0, -106.0), y=(115.0, 163.0)), vanity=dict(z=(-171.0, -86.0), d=33.0, top=86.0, basin_d=45.0),
            slim=dict(z=(-191.0, -171.0), d=30.0, h=80.0), toilet=dict(x=(359.0, 395.0), d=65.0, cistern_h=80.0),
            bath=dict(x=(283.3, 353.0), l=170.0, h=55.0), rail_y=205.0, tiles=dict(sill=90.0, bath=200.0, sink=125.0, cheek=125.0),
            src="client's photos (what goes where) + standard sizes (E)")
# v81, the client: "it currently shows a large incline wall that covers most the sink area. you have images that show it actually cuts
# off and becomes straight again": the photo (inputs/photo_bathroom_sink_25oct.jpg): the tiles level all round at the box's top, a short
# straight rise (slope_y0), then a steep slope that meets the ceiling over the vanity's far end; over the sink the wall is straight.
# v82, the client's photo from the door (inputs/photo_bathroom_from_door_27oct.jpg): the slope runs at the roof's pitch from there to a
# beam across the whole room at the dormer's front edge, straight up from its underside to the ceiling by the door; over the toilet and
# the bath the dormer's ceiling is that low, just over the window's frame (beam_y: the roof's pitch from slope_y0 meets the dormer's front
# at 219, 9 over the window's head, as the photo). The mirror over the basin with its light bar on top (E, the photo).

# v67, the client's photos (inputs/photo_wc_25oct.jpg, photo_hall_*_25oct.jpg, photo_stairs_*_25oct.jpg, photo_landing_*_25oct.jpg):
# the WC: the yellow suite, a low-level cistern under the window with its flush pipe; the small wall-hung basin on the right as you go in
# (the plan's maroon mark), four white tiles over it, the roll holder; white pipes; laminate. Sizes E (standard).
WC = dict(toilet=dict(x=(417.0, 453.0), d=62.0), cistern=dict(x=(412.0, 458.0), y=(78.0, 102.0), d=14.0),
          basin=dict(z=(-184.0, -138.0), d=30.0, rim=80.0), tiles=dict(z=(-189.0, -133.0), y=(82.0, 136.0)),
          src="client's photo (what goes where) + standard sizes (E)")
# the hall: the living room's flight boxed in (the tapestry on that wall) to where its landing ends; in that end, the white door down to
# the lower stairs with a grille over it; by the front door the mirror over the bench on the party wall, a shoe rack each side of the
# door, the radiator opposite, a pendant; grey carpet. The lower flight between walls, grey carpet, a handrail on the left going down.
# v68: by the front door, 28.4 further out with the front wall. v69, the client: the tapestry "renders like a sticking out plain orange
# sheet, please align and improve": on the stairs' box from the corner by the door down (photo_hall_to_living), hung from a wire under the
# ceiling to near the floor, 150 wide (a large tree-of-life tapestry: E), orange with a darker border and the black tree.
# v81, the client: "the tapestry ... covers the entirety of that wall, i will get confirmed sizing later": the box's whole side, the
# hall's back corner to the door down, floor to ceiling (tapestry z None: the wall's own length). "the rad shifted roughly half a meter
# to the left" (facing it: towards the living room; it stood behind the tall rack) and "the light switch appears above the rad slightly
# to the right between rad and shoe rack": its plate 117 up (as the others), just past the radiator's end.
HALL = dict(door=(410.0, 465.0), mirror=dict(z=(354.4, 390.4), y=(70.0, 205.0)), bench=dict(x=(433.0, 467.0), z=(353.4, 393.4), h=45.0),
            racks=[dict(x=(306.0, 340.0), z=(396.4, 419.4), h=180.0), dict(x=(424.0, 462.0), z=(396.4, 419.4), h=120.0)],
            radiator=dict(z=(276.4, 364.4), y=(15.0, 72.0)), switch_z=368.0, tapestry=dict(z=None, y=(3.0, 233.0)),
            src="client's photos (what goes where) + standard sizes (E)")
# the landing: a white post-and-rail balustrade along the stairwell, the loft hatch, a pendant and a smoke alarm, the bathroom door's fanlight.
LANDING = dict(rail_x=(403.0, 408.0), rail_h=92.0, hatch=dict(x=(300.0, 355.0), z=(115.0, 185.0)), fanlight=(205.0, 228.0),   # v73: the hatch overhead near the office end (both landing photos)
               src="client's photos + standard sizes (E: balustrade 900 high, Approved Document K)")
PENDANTS = {"hall": (345.0, 355.0), "landing": (345.0, 120.0), "bed3": (375.0, 372.0), "wc": (420.0, -215.0)}

# v64, the client: "Take out everything in bedroom 2 other than the drawers, desk and bed, plus red shelving. Black drawers go along the
# wall sticking out and drawers pull towards the bed": BED2_KEEP; the chest's side on the side wall, standing out into the room against
# the block, its drawers facing the bed (the gap to the bed is tight on these sizes: to measure).
BED2_KEEP = set()      # v66, the client: "you can remove everything from the bedroom 2 in order to make the best possible music room"
# v64, the client: "Just fit everything now to best scaling and I'll add better measures later": where a plan size and a thing the
# client has don't fit, the room gives way, marked "fitted" here. The master bedroom's alcove takes the two 1 m wardrobes (2 m): the
# airing cupboard's side moves 21 cm (the plan read the alcove 181).
# v65, the client: "the master bedroom alcove is as deep as the kallax wardrobe and aligns with boiler cupboard, it is also only the
# frames with no doors right now": the alcove's front (and the boiler cupboard's) at the wardrobes' depth, 58 from its back wall (the plan
# read 89); the boiler cupboard's door narrows to suit.
# v66, the client: "the kitchen cupboard that comes out into the room is in line with the fridge not sticking out so much": its front
# at the fridge-freezer's (60 from the front wall; the plan read 82), the kitchen's pieces with it, its door narrower.
# v69, the client: "door for the bedroom 2 sits right in the corner next to the bathroom, then imeddiately the boiler cupboard with a
# frame, then about 15cm gap then main bedroom door and then another roughly 45cm gap": from the bathroom corner (z -77.5) bedroom 2's
# door (76 with 7 architraves: E, a standard 2'6" door), the boiler cupboard's (48 with 5 frames: the cupboard 58, as the alcove), a 15
# gap, the master's (76): bedroom 2's front wall comes back to z 13, the cupboard and the master's alcove to z 18.5-76.5 (58 deep).
# v69, the client: "move the wall more into the house entirely so the wall running from the front door to living room door on garage
# door side shifts slightly across so the bin cupboard on that side is half the size and garage wall aligns with where the alcove is in
# the living room ... The whole wall": the hall's side wall in line with the living room's recess by the door (the chimney breast's west
# face, geometry.BREAST_X[1] = 303.5; the door 12 in from it, as in the living room): the garage 2.91 wide, the hall 1.02, the meter
# cupboard (the electric box and the gas meter) 40 wide (the plans read 60).
WALL_HALL = 303.5     # the hall's face of the wall to the garage (M: the living room's breast)
# v72, the client: "make sure the cupboard in the middle is a meter wide and the door for my master bedroom is only around 40cm from right
# end of the corridor ... the light switch, should be centre of this gap ... bedroom two has a double so I suspect that it's bigger on
# the right side" (right as seen from the stairwell: towards the office): the landing wall from the bathroom corner (-77.5) to its end
# (261.7) is bedroom 2's door (94 with its architraves), the cupboard 100 (18.5-118.5), 15, the master's door (94), 34 to the end; the
# wall between the bedrooms comes forward behind the master's wardrobes (BED2_1, bedroom 2 an L), the alcove 58 in front of it, its
# front in line with the cupboard's (the client, v65).
# v73, the client: "bathroom door aligns with a wall sticking out that connects the bannister then it goes back in the stairwell to make
# the headspace as you walk up" (their picture: a line across the floor piece between the bathroom and the stairwell, a quarter of the way
# in) and "the boiler cupboard likely needs to be smaller, doors shifted along and bathroom door brought forward": the bathroom's front
# wall 25 forward (its landing face z -52.6), the stairwell open to it (the banister meets that wall); bedroom 2's door shifted along, the
# boiler cupboard 75 (was 100); the master's door, the 15 and the 34 stay.
# And: "the wall in the bedroom comes out 190mm to make more depth in the office space, so when entering the bedroom to the right the wall
# comes out that 190mm after 420mm from the doorframe making a small alcove space": past the corridor's end (z 268.1, 41.6 from the
# door's frame) the master's side wall 19 in (MASTER_1 to x 251), the office 19 wider (x0 263.7: 2.03 m, the plan's 2.04).
# v75, the client: "the door to the bathroom should align with the alcove that sticks out further than the stair well to make room to
# walk up ... adjust the doors in the hallway as needed", and their pick of three sketches: "Box out, door in line": the bathroom (with
# the box over the bottom of the flight) comes out to where the stairwell's opening starts, its wall and door in one line with it, the
# banister ending there. Where: the client's door rules kept (bedroom 2's door 2 from the corner, the 15 gap, the master's door and its
# 34 to the corridor's end), the boiler cupboard down to a usable 42 (a 30 door): the landing's end z -14.3 (63 forward of v72's),
# the bathroom about 1.8 x 2.9 (to measure: the bathroom door's frame to the office's along the wall). Bedroom 2 to z 54.5 across, its
# door's nook to 71.2 (BED2_1).
# v76, the client: "The boiler cupboard is smaller than average but not too small, probably 60 wide if I'm guessing, adjust walls as
# needed. It also actually just houses towels and boxes for stuff no boiler": the cupboard 60 (58.5-118.5, a 48 door), so the bathroom
# end (its wall, door and the box over the stairs, in one line) 18.2 back: the landing's end z -32.5, the bathroom about 1.8 x 2.7;
# bedroom 2's door with it, still in the corner; the master's door and its gaps as they were. Bedroom 2's door's nook gone (BED2_1 None).
FIT = {"first": {"bathroom": dict(x1=408.0, z1=-38.8), "bed2": dict(z1=54.5), "airing": dict(x0=202.0, z0=58.5, z1=143.5), "master": dict(x1=202.0, z0=60.5),
                 "master_b": dict(x0=202.0, z0=149.5, z1=268.1), "bed3": dict(x0=263.7),
                 "landing": dict(x1=408.0, z0=-32.5), "first_stairs": dict(x0=408.0, z0=-41.0, z1=196.0), "landing_top": dict(x0=408.0, z0=196.0)},
                 # v66: the stairwell over the flight; v67 (the landing photos): open to the flight's top step (the plans read 170)
       "ground": {"hall": dict(x0=WALL_HALL), "front_store_e": dict(x0=WALL_HALL), "garage": dict(x1=round(WALL_HALL - 12.6, 1))},
       "lower": {"kitchen": dict(z1=-23.8), "kitchen_1": dict(z0=-23.8), "kitchen_2": dict(z0=-23.8), "kitchen_cupboard": dict(z0=-23.8)}}
FIT_DOORS = {"kitchen_door": (-100.5, -37.1),   # v73, the client: "shift the door": to the landing's stairs end, clear of the bar and the boiler
             # v78b, the client: "adjusting the boiler room door to be wider towards the bedroom 1, you can move the bedroom 1 door
             # slightly closer to the lightswitch to the right if needed": the cupboard 10 wider that way (70), its door 58 (E, a 584
             # leaf), the 15 kept, the master's door 10 nearer the switch (the switch stays: 6 off the frame now)
             # v81, the client: "further adjust the boiler cupboard door to fit between the two bedrooms without moving bedroom doors":
             # its frames meet theirs (the 15 gone), the leaf 73 (E: a 711 leaf in its lining), the cupboard 85 behind it
             "airing_door": (64.5, 137.5),                  # v76: the cupboard 60 (client), its door 48 (E), centred; v78b 70 and 58
             # v78, the client: "adjust my bedroom door/master bedroom and boiler cupboard door to fit better within their gaps": the
             # frames as their v69 words, edge to edge: bedroom 2's 3 off the corner, the cupboard's straight after (no sliver between),
             # 15, the master's (76, as bedroom 2's: a 762 door, E), 40 to the corridor's end
             "cupboard_door": (-19.0, 31.0), "bed2_door": (-23.5, 52.5), "master_door": (149.5, 225.5),
             "bath_door": (290.2, 358.2)}   # v77, the two photos: in the corner by bedroom 2's door, 68 wide (E: against its 198 height)   # v69/v72/v73: the landing's doors in the client's order
FIT_DOOR_LINE = {"bath_door": -35.65}                # v76: in the bathroom's front wall, in line with the box's front (between -38.8 and -32.5)
# v77, the client (two photos: the bathroom end from the stairs, and up the flight): "the bathroom is still wrong. It comes out slightly
# above the stairs and is joined to the wall with the bannister and you can see the bedroom 2 door right there"; earlier "it goes back in
# the stairwell to make the headspace as you walk up". The photo from the stairs shows the short wall by the bathroom door (the
# whiteboard; the banister ends at it) in line with the door, its side showing, and the bathroom's wall over the stairs a little behind it,
# over the bottom step (the LED strip along its foot): the stairwell opens from the living room's stair front (z -41, its ceiling opening),
# the bathroom's corner over the stairs (this piece) ends 3.15 short of it for that wall. Bedroom 2's door round the corner as before.
BATH_1 = dict(x=(408.0, 467.0), z=(-309.0, -44.15))
BED2_1 = None                                         # v76: bedroom 2's door fits its front wall again (v75's nook gone)
MASTER_1 = dict(x=(202.0, 251.0), z=(268.1, 499.4))   # v73: the master past its alcove by the door (the wall 19 in for the office)
SWITCHES_AT = {("master_door", "landing"): 237.4}   # v72, the client: the master's switch in the middle of the gap to the corridor's end
METERS = dict(electric=dict(w=28.0, h=50.0, d=18.0, y=115.0), gas=dict(w=26.0, h=36.0, d=16.0, y=25.0),   # v69: to fit the 38-wide cupboard
              src="client (the electric box and the gas meter in it) + standard meter boxes (E)")
# v70: double sockets (E: 30 up, over a worktop 105, over a desk 90, over a bedside 75): (floor, the wall runs along x|z, its line, the
# room's side, where along it, height)
SOCKETS = [("first", "z", 0.0, 1, 185.0, 75.0), ("first", "z", 0.0, 1, 391.0, 75.0),        # the master: over each bedside
           ("first", "z", 467.0, -1, 300.0, 90.0), ("first", "z", 467.0, -1, 440.0, 90.0),   # the office: over the desk
           ("first", "z", 270.0, -1, -150.0, 95.0), ("first", "x", 54.5, -1, 60.0, 30.0),    # the music room: the return, by the chair-bed
           ("lower", "z", 0.0, 1, -60.0, 105.0), ("lower", "z", 0.0, 1, -230.0, 105.0),      # the kitchen: over the worktop
           ("ground", "z", 467.0, -1, 300.0, 30.0), ("ground", "z", 0.0, 1, 250.0, 100.0)]   # the hall; the garage
BIFOLD = {"bed3_door"}   # v69, the client: "we have a bifold white door on the bedroom 3 office too"

# v65, the client: "bedroom 2 music room confirmed"; v66: "you can remove everything from the bedroom 2 in order to make the best possible
# music room in this space. 2 guitars, amp, large keyboard with more to come, you can choose other items for now". The layout:
#   the large keyboard (88 keys, about 134 × 35, keys at 76 on a stand: E, the class of a Roland FP or Yamaha P) on the landing-side
#   wall, its bench; the light from the window falls across the keys;
#   the studio desk under the window (140 × 70, a monitor riser 12 high: E) with two 5-inch monitors (17 × 22 × 25: E), the audio
#   interface, a chair; you face the window with the room behind you;
#   the two guitars on a double stand and the amp (a 1 × 12 combo, about 47 × 24 × 43: E) under the slope, where the ceiling is too low
#   to stand anyway;
#   acoustic panels (60 × 60 × 5: E) at the side reflection points of the desk (the cheek wall, the keyboard wall); a rug (120 × 170: E);
#   the day bed against the front wall (IKEA HEMNES day-bed with 3 drawers: height 83, ikea.com; the UK 80 × 200 version about 88 × 211,
#   168 open: E, to confirm in store): seating, the guest bed, the drawers for cables and gear.
# v68, the client: "a double bed infront of the door and still open the door the full way ... the kallax drawers across the alcove and
# able to pull those drawers out"; a custom L desk and a compact seat that is also a bed. The layout now:
#   a custom L desk in birch ply (E: £250–450): 168 × 70 under the window (monitors on a riser, the screen), the 88-key (132 × 30 × 15,
#   the class of a Yamaha P-45: E) on a pull-out tray under it, keys at 72 (a piano's 72–76; 76 would need an 84 desk); the return
#   98 × 65 along the landing wall for the interface and the gear to come;
#   the chair-bed against the front wall (IKEA LYCKSELE: 80 wide, 100 deep, 87 high; a bed 80 × 188, ikea.com); opens clear of the desk;
#   the Kallax 2 × 4 across the alcove in front of the low wall (77 × 147 × 39, ikea.com), four 2-drawer inserts in the bottom row and
#   the next (33 × 37 × 33, ikea.com), the drawers pull out 33 clear;
#   the guitars on a double stand and the amp in the front corner; acoustic panels (60 × 60 × 5: E); a rug (105 × 130: E).
MUSIC = dict(desk=dict(x=(102.0, 270.0), z=(-288.0, -218.0), h=80.0, t=3.0, riser=12.0, ret=dict(x=(205.0, 270.0), z=(-218.0, -120.0)),
                       tray=dict(y=58.0, d=40.0)),
             keyboard=dict(x=(118.0, 250.0), d=30.0, h=15.0, key_y=72.0), chair=(170.0, -185.0),
             monitors=[(106.0, -286.0), (247.0, -286.0)],
             chairbed=dict(x=(100.0, 180.0), z1=54.5, d=100.0, h=87.0, bed_l=188.0),
             kallax=dict(x=(6.0, 83.0), z0=-219.5, d=39.0, h=147.0, cols=2, rows=4, drawers=4, drawer_d=33.0),
             amp=dict(x=(2.0, 26.0), z=(6.5, 53.5), h=43.0), guitars=[(60.0, -30.0), (60.0, -2.0)],
             panels=[("x", 269.0, -205.0, 125.0), ("x", 269.0, -140.0, 125.0), ("c", 103.0, -262.0, 135.0)],
             rug=dict(x=(95.0, 200.0), z=(-205.0, -75.0)), double_bed=dict(w=135.0, l=190.0),
             src="client (the music room, the guitars, the amp, the keyboard) + ikea.com (LYCKSELE, KALLAX) + standard sizes (E)")
# V1 (Phase 3): the client's own numbers from the app (house/client_edits.json, written by tools/pull_edits.py) replace the guesses above
__import__("client_edits").apply(globals())
