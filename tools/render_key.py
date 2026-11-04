"""Demma's Home V1.35 (docs/UPGRADE_REVIEW.md U10): the key the workflow keeps the drawn renders under (make_images.py: 96 of the build's
120 s). It's a hash of make_images.py, every module of ours it imports (followed through their imports), the client's inputs and the
house's numbers: anything the renders are drawn from. Not the version: the renders' file names carry it, and tools/build.py
--keep-renders names them afresh.

python3 tools/render_key.py      prints the key"""
import ast, hashlib, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIRS = [ROOT / "media-wall/src", ROOT / "house"]


def local(name):
    for d in DIRS:
        p = d / f"{name}.py"
        if p.exists():
            return p
    return None


def closure(start):
    seen, todo = set(), [start]
    while todo:
        p = todo.pop()
        if p in seen:
            continue
        seen.add(p)
        for node in ast.walk(ast.parse(p.read_text())):
            names = [a.name.split(".")[0] for a in node.names] if isinstance(node, ast.Import) else \
                    [node.module.split(".")[0]] if isinstance(node, ast.ImportFrom) and node.module else []
            if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "__import__" and node.args and isinstance(node.args[0], ast.Constant):
                names = [str(node.args[0].value)]
            for n in names:
                q = local(n)
                if q and q not in seen:
                    todo.append(q)
    return sorted(seen)


def key():
    h = hashlib.sha256()
    files = closure(ROOT / "media-wall/src/make_images.py")
    files += sorted(p for p in (ROOT / "media-wall/inputs").rglob("*") if p.is_file())
    files += sorted((ROOT / "house").glob("*.json"))
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        if rel == "media-wall/src/build_doc.py":          # the version and the document: hashed without its VERSION line
            text = "\n".join(l for l in f.read_text().splitlines() if not l.startswith("VERSION")).encode()
        else:
            text = f.read_bytes()
        h.update(rel.encode() + b"\0" + hashlib.sha256(text).digest())
    return h.hexdigest()[:20]


if __name__ == "__main__":
    print(key())
    if "-v" in sys.argv:
        print("\n".join(p.relative_to(ROOT).as_posix() for p in closure(ROOT / "media-wall/src/make_images.py")))
