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
  sources only (ambientCG, Poly Haven: CC0), 1k (2k for big surfaces), listed in `house/textures/SOURCES.md`. Proof: the gallery, close up.
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

## 5. Status board (update this table in every PR)

| # | Phase | Status | What |
|---|---|---|---|
| R1 | Light each room as it's lit | **In part** (V2.17: the room's light casts its shadows in HD; V2.21: by evening the room's own light leads) | The room's ceiling light a real light, its lamps, its windows' daylight; one shadow-casting light; AO for small rooms. V2.21: by evening in a room of the house the studio reflections down to 0.35 (`houseEnvK`), the fill 0.5 to 0.2, the ceiling light 3.2 to 5.4: a warm pool under it, the corners falling off; by day as before. Left: each window's daylight, lamps |
| R2 | Things sit on the floor | **In part** (V2.23: walls and ceilings shaded where they meet) | Baked shade in corners, along skirting and beside pieces, from the house file. V2.23: worked out in the walls' and ceilings' shader (`finPatch`, from the rooms' plan it already reads): a wall darker at its foot, a little at its top and into a room's corner, a ceiling a little at its edges; nothing baked, the outside untouched. Left: beside and under pieces |
| R3 | Surfaces | Not started | Every house material with its photo, relief and shine (CC0) |
| R4 | Real shapes | **In part** (V2.17: the master bedroom; V2.18: the office; V2.19: the kitchen; V2.20: the bathroom and the landing; V2.22: the hall and the WC) | One room a PR: the master bedroom, the office, the kitchen, the bathrooms, the hallways. V2.17: the soft things as cloth (`clothBox`: pillows plumped, the duvet in folds, the mattress crowned, the hanging clothes with shoulders and folds) in every room; the master's bedsides with round knobs and turned bun feet, the chest's knobs round, every garment on a hanger. V2.18: the office's keyboards with their rows of keys (`keyboard`), the mice rounded, the monitors with slim bezels and rounded backs, the shelf's row of books (their spines), a jar and a potted plant. V2.19: the kitchen as its photos: the cooker's four round raised hotplates, its knobs and the oven's bar handle; the washer's round door (a chrome rim, the glass), its dial and drawer; the black bar handles rounded; the sink's plughole and a turned tap; the pedal bin and the kitchen roll (R5). V2.20: the bathroom's basin sunk into the vanity's top (its sides, floor and plughole), the waterfall tap rounded, a round plug in the bath, a toilet roll, the shower's turned riser and round head, the curtain in finer folds; the landing's banister with rounded rails and a turned cap on each post. V2.24 (the client: "square bannister posts not circle tops"): the landing's posts plain and square, flat-topped, at the measured stairwell (85 wide). V2.22: the hall's shoe racks with pairs of shoes (turned ovals, four colours), the WC's toilet roll round under its bar and its white pipes round. Next: a second pass room by room |
| R5 | The things in a room | **In part** (V2.18: the office's books; V2.19: the kitchen's bin and roll) | The client's photos' small things (core); suggestions as options |
| R6 | Change the furniture in any room | Not started | Edit room in every room (FINISHES F10) |
| R7 | One Look for every room | Not started | The living room joined (FINISHES F8), then Look in each room |
| R8 | Quick on the phone | Not started | KTX2 (Q5), lights and shadows only where you are |
