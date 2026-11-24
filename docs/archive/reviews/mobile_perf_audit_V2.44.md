# Mobile performance and load size audit (V2.44, 6 Nov 2026)

Measured on a local build of `main` (V2.44) in headless Chromium: a desktop (1920 × 1080, reported as an RTX 3060) and an iPhone-sized phone (393 × 852, 3×, reported as Apple GPU, CPU slowed 4×). The live site couldn't be reached from the sandbox. The sandbox has no real graphics card, so the **frame times are not real**; the bytes, counts, shader numbers and CPU-side times are.

## What a first visit costs

| | Desktop | Phone |
|---|---|---|
| Downloaded on open | 16.8 MB, 11 requests | 16.7 MB, 9 requests |
| of which photo textures (`photos.<hash>.json`) | 13.0 MB | 13.0 MB |
| the page (`index.html`) | 2.3 MB (542 KB gzipped) | same |
| three.js | 837 KB (253 KB gzipped) | same |
| pictures for hidden sheets | ~700 KB | ~600 KB |
| Shader programs | 63 house · 117 living room | 76 house · 105 living room |
| Draw calls / triangles, whole house | 791 / 767k | 271 / 259k |
| Draw calls / triangles, living room | 1135 / 419k | 187 / 61k |
| Start: shader compile (view → compiled) | 17 s* | 8 s* |
| JS heap | 119 MB | 114 MB |

\* software graphics; real devices are much faster, but the share is the point: compiling shaders is the biggest part of the start.

## Ranked fixes (small, independent, one PR each)

1. **Keep the photos cached across versions** (`sw.js`). Each new version deletes every old cache, so a phone re-downloads the 13 MB photos and three.js after every round although their hashed names didn't change. Put hashed files in a cache that isn't tied to the version. Saves ~14 MB per update. A few lines.
2. **Photos as their own files, not one 13 MB base64 JSON.** Base64 adds a third (9.5 MB of real pictures). Serve each texture as a `.webp`/`.jpg` with a hash, loaded when its room needs it (the house's outside first). Re-encode the normal maps (`carpet_grey` 489 KB, `lawn` 439 KB, `artex` 402 KB). Rough saving: 13 MB → 5–6 MB in all, ~2 MB before the house looks finished.
3. **Minify the 3D code and CSS in the build** (esbuild is already there). The inline 3D module goes 667 KB → 359 KB (gzipped 219 → 134 KB); CSS 117 → 93 KB. Less for a phone to parse on every open. Build-only change.
4. **Don't build the Plan, Build and Buy sheets at start.** The page carries ~1 MB of hidden markup (14,500 elements, 417 KB of inline drawings) that's parsed before the 3D starts. Load it the first time a sheet opens (or put it in a `<template>`). `index.html` would roughly halve.
5. **Hidden sheets' pictures only when opened.** ~600–700 KB of pictures load on open (`3d_wall_drawers`, `art_join_mint`, `dims_join`, the before/afters) though nothing shows them. Set their `src` when the sheet opens.
6. **Only the icons the page uses.** The icon font loads the whole Material Symbols set with an optical-size range and `display=block` (icons invisible until it lands). Adding `&icon_names=` with the 65 names used shrinks it to a few KB. (Its size couldn't be measured here; it's usually hundreds of KB.)
7. **Fewer shader programs.** 105–117 programs; compiling them is the slowest part of opening and of entering a room. Find materials that differ only in a setting that doesn't need its own shader and share them. Medium; measure with `R3D.perf().programs`.
8. **Lighter whole-house view.** 767k triangles and 791 draw calls on a PC, 259k on a phone. Check how much V2.44's bevels added; use fewer bevel segments on small or far pieces, and merge more of the house's fixed pieces per material. Medium.
9. **`plan.html` as a tiny redirect** instead of a second 2.3 MB copy of the page. Only old links use it. Trivial.

## How to measure again

`R3D.perf()`, `R3D.timing()` and `?perf` on the site already give the counts; the audit script spoofs the GPU name to take the PC and phone paths. A real check on Emma's phone and PC with `?perf` would give true frame rates.
