"""v56: the whole-house HD plan as one report for the client, with the evidence: house/out/Whole_House_HD_Plan.pdf.
Its text comes from the repo's own files (HD_PLAN.md, EVIDENCE.md, SURVEY.md, BUILD_SPEC.md) and its pictures from
media-wall/inputs and house/evidence, so rebuilding it after any of them changes keeps it current: python3 house/build_report.py"""
import pathlib, re, sys, tempfile, datetime
import markdown
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
H = ROOT / "house"; IN = ROOT / "media-wall/inputs"; EV = H / "evidence"; OUT = H / "out"
OUT.mkdir(exist_ok=True)
TMP = pathlib.Path(tempfile.mkdtemp())


def pic(path, cap, w=1400):
    im = Image.open(path).convert("RGB"); im.thumbnail((w, w))
    dst = TMP / (path.stem + ".jpg"); im.save(dst, quality=80)
    return f'<figure><img src="{dst.as_uri()}"><figcaption>{cap}</figcaption></figure>'


def md(p, drop_first_heading=True):
    t = p.read_text()
    if drop_first_heading: t = re.sub(r"^# .*\n", "", t, count=1)
    for x, y in (("`CLAUDE.md`", "the repo's rules file"), ("CLAUDE.md", "the repo's rules file"), ("Claude Code agent", "developer"),
                 ("Claude code agent", "developer"), ("Claude Code", "the developer"), ("Claude", "the developer")):   # no assistant names in the PDFs
        t = t.replace(x, y)
    t = re.sub(r"(?m)^(\s*)- ", r"\1- ", t)
    return markdown.markdown(t, extensions=["tables", "fenced_code"])


NOW = [("now_living_room_whole.jpg", "The living room as modelled now: measured, your plan, its lights."),
       ("now_living_room_window.jpg", "Out of the window: a plain sky for now; the view comes back properly in phase 5."),
       ("now_living_room_sun_june_morning.jpg", "The real sun: a June morning, low from the right (the back faces 14° east of north)."),
       ("now_house_all.jpg", "The whole house built (v58): brick, the roof, the windows and doors, sized from the living room and the photos."),
       ("compare_front.jpg", "The front: the agent's photo and the model."), ("compare_kitchen.jpg", "The kitchen: your photo and the Kitchen view."), ("compare_wc.jpg", "The WC: your photo and the WC view, the yellow suite."), ("compare_hall.jpg", "The hall: your photo and the Entrance hall view, the door down to the lower stairs."), ("compare_landing.jpg", "The landing: your photo and the Landing view."), ("compare_office.jpg", "The office: your photo and the Office view, the two setups side by side."), ("now_hall.jpg", "The hall to the living room's door, the stairs plastered off."), ("now_front_gate.jpg", "The front: the step, the drive and lawn level with the street, the alley gate."), ("compare_bath.jpg", "The bathroom: your photo and the Bathroom view."), ("now_porch.jpg", "The entrance: the step, the bin cupboards each side, the front door ahead."), ("now_bed2.jpg", "The music room: the keyboard, the studio desk under the window, the guitars and amp under the slope, the day bed."), ("now_master.jpg", "The master bedroom: the wardrobe frames in the alcove, in line with the boiler cupboard."), ("compare_back.jpg", "The back: the agent's photo and the model."),
       ("now_house_first.jpg", "First: the roof off."), ("now_house_ground.jpg", "Ground: the first floor off; the living room as measured."),
       ("now_house_lower.jpg", "The lower ground floor, under the living room."),
       ("now_first_fittings.jpg", "From above: the bathroom (sink cabinet, toilet, bath) and bedroom 2's roof slope."),
       ("now_lower_fittings.jpg", "From above: the WC's toilet and small sink, beside the kitchen.")]
PLANS = [("plan_lower_ground_corrected_25oct.jpg", "Lower ground floor, your corrections: the kitchen's window (purple), the cupboard by the store (black), the WC's small sink (maroon), the secret room."),
         ("plan_ground_corrected_25oct.jpg", "Ground floor, your corrections: the living room's window (orange), the chimney breast and solid walls (black)."),
         ("plan_first_corrected_25oct.jpg", "First floor, your corrections: the toilet (blue), the sink cabinet (maroon), the landing (green), bedroom 2's roof slope (black).")]
PHOTOS = [("photo_house_front_25oct.png", "The front: end of terrace, porch with white pediment, garage, drive, front lawn."),
          ("photo_house_rear_24oct.jpg", "The back: three storeys, the dormer, the living room window, the kitchen door, lawn to the house, path, fences."),
          ("photo_garden_summer_24oct.jpg", "The back garden in summer, from the dormer."),
          ("photo_view_full_24oct.jpg", "The view from upstairs: the garden to the trees, the warehouse, the valley, the hill."),
          ("room_sketch_accurate_mm.png", "Your measured living room (mm): the standard every other room will be measured to.")]

CSS = """
@page { size: A4; margin: 16mm 15mm; }
body { font: 10.5pt/1.45 'Figtree', 'Helvetica Neue', Arial, sans-serif; color: #1d2a22; }
h1 { font-size: 26pt; margin: 0 0 4mm; } h2 { font-size: 16pt; margin: 8mm 0 3mm; border-bottom: 2px solid #c8d8c0; padding-bottom: 1mm; page-break-after: avoid; }
h3 { font-size: 12.5pt; margin: 5mm 0 2mm; page-break-after: avoid; } p, li { margin: 1mm 0; }
table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 2mm 0 4mm; page-break-inside: auto; } td, th { border: 1px solid #d5dccf; padding: 3px 5px; vertical-align: top; text-align: left; }
th { background: #eef3ea; } tr { page-break-inside: avoid; }
figure { margin: 3mm 0 5mm; page-break-inside: avoid; } img { display: block; max-width: 100%; max-height: 190mm; width: auto; margin: 0 auto; border-radius: 6px; } .grid img { max-height: 95mm; } figcaption { font-size: 9pt; color: #4b5650; margin-top: 1mm; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; } .cover { page-break-after: always; padding-top: 40mm; }
.lead { font-size: 13pt; color: #3b4a40; } .pb { page-break-before: always; } code, pre { font-size: 8.5pt; background: #f3f5f0; } pre { padding: 3mm; white-space: pre-wrap; }
blockquote { margin: 2mm 0; padding: 2mm 4mm; background: #f5f8f2; border-left: 3px solid #9cb894; }
"""


def build():
    when = datetime.date.today().strftime("%-d %B %Y")
    quotes = ["Can you make the garden visible through the window at any angle. As id like it all to be in there eventually. Every floor and both gardens.",
              "The kitchen is directly under the living room and bathroom and bedroom 2 above that. It is 2 floors at the front and 3 at the back as it's on a hill. The alley has stairs down.",
              "So how can you now improve that to look real ... Write a full plan to get to the full scale upgrade as a HD render.",
              "Make sure the plan also has supporting evidence and photos needed in the report and it's a clear build for another [developer] to takeover from you and make this the best possible Hd model."]
    body = [f'<section class="cover"><h1>The whole house in HD</h1><p class="lead">The plan to a real-looking model of every floor and both gardens: what we have, what we need, and how it gets built.</p><p>{when}</p></section>',
            "<h2>What you asked</h2>" + "".join(f"<blockquote>“{q}”</blockquote>" for q in quotes),
            '<h2>Where the model is now</h2><div class="grid">' + "".join(pic(EV / f, c, 1100) for f, c in NOW if (EV / f).exists()) + "</div>",
            '<h2 class="pb">The evidence: your plans</h2>' + "".join(pic(IN / f, c, 1300) for f, c in PLANS),
            '<h2 class="pb">The evidence: photos</h2><div class="grid">' + "".join(pic(IN / f, c, 1100) for f, c in PHOTOS) + "</div>",
            '<h2 class="pb">The evidence in full</h2>' + md(H / "EVIDENCE.md"),
            '<h2 class="pb">The plan</h2>' + md(H / "HD_PLAN.md"),
            '<h2 class="pb">What we need from you: measurements and photos</h2>' + md(H / "SURVEY.md"),
            '<h2 class="pb">Appendix: the build specification</h2>' + md(H / "BUILD_SPEC.md")]
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(body)}</body></html>'
    src = TMP / "report.html"; src.write_text(html)
    with sync_playwright() as p:
        sys.path.insert(0, str(ROOT / "media-wall/src")); b = __import__("pw").launch(p)
        pg = b.new_page(); pg.goto(src.as_uri()); pg.wait_for_timeout(500)
        pg.pdf(path=str(OUT / "Whole_House_HD_Plan.pdf"), format="A4", print_background=True,
               display_header_footer=True, header_template="<span></span>",
               footer_template='<div style="font-size:8px;width:100%;text-align:center;color:#777">The whole house in HD · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
               margin={"top": "16mm", "bottom": "16mm", "left": "15mm", "right": "15mm"})
        b.close()
    print("report:", OUT / "Whole_House_HD_Plan.pdf")


if __name__ == "__main__":
    build()
