"""Demma's Home V1 (Phase 7): every check, one command, one verdict. The workflow runs it on every push and pull request; run it yourself
before you push. Exits non-zero if any check fails; prints one line each (the result lines to paste in a PR).

python3 tools/checks.py            the model's checks, flicker, clashes, privacy (repo and site), the front door, the media wall's page and taps
python3 tools/checks.py --quick    no browser: the model's checks, flicker, clashes, privacy

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
    m = re.search(r"(\d+) pairs, (\d+) on the outside", out)
    return bool(m) and m.group(2) == "0", m.group(0) if m else out[-300:]


def clash():
    code, out = sh(["clash.py"], SRC)
    m = re.search(r"(\d+) clashes, (\d+) close", out)
    return bool(m) and m.group(1) == "0", m.group(0) if m else out[-300:]


def privacy():
    a, out1 = sh([HOUSE / "privacy_check.py"])
    b, out2 = sh([HOUSE / "privacy_check.py", SITE]) if SITE.exists() else (0, "no site")
    return a == 0 and b == 0, out1.strip().splitlines()[-1] + " · site: " + out2.strip().splitlines()[-1]


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
    quick = "--quick" in argv
    checks = [("model", model), ("flicker", zfight), ("clashes", clash), ("privacy", privacy)] + ([] if quick else [("site", site), ("page", qa), ("taps", taps)])
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
