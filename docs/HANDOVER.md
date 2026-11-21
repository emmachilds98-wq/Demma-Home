# Handover (brought to now 21 Nov 2026, V4.36)

## Now (21 Nov 2026: start here)
The client, 21 Nov 2026: "Merge current work to main and stop the upgrade. Leave a clear upgrade plan for next team with the right
context and plans to not drop anything from our round." Later the same day it was picked up again ("Start and complete the upgrade
that has been ongoing with another team"); what's still open is below and in section 24.

- **Live:** main at **V4.35** (#307, which carried #306), published to GitHub Pages by the workflow. **V4.36** (N196, KTX2) is in
  draft PR **#308**. The only other open PR is #133, the old KTX2 start: N196 replaced it, so the owner can close it.
- **The round (20–21 Nov, `docs/REAL_PLAN.md` section 24, N190–N200), the client's words:** "the house is an improvement plan so it
  shouldnt look the same as my house currently only in sizing and some furniture im keeping ... action everything else"; "but still
  upgrade the furniture we have". So: sizes, layouts and kept pieces stay; the light, materials, furniture detail and finishes they
  haven't chosen are the plan's to upgrade (`docs/DECISIONS.md`).
- **Done:** N190 the picture check (`tools/gallery.py --diff`); N191 the names check (ESLint, `checks.py` "names"); N192 three.js 0.187
  (V4.29); N200 the page's tokens (V4.30); N199 each room's scheme (`house/plan_finishes.json`, V4.32); N198 the furniture (V4.32,
  V4.34); N197 reviewed (nothing to change); N195 the baked light (V4.35: on for everyone on the HD paths, the workflow bakes it,
  cached); N196 KTX2 photos (V4.36, #308: on the iPhones; a PC keeps the exact JPEGs, the row says why and the one line to change);
  N193 fewer draws (V4.37: the house 25% fewer on every path); N194 in part (V4.37: `20_go.js` split in five).
- **Open, in the order to take them** (each row in section 24 has the detail):
  1. **N194's rest, the 3D as ES modules.** The 28 parts share one scope with about 1,030 top-level names, many of them `let`s
     that other parts reassign (an import is read-only), so modules need that state moved into one object first; the names check (N191)
     already catches the clashes the review named. Take it a part at a time, the joined script's names check and `gallery.py --diff` each step.
  2. **Smaller:** the seam on the master's back wall in the bake (a new row if it shows).
- **What this round learned** (also in `docs/NOTES.md`): three.js 0.187 keys shaders on `hasPositionAttribute` and `vertexNormals`,
  and its shadow maps use basic depth packing, so the warm-up's stand-ins must match or shaders get built mid-walk (V4.29). Anything
  that adds a mesh or a material at the first picture (a scheme's fittings, curtains, prints) shows in the Fast paths' budgets
  (V4.32). A light map must exist before the house's materials are compiled.
- **How the round ran:** one branch, one PR at a time, each merged when CI was green (about 35 minutes a PR); helper agents worked in
  their own worktrees and handed back patches only.
- **Everything is in this repo and its pull requests** (the client, 21 Nov: "Make sure all info needed is available via the GitHub repo
  as they will not be in this Claude account or file"). Each PR's description (#299–#308) says what changed, why and the checks' lines.
  Older rows (sections 20–23) mention screenshots "in the project files": those were in a claude.ai project that the next team won't
  have; they aren't needed, and `python3 tools/gallery.py` (every room's view) or `--diff <main's build>` makes fresh ones.

Read in this order: `CLAUDE.md` (the client's rules; **privacy first: the address is never written anywhere**), this page,
`docs/STATE.md` (what's true now), `docs/REAL_PLAN.md` section 24 (every task's state), `docs/NOTES.md` (what the threads learned),
then as needed `docs/DECISIONS.md`, `house/HOUSE.md`, `docs/HISTORY.md`.

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

## How the work runs (the thread rules)
- A plan section holds tasks N# in a table; each row names the files it owns. A thread takes one task: **one task a PR**, only its files.
- **Versions:** V4.x, one a PR that changes the site (`VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` **rewritten**, not
  appended, the row ticked in `docs/REAL_PLAN.md`). Take the **next free version at merge time**: once CI is green, bring `main` in
  (rebase or a merge commit; the rounds used merge commits), renumber if taken, `checks.py --quick` and `build.py --fast`, push, merge
  straight away. Never below main's. A docs-only conflict needs no second full CI wait. Docs-only PRs take no version.
- Draft PRs; the client's words quoted at the top; the template's sections (`.github/pull_request_template.md`); `checks.py`'s lines pasted.
- New guesses get a Measure row (`house/measure.py`); new pieces an `o.item(...)`; every size a cited source (`fit.SOURCES`).

## Open branches
Open PRs are listed under "Now". About 100 `claude/*` branches remain from finished threads; `git branch -r --merged origin/main`
lists those safe to delete (deleting needs the owner's say). `claude/project-thread-tmpz6b` (#133) is no longer needed once #133 is
closed. Every version and its PR is in `docs/HISTORY.md`.

## Waiting on Emma
1. **The living room door's width** (N152): drawn 67 cm, the sofa bed's biggest box needs 70; the front door's (82, a guess) too.
2. **Map and Street View screenshots**, names painted out (N160 the road, N161 the neighbours; section 21 says which).
3. **The sofa bed's price** (about £700–950 is a guess).
4. **A speed reading from the iPhone and the PC:** a Measure → Send link (`tools/pull_edits.py --link`) after moving round the house.
5. Older and smaller: the kitchen's door (is there one?), dark panels or cream, a microwave photo; the guessed sizes are Measure's rows.
   On hold: the outside by evening (N163, "No time of day yet").

## Suggested next work
Section 24's open rows (N193, then N194), then customisation (the client's own colours, pieces and saved looks), planned once the
quality rows are done. A new finding is a new row in `docs/REAL_PLAN.md`; a lesson goes in `docs/NOTES.md`.
