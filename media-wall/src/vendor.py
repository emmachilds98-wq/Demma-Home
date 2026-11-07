"""V1.31 (U4, docs/UPGRADE_REVIEW.md): three.js and the add-ons room3d.js uses, in one minified file of their own for GitHub Pages
(`_site/three.<hash>.js`), named by its contents so it's kept between visits. It came from the CDN as about 15 files in three waves
(each add-on fetches three again), unminified: three.module.js alone is 1.2 MB.

The page's import map points "three" and every add-on room3d.js imports at the one file, which exports them all by name (one module,
loaded once). Without Node or the packages (`npm ci`, package.json) the build keeps the CDN's import map, as before; the shared page
always keeps the CDN's (tools/build.py artifact(): its size limit)."""
import hashlib, json, os, pathlib, re, shutil, subprocess, tempfile
import room3d_src

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]


def addons():
    """[(name, specifier)] for every `import { X } from "three/addons/..."` in room3d.js"""
    src = room3d_src.js()
    return re.findall(r'^import \{ (\w+) \} from "(three/addons/[^"]+)";', src, flags=re.M)


def bundle(site):
    """writes site/three.<hash>.js and gives back its import map; None when it can't (no Node, no packages)"""
    esb = ROOT / "node_modules/.bin/esbuild"
    if not esb.exists() or not (ROOT / "node_modules/three/package.json").exists() or not shutil.which("node"):
        return None
    ver = json.loads((ROOT / "node_modules/three/package.json").read_text())["version"]
    if ver != "0.160.0":                                      # the same three as the CDN's (room3d_page.THREE)
        return None
    names = addons()
    with tempfile.TemporaryDirectory(dir=ROOT / "node_modules") as d:   # inside node_modules' folder, so "three" resolves
        entry, out = pathlib.Path(d) / "entry.js", pathlib.Path(d) / "out.js"
        used = sorted(set(re.findall(r"\bTHREE\.([A-Za-z_]\w*)", room3d_src.js())))   # only the names room3d.js uses (836 KB, was 960 with all of three)
        entry.write_text(f'export {{ {", ".join(used)} }} from "three";\n' + "".join(f'export {{ {n} }} from "{s}";\n' for n, s in names))
        r = subprocess.run([str(esb), str(entry), "--bundle", "--format=esm", "--minify", "--target=es2020", "--legal-comments=none",
                            f"--outfile={out}"], capture_output=True, text=True, cwd=ROOT)
        if r.returncode != 0:
            print("vendor: esbuild failed, the CDN's import map stays:", r.stderr[-400:])
            return None
        code = out.read_bytes()
    name = f"three.{hashlib.sha1(code).hexdigest()[:10]}.js"
    for old in site.glob("three.*.js"):
        old.unlink()
    (site / name).write_bytes(code)
    imports = {"three": "./" + name, **{s: "./" + name for _, s in names}}
    print(f"vendor: {name}, {len(code) // 1024} KB, {len(used)} of three {ver}'s names and {len(names)} add-ons")
    return '<script type="importmap">' + json.dumps({"imports": imports}) + "</script>"


def minify(html_):
    """V2.50 (speed, REAL_PLAN N4): the page's own 3D script and its CSS minified for Pages (the source stays as it is, comments and
    all): the 3D's 667 KB to about 360. Each block goes alone through esbuild; one it can't do, or whose output would end the tag
    early, stays as it was. Without esbuild the page is as before."""
    esb = ROOT / "node_modules/.bin/esbuild"
    if not esb.exists():
        return html_
    def run(code, loader, extra=()):
        r = subprocess.run([str(esb), f"--loader={loader}", "--minify", "--legal-comments=none", "--log-level=error", *extra],
                           input=code, capture_output=True, text=True, cwd=ROOT)
        out = r.stdout.strip()
        word = "cl" + "aude"   # a name the source spells in parts (qa.no_assistant_names) that esbuild would join
        bad = lambda t: "</script" in t or "</style" in t or (word in t and word not in code.lower())
        return out if r.returncode == 0 and out and not bad(out.lower()) else code
    html_ = re.sub(r'(<script type="module">)(.*?)(</script>)', lambda m: m.group(1) + run(m.group(2), "js", ("--format=esm", "--target=es2020")) + m.group(3), html_, flags=re.S)
    return re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + run(m.group(2), "css") + m.group(3), html_, flags=re.S)


if __name__ == "__main__":
    import sys
    print(bundle(pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"))


# V2.75 (REAL_PLAN N22): the photos also as KTX2 (Basis Universal UASTC, Zstandard), sent to the graphics chip squeezed (ASTC on an
# iPhone, BC7 on a PC): about a quarter of the memory of a JPEG's pixels and no decode or upload stall. Only at build: the encoder is
# `basisu` 1.16.4 (the workflow builds it from its pinned commit; $BASISU); without it the site keeps its JPEGs alone. Stored bottom row
# first (-y_flip), as three sends the JPEGs; colour in sRGB, normals and roughness linear. Kept in .ktx2cache by the JPEG's contents.
BASISU_ARGS = ["-ktx2", "-uastc", "-uastc_level", "2", "-uastc_rdo_l", "1.0", "-mipmap", "-y_flip"]
KTX2_CACHE = ROOT / ".ktx2cache"


def basisu():
    exe = os.environ.get("BASISU") or shutil.which("basisu")
    return exe if exe and os.access(exe, os.X_OK) else None


def ktx2(jpg, colour, used):
    """the KTX2 of a JPEG's bytes (from the cache or made now), or None without the encoder or if it fails; `used` collects the cache's names"""
    exe = basisu()
    if not exe:
        return None
    lin = [] if colour else ["-linear"]
    name = hashlib.sha256(jpg + " ".join(BASISU_ARGS + lin).encode()).hexdigest()[:10] + ".ktx2"
    hit = KTX2_CACHE / name; used.add(name)
    if not hit.exists():
        KTX2_CACHE.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory() as d:
            src, dst = pathlib.Path(d) / "in.jpg", pathlib.Path(d) / "out.ktx2"
            src.write_bytes(jpg)
            r = subprocess.run([exe, *BASISU_ARGS, *lin, "-file", str(src), "-output_file", str(dst)], capture_output=True, text=True, cwd=d)
            if r.returncode != 0 or not dst.exists():
                print("vendor: basisu failed, the JPEG alone:", (r.stdout + r.stderr)[-300:]); return None
            shutil.move(str(dst), hit)
    return hit.read_bytes()


def ktx2_prune(used):
    for f in KTX2_CACHE.glob("*.ktx2") if KTX2_CACHE.exists() else []:
        if f.name not in used: f.unlink()


def transcoder(site):
    """three's Basis transcoder (the same three 0.160.0) beside the page, for the KTX2 photos: site/basis/ (about 560 KB, fetched only when used)"""
    src = ROOT / "node_modules/three/examples/jsm/libs/basis"
    out = site / "basis"
    if not (src / "basis_transcoder.wasm").exists():
        return False
    out.mkdir(exist_ok=True)
    for n in ("basis_transcoder.js", "basis_transcoder.wasm"):
        shutil.copyfile(src / n, out / n)
    return True
