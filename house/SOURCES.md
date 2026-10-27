# Sources for the house's textures

Photo-textures (v70), all **CC0** (public domain) from [Poly Haven](https://polyhaven.com). They were downloaded at 1k, then toned
to the client's photos and shrunk to 512 px (the living room's oak 1024) by `house/textures/build_textures.py`. The page carries them inline. The real size is
the area one copy of the picture covers.

| Used for | Poly Haven asset | Real size | Toned |
|---|---|---|---|
| Brick (front, back, gable, party wall) | [red_brick_03](https://polyhaven.com/a/red_brick_03) | 1.0 m | warmer and brighter (the front photo's orange-red) |
| Roof tiles | [roof_09](https://polyhaven.com/a/roof_09) | 4.0 m | much darker and browner (the brown concrete tiles) |
| Lawns | [sparse_grass](https://polyhaven.com/a/sparse_grass) | 2.0 m | brighter |
| The drive | [brushed_concrete](https://polyhaven.com/a/brushed_concrete) | 2.5 m | greyer, brighter |
| The road | [asphalt_02](https://polyhaven.com/a/asphalt_02) | 3.0 m | — |
| The pavement | [rectangular_paving](https://polyhaven.com/a/rectangular_paving) | 2.0 m | greyer |
| Laminate (the WC, the lower landing) | [laminate_floor_02](https://polyhaven.com/a/laminate_floor_02) | 1.7 m | grey (the client's grey wood-effect) |
| Carpet (v72: the bedrooms, landing, hall, stairs; oatmeal elsewhere) | [Carpet012](https://ambientcg.com/view?id=Carpet012) (ambientCG, CC0) | 0.5 m | its pile tinted to the photos' grey (#6f6f73) and the oatmeal (#cdbfa6) |
| The living room's oak (V1.1: the media wall, the cabinet, every oak part) | [oak_veneer_01](https://polyhaven.com/a/oak_veneer_01) | 0.6 m | turned so the grain runs along the boards; in the page, scaled to each part's own oak colour |
| The living room's curtains (V1.1) | [hessian_380](https://polyhaven.com/a/hessian_380) | 0.6 m | in the page, scaled to the curtains' colour |
| The sofa's corduroy (V1.1, its ribs only) | [ribbed_corduroy](https://polyhaven.com/a/ribbed_corduroy) | 0.6 m | relief only (the sofa keeps its blue) |
| The living room's painted walls (V1.1, the plaster's relief only) | [white_plaster_02](https://polyhaven.com/a/white_plaster_02) | 1.6 m | relief only (the walls keep your pale mint) |
| The living room's carpet and the oatmeal (V1.1) | Carpet012, as above | 0.5 m | in the page, scaled to your grey and the oatmeal |

Everything else is drawn in the page (`room3d.js` `houseTex`), sized from the real things (tiles 60 × 30 and 60 × 60, metro 20 × 10, bricks 21.5 × 6.5).
