"""N307 follow-up probe: python3 tools/probe/walk_probe.py tools/probe/stairs_up.js (after tools/build.py --fast; THREE_LOCAL=unpacked three@0.160.0)."""
import sys, json, threading, socketserver, http.server
from functools import partial
sys.path.insert(0, "media-wall/src")
import localcdn, pw
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
h = socketserver.ThreadingTCPServer(("127.0.0.1", 0), partial(Q, directory="_site")); h.daemon_threads = True
threading.Thread(target=h.serve_forever, daemon=True).start()
JS = open(sys.argv[1]).read()
with sync_playwright() as p:
    b = pw.launch(p, pw.GL)   # the site checks' own launch (the bare one never got R3D ready)
    pg = b.new_page(viewport={"width": 800, "height": 600}); localcdn.route(pg)
    pg.on("pageerror", lambda e: print("ERR", e))
    pg.goto(f"http://127.0.0.1:{h.server_address[1]}/index.html"); pg.wait_for_function("window.R3D && window.R3D.ready", timeout=240000)
    print(json.dumps(pg.evaluate(JS), indent=0))
