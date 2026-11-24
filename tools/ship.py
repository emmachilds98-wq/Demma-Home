"""N248 (A4): versions at merge only. Run on a row's branch (pushed, clean) when the row is ready; only this writes VERSION and the
version lines, so two sessions never make the same version (two V4.59s were made).

python3 tools/ship.py "one line, in the client's words" [--pr N] [--dry-run] [--no-merge]

1. Merge origin/main into the branch (a conflict only in the version lines takes main's; any other stops: fix it, commit, run again).
2. The next free version: main's VERSION + 0.01 (4.62 → 4.63).
3. VERSION; one HISTORY line; STATE's version line (the current version only); HANDOVER's two "start here" headings.
4. checks.py --quick and privacy_check.py; stops if either fails.
5. One commit "V4.63: words", pushed; then the branch's PR merged with gh (--pr, or the open PR for this branch). If main moved
   meanwhile, it starts again (up to 3 times). Without gh it prints what's left to do.
PR titles and branch names name the row (N248), never a version."""
import datetime, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
LINES = {"VERSION", "docs/HISTORY.md", "docs/STATE.md", "docs/HANDOVER.md"}   # what only ship.py writes


def run(*a, check=True):
    r = subprocess.run(list(a), cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f"stopped: {' '.join(a[:3])} … exited {r.returncode}\n{(r.stdout + r.stderr)[-800:]}")
    return r


def git(*a, check=True):
    return run("git", *a, check=check).stdout.strip()


def next_version(main_v):
    major, minor = (main_v.strip().split(".") + ["0"])[:2]
    return f"{major}.{int(minor) + 1:0{len(minor)}d}"


def label(v):
    return "V" + (v[:-2] if v.endswith(".0") else v)


def write_lines(v, words):
    when = datetime.date.today().strftime("%-d %b %Y")
    lab = label(v)
    (ROOT / "VERSION").write_text(v + "\n")
    hist = ROOT / "docs/HISTORY.md"
    hist.write_text(hist.read_text().rstrip() + f"\n- **{lab}** ({when}): {words}\n")
    st = ROOT / "docs/STATE.md"
    st.write_text(re.sub(r"(?m)^\*\*Version:\*\* .*$", lambda m: f"**Version:** {lab} ({when}): {words}", st.read_text(), count=1))
    ho = ROOT / "docs/HANDOVER.md"
    t = re.sub(r"(?m)^(# Handover|## Now) \([^)]*: start here\)", lambda m: f"{m.group(1)} ({when}, {lab}: start here)", ho.read_text(), count=2)
    ho.write_text(t)
    return lab


def main(argv):
    pr = argv[argv.index("--pr") + 1] if "--pr" in argv else None
    words = next((a for a in argv if not a.startswith("--") and a != pr), None)
    if not words:
        print(__doc__); return 2
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch in ("main", "HEAD"):
        print("run it on the row's branch, not main"); return 1
    if git("status", "--porcelain", "--untracked-files=no"):
        print("commit (and push) your changes first"); return 1
    for _ in range(3):
        git("fetch", "-q", "origin", "main")
        main_sha = git("rev-parse", "origin/main")
        if "--dry-run" in argv:
            print(f"would ship {label(next_version(git('show', 'origin/main:VERSION')))} from {branch}: {words}"); return 0
        if run("git", "merge", "--no-edit", "origin/main", check=False).returncode:
            clash = set(git("diff", "--name-only", "--diff-filter=U").split())
            if not clash or not clash <= LINES:                    # a real conflict in the row's own files
                print("merging main hit a conflict: fix it, commit, run ship.py again"); return 1
            git("checkout", "--theirs", *clash); git("add", *clash)   # only the version lines: main's win, this branch takes the next
            git("commit", "-qm", "Merge main (its version lines kept; this branch takes the next)")
        v = next_version(git("show", "origin/main:VERSION"))
        lab = write_lines(v, words)
        for args in ([sys.executable, "tools/checks.py", "--quick"], [sys.executable, "house/privacy_check.py"]):
            r = run(*args, check=False)
            print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-300:])
            if r.returncode:
                run("git", "checkout", "--", ".")
                print("stopped: fix what failed (the version lines were put back)"); return 1
        git("fetch", "-q", "origin", "main")
        if git("rev-parse", "origin/main") != main_sha:            # another merge landed during the checks: take the next number
            run("git", "checkout", "--", ".")
            print("main moved meanwhile: again"); continue
        git("commit", "-qam", f"{lab}: {words}")
        git("push", "-q", "-u", "origin", branch)
        if "--no-merge" in argv or not shutil.which("gh"):
            print(f"{lab} pushed on {branch}: merge its PR now" + ("" if shutil.which("gh") else " (no gh here)")); return 0
        r = run("gh", "pr", "merge", *([pr] if pr else []), "--merge", check=False)
        if r.returncode:
            print(f"{lab} pushed on {branch}, but gh couldn't merge: {r.stderr.strip()[:200]} (main moved? run ship.py again)"); return 1
        print(f"{lab} merged from {branch}"); return 0
    print("main kept moving: try again"); return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
