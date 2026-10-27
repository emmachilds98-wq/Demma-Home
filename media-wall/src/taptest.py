"""v30: taps things in the 3D room (the cabinet, its doors, its two widths (v33), the media wall, the lamp, the curtains) at 1280 and 390
and prints what each card offers and what each button did (v34: the blind, the vinyl stand, the trolley, a suggestion's versions, the
storage ottoman's lid, the drinks case's flap; v36: the bar by the sofa, the lift-top coffee table).  python3 taptest.py [screenshot folder]"""
import sys, json, threading, functools, http.server, pathlib
from playwright.sync_api import sync_playwright
import localcdn
ROOT = pathlib.Path(__import__("os").environ.get("DEMMA_SITE") or pathlib.Path(__file__).resolve().parents[2] / "_site"); OUT = sys.argv[1] if len(sys.argv) > 1 else "."
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{srv.server_address[1]}/"
ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"]
PROJ = """([x, y, z]) => { const { camera, THREE } = R3D._dbg; camera.updateMatrixWorld(); const v = new THREE.Vector3(-x / 100, y / 100, z / 100).project(camera);
  const r = document.querySelector('#r3d canvas').getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }"""
def run(w, h):
    errs = []
    with sync_playwright() as p:
        b = __import__("pw").launch(p, ARGS)
        pg = b.new_page(viewport={"width": w, "height": h})
        localcdn.route(pg)                                   # v34: three.js from THREE_LOCAL, if set
        pg.on("pageerror", lambda e: errs.append(str(e)[:200])); pg.on("console", lambda m: errs.append(m.text[:200]) if m.type == "error" else None)
        pg.goto(BASE + "plan.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=180000)
        pg.evaluate("() => document.querySelectorAll('.stk').forEach(s => s.style.pointerEvents = 'none')")   # the stickers sit over things
        def settle():   # v48: wait for the camera to stop flying (the garden made the fly slower headless; a tap mid-flight missed)
            pg.wait_for_function("""() => { const c = R3D._dbg.camera.position, k = c.x.toFixed(4) + c.y.toFixed(4) + c.z.toFixed(4);
              window.__camn = window.__camk === k ? (window.__camn || 0) + 1 : 0; window.__camk = k; return window.__camn >= 3; }""", polling=400, timeout=20000)   # still for three readings 0.4 s apart: under load frames can be 0.25 s apart
        def tap(pt, label):
            pg.keyboard.press("Escape"); pg.wait_for_timeout(100); settle()
            x, y = pg.evaluate(PROJ, pt); pg.wait_for_timeout(300); pg.mouse.click(x, y)   # v48: a click in the same instant as the script call could miss under load
            try:   # v48: wait for the card (a busy machine can take over 0.4 s to show it); no second tap, which would close it
                pg.wait_for_function("() => !document.getElementById('r3d-act').hidden", timeout=3000)
            except Exception:
                pass
            pg.wait_for_timeout(200)
            vis = pg.evaluate("() => !document.getElementById('r3d-act').hidden")
            t = pg.evaluate("() => document.getElementById('r3d-act-h').textContent") if vis else None
            bs = pg.evaluate("() => [...document.querySelectorAll('#r3d-act .acts button')].map(b => b.textContent)") if vis else []   # v39: Details too
            print(f"  tap {label} at ({x:.0f},{y:.0f}) -> {t!r} {bs} errs={errs[-3:]}")
            return t
        def press(text):   # v39: a card's buttons past the first three are under Details: open it first
            b = pg.locator("#r3d-act .acts button", has_text=text).first
            if not b.is_visible() and pg.locator("#r3d-act .r3d-actmore summary").count(): pg.locator("#r3d-act .r3d-actmore summary").first.click(); pg.wait_for_timeout(300)
            b.click(); pg.wait_for_timeout(900)
        def S(k): return pg.evaluate(f"() => R3D._dbg.S.{k}")
        def press_aria(a):
            b = pg.locator(f"#r3d-act .acts button[aria-label='{a}']").first
            if not b.is_visible() and pg.locator("#r3d-act .r3d-actmore summary").count(): pg.locator("#r3d-act .r3d-actmore summary").first.click(); pg.wait_for_timeout(300)
            b.click()
        print(f"== {w}x{h}")
        pg.evaluate("() => R3D.set({site: 'C', cab: 'compact', dining: 'folded', chairs: 'cupboard', tdoor: false, view: 'dining'})"); pg.wait_for_timeout(600)
        tap([444, 45, -150], "the cabinet"); press("Open for six"); print("   dining:", S("dining")); pg.screenshot(path=f"{OUT}/tap_{w}_six.png")
        pg.wait_for_timeout(800); tap([444, 150, -200], "the cabinet again"); press("Fold it away"); print("   dining:", S("dining"))
        tap([444, 45, -205], "the chair door"); press("Open the chair door"); print("   chairs:", S("chairs")); pg.screenshot(path=f"{OUT}/tap_{w}_chairs.png")
        tap([444, 45, -150], "the cabinet"); press("Show the 80-wide"); print("   cabw:", S("cabw"), "w:", pg.evaluate("() => R3D._dbg.scene.getObjectByName('cab').userData.w")); pg.screenshot(path=f"{OUT}/tap_{w}_80.png")
        tap([444, 45, -150], "the cabinet"); press("Show the 90-wide"); print("   cabw:", S("cabw"))
        pg.evaluate("() => R3D.set({cab: 'compact', view: 'wall', drawers: false})"); pg.wait_for_timeout(600)
        tap([60, 30, 12], "the media wall's base"); press("Pull the drawers out"); print("   drawers:", S("drawers"))
        pg.evaluate("() => R3D.set({view: 'room'})"); pg.wait_for_timeout(600)
        lampxy = pg.evaluate("() => { const { MOV, THREE } = R3D._dbg; const b = new THREE.Box3().setFromObject(MOV.lamp.pivot), p = b.getCenter(new THREE.Vector3()); return [-p.x * 100, p.y * 100, p.z * 100]; }")
        tap(lampxy, "the lamp"); press("Turn it")
        print("   lamp level:", pg.evaluate("() => R3D._dbg.S.lv.lamp"))
        # v38: a spot bar turns as a whole, and each head has its own switch, dimmer, aim and colour
        pos = lambda: pg.evaluate("() => R3D._dbg.lights.bar1.map(l => [Math.round(-l.position.x * 100), Math.round(l.position.z * 100)])")
        before = pos(); hxy = pg.evaluate("() => { const p = R3D._dbg.lights.bar1[1].position; return [-p.x * 100, p.y * 100 + 4, p.z * 100]; }")
        if tap(hxy, "spot bar 1"):
            press("⟳ 15°"); press("⟳ 15°"); print("   bar1 turned:", S("fix"), before, "->", pos())
            press("Blue"); press_aria("Aim it up"); pg.wait_for_timeout(900); press_aria("Dim this head"); pg.wait_for_timeout(900); press("Colour"); print("   heads:", S("head"))
            press("Reset"); print("   reset:", S("fix"), S("head"), pos() == before)
        pg.screenshot(path=f"{OUT}/tap_{w}_bar.png")
        pg.evaluate("() => R3D.set({view: 'door'})"); pg.wait_for_timeout(600)
        cxy = pg.evaluate("() => { const { scene, THREE } = R3D._dbg; let best = null; scene.traverse(o => { if (o.isMesh && o.visible && o.parent && o.parent.visible && o.material && o.material.color && o.material.color.getHexString() === 'b9a47f' && !best) best = o; }); if (!best) return null; const c = new THREE.Box3().setFromObject(best).getCenter(new THREE.Vector3()); return [-c.x * 100, c.y * 100, c.z * 100]; }")
        print("   curtain centre:", cxy)
        if cxy and tap(cxy, "the curtains"): press("Draw them"); print("   curtains:", S("curtains"))
        else: print("   curtains: hidden from this view, skipped"); pg.keyboard.press("Escape")
        pg.screenshot(path=f"{OUT}/tap_{w}_curtains.png")
        pg.evaluate("() => R3D.set({site: 'B', cab: 'sliding', dining: 'folded', view: 'dining'})"); pg.wait_for_timeout(600)
        print("   v33, the compact cabinet only: site/cab after asking for the flip-top's:", S("site"), S("cab"))
        # v39 (the approved redesign): Try options: a place's card, › to the next option (the room shows it, the plan bar says the change),
        # then Back to my plan
        pg.evaluate("() => R3D.set({view: 'room'})"); pg.wait_for_timeout(600); pg.keyboard.press("Escape")
        pg.locator("#r3d-dt-room").click(); pg.wait_for_timeout(400); pg.locator("#r3d-try").click(); pg.wait_for_timeout(500)   # v41: Try options is in Room
        pg.evaluate("() => document.querySelector('.stk[data-hot=sofa]').click()"); pg.wait_for_timeout(800)
        print("   try card:", pg.evaluate("() => document.getElementById('r3d-act-h').textContent"))
        pg.locator("#r3d-acts button[aria-label='The next one']").click(); pg.wait_for_timeout(1500)
        print("   next:", pg.evaluate("() => document.getElementById('r3d-act-h').textContent"), "|", pg.evaluate("() => document.getElementById('r3d-plansum').textContent"))
        pg.locator("#r3d-back").click(); pg.wait_for_timeout(800)
        print("   back:", pg.evaluate("() => document.getElementById('r3d-plansum').textContent"), S("sugg.recordtable"), S("sugg.liftcoffee"))
        pg.screenshot(path=f"{OUT}/tap_{w}_try.png")
        # v34: the blind, the records, the trolley, a suggestion's card
        CEN = "k => { const { THREE } = R3D._dbg; const o = k.split('.').reduce((a, p) => a[p], R3D._dbg); const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); return [-c.x * 100, c.y * 100, c.z * 100]; }"
        pg.evaluate("() => R3D.set({site: 'C', dining: 'folded', sugg: {blind: true}, blind: 'down', curtains: false, view: 'windowwall'})"); pg.wait_for_timeout(800)
        tap(pg.evaluate(CEN, "SUGG_G.blind"), "the blind"); press("Roll it up"); print("   blind:", S("blind"))
        pg.evaluate("() => R3D.set({sugg: {}, view: 'breast', lp: false})"); pg.wait_for_timeout(800)
        tap(pg.evaluate(CEN, "MOV.records.pivot"), "the vinyl stand"); press("Lift out"); print("   lp:", S("lp"))
        pg.evaluate("() => R3D.set({beside: 'trolley', trolley: 'park', dining: 'folded', view: 'beside'})"); pg.wait_for_timeout(800)
        tray = lambda: (lambda c: [c[0], 84.4, c[2]])(pg.evaluate(CEN, "BES.trolley"))   # its top tray (the frame is open between the trays)
        tap(tray(), "the trolley"); press("Pull it out"); print("   trolley:", S("trolley")); pg.wait_for_timeout(3500)
        pg.evaluate("() => R3D.set({dining: 'six', aim: {eye: [175, 170, -60], at: [320, 50, -175], fov: 62}})"); pg.wait_for_timeout(800); pg.screenshot(path=f"{OUT}/tap_{w}_trolley.png")
        tap(tray(), "the trolley, out"); press("Park it"); print("   trolley:", S("trolley"), "p", pg.evaluate("() => R3D._dbg.WORK.trolley.p"))
        pg.evaluate("() => R3D.set({beside: 'clear', trolley: 'park', dining: 'folded', sugg: {floorplant: true}, view: 'pc'})"); pg.wait_for_timeout(800)
        if tap((lambda c: [c[0], 10, c[2]])(pg.evaluate(CEN, "SUGG_G.floorplant.pivot")), "the floor plant's pot (a suggestion)"): press("Terracotta"); print("   svar:", S("svar"))
        # v34: the drinks cabinet's front, the storage ottoman's lid
        pg.evaluate("() => R3D.set({sugg: {barcase: true}, barflap: false, view: 'breast'})"); pg.wait_for_timeout(800)
        if tap((lambda c: [c[0], 120, -20.5])(pg.evaluate(CEN, "SUGG_G.barcase")), "the drinks cabinet's front"): press("Open the bar"); print("   barflap:", S("barflap"))
        pg.evaluate("() => R3D.set({sugg: {}, lid: false, aim: {eye: [300, 150, -60], at: [238, 30, -157], fov: 50}})"); pg.wait_for_timeout(800)
        if tap((lambda c: [c[0], 44, c[2]])(pg.evaluate(CEN, "MOV.pouf.pivot")), "the ottoman's lid"): press("Lift the lid"); print("   lid:", S("lid"))
        # v36: the bar by the sofa's front, the lift-top coffee table's top
        pg.evaluate("() => R3D.set({sugg: {barside: true}, barflap: false, aim: {eye: [170, 140, -150], at: [0, 112, -44], fov: 50}})"); pg.wait_for_timeout(800)
        if tap((lambda c: [20.5, 120, c[2]])(pg.evaluate(CEN, "SUGG_G.barside")), "the bar by the sofa's front"): press("Open the bar"); print("   barflap:", S("barflap"))
        pg.evaluate("() => R3D.set({sugg: {liftcoffee: true}, barflap: false, ctop: false, aim: {eye: [240, 135, -95], at: [148, 45, -166], fov: 46}})"); pg.wait_for_timeout(800)
        if tap((lambda c: [c[0], 48, c[2]])(pg.evaluate(CEN, "SUGG_G.liftcoffee")), "the lift-top coffee table"): press("Lift the top"); print("   ctop:", S("ctop"))
        # v38: the record table (the plan's coffee table): its lid lifts
        pg.evaluate("() => R3D.set({sugg: {recordtable: true}, ctop: false, aim: {eye: [150, 150, -250], at: [148, 40, -160], fov: 48}})"); pg.wait_for_timeout(800)
        if tap((lambda c: [c[0], 48, c[2]])(pg.evaluate(CEN, "SUGG_G.recordtable")), "the record table"): press("Lift the lid"); print("   ctop:", S("ctop"))
        pg.evaluate("() => R3D.set({site: 'C', dining: 'folded', sugg: {}, lid: false, view: 'room'})")
        print("  errors:", errs[:5])
        b.close()
run(1280, 800); run(390, 844)
