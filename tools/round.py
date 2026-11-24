"""Demma's Home V1 (Phase 7): a client round in one command, instead of twelve.

python3 tools/round.py "what changed, in the client's words" [--rows rows.json | --link URL] [--fast]

1. (N248) No version here any more: tools/ship.py takes the next free one at merge and writes VERSION, HISTORY and STATE's version line.
2. Pull the client's edits and measurements from the app (tools/pull_edits.py; rows saved from the artifact's database with the
   ArtifactData tool, or a GitHub Pages share link).
3. Build everything (tools/build.py; --fast keeps the renders and PDFs) and run every check (tools/checks.py).
Then: tick the row in docs/REAL_PLAN.md, commit, push, open the PR with the check lines
this prints, then python3 tools/ship.py "words" merges it; GitHub Pages publishes it in a few minutes."""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def step(args, ok_codes=(0,)):
    print("·", " ".join(map(str, args)), flush=True)
    r = subprocess.run([sys.executable, *map(str, args)], cwd=ROOT)
    if r.returncode not in ok_codes:
        sys.exit(f"stopped: {args[0]} exited {r.returncode}")
    return r.returncode


def main(argv):
    words = next((a for a in argv if not a.startswith("--")), None)
    if not words:
        print(__doc__); return 2
    print(f"round: {words}")
    if "--rows" in argv:
        step(["tools/pull_edits.py", argv[argv.index("--rows") + 1]], ok_codes=(0, 1))
    if "--link" in argv:
        step(["tools/pull_edits.py", "--link", argv[argv.index("--link") + 1]], ok_codes=(0, 1))
    step(["tools/build.py"] + (["--fast"] if "--fast" in argv else []))
    code = step(["tools/checks.py"], ok_codes=(0, 1))
    print(f"round built; checks {'pass' if code == 0 else 'FAILED: fix before the PR'}. Then: commit, push, python3 tools/ship.py \"{words}\".")
    return code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
