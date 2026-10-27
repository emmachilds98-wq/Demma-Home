# v56 plan: the whole house, to a real-looking HD render

Client (25 Oct): "So how can you now improve that to look real. Also fix the living room only view it has a random room clipped on where
you've added the garden view. Fix it and keep it blank if need be through the window for now until the model of the whole house is done.
Write a full plan to get to the full scale upgrade as a HD render and add to the repo"

## Done this round (v56)

- **The living room's own views are clean again:** the garden ground (the house's back wall, the lawn, the fences) shows only in The whole
  house; the window shows a plain sky (light by day, dusk by evening) from inside, nothing from above. The garden photo is switched off
  (`GARDEN_ON = false` in `room3d.js`) until the whole house and its garden are modelled (phase 5 below).

## The handover pack (added 25 Oct, the client: "Make sure the plan also has supporting evidence and photos needed in the report and it's a clear build for another Claude code agent to takeover")

- `house/BUILD_SPEC.md`: the build for the next agent: the code map, the target data model, each phase's tasks and its proof, budgets, gotchas, done.
- `house/EVIDENCE.md`: every source (the client's words, plans, photos, maps), what it tells us, how sure we are; the model's current state (`house/evidence/now_*.jpg`).
- `house/SURVEY.md`: the measurements and the photo shot list for the client, room by room.
- `house/out/Whole_House_HD_Plan.pdf`: all of it as one report with the plans and photos (`python3 house/build_report.py`).
- `house/sun.py`: the sun's position over the house (for phase 4).

## Where we are

The living room is modelled in detail (measured, every piece of the plan, lights, materials, HD with shadows, reflections and glow). The
rest of the house is a v54/v55 draft: rooms as boxes traced from the agent's plans with the client's corrections, stacked at their
levels, walls cut low, no real windows, doors, stairs, roof, outside walls or materials. To look real it needs true sizes, real
construction, real materials and real light, built so a phone still runs it.

## The phases (each one planned, built, checked and merged on its own; the order matters)

### Phase 0 · The survey (the client; we send a checklist)

Exact sizes are what make it look right; everything else builds on them.

- **Per room:** each wall's length (corner to corner, at waist height), the ceiling height, each window (width, height, sill height,
  distance from the nearest corner), each door (width, height, which way it opens, hinge side), radiators, sockets and switches,
  anything solid (chimney breasts, boxing, bulkheads, the cupboards under the stairs). A phone photo of each wall.
- **Between floors:** the stairs (number of steps, the rise and going of one step, the width, where it turns), the floor thickness (from
  the stairwell or the kitchen ceiling to the living room floor).
- **Outside:** the house's width and depth, the height from the lawn to the living room's sill and from the street to the first-floor
  sills, the alley's width and steps, the front drive and lawn, the back garden's width, the fences' heights, the trees.
- **Materials:** each room's floor, the kitchen's units and worktop, the bathroom's suite and tiles, the doors' finish.
- We send this as a printable sheet per room (`house/SURVEY.md` and a PDF), with what the plans already say filled in, so it's a
  matter of checking and correcting. The client sends it in parts; each part goes in as it comes.

### Phase 1 · One true model of the house (`house/house.py` → `house/model.py`)

- Walls as lines with a real thickness (outside walls about 28 cm cavity brick, inside walls about 10 cm), joined at the corners, from
  the survey; every opening (window, door, arch) cut out of its wall at its height. Floors and ceilings as slabs with their thickness.
- The living room's measured geometry (`media-wall/src/geometry.py`) becomes the ground floor's living room in this model: one
  source, no seam.
- Checks: every room's size against the survey (within 1 cm), openings inside their walls, floors stacking (the kitchen under the
  living room, the bathroom and bedroom 2 over it), stairs that reach the next floor. A clash check like the living room's.

### Phase 2 · The building

- **Outside:** red brick walls (the agent's photos), the tiled roof (the gable at the end of the terrace, the dormer of four casements
  at the back), fascias and gutters, the downpipes, the porch with its white pediment, the garage's up-and-over door, the white uPVC
  windows with their Georgian bars (the living room's window design reused for every window, each to its own size).
- **Stairs:** the lower flight (kitchen to the hall) and the upper flight (the hall to the first-floor landing), each to its measured
  rise and going, with the banister.
- **Doors and frames:** every door hung, opening the right way, frames and skirting in every room.
- **The neighbours:** the rest of the terrace to the west and the detached house to the east as simple massing (walls, roofs, windows)
  so the house sits in its street.

### Phase 3 · Materials

- Physically based textures (colour, roughness, bump) for brick, roof tiles, render, concrete, paving, carpet, oak, laminate, tile,
  paint, grass, bark: CC0 sets (ambientCG, Poly Haven), each cited in `house/SOURCES.md`.
- Sized for the web: compressed (KTX2/Basis) at two sizes, the small one for phones; loaded as the camera nears.
- Each room's real finishes from the survey; the living room keeps its plan (the pale mint, artisan oak).
- **Known snag to solve first:** the shared page can't load textures from its asset store into the 3D room (v50: a cross-origin
  texture). Fetch them as blobs and decode them (`fetch` → `createImageBitmap`), or host them on GitHub Pages; test before relying on it.

### Phase 4 · Light and sky

- **The sun from the real direction** (the back faces 14° east of north, the date and time chosen in the page), a physical sky for the
  day and dusk, the right amount of light through each window.
- **Each room's own lights** from its fixtures (the living room's plan as now; ceiling lights elsewhere until the client says).
- **Reflections per room** (a light probe in each room, captured once it settles), so glass and gloss show the room they're in.

### Phase 5 · The site and the gardens

- **The ground:** the slope from the street down to the back garden (two storeys at the front, three at the back), the alley and its
  steps, the front drive and lawn, the pavement and the close.
- **The back garden:** the lawn to the house, the path, the fences, the cordylines, the trees at the end, the rotary dryer; plants as
  instanced models (many copies cheaply).
- **Beyond:** the warehouse, the valley and the hill opposite as a distant backdrop (the client's photos, far away and on a curved
  backdrop, not a flat picture near the window), so the view out of every window is right from every angle. The living room's garden
  photo comes back here, as part of this.

### Phase 6 · The rooms

- Basic fittings from the survey: the kitchen's units and worktop, the bathroom's suite (sink on the left, toilet ahead, the bath),
  the WC, beds and wardrobes as simple pieces, so each room reads as what it is. Detail like the living room's only when the client
  asks for a room's own plan (the core-plan rule: options and other rooms are to look at until then).

### Phase 7 · Rendering in three tiers

1. **Live, phones:** the model at its lightest: the floor you're on in full, the others simplified, the small textures, no shadows;
   30 frames a second on a mid-range phone.
2. **HD, in the page (PC and good phones):** shadows, ambient occlusion, reflections, glow, the large textures, the sun; what the living
   room has now, for the whole house.
3. **Real-looking pictures: path tracing.** A "Render photo" button that traces the light properly in the browser
   (three-gpu-pathtracer: soft shadows, light bouncing off walls, true glass), refining over a minute or two into a picture to save.
   The client takes their own pictures in the page (their rule since v39), so this lives in the page, not as stills we make.
   Optional later: the same scene exported (glTF) and rendered in Blender Cycles off the page, for 360° panoramas.

### Phase 8 · Getting round the house

- The floor picker (done), a room list to jump to any room, walking from room to room and up and down the stairs, the cutaway per
  floor, Out of the window from every window.

### Phase 9 · Checks every phase

- Screenshots of every room and every floor at phone and PC sizes, in each tier; the page's checks (`qa.py`, `taptest.py`) extended to
  the house; the model's own checks (sizes against the survey, clashes); speed (frame time, memory) on a phone-sized test.

## Budgets (so it stays quick)

- Phone: under about 600 draw calls and 400k triangles in view, 150 MB of textures; PC HD: about 2,000 draw calls, 2M triangles, 600 MB.
- Static parts merged per room, repeated parts instanced, floors and textures loaded as you go; the page's size within GitHub Pages'
  and the shared page's limits (textures outside the page itself).

## The order, and what each needs

| Phase | Needs | Gives |
|---|---|---|
| 0 Survey | the client measures | true sizes |
| 1 True model | phase 0 (room by room is fine) | every room to size, stacked, checked |
| 2 Building | phase 1 | outside walls, roof, windows, doors, stairs, neighbours |
| 3 Materials | phase 2 | real surfaces |
| 4 Light and sky | phase 3 | real light, day and dusk |
| 5 Site and gardens | phases 1–2, the garden sizes | the slope, the alley, both gardens, the view out |
| 6 Rooms | phase 1, the client's finishes | each room reads as what it is |
| 7 Rendering tiers | phases 3–5 | quick on phones, HD on a PC, real-looking pictures |
| 8 Getting round | phase 1 | rooms, stairs, floors |
| 9 Checks | every phase | each phase merged only when it passes |

Phases 3–5 can start on the parts already measured; phase 7's path tracing can be tried on the living room first.
