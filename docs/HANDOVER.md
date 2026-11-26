# Handover (26 Nov 2026, V4.90: start here)

## Now (26 Nov 2026, V4.90: start here)
The client, 25 Nov: "another team is going to build it from another session so make sure the repo has everything they will need".

**Read first:** `CLAUDE.md` (the client's rules; **privacy first: the address is never written anywhere**), this block, then
`docs/REAL_PLAN.md` **section 34** (the next build), `docs/NOTES.md` section 5's "Section 34 ... where to start" (the code it changes),
`docs/DESIGN.md` (the design rules, cited) and `docs/DECISIONS.md` ("Ideas that belong", her words). Older plans: `docs/archive/`.

1. **Main's CI first** (N252: a red main is fixed first, from one log read). N284 (V4.83, merged 25 Nov) fixed main's red (the IDEAS
   step, the phone's `first_visit_mb`, the `shaders_first` budgets) without raising a budget; read main's run for V4.83 and fix what's red.
2. **Build section 34, "Ideas that belong" (N286–N292).** Emma: Ideas drops furniture into the wrong rooms; give each room places where
   furniture makes sense, the shops' best for each, made-to-measure pieces in the house's style where shops fall short, and better design
   and suggestions first. Order: N286 (every room's places, in `house/places.py`, checked) → N287 (Ideas places a piece only where it
   belongs: the wrong-room fix) with N292 (its check) → N288 (shops per place) and N289 (made to measure) side by side → N290 (fewer,
   better set-ups) and N291 (places on screen). Claim each row first (`tools/claim.py N286`). Options only: no build steps or buy rows
   till she picks.
3. **Done lately:** N295 (26 Nov) the living room's strip and spots seen lit from the hall and landing; N294 (26 Nov) a room looks the same through a doorway as from inside it (the living room and the hall, the landing: REAL_PLAN section 35).  N285 (V4.82) the phone's buttons and cards: Settings by the brand (Share, quality, labels, help), one row of pills,
   Plan in the dock, a card a bottom sheet; the PHONEUI check. Section 32's rows: see each row's state.
4. **Waiting on Emma:** her storage picks, `?perf` → Send from her PC (N240's real cause), the tape round (N235, N275), the master's
   sliding-door gap, lighting "later" (N228, N270).

**Superseded branches, kept only for reference (not to merge):** `claude/trusting-gauss-gra6z6-pr322`, `-n224`, `-n225`, `-n226`, `-n232`,
`-win` (a parallel session's versions of the same rows are on main); `-n237` (its commit is on main under another id); `-old-n224-kitchen`, `-old-n220-living`, `-old-shaders` (earlier helpers' unfinished work, saved at handover; the same rows are on main). Every other
`claude/trusting-gauss-gra6z6-*` branch is merged.

**The client's standing rules:** check lightly; nothing stays local; don't wait for CI (merge on the quick checks, then fix from main's
CI); do everything that doesn't need her; options only until she picks. All in CLAUDE.md.

## What it is
Emma and Dave's whole house in 3D, in its upgraded state, to plan and track the upgrades. The 3D fills the screen and is the site;
everything floats over it as pills and panels (the old design: no dashboards, side menus or lists of rooms). It must run well on an
iPhone 15 Pro and an RTX 5070 PC (and Dave's iPhone 16 and RTX 3060). Live: https://emmachilds98-wq.github.io/Demma-Home/.

**The rules in force:** privacy first (the address never written); the old design (the 3D is the site, floating pills and panels);
the light the same in every room, cosy; smooth on the iPhone 15 Pro and the RTX 5070 inside `tools/perf_budget.json`; walls smooth,
ceilings white artex; say less.

## Architecture (one line a part)
- `house/survey_data.py` (every size, with its source) → `house/model.py` (geometry, each piece an `o.item`) → `house/export_house.py`
  (the house file, `house.schema.json`). Facts: `HOUSE.md`, `EVIDENCE.md` (what each size rests on), `SURVEY.md`, `measure.py` (guesses).
- `media-wall/src/build_viewer.py` builds the one page: brand, Plan · Build · Buy sheets (in `sheets.<hash>.json`, built on first need),
  landing, offline (`sw.js`), photos a file each (`split_photos`). `page.css`, `room3d_page.py` (the dock and panels).
- `media-wall/src/room3d/`: the 3D, 28 parts joined in order into one scope by `room3d_src.py` (a new top-level name can clash), then
  minified by esbuild. Renderer and warm-up `01`, textures `02`, materials `03`, catalogue `08`, house views `09`, walk `14`, cards and
  costs `16`, render loop `17`, keys `19_controls`, view controls `19_view_controls`, the house's materials `20_1`, outside `20_2`,
  shade and joins `20_3`, the house build and bake `20_4`, start `20_5`, finishes `23_finish`.
- The living room is the media wall project (`geometry.py`, `fit.py`, renders and PDFs); every size is in `fit.SOURCES`.
- three.js 0.187 from npm, bundled at build. Photos: `house/textures/` (CC0, made here) and `media-wall/inputs/` (the client's, EXIF stripped).
- The baked light: `house/bake.py` (Blender as `bpy`), baked by the workflow into `_site/data/bake.json` and its maps. KTX2: the colour
  photos also encoded at build by npm's `ktx2-encoder` (`vendor.ktx2`), for the iPhones.
- `tools/compare.py` and `camfit.py` put the client's photos beside the 3D; `tools/gallery.py` shoots fixed views for before/after.

## Run, check, deploy
```bash
npm ci && python3 -m pip install -r media-wall/requirements.txt
python3 tools/build.py          # everything into _site/ (--fast skips renders and PDFs)
python3 tools/checks.py         # every check (--quick: no browser; --only site); paste its lines in the PR
python3 house/privacy_check.py  # before every commit
```
**Sandbox:** jsDelivr is blocked: for the browser checks set `THREE_LOCAL` to `node_modules/three` (after `npm ci`). Playwright is
pinned at 1.63.0 in `requirements.txt` to match `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`). More in `docs/NOTES.md` section 1.
Nothing built is committed. `.github/workflows/build.yml` on every push to `main` and every PR: build, quick checks, the bake (only
when the house or its build changed; about 8 minutes), four browser jobs (site, hitch, page, taps; skipped when only docs changed),
then on `main` the Pages deploy (about 35 minutes in all). A `v*` tag puts that version's PDFs on a Release.

## How the work runs
- Claim a row first: `python3 tools/claim.py N###` (its branch, the row marked Claimed, a draft PR). One row a PR, only its files.
- Per change: `python3 tools/checks.py --quick` and `python3 house/privacy_check.py`; push every commit at once.
- Ship with `python3 tools/ship.py "words"`: it merges main, takes the next free version and writes VERSION, HISTORY, STATE's and this
  page's version lines (only it does), then merges. Don't wait for CI; read main's CI after and fix a red main first.
- PR titles and branches name the row, never a version. The client's words at the top of the PR (`.github/pull_request_template.md`).
- New guesses get a Measure row (`house/measure.py`); new pieces an `o.item(...)`; every size a cited source (`fit.SOURCES`).
- Branches: `python3 tools/branches.py` (merged, stale, live); deleting waits on the owner's OK.
- Older handover blocks, the old waiting list and the old thread rules: `docs/archive/HANDOVER_to_V4.65.md`.
