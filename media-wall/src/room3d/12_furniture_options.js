/* ---------------------------------------------------------------- the furniture, by state */
const G = {};
let tvScreen;
function buildFurniture() {
  for (const [k, v] of Object.entries(SC.groups)) { G[k] = buildGroup(v, k); G[k].visible = false; scene.add(G[k]); }
  G.fixed.visible = G.frames.visible = true;
  const [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y;
  tvScreen = new THREE.Mesh(new THREE.PlaneGeometry((tx1 - tx0 - 1.2) * M, (ty1 - ty0 - 1.2) * M), new THREE.MeshStandardMaterial({ color: "#050506", roughness: 0.12, metalness: 0.2 }));
  tvScreen.position.copy(v3((tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z - 0.1)); tvScreen.rotation.y = Math.PI; scene.add(tvScreen);
  if (G.sofa) {      // v19: the sofa moves too: its group recentred on its footprint and handed to edit mode
    const so = R.SOFA, cx = (so.x[0] + so.x[1]) / 2, cz = (so.back + so.end) / 2, g = G.sofa;
    buildCushions(g);                                                                // v20: cushions to try (Decor), off by default
    scene.remove(g); g.position.set(cx * M, 0, -cz * M); g.visible = true; delete G.sofa;
    movable("sofa", "Your sofa", g, () => ({ x: cx, z: cz, rot: 0 }), so.x[1] - so.x[0], so.end - so.back, [], false, { when: () => S.sofa !== "bed" });
  }
  buildSofaBed();
}
/* V3.71, client (11 Nov 2026): "interchange my current sofa and ottoman with this sofabed and ottoman combination im thinking of buying ...
   to test sizing and fit"; "the blade green version". The room's sofa (S.sofa): yours, or the green corner sofa bed with its loose storage
   chaise, which stand in for your sofa and the navy ottoman. Its corner goes in your sofa's corner, its back on the same line; each part
   moves, turns and takes a colour in Edit as the others do. Sizes: geometry.SOFABED (fit.SOURCES "amelia"). */
/* V3.72, client: "Continue upgrading the quality and definition of the new sofa": upholstery that reads as upholstery. Each cushion swells
   in the middle and pinches at its seams (cushGeo), a soft chenille sheen, piping along the seats' fronts, button tufts as in the listing's
   photo, the headrests on their brackets, fabric pull loops, the bed's black steel frame once it's out, the chaise's tab and gas struts.
   Every part of a group is one draw per material (mergeStatic); the tufts are one shape a group */
/* V3.73: how far the shown sofa's open end is from your sofa's (the sofa bed's chaise reaches 62 further): what stands at the open end
   (the C-table, an idea since V3.74; the floor plant, the seagrass basket) moves with it */
function openEndShift() { return S.sofa === "bed" && R.SOFABED ? R.SOFABED.end_z - R.SOFA.end : 0; }
function cushGeo(w, h, d, crown = 1.2, bulge = 0.8, r = 3, lie = 0.25) {   // cm: the top's crown, the sides' swell, the edges' radius, the cloth's lie
  const n = 10, m = 3, g = new THREE.BoxGeometry(1, 1, 1, n, n, n), p = g.attributes.position, H = [w / 2 * M, h / 2 * M, d / 2 * M];
  const rr = Math.min(r * M, ...H.map(v => v * 0.45)), I = H.map(v => v - rr), cl = v => Math.max(-1, Math.min(1, v));
  const remap = (t, hh) => { const u = (t + 0.5) * n;               // a grid dense in the rounded edges, four spans across the flat
    return u <= m ? -hh + rr * u / m : u >= n - m ? hh - rr + rr * (u - n + m) / m : -hh + rr + (2 * hh - 2 * rr) * (u - m) / (n - 2 * m); };
  for (let i = 0; i < p.count; i++) {
    let x = remap(p.getX(i), H[0]), y = remap(p.getY(i), H[1]), z = remap(p.getZ(i), H[2]);
    const qx = cl(x / I[0]) * I[0], qy = cl(y / I[1]) * I[1], qz = cl(z / I[2]) * I[2], dx = x - qx, dy = y - qy, dz = z - qz, l = Math.hypot(dx, dy, dz);
    if (l > 1e-9) { x = qx + dx / l * rr; y = qy + dy / l * rr; z = qz + dz / l * rr; }   // onto the rounded edge
    const u = cl(x / I[0]), v = cl(y / I[1]), s = cl(z / I[2]);
    if (y > 0) y += crown * M * (1 - u * u) * (1 - s * s) * (y / H[1]);                   // the top crowns; the bottom stays flat
    x += (x / H[0]) * bulge * M * (1 - v * v) * (1 - s * s); z += (z / H[2]) * bulge * M * (1 - u * u) * (1 - v * v);   // the sides swell
    if (lie && y > 0) y += lie * M * Math.sin(x * 41 + w) * Math.sin(z * 37 + d) * (1 - u * u) * (1 - s * s) * (y / H[1]);   // V3.74: the cloth's slight lie
    if (lie && z > 0) z += lie * M * 0.6 * Math.sin(x * 33 + h) * Math.sin(y * 29 + w) * (1 - u * u) * (1 - v * v) * (z / H[2]);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  /* V3.74: each face mapped in real cm (a tile 20 cm), by the way it faces, so the chenille's weave is one size everywhere (a unit box's
     faces each took the whole tile, whatever their size: a headrest's weave was four times the chaise's) */
  const nr = g.attributes.normal, uv = g.attributes.uv, T = 0.2;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)), az = Math.abs(nr.getZ(i)), X = p.getX(i) / T, Y = p.getY(i) / T, Z = p.getZ(i) / T;
    if (ay >= ax && ay >= az) uv.setXY(i, X, Z); else if (ax >= az) uv.setXY(i, Z, Y); else uv.setXY(i, X, Y);
  }
  /* V3.81 (N137): the shade where a cushion meets what it rests on and its neighbours, in its own vertices (a colour the cloth's is
     multiplied by): its underside 0.55, its sides dark at the foot and clear by 60% up, its top untouched. On every path, so the cushions
     sit as GTAO makes them sit on a big card (the gaps between them, under the seats' fronts, where the backs meet the seats); no draw */
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const t = Math.min(1, Math.max(0, (p.getY(i) + H[1]) / (2 * H[1]) / 0.6)), k = nr.getY(i) < -0.6 ? 0.55 : 0.68 + 0.32 * t * t * (3 - 2 * t);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
function cush(g, x, y, z, w, h, d, mat, crown, bulge, r) {      // a cushion in a movable's own coordinates: x, z its centre, y its bottom
  const q = cushGeo(w, h, d, crown, bulge, r); if (!mat.vertexColors) q.deleteAttribute("color");   // V3.81 (N137): the shade only where the cloth takes it (the feet's steel merges with plain boxes)
  const m = new THREE.Mesh(q, mat); m.position.copy(v3(x, y + h / 2, z)); g.add(shadow(m)); return m;
}
function tufts(g, pts, mat) {                                       // [x, y, z] in a movable's coordinates: one mesh of sunk buttons
  const geos = pts.map(([x, y, z]) => { const b = new THREE.SphereGeometry(0.01, 8, 5); b.scale(1, 0.35, 1); const p = v3(x, y, z); b.translate(p.x, p.y, p.z); return b; });
  if (!geos.length) return null; const m = new THREE.Mesh(vcol(mergeGeometries(geos), mat), mat); g.add(m); return m;
}
function buildSofaBed() {
  /* V3.73, client: "an exact replica of the item I shared with you in look and size ... the lift up and out to get it out the storage then
     a clip back into be level with the seating area. Clean up all corners and shaping": the Amelia as its photos show it. The run (the
     arm with two stools under it, two seats over the pull-out bed), the corner section (its back running 165 down the side, the corner
     seat and a seat facing in), the loose chaise on the end; rounded upholstery throughout, the backs piped, square black feet */
  const B = R.SOFABED, so = R.SOFA; if (!B || !so) return;
  // V3.74: the chenille's own weave and heather (02 CHENILLE), a soft sheen at the edges as the pile catches the light
  const chen = (c, k) => reg(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.92, sheen: k, sheenRoughness: 0.45, sheenColor: new THREE.Color("#d4e0b0"), map: CHENILLE, bumpMap: CHENILLE_B, bumpScale: 0.7, vertexColors: true }));   // V3.81 (N137): the cushions' own shade
  const fab = chen(B.col, 0.9), seam = chen(new THREE.Color(B.col).multiplyScalar(0.62), 0.5);   // the chenille; its seams, a shade down
  const dimp = chen(new THREE.Color(B.col).multiplyScalar(0.8), 0.4);   // V3.75: the tufts are dimples in the cloth, as the photos (dark buttons read as dots)
  const steel = reg(new THREE.MeshStandardMaterial({ color: "#1e1e20", roughness: 0.4, metalness: 0.6 }));   // the feet and the bed's frame
  const lining = reg(new THREE.MeshStandardMaterial({ color: "#16181c", roughness: 0.95 }));
  const W = B.w, D = B.run_d, hw = W / 2, hd = D / 2, F = B.foot, t = B.back_t, sh = B.seat_h, cu = 14, base = sh - cu, L = -hd + B.sec_d;
  const xc = -hw + B.corner, xa = hw - B.arm, mid = (xc + xa) / 2, xi = -hw + t;   // the corner's edge, the arm's inside, between the seats, the side back's face
  const g = new THREE.Group(), tf = [], foot = (x, z) => cush(g, x, 0, z, 7, F + 1, 7, steel, 0, 0, 1);
  // V3.77 (N153): at rest (headrests down, stools in, bed in) the whole sofa bed is one draw a material (restMerge); its moving groups only while one moves
  const RS = { hr: [0, 0, 0, 0, 0], st: 0, bed: 0 }; let setRest = null; const sync = () => setRest && setRest(!RS.st && !RS.bed && RS.hr.every(v => !v));
  for (const x of [-hw + 5, xc, mid, xa + 2, hw - 5]) foot(x, -hd + 5);              // square black feet: the back, the run's front, the return's end
  for (const x of [xc + 4, mid, xa - 3]) foot(x, hd - 5);
  for (const x of [-hw + 5, xc - 5]) foot(x, L - 5);
  // the frame, upholstered: the run's back, the side back down the corner section, the corner section's base, the bed bay's deck and back
  cush(g, 0, F, -hd + t / 2, W, B.back_h - F, t, fab, 1, 0.8, 4);
  cush(g, -hw + t / 2, F, (-hd + t + L) / 2, t, B.back_h - F, L + hd - t, fab, 1, 0.8, 4);
  cush(g, (xi + xc) / 2, F, (-hd + t + L) / 2, xc - xi, base - F, L + hd - t, fab, 0, 0.6, 2);
  lb(g, mid, base - 1, t / 2, xa - xc, 1, D - t, fab);                               // the deck the seats sit on, over the bed's bay
  lb(g, mid, F, -hd + t + 1, xa - xc, base - 1 - F, 2, lining, false);               // the bay's back, dark, seen with the bed out
  pipe(g, 0, B.back_h - 1.2, -hd + t - 1.2, W - 6, seam, true); pipe(g, xi - 1.2, B.back_h - 1.2, (-hd + t + L) / 2 + 1, L + hd - t - 4, seam);
  // the arm: a deep bridge, the two stools tucked under it from the side (they stand a little proud of it, as in the photos)
  const ax = (xa + hw) / 2;
  cush(g, ax, B.arm_h - 20, 0, B.arm, 20, D, fab, 1.4, 0.8, 6);
  for (const z of [-hd + 3, hd - 3]) cush(g, ax, F, z, B.arm, B.arm_h - 20 - F + 2, 6, fab, 0, 0.5, 2);
  cush(g, xa + 2, F, 0, 4, B.arm_h - 20 - F + 2, D - 10, fab, 0, 0.3, 1);
  for (const x of [xa + 1.5, hw - 1.5]) pipe(g, x, B.arm_h - 1.8, 0, D - 10, seam);
  pipe(g, ax, B.arm_h - 1.8, hd - 1.6, B.arm - 8, seam, true);
  // V3.74, client: "Give function to move its built in side seats": the two stools slide out of the arm's side together (Pull the stools
  // out), to sit on or put your feet up; one group, so one draw a material
  const T_ = B.stool, tx = hw - T_.w / 2 + 3, stG = new THREE.Group(), stTf = []; g.add(stG);
  for (const z of [-T_.d / 2 - 1, T_.d / 2 + 1]) { cush(stG, tx, 4, z, T_.w, T_.h - 4, T_.d, fab, 1.5, 0.7, 4);
    pipe(stG, tx, T_.h - 0.6, z + T_.d / 2 - 0.8, T_.w - 4, seam, true); for (const dx of [-0.22, 0.22]) stTf.push([tx + dx * T_.w, T_.h + 1.3, z]);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) lb(stG, tx + dx * (T_.w / 2 - 4), 0, z + dz * (T_.d / 2 - 4), 4, 4, 4, steel); }
  tufts(stG, stTf, dimp); mergeStatic(stG);
  WORK.stools = anim(v => { stG.position.x = -B.stool_out * v * M; RS.st = v; sync(); });
  // the seats: two over the bed, the corner seat, the return's seat facing in; piped fronts, two buttons each
  const sz0 = hd - B.seat_d - 1, bz = (-hd + t + sz0) / 2, bd = sz0 + hd - t, crown = 1.6, sx = xi + bd;
  const seat = (x0, x1, z0, z1, pipeFront) => { const w_ = x1 - x0 - 1, d_ = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    cush(g, cx, base, cz, w_, cu, d_, fab, crown, 0.9, 3.5);
    if (pipeFront) { pipe(g, cx, base + cu - 0.8, z1 + 0.2, w_ - 5, seam, true); pipe(g, cx, base + 0.8, z1 + 0.2, w_ - 5, seam, true); }
    for (const f of [-0.25, 0.25]) for (const k of [-0.22, 0.22]) tf.push([cx + f * w_, base + cu + crown * 0.8 - 0.25, cz + k * d_]); };   // V3.74: four buttons a seat, as the photos
  seat(xc, mid, sz0, hd - 1, true); seat(mid, xa, sz0, hd - 1, true); seat(sx, xc, sz0, hd - 0.5, false); seat(sx, xc, hd + 0.5, L - 1, true);
  // the backs: three along the run (the corner's in its corner), two down the side, leaning back, up to the headrests (V3.75: 81, the frame's top)
  for (const [x0, x1] of [[xc, mid], [mid, xa], [xi, xc]]) { const c = cush(g, (x0 + x1) / 2, sh, bz, x1 - x0 - 1, B.back_h - sh - 3, bd, fab, 2.2, 1.4, 6); c.rotation.x = -0.1; }
  for (const [z0, z1] of [[bz + bd / 2, hd - 0.5], [hd + 0.5, L - 1]]) { const c = cush(g, xi + bd / 2, sh, (z0 + z1) / 2, bd, B.back_h - sh - 3, z1 - z0, fab, 2.2, 1.4, 6); c.rotation.z = -0.1; }
  /* V3.75, client: "The headrests look like they just flip upwards but current render has armed lifts on making the headrest lift with a
     gap in between it and the sofa": the listing's Clic-Clac headrests. Each is a pad lying on the back frame (B.head: 30 deep, 14 thick, 8
     over the frame's front onto the back cushion's top), hinged at the frame's front top edge; Raise flips it up 74° on that hinge, its foot
     tucked behind the back cushion, as the photos' raised one: no stems, no gap. The five of the photos (three along the back: the arm's
     seat, the middle, the corner; two down the side: the corner, the end), one group each */
  const HD = B.head, hup = HD.up * Math.PI / 180; WORK.hr = [];
  const headrest = (x, z, span, side) => { const hg = new THREE.Group(), w_ = Math.min(HD.w, span - 2); hg.position.copy(v3(x, B.back_h, z)); g.add(hg);
    if (side) cush(hg, HD.over - HD.d / 2, 0, 0, HD.d, HD.t, w_, fab, 1.3, 1.1, 5.5); else cush(hg, 0, 0, HD.over - HD.d / 2, w_, HD.t, HD.d, fab, 1.3, 1.1, 5.5);
    mergeStatic(hg);
    const i = WORK.hr.length; WORK.hr.push(anim(v => { if (side) hg.rotation.z = hup * v; else hg.rotation.x = hup * v; RS.hr[i] = v; sync(); })); };
  for (const [x0, x1] of [[mid, xa + 12], [xc, mid], [xi, xc]]) headrest((x0 + x1) / 2, -hd + t, x1 - x0, false);   // the arm seat's over the arm's back too
  for (const [z0, z1] of [[bz + bd / 2, hd - 0.5], [hd + 0.5, L - 1]]) headrest(xi, (z0 + z1) / 2, z1 - z0, true);
  for (const [x, z, ry] of [[xi + 32, bz + 26, -0.7], [xa - 26, bz + 22, 0.15]]) {   // the two scatter cushions, plump, sat back against the backs (V3.74)
    const m = new THREE.Mesh(cushGeo(44, 44, 15, 0, 4.5, 9, 0.4), fab); m.position.copy(v3(x, sh + 20, z)); m.rotation.order = "YXZ"; m.rotation.y = ry; m.rotation.x = -0.26; g.add(shadow(m)); }
  tufts(g, tf, dimp);
  /* the pull-out bed. Stowed under the deck, its fabric front (two loops to pull by, castors under it) is the sofa's face under the seats.
     It pulls up and out on its castors, past where it rests (bed_over); its padded top lifts on the black frame to the seats' height; it
     clips back against the seats, level with them, and settles on its castors. Backwards to put it away */
  const bed = new THREE.Group(), top = new THREE.Group(); g.add(bed); bed.add(top);
  const bw = xa - xc - 2, ud = B.bed_out, uz0 = hd - ud, top0 = base - 1.5, rise = sh - top0, over = B.bed_over;
  cush(bed, mid, 4, hd - 2, bw, top0 - 4.5, 4, fab, 0, 0.3, 1.2);
  pipe(bed, mid, top0 - 1, hd + 0.1, bw - 6, seam, true);
  for (const dx of [-0.25, 0.25]) { const lp = new THREE.Mesh(vcol(new THREE.TorusGeometry(0.035, 0.007, 6, 14, Math.PI), fab), fab);
    lp.position.copy(v3(mid + dx * bw, top0 - 3, hd + 0.6)); lp.rotation.z = Math.PI; lp.scale.y = 2.6; bed.add(shadow(lp)); }
  for (const dx of [-1, 1]) { lb(bed, mid + dx * (bw / 2 - 6), 0, hd - 6, 3.2, 4, 3.2, steel); lb(bed, mid + dx * (bw / 2 - 3), 6, (uz0 + hd - 4) / 2, 2, 2, ud - 6, steel, false); }
  cush(top, mid, 14, (uz0 + hd - 4) / 2, bw - 2, top0 - 14, ud - 4, fab, 1.2, 0.6, 3);
  tufts(top, [-0.3, 0, 0.3].flatMap(f => [-0.25, 0.25].map(k => [mid + f * bw, top0 + 1.0 - 0.25, (uz0 + hd - 4) / 2 + k * (ud - 4)])), dimp);
  for (const z of [uz0 + 6, hd - 12]) lb(top, mid, 12, z, bw - 14, 2, 2, steel, false);
  for (const dx of [-1, 1]) lb(top, mid + dx * (bw / 2 - 8), 12, (uz0 + hd - 4) / 2, 2, 2, ud - 10, steel, false);   // the platform's black frame
  mergeStatic(bed); mergeStatic(top);
  /* V3.75: the lift as the photos show it: on each side two black links crossed in an X (a scissor) between the rail on the floor and the
     platform's frame, opening as the top rises (they were four posts hanging under the top). Their own group, hidden while it's stowed */
  const lk = new THREE.Group(), za = uz0 + 8, zb = hd - 14, links = []; bed.add(lk);
  for (const dx of [-1, 1]) for (const k of [0, 1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 8), steel);
    m.position.x = v3(mid + dx * (bw / 2 - 5), 0, 0).x; lk.add(shadow(m)); links.push([m, k]); }
  const linkAt = b => { const yT = 12 + rise * b;
    for (const [m, k] of links) { const z0 = k ? zb : za, z1 = k ? za : zb, dy = yT - 7, dz = z1 - z0;
      m.position.y = (7 + dy / 2) * M; m.position.z = (z0 + dz / 2) * M; m.rotation.x = Math.atan2(dz, dy); m.scale.y = Math.hypot(dy, dz) * M; } };
  const sm = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  WORK.sbed = anim(v => { const a = sm(v / 0.5), b = sm((v - 0.5) / 0.3), c = sm((v - 0.8) / 0.2);
    bed.position.z = ((ud + over) * a - over * c) * M; bed.position.y = 3 * (a - c) * M; top.position.y = rise * b * M; lk.visible = a > 0.3; linkAt(b); RS.bed = v; sync(); });
  const cx = so.x[0] + hw, cz = so.back + hd, live = new THREE.Group();
  while (g.children.length) live.add(g.children[0]); g.add(live); mergeStatic(live); setRest = restMerge(g, live, [lk]); sync();
  movable("sofa2", B.name, g, () => ({ x: cx, z: cz, rot: 0 }), W, D, [fab], false, { when: () => S.sofa === "bed", tints: [[seam, 0.62], [dimp, 0.8]] });   // V3.78 (N135): Edit's colour reaches its seams and dimples
  // the loose storage chaise on the corner section's end: a buttoned lid lifting on its back edge on two gas struts (the ottoman's Lift
  // the lid), a fabric loop on its front to lift it by, black lining, square black feet
  const C = B.chaise, c = new THREE.Group(), lidH = C.lid, bodyH = C.h - lidH;
  // V3.78 (N135): its own cloth (it shared the sofa's, so recolouring the sofa in Edit was undone as the chaise was placed), following the sofa's colour unless it has its own
  const fabC = chen(B.col, 0.9), seamC = chen(new THREE.Color(B.col).multiplyScalar(0.62), 0.5), dimpC = chen(new THREE.Color(B.col).multiplyScalar(0.8), 0.4);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) cush(c, dx * (C.w / 2 - 6), 0, dz * (C.d / 2 - 6), 7, F + 1, 7, steel, 0, 0, 1);
  cush(c, 0, F, 0, C.w, bodyH - F, C.d, fabC, 0, 0.6, 2.5);
  lb(c, 0, bodyH - 0.4, 0, C.w - 6.2, 0.5, C.d - 6.2, lining, false);               // the storage's black floor and walls, seen with the lid up
  for (const [x, z, w_, d_] of [[0, -(C.d - 6.5) / 2, C.w - 6.4, 0.3], [0, (C.d - 6.5) / 2, C.w - 6.4, 0.3], [-(C.w - 6.5) / 2, 0, 0.3, C.d - 6.4], [(C.w - 6.5) / 2, 0, 0.3, C.d - 6.4]])
    lb(c, x, bodyH - 22, z, w_, 22, d_, lining, false);
  lb(c, 0, bodyH - 22, 0, C.w - 6.2, 0.3, C.d - 6.2, lining, false);
  { const lp = new THREE.Mesh(vcol(new THREE.TorusGeometry(0.03, 0.006, 6, 14, Math.PI), fabC), fabC); lp.position.copy(v3(-C.w / 2 + 22, bodyH - 4, C.d / 2 + 0.7)); lp.rotation.z = Math.PI; lp.scale.y = 1.8; c.add(shadow(lp)); }
  const hinge = new THREE.Group(); hinge.position.copy(v3(0, bodyH, -C.d / 2)); c.add(hinge);
  cush(hinge, 0, 0, C.d / 2, C.w, lidH, C.d, fabC, 1.4, 0.8, 3.5);
  pipe(hinge, 0, 0.6, C.d + 0.2, C.w - 6, seamC, true);
  lb(hinge, 0, -0.2, C.d / 2, C.w - 6, 0.3, C.d - 6, lining, false);
  tufts(hinge, [-0.3, 0, 0.3].flatMap(f => [-0.22, 0.22].map(k => [f * C.w, lidH + 1.2 - 0.25, C.d / 2 + k * C.d])), dimpC);
  const struts = new THREE.Group(); c.add(struts);
  for (const x of [-(C.w / 2 - 8), C.w / 2 - 8]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), steel);
    st.position.copy(v3(x, bodyH + 2, -C.d / 2 + 14)); st.rotation.x = -0.7; struts.add(st); }
  mergeStatic(hinge); mergeStatic(struts);
  const live2 = new THREE.Group(); while (c.children.length) live2.add(c.children[0]); c.add(live2); mergeStatic(live2);
  const setRest2 = restMerge(c, live2, [struts]);   // V3.77 (N153): the chaise one draw a material with its lid shut
  WORK.lid2 = anim(v => { hinge.rotation.x = -1.5 * v; struts.visible = v > 0.85; setRest2(!v); });
  movable("chaise2", "Its storage chaise", c, () => ({ x: so.x[0] + C.w / 2, z: so.back + B.sec_d + C.d / 2, rot: 0 }), C.w, C.d, [fabC], false, { when: () => S.sofa === "bed", follow: "sofa2", tints: [[seamC, 0.62], [dimpC, 0.8]] });
}
let bar1, bar2;

/* ---------------------------------------------------------------- apply the options */
function drop(group, list) {   // take a fixture and its lights out of the scene, freeing their GPU memory
  fixtures.remove(group);
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  list.forEach(l => { scene.remove(l, l.target); if (l.shadow && l.shadow.map) l.shadow.map.dispose(); });
  list.length = 0;
}
let built = {};
function applyState() { const out = livShow(); try { setState(); } finally { if (out) livingFromOutside(); } }   // V2.98 (N37): from outside, a setting changed kept the living room shown (+91 draws)
function setState() {
  solidDirty();
  S.site = "C"; S.cab = "compact"; if (S.cabw !== "80") S.cabw = "90";   // v33, client: "the compact cabinet is our only choice for the table now"
  if (cab && cab.userData.w !== cabC().top[0]) rebuildCab();
  G.unit_in.visible = !S.drawers; G.unit_out.visible = S.drawers;
  const b2k = fixKey("bar2"), b1k = fixKey("bar1");   // N120: bar 2's heads are the same whatever the table does (v17)
  if (built.bar2 !== b2k) { if (bar2) drop(bar2, lights.bar2); bar2 = buildBar(R.BAR2, lights.bar2, "bar2"); built.bar2 = b2k; }
  if (bar1 && built.bar1 !== b1k) { drop(bar1, lights.bar1); bar1 = buildBar(R.BAR1, lights.bar1, "bar1"); }   // v38: turned or aimed
  built.bar1 = b1k;
  const lk = S.lamp + JSON.stringify(S.layout.lamp || {}) + fixKey("lamp");
  if (built.lamp !== lk) { buildLamp(); built.lamp = lk; }
  if (G.now_ledge) G.now_ledge.visible = !(S.plants === "breast" && S.sugg.alcoveshelves) && !(S.sugg.barcase && caseBreast());   // V3.14: it moves with the records; v34: the drinks cabinet takes its place
  placeChairs();                                                                   // v20: the chair cupboard, its doors, the chairs in it
  placeWork();                                                                     // v34: the blind, the records, the trolley
  applyDecor();                                                                    // v20: the rug, cushions, curtains, the case's fill and frame
  applySvar();                                                                     // v28: the suggestions' versions
  placeAll();
  repaint();
  applyLight();
  adoptLights(scene);                                                              // v35: new lights (a rebuilt bar or lamp) join the fixed set
  updateCaption();
  store.set(KEY, S);
  try { applyNow(); } catch (e) {}                                       // v39: the ledge's LP
  dirty();
}
/* v46, client: "default view could balance lighting throughout the room using all fixtures ... then optimise and upgrade settings":
   Warmth, one setting for every warm-white light (candle-warm to neutral white; the middle is the bulbs' warm white), unless you've
   given a light its own colour */
const WARMTH = [new THREE.Color("#ffbf86"), new THREE.Color(WARM), new THREE.Color("#fff3e4")];   // candle-warm, the bulbs' warm white, neutral
function warmColour() { const w = Math.max(0, Math.min(100, S.warm ?? 50)) / 50; return w <= 1 ? WARMTH[0].clone().lerp(WARMTH[1], w) : WARMTH[1].clone().lerp(WARMTH[2], w - 1); }
/* v44: the room's reflections by surface: glass, the TV and gloss pots catch more of them, matte paint and fabric less. v48 §2: the window
   by night is a faint mirror of the lit room over the dusk garden (as real glass is), by day a light sky sheen */
function envLevels(day) {
  const own = ENV.tex && scene.environment === ENV.tex, g = own ? ENV.gain : 1;
  if (winGlass) { winGlass.userData.envK = day ? 0.4 : 1.2; winGlass.opacity = day ? 0.06 : 0.1; }
  glassAll();   // V3.52 (N104): the house's windows by the time of day
  MATS.forEach(m => { if (!("envMapIntensity" in m)) return;
    if (m.userData.envK === undefined) m.userData.envK = m.roughness < 0.25 ? 2.4 : m.roughness < 0.5 ? 1.5 : m.roughness > 0.85 ? 0.7 : 1;
    m.envMapIntensity = (day ? 0.16 : 0.12) * m.userData.envK * g; });   // v50: day 0.25 → 0.16, less washed
}
/* v48 §3: reflections from the room itself, not a stock studio. A cube camera in the middle of the room takes it in six directions once
   the room has changed and settled (1.2 s), in HD on a real graphics card (where the room already draws into a target of the same kind,
   so no new shaders) and in every saved picture; phones and Fast keep the studio. */
const ENV = { rt: null, cam: null, pm: null, tex: null, studio: null, t: 0, gain: 0.8 };
function roomEnv() {
  if (!started) return;
  if (S.tod === "day") { if (ENV.studio && scene.environment !== ENV.studio) { scene.environment = ENV.studio; envLevels(true); } return; }   // by day the bright garden in the window swamped it: the studio stays
  if (!ENV.rt) { ENV.rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType }); ENV.cam = new THREE.CubeCamera(0.05, 40, ENV.rt); ENV.pm = new THREE.PMREMGenerator(gl); }
  ENV.cam.position.copy(v3(R.W / 2, 125, (R.WINDOW_Z + R.RECESS_Z) / 2));
  /* the whole room, not the cutaway. N54: by its cut put out of the way (as updateCut does standing in the room), not by switching cutting
     off: off, the room drew through shaders of its own, about 20 built on the spot a second after you came in from the house (seconds on a PC) */
  const A = CLIP[0], an = A.normal.clone(), ak = A.constant; A.normal.set(0, 0, 1); A.constant = 1e3;
  const sunI = sun ? sun.intensity : 0; if (sun) sun.intensity = 0;            // the sun's patch stays out of the reflections (it lit the room twice)
  try { ENV.cam.update(gl, scene); } finally { A.normal.copy(an); A.constant = ak; if (sun) sun.intensity = sunI; }
  const t = ENV.pm.fromCubemap(ENV.rt.texture).texture;
  if (ENV.tex) ENV.tex.dispose();
  ENV.tex = t; scene.environment = t; envLevels(S.tod === "day"); dirty();
}
const BLOOM = [16, 0.3, 0.3];   // threshold (linear, before exposure), strength, radius
function bloomLevels(day) {   // only the light sources glow: by evening, above the brightest lit wall; never by day (the walls are brighter)
  if (AO.b) { const [th, st, rad] = AO.bt || BLOOM; AO.b.enabled = !day && AO.bloom !== false; AO.b.threshold = th; AO.b.strength = st; AO.b.radius = rad; }
}
function envSoon() {
  clearTimeout(ENV.t);
  if (started && aoLive()) ENV.t = setTimeout(roomEnv, 1200);
  else if (ENV.studio && scene.environment !== ENV.studio) { scene.environment = ENV.studio; envLevels(S.tod === "day"); }
}
let lastTod = null;   // V1.15: the time of day applyLight last saw
function blindsApply() { if (HMATS && HMATS.blind_cloth) HMATS.blind_cloth.visible = !!S.blinds; }   // V1.47, the client: "pull blinds up ... give ability to close them": rolled up unless pulled down
function applyLight() {
  blindsApply();
  placeRoomLights();                                          // v69: a room of the house: its ceiling lights, day or evening
  const day = S.tod === "day" || S.view === "house", hd = S.quality === "hd";   // V1.3: the whole house by day (inside, the rooms keep the time you set)
  const L = {}; LAYERS.forEach(k => L[k] = lvl(k));          // v15: the sliders (a scene button fills them in), times the master
  const warmC = warmColour();                                 // v46: Warmth
  const set = (list, lv) => list.forEach(l => {
    l.intensity = (l.userData.k || 1) * Math.pow(lv / 100, 1.6);
    l.visible = lv > 0;
    if (l.userData.colKey) { const c = S.col[l.userData.colKey]; if (c && c !== WARM) l.color.set(c); else l.color.copy(warmC); }   // the smart bulbs' colour, or Warmth
    else if (l.userData.warm) l.color.copy(warmC);
    if (l.isSpotLight) { l.castShadow = hd && lv > 0; if (l.userData.glow) l.userData.glow.material.color.set(lv > 0 ? (S.col[l.userData.colKey] || "#fff3dc") : "#3a3a3a"); }
  });
  const area = hd ? 1 : 0;      // Fast leaves out the area lights (the most expensive) and lifts the fill to make up
  set(lights.strip, L.strip * area); set(lights.uprights, L.uprights * area); set(lights.bias, L.bias * area); set(lights.bar1, L.bar1); set(lights.bar2, L.bar2);
  if (!hd) for (const bar of [lights.bar1, lights.bar2]) bar.forEach((l, i) => {   // v22: Fast lights each bar with two of its four heads (v46: 1.6 times as bright, the fill does the rest)
    if (i % 2) l.visible = false; else l.intensity *= 1.6; });
  lights.fill.forEach(l => { const lv = hd ? 0 : L[l.userData.fill]; l.intensity = l.userData.k * Math.pow(lv / 100, 1.6); l.visible = lv > 0;
    if (l.userData.colKey) { const c = S.col[l.userData.colKey]; l.color.copy(c && c !== WARM ? new THREE.Color(c) : warmC); } else l.color.copy(warmC); });
  set(lights.lamp, (S.layout.lamp || {}).off ? 0 : L.lamp);  // v15: the lamp's colour bulbs dim in their app (v18: or it's been removed)
  scene.traverse(o => { if (o.isLight && o.userData.accent) o.intensity = o.userData.accent * 1.5 * Math.pow(L.accent / 100, 1.6); });   // v46: Accents (70 is about the old fixed level)
  for (const l of [...lights.bar1, ...lights.bar2, ...lights.lamp]) {   // v38: each head's own switch, level and colour
    const h = headOf(l.userData.hk); if (!l.userData.hk || !Object.keys(h).length) continue;
    const g = l.userData.glow;
    if (h.on === false) { l.intensity = 0; if (g) g.material.color.set("#3a3a3a"); continue; }
    if (h.lv !== undefined) l.intensity = l.intensity * Math.pow(Math.max(0, Math.min(100, h.lv)) / 100, 1.6);
    if (h.col) { l.color.set(h.col); if (g && l.intensity > 0) g.material.color.set(h.col); }
  }
  capShadows(hd ? SHADOW_CAP : 0);                            // v18: never more shadowed spots than the graphics card can take
  set(lights.tv, L.bias > 0 && hd ? 100 : 0);
  ledMat.color.set(L.strip > 0 ? "#ffd9a8" : "#5a5248").multiplyScalar(L.strip > 0 ? 0.6 + L.strip / 100 * 1.4 : 1);
  runLed.color.set(L.uprights > 0 ? (S.col.strips || "#ffd9a8") : "#5a5248").multiplyScalar(L.uprights > 0 ? 0.6 + L.uprights / 100 * 1.4 : 1);   // v16: smart colour strips
  ceilMat.emissiveIntensity = 0.55 * Math.pow(L.strip / 100, 1.2);
  tvScreen.material = S.ideas.sync ? screenFilm : L.bias > 0 ? screenOn : screenOff;   // v32: the backlight idea plays a film
  lboxFace.material.color.set(S.lbox && !day ? "#ffffff" : "#5a5a5e");
  laserDots.visible = S.laser && !day;
  if (pcGlow) { pcGlow.visible = !!S.pc; pcLight.visible = !!S.pc; }
  for (const [k, g] of Object.entries(IDEA_G)) g.visible = k === "case" ? caseOn() : !!S.ideas[k];          // v17: ideas, off by default
  if (G.frames) G.frames.visible = !caseBreast();                                                             // the case replaces the frames
  placeCorner();
  if (G.frames) G.frames.position.y = S.site !== "A" && S.plants === "breast" ? 0.3 : 0;                        // v18.1: up 30 over the 158 plant stand
  if (ideaLed) ideaLed.color.set(day ? "#8a8578" : "#fff1d6");
  curtShut.visible = !!S.curtains; curtOpen.visible = !S.curtains;
  win.intensity = day ? 70 : 11; win.color.set(day ? "#eef0f2" : "#7d89b8");   // v47.1: dusk light, not black (v50: a softer, less blue day)
  view.material.color.set(day ? "#dfe6ec" : "#1d2535");   // v56: a plain sky (by day V1.5 shows the modelled outside instead)
  // bounce light: a real room's walls relight it; this stands in for that, in proportion to what's on. v15: more of it, so the room
  // reads evenly lit rather than as pools under each head
  const on = (L.strip * 1.0 + L.uprights * 0.3 + L.bar1 * 0.5 + L.bar2 * 0.5 + L.lamp * 0.35 + L.accent * 0.06 + (L.bias > 0 ? 8 : 0) + (S.lbox ? 4 : 0)) / 100;
  hemi.intensity = day ? 0.3 + (hd ? 0 : 0.25) : 0.04 + on * 0.26 + (hd ? 0 : (L.strip * 0.0075 + L.uprights * 0.0015 + (L.bias > 0 ? 0.08 : 0)));   // v50: less bounce, more shape
  win.visible = hd || day;
  envLevels(day); bloomLevels(day);
  if (sun) sun.intensity = sunLux();                                                      // v48 §6: the sun, by day in HD
  envSoon();
  gl.toneMappingExposure = S.view === "house" && R.HOUSE3 ? 0.32 : day ? 0.4 : 0.58;   // V3.19, the client: "all lighting the same across the house": every room one exposure (the house's rooms had 0.32 by day), the outside a little lower
  const outside = HOUSEV(S.view);                                                    // v58: the built house in daylight
  skyFill.intensity = outside ? (day ? (hd && ROOMV() && WINLIGHTS.some(l => l.visible) ? 1.4 : 2.6) : 0.5) : hd ? 0 : day ? 3.5 : 1;   // V3.30: a room with windows, by day in HD: less even fill, more from its windows and light (it read flat and grey)               // V3.19: Fast's living room (no window light) as bright as the other rooms
  const inK = !!ROOMV();                                                                // v60: in a room of the house, light off its pale floor and walls,
  const sky = outside && !inK; skyFill.color.set(sky ? "#dfe8f1" : hemi.color); skyFill.groundColor.set(sky ? "#5d5446" : "#d9d3c9");   // V3.19: the rooms' fill the living room's tint (it was the sky's blue); the living room's own lights stay upstairs
  if (inK) { scene.traverse(l => { if (l.isLight && l !== skyFill && l !== sun && !l.userData.houseLight) l.intensity = 0; }); hemi.intensity = day ? (hd && WINLIGHTS.length ? 0.38 : 0.5) : 0.2; }   // V2.39: by day in HD the window lights (less even fill); V3.30: the sun, the room's light and its windows' kept (a second change of a light, Warmth, put them out)   // every light of the living room's, the spots too
  /* V2.21 (REAL_PLAN R1): by evening in a room of the house its own ceiling light lights it: the even fill and the studio's reflections
     down (they lit every corner alike), the light up (09_house_views.js placeRoomLights): a warm pool, the corners falling off */
  if (inK && !day && hd) { hemi.intensity = 0.08; skyFill.intensity = 0.2; }   // V3.34 (N86): an evening in HD lit by its own light (the 0.5 fill washed every wall alike)
  houseEnvK(inK && !day ? (hd ? 0.25 : 0.35) : 1);
  scene.background.set(outside && R.HOUSE3 ? (day ? "#c6d6e3" : "#1b2233") : "#0d100e");             // and a sky behind it
  if (gl.shadowMap.enabled !== hd) { gl.shadowMap.enabled = hd; MATS.forEach(m => m.needsUpdate = true); sizeRenderer(); if (LIVE && started) precompile(); }
  if (started) { if (ROOMV() && S.tod !== lastTod) applyFloors(); else outdoor(); lastTod = S.tod; }   // V1.5: day or evening changes the living room's window; V1.15: and a room's (applyFloors ends in outdoor), only when it changes (not each slider move)
  reshadow();
  dirty();
}
const screenOff = new THREE.MeshStandardMaterial({ color: "#050506", roughness: 0.12, metalness: 0.2 });
const screenOn = new THREE.MeshBasicMaterial({ map: SCREEN_TEX, toneMapped: false, color: "#d8d8d8" });
const screenFilm = new THREE.MeshBasicMaterial({ map: FILM_TEX, toneMapped: false, color: "#d8d8d8" });

