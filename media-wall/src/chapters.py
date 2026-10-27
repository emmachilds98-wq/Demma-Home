"""v42 (client, 23 Oct: "Each thing I'm making will need a buy list, clear image diagram with cuttings and clear build instructions"):
the build guide in one chapter per thing you make, each with the same four parts: the picture, Buy (that thing's rows of the buy list,
so the totals still match), Cut (every part drawn to scale with its letter and size, then the key) and Build (numbered steps, then the
check). The jobs (network, cables, paint, lighting, connecting up) get Buy and Build only. Everything comes from build_doc (the steps,
the buy list, the cutting list) and geometry, so a chapter moves when the plan does."""
import re
import geometry as G
import nest

n = lambda x: f"{x:.2f}".rstrip("0").rstrip(".")
K, BB, RT, DS = G.CAB, G.BAR_BUILT, G.RECORD_TABLE, G.DOOR_SHELF


def _case():
    import ideas
    return ideas.CASE


# (key, title, what it is, picture, [(step, sub-assembly headings or None for all)], buy rows (the start of their text), time, who)
MAKE = [
    ("base", "The media wall base", "The plinth, two BESTÅ frames and bay 3's carcass, with the drawers, the LP crates and the oak face frame.",
     "render_v13_drawers.png", [(6, None), (8, None)],
     ["Two IKEA BESTÅ 60×40×64 frames", "BESTÅ shelves, 56 × 36", "Plinth for bays 1–2", "Hidden plinth drawer", "Bay 3 carcass",
      "Two face-out LP crates", "Three slim drawers for the game column", "Game drawer kit", "The sub in bay 2", "Anti-tip brackets",
      "Oak face frame"], "2–3 days", "You"),
    ("worktop", "The oak worktop", "One solid oak worktop scribed to the alcove, over the base.",
     "render_v13_join_clean.png", [(7, None)], ["One solid oak worktop"], "½ day", "You + a helper"),
    ("uprights", "The oak uprights and shelves", "Two uprights to the ceiling, the high shelf, the Series X shelf, the record ledge and the “now playing” ledge.",
     "render_v13_join_key_scene.png", [(9, ["Cut the uprights", "The housings", "The through-mortises", "The tenons", "The grooves", "Dry-fit", "The “now playing”"])],
     ["Two solid oak uprights", "Solid oak for the shelves", "Oak wedges, 10 mm oak dowel", "The “now playing” ledge"], "2–3 days", "You + a helper"),
    ("sidewall", "The side-wall run and the PC shelf", "One oak run from the corner to the PC, the PC shelf and its keyboard tray.",
     "render_v13_side.png", [(10, None)],
     ["Keyboard tray for the PC shelf", "PC tidy kit", "A powered USB 3 hub", "A remote power button for the PC", "A magnetic mesh dust filter"],
     "1 day", "You"),
    ("cabinet", "The dining cabinet and table", "Two oak boxes under your shelf: the table folds into one, the six chairs live in the other.",
     "render_v99_3d_c_six.png", [(11, None)],
     ["The dining cabinet: oak-faced ply", "Solid oak for the table", "Oak for the cabinet's hinge rail", "Altro continuous piano hinge, 1800 × 50",
      "The doors' hinges and catches", "Folding, self-locking table-leg brackets", "Three Lee Valley 40574", "Folding chairs, six: your grey padded"],
     "3–4 days", "You + a helper"),
    ("bar", "The bar", "A cupboard scribed between the cabinet and the wall, an oak counter, the ENHET frame and mirror over it.",
     "render_v99_3d_beside_bar_open.png", [(14, ["The bar beside the cabinet"])],
     ["The bar beside the dining cabinet", "Over the bar"], "1 day", "You"),
    ("glasscase", "The glass case", "An oak frame on the chimney breast with three glass shelves and a lift-off glass front.",
     "render_v99_3d_glass_case.png", [(9, ["The glass display case"])],
     ["The glass display case's glass", "The glass display case's oak"], "½ day", "You"),
    ("recordtable", "The record table", "Two KALLAX on their backs on a ply base with castors, under a hinged oak lid.",
     "render_v99_3d_sg_recordtable.png", [(14, ["The record table"])], ["The record table"], "½ day", "You"),
    ("ctable", "The C-table", "An oak top over the sofa's open end, an upright and a foot weighed down by a steel plate.",
     "render_v99_3d_sg_cordlamp.png", [(14, ["The C-table"])], ["The C-table: a 400 × 200 × 6 mm steel plate"], "½ day", "You"),   # v44
    ("fitted", "Bought and fitted: shelves, cabinets, the door shelf", "The alcove shelves, the two wall cabinets and the shelf over the door with its boxes. Nothing to cut but the door shelf.",
     "render_v99_3d_sg_alcoveshelves.png", [(14, ["The wall cabinets", "The alcove shelves", "Over the hall door"])],
     ["Two IKEA EKET wall cabinets", "Two oak floating shelves 900 × 230", "An oak shelf over the hall door", "Two IKEA KUGGIS lidded boxes"],
     "1 day", "You + a helper"),
]

JOBS = [
    ("network", "The network", "The mesh up and the two switches, before any cables.", [(2, None)],
     ["TP-Link TL-SG108", "Cat6 patch leads"], "2 h"),
    ("cables", "Cables and the socket", "The Cat6 runs, the double socket and the PC's conduits: your own job, with the stop list.", [(3, None)],
     ["Cat6 solid pure copper", "Cat6 tools", "A double socket", "Electrical safety kit", "Insulated (VDE) screwdrivers",
      "Conduit: 38 mm and 25 mm oval", "For the chase"], "2–3 days"),
    ("paint", "Paint", "Your pale mint on the walls and the skirting.", [(4, None)], ["Your pale mint", "Woodwork primer"], "2–3 days"),
    ("lighting", "Lighting", "The two spot bars and the LED strips.", [(12, None)],
     ["Two Dunelm Elements Wolston", "Eight smart colour E14 bulbs", "Smart colour strips", "Optional: a smart button", "Later: aluminium channel"], "1 day"),
    ("connect", "Connect and finish", "The TV, the consoles, the sound and the turntable, wired and tidied.", [(13, None)],
     ["6-way surge-protected extension", "4-port USB charger", "USB plug, 5 V 2 A", "Cable kit", "Flat two-compartment trunking",
      "RetroTINK-6X CE upscaler", "5-in-1 4K60 HDMI switch", "Active optical HDMI cable", "High Speed HDMI leads", "PS2 component video cable",
      "Optical (TOSLINK) cable", "RGB SCART cable", "Replacement stylus", "External phono preamp", "RCA-to-3.5 mm lead", "Isolation feet for the turntable"],
     "1 day"),
]


# the drawings each chapter shows (the step's full set is in the plan)
CH_DRAW = {6: ["section"], 8: ["game_drawer", "drawer"], 7: [], 9: ["joints"], 10: ["pc_shelf"], 11: ["cab_carcass", "cab_section"],
           2: ["network"], 3: ["power"], 12: [], 13: ["av"], 1: [], 5: ["front"], 4: []}


def _plain(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


def _short(s):
    """A buy row's text without its history: "(new…)", "(changed…)" and "(v16…)" asides."""
    return re.sub(r"\s*\((?:new|changed|v\d)[^)]*\)", "", s).strip()


def _where(t):
    for key, shop in (("IKEA", "IKEA"), ("Wayfair", "Wayfair"), ("Dunelm", "Dunelm"), ("B&Q", "B&Q"), ("Lee Valley", "Lee Valley"),
                      ("Screwfix", "Screwfix"), ("Altro", "Online (Altro)"), ("Farrow", "Farrow & Ball"), ("toughened", "A glass cutter"),
                      ("RetroTINK", "Online"), ("oak", "Timber merchant"), ("ply", "Timber merchant")):
        if key.lower() in t.lower():
            return shop
    return "DIY shop or online"


def buy_rows(prefixes):
    """[(qty, short name, full text, lo, hi, where)] for the buy list's rows that start with one of prefixes, in buy-list order."""
    import build_doc as B, costs
    short = {s[1]: s for s in costs.SHORT}
    out = []
    for st, item, _ph, q, lo, hi in B.TRACK:
        t = _plain(item)
        if st != "To buy" or not any(t.startswith(p) for p in prefixes):
            continue
        s = next((v for k, v in short.items() if t.startswith(k)), None)
        out.append((s[2] if s else (q or "1"), s[3] if s else re.split(r"[:;(]", t)[0], _short(t), lo or 0, hi or 0, _where(t)))
    return out


def all_buy_prefixes():
    return [p for c in MAKE for p in c[5]] + [p for j in JOBS for p in j[4]]


def buy_html(rows, money):
    if not rows:
        return "<p class='note'>Nothing to buy.</p>"
    lo, hi = sum(r[3] for r in rows), sum(r[4] for r in rows)
    tr = "".join(f"<tr><td class='num'>{q}</td><td><b>{nm}</b><br><span class='note'>{full}</span></td><td>{w}</td><td class='num'>{money(a, b)}</td></tr>"
                 for q, nm, full, a, b, w in rows)
    return (f"<table class='tight buy'><colgroup><col style='width:8%'><col style='width:62%'><col style='width:15%'><col style='width:15%'></colgroup><tr><th class='num'>Qty</th><th>What</th><th>Where</th><th class='num'>£</th></tr>{tr}"
            f"<tr class='tot'><td></td><td><b>Total</b></td><td></td><td class='num'><b>{money(lo, hi)}</b></td></tr></table>")


# ---------- Cut: the parts of each thing, from the cutting list, plus the few cut from offcuts the list doesn't carry
def _project_of(row):
    import build_doc as B
    name, where = row[0], row[4]
    m = {"The bar": "bar", "Glass case": "glasscase", "Record table": "recordtable", "Dining table": "cabinet", "C-table": "ctable"}
    if where in m:
        return m[where]
    if where == "Media wall":
        step = next((v for pre, v in B.CUT_STEP.items() if name.startswith(pre)), 8)
        return {6: "base", 7: "worktop", 8: "base", 9: "uprights", 10: "sidewall"}.get(step)
    return None


def _extra():
    c = _case()
    w, h, f = c["x"][1] - c["x"][0], c["y"][1] - c["y"][0], c["frame"]
    oak = "Solid oak, hardwax oil"
    return {
        "glasscase": [(oak, "Case sides", f"{n(h)} × {n(c['d'])} × {n(f)}", "2", "From the oak offcuts; rebated for the back"),
                      (oak, "Case top and bottom", f"{n(w - 2 * f)} × {n(c['d'])} × {n(f)}", "2", "Between the sides")],
        "bar": [(oak, "Bar counter", f"{n(BB['w'])} × {n(BB['front'])} × {n(BB['top_t'])}", "1", "From the worktop's offcut")],
        "recordtable": [(oak, "Record table lid", f"{n(RT['w'])} × {n(RT['d'])} × {n(RT['lid'])}", "1", "From one 18 mm oak board 60 × 120; piano hinge along its back")],
        "fitted": [(oak, "Door shelf", f"{n(DS['x'][1] - DS['x'][0])} × {n(DS['d'])} × {n(DS['t'])}", "1", "From the worktop's offcut; two brackets")],
    }


SKIP_DRAW = ("Face frame", "Wedges", "Follower", "Concealed brackets", "Ledge lips")


def _size(name, size, qty):
    """[(L, W, count)] to draw for one row, or None."""
    m = re.search(r"from one (\d+(?:\.\d+)?) × (\d+(?:\.\d+)?)", size)       # the side-wall run: the board it's cut from
    if m:
        return [(float(m.group(1)), float(m.group(2)), 1)]
    m = re.search(r"(\d+(?:\.\d+)?) long × (\d+(?:\.\d+)?)", size)            # a length × a depth
    if m:
        return [(float(m.group(1)), float(m.group(2)), 1)]
    m = re.match(r"(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?), cut (\d+) long", size)     # the legs: a section, then a length
    if m:
        k = re.match(r"(\d+)", qty)
        return [(float(m.group(3)), float(m.group(1)), int(k.group(1)) if k else 1)]
    if name.startswith("Apron rails"):                                         # the table's frames: four lengths, two of each
        o = G.OPTC
        return [(o["top"][1] - 6, o["apron"], 2), (o["top"][0] - 12, o["apron"], 4), (o["top"][1] - 7.6, o["apron"], 2)]
    got = nest.parse(size, qty)
    if got:
        return got
    segs, qs = size.split(" · "), [q.strip() for q in str(qty).split(" · ")]       # "game drawer 56.8 × 6.5 × 2 · plinth drawer 54 × 6 × 2"
    qs = qs * len(segs) if len(qs) == 1 else qs
    out = []
    for seg, q in zip(segs, qs):
        m, k = re.search(r"(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?)", seg), re.match(r"(\d+)", q)
        if not m or not k:
            return None
        out.append((float(m.group(1)), float(m.group(2)), int(k.group(1))))
    return out


def parts(key):
    """[(letter, name, size text, qty text, material, note, [(L, W, count)] or None)] for one thing you make."""
    import build_doc as B
    rows = []
    for grp, _note, items in B.cuts():
        if grp == "Hardware":
            continue
        for r in items:
            if _project_of(r) == key:
                rows.append((grp, r[0], r[1], r[2], r[3]))
    rows += _extra().get(key, [])
    out = []
    for i, (grp, name, size, qty, note) in enumerate(rows):
        draw = None if name.startswith(SKIP_DRAW) else _size(name, size, qty)
        name = re.sub(r"\s*\(v\d+[^)]*\)", "", name)
        out.append((chr(65 + i), name, size, qty, grp, re.sub(r"\s*\(v\d+[^)]*\)", "", note), draw))
    return out


def _pieces(ps):
    """Every drawable piece, one per count: (label, L, W, material)."""
    out = []
    for letter, name, size, qty, grp, _note, draw in ps:
        if not draw:
            continue
        subs = name.split(" · ")
        for j, (L, W, k) in enumerate(draw):
            lab = letter + (str(j + 1) if len(draw) > 1 else "")
            out += [(lab, L, W, grp)] * k
    return out


def _svg(sheet, size, scale, title):
    L, W = size
    pad = 14
    r = [f'<svg viewBox="0 0 {L * scale + 2:.0f} {W * scale + 2 + pad:.0f}" width="100%" role="img" aria-label="{title}">',
         f'<text x="1" y="10" font-size="9" fill="#4a4741" font-family="Inter, sans-serif">{title}</text>',
         f'<rect x="1" y="{1 + pad}" width="{L * scale:.1f}" height="{W * scale:.1f}" fill="#f4efe6" stroke="#8a7f70"/>']
    for lab, x, y, l, w in sheet["parts"]:
        X, Y, Wd, Ht = 1 + x * scale, 1 + pad + y * scale, l * scale, w * scale
        r.append(f'<rect x="{X:.1f}" y="{Y:.1f}" width="{Wd:.1f}" height="{Ht:.1f}" fill="#d9b98c" stroke="#5a4632" stroke-width="0.8"/>')
        big = min(14, Ht * 0.5, Wd * 0.45)
        if big >= 5:
            two = Ht >= 26 and Wd >= 46
            cy = Y + Ht / 2 + (-2 if two else big / 3)
            r.append(f'<text x="{X + Wd / 2:.1f}" y="{cy:.1f}" font-size="{big:.1f}" font-weight="700" text-anchor="middle" fill="#2a2430" font-family="Inter, sans-serif">{lab}</text>')
            if two:
                r.append(f'<text x="{X + Wd / 2:.1f}" y="{cy + 10:.1f}" font-size="7.5" text-anchor="middle" fill="#2a2430" font-family="Inter, sans-serif">{n(l)} × {n(w)}</text>')
    r.append("</svg>")
    return "".join(r)


def cut_html(key):
    """The Cut part: each material's pieces laid out to scale (the ply on whole sheets, the oak as boards), then the key."""
    ps = parts(key)
    if not ps:
        return "<p class='note'>Nothing to cut: the parts come made.</p>"
    figs = []
    pieces = _pieces(ps)
    for grp in dict.fromkeys(p[3] for p in pieces):
        mine = [(lab, L, W) for lab, L, W, g in pieces if g == grp]
        if "ply" in grp.lower():
            best = None
            for size in nest.SIZES:
                try:
                    sh = nest.pack(mine, sheet=size)
                except ValueError:
                    continue
                if best is None or len(sh) * size[0] * size[1] < len(best[1]) * best[0][0] * best[0][1]:
                    best = (size, sh)
            size, sheets = best
            for i, s in enumerate(sheets):
                figs.append(f"<figure class='cutfig{' half' if size[0] <= 122 else ''}'>{_svg(s, size, 1.6, f'{grp.split(' (')[0]}: board {i + 1} of {len(sheets)}, {n(size[0])} × {n(size[1])}')}</figure>")
        else:
            span = max(200.0, max(max(L, W) for _l, L, W in mine) + 2)
            sh = nest.pack(mine, sheet=(span, 1000.0))
            for s in sh:
                hgt = sum(st[1] + nest.KERF for st in s["strips"])
                figs.append(f"<figure class='cutfig'>{_svg(s, (span, hgt), 390 / span, f'{grp}: each piece to scale')}</figure>")
    key_rows = "".join(f"<tr><td class='num'><b>{a}</b></td><td>{nm}</td><td class='num'>{sz}</td><td class='num'>{q}</td><td>{g.split(',')[0].split(' (')[0]}</td><td class='note'>{nt}</td></tr>"
                       for a, nm, sz, q, g, nt, _d in ps)
    return ("".join(figs) + "<table class='tight cuts ckey'><colgroup><col style='width:6%'><col style='width:22%'><col style='width:22%'><col style='width:7%'><col style='width:11%'><col></colgroup><tr><th class='num'>Part</th><th>What</th><th class='num'>Size (cm)</th><th class='num'>Qty</th>"
            f"<th>From</th><th>Notes</th></tr>{key_rows}</table><p class='note'>Sizes are finished sizes, length × width × thickness; "
            "a 4 mm saw cut between pieces. Ply parts can be cut by the merchant from these layouts.</p>")


# ---------- Build: the steps' instructions, only the sub-assemblies this thing needs, numbered straight through
def build_html(spec, full_step_extras=True):
    import build_doc as B, diagrams as D
    steps = {s["n"]: s for s in B.steps()}
    out, k, checks = [], 1, []
    for num, heads in spec:
        st = steps[num]
        whole = heads is None
        if whole and full_step_extras:
            if st.get("tools"):
                out.append("<div class='need'><div><h5>Tools</h5><ul>" + "".join(f"<li>{t}</li>" for t in st["tools"]) + "</ul></div>"
                           + ("<div><h5>Fixings</h5><ul>" + "".join(f"<li>{t}</li>" for t in st["hardware"]) + "</ul></div>" if st.get("hardware") else "")
                           + "</div>")
            out += [f"<figure>{getattr(D, B.DIAGRAMS[d])()}</figure>" for d in CH_DRAW.get(num, st.get("draw", [])) if d in B.DIAGRAMS]
        if st.get("parts_full"):
            for head, items in st["parts_full"]:
                if not whole and not any(head.startswith(h) for h in heads):
                    continue
                h = re.sub(r"\s*\(v\d+[^)]*\)", "", head)
                out.append(f"<h5>{h}</h5><ol start='{k}'>" + "".join(f"<li>{i}</li>" for i in items) + "</ol>")
                k += len(items)
        else:
            out.append(f"<ol start='{k}'>" + "".join(f"<li>{d}</li>" for d in st["do"]) + "</ol>")
            k += len(st["do"])
        if whole:
            checks.append(st["check"])
    out += [f"<p class='callout'><b>Check before moving on:</b> {c}</p>" for c in checks]
    return "".join(out)


def picture(name, alt):
    import build_doc as B
    return f"<figure class='render chap'>{B.thumb(name, alt)}</figure>"


def others(money):
    """The buy list's rows no chapter takes (the basket, the rug, the ottoman…): one table at the back."""
    import build_doc as B
    taken = all_buy_prefixes()
    rows = []
    for st, item, _ph, q, lo, hi in B.TRACK:
        t = _plain(item)
        if st == "To buy" and not any(t.startswith(p) for p in taken):
            rows.append(t)
    import costs
    short = {s[1]: s for s in costs.SHORT}
    pre = [next((k for k in short if t.startswith(k)), None) for t in rows]
    return buy_rows([p for p in pre if p] + [t for t, p in zip(rows, pre) if not p])


RULES = """<div class="callout"><b>Five rules</b><ul>
<li><b>Check every wall before you drill</b> with the detector; never straight above, below or beside a socket or switch.</li>
<li><b>Measure twice, cut once.</b> Walls are rarely square: cut to the smallest measurement.</li>
<li><b>Two people for anything over 15 kg:</b> the uprights, the worktop, the table, the TV.</li>
<li><b>Electrics:</b> isolate, lock off and prove dead every time. Anything new is an electrician's (the stop list in Cables and the socket).</li>
<li><b>Dry-fit everything</b> before glue or screws.</li></ul></div>"""
