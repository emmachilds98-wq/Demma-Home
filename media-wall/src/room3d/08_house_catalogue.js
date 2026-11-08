/* V2.46 (REAL_PLAN N7, R6): swap a piece of the house for another of its kind, or add one from the catalogue, in any room. Each piece
   here is built from the house's own boxes and materials (its turned parts as lathes), so a swapped or added piece is drawn, tapped,
   walked round, moved, resized and turned exactly as the house's own are. Its rows are Measure's "edits" (Send carries them):
     {item, field: "swap", value: <a key below>}                      a piece swapped (As planned puts it back)
     {item: "add.<n>", field: "add", value: <key>, room, x, z, y}     a piece added where the floor was tapped (Take it out removes it)
   A piece is built in its own frame: u along its wall (0 to W), v up (0 to H), t out from its back (0 at the wall, D at its front). */
const HCAT_KINDS = { bed: "Beds", wardrobe: "Wardrobes", chest: "Chests", bedside: "Bedsides", desk: "Desks", shelves: "Shelves", seat: "Seats", plant: "Plants", more: "More" };
function hcChest(mat, cols, rows, knob = "knob") {   // drawers: a carcass, its fronts with a shadow gap, a knob each
  return (W, H, D, B) => {
    B(mat, 0, 0, 0, W, H, D - 2); B("gap", 1, 6, D - 2.1, W - 1, H - 2, D - 2); B(mat, 1, 0, D - 6, W - 1, 6, D - 5);   // the plinth, set back
    const cw = (W - 2) / cols, rh = (H - 8) / rows;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const u0 = 1 + c * cw, v0 = 6 + r * rh, cu = u0 + cw / 2, cv = v0 + rh * 0.62;
      B(mat, u0 + 0.3, v0 + 0.3, D - 2, u0 + cw - 0.3, v0 + rh - 0.3, D - 0.4);
      B(knob, cu - 1.6, cv - 1.6, D - 0.4, cu + 1.6, cv + 1.6, D); }
  };
}
function hcBed(frame) {   // a bed: its frame, the mattress, a duvet over the foot two-thirds, two pillows
  return (W, H, D, B, L) => {   // V2.91 (N36): the duvet lofty, turned down, its sides and foot hanging (soft in clothBox), as the master's
    const top = Math.min(56, H - 10), z0 = D * 0.34;
    frame(W, H, D, B, L, top - 22);
    B("mattress", 3, top - 22, 9, W - 3, top, D - 2);
    B("duvet", 1.5, top - 1, z0, W - 1.5, top + 9, D - 0.5);
    B("duvet", 2, top + 3, z0 - 2, W - 2, top + 13, z0 + 16);
    for (const u of [0.5, W - 2.5]) B("duvet", u, top - 18, z0 + 2, u + 2, top + 3, D - 1);
    B("duvet", 3, top - 18, D - 2.5, W - 3, top + 3, D - 0.5);
    for (const [a, b] of [[8, W / 2 - 3], [W / 2 + 3, W - 8]]) B("pillow", a, top, 9, b, top + 15, 55);
  };
}
function hcShelves(mat, fill) {   // shelving: two sides, a back, shelves, what's on them
  return (W, H, D, B) => {
    const n = Math.max(2, Math.round(H / 36)), gap = (H - 6) / n;
    B(mat, 0, 0, 0, 2, H, D); B(mat, W - 2, 0, 0, W, H, D); B(mat, 2, 0, 0, W - 2, H, 1); B(mat, 2, 0, D - 3, W - 2, 6, D - 2);
    for (let i = 0; i <= n; i++) B(mat, 2, 6 + i * gap - (i === n ? 2 : 0), 1, W - 2, 6 + i * gap + (i === n ? 0 : 2), D);
    for (let i = 0; i < n; i++) fill(B, 2, W - 2, 8 + i * gap, gap - 4, D, i);
  };
}
const hcBooks = (B, u0, u1, v, h, D, i) => {   // books along a shelf, every height, a gap now and then
  let u = u0 + 1, k = i * 7;
  while (u < u1 - 4) { const w = 2 + (k * 37 % 5) * 0.6, hh = h * (0.62 + (k * 53 % 7) * 0.045); if (k % 9 === 4) { u += 6; k++; continue; }
    B("book" + (k % 6), u, v, D - 4 - 18, Math.min(u1 - 1, u + w), v + Math.min(hh, h - 1), D - 4); u += w + 0.2; k++; }
};
const HCAT = {
  divan: { n: "Divan bed, upholstered headboard", k: "bed", w: 150, d: 205, h: 120, src: "E (a king divan, 150 × 200, headboard 120 high)",
    b: hcBed((W, H, D, B, L, v) => { B("felt", 0, 0, 0, W, H, 8); B("felt", 2, 0, 8, W - 2, v, D); }) },
  oakbed: { n: "Oak bed, slatted headboard", k: "bed", w: 160, d: 210, h: 110, src: "E (a king frame, 160 × 210, headboard 110 high)",
    b: hcBed((W, H, D, B, L, v) => {
      for (const u of [0, W - 7]) { B("oak", u, 0, 0, u + 7, H, 7); B("oak", u, 0, D - 7, u + 7, 45, D); }
      for (let u = 12; u < W - 14; u += 14) B("oak", u, v + 20, 2, u + 8, H - 12, 5);
      B("oak", 7, H - 12, 1, W - 7, H - 4, 6); B("oak", 7, v - 14, 0, W - 7, v + 20, 4);
      B("oak", 0, 14, 7, 5, v, D - 7); B("oak", W - 5, 14, 7, W, v, D - 7); B("oak", 7, 14, D - 5, W - 7, 40, D);
      B("pine", 5, v - 2, 7, W - 5, v, D - 5); }) },
  metalbed: { n: "Black metal bed", k: "bed", w: 145, d: 200, h: 105, src: "E (a double frame, 145 × 200, headboard 105 high)",
    b: hcBed((W, H, D, B, L, v) => {
      for (const u of [0, W - 3]) { B("black", u, 0, 0, u + 3, H, 3); B("black", u, 0, D - 3, u + 3, 70, D); }
      for (const vv of [v + 12, H - 3]) B("black", 3, vv, 0.5, W - 3, vv + 3, 2.5);
      for (let u = 14; u < W - 12; u += 12) B("black", u, v + 15, 1, u + 1.6, H - 3, 2.2);
      B("black", 3, 66, D - 2.5, W - 3, 69, D - 0.5); B("black", 0, v - 4, 3, 3, v, D - 3); B("black", W - 3, v - 4, 3, W, v, D - 3);
      B("birch", 3, v - 2, 3, W - 3, v, D - 3); }) },
  wardrobe2: { n: "Two-door wardrobe, white", k: "wardrobe", w: 100, d: 58, h: 201, src: "E (a 2-door wardrobe, 100 × 58 × 201)",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, H, D - 2); B("door_white", 1, 0, D - 6, W - 1, 8, D - 5);
      for (const [a, b] of [[0.3, W / 2 - 0.3], [W / 2 + 0.3, W - 0.3]]) B("door_white", a, 8.3, D - 2, b, H - 0.3, D - 0.4);
      for (const u of [W / 2 - 5, W / 2 + 3.5]) B("handle_black", u, H * 0.45, D - 0.4, u + 1.5, H * 0.45 + 32, D); } },
  sliding: { n: "Sliding-door wardrobe, oak and mirror", k: "wardrobe", w: 150, d: 62, h: 210, src: "E (a 2-door sliding wardrobe, 150 × 62 × 210)",
    b: (W, H, D, B) => { B("oak", 0, 0, 0, W, H, D - 6); B("steel", 0, H - 4, D - 6, W, H, D); B("steel", 0, 0, D - 6, W, 2, D);
      B("oak", 0.5, 2, D - 6, W / 2 + 2, H - 4, D - 4); B("mirror", W / 2 - 2, 2, D - 3.5, W - 0.5, H - 4, D - 1.5);
      B("handle_black", 3, H * 0.4, D - 4, 4.5, H * 0.4 + 40, D - 3.5); B("handle_black", W - 4.5, H * 0.4, D - 1.5, W - 3, H * 0.4 + 40, D - 1); } },
  openrail: { n: "Open clothes rail and shelves", k: "wardrobe", w: 120, d: 50, h: 190, src: "E (an open rail, 120 × 50 × 190)",
    b: (W, H, D, B) => { for (const u of [0, W - 3]) for (const t of [2, D - 5]) B("steel", u, 0, t, u + 3, H, t + 3);
      B("birch", 0, 18, 0, W, 21, D); B("birch", 0, H - 3, 0, W, H, D); B("steel", 3, H - 24, D / 2 - 1, W - 3, H - 22, D / 2 + 1);
      for (let u = 8, k = 0; u < W - 10; u += 6.5, k++) B("cloth" + (k * 3 % 7), u, H - 24 - 80 - (k % 3) * 12, D / 2 - 22, u + 4.5, H - 25, D / 2 + 22);
      for (let u = 6; u < W - 30; u += 34) B("storebox", u, 21, 6, u + 30, 41, D - 6); } },
  chest3: { n: "Chest of three drawers, white", k: "chest", w: 80, d: 48, h: 78, src: "E (a 3-drawer chest, 80 × 48 × 78)", b: hcChest("door_white", 1, 3) },
  chest6: { n: "Wide chest of six drawers, oak", k: "chest", w: 120, d: 48, h: 78, src: "E (a 6-drawer chest, 120 × 48 × 78)", b: hcChest("oak", 2, 3) },
  tallboy: { n: "Tall chest of five drawers, pine", k: "chest", w: 60, d: 45, h: 120, src: "E (a 5-drawer tallboy, 60 × 45 × 120)", b: hcChest("pine", 1, 5) },
  bsdrawer: { n: "Bedside, a drawer and a shelf", k: "bedside", w: 45, d: 40, h: 55, src: "E (a bedside, 45 × 40 × 55)",
    b: (W, H, D, B) => { B("oak", 0, 0, 0, 2, H, D); B("oak", W - 2, 0, 0, W, H, D); B("oak", 2, 0, 0, W - 2, H, 1.5); B("oak", 2, 4, 1.5, W - 2, 6, D);
      B("oak", 2, H - 2, 1.5, W - 2, H, D); B("oak", 2, H - 16, 1.5, W - 2, H - 14, D); B("oak", 2.3, H - 13.7, D - 2, W - 2.3, H - 2.3, D - 0.5);
      B("knob", W / 2 - 1.6, H - 9.6, D - 0.5, W / 2 + 1.6, H - 6.4, D); B("book1", 6, 6, 8, 26, 9, 30); } },
  bswhite: { n: "Bedside of two drawers, white", k: "bedside", w: 40, d: 40, h: 50, src: "E (a 2-drawer bedside, 40 × 40 × 50)", b: hcChest("door_white", 1, 2) },
  bslegs: { n: "Bedside on legs, oak and black", k: "bedside", w: 45, d: 38, h: 58, src: "E (a bedside on legs, 45 × 38 × 58)",
    b: (W, H, D, B) => { for (const [u, t] of [[1, 1], [W - 3, 1], [1, D - 3], [W - 3, D - 3]]) B("black", u, 0, t, u + 2, H - 20, t + 2);
      B("oak", 0, H - 20, 0, W, H, D - 1); B("oak", 1, H - 18, D - 1, W - 1, H - 2, D - 0.3); B("handle_black", W / 2 - 6, H - 11, D - 0.3, W / 2 + 6, H - 9.5, D); } },
  desklegs: { n: "Oak desk on black legs", k: "desk", w: 140, d: 70, h: 75, src: "E (a desk, 140 × 70 × 75)",
    b: (W, H, D, B) => { B("oak", 0, H - 3, 0, W, H, D); for (const [u, t] of [[2, 2], [W - 6, 2], [2, D - 6], [W - 6, D - 6]]) B("black", u, 0, t, u + 4, H - 3, t + 4); B("black", 6, H - 10, 3, W - 6, H - 3, 5); } },
  deskdrawers: { n: "Desk with a drawer pedestal", k: "desk", w: 120, d: 60, h: 75, src: "E (a desk, 120 × 60 × 75, drawers 40 wide)",
    b: (W, H, D, B) => { B("birch", 0, H - 3, 0, W, H, D); hcChest("door_white", 1, 3)(40, H - 3, D - 2, (m, a, b, c, d, e, f) => B(m, W - 41 + a, b, c, W - 41 + d, e, f));
      B("door_white", 1, 0, 1, 3, H - 3, D - 1); B("door_white", 3, H - 12, 1, W - 41, H - 3, 3); } },
  trestle: { n: "Trestle desk, birch and pine", k: "desk", w: 150, d: 75, h: 75, src: "E (a trestle desk, 150 × 75 × 75)",
    b: (W, H, D, B) => { B("birch", 0, H - 2.5, 0, W, H, D);
      for (const u of [12, W - 16]) { B("pine", u, 0, 4, u + 4, H - 2.5, 7); B("pine", u, 0, D - 7, u + 4, H - 2.5, D - 4); B("pine", u, H - 8, 4, u + 4, H - 2.5, D - 4); B("pine", u, 20, 4, u + 4, 24, D - 4); } } },
  bookcase: { n: "Oak bookcase", k: "shelves", w: 80, d: 30, h: 180, src: "E (a bookcase, 80 × 30 × 180)", b: hcShelves("oak", hcBooks) },
  cubes: { n: "Cube shelving with boxes, white", k: "shelves", w: 147, d: 39, h: 147, src: "E (a 4 × 4 cube unit, 147 × 39 × 147)",
    b: (W, H, D, B) => { const nu = Math.max(1, Math.round(W / 36)), nv = Math.max(1, Math.round(H / 36)), cu = (W - 3) / nu, cv = (H - 3) / nv;
      B("door_white", 0, 0, 0, W, H, 1);
      for (let i = 0; i <= nu; i++) B("door_white", i * cu, 0, 1, i * cu + 3, H, D);
      for (let j = 0; j <= nv; j++) B("door_white", 0, j * cv, 1, W, j * cv + 3, D);
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = i * cu + 3, v = j * cv + 3;
        if ((i + j) % 2) B("storebox", u + 0.5, v, 3, u + cu - 3.5, v + cv - 3.5, D - 0.5); else if (j) hcBooks(B, u, u + cu - 3, v, cv - 4, D, i + j); } } },
  ladder: { n: "Ladder shelf, oak", k: "shelves", w: 65, d: 40, h: 180, src: "E (a leaning ladder shelf, 65 × 40 × 180)",
    b: (W, H, D, B) => { const n = 5, vv = i => 2 + i * (H - 6) / (n - 1), dd = i => D * (1 - i * 0.18);   // deeper at the foot, leaning to the wall
      for (let i = 0; i < n; i++) { B("oak", 3, vv(i), 0, W - 3, vv(i) + 2, dd(i)); if (i < n - 1) for (const u of [0, W - 3]) B("oak", u, i ? vv(i) : 0, dd(i + 1) - 3, u + 3, vv(i + 1) + 2, dd(i)); }
      B("ivy", W / 2 - 8, vv(n - 1) + 2, 4, W / 2 + 8, vv(n - 1) + 12, dd(n - 1) - 2); hcBooks(B, 3, W - 3, vv(1) + 2, 28, dd(1), 2); } },
  armchair: { n: "Armchair, green weave", k: "seat", w: 80, d: 82, h: 85, src: "E (an armchair, 80 × 82 × 85)",
    b: (W, H, D, B) => { for (const [u, t] of [[4, 4], [W - 8, 4], [4, D - 8], [W - 8, D - 8]]) B("oak", u, 0, t, u + 4, 14, t + 4);
      B("cloth3", 0, 14, 0, W, 40, D); B("cloth3", 0, 40, 0, W, H, 16); B("cloth3", 0, 40, 16, 12, 64, D); B("cloth3", W - 12, 40, 16, W, 64, D);
      B("cloth4", 12, 40, 16, W - 12, 50, D - 1); B("cloth1", W / 2 - 20, 50, 16, W / 2 + 20, 84, 27); } },
  bench: { n: "Oak bench", k: "seat", w: 100, d: 35, h: 45, src: "E (a bench, 100 × 35 × 45)",
    b: (W, H, D, B) => { B("oak", 0, H - 4, 0, W, H, D); for (const u of [5, W - 9]) B("oak", u, 0, 2, u + 4, H - 4, D - 2); B("oak", 9, 12, D / 2 - 2, W - 9, 16, D / 2 + 2); } },
  pouffe: { n: "Round pouffe, rust", k: "seat", w: 50, d: 50, h: 40, src: "E (a pouffe, 50 across, 40 high)",
    b: (W, H, D, B, L) => { L("cloth2", W / 2, D / 2, 0, [[0, 0], [W / 2 - 1, 0], [W / 2, 3], [W / 2, H - 4], [W / 2 - 2, H - 0.5], [0, H]]); } },
  plant: { n: "Fiddle-leaf fig, white pot", k: "plant", w: 45, d: 45, h: 140, src: "E (a fiddle-leaf fig, 140 tall, in a 30 pot)",
    b: (W, H, D, B, L) => { L("pot", W / 2, D / 2, 0, [[0, 0], [11, 0], [15, 30], [15.5, 32], [0, 32]]);
      L("timber", W / 2, D / 2, 30, [[0, 0], [1.5, 0], [1.5, H * 0.45], [0, H * 0.45]]);
      L("ivy", W / 2, D / 2, H * 0.32, [[0, 0], [W * 0.32, H * 0.12], [W / 2, H * 0.36], [W * 0.38, H * 0.56], [W * 0.16, H * 0.66], [0, H * 0.68]]); } },
  snake: { n: "Snake plant, white pot", k: "plant", w: 35, d: 35, h: 90, src: "E (a snake plant, 90 tall, in a 27 pot)",
    b: (W, H, D, B, L) => { L("pot", W / 2, D / 2, 0, [[0, 0], [10, 0], [13, 24], [13.5, 26], [0, 26]]);
      for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 3 + (i % 3) * 2.5, u = W / 2 + Math.cos(a) * r, t = D / 2 + Math.sin(a) * r;
        B("ivy", u - 1.6, 22, t - 0.6, u + 1.6, 26 + (H - 26) * (0.55 + (i * 37 % 9) / 20), t + 0.6); } } },
  monstera: { n: "Monstera, seagrass basket", k: "plant", w: 70, d: 70, h: 100, src: "E (a monstera, 100 tall, 70 across, in a 38 basket)",
    b: (W, H, D, B, L) => { L("sisal", W / 2, D / 2, 0, [[0, 0], [16, 0], [19, 32], [0, 32]]);
      L("ivy", W / 2, D / 2, 30, [[0, 0], [W * 0.3, 8], [W / 2, (H - 30) * 0.45], [W * 0.44, (H - 30) * 0.7], [W * 0.22, H - 32], [0, H - 30]]); } },
  olive: { n: "Olive tree, grey planter", k: "plant", w: 55, d: 55, h: 150, src: "E (an olive tree, 150 tall, in a 40 planter)",
    b: (W, H, D, B, L) => { L("concrete", W / 2, D / 2, 0, [[0, 0], [16, 0], [19, 40], [19.5, 42], [0, 42]]);
      L("timber", W / 2, D / 2, 40, [[0, 0], [2.5, 0], [2, H * 0.4], [0, H * 0.4]]);
      L("ivy", W / 2, D / 2, H * 0.5, [[0, 0], [W * 0.3, H * 0.06], [W / 2, H * 0.22], [W * 0.4, H * 0.38], [W * 0.12, H * 0.49], [0, H * 0.5]]); } },
  rug: { n: "Rug", k: "more", w: 160, d: 230, h: 1, src: "E (a 160 × 230 rug)",
    b: (W, H, D, B) => { B("rug", 0, 0, 0, W, Math.max(0.6, H), D); B("sisal", 4, Math.max(0.6, H), 4, W - 4, Math.max(0.6, H) + 0.2, 8); B("sisal", 4, Math.max(0.6, H), D - 8, W - 4, Math.max(0.6, H) + 0.2, D - 4); } },
  floorlamp: { n: "Floor lamp, linen shade", k: "more", w: 40, d: 40, h: 160, src: "E (a floor lamp, 160 tall, 40 shade)",
    b: (W, H, D, B, L) => { L("black", W / 2, D / 2, 0, [[0, 0], [13, 0], [13, 1.5], [3, 3], [0, 3]]); B("black", W / 2 - 1, 3, D / 2 - 1, W / 2 + 1, H - 22, D / 2 + 1);
      L("paper", W / 2, D / 2, H - 30, [[0, 0], [W / 2 - 0.5, 0], [W / 2 * 0.72, 30], [0, 30]]); } },
  sidetable: { n: "Round side table, oak", k: "more", w: 45, d: 45, h: 50, src: "E (a side table, 45 across, 50 high)",
    b: (W, H, D, B, L) => { L("oak", W / 2, D / 2, 0, [[0, 0], [14, 0], [14, 2], [2.5, 3], [2.5, H - 3], [W / 2, H - 3], [W / 2, H], [0, H]]); } },
};
/* which pieces swap, and for what: by the kind of thing it is (its id), standing on the floor, one that turns (no lid or doors of its own) */
const HSWAP_OF = [[/(^|\.)bed$|bed_/, "bed"], [/wardrobe/, "wardrobe"], [/bedside/, "bedside"], [/chest/, "chest"], [/desk$/, "desk"],
  [/shelving|kallax|bookcase|shelves/, "shelves"], [/chairbed|bench|armchair/, "seat"]];
function swapKind(id) {
  const it = HIT(id); if (!it || it.op || it.k !== "furniture" || (it.s[2] || 0) > 20) return null;
  const k = (HSWAP_OF.find(([re]) => re.test(id)) || [])[1];
  return k && canTurn(id) ? k : null;
}
const hcOf = kind => Object.keys(HCAT).filter(k => HCAT[k].k === kind);
/* a piece's frame in the house: its wall axis, and which way it faces (its back to the nearer wall of its room) */
function hcFrame(it) {
  const r = (R.HOUSE3.rooms || {})[it.r] || [it.b[0], it.b[3], it.b[2], it.b[5]], b = it.b, a = it.ax === "z" ? 2 : 0, o = 2 - a;
  const lo = o === 2 ? b[2] - r[2] : b[0] - r[0], hi = o === 2 ? r[3] - b[5] : r[1] - b[3];
  return { a, o, flip: hi < lo };
}
/* a catalogue piece's boxes and lathes, built in a box (the swapped piece's, or the added one's), tagged t */
function hcBuild(key, it, t) {
  const C = HCAT[key], b = it.b, { a, o, flip } = hcFrame(it), W = b[a + 3] - b[a], H = b[4] - b[1], D = b[o + 3] - b[o];
  const out = { boxes: {}, bt: {}, lathes: [] };
  const at = (u, v, w) => { const p = [0, b[1] + v, 0]; p[a] = b[a] + u; p[o] = flip ? b[o + 3] - w : b[o] + w; return p; };
  const B = (m, u0, v0, t0, u1, v1, t1) => { const p = at(u0, v0, t0), q = at(u1, v1, t1), bx = [0, 1, 2].map(i => Math.min(p[i], q[i])).concat([0, 1, 2].map(i => Math.max(p[i], q[i])));
    if (bx[3] - bx[0] < 0.05 || bx[4] - bx[1] < 0.05 || bx[5] - bx[2] < 0.05) return;
    (out.boxes[m] = out.boxes[m] || []).push(bx.map(v => Math.round(v * 10) / 10)); (out.bt[m] = out.bt[m] || []).push(t); };
  const L = (m, u, w, v, p) => out.lathes.push({ c: at(u, v, w), p, s: [1, 1], m, t });   // a turned part round (u, w), its profile [radius, up]
  C.b(W, H, D, B, L);
  return out;
}
/* the floor as drawn, with the pieces swapped (their own boxes out, the new one's in their place) and those added (a new tag each) */
const HCFK = { "-260": "lower", "0": "ground", "260": "first" };
function withCatalogue(fk, F) {
  const tags = F.tags || [], sw = [], ad = [];
  for (const [id, E] of Object.entries(HEDITS)) { if (E.removed || !HIT(id)) continue;
    if (E.swap && HCAT[E.swap] && tags.includes(id)) sw.push(id); else if (E.add && HCAT[E.add] && HIT(id).fk === fk) ad.push(id); }
  if (!sw.length && !ad.length) return F;
  const gone = new Set(sw.map(id => tags.indexOf(id))), nt = tags.slice();
  const keep = (list, bt) => { const ob = [], ot = []; list.forEach((q, i) => { if (!gone.has(bt ? bt[i] : -1)) { ob.push(q); ot.push(bt ? bt[i] : -1); } }); return [ob, ot]; };
  const boxes = {}, bt = {};
  for (const [m, list] of Object.entries(F.boxes)) [boxes[m], bt[m]] = keep(list, (F.bt || {})[m]);
  const lathes = (F.lathes || []).filter(L => !gone.has(L.t)), prisms = (F.prisms || []).filter(P => !gone.has(P.t));
  const put = (id, key) => { let t = nt.indexOf(id); if (t < 0) { t = nt.length; nt.push(id); }
    const P = hcBuild(key, HIT(id), t);
    for (const [m, list] of Object.entries(P.boxes)) { (boxes[m] = boxes[m] || []).push(...list); (bt[m] = bt[m] || []).push(...P.bt[m]); }
    lathes.push(...P.lathes); };
  sw.forEach(id => put(id, HEDITS[id].swap)); ad.forEach(id => put(id, HEDITS[id].add));
  return Object.assign({}, F, { boxes, bt, lathes, prisms, tags: nt });
}
/* the added pieces, from Measure's rows: each a piece of the house (HIT) at the spot the floor was tapped, its back to the nearer wall */
const ADDED = {}, ADDFK = {};   // ADDFK: each added piece's floor, kept once it's gone (its floor is drawn again)
function syncAdds() {
  const ds = DS(), H3 = R.HOUSE3; if (!ds || !H3) return;
  syncPlants();
  const rows = {}; for (const v of Object.values(ds.rows("edits") || {})) if (v && v.field === "add" && /^add\.[a-z0-9]{1,12}$/.test(v.item || "") && HCAT[v.value] && (H3.rooms || {})[v.room]) rows[v.item] = v;
  for (const id of Object.keys(ADDED)) if (!rows[id]) { delete H3.items[id]; delete ADDED[id]; }
  for (const [id, v] of Object.entries(rows)) { if (ADDED[id] && ADDED[id].k === v.value) continue;
    const C = HCAT[v.value], r = H3.rooms[v.room], x = +v.x, z = +v.z, y = isFinite(+v.y) ? +v.y : r[4]; if (!isFinite(x) || !isFinite(z)) continue;
    const dz = Math.min(z - r[2], r[3] - z), dx = Math.min(x - r[0], r[1] - x), ax = dz <= dx ? "x" : "z", a = ax === "z" ? 2 : 0, o = 2 - a;
    const c = [x, y, z], b = [0, y, 0, 0, y + C.h, 0], ro = o === 2 ? [r[2], r[3]] : [r[0], r[1]], ra = a === 2 ? [r[2], r[3]] : [r[0], r[1]];
    b[a] = Math.max(ra[0], Math.min(ra[1] - C.w, c[a] - C.w / 2)); b[a + 3] = b[a] + C.w;
    const near = c[o] - ro[0] < ro[1] - c[o], gap = near ? c[o] - C.d / 2 - ro[0] : ro[1] - c[o] - C.d / 2;   // within 30 of its wall: against it
    b[o] = gap < 30 ? (near ? ro[0] + 0.5 : ro[1] - 0.5 - C.d) : c[o] - C.d / 2; b[o + 3] = b[o] + C.d;
    ADDED[id] = { k: v.value }; ADDFK[id] = HCFK[String(r[4])];
    H3.items[id] = { n: C.n, k: "furniture", r: v.room, ax, b: b.map(q => Math.round(q * 10) / 10), s: [C.w, C.h, 0], g: false, al: Math.round((b[a] - ra[0]) * 10) / 10, op: null, add: v.value, fk: HCFK[String(r[4])] };
  }
}
/* the fit check on the page: a piece you've moved, swapped or added, against the others in its room it now stands in (not those it
   stood in as planned: a chair at its desk, a PC under it; not the chairs and rugs, which you'd push aside or stand on) */
const HCSKIP = new Set(["decor", "finish", "light", "switch", "socket", "fitting", "window", "door"]), hcSoft = k => /chairs?$|stools?$|rug/.test(k + " " + ((HIT(k) || {}).add || ""));
function clashes(id) {
  const it = HIT(id); if (!it || pieceNow(id).removed || hcSoft(id) || (!it.add && !pieceDelta(id).some(Boolean))) return [];
  const b = pieceBox(id), over = (p, q) => [0, 1, 2].every(j => p[j] < q[j + 3] - 1 && p[j + 3] > q[j] + 1);
  return Object.keys(R.HOUSE3.items).filter(k => { const o = HIT(k); return k !== id && o.r === it.r && !HCSKIP.has(o.k) && !hcSoft(k) && !pieceNow(k).removed
    && !(!it.add && !o.add && over(it.b, o.b)) && over(b, pieceBox(k)); }).map(k => { const c = pieceNow(k).swap; return c ? HCAT[c].n : HIT(k).n; });
}
/* N5 (REAL_PLAN R7): a plant in any room, from Look's floor card: kept as the room's row [23] (schemes, Undo, Copy and Send carry it), it
   stands in the room's free corner farthest from its doors (else along a wall, else wherever it fits), clear of the furniture, the
   slopes and the doors' swing; a piece of the house like any other (tap it to move it, turn it, change it) */
const PLANTED = {}, PLANTAT = {};
const plantKeys = () => hcOf("plant");
function plantSpot(room, C) {
  const H3 = R.HOUSE3, r = H3.rooms[room], fk = HCFK[String(r[4])], F = fk && H3.floors[fk]; if (!F) return null;
  const R0 = Math.max(C.w, C.d) / 2, near = b => b[3] > r[0] - 5 && b[0] < r[1] + 5 && b[5] > r[2] - 5 && b[2] < r[3] + 5;
  let y0 = r[4], big = 0; ((H3.finish_pieces || {})[fk] || []).forEach(([ri, x0, x1, z0, z1], i) => {   // its floor's top (the biggest piece of it: a floor is level)
    if ((H3.finish_rooms || [])[ri] === room && (x1 - x0) * (z1 - z0) > big) { big = (x1 - x0) * (z1 - z0); y0 = ((H3.finish_floor_y || {})[fk] || [])[i] ?? r[4]; } });
  const solid = [];
  for (const [m, L] of Object.entries(F.boxes)) if (m !== "contact") for (const b of L) if (near(b) && b[4] > y0 + 2 && b[1] < y0 + C.h) solid.push(b);
  for (const [k, it] of Object.entries(H3.items)) if (k !== "plant." + room && it.r === room && !it.op && !pieceNow(k).removed && (it.add || pieceDelta(k).some(Boolean))) solid.push(pieceBox(k));   // moved or added: where it is now
  const prisms = Object.values(H3.floors).flatMap(G => G.prisms || []), doors = Object.values(H3.items).filter(it => it.op && it.k === "door");
  const hit = (x, y, z) => prisms.some(P => { const [a, u, w] = P.axis === "x" ? [x, z, y] : P.axis === "z" ? [z, x, y] : [y, x, z]; return a > P.a && a < P.b && polyNear(P.pts, u, w, 0.5); });
  const swing = (x, z) => doors.some(it => { const o = it.op, [al, ac] = o.axis === "x" ? [x, z] : [z, x]; return Math.abs(ac - o.line) < R0 + 90 && al > o.a - R0 - 10 && al < o.b + R0 + 10; });
  const HS = Array.from({ length: Math.ceil(C.h / 12) }, (_, i) => Math.min(C.h - 2, 4 + i * 12));   // every 12 cm up: a worktop or a shelf over the floor
  const free = (x, z) => !swing(x, z) && !solid.some(b => Math.hypot(Math.max(b[0] - x, 0, x - b[3]), Math.max(b[2] - z, 0, z - b[5])) < R0) && [0, 1, 2, 3, 4, 5, 6, 7, 8].every(i => { const a = i * Math.PI / 4, q = i === 8 ? 0 : R0;
    return HS.every(h => !hit(x + Math.cos(a) * q, y0 + h, z + Math.sin(a) * q)); });
  const m = R0 + 6, xs = [r[0] + m, r[1] - m], zs = [r[2] + m, r[3] - m], dd = (x, z) => Math.min(1e4, ...doors.map(it => { const o = it.op, c = (o.a + o.b) / 2;
    return o.axis === "x" ? Math.hypot(x - c, z - o.line) : Math.hypot(x - o.line, z - c); }));
  const corners = xs.flatMap(x => zs.map(z => [x, z])).sort((p, q) => dd(...q) - dd(...p)), walls = [], inside = [];
  for (let t = 0.2; t < 0.85; t += 0.15) { const x = r[0] + (r[1] - r[0]) * t, z = r[2] + (r[3] - r[2]) * t; walls.push([x, zs[0]], [x, zs[1]], [xs[0], z], [xs[1], z]);
    for (let q = 0.2; q < 0.85; q += 0.15) inside.push([x, r[2] + (r[3] - r[2]) * q]); }
  const at = [...corners, ...walls, ...inside].find(([x, z]) => free(x, z));
  return at ? [Math.round(at[0] * 10) / 10, y0, Math.round(at[1] * 10) / 10] : null;
}
function syncPlants() {
  const H3 = R.HOUSE3, want = {};
  for (const [room, sl] of Object.entries(S.fin || {})) if (sl && HCAT[sl[23]] && HCAT[sl[23]].k === "plant" && (H3.rooms || {})[room] && room !== "living") want["plant." + room] = [room, sl[23]];
  for (const id of Object.keys(PLANTED)) if (!want[id]) { delete H3.items[id]; delete PLANTED[id]; }
  for (const [id, [room, key]] of Object.entries(want)) { if (PLANTED[id] === key) continue;
    const C = HCAT[key], r = H3.rooms[room], p = PLANTAT[room + key] || (PLANTAT[room + key] = plantSpot(room, C)); if (!p) continue;
    const b = [p[0] - C.w / 2, p[1], p[2] - C.d / 2, p[0] + C.w / 2, p[1] + C.h, p[2] + C.d / 2].map(q => Math.round(q * 10) / 10);
    PLANTED[id] = key; ADDFK[id] = HCFK[String(r[4])];
    H3.items[id] = { n: C.n, k: "furniture", r: room, ax: "x", b, s: [C.w, C.h, 0], g: false, al: Math.round((b[0] - r[0]) * 10) / 10, op: null, add: key, look: room, fk: ADDFK[id] };
  }
}
function plantSet(room, key) {   // Look's floor card (or a plant's own card): this room's plant, none for none
  finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
  if (key) o[23] = key; else delete o[23]; if (!Object.keys(o).length) delete S.fin[room];
  store.set(KEY, S); storeEdits(); finSchDraw(); toast(`${roomName(room)}: ${!key ? "no plant" : R.HOUSE3.items["plant." + room] ? HCAT[key].n.split(",")[0].toLowerCase() : "no free floor for it"}`);
}
const plantTray = room => { const now = finGet(room, 23) || "";
  return `<span class="r3d-finlab">A plant</span><div class="r3d-finsc" role="group" aria-label="A plant">`
    + [["", "None"], ...plantKeys().map(k => [k, HCAT[k].n.split(",")[0]])].map(([v, t]) => `<button type="button" data-finplant="${v}" aria-pressed="${now === v}">${t}</button>`).join("") + `</div>`; };
