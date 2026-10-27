"""v18: the plant ladder is dropped (the client bought a plant stand); new: TV backlight sync, cushions, a plant uplight, a rug pad.
Next round (the client, "put in next run"): somewhere to keep the dining chairs, only if it's easy without changing the table much.
v17: ideas for later. These are suggestions only: they're not in the plan, the buy list or the costs. The viewer's Ideas tab, the
3D room's "Ideas (not in the plan)" buttons (all off by default) and the plan PDF's appendix all read this list.
Client (round 11): ideas welcome, but "small enough for this room" (the glass cabinet worry), so nothing here stands on the floor
bigger than a side table. Sizes are our own suggestions, in cm; positions are room coordinates (x from the side wall, z negative
into the room), as in geometry.py."""
import geometry as G

WZ = G.WINDOW_Z

# v34, client: "i like the large glass display case on the chimney breast": it is in the plan now (build_doc TRACK, section 4,
# step 9), so it left IDEAS; its own words stay here for the plan
CASE_IDEA = ("case", "A tall glass display case on the chimney breast",
     "90 wide × 85 tall × 12 deep, three glass shelves", (90, 170),
     "For collectibles, boxed games, 7-inch singles, small plants or ceramics, lit from inside, without a cabinet on the floor: 12 deep, so it "
     "stands no further out than a picture ledge. Oak frame from the offcuts (or painted black or white), a 4 mm toughened glass front that "
     "lifts off, three 6 mm glass shelves on pins, an LED strip under the top on the strips' app. Hung on a French cleat: about 16 kg empty. "
     "It takes the place of the two framed LPs, above the “now playing” ledge. In the 3D room, try what's inside it and its frame.",
     "On the breast, centred, from 137 to 222 (just clear of the sleeves on the “now playing” ledge, 13 under the ceiling); with the table by the stairs only.", True)

# (id, title, size, rough cost £, why it suits the room, where it goes, in 3D)
IDEAS = [
    ("glass", "Glass plant shelves across the window reveal",
     "two 10 mm toughened shelves, 235 × 18, at 130 and 170", (120, 200),
     "Your deep sill already takes a row of plants; two glass shelves above it make the window a green screen that still lets the light "
     "through. Studs into the reveal's sides, and a slim steel rod down from the head at the middle so a 235 span can't sag.",
     "Inside the window's 22 cm reveal, in front of the glass, clear of the curtains.", True),
    ("ctable", "The oak C-table at the sofa's open end (in your plan)",
     "top 45 × 30 at 62, 12 over the seat", (8, 15),
     "The ottoman end has no arm for a drink. Its top reaches over the seat; its foot stands beside the sofa, weighed down by a steel "
     "plate. Oak from the second Snowdon board.",
     "At the sofa's open end, towards the TV.", True),
    ("sync", "TV backlight that follows the picture",
     "a sync box on the HDMI line and a strip behind the TV (in place of the plain bias light)", (60, 130),
     "The wall behind the TV glows with the colours on screen, in the same app as the bars and strips, so a film can tint the room.",
     "Behind the TV, on the bias light's place; the box sits by the HDMI switch in bay 1.", True),
    ("cushions", "Cushions and a throw in the rug's rust and ochre",
     "two or three 45 × 45 cushions and a throw", (40, 90),
     "They tie the blue corduroy sofa to the rug and the oak, and soften the ottoman end. v20: the 3D room has three colourways to try "
     "(rust and ochre, blues, sage and cream) under Decor.", "The sofa.", True),
    ("plantlight", "A small uplight under the plant stand's bottom tier",
     "a plug-in spot, about 10 cm", (10, 20),
     "Throws the leaves' shadows up the wall at night, so the plants are part of the evening lighting with the room lights low.",
     "On the floor, under the stand's open middle.", True),
    ("rugpad", "A non-slip pad under the rug",
     "220 × 150, trimmed to fit", (15, 30),
     "Keeps the rug flat and square on the carpet where the sofa's open end and the coffee table push it.", "Under the rug, 2.5 inside its edge (the 3D room turns the corner by the door back to show it).", True),
    ("button", "A smart scene button by the door",
     "a small wireless button, about 5 × 5", (15, 25),
     "One press for the Bright preset coming in, a long press for everything off, in the same app as the bars' bulbs and the strips.",
     "By the door at switch height: drawn on the chimney breast's side, beside the door frame.", True),
    ("night", "A motion nightlight on the stairs",
     "battery LED strips under the treads' noses, or a single motion light", (15, 30),
     "A soft glow on the stairs at night with nothing to wire; it turns itself off.", "Under each tread's nose, all the way up.", True),
    ("clean", "A record-care caddy on your vinyl stand",
     "a slim oak box, about 8 wide × 9 tall × 26 long", (10, 20),
     "The carbon brush, a stylus brush and a cleaning fluid kept together, a step from the deck. (The pads drawer, where it was, is full: "
     "its two pads and three remotes take its 14 cm.)", "At the end of your vinyl stand's bottom shelf, outside the wire dividers.", True),
]

# where each 3D idea is drawn (room cm)
CASE = dict(x=((G.BREAST_X[0] + G.BREAST_X[1]) / 2 - 45.0, (G.BREAST_X[0] + G.BREAST_X[1]) / 2 + 45.0), y=(137.0, 222.0), d=12.0, frame=2.0,
            shelves=(158.0, 179.0, 200.0))   # v20, client: "make glass display cabinet on wall taller": 85 tall (was 50), three glass shelves
GLASS = dict(x=G.WINDOW_X, ys=(130.0, 170.0), d=18.0, t=1.0)
# v43, client: "I want the c table in the current main plan". Your sofa sits flat on the floor, so no foot can slide under it (as a
# bought C-table's does): the upright stands out past the sofa's end and a steel plate weighs the foot down. "over": how far the top
# reaches over the seat; the foot runs from 3 under the sofa's edge (its plinth's inset) to the upright's outer face.
CTABLE = dict(x=(40.0, 85.0), top=62.0, depth=30.0, over=12.0, t=1.8, plate=(40.0, 20.0, 0.6), felt=0.3, seat_top=52.0)
SPOTS = dict(case=CASE, glass=GLASS, ctable=CTABLE)   # v18: the plant ladder is dropped: your new plant stand does its job


def idea_options():
    """v43: the ideas still only ideas (the C-table is in the plan: geometry.FIRM["ideas"])."""
    return [i for i in IDEAS if i[0] not in G.FIRM.get("ideas", [])]


def low_high():
    return sum(i[3][0] for i in idea_options()), sum(i[3][1] for i in idea_options())


def pdf_html():
    """The plan PDF's appendix: one paragraph per idea."""
    lo, hi = low_high()
    rows = "".join(f"<tr><td><b>{t}</b><br><span class='note'>{size}</span></td><td>{why} <i>{where}</i></td><td class='num'>{c[0]}–{c[1]}</td></tr>"
                   for _, t, size, c, why, where, _3d in IDEAS)
    return (f"<p>Suggestions only, for later: they aren't in the plan, the buy list or the costs (all of them together would be about "
            f"£{lo}–{hi}). The first three can be seen in the 3D room with the “Ideas (not in the plan)” buttons, all off until you turn them on.</p>"
            f"<table class='tight'><tr><th>Idea</th><th>Why, and where</th><th>About £</th></tr>{rows}</table>")


# v21, client: "i also want expansion of the suggested furniture and decor making sure i can choose to have it or not": pieces placed
# where they'd go, each its own on/off button in the 3D room (room3d.js SUGGEST, the same keys), all off until you turn them on.
# (key, title, size, (low, high) £, why, where)
SUGGEST = [
    ("floorplant", "A tall floor plant at the sofa's open end", "a fiddle-leaf fig or rubber plant, about 150 tall in a 30 cm pot", (40, 90),
     "Height and green in the one corner with nothing tall in it, between the media wall and the sofa's open end.",
     "On the floor by the side wall, clear of the media wall's drawers when they're pulled out."),
    ("sidetable", "A round oak side table at the sofa's open end", "40 across × 50 tall", (40, 90),
     "Somewhere to put a drink down from the ottoman end, without the C-table over the seat.", "Beside the sofa's open end, towards the TV."),
    ("pouffe", "A knitted pouffe on the rug", "50 across × 40 tall", (30, 60),
     "A footrest, a spare seat, and a third colour on the rug.", "On the rug in front of the media wall, beside your ottoman; it moves anywhere in Edit room."),
    ("art", "A large framed print over the sofa's return", "80 × 55 in an oak frame", (40, 120),
     "The side wall over the sofa is the one big empty wall: one print, hung 30 above the back cushions.", "On the side wall over the sofa's return, past the oak run."),
    ("clock", "A slim wall clock over the door", "30 across", (20, 45),
     "Fits the 37 cm between the door's head and the ceiling.", "Centred over the door."),
    ("tray", "Coffee-table styling: an oak tray, two books and a candle", "a 40 × 26 tray", (20, 40),
     "Keeps the remotes' landing spot tidy and gives the coffee table a finished look.", "On the coffee table; it goes where the table goes."),
]


# v23, client: "add more suggestions with buttons to turn on and off of suggestions for the room"
SUGGEST += [
    ("fairy", "Warm fairy lights along the curtain pole", "about 4 m of warm-white micro LEDs on copper wire, USB", (12, 25),
     "A soft line of light over the window in the evening, on the same timer as the grow lights.", "Wound along the curtain pole, end to end."),
    ("hanger", "A macramé plant hanger from the pole", "a 75 cm hanger, a 15 cm pot, a trailing plant", (20, 40),
     "Puts a plant in the window without taking sill space from the others.", "From the curtain pole near the window's sofa end, clear of the curtains when they're drawn back."),
    ("trail", "A trailing pothos on the media wall's top shelf", "a 15 cm pot, trails about 60 cm", (12, 25),
     "Softens the oak and the books, trailing down past the shelf's front edge.", "At the right-hand end of the top shelf, 196 up."),
    ("throw", "A chunky knit throw over the sofa's open end", "about 130 × 170, cream", (30, 60),
     "The ottoman end is where you put your feet up: a throw within reach, and a texture against the corduroy.", "Folded over the open end of the sofa's return."),
    ("pclamp", "A mushroom lamp on the PC shelf", "about 22 across × 30 tall, warm glow", (30, 70),
     "A low, warm light at the sofa's end for reading or gaming without the spots on.", "On the PC shelf, past the PC, 155 up."),
    ("basket", "A seagrass basket for throws by the breast", "about 40 across × 40 tall", (20, 40),
     "Somewhere for the throws and cushions to go when people sit at the table.", "In the corner by the chimney breast, clear of the door's swing; it moves in Edit room."),
]


# v26, client: "expand more into the look section as well as extras": six more, each with its own button
SUGGEST += [
    ("candles", "LED pillar candles on your black shelf", "three, 7.5 across × 10, 12.5 and 15 tall, warm flicker, on a timer", (15, 30),
     "A warm glow by the table in the evening without a flame near the shelf's things.", "On your black shelf by the stairs, at the window end."),
    ("runner", "A linen runner and a bud vase for the table", "a runner about 33 × 180, a 20 cm vase", (20, 40),
     "Dresses the table when it's open; folds onto the cabinet's linen shelf when it isn't.", "Down the middle of the open table, whichever option."),
    ("floorcush", "Two floor cushions by the coffee table", "60 × 60 × 12 each, mustard and rust", (40, 80),
     "Extra seats for a film night, and two more colours from the rug.", "Stacked on the rug at the TV end of the coffee table; they move in Edit room."),
    ("lantern", "A rattan floor lantern with an LED candle", "about 30 across × 55 tall", (25, 50),
     "A low glow by the window that the curtains can't catch.", "On the floor between the sofa's arm and your plant stand; it moves in Edit room."),
    ("mirror", "A tall arched mirror behind the sofa's corner", "about 50 × 90, oak frame", (60, 120),
     "Bounces the window's light back into the room, in the strip of wall beside the window.", "On the window wall in the corner behind the sofa's return, its foot above the back cushions."),
    ("shelfled", "A warm LED strip under your black shelf", "2 m warm-white strip, USB or plug-in", (15, 30),
     "Lights the table (or option C's cabinet) from above, softly, for an everyday supper.", "Under the shelf's front edge, the full 2 m."),
]


# v32, client: "add anything else you haven't already suggested": three more, each from a product page (fit.SOURCES)
SUGGEST += [
    ("blind", "A blackout roller blind for the window", "made to measure (up to 240 × 210): here about 239 wide × 124 drop", (25, 70),
     "Film nights in daylight, and darker summer mornings; rolled up, it's a slim cassette under the curtain pole.",
     "Face-fixed just above the window, down to the sill's nose: the plants on the sill stay behind it."),
    ("cablights", "Lights inside the dining cabinet", "two 40 cm USB-rechargeable LED bars, warm white, motion sensing", (28, 40),
     "Each box lights as its door opens, so the chairs and the cloth are easy to find in the evening.", "Under the top of each box, at the front."),
]
# v34: the picture lights went with the two framed LPs (the glass case takes their place, lit inside). Client: "maybe integrating a wall
# bar in here for drinks/spirits or whether another area could facilitate a bar of some kind and how id build it in": two ways
# (geometry.DRINKS; the build in the plan's appendix, "A bar for drinks")
SUGGEST += [
    ("barcase", "A drinks cabinet under the glass case", "90 × 39 × 20, oak; its front drops to a 90 × 36 counter at 98", (80, 130),
     "Your spirits behind an oak fall-front, built in under the case you picked: nine 70 cl bottles (the tallest made, 35) on a mirror "
     "back, lit from under the top. Down on its two soft-close stays the front is a counter to pour at; the glasses go on the case's "
     "bottom shelf, just above. Nothing stands on the floor.",
     "On the chimney breast under the glass case, 96 to 136 up, in the “now playing” ledge's place."),
    ("bartrolley", "The slim trolley beside the cabinet, as a drinks trolley", "VASAGLE, 20 × 43.2 × 86.5: bottles on top, glasses, mixers and an ice bucket below", (36, 70),
     "Nothing to build: it parks in the gap beside the dining cabinet and pulls out for dinner, before the table door opens, to stand behind the window-side diners, or over to the sofa.",
     "Beside the dining cabinet (Layout, Beside the cabinet: the slim trolley), behind the open table door's line."),
]

# v36, client: "explore any more bar ideas and where we could put it as well as more storage and where we could put it ... a small 10cm
# gap from wall shelf with the hanging plant from the right side wall. add storage solution options for our blankets also, around 5
# blankets. make sure its clear how to manage all these options in the 3D room" (geometry v36; fit.storage_zone; OPTION_GROUPS below)
SUGGEST += [
    ("barside", "A drinks cabinet by the sofa, under the oak run", "60 × 39 × 20, oak; its front drops to a 60 × 36 counter at 98", (60, 100),
     "The bar where you sit: the same build as the one under the glass case, 60 wide for five bottles, on the side wall at the sofa's "
     "open end. The front drops on two soft-close stays to a counter; the glasses stand on the oak run 16 above it.",
     "On the side wall by the sofa's open end, 96 to 136 up, under the oak run."),
    ("blanketbasket", "A tall water hyacinth basket for your blankets at the sofa's open end", "51 × 29 × 59, water hyacinth, lined", (36, 42),
     "Your five blankets, each folded long, stacked flat in one basket (they use about 43 of its 57 inside), at the end of the sofa where "
     "you'd reach for them. It stands 29 out from the wall, not 45.",
     "Along the side wall, 3 cm past the sofa's open end."),
    ("cotswoldbasket", "A tall lidded seagrass basket for your blankets", "45 × 45 × 76, seagrass, with a lid", (90, 110),
     "The first basket you picked, with a lid; it takes more floor and costs more.", "The same corner, at the sofa's open end."),
    ("liftcoffee", "A lift-top coffee table", "90 × 50 × 48; the top lifts to 53.5", (39, 80),
     "Your coffee table's footprint with room inside for the remotes, controllers and the card games you use most; lifted, it's a "
     "table to eat or play at from the sofa.", "Where your coffee table stands."),
    ("recordtable", "A record-browsing coffee table", "90 × 50 × 48.5; two KALLAX cubes under a lifting oak lid", (170, 210),
     "About 160 LPs spine-up in two bins under an oak lid, to flick through from the sofa; it rolls on castors.", "Where your coffee table stands."),
    ("doorshelf", "An oak shelf over the hall door with two lidded boxes", "91 × 27 oak at 206; two boxes 35 × 26 × 15", (35, 60),
     "Somewhere for what you use a few times a year (spare cables, gift wrap, candles), out of sight above the door.",
     "Over the hall door, above its architrave (the wall clock suggestion's place)."),
    ("shelfboxes", "Two lidded boxes on your black shelf", "35 × 26 × 15 each", (20, 30),
     "Chargers, batteries and spare bulbs by the table, either side of the laser.", "On your black shelf by the stairs, in the middle."),
]


# v37, client: "more storage options in Extras ... under-stair drawers, alcove shelving, window seat with storage, wall-mounted cabinets,
# built-in wardrobes, shoe storage, a hallway bench with cubbies, and over-door racks" (geometry v37; fit.more_storage_zone). The bar
# built in beside the cabinet and the shoe cabinets are "beside" options (geometry.BESIDE), not suggestions: one thing stands there at a time.
_bb, _ws, _hb, _wd, _al, _wc, _sd, _od = G.BAR_BUILT, G.WINDOW_SEAT, G.HALL_BENCH, G.WARDROBE, G.ALCOVE_SHELVES, G.WALL_CABS, G.STAIR_DRAWERS, G.OVERDOOR
SUGGEST += [
    ("stairdrawers", "Drawers in the bottom three steps", f"three drawers, fronts {_sd['w']:g} × {_sd['h']:g}, {_sd['depth']:g} deep on 350 runners", (180, 320),
     "The space behind the bottom risers is empty: three oak drawers there take slippers, chargers, dog leads or the games' spare pieces, "
     "with a finger-pull in each riser's top edge and nothing to trip on. A joiner's job (each riser comes out and the tread needs support "
     "under it); worth building into the new stairs from the start.",
     "In the bottom three risers of the stairs by the door (or the new stairs' first steps)."),
    ("alcoveshelves", "Two oak alcove shelves in the window corner", f"two {_al['w']:g} × {_al['d']:g} oak floating shelves at {_al['tops'][0]:g} and {_al['tops'][1]:g}", (70, 110),
     "The window corner is the room's one free alcove (the TV's alcove is the media wall, the one by the breast is the hall door): two "
     "floating shelves between the curtains' stack and the pipe boxing, over the plant stand, for books, trailing plants or the record "
     "player's spares. Concealed steel rods into the solid wall.",
     f"The window wall's corner by the pipe boxing, over your plant stand ({_al['over_stand']:g} above its top)."),
    ("windowseat", "A storage window seat in the window corner", f"{_ws['x'][1] - _ws['x'][0]:g} × {_ws['d']:g} × {_ws['h']:g} with its cushion; a lift-up lid", (160, 280),
     "A built-in oak seat with a lift-up lid: your five blankets, the cushions' covers or board games inside, a reading seat by the window "
     "on top. The sofa and the radiator fill the window itself, so it goes in the corner beside it, in the plant stand's place.",
     "The window corner, between the curtains and the pipe boxing (the plant stand moves to the breast)."),
    ("hallbench", "A bench with cubbies (shoes and baskets)", f"{_hb['w']:g} × {_hb['d']:g} × {_hb['h']:g}, ten open cubbies under a padded seat", (80, 130),
     "Made for a hall: sit to take your shoes off, ten pairs in the cubbies under you. Your hall isn't in the 3D room, so it's shown in "
     "the window corner, where it also fits (with 0.8 cm to spare each side).",
     "Your hall by the front door; or the window corner, in the plant stand's place."),
    ("wardrobe", "A built-in cupboard in the window corner", f"{_wd['x'][1] - _wd['x'][0]:g} wide × {_wd['d']:g} deep, floor to ceiling, two doors", (450, 800),
     "A hanging-depth cupboard for coats, the hoover, the ironing board and the big games: the only place in the room with 60 cm of free "
     "floor. It is big for a living room, it takes the plant stand's corner and it leaves only a slot to reach the far end of the "
     "beside-the-cabinet wall, so the beside pieces go when you pick it.",
     f"The window corner, up to {_wd['x'][1]:g} from the side wall; open its doors with the table folded."),
    ("wallcabs", "Two wall cabinets over the sofa's corner", "two IKEA EKET 35 × 35 × 35 with glass doors", (70, 100),
     "Closed storage at head height where nothing else can go: cables, the consoles' spare controllers, candles, the cards. Glass doors "
     "keep it light over the sofa; on EKET's own rail.",
     f"On the side wall over the sofa's corner, just past the PC shelf's end, {_wc['y0']:g} to {_wc['y0'] + G.EKET[2]:g} up."),
    ("overdoor", "A hook rail over the hall door", f"six hooks, {_od['w']:g} × {_od['d']:g} × {_od['h']:g}, over the door's top", (12, 25),
     "Bags, the dog lead, a scarf, by the door you come in through, with no drilling.",
     f"Over the hall door. The open door stands {_od['open_gap']:g} off the breast: slim things only."),
]
del _bb, _ws, _hb, _wd, _al, _wc, _sd, _od

# v43, client: "review the room and suggest improvements and more item options": four more, to look at in the 3D room (options, not
# the plan). Sizes and prices from their makers (fit.SOURCES: spiderglow, switchbotc3, mosslanda, habitatmush).
SUGGEST += [
    ("growlights", "Grow-light bars under the plant stand's tiers", "four 30 cm bars, linkable, on a smart plug", (45, 60),
     "The window corner is dim by evening; four bars under the stand's tiers keep the plants growing and glow warm, as in the stand's own photo.",
     "Under the plant stand's top and third tiers, both towers."),
    ("curtainmotor", "Motors on the curtain pole", "two SwitchBot Curtain 3 (rod), 8.4 × 7.3 × 20.5 each", (160, 200),
     "Film night draws the curtains by itself, and they open with the morning; the pole and the curtains stay as they are.",
     "On the pole, one at each curtain's leading edge."),
    ("lpledges", "Two picture ledges with LPs face-out", "two IKEA MOSSLANDA 55 × 12, 5 kg each", (12, 14),
     "Two covers each, face-out, changed with what you're playing; the side wall over the sofa takes them under the PC shelf and the cabinets.",
     "On the side wall over the sofa's return, 108 up: one under the PC shelf, one under the wall cabinets."),
    ("cordlamp", "A cordless lamp on the C-table", "Habitat rechargeable mushroom lamp, 31 tall, 14 across", (20, 25),
     "A warm pool of light at the sofa's open end with no lead to trip over; it charges by USB.",
     "On the C-table's top, by its outer edge."),
]
# v78, the client: "we're thinking of fitting a curtain there at the bottom of the steps attached to the overhang ceiling" (fit.SOURCES:
# ceiltrack, ohspencil; geometry.STAIR_CURTAIN). v81: "a dual curtain ... that covers the open side and the bottom of the stairs"
SUGGEST += [
    ("stairscurtain", "A curtain round the foot of the stairs", "two ceiling-fix tracks cut to 67 and 78, the thermal pencil-pleat pair (168 × 229 each)", (66, 72),
     "There's no door up the stairs: drawn round the bottom step and the open side, it keeps the room's heat from rising up the stairwell and hides the flight on film nights.",
     "Under the bulkhead over the bottom step, and along the open side back to the door's wall."),
]

# v28, from the optimisation plan: "choices for each suggestion (two or three versions, like the decor rows)". The same piece in two or
# three finishes; the size and the price stay. key: [(value, name, [colours])]; the first is the default. room3d.js (SVAR_MATS) puts
# colour i on the piece's material i.
SUGG_VARS = {
    "floorplant": [("cream", "Cream pot", ["#d8cfc0"]), ("terra", "Terracotta pot", ["#c46c45"]), ("black", "Black pot", ["#2a2a2c"])],
    "sidetable": [("oak", "Oak", ["#c48c57"]), ("black", "Black-stained", ["#3a3634"]), ("white", "White-oiled", ["#efe6d6"])],
    "pouffe": [("mustard", "Mustard", ["#d9a441"]), ("sage", "Sage", ["#8b9878"]), ("cream", "Cream", ["#e9e1cf"])],
    "art": [("oak", "Oak frame", ["#c48c57"]), ("black", "Black frame", ["#2a2a2c"]), ("white", "White frame", ["#efe9df"])],
    "clock": [("oak", "Oak rim", ["#c48c57"]), ("black", "Black rim", ["#2a2a2c"]), ("brass", "Brass rim", ["#b8913f"])],
    "tray": [("oak", "Oak tray", ["#c48c57"]), ("black", "Black tray", ["#2a2a2c"]), ("rattan", "Rattan tray", ["#b98f5c"])],
    "fairy": [("warm", "Warm white", ["#ffd59a"]), ("gold", "Golden", ["#ffb347"]), ("cool", "Cool white", ["#eef3ff"])],
    "hanger": [("terra", "Terracotta pot", ["#c46c45"]), ("white", "White pot", ["#ece6da"]), ("sage", "Sage pot", ["#8b9878"])],
    "trail": [("cream", "Cream pot", ["#ece6da"]), ("terra", "Terracotta pot", ["#c46c45"]), ("black", "Black pot", ["#2a2a2c"])],
    "throw": [("cream", "Cream", ["#efe7d8"]), ("rust", "Rust", ["#a65a38"]), ("sage", "Sage", ["#8b9878"])],
    "pclamp": [("cream", "Cream", ["#e8e2d4", "#f3e7cf"]), ("mustard", "Mustard", ["#d9a441", "#f0c860"]), ("sage", "Sage", ["#8b9878", "#cfd8c0"])],
    "basket": [("sea", "Seagrass", ["#b89a6c"]), ("dark", "Dark rattan", ["#6e5235"]), ("rope", "White cotton rope", ["#ece6da"])],
    "candles": [("cream", "Cream", ["#f3ecdc"]), ("sage", "Sage", ["#b8c4a8"]), ("terra", "Terracotta", ["#d08a68"])],
    "runner": [("linen", "Natural linen", ["#e6dccb"]), ("sage", "Sage linen", ["#9aa889"]), ("rust", "Rust linen", ["#b66a48"])],
    "floorcush": [("mustard", "Mustard and rust", ["#d9a441", "#c7643a"]), ("sage", "Sage and cream", ["#8b9878", "#e9e1cf"]), ("blues", "Two blues", ["#34507f", "#7d9cc0"])],
    "lantern": [("natural", "Natural rattan", ["#b98f5c", "#b98f5c"]), ("dark", "Dark rattan", ["#6e5235", "#6e5235"]), ("black", "Black metal", ["#2a2a2c", "#2a2a2c"])],
    "mirror": [("oak", "Oak frame", ["#c48c57"]), ("black", "Black frame", ["#2a2a2c"]), ("brass", "Brass frame", ["#b8913f"])],
    "shelfled": [("warm", "Warm white", ["#ffd59a", "#ffd29a"]), ("amber", "Amber", ["#ffb347", "#ffb347"]), ("cool", "Cool white", ["#eef3ff", "#eef3ff"])],
    "blind": [("oat", "Oatmeal", ["#cdbf9f"]), ("charcoal", "Charcoal", ["#3b3d40"]), ("sage", "Sage", ["#8b9878"])],
    "barcase": [("oak", "Oak", ["#c48c57"]), ("green", "Card Room Green outside", ["#2d5a46"]), ("black", "Black outside", ["#2a2a2c"])],   # v34
    "bartrolley": [("gin", "Gin and tonics", ["#3f6b3a"]), ("whisky", "Whisky and rum", ["#9a5a22"]), ("clear", "Vodka and clear spirits", ["#e8eef0"])],
    "cablights": [("warm", "Warm white", ["#ffd59a", "#ffd29a"]), ("natural", "Natural white", ["#fff1dc", "#fff1dc"])],
    "barside": [("oak", "Oak", ["#c48c57"]), ("green", "Card Room Green outside", ["#2d5a46"]), ("black", "Black outside", ["#2a2a2c"])],   # v36
    "blanketbasket": [("natural", "Natural water hyacinth", ["#9a7a50"])],                     # v38: Dibor's Lakelyn comes in one colour
    "cotswoldbasket": [("sea", "Natural seagrass", ["#b89a6c"])],
    "recordtable": [("oak", "Oak lid, grey-wood KALLAX", ["#c48c57", "#8d8780"]), ("white", "Oak lid, white KALLAX", ["#c48c57", "#ece8e0"]),
                    ("black", "Oak lid, black-brown KALLAX", ["#c48c57", "#3a312b"])],
    "liftcoffee": [("oak", "Oak effect", ["#b07d4f"]), ("black", "Black", ["#2c2a28"]), ("white", "White", ["#ece8e0"])],
    "doorshelf": [("white", "White boxes", ["#ece8e0"]), ("blue", "Black-blue boxes", ["#2a3346"]), ("grey", "Grey-beige boxes", ["#8f8a80"])],
    "shelfboxes": [("white", "White boxes", ["#ece8e0"]), ("blue", "Black-blue boxes", ["#2a3346"]), ("grey", "Grey-beige boxes", ["#8f8a80"])],
    "stairdrawers": [("oak", "Oak fronts", ["#c48c57"]), ("green", "Card Room Green fronts", ["#2d5a46"]), ("white", "White fronts", ["#ece8e0"])],   # v37
    "alcoveshelves": [("oak", "Oak", ["#c48c57"]), ("walnut", "Dark oak", ["#6e4a2e"]), ("white", "White-oiled", ["#efe6d6"])],
    "windowseat": [("mustard", "Mustard cushion", ["#d9a441"]), ("sage", "Sage cushion", ["#8b9878"]), ("blue", "Blue cord cushion", ["#34507f"])],
    "hallbench": [("oak", "Oak effect", ["#b07d4f"]), ("white", "White", ["#ece8e0"]), ("black", "Black", ["#2c2a28"])],
    "wardrobe": [("oak", "Oak doors", ["#c48c57"]), ("green", "Card Room Green doors", ["#2d5a46"]), ("white", "White doors", ["#ece8e0"])],
    "wallcabs": [("walnut", "Walnut effect", ["#6e4a2e"]), ("white", "White", ["#ece8e0"]), ("bluegrey", "Dark grey-blue", ["#3b4652"])],
    "overdoor": [("black", "Black", ["#2a2a2c"]), ("brass", "Brass", ["#b8913f"]), ("white", "White", ["#ece8e0"])],
    "growlights": [("warm", "Warm white", ["#ffe3b0"]), ("full", "Full spectrum (pink)", ["#ff9ad8"])],                     # v43
    "curtainmotor": [("white", "White", ["#efefec"]), ("black", "Black", ["#2a2a2c"])],
    "lpledges": [("oak", "Oak effect", ["#c48c57"]), ("black", "Black", ["#2a2a2c"]), ("walnut", "Walnut effect", ["#6e4a2e"])],
    "cordlamp": [("taupe", "Taupe", ["#a99886"]), ("black", "Black", ["#2a2a2c"]), ("brass", "Brass", ["#b8913f"])],
    "stairscurtain": [("beige", "Beige", ["#cbb994"]), ("silver", "Silver grey", ["#a9abad"]), ("charcoal", "Charcoal", ["#3e4044"])],   # v78: OHS's colours
}
assert set(SUGG_VARS) == {k for k, *_ in SUGGEST}, "every suggestion has its versions"


FIRM_SUGG = set(G.FIRM["sugg"])                    # v38: the client's picks are the plan (geometry.FIRM), not suggestions


def options():
    """v38: the suggestions that are still only options (not in the client's plan)."""
    return [i for i in SUGGEST if i[0] not in FIRM_SUGG]


def suggest_low_high():
    return sum(i[3][0] for i in options()), sum(i[3][1] for i in options())


def suggest_html():
    """v21: the plan PDF's table of the suggested furniture and decor."""
    lo, hi = suggest_low_high()
    vers = lambda k: ", ".join(n for _v, n, _c in SUGG_VARS[k]).lower().capitalize()
    rows = "".join(f"<tr><td><b>{t}</b><br><span class='note'>{size}</span><br><span class='note'>{vers(k)}</span></td><td>{why} <i>{where}</i></td><td class='num'>{c[0]}–{c[1]}</td></tr>"
                   for k, t, size, c, why, where in options())
    return (f"<p>Not in the plan or the costs: all {len(options())} together would be about £{lo}–{hi}. Each has its own button in the 3D room, all off until you turn them on, and two or three versions to try.</p>"
            f"<table class='tight'><tr><th>Suggestion</th><th>Why, and where</th><th>About £</th></tr>{rows}</table>")


# v36, client: "make sure its clear how to manage all these options in the 3D room": the same suggestions, grouped by what they're for.
# Extras opens on these rows; each picks or switches, flies the camera to it and says where it goes. (key, title, mode, note, items):
# mode "one" picks one (or None), "any" switches each; an item is (value, label, what it sets in the room's state).
OPTION_GROUPS = [
    ("bar", "A bar for drinks", "one", "One of four: beside the dining cabinet, under the glass case, a trolley, or by the sofa.",
     [("barbeside", "Built in beside the cabinet", {"beside": "bar"}), ("barcase", "Under the glass case", {"sugg": "barcase"}), ("bartrolley", "The trolley beside the cabinet", {"sugg": "bartrolley"}),
      ("barside", "By the sofa, under the oak run", {"sugg": "barside"})]),
    ("games", "Games and cards: in the ottoman", "lid", "Twelve square board games in three layers and a row of card games along one side.",
     [("on", "Lid on", {"lid": False}), ("off", "Lift the lid", {"lid": True})]),
    ("blankets", "Your blankets (about five)", "one", "The plan's basket, or one of two others; pick one.",
     [("blanketbasket", "The plan's basket (water hyacinth)", {"sugg": "blanketbasket"}), ("cotswoldbasket", "The lidded seagrass one", {"sugg": "cotswoldbasket"}),
      ("rail", "An oak rail beside the cabinet", {"beside": "rail"})]),
    ("coffee", "The coffee table", "one", "The plan's record table, or the lift-top; None is your own.",
     [("recordtable", "The record table (the plan)", {"sugg": "recordtable"}), ("liftcoffee", "A lift-top coffee table", {"sugg": "liftcoffee"})]),
    ("corner", "The window corner", "one", "Your plant stand is here now. Pick one and it takes the corner.",
     [("windowseat", "A storage window seat", {"sugg": "windowseat"}), ("hallbench", "A bench with cubbies", {"sugg": "hallbench"}),
      ("wardrobe", "A built-in cupboard", {"sugg": "wardrobe"})]),
    ("storage", "More storage", "any", "Switch on as many as you like.",
     [("doorshelf", "A shelf over the hall door", {"sugg": "doorshelf"}),
      ("shelfboxes", "Boxes on your black shelf", {"sugg": "shelfboxes"}), ("alcoveshelves", "Alcove shelves, window corner", {"sugg": "alcoveshelves"}),
      ("wallcabs", "Wall cabinets over the sofa", {"sugg": "wallcabs"}), ("stairdrawers", "Drawers in the bottom steps", {"sugg": "stairdrawers"}),
      ("overdoor", "A hook rail over the door", {"sugg": "overdoor"}), ("shoes", "Shoe cabinets beside the cabinet", {"beside": "shoes"})]),
]


def ctable_parts():
    """v43: the C-table's oak parts (cm, L × W × T) from the second Snowdon board, and its steel plate."""
    T = CTABLE
    w, t = T["x"][1] - T["x"][0], T["t"]
    foot = round(T["depth"] - T["over"] + 3, 1)                       # from 3 under the sofa's edge to the upright's outer face
    upright = round(T["top"] - T["plate"][2] - T["felt"] - 2 * t, 1)
    return dict(top=(w, T["depth"], t), upright=(w, upright, t), foot=(w, foot, t), plate=T["plate"])


def ctable_tip_kg(oak=0.71, plate_kg=3.77):
    """v43: the load on the top's far edge (over the seat) that would tip it towards the sofa, in kg. Moments about the plate's back
    edge (where it meets the floor, 2 under the sofa's edge): the top, the upright, the foot and the plate against the load.
    Oak at 0.71 g/cm³ (sources: oakdensity); the plate 400 × 200 × 6 mm of steel is 3.77 kg."""
    T, P = CTABLE, ctable_parts()
    kg = lambda d: d[0] * d[1] * d[2] * oak / 1000
    back = -2.0                                                        # the plate's back edge, from the sofa's edge
    zo = T["depth"] - T["over"]                                       # the upright's outer face
    m = (kg(P["top"]) * (-T["over"] + T["depth"] / 2 - back) + kg(P["upright"]) * (zo - T["t"] / 2 - back)
         + kg(P["foot"]) * ((-3 + zo) / 2 - back) + plate_kg * (back + P["plate"][1] / 2 - back))
    return round(m / (back + T["over"]), 1)
