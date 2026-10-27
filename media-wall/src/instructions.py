"""The full build instructions (v13.5): for each step of the order of work, what you need (parts, hardware, tools), the
drawings to have open, and every instruction in order, grouped by sub-assembly. Sizes are finished sizes in cm and come
from geometry.py, the fit proof and the cutting list (build_doc.cuts), so the instructions move when the plan does.
build_doc.steps() merges these in: the PDF prints them after the order-of-work table, and the plan page shows them in
each step's card."""
import geometry as G
import ideas
CT = ideas.ctable_parts()   # v44: the C-table's parts


def n(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def full():
    g = G
    up_h = lambda y: n(y - g.WORKTOP)                       # a height on the wall, measured up an upright from its foot
    tenon = (g.RZ_SHELF_TOP - g.RZ_SHELF_T + (g.RZ_SHELF_T - 2.4) / 2, g.RZ_SHELF_TOP - (g.RZ_SHELF_T - 2.4) / 2)
    # v27: the dining table's sizes (geometry.OPTC; the same table in v30's compact cabinet), for step 11
    C = g.OPTC
    tw, tl, tt = C["top"]
    ap = C["apron"]
    sub_col_w = g.SUB_COL[1] - g.SUB_COL[0]
    ps_w = g.PS_COL[1] - g.PS_COL[0]
    breast_l = lambda x: n(x - g.BREAST_X[0])               # a position on the breast, from its alcove-side corner
    # v30: the compact cabinet (geometry.CAB): two boxes, hinged doors; the table, its aprons, legs and joint are the sliding one's
    K = g.CAB
    k_back = K["h"] - K["t_top"] - K["plinth"]                          # each back, between its box's floor and top
    k_sep = K["door_t"][1] - K["door_c"][0] - K["hinge_gap"]            # a point on one open door lands this much nearer the other's hinge
    mag_t = 40.0                                                         # the table door's first steel cup, from its hinge edge
    mag_c = mag_t - k_sep                                                # the chair door's magnet: where that cup lands
    mag_t2 = mag_c - k_sep                                               # where the magnet lands on the table door when the chair door's open
    return {
        1: dict(
            tools=["Tape measure", "Spirit level, 120 cm", "A notebook"],
            draw=[]),
        2: dict(
            parts=["Two TP-Link TL-SG108 8-port switches", "Cat6 patch leads, 0.5–2 m (11)"],
            tools=["A phone with the Deco app", "A laptop for the hub's settings page"],
            draw=["network"]),
        3: dict(
            parts=["Cat6 solid pure copper (not CCA), 2–4 runs", "RJ45 keystones and two surface boxes, or RJ45 plugs",
                   "A double socket in the same finish, and a deeper back box if the old one is shallow",
                   "Conduit: 38 mm and 25 mm oval, about 4 m each, two draw wires", "A 5 m C13 lead with a rewireable 13 A plug, for the PC", "One-coat filler"],
            hardware=["Cable clips for the Cat6 in the loft space or under the boards", "Brown wall plugs and 4 × 30 screws for the conduit clips"],
            tools=["Two-pole voltage tester (GS38) and its proving unit", "MCB lock-off and padlock", "Plug-in socket tester", "Insulated screwdrivers, wire strippers, side cutters",
                   "Cat6 punch-down tool (or crimper) and a cable tester", "Draw rods", "Wall chaser with dust extraction, or a bolster and club hammer",
                   "Cable and pipe detector", "SDS drill", "Safety glasses, ear defenders, FFP2 masks", "A helper"],
            draw=["power", "routes"],
            parts_full=[
                ("Before you start: the stop list", [
                    "Stop and call an electrician if: the tester shows anything live after you've isolated; the wiring is old (rubber or fabric sheath, or red and black with no earth); there are more wires than you can match to your photo; there are scorch marks or the old socket is loose or hot; the consumer unit has rewireable fuses or no RCD; or the job grows into a new circuit.",
                    "Nothing in this step is notifiable in England: the socket is a like-for-like swap on an existing circuit, outside a bathroom. It must still be done to the wiring regulations, which is what this routine is for.",
                ]),
                ("The Cat6 runs (low voltage: no isolation needed)", [
                    "Measure each route on the house plan and add 2–3 m: bedroom 3, across the landing, down through the airing cupboard.",
                    "Lift a floorboard in the airing cupboard. Drill a 20 mm hole through the plate below (detector first), and feed a draw rod down to the alcove's right corner. Tape both Cat6 cables and a spare to it and pull them through. Pull the kitchen run on down the same way, past the right upright's groove.",
                    "Keep the Cat6 away from mains: cross at right angles, never run alongside in the same hole. Clip it every 30 cm; never staple through it or kink it.",
                    "Punch each end down onto a keystone in a surface box (or crimp a plug), to the T568B colours on both ends. Label both ends.",
                    "Test each run with the cable tester: all eight lights in order. Re-terminate any that don't.",
                ]),
                ("Isolate the socket circuit", [
                    "Tell everyone in the house you're working on the electrics.",
                    "At the consumer unit, switch off the breaker for the side-wall socket's circuit (usually a ring marked \"sockets\"). If the labels aren't clear, switch off the main switch instead.",
                    "Fit the MCB lock-off and padlock to that breaker, keep the key in your pocket, and tape a note on the board: \"Working on this circuit, do not switch on\".",
                    "Prove your voltage tester on its proving unit: it must light.",
                    "At the socket, with it pulled forward on its cables, test between every pair: live and neutral, live and earth, neutral and earth. No reading on any of them.",
                    "Prove the tester on the proving unit again. Only now is it safe to touch.",
                ]),
                ("Swap the single socket for a double", [
                    "Unscrew the old socket and ease it out. Photograph the wiring before you undo anything.",
                    "Check the stop list against what you see: an earth (green-and-yellow) wire present and sleeved, no scorching, the cable sheath into the box.",
                    "If the double needs a bigger box, chop the plaster out round the old box to the new box's outline and fit the new box with plugs and screws, the cables through its grommets.",
                    "Connect wire for wire: brown (or red) to L, blue (or black) to N, green-and-yellow to the earth terminal. Two cables in the old box go into the same terminals together. Strip only enough so no copper shows outside a terminal, and tighten every screw firmly.",
                    "Fold the cables in neatly without trapping them, and screw the socket on level.",
                    "Remove the lock-off, switch on, and plug the socket tester into each outlet: it should show correct wiring on both.",
                ]),
                ("The PC's two conduits in the side wall", [
                    "Mark the route from behind the PC shelf's back corner straight down to skirting height, then along behind the skirting to the base's plinth. Run the detector along it: move it if anything shows. Never chase near the socket's cables, which run straight up, down or across from it.",
                    "Chase two channels side by side, 5 cm apart: one for the 38 mm oval conduit (data: HDMI and Cat6), one for the 25 mm (the PC's mains lead). Vertical only on the wall, no deeper than the conduit needs. Wear the mask: the dust is silica.",
                    "Take the skirting off along the route, fix both conduits with a draw wire inside each, and refit the skirting over them.",
                    "Fill the chase with one-coat filler, sand flush, and photograph the route with a tape measure in the shot before you paint.",
                ]),
                ("Finish", [
                    "Mark every route on the plan, and keep the photos with it.",
                ]),
            ]),
        4: dict(
            parts=["Card Room Green emulsion and eggshell, primer and undercoat", "Sugar soap, sanding pads, woodwork primer"],
            tools=["Roller, tray and extension pole", "25 and 50 mm brushes", "Dust sheets, masking tape", "Step ladder"],
            draw=[]),
        5: dict(
            tools=["Cross-line laser level", "Tape measure", "Pencil and masking tape", "Cable and pipe detector", "Spirit level, 120 cm"],
            draw=["front"],
            parts_full=[
                ("Set up a datum", [
                    "Find the floor's highest point across the alcove (you measured its level in step 1). Every height in this plan is measured from there.",
                    "Stand the laser in the middle of the room, level it, and mark a line at exactly 100 cm above that high point on the alcove's back wall, both side walls and the chimney breast.",
                    "Measure every other height up or down from the 100 line, not up from the floor: the floor is the thing that isn't level.",
                ]),
                ("The alcove's heights", [
                    "Put a strip of masking tape down each side wall and the back wall of the alcove and mark these heights on it:",
                    f"{n(g.CARCASS_TOP)}: the tops of the frames and bay 3 (the worktop's underside).",
                    f"{n(g.WORKTOP)}: the worktop's top.",
                    f"{n(g.RZ_SHELF_TOP - g.RZ_SHELF_T)} and {n(g.RZ_SHELF_TOP)}: the Series X shelf, underside and top.",
                    f"{n(g.LEDGE_UNDER)} and {n(g.LEDGE_TOP)}: the record ledge and the wrap ledge, underside and top.",
                    f"{n(g.HIGH_UNDER)} and {n(g.HIGH_TOP)}: the high shelf, underside and top.",
                    f"Carry the {n(g.LEDGE_UNDER)} and {n(g.LEDGE_TOP)} lines along the side wall to {n(g.ALC_D - g.PC_SHELF_Z[1])} cm out from the alcove's back wall, for the wrap ledge and the PC shelf.",
                ]),
                ("Across the back wall", [
                    f"Mark the uprights' positions from the side wall: the left one {n(g.UP_L[0])}–{n(g.UP_L[1])}, the right one {n(g.UP_R[0])}–{n(g.UP_R[1])}. Turn the laser to its vertical line and draw both lines from the worktop line to the ceiling.",
                    f"Mark the base from the side wall along the floor: filler 0–{n(g.FILLER)}, then " + ", ".join(f"{nm} {n(a)}–{n(b)}" for (a, b), nm in sorted(zip(g.BAYS, ["bay 1", "bay 2", "bay 3"]))) + f", filler to {n(g.ALC_W)}.",
                ]),
                ("On the chimney breast", [
                    f"Find the breast's centre: {n(g.BREAST_W / 2)} cm from its alcove-side corner. Draw it plumb from the floor to 170.",
                    f"Mark the “now playing” ledge's top at {n(g.NOW_LEDGE['top'])}, level, and its two concealed brackets 6 cm in from each side of the breast.",
                    "Mark the glass display case's bottom edge at 137 and its top at 222, 90 wide, centred on the line; its oak cleat's top edge at 212. (The dining table isn't here: it's in its cabinet by the stairs, step 11.)",
                ]),
                ("Check for cables", [
                    "Run the detector along every line where you'll drill: the cleats, the spacer blocks, the upright brackets, the ledge's brackets, the PC shelf and, on the stairs wall, the cabinet's two wall brackets.",
                    "Mark anything it finds in red, and compare with your own photos from step 3. Move a fixing 5 cm rather than drill near a cable.",
                ]),
            ]),
        6: dict(
            parts=["Two IKEA BESTÅ frames 60 × 40 × 64", "18 mm birch ply: bay 3 sides 73 × 40 (2), top and bottom 56.4 × 40 (2); plinth rails 120 × 9 (2), cross-pieces 34.4 × 9 (3)",
                   "Four 4 cm spacer blocks (ply offcuts, 4 × 10 × 1.8)", "Anti-tip brackets: two per bay (6)", "Flat two-compartment trunking, about 2 m",
                   "Plastic shims", "Four connector bolts (furniture joint connectors)"],
            hardware=["4 × 40 and 4 × 50 mm wood screws", "5 × 60 mm screws and brown wall plugs", "Wood glue"],
            tools=["Drill-driver with pilot and countersink bits", "SDS drill with a 7 mm masonry bit", "Spirit level, 60 and 120 cm", "Combination square", "Clamps", "Tape measure"],
            draw=["front", "section"],
            parts_full=[
                ("The plinth under bays 1 and 2", [
                    "Lay the two 120 × 9 rails on edge, 38 cm apart outside, and stand the three 34.4 × 9 cross-pieces between them: one at each end and one in the middle, at 60.",
                    "Pre-drill, glue and screw through the rails into each cross-piece end with two 4 × 40 screws.",
                    "Measure both diagonals: when they're equal the frame is square. The plinth is 120 × 38 × 9. The opening between 0 and 60 (the end nearer the side wall) stays clear: it's the hidden drawer's bay, under bay 2.",
                    f"Stand it in the alcove {n(min(g.BAYS[0][0], g.BAYS[1][0]))} cm from the side wall (bay 3 stands on the floor between it and the wall) and {n(g.CHAN)} cm off the back wall. Level it with shims, side to side and front to back.",
                ]),
                ("The BESTÅ frames", [
                    "Assemble both frames to IKEA's instructions, but leave the back panels off: the open backs are how the cables and the sub's port breathe.",
                    "Join the two frames side by side with IKEA's connectors.",
                    "Stand them on the plinth, their backs flush with its back edge, so their fronts sit 2 cm proud of the plinth (the face frame covers the step).",
                ]),
                ("Bay 3, the carcass for the LP crates and the slim column", [
                    "While the sides are flat, mark the runner lines on their inner faces: on the right side 2.3 and 37.0 cm up from the bottom edge, for the two LP crates; on the left side 2.3, 25.1 and 47.9, for the three slim drawers.",
                    "Stand the bottom panel between the two sides, flush with their bottom edges, and the top panel flush with their top edges. Pre-drill, countersink, glue and screw with four 4 × 50 screws a joint.",
                    "Check the diagonals for square. The carcass is 60 × 40 × 73, open at the back.",
                    f"Stand it in its place, {n(g.BAYS[2][0])}–{n(g.BAYS[2][1])} from the side wall, its top level with the frames' tops at {n(g.CARCASS_TOP)}. Shim under it if the floor drops away.",
                    "Clamp it to bay 2 and fit two connector bolts at the front and two at the back.",
                ]),
                ("Fix it to the wall", [
                    f"Screw a 4 cm spacer block to the back wall behind the top of each bay, at {n(g.CARCASS_TOP - 5)} high, with plugs.",
                    "Push the whole base back against the blocks.",
                    "Fit two anti-tip brackets per bay through the blocks into the wall. Do this before anything heavy goes in: a full LP crate pulled out is about 30 kg in front of the unit.",
                    "Lay a level across all three tops: within 1 mm over 186 cm. Shim and re-check.",
                ]),
                ("The cable channel", [
                    "Lay the flat two-compartment trunking on the floor in the 4 cm channel behind the base: mains on the wall side, data on the other.",
                    "Run the leads in now: the two mains leads from the side-wall socket enter through the face frame's notch and run back in the 3 cm filler beside bay 3; the Cat6 and Deco B's lead come down the right-hand corner.",
                    "Keep the channel behind bay 2 empty: the sub's port breathes into it. Switch 2 and the retro 6-way stand on edge behind bay 1.",
                ]),
            ]),
        7: dict(
            parts=["One solid oak worktop, 300 × 62 × 3, full stave", "A 60 mm brush strip and a 35 mm brush grommet"],
            hardware=["4 × 30 mm screws with washers (9)", "Hardwax oil"],
            tools=["Hardboard or cardboard, 190 × 50, for the template", "Compass or a pencil on a block, for scribing", "Track saw or circular saw with a guide",
                   "Jigsaw", "Router with a straight bit", "Random-orbit sander, 120 and 180 grit", "Drill-driver", "A helper"],
            draw=["section"],
            parts_full=[
                ("Make a template", [
                    f"Cut the hardboard to about 190 × 50 and push it into the alcove at worktop height, its back edge against the back wall.",
                    "Set the compass to the widest gap at one end and run it down the side wall, so the pencil copies the wall's line onto the board. Cut to the line. Do the other end the same way.",
                    f"Mark the front edge at {n(g.BASE_D)} cm from the back wall all along. The template is now the worktop's exact shape.",
                ]),
                ("Cut the oak", [
                    "Lay the board best face up, grain running along its length. Lay the template on it and draw round it.",
                    "Cut just outside the line with the track saw, then sand or plane to the line.",
                    "Keep the offcut flat and oiled with the rest: it's spare oak for any repair.",
                    "Chamfer the worktop's top front edge with a 3 mm chamfer, sanded by hand.",
                ]),
                ("Cut the openings", [
                    f"The TV slot: 3 cm wide, from 1 to 4 cm in from the back edge, running {n(g.TV_CX - 40)}–{n(g.TV_CX + 40)} from the side wall. Clamp a batten as a guide and rout it in passes, or drill each end and jigsaw between. Push the brush strip in.",
                    f"The grommet hole behind the deck: 35 mm, its centre 2.5 cm from the back edge and {n((g.DECK_X[0] + g.DECK_X[1]) / 2)} from the side wall.",
                ]),
                ("Finish and fix", [
                    "Sand to 120, then 180. Oil every face: top, underside, both ends and the cut edges of the slot. Two coats, a night between them.",
                    "Two of you lift it in and push it back to the wall. It should touch both side walls along their length.",
                    "Inside each bay, drill three 5 mm holes up through the top panel, elongated front to back to about 12 mm long, so the oak can move with the seasons.",
                    "Screw up through them into the worktop with 4 × 30 screws and washers. They must not come out through the top: check the length against a scrap.",
                ]),
            ]),
        8: dict(
            parts=["Four BESTÅ shelves 56 × 36", "Game drawer: 12 mm ply sides 35 × 15.5 (2), back 51.9 × 15.5, front panel 51.9 × 6; 9 mm base 52.5 × 34.4; 6 mm divider 51.9 × 9, bin walls 12.6 × 9 (2), bin floors 16 × 12.6 (2); oak lip 56.8 × 6.5 × 2; follower blocks",
                   "LP crates (×2): 12 mm base 34.9 × 40; 9 mm sides 40 × 8 and ends 33.1 × 8; oak lip 36.3 × 5 × 1.5; felt",
                   "Slim drawers (×3): 12 mm base 15.3 × 40; 6 mm sides 40 × 10, back and front 14.1 × 10; oak lip 16.5 × 5 × 1.5; a 2 m USB-C lead and a grommet for the top one",
                   "Bay 3's divider: 12 mm ply 69.4 × 38",
                   "Plinth drawer: 12 mm sides 34 × 4.4 and ends 49.6 × 4.4, 6 mm base 52 × 34, oak front 54 × 6 × 2",
                   f"Bay 2: 12 mm divider 35.3 × 38, part shelf {n(ps_w)} × 36, the sub's isolation riser about 22 × 28 × 3",
                   "The oak face frame, 2 cm thick: stiles about 5 wide, rails; 186 × 73 overall"],
            hardware=["Runners: two pairs of 400 mm (68–70 kg) for the LP crates, three pairs of 400 mm light-duty for the slim drawers, one pair of 350 mm soft-close, one pair of 300 mm", "3.5 × 16 mm screws for the runners (every hole)",
                      "Four shelf pins for the part shelf", "Two small steel angle brackets for the divider", "Panel pins, wood glue, felt"],
            tools=["Drill-driver", "Router with a 6 mm straight bit (the game drawer's base groove)", "Combination square", "Spirit level", "Clamps", "Mitre saw or tenon saw"],
            draw=["drawer_layouts", "game_drawer", "drawer", "storage"],
            parts_full=[
                ("The console shelves", [
                    "Bay 1, from the top: rows of 16 (Xbox One), 16 (Xbox 360), then the game drawer's 25.2. Put the shelves on the pin holes nearest those heights.",
                    "Bay 2: the PS3's row of 23.7 at the top, on a full-width shelf. Below it, the PS2 and the PS1 sit beside the sub (next part).",
                ]),
                ("Bay 2's sub column", [
                    f"Stand the 12 mm divider on the bay's floor, {n(sub_col_w)} cm from the bay's left inner face, tight under the PS3 shelf. Check it's plumb.",
                    "Fix it with one small angle bracket at the bottom (into the frame's bottom panel) and one at the top (into the PS3 shelf's underside).",
                    "Drill two 5 mm pin holes in the divider's right face at the height of the frame's pin holes for the PS2/PS1 shelf. Fit the part shelf on four pins.",
                    "Pair the sub with the soundbar now: its PAIR button is on the back, and it's hard to reach once it's in.",
                    "Lay the isolation riser on the column's floor, its front edge flush with the frame's front.",
                    "Stand the sub on it with the grille facing the room, centred: 1 cm to the divider, 1 cm to the frame's side. Slide it forward until its front is flush with the face frame's front (2 cm proud of the frame). Run its lead out of the back.",
                    "Check it touches nothing but the riser. If it does, a sheet of felt between, or nudge it.",
                ]),
                ("The game drawer (bay 1, bottom row)", [
                    "Fit the 350 mm runners to the frame's sides, level, so the drawer's base will sit about 1 cm above the frame's bottom panel. Drill pilot holes: BESTÅ sides are particleboard. If a screw won't hold, glue a 12 mm ply packer behind the runner.",
                    "Rout a 6 mm deep groove 1 cm up from the bottom on the inner faces of the sides, back and front panel, 9 mm wide, for the base.",
                    "Glue and screw the box together round the base: outside 54.3 × 35. Check the width against the runner maker's figure (usually the opening less 25.4 mm) before the glue sets.",
                    "Fit the cross divider 13 cm back from the front, and the two bin walls 16 cm in from each side. Glue in the bin floors with a slight back-rake, so the cases lean about 13°.",
                    "Felt the base and make the follower blocks.",
                    "Fit the runners' inner members to the box, hang it, and check it runs true empty.",
                ]),
                ("Bay 3: the divider, the LP crates and the slim drawers (v16)", [
                    "Stand the 12 mm divider in the bay, its left face 17.8 cm from the left side's inner face, the full height inside. Check it's plumb and parallel to the side at front and back (measure both), then fix it with two small angle brackets top and bottom.",
                    "Mark the runner lines on the divider's faces: on its right face 2.3 and 37.0 (the crates), on its left face 2.3, 25.1 and 47.9 (the slim drawers), matching the lines on the sides.",
                    "Screw the crates' 400 mm runners to the right side and the divider's right face; the slim drawers' to the left side and the divider's left face. Use every hole: a full crate is about 30 kg.",
                    "For each LP crate, glue and pin the two 40 × 8 sides and two 33.1 × 8 ends on top of the 34.9 × 40 base. The trough is 33 inside: snug for 31.4 sleeves, like a record shop's crate.",
                    "Glue a raked rest (an oak offcut) at the back of each crate, so the sleeves lean back about 10°. Felt the trough.",
                    "For each slim drawer, glue and pin the 6 mm sides, back and front onto the 15.3 × 40 base: 14.1 inside, for 13.5 cm game cases face-out. In the top one, glue a 6 mm strip down the middle (two pads on edge each side) and drill a 20 mm hole in the back for the USB-C lead's grommet.",
                    "Hang each box and run it in and out empty, then with ten records or ten games. Feed the charging lead from a USB plug on the 10-gang down the channel, with a loop of slack so the drawer opens fully.",
                ]),
                ("The hidden plinth drawer", [
                    "Make the box: the two 34 × 4.4 sides, the two 49.6 × 4.4 ends between them, the 6 mm base screwed underneath. It's 52 × 34 × 5.",
                    "Pack the plinth's inner faces under bay 2 with ply strips so the 300 mm runners sit the box's width plus their allowance apart, and fit the runners with the box 1.6 cm off the floor.",
                    "Felt the runners: the drawer sits under the sub.",
                ]),
                ("The face frame and the drawer fronts", [
                    "Cut the stiles (about 5 wide, and one 2 wide over bay 3's divider) and the rails from 2 cm oak. The bottom rail covers the plinth, 9 tall under bays 1–2, with an opening 54 × 6 for the plinth drawer, 1.6 up, under bay 2.",
                    "Scribe the two end stiles to the walls, then glue and pin the frame to the frames' fronts and bay 3. Notch the bottom rail's left end for the two socket leads.",
                    "Screw the oak lips onto the game drawer, the two LP crates, the three slim drawers and the plinth drawer from inside each box, with a 2–3 mm gap all round to the face frame.",
                    "Cut each finger pull underneath its lip: a cove routed along the back of the bottom edge.",
                ]),
            ]),
        9: dict(
            parts=["Two oak uprights, 165 × 30 × 4.5 (cut to fit)", "High shelf: 128.9 × 30 × 4 and 51.7 × 30 × 4", "Record ledge 128.9 × 7 × 2.4 and its lip",
                   "Series X shelf 55 × 30 × 4", "Two oak cleats for the reveal, 30 long", "The “now playing” ledge 105.5 × 7 × 2.4 and its lip, two concealed brackets",
                   "The glass case: oak sides 85 × 12 × 2 (2), top and bottom 86 × 12 × 2 (2), a 6 mm oak-faced ply back 86 × 81, a 4 mm toughened front 85.6 × 82.2, three 6 mm toughened shelves 85.6 × 9.2, two oak cleat strips 80 × 6 × 1.8 cut at 45°", "Oak wedges (2 + spares), 10 mm oak dowel for pegs and the uprights' dowels"],
            hardware=["Four concealed upright brackets", "5 × 60 mm screws and plugs", "Wood glue", "LED strip in its aluminium channel (from the lighting phase)",
                      "Twelve 5 mm shelf pins for glass, with rubber sleeves", "A warm white LED strip, 85 cm, for the case"],
            tools=["Router with a straight bit and a guide batten", "Chisels 6, 12 and 25 mm, and a mallet", "Japanese pull saw", "Drill with a 10 mm brad-point bit and a 20 mm bit",
                   "Dowel jig or dowel centres", "Combination square, marking knife", "Spirit level and laser", "Clamps", "A helper"],
            draw=["joints", "section"],
            parts_full=[
                ("Cut the uprights to length", [
                    f"Measure from the worktop to the ceiling at each upright's position. The plan says {n(g.UPRIGHT_LEN)}; ceilings vary.",
                    "Cut each upright 2 mm under its measurement, then scribe its top to the ceiling as you did the worktop.",
                    "Mark each upright's faces: which side faces the TV, and the back edge that goes against the wall.",
                ]),
                ("The housings (both uprights)", [
                    f"Measure from each upright's foot (the end on the worktop). The high shelf's housing is {up_h(g.HIGH_UNDER)}–{up_h(g.HIGH_TOP)} up, the full 30 depth, 1.2 deep, on the TV-side face of both uprights.",
                    f"The record ledge's housing is {up_h(g.LEDGE_UNDER)}–{up_h(g.LEDGE_TOP)} up, 0–7 from the back edge, 1.2 deep, on the TV-side face of both.",
                    f"On the left upright's other face (the turntable side), a second high shelf housing at {up_h(g.HIGH_UNDER)}–{up_h(g.HIGH_TOP)}, full depth, for the short length.",
                    "Clamp a straight batten as a guide, set the router 4 mm deep and rout, then step down to 12 mm in passes. Square the ends with a chisel. Practise on an offcut first.",
                ]),
                ("The through-mortises (left upright)", [
                    f"Two mortises, each 6 wide and 2.4 tall, at {up_h(tenon[0])}–{up_h(tenon[1])} up from the foot, 12–18 and 20–26 cm from the back edge.",
                    "Mark them on both faces with a square and a knife. Drill most of each out with the 20 mm bit, halfway from each face, then chisel to the lines.",
                    "On the TV-side face, flare the top and bottom of each mortise outwards 3–4 mm, for the wedges.",
                ]),
                ("The tenons (Series X shelf)", [
                    "On the shelf's west end (the end that goes through the upright), mark two tenons 6 wide and 2.4 thick, centred in its 4 cm thickness, 12–18 and 20–26 from its back edge, 4.5 long.",
                    "Saw the shoulders and cheeks, and cut away the rest of the end back to the shoulder line.",
                    "Saw a kerf 3 cm deep across the middle of each tenon, parallel to the shelf's faces.",
                    "Test-fit through the mortises: snug, pushed in by hand.",
                ]),
                ("The grooves", [
                    "On each upright's TV-side face, rout a groove for the LED channel (usually about 1.7 wide × 0.8 deep: check yours), 2 cm in from the front edge, from 2 cm above the worktop to just under the high shelf's housing.",
                    "On each upright's back edge, rout a 2 × 1.5 cable groove the full length: the left one for the Series X's HDMI and power and the vinyl lead, the right one for Deco B's 12 V and patch leads.",
                    "Notch both uprights' tops for the ceiling LED strip.",
                ]),
                ("Dry-fit, then fix", [
                    "Lay each upright on the floor with its shelves in their housings. Check every joint closes before any glue.",
                    "Drill two 10 mm holes 3 cm deep in each upright's foot, and matching holes in the worktop at the marked positions (dowel centres make this exact). Glue the dowels into the uprights only, so they can come out.",
                    "Lay the Series X's and the vinyl leads into the left upright's back groove, and Deco B's into the right one's.",
                    "Stand the right upright on its dowels against the breast's side. Screw it to the reveal through three countersunk holes, with plugs, and plug the holes with oak.",
                    "Stand the left upright on its dowels, check it's plumb with the laser, and fix it to the back wall with the concealed brackets.",
                    "Slide the long high shelf and the record ledge into their housings from the front.",
                    "Screw a 30 cm cleat to the breast's side face (the reveal) for the short high shelf, and another at the Series X shelf's underside height. Slide the short high shelf in from the front onto its cleat and into its housing.",
                    "Feed the Series X shelf's tenons through the mortises from the turntable side, onto its cleat. Glue the wedges and drive them into the kerfs from the TV side. When dry, saw them flush and plane: proud, they'd touch the TV.",
                    "Pegs: drill 10 mm through each upright's face into the housed shelf ends, 4 cm deep, about 4 cm from the front edge. Glue in a peg and saw it flush.",
                ]),
                ("The “now playing” ledge on the breast (v16)", [
                    f"Cut it {n(g.NOW_LEDGE['x'][1] - g.NOW_LEDGE['x'][0])} × 7 × 2.4 from the shelf board's offcut and glue a 1.5 cm lip along its front edge, so a sleeve stands against the wall without sliding.",
                    f"Mark a level line on the chimney breast at {n(g.NOW_LEDGE['top'] - g.NOW_LEDGE['t'])} (the ledge's underside), {n(g.NOW_LEDGE['x'][0] - g.BREAST_X[0])} cm in from each side of the breast.",
                    "Fit its two concealed brackets to the maker's instructions, slide the ledge on, and stand three LPs on it.",
                ]),
                ("The glass display case on the breast (v34)", [
                    "Rout a 5 mm groove 6 mm deep along the inside of the top and bottom pieces, 1.5 cm in from their front edges, for the glass front: the top's groove 12 mm deep, so the front lifts up into it and drops into the bottom one.",
                    "Rout a 6 mm rebate along the back edges of all four pieces for the ply back.",
                    "Drill the shelf-pin holes on the sides' inner faces, front and back, 3 cm in from each edge: at 19, 40 and 61 above the bottom piece's top (the shelves at 158, 179 and 200 on the wall).",
                    "Glue and dowel the frame together (sides between the top and the bottom), check the diagonals, then glue and pin the ply back into its rebate.",
                    "Stick the LED strip under the top, just behind the groove, and run its lead out through a 10 mm hole in the back's top corner, down the breast's side to a plug (the strips' app runs it).",
                    "Screw one cleat strip to the case's back, 10 under its top, the bevel down and facing the wall. Screw the other to the breast at 212 (its top edge), level, the bevel up and facing out, with 5 × 60 screws in plugs every 20 cm.",
                    "Lift the case onto the cleat (two people: about 16 kg before the glass), check it's level, and fix its bottom edge to the breast with two small mirror plates.",
                    "Fit the pins and lay in the three glass shelves; lift the front up into the top groove and drop it into the bottom one. Fill it.",
                ]),
            ]),
        10: dict(
            parts=["Wrap ledge 134 × 7 × 2.4 and its lip", f"PC shelf {n(g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1])} × {n(g.PC_SHELF_D)} × 4", "Two oak cleats, 2 cm",
                   "Keyboard tray: oak housing 70 × 28 × 7 (sides 7 × 2), 12 mm ply tray 54 × 26 with an oak lip"],
            hardware=["Two concealed shelf brackets rated 40 kg+ a pair", "300 mm light-duty runners, one pair", "An oak-coloured brush grommet", "10 mm dowels (2)", "5 × 60 mm screws and plugs"],
            tools=["SDS drill", "Drill-driver", "Dowel jig", "Spirit level and laser", "Jigsaw", "Clamps"],
            draw=["pc_shelf"],
            parts_full=[
                ("The cleats", [
                    f"Screw the first cleat to the side wall with its top on the {n(g.LEDGE_UNDER)} line, from {n(g.UP_D)} cm out from the back wall (in line with the uprights' fronts) to {n(g.ALC_D - g.WRAP_Z[1])} cm out. Plugs every 25 cm.",
                    f"Screw the second with its top at {n(g.PC_SHELF_TOP - g.PC_SHELF_T)} (the PC shelf's underside), from {n(g.ALC_D - g.PC_SHELF_Z[0])} to {n(g.ALC_D - g.PC_SHELF_Z[1])} cm out.",
                ]),
                ("The wrap ledge", [
                    "Lay the ledge on its cleat, its alcove end in line with the uprights' fronts, and screw up through the cleat into it.",
                    "Glue the lip along its front edge.",
                ]),
                ("The PC shelf and its tray", [
                    "Fit the concealed brackets into the wall at the shelf's height, through the cleat, to the maker's instructions.",
                    "Cut the grommet hole in the shelf's back corner, over the top of the chased conduit.",
                    "Screw the keyboard tray's housing to the shelf's underside, stopping 12 cm short of the sofa end so the cables drop past it. Fit the runners inside it and slide the tray in.",
                    "Slide the shelf onto its brackets and down onto the cleat. Lean on it: it shouldn't move.",
                ]),
                ("The PC's leads", [
                    "Fit the brush grommet. Pull the HDMI (active optical: the end marked \"source\" at the PC) and the Cat6 down the 38 mm conduit with its draw wire.",
                    "Take the plug off the C13 lead, feed its bare end down the 25 mm conduit, and at the bottom fit the rewireable plug: brown to L, blue to N, green-and-yellow to E, the cord grip on the outer sheath, a 13 A fuse.",
                    "At the bottom, all three run behind the skirting into the plinth's notch and the channel; the mains lead goes on to the 10-gang behind the TV.",
                ]),
                ("The PC's extras (v17)", [
                    "Screw the powered USB hub under the side run's front edge, below the PC, ports facing the sofa. Its adapter plugs into the 10-gang along the PC's mains route; its lead runs up through the grommet to the PC.",
                    "Remote power button: with the PC unplugged, push the receiver card into a spare slot and plug its lead onto the motherboard's power-switch pins (the case's own button lead plugs into the card's pass-through). Stick the push button to the wrap ledge's underside, by the sofa end.",
                    "Lay the magnetic dust filter on the PC's top exhaust; brush it off once a month.",
                ]),
            ]),
        11: dict(   # v27: the dining cabinet; v30: the compact one, two boxes with hinged doors (the sliding one is plan section 5's alternative)
            parts=[f"Oak-faced ply, cut to size by the merchant, 18 mm: four ends {n(K['h'])} × {n(K['d'])}; the table box's top and floor {n(K['bay_t'])} × {n(K['d'])} and the chair box's {n(K['bay_c'])} × {n(K['d'])}; "
                   f"the linen shelf {n(K['bay_t'])} × {n(K['linen_d'])} and the chair shelf {n(K['bay_c'])} × {n(K['in_d'])}; the table door {n(K['door_tw'])} × {n(K['door_h'])} and the chair door {n(K['door_cw'])} × {n(K['door_h'])} (oak both sides, grain upright, all edges lipped)",
                   f"6 mm ply: the two backs, {n(K['bay_t'])} × {n(k_back)} and {n(K['bay_c'])} × {n(k_back)}",
                   f"Solid oak: two table halves, each a centre {n(tl - 14)} × {n(tw)} × {n(tt)} of edge-glued staves and two breadboard ends {n(tw)} × 7 × {n(tt)}; "
                   f"the hinge rail {n(K['bay_t'])} × {n(K['rail_x'][1] - K['rail_x'][0])} × 7; eight apron rails 2 thick × {n(ap)} deep (outer half: two {n(tl - 6)} long, two {n(tw - 12)}; inner half: two {n(tl - 7.6)} long, two {n(tw - 12)}); "
                   f"four legs {n(C['leg'][0])} × {n(C['leg'][1])}, cut 70 long and trimmed to the floor; two door stops 8 × 2.5 × 1.2; four 1.2 cm battens 3 wide for the plinth, two {n(K['bay_t'])} and two {n(K['bay_c'])} long"],
            hardware=["Altro continuous piano hinge, 1800 × 50, cut to 90 (the table's foot)", "Two Altro continuous piano hinges, 1800 × 32 × 1 mm, stainless (the doors), not cut",
                      "Three Lee Valley 40574 narrow flip-top hinges (1.27 × 7.0) and their screws",
                      "Folding, self-locking table-leg brackets, a set of four", "Sixteen figure-8 tabletop fasteners",
                      "Four magnetic catches", "A 10 mm flush magnet and two steel cups", "A small brass cup hook (the cloth bag)",
                      "Two steel angle brackets, plugs and 5 × 70 mm screws for your solid wall", "4 × 50, 4 × 30 and 3.5 × 16 mm wood screws (the short ones for the piano hinges), 25 mm panel pins, wood glue",
                      "Plastic shims, felt pads, hardwax oil, 10 mm oak dowel for the breadboard pegs"],
            tools=["Drill-driver and a countersink", "A self-centring (Vix) bit for the piano hinges' pilot holes", "35 mm and 10 mm Forstner bits", "Router with straight bits and a guide", "Jigsaw or track saw",
                   "Hacksaw (to cut the table's piano hinge)", "Chisels", "Clamps, at least four 100 cm", "Long spirit level and a square", "Tape measure and pencil", "A helper for standing the boxes and hanging the table"],
            draw=["cab_carcass", "optc_halves", "cab_section", "cab_elevation"],
            parts_full=[
                ("Before you start: check and mark out", [
                    f"Measure the gap under your shelf at both ends: it must be at least {n(K['h'] + 2)}. The boxes are {n(K['h'])} tall and need 2 cm to tip up into place.",
                    f"Mark the cabinet's footprint on the floor: {n(K['len'])} long and {n(K['d'])} deep off the wall, its stair end {n(g.STAIRS_WALL_Z[0] - K['z'][0])} cm short of the stair box (that strip stays clear for the stairs' foot). "
                    f"Its window end is then {n(K['freed'])} cm short of the pipe boxing's face. Mark the line between the two boxes, {n(K['z_t'][0] - K['z_t'][1])} from the stair end.",
                    "Your stairs wall is solid: the two brackets go in with plugs and screws. Run the detector over both spots first, as for every hole.",
                    "Lay a long level along the footprint. Note the low end: the shims go there later.",
                    "Oil every oak face and edge (two thin coats, a day apart) before you assemble anything: it's much easier on flat parts, and a board oiled on one side cups.",
                ]),
                ("The two boxes", [
                    f"Each box is two ends with a top and a floor between them, a back and a shelf. Lay the ends flat, inside faces up, and mark on each: the floor's top face at {n(K['plinth'])}, the top flush with the end's top edge, "
                    f"and a line {n(K['door'] + K['gap'])} back from the front edge, full height. The shelves and the hinge rail stand behind that line; the door sits in front of it, flush with the front edges.",
                    f"On the table box's two ends mark the hinge rail ({n(K['rail'][0])}–{n(K['rail'][1])}) and the linen shelf's top face at {n(K['linen'][0])}. On the chair box's ends mark the chair shelf's top face at {n(K['shelf_y'] + K['t'])}.",
                    f"Stand two ends up and fit their top and floor between them, flush at the front: glue, pre-drill and drive three 4 × 50 screws through each end into each panel's end grain. "
                    f"The table box is {n(K['bay_t'])} inside, the chair box {n(K['bay_c'])}. Each floor's bottom face is at {n(K['plinth'] - K['t'])}.",
                    f"Fit the chair shelf in the chair box, its front edge on the line, and the linen shelf in the table box {n(K['pads'])} behind the line (a hook for the cloth bag goes in front of it): glue and three screws through each end.",
                    f"Measure both diagonals of each box's front: when they're equal, it's square. Glue and pin each 6 mm back ({n(K['bay_t'])} or {n(K['bay_c'])} × {n(k_back)}) between the ends, the floor and the top; it holds the box square.",
                    "Glue and screw two battens under each floor, one 1 cm back from the front edge and one at the back: that's the plinth.",
                ]),
                ("Stand them and fix them to the wall", [
                    "With your helper, tip the table box up and walk it onto its marks, back to the wall; then the chair box beside it at the window end.",
                    "Shim under the battens until both are level along their length, plumb at the front, and flush with each other at the front and the top. Check again after a minute: they settle.",
                    "Clamp the two meeting ends together and screw them to each other with four 4 × 30 screws from inside the chair box, at about 20, 70, 120 and 170 up. Now they're one cabinet.",
                    "Screw an angle bracket under each box's top, in the middle, and into the wall with plugs and 5 × 70 screws. They stop it tipping; the floor takes the weight.",
                ]),
                ("The hinge rail", [
                    f"Slide the oak hinge rail ({n(K['bay_t'])} × {n(K['rail_x'][1] - K['rail_x'][0])} × 7) into the table box against the back, its top face at {n(K['rail'][1])}: its front stands {n(K['pads'])} behind the line, like the folded table's, so the cloth bag on the door's hook clears it.",
                    "Glue it, then drive two 4 × 50 screws through each end into it. It carries the table's whole weight when it's open, so don't skip the glue.",
                ]),
                ("The two table halves", [
                    f"Ask the timber merchant for two centre panels of edge-glued staves, each {n(tl - 14 + 5)} × {n(tw)} × {n(tt)}: {n(tl - 14)} between the shoulders plus a 2.5 tongue at each end, and four breadboard ends {n(tw)} × 7 × {n(tt)}.",
                    "On each end of each centre panel, rout a tongue 2.5 long and 0.9 thick, centred in its thickness: take 0.9 off each face with the router against a batten.",
                    "In each breadboard end's inner edge, rout a groove 0.9 wide and 2.6 deep, centred, full length. Dry-fit: flush with the panel's long edges and flat across the joint.",
                    "Drill three 10 mm peg holes down through each breadboard end and its tongue: one at the centre and one 8 cm in from each side, 1.3 cm from the breadboard's inner edge. Take the ends off and elongate the two outer holes in each tongue to 16 mm along the width, so the panel can move.",
                    "Glue only the middle 10 cm of each tongue, clamp the ends on and drive the pegs (glue the outer pegs into the breadboard only). Saw flush, sand to 180 and oil both faces equally.",
                    f"Each half is now {n(tl)} × {n(tw)}. Chamfer the underside edges 1 cm, except the two edges that will meet at the joint.",
                ]),
                ("The aprons (the frame under each half)", [
                    "Lay both halves face down on a clean blanket, their joint edges together, as on the drawing of the halves from underneath.",
                    f"The outer half: its two long rails ({n(tl - 6)}) run along the half 4 cm in from the sides and 3 cm in from both ends; its two short rails ({n(tw - 12)}) fit between them at the ends. Glue and screw the corners (two 4 × 50 each).",
                    f"The inner half: the same, but its frame stops {n(ap)} short of the wall end (that strip rests on the hinge rail): long rails {n(tl - 7.6)}, short rails {n(tw - 12)}.",
                    "Fix each frame to its half with figure-8 tabletop fasteners every 25 cm (four a rail): recess each in the rail's top edge with the 35 mm bit, screw it to the rail and then up into the top with 4 × 30 screws. They hold the top flat but let it move.",
                ]),
                ("The legs", [
                    f"Cut the four legs 70 long from the {n(C['leg'][0])} × {n(C['leg'][1])} oak. They're trimmed to the floor at the end.",
                    f"Screw a folding bracket to the underside of each half where its legs stand (see the drawing): on the inner half against the end rail by the joint, the leg centres {n(C['leg_in'])} cm from the joint and 32 cm in from each side; on the outer half in the two corners at the far end, centres {n(C['leg_in'])} cm in from the end and the sides.",
                    "Screw each leg's top into its bracket. Fold them: the inner half's legs fold towards the wall end, the outer half's towards the joint. Folded, each leg lies flat inside its apron frame.",
                ]),
                ("Join the halves: three flip-top hinges", [
                    "Turn the halves face up, their meeting edges together, flush across the top. Mark three hinges along the joint: 10 cm in from each side and one in the middle.",
                    "Rout each hinge's two leaves into the two edges to the hinge's depth with a guide, square the recesses with a chisel and screw the hinges in.",
                    "Swing it: open, the two tops are flush; folded, the outer half lies flat on the inner half, top face to top face, with nothing proud.",
                ]),
                ("Hang the table", [
                    f"Cut the 50 mm piano hinge to {n(tw)} with a hacksaw and file the ends smooth.",
                    "With the inner half face down, screw one leaf of the piano hinge along its wall end, on the underside, the knuckle exactly on the end edge: a screw every 10 cm, pilot holes first.",
                    f"Fold the outer half onto the inner half. With your helper, lift the folded table upright into the table box, its wall end down on the hinge rail, its underside facing the room, centred ({n((K['bay_t'] - tw) / 2)} each side).",
                    f"Screw the hinge's other leaf to the rail's top face, the knuckle {n(K['pivot'][0] - K['rail_x'][0])} back from the rail's front. That leaves {n(K['pads'])} in front of the folded table for the cloth bag on the door. One screw at each end first, try the swing, then the rest.",
                    f"Try it: it swings down to flat with its top at {n(g.TABLE_TOP)} and back up to stand in the box without touching the sides. The folded table's top edge is at {n(K['folded_top'])}, just under the linen shelf.",
                ]),
                ("The catches and the finger pull", [
                    "Screw two magnetic catches under the linen shelf's front edge, 15 cm in from each side, and their plates on the folded table's top edge: they hold it upright.",
                    "Rout a finger pull 12 long and 1.5 deep in the underside of the inner half's apron rail by the joint, in the middle: folded, it's at the top, and that's what you pull to bring the table down. No knob, so nothing presses into the pads on the door.",
                ]),
                ("Hang the two doors", [
                    f"The table door ({n(K['door_tw'])} × {n(K['door_h'])}) hangs on the table box's window end and the chair door ({n(K['door_cw'])} wide) on the chair box's stair end. "
                    "The two hinges sit side by side where the boxes meet, and each door opens away from the other, turning 180° to lie flat over it.",
                    "Lay a door face down, its hinge edge up. Screw one leaf of a 32 mm piano hinge along that edge, centred (1.9 short of each end), the knuckle just proud of the door's face: a 3.5 × 16 screw every 10 cm into pilot holes made with the self-centring bit.",
                    "Stand the door in its opening on 2 mm packers, with an even gap all round. Screw the hinge's other leaf to the inside face of the end it hangs on, the knuckle just proud of the front edge: one screw at the top and one at the bottom first, try the swing, then the rest.",
                    "Hang the table door first, then the chair door. Each should shut flush with the front edges and open right back, flat against the other door.",
                    "Glue an oak door stop under each box's top, behind its door's free edge, with a magnetic catch let into it and the catch's plate on the door's back: the door closes flush and stays shut.",
                    f"Let the 10 mm flush magnet into the chair door's face, {n(mag_c)} from its hinge edge and 100 up, and the two steel cups into the table door's face at the same height, {n(mag_t2)} and {n(mag_t)} from its hinge edge. Whichever door is open now holds flat against the other.",
                    "Screw a small brass hook to the table door's back, high up in the middle: the cloth bag (the tablecloth and napkins) hangs on it, in the space in front of the folded table.",
                    "Rout an upright finger slot in each door 5 cm in from its free edge, 26 long, 2.5 wide and 1 deep, at about 92–118 from the floor; ease its edges and oil it.",
                    "Open the table door flat and press down gently on its far end: it mustn't drop. If it does, check every hinge screw is in tight before you load the cabinet.",
                ]),
                ("Level the table and trim the legs", [
                    "Open the table door and lay it back over the chair door. Open the table: pull it down, unfold the inner half's legs till they click, lower it; flip the outer half over and unfold its legs till they click.",
                    f"Lay the level across it in both directions. Mark each leg where it should meet the floor so the top is level at {n(g.TABLE_TOP)}, fold the legs, saw them off square and stick felt pads on.",
                ]),
                ("Load the chairs and check", [
                    "Lay two folded chairs on their sides in the table box's base, under the hinge rail, one behind the other: the back one first.",
                    "Open the chair door. Stand two folded chairs on the chair box's floor, one behind the other, and two on its shelf the same way.",
                    "Fold the table up, shut both doors and stand back: two plain oak doors, nothing on show.",
                ]),
            ]),
        12: dict(
            parts=["Both Wolston-style spot bars and eight smart colour E14 bulbs under 6 W (WiZ Colour P45 4.9 W, or Hue E14 lustre 5.1 W)",
                   "Smart colour strip, RGB and tunable white (about 4.5 m: Hue Lightstrip Plus or WiZ, in the bulbs' app), three aluminium channels with opal diffusers, its plug-in power", "6500K bias light for the TV", "Your red lamp, with its colour bulbs"],
            hardware=["Connector block or lever connectors (if the bar's flex needs them)", "Earth sleeving, insulating tape"],
            tools=["Two-pole voltage tester (GS38) and its proving unit", "MCB lock-off and padlock", "Insulated screwdrivers, wire strippers", "Step ladder", "A helper to hold the bar"],
            draw=[],
            parts_full=[
                ("Before you start", [
                    "No dimmers: smart bulbs need full power, so leave the light switches as they are and keep them on. A dimmer in front of a smart bulb makes it flicker and can damage it.",
                    "The same stop list as step 3. Here, also stop if a ceiling point has no earth (the bars need one), or the rose has more wires than you can match to your photo.",
                ]),
                ("Isolate the lighting circuit", [
                    "Tell everyone in the house you're working on the electrics.",
                    "At the consumer unit, switch off the breaker for the lighting circuit (usually marked \"lights\", 6 A). If the labels aren't clear, switch off the main switch instead.",
                    "Fit the MCB lock-off and padlock to that breaker, keep the key in your pocket, and tape a note on the board: \"Working on this circuit, do not switch on\".",
                    "Prove your voltage tester on its proving unit: it must light.",
                    "At each switch and each ceiling point, with the cover off, test between every pair: live and neutral, live and earth, neutral and earth. No reading on any of them.",
                    "Prove the tester on the proving unit again. Only now is it safe to touch.",
                ]),
                ("Take down the old fittings, hang the bars", [
                    "Unscrew each old fitting's cover. Prove dead again at its terminals. Photograph the wiring, mark the switched live (the wire from the switch) with tape, then disconnect and take the fitting down.",
                    "Fix bar 1's mounting plate to the ceiling over the rose between the TV and the sofa, the bar running from the TV towards the window (v15), with screws into the joist or the plate's fixings. Bar 2's goes on the pendant point by the stairs, running the same way, along the west wall.",
                    "Connect earth first (green-and-yellow to the bar's earth), then neutral to N and the switched live to L, in the bar's terminal block; any loop wires go back together exactly as they were. Tighten, tuck, and fit the canopy.",
                    "Fit the smart colour bulbs and point every head straight down, evenly spread along the bar (v17). Tilt one only if its pool lands in the TV's screen or someone's eyes. If a WiZ bulb shows below its shade's rim, use the shorter Hue lustre there.",
                ]),
                ("Power on and test", [
                    "Remove the lock-off and switch on, wall switches on. In the bulbs' app, add all eight, group them as bar 1 and bar 2, set warm white at about half, then save the four presets, Evening, Bright, Cosy and Film, from the lighting presets below (levels, and colours if you want them). Your red lamp's colour bulbs go in the same presets. With the table open, bar 2 sits between 45 and 55, the ceiling strip at most 40, and bar 1 down to 15 (the table rule): save that as a fourth scene, Table, if your app can't do it on its own.",
                ]),
                ("The low-voltage lights (nothing to isolate)", [
                    "Cut the smart strip at its marks into three lengths: one for each upright's groove and one for the side-wall run. Press each into its aluminium channel under the opal diffuser; take the uprights' leads down their grooves to the strip's power on the 10-gang (v16: smart colour).",
                    "The side-wall run's strip: in its channel in the groove under the run's front edge, 1.5 cm back from the edge, the full 220 cm; its lead drops with the PC's through the brush grommet into the conduit, to the same power.",
                    "Add the strips to the app beside the bars' bulbs, so each preset sets the wall's glow too: warm white for Bright, low and coloured for Cosy and Film.",
                    "Clip the ceiling strip through its notches in the uprights; stick the bias light round the back of the TV on its USB port.",
                    "Stand your red lamp in its spot (the 3D room shows the three), its bulbs green, pink and purple, top to bottom.",
                ]),
            ]),
        13: dict(
            parts=["HDMI switch, RetroTINK, HDMI leads, optical and SCART cables, the active optical HDMI for the PC", "Stylus, preamp, RCA-to-3.5 mm lead, record brush", "Labels"],
            tools=["Phone with the Deco app", "Velcro ties"],
            draw=["av", "power", "network"]),
        14: dict(   # v41: the client's picks, built and fitted
            parts=["The bar's ply (the cutting list: ends, floor, shelf, doors, plinth front, back), its oak counter, an IKEA ENHET frame 40 × 15 × 75, a 3 mm acrylic mirror",
                   "Two IKEA KALLAX 42 × 42, a 12 mm ply base, an 18 mm oak lid 90 × 50, four castors, two hinges and two lid stays",
                   "Two IKEA EKET 35 × 35 × 35 with their rails; two oak floating shelves 90 × 23 with brackets; an oak shelf 91 × 27 on two brackets; four IKEA KUGGIS 35 × 26 × 15"],
            hardware=["5 × 60 mm screws and brown plugs (solid wall)", "4 × 30 and 4 × 40 mm wood screws", "Two soft-close hinges and a push catch for the bar's doors"],
            tools=["Detector", "SDS drill", "Drill-driver", "Spirit level", "Jigsaw or track saw", "Clamps"],
            draw=[],
            parts_full=[
                ("The C-table", [                                                   # v43: in the plan; its own chapter (v44)
                    f"Cut the top {n(CT['top'][0])} × {n(CT['top'][1])}, the upright {n(CT['upright'][0])} × {n(CT['upright'][1])} and the foot {n(CT['foot'][0])} × {n(CT['foot'][1])} from the second 18 mm oak board; round the top's and the foot's outer corners (a 3 cm radius).",
                    "Glue and screw the upright to the top's outer edge with three 4 × 40 mm screws, counterbored and plugged, square to it; then the foot to the upright's bottom the same way.",
                    "Sand to 180 and give it two coats of hardwax oil.",
                    "Screw the 400 × 200 × 6 mm steel plate under the foot (four 4 × 20 mm screws through drilled holes), its back edge 1 cm in from the foot's; stick felt pads under the plate.",
                    f"Stand it at the sofa's open end, the foot's back edge just under the seat's edge, the top {n(ideas.CTABLE['over'])} over the seat. A full mug on the far edge mustn't make it rock.",
                ]),
                ("The bar beside the cabinet", [
                    f"Measure the gap at the floor, at 45 and at 90: the cabinet's end to your shelf's end, less the 10 cm gap. Drawn: {n(g.BAR_BUILT['w'])} wide, {n(g.BAR_BUILT['d'])} deep.",
                    "Scribe the two ends to the cabinet's end and the wall, then glue and screw the floor, the shelf and the back between them; the plinth front set back 2.",
                    "Stand it, check it's level, and screw it to the wall through the back's top rail and to the cabinet's end (4 × 30, from inside).",
                    f"Fix the oak counter on top, {n(g.BAR_BUILT['top_t'])} thick, its front edge flush; hang the doors on soft-close hinges with a push catch (no handle to catch the table door).",
                    f"Over it: the ENHET frame on the wall, its bottom at {n(g.BAR_BUILT['enhet_y0'])}, plugged into the solid wall; the mirror behind it; the glasses on its shelves.",
                ]),
                ("The record table", [
                    "Assemble the two KALLAX as IKEA shows, then lay them on their backs side by side and screw them together through the sides (4 × 30).",
                    f"Screw the 12 mm ply base to their open backs and the four castors to the base, 3 cm in from each corner.",
                    f"Hinge the oak lid ({n(g.RECORD_TABLE['w'])} × {n(g.RECORD_TABLE['d'])}) along one long side; fit both lid stays so it can't drop. Full of LPs it's about {n(g.RECORD_TABLE['kg'])} kg: roll it, don't lift it.",
                ]),
                ("The wall cabinets", [
                    f"Mark the rail's line over the sofa's corner, the cabinets' bottoms at {n(g.WALL_CABS['y0'])}; detector first.",
                    "Screw IKEA's rail to the wall with 5 × 60 screws in brown plugs, level; hang the two EKET on it and tighten their fittings.",
                ]),
                ("The alcove shelves", [
                    f"Mark the tops at {n(g.ALCOVE_SHELVES['tops'][0])} and {n(g.ALCOVE_SHELVES['tops'][1])} in the window corner; detector first.",
                    "Fix each concealed bracket with its own screws into plugs in the solid wall, check it's level, and slide the shelf on.",
                ]),
                ("Over the hall door, and the boxes", [
                    f"The oak shelf's top at {n(g.DOOR_SHELF['top'])}, on two brackets above the architrave (check it's no more than {n(g.ARCHITRAVE)} wide).",
                    "Two KUGGIS boxes on it; two on your black shelf, either side of the laser, 1 over its front.",
                ]),
                ("The step drawers", [
                    "With the new stairs: ask the joiner for three drawers in the bottom three risers, 51 × 14.5 oak fronts, boxes 35 deep on 350 mm runners, and a bearer under each tread.",
                ]),
            ]),
    }
