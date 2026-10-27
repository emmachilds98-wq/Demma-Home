"""v13.2 fit proof (v13: no slatted panel; v13.2: the sub under an oak cover with no sides, six at the 170 × 80 table with its leaf) (v11 layout; v12 adds the six- and eight-seat checks against the sub): every item that goes in the wall, its size and where the size comes from, the space it goes
into, what's left, and a verdict. Spares are computed from geometry.py, so the tables can't drift from the
renders and diagrams. build_doc.py turns ZONES into one table per zone and SOURCES into the numbered list."""
import geometry as G

# ---------------------------------------------------------------- sources (numbered in the plan)
SOURCES = {
    "room": "Your hand-measured sketch of the living room, in mm (alcove 1860 × 380, chimney breast 1175, ceiling 2350)",
    "lg": "LG: OLED55C6 specifications: 1222 × 703 × 45.1 mm without stand, 1222 × 757 × 230 mm with stand, stand 470 × 230 mm, 14.1/15.9 kg, VESA 300 × 200 (lg.com, OLED55C6 product pages)",
    "hisense": "Trusted Reviews and Expert Reviews, Hisense AX5100G reviews: soundbar 920 × 60 × 90 mm, subwoofer 214 × 294 × 304 mm (W × H × D) with a rear-firing port, rear speakers 90 × 144 × 109 mm",
    "xbox": "Wikipedia, Xbox Series X: 151 × 151 × 301 mm; Pure Xbox (Nov 2020) quoting Microsoft: at least 4 cm clear above the console on an open stand, 10–15 cm recommended on all sides",
    "besta": "IKEA: BESTÅ frame 60 × 40 × 64 cm (10247379); BESTÅ shelf 56 × 36 cm, 20 kg maximum load",
    "sg108": "TP-Link: TL-SG108 specifications, 158 × 101 × 25 mm (tp-link.com)",
    "deco": "Laptop Outlet: TP-Link Deco X1500 3-pack listing, 110 × 110 × 114 mm per unit",
    "atlp120": "Audio-Technica: AT-LP120XUSB specifications, 452 × 352 × 141.6 mm, 8 kg without dust cover (audio-technica.com)",
    "rt6x": "RetroTINK: RetroTINK-6X CE shop page (power 5 V 2 A by USB; no size published)",
    "ugreen": "UGREEN: 5-in-1 4K60 HDMI switch CM568 (90512), 127 × 59 × 25 mm",
    "xb1psu": "Original Xbox One power supply: 17 × 7.5 × 4.8 cm (6.69 × 2.96 × 1.88 in), as listed by several replacement-PSU sellers",
    "consoles": "Wikipedia: Comparison of PlayStation consoles (PS1 270 × 188 × 60, PS2 302 × 183 × 78, PS3 325 × 274 × 98 mm); Xbox One (333 × 274 × 79 mm); Neowin: official Xbox 360 dimensions (309 × 258 × 83 mm)",
    "media": "Record and case sizes: LP sleeve 31.4 cm (12⅜ in); 7-inch sleeve 18.3–18.4 cm; DVD-style keep case 19 × 13.5 × 1.4 cm; Xbox One case 17 × 13.5 × 1.1–1.2 cm (videogamecasesize.info; Walvis Products; Wikipedia: Keep case)",
    "wolston": "Dunelm: Elements Wolston 4-light spotlight bar, £49: 84 × 16 cm, 22.4 cm drop, shades 15 cm, E14 6 W max (dunelm.com, product 1000189449)",
    "runners": "Emuca heavy-duty full-extension runners, 400 mm, 68 kg per pair; Accuride DZ3832EC 350 mm, 43 kg; runner fitting allowance 12.5 mm a side",
    "x360psu": "Xbox 360 original 203 W power supply: no Microsoft size published; Akyga's 203 W replacement for it (AK-PD-14) is 210 × 77 × 55 mm (b2b.akyga.com), so an allowance of 21 × 10 × 6 cm is used here (measure yours)",
    "lid": "Turntable Lab: Audio-Technica replacement dust cover for the AT-LP120XUSB (705-140XP-1815), 17.375 × 13.625 × 2.75 in (44.1 × 34.6 × 7.0 cm)",
    "hebgo": "Häfele UK, Technology catalogue 2023, p. 7.206: Hebgo heavy-duty folding bracket 287.43.428, arm 580 mm, height 220 mm, 500 kg per pair, locks automatically when raised; up to 800 mm between brackets (Häfele 287.43.419 listing)",
    "liftoff": "Screwfix: Union PowerLoad lift-off hinges, 100 × 88 mm, 3-pack (5938T), 120 kg maximum door weight",
    "legs": "Emuca: table legs Ø60 mm, 710 mm, height adjustable 710–730 mm, 50 kg per leg (set of 4): 710 is the standard dining leg; the plan's oak legs are made to the same 71 cm",
    "clip": "RS PRO 45 mm steel spring clip (RS 175-3588): 42.1 × 56 × 12.7 mm, packs of 10 (uk.rs-online.com)",
    "terje": "IKEA: TERJE folding chair, 43 W × 49 D × 78 H cm, seat height 48 cm, tested for 110 kg",
    "dining": "Book a Builder UK, small dining room ideas: 600 mm of table edge per diner; table edge to a wall 600 mm tight minimum, 750 mm to aim for, 1000–1100 mm to walk behind; dining height about 750 mm",
    "sofa": "Your photo of the sofa (18 Oct 2026) and your note (21 Oct): a blue corduroy L-sofa, two seats then the corner on the long side, which ends about 40 cm short of the window's west end (about 266 cm long); the return's 168 is a typical corner-sofa size until measured",
    "subport": "Klipsch subwoofer placement guidance, as quoted by Cloudspress and TechYorker (2026): leave about 6–12 in (15–30 cm) between a rear-firing port and the nearest obstruction",
    "psuplace": "Xbox Support (Microsoft), About the Xbox One power supply (archived): don't block its vents, don't put it in a confined space such as a bookcase, rack or stereo cabinet unless the space is well ventilated, don't stack devices on it, and lay it flat on its four rubber pads; the Xbox 360 brick's advice is the same",
    "x360place": "Xbox Support (Microsoft), Xbox 360 placement tips, as quoted on Gaming Stack Exchange: an open, well-ventilated area, a hard surface, and away from high-vibrating sources such as subwoofers",
    "photo20": "Your two photos of the west end (20 Oct 2026): the 2 m black shelf on the wall beside the stairs, scaled from its 2 m: it starts about 41 cm past the stair box and stops about 16 cm short of the window corner, top about 200; the pendant hangs about 55 cm out from the wall, a quarter of the way along it",
    "case": "Corsair 4000D Airflow, a typical mid-tower gaming case: 453 × 230 × 466 mm (TechPowerUp review)",
    "fliphinge": "Lee Valley: 40574 narrow flip-top hinges, solid brass, 1/2 in × 2 3/4 in (1.27 × 7.0 cm), for card and flip-top tables (leevalley.com); their 40208 card-table hinge is 1 3/16 in (3.0 cm) wide, too wide for a 27 mm edge",
    "curtains": "Your photo (20 Oct) and note: Dunelm hessian pencil-pleat curtains; Dunelm pencil-pleat drops run 137, 182 and 228 cm with a 3 in header; Dunelm 28 mm wooden poles, 120–360 cm, rings included (one per 10 cm), finials up to 8 cm more (dunelm.com)",
    "plantstand": "Your plant stand, from the listing you sent (20 Oct): 98 × 29.5 × 158 cm (W × D × H), slatted wood; two five-tier towers with an open middle holding two shelves",
    "vinylstand": "Your vinyl stand, from the listing you sent (20 Oct): 70 × 32 × 78 cm (W × D × H), 63 to where the frame slopes; two top bays 32.3 wide split by a wooden divider, a 10 cm front board, wire dividers 19.5 tall on the bottom shelf; black steel and rustic wood",
    "obegransad": "IKEA: OBEGRÄNSAD LED wall lamp, black (your 905.262.63; 005.262.48 and others by country): 52 × 36 × 6 cm, 5 W, five lighting programmes, hangs landscape or portrait, runs on a 5 V USB-A adapter sold separately (ikea.com); its face is a 16 × 16 grid of white LEDs. From the Swedish House Mafia collection (IKEA press kit, Sept 2022)",
    "pads": "Sony: DualSense controller 160 × 66 × 106 mm (W × H × D); Microsoft: Xbox Wireless Controller 153 × 61 × 104 mm",
    "crate": "Record-shop browser crates and LP storage boxes are made about 32.5–33 cm inside for 31.4 cm sleeves (31.8–32.4 in outer sleeves), flipped by the sleeves' top edges",
    "strips": "Philips Hue Lightstrip Plus V4: 2 m base kit, cuttable every 33 cm, extendable with 1 m; WiZ Wi-Fi LED strip, 2 m starter kit, cuttable; both RGB and tunable white, in the same apps as the bars' bulbs (philips-hue.com; wizconnected.com)",
    "e14": "Smart colour E14 bulbs for the bars: WiZ Colour P45 E14, 4.9 W, 4.5 × 10.1 cm, Wi-Fi, no hub (Philips UK specification sheet, 8719514437333); Philips Hue White and Colour Ambiance E14 lustre, 5.1 W, 45 × 77 mm (Philips Hue; Lampmasters)",
}
ORDER = list(SOURCES)


def ref(*keys):
    return "<sup>" + ",".join(str(ORDER.index(k) + 1) for k in keys) + "</sup>"


# ---------------------------------------------------------------- the zones
PASS, TIGHT, CHECK, NO = "Fits", "Fits, tight", "Check", "Doesn't fit"


def r1(x):
    if abs(x - G.TV_CENTRE) < 1e-6:
        return "116.5"            # 116.55: quoted as 116.5 throughout the plan
    return f"{x:.2f}".rstrip("0").rstrip(".")


def stairs_zone():
    """v14: the dining table's second site, on the stairs wall under the client's 2 m shelf."""
    g = G
    tw, td, tt = g.TABLE
    cd = g.CHAIR[1]
    south = g.STAIRS_WALL_Z[0] - g.TABLE_B_Z[0]
    north = g.TABLE_B_Z[1] - g.WINDOW_Z
    under = g.SHELF_B["top"] - g.SHELF_B["t"]
    room_side = g.TABLE_B_X[0] - cd
    swing = g.BREAST_D_WEST - g.DOOR_SWING
    bar_over = g.TABLE_B_X[0] <= g.BAR2_X <= g.TABLE_B_X[1] and g.TABLE_B_Z[1] <= g.BAR2_Z <= g.TABLE_B_Z[0]
    return ("Option: the table under the shelf, by the stairs", f"the same {r1(tw)} × {r1(td)} fold-down table on the west wall, centred {r1(-g.TABLE_B_CZ)} from the breast's face line", [
        ("The wall beside the stairs", f"table {r1(tw)} long", ref("photo20", "room"), f"{r1(g.STAIRS_WALL_Z[0] - g.WINDOW_Z)} from the stair box to the window wall",
         f"{r1(south)} to the stair box, {r1(north)} to the window wall", PASS),
        ("Folded, under the shelf", f"top edge {r1(g.FOLDED_TOP)}", ref("photo20"), f"shelf's underside about {r1(under)}", f"{r1(under - g.FOLDED_TOP)}: the shelf and what's on it stay", PASS),
        ("Down for four: the room side", f"table edge {r1(g.ROOM_W - g.TABLE_B_X[0])} out from the wall; chairs to x {r1(room_side)}", ref("dining", "terje"),
         f"the sofa's end at x {r1(g.SOFA_X[1])}", f"{r1(room_side - g.SOFA_X[1])} to walk behind the chairs (100+ is the aim, 60 the minimum){'' if room_side - g.SOFA_X[1] >= 100 else ': the walk is between the sofa’s arm and the chairs'}",
         PASS if room_side - g.SOFA_X[1] >= 100 else TIGHT if room_side - g.SOFA_X[1] >= 60 else CHECK),
        ("The stair end's chair", f"{r1(cd)} deep at the table's south end", ref("terje"), f"{r1(south)} to the stair box", f"{r1(south - cd)} behind it: tuck it in after a meal so the stair's foot stays clear", TIGHT),
        ("The window end's chair", f"{r1(cd)} deep at the north end", ref("terje"), f"{r1(north)} to the window wall", f"{r1(north - cd)} behind it", TIGHT),
        ("The door's swing", f"the door opens in, {r1(g.DOOR_SWING)} wide", ref("room"), f"its edge reaches {r1(swing)}", f"{r1(swing - g.TABLE_B_Z[0])} clear of the table: unlike the breast, nobody sits in its swing", PASS),
        ("Light over the table", "the existing pendant point, for bar 2", ref("photo20"), f"point about ({r1(g.BAR2_X)}, {r1(g.BAR2_Z)})",
         "right over the table's stair end: the bar's heads light the table directly" if bar_over else "beside the table: aim two heads at it", PASS),
        ("Fixing the brackets", "500 kg a pair, into the wall", ref("hebgo"), "your stairs wall is solid (your answer)", "plugs and screws, 5 × 70 into the brick", PASS),
    ])


def fliptop_zones():
    """v15: the flip-top gate-leg table, on the breast (A) and on the stairs wall (B): it stays on the wall, opens to 110 × 160."""
    g = G
    tw, td, tt = g.TABLE
    cw, cd = g.CHAIR[0], g.CHAIR[1]
    lw_, ld_, lt_ = g.FLIP["leaf"]
    z0, z1 = g.OPEN_Z
    tuck = 8.0
    kg_top = tw * td * tt * 0.72 / 1000
    kg_half = lw_ * ld_ * lt_ * 0.72 / 1000
    kg_gate = 2 * g.GATE_LEG_H * ((g.LEG[0] + g.LEG[1]) / 2) ** 2 * 0.72 / 1000 + (tw - 2 * g.FLIP["inset"]) * g.FLIP["apron"][0] * g.FLIP["apron"][1] * 0.72 / 1000
    leg_room = ld_ - g.FLIP["hinge_in"] - g.LEG[0] / 2              # how much of the half the folded legs can lie along
    side4, side6 = g.OPEN_LEN / 2, g.OPEN_LEN / 3
    arm_y = g.RAIL_TOP - 2.4
    common = [
        ("Open: 110 × 160, still on the wall", f"the top {r1(tw)} × {r1(td)} on its brackets, the half {r1(lw_)} × {r1(ld_)} on the gate leg", ref("hebgo", "fliphinge"), "nothing comes off the wall; no leaf to store",
         f"the table runs {r1(-z1)} out from the wall", PASS),
        ("Three flip-top hinges at the joint", f"{r1(g.FLIP['hinge'][0])} × {r1(g.FLIP['hinge'][1])}, set into both edges", ref("fliphinge"), f"a {r1(tt)} edge", f"{r1((tt - g.FLIP["hinge"][0]) / 2)} of oak either side of each hinge; they open to 180°, so the half lies flat on the top to fold", PASS),
        ("The gate leg folds inside the half", f"legs {r1(g.GATE_LEG_H)} long, hinged {r1(g.FLIP['hinge_in'])} in from the far edge", ref("legs"), f"{r1(leg_room)} of the half for them to lie along", f"{r1(leg_room - g.GATE_LEG_H)} spare", PASS if leg_room - g.GATE_LEG_H >= 0.5 else TIGHT),
        ("Folded on the wall", f"the top, the half and its gate: {r1(g.FOLDED_D)} off the wall, top edge {r1(g.FOLDED_TOP)}", ref("liftoff"), "a 7.3 hinge rail makes room for the half and gate behind the top",
         f"about {r1(g.FOLDED_D - 6.3)} deeper than a single top; the room still sees the plain oak underside", PASS),
        ("Folding it up", f"top {kg_top:.0f} kg + half {kg_half:.0f} kg + gate {kg_gate:.0f} kg", ref("liftoff", "hebgo"), "lift-off hinges for a 120 kg door; brackets 500 kg a pair",
         f"about {kg_top + kg_half + kg_gate:.0f} kg to swing up: two people, one at each corner; turn buttons hold it", TIGHT),
        ("Knees by the brackets", f"each arm {r1((tw - (g.HEBGO_X[1] - g.HEBGO_X[0])) / 2)} in from the side edge, at {r1(arm_y)}", ref("hebgo", "terje"), f"knees at about 60 over a {r1(g.CHAIR[3])} seat",
         "the first chair each side has the arm above its knees, not in them", PASS),
        ("Four: two down each side", f"{r1(side4)} of edge each", ref("dining"), f"{r1(g.DINE_W)} each", f"{r1(side4 - g.DINE_W)} spare each", PASS),
        ("Six: three down each side", f"{r1(side6)} of edge each", ref("dining"), f"{r1(g.DINE_W)} each, 55 at a squeeze", f"{r1(side6)} each: elbows in", TIGHT),
    ]
    # A: on the breast, running towards the window
    end_back_a = z1 - cd + tuck
    sofa_gap_a = z1 - g.SOFA_FRONT_Z
    east_back = g.TABLE_X[0] - cd + tuck
    third_z = z0 - side6 * 2.5                                      # the six layout's last chair down each side
    cof_clash = east_back < g.COFFEE["x"][1] and (third_z - cw / 2) < g.COFFEE["z"][1] and (third_z + cw / 2) > g.COFFEE["z"][0]
    hinge_x, hinge_z = g.DOOR_X[0], g.BREAST_D_WEST
    first6 = z0 - side6 / 2
    corner = ((g.TABLE_X[1] - tuck + cd - hinge_x) ** 2 + (first6 + cw / 2 - hinge_z) ** 2) ** 0.5
    zone_a = ("Option A: the flip-top table on the chimney breast", f"110 × 160 open, running from the breast towards the window, {r1(-z1)} out", common + [
        ("Its end and the sofa", f"the table ends {r1(-z1)} out", ref("sofa"), f"the sofa's front at {r1(-g.SOFA_FRONT_Z)}",
         f"{r1(sofa_gap_a)} between them: no chair at that end (it would need {r1(cd - tuck)}), and the way round is down the sides", CHECK if sofa_gap_a < cd - tuck else TIGHT),
        ("The coffee table", f"east-side chairs back to x {r1(east_back)}", ref("terje"), f"coffee table x {r1(g.COFFEE['x'][0])}–{r1(g.COFFEE['x'][1])}",
         "for six, slide the coffee table towards the TV before you sit down" if cof_clash else "clear", TIGHT if cof_clash else PASS),
        ("The door's swing", "door 83 wide, opens in, hinged by the breast", ref("room"), f"its edge sweeps {r1(g.DOOR_SWING)} round the hinge",
         f"the west side's first chair is {r1(corner)} from the hinge: in its swing, so keep the door shut while you eat (or rehang it to open into the hall)", TIGHT if corner < g.DOOR_SWING else PASS),
    ])
    # B: on the stairs wall, running into the room
    bz0, bz1 = g.TABLE_B_Z                                          # its long sides (south: stairs, north: window)
    bx_end = g.TABLE_B_OPEN_X[0]
    south_back = bz0 + cd - tuck
    north_back = bz1 - cd + tuck
    lamp = g.FLOOR_LAMP_SPOTS["corner"][1]
    end_lo = g.TABLE_B_CZ - cw / 2
    zone_b = ("The flip-top table under your shelf, by the stairs (B, the alternative since v27)", f"110 × 160 open, running from the stairs wall into the room, its end at x {r1(bx_end)}", common + [
        ("The stair side's chairs", f"backs at z {r1(south_back)} when pulled out", ref("terje", "photo20"), f"the stair box's face at {r1(g.STAIRS_WALL_Z[0])}",
         f"{r1(g.STAIRS_WALL_Z[0] - south_back)} behind them: tuck them in after a meal so the stair's foot stays clear", TIGHT),
        ("The window side's chairs", f"backs at z {r1(north_back)}", ref("terje"), f"the window wall at {r1(g.WINDOW_Z)}",
         f"{r1(north_back - g.WINDOW_Z)} behind them; your red lamp moves from the window corner to the sofa's end or by the breast while it's open", TIGHT),
        ("A seat at its end", f"one chair at x {r1(bx_end - cd + tuck)}–{r1(bx_end + tuck)}", ref("terje", "sofa"), f"the sofa's arm ends at x {r1(g.SOFA_X[1])}, front z {r1(g.SOFA_FRONT_Z)}",
         (f"one chair, centred on the table, clears the sofa's front by {r1(end_lo - g.SOFA_FRONT_Z)}" if end_lo >= g.SOFA_FRONT_Z else
          f"one chair, centred on the table, meets the sofa's front ({r1(g.SOFA_FRONT_Z - end_lo)} over, with the sofa 13 off the wall since v17): tuck it 2 cm further under the table")
         + ": seven with three a side (a second end chair would hit the arm)", PASS if end_lo - g.SOFA_FRONT_Z >= 0 else TIGHT),
        ("Folded, under the shelf", f"top edge {r1(g.FOLDED_TOP)}, {r1(g.FOLDED_D)} off the wall", ref("photo20"), f"shelf's underside about {r1(g.SHELF_B['top'] - g.SHELF_B['t'])}",
         f"{r1(g.SHELF_B['top'] - g.SHELF_B['t'] - g.FOLDED_TOP)}: the shelf and what's on it stay", PASS),
        ("Light over the table", "the existing pendant point, for bar 2", ref("photo20"), f"point about ({r1(g.BAR2_X)}, {r1(g.BAR2_Z)})", "over the open table's stair side: the bar runs along it", PASS),
        ("Your shelf and the pipe boxing (v37: a fixed 10 gap)", f"the shelf {r1(g.SHELF_B['z'][0] - g.SHELF_B['z'][1])} long", ref("shelfgap", "photo20", "room"), f"the boxing's face at z {r1(g.PIPE_BOX['z'][1])}, {r1(g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0])} out",
         f"ends {r1(g.SHELF_B['z'][1] - g.PIPE_BOX['z'][1])} short of it, always (as it's fixed); {r1(g.STAIRS_WALL_Z[0] - g.SHELF_B['z'][0])} past the stair box", PASS),
        ("Your shelf's stairs end (v37)", f"2 m from the 10 gap", ref("shelfgap", "photo20"), "an earlier look at your photo put it about 41 past the stair box",
         f"{r1(g.STAIRS_WALL_Z[0] - g.SHELF_B['z'][0])} past it: if you measure 41, the shelf is about {r1(200 - (41 - (g.STAIRS_WALL_Z[0] - g.SHELF_B['z'][0])))} long; the gap stays 10", CHECK),
        ("The OBEGRÄNSAD panel on the shelf (v16)", f"{r1(g.LIGHTBOX['z'][0] - g.LIGHTBOX['z'][1])} × {r1(g.LIGHTBOX['h'])} × {r1(g.LIGHTBOX['d'])}, standing landscape at the stair end", ref("obegransad"), f"shelf top {r1(g.SHELF_B['top'])} to the {r1(g.CEIL)} ceiling",
         f"{r1(g.CEIL - g.SHELF_B['top'] - g.LIGHTBOX['h'])} over it: this needs the shelf at 198 or lower (measure it); higher, hang the panel on the wall beside the shelf instead", CHECK),
        ("The window side's chairs and the pipe boxing", f"backs at z {r1(north_back)}", ref("terje", "room"), f"the boxing's face at z {r1(g.PIPE_BOX['z'][1])} (x {r1(g.PIPE_BOX['x'][0])} to the wall)",
         f"{r1(north_back - g.PIPE_BOX['z'][1])} clear of the boxing", PASS if north_back > g.PIPE_BOX["z"][1] else TIGHT),
        ("Fixing the brackets", "500 kg a pair, into the wall", ref("hebgo"), "your stairs wall is solid (your answer)", "plugs and screws, 5 × 70 into the brick", PASS),
    ])
    return zone_a, zone_b


def zones():
    g = G
    sx, sh, sd = g.SERIES_X
    fx, fy, fz = g.FAN_STAND
    eye_lo, eye_hi = g.EYE_HEIGHT
    sight = lambda e: g.TV_BOTTOM + (e - g.TV_BOTTOM) * 24.0 / g.VIEW_DIST
    sb_top = g.WORKTOP + g.SOUNDBAR[1]
    lp4 = 4 * g.LP
    deck_side = (g.RZ_W - g.DECK[0]) / 2
    sx_side = (g.RZ_W - fx) / 2
    pre_bottom = g.RZ_SHELF_TOP - g.RZ_SHELF_T - g.PREAMP[1]
    wrap_len = g.WRAP_Z[0] - g.WRAP_Z[1]
    pc_len = g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1]
    under = g.PC_SHELF_TOP - g.PC_SHELF_T
    drawer_out = g.BASE_FRONT_Z - 35.0
    tw, td, tt = g.TABLE
    six_len = tw + g.LEAF[0] if g.SIX_LEAF else tw
    six_edge, eight_edge = six_len / 2, (tw + g.LEAF[0]) / 3
    free_breast = -g.FREE_Z[0]
    free_window = g.FREE_Z[1] - g.WINDOW_Z
    eight_wall = g.ROOM_W - g.EIGHT_X[1]
    six_wall = g.ROOM_W - g.SIX_X[1]
    eight_sofa = g.FREE_Z[1] - g.SOFA_FRONT_Z
    four_sofa = g.TABLE_Z[1] - g.SOFA_FRONT_Z
    weight = tw * td * tt * 0.72 / 1000
    fi = g.LEAF_FRAME
    kit_kg = 0.7 / 1000 * (g.LEAF[0] * g.LEAF[1] * g.LEAF[2] + 2 * fi["t"] * fi["h"] * (g.LEAF_FRAME_OUT[0] + g.LEAF_FRAME_IN[1])
                           + 8 * g.LEG_H * ((g.LEG[0] + g.LEG[1]) / 2) ** 2)
    cw, cd = g.CHAIR[0], g.CHAIR[1]
    six_cx = sum(g.SIX_X) / 2
    SB = g.SUB_HOOD                                                      # v13.2: the sub's oak cover under the dining wall
    import math
    tip_rise = math.hypot(g.SUB[0], g.SUB[1]) - g.SUB[1]                 # how far the sub's top corner rises before it tips
    over_sub = SB["h"] - SB["top"] - SB["feet"] - SB["base"] - g.SUB[1]  # the gap from the sub's top to the cover
    six_first = g.SIX_X[0] + (g.SIX_X[1] - g.SIX_X[0]) / 4                # first breast-side chair's centre, two a side
    six_sub_gap = (six_first - cw / 2) - (SB["x"][1] + SB["over"])                      # its east edge to the box's west end
    chair_back = -(g.FREE_Z[0] + cd - 8)                                 # breast-side chair backs, tucked 8 under the table
    box_front = -(SB["z"][0] - SB["over"])                               # the box's top overhang, out from the breast
    east_end = g.SIX_X[0] - cd                                           # the east-end diner's chair, pushed back
    cof_gap = (sum(g.FREE_Z) / 2 - cw / 2) - g.COFFEE["z"][1]             # that chair's side to the coffee table's near edge (z)
    win_first = g.SIX_X[0] + (g.SIX_X[1] - g.SIX_X[0]) / 4               # v15: the first window-side chair's centre (two a side)
    win_overlap = g.SOFA_X[1] - (win_first - cw / 2)                     # how far the sofa's end reaches past that chair's east edge
    port_gap = (g.HEBGO_X[1] - 1.4) - g.SUB_POS["x"][1]                  # the port (west end) to the west bracket arm
    drv_gap = g.SUB_POS["x"][0] - (g.HEBGO_X[0] + 1.4)                   # the driver (east end) to the east bracket arm
    e_first = g.EIGHT_X[0] + (g.EIGHT_X[1] - g.EIGHT_X[0]) / 6           # first breast-side chair's centre, three a side
    e_overlap = min(e_first + cw / 2, SB["x"][1]) - max(e_first - cw / 2, SB["x"][0])
    panel = 0.0 if g.PLAIN else g.RZ_SLATS[2]
    e_back = g.FREE_Z[0] + cd                                            # its back, at the table's edge
    sc = g.SUB_COL[1] - g.SUB_COL[0]
    pc_ = g.PS_COL[1] - g.PS_COL[0]
    if g.SUB_IN_WALL:   # v13.5: the bricks at the back of their rows; the sub in bay 2's lower left
        bay1 = ("Bay 1, Xbox (BESTÅ frame on the 9 cm plinth)", "56.8 wide inside, 40 deep; the bricks lie at the back of their rows", [
            ("Xbox One, original, + HDMI switch", "33.3 × 27.4 × 7.9; switch 12.7 × 5.9 × 2.5", ref("consoles", "ugreen"), "16 tall row", "8.1 above; the switch in the 23.5 beside it, at the front for its remote", PASS),
            ("Xbox 360, original, + RetroTINK-6X CE", "30.9 × 25.8 × 8.3; RetroTINK allowed 23 × 23 × 8 (no size published)", ref("consoles", "rt6x"), "16 tall row", "7.7 above; 25.9 beside it for the RetroTINK: measure it when it arrives", CHECK),
            ("Both bricks, flat at the back of their rows", "Xbox One 17 × 7.5 × 4.8; Xbox 360 allowed 21 × 10 × 6", ref("xb1psu", "x360psu", "psuplace"), "behind the switch and the RetroTINK, by the channel's power leads", "23 + 10 = 33 of the 40 depth for the RetroTINK and the 360's brick; on their rubber pads, nothing on top, open to the channel; 2 cm or more from the consoles' rear vents", PASS),
            ("Game drawer", "box 54.3 × 35 on 350 mm runners; cases 19 × 13.5 × 1.4", ref("runners", "media"), "25.2 tall row, 40 deep", "about 3 above the leaning cases; 5 behind the box", PASS),
            ("Depth with the leads", "console 27.4 + HDMI plug about 5", ref("consoles"), "40 deep, back open", "about 7.6, then the 4 cm channel", PASS),
        ])
        bay2 = ("Bay 2, PlayStation and the sub (BESTÅ frame on the plinth)", f"56.8 × 40 inside: the sub's column {r1(sc)}, a 12 mm divider, then {r1(pc_)} for the PS2 over the PS1", [
            ("PS3, original, + controller basket", "32.5 × 27.4 × 9.8", ref("consoles"), "23.7 tall row, full width", "13.9 above; 24.3 beside for the basket", PASS),
            ("The sub in its column", f"{r1(g.SUB[0])} × {r1(g.SUB[2])} × {r1(g.SUB[1])} tall, on a {r1(g.SUB_RISER_H)} isolation riser", ref("hisense"), f"{r1(sc)} wide × {r1(g.SUB_COL_TOP - g.SUB_COL_FLOOR)} tall", f"1 each side, {r1(g.SUB_COL_TOP - g.SUB_IN['y'][1])} above; it mustn't touch the divider or the frame", TIGHT),
            ("The sub's driver and port", "front-firing driver, rear port; its front flush with the face frame", ref("hisense", "subport"), f"{r1(g.SUB_PORT_GAP)} from the port to the wall, through the open back and the channel", "inside the 15–30 advised for a rear port, at its low end: keep the channel behind bay 2 clear (Switch 2 and the retro 6-way go behind bay 1)", TIGHT),
            ("PS2, original, over the PS1", "30.2 × 18.3 × 7.8 · 27 × 18.8 × 6", ref("consoles"), f"{r1(pc_)} wide; 16.5 and 17 rows on a part shelf", f"PS2 {r1((pc_ - 30.2) / 2)} each side, 8.7 above; PS1 {r1((pc_ - 27) / 2)} each side, 11 above; both open front and back", TIGHT),
            ("Vibration: the consoles and the deck share the base with the sub", "Microsoft: keep the Xbox 360 away from high-vibrating sources such as subwoofers", ref("x360place"), "the sub on its riser, clear of the divider and the frame; the deck on isolation feet", "the 360 is a bay away, the PS2 and PS1 a divider away: play a disc game and a record at film volume; if anything skips, turn the sub down for that source, or put it back under the dining wall", CHECK),
            ("Hidden slim drawer in the plinth", f"box {r1(g.PLINTH_DRAWER['box'][0])} × {r1(g.PLINTH_DRAWER['box'][1])} × {r1(g.PLINTH_DRAWER['box'][2])}, 300 mm full-extension runners, a finger-pull groove (no push-to-open at floor level)", ref("runners"), "9 cm plinth, 120 wide", "about 2 above and below the box; felt its runners, it's under the sub", PASS),
            ("Switch 2 (TL-SG108) and the retro 6-way in the channel", "15.8 × 10.1 × 2.5; 6-way about 34 × 6 × 4", ref("sg108"), "4 cm channel, behind bay 1", "on their edges, clear of the sub's port", TIGHT),
        ])
    else:
        bay1 = ("Bay 1, Xbox (BESTÅ frame on the 9 cm plinth)", "56.8 wide inside, 40 deep, rows as in v9", [
            ("Xbox One, original, and its brick", "33.3 × 27.4 × 7.9; brick 17 × 7.5 × 4.8", ref("consoles", "xb1psu"), "16 tall row", "8.1 above; 21.5 beside the console for the brick", PASS),
            ("Xbox 360, original, and its brick", "30.9 × 25.8 × 8.3; brick about 21 × 10 × 6", ref("consoles", "x360psu"), "16 tall row", "7.7 above; 25.9 beside for the brick", PASS),
            ("Game drawer", "box 54.3 × 35 on 350 mm runners; cases 19 × 13.5 × 1.4", ref("runners", "media"), "25.2 tall row, 40 deep", "about 3 above the leaning cases; 5 behind the box", PASS),
            ("Depth with the leads", "console 27.4 + HDMI plug about 5", ref("consoles"), "40 deep, back open", "about 7.6, then the 4 cm channel", PASS),
        ])
        bay2 = ("Bay 2, PlayStation (BESTÅ frame on the plinth)", "56.8 wide inside, 40 deep", [
            ("PS3, original, + controller basket", "32.5 × 27.4 × 9.8", ref("consoles"), "23.7 tall row", "13.9 above; 24.3 beside for the basket", PASS),
            ("PS2, original, + HDMI switch", "30.2 × 18.3 × 7.8; switch 12.7 × 5.9 × 2.5", ref("consoles", "ugreen"), "16.5 tall row", "8.7 above; 26.6 beside", PASS),
            ("PS1, original, + RetroTINK-6X CE", "27 × 18.8 × 6; RetroTINK size not published", ref("consoles", "rt6x"), "17 tall row", "29.8 beside the PS1 reserved for it; measure it when it arrives", CHECK),
            ("Hidden slim drawer in the plinth", f"box {r1(g.PLINTH_DRAWER['box'][0])} × {r1(g.PLINTH_DRAWER['box'][1])} × {r1(g.PLINTH_DRAWER['box'][2])}, 300 mm full-extension runners, a finger-pull groove (no push-to-open at floor level)", ref("runners"), "9 cm plinth, 120 wide", "about 2 above and below the box", PASS),
            ("Switch 2 (TL-SG108) and the retro 6-way in the channel", "15.8 × 10.1 × 2.5; 6-way about 34 × 6 × 4", ref("sg108"), "4 cm channel", "on their edges", TIGHT),
        ])
    zs = [
        ("The TV between the uprights", f"{r1(g.TV_GAP)} between the oak uprights, the right one a corner post against the breast; the ledge's underside at {r1(g.LEDGE_UNDER)}", [
            ("LG OLED C6 55 in, on its stand", f"{r1(g.TV_W)} × {r1(g.TV_H)} × {r1(g.TV_D)} panel; {r1(g.TV_STAND_H)} tall on the stand", ref("lg"), f"{r1(g.TV_GAP)} wide", f"{r1(g.TV_CLEAR)} each side", PASS),
            ("Top of the screen", f"{r1(g.TV_TOP)} (bottom {r1(g.TV_BOTTOM)}, centre {r1(g.TV_CENTRE)})", ref("lg"), f"ledge at {r1(g.LEDGE_UNDER)}", f"{r1(g.LEDGE_UNDER - g.TV_TOP)}", PASS),
            ("LG stand base", f"{r1(g.TV_STAND_W)} × {r1(g.TV_STAND_D)}", ref("lg"), f"worktop {r1(g.BASE_D)} deep", "set 2 cm off the wall: 11 cm in front of it for the soundbar's leads", PASS),
            ("Soundbar, Hisense AX5100G, centred under the TV", f"{r1(g.SOUNDBAR[0])} × {r1(g.SOUNDBAR[2])} × {r1(g.SOUNDBAR[1])} tall", ref("hisense"), f"x {r1(g.TV_CX - 46)}–{r1(g.TV_CX + 46)}, top {r1(sb_top)}", f"the sightline to the screen's bottom passes {r1(sight(eye_lo))}–{r1(sight(eye_hi))} over it", PASS),
            ("The TV's remote receiver, bottom centre of the screen's frame", f"screen bottom {r1(g.TV_BOTTOM)}", ref("lg"), f"soundbar top {r1(sb_top)}, in front of the stand's foot", f"{r1(sb_top - g.TV_BOTTOM)} over the frame's edge: sit the bar on the worktop 2 cm proud of the stand's foot, not against it, so the remote's beam from the sofa clears it; if a button stutters, pair LG's Magic Remote (it talks to the TV by radio)", CHECK),
            ("The TV's HDMI plugs, with the screen 2.15 from the corner post", "C6 sockets face sideways on the back panel", ref("lg"), "behind the screen", "plugs stay behind the panel; if a stiff lead pushes out, use 90° HDMI adapters", CHECK),
        ]),
        ("The turntable zone, left of the TV", f"{r1(g.RZ_W)} wide × {r1(g.BASE_D)} deep, worktop {r1(g.WORKTOP)} to the Series X shelf's underside at {r1(g.LID_CLEAR_TO)}", [
            ("Turntable, AT-LP120X size (worst case)", f"{r1(g.DECK[0])} × {r1(g.DECK[2])} × {r1(g.DECK[1])} with its lid", ref("atlp120"), f"{r1(g.RZ_W)} wide", f"{r1(deck_side)} each side", TIGHT),
            ("Its depth, with room behind for the lid's hinges", f"{r1(g.DECK[2])}, front 2 cm in from the worktop's edge", ref("atlp120"), f"{r1(g.BASE_D)} deep, to the painted wall" if g.PLAIN else f"{r1(g.BASE_D)} deep, less the {r1(panel)} slatted panel", f"{r1(g.ALC_D - panel - g.DECK_Z[1])} behind it", TIGHT if g.ALC_D - panel - g.DECK_Z[1] < 8 else PASS),
            ("Lid open", f"cover {r1(g.LID[0])} × {r1(g.LID[1])}; standing up, its top at about {r1(round(g.LID_TOP_OPEN))}", ref("lid"), f"shelf underside {r1(g.LID_CLEAR_TO)}", f"about {r1(round(g.LID_CLEAR_TO - g.LID_TOP_OPEN))}", PASS),
            ("Phono preamp, hung under the shelf at the back", f"about {r1(g.PREAMP[0])} × {r1(g.PREAMP[2])} × {r1(g.PREAMP[1])}", "", f"{r1(pre_bottom)}–{r1(g.LID_CLEAR_TO)}, at the back", f"{r1(pre_bottom - g.LID_TOP_OPEN)} over the open lid's edge; lift the lid gently", TIGHT),
            ("Series X fan stand on the shelf", f"{r1(fx)} × {r1(fz)} (assumed; model to confirm)", "", f"{r1(g.RZ_W)} × {r1(g.RZ_SHELF_D)} shelf", f"{r1(sx_side)} each side", PASS),
            ("Xbox Series X, standing", f"{r1(sx)} × {r1(sd)} × {r1(sh)} tall", ref("xbox"), f"top at {r1(g.SX_TOP)}", f"{r1(g.HIGH_UNDER - g.SX_TOP)} clear above (Microsoft's minimum is 4); 15 each side, inside the 10–15 it recommends", PASS),
            ("Deco B on the high shelf, at the breast end", "11 × 11 × 11.4", ref("deco"), f"{r1(g.UP_R[0] - g.UP_L[1] - 95)} wide past the lidded box, {r1(g.CEIL - g.HIGH_TOP)} to the ceiling", "beside the lidded box, 27 clear above", PASS),
        ]),
        ("Shelves above the TV", f"ledge top {r1(g.LEDGE_TOP)}, 7 deep; high shelf top {r1(g.HIGH_TOP)}, {r1(g.HIGH_D)} deep; ceiling {r1(g.CEIL)}", [
            ("Four LPs on the record ledge", f"4 × {r1(g.LP)} = {r1(lp4)} wide", ref("media"), f"{r1(g.TV_GAP)} long", f"{r1(g.TV_GAP - lp4)}: snug, as drawn", PASS),
            ("Ledge LPs leaning back 8°", f"tops at {r1(g.LEDGE_LP_TOP)}", ref("media"), f"high shelf underside {r1(g.HIGH_UNDER)}", f"{r1(g.HIGH_UNDER - g.LEDGE_LP_TOP)} to lift one out over the 1.5 lip", PASS),
            ("Books on the high shelf", "up to 30 tall", "", f"{r1(g.CEIL - g.HIGH_TOP)} to the ceiling", "9 over the tallest", PASS),
            ("Oak uprights", f"{r1(g.UPRIGHT_LEN)} long (worktop to ceiling)", ref("room"), f"{r1(g.CEIL)} ceiling", "buy 165 and scribe to the ceiling", PASS),
        ]),
        bay1,
        bay2,
        ("Bay 3: the LP crates and the slim game column (v16)", f"56.4 wide × 40 deep × 69.4 tall inside the ply carcass, split by a 12 mm divider", [
            ("Across the bay", f"slim drawer {r1(g.SLIM_BOX_X[1] - g.SLIM_BOX_X[0])} + divider 1.2 + LP crate {r1(g.TRAY_BOX[0])}, each drawer with 1.27 runners a side", ref("runners"), f"{r1(g.B3_IN[1] - g.B3_IN[0])} inside",
             f"exact: {r1(g.SLIM_BOX_X[1] - g.SLIM_BOX_X[0])} + 2.54 + 1.2 + {r1(g.TRAY_BOX[0])} + 2.54 = 56.4; nothing left over", PASS),
            ("LPs in the crate", f"{r1(g.LP)} sleeves face-out, leaning back 10°", ref("media", "crate"), f"{r1(g.TRAY_INSIDE)} trough", f"{r1((g.TRAY_INSIDE - g.LP) / 2)} each side: snug like a shop crate; outer sleeves up to 32.4 still fit", TIGHT),
            ("Crate heights", "lower sleeves to 34.4, upper to 69.1", ref("media"), "top panel underside 71.2", "2.6 and 2.1 to lift a sleeve", PASS),
            ("Games in the slim drawers, face-out", f"DVD-size cases {r1(g.GAME_CASE[0])} wide, {r1(g.GAME_CASE[1])} tall, leaning back 10°", ref("media"), f"{r1(g.SLIM_INSIDE)} inside (6 mm ply sides)",
             f"{r1(g.SLIM_INSIDE - g.GAME_CASE[0])} spare: they flip like the records; about {g.SLIM_DRAWERS[0]['n']} a drawer in 40 deep", TIGHT),
            ("The game drawers' height", f"cases stand {r1(g.GAME_CASE[1] * 0.985)} on a 1.2 base", ref("media"), f"{r1(g.SLIM_DRAWERS[1]['yb'] - g.SLIM_DRAWERS[0]['yb'])} from one drawer to the next",
             f"{r1(g.SLIM_DRAWERS[1]['yb'] - g.SLIM_DRAWERS[0]['yb'] - 1.2 - g.GAME_CASE[1] * 0.985)} clear over the cases", PASS),
            ("Pads in the top slim drawer", f"4 pads on edge, two side by side: 2 × {r1(g.PAD[2])} = {r1(2 * g.PAD[2])} across, {r1(g.PAD[0])} long", ref("pads"), f"{r1(g.SLIM_INSIDE)} wide, {r1(g.TRAY_TOP_PANEL - g.SLIM_DRAWERS[2]['yb'] - 1.2)} tall",
             f"{r1(g.SLIM_INSIDE - 2 * g.PAD[2])} across; {r1(g.PAD[1])} tall in {r1(g.TRAY_TOP_PANEL - g.SLIM_DRAWERS[2]['yb'] - 1.2)}; the remotes in front", TIGHT),
            ("The side-wall socket beside the slim drawers (v38)", f"socket {r1(g.BASE_FRONT_Z - g.SOCKET['z'])} in front of the base, {r1(g.SOCKET['y'])} up", "",
             f"the middle slim drawer pulled out passes {r1(g.BAYS[2][0] + 2.6)} from the wall", "the plugs must stand less than that off the wall: flat (angled) plugs, leads down; measure yours", CHECK),
        ]),
        ("The side wall: one oak run from the corner to the PC", f"at {r1(g.LEDGE_TOP)}, {r1(g.SIDE_RUN_T)} thick, {r1(g.SIDE_RUN_Z[0] - g.SIDE_RUN_Z[1])} long: 7 deep by the LPs, {r1(g.PC_SHELF_D)} under the PC", [
            ("The sweep from the ledge to the PC shelf", f"front edge 7 → {r1(g.PC_SHELF_D)} over {r1(g.SIDE_SWEEP[0] - g.SIDE_SWEEP[1])} (z {r1(g.SIDE_SWEEP[0])} to {r1(g.SIDE_SWEEP[1])})", "", f"the last wrap LP ends at z {r1(g.WRAP_Z[0] - 1.5 - 4 * g.LP - 3 * 1.4)}; the PC starts at z {r1(g.PC_Z[0])}",
             f"the LP stands on the start of the curve; {r1(g.SIDE_SWEEP[1] - g.PC_Z[0])} between the full depth and the case", PASS),
            ("Four more LPs on the wrap ledge", f"4 × {r1(g.LP)} + gaps = {r1(4 * g.LP + 3 * 1.4)}", ref("media"), f"{r1(wrap_len)} long", f"{r1(wrap_len - 4 * g.LP - 3 * 1.4 - 1.5)}", PASS),
            ("The PC on its shelf", f"{r1(g.PC_CASE[0])} × {r1(g.PC_CASE[2])} × {r1(g.PC_CASE[1])} tall (an average gaming case, e.g. Corsair 4000D)", ref("case"), f"{r1(g.PC_SHELF_D)} × {r1(pc_len)}", "2.5 off the wall, the brush grommet and pad dock beyond it; height 46.6 under the 79.6 to the ceiling", PASS),
            ("Air above the PC", f"top at {r1(g.PC_SHELF_TOP + g.PC_CASE[1])}", "", f"{r1(g.CEIL)} ceiling", f"{r1(g.CEIL - g.PC_SHELF_TOP - g.PC_CASE[1])} for the top exhaust", PASS),
            ("Shelf over the end of the sofa", f"underside {r1(under)}", ref("sofa"), f"sofa back {r1(g.SOFA_H)}", f"{r1(under - g.SOFA_H)}; the shelf covers only the 28 cm nearest the wall", PASS),
            ("Keyboard tray under the PC shelf (v6.1)", f"{r1(g.KB_TRAY['h'])} cm housing, tray rolls {r1(g.KB_TRAY['out'])} out on {r1(g.KB_TRAY['runners'] * 10)} mm runners", ref("runners"), f"sofa back {r1(g.SOFA_H)}", f"{r1(under - g.KB_TRAY['h'] - g.SOFA_H)} over the sofa's back; pulled out, its front edge is {r1(g.PC_SHELF_D + g.KB_TRAY['out'])} from the wall, still over the return's seat", PASS),
            ("Out of the TV's sightlines", "PC about 54° left of the line to the screen from the sofa", ref("room"), "—", "well clear of the screen's left edge", PASS),
        ]),
        ("The dining wall on the chimney breast", f"breast {r1(g.BREAST_W)} wide; the table {r1(tw)} × {r1(td)} × {r1(tt)} solid oak, about {weight:.0f} kg", [
            ("Table on the breast", f"{r1(tw)} wide", ref("room"), f"{r1(g.BREAST_W)}", f"{r1((g.BREAST_W - tw) / 2)} each side", PASS),
            ("Folded up", f"about {r1(g.FOLDED_D)} off the breast, top edge {r1(g.FOLDED_TOP)}", ref("liftoff"), f"framed LPs from {r1(g.FRAMES_Y)}", f"{r1(g.FRAMES_Y - g.FOLDED_TOP)}", PASS),
            ("Two Hebgo brackets under it", f"arms {r1(g.HEBGO[0])}, {r1(g.HEBGO_X[1] - g.HEBGO_X[0])} apart; 500 kg a pair", ref("hebgo"), f"a {r1(td)} deep top", f"{r1(td - g.HEBGO[0])} beyond the arms; spacing inside Häfele's 80", PASS),
            ("Three lift-off hinges on the backboard", "100 × 88, rated for a 120 kg door", ref("liftoff"), f"a {weight:.0f} kg top", "slide it 5 cm sideways to lift it off", PASS),
            ("Four at the wall: two on the room side", f"{r1(tw)} of edge", ref("dining"), f"{r1(g.DINE_W)} each recommended", f"{r1(tw / 2)} each", TIGHT),
            ("Four at the wall: room to the sofa", f"table edge {r1(-g.TABLE_Z[1])} out", ref("dining", "sofa"), "sofa front", f"{r1(four_sofa)} (walk behind: 100+)", PASS),
            ("The door and the dining chairs", "door 83 wide, hinged on the breast side, opens in (you confirmed)", ref("room"), "its swing reaches about 44 out from the recess wall", "the west-end chair (four) and the breast-side chairs (six, eight) sit in its swing: keep it shut while you eat, or have it rehung to open into the hall", TIGHT),
            ("Six and eight: lifted off onto legs, with the leaf", f"table {r1(tw)} + leaf {r1(g.LEAF[0])} = {r1(six_len)} × {r1(td)}, top at {r1(g.LEG_H + tt)} on the oak legs", ref("legs"), f"dining height about {r1(75)}", "within 1.3; felt glides take up an uneven floor; four legs under the table, four under the leaf, joined by two dowels and two clips", PASS),
            ("The eight legs, stored in the leaf's frame (v13.6)", f"8 legs {r1(g.LEG[0])} square in clips {r1(g.LEG_CLIP[1])} wide at {r1(g.LEG_PITCH)} centres = {r1(g.LEG_STORE_W)} across; each {r1(g.LEG_H)} + {r1(g.LEG_BOLT)} bolt long", ref("clip", "legs"), f"inside the frame {r1(g.LEAF_FRAME_IN[0])} × {r1(g.LEAF_FRAME_IN[1])}, {r1(g.LEAF_FRAME['h'])} deep", f"{r1((g.LEAF_FRAME_IN[0] - g.LEG_STORE_W) / 2)} each side, {r1(g.LEAF_FRAME_IN[1] - g.LEG_H - g.LEG_BOLT)} along, {r1(g.LEAF_FRAME['h'] - g.LEG[0])} below the legs; leaf, frame and legs about {kit_kg:.0f} kg together", PASS),
            ("Knees under the leaf's frame", f"frame underside at {r1(g.LEG_H - g.LEAF_FRAME['h'])} with the table on its legs", ref("terje"), f"chair seat {r1(g.CHAIR[3])}", f"{r1(g.LEG_H - g.LEAF_FRAME['h'] - g.CHAIR[3])} above the seat, like an ordinary table's apron; the 110 top has no frame ({r1(g.LEG_H - g.CHAIR[3])})", PASS),
            ("Six: two a side, one at each end", f"{r1(six_len)} of edge each long side, {r1(td)} at each end", ref("dining"), f"{r1(g.DINE_W)} each", f"{r1(six_edge)} each on the sides (25 spare); {r1(td)} at the ends", PASS),
            ("Eight: three a side, one at each end", f"{r1(tw + g.LEAF[0])} long", ref("dining", "legs"), f"{r1(g.DINE_W)} each", f"{r1(eight_edge)} each", TIGHT),
            ("Six and eight: to the breast and the window", f"table {r1(free_breast)}–{r1(-g.FREE_Z[1])} out", ref("dining"), f"{r1(g.CLEAR_OK)} to aim for", f"{r1(free_breast)} to the breast; {r1(free_window)} to the window", PASS if free_breast >= g.CLEAR_OK else TIGHT),
            ("Six and eight: the west end", f"table end at {r1(g.SIX_X[1])}", ref("dining"), f"west wall at {r1(g.ROOM_W)}", f"{r1(six_wall)} for the end diner (60 is the tight minimum; the stairs are behind the breast-side corner, clear of it)", PASS if six_wall >= g.CLEAR_OK else TIGHT),
            ("Six and eight: the east end and the coffee table", f"end chair at x {r1(east_end)}–{r1(g.SIX_X[0])}", ref("dining", "sofa"), "coffee table and sofa", f"{r1(cof_gap)} to the coffee table's edge: slide it towards the window first; the sofa ends at {r1(g.SOFA_X[1])}, clear of the chair ({r1(eight_sofa)} to its front line)", TIGHT),
            ("Six and eight: the window side and the sofa (v15)", f"window-side chairs from x {r1(win_first - cw / 2)}, backs reach z {r1(g.FREE_Z[1] - cd)} pushed out", ref("terje", "sofa"),
             f"the sofa now runs to x {r1(g.SOFA_X[1])}, its front at z {r1(g.SOFA_FRONT_Z)}",
             (f"the first window-side chair overlaps the sofa's end by {r1(win_overlap)} and has {r1(g.FREE_Z[1] - cd - g.SOFA_FRONT_Z)} behind it: that diner sits with the sofa's arm at their back. Fine for a meal; or use the table by the stairs (option B), which stands clear of the sofa"
              if win_overlap > 0 else f"{r1(-win_overlap)} clear of the sofa's end"), CHECK if win_overlap > 0 and g.FREE_Z[1] - cd - g.SOFA_FRONT_Z < 15 else PASS),
            ("Six: the breast-side chairs and the sub's cover", f"chairs at x {r1(six_first - cw / 2)}–{r1(six_first + cw / 2)} and on, backs at {r1(chair_back)} from the breast", ref("terje"), f"cover x {r1(SB['x'][0] - SB['over'])}–{r1(SB['x'][1] + SB['over'])}, {r1(box_front)} out", f"{r1(six_sub_gap)} beside it and {r1(chair_back - box_front)} in front of it: chairs and cover don't meet", (CHECK if min(six_sub_gap, chair_back - box_front) < 0 else TIGHT if min(six_sub_gap, chair_back - box_front) < 10 else PASS)),
            ("Eight: the breast-side end chair and the sub's cover", f"chair at x {r1(e_first - cw / 2)}–{r1(e_first + cw / 2)}", ref("terje"), f"cover x {r1(SB['x'][0])}–{r1(SB['x'][1])}", (f"they overlap {r1(e_overlap)} across, so that chair can push back only {r1(chair_back - box_front)} before it meets the cover: for eight, lift the cover off its two keyhole screws and stand the sub at the end of the base (it's wireless; leave 1 m of slack in its lead)" if e_overlap > 0 else f"{r1(-e_overlap)} clear"), CHECK if e_overlap > 0 else PASS),
            ("Sub under its oak cover, under the dining wall", f"sub {r1(g.SUB[2])} long × {r1(g.SUB[0])} out × {r1(g.SUB[1])} tall, standing sideways: driver east, port west", ref("hisense"), f"cover {r1(SB['x'][1] - SB['x'][0] + 2 * SB['over'])} × {r1(-SB['z'][0] + SB['over'])} at {r1(SB['h'])} on a backboard, between the folded arms", f"{r1(SB['x'][0] - g.HEBGO_X[0] - 1.4)} clear of the east arm, {r1(g.HEBGO_X[1] - 1.4 - SB['x'][1])} of the west; {r1(over_sub)} over the sub", PASS),
            ("The sound: no sides, no front", "the driver fires east, the port west, the room side is open", ref("subport", "hisense"), f"{r1(g.SUB_PORT_MIN)} for the port", f"port {r1(port_gap)} to the nearest thing (the west arm), driver {r1(drv_gap)}; only the cover is over it, and nothing faces the driver or the port", PASS if port_gap >= g.SUB_PORT_MIN else TIGHT),
            ("Spills", f"solid oak cover {r1(SB['top'])} thick, {r1(SB['over'])} overhang with a drip groove underneath", "", "a drink knocked off the table", "it lands on the cover and runs off its edge in front of the sub, never onto it", PASS),
            ("Knocks: it can't fall over", f"the sub's top corner rises {r1(tip_rise)} before it would tip", ref("hisense"), f"cover {r1(over_sub)} over it; tray lip {r1(SB['lip'])}", f"the cover stops it {r1(tip_rise - over_sub)} short of tipping; the lip stops it sliding; the backboard hangs on two keyhole screws in the solid breast", PASS if over_sub < tip_rise else CHECK),
            ("Feet under the table, four at the wall", f"the cover {r1(box_front)} out from the breast", ref("terje"), f"table {r1(td)} deep", f"{r1(td + g.RAIL[2] - box_front)} of legroom in front of it on the room side; the end seats are clear", PASS),
            ("Chairs at the table", f"seat {r1(g.CHAIR[3])}", ref("terje"), f"top {r1(g.TABLE_TOP)}", f"{r1(g.TABLE_TOP - g.CHAIR[3])} seat to top, the usual 25–30", PASS),
        ]),
        stairs_zone(),
        ("The room", f"{r1(g.ROOM_W)} × {r1(g.ROOM_D)}, ceiling {r1(g.CEIL)}", [
            ("Eyes to screen from the sofa", "the L-sofa's long side against the window wall, 10 off the radiator", ref("room", "sofa"), f"{r1(g.SCREEN_FROM_WINDOW)} window wall to screen", f"about {g.VIEW_DIST / 100:.2f} m; a 55-inch fills about 26°", PASS),
            ("From the end of the sofa's return", f"sitting up at its end, {r1(g.TV_PANEL_Z[0] - g.CHAISE_EYES_Z)} from the screen", ref("sofa"), "straight ahead of the TV", "the TV's move puts it square on to this seat", PASS),
            ("TV centre against seated eyes", f"{r1(g.TV_CENTRE)}", ref("lg"), f"eyes at {r1(eye_lo)}–{r1(eye_hi)}", "about 1–2.5° above the eye line", PASS),
            ("Both spotlight bars under the ceiling", f"{r1(g.BAR[2])} drop", ref("wolston"), f"{r1(g.CEIL)} ceiling", f"lowest shade at {r1(g.CEIL - g.BAR[2])}", PASS),
            ("Both bars turned to run TV to window (v15)", f"{r1(g.BAR[0])} long along the room", ref("wolston", "photo20"), f"bar 2 at {r1(g.ROOM_W - g.BAR2_X)} from the west wall",
             f"bar 1 spans z {r1(g.PEND_Z + 42)} to {r1(g.PEND_Z - 42)}; bar 2 now runs along the wall, so its end no longer reaches past the west wall", PASS),
            ("Smart colour bulbs in the bars (v15)", f"8 × E14: WiZ P45 {r1(g.BULB_E14['wiz'][1])} W, {r1(g.BULB_E14['wiz'][2][0])} × {r1(g.BULB_E14['wiz'][2][1])}; or Hue lustre {r1(g.BULB_E14['hue'][1])} W, {r1(g.BULB_E14['hue'][2][0])} × {r1(g.BULB_E14['hue'][2][1])}", ref("wolston", "e14"),
             f"the bar's {r1(g.BAR_MAX_W)} W a lamp; 15 cm shades", f"{r1(g.BAR_MAX_W - g.BULB_E14['wiz'][1])} W under; the WiZ's 10.1 sits inside a 15 shade with its holder; if it shows below the rim, the Hue's 7.7 doesn't", PASS),
        ]),
    ]
    if g.TABLE_STYLE == "fliptop":   # v15: the flip-top replaces the fold-down-and-lift-off table on both walls
        za, zb_ = fliptop_zones()
        L = g.NOW_LEDGE
        gap = (L["x"][1] - L["x"][0] - L["n"] * g.LP) / (L["n"] + 1)
        lp_top = L["top"] + g.LP * 0.99
        breast = ("The chimney breast, with the table by the stairs (v16)", f"breast {r1(g.BREAST_W)} wide; the “now playing” ledge {r1(L['x'][1] - L['x'][0])} × {r1(L['d'])}, top {r1(L['top'])}", [
            ("Three LPs on the ledge", f"3 × {r1(g.LP)} = {r1(3 * g.LP)}", ref("media"), f"{r1(L['x'][1] - L['x'][0])} long", f"{r1(gap)} between and at the ends", PASS),
            ("Leaning back 8°, under the framed LPs", f"tops at {r1(lp_top)}", ref("media"), f"frames from {r1(g.FRAMES_Y)}", f"{r1(g.FRAMES_Y - lp_top)} between", PASS),
            ("Beside the turntable", f"ledge {r1(L['top'])} up, {r1(L['d'])} deep", ref("atlp120"), f"the deck's top at about {r1(g.WORKTOP + g.DECK[1])}, an arm's reach to the left",
             "sleeve off the ledge, record on, sleeve back: the base stands 8 proud of the breast, the ledge 7", PASS),
            ("If you choose option A instead", "the flip-top folds on the breast", ref("liftoff"), "the ledge's place", "the ledge comes off its two screws; the frames stay", PASS),
        ])
        out = []
        for (title, space, rows) in zs:
            if title.startswith("The dining wall"):
                out += [zb_, breast]
            elif title.startswith("Option: the table under the shelf"):
                out.append(za)
            else:
                out.append((title, space, rows))
        return out
    if g.SUB_IN_WALL:   # v13.5: nothing under the dining wall now
        gone = ("the sub's cover", "Sub under its oak cover", "The sound: no sides", "Spills", "Knocks: it can't", "Feet under the table")
        for zi_, (title, space, rows) in enumerate(zs):
            if title.startswith("The dining wall"):
                rows = [r for r in rows if not any(k in r[0] for k in gone)]
                rows.append(("Feet under the table, four at the wall", "nothing under it: the sub is in the alcove base", ref("terje"), f"table {r1(td)} deep", f"{r1(td)} of clear legroom along the breast; eight need no cover lifted off", PASS))
                zs[zi_] = (title, space, rows)
    return zs


def status_class(s):
    return {PASS: "ok", TIGHT: "tight", CHECK: "check", NO: "no"}[s]


def tables_html():
    out = []
    for title, space, rows in zones():
        out.append(f"<div class='zonebox'><h4>{title}</h4><p class='zone'>{space}</p>")
        out.append("<table class='fit'><tr><th>Item</th><th>Size (cm)</th><th>Space</th><th>Spare (cm)</th><th>Result</th></tr>")
        for item, size, src, sp, spare, st in rows:
            out.append(f"<tr><td>{item}</td><td>{size}{src}</td><td>{sp}</td><td>{spare}</td><td class='res {status_class(st)}'>{st}</td></tr>")
        out.append("</table></div>")
    return "\n".join(out)


def counts():
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for _, _, rows in zones():
        for r in rows:
            c[r[-1]] += 1
    return c


def sources_html(extra=()):
    items = [SOURCES[k] for k in ORDER] + list(extra)
    return "<ol class='sources'>" + "".join(f"<li>{s}</li>" for s in items) + "</ol>"


# v18: the client's plant stand and vinyl stand, in either layout (v18.1: both from their listings)
_zones_v17 = zones


def plants_zone():
    g = G
    P_, R_ = g.PLANT_STAND, g.RECORD_SHELF
    curt = g.WINDOW_X[1] + g.CURTAIN["ext"]                     # the curtains' west stack ends here
    box_x = g.PIPE_BOX["x"][0]
    cx, cz, _f = g.PLANT_LAYOUTS["corner"]["plants"]
    px0, px1 = cx - P_["w"] / 2, cx + P_["w"] / 2
    bw = g.BREAST_X[1] - g.BREAST_X[0]
    ledge_under = g.NOW_LEDGE["top"] - g.NOW_LEDGE["t"]
    lp_top = R_["shelf_y"] + g.LP
    frames_bottom = g.FRAMES_Y - g.LP / 2 - 2.0
    return ("Your plant stand and your vinyl stand (v18.1)", f"the window wall's west end, {r1(box_x - curt)} between the curtains' stack and the pipe boxing; the chimney breast, {r1(bw)} wide", [
        ("A: the plant stand in the window corner (recommended)", f"{r1(P_['w'])} × {r1(P_['d'])} × {r1(P_['h'])}", ref("plantstand"), f"x {r1(curt)} to {r1(box_x)}",
         f"x {r1(px0)}–{r1(px1)}: {r1(px0 - curt)} from the curtains, {r1(box_x - px1)} from the boxing; daylight from the window beside it; {r1(g.CEIL - P_['h'])} to the ceiling for the top plants", TIGHT),
        ("A: the vinyl stand on the breast", f"{r1(R_['w'])} × {r1(R_['d'])} × {r1(R_['h'])}", ref("vinylstand"), f"breast {r1(bw)} wide, the “now playing” ledge's underside at {r1(ledge_under)}",
         f"{r1((bw - R_['w']) / 2)} each side, {r1(ledge_under - R_['h'])} under the ledge; a step from the turntable", PASS),
        ("A: LPs in its top bays, face-out", f"2 bays × {r1(R_['bay'])}; an LP {r1(g.LP)}", ref("vinylstand", "media"), f"shelf at about {r1(R_['shelf_y'])}",
         f"{r1(R_['bay'] - g.LP)} spare a bay; the front LP's top at about {r1(lp_top)}, {r1(ledge_under - lp_top)} under the ledge; about {R_['lps_top']} LPs", TIGHT),
        ("A: LPs on its bottom shelf, between the wires", f"{R_['wires']} wires {r1(R_['wire_h'])} tall", ref("vinylstand", "media"), f"{r1(R_['w'])} wide, {r1(R_['shelf_y'] - R_['bottom_y'])} high",
         f"three slots of LPs standing; about {R_['lps_bottom']} more (about {R_['lps_top'] + R_['lps_bottom']} in all)", PASS),
        ("B: the vinyl stand in the window corner, as today", f"{r1(R_['w'])} wide", ref("vinylstand"), f"{r1(box_x - curt)} between the curtains and the boxing", f"{r1(box_x - curt - R_['w'])} to spare", PASS),
        ("B: the plant stand on the breast", f"{r1(P_['w'])} wide, {r1(P_['h'])} tall", ref("plantstand"), f"breast {r1(bw)}; the frames from about {r1(frames_bottom)}",
         f"{r1((bw - P_['w']) / 2)} each side; the “now playing” ledge comes off and the two frames go up 30 (or elsewhere): at {r1(P_['h'])} it stands past the frames' bottoms", TIGHT),
        ("Your red lamp", "28 base", ref("room"), "the window corner is taken in A and B", "it moves to the sofa's west end (in the 3D room, drag it anywhere)", PASS),
    ])


def zones():
    return _zones_v17() + [plants_zone()]


# v19: somewhere to keep the dining chairs, without changing the table
SOURCES["frosvi"] = ("IKEA UK: FRÖSVI folding chair, beech, £20 (705.343.15): solid beech, a slatted seat with no cushion, 44 W × 51 D × 77 H, seat 38 × 33 "
                     "at 46 high, tested for 110 kg, a hanging hole in the back; its package 44 × 9 × 89 cm, 2.89 kg (no folded size is published). "
                     "The padded version, white with a Knisa cover (805.343.34, £30), is 43 × 49 × 78, seat 48 (ikea.com/gb product pages, 21 Oct 2026)")
SOURCES["slhook"] = ("Screwfix: Smith & Locke Mid Duty Anti-Slip Storage Hook, 200 × 200 mm, steel, 60 kg maximum load, £3.59 (8882J); "
                     "FRÖSVI padded weighs 3.61 kg net (ikea.com.tw)")
ORDER.extend(["frosvi", "slhook"])
_zones_v18 = zones


def chairs_zone():
    """v19: the dining chairs off the table; v20: "ideally 6 folding chairs but 4 is fine" and "a fully pack away setup": an oak chair
    cupboard built in beside the table, in the window-end gap, flush with the pipe boxing."""
    g = G
    cw, cdep, ch = g.CHAIR_FOLDED
    C = g.CHAIR_STORE["cupboard"]
    gap = C["z"][0] - C["z"][1]
    in_w = gap - 2 * C["t"]
    in_d, in_d6 = C["d"] - C["door"] - C["back"], C["d6"] - C["door"] - C["back"]
    lo_top = C["plinth"] + ch                                   # the lower pair, standing on the cupboard's floor
    up0 = C["shelf_y"] + C["t"]; up_top = up0 + ch               # the upper pair, on the shelf
    in_top = C["h"] - C["t"]
    sg = g.CHAIR_STORE["stair_gap"]
    sgap = sg[0] - sg[1]
    U = g.CHAIR_STORE["under_stairs"]
    first = (g.ROOM_W - g.RAIL[2]) - (g.ROOM_W - C["d"])         # how far the cupboard's face stands past the open table's wall end
    win6 = (g.OPEN_LEN - first) / 3
    return ("The flip-top's chair cupboard (B, the alternative)", f"an oak cupboard built in beside the table, {r1(gap)} × {r1(C['d'])} × {r1(C['h'])}, between the table's window end and the pipe boxing. Folded chairs {r1(cw)} × {r1(cdep)} × {r1(ch)}", [
        ("Its width, between the table and the pipe boxing", f"{r1(gap)} wide, {r1(C['t'])} sides", ref("photo20", "room"), f"z {r1(C['z'][0])} to {r1(C['z'][1])}",
         f"{r1(in_w)} inside for a {r1(cw)} chair: {r1((in_w - cw) / 2)} each side", TIGHT),
        ("Its depth: four chairs, two deep", f"2 × {r1(cdep)} folded", ref("frosvi"), f"{r1(C['d'])} deep, the same as the pipe boxing; {r1(in_d)} inside behind the doors",
         f"{r1(in_d - 2 * cdep)} spare: snug, so they can't rattle; it stands no further out than the boxing beside it", TIGHT),
        ("Its height: a pair on the floor, a pair on the shelf", f"each {r1(ch)} tall", ref("frosvi", "photo20"), f"{r1(C['h'])} tall, the shelf at {r1(C['shelf_y'])}; your shelf's underside at {r1(g.SHELF_B['top'] - g.SHELF_B['t'])}",
         f"lower pair {r1(C['plinth'])}–{r1(lo_top)} under the shelf at {r1(C['shelf_y'])}; upper pair {r1(up0)}–{r1(up_top)} under the top at {r1(in_top)}; the cupboard stops {r1(g.SHELF_B['top'] - g.SHELF_B['t'] - C['h'])} under your shelf", TIGHT),
        ("Six instead of four", f"three deep, 3 × {r1(cdep)}", ref("frosvi"), f"the {r1(C['d6'])}-deep version, {r1(in_d6)} inside",
         f"{r1(in_d6 - 3 * cdep)} spare; it stands {r1(C['d6'] - C['d'])} proud of the pipe boxing's face", TIGHT),
        ("Weight on the wall", f"four chairs, about {r1(4 * 3.61)} kg, and an oak carcass of about 18 kg", ref("frosvi"), "it stands on the floor, held to the wall at the top",
         "the floor takes the weight; two screws through the top rail into the wall (or studs) stop it tipping", PASS),
        ("The doors", f"two oak doors, {r1(gap)} × about {r1(C['shelf_y'])}, hinged on the table's side", ref("room"), "they swing towards the table's end",
         "open the doors and take the chairs out before you open the table; folded, the table and the cupboard are one run of oak, nothing left out", PASS),
        ("With the table open: the window side's first chair", f"the cupboard's face {r1(first)} past the table's wall end", ref("terje", "dining"),
         f"window side {r1(g.OPEN_LEN)} long", f"for four, two a side, nothing changes; for six the window side's three get {round(win6, 1):g} each instead of {round(g.OPEN_LEN / 3, 1):g}: elbows in", TIGHT),
        ("Open hooks instead (the cheaper option)", "two 200 mm storage hooks, two chairs on each", ref("slhook"), "the same gap, no cupboard",
         "£8–15 instead of the cupboard; the chairs stay on show", PASS),
        ("At the stair end instead", f"folded {r1(cw)} wide", ref("frosvi", "photo20"), f"{r1(sgap)} between the shelf's start (z {r1(sg[0])}) and the table (z {r1(sg[1])})",
         f"{r1(cw - sgap)} short: too narrow for this chair", CHECK),
        ("Chairs five and six, with the 22-deep cupboard", "two more, folded", ref("frosvi", "room"), "the garage (v23: under the stairs is a brick side wall, plasterboard beneath: no way in from the room)",
         "the guests' chairs, fetched when six sit down; or build the 31-deep cupboard, or hang four behind the folded top (below), and all of them pack away", PASS),
    ])


def zones():
    return _zones_v18() + [chairs_zone()]


# v23, client: "explore any further ways we can build the chairs into the table build"; "the sofa has a ottoman poufe type thing that is
# the size of a chair on the sofa, its square, blue corduroy matching the sofa"
SOURCES["fbracket"] = ("Buller Ltd: Folding Heavy Duty Bracket for Bench and Tables, 330 mm long, 82 mm wide, steel, grey primed, automatic lock "
                       "when raised, 50 mm proud of the wall folded, 150 kg per pair (75 kg each), brackets at most 800 mm apart (bullerltd.co.uk)")
SOURCES["pouf"] = ("Client, 20 Oct 2026: the sofa's ottoman, square, blue corduroy matching the sofa, \"the size of a chair on the sofa\": one seat, "
                   "75 × 75; its height taken at the seat's 44 until measured")
ORDER.extend(["fbracket", "pouf"])
_zones_v20 = zones


def chairs_built_in_zone():
    """v23: two more ways to build the chairs into the table: four hung behind the folded top on a deeper backboard, and a fold-down
    oak seat in the gap at the stair end (a fifth seat that's always there). Either goes with the chair cupboard."""
    g = G
    cw, cdep, ch = g.CHAIR_FOLDED
    B, S = g.BEHIND_TOP, g.WALL_SEAT
    W = g.TABLE[0]
    sg = g.CHAIR_STORE["stair_gap"]; sgap = sg[0] - sg[1]
    return ("More ways to keep the chairs with the flip-top (B)", f"behind the folded top, and the {r1(sgap)} cm gap at the stair end", [
        ("Behind the folded top: across", f"two folded chairs side by side, {r1(2 * cw)}", ref("frosvi", "fliphinge"), f"the top's {r1(W)} width",
         f"{r1((W - 2 * cw) / 2)} spare each side: out of sight behind it", PASS),
        ("Behind the folded top: deep", f"two deep, {r1(2 * cdep)}, on hooks", ref("frosvi", "slhook"), f"a backboard {r1(B['gap'])} deeper (the hinge rail stands {r1(B['rail'])} off the wall)",
         f"{r1(B['gap'] - 2 * cdep - B['hook'])} spare; the folded table then stands {r1(B['rail'] + g.TABLE[2])} off the wall instead of {r1(g.RAIL[2] + g.TABLE[2])}", TIGHT),
        ("Behind the folded top: tall", f"folded {r1(ch)} tall", ref("frosvi", "fliphinge"), f"the folded top, {r1(g.TABLE[1])} tall, and a {r1(B['upstand'])} oak upstand under it",
         "the upstand hides their feet, so nothing shows when it's folded", PASS),
        ("Behind the folded top: the open table", f"the table {r1(B['gap'])} further into the room", ref("dining", "sofa"), f"open edge at x {r1(g.TABLE_B_OPEN_X[0] - B['gap'])} (now {r1(g.TABLE_B_OPEN_X[0])})",
         "four seats as now; the end seat comes nearer the TV but still clears the sofa's front line; take the chairs off their hooks and sit down", TIGHT),
        ("Fold-down seat at the stair end: width", f"an oak seat {r1(S['w'])} wide", ref("fbracket", "photo20"), f"the {r1(sgap)} gap",
         f"{r1((sgap - S['w']) / 2)} each side", TIGHT),
        ("Fold-down seat: folded", f"bracket {r1(S['fold'])} + seat {r1(S['t'])}", ref("fbracket"), f"the folded table, {r1(g.RAIL[2] + g.TABLE[2])} off the wall",
         f"{r1(S['fold'] + S['t'])} proud: flatter than the table beside it", PASS),
        ("Fold-down seat: the load", "one person, about 100 kg at most", ref("fbracket"), "150 kg a pair, the brackets 30 apart",
         "screwed into your solid stairs wall with plugs", PASS),
        ("Fold-down seat: open", f"{r1(S['d'])} deep at {r1(S['h'])} high", ref("fbracket", "dining"), "at the table's south end, by the wall",
         "a fifth seat for the table, and one that's always there; the stairs' foot stays clear", PASS),
    ])


def pouf_zone():
    """v23: your sofa's square ottoman on the rug."""
    g = G
    P_ = g.SOFA_POUF
    gap_c = P_["x"][0] - g.COFFEE["x"][1]
    gap_s = P_["z"][0] - g.SOFA_FRONT_Z
    return ("Your sofa's ottoman (v23)", f"{r1(P_['w'])} × {r1(P_['d'])}, on the rug", [
        ("Beside the coffee table", f"{r1(P_['w'])} square", ref("pouf", "sofa"), f"coffee table to x {r1(g.COFFEE['x'][1])}",
         f"{r1(gap_c)} between them; {r1(gap_s)} off the sofa's front: a footrest for the long side", PASS),
        ("On the rug", f"x {r1(P_['x'][0])}–{r1(P_['x'][1])}", ref("pouf"), f"rug x {r1(g.RUG['x'][0])}–{r1(g.RUG['x'][1])}",
         "inside it, clear of the door's swing and the table's walkway", PASS),
    ])


def zones():
    return _zones_v20() + [chairs_built_in_zone(), pouf_zone()]


# v26: option C, the dining cabinet, and how many can sit down (v27: the cabinet is the plan, for six)
SOURCES["pianohinge"] = ("IronmongeryDirect: Altro continuous piano hinge, 1800 × 50 × 1.2 mm, satin 304 stainless steel, £16.00 (SKU 302829; "
                         "cut to length, screwed every 10 cm) (ironmongerydirect.co.uk)")
SOURCES["legbracket"] = ("ManoMano UK: folding, self-locking table-leg brackets, 75 × 60 × 55 mm, set of four with screws, about £58: lock at 90°, "
                         "for legs at least 2½ in (6.4 cm) at the top; seller's rating 226.8 kg a bracket (manomano.co.uk, listing 219621358)")
SOURCES["foldtable"] = ("Clever (Italy): Slim fold-down table in a wall unit: folded 80 × 9 × 138 cm, open 80 × 138 × 74, a 1.8 cm top "
                        "(clever.it): the same idea, a top hinged at its foot that stands up into the wall")
SOURCES["hinge170"] = ("Blum CLIP top 170° full-overlay hinge, self-closing (71T6540; cabinetparts.com): doors open past flat, so they lie back "
                       "against the cabinet's front while you take the chairs out")
ORDER.extend(["pianohinge", "legbracket", "foldtable", "hinge170"])
# v29: the two sliding doors across the cabinet's front
SOURCES["slido"] = ("Häfele UK catalogue 10.054, Slido Classic 40 IF C (files.hafele.co.uk/catalogfiles/www/16a10-54.pdf; NBS Source): two bypassing "
                    "wooden doors inset in the carcass, top hung; doors 16–19 mm thick, up to 40 kg, 2200 tall and 1250 wide; fitting set for two doors "
                    "with soft close 402.33.027; double top track for a 16 mm groove 402.33.652 (2.5 m, needs a top panel of 19 mm or more); bottom "
                    "guide track 402.30.802 in a 6 mm groove. The track's section isn't published: the plan allows 5 cm of depth for it and the two doors")
ORDER.append("slido")


def optc_seats(C=None):
    """Where the chairs go round the dining cabinet's open table: (side, chairs, edge per chair, the length that side has).
    v30: either cabinet (the compact one, CAB, or the sliding one, OPTC: the default); the compact's table opens to "len_open"."""
    g, C = G, (C or G.OPTC)
    stair_len = C["front"] - C["tx"][0]                         # the stair side: from the far end to the cabinet
    window_len = C["front"] - max(C["tx"][0], g.SOFA_X[1])      # the window side: stops at the sofa's arm
    back = (g.CHAIR_PADDED["d"] if C is g.CAB or C is g.CAB80 else g.CHAIR[1]) - g.CHAIR_TUCK   # v33: the compact cabinet's padded chairs
    end_clear = C["tx"][0] - back - g.COFFEE["x"][1]            # an end chair's back to the coffee table
    n_s, n_w = int(stair_len // g.DINE_COMFORT), int(window_len // g.DINE_COMFORT)
    return dict(stair=(n_s, stair_len / n_s, stair_len), window=(n_w, window_len / n_w, window_len), end=1 if end_clear >= 0 else 0, end_clear=end_clear,
                comfort=n_s + n_w, max=n_s + n_w + (1 if end_clear >= 0 else 0))


def optc_zone():
    g, C = G, G.OPTC
    cw, cdep, ch = g.CHAIR_FOLDED
    st = optc_seats()
    back = g.CHAIR[1] - g.CHAIR_TUCK                            # a chair's back stands this far behind the edge
    s_back, w_back = C["tz"][0] + back, C["tz"][1] - back
    hinge_x, hinge_z = g.DOOR_X[0], g.BREAST_D_WEST
    arc = hinge_z - g.DOOR_SWING                                # the door's edge reaches this far into the room
    under = g.SHELF_B["top"] - g.SHELF_B["t"]
    inside_h = C["h"] - C["t"]
    bay_c = C["bay_c"][0] - C["bay_c"][1]
    in_d = C["in_d"]
    oc, ot = C["open_c"][0] - C["open_c"][1], C["open_t"][0] - C["open_t"][1]
    pb = g.PLANT_B
    pl = g.PLANT_LAYOUTS["corner"]["plants"]
    plant_face = pl[1] + g.PLANT_STAND["d"] / 2
    kg_half = C["top"][0] * C["top"][1] * C["top"][2] * 0.72 / 1000
    lo_top, up0 = C["plinth"] + ch, C["shelf_y"] + C["t"]
    n_floor = C["chairs"] - C["shelf_chairs"]
    return ("The sliding dining cabinet (the alternative)", f"one oak cabinet {r1(C['z'][0] - C['z'][1])} × {r1(C['d'])} × {r1(C['h'])} under your shelf, two sliding doors; "
            f"the table {r1(C['len'])} × {r1(C['top'][0])} open, six chairs inside", [
        ("The cabinet under your shelf", f"{r1(C['h'])} tall", ref("photo20"), f"shelf's underside about {r1(under)}", f"{r1(under - C['h'])}: the shelf stays as it is", PASS),
        ("Its length", f"z {r1(C['z'][0])} to {r1(C['z'][1])}", ref("photo20", "room"), "the shelf's length; the stair's foot before it stays clear",
         f"{r1(C['z'][1] - g.PIPE_BOX['z'][1])} short of the pipe boxing, {r1(C['d'] - (g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0]))} prouder than it", PASS),
        ("The two sliding doors", f"oak-faced ply {r1(C['door_w'])} × {r1(C['door_h'])} × {r1(C['door'])}, about {C['door_kg']:.0f} kg each", ref("slido"),
         "Slido Classic 40 IF C: doors 16–19 thick, up to 40 kg, 125 wide, 220 tall", "well inside every limit; soft close at both ends", PASS),
        ("The doors' depth", f"two 18 mm doors on a double track", ref("slido"), f"{r1(C['slide'])} allowed in front of the inside",
         "the track's section isn't published: hold the track against the top panel when it arrives, before you fit the hinge rail", CHECK),
        ("The top track's panel", f"a 16 mm groove in the top's underside", ref("slido"), "the track wants a top 19 mm or more", f"the top is {r1(C['t_top'] * 10)} mm ply", PASS),
        ("The table bay, door A slid away", f"an opening {r1(ot)} wide", ref("slido"), f"the table {r1(C['top'][0])} wide", f"{r1(ot - C['top'][0])} spare: it swings down clear of both doors", PASS),
        ("The table standing up in its bay", f"two halves {r1(C['top'][1])} long, hinged at {r1(C['pivot'][1])}", ref("foldtable", "pianohinge"), f"{r1(inside_h)} inside the bay",
         f"its top edge at {r1(C['folded_top'])}: {r1(C['flap'][1] - C['flap'][0])} over it for the linen shelf", PASS),
        ("The linen shelf over the folded table", f"{r1(C['flap'][1] - C['flap'][0])} tall, {r1(C['bay_t'][0] - C['bay_t'][1])} wide", ref("slido"),
         f"{r1(in_d)} deep inside", "the cloth, napkins, runner and candles, behind door A", PASS),
        ("Folded, how deep", f"two aprons {r1(C['apron'])}, two tops {r1(C['top'][2])}", ref("legbracket"), f"{r1(in_d)} inside, behind the doors",
         f"{r1(C['stack'])} deep folded: {r1(in_d - C['stack'])} spare; nothing of it shows with the doors shut", PASS),
        ("Lowering it and flipping the half", f"each half about {kg_half:.0f} kg", ref("pianohinge", "fliphinge"), f"a {r1(C['top'][0])} piano hinge at its foot; three flip-top hinges at the joint",
         f"it swings down like a drop-front: about {kg_half:.0f} kg, two hands; the legs drop and lock as it comes down", PASS),
        ("The legs", f"oak {r1(C['leg'][0])} × {r1(C['leg'][1])}, {r1(C['leg_h'])} long, a pair at each half's end", ref("legbracket"), "four self-locking folding brackets",
         f"each pair folds flat inside its half's {r1(C['apron'])} apron; {r1(C['leg_h'])} of knee room under it", PASS),
        ("Six chairs in the chair bay: across", f"two side by side, 2 × {r1(cw)}", ref("frosvi"), f"the bay {r1(bay_c)} wide inside", f"{r1(bay_c - 2 * cw)} spare", PASS),
        ("Six chairs: deep and tall", f"two deep ({r1(2 * cdep)}), each {r1(ch)} tall", ref("frosvi"), f"{r1(in_d)} deep inside; the shelf at {r1(C['shelf_y'])}",
         f"{r1(in_d - 2 * cdep)} spare deep; {n_floor} on the floor ({r1(C['plinth'])}–{r1(lo_top)}), {C['shelf_chairs']} on the shelf from {r1(up0)}, the six seat pads on edge in front of them ({r1(in_d - cdep)} free there for 9)", TIGHT),
        ("The chair bay, door B slid behind A", f"an opening {r1(oc)} wide", ref("slido", "frosvi"), f"two folded chairs {r1(2 * cw)} across",
         f"{r1(oc - 2 * cw - 2)} spare: the chairs come straight out", PASS),
        ("Your trailing plant on the shelf", f"strands {r1(pb['trail'][0])}–{r1(pb['trail'][1])} long at the window end", ref("photo20"), f"they hang by the doors' face at x {r1(C['front'])}",
         "the doors slide behind them rather than swinging into them; tuck the strands to one side, or move the pot along the shelf", CHECK),
        ("Stair side: three chairs", f"{st['stair'][1]:.1f} of edge each", ref("dining", "frosvi"), f"{r1(st['stair'][2])} from the far end to the cabinet",
         "55 is the squeeze, 60 the aim: three sit in comfort", PASS),
        ("Stair side: the stair's foot and the door", f"chair backs at z {r1(s_back)}", ref("room", "photo20"), f"the stair box's face at {r1(g.STAIRS_WALL_Z[0])}; the door's edge reaches {r1(arc)}",
         f"{r1(g.STAIRS_WALL_Z[0] - s_back)} from the stair box, {r1(arc - s_back)} from the door's swing: tuck the end chair in after a meal", TIGHT),
        ("Window side: three chairs", f"{st['window'][1]:.1f} of edge each", ref("dining", "sofa"), f"{r1(st['window'][2])} from the sofa's arm (x {r1(g.SOFA_X[1])}) to the cabinet",
         f"three in comfort; backs at z {r1(w_back)}, {r1(w_back - plant_face)} clear of your plant stand", PASS),
        ("The far end and the coffee table", f"the table ends at x {r1(C['tx'][0])}", ref("dining"), f"the coffee table to x {r1(g.COFFEE['x'][1])}",
         f"{r1(C['tx'][0] - g.COFFEE['x'][1])} between them: the coffee table stays put; a seventh chair fits at the end ({r1(st['end_clear'])} behind its back)", PASS),
        ("The ottoman (v38: a dinner spot)", f"{r1(g.SOFA_POUF['w'])} square", ref("pouf"), f"the open table reaches x {r1(C['tx'][0])}; the ottoman to x {r1(g.SOFA_POUF['x'][1])}",
         f"{r1(g.SOFA_POUF['x'][1] - C['tx'][0])} under the table's end, so while you eat it goes in front of the media wall (x {r1(g.SOFA_POUF['dinner']['x'][0])}–{r1(g.SOFA_POUF['dinner']['x'][1])}): "
         f"{r1(C['tx'][0] - g.SOFA_POUF['dinner']['x'][1])} clear of the table's end", PASS),
        ("The table's side and the sofa", f"window edge at z {r1(C['tz'][1])}", ref("sofa"), f"the sofa's front at z {r1(g.SOFA_FRONT_Z)}",
         f"{r1(C['tz'][1] - g.SOFA_FRONT_Z)} between them: the table passes the sofa's end", PASS),
        ("Light over the table", "bar 2 on the existing pendant point", ref("photo20"), f"point about ({r1(g.BAR2_X)}, {r1(g.BAR2_Z)})",
         "over the table; the table rule turns bar 2 up when it's open", PASS),
        ("Fixing it", "a floor-standing cabinet, screwed to the wall at the top", ref("solidwall"), "your stairs wall: solid",
         "it stands on the floor, so the wall only steadies it: two screws into plugs in your solid wall", PASS),
    ])


def max_seats_zone():
    """v26: "assess the max number of seatings you can fit"; v27: the dining cabinet, made for six; v30: the compact cabinet is the plan."""
    g, C = G, G.CAB
    st, sl = optc_seats(C), optc_seats()
    seat = lambda t: (f"{t['stair'][1]:.1f} and {t['window'][1]:.1f} of edge each; a seventh at the far end with a spare chair" if t["end"]
                      else f"{t['stair'][1]:.1f} and {t['window'][1]:.1f} each")
    return ("How many can sit down", "every table we've drawn, in this room, with chairs a person wide and backs 41 behind the edge", [
        ("The compact dining cabinet (the plan)", f"{st['comfort']} in comfort", ref("dining", "padded", "costwaychair"), f"{st['stair'][0]} on the stair side, {st['window'][0]} on the window side", seat(st), PASS),
        ("The sliding dining cabinet (the alternative)", f"{sl['comfort']} in comfort", ref("dining", "padded", "costwaychair"), f"{sl['stair'][0]} on the stair side, {sl['window'][0]} on the window side", seat(sl), PASS),
        ("B: the flip-top by the stairs (the alternative)", "seven at a squeeze", ref("dining", "sofa"), "three a side (53 each) and one at the end", "five in comfort: two a side and the end", TIGHT),
        ("A: the flip-top on the chimney breast", "six at a squeeze", ref("dining", "sofa"), "three a side, 53 each", "four in comfort; no end seat: the sofa's in the way", TIGHT),
        ("A fourth chair a side at the cabinet", "eight round it", ref("dining", "sofa", "room"), f"{r1(st['stair'][2])} and {r1(st['window'][2])} of edge",
         f"{st['stair'][2] / 4:.1f} each: under the 55 squeeze; a 225 table did it, but only with the coffee table moved and all eight chairs in a bigger bay", NO),
        ("A longer table in the cabinet", f"halves over {r1(C['h'] - C['t_top'] - C['pivot'][1])}", ref("photo20"), "they must stand up under your shelf",
         f"{r1(C['h'] - C['t_top'] - C['pivot'][1])} is the most that folds away; {r1(C['top'][1])} leaves the linen shelf's space and keeps each half to about {C['top'][0] * C['top'][1] * C['top'][2] * 0.72 / 1000:.0f} kg", PASS),
    ])

_zones_v25 = zones


def zones():
    """v27: the dining cabinet is the plan, so its zones come first among the tables'."""
    zs = _zones_v25()
    i = next((k for k, z in enumerate(zs) if z[0].startswith("The flip-top table")), len(zs))
    return zs[:i] + [optc_zone(), max_seats_zone()] + zs[i:]


# v27: your rear speakers, standing behind the sofa (v27.1: from your photos and your answer)
SOURCES["rears27"] = ("Client, 20 Oct 2026: \"my surround speakers ... exist standing behind the sofa\", two photos of the room, and "
                      "\"they are directly behind the sofa on the left and right ends\": the AX5100G's own rears, one behind each end of the "
                      "sofa's long side, the speakers just above the sofa's back (scaled against its 80 cm in the photo); the stands' base "
                      "drawn 11 cm square")
ORDER.append("rears27")
_zones_v26 = zones


def rears_zone():
    g = G
    w, h, d = g.REAR_SPK
    bw, bd = g.REAR_STAND["base"][0], g.REAR_STAND["base"][1]
    gap = g.SOFA_BACK_Z - g.WINDOW_Z
    top = g.REAR_STAND["top"] + h
    (lx, lz), (rx, rz) = g.REAR_SPOTS
    curt0 = g.WINDOW_X[0] - g.CURTAIN["ext"]                       # the curtains' east stack starts here
    return ("Your rear speakers (v27.1, from your photos)", f"the AX5100G's rears, {r1(w)} × {r1(h)} × {r1(d)}, on stands behind each end of the sofa", [
        ("In the gap behind the sofa", f"each pole {r1(g.REAR_STAND['pole'])} across, its flat base under the radiator", ref("hisense", "rears27"),
         f"{r1(g.SOFA_BACK_Z - g.RADIATOR_FACE)} between the radiator's face and the sofa's back",
         f"{r1((g.SOFA_BACK_Z - g.RADIATOR_FACE - g.REAR_STAND['pole']) / 2)} each side of the pole: snug", TIGHT),
        ("In front of the curtains", f"the speakers' backs at z {r1(lz - d / 2)}", ref("rears27"), f"the curtains, drawn, lie flat behind each pole at z {r1(g.REAR_STAND['dent'])}",
         f"{r1(lz - d / 2 - g.REAR_STAND['dent'])} in front, open or drawn; the radiator {r1(g.REAR_STAND['dent'] - g.RADIATOR_FACE)} behind the cloth", PASS),
        ("The curtain pole", f"its top at {r1(g.CURTAIN['rail_y'] + g.CURTAIN['pole'])}", ref("room"), f"the ceiling strip at {r1(g.CEIL - 0.6)}",
         f"{r1(g.CEIL - 0.6 - g.CURTAIN['rail_y'] - g.CURTAIN['pole'])} under it, as in your photo; {r1(g.CURTAIN['rail_y'] - g.WINDOW_Y[1])} over the window's head", PASS),
        ("Above the sofa's back", f"the speakers {r1(g.REAR_STAND['top'])}–{r1(top)}", ref("rears27", "sofa"), f"the sofa's back {r1(g.SOFA_H)} tall",
         f"{r1(g.REAR_STAND['top'] - g.SOFA_H)} above it, about seated ear height, as in your photo", PASS),
        ("Power and the link cable", "the rears are linked by a cable; one plugs in", ref("hisense"), f"your double socket behind the sofa's short side (x {r1(g.SOCKET2['x'])}, z {r1(g.SOCKET2['z'])})",
         "the left rear is a step from it; the link runs along the skirting behind the sofa", PASS),
    ])


def zones():
    return _zones_v26() + [rears_zone()]


def counts():
    """v26: the seat count's "a ninth seat" rows are the room's limits, not things that don't fit, so they stay out of the totals."""
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for title, _, rows in zones():
        if title == "How many can sit down":
            continue
        for r in rows:
            c[r[-1]] += 1
    return c


# ---------------------------------------------------------------- v30: the compact dining cabinet (the plan)
SOURCES["piano32"] = ("IronmongeryDirect: Altro continuous piano hinge, 1800 × 32 × 1 mm, satin 304 stainless steel, £9.50 (SKU 517299): "
                      "16 mm leaves, so each fits on an 18 mm door's edge; one a door, full height. No load rating is published")
SOURCES["solidwall"] = ("Client, 21 Oct 2026: \"the wall on the stairs is solid. electrics done ourselves\"; and \"i just need a smaller build "
                        "on the cabinet if we can\", \"they dont particularly need to be oak chairs\", \"show me both versions for the cabinet\"")
ORDER.extend(["piano32", "solidwall"])
# v31: the chairs' cushions, slimmer chairs looked at, and what could stand beside the compact cabinet
SOURCES["esme"] = ("Dunelm: Esme Washed Cotton Square Seat Pad, £9: 40 × 40 × 3 cm, ties, recycled polyester fill, 100% cotton cover, wipe clean; "
                   "Blue, Honey, Ivory, Olive or Rose Pink (dunelm.com, product 1000279425)")
SOURCES["angsfraken"] = ("IKEA UK: ÄNGSFRÄKEN chair pad, £4: round, 36 cm across, 3.0 cm thick, an anti-slip back and a hanging loop (no ties), "
                         "machine wash 40°C; black, blue, brown-red or dark beige (ikea.com/gb)")
SOURCES["bramon"] = "IKEA UK: BRÄMÖN chair pad, £2 (504.846.65): 34 × 34 × 1.0 cm, ties, grey-beige, indoors or out (ikea.com/gb)"
SOURCES["habitatchair"] = ("Habitat: Wooden Folding Chair, Light Wood, £21: open H79 × W42.5 × D47.5, seat 38 × 37 at 45; \"packs away flat to just 7cm deep\" "
                           "(H87 × W43 × D7 folded) (habitat.co.uk, product 5548794)")
SOURCES["plia"] = "Anonima Castelli Plia folding chair (Made in Design UK, £325): W46.9 × H88.8, 5.4 cm thick folded; steel and polycarbonate"
SOURCES["vasagle"] = ("VASAGLE 4-Tier Slim Kitchen Storage Trolley with Wheels, £35.99: 20 × 43.2 × 86.5 cm, particleboard and steel, rustic white "
                      "and honey brown (songmicshome.co.uk, UKLRC050)")
SOURCES["nissedal"] = "IKEA UK: NISSEDAL mirror, 40 × 150 cm, black (906.054.82) or white (706.054.83), £25 (was £30) (ikea.com/gb)"
SOURCES["plates"] = "Dinner plates: IKEA FÄRGKLAR plate 26 cm (ikea.lt, 904.781.77); IKEA 365+ dinner plate 27 cm (dimensions.com)"
ORDER.extend(["esme", "angsfraken", "bramon", "habitatchair", "plia", "vasagle", "nissedal", "plates"])
# v32: the three new suggestions (ideas.SUGGEST), each from its product page
SOURCES["piclight"] = ("Online Lighting: Slimline Medium Battery Operated LED Picture Light, satin nickel, £14.99 (166342): overall H 77 × W 279 × D 125 mm, "
                       "shade H 16 × W 279 × D 16 mm, back plate H 70 × W 106 mm, three AA cells (onlinelighting.co.uk)")
SOURCES["blackout"] = ("The Range: Made to Measure Blackout Roller Blind, from £24.99: width 10–240 cm, drop 10–210 cm, made to the size given, "
                       "inside or outside the recess on top- or face-fix brackets (therange.co.uk)")
SOURCES["cablight"] = ("Dickens Direct: 40cm USB Rechargeable LED Under Cabinet Light, wireless, motion sensor and touch, warm white (3000K), "
                       "magnetic or adhesive fixing, £13.99 ex. VAT (PCJW256; dickensdirect.com)")
ORDER.extend(["piclight", "blackout", "cablight"])


def cab_zone():
    """The compact cabinet: the same table and six chairs as the sliding one, packed into two boxes 144 long with hinged doors."""
    g, C = G, G.CAB
    cw, cdep, ch = g.CHAIR_PADDED["folded"]                 # v33: the grey padded chairs, folded 47 × 10 × 90
    st = optc_seats(C)
    back = g.CHAIR_PADDED["d"] - g.CHAIR_TUCK
    s_back, w_back = C["tz"][0] + back, C["tz"][1] - back
    arc = g.BREAST_D_WEST - g.DOOR_SWING
    under = g.SHELF_B["top"] - g.SHELF_B["t"]
    in_d, bay_t, bay_c = C["in_d"], C["bay_t"], C["bay_c"]
    pb = g.PLANT_B
    pl = g.PLANT_LAYOUTS["corner"]["plants"]
    plant_face = pl[1] + g.PLANT_STAND["d"] / 2
    kg_half = C["top"][0] * C["top"][1] * C["top"][2] * 0.72 / 1000
    base_h = C["base"][1] - C["base"][0]
    lo_top, up0, up_top = C["plinth"] + ch, C["shelf_y"] + C["t"], C["shelf_y"] + C["t"] + ch
    near = max(x for x, z, f in C["seats"]["six"] if f == "w") + g.CHAIR_PADDED["w"] / 2      # the window side's chair nearest the cabinet: its side
    slide = G.OPTC["z"][0] - G.OPTC["z"][1]
    return ("The compact dining cabinet (the plan)", f"two oak boxes, {r1(C['len'])} × {r1(C['d'])} × {r1(C['h'])}, hinged doors; "
            f"table {r1(C['len_open'])} × {r1(C['top'][0])} open, six chairs inside", [
        ("The cabinet under your shelf", f"{r1(C['h'])} tall", ref("photo20"), f"shelf's underside about {r1(under)}", f"{r1(under - C['h'])}: room to tip it up into place", PASS),
        ("Its length", f"z {r1(C['z'][0])} to {r1(C['z'][1])}: the table box {r1(C['z_t'][0] - C['z_t'][1])}, the chair box {r1(C['z_c'][0] - C['z_c'][1])}",
         ref("photo20", "room", "solidwall"), "the shelf's length; the stair's foot before it stays clear",
         f"{r1(C['freed'])} of bare wall back by the pipe boxing", PASS),
        ("Its depth", f"{r1(C['d'])} to the doors' faces", ref("room"), f"the pipe boxing beside it is {r1(g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0])} deep",
         (f"flush with the boxing's face" if abs(C['d'] - (g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0])) < 0.05 else
          f"{r1(C['d'] - (g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0]))} prouder than the boxing") + "", PASS),
        ("The two doors and their hinges", f"inset oak-faced ply: the table door {r1(C['door_tw'])} × {r1(C['door_h'])}, about {C['door_kg'][0]:.0f} kg; the chair door "
         f"{r1(C['door_cw'])} wide, about {C['door_kg'][1]:.0f} kg", ref("piano32"), "a full-height stainless piano hinge each, screwed every 10 cm into a solid oak edge",
         "the hinge's load isn't published: hang the table door, open it flat, and check its far end doesn't drop before you load the cabinet", CHECK),
        ("The table door open", "it turns 180° and lies back flat over the chair door and the wall beyond", ref("piano32", "plantstand"),
         f"its far end reaches z {r1(C['door_t_open'][1])}; your plant stand's front is at z {r1(plant_face)}",
         f"{r1(C['door_t_open'][1] - plant_face)} clear of the plant stand; a flush magnet in the chair door's face holds it open", PASS),
        ("The open table door and the window side's chairs", f"its face, lying open, at x {r1(C['door_t_face'])}", ref("padded", "dining"),
         f"the nearest chair's side at x {r1(near)}", f"{r1(C['door_t_face'] - near)} clear: the chair pulls back past it", PASS),
        ("The chair door open", "it turns 180° and lies back flat over the table door", ref("piano32"), f"the table door {r1(C['door_tw'])} wide",
         f"well inside it; open it only with the table folded (the chairs come out first)", PASS),
        ("The table standing up in its bay", f"two halves {r1(C['top'][1])} long, hinged at {r1(C['pivot'][1])}", ref("foldtable", "pianohinge"), f"the bay {r1(bay_t)} wide inside",
         f"{r1((bay_t - C['top'][0]) / 2)} each side; its top edge at {r1(C['folded_top'])}, under the linen shelf", TIGHT),
        ("The linen shelf over the folded table", f"{r1(C['linen'][1] - C['linen'][0])} tall, {r1(bay_t)} wide", ref("foldtable"), f"{r1(in_d)} deep inside",
         "the cloth, napkins, runner and candles, 4 back from the door", PASS),
        ("Folded, behind the table door", f"the table {r1(C['stack'])} deep, {r1(C['pads'])} back from the door (a hook for the cloth bag)",
         ref("legbracket"), f"{r1(in_d)} inside, behind the table door", f"{r1(in_d - C['stack'] - C['pads'])} spare behind it", PASS),
        ("Lowering it and flipping the half", f"each half about {kg_half:.0f} kg", ref("pianohinge", "fliphinge"), f"a {r1(C['top'][0])} piano hinge at its foot; three flip-top hinges at the joint",
         f"it swings down like a drop-front: about {kg_half:.0f} kg, two hands; the legs drop and lock as it comes down", PASS),
        ("The legs", f"oak {r1(C['leg'][0])} × {r1(C['leg'][1])}, {r1(C['leg_h'])} long, a pair at each half's end", ref("legbracket"), "four self-locking folding brackets",
         f"each pair folds flat inside its half's {r1(C['apron'])} apron; {r1(C['leg_h'])} of knee room under it", PASS),
        ("Two chairs in the base, on their sides", f"two folded, each {r1(ch)} long and {r1(cw)} tall, two deep ({r1(2 * cdep)})", ref("padded"),
         f"the base under the hinge rail: {r1(bay_t)} wide, {r1(base_h)} tall, {r1(in_d)} deep",
         f"{r1((bay_t - ch) / 2)} at each end, {r1(base_h - cw)} over them, {r1(in_d - 2 * cdep)} spare deep: lift the front one out, then the back one", TIGHT),
        ("Four chairs in the chair bay", f"one across ({r1(cw)}), two deep ({r1(2 * cdep)}), {r1(ch)} tall", ref("padded"), f"the bay {r1(bay_c)} wide, {r1(in_d)} deep; the shelf at {r1(C['shelf_y'])}",
         f"{r1((bay_c - cw) / 2)} each side, {r1(in_d - 2 * cdep)} deep; two on the floor ({r1(C['plinth'])}–{r1(lo_top)}, {r1(C['shelf_y'] - lo_top)} under the shelf), "
         f"two on the shelf ({r1(up0)}–{r1(up_top)}, {r1(C['h'] - C['t_top'] - up_top)} under the top)", TIGHT),
        ("Your trailing plant on the shelf", f"strands {r1(pb['trail'][0])}–{r1(pb['trail'][1])} long, through the shelf's {r1(g.SHELF_B_GAP)} gap", ref("photo20"),
         "the open table door's swing", f"{r1(_strand_clear())} clear of it; the pot stands on the shelf, over the door's top", PASS),   # v41: since v38 the strands hang through the gap
        ("Stair side: three chairs", f"{st['stair'][1]:.1f} of edge each", ref("dining", "padded", "costwaychair"), f"{r1(st['stair'][2])} from the far end to the cabinet",
         "55 is the squeeze, 60 the aim: three sit in comfort", PASS),
        # v33: the padded chairs' depth isn't in the listing's words (drawn at a like-for-like chair's 61): the stair side's backs then reach
        # into the door's swing while you sit; the deepest chair that clears it is the check
        ("Stair side: the stair's foot and the door", f"chair backs at z {r1(s_back)}", ref("room", "photo20", "padded", "costwaychair"), f"the stair box's face at {r1(g.STAIRS_WALL_Z[0])}; the door's edge reaches {r1(arc)}",
         (f"{r1(g.STAIRS_WALL_Z[0] - s_back)} from the stair box, {r1(arc - s_back)} from the door's swing: tuck the end chair in after a meal" if arc - s_back >= 0 else
          f"seated, the backs reach {r1(s_back - arc)} into the door's swing: keep the door shut while you eat. Measure a chair's depth: "
          f"{r1(arc - C['tz'][0] + g.CHAIR_TUCK)} or less and the door clears"), TIGHT if arc - s_back >= 0 else CHECK),
        ("Window side: three chairs", f"{st['window'][1]:.1f} of edge each", ref("dining", "sofa"), f"{r1(st['window'][2])} from the sofa's arm (x {r1(g.SOFA_X[1])}) to the cabinet",
         f"three in comfort; backs at z {r1(w_back)}, {r1(w_back - plant_face)} clear of your plant stand", PASS),
        ("The far end and the coffee table", f"the table ends at x {r1(C['tx'][0])}", ref("dining"), f"the coffee table to x {r1(g.COFFEE['x'][1])}",
         f"{r1(C['tx'][0] - g.COFFEE['x'][1])} between them: the coffee table stays put; a seventh chair fits at the end ({r1(st['end_clear'])} behind its back)", PASS),
        ("The ottoman (v38: a dinner spot)", f"{r1(g.SOFA_POUF['w'])} square", ref("pouf"), f"the open table reaches x {r1(C['tx'][0])}; the ottoman to x {r1(g.SOFA_POUF['x'][1])}",
         f"{r1(g.SOFA_POUF['x'][1] - C['tx'][0])} under the table's end, so while you eat it goes in front of the media wall (x {r1(g.SOFA_POUF['dinner']['x'][0])}–{r1(g.SOFA_POUF['dinner']['x'][1])}): "
         f"{r1(C['tx'][0] - g.SOFA_POUF['dinner']['x'][1])} clear of the table's end", PASS),
        ("The table's side and the sofa", f"window edge at z {r1(C['tz'][1])}", ref("sofa"), f"the sofa's front at z {r1(g.SOFA_FRONT_Z)}",
         f"{r1(C['tz'][1] - g.SOFA_FRONT_Z)} between them: the table passes the sofa's end", PASS),
        ("Light over the table", "bar 2 on the existing pendant point", ref("photo20"), f"point about ({r1(g.BAR2_X)}, {r1(g.BAR2_Z)})",
         "over the table; the table rule turns bar 2 up when it's open", PASS),
        ("Fixing it", "two boxes on the floor, screwed together, two angle brackets at the top", ref("solidwall"), "your stairs wall: solid",
         "plugs and 5 × 70 screws; the floor takes the weight, the wall only steadies it", PASS),
    ])


_zones_v29 = zones


def beside_zone():
    """v31: what could stand beside the compact cabinet, on the wall to the pipe boxing: each kept behind the open table door's line."""
    g, C, B = G, G.CAB, G.BESIDE
    m, tr, d = B["mirror"], B["trolley"], B["dresser"]
    covered = C["z"][1] - B["door_end"]                      # how much of the wall the open door lies over
    under = g.SHELF_B["top"] - g.SHELF_B["t"]
    return ("Beside the compact cabinet (ideas)", f"the wall from the cabinet's window end to the pipe boxing, {r1(B['len'])} long, under your shelf", [
        ("The wall beside it", f"z {r1(B['z'][0])} to {r1(B['z'][1])}", ref("room", "photo20"), f"the open table door lies {r1(C['d'])} off it over the first {r1(covered)}",
         f"so anything here stays within {r1(B['depth'])} of the wall: the door must lie flat in front of it", PASS),
        ("A tall mirror", f"{r1(m['w'])} × {r1(m['h'])}, on the wall from {r1(m['y0'])} to {r1(m['y0'] + m['h'])}", ref("nissedal"), f"{r1(B['len'])} of wall, {r1(under)} under the shelf",
         f"{r1((B['len'] - m['w']) / 2)} each side, {r1(under - m['y0'] - m['h'])} under the shelf; it bounces the window's light into the corner, and the trailing plant hangs in front of it", PASS),
        ("A slim trolley", f"{r1(tr['w'])} long × {r1(tr['d'])} deep × {r1(tr['h'])}, on castors", ref("vasagle"), f"{r1(B['len'])} × {r1(B['depth'])}",
         f"{r1(B['len'] - tr['w'])} spare along, {r1(B['depth'] - tr['d'])} deep; pull it out for dinner before the table door opens, to stand behind the window-side diners: plates, glasses, a jug", PASS),
        ("The trolley and the trailing plant", f"its top at {r1(tr['h'])}", ref("photo20", "vasagle"), f"the longest strands end about {r1(B['strands'])} up",
         f"{r1(tr['h'] - B['strands'])} into the longest strands: trim them a little or slide the pot along the shelf", CHECK),
        ("A low oak shelf", f"{r1(d['w'])} × {r1(d['d'])} × {r1(d['h'])}, matching the cabinet, open to the room", ref("plates", "room"), "six dinner plates on edge, glasses, three bottles",
         f"its top {r1(B['strands'] - d['h'])} under the longest strands; the open table door lies over {r1(covered)} of its {r1(d['w'])}: take what you need out before the table comes down", TIGHT),
    ])


def zones():
    """v30: the compact cabinet is the plan: its zone comes first, then the sliding one (the alternative). v31: then what could go beside it."""
    zs = _zones_v29()
    i = next((k for k, z in enumerate(zs) if z[0].startswith("The sliding dining cabinet")), len(zs))
    return zs[:i] + [cab_zone(), beside_zone()] + zs[i:]


# v33, client: "The compact cabinet is our only choice for the table now or any upgraded more compact version for this as we're trying to
# optimise space": the sliding cabinet and the flip-top leave the fit proof; the compact cabinet with an 80-wide table is checked beside it.
def cab80_zone():
    """The more compact version: the same cabinet round a 185 × 80 table, 10 shorter. Its base is too narrow for the two chairs lying in it."""
    g, C, P = G, G.CAB80, G.CAB
    cw, cdep, ch = g.CHAIR_PADDED["folded"]
    st = optc_seats(C)
    plate = 27.0
    mid80, mid90 = C["top"][0] - 2 * plate, P["top"][0] - 2 * plate
    pl = g.PLANT_LAYOUTS["corner"]["plants"]
    plant_face = pl[1] + g.PLANT_STAND["d"] / 2
    return ("The more compact version: an 80-wide table (an option)", f"the same two boxes, {r1(C['len'])} long, the table {r1(C['len_open'])} × {r1(C['top'][0])} open", [
        ("Its length", f"z {r1(C['z'][0])} to {r1(C['z'][1])}", ref("photo20", "room"), f"{r1(P['len'])} for the plan's",
         f"{r1(P['len'] - C['len'])} shorter: {r1(C['freed'])} of bare wall by the pipe boxing instead of {r1(P['freed'])}", PASS),
        ("At the table", f"{st['comfort']} in comfort", ref("dining", "padded", "costwaychair"), f"{st['stair'][0]} a side, {st['stair'][1]:.0f} of edge each: the length doesn't change",
         f"the window edge {r1(C['tz'][1] - g.SOFA_FRONT_Z)} from the sofa's front (the plan's: {r1(P['tz'][1] - g.SOFA_FRONT_Z)})", PASS),
        ("Across the table", f"{r1(C['top'][0])} wide, a 27 plate at each place", ref("plates", "dining"), f"{r1(P['top'][0])} in the plan",
         f"{r1(mid80)} down the middle for dishes (the plan: {r1(mid90)}): a jug and one dish at a time", TIGHT),
        ("Six chairs inside", f"four standing in the chair box; two lying on their sides need {r1(ch)} + 1", ref("padded"), f"the base is {r1(C['bay_t'])} wide (the plan's {r1(P['bay_t'])})",
         "the two don't fit lying down: four go inside, two live elsewhere (the garage, or folded behind a door)", NO),
        ("The table door", f"{r1(C['door_tw'])} wide, open over the chair door", ref("piano32"), f"your plant stand's front at z {r1(plant_face)}",
         f"its far end at z {r1(C['door_t_open'][1])}: {r1(C['door_t_open'][1] - plant_face)} clear", PASS),
    ])


def max_seats_zone():
    """v33: the compact cabinet only, in its two widths."""
    g, C, C8 = G, G.CAB, G.CAB80
    st, s8 = optc_seats(C), optc_seats(C8)
    seat = lambda t: (f"{t['stair'][1]:.1f} and {t['window'][1]:.1f} of edge each; a seventh at the far end with a spare chair" if t["end"]
                      else f"{t['stair'][1]:.1f} and {t['window'][1]:.1f} each")
    return ("How many can sit down", "the compact cabinet's table, in this room, with chairs a person wide and backs 41 behind the edge", [
        ("The compact cabinet (the plan)", f"{st['comfort']} in comfort", ref("dining", "frosvi"), f"{st['stair'][0]} on the stair side, {st['window'][0]} on the window side", seat(st), PASS),
        ("The 80-wide version", f"{s8['comfort']} in comfort", ref("dining", "frosvi"), f"{s8['stair'][0]} on the stair side, {s8['window'][0]} on the window side", seat(s8) + "; four chairs inside, not six", PASS),
        ("A fourth chair a side", "eight round it", ref("dining", "sofa", "room"), f"{r1(st['stair'][2])} and {r1(st['window'][2])} of edge",
         f"{st['stair'][2] / 4:.1f} each: under the 55 squeeze", NO),
        ("A longer table in the cabinet", f"halves over {r1(C['h'] - C['t_top'] - C['pivot'][1])}", ref("photo20"), "they must stand up under your shelf",
         f"{r1(C['h'] - C['t_top'] - C['pivot'][1])} is the most that folds away; {r1(C['top'][1])} leaves the linen shelf's space", PASS),
    ])


_zones_v32 = zones
_SET_ASIDE = ("The sliding dining cabinet", "The flip-top table", "Option A: the flip-top", "The flip-top's chair cupboard", "More ways to keep the chairs with the flip-top")


def zones():
    """v33: the compact cabinet only (the sliding cabinet and the flip-top are set aside), with its 80-wide version after it."""
    out = []
    for z in _zones_v32():
        if z[0].startswith(_SET_ASIDE):
            continue
        if z[0] == "How many can sit down":
            z = max_seats_zone()
        z = (z[0], z[1], [r for r in z[2] if not r[0].startswith("If you choose option A")])
        out.append(z)
        if z[0].startswith("The compact dining cabinet"):
            out.append(cab80_zone())
    return out


# v33, client: "I'd also like these chairs or similar, make adjustments and decisions as required"
SOURCES["padded"] = ("Wayfair UK (Brayden Studio), sent by you: \"2PCS Wooden Folding Dining Chair with Cushion, Padded Seat, Grey Breathable "
                     "Linen Fabric, 6.5cm Thick Cushion, 110° Backrest, 168kg Capacity, No Assembly\"; \"a generously sized 47×47cm seat paired with "
                     "a 6.5cm thick high-density sponge cushion. 90×10×47cm\" (folded: 90 tall, 10 thick, 47 wide); listing u111353306; "
                     "your photo of a pair (media-wall/inputs/chairs_padded_listing_photo.webp): bent-wood sides, buttoned seat and back")
SOURCES["costwaychair"] = ("Costway: set of 2 wooden folding dining chairs with linen padded seat and backrest (53981642), the like-for-like chair the "
                           "padded chairs' open depth, height and seat height are drawn at: 19 × 24 × 31 in (48.3 W × 61 D × 78.7 H cm), seat 17.5 in high (44.5), seat 16 × 17.5 in, "
                           "folding size 19 × 36.5 in (48.3 × 92.7); 300 lb a chair; no folded thickness published (costway.com, 21 Oct 2026)")
ORDER.extend(["padded", "costwaychair"])


def counts():
    """v33: the plan's checks only: the seat count's limits and the 80-wide option's rows stay out of the totals."""
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for title, _, rows in zones():
        if title == "How many can sit down" or title.startswith("The more compact version"):
            continue
        for r in rows:
            c[r[-1]] += 1
    return c



# ---------------------------------------------------------------- v34, client: "i like the large glass display case on the chimney breast"
# (in the plan now), "maybe integrating a wall bar in here for drinks/spirits" (two suggestions) and "a new ottoman that is actually a
# storage ottoman ... similar size to what we have right now"
SOURCES["glasscut"] = ("FHB Rundle (UK): custom-sized toughened glass panels, cut to your sizes, polished on all edges with docked corners, "
                       "0.3 m² minimum charged (fhbrundle.co.uk); toughened glass about £70–90 a m², polished edges about £5 a m² more (UK glass cost "
                       "calculator, everycalculators.com)")
SOURCES["acrylicmirror"] = ("Simply Plastics (UK): silver acrylic mirror sheet cut to size, ±1 mm, 3 mm (5 mm advised over 1200 × 1200) "
                            "(simplyplastics.com)")
SOURCES["bottles"] = ("70 cl spirit bottles, makers' sheets: Univerre Platin 70 cl 349 tall × 74.0 across; Univerre Oblò bartop 192 × 94.7; "
                      "Univerre London 238 × 92.0; Saverglass Premiere Spirit 70 cl 327.5 × 76.2; Verallia Caeli 700 ml 263.9 × 74.7 "
                      "(univerre.ch, saverglass.com, uk.verallia.com)")
SOURCES["flapstay"] = ("Howdens: Blum soft-close flap stay, pack of two, steel, for doors 14–22 mm thick (HKE0069; howdens.com); a stay is sized "
                       "by torque, half the flap's height × its weight (Sugatsune soft-down stays, global.sugatsune.com)")
SOURCES["istoolsott"] = ("ISTOOLS (UK): Large Velvet Storage Ottoman, square, a lift-off upholstered lid on a memory-foam pad, a solid wooden "
                         "frame, legs that screw on; 14 sizes from 48 × 43 to 120 × 120, among them 76 × 76 (30 × 30 in, \"a small-flat coffee "
                         "table\"); blues include navy; the 76 × 76 listed at £304 on one of their velvet ottomans; height not given "
                         "(istools.co.uk/products/square-plain-lid-coffee-table-ottoman-storage-large-velvet-footrest-ukw)")
SOURCES["opulent"] = ("Dunelm: Square Opulent Velvet Storage Footstool, H 39 × W 62 × D 62 cm, legs 3.5, storage inside H 18 × 57.5 × 57.5, "
                      "nine colours including navy, £139.30–199 (dunelm.com, product 1000249916)")
SOURCES["zoe"] = ("Dunelm: Zoe Pinstripe Fabric Square Storage Footstool, H 49 × W 96 × D 96 cm, cotton blend, tested to 120 kg, navy among "
                  "its colours, £199 (£99.50 in a sale) (dunelm.com, product 1000239490)")
SOURCES["luxorcord"] = ("Homebase: Luxor Navy Blue Jumbo Cord Footstool, 55 × 55, 45 high (42 on diy.com), a fixed top, no storage, £136 "
                        "(homebase.co.uk, 0739873)")
ORDER.extend(["glasscut", "acrylicmirror", "bottles", "flapstay", "istoolsott", "opulent", "zoe", "luxorcord"])


def case_zone():
    """v34: the glass display case on the breast, in the plan (ideas.CASE: 90 × 85 × 12, three glass shelves)."""
    import ideas
    C, L, P_ = ideas.CASE, G.NOW_LEDGE, G.PLANT_STAND
    w, h = C["x"][1] - C["x"][0], C["y"][1] - C["y"][0]
    lp_top = L["top"] + G.LP * 0.99
    sh = C["shelves"]
    gaps = [sh[0] - C["y"][0] - C["frame"], sh[1] - sh[0], sh[2] - sh[1], C["y"][1] - C["frame"] - sh[2]]
    return ("The glass display case on the chimney breast (v34: in the plan)", f"{r1(w)} × {r1(h)} × {r1(C['d'])}, from {r1(C['y'][0])} to {r1(C['y'][1])}", [
        ("On the breast, centred", f"{r1(w)} wide", ref("glasscut"), f"breast {r1(G.BREAST_W)} wide",
         f"{r1((G.BREAST_W - w) / 2)} each side", PASS),
        ("Under the ceiling", f"top at {r1(C['y'][1])}", ref("glasscut"), f"{r1(G.CEIL)} ceiling", f"{r1(G.CEIL - C['y'][1])} above it", PASS),
        ("Over the “now playing” sleeves", f"bottom at {r1(C['y'][0])}", ref("media"), f"the sleeves' tops at {r1(lp_top)}", f"{r1(C['y'][0] - lp_top)} between", TIGHT),
        ("Its four spaces", ", ".join(r1(x) for x in gaps) + " high", ref("glasscut"), "7-inch singles 18.4, boxed games, figures, small plants",
         "the bottom one takes tumblers and coupes (about 9–14) if you build the drinks cabinet under it", PASS),
        ("Depth, front to back", f"{r1(C['d'])} deep, a 4 mm front, 6 mm shelves", ref("glasscut"), "the vinyl stand below it stands 32 out",
         "it stays no further out than a picture ledge; the stand and its sleeves sit under it", PASS),
    ])


def drinks_zone():
    """v34: the two ways to a bar (suggestions, not in the plan's checks or costs)."""
    D, Bo, B, tr = G.DRINKS, G.DRINKS_BOTTLE, G.BESIDE, G.BESIDE["trolley"]
    w = D["x"][1] - D["x"][0]
    return ("A bar for drinks: two ways (suggestions)", f"A under the glass case, {r1(w)} × {r1(D['y'][1] - D['y'][0])} × {r1(D['d'])}; B the slim trolley", [
        ("A: the bottles standing", f"inside {r1(D['inner_h'])} high", ref("bottles"), f"the tallest 70 cl {r1(Bo[0])}", f"{r1(D['inner_h'] - Bo[0])} over it", TIGHT),
        ("A: across the cabinet", f"{D['n']} bottles", ref("bottles"), f"inside {r1(w - 2 * D['t'])} wide", f"{r1(Bo[1])} each for the widest (9.5)", PASS),
        ("A: front to back", f"{r1(D['d'] - D['t'] - 1.2 - D['mirror'])} clear inside", ref("bottles", "acrylicmirror"), f"the widest bottle {r1(Bo[1])}",
         "one row, the labels to the room, the mirror behind", PASS),
        ("A: under the case", f"top at {r1(D['y'][1])}", ref("glasscut"), f"the case from {ideas_case_y0()}", f"{r1(ideas_case_y0() - D['y'][1])} between", PASS),
        ("A: the open front, a counter", f"at {r1(D['counter'])}, {r1(D['reach'])} off the breast", ref("flapstay"),
         "the vinyl stand below: 78 tall, 32 deep", f"{r1(D['counter'] - G.RECORD_SHELF['h'])} over it; a standing bar's height", PASS),
        ("A: the flap's stays", "18 mm oak-faced ply, about 3 kg", ref("flapstay"), "Blum's soft-close stays: doors 14–22 mm", "within; check the torque on Blum's chart", PASS),
        ("A: the “now playing” ledge", f"its top at {r1(G.NOW_LEDGE['top'])}", ref("media"), f"the cabinet {r1(D['y'][0])}–{r1(D['y'][1])}",
         "it comes off: the vinyl stand's face-out top bays show what's on", PASS),
        ("B: the trolley, pulled out for dinner", f"{r1(tr['w'])} × {r1(tr['d'])}, to x 326–346", ref("vasagle"),
         "the open table door's swing (90.5 from its hinge), the window-side chairs, the plant stand",
         "112 from the door's hinge (the door is 90.5), 13 behind the chairs, 1.3 off the plant stand: it comes out before the table door opens", TIGHT),
        ("B: on its trays", "bottles on top; glasses, mixers, an ice bucket below", ref("vasagle", "bottles"), "trays 24 apart",
         "the top tray takes the tallest bottle; tumblers and cans fit between the others", PASS),
    ])


def ideas_case_y0():
    import ideas
    return ideas.CASE["y"][0]


def ottoman_zone():
    """v34: the new storage ottoman, where the old one stood."""
    g = G
    O, P_ = g.OTTOMAN, g.SOFA_POUF
    gap_c = P_["x"][0] - g.COFFEE["x"][1]
    gap_s = P_["z"][0] - g.SOFA_FRONT_Z
    return ("The storage ottoman (v34: replaces your blue cord one)", f"{r1(O['w'])} × {r1(O['d'])} × {r1(O['h'])}, navy velvet, on the rug", [
        ("Its size against the old one", f"{r1(O['w'])} square", ref("istoolsott", "pouf"), "yours 75 square, 44 high", "1 wider each way: the nearest size made", PASS),
        ("Beside the coffee table", f"x {r1(P_['x'][0])}–{r1(P_['x'][1])}", ref("istoolsott"), f"coffee table to x {r1(g.COFFEE['x'][1])}",
         f"{r1(gap_c)} between them; {r1(gap_s)} off the sofa's front", PASS),
        ("Its height", f"about {r1(O['h'])}", ref("istoolsott"), "the sofa's seat about 45", "a footrest level with the seat; ISTOOLS don't publish it: check", CHECK),
        ("Inside", f"about {r1(O['inner_h'])} deep under the lid", ref("istoolsott", "ttr"), "your games and cards",
         f"{G.OTTO_GAMES['games']} square games and the cards (Storage and a bar, below); the Dunelm one is 18 deep: a layer or two", PASS),
    ])


_zones_v33 = zones


def zones():
    """v34: the case in the plan; the ottoman is the new one; the bar's two ways after the breast (suggestions)."""
    out = []
    for z in _zones_v33():
        if z[0].startswith("Your sofa's ottoman"):
            z = ottoman_zone()
        if z[0].startswith("The chimney breast"):
            z = (z[0], z[1], [r for r in z[2] if not r[0].startswith(("If you choose option A", "Leaning back 8°, under the framed LPs"))])
            out.append(z)
            out.append(case_zone())
            out.append(drinks_zone())
            continue
        out.append(z)
    if not any(t.startswith("The glass display case") for t, *_ in out):
        out += [case_zone(), drinks_zone()]
    return out


_counts_v33 = counts


def counts():
    """v34: as v33, and the bar's two ways (suggestions) stay out of the totals."""
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for title, _, rows in zones():
        if title == "How many can sit down" or title.startswith(("The more compact version", "A bar for drinks")):
            continue
        for r in rows:
            c[r[-1]] += 1
    return c


# ---------------------------------------------------------------- v36: more bars, storage, blankets, the plant shelf (suggestions)
SOURCES["ttr"] = ("Wikipedia, Ticket to Ride (board game): its box is 30 × 30 × 8 cm, and became a common reference size for medium-size "
                  "games; a retailer lists the 2023 Days of Wonder box at 30 × 30 × 7.6 (en.wikipedia.org/wiki/Ticket_to_Ride_(board_game))")
SOURCES["bicycle"] = ("Kaufland (Austria): Bicycle Botanica playing cards, packaging 65 × 92 × 18 mm; Bicycle's poker-size cards are 88 × 63 mm "
                      "(kaufland.at/product/400400869)")
SOURCES["ofelia"] = ("IKEA: OFELIA throw, 130 × 170 cm, white: package 38 × 33 × 8 cm, 0.67 kg, as sold folded "
                     "(ikea.com/lv/en/p/ofelia-throw-white-50613224)")
SOURCES["cotswold"] = ("The Cotswold Company: Seagrass Basket With Lid, Large: 76 high × 45 wide × 45 deep (external), handwoven seagrass, "
                       "£99 (cotswoldco.com/homeware/storage/baskets-and-general-storage/seagrass-basket-with-lid-large)")
SOURCES["homelife"] = ("Sports Direct: Homelife Lifting Traditional Coffee Table, H48 × W90 × D50 cm, 53.5 high with the top lifted, a storage "
                       "area inside, £39 (was £79.99) (sportsdirect.com/homelife-lifting-traditional-coffee-table-946062)")
SOURCES["kuggis"] = ("IKEA: KUGGIS box with lid, 26 × 35 × 15 cm, recycled PET with a bamboo lid; fits storage at least 26 deep "
                     "(ikea.com.tr/en/p09610214)")
SOURCES["oakdowel"] = ("Tools & Timber: oak dowels, 18 to 30 mm across, cut from 350 to 2400 mm long (toolsandtimber.co.uk/oak-dowels)")
ORDER.extend(["ttr", "bicycle", "ofelia", "cotswold", "homelife", "kuggis", "oakdowel"])
# v38: the better basket and the record table (UPGRADE_PLAN_v38 items 8 and 9)
SOURCES["lakelyn"] = ("Dibor: Lakelyn Water Hyacinth Lined Basket, large H59 × W51 × D29 cm (medium H48 × W41 × D21), water hyacinth with a "
                      "removable cotton lining, natural, £42 (dibor.co.uk/products/lakelyn-water-hyacinth-lined-basket); no lid listed")
SOURCES["kallax"] = ("IKEA: KALLAX cube storage unit, 42 × 42 cm, grey wood effect (also white, black-brown, white stained oak effect): "
                     "W 41.5 × D 39 × H 40.7 cm, 13 kg a shelf, £19 (ikea.com/gb/en/p/kallax-shelving-unit-grey-wood-effect-60477933); "
                     "open-backed, a 33 cm square compartment")
SOURCES["snowdonoak"] = ("Snowdon Timber: oak furniture board, 18 × 600 × 1200 mm, £184.50 for a pack of three through Tesco Marketplace "
                         "(tesco.com/shop/en-GB/products/326112258), single boards from snowdontimber.co.uk")
SOURCES["wickesply"] = ("Wickes: non-structural hardwood plywood sheet, 12 × 607 × 1829 mm, £22.50 (wickes.co.uk, product 112957)")
SOURCES["castor50"] = ("Toolstation: MOVE IT swivel wheel castor, 50 mm, non-marking rubber tyre, 50 kg each, £3.29 (toolstation.com/"
                       "swivel-wheel-castor/p29715); about 6.5 high overall (check the listing)")
SOURCES["lidstay"] = ("Eurofit Direct: toy box and lid stays, soft-down, for ottomans and toy boxes, £14.90 each or £29.81 a pair "
                      "(eurofitdirect.co.uk/collections/toy-box-and-lid-stays)")
ORDER.extend(["lakelyn", "kallax", "snowdonoak", "wickesply", "castor50", "lidstay"])


def storage_zone():
    """v36: the options round the room: a third bar, the games and cards, the blankets, more storage (suggestions; v37: the plant shelf went)."""
    g = G
    C, O, Gm, Bb, Ra, Ds, Rt = g.BAR_SIDE, g.OTTOMAN, g.OTTO_GAMES, g.BLANKET_BASKET, g.BESIDE["rail"], g.DOOR_SHELF, g.RECORD_TABLE
    th, n = g.THROW_FOLDED, g.BLANKETS
    return ("Storage and a bar: the options (suggestions)", "a third bar by the sofa, the ottoman's games, five blankets, three more places", [
        ("C, the bar by the sofa: bottles", f"{C['n']} across, inside {r1(C['inner_h'])} high", ref("bottles"), f"the tallest 70 cl {r1(g.DRINKS_BOTTLE[0])}",
         f"{r1(C['inner_h'] - g.DRINKS_BOTTLE[0])} over it, as under the case", TIGHT),
        ("C: under the oak run", f"top at {r1(C['y'][1])}", ref("room"), f"the run's underside {r1(g.LEDGE_TOP - g.SIDE_RUN_T)}",
         f"{r1(C['run_gap'])} between: glasses stand on the run", PASS),
        ("C: over the media wall's drawers", f"from {r1(C['y'][0])}, z {r1(C['z'][0])} to {r1(C['z'][1])}", ref("room"), "the drawers pull out under the worktop (76)",
         f"{r1(C['y'][0] - 76.0)} above them; its open counter at {r1(C['counter'])}, {r1(C['reach'])} off the wall", PASS),
        ("The ottoman: board games", f"{Gm['games']}, {Gm['across']} × {Gm['across']} in {Gm['layers']} layers", ref("ttr", "istoolsott"),
         f"inside {r1(Gm['inner'])} square × {r1(O['inner_h'])} deep (drawn: check the real one)", f"square boxes {r1(g.GAME_BOX[0])} × {r1(g.GAME_BOX[2])}", CHECK),
        ("The ottoman: cards", f"a {r1(Gm['strip'])} strip along one side", ref("bicycle"), "decks 6.5 × 9.2 × 1.8, on edge",
         f"up to {Gm['decks']} decks (about 38 a row, 3 rows); or boxed card games", PASS),
        ("Blankets: the tall basket", f"{r1(Bb['d'])} × {r1(Bb['w'])} × {r1(Bb['h'])}, {r1(Bb['inner'][0])} × {r1(Bb['inner'][1])} inside", ref("lakelyn", "ofelia"),
         f"five throws, each folded long to {r1(g.THROW_LONG[0])} × {r1(g.THROW_LONG[1])} × {r1(g.THROW_LONG[2])}",
         f"flat, {n} use {r1(n * g.THROW_LONG[2])} of its {r1(Bb['inner'][2])} (about {Bb['litres']} litres)", PASS),
        ("Blankets: the basket's corner", f"x {r1(Bb['x'][0])}–{r1(Bb['x'][1])}, z {r1(Bb['z'][0])} to {r1(Bb['z'][1])}", ref("room"),
         f"the sofa's open end at z {r1(g.SOFA_BACK_Z + g.SOFA_D)}", f"3 off the sofa's end, {r1(Bb['w'])} out from the wall; it takes the floor plant suggestion's corner", PASS),
        ("Blankets: the lidded seagrass basket (an option)", f"{r1(g.BLANKET_COTSWOLD['w'])} × {r1(g.BLANKET_COTSWOLD['d'])} × {r1(g.BLANKET_COTSWOLD['h'])}", ref("cotswold", "ofelia"),
         f"five throws folded {r1(th[0])} × {r1(th[1])} × {r1(th[2])}", f"flat, {n} use {r1(n * th[2])} of about {r1(g.BLANKET_COTSWOLD['h'] - 4)}", PASS),
        ("Blankets: the oak rail beside the cabinet", f"{r1(Ra['w'])} wide, {len(Ra['rails'])} rails, {r1(Ra['off'])} off the wall", ref("oakdowel"),
         f"the open table door stands {r1(g.CAB['d'])} off the wall", f"the blankets over it about {r1(Ra['draped'])}: {r1(g.CAB['d'] - Ra['draped'])} behind the door", TIGHT),
        ("The record table: its footprint", f"lid {r1(Rt['w'])} × {r1(Rt['d'])}, the KALLAX pair {r1(Rt['carcass'][0])} × {r1(Rt['carcass'][1])}", ref("kallax"),
         "your coffee table's 90 × 50", f"the same footprint; {r1(Rt['h'])} high, {r1(Rt['h'] - 48.0)} over the lift-top", PASS),
        ("The record table: LPs", f"two bins {r1(g.KALLAX['inner'])} square × {r1(g.KALLAX['d'])} deep", ref("kallax", "media", "crate"),
         f"an LP {r1(Rt['lp'])} square in its sleeve", f"{r1(g.KALLAX['inner'] - Rt['lp'])} to spare across, {r1(Rt['over_lp'])} under the lid; about {Rt['per_bin']} a bin, {Rt['lps']} in all", TIGHT),
        ("The record table: castors", f"four 50 mm, {r1(4 * 50.0)} kg together", ref("castor50"), f"loaded about {Rt['kg']} kg",
         "the ply base carries the records, not the KALLAX's shelves", PASS),
        ("The lift-top coffee table (an option)", f"{r1(g.LIFT_COFFEE['w'])} × {r1(g.LIFT_COFFEE['d'])} × {r1(g.LIFT_COFFEE['h'])}", ref("homelife"),
         "your coffee table's 90 × 50", "the same footprint; 6 taller, and the top lifts to 53.5", PASS),
        ("The shelf over the door", f"{r1(Ds['x'][1] - Ds['x'][0])} × {r1(Ds['d'])}, from {r1(Ds['y'])}", ref("kuggis", "room"),
         f"the door's 198 and a {r1(g.ARCHITRAVE)} architrave", f"{r1(Ds['head'])} over two {r1(g.KUGGIS[2])}-high boxes; check your architrave", CHECK),
        ("Boxes on your black shelf", f"two {r1(g.KUGGIS[0])} × {r1(g.KUGGIS[1])} × {r1(g.KUGGIS[2])}", ref("kuggis"), "the shelf 25 deep, the laser in the middle",
         "1 over the shelf's front; either side of the laser", TIGHT),
    ])


_zones_v35 = zones


def zones():
    """v36: and the storage and bar options after the bar's first two ways."""
    out = []
    for z in _zones_v35():
        out.append(z)
        if z[0].startswith("A bar for drinks"):
            out.append(storage_zone())
    return out


def counts():
    """v36: suggestions (the bars, the storage options) stay out of the totals."""
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for title, _, rows in zones():
        if title == "How many can sit down" or title.startswith(("The more compact version", "A bar for drinks", "Storage and a bar")):
            continue
        for r in rows:
            c[r[-1]] += 1
    return c


# ---------------------------------------------------------------- v37: the bar built in beside the cabinet, shoe storage, the window corner, more storage
SOURCES["shelfgap"] = ("Client, 22 Oct 2026: \"The shelf on the wall alongside the stairs must always end 10cm short of the right-hand wall, "
                       "regardless of any other sizing or positioning logic. It should never touch the right wall ... it reflects how the shelf is "
                       "actually installed\" (facing the stairs wall, the right-hand wall at the shelf's height is the pipe boxing's side)")
SOURCES["worktop"] = ("Homebuilding & Renovating: the UK's usual worktop height is 900 mm to the top (homebuilding.co.uk/advice/kitchen-worktop-height); "
                      "a raised bar counter 1000 to 1200")
SOURCES["photo23stairs"] = ("Your photo of the stairs (23 Oct 2026, inputs/photo_stairs_banister_23oct.jpg): a square newel post at the foot, two flat "
                            "slats raking up from it to the wall by the door, no spindles; a low white wall with a capping under them")
ORDER.append("photo23stairs")
SOURCES["persillade"] = ("IKEA UK: PERSILLADE plant pot, 12 cm, £3 (003.157.26); the range runs to 24 cm (ikea.com/gb)")
ORDER.append("persillade")
SOURCES["elhoinsert"] = ("elho: self-watering insert, 15 cm across, 12 cm high, holds 1.2 litres, for a 16–17 cm pot, £6.99 (elho.com)")
ORDER.append("elhoinsert")
SOURCES["snakeplant"] = ("Boma Garden Centre: Sansevieria trifasciata 'Laurentii', 12 cm pot, £14.99; Gardening Express: variegated snake plant, "
                         "12 cm pot, 30–50 cm tall, £8.99 on offer")
ORDER.append("snakeplant")
SOURCES["fbcover"] = ("Farrow & Ball: Estate Emulsion covers up to 14 m² a litre a coat (70 m² per 5 L), two coats recommended "
                      "(farrow-ball.com paint calculator; DIY.ie listing, 35 m² per 2.5 L)")
ORDER.append("fbcover")
SOURCES["enhet"] = ("IKEA: ENHET wall frame with shelves, 40 × 15 × 75 cm, anthracite or white, steel, two shelves, 3 kg a shelf, to be "
                    "anchored to the wall; about 32–39 € (ikea.com/th 404.816.05; islas.ikea.es 304.489.37)")
ORDER.append("enhet")
SOURCES["valspar"] = ("B&Q: paint mixing, any colour mixed in Valspar (diy.com/services/paint-mixing); Valspar UK colour match "
                      "(valsparpaint.co.uk/colour-tools/colour-match); Valspar V700 Premium Blend Walls & Ceilings, 2.5 L, about £28–29 mixed "
                      "(SheerLuxe; B&Q full price as listed), a 2.5 L tin covers up to 35 m² a coat (valsparpaint.co.uk ready-mix paint)")
ORDER.append("valspar")
_GLASSRAIL_V37 = ("Dan Murphy's: Bev-Equip single-row glass hanger, chrome, 400 mm long, a 110 × 15 mm mount plate, 36 mm high, about four "
                        "or five wine glasses (danmurphys.com.au, BEVCH-400)")
SOURCES["wineglass"] = ("Stemmed wine glasses, makers' sizes: Rosendahl Grand Cru red 20.5 and 22.2 tall; CB2 Joplin 22.9; most 20 to 23 "
                        "(culinaris.de, cb2.ca, dimensions.com)")
SOURCES["trones"] = ("IKEA UK: TRONES shoe cabinet/storage, white, 52 × 18 × 39 cm, a pack of two £25, about four pairs each; must be fixed to "
                     "the wall (ikea.com/gb, 003.973.07)")
SOURCES["eket"] = ("IKEA: EKET wall cabinet with glass door, 35 × 35 × 35 cm, a suspension rail included, at least 5 cm to the ceiling; "
                   "about 38 € (ikea.com/lv, ikea.com/cz)")
SOURCES["floatshelf"] = ("B&Q: Shelf Depot oak floating shelf, L 900 × D 230 mm, a concealed steel bracket included (diy.com, 5060042781980); "
                         "Wickes floating shelf brackets for solid walls")
SOURCES["seat"] = ("Window seats: a seat 17 to 19 in (43 to 48 cm) high and at least 16 in (41 cm) deep, 18 to 22 in better "
                   "(hunker.com, askthebuilder.com); a lift-up lid stores the most")
SOURCES["shoebench"] = ("notonthehighstreet (Momentum): open-compartments shoe bench, 104 × 30 × 48 cm, a padded seat, 200 kg on the seat")
SOURCES["wardrobe"] = ("FCI London: built-in wardrobes need 60 cm for a hanging rail (under 60, no standard rail); sliding doors 66 plus about "
                       "5 for the track (fcilondon.co.uk/blog/how-deep-should-built-in-wardrobes-be)")
SOURCES["overdoor"] = ("Linen Chest: metal over-door hanger, six hooks, 49 × 11 × 14 cm; UK-door racks fit doors 2.5 to 4.5 cm thick "
                       "(linenchest.com; RISEMART, latestdeals.co.uk)")
SOURCES["stepdrawers"] = ("The Day: building drawers into a staircase, the usable size set by the stringers and the treads; UK Workshop: each tread "
                          "needs support once its riser is cut (theday.com/?p=192887; ukworkshop.co.uk/threads/understair-storage.151071)")
SOURCES["capspec"] = ("SanMar: a structured six-panel cap's spec sheet, bill (visor) 2¾ in (7 cm), crown 6¾ in measured over the top "
                      "(sanmar.com, 72788); the client's photo of their cap, 22 Oct 2026 (green crown, brown brim, gold embroidery)")
ORDER.extend(["shelfgap", "worktop", "wineglass", "trones", "eket", "floatshelf", "seat", "shoebench", "wardrobe", "overdoor", "stepdrawers", "capspec"])


def more_storage_zone():
    """v37: the bar built in beside the cabinet, the shoe cabinets, the window corner's three, the alcove shelves, the wall cabinets, the step
    drawers and the over-door rail (suggestions: out of the counts)."""
    g = G
    B, C, ws, hb, wd, al, wc, sd, od = g.BAR_BUILT, g.CORNER, g.WINDOW_SEAT, g.HALL_BENCH, g.WARDROBE, g.ALCOVE_SHELVES, g.WALL_CABS, g.STAIR_DRAWERS, g.OVERDOOR
    return ("More storage, and a bar built in (suggestions)", "beside the cabinet, the window corner, the walls, the steps, the door", [
        ("D, the built-in bar: its slot", f"{r1(B['w'])} wide, scribed", ref("room"), f"the cabinet's end z {r1(g.CAB['z'][1])} to the boxing {r1(g.PIPE_BOX['z'][1])}",
         "fixed to the wall and the floor, the boxing and the cabinet's end", PASS),
        ("D: its depth", f"the counter {r1(B['front'])} off the wall", ref("room"), f"the open table door lies back {r1(g.CAB['d'])} off it",
         f"{r1(B['door_clear'])} behind the door; {r1(B['covered'])} of the bar is behind it while you eat", TIGHT),
        ("D: the counter", f"top at {r1(B['counter'])}", ref("worktop"), "a usual worktop, 90", "standing height to pour at", PASS),
        ("D: bottles", f"{B['bottles']}: {B['across']} across, {B['rows']} deep, two shelves", ref("bottles"), f"inside {r1(B['inner_w'])} × {r1(B['inner_d'])}; 70 cl up to {r1(g.DRINKS_BOTTLE[0])} × {r1(g.DRINKS_BOTTLE[1])}",
         f"two deep need {r1(2 * g.DRINKS_BOTTLE[1])} of the {r1(B['inner_d'])}", TIGHT),
        ("D: the ENHET frame over the counter", f"{r1(g.ENHET[0])} × {r1(g.ENHET[1])} × {r1(g.ENHET[2])}, from {r1(B['enhet_y0'])}", ref("enhet"),
         f"the bar {r1(B['w'])} wide; your black shelf's underside at {r1(g.SHELF_B['top'] - g.SHELF_B['t'])}",
         f"{r1((B['w'] - g.ENHET[0]) / 2)} each side; {r1(B['enhet_gap'])} over the counter to work; {r1(B['enhet_head'])} under the shelf", PASS),
        ("D: glasses on its shelves", f"a tall glass {r1(g.BAR_GLASS_H)}", ref("wineglass", "enhet"), f"{r1(g.ENHET[2] / 3)} between its shelves, 3 kg each",
         "three glasses a shelf, or bottles to 22", PASS),
        ("D and your hanging plant (v38)", "its strands fall through the shelf's 10 cm gap", ref("shelfgap", "photo20"), f"the bar ends at the shelf's end, z {r1(B['z'][1])}",
         "the gap stays clear to the floor for them; the table door's swing stays 12 clear of them", PASS),
        ("Shoe cabinets beside the cabinet", f"two {r1(g.TRONES[0])} × {r1(g.TRONES[1])} × {r1(g.TRONES[2])}", ref("trones"), f"the {r1(g.BESIDE['len'])} slot, the door's line at {r1(g.CAB['d'])}",
         f"{r1(g.BESIDE['len'] - g.TRONES[0])} to spare along it, {r1(g.CAB['d'] - g.TRONES[1])} behind the door", PASS),
        ("The window corner", f"{r1(C['w'])} wide", ref("room"), f"the curtains' stack (x {r1(C['x'][0])}) to the table door's line (x {r1(C['x'][1])})",
         f"{r1(C['free'])} out from the window wall to the seated chairs' backs", PASS),
        ("The window seat", f"{r1(ws['x'][1] - ws['x'][0])} × {r1(ws['d'])} × {r1(ws['h'])} with its cushion", ref("seat"), "43 to 48 high, at least 41 deep",
         f"inside {r1(ws['inside'][0])} × {r1(ws['inside'][1])} × {r1(ws['inside'][2])}: your five blankets fit", PASS),
        ("The bench with cubbies", f"{r1(hb['w'])} × {r1(hb['d'])} × {r1(hb['h'])}", ref("shoebench"), f"the corner's {r1(C['w'])}",
         f"{r1((C['w'] - hb['w']) / 2)} to spare each side", TIGHT),
        ("The built-in cupboard", f"{r1(wd['x'][1] - wd['x'][0])} × {r1(wd['d'])}, to the ceiling", ref("wardrobe"), "60 for a hanging rail; sliding doors need 71",
         f"hinged doors; {r1(wd['behind_chairs'])} to the seated chairs' backs, so open it with the table folded", TIGHT),
        ("The alcove shelves", f"two {r1(al['w'])} × {r1(al['d'])} at {r1(al['tops'][0])} and {r1(al['tops'][1])}", ref("floatshelf", "solidwall"), f"the plant stand's top {r1(g.PLANT_STAND['h'])}",
         f"{r1(al['over_stand'])} over it; into the solid wall", PASS),
        ("The wall cabinets", f"two {r1(g.EKET[0])} cubes, {r1(wc['y0'])} to {r1(wc['y0'] + g.EKET[2])}", ref("eket"), f"the ceiling at {r1(g.CEIL)}; EKET asks for 5 over it",
         f"{r1(wc['head'])} over them; past the PC shelf's end (z {r1(g.PC_SHELF_Z[1])}) by 4", PASS),
        ("The step drawers", f"three, fronts {r1(sd['w'])} × {r1(sd['h'])}, {r1(sd['depth'])} deep", ref("stepdrawers"), f"a riser {r1(g.STAIR_RISE)} under a 2.2 tread, the stairs {r1(g.STAIR_X[1] - g.STAIR_X[0])} wide",
         "each tread needs a bearer under it once its riser comes out: a joiner's job, or build them into the new stairs", CHECK),
        ("The hook rail over the door", f"{r1(od['w'])} × {r1(od['d'])} × {r1(od['h'])}", ref("overdoor"), f"the open door stands {r1(od['open_gap'])} off the breast's side",
         f"slim things only on the room side ({r1(od['open_gap'] - od['d'])} left), or hang it on the hall side", TIGHT),
    ])


def shelf_zone():
    """v37: your black shelf on the stairs wall, a fixed 10 short of the pipe boxing (the client's hard rule), and what stands on it."""
    g = G
    sb = g.SHELF_B
    return ("Your black shelf on the stairs wall (v37: a fixed 10 cm gap)", f"2 m, {r1(sb['d'])} deep, its top at {r1(sb['top'])}, over the dining cabinet", [
        ("Its window end and the pipe boxing", f"z {r1(sb['z'][1])}", ref("shelfgap", "photo20"), f"the boxing's side at z {r1(g.PIPE_BOX['z'][1])}, {r1(g.PIPE_BOX['x'][1] - g.PIPE_BOX['x'][0])} out",
         f"{r1(sb['z'][1] - g.PIPE_BOX['z'][1])} short of it, always: geometry.py and the 3D room both pin it there", PASS),
        ("Its stairs end", f"z {r1(sb['z'][0])}, 2 m back from the gap", ref("shelfgap", "photo20"), "an earlier look at your photo put it about 41 past the stair box",
         f"{r1(g.STAIRS_WALL_Z[0] - sb['z'][0])} past it: if you measure 41 there, the shelf is about {r1(200 - (41 - (g.STAIRS_WALL_Z[0] - sb['z'][0])))} long; the gap stays 10", CHECK),
        ("Over the dining cabinet", f"its underside at {r1(sb['top'] - sb['t'])}", ref("room"), f"the cabinet {r1(g.CAB['h'])} tall, z {r1(g.CAB['z'][0])} to {r1(g.CAB['z'][1])}",
         f"{r1(sb['top'] - sb['t'] - g.CAB['h'])} over it; the cabinet stays where it was (the shelf moved 8 towards the stairs)", PASS),
        ("Your hanging plant at its window end", f"z {r1(g.PLANT_B['z'])}", ref("photo20"), "the shelf's end, 10 off the boxing", "9 in from the end, as in your photo", PASS),
    ])


_zones_v36 = zones


def zones():
    """v37: your black shelf's 10 gap after the compact cabinet; the bar built in beside the cabinet and more storage after the v36 options."""
    out = []
    for z in _zones_v36():
        out.append(z)
        if z[0].startswith("The compact dining cabinet"):
            out.append(shelf_zone())
        if z[0].startswith("Storage and a bar"):
            out.append(more_storage_zone())
    return out


def counts():
    """v37: suggestions stay out of the totals (the new zone too)."""
    c = {PASS: 0, TIGHT: 0, CHECK: 0, NO: 0}
    for title, _, rows in zones():
        if title == "How many can sit down" or title.startswith(("The more compact version", "A bar for drinks", "Storage and a bar", "More storage, and a bar")):
            continue
        for r in rows:
            c[r[-1]] += 1
    return c




# ---------------------------------------------------------------- v38: the client's picks (geometry.FIRM) are the plan: their rows counted
FIRM_ROWS = ("Blankets: the tall basket", "Blankets: the basket's corner", "The record table", "The shelf over the door",
             "Boxes on your black shelf", "D", "The alcove shelves", "The wall cabinets", "The step drawers")
_zones_v37 = zones


def zones():
    """v38: the picks' rows leave the suggestion tables for a counted "Your picks" table, after the compact cabinet's."""
    out, firm = [], []
    for title, space, rows in _zones_v37():
        if title.startswith(("Storage and a bar", "More storage, and a bar")):
            keep = [r for r in rows if not r[0].startswith(FIRM_ROWS)]
            firm += [r for r in rows if r[0].startswith(FIRM_ROWS)]
            if keep:
                out.append((title, space, keep))
        else:
            out.append((title, space, rows))
    i = next(i for i, z in enumerate(out) if z[0].startswith("Your black shelf")) + 1
    out.insert(i, ("Your picks (in the plan)", "the bar beside the cabinet, the wall storage, the step drawers, the basket, the record table", firm))
    return out



def measure_html():
    """v38: the measuring sheet: every CHECK in the plan's tables on one page, what we drew, and a box to write yours in."""
    rows = [(t, item, sp, spare) for t, _s, rs in firm_zones() for item, _size, _src, sp, spare, st in rs if st == CHECK]   # v41: the plan's own checks
    trs = "".join(f"<tr><td>{item}<br><span class='note'>{t}</span></td><td>{sp}</td><td>{spare}</td><td class='box'></td></tr>" for t, item, sp, spare in rows)
    return (f"<h3>Measuring sheet: {len(rows)} things to check before you buy</h3><p>One session with a tape: measure each, write it in, "
            "send us the page.</p><table class='fit measure'><tr><th>What</th><th>We drew</th><th>Why it matters</th><th>Yours (cm)</th></tr>"
            + trs + "</table>")


# v38: safety, where it matters (the build guide and the plan's build section)
SAFETY = [
    ("Wall cabinets, shoe cabinets, the bar and the media wall", "fix each to the wall with the anti-tip fittings for a solid wall; IKEA's own listings say they must be anchored"),
    ("Drilling", "check for pipes and cables with a detector before every hole; the side wall carries the PC's leads"),
    ("The step drawers", "a bearer under each tread once its riser is cut out: a joiner's job, or build them into the new stairs"),
    ("An old textured (Artex) ceiling", "if it's older than about 2000, have it tested for asbestos before sanding, drilling or skimming it"),
    ("Mains electrics", "the sockets and the light fittings: done to Part P, or by an electrician"),
    ("The dining table", "never swing it up or down with anything on it; check all four legs have clicked before you load it"),
    ("The record table", "about 65 kg with its LPs: roll it, don't lift it, and fit both lid stays so the lid can't drop"),
]


def safety_html():
    return "<h3>Safety</h3><ul>" + "".join(f"<li><b>{w}:</b> {t}.</li>" for w, t in SAFETY) + "</ul>"


if __name__ == "__main__":
    for title, space, rows in zones():
        print("==", title, "|", space)
        for r in rows:
            print("  ", r[0], "|", r[1], "|", r[3], "|", r[4], "|", r[5])
    print(counts())


# v38 (item 12): the ceiling designs to try, for later (an option: Look → The ceiling)
SOURCES["skimartex"] = ("Trade2Base, Plastering Costs UK 2026: skim coat £150–£350 a room, Artex removal (or skimming over it) £300–£700 a room, "
                        "plasterers' day rates about £180–£300 (trade2base.com/blog/plastering-costs-uk)")
SOURCES["artextest"] = ("Supernova Asbestos Surveys: Artex asbestos testing kit, £34.99 with PPE, a UK-accredited lab's result in 48 hours; Artex made "
                        "before about 1985 can hold chrysotile, so don't sand, scrape or drill it until you know (asbestos-surveys.org.uk/shop/testing-kit/artex)")
SOURCES["pubeam"] = ("Woodmosaic: PU faux wood ceiling beam, 12 × 12 cm, lengths 100, 195, 295 and 395 cm, 1–4 kg, £62–£349 by length "
                     "(woodmosaic.co.uk/pu-faux-wood-beam-fake-wooden-decorative-ceiling-beams-false)")
SOURCES["orac"] = ("Mr Resistor: Orac C357 uplighting coving profile for LED tape, 2000 mm, £89.60 (mr-resistor.co.uk/product/28207); "
                   "fitted LED coving in a typical UK room £350–£700 (coving.online, LED coving cost, 2026)")
ORDER.extend(["skimartex", "artextest", "pubeam", "orac"])


# ---------------------------------------------------------------- v39: the plan's fit proof is the firm plan's (options: one line each, section 12)
OPTION_ZONES = ("The more compact version", "Beside the compact cabinet", "A bar for drinks", "Storage and a bar", "More storage, and a bar")


def _strand_clear():            # v41: how far the hanging plant's strands are from the table door's swing (clash.py's numbers)
    import clash, math
    (_, (hx, hz), rad, _y) = clash.door_sweeps()[0]
    xs, zs = clash.strands_x(), clash.strands_z()
    near = min(math.hypot(x - hx, z - hz) for x in xs for z in zs)
    return near - rad


def firm_zones():
    return [z for z in zones() if not z[0].startswith(OPTION_ZONES)]


def tables_html():
    out = []
    for title, space, rows in firm_zones():
        out.append(f"<div class='zonebox'><h4>{title}</h4><p class='zone'>{space}</p>")
        out.append("<table class='fit'><tr><th>Item</th><th>Size (cm)</th><th>Space</th><th>Spare (cm)</th><th>Result</th></tr>")
        for item, size, src, sp, spare, st in rows:
            out.append(f"<tr><td>{item}</td><td>{size}{src}</td><td>{sp}</td><td>{spare}</td><td class='res {status_class(st)}'>{st}</td></tr>")
        out.append("</table></div>")
    return "\n".join(out)


def summary_html():
    """v42 (the plan PDF, "more concise"): one row per zone, with what's tight and what to check; the full proof is on the page."""
    out = ["<table class='tight fitsum'><tr><th>Where</th><th class='num'>Fit</th><th class='num'>Tight</th><th class='num'>Check</th><th>Tight or to check</th></tr>"]
    for title, _space, rows in firm_zones():
        k = {s: sum(1 for r in rows if r[5] == s) for s in (PASS, TIGHT, CHECK)}
        odd = "; ".join(f"{r[0]} ({'check' if r[5] == CHECK else 'tight'})" for r in rows if r[5] in (TIGHT, CHECK))
        out.append(f"<tr><td>{title}</td><td class='num'>{k[PASS]}</td><td class='num'>{k[TIGHT]}</td><td class='num'>{k[CHECK]}</td><td class='note'>{odd or '—'}</td></tr>")
    out.append("</table>")
    return "".join(out)


# ---------------------------------------------------------------- v43: the C-table at the sofa's open end, in the plan
SOURCES["plazcutz"] = ("PlazCutz (UK): 400 mm × 200 mm × 6 mm mild steel plate, S275, £3.57 incl. VAT "
                       "(plazcutz.com/store/400mm-x-200mm-x-6mm-Mild-Steel-Plate-S275-p860680992); 6 mm steel weighs 47 kg/m², so 3.77 kg")
SOURCES["oakdensity"] = "The Wood Database: European oak (Quercus robur), average dried weight 710 kg/m³ (wood-database.com/english-oak)"
SOURCES["ctablebuy"] = ("Bought C-tables, compared: a C-shaped side table 48 × 61 × 30 cm, £25.99 (pricespy.co.uk/s/c-shape-table); GVAwood's "
                        "oak C-shaped side table 50 × 30 × 65 cm (gvawood.com). Both steady themselves with a foot that slides under the sofa")
ORDER.extend(["plazcutz", "oakdensity", "ctablebuy"])
SOURCES["spiderglow"] = ("Spider Farmer UK: GlowBar 1FT full-spectrum LED grow light strips, 4 pack, linkable, 30 cm long, £44.99 "
                         "(spiderfarmer.co.uk/products/1ft-full-spectrum-led-grow-light-strips-for-indoor-plants)")
SOURCES["switchbotc3"] = ("SwitchBot UK: Curtain 3 Rod Type 1, 84 × 73 × 205 mm, 572 g, for 10–40 mm rods and curtains up to 15 kg, "
                          "£99.99 (£80.00 on offer) (uk.switch-bot.com/products/switchbot-curtain-3-rod-type-1)")
SOURCES["mosslanda"] = ("IKEA UK: MOSSLANDA picture ledge, oak effect, 55 cm: length 55, depth 12, max. load 5 kg, £6 (115 cm £7 more) "
                        "(ikea.com/gb, 805.898.35)")
SOURCES["habitatmush"] = ("Habitat (Argos): Rechargeable Mushroom LED Table Lamp, taupe: overall H31 × W14 cm, shade H7 × D14, base 9 across, "
                          "£20 (habitat.co.uk/product/7275773)")
ORDER.extend(["spiderglow", "switchbotc3", "mosslanda", "habitatmush"])
SOURCES["ceiltrack"] = ("B&Q: White Hidden Ceiling Fix Aluminium Curtain Hanging Track 90cm: 900 mm, 35 mm wide, 21 mm deep with the "
                        "gliders, gliders and end covers included, £21.44 (diy.com, 5056388368183)")
SOURCES["ohspencil"] = ("B&Q (OHS): Pencil Pleat Blackout Curtains, thermal, tape top, 66\" × 90\": each panel 168 × 229 cm, a pair, "
                        "£22.99; charcoal, silver grey, beige (diy.com, 5027434112784)")
ORDER.extend(["ceiltrack", "ohspencil"])                                                  # v78: the stair curtain (an option)
_zones_v42 = zones


def ctable_zone():
    import ideas as I
    T, P, B = I.CTABLE, I.ctable_parts(), G.BLANKET_BASKET
    under, tip = T["top"] - T["t"], I.ctable_tip_kg()
    rows = [
        ("The C-table's top over the seat", f"underside at {r1(under)}", ref("sofa"), f"the seat cushion's top at {r1(T['seat_top'])}", r1(under - T["seat_top"]), PASS),
        ("Its reach over the seat", f"{r1(T['over'])} in from the sofa's end", ref("sofa"), "the return's seat, 95 deep", r1(95 - T["over"]), PASS),
        ("Its foot and the blanket basket", f"x {r1(T['x'][0])}–{r1(T['x'][1])}", ref("lakelyn"), f"the basket to x {r1(B['x'][1])}", r1(T["x"][0] - B["x"][1]), PASS),
        ("The steel plate under the foot", f"{r1(P['plate'][0])} × {r1(P['plate'][1])} × {r1(P['plate'][2])}", ref("plazcutz"), f"the foot {r1(P['foot'][0])} × {r1(P['foot'][1])}", r1(P["foot"][1] - P["plate"][1]), PASS),
        ("What it holds on its far edge", f"{tip} kg before it tips", ref("plazcutz", "oakdensity"), "a mug, a pad or a laptop: under 3 kg", r1(tip - 3), PASS),
    ]
    return ("The C-table at the sofa's open end (in the plan)", "x 40–85, 12 over the seat; its foot stands beside the sofa", rows)


def zones():
    out = _zones_v42()
    i = next((i for i, z in enumerate(out) if z[0].startswith("Your picks")), len(out) - 1) + 1
    out.insert(i, ctable_zone())
    return out
