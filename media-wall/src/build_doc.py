"""Builds the plan (v13) as HTML, then PDF via headless Chromium, plus the beginner's build guide as its own PDF.
The plan reads in build order: decision, room, media wall and fit proof, records and turntable, dining wall, side wall,
joinery, paint and light, power and network, build guide, buy list, then what's agreed, later ideas and sources.
Numbers come from geometry.py and fit.py."""
import base64, html as html_lib, pathlib, re
import geometry as G
import fit
import ideas
import tidy
from diagrams import (light_scene, leaf_case, fliptop, sub_box, drawer_layouts, storage, network, front, drawer, sound, game_drawer, av, power, routes, pc_shelf, section, joints, house,
                      living_plan, why_layout, seating, dining_section, dining_sites, chair_storage, chair_options,
                      option_c_elevation, option_c_section, option_c_plan, option_c_carcass, option_c_halves,
                      cab_elevation, cab_carcass, cab_section, cab_plan)

HERE = pathlib.Path(__file__).parent
VERSION = (pathlib.Path(__file__).resolve().parents[2] / "VERSION").read_text().strip()   # V1: one file at the root ("1.0", "1.1" ...)
LABEL = "V" + (VERSION[:-2] if VERSION.endswith(".0") else VERSION)                           # how it shows: "V1", "V1.1"
REVISION = "77: the bathroom's slope up to its beam, the lower ceiling over the toilet, the mirror"
PDF_NAME = f"Demmas_Home_{LABEL}_Plan.pdf"
GUIDE_NAME = f"Demmas_Home_{LABEL}_Build_Guide.pdf"


DECK = False   # True while the plan page (build_viewer.py) borrows these sections: images become art/ keys
DECK_ART = {"render_v13_join_clean.png": "art_join_mint", "render_v13_join_key_scene.png": "key_join",
            "render_v13_drawers.png": "art_drawers_mint", "render_v13_dining_four.png": "art_four_mint",
            "render_v13_dining_six.png": "art_six_mint", "render_v13_side.png": "art_side_mint",
            "paint_grid.png": "doc_paint", "skirting_options.png": "doc_skirt",
            "render_v39_3d_ideas_window.png": "3d_ideas_window", "render_v39_3d_glass_case.png": "3d_glass_case", "render_v39_3d_bar_shut.png": "3d_bar_shut", "render_v39_3d_ottoman.png": "3d_ottoman", "render_v39_3d_beside_trolley_out.png": "3d_beside_trolley_out", "render_v39_3d_sg_barcase.png": "3d_sg_barcase", "render_v39_3d_sg_bartrolley.png": "3d_sg_bartrolley",
            "render_v39_3d_plants_corner.png": "3d_plants_corner", "render_v39_3d_records_breast.png": "3d_records_breast", "render_v39_3d_plants_breast.png": "3d_plants_breast",
            "render_v39_3d_room.png": "3d_room", "render_v39_3d_suggest.png": "3d_suggest", "render_v39_3d_case_mixed.png": "3d_case_mixed", "render_v39_3d_case_singles.png": "3d_case_singles", "render_v39_3d_decor.png": "3d_decor",
            "render_v39_3d_c_folded.png": "3d_c_folded", "render_v39_3d_c_six.png": "3d_c_six", "render_v39_3d_window_c_six.png": "3d_window_c_six", "render_v39_3d_c_chairs.png": "3d_c_chairs", "render_v39_3d_c_plan.png": "3d_c_plan",
            "render_v39_3d_c_tdoor.png": "3d_c_tdoor", "render_v39_3d_c_sit.png": "3d_c_sit", "render_v39_3d_c_foot.png": "3d_c_foot", "render_v39_3d_beside_mirror.png": "3d_beside_mirror",
            "render_v39_3d_beside_trolley.png": "3d_beside_trolley", "render_v39_3d_beside_dresser.png": "3d_beside_dresser",
            "render_v39_3d_c80_folded.png": "3d_c80_folded", "render_v39_3d_c80_six.png": "3d_c80_six", "render_v39_3d_c80_tdoor.png": "3d_c80_tdoor", "render_v39_3d_c80_plan.png": "3d_c80_plan"}

DECK_ART.update({f"render_v39_{k}.png": k for k in ("3d_sg_barside", "3d_sg_blanketbasket", "3d_beside_rail", "3d_sg_recordtable", "3d_sg_doorshelf")})   # v36
DECK_ART.update({f"render_v39_{k}.png": k for k in ("3d_beside_bar", "3d_beside_bar_open", "3d_beside_shoes", "3d_shelf_gap", "3d_lamp_cap", "3d_sg_windowseat",
                                                       "3d_sg_hallbench", "3d_sg_wardrobe", "3d_sg_alcoveshelves", "3d_sg_wallcabs", "3d_sg_stairdrawers", "3d_sg_overdoor")})   # v37

def latest(name):
    """v39, client: "we dont need the hd still i can take them in the site": no stills are rendered now, so a 3D picture is the newest
    one made (render_vNN_<stem>.png, the highest NN)."""
    p = HERE / name
    m = re.match(r"render_v\d+_(.+)$", name)
    if p.exists() or not m:
        return p
    found = sorted(HERE.glob(f"render_v*_{m.group(1)}"), key=lambda q: int(re.match(r"render_v(\d+)_", q.name).group(1)))
    if found:
        return found[-1]
    art = HERE / "art" / (m.group(1).rsplit(".", 1)[0] + ".webp")    # v44: else the page's own picture of it (a card picture)
    return art if art.exists() else p


def img(name, alt=""):
    if DECK:
        return f'<img data-art="{DECK_ART[name]}" alt="{alt}" loading="lazy">'
    p = latest(name)
    mime = "jpeg" if p.suffix.lower() in (".jpg", ".jpeg") else "png"
    data = p.read_bytes()
    if name.startswith("render_v") and "_3d_" in name and mime == "png":   # v31: the 3D stills go in as JPEG, so the plan stays under 50 MB
        import io
        from PIL import Image
        buf = io.BytesIO(); Image.open(io.BytesIO(data)).convert("RGB").save(buf, "JPEG", quality=90); data, mime = buf.getvalue(), "jpeg"
    return f'<img src="data:image/{mime};base64,{base64.b64encode(data).decode()}" alt="{alt}">'


def thumb(name, alt=""):
    """v32: a render small enough to put many on a page (a 960 JPEG), or the deck's picture."""
    if DECK:
        return f'<img data-art="{DECK_ART.get(name) or name.split("_", 2)[2].rsplit(".", 1)[0]}" alt="{alt}" loading="lazy">'   # render_vNN_<stem>.png
    import io
    from PIL import Image
    im = Image.open(latest(name)).convert("RGB"); im.thumbnail((960, 540))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=84)
    return f'<img src="data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}" alt="{alt}">'


def item_gallery():
    """v32, client: "i want all suggested extra items, furniture and more to have full renders, nothing half HD or drawn": every idea,
    suggestion and piece in Edit room's Add list, each from its own close look in the 3D room (item_shots.py; full size in ../out)."""
    import item_shots as IS
    heads = {"idea": "Ideas", "sugg": "Suggested furniture and decor", "add": "Edit room's Add list"}
    out = []
    for kind in ("idea", "sugg", "add"):
        cells = "".join(f'<figure class="thumb">{thumb(f"render_v99_{stem}.png", html_lib.escape(t))}<figcaption>{html_lib.escape(t)}</figcaption></figure>'
                        for stem, kd, _k, t, _o in IS.items() if kd == kind)
        out.append(f'<h4>{heads[kind]}, each on its own</h4><div class="thumbs">{cells}</div>')
    return "".join(out)


def n(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


LPS = G.ALL_LPS                                            # v19: 291, the wall's 191 and the vinyl stand's 100
SINGLES = 2 * G.TRAY_SINGLES                               # 0 since v15: LPs only

# ---------------------------------------------------------------- buy list and jobs, in build order
# (status, item, phase, qty, lo, hi)  lo/hi None = no cost
TRACK = [
    ("To do", "Put the Virgin Hub 5 into modem mode", "1 Network, now", "", None, None),
    ("To do", "Set up Deco A, Switch 1 and the PCs in bedroom 3", "1 Network, now", "", None, None),
    ("To do", "Add Deco B and Deco C over Wi-Fi for now; speed-test each room and the Xbox", "1 Network, now", "", None, None),
    ("To buy", "Cat6 patch leads, 0.5–2 m", "1 Network, now", "11", 15, 20),
    ("To buy", "TP-Link TL-SG108 8-port switch: one for the living room, one to replace the 5-port in bedroom 3", "1 Network, now", "2", 36, 50),
    ("To do", "Cat6, your own job: two runs from bedroom 3, across the landing and down through the airing cupboard, one to the alcove's right corner (Deco B) and one on to the kitchen (Deco C), a spare pulled with each, and the optional runs to the master and bedroom 2 <b>(changed: no electrician)</b>", "2 Cables and power", "", None, None),
    ("To buy", "Cat6 solid pure copper, round (not CCA): two runs, four with the optional ones", "2 Cables and power", "2–4 runs", 30, 60),
    ("To buy", "Cat6 tools: a punch-down tool, RJ45 keystones and two surface boxes (or plugs and a crimper), a cable tester, a draw-rod set <b>(new: you run the Cat6 yourselves)</b>", "2 Cables and power", "1 set", 30, 60),
    ("To do", "Swap the single socket on the side wall for a double at the same spot: like for like, not notifiable; step 3 has the safe way to do it <b>(changed: your own job)</b>", "2 Cables and power", "", None, None),
    ("To buy", "A double socket in the same finish, and a deeper back box if the old one is shallow <b>(new)</b>", "2 Cables and power", "1", 5, 15),
    ("To buy", "Electrical safety kit: a two-pole voltage tester to GS38 with its proving unit, an MCB lock-off and padlock, a plug-in socket tester <b>(new: for doing it yourselves)</b>", "2 Cables and power", "1 set", 45, 90),
    ("To buy", "Insulated (VDE) screwdrivers, wire strippers and side cutters <b>(new)</b>", "2 Cables and power", "1 set", 20, 40),
    ("To buy", "6-way surge-protected extension for the retro set (Xbox One, 360, PS3, PS2, PS1, RetroTINK) <b>(changed: switched at the wall)</b>", "2 Cables and power", "1", 20, 35),
    ("To buy", "4-port USB charger, 5 V 2 A per port (HDMI switch, fan stand, pad dock, bias light)", "2 Cables and power", "1", 10, 20),
    ("To buy", "USB plug, 5 V 2 A or more, for the RetroTINK on the retro 6-way", "2 Cables and power", "1", 5, 10),
    ("To buy", "Cable kit: brush grommets, velcro ties, labels", "2 Cables and power", "1", 20, 30),
    ("To buy", "Flat two-compartment trunking for the 4 cm channel behind the base, about 2 m", "2 Cables and power", "1", 10, 20),
    ("To do", "Chase two conduits into the solid side wall for the PC, from behind the PC shelf down to skirting height and behind the skirting to the base's plinth: 38 mm oval for the HDMI and Cat6, 25 mm oval for the PC's mains lead; make good and paint <b>(changed: your own job; the PC now runs from the 10-gang)</b>", "2 Cables and power", "", None, None),
    ("To buy", "Conduit: 38 mm and 25 mm oval, about 4 m each, two draw wires, one oak-coloured brush grommet; a 5 m C13 lead with a rewireable 13 A plug for the PC <b>(changed)</b>", "2 Cables and power", "1", 15, 35),
    ("To buy", "For the chase: a wall chaser with dust extraction for a day (or a bolster chisel and club hammer), one-coat filler <b>(new)</b>", "2 Cables and power", "1", 20, 45),
    ("To buy", "PC tidy kit: braided sleeve, shelf-notch grommet", "2 Cables and power", "1", 5, 15),
    ("To buy", "A powered USB 3 hub, 4-port with its own adapter, screwed under the side run's front edge below the PC: pads, the keyboard and a stick within reach of the sofa <b>(new in v17)</b>", "2 Cables and power", "1", 15, 30),
    ("To buy", "A remote power button for the PC: a wireless switch on the motherboard's power header (card in a spare slot), its push button on the wrap ledge <b>(new in v17)</b>", "2 Cables and power", "1", 10, 30),
    ("To buy", "A magnetic mesh dust filter cut to the PC's top exhaust <b>(new in v17)</b>", "2 Cables and power", "1", 5, 10),
    ("To do", "Get a sample pot of your pale mint mixed to #dbffc8 at B&Q (Valspar); paint an A4 board and check it by day and with the LED strip on", "3 Paint", "", None, None),
    ("To buy", "Your pale mint (#dbffc8), mixed in Valspar at B&Q: V700 Premium Blend matt for walls, ceiling, alcove and chimney breast (three 2.5 L tins, about £29 each); V700 Interior Wood & Metal eggshell for skirting and radiator (the door and its frame stay white, v20); primer and undercoat <b>(v51: your colour)</b>", "3 Paint", "", 110, 190),
    ("To buy", "Woodwork primer, sanding pads and sugar soap for the white skirting and door", "3 Paint", "1", 20, 40),
    ("To do", "Paint the whole room before anything is fixed: alcove and breast included; skirting and door from white to eggshell", "3 Paint", "", None, None),
    ("Done", "Check the alcove back wall for fixings (solid)", "4 Base unit", "", None, None),
    ("To do", "Measure the alcove's width at the floor, 76, 134, 155 and 196 and the ceiling, and the floor's level across it", "4 Base unit", "", None, None),
    ("Done", "Check the side wall where the ledge and PC shelf go, and the chimney breast where the dining wall goes: solid (you confirmed) <b>(new)</b>", "4 Base unit", "", None, None),
    ("To buy", "Two IKEA BESTÅ 60×40×64 frames, white stained oak effect, for bays 1–2", "4 Base unit", "2", 70, 200),
    ("To buy", "Plinth for bays 1–2: 18 mm ply ladder frame 120 × 38 × 9 cm with a clear bay under bay 2, plus shims", "4 Base unit", "1", 15, 30),
    ("To buy", "Hidden plinth drawer: oak front 54 × 6 with a finger-pull groove underneath, 12 mm ply box 52 × 34 × 5, 300 mm full-extension runners <b>(changed: no push-to-open at floor level, as v6.1 said)</b>", "4 Base unit", "1", 30, 50),
    ("To buy", "Bay 3 carcass: 18 mm birch ply, 60 × 40 × 73 cm from the floor, connector bolts, and a 12 mm birch-ply divider 38 × 69.4 that splits it into the slim game column and the LP column <b>(changed in v16: the divider)</b>", "4 Base unit", "1", 50, 90),
    ("To buy", "Two face-out LP crates, 34.9 × 40 (a 33 cm trough): 12 and 9 mm birch ply cut to size, 15 mm oak lips, raked rests, felt, two pairs of 400 mm runners rated 68–70 kg <b>(changed in v16: snug crates, no dead space)</b>", "4 Base unit", "2", 120, 200),
    ("To buy", "Three slim drawers for the game column, 15.3 × 40: 6 mm birch ply sides and backs, 12 mm bases, oak lips, felt, three pairs of 400 mm runners (light duty is enough); a 2 m USB-C lead and a grommet for the pads drawer <b>(new in v16)</b>", "4 Base unit", "3", 70, 130),
    ("To buy", "BESTÅ shelves, 56 × 36 cm (20 kg max each), two each for bays 1 and 2", "4 Base unit", "4", 12, 32),
    ("To buy", "The sub in bay 2: an isolation riser for it (dense foam or sorbothane, about 22 × 28 × 3), 12 mm birch ply for the divider (35.3 × 38) and the part shelf (32.2 × 36), four shelf pins, felt pads <b>(new in v13.5: the sub moves into the media wall)</b>", "4 Base unit", "1", 25, 45),
    ("To buy", "Anti-tip brackets and 4 cm spacer blocks: both frames and bay 3", "4 Base unit", "1 set", 15, 25),
    ("To do", "Measure about ten games of each kind (PS2, Xbox 360, Xbox One) before cutting the game drawer", "4 Base unit", "", None, None),
    ("To buy", "Game drawer kit: 12 mm birch ply cut to size, 350 mm full-extension soft-close runners (35–49 kg), oak lip, follower block, felt", "4 Base unit", "1", 50, 90),
    ("To do", "Build the plinth and bay 3, fix everything to the wall, fit the shelves, drawers and trays; place the TV and soundbar", "4 Base unit", "", None, None),
    ("To buy", "Two solid oak uprights, 165 × 30 × 4.5 cm (cut to 159), quarter-sawn if possible", "5 Oak joinery", "2", 150, 300),
    ("To buy", "Solid oak for the shelves: high shelf in two lengths (128.9 and 51.7 × 30 × 4), Series X shelf 55 × 30 × 4, record ledge 128.9 × 7 × 2.4, the side-wall run from one board 225 × 30 × 4 (cut to its sweep), lips <b>(changed in v15: one run for the ledge and the PC shelf)</b>", "5 Oak joinery", "1 set", 230, 380),
    ("To buy", "Oak wedges, 10 mm oak dowel for pegs and dowels, concealed upright brackets; two concealed shelf brackets for the PC shelf, rated 40 kg+ a pair", "5 Oak joinery", "1", 30, 60),
    ("To buy", "One solid oak worktop, 300 × 62 cm, full stave: the alcove top (186 × 46), chamfered front; keep the offcut <b>(changed in v29: no backboard, the table's in its cabinet)</b>", "5 Oak joinery", "1", 250, 450),
    ("To buy", "Oak face frame, 20 mm, 186 cm for the base", "5 Oak joinery", "1", 60, 120),
    ("To buy", "Keyboard tray for the PC shelf: 7 cm oak housing under it, 12 mm ply tray 54 × 26 with an oak lip, 300 mm light-duty runners <b>(new: back from v6.1)</b>", "5 Oak joinery", "1", 25, 45),
    ("To do", "Cut the joints and fit the uprights, shelves, ledges and face frame; notch the uprights for the ceiling strip", "5 Oak joinery", "", None, None),
    ("To buy", "Solid oak for the table: two halves 90 × 92.5 × 2.7, each a centre 78.5 × 90 of edge-glued staves with two pegged breadboard ends (the cutting list) <b>(changed in v29: 185 open)</b>", "6 Dining wall", "1 set", 265, 460),
    ("To buy", "The dining cabinet: oak-faced ply cut to size, 18 mm for its two boxes (four ends, two tops, two floors), the linen shelf, the chair shelf and the two doors (90.5 and 45.5 × 183.8); a 6 mm ply back for each box (the cutting list) <b>(changed in v30: two boxes, 144 long, with hinged doors and no drawer)</b>", "6 Dining wall", "1 set", 230, 410),
    ("To buy", "Oak for the cabinet's hinge rail (91 × 15.4 × 7), the eight apron rails, the four tapered legs (6.5 × 4.5) and two door stops <b>(changed in v31: the rail set back for the pads)</b>", "6 Dining wall", "1", 35, 70),
    ("To buy", "Altro continuous piano hinge, 1800 × 50, cut to 90: the table's foot <b>(new in v27)</b>", "6 Dining wall", "1", 16, 20),
    ("To buy", "Folding, self-locking table-leg brackets, a set of four, and sixteen figure-8 tabletop fasteners for the aprons <b>(new in v27)</b>", "6 Dining wall", "1", 60, 75),
    ("To buy", "The doors' hinges and catches: two Altro continuous piano hinges, 1800 × 32 × 1 mm, stainless, one the height of each door; four magnetic catches (the doors and the folded table), a 10 mm flush magnet and two steel cups to hold an open door flat, a small brass hook for the cloth bag, two steel angle brackets for the wall <b>(new in v30: hinged doors, not sliding)</b>", "6 Dining wall", "1", 35, 65),
    ("To buy", "Folding chairs, six: your grey padded ones (Brayden Studio on Wayfair, sold in pairs, so three sets of two): wooden frames, grey linen, a 47 × 47 seat with a 6.5 cm cushion, a 110° back, 168 kg; folded 90 × 10 × 47, they live in the cabinet. The estimate is about £80–130 a pair: read the listing's price <b>(new in v33: they replace the beech FRÖSVI and its tie-on pads)</b>", "6 Dining wall", "6", 240, 390),
    ("To buy", "Three Lee Valley 40574 narrow flip-top hinges (solid brass, 1.27 × 7.0 cm) for the joint <b>(new in v15)</b>", "6 Dining wall", "3", 25, 45),
    ("To buy", "The glass display case's glass: toughened, cut to size, polished edges: a 4 mm front 85.6 × 82.2 that lifts off, and three 6 mm shelves 85.6 × 9.2 <b>(new in v34)</b>", "5 Oak joinery", "1 set", 70, 130),
    ("To buy", "The glass display case's oak and fittings: the frame from the oak offcuts (two sides 85 × 12 × 2, top and bottom 86 × 12 × 2), a 6 mm oak-faced ply back 86 × 81, twelve shelf pins for glass, an oak French cleat 80 long, a warm white LED strip under the top on the strips' app <b>(new in v34)</b>", "5 Oak joinery", "1 set", 20, 40),
    ("To do", "Build the glass display case and hang it on the chimney breast, from 137 to 222, centred (step 9) <b>(new in v34)</b>", "5 Oak joinery", "", None, None),
    ("To buy", "The “now playing” ledge on the breast, with the table by the stairs: oak 105.5 × 7 × 2.4 with a 1.5 lip (from the shelf board's offcut), two concealed brackets <b>(new in v16)</b>", "6 Dining wall", "1", 10, 25),
    ("To do", "Build the dining cabinet: the two boxes, screwed to each other and to the wall, the hinge rail, the two table halves on their aprons and legs, hang the table on its piano hinge, then the two doors on theirs (step 11) <b>(changed in v30)</b>", "6 Dining wall", "", None, None),
    ("To do", "Open the table, level it at 76 and trim the legs to the floor; load the six chairs (two lying in the table box's base, four standing in the chair box) <b>(changed in v30)</b>", "6 Dining wall", "", None, None),
    ("To do", "Swap both ceiling fittings for the spot bars, turned to run from the TV towards the window: like for like, your own job; step 12 has the safe way. The light switches stay as they are (smart bulbs need full power) <b>(changed in v15: no dimmers)</b>", "7 Lighting", "", None, None),
    ("To buy", "Eight smart colour E14 bulbs for the bars: WiZ Colour P45 E14, 4.9 W (Wi-Fi, no hub), or Philips Hue White and Colour E14 lustre, 5.1 W, if a WiZ shows below its shade; both under the bar's 6 W <b>(new in v15)</b>", "7 Lighting", "8", 100, 360),
    ("To buy", "Smart colour strips for the upright grooves and under the side-wall run, in the same app as the bulbs: about 4.5 m of RGB and tunable-white strip (Philips Hue Lightstrip Plus, or WiZ's strip kits, cut at their marks), three aluminium channels with opal diffusers, plug-in power on the 10-gang (no fused spur); a 6500K bias light for the TV stays plain white <b>(changed in v16: smart colour, so the whole wall changes with a scene)</b>", "7 Lighting", "1", 90, 220),
    ("To buy", "Two Dunelm Elements Wolston 4-light spotlight bars, £49 each (bulbs above) <b>(changed: two)</b>", "7 Lighting", "2", 98, 110),
    ("To buy", "Optional: a smart button for the bars, so a scene is one press rather than the app (WiZ remote or Hue dimmer switch) <b>(new in v15)</b>", "7 Lighting", "1", 0, 25),
    ("To do", "Set up the smart bulbs in their app: group them as bar 1 and bar 2, then save the four presets (Evening, Bright, Cosy, Film; Paint and light) with their levels and colours, and the table rule; your red lamp's bulbs go in the same scenes <b>(new in v15)</b>", "7 Lighting", "", None, None),
    ("To buy", "Later: aluminium channel and opal diffuser for the existing ceiling LED strip (optional)", "7 Lighting", "1", 0, 80),
    ("To buy", "5-in-1 4K60 HDMI switch with remote", "8 TV, consoles and AV", "1", 20, 35),
    ("To do", "Measure the PC-to-TV cable route (about 4–5 m along the skirting)", "8 TV, consoles and AV", "", None, None),
    ("To buy", "Active optical HDMI cable for the PC, certified Ultra High Speed (48 Gbps), about 5 m", "8 TV, consoles and AV", "1", 20, 60),
    ("To buy", "High Speed HDMI leads, 1–2 m; two 90° HDMI adapters in case the TV's plugs need them", "8 TV, consoles and AV", "5 + 2", 25, 40),
    ("To buy", "RetroTINK-6X CE upscaler for the PS2 and PS1 (order on restock; UK price includes VAT and import fees)", "8 TV, consoles and AV", "1", 200, 240),
    ("To buy", "PS2 component video cable, good quality", "8 TV, consoles and AV", "1", 10, 20),
    ("To buy", "Optical (TOSLINK) cable, 2 m, PS2 straight to the soundbar", "8 TV, consoles and AV", "1", 5, 10),
    ("To buy", "RGB SCART cable for the PS1", "8 TV, consoles and AV", "1", 8, 15),
    ("To do", "Connect the TV inputs; set up the PS2 and RetroTINK", "8 TV, consoles and AV", "", None, None),
    ("To buy", "Replacement stylus for the turntable (exact match for its model)", "9 Vinyl kit", "1", 15, 40),
    ("To buy", "External phono preamp (only if the deck has a PHONO/LINE switch)", "9 Vinyl kit", "1", 40, 100),
    ("To buy", "RCA-to-3.5 mm lead, 2 m: preamp under the Series X shelf to the soundbar's AUX <b>(changed: shorter)</b>", "9 Vinyl kit", "1", 5, 10),
    ("To buy", "Isolation feet for the turntable; a carbon-fibre record brush", "9 Vinyl kit", "1", 20, 40),
    ("To do", "Set the tracking weight; soundbar in Music mode", "9 Vinyl kit", "", None, None),
    ("To do", "Turn on HDMI-CEC (SIMPLINK); PS3 Control for HDMI off", "10 Finishing", "", None, None),
    ("To do", "Deco app: prioritise the Series X and PC, guest Wi-Fi, automatic firmware", "10 Finishing", "", None, None),
    ("To do", "Label both outlets of the double socket (left: everything, right: retro) and each HDMI switch input", "10 Finishing", "", None, None),
    ("To do", "Set the sub and rear speaker levels from the sofa", "10 Finishing", "", None, None),
    ("To buy", "Drip trays or a waterproof mat under the pots on the plant stand's slatted tiers; if you add clip-on grow lights later, a smart plug with a schedule <b>(new in v18)</b>", "10 Finishing", "1", 10, 20),
    ("To buy", "Felt pads under the vinyl stand's feet, so it slides out from the breast without marking the floor <b>(new in v18)</b>", "10 Finishing", "1", 3, 6),
    ("To buy", "A storage ottoman in navy velvet, about 76 × 76 × 45 with a lift-off padded lid, in place of your blue cord one: ISTOOLS Large Velvet Storage Ottoman, 76 × 76 (check its height and price on the listing), or Dunelm's Square Opulent Velvet Storage Footstool in navy, 62 square, if you'd like it smaller <b>(new in v34)</b>", "10 Finishing", "1", 140, 310),
    ("To buy", "A rug about 230 × 160 in front of the sofa: cream with deep blue, rust and ochre goes with the green, the oak and the blue sofa (the plan draws one as a guide) <b>(new in v15)</b>", "10 Finishing", "1", 120, 300),
]

# v38: the client's picks (geometry.FIRM) are the plan now: each in the buy list and the build; the rest are options to look at
TRACK += [
    ("To buy", "The bar beside the dining cabinet: 18 mm oak-faced ply for a cupboard 42.5 × 22 × 87 on a 3 cm plinth (two ends, a floor, a shelf, a back, two doors), a 27 mm oak counter 42.5 × 22.4, two pairs of soft-close hinges, two brass knobs", "6 Dining wall", "1 set", 70, 120),
    ("To buy", "Over the bar: an IKEA ENHET wall frame with shelves, 40 × 15 × 75, anthracite, a 3 mm acrylic mirror cut to 42 × 97, a warm white LED strip", "6 Dining wall", "1 set", 50, 80),
    ("To do", "Build the bar beside the dining cabinet: scribe it between the cabinet's end and your shelf's end (the 10 cm gap stays clear for the plant), screw it to the wall and the floor; the mirror, then the ENHET frame from 112 (step 11)", "6 Dining wall", "", None, None),
    ("To buy", "Two IKEA EKET wall cabinets with glass doors, 35 × 35 × 35, walnut effect, with their rails, and plugs and screws for a solid wall", "10 Finishing", "2", 70, 100),
    ("To do", "Hang the two wall cabinets over the sofa's corner, 162 to 197 up, just past the PC shelf's end", "10 Finishing", "", None, None),
    ("To buy", "Two oak floating shelves 900 × 230 with concealed brackets (B&Q Shelf Depot), for the window corner", "10 Finishing", "2", 70, 110),
    ("To do", "Fix the two alcove shelves in the window corner, tops at 182 and 212, into the solid wall", "10 Finishing", "", None, None),
    ("To buy", "An oak shelf over the hall door, 91 × 27, on two brackets, and two IKEA KUGGIS lidded boxes 35 × 26 × 15, white", "10 Finishing", "1 set", 35, 60),
    ("To buy", "Two IKEA KUGGIS lidded boxes, 35 × 26 × 15, white, for your black shelf", "10 Finishing", "2", 20, 30),
    ("To buy", "Drawers in the bottom three steps: three drawer boxes in 12 mm ply, 51 × 14.5 fronts in oak, three pairs of 350 mm runners, bearers under the treads", "10 Finishing", "1 set", 180, 320),
    ("To do", "Have the step drawers made with the new stairs (a joiner: each tread needs a bearer once its riser is cut)", "10 Finishing", "", None, None),
    ("To buy", "The blanket basket at the sofa's open end: Dibor's Lakelyn water hyacinth lined basket, large, 59 × 51 × 29", "10 Finishing", "1", 36, 42),
    ("To buy", "The record table: two IKEA KALLAX 42 × 42, an 18 mm oak board 60 × 120 (the lid, 90 × 50), 12 mm ply for the base, four 50 mm castors, a piano hinge cut to 83, two lid stays", "10 Finishing", "1 set", 170, 210),
    ("To do", "Build the record table: the two KALLAX screwed together on their backs, the ply base and castors, the oak lid on its hinge and stays", "10 Finishing", "", None, None),
    # v43, client: "I want the c table in the current main plan": oak from the Snowdon pack's second board, a steel plate under its foot
    ("To buy", "The C-table: a 400 × 200 × 6 mm steel plate (PlazCutz), four felt pads, 4 × 40 mm screws and wood glue (the oak is the Snowdon pack's second board)", "10 Finishing", "1 set", 8, 15),
    ("To do", "Build the C-table: the top, the upright and the foot glued and screwed, corners rounded, oiled; the plate screwed under the foot, felt under that", "10 Finishing", "", None, None),
]
PHASES = []
for r in TRACK:
    if r[2] not in PHASES:
        PHASES.append(r[2])
BIGGEST = {"1 Network, now": "two 8-port switches", "2 Cables and power": "the electrical safety kit and Cat6", "3 Paint": "paint",
           "4 Base unit": "record trays and the BESTÅ frames", "5 Oak joinery": "the solid oak worktop", "6 Dining wall": "the oak table top",
           "7 Lighting": "the eight smart bulbs", "8 TV, consoles and AV": "RetroTINK-6X CE", "9 Vinyl kit": "phono preamp", "10 Finishing": "the rug"}


# v13.6, client: "make the build plan easy to tell how to find which part ie network/media wall/table etc".
# Every step and every buy-list phase carries one or more of these coloured part labels.
PARTS = {"Prep": "#6b6862", "Network": "#2a73d9", "Power & cables": "#c4482c", "Paint": "#4f7a52",
         "Media wall": "#8a5a32", "Dining table": "#b0700f", "Lighting": "#8f7a00", "AV": "#7a4fb0", "Your picks": "#3f7f6a"}
PHASE_PART = {"1 Network, now": ["Network"], "2 Cables and power": ["Power & cables", "Network"], "3 Paint": ["Paint"],
              "4 Base unit": ["Media wall"], "5 Oak joinery": ["Media wall"], "6 Dining wall": ["Dining table"], "7 Lighting": ["Lighting"],
              "8 TV, consoles and AV": ["AV"], "9 Vinyl kit": ["AV"], "10 Finishing": ["AV", "Network"]}


def part_chip(parts):
    if isinstance(parts, str):
        parts = [parts]
    return "".join(f'<span class="part" style="--pc:{PARTS[x]}">{x}</span>' for x in parts)


def scenes_html():
    """v25: the three lighting presets (scenes.py): a table of every layer's level, then each preset on its own with its drawing,
    its colours and its notes, the table rule drawn over the open table, and the two rules. In the viewer the figures become
    buttons (build_viewer replaces the part between the markers)."""
    import scenes as SC
    head = "<tr><th>Light</th><th>Control</th>" + "".join(f"<th>{s[1]}</th>" for s in SC.SCENES) + "</tr>"
    rows = "".join(f"<tr><td>{name}</td><td>{ctl}</td>" + "".join(f"<td class='num'>{SC.level_word(s[3][k])}</td>" for s in SC.SCENES) + "</tr>"
                   for k, name, ctl in SC.LAYERS)
    figs = "".join(f"<h4>{s[1]}</h4><p>{s[2]} <i>Colour: {SC.COLOURS[s[0]]}.</i></p><figure>{light_scene(s[0])}</figure><ul>"
                   + "".join(f"<li>{x}</li>" for x in s[4]) + "</ul>" for s in SC.SCENES)
    figs += f"<h4>With the table open</h4><figure>{light_scene('bright', table=True)}</figure>"
    rules = "<div class='why'><b>Two rules</b><ul>" + "".join(f"<li>{r}</li>" for r in SC.RULES) + "</ul></div>"
    return (f"<table class='tight'>{head}{rows}</table>"
            "<p class='note'>Levels are brightness in the app for the smart bars and the lamp, and roughly how far up the strip's controller and the uprights' inline dimmer go. A preset changes how bright the heads are (and their colour), not where they point.</p>"
            + rules + f"<!--scenes-->{figs}<!--/scenes-->")


def paint_table():
    """v38: each wall's area and the paint it needs (two coats). Every wall is the pale mint in the plan (v51); the 3D room's Look tries others."""
    a = G.wall_areas()
    rows = "".join(f"<tr><td>{G.WALL_NAMES[k]}</td><td>{v:.1f} m²</td><td>{G.paint_litres(v):.1f} L</td></tr>" for k, v in a.items())
    t = sum(a.values())
    return (f'<table class="tight"><tr><th>Wall</th><th>Area (less window and door)</th><th>Two coats</th></tr>{rows}'
            f'<tr><td><b>All walls</b></td><td><b>{t:.1f} m²</b></td><td><b>{G.paint_litres(t):.1f} L: two 2.5 L tins</b><sup>{fit.ORDER.index("valspar") + 1}</sup></td></tr></table>'
            '<p class="caption">Trying a different colour on one wall in the 3D room (Look): that wall needs one 2.5 L tin.</p>')


def scenes_v24_html():
    """v25: the five scenes of v13.7 to v24, for the appendix."""
    import scenes as SC
    head = "<tr><th>Light</th>" + "".join(f"<th>{s[1]}</th>" for s in SC.SCENES_V24) + "</tr>"
    rows = "".join(f"<tr><td>{name}</td>" + "".join(f"<td class='num'>{SC.level_word(s[3][k])}</td>" for s in SC.SCENES_V24) + "</tr>" for k, name, _c in SC.LAYERS)
    where = "; ".join(f"{s[1]} → {dict((k, n) for k, n, *_ in SC.SCENES)[SC.OLD_TO_NEW[s[0]]]}" for s in SC.SCENES_V24)
    return (f"<h3>The five lighting scenes</h3><p>Six buttons (these five and Daytime) mixed moods, an activity that depends on the table, and the time of day. "
            f"They became three presets and two rules. Where each went: {where}, with the table rule for dinner; Daytime is now a switch.</p>"
            f"<table class='tight'>{head}{rows}</table>")


# v27: the flip-top's rows (v15–v26), out of the buy list since the dining cabinet became the plan; section 5 costs the alternative with them
FLIPTOP_ROWS = [
    ("To buy", "Solid oak for the flip-top: two panels 110 × 80 × 2.7 with pegged breadboard ends, the top and the half (edge-glued staves from a timber merchant, who can also radius the corners) <b>(changed in v15: the half replaces the leaf)</b>", "6 Dining wall", "1 set", 280, 480),
    ("To buy", "Two Häfele Hebgo heavy-duty folding brackets, 287.43.428 (580 arm, 500 kg a pair) <b>(new)</b>", "6 Dining wall", "2", 70, 120),
    ("To buy", "Union PowerLoad lift-off hinges, 100 × 88, one 3-pack (all the same hand) <b>(new)</b>", "6 Dining wall", "1", 16, 20),
    ("To buy", "The gate leg: two tapered oak legs 73.3 × 4.5 to 3 and a 94 × 7 × 2 oak apron (from the cutting list), two 75 mm butt hinges, two folding locking stays <b>(new in v15: instead of eight legs and the leaf's leg case)</b>", "6 Dining wall", "1", 40, 90),
    ("To buy", "Oak for the hinge rail (110 × 4 × 7.3), two oak turn buttons, a magnetic catch, felt pads <b>(changed in v15)</b>", "6 Dining wall", "1", 15, 30),
    ("To buy", "Folding chairs, IKEA FRÖSVI (TERJE's successor, the same size) or similar with a hole in the back for a hook, four, or six for six at the table (skip if yours fit: seat about 45–48) <b>(changed in v20)</b>", "6 Dining wall", "4–6", 100, 240),
    ("To buy", "The chair cupboard beside the table: oak (or oak-faced ply) for its two sides, top, floor and shelf and two doors (cutting list), a 6 mm back, four concealed soft-close hinges, two push latches, two screws and plugs for its top rail <b>(new in v20)</b>", "6 Dining wall", "1", 120, 240),
    ("To do", "Fix the backboard and hinge rail, hang the brackets and the top, fit the half on its flip-top hinges and the gate leg under it; check it opens, locks, folds and folds up", "6 Dining wall", "", None, None),
    ("To do", "Build the chair cupboard and stand it in the gap between the table's window end and the pipe boxing: level it, screw its top rail to the wall, hang the doors to swing towards the table; stand two folded chairs on its floor and two on its shelf <b>(new in v20)</b>", "6 Dining wall", "", None, None),
]


# v30: the sliding cabinet (v29) is the alternative; its own rows, out of the buy list, cost it in section 5
SLIDE_ROWS = [
    ("To buy", "The dining cabinet: oak-faced ply cut to size, 18 mm for its two ends, floor, partition, chair shelf, linen floor, the drawer front and the two sliding doors (98.7 × 183.3), 19 mm for the top (it carries the track); a 6 mm ply back; 12 mm ply for the drawer box (the cutting list) <b>(changed in v29: two sliding doors across the front)</b>", "6 Dining wall", "1 set", 300, 540),
    ("To buy", "Oak for the cabinet's hinge rail (91 × 19.2 × 7), the eight apron rails and the four tapered legs (6.5 × 4.5) <b>(changed in v29)</b>", "6 Dining wall", "1", 35, 70),
    ("To buy", "The doors' sliding gear: Häfele Slido Classic 40 IF C, the fitting set for two doors with soft close (402.33.027), a 2.5 m double top track for a groove (402.33.652) and a bottom guide track (402.30.802), both cut to 194.4; a pair of 150 mm drawer runners, two magnetic catches and a knob for the folded table, two steel angle brackets for the wall <b>(changed in v29: sliding doors, so no door hinges or door knobs)</b>", "6 Dining wall", "1", 110, 190),
]
CAB_ONLY = ("The dining cabinet: oak-faced ply", "Oak for the cabinet's hinge rail", "The doors' hinges and catches")


def slide_cost():
    """The sliding cabinet's cost: the buy list's shared dining rows (the table, its hinges, legs, chairs) and its own three."""
    rows = [r for r in cabinet_rows() if not _plain_txt(r[1]).startswith(CAB_ONLY)] + SLIDE_ROWS
    return sum(r[4] or 0 for r in rows), sum(r[5] or 0 for r in rows)


def fliptop_cost():
    """The flip-top's cost (v15–v26 rows), with the three flip-top hinges it shares with the cabinet's buy list."""
    rows = FLIPTOP_ROWS + [r for r in TRACK if _plain_txt(r[1]).startswith("Three Lee Valley 40574")]
    return sum(r[4] or 0 for r in rows), sum(r[5] or 0 for r in rows)


def cabinet_rows():
    """The buy list's rows for the dining cabinet: the "6 Dining wall" purchases, less the breast's LP frames and ledge."""
    return [r for r in TRACK if r[2] == "6 Dining wall" and r[4] is not None and not _plain_txt(r[1]).startswith(("Two LP frames", "The “now playing” ledge"))]


def _plain_txt(x):
    import re
    return re.sub(r"<[^>]+>", "", x)


def cab_html():
    """v30: the compact dining cabinet as the plan, in section 5: what it is, using it, how many sit down, the drawings, the cost."""
    import fit as F
    C = G.CAB
    st = F.optc_seats(C)
    seats = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{d}</td><td>{e}</td></tr>" for a, b, _s, d, e, _r in F.max_seats_zone()[2])
    rows = cabinet_rows()
    lo, hi = sum(r[4] for r in rows), sum(r[5] for r in rows)
    kg_half = C["top"][0] * C["top"][1] * C["top"][2] * 0.72 / 1000
    sl_len = G.OPTC["z"][0] - G.OPTC["z"][1]
    sup = lambda *k: "<sup>" + ",".join(str(F.ORDER.index(x) + 1) for x in k) + "</sup>"
    return f"""
<p><b>The compact dining cabinet is the plan:</b> you asked for "a smaller build on the cabinet", so the same table and the same six chairs now pack into <b>two oak boxes side by side</b>, {n(C['len'])} × {n(C['d'])} × {n(C['h'])}, under your shelf by the stairs, {n(C['d'] - (G.PIPE_BOX['x'][1] - G.PIPE_BOX['x'][0]))} cm proud of the pipe boxing. Shut, it's two plain oak doors. Open, the table is {n(C['len_open'])} × {n(C['top'][0])} and six sit in comfort, three a side, on your grey padded chairs.</p>
<figure class="render">{img("render_v39_3d_c_folded.png", "The compact dining cabinet packed away: two oak boxes under the shelf")}
<figcaption>Packed away, in the 3D room: the table box and the chair box side by side.</figcaption></figure>
<ul>
<li><b>Where the length went.</b> Two chairs now <b>lie on their sides in the table box's base</b>, under the hinge rail, where the sliding cabinet had its drawer. The other four <b>stand in a box one chair wide</b>: two deep on its floor and two deep on its shelf. The chairs are padded, so there are no seat pads to keep.</li>
<li><b>Hinged doors that turn right back.</b> Each door hangs on a full-height stainless piano hinge{sup("piano32")} with its knuckle just in front of the faces, so it turns 180° and lies flat over its neighbour. Nothing stands out into the room. Open, the table door reaches {n(C['z'][1] - C['door_t_open'][1])} past the cabinet's window end, {n(C['door_t_open'][1] - (G.PLANT_LAYOUTS['corner']['plants'][1] + G.PLANT_STAND['d'] / 2))} clear of your plant stand.</li>
<li><b>The table box, at the stair end</b> ({n(C['bay_t'])} inside). The {n(C['len_open'])} × {n(C['top'][0])} solid oak table stands up in it in two {n(C['top'][1])} × {n(C['top'][0])} halves, folded face to face, on its oak hinge rail at {n(C['pivot'][1])}. The two lying chairs are underneath it. Above it is the <b>linen shelf</b> for the cloth, the napkins, the runner and the candles.</li>
<li><b>The chair box, at the window end</b> ({n(C['bay_c'])} inside): four folded chairs, {n(C['bay_c'] - G.CHAIR_PADDED['folded'][0])} cm wider than a chair, with a fixed shelf at {n(C['shelf_y'] + C['t'])}.</li>
<li><b>The table is unchanged:</b> the two halves meet flush on three brass flip-top hinges{sup("fliphinge")}, each a centre of staves between pegged breadboard ends. Four tapered oak legs fold flat inside the aprons. Each half is about {kg_half:.0f} kg.</li>
</ul>
<h3>Using it</h3>
<ol>
<li><b>Opening:</b> clear the floor in front of it and push the ottoman to the sofa. Open the chair door, lay it back over the table door and take the four chairs out, then shut it.</li>
<li>Open the table door and lay it back over the chair door, where a flush magnet holds it. Lift the two chairs out of the base, front one first.</li>
<li>Pull the finger pull at the top of the folded table and lower it halfway on its piano hinge{sup("pianohinge")}. Unfold the inner half's two legs until each clicks{sup("legbracket")}, then lower it onto them. Lift the outer half up and over, unfold its legs until they click, and lower it. The table is {n(C['len_open'])} long, its top at {n(G.TABLE_TOP)}, level with the media wall's worktop.</li>
<li><b>Folding away:</b> do it the other way round. Fold the legs and the outer half, swing the table up until the catches take it, then put the two chairs in the base and shut the table door. Then the four chairs go in the chair box. Use two hands, and never fold it with anything on the table.</li>
</ol>
<h3>The chairs: your grey padded ones</h3>
<p>Your chairs{sup("padded")}: Brayden Studio's <b>wooden folding chairs in linen</b>, sold in pairs, a 47 × 47 seat with a 6.5 cm cushion, {G.CHAIR_PADDED['kg']} kg each. <b>Folded they're {n(G.CHAIR_PADDED['folded'][2])} × {n(G.CHAIR_PADDED['folded'][1])} × {n(G.CHAIR_PADDED['folded'][0])}</b>: only 1 cm thicker and 1 cm taller than the beech FRÖSVI the cabinet was drawn for, so they pack in the same way with three small changes:</p>
<ul>
<li><b>{n(C['d'])} deep instead of 22</b>, so two stand one behind the other ({n(C['in_d'])} inside for two at {n(G.CHAIR_PADDED['folded'][1])}). The cabinet stands {n(C['d'] - (G.PIPE_BOX['x'][1] - G.PIPE_BOX['x'][0]))} cm proud of the pipe boxing.</li>
<li><b>The chair box {n(C['bay_c'])} wide inside</b> (was 46), for a {n(G.CHAIR_PADDED['folded'][0])} chair: the cabinet is {n(C['len'])} long.</li>
<li><b>The chair shelf at {n(C['shelf_y'])}</b> (was 93.5), so a {n(G.CHAIR_PADDED['folded'][2])} chair stands under it and over it with a centimetre to spare. Two still lie in the table box's base, 0.5 clear at each end.</li>
</ul>
<p>The listing doesn't give the open chair's depth, height or seat height, so those are drawn at a like-for-like chair's{sup("costwaychair")}: {n(G.CHAIR_PADDED['d'])} deep, {n(G.CHAIR_PADDED['h'])} tall, the seat at {n(G.CHAIR_PADDED['seat_h'])}. Seated on the stair side, a chair's back reaches into the door's swing: <b>keep the door shut while you eat</b> unless they measure {n(G.BREAST_D_WEST - G.DOOR_SWING - C['tz'][0] + G.CHAIR_TUCK)} deep or less. About £80–130 a pair.</p>
<p class="note">The idea is a proven one: fold-down tables built into wall units are made this way{sup("foldtable")}. Your stairs wall is solid (your answer){sup("solidwall")}, so the boxes stand on the floor and are screwed to the wall at the top with plugs and screws so they can't tip.</p>
<figure>{cab_elevation()}</figure>
<figure class="render">{img("render_v39_3d_c_chairs.png", "The compact cabinet: the chair door open, four chairs inside")}
<figcaption>The chair door turned back flat over the table door: four folded chairs.</figcaption></figure>
<h3>How many sit down</h3>
<p><b>Six, all in comfort:</b> three on the stair side ({st['stair'][1]:.1f} cm of edge each) and three on the window side ({st['window'][1]:.1f} each, from the sofa's arm to the cabinet). The open table door clears the nearest window-side chair by {n(C['door_t_face'] - (max(x for x, z, f in C['seats']['six'] if f == 'w') + G.CHAIR_PADDED['w'] / 2))} cm. The coffee table stays where it is, and a seventh chair fits at the far end if you bring one.</p>
<table class="tight"><tr><th>Table</th><th>Seats</th><th>How</th><th>Notes</th></tr>{seats}</table>
<figure>{cab_plan()}</figure>
<figure class="render">{img("render_v39_3d_c_six.png", "The compact dining cabinet open for six")}
<figcaption>Open for six in the 3D room: the table door turned back flat over the chair door.</figcaption></figure>
<h3>How it's built</h3>
<p>Step 11 of the build guide builds it in order, with every size. You build the two boxes and screw them together and to the wall. Then the hinge rail, the two halves with their aprons and legs, and the joint. Then you hang the table, the catches, and the two doors on their piano hinges. The drawings below are the ones to have open on the bench.</p>
<figure>{cab_carcass()}</figure>
<figure>{cab_section()}</figure>
<figure>{option_c_halves()}</figure>
<ul>
<li><b>The two boxes:</b> oak-faced ply, cut to size by the merchant. Each has two ends {n(C['h'])} tall and {n(C['d'])} deep, a top and a floor between them, a 6 mm back and a shelf set back behind the door. The table box is {n(C['bay_t'])} inside and the chair box {n(C['bay_c'])}. They're screwed to each other through their meeting ends, so they read as one cabinet.</li>
<li><b>The doors:</b> {n(C['door_tw'])} and {n(C['door_cw'])} wide, {n(C['door_h'])} tall, 18 mm oak-faced ply, about {C['door_kg'][0]:.0f} and {C['door_kg'][1]:.0f} kg. They're inset flush with the front edges, the grain upright, each on a 1800 mm stainless piano hinge (1.9 short of each end) on the boxes' meeting ends. A stop with a magnetic catch sits behind each free edge.</li>
<li><b>The hinge rail:</b> solid oak, {n(C['bay_t'])} × {n(C['rail_x'][1] - C['rail_x'][0])} × 7, across the table box with its top at {n(C['pivot'][1])}, its front {n(C['pads'])} behind the door (the cloth bag hangs on the door in front of it). The table's piano hinge sits {n(C['pivot'][0] - C['rail_x'][0])} back from its front. It carries the table's whole weight when it's open.</li>
<li><b>The halves and the joint</b> are as before: edge-glued oak with pegged breadboard ends, each on an apron frame, the legs folding flat inside on self-locking brackets, three brass flip-top hinges at the joint.</li>
</ul>
<p>It costs about £{money(lo, hi)}, the chairs included: the "6 Dining wall" rows of the buy list (section 11).</p>
<p class="note">Safety: never swing the table up or down with anything on it. Check all four legs have clicked before you load it, and let the catches take it when it's folded. Hang the table door, open it flat and check its far end doesn't drop before you load the cabinet: piano hinges don't publish a load, so that's the test.</p>
"""


def cab_review_html():
    """v31, client: "review if there's any further optimisation we can do to the dining cabinet, we want the best compact build that doesnt
    bulk up the living room while keeping as many chairs as we can in the unit": every lever we tried, and what it would save."""
    import fit as F
    C, O = G.CAB, G.OPTC
    sup = lambda *k: "<sup>" + ",".join(str(F.ORDER.index(x) + 1) for x in k) + "</sup>"
    cw, cdep, ch = G.CHAIR_PADDED["folded"]                       # v33: your grey padded chairs, folded 47 × 10 × 90
    fw, fdep, fh = G.CHAIR_FOLDED                                  # the beech FRÖSVI
    need6 = (C["in_d"] - 0.4) / 6                                  # how thin six chairs lying two deep... six deep would have to be
    behind = C["in_d"] - C["stack"] - C["pads"]
    boxing = G.PIPE_BOX["x"][1] - G.PIPE_BOX["x"][0]
    rows = [
        (f"{n(C['d'])} deep, for your padded chairs two deep", f"it stands {n(C['d'] - boxing)} proud of the pipe boxing",
         f"<b>Needed:</b> they fold to {n(cdep)}, so two need {n(2 * cdep + 0.8)} inside; the folded table has {n(behind)} behind it."),
        (f"The beech FRÖSVI instead: it folds to {n(fdep)} × {n(fh)} × {n(fw)}" + sup("frosvi"), f"{n(C['d'] - 22)} of depth (22, flush with the boxing) and {n(C['bay_c'] - 46)} of length",
         "Your call: the padded chairs are comfier for that 1.4 cm, and need no tie-on pads."),
        ("No chair box: all six chairs lying under the folded table", f"{n(C['z_c'][0] - C['z_c'][1])} off the length",
         f"Six would have to fold to {need6:.1f} each; the slimmest folding chair made, the Plia" + sup("plia") + ", is 5.4, and £325 each."),
        ("A narrower table: 185 × 80 instead of 90", f"{n(C['len'] - G.CAB80['len'])} off the length ({n(G.CAB80['len'])} long)", "<b>Drawn: the more compact version, below.</b> Six still sit, but serving dishes get tight, and its base is too narrow for the two chairs lying down: four go inside, not six."),
        ("Three chairs deep in the chair box", "Nothing in length", f"It would be {n(cdep)} deeper, standing out from the pipe boxing: bulkier, not smaller."),
        ("Taller, three chairs high", "Nothing", f"Under your shelf {n(C['h'])} is the most: a chair stands {n(ch)} folded."),
    ]
    tr = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in rows)
    return f"""<h3>Could it be smaller? What we checked</h3>
<p>You asked for "the best compact build that doesnt bulk up the living room while keeping as many chairs as we can in the unit". All six chairs are inside, so we went through every way it could take less room. With your padded chairs it's {n(C['d'])} deep, {n(C['d'] - (G.PIPE_BOX['x'][1] - G.PIPE_BOX['x'][0]))} proud of the pipe boxing's face (with the FRÖSVI it was 22, flush). For a {n(C['len_open'])} × {n(C['top'][0])} table and six folding chairs, the rest is already as small as it goes. The table's width sets the table box, one chair's width the chair box, and two folded chairs the depth.</p>
<table class="tight"><tr><th>Change</th><th>What it would save</th><th>Our call</th></tr>{tr}</table>
<p>Against the long sliding cabinet we set aside ({n(O['z'][0] - O['z'][1])} × {n(O['d'])}), it takes {(1 - C['len'] * C['d'] / ((O['z'][0] - O['z'][1]) * O['d'])) * 100:.0f}% less floor along the wall.</p>
<figure class="render">{img("render_v39_3d_c_foot.png", "From above: the cabinet folded, and the floor it needs open")}
<figcaption>From above, folded, with the floor it needs once it's open drawn on the carpet.</figcaption></figure>
"""


def beside_html():
    """v31, client: "explore what could go next to the dining cabinet in the compact version which is now our primary option"."""
    import fit as F
    C, B = G.CAB, G.BESIDE
    sup = lambda *k: "<sup>" + ",".join(str(F.ORDER.index(x) + 1) for x in k) + "</sup>"
    covered = C["z"][1] - B["door_end"]
    m, tr, d = B["mirror"], B["trolley"], B["dresser"]
    return f"""<h3>What could go beside it</h3>
<p>Between the cabinet's window end and the pipe boxing there's <b>{n(B['len'])} cm of wall</b> under your shelf. While you eat, the table door lies back over the first {n(covered)} of it, {n(C['d'])} off the wall. So anything here stays no deeper than the cabinet, and your trailing plant hangs over its far end, its longest strands about {n(B['strands'])} up. Four ways to use it, all in the 3D room under Layout, "Beside the cabinet"; none is in the buy list or the totals:</p>
<ul>
<li><b>Left clear (the plan):</b> the open door's landing, and a breathing space before the plant stand.</li>
<li><b>A tall mirror, our pick:</b> IKEA NISSEDAL{sup("nissedal")}, {n(m['w'])} × {n(m['h'])}, black like your shelf, £25, on the wall from {n(m['y0'])} to {n(m['y0'] + m['h'])}. It bounces the window's light into the darkest corner and makes the room feel bigger, and it takes no floor at all. The open door lies in front of it while you eat.</li>
<li><b>A slim trolley:</b> VASAGLE's 4-tier slim trolley{sup("vasagle")}, {n(tr['w'])} long × {n(tr['d'])} deep × {n(tr['h'])}, £35.99. It parks here, and for dinner it pulls out, before the table door opens, to stand behind the window-side diners with the plates, the glasses and a jug (it can't reach the table's far end: with six sat down the sofa's end and the chairs leave no way past). Its top reaches {n(tr['h'] - B['strands'])} into the plant's longest strands, so trim them a little.</li>
<li><b>A low oak shelf:</b> one more box in the cabinet's oak-faced ply, {n(d['w'])} × {n(d['d'])} × {n(d['h'])}, open to the room: six dinner plates on edge{sup("plates")}, glasses and three bottles, its top under the strands. The open door covers {n(covered)} of its {n(d['w'])}, so take what you need out before the table comes down. About £40–80 more in ply and oil, from the cabinet's sheets.</li>
</ul>
<figure class="render">{img("render_v39_3d_beside_mirror.png", "Beside the cabinet: a tall mirror")}
<figcaption>Beside the cabinet with the mirror: IKEA NISSEDAL, 40 × 150, between the cabinet and the pipe boxing.</figcaption></figure>
<figure class="render">{img("render_v39_3d_beside_trolley.png", "Beside the cabinet: a slim trolley")}
<figcaption>The slim trolley parked beside the cabinet, ready to pull out for dinner.</figcaption></figure>
"""


def cab80_html():
    """v33, client: "The compact cabinet is our only choice for the table now or any upgraded more compact version for this as we're trying
    to optimise space": the same cabinet round an 80-wide table, its fit rows (fit.cab80_zone) and the two widths side by side."""
    import fit as F
    C, C8 = G.CAB, G.CAB80
    st, s8 = F.optc_seats(C), F.optc_seats(C8)
    sup = lambda *k: "<sup>" + ",".join(str(F.ORDER.index(x) + 1) for x in k) + "</sup>"
    cw, cdep, ch = G.CHAIR_PADDED["folded"]
    plate = 27.0
    head, _what, rows = F.cab80_zone()
    fr = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{d}</td><td>{e}</td><td>{r}</td></tr>" for a, b, _s, d, e, r in rows)
    side = [("On the wall", f"{n(C['len'])} × {n(C['d'])} × {n(C['h'])}", f"{n(C8['len'])} × {n(C8['d'])} × {n(C8['h'])}"),
            ("Bare wall left by the pipe boxing", n(C['freed']), n(C8['freed'])),
            ("The table, open", f"{n(C['len_open'])} × {n(C['top'][0])}", f"{n(C8['len_open'])} × {n(C8['top'][0])}"),
            ("At the table", f"{st['comfort']} in comfort, {st['stair'][1]:.1f} of edge each", f"{s8['comfort']} in comfort, {s8['stair'][1]:.1f} of edge each"),
            ("Down the middle, between two 27 plates" + sup("plates"), n(C['top'][0] - 2 * plate), n(C8['top'][0] - 2 * plate)),
            ("Chairs inside", "all six: four standing, two lying in the base", "four standing; two live elsewhere"),
            ("The table door", f"{n(C['door_tw'])} wide", f"{n(C8['door_tw'])} wide"),
            ("The window edge to the sofa's front, open", n(C['tz'][1] - G.SOFA_FRONT_Z), n(C8['tz'][1] - G.SOFA_FRONT_Z))]
    tr = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in side)
    return f"""<h3>The more compact version: an {n(C8['top'][0])}-wide table</h3>
<p>You said the compact cabinet is "our only choice for the table now or any upgraded more compact version for this as we're trying to optimise space". So the long sliding cabinet and the flip-top are set aside (appendix), and here is the one way it gets shorter still: <b>the same two oak boxes round a table {n(C8['top'][0])} wide instead of {n(C['top'][0])}</b>. The folded halves stand {n(C['top'][0] - C8['top'][0])} narrower, so the table box is {n(C['bay_t'] - C8['bay_t'])} shorter and the cabinet is <b>{n(C8['len'])} long</b>, {n(C8['freed'])} cm of bare wall back by the pipe boxing instead of {n(C['freed'])}. Six still sit, three a side: the table's length doesn't change.</p>
<p><b>The catch is the chairs.</b> In the plan two of your padded chairs{sup("padded")} lie on their sides in the table box's base, and a folded one stands {n(ch)} tall, so they need {n(ch + 1)}. The narrower base is {n(C8['bay_t'])}: <b>four chairs go inside, not six</b>, and the other two live in the garage or folded behind a door. Down the middle of the table, between two places, there's {n(C8['top'][0] - 2 * plate)} for dishes instead of {n(C['top'][0] - 2 * plate)}: a jug and one dish at a time. The buy list is the same, with a little less oak and ply.</p>
<figure class="render">{img("render_v39_3d_c80_folded.png", "The more compact version packed away")}
<figcaption>The more compact version packed away, in the 3D room.</figcaption></figure>
<figure class="render">{img("render_v39_3d_c80_six.png", "The more compact version open for six")}
<figcaption>Open for six: the table {n(C8['len_open'])} × {n(C8['top'][0])}, three a side, the table door turned back flat.</figcaption></figure>
<figure class="render">{img("render_v39_3d_c80_tdoor.png", "The more compact version, the table door open")}
<figcaption>The table door open, the table folded: the base under it is too narrow for the two chairs lying down.</figcaption></figure>
<h3>The two widths side by side</h3>
<table class="tight"><tr><th></th><th>{n(C['top'][0])} wide (the plan)</th><th>{n(C8['top'][0])} wide (the more compact version)</th></tr>{tr}</table>
<h3>The more compact version, checked</h3>
<table class="tight"><tr><th>Check</th><th>Item</th><th>Space</th><th>Left</th><th>Fits</th></tr>{fr}</table>
<p><b>Our call:</b> keep the {n(C['top'][0])}-wide table. The {n(C['len'] - C8['len'])} cm it saves isn't worth two chairs in the garage and a tighter table, and that bare wall already takes a mirror, a slim trolley or a low shelf (above). Pick either on the plan page's <b>Plan</b> home, under "Waiting on you": the buy list and the 3D room follow your pick.</p>
"""


def other_options_html():
    """v39, client (23 Oct): options are only to look at in the 3D room, one line each: what, where, size, rough cost, source."""
    g, sup = G, lambda *k: "<sup>" + ",".join(str(fit.ORDER.index(x) + 1) for x in k) + "</sup>"
    D, C8 = g.DRINKS, g.CAB80
    deco = [i for i in ideas.options() if i[0] not in OPT_OWN]
    dlo, dhi = sum(i[3][0] for i in deco), sum(i[3][1] for i in deco)
    ilo, ihi = ideas.low_high()
    rows = [
        ("A bar under the glass case", "Chimney breast, under the case", f"{n(D['x'][1] - D['x'][0])} × {n(D['y'][1] - D['y'][0])} × {n(D['d'])}", "80–130", sup("flapstay", "piano32")),
        ("A slim drinks trolley", "Beside the dining cabinet", "20 × 43.2 × 86.5", "36–70", sup("vasagle")),
        ("A bar by the sofa", "Side wall at the sofa's open end", f"{n(g.BAR_SIDE['w'])} × 39 × 20", "60–100", sup("flapstay")),
        ("The lidded seagrass basket", "Sofa's open end", f"{n(g.BLANKET_COTSWOLD['w'])} × {n(g.BLANKET_COTSWOLD['d'])} × {n(g.BLANKET_COTSWOLD['h'])}", "90–110", sup("cotswold")),
        ("An oak blanket rail", "Beside the dining cabinet", f"{n(g.BESIDE['rail']['w'])} wide, 12 off the wall", "25–45", sup("oakdowel")),
        ("A tall mirror", "Beside the dining cabinet", f"{n(g.BESIDE['mirror']['w'])} × {n(g.BESIDE['mirror']['h'])}", "25", sup("nissedal")),
        ("A low oak shelf for plates", "Beside the dining cabinet", f"{n(g.BESIDE['dresser']['w'])} × {n(g.BESIDE['dresser']['d'])} × {n(g.BESIDE['dresser']['h'])}", "40–70", sup("plates")),
        ("Two shoe cabinets", "Beside the dining cabinet", f"two {n(g.TRONES[0])} × {n(g.TRONES[1])} × {n(g.TRONES[2])}", "25–30", sup("trones")),
        ("A lift-top coffee table", "Coffee table's place", "90 × 50 × 48", "39–80", sup("homelife")),
        ("A storage window seat", "Window corner", f"{n(g.WINDOW_SEAT['x'][1] - g.WINDOW_SEAT['x'][0])} × {n(g.WINDOW_SEAT['d'])} × {n(g.WINDOW_SEAT['h'])}", "160–280", sup("seat")),
        ("A bench with cubbies", "Your hall, or the window corner", f"{n(g.HALL_BENCH['w'])} × {n(g.HALL_BENCH['d'])} × {n(g.HALL_BENCH['h'])}", "80–130", sup("shoebench")),
        ("A built-in cupboard", "Window corner, floor to ceiling", f"{n(g.WARDROBE['x'][1] - g.WARDROBE['x'][0])} × {n(g.WARDROBE['d'])}", "450–800", sup("wardrobe")),
        ("A hook rail over the door", "Over the hall door", f"{n(g.OVERDOOR['w'])} × {n(g.OVERDOOR['d'])} × {n(g.OVERDOOR['h'])}", "12–25", sup("overdoor")),
        (f"An {n(C8['top'][0])}-wide table", "The dining cabinet", f"{n(C8['len'])} long; four chairs inside, not six", "about the same", sup("padded")),
        ("A smooth or patterned ceiling", "The ceiling (test the Artex first)", "the whole ceiling", "200–700", sup("skimartex", "artextest")),
        ("Oak-effect beams, coffers or an LED cove", "The ceiling", "12 × 12 beams; cove 2 m lengths", "450–1,050", sup("pubeam", "orac")),
        ("Grow-light bars", "Under the plant stand's tiers", "four 30 cm bars", "45–60", sup("spiderglow")),            # v43: the room reviewed
        ("Curtain motors (Film closes them)", "On the curtain pole", "two, 8.4 × 7.3 × 20.5", "160–200", sup("switchbotc3")),
        ("Two LP ledges, covers face-out", "Side wall over the sofa, 108 up", "two 55 × 12", "12–14", sup("mosslanda")),
        ("A cordless lamp", "On the C-table", "31 tall, 14 across", "20–25", sup("habitatmush")),
        ("A curtain round the foot of the stairs", "Under the bulkhead over the bottom step, and along the open side", f"tracks {n(g.STAIR_CURTAIN['len'])} and {n(g.STAIR_CURTAIN['side_len'])}; a pair, {n(g.STAIR_CURTAIN['panel_w'])} × {n(g.STAIR_CURTAIN['drop'])} each", "66–72", sup("ceiltrack", "ohspencil")),   # v78; v81 two sides
        ("Easy-care plants (Look: Plants)", "The stand and the sill", "snake plants and pothos in 12 cm pots", "9–15 each", sup("snakeplant")),
        ("One pot finish for all (Look: Pots)", "The stand, the sill, the shelf", "about 23 pots, 12–24 cm", "3–8 each", sup("persillade")),
        ("Self-watering inserts", "The stand's bigger pots", "15 across, 1.2 litres, in a 16–17 pot", "7 each", sup("elhoinsert")),
        (f"Decor to try ({len(deco)} pieces)", "Round the room", "typical shop sizes", f"{dlo:,}–{dhi:,} together", ""),
        (f"Small ideas ({len(ideas.idea_options())})", "Round the room", "drawn to the room", f"{ilo:,}–{ihi:,} together", ""),
    ]
    tr = "".join(f"<tr><td>{a}{s}</td><td>{b}</td><td>{c}</td><td class='num'>{d}</td></tr>" for a, b, c, d, s in rows)
    return ("<p>Not in the plan or the costs. Each one is a switch in the 3D room (Room, Try options); ask for a build by name.</p>"
            f"<table class='tight'><tr><th>Option</th><th>Where</th><th>Size (cm)</th><th class='num'>About £</th></tr>{tr}</table>")


OPT_OWN = {"barcase", "bartrolley", "barside", "cotswoldbasket", "liftcoffee", "windowseat", "hallbench", "wardrobe", "overdoor",
           "growlights", "curtainmotor", "lpledges", "cordlamp", "stairscurtain"}


def slide_html():
    """v27–v29: the sliding cabinet, the plan until v30; now the alternative in section 5, shorter."""
    import fit as F
    C = G.OPTC
    lo, hi = slide_cost()
    L = C["z"][0] - C["z"][1]
    return f"""
<h3>The alternative: the sliding cabinet</h3>
<p>Before the compact cabinet, the plan was one long cabinet with <b>two sliding oak doors</b>, {n(L)} × {n(C['d'])} × {n(C['h'])}. It stays here, drawn, checked and costed, in case you'd rather have it: about £{money(lo, hi)} with the chairs. It holds the same table and the same six chairs, but it's {n(L - G.CAB['len'])} cm longer. In return, nothing ever swings: door A slides over door B and the table comes down; door B slides behind A and the chairs come out. It also has a drawer for the mats under the folded table. The doors run on a soft-close Häfele Slido double track<sup>{F.ORDER.index("slido") + 1}</sup>. Its fit checks are in section 3. In the 3D room, tap the cabinet and choose "Show the sliding one", or pick it under Layout, "The dining cabinet: which version".</p>
<figure class="render">{img("render_v39_3d_s_folded.png", "The sliding cabinet packed away")}
<figcaption>The sliding cabinet packed away: two sliding doors between two oak ends, reaching almost to the pipe boxing.</figcaption></figure>
<figure>{option_c_elevation()}</figure>
<figure class="render">{img("render_v39_3d_s_six.png", "The sliding cabinet open for six")}
<figcaption>Open for six: door A slid over door B, the linen shelf behind it.</figcaption></figure>
<ul>
<li><b>Inside:</b> the table bay at the stair end, with the drawer under the folded table and the linen shelf over it. The chair bay at the window end has four chairs on its floor, two side by side and two deep, two on its shelf and the pads on edge in front of them.</li>
<li><b>The doors:</b> two {n(C['door_w'])} × {n(C['door_h'])} panels, about {C['door_kg']:.0f} kg each, between the ends. The 19 mm top carries the track in a groove.</li>
<li><b>To build it instead,</b> swap the buy list's cabinet ply, hinge rail and hinges rows for the sliding gear (about £110–190) and the longer carcass. Say if you'd rather have it, and its cutting list and step 11 come back.</li>
</ul>
"""


def cost_pieces_html():
    """v32: the cost overview's subtotals, for the plan on a page."""
    import costs
    ov = costs.overview(TRACK)
    tl, th = sum(r[1] for r in ov), sum(r[2] for r in ov)
    return ("<table class='tight'><tr><th>Piece</th><th>Things to buy</th><th>About</th></tr>"
            + "".join(f"<tr><td>{p}</td><td class='num'>{len(items)}</td><td class='num'>£{money(lo, hi)}</td></tr>" for p, lo, hi, items in ov)
            + f"<tr class='total'><td>All of it</td><td class='num'>{sum(len(r[3]) for r in ov)}</td><td class='num'>£{money(tl, th)}</td></tr></table>"
            + "<p class='note'>Every item, piece by piece, is in section 11's cost overview; the buy list there ticks them off.</p>")


def cost_overview_html():
    """v32: every thing to buy, by piece, a short name and its estimate (costs.py), the subtotals and the total."""
    import costs
    ov = costs.overview(TRACK)
    tabs = []   # v44: one small table per piece, two columns in print
    for p, lo, hi, items in ov:
        tabs.append(f"<table class='tight cost'><tr class='total'><td colspan='2'>{p}</td><td class='num'>£{money(lo, hi)}</td></tr>"
                    + "".join(f"<tr><td class='num'>{costs.qty(q)}</td><td>{nm}</td><td class='num'>£{money(a, b)}</td></tr>" for q, nm, a, b in items) + "</table>")
    tl, th = sum(r[1] for r in ov), sum(r[2] for r in ov)
    return (f"<div class='costcols'>{''.join(tabs)}</div>"
            f"<table class='tight cost'><tr class='total'><td>All of it</td><td class='num'>£{money(tl, th)}</td></tr></table>")


def money(a, b):
    return f"{a:,}–{b:,}"


def phase_totals():
    rows, tl, th = [], 0, 0
    for ph in PHASES:
        lo = sum(r[4] for r in TRACK if r[2] == ph and r[4] is not None)
        hi = sum(r[5] for r in TRACK if r[2] == ph and r[5] is not None)
        tl += lo; th += hi
        rows.append(f"<tr><td>{part_chip(PHASE_PART[ph])} {ph}</td><td class='num'>{money(lo, hi) if hi else '—'}</td><td>{BIGGEST[ph]}</td></tr>")
    rows.append(f"<tr class='total'><td>Total</td><td class='num'>{money(tl, th)}</td><td>no electrician: the electrics are your own job (section 9)</td></tr>")
    return "\n".join(rows), tl, th


def tracker_rows():
    out, cur = [], None
    for st, item, ph, q, lo, hi in TRACK:
        if ph != cur:
            out.append(f"<tr class='ph'><td colspan='5'>{part_chip(PHASE_PART[ph])} {ph}</td></tr>")
            cur = ph
        box = "☑" if st == "Done" else "☐"
        est = money(lo, hi) if lo is not None else ""
        out.append(f"<tr><td class='st'>{box} {st}</td><td>{item}</td><td class='num'>{q}</td><td class='num'>{est}</td><td class='paid'></td></tr>")
    return "\n".join(out)


def key_table():
    from render import JOIN_KEY
    groups, cur = [], None
    for it in JOIN_KEY:
        if it[0] == "H":
            cur = [it[1], []]; groups.append(cur)
        else:
            cur[1].append(it)
    left, right = groups[:3], groups[3:]
    def col(gs):
        out = []
        for name, items in gs:
            out.append(f"<tr><td colspan='2' class='kg'>{name}</td></tr>")
            out += [f"<tr><td class='kn'>{num}</td><td>{lab}</td></tr>" for num, _, lab in items]
        return "<table class='key'>" + "".join(out) + "</table>"
    return "<div class='keycols'>" + col(left) + col(right) + "</div>"


OTHER_SOURCES = [
    "Virgin Media: Hub 5 modem mode",
    "RetroTINK: Introducing the RetroTINK-6X CE (inputs including TOSLINK, deinterlacing); RetroTINK-2X Pro listed as legacy; RetroTINK-4K CE",
    "Expert Reviews: LG C6 OLED review (4 × HDMI 2.1, one eARC, ports on the left); JB Hi-Fi: LG C6 specifications (165 Hz mode for PC sources)",
    "Hisense AX5100G spec sheet (inputs, auto power-on); JB Hi-Fi Business: AX5100G (rears linked by cable, wireless to the soundbar)",
    "TP-Link: Deco X1500 specifications (two gigabit ports per unit)",
    "Glorious Vinyl Vault specifications (80 LPs and 24.5 kg per drawer), a check on the tray capacity",
    "Screwfix: Essentials 964VN 350 mm runners; Metrol: Accuride DZ3832EC; IKEA: BESTÅ drawer runners",
    "NIST SP 500-252 / CLIR pub121: Care and Handling of CDs and DVDs (store upright, book style)",
    "Sony PS3 and Microsoft Xbox 360 S manuals: ventilation; IKEA UK: secure it",
    "Ideal Home: colour drenching; The Paint Shed: colour drenching with Farrow &amp; Ball; Livingetc: sage green shades (Card Room Green, Treron, Sage Green, Green Smoke)",
    "Pontata: Card Room Green vs Little Greene Sage Green (approximate screen colours)",
    "Homebase and NC Tiles: Farrow &amp; Ball Card Room Green No. 79 in Modern Eggshell and Estate Eggshell",
    "The selling agent: floor plans and listing photos for the house",
    "OpenStreetMap: the buildings and roads round the house (the back of the house faces 14° east of north); the sun's path from the NOAA solar position formulas",
    "ConsoleMods: PS2 Component Video Out setting",
    "GOV.UK: Electrical safety, Approved Document P (2013 edition, for use in England): notifiable work is a new circuit, a replacement consumer unit, or an addition or alteration to a circuit in a special location (round a bath or shower); like-for-like replacements and additions to existing circuits elsewhere are not notifiable (gov.uk/government/publications/electrical-safety-approved-document-p)",
    "IET Electrical: Part P, England and Wales (notifiable and non-notifiable work); Planning Portal: Electrics, Building Regulations (non-notifiable work must still meet the regulations, BS 7671)",
]


# ---------------------------------------------------------------- the beginner's build guide (in the plan and as its own PDF)
TOOLS = [
    ("Measure and mark", [
        ("Tape measure (5 m) and a steel rule", "every cut and every height", "Buy", "10–15"),
        ("Combination square", "squaring lines across boards and checking corners", "Buy", "10–15"),
        ("Spirit level, 60 cm and 120 cm", "levelling the base, the shelves and the table", "Buy", "15–30"),
        ("Cross-line laser level", "marking all the heights round the alcove in one go", "Buy or borrow", "30–60"),
        ("Cable and pipe detector", "checking every wall before you drill: non-negotiable", "Buy", "15–30"),
        ("Pencil, masking tape, a marking knife", "marking cuts (tape stops oak splintering)", "Buy", "5"),
    ]),
    ("Cut", [
        ("Track saw, or a circular saw with a straight-edge guide", "the worktop, the table top and the long shelves", "Hire or borrow", "25–40 a day"),
        ("Jigsaw", "notches and the cable slot", "Buy or borrow", "40–70"),
        ("Tenon saw (Japanese pull saw is easiest)", "the tenons and the wedge kerfs", "Buy", "15–25"),
        ("Sharp chisels, 6, 12 and 25 mm, and a mallet", "cleaning out mortises and housings", "Buy", "30–50"),
    ]),
    ("Drill and fix", [
        ("Cordless drill-driver (18 V)", "pilot holes and screws; most of the job", "Buy or borrow", "60–120"),
        ("SDS or hammer drill with masonry bits", "plugs into the brick walls and the chimney breast", "Hire or borrow", "15–25 a day"),
        ("Dowel jig and 10 mm brad-point bit", "the dowels under the uprights and at the wrap ledge", "Buy", "20–35"),
        ("Clamps: four 60 cm sash or F-clamps, four small", "glue-ups and holding work while you fix it", "Buy", "40–60"),
        ("Stud finder (if any wall is plasterboard)", "finding studs to fix into", "Buy", "15"),
    ]),
    ("Shape and finish", [
        ("Router (1/4 in is enough) with a straight bit and a guide", "the housings, the LED grooves and the cable groove", "Hire, borrow or buy", "60–120"),
        ("Random-orbit sander, 120 and 180 grit", "smoothing the oak before oiling", "Buy or borrow", "40–70"),
        ("Hardwax oil, lint-free cloths, a brush", "finishing the oak", "Buy", "25–35"),
    ]),
    ("Electrics (your own: steps 3 and 12)", [
        ("Two-pole voltage tester to GS38, with its proving unit", "proving every wire dead before you touch it: non-negotiable", "Buy", "35–70"),
        ("MCB lock-off and a small padlock", "keeping the circuit off while you work on it", "Buy", "8–15"),
        ("Plug-in socket tester", "checking the new double socket is wired the right way round", "Buy", "8–15"),
        ("Insulated (VDE) screwdrivers, wire strippers, side cutters", "the socket and the ceiling fittings", "Buy", "20–40"),
        ("Wall chaser with dust extraction (or a bolster and club hammer)", "the PC's two conduits in the side wall", "Hire", "25–45 a day"),
        ("Cat6 punch-down tool and a cable tester", "terminating and checking the Cat6 runs", "Buy", "20–35"),
    ]),
    ("Safety", [
        ("Safety glasses, ear defenders, FFP2 dust masks", "every cut, every sanding job; oak dust is an irritant", "Buy", "15–25"),
        ("Work gloves; a first-aid kit", "handling boards and sheet goods", "Buy", "10"),
        ("A sturdy step ladder", "the high shelf, the ceiling and the PC shelf", "Borrow", "—"),
    ]),
]


def tools_html():
    out = ["<table class='tight tools'><tr><th>Tool</th><th>What it's for</th><th>Get it</th><th>About £</th></tr>"]
    for grp, items in TOOLS:
        out.append(f"<tr class='ph'><td colspan='4'>{grp}</td></tr>")
        out += [f"<tr><td>{a}</td><td>{b}</td><td>{c}</td><td class='num'>{d}</td></tr>" for a, b, c, d in items]
    out.append("</table>")
    return "\n".join(out)



def steps():
    """The order of work, one dict per step: used by the PDF's table and the plan page's step cards.
    buy: the buy-list phases to have in before the step starts (each phase listed at the first step that needs it)."""
    g = G
    import instructions
    extra = instructions.full()
    return [dict(st, **extra.get(st["n"], {})) for st in [
        dict(n=1, part=["Prep"], title="Measure and count", who="You", time="2 h", buy=[], see=[("overview", "The room")],
             do=["The alcove's width at the floor, 76, 134, 155 and 196 cm and at the ceiling: cut everything to the smallest.",
                 "The floor's level across the alcove, and the chimney breast's flatness with a long level.",
                 "The door's swing, and the sofa: overall width, depth with the return, back height.",
                 "Count the LPs and games (PS2, Xbox 360, Xbox One), and measure ten cases of each.",
                 "Make a cardboard template of the alcove at worktop height: walls are rarely square."],
             check="Every figure within 1 cm of the plan. If not, send the numbers and the drawings are redone first."),
        dict(n=2, part=["Network"], title="Network, stage 1", who="You", time="2 h", buy=["1 Network, now"], see=[("network", "Network")],
             do=["Unplug everything from the Hub 5. Log in at 192.168.0.1 with the password on its base, then Modem Mode → Enable Modem Mode → Apply. Its page moves to 192.168.100.1.",
                 "Connect a hub port to Deco A in bedroom 3 and set it up in the Deco app, reusing the old Wi-Fi name and password. If it shows no internet, try another hub port and restart the hub.",
                 "Plug the new 8-port Switch 1 into Deco A's other port, then the PCs into Switch 1.",
                 "Add Deco B in the living room and Deco C in the kitchen. For now they link over Wi-Fi.",
                 "Speed-test each room, and check the Xbox's network settings show NAT: Open."],
             check="Internet in every room, and NAT: Open on the Xbox."),
        dict(n=3, part=["Power & cables", "Network"], title="Cables and the socket, your own job", who="You + a helper", time="2–3 days", buy=["2 Cables and power"], see=[("network", "Electrics: your own job"), ("network", "Power and cables")],
             do=["The Cat6: two runs from bedroom 3, across the landing and down through the airing cupboard, one to the alcove's right corner for Deco B, one on to the kitchen for Deco C, a spare pulled with each; the optional runs to the master and bedroom 2 if you want them. Low voltage: no rules beyond care.",
                 "The socket: swap the single on the side wall for a double at the same spot, with the circuit isolated, locked off and proved dead (the safe routine is in this step). Like for like, so not notifiable.",
                 "The PC's two conduits: chase them into the solid side wall from behind the PC shelf to skirting height and behind the skirting to the base, 38 mm oval for the HDMI and Cat6, 25 mm for the PC's mains lead, a draw wire in each. Make good.",
                 "Stop and call an electrician if anything on the stop list turns up (old wiring, no earth, a reading where there should be none, anything you can't match).",
                 "Before you fill a chase, photograph it with a tape measure in shot, and mark every route on the plan."],
             check="The socket tester shows correct wiring on both outlets, both Cat6 runs test good end to end, and every route is photographed."),
        dict(n=4, part=["Paint"], title="Paint", who="You", time="2–3 days, then a week to cure", buy=["3 Paint"], see=[("paint", "Paint and light")],
             do=["Paint an A4 board in your pale mint (a sample pot mixed at B&Q) and look at it by day and with the LED strip on.",
                 "Wash the skirting and door with sugar soap, sand to a key, and prime them.",
                 "Two coats of emulsion on the walls, ceiling, alcove and chimney breast.",
                 "Two coats of eggshell in the same green on the skirting and radiator (the door and its frame stay white).",
                 "Leave it a week to cure before fixing anything to it."],
             check="Two even coats, and no white showing at the edges or behind the radiator."),
        dict(n=5, part=["Prep"], title="Mark the heights", who="You", time="1 h", buy=[], see=[("wall", "Front view")],
             do=["With the laser level: 73 and 76 for the worktop, 130 and 134 for the Series X shelf, 153 and 155.4 for the ledges, 192 and 196 for the high shelf.",
                 f"The uprights at {n(g.UP_L[0])}–{n(g.UP_L[1])} and {n(g.UP_R[0])}–{n(g.UP_R[1])} cm from the side wall.",
                 f"On the breast: the “now playing” ledge's top at {n(g.NOW_LEDGE['top'])} and the framed LPs' bottom edges at {n(g.FRAMES_Y)}, centred.",
                 "Run the cable detector along every line you will drill, and mark anything it finds."],
             check="Every line level end to end, and the uprights' lines plumb."),
        dict(n=6, part=["Media wall"], title="Build the base", who="You", time="1 day", buy=["4 Base unit"], see=[("build", "Cutting list"), ("wall", "Drawer layouts")],
             do=["Order the oak and ply from the cutting list (below the steps), a week or two ahead: most merchants cut to size for a small charge.",
                 "Build the 9 cm plinth for bays 1–2, with the open bay for the hidden drawer under bay 2. Level it with shims.",
                 "Assemble the two BESTÅ frames with their back panels left off and stand them on the plinth.",
                 "Build bay 3 from 18 mm ply, 60 × 40 × 73, and bolt it to bay 2.",
                 "Screw the 4 cm spacer blocks to the wall, push the base against them and fit the anti-tip brackets.",
                 "Lay the flat two-compartment trunking in the channel behind (mains one side, data the other) and run the cables in."],
             check="The tops level within 1 mm across 186 cm, and nothing rocks."),
        dict(n=7, part=["Media wall"], title="Fit the worktop", who="You + a helper", time="½ day", buy=["5 Oak joinery"], see=[("build", "Cutting list"), ("wall", "Built to your alcove")],
             do=["Cut the worktop from the 300 × 62 oak board, using the template from step 1; keep the offcut.",
                 "Scribe the ends to the walls; cut the TV slot over the channel and the grommet hole behind the deck.",
                 "Oil it on every face, undersides and cut ends included.",
                 "Screw it up through the frame tops in slotted holes, so the oak can move."],
             check="Tight to both walls, and the slot sits over the channel."),
        dict(n=8, part=["Media wall"], title="Fit out the base", who="You", time="1–2 days", buy=[], see=[("wall", "Drawer layouts"), ("wall", "The records")],
             do=["Shelves on their pins at the fit-proof heights for the consoles.",
                 "The game drawer in bay 1: runners on the frame's sides, then the box (its cut list is with this step).",
                 "Bay 3: the 12 mm divider first (17.8 cm in from the left side), then the LP crates' runners at 2.3 and 37.0 cm on the right and the three slim drawers' at 2.3, 25.1 and 47.9 on the left, then each box.",
                 "The hidden plinth drawer under bay 2.",
                 "Bay 2: the divider and the part shelf, then the sub on its riser, its front flush with the face frame."],
             check="Every drawer runs smoothly, the two crates clear each other by 2 cm, and the slim drawers by 2.8."),
        dict(n=9, part=["Media wall"], title="Uprights and shelves", who="You + a helper", time="2–3 days", buy=[], see=[("wall", "The oak joinery")],
             do=["On the bench: cut the housings and the mortises in both uprights, and the LED groove and cable groove.",
                 "Dry-fit each upright with its shelves before any glue.",
                 "Lay Deco B's leads in the groove behind the right upright.",
                 "Stand the uprights on their dowels and fix the concealed brackets to the back wall.",
                 "Fit the high shelf and the ledge, then the Series X shelf: wedge its tenons, and peg the housings.",
                 "On the chimney breast: the “now playing” ledge, its top at 104, on two concealed brackets, 6 cm in from each side of the breast (with the table by the stairs)."],
             check="Uprights plumb, shelves level, the TV slides in with 2 cm each side, and the “now playing” ledge is level with an LP standing on it."),
        dict(n=10, part=["Media wall"], title="The side-wall run and the PC end", who="You", time="1 day", buy=[], see=[("wall", "The side wall")],
             do=["Cut the run from its 225 × 30 × 4 board: mark the front edge from the full-size template (7 cm deep along the LPs, sweeping out to 28 under the PC, a 5 cm radius on the end), jigsaw just outside the line and rout to it with a bearing-guided bit; rout the LED groove under the front edge.",
                 "Screw the oak cleat along the side wall and fit the concealed brackets for the PC end.",
                 "Lift the run on, its alcove end in line with the uprights' fronts, and screw it down to the cleat from above (plugged).",
                 "Screw the keyboard tray's housing under it and fit its runners.",
                 "Fit the brush grommet and pull the PC's leads down the two chased conduits with the draw wires: data in the big one, its mains lead in the small one.",
                 "The PC's extras (v17): screw the powered USB hub under the run's front edge below the PC, fit the remote power button's card and stick its button under the wrap ledge by the sofa, and lay the magnetic filter on the top exhaust."],
             check="One level line with the ledge over the TV, the sweep runs smooth with no flat spots, and the PC end holds your weight leaning on it."),
        dict(n=11, part=["Dining table"], title="The dining cabinet: the table and the six chairs in one", who="You + a helper", time="3–4 days", buy=["6 Dining wall"], see=[("dining", "The dining wall")],
             do=["Check the gap under your shelf (191 or more), mark the two boxes' footprint and oil every oak part first.",
                 "Build the two boxes on the floor: the ends, the tops and floors, the 6 mm backs to square them, the linen shelf in the table box and the chair shelf in the chair box, both set back behind the doors.",
                 "Stand them on their marks, screw them to each other, shim them level and fix them to your solid wall at the top; fit the oak hinge rail across the table box at 73.3, set back for the pads.",
                 "On the bench: the two halves with their breadboard ends, the apron frames, the legs on their folding brackets, and the three flip-top hinges at the joint.",
                 "Hang the table on its piano hinge and fit its catches and finger pull; hang the two doors on their piano hinges, then the stops, the magnet and the six pad hooks; level the table and trim the legs; load the six chairs and hang their pads."],
             check="The table swings down and up without touching the box's sides, all four legs click, the top is level at 76 both ways, the catches hold it folded, and each door shuts flush with an even gap and turns back flat against the other without its far end dropping."),
        dict(n=12, part=["Lighting"], title="Lighting: smart spot bars and the LED strips, your own job", who="You + a helper", time="1 day", buy=["7 Lighting"], see=[("network", "Electrics: your own job"), ("paint", "Light")],
             do=["Isolate the lighting circuit at the consumer unit, lock it off and prove it dead at each ceiling point.",
                 "Take down the two old fittings. The light switches stay as they are: the smart bulbs need full power, so no dimmers.",
                 "Hang bar 1 on the rose between the TV and the sofa and bar 2 on the pendant point by the stairs, earth first, both running from the TV towards the window; fit the smart colour bulbs and point every head straight down, evenly spread; tilt one only if its pool lands badly.",
                 "The LED strips in the uprights' grooves and under the side-wall shelf on their plug-in driver (on the 10-gang), the ceiling strip through its notches, the bias light on the TV; your red lamp in its spot.",
                 "Power back on, switches on: add the eight bulbs to the app, group them as bar 1 and bar 2, and save the four presets (Paint and light): Evening, Bright, Cosy and Film. With the table open, bar 2 sits between 45 and 55, the ceiling strip at most 40, and bar 1 down to 15 (the table rule)."],
             check="Every bulb answers the app, the presets recall, and from the sofa no spot head shows in the screen or shines in your eyes."),
        dict(n=13, part=["AV", "Network"], title="Connect and finish", who="You", time="1 day", buy=["8 TV, consoles and AV", "9 Vinyl kit", "10 Finishing"], see=[("network", "AV"), ("network", "Network")],
             do=["TV inputs: HDMI 1 the PC, HDMI 2 the soundbar (eARC), HDMI 3 the Series X, HDMI 4 the HDMI switch (Xbox One, 360, PS3, RetroTINK).",
                 "The PS2 by component into the RetroTINK and by optical to the soundbar; the PS1 by RGB SCART.",
                 "The deck to the preamp, the preamp to the soundbar's AUX; set the tracking weight; soundbar in Music mode for vinyl.",
                 "Network stage 2: plug each Cat6 run into its Deco, check Deco B and C show \"Ethernet\", and give the Series X and PC high priority.",
                 "Label both outlets of the double socket and each HDMI switch input; set the sub and rear levels from the sofa."],
             check="Everything on the network's \"done when\" list, and every source plays through the soundbar."),
        # v41: the client's picks (geometry.FIRM) get their own step: they were in the buy list with no build
        dict(n=14, part=["Your picks"], title="Your picks: the C-table, the bar, the record table, the shelves and cabinets", who="You + a helper", time="1–2 days", buy=[], see=[("dining", "The bar")],
             do=[f"The C-table: from the second oak board, a top {n(CT['top'][0])} × {n(CT['top'][1])}, an upright {n(CT['upright'][0])} × {n(CT['upright'][1])} and a foot {n(CT['foot'][0])} × {n(CT['foot'][1])}; glue and screw the upright into the top's and the foot's outer edges with 40 mm screws, round the corners, oil it; screw the steel plate under the foot, felt under that.",
                 f"The bar: scribe its ply cupboard ({n(G.BAR_BUILT['w'])} × {n(G.BAR_BUILT['d'])} × {n(G.BAR_BUILT['counter'] - G.BAR_BUILT['top_t'])} on a {n(G.BAR_BUILT['plinth'])} plinth) between the cabinet and your shelf's end, keeping the 10 cm gap clear; fix it to the wall and the cabinet, then the counter and the ENHET frame over it, its bottom at {n(G.BAR_BUILT['enhet_y0'])}.",
                 f"The record table: screw the two KALLAX together on their backs, the 12 mm ply base and four castors under them, the oak lid ({n(G.RECORD_TABLE['w'])} × {n(G.RECORD_TABLE['d'])}) on two hinges with two lid stays.",
                 f"The wall cabinets: the two EKET on IKEA's rail over the sofa's corner, bottoms at {n(G.WALL_CABS['y0'])}, the rail into the solid wall.",
                 f"The alcove shelves: two oak floating shelves {n(G.ALCOVE_SHELVES['w'])} × {n(G.ALCOVE_SHELVES['d'])}, tops at {n(G.ALCOVE_SHELVES['tops'][0])} and {n(G.ALCOVE_SHELVES['tops'][1])}, brackets into the solid wall.",
                 f"Over the hall door: the oak shelf {n(G.DOOR_SHELF['x'][1] - G.DOOR_SHELF['x'][0])} × {n(G.DOOR_SHELF['d'])}, top at {n(G.DOOR_SHELF['top'])}, clear of the architrave; two KUGGIS boxes on it and two on your black shelf.",
                 "The step drawers: with the new stairs, by the joiner (a bearer under each tread)."],
             check="Each piece level and fixed; the C-table stands square and doesn't rock with a mug on its far edge; the bar's door clears the open table door; the record table rolls and its lid stays up; the 10 cm gap is clear."),
    ]]


DIAGRAMS = {"front": "front", "section": "section", "drawer_layouts": "drawer_layouts", "game_drawer": "game_drawer", "drawer": "drawer",
            "storage": "storage", "joints": "joints", "pc_shelf": "pc_shelf", "dining_section": "dining_section", "seating": "seating",
            "av": "av", "power": "power", "network": "network", "routes": "routes", "leaf_case": "leaf_case", "fliptop": "fliptop",
            "optc_carcass": "option_c_carcass", "optc_halves": "option_c_halves", "optc_section": "option_c_section", "optc_elevation": "option_c_elevation", "optc_plan": "option_c_plan",   # v27
            "cab_carcass": "cab_carcass", "cab_section": "cab_section", "cab_elevation": "cab_elevation", "cab_plan": "cab_plan"}   # v30: the compact cabinet


def need_html(st):
    cols = [(lab, st.get(k, [])) for k, lab in (("parts", "Parts"), ("hardware", "Hardware and fixings"), ("tools", "Tools"))]
    cols = [(lab, items) for lab, items in cols if items]
    if not cols:
        return ""
    return ("<div class='need'>" + "".join(f"<div><h5>{lab}</h5><ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul></div>" for lab, items in cols)
            + "</div>")


def full_html(st):
    """Every instruction for one step, numbered straight through its sub-assemblies."""
    if not st.get("parts_full"):
        return "<ol>" + "".join(f"<li>{d}</li>" for d in st["do"]) + "</ol>"
    out, k = [], 1
    for head, items in st["parts_full"]:
        out.append(f"<h5>{head}</h5><ol start='{k}'>" + "".join(f"<li>{i}</li>" for i in items) + "</ol>")
        k += len(items)
    return "".join(out)


# v17: the build guide PDF stands alone. Each cut-list part belongs to one step (matched on the start of its name),
# and each step's "see" link becomes the picture it pointed to in the plan.
CUT_STEP = {"Uprights": 9, "High shelf": 9, "Series X shelf": 9, "Record ledge": 9, "“Now playing”": 9, "Wedges": 9, "Ledge lips": 9,
            "Side-wall run": 10, "Keyboard tray": 10, "Concealed brackets": 10, "Plinth drawer and keyboard": 8,
            "Worktop": 7, "Face frame": 6, "Bay 3 sides": 6, "Bay 3 top": 6, "Plinth rails": 6, "Plinth cross": 6,
            "Dining": 11, "Table top": 11, "Breadboard": 11, "Gate": 11, "Turn buttons": 11, "Häfele": 11, "Lift-off": 11, "Flip-top": 11,
            "Cabinet": 11, "Table halves": 11, "Apron": 11, "Table legs": 11, "Hinge rail": 11, "Piano": 11, "Leg brackets": 11, "Tabletop": 11, "Drawer box": 11,
            "Door stops": 11, "Door hinges": 11, "Catches, magnets": 11, "Wall brackets (the cabinet)": 11}   # v27; v30: the compact cabinet's rows
SEE_FIG = {("wall", "Front view"): ("render_v13_join_key_scene.png", "The media wall with its parts numbered"),
           ("wall", "Drawer layouts"): ("render_v13_drawers.png", "Every drawer out, in place"),
           ("wall", "Built to your alcove"): ("render_v13_join_clean.png", "The finished media wall"),
           ("wall", "The side wall"): ("render_v13_side.png", "The side-wall run and the PC end"),
           ("dining", "The dining wall"): ("render_v39_3d_c_six.png", "The dining cabinet open for six"),
           ("overview", "The room"): ("render_v39_3d_room.png", "The whole room")}


def step_cuts(k):
    """The cut-list rows for step k (parts not matched elsewhere are the base's fit-out, step 8)."""
    rows = []
    for grp, note, items in cuts():
        for r in items:
            hit = next((v for pre, v in CUT_STEP.items() if r[0].startswith(pre)), 8 if r[4] == "Media wall" else None)
            if hit == k:
                rows.append((grp,) + r[:4])
    return rows


def step_cuts_html(k):
    rows = step_cuts(k)
    if not rows:
        return ""
    return ("<h5>Cut list for this step</h5><table class='tight cuts'><tr><th>Part</th><th>From</th><th>Size (cm)</th><th>Qty</th><th>Notes</th></tr>"
            + "".join(f"<tr><td>{a}</td><td>{g}</td><td class='num'>{b}</td><td class='num'>{c}</td><td>{d}</td></tr>" for g, a, b, c, d in rows)
            + "</table>")


def full_steps_html(pdf=False):
    """The PDF's step-by-step section: each step with what you need, its drawings and every instruction.
    pdf=True (the build guide PDF, v17): each step also carries its cut list and the picture its "see" link points to."""
    import diagrams as D
    out = []
    for st in steps():
        out.append(f"<div class='fstep'><h3 class='pb'>Step {st['n']} · {st['title']} <span class='note'>· {st['who']} · {st['time']}</span></h3><p>{part_chip(st['part'])}</p>")
        if st["buy"]:
            out.append(f"<p class='note'>Buy first: {', '.join(st['buy'])} (the buy list).</p>")
        out.append(need_html(st))
        if pdf:
            out.append("".join(f"<figure class='render small'>{img(SEE_FIG[k][0], SEE_FIG[k][1])}<figcaption>{SEE_FIG[k][1]}.</figcaption></figure>"
                               for k in st.get("see", []) if k in SEE_FIG))
        out.append("".join(f"<figure>{getattr(D, DIAGRAMS[d])()}</figure>" for d in st.get("draw", [])))
        if pdf:
            out.append(step_cuts_html(st["n"]))
        out.append(full_html(st))
        out.append(f"<p class='callout'><b>Check before moving on:</b> {st['check']}</p></div>")
    return "\n".join(out)


def steps_table_html():
    rows = "".join(f"<tr><td>{s['n']}</td><td>{part_chip(s['part'])}<br>{s['title']}</td><td>{' '.join(s['do'])}</td><td>{s['check']}</td><td>{s['time']}</td></tr>" for s in steps())
    return ("<table class=\"tight steps\"><tr><th>#</th><th>Stage</th><th>What to do</th><th>Check before moving on</th><th>Time</th></tr>"
            + rows + "</table>")


GUIDE_RULES = """
<p>For anyone who's hung shelves and built flat-pack but not cut a joint. Each step: what to do, what to check, and how long it takes.
Steps 3 and 12 are the electrics, with the point to stop and call an electrician. Finished sizes, in cm.</p>

<div class="callout"><b>Before you start: five rules</b><ul>
<li><b>Check every wall before you drill.</b> Run the cable and pipe detector over the spot, and never drill straight above, below or beside a socket or switch: cables run vertically and horizontally from them.</li>
<li><b>Measure twice, mark once, cut once.</b> Walls are rarely square: measure the alcove at the floor, 76, 134, 155, 196 and the ceiling, and cut to the smallest.</li>
<li><b>Two people for anything over 15 kg</b>: the uprights, the worktop, the table top, the TV.</li>
<li><b>The electrics are yours, within limits.</b> Swapping the socket for a double and the two ceiling fittings are like-for-like jobs, not notifiable under Part P in England, as long as they meet the wiring regulations. Isolate, lock off and prove dead every time. Anything new (a new circuit, the consumer unit, work by a bath or shower) is an electrician's, and so is anything on the stop list in section 9.</li>
<li><b>Dry-fit everything</b> (assemble without glue or screws) before the final fix.</li>
</ul></div>
"""


def guide_tools():
    return f"""<h3>Tools</h3>
<p>You don't need a workshop. Hire the two big tools for a weekend (a track saw and an SDS drill), or ask the timber merchant to cut the oak and ply to the cut lists: most will, for a small charge, and that removes the hardest cuts.</p>
{tools_html()}"""


GUIDE_TECHNIQUES = """<h3>Six techniques you'll use</h3>
<ol>
<li><b>Fixing into brick.</b> Detect, mark, drill with the SDS on hammer setting, clear the dust, push in a brown (7 mm) wall plug and drive a 5 × 60 mm screw. In plasterboard, find a stud, or use heavy-duty plasterboard fixings rated for the load.</li>
<li><b>Cutting oak cleanly.</b> Put masking tape over the cut line, score it with a knife, cut with the good face down (circular or track saw) or up (jigsaw). Clamp a straight edge as a guide.</li>
<li><b>Routing a housing</b> (a shallow slot a shelf sits in). Clamp a straight batten as a guide, set the bit 4 mm deep, rout, then step down to 12 mm in passes. Practise on an offcut first.</li>
<li><b>A wedged through-tenon.</b> Mark the 6 × 2.4 cm mortise on both faces of the upright and drill most of it out with a 20 mm bit from each side. Chisel it to the line. Saw the tenon on the shelf's end. Saw a kerf down its middle, glue it, tap it home, then drive a glued oak wedge into the kerf. When it's dry, saw it flush and plane it.</li>
<li><b>Dowelling.</b> Use a dowel jig to drill matching 10 mm holes 3 cm deep in both parts, glue the dowels, clamp.</li>
<li><b>Oiling.</b> Sand to 180 grit, wipe off the dust, rub on a thin coat of hardwax oil, wipe off the excess after 15 minutes, let it dry overnight, give it a second coat. Do the undersides too, so the boards don't cup.</li>
</ol>
"""

GUIDE_TIME = "<p>Roughly 17–22 working days spread over a few weekends, the electrics and the Cat6 included, plus the paint drying. Steps 6–11 can be split: the base and the dining cabinet first, the oak joinery once you're confident.</p>"

GUIDE_PITFALLS = """<h3>Where beginners usually go wrong</h3>
<ul>
<li><b>Cutting the worktop to the tape instead of to a template.</b> Make a cardboard template of the alcove first; walls are rarely square.</li>
<li><b>Skipping the dry-fit.</b> Gluing a tenon that doesn't fit is the one mistake you can't undo.</li>
<li><b>Oil on one side only.</b> The board cups within a week.</li>
<li><b>Loading the LP crates before the anti-tip brackets go in.</b> A full crate weighs about 30 kg.</li>
<li><b>Folding the table up with something on it.</b> Clear it first, every time, and keep both turn buttons turned when it's up.</li>
</ul>
"""


def cuts():
    """Every made part in one cutting list, grouped by what the timber merchant cuts it from (sizes in cm, L × W × T).
    Rows: (part, size, qty, notes, where it goes). Drawn from the cut lists in sections 3, 5 and 7 and v6.1's game drawer."""
    g, K, BB = G, G.CAB, G.BAR_BUILT
    pc_len = g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1]
    return [
        ("Solid oak, hardwax oil", "Ask for it planed all round; scribe the uprights and worktop on site", [
            ("C-table top", f"{n(CT['top'][0])} × {n(CT['top'][1])} × {n(CT['top'][2])}", "1", "From the Snowdon pack's second board; outer corners rounded", "C-table"),
            ("C-table upright", f"{n(CT['upright'][0])} × {n(CT['upright'][1])} × {n(CT['upright'][2])}", "1", "Screwed and plugged to the top's and the foot's outer edges", "C-table"),
            ("C-table foot", f"{n(CT['foot'][0])} × {n(CT['foot'][1])} × {n(CT['foot'][2])}", "1", "The steel plate under it", "C-table"),
            ("Uprights", f"{n(g.UPRIGHT_LEN)} × 30 × 4.5", "2", "Buy 165 long and scribe to the ceiling; housings, mortises, LED and cable grooves cut on the bench", "Media wall"),
            ("High shelf, long length", "128.9 × 30 × 4", "1", "Housed 1.2 into both uprights and pegged", "Media wall"),
            ("High shelf, short length", "51.7 × 30 × 4", "1", "Housed into the left upright; cleat on the side wall", "Media wall"),
            ("Series X shelf", "55 × 30 × 4", "1", "Two through-tenons 6 × 2.4, wedged flush", "Media wall"),
            ("Record ledge", "128.9 × 7 × 2.4", "1", "Housed and pegged", "Media wall"),
            ("Side-wall run (v15)", f"{n(g.SIDE_RUN_Z[0] - g.SIDE_RUN_Z[1])} long × 7 sweeping to {n(g.PC_SHELF_D)} × {n(g.SIDE_RUN_T)}, from one 225 × 30 × 4 board", "1", "On an oak cleat, concealed brackets under the PC end; LED groove under the front edge", "Media wall"),
            ("Ledge lips", f"128.9 × 1.5 × 0.9 · {n(G.WRAP_Z[0] - G.SIDE_SWEEP[0])} × 1.5 × 0.9", "1 · 1", "Glued along the ledge's and the run's front edges", "Media wall"),
            ("Keyboard tray housing", "70 × 28 × 7, sides 7 × 2", "1", "Screwed under the PC shelf", "Media wall"),
            ("Worktop", f"{n(g.ALC_W)} × {n(g.BASE_D)} × 3", "1", "From one 300 × 62 full-stave worktop; chamfered front", "Media wall"),
            ("Face frame", "186 × 73 overall, 2 thick, stiles about 5 wide", "1 set", "End stiles scribed to the walls", "Media wall"),
            ("Drawer fronts", "game drawer 56.8 × 6.5 × 2 · plinth drawer 54 × 6 × 2", "1 · 1", "Finger pull cut underneath", "Media wall"),
            ("LP crate lips · slim drawer lips", "36.3 × 5 × 1.5 · 16.5 × 5 × 1.5", "2 · 3", "Cut to the face frame's openings, less 3 mm (v16)", "Media wall"),
            ("“Now playing” ledge", f"{n(g.NOW_LEDGE['x'][1] - g.NOW_LEDGE['x'][0])} × 7 × 2.4, lip 1.5", "1", "On the breast at 104, two concealed brackets (v16; with the table by the stairs)", "Media wall"),
            ("Follower blocks · Xbox One lift block", "19 × 12 × 2 · 15 × 12 × 2", "2 · 1", "Offcuts, felted underneath", "Media wall"),
            ("Wedges · pegs · dowels", "6 × 3, tapering · 10 mm dowel, 5 long · 10 mm dowel", "2 + spares · 6 + 6 · 8", "Glued", "Media wall"),
            # v27: the dining cabinet's table (geometry.OPTC, the same in v30's compact cabinet): the halves, aprons and legs in solid oak
            ("Table halves, centres", f"{n(G.OPTC['top'][1] - 14 + 5)} × {n(G.OPTC['top'][0])} × {n(G.OPTC['top'][2])}", "2", f"Edge-glued staves: {n(G.OPTC['top'][1] - 14)} between the shoulders, plus a 2.5 tongue each end", "Dining table"),
            ("Breadboard ends", f"{n(G.OPTC['top'][0])} × 7 × {n(G.OPTC['top'][2])}", "4", "Pegged with three 10 mm pegs each, in slotted holes", "Dining table"),
            ("Apron rails", f"outer half {n(G.OPTC['top'][1] - 6)} and {n(G.OPTC['top'][0] - 12)} · inner half {n(G.OPTC['top'][1] - 7.6)} and {n(G.OPTC['top'][0] - 12)}, all × {n(G.OPTC['apron'])} × 2",
             "2 + 2 · 2 + 2", "A frame under each half, held on figure-8 fasteners", "Dining table"),
            ("Table legs", f"{n(G.OPTC['leg'][0])} × {n(G.OPTC['leg'][1])}, cut 70 long", "4", "Tapered on the two inside faces from 25 cm down to 4.5 × 3.5 at the foot; trimmed to the floor once the table's hung and level", "Dining table"),
            ("Hinge rail", f"{n(K['bay_t'])} × {n(K['rail_x'][1] - K['rail_x'][0])} × 7", "1", f"Across the table box, its top at {n(K['pivot'][1])}, its front {n(K['pads'])} behind the door's back (the cloth bag hangs past it); the table's piano hinge {n(K['pivot'][0] - K['rail_x'][0])} back from its front", "Dining table"),
            ("Door stops (the cabinet)", "8 × 2.5 × 1.2", "2", "Under each box's top, behind its door's free edge; a magnetic catch let into each", "Dining table"),
        ]),
        # v30: the compact cabinet (geometry.CAB): two boxes side by side, the doors inset between each box's top and floor
        ("Oak-faced ply, 18 mm (the dining cabinet and the bar)", "Ask the merchant to cut it to size and edge the visible edges with oak lipping", [
            ("Cabinet ends", f"{n(K['h'])} × {n(K['d'])}", "4", "Full height and depth, two for each box; the doors sit between them", "Dining table"),
            ("Cabinet tops · floors", f"{n(K['bay_t'])} × {n(K['d'])} · {n(K['bay_c'])} × {n(K['d'])}", "2 · 2", f"One of each per box, between its ends; the floors' top faces at {n(K['plinth'])}", "Dining table"),
            ("Cabinet linen shelf · chair shelf", f"{n(K['bay_t'])} × {n(K['linen_d'])} · {n(K['bay_c'])} × {n(K['in_d'])}", "1 · 1",
             f"Top faces at {n(K['linen'][0])} (the table box, set {n(K['pads'])} back for the cloth bag) and {n(K['shelf_y'] + K['t'])} (the chair box)", "Dining table"),
            ("Cabinet doors", f"{n(K['door_tw'])} · {n(K['door_cw'])}, both × {n(K['door_h'])}", "1 · 1",
             "The table door, then the chair door: oak-faced both sides, grain upright, all four edges lipped; a piano hinge on the edge by the boxes' join, a finger slot near the other", "Dining table"),
            ("Bar ends", f"{n(BB['inner_top'])} × {n(BB['d'])}", "2", "Scribed to the cabinet's end and the wall", "The bar"),
            ("Bar floor · shelf", f"{n(BB['inner_w'])} × {n(BB['d'])} · {n(BB['inner_w'])} × {n(BB['inner_d'])}", "1 · 1", f"The floor on a {n(BB['plinth'])} plinth set back {n(BB['recess'])}; the shelf's top at {n(BB['mid'])}", "The bar"),
            ("Bar doors · plinth front", f"{n(BB['inner_top'] - BB['floor'] - 0.3)} × {n(BB['inner_w'] / 2 - 0.2)} · {n(BB['inner_w'])} × {n(BB['plinth'])}", "2 · 1", "Soft-close hinges; edges lipped", "The bar"),
        ]),
        ("Oak-faced ply, 6 mm", "", [
            ("Glass case back", "86 × 81", "1", "Pinned into the frame's rebate", "Glass case"),
        ]),
        ("Birch ply, 18 mm", "", [
            ("Bay 3 sides", "73 × 40", "2", "The record carcass, standing on the floor", "Media wall"),
            ("Bay 3 top and bottom", "56.4 × 40", "2", "Between the sides; back left open to the channel", "Media wall"),
            ("Plinth rails", "120 × 9", "2", "Front and back of the ladder frame under bays 1–2", "Media wall"),
            ("Plinth cross-pieces", "34.4 × 9", "3", "At both ends and under the bay 1–bay 2 joint, so the bay under bay 2 stays clear for the drawer", "Media wall"),
        ]),
        ("Birch ply, 12 mm", "", [
            ("Game drawer sides", "35 × 15.5", "2", "", "Media wall"),
            ("Game drawer back · front panel", "51.9 × 15.5 · 51.9 × 6", "1 · 1", "", "Media wall"),
            ("LP crate bases · slim drawer bases", "34.9 × 40 · 15.3 × 40", "2 · 3", "The sides and ends stand on them (v16)", "Media wall"),
            ("Bay 3 divider", "69.4 × 38", "1", "17.8 in from the left side, the full height inside (v16)", "Media wall"),
            ("Plinth drawer sides · ends", "34 × 4.4 · 49.6 × 4.4", "2 · 2", "A 52 × 34 × 5 box", "Media wall"),
            ("Bay 2 divider · part shelf", "35.3 × 38 · 32.2 × 36", "1 · 1", "The sub's column on the left; the PS2 over the PS1 on the right", "Media wall"),
            ("Keyboard tray", "54 × 26", "1", "Oak lip on its front edge", "Media wall"),
            ("Record table base", f"{n(G.RECORD_TABLE['carcass'][0] + 1)} × {n(G.RECORD_TABLE['carcass'][1] + 0.3)}", "1", "Screwed to the two KALLAX's open backs; the castors under it", "Record table"),
        ]),
        ("Birch ply, 9 mm", "", [
            ("Game drawer base", "52.5 × 34.4", "1", "In a 6 mm groove", "Media wall"),
            ("LP crate sides · ends", "40 × 8 · 33.1 × 8", "4 · 4", "Two of each per crate: a 33 cm trough (v16)", "Media wall"),
        ]),
        ("Birch ply, 6 mm", "", [
            ("Cabinet backs", f"{n(K['bay_t'])} · {n(K['bay_c'])}, both × {n(K['h'] - K['t_top'] - K['plinth'])}", "1 · 1", "Glued and pinned in each box, between its ends, its floor and its top", "Dining table"),
            ("Game drawer cross divider", "51.9 × 9", "1", "13 cm back from the front", "Media wall"),
            ("Game drawer bin walls · bin floors", "12.6 × 9 · 16 × 12.6", "2 · 2", "Floors raked so the cases lean about 13°", "Media wall"),
            ("Plinth drawer base", "52 × 34", "1", "Screwed under the box", "Media wall"),
            ("Bar back", f"{n(BB['inner_w'])} × {n(BB['inner_top'] - BB['floor'])}", "1", "Glued and pinned between the ends", "The bar"),
            ("Slim drawer sides · backs and fronts", "40 × 10 · 14.1 × 10", "6 · 6", "Three boxes 15.3 wide, 14.1 inside (v16)", "Media wall"),
        ]),
        ("Hardware", "Runners are sold in pairs", [
            ("C-table steel plate", "40 × 20 × 0.6", "1", "Mild steel (PlazCutz, cut to size); screwed under the foot, felt pads under it", "C-table"),
            ("LP crate runners · slim drawer runners", "400 mm full extension, 68–70 kg a pair · 400 mm light duty", "2 pairs · 3 pairs", "Into bay 3's sides and the divider (v16)", "Media wall"),
            ("Game drawer runners", "350 mm full extension, soft-close", "1 pair", "Accuride DZ3832EC or Screwfix 964VN", "Media wall"),
            ("Plinth drawer and keyboard tray runners", "300 mm full extension · 300 mm light duty", "1 pair · 1 pair", "", "Media wall"),
            ("Flip-top hinges", "Lee Valley 40574, solid brass, 1.27 × 7.0", "3", "Routed into the meeting edges of the two halves, 10 in from each side and the middle", "Dining table"),
            ("Piano hinge", "Altro continuous, 1800 × 50, cut to 90", "1", "The table's foot, on the hinge rail's top face (v27)", "Dining table"),
            ("Leg brackets · tabletop fasteners", "folding, self-locking · figure-8", "4 · 16", "The legs fold inside the aprons; the fasteners hold the aprons to the tops", "Dining table"),
            ("Door hinges (the cabinet)", "Altro continuous, 1800 × 32, stainless", "2", f"1 mm thick, one a door, not cut: centred on the {n(K['door_h'])} door, 1.9 short at each end; a screw every 10 cm, the knuckle just proud of the faces", "Dining table"),
            ("Catches, magnets and hooks", "catches · 10 mm magnet, cups · hooks", "4 · 1 + 2 · 6",
             "Magnetic catches: two in the door stops, two under the linen shelf for the folded table. A flush magnet and two steel cups hold an open door flat. A small brass cup hook takes the cloth bag", "Dining table"),
            ("Wall brackets (the cabinet)", "steel angle, 5 × 70 screws, plugs", "2", "One under each box's top into your solid wall", "Dining table"),
            ("Sub isolation riser", "dense foam or sorbothane, about 22 × 28 × 3", "1", "Under the sub in bay 2", "Media wall"),
            ("Concealed brackets", "for the uprights; two for the PC shelf, 40 kg+ a pair", "1 set", "", "Media wall"),
        ]),
    ]


def cuts_html():
    out = ["<p>Every made part in one list, grouped by what it's cut from, for the timber merchant. Sizes are finished sizes in cm, length × width × thickness. The cut lists in the other sections say how each part joins; this list is for ordering.</p>"]
    for grp, note, rows in cuts():
        out.append(f"<h4>{grp}</h4>" + (f"<p class='note'>{note}</p>" if note else ""))
        out.append("<table class='tight cuts'><tr><th>Part</th><th>Size (cm)</th><th>Qty</th><th>Notes</th><th>Section</th></tr>"
                   + "".join(f"<tr><td>{a}</td><td class='num'>{b}</td><td class='num'>{c}</td><td>{d}</td><td>{e}</td></tr>" for a, b, c, d, e in rows)
                   + "</table>")
    return "\n".join(out)


OFFCUT_USE = [(60, 25, "a spare shelf or a drawer box"), (40, 15, "drawer sides, cleats or jigs"), (0, 0, "packers, shims and test cuts")]


def nest_sheets():
    """v39: each ply in the cutting list nested onto full 244 × 122 sheets (nest.py)."""
    import nest
    out = []
    for grp, _note, rows in cuts():
        if "ply" not in grp.lower():
            continue
        parts = [(a.split(" · ")[0] if len(p) == 1 else a, l, w) for a, b, c, _d, _e in rows if (p := nest.parse(b, c)) for l, w, k in p for _ in range(k)]
        best = None
        for size in nest.SIZES:                        # a half or quarter sheet where a full one would be mostly offcut
            try:
                sh = nest.pack(parts, sheet=size)
            except ValueError:
                continue
            if best is None or len(sh) * size[0] * size[1] < len(best[1]) * best[0][0] * best[0][1]:
                best = (size, sh)
        out.append((grp, *best))
    return out


def nest_html(figs=True):
    import nest
    rows, sheet_figs = [], []
    for grp, size, sheets in nest_sheets():
        cuts_n = sum(len(s["parts"]) for s in sheets)
        used = sum(l * w for s in sheets for _n, _x, _y, l, w in s["parts"]) / (len(sheets) * size[0] * size[1])
        offs = [o for s in sheets for o in nest.offcuts(s, size)]
        big = sorted(offs, key=lambda o: -o[0] * o[1])[:2]
        use = "; ".join(f"{n(a)} × {n(b)}: " + next(u for la, lb, u in OFFCUT_USE if max(a, b) >= la and min(a, b) >= lb) for a, b in big) or "none to speak of"
        rows.append(f"<tr><td>{grp}</td><td class='num'>{len(sheets)} × {n(size[0])} × {n(size[1])}</td><td class='num'>{cuts_n}</td><td class='num'>{used:.0%}</td><td>{use}</td></tr>")
        sheet_figs += [f"<figure class='sheet'>{nest.svg(s, size)}<figcaption>{grp}, sheet {i + 1} of {len(sheets)}</figcaption></figure>" for i, s in enumerate(sheets)]
    return ("<h3>Sheets to buy, nested</h3><p>Every ply part laid out on the fewest boards (a full sheet is 244 × 122; half and quarter sheets "
            "where a full one would be mostly offcut), a 4 mm saw cut between parts, grain along the long side. Hand these to the merchant with the cutting list.</p><table class='tight'><tr><th>Sheet</th><th class='num'>Boards (cm)</th>"
            "<th class='num'>Parts</th><th class='num'>Used</th><th>Biggest offcuts, and what for</th></tr>" + "".join(rows) + "</table>" + ("".join(sheet_figs) if figs else ""))


def cuts_text():
    lines = ["Cutting list: media wall and dining wall (finished sizes in cm, length x width x thickness)"]
    for grp, note, rows in cuts():
        lines += ["", grp.upper() + (f" ({note})" if note else "")]
        lines += [f"- {a}: {b}, qty {c}" + (f" ({d})" if d else "") for a, b, c, d, e in rows]
    return "\n".join(lines)


def wiring_html():
    """v39 (item 13): the swapped media wall's leads on one page, laid before the carcass goes in."""
    TEN, SIX = "10-gang (left outlet)", "Retro 6-way (right outlet)"
    rows = [
        ("TV", f"mains → {TEN}", "Behind the TV, on the worktop"),
        ("Soundbar", f"mains → {TEN}; HDMI eARC → TV HDMI 2", "Along the worktop's back edge"),
        ("Sub", f"mains → {TEN}", "Down the slot behind the TV to the back of bay 2; keep its port clear"),
        ("Series X", f"mains → {TEN}; HDMI → TV HDMI 3", "Down the groove behind the turntable-side upright"),
        ("PC", f"mains (5 m C13) → {TEN}; HDMI (active optical, 5 m) → TV HDMI 1; Cat6 → Switch 2", "Brush grommet, then the two conduits chased into the side wall, behind the skirting to the plinth"),
        ("Deco B · Switch 2", f"12 V → {TEN} · mains → {TEN}; Cat6 from the landing", "Deco B down the other upright's groove; Switch 2 on edge in the channel"),
        ("Turntable · preamp", f"mains → {TEN}; RCA → 3.5 mm (2 m) → soundbar AUX", "The vinyl lead down the turntable-side groove"),
        ("USB charger", f"mains → {TEN}: fan stand, pad dock, bias light, HDMI switch", "On the worktop behind the TV"),
        ("Xbox One · Xbox 360 · PS3", f"mains → {SIX}; HDMI → switch → TV HDMI 4", "The channel's data side"),
        ("PS2", f"mains → {SIX}; component → RetroTINK; optical → soundbar", "The channel"),
        ("PS1 · RetroTINK", f"mains → {SIX} · USB 5 V 2 A → {SIX}; SCART → RetroTINK → switch", "The channel"),
    ]
    tr = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in rows)
    return ("<h3>The wiring plan, before the carcass goes in</h3><p>Lay the channel's trunking, the conduits and every lead below, "
            "label both ends, then build the base over them. Mains on one side of the trunking, HDMI, Cat6 and audio on the other.</p>"
            f"<table class='tight'><tr><th>Device</th><th>Leads, and where they plug in</th><th>Route</th></tr>{tr}</table>")


def buy_first_html():
    """v39 (item 7): for each piece of the plan, a cheap thing to buy and adapt first; a build only where nothing made fits."""
    sup = lambda *k: "<sup>" + ",".join(str(fit.ORDER.index(x) + 1) for x in k) + "</sup>"
    rows = [
        ("Media wall, bays 1–2", "Buy and adapt", f"Two IKEA BESTÅ frames{sup('besta')} on a ply plinth, behind an oak face frame"),
        ("Media wall, bay 3", "Build", "No frame takes a 33 cm LP trough beside a slim game column: birch ply, cut list below"),
        ("Uprights, shelves, worktop", "Build", "Solid oak scribed to your alcove; the merchant can cut it"),
        ("Dining cabinet and table", "Build", f"Nothing made folds a table for six round six chairs; the nearest, a fold-down wall table{sup('foldtable')}, opens to 80 × 138 and holds no chairs"),
        ("The bar beside the cabinet", "Build, then buy", f"The cupboard is scribed to a {n(G.BAR_BUILT['w'])} × {n(G.BAR_BUILT['d'])} gap; over it, an IKEA ENHET frame{sup('enhet')}; the counter from the worktop's offcut"),
        ("Glass case", "Buy and adapt", f"Toughened glass cut to size{sup('glasscut')}; the frame from the oak offcuts"),
        ("Record table", "Buy and adapt", f"Two IKEA KALLAX{sup('kallax')} on their backs, an oak lid, castors"),
        ("C-table", "Build", f"Bought ones slide their foot under the sofa{sup('ctablebuy')}; yours sits on the floor, so ours stands beside it on a steel-weighted foot{sup('plazcutz')}"),
        ("Alcove shelves", "Buy", f"Two oak floating shelves{sup('floatshelf')}"),
        ("Wall cabinets", "Buy", f"Two IKEA EKET{sup('eket')}"),
        ("Shelf over the door", "Buy and adapt", f"Two IKEA KUGGIS boxes{sup('kuggis')}; the shelf from the worktop's offcut"),
        ("Blanket basket · ottoman", "Buy", f"Dibor's Lakelyn{sup('lakelyn')} · the ISTOOLS ottoman{sup('istoolsott')}"),
        ("Step drawers", "Build (a joiner)", f"Each tread needs a bearer once its riser is cut{sup('stepdrawers')}"),
    ]
    tr = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in rows)
    return ("<h3>Buy and adapt first</h3><p>For each piece: the cheap thing to buy, and a build only where nothing made fits.</p>"
            f"<table class='tight'><tr><th>Piece</th><th>How</th><th>What</th></tr>{tr}</table>")


def guide_html():
    return (GUIDE_RULES + fit.measure_html() + buy_first_html() + guide_tools() + GUIDE_TECHNIQUES + "<h3>The order of work</h3>" + steps_table_html() + wiring_html()
            + GUIDE_TIME + GUIDE_PITFALLS + "<h3>The cutting list</h3>" + cuts_html() + nest_html())


def guide_pdf_html():
    """The build guide PDF: the guide, then every step in full."""
    return guide_html() + "<h2 class='pb'>Step by step, in full</h2>" + full_steps_html(pdf=True)


CT = ideas.ctable_parts()   # v43: the C-table's parts


def _plan(deck=False):
    """The plan as one HTML document. deck=True: images as art/ keys and markers kept, for the plan page's tabs."""
    global DECK
    DECK = deck
    ptot, tl, th = phase_totals()
    c = fit.counts()
    nfit = sum(c.values())
    css = (HERE / "doc.css").read_text()
    s = G.summary()
    g = G
    sup = lambda *k: "<sup>" + ",".join(str(fit.ORDER.index(x) + 1) for x in k) + "</sup>"   # v34: the fit proof's source numbers
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>Home Network &amp; Media Wall Plan</title>
<style>{css}</style></head><body>

<div class="p1">
<h1>Home Network &amp; Media Wall Plan</h1>
<p class="byline">Revised Oct 24, 2026 · @emma · {LABEL} (revision {REVISION}), drawn to your measurements</p>

<div class="decision"><b>What changed:</b> in The whole house you choose what you see: just your house, with the gardens, with next door, or a floor and its rooms (tap one to go in). The houses past the alley are mirrors of yours; bedroom 2 is down to the desk, bed, drawers and shelving; the wardrobes fit. The plan itself is as v51.</div>

<h2>1 · The plan on a page</h2>
<div class="hero">
<figure class="render">{img("render_v13_join_clean.png", "The artisan oak media wall in the pale mint, the table by the stairs")}
<figcaption>Drawn to your measurements, in your pale mint.</figcaption></figure>
<div class="summary">
<div><b>£{money(tl, th)}</b><span>the whole plan, item by item in section 11; no electrician on top</span></div>
<div><b>{c[fit.PASS]} of {nfit}</b><span>fit checks pass outright; {c[fit.TIGHT]} are tight, {c[fit.CHECK]} need a check on site (section 3)</span></div>
<div><b>{LPS} · 6</b><span>LPs ({g.WALL_LPS} in the wall, {g.STAND_LPS} in your vinyl stand) · seats at the table, the chairs kept inside it</span></div>
</div></div>
<table><tr><th>Area</th><th>Decision</th></tr>
<tr><td>Alcove</td><td>The TV in line with the sofa between two oak uprights, the right one a corner post against the breast; on the left, the turntable on the worktop and the Series X on a shelf at {n(g.RZ_SHELF_TOP)}; below, three 60 cm bays: the LP crates and a slim column of game and pad drawers under the turntable, then the PlayStations with the sub and the Xbox consoles under the TV.</td></tr>
<tr><td>Side wall</td><td>One oak run from the corner: a 7 cm ledge with four more LPs that sweeps out into the PC's shelf above the sofa's open end, a smart colour strip underneath, clear of the TV's sightlines.</td></tr>
<tr><td>Dining</td><td>The compact dining cabinet under your shelf by the stairs: two oak boxes, {n(g.CAB['len'])} long and {n(g.CAB['d'])} deep, with the table and your six grey padded folding chairs inside. The table swings down and opens to {n(g.CAB['len_open'])} × {n(g.CAB['top'][0])}, six in comfort; packed away it's two plain oak doors. The chimney breast keeps a “now playing” ledge and two framed LPs. It's the only table now: the long sliding cabinet and the flip-top are set aside (appendix). A more compact version, an {n(g.CAB80['top'][0])}-wide table, makes it {n(g.CAB['len'] - g.CAB80['len'])} shorter but keeps four chairs inside, not six (section 5): your call.</td></tr>
<tr><td>Records and games</td><td>About {LPS} LPs: {g.WALL_LPS} in the wall, every one face-out ({2 * g.TRAY_LPS} in the LP crates, 8 on the two ledges, 3 on the “now playing” ledge), and {g.STAND_LPS} in your vinyl stand ({g.RECORD_SHELF["lps_top"]} face-out on top, {g.RECORD_SHELF["lps_bottom"]} spine-up between its wires). Games: about {48 + g.SLIM_GAMES} face-out or spine-up in the game drawers, and 32 PS1 games in the plinth drawer.</td></tr>
<tr><td>Heights</td><td>Worktop and table {n(g.WORKTOP)} · TV centre 116.5 · Series X shelf {n(g.RZ_SHELF_TOP)} · ledges and PC shelf {n(g.LEDGE_TOP)} · high shelf {n(g.HIGH_TOP)}, {n(g.CEIL - g.HIGH_TOP)} under the {n(g.CEIL)} ceiling.</td></tr>
<tr><td>Colour and light</td><td>Your pale mint (#dbffc8, Valspar mixed at B&amp;Q), colour-drenched. The ceiling LED strip, smart colour strips in the uprights and under the side run, a bias light, and two Wolston-style spot bars with smart colour bulbs on your two existing ceiling points; one app, one scene for the lot.</td></tr>
<tr><td>Power and network</td><td>Your own job: the side-wall socket becomes a double, left for the 10-gang (everything modern, the PC included), right for the retro set, switched at the wall. Deco A in bedroom 3, Cat6 down the airing cupboard.</td></tr>
</table>
<h3>What it costs, piece by piece</h3>
{cost_pieces_html()}
</div>

<h2 class="pb">2 · The room</h2>
<p>Everything is drawn from your hand-measured sketch; where the agent's floor plan disagrees, your tape wins. The L-sofa is from your photo<sup>{fit.ORDER.index("sofa") + 1}</sup>: about {n(g.SOFA_W)} long, the return a typical {n(g.SOFA_D)} until you measure it, an ottoman end towards the TV, {n(g.SOFA_BACK_Z - g.WINDOW_Z)} cm off the window wall.</p>
<figure>{living_plan()}</figure>
<figure class="render">{img("render_v39_3d_room.png", "The whole room in 3D, the Bright preset")}
<figcaption>The whole room in 3D, from above the window side, the dining cabinet packed away by the stairs.</figcaption></figure>
<table class="tight"><tr><th>From your sketch</th><th>mm</th><th>Notes</th></tr>
<tr><td>Room, east to west along the window</td><td class="num">{n(g.ROOM_W*10)}</td><td>The media wall is the south wall, shared with the hall and garage</td></tr>
<tr><td>Window wall to the alcove's back wall</td><td class="num">{n(g.ROOM_D*10)}</td><td>To the chimney breast's face: {n((g.ROOM_D - g.ALC_D)*10)}</td></tr>
<tr><td>Ceiling</td><td class="num">{n(g.CEIL*10)}</td><td></td></tr>
<tr><td>TV alcove, east wall to the breast</td><td class="num">{n(g.ALC_W*10)} × {n(g.ALC_D*10)}</td><td>Floor to ceiling</td></tr>
<tr><td>Chimney breast</td><td class="num">{n(g.BREAST_W*10)}</td><td>Projects 380 on the alcove side, 390 on the west side: the dining wall</td></tr>
<tr><td>Window and radiator (north wall, facing 14° east of north)</td><td class="num">2350 · 1370</td><td>Window starts 730 from the east wall; radiator ends 130 inside its west end; the glass from {n(g.WINDOW_Y[0]*10)} to {n(g.WINDOW_Y[1]*10)} up, set {n(g.WINDOW_REVEAL*10)} back in its reveal over a deep sill (v17, from your note; the depth is drawn, please check it)</td></tr>
<tr><td>Skirting</td><td class="num">60 × 20</td><td>White now; pale mint eggshell in the plan</td></tr>
<tr><td>West end: recess, door, stair box</td><td class="num">935 / 1045 / 660 / 820</td><td>Drawn roughly: please confirm which is which</td></tr>
<tr><td>Stairs, beside the door</td><td class="num">820 wide</td><td>They go <b>up</b> to the first floor, rising away from the room; on the room side a low white wall with your banister above it, from your photo: a square post at the foot and two flat slats up to the wall by the door<sup>{fit.ORDER.index("photo23stairs") + 1}</sup></td></tr>
</table>
<p><b>From the sofa:</b> from the middle of the long side your eyes are about {s["view_dist"]/100:.2f} m from the screen, which a 55-inch fills at about {s["view_angle"]:.0f}°: right for TV and games. It's about {abs(s["sofa_mid_off_axis_deg"]):.0f}° off-centre; the screen's centre is just above a seated eye line. The lowest spot shade is at {n(g.CEIL - g.BAR[2])} cm.</p>
<h3>Your new storage ottoman</h3>
<p>Yours is 75 square and 44 high, in blue cord{sup("pouf")}. No navy cord storage ottoman is made that size{sup("luxorcord")}, so the plan's is navy velvet.</p>
<ul>
<li><b>Our pick: ISTOOLS Large Velvet Storage Ottoman, 76 × 76, navy</b>{sup("istoolsott")}. It's the nearest size made to yours (1 cm wider each way), with a padded lid that lifts off, a box inside for your games and cards, and a wooden frame on short legs. They don't publish its height (we've drawn 45) and the price varies by size and colour (about £300 at 76): check both on the listing before ordering.</li>
<li><b>Smaller and cheaper: Dunelm Square Opulent Velvet Storage Footstool, navy</b>, 62 × 62 × 39, 18 deep inside, £139–199{sup("opulent")}. It gives 14 cm back each way.</li>
<li><b>Bigger: Dunelm Zoe Pinstripe Square Storage Footstool</b>, 96 × 96 × 49, navy, £99.50–199{sup("zoe")}. It's a coffee-table size, and too big for the gap beside your coffee table.</li>
</ul>
<p><b>Your games and cards in it.</b> Inside it is about {n(g.OTTO_GAMES["inner"])} square and {n(g.OTTOMAN["inner_h"])} deep (as drawn; check the real one when it comes). Square board games come in a {n(g.GAME_BOX[0])} × {n(g.GAME_BOX[1])} × {n(g.GAME_BOX[2])} box (Ticket to Ride's, the usual size{sup("ttr")}), so <b>{g.OTTO_GAMES["games"]} fit</b>: two by two, three layers deep. A {n(g.OTTO_GAMES["strip"])} cm strip along one side takes about 38 card decks on edge{sup("bicycle")}.</p>
<figure class="render">{img("render_v39_3d_ottoman.png", "The new storage ottoman, its lid lifted: games and cards inside")}
<figcaption>The storage ottoman where yours stands, beside the coffee table, its padded lid lifted.</figcaption></figure>
<h3>The storage you picked</h3>
<table class="tight"><tr><th>What</th><th>Where</th><th>Size</th></tr>
<tr><td>Shelf over the hall door, two lidded boxes{sup("kuggis")}</td><td>Over the architrave (check its height)</td><td>{n(g.DOOR_SHELF["x"][1] - g.DOOR_SHELF["x"][0])} × {n(g.DOOR_SHELF["d"])} at {n(g.DOOR_SHELF["y"])}; boxes 35 × 26 × 15</td></tr>
<tr><td>Two lidded boxes on your black shelf{sup("kuggis")}</td><td>Either side of the laser</td><td>35 × 26 × 15 each</td></tr>
<tr><td>Two oak alcove shelves{sup("floatshelf")}</td><td>The window corner, over the plant stand</td><td>two {n(g.ALCOVE_SHELVES["w"])} × {n(g.ALCOVE_SHELVES["d"])}, tops at {n(g.ALCOVE_SHELVES["tops"][0])} and {n(g.ALCOVE_SHELVES["tops"][1])}</td></tr>
<tr><td>Two wall cabinets, glass doors{sup("eket")}</td><td>The side wall over the sofa's corner, past the PC shelf</td><td>two {n(g.EKET[0])} cubes, {n(g.WALL_CABS["y0"])} to {n(g.WALL_CABS["y0"] + g.EKET[2])} up</td></tr>
<tr><td>Drawers in the bottom three steps{sup("stepdrawers")}</td><td>The stairs by the door</td><td>fronts {n(g.STAIR_DRAWERS["w"])} × {n(g.STAIR_DRAWERS["h"])}, {n(g.STAIR_DRAWERS["depth"])} deep</td></tr>
<tr><td>Blanket basket, water hyacinth{sup("lakelyn")}</td><td>Against the side wall at the sofa's open end</td><td>{n(g.BLANKET_BASKET["d"])} × {n(g.BLANKET_BASKET["w"])} × {n(g.BLANKET_BASKET["h"])}: five throws folded long{sup("ofelia")} stack {n(5 * g.THROW_LONG[2])} of its {n(g.BLANKET_BASKET["inner"][2])}</td></tr>
</table>
<p>Fix the wall cabinets and the shelves into plugs in the solid wall, anti-tip as the makers say. The step drawers are a joiner's job: each tread needs a bearer once its riser is cut, so build them with the new stairs.</p>
<figure class="render">{img("render_v39_3d_sg_stairdrawers.png", "Drawers in the bottom three steps, pulled out")}
<figcaption>The step drawers, pulled out.</figcaption></figure>
<h3>The record table</h3>
<p>Your coffee table's 90 × 50, from two IKEA KALLAX{sup("kallax")} on their backs: two bins of LPs, spine-up, about {g.RECORD_TABLE["per_bin"]} in each. An oak lid lifts on a piano hinge along the TV side; it rolls on castors. {n(g.RECORD_TABLE["h"])} high.</p>
<figure class="render">{img("render_v39_3d_sg_recordtable.png", "The record table with its lid up")}
<figcaption>Lid up: about {g.RECORD_TABLE["lps"]} LPs in two bins.</figcaption></figure>
<ul>
<li><b>Buy:</b> two KALLAX 42 × 42 (£19 each){sup("kallax")}; an 18 mm oak board, 60 × 120{sup("snowdonoak")}; 12 mm ply{sup("wickesply")}; four 50 mm castors, 50 kg each{sup("castor50")}; a piano hinge cut to 83{sup("piano32")}; two lid stays{sup("lidstay")}.</li>
<li><b>Make:</b> build both KALLAX and screw them together side by side. Screw the ply ({n(g.RECORD_TABLE["carcass"][0] + 1)} × {n(g.RECORD_TABLE["carcass"][1] + 0.3)}) to the open backs; a castor 4 in from each corner.</li>
<li><b>The lid:</b> the oak cut to 90 × 50, corners rounded, oiled; hinged to the TV side's top edge, 3.5 over each end; a stay each end, stopping at about 80°.</li>
<li><b>Check:</b> loaded, about {g.RECORD_TABLE["kg"]} kg; the castors take 200. The records stand on the ply, not the KALLAX shelves.</li>
</ul>
<h3>The C-table</h3>
<p>At the sofa's open end: an oak top {n(CT["top"][0])} × {n(CT["top"][1])} at {n(ideas.CTABLE["top"])}, reaching {n(ideas.CTABLE["over"])} over the seat. Your sofa sits on the floor, so no foot can slide under it as a bought one's does{sup("ctablebuy")}; a 6 mm steel plate{sup("plazcutz")} weighs its foot down instead. It holds about {ideas.ctable_tip_kg()} kg on its far edge{sup("oakdensity")}. About £8–15.</p>
<ul>
<li><b>Cut:</b> from the Snowdon pack's second 18 mm board{sup("snowdonoak")}: the top {n(CT["top"][0])} × {n(CT["top"][1])}, the upright {n(CT["upright"][0])} × {n(CT["upright"][1])}, the foot {n(CT["foot"][0])} × {n(CT["foot"][1])}.</li>
<li><b>Make:</b> glue and screw the upright to the top's and the foot's outer edges (three 40 mm screws each, plugged); round the corners; hardwax oil. Screw the plate under the foot, felt under the plate.</li>
<li><b>Check:</b> it stands square; with a full mug on the far edge it doesn't rock.</li>
</ul>
<h3>The house</h3>
<figure>{house()}</figure>
<p>Deco A and Switch 1 sit with the Hub 5 and the gaming PCs in bedroom 3; both Cat6 runs go across the landing and drop through the airing cupboard, which sits over the alcove's corner (section 9).</p>

<h2 class="pb">3 · The media wall</h2>

<figure class="render">{img("render_v13_join_key_scene.png", "Render with numbered parts")}
<figcaption>Numbered view: the game drawer and the lower LP crate are pulled out 30 cm.</figcaption></figure>
{key_table()}

<h3>Built to your alcove: {n(g.ALC_W)} wide, {n(g.ALC_D)} deep, {n(g.CEIL)} to the ceiling</h3>
<ul>
<li><b>Base:</b> 3 cm filler, three 60 cm bays, 3 cm filler. Bays 1 and 2 are IKEA BESTÅ 60×40×64 frames on a 9 cm plinth (tops at 73, back panels off); bay 3 is an 18 mm ply carcass 60 × 40 × 73 from the floor, split by a 12 mm divider into the slim game column (two face-out game drawers and the pads drawer) and the LP column (two face-out LP crates) under the turntable. One oak face frame runs across all three; its bottom rail hides the plinth and a hidden drawer under bay 2 with a finger pull (no push-to-open at floor level).</li>
<li><b>Depth:</b> 40 cm frames, a 4 cm cable channel behind and the 2 cm face frame make {n(g.BASE_D)} cm from the back wall, {n(g.BASE_PROUD)} cm proud of the chimney breast.</li>
<li><b>Worktop:</b> solid oak, {n(g.ALC_W)} × {n(g.BASE_D)} × 3, top at 76, with a brush-lined slot behind the TV and a grommet behind the deck.</li>
<li><b>Oak uprights:</b> 4.5 × 30 cm, {n(g.UPRIGHT_LEN)} cm from the worktop to the ceiling. The left one is at {n(g.UP_L[0])}–{n(g.UP_L[1])}, between the turntable zone and the TV. The right one stands against the breast at {n(g.UP_R[0])}–{n(g.UP_R[1])}, a corner post that frames the TV. That leaves {n(g.TV_GAP)} cm between them, {n(g.TV_CLEAR)} cm clear of the TV each side.</li>
<li><b>TV:</b> centre {n(g.TV_CX)} cm from the side wall, in line with the sofa, on LG's stand set 2 cm off the back wall: bottom {n(g.TV_BOTTOM)}, centre 116.5, top {n(g.TV_TOP)}. The soundbar sits centred under it at the worktop's front edge.</li>
<li><b>The turntable zone:</b> {n(g.RZ_W)} cm between the side wall and the left upright. The deck sits on the worktop with {n((g.RZ_W - g.DECK[0]) / 2)} cm each side and its lid opens to about {n(round(g.LID_TOP_OPEN))}. Above it is an oak shelf at {n(g.RZ_SHELF_TOP)}, through-tenoned into the upright, carrying the Series X on its fan stand; the phono preamp hangs underneath at the back.</li>
<li><b>Shelves above:</b> the record ledge at 155.4 between the uprights, four LPs face-out; the high shelf at 196, wall to wall in two lengths, with books, a box, a print, a small framed sleeve and Deco B.</li>
<li><b>Bay 2 with the sub (v13.5):</b> the PS3 keeps the top row. Below its shelf the bay splits: on the left the sub's column, {n(g.SUB_COL[1] - g.SUB_COL[0])} cm wide, then a 12 mm ply divider, then {n(g.PS_COL[1] - g.PS_COL[0])} cm for the PS2 over the PS1 on a part shelf. The sub stands on a {n(g.SUB_RISER_H)} cm isolation riser with 1 cm each side and {n(g.SUB_COL_TOP - g.SUB_IN["y"][1])} above. Its front is flush with the face frame, so its driver faces the room and its rear port has {n(g.SUB_PORT_GAP)} cm to the wall.</li>
<li><b>Power:</b> the side-wall socket in front of the records bay becomes a double. Its two leads enter through a notch at the left end of the face frame's bottom rail and run back through the plinth to the channel.</li>
</ul>
<div class="why"><b>The media wall, looked over again (v17)</b>
<ul>
<li><b>The TV's remote:</b> the soundbar's top is 0.6 above the screen's bottom edge, right where LG puts the remote's receiver. Sit the bar 2 cm proud of the stand's foot so the beam from the sofa clears it; LG's Magic Remote works by radio once paired, so it doesn't mind either way (a check in the fit proof).</li>
<li><b>Heat:</b> every console bay is open front and back, the bricks lie flat at the back with nothing on top, and the Series X has 15 cm each side and 21 above.</li>
<li><b>One remote for most of it:</b> HDMI-CEC (SIMPLINK) lets the TV's remote work the soundbar and the modern consoles (step 13); the HDMI switch has its own remote for the retro side.</li>
</ul></div>
<figure>{front()}</figure>
<figure>{section()}</figure>
<h3>The sub in the media wall</h3>
<p>You asked for the sub back in the unit, with the Xbox bricks moved behind. It fits, and it sits in the best spot for it: under the TV, beside the soundbar, so the bass comes from the same place as the picture. Here's how the base makes room, and what was checked.</p>
<ul>
<li><b>The bricks go to the back.</b> The Xbox One's brick (17 × 7.5 × 4.8<sup>{fit.ORDER.index("xb1psu") + 1}</sup>) and the Xbox 360's (allowed 21 × 10 × 6<sup>{fit.ORDER.index("x360psu") + 1}</sup>) lie flat at the back of their shelves, by the channel's power leads. Microsoft asks for a ventilated space, flat on the rubber pads, with nothing on top<sup>{fit.ORDER.index("psuplace") + 1}</sup>; the bays are open front and back.</li>
<li><b>That frees bay 1's fronts</b> beside the two Xboxes, so the HDMI switch (beside the Xbox One, where its remote reaches it) and the RetroTINK (beside the Xbox 360) move up from bay 2.</li>
<li><b>Bay 2's lower half becomes two columns:</b> the sub on the left, under the TV, and the PS2 over the PS1 on the right. The sub is {n(g.SUB[0])} × {n(g.SUB[2])} × {n(g.SUB[1])}<sup>{fit.ORDER.index("hisense") + 1}</sup>; its column is {n(g.SUB_COL[1] - g.SUB_COL[0])} wide and {n(g.SUB_COL_TOP - g.SUB_COL_FLOOR)} tall.</li>
<li><b>The port:</b> the sub's front sits flush with the face frame, so its rear port is {n(g.SUB_PORT_GAP)} cm from the wall through the open back and the channel. That's inside the 15–30 cm advised for a rear port<sup>{fit.ORDER.index("subport") + 1}</sup>, at the low end, so the channel behind bay 2 stays clear: Switch 2 and the retro 6-way move behind bay 1.</li>
<li><b>Vibration, the one thing to test:</b> Microsoft advises keeping the Xbox 360 away from subwoofers<sup>{fit.ORDER.index("x360place") + 1}</sup>, and the deck shares the worktop. The 360 is a whole bay away, the sub stands on an isolation riser without touching the divider or the frame, and the deck has isolation feet. Once it's built, play a disc game and a record at film volume. If anything skips, turn the sub down for that source; if it still does, the sub can go back under the dining wall.</li>
<li><b>The dining wall is clear underneath:</b> no cover to make, and nothing to move for eight at the table.</li>
</ul>

<h3>The fit proof: every item against its published size</h3>
<p>Each zone lists what goes in it, its size and its source (section 12), the space, what's left and a verdict. {c[fit.PASS]} of the {nfit} checks fit outright and none fail; {c[fit.TIGHT]} are tight, most of them snug by design; {c[fit.CHECK]} need a check on site (the TV's plugs, the RetroTINK's size, the sub's vibration, the soundbar and the TV's remote eye, the stairs wall, and your shelf's height).</p>
<!--fit-->{fit.tables_html()}<!--/fit-->
{fit.measure_html()}
{fit.safety_html()}

<h3>Console sizes, every version</h3>
<p>The bays are sized for the largest version of each console. The model number is on the label underneath; a smaller version just leaves more room.</p>
<table class="tight"><tr><th>Console</th><th>Version</th><th>W × D × H (cm)</th><th>Power</th></tr>
<tr><td>PS1</td><td>Original (largest) · PS one</td><td>27.0 × 18.8 × 6.0 · 19.3 × 14.4 × 3.8</td><td>Built in · external adapter</td></tr>
<tr><td>PS2</td><td>Original (largest) · Slim</td><td>30.2 × 18.3 × 7.8 · 23.1 × 15.2 × 2.8</td><td>Built in · external brick</td></tr>
<tr><td>PS3</td><td>Original (largest) · Slim · Super Slim</td><td>32.5 × 27.4 × 9.8 · 29.0 × 29.0 × 6.5 · 29.0 × 23.0 × 6.0</td><td>Built in</td></tr>
<tr><td>Xbox 360</td><td>Original (largest) · S · E</td><td>30.9 × 25.8 × 8.3 · about 27.0 × 26.4 × 7.5 · 25.4 × 26.4 × 6.7</td><td>External brick</td></tr>
<tr><td>Xbox One</td><td>Original (largest) · S · X</td><td>33.3 × 27.4 × 7.9 · 29.5 × 22.9 × 6.4 · 30.0 × 24.0 × 6.0</td><td>External brick · built in</td></tr>
<tr><td>Xbox Series X</td><td>Standing</td><td>15.1 × 15.1 footprint, 30.1 tall</td><td>Built in</td></tr>
</table>

<h3>The drawer layouts</h3>
<p>Seven drawers in the alcove base, all drawn to scale from above: <b>A</b> the game drawer (bay 1), <b>B</b> the hidden plinth drawer under bay 2, <b>C</b> and <b>D</b> the two face-out LP crates and <b>E</b> to <b>G</b> the slim drawers beside them (bay 3). Each one shows its compartments, what goes in them and how many, and its runners. Every front is a plain oak lip with a finger pull cut underneath.</p>
<figure>{drawer_layouts()}</figure>
<figure class="render">{img("render_v13_drawers.png", "Every drawer out: the game drawer, the upper LP crate, a slim game drawer and the plinth drawer")}
<figcaption>Every drawer out, in place: the game drawer, an LP crate and a slim drawer 30 cm out.</figcaption></figure>
<h3>The game drawer (bay 1, bottom row)</h3>
<p>Unchanged. Two display bins at the front show covers face-out even with the drawer shut (Xbox left, PS2 right, a small tray between them); behind them the rest of the games stand on edge with the spine on top, so every title faces up when you roll it out.</p>
<figure>{game_drawer()}</figure>
<ul>
<li><b>Box:</b> about 54.3 × 35 cm outside on 350 mm full-extension soft-close runners screwed to the BESTÅ sides; sides 15 cm; 9 mm base lined in felt. About 48 games.</li>
<li><b>Runners:</b> Accuride DZ3832EC (43 kg) or Screwfix Essentials 964VN (40 kg); not IKEA's BESTÅ runners, which aren't full extension.</li>
<li><b>The bricks:</b> both Xbox bricks lie flat at the back of their shelves, on their rubber pads, beside the channel's power leads, with nothing on top. Microsoft only asks that the space is ventilated<sup>{fit.ORDER.index("psuplace") + 1}</sup>, and these bays are open at the front and the back.</li>
</ul>

<h2 class="pb">4 · The records and the turntable</h2>
<h3>Your plant stand and your vinyl stand (v18)</h3>
<ul>
<li><b>Your plant stand:</b> 98 × 29.5 × 158. Two slatted towers of five tiers, with an open middle holding two shelves for taller plants.</li>
<li><b>Your vinyl stand:</b> 70 × 32 × 78. A black steel frame and rustic wood: two face-out bays on top, LPs standing between wire dividers below.</li>
<li><b>Sizes</b> from the listings you sent<sup>{fit.ORDER.index("plantstand") + 1},{fit.ORDER.index("vinylstand") + 1}</sup>.</li>
<li><b>Two good places:</b> the window's west corner and the chimney breast (free now the table is by the stairs), so two layouts. In the 3D room, Tools › Layout switches between them; in Edit room you can drag either anywhere.</li>
</ul>
<ul>
<li><b>A, recommended: plants in the window corner, records on the breast.</b><ul>
<li>The plant stand goes against the window wall, between the curtains' stack and the pipe boxing: {n(g.PIPE_BOX["x"][0] - g.WINDOW_X[1] - g.CURTAIN["ext"])} cm for its 98, so 4.5 each side. Measure before it goes in; if it's tight, open the curtains' stack a little towards the window.</li>
<li>Its plants get daylight from the window beside them; at 158 it leaves 77 to the ceiling.</li>
<li>The vinyl stand goes on the breast, centred, under the “now playing” ledge ({n(g.NOW_LEDGE["top"] - g.NOW_LEDGE["t"] - g.RECORD_SHELF["h"])} cm clear). Pick a record from its top bays, play it on the deck an arm's reach away, stand its sleeve on the ledge.</li>
<li>About {g.RECORD_SHELF["lps_top"] + g.RECORD_SHELF["lps_bottom"]} more LPs.</li></ul></li>
<li><b>B: records in the window corner, as today, plants on the breast.</b><ul>
<li>The plants become the breast's display, 9.75 cm clear each side.</li>
<li>At 158 tall the stand comes up past the two frames, so the frames go up above it (or elsewhere) and the “now playing” ledge comes off.</li></ul></li>
<li><b>Either way:</b><ul>
<li>Your red lamp moves from the window corner to the sofa's west end.</li>
<li>Drip trays or a waterproof mat under the pots protect the slats and the carpet.</li>
<li>Felt pads under the vinyl stand.</li></ul></li>
</ul>
<figure class="render">{img("render_v39_3d_plants_corner.png", "Layout A: your plant stand in the window corner")}
<figcaption>Layout A, from the 3D room: your plant stand in the window's west corner.</figcaption></figure>
<figure class="render">{img("render_v39_3d_records_breast.png", "Layout A: your vinyl stand on the breast")}
<figcaption>Layout A: your vinyl stand on the chimney breast, under the “now playing” ledge, beside the turntable.</figcaption></figure>
<p>The vinyl is in one place, in the alcove: the deck on the worktop, the records in the two LP crates right underneath it, the preamp tucked under the shelf above, and (v16) the “now playing” ledge on the breast an arm's reach away. Pull a crate, pick a record, play it, and stand its sleeve on the ledge.</p>
<figure>{drawer()}</figure>
<h3>The glass display case on the chimney breast</h3>
<p>You picked it: a tall glass case on the breast, {n(ideas.CASE["x"][1] - ideas.CASE["x"][0])} × {n(ideas.CASE["y"][1] - ideas.CASE["y"][0])} × {n(ideas.CASE["d"])} deep, centred from {n(ideas.CASE["y"][0])} to {n(ideas.CASE["y"][1])}, {n(g.CEIL - ideas.CASE["y"][1])} under the ceiling. Three 6 mm glass shelves on pins, a 4 mm toughened front that lifts off{sup("glasscut")}, a warm strip inside. An oak frame from the offcuts on a hidden cleat, about 16 kg empty. Step 9 builds it; about £90–170.</p>
<figure class="render">{img("render_v39_3d_glass_case.png", "The glass display case on the chimney breast")}
<figcaption>The case on the breast with collectibles, the “now playing” ledge and your vinyl stand under it.</figcaption></figure>
<figure class="render">{img("render_v39_3d_case_mixed.png", "The case with a black frame and a bit of each")}
<figcaption>The same case with a black frame and a bit of everything: 7-inch singles, a cap and figures, small plants.</figcaption></figure>
<h3>How bay 3 works (v16)</h3>
<ul>
<li><b>Why it changed:</b> with LPs only, v15's trays had about 10 cm of empty width each side. Now a 12 mm divider splits the bay: the LP crates take only the width LPs need, and the rest becomes a slim column that does a job.</li>
<li><b>The LP crates:</b> a {n(g.TRAY_INSIDE)} cm trough, the snug width record shops use<sup>{fit.ORDER.index("crate") + 1}</sup>: the sleeves stand with a little play and you flip them by their top edges. They lean back 10°; the last one leans on a raked oak rest. Outer sleeves up to 32.4 still fit.</li>
<li><b>Capacity:</b> about {g.TRAY_LPS} LPs per crate; two crates, about {2 * g.TRAY_LPS} LPs, the same as before.</li>
<li><b>The slim column:</b> three drawers {n(g.SLIM_BOX_X[1] - g.SLIM_BOX_X[0])} wide, {n(g.SLIM_INSIDE)} inside. The bottom two hold DVD-size game cases face-out (13.5 wide), about {g.SLIM_DRAWERS[0]["n"]} each, flipped like the records. The top one holds four pads on edge<sup>{fit.ORDER.index("pads") + 1}</sup>, the TV, soundbar and streaming remotes, and a USB-C lead fed from the 10-gang to charge a pad in the drawer.</li>
<li><b>Runners:</b> 400 mm full extension everywhere; 68–70 kg a pair under the crates. A full crate weighs about 30 kg: open one at a time, and fit the anti-tip brackets before loading.</li>
</ul>
<table class="tight"><tr><th>Dimension</th><th>Figure</th><th>How it adds up</th></tr>
<tr><td>Bay 3 carcass</td><td>60 × 40 × 73 outside, 56.4 × 69.4 inside</td><td>18 mm birch ply; back open to the channel; a 12 mm divider 17.8 in from the left</td></tr>
<tr><td>Across the bay</td><td>15.26 + 2.54 + 1.2 + 34.86 + 2.54 = 56.4</td><td>Slim drawer, its runners, the divider, the LP crate, its runners: nothing left over</td></tr>
<tr><td>LP crate</td><td>34.86 × 40 outside, 33.06 × 38.2 inside</td><td>9 mm sides and ends; 0.8 either side of a 31.4 sleeve</td></tr>
<tr><td>Slim drawers</td><td>15.26 × 40 outside, 14.06 inside</td><td>6 mm sides; bases at 2.3, 25.1 and 47.9</td></tr>
<tr><td>Lower crate · upper crate</td><td>Undersides 2.3 · 37.0; sleeves to 34.4 · 69.1</td><td>2.6 and 2.1 cm finger room; top panel at 71.2</td></tr>
</table>
<h3>The turntable zone</h3>
<ul>
<li><b>The deck:</b> on isolation feet, 2 cm back from the worktop's front edge, with {n(g.ALC_D - g.DECK_Z[1])} cm behind it for the lid's hinges. The zone takes a deck up to the size of an AT-LP120X (45.2 × 35.2 cm); most decks are smaller.</li>
<li><b>The lid:</b> AT's cover is 44.1 × 34.6 cm<sup>{fit.ORDER.index("lid") + 1}</sup>, so standing open its top edge is at about {n(round(g.LID_TOP_OPEN))}; the shelf's underside is at {n(g.LID_CLEAR_TO)}.</li>
<li><b>Bass:</b> the sub is in bay 2, in the same base the deck sits on. It stands on an isolation riser, clear of the divider and the frame, and the deck stands on isolation feet. If a record skips or hums at film volume, turn the sub down for vinyl.</li>
<li><b>Signal path:</b> turntable set to PHONO → the preamp under the shelf → a 2 m RCA-to-3.5 mm lead down the groove behind the left upright and along the back of the worktop to the soundbar's AUX. If the deck has no PHONO/LINE switch, plug it straight into the AUX.</li>
<li><b>Soundbar:</b> Music mode, bass up, surround, night and dialogue modes off. Always the AUX cable, never Bluetooth.</li>
</ul>
<h3>Storage options, to scale</h3>
<figure>{storage()}</figure>
<h3>Where every record lives</h3>
<table class="tight"><tr><th>Where</th><th>What</th><th>How many</th></tr>
<tr><td>Bay 3, the two LP crates</td><td>LPs, face-out</td><td>About {2 * g.TRAY_LPS} LPs</td></tr>
<tr><td>The breast (v16)</td><td>The “now playing” ledge</td><td>3 LPs, the one that's on and the next two</td></tr>
<tr><td>Above the TV</td><td>Oak record ledge, the "now playing" wall</td><td>4 LPs</td></tr>
<tr><td>Side wall</td><td>The oak run round the corner</td><td>4 LPs</td></tr>
<tr><td>Your vinyl stand (v18.1)</td><td>LPs, face-out on top, spine-up below</td><td>About {g.STAND_LPS} LPs ({g.RECORD_SHELF["lps_top"]} + {g.RECORD_SHELF["lps_bottom"]})</td></tr>
<tr class="total"><td>Total</td><td></td><td>About {LPS} LPs: {g.WALL_LPS} in the wall, every one face-out, and {g.STAND_LPS} in the stand</td></tr>
</table>
<p>If the collection is bigger than this, tell me the count. The neatest overflow is another LP column like bay 3's (40 wide, two crates, 180 LPs), or LPs spine-out on the high shelf.</p>

<h2 class="pb">5 · The dining wall</h2>
{cab_html()}
<h3>The bar beside the cabinet</h3>
<p>A back-bar {n(g.BAR_BUILT["w"])} wide between the cabinet and the pipe boxing, {n(g.BAR_BUILT["front"])} deep: no deeper than the open table door. A cupboard for {g.BAR_BUILT["bottles"]} bottles{sup("bottles")}, an oak counter at {n(g.BAR_BUILT["counter"])}{sup("worktop")}, a 3 mm acrylic mirror{sup("acrylicmirror")} and an IKEA ENHET frame{sup("enhet")} over it, {n(g.BAR_BUILT["enhet_head"])} under your black shelf. With the table door back, {n(g.BAR_BUILT["covered"])} of it is behind the door: set the drinks out first.</p>
<figure class="render">{img("render_v39_3d_beside_bar.png", "The bar beside the dining cabinet, shut")}
<figcaption>The bar beside the dining cabinet, under your black shelf.</figcaption></figure>
<figure class="render">{img("render_v39_3d_beside_bar_open.png", "The bar open")}
<figcaption>Open: the bottles inside, glasses on the frame.</figcaption></figure>
<ul>
<li><b>Build:</b> 18 mm oak-faced ply as for the cabinet: two ends scribed to the cabinet and the wall, a floor on a 3 cm plinth set back 2, a shelf at {n(g.BAR_BUILT["mid"])}, a 6 mm back, two doors on soft-close hinges; the 27 mm oak counter screwed up through the ends; the carcass screwed to the wall, the plinth to the floor. Then the mirror, stuck on, and the ENHET frame on its own fixings, anchored as IKEA says.</li>
</ul>

<h2 class="pb">6 · The side wall</h2>
<p>One oak line at {n(g.LEDGE_TOP)} cm runs over the TV between the uprights and, past the turntable zone, along the side wall. On the side wall it's <b>one run</b>, {n(g.SIDE_RUN_T)} thick: a 7 cm ledge with four LPs face-out that sweeps out to the 28 cm PC shelf. A warm LED strip under its front edge washes the wall below.</p>
<figure class="render">{img("render_v13_side.png", "The PC side wall")}
<figcaption>The side wall from the room: the oak run round the corner with its four LPs.</figcaption></figure>
<figure>{pc_shelf()}</figure>
<ul>
<li><b>The run:</b> {n(g.SIDE_RUN_Z[0] - g.SIDE_RUN_Z[1])} cm long, {n(g.SIDE_RUN_T)} thick, cut from one 225 × 30 × 4 oak board to a full-size template: 7 deep along the LPs (with a 1.5 cm lip), easing out to {n(g.PC_SHELF_D)} over {n(g.SIDE_SWEEP[0] - g.SIDE_SWEEP[1])} cm just past the last LP. It sits on an oak cleat screwed to the side wall, dowelled to the left upright's front edge.</li>
<li><b>The PC end:</b> {n(g.PC_SHELF_Z[0] - g.PC_SHELF_Z[1])} × {n(g.PC_SHELF_D)} cm, on two concealed heavy-duty brackets (40 kg+ a pair) as well as the cleat, {n(g.PC_SHELF_TOP - g.PC_SHELF_T - g.SOFA_H)} cm above the sofa's back. The case sits with its glass to the room and its front towards the alcove. The ports face the window and stay open to the air (v13: no screen, so nothing traps the exhaust); from the sofa you look at the glass side, not the ports. The pad dock sits beyond the case.</li>
<li><b>Cables:</b> through a brush grommet at the shelf's back corner straight into a 25 mm conduit chased into the side wall (it's solid, as you confirmed), down to skirting height and behind the skirting to the base's plinth; you chase it yourselves in step 3, with a second, smaller conduit beside it for the PC's mains lead, then it's filled and painted, so nothing shows. A draw wire left in it pulls the next lead through. The HDMI is an active optical cable (about 5 m), "source" end at the PC.</li>
<li><b>Power:</b> the PC plugs into the 10-gang behind the TV: its lead (a 5 m C13 lead with a rewireable plug, fed down bare and the plug fitted at the bottom) runs in its own 25 mm conduit beside the data one. The 10-gang's load check, with the PC, is in section 9. No new socket.</li>
<li><b>Keyboard tray (back from v6.1):</b> the shelf sits on a 7 cm oak housing with a tray on 300 mm light-duty runners that rolls 25 cm out towards the room. It holds a full-size wireless keyboard and mouse: pull it out, lift the keyboard onto your lap, park it again. The housing stops 12 cm short of the sofa end so the cables drop past it; its underside is {n(g.PC_SHELF_TOP - g.PC_SHELF_T - g.KB_TRAY["h"])}, {n(g.PC_SHELF_TOP - g.PC_SHELF_T - g.KB_TRAY["h"] - g.SOFA_H)} above the sofa's back.</li>
<li><b>Headroom:</b> the shelf's underside is at {n(g.PC_SHELF_TOP - g.PC_SHELF_T)}, and it covers only the 28 cm of the sofa nearest the wall.</li>
</ul>
<div class="why"><b>The PC end, looked over again (v17)</b>
<ul>
<li><b>Air:</b> a mid-tower draws in at the front (towards the alcove) and blows out at the back and top. Both stay open: the case's top is at {n(g.PC_SHELF_TOP + g.PC_CASE[1])}, {n(g.CEIL - g.PC_SHELF_TOP - g.PC_CASE[1])} clear of the ceiling; a magnetic dust filter on the top exhaust keeps the dust out while it's off.</li>
<li><b>Reach from the sofa:</b> the PC's own power button is on its top, behind your head. A remote power button (a small card on the motherboard's power pins and a push button under the wrap ledge by the sofa end) starts it from the seat, and a powered USB 3 hub under the run's front edge puts pads, the keyboard's dongle and a stick within reach.</li>
<li><b>Lit, and seen:</b> the glass side faces the room, so its fans and lights read as part of the wall at night (the 3D view's "PC lit" button shows it). Keep its lights on a slow single colour if they pull the eye from the TV.</li>
<li><b>Leads:</b> labelled at both ends (step 13), all three down the chased conduits; nothing hangs below the shelf.</li>
</ul></div>

<h2 class="pb">7 · The oak joinery</h2>
<p>Above the worktop the wall is furniture rather than cladding: two solid oak uprights, shelves carried on joints you can see, and the pale mint wall showing between them.</p>
<ul>
<li><b>Uprights:</b> solid oak, 4.5 × 30 cm, {n(g.UPRIGHT_LEN)} cm long, each on two 10 mm dowels into the worktop, scribed to the ceiling and held to the back wall with concealed brackets; the left one also screws to the side wall.</li>
<li><b>Wedged through-tenons:</b> the Series X shelf (top {n(g.RZ_SHELF_TOP)}) passes through the left upright on two tenons, 6 cm wide and 2.4 thick, 12 and 20 cm from the wall. They're wedged and planed flush: standing proud, they'd touch the TV.</li>
<li><b>Housed and pegged:</b> the high shelf (two lengths, top 196) and the record ledge (top 155.4) are housed 1.2 cm into the uprights and pinned with 10 mm oak pegs, which show as dark dots.</li>
<li><b>LED grooves:</b> a routed groove on each upright's inner face holds a smart colour strip (v16) that washes the wall either side of the TV: warm white day to day, any colour for a scene.</li>
<li><b>Hidden cables:</b> a 2 × 1.5 cm groove down the back of the left upright carries the Series X's HDMI and power and the vinyl lead; the same groove in the right upright carries Deco B's 12 V lead and patch lead.</li>
<li><b>Finish:</b> hardwax oil throughout; lightly limed or smoked oak avoids the bright orange "new oak" look.</li>
</ul>
<figure>{joints()}</figure>
<h3>Joinery cut list</h3>
<table class="tight"><tr><th>Part</th><th>Material</th><th>Finished size (cm)</th><th>Joints</th><th>Qty</th></tr>
<tr><td>Uprights</td><td>Solid oak, quarter-sawn if you can</td><td>{n(g.UPRIGHT_LEN)} × 30 × 4.5 (buy 165 and scribe)</td><td>Housings for the high shelf and ledge; mortises for the Series X shelf in the right one; LED groove inside; cable groove at the back of the right one</td><td>2</td></tr>
<tr><td>High shelf</td><td>Solid oak</td><td>128.9 × 30 × 4 and 51.7 × 30 × 4</td><td>Housed 1.2 into the uprights, pegged; the short length on a cleat on the side wall</td><td>2</td></tr>
<tr><td>Record ledge</td><td>Solid oak</td><td>128.9 × 7 × 2.4; lip 0.9 × 1.5</td><td>Housed and pegged</td><td>1</td></tr>
<tr><td>Series X shelf</td><td>Solid oak</td><td>55 × 30 × 4 ({n(g.RZ_W)} + 4.5 through)</td><td>Two through-tenons 6 × 2.4, wedged flush; cleat on the reveal</td><td>1</td></tr>
<tr><td>Side-wall run (v15)</td><td>Solid oak, one 225 × 30 × 4 board</td><td>{n(g.SIDE_RUN_Z[0] - g.SIDE_RUN_Z[1])} long, 7 deep sweeping to {n(g.PC_SHELF_D)}, {n(g.SIDE_RUN_T)} thick; lip 0.9 × 1.5 along the 7 cm part</td><td>Cleat, two concealed brackets under the PC end; LED groove under the front edge</td><td>1</td></tr>
<tr><td>Worktop</td><td>One solid oak worktop, 300 × 62</td><td>{n(g.ALC_W)} × {n(g.BASE_D)} × 3</td><td>Chamfered front; cut edges sealed; keep the offcut</td><td>1 board</td></tr>
<tr><td>Face frame</td><td>Oak, 20 mm</td><td>186 × 73, stiles about 5 wide</td><td>Glued and pinned; end stiles scribed</td><td>1 set</td></tr>
<tr><td>Wedges · pegs · dowels</td><td>Oak · 10 mm oak dowel</td><td>6 × 3, tapering · 5 long</td><td>Glued</td><td>2 + spares · 6 · 8</td></tr>
<tr><td>Keyboard tray</td><td>Oak housing sides 7 × 2, ply tray, oak lip</td><td>70 × 28 × 7; tray 54 × 26</td><td>Housing screwed under the shelf; 300 mm runners</td><td>1</td></tr>
</table>

<h2 class="pb">8 · Paint and light</h2>
<h3>Paint: your pale mint, #dbffc8</h3>
<p>Your own colour (v51, from your saved plan), colour-drenched: walls, ceiling, alcove, chimney breast, skirting and the radiator. The door and its frame stay white (v20). No named paint matches it: B&amp;Q mixes it in Valspar<sup>{fit.ORDER.index("valspar") + 1}</sup>. Get a sample pot first: a colour picked on a screen often comes out brighter on a wall, so ask for it a shade softer if the board looks too green.</p>
<figure>{img("paint_grid.png", "The artisan oak render in four greens")}
<figcaption>Your pale mint (chosen) beside Card Room Green (the plan until v50), Sage Green and Treron.</figcaption></figure>
<ul>
<li><b>Finishes:</b> Valspar V700 Premium Blend matt on walls, ceiling, alcove and breast; V700 Interior Wood &amp; Metal eggshell in the same colour on skirting and radiator (the door stays white).</li>
<li><b>Order:</b> paint before anything is fixed, so nothing needs cutting in round the uprights, shelves or the dining wall.</li>
</ul>
{paint_table()}
<h3>Skirting: the pale mint too</h3>
<figure>{img("skirting_options.png", "Three skirting options")}</figure>
<p>Recommended: the pale mint in eggshell, which completes the drench. Darker option: Green Smoke. Over the white gloss: wash, key, woodwork primer, two coats of eggshell.</p>
<h3>Light, in three warm layers</h3>
<ul>
<li><b>The LED strip on the ceiling</b> (as now): round the room's edge, into the alcove and across the breast; 2700K on a dimmer.</li>
<li><b>Built into the oak (v16: smart colour):</b> an RGB and tunable-white strip in each upright's groove and one under the side-wall run's front edge<sup>{fit.ORDER.index("strips") + 1}</sup>, in the same app as the bars' bulbs, so each scene sets them too; on their plug-in power on the 10-gang (no fused spur). The 6500K bias light on the back of the TV stays plain white: it's there for the picture, not the mood.</li>
<li><b>Your red lamp:</b> the three-headed floor lamp you have, its colour bulbs green at the top, pink in the middle and purple at the bottom. The room needs a low layer as well as the light from above; it's also the one to leave on for a film. It can stand in any of the three spots in the 3D room.</li>
<li><b>Two spot bars</b> in the style of Dunelm's Wolston (£49 each; 84 × 16 cm, 22.4 cm drop; 4 × E14, 6 W max<sup>{fit.ORDER.index("wolston") + 1}</sup>) on your two existing ceiling points, <b>both running from the TV towards the window</b> (v15). Bar 1 hangs on the rose straight out from the TV unit, halfway to the sofa; bar 2 on the pendant point by the stairs, along the west wall, so its end no longer comes near that wall. <b>Smart colour bulbs</b> (v15): eight E14 bulbs under the bar's 6 W, the WiZ Colour P45 (4.9 W, 4.5 × 10.1 cm) or, if it shows below a shade, the shorter Philips Hue lustre (5.1 W, 4.5 × 7.7 cm)<sup>{fit.ORDER.index("e14") + 1}</sup>. Smart bulbs need full power, so <b>no dimmers</b>: the wall switches stay as they are and stay on; level and colour come from the app (or an optional smart button). <b>Turn them as you like:</b> each bar turns on its rose and clears every wall at any angle (bar 2 by {n(__import__("clash").wall_room(G.BAR2_X, G.BAR2_Z) - G.BAR[0] / 2 - 7.5)} cm), and each head aims on its own; tap a bar or the red lamp in the 3D room to try it. </li>
</ul>
<p><b>Where the heads point (v17):</b> all eight heads straight down, evenly spread along each bar, so their pools overlap into one even light over the room: that's the <b>Bright</b> preset. Tilt a head only if its pool lands badly (in the TV's screen from the sofa, or in someone's eyes). Set the bulbs to warm white (3000K) for Bright, 2700K for Cosy, and save colours for the presets you want them in.</p>
<h3>Four lighting presets</h3>
<p>Four presets: <b>Evening</b> (the default: every light on and balanced), <b>Bright</b>, <b>Cosy</b> and <b>Film</b>, set on the strip's controller, the uprights' dimmer and the bulbs' app; save them as scenes there. In the 3D room, Lights has the four tiles, Brightness, Warmth and each light's slider.</p>
{scenes_html()}

<h2 class="pb">9 · Power, cables and network</h2>
<h3>Power</h3>
<figure>{power()}</figure>
<ul>
<li><b>The socket:</b> the single on the side wall just in front of the records bay, about 30 cm up, becomes a double at the same spot. The left outlet feeds the 10-gang; the right one feeds the retro 6-way, so its own switch is now the retro switch. The 10-gang's switches sit behind the TV, where you can't reach them any more.</li>
<li><b>10-gang:</b> lying flat on the worktop behind the TV, both sides left on: TV, soundbar, sub, Series X, USB charger, Deco B, Switch 2, the deck, the preamp and now the PC. With everything running that's about 1.55 kW (the PC's 850 W at most), under the strip's 13 A (3 kW).</li>
<li><b>Retro 6-way:</b> in the channel behind bay 1 (bay 2's back is the sub's port): Xbox One, Xbox 360, PS3, PS2, PS1, RetroTINK.</li>
<li><b>OLED care:</b> leave the TV in standby so it runs its pixel refresh.</li>
</ul>
<h4>Socket by socket</h4>
<table class="tight"><tr><th>Socket</th><th>Feeds</th><th>On or off</th></tr>
<tr><td>Side wall, double, left outlet</td><td>The 10-gang behind the TV: TV, soundbar, sub, Series X, USB charger (fan stand, pad dock, bias light, HDMI switch), Deco B, Switch 2, the turntable, the preamp, the PC and the uprights' LED driver</td><td>Always on: about 1.55 kW with everything running, PC included</td></tr>
<tr><td>Side wall, double, right outlet</td><td>The retro 6-way in the channel: Xbox One, Xbox 360, PS3, PS2, PS1, the RetroTINK's USB plug</td><td>The wall switch is the retro switch: off between sessions; up to about 0.8 kW with a launch PS3</td></tr>
<tr><td>Behind the sofa's short side, double (yours, v23)</td><td>The rear speakers; a spare outlet for a phone charger or a lamp by the sofa</td><td>On</td></tr>
<tr><td>Window wall behind the plant stand, double (yours, v23)</td><td>Your red lamp and the plant stand's grow lights: both within reach of it, layout A</td><td>On; the grow lights on a plug-in timer</td></tr>
<tr><td>Ceiling points 1 and 2</td><td>The two spot bars, with smart colour bulbs (v15)</td><td>Switches left on; level and colour from the app</td></tr>
</table>
<p class="note">One strip per outlet, never one plugged into another, and each under its 13 A (3 kW) limit: about 1.55 kW on the 10-gang and up to 0.8 kW on the retro 6-way, about 10 A together.</p>
<h3>Electrics: your own job</h3>
<p>You're doing the electrics yourselves. In England, Part P of the Building Regulations decides what needs an electrician or building control.</p>
<ul>
<li><b>Notifiable (not for you):</b> a new circuit, a replacement consumer unit, or any change to a circuit round a bath or shower.</li>
<li><b>Not notifiable (yours):</b> the socket swapped for a double, and the two spot bars in place of the old fittings. Like for like, so no electrician and no building control.</li>
<li><b>Still to the wiring regulations</b> (BS 7671), every time.</li>
<li><b>The light switches stay:</b> the bars' smart bulbs need full power, so there are no dimmers to fit.</li>
<li><b>Not mains work at all:</b> the Cat6 and the conduits.</li>
</ul>
<div class="callout"><b>The safe routine, every time</b><ol>
<li><b>Isolate:</b> switch off that circuit's breaker at the consumer unit (the lighting circuit for the bars, the socket circuit for the socket). If the labels aren't clear, switch off the main switch.</li>
<li><b>Lock off:</b> fit the MCB lock-off and padlock, keep the key in your pocket, and tape a note on the board.</li>
<li><b>Prove dead:</b> check the tester lights on its proving unit, test between every pair of terminals (live–neutral, live–earth, neutral–earth), then check the tester on the proving unit again.</li>
<li><b>Photograph</b> the wiring before you disconnect anything, and connect the new one wire for wire: brown (or red) to L, blue (or black) to N, green-and-yellow to earth, sleeved, no copper showing, every screw tight.</li>
<li><b>Test:</b> power back on, then the socket tester in both outlets; each bar's four bulbs come on and join the app.</li></ol></div>
<div class="callout"><b>Stop and call an electrician if…</b><ul>
<li>the tester shows anything live after you've isolated;</li>
<li>the wiring is old (rubber or fabric sheath, or red and black with no earth), or there's no earth at a ceiling point (the spot bars need one);</li>
<li>there are more wires than you can match to your photo (two-way switching, a loop in a ceiling rose you can't follow), or scorch marks, or a loose, hot or crumbling fitting;</li>
<li>the consumer unit has rewireable fuses or no RCD;</li>
<li>a job grows into a new circuit, consumer unit work, or anything by the bath or shower.</li></ul></div>
<h3>Cable routes</h3>
<figure>{routes()}</figure>
<ul>
<li><b>The channel:</b> 4 cm behind the frames, flat two-compartment trunking: mains on one side, HDMI, Cat6 and audio on the other. Switch 2 and the retro 6-way stand on edge in it.</li>
<li><b>The grooves behind the uprights:</b> the left one takes the Series X's HDMI and power and the vinyl lead, the right one Deco B's 12 V and patch leads, down to the worktop's slot.</li>
<li><b>The PC:</b> through the shelf's brush grommet into two conduits chased into the side wall (the HDMI and Cat6 in a 38 mm one, its mains lead in a 25 mm one), behind the skirting and into the plinth notch; the mains lead goes on to the 10-gang.</li>
<li><b>The sub:</b> its mains lead from the 10-gang drops through the slot behind the TV to the back of bay 2, about 1 m. Keep the channel behind the sub clear: its port needs the air.</li>
<li><b>Airflow:</b> console bays stay open-backed; the Series X has 15 cm each side and 21 above.</li>
</ul>
{wiring_html()}
<h3>Network</h3>
<figure>{network()}</figure>
<ul>
<li><b>Bedroom 3:</b> the Hub 5 (in modem mode), Deco A and Switch 1 sit together with the gaming PCs. Switch 1's eight ports: the uplink, two PCs, the two Cat6 runs down to Deco B and Deco C, and, if you want them, the projector in the master and the music room in bedroom 2.</li>
<li><b>The route down:</b> across the landing to the airing cupboard, which sits over the alcove's corner, and down through its floor. Run 1 comes through the living room ceiling in the alcove's right corner to Deco B; run 2 follows the right upright's groove down and through the floor to the kitchen, where Deco C goes on the outside of the brick cupboard, up high.</li>
<li><b>Sloped ceilings:</b> bedroom 2 and the bathroom slope down to the back wall; keep any Deco or desk in bedroom 2 on the high side.</li>
</ul>
<h4>What each part does</h4>
<table class="tight"><tr><th>Part</th><th>Where</th><th>Job</th><th>Why it's needed</th></tr>
<tr><td>Virgin Hub 5, in modem mode</td><td>Bedroom 3</td><td>Brings the internet in, nothing else</td><td>Two routers fighting (double NAT) breaks Xbox online play; its Wi-Fi switches off</td></tr>
<tr><td>Deco A (main)</td><td>Bedroom 3</td><td>The router: Wi-Fi, parental controls, HomeShield</td><td>HomeShield and parental controls only work when the Deco is the router</td></tr>
<tr><td>Switch 1, 8-port</td><td>Bedroom 3</td><td>Turns Deco A's spare port into seven</td><td>The two PCs, both Cat6 runs down, and the optional projector and music-room runs</td></tr>
<tr><td>Deco B</td><td>Living room, high shelf at {n(g.HIGH_TOP)}</td><td>Wi-Fi for the living room, and the wired point for the wall</td><td>Fixes the living room's weak 5 GHz side</td></tr>
<tr><td>Switch 2, 8-port</td><td>Standing on edge in the channel behind the base</td><td>Turns Deco B's spare port into seven</td><td>The Series X, Xbox One, Xbox 360, PS3, PC and TV each get a cable, one port spare</td></tr>
<tr><td>Deco C</td><td>Kitchen, high on the outside of the brick cupboard</td><td>Wi-Fi for the kitchen</td><td>The kitchen gets poor signal on every band today</td></tr>
<tr><td>Cat6 runs 1 and 2</td><td>Bedroom 3 → airing cupboard → alcove corner, and on to the kitchen</td><td>The wired link between Decos ("Ethernet backhaul")</td><td>Without it the Decos relay each other over the 5 GHz band the phones use, losing speed at each hop</td></tr>
</table>
<h4>Stage 1: the mesh up today, before any cables</h4>
<ol>
<li>Unplug everything from the hub. Log in at 192.168.0.1 with the password on its base, then Modem Mode → Enable Modem Mode → Apply. Its settings page moves to 192.168.100.1.</li>
<li>Connect a hub port to Deco A and set it up in the Deco app, reusing the old Wi-Fi name and password. If it shows no internet, try another port and restart the hub.</li>
<li>Plug Switch 1 into Deco A's other port, then the PCs into Switch 1.</li>
<li>Add Deco B in the living room and Deco C in the kitchen. For now they link over Wi-Fi.</li>
<li>Check the Xbox's network settings show NAT: Open.</li>
</ol>
<h4>Stage 2: after your Cat6 runs (step 3)</h4>
<ol>
<li>Plug run 1 into Deco B's free port (Switch 2 stays in the other) and run 2 into Deco C.</li>
<li>In the Deco app, check Deco B and Deco C show as "Ethernet".</li>
<li>Plug the Series X, Xbox One, Xbox 360, PS3, PC and TV into Switch 2.</li>
<li>Under QoS, give the Series X and the PC high priority; turn on guest Wi-Fi and automatic firmware.</li>
</ol>
<div class="callout"><b>Cabling rules</b><ul>
<li>Solid pure-copper Cat6, round; not CCA or flat cable for the long runs. Measure the real route and add 2–3 m.</li>
<li>Cross mains at right angles; never staple through a cable; no kinks; label both ends. Never two cables between the same two devices.</li>
<li><b>Done when:</b> Deco B and C show "Ethernet", each PC shows 1.0 Gbps, the Xbox shows NAT: Open, and phones hold a strong signal in the kitchen and across the living room.</li></ul></div>
<h3>AV: everything sounds through the Hisense</h3>
<figure>{av()}</figure>
<table class="tight"><tr><th>Source</th><th>Picture</th><th>Sound</th></tr>
<tr><td>PC · Xbox Series X</td><td>TV HDMI 1 · HDMI 3</td><td>Via the TV over eARC (5.1 or Atmos)</td></tr>
<tr><td>Xbox One, Xbox 360, PS3</td><td>HDMI switch → TV HDMI 4</td><td>Via the TV over eARC, 5.1</td></tr>
<tr><td>PS2</td><td>Component → RetroTINK → switch → TV</td><td>Optical straight to the soundbar</td></tr>
<tr><td>PS1</td><td>RGB SCART → RetroTINK → switch → TV</td><td>Stereo through the RetroTINK and eARC</td></tr>
<tr><td>Turntable · phone</td><td>—</td><td>Preamp → AUX · Bluetooth</td></tr>
</table>
<p>TV settings: rename the inputs (HDMI 4 "Retro"), Deep Colour on HDMI 1, 3 and 4, Game Optimiser on the console inputs, sound out to HDMI eARC. RetroTINK-6X CE: a 5 V 2 A USB plug on the retro 6-way; the PS2's Component Video Out set to Y Cb/Pb Cr/Pr; RGB SCART for the PS1.</p>
<h3>Sound layout</h3>
<figure>{sound()}</figure>
<ul>
<li><b>Sub:</b> wireless, in bay 2 under the TV, its driver facing the room and its rear port {n(g.SUB_PORT_GAP)} cm from the wall through the open back (15–30 is advised<sup>{fit.ORDER.index("subport") + 1}</sup>). Next to the soundbar, its bass blends with the bar instead of coming from behind you, and it's off the floor where feet and drinks are. If the bass booms, turn it down rather than moving it.</li>
<li><b>Rears:</b> the soundbar's own two rears, on slim floor stands directly behind the sofa (v27.1, from your photos): one at each end of its long side, in the {n(g.SOFA_BACK_Z - g.WINDOW_Z)} cm gap between the sofa's back and the window wall, the <b>left</b> one in the corner and the <b>right</b> one at the window end, where the curtains hang in the same gap: closed, they fall over it and muffle it, so keep that end open when you watch. Both speakers sit just above the sofa's back, at about seated ear height ({n(g.REAR_STAND['top'])}–{n(g.REAR_STAND['top'] + g.REAR_SPK[1])}), facing the room. They're linked by a cable along the skirting behind the sofa and powered from your double socket behind the sofa's short side. In the 3D room they move in Edit room.</li>
</ul>

<h2 class="pb">10 · Build guide, for a first-time builder</h2>
<p>Every step in full, the tools, the techniques, the cutting list and the nested sheets are in the Build Guide (its own PDF, and Build on the plan page). Here: what to buy first, the order of work and the wiring.</p>
{buy_first_html()}
<h3>The order of work</h3>
{steps_table_html()}
{wiring_html()}

<h2 class="pb">11 · Buy list and tracker</h2>
<p>Every purchase and job, in build order, comes to about £{money(tl, th)}, with no electrician on top: the electrics are your own job, and the tools for them are on the list. Each phase carries its part's coloured label. Estimates are approximate UK prices; changed and new items are marked. Tick items off and write in what you paid.</p>
<h3>Cost overview: each piece and what to buy for it</h3>
{cost_overview_html()}
<h3>By phase</h3>
<table class="tight"><tr><th>Phase</th><th>Estimate (£)</th><th>Biggest item</th></tr>{ptot}</table>
<p class="note">Already owned: Virgin Hub 5, three Deco X1500s, two TL-SG105S switches (both become spares), LG OLED C6 55" and its stand, a 10-gang, the Hisense AX5100G 5.1 soundbar, the Series X fan stand, the turntable, the L-sofa and all the consoles.</p>
<p>The full tracker, row by row with a box for what you paid, is the Build Guide's shopping list (and Buy on the plan page).</p>

<h2 class="pb">12 · Other options and sources</h2>
{other_options_html()}
<h3>Sources</h3>
<p class="note">Numbered sources are the item sizes used in the fit proof (section 3).</p>
{fit.sources_html(OTHER_SOURCES)}
</body></html>"""
    if not deck:
        html = concise(html)
    DECK = False
    html = tidy.strip_versions(html).replace("<!--keep-->", "").replace("<!--/keep-->", "")   # v24: no round markers in the text
    return html, tl, th, c, css


# v42 (client: "optimise PDFs in there to be more concise for what I need"): the plan PDF drops what the build guide now carries (how
# each thing's built, the cut lists, the wiring, the order of work) and the long reference pages; the plan page keeps them all
PDF_DROP = ("Measuring sheet", "Console sizes", "The drawer layouts", "The game drawer", "How bay 3 works", "Storage options, to scale",
            "How it's built", "Joinery cut list", "Four lighting presets", "Cable routes", "The wiring plan", "Sound layout",
            "Buy and adapt first", "The order of work", "By phase",
            "Electrics: your own job", "The sub in the media wall", "What it costs, piece by piece")   # v44: section 11 has the costs by piece; the guide's chapter B has the electrics; the sub's detail is on the page
PDF_DROP4 = ("What each part does", "Stage 1", "Stage 2", "Socket by socket")   # v44: the network set-up and the sockets are the guide's chapters A and B
PDF_BREAK = ("2 · ", "3 · ", "5 · ", "9 · ", "11 · ")   # v44: a new page only for these; the rest follow on


def concise(html):
    import re, chapters
    def drop(m):
        title = re.sub(r"<[^>]+>", "", m.group(2))
        return "" if title.startswith(PDF_DROP) else m.group(0)
    html = re.sub(r"(<h3[^>]*>(.*?)</h3>.*?)(?=<h[23][ >]|</body>)", drop, html, flags=re.S)
    html = re.sub(r"(<h4[^>]*>(.*?)</h4>.*?)(?=<h[234][ >]|</body>)", lambda m: "" if re.sub(r"<[^>]+>", "", m.group(2)).startswith(PDF_DROP4) else m.group(0), html, flags=re.S)
    html = re.sub(r'<div class="why"><b>[^<]*looked over again.*?</ul></div>', "", html, flags=re.S)   # v44: reviews, on the page
    html = re.sub(r'<h2 class="pb">(?!(?:' + "|".join(map(re.escape, PDF_BREAK)) + '))', "<h2>", html)
    html = re.sub(r"<!--fit-->.*?<!--/fit-->", lambda m: fit.summary_html(), html, flags=re.S)
    html = re.sub(r"(<h2 class=\"pb\">10 · [^<]*</h2>).*?(?=<h2)", lambda m: m.group(1) + "<p>Everything to build is in the <b>Build Guide</b> (its own PDF): "
                  "each piece of the room by place, with what to check, buy, cut and build; any order.</p>" + build_contents(), html, count=1, flags=re.S)
    import re as _re
    secs = _re.findall(r'<h2[^>]*>(\d+) · ([^<]+)</h2>', html)
    html = _re.sub(r'<h2([^>]*)>(\d+) · ([^<]+)</h2>', lambda m: f'<h2{m.group(1)} id="sec-{m.group(2)}">{m.group(2)} · {m.group(3)}</h2>', html)
    toc = ("<nav class='toc'><b>Contents</b><ol>" + "".join(f"<li><a href='#sec-{n}'>{t}</a></li>" for n, t in secs) + "</ol></nav>")
    return html.replace("<h2", toc + "<h2", 1)


def build_contents():
    import pieces as P
    rows = []
    for pid, name, ps in P.by_place():
        rows.append(f"<tr class='ph'><td colspan='3'>{name}</td></tr>")
        num = {p["key"]: c for c, p in P.numbered()}
        rows += [f"<tr><td class='num'>{num[p['key']]}</td><td>{p['title']}</td><td>{p['time']}</td></tr>" for p in ps]
    return f"<table class='tight'><tr><th class='num'>No.</th><th>In the guide, by place</th><th>Time</th></tr>{''.join(rows)}</table>"


def plan_sections():
    """The plan split at its h2s, for the plan page: {"pre": the title block, "1".."12", "appendix": html}."""
    import re
    html = _plan(deck=True)[0]
    body = html.split("<body>", 1)[1].rsplit("</body>", 1)[0]
    parts = re.split(r'(?=<h2[ >])', body)
    out = {"pre": parts[0]}
    for part in parts[1:]:
        m = re.match(r'<h2[^>]*>(\d+|Appendix) · ([^<]+)</h2>', part)
        key = ("earlier" if m.group(2).startswith("Earlier") else "ideas" if m.group(2).startswith("Ideas") else m.group(1).lower()) if m else "x"
        out[key] = part[m.end():] if m else part
    return out


def build():
    html, tl, th, c, css = _plan()
    (HERE / "plan.html").write_text(html)
    import chapters                       # v42: one chapter per thing you make (buy, cut, build), then the jobs
    guide = f"""<!doctype html><html><head><meta charset="utf-8"><title>Build Guide</title><style>{css}</style></head><body class="guide">
<h1>Media Wall &amp; Dining Wall: Build Guide</h1>
<p class="byline">{LABEL} · for Emma and Dave · sizes in cm</p>
<figure class="render small">{img("render_v13_join_clean.png", "The finished wall")}</figure>
{__import__("pieces").guide_html(money)}
</body></html>"""
    (HERE / "guide.html").write_text(tidy.strip_versions(guide))
    print("totals", tl, th, "fit", c)


PHONE_CSS = """
/* v46: the phone edition: a narrow page, bigger type, one column */
body { font-size: 11pt; line-height: 1.5; }
h1 { font-size: 22pt; } h2 { font-size: 18pt; } h3 { font-size: 13pt; } h3.piece { font-size: 17pt; }
table { font-size: 9pt; } table.tight td, table.tight th { padding: 3pt 4pt; }
figure.render.small img, figure.render img, figure.small img, figure.joinery img, .guide figure.render.chap img { width: 100% !important; }
figure.small figcaption, figure.joinery figcaption { width: 100%; }
.need { grid-template-columns: 1fr; }
.guide figure.cutfig.half { display: block; width: 100%; margin: 4pt 0 8pt; }
.guide ol.order { columns: 1; }
.p1 figure.render img { width: 100%; }
nav.toc ol { columns: 1; }
"""


PHONE_CSS += """
table.tstack, table.tstack tbody, table.tstack tr { display: block; width: auto !important; }
table.tstack tr.hdr, table.tstack thead { display: none; }
table.tstack tr { padding: 4pt 0; border-bottom: 1px solid #e6e3dc; break-inside: avoid; }
table.tstack td, table.tstack tr > th { width: auto !important; max-width: none !important; min-width: 0 !important; height: auto !important; display: block; position: relative; padding: 1pt 0 1pt 36% !important; border: 0 !important; background: none !important; text-align: left !important; white-space: normal !important; }
table.tstack td::before, table.tstack tr > th::before { content: attr(data-label); position: absolute; left: 0; top: 1pt; width: 33%; font-size: 7.5pt; letter-spacing: .04em; text-transform: uppercase; color: #6b6862; font-weight: 400; }
table.tstack td:not([data-label]), table.tstack td[data-label=""] { padding-left: 0 !important; }
table.tstack tr.sec td, table.tstack tr.ph td { padding-left: 0 !important; font-weight: 650; }
"""
PHONE_LABEL_JS = """() => document.querySelectorAll("table:not(.contents)").forEach(t => {
  const rows = [...t.rows], hdr = rows.find(r => r.cells.length && [...r.cells].every(c => c.tagName === "TH")); if (!hdr) return;
  const names = []; [...hdr.cells].forEach(c => { for (let i = 0; i < (c.colSpan || 1); i++) names.push(c.textContent.trim()); });
  if (names.length < 4) return;
  hdr.classList.add("hdr"); t.classList.add("tstack");
  rows.forEach(r => { if (r === hdr) return; let i = 0;
    if (r.cells.length === 1 && (r.cells[0].colSpan || 1) >= names.length - 1) { r.classList.add("sec"); return; }
    [...r.cells].forEach(c => { if (names[i]) c.dataset.label = names[i]; i += c.colSpan || 1; }); }); })"""


def pdf():
    from playwright.sync_api import sync_playwright
    from shot import _launch
    def footer(name):
        return ('<div style="width:100%;font-family:Inter,sans-serif;font-size:8px;color:#8a867e;padding:0 18mm;'
                f'display:flex;justify-content:space-between"><span>{name} · {LABEL}</span>'
                '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>')
    def foot_phone(name):
        return ('<div style="width:100%;font-family:Inter,sans-serif;font-size:7px;color:#8a867e;padding:0 6mm;'
                f'display:flex;justify-content:space-between"><span>{name}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>')
    with sync_playwright() as p:
        b = _launch(p)
        for src, out, name in (("plan.html", PDF_NAME, "Home Network &amp; Media Wall Plan"), ("guide.html", GUIDE_NAME, "Build Guide")):
            pg = b.new_page()
            pg.goto((HERE / src).resolve().as_uri())
            pg.wait_for_timeout(500)
            pg.pdf(path=str(HERE.parent / "out" / out), format="A4", print_background=True, outline=True, tagged=True,
                   margin={"top": "16mm", "bottom": "18mm", "left": "18mm", "right": "18mm"},
                   display_header_footer=True, header_template="<div></div>", footer_template=footer(name))
            # v46, client: "more optimised for viewing in mobile and pc": the same document on a phone-shaped page
            pg.evaluate(PHONE_LABEL_JS)      # v46.1: a wide table becomes a card per row, each value under its column's name
            pg.add_style_tag(content="@page { size: 110mm 196mm; }" + PHONE_CSS)
            pg.wait_for_timeout(300)
            pg.pdf(path=str(HERE.parent / "out" / out.replace(".pdf", "_phone.pdf")), width="110mm", height="196mm", print_background=True, outline=True, tagged=True,
                   margin={"top": "7mm", "bottom": "9mm", "left": "6mm", "right": "6mm"},
                   display_header_footer=True, header_template="<div></div>", footer_template=foot_phone(name))
            pg.close()
        b.close()

if __name__ == "__main__":
    build()
    pdf()
    print("pdf ok")
