"""V3.77 (N153): what a phone draws standing in the living room, piece by piece (a movable, an option, a house material, or the
group's path with its colour and size). The site check's phone path (393 x 852, Fast), its first picture's shaders too.
    python3 tools/draws.py [site dir]        needs the site built (tools/build.py) and THREE_LOCAL where jsDelivr is blocked
Counts two frames (sum) against R3D.perf().calls (one frame): halve the tally."""
import http.server, pathlib, socketserver, sys, threading, json
from functools import partial
ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site").resolve()
sys.path.insert(0, str(ROOT / "media-wall/src")); sys.path.insert(0, str(ROOT / "tools"))
import pw, localcdn
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Q, directory=str(SITE))); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
COUNT = """async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), gl = D.gl, rb = gl.renderBufferDirect.bind(gl);
  R3D.set({ view: "livstand" }); await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(3000);
  const tags = new Map(); for (const [k, g] of Object.entries(D.SUGG_G || {})) tags.set(g && g.isObject3D ? g : g && g.pivot, "sugg:" + k);
  for (const [k, g] of Object.entries(D.IDEA_G || {})) tags.set(g && g.isObject3D ? g : g && g.pivot, "idea:" + k);
  for (const [k, g] of Object.entries(D.BES || {})) tags.set(g, "beside:" + k);
  const tally = {}, name = o => { let p = o, path = []; while (p) { if (tags.has(p)) return tags.get(p); if (p.userData && p.userData.movId) return "mov:" + p.userData.movId; path.push(p.name || p.type); p = p.parent; }
    const hk = o.material && !Array.isArray(o.material) && o.material.userData && o.material.userData.hk; return (hk ? "house:" + hk : "") || path.slice(-3).join("/") + " #" + (o.material && o.material.color ? o.material.color.getHexString() : "") + " " + (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count); };
  let on = false; gl.renderBufferDirect = function (cam, scn, geo, mat, obj, grp) { if (on && !scn.isShadow) { const k = name(obj); tally[k] = (tally[k] || 0) + 1; } return rb(cam, scn, geo, mat, obj, grp); };
  const sm = gl.shadowMap; sm.needsUpdate = false; on = true; D.controls.dispatchEvent({ type: "change" }); await sl(600);
  const f = window.__fr || 0; for (let i = 0; i < 100 && (window.__fr || 0) < f + 2; i++) await sl(200); on = false; gl.renderBufferDirect = rb;
  return { calls: R3D.perf().calls, tally: Object.entries(tally).sort((a, b) => b[1] - a[1]) }; }"""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = pw.launch(p, pw.GL)
    ctx = b.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=1, is_mobile=True, has_touch=True, service_workers="block")
    import check_site; ctx.add_init_script(check_site.PERF_INIT % ("null", "false"))
    pg = ctx.new_page(); pg.set_default_timeout(300000); localcdn.route(pg)
    pg.on("pageerror", lambda e: print("pageerror:", e))
    pg.goto(f"http://127.0.0.1:{httpd.server_address[1]}/index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
    pg.wait_for_timeout(3000); pg.evaluate("() => R3D.photos()")
    r = pg.evaluate(COUNT)
    print("shaders_first", pg.evaluate("() => window.__first"), "calls", r["calls"], "sum", sum(n for _, n in r["tally"]))
    for k, n in r["tally"][:40]: print(f"{n:4d} {k}")
    b.close()
httpd.shutdown()
