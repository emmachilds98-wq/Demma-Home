"""v25: three lighting presets (bright, cosy, film) and two rules (table open, time of day). v13.7: lighting scenes. Four ways to set the room's six light layers: the ceiling LED strip on its own controller, the
uprights' grooves and the side-wall shelf's strip (smart colour since v16, in the bulbs' app), the bias light with the
TV, and (v15) bar 1, bar 2 and the red lamp on smart colour bulbs, set in their app (v17: every head straight down). Levels are 0-100. Used by diagrams.light_scene(), the plan's
section 8 and the viewer's scene buttons."""

LAYERS = [("strip", "Ceiling LED strip", "its own controller"), ("uprights", "Uprights' grooves and the side shelf", "the strips' app (smart colour since v16)"),
          ("bias", "TV bias light", "comes on with the TV"), ("bar1", "Bar 1, between the TV and the sofa", "smart bulbs: the app"),
          ("bar2", "Bar 2, by the stairs", "smart bulbs: the app"), ("lamp", "Your red lamp", "its colour bulbs: the app"),
          ("accent", "Accents: the glass case, the bar's strip, the PC", "their own switches or plugs")]   # v46

# v25, Emma: "the presets aren't great". Three presets instead of six buttons; dinner and daytime become two rules (below).
SCENES = [
    # v46, client: "default view could balance lighting throughout the room using all fixtures and making a good setting": every fixture
    # on, set so no part of the room is more than about three times as bright as another (measured in stills, HANDOFF round 41)
    # v50, client: "make the natural default light a bit cosier and less overly light washed": the strip and the uprights down, the bars
    # a touch lower, the lamp up, warmer (Warmth 25), less stand-in bounce: measured in stills (HANDOFF round 45)
    ("evening", "Evening", "Every light on, low and warm: the walls, the shelves, the sofa and the table all read, nothing glares. The default.",
     {"strip": 40, "uprights": 50, "bias": 0, "bar1": 30, "bar2": 32, "lamp": 75, "accent": 70},
     ["The ceiling strip and the uprights light the walls; both bars' heads spread over the media wall, the sofa and the table.",
      "The lamp warms the window corner; the glass case, the bar's strip and the PC add small points of light.",
      "Brightness turns the whole room up or down; Warmth goes from candle-warm to neutral white."]),
    ("bright", "Bright", "Everything on at a comfortable, even level: tidying, chatting, finding the remote.",
     {"strip": 70, "uprights": 50, "bias": 0, "bar1": 60, "bar2": 60, "lamp": 50, "accent": 80},
     ["All eight heads straight down, spread a little along each bar, so the pools overlap.",
      "The ceiling strip and the uprights fill the edges; the lamp adds a low warm layer.",
      "Turn the strip down first as the evening goes on: it's the flattest light in the room."]),
    ("cosy", "Cosy", "Low and warm, for records and quiet evenings: light on the deck and the shelves, the lamp's colours on.",
     {"strip": 35, "uprights": 55, "bias": 0, "bar1": 45, "bar2": 40, "lamp": 75, "accent": 60},   # v45: the strip and bar 2 up a touch, so the room still reads
     ["Bar 1's pink head on the turntable and the Series X, blue on the record ledge.",
      "The uprights' grooves up, washing the wall either side of the TV.",
      "The lamp up for reading sleeves on the sofa; the ceiling strip low."]),
    ("film", "Film", "Films and games: the screen is the brightest thing in the room, with a little warm light round it so your eyes don't strain.",
     {"strip": 10, "uprights": 15, "bias": 100, "bar1": 0, "bar2": 10, "lamp": 60, "accent": 35},
     ["Bar 1 off: its heads hang in front of the screen, and even tilted away they'd catch it.",
      "The bias light and your red lamp do the work.",
      "Bar 2 just glowing on the framed LPs, so the far end of the room isn't a black hole."]),
]
# the colour each preset sets in the bulbs' app (the page shows it under the tile)
COLOURS = {"evening": "everything warm white (Warmth in the middle), the lamp's three colour bulbs on", "bright": "bars warm white 3000 K, every head straight down", "cosy": "bars 2700 K, the lamp's three colour bulbs on (green, pink, purple)",
           "film": "the bias light cool white behind the TV, the lamp low"}
# Two rules in place of the other buttons. Table open (four or six): on top of whichever preset is on, bar 2 between 45 and 55, the strip at most 40 (v45: 80 washed
# the oak top out), bar 1 at
# most 15, the TV's bias light off. Time of day is its own switch: daytime is the sun and the window, with any preset.
TABLE_BOOST = {"bar2_min": 45, "bar2_max": 55, "bar1_max": 15, "strip_max": 40, "bias": 0}
TOD = [("evening", "Evening"), ("day", "Daytime")]
RULES = ["The table's open, so bar 2 lights it: on top of whichever preset is on, bar 2 sits between 45 and 55 and the ceiling strip at 40 or less (enough to eat by, not so much the oak washes out), bar 1 down to 15 or less, and the TV's bias light goes off.",
         "Evening or daytime is a switch of its own: daytime is the sun through the window, with any preset."]
# where each old scene went (the page maps saved choices with this)
OLD_TO_NEW = {"general": "bright", "everyday": "bright", "records": "cosy", "tv": "film", "dinner": "bright", "day": "bright"}

# The five scenes of v13.7 to v24, kept for the plan's appendix ("Options we set aside") only.
SCENES_V24 = [
    ("general", "General", "An even light over the whole room: every head straight down, the strips and the lamp filling in. The default (v17).",
     {"strip": 55, "uprights": 45, "bias": 0, "bar1": 60, "bar2": 60, "lamp": 45},
     ["All eight heads point straight down, spread a little along each bar, so the pools overlap instead of spotlighting the walls.",
      "The ceiling strip and the uprights fill the edges; the lamp adds a low warm layer.",
      "Tilt a head only if its pool lands badly (on the TV's screen, or in someone's eyes)."]),
    ("tv", "TV night", "Films and games: the screen is the brightest thing in the room, with a little warm light round it so your eyes don't strain.",
     {"strip": 10, "uprights": 15, "bias": 100, "bar1": 0, "bar2": 10, "lamp": 70},
     ["Bar 1 off: its heads hang in front of the screen, and even tilted away they'd catch it.",
      "The bias light behind the TV and your red lamp do the work: the lamp is the one to leave on for a film (down to about 70).",
      "Bar 2 just glowing on the framed LPs, so the far end of the room isn't a black hole."]),
    ("dinner", "Dinner", "The table is the bright spot, the media wall steps back.",
     {"strip": 25, "uprights": 30, "bias": 0, "bar1": 15, "bar2": 80, "lamp": 0},
     ["Bar 2 up: for four its heads light the table at the wall; for six, the table stands right under it (point blue and mustard straight down).",
      "Bar 1 low, so the coffee table end isn't dark; the TV off.",
      "The uprights low: the shelves read as a backdrop, not a stage."]),
    ("records", "Records", "Pick a record, read the sleeve: light on the deck, the ledge and the trays.",
     {"strip": 35, "uprights": 60, "bias": 0, "bar1": 60, "bar2": 15, "lamp": 80},
     ["Bar 1 up: its pink head is on the turntable and the Series X, blue on the record ledge.",
      "The uprights' grooves up, washing the wall either side of the (switched-off) TV and the ledge LPs.",
      "The lamp up for reading sleeves on the sofa."]),
    ("everyday", "Everyday evening", "Everything on at a comfortable level, for tidying, chatting and finding the remote.",
     {"strip": 70, "uprights": 50, "bias": 0, "bar1": 55, "bar2": 40, "lamp": 60},
     ["The ceiling strip does most of it; both bars fill in the shelves and the table.",
      "Turn the strip down first as the evening goes on: it's the flattest light in the room."]),
]


def level_word(v):
    return "off" if v == 0 else ("on" if v == 100 else f"{v}%")


def boosted(levels):
    """A preset's levels with the table open (TABLE_BOOST)."""
    lv = dict(levels)
    lv["bar2"] = min(max(lv["bar2"], TABLE_BOOST["bar2_min"]), TABLE_BOOST["bar2_max"]); lv["strip"] = min(lv["strip"], TABLE_BOOST["strip_max"]); lv["bar1"] = min(lv["bar1"], TABLE_BOOST["bar1_max"]); lv["bias"] = TABLE_BOOST["bias"]
    return lv
