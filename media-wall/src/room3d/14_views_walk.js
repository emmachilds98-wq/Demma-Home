/* ---------------------------------------------------------------- views */
const VIEWS = {
  // v21, client: "the default 3D room render to be at the best viewing to see most if not all the room without clipping or obstruction":
  // from above the window side, the window wall cut away (updateCut): the media wall, the breast, the door, the stairs, the table's wall,
  // the PC wall, the sofa and the rug in one picture
  room:    { label: "The whole room", eye: [250, 440, -540], at: [238, 60, -118], fov: 50, above: true },
  livstand: { label: "Standing in the living room", eye: [372, 160, -6], at: [110, 150, -210], fov: STAND_FOV, stand: true },   // V1.6: Be there, from the door
  livalone: { label: "The living room on its own", eye: [-170, 520, 230], at: [240, 40, -140], fov: 46, above: true },   // v78b: from the hall's corner, the ceiling off
  landing: { label: "Landing", eye: [330, 425, 250], at: [345, 330, -60], fov: 80, box: [288, 402, 275, 485, -72, 256] },     // v66: from the top of the stairs
  hall:    { label: "Entrance hall", eye: [372, 160, 413], at: [352, 95, 60], fov: 80, box: [310, 398, 15, 225, 50, 416] },   // v69: the wall moved to 303.5   // v66: in from the front door
  garage:  { label: "Garage", eye: [250, 145, 483], at: [100, 40, 120], fov: 80, box: [8, 284, -10, 215, 52, 493] },          // v66: from inside its door
  wc:      { label: "WC", eye: [420, -95, -142], at: [420, -190, -290], fov: 80, box: [380, 462, -255, -30, -304, -140] },      // v66: from its door
  bath:    { label: "Bathroom", eye: [325, 424, -48], at: [410, 318, -240], fov: 84, box: [288, 462, 275, 485, -282, -44] },   // v75/v76/v77: from its door (v77 in the corner)   // v65: from its door, as the client's photos
  master:  { label: "Master bedroom", eye: [262, 428, 200], at: [20, 330, 300], fov: 80, box: [10, 266, 275, 485, 126, 494] },   // v72: past the 1 m cupboard   // v63: from its door, the bed facing you
  bed2:    { label: "Music room", eye: [44, 428, 30], at: [222, 318, -205], fov: 80, box: [12, 262, 275, 485, -280, 48] },   // v72: bigger behind the master   // v66: the music room from over the day bed: the keyboard, the desk under the window, the guitars
  office:  { label: "The office", eye: [298, 440, 282], at: [445, 340, 440], fov: 74, box: [290, 460, 275, 485, 282, 492] },   // v68: 225 deep   // v61: bedroom 3 from its door, the new desk ahead
  kitchen: { label: "The kitchen", eye: [215, -92, -292], at: [165, -140, 20], fov: 74, box: [8, 356, -245, -35, -300, 28] },   // v60: where the client's wide photo was taken: the L, the fridge, the cubby, the door
  house:   { label: "The whole house", eye: [-400, 1200, 1300], at: [230, 40, 40], fov: 50, above: true },   // v55: from the front, the alley side   // v54: every floor and both gardens, a draft
  // v21: the window view moved to the window's middle, over the sofa's back (it stood behind your red lamp)
  window:  { label: "From the window", eye: [190, 192, -298], at: [214, 82, -10], fov: 68 },
  wall:    { label: "The media wall", eye: [140, 128, -285], at: [93, 108, 20], fov: 52 },
  sofa:    { label: "From the sofa", eye: [85, 108, -250], at: [72, 112, 20], fov: 58 },
  door:    { label: "From the door", eye: [372, 165, -6], at: [110, 85, -210], fov: 64 },
  stairs:  { label: "From the stairs", eye: [438, 205, 4], at: [190, 70, -205], fov: 62 },
  dining:  { label: "The dining table", A: { eye: [250, 140, -262], at: [246, 88, 0] }, B: { eye: [250, 150, -150], at: [467, 112, -185] }, C: { eye: [196, 175, -232], at: [430, 78, -130] }, fov: 60 },   // v21: back from the lamp
  unfold:  { label: "The table unfolding", C: { eye: [168, 200, -262], at: [392, 84, -138] }, eye: [168, 200, -262], at: [392, 84, -138], fov: 60 },   // v32: "Watch it open", the whole table in view
  chairs:  { label: "The chair cupboard", eye: [255, 200, -190], at: [460, 95, -262], C: { eye: [262, 170, -120], at: [462, 92, -200] }, fov: 54 },   // v20; v21 clear of the lamp; v30 the compact's chair bay
  windowwall: { label: "Out of the window", eye: [236, 150, -70], at: [236, 120, -309], fov: 66 },   // v17: for the ideas' stills
  breast:  { label: "The chimney breast", eye: [246, 140, -250], at: [246, 120, 0], fov: 54 },   // v17: for the ideas' stills
  pc:      { label: "The PC side wall", eye: [345, 135, -168], at: [0, 112, -168], fov: 56 },
  // v31: sitting at the open table's far end, looking at the cabinet; the wall beside the cabinet, by the pipe boxing
  sit:     { label: "Sitting at the table", eye: [258, 115, -128], at: [455, 98, -150], fov: 62 },
  beside:  { label: "Beside the cabinet", eye: [236, 152, -112], at: [462, 84, -262], fov: 60 },
  plan:    { label: "Bird’s eye", eye: [233.5, 1050, -135], at: [233.5, 0, -134.9], fov: 30, above: true },   // v21: closer, the room fills it
  doll:    { label: "Dolls’ house", eye: [610, 450, -560], at: [228, 55, -125], fov: 44, above: true },      // v21: closer, cut away
};
let tween = null;
/* v17: the camera stays in the room: x, y and z inside its walls, in front of the chimney breast, the alcove only within it */
let walked = false;
const freeAbove = () => (RMODE !== "in" && RMODE !== "stand") || ((VIEWS[S.view] || {}).above && !walked);   // v71: Above and On its own orbit freely (V1.28: Be there keeps to the room too)
function clampRoom(p, target = false) {   // the target (what you orbit round) may sit on a wall's face or a little past it
  const KB = ROOMV();                                                          // v60: in the kitchen (v61: any room of the house), its own walls
  if (KB) { const [x0, x1, y0, y1, z0, z1] = KB, g = target ? 15 : 0, q = v3(Math.min(Math.max(-p.x / M, x0 - g), x1 + g), Math.min(Math.max(p.y / M, y0 - g), y1 + g), Math.min(Math.max(p.z / M, z0 - g), z1 + g));
    const moved = q.distanceToSquared(p) > 1e-10; p.copy(q); return moved; }
  const lo = target ? -10 : 15, x = Math.min(Math.max(-p.x / M, lo), R.W - lo), y = Math.min(Math.max(p.y / M, target ? 0 : 20), R.CEIL - (target ? 0 : 15));   // V1.28: 15 off the walls (was 4)
  const zmax = target ? R.RECESS_Z + 10 : x <= R.ALC_W ? R.ALC_D - 15 : x <= R.BREAST_X[1] + 15 ? -15 : R.RECESS_Z - 15;
  const z = Math.min(Math.max(p.z / M, R.WINDOW_Z + (target ? -30 : 15)), zmax);
  const q = v3(x, y, z), moved = q.distanceToSquared(p) > 1e-10;
  p.copy(q); return moved;
}
/* v41, client: "the camera stops you passing through walls or furniture": the furniture's boxes (each piece that stands in the room,
   whichever is showing), worked out again when something moves; the eye is pushed out of any it's inside, unless it's above that
   piece (you can still look down over the sofa) or under it (a shelf over your head) */
let SOLID = null;
const solidDirty = () => { SOLID = null; };
function solidBoxes() {
  if (SOLID) return SOLID;
  // V1.57: not the drawers in the stairs' bottom steps (you walk on them: they're the treads), their box stood across the stairs' foot
  const objs = [G.sofa, S.drawers ? G.unit_out : G.unit_in, cab, ...Object.values(MOV).map(m => m && m.pivot), ...Object.values(BES || {}), ...Object.entries(SUGG_G).filter(([k]) => k !== "stairdrawers").map(([, g]) => g)];
  SOLID = [];
  for (const o of objs) {
    if (!o || !o.isObject3D || !shown(o)) continue;
    const b = new THREE.Box3(), t = new THREE.Box3(); o.updateWorldMatrix(true, true);
    o.traverseVisible(c => { if (!c.isMesh || !c.geometry) return; if (!c.geometry.boundingBox) c.geometry.computeBoundingBox(); b.union(t.copy(c.geometry.boundingBox).applyMatrix4(c.matrixWorld)); });   // only what's showing (not the folded table's hidden parts)
    if (b.isEmpty()) continue;
    const sz = b.getSize(new THREE.Vector3()); if (sz.x > 4 || sz.z > 4) continue;   // never a whole-room group
    SOLID.push(b.expandByVector(new THREE.Vector3(0.12, 0, 0.12)));                  // 12 cm round each: the eye stays off the surface
  }
  return SOLID;
}
/* V1.28 (U1), the client: "fix technical issues like clipping": in the house's rooms the eye kept only inside the room's box, so it
   could rest on a wall's face (the near plane then showed its inside), rise over a sloped ceiling into the roof and pass through beds
   and wardrobes. Now every piece of the house (its boxes, its prisms: the slopes and eaves, its turned pieces) is solid to a 20 cm ball
   round the eye. A move into something slides along it (each axis on its own from the last good place); a view that starts inside
   something is pushed to the nearest free spot. Doors (the parts) stay passable */
const HSOLID = {}, EYE_R = 20;
const NOSOLID = new Set(["contact"]);
function hsolidSet(fk, F) {
  if (fk === "street") return;
  const b = [];
  for (const [m, list] of Object.entries(F.boxes || {})) if (!NOSOLID.has(m)) for (const q of list) b.push(q);
  for (const L of F.lathes || []) { const r = Math.max(...L.p.map(q => q[0])), hs = L.p.map(q => q[1]);
    b.push([L.c[0] - r * L.s[0], L.c[1] + Math.min(0, ...hs), L.c[2] - r * L.s[1], L.c[0] + r * L.s[0], L.c[1] + Math.max(...hs), L.c[2] + r * L.s[1]]); }
  const skin = new Set(["ceiling", "artex"]), w = [];   // V1.32: a walk ignores the ceilings' skins (each has a slab or the roof over it;
  // V1.57: and the chairs and stools (the office's stood in its doorway, a step in: you'd push past one), not the eye's view of them
  const tags = F.tags || [], soft = t => t != null && t >= 0 && /\.(chairs?|stools?)$/.test(tags[t] || "");
  for (const [m, list] of Object.entries(F.boxes || {})) if (!NOSOLID.has(m) && !skin.has(m)) { const bt = (F.bt || {})[m] || []; list.forEach((q, i) => { if (!soft(bt[i])) w.push(q); }); }   // the lower store's runs over the flight)
  const nl = (F.lathes || []).length; b.slice(b.length - nl).forEach((q, i) => { if (!soft(F.lathes[i].t)) w.push(q); });
  const p = (F.prisms || []).filter(P => !NOSOLID.has(P.m));
  HSOLID[fk] = { b, w, p, pw: p.filter(P => !soft(P.t)) };
  hLast = null;
}
function polyNear(pts, u, w, r) {          // inside the outline, or within r of its edge
  let inside = false, d2 = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j], [bx, by] = pts[i];
    if ((by > w) !== (ay > w) && u < (ax - bx) * (w - by) / (ay - by) + bx) inside = !inside;
    const ex = bx - ax, ey = by - ay, L = ex * ex + ey * ey, t = L ? Math.max(0, Math.min(1, ((u - ax) * ex + (w - ay) * ey) / L)) : 0;
    const dx = ax + t * ex - u, dy = ay + t * ey - w; d2 = Math.min(d2, dx * dx + dy * dy);
  }
  return inside || d2 < r * r;
}
function hBlocked(x, y, z, r = EYE_R, all = false) {    // room cm; all: the floors not drawn too, and not the ceilings' skins (walking)
  for (const S_ of Object.values(HSOLID)) {
    if (!S_.g || (!all && !shown(S_.g))) continue;
    for (const q of all ? S_.w : S_.b) if (x > q[0] - r && x < q[3] + r && y > q[1] - r && y < q[4] + r && z > q[2] - r && z < q[5] + r) return true;
    for (const P of (all ? S_.pw || S_.p : S_.p)) {
      const [a, uw] = P.axis === "x" ? [x, [z, y]] : P.axis === "z" ? [z, [x, y]] : [y, [x, z]];
      if (a > P.a - r && a < P.b + r && polyNear(P.pts, uw[0], uw[1], r)) return true;
    }
  }
  return false;
}
let hLast = null;                           // the eye's last free place (room cm)
function houseCollide() {                   // true if it moved the eye
  const c = camera.position, p = [-c.x / M, c.y / M, c.z / M];
  if (!hBlocked(...p)) { hLast = p; return false; }
  let q = null;
  if (hLast && !hBlocked(...hLast)) {       // slide: each axis on its own, from the last free place
    q = hLast.slice(); for (const k of [0, 2, 1]) { const t = q.slice(); t[k] = p[k]; if (!hBlocked(...t)) q = t; }
  } else {                                  // a view that starts inside something: the nearest free spot round it
    search: for (let d = 5; d <= 120; d += 5) for (let a = 0; a < 16; a++) for (const dy of [0, -d, d]) {
      const t = [p[0] + Math.cos(a * Math.PI / 8) * d, p[1] + dy, p[2] + Math.sin(a * Math.PI / 8) * d];
      if (!hBlocked(...t)) { q = t; break search; } }
    if (!q) return false;
  }
  hLast = q; c.set(-q[0] * M, q[1] * M, q[2] * M); return true;
}
/* V1.32 (U7), the client: "review how to make the movement within the house better": Be there in the house's rooms is walking. Hold
   W A S D or the arrows (Q and E turn) on a computer, the stick on a phone; drag to look. A body, not just an eye: it's stopped at the
   knee, the hip and the eye (so not over a bed or through a wardrobe), steps up a stair (a rise up to 35) and follows the floor down;
   it slides along what it meets. Walk into the next room and its name, its lights and what's drawn follow you (the eye stays where it
   is); a door opens as you reach it. V1.38: the living room too (below) */
const WALK = { keys: new Set(), stick: [0, 0], v: new THREE.Vector2(), feet: null, doorT: 0, warmT: 0, hinted: false, held: 0, pace: 1 };
const walking = () => (RMODE === "stand" && !!ROOMV() || S.view === "livstand") && !tween;   // V1.38: and the living room's Be there
/* V1.38 (UPGRADE_REVIEW Next 1), the client: "review how to make the movement within the house better": the living room is drawn on its
   own (geometry.py's measured room, not the house file), so a walk takes its walls, its furniture and its flight from that: in through
   its door from the hall (the door opens as you reach it), round the room, up its stairs to the landing, and back down */
const LIV = () => R.HOUSE3.living;   // V1.44 (V1_PLAN phase 5): the living room's shell from the house file (house/model.py living_shell)
const FLIGHT = () => LIV().flight;
function livSolids() {                      // room cm [x0, y0, z0, x1, y1, z1]: its walls (the door's gap), the flight's open side, the ceiling, the pipe box; what stands in it
  const L = LIV(), b = L.solids.slice(), d = L.door;
  if (!doorOpen(HPARTS["door.living_door"])) b.push([d.a, -60, d.line, d.b, d.h, d.line + 6]);   // its door shut (it opens as you reach it)
  for (const q of solidBoxes()) b.push([-q.max.x / M + 12, q.min.y / M, q.min.z / M + 12, -q.min.x / M - 12, q.max.y / M, q.max.z / M - 12]);   // three's x flipped; V1.57: without the eye's 12 cm (the body has its own 18: the two closed the stairs' foot)
  return b;
}
const livFloors = () => LIV().floors;      // its floor, each tread and the top landing (to walk on, not solid: a body rises onto them)
const nearLiving = (x, y, z) => x > -60 && x < R.W + 60 && z > R.WINDOW_Z - 60 && z < FLIGHT().zl1 + 30 && y < 560;
function livBlocked(x, y, z, r) {
  if (!nearLiving(x, y, z)) return false;
  for (const q of livSolids()) if (x > q[0] - r && x < q[3] + r && y > q[1] - r && y < q[4] + r && z > q[2] - r && z < q[5] + r) return true;
  return false;
}
const BODY = [[55, 18], [105, 18], [STAND_EYE, 12]];
function bodyBlocked(x, feet, z, hs = BODY) {
  for (const [h, r] of hs) if (hBlocked(x, feet + h, z, r, true) || livBlocked(x, feet + h, z, r)) return true;   // the head 12 (a doorway's head clears it from the last stair)
  return false;
}
function floorAtCm(x, z, feet) {            // V1.57: a foot, not a point: a hairline gap in a doorway's floor (bedrooms 2 and 3, the master) stopped a walk dead
  const f = floorAt1(x, z, feet); if (f > feet - 30) return f;
  let b = f; for (const [dx, dz] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) b = Math.max(b, floorAt1(x + dx, z + dz, feet));
  return b > feet - 30 ? b : f;
}
function floorAt1(x, z, feet) {             // the top of what's underfoot: the highest at or under a step up (24: the stairs' 20, not a bed's base: V1.53)
  let best = -Infinity;
  const under = q => { if (x > q[0] && x < q[3] && z > q[2] && z < q[5] && q[4] <= feet + 24 && q[4] > best) best = q[4]; };
  for (const S_ of Object.values(HSOLID)) if (S_.g) S_.b.forEach(under);
  if (nearLiving(x, feet, z)) livFloors().forEach(under);
  return best;
}
function walkMove(side, fwd, turn, dt) {    // -1..1 each; true if the eye moved
  if (tween) tween = null;                  // V1.48: a walk takes over from a fly still under way (keys wait for it; a direct step doesn't)
  const cam = camera.position, x0 = -cam.x / M, z0 = cam.z / M;
  if (WALK.feet === null) WALK.feet = cam.y / M - STAND_EYE;
  const d = controls.target.clone().sub(cam); d.y = 0; if (d.lengthSq() < 1e-8) d.set(0, 0, 1); d.normalize();
  if (turn) { const a = -turn * 1.8 * dt; d.applyAxisAngle(new THREE.Vector3(0, 1, 0), a); const t = controls.target.clone().sub(cam).applyAxisAngle(new THREE.Vector3(0, 1, 0), a); controls.target.copy(cam).add(t); }
  const sp = 140 * dt * (WALK.fast ? 2.2 : WALK.pace), sd = new THREE.Vector3(-d.z, 0, d.x);   // V1.53: Shift hurries
  const mv = d.clone().multiplyScalar(fwd * sp).add(sd.multiplyScalar(side * sp));    // cm in three's axes
  let x = x0 - mv.x, z = z0 + mv.z;                                                    // room cm (x flipped)
  const blk = (x_, z_) => { const f_ = floorAtCm(x_, z_, WALK.feet);   // V1.38: tested where it will stand, a step up taken
    if (!(f_ < WALK.feet - 6 && f_ > WALK.feet - 45)) return bodyBlocked(x_, Math.max(WALK.feet, f_), z_);
    // V1.57: a step down: the chest and head where they'll be (tested a step higher, the living room's stairs over the lower stairs met your
    // head), the knee where it is (a step lower, it met the edge of the step just left)
    return bodyBlocked(x_, f_, z_, BODY.slice(1)) || bodyBlocked(x_, WALK.feet, z_, BODY.slice(0, 1)); };
  /* V1.55, the client: "on mobile version I tried to walk into the first floor bedroom two and clipped into the living room without wanting
     to": heading from the top of the living room's stairs for bedroom 2's door, the wall beside the stairs stopped the walk and its slide
     along that wall took it down the stairs, a tread at a time, into the living room. A step down is now only taken on purpose: never by a
     slide along a wall, the living room's flight only facing down it, and never off an edge (more than two treads at once, or no floor) */
  const L = FLIGHT(), here = floorAtCm(x0, z0, WALK.feet), ref = here > -Infinity ? here : WALK.feet;
  const onFlight = (x_, z_) => x_ > L.x0 - 4 && x_ < L.x1 && z_ > L.z0 - 12 && z_ < L.zl1;
  const badDown = (x_, z_, slid) => {
    const f = floorAtCm(x_, z_, WALK.feet); if (!(f < ref - 6)) return false;    // level, or up a step: fine
    if (f < ref - 45 || slid) return true;
    /* V2.24: from its top landing onto the treads only facing squarely down them (within about 30°): with the first floor's stairwell
       measured 85 (wider than the flight), heading across it for bedroom 2 stepped onto the top tread at 46° and along the stair box's
       wall top beside it; now it eases along the landing round the stairwell. On the flight itself, as before */
    const onto = z0 >= L.zl - 1.5 && z_ < L.zl - 1.5;
    return onFlight(x_, z_) && (z_ - z0) > -(onto ? 0.86 : 0.6) * Math.hypot(x_ - x0, z_ - z0);   // the flight runs down toward -z
  };
  let slid = false;
  if (!blk(x0, z0) && blk(x, z)) {   // free to step out of something you start in (Be there by the guitars)
    slid = true; if (!blk(x, z0)) z = z0; else if (!blk(x0, z)) x = x0; else { x = x0; z = z0; } }
  if ((x !== x0 || z !== z0) && badDown(x, z, slid)) { x = x0; z = z0; }
  /* V1.56: stopped dead (a door's frame, a bed's corner) with an opening a little to one side: ease toward it, as you would, and on
     through (it took steering to the pixel on a phone's stick). Only when the way 25 cm on from there is clear, never down a step */
  if (x === x0 && z === z0 && (fwd || side)) {
    const dx_ = -mv.x, dz_ = mv.z, l_ = Math.hypot(dx_, dz_) || 1, ux = dx_ / l_, uz = dz_ / l_, px = -uz, pz = ux;
    for (const o of [8, -8, 16, -16, 24, -24, 32, -32]) {
      const ax = x0 + px * o + ux * 25, az = z0 + pz * o + uz * 25;
      if (blk(ax, az) || badDown(ax, az, true) || blk(x0 + px * o, z0 + pz * o)) continue;
      const st = Math.sign(o) * Math.min(Math.abs(o), sp * 0.8), nx = x0 + px * st, nz = z0 + pz * st;
      if (!blk(nx, nz) && !badDown(nx, nz, true)) { x = nx; z = nz; }
      break;
    }
  }
  const fl = floorAtCm(x, z, WALK.feet);
  if (fl > -Infinity && fl > WALK.feet - 400) WALK.feet += (fl - WALK.feet) * Math.min(1, dt * 12);
  const ny = (WALK.feet + STAND_EYE) * M, moved = Math.abs(x - x0) + Math.abs(z - z0) > 1e-4 || Math.abs(ny - cam.y) > 1e-5 || !!turn;
  if (!moved) { walkDoors(x0, WALK.feet, z0); return false; }   // V1.57: a shut door you're stopped against opens too (it opened only once a step had gone)
  const delta = v3(x, 0, z).sub(v3(x0, 0, z0)); delta.y = ny - cam.y;
  cam.add(delta); controls.target.add(delta); hLast = [x, ny / M, z];
  walkRoom(x, WALK.feet, z); warmNear(x, WALK.feet, z); walkDoors(x, WALK.feet, z);
  return true;
}
const WALK_VIEW = { lower_landing: "kitchen", lower_stairs: "kitchen" };   // V1.57: walked down the lower stairs, the lower floor's view (it stayed the hall's)
function walkRoom(x, feet, z) {             // walked into another room with its own view: be in it, where you stand
  const L = FLIGHT();
  // V1.57: and only with your feet at its tread there: the flight climbs over the hall, and walking in the hall under it took you into the living room
  if (x > L.x0 - 4 && x < L.x1 && z > L.z0 - 12 && z < L.zl1 && feet < 200 && feet > -60 && feet > L.r * Math.max(0, (z - L.z0) / L.g) - 45) {   // V1.53: not from the kitchen under it   // V1.38: on the living room's flight: its room low down, the landing's view higher
    const want = feet < 60 ? "livstand" : "landing"; if (want !== S.view) enterRoom(want); return; }
  const LB = LIV().box;
  if (x > LB[0] && x < LB[1] && z > LB[2] && z < LB[3] + 2 && feet < 120 && feet > -60) {   // V1.38: in the living room (V1.53: not the kitchen under it)
    if (S.view !== "livstand" && z < LB[3] - 12) enterRoom("livstand"); return; }   // V1.39: well past the door's line (to the hall's box, 45: no flicker in the doorway)
  const rooms = R.HOUSE3.rooms || {};
  for (const [id, r] of Object.entries(rooms)) {
    if (x < r[0] || x > r[1] || z < r[2] || z > r[3] || Math.abs(feet - r[4]) > 130) continue;
    if (id !== hereRoom) { hereRoom = id; brandPlace(); }
    const v = ROOM_VIEW[id] || WALK_VIEW[id]; if (v && v !== S.view && VIEWS[v] && VIEWS[v].box) enterRoom(v);
    return;
  }
}
function enterRoom(name, warm) {   // V2.42: warm, the warm-up's visit there and back: no card shut, nothing resized, saved or shown
  if (!warm && actId && typeof closeAct === "function") closeAct();
  const was = HOUSEV(S.view); S.view = name;
  if (VIEWS[name] && VIEWS[name].box) RMODE = "stand";   // V1.38: walked out of the living room into the house's rooms: still walking
  if (houseG && was !== HOUSEV(name)) {                   // V1.38: between the living room (drawn on its own) and the house's rooms
    houseG.visible = HOUSEV(name); setAbove(true); if (garden3d) garden3d.visible = HOUSEV(name);
    if (started) { applyLight(); if (!warm) sizeRenderer(); } }
  applyFloors(); placeRoomLights(); outdoor(); reshadow(); if (warm) return;
  syncRmode(); store.set(KEY, S); updateCaption(); brandPlace();
  qsa("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
}
/* V2.30, the client: "i want fluid motion and no slow change of view when moving around the house ... almost like im in a first person
   pov in a game": walking between the house and the living room swaps the lights in play, so every shader in sight was built at the
   doorway (about 30: a freeze mid-step), and each room's own (its cutaway, its lights) at its door. Standing still while walking, each
   room is visited once off screen (there and back in one go, nothing culled, a room a pause), so its shaders are ready before you get
   there */
const WARMED = new Set();
function warmSwitch() {
  if (S.view === "house") return warmHouse();
  if (!(RMODE === "stand" || S.view === "livstand")) return false;
  const to = ["livstand", ...Object.keys(VIEWS).filter(k => VIEWS[k].box)].find(k => k !== S.view && !WARMED.has(k + S.quality));
  return !!to && warmRoom(to);
}
function warmAt(key, go, back) {   // a visit off screen: go there, ask for the shaders of what shows, come back
  if (!houseG || !R.HOUSE3 || LOWD || WARMED.has(key + S.quality)) return false; WARMED.add(key + S.quality);
  /* V2.64, the client's iPhone: the visit drew the whole room at once, every new shader built one after another before the frame
     ended (a room's 20 to 30: seconds standing still, and a tap then waited for them). Now the room's shaders are only asked for
     (compileClipped, in its lights; one drawn per set of cutting planes) and build in parallel where the browser can, the page still
     answering; into the same kind of target as the frame's, so they match. N35: nothing's drawn into the shadows there, so they're
     kept (they were drawn again after every visit) */
  const was = gl.getRenderTarget(), su = gl.shadowMap.needsUpdate;
  if (!PRE.rt) { PRE.rt = new THREE.WebGLRenderTarget(1, 1); PRE.rt.isXRRenderTarget = true; PRE.rt.texture.colorSpace = gl.outputColorSpace; }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  try { go(); gl.setRenderTarget(postLive() ? PRE.rtAO : PRE.rt); compileClipped(camera, true); }
  finally { gl.setRenderTarget(was); back(); gl.shadowMap.needsUpdate = su; }
  dirty(); return true;
}
function warmRoom(to) { const v = S.view, rm = RMODE; return warmAt(to, () => enterRoom(to, true), () => { enterRoom(v, true); RMODE = rm; }); }
/* N54 (V3.09), the client 8 Nov 2026: "optimise the pc version as much as the mobile version": from the whole house the first step into the
   living room built its 58 shaders on the spot (its own 36 lights; on a Windows PC each goes through the graphics driver's compiler: a
   freeze of seconds), a floor's cut 2 to 5; the rooms were warmed only once you stood in one. Now, a pause at a time, the house warms
   the living room and each floor off screen too */
function warmHouse() {
  const f = hfloor, to = ["livstand", "fl:ground", "fl:first", "fl:lower"].find(k => k !== "fl:" + f && !WARMED.has(k + S.quality));
  if (!to || !houseG || !R.HOUSE3 || LOWD) return false;
  livShow();   // put away from outside: shown for the visit, put away again after (warmAt keeps the shadows as they were)
  return to === "livstand" ? warmAt(to, () => enterRoom(to, true), () => { enterRoom("house", true); setAbove(false); livingFromOutside(); })
    : warmAt(to, () => { hfloor = to.slice(3); applyFloors(); }, () => { hfloor = f; applyFloors(); livingFromOutside(); });
}
/* N35 (V2.87): walking in from the hall built the living room's 24 shaders (and 4 of its shadows') on the step through its door, the
   idle visit not yet made. Now a room 1.5 m or less away (through a door, up or down its stairs) is visited as you walk up to it, one a
   step at most, its shaders building in parallel before you're in */
function warmNear(x, feet, z) {
  const now = performance.now(); if (now - WALK.warmT < 250) return; WALK.warmT = now;
  const N = 150, near = (x0, x1, z0, z1) => x > x0 - N && x < x1 + N && z > z0 - N && z < z1 + N, L = LIV().box, want = [];
  if (near(L[0], L[1], L[2], L[3]) && feet > -200 && feet < 320) want.push("livstand", "landing");   // and its stairs up to the landing
  for (const [id, r] of Object.entries(R.HOUSE3.rooms || {})) { const v = ROOM_VIEW[id] || WALK_VIEW[id]; if (v && VIEWS[v] && VIEWS[v].box && near(r[0], r[1], r[2], r[3]) && Math.abs(feet - r[4]) < 230) want.push(v); }
  want.find(v => v !== S.view && warmRoom(v));
}
/* V3.14, the client: "still has two front doors": the bin cupboards' doors, once open, were remembered open on the device (V1.26b) and,
   both open, lie across the porch in front of the front door. They always start shut, aren't remembered, open one at a time (the other
   shuts) and "Open every door" leaves them */
const BINS = ["door.store_w", "door.store_e"];
function walkDoors(x, feet, z) {            // a shut door opens as you come up to it
  const now = performance.now(); if (now - WALK.doorT < 200) return; WALK.doorT = now;
  const w = new THREE.Vector3();
  for (const [pk, P] of Object.entries(HPARTS)) {
    /* V2.99, the client: "a second front door seems to show": the bin cupboards' doors met across the porch as you came up to the front
       door; they open on a tap only */
    if (!pk.startsWith("door.") || BINS.includes(pk) || doorOpen(P)) continue;
    P.g.getWorldPosition(w); const dx = -w.x / M - x, dz = w.z / M - z, dy = w.y / M - feet;
    if (Math.hypot(dx, dz) < 95 && dy > -40 && dy < 220) swingDoor(pk, true);
  }
}
function walkTick(dt) {
  if (!walking()) { WALK.feet = null; WALK.v.set(0, 0); return false; }
  if (!houseG && R.HOUSE && (WALK.keys.size || WALK.stick[0] || WALK.stick[1])) { buildHouse(); reshadow(); applyFloors(); }   // V1.38: the living room opened on its own: the house to walk out into
  const k = WALK.keys, f = (k.has("f") ? 1 : 0) - (k.has("b") ? 1 : 0) + WALK.stick[1], sd = (k.has("r") ? 1 : 0) - (k.has("l") ? 1 : 0) + WALK.stick[0];
  const want = new THREE.Vector2(sd, f); if (want.lengthSq() > 1) want.normalize();
  WALK.v.lerp(want, Math.min(1, dt * 12));   // eases in and out (V2.30: snappier, as a game's walk: was 8)
  /* V2.60, the client: "still a bit slow moving in the house": a short press is still a careful step; held over half a second, the walk
     eases up to half as quick again (a stroll to a brisk walk, 1.4 to 2.1 m/s) over the next second, as a game's does */
  WALK.held = want.lengthSq() > 0.25 ? WALK.held + dt : 0;
  { const u = Math.min(1, Math.max(0, WALK.held - 0.5)); WALK.pace = 1 + 0.5 * u * u * (3 - 2 * u); }
  const turn = (k.has("tr") ? 1 : 0) - (k.has("tl") ? 1 : 0);
  if (WALK.v.lengthSq() < 1e-5 && !turn) { if (WALK.feet === null) WALK.feet = camera.position.y / M - STAND_EYE; return false; }
  return walkMove(WALK.v.x, WALK.v.y, turn, dt);
}
/* V1.32: the phone's stick (bottom left, while walking): drag it the way to go */
const COARSE = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
const STICK = document.createElement("div"); STICK.className = "r3d-stick"; STICK.hidden = true; STICK.setAttribute("aria-hidden", "true"); STICK.innerHTML = "<i></i>"; root.append(STICK);
let stickId = null, stickC = [0, 0];
function stickMove(e) { let dx = e.clientX - stickC[0], dy = e.clientY - stickC[1]; const RR = 44, l = Math.hypot(dx, dy); if (l > RR) { dx *= RR / l; dy *= RR / l; }
  STICK.style.setProperty("--x", dx + "px"); STICK.style.setProperty("--y", dy + "px"); WALK.stick = [dx / RR, -dy / RR]; dirty(); }
STICK.addEventListener("pointerdown", e => { stickId = e.pointerId; try { STICK.setPointerCapture(e.pointerId); } catch (err) {} const r = STICK.getBoundingClientRect(); stickC = [r.left + r.width / 2, r.top + r.height / 2]; stickMove(e); e.preventDefault(); });
STICK.addEventListener("pointermove", e => { if (e.pointerId === stickId) stickMove(e); });
const stickEnd = e => { if (e.pointerId !== stickId) return; stickId = null; WALK.stick = [0, 0]; STICK.style.setProperty("--x", "0px"); STICK.style.setProperty("--y", "0px"); };
STICK.addEventListener("pointerup", stickEnd); STICK.addEventListener("pointercancel", stickEnd);
/* V2.31, the client: "fluid motion ... almost like im in a first person pov in a game": on a computer, while walking, Mouse look (or M)
   holds the pointer: the mouse turns you with no button held, W A S D walk, a click opens what's under the dot in the middle (a card lets
   the pointer go), a double-click walks you to the floor there, Esc stops it. Phones keep the stick and the drag */
const MLOOK = qs("#r3d-mlook"), mlookOn = () => document.pointerLockElement === canvas;
const mlook = on => { if (on && !COARSE && walking() && canvas.requestPointerLock) { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } else if (!on && mlookOn()) document.exitPointerLock(); };
const aimed = e => { if (!mlookOn()) return e; const r = canvas.getBoundingClientRect();   // where the dot is, for a click while the pointer is held
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: "mouse", button: e.button, timeStamp: e.timeStamp, preventDefault: () => e.preventDefault() }; };
MLOOK?.addEventListener("click", () => mlook(!mlookOn()));
document.addEventListener("keydown", e => { if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName) && walking()) mlook(!mlookOn()); });
document.addEventListener("pointerlockchange", () => { const on = mlookOn(); root.classList.toggle("mlook", on); MLOOK?.setAttribute("aria-pressed", String(on));
  if (on) toast("Mouse look: move to look, W A S D to walk, click to open, Esc to stop"); });
addEventListener("mousemove", e => { if (mlookOn() && (e.movementX || e.movementY)) lookTurn(-e.movementX, -e.movementY); });
function syncStick() {
  const on = RMODE === "stand" && !!ROOMV() || S.view === "livstand"; STICK.hidden = !(on && COARSE); root.classList.toggle("walking", on && COARSE);
  if (MLOOK) MLOOK.hidden = COARSE || !on; if (!on && mlookOn()) document.exitPointerLock();
  if (on && !WALK.hinted) { WALK.hinted = true;   // V2.42: each visit (it was once ever), the keys as they are
    setTimeout(() => toast(COARSE ? "Walk with the stick, drag to look" : "W S walk · ← → turn · A D step aside · drag or M to look · double-click a floor to go there"), 700); }
}
function collide(p = camera.position) {    // true if it moved the eye
  let moved = false;
  if (ROOMV()) return p === camera.position ? houseCollide() : false;   // v60: the living room's furniture isn't in the other rooms; V1.28: the house's own pieces are
  for (const b of solidBoxes()) {
    if (p.y > b.max.y + 0.05 || p.y < b.min.y - 0.2) continue;
    if (p.x <= b.min.x || p.x >= b.max.x || p.z <= b.min.z || p.z >= b.max.z) continue;
    const dx0 = p.x - b.min.x, dx1 = b.max.x - p.x, dz0 = p.z - b.min.z, dz1 = b.max.z - p.z, m = Math.min(dx0, dx1, dz0, dz1);
    if (m === dx0) p.x = b.min.x; else if (m === dx1) p.x = b.max.x; else if (m === dz0) p.z = b.min.z; else p.z = b.max.z;
    moved = true;
  }
  return moved;
}
/* v41, client: "a double-tap on the floor flies you to that spot, looking across the room": stand there at eye height (155), facing the
   room's middle (or the media wall from the middle itself) */
let lastTap = null;
function floorHop(e) {
  if (R.HOUSE3) { const sp = spotAt(e); return sp ? goStand(sp.x, sp.fy, sp.z) : mapCentre(e); }   // V1.53: from any view, stand where you double-click (V2.74: over the house, no room there: centre on it)
  ray.setFromCamera(ndc(e), camera);
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h));
  const KB = ROOMV();
  if (KB) {   // V1.28: in the house's rooms too (it used the living room's floor, at 0: only the ground floor answered)
    if (!hit || !hit.face || RMODE === "above" || RMODE === "alone") return false;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld), rr = (R.HOUSE3.rooms || {})[VIEW_ROOM[S.view]], fy = rr ? rr[4] : KB[2];
    if (n.y < 0.7 || hit.point.y / M > fy + 40) return false;                       // only the floor (or a rug on it)
    const x = -hit.point.x / M, z = hit.point.z / M, d = controls.target.clone().sub(camera.position); d.y = 0;
    if (d.lengthSq() < 1e-8) d.set(0, 0, 1); d.normalize();
    flyTo([x, fy + STAND_EYE, z], [x - d.x / M, fy + STAND_EYE - 10, z + d.z / M], baseFov, false, false, 700); walked = true;
    return true;
  }
  const f = floorAt(e); if (!f || (hit && hit.point.y > 0.03)) return false;     // only the floor itself
  const p = v3(f.x, 155, f.z); clampRoom(p); collide(p); const x = -p.x / M, z = p.z / M;
  const cx = R.W / 2, cz = (R.WINDOW_Z + R.ALC_D) / 2, far = Math.hypot(x - cx, z - cz) < 60;
  const at = far ? [R.ALC_W / 2, 110, R.ALC_D] : [cx, 100, cz];
  if (S.cam === "look") { S.cam = "orbit"; applyCam(false); syncButtons(); }
  flyTo([x, 155, z], at, 60, false, false, 900); walked = true;
  return true;
}
/* V1.53, the client: "make double click in an area on pc take you there and wasd and arrow keys move you around as if you're walking while
   holding mouse / screen will rotate view. enable a drop in man like street view to any area of the house too": a double-click (a double-tap)
   on any floor you can see, from the whole house, a floor, a room from above or in it, stands you there (Be there: the keys walk, a drag
   looks round where you stand); the figure in the corner drops you wherever you let go of it, a ring on the floor showing where. The spot:
   what the pointer is on (a floor, a rug, the top of a bed: the floor under it, the nearest place a body fits), or through a roof or a wall,
   the first floor down with a room under the pointer that you can stand in */
function standRoomAt(x, y, z) {             // [the room, its floor's level] at a point in the house (cm), if it's one you can stand in
  if (!R.HOUSE3) return null;
  const LB = LIV().box;
  if (x > LB[0] && x < LB[1] && z > LB[2] && z < LB[3] && y > -30 && y < 245) return ["living", 0];
  let best = null;
  for (const [id, r] of Object.entries(R.HOUSE3.rooms || {})) {
    if (x < r[0] || x > r[1] || z < r[2] || z > r[3] || y < r[4] - 30 || y > r[4] + 245) continue;
    if (!best || ((ROOM_VIEW[id] || WALK_VIEW[id]) && !(ROOM_VIEW[best[0]] || WALK_VIEW[best[0]]))) best = [id, r[4]];
  }
  return best && (ROOM_VIEW[best[0]] || WALK_VIEW[best[0]]) ? best : null;
}
function spotAt(e) {                        // where a double-click or the figure would stand you: {x, z, fy, id}, or null
  if (!R.HOUSE3) return null;
  ray.setFromCamera(ndc(e), camera);
  const cut = q => RPLANES.some(pl => pl.distanceToPoint(q) < 0);
  const h = ray.intersectObjects(scene.children, true).find(q => q.object.isMesh && shown(q.object) && q.object.material && q.object.material.visible !== false
    && !["glass", "contact"].includes(q.object.material.userData && q.object.material.userData.hk) && !cut(q.point) && !clippedAt(q));
  if (h && h.distance < 60) {
    const p = h.point.clone().addScaledVector(ray.ray.direction, -0.05);   // 5 cm back toward the eye: this side of a wall
    const r = standRoomAt(-p.x / M, p.y / M - 1, p.z / M);
    if (r) return { x: -p.x / M, z: p.z / M, fy: r[1], id: r[0] };
  }
  for (const [fk, fy] of [["first", 260], ["ground", 0], ["lower", -260]]) {   // through the roof, or from a floor above: the first floor down
    if (HFLOOR[fk] && !shown(HFLOOR[fk]) && !(fk === "ground" && !(houseG && houseG.visible))) continue;
    const q = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -fy * M), q)) continue;
    const r = standRoomAt(-q.x / M, fy + 1, q.z / M); if (r) return { x: -q.x / M, z: q.z / M, fy, id: r[0] };
  }
  return null;
}
function freeSpot(x, fy, z) {               // the nearest place a body fits on the floor itself (not on the bed or in a wardrobe), within 1.5 m
  const fits = (X, Z) => !bodyBlocked(X, fy, Z) && floorAtCm(X, Z, fy) <= fy + 6 && !!standRoomAt(X, fy + 1, Z);
  if (fits(x, z)) return [x, z];
  for (let r = 15; r <= 150; r += 15) for (let a = 0; a < 16; a++) {
    const t = a / 16 * Math.PI * 2, X = x + Math.cos(t) * r, Z = z + Math.sin(t) * r;
    if (fits(X, Z)) return [X, Z];
  }
  return [x, z];
}
const roomName = id => id === "living" ? "Living room" : ((Object.values(R.HOUSE3.floors).flatMap(F => F.labels || []).find(l => l.id === id) || {}).name || "");
function goStand(x, fy, z, look, dur) {      // Be there at (x, z) on the floor at fy, facing look ([dx, dz]) or on the way the eye came
  const r = standRoomAt(x, fy + 1, z); if (!r) return false;
  [x, z] = freeSpot(x, fy, z);
  let [dx, dz] = look || (() => {                 // the way you were looking (from straight above: up the screen), as Street View does
    const f = new THREE.Vector3(); camera.getWorldDirection(f); if (Math.hypot(f.x, f.z) < 0.35) f.set(0, 1, 0).applyQuaternion(camera.quaternion);
    return [-f.x * 100, f.z * 100]; })();
  if (Math.hypot(dx, dz) < 20) { const rr = r[0] === "living" ? [0, R.W, R.WINDOW_Z, R.ALC_D] : R.HOUSE3.rooms[r[0]]; dx = (rr[0] + rr[1]) / 2 - x; dz = (rr[2] + rr[3]) / 2 - z; }
  if (Math.hypot(dx, dz) < 1) { dx = 0; dz = -1; }
  const l = Math.hypot(dx, dz); dx /= l; dz /= l;
  if (actId && typeof closeAct === "function") closeAct();
  hereRoom = r[0];
  const v = r[0] === "living" ? "livstand" : ROOM_VIEW[r[0]] || WALK_VIEW[r[0]];
  if (v === "livstand") { if (S.view !== v) setView(v); standLook(true);
    flyTo([x, STAND_EYE, z], [x + dx * 100, STAND_EYE - 10, z + dz * 100], STAND_FOV, false, false, dur || GO_MS); }
  else { standSpot = [x, z, dx, dz, dur]; if (S.view !== v) setView(v); setRmode("stand"); }
  walked = true; dirty(); return true;
}
function startWalk() {                      // a walk key in a room's In it: stand where you are, then walk on
  if (!R.HOUSE3 || tween || !((ROOMV() && RMODE === "in") || S.view === "window")) return false;
  const c = camera.position, d = controls.target.clone().sub(c), x = -c.x / M, z = c.z / M, r = standRoomAt(x, c.y / M - 120, z);
  return !!r && goStand(x, r[1], z, [-d.x, d.z], 300);   // V2.42: down to your eyes in 0.3 s, then on
}
/* the figure: drag it over the house, a ring and the room's name show where it would put you down, let go to stand there */
const PEG = document.createElement("button"); PEG.type = "button"; PEG.className = "r3d-peg"; PEG.id = "r3d-peg";
PEG.innerHTML = '<span class="ms" aria-hidden="true">person</span>'; PEG.title = "Drag me to where you want to stand";
PEG.setAttribute("aria-label", "Drop in: drag the figure onto the house to stand there"); root.append(PEG);
const PEGM = { id: null, moved: false, x0: 0, y0: 0, s: null, ghost: null, ring: null };
let pegRaf = 0, pegEv = null;
function pegShow(e, now) {                  // the ghost follows at once; where it would land is worked out once a frame (a phone's moves come faster)
  const r = stage.getBoundingClientRect(), cv = canvas.getBoundingClientRect(), g = PEGM.ghost;
  g.style.left = (e.clientX - r.left) + "px"; g.style.top = (e.clientY - r.top) + "px";
  if (!now) { pegEv = { clientX: e.clientX, clientY: e.clientY }; if (!pegRaf) pegRaf = requestAnimationFrame(() => { pegRaf = 0; if (PEGM.ghost && pegEv) pegShow(pegEv, true); }); return; }
  const over = e.clientX >= cv.left && e.clientX <= cv.right && e.clientY >= cv.top && e.clientY <= cv.bottom;
  const sp = PEGM.s = over ? spotAt(e) : null;
  g.classList.toggle("ok", !!sp); g.querySelector("b").textContent = sp ? roomName(sp.id) : over ? "Not a room to stand in" : "";
  if (!PEGM.ring) { PEGM.ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.26, 40), new THREE.MeshBasicMaterial({ color: "#ffd54a", transparent: true, opacity: 0.95, depthTest: false, toneMapped: false, side: THREE.DoubleSide }));
    PEGM.ring.rotation.x = -Math.PI / 2; PEGM.ring.renderOrder = 999; PEGM.ring.raycast = () => {}; scene.add(PEGM.ring); }
  PEGM.ring.visible = !!sp; if (sp) PEGM.ring.position.copy(v3(sp.x, sp.fy + 2, sp.z));
  dirty();
}
function pegEnd() { if (PEGM.ghost) PEGM.ghost.remove(); PEGM.ghost = null; if (PEGM.ring) PEGM.ring.visible = false; root.classList.remove("pegging"); dirty(); }
PEG.addEventListener("pointerdown", e => { if (e.button > 0) return; PEGM.id = e.pointerId; PEGM.x0 = e.clientX; PEGM.y0 = e.clientY; PEGM.moved = false;
  try { PEG.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
PEG.addEventListener("pointermove", e => {
  if (e.pointerId !== PEGM.id || (!PEGM.moved && Math.hypot(e.clientX - PEGM.x0, e.clientY - PEGM.y0) < 6)) return;
  if (!PEGM.moved) { PEGM.moved = true; root.classList.add("pegging"); if (actId) closeAct();
    PEGM.ghost = document.createElement("div"); PEGM.ghost.className = "r3d-pegghost"; PEGM.ghost.setAttribute("aria-hidden", "true");
    PEGM.ghost.innerHTML = '<span class="ms">person</span><b></b>'; stage.append(PEGM.ghost); }
  pegShow(e);
});
PEG.addEventListener("pointerup", e => {
  if (e.pointerId !== PEGM.id) return; PEGM.id = null;
  if (!PEGM.moved) { toast("Drag the figure onto the house to stand there"); return; }
  if (PEGM.ghost) pegShow(e, true); const sp = PEGM.s; pegEnd();
  if (sp) goStand(sp.x, sp.fy, sp.z); else toast("Drop it on a room's floor");
});
PEG.addEventListener("pointercancel", e => { if (e.pointerId === PEGM.id) { PEGM.id = null; pegEnd(); } });
PEG.addEventListener("click", e => { if (e.detail === 0) toast("Drag the figure onto the house to stand there, or double-click a floor"); });   // from the keyboard
function walk(kind, k = 1) {        // about 15 cm a press on the floor plane; turns 10°; v31: up and down 10 cm; k < 1 while a button's held
  if (tween) return;
  if (!houseG && R.HOUSE && walking()) { buildHouse(); reshadow(); applyFloors(); }   // V1.38: as walkTick
  if (walking()) { const m = { f: [0, 1], b: [0, -1], l: [-1, 0], r: [1, 0] }[kind], t = { tl: -1, tr: 1 }[kind];   // V1.32: as a walk, by its rules
    if (m || t) { walkMove(m ? m[0] : 0, m ? m[1] : 0, t || 0, (t ? 0.1 : 0.11) * k); controls.update(); dirty(); syncEye(); } return; }
  if (S.view === "house" || (ROOMV() && (RMODE === "above" || RMODE === "alone"))) { glide(kind, k); return; }   // V1.53: over the house the keys glide over it
  walked = true; controls.maxDistance = 6;
  const fwd = controls.target.clone().sub(camera.position); fwd.y = 0;
  if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1);
  fwd.normalize();
  const side = new THREE.Vector3(-fwd.z, 0, fwd.x), step = 0.15 * k;
  if (kind === "tl" || kind === "tr") {
    const off = controls.target.clone().sub(camera.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), (kind === "tl" ? 1 : -1) * Math.PI / 18 * k);
    controls.target.copy(camera.position).add(off);
  } else if (kind === "u" || kind === "dn") {
    const dy = (kind === "u" ? 1 : -1) * 0.1 * k, y = camera.position.y + dy;
    if (y / M < 30 || y / M > R.CEIL - 10) return;
    camera.position.y = y; controls.target.y += dy;
  } else {
    const d = kind === "f" ? fwd.multiplyScalar(step) : kind === "b" ? fwd.multiplyScalar(-step) : kind === "r" ? side.multiplyScalar(step) : side.multiplyScalar(-step);
    camera.position.add(d); controls.target.add(d);
  }
  clampRoom(camera.position); clampRoom(controls.target, true); collide();
  controls.update(); dirty(); syncEye();
}
function glide(kind, k = 1) {   // V1.53: over the whole house or a room from above, the keys move over it as a map does (they stepped the eye into the
  const cam = camera.position, t = controls.target, dist = cam.distanceTo(t);   // living room's box); Q and E turn round it, R and F come closer or go back
  if (kind === "tl" || kind === "tr") { const a = (kind === "tl" ? 1 : -1) * Math.PI / 24 * k, off = cam.clone().sub(t).applyAxisAngle(new THREE.Vector3(0, 1, 0), a); cam.copy(t).add(off); }
  else if (kind === "u" || kind === "dn") { const off = cam.clone().sub(t).multiplyScalar(kind === "u" ? 0.92 : 1.08); if (off.length() > 1.5) cam.copy(t).add(off); }
  else {
    const fwd = t.clone().sub(cam); fwd.y = 0;
    if (fwd.length() < 0.2 * dist) { fwd.set(0, 1, 0).applyQuaternion(camera.quaternion); fwd.y = 0; }   // looking straight down: the screen's up
    fwd.normalize(); const side = new THREE.Vector3(-fwd.z, 0, fwd.x), step = dist * 0.035 * k * (WALK.fast ? 2.5 : 1);
    const d = kind === "f" ? fwd.multiplyScalar(step) : kind === "b" ? fwd.multiplyScalar(-step) : kind === "r" ? side.multiplyScalar(step) : side.multiplyScalar(-step);
    cam.add(d); t.add(d);
  }
  controls.update(); dirty();
}
const WALK_KEYS = { w: "f", arrowup: "f", s: "b", arrowdown: "b", a: "l", arrowleft: "l", d: "r", arrowright: "r", q: "tl", e: "tr",
                    r: "u", f: "dn", pageup: "u", pagedown: "dn" };   // v31: R and F (or Page Up and Down) go up and down
/* v31: the camera's height, how a drag moves it, and the move buttons on the room */
function lift(cm) {          // the eye to a height in cm, still looking the same way
  tween = null; walked = true; controls.maxDistance = 6;
  const y = Math.max(30, Math.min(R.CEIL - 10, cm)) * M, dy = y - camera.position.y;
  camera.position.y = y; controls.target.y += dy;
  clampRoom(camera.position); clampRoom(controls.target, true); controls.update(); dirty(); syncEye();
}
function levelView() {       // look straight ahead, no tilt
  const d = controls.target.clone().sub(camera.position); d.y = 0;
  if (d.lengthSq() < 1e-6) return;
  controls.target.y = camera.position.y; controls.update(); dirty();
}
function seatLook() {        // "look round from here": the point you turn round sits just in front of your eye; circling: 2.2 m on
  const d = controls.target.clone().sub(camera.position);
  if (d.lengthSq() < 1e-8) d.set(0, 0, 1);
  controls.target.copy(camera.position).addScaledVector(d.normalize(), S.cam === "look" ? 0.35 : 2.2);
  clampRoom(controls.target, true); controls.update(); dirty();
}
function applyCam(reseat = true) {
  const look = S.cam === "look";
  controls.enableZoom = !look; controls.rotateSpeed = look ? 0.4 : 0.55;
  controls.enableRotate = !inPlace();   // V1.47: turning on the spot is ours (lookTurn), not the orbit's
  if (reseat) seatLook();
}
/* V1.47, the client: "its still hard to look around when in the rooms ... from a pc": a drag circled the eye round a point 35 cm (Be there)
   or 2.2 m (In it) in front, so the eye slid about and met the walls. In the house's rooms and looking round, a drag now turns the view
   where you stand, as a photo sphere does: the picture follows the pointer, a pixel of drag a pixel of view (from the lens), the tilt
   kept short of straight up or down. Two fingers still pinch the lens; the whole house and the living room's views still orbit */
const inPlace = () => S.cam === "look" || (!!ROOMV() && RMODE === "in");
const LD_ = { ids: new Set(), id: null, x: 0, y: 0 };
function lookTurn(dx, dy) {
  const k = camera.fov / Math.max(1, canvas.clientHeight) * Math.PI / 180, cam = camera.position;
  const d = controls.target.clone().sub(cam), len = d.length() || 0.35; d.normalize();
  d.applyAxisAngle(new THREE.Vector3(0, 1, 0), dx * k);                                   // drag right: the room comes with it (you turn left)
  const r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(), el = Math.asin(Math.max(-1, Math.min(1, d.y)));
  const t_ = Math.max(-1.45, Math.min(1.45, el + dy * k)) - el; d.applyAxisAngle(r, t_);   // drag down: you look up
  controls.target.copy(cam).addScaledVector(d, len); controls.update(); dirty(); syncEye();
}
canvas.addEventListener("pointerdown", e => { LD_.ids.add(e.pointerId); controls.enableRotate = !inPlace();   // before the orbit sees it (capture)
  if (!inPlace() || tween || LD_.ids.size > 1 || (e.pointerType === "mouse" && e.button !== 0)) { LD_.id = null; return; }
  LD_.id = e.pointerId; LD_.x = e.clientX; LD_.y = e.clientY; }, true);
addEventListener("pointermove", e => { if (e.pointerId !== LD_.id || !inPlace()) return; const dx = e.clientX - LD_.x, dy = e.clientY - LD_.y; LD_.x = e.clientX; LD_.y = e.clientY; if (dx || dy) lookTurn(dx, dy); });
for (const ev of ["pointerup", "pointercancel"]) addEventListener(ev, e => { LD_.ids.delete(e.pointerId); if (e.pointerId === LD_.id) LD_.id = null; });
let eyeT = 0;
function syncEye() {         // the height slider follows the camera
  const now = performance.now(); if (now - eyeT < 80) return; eyeT = now;
  const i = qs("#r3d-eye"), o = qs("#r3d-eyeout"); if (!i || document.activeElement === i) return;
  const cm = Math.round(camera.position.y / M); i.value = Math.min(220, Math.max(40, cm)); if (o) o.textContent = cm > 220 ? "above the room" : `${cm} cm`;
}
function applyPad() { const p = qs("#r3d-pad"); if (p) p.hidden = !S.pad; }
/* V1.29 (U2): looking round the wheel walks as far as it turns (it went in 15 cm jumps); a pinch changes the lens (25°–100°). V2.42, the
   client: "movement is difficult again": standing (Be there) the wheel changed the lens instead, a fish-eye in a turn or two; now it walks
   there too, and Ctrl + wheel (a trackpad's pinch) is the lens */
const lens = f => { if (tween) return; camera.fov = Math.max(25, Math.min(100, f)); camera.updateProjectionMatrix(); dirty(); };   // the lens as seen (a phone's portrait widening included)
canvas.addEventListener("wheel", e => {
  if (S.cam !== "look") return;
  e.preventDefault();
  if (e.ctrlKey && (RMODE === "stand" || S.view === "livstand")) { lens(camera.fov * Math.exp(e.deltaY * 0.0012)); return; }
  const k = Math.min(1.5, Math.abs(e.deltaY) / 100); if (k > 0.02) walk(e.deltaY < 0 ? "f" : "b", k);
}, { passive: false });
const PINCH = new Map(); let pinch0 = null;
canvas.addEventListener("pointerdown", e => { if (e.pointerType === "touch") PINCH.set(e.pointerId, [e.clientX, e.clientY]); if (PINCH.size === 2) { const [a, b] = [...PINCH.values()]; pinch0 = [Math.hypot(a[0] - b[0], a[1] - b[1]), camera.fov]; } });
canvas.addEventListener("pointermove", e => { if (!PINCH.has(e.pointerId)) return; PINCH.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch0 && PINCH.size === 2 && S.cam === "look" && (RMODE === "stand" || S.view === "livstand")) { const [a, b] = [...PINCH.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d > 10) lens(pinch0[1] * pinch0[0] / d); } });
["pointerup", "pointercancel", "pointerleave"].forEach(t => canvas.addEventListener(t, e => { PINCH.delete(e.pointerId); if (PINCH.size < 2) pinch0 = null; }));
["pointerdown", "pointermove", "keydown", "wheel"].forEach(t => root.addEventListener(t, e => { if (t !== "pointermove" || e.buttons || mlookOn()) PRE.idleT = performance.now(); }, { passive: true, capture: true }));   // V2.42: mouse look is moving too   // v39: a mouse just moving over the room doesn't hold up the warm-up   // v35: the shader warm-up waits while you use the room
let padT = null;             // a move button held down keeps moving, in smaller steps
const padStop = () => { if (padT) { clearTimeout(padT.t); clearInterval(padT.i); padT = null; } };
root.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-walk]"); if (!b) return;
  e.preventDefault(); padStop(); const k = b.dataset.walk; walk(k);
  padT = { t: setTimeout(() => { if (padT) padT.i = setInterval(() => walk(k, 0.4), 60); }, 300) };
});
["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, padStop)); window.addEventListener("blur", padStop);
document.addEventListener("keydown", e => {   // V1.53: the page's too (not only once the 3D has the focus)
  WALK.fast = e.shiftKey;
  if (!(e.target === document.body || root.contains(e.target))) return;
  if (e.altKey || e.ctrlKey || e.metaKey || /^(input|select|textarea)$/i.test(e.target.tagName)) return;
  if (e.target.tagName === "BUTTON" && !e.target.dataset.walk && e.key.startsWith("Arrow")) return;   // arrows still move between buttons
  let k = WALK_KEYS[e.key.toLowerCase()]; if (!k) return;
  e.preventDefault();
  if ((k === "l" || k === "r") && e.key.startsWith("Arrow") && (walking() || (ROOMV() && RMODE === "in"))) k = k === "l" ? "tl" : "tr";   // V2.42: in a room ← → turn, as a game's (A and D step aside)
  if (walking()) { if (k !== "u" && k !== "dn") WALK.keys.add(k); dirty(); return; }   // V1.32: held, not a step a press
  if ("fblr".includes(k) && startWalk()) { WALK.keys.add(k); return; }               // V1.53: in a room, a walk key stands you there and walks on
  walk(k);
});
document.addEventListener("keyup", e => { WALK.fast = e.shiftKey; const k = WALK_KEYS[e.key.toLowerCase()]; if (k) { WALK.keys.delete(k); if (k === "l" || k === "r") WALK.keys.delete("t" + k); } });
window.addEventListener("blur", () => { WALK.keys.clear(); WALK.stick = [0, 0]; });
canvas.addEventListener("pointerdown", () => { canvas.focus({ preventScroll: true }); if (tourSt) tourEnd(); if (SH) SH.own = true; });   // v28: touching the room ends the tour; v32: "Watch it open" carries on, the camera yours
function setView(name, instant, dur) {
  const v = VIEWS[name] || VIEWS.window, wasHouse = HOUSEV(S.view);
  if (name !== "house" && typeof welcome === "function") try { welcome(false); } catch (e) {}   // V2.43: going in puts the welcome away
  if (name !== S.view && actId && typeof closeAct === "function") closeAct();   // V1.28: a piece's card doesn't follow you to another room
  S.view = name;
  if (RMODE !== "in") setRmode("in", true);                               // v71: a new view starts in the room
  standLook(!!v.stand);                                                     // V1.6: the living room's Be there looks round from where you stand
  let p = v[S.site] || v;
  if (name === "house" && camera.aspect < 1.2) { const f = Math.min(0.95, 0.42 / camera.aspect) * 0.72 / freeFrame()[0];   // V2.74 (N18, left by N19): a tenth closer   // V2.46: and back by the share the buttons leave free (the roof was under the floors row)
      // v54: a phone stands further back to take in every floor (V1.30: less far: the buttons take less room)
    p = { eye: p.at.map((a, i) => a + (p.eye[i] - a) * f), at: p.at }; }
  flyTo(p.eye, p.at, R.HOUSE3 && v.box ? Math.max(v.fov, 82) : v.fov, !!v.above, instant, dur);   // v71: the house's rooms wide
  if (!houseG && R.HOUSE && HOUSEV(name)) { buildHouse(); reshadow(); }   // v69 (B6): built the first time (the living room starts without it)
  if (houseG) { houseG.visible = HOUSEV(name); view.visible = !v.above; applyFloors(); setAbove(!v.above); }   // v56: the sky only from inside
  if (wasHouse !== HOUSEV(name) && started) { applyLight(); sizeRenderer(); }   // V1: in the app the house is by day, its rooms as they are   // v58: the outside's daylight on or off; v73: and the house's resolution
  placeRoomLights();                                                        // v69: the room's own lights, the sun's shadows over it
  if (garden3d) garden3d.visible = HOUSEV(name) && (name !== "house" || !!S.hgarden);   // v64: in The whole house only when Gardens is on                             // v56: the garden ground only with the whole house (in the room's own views it read as a room clipped on) // v54: the whole house, a draft (the garden photo steps aside: the lawn and fences show it)
  qsa("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
  syncRmode();                                                              // v78b: the living room's three too
  store.set(KEY, S); updateCaption(); brandPlace();
  if (started) outdoor();                                                   // V1.5: the living room's window, by day, out to the modelled outside
  roomHist();                                                               // V2.96 (N39): Back brings you out to the house
}
/* the camera to an eye and a point to look at (room cm); v32: also a piece's own close look (R3D.set's "aim") */
function flyTo(e, a, fov, above, instant, dur) {
  walked = false; controls.maxDistance = above ? (S.view === "house" ? 90 : 16) : 6;   // v54: the whole house from further off
  hLast = null;                                                                            // V1.28: the new place is checked afresh
  WALK.feet = null;                                         // V2.0: a walk after it starts from the new place's floor (an instant view kept the last room's: from the master to the hall, the feet stayed upstairs)
  const eye = v3(...e), at = v3(...a);
  const from = { eye: camera.position.clone(), at: controls.target.clone(), fov: camera.fov };
  setAbove(!above);
  baseFov = fov;
  if (instant) { tween = null; camera.position.copy(eye); controls.target.copy(at);   // v30: an instant view stops any flight still under way
                camera.fov = fitFov(fov); camera.updateProjectionMatrix(); controls.update(); if (S.cam === "look") seatLook(); dirty(); syncEye(); }
  else tween = { t0: performance.now(), from, to: { eye, at, fov: fitFov(fov) }, dur: dur || 900 };
}
