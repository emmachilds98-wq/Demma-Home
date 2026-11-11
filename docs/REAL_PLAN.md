# Real rooms: every room as real as the living room, and yours to change

Written 5 Nov 2026 (V2.16), at the client's request: "overall now though the shape and way the house looks matches the house now and we
should focus on a plan for the next upgrade that makes the render quality better, items look more real like the living room and im able
to adjust and edit the houses decor and look."

**Agents:** work the board (section 5) top to bottom, one phase (or one room of a phase) a PR, merged to main when its checks pass. The
rules in `CLAUDE.md` hold above everything here: privacy first, the old design (the 3D is the site, floating pills and panels), say
less, core plan vs options, every size from a cited source, regenerate rather than hand-edit pictures. The finishes plan
(`docs/FINISHES_PLAN.md`) carries on beside this one: its F8 and F10 are done here (R6, R7); its F9, F11, F12 stay its own.

---

## 1. What we have today, and why the living room looks better

Seen side by side (V2.16, the same page, the same evening): the living room against the kitchen and the master bedroom.

| | The living room | The house's other rooms |
|---|---|---|
| Light | 12 spot lights, each a fitting in the room (the LED strips, the spots, the lamps): warm pools, dark corners | two plain point lights that follow you, the same everywhere: flat, even, no pools |
| Shadow | its lights' pools and fall-off; HD shadows | a soft patch under each piece (v72); the corners, the skirting and the walls' feet as light as the middle of the room |
| Surfaces | photo textures with grain and weave on almost every piece | photo textures on the walls, floors and a few woods; most furniture one flat colour |
| Shape | built piece by piece (rounded edges, handles, cushions, books, plants) | boxes with a few turned shapes (lights, the WC's suite); edges sharp |
| Things | the client's own things in it, dozens | the big furniture only; few of the small things that make a room look lived in |
| Changing it | Room, Look and Edit: move, swap, add, colours, scenes | colours, floors and bulbs on tap (the finishes plan); furniture fixed |

The tools are there already: GTAO (ambient occlusion) in `01_renderer.js`, HD shadows (`18_caption_hd.js`), rounded boxes by material
(`20_go.js` `ROUND`), the house's materials from photos (`house/textures`), parts that move (`o.part`), the living room's Edit room
(`13_edit_room.js`). This plan puts them to work in every room.

## 2. The upgrade, in phases

- **R1 Light each room as it's lit.** Each room's own ceiling light (the finishes plan's fitting) as a real light: a warm pool under it,
  falling off to the corners; a lamp where the client has one; daylight through the room's own windows by time of day. The room you're in
  gets the one shadow-casting light (the sun by day, its ceiling light by night). Ambient occlusion tuned for small rooms. Proof: the
  gallery (`tools/gallery.py`) of every room, before and after, by day and evening; the phone's frame time no worse than the living room's.
- **R2 Things sit on the floor.** Baked shade beyond v72's patches: the darkening into a room's corners, along the skirting and the
  walls' feet, beside a wardrobe and under a bed, worked out once from the house file (so phones pay nothing). Proof: the gallery; no
  flicker (`checks.py` flicker).
- **R3 Surfaces that read as what they are.** Every house material with a photo texture and its relief and shine (normal and roughness):
  pine and oak grain on the furniture, the duvets' weave, carpet pile, the tiles' grout, brushed metal, gloss paint, uPVC. From free
  sources only (ambientCG, Poly Haven: CC0), 1k (2k for big surfaces), listed in `house/SOURCES.md`. Proof: the gallery, close up.
- **R4 Real shapes, one room at a time.** Each piece built as itself, the living room's way: rounded edges, handles and knobs, plinths,
  drawer and door gaps, the bed's mattress, pillows and duvet folds, the wardrobes' rails and what hangs on them, the radiators' fins,
  curtains in folds, the kitchen's hob and sink and taps, the bathroom's taps and shower. From the client's photos; every size from a
  cited source (EVIDENCE.md), every piece an `o.item`. Rooms in the client's order (section 4); one room a PR.
- **R5 The things in a room.** The small things the client's photos show (books, plants, pictures, towels, toiletries, the desk's things,
  the kitchen's things on the side): core, as they're the client's. Things we'd suggest are options: one line each, no build steps.
- **R6 Change the furniture in any room.** The living room's Edit room in every room (the finishes plan's F10): tap a piece, move it, turn
  it, swap it, add one from the catalogue; the walk, the fit checks and the plan follow; the rows go with Send. One piece a tap, the card
  as now; no new menus.
- **R7 One Look for every room.** The living room on the same rows as the house's rooms (the finishes plan's F8: pixel for pixel as
  before), then Look in each room: the rug, the curtains or blinds, cushions and bedding colours, a picture on the wall, a plant, the
  handles, from a short tray. Saved with the house's schemes (V2.13) and sent with Send.
- **R8 Quick on the phone.** Compressed textures (the quality plan's Q5: KTX2), the lights and shadows only for the room you're in, the
  rest drawn simply; the iPhones' real numbers (`?perf`) before and after each phase.

## 3. Not doing (and why)

- Path tracing or baked global illumination for every view: too slow on a phone, and the house changes as the client edits it.
- Paid model or texture libraries, or a brand's product we can't source: every piece from the client's photos, a free (CC0) source or a
  maker's own published sizes.
- Pictures made up to look like a product: a piece is the client's own, or an option said to be one.
- A new layout: the 3D stays the site, and everything floats over it as the old pills and panels.

## 4. Needs the client

- ~~Which room first~~: the client, 5 Nov: "start with master bedroom then bedroom 3 / office, then kitchen and then bathrooms and hallways"; and "you dont have to use images for this, you can just increase quality and functions inc rendering items in hd" (so photos help but don't hold a room up).
- Close photos of that room's furniture and things (straight on, in daylight), and any product names (the bed, the wardrobes, the
  desk, the sofa-bed), for their real shapes and sizes.
- For R7, what you'd like to try in each room (a rug, curtains, bedding colours), names or photos.

## 5. Status board (update this table in every PR; one line a row, the detail goes in `docs/HISTORY.md`)

| # | Phase | Status | Left |
|---|---|---|---|
| R1 | Light each room as it's lit | **Done** (V2.17, V2.21, V2.39, V2.48: the lamps, the kitchen's battens) | More lamps as the client shares them |
| R2 | Things sit on the floor | **Done** (V2.23, V2.52: shade round each piece and up the wall beside it) | |
| R3 | Surfaces | **Done** (V2.37, V2.40, V2.56: gloss paint, uPVC, brushed metal, the dormer's boards) | |
| R4 | Real shapes | **In part** (V2.17–V2.22, V2.24, V2.44) | N6 done (V2.53); soft bedding N36 (V2.91) |
| R5 | The things in a room | **In part** (V2.18, V2.19, V2.40, V2.41) | More from the client's photos as they come |
| R6 | Change the furniture in any room | **Done** (V2.32–V2.36, V2.55: move, resize, turn, take out, swap, add) | Swap or add in the living room's project (its own Edit room) |
| R7 | One Look for every room | **Done** (V2.51: the living room joined; V2.57: rugs; V2.59: curtains; V2.61: bedding; V2.62: a plant; V2.63: a picture) | More prints, blinds or plants if the client asks |
| R8 | Quick everywhere: fluid as a game | **In part** (V2.30, V2.31, V2.42, V2.43) | N13–N17 done (V2.70–V2.73); KTX2 (N31); shaders room to room done (N35, V2.87) |

## 6. The next round (6 Nov 2026 review, V2.44): tasks

The client, 6 Nov 2026: "look at the plan we currently have in the repo and look at what needs to be completed and expand wherever
needed via your own review. then split the plan up into tasks and perform those upgrades". From the boards above, the repo review
(texture loading, phone textures, script size) and a look at the built site on a computer and an iPhone 15 Pro.

**How to run it.** Each workstream is its own thread, one task a PR, so they run side by side. Workstreams touch different files; where
two share one, the order is given. The Speed workstream (N2–N4) goes with the mobile audit, which starts with the offline
cache's fix. Every PR: rebase on `main` just before merging, take the next free version then (`VERSION`), rewrite
`docs/STATE.md` over main's (don't merge it line by line), a line in `docs/HISTORY.md`, tick its row here.

| # | Task | Workstream | Touches | Status |
|---|---|---|---|---|
| N1 | This board; `STATE.md` short and under 150 lines; the plans' boards one line a row; a duplicate photo gone | Plan | `docs/`, `media-wall/inputs/` | **Done** (V2.45) |
| N2 | Textures as their own files (not one 13 MB base64 JSON), the room you're in first, the rest when idle, kept offline; the 3 duplicate normal maps share one file | Speed | `export3d.py`, `build_viewer.py`, `02_textures.js` | **Done** (V2.47 kept offline, V2.49 a file each, what's on screen first; the 3 duplicate normal maps already shared) |
| N3 | A 512 px texture set for phones without a strong chip, after N2 | Speed | `build_textures.py`, `02_textures.js` | **Done** (V2.58: half size, 2.3 MB in place of 10.2) |
| N4 | The page's own script minified at build (the source as it is); the living room's suggestions and ideas loaded on first use | Speed | `room3d_src.py`, `build_viewer.py`, `07_suggestions_ideas.js` | **Done** (V2.50: the script minified at build; V2.80, N25: the suggestions and ideas built the first time they're shown) |
| N5 | Look in every room (R7): the living room on the house's rows (pixel for pixel), then each room's rug, curtains or blinds, bedding, a picture, a plant from a short tray; saved in schemes, sent with Send. One PR each: N5a the living room joined; N5b rugs; N5c curtains and blinds; N5d bedding and cushions; N5e a picture; a plant (the Edit thread's, from N7's catalogue) | Look | `23_finish.js`, `room3d_page.py` (Look) | **Done** (V2.51: N5a; V2.57: N5b; V2.59: N5c; V2.61: N5d; V2.62: the plant; V2.63: N5e, the picture) |
| N6 | Shapes, second pass (R4): the wardrobes' frames and doors, the hanging clothes as garments (they read as flat slabs), the kitchen's fridge-freezer and microwave fronts and handles, the Kallax's boxes, the chair-bed | Shapes | `house/model.py`, `survey_data.py` | **Done** (V2.53; no microwave in the photos) |
| N7 | Furniture, the rest (R6): swap a piece for another of its kind; add one from the catalogue, in any room | Edit | `08_house_catalogue.js`, `house_edits`, `16_cards.js` | **Done** (V2.55) |
| N8 | Light and surfaces (R1–R3): lamps, shade beside and under pieces, gloss paint, uPVC, brushed metal, the dormer's boards | Light | `01_renderer.js`, `11_lights.js`, `house/textures/` | **Done** (V2.48: the lamps; V2.52: shade by pieces; V2.56: the finishes) |
| N9 | Buttons and flow: a floor's room pills on a computer in one row; the house and its floors framed clear of the buttons (a phone: the roof sat under the floors row; a computer: labels under the rows); room labels squeezed to fit, not cut. Left: dark panels when the device is dark (ask the client first: the cream is the old design) | UI | `page.css`, `room3d_page.py`, `09_house_views.js` | **In part** (V2.46) |
| N10 | From the client: `?perf` on the iPhone 15 Pro and the 5070 PC (decides KTX2); photos or names for N6; what to try in each room for N5 | Client | none | Needs the client |
| N11 | Moving smoothly (the client: "make it fluid and smooth"): the glide the same at any frame rate, a held walk picks up pace; then the frame's cost from `?perf` on the PC | Speed | `17_render_loop.js`, `14_views_walk.js` | **In part** (V2.60: the glide and the walk) |
| N12 | The iPhone (the client: "freezing on load after first move and is quite laggy"): no burst of photo uploads or shader builds after the first picture; no shaders built on the first tap on a floor; the rooms' warm-up while standing in parallel; then `?perf` from the iPhone | Speed | `01_renderer.js`, `02_textures.js`, `09_house_views.js`, `17_render_loop.js` | **In part** (V2.64: the photos a few at a time, the shaders kept, 2×, six planes, compiled by planes; the iPhone's `?perf` to come) |

**Not doing from the review:** removing the page's 3D stills: all but four are on the page or in the plan, and those four are in the
deck's list.

## 7. The round after (7 Nov 2026 review, V2.64): tasks

The client, 7 Nov 2026: "iPhone is running better but there's still some initial freezing ... minimise movement and view lag when moving
in first person and allow better controls in overhead and angled views ... improve the way you land into the site ... minimise words
... improve detail, quality and performance of the model as well as overall design of the app". From an iPhone 15 Pro emulated headless
(the shaders, photo uploads and draws counted each frame; timings relative), the code, and the site on a phone and a computer.

**What the review found**
- **The freeze on opening is the first picture.** After the parallel warm-up, the first frame still builds 16 shaders one after
  another (the shade, the glow, their output, the shadows' depth), draws every shadow, and sends about 220 textures to the chip, all
  in one frame (its own 9 s here against a still frame's 0.2 s). Before that, `start()` holds the page for the living room's build,
  though the house opens outside, where the living room is hidden.
- **The lag while moving:** a photo still goes onto the chip every 120 ms while you move, each with its colour match done pixel by
  pixel on the page's thread first (a 1024 photo: a million pixels in the frame). The hidden parts' warm-up draws each part (a shader
  built in that frame) a moment after you stop. Standing in a room, the whole house is drawn (300 draws), not the room and what's seen
  from it.
- **Overhead and Angled** are one orbit: a drag in Overhead tilts it out of overhead, nothing stops the view going under the ground or
  the house sliding off the screen, and a computer has no keys for them.
- **Landing:** a black screen and words ("Building the house…") until the first picture; the welcome every visit (it's per tab), in
  60 words; the version in the brand; on a phone four rows of buttons at the top over a floor.
- **The model:** the rooms had their shapes pass (N6); the outside hasn't been set beside the client's outside photos since. The
  lawn's photo repeats in a visible grid. Photos as JPEG cost the iPhone memory and an upload stall each (KTX2 would send them squeezed).

**How to run it:** as section 6. Each workstream is a thread, one task a PR, the files in "Owns" its own (a function named: only that
function); where one task needs another's, the order is given. Every PR: rebase or merge `main` just before merging, the next free
version then, `docs/STATE.md` rewritten over main's, a line in `docs/HISTORY.md`, its row ticked here. Say less on screen.

| # | Task | Workstream | Owns | After | Status |
|---|---|---|---|---|---|
| N13 | The first picture with no freeze: the shade's, the glow's and the shadows' shaders built in the warm-up; every texture sent in slices while it waits; the shadows on the second frame; the hidden parts' warm-up by `compileAsync`, not drawn; fires `r3d-first` on the first picture | Speed | `01_renderer.js` (not the controls' lines), `20_go.js` `start()`, `17_render_loop.js` (the warm-up's call) | | **Done** (V2.70: 2 shaders in the first frame, not 16; textures in the wait; shadows a frame ahead. The hidden parts' warm-up kept: compiled at the start already, so its draws build little) |
| N14 | Land light: on the whole house the living room (and its suggestions and ideas, N4's rest) is built after the first picture, while idle, not before it | Speed | `20_go.js` `start()`, `07_suggestions_ideas.js` | N13 | **Done** (V2.72, another way: the start builds only the shaders the landing shows, 45 not 101, the living room put away first; the rest a moment after the first picture, in parallel. Building the room later: not done, its parts are wired through the start; N4's rest still open) |
| N15 | No photo on a moving frame: sent only while still (a missing one on screen may go); the colour match done once at build or off the page's thread | Photos | `02_textures.js`, `export3d.py`, `build_viewer.split_photos` | | **Done** (V2.67) |
| N16 | Draw what you can see: standing in a room, only it, the rooms through its open doors and the outside through its windows; a room's walls, floor and ceiling merged per material | Rooms | `09_house_views.js` `applyFloors()`, `20_go.js` `buildHouse()` | | Done (V2.71) |
| N17 | A steady frame on the iPhone while walking: sharpness by frame time (1.5–2×, no new buffers), the glow off while moving on a phone; then its `?perf` | Speed | `17_render_loop.js`, `01_renderer.js` `draw()` | N14 | **Done** (V2.73: a walk is moving too; the glow and the shade off while a slow phone moves; 1.5× from the next pause if still past 24 ms, once a visit. The iPhone's `?perf` still to come) |
| N18 | Overhead as a map, Angled held up: Overhead one finger or a left-drag pans, two fingers pinch and turn, a right-drag turns; Angled orbits 10°–85° above the ground; the view held round the house; a computer's arrows or W A S D pan, Q E turn, + − zoom; a double-tap on the ground centres there | Controls | new `room3d/19_view_controls.js`, `09_house_views.js` `floorCam()`, `14_views_walk.js` `flyTo()` | | Done (V2.74) |
| N19 | Landing: a cream first screen with the house's outline and a thin progress line (no black, no words) until `r3d-first`; the welcome once per device, a title, two buttons and three icons of two words; the version off the brand (into Plan); the house framed a little closer | Landing | `build_viewer.py` (brand, first screen), `page.css`, `room3d_page.py` (welcome), `19_controls.js` `welcome()` | | Done V2.69 (framing left to N18) |
| N20 | Fewer buttons on top: a phone's top in two rows at most (the view's Angled · Overhead in the floors' row; Hide labels and Hide buttons one button); the floors' and rooms' rows scroll sideways, not wrap | Landing | `room3d_page.py` (`.r3d-mini`), `15_tour_link_stickers.js` `setBare()`, `09_house_views.js` `drawRooms()` | N19 | Done (V2.76) |
| N21 | The outside close up: the 3D beside the client's outside photos (`tools/compare.py`), each difference fixed (the openings' depth, the brick's scale, the porch, the roof's edge), sizes cited | Outside | `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | | Done (V2.75) |
| N22 | Photos squeezed for the chip (KTX2, ASTC on the iPhone): less memory, no upload stall, a sharper photo for the same; the lawn without its repeat (a second, larger variation) | Photos | `02_textures.js`, `export3d.py`, `vendor.py`, `03_materials.js` (the lawn's) | N15 | **In part** (V2.68: the lawn; KTX2 is N31, WIP in #133) |
| N23 | Track the upgrades: a room's card lists its changes (Look, Edit) with a done tick and a rough cost; Plan has the house's total | Track | `16_cards.js`, `plan_ui.py` | | Done (V2.66) |

**Order:** N13, N15, N16, N18, N19, N21, N23 start together; then N14, N20, N22; N17 last (with the iPhone's `?perf`).
**Needs the client:** `?perf` from the iPhone after N13 (N10); more outside photos if N21 finds a side not shown.

## 8. The next round (7 Nov 2026 review, V2.74): tasks

The client, 7 Nov 2026: "make a plan to continue upgrades on my demma home space, split work up with agents to perform the upgrade
fast and to optimal quality". From the boards above, the two reviews in the project's files (6 Nov), the two open PRs and the code.

**What the review found**
- **Two finished PRs are stuck:** N20 (#122, fewer buttons on top) and N21 (#121, the outside beside the photos) passed their checks
  but conflict with main (both took V2.70/V2.71, since used). Nothing new should touch their files until they land.
- **The start still carries what it doesn't show:** the whole icon font (every symbol, `display=block`: icons blank till it lands),
  `plan.html` a second full 2 MB copy of the page, the Plan · Build · Buy sheets' markup (~1 MB, 14,500 elements) parsed before the
  3D, and the living room's suggestions and ideas (`07_suggestions_ideas.js`, 700 lines) run at start (N4's rest).
- **The chip's work:** 105–120 shader programs and ~350 draws for the whole house; materials that differ only in a colour or a
  number still get a shader each, and every small piece has the big pieces' bevels.
- **Nothing guards the gains:** the checks pass whatever the page weighs or however many shaders it builds, so a round can undo
  N13–N17 without anyone seeing.
- **Lean code:** the plan's Python (`render.py`, `diagrams.py`, `build_doc.py`, `instructions.py`: ~7,500 lines) has grown round by
  round; no one has cut what the PDFs no longer use.
- **The finishes' open rows:** F9 wallpaper, F11 colours that go together, F12 the gardens (fences, paths, plants); KTX2 (N22's
  rest) waits on the client.

**How to run it:** as section 7. A workstream is a thread, one task a PR, the files in "Owns" its own; nobody else edits them till
the row is done. Every PR: merge `main` just before merging, take the next free version then, `docs/STATE.md` rewritten over main's,
a line in `docs/HISTORY.md`, its row ticked here, `python3 tools/checks.py`'s lines in the PR. Say less on screen.

| # | Task | Workstream | Owns | After | Status |
|---|---|---|---|---|---|
| N24 | Land #122 (N20) then #121 (N21): merge main into each, next free versions, re-run every check, fix what main changed, merge | Land | the two PRs' files | Done (#121 as V2.75, #122 as V2.76; #127 closed as its duplicate) |
| N25 | A lighter start: the icon font only the symbols used (`icon_names=`, not `display=block`); `plan.html` a tiny redirect; the sheets' markup out of the first parse (a `<template>` or built on first open); the suggestions and ideas loaded on first use (N4's rest). Before and after: bytes, elements, time to `r3d-first` | Load | `build_viewer.py` (head, sheets, `plan.html`), `page_router.js`, `07_suggestions_ideas.js`, `room3d_src.py` | | **Done** (V2.80: the icon font 1.29 MB to 25 KB; `plan.html` 2 MB to a 0.4 KB step; the sheets' markup and scripts a file of their own, built on first use: the page 2.0 to 1.0 MB, 14,695 to 1,565 elements at the start; each suggestion and idea built the first time it's shown; V2.92: the fonts' stylesheets no longer hold up the first screen, the 3D's start 0.25–0.3 s sooner) |
| N26 | Guard the gains: a budget in `checks.py` (the page's bytes, the first visit's bytes, shaders at the first picture, draws for the house and the living room, on the phone and the PC paths), failing a round that goes over; numbers in `tools/perf_budget.json` | Guard | `tools/checks.py`, `tools/check_site.py`, new `tools/perf_budget.json` | Done (7 Nov, checks only: `tools/perf_budget.json`; passed on V2.79) |
| N27 | Fewer shaders, a lighter house: materials that differ only in colour or a number share one program; fewer bevel segments on small or far pieces; `R3D.perf()` programs and draws before and after, the look unchanged (`tools/gallery.py`) | GPU | `03_materials.js` (not `grassy`), `20_go.js` `ROUND` and `PSOFT` | Done (V2.79) |
| N28 | Trim the plan's code: cut functions, drawings and pages the PDFs and the site no longer use; the PDFs' pages and the site's pictures the same before and after; lines before and after in the PR | Lean | `render.py`, `diagrams.py`, `build_doc.py`, `instructions.py`, `chapters.py`, `make_images.py`, `qa.py` | Done (V2.78) |
| N29 | Wallpaper and colours that go together (F9, F11): a wallpaper on This wall at its real repeat (CC0 patterns or drawn), rolls counted; each paint's maker pairings, sourced | Finishes | `23_finish.js`, `house/surfaces.py` | Done (V2.77) |
| N30 | The gardens (F12): fences, paths, the lawn's edges and the plants from the client's outside photos, sizes cited; core where the photos show them, ideas as options | Outside | `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | N24 (#121) | Done (V2.89); four ideas as options (V2.93) |
| N31 | Photos squeezed for the chip (KTX2, N22's rest) | Photos | `02_textures.js`, `export3d.py`, `vendor.py`, `house/textures/build_textures.py` | the client's OK | In progress: #133 (build side only, WIP); Emma picked "let CI build it" |
| N32 | Lighter photo files: the heaviest maps (the audit's `carpet_grey` normal 489 KB, `lawn` 439 KB, `artex` 402 KB) re-encoded or sized to what they show; a duplicate map shares one file; `sizes` before and after, the look unchanged (`tools/gallery.py`) | Photos | `house/textures/*.jpg`, `house/textures/build_textures.py`, `textures.json` | N24 (#121 touches them) | In PR (V2.82): the carpets, the blanket, the sofa-bed's and the duvet's weave at 512 (`build_textures --slim`, `PX`), duplicates shared (`like`); photos 11.4 to 8.6 MB |
| N33 | Phone and PC look-over (the 6 Nov review's G): screenshots on the iPhone 15 Pro, SE, Pixel 7, iPad Mini and 1280/1920 of the welcome, the house, a room, the cards, Measure and the sheets; fix overlaps, taps under 44 px, cut or crowded text, in fewer words | Look-over | `page.css`, `room3d_page.py` | N24 (#122 touches them) | Done (V2.88) |
| N34 | The bathroom and the master matched to their photos (UPGRADE_REVIEW Next 2): `camfit.py` from a start near each photo's spot, `compare.CAMS` filled, each difference fixed, sizes cited | Outside | `tools/compare.py`, `tools/camfit.py`, `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | N30 (same thread) | Done (V2.90): the mirror 58; the bath door's place to measure |
| N35 | Room to room with no shader built: walking from the living room into the hall or up the stairs built 5–13 shaders on an emulated iPhone (V2.73, the idle warm-up not yet there); the next rooms' shaders compiled in parallel (`compileClipped`) as you near a door, not drawn one by one when idle; `?perf` programs before and after | Speed | `01_renderer.js` (`precompileStep`, `warmSwitch`), `14_views_walk.js` `enterRoom()` | | **Done** (V2.87): the rooms near you warmed as you walk up (`warmNear`), the shadows' shaders too; 36 built mid-walk to 1 |
| N36 | Soft bedding: the beds' duvets, pillows and throws as soft, rounded shapes (the master's and bedroom 2's read as flat grey slabs), the house catalogue's bed the same; the look checked in `tools/gallery.py` | Shapes | `house/model.py` (`bed2()`, `master()`, the beds only), `08_house_catalogue.js` `hcBed()` | N34 (`model.py`) | Done (V2.91): the master's and the catalogue's; bedroom 2 is the music room (no bed) |
| N37 | Fewer draws for the house (N27's rest): more of the house's fixed pieces merged per material, keeping each room's span so `roomCull` still leaves rooms out and taps still find their piece; `R3D.perf()` draws for the house and a room before and after, inside `tools/perf_budget.json`, the look unchanged (`tools/gallery.py`). Also (found by N26): changing any setting brings the living room back into the whole-house view from outside (+91 draws); keep it put away | GPU | `20_go.js` `buildHouse()` (not `buildTrees`), `09_house_views.js` `roomCull()`, and the one line that re-shows the living room on a setting change | #138 (it touches `20_go.js`) | Done (V2.98): the house 287 to 188 draws, 569 to 371 on an RTX |
| N38 | The stairwells (the client's screenshots, 8 Nov): the living room's flight under the landing's banister (no hole), the living room door and the hall's stair wall to suit, no brick or empty rooms seen round the stairs, the view down the lower stairs from the hall | House | `media-wall/src/geometry.py` (`RECESS_W`, `DOOR_X`), `house/model.py`, `house/survey_data.py` | | **Done** (V2.94) |

**Order:** N24, N25, N26, N27, N28, N29 start together; when N24 lands, N30 then N34 (one thread), N32 and N33; N35 any time; N36 after N34; N31 on the client's yes.
**From the earlier reviews:** the 6 Nov review's A–F and the mobile audit's 1–5 are done (N2–N4, V2.47–V2.58); audit 6 and 9 and N4's rest are in N25;
audit 7–8 in N27; review G is N33; audit 2's heavy maps N32; UPGRADE_REVIEW Next 2 is N34; Q5/U5 is N31. Left with the client: `?perf`
(Next 3, N10), the photo from the foot of the lower stairs (Next 6), Q6's beds, monitors and sofa-bed (sizes or names), Q7's view out of
the front, Q8's measurements, dark mode (V1_PLAN phase 8, N9).
**Needs the client:** a yes or no on KTX2 (N31); `?perf` from the iPhone and the PC (N10, N17); dark panels on a dark device or not
(N9's rest).

## 9. Handover (8 Nov 2026, V3.03): where every task stands

The client stopped work on 8 Nov 2026 (as on 7 Nov at V2.74). Start with `docs/HANDOVER.md` (how it runs, what's open, what waits on
Emma), then `docs/NOTES.md`. Done means merged to `main` and live; In PR means pushed, not merged.

| State | Tasks |
|---|---|
| **Done** (live) | N1–N8, N13–N21, N23–N30, N32–N45 (N38 V2.94, N39 V2.96, N40 V3.01, N41 V2.95, N42 V2.97, N43 V3.00, N44 V3.03, N45 V3.02) |
| **Done in part** (what's left is named in its row or folded into a later task) | N9 (dark panels: Emma's call), N11 (the PC's `?perf`), N12 (the iPhone's `?perf`), N22 (KTX2 is N31) |
| **In PR, not merged** | none |
| **In progress** | N31 (#133, WIP: build side only; waits on Emma's OK) |
| **Not started** | section 13 (8 Nov, the new team): N46–N51; N31 waits on the client |
| **Needs the client** | N10 (`?perf` from the iPhone 15 Pro and the RTX 5070 PC); the questions in `docs/HANDOVER.md` |

## 10. Resumed (7 Nov 2026): the rest in parallel chunks

Work resumed after the handover. The "new team" was section 8's sessions (#127–#131); all landed or closed: #121 V2.75, #122 V2.76
(#127 its duplicate, closed), #128 V2.77, #129 V2.78, #130 V2.79; #131 (N26, checks only, no version, landed) and the refresh button (#136, V2.80) after them. The flaky `browser (site)` line (Measure's
save looked at after a fixed 1.2 s) waits for the save now (#135). Each chunk below is one thread; chunks share no files, so they run
side by side. One task a PR, next free version at merge (section 9's rules, `docs/HANDOVER.md`).

| Chunk | Tasks, in order | Owns | Waits on |
|---|---|---|---|
| A Load | N25 a lighter start | `build_viewer.py` head and sheets, `page_router.js`, `07_suggestions_ideas.js`, `room3d_src.py` | the refresh button (#136) landing first (it shares `build_viewer.py`) |
| B Speed | N35 room to room with no shader built: **done** (V2.87) | `01_renderer.js`, `14_views_walk.js` | |
| C House | N30 the gardens → N34 bathroom and master to their photos → N36 soft bedding | `house/model.py`, `survey_data.py`, `EVIDENCE.md`, `tools/compare.py`, `camfit.py`, `08_house_catalogue.js` `hcBed()` | Emma for N30's gardens wishes (start from the photos meanwhile) |
| D Photos | N32 lighter photo files → N31 KTX2 (#133) | `house/textures/`, `02_textures.js`, `export3d.py`, `vendor.py`, the workflow's encoder step | Emma's OK for N31's encoder |
| E Look-over | N33 phone and PC look-over | `page.css`, `room3d_page.py` | after A's and the refresh button's page changes, or rebase on them |
| F Draws | N37 fewer draws for the house (and the living room kept away after a setting change) | `20_go.js` `buildHouse()`, `09_house_views.js` `roomCull()`, that line | #138 landing (it touches `20_go.js` `buildTrees`) |
| Emma | N10 `?perf` from the iPhone 15 Pro and the RTX 5070 PC; dark panels (N9); a microwave photo; the gardens (N30) | | |

## 11. The next round (8 Nov 2026, V2.93): five side by side

The client, 8 Nov 2026: "Continue upgrading"; "Make sure to use more than one agent and split tasks for optimal usage and speed".
Five small tasks, a thread each, no file shared between them (two touch `09_house_views.js`, in different functions). Left alone:
N31 (KTX2, #133: the client's OK), the stairs (#148) and the bin cupboards' doors (#149). Section 9's rules: one task a PR, next
free version at merge, `docs/STATE.md` rewritten, a line in `docs/HISTORY.md`, the row ticked here, `checks.py`'s lines in the PR.

| # | Task | Aim | Owns | Status |
|---|---|---|---|---|
| N39 | Back goes back: standing in a room puts a step in the history, so the iPhone's back swipe, Android's Back and the browser's Back return to the house instead of leaving the site; room to room takes that step's place; the home-screen app (no Back) unchanged; a check in `check_site.py` | Phone and PC UX | `09_house_views.js` (`roomHist`, beside `goRoom()`), one line in `14_views_walk.js` `setView()` | **Done** (V2.96; a card's or a floor's own step left out: a sheet already has one) |
| N37 | Fewer draws for the house (section 8's row, carried on) | Speed | `20_go.js` `buildHouse()`, `09_house_views.js` `roomCull()` | Done (V2.98) |
| N40 | The changes' costs whole: wallpaper's rolls, the picture, the plant and the bedding in a room's Changes card and Plan's house total, each a rough cost (`UPC`, E: UK prices), the same total in Measure's Send | Quality | `16_cards.js` (`UPC`, the list), `23_finish.js` (only what reads a choice's cost) | Done (V3.01) |
| N41 | Lean 3D code: cut what nothing calls in the 3D's parts this round leaves alone (`05`, `06`, `07`, `10`, `11`, `12`, `13`, `17`, `18`), found by a scan of names defined but never used and by esbuild's tree-shaking; lines and the 3D's minified KB before and after, the checks and `tools/gallery.py` the same | Lean code | those parts only | Done (V2.95): 3,093 lines to 3,065, 424.4 to 422.9 KB minified |
| N42 | Keys and names on a PC: every button and pill named for a screen reader (`aria-label` where it's an icon), a clear focus ring, Tab in the order the eye reads, Escape shuts the top card or panel everywhere; a check in `check_site.py` that no button is nameless | PC UX, quality | `room3d_page.py`, `page.css`, `19_controls.js` (keys only) | Done (V2.97): every control named, one ring, Tab top row then the 3D, Esc a layer a press |

**Order:** all five at once. N39 and N42 both add a check to `check_site.py`: each its own function, merge main before merging.

## 12. The round after (8 Nov 2026, V2.96): three more side by side

The client, 8 Nov 2026: "Add anything needed into the plan with the needed agents and start more threads". Three tasks beside
section 11's open rows (N37, N40, N42), sharing no file with them, #149 or #133. Section 9's rules.

| # | Task | Aim | Owns | Status |
|---|---|---|---|---|
| N43 | Opens fast on a weak signal: `sw.js` asks the network for the page first with no limit, so a poor phone signal holds the start; after about 2 s the kept copy, the network's put by for next time; tried on a slowed network | Speed (phone) | the `sw.js` text in `build_viewer.py` only | Done (V3.00): 1 s signal, new in 1.08 s; 6 s, kept in 2.05 s; offline 0.06 s |
| N44 | The kitchen and the hall beside their photos (as N34): `tools/compare.py` and `camfit.py` from a start near each photo's spot (`photo_kitchen_*`, `photo_hall_*`), each difference fixed, sizes cited | Quality | `tools/compare.py`, `tools/camfit.py`, `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | Done (V3.03): the door down 66, the mirror and bench by the box, the kitchen radiator, boiler and empty door frame; the photo's own lens |
| N45 | The catalogue's pieces made real: Add a piece's 25 with soft edges and cited sizes like the house's own (`hcBed` done), the look in `tools/gallery.py` | Design | `08_house_catalogue.js` (not `hcBed`), their `fit.SOURCES` rows | Done (V3.02): 28 pieces, each a real product's size and shape, 4 source rows |

## 13. The new team's round (8 Nov 2026, V3.03): six side by side, one on the client's yes

The client, 8 Nov 2026: "startup a team to complete upgrades you can find where the last team handed off in the handover.md in github.
make sure to review and plan for changes in the most effective manner and implement any further improvements you see fit".
From `docs/HANDOVER.md`'s suggested work, `docs/NOTES.md` section 3's "what's left" and a read of the code at V3.03. The other project's
PRs (#136, #138, #139) all landed; only #133 (KTX2) is open. Section 9's rules: one task a PR, only its files, the next free version at
merge (merge `main` in, renumber, `checks.py --quick`, `build.py --fast`, push, merge), `docs/STATE.md` rewritten over main's, a line in
`docs/HISTORY.md`, the row ticked here, `checks.py`'s lines in the PR, `house/privacy_check.py` before every commit, inside
`tools/perf_budget.json` (lower a number a task wins; each task touches only its own numbers there).

**What the review found**
- **HD draws everything twice:** three's GTAO renders the scene again with a normal material for its normals (NOTES §3: "HD draws about
  twice"); GTAOPass can take the composer's own depth and work its normals from it (`setGBuffer(depth)`, `NORMAL_VECTOR_TYPE` 0), so the
  second pass goes. That is most of the RTX's 371 house and up to 762 living-room draws, and the iPhone's.
- **The living room is the heaviest place:** 254–762 draws by path (the house opens in 188 since N37); its fixed parts (shell, brick,
  shelving, cabinet carcass) are a draw a piece.
- **Code nothing reads** is still listed in NOTES §3 (`growGlow`, `MOV`'s `flat`, the sliding cabinet's paths, unused names in 04, 14, 16, 20).
- **`?perf` has waited since 6 Nov** (N10): a screenshot is a chore. The numbers can ride in Measure's Send link instead, read by `pull_edits.py`.
- **Three photo fits are from before the lens fix** (office, landing, WC): N44 showed the photo's own lens (`compare.TRUE_FOV`) moves things.
- **Seven tasks added UI since the last look-over (N33, V2.88):** Back, Esc and focus, Changes and costs, the 28 catalogue pieces' cards, the
  refresh button. Nobody has looked at them together on a small phone and a wide PC.

| # | Task | Aim | Owns | After | Status |
|---|---|---|---|---|---|
| N46 | One pass for the shade: GTAO from the composer's depth (a `DepthTexture` on its target, `AO.g.setGBuffer(depth)`), no normal pass; the warm-up target the same kind so no shader is built on the spot; the cutaway still cuts the shade. `R3D.perf()` draws in HD (iPhone, RTX: house and living room) before and after, the look in `tools/gallery.py` (the shade's edges no worse; if they are, say so and keep the half-size trick) | Speed (PC, iPhone) | `01_renderer.js` (`aoComposer`, `draw`, `PRE`'s target), the `iphone` and `rtx` draws in `tools/perf_budget.json` | | Done (V3.04, 8 Nov): RTX house 365→190, living 749→387; iPhone with the shade 365→190, 504→264; 126 fewer shaders; look the same, the old black patches gone |
| N47 | The living room's own draws: count its draws by material and piece (`R3D._dbg.scene`), merge the fixed parts of one material into one draw (as `20_go.js` `HBUILD`), keeping apart what Edit moves, a tap finds, a light rigs to or a view hides; draws before and after on the phone and PC paths, `draws_living` lowered; the gallery the same; cut `04`'s unused `aboveAll`, `recP` and `05`'s sliding-cabinet paths while there | Speed (all) | `04_living_shell.js`, `05_dining_cabinet.js`, `draws_living` in `tools/perf_budget.json` | | Done (V3.12, 8 Nov): a frame standing in the room 246 to 235 draws (phone), 260 to 249 (iPhone), 387 to 373 (RTX); from above 444 to 376; at the table for six 275 to 167; the pictures the same |
| N48 | Lean code, the rest (NOTES §3): `growGlow` (12, 13), `MOV`'s unread `flat`, the sliding cabinet's lines in 14 and 16, unused `wheelAcc` (14), `sl` (16, 20), `id`, `wcm` and the duplicate `collide` key (20); found by the NOTES §1/§3 method (ESLint `no-unused-vars` on the joined file, every name grepped across `media-wall/src`, `tools`, `house`, `projects`); lines and minified KB before and after; the gallery the same to the pixel | Lean code | `12_furniture_options.js`, `13_edit_room.js`, `14_views_walk.js`, `16_cards.js`, `20_go.js` (unused names only) | | Done (V3.05, 8 Nov): 2,716 lines to 2,713, the 3D 428.1 to 427.8 KB minified; the gallery the same to the pixel |
| N49 | The office, the landing and the WC beside their photos again with each photo's own lens (`compare.TRUE_FOV`, `camfit` hand starts as N44); each difference fixed in the model, sizes cited, new guesses in Measure | Quality | `tools/compare.py`, `tools/camfit.py`, `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md`, `house/HOUSE.md`, `house/measure.py` | | Done (V3.10, 8 Nov): the WC window 63 wide, its basin, tiles, roll holder, riser and shade where the photo has them; the landing's light and hatch, the office's light; the bathroom door reads 61 (kept 68, tied to the bath; Measure) |
| N50 | Speed numbers without a screenshot: Measure's Send link carries the device's `R3D.perf()` summary (graphics class, quality, frame ms moving and still, draws, shaders; never a place or a name); `pull_edits.py --link` prints it; `?perf`'s box says the same in fewer words. Closes N10 when the client next sends | Speed, UX | `media-wall/src/measure.js`, `tools/pull_edits.py`, the `perfInfo` and `?perf` lines in `17_render_loop.js` | | Done V3.06 |
| N51 | Phone and PC look-over 2 (as N33, for what came since V2.88): the iPhone 15 Pro, SE, Pixel 7, iPad Mini, 1280 and 1920 wide; the welcome, the house, a room, a Changes card, a catalogue piece's card, Measure, Plan's house total, the refresh button, Esc and Tab; fix overlaps, taps under 44 px, cut or crowded text, in fewer words | UX | `media-wall/src/page.css`, `media-wall/src/room3d_page.py` | | Done (V3.11, 8 Nov): six screens shot before and after; 44 px chips (Changes, kinds, Look), Plan's room rows, toasts up top and tap-through, Details on a line, ring inside a card, a tablet's dock a pill, Where the money goes shut to its line |
| N52 | Moving a piece in Edit moves only it (the client, 8 Nov: "in edit mode for moving things it still swings the camera round"): Edit's press caught before the view's controls, the selected piece grabbed by its outline and a finger round it; a site check drags it by touch | Movement | `13_edit_room.js`, `tools/check_site.py` (`edit_drag`) | | Done V3.07 |
| N53 | Overhead and Angled as a map on a phone and a PC (the client, 8 Nov: "When in overhead and angled views it has strange movement too on mobile and pc. Not intuitive"): one finger or a left-drag moves the ground under it (no swing, no lag, a flick glides), two fingers pinch, twist and (Angled) tilt, the wheel zooms to the pointer, a right-drag turns and tilts | UX | `19_view_controls.js` | | Done V3.08 |
| N54 | The PC as smooth as the phone into a room (the client, 8 Nov: "optimise the pc version as much as the mobile version"): count the shaders built on the spot on the RTX path from the house into its floors, the living room and the rooms; warm what's missing off screen; a site check on both HD paths | Speed (PC, iPhone) | `14_views_walk.js` (`warmHouse`, `warmAt`), `roomEnv` in `12_furniture_options.js`, `tools/check_site.py` (`SPOT`), `shaders_spot` in `tools/perf_budget.json` | | Done V3.09: the journey 88 to 2 (PC), 42 to 2 (iPhone); the living room from the house 58 to 0 |
| N55 | A room's Above as a map too (after N53, the same drags as the house's views; the living room's Above at an angle, a finger on a sticker still drags) | UX | `19_view_controls.js` | N53 | Done V3.13 |
| N59 | The stick in every view on a phone (the client, 8 Nov: "add the joystick to all views for mobile movement and make sure pc movement is still optimised"): the map's views move with it, a view from your eyes stands you there, the rest glide; the PC's held keys glide in those too | UX | `14_views_walk.js`, `19_view_controls.js` | N55 | Done V3.15 |
| N60 | The version on the first screen (the client: "the mobile version doesn't have a version number"; it was only in Plan) | UX | `build_viewer.py`, `page.css` | — | Done V3.16 |
| N61 | One front door (the client, 8 Nov: "Downstairs ground still has two front doors"): the bin cupboards' doors, remembered open on the device, lay across the porch in front of the front door; they start shut, aren't remembered, open one at a time, and "Open every door" leaves them | House | `14_views_walk.js`, `19_controls.js`, `20_go.js` | | Done V3.17 |
| N62 | The view down from the hall (the client, 8 Nov: "I can't see down to the lower floor", standing in the hall): the hall's In it and Be there face the doorway down, the stairs and the lower landing in view | House | `14_views_walk.js` (`VIEWS.hall`) | | Done V3.17 |
| N63 | One light for the whole house (the client, 8 Nov: "Make all lighting the same across the house to stop transitions from room to room"): one exposure, fill tint and bulb colour inside, Fast as bright as HD; measured each room's mean, no new light or shader | Look | `12_furniture_options.js`, `11_lights.js`, `09_house_views.js` | none | Done V3.19 |
| N64 | The living room's breast and window corner (the client, 8 Nov: "the plant shelf on the chimney breast and records on the left of the living room window, which means the display shelf would move to the left of the window too") and its Room menu shorter ("Adjust and optimise the living room menu") | Living room, UX | `geometry.py` (`PLANT_LAYOUT`), `ideas.py` (`CASE_CORNER`), `06_moments.js` (`placeCorner`), `room3d_page.py` (Room), the plan's text | | Done V3.21 |
| N31 | KTX2 photos (#133): on the client's yes, the workflow builds basisu 1.16.4 (commit 900e40fb5d25), the page's `KTX2Loader` with the JPEG fallback (NOTES §3), the tint kept at build; GPU memory and upload time before and after on the iPhone path; also `export3d.py`'s unused `A_*` and `BAR2` keys (NOTES §3) | Photos | `02_textures.js`, `export3d.py`, `vendor.py`, `house/textures/build_textures.py`, `.github/workflows/build.yml` | the client's yes | Waits on the client |

**Order:** N46–N51 start together, a thread each; no file is shared but `tools/perf_budget.json` (each its own numbers: merge `main`
just before merging). N31 when the client says yes, from #133's branch (merge `main` into it first).
**With the client:** KTX2 yes or no; the kitchen's door (is there one?); the living room door's width; dark panels or the cream; a
microwave photo. N50 replaces the `?perf` screenshots.

## 14. Finishes and furniture (8 Nov 2026, V3.13): one thread, a task a PR

The client, 8 Nov 2026: "Then continue improving flooring, wall and furniture upgrades." One thread, in turn; each its own files. The
living room's layout (shelves, records) and the house's lighting are other threads' this round.

| # | Task | Aim | Owns | After | Status |
|---|---|---|---|---|---|
| N56 | Upgrade floors to try: herringbone oak, grey oak LVT, stone porcelain in a floor's card, each a real product's size, made here from the oak veneer's grain; costs a m² | Quality | `house/textures/build_textures.py` (`floors`, `TILED`), the new textures, `23_finish.js` `FIN_FLOORS`, `16_cards.js` `UPC.floor`, `fit.SOURCES upfloors` | | Done V3.14 |
| N57 | Walls: panelling to try (a wall's card): shaker or slatted panels to a real product's size, in the wall's paint, round doors and windows | Quality | `23_finish.js`, `16_cards.js` `UPC`, `fit.SOURCES` | N56 | Done V3.18: Shaker (B&Q 97 × 9 strips) and oak slats (27/13 on felt), packs and cost |
| N58 | Furniture: the house's pieces nearer their photos (softer cushions, real legs and handles where they are boxes) | Quality | `08_house_catalogue.js`, `house/model.py` (pieces only) | N56 | Done V3.20: a KIVIK sofa, a HEMNES dressing table, a BESTÅ TV bench added (real sizes, costs) |

## 15. The PC as fluid as the phone, and the panels cleaned up (9 Nov 2026, V3.21): a task a PR

The client, 9 Nov 2026: "i want pc to be better, i dont understand how to give you info but it is still clunky i want fluid like the
mobile version. go through UI areas and info also and review how to improve and clean up these areas to look and be used better".
Measured on her own PC (RTX 5070, 2560 × 1440 at 155 Hz, Chrome on Direct3D 11, a headless copy with its own profile): moving runs at
155 frames a second in the house, the living room and the hall (draws 190–394, a frame 1–2 ms of the page's time), so the card isn't
short. Two things were: the living room picked from the house in its first seconds froze the page 27 s (its 31 shaders through
Windows' compiler on the frame that showed them; a second visit, Chrome's cache warm, 65 ms), and the wheel jumped a notch at a time.
Measured again on V3.26 live (a fresh profile, the room picked as a click does, 4 s after the page opened): the living room opens in
1.1 s (its fly), the longest frame 103 ms; the kitchen after it 26 ms, the main bedroom after 20 s idle 7 ms. The freeze is gone.

| # | Task | Aim | Owns | After | Status |
|---|---|---|---|---|---|
| N65 | No freeze stepping into a room on a PC: where the browser builds shaders in parallel, rooms and hidden parts are asked for beside the page (rooms first, from the house too), and a room picked before it's ready is built first ("Opening ..."), then shown | Speed (PC) | `01_renderer.js` (`precompileBatch`, `compileClipped` roots), `14_views_walk.js` (`warmAt`, `warmTo`, `readyThen`), `09_house_views.js` `goRoom`, `16_cards.js` `upsGo`, `17_render_loop.js` | | Done V3.23 |
| N66 | The wheel eased: each notch spread over about a fifth of a second (the room's zoom, the map's, a walk), the same total | Feel (PC) | `19_view_controls.js` | N65 | Done V3.26: a notch eases out over ~0.2 s (70 ms time constant), the total checked the same here (orbit 18.25 → 15.71 m, a walk 12 cm, eased or not) |
| N67 | The Plan, Build and Buy sheets tidied at 393, 1280 and 2560: one centred column on a PC with the room dimmed round it, full width on a phone, the cost cards two up on a phone, fewer words, bigger taps | Look (PC and phone) | `media-wall/src/build_viewer.py`, `media-wall/src/page.css` | | Done V3.22 (#183) |
| N68 | The cards over the 3D tidied (a wall's, a floor's, a piece's, Changes, Add a piece): one shape (main tray, three buttons, More), nothing cut off on a phone or a PC, fewer words | Look (PC and phone) | `media-wall/src/room3d/16_cards.js`, `media-wall/src/room3d/23_finish.js` (text and layout, not the costs) | | Done V3.25 |
| N69 | The PC's framing: the whole house centred between the rows and the dock with its roof clear (it sat left and under the rows), a panel only as tall as it needs, the View panel without the house's rooms (reached through the 3D) or the find box in the house's views | Look (PC) | `room3d_page.py` (the panel's CSS, `HOUSE_ROOMS`), `17_render_loop.js` `measureShift`, `14_views_walk.js` `setView` | N66 | Done V3.27 |
| N70 | Moving on a PC as a person, not frame to frame (the client: "the pc version still moves extremely rigidly like im moving frames rather than being a person in the room"): a mouse's look round let out frame by frame (its moves came in uneven bursts), ← → turns eased in and out, the phone's stick on the PC too | Feel (PC) | `14_views_walk.js` (`lookPend`/`lookTick`, `walkTick`, `syncStick`), `17_render_loop.js` | N69 | Done V3.28 |
| N71 | Still "slow and blocky when moving" on the PC (the client, 9 Nov 19:04): her PC's frames were quick when measured (about 6 ms moving), so the stepped moves that were left: ← → in a room before you'd walked turned 10° a key repeat, the on-screen arrows stepped every 60 ms; both now glide every frame. `?perf` names the chip, the sharpness and the worst stall, for her screenshot | Feel (PC) | `14_views_walk.js`, `17_render_loop.js` | N70 | Done V3.29 |
| N91 | Still "some stutter when moving" on the PC (the client, 10 Nov: "i want smooth motion like im there when walking through the house"): a scripted walk through the doorways builds and loads nothing new on the step in (shaders, shapes, pictures the same), so the cost is the frame itself: a PC drew the soft shade (AO) and the glow every frame of a walk, near a 144-165 Hz screen's whole frame, and the odd frame missed its turn. Now as the phone: both wait while you move and come back 0.25 s after you stop (`moveLite`; `?fullmove` keeps them) | Feel (PC) | `01_renderer.js`, `17_render_loop.js` | N71 | Done V3.39 |
| N93 | The GPU at the start (the client, 10 Nov: "GPU is becoming very fast when i boot the site"): measured on her RTX 5070 (2560 × 1440, 155 Hz), the house opens and warms in about 6 s and then draws nothing while still, but with the welcome card up its slow turn drew every frame, 156 a second (the 3D engine at 28 %, 7 % at rest), 2.6 times its 60 Hz speed. Now drawn 60 a second at most at its 60 Hz speed, paused with the window behind another, at rest after a minute | Feel (PC) | `17_render_loop.js`, `19_controls.js` (`welcome`) | N91 | Done V3.41 |
| N97 | The warm-up's own waits (the client, 10 Nov: "i want smooth motion like im there when walking through the house"): each new shader read its two error logs and its link state back from the graphics card on first use (three's `checkShaderErrors`), each a wait on the card. Measured on a walk from load through the hall into the living room: 79 programme logs, 158 shader logs and 237 status reads, 474 waits; now 148 (the lists three needs), no logs | Feel (PC and phone) | `01_renderer.js` (`gl.debug.checkShaderErrors`) | N91 | Done V3.45: off on the live site, on under the checks (`navigator.webdriver`) and `?debug`, so a broken shader still fails CI; 0 errors either way |
| N103 | A room's shapes sent ahead (the client, 10 Nov: "i want smooth motion like im there when walking through the house"): its shaders were built ahead, but its shapes went to the graphics card on the frame that first showed them: walking from the hall, 305 shapes (15 MB, 1184 uploads) in the one frame by the living room's door. Now they go after the warm-up's shaders, about 3 ms at a time between frames, drawn at 1 × 1 in one plain material | Feel (PC and phone) | `01_renderer.js` (`geoWarm`), `14_views_walk.js` `warmAt` | N97 | Done V3.51: the same walk sends 7 shapes (1.5 MB, 26 uploads) at the door; 0 errors |
| N72 | The stair curtain openable (the client, 9 Nov 2026: "Make the curtain on the stairwell openable so I can walk up"): Open it / Draw it across on its card, drawn back as you walk up to it, the walk not stopped by it open | Use (phone and PC) | `07_suggestions_ideas.js` (the curtain), `14_views_walk.js` (its solids, walking up), `16_cards.js`, `19_controls.js` | | Done V3.31: walked from the hall to the landing with it on, 393 and 1280 |

## 16. Every room as good as the living room (9 Nov 2026, V3.29): a task a PR

The client, 9 Nov 2026: "improve the graphics quality of other rooms to match like the living room. We should now focus on making
everything look good and then making it customisable". Shot side by side (`tools/gallery.py`, a view a room, by day and evening in HD),
the rooms read flat and grey beside the living room: lit mostly by one even fill (2.6) with their windows at a seventh of the living
room's (10 to its 70), so white walls came out mid-grey with no shape; and any light change in a room (Warmth) put out its sun, its
ceiling light and its windows' light for good. The front rooms look out on a flat green plane to the horizon.

| # | Task | Aim | Owns | After | Status |
|---|---|---|---|---|---|
| N80 | The rooms' light as the living room's: their windows' daylight 60 (was 10), the ceiling light by day 3 (was 1.2), the even fill 1.4 in a room with windows (was 2.6); a room's sun, ceiling and window lights kept when a light changes | Look | `09_house_views.js` `placeRoomLights`, `12_furniture_options.js` `applyLight` | | Done V3.30: whites read white with shape from the window (master 135 to 156 mean grey, the office 129 to 150, the kitchen 121 to 156; the living room 146); no shader or draw added |
| N81 | What the rooms see out of their windows: the front rooms a flat green plane to the horizon. Now a street (a stand-in until the client says what's across the road): the road and pavements both ways, brick terraces opposite with front gardens, walls and hedges, white windows, doors, tiled roofs, chimneys, lamp posts; one draw a finish, no shader of its own | Look | `20_go.js` `buildStreet`, `11_lights.js` `outdoor` | N80 | Done V3.44 (the real view when the client says) |
| N82 | The rooms' surfaces nearer the living room's: the garments with the knit's relief in their own colours; a screen that's off dark glass; the PC's white, its glow, the monitors and the basin's porcelain their own materials again (a note mid-line in `model.MATS` had dropped `screen`, `pc_white`, `pc_glow` since V3.14: grey and matt; the floor upgrade's `porcelain` had taken the basin's) | Look | `20_go.js` `houseTex`, `09_house_views.js` `finishEnv`, `house/model.py` `MATS` | N80 | Done V3.32 |
| N85 | The rooms in HD as the living room: a front room has the front's sun through its window (a patch on the floor; the living room's morning sun from the back was stopped by the room's back wall) | Look (HD) | `09_house_views.js` `placeRoomLights` | N80 | Done V3.33 |
| N84 | Kitchen and bathroom finishes: tile grout relief, chrome, mirror and gloss reflections, the black marble floor | Look | `house/textures/build_textures.py` (`tiles`), `house/model.py` `MATS` (those keys) | | Done V3.34: the marble as the photo, grout 2.5 mm down, tiles' lippage and wavy glaze, chrome 0.06, mirror 0.04; no shader or draw added |
| N86 | Every room's floors, carpets, walls, ceilings, doors and skirting as finished as the living room's (against the photos) | Look | `house/textures/build_textures.py`, `house/model.py` `MATS` (those keys) | N84 | V3.35: the laminate's joints and planks (`seams`), the upgrade floors' boards; looked over: carpets, doors, skirting, ceilings read as the photos |
| N94 | The kitchen's worktop polished as the photos (it read as rough grit): its relief at a quarter, a roughness map from its speckle | Look | `house/textures/build_textures.py` (`polish`), the worktop's pictures | N86 | Done V3.42: no shader added (map, relief and roughness: the marble's mix), +10 KB |
| N95 | Birch read as flat beige (the furniture thread): its grain three times as deep; the WC's splashback as the photo's glazed 15 × 15 tiles | Look | `house/textures/build_textures.py` (`contrast`, `TILED`), `model.MATS` `tile_w` | N94 | Done V3.43: no shader added (the tiles' map, relief and roughness: the marble's mix; the drawn canvas had a bump map), +60 KB |
| N98 | The garage floor read dark, brown and muddy: the concrete scan's swirls at half, its hue three-tenths, MATS a lighter neutral grey and a little sheen (0.85) | Look | `house/textures/build_textures.py` (`contrast`), `model.MATS` `concrete` | N95 | Done V3.46: no shader added, the map 14 KB smaller |
| N87 | The soft things still flat colour given a relief of their kind, in their own colours (no shape changed; the client: "No furniture is done now ... Agents work on improving quality"): the roller blinds and the tapestry's dark border woven, the music room's felt panels knitted, the bath mats' pile | Look | `20_go.js` `SOFT_REL` (`houseTex`) | N82 | Done V3.36: the poplin's map and an existing relief each, as the garments: no new texture or shader |
| N88 | Clear views through the stairwells: up the stairs from the living room without the dark squares, down to the kitchen from the front door | Look | `house/model.py` (`stair_wells`, the first floor's slabs at the stairwell), `20_go.js` (`houseShade`, `roomOf`) | | Done V3.37: shade bands clear of the openings, the lower flight drawn from the hall, the stair wall up to the landing |
| N89 | The rooms' evening in HD as the living room's: the room's own light leads (8.6, the even fill 0.5 to 0.2, the bounce 0.2 to 0.08, the reflections 0.35 to 0.25), a warm pool under it and the sides of things in shade | Look (HD) | `09_house_views.js` `placeRoomLights`, `12_furniture_options.js` `applyLight` | N80 | Done V3.38 |
| N90 | Bug (the client's photo): pale squares with dark rims round furniture on every floor. The shade round a piece's foot was the bounding box of all its shapes (a run of units round a corner: out over the floor; a chair's castors: a square) and dark at its far edge. Now: per box that stands on the floor, dark at the piece | Look (all) | `house/model.py` `piece_shade`, `20_go.js` `pieceShade` | | Done V3.38 |
| N92 | One light through the house (the client: "lighting should stay the same in every room to stop transition changes"): walking or flying through a door, the room's lights (ceiling, windows, fills, sun) ease to the next room's over 0.45 s instead of jumping; the light by the room's size kept (it evens the rooms: evening mean grey 105–142 with it, 102–151 without) | Look (all) | `09_house_views.js` `lightEase` | N89 | Done V3.40; the fade removed V3.57 (N108: every room's lights always on, nothing to fade) |
| N96 | Black pieces read as holes (the desk chairs, the stools, the monitors' backs, the handles: near pure black in every room, no shape): a plain colour darker than #383838 raised to it, its hue kept; screens, glass and the contact shade as they were | Look (all) | `20_go.js` `liftBlack` | N89 | Done V3.44 |
| N99 | The stair curtain back (the client, 10 Nov 2026: "The stairwell curtains are also missing I want them there just with the ability to draw them open and edit them"): up by default, drawn back so the stairs stay open to walk and see; its card has Draw it across / Open it and its colours (Beige, Silver grey, Charcoal); a saved room gets it once | Look | `room3d/00_setup.js` (`DEF`, `S.scback`), `19_controls.js` (`backToPlan`) | | Done V3.47: on by default, drawn back; shots at 393 and 1280 |
| N100 | Walk over the furniture (the client, 10 Nov: "the joystick default view as I'm walking round the house be able to go over things like chairs and the sofa so I can view from corners"): on a walk only the head meets the furnishings (furniture, things on it, appliances, lamps, radiators, switches), so a wardrobe or a wall unit still stops you; no climbing onto them; walls, doors, windows, stairs, banisters and fittings stop the whole body. Movement only: nothing moved or reshaped | Walk | `14_views_walk.js` (`hsolidSet`, `hBlocked`, `livWalls`, `livFurn`, `bodyBlocked`, `floorAt1`) | | Done V3.48: no shader, no draw added |
| N101 | Bug (the client's photo, 10 Nov: "walls sometimes glitch out and appear as brick ... in the doorway to bedroom three looking down the stairs"): standing in a first-floor room with its door open, the stairwell below the banister showed the party wall's bare brick. Only the landing drew the ground floor and the living room's flight; a room seeing the landing through its open door now draws them as the landing does, and a door onto the landing that swings asks again | Look (all) | `09_house_views.js` `applyFloors`, `19_controls.js` `swingDoor` | N88 | Done V3.49: bedroom 3's doorway on a phone 237 draws to 366 (the landing's own is about 380), no shader added |
| N102 | The garage's chipboard box read as flat tan card (a drawn canvas): pressed wood chips 3–16 mm, every way, ±20 % in tone, one in twelve a dark bark chip, a hair of relief between them | Look | `house/textures/build_textures.py` (`flakes`), the chipboard's pictures | N98 | Done V3.50: no shader added (map, relief and roughness: the marble's mix), +88 KB |
| N104 | The windows' glass (the coordinator's split of the client's "Split agents into tasks to optimise those upgrades too"): the bathroom's and the WC's frosted glass showed the garden misted by day and flat navy by evening (the dusk veil drew over it: it wrote no depth). Now by day it glows with the daylight through it, as the photo; by evening dark frosted glass with the room's light on it; clear glass catches more of the room by evening; from outside by day the frosted panes stay pale, not lit. Mirrors are #209's | Look | `09_house_views.js` (`glassTod`, `glassAll`, `finishEnv`'s glass), a call each in `11_lights.js` `outdoor`, `12_furniture_options.js` `envLevels`, `20_go.js` `mat3` | | Done V3.52: colours, strengths and depth only, no shader or draw added; shots at 393 and 1280 |
| N105 | The store rooms', cupboards' and lower stairs' floorboards were a drawn canvas of four stripes: 15 cm boards from the oak veneer's photo, pale and less yellow, ends staggered, a micro-bevel and each board a hair off level | Look | `house/textures/build_textures.py` (`UPFLOORS` `board`), the board's pictures | N102 | Done V3.53: no shader added (map, relief and roughness: the marble's mix), +90 KB; `artex_nor` re-saved smaller to stay in `photos_mb` |
| N106 | The phone smoother while moving (the client, 10 Nov 2026: "Split agents into tasks to optimise those upgrades too"; the phone's thread): an iPhone in HD kept the shade (GTAO) and the glow (bloom, 10 passes) on every frame of a walk or drag unless its frames had already run past 28 ms; now `moveLite` covers `PHONE_HD` as it does a PC (V3.39), back 0.25 s after you stop | Speed (phone) | `17_render_loop.js` (the `moveLite` gate) | N91 | Done V3.54: a walking frame on the iPhone path 40 framebuffer binds, 23 clears, 4 blits to 9, 9, 1; same draws (247 to 234), no shader, still picture unchanged |
| N122 | No step at the doors on a phone: a room change moves its lights, so all 3 shadow maps (2048, the sun's pass alone ~390 draws) were redrawn in one frame (876 draws, 240 a frame otherwise); on a phone while moving, one light a frame (`shStag`), the rest at once if you stop first | Speed (phone) | `17_render_loop.js` (`shStag`, `shStagEnd`, the frame's `draw()` call) | N106 | Done V3.56: worst doorway frame 876 to 615 draws, then 367, 347; no shader, no extra redraw at rest; PC paths untouched |
| N107 | Mirrors that show the room (the hall's and the bathroom's were a painted grey-blue sheen): in HD, standing still in that room, the room is drawn round the mirror a face a frame (six frames) and blurred as the house's reflection, so the glass shows its room; again for the evening; `?nomirror` the sheen | Look (HD) | `09_house_views.js` `mirrorStep`, `17_render_loop.js` (its idle turn), `11_lights.js` (a mirror keeps its room) | N89 | Done V3.57: no shader added (only through the shade's composer, whose frame shaders are already a reflection's kind) |
| N108 | Every room's lights always on (the client, 10 Nov: "From room to room the lights shouldn't turn off and on. Keep all lights on and keep the warm lighting in all rooms so things aren't overly bright"; "when viewing another room from across a hall or doorway I can't see lights on it only shows as I transition in"): the room's own lights, then the rooms it sees (open doors; from the hall the lower flight and landing, the client's pick "Lit stairs and landing below"), then its nearest neighbours', on at once (6 ceiling, Fast 4; 3 windows in HD), each at its own room's level whichever room you're in; V3.40's fade removed | Look (all) | `09_house_views.js` `placeRoomLights`, `lightAt`, `roomReach`; `20_go.js` (the set); `01_renderer.js` `lightIn`; `19_controls.js` `swingDoor` | N92 | Done V3.57: no shader added (the set's size is fixed; the first picture has them at nothing); every shared light the same from 7 rooms, day and evening; evening mean grey 108–142 (was 109–142) |

## 17. The next looks round (10 Nov 2026, V3.54): seven streams side by side

The client, 10 Nov 2026: "Split up work to improve the quality into more agents if it improves timing on getting this done faster or do
a full review to make an upgrade plan then split up tasks". Reviewed on V3.54, every room by day and evening in HD at 1280 × 800
(`tools/gallery.py`) and at phone size (393 × 852, the iPhone's HD path); shots in the project files (`quality-review/`). The rules stay:
no furniture added, moved or reshaped; one warm, always-on light in every room; inside `tools/perf_budget.json`.

**What the review found.** The living room still leads because of its shade where surfaces meet: on every path without GTAO (all but a
big card), the other rooms' wall-to-ceiling, wall-to-floor and corner lines are flat, so the hall, landing, garage and WC read as
cardboard. The artex ceilings are too loud up close on a phone (living room, kitchen). The ceiling bulbs read as unlit white blobs,
even by evening. The doors and white joinery have little shape (the landing's doors). Whites clip on a phone (the master's bedding).
Outside, the trees are noisy leaf cards, a striped band shows on the far hill on a phone, and the roof is flat beige until its photo
arrives. The living room's and a room's Above views sit in a black void. On a phone the living room's Above stickers overlap
("Window corner" cut off) and the walk stick's grey disc is heavy over the picture.

**Not in this round (in flight elsewhere):** always-on lights, the lower stairwell lit from the hall and the mirrors (#209, N107–N108,
"Match all rooms to living room quality": `09` `placeRoomLights` `lightEase` `mirrorStep`, `11_lights.js`, `12` `applyLight`); the phone's
shadow staggering (`17_render_loop.js`, "Make the phone version smoother"); the PC's smoothness ("Make the PC version fluid"). No row
below owns those files or functions. KTX2 (N31, #133) and the real view across the road wait on the client.

**The photo budget was full** (`photos_mb` 9.5 of 9.5 at V3.54; N109 freed 1.6 MB at V3.58, budget 8.7). N109 makes room first: any row that adds a picture waits on it or pays for
itself by shrinking another (say which in the PR). Raising `photos_mb` is the client's call, not an agent's; KTX2 would free most of it.

| # | Stream | Task | Owns | After | Status |
|---|---|---|---|---|---|
| N109 | A Textures | Room in the photo budget: re-save the biggest maps no screen shows at full size (the lawn's and road's relief and colour, the brick's relief, `lr_hessian_nor`, `lr_cord_nor`) at the size a 4K screen shows from where you stand (`build_textures.PX`, `--slim`), gallery pixel-diff to prove no visible loss; aim ≥ 1 MB free; `perf_budget.json` lowered to the new number + 10 % | `house/textures/build_textures.py` (`slim`, `PX`), those maps' pictures, `tools/perf_budget.json` (`photos_mb` only) | | Done V3.58: 9.5 to 7.9 MB, six pictures at 512, the gallery the same |
| N110 | A Textures | Quieter ceilings: the artex's peaks softer and finer (phone, up close: living room, kitchen read as loud grit), its relief nearer the photos of 30 Oct; the map made smaller in the same go | `build_textures.py` (`stipple`, `STIPPLE`), `artex_*` pictures, `20_go.js` `NS` (the ceiling's normal scale only) | N109 | Open |
| N111 | A Textures | Doors and white joinery with shape: the doors' panel grooves and the architraves' and skirting's mouldings catch light and shade (a relief map from the door photos), the white satin's sheen kept | `build_textures.py` (a new `joinery` step), `model.MATS` `door_white`, `door_cream`, `door_wood`, `skirting` keys | N110 | Open |
| N112 | B Shade | The shade where surfaces meet, in every room and on every path (what GTAO gives the living room on a big card): soft dark bands along each room's wall–ceiling, wall–floor and wall–wall corners, made at build from the room's outline as N90's contact shade (`contact` material, no new shader, a draw a floor), fading over 15–25 cm, off where GTAO runs | `house/model.py` (`piece_shade` and a new `edge_shade`, not the pieces), `20_go.js` `pieceShade` | | Open |
| N113 | C Whites | Whites that don't clip on a phone: the bedding, the WC and bath's porcelain and the white units a hair below pure white (as the living room's), so their folds and edges show by day; the black–white balance checked in each room's day shot | `house/model.py` `MATS` (`duvet`, `pillow`, `sanitary`, `gloss` only) | | Open |
| N114 | D Outside | The outside as good as the rooms: the trees' crowns as soft clumps (fewer, larger leaf cards with a darker core, no salt-and-pepper); the far hill's stripe band on a phone gone; the roof's tiles first in the photo queue so the house never opens with a flat roof; the stand-in street's lamp posts and windows warm by evening | `20_go.js` (`buildTrees`, the valley's `trees`, `buildStreet`), the photo order (`02_textures.js` `PWAIT`: the roof's `tile` first), `10_plants.js` | | Done V3.59: no shader or draw added (emissives are uniforms; fewer leaf instances); shots at 393 and 1280 |
| N115 | E Backdrop | No black void: a room's Above and On its own views (and the living room's) over a soft cream-to-warm-grey backdrop in the old design's colours (the page's cream), the whole house's sky unchanged | `01_renderer.js` (`scene.background` only), a small backdrop switch in `19_view_controls.js` | | Open |
| N116 | F Bulbs | The ceiling bulbs read lit: the bulb's glass warm and glowing by day and evening (it's `led` at 1.5, white, so it reads as a white blob without bloom), and a faint warm halo on the ceiling round each pendant (a shared additive disc, no new shader on the paths that lack bloom). Materials only: the lights themselves are #209's | `house/model.py` `pendants` (the bulb's material key only: a new `bulb`), `model.MATS` `bulb`, `20_go.js` `mat3` emissive table | N107–N108 merged | Open |
| N117 | G Phone UI | The phone's overlays tidied: the living room's Above stickers never overlap or run off screen (placed round each other, the smallest dropped first); the walk stick lighter (a thin ring, the knob only while held, the grey disc gone); the first-walk hint once, short | `15_tour_link_stickers.js`, `media-wall/src/page.css` (the stick and stickers only), `room3d_page.py` (the stick's markup) | | Open |

**Streams run side by side; inside a stream, one after another** (they share `build_textures.py` or `model.MATS`). Two streams touch
`20_go.js` in different functions (A: `NS`; B: `pieceShade`; D: trees and street; F: `mat3`'s emissive table): whoever merges second
merges main in first and keeps the other's change. `model.MATS` is shared by A (N111), C and F, each its own keys only. Every row:
before/after at 393 and 1280 in the project files, `tools/checks.py` lines in the PR, `house/privacy_check.py`, the next free version at
merge, its row ticked here and `docs/STATE.md` rewritten.

## 18. Track the upgrades anywhere, and a leaner repo (11 Nov 2026, V3.54): four side by side

The client, 11 Nov 2026: "Continue on from current work on upgrades ... add further upgrades with your own review. Remember to split work
up well with agents". Reviewed V3.54 at 393 × 852 and 1280 × 800 (house, Plan, Build, Buy, the living room, the kitchen). Section 17 has
the looks; this section fills what it leaves: the site's job of tracking the upgrades, and the repo's weight. No row here touches
section 17's files or the threads in flight (finishes and furniture, the PC's smoothness, Edit's camera, #209 lights, #217 doors).

**What the review found.** The progress lives on one device: Build's and Buy's ticks (`page.js`), the rooms' "done" ticks (`16_cards.js`
`dh-done`) never leave it, and Measure's Send carries the numbers, the colours and the speed but not the ticks, so the phone and the PC
disagree on what's done ("so i can use in any location"). Plan opens on the media wall alone (its hello, "Your next three", the rings),
while the whole house's changes sit lower down in "Where the money goes"; the client plans the whole house. Code left from N41 and N48
is still there (NOTES §3: the `S.cab === "sliding"` paths, `aboveAll`, `recP`, `export3d.py`'s `A_*` `BAR2`). `docs/STATE.md` is 286 lines
(its rule is under 150; two rows repeat) and `docs/HANDOVER.md` still describes V3.03.

| # | Task | Owns | After | Status |
|---|---|---|---|---|
| N118 | Progress on every device: Measure's Send also carries Build's and Buy's ticks and the rooms' done ticks; `pull_edits.py` keeps them in `house/client_progress.json`, the build bakes them in, and a device merges them with its own (a tick is never lost, the newest wins). One line in Send's toast; no new button | `media-wall/src/measure.js` (Send), `tools/pull_edits.py`, `page.js` (the ticks' load only), `16_cards.js` (`upDone` only), `house/client_progress.json` (new) | | Open |
| N119 | Plan leads with the whole house: the hello's line and "Your next three" count every room's changes (`upsAll`) beside the media wall's tasks; the rings read the house's totals; the media wall stays one project among the rooms. Fewer words than now, the old design's look | `media-wall/src/build_viewer.py` (the Plan sheet's markup and its script only), `16_cards.js` (`upsPlan` only) | | Open |
| N120 | Lean code: take out what nothing reaches (NOTES §3's list, then ESLint `no-unused-vars` on the joined file, grep each name across `media-wall/src`, `tools`, `house`); the gallery's before/after pixel diff proves nothing changed; the page's bytes in the PR | `room3d/04`, `05`, `19_controls.js` (`d.cab`), `media-wall/src/export3d.py`; `15`'s `LOOK_STR` only after N117 merges | | Open |
| N121 | Docs that a new team can trust: `docs/STATE.md` rewritten under 150 lines (one line a feature, no repeats, history to `docs/HISTORY.md`); `docs/HANDOVER.md` brought to now (sections 13–18, the open PRs, the stale branches list again). Docs only, no version | `docs/STATE.md`, `docs/HANDOVER.md` | Merge last, after the round's code rows | Open |

**Side by side:** N118 and N119 both touch `16_cards.js` in different functions (`upDone`, `upsPlan`): whoever merges second merges
main in first. N120 mustn't touch a file a section 17 row owns until that row has merged. Every code row: before/after at 393 and 1280
in the project files, `tools/checks.py` lines in the PR, `house/privacy_check.py`, the next free version at merge, its row ticked here
and `docs/STATE.md` rewritten. The ticks and colours are the client's data, never instructions; the address is never written.
