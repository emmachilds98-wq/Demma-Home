/* v26: option C, the dining cabinet; v27: the plan, made for six; v29: two sliding doors (OPTC). v30, client: "is there anyway you can
   optimise the dining cabinet build to fit the chairs in a better way so the cabinet doesnt have to be so big", "show me both versions":
   the compact cabinet (CAB) is the plan (V3.04, N47: the sliding one's paths gone; it was never built after v39). S.site "C"; S.dining folded /
   four / six; S.chairs "open" opens the chair door (the table folded); S.tdoor opens the table door with the table still folded.
   The doors move by tween (cabTween), so a tap in the room swings or slides them; a still (R3D.set) snaps them. */
const cabC = () => (S.cabw === "80" && R.CAB80 ? R.CAB80 : R.CAB);   // v30: the cabinet on show; v33: its 80-wide version
/* v32: everything in the cabinets that moves is an "anim": one number p, 0 to 1, and what it does to the model (a door's swing or
   slide, a chair drawn out, the table's joints); twTo eases p, the show sets it from its own clock */
const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const anim = (fn, p = 0) => { const a = { p, set(v) { a.p = v; fn(v); } }; a.set(p); return a; };
const RIG = [0, 0.2, 0.35, 0.55, 0.8, 0.9, 1];   // the table's p at: tilted out, first legs down, level, second half over, its legs down, flat
let CK = null;
function cabKit() {      // the parts both cabinets share: materials, the table standing up and open, the chairs round it and folded
  if (CK) return CK;
  const mat = o => reg(new THREE.MeshStandardMaterial(o));
  const K = {
    oak: mat({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }),
    oakV: mat({ color: "#c48c57", map: OAK_TEX_V, roughness: 0.55 }),     // the doors and the ends: the grain upright
    oakIn: mat({ color: "#b5845a", map: OAK_TEX, roughness: 0.65 }),
    oakEnd: mat({ color: "#b98250", map: OAK_TEX, roughness: 0.55 }),     // the breadboard ends, a touch darker
    dark: mat({ color: "#241f1b", roughness: 0.9 }),
    beech: mat({ color: "#d4b58c", map: OAK_TEX, roughness: 0.6 }),       // the folding chairs
    pad: mat({ color: "#8e9a80", roughness: 0.95 }),                      // sage linen seat pads
    linen: mat({ color: "#8f7d69", roughness: 0.97 }),                    // v33: the padded chairs' linen, the colour of your photo
    linenBtn: mat({ color: "#6e5f4f", roughness: 0.8 }),                  // their buttons
    steel: mat({ color: "#c9cbcd", roughness: 0.3, metalness: 0.9 }),     // v30: the piano hinges' knuckles
    plate: mat({ color: "#f4f1ea", roughness: 0.35 }),
    cloth: ["#efe7d8", "#8e9a80", "#c7643a"].map(c => mat({ color: c, roughness: 0.95 })),
  };
  K.bx = (g, x, y, z, w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), m); me.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); g.add(shadow(me)); return me; };
  K.rbx = (g, x, y, z, w, h, d, m, r = 0.6) => { const me = new THREE.Mesh(new RoundedBoxGeometry(w * M, h * M, d * M, 2, Math.min(r, Math.min(w, h, d) / 2.2) * M), m); me.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); g.add(shadow(me)); return me; };
  // v32, client: "slow down the playback of the table opening to show clearly how it puts together and opens": the table jointed as it
  // is built. The first half turns on the piano hinge at the rail (C.pivot), the second on the flip-top hinges at the joint (folded,
  // it lies face down on the first), each leg on its bracket under its apron. One number runs it (rig.p): 0 folded, standing on the
  // rail; 1 open on its four legs. On the way (RIG): the pair tilts out, the first legs fold down, it lowers onto them, the second half
  // flips over, its legs fold down, it lies flat.
  K.tableRig = C => {
    const root = new THREE.Group(), [tw, , tt] = C.top, [tz0, tz1] = C.tz, ap = C.apron, [px, py] = C.pivot, [tx0, tx1] = C.tx, jx = C.joint_x;
    const hinge = new THREE.Group(), joint = new THREE.Group(), half = [new THREE.Group(), new THREE.Group()], legs = [[], []];
    hinge.position.copy(v3(px, py, 0)); joint.position.copy(v3(jx, py + tt + 0.15, 0)).sub(hinge.position);
    root.add(hinge); hinge.add(joint);
    // built open in room cm, the first half (by the rail) then the second: each a centre of staves between two breadboard ends, the
    // corners eased; its aprons
    [[jx, tx1], [tx0, jx - 0.15]].forEach(([a, b], i) => {
      K.rbx(half[i], a + 7, py, tz1, b - a - 14, tt, tw, K.oak, 0.5);
      for (const e of [a, b - 7]) K.rbx(half[i], e, py, tz1, 7, tt, tw, K.oakEnd, 0.6);
    });
    [[jx + 0.2, tx1 - ap], [tx0 + 3, jx - 3]].forEach(([a, b], i) => {
      for (const z of [tz1 + 4, tz0 - 6]) K.bx(half[i], a, py - ap, z, b - a, ap, 2, K.oakIn);
      for (const x of [a, b - 2]) K.bx(half[i], x, py - ap, tz1 + 6, 2, ap, tw - 12, K.oakIn);
    });
    // the four tapered legs, each turning at its bracket (half the apron up) towards its half's hinge
    const lp = py - ap / 2, legGeo = (() => { const lg = new THREE.CylinderGeometry(3.9 * M, 2.7 * M, lp * M, 4, 1); lg.rotateY(Math.PI / 4); lg.scale(C.leg[0] / 5.5, 1, C.leg[1] / 5.5); return lg; })();
    for (const [lx, lz] of C.legs) {
      const i = lx > jx ? 0 : 1, l = new THREE.Group(), m = shadow(new THREE.Mesh(legGeo, K.oakIn));
      l.position.copy(v3(lx, lp, lz)); m.position.y = -lp / 2 * M; l.add(m); half[i].add(l); legs[i].push(l);
    }
    const off = [hinge.position.clone(), hinge.position.clone().add(joint.position)];
    half.forEach((h, i) => [...h.children].forEach(o => { o.position.sub(off[i]); (i ? joint : hinge).add(o); }));
    mergeStatic(hinge); mergeStatic(joint);   // V3.04 (N47): each half one draw a material (its legs turn: groups, kept)
    const at = (p, a) => ease(Math.min(1, Math.max(0, (p - RIG[a]) / (RIG[a + 1] - RIG[a]))));
    root.userData.rig = anim(p => {
      hinge.rotation.z = Math.PI / 2 - Math.PI / 4 * (at(p, 0) + at(p, 2));
      joint.rotation.z = Math.PI - (Math.PI - 0.35) * at(p, 3) - 0.35 * at(p, 5);
      legs[0].forEach(l => { l.rotation.z = -Math.PI / 2 * (1 - at(p, 1)); });
      legs[1].forEach(l => { l.rotation.z = -Math.PI / 2 * (1 - at(p, 4)); });
    });
    return root;
  };
  // the chairs at the table; a plate at each
  K.seats = C => {
    const out = {}, [tz0, tz1] = C.tz, tx0 = C.tx[0], py = C.pivot[1], tt = C.top[2];
    // v33: your padded folding chairs (Brayden Studio), drawn from the photo you sent (inputs/chairs_padded_listing_photo.webp): bent-wood
    // sides, each back upright curving forward at the seat into the front leg, the back leg crossing it under the seat; a thick buttoned
    // cushion on the seat (47 × 47, 6.5) and a buttoned pad between the uprights, reclined to 110°
    const seg = (c, x, y1, z1, y2, z2, w, d, mat) => {
      const L = Math.hypot(y2 - y1, z2 - z1), m = new THREE.Mesh(new THREE.BoxGeometry(w * M, L * M, d * M), mat);
      m.position.copy(v3(x, (y1 + y2) / 2, (z1 + z2) / 2)); m.rotation.x = Math.atan2(z2 - z1, y2 - y1); c.add(shadow(m)); return m;
    };
    const BTN = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 10);
    const buttons = (mesh, cols, rows, w, h, face) => {     // buttons on a cushion's face (its own frame: x across, y up or z along)
      const geos = [];                                       // V3.04 (N47): a cushion's buttons one draw (they were one each)
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const b = new THREE.Object3D(), u = ((i + 0.5) / cols - 0.5) * w * M, v = ((j + 0.5) / rows - 0.5) * h * M;
        if (face === "top") b.position.set(u, 0, v); else { b.position.set(u, v, 0); b.rotation.x = Math.PI / 2; }
        b.position[face === "top" ? "y" : "z"] = face === "top" ? mesh.userData.t / 2 * M : -mesh.userData.t / 2 * M;
        b.updateMatrix(); geos.push(BTN.clone().applyMatrix4(b.matrix));
      }
      mesh.add(new THREE.Mesh(mergeGeometries(geos), K.linenBtn));
    };
    const paddedOpen = (g, x, z, face) => {
      const P = R.CHAIR_PADDED, c = new THREE.Group(), sw = P.w, sh = P.seat_h, bh = P.h, [cw, cd] = P.seat, cu = P.cushion;
      for (const sd of [-1, 1]) {
        const xx = sd * (sw / 2 - 1.5);
        seg(c, xx, bh, 24, 56, 19.5, 2.6, 3.2, K.beech);           // the back upright, leaning back
        seg(c, xx, 56.6, 19.6, 48.5, 15.6, 2.6, 3.2, K.beech);     // the bend forward at the seat
        seg(c, xx, 49.2, 16.2, 42, 9.5, 2.6, 3.2, K.beech);
        seg(c, xx, 42.6, 10.2, 0, -26, 2.6, 3.4, K.beech);         // on down into the front leg
        seg(c, xx * 0.92, 40, -16, 0, 22, 2.6, 3.4, K.beech);      // the back leg, crossing it under the seat
      }
      seg(c, 0, 37.5, -20, 37.5, 16, sw - 6, 1.4, K.dark);         // the seat's board, under the cushion
      const seat = new THREE.Mesh(new RoundedBoxGeometry((cw - 1) * M, cu * M, (cd - 1) * M, 3, 0.022), K.linen);
      seat.userData.t = cu; seat.position.copy(v3(0, sh - cu / 2, -3)); c.add(shadow(seat)); buttons(seat, 3, 3, cw - 13, cd - 13, "top");
      const back = new THREE.Mesh(new RoundedBoxGeometry((sw - 5.6) * M, 22 * M, 5 * M, 3, 0.02), K.linen);
      back.userData.t = 5; back.position.copy(v3(0, 67.5, 20.6)); back.rotation.x = Math.atan2(4.5, 22.7); c.add(shadow(back)); buttons(back, 3, 2, sw - 18, 12, "front");
      mergeStatic(c); c.position.copy(v3(x, 0, z)); c.rotation.y = { n: 0, w: Math.PI, e: Math.PI / 2 }[face] || 0; g.add(c);   // V3.04 (N47): its bent-wood sides one draw
    };
    for (const [k, list] of Object.entries(C.seats)) {
      const g = new THREE.Group(); g.userData.chairs = [];
      for (const [x, z, f] of list) {
        paddedOpen(g, x, z, f);
        const c = g.children[g.children.length - 1], pz = f === "n" ? tz0 - 16 : f === "w" ? tz1 + 16 : C.cz, pxp = f === "e" ? tx0 + 16 : x;
        const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.008, 28), K.plate); pl.position.copy(v3(pxp, py + tt + 0.4, pz)); g.add(pl);
        const home = c.position.clone(), back = new THREE.Vector3(Math.sin(c.rotation.y), 0, Math.cos(c.rotation.y));   // v32: drawn in along its back's line
        g.userData.chairs.push(anim(v => { c.position.copy(home).addScaledVector(back, 0.35 * v); c.visible = v < 0.999; pl.visible = v < 0.5; }, 1));
      }
      out[k] = g;
    }
    return out;
  };
  // v33: a folded chair standing up (your grey padded ones, 47 wide, 10 thick, 90 tall), its room-side face at x0, cz its centre along the wall
  const FOLD = () => R.CHAIR_PADDED.folded;
  K.fchair = (g, x0, y0, cz) => {
    const [cw, cdep, ch] = FOLD();
    for (const sd of [-1, 1]) {
      K.bx(g, x0 + cdep - 2.8, y0, cz + sd * (cw / 2 - 1.4) - 1.4, 2.8, ch, 2.8, K.beech);                // the back legs
      K.bx(g, x0 + 0.3, y0 + 2, cz + sd * (cw / 2 - 4.2) - 1.4, 2.8, ch - 16, 2.8, K.beech);           // the front legs, folded up against them
    }
    K.rbx(g, x0 + 2.4, y0 + 22, cz - (cw / 2 - 4.5), cdep - 5.4, 46, cw - 9, K.linen, 1.5);              // the seat's cushion, folded up
    K.rbx(g, x0 + cdep - 4.6, y0 + ch - 34, cz - (cw / 2 - 3.5), 2.0, 28, cw - 7, K.linen, 0.8);          // the padded back
  };
  // a folded chair lying on its side (the table box's base): its length along the wall, its room-side face at x0
  K.fchairLying = (g, x0, y0, cz) => {
    const [cw, cdep, ch] = FOLD(), zA = cz - ch / 2;
    for (const sd of [-1, 1]) {
      K.bx(g, x0 + cdep - 2.8, y0 + cw / 2 + sd * (cw / 2 - 1.4) - 1.4, zA, 2.8, 2.8, ch, K.beech);
      K.bx(g, x0 + 0.3, y0 + cw / 2 + sd * (cw / 2 - 4.2) - 1.4, zA + 2, 2.8, 2.8, ch - 16, K.beech);
    }
    K.rbx(g, x0 + 2.4, y0 + 4.5, zA + 22, cdep - 5.4, cw - 9, 46, K.linen, 1.5);
    K.rbx(g, x0 + cdep - 4.6, y0 + 3.5, zA + ch - 34, 2.0, cw - 7, 28, K.linen, 0.8);
  };
  CK = K;
  return K;
}

/* v32: each cabinet's moving parts (cabP() the one on show): its table door and chair door, the chairs in the chair box (stand) and in
   the base (base), the pads on the table door, the table (rig), the chairs at the table (seats) */
const CABP = {};
const cabP = () => CABP.compact;
function slideOut(parent, d = 60) {      // a folded chair (or the pads) drawn straight out of the cabinet into the room, then put down
  return fill => { const g = new THREE.Group(); fill(g); mergeStatic(g); parent.add(g); return anim(v => { g.position.x = d * M * v; g.visible = v < 0.999; }); };   // V3.04 (N47): a chair one draw a material
}
/* v39: the sliding cabinet (v29's buildOptC) is gone: since v33 every state opens on the compact cabinet (applyState), so it was built
   and never shown. Its numbers stay in geometry.OPTC; the code is in git history, v39. */

/* v30: the compact cabinet, two boxes side by side: the table box at the stair end (the table on its hinge rail, two chairs lying on
   their sides in the base under it, the linen shelf over it, the six seat pads on the door's back) and the chair box (four chairs, two
   deep on its floor and two deep on its shelf). Inset doors, each on a full-height piano hinge with its knuckle on the front: the table
   door turns 180° towards the window and lies back over the chair door and the wall beyond; the chair door turns 180° towards the
   stairs and lies back over the table door. */
let cab = null, cabRig = null, cabSeats = {}, cabIn = null, cabDoor = {}, cabPads = null, cabLit = [];
function buildCab(C = cabC()) {
  if (!C) return;
  const K = cabKit(), bx = K.bx, W = R.W, t = C.t, xf = C.front, xi = C.inner, deepIn = C.in_d;
  const [, cdep] = R.CHAIR_FOLDED;
  cab = new THREE.Group(); cab.name = "cab"; cab.userData.w = C.top[0];
  const cbox = new THREE.Group();   // v33: the chair box in its own group
  // two carcasses: each two ends, a top, a floor on a plinth set 2.5 back (a shadow line), a back; the boxes screwed together
  for (const [a, b] of [C.z_t, C.z_c]) {
    const span = a - b - 2 * t, tg = a === C.z_c[0] ? cbox : cab;
    bx(tg, xf, 0, b, C.d, C.h, t, K.oakV); bx(tg, xf, 0, a - t, C.d, C.h, t, K.oakV);
    bx(tg, xf, C.h - C.t_top, b + t, C.d, C.t_top, span, K.oak);
    bx(tg, xf, C.plinth - t, b + t, C.d, t, span, K.oak);
    bx(tg, xf + 2.5, 0, b + t, C.d - 2.5, C.plinth - t, span, K.dark);
    bx(tg, W - C.back, C.plinth, b + t, C.back, C.h - C.plinth - C.t_top, span, K.oakIn);
  }
  const [bt0, bt1] = C.bay_tz, [bc0, bc1] = C.bay_cz;
  bx(cab, C.rail_x[0], C.rail[0], bt1, C.rail_x[1] - C.rail_x[0], 7, bt0 - bt1, K.oak);         // the hinge rail (v31: set back behind the pads)
  bx(cab, xi + C.pads, C.linen[0] - t, bt1, C.linen_d, t, bt0 - bt1, K.oakIn);                    // the linen shelf (v31: the same)
  bx(cbox, xi, C.shelf_y, bc1, deepIn, t, bc0 - bc1, K.oakIn);                                    // the chair bay's shelf
  [[0, 0], [1, 1], [2, 2]].forEach(([i, c]) => bx(cab, xi + C.pads + 1 + i * 0.4, C.linen[0] + i * 3.2, bt1 + 8 + i * 6, deepIn - C.pads - 2, 3, 34, K.cloth[c]));   // the cloth, napkins, runner
  // the chairs: two lying in the base, two deep; four standing in the chair bay, two deep on its floor and on its shelf
  cabIn = new THREE.Group();
  const out = slideOut(cabIn), base = [], stand = [];
  for (let j = 0; j < C.chairs_base; j++) base.push(out(g => K.fchairLying(g, xi + 0.3 + j * (cdep + 0.3), C.base[0], C.cz)));
  for (const x0 of [...C.chair_x].sort((a, b) => a - b)) for (const y0 of [C.plinth, C.shelf_y + t]) stand.push(out(g => K.fchair(g, x0, y0, C.chair_z)));
  cab.add(cabIn);
  cabRig = K.tableRig(C); cab.add(cabRig);
  cabSeats = K.seats(C); Object.values(cabSeats).forEach(g => cab.add(g));
  // the doors: each a group at its hinge's axis, so turning it is a rotation; the door panel, a routed finger slot near its free edge,
  // the piano hinge's knuckle; the table door carries the six seat pads on its back (a child of the door, so they swing with it)
  cabDoor = {};
  const ax = xf - C.knuckle;
  const door = (key, z0, z1, hz) => {
    const g = new THREE.Group(); g.position.copy(v3(ax, 0, hz));
    const loc = (x, z) => [x - ax, z - hz];                                       // room cm to the door's own frame (x into the cabinet, z along it)
    const [lx, lz0] = loc(xf, Math.min(z0, z1)), lz1 = loc(xf, Math.max(z0, z1))[1];
    bx(g, lx, C.plinth + C.gap, lz0, C.door, C.door_h, lz1 - lz0, K.oakV);
    const free = Math.abs(z0 - hz) > Math.abs(z1 - hz) ? z0 : z1, sz = free > hz ? -1 : 1;
    bx(g, lx - 0.05, 92, loc(xf, free + sz * 5 - (sz < 0 ? 0 : 2.5))[1], 0.12, 26, 2.5, K.dark);   // the finger slot, 5 in from its free edge
    const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * M, 0.28 * M, 180 * M, 8), K.steel); kn.position.copy(v3(0, C.plinth + C.gap + C.door_h / 2, 0)); g.add(kn);
    cab.add(g); cabDoor[key] = g; return g;
  };
  door("T", C.door_t[0], C.door_t[1], C.door_t[1] - C.hinge_gap / 2);
  door("C", C.door_c[0], C.door_c[1], C.door_c[0] + C.hinge_gap / 2); cbox.add(cabDoor.C);
  cab.add(cbox);
  // the six pads on the table door's back, two across and three high, from the hinge rail's underside up (v31: 40 × 40 tie-on pads,
  // their ties hanging; the rail and the linen shelf stand back so they can)
  cabPads = new THREE.Group();
  const hzT = C.door_t[1] - C.hinge_gap / 2, mid = (C.door_t[0] + C.door_t[1]) / 2, [pw, ph, pt] = C.pad;
  for (let r = 0; r < 3; r++) for (const s of [-1, 1]) {
    const y0 = C.pad_zone[0] + 0.3 + r * (ph + 0.2), z0 = mid + s * (pw / 2 + 0.2) - pw / 2 - hzT;
    K.rbx(cabPads, xf + C.door + 0.4 - ax, y0, z0, pt, ph, pw, K.pad, 1.2);
    for (const e of [0.2, 0.8]) bx(cabPads, xf + C.door + 0.4 - ax, y0 + ph - 1, z0 + pw * e - 0.6, 0.4, 9, 1.2, K.pad);   // its two ties, on the hook
  }
  cabDoor.T.add(cabPads);
  mergeStatic(cab); mergeStatic(cbox); mergeStatic(cabPads);   // V3.04 (N47): the carcasses and the pads one draw a material (what moves is in its own group, kept)
  // v32 (a suggestion): a 40 cm motion-sensing light bar under each box's top, at the front, lit while its door is open
  { const g = SUGG_G.cablights = new THREE.Group(), barM = reg(new THREE.MeshStandardMaterial({ color: "#eeebe4", roughness: 0.4 }));
    const glowC = new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false }); SVAR_MATS.cablights = [glowC];
    cabLit = [];
    for (const [a_, b_] of [C.z_t, C.z_c]) {
      const zc = (a_ + b_) / 2, y = C.h - C.t_top, lit = new THREE.Group();
      ibox(g, xi + 1, y - 1.2, zc - 20, 2.2, 1.2, 40, barM);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.002, 0.38), glowC); led.position.copy(v3(xi + 2.1, y - 1.25, zc)); lit.add(led);
      const pl = new THREE.PointLight("#ffd29a", 1.6, 1.6, 2); pl.userData.accent = 1.6; pl.position.copy(v3(xi + 4, y - 6, zc)); lit.add(pl); SVAR_MATS.cablights.push(pl);
      g.add(lit); cabLit.push(lit);
    }
    cab.add(g); }
  // v32: the pads lift off the door's back (into the room once it's open), the doors each turn 180°
  CABP.compact = { sl: false, C, doorT: anim(v => { cabDoor.T.rotation.y = Math.PI * v; cabLit[0].visible = v > 0.04; }), doorC: anim(v => { cabDoor.C.rotation.y = -Math.PI * v; cabLit[1].visible = v > 0.04; }),
                   stand, base, pads: anim(v => { cabPads.position.x = -0.25 * v; cabPads.visible = false; }), rig: cabRig.userData.rig,
                   seats: { four: cabSeats.four.userData.chairs, six: cabSeats.six.userData.chairs } };
  scene.add(cab);
}
/* v33: the 80-wide version is the same build round a narrower table: swap the whole cabinet when the width changes */
function rebuildCab() {
  CAB_TW.clear();
  scene.remove(cab); cab.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  buildCab(cabC()); clipGroup(cab); applySuggest();
  const was = cabSnap; cabSnap = true; cabGo(CABP.compact); cabSnap = was;
}
/* the cabinets' tween: each entry eases an anim's p to a target, after a wait (delay) if it has one; a still snaps them (cabSnap) */
const CAB_TW = new Map();
let cabSnap = false;
function twTo(a, to, dur = 700, delay = 0, lin = false) {
  if (!a) return;
  if (cabSnap || REDUCE_M || Math.abs(a.p - to) < 1e-4 || (dur <= 0 && delay <= 0)) { CAB_TW.delete(a); a.set(to); return; }
  CAB_TW.set(a, { from: a.p, to, t0: performance.now() + delay, dur, lin });
}
function cabTween(now) {     // from the frame loop: true while anything is still moving (or waiting to)
  if (!CAB_TW.size) return false;
  let moved = false;
  for (const [a, w] of CAB_TW) {
    if (now < w.t0) continue;
    const k = w.dur > 0 ? Math.min(1, (now - w.t0) / w.dur) : 1;
    a.set(w.from + (w.to - w.from) * (w.lin ? k : ease(k))); moved = true;
    if (k >= 1) CAB_TW.delete(a);
  }
  if (moved) reshadow();
  return true;
}
const REDUCE_M = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function cabDoors() {        // which doors stand open: the table door with the table out (or S.tdoor), the chair door with S.chairs "open"
  const folded = S.dining === "folded";
  return { table: !folded || !!S.tdoor, chairs: folded && S.chairs === "open" && !S.tdoor };
}
/* v32: the cabinet goes to S one part after another, each waiting for the one before, so nothing passes through anything: opening, the
   chair door shuts, the table door opens, the pads come off it, the two chairs in the base come out, the table unfolds (2.6 s), the
   chairs come in round it; folding away, the same backwards. A part already where it should be takes no time. */
function cabGo(P) {
  const folded = S.dining === "folded", n = S.dining === "six" ? "six" : "four", dr = cabDoors();
  let t = 0;
  const seq = (list, to, ms, gap = 0, lin = false) => {
    let k = 0, end = 0;
    for (const a of list.filter(Boolean)) {
      const d = ms * Math.abs(a.p - to);
      if (d < 1) { twTo(a, to, 0, 0); continue; }
      twTo(a, to, d, t + k * gap, lin); end = Math.max(end, k * gap + d); k++;
    }
    t += end;
  };
  const now = (list, to) => list.forEach(a => twTo(a, to, 0, t));     // behind a shut door: no need to watch
  if (!folded) {
    seq(P.seats[n === "six" ? "four" : "six"], 1, 300);
    if (P.doorC.p > 0.01) seq(P.stand, 1, 500, 90); else now(P.stand, 1);
    seq([P.doorC], 0, 700);
    seq([P.doorT], 1, 700);
    seq([P.pads], 1, 400);
    seq(P.base, 1, 500, 120);
    seq([P.rig], 1, 2600, 0, true);
    seq(P.seats[n], 0, 500, 90);
  } else {
    seq([...P.seats.four, ...P.seats.six], 1, 400, 60);
    seq([P.rig], 0, 2600, 0, true);
    seq(P.base, 0, 500, 120);
    seq([P.pads], 0, 400);
    if (!dr.table) seq([P.doorT], 0, 700);
    if (!dr.chairs) { seq([P.doorC], 0, 700); now(P.stand, 0); }
    else if (P.doorC.p > 0.99) seq(P.stand, 0, 500, 90); else now(P.stand, 0);
    if (dr.table) seq([P.doorT], 1, 700);
    if (dr.chairs) seq([P.doorC], 1, 700);
  }
  cabStill = performance.now() + t;                      // v34: the trolley waits for it
}
let cabStill = 0;
function placeOptC() {
  const on = S.site === "C";
  if (cab) cab.visible = on;
  const P = cabP();
  if (on && P && !SH) cabGo(P);                        // v32: while "Watch it open" runs, its clock moves the cabinet
  placeFoot(); placeBeside();
}
/* v31: beside the compact cabinet (Layout, "Beside the cabinet"): left clear, a tall mirror, a slim trolley or a low oak shelf. All of
   them stand no deeper than the cabinet, behind the open table door's line */
let beside = null;
const BES = {};
function buildBeside() {
  const B = R.BESIDE; if (!B) return;
  const K = cabKit(), bx = K.bx, mat = o => reg(new THREE.MeshStandardMaterial(o)), W = R.W;
  beside = new THREE.Group(); beside.name = "beside"; scene.add(beside);
  const zc = (B.z[0] + B.z[1]) / 2;
  // the mirror: IKEA NISSEDAL, black frame, on the wall, centred in the gap
  if (B.mirror) {
    const m = B.mirror, g = new THREE.Group(); g.name = "mirror"; BES.mirror = g; beside.add(g);
    bx(g, W - m.t, m.y0, zc - m.w / 2, m.t, m.h, m.w, K.dark);
    // the glass: no live reflection (it would draw the room twice), a soft daylight sheen with two diagonal highlights reads as a mirror
    const glass = new THREE.Mesh(new THREE.PlaneGeometry((m.w - 4) * M, (m.h - 4) * M), mat({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.12, metalness: 0.25 }));
    glass.rotation.y = Math.PI / 2; glass.position.copy(v3(W - m.t - 0.05, m.y0 + m.h / 2, zc)); g.add(glass);
  }
  // the low oak shelf: the chair box's width, table height, open to the room: plates face-out, bowls, glasses, a few bottles
  if (B.dresser) {
    const d = B.dresser, g = new THREE.Group(); g.name = "dresser"; BES.dresser = g; beside.add(g);
    const z0 = B.z[0] - d.w, x0 = W - d.d, t = d.t;
    bx(g, x0, 0, z0, d.d, d.h, t, K.oakV); bx(g, x0, 0, B.z[0] - t, d.d, d.h, t, K.oakV);        // the two ends
    bx(g, x0, d.h - t, z0 + t, d.d, t, d.w - 2 * t, K.oak); bx(g, x0, 1.2, z0 + t, d.d, t, d.w - 2 * t, K.oakIn);   // the top and the floor
    bx(g, W - 0.6, 3, z0 + t, 0.6, d.h - t - 3, d.w - 2 * t, K.oakIn);                            // the back
    bx(g, x0 + 0.5, d.shelf, z0 + t, d.d - 1.1, t, d.w - 2 * t, K.oakIn);                         // the shelf
    for (let i = 0; i < 6; i++) {                                                                  // six plates on edge, one behind the other
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(13.5 * M, 13.5 * M, 1.2 * M, 32), K.plate);
      pl.rotation.z = Math.PI / 2; pl.position.copy(v3(x0 + 3 + i * 2.4, d.shelf + t + 13.7, zc + 2)); g.add(shadow(pl));
    }
    const glassM = mat({ color: "#dfe9ee", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 4; i++) { const gl2 = new THREE.Mesh(new THREE.CylinderGeometry(3.6 * M, 3 * M, 11 * M, 18), glassM); gl2.position.copy(v3(x0 + 5 + (i % 2) * 9, 3 + 5.5 + 1.8, z0 + 8 + Math.floor(i / 2) * 9)); g.add(gl2); }
    const bottle = mat({ color: "#2f4a2c", roughness: 0.2, metalness: 0.2 });
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(3.7 * M, 3.7 * M, 30 * M, 18), bottle); b.position.copy(v3(x0 + 10, 3 + 15 + 1.8, B.z[0] - 9 - i * 8.5)); g.add(shadow(b)); }
    const carafe = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 5 * M, 24 * M, 20), glassM); carafe.position.copy(v3(x0 + 11, d.h + 12, zc + 6)); g.add(carafe);
  }
  // v36: an oak blanket rail: two oak uprights on the wall, four 28 mm oak dowels 12 off it, a folded blanket over each (two on the lowest)
  if (B.rail) {
    const ra = B.rail, g = new THREE.Group(); g.name = "rail"; BES.rail = g; beside.add(g);
    const z0 = zc - ra.w / 2;
    for (const z of [z0, zc + ra.w / 2 - ra.up[0]]) bx(g, W - ra.up[1], 5, z, ra.up[1], ra.h, ra.up[0], K.oakV);
    const cols = ["#efe7d8", "#a65a38", "#8b9878", "#d9a441", "#34507f"].map(c => mat({ color: c, roughness: 1, bumpMap: HESSIAN, bumpScale: 1.2 }));
    ra.rails.forEach((y, i) => {
      for (const z of [z0 + 1, zc + ra.w / 2 - 3]) bx(g, W - ra.off - 1.4, y - 1.4, z, ra.off - ra.up[1] + 1.4, 2.8, 2, K.oak);   // the arms
      const dw = new THREE.Mesh(new THREE.CylinderGeometry(ra.dowel / 2 * M, ra.dowel / 2 * M, ra.w * M, 16), K.oak);
      dw.rotation.x = Math.PI / 2; dw.position.copy(v3(W - ra.off, y, zc)); g.add(shadow(dw));
      for (let j = 0; j < (i === 0 ? 2 : 1); j++) {                                                  // a blanket folded over it: both sides and the fold
        const c = cols[(i + j * 4) % cols.length], hang = 26 - j * 5, th = 2.4, wd = ra.w - 7, off = j * 2.6;
        bx(g, W - ra.off - 1.6 - th - off, y - hang, zc - wd / 2, th, hang, wd, c);
        bx(g, W - ra.off + 1.6 + off * 0.3, y - hang + 4, zc - wd / 2, th, hang - 4, wd, c);
        const fold = new THREE.Mesh(new THREE.CylinderGeometry((1.6 + th + off) * M, (1.6 + th + off) * M, wd * M, 16), c);
        fold.rotation.x = Math.PI / 2; fold.position.copy(v3(W - ra.off, y, zc)); g.add(shadow(fold));
      }
    });
  }
  /* v37, client: "Add a new 'Bar' option ... next to the dining cabinet ... a fixed, built-in counter-style unit (permanent joinery attached
     to the wall/floor), not a freestanding or wheeled trolley": a back-bar scribed between the cabinet's end and the pipe boxing, no deeper
     than the open table door's line. A cupboard on a recessed plinth (two doors, twenty bottles on two shelves), an oak counter at 90, a
     mirror back, an oak shelf at 135 with a glass rail under it, a display shelf at 165. Its doors open with the other bars (S.barflap) */
  if (R.BAR_BUILT) {
    const b = R.BAR_BUILT, g = new THREE.Group(); g.name = "bar"; BES.bar = g; beside.add(g);
    const [z0, z1] = b.z, w = z0 - z1, t = b.t, d = b.d, x0 = W - d, ct = b.counter - b.top_t;
    const own = c => reg(new THREE.MeshStandardMaterial({ color: c, map: OAK_TEX, roughness: 0.55 })), outer = own("#c48c57"); SVAR_MATS.barbuilt = [outer];
    bx(g, x0 + b.recess, 0, z1 + t, d - b.recess - b.back, b.plinth, w - 2 * t, K.dark);                      // the recessed plinth
    bx(g, x0, 0, z1, d, ct, t, outer); bx(g, x0, 0, z0 - t, d, ct, t, outer);                                // the two ends, scribed
    bx(g, x0 + b.door, b.plinth, z1 + t, d - b.door, t, w - 2 * t, K.oakIn);                                  // the floor
    bx(g, x0 + b.door + 0.4, b.mid, z1 + t, d - b.door - 0.4 - b.back, t, w - 2 * t, K.oakIn);                // the shelf inside
    bx(g, W - b.back, b.plinth, z1 + t, b.back, ct - b.plinth, w - 2 * t, K.oakIn);                            // the back
    bx(g, W - b.front, ct, z1, b.front, b.top_t, w, K.oak);                                                    // the oak counter
    const mir = new THREE.Mesh(new THREE.PlaneGeometry((w - 1) * M, (b.shelf2[0] - b.counter) * M), mat({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.1, metalness: 0.3 }));
    mir.rotation.y = Math.PI / 2; mir.position.copy(v3(W - b.mirror - 0.05, (b.counter + b.shelf2[0]) / 2, (z0 + z1) / 2)); g.add(mir);   // the acrylic mirror back
    // v38: over the counter, an IKEA ENHET wall frame (40 × 15 × 75, steel, two shelves) from 112: glasses and bottles stand on it
    const [ew, ed, eh] = R.ENHET, ey = b.enhet_y0, ez0 = (z0 + z1) / 2 - ew / 2, steelE = mat({ color: "#3a3b3d", roughness: 0.45, metalness: 0.5 });
    for (const zz of [ez0, ez0 + ew - 1.2]) bx(g, W - ed, ey, zz, ed, eh, 1.2, steelE);                       // its two sides
    for (const yy of [ey, ey + eh / 3, ey + eh * 2 / 3, ey + eh - 1.2]) bx(g, W - ed, yy, ez0, ed, 1.2, ew, steelE);   // bottom, two shelves, top
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.004, (ew - 6) * M), new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false }));
    led.position.copy(v3(W - ed + 3, ey - 0.25, (z0 + z1) / 2)); g.add(led);                                  // a warm strip under it, over the counter
    { const bl = new THREE.PointLight("#ffd59a", 1, 0.9, 2); bl.position.copy(v3(W - ed + 2, ey - 3, (z0 + z1) / 2)); bl.userData.accent = 1.1; g.add(bl); }   // v46: it lights the counter (Accents)
    const clear = reg(new THREE.MeshPhysicalMaterial({ color: "#eef3f4", roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.5 }));
    const glassGeo = new THREE.LatheGeometry([[0.0, 0], [3.6, 0], [3.6, 0.3], [0.35, 0.6], [0.35, 10], [2.2, 11.2], [4.2, 15.5], [4.0, 21], [3.6, R.BAR_GLASS_H]].map(([r, y]) => new THREE.Vector2(r * M, y * M)), 20);
    for (let i = 0; i < 3; i++) { const gl2 = new THREE.Mesh(glassGeo, clear); gl2.position.copy(v3(W - 7.5, ey + 1.2, ez0 + 8 + i * 12)); g.add(gl2); }   // three wine glasses on the bottom
    const steel = mat({ color: "#c9cbcd", roughness: 0.25, metalness: 0.9 });
    const bottleGeo = new THREE.LatheGeometry([[0, 0], [4.2, 0], [4.4, 1], [4.4, 21], [3.6, 24], [1.4, 27.5], [1.4, 32], [1.6, 32.5], [1.6, 34], [0, 34]].map(([r, y]) => new THREE.Vector2(r * M, y * M)), 16);
    const glassC = ["#3f6b3a", "#c48a3a", "#e8eef0", "#6b2e1f", "#2f4e6e", "#d9c27a"].map(c => reg(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.88 })));
    const r = rnd(41), pitch = (w - 2 * t) / b.across;
    for (const y of [b.floor, b.mid + t]) for (let i = 0; i < b.across; i++) {                                 // the front row of each shelf
      const bo = new THREE.Mesh(bottleGeo, glassC[(i + (y > 20 ? 3 : 0)) % glassC.length]), k = 0.78 + r() * 0.22; bo.scale.set(1, k, 1);
      bo.position.copy(v3(x0 + b.door + 6, y, z1 + t + pitch * (i + 0.5))); g.add(bo); }
    for (const [dz, k] of [[-12, 0.62], [-2, 0.55], [9, 0.6]]) { const bo = new THREE.Mesh(bottleGeo, glassC[(dz + 20) % 6]); bo.scale.set(1, k, 1);
      bo.position.copy(v3(W - 7, ey + eh / 3 + 1.2, (z0 + z1) / 2 + dz)); g.add(bo); }                          // three short bottles on its first shelf
    const shaker = new THREE.Mesh(new THREE.CylinderGeometry(3.4 * M, 4 * M, 20 * M, 18), steel); shaker.position.copy(v3(W - 9, b.counter + 10, z1 + 9)); g.add(shaker);
    bx(g, W - 16, b.counter, (z0 + z1) / 2 - 12, 12, 1.2, 24, K.oakIn);                                        // a small oak tray
    for (const dz of [-6, 4]) { const tu = new THREE.Mesh(new THREE.CylinderGeometry(3.8 * M, 3.3 * M, 9 * M, 18), clear); tu.position.copy(v3(W - 10, b.counter + 1.2 + 4.5, (z0 + z1) / 2 + dz)); g.add(tu); }
    // the two doors, each hinged at its outer end, brass knobs at the meeting edge
    const dw = (w - 2 * t - 0.6) / 2, dh = ct - b.plinth - 0.4, brass = mat({ color: "#b8913f", roughness: 0.3, metalness: 0.8 }), leaves = [];
    for (const [hz, s_] of [[z1 + t + 0.15, 1], [z0 - t - 0.15, -1]]) {
      const pv = new THREE.Group(); pv.position.copy(v3(x0, b.plinth + 0.2, hz)); g.add(pv);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(b.door * M, dh * M, dw * M), outer); leaf.position.set(-b.door / 2 * M, dh / 2 * M, s_ * dw / 2 * M); pv.add(shadow(leaf));
      const kn = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), brass); kn.position.set(0.01, (dh - 8) * M, s_ * (dw - 3) * M); pv.add(kn);
      leaves.push([pv, s_]); }
    WORK.barflap3 = anim(v => { for (const [pv, s_] of leaves) pv.rotation.y = s_ * 1.75 * v; });
  }
  // v37: shoe storage, two IKEA TRONES stacked in the same slot (wall-fixed, as IKEA says), 18 deep: their fronts tip down to open
  if (R.TRONES && B.shoes) {
    const [tw, td, th] = R.TRONES, g = new THREE.Group(); g.name = "shoes"; BES.shoes = g; beside.add(g);
    const body = mat({ color: "#ece8e0", roughness: 0.5 }), seam = mat({ color: "#cfc9bd", roughness: 0.6 });
    for (let i = 0; i < B.shoes.n; i++) { const y = B.shoes.y0 + i * (th + B.shoes.gap), z0 = zc - tw / 2;
      bx(g, W - td, y, z0, td, th, tw, body);                                                                   // the cabinet
      bx(g, W - td - 0.3, y + 2, z0 + 1, 0.3, th - 4, tw - 2, seam);                                             // the tip-down front's line
      bx(g, W - td - 0.6, y + th - 7, zc - 6, 0.6, 1.2, 12, seam); }                                            // its finger-pull
  }
  // the slim trolley: three trays on a frame, four castors; it parks along the wall and pulls out for dinner (v34: WORK.trolley)
  if (B.trolley) {
    const tr = B.trolley, g = new THREE.Group(); g.name = "trolley"; BES.trolley = g; beside.add(g);
    const body = mat({ color: tr.col || "#2b2b2b", roughness: 0.5, metalness: 0.3 }), x0 = W - 1.5 - tr.d, z0 = zc - tr.w / 2;
    for (const [xx, zz] of [[x0, z0], [x0 + tr.d - 1.2, z0], [x0, z0 + tr.w - 1.2], [x0 + tr.d - 1.2, z0 + tr.w - 1.2]]) bx(g, xx, 4, zz, 1.2, tr.h - 4, 1.2, body);
    for (const y of tr.tiers) { bx(g, x0, y, z0, tr.d, 0.8, tr.w, body); bx(g, x0, y, z0, tr.d, 4, 0.6, body); bx(g, x0, y, z0 + tr.w - 0.6, tr.d, 4, 0.6, body); }
    for (const [xx, zz] of [[x0 + 1, z0 + 1], [x0 + tr.d - 1, z0 + 1], [x0 + 1, z0 + tr.w - 1], [x0 + tr.d - 1, z0 + tr.w - 1]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(2 * M, 2 * M, 1.5 * M, 14), K.dark); w.rotation.x = Math.PI / 2; w.position.copy(v3(xx, 2, zz)); g.add(w); }
    const cup = mat({ color: "#efe7d8", roughness: 0.5 });
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 3.4 * M, 9 * M, 16), cup); c.position.copy(v3(x0 + tr.d / 2, tr.tiers[tr.tiers.length - 1] + 5.3, z0 + 8 + i * (tr.w - 16) / 2)); g.add(c); }
    // v34: the slim trolley as a drinks trolley (a suggestion): bottles on the top tray, glasses, mixers and an ice bucket below
    { const dk = SUGG_G.bartrolley = new THREE.Group(), r = rnd(23), xm = x0 + tr.d / 2, [, t2, t3, t4] = tr.tiers;
      const tint = reg(new THREE.MeshPhysicalMaterial({ color: "#3f6b3a", roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.88 })), clear = reg(new THREE.MeshPhysicalMaterial({ color: "#e8eef0", roughness: 0.06, transmission: 0.6, transparent: true, opacity: 0.55 }));
      SVAR_MATS.bartrolley = [tint];
      for (let i = 0; i < 4; i++) { const bh = 26 + r() * 7, br = 3.7 + r() * 0.8, zz = z0 + 5.5 + i * (tr.w - 11) / 3;
        const b_ = new THREE.Mesh(new THREE.CylinderGeometry(br * M, br * M, bh * 0.7 * M, 16), i % 2 ? clear : tint); b_.position.copy(v3(xm, t4 + 0.8 + bh * 0.35, zz)); dk.add(b_);
        const n_ = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * M, br * 0.9 * M, bh * 0.3 * M, 12), i % 2 ? clear : tint); n_.position.copy(v3(xm, t4 + 0.8 + bh * 0.85, zz)); dk.add(n_); }
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(3.8 * M, 3.3 * M, 9 * M, 16), clear); c.position.copy(v3(xm, t3 + 0.8 + 4.5, z0 + 6 + i * 10.4)); dk.add(c); }
      const steel = reg(new THREE.MeshStandardMaterial({ color: "#c9cbcd", roughness: 0.25, metalness: 0.9 }));
      const ice = new THREE.Mesh(new THREE.CylinderGeometry(7.5 * M, 6.5 * M, 17 * M, 22), steel); ice.position.copy(v3(xm, t2 + 0.8 + 8.5, z0 + 12)); dk.add(ice);
      for (let i = 0; i < 3; i++) { const cn = new THREE.Mesh(new THREE.CylinderGeometry(3.3 * M, 3.3 * M, 11.5 * M, 14), reg(new THREE.MeshStandardMaterial({ color: ["#e9e4da", "#c7643a", "#8e9a80"][i], roughness: 0.4, metalness: 0.4 })));
        cn.position.copy(v3(xm, t2 + 0.8 + 5.75, z0 + 26 + i * 7)); dk.add(cn); }
      g.add(dk); }
    // v34: "Pull it out for dinner": it slides along the wall to 1.3 clear of the plant stand's corner (z -234 .. -277.2, wherever the
    // cabinet's width put it), then rolls 119.5 straight out, to x 326 .. 346: past the table door's whole swing (90.5 from its hinge),
    // 13 behind the window-side chairs, clear of the lamp and the sofa. It can't reach the table's far end: with six sat down the sofa's
    // end and the chairs leave no way past. It comes out, and goes back, only with the table door shut (the open door lies over its spot)
    WORK.trolley = anim(v => {
      const zT = -255.6, dz = zT - (zc + beside.position.z / M), a = Math.min(1, v / 0.15), b = Math.max(0, (v - 0.15) / 0.85);
      g.position.set(119.5 * ease(b) * M, 0, dz * ease(a) * M); });
  }
  clipGroup(beside);
}
function placeWork() {      // v34
  twTo(WORK.blind, S.blind === "up" ? 0 : 1, 1800);
  twTo(WORK.barflap, S.barflap ? 1 : 0, 1400);
  twTo(WORK.barflap2, S.barflap ? 1 : 0, 1400);                                                    // v36: the bar by the sofa opens with it
  twTo(WORK.ctop, S.ctop ? 1 : 0, 1200);
  if (WORK.rlid) twTo(WORK.rlid, S.ctop ? 1 : 0, 1200);                                          // v38: the record table's lid
  twTo(WORK.barflap3, S.barflap ? 1 : 0, 1400);                                                    // v37: the built-in bar's doors open with it
  twTo(WORK.sdraw, S.sdraw ? 1 : 0, 1500);
  twTo(WORK.scurt, S.scopen ? 1 : 0, 1300);                                                        // V3.31: the stair curtain drawn back or across                                                          // v37: the drawers in the bottom steps
  twTo(WORK.lid, S.lid ? 1 : 0, 1500);
  twTo(WORK.lp, S.lp ? 1 : 0, 1300);
  // the trolley parks behind the table door's line: back it goes once the door has shut (the open door lies over its spot)
  if (WORK.trolley) {
    if (S.beside !== "trolley") twTo(WORK.trolley, 0, 0);
    else if (!cabSnap && S.site === "C" && cabDoors().table && cabP() && cabP().doorT.p > 0.02) {}   // the door's over its spot: it waits (a still or a link just puts it there)
    else twTo(WORK.trolley, S.trolley === "out" ? 1 : 0, 3200, Math.max(0, cabStill - performance.now()));
  }
}
function placeBeside() {
  if (!beside) return;
  const on = S.site === "C";
  for (const [k, g] of Object.entries(BES)) g.visible = on && S.beside === k;
  beside.position.z = S.cabw === "80" && R.CAB80 ? (R.CAB.z[1] - R.CAB80.z[1]) / 2 * M : 0;   // v33: centred in the longer gap
}
/* v31: "Show the space it needs, open": with the table folded, the floor it takes when it's out for six: the table, the six chairs
   and (the compact one) the table door's swing, drawn flat on the floor */
let foot = null, footKey = "";
function buildFoot(C) {
  const g = new THREE.Group(); g.name = "foot";
  const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
  const edge = new THREE.LineBasicMaterial({ color: "#1f4a38" });
  const flat = (geo, m, x, z, y = 0.6) => { const p = new THREE.Mesh(geo, m); p.rotation.x = -Math.PI / 2; p.position.copy(v3(x, y, z)); p.renderOrder = 2; g.add(p); return p; };
  const rect = (x0, x1, z0, z1, m, y) => { const p = flat(new THREE.PlaneGeometry(Math.abs(x1 - x0) * M, Math.abs(z1 - z0) * M), m, (x0 + x1) / 2, (z0 + z1) / 2, y);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry), edge); e.rotation.copy(p.rotation); e.position.copy(p.position); g.add(e); };
  if (C.door_tw) {   // the compact cabinet: the table door turns through a half circle in front of the boxes as it opens
    const hz = C.door_t[1] - C.hinge_gap / 2, hx = C.front - C.knuckle;
    flat(new THREE.CircleGeometry(C.door_tw * M, 48, -Math.PI / 2, Math.PI), mat("#34507f", 0.16), hx, hz, 0.4);
  }
  rect(C.tx[0], C.tx[1], C.tz[1], C.tz[0], mat("#2f7d5b", 0.32), 0.7);
  const cm = mat("#c7643a", 0.26), [cw, cd] = R.CHAIR;
  for (const [x, z] of C.seats.six) rect(x - cw / 2, x + cw / 2, z - cd / 2, z + cd / 2, cm, 0.8);
  return g;
}
function placeFoot() {
  const want = !!S.foot && S.site === "C" && S.dining === "folded";
  const fk = S.cabw;
  if (want && footKey !== fk) { if (foot) scene.remove(foot); foot = buildFoot(cabC()); clipGroup(foot); scene.add(foot); footKey = fk; }
  if (foot) foot.visible = want;
}
function clipGroup(g) { g.traverse(o => { if (o.isMesh || o.isLine) [].concat(o.material).forEach(m => m && !m.clippingPlanes && clipMat(m)); }); }
