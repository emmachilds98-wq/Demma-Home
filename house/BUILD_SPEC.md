# Whole-house HD model: the build spec (for the next Claude Code agent)

> **V1 (27 Oct 2026):** how rounds work is now `docs/V1_PLAN.md` (section 5) and `docs/STATE.md`; the whole-house phases below still
> stand as the house's technical spec. `media-wall/HANDOFF.md` and the `UPGRADE_PLAN_vNN.md` files it names are in the old `DIY` repo's
> history; the v56 plan is here as `house/HD_PLAN.md`. A new piece in `model.py` gets an `o.item(...)` (Phase 1: its id, name, room, source).

You're taking over the 3D model of the client's whole house. The goal: **the best possible HD model of the
house, inside and out, real-looking, quick on a phone**. The living room is done in detail; everything else is a draft. This file says
what to build, where, in what order, and how to prove each step. Read these first, in this order:

1. `CLAUDE.md` (the rules: say less, cite every size, back up before large edits, never write the cap's poem, no mention of Claude in the
   page or PDFs), then `media-wall/HANDOFF.md` START HERE (how to rebuild, check, publish and merge).
2. `media-wall/UPGRADE_PLAN_v56.md` (the phases in plain words, for the client).
3. `house/EVIDENCE.md` (what we know and how sure), `house/SURVEY.md` (what we've asked the client for), `house/HOUSE.md` (the facts).

## 0. How the client works (don't skip)

- Short messages; they expect each round planned (an `UPGRADE_PLAN_vNN.md`, merged first), built in small merged steps, the page
  rebuilt and checked, the shared viewer republished, `main` merged (GitHub Pages is live). Sessions end without warning: merge as you go.
- Their words matter: keep them in comments and the HANDOFF ("face-out", "spine-up", "artisan oak", "tray", "secret room").
- The living room's plan (`geometry.FIRM`) is the core plan; other rooms are to look at until they ask for a room's own plan.
- No HD stills made by us: the client takes pictures in the page (Save as HD picture; later Render photo).

## 1. The code you'll work in

| File | What it is |
|---|---|
| `house/house.py` | The house's data: `FLOORS` (rooms, uses, agent sizes, notes), `GARDENS`, `PLANS` (each floor's rooms traced on the corrected plans, in image pixels), `draft()` → the 3D room's cm |
| `media-wall/src/geometry.py` | The living room, measured (cm; x from the east wall going west, y up from the floor, z from the alcove's breast face, the window wall at `WINDOW_Z` −309); `GARDEN`, `SUN`, `FACING` |
| `media-wall/src/export3d.py` | Writes `scene3d.json` (`R` in the page): the room, `GARDEN`, `HOUSE` (`house.draft()`) |
| `media-wall/src/room3d.js` | The 3D room (three.js 0.160, ~5,000 lines). Key parts: `buildShell` (walls, the window, `view` the sky/garden plane, `garden3d`), `buildHouse` (the draft: `houseG`, `HFLOOR`, labels), `applyFloors` (the floor picker), `VIEWS` + `setView`/`flyTo`/`setAbove`, `applyLight` (levels, exposure, `hemi`, `win`), `buildSun`/`SUNCFG`, `envLevels`/`roomEnv` (reflections), `aoComposer` (AO + bloom), `still()` (Save as HD picture), `reg()` (every material registered), `clipMat` (the cutaway; set `m.clippingPlanes = []` on materials that must ignore it) |
| `media-wall/src/room3d_page.py` | The page round the room: views list (`VIEWS`), the controls, CSS |
| `media-wall/src/build_viewer.py` | Builds `index.html` (GitHub Pages) and the shared viewer's inline copy; `TEXTURES` (kept inline: see gotchas) |
| `media-wall/src/qa.py`, `taptest.py`, `clash.py` | The checks (below) |

Coordinates: one model space, centimetres, `v3(x, y, z)` maps to three.js metres with x flipped. The living room's floor is y 0; the
lower ground floor's is −260, the first floor's +260 (E: to be measured). The back of the house faces −z (14° east of north).

## 2. The target architecture

- **`house/model.py`** (new; phase 1): the house as walls, openings and slabs, generated from the survey, validated, exported to
  `scene3d.json` as `R.HOUSE3` (keep `R.HOUSE` until the new one replaces it). Schema:

```python
Wall = dict(id="lg_kitchen_n", floor="lower", a=(x, z), b=(x, z), t=28.0, h=230.0, kind="outer" | "inner" | "party",
            finish=dict(inside="paint:#...", outside="brick"), source="SURVEY kitchen / EVIDENCE §2")
Opening = dict(id="lg_kitchen_win", wall="lg_kitchen_n", kind="window" | "door" | "arch", at=120.0, w=150.0, h=120.0, sill=90.0,
               design="georgian3" | "plain" | "glazed_door" | ..., hinge="left", swing="in", source="...")
Slab = dict(id="lg_floor", floor="lower", poly=[(x, z), ...], y=-260.0, t=22.0, finish="tile:...", source="...")
Room = dict(id="kitchen", floor="lower", poly=[(x, z), ...], name="Kitchen", use="", ceiling=230.0, finishes={...}, source="...")
Stair = dict(id="stairs_lower", from_floor="lower", to_floor="ground", start=(x, z), dir=(dx, dz), width=85.0, rise=19.5, going=22.0, n=13, turns=[...])
Fixture = dict(id="wc_basin", room="wc", kind="basin", at=(x, y, z), size=(w, h, d), rot=0, source="...")
```

- Every element carries a `source` (a line in `EVIDENCE.md` or `SURVEY.md`); elements without a measured source carry `est=True` and
  show a small "estimate" tag in the page's labels until measured.
- **`room3d.js` `buildHouse3()`** (phase 2): builds walls as boxes split round their openings (no CSG library needed: a wall with a
  window is up to four boxes: left, right, below the sill, above the head), slabs from polygons (`ShapeGeometry` + extrude), stairs
  as instanced treads, windows from the living room's window builder (`WINDOW_DESIGN`) generalised to any size, doors as panels on
  hinges. Merge each room's static meshes (`mergeStatic`), instance repeated parts (treads, bars, fence boards, plants).
- The living room's existing build stays as it is; the new model skips its walls (`skip: "living"`) so there's no double wall.

## 3. The phases: tasks and proof

Each phase: write `media-wall/UPGRADE_PLAN_vNN.md` → merge → build → checks → HANDOFF round → README → republish → merge.

### Phase 0 · Survey in (client-dependent; start at once)

**v58: started from deduced sizes** (`house/survey_data.py`, every number with its source: M, P, F, B, E); measured numbers replace them.

- Send the client `house/SURVEY.md` (and a PDF of it: `house/out/` via the report builder). As parts come back, record them in
  `house/survey_data.py` (one dict per room, every number with the date and "client" as its source) and tick them in `EVIDENCE.md`.
- **Done when:** every room has walls, ceiling, openings and fittings recorded, or is explicitly "estimate" in `EVIDENCE.md`.

### Phase 1 · One true model (`house/model.py`)

**v58: built.** `house/model.py` (rooms, walls with openings, windows, doors, floors, the lower flight, fittings, the roof and dormer; `export()` → `R.HOUSE3`), `house/check_model.py` (43 checks, plan SVGs, overlays). Next: `survey_data.py` → measured.

- Build `model.py` from `survey_data.py` (falling back to `house.PLANS` tracing, flagged `est=True`). Outer walls 28 thick, inner 10,
  party wall to the west 22 (E until measured).
- **Validate** (`python3 house/check_model.py`, new): room sizes match the survey within 1 cm; openings inside their walls and not
  overlapping; slabs stack (kitchen under living room, bathroom and bedroom 2 over it: the client's words); stairs rise exactly floor
  to floor; no wall crosses another except at joints; prints a table and exits non-zero on any failure.
- **Done when:** `check_model.py` passes, and a plan-view SVG per floor (`house/out/plan_<floor>.svg`) matches the client's corrected
  plans when overlaid (save the overlays as evidence).

### Phase 2 · The building

**v66:** skirting in the rooms (`model.skirting`, on the visible wall face where rooms touch), doors shut in every doorway (`door_leaves`; the bathroom's brown), window reveals plastered with boards, the hall's and garage's walls plastered, the front garden and alley on the street's levels, the alley gate. **v58: built** (`room3d.js` `buildHouse`'s `R.HOUSE3` branch: boxes and prisms merged per floor and material; Outside shows the house closed, First/Ground/Lower take the roof and floors off; daylight `skyFill`/`dayLight` in this view only). v59: the neighbours (`model.street()`: two terrace houses west, the detached house east, their gardens) and phase 3's first part (below).

- Outer walls in brick, the roof (gable at the east end of the terrace, ridge E). **The first floor is rooms in the roof** (client, 25 Oct): at the back a
  flat-roofed dormer over the bathroom and bedroom 2 (four casements: rear photo), the pitched roof coming into bedroom 2 as a sloping
  ceiling where the dormer stops (the black block on the first-floor plan; the draft draws it as `bed2_slope`); ceilings follow the roof, fascias,
  gutters, downpipes (rear photo: right corner), the porch with its white pediment and pilasters (front photo), the garage door, every
  window with Georgian bars (white uPVC), doors with frames, skirting in every room, both stair flights with banisters.
- The neighbours: the terrace to the west and the detached house to the east as massing (walls, roof, windows) from the front and rear
  photos.
- **Done when:** stills from the front, the back and the alley match `photo_house_front_25oct.png` and `photo_house_rear_24oct.jpg`
  side by side (save both as `house/evidence/compare_*.jpg`); draw calls within budget.

### Phase 3 · Materials

**v70: the photo-textures are in** for the outside and floors (CC0, Poly Haven; `house/textures/`, `house/SOURCES.md`), inline in the page,
so the cross-origin gotcha below is side-stepped. The rooms' own surfaces stay drawn (their sizes are the photos': tiles, metro, carpet).

**v59: started** with surfaces drawn in the page (`room3d.js` `houseTex`: brick, tile, hung, lawn, concrete, paving, road, carpet, tile_f, board; `worldUV` sizes them to the world, roofs along the slope). This side-steps the cross-origin gotcha. Next: roughness/bump maps, then photo textures (CC0) if a phone can take them.

- CC0 PBR sets (ambientCG / Poly Haven): brick, roof tile, render, concrete, paving, grass, bark, carpet, laminate, oak, tile; each in
  `house/SOURCES.md` with its URL and licence. Two sizes (1K phone, 2K PC), compressed (KTX2 via `toktx`, or WebP if KTX2 tooling isn't
  available), loaded lazily per floor.
- **Gotcha first:** the shared viewer can't load textures from its asset store with `TextureLoader` (cross-origin; v50 broke the
  garden view that way). Use `fetch()` → `blob` → `createImageBitmap` → `THREE.Texture`, test it in the shared page, or keep textures
  on GitHub Pages and the shared page pointing there. Prove it with one texture before converting the rest.
- **Done when:** every surface has a real material; texture memory under budget (`R3D.perf()`).

### Phase 4 · Light and sky

**V1.3: started.** The whole house is always by day (the rooms keep the time set); three's `Sky` over it; the sun that lights it and casts its shadows moved there too (the south-west over the front, 51° up: the back faces 14° east of north, so it's in shade), its shadow box 36 m over house and garden (before, outside was lit by the living room's own low sun, from the north-east at 21°, which bleached the fences and trunk); a haze to the horizon (`scene.fog`, made at start so turning it up builds no shaders); the outside's exposure 0.32, the sun at half the room's (mean 118–154, contrast 32–62 on the stills, inside the targets). Next: the sun from a date and time (`house/sun.py`).


- Physical sky (three's `Sky` addon) driven by the sun position (`FACING` 14°, a date/time picker; the NOAA code is `house/sun.py`, easy to port
  to JS); the sun's shadow camera fitted to the whole house; each room's ceiling lights as area or
  point lights, off unless that room is looked at; a reflection probe per room (`roomEnv` per room, captured on demand).
- **Done when:** day and dusk stills of each floor read naturally (no washed walls: measure mean and contrast as round 45 did: mean
  110–170, contrast ≥ 40).

### Phase 5 · Site and gardens

**V1.3: started.** Ground to the horizon (`room3d.js` `outdoor()`): the street's level in front, the garden's behind, the slope the terrace is built into between them (hidden in the house; by it, the alley's own steps with Gardens on); the lawn tinted to the back photo's green; the fences' boards (`houseTex` `fence`); the cordyline (`survey_data.PLANTS`, `buildPlants`).

**V1.4: the far end and beyond.** The far end's trees (`buildTrees`: a conifer, a clump of tall stems, next door's evergreen; their leaves drawn sprays on instanced cards); the far fences; past them the long low building with grey sheet roofs (with Gardens), the valley's trees and the hill opposite with its houses (with the land, `buildBeyond`, `survey_data.BEYOND`); the land 3 km out, the sky past it, the camera's reach 3 km outside (120 m inside), the haze 40–700 m. 

**V1.5: out of the living room's window.** By day, from inside the living room, the window shows the modelled outside (the garden, its
trees and the cordyline, the building past the fence, the valley and the hill, under the sky lit by the room's own sun, in the haze)
in place of v56's plain sky; by evening the dusk plane as before (`room3d.js` `roomOut`, `outdoor()`). It matches the client's video frame
(`photo_garden_window_24oct.jpg`): the cordyline left, the path and lawn, the end trees, the dark fence right. 25 more draws by day. The
garden photo (`GARDEN_ON`) stays off for good. Next: the view photos laid on the hill.

**V1.6: the gardens round ours.** From the view photos: the round table and three folding chairs by the house (with Gardens);
next door's trampoline and two sheds (with Next door); and through the living room's window, next door's back lawns and fences from the
house file's street (`export3d` `next_gardens`). `survey_data.GARDEN_THINGS`, `buildThings`, `buildNextGardens`.


- Terrain as a height field: the street level at the front (0), the slope down the alley to the lawn (−260 at the back wall), the back
  garden (25 m, width of the plot from the survey), the front drive and lawn; the alley's steps from the survey.
- Plants: cordylines, the end trees, the young front tree, lawn edges; instanced, two levels of detail. Fences (close-board left,
  slatted right with the gate: rear photo).
- **The view beyond:** the client's view photos (`photo_view_full_24oct.jpg` etc.) projected onto a large curved backdrop (a cylinder
  section about 60 m out) behind the garden, so every window shows the warehouse, valley and hill from any angle. Then set
  `GARDEN_ON` true (or retire it) and delete the near photo plane.
- **Done when:** Out of the window from the living room matches `photo_garden_window_24oct.jpg`; the whole-house view from the back
  matches `photo_garden_summer_24oct.jpg`'s framing.

### Phase 6 · Rooms

**v60: the kitchen done from the client's photos** (`survey_data.KITCHEN`, `model.kitchen()`, the chalkboard doors `model.chalk_doors()`,
the Kitchen view `VIEWS.kitchen` with its own `box`). The client is sending photos room by room ("I'll give you more images like this
as we work through the plan"): do each room the same way (its data in `survey_data.py`, a builder in `model.py`, a view standing where
their photo was taken, the photo in `EVIDENCE.md`).

- Fittings from the survey as simple, correctly sized pieces: kitchen units and worktop, the bathroom suite (sink left, toilet ahead,
  bath right), the WC, beds, wardrobes, the office desk. Each room tappable (its card: name, use, size, what's measured).
- **Done when:** each room is recognisable from the client's photos of it.
- **v82:** the bathroom's slope at the roof's pitch to a beam at the dormer's front (`BATH["beam_y"]`, `upper_ceilings`), the dormer's
  ceiling lower behind it; the mirror; ceilings off in Above and On its own.
- **v81:** the bathroom's slope steep from just over the box to where the roof meets the ceiling (`BATH["slope_y0"]`), tiles level at
  125; the hall's radiator, its switch and the whole-wall tapestry (`HALL`); the boiler cupboard's door frame to frame (85); the living
  room left out where it can't be seen (the hall, the garage; the landing by camera layer); no early shader compile.
- **v80:** the lower floor's outline round the lower flight's top (`footprint`, `lower_store_2`); the floor views frame the living room.
- **v79:** the boiler cupboard 70 (its door 58), the flight's top 33 back (`STAIR_GOING` 19.25, `LANDING_D` 65), the living room's three
  view buttons (`syncRmode`).
- **v78:** the landing's doors frame to frame (`FIT_DOORS`), the office's fanlight, no stubs past an open edge (`walls_for`), walls cut
  as a grid (`wall`) and drawn without shared faces (`room3d.js` `sharedFaces`).
- **v77:** the landing open to the stairwell (`walls_for()` skips edges facing `VOID`), the bathroom end from the client's photos
  (`BATH_1`, the door in the corner, the short wall the banister ends at; check_model's two landing checks; `compare_v77_bathroom_end.jpg`).
- **v69 (done in five merges):** Part A (landing doors, bifold, BILLY out, meters) and Part B (shadows, room lights, drawn materials, rounded shapes, radiators/boiler/switches, built when first opened, room reflections, swing checks, compare pictures). Earlier in v69: the bathroom box under the roof, the ceiling inside the dormer face, the dormer top (`trim`, `gutter`, `lead`), the tapestry; the plan for realism (`UPGRADE_PLAN_v69.md` Part B: B1 HD frame per room, B2 materials, B3 lights, B4 shapes, B5 dressing, B6 speed, B7 proof).
- **v68:** the back slope 50° (`ROOF.pitch_back`, `model.KB`), the front wall out 28.4 (`INSIDE.plan_d`, `FRONT_OUT`, `cal()`), the master's storage (`MASTER`, `model.master()`, its lid an exported part `bed_lift`: `Out.part()`, `HPARTS`/`liftBed`/`liftTick` in `room3d.js`), the music room (`MUSIC`), the kitchen's corner; the Whole house button.
- **v67:** the WC (`WC`, `model.wc()`), the hall (`HALL`, `model.hall()`, the stairs' box and the door down), the landing (`LANDING`, `model.landing()`), pendants (`PENDANTS`), grey carpet and laminate as the photos.
- **v66:** two office setups side by side; bedroom 2 cleared for the music room (`MUSIC`, `model.music()`); the kitchen cupboard fitted.
- **v61–v65 done the same way:** the office, bedroom 2 (v65: the music room), the master bedroom (v65: the alcove fitted, open
  wardrobe frames), the bathroom (v65: `survey_data.BATH`, `model.bathroom()`, the Bathroom view), the entrance (v65: the open porch,
  the bin cupboards, `model.porch()`).

### Phase 7 · Rendering tiers

1. **Phone:** only the current floor detailed, other floors as simplified shells; 1K textures (V1.11: a capable phone gets the PCs' set: HD, 3×, the shade, soft shadows, stepping down only if slow); ≥ 30 fps on the emulated
   390 × 844 test (`R3D.perf().frameMs` ≤ 33).
2. **PC HD:** shadows (the sun 4096 on a big GPU), AO, bloom, per-room reflections, 2K textures.
3. **Render photo:** `three-gpu-pathtracer` (pinned version, from a CDN allowed by the page's rules) on the current camera, progressive,
   a progress bar, Save when done; materials mapped to its physical material. Try it on the living room first; keep it behind a
   button (it's minutes of GPU). Never part of the default load.
- **Done when:** phone and PC budgets hold (below); a path-traced picture of the living room and one of the whole house from the garden.

### Phase 8 · Getting round

**v66:** every room a person stands in has a view (landing, hall, garage, WC added; `ROOM_VIEW`), so each room button lands inside. **v64:** The whole house has Outside / First / Ground / Lower, two switches (Gardens, Next door: off by default, the client: "so I can look at just my own house"), and on a floor its rooms as buttons (`drawRooms`, `ROOM_VIEW`: into a room's own view, else from above). Room views: `kitchen`, `office`, `bed2`, `master` (a `box` keeps the eye in). Next: views for the other rooms, walking between them.

- The floor picker (done), a room list (tap → fly to the room, its floor shown), walking through doors and up the stairs (extend
  `floorHop`/walk to change floor on the stairs), Out of the window for every window (**V1.10: done**, by day, from In it and Be there).

### Phase 9 · Checks (every phase)

- `cd media-wall/src && python3 clash.py && python3 qa.py <dir> && python3 taptest.py <dir>` (errors and fails []); headless needs
  `THREE_LOCAL` (three@0.160 package) and Chromium at `/opt/pw-browsers/chromium`.
- Add `house/check_model.py` (phase 1) and a house screenshot script (`house/shots.py`: every floor, every room, phone and PC, day and
  dusk) whose output goes in `house/evidence/now_*.jpg` each round, so the next agent sees the current state.
- **Flicker (v65):** `python3 house/zfight.py` lists every pair of faces in one plane facing the same way (they flicker); `check_model.py`
  fails on any outside the walls (the outside faces, the roof edges, the street). Fix by trimming or nudging one face 0.3–0.6, never by
  moving a whole wall.
- Don't run two headless browsers at once (the lamp tap flakes under load); don't `pkill -f` a pattern that matches your own shell.

## 4. Budgets

| | Phone (Fast) | PC (HD) |
|---|---|---|
| Draw calls in view | ≤ 600 | ≤ 2,000 |
| Triangles in view | ≤ 400k | ≤ 2M |
| Texture memory | ≤ 150 MB | ≤ 600 MB |
| Frame time | ≤ 33 ms | ≤ 16 ms on a real GPU |
| Page (GitHub Pages) | textures as separate files, lazy | same |
| Shared viewer | the page ≤ 16 MB; textures by `fetch` (see gotchas) | same |

## 5. Known gotchas (learned the hard way)

- **Cross-origin textures in the shared viewer** (v50): `TextureLoader` on `/_blob/...` fails silently; keep 3D textures inline or fetch
  them as blobs. `build_viewer.TEXTURES` lists the inlined ones.
- **The cutaway:** every material gets clipping planes at start-up unless `clippingPlanes` is already set; house materials set `[]`.
- **Views from above** call `setAbove(false)`: the stairwell's upper walls and the window's sky plane hide; `garden3d` and `houseG`
  show only in The whole house (`setView`). Keep the living room's own views free of house/garden pieces (the client called it "a random
  room clipped on").
- **Camera limits:** `controls.maxDistance` is set in `flyTo` (16 from above, 90 for the house); the camera's far plane is 120 m.
- **Light:** `applyLight` sets exposure, fill (`hemi`) and the window light per day/evening; measure stills before and after any change
  (mean, contrast) and record them in the HANDOFF.
- **Shader compiles:** lights that come and go rebuild every shader; keep lights in the scene and set intensity 0 (the sun does this).
- `still()` doesn't re-run `applyLight` when already HD: set state with `R3D.set` before a still.
- **Corners and gables (v65):** the walls along x take an outside corner whole, the end walls only reach past their plaster; the gables
  start over the first floor's walls. Earlier the plaster ran out to the brick face and showed as white strips.
- **Layers on the ground (v65):** lawn, drive, paving and road all start from one base (−21) side by side; nothing shares a top face.
- Python edits with `'` inside JS strings: write the edit script to a file (heredoc with a quoted delimiter) rather than inline.

## 6. Definition of done (the whole house)

Every room to its measured size; real construction (walls, openings, stairs, roof); real materials; real light by day and dusk; both
gardens and the slope; the view out of every window; phone quick, PC HD; Render photo; every number sourced; the checks green; the
client says it looks like their house.
