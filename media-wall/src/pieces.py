"""v46, client: "I don't need step by step what item to do first ... but I need to be able to drill down into tasks for each piece of the
room when I click on them or look in the plans". The room in places, each place's pieces, and each piece's whole job: what to check,
what to buy, what to cut and its tasks. One list for the room's labels, the plan page's Build sheet and the build guide.

A piece is a thing you make or fit (chapters.MAKE; "bought and fitted" is split into its three pieces, each where it stands) or a job
for the whole room (chapters.JOBS). Its tasks are its steps' sub-assemblies (instructions.py), so they move when the steps do."""
import geometry as G
import chapters as C

# (key, title, place, picture, [(step, sub-assembly headings or None)], buy rows (their start), cut (a chapter's key or None), time, who)
_MAKE = {c[0]: c for c in C.MAKE}


def _from(key, place):
    k, title, _what, pic, spec, buy, time, who = _MAKE[key]
    return dict(key=key, title=title, place=place, pic=pic, spec=spec, buy=buy, cut=key, time=time, who=who, what=_what)


PIECES = [
    _from("base", "wall"), _from("worktop", "wall"), _from("uprights", "wall"),
    _from("sidewall", "side"),
    _from("glasscase", "breast"),
    dict(key="doorshelf", title="The shelf over the door and its boxes", place="breast", pic="render_v99_3d_sg_doorshelf.png",
         spec=[(14, ["Over the hall door"])], buy=["An oak shelf over the hall door", "Two IKEA KUGGIS lidded boxes"], cut="fitted",
         time="2 h", who="You", what="An oak shelf on two brackets over the hall door, two lidded boxes on it."),
    _from("cabinet", "dining"), _from("bar", "dining"),
    _from("recordtable", "sofa"), _from("ctable", "sofa"),
    dict(key="wallcabs", title="The wall cabinets", place="sofa", pic="render_v99_3d_sg_wallcabs.png",
         spec=[(14, ["The wall cabinets"])], buy=["Two IKEA EKET wall cabinets"], cut=None,
         time="2 h", who="You + a helper", what="Two glass-fronted cabinets on a rail over the sofa's corner."),
    dict(key="alcove", title="The alcove shelves", place="window", pic="render_v99_3d_sg_alcoveshelves.png",
         spec=[(14, ["The alcove shelves"])], buy=["Two oak floating shelves 900 × 230"], cut=None,
         time="2 h", who="You", what="Two oak floating shelves on concealed brackets in the window corner."),
]
JOB_PIECES = [dict(key=k, title=t, place="whole", pic=None, spec=spec, buy=buy, cut=None, time=time, who="You", what=what, job=True)
              for k, t, what, spec, buy, time in C.JOBS]

# (id, name, hue, the label's anchor in room cm, its wall's normal, the cutaway, Fly here, the plan's chapter)
PLACES = [
    ("wall", "Media wall", 40, [G.ALC_W / 2, 150, G.ALC_D - 26], [0, -1], "wall", "wall", "wall"),
    ("side", "Side wall and PC", 300, [2, 150, (G.PC_Z[0] + G.PC_Z[1]) / 2], [1, 0], "", "pc", "side"),
    ("breast", "Chimney breast and door", 20, [(G.BREAST_X[0] + G.BREAST_X[1]) / 2, 175, -2], [0, -1], "wall", "breast", "records"),
    ("dining", "Dining wall and bar", 60, [G.ROOM_W - 12, 110, G.CAB["cz"]], [-1, 0], "stairs", "dining", "dining"),
    ("sofa", "The sofa", 250, [(G.SOFA_X[0] + G.SOFA_X[1]) / 2, 70, G.SOFA_BACK_Z + 55], None, "", "sofa", "c-room"),
    ("window", "Window corner", 150, [G.WINDOW_X[1] + 60, 150, G.WINDOW_Z + 4], [0, 1], "", "windowwall", "c-room"),
]
PLACE_NAME = {p[0]: p[1] for p in PLACES} | {"whole": "The whole room"}

# what each piece needs done first: one line, not an order
NEEDS = {"base": "The Cat6, the socket and the PC's conduits (Cables) and the paint first: the base hides that wall.",
         "worktop": "The base, levelled and fixed.", "uprights": "The worktop on.", "sidewall": "The uprights in (the run's cleat meets the left one).",
         "glasscase": "The breast painted.", "cabinet": "The stairs wall painted; the black shelf's 10 cm gap kept.",
         "bar": "The dining cabinet in (the bar is scribed to it).", "doorshelf": "The architrave's top measured (Check).",
         "lighting": "Cables done; the paint dry.", "connect": "The media wall built."}

# the plan's open checks (fit's CHECK rows), each to its piece: (the zone's start, the item's start or "", piece)
CHECKS = [("The TV between", "", "uprights"), ("Bay 1", "", "base"), ("Bay 2", "", "base"), ("Bay 3", "", "base"),
          ("The compact dining cabinet", "", "cabinet"), ("Your black shelf", "", "cabinet"), ("Your picks", "The shelf over the door", "doorshelf")]


def checks(key):
    import fit
    out = []
    for t, _s, rs in fit.firm_zones():
        for item, _size, _src, sp, spare, st in rs:
            if st == fit.CHECK and any(t.startswith(z) and item.startswith(i) and p == key for z, i, p in CHECKS):
                out.append((item, sp, spare))
    return out


def tasks(piece):
    """[(task id, title, [instructions], step)] for a piece: each sub-assembly of its steps (or each line of a step that has none)."""
    import re, build_doc as B
    steps = {s["n"]: s for s in B.steps()}
    out = []
    for num, heads in piece["spec"]:
        st = steps[num]
        if st.get("parts_full"):
            for i, (head, items) in enumerate(st["parts_full"]):
                if heads is None or any(head.startswith(h) for h in heads):
                    out.append((f"{piece['key']}:{num}:{i}", re.sub(r"\s*\(v\d+[^)]*\)", "", head), items, num))
        else:
            for i, d in enumerate(st["do"]):
                out.append((f"{piece['key']}:{num}:d{i}", _title(d), [d], num))
    if len(out) == 1 and len(out[0][2]) > 1:                    # one sub-assembly: each of its instructions is a task
        tid, _h, items, num = out[0]
        out = [(f"{tid}.{j}", _title(d), [d], num) for j, d in enumerate(items)]
    return out


def _title(d):
    """A task's name from its instruction: its first clause, whole words, up to about 60 characters."""
    import re
    t = re.sub(r"<[^>]+>", "", d).strip()
    t = re.split(r"(?<=[a-z0-9)])[.:;](\s|$)", t)[0]
    if len(t) > 64:
        t = t[:64].rsplit(" ", 1)[0].rstrip(",") + "…"
    return t


def all_pieces():
    return PIECES + JOB_PIECES


def by_place():
    return [(pid, name, [p for p in PIECES if p["place"] == pid]) for pid, name, *_ in PLACES] + [("whole", "The whole room", JOB_PIECES)]


# ---------- the build guide by place and piece (v46: "easy to read from any view"; no order of work, each piece findable from the
# contents, the PDF's bookmarks or the room)
def numbered():
    """[(code, piece)]: the things you make 1, 2, 3… in the order of the places; the jobs A–E."""
    return [(str(i), p) for i, p in enumerate(PIECES, 1)] + [("ABCDE"[i], p) for i, p in enumerate(JOB_PIECES)]


def _retarget(html):
    import re
    names = {}
    for _c, p in numbered():
        for n, _h in p["spec"]:
            names.setdefault(n, p["title"])
    names[1] = names[5] = "Start here"
    def rep(m):
        t = names.get(int(m.group(2)))
        return f"<i>{t}</i>" if t else m.group(0)
    return re.sub(r"\b([Ss])tep (\d+)\b(?!\s*·)", rep, html)


def piece_html(code, p, money, first):
    import html as H
    rows = C.buy_rows(p["buy"])
    lo, hi = sum(r[3] for r in rows), sum(r[4] for r in rows)
    need, chk = NEEDS.get(p["key"]), checks(p["key"])
    check = ((f"<p class='need1'><b>First:</b> {H.escape(need)}</p>" if need else "")
             + ("<table class='tight'><tr><th>Measure</th><th>We drew</th><th>Why</th></tr>"
                + "".join(f"<tr><td>{a}</td><td>{b}</td><td class='note'>{c}</td></tr>" for a, b, c in chk) + "</table>" if chk else ""))
    meta = " · ".join(x for x in (PLACE_NAME[p["place"]], p["time"], p["who"], f"about £{money(lo, hi)}" if rows else "") if x)
    return (f"<section class='chap' id='pc-{p['key']}'><h3 class='piece{'' if first else ' pb'}'>{code} · {H.escape(p['title'])}</h3>"
            f"<p class='lede'>{H.escape(p['what'])}</p><p class='meta'>{meta}</p>"
            + (C.picture(p["pic"], p["title"]) if p.get("pic") else "")
            + (f"<h4>Check</h4>{check}" if check else "")
            + "<h4>Buy</h4>" + C.buy_html(rows, money)
            + (f"<h4>Cut</h4>{C.cut_html(p['cut'])}" if p["cut"] else "")
            + ("<h4>Do</h4>" if p.get("job") else "<h4>Build</h4>") + C.build_html(p["spec"]) + (__import__("build_doc").wiring_html() if p["key"] == "cables" else "")
            + "</section>")


def merchant_html():
    by = {}
    for code, p in numbered():
        if p["cut"]:
            for letter, name, size, qty, grp, _note, _d in C.parts(p["cut"]):
                by.setdefault(grp, []).append((f"{code}{letter}", name, size, qty))
    out = ["<p>Every part, by what it's cut from. The code is the piece's number and the part's letter in it. Finished sizes in cm, length × width × thickness.</p>"]
    for grp, rows in by.items():
        out.append(f"<h4>{grp}</h4><table class='tight ckey'><colgroup><col style='width:9%'><col style='width:41%'><col style='width:38%'><col></colgroup>"
                   "<tr><th>Code</th><th>Part</th><th class='num'>Size (cm)</th><th class='num'>Qty</th></tr>"
                   + "".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td class='num'>{c}</td><td class='num'>{d}</td></tr>" for a, b, c, d in rows) + "</table>")
    return "".join(out)


def guide_html(money):
    import build_doc as B, fit, html as H
    num = {p["key"]: code for code, p in numbered()}
    rows = []
    for pid, name, ps in by_place():
        rows.append(f"<tr class='ph'><td colspan='4'>{H.escape(name)}</td></tr>")
        for p in ps:
            r = C.buy_rows(p["buy"])
            rows.append(f"<tr><td class='num'><b>{num[p['key']]}</b></td><td><a href='#pc-{p['key']}'>{H.escape(p['title'])}</a></td><td>{p['time']}</td>"
                        f"<td class='num'>{money(sum(x[3] for x in r), sum(x[4] for x in r)) if r else ''}</td></tr>")
    oth = C.others(money)
    tl, th = B.phase_totals()[1:]
    contents = ("<h2 id='contents'>Your room, piece by piece</h2><p>Any order: each piece has what to check, buy, cut and build. Tap a name to go to it "
                "(the PDF's bookmarks list them too).</p><table class='tight contents'><tr><th class='num'>No.</th><th>Piece</th><th>Time</th><th class='num'>£</th></tr>"
                + "".join(rows) + f"<tr><td></td><td><a href='#also'>Also on the list</a> (the basket, the rug, the ottoman…)</td><td></td>"
                f"<td class='num'>{money(sum(x[3] for x in oth), sum(x[4] for x in oth))}</td></tr>"
                f"<tr class='tot'><td></td><td><b>Everything</b></td><td>about 17–22 days</td><td class='num'><b>{money(tl, th)}</b></td></tr></table>"
                "<p class='note'><a href='#start'>Start here</a> · <a href='#know'>Good to know</a> · <a href='#merchant'>For the timber merchant</a></p>")
    start = ("<h2 class='pb' id='start'>Start here</h2>" + C.RULES + "<h3>Measure and mark</h3>"
             + C.build_html([(1, None), (5, None)], full_step_extras=False) + fit.measure_html())
    body = []
    for pid, name, ps in by_place():
        body.append(f"<h2 class='pb place' id='pl-{pid}'>{H.escape(name)}</h2>")
        body += [piece_html(num[p["key"]], p, money, i == 0) for i, p in enumerate(ps)]
    back = ("<h2 class='pb' id='know'>Good to know</h2>" + B.GUIDE_TECHNIQUES + B.GUIDE_PITFALLS + B.guide_tools()
            + "<h3 id='also'>Also on the list</h3>" + C.buy_html(oth, money)
            + "<h2 class='pb' id='merchant'>For the timber merchant</h2>" + merchant_html() + B.nest_html(figs=False))
    return _retarget(contents + start + "".join(body) + back)
