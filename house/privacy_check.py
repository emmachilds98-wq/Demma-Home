"""The client's address must never be in the repo, the page, the PDFs, commits or pull requests (client, 25 Oct 2026: "No one should
ever find out my address through you"). This check looks for it without holding it: it compares hashes of every word and word pair in
each tracked file (text, and the text of every PDF) with the hashes of the address's words. Exits non-zero if any match.

Run before every commit: python3 house/privacy_check.py
V1: the built site isn't in git, so the workflow also checks it: python3 house/privacy_check.py _site (every file under it, PDFs too)."""
import hashlib, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BAD = {"2f2ed0d38884cbf9", "41082cacfaca398d", "e2c96b063d36285c", "280db0f3e23a58af", "d278718169fba584", "3ccf243960d58d97",
       "4464b4a6c5c66297", "2d34117cc6d26ff3"}           # the address's words and pairs, and its area, hashed (sha256, 16 hex)
h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]


def hits(text):
    w = re.findall(r"[a-z0-9]+", text.lower())
    grams = set(w) | {a + " " + b for a, b in zip(w, w[1:])}
    return sorted(g for g in grams if h(g) in BAD)


def text_of(p):
    if p.suffix.lower() == ".pdf":
        try:
            import pypdf
            return " ".join((pg.extract_text() or "") for pg in pypdf.PdfReader(str(p)).pages)
        except Exception as e:                       # noqa: BLE001
            return f"(unreadable pdf: {e})"
    if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".glb"):
        return ""
    try:
        return p.read_text()
    except (UnicodeDecodeError, OSError):
        return ""


def main():
    dirs = [pathlib.Path(a).resolve() for a in sys.argv[1:]]
    if dirs:
        files = [str(f.relative_to(ROOT)) if f.is_relative_to(ROOT) else str(f) for d in dirs for f in sorted(d.rglob("*")) if f.is_file()]
    else:
        files = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, capture_output=True, text=True).stdout.split()
    bad = [(f, hits(text_of(ROOT / f))) for f in files if (ROOT / f).is_file()]
    bad = [(f, n) for f, n in bad if n]
    for f, n in bad:
        print(f"FAIL {f}: {len(n)} match(es)")      # never print the words themselves
    print(f"privacy: {len(files)} files, {len(bad)} with the address")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
