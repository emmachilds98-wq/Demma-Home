# State: what's true now

Rewritten (not appended) at the end of every PR. Under 150 lines. The plan and its status board: `docs/V1_PLAN.md`. The rules: `CLAUDE.md`.

**Version:** V2.34 (6 Nov 2026)

**The quality plan** (the client: "the best possible quality 3D model"): `docs/QUALITY_PLAN.md`, its phases and their status. **The finishes plan** (the client said go 5 Nov: tap a wall, floor or light in any room to change it): `docs/FINISHES_PLAN.md`, F1–F4 done (V2.4–V2.7), F5 done (V2.9 bulbs, V2.15 fittings), F6 done (V2.11 sending, V2.13 schemes and copying a room, V2.14 a colour from a photo), F7 m² and litres (V2.12); prices next (they need the client's paints and floors). **The real rooms plan** (the client, 5 Nov: render quality, items as real as the living room's, the house's decor theirs to edit): `docs/REAL_PLAN.md`, R1–R8; the rooms in the client's order (the master bedroom, the office, the kitchen, the bathrooms, the hallways); V2.17 the master bedroom's shapes and the HD room shadows, V2.18 the office's, V2.19 the kitchen's, V2.20 the bathroom's and the landing's; V2.21 the rooms' evening light (`houseEnvK`); V2.22 the hall's shoes and the WC's roll and pipes; V2.23 the shade where walls and ceilings meet (`finPatch` `finAt`). V2.24 the client's measured stairwell (85 wide, square flat-topped posts 93 from the party wall: `FIT` first_stairs x 382, `LANDING.rail_x`), bedroom 2's chair-bed, amp, guitars and socket back on its real wall (z 79.5), and a check that no socket floats; Hide buttons in the cream of its row (dark only as Show buttons), on one row with the view buttons on a phone. V2.25 the PCs at their best: a real graphics card (`BIG_GPU`, any window width) opens in HD every visit and never steps itself down (`houseLite`, `autoQuality`'s Fast, `slowDev`, a lost context no longer saves Fast), the house as sharp as a room (1.5–2×); 390 lines nothing used gone (16 functions, 28 constants, `questions.py`, unused imports, 76 CSS rules that matched nothing), the build's outputs the same. V2.26: the old app's `?embed` mode out (`21_embed.js`, its hooks, `room3d_page.embed`, its CSS: 139 lines; the 3D in 22 parts again). V2.27: what V2.25's removals left unused (three dining diagrams, the old steps and slide pages: 323 lines) and the CSS rules spread over lines or in `@media` that matched nothing (the old phone bar), outputs and page the same. V2.28: the ground round the house the lawn's photo and relief (`11_lights.js`, `worldUV`), not 3 km of one flat colour (on a PC's HD it read as khaki). V2.29: no repeat in it to the horizon (the photo mixed with itself turned and scaled, a slow lighter-darker over metres: the ground's own shader, `grass`). V2.30 (REAL_PLAN R8, fluid as a game): each walkable room's shaders built while you stand still (`warmSwitch`), so no doorway freezes; a real card draws at the screen's sharpness (4× anti-aliasing) with the soft shade at half size live; the walk keeps its speed through a slow frame. V2.31: Mouse look (the pill beside the view buttons while walking on a computer, or M): the pointer held, the mouse turns you, a click opens what's under the dot (`aimed`), Esc stops it. V2.32 (R6): any piece in any room moves out from its wall too (the card's Move or resize: `out`; `pull_edits.py` folds it). V2.33: and turns a quarter each press (Turn; `turnBox`, `turnPrism`; not a piece with a moving part). V2.34: and comes out (Take it out; Measure's As planned puts it back).

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
| `media-wall/src/` | The site: `build_viewer.py` (the page: brand, Plan · Build · Buy and their sheets, offline, icons), `page.css`, `room3d_page.py` (the 3D's controls: the stickers, the dock's View · Room · Look · Measure · Edit and their panels), `room3d/` (the 3D, in 22 parts joined in order by `room3d_src.py`: setup, renderer, textures, ... house_edits, views_walk, cards, controls, go, finish; "`room3d.js`" in older notes means these), `measure.js` (Measure's saving). The living room and the media wall project: `geometry.py`, `fit.py`, the renders and PDFs (`make_images.py`, `build_doc.py`), `export_project.py` |
| `house/` | The house: `survey_data.py` (every size, with its source) → `model.py` (the geometry, every piece tagged with its item) → `export_house.py` (the house file, `house.schema.json`); `measure.py` (what's still a guess: Measure's rows); `client_edits.py`/`.json` (the client's numbers over the guesses); `check_model.py`, `zfight.py`, `privacy_check.py`; `textures/` (the CC0 photos); the facts `HOUSE.md`, `EVIDENCE.md`, `SURVEY.md`, `BUILD_SPEC.md`, `HD_PLAN.md`, `SOURCES.md` |
| `media-wall/inputs/` | The client's photos and plans (EXIF stripped) |
| `projects/` | How a project is shaped (`project.schema.json`); a room's own project goes in `projects/<id>/project.json` |
| `tools/` | `build.py`, `checks.py`, `check_site.py`, `pull_edits.py`, `round.py`, `compare.py` and `camfit.py` (the photos beside the 3D) |
| `docs/` | `V1_PLAN.md` (the plan), this file, `DECISIONS.md`, `HISTORY.md` |
| `_site/` (built) | `index.html` and `plan.html` (the page), `sw.js`, `manifest.webmanifest`, `three.<hash>.js`, `photos.<hash>.json`, `data/` (house.json, projects), `media-wall/out/` (PDFs), `media-wall/src/art/` (pictures, icons) |

## The site (V1.2: the old design back)

- **V1.55–V1.56:** a walk steps down only on purpose (`walkMove` `badDown`: not sliding along a wall, the living room's flight only facing
  down it, never off an edge); stopped dead at a door's frame with an opening just to one side, it eases toward it and through.
  V1.57: in the hall under the living room's stairs no longer the living room (`walkRoom`: your feet at its tread); down the lower stairs, the kitchen's view (`WALK_VIEW`).
  V1.58 (`check_site.DOORS` walks every door): a foot not a point; chairs, stools, stair drawers not in the way; a step down's head tested below.
  V1.59: Be there starts clear of furniture (`standIn` uses `freeSpot`); walls above the ceiling or past the living room draw as `above` (no green in the stairwell).
  V1.60: standing, the brand names the room you're in (`hereRoom`: the lower landing, not the kitchen whose view it shares). V2.0: `flyTo` clears `WALK.feet`.
  V2.1: the landing's ceiling over the stairwell (`upper_ceilings`: VOID is a floor only); the stair wall in the living room's paint up to the landing (`model.stair_wall`, `stairpaint` = a copy of the room's `w:stairs` paint); the living room's view draws the first floor above the landing's floor (`livClip`).
  V2.2: walls flat (no plaster relief: `paintMat` relief only for `ceil`; the house's `paint` untextured), every ceiling artex (`ARTEX_NRM`; the house's `ceiling` uses the artex photo), the house's ceilings white or a colour (View → More, `S.hceil`, `hceilApply`); the stairwell 10 wider; the WC's door and pull cord. V2.3: the lower store's back wall in line with the one past the stairs' top step (`STORE_TO_STAIRS`, `footprint`). V2.4: each room's surfaces in `house.json` (`house/surfaces.py`); the ground floor's rooms' own ceilings (`ground_ceilings`). V2.5: the palette, `R3D.finish(room, surface, hex)` (`finPatch`). V2.6: tap a wall or ceiling, its colours card (`23_finish.js`, `S.fin`). V2.7: and a floor (`finFloorApply`, slot 5). V2.8: the stair wall always the living room's stair wall (out of the palette). V2.9: a room's bulbs (`S.fin` slots 6, 7). V2.10: from above and at an angle the first floor keeps its walls in the roof's group (`applyFloors` `roofWalls`, `FLCLIP`; `setRmode`). V2.11: Send carries the finishes; `pull_edits.py` keeps them (`house/client_finishes.json`). V2.12: Measure says what they take (`finTakes`). V2.13: Look (in the house's views too) saves and switches the house's colours as named schemes (`finSchemes`, this device); a card's Copy this room, then Paste on another's (`FIN_COPY`). V2.14: a colour card's Photo: tap a spot in your photo for its colour (`finPicAt`, the photo stays on the device). V2.15: a ceiling's or a light's card: The light (bare bulb, drum, globe, flush dome, four spots: `S.fin` slot 8, `finFitApply`), in place of the room's own (its pieces their own group, `FIN_PEND`). V2.16: the bathroom's step back at the stairwell's edge (`BATH_1` x0 398); the party wall plastered behind the living room's own wall (seen down the stairwell) and its cut top capped (`outer_walls`). V2.17: the soft things drawn as cloth (`20_go.js` `clothBox`, `CLOTH`); `knob` (round, `ROUND`), bun feet (lathes), hangers in the master; the room's first light casts shadows in HD (`ROOMLIGHTS[0]`, redrawn as it moves).
- **V1.53 (the client: double-click to go there, W A S D to walk, a drop-in figure, better overheads):** a double-click (`dblclick`; a
  double-tap on a phone) on any floor you see stands you there in Be there (`room3d/14_views_walk.js` `spotAt`, `goStand`, `freeSpot`;
  through a roof, the first floor down); the figure bottom right (`#r3d-peg`) drags onto the house, a ring and the room's name where it
  lands. A walk key in a room's In it stands you there and walks (`startWalk`); Shift hurries; over the house or a room from above the keys
  glide (`glide`). The overheads: `flyTo`'s fourth is `above` (REDUCE there held them to 6 m), long lenses, framed by the real lens (`fitFov`).
  Walking no longer jumps from the kitchen to the living room over it, nor steps onto a bed's base (step-up 24). `check_site.DROP` tries it.
  V1.54: the lower floor's views without the earth over the secret room (`HMATS.earth` off there). Phones (the client: "works on iPhones
  ... mainly the 15 pro"): views from above framed between the buttons (`freeFrame`, `fromAbove`); a card opened by a tap ignores that
  tap's click (`actAt`), and a double-tap's second tap on it still counts; iOS's own dblclick ignored; no callout on the figure.
  Tablet's walking tip fixed. Tried by touch as an iPhone 15 Pro, 15 Pro Max, SE, Pixel 7, Galaxy S24, iPad Mini (`window.__r3dDblMs`: rigs only).
- **V1.52 (V1_PLAN 2.6):** the 3D's one 6,664-line `room3d.js` split into 22 parts (`media-wall/src/room3d/NN_<part>.js`), joined into the same script (the built page byte for byte the same); `checks.py`'s sizes line checks each part parses alone.
- **V1.50 (V1_PLAN phase 3):** tap a piece in the house: its card says its size; Change its size, a stepper each (a door: width, place),
  the 3D changes as you go, As planned puts it back. Measure rows in `edits` ({item, field, value}; Send shares them), `pull_edits.py`
  folds them in. `room3d.js` `PICK`, `housePiece`, `storeEdits`, `selPiece`; the pieces in `R.HOUSE3.items`; `check_site.SIZE` tries it. (V1.49: the walk check waits for flies.)
  V1.51: Measure lists them under "Changed in the 3D" (`paintEdits`: a name flies there and outlines it, As planned), and Send sends them.
- **V1.47 (the client's review):** no garden ground in the kitchen; blinds (`blind_cloth`, `hblinds`); front door hinged at b; the dormer
  clad in timber boards; smoother walls; by evening a dusk veil; a drag in a room turns the view in place (`lookTurn`).
- **V1.44–V1.48:** the living room's whole fixed shell (`model.living_shell`, house.json's living `shell`, four checks) (walls, floor, ceiling, skirting, door, window opening, stairs, pipe boxing, radiator) drawn from `R.HOUSE3.living` (the same to the pixel). V1_PLAN phase 5 done.
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
- **Earlier rounds** (V1.12–V1.24: lights, handles, fabrics, mirrors, the client's photo fixes): `docs/HISTORY.md`. `?embed` (the old app's frame) taken out in V2.26.

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
| Emma | PC, NVIDIA RTX 5070, 32 GB (the main way in) | A real graphics card: HD on every visit, never stepped down (V2.25) (soft shadows at 2048, the sun's at 4096, ambient occlusion, glow), drawn at 1.5–2×, the whole house too (V1.11) |
| Dave | PC, NVIDIA RTX 3060, 32 GB | The same as the RTX 5070 |

Quality is under View → More (HD or Fast). `?perf` at the end of the address shows the counts in a corner: the screenshot to send.

## Numbers (5 Nov, V2.25; software graphics in a test browser: relative, not a real card's)

- `sizes`: page 2.3 MB, photos 12.7 MB (WebP tried: 15% bigger on these textures), three.js 0.86 MB own file, 24 sizes to measure.
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
