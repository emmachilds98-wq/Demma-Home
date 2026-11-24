# Demma Home: review for the next upgrades (6 Nov 2026, at V2.44)

Read-only review of `main` (commit 1641772). No open PRs; only `main` exists. I could not open the live site from here (the network blocks it) and did not run a build, so the sizes below come from the source, not from measuring the live site.

## What it is

- A static site on GitHub Pages: one page, three.js fills the screen with the whole house in 3D, pills and panels float over it. You walk in first person, tap a piece to resize, move, turn or remove it, and tap a wall, floor or light to change its finish. A media wall project for the living room has its own plan, build list, buy list and PDFs.
- Python builds everything: `house/survey_data.py` (sizes, each with a source) → `house/model.py` → `house/export_house.py` (house.json) → `media-wall/src/build_viewer.py` and `room3d_page.py` (the page). `tools/build.py` builds it, `tools/checks.py` checks it, and the workflow publishes on every push to `main`.
- The 3D is 22 JS parts in `media-wall/src/room3d/` (about 8,000 lines, 683 KB). It is joined into the page as it is, without minifying. Only three.js goes through esbuild.
- Handover docs: `CLAUDE.md` (rules; privacy comes first), `docs/STATE.md` (what's true now), `docs/V1_PLAN.md`, `docs/REAL_PLAN.md` (R1–R8 board), `docs/FINISHES_PLAN.md`, `docs/UPGRADE_REVIEW.md` (its "Next" list), `docs/DECISIONS.md`.
- Open on the boards: R3 surfaces, R4 shapes, R5 small things and R6 furniture are in part. R7 (one Look for every room) has not started. R8 "fluid as a game" is in part: KTX2 and real device numbers are still to do.

## The biggest issues

1. **Every texture comes as base64 text.** `export3d.py` turns all of `house/textures/` (about 10 MB of JPEGs) into base64 inside one `photos.<hash>.json`, which comes to about 13–14 MB. The browser downloads it whole, parses it as JSON on the main thread and decodes every picture, even for rooms you never visit. This is the main cost when the page opens, and the main memory cost on phones.
2. **Phones get the same 1024 px textures.** A phone with a good chip (`GOOD_PHONE`, which includes the iPhone 15 Pro) loads the full set. A phone without one gets no photos at all. There is no middle size.
3. **The app JS isn't minified.** About 720 KB of the page's own script ships with its comments and full names. esbuild is already installed.
4. **Options load before anyone opens them.** The two biggest parts are `20_go.js` (82 KB) and `07_suggestions_ideas.js` (78 KB, the living room's suggestions and ideas). Both load and run before the first frame, even though options are "only to look at".
5. **Repo bloat.** 115 HD stills (`media-wall/src/art/3d_*.webp`, 15 MB) are committed, although `shot3d.py` is no longer part of the build ("No HD stills"). The git pack is 77 MB. Four texture files are byte-for-byte copies (`pine_dark_nor/rough` = `pine_nor/rough`, `carpet_grey_nor` = `carpet_nor`, `brick_buff_nor` = `brick_nor`). One photo in `media-wall/inputs/` is a duplicate (`room_photo_rears_20oct.jpg` = `photo_room_curtains_evening.jpg`).
6. **Heavy handover docs.** STATE.md is meant to be under 150 lines, but one paragraph runs V2.24 to V2.44 as a single line of several KB. The R4 and R8 rows on the REAL_PLAN board are paragraphs too. Every new agent reads all of it before starting.
7. **No numbers from real devices.** UPGRADE_REVIEW Next 3 (`?perf` from the iPhones and the RTX 5070 PC) is still open, so KTX2 and light maps can't be decided. Only Emma can run this.

## Tasks for parallel agents (each one PR)

| # | Task | Touches | Size |
|---|---|---|---|
| A | Serve textures as their own files (`art/tex/<key>_map.<hash>.jpg`), not base64 JSON. Load the ones the current floor or room needs first and the rest when the page is idle. The service worker keeps them. Remove the 4 duplicate texture files and point their keys at the shared file. | `export3d.py`, `room3d_page.py`, `build_viewer.py` (split_photos, sw.js), `room3d/02_textures.js` | M |
| B | A 512 px texture set for phones (built by `build_textures.py`, or resized at build time), chosen by `SMALL`. Do after A. | `house/textures/build_textures.py`, `02_textures.js` | S |
| C | Minify the page's own script at build time with esbuild (`--minify`, no bundling). The source stays as it is; check the site checks still pass. | `room3d_src.py` / `build_viewer.py` | S |
| D | Load the living room's suggestions and ideas (`07_suggestions_ideas.js`) on first use, not at start. | `room3d/07_*.js`, how parts are joined, `room3d_page.py` | M |
| E | Repo clean-up: find which `3d_*.webp` stills the page and plan still show (`SHOTS3D`, `build_doc.latest`), remove the unused ones and the duplicate photo, and update `deck_assets.json` / `shot3d_prints.json`. Run `privacy_check.py`. | `media-wall/src/art/`, `media-wall/inputs/` | S |
| F | Slim the docs: rewrite STATE.md as short bullets (history moves to HISTORY.md) and cut the REAL_PLAN and FINISHES board rows to one line each. Only docs change, so CI skips the browser checks. | `docs/` | S |
| G | Phone audit: Playwright as an iPhone 15 Pro, Pixel 7 and iPad Mini. Take screenshots of the welcome, the whole house, a room, the cards and Measure. Note overlaps, small tap targets and text that is cut off, then fix the CSS. | `page.css`, `room3d_page.py` | M |
| H | (Emma) Open the site with `?perf` on the iPhone 15 Pro and the 5070 PC and paste the numbers. This decides KTX2 (R8) and light maps. | none | Emma |

Conflicts: A and B both touch `02_textures.js` (do B after A). C and D both touch how parts are joined (do D after C, or run them in one thread). E, F and G are independent. Every PR also bumps `VERSION` and rewrites `docs/STATE.md`, so parallel PRs will conflict there. The simplest fix is for each agent to rebase just before merging and take the newest version number. The other option is to let one thread own the version bump.

Suggested order: run C, E, F and G in parallel now. Then A, then B. Then D. Ask Emma for H at any time.
