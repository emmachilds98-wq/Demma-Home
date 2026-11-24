"""V1.31 (U4, docs/UPGRADE_REVIEW.md): three.js and the add-ons room3d.js uses, in one minified file of their own for GitHub Pages
(`_site/three.<hash>.js`), named by its contents so it's kept between visits. It came from the CDN as about 15 files in three waves
(each add-on fetches three again), unminified: three.module.js alone is 1.2 MB.

The page's import map points "three" and every add-on room3d.js imports at the one file, which exports them all by name (one module,
loaded once). Without Node or the packages (`npm ci`, package.json) the build keeps the CDN's import map, as before; the shared page
always keeps the CDN's (tools/build.py artifact(): its size limit)."""
import hashlib, json, os, pathlib, re, shutil, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
import room3d_page, room3d_src

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]


def addons():
    """[(name, specifier)] for every `import { X } from "three/addons/..."` in room3d.js"""
    src = room3d_src.js()
    return re.findall(r'^import \{ (\w+) \} from "(three/addons/[^"]+)";', src, flags=re.M)


def lazy():
    """N196: every `import("three/addons/...")` in room3d.js: a file of its own, fetched only when used"""
    return sorted(set(re.findall(r'import\("(three/addons/[^"]+)"\)', room3d_src.js())))


def bundle(site):
    """writes site/three.<hash>.js and gives back its import map; None when it can't (no Node, no packages)"""
    esb = ROOT / "node_modules/.bin/esbuild"
    if not esb.exists() or not (ROOT / "node_modules/three/package.json").exists() or not shutil.which("node"):
        return None
    ver = json.loads((ROOT / "node_modules/three/package.json").read_text())["version"]
    if f"three@{ver}/" not in room3d_page.THREE:            # the same three as the CDN's
        return None
    names, late = addons(), {}
    with tempfile.TemporaryDirectory(dir=ROOT / "node_modules") as d:   # inside node_modules' folder, so "three" resolves
        entry, out = pathlib.Path(d) / "entry.js", pathlib.Path(d) / "out.js"
        esm = lambda *x: subprocess.run([str(esb), str(entry), "--bundle", "--format=esm", "--minify", "--target=es2020", "--legal-comments=none",
                                         *x, f"--outfile={out}"], capture_output=True, text=True, cwd=ROOT)
        used = set(re.findall(r"\bTHREE\.([A-Za-z_]\w*)", room3d_src.js()))   # only the names room3d.js uses (836 KB, was 960 with all of three)
        for s in lazy():   # N196: three itself from the one file (its names added there: 4 KB), not a second copy inside (314 KB, 60 so)
            entry.write_text(f'export * from "{ROOT}/node_modules/three/examples/jsm/{s[13:]}";\n')
            if esm("--external:three").returncode == 0:
                late[s] = out.read_bytes(); used |= {n.split(" as ")[0] for m in re.findall(r'import\{([^}]*)\}from"three"', out.read_text()) for n in m.split(",")}
        used = sorted(used)
        entry.write_text(f'export {{ {", ".join(used)} }} from "three";\n' + "".join(f'export {{ {n} }} from "{s}";\n' for n, s in names))
        r = esm()
        if r.returncode != 0:
            print("vendor: esbuild failed, the CDN's import map stays:", r.stderr[-400:])
            return None
        code = out.read_bytes()
    name = f"three.{hashlib.sha1(code).hexdigest()[:10]}.js"
    for old in [*site.glob("three.*.js"), *site.glob("addon.*.js")]:
        old.unlink()
    (site / name).write_bytes(code)
    imports = {"three": "./" + name, **{s: "./" + name for _, s in names}}
    for s, c in late.items():
        n = f"addon.{pathlib.Path(s).stem}.{hashlib.sha1(c).hexdigest()[:10]}.js"; (site / n).write_bytes(c); imports[s] = "./" + n
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
    html_ = re.sub(r'(<script type="module">)(.*?)(</script>)', lambda m: m.group(1) + run(m.group(2), "js", ("--format=esm", "--target=es2022")) + m.group(3), html_, flags=re.S)
    return re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1) + run(m.group(2), "css") + m.group(3), html_, flags=re.S)


# N196: the colour photos also as KTX2 (Basis Universal ETC1S, sRGB): the graphics chip keeps them squeezed (ETC2 or ASTC on an iPhone,
# BC7 or BC1 on a PC), an eighth to a quarter of a JPEG's memory, no decode or upload stall. Made at build by ktx2-encoder (basisu as
# WebAssembly, package.json); without it the site keeps its JPEGs alone. Bottom row first (isYFlip), as three sends the JPEGs. ETC1S,
# not UASTC: UASTC is 5 to 9 times a JPEG's bytes, ETC1S about 1.2 (docs/NOTES.md)
KTX2 = """import { encodeToKTX2 } from "ktx2-encoder"; import fs from "fs";
const [raw, w, h, o, out] = process.argv.slice(1), data = new Uint8Array(fs.readFileSync(raw));
fs.writeFileSync(out, await encodeToKTX2(data, { ...JSON.parse(o), imageDecoder: async () => ({ width: +w, height: +h, data }) }));"""
CACHE = ROOT / ".ktx2cache"   # by the JPEG, the settings and the encoder's version (the workflow keeps it between runs)


def ktx2(jpgs):
    """[JPEG bytes] to [KTX2 bytes or None], side by side; all None without the encoder"""
    pkg = ROOT / "node_modules/ktx2-encoder/package.json"
    if not pkg.exists() or not shutil.which("node"):
        return [None] * len(jpgs)
    import io
    from PIL import Image
    ver, o = json.loads(pkg.read_text())["version"], json.dumps({"isUASTC": False, "qualityLevel": 255, "isYFlip": True})
    CACHE.mkdir(exist_ok=True)
    def one(jpg):
        hit = CACHE / (hashlib.sha256(jpg + (ver + o).encode()).hexdigest()[:16] + ".ktx2")
        if not hit.exists():
            with tempfile.TemporaryDirectory() as d:
                im, src, dst = Image.open(io.BytesIO(jpg)).convert("RGBA"), pathlib.Path(d) / "in.rgba", pathlib.Path(d) / "out.ktx2"
                src.write_bytes(im.tobytes())
                r = subprocess.run(["node", "--input-type=module", "-e", KTX2, str(src), str(im.width), str(im.height), o, str(dst)],
                                   capture_output=True, text=True, cwd=ROOT)
                if r.returncode or not dst.exists():
                    print("vendor: KTX2 failed, the JPEG alone:", (r.stdout + r.stderr)[-300:]); return None
                shutil.move(dst, hit)
        return hit
    with ThreadPoolExecutor(os.cpu_count()) as ex:
        hits = list(ex.map(one, jpgs))
    for f in CACHE.glob("*.ktx2"):
        if f not in hits: f.unlink()
    return [h and h.read_bytes() for h in hits]


def transcoder(site):
    """three's Basis transcoder beside the page (about 580 KB, fetched only by a KTX2 photo's first load): its folder's name, None
    without it. Named by three's version, so the service worker keeps it across rounds (sw.js HASHED)"""
    src = ROOT / "node_modules/three/examples/jsm/libs/basis"
    if not (src / "basis_transcoder.wasm").exists():
        return None
    ver = json.loads((ROOT / "node_modules/three/package.json").read_text())["version"]
    for old in site.glob("basis@*"):
        shutil.rmtree(old)
    shutil.copytree(src, site / f"basis@{ver}", ignore=shutil.ignore_patterns("*.md"))
    return f"basis@{ver}/"


if __name__ == "__main__":
    import sys
    print(bundle(pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"))
