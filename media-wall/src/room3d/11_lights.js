/* ---------------------------------------------------------------- lights */
const lights = { strip: [], uprights: [], bias: [], bar1: [], bar2: [], lamp: [], tv: [], fill: [] };
const hemi = new THREE.HemisphereLight("#e2e0da", "#b39a7c", 0.05); scene.add(hemi);
// v58: daylight on the outside of the house (The whole house only; kept in the scene at 0 otherwise, so no shader rebuilds): the sky's
// fill and the sun from the south-west over the front (the back faces 14° east of north)
const skyFill = new THREE.HemisphereLight("#dfe8f1", "#5d5446", 0); scene.add(skyFill);
const dayLight = { position: v3(700, 1400, 1100), target: { position: v3(233, 0, 80) } };   // V1.7: only where the outside's sun is (the sun lights it): a light at 0 here was in every living room shader
/* V1.3, the client: "continue upgrading the 3d model of the house" (BUILD_SPEC phase 4, the start of 5): outside, the house stands under
   a real sky (three's Sky, its sun where the day light comes from) on ground that runs to a hazy horizon: the street's level in front of
   the back wall, the garden's behind it, as the land steps down. Only in The whole house from outside (a floor shown keeps its cutaway
   clear); built the first time */
const OUT = { sky: null, ground: null, sunOut: false };
const sunLux = () => S.view === "house" || (S.quality === "hd" && S.tod === "day") ? SUNCFG.lux * (OUT.sunOut ? SUNCFG.out : 1) : 0;   // V3.19: the whole house in sun in Fast too (it was a third as bright as in HD; the sun is in every shader already)
/* V1.5 (BUILD_SPEC phase 5): and out of the living room's window by day, from inside it: the same sky and land, the garden, its trees and
   the building past the fence, in place of the plain sky (v56's stand-in until the outside was modelled); by evening the dusk plane */
const INSIDE = () => !!ROOMV() && (RMODE === "in" || RMODE === "stand");   // V1.10: standing in one of the house's rooms (In it, Be there)
const roomOut = () => !!(R.HOUSE3 && ((S.tod === "day" && !HOUSEV(S.view) && !(VIEWS[S.view] || {}).above) || INSIDE()));   // V1.10: and every room's windows; V1.47, the client: "see in and out of the windows at all times": the house's rooms by evening too, through a dusk veil (the living room keeps its dusk picture)
/* V1.47: by evening, seen from a room of the house, the outside through its windows is dusk: a see-through dark blue shell just outside
   the house's walls (drawn last, never in a tap's way), so the garden, next door and the hill show, dimmed, as at dusk */
let VEIL = null;
function duskVeil(on) {
  if (!on && !VEIL) return;
  if (!VEIL) { const x0 = -90, x1 = 545, z0 = -400, z1 = 590, y0 = -330, y1 = 720, g = new THREE.BoxGeometry((x1 - x0) * M, (y1 - y0) * M, (z1 - z0) * M);
    VEIL = new THREE.Mesh(g, reg(new THREE.MeshBasicMaterial({ color: "#0b1226", transparent: true, opacity: 0.68, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false })));
    VEIL.material.clippingPlanes = []; VEIL.position.copy(v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); VEIL.raycast = () => {}; VEIL.renderOrder = 5; VEIL.name = "duskVeil"; scene.add(VEIL); }
  VEIL.visible = on;
}
function outdoor() {
  const house = !!(R.HOUSE3 && S.view === "house" && hfloor === "all"), room = roomOut(), on = house || room;
  if (on && !OUT.sky) {
    const sky = OUT.sky = new Sky(); sky.scale.setScalar(3000); sky.name = "sky";   // V1.4: past the hill (it was 100 m: anything further was behind it)
    const u = sky.material.uniforms; u.turbidity.value = 3.5; u.rayleigh.value = 1.1; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.copy(dayLight.position).sub(dayLight.target.position).normalize();
    sky.raycast = () => {}; scene.add(sky);
    const H = R.HOUSE3, g = OUT.ground = new THREE.Group(); g.name = "ground";
    /* V2.28, the client: "best version with best performance and quality should be on pc": the ground round the house was one flat
       colour, 3 km of it, washed to khaki by the sun on a PC; now the lawn's own photo and relief, in metres (worldUV), as the gardens' lawn */
    const LT = houseTex("lawn");
    const mat = reg(new THREE.MeshStandardMaterial({ color: LT ? "#ffffff" : "#56633f", map: LT ? LT.map : null, normalMap: LT && LT.normal || null, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 })); mat.clippingPlanes = [];
    const yt = (H.drive ?? -15) - 2, yb = (H.lawn ?? -260) - 2, A0 = -125, A1 = -28, E = 300000, zf = H.front, zb = H.back;   // V1.4: 3 km out (was 80 m), under the haze   // the alley (x -125 to -28)
    const quad = (x0, x1, z0, y0, z1, y1, alley, slope) => {   // a strip of ground from (z0, y0) to (z1, y1), level across x
      const g2 = new THREE.BufferGeometry(), P = [x0, y0, z0, x1, y0, z0, x1, y1, z1, x0, y1, z1].map((v, i) => i % 3 === 0 ? -v * M : v * M);
      g2.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g2.setIndex([0, 1, 2, 0, 2, 3]);
      g2.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));   // lit as level ground: the slope doesn't read as a lighter band
      worldUV(g2, "lawn");
      const m = new THREE.Mesh(g2, mat); m.receiveShadow = true; m.raycast = () => {}; m.userData.alley = !!alley; m.userData.slope = !!slope; g.add(m); };
    quad(-E, E, -E, yb, zb, yb);                                                                    // the gardens' side, a storey down
    quad(-E, A0, zb, yb, zf, yt, false, true); quad(A0, A1, zb, yb, zf, yt, true, true); quad(482, E, zb, yb, zf, yt, false, true);   // the slope the terrace is built into (by it, the alley's own steps with Gardens on); V1.47, the client: "the garden green floor can be seen through the window of the kitchen": not across the house (A1 to its party wall, 482), where it ran through the lower floor's rooms
    quad(-E, E, zf, yt, E, yt);                                                                     // the street's side, out to the horizon
    buildBeyond(null, g);                                                                           // V1.4: the hill opposite
    scene.add(g);
  }
  if (OUT.ground && !OUT.street) OUT.street = buildStreet(OUT.ground);   // V3.44 (N81): the street out front (with the house's materials, once they're made)
  if (house && !OUT.skyEnv) {   // V1.13 (QUALITY_PLAN Q3): outside, the house reflects its own sky: an environment made from a sky like the
    // one shown, at the room reflection's size (so swapping them rebuilds no shaders), once
    const pm = new THREE.PMREMGenerator(gl), sk = new Sky(), sc = new THREE.Scene(), u = sk.material.uniforms, u0 = OUT.sky.material.uniforms;
    for (const k of ["turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG"]) u[k].value = u0[k].value;
    u.sunPosition.value.copy(dayLight.position).sub(dayLight.target.position).normalize(); sk.scale.setScalar(50); sc.add(sk);
    OUT.skyEnv = pm.fromScene(sc, 0.02, 0.1, 100).texture; pm.dispose(); sk.geometry.dispose(); sk.material.dispose();
  }
  if (HMATS && OUT.skyEnv) { const e = house ? OUT.skyEnv : houseEnv(); for (const m of Object.values(HMATS)) if (m.envMap && m.envMap !== e && !m.userData.real) m.envMap = e; }   // V3.47: a mirror keeps its room
  const liv = room && !HOUSEV(S.view);   // the living room is drawn on its own: its outside brings the gardens; a house room has the house's
  if (liv && !OUT.plants) { OUT.plants = new THREE.Group(); buildPlants(OUT.plants); buildBeyond(OUT.plants, null);   // V1.6: and the gardens round ours
    buildThings(OUT.plants, "ours"); buildThings(OUT.plants, "next"); buildNextGardens(OUT.plants); scene.add(OUT.plants); }   // the house's own are in its outside, built with it
  if (OUT.plants) OUT.plants.visible = liv;
  if (garden3d && !HOUSEV(S.view)) garden3d.visible = room;                     // the house's views set it by Gardens
  if (view) view.visible = !room && !(VIEWS[S.view] || {}).above;
  if (OUT.sky) { OUT.sky.visible = on; OUT.ground.visible = on; const low = INSIDE() && ((R.HOUSE3.rooms || {})[VIEW_ROOM[S.view]] || [])[4] < 0;   // V1.10: the slope runs through the lower floor's rooms
    OUT.ground.children.forEach(m => { m.visible = !(low && m.userData.slope); if (m.userData.alley && m.visible) m.visible = room || !S.hgarden; });   // with Gardens on the alley steps down there
    const d = house || !liv || !sun ? dayLight.position.clone().sub(dayLight.target.position) : sun.position.clone().sub(sun.target.position);   // the sun the sky shows: the one lighting it
    OUT.sky.material.uniforms.sunPosition.value.copy(d.normalize());
    if (S.tod !== "day" && !house) OUT.sky.material.uniforms.sunPosition.value.set(-0.6, -0.04, -0.8).normalize(); }   // V1.47: by evening from inside, the sun just down: a dusk sky
  duskVeil(INSIDE() && S.tod !== "day");
  scene.fog.near = on ? 40 : 1e4; scene.fog.far = on ? 700 : 2e4;   // V1.4: the hill at 330 m about half hazed, as the view photos (was 30–110: nothing past 110 m)
  if (camera.far !== (on ? 3000 : 120)) { camera.far = on ? 3000 : 120; camera.updateProjectionMatrix(); }   // and seen out to the sky
  if (sun && house !== OUT.sunOut) {   // outside, the sun where the sky shows it (the living room's sits low by its window), its shadows over house and garden
    const on = house; OUT.sunOut = on; const c = sun.shadow.camera, e = on ? 18 : 5.5;
    if (on) { const t = v3(233, 0, -900); sun.target.position.copy(t); sun.position.copy(t).addScaledVector(dayLight.position.clone().sub(dayLight.target.position).normalize(), 30); }
    else { sun.position.copy(sun.userData.p0); sun.target.position.copy(sun.userData.t0); roomKey = null; }
    c.left = c.bottom = -e; c.right = c.top = e; c.far = on ? 60 : 16; c.updateProjectionMatrix(); sun.target.updateMatrixWorld();
    sun.shadow.normalBias = on ? 0.02 : 0.008;   // V1.28: about a texel and a half (2 cm lifted the room's shadows off its joins: light along the skirting)
    sun.intensity = sunLux(); if (!on) placeRoomLights(); reshadow();
  }
}
function area(color, w, h, pos, look) {
  const l = new THREE.RectAreaLight(color, 1, w * M, h * M);
  l.position.copy(v3(...pos)); l.lookAt(v3(...look)); scene.add(l); return l;
}
function buildLights() {
  const C = R.CEIL, Wd = R.W, WZ = R.WINDOW_Z, AD = R.ALC_D;
  const warm = "#ffe0bf";
  // the strip washes each wall from the ceiling's edge
  lights.strip.push(area(warm, AD - WZ, 6, [4, C - 4, (AD + WZ) / 2], [4, 0, (AD + WZ) / 2]));
  lights.strip.push(area(warm, Wd, 6, [Wd / 2, C - 4, WZ + 4], [Wd / 2, 0, WZ + 4]));
  lights.strip.push(area(warm, R.STAIR_FRONT - WZ, 6, [Wd - 4, C - 4, (R.STAIR_FRONT + WZ) / 2], [Wd - 4, 0, (R.STAIR_FRONT + WZ) / 2]));
  lights.strip.push(area(warm, R.WELL_X0, 6, [R.WELL_X0 / 2, C - 4, -4], [R.WELL_X0 / 2, 0, -4]));
  lights.strip.forEach(l => { l.userData.k = 520; l.userData.warm = true; });
  // the uprights' grooves wash the wall either side of the TV
  for (const x of [(R.UP_L[0] + R.UP_L[1]) / 2, (R.UP_R[0] + R.UP_R[1]) / 2]) { const l = area("#ffcf96", 2, 112, [x, 134, 22], [x, 134, 40]); l.userData.k = 3500; l.userData.colKey = "strips"; lights.uprights.push(l); }
  // v15: the side run's strip washes the side wall below it
  const SR = R.SIDE_RUN, zr0 = SR.edge[0][1], zr1 = SR.edge[SR.edge.length - 1][1];
  const sw = area("#ffcf96", zr0 - zr1, 3, [9, SR.under - 1, (zr0 + zr1) / 2], [0, SR.under - 60, (zr0 + zr1) / 2]); sw.userData.k = 260; sw.userData.colKey = "strips"; lights.uprights.push(sw);
  /* v46: Fast (most phones) leaves out the area lights above, so the media wall and the sofa fell dark while the spot heads lit the
     floor six times brighter. Five plain point lights stand in for them in Fast only (no shadows): four along the strip's walls, one
     in front of the uprights; each follows its layer's slider */
  const fillSpot = (pos, at, k, fill, colKey, ang) => { const f = new THREE.SpotLight("#ffe0bf", 1, 0, ang, 1.0, 2); f.position.copy(v3(...pos)); f.target.position.copy(v3(...at));
    f.userData = { k, fill, warm: !colKey, colKey }; scene.add(f, f.target); lights.fill.push(f); };
  fillSpot([40, C - 12, (AD + WZ) / 2], [0, 40, (AD + WZ) / 2], 75, "strip", null, 1.25);                          // the PC's side wall
  fillSpot([Wd / 2, C - 12, WZ + 45], [Wd / 2, 40, WZ], 75, "strip", null, 1.25);                                  // the window wall
  fillSpot([Wd - 45, C - 12, (R.STAIR_FRONT + WZ) / 2], [Wd, 40, (R.STAIR_FRONT + WZ) / 2], 60, "strip", null, 1.25);   // the stairs wall
  fillSpot([R.WELL_X0 / 2, C - 12, -45], [R.WELL_X0 / 2, 40, AD], 40, "strip", null, 1.25);                       // the media wall and the breast
  fillSpot([R.ALC_W / 2, 200, -90], [R.ALC_W / 2, 125, AD], 85, "uprights", "strips", 1.0);                       // the uprights' wash
  // bias light behind the TV, onto the wall
  const [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y;
  const b = area("#e9efff", tx1 - tx0 - 10, ty1 - ty0 - 10, [(tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z + 5], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, 60]);
  b.userData.k = 90; lights.bias.push(b);
  // the TV's own light into the room when it's on
  const tvl = area("#ff9d7a", tx1 - tx0, ty1 - ty0, [(tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z - 0.5], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, -300]);
  tvl.userData.k = 60; lights.tv.push(tvl);
  // the window's daylight (north light, no sun) and the night sky's faint blue
  win = area("#dfe9ff", R.WINDOW_X[1] - R.WINDOW_X[0], R.WINDOW_Y[1] - R.WINDOW_Y[0], [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 150, WZ + 1], [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 140, 0]);
}
let win;
const fixtures = new THREE.Group(); scene.add(fixtures);
const white = new THREE.MeshStandardMaterial({ color: "#f2f0eb", roughness: 0.4 });
const toppers = new THREE.MeshStandardMaterial({ color: "#d6a873", roughness: 0.5, map: OAK_TEX });
const HEADS = {};
function headMat(col) { return HEADS[col] || (HEADS[col] = reg(new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, side: THREE.DoubleSide }))); }
function spotHead(group, apex, dir, col, lightList, kSpot, colKey, shadeMat, barIx) {
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.075, 0.13, 28, 1, true), shadeMat || headMat(col));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.019, 0.038, 16), shadeMat || toppers);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ color: "#fff3dc", toneMapped: false }));   // one each: it dims with its own light
  const head = new THREE.Group();
  shade.position.y = -0.065 - 0.038; cap.position.y = -0.019; glow.position.y = -0.155; glow.rotation.x = Math.PI / 2;
  head.add(shade, cap, glow); shadow(shade); shadow(cap, true);
  head.position.copy(apex);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  group.add(head);
  // v15: "make lighting less spotty": a wider beam with a fully soft edge (was 0.42 rad, penumbra 0.85)
  const sp = new THREE.SpotLight(WARM, 1, 0, 0.66, 1.0, 2);
  sp.position.copy(apex.clone().add(dir.clone().multiplyScalar(0.14)));
  sp.target.position.copy(apex.clone().add(dir.clone().multiplyScalar(3)));
  sp.shadow.mapSize.set(LIVE_MAP, LIVE_MAP); sp.shadow.bias = -0.0004; sp.shadow.normalBias = 0.02; sp.shadow.camera.near = 0.05; sp.shadow.radius = 6;
  sp.userData = { k: kSpot, glow, colKey, barIx };   // v35: barIx, its place on a spot bar (Fast lights every other one)
  scene.add(sp, sp.target); lightList.push(sp);
}
function buildBar(spec, list, colKey) {   // v15: the bar runs along z (TV to window) when spec.axis is "z"
  const g = new THREE.Group(); g.name = "bar";
  const C = R.CEIL, along = spec.axis === "z", th = fixDeg(colKey) * Math.PI / 180, c = Math.cos(th), s_ = Math.sin(th);
  const at = dx => { const [ox, oz] = along ? [0, dx] : [dx, 0]; return [spec.x + ox * c - oz * s_, spec.z + ox * s_ + oz * c]; };   // v38: the bar turns on its rose
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 28), white); rose.position.copy(v3(spec.x, C - 1.25, spec.z)); g.add(rose);
  const barM = new THREE.Mesh(along ? new THREE.BoxGeometry(0.022, 0.013, 0.84) : new THREE.BoxGeometry(0.84, 0.013, 0.022), white);
  barM.position.copy(v3(spec.x, C - 3.2, spec.z)); barM.rotation.y = th; g.add(shadow(barM));
  spec.heads.forEach((h, i) => {
    const [hx0, hz0] = along ? [spec.x, spec.z + h.dx] : [spec.x + h.dx, spec.z], [hx, hz] = at(h.dx);
    const apex = v3(hx, C - 6.5, hz), plan = v3(...h.tgt).sub(v3(hx0, C - 6.5, hz0)).normalize();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8), headMat(h.stem));
    stem.position.copy(v3(hx, C - 5, hz)); g.add(stem);
    spotHead(g, apex, aimDir(plan, th, headOf(`${colKey}:${i}`)), h.col, list, 140, colKey, undefined, i);
    list[list.length - 1].userData.hk = `${colKey}:${i}`;
  });
  g.userData.spec = spec; fixtures.add(g); return g;
}
let lamp;
const LAMP_RED = new THREE.MeshStandardMaterial({ color: R.LAMP_BODY, roughness: 0.28, metalness: 0.35 });   // v15: "the lamp is bright red"
function buildLamp() {   // three adjustable heads on a red pole, with colour bulbs: green on top, pink, then purple going down
  if (lamp) drop(lamp, lights.lamp);
  const L = S.layout.lamp || {}, d0 = R.LAMP_SPOTS[S.lamp] || R.LAMP_SPOTS[DEF.lamp];
  const spot = { x: L.x ?? d0.x, z: L.z ?? d0.z };                                    // v18: wherever you've dragged it
  const g = new THREE.Group(); lamp = g; g.userData.movId = "lamp"; g.visible = !L.off;
  const red = LAMP_RED;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 32), red); base.position.copy(v3(spot.x, 1.25, spot.z)); g.add(shadow(base));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, R.LAMP.h * M, 12), red); pole.position.copy(v3(spot.x, R.LAMP.h / 2, spot.z)); g.add(shadow(pole));
  const toward = new THREE.Vector3(...[233 - spot.x, 0, -135 - spot.z]).normalize();      // the room's middle, in room coords
  const th = fixDeg("lamp") * Math.PI / 180, pivotW = v3(spot.x, 0, spot.z), Yax = new THREE.Vector3(0, 1, 0);   // v38: the lamp turns on its base
  const turnP = p => p.sub(pivotW).applyAxisAngle(Yax, th).add(pivotW), turned = [];
  // v17, client: "green lamp should face down more slightly, its looking at the ceiling, face at the shelf wall": the top head aims at a
  // point on the stairs wall 30 below its own height, along the shelf (it was aimed 110 up, at the ceiling)
  const sbz = R.SHELF_B.z, wz = Math.min(Math.max(spot.z + 30, Math.min(sbz[0], sbz[1])), Math.max(sbz[0], sbz[1]));
  const aims = [[R.LAMP.h - 8, [R.W - spot.x, -22, wz - spot.z]], [R.LAMP.h - 45, [toward.x * 160, -40, toward.z * 160]], [R.LAMP.h - 80, [toward.x * 90, -110, toward.z * 90]]];
  aims.forEach(([y, off], i) => {
    const apex = v3(spot.x + toward.x * 9, y, spot.z + toward.z * 9);
    const tgt = v3(spot.x + off[0], y + off[1], spot.z + off[2]);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), red); arm.position.copy(v3(spot.x + toward.x * 5, y, spot.z + toward.z * 5));
    arm.rotation.z = Math.PI / 2; arm.rotation.y = Math.atan2(toward.z, -toward.x); g.add(arm); turned.push(arm);
    spotHead(g, turnP(apex.clone()), aimDir(tgt.clone().sub(apex).normalize(), th, headOf("lamp:" + i)), R.LAMP_BODY, lights.lamp, 55, "lamp" + i, red);
    lights.lamp[lights.lamp.length - 1].userData.hk = "lamp:" + i;
  });
  // v16, the client's photo ("Hat"): the hats live on the lamp: the graduation cap sits on the pole's top, tipped, and the navy cap with
  // the poem printed under its peak hangs on the pole below the top head, peak down, crown out
  if (R.HATS) {
    const H = R.HATS, felt = reg(new THREE.MeshStandardMaterial({ color: "#16171b", roughness: 0.85 }));
    const mb = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.07, 28), felt); skull.position.y = -0.035;
    const board = new THREE.Mesh(new THREE.BoxGeometry(H.board * M, 0.008, H.board * M), felt); board.rotation.y = Math.PI / 4;
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12), felt); button.position.y = 0.007;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.11, 8), reg(new THREE.MeshStandardMaterial({ color: "#1d1e22", roughness: 0.9 })));
    tassel.position.set(0.1, -0.05, 0.02);
    mb.add(shadow(skull), shadow(board), button, tassel);
    mb.position.copy(v3(spot.x, R.LAMP.h + 5, spot.z)); mb.rotation.z = -0.22; mb.rotation.x = 0.12; g.add(mb); turned.push(mb);
    const perp = new THREE.Vector3(-toward.z, 0, toward.x);                         // room coords: across the heads
    const out = new THREE.Vector3(-perp.x, 0, perp.z).normalize(), up = new THREE.Vector3(0, 1, 0);   // world
    const cap = buildCap(H);                                                         // v37: a structured baseball cap, not a beret
    const xAxis = new THREE.Vector3().crossVectors(out, up), tilt = 0.4;               // v37: tipped so the stiff brim kicks out from the pole
    const yAx = out.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt)), zAx = up.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(out, -Math.sin(tilt));
    cap.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAx, zAx));
    cap.position.copy(v3(spot.x, H.cap_y, spot.z)).add(out.clone().multiplyScalar(0.02)); g.add(cap); turned.push(cap);
  }
  const q = new THREE.Quaternion().setFromAxisAngle(Yax, th);
  turned.forEach(o => { turnP(o.position); o.quaternion.premultiply(q); });
  fixtures.add(g);
}

/* v37, client: "It should be a baseball cap: a fitted, structured, rounded crown with a flat, stiff brim that projects forward. Make the
   brim noticeably oversized (roughly 1.5-2x a normal proportion)". In the cap's own frame (metres): the crown up +y, the brim forward -z.
   Six panels on an oval base, a seam down the middle of the front and five more, a button on top, an eyelet in each panel; a flat brim
   1.8 times a usual one, stiff (an edged slab), with the gold stitching on its top and across the crown's front (geometry.HATS) */
function buildCap(H) {
  const cap = new THREE.Group(), cm = M, a = H.crown_w / 2, b = H.crown_l / 2, h = H.crown_h;
  const green = reg(new THREE.MeshStandardMaterial({ color: H.crown_col, roughness: 0.85, side: THREE.DoubleSide }));
  const brown = reg(new THREE.MeshStandardMaterial({ color: H.brim_col, roughness: 0.8 }));
  const seamM = reg(new THREE.MeshStandardMaterial({ color: "#1f3327", roughness: 0.9 }));
  const prof = [[1, 0], [1.0, 0.22], [0.975, 0.45], [0.9, 0.66], [0.76, 0.82], [0.55, 0.93], [0.3, 0.985], [0, 1]];   // firm sides, a rounded top
  const pts = prof.map(([r, y]) => new THREE.Vector2(r * a * cm, y * h * cm));
  const crown = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), green); crown.scale.z = b / a; cap.add(shadow(crown));
  // the seams: one down the front's middle (phi = PI), the rest every 60 degrees, a little proud of the cloth
  for (let i = 0; i < 6; i++) { const phi = Math.PI + i * Math.PI / 3;
    const path = new THREE.CatmullRomCurve3(prof.slice(0, -1).map(([r, y]) => new THREE.Vector3(r * a * Math.sin(phi) * cm * 1.004, y * h * cm, r * b * Math.cos(phi) * cm * 1.004)).concat([new THREE.Vector3(0, h * cm, 0)]));
    cap.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.0009, 5), seamM)); }
  const button = new THREE.Mesh(new THREE.SphereGeometry(1.0 * cm, 14, 8), green); button.scale.y = 0.5; button.position.y = h * cm; cap.add(button);
  for (let i = 0; i < 6; i++) { const phi = Math.PI + Math.PI / 6 + i * Math.PI / 3, k = 0.76, ye = 0.82 * h;   // an eyelet high on each panel
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.35 * cm, 12), seamM); const p_ = new THREE.Vector3(k * a * Math.sin(phi) * 1.01 * cm, ye * cm, k * b * Math.cos(phi) * 1.01 * cm);
    e.position.copy(p_); e.lookAt(p_.clone().multiply(new THREE.Vector3(2, 1.3, 2))); cap.add(e); }
  // the gold stitching across the crown's front: a patch of the same surface, a hair proud
  const rAt = t => { for (let i = 1; i < prof.length; i++) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; if (t <= y1) return r0 + (r1 - r0) * (t - y0) / (y1 - y0); } return 0; };
  const fpts = [0.16, 0.3, 0.45, 0.58, 0.68].map(t => new THREE.Vector2(rAt(t) * a * cm * 1.006, t * h * cm));
  const front = new THREE.Mesh(new THREE.LatheGeometry(fpts, 24, Math.PI - 0.8, 1.6), reg(new THREE.MeshStandardMaterial({ map: CAP_CROWN_TEX, transparent: true, alphaTest: 0.35, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide })));
  front.scale.z = b / a; cap.add(front);
  // the brim: a flat stiff slab off the crown's front, 1.8 times a usual one, the stitching on its top
  const t1 = 1.25, W = H.brim_w / 2, L = H.brim_len, shape = new THREE.Shape(), steps = 24;
  for (let i = 0; i <= steps; i++) { const th = -t1 + 2 * t1 * i / steps; const x = a * Math.sin(th), y = b * Math.cos(th); i ? shape.lineTo(x, y) : shape.moveTo(x, y); }   // along the crown
  for (let i = steps; i >= 0; i--) { const sx = -1 + 2 * i / steps, y0 = b * Math.cos(t1); shape.lineTo(sx * W, y0 + (b + L - y0) * Math.pow(1 - Math.pow(Math.abs(sx), 2.6), 1 / 2.6)); }   // its rounded front edge
  const slab = new THREE.ExtrudeGeometry(shape, { depth: H.brim_t, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.12, bevelSegments: 1, curveSegments: 4 });
  slab.rotateX(-Math.PI / 2); slab.scale(cm, cm, cm);
  const brim = new THREE.Mesh(slab, brown); brim.position.y = -0.1 * cm; cap.add(shadow(brim));
  const top = new THREE.ShapeGeometry(shape, 4), uv = top.attributes.uv, ps = top.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (W - ps.getX(i)) / (2 * W), 1 - (ps.getY(i) - b * Math.cos(t1)) / (b + L - b * Math.cos(t1)));   // read from the front, the first row at the crown
  top.rotateX(-Math.PI / 2); top.scale(cm, cm, cm);
  const stitch = new THREE.Mesh(top, reg(new THREE.MeshStandardMaterial({ map: CAP_BRIM_TEX, transparent: true, alphaTest: 0.35, roughness: 0.55, metalness: 0.25 })));
  stitch.position.y = (H.brim_t + 0.1) * cm; cap.add(stitch);
  return cap;
}

