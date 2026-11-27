let started = false, sun;   // v14.1: built the first time the room is on screen (start); the sun (buildSun)
function buildSun() {
  const SN = R.SUN || { az: -12, el: 45 }, az = SN.az * Math.PI / 180, el = SN.el * Math.PI / 180;
  const wc = [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 120, R.WINDOW_Z], L = 700;
  sun = new THREE.DirectionalLight("#fff0d8", 0); sun.userData.sun = true;
  sun.position.copy(v3(wc[0] + Math.sin(az) * Math.cos(el) * L, wc[1] + Math.sin(el) * L, wc[2] - Math.cos(az) * Math.cos(el) * L));
  sun.target.position.copy(v3(wc[0] - Math.sin(az) * 160, 0, wc[2] + 160));
  sun.userData.p0 = sun.position.clone(); sun.userData.t0 = sun.target.position.clone();   // v69: where it sits for the living room
  sun.castShadow = true; const sm = BIG_GPU ? 4096 : HI || !SMALL ? 2048 : 1024; sun.shadow.mapSize.set(sm, sm); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;   // V1.11: the sun's 4096 on a real graphics card (BUILD_SPEC phase 7)
  const c = sun.shadow.camera; c.left = -5.5; c.right = 5.5; c.top = 5.5; c.bottom = -5.5; c.near = 0.5; c.far = 16; c.updateProjectionMatrix();   // the whole room: outside it the sun shone through walls
  scene.add(sun, sun.target);
  if (R.HOUSE3) for (let k = 0, N = WHOLE ? Math.max(6, Object.values(R.HOUSE3.floors).reduce((a, F) => a + (F.lights || []).length + (F.lamps || []).length, 0)) : 6; k < N; k++) {   // N299: a real card, one a light
    const l = new THREE.PointLight("#ffcf98", 0, 7, 2); l.visible = false; l.userData.houseLight = true; if (k >= 4) l.userData.hdOnly = true; scene.add(l); ROOMLIGHTS.push(l);   // v69 (B3): at the start, so the set never changes; V3.57 (N108): six (Fast four), every nearby room's on
    if (k < (WHOLE ? Math.max(3, winPanels().length) : 3)) { const w = new THREE.RectAreaLight("#eef0f2", 0, 1, 1); w.visible = false; w.userData.houseLight = w.userData.win = true; scene.add(w); WINLIGHTS.push(w); }   // V2.39: a window's daylight; V3.57: three
    /* V2.17 (R1): the room's own light casts its shadows in HD, drawn only when the room changes (autoUpdate off), from the start */
    if (k === 0) { l.castShadow = true; const ms = BIG_GPU ? 1024 : 512; l.shadow.mapSize.set(ms, ms); l.shadow.bias = -0.002; l.shadow.normalBias = 0.03; l.shadow.radius = 4;
      l.shadow.camera.near = 0.05; l.shadow.camera.far = 7; } }
}
const START_MS = {};
function start() {
  if (BAKE.p) { if (!BAKE.w) BAKE.w = Promise.race([BAKE.p, new Promise(r => setTimeout(r, 2500, "t"))]).then(v => { BAKE.p = null; BAKE.use = BAKE.j; START_MS.bake = BAKE.j ? "on" : v === "t" ? "late" : "none"; if (!started) start(); }); return; }   // N195: the baked light in hand before the house is built (its shaders built once), never more than 2.5 s
  started = true;
  const t0 = performance.now();
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = ENV.studio = pmrem.fromScene(studioRoom(), 0.04).texture;
  pmrem.dispose();
  buildSun();
  gl.localClippingEnabled = true;
  scene.add(lightRig);                                                                  // v35: the fixed set of lights
  const TM = START_MS, tm = k => { TM[k] = Math.round(performance.now() - t0); }; TM.modAt = Math.round(MOD_AT); TM.startAt = Math.round(t0);   // V1.31 (U4): where the start's time goes (R3D.timing)
  tm("env"); buildShell(); tm("shell"); buildLights(); tm("lights"); buildFurniture(); tm("furniture"); buildSuggest(); tm("suggest"); buildSeatAndPouf();   // v69 (B6): the house is built the first time it's looked at
  GS.bar1 = buildBar(R.BAR1, lights.bar1, "bar1"); tm("bar");
  scene.children.forEach(o => { if (!o.isLight && o !== lightRig && o !== sun && o !== sun.target) LIVING.push(o); });   // V1.31: the living room's own
  gl.shadowMap.enabled = S.quality === "hd";
  GS.cabSnap = true; applyState(); GS.cabSnap = false;          // v30: the doors start where they are, no swing
  syncButtons();
  scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) [].concat(o.material).forEach(m => m && !m.clippingPlanes && clipMat(m)); });   // v21: the cutaway
  tm("state"); setView(S.view, true); tm("view");
  applyCam(S.cam === "look"); applyPad();                                               // v31
  sizeRenderer();
  // v81: no gl.compile here: before the cutaway's clipping it built programs the first frame never used
  root.classList.add("ready");
  /* V1.31 (U4): the shaders built first with compileAsync (in parallel where KHR_parallel_shader_compile is), then the first frame; after
     the cutaway's clipping is set and into the composer's kind of target when it's on. Never more than 8 s */
  const first = () => { if (first.done) return; first.done = true; START_MS.compiled = Math.round(performance.now() - t0); msg.hidden = true;
    requestAnimationFrame(() => { preDraw(); requestAnimationFrame(frame); requestAnimationFrame(() => setTimeout(loadPhotos, 30)); });   // V2.66 (N13): the shadows a frame ahead   // V1.9: the photos once the first picture is up
    if (!/[?&]nocompile\b/.test(location.search)) setTimeout(() => (window.requestIdleCallback || (f => f()))(warmRest, { timeout: 4000 }), 1500); };   // V2.72 (N14): the rest after
  /* V2.72 (N14): only what the landing shows is built first (the living room put away), the rest after the first picture, in parallel */
  const warmRest = () => { const was = gl.getRenderTarget(); try { if (postLive() && PRE.rtAO) gl.setRenderTarget(PRE.rtAO); compileClipped(camera); } catch (e) {} finally { gl.setRenderTarget(was); } };
  precompile();                                                                         // v35: hidden parts' shaders, while the room's idle (listed before the living room is put away)
  livingFromOutside();                                                                  // V2.72 (N14): what the landing hides, hidden before its shaders are built
  if (gl.compileAsync && !/[?&]nocompile\b/.test(location.search)) {
    msg.textContent = "Building the house…"; msg.hidden = false;
    const go = () => { const was = gl.getRenderTarget();
      try {
        if (postLive()) { if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }); gl.setRenderTarget(PRE.rtAO); }
        texWarm(); Promise.race([Promise.all([compileClipped(camera, true), postWarm()]), new Promise(r => setTimeout(r, 8000))]).then(first, first);   // V2.66 (N13): the shade's and glow's too; the textures meanwhile   // V2.64: by cutting planes (01_renderer)
      } catch (e) { first(); } finally { gl.setRenderTarget(was); } };
    go();
  } else first();
  lookFromHash();                                                                       // v28: a shared #look- link (after the first compile, so its note shows)
  // for the headless stills (shot3d.py): set the options and a view, then take a picture
  window.R3D = {
    set(o) { const aim = o.aim; o = Object.assign({}, o); delete o.aim; if (SH) showStop(false);   // v32: "aim", a piece's own close look
      const lay = "added" in o ? { layout: o.layout || {}, added: o.added } : null; delete o.added; if (lay) delete o.layout;   // v32: pieces added for a still
      const addp = o.addpiece; delete o.addpiece;                                    // v32: the plan page's "Add it to my room": one more piece
      const showat = o.showat; delete o.showat;                                      // v34: a still part way through "Watch it open"
      if (o.merge) { delete o.merge; for (const k of ["sugg", "ideas", "decor"]) if (o[k]) o[k] = Object.assign({}, S[k], o[k]); }   // v32: "Show it in my room" keeps what's already on
      oldScene(o); Object.assign(S, o); S.decor = Object.assign({}, DEF.decor, o.decor || S.decor); if (o.scene && !o.lv) S.lv = Object.assign({}, SCENES[o.scene].levels); if (o.quality) S.picked = true; GS.cabSnap = true; applyState(); GS.cabSnap = false; syncButtons(); if (lay) { GS.cabSnap = true; restoreLayout(lay); GS.cabSnap = false; }
      if (addp && CATALOGUE[addp.type]) { const a = { id: "a" + Date.now().toString(36), type: addp.type, x: addp.x, z: addp.z }; pushUndo(); addThing(a); if (addp.rot) setLayout(a.id, { rot: addp.rot }); placeAll(); store.set(KEY, S); dirty(); }
      if (showat != null) { showOpen(); if (SH) { SH.own = true; SH.paused = true; SH.t = showat; showPose(SH.t); showCard(); qs("#r3d-show").hidden = true; } }
      if (o.view) setView(o.view, true); if (aim) flyTo(aim.eye, aim.at, aim.fov || 55, !!aim.above, true); },   // v58: "above" lets a look stand off (the house)
    still, finish, lookUrl, finishes: () => finSent(), looks: () => finSchemes().map(lookSlim), setFinishes: o => finImport(o), ready: true, buildMs: Math.round(performance.now() - t0), _dbg: { get flying() { return !!GS.tween; }, get warming() { return { busy: !!WARMB, parts: PRE.busy, warmed: [...WARMED] }; }, openAct, finAll, get H3() { return R.HOUSE3; }, get RMODE() { return GS.RMODE; }, placeAt, placeSpot, roomWhy, ixSetups, ixData, get HPL() { return HPL; }, get HCAT() { return HCAT; }, spotAt, goStandAt: goStand, HPARTS, PICK, HEDITS, get actId() { return GS.actId; }, swingDoor, WALK, walkMove, collide, bodyBlocked, floorAtCm, HSOLID, livSolids, livFloors,  swingAll, gl, scene, lights, get sun() { return sun; }, SUNCFG, get winGlass() { return winGlass; }, AO, ENV, envLevels, bloomLevels, roomEnv, THREE, S, MOV, floorHop, solidBoxes, leafTexture, UNDO, camera, controls, VIEWS, MATS, OAK_TEX, CABP, SUGG_G, IDEA_G, CATALOGUE, BES, WORK, precompile, PRE, AIMG, warmSwitch, WARMED, BAKE },
    errors: () => store.get("r3d-errors", []),                                       // v35: what the trap kept
    timing: () => Object.assign({ page: Math.round(performance.now()) }, START_MS),     // V1.31: the start's steps (ms from start()), and the page's age
    perf: perfInfo,                                                                   // v35: the counts to watch each round
    photos: () => loadPhotos().then(() => Object.keys(PHOTO).length),               // V1.9: how many photo sets landed
    bench(n = 30) {   // ms per frame while orbiting at full resolution, for tuning
      const t = performance.now();
      for (let i = 0; i < n; i++) { controls.rotateLeft ? controls.rotateLeft(0.01) : 0; camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.004); camera.lookAt(controls.target); gl.render(scene, camera); }
      const px = new Uint8Array(4); const c = gl.getContext(); c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, px);
      return (performance.now() - t) / n;
    },
  };
  if (window.__r3dPending) { window.R3D.set(window.__r3dPending); window.__r3dPending = null; }
}
window.addEventListener("r3d-set", e => { if (window.R3D) window.R3D.set(e.detail); else window.__r3dPending = e.detail; });

