# Work in progress (21 Nov 2026, saved when the session neared its usage limit)

Helper agents' work, stopped mid-task and saved as patches; none is merged. Apply a patch on its **base** commit
(`git checkout -b <branch> <base> && git apply docs/wip/<file>`), finish it, run `python3 tools/checks.py --quick`, then merge main in.
Delete a file once its task is merged. Rows: `docs/REAL_PLAN.md` sections 25 and 26.

| File | Task | Base | State when stopped |
|---|---|---|---|
| `N212-storage-options-partial.patch` | N212 | 78b2a4c | Storage options' start (a data file of ideas); was adding their `fit.SOURCES` rows |

N210, N208 and N211 (section 26's quick fixes) were started by an agent that had made no change yet: start them fresh.
