"""Builds the plan page (v13.3): the whole plan in tabs (overview, 3D views, media wall, dining, paint and light, network and
power, build steps, buy list with cost by phase, questions, checks), the sections borrowed from build_doc.py, with
answers, photos, buy ticks and step ticks saved for both of you. Images live in art/.
python3 build_viewer.py  -> media_wall_viewer.html (the shared copy, with art/ and files/ alongside it)
                            and ../../index.html, the same page for GitHub Pages (plain download links; answers and
                            the tracker fall back to this device, with a copy-your-answers button)
On claude.ai the page declares: db (answers/, tracker/), user (who saved what), assets (photos, editors), downloads."""
import hashlib, html, json, pathlib, re, urllib.parse
import geometry as G
import fit
from build_doc import TRACK, money, phase_totals, plan_sections, steps, GUIDE_RULES, GUIDE_TIME, GUIDE_TECHNIQUES, GUIDE_PITFALLS, guide_tools, cuts_html, cuts_text, need_html, full_html, DIAGRAMS, PARTS, PHASE_PART, part_chip

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / "out"
from build_doc import VERSION, LABEL   # v28: one version for the plan, the guide and the page (it had stuck at 26, so its PDF links broke)
SITE = pathlib.Path(__import__("os").environ.get("DEMMA_SITE") or HERE.parents[1] / "_site")   # V1: everything a build makes for the site
DOWNLOADS_ON_GITHUB = True   # v13: the artifact refuses PDFs (and some large images) from an editor outside its organisation
PAGES = "https://emmachilds98-wq.github.io/Demma-Home/"           # V1: main is built and published to GitHub Pages by the workflow
GITHUB_OUT = PAGES + "media-wall/out/"
LPS = G.ALL_LPS   # v19: 291, the wall's 191 and the vinyl stand's 100
SINGLES = 2 * G.TRAY_SINGLES

import room3d_page                 # v14: the room in 3D
from shot3d import SHOTS as SHOTS3D


def _plain(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


# v25: rows whose words changed keep the id their old words made, so ticks and amounts saved against them still show
TRACK_KEEP_ID = {"Set up the smart bulbs in their app": "tdd8f66e8a569",
                 # v29: the dining cabinet's rows reworded for the sliding doors; ticks and paid amounts stay
                 "Solid oak for the table: two halves": "t8bc7f1b954e5", "The dining cabinet: oak-faced ply": "ta99476328449",
                 "Oak for the cabinet's hinge rail": "t660dd8fcee21", "The doors' sliding gear": "t551b3e289617",
                 "Build the dining cabinet: the carcass": "taae3dc4761a1", "One solid oak worktop, 300 × 62": "te9a6cd470663",
                 # v30: the compact cabinet's rows; the sliding gear's row is gone (the doors' hinges are a new row)
                 "Build the dining cabinet: the two boxes": "taae3dc4761a1", "Open the table, level it at 76": "te78b64c0b588",
                 # v31: the chairs' row names the beech FRÖSVI (the pads have their own row)
                 "Folding chairs, IKEA FRÖSVI in solid beech": "tfcb4fc34fb91"}


def track_rows():
    rows = []
    for st, item, ph, q, lo, hi in TRACK:
        key = hashlib.sha1((ph + "|" + re.sub(r"\(changed[^)]*\)|\(new\)|\(moved[^)]*\)", "", _plain(item))).encode()).hexdigest()[:12]
        key = next((v[1:] for k, v in TRACK_KEEP_ID.items() if _plain(item).startswith(k)), key)
        est = money(lo, hi) if lo is not None else ""
        rows.append({"id": "t" + key, "phase": ph, "item": item, "qty": q, "est": est, "lo": lo or 0, "hi": hi or 0, "done": st == "Done",
                     "kind": "job" if st == "To do" or st == "Done" and lo is None else "buy"})
    return rows


def fit_html():
    out = []
    c = fit.counts()
    for title, space, rows in fit.firm_zones():
        n_t = sum(1 for r in rows if r[-1] == fit.TIGHT)
        n_c = sum(1 for r in rows if r[-1] == fit.CHECK)
        flags = "".join(f'<span class="pill {k}">{n} {lab}</span>' for n, k, lab in ((n_t, "tight", "tight"), (n_c, "check", "to check")) if n)
        body = []
        for item, size, src, sp, spare, st in rows:
            cls = fit.status_class(st)
            body.append(f'<tr class="r-{cls}"><td>{item}</td><td>{size}{src}</td><td>{sp}</td><td>{spare}</td><td><span class="pill {cls}">{st}</span></td></tr>')
        out.append(f'<details class="zone"><summary><span class="zt">{title}</span><span class="zf">{len(rows)} checks {flags}</span></summary>'
                   f'<p class="caption">{space}</p><div class="scroll"><table class="fit"><thead><tr><th>Item</th><th>Size (cm)</th><th>Space</th>'
                   f'<th>Spare (cm)</th><th>Result</th></tr></thead><tbody>{"".join(body)}</tbody></table></div></details>')
    head = (f'<div class="fitsum"><span class="pill ok">{c[fit.PASS]} fit</span><span class="pill tight">{c[fit.TIGHT]} tight</span>'
            f'<span class="pill check">{c[fit.CHECK]} to check on site</span><span class="pill no">{c[fit.NO]} don\'t fit</span></div>')
    return head, "\n".join(out), c


def downloads_list():
    """Files offered for download: the plan, the build guide and the HD renders, from ../out."""
    items = []
    for p in sorted(OUT.glob(f"Demmas_Home_{LABEL}_Plan.pdf")) + sorted(OUT.glob(f"Demmas_Home_{LABEL}_Build_Guide.pdf")):
        label = "The full plan" if p.name.startswith("Home") else "The build guide"
        items.append((p, f"{label}, {LABEL}", "PDF"))
    for p in sorted(OUT.glob(f"Media wall {LABEL} - *.png"), key=lambda p: (" - 3D - " not in p.name, p.name)):
        lab = p.stem.replace(f"Media wall {LABEL} - ", "").replace(" (HD)", "")
        items.append((p, (lab.replace("3D - ", "") + " (3D, HD)") if lab.startswith("3D - ") else lab + " (drawn, HD)", "PNG"))
    for p in sorted(OUT.glob("*plan*.png")) + sorted(OUT.glob("Dining layouts*.png")) + sorted(OUT.glob("Storage options*.png")) + sorted(OUT.glob("Drawer layouts*.png")) + sorted(OUT.glob("Sub cover*.png")):
        items.append((p, p.stem, "PNG"))
    return items


def downloads_html(site):
    """v14.1: the PDFs and HD pictures as a list of links: straight to the files on GitHub Pages, to GitHub from the deck."""
    base = "media-wall/out/" if site else GITHUB_OUT
    lis = "".join(f'<li><a href="{base}{urllib.parse.quote(p.name)}" target="_blank" rel="noopener">{html.escape(label)}</a><small>{kind}</small></li>'
                  for p, label, kind in downloads_list())
    return f'<ul class="dl">{lis}</ul>'


def published_name(p):
    return "files/" + re.sub(r"[^A-Za-z0-9._-]+", "_", p.name)


STYLE = """<style>
/* Layout: one column. The render is the hero with its controls under it; facts in a band; then the open questions,
   the buy tracker, the fit proof, the plans and the downloads, each a full-width section reached from the nav. */
:root {
  --bg: #eef0ea; --surface: #ffffff; --ink: #1d241e; --muted: #5b6457; --line: #d4d9cd; --oak: #9a6634; --chip: #e3e7dd; --note: #f5efe3;
  --ok: #2f7a4a; --ok-bg: #e2f0e5; --tight: #8a5a12; --tight-bg: #f6ead2; --check: #2b5f8f; --check-bg: #e1ecf6; --no: #a3352b; --no-bg: #f7e1de;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --body: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  /* v23, client: "make the page itself a better colour background and some customisations to make it more appealing": four page looks
     (data-skin on the root, chosen in the header, kept on each device), a header band, and larger text. Card Room is the default. */
  --bg: #e4eadd; --bg-top: #d3decb; --surface: #fbfaf5; --line: #ccd5c3; --chip: #dbe3d2;
  --hero: #2f4a3c; --hero-ink: #f3f0e6; --hero-muted: #c9d6c6; --hero-chip: #ffffff1f; --hero-link: #f0c58e; --hero-note: #ffffff14;
}
:root[data-skin="oak"] { --bg: #f1ebe0; --bg-top: #e7dcc8; --surface: #fffdf8; --line: #ddd2bf; --chip: #ebe2d2; --note: #f7efe1;
  --hero: #6b4a2b; --hero-ink: #fbf5ea; --hero-muted: #e6d3bb; --hero-chip: #ffffff22; --hero-link: #ffd9a8; --hero-note: #ffffff17; }
:root[data-skin="blue"] { --bg: #e5e9f0; --bg-top: #d3dbe8; --surface: #fbfcfe; --line: #cbd3e0; --chip: #dce2ec; --note: #eef1f7;
  --hero: #2c4466; --hero-ink: #f1f4fa; --hero-muted: #c7d2e5; --hero-chip: #ffffff1f; --hero-link: #f3c58f; --hero-note: #ffffff14; }
:root[data-skin="plain"] { --bg: #eef0ea; --bg-top: #eef0ea; --surface: #ffffff; --line: #d4d9cd; --chip: #e3e7dd;
  --hero: transparent; --hero-ink: #1d241e; --hero-muted: #5b6457; --hero-chip: #e3e7dd; --hero-link: #9a6634; --hero-note: #f5efe3; }
:root.bigtext { font-size: 112.5%; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #151a16; --surface: #1d231e; --ink: #e7ebe3; --muted: #9ba596; --line: #2f3830; --oak: #d9a46c; --chip: #262d27; --note: #262219;
  --ok: #8fd3a2; --ok-bg: #1f3325; --tight: #e8c07a; --tight-bg: #3a2f1a; --check: #9cc4ec; --check-bg: #1c2b3a; --no: #f0a59c; --no-bg: #3d211e; color-scheme: dark;
  --bg-top: #1b231d; --hero: #22352b; --hero-ink: #eef1ea; --hero-muted: #aebcad; --hero-chip: #ffffff1a; --hero-link: #e8b57c; --hero-note: #ffffff12; } }
:root[data-theme="dark"] { --bg: #151a16; --surface: #1d231e; --ink: #e7ebe3; --muted: #9ba596; --line: #2f3830; --oak: #d9a46c; --chip: #262d27; --note: #262219;
  --ok: #8fd3a2; --ok-bg: #1f3325; --tight: #e8c07a; --tight-bg: #3a2f1a; --check: #9cc4ec; --check-bg: #1c2b3a; --no: #f0a59c; --no-bg: #3d211e; color-scheme: dark;
  --bg-top: #1b231d; --hero: #22352b; --hero-ink: #eef1ea; --hero-muted: #aebcad; --hero-chip: #ffffff1a; --hero-link: #e8b57c; --hero-note: #ffffff12; }
body { background: linear-gradient(180deg, var(--bg-top) 0, var(--bg) 520px) no-repeat, var(--bg); color: var(--ink); font-family: var(--body); font-size: 16px; line-height: 1.55; }
.wrap { max-width: 1120px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 28px 56px; display: grid; gap: 32px; }
header { display: grid; gap: 10px; min-width: 0; background: var(--hero); color: var(--hero-ink); border-radius: 22px;
  padding: clamp(18px, 3.2vw, 34px); position: relative; overflow: hidden; }
:root[data-skin="plain"] header { padding: 0; border-radius: 0; }
header::after { content: ""; position: absolute; inset: auto -60px -90px auto; width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, var(--hero-chip), transparent 70%); pointer-events: none; }
header .eyebrow, header .lede, header .caption { color: var(--hero-muted); }
header a:not(.btn) { color: var(--hero-link); }
header .notice { background: var(--hero-note); color: var(--hero-ink); }
header .hlinks a.btn { background: var(--hero-chip); color: var(--hero-ink); }
header .hlinks a.btn:first-child { background: var(--oak); color: var(--surface); }
:root[data-skin="plain"] header .hlinks a.btn:not(:first-child) { background: var(--chip); color: var(--ink); }
.skin { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 13.5px; color: var(--hero-muted); position: relative; z-index: 1; }
.skin button { font: inherit; font-size: 13px; border: 1px solid #ffffff33; background: transparent; color: var(--hero-ink); border-radius: 999px; padding: 4px 10px 4px 6px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
.skin button[aria-pressed="true"] { background: var(--hero-chip); border-color: var(--hero-link); }
.skin button i { width: 14px; height: 14px; border-radius: 50%; display: inline-block; border: 1px solid #ffffff55; }
:root[data-skin="plain"] .skin button { border-color: var(--line); }
.skin label { display: inline-flex; gap: 6px; align-items: center; cursor: pointer; margin-left: 6px; }
h1 { font-family: var(--display); font-weight: 700; font-size: clamp(2rem, 5vw, 3.1rem); line-height: 1.05; margin: 0; letter-spacing: -0.01em; text-wrap: balance; }
.lede { color: var(--muted); margin: 0; max-width: 64ch; }
.change { margin: 0; max-width: 72ch; background: var(--note); border-left: 3px solid var(--oak); border-radius: 6px; padding: 10px 14px; }
nav.jump { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14.5px; }
a { color: var(--oak); text-underline-offset: 2px; }
a:focus-visible, summary:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--oak); outline-offset: 2px; }
.viewer { display: grid; gap: 14px; }
.frame { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.frame img { display: block; width: 100%; height: auto; }
.shotwrap { position: relative; }
[hidden] { display: none !important; }
.shotwrap .dims { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.controls { display: flex; flex-wrap: wrap; gap: 14px 28px; align-items: flex-start; }
.group { display: grid; gap: 6px; min-width: 0; }
.label { font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.seg { display: flex; flex-wrap: wrap; gap: 6px; }
.seg button, .btn { font: inherit; font-size: 14.5px; color: var(--ink); background: var(--chip); border: 1px solid transparent; border-radius: 999px; padding: 6px 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.seg button[aria-pressed="true"] { background: var(--surface); border-color: var(--oak); box-shadow: inset 0 0 0 1px var(--oak); }
.seg button:disabled, .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.primary { background: var(--oak); color: var(--surface); }
.dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.2); flex: none; }
.caption { color: var(--muted); font-size: 14px; margin: 0; }
.band { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; }
.band > section { min-width: 0; display: grid; gap: 10px; align-content: start; }
section.block { display: grid; gap: 14px; min-width: 0; scroll-margin-top: 16px; }
section.block > *, #fit-zones > * { min-width: 0; }
h2 { font-family: var(--display); font-weight: 500; font-size: 1.35rem; margin: 0; }
section.block > h2 { font-size: 1.6rem; font-weight: 700; }
.heights { list-style: none; margin: 0; padding: 0; border-left: 2px solid var(--line); }
.heights li { display: grid; grid-template-columns: 4.2rem 1fr; gap: 12px; padding: 5px 0 5px 12px; position: relative; }
.heights li::before { content: ""; position: absolute; left: -2px; top: 50%; width: 8px; height: 2px; background: var(--muted); }
.heights b { font-family: var(--mono); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
.counts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.counts div { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; min-width: 0; }
.counts strong { display: block; font-family: var(--display); font-size: 1.7rem; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.counts span { font-size: 13.5px; color: var(--muted); }
ul.plain, ol.plain { margin: 0; padding-left: 1.3rem; display: grid; gap: 8px; max-width: 80ch; }
.plans { display: grid; gap: 14px; }
.notice { background: var(--note); border-radius: 8px; padding: 10px 14px; margin: 0; font-size: 15px; }
.notice[hidden] { display: none; }
/* open questions */
.qhead { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; justify-content: space-between; }
.meter { display: flex; align-items: center; gap: 10px; font-size: 14.5px; color: var(--muted); }
.meter .bar { width: 140px; height: 8px; border-radius: 4px; background: var(--chip); overflow: hidden; }
.meter .bar i { display: block; height: 100%; width: 0; background: var(--ok); }
.qs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.q { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px; display: grid; gap: 8px; align-content: start; min-width: 0; }
.q.answered { border-color: var(--ok); }
.q h3 { margin: 0; font-size: 16px; line-height: 1.35; display: grid; grid-template-columns: 1.8rem 1fr; gap: 6px; }
.q h3 .n { font-family: var(--mono); font-size: 13px; color: var(--muted); padding-top: 2px; }
.q p { margin: 0; font-size: 14px; color: var(--muted); }
.q textarea { font: inherit; font-size: 15px; width: 100%; box-sizing: border-box; min-height: 64px; resize: vertical; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; background: var(--bg); color: var(--ink); }
.q .row { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.q .st { font-size: 13px; color: var(--muted); }
.q .st.ok { color: var(--ok); }
.q .st.err { color: var(--no); }
.photos { display: flex; flex-wrap: wrap; gap: 8px; }
.photos figure { margin: 0; position: relative; }
.photos img { width: 76px; height: 76px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); background: var(--chip); display: block; }
.photos button { position: absolute; top: 2px; right: 2px; font: inherit; font-size: 11px; line-height: 1; padding: 3px 5px; border-radius: 4px; border: 0; background: var(--surface); color: var(--ink); cursor: pointer; }
.upl { font-size: 14px; color: var(--oak); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.upl input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.upl:focus-within { outline: 2px solid var(--oak); outline-offset: 2px; border-radius: 4px; }
/* tracker */
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.tiles div { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
.tiles strong { display: block; font-family: var(--display); font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.tiles span { font-size: 13.5px; color: var(--muted); }
details.phase, details.zone { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
details.phase > summary, details.zone > summary { cursor: pointer; padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 6px 14px; justify-content: space-between; align-items: center; font-weight: 700; }
details[open] > summary { border-bottom: 1px solid var(--line); }
summary .zf, summary .pf { font-weight: 400; font-size: 14px; color: var(--muted); display: inline-flex; gap: 8px; align-items: center; flex-wrap: wrap; font-variant-numeric: tabular-nums; }
.items { list-style: none; margin: 0; padding: 4px 0; }
.items li { display: grid; grid-template-columns: 28px 1fr auto; gap: 4px 10px; padding: 8px 14px; align-items: start; border-top: 1px solid var(--line); }
.items li:first-child { border-top: 0; }
.items li.done .txt { color: var(--muted); }
.items input[type=checkbox] { width: 18px; height: 18px; margin-top: 3px; accent-color: var(--ok); }
.items .txt { min-width: 0; font-size: 15px; }
.items .meta { display: block; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.items .paid { display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--muted); }
.items .paid input { font: inherit; font-size: 14px; width: 5.5rem; padding: 3px 6px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--ink); font-variant-numeric: tabular-nums; }
@media (max-width: 520px) { .items li { grid-template-columns: 28px 1fr; } .items .paid { grid-column: 2; } }
/* fit proof */
.fitsum { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.pill { display: inline-block; font-size: 12.5px; font-weight: 700; border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
.pill.ok { color: var(--ok); background: var(--ok-bg); } .pill.tight { color: var(--tight); background: var(--tight-bg); }
.pill.check { color: var(--check); background: var(--check-bg); } .pill.no { color: var(--no); background: var(--no-bg); }
details.zone .caption { padding: 10px 14px 0; }
.scroll { overflow-x: auto; padding: 8px 14px 14px; }
table.fit { border-collapse: collapse; width: 100%; min-width: 640px; font-size: 14px; }
table.fit th { text-align: left; font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); font-weight: 500; padding: 6px 8px; border-bottom: 1px solid var(--line); }
table.fit td { padding: 7px 8px; border-bottom: 1px solid var(--line); vertical-align: top; font-variant-numeric: tabular-nums; }
table.fit sup { color: var(--muted); font-size: 10px; }
.fitonly table.fit tr.r-ok { display: none; }
.dl { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
.dl li { display: flex; justify-content: space-between; gap: 10px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; min-width: 0; }
.dl li span { min-width: 0; font-size: 15px; }
.dl li small { color: var(--muted); font-family: var(--mono); font-size: 12px; }
@media (prefers-reduced-motion: no-preference) { .frame img { transition: opacity .18s ease; } .meter .bar i { transition: width .3s ease; } }
/* v13.3: the plan in tabs. A sticky tab bar under the title; each tab is one panel of the plan, drawings on paper cards. */
:root { --paper: #fbfaf5; --paper-line: #e2ded2; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #ebe8de; --paper-line: #c9c4b4; } }
:root[data-theme="dark"] { --paper: #ebe8de; --paper-line: #c9c4b4; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
.eyebrow { margin: 0; font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.tabs { min-width: 0; position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); border-bottom: 1px solid var(--line); margin-top: -12px; }
.tabs .tl { display: flex; gap: 4px; overflow-x: auto; padding-block: 8px; scrollbar-width: thin; }
.tabs button { font: inherit; font-size: 14.5px; white-space: nowrap; background: none; border: 0; border-radius: 999px; padding: 7px 13px; color: var(--muted); cursor: pointer; flex: none; }
.tabs button:hover { color: var(--ink); background: var(--chip); }
.tabs button[aria-selected="true"] { background: var(--ink); color: var(--bg); }
.tabs button:focus-visible { outline: 2px solid var(--oak); outline-offset: 2px; }
.panel { display: grid; gap: 22px; min-width: 0; }
.panel > * { min-width: 0; }
.panel h2, .panel h3, .panel h4 { scroll-margin-top: calc(64px + env(safe-area-inset-top, 0px)); }
.ptitle { margin: 0; }
h2.ptitle { font-size: 1.6rem; font-weight: 700; }
h3.ptitle { font-family: var(--display); font-size: 1.25rem; font-weight: 700; }
.block { display: grid; gap: 12px; min-width: 0; }
.toc { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font: inherit; font-size: 13.5px; color: var(--ink); background: var(--chip); border: 0; border-radius: 999px; padding: 4px 11px; cursor: pointer; text-decoration: none; display: inline-flex; gap: 6px; align-items: center; }
.chip.h2 { background: var(--note); font-weight: 700; }
a.chip:hover, button.chip:hover { box-shadow: inset 0 0 0 1px var(--oak); }
/* plan text borrowed from the PDF */
.doc { min-width: 0; max-width: 100%; }
.doc > h2:first-child { margin-top: 0; }
.doc h2 { font-family: var(--display); font-weight: 700; font-size: 1.6rem; margin: 34px 0 10px; text-wrap: balance; }
.doc h3 { font-family: var(--display); font-weight: 700; font-size: 1.22rem; margin: 26px 0 8px; text-wrap: balance; }
.doc h4 { font-size: 1rem; margin: 18px 0 6px; }
.doc p, .doc ul, .doc ol { margin: 0 0 12px; max-width: 78ch; }
.doc ul, .doc ol { padding-left: 1.3rem; }
.doc li { margin-bottom: 5px; }
.doc sup { color: var(--muted); font-size: 10.5px; margin-left: 1px; }
.doc .note { color: var(--muted); font-size: 14.5px; }
.doc .notice { margin-bottom: 14px; }
.tscroll { overflow-x: auto; margin: 0 0 16px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.tscroll table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: 14.5px; }
.tscroll th { text-align: left; font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); font-weight: 500; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: bottom; }
.tscroll td { padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; font-variant-numeric: tabular-nums; }
.tscroll tr:last-child td { border-bottom: 0; }
.tscroll td.num { white-space: nowrap; }
.tscroll tr.total td { font-weight: 700; background: var(--note); }
.tscroll tr.ph td, .tscroll td.kg { background: var(--chip); font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.tscroll td.kn { width: 2rem; text-align: center; font-weight: 700; background: var(--note); }
.keycols { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0 16px; align-items: start; }
.keycols .tscroll table { min-width: 0; }
.doc figure { margin: 0 0 18px; }
.doc figure img { display: block; width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); background: var(--chip); }
.lightbox { position: fixed; inset: 0; z-index: 20; background: var(--bg); display: grid; grid-template-rows: auto 1fr;
  padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
.lbbar { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 10px max(16px, env(safe-area-inset-right, 0px)) 10px max(16px, env(safe-area-inset-left, 0px)); border-bottom: 1px solid var(--line); }
.lbscroll { overflow: auto; cursor: grab; touch-action: pan-x pan-y pinch-zoom; }
.lbscroll:active { cursor: grabbing; }
.lbwrap { position: relative; width: 1650px; max-width: none; }
.lbwrap img { display: block; width: 1650px; max-width: none; height: auto; user-select: none; -webkit-user-drag: none; }
.lbwrap #lb-dims { position: absolute; inset: 0; }
.doc figure.dia { background: var(--paper); border: 1px solid var(--paper-line); border-radius: 10px; padding: 12px; overflow-x: auto; }
.doc figure.dia svg { display: block; width: 100%; min-width: 640px; height: auto; }
.doc figcaption { color: var(--muted); font-size: 14px; margin-top: 8px; max-width: 78ch; }
.doc .decision, .doc .why, .doc .callout { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; margin: 0 0 16px; max-width: 78ch; }
.doc .callout ul, .doc .why ul { margin: 8px 0 0; }
.doc .confirm { background: var(--note); border-radius: 8px; padding: 10px 14px; font-size: 15px; }
.doc ul.checks, .doc ul.agreed { list-style: none; padding-left: 0; }
.doc ul.checks li, .doc ul.agreed li { padding-left: 1.5rem; position: relative; }
.doc ul.agreed li::before { content: "✓"; position: absolute; left: 0; color: var(--ok); font-weight: 700; }
.doc ol.sources { font-size: 14px; color: var(--muted); }
.doc .hero { display: grid; grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr); gap: 16px; align-items: start; margin-bottom: 16px; }
.doc .hero figure { margin: 0; }
.doc .summary { display: grid; gap: 10px; }
.doc .summary div { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
.doc .summary b { display: block; font-family: var(--display); font-size: 1.45rem; line-height: 1.15; font-variant-numeric: tabular-nums; }
.doc .summary span { font-size: 13.5px; color: var(--muted); }
@media (max-width: 720px) { .doc .hero { grid-template-columns: 1fr; } }
details.changes { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
details.changes > summary { cursor: pointer; padding: 10px 14px; font-weight: 700; }
details.changes > .doc { padding: 4px 14px 2px; }
/* how the build runs */
.runlist { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
.runlist li { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; display: grid; gap: 2px; min-width: 0; }
.runlist a { color: var(--ink); text-decoration: none; font-weight: 700; display: flex; gap: 10px; align-items: baseline; }
.runlist a:hover { color: var(--oak); }
.runlist .rn, .sn { font-family: var(--display); font-weight: 700; font-variant-numeric: tabular-nums; }
.runlist .rn { color: var(--oak); min-width: 1.4rem; }
.runlist .rm { font-size: 13.5px; color: var(--muted); padding-left: 2.0rem; }
/* v13.6: part labels and the one-part filter */
.part { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase;
  line-height: 1.3; padding: 2px 8px; border-radius: 999px; color: var(--ink); white-space: nowrap; vertical-align: middle;
  background: color-mix(in srgb, var(--pc) 13%, transparent); border: 1px solid color-mix(in srgb, var(--pc) 50%, transparent); margin-right: 4px; }
.part::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--pc); flex: none; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .part::before { background: color-mix(in srgb, var(--pc) 60%, white); } }
:root[data-theme="dark"] .part::before { background: color-mix(in srgb, var(--pc) 60%, white); }
.sparts { margin: 0 0 3px; display: flex; flex-wrap: wrap; gap: 4px; }
.runlist .rp { padding-left: 2.0rem; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.runlist li { align-content: start; }
summary .part { font-weight: 400; }
.pfilter { margin: 4px 0 14px; display: grid; gap: 6px; }
.pfilter .seg { flex-wrap: wrap; }
.step[hidden] { display: none; }
/* v13.7: lighting scenes */
.scenes { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; margin: 8px 0 18px; }
.scenes > * { min-width: 0; }
.scenes .seg { flex-wrap: wrap; }
.scene[hidden] { display: none; }
.scene ul { margin: 6px 0 0; }
/* build steps */
.steps-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.step { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: grid; gap: 10px; min-width: 0; scroll-margin-top: calc(64px + env(safe-area-inset-top, 0px)); }
.step > * { min-width: 0; }
.step.done { border-color: var(--ok); }
/* v22: build steps one at a time: the head (number, title, who and how long, Done) always shows; the rest opens */
.shead { cursor: pointer; }
.sopen { font: inherit; font-size: 14px; border: 1px solid var(--line); background: var(--chip); color: var(--ink); border-radius: 999px; padding: 5px 12px; cursor: pointer; }
.sopen:focus-visible { outline: 2px solid var(--oak); outline-offset: 2px; }
.sbody { display: grid; gap: 10px; min-width: 0; }
.sbody > * { min-width: 0; }   /* v29.1: a step's drawing (640 wide, it scrolls) no longer widens its Buy first and Parts boxes past a phone */
.sbody[hidden] { display: none; }
.step:not(.open) { padding-block: 10px; }
.snext { margin: 0; }
.sall { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin: 4px 0 10px; }
@media (max-width: 560px) { .shead { grid-template-columns: 2.2rem minmax(0, 1fr); } .shead .sdone, .shead .sopen { grid-column: 2; justify-self: start; } .shead .sopen { margin-top: -4px; } }
.shead { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr) auto; gap: 12px; align-items: center; }
.sn { width: 2.6rem; height: 2.6rem; border-radius: 50%; background: var(--chip); display: grid; place-items: center; font-size: 1.15rem; }
.step.done .sn { background: var(--ok); color: var(--surface); }
.shead h3 { margin: 0; font-family: var(--display); font-size: 1.2rem; font-weight: 700; }
.smeta { font-size: 13.5px; color: var(--muted); }
.sdone { display: inline-flex; gap: 6px; align-items: center; font-size: 14.5px; cursor: pointer; }
.sdone input { width: 18px; height: 18px; accent-color: var(--ok); }
.sbuy { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sbuy .label { margin-right: 4px; }
.sbuy .chip { background: var(--tight-bg); }
.sdo { margin: 0; padding-left: 1.3rem; display: grid; gap: 6px; max-width: 80ch; }
.scheck { margin: 0; background: var(--ok-bg); border-radius: 8px; padding: 8px 12px; font-size: 15px; max-width: 80ch; }
.ssee { margin: 0; font-size: 14px; color: var(--muted); }
.need { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 18px; background: var(--note); border-radius: 8px; padding: 10px 14px; }
.need h5 { margin: 0 0 4px; font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.need ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 3px; font-size: 14.5px; }
details.sdraw > summary { cursor: pointer; font-size: 14px; color: var(--oak); font-weight: 700; padding: 2px 0; }
details.sdraw figure.dia { margin: 8px 0 0; background: var(--paper); border: 1px solid var(--paper-line); border-radius: 10px; padding: 10px; overflow-x: auto; }
details.sdraw figure.dia svg { display: block; width: 100%; min-width: 640px; height: auto; }
.sfull { display: grid; gap: 4px; max-width: 80ch; }
.sfull h5 { margin: 10px 0 2px; font-family: var(--display); font-size: 1.02rem; font-weight: 700; }
.sfull ol { margin: 0; padding-left: 1.6rem; display: grid; gap: 6px; }
.sfull li::marker { font-variant-numeric: tabular-nums; color: var(--muted); }
/* cost by phase */
.chart { display: grid; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
.crow { display: grid; grid-template-columns: minmax(8rem, 13rem) minmax(0, 1fr) 9.5rem; gap: 4px 14px; align-items: center; }
.cl { color: var(--ink); text-decoration: none; font-size: 14.5px; font-weight: 700; display: grid; line-height: 1.25; }
.cl:hover { color: var(--oak); }
.cl small, .cv small { font-weight: 400; font-size: 12.5px; color: var(--muted); display: block; }
.ctrack { position: relative; height: 22px; background-image: linear-gradient(to right, var(--line) 1px, transparent 1px); background-size: calc(100% / var(--n)) 100%; border-right: 1px solid var(--line); }
.clo, .chi { position: absolute; top: 2px; height: 13px; background: var(--oak); }
.clo { left: 0; border-radius: 3px 0 0 3px; }
.chi { opacity: 0.35; border-radius: 0 3px 3px 0; }
.cpaid { position: absolute; left: 0; top: 17px; height: 4px; border-radius: 2px; background: var(--ok); }
.cv { font-size: 14px; font-variant-numeric: tabular-nums; text-align: right; }
.crow.axis { margin-top: -4px; }
.caxis { position: relative; height: 16px; font-family: var(--mono); font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
.caxis span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
.caxis span:first-child { transform: none; }
.caxis span:last-child { transform: translateX(-100%); }
.legend { margin: 4px 0 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--muted); }
.legend span { display: inline-flex; gap: 6px; align-items: center; }
.legend i { width: 18px; height: 10px; border-radius: 2px; background: var(--oak); display: inline-block; }
.legend i.k-hi { opacity: 0.35; } .legend i.k-pd { background: var(--ok); height: 4px; }
@media (max-width: 620px) {
  .crow { grid-template-columns: minmax(0, 1fr) auto; }
  .ctrack, .caxis { grid-column: 1 / -1; grid-row: 2; }
  .crow.axis > span { display: none; }
  .caxis span:nth-child(even) { display: none; }
}
#tracker { display: grid; gap: 10px; }
#tracker.f-left li.done, #tracker.f-left li[data-kind="job"], #tracker.f-jobs li[data-kind="buy"], #tracker.f-buys li[data-kind="job"], #tracker.f-jobs li.picknote { display: none; }
summary .pf a { color: var(--oak); }
/* v14: tab groups, the overview's dashboard, the table's two options, the 3D room and its gallery */
.hlinks { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 0; }
.hlinks a.btn { text-decoration: none; }
.hlinks a.btn:first-child { background: var(--oak); color: var(--surface); }
.tabs .tg { flex: none; align-self: center; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
  padding: 0 4px 0 12px; margin-left: 6px; border-left: 1px solid var(--line); }
.tabs .tg:first-child { border-left: 0; margin-left: 0; padding-left: 2px; }
.dash { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)); gap: 12px; }
.dcard { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; display: grid; gap: 6px; align-content: start; min-width: 0; }
.dcard strong { font-family: var(--display); font-size: 1.6rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.dcard a.caption { color: var(--oak); text-decoration: none; }
.dcard a.caption:hover { text-decoration: underline; }
.dbar { height: 8px; border-radius: 4px; background: var(--chip); overflow: hidden; }
.dbar i { display: block; height: 100%; width: 0; background: var(--ok); }
.d3d { position: relative; padding: 0; overflow: hidden; text-decoration: none; color: #fff; min-height: 150px; background: #0d100e; }
.d3d img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.d3d span { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 14px 10px; font-family: var(--display); font-weight: 700; font-size: 1.15rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.72)); }
.d3d:hover span { text-decoration: underline; }
@media (max-width: 860px) { .dash { grid-template-columns: repeat(3, minmax(0, 1fr)); } .d3d { grid-column: 1 / -1; aspect-ratio: 16 / 7; min-height: 0; } }
@media (max-width: 520px) { .dash { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .dcard { padding: 10px 12px; } .dcard strong { font-size: 1.2rem; }
  .dash .dcard:last-child { grid-column: 1 / -1; } }
.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.opt { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; min-width: 0; }
.opt img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #0d100e; }
.opt .ob { padding: 12px 14px 14px; display: grid; gap: 8px; align-content: start; }
.opt h3 { margin: 0; font-family: var(--display); font-size: 1.2rem; }
.opt ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 4px; font-size: 14.5px; }
.opt li::marker { content: "+  "; color: var(--ok); font-weight: 700; }
.opt li.minus::marker { content: "\u2212  "; color: var(--tight); }
.opt .btn { justify-self: start; }
.opt.noimg { grid-template-rows: 1fr; }
.opt p { margin: 0; font-size: 14.5px; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.gallery figure { margin: 0; display: grid; gap: 6px; }
.gallery button { padding: 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; cursor: zoom-in; background: #0d100e; }
.gallery img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.gallery figcaption { font-size: 13.5px; color: var(--muted); }
""" + room3d_page.CSS + """

/* v24, client: "give it a better overall design and ui": one card per long read, quieter headings with an oak rule, a floating
   tab bar, tables that read as tables, a contents sidebar on wide screens, folded captions, a footer */
:root { --tab-on: var(--hero); --tab-on-ink: var(--hero-ink); --shadow: 0 1px 2px #0000000a, 0 10px 28px -18px #00000040; }
:root[data-skin="plain"] { --tab-on: var(--ink); --tab-on-ink: var(--bg); }
.wrap { max-width: 1180px; gap: 28px; }
.tabs { background: color-mix(in srgb, var(--bg) 82%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 0; margin-top: -8px; }
.tabs .tl { padding: 5px; margin-block: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; box-shadow: var(--shadow); }
.tabs button[aria-selected="true"] { background: var(--tab-on); color: var(--tab-on-ink); }
.panel { gap: 24px; }
.panel > .doc { background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: clamp(18px, 3.2vw, 40px); box-shadow: var(--shadow); }
.panel > .doc > h2:first-child { margin-top: 0; }
.doc h2 { font-size: 1.55rem; letter-spacing: -0.005em; }
.doc h2::before { content: ""; display: block; width: 34px; height: 3px; border-radius: 2px; background: var(--oak); margin-bottom: 12px; }
.panel > .doc h2:not(:first-child) { margin-top: 48px; padding-top: 30px; border-top: 1px solid var(--line); }
.doc h3 { font-size: 1.15rem; margin-top: 30px; }
.doc p, .doc li { line-height: 1.62; }
.doc figure { margin-bottom: 22px; }
.doc figure img, .doc figure.dia { border-radius: 14px; }
.doc .decision, .doc .why, .doc .callout { border-radius: 14px; }
.ptitle::before { content: ""; display: block; width: 28px; height: 3px; border-radius: 2px; background: var(--oak); margin-bottom: 10px; }
.qhead .ptitle::before { display: none; }
.tscroll { border-radius: 14px; box-shadow: var(--shadow); }
.tscroll th { background: var(--chip); position: sticky; top: 0; }
.tscroll tr:nth-child(even) td { background: color-mix(in srgb, var(--chip) 38%, transparent); }
.dcard, .opt, details.phase, details.zone, details.changes, .step { border-radius: 16px; box-shadow: var(--shadow); }
.opt img { transition: transform .4s ease; }
.opt:hover img { transform: scale(1.02); }
@media (prefers-reduced-motion: reduce) { .opt img { transition: none; } .opt:hover img { transform: none; } }
button.more { font: inherit; font-size: inherit; color: var(--oak); background: none; border: 0; padding: 0 1px; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
button.more:focus-visible { outline: 2px solid var(--oak); outline-offset: 2px; }
/* the contents: a sticky sidebar on wide screens, one scrolling row of section links on narrow ones */
.toc { scrollbar-width: none; }
@media (min-width: 1100px) {
  .panel.has-toc { grid-template-columns: 200px minmax(0, 1fr); column-gap: 30px; align-items: start; }
  .panel.has-toc > .toc { grid-column: 1; grid-row: 1 / span 40; position: sticky; top: calc(78px + env(safe-area-inset-top, 0px));
    display: grid; gap: 1px; max-height: calc(100vh - 110px); overflow: auto; padding: 4px 2px 12px; }
  .panel.has-toc > :not(.toc) { grid-column: 2; }
  .toc .chip { background: none; border-radius: 8px; padding: 5px 10px; justify-content: flex-start; text-align: left; font-size: 13.5px; color: var(--muted); line-height: 1.3; }
  .toc .chip.h2 { color: var(--ink); font-weight: 700; background: none; margin-top: 10px; }
  .toc .chip.h2:first-child { margin-top: 0; }
  .toc .chip.on { background: var(--chip); color: var(--ink); box-shadow: inset 2px 0 0 var(--oak); }
}
@media (max-width: 1099px) {
  .toc { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .toc .chip { flex: none; }
  .toc .chip:not(.h2) { display: none; }
}
footer.foot { display: flex; flex-wrap: wrap; gap: 6px 18px; justify-content: space-between; align-items: center; color: var(--muted); font-size: 14px;
  border-top: 1px solid var(--line); padding-top: 18px; }
footer.foot a { color: var(--oak); }
</style>"""


def _drop_blocks(css, head):
    """Take every block that starts with head (and its nested braces) out of css."""
    out, i = [], 0
    while True:
        j = css.find(head, i)
        if j < 0:
            out.append(css[i:]); return "".join(out)
        out.append(css[i:j]); k, depth = css.index("{", j), 0
        for m in range(k, len(css)):
            depth += css[m] == "{"; depth -= css[m] == "}"
            if depth == 0:
                break
        i = m + 1


# v25: light only (no dark mode, no page looks); the v25 tokens and components go on the end
STYLE_V25 = re.sub(r':root\[data-(?:theme="dark"|skin="[a-z]+")\][^{]*\{[^}]*\}', "", _drop_blocks(STYLE, "@media (prefers-color-scheme: dark)")).replace("</style>", (HERE / "page.css").read_text() + "</style>")


TABS = [("overview", "Overview"), ("room", "Room in 3D"), ("views", "Drawn views"), ("ideas", "Ideas"), ("wall", "Media wall"), ("dining", "Dining table"), ("paint", "Paint & light"),
        ("network", "Network & power"), ("build", "Build steps"), ("buy", "Buy & costs"), ("checks", "Checks & sources")]
TAB_GROUPS = {"overview": "See it", "wall": "The plan", "build": "Do it"}   # v14: the tab bar in four groups
CAP3D = {"3d_room": "The whole room from above the window side, the window wall cut away",
         "3d_wall_film": "The media wall with the Film preset: bias light on, bar 1 off, the strips low",
         "3d_wall_drawers": "Every drawer out, the Cosy preset: the LP crates under the turntable, a slim game drawer beside them",
         "3d_sofa_cosy": "From the sofa, the Cosy preset: light on the deck, the ledge and the LP crates",
         "3d_pc_day": "The side wall in daylight: one oak run sweeping out to the PC, your blue sofa, the curtains",
         "3d_window_bright": "The Bright preset: every spot head straight down, evenly spread, the strips and the lamp filling in",
         "3d_pc_lit": "The Film preset with the PC lit: its fans and the RGB strip glowing behind the glass side",
         "3d_plants_corner": "Your plant stand (98 \u00d7 29.5 \u00d7 158) in the window's west corner (layout A, recommended).",
         "3d_records_breast": "Your vinyl stand (70 \u00d7 32 \u00d7 78) on the chimney breast (layout A): two face-out bays on top.",
         "3d_plants_breast": "Layout B: the plant stand on the breast instead (the ledge comes off, the frames go up).",
         "3d_ideas_window": "Idea, not in the plan: glass plant shelves across the window's reveal, beside your plant stand in the west corner",
         "3d_ideas_ctable": "The oak C-table over the sofa's open end, in your plan",
         "3d_glass_case": "The glass display case on the chimney breast, in the plan: 90 × 85 × 12, oak.",
         "3d_case_mixed": "The same case with a black frame and a bit of everything: 7-inch singles, a cap and figures, small plants.",
         "3d_case_singles": "The same case with a white frame, 7-inch singles face-out and a stack of tapes, in the Cosy preset",
         "3d_decor": "Decor to try (v20): sage-stripe rug, rust and ochre cushions and a throw on the sofa, white linen curtains",
         "3d_suggest": "Suggested furniture and decor, all of them on.",
         "3d_c_folded": f"The compact dining cabinet packed away: two oak boxes {G.CAB['len']:.0f} long under your shelf.",
         "3d_c_six": f"The compact cabinet open for six: the table door turned back flat over the chair door, the table {G.CAB['len_open']:g} long.",
         "3d_window_c_six": "From the window, the compact cabinet open for six, the coffee table where it is",
         "3d_c_tdoor": "The table door open with the table still folded: the table standing on its hinge rail.",
         "3d_c_chairs": "The chair door open, turned back flat over the table door: four folded chairs.",
         "3d_c_plan": "Bird\u2019s eye, the compact cabinet open for six",
         "3d_c_sit": "Sitting at the open table's far end, at a seated eye height: three a side.",
         "3d_c_foot": "From above, the cabinet folded, with the floor it needs once it's open drawn on the carpet.",
         "3d_beside_mirror": "Beside the cabinet, a tall mirror (IKEA NISSEDAL, 40 × 150) between it and the pipe boxing: more light.",
         "3d_beside_trolley_out": "The slim trolley pulled out for dinner, beside the window-side diners and clear of the table door's swing.",
         "3d_bar_shut": "The chimney breast: the glass case, and under it the drinks cabinet (a suggestion) with its oak front shut",
         "3d_ottoman": "The new storage ottoman: navy velvet, 76 square, its padded lid lifted.",
         "3d_beside_trolley": "Beside the cabinet, a slim trolley (VASAGLE, 20 deep) that pulls out for dinner to stand behind the window-side diners",
         "3d_beside_dresser": "Beside the cabinet, a low oak shelf in the cabinet's ply: plates on edge, glasses and bottles.",
         "3d_beside_rail": "Beside the cabinet, an oak blanket rail: five blankets over four oak rails, 12 off the wall.",
         # v37: the bar built in beside the cabinet, the shoe cabinets, your black shelf's 10 cm gap, the red lamp's cap
         "3d_beside_bar": "Beside the cabinet, the bar built in: a cupboard for bottles, an oak counter at 90.",
         "3d_beside_bar_open": "The built-in bar open in the evening: its doors back, the bottles inside, glasses hanging from the rail",
         "3d_beside_shoes": "Beside the cabinet, two shoe cabinets (a suggestion): IKEA TRONES, 18 deep, behind the open table door's line",
         "3d_shelf_gap": "Your black shelf's window end, always 10 cm short of the pipe boxing, your hanging plant on it",
         "3d_lamp_cap": "Your red lamp's cap: a structured six-panel crown and a flat, stiff brim 1.8 times a usual one, gold stitching",
         "3d_c_six_day": f"From the door in daylight: the compact cabinet open for six, the table {G.CAB['len_open']:g} long, three a side.",
         "3d_doll": "Dolls\u2019 house view: the compact cabinet packed away under your shelf",
         "3d_c80_folded": f"The more compact version packed away: the same two oak boxes round an 80-wide table, {G.CAB80['len']:.1f} long.",
         "3d_c80_six": f"The more compact version open for six: the table {G.CAB80['len_open']:g} × {G.CAB80['top'][0]:g}, three a side",
         "3d_c80_tdoor": "The more compact version, the table door open: its base is too narrow for two chairs lying down.",
         "3d_c80_plan": "Bird\u2019s eye, the more compact version open for six",
         "3d_look": "Look to try: walnut on every new oak piece, oak floorboards, your shelf in oak and white linen curtains."}
import item_shots as IS
import plan_ui as PU   # v33: one count, Decide, the shortlist, build day
CAP3D.update({stem: {"idea": "Idea (not in the plan): ", "sugg": "Suggested: ", "add": "In Edit room's Add list: "}[kd] + t
              for stem, kd, _k, t, _o in IS.items()})   # v32: a full render of every idea, suggestion and piece to add


def item_card(stem, kind, k, title, size, cost, why, where):
    """v32, client: "add function to add the new suggested furniture and decor in the room to see how it might look ... full renders":
    a card with its own HD still (tap for full size) and a button that switches it on in the room and flies to it."""
    o = IS.with_aim(stem, {"idea": IS.idea_opts, "sugg": IS.sugg_opts, "add": IS.add_opts}[kind](k))
    if kind == "add":   # added beside what you've already added, not instead of it
        a = o["added"][0]; o = {key: v for key, v in o.items() if key not in ("added", "layout")}
        o["addpiece"] = dict(type=k, x=a["x"], z=a["z"], **({"rot": a["rot"]} if "rot" in a else {}))
    o["merge"] = True
    lab = "Add it to my room" if kind == "add" else "Show it in my room"
    addp = (f' <button type="button" class="btn addplan" data-short="{kind}:{k}" aria-pressed="false"><span class="ms" aria-hidden="true">add</span><span class="t">Add to plan</span></button>'
            if kind in ("idea", "sugg") and cost else "")   # v33: the ideas shortlist
    meta = " · ".join(x for x in (html.escape(size), f"about £{cost[0]}–{cost[1]}" if cost else "") if x)
    return (f'<article class="opt" id="it-{kind}-{k}"><button type="button" class="g3d" data-full="{stem}"><img data-art="{stem}" alt="{html.escape(CAP3D[stem])}" loading="lazy"></button>'
            f'<div class="ob"><span class="label">{meta}</span><h3>{html.escape(title)}</h3>'
            + (f'<p>{html.escape(why)}</p>' if why else "") + (f'<p class="caption">{html.escape(where)}</p>' if where else "")
            + f"<button type='button' class='btn' data-r3d='{json.dumps(o)}'><span class='ms' aria-hidden='true'>view_in_ar</span> {lab}</button>{addp}</div></article>")


def ideas_panel():
    """v17: the ideas for later (ideas.py), a card each. v32: every one has its own full render and is in the 3D room."""
    import ideas as I
    cards = [item_card(f"3d_id_{k}", "idea", k, title, size, cost, why, where) for k, title, size, cost, why, where, _in3d in I.idea_options()]   # v43: the C-table is in the plan
    lo, hi = I.low_high()
    return (f'<div class="qhead"><h2 class="ptitle">Ideas for later</h2><span class="caption">Suggestions only: not in the plan, the buy list or the costs</span></div>'
            f'<p class="caption">Each is off until you turn it on. All together about £{lo}–{hi}.</p>'
            f'<div class="opts">{"".join(cards)}</div>' + suggest_block() + add_block() + decor_block())


def suggest_block():
    """v21, client: "i also want expansion of the suggested furniture and decor making sure i can choose to have it or not"."""
    import ideas as I
    allon = {k: True for k, *_ in I.SUGGEST}
    rows = "".join(item_card(f"3d_sg_{k}", "sugg", k, t, size, c, why, where) for k, t, size, c, why, where in I.SUGGEST)
    lo, hi = I.suggest_low_high()
    return (f'<div class="qhead"><h2 class="ptitle">Suggested furniture and decor</h2><span class="caption">Each one on or off, in the 3D room: none are in the plan or the costs</span></div>'
            f'<div class="gallery"><figure><button type="button" class="g3d" data-full="3d_suggest"><img data-art="3d_suggest" alt="{html.escape(CAP3D["3d_suggest"])}" loading="lazy"></button>'
            f'<figcaption>{html.escape(CAP3D["3d_suggest"])}</figcaption></figure></div>'
            f'<p class="caption">Each is off until you turn it on. All {len(I.SUGGEST)} together about £{lo}–{hi}.</p>'
            f'<div class="opts">{rows}</div>'
            f"<button type='button' class='btn' data-r3d='{json.dumps({'site': 'C', 'view': 'door', 'sugg': allon})}'>See them all in the 3D room</button>")


def add_block():
    """v32: Edit room's Add list, each piece with its own render; the button adds one to your room (drag it where you like)."""
    rows = "".join(item_card(f"3d_add_{k}", "add", k, lab, "", None, "", "") for k, lab in IS.ADD)
    return (f'<div class="qhead"><h2 class="ptitle">More to add, in Edit room</h2><span class="caption">Stand-ins at real-world sizes, each its own colour</span></div>'
            f'<p class="caption">“Add it to my room” puts one in the room; move or recolour it in Edit room.</p>'
            f'<div class="opts">{rows}</div>')


def decor_block():
    """v20, client: "give more decor variation and options": what the 3D room's Decor buttons do, with three looks."""
    import room3d_page as RP
    rows = "".join(f'<li><b>{html.escape(lab)}:</b> {html.escape(", ".join(n for _, n in opts))}</li>' for _, lab, opts in RP.DECOR)
    figs = "".join(f'<figure><button type="button" class="g3d" data-full="{k}"><img data-art="{k}" alt="{html.escape(CAP3D[k])}" loading="lazy"></button>'
                   f'<figcaption>{html.escape(CAP3D[k])}</figcaption></figure>' for k in ("3d_case_mixed", "3d_case_singles", "3d_decor"))
    b = ("<button type='button' class='btn' data-r3d='" + json.dumps({"site": "C", "view": "door", "decor": {"rug": "stripes", "cushions": "rust", "curtains": "linen"}})
         + "'>Try decor in the 3D room</button>")
    return (f'<div class="qhead"><h2 class="ptitle">Decor to try</h2><span class="caption">In the 3D room, under “Decor”: your choices are kept on this device</span></div>'
            f'<ul>{rows}</ul><p class="caption">Pick what goes in the glass case, and its frame, here.</p>'
            f'<div class="gallery">{figs}</div>{b}')


# v44 (the design review): Build in one card per thing you make, the guide's chapters, each with Buy · Cut · Build tabs
def _tabs(key, panes):
    """[(label, html)] as a tab row and its panes, the first shown."""
    bt = "".join(f'<button type="button" role="tab" id="tb-{key}-{i}" aria-selected="{str(i == 0).lower()}" aria-controls="tp-{key}-{i}" data-tab="{lab.lower()}">{lab}</button>'
                 for i, (lab, _h) in enumerate(panes))
    ps = "".join(f'<div class="tp doc" role="tabpanel" id="tp-{key}-{i}" aria-labelledby="tb-{key}-{i}" data-pane="{lab.lower()}"{"" if i == 0 else " hidden"}>{h}</div>'
                 for i, (lab, h) in enumerate(panes))
    return f'<div class="tabs" role="tablist" aria-label="Buy, cut, build">{bt}</div>{ps}'


def buy_list(rows):
    """A chapter's buy rows for a phone: name and £ on one line, the full text and the shop under it."""
    if not rows:
        return "<p class='note'>Nothing to buy.</p>"
    li = "".join(f'<li><span class="bq">{html.escape(str(q))}</span><b>{nm}</b><span class="bm">£{money(a, b)}</span><small>{full} · <i>{w}</i></small></li>'
                 for q, nm, full, a, b, w in rows)
    return (f'<ul class="blist">{li}<li class="tot"><span></span><b>Total</b><span class="bm">£{money(sum(r[3] for r in rows), sum(r[4] for r in rows))}</span></li></ul>'
            '<p><a href="#buy" data-go="buy">Tick them off in Buy</a></p>')


def piece_cards(rows):
    """v46, client: "drill down into tasks for each piece of the room when I click on them or look in the plans": the room by place, each
    place's pieces, each piece one card: Check, Buy (ticks shared with the buy list), Cut and Build (a tick per task). No order.
    Returns (the places' html, {step: the card that holds it})."""
    import build_doc as B, chapters as C, pieces as P
    was, B.DECK = B.DECK, True
    try:
        to = {1: "mk-start", 5: "mk-start"}
        SB = {st["n"]: st for st in B.steps()}
        name_of = {}
        for p in P.all_pieces():
            for n, _h in p["spec"]:
                name_of.setdefault(n, []).append(p["title"])
        def retarget(h):          # an instruction's "step 9" names the piece instead
            def rep(m):
                ns = name_of.get(int(m.group(2)))
                return f"<i>{ns[0].lower() if not ns[0].startswith(('The', 'Cables')) else ns[0]}</i>" if ns else m.group(0)
            return re.sub(r"\b([Ss])tep (\d+)\b(?!\s*·)", rep, h)
        buyid = lambda pre: [r for r in rows if r["kind"] == "buy" and any(_plain(r["item"]).startswith(x) for x in pre)]
        def head(p, cid, ntot, cost):
            pic = f'<span class="mkpic">{B.thumb(p["pic"], p["title"])}</span>' if p.get("pic") else f'<span class="mkpic mkic ms" aria-hidden="true">{"construction" if not p.get("job") else "bolt"}</span>'
            meta = " · ".join(x for x in (p["time"], p["who"], f"£{cost}" if cost else "") if x)
            return (f'<summary>{pic}<span class="mkt"><b>{html.escape(p["title"])}</b><small>{meta}</small></span>'
                    f'<span class="mkp" data-prog="{cid}" style="--p:0"><b>0</b>/{ntot}</span></summary>')
        def card(p):
            key = p["key"]; cid = ("job-" if p.get("job") else "mk-") + key
            for n, _h in p["spec"]:
                to.setdefault(n, cid)
            brows, trows = buyid(p["buy"]), P.tasks(p)
            cost = money(sum(r["lo"] for r in brows), sum(r["hi"] for r in brows)) if brows else ""
            chk = P.checks(key)
            need = P.NEEDS.get(key)
            check = ((f'<p class="mkneed"><span class="ms" aria-hidden="true">link</span> <b>First:</b> {html.escape(need)}</p>' if need else "")
                     + ("<ul class='mkchk'>" + "".join(f"<li><b>{it}</b><span>{sp}</span><small>{sa}</small></li>" for it, sp, sa in chk) + "</ul>" if chk
                        else "<p class='caption'>Nothing to measure first beyond the heights (Before you start).</p>"))
            buy = ("<ul class='mkbuy'>" + "".join(
                f'<li><label><input type="checkbox" data-buyproxy="{r["id"]}"><span><b>{html.escape(str(r["qty"]) + " × " if r["qty"] else "")}{_short_item(r["item"])}</b>'
                f'<small>£{r["est"]}</small></span></label></li>' for r in brows) + f'</ul><p><a href="#buy" data-go="buy">The whole buy list</a></p>' if brows else "<p class='caption'>Nothing to buy.</p>")
            tasks = ("<ol class='mktasks'>" + "".join(
                f'<li data-task="{tid}" data-step="{n}"><label class="tk"><input type="checkbox" data-task="{tid}"><span>{html.escape(t)}</span></label>'
                f'<details class="how"><summary>How</summary><ol>{"".join(f"<li>{retarget(x)}</li>" for x in items)}</ol></details></li>'
                for tid, t, items, n in trows) + "</ol>")
            draw = "".join(f"<figure>{getattr(__import__('diagrams'), B.DIAGRAMS[d])()}</figure>" for n, h in p["spec"] if h is None
                           for d in C.CH_DRAW.get(n, []) if d in B.DIAGRAMS)
            bday = "".join(f'<button type="button" class="btn" data-bday="{n}"><span class="ms" aria-hidden="true">handyman</span> Build day</button>' for n, h in p["spec"] if h is None)
            chk_step = "".join(f"<p class='callout'><b>Check when done:</b> {SB[n]['check']}</p>" for n, h in p["spec"] if h is None)
            build = tasks + (f"<details class='fold'><summary>Drawings</summary>{draw}</details>" if draw else "") + chk_step + bday
            panes = [("Check", check), ("Buy", buy)] + ([("Cut", C.cut_html(p["cut"]))] if p["cut"] else []) + [("Build", build)]
            nt = len(trows) + len(brows)
            return (f'<details class="mk{" job" if p.get("job") else ""}" name="mk" id="{cid}" data-piece="{key}" data-steps="{" ".join(str(n) for n, _h in p["spec"])}">'
                    + head(p, cid, nt, cost) + f'<div class="mkb"><p class="lede">{html.escape(p["what"])}</p>{_tabs(key, panes)}</div></details>')
        start = ('<details class="mk job" name="mk" id="mk-start" data-steps="1 5"><summary><span class="mkpic mkic ms" aria-hidden="true">straighten</span>'
                 '<span class="mkt"><b>Before you start: measure and mark</b><small>½ day · You</small></span></summary>'
                 '<div class="mkb"><div class="doc">' + C.RULES + C.build_html([(1, None), (5, None)], full_step_extras=False)
                 + f'<details class="fold"><summary>The measuring sheet</summary>{fit.measure_html()}</details></div></div></details>')
        out = []
        for pid, name, ps in P.by_place():
            cards = "".join(card(p) for p in ps) + (start if pid == "whole" else "")
            out.append(f'<section class="place" id="pl-{pid}"><div class="sec-h"><h2>{html.escape(name)}</h2><span class="plp" data-plprog="{pid}"></span></div><div class="mks">{cards}</div></section>')
        return deck_section("".join(out)), to
    finally:
        B.DECK = was


def _short_item(item):
    """A buy row's name: its own words up to the first colon or bracket."""
    t = _plain(item)
    return html.escape(re.split(r"[:(]", t)[0].strip().rstrip(","))


# v44: each cost piece's card in Build
HOW = {"The media wall": "mk-base", "The side wall and the PC": "mk-sidewall", "The dining cabinet": "mk-cabinet", "The chimney breast": "mk-glasscase",
       "Lighting": "job-lighting", "Paint": "job-paint", "Network": "job-network", "Electrics (your own job)": "job-cables",
       "Power and cables": "job-cables", "TV, consoles and AV": "job-connect", "Vinyl kit": "job-connect"}


def cost_overview():
    """v32, client: "a cost overview that shows each piece and list breakdown of shopping items ... clear buy list and estimated cost
    without incorporating large explanations": each piece, its things to buy (quantity × short name) and their estimates."""
    import costs
    ov = costs.overview(TRACK)
    tl, th = sum(r[1] for r in ov), sum(r[2] for r in ov)
    cards = "".join(
        f'<details class="cpiece"><summary><span class="cpn">{html.escape(p)}</span><span class="cpc">£{money(lo, hi)}</span><span class="cpi">{len(items)} to buy</span></summary>'
        f'<table class="ctab"><tbody>' + "".join(f'<tr><td class="q">{html.escape(costs.qty(q))}</td><td>{html.escape(n)}</td><td class="m">£{money(a, b)}</td></tr>' for q, n, a, b in items)
        + '</tbody></table>' + (f'<p class="cmk"><a class="btn" href="#{HOW[p]}" data-mk="{HOW[p]}" data-tab="build"><span class="ms" aria-hidden="true">construction</span> How to make it</a></p>' if p in HOW else "")
        + '</details>' for p, lo, hi, items in ov)
    return (f'<div class="qhead"><h3 class="ptitle">Cost overview</h3><span class="caption">Each piece, what to buy for it, and about what it costs: £{money(tl, th)} in all</span></div>'
            f'<div class="cpieces">{cards}</div>'
            f'<p class="cfoot"><button type="button" class="btn" id="co-copy"><span class="ms" aria-hidden="true">content_copy</span> Copy the shopping list</button>'
            f'<button type="button" class="btn" id="co-all">Open them all</button><span class="caption" id="co-st" aria-live="polite"></span></p>'
            f'<textarea id="co-text" hidden>{html.escape(costs.text(TRACK, money))}</textarea>')


def chairs_card():
    """v20, client: "is it not possible to build the chair storage into the table setup. i want it to be a fully pack away setup": the chair
    cupboard built in beside the table, flush with the pipe boxing; the open hooks stay as the cheap way; chairs five and six."""
    g = G
    CB = g.CHAIR_STORE["cupboard"]
    w = CB["z"][0] - CB["z"][1]
    sh = json.dumps({'site': 'B', 'dining': 'folded', 'chairs': 'cupboard', 'view': 'dining', 'scene': 'bright'})
    op = json.dumps({'site': 'B', 'dining': 'folded', 'chairs': 'open', 'view': 'chairs', 'scene': 'bright'})
    return f"""<div class="opts">
  <article class="opt"><img data-art="3d_chairs_shut" alt="{html.escape(CAP3D['3d_chairs_shut'])}" loading="lazy">
    <div class="ob"><span class="label">With the flip-top (the alternative) · about £120–240</span><h3>A chair cupboard, built in beside the table</h3>
    <ul><li>Oak, {w:.0f} wide × {CB['d']:.0f} deep × {CB['h']:.0f} tall, in the gap at the table's window end, flush with the pipe boxing and under your shelf.</li>
    <li>Four folded chairs inside: two on its floor, two on its shelf, one behind the other. Two doors on push latches.</li>
    <li>The table and its chairs pack away together: the wall reads as one built-in piece.</li>
    <li class="minus">Six fit if it's built {CB['d6']:.0f} deep: it then stands {CB['d6'] - CB['d']:.0f} cm proud of the boxing.</li></ul>
    <button type="button" class="btn" data-r3d='{sh}'>See it shut in 3D</button> <button type="button" class="btn" data-r3d='{op}'>See it open</button></div></article>
  <article class="opt"><img data-art="3d_chairs" alt="{html.escape(CAP3D['3d_chairs'])}" loading="lazy">
    <div class="ob"><span class="label">Using it</span><h3>Doors open, four chairs inside</h3>
    <ul><li>Its doors are hinged on the table's side and open right back (165°), so the chairs come straight out to the table.</li>
    <li>Open the table first, then take the chairs out; fold the table last.</li>
    <li class="minus">The open hooks (about £8–15) still work if you'd rather not build it.</li></ul></div></article>
  <article class="opt noimg"><div class="ob"><span class="label">More ways (v23) · options</span><h3>Behind the folded top, or a fold-down seat</h3>
    <ul><li>Four more chairs can hang behind the folded top on a backboard {g.BEHIND_TOP['gap']:.0f} cm deeper: with the cupboard, all six (or eight) pack away.</li>
    <li>A fold-down oak seat in the {g.CHAIR_STORE['stair_gap'][0] - g.CHAIR_STORE['stair_gap'][1]:.0f} cm gap at the stair end: a fifth place that's always there.</li>
    <li class="minus">Behind the top, the table stands {g.BEHIND_TOP['gap']:.0f} cm further into the room. Under the stairs is brick: chairs five and six otherwise go in the garage.</li></ul>
    <button type="button" class="btn" data-r3d='{json.dumps({"site": "B", "dining": "folded", "view": "dining", "seat": "down"})}'>See the seat in 3D</button></div></article>
</div>"""


def options_card():
    """v14: the table's places side by side, with a way into the 3D room for each (v27: the dining cabinet first, the plan). v33, client: "The
    compact cabinet is our only choice for the table now or any upgraded more compact version for this as we're trying to optimise space":
    the compact cabinet with its 90-wide table (the plan) beside the more compact version, an 80-wide table, 10 shorter."""
    g = G
    import fit
    K, K8 = g.CAB, g.CAB80
    st, s8 = fit.optc_seats(K), fit.optc_seats(K8)
    plate = 27.0
    def btn(opts, lab, cls="btn"):
        return f"<button type=\"button\" class=\"{cls}\" data-r3d='{json.dumps(opts)}'>{lab}</button>"
    def card(k, C, t, img, lab, h3, extra, minus):
        base = {"site": "C", "cab": "compact", "cabw": k, "scene": "bright"}
        rows = [("On the wall", f"{C['len']:.1f} × {C['d']:g} × {C['h']:g}, two oak boxes"),
                ("Wall left free", f"{C['freed']:.1f} by the pipe boxing"),
                ("At the table", f"<b>{t['comfort']} in comfort</b>, three a side, {t['stair'][1]:.0f} of edge each"),
                ("Across the table", f"{C['top'][0]:g} wide: {C['top'][0] - 2 * plate:g} down the middle between two plates"),
                ("Chairs inside", extra),
                ("The table door", f"{C['door_tw']:g} wide, turned back flat over the chair door")]
        dl = "".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in rows)
        return (f'<article class="opt{" on" if k == "90" else ""}"><img data-art="{img}" alt="{html.escape(CAP3D[img])}" loading="lazy">'
                f'<div class="ob"><span class="label">{lab}</span><h3>{h3}</h3><dl class="cmp">{dl}</dl>'
                + "".join(f'<p class="caption minus">{m}</p>' for m in minus)
                + btn(dict(base, dining="six", view="dining"), "See it open in 3D") + " "
                + btn(dict(base, dining="folded", chairs="cupboard", tdoor=False, view="dining"), "See it shut") + " "
                + btn(dict(base, dining="folded", chairs="open", tdoor=False, view="chairs"), "The chairs inside")
                + f' <button type="button" class="btn ghost" data-decide="cabw" data-v="{k}">Pick this one</button></div></article>')
    return ('<div class="opts cmp2">'
            + card("90", K, st, "3d_c_six", f"The plan · {K['len']:.1f} cm of wall", "The compact cabinet, a 90-wide table",
                   f"All six of your padded chairs: four standing, two lying in the base", ["Push the ottoman to the sofa while it's out."])
            + card("80", K8, s8, "3d_c80_six", f"The more compact version · {K8['len']:.1f} cm of wall", "The same cabinet, an 80-wide table",
                   f"Four standing; the base is {K8['bay_t']:g} wide, too narrow for two lying ({g.CHAIR_PADDED['folded'][2]:g} + 1)",
                   [f"{K['len'] - K8['len']:.0f} shorter, {K8['freed'] - K['freed']:.0f} more bare wall, but two chairs live elsewhere (the garage, or behind a door).",
                    f"{K['top'][0] - K8['top'][0]:g} narrower: a jug and one dish down the middle at a time."])
            + '</div><p class="caption">Tap the cabinet in the 3D room to swap its width; the Plan home\'s “Waiting on you” keeps your pick.</p>')


def gallery3d():
    figs = "".join(f'<figure><button type="button" class="g3d" data-full="{k}"><img data-art="{k}" alt="{html.escape(CAP3D[k])}" loading="lazy"></button>'
                   f'<figcaption>{html.escape(CAP3D[k])}</figcaption></figure>' for k, *_ in SHOTS3D if not k.startswith(("3d_ideas_", "3d_case_", "3d_decor", "3d_suggest", "3d_seat", "3d_id_", "3d_sg_", "3d_add_")))
    return f'<div class="gallery">{figs}</div>'

TABNAME = dict(TABS)
SEC_TAB = {"1": "overview", "2": "overview", "3": "wall", "4": "wall", "5": "dining", "6": "wall", "7": "wall", "8": "paint",
           "9": "network", "10": "build", "11": "buy", "12": "checks"}


LINKNAME = {"overview": "plan", "room": "3D room", "views": "Drawn views chapter", "ideas": "Ideas", "wall": "Media wall chapter", "dining": "Dining wall chapter",
            "paint": "Paint & light chapter", "network": "Network & power chapter", "build": "Build steps", "buy": "Buy list", "checks": "Fit proof"}


def _tablink(tab):
    return f'<a href="#{tab}" data-go="{tab}">{LINKNAME[tab]}</a>'


def scenes_block():
    """v13.7: the lighting scenes as buttons: one scene's drawing and notes at a time."""
    import scenes as SC
    import diagrams as D
    btns = "".join(f'<button type="button" data-scene="{k}" aria-pressed="{"true" if i == 0 else "false"}">{html.escape(name)}</button>'
                   for i, (k, name, *_r) in enumerate(SC.SCENES))
    panes = "".join(f'<div class="scene" data-sc="{k}"{"" if i == 0 else " hidden"}><figure><svg-placeholder/>{D.light_scene(k)}</figure>'
                    f'<ul>{"".join(f"<li>{x}</li>" for x in notes)}</ul></div>'
                    for i, (k, name, desc, lv, notes) in enumerate(SC.SCENES))
    return (f'<div class="scenes"><div class="seg" role="group" aria-label="Lighting scene" id="scene-btns">{btns}</div>{panes}</div>').replace("<svg-placeholder/>", "")


def deck_section(html_):
    """A plan section made fit for a tab: cross-references become tab links, wide tables scroll, drawings sit on paper."""
    html_ = re.sub(r"<!--fit-->.*?<!--/fit-->", f'<p class="notice">Every zone\'s checks, with a filter for the tight ones, are in the {_tablink("checks")}.</p>', html_, flags=re.S)
    html_ = re.sub(r"<!--confirm-->.*?<!--/confirm-->", "", html_, flags=re.S)
    html_ = re.sub(r"<!--scenes-->.*?<!--/scenes-->", lambda m: scenes_block(), html_, flags=re.S)
    html_ = html_.replace("Full-resolution renders come with this plan.", f"Switch views and greens in the {_tablink('views')}.")
    html_ = html_.replace("need a check on site (section 3)", f"need a check on site ({_tablink('checks')})")
    html_ = re.sub(r"\(section (\d+)\)", lambda m: "(" + _tablink(SEC_TAB[m.group(1)]) + ")", html_)
    html_ = re.sub(r"\bsection (\d+)\b", lambda m: "the " + _tablink(SEC_TAB[m.group(1)]), html_)
    html_ = html_.replace("<figure><svg", '<figure class="dia"><svg')
    html_ = html_.replace("<table", '<div class="tscroll"><table').replace("</table>", "</table></div>")
    return html_


def phase_data(rows):
    phases = []
    for r in rows:
        if r["phase"] not in [p["name"] for p in phases]:
            phases.append({"name": r["phase"], "lo": 0, "hi": 0, "n": 0})
        p = next(p for p in phases if p["name"] == r["phase"])
        p["lo"] += r["lo"]; p["hi"] += r["hi"]; p["n"] += 1
    first = {}
    for s in steps():
        for ph in s["buy"]:
            first.setdefault(ph, s["n"])
    run_lo = run_hi = 0
    for i, p in enumerate(phases):
        run_lo += p["lo"]; run_hi += p["hi"]
        p.update(idx=i, step=first.get(p["name"]), run=(run_lo, run_hi), label=re.sub(r"^\d+ ", "", p["name"]))
    return phases


def cost_chart(phases):
    step = 200
    top = step * -(-max(p["hi"] for p in phases) // step)
    pct = lambda v: f"{100 * v / top:.2f}%"
    rows = []
    for p in phases:
        val = f"£{money(p['lo'], p['hi'])}" if p["hi"] else "no cost"
        rows.append(
            f'<div class="crow" data-ph="{p["idx"]}"><a class="cl" href="#buy" data-go="buy" data-phase="{p["idx"]}">{html.escape(p["label"])}'
            f'<small>{"before step " + str(p["step"]) if p["step"] else ""}</small></a>'
            f'<div class="ctrack" style="--n:{top // step}"><span class="clo" style="width:{pct(p["lo"])}"></span>'
            f'<span class="chi" style="left:{pct(p["lo"])};width:{pct(p["hi"] - p["lo"])}"></span><span class="cpaid" style="width:0"></span></div>'
            f'<span class="cv">{val}<small class="cpv"></small></span></div>')
    ticks = "".join(f'<span style="left:{pct(v)}">£{v:,}</span>' for v in range(0, top + 1, step))
    return (f'<div class="chart" role="img" aria-label="Estimated cost of each build phase, low to high, on one scale from £0 to £{top:,}, with the amount paid so far">'
            + "".join(rows) + f'<div class="crow axis" aria-hidden="true"><span></span><div class="caxis">{ticks}</div><span></span></div>'
            '<p class="legend"><span><i class="k-lo"></i>Low estimate</span><span><i class="k-hi"></i>Up to the high estimate</span><span><i class="k-pd"></i>Paid so far</span></p></div>')


def uniq_svgs(html_):
    """Give every inline drawing its own ids: the same drawing can appear twice (in its tab and in a build step), and a
    pattern or gradient defined in a hidden tab doesn't paint in a visible one."""
    count = [0]
    def one(m):
        count[0] += 1
        svg, tag = m.group(0), f"d{count[0]}"
        for i in set(re.findall(r'id="([^"]+)"', svg)):
            svg = (svg.replace(f'id="{i}"', f'id="{tag}-{i}"').replace(f"url(#{i})", f"url(#{tag}-{i})")
                   .replace(f'href="#{i}"', f'href="#{tag}-{i}"'))
        return svg
    return re.sub(r"<svg\b.*?</svg>", one, html_, flags=re.S)


def page(site=False):
    """v24: the page without round markers in its text (tidy.strip_versions) and with long captions folded (tidy.shorten_captions)."""
    import tidy
    return tidy.shorten_captions(tidy.strip_versions(_page(site)))


def _ph(rows, *names):
    """Low and high for buy-list phases, by name."""
    lo = sum(r["lo"] for r in rows if r["phase"] in names); hi = sum(r["hi"] for r in rows if r["phase"] in names)
    return f"£{money(lo, hi)}"


# v25: the Plan sheet's chapters: (key, title, icon, hue, one line for the tile)
CHAPTERS = [("c-room", "The room", "home", 50, "Sizes, the door, the stairs, the window"),
            ("wall", "The media wall", "tv", 300, "Heights, the TV, the bays"),
            ("records", "Records & turntable", "album", 345, "LPs, crates, the vinyl stand"),
            ("side", "The side wall", "desktop_windows", 235, "One oak run out to the PC"),
            ("joinery", "Oak joinery", "carpenter", 70, "Joints, the cutting list"),
            ("dining", "The dining wall", "table_restaurant", 50, "The dining cabinet, six chairs inside"),
            ("paint", "Paint & light", "palette", 165, "Your pale mint, four presets"),
            ("network", "Network & power", "router", 25, "Decos, switches, the electrics"),
            ("views", "Drawn views", "draw", 125, "Every view in four greens"),
            ("fit", "Fit proof", "straighten", 95, "Every item against its size"),
            ("downloads", "Downloads", "download", 165, "The PDFs and the drawn pictures")]
PAGE_PART = {"Prep": 95, "Network": 235, "Power & cables": 25, "Paint": 165, "Media wall": 300, "Dining table": 70, "Lighting": 125, "AV": 345}


def chapter_facts(rows, fc, nfit):
    """v25: four to six key facts for each chapter, from geometry, fit, the buy list and ideas, so they follow the next round."""
    import scenes as SC
    import render as RR
    g = G
    chips = lambda *xs: '<ul class="facts">' + "".join(f"<li>{x}</li>" for x in xs) + "</ul>"
    heights = [(g.CEIL, "Ceiling"), (g.HIGH_TOP, "High shelf"), (g.LEDGE_TOP, "Record ledges, the PC shelf"), (g.CAB["h"], "The dining cabinet's top"),
               (g.RZ_SHELF_TOP, "Series X shelf"), (116.5, "TV centre"), (g.NOW_LEDGE["top"], "“Now playing” ledge"), (g.WORKTOP, "Oak worktop"), (g.PLINTH, "Plinth")]
    flist = '<ul class="flist">' + "".join(f"<li><b>{v:g}</b><span>{html.escape(t)}</span></li>" for v, t in sorted(heights, key=lambda x: -x[0])) + "</ul>"
    paints = "".join(f'<li><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:{h};vertical-align:-2px;margin-right:6px"></span>{html.escape(n.replace("Farrow & Ball ", "").replace("Little Greene ", ""))}{" (chosen)" if k == RR.MAIN_PAINT else ""}</li>'
                     for k, (h, n) in RR.PAINTS.items())
    return {
        "c-room": chips(f"<b>{g.CEIL:g}</b> ceiling", f"<b>{g.ALC_W:g} × {g.ALC_D:g}</b> alcove", "Door hinged on the breast side, opens in",
                        "A straight stair flight, rising towards the door", f"<b>{g.WINDOW_REVEAL + g.SILL['nose']:g}</b> window ledge ({g.WINDOW_REVEAL:g} reveal + {g.SILL['nose']:g} nose)", "Soft grey carpet"),
        "wall": flist + chips('LG C6 55" on its stand', "Artisan oak in your pale mint", "Steps 6–10", _ph(rows, "4 Base unit", "5 Oak joinery")),
        "records": chips(f"<b>~{g.ALL_LPS}</b> LPs", f"<b>{g.WALL_LPS}</b> face-out in the wall", f"<b>{g.STAND_LPS}</b> in the vinyl stand (70 × 32 × 78)",
                         "Two snug LP crates (33 cm trough) in bay 3", f"Game drawers: about <b>{48 + g.SLIM_GAMES}</b> games", f"Series X shelf at {g.RZ_SHELF_TOP:g}; the lid opens to {g.LID_CLEAR_TO:g}"),
        "side": chips("One oak run sweeping out to the PC", f"PC shelf at <b>{g.LEDGE_TOP:g}</b>", "Leads through a brush grommet into conduit in the wall", "A warm LED strip underneath", "Step 10"),
        "joinery": chips("The cutting list (copy it for the timber merchant)", "Housings, mortises and pegs: the joints drawing", "Worktop: step 7", "Uprights: step 9",
                         "Oak joinery " + _ph(rows, "5 Oak joinery")),
        "dining": chips(f"The compact dining cabinet: <b>{g.CAB['len']:g} × {g.CAB['d']:g} × {g.CAB['h']:g}</b> under your shelf, flush with the pipe boxing",
                        f"Table <b>{g.CAB['len_open']:g} × {g.CAB['top'][0]:g}</b>: six in comfort, three a side", f"All <b>six</b> of your grey padded folding chairs inside it, folded 90 × 10 × 47",
                        f"Beside it, {g.BESIDE['len']:.0f} cm of wall: a mirror, a slim trolley or a low oak shelf (ideas)",
                        "Two hinged oak doors that turn right back; a linen shelf inside", f"Step 11 builds it, in {len(__import__('instructions').full()[11]['parts_full'])} stages", "Dining wall " + _ph(rows, "6 Dining wall"),
                        f"Or the more compact version: an {g.CAB80['top'][0]:g}-wide table, {g.CAB80['len']:.1f} long, four chairs inside"),   # v27; v30: the compact cabinet; v33: the only table
        "paint": f'<ul class="facts">{paints}</ul>' + chips(*[f"<b>{n}</b> {html.escape(SC.COLOURS[k])}" for k, n, *_ in SC.SCENES])
                 + chips("Smart E14 bulbs in both bars, no dimmers", "Paint " + _ph(rows, "3 Paint"), "Lighting " + _ph(rows, "7 Lighting")),
        "network": chips("Virgin Hub 5 in modem mode", "Three Deco X1500s", "Two TL-SG108 switches", "Cat6 runs on step 3",
                         "The electrics are your own job: like for like, not notifiable under Part P, with the stop-and-call list", "The 10-gang feeds the PC"),
        "views": chips("5 views × 4 greens", "A numbered key", "Measurements over any view", "Full size, to pan and zoom"),
        "fit": chips(f"<b>{nfit}</b> checks", f"<b>{fc[fit.PASS]}</b> fit", f"<b>{fc[fit.TIGHT]}</b> tight", f"<b>{fc[fit.CHECK]}</b> to check on site", f"<b>{fc[fit.NO]}</b> don't fit"),
        "downloads": chips(f"The plan, {LABEL} (PDF)", f"The build guide, {LABEL} (PDF)", "The drawn pictures; 3D ones from the room", "On GitHub Pages and the shared plan page"),
    }


def preset_cards():
    """v25: the three lighting presets as cards (levels, colour, notes) and the two rules, for the Paint & light chapter."""
    import scenes as SC
    icons = {"evening": "wb_twilight", "bright": "light_mode", "cosy": "local_fire_department", "film": "movie"}
    cards = "".join(
        f'<article class="opt noimg" style="background:oklch(0.94 0.07 95) !important"><div class="ob"><span class="label"><span class="ms" aria-hidden="true">{icons[k]}</span> Preset</span><h3>{html.escape(n)}</h3>'
        f'<p>{html.escape(d)}</p><p class="caption">{html.escape(SC.COLOURS[k])}</p>'
        f'<ul class="facts" style="--h:95">' + "".join(f"<li>{html.escape(lab.split(',')[0].replace(' and the side shelf', ''))}: {SC.level_word(lv[lk])}</li>" for lk, lab, _c in SC.LAYERS) + "</ul>"
        f'<ul>' + "".join(f"<li>{html.escape(x)}</li>" for x in notes) + '</ul>'
        f"<button type='button' class='btn' data-r3d='{json.dumps({'scene': k, 'view': 'room'})}'>Try it in the room</button></div></article>"
        for k, n, d, lv, notes in SC.SCENES)
    rules = '<div class="notice"><b>Two rules</b><ul>' + "".join(f"<li>{html.escape(r)}</li>" for r in SC.RULES) + "</ul></div>"
    return f'<div class="opts">{cards}</div>{rules}'


def ring(key, hue, label, go):
    k = "steps" if key == "build" else key
    return (f'<a class="ring" id="d-{k}-bar" href="#{go}" data-go="{go}" style="--h:{hue}"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="tr" cx="40" cy="40" r="34"/>'
            f'<circle class="vl" cx="40" cy="40" r="34"/></svg><b id="d-{k}">0</b><span>{label}</span></a>')


def before_after(prefix=""):
    """v39, UPGRADE_PLAN_v38 item 13 ("before and after: your own photos beside the 3D room from the same spot, with a slider")."""
    pairs = (("stairs", "The stairs wall, from the sofa", "The dining cabinet and the bar"),
             ("window", "The window and the sofa, from the stairs", "The media wall and the record table"))
    out = ""
    for k, t, cap in pairs:
        out += (f'<figure class="ba" style="--ba:50%"><div class="ba-box"><img src="{prefix}art/ba_{k}_after.webp" alt="{html.escape(t)}: the plan in 3D" loading="lazy" width="1200" height="900">'
                f'<img class="ba-before" src="{prefix}art/ba_{k}_before.webp" alt="{html.escape(t)}: your photo" loading="lazy" width="1200" height="900">'
                f'<input type="range" min="0" max="100" value="50" aria-label="{html.escape(t)}: slide between your photo and the plan" oninput="this.closest(\'.ba\').style.setProperty(\'--ba\', this.value + \'%\')"></div>'
                f'<figcaption><b>{html.escape(t)}.</b> {html.escape(cap)}. Slide to compare.</figcaption></figure>')
    return f'<div class="ba-grid">{out}</div>'


def _page(site=False):
    """v25 (Demma's Home, option 1c "Room as map"): the 3D room is the home screen; a rail (a bottom bar on phones) opens
    the Plan, Build, Buy and Ideas sheets over it (v30: the Ask sheet is gone); the Tools button holds every 3D control. Every v24 panel id, data-* hook and
    saved key is kept: the panels live inside the sheets now."""
    import diagrams as D
    prefix = "media-wall/src/" if site else ""
    imgs = {k: f"{prefix}art/{k}.webp" for k in [f"art_{s}_{p}" for s in ("join", "four", "six", "side", "drawers") for p in ("mint", "card_room", "deep", "sage", "treron")] + ["key_join", "doc_paint", "doc_skirt"]}
    imgs.update({f"dims_{v}": f"{prefix}art/dims_{v}.webp" for v in ("join", "four", "six", "drawers", "side")})
    imgs.update({k: f"{prefix}art/{k}.webp" for k, *_ in SHOTS3D})
    rows = track_rows()
    phases = phase_data(rows)
    _, lo_tot, hi_tot = phase_totals()
    fit_head, fit_body, fc = fit_html()
    nfit = sum(fc.values())
    sec = {k: deck_section(v) for k, v in plan_sections().items()}
    pre = sec["pre"]
    decision = re.search(r'<div class="decision">(.*?)</div>', pre, re.S).group(1)
    s1 = re.sub(r"</div>\s*$", "", sec["1"].strip())
    facts = chapter_facts(rows, fc, nfit)
    ph_html = []
    for p in phases:
        items = [r for r in rows if r["phase"] == p["name"]]
        lis = "".join(
            f'<li data-t="{r["id"]}" data-kind="{r["kind"]}"><input type="checkbox" id="c-{r["id"]}" aria-label="Done"><label class="txt" for="c-{r["id"]}">{r["item"]}'
            f'<span class="meta">{"Qty " + html.escape(r["qty"]) + " · " if r["qty"] else ""}{"Estimate £" + r["est"] if r["est"] and r["est"] != "Quote" else ("Quote" if r["est"] else "Job")}</span></label>'
            + (f'<span class="paid"><label for="p-{r["id"]}">Paid £</label><input id="p-{r["id"]}" type="number" min="0" step="0.01" inputmode="decimal"></span>' if r["kind"] == "buy" or r["est"] == "Quote" else "<span></span>")
            + "</li>" for r in items)
        when = f' · <a href="#build" data-go="build" data-step="{p["step"]}">before step {p["step"]}</a>' if p["step"] else ""
        cost = f"£{money(p['lo'], p['hi'])}" if p["hi"] else "jobs only"
        if p["name"] == "6 Dining wall":   # v33: the buy list follows the pick (Decide)
            lis = (f'<li class="picknote" data-picknote="cabw" hidden><span class="ms" aria-hidden="true">straighten</span><span>Your pick: the {G.CAB80["top"][0]:g}-wide table. The same rows with a little less oak and ply: '
                   f'the halves {G.CAB80["top"][0]:g} wide, the table box {G.CAB80["bay_t"]:g} inside, the cabinet {G.CAB80["len"]:.1f} long. Six chairs still to buy; four live inside.</span></li>'
                   + lis.replace("in Olive (or Honey or Ivory)", '<span data-pickpads>in Olive (or Honey or Ivory)</span>'))
        ph_html.append(f'<details class="phase" id="ph-{p["idx"]}" data-ph="{html.escape(p["name"])}"{" open" if p["idx"] == 0 else ""}><summary><span>{part_chip(PHASE_PART[p["name"]])} {html.escape(p["name"])}</span>'
                       f'<span class="pf"><span>{cost}{when}</span><span class="pd">0 of {len(items)} done</span></span></summary><ul class="items">{lis}</ul></details>')
    places_html, STEP_CARD = piece_cards(rows)   # v46: the room by place, a card per piece
    step_cards = [
        f'<li class="step" id="step-{s["n"]}" data-s="{s["n"]}" data-parts="{html.escape("|".join(s["part"]))}"><div class="shead"><span class="sn">{s["n"]}</span>'
        f'<a class="sgo" href="#{STEP_CARD[s["n"]]}" data-mk="{STEP_CARD[s["n"]]}"><h3>{html.escape(s["title"])}</h3><span class="smeta">{html.escape(s["who"])} · {html.escape(s["time"])}</span></a>'
        f'<label class="sdone" for="sd-{s["n"]}"><input type="checkbox" id="sd-{s["n"]}"><span class="sr-only">Step {s["n"]} done</span></label></div></li>'
        for s in steps()]
    data = {"img": imgs, "track": [{k: r[k] for k in ("id", "phase", "lo", "hi", "done", "kind")} for r in rows],
            "phases": [{k: p[k] for k in ("name", "idx", "lo", "hi")} for p in phases], "top": 200 * -(-max(p["hi"] for p in phases) // 200),
            "steps": len(steps()), "tabs": [t for t, _ in TABS],
            # v33: one count, Decide, the shortlist, build day (plan_ui.py)
            "plan": [lo_tot, hi_tot], "decide": PU.decisions(), "short": PU.shortlist(), "bday": PU.buildday(steps()), "stepcard": STEP_CARD}
    base = "media-wall/out/" if site else GITHUB_OUT
    TILE_ID = {"views": "tb-views", "wall": "tb-wall", "dining": "tb-dining", "paint": "tb-paint", "network": "tb-network", "fit": "tb-checks"}
    tiles = "".join(f'<button type="button" class="ctile"{(" id=" + chr(34) + TILE_ID[k] + chr(34)) if k in TILE_ID else ""} data-go="{k}" style="--h:{h}"><i class="ms" aria-hidden="true">{ic}</i><span>{html.escape(t)}<br><small>{html.escape(sub)}</small></span></button>'
                    for k, t, ic, h, sub in CHAPTERS)
    def chapter(k, inner):
        _k, t, ic, h, _s = next(c for c in CHAPTERS if c[0] == k)
        return (f'<section class="chapter" id="ch-{k}" data-ch="{k}" style="--h:{h}" hidden><button type="button" class="chback" data-go="overview"><span class="ms" aria-hidden="true">arrow_back</span>All chapters</button>'
                f'<div class="chhead"><i class="ms" aria-hidden="true">{ic}</i><h2>{html.escape(t)}</h2></div>{facts[k]}{inner}</section>')
    more = lambda body, lab="Read the full chapter": f'<details class="readmore"><summary>{lab} <span class="ms" aria-hidden="true">expand_more</span></summary>{body}</details>'
    nav = [("plan", "Plan", "map", 300), ("build", "Build", "construction", 50), ("buy", "Buy", "shopping_bag", 165), ("ideas", "Ideas", "lightbulb", 95)]   # v30: no Ask sheet (every question answered or dropped)
    # v32, client: "make tools always appear in 3D view and the other buttons on the left to be the expandable menu as these are the in
    # depth plans used less": one Menu button opens the Room, Plan, Build, Buy and Ideas buttons (open by itself while a sheet is up)
    rail = (f'<nav class="rail" aria-label="Sections"><button type="button" class="rail-tog" id="rail-tog" aria-expanded="false" aria-controls="rail-list" style="--h:280">'
            f'<i class="ms" aria-hidden="true">menu</i><span>Menu</span></button><div class="rail-list" id="rail-list">'
            f'<button type="button" id="tb-room" data-nav="room" aria-current="true" style="--h:25"><i class="ms" aria-hidden="true">view_in_ar</i>Room</button>'
            + "".join(f'<button type="button" id="tb-{"overview" if k == "plan" else k}" data-nav="{k}" aria-current="false" style="--h:{h}"><i class="ms" aria-hidden="true">{ic}</i>{n}</button>' for k, n, ic, h in nav) + '</div></nav>')
    bbar = (f'<nav class="bbar" aria-label="Sections"><button type="button" data-nav="room" aria-current="true" style="--h:25"><i class="ms" aria-hidden="true">view_in_ar</i>Room</button>'
            + "".join(f'<button type="button" data-nav="{k}" aria-current="false" style="--h:{h}"><i class="ms" aria-hidden="true">{ic}</i>{n}</button>' for k, n, ic, h in nav) + '</nav>')
    def sheet(k, title, ic, h, body):
        return (f'<div class="sheet" id="sh-{k}" role="dialog" aria-modal="true" aria-labelledby="sh-{k}-h" aria-hidden="true" style="--h:{h}">'
                f'<div class="shd"><span class="grab" aria-hidden="true"></span><h2 id="sh-{k}-h" class="sr-only">{title}</h2>'
                + ('<nav class="shnav" aria-label="The plan">' + "".join(f'<button type="button" data-nav="{n}" aria-current="{str(n == k).lower()}">{t}</button>' for n, t in (("plan", "Plan"), ("build", "Build"), ("buy", "Buy"))) + '</nav>'
                   if k in ("plan", "build", "buy") else f'<h2 aria-hidden="true"><i class="ms">{ic}</i><span>{title}</span></h2>')
                + f'<button type="button" class="close" data-close aria-label="Close {title}"><span class="ms" aria-hidden="true">close</span></button></div>'
                f'<div class="sbd">{body}</div></div>')
    sugg_chips = ('<div class="seg" role="group" aria-label="Suggestions in the room">'
                  + "".join(f'<button type="button" data-sproxy="{k}" aria-pressed="false">{html.escape(room3d_page.SUGG_SHORT[k])}</button>' for k, *_ in __import__("ideas").SUGGEST)
                  + '<button type="button" class="chip" data-sproxyall="on">All on</button><button type="button" class="chip" data-sproxyall="off">All off</button></div>')
    notice = ('<p class="notice">Ticks and amounts on this page stay on this device.</p>' if site
              else f'<p class="caption">Also on <a href="{PAGES}" target="_blank" rel="noopener">GitHub Pages</a>.</p>')

    plan_home = f"""<div class="plan-home" id="plan-home"><div class="panel" id="overview">
      <div><p class="hello" id="hello">Evening, Emma &amp; Dave</p><p>The artisan oak media wall in your pale mint, the compact dining cabinet, the network and power: about <b id="d-total">£{money(lo_tot, hi_tot)}</b> in all.</p>
        <p class="row"><a class="btn" href="{base}Demmas_Home_{LABEL}_Plan.pdf" target="_blank" rel="noopener"><span class="ms" aria-hidden="true">download</span> The plan (PDF)</a><a class="btn" href="{base}Demmas_Home_{LABEL}_Plan_phone.pdf" target="_blank" rel="noopener"><span class="ms" aria-hidden="true">smartphone</span> Phone edition</a></p></div>
      {PU.plan_home(ring, sum(1 for r in rows if r["kind"] == "buy"), len(steps())).replace("{MONEY}", PU.money_html(TRACK))}
      <div class="upnext" hidden><span class="n" id="d-nextn">1</span><div><span class="label">Up next</span><h3 id="d-next">Measure and count</h3></div>
        <button type="button" class="done-btn" id="d-nextdone" data-s="1"><span class="ms" aria-hidden="true">check_circle</span>Done</button>
        <p><span id="d-nextmeta"></span> · <a href="#build" data-go="build" data-step="1" id="d-nextgo">Open it</a></p></div>
      <div class="sec-h"><h2>Before and after</h2></div>
      {before_after(prefix)}
      <div class="sec-h"><h2>Chapters</h2></div>
      <div class="tilegrid">{tiles}</div>
      <details class="fold"><summary>The plan on a page</summary><div class="doc">{s1}</div></details>
      <!--keep--><details class="fold changes"><summary>What changed in {LABEL}</summary><div class="doc"><p>{decision}</p></div></details><!--/keep-->
    </div></div>"""
    chapters = "".join([
        chapter("c-room", more(f'<div class="doc">{sec["2"]}</div>')),
        chapter("wall", more(f'<div class="panel" id="wall"><nav class="toc" aria-label="In this chapter"></nav><div class="doc">{sec["3"]}</div></div>')),
        chapter("records", more(f'<div class="doc">{sec["4"]}</div>')),
        chapter("side", more(f'<div class="doc">{sec["6"]}</div>')),
        chapter("joinery", '<p><a class="btn" href="#build" data-go="build" data-find="Cutting list">Open the cutting list (copy it as text)</a></p>' + more(f'<div class="doc">{sec["7"]}</div>')),
        chapter("dining", f'<div class="panel" id="dining"><nav class="toc" aria-label="In this chapter"></nav><div class="block"><h2 class="ptitle">The table: the compact dining cabinet, 90 or 80 wide</h2>{options_card()}</div>'
                          + more(f'<div class="doc">{sec["5"]}</div>') + '</div>'),
        chapter("paint", f'<div class="panel" id="paint">{preset_cards()}' + more(f'<div class="doc">{sec["8"]}</div>') + '</div>'),
        chapter("network", more(f'<div class="panel" id="network"><nav class="toc" aria-label="In this chapter"></nav><div class="doc">{sec["9"]}</div></div>')),
        chapter("views", f"""<div class="panel" id="views"><div class="viewer">
    <div class="frame shotwrap"><img id="shot" alt="Render of the media wall" width="3300" height="2100"><img id="dims" class="dims" alt="" width="3300" height="2100" hidden></div>
    <div class="controls">
      <div class="group"><span class="label" id="l-style">View</span>
        <div class="seg" role="group" aria-labelledby="l-style">
          <button id="s-join" data-style="join" aria-pressed="true">Artisan oak (main)</button>
          <button id="s-side" data-style="side" aria-pressed="false">PC side wall</button>
          <button id="s-drawers" data-style="drawers" aria-pressed="false">Drawers open</button>
        </div></div>
      <div class="group"><span class="label" id="l-paint">Paint</span>
        <div class="seg" role="group" aria-labelledby="l-paint">
          <button id="p-mint" data-paint="mint" aria-pressed="true"><span class="dot" style="background:#dbffc8"></span>Your pale mint (chosen)</button>
          <button id="p-card" data-paint="card_room" aria-pressed="false"><span class="dot" style="background:#899081"></span>Card Room Green</button>
          <button id="p-sage" data-paint="sage" aria-pressed="false"><span class="dot" style="background:#77815c"></span>Sage Green</button>
          <button id="p-treron" data-paint="treron" aria-pressed="false"><span class="dot" style="background:#8b8a77"></span>Treron</button>
          <button id="p-deep" data-paint="deep" aria-pressed="false"><span class="dot" style="background:#2c5643"></span>Deep green</button>
        </div></div>
      <div class="group"><span class="label" id="l-key">Labels</span>
        <div class="seg" role="group" aria-labelledby="l-key">
          <button id="k-key" aria-pressed="false">Show numbered key</button>
          <button id="k-dims" aria-pressed="false">Show measurements</button>
        </div></div>
      <div class="group"><span class="label" id="l-zoom">HD</span>
        <div class="seg" role="group" aria-labelledby="l-zoom"><button id="k-full" type="button">View full size</button></div></div>
    </div>
    <p class="caption" id="cap"></p>
  </div>
  <div class="band">
    <section><h2>Heights, from the floor</h2>
      <ul class="heights">
        <li><b>{G.CEIL:g}</b><span>Ceiling, as measured</span></li>
        <li><b>{G.HIGH_TOP:g}</b><span>High shelf: books, a box, a print, the “now playing” single, Deco B</span></li>
        <li><b>{G.LEDGE_TOP:g}</b><span>Record ledges over the TV and round the corner; the PC shelf on the side wall</span></li>
        <li><b>{G.FOLDED_TOP:g}</b><span>Top of the dining table, folded up</span></li>
        <li><b>{G.RZ_SHELF_TOP:g}</b><span>Series X shelf, over the turntable (its lid has to {G.LID_CLEAR_TO:g})</span></li>
        <li><b>116.5</b><span>TV centre, LG C6 55in on its stand</span></li>
        <li><b>{G.WORKTOP:g}</b><span>Oak worktop, and the dining table when it's down</span></li>
        <li><b>{G.PLINTH:g}</b><span>Plinth under the two BESTÅ bays, with a hidden drawer</span></li>
      </ul></section>
    <section><h2>In the wall</h2>
      <div class="counts">
        <div><strong>~{LPS}</strong><span>LPs: {G.WALL_LPS} face-out in the wall, {G.STAND_LPS} in your vinyl stand</span></div>
        <div><strong>LPs</strong><span>only, in the trays: room to flip</span></div>
        <div><strong>4–7</strong><span>at the dining table; two spare chairs hang by it</span></div>
      </div>
      <p class="caption">The numbered key works on the main view. The pale yellow sizes are rough; the chapters' drawings are exact.</p></section>
  </div></div>"""),
        chapter("fit", f"""<div class="panel" id="checks">
    <p class="caption">Each item against its published size: {fc[fit.PASS]} of {nfit} fit, {fc[fit.TIGHT]} tight, {fc[fit.CHECK]} to check on site.</p>
    <div class="qhead">{fit_head}<button class="btn" id="fit-only" type="button" aria-pressed="false">Show only tight and to-check</button></div>
    <div id="fit-zones">{fit_body}</div>
    <div class="doc">{sec["12"]}</div></div>"""),
        chapter("downloads", f'<div class="block"><p class="caption">The plan and the guide as PDFs, and the drawings. For a 3D picture: View, Save as HD picture.</p>'
                             f'<p><a class="btn primary" href="{base}Demmas_Home_{LABEL}_Plan.pdf" target="_blank" rel="noopener">The plan (PDF)</a> '
                             f'<a class="btn" href="{base}Demmas_Home_{LABEL}_Build_Guide.pdf" target="_blank" rel="noopener">Build guide (PDF)</a></p>'
                             f'<p class="caption">For a phone: <a href="{base}Demmas_Home_{LABEL}_Plan_phone.pdf" target="_blank" rel="noopener">the plan</a> · <a href="{base}Demmas_Home_{LABEL}_Build_Guide_phone.pdf" target="_blank" rel="noopener">the build guide</a> (a narrow page, bigger type).</p>{downloads_html(site)}{notice}'
                             f'<p class="caption">Demma\'s Home · living room · {LABEL}</p></div>'),
    ])
    build_body = f"""<section class="panel" id="build">
    <div class="qhead"><div class="meter"><span class="bar"><i id="k-bar"></i></span><span id="k-count">0 tasks done</span></div>
      <span class="row"><a class="btn" href="{base}Demmas_Home_{LABEL}_Build_Guide.pdf" target="_blank" rel="noopener"><span class="ms" aria-hidden="true">download</span> Build guide (PDF)</a><a class="btn" href="{base}Demmas_Home_{LABEL}_Build_Guide_phone.pdf" target="_blank" rel="noopener"><span class="ms" aria-hidden="true">smartphone</span> Phone</a></span></div>
    <p class="caption">Any order: open a piece, then Check, Buy, Cut and Build. Tap a place in the room to jump here.</p>
    {places_html}
    <details class="fold" id="cuts"><summary>For the timber merchant: the cutting list</summary>
      <div class="row"><button class="btn" id="copy-cuts" type="button">Copy as text</button><span class="caption" id="cuts-st" aria-live="polite"></span></div>
      <textarea id="cuts-box" class="caption" rows="8" hidden readonly aria-label="The cutting list as text">{html.escape(cuts_text())}</textarea>
      <h2 class="ptitle sr-only">Cutting list for the timber merchant</h2>
      <div class="doc">{deck_section(cuts_html())}</div>
    </details>
    <details class="fold"><summary>Good to know: time, tools, techniques and pitfalls</summary><div class="doc">{GUIDE_TIME}{guide_tools()}{GUIDE_TECHNIQUES}{GUIDE_PITFALLS}</div></details>
    <details class="fold" id="order"><summary>Every step in one list (<span id="s-count">0 of {len(steps())} steps done</span>)</summary><p class="caption">A step ticks itself when its tasks are done.</p><span class="bar sr-only"><i id="s-bar"></i></span><ol class="steps-list" id="steps-ol">{"".join(step_cards)}</ol></details>
  </section>"""
    buy_body = f"""<section class="panel" id="buy">
    <div class="tiles">
      <div><strong id="t-plan">£{money(lo_tot, hi_tot)}</strong><span id="t-plans">the plan</span></div>
      <div><strong id="t-done">0 of {sum(1 for r in rows if r["kind"] == "buy")}</strong><span>bought <b id="t-left" hidden>nothing ticked yet</b></span></div>
      <div><strong id="t-paid">£0</strong><span>paid</span></div>
      <div><strong id="t-jobs">0 of {len(rows) - sum(1 for r in rows if r["kind"] == "buy")}</strong><span>jobs done</span></div>
    </div>
    <div class="picked" id="picked" hidden><div class="qhead"><h3 class="ptitle">Added by you</h3><span class="caption" id="picked-sum"></span></div><ul id="picked-l"></ul></div>
    {cost_overview()}
    <details class="fold" id="buyorder"><summary>The shopping list in build order: tick it off, note what you paid</summary>
    <div class="qhead">
      <div class="seg" role="group" aria-label="Show">
        <button type="button" data-filter="all" aria-pressed="true">Everything</button>
        <button type="button" data-filter="left" aria-pressed="false">Still to buy</button>
        <button type="button" data-filter="buys" aria-pressed="false">Things to buy</button>
        <button type="button" data-filter="jobs" aria-pressed="false">Jobs only</button>
      </div></div>
    <p class="caption" id="t-note">Each phase names the step it's for. Tick what you buy and note what you paid; you both see it.</p>
    <div id="tracker">{"".join(ph_html)}</div>
    <details class="fold"><summary>Cost by phase, low to high</summary>{cost_chart(phases)}</details></details>
    <p class="notice">Already owned: Virgin Hub 5, three Deco X1500s, two TL-SG105S switches (both become spares), LG OLED C6 55" and its stand, a 10-gang, the Hisense AX5100G 5.1 soundbar, the Series X fan stand, the turntable, the L-sofa and all the consoles. Estimates are approximate UK prices.</p>
  </section>"""
    ideas_body = f"""<section class="panel" id="ideas">
    <div class="shortbar" id="shortbar"><div><span class="label" id="sb-count">Nothing added to the plan yet</span><b id="sb-total">The plan: £{money(lo_tot, hi_tot)}</b></div><a class="btn" href="#buy" data-go="buy">See the buy list</a></div>
    <div class="block"><h2 class="ptitle">Suggestions in the room</h2><p class="caption">Each one switches the room too: close this to see them.</p>{sugg_chips}</div>
    {ideas_panel()}
  </section>"""
    page = f"""<title>Demma's Home</title>
{room3d_page.IMPORTMAP}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fredoka:wght@500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,500,1,0&display=block">
{STYLE_V25}
<button type="button" class="skip" data-tools-toggle>Open the room's controls</button>
<div class="brand"><span class="mark" aria-hidden="true"><i style="background:var(--peach)"></i><i style="background:var(--mint)"></i><i style="background:var(--lilac)"></i><i style="background:var(--butter)"></i></span>
  <span><b>Demma's Home<span class="ver" title="This page is {LABEL}">{LABEL}</span></b><small id="brand-place" data-ver="{LABEL}">The whole house</small></span></div>
<nav class="hnav" aria-label="The plan">{"".join(f'<button type="button" data-nav="{k}" aria-current="false">{n}</button>' for k, n in (("plan", "Plan"), ("build", "Build"), ("buy", "Buy")))}</nav>
<main id="room" aria-label="Your room in 3D">{room3d_page.section(gallery3d())}</main>
{sheet("plan", "Your plan", "map", 300, plan_home + chapters)}
{sheet("build", "Build", "construction", 50, build_body)}
{sheet("buy", "Buy", "shopping_bag", 165, buy_body)}
{sheet("ideas", "Ideas", "lightbulb", 95, ideas_body)}
<div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="The picture at full size">
  <div class="lbbar"><span class="caption" id="lb-cap">Full size: drag or scroll to look round. Pinch to zoom on a phone.</span><button class="btn" id="lb-close" type="button">Close</button></div>
  <div class="lbscroll" id="lb-scroll"><div class="lbwrap"><img id="lb-img" alt=""><img id="lb-dims" alt="" hidden></div></div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
{PU.overlays()}
<script>
const DATA = {json.dumps(data)};
const SITE = {json.dumps(site)};
""" + (HERE / "page.js").read_text() + """
</script>
<script>""" + STEP_JS + """</script>
<script>""" + FIT_JS + """</script>
<script>""" + __import__("tidy").MORE_JS + """</script>
<script>""" + (HERE / "page_router.js").read_text() + """</script>
"""
    # the build parts in the page's pastels (the PDF keeps its own colours)
    for name, hue in PAGE_PART.items():
        page = page.replace(f"--pc:{PARTS[name]}", f"--pc:oklch(0.78 0.12 {hue})").replace(f"background:{PARTS[name]}\"></span>{html.escape(name)}", f"background:oklch(0.78 0.12 {hue})\"></span>{html.escape(name)}")
    return uniq_svgs(page)


# v23: the page looks (the header's "Page look" buttons) and larger text, kept on each device
SKINS = [("card", "Card Room", "#2f4a3c"), ("oak", "Oak & linen", "#6b4a2b"), ("blue", "Sofa blue", "#2c4466"), ("plain", "Plain", "#eef0ea")]
SKIN_BTNS = "".join(f'<button type="button" data-skin="{k}" aria-pressed="false"><i style="background:{c}"></i>{n}</button>' for k, n, c in SKINS)
SKIN_JS = r"""(() => {
  const d = document.documentElement, bs = [...document.querySelectorAll(".skin [data-skin]")], big = document.getElementById("big-text");
  const sync = () => bs.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.skin === (d.dataset.skin || "card"))));
  bs.forEach(b => b.addEventListener("click", () => { d.dataset.skin = b.dataset.skin; try { localStorage.setItem("mw23-skin", b.dataset.skin); } catch (e) {} sync(); }));
  if (big) { big.checked = d.classList.contains("bigtext");
    big.addEventListener("change", () => { d.classList.toggle("bigtext", big.checked); try { localStorage.setItem("mw23-big", big.checked ? "1" : "0"); } catch (e) {} }); }
  sync();
})();"""


# v46: Build by place and piece. Each piece's card has a tick per task (this device: mw46-tasks) and per thing to buy (the buy list's own
# ticks, mirrored). A step ticks itself when all its tasks are done (and a step ticked before v46 ticks its tasks), so Plan's counts and
# Build day keep working. window.PIECEP gives the room's labels and Plan each piece's progress.
STEP_JS = r"""(() => {
  const cards = $$(".mk"); if (!cards.length) return;
  const TK = "mw46-tasks", T = store.get(TK, {});
  const tab = (card, name) => { const bs = $$(".tabs [data-tab]", card); if (!bs.length) return;
    const b = bs.find(x => x.dataset.tab === name) || bs[0];
    bs.forEach(x => { const on = x === b; x.setAttribute("aria-selected", String(on)); document.getElementById(x.getAttribute("aria-controls")).hidden = !on; }); };
  const firstTab = c => { const left = $$("[data-task]:not(input)", c).some(li => !T[li.dataset.task]); return left && c.dataset.started ? "build" : "check"; };
  const open = (id, name) => { const c = document.getElementById(id); if (!c) return null; c.open = true; tab(c, name || firstTab(c)); arts(c); return c; };
  window.stepCard = n => open(DATA.stepcard[n], "build");
  window.openCard = id => open(id);
  document.addEventListener("click", e => {
    const t = e.target.closest(".tabs [data-tab]"); if (t) { tab(t.closest(".mk"), t.dataset.tab); return; }
    const a = e.target.closest("[data-mk]"); if (!a || !a.dataset.mk) return;
    e.preventDefault(); e.stopPropagation();
    const show = () => { const c = open(a.dataset.mk, a.dataset.tab); if (c) jumpTo(c); };
    if (!a.closest("#sh-build") && window.go) { window.go("build"); setTimeout(show, 60); } else show();
  }, true);
  cards.forEach(c => c.addEventListener("toggle", () => { if (c.open) arts(c); }));
  const tasksOf = n => $$(`li[data-task][data-step="${n}"]`).map(li => li.dataset.task);
  const stepBox = n => document.getElementById("sd-" + n);
  // a step ticked before v46 ticks its tasks, once
  $$(".steps-list > li.step").forEach(li => { const n = li.dataset.s, ts = tasksOf(n);
    if (li.classList.contains("done") && ts.length && ts.every(t => T[t] === undefined)) ts.forEach(t => { T[t] = true; }); });
  store.set(TK, T);
  const buyDone = id => { const c = document.getElementById("c-" + id); return !!(c && c.checked); };
  let syncing = false;
  const paint = () => {
    $$("input[data-task]").forEach(i => { i.checked = !!T[i.dataset.task]; i.closest("li").classList.toggle("done", i.checked); });
    $$("input[data-buyproxy]").forEach(i => { i.checked = buyDone(i.dataset.buyproxy); i.closest("li").classList.toggle("done", i.checked); });
    let all = 0, got = 0; const per = {};
    cards.forEach(c => { const ts = $$("input[data-task], input[data-buyproxy]", c), k = ts.filter(i => i.checked).length;
      all += $$("input[data-task]", c).length; got += $$("input[data-task]", c).filter(i => i.checked).length;
      const p = $(`[data-prog="${c.id}"]`); if (p) { p.firstChild.textContent = k; p.style.setProperty("--p", ts.length ? k / ts.length : 0); }
      c.classList.toggle("done", ts.length > 0 && k === ts.length); c.dataset.started = k ? "1" : "";
      per[c.id] = { id: c.id, title: $(".mkt b", c).textContent, done: k, total: ts.length, place: c.closest(".place")?.id.slice(3) }; });
    $$("[data-plprog]").forEach(el => { const ps = Object.values(per).filter(x => x.place === el.dataset.plprog), d = ps.reduce((a, x) => a + x.done, 0), t = ps.reduce((a, x) => a + x.total, 0);
      el.textContent = t ? `${d} of ${t} done` : ""; });
    const kc = $("#k-count"); if (kc) kc.textContent = `${got} of ${all} tasks done`;
    const kb = $("#k-bar"); if (kb) kb.style.width = (all ? 100 * got / all : 0) + "%";
    window.PIECEP.per = per; window.PIECEP.tasks = [got, all];
    if (window.PICKS) PICKS.paint();
  };
  const syncSteps = () => { if (syncing) return; syncing = true;
    $$(".steps-list > li.step").forEach(li => { const n = li.dataset.s, ts = tasksOf(n), box = stepBox(n); if (!ts.length || !box || box.disabled) return;
      const want = ts.every(t => T[t]); if (box.checked !== want) { box.checked = want; box.dispatchEvent(new Event("change", { bubbles: true })); } });
    syncing = false; };
  window.PIECEP = { per: {}, tasks: [0, 0],
    current() { const a = Object.values(this.per).filter(x => x.done > 0 && x.done < x.total); return a.sort((x, y) => y.done / y.total - x.done / x.total)[0] || null; },
    of(id) { return this.per[id] || null; } };
  document.addEventListener("change", e => {
    const t = e.target.closest("input[data-task]");
    if (t) { T[t.dataset.task] = t.checked; store.set(TK, T); if (t.checked && window.cheer && !$$(`input[data-task]`, t.closest(".mk")).some(i => !i.checked)) cheer("Piece done", t); paint(); syncSteps(); return; }
    const b = e.target.closest("input[data-buyproxy]");
    if (b) { const c = document.getElementById("c-" + b.dataset.buyproxy); if (c && !c.disabled && c.checked !== b.checked) { c.checked = b.checked; c.dispatchEvent(new Event("change", { bubbles: true })); } paint(); return; }
    if (e.target.closest("#tracker")) paint();
  });
  paint(); syncSteps();
  setTimeout(paint, 1500);   // after the buy list's saved ticks have loaded
})();"""


# v46.1, client: "I want plans and images to fit in my phone screen not scroll ... I want to see full plans when images are involved or
# tables / cad designs". Each table's cells carry their column's name (so a wide one can stack into a card per row on a phone), and a
# tap on a drawing, a cutting layout or a picture opens it full screen, fitted, to pinch, drag or double-tap to zoom.
FIT_JS = r"""(() => {
  const label = t => {
    const rows = [...t.rows]; if (!rows.length) return;
    const hdr = rows.find(r => r.cells.length && [...r.cells].every(c => c.tagName === "TH")); if (!hdr) return;
    const names = []; [...hdr.cells].forEach(c => { for (let i = 0; i < (c.colSpan || 1); i++) names.push(c.textContent.trim()); });
    if (names.length < 4) return;
    hdr.classList.add("hdr"); t.classList.add("tstack");
    rows.forEach(r => { if (r === hdr) return; let i = 0;
      if (r.cells.length === 1 && (r.cells[0].colSpan || 1) >= names.length - 1) { r.classList.add("sec"); return; }
      [...r.cells].forEach(c => { if (names[i] && !c.hasAttribute("data-label")) c.dataset.label = names[i]; i += c.colSpan || 1; }); });
  };
  document.querySelectorAll(".sheet table, .r3d-dpanel table, .ov table").forEach(label);
  /* the full-screen viewer */
  const v = document.createElement("div"); v.className = "zoomv"; v.hidden = true; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Drawing, full screen");
  v.innerHTML = '<div class="zbar"><span class="zt"></span><button type="button" class="zx">Close</button></div><div class="zstage"><div class="zin"></div></div><p class="zhint">Pinch or double-tap to zoom, drag to move. Turn your phone sideways for a bigger view.</p>';
  document.body.appendChild(v);
  const stage = v.querySelector(".zstage"), zin = v.querySelector(".zin"); let st = { s: 1, x: 0, y: 0, s0: 1 }, back = null;
  const put = () => { zin.style.transform = `translate(${st.x}px, ${st.y}px) scale(${st.s})`; };
  const clamp = () => { const W = stage.clientWidth, H = stage.clientHeight, w = zin.offsetWidth * st.s, h = zin.offsetHeight * st.s;
    st.x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, st.x)); st.y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, st.y)); };
  const fit = () => { const W = stage.clientWidth, H = stage.clientHeight; zin.style.width = W + "px";
    st.s0 = Math.min(1, H / Math.max(1, zin.offsetHeight)); st.s = st.s0; clamp(); put(); };
  const zoomAt = (k, cx, cy) => { const ns = Math.max(st.s0, Math.min(st.s0 * 8, st.s * k)), r = ns / st.s; st.x = cx - (cx - st.x) * r; st.y = cy - (cy - st.y) * r; st.s = ns; clamp(); put(); };
  function openZoom(fig) {
    const src = fig.querySelector("svg, img"); if (!src) return;
    back = document.activeElement; zin.textContent = "";
    if (src.tagName.toLowerCase() === "img") { const im = new Image(); im.src = src.currentSrc || src.src; im.alt = src.alt || ""; im.onload = fit; zin.appendChild(im); }
    else { const c = src.cloneNode(true); c.removeAttribute("style"); c.setAttribute("width", "100%"); c.removeAttribute("height"); zin.appendChild(c); }
    const cap = fig.querySelector("figcaption"); v.querySelector(".zt").textContent = cap ? cap.textContent.slice(0, 70) : "";
    v.hidden = false; document.body.classList.add("ov-open"); requestAnimationFrame(fit); v.querySelector(".zx").focus();
  }
  const closeZoom = () => { v.hidden = true; zin.textContent = ""; document.body.classList.toggle("ov-open", !!document.querySelector(".ov:not([hidden])")); if (back) back.focus({ preventScroll: true }); };
  v.querySelector(".zx").addEventListener("click", closeZoom);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !v.hidden) { e.stopPropagation(); closeZoom(); } }, true);
  addEventListener("resize", () => { if (!v.hidden) fit(); });
  const pts = new Map(); let last = null, lastTap = 0;
  stage.addEventListener("pointerdown", e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); last = null;
    const now = Date.now(); if (pts.size === 1 && now - lastTap < 320) { const r = stage.getBoundingClientRect(); st.s > st.s0 * 1.05 ? (st.s = st.s0, clamp(), put()) : zoomAt(2.5, e.clientX - r.left, e.clientY - r.top); lastTap = 0; } else lastTap = now; });
  stage.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    const r = stage.getBoundingClientRect();
    if (pts.size === 1) { st.x += e.clientX - prev[0]; st.y += e.clientY - prev[1]; clamp(); put(); return; }
    const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2 - r.left, my = (a[1] + b[1]) / 2 - r.top;
    if (last) zoomAt(d / last, mx, my); last = d; });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) last = null; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  stage.addEventListener("wheel", e => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const mark = root => (root || document).querySelectorAll(".sheet figure, .r3d-dpanel figure").forEach(f => {
    if (f.classList.contains("zoomable") || f.closest("button, a, .ba, .gallery") || !f.querySelector(":scope > svg, :scope > img, :scope > .dia svg")) return;
    f.classList.add("zoomable"); f.tabIndex = 0; f.setAttribute("role", "button"); f.setAttribute("aria-label", "Show full screen"); });
  mark();
  document.addEventListener("click", e => { const f = e.target.closest("figure.zoomable"); if (f && !e.target.closest("a, button")) openZoom(f); });
  document.addEventListener("keydown", e => { const f = e.target.closest && e.target.closest("figure.zoomable"); if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openZoom(f); } });
  window.fitTables = label;
})();"""


def site():
    """The same page for GitHub Pages at the repo root: a full document, paths into media-wall/, plain download links."""
    body = page(site=True).replace("body { background", "body { margin: 0; background", 1)
    head, rest = body.split("</style>", 1)
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            # v39, item 13 ("quicker on phones: the room as an installable page, works offline, opens fast"): a manifest, an icon and a service worker
            '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#2f4a3c">\n<link rel="apple-touch-icon" href="media-wall/src/art/icon-180.png">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Demma\'s Home">\n'
            '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Crect width=%2216%22 height=%2216%22 rx=%223%22 fill=%22%239a6634%22/%3E%3C/svg%3E">\n'
            + head + "</style>\n</head>\n<body>" + rest
            + "<script>if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});</script>\n"
            + "</body>\n</html>\n")


def pwa_files():
    """v39, item 13: the installable page's manifest, service worker and icons (V1.2: into the site, which GitHub Pages serves; 180 px for
    the iPhone's home screen)."""
    from PIL import Image, ImageDraw
    root = SITE
    for size in (180, 192, 512):
        im = Image.new("RGBA", (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius=size // 5, fill="#2b2638")
        r, gap = size * 0.16, size * 0.08
        for i, col in enumerate(("#f6b89a", "#9fdcc0", "#c8b6f0", "#f2d878")):
            cx = size / 2 + (-1 if i % 2 == 0 else 1) * (r + gap / 2); cy = size / 2 + (-1 if i < 2 else 1) * (r + gap / 2)
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
        im.save(HERE / "art" / f"icon-{size}.png")
    (root / "manifest.webmanifest").write_text(json.dumps({
        "name": "Demma's Home", "short_name": "Demma", "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#151a16", "theme_color": "#2f4a3c",
        "icons": [{"src": f"media-wall/src/art/icon-{n}.png", "sizes": f"{n}x{n}", "type": "image/png", "purpose": "any maskable"} for n in (192, 512)]}, indent=1))
    (root / "sw.js").write_text(f"""// v39: the page opens from the device after the first visit (network first for the page, so a new round shows; cache first for the
// rest: three.js from its CDN, the fonts and the pictures). {LABEL}.
const C = "demma-{LABEL}";
self.addEventListener("install", e => {{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(["./", "manifest.webmanifest"]).catch(() => {{}}))); }});
self.addEventListener("activate", e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener("fetch", e => {{
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url), page = r.mode === "navigate" || (u.origin === location.origin && (u.pathname.endsWith("/") || u.pathname.endsWith("index.html")));
  if (page) {{ e.respondWith(fetch(r).then(res => {{ const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }}).catch(() => caches.match(r).then(m => m || caches.match("./")))); return; }}
  if (/\\.pdf$/.test(u.pathname)) return;                                   // the PDFs come from the network
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {{ if (res.ok || res.type === "opaque") {{ const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }} return res; }})));
}});
""")


def split_photos(html_):
    """V1.9 (Phase 4): on Pages the 3D's photos (1.6 MB) are a file of their own, named by its contents, fetched after the first picture
    and kept by the service worker; the page carries the rest. tools/build.py puts them back inline for the shared page."""
    import hashlib, re
    m = re.search(r'<script type="application/json" id="photo-data">(.*?)</script>', html_, re.S)
    if not m or len(m.group(1)) < 3:
        return html_
    name = f"photos.{hashlib.sha256(m.group(1).encode()).hexdigest()[:10]}.json"
    for old in SITE.glob("photos.*.json"):
        if old.name != name: old.unlink()
    (SITE / name).write_text(m.group(1))
    return html_[:m.start()] + f'<script type="application/json" id="photo-data" data-src="{name}"></script>' + html_[m.end():]


def publish_files():
    """{published path: source} for the Artifact publish: the viewer images and the downloads."""
    files = {f"art/{p.name}": str(p) for p in sorted((HERE / "art").glob("*.webp"))}
    if not DOWNLOADS_ON_GITHUB:
        files.update({published_name(p): str(p) for p, _, kind in downloads_list() if kind != "PDF"})
    return files


DECK_ASSETS = HERE / "deck_assets.json"   # v22: art/ files uploaded to the deck's asset store: {name: {"sha": ..., "url": "/_blob/..."}}


def art_sha(p):
    import hashlib
    return hashlib.sha256(p.read_bytes()).hexdigest()




def deck_assets_todo():
    """v22: the art/ files the deck's asset store doesn't hold yet (new, or changed since they were uploaded)."""
    have = json.loads(DECK_ASSETS.read_text()) if DECK_ASSETS.exists() else {}
    return [p for p in sorted((HERE / "art").glob("*.webp")) if have.get(p.name, {}).get("sha") != art_sha(p)]


def inline_images(html_):
    """The copy published to the shared deck (media_wall_viewer_inline.html, gitignored). v22: each picture already in the deck's
    asset store (deck_assets.json, matched by its sha256) is linked by its /_blob/ url; any other is carried as a data URI, so the
    page always works. With everything uploaded the page is about 2 MB instead of 10.8. (Uploads through `files` were refused in
    v13 with false "cpio archive" sniffs; the asset store takes them.)"""
    import base64
    have = json.loads(DECK_ASSETS.read_text()) if DECK_ASSETS.exists() else {}
    for p in sorted((HERE / "art").glob("*.webp")):
        a = have.get(p.name)
        uri = a["url"] if a and a.get("sha") == art_sha(p) else "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
        html_ = html_.replace(f"art/{p.name}", uri)
    return html_


def doc_images():
    """The two plan images that aren't renders, as JPEGs in art/ so the page carries each once."""
    from PIL import Image
    for src, key in (("paint_grid.png", "doc_paint"), ("skirting_options.png", "doc_skirt")):
        im = Image.open(HERE / src).convert("RGB")
        if im.width > 2400:
            im = im.resize((2400, round(im.height * 2400 / im.width)))
        im.save(HERE / "art" / f"{key}.webp", "WEBP", quality=86, method=6)


if __name__ == "__main__":
    doc_images()
    (HERE / "media_wall_viewer.html").write_text(page())
    (HERE / "media_wall_viewer_inline.html").write_text(inline_images(page()))
    SITE.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "plan.html"):                                  # V1.2: the site's front door again (plan.html for old links)
        (SITE / name).write_text(split_photos(site()))
    pwa_files()
    (HERE / "publish_files.json").write_text(json.dumps(publish_files(), indent=1))
    todo = deck_assets_todo()
    print("viewer ok", len(publish_files()), "files;", len(todo), "pictures not yet in the deck's asset store" + (" (inlined)" if todo else ""))
    (HERE / "deck_assets_todo.txt").write_text("".join(str(p) + "\n" for p in todo))
