"""Demma's Home V1 (Phase 7): a client round in one command, instead of twelve.

python3 tools/round.py "what changed, in the client's words" [--rows rows.json | --link URL] [--no-bump] [--fast]

1. Bump the version (VERSION: 1.0 → 1.1 → 1.2 ...; it shows as V1.1), unless --no-bump.
2. Pull the client's edits and measurements from the app (tools/pull_edits.py; rows saved from the artifact's database with the
   ArtifactData tool, or a GitHub Pages share link).
3. Build everything (tools/build.py; --fast keeps the renders and PDFs) and run every check (tools/checks.py).
4. Add the round to docs/HISTORY.md and move docs/STATE.md's version line on.
Then: rewrite docs/STATE.md's "What's open", update the status board in docs/V1_PLAN.md, commit, open the PR with the check lines
this prints, merge, republish the artifact (docs/STATE.md says how)."""
import datetime, pathlib, re, subprocess, sys

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
    vf = ROOT / "VERSION"; v = vf.read_text().strip()
    if "--no-bump" not in argv:
        major, minor = (v.split(".") + ["0"])[:2]
        v = f"{major}.{int(minor) + 1}"; vf.write_text(v + "\n")
    label = "V" + (v[:-2] if v.endswith(".0") else v)
    print(f"round {label}: {words}")
    if "--rows" in argv:
        step(["tools/pull_edits.py", argv[argv.index("--rows") + 1]], ok_codes=(0, 1))
    if "--link" in argv:
        step(["tools/pull_edits.py", "--link", argv[argv.index("--link") + 1]], ok_codes=(0, 1))
    step(["tools/build.py"] + (["--fast"] if "--fast" in argv else []))
    code = step(["tools/checks.py"], ok_codes=(0, 1))
    when = datetime.date.today().strftime("%-d %b %Y")
    hist = ROOT / "docs/HISTORY.md"
    hist.write_text(hist.read_text().rstrip() + f"\n- **{label}** ({when}): {words}\n")
    st = ROOT / "docs/STATE.md"
    if st.exists():
        st.write_text(re.sub(r"(?m)^\*\*Version:\*\* .*$", f"**Version:** {label} ({when})", st.read_text()))
    print(f"round {label} built; checks {'pass' if code == 0 else 'FAILED: fix before the PR'}. Now STATE.md's open list, the board, the PR.")
    return code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
