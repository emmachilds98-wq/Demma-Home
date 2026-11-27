"""Demma's Home V1 (Phase 7): every check, one command, one verdict. The workflow runs it on every push and pull request; run it yourself
before you push. Exits non-zero if any check fails; prints one line each (the result lines to paste in a PR).

python3 tools/checks.py            the model's checks, flicker, clashes, privacy (repo and site), the repo's size, the front door, the media wall's page and taps;
                                   the speed budget (tools/perf_budget.json: the files in sizes, the four paths in site)
python3 tools/checks.py --quick    no browser: the model's checks, flicker, clashes, privacy, conflict markers, the repo's size, the test door's names

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


def markers():
    """N246 (A7): merge-conflict markers were committed into REAL_PLAN four times. Fails on any tracked text line that starts with
    "<<<<<<< " or ">>>>>>> " (a bare "=======" is a Markdown heading rule, so it isn't counted)."""
    r = subprocess.run(["git", "grep", "-nI", "-E", "^(<{7} |>{7} )"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode > 1:
        return True, "not a git checkout"
    hits = r.stdout.splitlines()
    return not hits, f"{len(hits)} conflict-marker lines" + (": " + ", ".join(h.split(":")[0] + ":" + h.split(":")[1] for h in hits[:4]) if hits else "")


def sizes():
    """V1.30 (U5, U9): the numbers STATE.md quotes, from the built site, so they can't drift: the page, the photos, three.js's own
    file and the sizes still to measure (V1.37: no shared page any more, the client: "i dont need a copy here")"""
    if not (SITE / "index.html").exists():
        return True, "no site built"
    mb = lambda f: f.stat().st_size / 1e6
    tex = [f for f in SITE.glob("tex/*.jpg") if "_half." not in f.name]; half = [f for f in SITE.glob("tex/*_half.*.jpg")]; tj = next(SITE.glob("three.*.js"), None)   # V2.45: the photos, a file each
    k2 = list(SITE.glob("tex/*.ktx2"))   # N196: the colour photos as KTX2, fetched instead of their JPEGs where the chip takes them
    hj = json.loads((SITE / "data/house.json").read_text()) if (SITE / "data/house.json").exists() else {}
    msg = (f"page {mb(SITE / 'index.html'):.1f} MB, photos {sum(map(mb, tex)):.1f} MB in {len(tex)} files ({sum(map(mb, half)):.1f} MB at half size, {sum(map(mb, k2)):.1f} MB as KTX2), three.js " + (f"{mb(tj):.2f} MB own file" if tj else "from the CDN")
           + f", {len(hj.get('measure', []))} sizes to measure")
    bad = parts_parse()
    # V3.02 (N45): every piece in the "Add a piece" catalogue names the fit.SOURCES row its size comes from
    sys.path.insert(0, str(SRC)); import fit
    refs = re.findall(r'^  (\w+): \{ n: "[^"]+".*?ref: "(\w+)"', (SRC / "room3d/08_house_catalogue.js").read_text(), re.M)
    cite = [f"catalogue {k}: no source {r}" for k, r in refs if r not in fit.SOURCES] + ([] if len(refs) >= 26 else [f"catalogue: {len(refs)} pieces cite a source"])
    shop = fit.shop_pieces() + fit.opt_pieces() + fit.cat_pieces()   # N219: each shop's piece its own row, with its size, price and page; N242: the storage ideas' buys; N243: the catalogue
    cite += [f"shop piece {q.get('name')}: no size, price or page" for q in shop if not (q.get("w") and q.get("d") and q.get("price") and str(q.get("url", "")).startswith("https://") and fit.shop_key(q) in fit.SOURCES)]
    # V2.75 (N26): the speed budget's files (tools/perf_budget.json; the site check measures the paths): over it, the round fails
    got = {"page_mb": mb(SITE / "index.html"), "three_mb": mb(tj) if tj else 0, "photos_mb": sum(map(mb, tex)), "half_mb": sum(map(mb, half)), "ktx2_mb": sum(map(mb, k2))}
    want = json.loads((ROOT / "tools/perf_budget.json").read_text())["files"]
    over = [f"{k} {got[k]:.2f} over {v}" for k, v in want.items() if got[k] > v]
    return not bad and not over and not cite, msg + f", the 3D's {len(list((SRC / 'room3d').glob('*.js')))} parts" + (f": these don't parse alone: {bad}" if bad else " each parse alone") + \
        (f"; over the speed budget: {', '.join(over)}" if over else ", within the speed budget") + \
        (f"; {', '.join(cite)}" if cite else f", the {len(refs)} catalogue pieces' and {len(shop)} shop pieces' sizes cited")


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


def lean():
    """N176: nothing the code doesn't use: the 3D's top-level functions and names, page.css's classes and house/model.py's MATS keys,
    each found in the code that would use it (comments left out), and the 3D's comment share (the story is in docs/HISTORY.md)"""
    esb = ROOT / "node_modules/.bin/esbuild"
    def nocom(t):   # the 3D without its comments (esbuild prints the code back, names kept); without esbuild, line comments only
        if esb.exists():
            r = subprocess.run([str(esb), "--loader=js", "--log-level=error"], input=t, capture_output=True, text=True)
            if r.returncode == 0:
                return r.stdout
        return re.sub(r"(?m)^\s*//.*$", "", t)
    parts = sorted((SRC / "room3d").glob("*.js"))
    js = [p.read_text() for p in parts]
    py = [re.sub(r"(?m)^\s*#.*$", "", f.read_text()) for f in [*SRC.glob("*.py"), *(ROOT / "tools").glob("*.py"), *(ROOT / "house").glob("*.py")]]
    code = [nocom("".join(js))] + [nocom(f.read_text()) for f in SRC.glob("*.js")] + py
    words = {}
    for t in code:
        for w in re.findall(r"[A-Za-z_$][\w$]*", t):
            words[w] = words.get(w, 0) + 1
    unused = [f"{p.name} {n}" for p, t in zip(parts, js)
              for n in (a or b for a, b in re.findall(r"^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=", t, re.M))
              if words.get(n, 0) <= 1]
    # page.css: a class nothing puts on an element (class="...", classList, className) or looks for (a selector in code)
    css = re.sub(r"/\*.*?\*/", "", (SRC / "page.css").read_text(), flags=re.S)
    src = "".join(code)
    used = set()
    for m in re.finditer(r"class(?:Name)?\s*=\s*\\?[\"']([^\"'\\]*)", src):
        used.update(m.group(1).replace("${", " ").split())
    for m in re.finditer(r"classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)", src):
        used.update(re.findall(r"[\"']([\w-]+)[\"']", m.group(1)))
    for m in re.finditer(r"(?:closest|querySelector(?:All)?|qsa?|matches|\$\$?)\(\s*[\"'`]([^\"'`]*)", src):
        used.update(re.findall(r"\.([\w-]+)", m.group(1)))
    cls = sorted({c for c in re.findall(r"\.([a-zA-Z][\w-]*)", css) if not re.fullmatch(r"\d.*", c)})
    loose = [c for c in cls if c not in used and not re.search(r"(?<![\w-])" + re.escape(c) + r"(?![\w-])", src)]
    unused += [f"page.css .{c}" for c in loose]
    # house/model.py's materials: a key no piece asks for
    mp = (ROOT / "house/model.py").read_text()
    i = mp.index("MATS = {"); j = mp.index("\n}", i)
    rest = mp[:i] + mp[j:] + "".join(code) + "".join(f.read_text() for f in (ROOT / "house").rglob("*.py") if f.name != "model.py")
    unused += [f"MATS {k}" for k in re.findall(r'"(\w+)":\s*\(', mp[i:j]) if not re.search(r"\b" + k + r"\b", rest)]
    lines = sum(t.count("\n") for t in js)
    com = sum(1 for t in js for l in t.splitlines() if l.lstrip().startswith(("//", "/*", "*")))
    msg = f"the 3D {lines} lines, {com} of them comment ({100 * com / lines:.0f}%); {len(cls)} page.css classes"
    return not unused, msg + (f"; nothing uses: {', '.join(unused[:12])}" if unused else ": every name, class and material used")


def names():
    """N191: the 3D's parts share one scope, so a name used but never made (or made twice) only shows in the browser: ESLint's recommended
    rules on the joined script. Needs npm ci (eslint is a dev dependency)."""
    sys.path.insert(0, str(SRC)); import room3d_src
    SHOTS.mkdir(exist_ok=True); (SHOTS / "room3d.js").write_text(room3d_src.js())
    files = [SHOTS / "room3d.js"]
    r = subprocess.run(["npx", "--no-install", "eslint", "-c", "tools/eslint.config.mjs", *map(str, files)], cwd=ROOT, capture_output=True, text=True)
    errs = [l.strip() for l in r.stdout.splitlines() if " error " in l]
    return r.returncode == 0, f"the 3D's {len(room3d_src.parts())} parts as one, {len(errs)} problems" + (": " + "; ".join(errs[:6]) if errs else "") if r.returncode in (0, 1) else r.stderr[-300:]


def site():
    code, out = sh([ROOT / "tools/check_site.py", SITE], timeout=2400)
    last = [l for l in out.splitlines() if l.startswith("site check") or l.startswith("FAIL")]
    return code == 0, " | ".join(last[-4:]) or out[-300:]


def hitch():
    code, out = sh([ROOT / "tools/check_site.py", SITE, "--hitch"], timeout=2400)
    last = [l for l in out.splitlines() if l.startswith(("hitch check", "hitches", "speed", "FAIL"))]
    return code == 0, " | ".join(last[-4:]) or out[-300:]


def features():
    """N257: the customisation scenarios on the phone (check_site.py --features), their own CI job."""
    code, out = sh([ROOT / "tools/check_site.py", SITE, "--features"], timeout=2400)
    last = [l for l in out.splitlines() if l.startswith(("features", "site check", "FAIL"))]
    return code == 0, " | ".join(last[-4:]) or out[-300:]


def dbgnames():
    """N257: every R3D._dbg name the site check reaches for still exists (check_site.py --dbg-names: no site, no browser, a second)."""
    if "--dbg-names" not in (ROOT / "tools/check_site.py").read_text():
        return True, "check_site.py has no --dbg-names yet"
    code, out = sh([ROOT / "tools/check_site.py", "--dbg-names"], timeout=120)
    return code == 0, (out.strip().splitlines() or ["no output"])[-1][:300]


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
    want = 1 if os.environ.get("TAPS_W") else 2   # N338: one width a CI job
    if len(errs) < want:   # a run stopped before its end: say where (the script's last lines)
        return False, f"taps: {len(errs)} of {want} runs finished: " + " / ".join(out.strip().splitlines()[-6:])[-600:]
    return code == 0 and not bad, ("taps: " + "; ".join(bad)[:300]) if bad else f"taps on the media wall's pieces: {len(errs)} runs, no errors"


def main(argv):
    """python3 tools/checks.py [--quick | --only site,page,taps]"""
    quick = "--quick" in argv
    checks = [("model", model), ("flicker", zfight), ("clashes", clash), ("privacy", privacy), ("markers", markers), ("repo", repo), ("sizes", sizes), ("lean", lean), ("names", names), ("dbgnames", dbgnames)] + ([] if quick else [("site", site), ("features", features), ("hitch", hitch), ("page", qa), ("taps", taps)])
    if "--only" in argv:                                         # V1.35 (U10): one or more by name (the workflow runs the browser checks side by side)
        want = argv[argv.index("--only") + 1].split(",")
        checks = [c for c in [("model", model), ("flicker", zfight), ("clashes", clash), ("privacy", privacy), ("markers", markers), ("repo", repo), ("sizes", sizes), ("lean", lean), ("names", names), ("dbgnames", dbgnames), ("site", site), ("features", features), ("hitch", hitch), ("page", qa), ("taps", taps)] if c[0] in want]
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
