# Work in progress (21 Nov 2026, saved when the session neared its usage limit)

Helper agents' work, stopped mid-task and saved as patches; none is merged. Apply a patch on its **base** commit
(`git checkout -b <branch> <base> && git apply docs/wip/<file>`), finish it, run `python3 tools/checks.py --quick`, then merge main in.
Delete a file once its task is merged. Rows: `docs/REAL_PLAN.md` sections 25 and 26.

| File | Task | Base | State when stopped |
|---|---|---|---|
| `N207-mouse-look-partial.patch` | N207 (+ N203) | 78b2a4c | Contains N203's change **and** the mouse-look work on top (look while a button is held, natural direction). Use it **instead of** the N203 file if taking both. Mid-task: not tested |
| `N212-storage-options-partial.patch` | N212 | 78b2a4c | Storage options' start (a data file of ideas); was adding their `fit.SOURCES` rows |
| `N204-N202-bake-partial.patch` | N204, N202 | 01b72c9 | N204 done (Blender 6: `use_nodes` calls removed/guarded in `bake.py`); N202 (the seam) was about to be shot |

N210, N208 and N211 (section 26's quick fixes) were started by an agent that had made no change yet: start them fresh.
