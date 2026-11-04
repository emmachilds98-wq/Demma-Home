"""V1.52 (V1_PLAN 2.6): the 3D's script in parts, `media-wall/src/room3d/NN_<part>.js`, joined in name order into the one script the page
runs (one scope, as when it was a single room3d.js). Each part starts at a top-level statement and parses on its own (`tools/checks.py`
sizes line). A new part: the next free number where it belongs in the order."""
import pathlib

DIR = pathlib.Path(__file__).resolve().parent / "room3d"


def parts():
    return sorted(DIR.glob("*.js"))


def js():
    return "".join(p.read_text() for p in parts())
