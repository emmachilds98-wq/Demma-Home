"""V1: one way to start headless Chromium for every script (the renders, the PDFs, the checks). Playwright's own browser first
(CI installs it); else $CHROMIUM; else the sandbox's preinstalled /opt/pw-browsers/chromium."""
import os, pathlib

GL = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]   # WebGL without a GPU


def launch(p, args=None):
    args = list(args or [])
    try:
        return p.chromium.launch(args=args)
    except Exception:
        for exe in (os.environ.get("CHROMIUM"), "/opt/pw-browsers/chromium"):
            if exe and pathlib.Path(exe).exists():
                return p.chromium.launch(args=args, executable_path=exe)
        raise
