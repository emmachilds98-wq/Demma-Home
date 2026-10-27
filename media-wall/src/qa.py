"""v29.1 (v30: no questions sheet; the compact cabinet's step 11 and both cabinets' states): QA for the page (the GitHub Pages index.html), at 390 × 844 and 1280 × 800: console errors, sideways scroll, the version
label, the PDF links, every sheet and Plan chapter with every fold opened (anything poking past the screen's right edge that isn't in
a scroller), step 11 open, the dining cabinet's states in the 3D room.
    python3 qa.py [screenshot folder]       serves the repo itself; prints a JSON report, "fails" and "errors" should be empty
"""
import json, sys, threading, functools, http.server, pathlib, urllib.request
from playwright.sync_api import sync_playwright
import localcdn
from build_doc import VERSION, LABEL

ROOT = pathlib.Path(__import__("os").environ.get("DEMMA_SITE") or pathlib.Path(__file__).resolve().parents[2] / "_site")   # V1: the built site (tools/build.py)
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
BASE = ""
CHAPTERS = ["c-room", "views", "wall", "records", "side", "joinery", "dining", "paint", "network", "fit", "downloads"]
SHEETS = ["plan", "build", "buy", "ideas"]   # v30: the questions sheet is gone
ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"]

OVER = """sel => { const el = sel ? document.querySelector(sel) : document.scrollingElement;
  return el ? [el.scrollWidth, el.clientWidth] : null; }"""
# visible elements poking out past the viewport's right edge (inside the open sheet)
POKE = """sel => { const root = document.querySelector(sel); if (!root) return [];
  const W = innerWidth, out = [];
  for (const e of root.querySelectorAll('*')) { const r = e.getBoundingClientRect();
    if (r.width && r.height && r.right > W + 1 && !e.closest('.tscroll, .scroll, figure.dia, .lbscroll, .r3d-gal, .toc, .seg'))
      out.push((e.tagName + '.' + e.className).slice(0, 60) + ' ' + Math.round(r.right)); }
  return out.slice(0, 6); }"""


def run(p, w, h):
    rep = {"viewport": f"{w}x{h}", "errors": [], "fails": [], "notes": []}
    import clash                                              # v38: the plan's pieces never overlap, still or moving
    for kind, a, b_, d in clash.report():
        (rep["fails"] if kind == "clash" else rep["notes"]).append(f"{kind}: {a} × {b_}: {d}")
    b = __import__("pw").launch(p, ARGS)
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
    pg = ctx.new_page(); pg.set_default_timeout(120000)   # V1: software graphics on a CI machine: a screenshot can pass 30 s
    localcdn.route(pg)                                   # v34: three.js from THREE_LOCAL, if set
    pg.on("pageerror", lambda e: rep["errors"].append("pageerror: " + str(e)[:200]))
    pg.on("console", lambda m: rep["errors"].append("console: " + m.text[:200]) if m.type == "error" else None)
    pg.goto(BASE + "plan.html")   # V1: the media wall's full page
    pg.wait_for_function("window.R3D && window.R3D.ready", timeout=180000)
    pg.wait_for_timeout(800)
    fail = rep["fails"].append
    ver = pg.eval_on_selector(".ver", "e => e.textContent")
    rep["notes"].append(f"version label {ver!r}")
    if ver != LABEL:
        fail(f"version label {ver!r}")
    sw, cw = pg.evaluate(OVER, None)
    if sw > cw:
        fail(f"page scrolls sideways {sw} > {cw}")
    pg.screenshot(path=f"{OUT}/qa_{w}_room.png")
    # v46: every place's label lists its pieces, and each piece's card opens (from the room, then from Plan's Build)
    places = pg.evaluate("() => [...document.querySelectorAll('.stk[data-hot]')].map(s => s.dataset.hot)")
    for pl in places:
        got = pg.evaluate("""pl => { const s = document.querySelector('.stk[data-hot=' + pl + ']'); s.hidden = false; s.click();
          const ids = [...document.querySelectorAll('#r3d-pop .r3d-pcs [data-mk]')].map(b => b.dataset.mk); document.querySelector('#r3d-pop .x').click(); return ids; }""", pl)
        if not got:
            fail(f"place {pl}: no pieces on its card")
        for cid in got:
            if not pg.evaluate("id => { window.openCard(id); const c = document.getElementById(id); const ok = !!(c && c.open && c.querySelector('[data-tab=build]')); if (c) c.open = false; return ok; }", cid):
                fail(f"place {pl}: piece {cid} doesn't open")
    rep["notes"].append(f"places {len(places)}, pieces {pg.evaluate('() => document.querySelectorAll(\'details.mk[data-piece]\').length')}, tasks {pg.evaluate('() => document.querySelectorAll(\'input[data-task]\').length')}")
    # v46.1, client: "I want plans and images to fit in my phone screen not scroll": on a phone nothing in a sheet scrolls sideways
    if w <= 640:
        wide = []
        for ch in pg.evaluate("() => ['plan', ...[...document.querySelectorAll('#sh-plan .chapter')].map(c => c.dataset.ch), 'build', 'buy']"):
            pg.evaluate("h => { location.hash = '#' + h; }", ch); pg.wait_for_timeout(500)
            pg.evaluate("() => document.querySelectorAll('.sheet.open details').forEach(d => d.open = true)"); pg.wait_for_timeout(300)
            wide += [f"{ch}: {x}" for x in pg.evaluate("""() => [...document.querySelectorAll('.sheet.open .sbd *')].filter(el => {
                const cs = getComputedStyle(el); return el.offsetParent && /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2; })
              .map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + el.scrollWidth + '>' + el.clientWidth)""")]
            pg.evaluate("() => document.querySelectorAll('.sheet.open details').forEach(d => d.open = false)")
        for x in sorted(set(wide))[:12]:
            fail(f"scrolls sideways on a phone: {x}")
        pg.evaluate("() => { location.hash = '#room'; }"); pg.wait_for_timeout(500)
    for s in SHEETS:
        pg.evaluate("s => { location.hash = '#' + s; }", s)
        pg.wait_for_timeout(500)
        if not pg.evaluate("s => document.getElementById('sh-' + s).classList.contains('open')", s):
            fail(f"sheet {s} didn't open")
        pg.evaluate("""s => { const r = document.getElementById('sh-' + s);
          r.querySelectorAll('details').forEach(d => d.open = true); r.querySelectorAll('.sbody').forEach(b => b.hidden = false); }""", s)
        pg.wait_for_timeout(300)
        poke = pg.evaluate(POKE, f"#sh-{s}")
        if poke:
            fail(f"sheet {s} overflows: {poke}")
    for ch in CHAPTERS:
        pg.evaluate("c => { location.hash = '#' + c; }", ch)
        pg.wait_for_timeout(400)
        vis = pg.evaluate("c => { const e = document.getElementById('ch-' + c); return !!e && !e.hidden && e.offsetHeight > 0; }", ch)
        if not vis:
            fail(f"chapter {ch} not shown")
        pg.evaluate("c => document.getElementById('ch-' + c).querySelectorAll('details').forEach(d => d.open = true)", ch)
        poke = pg.evaluate(POKE, f"#ch-{ch}")
        if poke:
            fail(f"chapter {ch} overflows: {poke}")
        if ch == "dining":
            pg.screenshot(path=f"{OUT}/qa_{w}_dining.png")
    # step 11, its body open
    pg.evaluate("() => { location.hash = '#step-11'; }")
    pg.wait_for_timeout(700)
    st = pg.evaluate("""() => { const e = document.getElementById('mk-cabinet'); if (!e) return null;   // v44: a step opens its card on Build
      const b = e.querySelector('[data-pane=build]'); return {open: e.open, body: !!b && !b.hidden, text: b ? b.innerText : ''}; }""")
    if not st or not st["open"] or not st["body"]:
        fail(f"step 11's card not open: {st and {k: v for k, v in st.items() if k != 'text'}}")
    else:
        t = st["text"]
        for bad in ("170°", "Lid stays", "linen flap", "Slido", "sliding door"):
            if bad in t:
                fail(f"step 11 still says {bad!r}")
        rep["notes"].append("step 11 mentions: " + ", ".join(k for k in ("Hang the two doors", "piano hinge", "flush magnet", "two boxes") if k in t))
    pg.screenshot(path=f"{OUT}/qa_{w}_step11.png")
    # back to the room; the cabinet's states
    pg.evaluate("() => { location.hash = '#room'; }")
    pg.wait_for_timeout(400)
    for opts in ({"site": "C", "cabw": "80", "dining": "six", "view": "dining"}, {"site": "C", "cabw": "90", "dining": "folded", "tdoor": True, "view": "dining"},
                 {"site": "C", "dining": "six", "view": "dining"}, {"site": "C", "dining": "folded", "chairs": "open", "view": "chairs"},
                 {"site": "C", "dining": "folded", "view": "room"}, {"site": "B", "dining": "four"}, {"site": "C", "dining": "six", "view": "room"}):
        pg.evaluate("o => window.R3D.set(o)", opts)
        pg.wait_for_timeout(700)
    pg.screenshot(path=f"{OUT}/qa_{w}_room_six.png")
    # v35: lighting changes never make new shaders (each quality has its fixed set of lights), and nothing went into the error trap
    # v37: let the warm-up finish first (it compiles the hidden parts' shaders in quiet moments; with v37's twelve more pieces its queue
    # could still be running here, and a step landing in the loop below looked like a lighting change making shaders)
    for _ in range(90):
        if not pg.evaluate("() => R3D.perf().warm"):
            break
        pg.wait_for_timeout(2000)
    n0 = pg.evaluate("() => R3D.perf().programs")
    for sc in ("film", "cosy", "bright", "film", "bright"):
        pg.evaluate("s => window.R3D.set({scene: s})", sc); pg.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    perf = pg.evaluate("() => R3D.perf()"); rep["notes"].append(f"3D: {perf}")
    if perf["programs"] > n0:
        fail(f"lighting scenes made new shaders: {n0} -> {perf['programs']}")
    if pg.evaluate("() => R3D.errors().length"):
        fail(f"the 3D room's error trap: {pg.evaluate('() => R3D.errors()')}")
    sw, cw = pg.evaluate(OVER, None)
    if sw > cw:
        fail(f"page scrolls sideways after the 3D states {sw} > {cw}")
    # v33: one count (the Plan's ring and Buy agree), Decide and build day open on one screen
    cnt = pg.evaluate("() => [document.getElementById('d-buy').textContent, document.getElementById('t-done').textContent, document.getElementById('d-choice').textContent]")
    if cnt[0].split("/")[1] != cnt[1].split(" of ")[1]:
        fail(f"the counts disagree: plan {cnt[0]!r}, buy {cnt[1]!r}")
    rep["notes"].append(f"counts: plan {cnt[0]}, buy {cnt[1]}, choices {cnt[2]}")
    for js, name in (("PICKS.openDecide(2)", "decide"), ("PICKS.openDay(11)", "bday")):
        pg.evaluate(js); pg.wait_for_timeout(500)
        poke = pg.evaluate(OVER, None)
        if poke[0] > poke[1]:
            fail(f"{name} scrolls sideways {poke}")
        pg.screenshot(path=f"{OUT}/qa_{w}_{name}.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
        if pg.evaluate(f"() => !document.getElementById('{name}').hidden"):
            fail(f"{name} didn't close on Escape")
    has_tour = pg.evaluate("() => !!document.querySelector('[data-tour], #r3d-tour')")
    rep["notes"].append(f"tour control present: {has_tour}")
    b.close()
    return rep


def links():
    bad = []
    for f in (f"media-wall/out/Demmas_Home_{LABEL}_Plan.pdf", f"media-wall/out/Demmas_Home_{LABEL}_Build_Guide.pdf",
              f"media-wall/out/Demmas_Home_{LABEL}_Plan_phone.pdf", f"media-wall/out/Demmas_Home_{LABEL}_Build_Guide_phone.pdf"):   # v46: the phone editions
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + f, method="HEAD")) as r:
                if r.status != 200:
                    bad.append(f"{f} {r.status}")
        except Exception as e:
            bad.append(f"{f} {e}")
    return bad


def no_assistant_names():
    """v42 (client: "make no reference to Claude as being the editor or viewing there"): the page and both PDFs never name it."""
    from pypdf import PdfReader
    word = "cl" + "aude"
    hits = []
    for f in ("plan.html", "index.html", f"media-wall/out/Demmas_Home_{LABEL}_Plan.pdf", f"media-wall/out/Demmas_Home_{LABEL}_Build_Guide.pdf",
              f"media-wall/out/Demmas_Home_{LABEL}_Plan_phone.pdf", f"media-wall/out/Demmas_Home_{LABEL}_Build_Guide_phone.pdf"):
        path = ROOT / f
        if not path.exists():
            hits.append(f"{f} missing"); continue
        text = path.read_text() if f.endswith((".html", ".js")) else " ".join(pg.extract_text() or "" for pg in PdfReader(str(path)).pages)
        if word in text.lower():
            hits.append(f)
    return hits


# v39 (UPGRADE_PLAN_v38 item 11, "say less"): every piece of text has a budget, and anything over it is listed so it gets cut:
# a caption 20 words, a panel's note 30, a plan paragraph 80, a toast 10
BUDGET = {"caption": 20, "figcaption": 20, "note": 30, "p": 80, "toast": 10}


def text_budget():
    import html.parser, re
    page = (ROOT / "plan.html").read_text()
    class P(html.parser.HTMLParser):
        def __init__(self):
            super().__init__(); self.stack = []; self.out = []
        def handle_starttag(self, tag, attrs):
            if tag in ("br", "img", "input", "meta", "link", "source", "hr", "wbr", "col", "area", "base", "embed", "param", "track"):
                return
            cls = dict(attrs).get("class") or ""
            kind = ("figcaption" if tag == "figcaption" else "caption" if re.search(r"\b(caption|r3d-hint2)\b", cls)
                    else "p" if tag == "p" and any(k == "doc" for k, _ in self.stack) else None)
            self.stack.append(("doc" if re.search(r"\bdoc\b", cls) else tag, [kind, []]))
        def handle_endtag(self, tag):
            if not self.stack:
                return
            t, (kind, words) = self.stack.pop()
            if kind:
                txt = " ".join(words).split()
                if len(txt) > BUDGET[kind]:
                    self.out.append((kind, len(txt), " ".join(txt[:12])))
            if self.stack:
                self.stack[-1][1][1].extend(words)
        def handle_data(self, d):
            if self.stack:
                self.stack[-1][1][1].append(d)
    pr = P(); pr.feed(re.sub(r"<script.*?</script>|<textarea.*?</textarea>|<svg.*?</svg>", "", page, flags=re.S))   # v39: the cutting list's copy box isn't a caption
    js = (pathlib.Path(__file__).parent / "room3d.js").read_text()
    for m in re.finditer(r'toast\(\s*"([^"]+)"', js):
        n = len(m.group(1).split())
        if n > BUDGET["toast"]:
            pr.out.append(("toast", n, " ".join(m.group(1).split()[:12])))
    over = sorted(pr.out, key=lambda x: -x[1])
    return {"over": len(over), "by_kind": {k: sum(1 for o in over if o[0] == k) for k in BUDGET}, "longest": [f"{k} {n}: {t}" for k, n, t in over[:25]]}


if __name__ == "__main__":
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    BASE = f"http://127.0.0.1:{srv.server_address[1]}/"
    res = {"links": links(), "text": text_budget(), "names": no_assistant_names()}
    with sync_playwright() as p:
        res["runs"] = [run(p, 390, 844), run(p, 1280, 800)]
    print(json.dumps(res, indent=1))
