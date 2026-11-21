# Work in progress from the 20–21 Nov round (not merged, not verified)

Helper agents' unfinished work, saved when the round stopped (the client, 21 Nov: "Merge current work to main and stop the upgrade").
Each was made on **main at 1eac230 (V4.33)**. To use one: `git checkout -b <branch> 1eac230 && git apply docs/wip/<file>`, finish it,
then merge main in. None has passed the checks; read it as a head start, not a result. Delete a file once its task is done.

| File | Task (`docs/REAL_PLAN.md` section 24) | What it holds | State when stopped |
|---|---|---|---|
| `N193-draws-partial.patch` | N193 fewer draws | Changes to `04_living_shell.js`, `11_lights.js`, `16_cards.js`, `19_controls.js`, `20_go.js` (the floors' join, `joinBuild`) | Mid-edit; no measurement reported. Measure first (the row says how) |
| `N195-bake-before-warmup-partial.patch` | N195 baked light for everyone | `09_house_views.js` (the `BAKE` fetch) and `20_go.js` (the start's order) so the light map is in before the house is built | Mid-test (a bake was running); not checked. Main has changed both files since (#306): apply on 1eac230 |
