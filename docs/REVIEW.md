# The full product review and patch plan (27 Nov 2026, V4.103)

Emma, 27 Nov 2026: "now do a review and patch plan for the full build identifying further places for improvement in coding, design,
ideas and functions and anything else that could improve it ... ensure we make the build run optimised with as little bloat code or
redundant code slowing us down or code that could slow performance in place of better ways to do it. use claude design to ensure our ui
and design fits all our functions, settings and use cases. full product patch review"

What was looked at: main at V4.103 (after PRs 387–390), built here (`tools/build.py --fast`), opened once at 393 × 852 (phone) and
1440 × 900 (computer) with CSS coverage and an accessibility pass, and the code read for size, per-frame work and repeats. The rows to
build are `docs/REAL_PLAN.md` **section 36** (N320–N344); this page is the evidence behind them. Section 32's open rows (N259, N260,
N262, N263, N267, N270, N274, N275) are folded in where they fit, not repeated.

**The rule for every row here:** nothing N294–N310 fixed may come back (the doorway light, the stairwell walls, the PC's pixel budget,
the drive and garden walk, the dock per room). Each PR says how it checked that (one `?perf` Copy before and after is enough).

## 1. What we found

### Speed (phones smooth, PCs quiet)

| Found | Where | Why it matters |
|---|---|---|
| About 15 switches decide how hard the 3D works: `SMALL`, `BIG_GPU`, `GOOD_PHONE`, `HI`, `LOWD`, `PHONE_HD`, `WHOLE`, `MOVE_LITE`, `houseLite`, `phoneAO`, `phoneCap`, `slowDev`, `lowRes`, `capDue`, `moveLite`, plus 18 `?` switches | `01_renderer.js`, `17_render_loop.js` | Each fix (N240, N296, N297, N303) added one more; they overlap, so a change for one device moves another (the fan and flicker rounds). One governor would make every device's settings one readable table |
| The loop asks for a new frame 60–144 times a second for ever, even when nothing moves (it then skips the draw) | `17_render_loop.js` `frame()` | A phone and a PC never rest: battery, warmth, fans. Sleep until something changes |
| Every drawn frame walks the whole house for room labels (`declutter`); a phone moving walks the scene for shadow lights every frame (`shStag`); `livingFromOutside` runs every tick | `17_render_loop.js` | Work that only changes when the camera or floor changes (N259 named it) |
| A graphics card is recognised by its name (`nvidia|geforce|rtx|radeon rx|arc|apple m`) | `01_renderer.js` `BIG_GPU` | Laptops with Intel Iris/UHD, AMD "Radeon Graphics" or Snapdragon X fall to the middle by name, not by how fast they are; an older Apple M chip gets the top tier |
| A first visit fetches the whole of three.js (956 KB, 282 KB zipped): `import * as THREE` stops the bundler dropping what we never use | `00_setup.js`, `vendor.py` | Likely a quarter to a third smaller (to be measured) |
| `index.html` is 294 KB: 109 KB of CSS and 58 KB of script inline, fetched again on every release; 15–18% of that CSS is used on the first screen (`lean` finds every `page.css` class named somewhere, so the rest is mostly panels not yet open) | `build_viewer.py`, `page.css`, `room3d_page.py` | Cached once as hashed files like `room3d.<hash>.js`; the panels' CSS loaded with the panels |
| `sheets.<hash>.json` is 1.1 MB (199 KB zipped) for Plan, Build and Buy together | `build_viewer.py` | Opening Buy fetches Build's text too |

### Code (lean, and safe to change)

| Found | Where |
|---|---|
| 1.17 MB of 3D source in 34 parts joined into one scope: 1,349 top-level names (the `names` check already catches a clash; nothing checks length or shape) | `room3d/*.js`, `room3d_src.py` |
| 146 KB of it is comments (`lean` counts 4%: whole lines only; trailing ones make it about 12%), 317 of them version tags ("V2.73 (N17): ..."); 60 lines over 300 characters, the longest 1,007 | every part (N260) |
| 31 empty `catch {}` swallow errors (e.g. `dockSync`), so a broken button fails silently | 14 parts |
| `localStorage` read and written in 20 places across 8 parts, each its own key and format | `00`, `14`, `15`, `16`, `18`, `19`, `23`, `24` |
| Materials never unregistered, drops dispose geometry but not materials, texture caches only grow (N259) | `03_materials.js`, `08_house_edits.js`, `22_kitchen.js` |
| 84 bits of page script live inside Python strings, never linted (N258's rest) | `build_viewer.py` |
| `perf_budget.json`'s "_" note is a 4 KB history paragraph | `tools/perf_budget.json` |

### Build, CI and the repo

| Found | Where |
|---|---|
| 113 committed stills of the living room (15 MB, `media-wall/src/art/3d_*.webp`) made by `shot3d.py`, which is no longer in the build: they show the room as it was at that render, not as the 3D shows it now | `art/`, `build_viewer.py`, `build_doc.py` |
| The PDFs are 34 MB a version on Pages; the Plan (8.1 MB) and its phone copy (7.9 MB) carry the same full-size pictures | `media-wall/out` |
| A push to main reaches Pages in about 35 minutes | `.github/workflows/build.yml` |
| A new thread reads about 2,000 lines of docs before starting (NOTES 648, HISTORY 503, REAL_PLAN rows that are paragraphs) | `docs/` |

### Design and UI (design critique, accessibility, design system)

What works: the old design holds (the 3D is the site, pills float over it); every visible button has a name; reduced motion, focus
rings and Escape are in; the dock is the same five places in every room (N304); phone buttons are 44 px or more.

| Found | Seen | Do |
|---|---|---|
| The walking joystick shows on a computer with a mouse, over the whole house | 1440 wide, house view | Show it on touch only, or on a computer once you walk |
| A black screen while the house builds on a slow computer (12 s under software graphics), with no sign it's loading | 1440 wide | A quiet "Building the house" over the canvas until the first picture |
| The person button (Be there) is the main way to walk in, and only an icon | both | Its word under it, as the dock's buttons have |
| Computer pills 32 px high (Outside, First, Ground, Lower, More) | 1440 wide | 40 px where the screen is also touch (`any-pointer: coarse`) |
| The type is 12 sizes (12, 12.5, 13, 13.5, 14 ...), 52 colours written out next to 44 variables, 22 stacking levels | `page.css`, `room3d_page.py` | Tokens: 6 sizes, colours only as variables, named layers |
| A room's card from the dock still says "As planned" (N266 made it "The plan's" elsewhere); the same dock slot is "Garden" outside and "Room" inside | `25_dock.js` | One word list in `DESIGN.md`, used everywhere |
| No heading for a screen reader; the canvas doesn't say where you are | both | One hidden h1, the canvas named by the room you're in, a polite line when the room changes |
| Two ways to change the living room (its Edit mode and Look's paint) and cards everywhere else; colours have their own undo, moves and Ideas none | N262, N263 | One card everywhere, one Undo · Redo |

**Every function and setting, where it lives today** (to check each one has one home):

| Need | Phone | Computer | Note |
|---|---|---|---|
| Go to a floor or room | floor pills, tap the house | the same | good |
| Walk in | person button, joystick, swipe | person button, keys, joystick | the joystick on a mouse computer is extra |
| Change a room | dock Room (or the living room's panels) | the same | two systems in the living room (N262) |
| Colours, finishes | dock Look, a wall's card | the same | |
| Sizes | dock Measure | the same | |
| Plan, Build, Buy | dock Plan | top-right pills | two places by device: fine, but one name for each |
| Share, quality, labels, help | the gear | the gear | |
| Next door, gardens, more views | ⋯ More | ⋯ More | |
| Undo | colours only | Ctrl+Z colours only | N263 |

## 2. Ideas and new features (options only: Emma picks)

- **Progress:** each change ticked Planned → Bought → Done; done ones shown as built; the Plan card's spend so far against the total.
- **A budget a room:** set one, and Ideas shows set-ups within it first.
- **Now and planned:** one switch for the whole house, as it is today and as planned (the before/after slider is a picture today).
- **The time of day:** morning, afternoon, evening light (waits on her lighting "later", N270).
- **See a piece in the room on the iPhone:** a catalogue piece opened in AR Quick Look at its real size.
- **Measure what matters first:** the guesses ordered by how much each moves the picture (N275's first half).
- **A first visit's three hints:** walk in, tap a wall, open Plan; shown once, then never.

## 3. Workstreams (each a thread; they can run side by side)

| Stream | Rows | Owns these files | Starts |
|---|---|---|---|
| **S1 Smooth on every device** | N320–N323 | `01_renderer.js`, `17_render_loop.js` | now |
| **S2 A lighter first visit** | N324, N326, N256's rest | `vendor.py`, `00_setup.js`'s import line, the sheets in `build_viewer.py` | now |
| **S3 Leaner code** | N327–N329, N259's rest, N260 | every other `room3d/*.js` part, a file at a time | now, on files no other stream has open; `01` and `17` after S1 |
| **S4 Design system and access** | N325, N330–N333 | `page.css`, `room3d_page.py`, the page parts of `build_viewer.py`, small edits in `25_dock.js` | now |
| **S5 One way to change things** | N263, N262, N267 | `13_edit_room.js`, `16_cards.js`, `23_finish.js`, `24_ideas.js` | now (N263 first) |
| **S6 Build, CI and the repo** | N336–N339 | `art/`, `build_doc.py`, `build.yml`, `docs/` | now |
| **S7 Ideas** | N340–N344 | new parts | when Emma picks |

Order inside a stream is the row order. S3 and S5 both touch cards: S3 leaves `16_cards.js`, `23_finish.js` and `24_ideas.js` to S5
until S5's rows merge.
