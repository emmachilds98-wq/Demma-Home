# Notes from the threads: how things work, what bit us, what's left

What the agents learned while doing each task, so a new team doesn't find it again from zero. Until 8 Nov 2026 these lived only in
the project's memory, outside GitHub. Facts about the house are in `house/HOUSE.md`, the client's choices in `docs/DECISIONS.md`,
what's true now in `docs/STATE.md`. Two older reviews are in `docs/reviews/` (the 6 Nov upgrade review and mobile audit, both at V2.44).

## 1. Working in the sandbox
- **three.js:** jsDelivr is blocked. `npm ci` gives the local bundle; for the browser checks set `THREE_LOCAL` to an unpacked
  `three` package (`node_modules/three` after `npm ci`). fonts.googleapis is reachable.
- **Python:** `pip install -r media-wall/requirements.txt` (it pins `playwright==1.63.0` to match the browser in `/opt/pw-browsers`;
  set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Test scripts use `localcdn.route(pg)` and `pw.launch(p, pw.GL)` from `media-wall/src`.
- **Speed of a run:** the full `tools/checks.py` takes over 10 minutes here: run it in the background. CI takes about 35 minutes (8 of them the bake, when it runs).
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
- **Background colours (N115):** `scene.background` as a colour is the clear colour: straight to the screen it shows as typed, but through
  the HD composer it's tone mapped (AgX at the exposure, 0.4 in a room) and comes out much darker; pass the colour through AgX's inverse
  (`19_view_controls.js` `agxIn`). A background texture in sRGB is never tone mapped on Fast (three r160 sets `toneMapped` off for it)
  but is through the composer; a linear one is tone mapped on both. Test both paths: `?ao` forces the composer in the sandbox.
- **Testing a link's `#share=` (N118):** going from the page to the same address with only a new `#...` doesn't reload it (Playwright's
  `goto` too), so nothing reads the link: go to `about:blank` first. Serving `_site` with `python3 -m http.server` for several browser
  contexts stalled on the photos; abort `tex/`, `photos.` and the fonts in a test that needs no picture, and wait for `domcontentloaded`.
- **Matching the fog (N169):** three mixes fog after the colour conversion, with `fogColor` in the screen's space when drawing to it and linear into a render target (`refreshFogUniforms`). A custom shader that must match the fog (the sky's haze, `11_lights.js` `skyHaze`) mixes at the same point and sets its colour the same way in `onBeforeRender`; a plain copy of `fog.color` comes out too blue on Fast.
- **Ticks (N118):** every tick store saves through `localStorage.setItem`; `measure.js` wraps it for the five keys in `TICKS` and times
  each changed key (`demma-ticks-at`). A new store of ticks only needs adding to `TICKS` (and `pull_edits.TICKS`, `tick_val`).
- **Comment trims (N176, N179):** prove nothing changed by building `--fast` before and after and comparing `_site/index.html` byte for byte. A comment inside a shader's template text ships with it (and esbuild then renames identifiers too): leave those or accept the change.
- **Git:** force-push is refused. After a merged PR, restart the branch from `origin/main` (a fast-forward push works).
- **The gallery:** `tools/gallery.py _site` shoots fixed views; a before/after pixel diff proves a code trim changed nothing.
  `--catalogue k,k` puts catalogue pieces in the garage (`_shots/catalogue.jpg`). Bedding needs a viewport over 700 px (`clothBox` is skipped on `LOWD`).

- **The picture check (N190):** build main into one folder and the branch into `_site`, then
  `python3 tools/gallery.py --diff <main's site> [--views house,room]`: a line a view with the share of pixels that moved (more than 8 in
  a channel), `_shots/diff/<view>.jpg` (main | branch | where in pink). The same build twice moves 0.00%, so a code-only change should too.
- **The names check (N191):** `checks.py`'s "names" joins the 3D's parts (`_shots/room3d.js`) and runs ESLint's recommended rules
  (`tools/eslint.config.mjs`). A page global the 3D reads (`window.X &&`) goes in that file's globals.

- **Baked light (N195):** `python3 -m pip install bpy==5.3.0` (Blender as a module; Python 3.13 only), then
  `python3 house/bake.py --size 2048 --samples 64` after a build; on by default on an HD path (`HI`; `?nobake` to compare). On for everyone it must be in the page before the house's warm-up, or every house material is built twice (#306: 112 shaders on the first picture). A mesh of a baked material without baked UVs reads the atlas' (0,0), kept as the mean bounce, so joins and pieces laid later match. The export reads the page's own
  meshes (`houseG`, named for it) in the order the page builds them, so a bake belongs to one build of the 3D. Blender's merge drops
  slivers of no area: each corner carries its own index (`oci`) so the UVs map back. The raw light is kept in `_shots/bake/` to write
  again without baking. On for everyone since V4.35: `start()` waits (2.5 s at most) for `BAKE.p` before building anything, and only a bake in hand then (`BAKE.use`) is applied; one that lands later would rebuild every house material (#306's 112 shaders). A material that shares another's program on purpose (the concrete's plain key in the living room's view, `garageFloor`) stays out of the bake (`bake.py` `SHELL`): baked, its key was its own and the hitch walk caught it built mid-walk (#307's merge, #308). On CI the bake takes about 8 min (4 cores); here about 16 with other work running. three.js 0.187 lights in physical units: the sun 80 lux beside a lamp of a few candela, hence the fourth-root curve.
- **KTX2 (N196):** GitHub's basisu can't be built here (cloning works; building it was refused) and its release binaries are blocked; npm's
  `ktx2-encoder` (basisu 2.x as WebAssembly, MIT) runs under Node, here and on CI alike (`npm ci`). Made from our JPEGs, KTX2 can't be
  sharper than them: per 1024² photo, UASTC came out 5–9 times the JPEG's bytes (46–56 dB against it), ETC1S about 1.2 times (35–40 dB,
  like a JPEG at 60). ETC1S normal maps flattened the roof's tiles (the gallery showed it): reliefs and roughness stay JPEG. What it buys
  is the chip's memory (a 1024² colour photo 1.4 MB as BC7, 0.7 as ETC2, 5.6 as RGBA with mips) and no decode on the page. To read a
  KTX2 back in Node (to measure it), run three's `basis_transcoder.js` through `new Function(...)`: it declares `BASIS`, exports nothing.
  SwiftShader takes BC7 (`bptcSupported`); its transcodes are slow (45–60 s for all on the RTX path with the box loaded), so `gallery.py`
  waits till the photos stop landing; a test that counts compressed textures must wait as long.

## 2. Merging when threads run side by side
- **Push everything at once (22 Nov 2026):** three rounds lost work to usage limits (N219's shop pieces, N221's saved looks, an iPhone fix, V4.41 once), each committed or merged only on the machine that stopped. Every commit is pushed when made; helpers push their own branch after each step; a merge is pushed straight away. To keep a running PR's CI, push to another branch (your own, or the helper's) and fold it into the PR with the next push.
- **Versions race.** Each PR takes `VERSION`, a line in `docs/HISTORY.md`, `docs/STATE.md` and its plan row, and main moves every few
  minutes while CI runs about 20. Take the version **at merge time**: once the code is green, merge `main` in (a merge commit, not a
  rebase), take the next free version, `checks.py --quick` and `build.py --fast`, push, merge straight away. Never take a version below
  main's. A docs-only conflict needs no second full CI wait. Numbers lost in races (V2.81, V2.84–V2.86) were simply skipped.
- **A PR that conflicts with main gets no CI** (no merge ref): merge main first. A draft PR once got no runs until marked ready.
- **Docs-only PRs** skip the browser jobs (the workflow's "Only documents changed?" step) and take no version.
- **Flaky checks:** `browser (site)` "Measure didn't keep the number typed" was a fixed wait against Measure's 600 ms debounce;
  #135 waits for the saved row. Draw counts in CI vary: once `rtx draws_house 817 > 640` against 569 locally and on main, and once
  `iphone draws_living 945 over 295` locally. Re-run before hunting a cause; screenshots are in each run's `screenshots-site` artifact.
- **`20_go.js` split (V4.37, N194):** older notes, comments and plan rows that say `20_go.js` mean one of `20_1_house_materials.js`
  (`HTEX`, the palette `FIN`, `finish`, `garageFloor`, `liftBlack`), `20_2_house_outside.js` (plants, trees, the street, `worldUV`),
  `20_3_house_shade.js` (`houseShade`, `pieceShade`, `edgeShade`, `joinBuild`), `20_4_house_build.js` (`buildHouse`, `bakeApply`) or
  `20_5_go.js` (`buildSun`, `start`, `R3D`). Cut at top-level statements, so the joined script is the same byte for byte.
- **CI's caches are per branch:** a PR's bake (and renders) aren't reused by main after the merge, so main bakes again (about 8 min). Local browser checks here take 40+ min on 4 cores with helpers running: let CI measure, run `checks.py --quick` locally.
- **The 3D's parts share one scope** (`room3d_src.py` joins them): a new top-level name can clash (`shown` once stopped `R3D.ready`
  ever firing). Put a `// note` at a line's end only: one put mid-line in a one-line statement commented out the rest of it.
- **Moving a top-level name between parts (N203):** a `let` (or `const`) moved to an earlier part is always safe (it only leaves its
  dead zone sooner), unless its starting value needs something made later. Moved to a later part, it is safe only if nothing the script
  runs while it loads reaches it before the new place: everything else waits (`start()` waits for the bake; listeners, timers and
  observers run after the script). To check, parse the joined parts with espree and eslint-scope (both from `npm ci`), take the code
  run at load before the new place (top-level statements, and callbacks handed to `forEach` and the like, not to `addEventListener`,
  timers, `then` or observers), follow the functions it calls, and look for the name in what is reached. Each part now sets only its
  own `let`s; what two parts set is in `GS`. Keep it so: a new `let` set from another part goes in `GS` or moves to the part that sets it.

## 3. Speed: what was done, how, what's left
- **The hitch walk (N177, V4.9):** its own check (`checks.py --only hitch`, `check_site.py --hitch`, its own CI job: inside the site job it took that past 40 min). `check_site.py` `HITCH_INIT`/`HITCH_WARM`/`HITCH_WALK`. A faked clock must move `performance.now()` with the
  rAF time (each frame 1/144 s on, time inside a frame as it passes): faking only rAF's timestamp left tweens started from `performance.now()`
  with a negative k, and the camera flew off to x = 287 km. A link inside three's `compile`/`compileAsync` is the warm-up's (on a PC it builds
  beside the page) and doesn't count; one used on the frame the draw linked it does. Wrap `renderBufferDirect` to name what drew it (the
  shadow pass goes through it too). New shadow maps (2048² render targets) are sometimes made going down to the lower floor: allocations,
  not photos, so not counted; worth a look if a PC still stutters there.
  N180 (V4.14): `compileClipped`'s shadow stand-ins once went only with the pieces on show; a hidden piece's sun shadow then built
  mid-walk. They now take the same pieces as the colours: a new kind of piece that casts needs nothing more.
  N182 (V4.20): three keys every shader, a shadow's too, by the count of lights on (`numPointLights` and the rest), and the house
  has two sets (the whole house's; with the living room's lights on). `compileClipped` keeps each set it meets (`LITS`) and asks for the
  shadows in all of them. To name a mid-walk shader, diff its `gl.info.programs[i].cacheKey` against the warm-up's (index 33 on is the lights).
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
- **A hidden card name (N124):** some browsers give no renderer name ("WebKit WebGL", "Mozilla"): `BIG_GPU` was false and the PC took the
  unknown-computer path (lowRes resize on every drag, no composer). `MASKED` treats a computer with no maker in the name as a card. Test by
  spoofing `getParameter` for 0x9245, 0x9246 and 0x1F01. Send's `gpu` reads `hidden` then.
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
- **Fewer draws (N193):** count a frame's draws by owner before changing anything (patch `gl.renderBufferDirect` for one frame from the
  main camera, name each mesh by its movable, option, part or house material; the shadows' pass left out). From outside the house the
  doors and lids at rest were 32 of 196 and the shade bands 26 (a transparent `DoubleSide` material draws twice: back, then front);
  inside the living room nearly every piece has its own material, so a join there saves little. `BatchedMesh` is a new shader variant:
  merged geometry keeps the count. `forceSinglePass` builds one `DoubleSide` program in place of the back and front pair (no more
  shaders); only for a material whose two passes blend the same in either order (black shade). A merged copy that a part must leave
  while it moves: empty its span (degenerate triangles, `addUpdateRange`) and show the part's own meshes, as `joinOut`; map a tap's
  `faceIndex * 3` back through the spans (`joinSrc`). Hidden insides (a shut cabinet) are free draws: hang the visibility on the doors' anims.
- **Pieces that move, at rest (V3.77, N153):** `13_edit_room.js` `restMerge(g, live, skip)` copies a piece's parts (its own meshes and
  its moving groups at rest) into one mesh a material and shows it while every part is at rest; the moving groups show only while one
  moves (the sofa bed's `RS`, the chaise's lid). A part's anim must call the switch (`sync()`), or it moves hidden. Nested groups that
  never move are better merged at build (`lazyVis(g, build, true)`); a material made per item (`own(c)` in a loop) can't merge: share them.
  What a phone draws standing in the living room, by piece: patch `gl.renderBufferDirect` for one frame and tally each mesh's movable,
  option (`SUGG_G`) or house key: `python3 tools/draws.py`.
- **A hidden material is still compiled (V3.77):** `material.visible = false` hides a mesh but the start's warm-up (`compileClipped`)
  still builds its shader for the first picture (V3.76's bulb glow: 21 to 22). Hide the meshes (`mesh.visible = false`): the idle
  warm-up (`precompile`) builds hidden meshes' shaders after the first picture.
- **Bytes (N2–N4, N25, N32, N43):** photos a hashed JPEG each in `_site/tex`, kept across versions (`demma-keep`); half-size set for
  `LOWD` phones; esbuild minifies the page; icon font subset; sheets in their own file; fonts don't block; no texel finer than a 4K
  screen shows (`build_textures.PX`, `--slim`). Tried and dropped: lower JPEG quality (3–8 dB lost for 5–10%), progressive JPEGs.
  `sw.js` waits 2 s for the page (`WAIT`), then serves the kept copy (tested with a local server whose delay is set by a `.txt` file).
  N109 (V3.58): `PX` takes one picture of a key too (`road_nor`); `--slim` re-saves in place, then the gallery pixel-diff proves it (mean
  difference under 0.1 of 255). A view's nearest distance decides: a floor 1.6 m, the outside's relief 2–4 m, the road the drive's width.
- **KTX2 (N196, was N22/N31 and #133):** the colour photos also as KTX2 (ETC1S), made at build by npm's `ktx2-encoder` (basisu as
  WebAssembly: no binary to build), cached in `.ktx2cache`; three's `KTX2Loader` (its own file, three from the one bundle) and basis
  transcoder (0.58 MB) copied into `_site`; the compressed data put into the same texture objects so no shader changes; JPEG fallback.
  The tint must stay at build (compressed textures can't be tinted on the page). Section 1 has the numbers.
- **Lean code (N28, N41):** method: join the parts (`room3d_src.js()`), run ESLint 9 `no-unused-vars` on the one file (install ESLint
  in a scratch folder, not the repo), read each part, grep every name across `media-wall/src`, `tools`, `house`, `projects` (`R3D.*`
  hooks are called by `shot3d.py` and `check_site.py`), prove with the gallery. N48 (V3.05) cut 12, 13, 14, 16 and 20's;
  `movable`'s `_flat` stays by place (04 and 07 pass it). N120 (V3.67): `optC`, 19's `d.cab`, bar 2's six copies (`BAR2` is one bar now),
  page.js's `user`/`need`, fit.py's four functions defined twice (pyflakes: "redefinition of unused"). ESLint finds nothing more in the
  joined room3d file. Left: 15's `LOOK_STR` `cab`; pyflakes' unused locals in fit.py, build_viewer.py, room3d_page.py, plan_ui.py, model.py.
  N176 (V4.7): `checks.py` `lean` now watches for it. A comment-only trim is proved by esbuild: the joined parts minified (`--minify-whitespace
  --minify-syntax`) before and after must be byte-identical; a one-line comment goes at the end of the line it explains.

- **A room's light (N80):** `applyLight` zeroes every light but the fill in a room of the house; it must leave the house's own (`userData.houseLight`) and the sun alone, as `placeRoomLights` runs before it, not after (a second change of a light left rooms lit by the fill alone). To compare a room with the living room, shoot both and take the mean grey (about 150 is the living room's by day).
- **A material that's lost (N82):** a key with no row in `model.MATS` draws as `mat3`'s grey `#cccccc`, matt, with no error. A `# note` mid-line in that dict once dropped three (V3.14 to V3.32). To check: every quoted first argument of `o.box`/`o.prism`/... in `model.py` against `model.MATS`; a raycast in the page shows `material.color` `cccccc`.
- **One light (N63):** to compare rooms' light, shoot each view (`R3D.set({view, tod, quality})`, 3.5 s) at 640 × 400 with the UI hidden
  and take the mean grey: the rooms' own colours spread it about ±20, so look for a view outside that. A light that's always visible
  (the sun, `skyFill`, `hemi`) can change intensity or colour freely (no shader); `visible` or a new light rebuilds them. In Fast the living
  room has no window light, so `skyFill` (otherwise 0 there) fills it. After setting a light by hand, `dispatchEvent(new Event('resize'))` to redraw.

- **The GPU at rest (N93, V3.41):** the loop draws only when `need` is set, so a busy card while still means something keeps setting it. Measured on the client's PC (headless Chrome `--use-angle=d3d11`, a temp profile, CDP; wrap `bindFramebuffer` and the draw calls to count frames drawn to the screen, and sum `\GPU Engine(*engtype_3D)\Utilization Percentage`): with no welcome the house warms in about 6 s and then draws 0 frames a second. The welcome's `controls.autoRotate` drew every frame (three's turn is a step a frame, so a 155 Hz screen spun 2.6× too fast); now `SPIN` in `17_render_loop.js`. Anything new that animates on its own should go through the same cap.

- **Seen through an opening (N188, V4.27):** `09_house_views.js` `wellCull`, run from `scene.onBeforeRender` for the main camera, leaves
  out of that draw (layer 0 off) a living-room piece the eye can't see down the stairwell and a piece out of doors it can't see through
  any window or outside door of a room seen (`outPorts`). The test (`seenThrough`) projects a box's corners from the eye onto an opening's
  plane and keeps it if their bounds touch the opening; a box not wholly beyond the plane is kept. It only ever over-draws. The shadows'
  redraw (`gl.shadowMap.render`, wrapped) turns them back on first: three makes the camera's list before the shadows, so they still cast.
  The check: before/after screenshots at fixed eyes must match once settled (a piece first drawn takes a frame or two to match).
  The landing's stop pushed the site job past its 40 minutes, so the HD paths' speed budget (iPhone, RTX) moved to the hitch job
  (`check_site.py --hitch`, `_shots/perf-hitch.json`); the site job keeps the phone's and the PC's Fast paths.

- **three.js 0.187 (V4.29, N192):** `PCFSoftShadowMap` is gone (PCF with each light's `shadow.radius`); `RoomEnvironment` lights its
  room at 900 where 0.160 used 5 without a renderer (`studioRoom` in `09` sets 5 and its lamps plain); the sky draws its own clouds and
  lost 0.160's tone curve (our patch in `11_lights.js` keeps the curve and the haze, and leaves the sun's disc out of the outdoor light).
  Shaders are keyed on `hasPositionAttribute` and `vertexNormals`, and the shadow maps use basic depth packing: the warm-up's stand-ins
  (`postWarm`'s plane without normals, `depthMat` without RGBA packing, `10_plants`' leaf depth) must match what is drawn, or the real
  shaders get built mid-walk (the hitch check). To compare shader lists between builds, record `R3D._dbg.gl.info.programs` (name and
  cacheKey) at `r3d-first` with the GPU spoofed as `check_site.py`'s PERF_INIT does.
- **First-picture budgets (V4.32, V4.34):** anything that adds a mesh or a material at open (a scheme's fittings, curtains or prints; a
  light map arriving after the warm-up) shows in `shaders_first` and `draws_house` on the Fast paths or the HD ones. Measure with the
  site and hitch checks before merging; CI is slower than a sandbox, so a race that passes locally can fail there.

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
  living room's walls by name, 17 the woodwork (the living room's skirting and door in its Look; any other room's through the palette, N216), 18 rug, 19 curtains, 20 bedding, 21 picture, 22 picture's wall, 23 plant,
  24–25 wallpaper, 26–27 panelling (N57; `finWallRun` gives any wall its face, openings and ceiling line), 28 storage ideas, 29 the slopes
  (N214: none with the ceiling, `walls`, or a colour), 30 on each wall as built (N214: 30 + its number in the house file's
  `finish_walls[room]`, `[side, line from, to, along from, to, m²]` from `surfaces.walls`). A new slot goes in `finClean`, the Paste filter, `roomUps` and a cost in `UPC`.
  Each wall (N214): `finAt` finds the wall a tap is on as the shader does (its side, then the line within 2 cm and the span within 2);
  This wall sets it, This room and Whole house set 0–3 and drop the 30s; a side with more than one says "the west wall (2 of 3)"
  (`finWallName`); a face under 15 cm or 0.1 m² (a return, a strip) is on none and keeps its side's colour. `check_model.py` checks every
  face lies on one wall. Wallpaper and panelling still go on a side (`finSide`). A ceiling with slopes (`finish_areas[room].slope`) has
  Slopes on its card; a tap on a slope opens it.
  A floor (N209) has three sources: the plan's (`plan_finishes.json`, merged into `S.fin` once a version, so it reads like a pick), the one
  laid now (`finish_areas[room].fk`, from `surfaces.by_room`) and theirs; Changes counts any but the one laid now, the card prices only theirs. The garage (`FIN_OWN`) keeps its slab.
  Her own colours (N213): a wall's card takes a code (`data-finhex`, `finHex`: `#` optional, three digits doubled; its `change` sets
  it, and Enter sends one: a value set by a script never fires `change` on blur); `finName` calls a colour that's neither a paint nor the plan's (`finPlanHex`) "your colour #3A6B5A"; "Yours"
  (`finMine`) is read from her rows each time, nothing new kept. The look link's `fc` carries each room's slots 0–4, 9, 10, 17, 29 and the 30s (`finLook`) that
  differ from the plan's (the plan's scheme is merged into `S.fin`, so the link leaves those out); `fl` the floors.
  The palette (`20_1_house_materials.js` `FIN`): a row a room, 32 columns: 0–3 the sides, 4 ceiling, 5 bedding, 6 woodwork (N216: `skirting`,
  `door_white`, `woodwork`, FIN.kind 3, found in the house's own frame as the bedding is, so a swinging door keeps its room), 7 the slopes
  (a ceiling's fragment with its normal 0.2–0.95 up), 8 on each wall's own: 8 + side × `FIN.WK` (6) + its number on that side
  (`FIN.cols[room]`). `FIN.walls` (a float texture, a row a room, `WK` a side) holds each wall's line and span; the walls' shader loops
  its side's 6 to find it. Same programs, no new draws; more than 6 walls a side would need `WK` raised (`check_model` fails first).
- **Changes and costs** (`16_cards.js`): `UPC` rough UK costs (E, Nov 2026; a floor per m²), `roomUps(room)` a room's changes, card id
  `ups:<room>`; done ticks in `localStorage` `dh-done` (this device only, not in Send); `upsAll()` gives the total for Plan and Measure.
  The 3D's `qs` is scoped to its root: use `document.getElementById` for the sheets' elements.
- **The catalogue** (`08_house_catalogue.js`): every piece has a `ref` to a `fit.SOURCES` row and a short `src`; `checks.py` sizes fails
  a piece with none. Soft edges come from the material (`20_go.js` `ROUND`/`CLOTH`).
  **A swap** (N217) is drawn at the new piece's own size (`swapBox`/`pieceBase`: its back where the old one's was, from the same end of
  its wall if that was within 10 of the room's, else from its middle; a chair centred and facing as the old one did), so a swapped piece's
  `w`, `h`, `along` rows read from that base (`pieceNow`, `pieceDelta`, `setPiece`) and a new swap clears them. What swaps is
  `HSWAP_OF` by id (a decor `rug` too). `fitWhy(id)` is the page's fit check for any changed piece (the swap card and `pieceLine`): the
  room's walls (its box, the notches where it's L-shaped, the knee walls), the slope or ceiling (`model.headroom`), the doors' swings
  (`opening.swing` in the house file, a quarter circle as `storage_ideas.checks`) and the walks (`storage_ideas.reserves()` named "walk"),
  all from `R.HOUSE3.fit` (`export3d._fit`), then `clashes`; a rug only the walls. A new walk goes in `reserves()` (the model check keeps
  the storage ideas clear of it too). **Riders:** a piece that stands on or hangs from another is `o.item(..., on="host")` (the house
  file's `on`); `riderBox` moves it with its host (the same offset from the host's back-left corner, the same height over its top) and
  hides it when the host is taken out or turned, or the new top is under less than 90% of it (hung: when it no longer meets it). Riders
  are bedroom 2's monitors, interface, 88-key, headphones and mic on the L desk and the office's two screen setups on its desk; not the
  office lamp (its light would stay behind).
  **Adding** (N218): the add card's kinds are chips, ‹ › goes through that kind (`hcAddOf`); `addSpot` puts a new piece (and each piece
  picked for it) back to the room's wall nearest the tap where `roomWhy` and the pieces find it clear, stored as the row's `x, z` on the
  wall line (0.5 in), which `syncAdds` reads back as against that wall. The space kept clear (`fit.keep`, from `reserves()`) names the
  piece it's for (the Kallax's drawers), which that piece may take. **Real pieces and her own** (N219): `docs/N219_catalogue.json` (the
  research, 142 pieces) is read by `fit.shop_pieces()`: each its own `fit.SOURCES` row under `fit.shop_key` (a hash of its page and name,
  so a row in Send or a link keeps meaning it; one page can sell two sizes), and by `export3d.shop_row` into `R.SHOP` (its kind, a look for
  the builder, its materials from the finish's words, a door or drawer count). `08_house_catalogue.js` puts them in `HCAT` (`shop`, `p`,
  `url`), drawn by `hcMake` with the house's materials only (no new shader at the first picture); they join the swap lists by kind and
  `HCAT_ADD`. A card's line is `hcLine` ("86 × 50 × 87 cm · Fits · £103 · Habitat"), its tray a chip a shop and the shop's page
  (`hcShopTray`). Her own piece lives in its row's value, `own|<look>|<material>|W|D|H|<name>` (`hcOwn` checks each part and registers it
  in `HCAT` the first time it's read: `syncAdds`, `heOk`), so the look link and Send carry it with no new row shape; `ownPut` rewrites it
  and stands it back where it fits (`addSpot`). Twelve materials (`OWN_MATS`, hex from `house/model.py`); `pull_edits` lists both.
  **House edits in the look link** (`he` in `lookOf`): each edits row
  as `[item, field, value]` (an add with its room, x, z, y), every one checked by `heOk` on the way in (as `pieceNow` and `syncAdds` read
  rows) and put into Measure's store, once it is up (a link opens before `measure.js` has run).
- **Lamps:** `survey_data.LAMPS` → `model.room_lamps`; the viewer reuses the room lights' uniforms (no rebuild). **Shade under pieces:**
  `model.piece_shade`, moved with edits (`08_house_edits.js editedFloor`).
  **Shade where walls meet** (V3.63, N112): `model.edge_shade` finds each room's walls from the boxes as built (`EDGE_M` faces within
  1.6 cm of the room's edge, `skirting` faces), so bands never cross a door, a stairwell (`stair_wells`) or two pieces of one room; drawn by
  `20_go.js` `edgeShade` in its own material key `shade_edge` (HMATS), so Above and On its own cut it like the walls, and left out while
  `aoLive()` (a `visible` getter on the mesh, so it costs no draw then). A band at a piece's shade strength
  (0.24) didn't show at room distance: the walls' own gradient peaks at 0.42.
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
- **The green sofa bed** (V3.71 N126, V3.72 N127; the client's "test sizing and fit" of a sofa she may buy): sizes in `geometry.SOFABED`
  (exported in `export3d.room_spec`), cited in `fit.SOURCES["amelia"]`. Built by `12_furniture_options.js` `buildSofaBed` as two movables,
  `sofa2` (the run, corner, arm, stools, the pull-out bed) and `chaise2` (the loose storage chaise), shown by `S.sofa === "bed"` (their
  `when`); your sofa (`sofa`) and the navy ottoman (`pouf`) hide then. `S.sbed` pulls the bed out (`WORK.sbed`: 0–0.7 slides, 0.7–1 rises)
  and moves the coffee table 78 towards the media wall (`WORK.cof` on `coffeeG`, `04_living_shell.js`); the chaise's lid is `S.lid`, as
  the ottoman's (`WORK.lid2`); all eased in `05` `placeWork`. Watch the bed open is the dining table's show made general: `06`
  `showOpen("bed")` runs `bedSteps()` (a step may carry `aim` for `flyTo`), `showStop` puts the bed back (`SH.kind`). The switch: Room's
  first row (`room3d_page.py`, `data-sofa`, `data-showopen="bed"`), the cards `mov:sofa`, `mov:sofa2`, `mov:chaise2` (`16_cards.js`), the
  clicks in `19_controls.js`, the link and Save my plan (`LOOK_STR.sofa`, `LOOK_BOOL` `sbed`, `SETUP_KEYS`). Upholstery: `cushGeo(w, h, d,
  crown, bulge, r)` is a box subdivided densely at its edges, pushed onto a rounded edge, its top crowned and sides swelled (bottom flat),
  normals recomputed; `cush()` places one, `tufts()` merges buttons into one mesh; `mergeStatic` keeps each part one draw a material. A
  lid that opens past upright clips the cushion behind it (`-1.5` rad). To look at it in the sandbox: `R3D.set({sofa: "bed", sbed: true,
  lid: true, view: "room"})`, then the free camera (section 1) and `R3D.still(w, h)`.
  V3.73: true to the item: `sec_d` 165 (the corner section's side back), `d` 230 with the chaise (`end_z` -66); the bed's anim runs
  three stages on one `WORK.sbed` (0–0.5 out past its rest by `bed_over`, 0.5–0.8 the top lifts, 0.8–1 back against the seats), so its
  tween and the show's acts are linear. What stands at the open end follows the shown sofa (`12` `openEndShift()`: the C-table, the floor
  plant, the seagrass basket; the blanket basket's spot is `z` or `z_old`). The tap test taps the red lamp close up, by its top shade.
  It's the default (`SOFABED["default"]` → `DEF.sofa`, a saved room moved once by `S.v373`). Placed round it in `geometry.py` just
  after `SOFABED`: `COFFEE` (40 off the seats), `SOFA_POUF` (beside the table, for your sofa), the lamp's "sofa" spot, `LAMP_READ` (the
  lamp's purple head, `11_lights.js`), `SOFABED["cof_out"]` (how far the table steps for the open bed, read by `04`). `clash.py` knows the
  sofa bed's parts (`SOFABED_PARTS`, one piece with your sofa) and the open bed; the site check drags `chaise2`, the tap test opens it.
  The lights' aims are `geometry.LIGHT_AIMS` (bar 1 through `BAR1_HEADS`, bar 2 through `render.spot_heads2`); a `None` stays straight down.
  A house box under 0.2 cm in any direction is dropped by `model.box` (a 2 mm rug border vanished); the music room's rug colour is its
  drawn weave in `20_go.js` `T.rug`, not `model.MATS`.
  V3.74: the sofa bed's fabric is `02` `CHENILLE` (colour, near white so the piece's colour and Edit's tint it) and `CHENILLE_B` (relief);
  `cushGeo` maps each face in real cm (`T` 0.2 m a tile) by the way it faces, and gives the cloth a slight lie. The C-table is out of
  `FIRM.ideas`: the plan's pages gate it on `"ctable" in FIRM["ideas"]` (`build_doc.CT_IN`, costs, instructions, chapters, pieces, fit,
  clash); put it back in `FIRM.ideas` and every row returns. A `//` comment mid-line in a call comments out the rest of it: the 3D then
  doesn't start ("missing ) after argument list"); `node --check` each part. The plan's coffee table is the lift-top
  (`FIRM.sugg` "liftcoffee"); the record table's rows are gated on `"recordtable" in FIRM["sugg"]` as the C-table's (`build_doc.RT_IN`).
  V3.78 (N135): its colour is set for HD (all the client's devices): measure a change with `R3D.set({quality: 'hd'})` from a fixed eye,
  the seat tops' median beside the listing's photos (hue, saturation, lightness). A movable's `tints` ([material, share]) follow its
  colour; `follow: id` takes another's colour unless it has its own (the chaise, the sofa bed's). Two movables must never share a
  material that Edit colours: `placeAll` sets each in turn, so the last one placed wins.
  V3.81 (N137): `cushGeo` gives each cushion a `color` attribute, its shade (underside 0.55, the sides' foot 0.68, the top 1); the cloth
  takes `vertexColors`, so every shape it's on needs a colour: `vcol(geo, mat)` (13) adds white to boxes, pipes, tufts and loops; `cush`
  drops it for materials without (the feet's steel must still merge with plain boxes); `restMerge` keeps `color`. A shape with the cloth and
  no colour draws black.
  V3.82 (N138): Make up the bed (`S.made`, `WORK.made.sync`, shown once `WORK.sbed.p` is 1; `restMerge` skips it and the chaise's `fold`).
  The chaise is hollow: a base and four 3.2-thick walls round the lining, the folded bedding on its floor.
- **The iPhone path's `draws_living` once read 680** (#260, V3.87; budget 273): the same build gave 195 locally and main's run passed;
  a frame's count (`FT.calls`, `gl.info.render.calls` after the frame) takes in any shadows redrawn that frame, and after a room change
  `shStag` spreads those over the next frames; all three frames read carried some. V4.4 (N165) reads six and keeps the least.
- **`shaders_spot` wobbles** (seen on #254, V3.81): on the RTX path, main and a branch alike build 0 or 5 shaders on the spot stepping
  into the living room after the warm-up (CI once 30, on a slow runner): shadow-depth programs with the living room's 2 clipping planes,
  which the warm-up's stand-ins (`01` `depthMat`) don't always reach first. Measure with `check_site.SPOT` after waiting for `WARMED`;
  compare a branch with main before blaming it. A row of its own: warm the living room's depth variants with its own planes.
  The sofa bed's stools (`WORK.stools`, `S.stools`, one group) slide `stool_out` out of the arm's side; its five headrests (`WORK.hr[i]`,
  `S.hr[i]`, a group each) flip up on their hinge (V3.75, below).
  V3.75 (N132–N134): the listing is Amazon UK B0HDC8WYBT; its 14 photos come down from the page's `"hiRes"` URLs (m.media-amazon.com, reachable
  here; the page's prices show in US dollars from the sandbox). Its text: 95 high, seat 43 × 53, 65 wide, back 50 above the seat,
  "Clic-Clac" headrests ("3x" in the text; five pads in the photos, and the client confirmed five, 12 Nov). `SOFABED["head"]` (w, d, t, over, up): each headrest's
  group sits at the back frame's front top edge (`back_h` 81, the run's `-hd + t`, the side's `xi`); the pad hangs back from it with `over`
  in front; `rotation.x` (the run) or `rotation.z` (the side) by `up` lifts the back of the pad, so its foot dips behind the back cushion.
  `head_up_h` (106) is the raised top; `clash.py` checks it. The scissor links are their own group in the bed (`lk`, not merged), set each
  frame from the top's rise (`linkAt`). The chenille (`02` `CHENILLE`, `CHENILLE_B`; since V4.8 made by `build_textures.py --fabrics`
  as `chenille_map` and `chenille_pile_map`, pixel for pixel the old drawing, loaded with the photos on every device): 4 px loops (1.6 mm), a twill
  `sin((x + y)π/4)`, sines for the mottle so it tiles (any random block or row reads at room distance). The colour is drawn greener and
  greyer than the photos (`#586b4c`): the room's warm light turns a green about 25° yellower. Tufts take `dimp` (the cloth × 0.8), not `seam`.
- **As it is** (V3.90 N151, `23_finish.js` `nowMode`): `NOWV` (08) set aside, never changed: `finHold` holds the colours (the living
  room's own apart from the house's palette, which waits for the house), `applyHEdits({})` shows the house's pieces as drawn and
  `storeEdits()` brings yours back, `placeAll` reads no layout while it's on. `store.set` skips the room's key while it's on;
  `finPush` and `setEdit(true)` switch it off first.
- **Edit's handle and sheet** (V3.87 N145, `13_edit_room.js` after `select`): `selOverlay()` places `#r3d-turnh` and `#r3d-selmeas`
  from the piece's box projected, a frame at a time while a piece is picked; the handle's drag turns round the box's middle on screen,
  its sign found by projecting the piece's front at two angles (so it follows the finger from any side), 15° a step, and on letting go
  keeps to the walls as `turnItem`. `.r3d-edit` has no transform so `.r3d-sel` (fixed) sits over the dock. The hint's flag: `mw-edithint`.
- **Taking a piece out and putting it back** (V3.75 N133, `13_edit_room.js`): `outList()` is what's out (`mov:<id>` by
  `S.layout[id].off`; `sugg:<k>` / `idea:<k>` off while in `R.FIRM` or in `S.gone`); `takeOut(key)` and `putBack(key | "all")` do it
  (an undo step each; an added catalogue piece goes for good); `outRow()` fills Room → Taken out (`#r3d-outrow`, from `syncButtons`), and
  `addList()` puts the same at the head of Edit's + Add. Buttons anywhere in the 3D's root: `data-takeout`, `data-outback`, `data-turnit`
  (`19_controls.js`); `toast(t, {outback})` shows Put back on the toast (`.r3d-toast.act` takes the pointer). A card that sits in a movable
  (the lift-top, the record table) takes the movable out (`mov:coffee`). A house piece's toast has `hputback`. A new piece that stands in
  the room needs no more than its movable: its card's generic row and Taken out come with it. Every other room (V3.80, N149): `16_cards.js`
  `roomOuts(room)` (a house item `pieceNow(k).removed`), its floor card's Taken out (n) opens `hout:<room>`; `data-hputback`, `data-hputall`
  (`19_controls.js`) clear the Measure row and re-render the card. Edit's nudges (`nudge`, `#r3d-sel` `nl nu nd
  nr`) step 5 cm along the room's axis nearest the screen's direction. A card's 5th item (`tray`) sits above its buttons; its 6th (`extra`)
  goes inside More.
- **Back** (`09_house_views.js` `roomHist`), **Esc** (`19_controls.js` `ESC`, top layer only), **Overhead/Angled** and a room's **Above** (`19_view_controls.js` `mapMode`: its own drags, the orbit's off there, V3.08 N53, V3.13 N55; a touch on a living-room sticker joins the drag from the root's capture, and moves are read on `window`, as the sticker keeps its finger; it turns them off in a canvas capture listener after 14's, and Edit's root capture keeps a piece's press from it).
- **Swinging round a spot and looking into a floor** (V3.68 N125): a rigid turn of the eye and the point looked at round the grabbed spot keeps that spot still on screen (`mapSwing`: the turn round the upright, then the lean round the level line, both through it; `lookAt` keeps no roll). Before the swing the point looked at is slid along the view to the spot's depth, so nothing jumps. `mapPick` raycasts the scene once a press (the eased wheel asks each frame: one ray kept for 400 ms). A floor's cut (`09` `floorCut`) moves one plane's number in `FLCLIP`, in 20 cm steps with `reshadow()` on a change: the house's materials always carry six planes, so no shader. The living room's own walls (`03` `CLIP`) aren't cut by it. Test with Playwright's mouse at 1280 × 800: project the picked point before and after the drag (it moved 5 px in 8 moves).
- **The rows' fades** (V3.79 N144, `09` `fadeRows(show)`): `.more` and `.less` mask whichever end of a sliding row has more; `show` (from the
  view's change, never a scroll) slides the chosen button into view. A switch shown as an icon on a phone keeps its word in `.t`, hidden
  but read (an icon's ligature text is no name).
- **The labels on the room** (V3.70 N117): `15` `placeStickers` places the biggest first, each at the nearest clear spot (12 px steps down and up, then half a label aside), 8 px from the others and off `keepOuts()` (the bars, dock, stick and figure, read twice a second); no room, it's hidden. From above (`RMODE` above/alone or a view with `above` before walking) none fades as `behind`. The stick's knob shows only while held (`.held`); the walk hint is once a device (`demma-walkhint`).
- **The stick** (V3.15 N59): `14_views_walk.js` `STICK` sets `WALK.stick`; walking reads it in `walkTick`, the map's and the free views in
  `19_view_controls.js` `mapKeys` (with the held keys), a view from the eyes calls `startWalk` (`eyeView`). A mouse drag on it in Playwright
  is enough to test it (it never reads `pointerType`); check `stick_all`.
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
- **Built the first time they show** (N181, V4.16): the gardens round the house (`HFLOOR.out`), next door's things (`HFLOOR.nextThings`), the hill and its trees, the street. `OUTLAZY` in `09` holds their builders; `outNeed(k)` at the top of `applyFloors` runs one once (Gardens or Next door on, or any house room with the house shown), and `outdoor()` builds the hill and the street on `room || S.hgarden` / `room || S.hstreet`. The warm-up's room visits build them off screen soon after the start, so a room never builds them on the frame it opens. `S.hgarden` and `S.hstreet` are set false after the saved state loads (`00`), so every open starts without them. A new outside piece goes in one of those builders, not at the house's build.
- **The rooms' light by their size** (`09` `placeRoomLights` `ks`, 0.75 to 1.3): it evens how bright the rooms look (one strength for all made the small rooms brighter and the spread wider, N92). A light's level comes from its own room only (`lightAt`, V3.57), never from the room you're in, or walking through a door changes it (the client: "From room to room the lights shouldn't turn off and on"). A neighbour's light has no wall between (no shadows): `roomReach` keeps its spill short.
- **Glass by evening** (V3.52, N104): the dusk veil (`11` `duskVeil`, renderOrder 5, no depth write) draws over anything see-through that writes no depth, so a nearly opaque pane must write depth (`glassTod`: frosted) or it turns the veil's navy. A material's colour, emissive, opacity and depthWrite change without a shader; a map it didn't have would build one.
- **The outside by evening, on hold** (N163, 13 Nov: the client, "No time of day yet"; #273 landed docs only): it was built by the clock (`11` `clockEve`, the sky's `cloudDusk` gradient, `09` `glassOut` warm glass, `20` `STREET_POOL` lamp pools, no bloom outside so the first picture's shaders don't change with the clock); Time of day defaults to evening, so following it would open the house at dusk. Its code is in #273's commits (`git log --all -S cloudDusk`) for when she asks.
- **Outside pieces without new shaders** (V3.44): the phone's first picture has no shader to spare (21 of 21), and a plain map-and-relief material outside is new (the ground's lawn is its own "grass" program). So the street copies the house's own materials (`FIN.mat3(k).clone()`, its `onBeforeCompile` and cache key carried over, `houseClip(m, [], false)` for six uncut planes): no new program. Check with the programs' ids (`gl.properties.get(m).currentProgram.id`).
- **The photos budget is full** (V3.53, `tools/perf_budget.json` `photos_mb` 9.5): a new texture needs room made. V3.53 re-saved `artex_nor` (402 to 352 KB), `board_map` and `chipboard_map` at quality 78; `--floors` saves at 84, so re-save `board_map` at 78 after running it again.
- **A mirror's first reflection (N185, V4.22):** the stock `RoomEnvironment` reflects as a flat grey in a fully metal mirror (its walls are
  plain and dim), and `envLevels` (`12_furniture_options.js`) rewrites every registered material's `envMapIntensity` from `userData.envK`
  (set it, or your intensity is lost on the next light change). `mirrorRoom` (`09`) is a PMREM of a few `MeshBasicMaterial` boxes, the
  same kind as the stock room's lights, so it builds no shader (check `gl.info.programs` at `r3d-first`).
- **Drawing into a render target makes new shaders** unless the frame already goes through one (V3.57): three keys a program by its output (tone mapping, colour space), so a reflection drawn into a cube target compiles every visible material again when the page draws straight to the screen. The mirrors only run with `postLive()` (the composer draws the scene into a target already). Check with `gl.info.programs.length` before and after.

## 6. Finishes and furniture (section 14, N56–N58; section 17 stream A)
- **The walls' emulsion (N172):** `paintGrain` (`03_materials.js`) adds a world-position varying and value noise to a wall's shader (tone at `color_fragment`, sheen at `roughnessmap_fragment`). It runs on `paintMat`'s walls (key `paintwall`), the stair wall (`stairMat`: a `clone()` drops `onBeforeCompile`, so it's set again) and the house's `paint` (inside `finPatch`, `finish0`). A material's `clone()` never carries `onBeforeCompile` or `customProgramCacheKey`. HD shots in the rig sometimes catch the GTAO unsettled (a dark speckle by the landing's newel): shoot twice before blaming a change.
- **One room's finish in a shared material (N172 garage):** the garage's floor is the drive's `concrete`; `garageFloor` (`20_go.js`) patches that material and acts only inside `H3.rooms.garage`'s outline (its slab lies 15 cm under the room's y). The walls' palette shader (`finPatch`) knows each pixel's room (`rm`): `finGar` holds the garage's number for its masonry look.
- **New floors** are made, not downloaded: `build_textures.py --floors` cuts the oak veneer's own grain into blocks or planks (a block's
  look keyed by its place in the repeat so the picture wraps: herringbone repeats every 2 × n × √2 × width); tiles by `tiles` (`TILED`,
  looks `veins`, `stone`, `lime`). A floor key needs a `model.MATS` row, `FIN_FLOORS`, `UPC.floor` and a `fit.SOURCES` row.
- **On a wall** (`23_finish.js`): `finWallRun(room, side)` gives the wall's face, ends, doors and windows and the ceiling over it; the
  wallpaper and the panelling (`finPanelApply`: real boxes, one draw a kind a room) both build on it. Look's rows 24–27.
- **Seeing a finish without tapping:** `R3D.setFinishes({room: {slot: value}})` then a screenshot (views: `bed3` is `office`, `bathroom` is `bath`).
- **A made finish's grain runs up the picture's v** (`MADE` `joinery`, N111): on a house box that's up a door's leaf, but across a skirting or a rail, so those stay on `gloss` (strokes along u). `HTEX_AS` picks a key's map; `HTEX_TINT` keeps its own colour.
- **A tiled panel's grid (N183):** a house material's UVs are world-sized from the house's origin (`worldUV`), so a tiled piece's grout falls wherever the world puts it; a small panel must be one box (not tiles as boxes with gaps, which double the grout off the grid) and take an offset from its own corner (`gridFrom`, as `tile_w`). Glaze is roughness alone (≤ 0.07, `finishEnv` gives it 0.9 of the room's reflection): no clearcoat, which would be a new shader.
- **Whites (N184):** `capWhite` holds a house material's colour at #dc (sRGB, hue kept) and `finPatch` does the same to the palette's colour in linear before the corner shade (capping after it would flatten the shade). A photo map drawn untinted (`#ffffff`) isn't capped: its photo sets its own white. In software graphics the small rooms' whites sit at about 240, not 255: judge by the shading's spread, not clipping counts.
- **A catalogue piece's own price:** `UPC.piece[key]` beats its kind's (`upCat`).
- Don't rebuild `_site` while `checks.py` runs: a local site check once failed Edit's ottoman drag mid-rebuild; CI passed.
- **Whites (N113):** a textured piece draws its map at full white and ignores its `model.MATS` colour unless its key is tinted (`HTEX_TINT`,
  or `BED_TINT` for the bedding): change the colour of the duvet, pillows or anything else with a photo map there, or nothing moves. To
  measure a material on screen, swap every mesh whose `material.userData.hk` is that key for a flat red `MeshBasicMaterial`, nudge the
  controls (`dispatchEvent({type: 'change'})`), screenshot, swap back: the red pixels are its mask. In software graphics nothing reached
  250 even before N113 (the master's bedding top 5% at 226–233): the glare the review saw was the near-white shoulder, not true clipping.
- **A queue of stacked PRs** (each PR's head merging the one before, to land as V3.63, V3.64, ...): the last one carries all of them, so
  merging it lands them all and a failure in an earlier one (#228's `draws_house 211`) holds every later one. When taking over one of
  them, cherry-pick its own commit onto `main` instead.

## Lessons of 22 Nov 2026 (V4.45–V4.48)
- A material that newly reads the palette is a new program (its own `customProgramCacheKey`): the Fast paths' `shaders_first`
  counts it (V4.45: +1, budget raised on purpose in `tools/perf_budget.json`). Adding columns or a data texture to an existing
  program (N214's 32-column palette and wall table) costs no program.
- Splitting a shared material (`upvc` → `woodwork` for frames and radiators) is how a few pieces take a room's colour without the
  rest (the window frames); a model material name must be new (`trim` was taken by the dormer).
- CI cancels a branch's running workflow on each push: batch pushes, or a run never finishes.
- Worktree agents: give each a task whose files don't overlap; merge with `git merge <their branch>`; `check_site.py`'s step
  strings (`WOOD`, `EACH`, `FITS`, `ADD`, `SWAP`) can be run alone by a small Playwright script that pulls them out with a regex.
