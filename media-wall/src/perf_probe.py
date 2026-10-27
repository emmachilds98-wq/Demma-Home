"""v33: the 3D room profiled (draw calls, lights, shadow maps, programs, frame time, recompiles). python3 perf_probe.py <url> 1280 800"""
import sys, json, time
from playwright.sync_api import sync_playwright
url = sys.argv[1]; w, h = int(sys.argv[2]), int(sys.argv[3])
INFO = """() => { const d = R3D._dbg, g = d.gl, i = g.info; let L = 0, Lv = 0, sh = 0, pt = 0, sp = 0, meshes = 0, tris = 0;
  d.scene.traverse(o => { if (o.isLight) { L++; let v = o.visible, p = o.parent; while (v && p) { v = p.visible; p = p.parent; } if (v) { Lv++; if (o.castShadow) sh++; if (o.isPointLight) pt++; if (o.isSpotLight) sp++; } } if (o.isMesh) meshes++; });
  return { calls: i.render.calls, tris: i.render.triangles, geos: i.memory.geometries, texs: i.memory.textures, programs: i.programs.length, lights: L, visLights: Lv, point: pt, spot: sp, shadows: sh, meshes, dpr: g.getPixelRatio(), q: d.S.quality, shadowMap: g.shadowMap.enabled }; }"""
with sync_playwright() as p:
    b = __import__("pw").launch(p, ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 600 else 1, is_mobile=w < 600, has_touch=w < 600); errs = []
    __import__("localcdn").route(pg)   # v34: three.js from THREE_LOCAL, if set
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300])); pg.on("console", lambda m: errs.append(m.type + ": " + m.text[:300]) if m.type in ("error", "warning") else None)
    t0 = time.time(); pg.goto(url); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=180000); print("ready s", round(time.time() - t0, 1), "buildMs", pg.evaluate("R3D.buildMs"))
    pg.wait_for_timeout(1500)
    for q in ("fast", "hd"):
        t = time.time(); pg.evaluate(f"() => R3D.set({{quality: '{q}', picked: true}})"); pg.wait_for_timeout(200); sw = round((time.time() - t) * 1000)
        pg.evaluate("() => R3D._dbg.gl.render(R3D._dbg.scene, R3D._dbg.camera)")
        print(q, "switch ms", sw, json.dumps(pg.evaluate(INFO)), "frame ms", round(pg.evaluate("() => R3D.bench(10)"), 1))
    for sc in ("film", "cosy", "bright"):
        before = pg.evaluate("() => R3D._dbg.gl.info.programs.length")
        t = time.time(); pg.evaluate(f"() => {{ R3D.set({{scene: '{sc}'}}); R3D._dbg.gl.render(R3D._dbg.scene, R3D._dbg.camera); }}"); ms = round((time.time() - t) * 1000)
        print("scene", sc, "ms", ms, "programs", before, "->", pg.evaluate("() => R3D._dbg.gl.info.programs.length"))
    for o in ("{dining:'six', view:'dining'}", "{dining:'folded'}", "{cabw:'80'}", "{cabw:'90'}", "{tod:'day'}", "{tod:'evening'}"):
        t = time.time(); pg.evaluate(f"() => {{ R3D.set({o}); R3D._dbg.gl.render(R3D._dbg.scene, R3D._dbg.camera); }}"); print("set", o, round((time.time() - t) * 1000), "ms")
    print("heap MB", pg.evaluate("() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null"))
    print("errors:", errs[:12])
    b.close()
