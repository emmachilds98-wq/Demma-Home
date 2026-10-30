# Demma's Home V1: the review, and the plan to get there

Written 27 Oct 2026, after round 82, at the client's request: "do a full review and report on the current repo and how we can change
and optimise the way it currently views, functions and how it performs its functions so we can make this a smooth user experience that
is clear and easy to use as well as having features that make it easy to edit and adjust ... put this upgrade in a full detailed plan
that agents can share and follow on from one another ... cleansing the github repo memory so we can continue to grow this repo and
change the name to Demma's Home V1 and we will start from the beginning now we have a good whole house app".

**Agents: this file is the plan.** Read it top to bottom once, then work the next open row on the status board (section 0). The rules
in `CLAUDE.md` still hold above everything here, privacy first: the address is never written anywhere.

The design to build towards is a Claude Design canvas (eight artboards: Home, The house, A room, Edit mode, Measure, A project,
Desktop, The design system): https://claude.ai/artifact/MJNiUDxTXmi7pheHbWvuzi (private to the client; section 3 has the same tokens
in text, so an agent can build without opening it). This plan as a page for the client: https://claude.ai/artifact/Wj2np81DCxVCupebKhQEmS
(republish it from this file when the plan changes).

---

## 0. Status board (update this table in every PR)

| Phase | What | Status | PR | Notes |
|---|---|---|---|---|
| 0 | Fresh start: the name, the docs, the repo cleansed | **In review** (27 Oct) | V1 | The client picked A: the new repo `Demma-Home`. Name V1 everywhere; `docs/STATE.md`, `DECISIONS.md`, `HISTORY.md`; no outputs in git; the workflow builds and publishes. Left for the client: Pages on (Actions), archive `DIY` |
| 1 | One house file the app and the checks both read | **In review** (27 Oct) | V1 | `house/export_house.py` + `house.schema.json`: 121 pieces with id, name, room, source; every box tagged (`model.Out.item`); 18 open measurements (`house/measure.py`); 5 new model checks |
| 2 | The site's design | **Done, changed** (28 Oct) | V1, V1.2 | V1 built the canvas's app; the client didn't like it ("it doesnt look anything like my old one") and chose the old design: the media wall's page is the site again, opening on the whole house, Measure in its dock (`tools/check_site.py`). Left: 2.6, splitting `room3d.js` into modules |
| 3 | Edit and measure, saved for everyone | In progress | V1, V1.2 | Measure in the dock (V1.2), rows in the shared db (device + link on Pages); `tools/pull_edits.py` → `house/client_edits.json`. Left: the house's tap-a-piece size edit in the old design (V1's went with its app; the engine's bridge `EMBH` keeps the code) |
| 4 | Speed: a picture in 3 s on a phone | In progress | V1, V1.1, V1.9, V1.11 | Done: the page offline after the first visit (its service worker); quality under View (HD, Fast) and `?perf`. (V1's stills and settings screen went with its app in V1.2.) The devices: two iPhones (15 Pro, 16), two RTX PCs (5060, 3060). V1.1: photographed surfaces, rounded edges, the iPhones' shade and glow when quick, a shared picture sent once. V1.9: the photos after the first picture (their own file on Pages; the page 2.1 MB, was 3.7). V1.11: best quality first on capable devices (the client: "i dont want these low res versions"): the photos 1024–2048 px, the iPhones in HD at 3× from the start, stepping down only if slow. The draw budget holds (BUILD_SPEC §4: 600 a phone): the living room 443 in HD, a room 70–155. Left: the numbers from their iPhones |
| 5 | The living room into the same house model | In progress | V1, V1.10 | Done: its shell and fixed pieces in the house file (ids, sizes, sources). Left: drawing it from the house data instead of `room3d.js`. V1.3: the house's outside (sky, ground, gardens: `house/BUILD_SPEC.md` phases 4 and 5); V1.4: the far end and the view beyond; V1.5: out of the living room's window; V1.6: Be there, the gardens round ours; V1.10: every room's windows look out by day |
| 6 | Projects for any room | **In review** (27 Oct) | V1 | `projects/` (README, `project.schema.json`); the media wall exported by `export_project.py`; a hand-written `projects/<id>/project.json` shows in the app. New projects only when the client asks |
| 7 | Checks on every PR, the round in one command | **In review** (27 Oct) | V1 | `.github/workflows/build.yml` (build, checks, Pages, Releases), `tools/checks.py` (the app at the iPhone 15 Pro's 393 × 852, 1280 and 1920; V1.7: the repo's size), `tools/round.py`, the PR template |
| 8 | Polish: access, offline, install as an app | In progress | V1, V1.2 | Offline and install (the page's own service worker and manifest, the four-dot icon, iPhone home screen) carried into the old design in V1.2. V1's dark mode, focus and contrast checks went with its app; the page's own access pass is left |

**V1 did two things differently from the steps below:** the client's photos are plain files, not Git LFS (46 MB keeps a clone near 75 MB,
and LFS would spend bandwidth quota on every workflow run); and `pull_edits.py` writes the client's numbers to `house/client_edits.json`,
which `survey_data.py` applies at its end (each change with its source), rather than rewriting `survey_data.py`'s Python by machine.

Status words: Not started · In progress (session link) · In review (PR) · Done (date) · Blocked (what on).

---

## 1. The review: what we have today

### 1.1 What the app does (keep all of it)
- **The living room in full detail:** the artisan oak media wall, the compact dining cabinet, the PC side wall, the sofa, lights you can
  aim and dim, paints and finishes ("Look"), options to try ("Room": dinner for six, film night ...), an Edit mode for the room's
  furniture (move, turn, add from a catalogue), saved set-ups, share links, HD pictures, a guided tour.
- **The whole house:** three floors and the roof from `house/model.py`, built from `house/survey_data.py` (the client's photos and words,
  each size with its source). A floor picker (Outside, First, Ground, Lower), a room picker, and three ways into a room (In it, Above,
  On its own). 97 model checks, a flicker check, a clash check, a privacy check.
- **The plan:** Plan · Build · Buy panels and two PDFs (the plan, the build guide) for the media wall project: 93 jobs, 77 things to buy,
  about £4,292–7,950, every size and price with a cited source. A whole-house report (`house/out/Whole_House_HD_Plan.pdf`).
- **Two homes for it:** GitHub Pages (https://emmachilds98-wq.github.io/DIY/) and the shared viewer artifact
  (https://claude.ai/artifact/71ffwf5PRLhoLj6G5KTvm2), which has a shared database the page already uses for saved set-ups.

### 1.2 How it looks and flows (from screenshots at 390 × 844 and 1280 × 800, round 82)
1. **It opens on the media wall, not the house.** The first screen is the living room with the media-wall plan's Plan · Build · Buy
   pills. The house is a "Whole house" button. It started as one room and grew; the front door never moved.
2. **Two navigations at once.** Plan · Build · Buy (top right) are the media wall's; View · Room · Look · Edit (the bottom dock) are the
   living room's. In the bathroom both are still there and do nothing for the bathroom.
3. **Half the phone is empty.** In the living room's default view the room fills the top 40% of the screen; the rest is black.
4. **Words on the 3D.** Labels (Media wall, Side wall and PC, Chimney breast ...) sit over the room; on a phone they cover a third of it.
5. **Icons with no words on a phone.** Top right: home, labels, and three view icons (eye, map, cube) with no text below 600 px.
6. **The house screen crowds.** On a phone the floor chips and the room chips wrap into four rows over a small house; on a computer
   the two chip rows overlap the labels of the rooms.
7. **Long labels.** Paint swatches read "Your pale mint (#dbffc8), Valspar mixed at B&Q"; buttons and toasts are long in places.
8. **The plan is one project.** Plan · Build · Buy only know the media wall. There's no list of rooms, no "what's next" across the house.
9. **Nothing to edit outside the living room.** In every other room you can look; to change a size, a door, a radiator, the client
   sends a photo and a message and waits a round.

### 1.3 How it performs (software graphics in a test browser; relative numbers, not a phone's)
- **Start:** the room ready in 14–16 s here. Round 81 took out a wasted shader compile (60 programs at start, now 32; about 1.7 s).
  The rest of the start is: page parse, building the living room (about 2.2 s), compiling the first frame's shaders.
- **Draws per view** (after round 81): living room 443 calls / 141k triangles / 39 lights (3 with shadows); whole house 600 / 189k;
  landing 290 / 112k; hall 156 / 46k; bathroom 56 / 19k; master 96 / 28k; kitchen 123 / 17k. About 98 shader programs once every view
  has been seen.
- **Page weight:** `index.html` 3.4 MB (the room inlined), the artifact page 7.6 MB, `plan.html` 8.6 MB, `guide.html` 2.3 MB,
  `scene3d.json` 1.65 MB, `room3d.js` about 500 KB in one file. Nothing is split; a phone parses all of it before the first picture.
- **What's already good:** draws only on change (no constant redraw), shadows only when something moves, the house merged per floor and
  material (it needs only 6 shader programs), the living room left out of views that can't see it.

### 1.4 How it's built
- **Two ways of modelling.** The living room is hand-built in JavaScript (`media-wall/src/room3d.js`, 5,529 lines) from
  `geometry.py`; every other room is boxes and prisms from `house/model.py`. A change to the living room's shell and a change to the
  bathroom use different code, different checks and different coordinates.
- **About 24,000 lines** of Python and JavaScript across 29 scripts in `media-wall/src` and 8 in `house/`. The plan PDFs come from
  `build_doc.py` (with `chapters.py`, `instructions.py`, `fit.py`, `ideas.py`, `diagrams.py`, `render.py`).
- **A round takes about 20 minutes of machine time:** the rebuild 6–7 min, `qa.py` and `taptest.py` about 10, the privacy check 3.
  There's no CI: every check runs only if the agent remembers to run it.
- **Generated files are committed:** the pages, the PDFs, the renders and the 3D data are rebuilt and committed every round.

### 1.5 The repo
- **Working tree 844 MB:** `media-wall/out/` 541 MB (16 folders of old versions' PDFs and pictures, about 34 MB each),
  `media-wall/src/` 241 MB (135 render PNGs, 169 MB; 123 backups, 19 MB; the built pages), the client's photos 46 MB.
- **History 5.2 GB on disk** (7.8 GB of files before compression): 414 commits in nine days, each round adding 30–50 MB of PDFs and
  rebuilt 3–8 MB pages. A fresh clone is slow, and it only gets worse.
- **Notes everywhere:** `media-wall/HANDOFF.md` is 2,468 lines; 36 upgrade plans; `README.md` still describes round 72; 9 old
  branches.
- **Good habits to keep:** the client's words quoted with each change, every size with a source, the evidence pictures, the backups
  before big edits, the privacy check before each commit.

### 1.6 How a change happens today
The client sends a photo or a message; an agent reads it, edits `survey_data.py` or `model.py`, checks, rebuilds everything, runs the
tests, writes the docs, opens a PR, merges and republishes: 30 to 90 minutes a round, and the client can't adjust a single size
themselves. Most rounds since 60 are one or two numbers the client could have typed in.

---

## 2. Demma's Home V1: what it should be

### 2.1 Principles
1. **The house first.** Open on Home: the house, what's next, the rooms. The media wall is a project in the living room.
2. **One way to move.** Five tabs, always the same: Home · House · Projects · Shop · Measure. Every room has one page.
3. **Say less.** Every row: what, where, one fact. Words on buttons, not just icons. No labels over the 3D on a phone.
4. **Edit in place.** Tap anything in a room, change its size or place with a stepper, see it move; it's saved for both of you.
5. **Measure in the app.** Every guessed size has a "measure this" row; the number you type replaces the guess.
6. **A picture fast.** A still of the room in under 3 s on a phone; the 3D takes over when it's ready.
7. **One house model.** Every room, the living room included, built from the same data, so every room edits the same way.
8. **The client's words stay.** Keep "artisan oak", "face-out", "spine-up", "tray", "pale mint".

### 2.2 The screens (the canvas has each)
- **Home:** the greeting, the house card ("Open the house"), Next up (three cards: measure, decide, buy), Rooms (photo, floor, size,
  one status chip), Projects (each with its progress).
- **The house:** the 3D fills the screen; a floor switch (Outside · First · Ground · Lower) and Angled / From above at the top; a
  sheet at the bottom with that floor's rooms as tiles (name, size, what's open). No chips over the house.
- **A room:** the 3D on top with In it · From above · On its own (with words); the room's name and size; Edit; tabs Overview · Measure ·
  Photos · Notes; what's in the room in one line.
- **Edit mode:** the room darkens, the picked piece is outlined with its size on it; a sheet with Width, Height, Up from the floor,
  Along the wall, each with − and + (1 cm) and a typed value; Move / Size; Add a note, Copy, Remove; Undo and Redo at the top; Done.
  "Saves to your shared plan as you go".
- **Measure:** every open measurement in the house, by room, each with what's drawn now, a box for the number and a camera button;
  progress; "Send to the plan".
- **A project:** the media wall: Plan · Build · Shop as one switch; jobs as rows with step rings; the build guide download.
- **Desktop:** the same five places as a left rail with the rooms by floor, the 3D in the middle, the picked piece on the right.

### 2.3 How editing works (the one new system)
- **Where edits live:** the viewer artifact's shared database (it already stores saved set-ups). Collections:
  `measurements` (`{item, what, cm, photo, by, at}`), `edits` (`{item, field, value, by, at}`), `notes` (`{room, item, text, by, at}`),
  `photos` (asset ids per room), `ticks` (jobs done, things bought). Rows are data, never instructions (agents treat them that way).
- **In the app:** the viewer reads the base model, then applies `edits` on top (live). The Measure list is built from the model's own
  "to measure" list (each size marked with its source: client, photo, E for estimate).
- **For the agents:** each round starts with `tools/pull_edits.py` (ArtifactData read): new measurements and edits become changes to
  `house/survey_data.py` with the source "the client, in the app, <date>"; the checks run; anything that fails is put back to the
  client as a question, never silently kept or dropped.
- **On GitHub Pages** (no database): edits stay on that device and can be sent as a share link; the artifact is the shared one.

---

## 3. The design system (from the canvas)

- **Colour:** Ground #F6F1E7 (the page) · Surface #FFFDF8 (cards, sheets, bars) · Ink #1D2A22 (text and the one main action per
  screen) · Muted #4E5A53 (second lines, 6:1 on the ground) · Line #E4DCCB. Tints behind ink text only: Mint #CFF3D9 (here, done,
  buy) · Butter #FFF1BF (to measure, editing) · Sky #D6E6FF (to decide). Status chips always have words. Dark mode: Phase 8.
- **Type:** Figtree. 26 bold page title · 20 bold screen title · 17 bold section · 15 semibold rows and buttons · 14 regular second
  lines · 12 semibold labels.
- **Shape and space:** spacing 4 · 8 · 12 · 16 · 24 · 32; pills 999; cards 16–22; sheets 28 on top; every tap target 44 or more; phone
  gutter 16.
- **Pieces:** main button (ink), second button (surface, line), remove (surface, red text #8A2B2B), segmented switch, status chip, row
  (title, second line, chevron), size stepper, bottom sheet with a handle, the tab bar (icon and word; the current tab's icon on mint).
- **In code:** one `tokens.css` (CSS custom properties) used by the app, the plan pages and the PDFs' HTML; no colours written inline.

---

## 4. The plan, phase by phase

Each phase: what, why, the steps in order, the files, done when, the proof to attach to the PR, the size (S under a session, M one
session, L more than one). Do the steps in order; each step that changes code ends with the checks in section 5.

### Phase 0. A fresh start: Demma's Home V1 (M, plus one client step)
**Why:** the client: "change the name to Demma's Home V1 and we will start from the beginning". The repo is 5.2 GB of history and
844 MB of files, most of it old outputs; the notes run to thousands of lines.

0.1 **The name.** "Demma's Home" with a "V1" chip, everywhere the name shows: the app's pill (today "Demma v82"), the page `<title>`,
`manifest.webmanifest` (name, short name "Demma's Home"), the README's title, the PDFs ("Demmas_Home_V1_Plan.pdf",
"Demmas_Home_V1_Build_Guide.pdf"), the artifact's title. Versions from now: V1, V1.1, V1.2 ... (`VERSION` in the build becomes "1.0",
shown as "V1"; each client round adds .1). The old round numbers stay only in `docs/HISTORY.md`.

0.2 **The notes.** Replace the sprawl with four short files under `docs/`:
- `docs/V1_PLAN.md` (this file).
- `docs/STATE.md`: what's true now, in under 150 lines: the version, the links, how to rebuild and check, what's open with the client.
  Rewritten (not appended) at the end of every PR.
- `docs/DECISIONS.md`: every client decision still in force, one line each, with the date and their words (from `HANDOFF.md`,
  `HOUSE.md` and the 36 plans; drop what was later reversed).
- `docs/HISTORY.md`: one line per old round (v9 to v82), then one per V1 round.
Keep `house/HOUSE.md`, `EVIDENCE.md`, `SURVEY.md`, `SOURCES.md` (they're the facts). `BUILD_SPEC.md` folds into this plan.
`CLAUDE.md` keeps the rules and points here first. `media-wall/HANDOFF.md`, the `UPGRADE_PLAN_v*.md` files and `media-wall/plans/`
move to the old repo's history (option A) or `docs/archive/` (B, C).

0.3 **The files.** Delete from the tree: `media-wall/out/v*` (16 folders), `media-wall/src/backups/` (git history is the backup),
`media-wall/src/render_v*.png` (135 stills, retired with HD stills on 23 Oct), `__pycache__`, the built pages. Add a `.gitignore` for
everything a build makes: the pages, the PDFs, `scene3d.json`, the renders, the evidence overlays. Keep the client's photos
(`media-wall/inputs/`, 46 MB, and growing): store them with Git LFS so they don't weigh down every clone.

0.4 **Outputs built, not committed.** A GitHub Actions workflow on every push to `main`: install, build, run the checks (Phase 7), and
publish GitHub Pages from the build (Pages "from Actions"). Each version's PDFs go on a GitHub Release ("Demma's Home V1.3"), so old
versions stay downloadable without living in the repo. The artifact is still published by the agent (`media_wall_viewer_inline.html`
built locally, not committed).

0.5 **The history (the client picks one):**
- **A. A new repository, recommended.** Create `demmas-home` (GitHub, by the client: new repository, public or private). The agent
  pushes the cleaned tree as one first commit, "Demma's Home V1", and sets up Pages and LFS there. `DIY` is archived (read-only):
  nothing is lost, every old round and PR stays readable. The clone goes from 5.2 GB to under 100 MB. The client then points the
  Claude environment at the new repository (Claude Code settings: the environment's repository) and enables Pages on it. The site's
  address changes to `emmachilds98-wq.github.io/demmas-home/`; the artifact link stays the same.
- **B. Keep `DIY`, rename it and rewrite its history** to one commit (force-push `main`, delete the old branches). GitHub keeps every
  old PR's commits, so the stored size barely drops without a request to GitHub support; old PR links lose their code.
- **C. Keep `DIY` and its history, rename it only,** and stop committing outputs from now on (0.3, 0.4). Nothing destructive; the
  5.2 GB stays and clones stay slow.

**Done when:** the name shows everywhere as "Demma's Home · V1"; `docs/STATE.md`, `DECISIONS.md`, `HISTORY.md` exist; the tree has no
build outputs; a fresh clone is under 100 MB (A) or the tree under 120 MB (B, C); the site and the artifact both open the V1 build.
**Proof:** `du -sh` before and after, a clone's size, screenshots of the pill and the site, the workflow's green run.

### Phase 1. One house file (M)
**Why:** today the house is Python lists turned into a 1.65 MB JSON of boxes; the app can't tell a door from a wall, so nothing can be
picked or edited by name.
1. Define `house/house.schema.json`: floors; rooms (id, name, floor, outline, ceiling); walls; openings (doors, windows: wall, along,
   width, sill, head); fittings and furniture (id, room, kind, place, size, finish); slopes and beams; each size with `source` (client,
   photo, plan, E) and `measure` (true when it's a guess to replace).
2. `house/export_house.py` writes `house/house.json` from `survey_data.py` and `model.py` (the model stays the maker of geometry;
   the JSON adds the names and the sources).
3. The viewer keeps drawing from the merged boxes but keeps a map from each box group to its item id, so a tap finds "the mirror",
   "the bathroom door", "the hall radiator".
4. The Measure list comes from every size with `measure: true` (today's `SURVEY.md` rows).
**Done when:** every door, window, radiator, fitting and furniture piece outside the living room has an id, a name and a source; a tap
in any room names the piece. **Proof:** `check_model.py` plus a new check (every item has a source); a tap test per room.

### Phase 2. The new app (L)
**Why:** sections 1.2 and 2.1.
1. `tokens.css` and the pieces (section 3) as small HTML/CSS components; the plan pages use them too.
2. The shell: the five tabs, routes with links that open the same place (`#/home`, `#/house/first`, `#/room/bathroom`,
   `#/room/bathroom/edit`, `#/measure`, `#/project/media-wall/build`, `#/shop`), back that works, search (rooms, pieces, jobs).
3. Home, The house, A room, A project, Shop, Measure as in the canvas. The 3D becomes one component the pages place; it never carries
   another page's buttons.
4. Phone: the 3D fills its space (no black band); no labels over the 3D (the room list is the labels); words on every button.
5. The living room's options (Room, Look) become the living room's Overview: "Try: Dinner for six, Film night ..." chips under the 3D,
   and "Look" as a sheet from the room page.
6. Split `room3d.js` into modules as it moves: `viewer/core.js` (renderer, camera, views), `viewer/house.js`, `viewer/living.js`
   (the media wall room), `viewer/edit.js`, `app/*.js` (pages). An import map, no build step required.
**Done when:** every screen in the canvas works at 390 and 1280 wide; `qa.py` and `taptest.py` rewritten for the new routes pass; the
old Plan · Build · Buy content is reachable from Projects. **Proof:** screenshots of each screen at both widths beside the canvas.

### Phase 3. Edit and measure in the app (L)
1. Edit mode for every item with an id (Phase 1): pick, outline, size label; the sheet's fields and steppers; drag along its wall
   (doors, radiators, switches, mirrors stay on their wall); snap to 1 cm; undo and redo; limits from the checks (a door can't run
   into a corner, a radiator can't overlap a rack).
2. Saving: each change writes one `edits` row to the artifact's database (the `db` capability; load the `artifact-capabilities` skill
   first); the viewer re-applies all rows on load. On Pages: kept on the device, sendable as a link.
3. Measure: the list from Phase 1, a number box and a photo button per row (photos to the artifact's asset store), "Send to the plan".
4. Notes and photos per room (Room page tabs).
5. `tools/pull_edits.py` for agents: read the rows, write them into `survey_data.py` with their source, run the checks, list what
   didn't pass as questions for the client. Every round starts with it.
**Done when:** the client can change the hall radiator's place or the landing door's width on a phone and see it at once; the next
agent round folds it into the model with its source. **Proof:** a recorded edit on a phone-size test, the row in the database, the
resulting `survey_data.py` diff.

### Phase 4. Speed (M, runs beside 2 and 3)
**Targets on a mid-range phone:** a picture of the room in under 3 s, the 3D moving in under 6 s, every view change under 1 s after
the first visit, 30 frames a second while moving.
1. A still first: each room's latest still (WebP) shows at once; the 3D fades in over it.
2. Load in parts: the core viewer and the room you open first; the rest of the house and the living room's furniture when needed.
3. Warm the shaders for the next likely view while idle, with that view's lights and clipping (round 81 showed a warm-up with the wrong
   state is wasted).
4. A budget per view: at most 250 draws and 150k triangles; the living room's 39 lights cut to what each view can see; textures in
   KTX2; the house JSON cached by the service worker.
5. A speed page (`?perf`) the client can open on their phone and send a screenshot of; record the numbers in `docs/STATE.md`.
**Done when:** the targets hold on the client's phone (their screenshot). **Proof:** before and after numbers per view.

### Phase 5. The living room into the house model (L)
Port the living room's shell (walls, breast, alcoves, stairs, door, window) and its fixed furniture from `room3d.js` and `geometry.py`
into the house data, so it edits like every room. The media wall and the dining cabinet stay parametric project builders (their fit
proofs in `fit.py` stay), placed into the room by id. **Done when:** one coordinate system, one set of checks; the living room's
pictures match round 82's to the eye. **Proof:** side-by-side stills at the same cameras.

### Phase 6. Projects for any room (M each, only when the client asks)
Generalise the media wall's Plan · Build · Shop into `projects/<id>/` (steps, parts, sources, costs) so a bathroom refresh or the
office desk can be a project. The core-plan rule holds: a full build only for what the client asks for by name; options stay one line
each, to look at.

### Phase 7. Checks on every PR, the round in one command (M, start with 0.4)
1. CI on every PR: `check_model.py`, `zfight.py`, `clash.py`, `privacy_check.py`, `qa.py`, `taptest.py` (headless Chromium), and
   screenshots of each screen at 390 and 1280 attached to the run.
2. `tools/round.py`: bump the version, pull the client's edits, rebuild, run every check, make the evidence picture, rewrite
   `docs/STATE.md`, open the PR. One command instead of twelve.
3. A PR template: the client's words, what changed, the proof.

### Phase 8. Polish (M)
Keyboard and screen readers (the room list as the way round the 3D; labels on every icon), reduced motion, contrast checked, offline
after the first visit, install as an app ("Demma's Home" on the home screen), dark mode from the tokens.

---

## 5. How agents hand over to each other

**At the start of a session**
1. Read `CLAUDE.md`, then this file's status board, then `docs/STATE.md` (after Phase 0; until then `media-wall/HANDOFF.md`'s top).
2. Pull the client's edits and messages (Phase 3 onward: `tools/pull_edits.py`; the artifact's comments).
3. Take the first row on the board that is Not started and not blocked; mark it In progress with your session link in your first push.

**While working**
- One phase step per PR when it can stand alone; small PRs merge quicker and keep `main` usable (the client: "Merge as needed to keep
  the repo up to date").
- Back up a file before a large edit (until Phase 0, `media-wall/src/backups/`; after it, git is the backup).
- Before every commit: `python3 house/privacy_check.py`. Never write the address, the street, the town, the agent branch or anything
  that pins the house down: not in code, docs, commits, PRs, images or artifacts.
- Ask the client only what only they know (a measurement, a choice); batch questions, three at most, each with what you'd do if they
  don't answer.
- Keep the client's words in the code comments and the docs, with the date.

**At the end**
1. The checks pass (section 4, Phase 7 list; until CI exists, run them yourself and paste the result lines in the PR).
2. Update the status board row (Done with the date, or what's left), rewrite `docs/STATE.md`, add a line to `docs/HISTORY.md`.
3. Merge, republish the artifact, tell the client in a few lines what they can now do, with the links.

**Never:** commit build outputs after 0.3; push to someone else's branch; rewrite `main`'s history without the client's go-ahead
(Phase 0.5 is their call); skip a failing check; invent a size without marking it E with what to measure.

---

## 6. Numbers to beat (27 Oct, round 82, software graphics)

| | Today | V1 target |
|---|---|---|
| Fresh clone | 5.2 GB history | under 100 MB (0.5 A) |
| Working tree | 844 MB | under 120 MB |
| Notes to read before starting | 2,468 lines of HANDOFF plus 36 plans | `STATE.md` under 150 lines plus this plan |
| First picture on a phone | 14–16 s here (software) | under 3 s (a still), 3D under 6 s |
| Living room draws / lights | 443 / 39 | under 250 / what the view sees |
| Whole house draws | 600 | under 250 |
| A size change by the client | a message and a round (30–90 min) | typed in the app, seen at once |
| A round's machine time | about 20 min, all by hand | one command, checks in CI |

---

## 7. Open with the client
1. **Phase 0.5:** A (a new repository, recommended), B or C.
2. Public or private for the new repository (GitHub Pages works with either on their plan; the artifact is private either way).
3. Their phone's make and model, so the speed targets are set on the right kind of device.
4. Still open from round 82: the bathroom's beam and the dormer's ceiling; the landing wall between the bedroom doors' frames; the
   tapestry's size; the bin cupboard; the king bed past its foot (all on the Measure screen once Phase 3 lands).
