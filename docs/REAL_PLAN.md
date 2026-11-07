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
| R4 | Real shapes | **In part** (V2.17–V2.22, V2.24, V2.44) | Second pass: wardrobes, clothes, appliances, Kallax, chair-bed (N6) |
| R5 | The things in a room | **In part** (V2.18, V2.19, V2.40, V2.41) | More from the client's photos as they come |
| R6 | Change the furniture in any room | **Done** (V2.32–V2.36, V2.55: move, resize, turn, take out, swap, add) | Swap or add in the living room's project (its own Edit room) |
| R7 | One Look for every room | **Done** (V2.51: the living room joined; V2.57: rugs; V2.59: curtains; V2.61: bedding; V2.62: a plant; V2.63: a picture) | More prints, blinds or plants if the client asks |
| R8 | Quick everywhere: fluid as a game | **In part** (V2.30, V2.31, V2.42, V2.43) | The first picture, moving and KTX2 (section 7: N13–N17, N22) |

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
| N4 | The page's own script minified at build (the source as it is); the living room's suggestions and ideas loaded on first use | Speed | `room3d_src.py`, `build_viewer.py`, `07_suggestions_ideas.js` | **In part** (V2.50: the script minified at build; the suggestions and ideas still load at start) |
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
| N20 | Fewer buttons on top: a phone's top in two rows at most (the view's Angled · Overhead in the floors' row; Hide labels and Hide buttons one button); the floors' and rooms' rows scroll sideways, not wrap | Landing | `room3d_page.py` (`.r3d-mini`), `15_tour_link_stickers.js` `setBare()`, `09_house_views.js` `drawRooms()` | N19 | Open |
| N21 | The outside close up: the 3D beside the client's outside photos (`tools/compare.py`), each difference fixed (the openings' depth, the brick's scale, the porch, the roof's edge), sizes cited | Outside | `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | | Open |
| N22 | Photos squeezed for the chip (KTX2, ASTC on the iPhone): less memory, no upload stall, a sharper photo for the same; the lawn without its repeat (a second, larger variation) | Photos | `02_textures.js`, `export3d.py`, `vendor.py`, `03_materials.js` (the lawn's) | N15 | **In part** (V2.68: the lawn; KTX2 waits on the client's OK for its encoder) |
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
| N24 | Land #122 (N20) then #121 (N21): merge main into each, next free versions, re-run every check, fix what main changed, merge | Land | the two PRs' files | | Open |
| N25 | A lighter start: the icon font only the symbols used (`icon_names=`, not `display=block`); `plan.html` a tiny redirect; the sheets' markup out of the first parse (a `<template>` or built on first open); the suggestions and ideas loaded on first use (N4's rest). Before and after: bytes, elements, time to `r3d-first` | Load | `build_viewer.py` (head, sheets, `plan.html`), `page_router.js`, `07_suggestions_ideas.js`, `room3d_src.py` | | Open |
| N26 | Guard the gains: a budget in `checks.py` (the page's bytes, the first visit's bytes, shaders at the first picture, draws for the house and the living room, on the phone and the PC paths), failing a round that goes over; numbers in `tools/perf_budget.json` | Guard | `tools/checks.py`, `tools/check_site.py`, new `tools/perf_budget.json` | | Open |
| N27 | Fewer shaders, a lighter house: materials that differ only in colour or a number share one program; fewer bevel segments on small or far pieces; `R3D.perf()` programs and draws before and after, the look unchanged (`tools/gallery.py`) | GPU | `03_materials.js` (not `grassy`), `20_go.js` `ROUND` and `PSOFT` | | Open |
| N28 | Trim the plan's code: cut functions, drawings and pages the PDFs and the site no longer use; the PDFs' pages and the site's pictures the same before and after; lines before and after in the PR | Lean | `render.py`, `diagrams.py`, `build_doc.py`, `instructions.py`, `chapters.py`, `make_images.py`, `qa.py` | | Done V2.75 (8,206 → 7,016 lines; every PDF page and picture the same) |
| N29 | Wallpaper and colours that go together (F9, F11): a wallpaper on This wall at its real repeat (CC0 patterns or drawn), rolls counted; each paint's maker pairings, sourced | Finishes | `23_finish.js`, `house/surfaces.py` | | Open |
| N30 | The gardens (F12): fences, paths, the lawn's edges and the plants from the client's outside photos, sizes cited; core where the photos show them, ideas as options | Outside | `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | N24 (#121) | Open |
| N31 | Photos squeezed for the chip (KTX2, N22's rest) | Photos | `02_textures.js`, `export3d.py`, `vendor.py`, `house/textures/build_textures.py` | the client's OK | Needs the client |
| N32 | Lighter photo files: the heaviest maps (the audit's `carpet_grey` normal 489 KB, `lawn` 439 KB, `artex` 402 KB) re-encoded or sized to what they show; a duplicate map shares one file; `sizes` before and after, the look unchanged (`tools/gallery.py`) | Photos | `house/textures/*.jpg`, `house/textures/build_textures.py`, `textures.json` | N24 (#121 touches them) | Open |
| N33 | Phone and PC look-over (the 6 Nov review's G): screenshots on the iPhone 15 Pro, SE, Pixel 7, iPad Mini and 1280/1920 of the welcome, the house, a room, the cards, Measure and the sheets; fix overlaps, taps under 44 px, cut or crowded text, in fewer words | Look-over | `page.css`, `room3d_page.py` | N24 (#122 touches them) | Open |
| N34 | The bathroom and the master matched to their photos (UPGRADE_REVIEW Next 2): `camfit.py` from a start near each photo's spot, `compare.CAMS` filled, each difference fixed, sizes cited | Outside | `tools/compare.py`, `tools/camfit.py`, `house/model.py`, `house/survey_data.py`, `house/EVIDENCE.md` | N30 (same thread) | Open |

**Order:** N24, N25, N26, N27, N28, N29 start together; when N24 lands, N30 then N34 (one thread), N32 and N33; N31 on the client's yes.
**From the earlier reviews:** the 6 Nov review's A–F and the mobile audit's 1–5 are done (N2–N4, V2.47–V2.58); audit 6 and 9 and N4's rest are in N25;
audit 7–8 in N27; review G is N33; audit 2's heavy maps N32; UPGRADE_REVIEW Next 2 is N34; Q5/U5 is N31. Left with the client: `?perf`
(Next 3, N10), the photo from the foot of the lower stairs (Next 6), Q6's beds, monitors and sofa-bed (sizes or names), Q7's view out of
the front, Q8's measurements, dark mode (V1_PLAN phase 8, N9).
**Needs the client:** a yes or no on KTX2 (N31); `?perf` from the iPhone and the PC (N10, N17); dark panels on a dark device or not
(N9's rest); for N30, what you'd like in the gardens.
