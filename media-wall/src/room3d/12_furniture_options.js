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
function buildSofaBed() {
  const B = R.SOFABED, so = R.SOFA; if (!B || !so) return;
  const fab = fabricMat(B.col), feet = reg(new THREE.MeshStandardMaterial({ color: "#1b1b1c", roughness: 0.6 }));
  const lining = reg(new THREE.MeshStandardMaterial({ color: "#1d2236", roughness: 0.95 }));
  const W = B.w, D = B.run_d, hw = W / 2, hd = D / 2, F = B.foot, t = B.back_t, sh = B.seat_h, cu = 14, base = sh - cu;
  const xc = -hw + B.corner, xa = hw - B.arm, mid = (xc + xa) / 2;            // the corner's edge, the arm's inside face, between the two seats
  const g = new THREE.Group();
  for (const x of [-hw + 4, xc, mid, xa - 2, hw - 4]) for (const z of [-hd + 4, hd - 4]) lb(g, x, 0, z, 6, F, 6, feet);   // black block feet
  rlb(g, 0, F, -hd + t / 2, W, B.back_h - F, t, fab, 4);                     // the back, the whole run
  rlb(g, -hw + t / 2, F, t / 2, t, B.back_h - F, D - t, fab, 4);             // the corner's side back
  rlb(g, (-hw + t + xc) / 2, F, t / 2, B.corner - t, base - F, D - t, fab, 2);   // the corner's base
  lb(g, mid, base - 3, t / 2, xa - xc, 3, D - t, fab);                        // the bed's deck under the two seats
  // the arm: a bridge, the two stools tucked under it (they stand out a little at its end, as in the photos)
  rlb(g, (xa + hw) / 2, B.arm_h - 18, 0, B.arm, 18, D, fab, 5);
  for (const z of [-hd + 3, hd - 3]) rlb(g, (xa + hw) / 2, F, z, B.arm, B.arm_h - 18 - F, 6, fab, 2);
  lb(g, xa + 2, F, 0, 4, B.arm_h - 18 - F, D - 20, fab);
  const T_ = B.stool; for (const z of [-T_.d / 2 - 1, T_.d / 2 + 1]) { rlb(g, hw - T_.w / 2 + 4, 4, z, T_.w, T_.h - 4, T_.d, fab, 4);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) lb(g, hw - T_.w / 2 + 4 + dx * (T_.w / 2 - 4), 0, z + dz * (T_.d / 2 - 4), 4, 4, 4, feet); }
  // the cushions: seats (53 deep), backs, the corner's two backs, three headrests on top
  const sz = [hd - B.seat_d - 1, hd - 1], bz = (-hd + t + sz[0]) / 2, bd = sz[0] - (-hd + t);
  rlb(g, (xc + mid) / 2, base, (sz[0] + sz[1]) / 2, mid - xc - 1, cu, B.seat_d, fab, 6);
  rlb(g, (mid + xa) / 2, base, (sz[0] + sz[1]) / 2, xa - mid - 1, cu, B.seat_d, fab, 6);
  rlb(g, (-hw + t + bd + xc) / 2, base, (sz[0] + sz[1]) / 2, xc - (-hw + t + bd) - 1, cu, B.seat_d, fab, 6);
  for (const [x0, x1] of [[xc, mid], [mid, xa], [-hw + t, xc]]) { const c = rlb(g, (x0 + x1) / 2, sh, bz, x1 - x0 - 1, B.back_h - sh - 4, bd, fab, 7); c.rotation.x = -0.1; }
  { const c = rlb(g, -hw + t + bd / 2, sh, (bz + bd / 2 + sz[1]) / 2, bd, B.back_h - sh - 4, sz[1] - bz - bd / 2, fab, 7); c.rotation.z = -0.1; }
  const hx = [(-hw + t + xc) / 2, (xc + mid) / 2, (mid + xa) / 2].slice(0, B.heads);
  for (const x of hx) { const h = rlb(g, x, B.back_h - 2, -hd + t / 2 + 2, 52, B.h - B.back_h + 2, 22, fab, 7); h.rotation.x = 0.12; }
  for (const [x, z, ry] of [[-hw + t + 30, bz + 22, 0.7], [xa - 24, bz + 10, -0.15]]) {   // the two accent cushions
    const m = rlb(g, x, sh - 2, z, 42, 40, 14, fab, 6); m.rotation.order = "YXZ"; m.rotation.y = ry; m.rotation.x = -0.3; }
  // the pull-out bed: its fabric front flush with the seats, it slides out (bed_out) and its mattress rises to the seats' height
  const bed = new THREE.Group(), mat_ = new THREE.Group(); bed.add(mat_); g.add(bed);
  lb(bed, mid, 4, hd - 2, xa - xc - 2, base - 7, 4, fab);
  rlb(mat_, mid, F, hd / 2 - 2, xa - xc - 4, base - F - 4, hd - 4, fab, 3);
  for (const dx of [-0.25, 0.25]) lb(bed, mid + dx * (xa - xc), 10, hd + 0.2, 3, 8, 0.6, feet, false);   // the two pull loops
  WORK.sbed = anim(v => { bed.position.z = B.bed_out * Math.min(1, v / 0.7) * M; mat_.position.y = (sh - 4 - (base - 4)) * Math.max(0, (v - 0.7) / 0.3) * M; });
  const cx = so.x[0] + hw, cz = so.back + hd;
  movable("sofa2", B.name, g, () => ({ x: cx, z: cz, rot: 0 }), W, D, [fab], false, { when: () => S.sofa === "bed" });
  // the loose storage chaise in front of the corner seat; its padded lid lifts on its back edge (the ottoman's Lift the lid)
  const C = B.chaise, c = new THREE.Group(), lidH = C.lid, bodyH = C.h - lidH;
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) lb(c, dx * (C.w / 2 - 6), 0, dz * (C.d / 2 - 5), 7, 6, 5, feet);
  rlb(c, 0, 6, 0, C.w, 4, C.d, fab, 1.5);
  for (const [x, z, w_, d_] of [[0, -(C.d - 3) / 2, C.w, 3], [0, (C.d - 3) / 2, C.w, 3], [-(C.w - 3) / 2, 0, 3, C.d - 6], [(C.w - 3) / 2, 0, 3, C.d - 6]]) rlb(c, x, 6, z, w_, bodyH - 6, d_, fab, 1.2);
  lb(c, 0, 10, 0, C.w - 6.2, 0.3, C.d - 6.2, lining, false);
  const hinge = new THREE.Group(); hinge.position.copy(v3(0, bodyH, -C.d / 2)); c.add(hinge);
  rlb(hinge, 0, 0, C.d / 2, C.w, lidH, C.d, fab, 4);
  lb(hinge, 0, -0.2, C.d / 2, C.w - 6, 0.3, C.d - 6, lining, false);
  WORK.lid2 = anim(v => { hinge.rotation.x = -1.75 * v; });
  movable("chaise2", "Its storage chaise", c, () => ({ x: so.x[0] + C.w / 2, z: so.back + D + C.d / 2, rot: 0 }), C.w, C.d, [fab], false, { when: () => S.sofa === "bed" });
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

