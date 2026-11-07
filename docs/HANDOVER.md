# Handover (7 Nov 2026, V2.74)

Emma stopped all work on 7 Nov 2026 ("i want to stop work right now, update the repo and plans for another manager and team to pick
up and continue"). This page is where a new manager and team start. Read it, then `CLAUDE.md` (the client's rules: **privacy first,
the address is never written anywhere**), then `docs/STATE.md` (what's true now) and `docs/REAL_PLAN.md` section 9 (every task's state).

## What it is
Emma and Dave's whole house in 3D, in its upgraded state, to plan and track the upgrades. The 3D fills the screen and is the site;
everything floats over it as pills and panels (the old design: no dashboards, side menus or lists of rooms). It must run well on an
iPhone 15 Pro and an RTX PC. Live: https://emmachilds98-wq.github.io/Demma-Home/ (V2.74).

## Architecture (one line a part)
- `house/survey_data.py` (every size, with its source) → `house/model.py` (geometry, each piece an `o.item`) → `house/export_house.py`
  (the house file, `house.schema.json`). Facts: `HOUSE.md`, `EVIDENCE.md` (what each size rests on), `SURVEY.md`, `measure.py` (guesses).
- `media-wall/src/build_viewer.py` builds the one page: brand, Plan · Build · Buy sheets, landing, offline (`sw.js`), photos split a
  file each (`split_photos`). `page.css`, `room3d_page.py` (the dock and panels).
- `media-wall/src/room3d/`: the 3D, 24 parts joined in order into one scope by `room3d_src.py` (a new top-level name can clash), then
  minified by esbuild. Renderer and warm-up `01`, textures `02`, materials `03`, house views `09`, walk `14`, cards `16`, render loop
  `17`, view controls `19_view_controls`, start `20_go`, finishes `23_finish`.
- The living room is the media wall project (`geometry.py`, `fit.py`, renders and PDFs); its sizes are in `fit.SOURCES`.
- three.js 0.160 from npm, bundled at build. Photos: `house/textures/` (CC0) and `media-wall/inputs/` (the client's, EXIF stripped).

## Run, check, deploy
```bash
npm ci && python3 -m pip install -r media-wall/requirements.txt
python3 tools/build.py          # everything into _site/ (--fast skips renders and PDFs)
python3 tools/checks.py         # every check (--quick: no browser; --only site); paste its lines in the PR
python3 house/privacy_check.py  # before every commit
```
Nothing built is committed. `.github/workflows/build.yml` on every push to `main`: build, quick checks, then Pages deploy (deploy needs
only the build, so it publishes even if a browser job fails) and three browser jobs (site, page, taps; skipped when only docs changed).
A `v*` tag puts that version's PDFs on a Release. CI takes about 20 minutes.

## How the work runs
- A plan's section holds tasks N# in workstreams; a thread takes one task, **one task a PR**, owning only the files its row names.
- **Versions:** V2.x, one a PR that changes the site (`VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` rewritten over main's,
  the row ticked). Take the **next free version at merge time**, not when you start: threads race for it. Once CI is green, merge `main`
  in (a merge commit, not a rebase), renumber if taken, `checks.py --quick` and `build.py --fast`, push, merge straight away. A
  docs-only conflict needs no second full CI wait. Docs-only plan PRs don't take a version (this one doesn't).
- Draft PRs; the client's words quoted at the top; the PR template's sections (`.github/pull_request_template.md`).

## Open PRs at the handover (all landed 7 Nov as V2.75–V2.79 but #131 and #133; now: `docs/REAL_PLAN.md` section 10)
| PR | Task | State | To finish |
|---|---|---|---|
| #121 | N21 the outside beside the photos, and the office window centred over the porch (Emma's answer) | Pushed as V2.75, 4 behind main; CI running at handover | Merge main, next free version, CI green, merge |
| #122 | N20 fewer buttons on top | Pushed as V2.75, 4 behind main; CI running at handover | Land this **or** #127, close the other |
| #127 | N24: #122 with main merged in | Up to date; CI: browser (site) failed | As #122; it carries #122's commit |
| #128 | N29 wallpaper, paint pairings (F9, F11) | Draft, up to date; CI: browser (site) failed | Fix the site check, merge |
| #129 | N28 trim the plan's code (8,206 → 7,016 lines) | Draft, up to date; CI: browser (site) failed | Fix the site check, merge |
| #130 | N27 fewer shaders, a lighter house | Draft, up to date; CI: browser (site) failed | Fix the site check, merge |
| #131 | N26 a speed budget in the checks | Draft, 2 behind (docs); CI all green; no version yet | Take a version, paste checks, merge; then re-measure the budget after the others land |
| #133 | N31/N22 KTX2 photos, build side only | WIP, do not merge | The workflow step that builds basisu 1.16.4 (pinned commit in the PR), the page's KTX2Loader with JPEG fallback |

**The site check:** main's own V2.74 push failed `browser (site)` once ("1920: Measure didn't keep the number typed ({})"), and #131
passed it, so look at that first: it may be flaky rather than four broken PRs. Screenshots are in each run's `screenshots-site` artifact.
PR #132 (N35, N36 rows) is folded into this handover and can be closed.
**Stale branches** (159 behind main, from before V2.0, all merged or dropped): `claude/cool-darwin-*`, `cool-hypatia-*`,
`eloquent-ritchie-*`, `sweet-noether-*`, `upgrade-review`. Check, then delete.

## Waiting on Emma
1. `?perf` screenshots (the corner box after opening the house once) from the iPhone 15 Pro and the RTX 5070 PC (N10, N17).
2. KTX2: she picked "let CI build it" (7 Nov) on #133's thread; confirm before the workflow builds the encoder.
3. Dark panels on a dark device, or keep the cream (the old design) (N9's rest, V1_PLAN phase 8).
4. A photo of the microwave, if there is one (N6 found none).
5. What she'd like in the gardens (N30), and what to try in each room (N5's trays).
6. Answered: the office window centred over the porch at its current size (done in #121, not merged).
The older list (measurements, confirmations) is in `docs/STATE.md`, "Open with the client".

## Suggested order for the new team
1. Find out why `browser (site)` fails, then land #121 and #122/#127 (N24), then #128, #129, #130, #131 one at a time, renumbering.
2. N25 (a lighter start), N35 (shaders on room change), N32, N33, then N30 → N34 → N36 (one thread, `model.py`).
3. N31 (KTX2) on Emma's confirmation.
