# Handover (brought to now 13 Nov 2026, V4.5)

## Now (21 Nov 2026, written mid-round so the next session can pick up if this one stops)
- **Live:** main at V4.33 (#305). **Open: #306** (V4.34, N195's fixes, the bake still behind `?bake`): build, page, taps and site
  green; the hitch check was running. Merge it when green (the project's rule), then take the queue below in order, one PR each.
- **The plan:** `docs/REAL_PLAN.md` section 24 (N190–N200). Done: N190, N191, N192 (V4.29), N200 (V4.30), N199 (V4.32), N197 reviewed.
  In progress: N195 baked light (behind `?bake`), N198 furniture. Open: N193, N194, N196.
- **The queue (work done outside GitHub, in order):**
  1. **N198, the last furniture** (ready): `docs/wip/N198-wc-garage-airing.patch` (`house/model.py` only: the garage's chipboard box as
     1.8 sheets with 3 mm gaps; the WC's cistern a tank and lid, a round flush pipe, the basin's plughole and pillar tap, a bottle trap
     under `wc.pipes`; the airing cupboard's shelves on battens; outer sizes kept, checked against the house file). `git apply` it,
     `python3 tools/checks.py --quick` (it passed: 8 checks), version V4.35, HISTORY/STATE/REAL_PLAN rows, delete `docs/wip/`, PR.
  2. **N195, the baked light on for everyone** (being worked on): on CI the bake's file landed after the warm-up and the HD paths built
     112 shaders on the first picture (budget 44). Fix: the light map in the page before the house is built (inline `bake.json` and
     the UVs into the page at build, or the house's build waiting on it); then the workflow step (in #306's history: Python 3.13 for
     `bpy`, a 1024² atlas at 128 samples, cached by `house.json`, `bake.py`, `20_go.js`). Check with `checks.py --only hitch` and
     `--only site`. The row in section 24 has the history (#303, #305, #306).
  3. **N196, KTX2** (being worked on): the encoder side is on branch `claude/project-thread-tmpz6b` (#133, commit f10bba7, three
     0.160 era): port it, add the page's `KTX2Loader` path in `02_textures.js` (JPEG the fallback), the encoder in the workflow; mind
     `photos_mb` (both formats on disk).
  4. **N193, fewer draws** (being measured): measure where the draws go first (`R3D.perf().calls`, `tools/check_site.py`'s paths); a
     change only if it saves 10% or more with the pictures the same (`tools/gallery.py --diff`) and no shader added.
  5. **N194, the 3D as modules**: last, alone (it touches every part; anything else in flight would conflict).
- **How this round ran:** one branch (`claude/trusting-gauss-gra6z6`), one PR at a time, each merged when CI is green; helper agents
  worked in their own worktrees and handed back patches only (never pushing). CI takes about 35 minutes a PR.
- **The rules in force:** the house is the improvement plan (sizes, layouts and kept pieces stay; the looks are the plan's); the light
  the same in every room, cosy; smooth on the iPhone 15 Pro and the RTX 5070 inside `tools/perf_budget.json`; walls smooth; the
  address never written.

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
