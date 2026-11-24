"""N247 (A3): claim a plan row before building it, so two sessions never build the same row (N225, N232, N224 and N226 were built twice).

python3 tools/claim.py N247 [--branch claude/<session>-n247] [--dry-run]

1. The row must be in docs/REAL_PLAN.md and still "Open".
2. No remote branch names the row (…-n247…) and no open pull request has it in its title.
3. Then (not with --dry-run): a branch from origin/main, the row's state set to "Claimed (`branch`)", one commit, pushed, and a draft PR
   "N247 (claimed)" opened with gh (without gh it prints the link to open it). Build the row on that branch; the PR becomes the row's PR.
Exits 1 if the row is taken, done or missing."""
import pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs/REAL_PLAN.md"


def git(*a, check=True):
    r = subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f"git {' '.join(a)}: {r.stderr.strip()}")
    return r.stdout


def repo_slug():
    url = git("remote", "get-url", "origin").strip()
    m = re.search(r"github\.com[:/]+([^/]+/[^/]+?)(?:\.git)?$", url) or re.search(r"/git/([^/]+/[^/]+?)(?:\.git)?$", url)
    return m.group(1) if m else None


def row_line(text, row):
    return next((l for l in text.splitlines() if l.startswith(f"| {row} |")), None)


def taken(row):
    """What already names the row: remote branches, then open PRs (gh search; skipped without gh)."""
    pat = re.compile(rf"(?<![0-9a-z]){row.lower()}(?![0-9])")
    heads = [l.split("refs/heads/", 1)[1] for l in git("ls-remote", "--heads", "origin").splitlines() if "refs/heads/" in l]
    found = [f"branch {h}" for h in heads if pat.search(h.lower())]
    slug = repo_slug()
    if shutil.which("gh") and slug:
        r = subprocess.run(["gh", "api", "-X", "GET", "search/issues", "-f", f"q=repo:{slug} is:pr is:open {row} in:title",
                            "--jq", ".items[] | \"PR #\\(.number) \\(.title)\""], cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            found += [l for l in r.stdout.splitlines() if pat.search(l.lower())]
        else:
            print(f"warning: couldn't search open PRs ({r.stderr.strip()[:120]}); check them by hand")
    else:
        print("warning: no gh, open PRs not searched; check them by hand")
    return found


def main(argv):
    rows = [a.upper() for a in argv if re.fullmatch(r"[Nn]\d+", a)]
    if len(rows) != 1:
        print(__doc__); return 2
    row = rows[0]
    git("fetch", "-q", "origin", "main")
    text = git("show", "origin/main:docs/REAL_PLAN.md")
    line = row_line(text, row)
    if not line:
        print(f"{row}: not a row in docs/REAL_PLAN.md on main"); return 1
    state = line.rstrip(" |").rsplit("|", 1)[-1].strip()
    if state != "Open":
        print(f"{row}: its state on main is \"{state}\", not Open"); return 1
    found = taken(row)
    if found:
        print(f"{row} is taken: " + "; ".join(found)); return 1
    branch = argv[argv.index("--branch") + 1] if "--branch" in argv else None
    if not branch:
        cur = git("rev-parse", "--abbrev-ref", "HEAD").strip()
        base = re.sub(r"-n\d+$", "", cur) if cur.startswith("claude/") else "claude/agent"
        branch = f"{base}-{row.lower()}"
    if "--dry-run" in argv:
        print(f"{row} is free: would claim it on {branch}"); return 0
    if git("status", "--porcelain", "--untracked-files=no").strip():
        print("commit or stash your changes first"); return 1
    git("checkout", "-q", "-B", branch, "origin/main")
    PLAN.write_text(text.replace(line, line[: line.rstrip().rstrip("|").rstrip().rfind("|")] + f"| Claimed (`{branch}`) |", 1))
    git("commit", "-qam", f"{row} (claimed)\n\nClaimed with tools/claim.py on {branch}.")
    git("push", "-q", "-u", "origin", branch)
    if shutil.which("gh"):
        r = subprocess.run(["gh", "pr", "create", "--draft", "--base", "main", "--head", branch, "--title", f"{row} (claimed)",
                            "--body", f"Claims {row} (docs/REAL_PLAN.md). The row is built on this branch; this PR becomes its PR."],
                           cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            print(f"{row} claimed: {r.stdout.strip()}"); return 0
        print(f"pushed {branch}, but gh couldn't open the PR ({r.stderr.strip()[:120]})")
    slug = repo_slug()
    print(f"{row} claimed on {branch}: open a draft PR titled \"{row} (claimed)\""
          + (f" at https://github.com/{slug}/pull/new/{branch}" if slug else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
