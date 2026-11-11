# Notes from the threads: how things work, what bit us, what's left

What the agents learned while doing each task, so a new team doesn't find it again from zero. Until 8 Nov 2026 these lived only in
the project's memory, outside GitHub. Facts about the house are in `house/HOUSE.md`, the client's choices in `docs/DECISIONS.md`,
what's true now in `docs/STATE.md`. Two older reviews are in `docs/reviews/` (the 6 Nov upgrade review and mobile audit, both at V2.44).

## 1. Working in the sandbox
- **three.js:** jsDelivr is blocked. `npm ci` gives the local bundle; for the browser checks set `THREE_LOCAL` to an unpacked
  `three@0.160.0` package (`npm pack three@0.160.0`, then untar it). fonts.googleapis is reachable.
- **Python:** `pip install -r media-wall/requirements.txt` and `playwright==1.63.0` (it must match the browser in `/opt/pw-browsers`;
  set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Test scripts use `localcdn.route(pg)` and `pw.launch(p, pw.GL)` from `media-wall/src`.
- **Speed of a run:** the full `tools/checks.py` takes over 10 minutes here: run it in the background. CI takes about 20 minutes.
- **Software graphics:** headless Chromium draws with SwiftShader, 0.25–3 s a frame, and has no `KHR_parallel_shader_compile` (the
  iPhone's Safari has it since 14.5). Frame times mean nothing; count shaders, uploads and draws a frame. Key tests count frames, not sleeps;
  to test frame-time logic, fake the rAF timestamp (+30 ms a frame) in an init script.
- **Faking a device:** Playwright at 393 × 852, DPR 3, `isMobile`, `hasTouch`, an init script that answers "Apple GPU" for
  `UNMASKED_RENDERER` (0x9246), or an RTX 5070 for the PC's HD path. Wrap WebGL `linkProgram`, `texStorage2D`, `drawElements` and rAF
  to count compiles, uploads and draws per frame. Tag the shadow pass by wrapping `shadowMap.render`.
- **No shader built:** dump `R3D._dbg.gl.info.programs` (name | cacheKey) before and after; after must be a subset.
- **A free camera:** `R3D.set({aim})` keeps the camera in the view's room. Set `R3D._dbg.camera.position` instead, in metres:
  world = (−x/100, y/100, z/100) from the model's cm (x mirrored). Raycast `R3D._dbg.scene` (every parent visible) to see what a pixel is.
- **Touches:** Playwright's touchscreen only taps; for drags, pinches and twists send CDP `Input.dispatchTouchEvent` (a
  `new_cdp_session`, `touchStart` / `touchMove` / `touchEnd` with `touchPoints`). The rig's ~1 s frames fold quick moves into one
  `pointermove`, so a flick is sent as `PointerEvent`s from the page. Chrome hands each finger's move on as its own
  `pointermove`, so a two-finger gesture must wait till both have moved before it decides what it is (N52's tilt read as a pan).
- **Textures:** CC0 sites (Poly Haven, ambientCG) and GitHub release downloads are blocked; new textures are made in
  `house/textures/build_textures.py` (`--finishes`).
- **Glaze and lippage (N84):** a normal map's step is 1/127.5: a tile's tilt under about 0.01 doesn't show; 0.012–0.02 a tile breaks the reflections as real lippage does.
- **Git:** force-push is refused. After a merged PR, restart the branch from `origin/main` (a fast-forward push works).
- **The gallery:** `tools/gallery.py _site` shoots fixed views; a before/after pixel diff proves a code trim changed nothing.
  `--catalogue k,k` puts catalogue pieces in the garage (`_shots/catalogue.jpg`). Bedding needs a viewport over 700 px (`clothBox` is skipped on `LOWD`).

## 2. Merging when threads run side by side
- **Versions race.** Each PR takes `VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` and its plan row, and main moves every few
  minutes while CI runs about 20. Take the version **at merge time**: once the code is green, merge `main` in (a merge commit, not a
  rebase), take the next free version, `checks.py --quick` and `build.py --fast`, push, merge straight away. Never take a version below
  main's. A docs-only conflict needs no second full CI wait. Numbers lost in races (V2.81, V2.84–V2.86) were simply skipped.
- **A PR that conflicts with main gets no CI** (no merge ref): merge main first. A draft PR once got no runs until marked ready.
- **Docs-only PRs** skip the browser jobs (the workflow's "Only documents changed?" step) and take no version.
- **Flaky checks:** `browser (site)` "Measure didn't keep the number typed" was a fixed wait against Measure's 600 ms debounce;
  #135 waits for the saved row. Draw counts in CI vary: once `rtx draws_house 817 > 640` against 569 locally and on main, and once
  `iphone draws_living 945 over 295` locally. Re-run before hunting a cause; screenshots are in each run's `screenshots-site` artifact.
- **The 3D's parts share one scope** (`room3d_src.py` joins them): a new top-level name can clash (`shown` once stopped `R3D.ready`
  ever firing). Put a `// note` at a line's end only: one put mid-line in a one-line statement commented out the rest of it.

## 3. Speed: what was done, how, what's left
- **The first picture (N12, N13, N14):** photos sent a few at a time (`upStep`, `gl.initTexture`; `texPut` disposes every clone first:
  they share GL storage); the house's materials always carry 6 clip planes (`houseClip`) so a cut builds no shader; `compileClipped`
  (`01_renderer`) asks for shaders grouped by plane set, each group primed by a light-less speck (`prime`); `postWarm`, `texWarm`,
  `preDraw` warm the composer, photos and shadows; only what the landing shows is built first, the rest after the picture (`warmRest`).
- **Room to room (N35):** `14_views_walk` `warmNear` warms a room within 1.5 m (`warmRoom`). three 0.160's shared `_depthMaterial`
  keeps the program of the first object drawn per light state, so stand-in depth materials (`depthMat`) cover every (side, map) mix.
  Walking hall → living room → landing → lower floor built 36 shaders on the frame that drew them; now 1.
- **From the house (N54):** warmSwitch only ran standing in a room, so picking the living room from the house built its 58 (its
  36 lights) on the spot; `warmHouse` visits it and each floor (`hfloor`) off screen, `livShow()` first (it's put away from outside).
  A cube camera's pass with `localClippingEnabled = false` builds a whole set of 0-plane shaders: move the planes aside instead
  (`roomEnv`). Find such shaders by diffing `gl.info.programs` cacheKeys before/after a step: index 48 + 2 per define is
  `numClippingPlanes`. `check_site` `SPOT` counts programs first used on the frame they were linked (rAF and WebGL2 wrapped).
- **Moving (N11, N17):** the page draws only when something changes (`17_render_loop` `need`). Damping is frame-rate free (`DAMP`).
  A slow phone walks without the shade and glow, then draws at 1.5× (`phoneCap`).
- **Draws (N16, N37):** `20_go.js` `put()` sorts a floor's merged meshes by room (`userData.rooms` spans); `09` `roomCull` cuts rooms by
  draw range through a door graph (`RLINK`). `HBUILD` makes one draw per (group, material); from outside `joinBuild` joins floors and
  `houseJoin` sets one draw range. The house opens in 188 draws (was 287). Left: rooms gained little (frustum culling already did most);
  the landing's ~380 on a phone is the living room down the stairwell; HD draws about twice (the GTAO normal pass). Next: the living
  room's own draws, or the GTAO pass.
  N47 (V3.12): the living room's fixed parts one draw a material (`04` `bucket`, `mergeStatic` on the cabinet, stairs, chairs). What's left
  standing in it (phone 235): the house round it ~60 (`G#65`, `roomCull`), the record table under the coffee table 19 and the pouf 22
  (07, nested groups `mergeStatic` skips), the shell's suggestion groups ~33 (07, 10), the walls a draw each paint (each wall its own
  material, so Look can colour one). `check_site.py`'s `draws_living` sometimes reads the house's number (185) on the PC and iPhone paths: the view hadn't landed; count a frame yourself. V3.26: its `still()` now waits for a frame drawn since (CI's frames take seconds, so 600 ms read the fly's last frame, house and room both: 770–945).
- **Bytes (N2–N4, N25, N32, N43):** photos a hashed JPEG each in `_site/tex`, kept across versions (`demma-keep`); half-size set for
  `LOWD` phones; esbuild minifies the page; icon font subset; sheets in their own file; fonts don't block; no texel finer than a 4K
  screen shows (`build_textures.PX`, `--slim`). Tried and dropped: lower JPEG quality (3–8 dB lost for 5–10%), progressive JPEGs.
  `sw.js` waits 2 s for the page (`WAIT`), then serves the kept copy (tested with a local server whose delay is set by a `.txt` file).
- **KTX2 (N22/N31, PR #133, WIP):** basisu 1.16.4 pinned at commit 900e40fb5d25, built in CI (no encoder can be fetched here); three's
  `KTX2Loader` and its basis transcoder (0.5 MB wasm) copied into `_site`; the compressed data put into the same texture objects so no
  shader changes; JPEG fallback. The tint must stay at build (compressed textures can't be tinted on the page). Waits on Emma's OK.
- **Lean code (N28, N41):** method: join the parts (`room3d_src.js()`), run ESLint 9 `no-unused-vars` on the one file (install ESLint
  in a scratch folder, not the repo), read each part, grep every name across `media-wall/src`, `tools`, `house`, `projects` (`R3D.*`
  hooks are called by `shot3d.py` and `check_site.py`), prove with the gallery. N48 (V3.05) cut 12, 13, 14, 16 and 20's;
  `movable`'s `_flat` stays by place (04 and 07 pass it). Left: the `S.cab === "sliding"` paths in 05, 15 (`LOOK_STR`) and 19 (`d.cab`),
  `export3d.py`'s `A_*` `BAR2` keys, 04's `aboveAll`, `recP` (N47).

- **A room's light (N80):** `applyLight` zeroes every light but the fill in a room of the house; it must leave the house's own (`userData.houseLight`) and the sun alone, as `placeRoomLights` runs before it, not after (a second change of a light left rooms lit by the fill alone). To compare a room with the living room, shoot both and take the mean grey (about 150 is the living room's by day).
- **A material that's lost (N82):** a key with no row in `model.MATS` draws as `mat3`'s grey `#cccccc`, matt, with no error. A `# note` mid-line in that dict once dropped three (V3.14 to V3.32). To check: every quoted first argument of `o.box`/`o.prism`/... in `model.py` against `model.MATS`; a raycast in the page shows `material.color` `cccccc`.
- **One light (N63):** to compare rooms' light, shoot each view (`R3D.set({view, tod, quality})`, 3.5 s) at 640 × 400 with the UI hidden
  and take the mean grey: the rooms' own colours spread it about ±20, so look for a view outside that. A light that's always visible
  (the sun, `skyFill`, `hemi`) can change intensity or colour freely (no shader); `visible` or a new light rebuilds them. In Fast the living
  room has no window light, so `skyFill` (otherwise 0 there) fills it. After setting a light by hand, `dispatchEvent(new Event('resize'))` to redraw.

- **The GPU at rest (N93, V3.41):** the loop draws only when `need` is set, so a busy card while still means something keeps setting it. Measured on the client's PC (headless Chrome `--use-angle=d3d11`, a temp profile, CDP; wrap `bindFramebuffer` and the draw calls to count frames drawn to the screen, and sum `\GPU Engine(*engtype_3D)\Utilization Percentage`): with no welcome the house warms in about 6 s and then draws 0 frames a second. The welcome's `controls.autoRotate` drew every frame (three's turn is a step a frame, so a 155 Hz screen spun 2.6× too fast); now `SPIN` in `17_render_loop.js`. Anything new that animates on its own should go through the same cap.

## 4. The house beside its photos
- `tools/compare.py` pairs a photo with a view (`PAIRS`; a second photo of a room is `<view>_<what>`, e.g. `hall_front`);
  `tools/camfit.py` fits the camera. A sweep can't find the bathroom or the master: they need hand starts (`camfit.START`, solved from
  the photo's corners) and the bathroom door open (`compare.OPEN`).
- **The lens cap:** the page's `fitFov` caps a tall view at 95° and reads `aim.fov` as a 16:9 lens, so a phone's 0.5× photo (about 108°
  on a tall photo) can't be matched. Put the key in `compare.TRUE_FOV` / `LENS` and start near 108° (portrait) or 90° (landscape).
- **A hand start (N49):** read a few points whose room cm are sure (a wall's four corners, a ceiling corner, a fanlight, a switch) off the
  photo on a pixel grid, then solve the eye, turn, tilt and roll at the photo's lens by least squares (scipy, in a scratch folder); a
  wall seen square on gives its own sizes by its four corners alone (a homography). A wide (landscape) 0.5× photo is about 90° up.
  Clutter and the client's planned furniture fool `camfit`'s edge score: check the side-by-side by eye.
- The outside photos are wide-angle and distorted, so fits don't converge: read heights as shares of drive-to-gutter in one column of
  the picture; the first floor's sills and heads (0.71 / 0.96) are the ruler.
- The kitchen-from-the-landing photo couldn't be fitted and was dropped. Bedroom 2 is the music room: no bed there.

## 5. The site's features: where they live
- **Look's rows** (`23_finish.js`, `S.fin[room]`): 0–3 walls, 4 ceiling, 5 floor, 6 bulb, 7 lux, 8 fitting, 9–10 outside, 11–16 the
  living room's walls by name, 17 its skirting and door, 18 rug, 19 curtains, 20 bedding, 21 picture, 22 picture's wall, 23 plant,
  24–25 wallpaper, 26–27 panelling (N57; `finWallRun` gives any wall its face, openings and ceiling line). A new slot goes in `finClean`, the Paste filter, `roomUps` and a cost in `UPC`.
- **Changes and costs** (`16_cards.js`): `UPC` rough UK costs (E, Nov 2026; a floor per m²), `roomUps(room)` a room's changes, card id
  `ups:<room>`; done ticks in `localStorage` `dh-done` (this device only, not in Send); `upsAll()` gives the total for Plan and Measure.
  The 3D's `qs` is scoped to its root: use `document.getElementById` for the sheets' elements.
- **The catalogue** (`08_house_catalogue.js`): every piece has a `ref` to a `fit.SOURCES` row and a short `src`; `checks.py` sizes fails
  a piece with none. Soft edges come from the material (`20_go.js` `ROUND`/`CLOTH`).
- **Lamps:** `survey_data.LAMPS` → `model.room_lamps`; the viewer reuses the room lights' uniforms (no rebuild). **Shade under pieces:**
  `model.piece_shade`, moved with edits (`08_house_edits.js editedFloor`).
- **The refresh button:** `.hello .ver` in Plan; the ↻ is CSS `::after` (`qa.py` reads the text); `version.txt`; handler at the end of
  `page.js`. To see a new round on the phone: open Plan, tap the version.
  The version also shows faintly in the brand pill (`.brand .bver`, V3.16): the client looks for it on the first screen, not in Plan.
  On an iPhone SE (375) the brand and Plan · Build · Buy already touch (the nav's 44 px min-widths), so it's hidden at 380 px and under.
- **Landing and welcome:** `build_viewer.LANDING_JS`, `r3d-first` → `demma-landed`; the welcome once a device (`demma-welcome`);
  automated browsers skip both unless `?landing` / `?welcome`.
- **Who gets a press first** (N52): OrbitControls listens on the canvas from `01` (first), Look round's turn (`14` `LD_`) in the
  canvas's capture phase, Edit's drag on the 3D's root in capture (`13`), so it can `stopPropagation` before any of them; `controls.enabled
  = false` in a later listener doesn't stop the capture ones. `movable`'s 8th argument isn't "fixed": the rug drags (only `extra.fixed` holds a piece, and none has it now).
  Synthetic `PointerEvent`s can't take `setPointerCapture`: drive touches through CDP `Input.dispatchTouchEvent` (`check_site.py` `edit_drag`).
  A test that works out a screen point with `project(camera)` right after the view turned must call `camera.updateMatrixWorld()` first
  (only a drawn frame updates it; CI's take seconds), and wait for the page's state (the selection, the saved layout), never a fixed time (V3.55).
- **Back** (`09_house_views.js` `roomHist`), **Esc** (`19_controls.js` `ESC`, top layer only), **Overhead/Angled** and a room's **Above** (`19_view_controls.js` `mapMode`: its own drags, the orbit's off there, V3.08 N53, V3.13 N55; a touch on a living-room sticker joins the drag from the root's capture, and moves are read on `window`, as the sticker keeps its finger; it turns them off in a canvas capture listener after 14's, and Edit's root capture keeps a piece's press from it).
- **The stick** (V3.15 N59): `14_views_walk.js` `STICK` sets `WALK.stick`; walking reads it in `walkTick`, the map's and the free views in
  `19_view_controls.js` `mapKeys` (with the held keys), a view from the eyes calls `startWalk` (`eyeView`). A mouse drag on it in Playwright
  is enough to test it (it never reads `pointerType`); check `stick_all`. Note: `pip install -r media-wall/requirements.txt` can lift
  Playwright past 1.63.0 and its browser; put 1.63.0 back.
- **Moving a breast piece to another wall** (N64): the media wall's groups (`G.*` from `scene3d.json`) and the ideas (`IDEA_G`) are built
  in the breast's place; turning one round onto the window wall is a group transform, not a rebuild: rotation.y = π, x = −(old centre +
  new centre)·M, z = the new wall's z·M (`06` `placeCorner`; x is mirrored in `v3`). The plan's layout is one name (`geometry.PLANT_LAYOUT`),
  but the plan's text, fit rows, buy rows and build steps name places in words: grep "breast", "corner" and the piece's name across
  `media-wall/src/*.py` when a piece moves (`clash.py` proves nothing overlaps).
- **What stops a walk** (V3.48 N100, `14_views_walk.js`): `bodyBlocked` tests a knee, a hip and the head. Walls, doors, windows, stairs, banisters and fittings (`HSOLID.wb`, `livWalls`) meet all three; the furnishings (an item whose kind is in `WALK_OVER`, `livFurn`) only the head, so you pass over a sofa but not a wardrobe; `floorAt1` reads `HSOLID.fl` (no furnishings: you never climb onto them). Mind: a walk that starts inside something moves freely (the step-out rule), so a body stuck in the living room's radiator walked through the window wall before V3.48.
- **Doors:** `14_views_walk.js` `walkDoors` opens a door within 95 cm (and draws the stair curtain back, V3.31) (not the bin cupboards': `BINS`). A door's open state is kept on the device (`S.doors`), so a fix to how a door opens must also ignore what a device already saved (V3.17 N61: the bin doors kept open from before V2.99 still showed as a second front door). The stairs: both flights 85 wide
  (`geometry.RECESS_W`), `model.stair_soffit` over the lower flight; the site check walks through the living room door at x 339.
- **A piece's room for the culling** (`20_go` `roomOf`) is the one room outline that holds it whole; the lower flight lies in the store's
  outline, so the house file's `wells.flight` claims it for the lower stairs (V3.37). Anything drawn per room edge (`houseShade`'s bands)
  must skip the stairwells' openings (`wells.floor`, `wells.ceil`), or it hangs in the air. In the living room's view the house under the
  landing's floor over the room is cut away (`09` `livClip`) except `stairpaint`: a piece that must show there takes that material.
- **What a room draws of the house** (`09` `applyFloors`): its own floor, the one above, the outside; the landing (and since V3.49 N101 any first-floor room that sees the landing through an open door, `roomSees`) also the ground floor and the living room's pieces down the stairwell. Anything a room sees that isn't drawn shows what's behind it: the party wall's brick, next door. To find it, raycast a grid from the eye (NOTES 1) and list the hit materials.
- **The rooms' light by their size** (`09` `placeRoomLights` `ks`, 0.75 to 1.3): it evens how bright the rooms look (one strength for all made the small rooms brighter and the spread wider, N92). Change a light's intensity freely: `lightEase` eases it while walking; it reads `l.intensity` as the target, so never `*=` a room light.
- **Glass by evening** (V3.52, N104): the dusk veil (`11` `duskVeil`, renderOrder 5, no depth write) draws over anything see-through that writes no depth, so a nearly opaque pane must write depth (`glassTod`: frosted) or it turns the veil's navy. A material's colour, emissive, opacity and depthWrite change without a shader; a map it didn't have would build one.
- **Outside pieces without new shaders** (V3.44): the phone's first picture has no shader to spare (21 of 21), and a plain map-and-relief material outside is new (the ground's lawn is its own "grass" program). So the street copies the house's own materials (`FIN.mat3(k).clone()`, its `onBeforeCompile` and cache key carried over, `houseClip(m, [], false)` for six uncut planes): no new program. Check with the programs' ids (`gl.properties.get(m).currentProgram.id`).
- **The photos budget is full** (V3.53, `tools/perf_budget.json` `photos_mb` 9.5): a new texture needs room made. V3.53 re-saved `artex_nor` (402 to 352 KB), `board_map` and `chipboard_map` at quality 78; `--floors` saves at 84, so re-save `board_map` at 78 after running it again.
