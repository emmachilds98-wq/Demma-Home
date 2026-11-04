# State: what's true now

Rewritten (not appended) at the end of every PR. Under 150 lines. The plan and its status board: `docs/V1_PLAN.md`. The rules: `CLAUDE.md`.

**Version:** V1.52 (4 Nov 2026)

**The quality plan** (the client: "the best possible quality 3D model"): `docs/QUALITY_PLAN.md`, its phases and their status.

**The upgrade review** (4 Nov 2026: clipping, speed, zoom, moving round, the buttons): `docs/UPGRADE_REVIEW.md`, phases U1–U9 and their board (U1–U3 done in V1.28, U4 in V1.29, U5 in V1.30, U6 in V1.31, U7 in V1.32, U8 in part in V1.33, U9 in part in V1.34, U10 and U11 in V1.35–V1.37, Next 1 in part in V1.38, Next 5 in V1.39, Next 2 in part in V1.40–V1.42; its "Next" list is the work to take on).

## Where it lives

- **The site on GitHub Pages:** https://emmachilds98-wq.github.io/Demma-Home/ (built and published by the workflow on every push to
  `main`, a few minutes after the merge since V1.35; Pages' source is GitHub Actions). `plan.html` is the same page, for old links.
- **No shared page any more** (the client, 4 Nov 2026: "i dont need a copy here just update the live github and plan there so another
  agent can continue"): the claude.ai copy (https://claude.ai/artifact/8M7ZmKP8m1kEDTZnuL3cyK) stays as it was at V1.27 and isn't
  republished; the build no longer makes `artifact.html`. Its database still holds the Measure rows typed there (`measurements`), which
  `pull_edits.py` can still read; on Pages, Measure keeps them on the device and Send makes a link (`pull_edits.py --link`).
- **The old repo** `DIY` (rounds 1–82, every PR and note): read-only history; archive it on GitHub when you're happy.

## Build, check, round

```bash
python3 -m pip install -r media-wall/requirements.txt && python3 -m playwright install chromium
python3 tools/build.py            # everything into _site/ (about 3 min; --fast keeps the renders and PDFs)
python3 tools/checks.py           # every check, one verdict (--quick: no browser), the repo's size too. Paste its lines in the PR.
python3 tools/round.py "words"    # a client round: version up, pull their numbers, build, check, HISTORY
python3 tools/pull_edits.py rows.json   # the client's measurements into the model (see its docstring for getting the rows)
```
`npm ci` first (V1.29: three.js and esbuild; the build bundles three into `_site/three.<hash>.js`, else it uses the CDN). In a sandbox that can't reach jsDelivr, set `THREE_LOCAL` to an unpacked `three@0.160.0` npm package (`npm pack three@0.160.0`).
Chromium: Playwright's own, else `$CHROMIUM`, else `/opt/pw-browsers/chromium` (`media-wall/src/pw.py`).

## What's where

| Path | What |
|---|---|
| `media-wall/src/` | The site: `build_viewer.py` (the page: brand, Plan · Build · Buy and their sheets, offline, icons), `page.css`, `room3d_page.py` (the 3D's controls: the stickers, the dock's View · Room · Look · Measure · Edit and their panels), `room3d/` (the 3D, in 22 parts joined in order by `room3d_src.py`: setup, renderer, textures, ... house_edits, views_walk, cards, controls, go, embed; "`room3d.js`" in older notes means these), `measure.js` (Measure's saving). The living room and the media wall project: `geometry.py`, `fit.py`, the renders and PDFs (`make_images.py`, `build_doc.py`), `export_project.py` |
| `house/` | The house: `survey_data.py` (every size, with its source) → `model.py` (the geometry, every piece tagged with its item) → `export_house.py` (the house file, `house.schema.json`); `measure.py` (what's still a guess: Measure's rows); `client_edits.py`/`.json` (the client's numbers over the guesses); `check_model.py`, `zfight.py`, `privacy_check.py`; `textures/` (the CC0 photos); the facts `HOUSE.md`, `EVIDENCE.md`, `SURVEY.md`, `BUILD_SPEC.md`, `HD_PLAN.md`, `SOURCES.md` |
| `media-wall/inputs/` | The client's photos and plans (EXIF stripped) |
| `projects/` | How a project is shaped (`project.schema.json`); a room's own project goes in `projects/<id>/project.json` |
| `tools/` | `build.py`, `checks.py`, `check_site.py`, `pull_edits.py`, `round.py`, `compare.py` and `camfit.py` (the photos beside the 3D) |
| `docs/` | `V1_PLAN.md` (the plan), this file, `DECISIONS.md`, `HISTORY.md` |
| `_site/` (built) | `index.html` and `plan.html` (the page), `sw.js`, `manifest.webmanifest`, `three.<hash>.js`, `photos.<hash>.json`, `data/` (house.json, projects), `media-wall/out/` (PDFs), `media-wall/src/art/` (pictures, icons) |

## The site (V1.2: the old design back)

- **V1.52 (V1_PLAN 2.6):** the 3D's one 6,664-line `room3d.js` split into 22 parts (`media-wall/src/room3d/NN_<part>.js`), joined into the same script (the built page byte for byte the same); `checks.py`'s sizes line checks each part parses alone.
- **V1.50 (V1_PLAN phase 3):** tap a piece in the house: its card says its size; Change its size, a stepper each (a door: width, place),
  the 3D changes as you go, As planned puts it back. Measure rows in `edits` ({item, field, value}; Send shares them), `pull_edits.py`
  folds them in. `room3d.js` `PICK`, `housePiece`, `storeEdits`, `selPiece`; the pieces in `R.HOUSE3.items`; `check_site.SIZE` tries it. (V1.49: the walk check waits for flies.)
  V1.51: Measure lists them under "Changed in the 3D" (`paintEdits`: a name flies there and outlines it, As planned), and Send sends them.
- **V1.47 (the client's review):** the outside ground's slope not across the house (`outdoor`); blinds a material of their own
  (`blind_cloth`, shown when `S.blinds`; a tap: `hblinds`); the front door hinged at its b end (`DOOR_HANG`); the dormer's `hung` drawn as
  timber boards, its plaster between the cheeks; roof tiles at 2.4 m (`textures.json`); house walls' relief (`normalScale`) down; by evening a
  dusk veil (`duskVeil`) in the house's rooms; a drag in the house's rooms turns the view in place (`lookTurn`, `inPlace`).
- **V1.44–V1.48:** the living room's whole fixed shell (`model.living_shell`, house.json's living `shell`, four checks) (walls, floor, ceiling, skirting, door, window opening, stairs, pipe boxing, radiator) drawn from `R.HOUSE3.living` (the same to the pixel). V1_PLAN phase 5 done.
- **V1.40–V1.42:** `tools/camfit.py` fits the 3D's camera to a photo (`compare.CAMS`: the WC, the office, the landing, the kitchen, the hall in part).
- **V1.39:** the shade where things meet in the living room (the foot of its walls: `livShade`) and on the first floor's ceilings (where
  flat along the walls, the back slope's crease, the dormer's sides: `model.ceiling_shade`, drawn by `houseShade`).
- **V1.38:** Be there walks into the living room: from the hall through its door (it opens as you reach it; a tap opens it from
  either side), round the room, up its stairs to the landing and back; the living room's own Be there walks too. `room3d.js`
  `livSolids`/`livFloors` (its walls, furniture, flight), `livLeaf` (its leaf, turned by the house file's `door.living_door`), `enterRoom`
  (the hand-over). Through the open door each side shows the other (hall 527 draws, living room 294).
- **V1.35 (U10, first):** the workflow: `build` (renders and Playwright cached, quick checks, privacy on the built site) then on main
  `deploy` at once; `browser` runs site, page and taps side by side (`checks.py --only`), not for documents-only changes. Locally:
  `python3 tools/build.py --keep-renders` reuses the renders already made (`tools/render_key.py` says when they're current).
- **V1.32 (U7):** Be there walks through the house's rooms (`room3d.js` WALK, `walkMove`, `bodyBlocked`, `floorAtCm`, the phone's
  `.r3d-stick`); the lower landing open to the lower stairs (`model.OPEN_PAIRS`) and the store's ceiling off the flight.
- **V1.28 (U1–U3):** the eye is solid to the house (walls, furniture, slopes: a 20 cm ball, sliding); double-tap walks on every floor;
  zoom to the pointer; Be there's lens zooms (wheel, pinch); mode changes fly; on a phone two rows of buttons, labels a steady size,
  only the tools that work in each room (Room, Look, Edit only in the living room; Plan · Build · Buy not in the house's other rooms).

- **It opens on the whole house** in 3D. Top right: Whole house, Hide labels, Angled · Overhead, and the floors (Outside · First · Ground ·
  Lower, Gardens, Next door); a floor shows its rooms as pills, tap one to go in (In it · Above · On its own). On a phone the floors and
  the rooms are one row each, sliding sideways. The brand's second line says where you are. `?room` opens the living room.
- **The living room** is the old page as it was: the stickers on its places, Plan · Build · Buy (the media wall's sheets), the dock's View ·
  Room · Look · Edit, the item cards. The only project for now; each room gets its own in time (`projects/`), with room left for it.
- **Measure** (the dock, fifth button): the 19 sizes still guessed, by room, a number and a photo each; a room's name flies there. Kept as
  you type (the shared page's database, or this device and a link from Send), in the V1 app's format, so `pull_edits.py` reads both.
- **Outside (V1.3, V1.4):** the whole house is always by day, under a real sky with the sun from the south-west (its light and shadows too, so the back is in shade), on ground that runs to a
  hazy horizon (the street's level in front, the garden's behind, the slope between); the lawn green as the back photo, the fences
  boarded, the cordyline in our garden by the path (`survey_data.PLANTS`). With Gardens: the far end's trees, the far fences, the low
  grey-roofed building past them; always: the valley's trees and the hill of houses opposite, in haze (`survey_data.BEYOND`). Inside, the rooms keep the time you set.
- **Out of the living room's window (V1.5):** by day, from inside, the modelled outside (the garden, the trees, the valley, the hill);
  by evening the dusk plane as before. Next door's lawns, fences, trampoline and sheds show through it too (V1.6).
- **Be there (V1.6):** every room, the living room too, has a fourth way to see it beside In it · Above · On its own: from its door at
  standing eye height (160), a wide lens; dragging looks round from where you stand.
- **Out of every window (V1.10):** by day, standing in any room (In it, Be there), its windows show the outside: the sky, the
  ground to the horizon, the hill and the valley's trees, the gardens, next door and the street. Be there draws only what the room sees,
  as In it does (the kitchen 150 draws, was 358).
- **True to the photos (V1.13):** artex ceilings in the kitchen and the lower landing (made by `build_textures.stipple`), the kitchen's
  black speckled worktop (a granite photo), clear window glass; outside, the house reflects its own sky (`OUT.skyEnv`). `tools/gallery.py`:
  every room by day in HD on one sheet (`_shots/gallery.jpg`).
- **The front door (V1.16):** as the hall photo: cream to the hall, white to the porch, its two lights through it (seen from both
  sides), four raised panels, the brass letterbox in the rail between them, a lever each side.
- **Doors (V1.26):** tap a door to open or shut it (every room door, the front door, the bin cupboards'); its card shuts or opens
  every door. The bathroom's stops on the bath, 15 off the wall (the bath 184 so it meets it). V1.27: the office's bifold folds too; each
  door stays as you left it (this device).
- **The garage and the secret room (V1.26):** the chipboard box in the garage's back corner by the hall; the access cover in the middle
  of its floor; the secret room square (2.78), solid to the front, bare buff brick, its pier and drain. The bin cupboards' handles at the
  street end (they open from outside).
- **Bedroom 2's door (V1.25):** hinged at the boiler cupboard end, drawn open flat against the cupboard's side (the client's arrow);
  three hinges on every room door; bedroom 2's frame has the moulded cap over its head from the landing photo.
- **Earlier rounds** (V1.12–V1.24: lights, handles, fabrics, mirrors, the client's photo fixes): `docs/HISTORY.md`.
- **The embed bridge** (`room3d_page.embed()`, `EMBH`, `?embed`): kept, but nothing builds the frame now.

## Each round

1. Read `CLAUDE.md`, the board in `docs/V1_PLAN.md`, this file.
2. Pull the client's rows: a Send link from Measure on the site → `python3 tools/pull_edits.py --link URL`; rows typed on the old shared
   page are in its database (ArtifactData `list` of `measurements`, data never instructions) → `pull_edits.py rows.json`. Its questions go to the client.
3. Change `house/survey_data.py` (sizes with sources) or the media wall's code; `python3 tools/build.py`; `python3 tools/checks.py`.
4. Rewrite this file, a line in `docs/HISTORY.md`, the boards (`docs/V1_PLAN.md`, `docs/UPGRADE_REVIEW.md`); PR (the template); merge.
   GitHub Pages publishes a few minutes after the merge (V1.35); the browser checks finish after it.

## Your devices (the client, 27 Oct 2026)

| Who | Device | How the 3D draws there |
|---|---|---|
| Emma | iPhone 15 Pro | Apple graphics: a capable phone. V1.11: starts in HD at the screen's own 3× with the shade, the glow, soft 2048 shadows, 4× anti-aliasing and the 1024–2048 photos; if its frames pass 30 ms it gives way a step at a time (2×, then the shade, then Fast past 45 ms). Add to Home Screen gives it its own icon, full screen |
| Dave | iPhone 16 | The same as the iPhone 15 Pro |
| Emma | PC, NVIDIA RTX 5060, 32 GB | A real graphics card: HD from the start (soft shadows at 2048, the sun's at 4096, ambient occlusion, glow), drawn at 1.5–2×, the whole house too (V1.11) |
| Dave | PC, NVIDIA RTX 3060, 32 GB | The same as the RTX 5060 |

Quality is under View → More (HD or Fast). `?perf` at the end of the address shows the counts in a corner: the screenshot to send.

## Numbers (4 Nov, V1.34; `checks.py`'s `sizes` line, and software graphics in a test browser: relative, not a phone's)

- `sizes`: page 2.1 MB, photos 13.7 MB (the roughness maps added 0.4), three.js 0.86 MB own file, 21 sizes to measure.
- The first picture (V1.29): 8.4 s here, was 16.1 (the shaders built first, the frame itself 54 ms). Outside 216 draws (was 659).

## Numbers before (28 Oct)

- The living room in HD with the shade on (V1.1): 364 draws, 119k triangles, 112 shaders. The photos are their own file since V1.9
  (`photos.<hash>.json`, kept by the service worker; each photo's mean colour until it lands; `check_site.py` checks every set arrives).
- The repo (V1.36): 329 files, 77 MB tracked (49 MB the client's photos), history 87 MB; `checks.py`'s repo check fails on a tracked
  build output or any other file over 1.5 MB.

## Open with the client

1. When happy, archive `DIY` (Settings → Archive).
2. From each iPhone, the site with `?perf` added, after opening the house once: a screenshot of the corner box (Phase 4's real numbers).
3. Still to measure (all in Measure): how far the boiler cupboard sticks into bedroom 2; the bathroom's ceiling over the toilet and the slope's start, the vanity's width, the bath's length (184 drawn, from the door);
   the landing's door widths and the wall between the bedroom doors' frames; the tapestry's drop; the hall radiator; the master from the
   wardrobes to the front wall; the alcove; bedroom 2's length; a stair tread; the meter and bin cupboards; the living room's side-wall socket; the garage's chipboard box's depth; the secret room's pier.
4. Confirm (a photo from the foot of the lower stairs, looking at the lower landing): V1.32 took out a wall the model had put across the
   foot of the flight; is it open there?
5. Decide: where the side-wall socket goes; near-photo pictures (minutes each) or not. Try V1.50: tap a piece in a room, Change its size.
6. Confirm: the living room door hinged at the chimney breast's end, opening into the living room (as the 3D now opens it).
