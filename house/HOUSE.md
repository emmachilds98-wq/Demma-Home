# The whole house: what we know

The living room's media wall is the first project (`media-wall/`). The client plans to do the whole house in time
("Eventually we're going to build the whole house so keep any info you need", 24 Oct 2026). This file keeps every fact about the
house in one place so later rooms start from it. Sizes are the agent's unless marked; the living room's own measured sizes win
over the agent's (they are in "The living room, measured" below and `media-wall/src/geometry.py`).

## Where it is (the client, 24 Oct 2026)

**The address is never written down here, in the page, the PDFs, commits or pull requests (the client, 25 Oct: "No one should ever
find out my address through you").** What it tells us: the end house of a terrace; its long walls run on a bearing of 104°, so **the
back of the house faces 14° east of north** (north-north-east; OpenStreetMap buildings and roads).

- **Sun through the back windows** (the sun's path at about 51.5 N): only from late March to mid September, early in the morning (05:30–08:30
  BST at midsummer), low (5–30° up) and from the right, 45–80° off straight out; at midsummer a last grazing few minutes from the left
  about 20:00. From the autumn to the spring equinox, none. The front (south-south-west) gets the sun the rest of the day.
- The living room: no sun on the TV or the screen wall, ever; by day even, cool north light. The 3D room's daytime sun is 7 am in June
  (`geometry.SUN`, 61° right of straight out, 18° up).

## Sources

| File | What it is |
|---|---|
| `media-wall/inputs/agent_floor_plans.png` | The selling agent's floor plans, three floors, 1224 sq ft (113.8 m²) in all |
| `media-wall/inputs/photo_house_rear_24oct.jpg` | The agent's photo of the back of the house and the garden |
| `media-wall/inputs/photo_garden_summer_24oct.jpg` | The garden in summer, taken from the dormer (1449 × 2576) |
| `media-wall/inputs/photo_garden_window_24oct.jpg` | A frame of the client's video through the living room window |
| `media-wall/inputs/photo_view_full_24oct.jpg` | The whole view out of the back from upstairs (ultra-wide, overcast, spring): the best one |
| `media-wall/inputs/photo_view_wide_24oct.jpg`, `photo_view_centre_24oct.jpg`, `photo_view_right_24oct.jpg` | The same view: wide, centre (looking down) and right |
| `media-wall/inputs/room_sketch_accurate_mm.png` | The client's measured sketch of the living room (mm) |
| `media-wall/inputs/photo_stairs_*`, `room_photo_*`, `photo_current_living_room.png` | The living room and the stairs up from it |

## How the floors stack (the client, 25 Oct 2026)

"The kitchen is directly under the living room and bathroom and bedroom 2 above that. It is 2 floors at the front and 3 at the back as
it's on a hill. The alley has stairs down."

- **Three storeys at the back, two at the front:** the lower ground floor (kitchen, WC, landing, store) is under the back half only,
  under the living room, at the garden's level; at the front the ground floor (hall, garage) is at the street and the first floor over it.
- **Stacked:** the kitchen under the living room; the bathroom and bedroom 2 over the living room; the master bedroom and bedroom 3 over
  the hall and the garage.
- **The alley:** down the side of the house (the end of the terrace, the gate side) from the street to the back garden, with stairs
  down; the gate at the bottom by the back of the house.

## The client's corrections to the agent's plans (25 Oct 2026)

"I've attached floorplans but they were wrong and I've tried to correct ... black ink being solid walls where the room has more shape. I
will eventually confirm exact measurements." Files: `media-wall/inputs/plan_lower_ground_corrected_25oct.jpg`,
`plan_ground_corrected_25oct.jpg`, `plan_first_corrected_25oct.jpg`. Read by the agent (marked "to confirm" where it's our reading):

- **Lower ground floor (kitchen level, the garden door):**
  - Kitchen 3.79 × 3.66 (agent): the door to the back garden top left; a window on the back wall, right of the door (the purple mark).
  - **A second cupboard** by the store (the black block at the kitchen's bottom left): its door faces towards the kitchen's entrance, so
    the store and this cupboard make a cubby with two doors (the client, 25 Oct). Sizes to come. v66, the client: the cupboard "is in line
    with the fridge not sticking out so much": its front fitted to the fridge-freezer's (60 from the front wall).
  - WC 1.64 × 1.88 (agent), a window on the back wall; **its small sink on the wall by the kitchen** (the maroon mark; the client, 25 Oct).
  - The landing and the stairs up; the store under the stairs.
  - **The "secret room"** (the client's words): the space the agent called unexcavated, under the garage, at the front.
- **Ground floor (street level):**
  - **Living room** 4.95 × 3.65 (agent; measured 467 × 347, ceiling 235): the window on the back wall right of centre (the orange mark).
  - Solid walls (black): the chimney breast between the living room and the garage (our media wall's breast), a block in the
    window wall's left corner (the NW box we draw), and the bulk beside the hall stairs.
  - Entrance hall with the stairs up, two stores either side of the front door, the garage.
  - **The entrance (the client, 25 Oct):** "there's a step before the front door and 2 cupboards, one left and right, then front door
    ahead": an open porch (white inside, the pediment over it), the red step, a **bin cupboard** each side (doors into the porch), the
    white front door ahead. Modelled v65. The right cupboard takes a 240 L wheelie bin (just: to measure); the left reads 39 wide
    inside, so recycling boxes (which bins? to ask).
  - **The hall (the client's photos, 25 Oct; modelled v67):** grey carpet; the living room's stairs boxed in on the hall side (an orange
    tree tapestry hangs on it); where the box ends, the white door down to the lower stairs with a grille over it; by the front door the
    mirror over a black bench on the party wall, a shoe rack each side of the front door, the radiator on the other wall, a pendant bulb.
    The front door from inside: cream, four panels and two small lights, a brass letterbox.
  - **The stairs (the photos):** the living room's flight runs straight up between a wall and a white newel and banister, grey carpet,
    an LED strip along it; the lower flight runs down under it between walls, grey carpet, a handrail on the left going down, laminate at
    the bottom. Fitted v67: the top landing ends where the hall's photo puts the door down (the plans' landing).
  - **The alley gate (the client, 25 Oct: "add the alleyway gate inbetween my house and next door to cover the alley"):** a
    close-board timber gate across the alley in line with the fronts, about 180 high on two posts (as next door's in the front photo;
    a ready-made 0.9 × 1.8 m close-board gate, posts and fittings, about £120–180: E). Modelled v66.
  - **The hall and the living room's door (the client, 25 Oct: "make the door align with the given gap from the hallway to the living
    room, the living room has accurate measurements so adjust the other rooms"):** the stairwells fitted to the living room's measured
    flight (59 wide, x 408–467; the plans read 92): the hall's floor now runs right across the door (x 316–399), the flight plastered
    off from the hall. Modelled v66.
- **The WC (the client's photo, 25 Oct; modelled v67):** a yellow suite: a low-level cistern under the window with its flush pipe, the
  pan; the small wall-hung basin on the right as you go in (the plan's maroon mark) with four white tiles over it, the roll holder; white
  pipes; grey wood-effect laminate; a yellow and white ceiling shade. The kitchen from its door (photo): as modelled.
- **First floor:**
  - **Bathroom** 2.04 × 2.38 (agent): the sink on the left, the toilet ahead (the client), the bath along the right; a back window. Solid
    walls (black) in its top-left corner and beside the door (the room has more shape than drawn). **The sink cabinet** is the maroon
    mark on the left wall; the toilet the blue mark ahead, under the window (the client, 25 Oct).
  - **Bedroom 2: the spare room**, 2.91 × 3.65 (agent): the back window (the brown mark); **the roof slope** on the right wall, top (the
    black block: "the dormer roof", the client, 25 Oct).
  - **Master bedroom** 2.91 × 4.45 (agent), the front window.
  - **Bedroom 3: the office and gaming room**, 2.04 × 2.17 (agent), the front window.
  - Airing cupboard off the landing. **The top landing is more square** than drawn (the plan shows a slim strip); **the green mark at the
    top of the stairs is the landing's rough size** (the client, 25 Oct).
  - **The boiler cupboard sticks out into both bedrooms** (the client, 29 Oct): in the master in line with the wardrobes' front; into
    bedroom 2 by an amount to measure (10 cm drawn).
  - **The bathroom's wall over the stairs**, by the sink, about 7.5 cm further into the bathroom than drawn before, for more room over
    the stairs (the client, 29 Oct: "roughly 5-10 more cm").
- **Both gardens:** the back (about 25 m, the photos) and the front (the agent's photo, below; sizes to come).

## Floors (the agent's plans)

The house is built into a slope: the garden is at the **lower ground floor**, so the **living room (the agent's ground floor) is one
storey above the garden**, and the bedrooms are above that, with dormers in the roof.

**The first floor is rooms in the roof** (the client, 25 Oct: "Maroon is the sink cabinet. Green mark at top of the stairs is rough landing area size. Black block on bedroom 2 is the dormer roof as the rooms are built in a loft conversion when it was built originally. Flat top roof on the bathroom and bedroom 2 side. the maroon mark on the kitchen toilet is where the small sink is."): built
that way from new. At the back a **flat-roofed dormer** over the bathroom and bedroom 2 (the four casements in the rear photo); where
the dormer stops, the pitched roof comes into bedroom 2 as a sloping ceiling (the black block on the plan). Heights to measure.

| Floor | Area | Rooms (agent's sizes) |
|---|---|---|
| Lower ground (garden level) | 369 sq ft | Kitchen 3.79 × 3.66 m (12'5" × 12'0"); WC 1.64 × 1.88 m; landing and stairs up; store; door to the garden; a large unexcavated area |
| Ground (the street door) | 424 sq ft | **Living room** 4.95 × 3.65 m (16'3" × 12'0"), rear window; entrance hall and stairs; garage; two stores |
| First | 431 sq ft | Master bedroom 2.91 × 4.45 m; bedroom 2 2.91 × 3.65 m; bedroom 3 2.04 × 2.17 m; bathroom 2.04 × 2.38 m; landing; airing cupboard |

The living room measured: 467 wide along the window, 347 from the window to the alcove's back wall, ceiling 235 (cm; the client's sketch).

## The living room, measured (the client's sketch, `media-wall/inputs/room_sketch_accurate_mm.png`; it overrides every earlier guess)

The window wall is north, the media wall south (shared with the hall and the garage); the TV alcove at the east end, the stairs box and
the door to the hall at the west. In mm (the sketch isn't to scale: trust the numbers).

| Item | Size and place |
|---|---|
| Room | 4670 east–west, along the window × 3470 north–south, the window wall to the alcove's back wall |
| Ceiling | 2350 |
| Skirting | 60 high × 20 thick |
| Window (north wall) | 2350 wide, starting 730 from the east wall |
| Radiator (under the window) | 1370 long, ending 130 inside the window's west end (about 1580–2950 from the east wall) |
| Small box, north-west corner | 230 × 220 (pipe boxing? to confirm) |
| TV alcove (south wall, east end) | 1860 wide (the east wall to the breast) × 380 deep, floor to ceiling |
| Chimney breast | 1175 wide, 380 out into the room (390 on its west side) |
| West recess (breast to the stair box) | about 1045 long × 390 deep |
| West end | the stair box and the doorway; the sketch's 935 / 1045 / 660 / 130 / 820 / 140 are ambiguous: ask before relying on them |
| The socket | one single socket about 30 up, on the east (side) wall just in front of bay 1 (the client: "just in front of the xbox game drawer, raised off the ground"); becoming a double |
| The ceiling light | "where the alcove starts on the right, in the middle of the room": about 1860 from the east wall, 1735 from the window wall |

## The back of the house (the agent's photo, left and right as seen from the garden)

- Red brick, a tiled roof with a dormer of four casements; white uPVC windows with Georgian bars throughout.
- **Lower ground:** a window and a glazed door to the garden (the kitchen), a small window to the right.
- **Living room:** the middle window, three sections (0.24 / 0.52 / 0.24 of its width), a row of top lights, Georgian bars
  (`geometry.WINDOW_DESIGN`). Measured: 235 wide, 124 tall, sill 88 above the floor.
- **The living room floor stands about 2.6 m above the lawn** (estimated from the photo: the lower ground floor's door and windows
  under it, one storey of about 2.4 m plus the floor). Seen from the room, the garden is looked down on: the near lawn sits below the
  sill and only shows from close to the glass.
- A downpipe on the right corner; a gate in the gap on the left side; the neighbours' conservatory is on the right.

## The front of the house and the front garden (the agent's photo, `media-wall/inputs/photo_house_front_25oct.png`; left and right as seen from the street)

- **The end house of a terrace** of four or five, red brick, a tiled roof running along the terrace, white uPVC windows and fascia.
  The terrace steps down the hill to the left; the neighbour on the right is a separate house with a brown timber gate and fence.
- **Ground floor:** the front door on the left under a white pediment porch (two white pilasters), one step up; the **garage** on the
  right with a white up-and-over door. A downpipe between ours and the next house.
- **First floor:** a wide casement window over the garage (the master bedroom) and a smaller one over the porch (bedroom 3, the office
  and gaming room, by the plan).
- **The front garden:** a concrete drive in front of the garage, the width of the garage, to the pavement; a small lawn to the left of
  the drive, in front of the porch, with a low red-brick wall along its left side (the neighbour's paved front) and plants along the
  pavement edge; on the right of the drive a strip of lawn by the neighbour's fence with a young tree (rose or fruit), bulbs and a short
  timber post at the drive's corner. The pavement and the road in front.
- Sizes to come: the drive's length, the lawn's width and depth, the garage door's width.

## The garden (left and right as seen from the house)

- A lawn about the width of the house, running away from it; a paved path down the left side.
- Cordylines (cabbage palms) by the path, a big clump near the house, in our garden by the path (the client, 29 Oct 2026: "the palm tree is in my
  garden and not next door"). **No patio across the back** (the agent's photo of the back, 25 Oct):
  the lawn runs to the house wall and the concrete path runs down the left (looking out) from the back door to the end; the round
  table and chairs in the view photos stand by the house on that side (to confirm).
- Fences: close-board, about 180 high, on the left (looking out); a lower slatted fence, about 120, on the right, with a timber gate
  in it by the house (to the side passage of the end-of-terrace). A rotary dryer on the lawn.
- The left-hand neighbour: a gravel garden with pots and a lawn beyond; a low brown fence between.
- Close-board fences on both sides; tall trees with fine, divided leaves (ash-like) fill the far end in summer; the neighbour's
  trampoline over the right fence.
- The summer photo was taken from the dormer (the roof's tiles at its foot): one storey higher than the living room, so it looks down
  more steeply than the room does. The video frame is from the living room itself.
- Summer: green and full (the summer photo); spring: bare trees (the video, the view photos).
- **About 25 m long** to the far fence (the client, 24 Oct). The photos see the lawn to the trees at about 17 m (the camera's direction
  from the fences, its height from the man on the lawn; the neighbour's shed fronts line up with it); the rest is under the trees. A birch clump and a conifer at the end.
- **Beyond:** a long low building with grey roofs behind the end fences, then a valley and a hill of terraced houses opposite, a little
  above the living room's eye level. The right-hand neighbour has a shed with a shingle roof at the end (a trampoline, a rotary dryer).
- **Camera heights** (from the view photos, v48's `garden_window.py`, in git history): upstairs window about 6.7 m above the lawn; the living
  room's standing eye about 4.1 m.

## The street (the client, 25 Oct 2026)

- "Houses on the right of the alley are just mirrors of the design of my house ie garage left door right, living room leads to the left
  and so on": the terrace past the alley mirrors ours (its first house's end wall on the alley). To the other side, the terrace as ours.

## The kitchen as it is (the client's photos, 25 Oct 2026)

"This is a few images of the kitchen and how it looks currently. The chalkboard doors show how the two cupboards appear on your right as
you walk in the kitchen. We've done this chalkboard style with the top floor boiler cupboard too." Photos:
`media-wall/inputs/photo_kitchen_window_run_25oct.jpg`, `photo_kitchen_corner_fridge_25oct.jpg`, `photo_kitchen_now_25oct.jpg` (the
newest: the laminate floor and the breakfast bar). And `photo_kitchen_cubby_doors_25oct.jpg`: the store's door and the cupboard's door at right angles, the cupboard's with two vents.

- **Units:** white gloss doors and drawers, black T-handles, on black legs (no plinth); an L along the east wall and round the front
  corner, ending with the white fridge-freezer (water dispenser) against the boxed-in cupboard's white side.
- **Under the window:** the sink (a spring tap) over the black washing machine, a drawer unit; the worktop runs to the corner.
- **East wall:** the white slimline dishwasher, a unit, the black freestanding electric cooker, two units.
- **Wall units** over both runs; **black bevelled metro tiles** between (light grout), to the ceiling behind the cooker.
- **Worktop:** black speckled laminate. **Floor:** grey wood-effect laminate (it was cream vinyl tiles). **Ceiling:** textured white,
  LED battens. **Breakfast bar:** black top on chrome legs by the door, two black chairs.
- **v73, the client:** "the kitchen bar on the left as you come in is in line across the wall. then the boiler is in the corner next to
  the door above this table. it should not overlap the door ... no unit on left of washing machine, take that out, shift the door then
  fix the side table on the wall": the bar fixed flush on the door's wall (legs on the room side), **the boiler** on that wall over the
  bar's door end (not upstairs: the boiler cupboard keeps its shelf), the window run ends at the washing machine, the door moved to the
  landing's stairs end (z −100.5 to −37.1) so its frame and swing clear the bar and the boiler.
- **The cubby:** in from the landing, on your right: the store's door (ahead) and the cupboard's (left), chalkboard black. The airing
  cupboard upstairs ("the top floor boiler cupboard") is chalkboard too.
- Sizes: standard units, placed off the photos (`house/survey_data.py` `KITCHEN`); to measure.

- **v68, the client:** "dishwasher on left with sink above slightly to the left": along the window the dishwasher next to the corner,
  the sink just left of it, the washer, a unit; a unit where the dishwasher was on the tiled wall.

## Bedroom 3, the office (the client's photos, 25 Oct 2026)

"Bedroom 3 / office - the desk will be replaced with a straight oak desk. One of the PCs will go to the living room but the one next to
another setup will stay. As well as the overhead shelf." Photos: `media-wall/inputs/photo_office_desk_wall_25oct.jpg`,
`photo_office_corner_25oct.jpg`.

- **Now:** an L desk (dark top) under the window and along the side wall (the party wall), two setups; the window with a dark roller
  blind and a radiator under it; a long black floating shelf high on the side wall with ivy along the top of the walls; a white
  pegboard; stacked monitors; grey carpet; purple lamp light.
- **The plan (modelled, v61; v66):** a straight oak desk along the side wall, wall to wall (195), under the shelf and pegboard, **two
  setups side by side** (the client, 25 Oct: "remember its two setups in the bedroom 3 also side by side"): the stacked pair with the
  pink keyboard and its white PC under the desk at the back, the side-by-side pair with the black keyboard, the mic on its boom arm and
  the glass PC under the desk by the window; a chair at each. The shelf stays.

- **v68, the client:** "the office / bedroom 3 is 2.25m wide on the desk side ... make the window centre to the room": the landing can't
  give way (its photo), so the front wall is 28.4 further out than the plans read (the room 225, the master bedroom 450); the window
  in the middle (x 327–423), the oak desk wall to wall, the tall cupboard beside the window. The porch's cupboards keep the plans' depth.

- **v69, the client:** the tall cupboard goes ("we will not be keeping it": out of the model); the office's door is a white bifold.

## Bedroom 2 (the client's photo, 25 Oct 2026)

"Bedroom 2 - no major plan for this room but we've discussed a possible switch to a music room maybe with a pull out bed for guests but
we have a lot of storage under this bed so would need to optimise. Furniture can be removed for upgrades. Also shows the block in the
wall as I put in the plans." Photo: `media-wall/inputs/photo_bedroom2_25oct.jpg` (from the door, towards the alley side).

- **The block:** the closed-off low corner by the dormer window (outside the dormer, the roof comes down); past it the sloping ceiling
  is open over the side wall (the chest of drawers, the airer and the bed's head stand under it).
- **As it is (modelled, v62):** black desk under the window (monitor, laptop, chair), dark roller blind, red gloss 2 × 4 shelving
  against the block, cat tree, black chest of drawers, airer, double bed with a black headboard against the side wall, grey carpet.
- **v64, the client:** "Take out everything in bedroom 2 other than the drawers, desk and bed, plus red shelving. Black drawers go along
  the wall sticking out and drawers pull towards the bed": done; the block's edge fitted 14 cm back so the drawers open (31 cm).
- **The music room (the client, 25 Oct: "bedroom 2 music room confirmed"; v66: "you can remove everything from the bedroom 2 in order
  to make the best possible music room in this space. 2 guitars, amp, large keyboard with more to come, you can choose other items for
  now"; modelled v66):** everything out (the desk, drawers and red shelving go elsewhere). In, one line each (rough costs E):
  - the large keyboard (88 keys, about 134 × 35, keys at 76) on its stand with a bench, on the landing-side wall;
  - a studio desk under the window (140 × 70, a monitor riser; about £150), two 5-inch monitors (about £150 the pair), the audio
    interface, a screen, a chair: you face the window, the room behind you;
  - the two guitars on a double stand (about £25) and the amp (a 1 × 12 combo, about 47 × 24 × 43) with a pedalboard under the slope,
    where it's too low to stand anyway;
  - acoustic panels at the desk's side reflection points (60 × 60 × 5, about £60 for six), a rug (120 × 170, about £60);
  - the day bed with three drawers against the front wall (IKEA HEMNES day-bed, about 88 × 211, 168 open, about £300): seating, the
    guest bed, the drawers for cables and gear. Room left for what comes next.

- **v68, the client:** "enough space to have a double bed infront of the door and still open the door the full way ... the kallax drawers
  across the alcove and able to pull those drawers out": the back slope is 50° (not 35°), the low wall where it is 150 high (z −219.5).
  Modelled: a custom L desk in birch ply (168 × 70 under the window, the 88-key on a pull-out tray, keys at 72; the return 98 × 65 on
  the landing wall; £250–450, E), an IKEA LYCKSELE chair-bed against the front wall (80 × 100, a bed 80 × 188), the Kallax 2 × 4 across
  the alcove with four 2-drawer inserts, the guitars and amp in the front corner, panels, a rug. Checks: the double bed (190) and the
  door's swing (73) fit the 270 with 7 to spare; the drawers pull out clear; the chair-bed opens clear of the desk.

## The master bedroom (the client's photo, 25 Oct 2026: `media-wall/inputs/photo_master_bed_25oct.jpg`)

"Current bed in master bedroom I have two 1m kallax wardrobes to make storage in the left side gap between walls. Bed in the middle facing
the door. Also room for improvement." The gap: "Left wall behind airing cupboard in my master bedroom".

- **As it is:** a pine ottoman bed (lift-up base, slatted headboard) against the end wall, in the middle, facing the door; a pine 3-drawer
  bedside on its left, a pine chest of drawers on its right; a clothes rail; grey carpet.
- **The plan (modelled, v63; fitted v64):** the two 1 m wardrobes side by side in the alcove behind the airing cupboard. The plan read
  the alcove 1.81 m; fitted to 2.02 m (the airing cupboard 21 cm narrower) until the client measures.
- **v65, the client:** "the master bedroom alcove is as deep as the kallax wardrobe and aligns with boiler cupboard, it is also only the
  frames with no doors right now": the alcove fitted to the wardrobes' depth (58; the plan read 89), its front in line with the boiler
  (airing) cupboard's; the wardrobes drawn as open frames (a shelf and rail in one, shelves in the other).

- **v68, storage for two (modelled):** the bed in the middle of the open wall; the same pine bedside each side; the chest under the
  window (72 high, under the 75 sill); the ottoman lifts from the foot on gas struts with four boxes inside (**Lift the bed** in the
  viewer); each 1 m frame alike: a top shelf, a rail, three KOMPLEMENT drawers (100 × 58, 16 high), boxes on top to the ceiling; a BILLY
  (40 × 28 × 202) between the wardrobes and the bed. The room 4.5 m with the front wall out (see bedroom 3).

- **v70:** the way past the bed's foot to the window is about 58 wide (the bed 212 long from the end wall): tight; measure.
- **v69, the client:** the BILLY would block the wardrobe: out. "only put in solutions that save or optimise space and inc storage".

## The landing and the first floor's sizes (v72, the client, 26 Oct)
- **v81, the client:** the boiler cupboard's door fills the space between the two bedroom doors, which stay where they are (fitted: its
  frames meet theirs, the leaf 73, the cupboard 85).
- **v82, the client's photo of the landing** (`media-wall/inputs/photo_landing_doors_27oct.jpg`): bedroom 2's white cottage door (a
  hook rail over it), the chalkboard door as tall and nearly as wide, then the master's; a sliver between the first two frames, about
  15 between the chalkboard's and the master's, the master's switch just right of its frame.
- **v79, the client:** the boiler cupboard's door is wider, towards the master (fitted: the cupboard 70, its door 58). The master's door
  sits just left of its light switch. At the top of the stairs there's at least double the room to stand (fitted 65), the banister
  ending further back: the flight is steeper than drawn (fitted treads 19.25).
- **v78, the client:** the landing's doors "fit better within their gaps": bedroom 2's in the corner, the boiler cupboard's frame straight
  after, 15, the master's (76), about 40 to the corridor's end. The office's door has the same glazed fanlight over it as the
  bathroom's. The living room has no door up the stairs; they're thinking of a curtain at the bottom step, hung from the bulkhead (an
  option in the 3D room).
- **v77, the client** (photos from the stairs and up the flight): no door or wall between the landing and the stairwell (the banister
  only). The bathroom door sits in the corner beside bedroom 2's (about 68 wide, a fanlight over it). Beside it a short wall the
  banister ends at, in line with the door. Over the stairs the bathroom's wall sits a little behind that line, over the bottom step
  (an LED strip along its foot): the stairwell opens a little further back than the landing, for the headroom.
- **v76, the client:** the boiler cupboard is about 60 wide and holds towels and boxes (no boiler: that's in the kitchen); the
  bathroom end set back to fit it (the bathroom about 1.8 × 2.7).
- **v75, the client** (picking one of three sketches): the bathroom comes out over the bottom of the stairs (a box) to where the
  stairwell opens; its wall and door in one line with the box's front, the banister ending there; bedroom 2's door in the corner, the
  boiler cupboard small (42), the master's door as before. The bathroom about 1.8 × 2.9.
- **v73, the client:** the bathroom's front wall comes forward to the wall by the banister (the stairwell runs to it, the wall steps
  back over the stairs for headroom); the boiler cupboard smaller (75), bedroom 2's door shifted along. In the master, 42 past the door's
  frame the side wall comes out 19 (more depth for the office: 2.03 wide), a little alcove by the door (photo
  `photo_master_alcove_26oct.jpg`; the client confirmed it's the master).
- From the bathroom corner: bedroom 2's door, the boiler cupboard 1 m wide, 15, the master's door, about 40 to the corridor's end (the
  master's light switch in the middle of that gap). "Right" is the office end, seen from the stairwell. Bedroom 2 is bigger on that
  side (it runs on behind the master's wardrobes); the master is smaller; a king bed in the master, a double in bedroom 2.

## The landing (the client's photos, 25 Oct 2026; modelled v67)

- Grey carpet; the stairwell along the west side with a white post-and-rail balustrade (two rails under the top rail); the bathroom door
  at the north end (white, a cottage door like the rest: client, 26 Oct; the wood in an old photo) with a glazed fanlight over it; the airing cupboard's chalkboard door and the bedrooms' doors on the east side; the
  loft hatch in the ceiling, a pendant bulb, a smoke alarm; at the top of the stairs a mirrored wardrobe and a black shelf unit.
- Bedroom 3 (the wide photo): a tall white cupboard (one door, two panels) in the corner by the window (modelled v67).

- **v69, the client:** "door for the bedroom 2 sits right in the corner next to the bathroom, then imeddiately the boiler cupboard with a
  frame, then about 15cm gap then main bedroom door and then another roughly 45cm gap": modelled (bedroom 2 now 2.70 × 3.22, the
  boiler cupboard and the master's alcove moved back with it, 58 deep); the last gap reads 83 on the plans: measure the landing wall.

## The bathroom (the client's photos, 25 Oct 2026: `media-wall/inputs/photo_bathroom_sink_25oct.jpg`, `photo_bathroom_bath_25oct.jpg`)

- **As it is (modelled, v65):** on the left the white gloss vanity (basin, black tap; two doors, a drawer over a door) against the side
  wall under the slope, a slim white cabinet with round vents beyond it; the low corner boxed in and tiled (the plan's black mark), its
  side running up the dormer's cheek; the close-coupled toilet under the frosted window; the bath along the right from the window wall
  to by the door, a ceiling-hung rail, a white curtain, a black shower head; stone-effect grey wall tiles (60 × 30), black
  marble-effect floor tiles (60 × 60).

- **v68, the client:** "the wall above the sink doesnt incline across the whole wall. it goes up to around the sink area then changes
  angles to be more straight": the back slope is 50°; from the tiled box (125) the slope reaches the ceiling over the slim cabinet and the
  sink, then the wall goes straight up.

- **v69, the client:** "where the wall next to toilet slopes up before going straight up" (the three photos): by the toilet the wall
  goes up straight from the tiled box; over the box's front the ceiling slopes up, then flat (modelled).

- **v81, the client:** "it currently shows a large incline wall that covers most the sink area. you have images that show it actually
  cuts off and becomes straight again": from the box's top (125) a short straight rise, then the slope, steep, to the ceiling over the
  vanity's far end; over the sink the wall is straight. The tiles stop level all round at the box's top (the photo). Measure the slope.

- **v82, the client's photo from the door** (`media-wall/inputs/photo_bathroom_from_door_27oct.jpg`): the slope runs up from the box to
  a beam across the whole room; from the beam the wall goes straight up to the ceiling by the door. Over the toilet and the bath the
  ceiling is lower, just over the window (fitted: the beam's underside 219, its face 16; the slope at the roof's pitch). A mirror with
  a thin wood frame and a light bar over the basin.

## The entrance cupboards (the client, 25 Oct 2026)
- The cupboard on the garage side houses the electric box and the gas meter; the other is the bin cupboard. The wall between the hall
  and the garage runs in line with the living room's recess by the door (the client, 26 Oct: "the whole wall" moves into the house, so
  that cupboard is about half as wide and the garage wall lines up with the living room's alcove): the hall 1.02 wide, the garage 2.91.
- The hall's tapestry (v69): an orange tree-of-life hanging on the stairs' box from the corner by the door down. **v81, the client:** it
  covers the whole of that wall (the size to come). The radiator is about half a metre nearer the living room than drawn, its light
  switch above it and slightly right, between it and the shoe rack.
- **The stair curtain (v81, the client):** a dual curtain round the foot of the living room's stairs, the bottom step and the open side
  (an option in the 3D room).

## Not known yet (ask the client when a room needs it)

- Exact measurements of every room (the client will send them); the top landing's exact size; the roof slope's heights (where it starts, how low it comes).
- The front garden's sizes (the drive's length, the lawn), more photos if the client wants it modelled closely.

- Ceiling heights other than the living room's; floor-to-floor heights; wall thicknesses.
- The garden's width.
- The kitchen's exact run lengths (the layout is from the photos); where the stairs sit on each floor beyond the living room's stair box.
- Window sizes for every room but the living room.
