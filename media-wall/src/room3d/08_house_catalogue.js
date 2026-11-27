/* V2.46 (N7): swap a piece for another of its kind, or add one, in any room; built from the house's own boxes so it's drawn, tapped,
   moved and turned as the house's are. Rows are Measure's "edits": {item, field: "swap", value: key}; {item: "add.<n>", field: "add",
   value: key, room, x, z, y}. A piece's own frame: u along its wall (0..W), v up (0..H), t out from its back (0..D). */
const HCAT_KINDS = { bed: "Beds", wardrobe: "Wardrobes", chest: "Chests", bedside: "Bedsides", desk: "Desks", shelves: "Shelves", seat: "Seats", chair: "Desk chairs",
  table: "Tables", unit: "Units", shoes: "Shoe storage", stool: "Bar stools", dchair: "Dining chairs", trolley: "Trolleys", lamp: "Lamps", rug: "Rugs", plant: "Plants", more: "More" };   // N219: tables, units (TV, sideboards) and lamps their own; N230: shoe storage, bar stools
Object.defineProperties(HCAT_KINDS, { toilet: { value: "Toilets" }, basin: { value: "Basins" }, gtable: { value: "Garden tables" }, gchair: { value: "Garden chairs" }, gsofa: { value: "Garden seats" } });   // N280: the garden's, only in its Ideas
const H3R = id => R.HOUSE3 && ((R.HOUSE3.rooms || {})[id] || (R.HOUSE3.yard || {})[id]);   // N280: a room, or the garden (Ideas' place outside)   // N225: the WC's and bathroom's suite: swapped, never added (not enumerable: no chips)
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
/* the bed frames (N219: in any material): upholstered (a headboard, a base), wooden (posts, a slatted headboard, rails), metal (bars) */
const hcBedUph = (hm, bm, leg = "black") => (W, H, D, B, L, v) => { B(hm, 0, 30, 0, W, H, 9); for (const u of [12, W - 16]) B(leg, u, 0, 3, u + 4, 30, 6);
  B(bm, 1, 3, 10, W - 1, v, D); for (const [u, t] of [[6, 14], [W - 9, 14], [6, D - 6], [W - 9, D - 6]]) B(leg, u, 0, t, u + 3, 3, t + 3); };
const hcBedWood = (m, slat = "pine") => (W, H, D, B, L, v) => {
  for (const u of [0, W - 7]) { B(m, u, 0, 0, u + 7, H, 7); B(m, u, 0, D - 7, u + 7, 45, D); }
  for (let u = 12; u < W - 14; u += 14) B(m, u, v + 20, 2, u + 8, H - 12, 5);
  B(m, 7, H - 12, 1, W - 7, H - 4, 6); B(m, 7, v - 14, 0, W - 7, v + 20, 4);
  B(m, 0, 14, 7, 5, v, D - 7); B(m, W - 5, 14, 7, W, v, D - 7); B(m, 7, 14, D - 5, W - 7, 40, D);
  B(slat, 5, v - 2, 7, W - 5, v, D - 5); };
const hcBedMetal = m => (W, H, D, B, L, v) => {
  for (const u of [0, W - 3]) { B(m, u, 0, 0, u + 3, H, 3); B(m, u, 0, D - 3, u + 3, 38, D); }
  for (const vv of [v + 12, H - 3]) B(m, 3, vv, 0.5, W - 3, vv + 3, 2.5);
  for (let u = 14; u < W - 12; u += 12) B(m, u, v + 15, 1, u + 1.6, H - 3, 2.2);
  for (let vv = v + 26; vv < H - 8; vv += 12) B(m, 3, vv, 0.8, W - 3, vv + 1.6, 2.4);   // its net: bars both ways
  B(m, 3, 32, D - 2.5, W - 3, 35, D - 0.5); B(m, 0, v - 4, 3, 3, v, D - 3); B(m, W - 3, v - 4, 3, W, v, D - 3);
  B("birch", 3, v - 2, 3, W - 3, v, D - 3); };
const hcCubes = m => (W, H, D, B) => { const nu = Math.max(1, Math.round(W / 36)), nv = Math.max(1, Math.round(H / 36)), cu = (W - 3) / nu, cv = (H - 3) / nv;   // cube shelving, boxes and books
  B(m, 0, 0, 0, W, H, 1);
  for (let i = 0; i <= nu; i++) B(m, i * cu, 0, 1, i * cu + 3, H, D);
  for (let j = 0; j <= nv; j++) B(m, 0, j * cv, 1, W, j * cv + 3, D);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = i * cu + 3, v = j * cv + 3;
    if ((i + j) % 2) B("storebox", u + 0.5, v, 3, u + cu - 3.5, v + cv - 3.5, D - 0.5); else if (j) hcBooks(B, u, u + cu - 3, v, cv - 4, D, i + j); } };
const hcLadder = m => (W, H, D, B) => { const n = 5, vv = i => 20 + i * (H - 24) / (n - 1), dd = i => D * (1 - i * 0.18);   // deeper at the foot, leaning to the wall
  for (let i = 0; i < n; i++) { B(m, 3, vv(i), 0, W - 3, vv(i) + 2, dd(i)); for (const u of [0, W - 3]) B(m, u, i ? vv(i) : 0, dd(i + 1) - 3, u + 3, (i < n - 1 ? vv(i + 1) : H - 2) + 2, dd(i)); }
  B("ivy", W / 2 - 8, vv(n - 1) + 2, 4, W / 2 + 8, vv(n - 1) + 12, dd(n - 1) - 2); hcBooks(B, 3, W - 3, vv(1) + 2, 28, dd(1), 2); };
/* V3.02 (N45): each piece a real one's size (fit.SOURCES hcikea, hcbeds, hcplants, hcmore, rugsizes: its "ref"), built to its shape */
const hcLegs = (m, W, D, h, r, i = 3) => (B, L) => { for (const [u, t] of [[i, i], [W - i, i], [i, D - i], [W - i, D - i]]) L(m, u, t, 0, [[0, 0], [r, 0], [r * 0.8, h], [0, h]]); };   // four turned legs, tapering
const HCAT = {
  divan: { n: "Divan bed, upholstered headboard", k: "bed", w: 150, d: 210, h: 137, ref: "hcbeds", src: "Next Divan king, 150 × 200, headboard 137", b: hcBed(hcBedUph("lycksele", "cloth5")) },
  oakbed: { n: "Oak bed, slatted headboard", k: "bed", w: 163, d: 215, h: 110, ref: "hcbeds", src: "The Furniture Market Cheshire oak, 163 × 215 × 110", b: hcBed(hcBedWood("oak")) },
  metalbed: { n: "Black metal bed", k: "bed", w: 156, d: 207, h: 95, ref: "hcikea", src: "IKEA NESTTUN 150 × 200: 156 × 207 × 95", b: hcBed(hcBedMetal("black")) },
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
  ladder: { n: "Ladder shelf, oak", k: "shelves", w: 60, d: 47, h: 187, ref: "hcmore", src: "Cox & Cox leaning oak, 60 × 47 × 187", b: hcLadder("oak") },
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
  dresser: { n: "Dressing table with mirror, white", k: "more", w: 100, d: 50, h: 159, ref: "hcmore2", src: "IKEA HEMNES, 100 × 50, 159 with its mirror",
    b: (W, H, D, B, L) => { hcLegs("door_white", W, D, 71, 2.2, 4)(B, L); B("door_white", 0, 71, 0, W, 74, D);
      B("door_white", 3, 60, 3, W - 3, 71, D - 3); B("door_white", 6, 60.6, D - 3, W - 6, 70.4, D - 2.4); B("knob", W / 2 - 1.5, 64, D - 2.4, W / 2 + 1.5, 67, D - 0.6);   // the drawer under the top
      B("door_white", 12, 74, 2, W - 12, H, 5); B("mirror", 16, 78, 5, W - 16, H - 4, 5.3); } },   // the mirror in its frame, at the back
  tvbench: { n: "TV bench, white and walnut", k: "unit", w: 180, d: 42, h: 38, ref: "hcmore2", src: "IKEA BESTÅ, 180 × 42 × 38",
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
    b: (W, H, D, B, L) => { L("rattan", W / 2, D / 2, 0, [[0, 0], [13, 0], [16, 28], [0, 28]]);
      L("ivy", W / 2, D / 2, 26, [[0, 0], [W * 0.3, 8], [W / 2, (H - 26) * 0.45], [W * 0.44, (H - 26) * 0.7], [W * 0.22, H - 28], [0, H - 26]]); } },
  olive: { n: "Olive tree, grey planter", k: "plant", w: 70, d: 70, h: 150, ref: "hcplants", src: "Olive Grove Oundle, 150 tall, 45 pot",
    b: (W, H, D, B, L) => { L("concrete", W / 2, D / 2, 0, [[0, 0], [20, 0], [22.5, 36], [22.5, 38], [0, 38]]);
      L("timber", W / 2, D / 2, 38, [[0, 0], [2.5, 0], [2, H * 0.4], [0, H * 0.4]]);
      L("ivy", W / 2, D / 2, H * 0.5, [[0, 0], [W * 0.3, H * 0.06], [W / 2, H * 0.22], [W * 0.4, H * 0.38], [W * 0.12, H * 0.49], [0, H * 0.5]]); } },
  rug: { n: "Rug", k: "rug", w: 160, d: 230, h: 1, ref: "rugsizes", src: "Argos's usual size, 160 × 230",
    b: (W, H, D, B) => { B("rug", 0, 0, 0, W, Math.max(0.6, H), D); B("rattan", 4, Math.max(0.6, H), 4, W - 4, Math.max(0.6, H) + 0.2, 8); B("rattan", 4, Math.max(0.6, H), D - 8, W - 4, Math.max(0.6, H) + 0.2, D - 4); } },
  floorlamp: { n: "Floor lamp, linen shade", k: "lamp", w: 45, d: 45, h: 155, ref: "hcmore", src: "Dunelm Marin, 155 tall, 45 shade",
    b: (W, H, D, B, L) => { L("black", W / 2, D / 2, 0, [[0, 0], [13, 0], [13, 2.5], [10, 4], [3, 5], [0, 5]]); L("black", W / 2, D / 2, 5, [[0, 0], [1.4, 0], [1, H - 30], [0, H - 30]]);
      L("shade_lit", W / 2, D / 2, H - 28, [[0, 0], [W / 2 - 0.5, 0], [W / 2 - 0.5, 28], [0, 28]]); } },
  sidetable: { n: "Round side table, oak", k: "table", w: 50, d: 50, h: 56, ref: "hcikea", src: "IKEA LISTERBY, 50 across, 56 high",
    b: (W, H, D, B, L) => { L("oak", W / 2, D / 2, H - 3, [[0, 0], [W / 2, 0], [W / 2, 3], [0, 3]]); hcLegs("oak", W, D, H - 3, 1.8, 11)(B, L);
      for (const [u0, t0, u1, t1] of [[11, 10, W - 11, 12], [11, D - 12, W - 11, D - 10], [10, 11, 12, D - 11], [W - 12, 11, W - 10, D - 11]]) B("oak", u0, H - 9, t0, u1, H - 3, t1); } },
  /* N217: bedroom 2's desk chair and rug swap too (fit.SOURCES hcswap) */
  markus: { n: "Office chair, dark grey", k: "chair", w: 62, d: 60, h: 129, ref: "hcswap", src: "IKEA MARKUS, 62 × 60 × 129–140", b: hcSwivel("cloth5", 46, true) },
  langfjall: { n: "Swivel chair, beige and black", k: "chair", w: 68, d: 68, h: 92, ref: "hcswap", src: "IKEA LÅNGFJÄLL, 68 × 68 × 92", b: hcSwivel("cloth1", 48, false) },
  stoense: { n: "Low-pile rug, off-white", k: "rug", w: 133, d: 195, h: 1.8, ref: "hcswap", src: "IKEA STOENSE, 133 × 195", b: (W, H, D, B) => B("cloth4", 0, 0, 0, W, H, D) },
  lohals: { n: "Flatwoven jute rug", k: "rug", w: 160, d: 230, h: 1.3, ref: "hcswap", src: "IKEA LOHALS, 160 × 230",
    b: (W, H, D, B) => { B("rattan", 0, 0, 0, W, H, D); for (const t of [6, D - 8]) B("knob", 4, H, t, W - 4, H + 0.15, t + 2); } },   // its two woven bands
};
/* N212, N223: the storage ideas' pieces (house/storage_ideas.py, an "idea" kind: never swapped or added from the catalogue), in the house's
   own materials only (no new shader when shown): the artisan oak of the media wall and the office's cubes, its ledges' lip, its tenons */
/* N236: books as the office's shelf has them (house/model.py, office.shelf: its nine widths and heights, a pair lying flat), each with its
   spine: the pages' cream showing over the boards, a band near its head (gilt on the dark ones), a label on some; h the tallest */
const ST_BK = [[3.2, 22], [2.4, 20], [4.1, 24], [2.8, 19], [3.6, 23], [2.2, 21], [3.0, 18], [4.4, 24], [2.6, 22]];
const stBook = (B, c, u, w, v, hh, t0, t1, k) => { const dark = c !== 2 && c !== 5;
  B("book" + c, u, v, t0, u + w, v + hh, t1); B("paper", u + 0.1, v + hh, t0 + 0.3, u + w - 0.1, v + hh + 0.1, t1 - 0.3);
  if (w > 1.2) { B(dark ? "brass" : "book4", u + 0.2, v + hh * 0.86, t1, u + w - 0.2, v + hh * 0.86 + 0.4, t1 + 0.1);
    if (k % 3 === 1) B(dark ? "paper" : "book1", u + 0.3, v + hh * 0.48, t1, u + w - 0.3, v + hh * 0.66, t1 + 0.1); } };
const stBooks = (B, u0, u1, v, h, t0, t1, k = 0) => { const s = Math.min(1, h / 24);
  for (let u = u0; u < u1 - 2; k++) { const [bw, bh] = ST_BK[k % 9], w = Math.round(bw * Math.max(0.7, s) * 10) / 10, hh = bh * s, c = k * 5 % 6;
    if (k % 11 === 10 && u + bh * s + 1 < u1 && t1 - t0 > 10) {   // a pair lying flat, the longer under
      B("book2", u + 0.5, v, t0 + 1, u + 0.5 + bh * s, v + 3.4, t1 - 0.5); B("book0", u + 1.2, v + 3.4, t0 + 1.5, u + bh * s - 0.2, v + 6.2, t1 - 1); u += bh * s + 1.5; continue; }
    if (u + w > u1) break; stBook(B, c, u, w, v, hh, t0, t1, k); u += w + 0.1; } };
/* N236: the living room's record set (render.now_playing's three sleeves, the vinyl stand's four) in the house's own colours: a sleeve's
   ground, then its art as [material, across from, to, down from the top, to] */
const ST_SLEEVES = [["paper", ["quarry", 0.12, 0.88, 0.12, 0.62], ["book4", 0.38, 0.62, 0.7, 0.9]], ["book1", ["jar", 0, 1, 0.78, 1], ["book2", 0.2, 0.8, 0.2, 0.66]],
  ["book3", ["pink", 0.1, 0.5, 0.1, 0.9], ["book2", 0.55, 0.9, 0.1, 0.9]], ["paper", ["book1", 0.15, 0.85, 0.15, 0.7]], ["quarry", ["jar", 0.1, 0.9, 0.62, 0.9]],
  ["book4", ["book2", 0.3, 0.7, 0.3, 0.7]], ["book3", ["paper", 0.1, 0.9, 0.1, 0.45]]];
const stSleeve = (B, n, u, v, t, S = 31.4) => { const [g, ...art] = ST_SLEEVES[n % ST_SLEEVES.length]; B(g, u, v, t, u + S, v + S, t + 0.6);
  for (const [m, a0, a1, d0, d1] of art) B(m, u + a0 * S, v + S * (1 - d1), t + 0.6, u + a1 * S, v + S * (1 - d0), t + 0.8); };
const stLPs = (B, u0, u1, v, t0, k = 0) => { for (let u = u0; u < u1 - 1; k++) { const w = 2.5 + (k * 37 % 4);   // LPs on edge, in runs of sleeves, a gap to flip
  B("book" + (k * 5 % 6), u, v, t0, Math.min(u1, u + w), v + 31.4 - (k % 3) * 0.3, t0 + 31.4); u += w + (k % 4 === 3 ? 2.5 : 0.1); } };
const ST = "artisan", stLip = (B, W, D, v) => { B(ST, 0, v, 0, W, v + 1.8, D); B(ST, 0, v + 1.8, D - 1.5, W, v + 3.6, D); };   // a ledge with its lip (the media wall's record ledge)
const stTen = (B, u, D, sh) => { B(ST, u, 0, 0, u + 2.4, sh, 2.4); B(ST, u, sh - 4, 2.4, u + 2.4, sh, D - 3);   // a bracket: its leg on the wall, its arm under the shelf,
  for (let i = 1; i < 4; i++) B(ST, u, sh - 4 - i, 2.4, u + 2.4, sh - 4 - i + 1, 2.4 + (4 - i) * 2.2);   // a stepped brace,
  B("oak", u, sh + 1.8, D - 9, u + 2.4, sh + 1.86, D - 4); B("gap", u + 1.1, sh + 1.86, D - 8.6, u + 1.3, sh + 1.92, D - 4.4); };   // its tenon through the shelf, wedged flush
Object.assign(HCAT, {
  st_lpcab: { n: "Record cabinet", k: "idea", w: 110, d: 36, h: 80, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",
    b: (W, H, D, B) => { const T = 1.8, bw = (W - 4 * T) / 3, rows = [8.8, 44.1];   // two rows of three bays, 34 high, a face frame
      B(ST, 2, 0, 3, W - 2, 7, D - 4); B(ST, 0, 7, 0, T, H, D - 2); B(ST, W - T, 7, 0, W, H, D - 2); B("birch", T, 7, 0, W - T, H - T, 0.6);
      B(ST, 0, H - T, 0, W, H, D); B(ST, T, 7, 0.6, W - T, 8.8, D - 2); B(ST, T, 42.3, 0.6, W - T, 44.1, D - 2);
      for (let i = 1; i < 3; i++) { const u = T + i * bw + (i - 1) * T; B(ST, u, 8.8, 0.6, u + T, H - T, D - 2); B(ST, u - 0.7, 7, D - 2, u + T + 0.7, H - T, D); }
      for (const u of [0, W - 3.5]) B(ST, u, 7, D - 2, u + 3.5, H - T, D);
      for (const [v0, v1] of [[7, 9.5], [41.6, 44.8], [H - 3.6, H - T]]) B(ST, 0, v0, D - 2, W, v1, D);
      rows.forEach((v, j) => { for (let i = 0; i < 3; i++) { const u = T + i * (bw + T);
        if (j === 1 && i === 2) { B(ST, u + 0.3, v + 0.8, D - 2, u + bw - 0.3, v + 33, D - 0.4); B("oak", u + 2, v + 14, D - 0.4, u + 3.4, v + 20, D); continue; }   // the deck's kit, shut
        stLPs(B, u + 0.4, u + bw - 0.4, v + 0.8, 1, i * 11 + j * 5); } }); } },
  st_faceout: { n: "Face-out record ledge", k: "idea", w: 110, d: 9, h: 34, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",
    b: (W, H, D, B, L, k = 0) => { stLip(B, W, D, 0); const g = (W - 3 * 31.4) / 4;   // N236: each ledge its own three of the record set (k: where it hangs)
      for (let i = 0; i < 3; i++) stSleeve(B, k * 3 + i * 2, g + i * (31.4 + g), 1.8, 1.6); } },
  st_oakpeg: { n: "Oak pegboard", k: "idea", w: 56, d: 10, h: 56, ref: "snowdonoak", src: "Made to the spot, 18 mm oak, oak pegs",
    b: (W, H, D, B) => { B(ST, 0, 0, 0, W, H, 1.8);
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) B("gap", 4.5 + i * 7.8 - 0.6, 4.5 + j * 7.8 - 0.6, 1.8, 4.5 + i * 7.8 + 0.6, 4.5 + j * 7.8 + 0.6, 1.88);
      for (const [i, j] of [[1, 5], [2, 5], [3, 5], [5, 6], [6, 6], [1, 1], [5, 1]]) { const u = 4.5 + i * 7.8, v = 4.5 + j * 7.8; B("oak", u - 0.8, v - 0.8, 1.8, u + 0.8, v + 0.8, 7); B("oak", u - 1.1, v - 1.1, 6.4, u + 1.1, v + 1.1, 7.2); }
      B(ST, 2.5, 11.2, 1.8, 46, 13, D); B(ST, 2.5, 13, D - 1.2, 46, 14.5, D);   // a small shelf, lipped: a pedal, a box of picks
      B("pink", 6, 13, 3, 14, 17, 8.5); B("storebox", 18, 13, 2.5, 30, 19, 8.5);
      for (const i of [1, 2, 3]) B("black", 4.5 + i * 7.8 - 0.4, 22, 4, 4.5 + i * 7.8 + 0.4, 43.5, 5);   // leads hung on their pegs
      B("black", 39, 32, 3, 49, 50.5, 7.5); } },   // the headphones
  st_ledge: { n: "Oak ledge", k: "idea", w: 120, d: 9, h: 26, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",
    b: (W, H, D, B, L) => { stLip(B, W, D, 0);
      for (let u = 3, k = 0; ; k++) { const fw = 10 + (k * 7 % 3) * 4, fh = Math.min(H - 3, 13 + (k * 5 % 3) * 6); if (u + fw > W - 2) break;
        if (k === 2 && W > 60) { L("pot", u + 5, 4.5, 1.8, [[0, 0], [4, 0], [4.5, 9], [0, 9]]); B("ivy", u + 1.5, 10.8, 2, u + 8.5, 17, 7); u += 13; continue; }   // a plant
        B(k % 2 ? ST : "black", u, 1.8, 1, u + fw, 1.8 + fh, 2.8); B("paper", u + 1.5, 3.3, 2.8, u + fw - 1.5, 0.3 + fh, 3); u += fw + 3; } } },
  st_tenshelf: { n: "Oak shelf on tenoned brackets", k: "idea", w: 80, d: 20, h: 26, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",
    b: (W, H, D, B) => { const sh = 6; B(ST, 0, sh, 0, W, sh + 1.8, D); for (const u of [7, W - 9.4]) stTen(B, u, D, sh);
      if (W < 85) stBooks(B, 1, W - 1, sh + 1.8, Math.min(19, H - sh - 3) / 0.95, 1, D - 2, W);   // paperbacks and game cases
      else for (const u of [4, 47]) { B("storebox", u, sh + 1.8, 1.5, u + 37, sh + 15, D - 2); B("birch", u - 0.3, sh + 15, 1.2, u + 37.3, sh + 15.8, D - 1.7); } } },   // lidded boxes
  st_drawers: { n: "Oak drawers on castors", k: "idea", w: 28, d: 43, h: 69, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",
    b: (W, H, D, B) => { for (const [u, t] of [[2, 3], [W - 6, 3], [2, D - 7], [W - 6, D - 7]]) B("black", u, 0, t, u + 4, 6, t + 4);
      B(ST, 0, 6, 0, W, H, D - 2); B("gap", 1.6, 7.6, D - 2.05, W - 1.6, H - 1.6, D - 2); const rh = (H - 9.2) / 6;
      for (let i = 0; i < 6; i++) { const v = 7.6 + i * rh; B(ST, 1.6, v + 0.3, D - 2, W - 1.6, v + rh - 0.3, D - 0.6); B("oak", W / 2 - 2, v + rh * 0.62 - 0.8, D - 0.6, W / 2 + 2, v + rh * 0.62 + 0.8, D); } } },
  st_glass: { n: "Lit glass case", k: "idea", w: 55, d: 12, h: 80, ref: "glasscut", src: "Made to the spot, oak and toughened glass",
    b: (W, H, D, B) => { const T = 2; B(ST, 0, 0, 0, T, H, D); B(ST, W - T, 0, 0, W, H, D); B(ST, T, 0, 0, W - T, T, D); B(ST, T, H - T, 0, W - T, H, D); B(ST, T, T, 0, W - T, H - T, 0.6);
      B("led", 6, H - T - 0.4, 3, W - 6, H - T, 5); const g = (H - 2 * T) / 3;   // its light under the top, two glass shelves
      for (let i = 1; i < 3; i++) B("glass", T, T + i * g, 0.6, W - T, T + i * g + 0.6, D - 1.4);
      for (let i = 0; i < 3; i++) { const v = T + i * g + (i ? 0.6 : 0);   // the knick-knacks
        B("brass", 6 + i * 4, v, 3, 12 + i * 4, v + 12 - i * 2, 9); B("pot", 22, v, 2.5, 32, v + 8, 9); B(i === 1 ? "book2" : "black", 37, v, 3, 46 - i * 2, v + 18 - i * 3, 5); }
      B("glass", T, T, D - 0.9, W - T, H - T, D - 0.5); } },
  st_pegshelf: { n: "Peg rail and hat shelf", k: "idea", w: 79, d: 22, h: 30, ref: "pegrail", src: "Willow & Stone oak backplate and pegs; an oak shelf",
    b: (W, H, D, B) => { const sh = 20; B(ST, 0, 0, 0, W, 7, 2); B(ST, 0, sh, 0, W, sh + 1.8, D);
      for (let i = 0; i < 5; i++) { const u = W * (i + 0.5) / 5; B("oak", u - 1, 2.5, 2, u + 1, 4.5, 8.4); B("oak", u - 1.3, 2.2, 8.4, u + 1.3, 4.8, 9.2); }   // five Shaker pegs
      for (const u of [3, W - 5.4]) { B(ST, u, 7, 0, u + 2.4, sh, 2.4); B(ST, u, sh - 4, 2.4, u + 2.4, sh, D - 4); B("oak", u, sh + 1.8, D - 9, u + 2.4, sh + 1.86, D - 5); }   // tenoned through the shelf
      B("cloth3", 10, sh + 1.8, 5, 25, sh + 7.5, 17); B("black", 30, sh + 1.8, 7, 42, sh + 3, 16); B("rattan", 52, sh + 1.8, 3, 72, sh + 8, 19); } },   // a hat, gloves, a basket
  st_airer: { n: "Ceiling pulley airer", k: "idea", w: 90, d: 35, h: 16, ref: "pulleyairer", src: "Clothesmaid ceiling airer, 0.9 m",   // N241: hoisted; cast-iron ends, four pine laths, the ropes to the pulleys
    b: (W, H, D, B) => { for (const u of [3, W - 4.2]) { B("black", u, 0, 2, u + 1.2, 1.6, D - 2); B("black", u, 0, 2, u + 1.2, 9, 3.6); B("black", u, 0, D - 3.6, u + 1.2, 9, D - 2); B("black", u, 7.4, 2, u + 1.2, 9, D - 2); }
      for (const t of [6.5, 13.8, 21.1, 28.4]) B("pine", 0, 1.6, t - 1, W, 3.4, t + 1);
      for (const u of [3.6, W - 3.6]) { B("steel_dark", u - 0.3, 9, D / 2 - 0.3, u + 0.3, H - 2, D / 2 + 0.3); B("black", u - 2, H - 2, D / 2 - 3, u + 2, H, D / 2 + 3); }
      B("cloth4", 18, 3.4, 5, 42, 4.4, 16); B("cloth0", 50, 3.4, 13, 70, 4.2, 30); } },   // a towel and a shirt drying over the laths
  st_books: { n: "Oak book tower", k: "idea", w: 50, d: 30, h: 200, ref: "snowdonoak", src: "Made to the spot, 18 mm oak",   // N241: sides, a back, six shelves of books
    b: (W, H, D, B) => { B(ST, 0, 0, 0, 1.8, H, D); B(ST, W - 1.8, 0, 0, W, H, D); B(ST, 1.8, 0, 0, W - 1.8, H, 1.2); B(ST, 1.8, H - 1.8, 1.2, W - 1.8, H, D);
      const n = 6, g = (H - 8) / n; B(ST, 1.8, 0, D - 2, W - 1.8, 8, D);
      for (let i = 0; i < n; i++) { const v = 8 + i * g; B(ST, 1.8, v, 1.2, W - 1.8, v + 1.8, D); stBooks(B, 2.5, W - 2.5, v + 1.8, Math.min(26, g - 5) / 0.95, 1.5, D - 2, W * (i + 3)); } } },
  st_float: { n: "Oak floating shelf", k: "idea", w: 90, d: 23, h: 22, ref: "floatshelf", src: "B&Q oak floating shelf 90 × 23",
    b: (W, H, D, B) => { const t = 3.8, h = H - t - 1; B("oak", 0, 0, 0, W, t, D);
      stBooks(B, 2, W * 0.4, t, Math.min(h, 22) / 0.95, 2, D - 3); B("storebox", W * 0.45, t, 2, W * 0.45 + 24, t + Math.min(16, h), D - 2);
      B("jar", W * 0.78, t, D / 2 - 4, W * 0.78 + 8, t + Math.min(12, h), D / 2 + 4); } },
  st_store: { n: "Ply shelves, oak lips", k: "idea", w: 89, d: 30, h: 179, ref: "wickesply", src: "Made to the spot, 12 mm ply, oak lips",
    b: (W, H, D, B) => { const P = 1.2; B("birch", 0, 0, 0, P, H, D); B("birch", W - P, 0, 0, W, H, D); const vs = [3, 42, 81, 120, H - P];
      vs.forEach((v, i) => { B("birch", P, v, 0, W - P, v + P, D - 1.5); B(ST, P, v + P - 4, D - 1.5, W - P, v + P, D);   // each shelf's oak lip, 15 mm
        if (i < vs.length - 1) for (const u of [4, 48]) { const top = v + P + Math.min(15, vs[i + 1] - v - 6);
          B("storebox", u, v + P, 2, u + 35, top - 0.8, 28); B("birch", u - 0.2, top - 0.8, 1.8, u + 35.2, top, 28.2); } }); } },   // KUGGIS boxes, their lids
});
/* N289: made to fit where the shops fall short (house/bespoke.py: each at its place's size, costed, fit.SOURCES madefit), in the artisan oak;
   options to look at. mf_slope's top follows the roof from lo (its u = 0 end) up to H (its u = W end) */
Object.assign(HCAT, {
  mf_slope: { n: "Under-slope cupboard", k: "idea", w: 55, d: 45, h: 177, ref: "madefit", src: "Made to fit, 18 mm oak, its top the roof's",
    b: (W, H, D, B, L, lo = H * 0.64) => { const n = 6, sw = W / n, hu = i => lo + (H - lo) * (i + 0.5) / n;   // stepped strips under the slope
      B(ST, 1, 0, 3, W - 1, 6, D - 4); for (let i = 0; i < n; i++) { const u = i * sw, h = hu(i);
        B(ST, u, 6, 0, u + sw, h, D - 2); B(ST, u + (i % 3 ? 0 : 0.3), 6.3, D - 2, u + sw - (i === 2 || i === 5 ? 0.3 : 0), h - 0.3, D - 0.4); }
      B("gap", W / 2 - 0.15, 6.3, D - 0.45, W / 2 + 0.15, hu(2) - 1, D - 0.35);   // the doors' meeting line, a knob each side
      for (const u of [W / 2 - 4, W / 2 + 2.4]) B("knob", u, 50, D - 0.4, u + 1.6, 53, D); } },
  mf_pullout: { n: "Under-stairs pull-outs", k: "idea", w: 89, d: 30, h: 179, ref: "madefit", src: "Made to fit, ply towers, oak fronts, on runners",
    b: (W, H, D, B) => { const tw = W / 2; B("birch", 0, 0, 0, W, H, D - 2);
      for (let i = 0; i < 2; i++) { const u0 = i * tw + 0.3, u1 = (i + 1) * tw - 0.3; B(ST, u0, 0.5, D - 2, u1, H - 0.3, D);
        B("handle_black", i ? u0 + 3 : u1 - 4.5, H * 0.45, D, i ? u0 + 4.5 : u1 - 3, H * 0.45 + 30, D + 1.5); } } },
  mf_bench: { n: "Hall bench, shoes under", k: "idea", w: 80, d: 35, h: 45, ref: "madefit", src: "Made to fit, 18 mm oak",
    b: (W, H, D, B) => { const p = ["shoe_black", "shoe_tan", "shoe_white", "shoe_grey"]; B(ST, 0, H - 3, 0, W, H, D);
      for (const u of [0, W - 1.8]) B(ST, u, 0, 0, u + 1.8, H - 3, D); B(ST, 1.8, 2, 0, W - 1.8, 3.8, D); B(ST, 1.8, 20, 0, W - 1.8, 21.8, D - 1);
      for (const v of [3.8, 21.8]) for (let u = 4, k = 0; u + 9 < W - 2; u += 12, k++) B(p[(k + v) % 4 | 0], u, v, 4, u + 9, v + 9, D - 3); } },   // two shelves of shoes
  mf_alcove: { n: "Alcove shelves over a cupboard", k: "idea", w: 80, d: 40, h: 200, ref: "madefit", src: "Made to fit, 18 mm oak",
    b: (W, H, D, B) => { const T = 1.8, ch = 80, sd = 25; B(ST, 1, 0, 3, W - 1, 6, D - 4); B(ST, 0, 6, 0, W, ch, D - 2); B(ST, 0, ch, 0, W, ch + 2.5, D);
      for (const [a, b] of [[0.3, W / 2 - 0.15], [W / 2 + 0.15, W - 0.3]]) B(ST, a, 6.3, D - 2, b, ch - 0.3, D - 0.4);
      for (const u of [W / 2 - 4, W / 2 + 2.4]) B("knob", u, ch - 14, D - 0.4, u + 1.6, ch - 11, D);
      for (const u of [0, W - T]) B(ST, u, ch + 2.5, 0, u + T, H, sd); B("birch", T, ch + 2.5, 0, W - T, H, 0.6); const n = Math.max(2, Math.round((H - ch) / 32)), g = (H - ch - 2.5) / n;
      for (let i = 1; i <= n; i++) B(ST, T, ch + 2.5 + i * g - T, 0.6, W - T, ch + 2.5 + i * g, sd);
      for (let i = 0; i < n - 1; i++) stBooks(B, T + 1, W - T - 1, ch + 2.5 + i * g + (i ? 0 : 0), Math.min(24, g - 6) / 0.95, 1, sd - 2, W * (i + 2)); } },
  mf_wallcab: { n: "Shallow oak wall cabinet", k: "idea", w: 50, d: 15, h: 60, ref: "madefit", src: "Made to fit, 18 mm oak",
    b: (W, H, D, B) => { B(ST, 0, 0, 0, W, H, D - 2); B("gap", 0.3, 0.3, D - 2.05, W - 0.3, H - 0.3, D - 2); B(ST, 0.4, 0.4, D - 2, W - 0.4, H - 0.4, D - 0.4);
      B("knob", 3, H / 2 - 1.5, D - 0.4, 4.6, H / 2 + 1.5, D); } },
  mf_sidetable: { n: "Slim oak side table", k: "idea", w: 42, d: 28, h: 60, ref: "madefit", src: "Made to fit, 18 mm oak",
    b: (W, H, D, B) => { B(ST, 0, H - 2, 0, W, H, D); B(ST, 2.5, H * 0.35, 2.5, W - 2.5, H * 0.35 + 1.8, D - 2.5);
      for (const [u, t] of [[1, 1], [W - 4, 1], [1, D - 4], [W - 4, D - 4]]) B(ST, u, 0, t, u + 3, H - 2, t + 3);
      stBooks(B, 4, W * 0.55, H * 0.35 + 1.8, 14, 4, D - 4, 3); } },
  mf_lamp: { n: "Slim oak floor lamp", k: "idea", w: 30, d: 30, h: 150, ref: "madefit", src: "Made to fit, oak stem, linen shade",
    b: (W, H, D, B, L) => { const r = W / 2 - 1, c = W / 2; B(ST, c - 11, 0, c - 11, c + 11, 3, c + 11); B(ST, c - 1.5, 3, c - 1.5, c + 1.5, H - 26, c + 1.5);
      L("shade_lit", c, c, H - 28, [[0, 0], [r, 0], [r, 28], [0, 28]]); } },
});
/* N219: real pieces from four shops (R.SHOP, from house/data/N219_catalogue.json by export3d.shop_row; each its own fit.SOURCES row by its key)
   and her own (a size, a look, one of the house's materials, a name), drawn by the same builders at their own size. Built only when one is
   swapped in or added, from materials the house already has: no new shader at the first picture. Options to look at: nothing to buy */
const hcUp = (B, dv) => (m, a, b, c, d, e, f) => B(m, a, b + dv, c, d, e + dv, f);   // a builder's boxes raised dv (a case on its legs)
const hcMake = (k, look, m, m2, c) => {
  const gk = { gtable: "table", gchair: "dchair", gsofa: "seat" }[k]; if (gk) return hcMake(gk, look, m, m2, c);   // N280
  const grip = m === "door_white" ? "grip" : "knob", cane = "rattan", legm = m2 === m && /^(door_white|pnt_\w+)$/.test(m) ? "black" : m2;
  if (k === "bed") return hcBed(look === "metal" ? hcBedMetal(m) : look === "uph" ? hcBedUph(m2.startsWith("cloth") ? m2 : m.startsWith("cloth") ? m : "lycksele", m)
    : look === "panel" ? hcBedPanel(m) : look === "legged" ? hcBedLegged(m, m2) : look === "rattan" ? hcBedRattan(m, cane) : hcBedWood(m, m === m2 ? "pine" : m2));
  if (k === "wardrobe") return (W, H, D, B) => { const n = c || Math.max(2, Math.round(W / 50)), dw = (W - 0.6) / n, dr = look === "drawers" ? 2 : 0, v0 = 8 + dr * 19;
    B(m, 0, 0, 0, W, H, D - 2); B("gap", 0.3, 8, D - 2.05, W - 0.3, H - 0.3, D - 2); B(m, 1, 0, D - 6, W - 1, 8, D - 5);
    for (let j = 0; j < dr; j++) { const v = 8 + j * 19; B(m, 0.45, v + 0.3, D - 2, W - 0.45, v + 18.7, D - 0.4); B(grip === "grip" ? "handle_black" : "knob", W / 2 - 6, v + 12, D - 0.4, W / 2 + 6, v + 13.2, D); }   // its drawers under the doors
    for (let i = 0; i < n; i++) { const u0 = 0.3 + i * dw, u = i % 2 ? u0 + 3 : u0 + dw - 5; B(m, u0 + 0.15, v0 + 0.3, D - 2, u0 + dw - 0.15, H - 0.3, D - 0.4); B("handle_black", u, H * 0.45, D - 0.4, u + 1.5, H * 0.45 + 32, D); } };
  if (k === "chest" || k === "bedside") return (W, H, D, B, L) => { const cols = k === "chest" && (W >= 110 || c > 6) ? 2 : 1;
    if (look === "rattan") return hcCaneCase(m === "rattan" ? "birch" : m, cane, k === "chest" && W > 70 ? 2 : 1)(W, H, D, B, L);
    const lg = look === "legged" ? 14 : 0; if (lg) hcLegs(legm, W, D, lg, 1.8, 4)(B, L);
    hcChest(m, cols, Math.max(1, Math.min(6, Math.ceil((c || (k === "bedside" ? (H > 50 ? 2 : 1) : Math.round((H - 8) / 22))) / cols))), grip)(W, H - lg, D, lg ? hcUp(B, lg) : B);
    if (look === "groove") for (let u = 3; u < W - 2; u += 2.5) B("gap", u, 7, D - 0.5, u + 0.3, H - 1.5, D - 0.3); };   // its grooved fronts
  if (k === "shelves") return look === "cubes" ? hcCubes(m) : look === "ladder" ? hcLadder(m) : look === "glass" ? hcCabinet(m, c) : hcShelves(m, hcBooks);
  if (k === "desk" || k === "table") return (W, H, D, B, L) => { const t = k === "desk" ? 3 : H < 55 ? 4 : 3.5, r = Math.min(W, D) / 2;
    if (look === "rattan") { L(m, W / 2, D / 2, 0, [[0, 0], [r - 1, 0], [r - 1, H - t], [0, H - t]]); L(m, W / 2, D / 2, H - t, [[0, 0], [r, 0], [r, t], [0, t]]); return; }   // a woven drum
    if (look === "round" || look === "legs") { L(m, W / 2, D / 2, H - t, [[0, 0], [W / 2, 0], [W / 2, t], [0, t]]);
      if (look === "legs") { hcLegs(m2, W, D, H - t, 2.2, r * 0.42)(B, L); return; }   // a round top on four legs
      L(m2, W / 2, D / 2, 0, [[0, 0], [r * 0.44, 0], [r * 0.44, 2], [5, 7], [4, H - t], [0, H - t]]); return; }   // a round top on its pedestal
    B(m, 0, H - t, 0, W, H, D); if (k === "desk") B(m, 3, H - t - 8, 3, W - 3, H - t, 5);   // a desk's modesty rail
    if (look === "hairpin") { for (const u of [3, W - 4]) for (const tt of [3, D - 4]) for (const q of [0, 4.5]) B(m2, u, 0, tt + (tt < D / 2 ? q : -q), u + 1, H - t, tt + (tt < D / 2 ? q : -q) + 1); return; }   // hairpin legs, two rods a corner
    if (look === "metal") { for (const u of [4, W - 9]) { B(m2, u, 0, 4, u + 5, 3, D - 4); B(m2, u, 3, D / 2 - 3, u + 5, H - t - 3, D / 2 + 3); B(m2, u, H - t - 3, 4, u + 5, H - t, D - 4); }
      B(m2, 9, H - t - 6, D / 2 - 2, W - 9, H - t - 3, D / 2 + 2); return; }   // a sit-stand frame: a T at each end, a beam between
    hcLegs(m2, W, D, H - t, H < 55 ? 2.4 : 2.2, 4)(B, L); };
  if (k === "seat") return look === "sofa" ? hcSofa(m, m2) : look === "wing" ? hcWing(m, m2) : look === "frame" ? hcFrameChair(m, m2) : look === "rattan" ? hcCaneChair(m, cane)
    : look === "low" ? hcScoop(m, legm) : hcArmchair(m, m2);
  if (k === "chair") return hcSwivel(m, 46, true);
  if (k === "stool") return hcStool(look, m, m2);
  if (k === "dchair") return hcDchair(look, m, m2);   // N279
  if (k === "trolley") return hcTrolley(look, m, m2);
  if (k === "toilet") return hcToilet(look, m, m2);
  if (k === "basin") return hcBasin(look, m, m2);
  if (k === "rug") return (W, H, D, B, L) => look === "round" ? L(m, W / 2, D / 2, 0, [[0, 0], [W / 2, 0], [W / 2, H], [0, H]]) : B(m, 0, 0, 0, W, H, D);
  if (k === "lamp") return (W, H, D, B, L) => { const r = Math.min(W, D) / 2 - 0.5, sh = m === "rattan" ? "rattan" : /^cloth/.test(m2) ? m2 : "shade_lit";   // N278: linen or cloth in its weave
    if (look === "tripod") { const ap = H - 34, r0 = r - 1.5, rs = Math.min(19, r);   // three legs splayed from under the shade, each in eight steps
      for (let j = 0; j < 3; j++) { const a = j * 2.094 + 0.5; for (let q = 0; q < 8; q++) { const rr = r0 * (1 - (q + 0.5) / 8), cu = W / 2 + Math.cos(a) * rr, ct = D / 2 + Math.sin(a) * rr;
        B(m, cu - 1, ap * q / 8, ct - 1, cu + 1, ap * (q + 1) / 8, ct + 1); } }
      L(m2 === m || /^cloth/.test(m2) ? sh : m2, W / 2, D / 2, H - 34, [[0, 0], [rs, 0], [rs * 0.85, 30], [0, 30]]); return; }
    if (look === "arc") { const u = Math.min(15, W * 0.15), tc = D / 2;   // a heavy foot, a stem, an arm out to the shade hanging over
      L("marble", u, tc, 0, [[0, 0], [Math.min(14, r), 0], [Math.min(14, r), 3], [0, 3]]); L(m, u, tc, 3, [[0, 0], [1.2, 0], [1.2, H - 15], [0, H - 15]]);
      B(m, u, H - 12, tc - 0.8, W - 15, H - 10.4, tc + 0.8); L(m2, W - 15, tc, H - 36, [[0, 0], [15, 0], [6, 24], [0, 24]]); return; }
    L(/^cloth/.test(m2) ? m : m2, W / 2, D / 2, 0, [[0, 0], [Math.min(13, r), 0], [Math.min(13, r), 2.5], [Math.min(10, r), 4], [3, 5], [0, 5]]); L(m, W / 2, D / 2, 5, [[0, 0], [1.4, 0], [1, H - 30], [0, H - 30]]);
    L(sh, W / 2, D / 2, H - 28, [[0, 0], [r, 0], [r * 0.82, 28], [0, 28]]); };
  if (look === "rattan") return hcCaneCase(m === "rattan" ? "birch" : m, cane, c);
  if (look === "bench") return (W, H, D, B) => { const p = ["shoe_black", "shoe_tan", "shoe_white", "shoe_grey"];   // a seat over two open shelves of shoes
    for (const u of [0, W - 2.5]) B(m, u, 0, 0, u + 2.5, H - 3, D); B(m, 0, H - 3, 0, W, H, D); B(m, 2.5, 0, 0, W - 2.5, H - 3, 1.5); const sv = (H - 3) / 2;
    for (const v of [3, sv]) { B(m, 2.5, v - 2, 1.5, W - 2.5, v, D); for (let u = 5, q = 0; u < W - 14; u += 13, q++) for (const du of [0, 5]) B(p[(q + (v > 3)) % 4], u + du, v, 5, u + du + 4.4, v + Math.min(7, sv - 4), D - 3); } };
  if (look === "flip") return (W, H, D, B) => { const n = Math.max(2, Math.round(H / 42)), rh = (H - 2) / n;   // tip-out fronts, one over another
    B(m, 0, 0, 0, W, H, D - 2); B("gap", 0.3, 1, D - 2.05, W - 0.3, H - 0.3, D - 2);
    for (let i = 0; i < n; i++) { const v = 1 + i * rh; B(m, 0.3, v + 0.25, D - 2, W - 0.3, v + rh - 0.25, D - 0.4); B(grip === "grip" ? "handle_black" : "knob", W / 2 - 6, v + rh - 5, D - 0.4, W / 2 + 6, v + rh - 3.8, D); } };
  return (W, H, D, B, L) => { const n = c || Math.max(1, Math.round(W / 50)), lg = look === "legged" ? 15 : 0, Bq = lg ? hcUp(B, lg) : B, h = H - lg, fl = look === "floating" ? 4 : 0, dw = W / n;
    if (lg) hcLegs(legm, W, D, lg, 2, 5)(B, L);   // a unit: a carcass on a plinth (on legs; under a top floating over a shadow), its doors in a shadow gap
    Bq(m, fl ? 1.5 : 0, 0, 0, W - (fl ? 1.5 : 0), h - fl, D - 2); Bq("gap", 0.5, lg ? 0.5 : 4, D - 2.05, W - 0.5, h - fl - 0.5, D - 2); if (!lg) Bq(legm === m ? "black" : legm, 1.5, 0, D - 5, W - 1.5, 4, D - 4);
    if (fl) { Bq("gap", 3, h - fl, 2, W - 3, h - 3, D - 4); Bq(m, 0, h - 3, 0, W, h, D); }
    if (look === "sliding") { for (let i = 0; i < 2; i++) { const u0 = i ? W / 2 - 1 : 0.3, u1 = i ? W - 0.3 : W / 2 + 1, t = i ? D - 1.2 : D - 0.4;   // two leaves, one past the other
      Bq(m, u0, lg ? 0.8 : 4.3, t - 0.8 - (i ? 0 : 0.8), u1, h - fl - 0.3, t); Bq("gap", i ? u0 + 3 : u1 - 4, h * 0.3, t, i ? u0 + 4 : u1 - 3, h * 0.7, t + 0.1); } return; }
    for (let i = 0; i < n; i++) { Bq(m, i * dw + 0.3, lg ? 0.8 : 4.3, D - 2, (i + 1) * dw - 0.3, h - fl - 0.3, D); Bq(grip === "grip" ? "handle_black" : "knob", (i + 0.5) * dw - 6, h - fl - 8, D, (i + 0.5) * dw + 6, h - fl - 6.8, D + 0.6); } };
};
/* N225: the toilets (glazed, as the house's own pan: its profile, oval), its back at t 0; and the basins, their bowl as the WC's (a rim
   at the top of the piece), a mixer at the back. Close coupled: the cistern on the pan's back; back to wall: the pan on its own, the cistern
   in a box behind; hung: a frame boxed in to 82, the pan off the floor. Basins on a pedestal, a semi pedestal, into a corner, on a unit */
const HC_PAN = [[0, 0], [8, 0], [9, 3], [8.5, 14], [10.5, 24], [14, 33], [16, 39], [16, 41], [14.5, 41.5], [12.5, 39], [6, 27], [0, 25]],
  HC_SEAT = [[11.5, 0], [16, 0], [16.8, 1.2], [16, 2.6], [11.5, 2.6], [11, 1.3], [11.5, 0]],
  HC_BOWL = [[0, 0], [4, 0], [5, 1.5], [13, 12], [16, 15], [16, 16], [14.5, 16], [12, 13], [4, 3.5], [0, 3.5]];   // house/model.py PAN, SEAT, BOWL
function hcToilet(look, m, ch) { return (W, H, D, B, L) => {
  const back = look === "cc" ? 17 : look === "hung" ? 16 : 0, v0 = 0, sy = look === "hung" ? 40 : Math.min(41, H - 1), hx = Math.min(W, 37) / 2 - 1, hz = (D - back - 2) / 2, tc = back + 1 + hz;
  if (look === "cc") { B(m, W / 2 - 17, 38, 0.5, W / 2 + 17, H - 3, back); B(m, W / 2 - 18, H - 3, 0, W / 2 + 18, H, back + 1); L(ch, W / 2, back / 2, H, [[0, 0], [2.2, 0], [2.2, 0.5], [0, 0.5]]); }
  if (look === "btw") B(m, W / 2 - 10, 0, 0, W / 2 + 10, sy - 2, 12);   // its foot to the wall
  if (look === "hung") { B("paint", 0, 0, 0, W, H, back); B(ch, W / 2 - 12, H - 30, back, W / 2 + 12, H - 14, back + 0.6); B(ch, W / 2 - 0.2, H - 27, back + 0.6, W / 2 + 0.2, H - 17, back + 0.8); }   // the frame boxed in, its flush plate
  L(m, W / 2, tc, v0, look === "hung" ? [[0, 20], [8, 21], ...HC_PAN.filter(([, h]) => h >= 24)].map(([r, h]) => [r, h - v0]) : HC_PAN.map(([r, h]) => [r, h * sy / 41.5]), [hx / 16, hz / 16]);   // the pan (hung: its bowl only, off the floor) and its seat
  L(m, W / 2, tc, sy, HC_SEAT, [(hx + 0.5) / 16, (hz + 0.5) / 16]);
  B(m, W / 2 - hx + 2, sy + 2.6, back + 1, W / 2 + hx - 2, sy + 2.6 + Math.min(40, hz * 2), back + 3.4); }; }   // the lid up
function hcBasin(look, m, ch) { return (W, H, D, B, L, n, end) => {
  const corner = look === "corner", bh = Math.min(16, H), r = (corner ? Math.min(W, D) * 0.4 : Math.min(W, D * 1.2) / 2 - 1), cu = corner ? (end ? W * 0.58 : W * 0.42) : W / 2, ct = corner ? D * 0.42 : D / 2 + 1, top = H - bh;
  if (look === "vanity") { B("gloss", 0, 0, 0, W, top, D - 1.8); B("gloss", 0.3, 0.6, D - 1.8, W - 0.3, top - 0.4, D); B(ch, W - 6, top - 22, D, W - 4.8, top - 6, D + 2.2); }   // its unit, its door, a bar handle
  if (look === "ped") L(m, W / 2, D * 0.42, 0, [[0, 0], [10, 0], [9, 3], [7, 12], [6.5, top - 4], [9, top], [0, top]], [1, 0.8]);   // the pedestal
  if (look === "semi") L(m, W / 2, D * 0.38, top - 30, [[0, 0], [5, 0], [6.5, 20], [9, 30], [0, 30]], [1, 0.8]);
  if (corner) { B(m, 0, H - 2, 0, W, H, 3); B(m, end ? W - 3 : 0, H - 2, 0, end ? W : 3, H, D); }   // its back rims along both walls
  else B(m, 0, H - 2, 0, W, H, 6);   // the deck at the back for the tap
  L(m, cu, ct, top, HC_BOWL.map(([q, h]) => [q, h * bh / 16]), [r / 16, (corner ? r : Math.min(r, D / 2 - 1)) / 16]);
  const tu = corner ? (end ? W - 7 : 7) : W / 2, tt = corner ? 7 : 3;   // the mixer at the back: its body, the spout over the bowl
  L(ch, tu, tt, H, [[0, 0], [2, 0], [1.6, 1], [1.4, 13], [0, 13]]); B(ch, tu - 1, H + 10.5, tt, tu + 1, H + 12.5, tt + 10); }; }
/* N232: the forms the listings' words name (export3d.FORMS): a bed with panel sides to the floor (MALM "high"), one low on tapered legs,
   one with a cane headboard; a case of cane doors on short legs; a wing chair, a chair on a wooden frame, a rattan bowl, a low scoop */
const hcBedPanel = m => (W, H, D, B, L, v) => { B(m, 0, 0, 0, W, H, 4); for (const u of [0, W - 2.5]) B(m, u, 0, 4, u + 2.5, v + 2, D - 3);
  B(m, 0, 0, D - 3, W, Math.min(38, v + 10), D); B("birch", 2.5, v - 2, 4, W - 2.5, v, D - 3); B("gap", 2.5, 1, D - 3.1, W - 2.5, 3, D - 3); };
const hcBedLegged = (m, legs) => (W, H, D, B, L, v) => { hcLegs(legs, W, D, 16, 2.2, 7)(B, L); B(m, 0, 16, 3, W, v, D);
  for (const u of [3, W - 7]) B(m, u, 0, 0, u + 4, H - 6, 3); B(m, 0, v + 4, 0, W, H, 3); B("birch", 2, v - 1, 5, W - 2, v, D - 2); };   // its headboard a slab on two posts
const hcBedRattan = (m, cane) => (W, H, D, B, L, v) => { for (const u of [0, W - 6]) { B(m, u, 0, 0, u + 6, H, 6); B(m, u, 0, D - 6, u + 6, 42, D); }
  B(m, 6, H - 8, 0.5, W - 6, H, 5.5); B(m, 6, v, 0.5, W - 6, v + 6, 5.5); B(cane, 6, v + 6, 2, W - 6, H - 8, 4);   // the headboard's cane in its frame
  B(m, 6, 30, D - 5.5, W - 6, 42, D - 0.5); B(cane, 6, 14, D - 4, W - 6, 30, D - 2);
  B(m, 0, 14, 6, 4, v, D - 6); B(m, W - 4, 14, 6, W, v, D - 6); B("birch", 4, v - 2, 6, W - 4, v, D - 6); };
const hcCaneCase = (m, cane, n0) => (W, H, D, B, L) => { const lg = 10, n = n0 || Math.max(1, Math.round(W / 45)), dw = (W - 2) / n; hcLegs(m, W, D, lg, 1.6, 3)(B, L);
  B(m, 0, lg, 0, W, H, D - 2); B("gap", 0.6, lg + 0.6, D - 2.05, W - 0.6, H - 0.6, D - 2);
  for (let i = 0; i < n; i++) { const u0 = 1 + i * dw; B(m, u0 + 0.2, lg + 0.8, D - 2, u0 + dw - 0.2, H - 0.8, D - 0.6); B(cane, u0 + 3, lg + 3.8, D - 0.6, u0 + dw - 3, H - 3.8, D - 0.4);
    B("knob", i % 2 ? u0 + 1.2 : u0 + dw - 2.6, (lg + H) / 2 - 2, D - 0.6, i % 2 ? u0 + 2.6 : u0 + dw - 1.2, (lg + H) / 2 + 2, D + 0.6); } };
function hcWing(m, legs) { return (W, H, D, B, L) => { const a = Math.min(12, W * 0.14), s = Math.min(46, H * 0.45);   // its back tall, wings either side of the head
  hcLegs(legs, W, D, 12, 2, 6)(B, L); B(m, 0, 12, 0, W, s - 10, D); B(m, 0, s - 10, 0, W, H, 14); B(m, 0, s - 10, 14, a, s + 16, D); B(m, W - a, s - 10, 14, W, s + 16, D);
  for (const u of [0, W - a]) B(m, u, s + 16, 4, u + a, H - 6, 30); B(m, a + 0.5, s - 10, 28, W - a - 0.5, s, D - 0.5); B(m, a + 0.5, s - 10, 14, W - a - 0.5, H - 4, 28); }; }
function hcFrameChair(m, fr) { return (W, H, D, B) => { const s = Math.min(40, H * 0.45);   // cushions on a wooden frame: its side rails to the floor, the arms over
  for (const u of [0, W - 4]) { B(fr, u, 0, 4, u + 4, 3, D - 2); B(fr, u, 3, D - 8, u + 4, s + 18, D - 4); B(fr, u, 3, 6, u + 4, H - 4, 10); B(fr, u, s + 18, 8, u + 4, s + 21, D - 2); }
  B(fr, 4, s - 14, 10, W - 4, s - 11, D - 6); B(m, 5, s - 11, 12, W - 5, s, D - 3); B(m, 5, s, 8, W - 5, H - 3, 16); }; }
function hcCaneChair(m, cane) { return (W, H, D, B, L) => { const r = Math.min(W, D) / 2;   // a rattan bowl on a ring, its cushion in it
  L(cane, W / 2, D / 2, 0, [[0, 0], [r * 0.55, 0], [r * 0.6, 10], [0, 10]]); L(cane, W / 2, D / 2, 10, [[0, 0], [r * 0.7, 0], [r - 1, 18], [r, H - 10], [r - 3, H - 10], [r - 4, 22], [0, 20]]);
  L(m, W / 2, D / 2 + 2, 20, [[0, 0], [r - 5, 0], [r - 5, 8], [0, 9]]); B(m, W / 2 - r * 0.6, 26, 6, W / 2 + r * 0.6, H - 14, 14); }; }
function hcScoop(m, legs) { return (W, H, D, B, L) => { const s = Math.min(31, H * 0.45);   // a low lounge chair: a shell seat and back, short legs
  hcLegs(legs, W, D, 10, 1.6, 7)(B, L); B(m, 0, 10, 4, W, s, D); B(m, 0, s, 0, W, H, 12); for (const u of [0, W - 8]) B(m, u, s, 12, u + 8, s + 14, D - 8); }; }
/* N230: a bar stool (seat 62-63 high: the listings), its back at t 0, facing +t as the chairs do: on a chrome pedestal (a swivel), on thin
   legs with a padded seat and back, a wooden one with a spindle back, or a metal frame with a back band */
/* N279: a dining chair: four legs, a seat at 46, its back as the listing's: spindles ("wood"), a padded seat and back ("uph"), a woven
   seat and back in a timber frame ("cane"). A trolley: four posts on castors, two or three trays with a lip ("wood" trays in m on a frame in m2) */
function hcDchair(look, m, m2) { return (W, H, D, B, L) => { const sh = Math.min(47, H - 30), lg = 3.2, fm = look === "uph" ? m2 : m, bk = 4.5;
  for (const [u, t] of [[1, 1], [W - 1 - lg, 1], [1, D - 1 - lg], [W - 1 - lg, D - 1 - lg]]) B(fm, u, 0, t, u + lg, t < D / 2 ? H - 2 : sh - 4, t + lg);   // the back legs up into the back
  for (const [u0, t0, u1, t1] of [[1, D - 5, W - 1, D - 3], [1, 2, 1 + lg, D - 2], [W - 1 - lg, 2, W - 1, D - 2]]) B(fm, u0, sh - 9, t0, u1, sh - 4, t1);   // the seat's apron
  if (look === "uph") { B(m, 0, sh - 4, 0.5, W, sh + 2.5, D); B(m, 2, sh + 12, 1, W - 2, H, bk + 1);   // a padded seat and back
    for (const u of [0.5, W - 0.5]) B("gap", u - 0.05, sh - 4, 0.5, u + 0.05, sh + 2.5, D); return; }
  const seat = look === "cane" ? "rattan" : m; B(fm, 0, sh - 4, 0, W, sh - 2, D); B(seat, 2, sh - 2, 2, W - 2, sh, D - 2);   // a frame round its seat
  B(fm, 1, H - 7, 1, W - 1, H - 2, bk);   // the top rail
  if (look === "cane") { B("rattan", 1 + lg, sh + 14, 2, W - 1 - lg, H - 7, 3.5); B(fm, 1, sh + 12, 1, W - 1, sh + 14, bk); return; }
  for (let u = 7; u < W - 8; u += (W - 14) / 4) B(fm, u, sh, 2, u + 1.6, H - 7, 3.6); }; }   // spindles
function hcTrolley(look, m, m2) { return (W, H, D, B, L) => { const n = H > 85 ? 3 : 2, cs = 6, p = 2.2, fr = m2 === m && /^(door_white|pnt_\w+|black|steel)$/.test(m) ? m : m2;
  for (const [u, t] of [[0.5, 0.5], [W - 0.5 - p, 0.5], [0.5, D - 0.5 - p], [W - 0.5 - p, D - 0.5 - p]]) { B(fr, u, cs, t, u + p, H, t + p);
    L("black", u + p / 2, t + p / 2, 0, [[0, 0], [2.6, 0], [2.6, cs], [0, cs]]); }   // its posts on castors
  for (let i = 0; i < n; i++) { const v = cs + 4 + i * (H - cs - 8) / (n - 1 || 1) - (i === n - 1 ? 2 : 0);   // its trays, each with a lip
    B(m, 0, v, 0, W, v + 1.5, D); for (const [u0, t0, u1, t1] of [[0, 0, W, 0.8], [0, D - 0.8, W, D], [0, 0, 0.8, D], [W - 0.8, 0, W, D]]) B(m, u0, v + 1.5, t0, u1, v + 5, t1); }
  B(fr, -3, H - 8, D / 2 - 0.8, 0.5, H - 6.4, D / 2 + 0.8); }; }   // a handle at one end
function hcStool(look, m, m2) { return (W, H, D, B, L) => { const sh = Math.min(63, H - 24), c = W / 2, tc = D / 2;
  if (look === "swivel") { const r = Math.min(W, D) / 2 - 2;
    L(m2, c, tc, 0, [[0, 0], [r - 2, 0], [r - 2, 0.8], [r - 6, 2.2], [3, 3], [0, 3]]); L(m2, c, tc, 3, [[0, 0], [2.5, 0], [2.5, sh - 10], [0, sh - 10]]);
    L(m2, c, tc, 24, [[r - 6, 0], [r - 4.5, 0], [r - 4.5, 1.5], [r - 6, 1.5]]);
    L(m, c, tc, sh - 7, [[0, 0], [W / 2 - 4, 0], [W / 2 - 2, 3], [W / 2 - 2.5, 7], [0, 6.5]]);
    B(m, 4, sh - 2, 1, W - 4, H, 7); B(m, 2, sh - 2, 5, 6, sh + 18, D * 0.6); B(m, W - 6, sh - 2, 5, W - 2, sh + 18, D * 0.6); return; }   // its shell: the back, low arms
  const lg = look === "wood" ? 3.6 : look === "uph" ? 2.4 : 2, legs = [[1.5, 1.5], [W - 1.5 - lg, 1.5], [1.5, D - 1.5 - lg], [W - 1.5 - lg, D - 1.5 - lg]], fm = look === "uph" ? m2 : m;
  for (const [u, t] of legs) B(fm, u, 0, t, u + lg, sh - (look === "wood" ? 3 : 2), t + lg);
  const rail = (v, k) => { B(fm, 1.5, v, D - 1.5 - k, W - 1.5, v + k, D - 1.5); B(fm, 1.5, v, 1.5, 1.5 + k, v + k, D - 1.5); B(fm, W - 1.5 - k, v, 1.5, W - 1.5, v + k, D - 1.5); };
  rail(24, look === "wood" ? 2.4 : 1.8);   // the foot rail, front and sides
  if (look === "wood") { B(m, 0, sh - 3, 0, W, sh, D);   // the seat, back legs up into the back, spindles under its top rail
    for (const u of [1.5, W - 5.1]) B(m, u, sh, 1.5, u + 3.6, H, 5.1); B(m, 5.1, H - 7, 2, W - 5.1, H, 4.6);
    for (let u = 8; u < W - 9; u += (W - 16) / 4) B(m, u, sh, 2.6, u + 1.6, H - 7, 4); return; }
  if (look === "uph") { B(m2, 1, sh - 4, 1, W - 1, sh - 2, D - 1); B(m, 0.5, sh - 2, 0.5, W - 0.5, sh + 6, D - 0.5);   // its padded seat on a frame, its padded back on two posts
    for (const u of [3, W - 5.4]) B(m2, u, sh, 2, u + 2.4, sh + 12, 4.4); B(m, 1, sh + 12, 0.5, W - 1, H, 6.5); return; }
  B(m, 0.5, sh - 2, 0.5, W - 0.5, sh, D - 0.5); for (const u of [2, W - 4]) B(m, u, sh, 2, u + 2, H, 4);   // metal: a seat on the frame, two uprights, a band
  B(m, 2, H - 12, 1.5, W - 2, H, 3.5); }; }
function hcArmchair(m, legs) { return (W, H, D, B, L) => { const a = Math.min(14, W * 0.15), s = Math.min(46, H * 0.48);   // the LANDSKRONA's shape at any size
  hcLegs(legs, W, D, 12, 2, 6)(B, L); B(m, 0, 12, 0, W, s - 10, D); B(m, 0, s - 10, 0, W, H - 6, 12); B(m, 0, s - 10, 12, a, s + 16, D); B(m, W - a, s - 10, 12, W, s + 16, D);
  B(m, a + 0.5, s - 10, 28, W - a - 0.5, s, D - 0.5); B(m, a + 0.5, s - 10, 12, W - a - 0.5, H, 28); }; }
function hcSofa(m, legs) { return (W, H, D, B, L) => { const a = Math.min(22, W * 0.11), n = W > 190 ? 3 : 2, sw = (W - 2 * a) / n;   // the KIVIK's at any size
  hcLegs(legs, W, D, 4, 2, 8)(B, L); B(m, 0, 4, 0, W, 30, D); for (const u of [0, W - a]) B(m, u, 30, 0, u + a, 62, D); B(m, a, 30, 0, W - a, H - 6, 14);
  for (let i = 0; i < n; i++) { const u0 = a + i * sw + 0.4, u1 = a + (i + 1) * sw - 0.4; B(m, u0, 30, Math.max(15, D - 61), u1, 45, D - 1); B(m, u0, 45, 14, u1, H - 2, 30); } }; }
function hcCabinet(m, drawers) { return (W, H, D, B) => {   // a glass-fronted cabinet: drawers or a plinth under, shelves of things behind its glass doors
  const v0 = drawers ? Math.min(42, H * 0.24) : 6, n = Math.max(1, Math.round((H - v0) / 38)), g = (H - v0 - 2) / n, k = W > 60 ? 2 : 1, dw = (W - 4) / k;
  B(m, 0, 0, 0, 2, H, D); B(m, W - 2, 0, 0, W, H, D); B(m, 2, 0, 0, W - 2, H, 1); B(m, 2, H - 2, 1, W - 2, H, D); B(m, 2, 0, 1, W - 2, v0, D - 1.5);
  for (let i = 0; i < (drawers || 0); i++) { const w = (W - 4) / drawers, u = 2 + i * w; B(m, u + 0.3, 4, D - 1.5, u + w - 0.3, v0 - 0.5, D); B("knob", u + w / 2 - 1.5, v0 - 9, D, u + w / 2 + 1.5, v0 - 6, D + 1.2); }
  for (let i = 1; i < n; i++) B(m, 2, v0 + i * g - 1.6, 1, W - 2, v0 + i * g, D - 2);
  for (let i = 0; i < n; i++) { const v = v0 + i * g; B("pot", 5, v, D / 2 - 4, 13, v + Math.min(14, g - 4), D / 2 + 4); hcBooks(B, W / 2, W - 3, v, Math.min(26, g - 4), D - 2, i); }
  for (let i = 0; i < k; i++) { const u0 = 2 + i * dw, u1 = u0 + dw;   // each door's frame, its pane
    B(m, u0, v0, D - 1.5, u1, v0 + 3, D); B(m, u0, H - 5, D - 1.5, u1, H - 2, D); B(m, u0, v0 + 3, D - 1.5, u0 + 3, H - 5, D); B(m, u1 - 3, v0 + 3, D - 1.5, u1, H - 5, D);
    B("glass", u0 + 3, v0 + 3, D - 1.1, u1 - 3, H - 5, D - 0.7); } }; }
Object.assign(HCAT, Object.fromEntries((R.SHOP || []).map(([key, k, look, n, shop, w, d, h, p, url, m, m2, c]) =>
  [key, { n, k, w, d, h: Math.max(h, k === "rug" ? 0.6 : 1), ref: key, src: `${shop}, ${n}`, shop, p, url, b: hcMake(k, look, m, m2, c) }])));
/* her own piece: its row's value says it all, "own|<look>|<material>|W|D|H|<name>" (rows are data: each part checked, the name plain) */
const OWN_LOOKS = ["bed", "wardrobe", "chest", "bedside", "desk", "shelves", "seat", "chair", "table", "unit", "lamp", "rug"];
const OWN_MATS = [["door_white", "White", "#efece5"], ["cloth4", "Cream", "#d8d2c4"], ["birch", "Birch", "#dcc8a2"], ["oak", "Oak", "#b8844f"], ["pine", "Pine", "#c99a55"],
  ["door_wood", "Teak", "#b0713f"], ["pine_dark", "Walnut", "#7a5a30"], ["black", "Black", "#1d1d1f"], ["cloth5", "Grey", "#555555"], ["cloth0", "Navy", "#3d4a5c"],
  ["cloth3", "Green", "#2f3b2f"], ["cloth2", "Red", "#7a2f2f"]];   // twelve of the house's own (house/model.py's colours)
const ownName = s => String(s || "").replace(/[^A-Za-z0-9 '&-]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
const ownVal = (look, m, w, d, h, n) => `own|${look}|${m}|${w}|${d}|${h}|${ownName(n)}`;
function hcOwn(v) {   // her own piece's catalogue entry from its value (made once), or null
  if (typeof v !== "string" || !v.startsWith("own|")) return null; if (HCAT[v]) return v;
  const q = v.split("|"), [look, m] = [q[1], q[2]], [w, d, h] = q.slice(3, 6).map(Number), nm = q[6] || "";
  if (q.length !== 7 || !OWN_LOOKS.includes(look) || !OWN_MATS.some(([k]) => k === m) || ![w, d, h].every(x => Number.isFinite(x) && x >= 1 && x <= 400) || nm !== ownName(nm)) return null;
  HCAT[v] = { n: nm || "Your own piece", k: look, w, d, h, ref: "own", src: "Your own", own: true, b: hcMake(look, look === "table" || look === "rug" ? (w === d ? "round" : "box") : look === "seat" && w > 150 ? "sofa" : "", m, m, 0) };
  return v;
}
/* which pieces swap, and for what: by the kind of thing it is (its id), standing on the floor, one that turns (no lid or doors of its own) */
const HSWAP_OF = [[/(^|\.)bed$|bed_/, "bed"], [/wardrobe/, "wardrobe"], [/bedside/, "bedside"], [/chest/, "chest"], [/desk$/, "desk"],
  [/shelving|kallax|bookcase|shelves/, "shelves"], [/chairbed|bench|armchair/, "seat"], [/(^|\.)chair\d?$/, "chair"], [/(^|\.)stool\d?$/, "stool"], [/(^|\.)rack\d?$|shoe/, "shoes"], [/(^|\.)rug$/, "rug"]];   // N230: the office's two chairs, the kitchen's stools, the hall's shoe racks
const SUITE_OF = { "wc.toilet": "toilet", "bath.toilet": "toilet", "wc.basin": "basin", "bath.vanity": "basin" }, SUITE_RIM = { wc: 80, bathroom: 86 };   // N225: a basin's rim where the old one's was (survey_data)
function swapKind(id) {
  if (SUITE_OF[id]) return HIT(id) && canTurn(id) ? SUITE_OF[id] : null;   // N225: hung or with its own lid, still swapped for its own kind
  const it = HIT(id); if (!it || it.op || (it.k !== "furniture" && !/rug$/.test(id)) || (it.s[2] || 0) > 20) return null;
  const k = (HSWAP_OF.find(([re]) => re.test(id)) || [])[1];
  return k && canTurn(id) ? k : null;
}
const hcOf = kind => Object.keys(HCAT).filter(k => HCAT[k].k === kind && !HCAT[k].own);   // not her own pieces: a swap to one would hang on its add row (lost after a reload or on a link)
/* N217: a piece swapped at its own size (W along its wall, D out, H up): its back where the old one's was, along its wall from the same
   end if that stood within 10 of its room's wall, else from its middle, kept in its room; a chair where the old one was, facing the same way */
const hcSeat = k => k === "chair" || k === "stool";   // sat on facing the desk or the bar: centred where the old one stood, facing as it did
function swapBox(id, key) {
  const it = HIT(id), C = HCAT[key], { a, o, flip } = hcFrame(it), b = it.b.slice(), r = H3R(it.r), ch = hcSeat(C.k);
  const [r0, r1] = r ? (a === 2 ? [r[2], r[3]] : [r[0], r[1]]) : [b[a], b[a + 3]];
  const u0 = !ch && b[a] - r0 < 10 ? b[a] : !ch && r1 - b[a + 3] < 10 ? b[a + 3] - C.w : (b[a] + b[a + 3] - C.w) / 2;
  b[a] = Math.max(r0, Math.min(r1 - C.w, u0)); b[a + 3] = b[a] + C.w; b[4] = b[1] + C.h;
  if (ch) { b[o] = (b[o] + b[o + 3] - C.d) / 2; b[o + 3] = b[o] + C.d; } else if (flip) b[o] = b[o + 3] - C.d; else b[o + 3] = b[o] + C.d;
  if (SUITE_OF[id] && r) { b[1] = C.k === "basin" && C.h < 75 ? r[4] + (SUITE_RIM[it.r] || 82) - C.h : r[4]; b[4] = b[1] + C.h;   // N225: a toilet or standing basin from the floor, a hung basin's rim at the old one's
    if (C.k === "basin" && C.w > 44 && C.d > 44) { const lo = (it.b[a] + it.b[a + 3]) / 2 - r0 < r1 - (it.b[a] + it.b[a + 3]) / 2; b[a] = lo ? r0 + 0.5 : r1 - 0.5 - C.w; b[a + 3] = b[a] + C.w; } }   // a corner basin into the nearer corner
  return b.map(v => Math.round(v * 10) / 10);
}
function pieceBase(id, key) {   // the piece as planned, or the one swapped in where it stood (a chair turned to face as the old one did)
  const it = HIT(id); if (!key || !HCAT[key]) return it;
  const b = swapBox(id, key), k = it.ax === "z" ? 2 : 0;
  return Object.assign({}, it, { b, s: [b[k + 3] - b[k], b[4] - b[1], it.s[2]], al: cmR(it.al + b[k] - it.b[k]), flip: hcFrame(it).flip !== hcSeat(HCAT[key].k) });
}
/* a piece's frame in the house: its wall axis, and which way it faces (its back to the nearer wall of its room) */
function hcFrame(it) {
  const r = H3R(it.r) || [it.b[0], it.b[3], it.b[2], it.b[5]], b = it.b, a = it.ax === "z" ? 2 : 0, o = 2 - a;
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
  const L = (m, u, w, v, p, sc) => out.lathes.push({ c: at(u, v, w), p, s: sc ? (a === 0 ? sc : [sc[1], sc[0]]) : [1, 1], m, t });   // N225: oval: sc along its wall, out   // a turned part round (u, w), its profile [radius, up]
  const rr = H3R(it.r), end = !!rr && (a === 2 ? rr[3] : rr[1]) - b[a + 3] < 2;   // N225: it stands in its wall's far corner (a corner basin's side)
  C.b(W, H, D, B, L, Math.abs(Math.round(b[0] * 3 + b[1] / 7 + b[2] * 5)), end);   // N236: where it stands, for a piece that draws each copy its own
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
  const rows = {}; for (const v of Object.values(ds.rows("edits") || {})) if (v && v.field === "add" && /^add\.[a-z0-9]{1,12}$/.test(v.item || "") && (HCAT[v.value] || hcOwn(v.value)) && H3R(v.room)) rows[v.item] = v;
    else if (v && v.field === "add" && /^sh[0-9a-f]{6}$/.test(v.value || "") && !HCAT[v.value] && typeof ixData === "function") ixData().then(j => j && storeEdits());   // N245: a piece from the ideas data, kept after a reload   // N219: her own too
  for (const id of Object.keys(ADDED)) if (!rows[id]) { delete H3.items[id]; delete ADDED[id]; }
  for (const [id, v] of Object.entries(rows)) { if (ADDED[id] === `${v.value}@${v.x},${v.z}`) continue;   // N218: a new piece or a new spot
    const C = HCAT[v.value], r = H3R(v.room), x = +v.x, z = +v.z, y = isFinite(+v.y) ? +v.y : r[4]; if (!isFinite(x) || !isFinite(z)) continue;
    const pl = /^add\.ix/.test(id) && placeAt(v.room, x, z, C.k), pw = pl && pl.at !== "open" && /^[xz][01]$/.test(pl.back || "");   // N287: in a place, its back on the place's wall (an L-shaped room's inner wall too)
    const dz = Math.min(z - r[2], r[3] - z), dx = Math.min(x - r[0], r[1] - x), ax = pw ? (pl.back[0] === "z" ? "x" : "z") : dz <= dx ? "x" : "z", a = ax === "z" ? 2 : 0, o = 2 - a;
    const c = [x, y, z], b = [0, y, 0, 0, y + C.h, 0], ro = pw ? [pl.b[o], pl.b[o + 3]] : o === 2 ? [r[2], r[3]] : [r[0], r[1]], ra = a === 2 ? [r[2], r[3]] : [r[0], r[1]];
    b[a] = Math.max(ra[0], Math.min(ra[1] - C.w, c[a] - C.w / 2)); b[a + 3] = b[a] + C.w;
    const near = pw ? pl.back[1] === "0" : c[o] - ro[0] < ro[1] - c[o], gap = pw ? 0 : near ? c[o] - C.d / 2 - ro[0] : ro[1] - c[o] - C.d / 2;   // within 30 of its wall: against it
    b[o] = gap < 30 ? (near ? ro[0] + (pw ? 0 : 0.5) : ro[1] - (pw ? 0 : 0.5) - C.d) : c[o] - C.d / 2; b[o + 3] = b[o] + C.d;
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
    let s = 0;   // storage_ideas.checks' swept (model.swing_into): each door's leaf as it opens, 205 high
    for (const o of Object.values(R.HOUSE3.items)) { const p = o.op; if (p && p.swing && p.y0 === r[4] && b[1] <= p.y0 + 205) s = Math.max(s, swingInto(p, b)); }
    into(s, "the door's swing");
    for (const [n, q, of] of FT.keep) if (!of || of !== self) into(dig(q), n.replace(/ \(.*\)$/, ""));   // a walk (of none) for every piece, a new one too (self null)
  }
  return out;
}
/* N230: how far box b reaches into a door's swing, as it really opens (model.swing_into): rays from its hinge every 2° to the angle it opens
   (the bathroom's 84°), and the box's nearest point; the reach a leaf's width, or a bifold's (its halves fold back along the track: half
   its width past 45°, the astroid its far half sweeps below that) */
const swingReach = (S, w, a) => { if (a < -0.01 || a > (S.deg ?? 90) + 0.01) return 0; if (!S.fold) return w; if (a >= 45) return w / 2;
  const t = a * Math.PI / 180; return Math.max(w / 2, w / Math.pow(Math.cos(t) ** (2 / 3) + Math.sin(t) ** (2 / 3), 1.5)); };
function swingInto(p, b) {
  const S = p.swing, w = p.b - p.a, deg = S.deg ?? 90, [al0, al1, ac0, ac1] = p.axis === "x" ? [b[0], b[3], b[2], b[5]] : [b[2], b[5], b[0], b[3]];
  const l0 = Math.min((al0 - S.hinge) * S.u, (al1 - S.hinge) * S.u), l1 = Math.max((al0 - S.hinge) * S.u, (al1 - S.hinge) * S.u);   // along the leaf's way
  const c0 = Math.min((ac0 - p.line) * S.side, (ac1 - p.line) * S.side), c1 = Math.max((ac0 - p.line) * S.side, (ac1 - p.line) * S.side);   // out the way it opens
  if (l1 <= 0.5 || c1 <= 0.5) return 0;
  const enter = t => { let lo = 0, hi = 1e9; for (const [p0, p1, dv] of [[l0, l1, Math.cos(t)], [c0, c1, Math.sin(t)]]) {
    if (Math.abs(dv) < 1e-9) { if (p0 > 0 || p1 < 0) return null; continue; } lo = Math.max(lo, Math.min(p0 / dv, p1 / dv)); hi = Math.min(hi, Math.max(p0 / dv, p1 / dv)); }
    return lo <= hi ? lo : null; };
  const nl = Math.min(Math.max(0, l0), l1), nc = Math.min(Math.max(0, c0), c1); let s = swingReach(S, w, Math.atan2(nc, nl) * 180 / Math.PI) - Math.hypot(nl, nc);
  for (let a = 0; ; a = Math.min(deg, a + 2)) { const e = enter(a * Math.PI / 180); if (e != null) s = Math.max(s, swingReach(S, w, a) - e); if (a >= deg) break; }
  return Math.max(0, s);
}
function fitWhy(id) {
  const it = HIT(id), cl = clashes(id), way = cl.length ? [`in the way of ${cl.slice(0, 2).join(" and ").replace(/^The /, "the ").replace(/ and The /, " and the ")}`] : [];
  if (!it || it.op || pieceNow(id).removed || (!it.add && !pieceDelta(id).some(Boolean))) return way;
  return roomWhy(pieceBox(id), it.r, id).concat(way);
}
/* N218: where an added piece stands: back to a wall of its room (as syncAdds puts it: the row's x, z on that wall), clear of the walls,
   the slope, the swings, the space kept clear and the pieces, nearest the tap; if nowhere, back to the nearest wall at the tap */
function addSpot(rid, key, x, z, y, self) { const s = spotFor(rid, key, x, z, y, self); return s ? s.slice(0, 2) : [x, z]; }   // her own tap: where she taps (Ideas uses placeSpot)
/* N287 (Emma, 25 Nov 2026: "I can currently just drop furniture into the wrong rooms from the ideas area"): a piece goes only in one of its
   room's places (house/places.py, data/ideas.json v2: a named area inside the real walls, the kinds that belong) that takes its kind and
   that it fits, slid along that place's wall (or about its open floor); no place, no spot. [x, z, how far, box, box with room in front,
   place] or null; HPL null (the ideas data not in yet, or v1) leaves it to spotFor */
let HPL = null;
const placesIn = rid => (HPL || []).filter(p => p.room === rid && p.at !== "wall" && p.at !== "over door" && p.at !== "ceiling");
function placesFor(rid, key) { const C = HCAT[key]; if (!C) return [];
  return placesIn(rid).filter(p => p.kinds.includes(C.k) && (p.at === "open" ? Math.min(C.w, C.d) <= Math.min(p.w, p.d) + 1 && Math.max(C.w, C.d) <= Math.max(p.w, p.d) + 1
    : C.w <= p.w + 1 && C.d <= p.d + 1 && C.h <= p.h + 1)); }
function placeAt(rid, x, z, k) {   // the place an added piece stands in (its middle inside the place's box, 2 cm spare), that takes kind k (none or "idea": any, nooks too)
  return (k && k !== "idea" ? placesIn(rid) : (HPL || []).filter(p => p.room === rid)).find(p => (!k || k === "idea" || p.kinds.includes(k)) && x > p.b[0] - 2 && x < p.b[3] + 2 && z > p.b[2] - 2 && z < p.b[5] + 2) || null; }
function placeSpot(rid, key, x, z, y, self, more = [], skip = null, maxD = Infinity, cl = 0) {
  const C = HCAT[key], over = (p, q) => [0, 1, 2].every(j => p[j] < q[j + 3] - 1 && p[j + 3] > q[j] + 1); let best = null; if (!C || !HPL) return null;
  const busy = Object.keys(R.HOUSE3.items).filter(k => { const o = HIT(k); return k !== self && !(skip && skip(k)) && o.r === rid && !HCSKIP.has(o.k) && !hcSoft(k) && !pieceNow(k).removed; }).map(pieceBox).concat(more);
  const ok = (b, f) => C.k === "rug" || (!busy.some(q => over(b, q) || (f && over(f, q))) && !roomWhy(b, rid, self).length);
  for (const p of placesFor(rid, key)) { const P = p.b;
    if (p.at === "open") { const [w, d] = C.w <= P[3] - P[0] + 1 && C.d <= P[5] - P[2] + 1 ? [C.w, C.d] : [C.d, C.w];
      for (let u = P[0] + w / 2; u <= P[3] - w / 2 + 0.01; u += 10) for (let v = P[2] + d / 2; v <= P[5] - d / 2 + 0.01; v += 10) {
        const b = [u - w / 2, y, v - d / 2, u + w / 2, y + C.h, v + d / 2], dd = Math.hypot(u - x, v - z); if (dd > maxD || (best && dd >= best[2])) continue;
        if (ok(b)) best = [u, v, dd, b, b, p]; } continue; }
    const o = p.back[0] === "x" ? 0 : 2, hi = p.back[1] === "1", a = 2 - o, wl = hi ? P[o + 3] : P[o];   // its back on the place's wall
    for (let u = P[a]; u <= P[a + 3] - C.w + 0.01; u += 5) { const b = [0, y, 0, 0, y + C.h, 0]; b[a] = u; b[a + 3] = u + C.w; b[o] = hi ? wl - C.d : wl; b[o + 3] = b[o] + C.d;
      const c = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2], dd = Math.hypot(c[0] - x, c[1] - z); if (dd > maxD || (best && dd >= best[2])) continue;
      const f = b.slice(); if (cl) { if (hi) f[o] -= cl; else f[o + 3] += cl; }
      if (ok(b, cl && f)) best = [c[0], c[1], dd, b, f, p]; } }
  return best;
}
/* N244: the spot itself, [x, z, how far, its box] or null; also clear of boxes not drawn yet (more: a set-up's other pieces), past the
   pieces skip says (a set-up shown before), within maxD of the tap */
function spotFor(rid, key, x, z, y, self, more = [], skip = null, maxD = Infinity, cl = 0) {   // N282: cl, the room kept clear in front of it (best[4] that box)
  const r = H3R(rid), C = HCAT[key], over = (p, q) => [0, 1, 2].every(j => p[j] < q[j + 3] - 1 && p[j + 3] > q[j] + 1); let best = null; if (!r || !C) return null;
  const busy = Object.keys(R.HOUSE3.items).filter(k => { const o = HIT(k); return k !== self && !(skip && skip(k)) && o.r === rid && !HCSKIP.has(o.k) && !hcSoft(k) && !pieceNow(k).removed; }).map(pieceBox).concat(more);
  for (const [o, hi] of [[2, 0], [2, 1], [0, 0], [0, 1]]) { const a = 2 - o, w = r[o + hi] + (hi ? -0.5 : 0.5);   // each wall, its back 0.5 off it
    for (let u = r[a]; u <= r[a + 1] - C.w; u += 5) { const b = [0, y, 0, 0, y + C.h, 0]; b[a] = u; b[a + 3] = u + C.w; b[o] = hi ? w - C.d : w; b[o + 3] = b[o] + C.d;
      const d = Math.hypot((b[0] + b[3]) / 2 - x, (b[2] + b[5]) / 2 - z); if (d > maxD || (best && d >= best[2])) continue;
      const f = b.slice(); if (cl) { if (hi) f[o] -= cl; else f[o + 3] += cl; if (f[o] < r[o] - 1 || f[o + 3] > r[o + 1] + 1) continue; }
      if (!busy.some(q => over(b, q) || (cl && over(f, q))) && !roomWhy(b, rid, self).length) best = [...(o ? [u + C.w / 2, w] : [w, u + C.w / 2]), d, b, f]; } }
  return best;
}
/* the pieces in its way: a moved, swapped or added piece against the others in the room it now stands in (not chairs and rugs) */
const HCSKIP = new Set(["decor", "finish", "light", "switch", "socket", "fitting", "window", "door"]), hcSoft = k => /chairs?\d?$|stools?\d?$|rug$/.test(k) || /^(chair|stool|rug)$/.test((HCAT[(HIT(k) || {}).add] || {}).k);   // N217: by its id or what was added
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
   (More), kept as their ids in S.fin[room][28]; each piece an added piece of the house (drawn, tapped), built only once it's shown.
   N242: each idea's real buys from the shops (its "o" rows: export3d.opt_row, house/data/N242_options.json): ‹ › on its card through the plan's
   idea and each, kept as "id:key" in the same slot; drawn at its own size on the idea's wall (centred on its spot) by the ideas' own
   builders in its colour, or the shops' (hcMake), on the floor or under the ceiling where it stands there */
const IDEAS = () => (R.HOUSE3 && R.HOUSE3.storage) || [];
const ideasIn = room => IDEAS().filter(i => i.room === room);
const ideaVals = room => String(finGet(room, 28) || "").split(",").filter(Boolean);
const ideaOn = room => ideaVals(room).map(q => q.split(":")[0]);
const ideaPick = (room, id) => (ideaVals(room).find(q => q.split(":")[0] === id) || "").split(":")[1] || "";
const ST_CARRY = new Set(["st_float", "st_ledge", "st_faceout", "st_tenshelf", "st_pegshelf", "st_airer"]);   // drawn as tall as the idea's spot: what stands on it, the ropes
function ideaOptKey(I, key) {   // a shop's buy for idea I: its catalogue piece (made once), or null
  const r = key && (I.o || []).find(q => q[0] === key); if (!r) return null; const hk = `opt.${I.id}.${key}`; if (HCAT[hk]) return hk;
  const [, k, look, n, shop, w, d, h, p, url, m, m2, c, on] = r, own = k === "idea" && HCAT[look];
  HCAT[hk] = { n, k: "idea", w, d, h, ref: key, src: `${shop}, ${n}`, shop, p, url, on, look, opt: true,
    b: own ? (W, H, D, B, L, ...x) => own.b(W, H, D, (q, ...a) => B(q === ST || q === "oak" ? m : q, ...a), L, ...x) : hcMake(k, look, m, m2, c) };
  return hk;
}
function optBox(p, C, r) {   // N242: its back on the idea's wall, centred on its spot, its own size; on the floor or from the ceiling if so
  const a = p.ax === "z" ? 2 : 0, o = 2 - a, b = p.b.slice(), c = (b[a] + b[a + 3]) / 2, H = ST_CARRY.has(C.look) ? Math.max(C.h, b[4] - b[1]) : C.h;
  b[a] = c - C.w / 2; b[a + 3] = c + C.w / 2; if (p.flip) b[o] = b[o + 3] - C.d; else b[o + 3] = b[o] + C.d;
  if (C.on === "ceil") b[1] = b[4] - H; else { if (C.on === "floor") b[1] = r[4]; b[4] = b[1] + H; }
  return b.map(v => Math.round(v * 10) / 10);
}
const IDEA_AT = {};
function syncIdeas() {
  const H3 = R.HOUSE3, want = {};
  for (const i of IDEAS()) if ((H3.rooms || {})[i.room] && ideaOn(i.room).includes(i.id)) { const hk = ideaOptKey(i, ideaPick(i.room, i.id));
    i.parts.forEach((p, j) => { if (hk ? !j || i.each : HCAT[p.cat]) want[`idea.${i.id}.${j}`] = [i, p, hk]; }); }
  for (const id of Object.keys(IDEA_AT)) if (!want[id] || IDEA_AT[id] !== (want[id][2] || "-")) { delete H3.items[id]; delete IDEA_AT[id]; }
  for (const [id, [i, p, hk]] of Object.entries(want)) { if (IDEA_AT[id]) continue;
    const r = H3.rooms[i.room], a = p.ax === "z" ? 2 : 0, b = hk ? optBox(p, HCAT[hk], r) : p.b.slice(); IDEA_AT[id] = hk || "-"; ADDFK[id] = HCFK[String(r[4])];
    H3.items[id] = { n: hk ? HCAT[hk].n : i.n, k: "furniture", r: i.room, ax: p.ax, flip: p.flip, b, s: [b[a + 3] - b[a], b[4] - b[1], Math.round((b[1] - r[4]) * 10) / 10], g: false,
      al: Math.round((b[a] - r[a]) * 10) / 10, op: null, add: hk || p.cat, look: i.room, idea: i.id, fk: ADDFK[id] };
  }
}
function ideaKeep(room, ids) {   // the room's shown ideas, in the plan's order, each with its pick
  S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
  const v = ideasIn(room).map(i => i.id).filter(q => ids[q] != null).map(q => ids[q] ? `${q}:${ids[q]}` : q);
  if (v.length) o[28] = v.join(","); else delete o[28]; if (!Object.keys(o).length) delete S.fin[room];
  store.set(KEY, S); storeEdits(); finSchDraw();
}
function ideaSet(room, id) {   // one idea on or off; "*" all of the room's, "" none
  finPush(); const all = ideasIn(room).map(i => i.id), now = ideaOn(room);
  const L = id === "*" ? all : !id ? [] : now.includes(id) ? now.filter(q => q !== id) : [...now, id], one = IDEAS().find(i => i.id === id);
  ideaKeep(room, Object.fromEntries(L.map(q => [q, ideaPick(room, q)])));
  toast(one ? `${one.n}: ${L.includes(id) ? "shown (an idea to look at)" : "hidden"}` : `${roomName(room)}: ${L.length ? "its storage ideas shown" : "no storage ideas"}`);
}
function ideaChoose(room, id, key) {   // N242: the plan's idea (no key) or a shop's buy, shown
  finPush(); const ids = Object.fromEntries(ideaOn(room).map(q => [q, ideaPick(room, q)])); ids[id] = key || ""; ideaKeep(room, ids);
  const I = IDEAS().find(i => i.id === id), C = key && HCAT[ideaOptKey(I, key)]; toast(C ? `${C.n} · ${C.shop}` : `${I.n}: the plan's idea`);
}
function ideaCost(I, key) {   // N244: an idea's rough cost: a shop's buy its price (in each of its places if so), the plan's its made-to-the-spot range
  const hk = key && ideaOptKey(I, key), n = I.each ? I.parts.length : 1; if (hk) return [HCAT[hk].p * n, HCAT[hk].p * n];
  if (Array.isArray(I.cost)) return I.cost.slice(0, 2);
  const m = String(I.line || "").match(/£([\d,]+)(?:\s*[–-]\s*£?([\d,]+))?/), f = s => +s.replace(/,/g, ""); return m ? [f(m[1]), f(m[2] || m[1])] : [0, 0];
}
const ideaTray = room => { const L = ideasIn(room), on = ideaOn(room); if (!L.length) return "";
  return `<span class="r3d-finlab">Storage ideas (to look at)</span><div class="r3d-finsc" role="group" aria-label="Storage ideas">`
    + L.map(i => `<button type="button" data-finidea="${i.id}" aria-pressed="${on.includes(i.id)}">${i.n}</button>`).join("")
    + (L.length > 1 ? `<button type="button" data-finidea="${on.length === L.length ? "" : "*"}" aria-pressed="false">${on.length === L.length ? "None" : "All"}</button>` : "") + `</div>`; };
function ideaCard(k) {   // a tapped idea's piece: its one line, hide it; N242: ‹ › the plan's idea and each shop's buy, its size, fit, price and page
  const it = HIT(k), I = it && IDEAS().find(i => i.id === it.idea); if (!I) return null;
  const L = [null, ...(I.o || []).map(r => ideaOptKey(I, r[0]))], i = Math.max(0, L.indexOf(it.add)), C = L[i] && HCAT[L[i]];
  return [C ? C.n : I.n + " (an idea)", C ? hcLine(k, C) : I.line, [...(L.length > 1 ? hcNav(k, i, "hideago") : []), btn("Hide it", { hidea: `${it.look}:${I.id}` }),
    btn("This room's ideas", { actopen: `fin:${it.look}:5` })], null, L.length > 1 ? `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="The plan's idea">`
    + `<button type="button" data-hideago="${k}:0" aria-pressed="${!C}">The plan's idea</button></div>${hcShopTray(k, L, C, "hideago")}</div>` : null];
}
