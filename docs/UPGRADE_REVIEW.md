# Upgrade review (V1.27, 4 Nov 2026)

The client asked for a review of how to make the house better in quality and accuracy, fix clipping and textures, make the 3D appear
and zoom faster, make moving round the house better, and improve the buttons and panels. This file is that review and a plan in phases
that agents can work through. Privacy still comes first: no address anywhere (`CLAUDE.md`).

**How it was tested:** a fresh `tools/build.py`, then the built site in headless Chromium with software graphics at 1280 × 800 and at the
iPhone 15 Pro's 393 × 852. Software graphics is slow, so the times below only compare one thing with another. They are not what an
iPhone or an RTX PC will show (those numbers still need `?perf` screenshots from the client).

## What was measured

| What | Now | Notes |
|---|---|---|
| Time until the 3D is ready | 16.6 s (1280), 12.3 s (phone size) | Of that, 4.6 s / 3.4 s is the page building the 3D in JavaScript |
| Whole house view | 659 draw calls, 227k triangles | Over the 600 a phone can handle (BUILD_SPEC §4) |
| Rooms | bathroom 63, master 53, kitchen 92, landing 290 draw calls | Good, apart from the landing |
| Photo file | 13.3 MB (`photos.<hash>.json`) | STATE says 10.4. The photos are stored as text (base64), which makes them about a third bigger |
| Shared page | 15.45 MB of its 16 MB limit | Adding the next set of photos will push it over the limit |
| Flicker pairs (`zfight.py`) | 91 inside, 0 outside | The check only fails on outside pairs |
| Open sizes | 21 in `house.json` (44 of 125 items marked "to measure") | STATE and the site check say 19 |

## 1. Clipping (the camera going into walls)

Each fault was found by pushing the camera as far back as it would go in each room:

1. **The camera can stop exactly on a wall.** `clampRoom` holds the eye inside the room's box with no gap (`g = 0`). The near plane
   (5 cm) and its corners at an 80° lens then go through the plaster. In the master bedroom the screen filled with the inside of a wall.
   **Fix:** keep the eye at least 25 cm inside each wall and check a small sphere, not a point.
2. **Sloped ceilings are ignored.** Every room's box is a plain rectangle up to 235. In the bathroom the eye went above the slope into
   the roof space. **Fix:** export each room's ceiling shape from `model.py` (it already has `under_back`) into `house.json`, and keep
   the eye under it.
3. **No furniture collision in the house's rooms.** `collide()` returns straight away outside the living room, so you can walk through
   beds, wardrobes and the bath. **Fix:** treat the item boxes `house.json` already has (with ids) as solid.
4. **Shaking at walls.** OrbitControls keeps trying to move the eye out and the clamp pulls it back every frame. **Fix:** clamp
   inside the controls' own update, or shorten the orbit distance near walls.
5. **Flicker.** 91 pairs of faces share a plane inside the house (for example paint against uPVC at the window reveals, which you can
   see from inside). **Fix:** make `zfight.py` fail on any pair a room's camera can see, and move one face of each pair in by 1–2 mm.
6. **Every house material is double-sided.** That doubles the shadow problems (acne) and the drawing cost for closed boxes. **Fix:**
   front faces only, except for the few genuinely thin parts.
7. **One glass mesh for each floor.** All of a floor's glass is merged into one object, so it can't be sorted against other see-through
   things. **Fix:** a mesh for each window, or `alphaHash`.
8. **Light leaks along wall joins.** The shadow `normalBias` is 0.02 (2 cm at this scale). **Fix:** about 0.005, with a slope bias.

## 2. Speed: the first picture and zooming

1. **It opens on the whole house but builds the whole living room first.** `start()` builds the shell, furniture, lights,
   suggestions and bar, and then the house. **Fix:** build the house first and the living room when you enter it (or when nothing
   else is happening). This should save a large part of the 3.4–4.6 s build.
2. **three.js arrives as about 15 separate files from jsDelivr.** **Fix:** bundle and minify it with the page's own code (esbuild) and
   host it on Pages. This means fewer round trips, it works offline from the first visit, and `THREE_LOCAL` is no longer needed.
3. **Shaders.** r160 has `renderer.compileAsync`. Call it after the cutaway's clipping is set (the reason the v81 `compile()` was
   dropped), so the browser compiles shaders in parallel instead of stalling the first frames.
4. **The whole house draws everything inside it.** From outside, all the furniture behind closed walls is still drawn (659 calls).
   **Fix:** in Outside, hide the inside pieces except through windows near the camera. Show them once a floor is picked.
5. **Photos are tinted on the phone.** `photoInto` reads every pixel of every 1024–2048 px photo on the main thread to match its colour.
   **Fix:** do this once in `build_textures.py`, and decode with `createImageBitmap` (off the main thread).
6. **Photo delivery.** Use KTX2/Basis (QUALITY_PLAN Q5: about a quarter of the graphics memory, nothing to decode on the phone) as
   separate files, loading only the current room's set first. On the shared page, move the photos to the artifact's asset store so
   the page drops well under 16 MB.
7. **Loading feels slow.** For 12–17 s there's nothing to look at. **Fix:** a progress bar and a small picture of the opening view
   made by the build (only for loading, not an HD still).
8. **Zoom:**
   - The wheel and pinch move towards the orbit point, not towards what you point at. **Fix:** `controls.zoomToCursor = true` (r160 has it).
   - In Be there, zoom is off, so pinching does nothing. **Fix:** make pinch and the wheel change the lens (FOV 35°–80°), like a camera.
   - Looking round, the wheel walks 15 cm a notch in jumps. **Fix:** smooth, timed movement.

## 3. Quality and textures

1. **Lens too wide.** Rooms open at 74–84° (up to 95° on a phone in portrait), which stretches the edges. **Fix:** 60–65° to start,
   and widen with pinch or the wheel (above).
2. **Every surface has the same shine all over.** Each photo has only colour and relief (`_map`, `_nor`); roughness is one number for
   each material. **Fix:** add the roughness map from each Poly Haven set (packed with ambient occlusion: ORM) for floors, worktops,
   tiles and wood, so they look worn and real.
3. **Flat light indoors.** House rooms have the sky, the sun and two unshadowed ceiling lights. Machines that don't start in HD get no
   shadows at all. **Fix:** bake the light and shade into the house's fixed shell at build time (light maps or per-vertex shade). This
   adds nothing to the cost of drawing and is the biggest step towards looking like a photo. The living room keeps its live lights.
4. **Labels can't be read on a phone.** Room labels are drawn at a fixed size in the 3D, so from the floor view they're a few pixels
   tall. **Fix:** labels that stay the same size on screen (HTML over the 3D, or `sizeAttenuation: false`).
5. **Small model details.** The verge board sticks out past the gable at the front corner. The ground under the house has no shade, so
   in Fast the house looks like it's floating. **Fix:** add a soft contact shadow under the house, as the furniture has.

## 4. Accuracy

1. **Scan the rooms with the iPhone 15 Pro.** It has LiDAR. Apple's RoomPlan (through apps such as Polycam or magicplan) measures
   walls, doors, windows and big furniture to about 1–2 cm and exports them. One scan per room would settle most of the 21 open sizes
   and the 44 guessed items in an afternoon. Add each scan as a source in `survey_data.py`, the same way as a measurement. Strip any
   location from the files before they go in the repo. Dave's iPhone 16 has no LiDAR.
2. **Compare with the photos.** `house/evidence/compare_*.jpg` exists already. Make it a check: put the 3D camera where each photo was
   taken and lay one over the other, so a size that's wrong shows up as edges that don't line up.
3. **Keep the docs true.** STATE's numbers are behind (photos, shared page size, 19 vs 21 open sizes). `checks.py` could print them
   so they can't drift.

## 5. Moving round the house

Today each room is its own view that you jump to. Walking is in steps (15 cm and 10° a press), and double-tapping the floor only works
on the ground floor (`floorAt` uses the living room's floor at height 0).

1. **Walk mode, a house you can walk through:**
   - **PC:** WASD or the arrow keys with smooth speed, and a mouse drag to look round (with an option to capture the mouse).
   - **Phone:** a thumb stick bottom-left to walk, and a drag anywhere else to look.
   - **Getting about:** tap the floor on any storey to walk there, with a marker where you'll land. Go through doorways (`house.json`
     has the doors) and up and down the stairs along the flight. Your eye stays at 160.
2. **Collision from a plan:** at build time, make each floor's walkable grid (walls, furniture, doors open or shut) from `model.py`.
   This is simpler and steadier than testing boxes every frame, and it fixes items 1.1–1.4.
3. **Smooth changes.** In It · Be there · Above · On its own currently cut straight across (`flyTo(..., true)`). **Fix:** move the
   camera between them (instant when the device is set to reduce motion).
4. **Go in by tapping the house.** In a floor's view, tapping a room in the 3D takes you in, with a soft highlight under your finger.
   The room pills stay for anyone who prefers them. This fits the client's "rooms are reached through it".

## 6. Buttons and panels (keeping the old style)

From the phone screenshots:

1. **The house is small on a phone.** The buttons on the right (home, labels, Angled · Overhead, floors, rooms, Hide buttons) take up
   the top 35–45% of the screen, and the house sits small in the gap. **Fix:**
   - Frame the house in the space left below the buttons, the way the Tools panel already shifts the view.
   - Move Hide labels into View.
   - Put the floors and the rooms in one row.
2. **Plan · Build · Buy shows in every room**, though it belongs to the media wall (review 1.2 point 2 is still true). **Fix:** show it
   only in the living room, or call it the media wall's plan.
3. **The dock shows the living room's tools everywhere.** Room, Look and Edit show in the bathroom. **Fix:** show only what works in
   the room you're in.
4. **The floors row is cut off on a phone** ("Next door" is half off the edge, with no sign it scrolls). **Fix:** a fade at the edge.
5. **The first-visit tip covers the floor buttons on a phone.** **Fix:** move it to above the dock.

## The plan in phases (each a PR, proved by `tools/checks.py` and the gallery)

| # | Phase | What | Size | Status |
|---|---|---|---|---|
| U10 | **Faster GitHub builds (first: the client, 4 Nov)** | The browser checks side by side, Pages published straight after the build, the renders and Playwright kept between runs, documents-only changes skip the browser checks | Medium | In progress (V1.35) |
| U1 | No more clipping | 1.1–1.4 (wall gap, slopes, furniture solid, no shaking); 1.8; the double-tap walk on every floor | Small | Done (V1.28) |
| U2 | Zoom and smooth moves | 2.8 (zoom to the pointer, lens pinch, smooth wheel), 5.3, a 60–65° lens (3.1) | Small | Done (V1.28) |
| U3 | Phone buttons | Section 6 and screen-size labels (3.4) | Small | Done (V1.28) |
| U4 | First picture sooner | 2.1 (house first), 2.2 (bundle), 2.3, 2.4, 2.7 | Medium | Done (V1.29) |
| U5 | Photos | 2.5, 2.6, 3.2 (KTX2, roughness, the shared page under its limit); this is QUALITY_PLAN Q5 | Medium | Done (V1.30) |
| U6 | Flicker | 1.5–1.7 and a stricter `zfight.py` | Small | Done (V1.31) |
| U7 | Walk the house | 5.1, 5.2, 5.4 | Large | Done (V1.32) |
| U8 | Baked light | 3.3, 3.5 | Large | Done, part (V1.33) |
| U9 | Measured | 4.1–4.3 (needs the client's scans) | Needs the client | Done, part (V1.34); the scans need the client |

U1 to U3 can each be done in one round and fix what the client sees most. U4 and U5 make the biggest difference on the iPhones.
Status words as `docs/V1_PLAN.md`. **Agents: work the next row that isn't Done, then update this table and the notes below.**

## What each phase did, and what it found

- **U1 (V1.28):** the house's own pieces (every box, slope, eaves wedge and turned piece in `house.json`) are solid to a 20 cm ball
  round the eye (`room3d.js` `hsolidSet`, `hBlocked`, `houseCollide`): a move into something slides along it, a view that starts inside
  something moves to the nearest free spot. Be there keeps to the room too (it had no limits). The living room's eye stays 15 cm off its
  walls (was 4). A double-tap walks on every floor. The room's sun shadow lifts 0.8 cm off the surfaces (was 2). Tested: the eye pushed
  back, up, left and right in nine rooms stops short of the walls and the slope. Found: an item's card stayed open after going to
  another room (fixed: it closes). Doors (the parts) stay passable; a few ceilings aren't boxes (the landing's east end), so the
  room's box still caps the height.
- **U2 (V1.28):** a scroll or a pinch zooms towards what's under the pointer (`zoomToCursor`); in Be there the wheel and a pinch
  change the lens (25°–100°); looking round, the wheel walks as far as it turns; In it · Above · On its own and Angled · Overhead fly
  instead of cutting (instant with reduced motion). **Changed from the review:** the rooms keep their wide lens (the client asked for
  "a wide angle within the room as if you're there", V1.6); the lens zoom narrows it when wanted.
- **U3 (V1.28):** in the house's views Room, Look and Edit (the living room's) are hidden, and in its rooms Plan · Build · Buy too;
  on a phone the small buttons share a row (two rows over the house, were six), the floors and rooms rows fade where there's more, the
  house is framed in the space under them and stands nearer, the tip sits above the dock, the dock's two buttons are centred; the
  room labels keep their size on screen (a phone: the name only). Found: on a phone the first floor's labels can overlap a little
  (Landing, Boiler cupboard): next, nudge them apart.
- **U4 (V1.29):** measured first (`R3D.timing()`, the start's steps in ms; software graphics, so relative): two thirds of the start was
  building shaders, all inside the first frame (a 6.5–9.4 s freeze here). Now `compileAsync` builds them first (in parallel where the
  browser can; after the cutaway's clipping; into the shade composer's kind of target when it's on), with "Building the house…" up
  meanwhile, then the first frame (54 ms). From outside, the living room's furniture and lights are left out unless the eye is near its
  back window: the Outside view 216 draws (was 659), so it's inside a phone's 600. three.js and its 11 add-ons come in one minified file
  of their own on Pages (`media-wall/src/vendor.py`, `package.json`: `npm ci`; the CDN's import map if Node isn't there, and always on the
  shared page), one request (were about 15 in three waves). First picture here 8.4 s (was 16.1). **Changed from the review:** the living
  room is still built at the start (it shows in the ground floor and through its window, so it can't wait); the waiting is what was cut.
  Next: the iPhones' `?perf` and `R3D.timing()` numbers.
- **U5 (V1.30):** roughness maps (Poly Haven's, the same CC0 assets) on the laminate, the pine and dark pine, the birch, the oak and the
  roof tiles, centred so each material keeps its roughness on average (a stand-in of the map's mean from the start: no shader is built
  again when it lands; not on a phone without a capable chip). Photos decode off the page's thread (`createImageBitmap`, flipped for
  WebGL; an `<img>` where that isn't there). `checks.py` has a `sizes` line (the page, the photos, three's file, the shared page, the
  sizes to measure): it fails at 16 MB. The shared page can fetch its photos from its own asset store (`PHOTOS_URL`, STATE.md
  "Republish"): about 2 MB, was 15.86 inline (the roughness maps added 0.4). **Changed from the review:** WebP saves only 10% here
  (the normal maps don't shrink), so the photos stay JPEG; KTX2 waits for the iPhones' `?perf` numbers (it needs a Basis encoder in the
  build, and saves graphics memory, not download); the living room's four photos are still matched to their colours as they load (a
  few tens of ms, after the first picture).
- **U6 (V1.31):** `zfight.py` now tells the pairs a camera can see (the space in front of the overlap isn't inside another box): 29 of
  the 91. Every material has a depth rank (`house/model.py` `depth_rank`: the structure, then the finishes, then everything fitted, a
  few pairs by name), which `room3d.js` turns into a constant polygon offset, so where faces tie the right one is drawn every frame;
  `checks.py` and `check_model.py` fail on a pair that's seen and tied (0 now). The house's materials are one-sided (the mirrored
  prisms wound back): six views against `?double` differ in under 70 pixels, no holes. **Changed from the review:** the glass stays one
  mesh a floor (looking through one window at another is rare, and it never writes depth, so nothing hides behind it).
- **U7 (V1.32):** Be there in the house's rooms is walking: W A S D or the arrows held (Q, E turn), smooth; on a phone a stick, bottom
  left; drag to look; the wheel or a pinch the lens. A body, not a point: stopped at the knee, the hip and the head (12 cm, so the
  doorway at the foot of a flight clears), up a step of 35 or less, down the stairs following the treads; it slides along what it meets
  and can step out of something it starts in (bedroom 2's spot by the guitars). Walk into a room with its own view and its name, its
  lights and what's drawn follow; a shut door opens as you reach it (95 cm). Tested: across the hall, down the lower flight to the
  lower landing, out of bedroom 2, the stick, the bathroom's door. **Found and fixed in the model:** a full wall across the foot of the
  lower flight (the lower landing and the stairs were two rooms, so `walls_for` put a wall between them: `OPEN_PAIRS`), and the lower
  store's ceiling lying across the flight's steps (it now stops at the flight, as its wall does since V1.20). **Not yet:** the living room
  isn't in the house file (it's drawn on its own), so a walk can't go into it or up its stairs to the first floor; its doorway is shut to
  a walk and the views take you there. Next: bring its walls, doorway and stairs into `house/model.py` (V1_PLAN Phase 5).
- **U8 (V1.33), in part:** the shade where things meet, made once when the house is built (`room3d.js` `houseShade`): a soft band along
  every room's floor at its walls, along the flat ceilings (the lower and ground floors; the first floor's slope would need its own), and
  round the house on the ground (the drive in front, the garden behind), so it sits on the ground. Three or four draws a floor, on every
  device (the live shade, GTAO, only runs on the capable ones in HD); hidden with the ceilings in Above and On its own. **Not done:**
  light baked from the sun and the lamps into the walls (light maps). It needs a renderer in the build (Blender, minutes a floor, a
  second UV set for every piece) and a picture per surface in the download; worth it only if the iPhones' numbers show room to spare.
  Next steps: the first floor's sloped ceilings' shade; the living room drawn from the house file would get the same bands.
- **U9 (V1.34), in part:** `tools/compare.py`: each room's view beside the client's photo it was modelled from, at the photo's shape,
  with the 3D's edges in red over the photo (`_shots/compare.jpg`; seven views). The views' cameras are only roughly where the photos
  were taken, so for now it's a guide; it already backs V1.32: the kitchen photo shows the lower stairs through the kitchen's doorway
  (the stairs open onto the lower landing). `checks.py`'s `sizes` line gives STATE's numbers. **Needs the client:** the room scans
  (iPhone 15 Pro's LiDAR) and the 21 sizes in Measure, when they can measure.

- **U10 (V1.35), the client: "Optimise the build process in order for GitHub uploads to not take so long ... priority on this":** a run
  took 25 minutes and Pages waited for all of it: install 0.5, build 2 (the drawn renders 1.6 of it), the browser checks 22.75 one after
  another (here: the front door 1.6, the media wall's page 2, the taps 6; GitHub's machines are slower). Now (`.github/workflows/build.yml`):
  the `build` job installs (Playwright's browser cached), builds (the renders cached under `tools/render_key.py`, a hash of everything
  they're drawn from but the version; `build.py --keep-renders` renames them for the version), runs the quick checks with privacy on
  the built site, and hands the site on; on main `deploy` publishes straight after. The `browser` job runs site, page and taps on three
  machines at once (`checks.py --only`), and not at all when only `docs/` or `*.md` changed. A pull request's newer push still replaces
  its run; every merge to main now publishes (it used to cancel the one before). Found: the phone's button row (V1.30) caught taps meant
  for the room under it (the tap test): it lets them through now; room labels that would overlap on a phone step aside, the bigger
  room's name kept.

## Next (found while working; agents: take these in order)

1. **The living room into the house file** (V1_PLAN Phase 5): its walls, doorway and stairs as boxes in `house/model.py`, so a walk goes
   in and up to the first floor, the eye's collision and the shade bands cover it, and it's one model.
2. **Camera-match each view to its photo** with `tools/compare.py` (move each view's eye, aim and lens until the red lines sit on the
   photo), then fix the sizes whose lines still miss: the accuracy pass that needs no tape measure.
3. **The client's iPhones' numbers**: `?perf` and `R3D.timing()` from each, then decide KTX2 (U5) and light maps (U8).
4. **Republish the shared page** with `PHOTOS_URL` (STATE.md, "Republish"): about 2 MB, was 15.85 of its 16.
5. **The first floor's sloped ceilings' shade** (U8). (The floor labels on a phone: done in V1.35.)
6. **A photo from the foot of the lower stairs** to confirm V1.32's opening (STATE.md's questions).