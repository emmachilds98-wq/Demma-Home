"""N252 (A13): the remote branches, sorted: merged into main (safe to delete, with the owner's OK), stale (unmerged, no commit for
--days, default 7) and live. Lists only: it deletes nothing (deleting waits on the owner's OK; superseded branches kept for reference
are listed in docs/HANDOVER.md's "Now").

python3 tools/branches.py [--days 7] [--names]   (--names: only the merged ones' names, one a line)"""
import pathlib, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]


def git(*a):
    return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def main(argv):
    days = int(argv[argv.index("--days") + 1]) if "--days" in argv else 7
    git("fetch", "-q", "--prune", "origin", "+refs/heads/*:refs/remotes/origin/*")
    merged = {l.strip().removeprefix("origin/") for l in git("branch", "-r", "--merged", "origin/main").splitlines()}
    rows = []
    for l in git("for-each-ref", "--format=%(refname:short)\t%(committerdate:unix)\t%(committerdate:short)", "refs/remotes/origin").splitlines():
        ref, ts, day = l.split("\t")
        name = ref.removeprefix("origin/")
        if name in ("HEAD", "main", "origin"):
            continue
        age = (time.time() - int(ts)) / 86400
        rows.append(("merged" if name in merged else "stale" if age > days else "live", day, name))
    if "--names" in argv:
        print("\n".join(n for k, _, n in sorted(rows) if k == "merged")); return 0
    for kind in ("merged", "stale", "live"):
        group = sorted((r for r in rows if r[0] == kind), key=lambda r: r[1])
        print(f"{kind}: {len(group)}")
        for _, day, name in group:
            print(f"  {day}  {name}")
    print(f"{len(rows)} branches; deleting any waits on the owner's OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
