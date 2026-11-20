"""v34: for headless runs in a sandbox that can't reach jsDelivr: with THREE_LOCAL set to an unpacked three npm package (the version in room3d_page.THREE)
(node_modules/three after npm ci), the page's three.js requests are answered from it.
The published page still loads three.js from jsDelivr; nothing changes without THREE_LOCAL."""
import os, pathlib
from room3d_page import THREE


def route(page):
    root = os.environ.get("THREE_LOCAL")
    if not root:
        return
    root = pathlib.Path(root)

    def serve(r):
        f = root / r.request.url[len(THREE):].split("?")[0]
        if f.is_file():
            r.fulfill(path=str(f), content_type="text/javascript")
        else:
            r.fulfill(status=404, body="not in THREE_LOCAL")
    page.route(THREE + "**", serve)
