# State: what's true now

Rewritten (not appended) at the end of every PR. Under 150 lines, short lines; what happened when goes in `docs/HISTORY.md`. The rules:
`CLAUDE.md`.

**Version:** V3.33 (9 Nov 2026), live. A new team since 8 Nov: start with `docs/HANDOVER.md` (then `docs/NOTES.md`).
The version shows faintly by "Demma's Home" top left (V3.16; not on an iPhone SE, too narrow) and in Plan as a refresh button ("V3.33 ↻"): on the home-screen app, tap it to get the newest.

**Work from:** `docs/REAL_PLAN.md` section 13 (8 Nov, the new team: N46–N51 side by side, N46 done V3.04, N48 V3.05, N50 V3.06, N52 V3.07; section 13's N53 V3.08, N54 V3.09, N49 V3.10, N51 V3.11, N47 V3.12, N55 V3.13; section 14: N56 V3.14, N59 V3.15, N60 V3.16, N61 and N62 V3.17, N57 V3.18, N63 V3.19 (one light for the house), N58 V3.20, N64 V3.21 (the breast and window corner, a shorter Room menu); section 15 (9 Nov, the PC as fluid as the phone, the panels cleaned up): N67 V3.22, N65 V3.23 (no freeze stepping into a room), N68 V3.25 (the room cards), N66 V3.26 (the wheel eased), N69 V3.27 (the PC's framing), N70 V3.28 (moving on a PC as a person), N71 V3.29 (the last stepped moves glide; ?perf names the chip); section 16 (9 Nov, every room as good as the living room): N80 V3.30 (the rooms' light), N82 V3.32 (the rooms' surfaces), N85 V3.33 (the front rooms' sun); N31 KTX2 on Emma's yes, #133). Section 9: every earlier task's state.
On a weak signal the page opens from the device after 2 s (V3.00, N43, `sw.js`): the new copy is saved for next time, and the version button shows it. The speed budget (N26, `tools/perf_budget.json`) is in the checks: a round over it fails. Section 5 and `docs/FINISHES_PLAN.md` section 6 are the phase boards.

## Where it lives
- **The site on GitHub Pages:** https://emmachilds98-wq.github.io/Demma-Home/ (built and published by the workflow on every push to
  `main`, a few minutes after the merge since V1.35; Pages' source is GitHub Actions). `plan.html` is a tiny step to it (old links, their view kept, V2.80).
- **No shared page any more** (4 Nov 2026): the claude.ai copy (V1.27) isn't republished; its database's Measure rows are still read by
  `pull_edits.py`. On Pages, Measure keeps rows on the device and Send makes a link (`pull_edits.py --link`). The old repo `DIY` (rounds 1–82): read-only.

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
| `tools/` | `build.py`, `checks.py`, `check_site.py`, `pull_edits.py`, `round.py`, `compare.py` and `camfit.py` (the photos beside the 3D; the bathroom and the master fitted, V2.90; the kitchen and the hall (two of the hall) with the photo's own lens, `TRUE_FOV`, V3.03; the office, the landing and the WC, V3.10) |
| `docs/` | `HANDOVER.md` (start here), `NOTES.md` (what the threads learned), `REAL_PLAN.md` (the plan), this file, `DECISIONS.md`, `HISTORY.md`, `reviews/` (the V2.44 review and audit) |
| `_site/` (built) | `index.html` (the page), `sheets.<hash>.json` (its sheets), `plan.html` (a step to it), `sw.js`, `version.txt`, `manifest.webmanifest`, `three.<hash>.js`, `photos.<hash>.json`, `data/` (house.json, projects), `media-wall/out/` (PDFs), `media-wall/src/art/` (pictures, icons) |

## The site now
- **Landing (V2.69, N19):** a cream first screen (the house's outline, a thin line filling; no words, no black) until the first
  picture (`r3d-first`; till every start fires it, the start's words put away), then `demma-landed`; `build_viewer.LANDING_JS`.
  The version is in Plan, beside the hello (`.hello .ver`), not the brand.
- **The 3D is the site** (the old design, V1.2): the whole house opens first, a welcome card over it once on a device (V2.69: "Welcome
  home", three icons of two words, Walk in · Look round; the name top left brings it back; automated browsers skip it and the first
  screen, unless `?welcome` / `?landing`). Pills float over it: the brand, Plan · Build · Buy; under them two rows at most
  (V2.76, N20, `.r3d-mini` by `order`): Angled · Overhead (or a room's four ways), the floors (Outside · First · Ground · Lower,
  Gardens, Next door) sliding sideways, Whole house, one Hide button (`setBare`: labels, then buttons; Show brings both back); then a
  floor's rooms, sliding too; the house framed clear of them (`measureShift`; a phone stands back by the free share, `freeFrame`); the dock below
  (View · Look · Measure; in the living room also Room and Edit); the figure bottom right drops you in where you let go.
- **Rooms:** picking one stands you in it (`goRoom`); its views Be there · In it · Above · On its own. Walk: W A S D, arrows turn,
  the wheel walks (Ctrl + wheel the lens), a double-click or double-tap walks you to a spot, Mouse look (M) on a computer. The eye is
  solid to walls and furniture; doors open with a tap and stay as left (this device). A shut door opens as you walk up to it, but the bin cupboards' (V2.99, V3.17 N61: both open they lie across the porch as a second front door; they start shut, aren't remembered, open one at a time). The hall opens facing the doorway down, the stairs and the lower landing in view (V3.17 N62). `?room` opens the living room.
  Back (the phone's swipe, the browser's) from a room brings you out to the house, one step whatever rooms you went through (V2.96, N39, `roomHist`).
- **Over the house and a room's Above (V3.08 N53, V3.13 N55, `19_view_controls.js`):** Outside, Angled, Overhead and each room's Above (the living room's too) move as a map, on a phone and a PC alike: one
  finger or a left-drag moves the ground (the spot touched stays under the finger; a flick glides on); two fingers pinch to zoom and
  twist to turn round the spot between them, and in Angled slide up or down together to tilt; the wheel zooms to the pointer; a
  right-drag (or Shift + drag) turns and tilts round the middle. Angled 10°–85° above the ground; Overhead stays flat. The point looked
  at stays round the house (wider with Gardens or Next door). Keys, held and smooth: arrows or W A S D move, Q E turn, + − (R F) zoom,
  Shift hurries; a double-tap or double-click on a room stands you in it, on the ground centres there. The orbit's own drags are off there.
- **The rooms' light (V3.30, N80):** by day in HD a room with windows is lit from them (60 each, the living room's 70) and its ceiling light (3), the even fill 1.4 (2.6 in a room without windows, in Fast, outside); a change of a light keeps a room's sun, ceiling and window lights (`placeRoomLights`, `applyLight`).
- **The rooms' surfaces (V3.32, N82):** a screen that's off is dark glass (`finishEnv` 0.18); the garments (`cloth0`–`6`) take the knit's relief in their own colours (`houseTex`); the basin's porcelain is `sanitary` in `model.MATS` (`porcelain` is the floor upgrade).
- **The rooms in HD (V3.33, N85):** a room whose biggest window is at the front takes the outside's sun (`dayLight`'s direction) in place of the living room's from the back (its back wall stopped that): the master bedroom and the office get a sun patch.
- **One light (V3.19, N63):** every room and the living room share one exposure a time of day (0.4 by day, 0.58 by evening; the
  outside 0.32), the fill's tint and the bulbs' colour (Warmth); Fast's living room and whole house as bright as HD's. `applyLight`.
- **The stick on a phone, every view (V3.15, N59):** bottom left wherever you are (not in Edit, the welcome, a tour or an open panel). Walking it walks;
  over the house, a floor and a room's Above it moves the map as far as it's pushed (`19_view_controls.js` `mapKeys`, a thumb on it and a finger on
  the map together); in a view from your eyes (a room's In it, From the sofa ...) it stands you there and walks on (`eyeView`, `startWalk`), as W
  does on a PC; in On its own, Bird's eye and Dolls' house it glides (`freeMode`). On a PC the held keys glide smoothly there too (they stepped a repeat at a time).
- **Moving:** the glide after a drag eases the same each 60th of a second at any frame rate (`DAMP`, V2.60); a walk key held over
  half a second eases up to half as quick again (1.4 to 2.1 m/s, `WALK.pace`); Shift still hurries.
- **The living room** is the media wall project: stickers, Plan · Build · Buy and their sheets, Room, Look, Edit, the item cards.
- **Plan · Build · Buy (V3.22, N67):** on a PC one centred column, 1200 at most, the room dimmed round it (a click beside it closes it,
  `.scrim`); full width on a phone. Buy: By piece (two to a row on a phone), the shopping list folded, Already owned folded.
- **The breast and the window corner (V3.21, N64, the client's decision):** the plant stand on the chimney breast (the frames up 30 over
  it); left of the window, the vinyl stand centred (x 391.5) with the "now playing" ledge and the glass case over it (`geometry.PLANT_LAYOUT`
  "breast", `ideas.CASE_CORNER`; in the 3D the case and the ledge are the breast's groups turned round, `06` `placeCorner`). The alcove
  shelves left the plan (an option, in the case's place); the drinks cabinet under the case (an option) puts the old layout back while on.
  View: Left of the window (`corner`). Room: Set it for (the set-ups, one sliding row), the table, the drawers and the record table's lid
  side by side, More, Options and ideas, then Save my plan and Try options on one row; the plant stand's choice is gone.
- **Change the house:** tap a wall, ceiling or floor for its colours card (`23_finish.js`: paints, floors, bulbs and fittings, lighter
  and darker, a colour from a photo, This wall · This room · Whole floor); a window's or door's card colours its outside. Look saves
  and switches named schemes. The living room is on the same rows (V2.51, N5a): its walls, ceiling and skirting open the same card;
  its colours stay in its own Look (`S.paint`, `S.walls`, `S.ceil`, `S.skirt`) and read as the row `living` (0–3 walls, 4 ceiling,
  11–16 its six walls by name, 17 skirting and door), so schemes, Undo, Copy, Paste, Send and the litres carry it. Tap a piece: its size, Move or resize, Turn, Swap it (‹ › through its kind), Take it out (any room, R6).
  A room's floor card has The rug (V2.57, N5b: row [18], laid by `finRugApply` at a standard size; the living room's is its `S.decor.rug`).
  A wall's card has The curtains (V2.59, N5c: row [19], `finCurtApply` at the room's windows from `R.HOUSE3.windows_in`;
  the living room's is its `S.decor.curtains`).
  The floor's card has three upgrades to try (V3.14, N56): Herringbone oak, Grey oak LVT, Stone porcelain, each a real product's size
  (`fit.SOURCES upfloors`), made by `build_textures.py --floors` / `tiles`, a cost a m² in Changes.
  A wall's card has Panelling (V3.18, N57, rows [26]–[27]): Shaker strips to 120 in the wall's colour, or oak slats on felt to the ceiling,
  round doors and windows (`finPanelApply`, `fit.SOURCES panels`); packs and cost on the card and in Changes.
  A bed's duvet and pillows take The bedding (V2.61, N5d: row [20], palette slot 5; their room found in the house's frame,
  `FIN.inv`, so the master's lifting lid keeps it).
  A wall's card has A picture (V2.63, N5e: rows [21] the print, [22] the wall, `finPicApply`; a 52 × 72 RIBBA frame, 150 cm up).
  The floor's card has A plant too (V2.62: row [23], `08_house_catalogue.js` `syncPlants`: one of the catalogue's four, stood in the
  free corner farthest from the doors, clear of the furniture and the doors' swing; a piece like an added one: tap it to move it,
  Another plant, Take it out; the living room keeps its own plants). Look's rows: [18] rug, [19] curtains, [20] bedding, [21]–[22] the Look thread's (a picture),
  [23] plant, [24]–[25] wallpaper, [26]–[27] panelling.
  Wallpaper (V2.77, N29, `finPaperApply`): three drawn to real rolls (`fit.SOURCES wallpaper`) on the wall's own face, round its doors
  and windows, up to its ceiling or slope; rolls and cost on the card and in Measure. A maker's paint shows Its maker pairs it with
  (`FIN_PAIRS`, `fit.SOURCES pairings`).
  Tap a floor: Add a piece here (31 pieces in 9 kinds, a sofa, dressing table and TV bench since V3.20, `08_house_catalogue.js`, each a real product's size and shape, its `ref` a `fit.SOURCES`
  row: V3.02, N45; `checks.py` sizes checks each cites one, `gallery.py --catalogue` shoots them), built from the house's own boxes so the walk and taps
  follow; a card warns when it's in the way of another). Swaps and adds are Measure's edits rows: Send carries them, `pull_edits.py` asks.
- **Track the upgrades (V2.66, N23):** a room's colours, floor or piece card has Changes (n): the room's card of what's changed
  (Look's rows and Edit's pieces), each a tap to tick done (this device, `dh-done`; a new choice starts unticked), a rough cost each
  (`16_cards.js` `UPC`, E: UK prices, Nov 2026; a floor by the room's m²; moves and take-outs £0; bedding, a picture, each plant its own,
  wallpaper its rolls as counted plus paste up to a decorator's day, V3.01, N40). Plan's home has The house's changes:
  the total, how many done, a row a room (tap: stand in it, its card open); Measure shows the same total (`upsAll`).
- **Measure** (dock): the sizes still guessed, by room; the colours' m² and litres; Send makes a link of every change
  (`pull_edits.py --link`) and this device's speed (V3.06, N50: `R3D.perf()`'s chip family, quality, a frame moving and still, draws,
  shaders, the view; no place or name), sent even with nothing typed; `pull_edits.py` prints it as a `speed` line beside `tools/perf_budget.json`.
- **Shapes (V2.53, N6):** the master's wardrobes are PAX frames (plinth set back, an oval rail) with garments on hangers, the
  fridge-freezer has its two doors, grip strip and dispenser (the photos), the Kallax its thin shelves, DRÖNA boxes and records, the
  chair-bed its tube frame and leaning back. Cloth profiles get soft edges (`20_go.js` `PSOFT`); no microwave is in the photos.
  The master's duvet is lofty with slow folds, turned down, its sides and foot hanging in ripples; the pillows plump (V2.91, N36; the catalogue's bed too).
- **Opening (V2.70, N13):** the shade's and glow's shaders built in the warm-up (`postWarm`), textures sent while it waits (`texWarm`), shadows
  a frame ahead (`preDraw`): the first picture builds 2 shaders (was 16), sends ~20 textures (was 220); then `r3d-first` fires. V2.72 (N14):
  only what the landing shows is built first (45 shaders, not 101; the living room put away first), the rest after the picture (`warmRest`).
- **Walking on a phone (V2.73, N17):** a slow phone walks as it drags, without the shade and the glow (no new buffers); still past
  24 ms a frame, it draws at 1.5× from the next pause, once a visit.
- **Room to room (V2.87, N35):** walking, a room 1.5 m or less away has its shaders asked for in parallel (`14_views_walk` `warmNear` →
  `warmRoom`, the idle `warmSwitch` too), the shadows' with stand-ins (`01_renderer` `depthMat`); a group's planes set by a speck (`prime`).
  An emulated iPhone's walk (hall, living room, landing, lower floor): 36 shaders built on the frame that drew them, now 1.
- **No freeze on a PC (V3.23, N65):** where the browser builds shaders in parallel (`PARALLEL()`), the idle warm-up asks for each room's
  (from the house too, `warmTo`) and then the hidden parts a dozen at a time (`01` `precompileBatch`) beside the page; a room picked before
  its shaders are ready is built first and shown when done ("Opening ..." after 250 ms; `14` `readyThen`, `09` `goRoom`). Elsewhere, as before.
- **Moving on a PC (V3.28, N70):** a mouse's look round gathers its moves and lets them out frame by frame (`lookPend`, `lookTick`, a
  35 ms ease; a finger stays 1:1); ← → turns ease (`WALK.tv`); the stick shows on a computer too (`syncStick`).
  V3.29 (N71): in a room a turn key stands you there and turns smoothly (it went 10° a key repeat until you'd walked); the
  on-screen arrows held walk every frame. `?perf` shows the chip, the sharpness and the worst stall while moving (the last 3 s).
- **The stair curtain opens (V3.31, N72):** tap the curtain round the stairs' foot (an option: Room's suggestions) for Open it /
  Draw it across; walking up to it draws it back. Each panel gathers to its end (`07` `WORK.scurt`, `S.scopen`); drawn across, its two
  panels are thin solids for the walk (`14` `livSolids`), no longer one box round both that closed the foot open or shut.
- **The PC's framing (V3.27, N69):** the whole house centred between the rows and the dock (`measureShift`, 12 % lower on a computer) and
  1.25 × further back (`setView`), the roof clear; a panel as tall as it needs (`top:16px`, at most the screen less 200 px); the View panel
  leaves out the house's rooms and the find box in the house's views (`HOUSE_ROOMS`, `.r3d-lviews`, `.r3d-findgrp`).
- **The wheel eased (V3.26, N66):** each notch glides over about a fifth of a second, the same total (the orbit, the map, a walk;
  `19` at the end, synthetic wheel events to the canvas). Ctrl + wheel (a trackpad's pinch) and sideways scrolls come as they are.
- **From the house in (V3.09, N54):** looking at the whole house, each pause warms the living room and each floor off screen too
  (`14_views_walk` `warmHouse`, `warmAt`), and the living room's reflections (`12` `roomEnv`) put the cut aside instead of switching
  cutting off (their own shaders). A PC (RTX path) going house → floors → living room → rooms: 88 shaders built on the spot, now 2;
  the living room from the house 58 to 0 (on Windows each is a driver compile: seconds). `check_site` counts it on both HD paths (`shaders_spot`).
- **Fewer shaders, lighter shapes (V2.79, N27):** the living room's two-sided panels (`buildGroup`'s polys, the brick) are one-sided
  with both faces in the shape (`03_materials` `twoFaced`), so they use the boxes' shaders, one draw each; the house's small roundings
  are one bevel under 0.8 cm (`bevelBox`), two steps under 2 cm (`houseBox`): 123 shaders to 112, the house 246k triangles to 167k.
- **The stairs (V2.94, the client's screenshots of 8 Nov):** both flights 85 wide (x 382–467), the living room's under the landing's
  banister with no hole beside it; the living room's door 67 (x 305.5–372.5) between the breast and the stairs' low wall, the hall's
  stair box and the door down moved with them. Over the lower flight the living room's flight's plastered underside (`model.stair_soffit`):
  from the hall you see down the stairs, not into the living room's space and its brick; the lower flight runs between walls.
- **The kitchen and the hall as their photos (V3.03, N44):** the door down 66 inside its frame by the box's corner (was the box's whole end);
  the mirror and the bench along the party wall from near the box to the rack (were by the front door); a radiator under the kitchen's bar,
  the boiler 28 out of the back corner; the kitchen's door frame empty (no leaf in any photo). The door down, the bench and the radiator are in Measure.
- **The office, the landing and the WC as their photos (V3.10, N49):** each camera solved by hand from the photo's corners with its own lens.
  The WC window 63 wide (was 50); the WC basin and tiles halfway along the wall (were at the door), the roll holder in the back corner, the
  riser right of the window, a slimmer shade further in; the landing's light over the banister and its hatch nearer the office; the
  office's light toward the window. The WC window's width and the basin's place are in Measure.
- **Drawn inside (V2.71, N16):** the room you stand in, the rooms seen from it, the shell; the outside if one has a window (`roomCull`);
  V2.98 (N37): a room's light, a bed's or a wardrobe's moving part and a door seen from neither side left out with their room.
- **Fewer draws for the house (V2.98, N37):** a floor's boxes, profiles and turned shapes of one material are one draw (`20_go.js`
  `HBUILD`'s `acc`); from outside, a material's pieces on every floor shown are one draw (`joinBuild`, switched by `09` `houseJoin`,
  dropped when a floor is built again); a setting changed from outside keeps the living room put away (`applyState` → `livShow`).
  The house as it opens: 287 draws to 188 (phone, PC), 288 to 189 (iPhone), 569 to 371 (RTX, HD); after a setting 377 to 188. Same triangles.
- **The shade from the picture's depth (V3.04, N46):** HD's ambient occlusion (GTAO) reads the composer's own depth (a `DepthTexture`
  on each of its two targets; normals worked out from it), not a second draw of the scene for normals: HD's draws about halved (the house
  365 to 190 on an RTX, 365 to 190 on an iPhone with the shade; the living room 749 to 387, 504 to 264), 126 fewer shaders; the cutaway
  cuts it as drawn, and the old pass's black patches at the floor's cut edges are gone.
- **Fewer draws for the living room (V3.12, N47):** its fixed parts one draw a material (`04_living_shell.js` `bucket`: walls, ceiling,
  pole; the stairs' treads, the door leaf, the curtains, the rug's sides; `05` the cabinet's carcasses, chairs, table halves, buttons).
  A frame standing in it 246 to 235 (phone), 260 to 249 (iPhone), 387 to 373 (RTX); from above 444 to 376; at the table for six 275 to 167.
- **Quality:** a real graphics card opens in HD and never steps down (V2.25); iPhones start in HD at 2× and step down only if slow, always through the composer (the shade off never rebuilds a shader; a slow one leaves it out while you drag; the house's materials always carry 6 cutting planes, `houseClip`, so a floor's or a room's cut builds no shaders; the start and the rooms' warm-up (`warmSwitch`) compile by cutting planes, in parallel, `compileClipped`, V2.64); View →
  More has HD or Fast. In HD each room is lit by its ceiling light and its windows' daylight, with soft shadows and ambient occlusion; by evening the
  lamps the client has light theirs too (the office's purple lamp, the bathroom mirror's bar; V2.48), the kitchen from its two LED battens. Every standing piece
  has a soft shade round its foot and up the wall beside it, on phones too (V2.52; it moves with the piece).
  The window frames, outside doors, gutters and sills have uPVC's faint peel; the skirting, inside doors, newel and rail gloss paint's
  brush strokes; the steel a brushed grain, each in its own colour; the dormer's cheeks lapped dark timber boards (V2.56).
- **Outside:** by day under a real sky, the lawn's photo to a hazy horizon, the gardens, next door, the valley and the hill. Every
  lawn (the gardens', next door's, the ground's) is one patchwork shader, `03_materials` `grassy`: the photo or its larger turned copy
  over metres, lighter and darker slower still, so no grid shows (V2.68). The back garden as its photos (V2.89, N30,
  `survey_data.BACK_GARDEN`, drawn in `04_living_shell.js` `garden3d`): looking out, the west border with the cordyline and a
  red-tipped shrub, the path from a pad by the back door, a muscari strip, the lawn to the trees at 17 m, leaf litter beyond, the east bed. Four ideas to look at, in the plan only (V2.93, `GARDEN_IDEAS`).
- **Offline:** `sw.js` keeps the page's last copy and every picture; a file named by its contents (the photos, `three.<hash>.js`)
  stays in `demma-keep` across versions, so a new round doesn't fetch it again (V2.47).
  **Get the latest:** the version in Plan (`.hello .ver`, "V2.87 ↻") is a button, for the home-screen app that has no reload: it reads
  `version.txt` past every cache; same version, a toast says so; newer, it updates `sw.js`, clears every cache but `demma-keep`, reloads (V2.83).
  The photos are a file each (`_site/tex/<key>_<map|nor|rough>.<hash>.jpg`, `build_viewer.split_photos`; the page keeps their names):
  what's on screen is fetched first, the rest a moment later; a photo two textures share is fetched once (`decodeImg`) (V2.49); each goes onto the graphics chip in turn, `upStep`: 6 ms of a still frame once you've been still 0.2 s, none while you move (on a walk over 3 s, one a second if it's on screen), the shadows once at the end (V2.64, V2.67).
  The living room's oak, hessian and two carpets are colour-matched at build (`export3d.TINT`; the carpets as `tmap`, beside the house's own `map`), not on the page (V2.67).
- **Built for Pages:** the page's 3D script and its CSS go through esbuild as the site is built (`vendor.minify`; the source keeps its
  notes): the 3D's code 667 to 359 KB, the page 2.3 to 2.0 MB (V2.50), 1.0 MB with the sheets out (V2.80).
- **A light start (V2.80, N25):** the icon font only the symbols drawn (`icon_names`, a name a script swaps in goes in `ICONS_SET`;
  1.29 MB to 25 KB); the sheets' markup and scripts in `sheets.<hash>.json` (`pack_sheets`), fetched when idle, built on first need
  (`SHEETS_JS`; `DemmaSheets.load()` for the checks): 1,565 elements at the start, was 14,695; suggestions and ideas built when first shown (`lazyVis`).
  The fonts' stylesheets don't hold up the first screen (`media="print"` till they land): the 3D's start about 0.25 s sooner (V2.92).
- **Lighter photos (V2.82, N32):** none finer than a 4K screen shows at the nearest a view comes (`build_textures.PX`, `--slim`): the
  carpets, the blanket's, the sofa-bed's and the duvet's weave at 512; a key whose picture another has says `like` (`export3d` `pic`).
- **Phone and PC look-over (V2.88, N33):** on a touch screen every tap is 44 px (`room3d_page.CSS`, `pointer: coarse`); the small
  pills keep their look (a clear border round each). A card open on a phone or tablet puts the stick and the figure away. The brand and
  Plan · Build · Buy are one height. Shorter captions in Measure, View and Room; the paint swatch says Your pale mint.
- **Phone and PC look-over 2 (V3.11, N51):** the Changes card's rows, the catalogue's kinds and Look's chips 44 px on a touch screen
  (`.r3d-finsc`: a clear border the extra, the outline drawn inside), Plan's room rows too; a toast lets taps through and on a phone
  sits up top while a card or panel is open; a tablet (600–899) has the PC's dock pill; Details ▾ on one line; a card's ring inside it.
- **Keys on a PC (V2.97, N42):** every control has a name (an icon's word isn't one); one focus ring (`page.css`); Tab goes the top
  row, the 3D, the dock; Esc shuts the top layer only (`19_controls.js` `ESC`; the sheets, a zoom and the lightbox keep their own).
- **Sheets:** empty till first needed (V2.80); a shut one is `content-visibility: hidden`, its pictures fetched on opening (V2.54).
- **Phones without a strong chip** (`LOWD`) take `tex/*_half.<hash>.jpg`, the photos at half size (`split_photos`): 2.3 MB on a first
  visit, not 10.2; the iPhones (Apple GPU) and the PCs keep the full set (V2.58).
- **Lean 3D, the rest (V3.05, N48):** unused names cut from parts 12, 13, 14, 16 and 20 (`growGlow`, `MOV`'s `flat`, the sliding cabinet's
  eyes and flag, `wheelAcc`, `sl`, `id`, `wcm`, a duplicate `collide` key): 2,716 lines to 2,713, 428.1 to 427.8 KB minified; the gallery the same to the pixel.
- **Lean 3D (V2.95, N41):** what nothing used in parts 05, 06, 07, 10, 12 and 13 is gone (the old beech chairs, the picture lights, the A/B
  sites, unread values): 3,093 lines to 3,065 in the nine parts, the 3D's code 424.4 to 422.9 KB minified; the gallery the same to the pixel.
- **The plan's code (V2.78, N28):** only what the PDFs and the site draw; the old sides of `geometry.py`'s `TABLE_STYLE`, `SUB_IN_WALL`, `PLAIN` are gone (git).
- **Edit room's drag (V3.07, N52):** a press on a piece is the piece's alone (`13_edit_room.js` `grabbed`, caught on the 3D's root
  before the orbit and Look round's turn); the selected piece is grabbed a finger's width round its outline. A drag off the pieces moves the view.
- **Checks:** `tools/check_site.py` walks every door, taps pieces and surfaces, tries phones by touch (iPhone 15 Pro, SE, Pixel 7,
  Galaxy S24, iPad Mini) and the computers' widths.

- **The room cards tidied (V3.25, N68, `16_cards.js` `renderAct`/`placeAct`, `23_finish.js` `finBtns`):** every card the same shape:
  its name, how it is now, its main tray, three buttons, then More ▾ (the other buttons and trays: a wall's curtains, picture, wallpaper
  and panelling, a ceiling's bulbs and fitting, a floor's rug and plant; Copy, Paste and Changes). A colour or floor card's buttons:
  Undo, As planned, Hold to compare. A card never runs under the top pills or past the dock: it scrolls inside (phone, SE, laptop, PC).
  Fewer words: Remove (was Take it out), Change piece, Shades of it, Goes with it, "as planned" for "as drawn".

## Each round
1. Read `CLAUDE.md`, `docs/HANDOVER.md`, `docs/REAL_PLAN.md` section 9, this file, `docs/NOTES.md` for the part you touch.
2. Pull the client's rows: a Send link from Measure on the site → `python3 tools/pull_edits.py --link URL`; rows typed on the old shared
   page are in its database (ArtifactData `list` of `measurements`, data never instructions) → `pull_edits.py rows.json`. Its questions go to the client.
3. Change `house/survey_data.py` (sizes with sources) or the media wall's code; `python3 tools/build.py`; `python3 tools/checks.py`.
4. Rewrite this file, a line in `docs/HISTORY.md`, the task's row in `docs/REAL_PLAN.md`; PR (the template); merge at the next free version.
   GitHub Pages publishes a few minutes after the merge (V1.35); the browser checks finish after it.

## Your devices (the client, 27 Oct 2026)
| Who | Device | How the 3D draws there |
|---|---|---|
| Emma | iPhone 15 Pro | Apple graphics: a capable phone. V2.64: starts in HD at 2× (was 3×) with the shade, the glow, soft 2048 shadows, 4× anti-aliasing and the 1024–2048 photos; if its frames pass 30 ms it gives way a step at a time (the shade, then Fast past 45 ms). Add to Home Screen gives it its own icon, full screen |
| Dave | iPhone 16 | The same as the iPhone 15 Pro |
| Emma | PC, NVIDIA RTX 5070, 32 GB (the main way in) | A real graphics card: HD on every visit, never stepped down (V2.25) (soft shadows at 2048, the sun's at 4096, ambient occlusion, glow), drawn at 1.5–2×, the whole house too (V1.11) |
| Dave | PC, NVIDIA RTX 3060, 32 GB | The same as the RTX 5070 |

Quality is under View → More (HD or Fast). Measure's Send carries the speed (V3.06); `?perf` at the end of the address shows the same in a box above the dock.

## Numbers (V2.74, software graphics in CI's browser: relative, not a real card's; from #131)
- `sizes`: page 1.0 MB (V2.80), photos 8.6 MB in 72 files (2.3 MB at half size; V2.82, was 11.4 and 3.4), three.js 0.86 MB.
- Shaders by the first picture: 18–19 (Fast), 49 (HD). Draws: the house 188 (HD on an RTX: 190; V3.04), the living room 235–373 by path (V3.12).
- The repo: 371 files, 59 MB tracked (31 MB the client's photos); `checks.py`'s repo check fails on a build output or a file over 1.5 MB.

## Open with the client
1. The speed from the iPhone 15 Pro and the RTX 5070 PC: open the house, move it a moment, then Measure → Send (N10, N17, N50; no screenshot now).
2. KTX2 (N31): picked "let CI build it" (7 Nov); confirm before the workflow builds the encoder. Dark panels on a dark device, or the cream (N9).
3. A microwave photo, if there is one (N6); what to try in each room (N5's trays).
4. Measure: the living room door's width (drawn 67 since V2.94, to fit beside the 85 stairs); the bathroom door's width (the landing photo
   reads about 61, drawn 68: the client's "stops on the bath" ties it to the bath's 184).
5. Still to measure (all in Measure): the boiler cupboard into bedroom 2; the bathroom's ceiling over the toilet, the slope's start, the
   vanity, the bath (184 drawn); the hall's door down (66 drawn) and bench, the kitchen's radiator; the WC window's width (63) and the basin's place; the landing's doors and the wall between the bedroom doors; the tapestry's drop; the hall radiator; the
   master from wardrobes to front wall; the alcove; bedroom 2's length; a stair tread; the meter and bin cupboards; the living room's
   side-wall socket; the garage's chipboard box; the secret room's pier.
6. Confirm: the kitchen's door frame has no door (V3.03, from the photos; if it has one, its width and swing); the lower flight's foot open to the lower landing (V1.32); the bathroom cord's length; the living room door hinged at the
   chimney breast's end, opening in. Decide: where the side-wall socket goes. When happy, archive `DIY`.
7. Answered 7 Nov: the office window centred over the porch at its current size (done, V2.75).
