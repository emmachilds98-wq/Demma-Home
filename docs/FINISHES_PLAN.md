# Finishes: change any surface in any room, by tapping it

Written 5 Nov 2026 (V2.1), at the client's request: "review the repo and use research and the claude design skills for ui, apps and 3d
models to suggest a upgrade for the demma home repo to improve the way it is used in order to customise different areas of the house in
a fluid way, ie colour of walls. light fixtures, carpet, and other options we might want."

**Agents: the client said go (5 Nov 2026: "continue onto the next upgrade ... keep running the upgrade cycles").** Work the board
(section 6) top to bottom, one phase a PR, merged to main when its checks pass. The
rules in `CLAUDE.md` hold above everything here: privacy first, the old design (the 3D is the site, floating pills and panels, no
dashboards or side menus), say less, core plan vs options, every size and price from a source.

---

## 1. What we have today

**The living room can be changed; the rest of the house, only its ceilings, all at once.**

- **The living room's Look** (`room3d_page.py` `"look"`, `room3d/03_materials.js`, `room3d/19_controls.js`): five paints (`render.py`
  `PAINTS`, the client's pale mint first) plus any colour; a wall picker (six walls, a hand-written list); the ceiling and the skirting
  (same as the walls, white, any colour); a feature wall; the floor, the rug, cushions, curtains, the oak (`DECOR`). Lights are under
  View (every light's slider and colour). It works well: a paint change never rebuilds a shader (v35), and the choice rides in the
  `#look-` link and Save my plan.
- **Every other room** is drawn from `house/model.py` with **one `paint` material for every room's walls**, one `ceiling`, and the floors
  from `FLOOR_FINISH` (a room → a material), all merged per floor and material (`room3d/20_go.js`, `HMATS`). The ceiling lights are one
  standard pendant each (`model.pendants`, a rose, flex and bulb). The one thing that can be changed there (V2.2): **all the house's ceilings at once**, white or any colour (View → More, `S.hceil`); one colour for every room.
- **Each option is code in three places:** a Python list (the paints, the walls, `DECOR`), the panel's HTML, and its apply function in
  the 3D. A new paint or a new floor is a code change and a round.
- **What's ready to build on:** the photo-texture library (`house/textures/textures.json`: carpets, laminate, oak, pine, birch, tiles,
  plaster, brick), the tap-a-piece card (V1.50: `PICK`, `housePiece`, `selPiece`), Measure's rows and Send link, and `pull_edits.py` →
  `house/client_edits.json` (each change with its source).

**The catch, found reading the model:** an inside wall is one box with a face in each room (the landing's side and the bedroom's side),
and many walls aren't tagged with a room at all. So "bedroom 2's walls in green" needs each wall *face* to know its room. That's the
first thing to build (F1), and it's all in the build: the rooms' outlines are already in the house file.

## 2. What others do (research, Nov 2026)

- **Paint visualisers** (Dulux Visualiser, Crown, Jotun ColourDesign): tap a wall, tap a colour, see it at once; no Apply button. Their
  reviews' top complaints: colour bleeding onto the next surface, and no way to paint *one* wall without the rest. Ours is a true 3D
  model, so every surface is exact: that's our edge, and the scope chips (section 3) answer the second.
- **Dulux and Crown** show the colour under the room's light, and match a colour from something you already own. We already have time
  of day (day, evening); a colour from one of the client's photos is cheap to add (F6).
- **Product configurators** (the glTF `KHR_materials_variants` extension, model-viewer, threepipe): named material sets swapped on the
  same shape. The idea fits (a "scheme" is a variant set); the format doesn't: our house is made from boxes in the build, not glTF, so we
  keep our own data and borrow the idea.
- **Paint data:** brands publish a hex and an LRV (how much light it reflects, 0–100) per colour; no open, licensed dataset turned up,
  so each paint goes in by hand with its source, as `PAINTS` does now (CLAUDE.md: every item from a cited source).
- **Lights in three.js** take a colour, not a colour temperature, so a bulb's kelvin (2700 warm, 4000 cool) is turned into a colour in
  our code. Area lights cast no shadows and IES profiles need add-ons: not needed for a fitting's look; the room's one shadow light stays.

## 3. The upgrade: one way to change anything

### 3.1 How it's used (the client's side)

1. **Tap a surface** in any room, In it or Be there: a wall, the ceiling, the floor, the skirting, a door, a light. The card that opens
   today for a piece (V1.50) opens for it, with one new row: **Finish**.
2. **The Finish row is a tray of swatches** that slides sideways (a phone), the room's own colours first, then the catalogue: paints,
   carpets and floors, light fittings and bulbs, by what you tapped. Tap a swatch: the room changes at once. No Apply, no "are you sure".
3. **Scope, one row of chips under it:** This wall · This room · This floor · Whole house (walls); This room · Whole floor (carpet). The
   default is the room. It answers the paint apps' top complaint in two taps.
4. **Undo** in the toast ("Bedroom 2: walls Card Room Green · Undo"), and **As it is**, a button you hold down: while held, the house as
   it is today; let go, your choice. (A spring-loaded mode: you can never get stuck in it.)
5. **Colours that go with it:** under a picked paint, a short row of paints that suit it (section 3.4). One tap tries one.
6. **One fact on each swatch:** the name in their words ("Your pale mint") and, held or hovered, its brand, LRV and price. Nothing more.
7. **Schemes:** every choice lands in the current scheme ("Our plan" to start). Name another, switch between them in the dock's Look
   panel, which becomes the whole house's (today it's only the living room's): *A room's scheme*, *Copy to another room*, *Send to us*.
8. **The payoff, at the end:** Send lists what changed and **what it takes**: "Bedroom 2, walls: Card Room Green, 2 coats, 31 m², 2 × 2.5
   L, about £90". The model knows every face's area, so litres and square metres come from it, not a guess. (An option stays an option:
   it goes into the plan's Buy list only when the client says "make it the plan", as `CLAUDE.md`'s core-vs-options rule says.)

The old design holds: no new tab bar or menu. The card, the tray, the toasts, the dock's Look panel and the `#look-` link exist today;
this widens them from the living room to the house.

### 3.2 What's in the catalogue (the "other options we might want")

| Slot | What you pick | Drawn as |
|---|---|---|
| Walls, ceiling, skirting and doors' paint | paints (name, brand, hex, LRV, sheen, price), any colour | the colour; sheen as roughness |
| Feature wall | any paint on one wall (the This wall chip) | as above |
| Floor | carpets (grey, oatmeal, ...), laminate, oak boards, tiles, a tint each | the texture library, tinted |
| Ceiling light | pendant, flush, spotlights, a shade style | turned shapes (`o.lathe`, as the pendants now) |
| Bulb | warm 2700 K, neutral 3000 K, cool 4000 K, brightness | the room's light colour and strength |
| Wallpaper and patterns (F9) | wallpapers (name, maker, repeat, roll size, price), a few patterns (stripes, panels, a mural) on any wall | the pattern's photo at its real repeat, tinted where it allows |
| Furniture, every room (F10) | move, turn, swap or add a piece in any room; the catalogue Edit room has today | the house's pieces as parts (as the doors are) |
| The outside (F12) | the front door's outside, the window frames, our fences' stain, the garden's lawn, paths and plants | the outside's materials, through the same palette |
| Later (F8) | door handles, blinds and curtains, radiators, worktops, wall tiles | the same card and tray |

Each entry: its name, where it's from, its price and a link (`fit.SOURCES` style). A new paint or carpet is **a line of data**, never
code.

### 3.3 How it's built (the agents' side)

- **`house/finishes.py`** (new): the catalogue (section 3.2), each with its source; and the house's finishes as planned today (every room
  as the photos show it), which is what "As it is" shows.
- **Surfaces in the house file** (`export_house.py`, `house.schema.json`): each room gets its surfaces (`walls`, each wall by its side,
  `ceiling`, `floor`, `trim`, `light`), each with its area and its finish. The build gives every face of every `paint`, `ceiling` and
  floor box a surface id: the room its face looks into, from the rooms' outlines (an inside wall's two faces get two rooms). A check: no
  face in a room without a surface, no surface with no faces.
- **One material, a palette:** the walls stay one merged `paint` material per floor (no new draws), with a surface number on each corner
  of each face and a small palette picture (one pixel per surface) the shader reads its colour from. A paint change writes one pixel: no
  shader rebuilt, no geometry rebuilt, instant on the iPhones. The same for the ceilings and the trim. (`onBeforeCompile` on the existing
  `MeshStandardMaterial`, so the ceilings' artex, the sun and the shade are untouched.) V2.2's house ceiling colour (`S.hceil`) becomes
  the Whole house chip on a ceiling, and its saved choice carries over.
- **Floors:** a room's floor is its own small mesh (about 20 rooms, about 20 draws, inside the 600 a phone's budget allows), so a carpet
  swap is a material swap. The materials are made once at start, so swapping never builds a shader.
- **Light fittings:** the fitting is a part (as the doors are) built from a profile in the catalogue; swapping rebuilds that one
  part. The bulb's kelvin sets the room's light colour (`11_lights.js`).
- **Saved and sent as Measure's edits are:** `{room, surface, finish}` rows on this device and in the Send link; `pull_edits.py` folds
  them into `house/client_finishes.json`, each with its source and date, and the build draws them. The living room's `S.paint`,
  `S.walls`, `S.ceil`, `S.skirt` become the same rows (its walls are surfaces too), so the living room's Look and the house's are one.
- **The living room** keeps every option it has (the feature wall, the oak, the decor, the lights' sliders); its paints move into the
  catalogue, the client's words kept ("pale mint", "artisan oak").

### 3.4 The four more (F9–F12)

- **Wallpaper and patterns (F9):** in the same tray as the paints, under This wall (wallpaper is mostly one wall). Drawn at its real repeat
  (its maker's figure), lined up from the wall's corner. What it takes counts rolls, not litres: the wall's height and width, the repeat and
  the roll's size, plus one roll spare. Patterns from photos with their source, as the textures are now (`house/SOURCES.md`).
- **Furniture in every room (F10):** Edit room's moves (drag, turn, swap, add from its catalogue: `13_edit_room.js` `CATALOGUE`) in every
  room, not just the living room. Today the house's furniture is merged into its floor, so a piece that can move becomes its own part, as
  the doors did in V1.26; only when it's tapped, so the draws stay inside a phone's 600. The walk and the checks read where it now stands
  (a moved bed is solid where it stands). Sent as rows `{item, x, z, turn}` with the size edits (V1.50), folded in by `pull_edits.py`. A
  move is an option to look at; it goes into the plan only when the client says so.
- **Colours that go with it (F11):** for each paint in the catalogue, the colours its own maker suggests with it (Farrow & Ball, Little
  Greene and Dulux publish these), entered by hand with the source; for any colour, a lighter and a darker of the same shade for the
  ceiling and the woodwork. A short row under the picked paint, never a page of them.
- **The outside (F12):** the front door's outside face, the window frames, our own fences' stain, the lawn, paths and the garden's
  plants, through the same tap, tray and palette. Only ours: next door's and the street stay as they are. Privacy holds (`CLAUDE.md`):
  colours and finishes only, nothing that names the house or where it is.

## 4. Why this shape (the design reasons, in brief)

- **Edit in place, the thing itself** (V1_PLAN 2.1, principle 4): you change the wall by touching the wall, not by finding its name in a
  list. It's also how the paint apps work, so it needs no teaching.
- **Undo, not confirm:** every finish change is reversible, so it's instant with Undo in the toast; "As it is" is held, never a mode.
- **The common path first:** the room is the default scope (most changes are "this room"); one wall and the whole house are a chip away.
- **Fast:** under 100 ms from tap to colour on a phone, because only a pixel changes. If a floor's photo isn't loaded yet, its mean colour
  shows until it lands (as V1.9 does today).
- **The end of the story is the answer:** Send ends on what it takes and costs, the moment the client can act on, so it carries the most
  care.

## 5. Not doing (and why)

- **glTF and `KHR_materials_variants`:** our house is boxes made in the build; converting it gains nothing the palette doesn't.
- **IES light profiles, area-light shadows:** costly on the iPhones; a fitting's shape and its bulb's colour carry the look.
- **A shared database for Emma and Dave on Pages:** Pages can't keep one; the Send link (as Measure) carries a scheme between you.
- **Paint colours scraped from brands' sites:** entered by hand with their source, as now.

## 6. Status board (update this table in every PR)

| # | Phase | Status | What |
|---|---|---|---|
| F1 | Surfaces in the house file | **Done** (V2.4) | Every wall, ceiling and floor face knows its room (`export_house.py`); each room's surfaces with their areas in `house.json` and its schema; checks: every face has a surface, every surface has faces. Nothing on the site changes. V2.4: `house/surfaces.py` (a face's room 1 cm out from it, split by storey and by room; the stair wall's paint not counted twice); `house.json` rooms' `surfaces`; 4 model checks. Found and fixed on the way: the ground floor's rooms had no ceiling of their own (the slab's grey showed; `model.ground_ceilings`) |
| F2 | The palette | **Done** (V2.5) | The walls, ceilings and trim drawn through one palette per floor; `R3D.finish(room, surface, hex)` changes one in 1 pixel; the gallery the same to the pixel before any change. V2.5: no geometry changed: a plan of the rooms (2 cm a pixel, a band per floor, `R.HOUSE3.finish_pieces`) tells the walls' and ceilings' shader which room is 3 cm in front of a face, its normal which side; a palette (a row per room: back, front, east, west, ceiling) says its colour, an empty pixel leaves it as drawn (`20_go.js` `finPatch`, `finish`). Five views the same to the pixel; `check_site` tries it. The trim (skirting, doors) comes with F3's tap |
| F3 | Tap a surface | **Done** (V2.6) | The card's Finish row: the swatch tray, the scope chips, Undo, hold As it is; `check_site.py` taps a wall in three rooms. V2.6: `room3d/23_finish.js`: a tap on a wall or a ceiling in any of the house's rooms opens its card (`fin:room:slot`); the tray: White and the living room's paints (the client's own still to come), Any colour; This wall · This room · Whole house; Undo on the card; As it is held; kept on this device (`S.fin`) and drawn through F2's palette. The skirting and doors (trim) wait for their own surfaces |
| F4 | Floors | **Done** (V2.7) | A room's floor its own mesh, the carpets, laminate, boards, tiles from the texture library in the tray. V2.7: tap a room's floor: grey and oatmeal carpet, laminate, oak and pine boards, pale tiles, black marble, quarry tiles (the house's own materials, their photos); This room · Whole floor; Undo, As it is. A chosen floor is laid on the room's pieces as its own thin mesh (`finFloorApply`, at its floor's real height: `R.HOUSE3.finish_floor_y`), so nothing is added until one is chosen |
| F5 | Lights | **Done** (V2.9 bulbs; V2.15 fittings) | Fittings (pendant, flush, spots, shades) as parts; bulbs by kelvin and brightness. V2.9: the bulbs: on a ceiling's card (every room) and a light's own card: Warm 2700 K, Neutral 3000 K, Cool 4000 K, Daylight 5000 K; Soft, Normal, Bright; the room's ceiling lights take them (`kelvinHex`, `placeRoomLights`). V2.15: the fittings: on a ceiling's and a light's card, The light: As it is, a bare bulb, a drum shade (40, E), an opal globe (25, E), a flush dome (32, E), four spots (GU10, 45 out, E) (`S.fin` slot 8, `finFitApply`); the room's own (the photos' pendant, its pieces their own group: `FIN_PEND`) hides while another's up; the room's light at its height (`finFitDrop`) |
| F6 | Schemes and sending | **Done** (V2.11 sending; V2.13 schemes, copy; V2.14 a colour from a photo) | Name, switch and copy schemes (the dock's Look, the whole house); Send rows; `pull_edits.py` → `client_finishes.json`; a colour picked from a photo. V2.11: Measure's Send link carries the house's colours, floors and bulbs (`R3D.finishes`), opening it brings them in (`R3D.setFinishes`, checked as data: `finClean`), `pull_edits.py --link` keeps them in `house/client_finishes.json`, and a device that hasn't picked its own starts from that. V2.13: Look's The house's colours (shown in the house's views too, alone there): save what's picked under a name, switch in one tap (`finSchemes`, this device); a room's card: Copy this room, then on another room's card Paste its look (walls, ceiling, floor, bulbs; Undo takes it back). V2.14: a colour card's Photo: choose a photo (drawn small, kept only in the page, never sent), tap a spot in it, its colour (a 7 px average) goes on as any other (`finPicLoad`, `finPicAt`) |
| F7 | What it takes | **In part** (V2.12: m² and litres) | Send's litres, m² and rough cost from the surfaces' areas; into the Buy list only when the client makes a scheme the plan. V2.12: Measure's "What your colours and floors take": each room's walls by colour (the sides chosen; never the stair wall), its ceiling and floor, in m² from the house file, the paint in litres (two coats at about 12 m² a litre, E) and 2.5 L tins, the floor with 10% for cutting (`finTakes`, `R.HOUSE3.finish_areas`). Left: rough cost (needs each paint's and floor's price, with its source) and the Buy list |
| F8 | The living room joined, more slots | Not started | The living room's Look on the same rows (pixel for pixel as before); then handles, blinds, radiators, worktops, tiles |
| F9 | Wallpaper and patterns | Not started | Wallpapers and patterns in the tray (This wall), at their real repeat; What it takes counts rolls |
| F10 | Furniture in every room | Not started | Edit room's move, turn, swap and add in any room; a tapped piece becomes its own part; the walk and the checks follow it; rows sent and folded in |
| F11 | Colours that go with it | Not started | The makers' own suggested colours per paint (with sources), a lighter and darker for any colour; a short row under the picked paint |
| F12 | The outside | Not started | The front door's outside, the window frames, our fences, lawn, paths and plants; ours only |

**Needs the client:** the paints, carpets and fittings they'd like in the catalogue to start (names or photos), and which room first; for
F9, any wallpapers they like (name or photo); for F12, a photo of the front door from outside if they'd like it matched first.
