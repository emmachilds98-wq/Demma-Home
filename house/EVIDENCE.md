# The whole house: the evidence

Everything the model is built from, what each piece tells us, how sure we are, and what it can't tell us. Paths are from the repo root.
Rule for the build: **a size or a shape goes into the model only with a line here (or in `SURVEY.md` once measured) behind it.**
Confidence: **M** measured by the client · **C** the client said so · **A** the selling agent's plan or photo · **R** our reading of a
photo or plan (to confirm) · **E** our estimate.

## 1. The client's own words (C)

| Date | What they said | What it fixes |
|---|---|---|
| 24 Oct | "This is the rear side of [the house] facing [the road behind]. Roughly 25m long." (the address is never stored) | Which way the back faces; the back faces the road behind Road; the back garden about 25 m |
| 25 Oct | "Upstairs bathroom is sink on the left and toilet ahead with black ink being solid walls where the room has more shape." | Bathroom layout; black ink = solid walls / boxing |
| 25 Oct | "Bedroom three is office and gaming room. Bedroom two is spare room. Top landing is more square it appears to be a slim top area right now." | Room uses; the top landing's shape |
| 25 Oct | "By the store in the kitchen is another cupboard with door facing towards the entrance making two doors in a cubby for that and the store" | The kitchen's second cupboard |
| 25 Oct | "The kitchen is directly under the living room and bathroom and bedroom 2 above that. It is 2 floors at the front and 3 at the back as it's on a hill. The alley has stairs down" | How the floors stack; the slope; the alley's stairs |
| 25 Oct | "Maroon is the sink cabinet. Green mark at top of the stairs is rough landing area size. Black block on bedroom 2 is the dormer roof as the rooms are built in a loft conversion when it was built originally. Flat top roof on the bathroom and bedroom 2 side. the maroon mark on the kitchen toilet is where the small sink is." | The bathroom's sink cabinet (maroon), the landing's size (green), bedroom 2's roof slope (black), the flat-roofed rear dormer, the WC's small sink (maroon) |
| 25 Oct | "keep it blank if need be through the window for now until the model of the whole house is done" | The living room's window shows a plain sky until phase 5 |
| 25 Oct | "This is a few images of the kitchen and how it looks currently. The chalkboard doors show how the two cupboards appear on your right as you walk in the kitchen. We've done this chalkboard style with the top floor boiler cupboard too." | The kitchen as built (v60), the cubby's two chalkboard doors, the airing cupboard's chalkboard door |

## 2. Floor plans

| File | Source | Shows | Confidence | Can't tell us |
|---|---|---|---|---|
| `media-wall/inputs/agent_floor_plans.png` | the selling agent (the selling agent) | Three floors, room names and sizes (feet and metres), doors, stairs, the 1224 sq ft total | A: sizes to about ±10 cm, shapes simplified | Wall thicknesses, window sizes, heights, solid boxing |
| `media-wall/inputs/plan_lower_ground_corrected_25oct.jpg` | the agent's plan, the client's ink | Kitchen 3.79 × 3.66, WC 1.64 × 1.88, landing, stairs, store; purple: the kitchen's back window; black: the cupboard by the store; maroon: the WC's small sink; "Secret room": the space under the garage | A + C | Exact positions; the secret room's height |
| `media-wall/inputs/plan_ground_corrected_25oct.jpg` | as above | Living room 4.95 × 3.65 (measured 4.67 × 3.47), hall and stairs, two stores, garage; orange: the living room's window; black: chimney breast, the window wall's corner box, the hall's solid wall | A + C | Garage and hall sizes (not given) |
| `media-wall/inputs/plan_first_corrected_25oct.jpg` | as above | Bathroom 2.04 × 2.38, bedroom 2 2.91 × 3.65, master 2.91 × 4.45, bedroom 3 2.04 × 2.17, airing cupboard, landing; blue: the toilet; maroon: the sink cabinet; black: walls and bedroom 2's roof slope; green: the landing at the top of the stairs | A + C | Exact sizes; the roof slope's heights |
| `media-wall/inputs/room_sketch_accurate_mm.png` | the client, measured | The living room in mm: 4670 × 3470, ceiling 2350, the window, the alcove, the breast | **M** | Other rooms |

Traced into `house/house.py` `PLANS` (pixels on each corrected plan, its scale and north-east corner); the scale per plan comes from
the agent's sizes (149, 150, 146 px a metre). The tracing is ±10 cm at best.

## 3. Photos

| File | Shows | Used for | Confidence |
|---|---|---|---|
| `media-wall/inputs/photo_house_front_25oct.png` | The front: end of terrace, red brick, tiled roof, porch with white pediment, white up-and-over garage door, drive, front lawn and low wall, the strip with the young tree, the neighbour's timber gate | Front elevation, front garden, materials | A; sizes E |
| `media-wall/inputs/photo_house_rear_24oct.jpg` | The back: three storeys, the dormer of four casements, the living room window (three sections, top lights, Georgian bars), the kitchen's window and glazed door, the WC window, the downpipe; lawn to the house, the concrete path, cordylines, close-board fence one side, slatted fence and gate the other | Rear elevation, back garden | A; sizes E (the living room window M) |
| `media-wall/inputs/photo_garden_summer_24oct.jpg` | The garden from the dormer, summer | Planting, the far end | C |
| `media-wall/inputs/photo_view_full_24oct.jpg` (+ `_wide`, `_centre`, `_right`) | The view from upstairs: the garden to the trees (about 17 m), the warehouse, the valley, the hill opposite | The view out (phase 5), the garden's length to the trees | C; geometry fitted (`garden_window.py`) |
| `media-wall/inputs/photo_garden_window_24oct.jpg` | A frame of the client's video through the living room window | The view from the room | C |
| `media-wall/inputs/photo_current_living_room.png`, `room_photo_*`, `photo_sofa_window_wall.webp`, `photo_stairs_*` | The living room and its stairs as they are | The living room model (done) | C |
| `media-wall/inputs/photo_kitchen_now_25oct.jpg` (newest), `photo_kitchen_window_run_25oct.jpg`, `photo_kitchen_corner_fridge_25oct.jpg` | The kitchen: the L of white gloss units, the sink and washer under the window, dishwasher, cooker, fridge-freezer, metro tiles, worktop, breakfast bar, laminate floor; the cubby and the door to the landing | The kitchen (`survey_data.KITCHEN`, `model.kitchen()`) | C (layout); sizes E (standard units) |
| `media-wall/inputs/photo_office_desk_wall_25oct.jpg`, `photo_office_corner_25oct.jpg` | Bedroom 3: the L desk, the shelf, pegboard, monitors, window, blind, radiator, carpet | The office (`survey_data.OFFICE`, `model.office()`), as planned: the straight oak desk | C (what goes where); sizes E |
| `media-wall/inputs/photo_bedroom2_25oct.jpg` | Bedroom 2 from the door: the block and the slope past it, the furniture | The block re-drawn (`model.first_floor_slopes`), `model.bed2()` | C; sizes E |
| `media-wall/inputs/photo_master_bed_25oct.jpg` | The master bedroom: the pine ottoman bed, the bedside, the chest, the rail | `model.master()`, the wardrobes' fit check | C; sizes E |
| `media-wall/inputs/photo_bathroom_end_from_stairs_26oct.jpg`, `photo_stairs_from_living_room_26oct.jpg` | The bathroom end from the stairs (client, 26 Oct): no wall between the landing and the stairwell; the bathroom door (fanlight) in the corner beside bedroom 2's; the short wall the banister ends at, in line with it; the bathroom's wall over the stairs a little behind, the LED strip along its foot. Up the flight from the living room: the bulkhead over the bottom step | `BATH_1`, `FIT` first_stairs, `FIT_DOORS` bath_door, `walls_for()`; `house/evidence/compare_v77_bathroom_end.jpg` | C (layout); the door's 68 and the 8.5 set-back E |
| `media-wall/inputs/photo_landing_from_office_26oct.jpg` | The landing from the office's door (client, 26 Oct): the banister to the end wall, the bathroom door in line with it, the master's door and switch, the hatch overhead | `FIT` landing/first_stairs, `LANDING.hatch`; `house/evidence/compare_v73_landing.jpg` | C |
| `media-wall/inputs/photo_master_alcove_26oct.jpg` | The master by its door (client, 26 Oct): the door's frame, the little alcove, the wall stepping out 19 towards the window | `FIT` master_b z1, `MASTER_1` (x to 251) | C; 190 and 420 the client's |
| `media-wall/inputs/photo_bathroom_sink_25oct.jpg`, `photo_bathroom_bath_25oct.jpg` | The bathroom from the door: the vanity and slim cabinet under the slope, the tiled box, the toilet under the window, the bath, rail and curtain, the tiles | `model.bathroom()`, the box and slope (`first_floor_slopes`) | C; sizes E |
| `media-wall/inputs/photo_wc_25oct.jpg` | The WC: the yellow suite, the basin and tiles, the window, laminate | `model.wc()` | C; sizes E |
| `media-wall/inputs/photo_hall_to_living_25oct.jpg`, `photo_hall_front_door_25oct.jpg`, `photo_living_door_to_hall_25oct.jpg` | The hall both ways: the boxed stairs and tapestry, the door down, the mirror and bench, shoe racks, radiator, the front door | `model.hall()`, the box and its door (`floors_and_fittings`) | C; sizes E |
| `media-wall/inputs/photo_hall_door_down_frame_30oct.jpg`, `photo_hall_racks_frame_30oct.jpg`, `photo_hall_to_front_door_30oct.jpg`, `photo_stairs_lower_up_30oct.jpg`, `photo_stairs_up_led_30oct.jpg`, `photo_kitchen_*_30oct.jpg`, `photo_wc_*_30oct.jpg` (V1.12) | The door down is an empty frame under its grille; the hall, the kitchen, the WC and both flights as modelled (the council's name, leaflets and the chalk door's writing blurred before saving) | `survey_data.HALL["door_leaf"]` False | C |
| `media-wall/inputs/photo_stairs_up_from_living_25oct.jpg`, `photo_stairs_lower_down_25oct.jpg`, `photo_landing_stairs_down_25oct.jpg` | Both flights: straight, grey carpet, the banister and newel, the lower one between walls with a handrail | `model.stairs()`, the top landing fitted | C |
| `media-wall/inputs/photo_landing_balustrade_25oct.jpg`, `photo_landing_to_bathroom_25oct.jpg` | The landing: the balustrade, the bathroom door and fanlight, the hatch | `model.landing()` | C; sizes E |
| `media-wall/inputs/photo_office_wide_25oct.jpg`, `photo_kitchen_from_door_25oct.jpg`, `photo_kitchen_cubby_from_door_25oct.jpg` | The office's tall cupboard; the kitchen and its cubby from the kitchen door | `model.office()`; the kitchen as modelled | C |
| `media-wall/inputs/photo_kitchen_cubby_doors_25oct.jpg` | The cubby: the store's and the cupboard's chalkboard doors at right angles, the cupboard's two vents | `model.chalk_doors()`, the store's top part re-traced | C |

## 4. Maps and the sun

| Source | Gives | Confidence |
|---|---|---|
| OpenStreetMap (the buildings and roads round the house, the API's `map` call) | The terrace's long walls on 104°: the back faces **14° east of north** | high (±3°) |
| The house's location (not stored) | about 51.5 N (for the sun) | high |
| NOAA solar position formulas | The sun into the back windows only on spring and summer mornings (05:30–08:30 BST at midsummer), from the right | high |

## 5. The model as it is now (v72)

| File | What it shows |
|---|---|
| `house/evidence/now_living_room_whole.jpg` | The living room, the one room modelled in detail (measured, its plan, its lights) |
| `house/evidence/now_living_room_window.jpg` | Out of the window: the plain sky for now (the garden photo is off until phase 5) |
| `house/evidence/now_living_room_sun_june_morning.jpg` | The real sun: a June morning, low from the right |
| `house/evidence/now_house_all.jpg` | The whole house built (v58, Outside): walls, windows, doors, the roof and dormer, both gardens, the alley |
| `house/evidence/compare_front.jpg`, `compare_back.jpg` | The agent's photos beside the model from about the same place (phase 2's proof) |
| `house/evidence/now_house_first.jpg`, `now_house_ground.jpg`, `now_house_lower.jpg` | The floor picker: the roof and the floors above off |
| `house/evidence/overlay_*.jpg` | The model's rooms over the client's corrected plans |
| `house/evidence/compare_kitchen.jpg`, `now_kitchen.jpg` | The client's kitchen photo beside the Kitchen view (v60) |
| `house/evidence/now_office.jpg` | The Office view: the new straight oak desk (v61) |
| `house/evidence/v82_bathroom_beam.jpg` | v82: the client's photo from the bathroom's door beside the model (the slope up to the beam, the lower ceiling over the toilet, the mirror); the bathroom from above |
| `media-wall/inputs/photo_bathroom_from_door_27oct.jpg`, `photo_landing_doors_27oct.jpg` | The client's photos (27 Oct): the bathroom from its door; the landing's three doors (the chalkboard's writing blurred) |
| `house/evidence/v81_curtain_hall_bath.jpg` | v81: the curtain round the foot of the stairs (an option); the hall's radiator, switch and whole-wall tapestry; the bathroom's slope before and after, beside the client's photo |
| `house/evidence/v80_lower_stairs_ground_view.jpg` | v80: the lower flight's top steps before (through the wall) and after (inside it); the ground floor's Overhead with the living room |
| `house/evidence/v79_cupboard_stairs_views.jpg` | v79: the boiler cupboard's wider door, the top of the stairs, the steeper flight; the living room's In it, Above, On its own |
| `house/evidence/v78_landing_doors_curtain.jpg` | v78: the landing's doors frame to frame, the office's fanlight, the master's bed clear, the stair curtain (an option) |
| `house/evidence/v72_landing.jpg`, `v72_master.jpg`, `v72_bed2.jpg`, `v72_first.jpg` | v72: the landing's doors in the client's order, the master smaller, bedroom 2 bigger |
| `house/evidence/v71_phone_in.jpg`, `v71_phone_above.jpg`, `v71_master_alone.jpg`, `v71_kitchen_alone.jpg`, `v71_bed_card.jpg` | v71: a room three ways (in it, above, on its own) and the bed's card, on a phone and a computer |
| `house/evidence/v70_front.jpg`, `v70_back.jpg`, `v70_bath.jpg`, `v70_wc.jpg` | v70: the photo-textures outside (brick, roof); the turned toilets and the hollow bath |
| `house/evidence/compare_v69_bath.jpg`, `compare_v69_hall.jpg`, `compare_v69_office.jpg`, `compare_v69_kitchen.jpg`, `compare_v69_landing.jpg` | v69 B7: the client's photo beside each room's view |
| `house/evidence/b4_master_evening.jpg`, `b4_bath_evening.jpg`, `b4_bed2_evening.jpg`, `b5_landing_switch_day.jpg` | v69 B4/B5: rounded furniture and soft bedding; a light switch by the door |
| `house/evidence/b2_master_evening.jpg`, `b2_bed2_evening.jpg`, `b2_hall_evening.jpg`, `b2_bath_evening.jpg` | v69 B2: the drawn materials (pine grain, fabrics, the textured ceiling) |
| `house/evidence/b1_master_evening.jpg`, `b1_bed2_evening.jpg`, `b1_kitchen_evening.jpg`, `b1_office_evening.jpg` | v69 B1/B3: each room by evening with its own ceiling light and the house casting shadows |
| `house/evidence/now_dormer_v69.jpg`, `now_bath_v69.jpg`, `now_hall_v69.jpg` | The dormer from the garden (no white box or lines, its new top); the bathroom's corner; the hall's tapestry (v69) |
| `house/evidence/now_master.jpg`, `now_master_lift.jpg` | The master bedroom's storage for two; Lift the bed: the four boxes in the ottoman (v68) |
| `house/evidence/now_bed2.jpg` | The music room (v68): the L desk and keyboard tray, the chair-bed, the Kallax with drawers, the guitars and amp |
| `house/evidence/now_office.jpg`, `now_house_first.jpg`, `now_kitchen.jpg` | The office at 2.25 m; the first floor from Whole house; the kitchen (v68) |
| `house/evidence/compare_wc.jpg`, `compare_hall.jpg`, `compare_landing.jpg` | The client's WC, hall and landing photos beside their views (v67) |
| `house/evidence/compare_office.jpg`, `now_office.jpg` | The client's office photo beside the Office view: the two setups side by side (v66) |
| `house/evidence/now_hall.jpg`, `now_landing.jpg` | The entrance hall to the living room's door; the first-floor landing (v66) |
| `house/evidence/now_front_gate.jpg` | The front: the step, the drive and lawn on the street's level, the alley gate (v66) |
| `house/evidence/compare_bath.jpg`, `now_bath.jpg` | The client's bathroom photo beside the Bathroom view (v65) |
| `house/evidence/now_bed2.jpg` | Bedroom 2 as the music room (v66: cleared, the keyboard, the studio desk, the guitars and amp) |
| `house/evidence/now_master.jpg` | The master bedroom: the wardrobes as open frames in the alcove (v65) |
| `house/evidence/now_porch.jpg` | The entrance: the step, the porch, the bin cupboards' doors, the front door ahead (v65) |
| `house/evidence/now_first_fittings.jpg`, `now_lower_fittings.jpg` | From above (v57): the bathroom's fittings and bedroom 2's roof slope; the WC's toilet and small sink |

What the draft lacks (the gap the build closes): measured sizes for every room but the living room; wall thickness; real windows, doors
and stairs; the outside walls and roof; materials; per-room light; the slope as ground; the neighbours; the view out.

## 5a. Fitted (v64, the client: "Just fit everything now to best scaling and I'll add better measures later")

| What | Plan said | Fitted | Why |
|---|---|---|---|
| The master bedroom's alcove (airing cupboard's side) | 181 | 202 | the client's two 1 m wardrobes go in it |
| Bedroom 2's block (its edge from the back wall) | to z −166 | to z −180 | the drawers face the bed and must open (31 cm) |
| The master bedroom's alcove depth (the airing cupboard's front) | 89 | 58 | the client: "as deep as the kallax wardrobe and aligns with boiler cupboard" |
| The airing cupboard's door | 67 wide | 48 wide | it fits the shallower cupboard |
| The kitchen's cupboard (its front from the front wall) | 82 | 60 | the client: "in line with the fridge" |
| The first floor's stairwell (its end) and landing | to z 170 | to z 229, the flight's top | the landing photos: the stairs come up to the landing |
| The living room's top landing (`geometry.LANDING_D`) | 90 | 32 | the hall's photo: the door down sits about 1.3 m from the front door |
| The stairwells' width (both floors) | 92 (lower), 89 (first) | 59 (x 408–467) | the living room's measured flight (the client: "the living room has accurate measurements so adjust the other rooms"); the hall's floor runs across its door |
| The landing wall (v72, the client) | doors at the plans' places | bedroom 2's 94, the cupboard 100, 15, the master's 94, 34 to the end | the client's order and sizes; it adds up to the wall's 339 |
| Bedroom 2 / the master (v72, the client) | the line at z 13 | z 54.5 behind the wardrobes (an L) | "bigger on the right side"; the master 3.81 past its alcove |
| The hall/garage wall (v69, the client) | the hall from x 284 | from x 303.5 | "the whole wall" moves into the house, in line with the living room's breast (measured): the garage 2.91, the hall 1.02, the meter cupboard 38 inside: measure |
| The front door's opening (now the open porch) | x 347–431 | x 344–426 | the porch's width on the plan (the client: a step, a cupboard each side, the door ahead) |
| The front wall (v68) | 780 from the back | 808.4 | the client: the office "is 2.25m wide on the desk side"; the landing can't give way, so the front is out 28.4 (the master 4.5 m, the agent's 4.45). The porch and its cupboards keep the plans' depth, the hall runs on: measure |
| The back roof's pitch (v68) | 35° (estimate) | 50° | three photos: the bathroom's slope meets the ceiling by the sink; the Kallax (147) stood in front of bedroom 2's low wall |
| Bedroom 2's low wall (v68) | to z −180 | to z −219.5 | where the 50° slope is 150 high: the double bed in front of the door with it open, the Kallax drawers out (the client) |
| The office window (v68) | x 333–429 | x 327–423 | the client: "make the window centre to the room" |

## 6. Sizes deduced until measured (v58: `house/survey_data.py`, checked by `house/check_model.py`)

| What | How | Result |
|---|---|---|
| Each plan's scale | The living room runs the house's full width inside (467, **M**): inside width in pixels ÷ 467 | 63–65 px a metre, even both ways; the agent's labels read ~5% big |
| Every room's size | Off the corrected plans at that scale (overlays: `house/evidence/overlay_*.jpg`) | e.g. kitchen 3.65 × 3.46, bedroom 2 2.70 × 3.46, master 2.70 × 4.22 |
| The house inside | Plans at the living room's scale | 467 × 780 on all three floors |
| Floor heights | The living room's 235 ceiling + 25 of floor (E) | −260, 0, +260 |
| Back openings | The back photo, the living room's measured window (235 wide, 73 in) as the ruler | kitchen window 67–249, back door 254–330 (the plan says 255–333), WC window 410–460; the dormer's windows |
| Front openings | The front photo, the garage door (213 × 198, standard) as the ruler | garage door 44–257, the porch 344–426 (v65), master window 56–239, bedroom 3's 333–429 |
| The roof | Front gutter ~480 over the drive (photo); back gutter just over the living room's window; 35° (E) | ridge 675, 242 behind the breast face; the dormer's flat roof at 530 meets the back slope at z 34, where bedroom 2 ends (37) |
| The dormer | 21% in from the east end and 14% from the west (the back photo) = the plan's black marks (98 and 57) | x 90–412 |
| The boiler cupboard (V1.8) | The client: out into both bedrooms, in the master in line with the wardrobes' front | its end at the wardrobes' front (z 118.5), 10 into bedroom 2 (E, in Measure), its door 48 (E) |
| The boiler cupboard (V1.18) | The client: "normal sizing ... the normal sized door ... stick out alcove wall into both rooms", shifting the master's wall as needed | inside 89 × 71, a standard door 71 in its lining (E: a 686 leaf); the wall between the bedrooms 7.5 into the master; 17.5 out into each bedroom (E, both in Measure) |
| The wardrobes and the cupboard (V1.20) | The client's picture: "wall should line up with wardrobes ... shift the boiler room wall slightly too to stop the doorframe overlap" | the wall between the bedrooms at z 79.5–85.5 (the wardrobes' front 143.5, the cupboard's face); the cupboard 58.5–143.5 with its walls, 21 into bedroom 2 (E, in Measure); the bed and bedsides 17.5 along |
| The kitchen door (V1.20) | The client: "more centre with the area space between stairs and bathroom" | in the middle of the lower landing, z -115.5 to -52.1 (63, as before); the bar to -123 |
| The bathroom's wall over the stairs (V1.8) | The client: 5–10 cm further into the bathroom | 7.5 in (`survey_data.BATH_1` z −51.65) |
| The cordyline (V1.3; V1.8 back) | The back photo, sized against the house: by the path near the right-hand fence about 4.5 m out, its crown to about the living room window's top; in our garden (the client, 29 Oct) | about 5.6 m tall, forking at 2 m into six heads, the crown 3.8 m across (`survey_data.PLANTS`, E) |
| The far end's trees (V1.4) | The view photos on v48's fitted camera (`garden_window.py`, in git history) (the lawn ends at about 17 m, the far fence at 25); in leaf as the summer photo | a conifer about 19 m out, 11 m tall; a clump of four pale stems behind it, 15 m, crown 9 m; next door's dark evergreen, 7.5 m (`survey_data.PLANTS`, E; not for the tape) |
| The far fences (V1.4) | The view photos: a close-board fence across each garden's end | 180 high, 25 m out (`garden3d`; next door's in `model._house_shell`) |
| The gardens' things (V1.6) | The view photos: the round black table and three folding chairs by the house on the path's side; past our east fence a trampoline about 13 m out and a brown shed with a grey shingle roof at its end; west, next door's orange-brown shed at its end | table 90 round, 72 high; a 3.05 m trampoline; the sheds about 3.3 × 2.7 and 1.9 × 2.5 m (`survey_data.GARDEN_THINGS`, E) |
| Beyond the fences (V1.4) | The view photos: a long low building with grey sheet roofs just past the fences (at the sheds' height from upstairs); the valley's trees; the hill opposite with its terraces, its top a little above the living room's eye in the middle and right, higher to the left | the building 40 × 24 m, roofs 2–3.7 m over the lawn; trees 55–110 m out; the hill from 90 m, its top 220 m out, 9–60 m up (`survey_data.BEYOND`, E) |
| The ground round the house (V1.3) | The street's level (the drive, −15) in front, the garden's (−260) behind, the slope between under the houses' depth, as the terrace is built into the hill | `room3d.js` `outdoor()` |
| To measure | The living room's stairs (a stand-in) end ~60 past the first-floor plan's landing; the living room window's height (the photo reads it taller than 124) | |

## 7. What's still missing (ask for it: `SURVEY.md`)

Measurements of every room but the living room; ceiling heights below and above; floor thickness; window and door sizes; the stairs;
the outside heights; the alley; both gardens' widths; the kitchen and bathroom fittings; each room's finishes; photos of every room
(the shot list in `SURVEY.md`), the sides of the house, the alley, the front garden from the house.
