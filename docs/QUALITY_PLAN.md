# The quality plan: the house at its best

The client, 30 Oct 2026: "write a full upgrade plan to get the house to the best possible quality 3D model and execute it merging to
live when complete". Earlier the same day: "best textures, quality and performance on the PC and mobile". Each phase is a PR, proved by
`tools/checks.py` and the gallery (Q4), merged on green. Status: Not started · In progress · Done (version) · Needs the client.

| # | Phase | Status | What |
|---|---|---|---|
| Q1 | Sharp surfaces | Done (V1.11, V1.12, V1.21) | Every photo from 2k sources at 1024 px (the oak 2048); walls and ceilings plaster, pine, birch and oak grain in their colours; the house's photos fixed (V1.9's 4 × 4 stand-in); full quality first on the iPhones and PCs; V1.21 the soft things' weave (bedding, curtains, leather, wool) |
| Q2 | True to the photos | Done (V1.13, V1.17) | Artex (stipple) ceilings where the photos show them (the kitchen, the lower stairs); clear window glass (it tinted the view blue-green); the kitchen's black speckled worktop from a photo; the walls' plaster back to its photographed relief (V1.12's 4× read as rough render up close, seen in the gallery); V1.17 the hall's and the bathroom's mirrors reflect (they were grey, seen in the gallery) |
| Q3 | Light outside | Done (V1.13) | The whole house reflects its own sky (an environment made from the sky, same size as the room's, so no shader rebuilds): the windows and the gloss catch it |
| Q4 | The gallery | Done (V1.13, V1.15) | `tools/gallery.py`: every room by day in HD, after the photos land, on one sheet (`_shots/gallery.jpg`); V1.15 `--evening` too (it found the windows showing the garden in daylight at night); each round's proof and the client's quick look |
| Q5 | Speed with quality | Not started | Compressed textures (KTX2, about a quarter of the graphics memory) once the photos settle; the iPhones' real numbers first (`?perf`) |
| Q6 | Shape | In progress (V1.14) | Done from the photos and standard sizes: the desk chairs (five-star base on castors, gas lift, padded seat, curved back, arms), the kitchen's bar stools (bucket seat, high back, chrome pole, foot ring, round base), the guitars' bodies (their bouts and waist, the sound hole, the pickguard); V1.16 the front door as the hall photo (cream inside, its two lights through it, four raised panels, the letterbox in the rail, a lever each side); V1.20 the pillows soft and puffed (rounded in steps), bedroom 2's mattress cloth (it was shiny uPVC). Needs the client: the rest (beds, monitors, the sofa-bed) from measurements or product names; doors' panels where the photos show them |
| Q7 | Out of the front | Needs the client | What's opposite the house from the front windows (a photo out of the master bedroom's window); now the ground runs to the horizon |
| Q8 | Every size measured | Needs the client | The 19 guesses in Measure (the dock's fifth button) |

**Not doing:** a path-traced "Render photo" (BUILD_SPEC phase 7): minutes of graphics card a picture and a large library, for pictures the
client already takes in View.
