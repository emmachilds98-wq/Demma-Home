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
| R7 | One Look for every room | **In part** (V2.51: the living room joined; V2.57: rugs; V2.59: curtains) | Each room's bedding and a picture (N5); a plant (the Edit thread, N7's catalogue) |
| R8 | Quick everywhere: fluid as a game | **In part** (V2.30, V2.31, V2.42, V2.43) | Load and phone speed (N2–N4); KTX2 once the devices' numbers are in (N10) |

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
| N5 | Look in every room (R7): the living room on the house's rows (pixel for pixel), then each room's rug, curtains or blinds, bedding, a picture, a plant from a short tray; saved in schemes, sent with Send. One PR each: N5a the living room joined; N5b rugs; N5c curtains and blinds; N5d bedding and cushions; N5e a picture (the plant is the Edit thread's, from N7's catalogue) | Look | `23_finish.js`, `room3d_page.py` (Look) | **In part** (V2.51: N5a; V2.57: N5b; V2.59: N5c) |
| N6 | Shapes, second pass (R4): the wardrobes' frames and doors, the hanging clothes as garments (they read as flat slabs), the kitchen's fridge-freezer and microwave fronts and handles, the Kallax's boxes, the chair-bed | Shapes | `house/model.py`, `survey_data.py` | **Done** (V2.53; no microwave in the photos) |
| N7 | Furniture, the rest (R6): swap a piece for another of its kind; add one from the catalogue, in any room | Edit | `08_house_catalogue.js`, `house_edits`, `16_cards.js` | **Done** (V2.55) |
| N8 | Light and surfaces (R1–R3): lamps, shade beside and under pieces, gloss paint, uPVC, brushed metal, the dormer's boards | Light | `01_renderer.js`, `11_lights.js`, `house/textures/` | **Done** (V2.48: the lamps; V2.52: shade by pieces; V2.56: the finishes) |
| N9 | Buttons and flow: a floor's room pills on a computer in one row; the house and its floors framed clear of the buttons (a phone: the roof sat under the floors row; a computer: labels under the rows); room labels squeezed to fit, not cut. Left: dark panels when the device is dark (ask the client first: the cream is the old design) | UI | `page.css`, `room3d_page.py`, `09_house_views.js` | **In part** (V2.46) |
| N10 | From the client: `?perf` on the iPhone 15 Pro and the 5070 PC (decides KTX2); photos or names for N6; what to try in each room for N5 | Client | none | Needs the client |
| N11 | Moving smoothly (the client: "make it fluid and smooth"): the glide the same at any frame rate, a held walk picks up pace; then the frame's cost from `?perf` on the PC | Speed | `17_render_loop.js`, `14_views_walk.js` | **In part** (V2.60: the glide and the walk) |

**Not doing from the review:** removing the page's 3D stills: all but four are on the page or in the plan, and those four are in the
deck's list.
