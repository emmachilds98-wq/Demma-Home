"""Demma's Home V1 (Phase 7): every check, one command, one verdict. The workflow runs it on every push and pull request; run it yourself
before you push. Exits non-zero if any check fails; prints one line each (the result lines to paste in a PR).

python3 tools/checks.py            the model's checks, flicker, clashes, privacy (repo and site), the repo's size, the front door, the media wall's page and taps
python3 tools/checks.py --quick    no browser: the model's checks, flicker, clashes, privacy, the repo's size

Needs the site built first (python3 tools/build.py); THREE_LOCAL serves three.js where the CDN is blocked."""
import json, os, pathlib, re, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC, HOUSE = ROOT / "media-wall/src", ROOT / "house"
SITE = pathlib.Path(os.environ.get("DEMMA_SITE") or ROOT / "_site")
SHOTS = ROOT / "_shots"


def sh(args, cwd=ROOT, timeout=1800):
    r = subprocess.run([sys.executable, *map(str, args)], cwd=cwd, capture_output=True, text=True, timeout=timeout, env=dict(os.environ, DEMMA_SITE=str(SITE)))
    return r.returncode, r.stdout + r.stderr


def model():
    code, out = sh(["check_model.py"], HOUSE)
    last = [l for l in out.splitlines() if "checks," in l]
    return code == 0, last[-1] if last else out[-300:]


def zfight():
    code, out = sh(["zfight.py", "0"], HOUSE)
    m = re.search(r"(\d+) pairs, (\d+) on the outside, (\d+) can be seen, (\d+) of them tied", out)   # V1.31 (U6): and none seen and tied
    return bool(m) and m.group(2) == "0" and m.group(4) == "0", m.group(0) if m else out[-300:]


def clash():
    code, out = sh(["clash.py"], SRC)
    m = re.search(r"(\d+) clashes, (\d+) close", out)
    return bool(m) and m.group(1) == "0", m.group(0) if m else out[-300:]


def privacy():
    a, out1 = sh([HOUSE / "privacy_check.py"])
    b, out2 = sh([HOUSE / "privacy_check.py", SITE]) if SITE.exists() else (0, "no site")
    return a == 0 and b == 0, out1.strip().splitlines()[-1] + " · site: " + out2.strip().splitlines()[-1]


def repo():
    """V1.7, the client: "ensure we're not overcrowding the repo": nothing a build makes is tracked (.gitignore), and no file over 1.5 MB
    but the client's photos (media-wall/inputs, kept whole: "put photos in, I need them all")."""
    git = lambda *a: subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True).stdout
    files = [f for f in git("ls-files", "-z").split("\0") if f]
    if not files:
        return True, "not a git checkout"
    built = [f for f in git("ls-files", "-ci", "--exclude-standard", "-z").split("\0") if f]
    size = {f: (ROOT / f).stat().st_size for f in files if (ROOT / f).is_file()}
    big = [f for f, n in size.items() if n > 1.5 * 2 ** 20 and not f.startswith("media-wall/inputs/")]
    photos = sum(n for f, n in size.items() if f.startswith("media-wall/inputs/"))
    # V1.36 (U11), the client: "clear the unwanted old data so we keep the repo under the max size": a budget for what's tracked and
    # for git's history (GitHub asks repositories to stay under 1 GB; a shallow checkout counts what it has)
    hist = sum(int(l.split()[1]) for l in git("count-objects", "-v").splitlines() if l.split()[0] in ("size:", "size-pack:")) / 1024
    tracked = sum(size.values()) / 2 ** 20
    over = tracked > 200 or hist > 750
    msg = (f"{len(files)} files, {tracked:.0f} MB tracked ({photos / 2 ** 20:.0f} MB the client's photos), {len(built)} built, {len(big)} over 1.5 MB, "
           f"history {hist:.0f} MB (budget 200 tracked, 750 history)")
    return not built and not big and not over, msg + (": " + ", ".join((built + big)[:4]) if built or big else "")


def sizes():
    """V1.30 (U5, U9): the numbers STATE.md quotes, from the built site, so they can't drift: the page, the photos, three.js's own
    file and the sizes still to measure (V1.37: no shared page any more, the client: "i dont need a copy here")"""
    if not (SITE / "index.html").exists():
        return True, "no site built"
    mb = lambda f: f.stat().st_size / 1e6
    tex = [f for f in SITE.glob("tex/*.jpg") if "_half." not in f.name]; half = [f for f in SITE.glob("tex/*_half.*.jpg")]; tj = next(SITE.glob("three.*.js"), None)   # V2.45: the photos, a file each
    hj = json.loads((SITE / "data/house.json").read_text()) if (SITE / "data/house.json").exists() else {}
    msg = (f"page {mb(SITE / 'index.html'):.1f} MB, photos {sum(map(mb, tex)):.1f} MB in {len(tex)} files ({sum(map(mb, half)):.1f} MB at half size), three.js " + (f"{mb(tj):.2f} MB own file" if tj else "from the CDN")
           + f", {len(hj.get('measure', []))} sizes to measure")
    bad = parts_parse()
    return not bad, msg + f", the 3D's {len(list((SRC / 'room3d').glob('*.js')))} parts" + (f": these don't parse alone: {bad}" if bad else " each parse alone")


def parts_parse():
    """V1.52: each part of the 3D's script (media-wall/src/room3d) starts at a top-level statement: it parses on its own (node --check)"""
    import shutil, tempfile
    if not shutil.which("node"):
        return []
    bad = []
    with tempfile.TemporaryDirectory() as td:
        for f in sorted((SRC / "room3d").glob("*.js")):
            t = pathlib.Path(td) / (f.stem + ".mjs"); t.write_text(f.read_text())
            if subprocess.run(["node", "--check", str(t)], capture_output=True).returncode:
                bad.append(f.name)
    return bad


def site():
    code, out = sh([ROOT / "tools/check_site.py", SITE], timeout=2400)
    last = [l for l in out.splitlines() if l.startswith("site check") or l.startswith("FAIL")]
    return code == 0, " | ".join(last[-4:]) or out[-300:]


def qa():
    SHOTS.mkdir(exist_ok=True)
    code, out = sh(["qa.py", SHOTS], SRC, timeout=2400)
    try:
        res = json.loads(out[out.index("{"):out.rindex("}") + 1])
    except ValueError:
        return False, out[-300:]
    bad = res["links"] + res["names"] + [f"{r['viewport']}: {x}" for r in res["runs"] for x in r["errors"] + r["fails"]]
    return not bad, "; ".join(bad[:4]) or f"the media wall's page at 390 and 1280: no errors, nothing off the edge, {len(res['runs'])} runs"


def taps():
    code, out = sh(["taptest.py", SHOTS], SRC, timeout=2400)
    errs = re.findall(r"errors: (\[.*\])", out)
    bad = [e for e in errs if e != "[]"]
    if len(errs) < 2:   # a run stopped before its end: say where (the script's last lines)
        return False, f"taps: {len(errs)} of 2 runs finished: " + " / ".join(out.strip().splitlines()[-6:])[-600:]
    return code == 0 and not bad, ("taps: " + "; ".join(bad)[:300]) if bad else f"taps on the media wall's pieces: {len(errs)} runs, no errors"


def main(argv):
    """python3 tools/checks.py [--quick | --only site,page,taps]"""
    quick = "--quick" in argv
    checks = [("model", model), ("flicker", zfight), ("clashes", clash), ("privacy", privacy), ("repo", repo), ("sizes", sizes)] + ([] if quick else [("site", site), ("page", qa), ("taps", taps)])
    if "--only" in argv:                                         # V1.35 (U10): one or more by name (the workflow runs the browser checks side by side)
        want = argv[argv.index("--only") + 1].split(",")
        checks = [c for c in [("model", model), ("flicker", zfight), ("clashes", clash), ("privacy", privacy), ("repo", repo), ("sizes", sizes), ("site", site), ("page", qa), ("taps", taps)] if c[0] in want]
    fails = 0
    for name, fn in checks:
        t = time.time()
        try:
            ok, msg = fn()
        except Exception as e:                                   # noqa: BLE001
            ok, msg = False, f"{type(e).__name__}: {e}"
        fails += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name:8} {msg}  ({time.time() - t:.0f} s)", flush=True)
    print(f"{len(checks)} checks, {fails} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
