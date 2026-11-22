# Handover (22 Nov 2026, V4.43: start here)

## Now (22 Nov 2026)
The client, 21–22 Nov: her review on the PC (`docs/REAL_PLAN.md` section 26: "the movement to look around on mouse feels inverted",
grey carpet in bedroom 2 and the office, each room's floor from a card, the stairwell's floor covering the hole, the office's plastic
ivy, storage "for all our things and displays / knick nacks"); her answers in `docs/DECISIONS.md` ("Answers for the next upgrade");
"Start the plan from recent work" (22 Nov), after the session that did V4.38–V4.40 stopped on its usage limit.

- **Section 26 is done** (each row says how and with what checks):
  - V4.40 (#314): N208 grey carpet in bedroom 2 and the office; N211 the office's plastic ivy out.
  - V4.41 (#315): N210 no floor over the stairwells (the landing's over the hole down, the hall's over the lower flight); a model check.
  - V4.42: N207 a mouse held down looks the way it moves, the orbit views too, Mouse look's pointer lock out (her choice: only while a
    button is held); a site check (`check_site.py` `mouse_look`). N209 each room's floor from its card ("Bedroom 2 · Grey carpet",
    "The plan's", the cost by its laid area, in a look link and Measure → Send). N204 the bake ready for Blender 6; N202 in part (the
    islands 10 texels apart, the smoothing inside the gap; the master's wall still to shoot after CI's fresh bake).
  - V4.43: N212 storage ideas to look at (`house/storage_ideas.py`: 12 ideas, 18 pieces, each one line with a cited source; a
    room's floor card → More → "Storage ideas"; checked clear of walks, doors and slopes; `docs/STORAGE.md` has each room's numbers;
    a table in the plan's PDF). Her pick comes next: only then a build and a buy list (CLAUDE.md, core plan vs options).
  - V4.39 (#313): N203 step 1, the 3D's shared state in one object (`GS`); step 2 (ES modules) is open.
- **Open, in order:** N202's check (shoot the master with and without the bake); N203 step 2; then section 25 (N201 the real devices'
  check, "lighting later when the house is right"; N205 on hold; N206 her own colours and swapping furniture, to plan with her).
- **Waiting on Emma:** which storage ideas she wants (N212), then sizes for them; the master's frames' sliding doors need a measurement
  first (they'd cut about 2 cm into the room door's swing as drawn).
- `docs/wip/` is gone: every saved patch was finished and merged.

The earlier state (the round of 20–21 Nov, V4.37), kept for reference:

- **Live:** main at **V4.37** (#309), published to GitHub Pages by the workflow: https://emmachilds98-wq.github.io/Demma-Home/.
  No PR of this round is open. The only open PR is #133 (the old KTX2 start, replaced by N196): the owner can close it.
- **The round (20–21 Nov, `docs/REAL_PLAN.md` section 24, N190–N200), the client's words:** "the house is an improvement plan so it
  shouldnt look the same as my house currently only in sizing and some furniture im keeping ... action everything else"; "but still
  upgrade the furniture we have". So: sizes, layouts and kept pieces stay; the light, materials, furniture detail and finishes they
  haven't chosen are the plan's to upgrade (`docs/DECISIONS.md`).
- **Done in section 24** (each row says how, with its numbers):
  - N190 the picture check (`tools/gallery.py --diff`); N191 the names check (ESLint over the joined 3D, `checks.py` "names").
  - N192 three.js 0.187 (V4.29); N200 the page's tokens (V4.30); N199 each room's scheme (`house/plan_finishes.json`, V4.32).
  - N198 the furniture (V4.32, V4.34); N197 reviewed (their own pieces already real; nothing to change).
  - N195 the baked bounce light (V4.35): on by default on the HD paths (`?nobake` off), baked by the workflow (Blender's Cycles as
    `bpy`, about 8 min, cached by the house file, `bake.py` and the `20_*.js` parts); the page waits up to 2.5 s for it before the house
    is built (`R3D.timing().bake` says on, late or none). The concrete stays out of the bake (V4.36: see "learned").
  - N196 KTX2 photos (V4.36): the iPhones take the 42 colour photos as KTX2 (ETC1S); a PC keeps the exact JPEGs (why: the row).
  - N193 fewer draws (V4.37): from outside the house a quarter fewer draws on every path (doors, lids and shade bands in its join);
    CI with the bake on: the iPhone path 147 draws (was 197), the RTX 148 (was 195), 0 hitches walking.
  - N194 in part (V4.37): `20_go.js` split into five parts (`docs/NOTES.md` says which holds what); ES modules left (N203).
  - The repo's quality pass (V4.36): the workflow's actions on Node 24; this page made one; dead code and stills gone.
- **What's left: `docs/REAL_PLAN.md` section 25** (N201–N206, in order): the real devices' check of V4.35–V4.37 (N201, with Emma),
  the bake's seam (N202), ES modules (N203), Blender 6's API in `bake.py` (N204), KTX2 on the PC (N205, on hold), customisation (N206,
  to plan with Emma). Housekeeping for the owner: #133 and the finished branches.
- **What this round learned** (in `docs/NOTES.md` too):
  - three.js 0.187 keys shaders on `hasPositionAttribute` and `vertexNormals`, and its shadow maps use basic depth packing, so the
    warm-up's stand-ins must match or shaders get built mid-walk (V4.29).
  - Anything added at the first picture (a scheme's fittings, curtains, prints) shows in the Fast paths' budgets (V4.32).
  - A light map must be on a material before its first compile: one that lands later rebuilds every house material (#306: 112 shaders).
  - A material that shares another's program on purpose (the concrete's plain key in the living room's view, `garageFloor`) must stay
    out of the bake: baked, its key is its own and the hitch walk catches it built mid-walk (V4.35's merge, fixed V4.36).
  - CI's caches are per branch: main bakes again after a merge (8 min), the PR's bake isn't reused.
  - The hitch check names the material it catches (`check_site.py` `HITCH_INIT`): read its line before guessing.
  - Local browser checks take 40+ min on this sandbox's 4 cores with helpers running: let CI measure; run `--quick` locally.
- **How the round ran:** one branch, one PR at a time, each merged when CI was green (about 35 minutes a PR); helper agents worked in
  their own worktrees and handed back commits; work in progress was saved into the repo before every pause (the usage limit once
  stopped the helpers mid-task; nothing was lost).
- **Everything is in this repo and its pull requests** (the client, 21 Nov: "Make sure all info needed is available via the GitHub repo
  as they will not be in this Claude account or file"). Each PR's description (#299–#309) says what changed, why and the checks' lines.
  Older rows (sections 20–23) mention screenshots "in the project files": those were in a claude.ai project the next team won't have;
  `python3 tools/gallery.py` (every room's view) or `--diff <main's build>` makes fresh ones.

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
0. **V4.35–V4.37 on her own devices** (N201): the baked light, the iPhone's KTX2 photos, the walk; a Measure → Send link and screenshots.
1. **The living room door's width** (N152): drawn 67 cm, the sofa bed's biggest box needs 70; the front door's (82, a guess) too.
2. **Map and Street View screenshots**, names painted out (N160 the road, N161 the neighbours; section 21 says which).
3. **The sofa bed's price** (about £700–950 is a guess).
4. **A speed reading from the iPhone and the PC:** a Measure → Send link (`tools/pull_edits.py --link`) after moving round the house.
5. Older and smaller: the kitchen's door (is there one?), dark panels or cream, a microwave photo; the guessed sizes are Measure's rows.
   On hold: the outside by evening (N163, "No time of day yet").

## Suggested next work
`docs/REAL_PLAN.md` section 25 in its order (N201 first: it needs Emma, so ask early), then customisation (N206). A new finding is a new row in `docs/REAL_PLAN.md`; a lesson goes in `docs/NOTES.md`.
