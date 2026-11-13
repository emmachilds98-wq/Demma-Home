# Handover (brought to now 13 Nov 2026, V4.5)

## Now
- **Live:** Home Plan V4.5 at https://emmachilds98-wq.github.io/Demma-Home/ (main at #271, the double-click to centre).
- **The plan:** `docs/REAL_PLAN.md` section 22 (13 Nov, N170–N178, six streams: A views, B finishes, C outside, D UI, E lean and
  smooth, F docs). Each row names its files; take the next open row of a stream. Section 21's open rows carry on.
- **Open PRs:** #272 (N141, fabrics made at build), #273 (N163, outside by evening: waits on Emma's card), #274 (N169, the plot's
  soft edge), #275 (N152, will the sofa bed go in: waits on the door's width), #133 (KTX2, paused: do not merge).
- **Next when they land:** stream B (N142, then N172) after #272; stream C (N173) after #273 and #274.
- **The rules in force:** furniture and layouts finished; the light the same in every room, cosy; smooth on the iPhone 15 Pro and the
  RTX 5070 inside `tools/perf_budget.json`; walls smooth (no plaster relief); customisation after the quality work; the address never
  written. The project's own rules (read first, merge main last, the next free version at merge) are in the project's instructions
  and below.
- **Waiting on Emma:** see "Waiting on Emma" below.

Emma stopped work on 8 Nov 2026 ("stop and handover for a new set of agents and make sure everything is findable in github"), as she
did once on 7 Nov at V2.74. Everything a new team needs is in this repo; nothing lives only outside GitHub. Read in this order:
1. `CLAUDE.md`: the client's rules. **Privacy first: the address is never written anywhere** (files, commits, PRs, pictures).
2. This page: how it runs, what's open, what waits on Emma.
3. `docs/STATE.md`: what's true now. `docs/REAL_PLAN.md` section 9: every task's state.
4. `docs/NOTES.md`: what the threads learned (the sandbox, merging, speed, photo fits, where each feature lives).
5. As needed: `docs/DECISIONS.md` (the client's choices in force), `house/HOUSE.md` (house facts), `docs/HISTORY.md` (every version).

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
- three.js 0.160 from npm, bundled at build. Photos: `house/textures/` (CC0, made here) and `media-wall/inputs/` (the client's, EXIF stripped).
- `tools/compare.py` and `camfit.py` put the client's photos beside the 3D; `tools/gallery.py` shoots fixed views for before/after.

## Run, check, deploy
```bash
npm ci && python3 -m pip install -r media-wall/requirements.txt
python3 tools/build.py          # everything into _site/ (--fast skips renders and PDFs)
python3 tools/checks.py         # every check (--quick: no browser; --only site); paste its lines in the PR
python3 house/privacy_check.py  # before every commit
```
**Sandbox:** jsDelivr is blocked: for the browser checks set `THREE_LOCAL` to an unpacked `three@0.160.0` (`npm pack three@0.160.0`),
and use `playwright==1.63.0` with `/opt/pw-browsers`. More in `docs/NOTES.md` section 1.
Nothing built is committed. `.github/workflows/build.yml` on every push to `main` and every PR: build, quick checks, three browser jobs
(site, page, taps; skipped when only docs changed), then on `main` the Pages deploy. A `v*` tag puts that version's PDFs on a Release.
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
4. **Outside by evening** (N163, #273): keep it by day, follow the clock, or day unless evening is picked.
5. **The sofa bed's price** (about £700–950 is a guess).
6. **A speed reading from the PC:** a Measure → Send link (`tools/pull_edits.py --link`) after moving round the house.
7. Older and smaller: the kitchen's door (is there one?), dark panels or cream, a microwave photo; the guessed sizes are Measure's rows.

## Suggested next work
Section 22's streams in order, then customisation (the client's own colours, pieces and saved looks), planned once the quality rows
are done. A new finding is a new row in `docs/REAL_PLAN.md`; a lesson goes in `docs/NOTES.md`.
