"""v33: Edit room and the Tools panels driven in a browser, every error recorded. python3 edit_probe.py <url> 1280 800"""
import sys, json, time
from playwright.sync_api import sync_playwright
url = sys.argv[1]; w, h = int(sys.argv[2]), int(sys.argv[3])
with sync_playwright() as p:
    b = __import__("pw").launch(p, ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": w, "height": h}, is_mobile=w < 600, has_touch=w < 600); errs = []
    __import__("localcdn").route(pg)   # v34: three.js from THREE_LOCAL, if set
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)[:400])); pg.on("console", lambda m: errs.append(m.type + ": " + m.text[:300]) if m.type in ("error", "warning") else None)
    pg.goto(url, wait_until="domcontentloaded", timeout=120000); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=180000)
    pg.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"); pg.wait_for_timeout(800)   # v35: after the first frame (its shaders)
    P = "() => R3D._dbg.gl.info.programs.length"
    def step(name, fn):
        n = len(errs); t = time.time()
        try: fn()
        except Exception as e: errs.append(f"STEP {name} failed: {str(e)[:900]}")
        pg.wait_for_timeout(500); print(f"{name}: {round((time.time()-t)*1000)} ms, programs {pg.evaluate(P)}, new errors {errs[n:]}")
    cx, cy = w // 2, h // 2
    step("edit on", lambda: pg.click("#r3d-editbtn"))
    step("add list", lambda: pg.click("#r3d-add"))
    names = pg.evaluate("() => [...document.querySelectorAll('#r3d-addlist [data-add]')].map(b => b.dataset.add)")
    print("catalogue:", names)
    for k in names[:6]:
        step(f"add {k}", lambda k=k: (pg.click("#r3d-add") if pg.evaluate("() => document.getElementById('r3d-addlist').hidden") else None, pg.click(f"#r3d-addlist [data-add='{k}']")))
        step(f"turn {k}", lambda: pg.click("#r3d-sel [data-sel=turn]") if pg.is_visible("#r3d-sel [data-sel=turn]") else None)
        step(f"colour {k}", lambda: pg.evaluate("() => { const i = document.getElementById('r3d-selcol'); if (i && i.offsetParent) { i.value = '#aa3355'; i.dispatchEvent(new Event('input', {bubbles: true})); i.dispatchEvent(new Event('change', {bubbles: true})); } }"))
        step(f"drag {k}", lambda: (pg.mouse.move(cx, cy), pg.mouse.down(), pg.mouse.move(cx + 60, cy + 30, steps=8), pg.mouse.up()))
    step("undo x3", lambda: [pg.click("#r3d-undo") for _ in range(3) if not pg.is_disabled("#r3d-undo")])
    step("remove", lambda: pg.click("#r3d-sel [data-sel=remove]") if pg.is_visible("#r3d-sel [data-sel=remove]") else None)
    step("tap a wall to paint", lambda: pg.mouse.click(cx - 200, cy - 150))
    step("reset layout", lambda: pg.click("#r3d-layreset"))
    step("edit off", lambda: pg.click("#r3d-editdone"))
    # tools panel changes
    for sel in ("[data-drawer=look]", "[data-decor='oak:walnut']", "[data-decor='floor:boards']", "[data-drawer=views]", "[data-scene=film]", "[data-drawer=extras]"):
        step("click " + sel, lambda sel=sel: pg.locator(sel).first.click(timeout=10000))
    step("sugg all", lambda: pg.evaluate("() => { const b = document.querySelector('[data-suggall=on], [data-sproxyall=on]'); if (b) b.click(); }"))
    print("TOTAL errors:", len(errs)); print("\n".join(errs[:30]))
    b.close()
