# Projects

A project is a plan for one room the client has asked for by name: what it costs, its pieces (each with its time, who, cost, tasks
and what to buy), the buy list, the order, and the options to look at. The app's Projects, Shop and a room's page read them.

**The core-plan rule holds** (client, 23 Oct 2026): a full build only for what the client asks for by name; other ideas stay one line
each (what, where, size, rough cost, source), to look at, never with build steps or buy rows.

- **The media wall** (`media-wall`, the living room) is made by the code in `media-wall/src` (`export_project.py` reshapes the plan's own
  words: `build_doc.py`, `chapters.py`, `pieces.py`, `fit.py`, `ideas.py`). Its fit proofs stay in `fit.py`.
- **A new project** is one hand-written file, `projects/<id>/project.json`, in the shape of `project.schema.json` (the media wall's
  built file, `_site/data/projects/media-wall.json`, is a full example). `tools/build.py` picks it up and the app shows it. Every size and
  price in it needs a source, as everywhere else; tick ids must stay the same once the client has ticked them.
