"""N195: the house's light baked. The rooms' walls, floors and ceilings take the light that bounces round them (colour bleed, soft corners
and the shade under each piece) from a map worked out in Blender's Cycles, not each frame; their direct light and every piece stay live.

python3 house/bake.py [site] [--size 2048] [--samples 64] [--keep DIR]     bake into the site (and keep a copy)
python3 house/bake.py [site] --put DIR                                       a kept bake into a fresh build
python3 house/bake.py [site] --rewrite                                       the last bake written again, no baking

1. The built site opened headless: every house mesh as the page builds it (world positions, its material's colour) and every light.
2. Blender (bpy): the meshes, their colours, the lights in Blender's units; the shells unwrapped into one atlas; Cycles bakes the
   indirect light, by day (sun and sky) and by evening (the rooms' lights), each into the atlas.
3. Written into the site: tex/bake_day.<hash>.png, tex/bake_eve.<hash>.png and data/bake.<hash>.bin (each shell's second UVs), named in
   data/bake.json, which the page reads after building the house (20_go.js `bakeApply`), the bounced light only, on top of the page's live
   light; with ?bake for now (REAL_PLAN N195). A shell the bake didn't see takes the atlas' corner (the mean bounce).

Units: three's lights are physical (metres, candela, lux); Cycles' a point or spot light of P W gives P / 4π W/sr, so P = 4π cd; a sun of
E lux is E W/m²; a sky of irradiance E has radiance E / π. The atlas holds the light leaving a white wall (E / π), sRGB-encoded under a
scale, so the page sets lightMapIntensity = π × scale."""
import base64, hashlib, json, math, pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "media-wall/src"))
CACHE = ROOT / "_shots" / "bake"                                 # the last bake (not committed)
SHELL = ("paint", "ceiling", "stairpaint", "skirting", "tile", "carpet", "laminate", "vinyl", "lvt", "marble", "concrete", "board", "lino", "floor", "artex")

LIGHTS = """() => { const D = R3D._dbg, T = D.THREE;
  const lights = []; D.scene.updateMatrixWorld(true);
  D.scene.traverse(l => { if (!l.isLight || l.intensity <= 0) return; const p = new T.Vector3().setFromMatrixPosition(l.matrixWorld), t = l.target ? new T.Vector3().setFromMatrixPosition(l.target.matrixWorld) : null;
    lights.push({ type: l.type, col: [l.color.r, l.color.g, l.color.b], I: l.intensity, p: p.toArray(), t: t && t.toArray(), angle: l.angle, pen: l.penumbra, w: l.width, h: l.height,
      q: l.isRectAreaLight ? new T.Quaternion().setFromRotationMatrix(l.matrixWorld).toArray() : null, sky: l.isHemisphereLight ? [l.color.r, l.color.g, l.color.b, l.groundColor.r, l.groundColor.g, l.groundColor.b] : null,
      house: !!l.userData.houseLight, room: l.userData.room || null, sun: l === D.sun, vis: l.visible }); });
  return lights; }"""

EXPORT = """async ([rooms, shell]) => {
  const D = R3D._dbg, T = D.THREE, M = 0.01; let G = null; D.scene.traverse(o => { if (o.name === 'houseG') G = o; }); G.updateMatrixWorld(true);
  const b64 = a => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
  const avg = {}, avgOf = mt => { const im = mt.map && mt.map.image; if (!im || !im.width) return null; const k = mt.map.uuid; if (avg[k]) return avg[k];
    const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, bb = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; } return (avg[k] = [r / 16320, gg / 16320, bb / 16320]); };
  const meshes = [], v = new T.Vector3(); let i = -1;
  G.traverse(m => { if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || !m.material.userData) return; i++;
    const mt = m.material, hk = mt.userData.hk || ''; if (mt.transparent || mt.isMeshBasicMaterial || !m.geometry.attributes.position) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, p = g.attributes.position, n = p.count, P = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) { v.fromBufferAttribute(p, j).applyMatrix4(m.matrixWorld); P[j * 3] = v.x; P[j * 3 + 1] = v.y; P[j * 3 + 2] = v.z; }
    const c = mt.color.clone().convertLinearToSRGB(), a = avgOf(mt), col = a ? [c.r * a[0], c.g * a[1], c.b * a[2]] : [c.r, c.g, c.b];
    const e = mt.emissive ? mt.emissive.clone().multiplyScalar(mt.emissiveIntensity || 0) : null;
    const nu = new Uint8Array(n / 3), e1 = new T.Vector3(), e2 = new T.Vector3(), ceil = /ceiling|artex/.test(hk);
    for (let f = 0; f < n / 3; f++) { e1.set(P[f * 9 + 3] - P[f * 9], P[f * 9 + 4] - P[f * 9 + 1], P[f * 9 + 5] - P[f * 9 + 2]); e2.set(P[f * 9 + 6] - P[f * 9], P[f * 9 + 7] - P[f * 9 + 1], P[f * 9 + 8] - P[f * 9 + 2]);
      const ny = e1.cross(e2).normalize().y; nu[f] = ceil ? ny < 0.5 : ny > -0.5; }
    let sx = 0; for (let j = 0; j < P.length; j++) sx += P[j] * ((j % 3) + 1);
    meshes.push({ i, key: hk + ':' + n + ':' + Math.round(sx), hk, n, col, seen: b64(nu), rough: mt.roughness ?? 1, emit: e && (e.r + e.g + e.b) > 0 ? [e.r, e.g, e.b] : null, shell: shell.some(s => hk.startsWith(s)), pos: b64(P) });
    if (g !== m.geometry) g.dispose(); });
  return { meshes };
}"""


def export(site, tod):
    """The house's meshes and the scene's lights by `tod`, as the page builds them."""
    import http.server, socketserver, threading
    from functools import partial
    import pw, localcdn
    from playwright.sync_api import sync_playwright

    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Q, directory=str(site))); h.daemon_threads = True
    threading.Thread(target=h.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        b = pw.launch(p, pw.GL); pg = b.new_context(viewport={"width": 800, "height": 600}, service_workers="block").new_page(); localcdn.route(pg)
        pg.set_default_timeout(600000)
        pg.goto(f"http://127.0.0.1:{h.server_address[1]}/index.html?nobake"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=300000)
        pg.evaluate("() => R3D.photos()"); pg.wait_for_timeout(6000)
        views = pg.evaluate("() => Object.entries(R3D._dbg.VIEWS).filter(([k, v]) => v.box).map(([k]) => k)")
        lights, seen = [], set()
        for v in views:                                         # each room's own lamps (the page lights the room you're in)
            pg.evaluate(f"() => R3D.set({{ view: '{v}', tod: '{tod}', quality: 'hd' }})"); pg.wait_for_timeout(1500)
            for L in pg.evaluate(LIGHTS):
                k = (L["type"], *[round(c, 2) for c in L["p"]])
                if k not in seen:
                    seen.add(k); lights.append(L)
        out = pg.evaluate(EXPORT, [[], list(SHELL)]); out["lights"] = lights
        b.close()
    h.shutdown()
    return out


def scene(ex):
    """Blender's scene from an export: one object a mesh (the shells marked, each face's `seen`), its colour."""
    import bpy, numpy as np
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
    mats, objs = {}, []
    for m in ex["meshes"]:
        P = np.frombuffer(base64.b64decode(m["pos"]), dtype=np.float32).reshape(-1, 3)
        V = P[:, [0, 2, 1]] * [1, -1, 1]                          # three's y up to Blender's z up
        me = bpy.data.meshes.new(f"m{m['i']}"); nt = len(V) // 3
        me.vertices.add(len(V)); me.vertices.foreach_set("co", V.astype(np.float32).ravel())
        me.loops.add(len(V)); me.loops.foreach_set("vertex_index", np.arange(len(V), dtype=np.int32))
        me.polygons.add(nt); me.polygons.foreach_set("loop_start", np.arange(0, len(V), 3, dtype=np.int32)); me.polygons.foreach_set("loop_total", np.full(nt, 3, np.int32))
        me.update(); me.validate()
        key = (m["hk"], tuple(round(c, 3) for c in m["col"]), bool(m["emit"]))
        if key not in mats:
            mt = bpy.data.materials.new(m["hk"] or "x"); mt.use_nodes = True; bs = mt.node_tree.nodes["Principled BSDF"]
            lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in m["col"]]
            bs.inputs["Base Color"].default_value = (*lin, 1); bs.inputs["Roughness"].default_value = max(0.35, m["rough"])
            if m["emit"]:
                bs.inputs["Emission Color"].default_value = (*m["emit"], 1); bs.inputs["Emission Strength"].default_value = 1.0
            mats[key] = mt
        me.materials.append(mats[key])
        ob = bpy.data.objects.new(f"m{m['i']}", me); sc.collection.objects.link(ob); ob["shell"] = m["shell"]; ob["i"] = m["i"]; ob["key"] = m["key"]; objs.append(ob)
        if m["emit"] and not m["shell"]:                          # a bulb glows in the page; its lamp is the light here
            ob.visible_shadow = ob.visible_diffuse = ob.visible_glossy = ob.visible_transmission = False
        if len(V) and len(V) < 3000:                              # a small piece's box (a bulb, a shade), to find the lamps inside
            ob["box"] = [*V.min(0).tolist(), *V.max(0).tolist()]
        if m["shell"]:
            me.polygons.foreach_set("select", np.frombuffer(base64.b64decode(m["seen"]), dtype=np.uint8).astype(bool))
    return objs


def lights(ex, tod):
    """The lights by `tod` (the old ones taken out): the sun and the sky by day, every room's lamps always."""
    import bpy
    sc = bpy.context.scene
    for o in [o for o in sc.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o)
    w = sc.world or bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes["Background"]; bg.inputs["Strength"].default_value = 0
    for L in ex["lights"]:
        if not L["vis"] or (tod == "evening" and (L["sun"] or L["type"] == "HemisphereLight")):
            continue
        p = (L["p"][0], -L["p"][2], L["p"][1])
        if L["type"] == "HemisphereLight":                       # the sky: radiance E / π, its colour
            if L["house"] or L["I"] > 0.2:
                bg.inputs["Color"].default_value = (*L["sky"][:3], 1); bg.inputs["Strength"].default_value = L["I"] / math.pi
            continue
        kind = {"PointLight": "POINT", "SpotLight": "SPOT", "DirectionalLight": "SUN", "RectAreaLight": "AREA"}.get(L["type"])
        if not kind:
            continue
        ld = bpy.data.lights.new(L["type"], kind); ld.color = L["col"]
        if kind == "SUN":
            ld.energy = L["I"]; ld.angle = math.radians(0.6)
        elif kind == "AREA":
            ld.shape = "RECTANGLE"; ld.size, ld.size_y = L["w"] * 0.01 if L["w"] > 20 else L["w"], L["h"] * 0.01 if L["h"] > 20 else L["h"]
            ld.energy = L["I"] * ld.size * ld.size_y * math.pi
        else:
            ld.energy = L["I"] * 4 * math.pi; ld.shadow_soft_size = 0.03
            if kind == "SPOT":
                ld.spot_size = 2 * L["angle"]; ld.spot_blend = L["pen"] or 0
        ob = bpy.data.objects.new(L["type"], ld); ob.location = p; sc.collection.objects.link(ob)
        if kind in ("POINT", "SPOT"):                             # a lamp inside its own bulb or shade: that mesh out of the bake's rays
            for o in sc.objects:
                if o.type == "MESH" and not o.get("shell") and o.get("box"):
                    b = o["box"]
                    if all(b[k] - 0.02 <= p[k] <= b[k + 3] + 0.02 for k in range(3)):
                        o.visible_shadow = o.visible_diffuse = o.visible_glossy = o.visible_transmission = False
        if L["t"] and kind in ("SUN", "SPOT"):
            import mathutils
            d = mathutils.Vector((L["t"][0], -L["t"][2], L["t"][1])) - mathutils.Vector(p); ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        elif L["q"]:
            import mathutils
            x, y, z, ww = L["q"]; q = mathutils.Quaternion((ww, x, -z, y)); ob.rotation_euler = (q @ mathutils.Quaternion((1, 0, 0), math.pi / 2)).to_euler()


def unwrap(objs, size):
    """The shells into one atlas: islands by angle, one texel density, packed with a margin."""
    import bpy
    sh = [o for o in objs if o["shell"]]
    bpy.ops.object.select_all(action="DESELECT")
    for o in sh:
        o.select_set(True); o.data.uv_layers.new(name="bake")
    bpy.context.view_layer.objects.active = sh[0]
    import numpy as np
    for o in sh:                                                  # each corner's own index, so the UVs go back to the page's triangles after merging
        a = o.data.attributes.new("oci", "INT", "CORNER"); a.data.foreach_set("value", np.arange(len(o.data.loops), dtype=np.int32)); o["nl"] = len(o.data.loops)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.remove_doubles(threshold=0.0001)   # corners shared, so a wall's faces make one island
    bpy.ops.object.mode_set(mode="OBJECT")                        # (a sliver of no area goes; its corners take the spare texel)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(40), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale(); bpy.ops.uv.pack_islands(rotate=True, margin=3 / size)
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in sh:
        me = o.data; uv = np.zeros(len(me.loops) * 2, np.float32); me.uv_layers["bake"].data.foreach_get("uv", uv)
        sel = np.zeros(len(me.polygons), bool); me.polygons.foreach_get("select", sel)
        ls = np.zeros(len(me.polygons), np.int32); me.polygons.foreach_get("loop_start", ls); lt = np.zeros(len(me.polygons), np.int32); me.polygons.foreach_get("loop_total", lt)
        uv = uv.reshape(-1, 2); uv *= 0.99; uv[np.concatenate([np.arange(s, s + n) for s, n, k in zip(ls, lt, sel) if not k] or [np.zeros(0, int)])] = 0.997
        me.uv_layers["bake"].data.foreach_set("uv", uv.ravel())
    return sh


def bake(ex, tod, size, samples, sh):
    """The bounced light leaving a white shell (the page draws the direct light live), by `tod`, as a float atlas (size × size × 3)."""
    import bpy, numpy as np
    lights(ex, tod)
    sc = bpy.context.scene; sc.cycles.samples = samples; sc.cycles.use_denoising = False; sc.render.bake.margin = 4; sc.render.bake.use_clear = True
    img = bpy.data.images.new("atlas_" + tod, size, size, float_buffer=True)
    for mt in {s.material for o in sh for s in o.material_slots}:
        n = mt.node_tree.nodes.get("bake") or mt.node_tree.nodes.new("ShaderNodeTexImage"); n.name = "bake"; n.image = img; mt.node_tree.nodes.active = n
    bpy.ops.object.select_all(action="DESELECT")
    for o in sh:
        o.select_set(True); o.data.uv_layers["bake"].active = True
    bpy.context.view_layer.objects.active = sh[0]
    t0 = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"INDIRECT"}, use_selected_to_active=False)   # the bounce only: the page keeps its live direct light
    print(f"bake {tod}: {len(sh)} shells, {size}², {samples} samples, {time.time() - t0:.0f} s", flush=True)
    return np.array(img.pixels[:], dtype=np.float32).reshape(size, size, 4)[::-1, :, :3]


def uvs(sh):
    """Each shell's second UVs per triangle corner, in the export's order (a corner a vertex, as the page draws it non-indexed), v down
    as the page's textures (flipY false)."""
    import numpy as np
    out = []
    for o in sorted(sh, key=lambda o: int(o["i"])):
        me = o.data; uv = np.zeros(len(me.loops) * 2, np.float32); me.uv_layers["bake"].data.foreach_get("uv", uv)
        oci = np.zeros(len(me.loops), np.int32); me.attributes["oci"].data.foreach_get("value", oci)
        full = np.full((o["nl"], 2), 0.997, np.float32); full[oci] = uv.reshape(-1, 2)
        full[:, 1] = 1 - full[:, 1]; out.append((o["key"], int(o["nl"]), full.ravel()))
    return out


def smooth(m, sigma=2.0):
    """The samples' grain out: a blur that stays inside each island (the light and the island's mask blurred alike, then divided)."""
    import numpy as np
    r = int(3 * sigma); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    blur = lambda a: np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 0, np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 1, a))
    mask = (m.max(2) > 0).astype(np.float32); w = blur(mask)
    out = np.stack([blur(m[..., c] * mask) for c in range(3)], 2) / np.maximum(w, 1e-6)[..., None]
    return np.where(mask[..., None] > 0, out, m).astype(np.float32)


def write(site, maps, uv):
    """The atlases (sRGB under one scale, the unseen faces' corner at the mean) and the UVs, into the site; data/bake.json names them."""
    import numpy as np
    from PIL import Image
    lit = np.concatenate([m[m.max(2) > 0] for m in maps.values()])
    scale = float(np.percentile(lit, 99.9)) or 1.0
    files = {}
    for tod, m in maps.items():                                   # a fourth root: the rooms' dim corners keep their steps beside a sunlit floor
        m = smooth(m); n = m.shape[0]; c = int(n * 0.991); m[c:, c:] = m[m.max(2) > 0].mean(0)
        px = (np.clip(m / scale, 0, 1) ** 0.25 * 255 + 0.5).astype(np.uint8)
        b = Image.fromarray(px); h = hashlib.sha1(px.tobytes()).hexdigest()[:10]; name = f"bake_{tod[:3]}.{h}.jpg"
        b.save(site / "tex" / name, quality=90, optimize=True); files[tod] = name
    buf = np.concatenate([np.round(np.clip(u, 0, 1) * 65535).astype(np.uint16) for _, _, u in uv]).tobytes()
    un = f"bake.{hashlib.sha1(buf).hexdigest()[:10]}.bin"; (site / "data" / un).write_bytes(buf)
    j = dict(day=files["day"], eve=files["evening"], uv=un, scale=round(scale, 4), meshes=[[i, n] for i, n, _ in uv])
    (site / "data/bake.json").write_text(json.dumps(j, separators=(",", ":")))
    return j


def retry(f, *a):
    """Headless software graphics now and then never finish starting: once more."""
    try:
        return f(*a)
    except Exception as e:
        print("bake: again after", type(e).__name__, flush=True); return f(*a)


def files(site):
    """The baked light's files in a site: data/bake.json and what it names."""
    j = json.loads((site / "data/bake.json").read_text()) if (site / "data/bake.json").exists() else {}
    return [site / "data/bake.json"] + ([site / "tex" / j["day"], site / "tex" / j["eve"], site / "data" / j["uv"]] if j.get("uv") else [])


def main(argv):
    import numpy as np, shutil
    site = pathlib.Path(next((a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or not argv[i - 1].startswith("--"))), ROOT / "_site")).resolve()
    if "--put" in argv:                                            # the workflow's kept bake into a fresh build (house/bake.py site --put DIR)
        d = pathlib.Path(argv[argv.index("--put") + 1])
        for f in d.rglob("*"):
            if f.is_file():
                (site / f.relative_to(d)).parent.mkdir(parents=True, exist_ok=True); shutil.copy(f, site / f.relative_to(d))
        print("bake: put from", d); return
    if "--rewrite" in argv:                                        # the last bake written again (a new curve, a new smoothing) without baking
        import pickle
        z = np.load(CACHE / "maps.npz"); j = write(site, {k: z[k] for k in z.files}, pickle.loads((CACHE / "uv.pkl").read_bytes()))
        print("bake: written again, scale", j["scale"]); return
    opt = lambda k, d: int(argv[argv.index(k) + 1]) if k in argv else d
    size, samples, t0 = opt("--size", 2048), opt("--samples", 128), time.time()
    ex = retry(export, site, "day"); ev = retry(export, site, "evening")
    print(f"bake: {len(ex['meshes'])} meshes, {sum(m['n'] for m in ex['meshes']) // 3} triangles, {len(ex['lights'])} lights by day, {len(ev['lights'])} by evening ({time.time() - t0:.0f} s)", flush=True)
    objs = scene(ex); sh = unwrap(objs, size)
    maps = {"day": bake(ex, "day", size, samples, sh), "evening": bake(ev, "evening", size, samples, sh)}
    uv = uvs(sh); CACHE.mkdir(exist_ok=True); np.savez_compressed(CACHE / "maps.npz", **maps)   # the light as baked, to write again without baking
    import pickle; (CACHE / "uv.pkl").write_bytes(pickle.dumps(uv))
    j = write(site, maps, uv)
    print(f"bake: {len(sh)} shells into {size}², scale {j['scale']}, {time.time() - t0:.0f} s in all")
    if "--keep" in argv:                                           # and kept for the next build (the workflow's cache)
        d = pathlib.Path(argv[argv.index("--keep") + 1])
        for f in files(site):
            (d / f.relative_to(site)).parent.mkdir(parents=True, exist_ok=True); shutil.copy(f, d / f.relative_to(site))


if __name__ == "__main__":
    main(sys.argv[1:])
