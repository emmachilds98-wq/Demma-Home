# Handover (brought to now 13 Nov 2026, V4.5)

## Now (21 Nov 2026: the round stopped; start here)
The client, 21 Nov 2026: "Merge current work to main and stop the upgrade. Leave a clear upgrade plan for next team with the right
context and plans to not drop anything from our round."

- **Live:** main at **V4.34** (#306), published to GitHub Pages by the workflow. Nothing is open: no PR, no branch with unmerged work.
- **The round (20–21 Nov, `docs/REAL_PLAN.md` section 24, N190–N200), the client's words:** "the house is an improvement plan so it
  shouldnt look the same as my house currently only in sizing and some furniture im keeping ... action everything else"; "but still
  upgrade the furniture we have". So: sizes, layouts and kept pieces stay; the light, materials, furniture detail and finishes they
  haven't chosen are the plan's to upgrade (`docs/DECISIONS.md`).
- **Done:** N190 the picture check (`tools/gallery.py --diff`); N191 the names check (ESLint, `checks.py` "names"); N192 three.js 0.187
  (V4.29); N200 the page's tokens (V4.30); N199 each room's scheme (`house/plan_finishes.json`, V4.32); N198 the furniture (V4.32,
  V4.34); N197 reviewed (nothing to change).
- **Not finished, in the order to take them** (each row in section 24 has the detail; `docs/wip/README.md` has head starts made on
  1eac230, unverified):
  1. **N195, the baked light for everyone.** Built and behind `?bake` (HD paths only). Two tries at switching it on failed CI (#305:
     the Fast paths' shaders and the floors' join, both fixed; #306: on CI the bake's file landed after the warm-up and the HD paths
     built 112 shaders first, budget 44). Next: the light map in the page before the house is built
     (`docs/wip/N195-bake-before-warmup-partial.patch`), then the workflow step (in #306's history). Check: `checks.py --only hitch`
     and `--only site`, several runs, since CI is slower than a sandbox.
  2. **N196, KTX2 photos** (the client's yes). `docs/wip/N196-ktx2-partial.patch` (the encoder side from #133, the page's
     `KTX2Loader` path, the workflow's encoder step); `photos_mb` needs a decision if both formats ship.
  3. **N193, fewer draws.** Measure first (`R3D.perf().calls`; `tools/check_site.py`'s four paths); change only for 10% or more, the
     pictures the same, no shader added. `docs/wip/N193-draws-partial.patch` is an unmeasured start.
  4. **N194, the 3D as modules.** Last and alone: it touches all 24 parts of `media-wall/src/room3d/`. The names check (N191) and the
     picture check (N190) are its safety net: 0 problems and 0.00% moved.
  5. **Smaller:** the seam on the master's back wall in the bake; a pinned `playwright` version in `media-wall/requirements.txt`
     (the hitch job failed once on a fresh runner: #300, passed on its one re-run).
- **What this round learned** (also in `docs/NOTES.md`): three.js 0.187 keys shaders on `hasPositionAttribute` and `vertexNormals`,
  and its shadow maps use basic depth packing, so the warm-up's stand-ins must match or shaders get built mid-walk (V4.29). Anything
  that adds a mesh or a material at the first picture (a scheme's fittings, curtains, prints) shows in the Fast paths' budgets
  (V4.32). A light map must exist before the house's materials are compiled.
- **How the round ran:** one branch, one PR at a time, each merged when CI was green (about 35 minutes a PR); helper agents worked in
  their own worktrees and handed back patches only. Keep the project's rules: the next free version at merge, `docs/STATE.md`
  rewritten, a line in `docs/HISTORY.md`, the row ticked, `house/privacy_check.py` before every commit.
- **The rules in force:** privacy first (the address never written); the old design (the 3D is the site, floating pills and panels);
  the light the same in every room, cosy; smooth on the iPhone 15 Pro and the RTX 5070 inside `tools/perf_budget.json`; walls smooth,
  ceilings white artex; say less.
- **Waiting on Emma:** as below (the door's width for the sofa bed, the map screenshots, the sofa bed's price, a speed reading).

Read in this order: `CLAUDE.md` (the client's rules; **privacy first: the address is never written anywhere**), this page,
`docs/STATE.md` (what's true now), `docs/REAL_PLAN.md` section 24 (every task's state), `docs/NOTES.md` (what the threads learned),
then as needed `docs/DECISIONS.md`, `house/HOUSE.md`, `docs/HISTORY.md`.

## What it is
Emma and Dave's whole house in 3D, in its upgraded state, to plan and track the upgrades. The 3D fills the screen and is the site;
everything floats over it as pills and panels (the old design: no dashboards, side menus or lists of rooms). It must run well on an
iPhone 15 Pro and an RTX 5070 PC (and Dave's iPhone 16 and RTX 3060). Live: https://emmachilds98-wq.github.io/Demma-Home/.

## Architecture (one line a part)
- `house/survey_data.py` (every size, with its source) → `house/model.py` (geometry, each piece an `o.item`) → `house/export_house.py`
  (the house file, `house.schema.json`). Facts: `HOUSE.md`, `EVIDENCE.md` (what each size rests on), `SURVEY.md`, `measure.py` (guesses).
- `media-wall/src/build_viewer.py` builds the one page: brand, Plan · Build · Buy sheets (in `sheets.<hash>.json`, built on first need),
  landing, offline (`sw.js`), photos a file each (`split_photos`). `page.css`, `room3d_page.py` (the dock and panels).
- `media-wall/src/room3d/`: the 3D, 24 parts joined in order into one scope by `room3d_src.py` (a new top-level name can clash), then
  minified by esbuild. Renderer and warm-up `01`, textures `02`, materials `03`, catalogue `08`, house views `09`, walk `14`, cards and
  costs `16`, render loop `17`, keys `19_controls`, view controls `19_view_controls`, start and house build `20_go`, finishes `23_finish`.
- The living room is the media wall project (`geometry.py`, `fit.py`, renders and PDFs); every size is in `fit.SOURCES`.
- three.js 0.187 from npm, bundled at build. Photos: `house/textures/` (CC0, made here) and `media-wall/inputs/` (the client's, EXIF stripped).
- `tools/compare.py` and `camfit.py` put the client's photos beside the 3D; `tools/gallery.py` shoots fixed views for before/after.

## Run, check, deploy
```bash
npm ci && python3 -m pip install -r media-wall/requirements.txt
python3 tools/build.py          # everything into _site/ (--fast skips renders and PDFs)
python3 tools/checks.py         # every check (--quick: no browser; --only site); paste its lines in the PR
python3 house/privacy_check.py  # before every commit
```
**Sandbox:** jsDelivr is blocked: for the browser checks set `THREE_LOCAL` to `node_modules/three` (after `npm ci`),
and use `playwright==1.63.0` with `/opt/pw-browsers`. More in `docs/NOTES.md` section 1.
Nothing built is committed. `.github/workflows/build.yml` on every push to `main` and every PR: build, quick checks, three browser jobs
(site, hitch, page, taps; skipped when only docs changed), then on `main` the Pages deploy. A `v*` tag puts that version's PDFs on a Release.
CI takes about 20 minutes.

## How the work runs (the thread rules)
- A plan section holds tasks N# in a table; each row names the files it owns. A thread takes one task: **one task a PR**, only its files.
- **Versions:** V4.x, one a PR that changes the site (`VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` **rewritten**, not
  appended, the row ticked in `docs/REAL_PLAN.md`). Take the **next free version at merge time**: once CI is green, bring `main` in
  (rebase or a merge commit; the rounds used merge commits), renumber if taken, `checks.py --quick` and `build.py --fast`, push, merge
  straight away. Never below main's. A docs-only conflict needs no second full CI wait. Docs-only PRs take no version (this one doesn't).
- Draft PRs; the client's words quoted at the top; the template's sections (`.github/pull_request_template.md`); `checks.py`'s lines pasted.
- New guesses get a Measure row (`house/measure.py`); new pieces an `o.item(...)`; every size a cited source (`fit.SOURCES`).

## Open branches
Open PRs are listed under "Now". About 100 `claude/*` branches remain from finished threads; `git branch -r --merged origin/main`
lists those safe to delete (deleting needs the owner's say). Keep `claude/project-thread-tmpz6b` (#133). Every version and its PR is
in `docs/HISTORY.md`.

## Waiting on Emma
1. **KTX2 (#133, N141's full form):** yes or no. A yes frees most of the photo budget.
2. **The living room door's width** (N152, #275): drawn 67 cm since V2.94. A tape measure decides.
3. **Map and Street View screenshots**, names painted out (N160 the road, N161 the neighbours; section 21 says which).
4. **The sofa bed's price** (about £700–950 is a guess).
5. **A speed reading from the PC:** a Measure → Send link (`tools/pull_edits.py --link`) after moving round the house.
6. Older and smaller: the kitchen's door (is there one?), dark panels or cream, a microwave photo; the guessed sizes are Measure's rows.

## Suggested next work
Section 22's streams in order, then customisation (the client's own colours, pieces and saved looks), planned once the quality rows
are done. A new finding is a new row in `docs/REAL_PLAN.md`; a lesson goes in `docs/NOTES.md`.
