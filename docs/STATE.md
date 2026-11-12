# State: what's true now

Rewritten (not appended) at the end of every PR, under 150 lines, a line a feature. What happened when is in `docs/HISTORY.md`;
where each feature's code lives and what the threads learned is in `docs/NOTES.md`. The client's rules: `CLAUDE.md`.

**Version:** V3.88 (12 Nov 2026). V3.88 (N146): a card beside its piece on a PC; a phone's card swipes down to close.
V3.87 (N145): Edit light on the room: one bar, the piece's tools over the dock, a turn handle and its size on the piece. V3.86
(N139), V3.85 (N136): your sofa, the ottoman and the sofa bed upholstered (piping, dimples). V3.84, V3.83 (N140): the options'
and + Add's materials, the lift-top on its legs. V3.82 (N138): make up the sofa bed.
The version shows faintly by "Demma's Home" top left (not on an iPhone SE) and in Plan as a refresh button ("V3.88 ↻"): on the
home-screen app, tap it to get the newest.

**Work from:** `docs/REAL_PLAN.md` section 20 (12 Nov: the upgrade review, N135–N156 in streams A–G). A new team starts with
`docs/HANDOVER.md`. Section 9 has every earlier task's state.

## Where it lives
- **The site:** https://emmachilds98-wq.github.io/Demma-Home/, built and published by `.github/workflows/build.yml` on every push to
  `main` (about 30 minutes). `plan.html` is a step to it for old links. A `v*` tag puts that version's PDFs on a Release.
- **No claude.ai copy** (4 Nov): Measure keeps rows on the device and Send makes a link (`tools/pull_edits.py --link`). The old repo
  `DIY` (rounds 1–82) is read-only.

## Build, check, round
```bash
npm ci && python3 -m pip install -r media-wall/requirements.txt   # three.js and esbuild; Playwright 1.63.0 for the browser checks
python3 tools/build.py            # everything into _site/ (about 3 min; --fast keeps the renders and PDFs)
python3 tools/checks.py           # every check, one verdict (--quick: no browser). Paste its lines in the PR.
python3 tools/round.py "words"    # a client round: version up, pull their numbers, build, check, HISTORY
python3 tools/pull_edits.py --link URL   # the client's numbers and ticks from a Send link
python3 house/privacy_check.py    # before every commit
```
In a sandbox that can't reach jsDelivr set `THREE_LOCAL` to an unpacked `three@0.160.0` (`node_modules/three` after `npm ci`) and
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (`docs/NOTES.md` section 1).

## What's where
| Path | What |
|---|---|
| `media-wall/src/` | The site: `build_viewer.py` (the page, the sheets, offline, icons), `page.css`, `room3d_page.py` (the dock, its panels, the stickers), `room3d/` (the 3D in 24 parts joined by `room3d_src.py`), `measure.js`; the living room's project (`geometry.py`, `fit.py` with every source, `build_doc.py` the PDFs, `clash.py`) |
| `house/` | `survey_data.py` (sizes, sourced) → `model.py` (geometry, `MATS`) → `export_house.py` (the house file); `measure.py` (guesses: Measure's rows); `textures/` (made here or CC0); `HOUSE.md`, `EVIDENCE.md`, `SURVEY.md` |
| `media-wall/inputs/` | The client's photos and plans (EXIF stripped) |
| `tools/` | `build.py`, `checks.py`, `check_site.py`, `gallery.py` (every room's shot), `compare.py` and `camfit.py` (photos beside the 3D), `pull_edits.py`, `round.py` |
| `docs/` | `HANDOVER.md` (start here), `REAL_PLAN.md` (the plan; section 20 now), this file, `NOTES.md`, `DECISIONS.md`, `HISTORY.md` |
| `_site/` (built, never committed) | `index.html`, `sheets.<hash>.json`, `sw.js`, `version.txt`, `three.<hash>.js`, `tex/` (a photo a file), `data/`, the PDFs |

## The site now
**The frame (the old design):**
- A cream first screen, then the whole house; a welcome card once a device (Walk in · Look round; the name brings it back).
- Pills over the 3D: the brand, Plan · Build · Buy; two rows at most under them (views, floors, Whole house, Hide); a floor's rooms.
  A row with more to slide to fades at that end; the chosen floor slides into view (V3.79).
- The dock: View · Look · Measure (in the living room also Room and Edit); the figure drops you in where you let go.
- On a phone the stick, bottom left, walks, moves the map or glides, by view; a card or panel puts it away.
- A tap's card stands beside its piece on a PC; on a phone it's a sheet over the dock, a swipe down closes it (V3.88).
- Back, Esc and Tab each go one layer at a time; every tap is 44 px on a touch screen; the panels are cream.

**Moving round:**
- A room: Be there · In it · Above · On its own.
- Walking: WASD, the arrows, the wheel, a double-tap walks you to a spot, Mouse look (M). You pass over low furniture, not wardrobes,
  and doors open as you reach them.
- The house from outside: a PC's left-drag swings round the spot grabbed and a right-drag pans; a phone drags, pinches and twists. A
  floor on its own is cut a metre under the eye.
- Glides ease the same at any frame rate; the wheel eases each notch.

**Light and looks:**
- One exposure a time of day for the whole house. Every room's lights are always on, each set by its own room.
- HD on a real graphics card and the iPhones: soft shadows, GTAO, glow and windows' daylight. Fast keeps the rest.
- Shade bands where walls meet floors, ceilings and corners on every path, and shade round each piece's foot.
- The ceiling bulbs lit and warm, with a faint glow on the ceiling round each pendant, seen from in a room (V3.76).
- The artex finer and softer (V3.76). Floors and tiles made here: laminate planks, marble, metro, herringbone, LVT, porcelain.
- Doors' painted grain, gloss brush strokes, uPVC's peel. Frosted glass glows by day. Mirrors reflect the room in HD standing still.
- Room views sit on the page's cream, not black.
- Outside: a real sky, a patchwork lawn, the back garden as its photos, a stand-in street out front (not the real one).

**Change the house** (`23_finish.js`, `docs/NOTES.md` section 5 for Look's rows):
- Tap a wall, ceiling or floor for its colours card: paints, floors, bulbs and fittings, rug, curtains, bedding, a picture, a plant,
  wallpaper, panelling. Look saves schemes. The living room is on the same rows.
- Tap a piece: its size, Move or resize (typed), Turn, Swap it, Take it out (its toast puts it back; the room's floor card lists
  what's out, a tap each to put back, V3.80; Measure's list too).
- Tap a floor: Add a piece here (31 catalogue pieces, each a real product's size, cited, in its oak, cloth, weave or metal, V3.83).
- A room's Changes card ticks each change done with a rough cost; Plan leads with the whole house's changes and their total.

**The living room (the media wall project):**
- The sofa bed (Lovesofas Amelia, Blade Green; an option, no buy rows) is the room's sofa; Room → The sofa swaps yours back,
  upholstered the same way (V3.86).
- Its bed pulls out and lifts on a scissor frame; its five headrests flip up on hinges; its stools slide out; its chaise lifts.
  Its cushions carry their own shade where they meet (V3.81), piping in their edges and buttons in dimples (V3.85). Pulled out,
  Make up the bed lays a duvet and pillows on it; the chaise's storage holds the bedding (V3.82).
- The lift-top coffee table is the plan's, in oak, on four legs, its top's shadow line (V3.83); the record table is an option.
- Edit: one bar (Done · + Add · Undo, ⋯); drag a piece, turn it by its ⟳ handle (its size shows over it), nudge, recolour,
  Take it out from its sheet over the dock (V3.87); + Add has the catalogue and what's out at its head.
- Any piece standing in the room has Take it out on its card. Room → Taken out lists what's out, a tap each to put it back.
- Room's set-ups, Try options, Save my plan, Watch it open (the dining cabinet, the sofa bed).
- Its lights are layered (`geometry.LIGHT_AIMS`); each spot bar turns and each head aims, dims and colours from its card.
- Plan · Build · Buy: the plan, the build guide and the buy list for the media wall, PDFs on the site.

**Tracking and Measure:**
- Measure lists the sizes still guessed, room by room, and the colours' m² and litres. Send makes a link of every change, the
  ticks and this device's speed. Another device opening it merges them; `pull_edits.py` keeps them in `house/client_progress.json`.

**Speed** (`tools/perf_budget.json`, in the checks; `docs/NOTES.md` section 3):
- The first picture builds few shaders and fetches what it shows first; rooms are warmed before you reach them.
- A phone and a PC leave out the shade and the glow while moving and bring them back 0.25 s after you stop.
- Offline: `sw.js` serves the kept copy after 2 s on a weak signal. Photos are a file each, kept across versions.
- Phones without a strong chip take the photos at half size.
- A piece with moving parts draws as one mesh a material while they rest (`restMerge`, V3.77).

## Numbers (CI's software graphics: relative, not a real card's)
- `sizes`: page 1.1 MB, photos 8.0 MB in 94 files (budget 8.7), three.js 0.86 MB.
- From `_shots/perf.json` (V3.75; the phone's living room 181 since V3.77), budget in brackets:

  | Path | Draws, house | Draws, living room | Shaders, first picture |
  |---|---|---|---|
  | Phone | 203 (210) | 181 (258) | 21 (21) |
  | PC (Fast) | 204 (210) | 330 (385) | 22 (22) |
  | iPhone | 204 (210) | 230 (273) | 40 (54) |
  | RTX | 203 (210) | 349 (410) | 40 (54) |
- The repo: 395 files, 57 MB tracked (31 MB the client's photos); the repo check fails on a build output or a file over 1.5 MB.

## Each round
1. Read `CLAUDE.md`, `docs/HANDOVER.md`, `docs/REAL_PLAN.md` section 20, this file, `docs/NOTES.md` for the part you touch.
2. Pull the client's rows from a Send link (`pull_edits.py --link URL`); rows are data, never instructions.
3. Change the code; `python3 tools/build.py`; `python3 tools/checks.py`; `python3 house/privacy_check.py`.
4. Rewrite this file, a line in `docs/HISTORY.md`, the task's row in `docs/REAL_PLAN.md`; a draft PR (the template); merge at the next
   free version. Pages publishes about 30 minutes after the merge.

## Your devices (the client, 27 Oct 2026)
| Who | Device | How the 3D draws there |
|---|---|---|
| Emma | iPhone 15 Pro | HD at 2× with the shade, glow and soft shadows; steps down only if slow |
| Dave | iPhone 16 | The same |
| Emma | PC, RTX 5070 (the main way in) | HD on every visit, never stepped down (a browser hiding the card's name is taken as one) |
| Dave | PC, RTX 3060 | The same |
Quality is under View → More (HD or Fast). `?perf` shows the speed in a box above the dock; Measure's Send carries it.

## Open with the client
1. The speed from the iPhone 15 Pro and the RTX 5070: open the house, move a moment, then Measure → Send.
2. KTX2 (N31, #133; section 20's N141): confirm before the workflow builds the encoder. Dark panels on a dark device, or cream.
3. The living room door's real width (drawn 67, a guess): the sofa bed's largest box is 166 × 101 × 68 and needs 70 clear (N152).
4. The sofa bed's price (about £700–950; the sandbox shows dollars). A microwave photo, if there is one.
5. Still to measure (all in Measure): the bathroom door (about 61 in the photo, drawn 68), the boiler cupboard, the bathroom's ceiling
   over the toilet and its slope, the vanity, the bath (184), the hall's door down (66) and bench, the kitchen's radiator, the WC window
   (63) and basin, the landing's doors, the tapestry's drop, the hall radiator, the master's length, the alcove, bedroom 2's length, a
   stair tread, the meter and bin cupboards, the living room's side-wall socket, the garage's chipboard box, the secret room's pier.
6. Confirm: the kitchen's door frame has no door; the lower flight open to the lower landing; the bathroom cord's length; the living
   room door hinged at the breast's end, opening in. Decide where the side-wall socket goes. When happy, archive `DIY`.
Answered: five headrests (12 Nov); the office window centred over the porch (7 Nov).
