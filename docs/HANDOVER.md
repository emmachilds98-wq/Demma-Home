# Handover (8 Nov 2026, V3.03)

**Now (11 Nov 2026, V3.60):** what's open and who has it is `docs/REAL_PLAN.md` section 19; this page is brought to now by N121.

**Latest (11 Nov 2026, V3.73, for the next agent):** the client is testing a sofa she may buy. V3.71 (#242, N126) added Room → The sofa:
Yours · Green sofa bed (the Lovesofas Amelia, Blade Green, 264 × 165, `geometry.SOFABED`, `fit.SOURCES["amelia"]`), its bed pulling
out with the coffee table stepping aside, and Watch the bed open. V3.72 (#243, N127) gave it its upholstery detail. V3.73 (N128–N130)
made it the room's sofa (yours one tap away), moved the record table, ottoman and red lamp to suit it, layered the living room's lights
(`geometry.LIGHT_AIMS`, now a decision in `docs/DECISIONS.md`) and reworked the music room (`house/HOUSE.md`, bedroom 2). Where it all lives:
`docs/NOTES.md` section 5, "The green sofa bed". It's an option to look at (no buy rows) until she says she's buying it. Her open
question on it is in "Waiting on Emma" below (7). GitHub had a major Actions and Pages outage 20:48–21:07 UTC on 11 Nov: if `main`'s
"Build, check and publish" run for a merge still sits queued or failed on an artifact upload (not a test), re-run it from the Actions
tab: Pages publishes only from that run.

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
iPhone 15 Pro and an RTX 5070 PC (and Dave's iPhone 16 and RTX 3060). Live: https://emmachilds98-wq.github.io/Demma-Home/ (V3.03).

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
- **Versions:** V3.x, one a PR that changes the site (`VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` **rewritten**, not
  appended, the row ticked in `docs/REAL_PLAN.md`). Take the **next free version at merge time**: once CI is green, bring `main` in
  (rebase or a merge commit; the rounds used merge commits), renumber if taken, `checks.py --quick` and `build.py --fast`, push, merge
  straight away. Never below main's. A docs-only conflict needs no second full CI wait. Docs-only PRs take no version (this one doesn't).
- Draft PRs; the client's words quoted at the top; the template's sections (`.github/pull_request_template.md`); `checks.py`'s lines pasted.
- New guesses get a Measure row (`house/measure.py`); new pieces an `o.item(...)`; every size a cited source (`fit.SOURCES`).

## What was done since the last handover (sections 10–12 of `docs/REAL_PLAN.md`)
| Version | PR | Task |
|---|---|---|
| V2.75–V2.79 | #121, #122, #128–#130 | The outside (N21), fewer buttons (N20), wallpaper (N29), the plan's code trimmed (N28), fewer shaders (N27); #131 the speed budget (N26) |
| V2.80, V2.92 | #141, #142 | A lighter start (N25): icon subset, sheets on first need, fonts that don't block |
| V2.82 | #139 | Lighter photo files (N32) |
| V2.83 | #136 | The version in Plan is a refresh button |
| V2.87 | #144 | Room to room with no shader built (N35) |
| V2.88 | #143 | Phone and PC look-over (N33): 44 px taps |
| V2.89, V2.93 | #138, #147 | The back garden as its photos (N30), four garden ideas to look at |
| V2.90, V2.91 | #145, #146 | The bathroom and the master beside their photos (N34), soft bedding (N36) |
| V2.94 | #148 | The stairwells: both flights 85, the living room door 67 (N38) |
| V2.95 | #153 | Lean 3D code (N41) |
| V2.96 | #151 | Back goes back (N39) |
| V2.97 | #152 | Keys and names on a PC (N42) |
| V2.98 | #155 | Fewer draws for the house, 287 to 188 (N37) |
| V2.99 | #149 | No second front door (the bin cupboards' doors) |
| V3.00 | #156 | Opens fast on a weak signal (N43) |
| V3.01 | #157 | The changes' costs whole (N40) |
| V3.02 | #158 | Add a piece made real: 28 catalogue pieces, each cited (N45) |
| V3.03 | #159 | The kitchen and the hall beside their photos (N44); the kitchen's door leaf removed |
Docs: #134 (the last handover), #135 (the flaky site check), #137, #140, #150, #154 (plan sections). Skipped numbers: V2.81, V2.84–V2.86.

## Open at this handover
| PR / branch | What | To finish |
|---|---|---|
| #133 `claude/project-thread-tmpz6b` | N31 KTX2 photos, build side only. WIP, **do not merge** | Emma's OK; then the workflow step that builds basisu 1.16.4 (commit 900e40fb5d25), the page's `KTX2Loader` with JPEG fallback (`docs/NOTES.md` section 3), merge main in, a version |
No other PR is open and no issue is open.
**Stale branches** (left in place: deleting them needs the owner's say). 38 `claude/*` branches have every commit in `main`
(`git branch -r --merged origin/main` lists them): safe to delete. Two belong to closed PRs whose work landed another way:
`claude/project-thread-m2wdin` (#127, the duplicate of #122) and `claude/project-thread-1fxdc5` (#132, folded into the last handover).
Five from before V2.0 hold commits not in `main`, work since redone or dropped: `claude/cool-darwin-jq4pu4` (V1.27),
`claude/sweet-noether-y2q5qh` (V1.25), `claude/upgrade-review` (V1.37), `claude/cool-hypatia-lbng98` (the finishes plan at V2.2),
`claude/eloquent-ritchie-pkuk5w` (WIP V2.24, taking a piece out: since done as R6). Look, then delete. Keep `claude/project-thread-tmpz6b` (#133).

## Waiting on Emma
1. **The kitchen's door:** V3.03 took the leaf out (no door in any photo). Is there a door? If so, its width and which way it opens.
2. **KTX2 (#133):** she picked "let CI build it" on 7 Nov; confirm before the workflow builds the encoder.
3. **The living room door's width:** drawn 67 cm since V2.94 to fit beside the 85 cm stairs. A tape measure decides.
4. **`?perf` screenshots** (the corner box after opening the house once) from the iPhone 15 Pro and the RTX 5070 PC (N10).
5. **Dark panels** on a dark device, or keep the cream (the old design) (N9's rest).
6. **A photo of the microwave**, if there is one (N6 found none).
7. **The green sofa bed (V3.71):** its Amazon drawing says 230 cm on the chaise side, its size table and text 165 (drawn 165); ask the
   seller. The price showed in US dollars from the sandbox (about £700–950 is a guess). The arm, stools and chaise are scaled off its photos.
The older list (measurements still guessed, smaller confirmations) is in `docs/STATE.md`, "Open with the client", and in Measure on the site.

## Suggested next work for the new team
**Taken up 8 Nov 2026:** the new team's round is `docs/REAL_PLAN.md` section 13 (N46–N51 side by side, N31 on Emma's yes).
1. Ask Emma the six questions above; act on her answers (each one small PR).
2. N31 (KTX2) on her OK, from #133.
3. With her `?perf` numbers: the living room's own draws and the GTAO pass (`docs/NOTES.md` section 3), then the code trims listed there.
4. The older photo fits (office, landing, WC) again with the photo's own lens (`compare.TRUE_FOV`), as N44 did for the kitchen and hall.
