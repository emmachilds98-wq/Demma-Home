# State: what's true now

Rewritten (not appended) at the end of every PR. Under 150 lines, short lines; what happened when goes in `docs/HISTORY.md`. The rules:
`CLAUDE.md`.

**Version:** V2.72 (7 Nov 2026)

**Work from:** `docs/REAL_PLAN.md` section 7, the round after (N13–N23: the first picture, moving, the views' controls, landing,
the outside, tracking upgrades) in workstreams that run side by side, one task a PR; section 6 (N1–N12) is done but N4's and N9's
rests and the client's `?perf` (N10). Its section 5 and `docs/FINISHES_PLAN.md` section 6 are the phase boards (one line a row).
Older boards, all done or carried into those: `docs/V1_PLAN.md` (phases 0–10), `docs/QUALITY_PLAN.md`, `docs/UPGRADE_REVIEW.md`.

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
| `media-wall/src/` | The site: `build_viewer.py` (the page: brand, Plan · Build · Buy and their sheets, offline, icons), `page.css`, `room3d_page.py` (the 3D's controls: the stickers, the dock's View · Room · Look · Measure · Edit and their panels), `room3d/` (the 3D, in 24 parts joined in order by `room3d_src.py`: setup, renderer, textures, ... house_edits, views_walk, cards, controls, go, finish; "`room3d.js`" in older notes means these), `measure.js` (Measure's saving). The living room and the media wall project: `geometry.py`, `fit.py`, the renders and PDFs (`make_images.py`, `build_doc.py`), `export_project.py` |
| `house/` | The house: `survey_data.py` (every size, with its source) → `model.py` (the geometry, every piece tagged with its item) → `export_house.py` (the house file, `house.schema.json`); `measure.py` (what's still a guess: Measure's rows); `client_edits.py`/`.json` (the client's numbers over the guesses); `check_model.py`, `zfight.py`, `privacy_check.py`; `textures/` (the CC0 photos); the facts `HOUSE.md`, `EVIDENCE.md`, `SURVEY.md`, `BUILD_SPEC.md`, `HD_PLAN.md`, `SOURCES.md` |
| `media-wall/inputs/` | The client's photos and plans (EXIF stripped) |
| `projects/` | How a project is shaped (`project.schema.json`); a room's own project goes in `projects/<id>/project.json` |
| `tools/` | `build.py`, `checks.py`, `check_site.py`, `pull_edits.py`, `round.py`, `compare.py` and `camfit.py` (the photos beside the 3D) |
| `docs/` | `V1_PLAN.md` (the plan), this file, `DECISIONS.md`, `HISTORY.md` |
| `_site/` (built) | `index.html` and `plan.html` (the page), `sw.js`, `manifest.webmanifest`, `three.<hash>.js`, `photos.<hash>.json`, `data/` (house.json, projects), `media-wall/out/` (PDFs), `media-wall/src/art/` (pictures, icons) |

## The site now

- **Landing (V2.69, N19):** a cream first screen (the house's outline, a thin line filling; no words, no black) until the first
  picture (`r3d-first`; till every start fires it, the start's words put away), then `demma-landed`; `build_viewer.LANDING_JS`.
  The version is in Plan, beside the hello (`.hello .ver`), not the brand.
- **The 3D is the site** (the old design, V1.2): the whole house opens first, a welcome card over it once on a device (V2.69: "Welcome
  home", three icons of two words, Walk in · Look round; the name top left brings it back; automated browsers skip it and the first
  screen, unless `?welcome` / `?landing`). Pills float over it: the brand, Plan · Build · Buy, Whole house, Hide labels,
  Angled · Overhead, the floors (Outside · First · Ground · Lower, Gardens, Next door), a floor's rooms (one row on a computer), Hide
  buttons; the house framed clear of them (`measureShift`; a phone stands back by the free share, `freeFrame`); the dock below
  (View · Look · Measure; in the living room also Room and Edit); the figure bottom right drops you in where you let go.
- **Rooms:** picking one stands you in it (`goRoom`); its views Be there · In it · Above · On its own. Walk: W A S D, arrows turn,
  the wheel walks (Ctrl + wheel the lens), a double-click or double-tap walks you to a spot, Mouse look (M) on a computer. The eye is
  solid to walls and furniture; doors open with a tap and stay as left (this device). `?room` opens the living room.
- **Over the house (V2.72, N18, `19_view_controls.js`):** Overhead is a map: one finger or a left-drag moves it (the ground stays under
  the finger), two fingers pinch and twist, a right-drag turns; Angled orbits 10°–85° above the ground. The point looked at stays
  round the house (wider with Gardens or Next door). Keys, held and smooth: arrows or W A S D move, Q E turn, + − (R F) zoom, Shift
  hurries; a double-tap or double-click on a room stands you in it, on the ground centres there.
- **Moving:** the glide after a drag eases the same each 60th of a second at any frame rate (`DAMP`, V2.60); a walk key held over
  half a second eases up to half as quick again (1.4 to 2.1 m/s, `WALK.pace`); Shift still hurries.
- **The living room** is the media wall project: stickers, Plan · Build · Buy and their sheets, Room, Look, Edit, the item cards.
- **Change the house:** tap a wall, ceiling or floor for its colours card (`23_finish.js`: paints, floors, bulbs and fittings, lighter
  and darker, a colour from a photo, This wall · This room · Whole floor); a window's or door's card colours its outside. Look saves
  and switches named schemes. The living room is on the same rows (V2.51, N5a): its walls, ceiling and skirting open the same card;
  its colours stay in its own Look (`S.paint`, `S.walls`, `S.ceil`, `S.skirt`) and read as the row `living` (0–3 walls, 4 ceiling,
  11–16 its six walls by name, 17 skirting and door), so schemes, Undo, Copy, Paste, Send and the litres carry it. Tap a piece: its size, Move or resize, Turn, Swap it (‹ › through its kind), Take it out (any room, R6).
  A room's floor card has The rug (V2.57, N5b: row [18], laid by `finRugApply` at a standard size; the living room's is its `S.decor.rug`).
  A wall's card has The curtains (V2.59, N5c: row [19], `finCurtApply` at the room's windows from `R.HOUSE3.windows_in`;
  the living room's is its `S.decor.curtains`).
  A bed's duvet and pillows take The bedding (V2.61, N5d: row [20], palette slot 5; their room found in the house's frame,
  `FIN.inv`, so the master's lifting lid keeps it).
  A wall's card has A picture (V2.63, N5e: rows [21] the print, [22] the wall, `finPicApply`; a 52 × 72 RIBBA frame, 150 cm up).
  The floor's card has A plant too (V2.62: row [23], `08_house_catalogue.js` `syncPlants`: one of the catalogue's four, stood in the
  free corner farthest from the doors, clear of the furniture and the doors' swing; a piece like an added one: tap it to move it,
  Another plant, Take it out; the living room keeps its own plants). Look's rows: [18] rug, [19] curtains, [20] bedding, [21]–[22] the Look thread's (a picture),
  [23] plant.
  Tap a floor: Add a piece here (25 pieces in 8 kinds, `08_house_catalogue.js`, built from the house's own boxes so the walk and taps
  follow; a card warns when it's in the way of another). Swaps and adds are Measure's edits rows: Send carries them, `pull_edits.py` asks.
- **Track the upgrades (V2.66, N23):** a room's colours, floor or piece card has Changes (n): the room's card of what's changed
  (Look's rows and Edit's pieces), each a tap to tick done (this device, `dh-done`; a new choice starts unticked), a rough cost each
  (`16_cards.js` `UPC`, E: UK prices, Nov 2026; a floor by the room's m²; moves and take-outs £0). Plan's home has The house's changes:
  the total, how many done, a row a room (tap: stand in it, its card open).
- **Measure** (dock): the sizes still guessed, by room; the colours' m² and litres; Send makes a link of every change
  (`pull_edits.py --link`).
- **Shapes (V2.53, N6):** the master's wardrobes are PAX frames (plinth set back, an oval rail) with garments on hangers, the
  fridge-freezer has its two doors, grip strip and dispenser (the photos), the Kallax its thin shelves, DRÖNA boxes and records, the
  chair-bed its tube frame and leaning back. Cloth profiles get soft edges (`20_go.js` `PSOFT`); no microwave is in the photos.
- **Opening (V2.70, N13):** the shade's and glow's shaders built in the warm-up (`postWarm`), textures sent while it waits (`texWarm`), shadows
  a frame ahead (`preDraw`): the first picture builds 2 shaders (was 16), sends ~20 textures (was 220); then `r3d-first` fires.
- **Drawn inside (V2.71, N16):** the room you stand in, the rooms seen from it, the shell; the outside if one has a window (`roomCull`).
- **Quality:** a real graphics card opens in HD and never steps down (V2.25); iPhones start in HD at 2× and step down only if slow, always through the composer (the shade off never rebuilds a shader; a slow one leaves it out while you drag; the house's materials always carry 6 cutting planes, `houseClip`, so a floor's or a room's cut builds no shaders; the start and the rooms' warm-up (`warmSwitch`) compile by cutting planes, in parallel, `compileClipped`, V2.64); View →
  More has HD or Fast. In HD each room is lit by its ceiling light and its windows' daylight, with soft shadows and ambient occlusion; by evening the
  lamps the client has light theirs too (the office's purple lamp, the bathroom mirror's bar; V2.48), the kitchen from its two LED battens. Every standing piece
  has a soft shade round its foot and up the wall beside it, on phones too (V2.52; it moves with the piece).
  The window frames, outside doors, gutters and sills have uPVC's faint peel; the skirting, inside doors, newel and rail gloss paint's
  brush strokes; the steel a brushed grain, each in its own colour; the dormer's cheeks lapped dark timber boards (V2.56).
- **Outside:** by day under a real sky, the lawn's photo to a hazy horizon, the gardens, next door, the valley and the hill. Every
  lawn (the gardens', next door's, the ground's) is one patchwork shader, `03_materials` `grassy`: the photo or its larger turned copy
  over metres, lighter and darker slower still, so no grid shows (V2.68).
- **Offline:** `sw.js` keeps the page's last copy and every picture; a file named by its contents (the photos, `three.<hash>.js`)
  stays in `demma-keep` across versions, so a new round doesn't fetch it again (V2.47).
  The photos are a file each (`_site/tex/<key>_<map|nor|rough>.<hash>.jpg`, `build_viewer.split_photos`; the page keeps their names):
  what's on screen is fetched first, the rest a moment later; a photo two textures share is fetched once (`decodeImg`) (V2.49); each goes onto the graphics chip in turn, `upStep`: 6 ms of a still frame once you've been still 0.2 s, none while you move (on a walk over 3 s, one a second if it's on screen), the shadows once at the end (V2.64, V2.67).
  The living room's oak, hessian and two carpets are colour-matched at build (`export3d.TINT`; the carpets as `tmap`, beside the house's own `map`), not on the page (V2.67).
- **Built for Pages:** the page's 3D script and its CSS go through esbuild as the site is built (`vendor.minify`; the source keeps its
  notes): the 3D's code 667 to 359 KB, the page 2.3 to 2.0 MB (V2.50).
- **Sheets:** a shut Plan, Build, Buy or Ideas sheet is `content-visibility: hidden` (`.sheet.shut`, `page_router.openSheet`): not laid
  out or painted, its pictures not fetched until it opens (about 450 KB less on opening) (V2.54).
- **Phones without a strong chip** (`LOWD`) take `tex/*_half.<hash>.jpg`, the photos at half size (`split_photos`): 2.3 MB on a first
  visit, not 10.2; the iPhones (Apple GPU) and the PCs keep the full set (V2.58).
- **Checks:** `tools/check_site.py` walks every door, taps pieces and surfaces, tries phones by touch (iPhone 15 Pro, SE, Pixel 7,
  Galaxy S24, iPad Mini) and the computers' widths.

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
| Emma | iPhone 15 Pro | Apple graphics: a capable phone. V2.64: starts in HD at 2× (was 3×) with the shade, the glow, soft 2048 shadows, 4× anti-aliasing and the 1024–2048 photos; if its frames pass 30 ms it gives way a step at a time (the shade, then Fast past 45 ms). Add to Home Screen gives it its own icon, full screen |
| Dave | iPhone 16 | The same as the iPhone 15 Pro |
| Emma | PC, NVIDIA RTX 5070, 32 GB (the main way in) | A real graphics card: HD on every visit, never stepped down (V2.25) (soft shadows at 2048, the sun's at 4096, ambient occlusion, glow), drawn at 1.5–2×, the whole house too (V1.11) |
| Dave | PC, NVIDIA RTX 3060, 32 GB | The same as the RTX 5070 |

Quality is under View → More (HD or Fast). `?perf` at the end of the address shows the counts in a corner: the screenshot to send.

## Numbers (5 Nov, V2.25; software graphics in a test browser: relative, not a real card's)

- `sizes`: page 2.0 MB (V2.50), photos 9.7 MB in 58 files, 2.9 MB at half size (V2.49, V2.58; WebP tried: bigger at the same quality), three.js 0.86 MB own file, 24 sizes to measure.
- Draws in HD: the house 350 (187k triangles), the living room 447 (18 lights lit, 120 shaders), the landing 409, the hall 312, bedroom 2 173,
  the kitchen 188. Still: 0–1 frames a second (drawn only on change; spare moments build the hidden pieces' shaders ahead).
- The repo: 351 files, 59 MB tracked (32 MB the client's photos), history 83 MB; `checks.py`'s repo check fails on a tracked build output
  or any other file over 1.5 MB.

## Open with the client

1. When happy, archive `DIY` (Settings → Archive).
1. Measure (V2.24): is the living room's flight itself 85 wide like the stairwell over it (drawn 59, which leaves the living room's door its 83)? And the bathroom door's width: the short wall beside it is 18 now (the banister's end post takes 8).
2. From each iPhone and PC, the site with `?perf` added, after opening the house once: a screenshot of the corner box (Phase 4's real numbers).
3. Still to measure (all in Measure): how far the boiler cupboard sticks into bedroom 2; the bathroom's ceiling over the toilet and the slope's start, the vanity's width, the bath's length (184 drawn, from the door);
   the landing's door widths and the wall between the bedroom doors' frames; the tapestry's drop; the hall radiator; the master from the
   wardrobes to the front wall; the alcove; bedroom 2's length; a stair tread; the meter and bin cupboards; the living room's side-wall socket; the garage's chipboard box's depth; the secret room's pier.
4. Confirm: the foot of the lower flight open to the lower landing (V1.32); the bathroom cord's length (Measure). Decide: where the side-wall socket goes; near-photo pictures (minutes each) or not. Try V1.50: tap a piece in a room, Change its size.
6. Confirm: the living room door hinged at the chimney breast's end, opening into the living room (as the 3D now opens it).
