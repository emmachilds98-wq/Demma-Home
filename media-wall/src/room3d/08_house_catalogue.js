/* V2.46 (N7): swap a piece for another of its kind, or add one, in any room; built from the house's own boxes so it's drawn, tapped,
   moved and turned as the house's are. Rows are Measure's "edits": {item, field: "swap", value: key}; {item: "add.<n>", field: "add",
   value: key, room, x, z, y}. A piece's own frame: u along its wall (0..W), v up (0..H), t out from its back (0..D). */
const HCAT_KINDS = { bed: "Beds", wardrobe: "Wardrobes", chest: "Chests", bedside: "Bedsides", desk: "Desks", shelves: "Shelves", cabinet: "Cabinets", table: "Tables", tv: "TV units", seat: "Seats", chair: "Desk chairs", lamp: "Lamps", rug: "Rugs", plant: "Plants" };   // N219: tables, TV units, cabinets and lamps their own
function hcChest(mat, cols, rows, knob = "knob") {   // drawers: a carcass, its fronts with a shadow gap, a knob each ("grip": MALM's grip along each front's top)
  return (W, H, D, B) => {
    B(mat, 0, 0, 0, W, H, D - 2); B("gap", 1, 6, D - 2.1, W - 1, H - 2, D - 2); B(mat, 1, 0, D - 6, W - 1, 6, D - 5);   // the plinth, set back
    const cw = (W - 2) / cols, rh = (H - 8) / rows, g = knob === "grip" ? 2 : 0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const u0 = 1 + c * cw, v0 = 6 + r * rh, cu = u0 + cw / 2, cv = v0 + rh * 0.62;
      B(mat, u0 + 0.3, v0 + 0.3, D - 2, u0 + cw - 0.3, v0 + rh - 0.3 - g, D - 0.4);
      if (g) B("gap", u0 + 0.3, v0 + rh - 0.3 - g, D - 2, u0 + cw - 0.3, v0 + rh - 0.3, D - 1.4);   // V3.02 (N45): the grip, a groove in shadow
      else B(knob, cu - 1.6, cv - 1.6, D - 0.4, cu + 1.6, cv + 1.6, D); }
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
function hcCubes(m) {   // cube shelving, every other cube a box, books in the rest (N219: in any colour)
  return (W, H, D, B) => { const nu = Math.max(1, Math.round(W / 36)), nv = Math.max(1, Math.round(H / 36)), cu = (W - 3) / nu, cv = (H - 3) / nv;
    B(m, 0, 0, 0, W, H, 1);
    for (let i = 0; i <= nu; i++) B(m, i * cu, 0, 1, i * cu + 3, H, D);
    for (let j = 0; j <= nv; j++) B(m, 0, j * cv, 1, W, j * cv + 3, D);
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = i * cu + 3, v = j * cv + 3;
      if ((i + j) % 2) B("storebox", u + 0.5, v, 3, u + cu - 3.5, v + cv - 3.5, D - 0.5); else if (j) hcBooks(B, u, u + cu - 3, v, cv - 4, D, i + j); } };
}
const hcBooks = (B, u0, u1, v, h, D, i) => {   // books along a shelf, every height, a gap now and then
  let u = u0 + 1, k = i * 7;
  while (u < u1 - 4) { const w = 2 + (k * 37 % 5) * 0.6, hh = h * (0.62 + (k * 53 % 7) * 0.045); if (k % 9 === 4) { u += 6; k++; continue; }
    B("book" + (k % 6), u, v, D - 4 - 18, Math.min(u1 - 1, u + w), v + Math.min(hh, h - 1), D - 4); u += w + 0.2; k++; }
};
function hcSwivel(m, sy, arms) {   // N217: a swivel chair: a star base (four arms here) on castors, the lift, the seat, its back (t 0) to its top
  return (W, H, D, B, L) => { const c = W / 2, tc = D / 2, r = Math.min(W, D) / 2 - 3;
    B("black", c - r, 5, tc - 2.5, c + r, 8.5, tc + 2.5); B("black", c - 2.5, 5, tc - r, c + 2.5, 8.5, tc + r);
    for (const [u, t] of [[c - r + 3, tc], [c + r - 3, tc], [c, tc - r + 3], [c, tc + r - 3]]) L("black", u, t, 0, [[0, 0], [2.6, 0.4], [2.8, 2.6], [2.2, 5], [0, 5]]);
    L("steel", c, tc, 8.5, [[0, 0], [2.4, 0], [2.4, sy - 16], [0, sy - 16]]);
    B(m, c - 26, sy - 8, 8, c + 26, sy, D - 4); B(m, c - 24, sy - 2, 3, c + 24, H, 10); B("black", c - 3, sy - 10, 1, c + 3, sy + 14, 4);
    if (arms) for (const u of [c - 27, c + 23]) { B("black", u + 1, sy, D - 24, u + 3, sy + 20, D - 21); B("black", u, sy + 20, D - 30, u + 4, sy + 23, D - 12); } };
}
/* V3.02 (N45): each piece a real one's size (fit.SOURCES hcikea, hcbeds, hcplants, hcmore, rugsizes: its "ref"), built to its shape */
const hcLegs = (m, W, D, h, r, i = 3) => (B, L) => { for (const [u, t] of [[i, i], [W - i, i], [i, D - i], [W - i, D - i]]) L(m, u, t, 0, [[0, 0], [r, 0], [r * 0.8, h], [0, h]]); };   // four turned legs, tapering
const HCAT = {
  divan: { n: "Divan bed, upholstered headboard", k: "bed", w: 150, d: 210, h: 137, ref: "hcbeds", src: "Next Divan king, 150 × 200, headboard 137",
    b: hcBed((W, H, D, B, L, v) => { B("lycksele", 0, 30, 0, W, H, 9); for (const u of [12, W - 16]) B("black", u, 0, 3, u + 4, 30, 6);
      B("cloth5", 1, 3, 10, W - 1, v, D); for (const [u, t] of [[6, 14], [W - 9, 14], [6, D - 6], [W - 9, D - 6]]) B("black", u, 0, t, u + 3, 3, t + 3); }) },
  oakbed: { n: "Oak bed, slatted headboard", k: "bed", w: 163, d: 215, h: 110, ref: "hcbeds", src: "The Furniture Market Cheshire oak, 163 × 215 × 110",
    b: hcBed((W, H, D, B, L, v) => {
      for (const u of [0, W - 7]) { B("oak", u, 0, 0, u + 7, H, 7); B("oak", u, 0, D - 7, u + 7, 45, D); }
      for (let u = 12; u < W - 14; u += 14) B("oak", u, v + 20, 2, u + 8, H - 12, 5);
      B("oak", 7, H - 12, 1, W - 7, H - 4, 6); B("oak", 7, v - 14, 0, W - 7, v + 20, 4);
      B("oak", 0, 14, 7, 5, v, D - 7); B("oak", W - 5, 14, 7, W, v, D - 7); B("oak", 7, 14, D - 5, W - 7, 40, D);
      B("pine", 5, v - 2, 7, W - 5, v, D - 5); }) },
  metalbed: { n: "Black metal bed", k: "bed", w: 156, d: 207, h: 95, ref: "hcikea", src: "IKEA NESTTUN 150 × 200: 156 × 207 × 95",
    b: hcBed((W, H, D, B, L, v) => {
      for (const u of [0, W - 3]) { B("black", u, 0, 0, u + 3, H, 3); B("black", u, 0, D - 3, u + 3, 38, D); }
      for (const vv of [v + 12, H - 3]) B("black", 3, vv, 0.5, W - 3, vv + 3, 2.5);
      for (let u = 14; u < W - 12; u += 12) B("black", u, v + 15, 1, u + 1.6, H - 3, 2.2);
      for (let vv = v + 26; vv < H - 8; vv += 12) B("black", 3, vv, 0.8, W - 3, vv + 1.6, 2.4);   // its net: bars both ways
      B("black", 3, 32, D - 2.5, W - 3, 35, D - 0.5); B("black", 0, v - 4, 3, 3, v, D - 3); B("black", W - 3, v - 4, 3, W, v, D - 3);
      B("birch", 3, v - 2, 3, W - 3, v, D - 3); }) },
  wardrobe2: { n: "Two-door wardrobe, white", k: "wardrobe", w: 100, d: 58, h: 201, ref: "hcikea", src: "IKEA PAX, 100 × 58 × 201",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, H, D - 2); B("door_white", 1, 0, D - 6, W - 1, 8, D - 5);
      for (const [a, b] of [[0.3, W / 2 - 0.3], [W / 2 + 0.3, W - 0.3]]) B("door_white", a, 8.3, D - 2, b, H - 0.3, D - 0.4);
      for (const u of [W / 2 - 5, W / 2 + 3.5]) B("handle_black", u, H * 0.45, D - 0.4, u + 1.5, H * 0.45 + 32, D); } },
  sliding: { n: "Sliding-door wardrobe, oak and mirror", k: "wardrobe", w: 150, d: 66, h: 201, ref: "hcikea", src: "IKEA PAX / MEHAMN/AULI, 150 × 66 × 201",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, H, D - 8); B("steel", 0, H - 4, D - 8, W, H, D); B("steel", 0, 0, D - 8, W, 2, D);
      B("oak", 0.5, 2, D - 7.5, W / 2 + 2, H - 4, D - 5.5); B("mirror", W / 2 - 2, 2, D - 4, W - 0.5, H - 4, D - 2);
      for (const v of [H * 0.33, H * 0.66]) B("steel", 0.5, v, D - 5.5, W / 2 + 2, v + 0.8, D - 5.2);   // MEHAMN's oak in three panels
      B("handle_black", 3, H * 0.4, D - 5.5, 4.5, H * 0.4 + 40, D - 4.5); B("handle_black", W - 4.5, H * 0.4, D - 2, W - 3, H * 0.4 + 40, D - 1); } },
  openrail: { n: "Open clothes rail, white", k: "wardrobe", w: 99, d: 46, h: 151, ref: "hcikea", src: "IKEA MULIG, 99 × 46 × 151",
    b: (W, H, D, B) => { for (const u of [0, W - 2.5]) { for (const t of [3, D - 5.5]) B("steel", u, 0, t, u + 2.5, H - 8, t + 2.5); B("steel", u, H - 10.5, D / 2 - 1.2, u + 2.5, H, D / 2 + 1.2); B("steel", u, H - 10.5, 3, u + 2.5, H - 8, D - 3); B("steel", u, 0, 3, u + 2.5, 2.5, D - 3); }
      B("steel", 2.5, H - 3, D / 2 - 1.2, W - 2.5, H - 0.5, D / 2 + 1.2); for (const t of [5, 15, 25, 35]) B("steel", 2.5, 16, t, W - 2.5, 17.5, t + 1.5);   // the rail, the shelf's bars
      for (let u = 7, k = 0; u < W - 9; u += 6.5, k++) B("cloth" + (k * 3 % 7), u, H - 6 - 58 - (k % 3) * 12, D / 2 - 21, u + 4.5, H - 6, D / 2 + 21);
      for (let u = 5; u < W - 30; u += 34) B("storebox", u, 17.5, 6, u + 30, 37.5, D - 6); } },
  chest3: { n: "Chest of three drawers, white", k: "chest", w: 80, d: 48, h: 78, ref: "hcikea", src: "IKEA MALM, 80 × 48 × 78", b: hcChest("door_white", 1, 3, "grip") },
  chest6: { n: "Wide chest of six drawers, oak", k: "chest", w: 160, d: 48, h: 78, ref: "hcikea", src: "IKEA MALM, 160 × 48 × 78", b: hcChest("oak", 2, 3, "grip") },
  tallboy: { n: "Tall chest of five drawers, pine", k: "chest", w: 76, d: 40, h: 127, ref: "hcikea", src: "IKEA TARVA, 76 × 40 × 127", b: hcChest("pine", 1, 5) },
  bsdrawer: { n: "Bedside, a drawer and a shelf", k: "bedside", w: 45, d: 38.5, h: 56, ref: "hcbeds", src: "Daals Marcel, 45 × 38.5 × 56",
    b: (W, H, D, B, L) => { hcLegs("oak", W, D, 8.7, 1.6)(B, L); B("oak", 0, 8.7, 0, 2, H, D); B("oak", W - 2, 8.7, 0, W, H, D); B("oak", 2, 8.7, 0, W - 2, H, 1.5); B("oak", 2, 8.7, 1.5, W - 2, 10.7, D);
      B("oak", 2, H - 2, 1.5, W - 2, H, D); B("oak", 2, H - 18, 1.5, W - 2, H - 16, D); B("oak", 2.3, H - 15.7, D - 2, W - 2.3, H - 2.3, D - 0.5);
      B("handle_black", W / 2 - 6, H - 9.6, D - 0.5, W / 2 + 6, H - 8.4, D); B("book1", 6, 10.7, 8, 26, 13.7, 30); } },
  bswhite: { n: "Bedside of two drawers, white", k: "bedside", w: 40, d: 48, h: 55, ref: "hcikea", src: "IKEA MALM, 40 × 48 × 55", b: hcChest("door_white", 1, 2, "grip") },
  bslegs: { n: "Bedside on legs, oak and black", k: "bedside", w: 45, d: 40, h: 55, ref: "hcbeds", src: "Mallet & Plane Okayama, 45 × 40 × 55",
    b: (W, H, D, B) => { for (const [u, t] of [[1, 1], [W - 3, 1], [1, D - 3], [W - 3, D - 3]]) B("black", u, 0, t, u + 2, 16, t + 2);
      B("oak", 0, 16, 0, W, H, D - 1); const m = 16 + (H - 16) * 0.45;
      B("oak", 1, 17, D - 1, W - 1, m - 0.3, D - 0.3); B("oak", 1, m + 0.3, D - 1, W - 1, H - 1, D - 0.3);
      for (let u = 5; u < W - 4; u += 5) B("gap", u, 17.5, D - 0.35, u + 0.4, H - 1.5, D - 0.25); } },   // its routed fronts
  desklegs: { n: "Oak-effect desk on black legs", k: "desk", w: 140, d: 60, h: 73.6, ref: "hcikea", src: "IKEA LAGKAPTEN / ADILS, 140 × 60",
    b: (W, H, D, B, L) => { B("birch", 0, H - 3.6, 0, W, H, D); hcLegs("black", W, D, H - 3.6, 2, 5)(B, L); } },
  deskdrawers: { n: "Desk with a drawer pedestal", k: "desk", w: 120, d: 60, h: 73.6, ref: "hcikea", src: "IKEA LAGKAPTEN / ALEX, 120 × 60",
    b: (W, H, D, B, L) => { B("birch", 0, H - 3.6, 0, W, H, D); hcChest("door_white", 1, 5, "grip")(36, 70, 58, (m, a, b, c, d, e, f) => B(m, W - 37 + a, b, 1 + c, W - 37 + d, e, 1 + f));
      for (const t of [5, D - 5]) L("door_white", 5, t, 0, [[0, 0], [2, 0], [2, H - 3.6], [0, H - 3.6]]); } },
  trestle: { n: "Trestle desk, white and birch", k: "desk", w: 150, d: 75, h: 74.4, ref: "hcikea", src: "IKEA LINNMON / FINNVARD, 150 × 75",
    b: (W, H, D, B) => { B("door_white", 0, H - 3.4, 0, W, H, D);
      for (const u of [8, W - 54]) { for (const uu of [u, u + 42]) { B("birch", uu, 0, 4, uu + 4, H - 3.4, 7); B("birch", uu, 0, D - 7, uu + 4, H - 3.4, D - 4); B("birch", uu, H - 8, 4, uu + 4, H - 3.4, D - 4); }
        B("birch", u, 18, 4, u + 46, 20, D - 4); } } },   // each trestle's shelf
  desklong: { n: "Long desk on two drawer units, white", k: "desk", w: 200, d: 60, h: 73, ref: "hcswap", src: "IKEA LAGKAPTEN / ALEX, 200 × 60 × 73",   // N217: room for bedroom 2's riser
    b: (W, H, D, B, L) => { B("door_white", 0, H - 3, 0, W, H, D); hcChest("door_white", 1, 5, "grip")(36, 70, 58, (m, a, b, c, d, e, f) => B(m, 1 + a, b, 1 + c, 1 + d, e, 1 + f));
      B("door_white", W - 37, 0, 1, W - 1, 70, 59); for (const v of [23, 46]) B("door_white", W - 35, v, 3, W - 3, v + 1.6, 57);   // ALEX's open unit, two shelves
      L("door_white", W / 2, 5, 0, [[0, 0], [2, 0], [2, H - 3], [0, H - 3]]); } },
  bookcase: { n: "Oak bookcase", k: "shelves", w: 80, d: 28, h: 202, ref: "hcikea", src: "IKEA BILLY, 80 × 28 × 202", b: hcShelves("oak", hcBooks) },
  cubes: { n: "Cube shelving with boxes, white", k: "shelves", w: 147, d: 39, h: 147, ref: "hcikea", src: "IKEA KALLAX, 147 × 39 × 147", b: hcCubes("door_white") },
  ladder: { n: "Ladder shelf, oak", k: "shelves", w: 60, d: 47, h: 187, ref: "hcmore", src: "Cox & Cox leaning oak, 60 × 47 × 187",
    b: (W, H, D, B) => { const n = 5, vv = i => 20 + i * (H - 24) / (n - 1), dd = i => D * (1 - i * 0.18);   // deeper at the foot, leaning to the wall
      for (let i = 0; i < n; i++) { B("oak", 3, vv(i), 0, W - 3, vv(i) + 2, dd(i)); for (const u of [0, W - 3]) B("oak", u, i ? vv(i) : 0, dd(i + 1) - 3, u + 3, (i < n - 1 ? vv(i + 1) : H - 2) + 2, dd(i)); }
      B("ivy", W / 2 - 8, vv(n - 1) + 2, 4, W / 2 + 8, vv(n - 1) + 12, dd(n - 1) - 2); hcBooks(B, 3, W - 3, vv(1) + 2, 28, dd(1), 2); } },
  armchair: { n: "Armchair, green weave", k: "seat", w: 89, d: 89, h: 78, ref: "hcikea", src: "IKEA LANDSKRONA, 89 × 89 × 78",
    b: (W, H, D, B, L) => { hcLegs("oak", W, D, 12, 2, 6)(B, L);
      B("cloth3", 0, 12, 0, W, 34, D); B("cloth3", 0, 34, 0, W, H - 6, 12); B("cloth3", 0, 34, 12, 12, 60, D); B("cloth3", W - 12, 34, 12, W, 60, D);
      B("cloth3", 12.5, 34, 28, W - 12.5, 44, D - 0.5); B("cloth3", 12.5, 34, 12, W - 12.5, H, 28); } },   // the seat cushion (44 high), the back's
  bench: { n: "Oak bench", k: "seat", w: 140, d: 35, h: 45, ref: "hcikea", src: "IKEA KEJSARKRONA, 140 × 35 × 45",
    b: (W, H, D, B) => { B("oak", 0, H - 4, 0, W, H, D); for (const u of [8, W - 12]) B("door_white", u, 0, 2, u + 4, H - 4, D - 2); B("door_white", 12, 12, D / 2 - 2, W - 12, 16, D / 2 + 2); } },
  pouffe: { n: "Round pouffe, rust", k: "seat", w: 45, d: 45, h: 33, ref: "hcikea", src: "IKEA SANDARED, 45 across, 33 high",
    b: (W, H, D, B, L) => { L("cloth2", W / 2, D / 2, 0, [[0, 0], [W / 2 - 2, 0], [W / 2, 3], [W / 2, H - 5], [W / 2 - 3, H - 0.8], [W / 2 - 8, H], [0, H]]); } },
  sofa3: { n: "Three-seat sofa, dark blue", k: "seat", w: 228, d: 95, h: 83, ref: "hcmore2", src: "IKEA KIVIK, 228 × 95 × 83, seat 45",   // V3.16 (N58)
    b: (W, H, D, B, L) => { hcLegs("black", W, D, 4, 2, 8)(B, L); const a = (W - 180) / 2;   // its wide arms, a seat 180 × 60 at 45, three cushions each way
      B("cloth0", 0, 4, 0, W, 30, D); for (const u of [0, W - a]) B("cloth0", u, 30, 0, u + a, 62, D); B("cloth0", a, 30, 0, W - a, H - 6, 14);
      for (let i = 0; i < 3; i++) { const u0 = a + i * 60 + 0.4, u1 = a + (i + 1) * 60 - 0.4;
        B("cloth0", u0, 30, D - 61, u1, 45, D - 1); B("cloth0", u0, 45, 14, u1, H - 2, 30); } } },
  dresser: { n: "Dressing table with mirror, white", k: "table", w: 100, d: 50, h: 159, ref: "hcmore2", src: "IKEA HEMNES, 100 × 50, 159 with its mirror",
    b: (W, H, D, B, L) => { hcLegs("door_white", W, D, 71, 2.2, 4)(B, L); B("door_white", 0, 71, 0, W, 74, D);
      B("door_white", 3, 60, 3, W - 3, 71, D - 3); B("door_white", 6, 60.6, D - 3, W - 6, 70.4, D - 2.4); B("knob", W / 2 - 1.5, 64, D - 2.4, W / 2 + 1.5, 67, D - 0.6);   // the drawer under the top
      B("door_white", 12, 74, 2, W - 12, H, 5); B("mirror", 16, 78, 5, W - 16, H - 4, 5.3); } },   // the mirror in its frame, at the back
  tvbench: { n: "TV bench, white and walnut", k: "tv", w: 180, d: 42, h: 38, ref: "hcmore2", src: "IKEA BESTÅ, 180 × 42 × 38",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, H, D - 2); B("gap", 0.5, 0.5, D - 2.05, W - 0.5, H - 0.5, D - 2);
      for (let i = 0; i < 3; i++) B("door_wood", i * W / 3 + 0.3, 0.3, D - 2, (i + 1) * W / 3 - 0.3, H - 0.3, D); } },   // three push-open doors
  plant: { n: "Fiddle-leaf fig, white pot", k: "plant", w: 50, d: 50, h: 140, ref: "hcplants", src: "Beards & Daisies, 140 tall, 27 pot",
    b: (W, H, D, B, L) => { L("pot", W / 2, D / 2, 0, [[0, 0], [12, 0], [15, 28], [15.5, 30], [0, 30]]);
      L("timber", W / 2, D / 2, 28, [[0, 0], [1.5, 0], [1.5, H * 0.45], [0, H * 0.45]]);
      L("ivy", W / 2, D / 2, H * 0.32, [[0, 0], [W * 0.32, H * 0.12], [W / 2, H * 0.36], [W * 0.38, H * 0.56], [W * 0.16, H * 0.66], [0, H * 0.68]]); } },
  snake: { n: "Snake plant, white pot", k: "plant", w: 35, d: 35, h: 95, ref: "hcplants", src: "Patch, 90–100 tall, 30 pot",
    b: (W, H, D, B, L) => { L("pot", W / 2, D / 2, 0, [[0, 0], [12, 0], [15, 26], [15, 28], [0, 28]]);
      for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 2.5 + (i % 3) * 2.8, u = W / 2 + Math.cos(a) * r, t = D / 2 + Math.sin(a) * r;
        B("ivy", u - 1.8, 24, t - 0.6, u + 1.8, 28 + (H - 28) * (0.55 + (i * 37 % 9) / 20), t + 0.6); } } },
  monstera: { n: "Monstera, seagrass basket", k: "plant", w: 70, d: 70, h: 100, ref: "hcplants", src: "The Lechuza, 70 across, 100 tall",
    b: (W, H, D, B, L) => { L("sisal", W / 2, D / 2, 0, [[0, 0], [13, 0], [16, 28], [0, 28]]);
      L("ivy", W / 2, D / 2, 26, [[0, 0], [W * 0.3, 8], [W / 2, (H - 26) * 0.45], [W * 0.44, (H - 26) * 0.7], [W * 0.22, H - 28], [0, H - 26]]); } },
  olive: { n: "Olive tree, grey planter", k: "plant", w: 70, d: 70, h: 150, ref: "hcplants", src: "Olive Grove Oundle, 150 tall, 45 pot",
    b: (W, H, D, B, L) => { L("concrete", W / 2, D / 2, 0, [[0, 0], [20, 0], [22.5, 36], [22.5, 38], [0, 38]]);
      L("timber", W / 2, D / 2, 38, [[0, 0], [2.5, 0], [2, H * 0.4], [0, H * 0.4]]);
      L("ivy", W / 2, D / 2, H * 0.5, [[0, 0], [W * 0.3, H * 0.06], [W / 2, H * 0.22], [W * 0.4, H * 0.38], [W * 0.12, H * 0.49], [0, H * 0.5]]); } },
  rug: { n: "Rug", k: "rug", w: 160, d: 230, h: 1, ref: "rugsizes", src: "Argos's usual size, 160 × 230",
    b: (W, H, D, B) => { B("rug", 0, 0, 0, W, Math.max(0.6, H), D); B("sisal", 4, Math.max(0.6, H), 4, W - 4, Math.max(0.6, H) + 0.2, 8); B("sisal", 4, Math.max(0.6, H), D - 8, W - 4, Math.max(0.6, H) + 0.2, D - 4); } },
  floorlamp: { n: "Floor lamp, linen shade", k: "lamp", w: 45, d: 45, h: 155, ref: "hcmore", src: "Dunelm Marin, 155 tall, 45 shade",
    b: (W, H, D, B, L) => { L("black", W / 2, D / 2, 0, [[0, 0], [13, 0], [13, 2.5], [10, 4], [3, 5], [0, 5]]); L("black", W / 2, D / 2, 5, [[0, 0], [1.4, 0], [1, H - 30], [0, H - 30]]);
      L("paper", W / 2, D / 2, H - 28, [[0, 0], [W / 2 - 0.5, 0], [W / 2 - 0.5, 28], [0, 28]]); } },
  sidetable: { n: "Round side table, oak", k: "table", w: 50, d: 50, h: 56, ref: "hcikea", src: "IKEA LISTERBY, 50 across, 56 high",
    b: (W, H, D, B, L) => { L("oak", W / 2, D / 2, H - 3, [[0, 0], [W / 2, 0], [W / 2, 3], [0, 3]]); hcLegs("oak", W, D, H - 3, 1.8, 11)(B, L);
      for (const [u0, t0, u1, t1] of [[11, 10, W - 11, 12], [11, D - 12, W - 11, D - 10], [10, 11, 12, D - 11], [W - 12, 11, W - 10, D - 11]]) B("oak", u0, H - 9, t0, u1, H - 3, t1); } },
  /* N217: bedroom 2's desk chair and rug swap too (fit.SOURCES hcswap) */
  markus: { n: "Office chair, dark grey", k: "chair", w: 62, d: 60, h: 129, ref: "hcswap", src: "IKEA MARKUS, 62 × 60 × 129–140", b: hcSwivel("cloth5", 46, true) },
  langfjall: { n: "Swivel chair, beige and black", k: "chair", w: 68, d: 68, h: 92, ref: "hcswap", src: "IKEA LÅNGFJÄLL, 68 × 68 × 92", b: hcSwivel("cloth1", 48, false) },
  stoense: { n: "Low-pile rug, off-white", k: "rug", w: 133, d: 195, h: 1.8, ref: "hcswap", src: "IKEA STOENSE, 133 × 195", b: (W, H, D, B) => B("cloth4", 0, 0, 0, W, H, D) },
  lohals: { n: "Flatwoven jute rug", k: "rug", w: 160, d: 230, h: 1.3, ref: "hcswap", src: "IKEA LOHALS, 160 × 230",
    b: (W, H, D, B) => { B("sisal", 0, 0, 0, W, H, D); for (const t of [6, D - 8]) B("knob", 4, H, t, W - 4, H + 0.15, t + 2); } },   // its two woven bands
};
/* N212: the storage ideas' pieces (house/storage_ideas.py, an "idea" kind: never swapped or added from the catalogue), the house's own
   materials only (no new shader when shown) */
const stBooks = (B, u0, u1, v, h, t0, t1, k = 0) => { for (let u = u0; u < u1 - 2; k++) { const w = 1.4 + (k * 37 % 5) * 0.4, hh = h * (0.8 + (k * 53 % 5) * 0.05);
  B("book" + (k % 6), u, v, t0, Math.min(u1, u + w), v + hh, t1); u += w + 0.15; } };
Object.assign(HCAT, {
  st_records: { n: "Record wall", k: "idea", w: 147, d: 39, h: 77, ref: "kallax24", src: "IKEA KALLAX 77 × 147, 39 deep",
    b: (W, H, D, B) => { const nu = 4, nv = 2, cu = (W - 3) / nu, cv = (H - 3) / nv;   // on its side: four across, two up; the end two with doors
      B("oak", 0, 0, 0, W, H, 1); for (let i = 0; i <= nu; i++) B("oak", i * cu, 0, 1, i * cu + 3, H, D); for (let j = 0; j <= nv; j++) B("oak", 0, j * cv, 1, W, j * cv + 3, D);
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = i * cu + 3, v = j * cv + 3;
        if (i === nu - 1) { B("door_white", u + 0.3, v + 0.3, D - 1.8, u + cu - 3.3, v + cv - 3.3, D - 0.2); B("knob", u + 2, v + cv / 2 - 3, D - 0.2, u + 3.5, v + cv / 2 + 3, D); continue; }
        stBooks(B, u + 0.5, u + cu - 3.5, v, Math.min(31.5, cv - 4) / 0.95, D - 33, D - 2, i * 13 + j * 7); } } },
  st_eket: { n: "Lit glass cabinet", k: "idea", w: 35, d: 35, h: 35, ref: "eket", src: "IKEA EKET with glass door 35 × 35 × 35; MITTLED",
    b: (W, H, D, B) => { const T = 1.5; B("door_white", 0, 0, 0, W, T, D - 1); B("door_white", 0, H - T, 0, W, H, D - 1); B("door_white", 0, T, 0, T, H - T, D - 1); B("door_white", W - T, T, 0, W, H - T, D - 1); B("door_white", T, T, 0, W - T, H - T, 1);
      B("led", W / 2 - 3, H - T - 0.6, D / 2 - 3, W / 2 + 3, H - T, D / 2 + 3);   // its spotlight
      B("brass", 5, T, 9, 11, T + 15, 15); B("pot", 14, T, 7, 24, T + 8, 17); B("black", 25, T, 15, 30, T + 20, 20);   // the knick-knacks
      B("door_white", 0, 0, D - 1, T, H, D); B("door_white", W - T, 0, D - 1, W, H, D); B("door_white", T, 0, D - 1, W - T, T, D); B("door_white", T, H - T, D - 1, W - T, H, D);
      B("glass", T, T, D - 0.7, W - T, H - T, D - 0.4); } },
  st_skadis: { n: "Pegboard", k: "idea", w: 56, d: 10, h: 56, ref: "skadis", src: "IKEA SKÅDIS pegboard 56 × 56",
    b: (W, H, D, B) => { B("pegboard", 0, 0, 0, W, H, 1.2); B("door_white", 5, 8, 1.2, 30, 9.2, D); B("storebox", 34, 6, 1.2, 50, 16, 9);
      for (const [u, v] of [[8, 40], [16, 40], [24, 40], [40, 44]]) B("steel", u, v, 1.2, u + 0.6, v + 0.6, 5);
      for (const u of [8.3, 16.3]) B("black", u - 0.5, 22, 2, u + 0.5, 40, 4);   // leads hung on their hooks
      B("black", 36, 26, 1.5, 46, 44, 7); B("pink", 10, 9.2, 3, 16, 12, 8); } },   // the headphones, a pedal on the shelf
  st_ledge: { n: "Picture ledge", k: "idea", w: 55, d: 12, h: 30, ref: "mosslanda", src: "IKEA MOSSLANDA",
    b: (W, H, D, B) => { B("oak", 0, 0, 0, W, 2.2, D); B("oak", 0, 2.2, D - 1.5, W, 4.6, D);
      for (let u = 3, k = 0; ; k++) { const fw = 10 + (k * 7 % 3) * 4, fh = Math.min(H - 3, 13 + (k * 5 % 3) * 6); if (u + fw > W - 2) break;
        B(k % 2 ? "oak" : "black", u, 2.2, 1, u + fw, 2.2 + fh, 2.8); B("paper", u + 1.5, 3.7, 2.8, u + fw - 1.5, 0.7 + fh, 3); u += fw + 3; } } },
  st_float: { n: "Oak floating shelf", k: "idea", w: 90, d: 23, h: 22, ref: "floatshelf", src: "B&Q oak floating shelf 90 × 23",
    b: (W, H, D, B) => { const t = 3.8, h = H - t - 1; B("oak", 0, 0, 0, W, t, D);
      stBooks(B, 2, W * 0.4, t, Math.min(h, 22) / 0.95, 2, D - 3); B("storebox", W * 0.45, t, 2, W * 0.45 + 24, t + Math.min(16, h), D - 2);
      B("jar", W * 0.78, t, D / 2 - 4, W * 0.78 + 8, t + Math.min(12, h), D / 2 + 4); } },
  st_shelf: { n: "Shelf over the door", k: "idea", w: 80, d: 20, h: 26, ref: "bergshult", src: "IKEA BERGSHULT 80 × 20",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, 1.8, D); stBooks(B, 1, W - 1, 1.8, Math.min(19, H - 3) / 0.95, 1, D - 2, W); } },
  st_hooks: { n: "Hat rack with hooks", k: "idea", w: 79, d: 32, h: 25, ref: "tjusig", src: "IKEA TJUSIG 79 × 32 × 25",
    b: (W, H, D, B) => { B("door_white", 0, 0, 0, W, 8, 2); for (const u of [3, W - 5]) { B("door_white", u, 0, 0, u + 2, H, 4); B("door_white", u, H - 4, 4, u + 2, H, D); }
      for (const t of [5, 12, 19, 26]) B("steel", 1, H - 2, t, W - 1, H, t + 1.6);
      for (let u = 9; u < W - 6; u += 10) B("steel", u, 1, 2, u + 0.8, 6, 5); } },
  st_helmer: { n: "Drawers on castors", k: "idea", w: 28, d: 43, h: 69, ref: "helmer", src: "IKEA HELMER 28 × 43 × 69", b: hcChest("door_white", 1, 6) },
  st_ivar: { n: "Pine shelves", k: "idea", w: 89, d: 30, h: 179, ref: "ivar", src: "IKEA IVAR 89 × 30 × 179",
    b: (W, H, D, B) => { for (const u of [0, W - 3]) { for (const t of [0, D - 3]) B("pine", u, 0, t, u + 3, H, t + 3); for (const v of [20, 90, 160]) B("pine", u, v, 3, u + 3, v + 3, D - 3); }
      const vs = [3, 42, 81, 120, H - 2]; vs.forEach((v, i) => { B("pine", 3, v, 0, W - 3, v + 2, D); if (i < vs.length - 1) for (const u of [6, 46]) B("storebox", u, v + 2, 2, u + 36, v + 2 + Math.min(28, vs[i + 1] - v - 6), D - 2); }); } },
});
/* N219: a look for any piece by its kind, in one of the house's own materials (no new shader): the shops' pieces and her own, each at
   its own W × D × H */
const hcFronts = (m, n, W, v0, v1, D, glass) => B => { const w = W / n, hl = Math.min(30, (v1 - v0) * 0.4), hv = (v0 + v1) / 2 - hl / 2;   // n doors across (glazed: a frame), a handle each
  if (!glass) B("gap", 0.5, v0, D - 2.1, W - 0.5, v1, D - 2);
  for (let i = 0; i < n; i++) { const u0 = i * w + 0.3, u1 = (i + 1) * w - 0.3, ku = n > 1 && !(i % 2) ? u1 - 4.5 : u0 + 3;
    if (glass) { for (const [a, b, c, d] of [[u0, v0, u0 + 3, v1], [u1 - 3, v0, u1, v1], [u0, v0, u1, v0 + 3], [u0, v1 - 3, u1, v1]]) B(m, a, b, D - 2, c, d, D - 0.4);
      B("glass", u0 + 3, v0 + 3, D - 1.6, u1 - 3, v1 - 3, D - 1.2); } else B(m, u0, v0 + 0.3, D - 2, u1, v1 - 0.3, D - 0.4);
    B("handle_black", ku, hv, D - 0.4, ku + 1.5, hv + hl, D); } };
const hcTop = m => (W, H, D, B) => { B(m, 0, H - 3, 0, W, H, D); for (const [u, t] of [[2, 2], [W - 6, 2], [2, D - 6], [W - 6, D - 6]]) B(m, u, 0, t, u + 4, H - 3, t + 4); B(m, 6, H - 9, 2, W - 6, H - 3, 3.5); };   // a top on four legs, an apron at the back
const hcCab = m => (W, H, D, B) => { const lg = H > 50 ? 10 : 4; for (const [u, t] of [[2, 2], [W - 5, 2], [2, D - 5], [W - 5, D - 5]]) B(m, u, 0, t, u + 3, lg, t + 3);
  B(m, 0, lg, 0, W, H, D - 2); hcFronts(m, Math.max(1, Math.round(W / 45)), W, lg + 1, H - 1, D)(B); };
const HLOOK = {
  box: m => (W, H, D, B) => B(m, 0, 0, 0, W, H, D),
  bed: m => hcBed((W, H, D, B, L, v) => { B(m, 0, 0, 0, W, H, 6); B(m, 0, 0, D - 5, W, Math.min(H, v + 8), D);   // the headboard, the foot, the sides, the slats
    for (const u of [0, W - 4]) B(m, u, 8, 6, u + 4, v, D - 5); B("pine", 4, v - 2, 6, W - 4, v, D - 5); }),
  wardrobe: m => (W, H, D, B) => { B(m, 0, 0, 0, W, H, D - 2); hcFronts(m, W > 120 ? 3 : 2, W, 6, H - 0.5, D)(B); },
  chest: m => (W, H, D, B) => hcChest(m, W > 110 ? 2 : 1, Math.max(2, Math.min(6, Math.round((H - 8) / 18))))(W, H, D, B),
  bedside: m => HLOOK.chest(m), shelves: m => hcShelves(m, hcBooks), cubes: hcCubes, desk: hcTop, table: hcTop, cabinet: hcCab, tv: hcCab,
  glass: m => (W, H, D, B) => { const v = Math.min(H * 0.4, 85), n = Math.max(1, Math.round(W / 45));   // a glass-door cabinet: doors below, glazed above, glass shelves
    B(m, 0, 0, 0, W, H, 1.5); for (const u of [0, W - 2]) B(m, u, 0, 1.5, u + 2, H, D - 2); B(m, 2, 0, 1.5, W - 2, v, D - 2); B(m, 2, H - 3, 1.5, W - 2, H, D - 2);
    for (let i = 1; i < 3; i++) B("glass", 2, v + i * (H - v) / 3, 1.5, W - 2, v + i * (H - v) / 3 + 0.8, D - 3);
    hcFronts(m, n, W, 0.5, v, D)(B); hcFronts(m, n, W, v, H - 3, D, true)(B); B("pot", 8, v, 8, 18, v + 14, 18); B("brass", W - 20, v, 10, W - 12, v + 20, 18); },
  round: m => (W, H, D, B, L) => { const r = Math.min(W, D) / 2; L(m, W / 2, D / 2, H - 3, [[0, 0], [r, 0], [r, 3], [0, 3]]);   // a round top on a pedestal
    L(m, W / 2, D / 2, 0, [[0, 0], [r * 0.45, 0], [r * 0.45, 2.5], [5, 7], [4, H - 3], [0, H - 3]]); },
  seat: m => (W, H, D, B, L) => { const a = Math.min(14, W * 0.15), s = Math.min(45, H * 0.55), bk = Math.min(16, D * 0.2), n = W > 160 ? 3 : W > 115 ? 2 : 1, cw = (W - 2 * a) / n;   // arms, a back, a cushion a seat
    hcLegs("black", W, D, 8, 1.8, 6)(B, L); B(m, 0, 8, 0, W, s - 10, D); B(m, 0, s - 10, 0, W, H, bk);
    for (const u of [0, W - a]) B(m, u, s - 10, bk, u + a, Math.min(H - 4, s + 20), D);
    for (let i = 0; i < n; i++) { const u0 = a + i * cw + 0.4, u1 = a + (i + 1) * cw - 0.4; B(m, u0, s - 10, bk, u1, s, D - 0.5); B(m, u0, s, bk, u1, Math.min(H - 2, s + 30), bk + 12); } },
  chair: m => hcSwivel(m, 46, true),
  lamp: m => (W, H, D, B, L) => { const r = Math.min(W, D) / 2, b = Math.min(13, r), sh = Math.min(28, H * 0.35);   // a base, a pole, its shade
    L(m, W / 2, D / 2, 0, [[0, 0], [b, 0], [b, 2.5], [b * 0.7, 4], [0, 5]]); L(m, W / 2, D / 2, 5, [[0, 0], [1.2, 0], [1, H - 5 - sh], [0, H - 5 - sh]]);
    L("paper", W / 2, D / 2, H - sh, [[0, 0], [r - 0.5, 0], [r * 0.8, sh], [0, sh]]); },
  rug: m => (W, H, D, B) => B(m, 0, 0, 0, W, Math.max(0.6, H), D),
  roundrug: m => (W, H, D, B, L) => { const r = Math.min(W, D) / 2, h = Math.max(0.6, H); L(m, W / 2, D / 2, 0, [[0, 0], [r, 0], [r, h], [0, h]]); },
};
/* N219: real pieces from the shops (Emma, 22 Nov 2026: "Use multiple real furniture sites and sources"), each its size and price as published
   (docs/N219_catalogue.json; fit.SOURCES its key): n its name, k its kind, l its look if not its kind's, p £, s the shop, c its colour, u its page */
const HSHOP = { ik: ["IKEA", "https://www.ikea.com/gb/en/p/"], hb: ["Habitat", "https://www.habitat.co.uk/product/"], jl: ["John Lewis", "https://www.johnlewis.com/"], du: ["Dunelm", "https://www.dunelm.com/product/"] };
const HREAL = {
  ik_malm: { n: "MALM bed frame", k: "bed", w: 150, d: 199, h: 100, ref: "ik_malm", p: 139, s: "ik", c: "door_white", u: "malm-bed-frame-high-white-luroey-s29006978/" },
  ik_brimnes: { n: "BRIMNES wardrobe", k: "wardrobe", w: 117, d: 50, h: 190, ref: "ik_brimnes", p: 179, s: "ik", c: "door_white", u: "brimnes-wardrobe-with-3-doors-white-40407922/" },
  ik_kleppstad: { n: "KLEPPSTAD wardrobe", k: "wardrobe", w: 79, d: 55, h: 176, ref: "ik_kleppstad", p: 89, s: "ik", c: "door_white", u: "kleppstad-wardrobe-with-2-doors-white-80437234/" },
  ik_vilhatten: { n: "VILHATTEN wardrobe", k: "wardrobe", w: 98, d: 57, h: 190, ref: "ik_vilhatten", p: 149, s: "ik", c: "oak", u: "vilhatten-wardrobe-with-2-doors-and-2-drawers-oak-effect-70530609/" },
  ik_storklinta: { n: "STORKLINTA chest of 6 drawers", k: "chest", w: 140, d: 50, h: 75, ref: "ik_storklinta", p: 139, s: "ik", c: "door_white", u: "storklinta-chest-of-6-drawers-white-70627550/" },
  ik_fagelfjallet: { n: "FÅGELFJÄLLET chest of 4 drawers", k: "chest", w: 82, d: 51, h: 101, ref: "ik_fagelfjallet", p: 129, s: "ik", c: "door_white", u: "fagelfjaellet-chest-of-4-drawers-off-white-60611639/" },
  ik_tonstad: { n: "TONSTAD bedside table", k: "bedside", w: 40, d: 40, h: 59, ref: "ik_tonstad", p: 110, s: "ik", c: "oak", u: "tonstad-bedside-table-oak-veneer-80489322/" },
  ik_radmanso: { n: "RÅDMANSÖ bedside table", k: "bedside", w: 54, d: 38, h: 58, ref: "ik_radmanso", p: 69, s: "ik", c: "timber", u: "radmansoe-bedside-table-brown-walnut-effect-80593597/" },
  ik_billy: { n: "BILLY bookcase", k: "shelves", w: 80, d: 28, h: 202, ref: "ik_billy", p: 55, s: "ik", c: "door_white", u: "billy-bookcase-white-00263850/" },
  ik_hemnes: { n: "HEMNES bookcase", k: "shelves", w: 90, d: 37, h: 197, ref: "ik_hemnes", p: 165, s: "ik", c: "birch", u: "hemnes-bookcase-white-stain-light-brown-60413502/" },
  ik_kallax: { n: "KALLAX shelving unit", k: "shelves", l: "cubes", w: 76.5, d: 39, h: 146.5, ref: "ik_kallax", p: 49, s: "ik", c: "door_white", u: "kallax-shelving-unit-white-80275887/" },
  ik_micke: { n: "MICKE desk", k: "desk", w: 105, d: 50, h: 75, ref: "ik_micke", p: 79, s: "ik", c: "door_white", u: "micke-desk-white-80213074/" },
  ik_tonstad2: { n: "TONSTAD desk", k: "desk", w: 140, d: 75, h: 75, ref: "ik_tonstad2", p: 199, s: "ik", c: "oak", u: "tonstad-desk-oak-veneer-30538198/" },
  ik_mittzon: { n: "MITTZON desk", k: "desk", w: 160, d: 80, h: 85, ref: "ik_mittzon", p: 190, s: "ik", c: "timber", u: "mittzon-desk-walnut-veneer-black-s49513956/" },
  ik_strandmon: { n: "STRANDMON wing chair", k: "seat", w: 82, d: 96, h: 101, ref: "ik_strandmon", p: 299, s: "ik", c: "cloth1", u: "strandmon-wing-chair-talliden-beige-brown-50628942/" },
  ik_poang: { n: "POÄNG armchair", k: "seat", w: 68, d: 82, h: 100, ref: "ik_poang", p: 115, s: "ik", c: "cloth6", u: "poaeng-armchair-walnut-effect-kelinge-dark-yellow-s39625285/" },
  ik_ekenaset: { n: "EKENÄSET armchair", k: "seat", w: 65, d: 74, h: 75, ref: "ik_ekenaset", p: 179, s: "ik", c: "cloth1", u: "ekenaeset-armchair-oak-effect-kilanda-light-beige-00624343/" },
  ik_markus: { n: "MARKUS office chair", k: "chair", w: 62, d: 60, h: 140, ref: "ik_markus", p: 159, s: "ik", c: "cloth5", u: "markus-office-chair-vissle-dark-grey-30261152/" },
  ik_alefjall: { n: "ALEFJÄLL office chair", k: "chair", w: 64, d: 64, h: 95, ref: "ik_alefjall", p: 249, s: "ik", c: "cloth6", u: "alefjaell-office-chair-grann-golden-brown-00419984/" },
  ik_flintan: { n: "FLINTAN office chair", k: "chair", w: 71, d: 71, h: 114, ref: "ik_flintan", p: 79, s: "ik", c: "black", u: "flintan-office-chair-black-50489031/" },
  ik_stoense: { n: "STOENSE rug", k: "rug", w: 200, d: 300, h: 1.8, ref: "ik_stoense", p: 129, s: "ik", c: "cloth4", u: "stoense-rug-low-pile-off-white-20426808/" },
  ik_lohals: { n: "LOHALS rug", k: "rug", w: 160, d: 230, h: 1.3, ref: "ik_lohals", p: 129, s: "ik", c: "sisal", u: "lohals-rug-flatwoven-natural-50277393/" },
  ik_tiphede: { n: "TIPHEDE rug", k: "rug", w: 120, d: 180, h: 0.2, ref: "ik_tiphede", p: 10, s: "ik", c: "cloth4", u: "tiphede-rug-flatwoven-natural-black-40456757/" },
  ik_besta: { n: "BESTÅ TV bench", k: "tv", w: 180, d: 40, h: 38, ref: "ik_besta", p: 65, s: "ik", c: "door_white", u: "besta-tv-bench-white-00474070/" },
  ik_hemnes2: { n: "HEMNES TV bench", k: "tv", w: 148, d: 47, h: 57, ref: "ik_hemnes2", p: 179, s: "ik", c: "birch", u: "hemnes-tv-bench-white-stain-light-brown-50413526/" },
  ik_stockholm: { n: "STOCKHOLM 2025 TV bench", k: "tv", w: 178.8, d: 42, h: 56.2, ref: "ik_stockholm", p: 349, s: "ik", c: "oak", u: "stockholm-2025-tv-bench-with-sliding-doors-oak-veneer-40586508/" },
  ik_lauters: { n: "LAUTERS tripod floor lamp", k: "lamp", w: 62, d: 62, h: 151, ref: "ik_lauters", p: 50, s: "ik", c: "birch", u: "lauters-floor-lamp-ash-white-40405046/" },
  ik_arstid: { n: "ÅRSTID floor lamp", k: "lamp", w: 36, d: 36, h: 155, ref: "ik_arstid", p: 50, s: "ik", c: "brass", u: "arstid-floor-lamp-brass-white-40321320/" },
  ik_lisabo: { n: "LISABO dining table", k: "table", w: 140, d: 78, h: 74, ref: "ik_lisabo", p: 129, s: "ik", c: "birch", u: "lisabo-table-ash-veneer-70294339/" },
  ik_tonstad3: { n: "TONSTAD extendable dining table", k: "table", w: 140, d: 85, h: 75, ref: "ik_tonstad3", p: 299, s: "ik", c: "oak", u: "tonstad-extendable-table-oak-veneer-40593882/" },
  ik_lack: { n: "LACK coffee table", k: "table", w: 90, d: 55, h: 45, ref: "ik_lack", p: 19, s: "ik", c: "black", u: "lack-coffee-table-black-brown-40104294/" },
  ik_stockholm2: { n: "STOCKHOLM coffee table", k: "table", w: 180, d: 59, h: 40, ref: "ik_stockholm2", p: 279, s: "ik", c: "timber", u: "stockholm-coffee-table-walnut-veneer-70239710/" },
  ik_vittsjo: { n: "VITTSJÖ coffee table", k: "table", l: "round", w: 75, d: 75, h: 45, ref: "ik_vittsjo", p: 49, s: "ik", c: "door_cream", u: "vittsjoe-coffee-table-light-beige-glass-30604348/" },
  ik_bissa: { n: "BISSA shoe cabinet", k: "cabinet", w: 49, d: 28, h: 135, ref: "ik_bissa", p: 45, s: "ik", c: "door_white", u: "bissa-shoe-cabinet-with-3-compartments-white-10530259/" },
  ik_trones: { n: "TRONES shoe cabinet/storage", k: "cabinet", w: 52, d: 18, h: 39, ref: "ik_trones", p: 25, s: "ik", c: "door_white", u: "trones-shoe-cabinet-storage-white-00397307/" },
  ik_radmanso2: { n: "RÅDMANSÖ bed frame", k: "bed", w: 142, d: 210, h: 103, ref: "ik_radmanso2", p: 229, s: "ik", c: "timber", u: "radmansoe-bed-frame-brown-walnut-effect-luroey-s79598647/" },
  ik_tarva: { n: "TARVA bed frame", k: "bed", w: 144, d: 199, h: 92, ref: "ik_tarva", p: 149, s: "ik", c: "birch", u: "tarva-bed-frame-white-stained-luroey-s49553985/" },
  ik_slattum: { n: "SLATTUM upholstered bed frame", k: "bed", w: 139, d: 196, h: 85, ref: "ik_slattum", p: 119, s: "ik", c: "cloth5", u: "slattum-upholstered-bed-frame-vissle-dark-grey-50571257/" },
  ik_hemnes3: { n: "HEMNES glass-door cabinet", k: "cabinet", l: "glass", w: 90, d: 37, h: 197, ref: "ik_hemnes3", p: 279, s: "ik", c: "birch", u: "hemnes-glass-door-cabinet-with-3-drawers-white-stain-light-brown-50413507/" },
  ik_lommarp: { n: "LOMMARP cabinet", k: "cabinet", l: "glass", w: 86, d: 49, h: 199, ref: "ik_lommarp", p: 399, s: "ik", c: "stairpaint", u: "lommarp-cabinet-with-glass-doors-dark-blue-green-40383737/" },
  ik_storklinta2: { n: "STORKLINTA bed frame", k: "bed", w: 159, d: 209, h: 101, ref: "ik_storklinta2", p: 184, s: "ik", c: "oak", u: "storklinta-bed-frame-oak-effect-00615621/" },
  ik_tarva2: { n: "TARVA bed frame", k: "bed", w: 158, d: 209, h: 92, ref: "ik_tarva2", p: 134, s: "ik", c: "birch", u: "tarva-bed-frame-white-stained-50586211/" },
  ik_hemnes4: { n: "HEMNES sideboard", k: "cabinet", w: 157, d: 47, h: 88, ref: "ik_hemnes4", p: 249, s: "ik", c: "birch", u: "hemnes-sideboard-white-stain-light-brown-70476259/" },
  ik_stockholm3: { n: "STOCKHOLM 2025 sideboard", k: "cabinet", w: 160.8, d: 42, h: 83.2, ref: "ik_stockholm3", p: 499, s: "ik", c: "oak", u: "stockholm-2025-sideboard-oak-veneer-10586604/" },
  hb_tatsuma: { n: "Tatsuma Double Wooden Bed Frame", k: "bed", w: 135, d: 201, h: 84, ref: "hb_tatsuma", p: 203, s: "hb", c: "timber", u: "9199606" },
  hb_kanso: { n: "Kanso Double Metal Bed Frame", k: "bed", w: 142.2, d: 202.9, h: 110, ref: "hb_kanso", p: 100, s: "hb", c: "door_white", u: "8462437" },
  hb_margot: { n: "Margot Double Bed Frame", k: "bed", w: 151.5, d: 202.5, h: 118.5, ref: "hb_margot", p: 298, s: "hb", c: "oak", u: "4740665" },
  hb_finchley: { n: "Finchley 2 Door Wardrobe", k: "wardrobe", w: 97, d: 55, h: 187, ref: "hb_finchley", p: 610, s: "hb", c: "oak", u: "7221071" },
  hb_akio: { n: "Akio 2 Door 2 Drawer Wardrobe", k: "wardrobe", w: 80, d: 50.5, h: 185, ref: "hb_akio", p: 269, s: "hb", c: "pine", u: "3375749" },
  hb_bronte: { n: "Bronte 2 Door Wardrobe", k: "wardrobe", w: 108.4, d: 58.5, h: 201, ref: "hb_bronte", p: 360, s: "hb", c: "stairpaint", u: "7181214" },
  hb_bronte2: { n: "Bronte 3 Drawer Chest", k: "chest", w: 90, d: 49, h: 86, ref: "hb_bronte2", p: 200, s: "hb", c: "stairpaint", u: "4583949" },
  hb_finchley2: { n: "Finchley 4 Drawer Chest", k: "chest", w: 90, d: 45, h: 87, ref: "hb_finchley2", p: 348, s: "hb", c: "oak", u: "7222355" },
  hb_otto: { n: "Otto 6 Drawer Chest", k: "chest", w: 120, d: 39.5, h: 89, ref: "hb_otto", p: 155, s: "hb", c: "door_white", u: "5828737" },
  hb_finchley3: { n: "Finchley 3 Drawer Bedside Table", k: "bedside", w: 45, d: 45, h: 68, ref: "hb_finchley3", p: 136, s: "hb", c: "oak", u: "4464886" },
  hb_cullen: { n: "Cullen Bamboo Bedside Table", k: "bedside", w: 40, d: 35, h: 48, ref: "hb_cullen", p: 26, s: "hb", c: "oak", u: "4358435" },
  hb_max: { n: "Max Oak Bedside Table", k: "bedside", w: 50, d: 39.5, h: 40, ref: "hb_max", p: 145, s: "hb", c: "oak", u: "8864365" },
  hb_fynn: { n: "Fynn Bookcase", k: "shelves", w: 79.6, d: 35, h: 180, ref: "hb_fynn", p: 240, s: "hb", c: "oak", u: "2913322" },
  hb_jessie: { n: "Jessie Tall & Narrow Ladder Shelf", k: "shelves", w: 36.5, d: 31.6, h: 181, ref: "hb_jessie", p: 95, s: "hb", c: "timber", u: "8879068" },
  hb_jessie2: { n: "Jessie Tall Shelving Unit", k: "shelves", w: 66, d: 35, h: 189, ref: "hb_jessie2", p: 110, s: "hb", c: "oak", u: "8151858" },
  hb_squares: { n: "Squares Plus 8 Cube Storage Unit", k: "shelves", l: "cubes", w: 75.9, d: 39.1, h: 145.5, ref: "hb_squares", p: 100, s: "hb", c: "door_white", u: "6174260" },
  hb_sorel: { n: "Sorel Faux Leather Office Chair", k: "chair", w: 54, d: 64, h: 76.5, ref: "hb_sorel", p: 88, s: "hb", c: "black", u: "2252241" },
  hb_alvar: { n: "Alvar Faux Leather Office Chair", k: "chair", w: 56, d: 57.5, h: 97, ref: "hb_alvar", p: 126, s: "hb", c: "cloth6", u: "4355146" },
  hb_oxley: { n: "Oxley Mesh Office Chair", k: "chair", w: 71, d: 65.5, h: 124.5, ref: "hb_oxley", p: 94, s: "hb", c: "black", u: "4744001" },
  hb_matilda: { n: "Matilda Scalloped Office Desk", k: "desk", w: 86, d: 50, h: 86.7, ref: "hb_matilda", p: 103, s: "hb", c: "oak", u: "7916393" },
  hb_hazel: { n: "Hazel Rattan Round Coffee Table", k: "table", l: "round", w: 81, d: 81, h: 29, ref: "hb_hazel", p: 155, s: "hb", c: "sisal", u: "9208315" },
  hb_agnes: { n: "Agnes Coffee Table", k: "table", w: 59, d: 59, h: 43.5, ref: "hb_agnes", p: 95, s: "hb", c: "timber", u: "7842515" },
  hb_nomad: { n: "Nomad Oak Veneer Coffee Table", k: "table", w: 99.6, d: 60, h: 50, ref: "hb_nomad", p: 260, s: "hb", c: "oak", u: "8573209" },
  hb_nel: { n: "Nel Oak Veneer 4 Seater Dining Table", k: "table", w: 160, d: 85.6, h: 75, ref: "hb_nel", p: 309, s: "hb", c: "oak", u: "9583717" },
  hb_zela: { n: "Zela Round Glass 4 Seater Dining Table", k: "table", l: "round", w: 110, d: 110, h: 75, ref: "hb_zela", p: 210, s: "hb", c: "door_cream", u: "7311572" },
  hb_skandi: { n: "Skandi Walnut Veneer Round 4 Seater", k: "table", l: "round", w: 110, d: 110, h: 75, ref: "hb_skandi", p: 165, s: "hb", c: "timber", u: "8386104" },
  hb_oiled: { n: "Oiled 2 Door Glass Display Cabinet", k: "cabinet", l: "glass", w: 100, d: 45, h: 130, ref: "hb_oiled", p: 525, s: "hb", c: "oak", u: "8390891" },
  hb_compton: { n: "Compton 1 Door Glass Display Cabinet", k: "cabinet", l: "glass", w: 42, d: 31, h: 180, ref: "hb_compton", p: 155, s: "hb", c: "door_white", u: "9381892" },
  hb_cornelia: { n: "Cornelia 2 Door Glass Tall Display", k: "cabinet", l: "glass", w: 100, d: 35, h: 180, ref: "hb_cornelia", p: 570, s: "hb", c: "oak", u: "7841107" },
  hb_cornelia2: { n: "Cornelia 2 Door Oak Sideboard", k: "cabinet", w: 154, d: 47, h: 66, ref: "hb_cornelia2", p: 350, s: "hb", c: "oak", u: "2015282" },
  hb_scion: { n: "Scion Esala 2 Door 3 Drawer Sideboard", k: "cabinet", w: 150, d: 45, h: 71, ref: "hb_scion", p: 595, s: "hb", c: "timber", u: "4077699" },
  hb_fala: { n: "Fala 3 Door 2 Drawer Sideboard", k: "cabinet", w: 120, d: 42, h: 71.2, ref: "hb_fala", p: 242, s: "hb", c: "door_cream", u: "7810107" },
  hb_yassica: { n: "Yassica 2 Door 1 Drawer 65 Inch TV Unit", k: "tv", w: 139.6, d: 42, h: 62.3, ref: "hb_yassica", p: 249, s: "hb", c: "oak", u: "7857122" },
  hb_kendi: { n: "Kendi 2 Drawers 50 Inch TV Unit", k: "tv", w: 150, d: 42, h: 52, ref: "hb_kendi", p: 357, s: "hb", c: "timber", u: "7786547" },
  hb_floating: { n: "Floating Top 65 Inch TV Unit", k: "tv", w: 150.3, d: 41.2, h: 45, ref: "hb_floating", p: 192, s: "hb", c: "door_white", u: "9413959" },
  hb_herringbone: { n: "Herringbone Neutral Border Jute Rug", k: "rug", w: 80, d: 150, h: 1, ref: "hb_herringbone", p: 35, s: "hb", c: "sisal", u: "7353451" },
  hb_braided: { n: "Braided Grey Border Jute Rug", k: "rug", w: 120, d: 170, h: 1, ref: "hb_braided", p: 45, s: "hb", c: "sisal", u: "7807392" },
  hb_geometric: { n: "Geometric Round Wool Rug", k: "rug", l: "roundrug", w: 120, d: 120, h: 1, ref: "hb_geometric", p: 80, s: "hb", c: "cloth4", u: "9569975" },
  hb_scoop: { n: "60 Scoop Fabric Chair", k: "seat", w: 102, d: 103, h: 74, ref: "hb_scoop", p: 275, s: "hb", c: "cloth4", u: "4881012" },
  hb_callie: { n: "Callie Velvet Wingback Chair", k: "seat", w: 79, d: 95, h: 107, ref: "hb_callie", p: 188, s: "hb", c: "cloth3", u: "8698287" },
  hb_drape: { n: "Drape Fabric Armchair", k: "seat", w: 62, d: 67.5, h: 73.5, ref: "hb_drape", p: 275, s: "hb", c: "cloth1", u: "8399854" },
  hb_pillow: { n: "Pillow Single Fabric Chairbed", k: "seat", w: 97, d: 91, h: 84, ref: "hb_pillow", p: 160, s: "hb", c: "cloth0", u: "8117878" },
  hb_roma: { n: "Roma Double Fabric Chairbed", k: "seat", w: 141, d: 90, h: 81, ref: "hb_roma", p: 233.1, s: "hb", c: "cloth5", u: "8444132" },
  hb_tapered: { n: "Tapered Wood Floor Lamp", k: "lamp", w: 40, d: 40, h: 155, ref: "hb_tapered", p: 66, s: "hb", c: "timber", u: "7665943" },
  hb_morris: { n: "Morris & Co. Cane Floor Lamp", k: "lamp", w: 45, d: 45, h: 170, ref: "hb_morris", p: 155, s: "hb", c: "sisal", u: "7571312" },
  hb_cone: { n: "Cone Adjustable Floor Lamp", k: "lamp", w: 34.5, d: 34.5, h: 150, ref: "hb_cone", p: 36, s: "hb", c: "stairpaint", u: "3118308" },
  hb_nantes: { n: "Nantes 3 Door Shoe Storage Cabinet", k: "cabinet", w: 92, d: 36, h: 92.8, ref: "hb_nantes", p: 180, s: "hb", c: "oak", u: "7184194" },
  hb_simone: { n: "Simone 2 Door Shoe Storage Cabinet", k: "cabinet", w: 70, d: 36, h: 80, ref: "hb_simone", p: 158, s: "hb", c: "sisal", u: "4668053" },
  hb_saffield: { n: "Saffield Shoe Storage Bench", k: "cabinet", w: 101, d: 37.5, h: 45.5, ref: "hb_saffield", p: 158, s: "hb", c: "timber", u: "7632691" },
  hb_nora: { n: "Nora Fabric 2 Seater Sofa", k: "seat", w: 138.5, d: 85, h: 73, ref: "hb_nora", p: 240, s: "hb", c: "cloth3", u: "7740909" },
  hb_tatsuma2: { n: "Tatsuma Kingsize Wooden Bed Frame", k: "bed", w: 150, d: 211, h: 84, ref: "hb_tatsuma2", p: 229, s: "hb", c: "timber", u: "9418112" },
  hb_kanso2: { n: "Kanso Kingsize Metal Bed Frame", k: "bed", w: 157.7, d: 216.9, h: 110, ref: "hb_kanso2", p: 120, s: "hb", c: "door_white", u: "8132509" },
  jl_wilton: { n: "Wilton 2 Drawer Bedside Cabinet", k: "bedside", w: 43, d: 41, h: 58, ref: "jl_wilton", p: 119, s: "jl", c: "door_white", u: "john-lewis-wilton-2-drawer-bedside-cabinet/white/p3901695" },
  jl_rattan: { n: "Rattan Storage Bedside Table", k: "bedside", w: 38, d: 42, h: 57, ref: "jl_rattan", p: 175, s: "jl", c: "oak", u: "john-lewis-rattan-storage-bedside-table/oak/p5274268" },
  jl_pillar: { n: "Pillar 1 Drawer Bedside Table", k: "bedside", w: 43, d: 37, h: 59.5, ref: "jl_pillar", p: 129, s: "jl", c: "cloth2", u: "john-lewis-pillar-1-drawer-bedside-table/rosehip/p113155334" },
  jl_spindle: { n: "Spindle Desk", k: "desk", w: 95, d: 55, h: 76, ref: "jl_spindle", p: 199, s: "jl", c: "door_wood", u: "john-lewis-spindle-desk/burnt-orange/p5127465" },
  jl_hairpin: { n: "Hairpin Desk", k: "desk", w: 120, d: 55, h: 76, ref: "jl_hairpin", p: 399, s: "jl", c: "timber", u: "john-lewis-hairpin-desk/dark-oak/p3300533" },
  jl_wilton2: { n: "Wilton 2 Door Wardrobe", k: "wardrobe", w: 99, d: 56.8, h: 188, ref: "jl_wilton2", p: 399, s: "jl", c: "oak", u: "john-lewis-wilton-2-door-wardrobe/natural/p3901693" },
  jl_cotswold: { n: "Julian Bowen Cotswold Double Wardrobe", k: "wardrobe", w: 100, d: 56, h: 195, ref: "jl_cotswold", p: 592, s: "jl", c: "oak", u: "julian-bowen-cotswold-double-wardrobe-with-1-drawer-natural/p6357755" },
  jl_maine: { n: "Julian Bowen Maine 6 Drawer Wide Chest", k: "chest", w: 130, d: 44, h: 74, ref: "jl_maine", p: 328, s: "jl", c: "door_white", u: "julian-bowen-maine-6-drawer-wide-chest-white/p6357600" },
  jl_abacus: { n: "Abacus 7 Shelf Bookcase", k: "shelves", w: 77, d: 33, h: 210, ref: "jl_abacus", p: 299, s: "jl", c: "oak", u: "john-lewis-abacus-7-shelf-bookcase-fsc-certified/p112057610" },
  jl_calia: { n: "Calia Bookcase", k: "shelves", w: 90, d: 40, h: 200, ref: "jl_calia", p: 499, s: "jl", c: "oak", u: "john-lewis-calia-bookcase/p2431233" },
  jl_wilton3: { n: "Wilton Bed Frame", k: "bed", w: 144, d: 202, h: 102, ref: "jl_wilton3", p: 299, s: "jl", c: "door_white", u: "john-lewis-wilton-bed-frame-double/white/p312175" },
  jl_dorm: { n: "Dorm Metal Bed Frame", k: "bed", w: 144, d: 198, h: 112, ref: "jl_dorm", p: 249, s: "jl", c: "black", u: "john-lewis-dorm-metal-bed-frame-double/black/p111267416" },
  jl_groove: { n: "Groove 3 Drawer Bedroom Chest", k: "chest", w: 92, d: 43.5, h: 89.5, ref: "jl_groove", p: 399, s: "jl", c: "oak", u: "john-lewis-groove-3-drawer-bedroom-chest/natural/p5912427" },
  jl_wilton4: { n: "Wilton Bed Frame", k: "bed", w: 159, d: 212, h: 102, ref: "jl_wilton4", p: 399, s: "jl", c: "door_white", u: "john-lewis-wilton-bed-frame-king-size/white/p475262" },
  jl_rattan2: { n: "Rattan Bed Frame", k: "bed", w: 166.5, d: 219.5, h: 102.5, ref: "jl_rattan2", p: 729, s: "jl", c: "oak", u: "john-lewis-rattan-bed-frame-king-size/oak/p4147243" },
  jl_seoul: { n: "Desser Seoul Rattan Lounge Chair", k: "seat", w: 92, d: 76, h: 80, ref: "jl_seoul", p: 319, s: "jl", c: "sisal", u: "desser-seoul-rattan-lounge-chair/natural-latte/p111357711" },
  jl_dorsal: { n: "Dorsal Office Chair", k: "chair", w: 65, d: 63, h: 90, ref: "jl_dorsal", p: 149, s: "jl", c: "black", u: "john-lewis-dorsal-office-chair/black/p5137050" },
  jl_rowley: { n: "Rowley Swivel Office Chair", k: "chair", w: 61, d: 58.5, h: 91.5, ref: "jl_rowley", p: 179, s: "jl", c: "cloth6", u: "john-lewis-rowley-swivel-office-chair/whisky/p111535524" },
  jl_harring: { n: "Swoon Harring TV Unit", k: "tv", w: 90, d: 35, h: 38, ref: "jl_harring", p: 223.2, s: "jl", c: "oak", u: "swoon-harring-tv-unit-natural-black/p112908476" },
  jl_wing: { n: "Wing TV Stand", k: "tv", w: 120, d: 43, h: 42, ref: "jl_wing", p: 349, s: "jl", c: "timber", u: "john-lewis-wing-tv-stand/p5800807" },
  jl_notch: { n: "Notch 2 Door, 2 Drawer Sideboard", k: "cabinet", w: 165, d: 50, h: 74, ref: "jl_notch", p: 699, s: "jl", c: "oak", u: "john-lewis-notch-2-door-2-drawer-sideboard-oak/p6419730" },
  jl_wilton5: { n: "Wilton Display Cabinet", k: "cabinet", l: "glass", w: 90, d: 38, h: 180, ref: "jl_wilton5", p: 579, s: "jl", c: "door_cream", u: "john-lewis-wilton-display-cabinet-linen/p113948858" },
  jl_hector: { n: "Hector Floor Lamp", k: "lamp", w: 106.68, d: 31.75, h: 210, ref: "jl_hector", p: 160, s: "jl", c: "brass", u: "john-lewis-hector-floor-lamp/antique-brass-black/p3689364" },
  jl_anton: { n: "Anton Coffee Table", k: "table", w: 120, d: 60, h: 45, ref: "jl_anton", p: 179, s: "jl", c: "oak", u: "john-lewis-anton-coffee-table/oak/p6293480" },
  jl_anton2: { n: "Anton 6-8 Seater Extending Dining Table", k: "table", w: 160, d: 90, h: 75, ref: "jl_anton2", p: 429, s: "jl", c: "oak", u: "john-lewis-anton-6-8-seater-extending-dining-table-oak/p6293478" },
  jl_notch2: { n: "Notch Round 4-6 Seater Extending Dining", k: "table", l: "round", w: 120, d: 120, h: 75, ref: "jl_notch2", p: 799, s: "jl", c: "oak", u: "john-lewis-notch-round-4-6-seater-extending-dining-table/natural/p6419733" },
  jl_mid: { n: "Mid Century Shoe Cabinet, 2 Tier", k: "cabinet", w: 62, d: 36, h: 122.5, ref: "jl_mid", p: 299, s: "jl", c: "oak", u: "john-lewis-mid-century-shoe-cabinet-2-tier-natural-honey/p110828820" },
  jl_rattan3: { n: "Rattan 3 Tier Shoe Storage Unit", k: "cabinet", w: 80, d: 24, h: 127, ref: "jl_rattan3", p: 200, s: "jl", c: "sisal", u: "john-lewis-rattan-3-tier-shoe-storage-unit/p6293068" },
  jl_brooklyn: { n: "Brooklyn Tripod Floor Lamp", k: "lamp", w: 45, d: 45, h: 160, ref: "jl_brooklyn", p: 200, s: "jl", c: "oak", u: "john-lewis-brooklyn-tripod-floor-lamp/natural/p110199860" },
  jl_wilton6: { n: "Wilton Wide Sideboard", k: "cabinet", w: 120, d: 40, h: 79.5, ref: "jl_wilton6", p: 479, s: "jl", c: "door_cream", u: "john-lewis-wilton-wide-sideboard-linen/p6396484" },
  du_mirage: { n: "Mirage Rug", k: "rug", w: 160, d: 230, h: 1.4, ref: "du_mirage", p: 139, s: "du", c: "cloth5", u: "mirage-rug-1000139698" },
  du_parker: { n: "Parker Rug", k: "rug", w: 160, d: 230, h: 0.8, ref: "du_parker", p: 109, s: "du", c: "cloth0", u: "parker-rug-1000168296" },
  du_pebble: { n: "Pebble Wool Border Rug", k: "rug", w: 160, d: 230, h: 0.6, ref: "du_pebble", p: 179, s: "du", c: "cloth3", u: "pebble-wool-border-rug-1000181731" },
  du_scandi: { n: "Scandi Mid Century Wooden Bed", k: "bed", w: 142, d: 204, h: 100, ref: "du_scandi", p: 189, s: "du", c: "oak", u: "scandi-mid-century-wooden-bed-1000147431" },
  du_scandi2: { n: "Scandi Mid Century Wooden Bed", k: "bed", w: 158, d: 211, h: 100, ref: "du_scandi2", p: 219, s: "du", c: "oak", u: "scandi-mid-century-wooden-bed-1000147431" },
  du_henry: { n: "Henry Small Display Cabinet", k: "cabinet", l: "glass", w: 80, d: 40, h: 80, ref: "du_henry", p: 149, s: "du", c: "door_cream", u: "henry-small-display-cabinet-1000293223" },
  du_lowry: { n: "Lowry 2 Door Wardrobe", k: "wardrobe", w: 97, d: 55, h: 190, ref: "du_lowry", p: 679, s: "du", c: "timber", u: "lowry-2-door-wardrobe-1000278905" },
  du_panama: { n: "Panama 2 Door Wardrobe", k: "wardrobe", w: 80, d: 50, h: 175, ref: "du_panama", p: 229, s: "du", c: "pine", u: "panama-2-door-wardrobe-1000114114" },
  du_lancaster: { n: "Lancaster Chest of Drawers", k: "chest", w: 79, d: 35, h: 81, ref: "du_lancaster", p: 159, s: "du", c: "steel_dark", u: "lancaster-chest-of-drawers-1000169391" },
  du_premiere: { n: "Premiere Corona 3 Drawer Bedside Chest", k: "bedside", w: 53, d: 39, h: 67, ref: "du_premiere", p: 69, s: "du", c: "pine", u: "premiere-corona-3-drawer-bedside-chest-1000133634" },
  du_lynton: { n: "Lynton 2 Drawer Bedside Table", k: "bedside", w: 49, d: 40, h: 61, ref: "du_lynton", p: 69, s: "du", c: "door_white", u: "lynton-2-drawer-bedside-table-1000106940" },
  du_kendall: { n: "Kendall Velvet Office Chair", k: "chair", w: 57, d: 56, h: 79, ref: "du_kendall", p: 119, s: "du", c: "cloth5", u: "kendall-velvet-office-chair-1000188738" },
  du_clement: { n: "Clement Faux Leather Office Chair", k: "chair", w: 65, d: 65, h: 90, ref: "du_clement", p: 129, s: "du", c: "black", u: "clement-faux-leather-office-chair-1000277455" },
  du_georgi: { n: "Georgi Display Cabinet", k: "cabinet", l: "glass", w: 94.5, d: 39.5, h: 160, ref: "du_georgi", p: 319.2, s: "du", c: "door_cream", u: "georgi-display-cabinet-1000251719" },
  du_belford: { n: "Belford Wooden Bed Frame", k: "bed", w: 141.5, d: 215, h: 100, ref: "du_belford", p: 239, s: "du", c: "door_white", u: "belford-wooden-bed-frame-white-1000241957" },
  du_franklin: { n: "Franklin Desk", k: "desk", w: 90.2, d: 45.7, h: 76.2, ref: "du_franklin", p: 139, s: "du", c: "steel_dark", u: "franklin-desk-1000166913" },
};
for (const [k, C] of Object.entries(HREAL)) HCAT[k] = Object.assign(C, { src: HSHOP[C.s][0], url: HSHOP[C.s][1] + C.u, b: HLOOK[C.l || C.k](C.c) });
/* N219: a piece of her own: its look (a kind), W × D × H and a colour, kept in its add row's value ("own|desk|120|60|75|oak|Our desk"), so
   Send and the look link carry it as they do any piece added; made a catalogue piece when first read (hcGet) */
const HOWN_L = { box: ["Box", "more"], bed: ["Bed", "bed"], wardrobe: ["Wardrobe", "wardrobe"], chest: ["Drawers", "chest"], shelves: ["Shelves", "shelves"], cabinet: ["Cabinet", "cabinet"],
  desk: ["Desk", "desk"], table: ["Table", "table"], seat: ["Seat", "seat"], chair: ["Desk chair", "chair"], lamp: ["Lamp", "lamp"], rug: ["Rug", "rug"] };
const HOWN_C = [["white", "door_white", "White"], ["cream", "door_cream", "Cream"], ["oak", "oak", "Oak"], ["pine", "pine", "Pine"], ["walnut", "timber", "Walnut"], ["black", "black", "Black"],
  ["grey", "cloth5", "Grey"], ["green", "cloth3", "Green"], ["blue", "cloth0", "Blue"], ["rust", "cloth2", "Rust"], ["beige", "cloth1", "Beige"], ["rattan", "sisal", "Rattan"]];
const HOWN_RE = /^own\|([a-z]{2,9})\|(\d{1,3}(?:\.\d)?)\|(\d{1,3}(?:\.\d)?)\|(\d{1,3}(?:\.\d)?)\|([a-z]{3,7})\|([\p{L}\p{N} '’,.()/+-]{0,24})$/u;
const ownName = t => String(t || "").replace(/[^\p{L}\p{N} '’,.()/+-]/gu, "").replace(/\s+/g, " ").slice(0, 24);
const ownKey = O => `own|${O.l}|${cmR(Math.max(5, Math.min(500, O.w)))}|${cmR(Math.max(5, Math.min(500, O.d)))}|${cmR(Math.max(0.5, Math.min(300, O.h)))}|${O.c}|${ownName(O.name)}`;
function hcGet(v) {   // a catalogue piece, or her own read from its value (checked: its look, colour and sizes)
  if (typeof v !== "string") return null; if (HCAT[v]) return HCAT[v];
  const m = HOWN_RE.exec(v), L = m && HOWN_L[m[1]], c = m && HOWN_C.find(q => q[0] === m[5]); if (!L || !c) return null;
  const [w, d, h] = [m[2], m[3], m[4]].map(Number); if (w < 5 || w > 500 || d < 5 || d > 500 || h < 0.5 || h > 300) return null;
  const name = m[6].trim();
  return (HCAT[v] = { n: name || "Your own " + L[0].toLowerCase(), k: L[1], w, d, h, own: { l: m[1], w, d, h, c: m[5], name }, b: HLOOK[m[1]](c[1]) });
}
/* which pieces swap, and for what: by the kind of thing it is (its id), standing on the floor, one that turns (no lid or doors of its own) */
const HSWAP_OF = [[/(^|\.)bed$|bed_/, "bed"], [/wardrobe/, "wardrobe"], [/bedside/, "bedside"], [/chest/, "chest"], [/desk$/, "desk"],
  [/shelving|kallax|bookcase|shelves/, "shelves"], [/chairbed|bench|armchair/, "seat"], [/(^|\.)chair$/, "chair"], [/(^|\.)rug$/, "rug"]];
function swapKind(id) {
  const it = HIT(id); if (!it || it.op || (it.k !== "furniture" && !/rug$/.test(id)) || (it.s[2] || 0) > 20) return null;
  const k = (HSWAP_OF.find(([re]) => re.test(id)) || [])[1];
  return k && canTurn(id) ? k : null;
}
const hcOf = kind => Object.keys(HCAT).filter(k => HCAT[k].k === kind && !HCAT[k].own);
/* N217: a piece swapped at its own size (W along its wall, D out, H up): its back where the old one's was, along its wall from the same
   end if that stood within 10 of its room's wall, else from its middle, kept in its room; a chair where the old one was, facing the same way */
function swapBox(id, key) {
  const it = HIT(id), C = HCAT[key], { a, o, flip } = hcFrame(it), b = it.b.slice(), r = (R.HOUSE3.rooms || {})[it.r], ch = C.k === "chair";
  const [r0, r1] = r ? (a === 2 ? [r[2], r[3]] : [r[0], r[1]]) : [b[a], b[a + 3]];
  const u0 = !ch && b[a] - r0 < 10 ? b[a] : !ch && r1 - b[a + 3] < 10 ? b[a + 3] - C.w : (b[a] + b[a + 3] - C.w) / 2;
  b[a] = Math.max(r0, Math.min(r1 - C.w, u0)); b[a + 3] = b[a] + C.w; b[4] = b[1] + C.h;
  if (ch) { b[o] = (b[o] + b[o + 3] - C.d) / 2; b[o + 3] = b[o] + C.d; } else if (flip) b[o] = b[o + 3] - C.d; else b[o + 3] = b[o] + C.d;
  return b.map(v => Math.round(v * 10) / 10);
}
function pieceBase(id, key) {   // the piece as planned, or the one swapped in where it stood (a chair turned to face as the old one did)
  const it = HIT(id); if (!key || !HCAT[key]) return it;
  const b = swapBox(id, key), k = it.ax === "z" ? 2 : 0;
  return Object.assign({}, it, { b, s: [b[k + 3] - b[k], b[4] - b[1], it.s[2]], al: cmR(it.al + b[k] - it.b[k]), flip: hcFrame(it).flip !== (HCAT[key].k === "chair") });
}
/* a piece's frame in the house: its wall axis, and which way it faces (its back to the nearer wall of its room) */
function hcFrame(it) {
  const r = (R.HOUSE3.rooms || {})[it.r] || [it.b[0], it.b[3], it.b[2], it.b[5]], b = it.b, a = it.ax === "z" ? 2 : 0, o = 2 - a;
  if (it.flip != null) return { a, o, flip: it.flip };   // N212: a storage idea's piece knows its wall (the store's shelves back onto the flight)
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
const HCFK = { "-260": "lower", "0": "ground", "260": "first" };   // the floor as drawn, with the pieces swapped (their own boxes out, the new one's in their place) and those added (a new tag each)
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
  const put = (id, key, it) => { let t = nt.indexOf(id); if (t < 0) { t = nt.length; nt.push(id); }
    const P = hcBuild(key, it, t);
    for (const [m, list] of Object.entries(P.boxes)) { (boxes[m] = boxes[m] || []).push(...list); (bt[m] = bt[m] || []).push(...P.bt[m]); }
    lathes.push(...P.lathes); };
  const sb = {}; sw.forEach(id => { const P = pieceBase(id, HEDITS[id].swap); sb[tags.indexOf(id)] = P.b; put(id, HEDITS[id].swap, P); }); ad.forEach(id => put(id, HEDITS[id].add, HIT(id)));
  const shade = (F.shade || []).map(q => { const b = sb[q[0]]; return b ? [q[0], b[0], b[2], b[3], b[5], b[1], b[4] - b[1]] : q; });
  return Object.assign({}, F, { boxes, bt, lathes, prisms, tags: nt, shade });
}
/* the added pieces, from Measure's rows: each a piece of the house (HIT) at the spot the floor was tapped, its back to the nearer wall */
const ADDED = {}, ADDFK = {};   // ADDFK: each added piece's floor, kept once it's gone (its floor is drawn again)
function syncAdds() {
  const ds = DS(), H3 = R.HOUSE3; if (!ds || !H3) return;
  syncPlants(); syncIdeas();
  const rows = {}; for (const v of Object.values(ds.rows("edits") || {})) if (v && v.field === "add" && /^add\.[a-z0-9]{1,12}$/.test(v.item || "") && hcGet(v.value) && (H3.rooms || {})[v.room]) rows[v.item] = v;   // N219: her own too
  for (const id of Object.keys(ADDED)) if (!rows[id]) { delete H3.items[id]; delete ADDED[id]; }
  for (const [id, v] of Object.entries(rows)) { if (ADDED[id] === `${v.value}@${v.x},${v.z}`) continue;   // N218: a new piece or a new spot
    const C = HCAT[v.value], r = H3.rooms[v.room], x = +v.x, z = +v.z, y = isFinite(+v.y) ? +v.y : r[4]; if (!isFinite(x) || !isFinite(z)) continue;
    const dz = Math.min(z - r[2], r[3] - z), dx = Math.min(x - r[0], r[1] - x), ax = dz <= dx ? "x" : "z", a = ax === "z" ? 2 : 0, o = 2 - a;
    const c = [x, y, z], b = [0, y, 0, 0, y + C.h, 0], ro = o === 2 ? [r[2], r[3]] : [r[0], r[1]], ra = a === 2 ? [r[2], r[3]] : [r[0], r[1]];
    b[a] = Math.max(ra[0], Math.min(ra[1] - C.w, c[a] - C.w / 2)); b[a + 3] = b[a] + C.w;
    const near = c[o] - ro[0] < ro[1] - c[o], gap = near ? c[o] - C.d / 2 - ro[0] : ro[1] - c[o] - C.d / 2;   // within 30 of its wall: against it
    b[o] = gap < 30 ? (near ? ro[0] + 0.5 : ro[1] - 0.5 - C.d) : c[o] - C.d / 2; b[o + 3] = b[o] + C.d;
    ADDED[id] = `${v.value}@${v.x},${v.z}`; ADDFK[id] = HCFK[String(r[4])];
    H3.items[id] = { n: C.n, k: "furniture", r: v.room, ax, b: b.map(q => Math.round(q * 10) / 10), s: [C.w, C.h, 0], g: false, al: Math.round((b[a] - ra[0]) * 10) / 10, op: null, add: v.value, fk: HCFK[String(r[4])] };
  }
}
/* N217: does a changed piece fit? Its room's walls (past its outline, into a notch or a knee wall), the slope or the ceiling, the doors'
   swings and the walks (export3d's "fit"), then the pieces in its way; a rug lies under a door and a walk. Each as "12 cm into …" */
function roomWhy(b, rid, self) {   // box b in room rid (self: the piece it is, whose own space kept clear it may take)
  const FT = R.HOUSE3.fit, r = R.HOUSE3.rooms[rid], out = [], into = (v, w) => { if (v > 1) out.push(`${Math.round(v)} cm into ${w}`); }; if (!FT || !r) return out;
  const dig = q => { const x = Math.min(b[3], q[3]) - Math.max(b[0], q[0]), z = Math.min(b[5], q[5]) - Math.max(b[2], q[2]); return x > 0 && z > 0 && b[1] < q[4] && b[4] > q[1] ? Math.min(x, z) : 0; };
  into(Math.max(r[0] - b[0], b[3] - r[1], r[2] - b[2], b[5] - r[3], ...(FT.notch[rid] || []).map(([x0, x1, z0, z1]) => dig([x0, -1e4, z0, x1, 1e4, z1])), ...FT.eaves.map(dig)), "the wall");
  const [top, zn, yb, kb, zs, yf, kf, dx0, dx1, dz] = FT.roof, first = HCFK[String(r[4])] === "first";   // model.headroom
  const head = z => !first ? r[4] + R.HOUSE3.ceil : b[0] >= dx0 && b[3] <= dx1 && z <= dz ? top : Math.min(top, yb + (z - zn) * kb, yf + (zs - z) * kf), lim = Math.min(head(b[2]), head(b[5]));
  into(b[4] - lim, first && lim < top ? "the slope" : "the ceiling");
  if (b[4] - b[1] > 3) {
    let s = 0;   // storage_ideas.checks' swept: the leaf's quarter circle from its hinge, 205 high
    for (const o of Object.values(R.HOUSE3.items)) { const p = o.op, S = p && p.swing; if (!S || p.y0 !== r[4] || b[1] > p.y0 + 205) continue;
      const R_ = p.b - p.a, [l0, l1, c0, c1] = p.axis === "x" ? [b[0], b[3], b[2], b[5]] : [b[2], b[5], b[0], b[3]];
      const a0 = Math.max(l0, Math.min(S.hinge, S.hinge + S.u * R_)), a1 = Math.min(l1, Math.max(S.hinge, S.hinge + S.u * R_));
      const e0 = Math.max(c0, Math.min(p.line, p.line + S.side * R_)), e1 = Math.min(c1, Math.max(p.line, p.line + S.side * R_));
      if (a0 >= a1 - 0.5 || e0 >= e1 - 0.5) continue;
      s = Math.max(s, R_ - Math.hypot(Math.min(Math.max(S.hinge, a0), a1) - S.hinge, Math.min(Math.max(p.line, e0), e1) - p.line)); }
    into(s, "the door's swing");
    for (const [n, q, of] of FT.keep) if (of !== self) into(dig(q), n.replace(/ \(.*\)$/, ""));
  }
  return out;
}
function fitWhy(id) {
  const it = HIT(id), cl = clashes(id), way = cl.length ? [`in the way of ${cl.slice(0, 2).join(" and ").replace(/^The /, "the ").replace(/ and The /, " and the ")}`] : [];
  if (!it || it.op || pieceNow(id).removed || (!it.add && !pieceDelta(id).some(Boolean))) return way;
  return roomWhy(pieceBox(id), it.r, id).concat(way);
}
/* N218: where an added piece stands: back to a wall of its room (as syncAdds puts it: the row's x, z on that wall), clear of the walls,
   the slope, the swings, the space kept clear and the pieces, nearest the tap; if nowhere, back to the nearest wall at the tap */
function addSpot(rid, key, x, z, y, self) {
  const r = R.HOUSE3.rooms[rid], C = hcGet(key), over = (p, q) => [0, 1, 2].every(j => p[j] < q[j + 3] - 1 && p[j + 3] > q[j] + 1); let best = null;
  const busy = Object.keys(R.HOUSE3.items).filter(k => { const o = HIT(k); return k !== self && o.r === rid && !HCSKIP.has(o.k) && !hcSoft(k) && !pieceNow(k).removed; }).map(pieceBox);
  for (const [o, hi] of [[2, 0], [2, 1], [0, 0], [0, 1]]) { const a = 2 - o, w = r[o + hi] + (hi ? -0.5 : 0.5);   // each wall, its back 0.5 off it
    for (let u = r[a]; u <= r[a + 1] - C.w; u += 5) { const b = [0, y, 0, 0, y + C.h, 0]; b[a] = u; b[a + 3] = u + C.w; b[o] = hi ? w - C.d : w; b[o + 3] = b[o] + C.d;
      const d = Math.hypot((b[0] + b[3]) / 2 - x, (b[2] + b[5]) / 2 - z); if (best && d >= best[2]) continue;
      if (!roomWhy(b, rid, self).length && !busy.some(q => over(b, q))) best = o ? [u + C.w / 2, w, d] : [w, u + C.w / 2, d]; } }
  return best ? best.slice(0, 2) : [x, z];
}
/* the pieces in its way: a moved, swapped or added piece against the others in the room it now stands in (not chairs and rugs) */
const HCSKIP = new Set(["decor", "finish", "light", "switch", "socket", "fitting", "window", "door"]), hcSoft = k => /chairs?$|stools?$|rug$/.test(k) || /^(chair|rug)$/.test((HCAT[(HIT(k) || {}).add] || {}).k);   // N217: by its id or what was added
function clashes(id) {
  const it = HIT(id); if (!it || pieceNow(id).removed || hcSoft(id) || (!it.add && !pieceDelta(id).some(Boolean))) return [];
  const b = pieceBox(id), over = (p, q) => [0, 1, 2].every(j => p[j] < q[j + 3] - 1 && p[j + 3] > q[j] + 1);
  return Object.keys(R.HOUSE3.items).filter(k => { const o = HIT(k); return k !== id && o.r === it.r && !HCSKIP.has(o.k) && !hcSoft(k) && !pieceNow(k).removed && (!o.on || riderBox(k) === undefined)
    && !(!it.add && !o.add && over(it.b, o.b)) && over(b, pieceBox(k)); }).map(k => { const c = pieceNow(k).swap; return c ? HCAT[c].n : HIT(k).n; });
}
/* N5: a plant in any room (Look's floor card, the room's row [23]): in the free corner farthest from its doors, clear of the furniture,
   slopes and door swings; a piece like any other */
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
/* N212: the storage ideas (R.HOUSE3.storage, house/storage_ideas.py): options to look at, shown a room at a time from its floor card
   (More), kept as their ids in S.fin[room][28]; each piece an added piece of the house (drawn, tapped), built only once it's shown */
const IDEAS = () => (R.HOUSE3 && R.HOUSE3.storage) || [];
const ideasIn = room => IDEAS().filter(i => i.room === room);
const ideaOn = room => String(finGet(room, 28) || "").split(",").filter(Boolean);
const IDEA_AT = {};
function syncIdeas() {
  const H3 = R.HOUSE3, want = {};
  for (const i of IDEAS()) if ((H3.rooms || {})[i.room] && ideaOn(i.room).includes(i.id)) i.parts.forEach((p, j) => { if (HCAT[p.cat]) want[`idea.${i.id}.${j}`] = [i, p]; });
  for (const id of Object.keys(IDEA_AT)) if (!want[id]) { delete H3.items[id]; delete IDEA_AT[id]; }
  for (const [id, [i, p]] of Object.entries(want)) { if (IDEA_AT[id]) continue;
    const r = H3.rooms[i.room], a = p.ax === "z" ? 2 : 0, b = p.b.slice(); IDEA_AT[id] = 1; ADDFK[id] = HCFK[String(r[4])];
    H3.items[id] = { n: i.n, k: "furniture", r: i.room, ax: p.ax, flip: p.flip, b, s: [b[a + 3] - b[a], b[4] - b[1], Math.round((b[1] - r[4]) * 10) / 10], g: false,
      al: Math.round((b[a] - r[a]) * 10) / 10, op: null, add: p.cat, look: i.room, idea: i.id, fk: ADDFK[id] };
  }
}
function ideaSet(room, id) {   // one idea on or off; "*" all of the room's, "" none
  finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {}, all = ideasIn(room).map(i => i.id), now = ideaOn(room);
  const L = id === "*" ? all : !id ? [] : now.includes(id) ? now.filter(q => q !== id) : [...now, id], one = IDEAS().find(i => i.id === id);
  if (L.length) o[28] = all.filter(q => L.includes(q)).join(","); else delete o[28]; if (!Object.keys(o).length) delete S.fin[room];
  store.set(KEY, S); storeEdits(); finSchDraw();
  toast(one ? `${one.n}: ${L.includes(id) ? "shown (an idea to look at)" : "hidden"}` : `${roomName(room)}: ${L.length ? "its storage ideas shown" : "no storage ideas"}`);
}
const ideaTray = room => { const L = ideasIn(room), on = ideaOn(room); if (!L.length) return "";
  return `<span class="r3d-finlab">Storage ideas (to look at)</span><div class="r3d-finsc" role="group" aria-label="Storage ideas">`
    + L.map(i => `<button type="button" data-finidea="${i.id}" aria-pressed="${on.includes(i.id)}">${i.n}</button>`).join("")
    + (L.length > 1 ? `<button type="button" data-finidea="${on.length === L.length ? "" : "*"}" aria-pressed="false">${on.length === L.length ? "None" : "All"}</button>` : "") + `</div>`; };
function ideaCard(k) {   // a tapped idea's piece: its one line, hide it
  const it = HIT(k), I = it && IDEAS().find(i => i.id === it.idea); if (!I) return null;
  return [I.n + " (an idea)", I.line, [btn("Hide it", { hidea: `${it.look}:${I.id}` }), btn("This room's ideas", { actopen: `fin:${it.look}:5` })]];
}
