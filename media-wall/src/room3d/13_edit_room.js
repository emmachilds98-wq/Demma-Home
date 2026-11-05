/* ---------------------------------------------------------------- v18: things you can move (edit mode)
   Each movable thing is a group built round the centre of its footprint (room cm, its front towards local +z), on a pivot that
   edit mode drags across the floor and turns. Where it stands, its turn, its colour and whether it's removed live in S.layout[id];
   the things you add live in S.added. The red lamp is rebuilt where you drop it, so its lights move with it. */
const MOV = {};
const movers = new THREE.Group(); scene.add(movers);
function rlb(g, x, y, z, w, h, d, mat, r = 3) {           // v32: the same, its edges rounded (upholstery)
  const m = new THREE.Mesh(new RoundedBoxGeometry(w * M, h * M, d * M, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2) * M), mat);
  m.position.copy(v3(x, y + h / 2, z)); g.add(shadow(m)); return m;
}
function fabric(m, k = 0.6) { m.roughness = 0.95; m.bumpMap = HESSIAN; m.bumpScale = k; return m; }   // v34: a woven cover (its colour stays Edit room's)
function fabricMat(c) { return fabric(reg(new THREE.MeshStandardMaterial({ color: c }))); }
function pipe(g, x, y, z, len, mat, across = false) {      // v34: piping along an upholstered edge (along z, or across x)
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len * M, 8), mat); p.position.copy(v3(x, y, z));
  if (across) p.rotation.z = Math.PI / 2; else p.rotation.x = Math.PI / 2;
  g.add(p); return p;
}
function taperLeg(g, x, z, h, mat) {                        // v32: a round tapered leg under upholstery
  const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.011, h * M, 12), mat); l.position.copy(v3(x, h / 2, z)); g.add(shadow(l)); return l;
}
function lb(g, x, y, z, w, h, d, mat, cast = true) {      // a box in a movable's own coordinates: x, z its centre, y its bottom
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), mat);
  m.position.copy(v3(x, y + h / 2, z)); g.add(shadow(m, cast)); return m;
}
/* v22: fewer draws: a static group's direct child meshes become one mesh per material (your plant stand was 152 meshes, the vinyl stand 45).
   Nested groups (the sofa's cushions, the coffee table's tray, the chair cupboard's doors) are left alone, so their own switches still work. */
function mergeStatic(g) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), by = new Map();
  for (const o of g.children) if (o.isMesh && !o.children.length && o.visible && !Array.isArray(o.material) && !o.isInstancedMesh && !o.isSkinnedMesh && !o.userData.flora) {
    const k = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
    if (!by.has(k)) by.set(k, []); by.get(k).push(o);
  }
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const geos = list.map(o => { const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); q.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return q; });
    const names = Object.keys(geos[0].attributes).sort().join();
    if (!geos.every(q => Object.keys(q.attributes).sort().join() === names)) continue;
    const merged = mergeGeometries(geos); if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow;
    list.forEach(o => g.remove(o)); g.add(m);
  }
  return g;
}
function movable(id, label, g, def, w, d, mats, flat = false, extra = {}) {
  if (!extra.added && id !== "lamp") mergeStatic(g);   // v22
  const pivot = new THREE.Group(); pivot.add(g); pivot.userData.movId = id;
  movers.add(pivot);
  MOV[id] = Object.assign({ id, label, pivot, def, w, d, mats, flat, base: mats.map(m => "#" + m.color.getHexString()) }, extra);
  return MOV[id];
}
function spotOf(id) {
  const it = MOV[id], L = S.layout[id] || {}, d0 = it.def();
  return { x: L.x ?? d0.x, z: L.z ?? d0.z, rot: L.rot ?? d0.rot ?? 0 };
}
function placeAll() {
  solidDirty();                                                                     // v41: the furniture's boxes again
  for (const it of Object.values(MOV)) {
    if (it.lamp) continue;                                  // the lamp is rebuilt where it stands (buildLamp)
    if (it.fixed) { it.pivot.visible = !(S.layout[it.id] || {}).off && (!it.when || it.when()); continue; }   // v27: built in where it stands
    const L = S.layout[it.id] || {}, p = spotOf(it.id);
    it.pivot.position.copy(v3(p.x, 0, p.z)); it.pivot.rotation.y = p.rot * Math.PI / 180;
    it.pivot.visible = !L.off && (!it.when || it.when());
    it.mats.forEach((m, i) => m.color.set(L.col && i === 0 ? L.col : it.base[i]));
  }
  if (selBox) selBox.update();
  reshadow();
}
const SHADOW_CAP = Math.max(0, Math.min(4, (gl.capabilities.maxTextures || 16) - 11));   // v48: the sun's shadow takes one texture unit
function capShadows(n) {   // the brightest n spotlights cast shadows; the rest light without them
  const sp = Object.values(lights).flat().filter(l => l.isSpotLight && l.visible).sort((a, b) => b.intensity - a.intensity);
  sp.forEach((l, i) => { l.castShadow = i < n; });
}
// a pot with a plant in it, in a movable's coordinates
/* v15's hanging plant, as a builder (v36): a pot centred at x (room cm) on a shelf whose top is at top, its strands falling from the
   edges in edges (each strand picks one: the shelf's front, or v36's gap behind the plant shelf) */
let plantBG = null;
function hangPlant(par, x, top, z, edges, seed, gapZ) {   // v38: gapZ [the shelf's end, the boxing's face]: the strands fall through that gap
  const PB = R.PLANT_B, pot = FLORA_POTS !== "mine" ? potFinish(FLORA_POTS) : (hangPlant.pot = hangPlant.pot || reg(new THREE.MeshStandardMaterial({ color: "#e9e4da", roughness: 0.3 })));   // v40: a glazed pot, a real pothos
  const hold = { userData: {} }, B = floraBatch(hold), pg = potGeo(PB.pot / 2, 12); pg.translate(-x * M, top * M, z * M); floraAdd(B, pot, pg);
  const soil = new THREE.CircleGeometry(PB.pot / 2 * 0.93 * M, 20); soil.rotateX(-Math.PI / 2); soil.translate(-x * M, (top + 10.3) * M, z * M); floraAdd(B, floraMat("soil"), soil, null, "soil");
  const r = rnd(seed);
  for (let k = 0; k < PB.strands; k++) {
    const e = edges[k % edges.length], dir = e > x ? 1 : -1;   // behind the pot (towards the wall) or in front of it
    const len = PB.trail[0] + r() * (PB.trail[1] - PB.trail[0]);
    let pts;
    if (gapZ) {                                     // over the shelf's end, then down the gap between it and the boxing
      const zg = gapZ[0] - 1.5 - r() * (gapZ[0] - gapZ[1] - 3), xg = x + (r() - 0.5) * 16;
      pts = [v3(x + (r() - 0.5) * 6, top + 10, z + (r() - 0.5) * 6), v3(xg, top + 2, gapZ[0] + 1)];
      for (let j = 1; j <= 5; j++) pts.push(v3(xg + Math.sin(j + k) * 1.5, top - len * j / 5, zg + Math.sin(j * 1.3 + k) * 1.2));
    } else {
    const z0 = z + (r() - 0.5) * 12, x0 = e + dir * r() * 3;
    pts = [v3(x + dir * 2 + (r() - 0.5) * 6, top + 10, z0), v3(x0 - dir * 2, top + 2, z0 + (r() - 0.5) * 4)];
    for (let j = 1; j <= 5; j++) pts.push(v3(x0 + dir * (j * 0.6 + r() * 1.5) * (dir > 0 ? 0.3 : 1), top - len * j / 5, z0 + Math.sin(j + k) * 4));
    }
    vineAlong(B, pts, r, 6);
  }
  FLORA_BUILD.pothos(B, v3(x, top + 10.3, z), 20, r, PB.pot / 2);
  floraFlush(hold, par);
}
let growGlow = [];
const GLOW_TEX = canvasTex(128, 128, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(255,214,160,0.75)"); gr.addColorStop(1, "rgba(255,214,160,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
function buildPlantsAndRecords() {
  const r = rnd(73), PS = R.PLANT_STAND, RS = R.RECORD_SHELF;
  const pots = ["#ece6da", "#c9c2b4", "#b5643f", "#7f8f72", "#2f2f2f"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 })));
  // v18.1: the plant stand from the client's listing: 98 × 29.5 × 158, slatted wood, two five-tier towers and an open middle with two shelves
  { const g = new THREE.Group(), wood = reg(new THREE.MeshStandardMaterial({ color: PS.col, map: OAK_TEX, roughness: 0.6 })); wood.userData.noTint = true;
    const w = PS.w, d = PS.d, h = PS.h, [cl, cm, cr] = PS.cols, pt = PS.post;
    const xs = [-w / 2 + pt / 2, -w / 2 + cl, w / 2 - cr, w / 2 - pt / 2];                  // the four post lines across
    for (const x of xs) for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, x, 0, z, pt, h, pt, wood);
    const standPots = [];                                                                       // v40: where the stand's pots go; its plants are a spot
    const tier = (xa, xb, y, plants) => {                                                    // slats front to back, rails at front and back
      for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, (xa + xb) / 2, y - 2, z, xb - xa, 2, pt, wood);
      const n = Math.max(4, Math.round((xb - xa) / 4.5));
      for (let k = 0; k < n; k++) lb(g, xa + 1.5 + k * (xb - xa - 3) / (n - 1), y, 0, 2.2, 1.2, d - 3, wood);
      for (let j = 0; j < plants; j++) {
        const rad = 5 + r() * 3.5, px = xa + (j + 0.5) * (xb - xa) / plants;
        const pm = Math.floor(r() * pots.length);
        standPots.push([px, y + 1.2, (r() - 0.5) * 6, rad, Math.round(4 + r() * 8), r() < 0.35 ? 2 : 0, pm]);
      }
    };
    const L = [xs[0] - pt / 2, xs[1]], Rr = [xs[2], xs[3] + pt / 2], Mi = [xs[1], xs[2]];
    PS.tower.forEach(y => { tier(L[0], L[1], y, 0); tier(Rr[0], Rr[1], y, 0); });
    PS.middle.forEach(y => tier(Mi[0], Mi[1], y, 0));
    for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, 0, h - 2, z, w, 2, pt, wood);  // the top rails across the open middle
    /* v43, client: "the plant shelf is not built yet give it what you think will look best": one plant a tier so each reads, trailing
       pothos and spider plants up top spilling down the towers, a monstera in the tall open middle and a snake plant over it, calathea
       and fern lower down, a small snake plant and a ficus at the bottom. [x, tier top, radius, how tall, kind, strands, pot] */
    const cx = t => (t[0] + t[1]) / 2, TOP = y => y + 1.2;
    [[L, 4, 6.5, 7, "pothos", 3, 0], [Rr, 4, 7, 12, "spider", 0, 3], [L, 3, 7, 12, "spider", 0, 0], [Rr, 3, 6, 6, "pothos", 2, 2],
     [L, 2, 6.5, 9, "calathea", 0, 1], [Rr, 2, 6, 8, "fern", 0, 3], [L, 1, 6, 8, "fern", 0, 4], [Rr, 1, 6.5, 9, "calathea", 0, 0],
     [L, 0, 7, 12, "snake", 0, 4], [Rr, 0, 7, 11, "ficus", 0, 1]]
      .forEach(([t, ti, rad, hh, kind, tr, pm]) => standPots.push([cx(t), TOP(PS.tower[ti]), 0, rad, hh, tr, pm, kind]));
    standPots.push([0, TOP(PS.middle[0]), 0, 9.5, 24, 0, 0, "monstera"], [0, TOP(PS.middle[1]), 0, 7.5, 18, 0, 4, "snake"]);
    { const gl_ = SUGG_G.growlights = new THREE.Group(), glow = new THREE.MeshBasicMaterial({ color: "#ffe3b0", toneMapped: false });   // v43: an option
      const case_ = reg(new THREE.MeshStandardMaterial({ color: "#1d1e20", roughness: 0.5 })); SVAR_MATS.growlights = [glow];
      for (const t of [L, Rr]) for (const ti of [2, 4]) { const cxx = (t[0] + t[1]) / 2, y = PS.tower[ti] - 2;
        lb(gl_, cxx, y - 1.2, 2, 30, 1.2, 2.4, case_, false); lb(gl_, cxx, y - 1.4, 2, 28, 0.25, 1.8, glow, false);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), new THREE.MeshBasicMaterial({ map: GLOW_TEX, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        pool.position.copy(v3(cxx, y - 18, -d / 2 + 0.6)); gl_.add(pool); }                      // the warm wash on the wall behind, as in the stand's photo
      g.add(gl_); }
    floraSpot(g, () => { const rr = rnd(173); g.userData.floraHold = true;
      for (const [px, py, pz, rad, h, tr, pm, kind] of standPots) potPlant(g, px, py, pz, rad, h, tr, rr, pots[pm], null,
        { terracotta: pm === 2, edgeZ: d / 2, kind: FLORA_STYLE === "easy" ? undefined : kind });
      g.userData.floraHold = false; floraFlush(g); });
    movable("plants", "Your plant stand", g, () => { const [x, z, f] = R.PLANT_LAYOUTS[S.plants].plants; return { x, z, rot: f < 0 ? 180 : 0 }; }, w, d, [wood], false, { when: () => !cornerHides("plants") });   // v37: a window-corner pick takes its place
    // v32: the idea of an uplight on the floor under the stand's open middle, throwing the leaves up the wall behind
    const upl = IDEA_G.plantlight = new THREE.Group(), blk = reg(new THREE.MeshStandardMaterial({ color: "#1b1c1f", roughness: 0.45 }));
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.1, 18), blk); can.position.set(0, 0.05, -0.06); can.rotation.x = -0.35; upl.add(shadow(can));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 18), new THREE.MeshBasicMaterial({ color: "#fff1d6", toneMapped: false })); lens.position.set(0, 0.1, -0.075); lens.rotation.x = -Math.PI / 2 - 0.35; upl.add(lens);
    const sp = new THREE.SpotLight("#ffd9a8", 22, 3, 0.7, 0.6, 2); sp.position.set(0, 0.12, -0.08); sp.target.position.set(0, 1.9, -0.32);
    sp.castShadow = true; sp.shadow.mapSize.set(512, 512); sp.shadow.bias = -0.0004; sp.shadow.camera.near = 0.04; upl.add(sp, sp.target);
    MOV.plants.pivot.add(upl); }
  // v18.1: the client's vinyl stand (their listing): 70 × 32 × 78, black steel, rustic wood; two face-out bays on top, wires below
  { const g = new THREE.Group(), wood = reg(new THREE.MeshStandardMaterial({ color: RS.col, map: OAK_TEX, roughness: 0.65 })); wood.userData.noTint = true;
    const steel = reg(new THREE.MeshStandardMaterial({ color: RS.steel, roughness: 0.45, metalness: 0.6 }));
    const w = RS.w, d = RS.d, h = RS.h, ft = RS.frame_top, p = 2, sy = RS.shelf_y, yb = RS.bottom_y;
    for (const x of [-w / 2 + p / 2, w / 2 - p / 2]) {
      lb(g, x, 0, d / 2 - p / 2, p, ft, p, steel);                                             // front posts to 63 (front is local +z)
      lb(g, x, 0, -d / 2 + p / 2, p, h, p, steel);                                             // rear posts to 78
      const sl = new THREE.Mesh(new THREE.BoxGeometry(p * M, Math.hypot(h - ft, d - p) * M, p * M), steel);   // the slope between them
      sl.position.copy(v3(x, (ft + h) / 2, 0)); sl.rotation.x = -Math.atan2(d - p, h - ft); g.add(shadow(sl));
    }
    lb(g, 0, ft - 6, d / 2 - 1, w, 1.2, 1.2, steel);                                           // the front rail
    lb(g, 0, yb, 0, w - 2 * p, 2, d, wood); lb(g, 0, yb + 2, -d / 2 + 1, w - 2 * p, 10, 1.6, wood);   // bottom shelf and its back board
    lb(g, 0, sy, 0, w - 2 * p, 2, d, wood); lb(g, 0, sy + 2, d / 2 - 0.8, w - 2 * p, RS.lip, 1.6, wood);   // upper shelf and its 10 cm front board
    lb(g, 0, sy + 2, -2, 2, h - sy - 6, d - 8, wood);                                          // the divider between the two bays
    for (const y of [h - 10, h - 22]) lb(g, 0, y, -d / 2 + 1.5, w, 6, 1.6, wood);              // back boards
    const sleeves = ["#e9e3d3", "#2f3e5c", "#d24b33", "#1f1f1f", "#14806d", "#f0c24b", "#7a4fb0", "#e8603c"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })));
    const lp = R.LP, front = new THREE.Group(), lifts = [];                                    // v34: the front LP of each bay lifts out (a group: not merged)
    for (const bx of [-w / 4, w / 4]) for (let k = 0; k < 5; k++) {                            // top bays: LPs leaning back, face-out
      const m = new THREE.Mesh(new THREE.BoxGeometry((RS.bay - 2) * M * 0.97, lp * M, 0.004), sleeves[Math.floor(r() * sleeves.length)]);
      m.position.copy(v3(bx, sy + 2 + lp / 2, d / 2 - 6 - k * 3.2)); m.rotation.x = -0.3; (k ? g : front).add(shadow(m));
      if (!k) { const y0 = m.position.y, z0 = m.position.z; lifts.push(v => { m.position.y = y0 + 0.24 * v; m.position.z = z0 + 0.07 * v; m.rotation.x = -0.3 + 0.38 * v; }); }
    }
    g.add(front);
    WORK.lp = anim(v => lifts.forEach((f, i) => f(Math.min(1, Math.max(0, v * 1.4 - i * 0.4)))));   // the left bay's first, then the right's
    for (let k = 0; k < RS.wires; k++) {                                                        // the wire dividers, and LPs between them
      const zz = d / 2 - 3 - k * (d - 6) / (RS.wires - 1);
      for (const x of [-w / 2 + 12, w / 2 - 12]) lb(g, x, yb + 2, zz, 0.5, RS.wire_h, 0.5, steel, false);
      lb(g, 0, yb + 2 + RS.wire_h - 0.5, zz, w - 24, 0.5, 0.5, steel, false);
      if (k < RS.wires - 1) for (let j = 0; j < 3; j++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(lp * M, lp * M, 0.004), sleeves[Math.floor(r() * sleeves.length)]);
        m.position.copy(v3(0, yb + 2 + lp / 2, zz - 2 - j * 2.5)); m.rotation.x = -0.12; g.add(shadow(m));
      }
    }
    movable("records", "Your vinyl stand", g, () => { const [x, z, f] = R.PLANT_LAYOUTS[S.plants].records; return { x, z, rot: f < 0 ? 180 : 0 }; }, w, d, [wood], false, { when: () => !cornerHides("records") });
    // v32: the idea of a record-care caddy at the end of the bottom shelf, outside the wire dividers: brush, stylus brush, fluid
    const cady = IDEA_G.clean = new THREE.Group(), cad = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 })), xc = -w / 2 + p + 4.6;
    lb(cady, xc, yb + 2, 0, 8.4, 0.8, 26, cad); for (const x of [xc - 3.9, xc + 3.9]) lb(cady, x, yb + 2, 0, 0.6, 8, 26, cad); for (const z of [-12.7, 12.7]) lb(cady, xc, yb + 2, z, 8.4, 8, 0.6, cad);
    lb(cady, xc, yb + 2.8, 7, 3, 12, 2.4, reg(new THREE.MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.8 })));                   // the carbon brush, on end
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.11, 16), reg(new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.3 })));
    bt.position.copy(v3(xc, yb + 2.8 + 5.5, -4)); cady.add(shadow(bt));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.025, 12), reg(new THREE.MeshStandardMaterial({ color: "#2f6fb5", roughness: 0.4 }))); cap.position.copy(v3(xc, yb + 2.8 + 12.2, -4)); cady.add(cap);
    lb(cady, xc + 1.5, yb + 2.8, -9.5, 0.8, 9, 0.8, reg(new THREE.MeshStandardMaterial({ color: "#c9a24b", roughness: 0.5 })));       // the stylus brush
    MOV.records.pivot.add(cady); }
  // the red lamp and the C-table idea are movable too
  MOV.lamp = { id: "lamp", label: "Your red lamp", lamp: true, w: 30, d: 30, mats: [], base: [],
    def: () => { const p = R.LAMP_SPOTS[S.lamp] || R.LAMP_SPOTS[DEF.lamp]; return { x: p.x, z: p.z, rot: 0 }; } };
  Object.defineProperty(MOV.lamp, "pivot", { get: () => lamp });
  if (IDEA_G.ctable) {
    const T = R.IDEAS.ctable, cx = (T.x[0] + T.x[1]) / 2, cz = R.SOFA.end;
    shell.remove(IDEA_G.ctable); IDEA_G.ctable.position.copy(v3(-cx, 0, -cz)); IDEA_G.ctable.position.x = cx * M; IDEA_G.ctable.visible = true;
    movable("ctable", "The C-table", IDEA_G.ctable, () => ({ x: cx, z: cz, rot: 0 }), T.x[1] - T.x[0], T.depth, [], false, { when: () => !!S.ideas.ctable });
    delete IDEA_G.ctable;
  }
  S.added.forEach(a => addThing(a, false));
}
/* things to add: simple stand-ins at real-world sizes, each with its own colour */
const CATALOGUE = {
  armchair: { label: "Armchair", w: 80, d: 80, col: "#b5643f", build(g, m, oak) {     // v32: upholstered, rounded, on tapered oak legs
    fabric(m);                                                                             // v34: a woven cover, piped edges, a scatter cushion
    rlb(g, 0, 14, 2, 74, 14, 72, m, 4); rlb(g, 0, 28, 6, 60, 13, 62, m, 5);                // the base and the seat cushion
    rlb(g, 0, 28, -31, 72, 46, 14, m, 5); rlb(g, 0, 40, -22, 58, 32, 10, m, 4.5).rotation.x = -0.1;   // the back and its cushion, leaning back
    for (const x of [-31, 31]) { rlb(g, x, 28, 2, 12, 34, 72, m, 5); pipe(g, x, 61.8, 2, 58, m); }   // the arms, piped along the top's flat
    pipe(g, 0, 39.5, 35.5, 50, m, true); pipe(g, 0, 26.8, 36.8, 66, m, true);              // on the rounded front edges of the seat and the base
    const sc = rlb(g, 0, 41, -13, 40, 38, 11, fabricMat("#d8c9ad"), 5); sc.rotation.set(-0.32, 0, 0.07);   // an oatmeal linen scatter cushion
    for (const [x, z] of [[-31, -31], [31, -31], [-31, 33], [31, 33]]) taperLeg(g, x, z, 14, oak); } },
  sidetable: { label: "Side table", w: 45, d: 45, col: "#c48c57", build(g, m) {
    lb(g, 0, 48, 0, 45, 2.5, 45, m); for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) lb(g, x, 0, z, 3.5, 48, 3.5, m); } },
  plant: { label: "Tall floor plant", w: 40, d: 40, col: "#d8cfc0", build(g, m) {
    potPlant(g, 0, 0, 0, 16, 26, 0, rnd(5), m, null); } },
  bookcase: { label: "Slim bookcase", w: 60, d: 30, col: "#c48c57", build(g, m) {
    // v34: closer to a real one: a recessed plinth, an overhanging top, books of every size (some leaning, a stack lying flat), two
    // baskets on the bottom shelf, a trailing plant, a framed print, a vase and a candle
    m.map = OAK_TEX; m.color.set("#c48c57"); m.roughness = 0.55;
    lb(g, -29, 0, 0, 2, 178, 30, m); lb(g, 29, 0, 0, 2, 178, 30, m); lb(g, 0, 6, -14.5, 56, 172, 1, m);   // the sides, the back
    lb(g, 0, 0, 11.5, 56, 6, 2, m); lb(g, 0, 178, 0.5, 62, 2.4, 31.5, m);                  // the kick board, set back; the top
    for (const y of [6, 42, 78, 114, 150]) lb(g, 0, y, 0, 56, 2, 30, m);
    const r = rnd(9), mt = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.62 }));
    const spines = ["#2f3e5c", "#d24b33", "#e9e3d3", "#14806d", "#f0c24b", "#6b4f7a", "#1f1f21", "#b98250", "#8b9878"].map(mt), pages = mt("#efe9dc");
    const book = (x, y, bw, bh, bd, lean = 0) => {
      const b = lb(g, x, y, 13 - bd / 2 - r() * 1.2, bw, bh, bd, spines[Math.floor(r() * spines.length)]);
      if (lean) { b.rotation.z = lean; b.position.x -= Math.sin(lean) * bh / 2 * M; b.position.y -= (1 - Math.cos(lean)) * bh / 2 * M; }
      return b;
    };
    const row = (y, x0, x1) => { let x = x0; while (x < x1) { const bw = 1.8 + r() * 3.2; book(x + bw / 2, y, bw, 19 + r() * 11, 15 + r() * 7); x += bw + 0.2; } return x; };
    // the bottom shelf: two seagrass baskets
    const sea = reg(new THREE.MeshStandardMaterial({ color: "#b89a6c", roughness: 1, bumpMap: HESSIAN, bumpScale: 1.2 }));
    for (const x of [-13.5, 13.5]) { lb(g, x, 8, 0, 25, 24, 26, sea); lb(g, x, 31, 0, 25.6, 1.4, 26.6, sea); }
    // books upright, then two leaning on them
    let x = row(44, -26, 12); book(x + 3.2, 44, 2.6, 27, 19, 0.32); book(x + 7.4, 44, 3, 24, 17, 0.34);
    // a stack lying flat, a small trailing plant, a framed print
    for (let i = 0, yy = 80; i < 4; i++) { const bh = 2.2 + r() * 2; lb(g, -18 + (r() - 0.5) * 2, yy, 2, 22 - i * 1.5, bh, 17 - i, spines[(i * 3 + 1) % spines.length]); yy += bh; }
    potPlant(g, 2, 80, 4, 6, 6, 3, rnd(41), mt("#d8cfc0"), null);
    const fr = lb(g, 18, 80, -10, 17, 22, 1.6, mt("#1f1f21")); fr.rotation.x = 0.12;
    lb(g, 18, 82.4, -9.0, 13, 17, 0.2, mt("#e7c9a0")).rotation.x = 0.12;
    // books again, and a bookend
    x = row(116, -26, 14); lb(g, x + 2, 116, 4, 1, 14, 10, mt("#2a2a2c"));
    // the top shelf: a vase, a candle, a few books
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 20), mt("#c46c45")); vase.position.copy(v3(-17, 162, 2)); g.add(shadow(vase));
    const wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.12 }));
    const cdl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 18), wax); cdl.position.copy(v3(-5, 157, 4)); g.add(shadow(cdl));
    row(152, 4, 25); } },
  beanbag: { label: "Beanbag", w: 80, d: 80, col: "#40609a", build(g, m) {     // v32: slumped, with a hollow to sit in
    fabric(m, 1);                                                                          // v34: a cord cover, a welted seam, a carry handle
    const geo = new THREE.SphereGeometry(0.4, 48, 28), q = geo.attributes.position;
    for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x);
      const sag = 1 + 0.035 * Math.sin(a * 6) * Math.max(0, 1 - Math.abs(y) / 0.4);          // soft folds where the cover slumps
      q.setX(i, x * sag); q.setZ(i, z * sag);
      q.setY(i, y > 0 ? y * 0.78 - 0.1 * Math.max(0, 1 - r / 0.22) * (y / 0.4) : y * 0.62); }
    geo.computeVertexNormals(); const b = new THREE.Mesh(geo, m); b.position.y = 0.25; g.add(shadow(b));
    const ring = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, rr = 0.4 * (1 + 0.035 * Math.sin(a * 6)) + 0.002; ring.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
    const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 144, 0.006, 6, true), m); seam.position.y = 0.25; g.add(seam);   // on the folds, round its widest
    const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 18, Math.PI), m); hdl.position.set(0, 0.45, -0.31); hdl.rotation.x = -0.7; g.add(hdl); } },
  footstool: { label: "Footstool", w: 50, d: 50, col: "#34507f", build(g, m, oak) {
    rlb(g, 0, 12, 0, 50, 28, 50, m, 5); for (const [x, z] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) taperLeg(g, x, z, 12, oak); } },
  cushion: { label: "Floor cushion", w: 60, d: 60, col: "#e2a33a", build(g, m) { rlb(g, 0, 0, 0, 60, 14, 60, m, 5); } },
  crate: { label: "Record crate", w: 36, d: 36, col: "#c49a6c", build(g, m) {
    lb(g, 0, 0, 0, 36, 2, 36, m); lb(g, -17, 0, 0, 2, 30, 36, m); lb(g, 17, 0, 0, 2, 30, 36, m); lb(g, 0, 0, -17, 36, 30, 2, m); lb(g, 0, 0, 17, 36, 14, 2, m);
    const cols = ["#e9e3d3", "#2f3e5c", "#d24b33", "#1f1f1f", "#14806d"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })));
    for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.004), cols[k]); s.position.copy(v3(0, 17, 12 - k * 5)); s.rotation.x = -0.15; g.add(s); } } },
};
/* v20: more decor to add; v21: more furniture */
Object.assign(CATALOGUE, {
  rattan: { label: "Rattan armchair", w: 70, d: 72, col: "#c7a26e", build(g, m, oak) {
    const seat = reg(new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.95 }));
    lb(g, 0, 38, 2, 62, 10, 60, seat);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.42, 28, 1, true, Math.PI * 0.15, Math.PI * 1.7), m);
    shell.material.side = THREE.DoubleSide; shell.position.set(0, 0.6, 0.03); shell.rotation.y = Math.PI; g.add(shadow(shell));
    for (const [x, z] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) lb(g, x, 0, z, 3, 38, 3, oak); } },
  ladder: { label: "Blanket ladder (oak)", w: 45, d: 30, col: "#c48c57", build(g, m) {
    const f = new THREE.Group(); lb(f, -20, 0, 0, 3, 165, 3, m); lb(f, 20, 0, 0, 3, 165, 3, m);
    for (const y of [30, 70, 110, 150]) lb(f, 0, y, 0, 40, 2.5, 2.5, m);
    const th = reg(new THREE.MeshStandardMaterial({ color: "#7a8a6a", roughness: 1 })); lb(f, 0, 96, 1.5, 36, 26, 1.2, th);
    f.rotation.x = 0.16; f.position.z = -0.1; g.add(f); } },
  bench: { label: "Oak bench", w: 100, d: 35, col: "#c48c57", build(g, m) {
    lb(g, 0, 40, 0, 100, 4, 35, m); for (const x of [-44, 44]) lb(g, x, 0, 0, 4, 40, 31, m); } },
  arclamp: { label: "Arc floor lamp", w: 40, d: 40, col: "#1f1f21", build(g, m) {
    lb(g, 0, 0, 0, 34, 3, 34, m);
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * 0.9, 0.03 + Math.sin(t * Math.PI * 0.62) * 1.8, 0)); }
    const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.009, 8), m); g.add(arc);
    const end = pts[pts.length - 1], shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 28, 1, true), reg(new THREE.MeshStandardMaterial({ color: "#e9e3d3", side: THREE.DoubleSide, emissive: "#ffd9a8", emissiveIntensity: 0.25 })));
    shade.position.set(end.x, end.y - 0.12, 0); g.add(shade); } },
  vase: { label: "Floor vase with grasses", w: 30, d: 30, col: "#d9cfbf", build(g, m) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 24), m); v.position.y = 0.275; g.add(shadow(v));
    const stem = reg(new THREE.MeshStandardMaterial({ color: "#c9b48a", roughness: 0.9 })), r = rnd(13);
    for (let k = 0; k < 14; k++) { const h = 0.55 + r() * 0.45, c = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.003, h, 4), stem);
      c.position.set((r() - 0.5) * 0.08, 0.55 + h / 2, (r() - 0.5) * 0.08); c.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5); g.add(c);
      const plume = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), stem); plume.scale.set(0.6, 2.2, 0.6); plume.position.copy(c.position).add(new THREE.Vector3(0, h / 2, 0).applyEuler(c.rotation)); g.add(plume); } } },
  pouffe: { label: "Knitted pouffe", w: 50, d: 50, col: "#c7643a", build(g, m) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 32), m); b.position.y = 0.2; g.add(shadow(b));
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 8, 32), m); t.rotation.x = Math.PI / 2; t.position.y = 0.39; g.add(t); } },
  basket: { label: "Seagrass basket (throws)", w: 45, d: 45, col: "#b89a6c", build(g, m) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.19, 0.42, 28, 1, true), m); b.material.side = THREE.DoubleSide; b.position.y = 0.21; g.add(shadow(b));
    lb(g, 0, 0, 0, 36, 1, 36, m);
    const th = reg(new THREE.MeshStandardMaterial({ color: "#e9e3d3", roughness: 1 })), roll = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), th);
    roll.scale.set(1, 0.55, 1); roll.position.y = 0.42; g.add(shadow(roll)); } },
  mirror: { label: "Floor mirror (oak)", w: 60, d: 8, col: "#c48c57", build(g, m) {
    const glass = reg(new THREE.MeshStandardMaterial({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.12, metalness: 0.25 }));   // v32: was black (metal with nothing to reflect)
    const f = new THREE.Group(); lb(f, 0, 0, 0, 60, 170, 3, m); const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.62), glass); gl.position.set(0, 0.85, 0.016); f.add(gl);
    f.rotation.x = -0.12; f.position.z = 0.04; g.add(f); } },
  lantern: { label: "Lantern and candles", w: 25, d: 25, col: "#1f1f21", build(g, m) {
    lb(g, 0, 0, 0, 24, 1.5, 24, m); lb(g, 0, 44, 0, 24, 2, 24, m);
    for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) lb(g, x, 0, z, 1.5, 45, 1.5, m);
    const wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.15 }));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16), wax); c.position.y = 0.115; g.add(c); } },
});
function addThing(a, fresh = true) {
  const C = CATALOGUE[a.type]; if (!C) return;
  const m = reg(new THREE.MeshStandardMaterial({ color: C.col, roughness: 0.7 })), oak = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
  const g = new THREE.Group(); C.build(g, m, oak);
  movable(a.id, C.label, g, () => ({ x: a.x, z: a.z, rot: 0 }), C.w, C.d, [m], false, { added: true });
  if (fresh) { S.added.push(a); placeAll(); store.set(KEY, S); }
}
/* ---------------------------------------------------------------- edit mode: tap to pick, drag to move, the panel to turn, colour, remove */
const ray = new THREE.Raycaster(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let selId = null, selBox = null, selSurf = null, drag = null, preEditView = null, downXY = null;
function ndc(e) { const r = canvas.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
function hitMovable(e) {
  ray.setFromCamera(ndc(e), camera);
  const roots = Object.values(MOV).map(it => it.pivot).filter(p => p && p.visible);
  const hit = ray.intersectObjects(roots, true).find(h => shown(h.object));
  if (!hit) return null;
  let o = hit.object; while (o && !o.userData.movId) o = o.parent;
  return o ? o.userData.movId : null;
}
function hitSurface(e) {
  ray.setFromCamera(ndc(e), camera);
  for (const h of ray.intersectObjects([shell, fixtures, ...Object.values(G)], true)) {
    if (!shown(h.object)) continue;
    const m = h.object.material; if (!m || Array.isArray(m)) return null;
    if (m.userData && m.userData.ratio !== undefined) { const ch = m.userData.ch; return ch === "ceil" ? "ceil" : ch === "trim" ? "skirt" : ch.startsWith("w:") ? ch : "walls"; }   // v38: a wall by name
    return null;                                   // something else is in front
  }
  return null;
}
function floorAt(e) { ray.setFromCamera(ndc(e), camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(floorPlane, p) ? { x: -p.x / M, z: p.z / M } : null; }
function halfOf(it, rot) {   // a piece's half-width along x and z when turned to rot
  const q = ((rot % 180) + 180) % 180, hx = q === 90 ? it.d / 2 : q === 0 ? it.w / 2 : Math.max(it.w, it.d) / 2, hz = q === 90 ? it.w / 2 : q === 0 ? it.d / 2 : hx;
  return { hx, hz };
}
const zmaxAt = (x, hx) => x + hx <= R.ALC_W ? R.ALC_D : x - hx >= R.BREAST_X[1] ? R.RECESS_Z : 0;   // the wall in front of the window: the alcove, the breast or the recess
function clampItem(it, x, z, rot) {
  const { hx, hz } = halfOf(it, rot);
  x = Math.min(Math.max(x, hx), R.W - hx);
  const zmax = zmaxAt(x, hx);
  z = Math.min(Math.max(z, R.WINDOW_Z + hz), zmax - hz);
  // v19: within 5 cm of a wall, it goes flush against it
  if (x - hx < SNAP) x = hx; else if (R.W - hx - x < SNAP) x = R.W - hx;
  if (z - hz - R.WINDOW_Z < SNAP) z = R.WINDOW_Z + hz; else if (zmax - hz - z < SNAP) z = zmax - hz;
  return { x: Math.round(x), z: Math.round(z) };
}
const SNAP = 15;   // v27: within 15 cm of a wall it goes flush (was 5): "make it easier to clip an item somewhere like a wall"
function wallsTouched(it, p) {   // which walls a piece is flush against now
  const { hx, hz } = halfOf(it, p.rot), zmax = zmaxAt(p.x, hx);
  return { x0: p.x - hx < 1.5, xW: R.W - p.x - hx < 1.5, zmin: p.z - hz - R.WINDOW_Z < 1.5, zmax: zmax - p.z - hz < 1.5 };
}
function turnItem(id, step) {    // v27: a turn keeps a piece against whichever walls it was against
  const it = MOV[id], p = spotOf(id), on = wallsTouched(it, p), rot = ((p.rot + step) % 360 + 360) % 360, { hx, hz } = halfOf(it, rot);
  let x = p.x, z = p.z;
  if (on.x0) x = hx; if (on.xW) x = R.W - hx;
  if (on.zmin) z = R.WINDOW_Z + hz; if (on.zmax) z = zmaxAt(x, hx) - hz;
  const c = clampItem(it, x, z, rot); setLayout(id, { rot, x: c.x, z: c.z });
}
function backToWall(id) {       // v27: to the nearest wall, its back to it (a piece's back is its -z side: the armchair's back, the bookcase's back panel)
  const it = MOV[id], p = spotOf(id), h0 = halfOf(it, p.rot);
  const walls = [{ d: p.x - h0.hx, rot: 270, k: "x0" }, { d: R.W - p.x - h0.hx, rot: 90, k: "xW" },
                 { d: p.z - h0.hz - R.WINDOW_Z, rot: 0, k: "zmin" }, { d: zmaxAt(p.x, h0.hx) - p.z - h0.hz, rot: 180, k: "zmax" }];
  const w = walls.sort((a, b) => a.d - b.d)[0], { hx, hz } = halfOf(it, w.rot);
  let x = p.x, z = p.z;
  if (w.k === "x0") x = hx; else if (w.k === "xW") x = R.W - hx; else if (w.k === "zmin") z = R.WINDOW_Z + hz; else z = zmaxAt(x, hx) - hz;
  const c = clampItem(it, x, z, w.rot); setLayout(id, { rot: w.rot, x: c.x, z: c.z });
}
/* v19: undo, the last ten changes to the layout (moves, turns, colours, removals, additions) */
const UNDO = [];
function snapshot() { return JSON.stringify({ layout: S.layout, added: S.added }); }
function pushUndo() { UNDO.push(snapshot()); if (UNDO.length > 10) UNDO.shift(); undoBtn(); }
function undoBtn() { const b = qs("#r3d-undo"); if (b) b.disabled = !UNDO.length; }
function restoreLayout(o) {
  S.added.forEach(a => { const it = MOV[a.id]; if (it) { movers.remove(it.pivot); delete MOV[a.id]; } });
  S.added = []; S.layout = JSON.parse(JSON.stringify(o.layout || {}));
  (o.added || []).forEach(a => addThing(Object.assign({}, a), true));
  if (o.plants && R.PLANT_LAYOUTS[o.plants]) S.plants = o.plants;
  select(null); built.lamp = null; applyState(); syncButtons();
}
function undo() { const prev = UNDO.pop(); if (!prev) return; restoreLayout(JSON.parse(prev)); undoBtn(); }
function setLayout(id, patch) { S.layout[id] = Object.assign({}, S.layout[id], patch); if (MOV[id] && MOV[id].added) { const a = S.added.find(a => a.id === id); if (a) Object.assign(a, patch); } }
function select(id) {
  selId = id; selSurf = null;
  if (selBox) { scene.remove(selBox); selBox = null; }
  if (id && MOV[id] && MOV[id].pivot) { selBox = new THREE.BoxHelper(MOV[id].pivot, 0xffc46b); scene.add(selBox); }
  editPanel(); dirty();
}
function editPanel() {
  const P = qs("#r3d-sel"); if (!P) return;
  P.hidden = !(selId || selSurf);
  if (selSurf) {
    const one = selSurf.startsWith("w:") ? selSurf.slice(2) : null;
    const lab = one ? WALL_NAME[one] : { walls: "All walls", ceil: "Ceiling", skirt: "Skirting and radiator" }[selSurf];
    qs("#r3d-selname").textContent = lab;
    const wallHex = paintHex(), key = selSurf === "ceil" ? "ceil" : "skirt";
    const cur = one ? chHex(selSurf) : selSurf === "walls" || S[key] === "match" ? wallHex : S[key];
    qs("#r3d-selcol").value = cur; qs("#r3d-swatches").hidden = false;
    const chips = Object.entries(R.PAINTS).map(([k, { hex: h, name: n }]) => `<button type="button" class="chip" data-swatch="${k}"><span class="dot" style="background:${h}"></span>${n.replace(/ No\..*/, "").replace("Farrow & Ball ", "").replace("Little Greene ", "")}</button>`).join("");
    qs("#r3d-swatches").innerHTML = (one ? `<button type="button" class="chip" data-swatch="match">Same as the others</button>` + chips : selSurf === "walls" ? chips
      : `<button type="button" class="chip" data-swatch="match">Same as the walls</button><button type="button" class="chip" data-swatch="${selSurf === "ceil" ? "#f2f0ea" : "#ece8dd"}">${selSurf === "ceil" ? "White" : "Off-white"}</button>`);
    qsa("[data-sel=turn],[data-sel=turn45],[data-sel=turn15],[data-sel=wall],[data-sel=remove],[data-sel=copy]").forEach(b => b.hidden = true); qs("#r3d-selsize").textContent = "";
    return;
  }
  if (!selId) return;
  const it = MOV[selId], L = S.layout[selId] || {};
  qs("#r3d-selname").textContent = it.label;
  qs("#r3d-selsize").textContent = it.w && it.d ? `${Math.round(it.w)} × ${Math.round(it.d)} cm` : "";   // v19: its footprint
  qsa("[data-sel=copy]").forEach(b => b.hidden = !it.added);
  qs("#r3d-swatches").hidden = true;
  qsa("[data-sel=turn],[data-sel=turn45],[data-sel=turn15],[data-sel=wall]").forEach(b => b.hidden = !!it.lamp || !!it.fixed);
  qsa("[data-sel=remove]").forEach(b => b.hidden = false);
  qs("#r3d-selcol").parentElement.hidden = !it.mats.length;
  if (it.mats.length) qs("#r3d-selcol").value = L.col || it.base[0];
}
function setEdit(on) {
  S.edit = on; root.classList.toggle("editing", on);
  qs("#r3d-editbtn").setAttribute("aria-pressed", String(on));
  qs("#r3d-editbar").hidden = !on;
  if (on) { preEditView = S.view; if (!(VIEWS[S.view] || {}).above) setView("room"); const pn = document.getElementById("r3d-panel"); if (pn) pn.hidden = true; closePop(); }   // v21: edit from the whole room, cut away (v25: the Tools panel steps aside)
  else { select(null); qs("#r3d-addlist").hidden = true; if (preEditView && preEditView !== S.view) setView(preEditView); }
  dirty();
}
function addList() {
  const removed = Object.values(MOV).filter(it => !it.added && (S.layout[it.id] || {}).off);
  qs("#r3d-addlist").innerHTML = removed.map(it => `<button type="button" class="chip" data-putback="${it.id}">↩ ${it.label}</button>`).join("")
    + Object.entries(CATALOGUE).map(([k, c]) => `<button type="button" class="chip" data-add="${k}">${c.label}</button>`).join("");
}
canvas.addEventListener("pointerdown", e => {
  if (!S.edit || e.button > 0) return;
  downXY = [e.clientX, e.clientY];
  const id = hitMovable(e);
  if (!id) return;
  select(id);
  const it = MOV[id], p = spotOf(id), f = floorAt(e);
  if (!f || it.fixed) { downXY = null; return; }        // v27: built-in pieces are selected, not dragged (and the tap isn't a wall's)
  drag = { id, dx: p.x - f.x, dz: p.z - f.z, x0: p.x, z0: p.z, moved: false, before: snapshot() };
  controls.enabled = false; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", e => {
  if (!drag) return;
  const f = floorAt(e); if (!f) return;
  const it = MOV[drag.id], p = spotOf(drag.id), c = clampItem(it, f.x + drag.dx, f.z + drag.dz, p.rot);
  drag.moved = true; drag.x = c.x; drag.z = c.z;
  if (it.lamp) { lamp.position.set(-(c.x - drag.x0) * M, 0, (c.z - drag.z0) * M); }
  else it.pivot.position.copy(v3(c.x, 0, c.z));
  if (selBox) selBox.update(); dirty();
});
function endDrag(e) {
  if (drag) {
    const d = drag; drag = null; controls.enabled = true;
    if (d.moved) { UNDO.push(d.before); if (UNDO.length > 10) UNDO.shift(); undoBtn(); setLayout(d.id, { x: d.x, z: d.z }); if (MOV[d.id].lamp) { lamp.position.set(0, 0, 0); built.lamp = null; applyState(); select(d.id); } else { placeAll(); store.set(KEY, S); } }
    return;
  }
  if (S.edit && downXY && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) < 6) {   // a tap on nothing movable: a surface to paint?
    const surf = hitSurface(e);
    select(null); selSurf = surf; editPanel();
  }
  downXY = null;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { if (drag) { drag = null; controls.enabled = true; placeAll(); } });
qs("#r3d-editbtn").addEventListener("click", () => setEdit(!S.edit));
qs("#r3d-editdone")?.addEventListener("click", () => setEdit(false));   // v26: a way out of Edit room with the Tools panel shut
qs("#r3d-addfrom")?.addEventListener("click", () => {   // v26: Extras' "Add a piece of furniture": Edit room, its list open
  if (window.DemmaTools) window.DemmaTools.close(); if (!S.edit) setEdit(true); addList(); qs("#r3d-addlist").hidden = false; });
qs(".r3d-edit").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.closest("#r3d-sel") || b.id === "r3d-editbtn") return;
  if (b.id === "r3d-add") { addList(); const l = qs("#r3d-addlist"); l.hidden = !l.hidden; return; }
  if (b.id === "r3d-undo") { undo(); return; }
  if (b.id === "r3d-share") { shareLayout(); return; }
  if (b.id === "r3d-useshared") { if (sharedDoc) { pushUndo(); restoreLayout(sharedDoc); qs("#r3d-sharest").textContent = "Using the shared layout (↶ Undo goes back)."; } return; }
  if (b.id === "r3d-layreset") { if (!confirm("Put everything back where the plan has it, and take out what you've added?")) return;
    pushUndo();
    S.added.forEach(a => { const it = MOV[a.id]; if (it) { movers.remove(it.pivot); delete MOV[a.id]; } }); S.added = []; S.layout = {};
    select(null); built.lamp = null; applyState(); return; }
  if (b.dataset.putback) { pushUndo(); setLayout(b.dataset.putback, { off: false }); qs("#r3d-addlist").hidden = true; if (MOV[b.dataset.putback].lamp) built.lamp = null; applyState(); select(b.dataset.putback); return; }
  if (b.dataset.add) {
    const t = controls.target, c = clampItem(CATALOGUE[b.dataset.add], -t.x / M, Math.min(t.z / M, -40), 0);
    const a = { id: "a" + Date.now().toString(36), type: b.dataset.add, x: c.x, z: c.z };
    pushUndo(); addThing(a); qs("#r3d-addlist").hidden = true; select(a.id); applyState();
  }
});
qs("#r3d-sel").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const k = b.dataset.sel;
  if (b.dataset.swatch) {
    const v = b.dataset.swatch;
    if (selSurf.startsWith("w:")) setWall(selSurf.slice(2), v);
    else if (selSurf === "walls") S.paint = v; else S[selSurf === "ceil" ? "ceil" : "skirt"] = v;
    repaint(); syncButtons(); updateCaption(); store.set(KEY, S); dirty(); editPanel(); return;
  }
  if (k === "done") { select(null); return; }
  if (!selId) return;
  const it = MOV[selId];
  if (k === "turn" || k === "turn45" || k === "turn15" || k === "wall" || k === "remove" || k === "copy") pushUndo();
  if (k === "copy" && it.added) {     // v19: another of the same, a little way off, turned and coloured the same
    const src = S.added.find(a => a.id === selId), p = spotOf(selId), L = S.layout[selId] || {}, c = clampItem(it, p.x + 25, p.z + 25, p.rot);
    const a = { id: "a" + Date.now().toString(36), type: src.type, x: c.x, z: c.z };
    addThing(a); setLayout(a.id, { rot: p.rot, col: L.col }); placeAll(); store.set(KEY, S); select(a.id); applyState(); return;
  }
  if (k === "turn" || k === "turn45") { turnItem(selId, k === "turn" ? 90 : 45); placeAll(); store.set(KEY, S); }   // v27: a quarter turn, or an eighth
  if (k === "turn15") { turnItem(selId, e && e.shiftKey ? 5 : 15); placeAll(); store.set(KEY, S); }                  // v38: finer, 5° with Shift
  if (k === "wall") { backToWall(selId); placeAll(); store.set(KEY, S); }
  if (k === "remove") {
    if (it.added) { movers.remove(it.pivot); delete MOV[selId]; S.added = S.added.filter(a => a.id !== selId); delete S.layout[selId]; }
    else { setLayout(selId, { off: true }); if (it.lamp) built.lamp = null; if (it.fixed) placeChairs(); }
    select(null); applyState();
  }
});
qs("#r3d-selcol").addEventListener("pointerdown", () => { if (selId) pushUndo(); });   // one undo step per colour pick
qs("#r3d-selcol").addEventListener("input", e => {
  const v = e.target.value;
  if (selSurf && selSurf.startsWith("w:")) { setWall(selSurf.slice(2), v); repaint(); syncButtons(); updateCaption(); }
  else if (selSurf === "walls") { S.paint = "custom"; S.custom = v; repaint(); syncButtons(); updateCaption(); }
  else if (selSurf) { S[selSurf === "ceil" ? "ceil" : "skirt"] = v; repaint(); }
  else if (selId) { setLayout(selId, { col: v }); placeAll(); }
  store.set(KEY, S); dirty();
});
document.addEventListener("keydown", e => { if (S.edit && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); } });
/* v19: one layout for both of you, kept in the plan page's shared database (only where the page has one) */
let ldb = null, sharedDoc = null, sharing = Promise.resolve();
(async () => {
  try { ldb = (window.sharedStore && window.sharedStore.use) ? await window.sharedStore.use("db") : null; } catch (e) { ldb = null; }
  if (!ldb) return;
  qsa(".r3d-share").forEach(b => b.hidden = false);
  if (qs("#r3d-picksave")) qs("#r3d-picksave").hidden = false;   // v22: picks can be saved for the next round
  ldb.doc("layouts/shared").onSnapshot(snap => { sharedDoc = snap.exists ? snap.data() : null; shareStatus(); }, () => { qsa(".r3d-share").forEach(b => b.hidden = true); });
  ldb.collection("setups").onSnapshot(snap => {   // v52: the plans saved for us, to open again
    snap.docChanges().forEach(ch => { if (ch.type === "removed") delete SETUPS[ch.doc.id]; else SETUPS[ch.doc.id] = ch.doc.data(); });
    drawSetups(); }, () => {});
})();
/* v52: Your saved plans: each one saved for us (Save my plan, then Save for us), newest first, opens the room just as it was saved */
const SETUPS = {};
function drawSetups() {
  const box = qs("#r3d-setups"); if (!box) return;
  const L = Object.entries(SETUPS).filter(([, d]) => d && d.look).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).slice(0, 8);
  box.hidden = !L.length;
  const esc = t => String(t || "").replace(/[<&"]/g, "");
  box.innerHTML = '<span class="label">Your saved plans</span>' + L.map(([id, d]) => {
    let when = ""; try { when = new Date(d.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch (e) {}
    return `<button type="button" class="chip" data-setup="${esc(id)}">${esc(d.name) || "A plan"}${when ? ` · ${when}` : ""}</button>`; }).join("");
}
qs("#r3d-setups")?.addEventListener("click", e => { const b = e.target.closest("[data-setup]"); if (!b) return; const d = SETUPS[b.dataset.setup];
  if (d && d.look && applyLook(b64u(JSON.stringify(d.look)))) toast(`Opened: ${d.name || "your plan"}`); });
function shareStatus() {
  const st = qs("#r3d-sharest"), use = qs("#r3d-useshared"); if (!st) return;
  use.disabled = !sharedDoc;
  if (!sharedDoc) { st.textContent = "No shared layout yet."; return; }
  let when = ""; try { when = new Date(sharedDoc.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) {}
  st.textContent = `Shared layout saved ${when}.`;
}
function shareLayout() {
  if (!ldb) return;
  const st = qs("#r3d-sharest"); st.textContent = "Saving…";
  const body = JSON.parse(JSON.stringify({ layout: S.layout, added: S.added, plants: S.plants, at: new Date().toISOString() }));
  sharing = sharing.then(() => ldb.doc("layouts/shared").set(body)).then(() => { st.textContent = "Saved: you'll both see this layout under “Use the shared layout”."; },
    e => { st.textContent = e && e.code === "invalid_argument" ? "This view can't save (read-only)." : "Couldn't save. Try again in a moment."; });
}
/* v22: "Your picks": the ideas, suggestions and decor switched on, their rough cost added up, copied or saved as a note */
const PD = (() => { try { return JSON.parse(document.getElementById("picks-data").textContent); } catch (e) { return { ideas: {}, sugg: {}, decor: {} }; } })();
function picks() {
  const items = [];
  for (const [k, on] of Object.entries(S.ideas)) if (on && PD.ideas[k]) items.push({ kind: "Idea", name: PD.ideas[k][0], lo: PD.ideas[k][1], hi: PD.ideas[k][2], plan: !!DEF.ideas[k] });
  for (const [k, on] of Object.entries(S.sugg)) if (on && PD.sugg[k]) {
    const ver = PD.svar && PD.svar[k] && PD.svar[k][svarOf(k)];   // v28: which version
    items.push({ kind: "Suggestion", name: PD.sugg[k][0] + (ver ? ` (${ver.toLowerCase()})` : ""), lo: PD.sugg[k][1], hi: PD.sugg[k][2],
                 plan: !!DEF.sugg[k] && svarOf(k) === ((DEF.svar || {})[k] || SVAR[k]?.[0][0]) }); }
  for (const k of Object.keys(DEF.decor)) if (S.decor[k] !== DEF.decor[k] && PD.decor[k]) {
    const [lab, names] = PD.decor[k], c = k === "cushions" && PD.ideas.cushions;
    items.push({ kind: "Decor", name: `${lab}: ${names[S.decor[k]] || S.decor[k]}`, lo: c ? c[1] : 0, hi: c ? c[2] : 0 });
  }
  return items;
}
const pickText = items => items.map(i => `${i.kind}: ${i.name}${i.hi ? ` (about £${i.lo}–${i.hi})` : ""}`).join("\n");
function updatePicks() {
  updatePlanBar();                                                        // v39
  const el = qs("#r3d-picklist"); if (!el) return;
  const items = picks(), lo = items.reduce((a, i) => a + i.lo, 0), hi = items.reduce((a, i) => a + i.hi, 0);
  el.innerHTML = items.length ? items.map(i => `<b>${i.name}</b>${i.hi ? ` <span class="r3d-cost">£${i.lo}–${i.hi}</span>` : ""}`).join(" · ")
      + (hi ? `<br>About £${lo}–${hi} together, none of it in the plan's costs.` : "")
    : "Nothing switched on yet: turn on an idea, a suggestion or a decor choice and it shows here.";
  qs("#r3d-pickcopy").disabled = qs("#r3d-picksave").disabled = !items.length;
}
qs("#r3d-pickcopy")?.addEventListener("click", () => {
  const items = picks(), st = qs("#r3d-pickst"), text = "Our picks from the 3D room:\n" + pickText(items);
  const done = () => { st.textContent = "Copied: paste it into your next message."; };
  try { navigator.clipboard.writeText(text).then(done, () => { qs("#r3d-picklist").textContent = text; st.textContent = "Select the list above to copy it."; }); }
  catch (e) { qs("#r3d-picklist").textContent = text; st.textContent = "Select the list above to copy it."; }
});
qs("#r3d-picksave")?.addEventListener("click", () => {
  if (!ldb) return;
  const items = picks(), st = qs("#r3d-pickst"); st.textContent = "Saving…";
  ldb.doc("layouts/picks").set(JSON.parse(JSON.stringify({ items, text: pickText(items), at: new Date().toISOString() })))
    .then(() => { st.textContent = "Saved for the next round."; }, e => { st.textContent = e && e.code === "invalid_argument" ? "This view can't save (read-only)." : "Couldn't save. Try again in a moment."; });
});
/* v18: if the graphics card gives up (most often HD with shadows on a phone), say so and come back in Fast. v35: the browser usually
   gives the context back within a second or two: then the room rebuilds itself in Fast where it was, no reload; the button stays as
   the way out if it doesn't come back */
let glLost = false;
canvas.addEventListener("webglcontextlost", e => {
  e.preventDefault(); glLost = true; if (!BIG_GPU) { S.quality = "fast"; S.picked = true; store.set(KEY, S); }   // V2.25: a real card comes back in HD
  msg.hidden = false; root.classList.remove("ready");
  msg.innerHTML = `The 3D room ran out of graphics memory; bringing it back${BIG_GPU ? "" : " in Fast"}… <button type="button" class="btn" onclick="location.reload()">Reload it</button>`;
  noteError("context", "WebGL context lost");
});
canvas.addEventListener("webglcontextrestored", () => {
  glLost = false; msg.hidden = true; root.classList.add("ready");
  applyLight(); syncButtons(); if (gl.shadowMap.enabled) gl.shadowMap.needsUpdate = true; precompile(); dirty();
  toast("The 3D room is back, in Fast");
});

