# Handover (11 Nov 2026, V3.62)

**Now (11 Nov 2026, V3.60):** what's open and who has it is `docs/REAL_PLAN.md` section 19; this page is brought to now by N121.

Emma stopped work on 8 Nov 2026 ("stop and handover for a new set of agents and make sure everything is findable in github"), as she
did once on 7 Nov at V2.74. Everything a new team needs is in this repo; nothing lives only outside GitHub. Read in this order:
1. `CLAUDE.md`: the client's rules. **Privacy first: the address is never written anywhere** (files, commits, PRs, pictures).
2. This page: how it runs, what's open, what waits on Emma.
3. `docs/REAL_PLAN.md` section 19: every open row and who has it (start there). `docs/STATE.md`: what's true now.
4. `docs/NOTES.md`: what the threads learned (the sandbox, merging, speed, photo fits, where each feature lives).
5. As needed: `docs/DECISIONS.md` (the client's choices in force), `house/HOUSE.md` (house facts), `docs/HISTORY.md` (every version).

## What it is
Emma and Dave's whole house in 3D, in its upgraded state, to plan and track the upgrades. The 3D fills the screen and is the site;
everything floats over it as pills and panels (the old design: no dashboards, side menus or lists of rooms). It must run well on an
iPhone 15 Pro and an RTX 5070 PC (and Dave's iPhone 16 and RTX 3060). Live: https://emmachilds98-wq.github.io/Demma-Home/ (V3.62).

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

## What was done since 8 Nov (sections 13–18 of `docs/REAL_PLAN.md`; every line in `docs/HISTORY.md`)
| Versions | Section | What |
|---|---|---|
| V3.04–V3.13 | 13, the new team | One shade pass (N46), lean code (N48), speed in Send (N50), Edit drags only the piece (N52), map moves over the house and a room's Above (N53, N55), the PC warmed into a room (N54), office, landing, WC beside their photos (N49), look-over 2 (N51), fewer living room draws (N47) |
| V3.14–V3.21 | 14, finishes | Upgrade floors (N56), the stick in every view (N59), the version on the first screen (N60), one front door and the hall's view down (N61, N62), panelling (N57), one light (N63), three more pieces (N58), the breast and window corner swapped (N64) |
| V3.22–V3.29 | 15, PC fluid, panels | Plan · Build · Buy tidied (N67), no freeze into a room (N65), room cards (N68), the wheel eased (N66), PC framing (N69), moving as a person (N70), smooth turns (N71) |
| V3.30–V3.54 | 16, every room as good | Rooms' light, surfaces, sun, evening (N80, N82, N85, N89), finishes and fabrics (N84, N86, N87, N94, N95, N98, N102, N104, N105), clear stairwells (N88, N101), the stair curtain (N72, N99), smooth PC walking (N91, N97, N103), one light through the house (N92), a quiet GPU at rest (N93), the stand-in street (N81), walk over furniture (N100), the phone smoother (N106) |
| V3.55–V3.62 | 17–18 | Edit check steady, no step at doors on a phone (N122), mirrors and always-on lights (N107, N108), room in the photo budget (N109, 9.5 to 7.9 MB), the outside (N114), progress on every device (N118), Plan leads with the whole house (N119), a PC hiding its card's name drawn with a card (N124) |

## Open now (11 Nov 2026)
`docs/REAL_PLAN.md` section 19 is the live list. At this writing: #223 lean code (N120), #226 shade where walls meet (N112), #227 no black
void behind Above (N115), #228 the phone's labels and stick (N117), #229 whites (N113), #230 no shader mid-step on the first walk (N123),
#231 lit bulbs (N116), #232 quieter artex (N110); N111 (joinery) starts after N110; N121 (this file and `STATE.md`) goes last.
#133 (KTX2, N31) stays paused: **do not merge** till Emma says yes.
**Stale branches:** `git branch -r --merged origin/main` lists the `claude/*` branches with every commit in `main` (40 at this writing):
safe to delete. Others whose PR merged through another branch or closed show as unmerged; check the PR before deleting. Deleting needs
Emma's say. Keep `claude/project-thread-tmpz6b` (#133).

## Waiting on Emma
1. **KTX2 (#133):** confirm before the workflow builds the encoder (it would free most of the photo budget).
2. **Speed from her devices:** on the iPhone 15 Pro and the RTX 5070 PC, open the house, move a moment, then Measure → Send.
3. **Measurements:** the living room door's width (drawn 67), the bathroom door (drawn 68, the photo reads about 61), and the rest in Measure.
4. **Confirm:** the kitchen has no door (V3.03); what's across the road (the street is a stand-in, N81); a microwave photo; dark panels or the cream.
The full list: `docs/STATE.md` "Open with the client".

## Suggested next work
1. Merge section 17's open PRs in turn (each merges `main` in and takes the next free version), then N111, then N121.
2. KTX2 on Emma's yes, from #133. 3. With her Send numbers: the living room's own draws or the GTAO pass (`docs/NOTES.md` section 3).
4. New rounds: a numbered section in `docs/REAL_PLAN.md`, rows that each own their files, and section 19's table kept current.
