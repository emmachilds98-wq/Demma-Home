"""Demma's Home V1: the whole build in one command, into _site/ (never committed: the workflow builds it on every push and publishes it).

python3 tools/build.py            everything: the renders, the plan PDFs, the house file, the app, the 3D page
python3 tools/build.py --fast     keep the renders and PDFs already made (a quick rebuild of the data, the app and the pages)
python3 tools/build.py --stills   also render each room's still in headless 3D (tools/stills.py; slow, CI does it)

What goes where (docs/STATE.md has the same):
  _site/index.html, app/, sw.js, manifest.webmanifest   the app (app/)
  _site/data/house.json                                  the house file (house/export_house.py)
  _site/data/projects/<id>.json, index.json              the projects (media-wall/src/export_project.py)
  _site/data/media.json                                  each room's still and its photos
  _site/room/index.html                                  the 3D, for the app's frame (room3d_page.embed)
  _site/plan.html                                        the media wall's full page (build_viewer.py)
  _site/media-wall/out/                                  the plan PDFs and HD pictures
  _site/media-wall/src/art/                              the pictures the pages use
  _site/stills/, photos/                                 the rooms' stills and the client's photos, sized for phones"""
import json, os, pathlib, re, shutil, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = pathlib.Path(os.environ.get("DEMMA_SITE") or ROOT / "_site")
SRC = ROOT / "media-wall/src"
HOUSE = ROOT / "house"
VERSION = (ROOT / "VERSION").read_text().strip()
LABEL = "V" + (VERSION[:-2] if VERSION.endswith(".0") else VERSION)
ENV = dict(os.environ, DEMMA_SITE=str(SITE), PYTHONDONTWRITEBYTECODE="1")

# Next up's "Decide" cards: what only the client can choose (docs/STATE.md "Open with the client")
DECIDE = [dict(what="The socket on the side wall", href="#/room/living"),
          dict(what="Near-photo pictures, minutes each?", href="#/home")]

# the client's photos by room (media-wall/inputs): (start of the file name, room, label)
PHOTOS = [("photo_bathroom_sink", "bathroom", "Sink"), ("photo_bathroom_bath", "bathroom", "Bath"), ("photo_bathroom_from_door", "bathroom", "The door"),
          ("photo_bathroom_end_from_stairs", "bathroom", "Stairs"), ("photo_bedroom2_25oct", "bed2", "Now"), ("photo_kitchen_from_door", "kitchen", "The door"),
          ("photo_kitchen_window_run", "kitchen", "Window"), ("photo_kitchen_corner_fridge", "kitchen", "Fridge"), ("photo_kitchen_cubby_doors", "kitchen", "Cubby"),
          ("photo_kitchen_now", "kitchen", "Now"), ("photo_hall_front_door", "hall", "Front door"), ("photo_hall_to_living", "hall", "To the living room"),
          ("photo_landing_doors", "landing", "Doors"), ("photo_landing_balustrade", "landing", "Banister"), ("photo_landing_from_office", "landing", "From the office"),
          ("photo_landing_to_bathroom", "landing", "Bathroom door"), ("photo_master_alcove", "master", "Alcove"), ("photo_master_bed", "master", "Bed"),
          ("photo_office_desk_wall", "bed3", "Desk wall"), ("photo_office_wide", "bed3", "Wide"), ("photo_office_corner", "bed3", "Corner"),
          ("photo_wc_25oct", "wc", "WC"), ("photo_stairs_lower_down", "lower_landing", "Stairs down"), ("photo_current_living_room", "living", "Now"),
          ("photo_room_curtains_evening", "living", "Evening"), ("photo_stairs_from_living_room", "living", "Stairs"), ("photo_sofa_window_wall", "living", "Window wall"),
          ("room_photo_west", "living", "West"), ("photo_living_door_to_hall", "living", "Door"), ("photo_house_front", "house", "Front"), ("photo_house_rear", "house", "Back"),
          ("photo_garden_summer", "house", "Garden")]
# until tools/stills.py has made a still of each place, the model's own evidence pictures (house/evidence)
STILL_FALLBACK = {"house": "now_house_all.jpg", "floor_first": "now_house_first.jpg", "floor_ground": "now_house_ground.jpg", "floor_lower": "now_house_lower.jpg",
                  "bathroom": "now_bath.jpg", "bed2": "now_bed2.jpg", "hall": "now_hall.jpg", "kitchen": "now_kitchen.jpg", "landing": "now_landing.jpg",
                  "master": "now_master.jpg", "bed3": "now_office.jpg", "wc": "now_wc.jpg", "porch": "now_porch.jpg", "living": "now_living_room_whole.jpg"}


def run(cmd, cwd=SRC):
    t = time.time()
    print("·", " ".join(map(str, cmd)), flush=True)
    subprocess.run([sys.executable, *map(str, cmd)], cwd=cwd, env=ENV, check=True)
    print(f"  {time.time() - t:.0f} s", flush=True)


def webp(src, dst, width):
    from PIL import Image, ImageOps
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")      # EXIF gone (no location), the right way up
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=80, method=5)


def media():
    out = {"stills": {}, "photos": {}}
    st = SITE / "stills"
    for k, fb in STILL_FALLBACK.items():
        made = st / f"{k}.webp"
        if not made.exists() and (HOUSE / "evidence" / fb).exists():
            webp(HOUSE / "evidence" / fb, made, 960)
    for p in sorted(st.glob("*.webp")):
        out["stills"][p.stem] = f"stills/{p.name}"
    for pre, room, label in PHOTOS:
        for src in sorted((ROOT / "media-wall/inputs").glob(pre + "*")):
            if src.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
                continue
            small, full = SITE / "photos" / room / f"{src.stem}.webp", SITE / "photos" / room / f"{src.stem}_full.webp"
            webp(src, small, 480); webp(src, full, 1600)
            out["photos"].setdefault(room, []).append(dict(src=f"photos/{room}/{small.name}", full=f"photos/{room}/{full.name}", label=label))
            break
    return out


def icons():
    from PIL import Image, ImageDraw
    for n in (180, 192, 512):                                   # 180: the iPhone home screen
        im = Image.new("RGB", (n, n), "#1D2A22"); d = ImageDraw.Draw(im); s = n / 64
        d.polygon([(14 * s, 31 * s), (32 * s, 16 * s), (50 * s, 31 * s), (50 * s, 50 * s), (38 * s, 50 * s), (38 * s, 38 * s), (26 * s, 38 * s), (26 * s, 50 * s), (14 * s, 50 * s)], fill="#CFF3D9")
        im.save(SITE / "app" / f"icon-{n}.png")


def app():
    dst = SITE / "app"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(ROOT / "app", dst, ignore=shutil.ignore_patterns("index.html", "sw.js"))
    stamp = f"{VERSION}-{int(time.time())}"
    sub = lambda t: t.replace("__V__", stamp).replace("__LABEL__", LABEL)
    (SITE / "index.html").write_text(sub((ROOT / "app/index.html").read_text()))
    (SITE / "sw.js").write_text(sub((ROOT / "app/sw.js").read_text()))
    # the shared page (the claude.ai artifact) wraps the page in its own document: the same page without the outer tags
    page = sub((ROOT / "app/index.html").read_text())
    page = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", page, flags=re.I)
    page = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", page)
    page = re.sub(r"</head>\s*<body>\s*", "", page).replace("</body>\n</html>", "").replace('<link rel="manifest" href="manifest.webmanifest">\n', "")
    (SITE / "artifact.html").write_text(page)
    (SITE / "manifest.webmanifest").write_text(json.dumps({
        "name": "Demma's Home", "short_name": "Demma's Home", "description": "The whole house in 3D, what to measure, the projects, what to buy.",
        "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#F6F1E7", "theme_color": "#F6F1E7",
        "icons": [{"src": f"app/icon-{n}.png", "sizes": f"{n}x{n}", "type": "image/png", "purpose": "any maskable"} for n in (192, 512)]}, indent=1))
    (SITE / ".nojekyll").write_text("")
    icons()


def main(argv):
    fast, stills = "--fast" in argv, "--stills" in argv
    t0 = time.time()
    SITE.mkdir(parents=True, exist_ok=True)
    (SRC.parent / "out").mkdir(exist_ok=True)
    have_pdfs = any((SRC.parent / "out").glob(f"Demmas_Home_{LABEL}_Plan.pdf"))
    if not (fast and (SRC / "art/art_join_mint.webp").exists()):
        run(["make_images.py"])                                           # the drawn renders, the diagrams, art/
    run(["export3d.py"])                                                  # the 3D's data (the house with its pieces' tags)
    if not (fast and have_pdfs):
        run(["build_doc.py"])                                             # the plan and the build guide (PDFs)
    run(["build_viewer.py"])                                              # the media wall's full page (_site/plan.html)
    run(["export_project.py", SITE / "data/projects/media-wall.json"])
    index = [dict(id="media-wall", name="The media wall", room="living", file="data/projects/media-wall.json")]
    for pf in sorted((ROOT / "projects").glob("*/project.json")):             # Phase 6: a hand-written project (projects/README.md)
        pj = json.loads(pf.read_text())
        missing = [k for k in ("id", "name", "room", "cost", "what", "places", "buy", "phases", "options", "files") if k not in pj]
        if missing:
            sys.exit(f"{pf.relative_to(ROOT)}: missing {', '.join(missing)} (projects/project.schema.json)")
        shutil.copy(pf, SITE / f"data/projects/{pj['id']}.json")
        index.append(dict(id=pj["id"], name=pj["name"], room=pj["room"], file=f"data/projects/{pj['id']}.json"))
    (SITE / "data/projects/index.json").write_text(json.dumps(index))
    run(["export_house.py", SITE / "data/house.json"], cwd=HOUSE)
    sys.path.insert(0, str(SRC))
    import room3d_page
    room3d_page.embed(SITE / "room/index.html", art="../media-wall/src/art/")
    if not fast or not (HOUSE / "out/Whole_House_HD_Plan.pdf").exists():
        run(["build_report.py"], cwd=HOUSE)                               # the whole-house report (PDF)
    for d in ("media-wall/out", "media-wall/src/art", "house/out"):
        if (SITE / d).exists():
            shutil.rmtree(SITE / d)
    shutil.copytree(SRC.parent / "out", SITE / "media-wall/out", ignore=shutil.ignore_patterns("v*"))
    shutil.copytree(SRC / "art", SITE / "media-wall/src/art")
    if (HOUSE / "out").exists():
        shutil.copytree(HOUSE / "out", SITE / "house/out")
    app()
    if stills:
        run([ROOT / "tools/stills.py"], cwd=ROOT)
    (SITE / "data/media.json").write_text(json.dumps(media()))
    (SITE / "data/next.json").write_text(json.dumps(dict(decide=DECIDE)))
    size = sum(p.stat().st_size for p in SITE.rglob("*") if p.is_file())
    print(f"built {LABEL} into {SITE.relative_to(ROOT) if SITE.is_relative_to(ROOT) else SITE}: {size / 1e6:.0f} MB in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main(sys.argv[1:])
