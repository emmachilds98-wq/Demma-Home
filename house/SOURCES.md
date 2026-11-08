# Sources for the house's textures

Photo-textures (v70), all **CC0** (public domain) from [Poly Haven](https://polyhaven.com). They were downloaded at 2k, then toned
to the client's photos and shrunk to 1024 px (the living room's oak 2048; V1.11, was 512; the carpets and the soft weaves 512, V2.82, finer than a screen shows) by `house/textures/build_textures.py`. On Pages they come after the first picture (V1.9); the shared page carries them inline. V1.21: the soft things' weave: the bedding (stretch_poplin; the pillows and mattresses share it), the curtains (rough_linen), bedroom 2's bed (brown_leather), the sofa-bed (caban) and the blanket (jersey_melange), each tinted to its colour. V1.13: the kitchen's worktop from granite_tile_03 (one tile cropped); the artex made by `build_textures.stipple` (ours). V1.12 adds the rooms' own: walls and ceilings (white_plaster_02), pine and dark pine (coated_pine), birch (white_maple_veneer), the office's oak (oak_veneer_01), each tinted to its colour. The real size is
the area one copy of the picture covers.

| Used for | Poly Haven asset | Real size | Toned |
|---|---|---|---|
| Brick (front, back, gable, party wall) | [red_brick_03](https://polyhaven.com/a/red_brick_03) | 1.0 m | warmer and brighter (the front photo's orange-red) |
| Roof tiles | [roof_09](https://polyhaven.com/a/roof_09) | 2.4 m (V1.47; was 4.0: tiles 50 across) | much darker and browner (the brown concrete tiles) |
| Lawns | [sparse_grass](https://polyhaven.com/a/sparse_grass) | 2.0 m | its light and shade tinted to the back photo's green (#5a7838; V1.3) |
| The drive | [brushed_concrete](https://polyhaven.com/a/brushed_concrete) | 2.5 m | greyer, brighter |
| The road | [asphalt_02](https://polyhaven.com/a/asphalt_02) | 3.0 m | — |
| The pavement | [rectangular_paving](https://polyhaven.com/a/rectangular_paving) | 2.0 m | greyer |
| Laminate (the WC, the lower landing) | [laminate_floor_02](https://polyhaven.com/a/laminate_floor_02) | 1.7 m | grey (the client's grey wood-effect) |
| Carpet (v72: the bedrooms, landing, hall, stairs; oatmeal elsewhere) | [Carpet012](https://ambientcg.com/view?id=Carpet012) (ambientCG, CC0) | 0.5 m | its pile tinted to the photos' grey (#6f6f73) and the oatmeal (#cdbfa6) |
| The living room's oak (V1.1: the media wall, the cabinet, every oak part) | [oak_veneer_01](https://polyhaven.com/a/oak_veneer_01) | 0.6 m | turned so the grain runs along the boards; in the page, scaled to each part's own oak colour |
| The living room's curtains (V1.1) | [hessian_380](https://polyhaven.com/a/hessian_380) | 0.6 m | in the page, scaled to the curtains' colour |
| The sofa's corduroy (V1.1, its ribs only) | [ribbed_corduroy](https://polyhaven.com/a/ribbed_corduroy) | 0.6 m | relief only (the sofa keeps its blue) |
| The living room's carpet and the oatmeal (V1.1) | Carpet012, as above | 0.5 m | in the page, scaled to your grey and the oatmeal |
| The bathroom's floor: black marble-effect tiles, 60 × 60 (V2.37; house/HOUSE.md) | ours: `build_textures.tiles` | 1.2 m (2 × 2 tiles) | white veins on the slant, grout sunk, glazed |
| The bathroom's walls: grey stone-effect tiles, 60 × 30 in courses (V2.37) | ours: `build_textures.tiles` | 1.2 m | soft mottle, grout sunk |
| The kitchen's black bevelled metro tiles, 20 × 10, light grout (V2.37) | ours: `build_textures.tiles` | 0.4 m | the bevel and the grout in the relief, glazed |
| uPVC (frames, outside doors, gutters, sills), gloss paint (skirting, inside doors, newel, rail), brushed steel (V2.56) | ours: `build_textures.finishes` | 0.5 m (steel 0.3) | white detail under each one's own colour: faint peel, brush strokes, grain |
| The dormer's cheeks: dark-stained timber weatherboards, 15 high, lapped (V2.56; the back photo) | ours: `build_textures.finishes` | 0.6 m | the lap's shadow and the grain along the boards |
| Upgrade floors to try (V3.14, N56; fit.SOURCES upfloors): herringbone oak 90 × 450 at 45°, grey oak LVT planks 17.8 wide, stone porcelain 120 × 60 | ours: `build_textures.floors` (from oak_veneer_01's grain) and `tiles` | 1.27 m, 1.25 m, 2.4 m | each block its own run of the veneer, the bevels sunk |

V1.30 (`docs/UPGRADE_REVIEW.md` U5): the **roughness maps** of the same CC0 assets (Poly Haven's API, 1k, made 512 px grey by
`build_textures.py --rough`): laminate_floor_02, coated_pine (pine, dark pine), white_maple_veneer (birch), oak_veneer_01, roof_09; centred on
0.85 so each material keeps its roughness on average, the laminate's and pine's contrast raised (3×, 2×).

Everything else is drawn in the page (`room3d.js` `houseTex`), sized from the real things (tiles 60 × 30 and 60 × 60, metro 20 × 10, bricks 21.5 × 6.5).
