"""Demma's Home: the whole build in one command, into _site/ (never committed: the workflow builds it on every push and publishes it).

python3 tools/build.py            everything: the renders, the plan PDFs, the house file, the page
python3 tools/build.py --fast     keep the renders and PDFs already made (a quick rebuild of the data and the page)

What goes where (docs/STATE.md has the same):
  _site/index.html (and plan.html)                       the site: the house and the living room in 3D, Plan, Build, Buy (build_viewer.py)
  _site/sw.js, manifest.webmanifest                      offline and Add to Home Screen (build_viewer.pwa_files)
  _site/artifact.html                                    the same page for the shared page (the claude.ai artifact)
  _site/data/house.json                                  the house file (house/export_house.py; tools/pull_edits.py checks against it)
  _site/data/projects/<id>.json, index.json              the projects (media-wall/src/export_project.py; room for each room's own)
  _site/media-wall/out/                                  the plan PDFs and HD pictures
  _site/media-wall/src/art/                              the pictures the page uses"""
import json, os, pathlib, re, shutil, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = pathlib.Path(os.environ.get("DEMMA_SITE") or ROOT / "_site")
SRC = ROOT / "media-wall/src"
HOUSE = ROOT / "house"
VERSION = (ROOT / "VERSION").read_text().strip()
LABEL = "V" + (VERSION[:-2] if VERSION.endswith(".0") else VERSION)
ENV = dict(os.environ, DEMMA_SITE=str(SITE), PYTHONDONTWRITEBYTECODE="1")


def run(cmd, cwd=SRC):
    t = time.time()
    print("·", " ".join(map(str, cmd)), flush=True)
    subprocess.run([sys.executable, *map(str, cmd)], cwd=cwd, env=ENV, check=True)
    print(f"  {time.time() - t:.0f} s", flush=True)


def artifact():
    """the shared page (the claude.ai artifact) wraps the page in its own document: the same page without the outer tags; the PDFs
    open from GitHub Pages (the artifact doesn't carry them)"""
    page = (SITE / "index.html").read_text()
    page = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", page, flags=re.I)
    page = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", page)
    page = re.sub(r"</head>\s*<body>", "", page).replace("</body>\n</html>\n", "").replace('<link rel="manifest" href="manifest.webmanifest">\n', "")
    page = re.sub(r'<script type="application/json" id="photo-data" data-src="([^"]+)"></script>',   # V1.9: its photos inline again
                  lambda m: '<script type="application/json" id="photo-data">' + (SITE / m.group(1)).read_text() + "</script>", page)
    page = page.replace('href="media-wall/out/', 'href="https://emmachilds98-wq.github.io/Demma-Home/media-wall/out/')
    (SITE / "artifact.html").write_text(page)


def prune(out):
    """V1.17: only the newest version of each render and PDF stays (each round left a set: 549 MB by V1.16; a --fast build keeps the
    newest renders, build_doc.latest)"""
    newest = {}
    for f in out.iterdir():
        m = re.search(r"(?<![0-9A-Za-z])V(\d+(?:\.\d+)?)(?![0-9.])", f.name)
        if f.is_file() and m:
            key, ver = f.name.replace(m.group(0), "V*", 1), tuple(int(n) for n in m.group(1).split("."))
            if key in newest and newest[key][0] > ver:
                f.unlink()
            else:
                if key in newest:
                    newest[key][1].unlink()
                newest[key] = (ver, f)


def main(argv):
    fast = "--fast" in argv
    t0 = time.time()
    SITE.mkdir(parents=True, exist_ok=True)
    (SRC.parent / "out").mkdir(exist_ok=True)
    have_pdfs = any((SRC.parent / "out").glob(f"Demmas_Home_{LABEL}_Plan.pdf"))
    if not (fast and (SRC / "art/art_join_mint.webp").exists()):
        run(["make_images.py"])                                           # the drawn renders, the diagrams, art/
    run(["export3d.py"])                                                  # the 3D's data (the house with its pieces' tags)
    if not (fast and have_pdfs):
        run(["build_doc.py"])                                             # the plan and the build guide (PDFs)
    run(["build_viewer.py"])                                              # the site: index.html (and plan.html), offline, the icons
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
    if not fast or not (HOUSE / "out/Whole_House_HD_Plan.pdf").exists():
        run(["build_report.py"], cwd=HOUSE)                               # the whole-house report (PDF)
    prune(SRC.parent / "out")
    for d in ("media-wall/out", "media-wall/src/art", "house/out"):
        if (SITE / d).exists():
            shutil.rmtree(SITE / d)
    shutil.copytree(SRC.parent / "out", SITE / "media-wall/out", ignore=shutil.ignore_patterns("v*"))
    shutil.copytree(SRC / "art", SITE / "media-wall/src/art")
    if (HOUSE / "out").exists():
        shutil.copytree(HOUSE / "out", SITE / "house/out")
    artifact()
    (SITE / ".nojekyll").write_text("")
    size = sum(p.stat().st_size for p in SITE.rglob("*") if p.is_file())
    print(f"built {LABEL} into {SITE.relative_to(ROOT) if SITE.is_relative_to(ROOT) else SITE}: {size / 1e6:.0f} MB in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main(sys.argv[1:])
