"""V1 (Phase 3): the client's own numbers, typed in the app, applied over survey_data's guesses.

tools/pull_edits.py reads the app's shared rows (measurements and edits), turns each into a concrete change ("this path takes this
value") and appends it to house/client_edits.json with its source ("the client, in the app, <date>"). survey_data.py calls apply() at its
end, so every builder and every check sees the client's number. A change that can't be applied (its path is gone) is reported, never
silently dropped. SOURCES holds where each changed number came from, for the app and the plan's sources."""
import json, pathlib

FILE = pathlib.Path(__file__).with_name("client_edits.json")
SOURCES = {}        # "BATH.beam_y" -> "the client, in the app, 28 Oct 2026"
PROBLEMS = []


def load():
    try:
        return json.loads(FILE.read_text())
    except (OSError, ValueError):
        return {"changes": []}


def _walk(g, path):
    cur = g[path[0]]
    for k in path[1:-1]:
        cur = cur[k]
    return cur, path[-1]


def apply(g):
    """Apply every change in order (a later one wins). g: survey_data's globals()."""
    for ch in load().get("changes", []):
        path, val = ch["path"], ch["value"]
        try:
            parent, key = _walk(g, path)
            old = parent.get(key) if isinstance(parent, dict) else parent[key]   # a dict may take a new key (a door's first fitted span)
            parent[key] = tuple(val) if isinstance(old, tuple) and isinstance(val, list) else val
            SOURCES[".".join(map(str, path))] = ch.get("src", "the client, in the app")
        except (KeyError, IndexError, TypeError) as e:
            PROBLEMS.append(f"{'.'.join(map(str, path))}: {e}")
