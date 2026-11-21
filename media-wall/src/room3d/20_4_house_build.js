function buildHouse() {
  const HS = R.HOUSE; if (!HS) return;
  houseG = new THREE.Group(); houseG.name = "houseG"; houseG.visible = false; scene.add(houseG);
  let cur = houseG;                                                               // v55: each floor its own group (the floor picker)
  const TK = R.HOUSE3 ? { "#5d6a44": "lawn", "#b4afa5": "concrete", "#c9c5bd": "paving", "#5b5b5e": "road", "#a7a299": "paving", "#9a5a43": "brick", "#6b5644": "fence" } : {};   // v59; V1.3 the fences' boards
  const mats = {}, mat = c => mats[c] || (mats[c] = (() => { const T = TK[c] && houseTex(TK[c]); const m = reg(new THREE.MeshStandardMaterial({ color: T && !T.tint ? "#ffffff" : c, map: T ? T.map : null, normalMap: T && T.normal || null, roughness: 0.9 })); m.clippingPlanes = []; return m; })());   // v70: and the photo-textures' normals
  const box = (xa, xb, ya, yb, za, zb, c) => { const p = v3((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2), g = new THREE.BoxGeometry(Math.max(1, Math.abs(xb - xa)) * M, Math.max(1, Math.abs(yb - ya)) * M, Math.max(1, Math.abs(zb - za)) * M);
    if (TK[c]) worldUV(g, TK[c], p);
    const b = new THREE.Mesh(g, mat(c)); b.position.copy(p); b.receiveShadow = true; cur.add(b); return b; };
  const label = (lines, x, y, z) => {
    const cv = document.createElement("canvas"), g = cv.getContext("2d"); cv.width = 512; cv.height = 160;
    g.fillStyle = "rgba(255,252,245,0.92)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 152, 40) : g.rect(4, 4, 504, 152); g.fill();
    g.fillStyle = "#1d2a22"; g.textAlign = "center"; g.font = "600 52px Figtree, system-ui, sans-serif"; g.fillText(lines[0], 256, lines[1] ? 70 : 96, 470);
    if (lines[1]) { g.font = "400 36px Figtree, system-ui, sans-serif"; g.fillStyle = "#4b5650"; g.fillText(lines[1], 256, 122, 470); }   // V2.46: squeezed to fit, not cut ("under the garage")
    if (SMALL) { cv.height = 112; g.clearRect(0, 0, 512, 160); g.fillStyle = "rgba(255,252,245,0.94)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 104, 52) : g.rect(4, 4, 504, 104); g.fill();
      g.fillStyle = "#1d2a22"; g.textAlign = "center"; g.font = "600 60px Figtree, system-ui, sans-serif"; g.fillText(lines[0], 256, 78, 470); }   // V1.30: a phone shows the name only, larger
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    /* V1.30 (U3): the same size on screen however far off (they were a few pixels tall on a phone, from a floor's view) */
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false, sizeAttenuation: false })); sp.renderOrder = 999;
    const px = SMALL ? 30 : 46, asp = cv.width / cv.height;   // its height in screen pixels, whatever the lens
    sp.onBeforeRender = (r, sc, cam) => { const k = 2 * px / Math.max(200, canvas.clientHeight) * Math.tan((cam.fov || 50) * Math.PI / 360); if (sp.scale.y !== k) { sp.scale.set(k * asp, k, 1); sp.updateMatrixWorld(); } };
    sp.scale.set(0.05 * asp, 0.05, 1); sp.position.copy(v3(x, y, z)); sp.userData.hlabel = true; sp.userData.px = [px * asp, px]; cur.add(sp); };
  const FLOOR = { kitchen: "#d6cfc2", bathroom: "#c3d6dc", wc: "#c3d6dc", garage: "#aaa69e", secret: "#8d8880", porch: "#b9a58e" }, WALL = "#f2eee6", WH = 110;
  const H3 = R.HOUSE3;
  if (H3) {
    /* v58: the house built from house/model.py: walls with their openings cut, uPVC frames and glass, brick, floors, the lower flight,
       the fittings, the tiled roof and dormer. Merged per floor and material */
    /* v72 (B2): contact shadows: a soft patch darkest under the piece's middle (each box's own 0–1 UVs), never writing depth */
    const contactMat = () => { const tex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
        gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.55, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const m = reg(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }));
      m.clippingPlanes = []; m.userData.hk = "contact"; return m; };
    // V2.0: the stair wall up to the landing in the living room's own stair-wall paint (a copy, so Look's colour follows it up the stairs)
    const stairMat = () => { const m = paintMat(lum("#2d5a46") / BASE_L, false, false, "w:stairs").clone(); paintMats.set("house:stairs", reg(m));
      const rk = (H3.depth_rank || {}).stairpaint ?? 2; m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -2 * rk;
      m.clippingPlanes = []; m.userData.hk = "stairpaint"; m.onBeforeCompile = paintGrain; m.customProgramCacheKey = () => "paintwall"; return m; };   // N172: its emulsion as the walls   // V2.8, the client: "first floor landing west wall should match the living room west wall and act as one wall": never the landing's palette
    const m3 = {}, mat3 = k => m3[k] || (m3[k] = k === "contact" ? contactMat() : k === "stairpaint" ? stairMat() : (() => { const [c, r] = H3.mats[k] || ["#cccccc", 0.9], gl3 = k === "glass" || k === "glass_frost", T = houseTex(k);
      const m = reg(new THREE.MeshStandardMaterial({ color: T && !T.tint && !BED_TINT.has(k) ? "#ffffff" : c, map: T ? T.map : null, bumpMap: T && T.bump ? T.map : null, bumpScale: T ? T.bump : 1, normalMap: T && T.normal || null, roughness: T && T.rough ? Math.min(1, r / T.roughMean) : r, roughnessMap: T && T.rough || null, metalness: k === "brass" || k === "chrome" || k === "steel" ? 0.8 : k === "mirror" ? 0.25 : 0, transparent: gl3, opacity: gl3 ? (k === "glass" ? 0.14 : 0.86) : 1,   /* V1.13: clear (0.3 tinted the outside blue-green); V2.40: frosted, the light through */ depthWrite: !gl3, side: HOUSE_SIDE,
        emissive: { led: "#ffffff", pc_glow: "#cfe0ff", screen: "#1b2433", lamp_purple: "#8a45ff", bulb: "#ffc98a" }[k] || "#000000", emissiveIntensity: { led: 1.5, pc_glow: 0.9, screen: 0.12, lamp_purple: 2.2, bulb: 4 }[k] || 0 }));   // V3.76 (N116): a ceiling bulb lit, warm   // V2.48: the office's purple lamp   // v60: the kitchen's LED battens glow; v61: the PC's glass, the screens
      m.envMapIntensity = 0.15;   // v60: the reflections are the living room's (its LEDs tinted the kitchen's white walls pink)
      const NS = { paint: 0.3, ceiling: 0.3, brick: 0.7, party: 0.7, soldier: 0.7 }[k];   // V1.47, the client: "walls ... have a rugged non flat effect ... should be smooth or have less of that look": the relief turned down
      if (m.normalMap && NS) m.normalScale.set(NS, NS);
      if (!LOWD) { m.userData.hk = k; m.envMap = houseEnv(); m.envMapIntensity = finishEnv(m); }   // v73: one neutral room, made once (V1.13: the iPhones too)
      if (!m.map && !gl3 && !BLACK_KEEP.has(k)) liftBlack(m.color);   // V3.44 (N96): a black piece shows its shape (it drew as a hole)
      if ((!m.map || T.tint) && !WHITE_KEEP.has(k)) capWhite(m.color);   // N184: a white under the clip, the palette's too (finPatch); the bedding as N113 left it
      if (k === "mirror") { m.color.set("#ffffff"); m.map = MIRROR_SHEEN; mirrorFirst(m); }   // V1.17: the hall's and the bathroom's mirrors as the living room's (grey before; as metal, black)
      if (gl3) glassTod(m);
      const rk = (H3.depth_rank || {})[k] ?? 3;   // V1.31 (U6): where faces lie in one plane the higher rank is drawn (house/model.py depth_rank); constant, so nothing shows through at a slant
      if (rk) { m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -2 * rk; }
      houseClip(m, [], false); m.userData.hk = k; return k === "concrete" ? garageFloor(m) : finPatch(m, k); })());   // V2.64: 6 planes from the start (09_house_views)
    if (S.fin === undefined && R.HOUSE3.client_finishes && Object.keys(R.HOUSE3.client_finishes).length) finRestore(R.HOUSE3.client_finishes);
    { const P = R.HOUSE3.plan_finishes || {}; if (P.rooms && S.planFin !== P.v) { const c = finClean(P.rooms); delete c[LIVR]; S.fin = S.fin || {};   // N199: the plan's scheme under each room's own choices (once a version)
      for (const [r, sl] of Object.entries(c)) S.fin[r] = Object.assign({}, sl, S.fin[r]); S.planFin = P.v; store.set(KEY, S); } }   // V2.11: the scheme kept in the repo, until this device picks its own
    HMATS = m3; FIN.mat3 = mat3; blindsApply(); hceilApply(); finApplyAll();
    if (window.__finPending) { const p = window.__finPending; window.__finPending = null; finImport(p); }   // V2.11: from a Send link opened before the 3D was ready   // V2.7: (mat3 for a floor laid by the tray)   // V2.6: the colours kept for the house's rooms
    /* V2.71 (N16): each piece's room, the one that holds it whole (shared pieces: none, always drawn); a floor's mesh keeps each room's
       pieces together, its span noted (userData.rooms: [room, first, count]), so the rest can be left out (roomCull) */
    const RVOL = Object.entries(H3.rooms || {}).map(([id, r], i) => [id, r[0] - 1, r[1] + 1, r[4] - 2, r[4] + (r[4] >= 260 ? 420 : (H3.ceil || 235) + 2), r[2] - 1, r[3] + 1, i + 1]);
    const FLIGHT = ((H3.wells || {}).flight || []).map(f => Object.assign([...f], { V: RVOL.find(V => V[0] === "lower_stairs") })).filter(f => f.V);
    const roomOf = q => { if (!q.boundingBox) q.computeBoundingBox(); const b = q.boundingBox, x0 = -b.max.x / M, x1 = -b.min.x / M, y0 = b.min.y / M, y1 = b.max.y / M, z0 = b.min.z / M, z1 = b.max.z / M;
      for (const F of FLIGHT) if (x0 >= F[0] - 1 && x1 <= F[1] + 1 && z0 >= F[2] - 1 && z1 <= F[3] + 1 && y0 >= F[4] - 2 && y0 < F[4] + 260 && y1 <= F[4] + 360) return F.V;   // V3.35: the lower flight's treads and rail are the lower stairs' (inside the store's outline, they went with it)
      let hit = null; for (const V of RVOL) if (x0 >= V[1] && x1 <= V[2] && y0 >= V[3] && y1 <= V[4] && z0 >= V[5] && z1 <= V[6]) { if (hit) return null; hit = V; } return hit; };
    const put = (g, geos, m, part) => { if (!geos.length) return;
      if (geos.some(q => q.index) && geos.some(q => !q.index)) geos = geos.map(q => { if (!q.index) return q; const u = q.toNonIndexed(); q.dispose(); return u; });   // V2.98 (N37): boxes with profiles or turned shapes in one draw
      let rooms = null;
      if (!part && RVOL.length) { const V = geos.map(roomOf), ord = geos.map((q, i) => i).sort((a, b) => ((V[a] || [])[7] || 0) - ((V[b] || [])[7] || 0) || a - b);
        rooms = []; let at = 0;
        for (const i of ord) { const q = geos[i], n = q.index ? q.index.count : q.attributes.position.count, id = V[i] ? V[i][0] : "", L = rooms[rooms.length - 1];
          if (L && L[0] === id) L[2] += n; else rooms.push([id, at, n]); at += n; }
        geos = ord.map(i => geos[i]); if (rooms.length === 1 && !rooms[0][0]) rooms = null; }
      const mg = mergeGeometries(geos), me = new THREE.Mesh(worldUV(mg, m.userData.hk, m.userData.hk === "tile_w" ? gridFrom(mg) : null), m); me.receiveShadow = true;   // V2.8: the stair wall takes shadows as the living room's stair wall below it does (V2.2 took them off: two shades along the flight)
      if (rooms) me.userData.rooms = rooms;
      me.castShadow = !m.transparent; g.add(me); geos.forEach(q => q.dispose()); return me; };   // v69: the house's walls and pieces cast the sun's shadow (as the living room's)
    const mx = new THREE.Matrix4();
    /* v69 (B4): rounded edges by material (whites and woods a little, the suite and cushions a lot); walls, floors and frames sharp */
    const ROUND = { pine: 0.8, pine_dark: 0.3, knob: 1.4, handle_black: 0.7, newel: 1.2, rail_white: 1.8, monitor_back: 1.5, mouse: 1.5, key_dark: 0.25, key_pink: 0.25, book0: 0.3, book1: 0.3, book2: 0.3, book3: 0.3, book4: 0.3, book5: 0.3, birch: 0.6, oak: 0.6, wardrobe: 0.5, gloss: 0.8, door_white: 0.4, door_wood: 0.4, fitting: 6, porcelain: 1, sanitary: 1,
      primrose: 4, duvet: 3, pot: 4, lycksele: 5, storebox: 1.5, leather: 2, check: 1, curtain: 1, mattress: 4, pillow: 6,
      /* V2.44: every piece's edges catch the light (a bevel to its size); the worktop a little */
      black: 0.6, black_app: 1.2, worktop: 0.4, steel: 0.5, steel_dark: 0.5, chrome: 0.4, screen: 0.4, glass_dark: 0.3, pc_white: 0.8, panel: 0.5,
      rug: 0.8, bathmat: 0.8, recycle: 1, bin: 1, bin_white: 1, tapestry: 0.6, tapestry_dark: 0.6, chalk: 0.3, mirror: 0.3, blind_cloth: 0.3 };
    const SOFT = { pillow: 4, mattress: 3, duvet: 3 };
    const CLOTH = { lycksele: 1, leather: 1, pillow: 1, mattress: 1, duvet: 1, cloth0: 1, cloth1: 1, cloth2: 1, cloth3: 1, cloth4: 1, cloth5: 1, cloth6: 1 };   // V2.17: drawn as cloth (clothBox)   // V1.20: the soft things' edges round in steps (one step read as a chamfer: slabs)
    /* v78: a face exactly meeting a neighbour's showed edge-on as a bright hairline; the faces two square pieces share, from opposite sides: */
    const fkey = (ax, p, a0, a1, b0, b1) => ax + "|" + p + "|" + a0 + "|" + a1 + "|" + b0 + "|" + b1;
    const sharedFaces = F => { const lo = new Set(), hi = new Set();
      for (const [mk, list] of Object.entries(F.boxes)) { if ((!(SMALL && !GOOD_PHONE) && (ROUND[mk] ?? (mk.startsWith("cloth") ? 1.5 : 0))) || mk === "glass" || mk === "contact") continue;
        for (const [x0, y0, z0, x1, y1, z1] of list) {
          lo.add(fkey("x", x0, y0, y1, z0, z1)); hi.add(fkey("x", x1, y0, y1, z0, z1)); lo.add(fkey("y", y0, x0, x1, z0, z1)); hi.add(fkey("y", y1, x0, x1, z0, z1));
          lo.add(fkey("z", z0, x0, x1, y0, y1)); hi.add(fkey("z", z1, x0, x1, y0, y1)); } }
      return new Set([...lo].filter(k => hi.has(k))); };
    let SHARED = new Set();
    const houseBox = (mk, x0, y0, z0, x1, y1, z1) => {
      const w = x1 - x0, h = y1 - y0, d = z1 - z0, r = SMALL && !GOOD_PHONE ? 0 : ROUND[mk] ?? (mk.startsWith("cloth") ? 1.5 : 0), c = v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      if (!r) {   // v78: from its exact corners, so two pieces that meet share their edge to the bit (a centre ± half missed by a hair: hairline cracks on the walls)
        const b = new THREE.BoxGeometry(1, 1, 1), P = b.attributes.position;
        for (let i = 0; i < P.count; i++) P.setXYZ(i, -(P.getX(i) > 0 ? x0 : x1) * M, (P.getY(i) > 0 ? y1 : y0) * M, (P.getZ(i) > 0 ? z1 : z0) * M);
        if (SHARED.size && mk !== "glass" && mk !== "contact") {   // BoxGeometry's faces in order: +x (here x0: v3 flips x), -x (x1), +y, -y, +z, -z
          const keys = [fkey("x", x0, y0, y1, z0, z1), fkey("x", x1, y0, y1, z0, z1), fkey("y", y1, x0, x1, z0, z1), fkey("y", y0, x0, x1, z0, z1),
                        fkey("z", z1, x0, x1, y0, y1), fkey("z", z0, x0, x1, y0, y1)];
          if (keys.some(k => SHARED.has(k))) { const I = b.index.array, keep = [];
            b.groups.forEach((gp, f) => { if (!SHARED.has(keys[f])) for (let j = gp.start; j < gp.start + gp.count; j++) keep.push(I[j]); });
            b.setIndex(keep); b.clearGroups(); } }
        return b; }
      if (CLOTH[mk] && !LOWD) return clothBox(mk, x0, y0, z0, x1, y1, z1, r);
      /* V2.79 (N27): the rounding as fine as it shows: under 0.8 cm one bevel an edge (bevelBox, 44 triangles), under 2 cm two steps (108);
         the big curves as they were */
      const re = Math.max(0.0005, Math.min(r, Math.min(w, h, d) / 2 - 0.05));
      if (!SOFT[mk] && re < 0.8) {
        const { pos, nrm, face } = bevelBox([w * M / 2, h * M / 2, d * M / 2], re * M), AX = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]], H = [w, h, d], uv = [];
        for (let i = 0; i < face.length; i++) { const [ua, va] = AX[face[i]]; uv.push(pos[3 * i + ua] / (H[ua] * M) + 0.5, pos[3 * i + va] / (H[va] * M) + 0.5); }
        const b = new THREE.BufferGeometry(); b.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); b.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
        b.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); b.translate(c.x, c.y, c.z); return b; }
      const b = new RoundedBoxGeometry(w * M, h * M, d * M, SOFT[mk] || (re >= 2 ? 2 : 1), re * M);
      b.translate(c.x, c.y, c.z); return b; };
    /* V2.17 (R4): the soft things as cloth: a finely divided rounded box, shaped: a pillow plumped, a duvet in soft folds (two crossing waves),
       a mattress crowned, a hanging garment narrowing to its shoulders */
    const clothBox = (mk, x0, y0, z0, x1, y1, z1, r) => {
      const w = x1 - x0, h = y1 - y0, d = z1 - z0, a = w / 2, bb = h / 2, cc = d / 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
      const seg = v => Math.min(40, Math.max(3, Math.round(v / 3))), B = new THREE.BoxGeometry(w, h, d, seg(w), seg(h), seg(d));
      const rr = Math.max(0.05, Math.min(r, a - 0.05, bb - 0.05, cc - 0.05)), P0 = B.attributes.position, I0 = B.index.array, map = new Map(), pos = [], idx = [];
      const remap = new Int32Array(P0.count);
      for (let i = 0; i < P0.count; i++) { const k = Math.round(P0.getX(i) * 100) + "," + Math.round(P0.getY(i) * 100) + "," + Math.round(P0.getZ(i) * 100);
        let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(P0.getX(i), P0.getY(i), P0.getZ(i)); } remap[i] = j; }
      for (let i = 0; i < I0.length; i++) idx.push(remap[I0[i]]);
      B.dispose();
      const hang = mk.startsWith("cloth") && h > 40 && Math.min(w, d) < 12;   // a garment on its hanger (seen edge on), not a folded pile
      for (let i = 0; i < pos.length; i += 3) {
        let x = pos[i], y = pos[i + 1], z = pos[i + 2];
        const sx = x / a, sy = y / bb, sz = z / cc;
        if (hang) { const top = Math.max(0, sy - 0.62) / 0.38, dd = d > w;   // the shoulders slope in to the hanger's hook, the hem falls in folds
          if (dd) z *= 1 - 0.55 * top * top; else x *= 1 - 0.55 * top * top;
          const f = Math.sin((dd ? z : x) * 0.9 + y * 0.05) * 0.5 * (1 - top); if (dd) x += f * Math.sign(x || 1) * 0.4; else z += f * Math.sign(z || 1) * 0.4; }
        const ix = Math.max(-(a - rr), Math.min(a - rr, x)), iy = Math.max(-(bb - rr), Math.min(bb - rr, y)), iz = Math.max(-(cc - rr), Math.min(cc - rr, z));
        let nx = x - ix, ny = y - iy, nz = z - iz; const ln = Math.hypot(nx, ny, nz);
        if (ln > 1e-6) { nx /= ln; ny /= ln; nz /= ln; x = ix + nx * rr; y = iy + ny * rr; z = iz + nz * rr; } else { nx = 0; ny = 1; nz = 0; }
        if (mk === "pillow") { y *= 1 - 0.5 * (Math.pow(Math.abs(sx), 2.5) + Math.pow(Math.abs(sz), 2.5)) * 0.5 - 0.2 * Math.abs(sx * sz);   // V2.91 (N36): plumper, its corners pinched
          y += 0.35 * Math.sin(x * 0.5 + z * 0.3) * (1 - sx * sx) * (1 - sz * sz); }
        else if (mk === "mattress") { if (ny > 0.5) y += 0.9 * (1 - sx * sx) * (1 - sz * sz); }
        else if (mk === "lycksele" || mk === "leather") { const pf = (1 - sx * sx) * (1 - sy * sy) * (1 - sz * sz);   // V2.44: upholstered: each face puffed in its middle
          x += nx * 1.8 * pf; y += ny * 2.6 * pf; z += nz * 1.8 * pf; }
        else if (mk === "duvet") { const wx = cx + x, wz = cz + z;
          const f = 1.25 * Math.sin(wx * 0.15 + Math.sin(wz * 0.045) * 1.9) * Math.sin(wz * 0.11 + 0.6) + 0.45 * Math.sin(wx * 0.41 - wz * 0.27) + 0.2 * Math.sin(wz * 0.9 + wx * 0.2);
          const drape = h > 3 * Math.min(w, d);   // V2.91 (N36): a side hanging down, or the top lying flat
          if (drape) { const u = w < d ? wz : wx, t = (1 - sy) / 2, wave = 0.9 * t * t * Math.sin(u * 0.13 + 0.8) + 0.25 * t * Math.sin(u * 0.37);
            if (w < d) x += wave; else z += wave; }   // its hem in soft ripples
          else { const loft = Math.min(4, 0.04 * Math.min(w, d)) * (1 - Math.pow(Math.abs(sx), 4)) * (1 - Math.pow(Math.abs(sz), 4)),   // lofty in the middle, rolled at its edges
              g = 1.1 * Math.sin(wx * 0.09 + Math.sin(wz * 0.04) * 1.6) * Math.sin(wz * 0.07 + 0.6);   // long, slow folds on the top
            x += nx * f * (ny > 0.5 ? 0.6 : 1); y += ny > 0.3 ? ny * (0.5 * f + g + loft) : ny * f; z += nz * f * (ny > 0.5 ? 0.6 : 1); } }
        pos[i] = -(cx + x) * M; pos[i + 1] = (cy + y) * M; pos[i + 2] = (cz + z) * M;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx.map((v, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]));   // x is mirrored into the world (v3), so each face is wound back
      g.computeVertexNormals(); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); return g; };
    /* V1: a floor built again with the client's edits (editedFloor); it keeps its group, so what's shown stays as it was */
    HBUILD = (fk, F) => {
      joinDrop(); cur = HFLOOR[fk];
      if (cur) { for (const c of [...cur.children]) { if (c.userData.hlabel) continue; cur.remove(c); c.traverse(o => o.geometry && o.geometry.dispose()); } }
      else { cur = HFLOOR[fk] = new THREE.Group(); houseG.add(cur); }
      const fresh = !cur.userData.built; cur.userData.built = true;
      SHARED = sharedFaces(F);
      /* V2.15 (FINISHES F5): each room's ceiling light (its item "light.<room>") its own group, so a fitting chosen in the tray can stand in for it */
      const tg = F.tags || [], lid = t => (t != null && t >= 0 && typeof tg[t] === "string" && tg[t].startsWith("light.")) ? tg[t].slice(6) : null, LG = {};
      const lgOf = r => LG[r] || (LG[r] = (() => { const g = new THREE.Group(); g.userData.finLight = r; cur.add(g); FIN_PEND[r] = g; return g; })());
      /* V2.98 (N37): one draw a material for each group: a floor's boxes, profiles and turned shapes of one material were two or three */
      const acc = new Map(), add = (g, mk, q) => { let o = acc.get(g); if (!o) acc.set(g, o = {}); (o[mk] = o[mk] || []).push(q); };
      for (const [mk, list] of Object.entries(F.boxes)) { const bt = (F.bt || {})[mk] || [];
        list.forEach(([x0, y0, z0, x1, y1, z1], i) => { const r = lid(bt[i]); add(r ? lgOf(r) : cur, mk, houseBox(mk, x0, y0, z0, x1, y1, z1)); }); }
      SHARED = new Set();
      const PSOFT = { lycksele: 2.2, pillow: 3, cloth: 0.7 };   // V2.46 (N6): the cloth profiles (the chair-bed, the garments) with soft edges, kept to their outline
      const prismGeo = P => {                         // a profile extruded: along x the profile is (z, y), along z it is (x, y)
        const r = SMALL && !GOOD_PHONE ? 0 : Math.min(PSOFT[P.m] ?? (P.m.startsWith("cloth") ? PSOFT.cloth : 0), (P.b - P.a) / 2 - 0.1);
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(P.pts.map(([u, w]) => new THREE.Vector2(u * M, w * M))), r > 0
          ? { depth: (P.b - P.a - 2 * r) * M, bevelEnabled: true, bevelThickness: r * M, bevelSize: r * M, bevelOffset: -r * M, bevelSegments: r < 0.8 ? 1 : 2 }   // V2.79 (N27): the garments' 0.7 cm, one step (as houseBox)
          : { depth: (P.b - P.a) * M, bevelEnabled: false });
        if (r > 0) g.translate(0, 0, r * M);
        if (P.axis === "x") mx.set(0, 0, -1, -P.a * M, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
        else if (P.axis === "y") mx.set(-1, 0, 0, 0, 0, 0, 1, P.a * M, 0, 1, 0, 0, 0, 0, 0, 1);   // V1.14: a plan shape (x, z) raised from a to b (a chair's star base)
        else mx.set(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, P.a * M, 0, 0, 0, 1);
        g.applyMatrix4(mx);
        if (P.axis === "z") { const A = Object.values(g.attributes);   // V1.31 (U6): mirrored (x flipped), so its faces turned inside out: wound back
          for (let i = 0; i + 2 < g.attributes.position.count; i += 3) for (const a of A) for (let c = 0; c < a.itemSize; c++) { const t = a.array[(i + 1) * a.itemSize + c]; a.array[(i + 1) * a.itemSize + c] = a.array[(i + 2) * a.itemSize + c]; a.array[(i + 2) * a.itemSize + c] = t; } }
        return g; };
      for (const P of F.prisms) add(cur, P.m, prismGeo(P));
      for (const L of F.lathes || []) { const g = new THREE.LatheGeometry(L.p.map(([r, h]) => new THREE.Vector2(r * M, h * M)), LOWD ? 12 : 28);   // v70: the suite's turned shapes (pans, seats, bowls); V2.15: a room's light's in its group
        g.scale(L.s[0], 1, L.s[1]); const c = v3(L.c[0], L.c[1], L.c[2]); g.translate(c.x, c.y, c.z); const r = lid(L.t); add(r ? lgOf(r) : cur, L.m, g); }
      for (const [g, o] of acc) for (const [mk, geos] of Object.entries(o)) { const me = put(g, geos, mat3(mk)); if (me && g === cur) me.userData.fm = fk; }
      { const ps = pieceShade(F, m3.shade_piece || (m3.shade_piece = pieceShadeMat())); if (ps) { ps.userData.fm = fk; cur.add(ps); } }   // V2.52 (R2)
      { const es = edgeShade(F, m3.shade_edge || (m3.shade_edge = edgeShadeMat())); if (es) cur.add(es); }   // V3.63 (N112)
      if (fresh) for (const L of F.labels || []) { label([L.name, [L.use, `about ${L.w.toFixed(1)} × ${L.d.toFixed(1)} m`].filter(Boolean).join(" · ")], L.x, L.y, L.z);
        cur.children[cur.children.length - 1].userData.area = L.w * L.d; }   // V1.35: the bigger room's name wins where two overlap
      const partG = (P, into, at) => {                 // a part's group on its pivot, its own parts inside it (V1.26b: a bifold's second panel)
        const pv = v3(...P.pivot), g = new THREE.Group(); g.position.copy(pv).sub(at); into.add(g);
        const pm = {}, bb = new THREE.Box3(), ad = (mk, q) => { if (into === cur) { q.computeBoundingBox(); bb.union(q.boundingBox); } (pm[mk] = pm[mk] || []).push(q.translate(-pv.x, -pv.y, -pv.z)); };   // V2.98 (N37): a material one draw (boxes and profiles)
        for (const [mk, list] of Object.entries(P.boxes)) for (const [x0, y0, z0, x1, y1, z1] of list) ad(mk, houseBox(mk, x0, y0, z0, x1, y1, z1));
        for (const Q of P.prisms || []) ad(Q.m, prismGeo(Q));
        for (const [mk, geos] of Object.entries(pm)) put(g, geos, mat3(mk), true);
        if (into === cur && !bb.isEmpty()) { const V = roomOf({ boundingBox: bb }); if (V) g.userData.room = V[0]; }   // the room that holds it whole (09 roomCull)
        const kids = Object.values(P.parts || {}).map(Q => Object.assign(partG(Q, g, pv), { angle: Q.angle, axis: Q.axis }));
        return { g, kids };
      };
      for (const [pk, P] of Object.entries(F.parts || {})) {   // v68: a piece that moves, its boxes round its hinge (V1.26: the doors too)
        const { g, kids } = partG(P, cur, new THREE.Vector3());
        const was = HPARTS[pk], kept = BINS.includes(pk) ? null : (S.doors || {})[pk];   // V1.26b: a door stays as you left it (this device; V3.17: not the bin cupboards')
        HPARTS[pk] = { g, kids, angle: P.angle, axis: P.axis, label: P.label, floor: fk, t: was ? was.t : kept != null ? kept : (P.t0 || 0) };
        partPose(HPARTS[pk]);
      }
      pickable(fk, F);   // V1.50: each piece's boxes, for a tap (the app's bridge too)
      hsolidSet(fk, F); if (HSOLID[fk]) HSOLID[fk].g = cur;   // V1.28: solid to the eye (shown with its floor)
    };
    for (const [fk, F] of Object.entries(H3.floors)) HBUILD(fk, editedFloor(fk, F));
    houseShade(H3, m3); blindsApply();   // V1.47: the blinds' cloth exists now
  }
  for (const F of H3 ? [] : HS) {
    cur = HFLOOR[F.id] = new THREE.Group(); houseG.add(cur);
    for (const r of F.rooms) {
      box(r.x0, r.x1, F.y - 6, F.y, r.z0, r.z1, FLOOR[r.id] || (F.id === "first" ? "#d9cbb3" : "#ddd3c2"));
      for (const [xa, xb, za, zb] of [[r.x0, r.x1, r.z0, r.z0 + 6], [r.x0, r.x1, r.z1 - 6, r.z1], [r.x0, r.x0 + 6, r.z0, r.z1], [r.x1 - 6, r.x1, r.z0, r.z1]]) box(xa, xb, F.y, F.y + WH, za, zb, WALL);
      if (r.name) label([r.name, [r.use, `${r.w.toFixed(1)} × ${r.d.toFixed(1)} m`].filter(Boolean).join(" · ")], (r.x0 + r.x1) / 2, F.y + WH + 40, (r.z0 + r.z1) / 2);
    }
    for (const s of F.solids) box(s.x0, s.x1, F.y, F.y + WH + 20, s.z0, s.z1, "#4a463f");
    for (const f of F.fixtures || []) box(f.x0 + 2, f.x1 - 2, F.y, F.y + f.h, f.z0 + 2, f.z1 - 2, "#f4f3ef");   // v57: the fittings the client marked
    for (const s of F.slopes || []) {                                // v57, client: the roof comes into the room (rooms in the roof): low at the east wall
      const b = box(s.x0, s.x1, F.y, F.y + WH + 20, s.z0, s.z1, "#cfc6b6"), pa = b.geometry.attributes.position, h = (WH + 20) * M;
      for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0 && pa.getX(i) > 0) pa.setY(i, -h / 2 + 40 * M);   // three's +x is the east (x flipped)
      pa.needsUpdate = true; b.geometry.computeVertexNormals();
      if (s.name) label([s.name, s.use], (s.x0 + s.x1) / 2, F.y + WH + 40, (s.z0 + s.z1) / 2);
    }
    for (const w of F.windows) box(w.x0, w.x1, F.y + 70, F.y + WH + 8, w.side === "n" ? F.zn - 4 : F.zs - 6, w.side === "n" ? F.zn + 6 : F.zs + 4, "#9ccbe6");
    for (const d of F.doors) box(d.x0, d.x1, F.y, F.y + 4, d.side === "n" ? F.zn - 8 : F.zs - 4, d.side === "n" ? F.zn + 4 : F.zs + 8, "#8a6a4a");
    const xs = F.rooms.map(r => [r.x0, r.x1]).flat();
    label([F.title.split(" · ")[0], F.title.split(" · ")[1] || ""], (Math.min(...xs) + Math.max(...xs)) / 2, F.y + WH + 160, F.zn - 120);
  }
  /* N181: the gardens round the house and next door's things are built the first time they show (outNeed in 09), not with the house */
  HFLOOR.out = new THREE.Group(); houseG.add(HFLOOR.out); HFLOOR.nextThings = new THREE.Group(); houseG.add(HFLOOR.nextThings);
  OUTLAZY.nextThings = () => buildThings(HFLOOR.nextThings, "next");   // next door's, with Next door
  OUTLAZY.out = () => { const was = cur; cur = HFLOOR.out;
  buildPlants(cur);                                                               // V1.3: the cordyline in the back garden (with Gardens)
  buildBeyond(cur, null);                                                          // V1.4: the low building past the far fence
  buildThings(cur, "ours");                                                        // V1.6: the table and chairs
  // the front: the drive, the small lawn left of it with its low brick wall, a lawn strip by the neighbour's fence with a young tree, the
  // pavement and the close (house/HOUSE.md)
  const G0 = HS.find(F => F.id === "ground"), zf = H3 ? H3.front : G0 ? G0.zs + 20 : 530, gar = G0 && G0.rooms.find(r => r.id === "garage"), hall = G0 && G0.rooms.find(r => r.id === "hall");
  const gx0 = H3 ? H3.garage[0] : gar ? gar.x0 : 0, gx1 = H3 ? H3.garage[1] : gar ? gar.x1 : 290, hx1 = H3 ? H3.hall[1] : hall ? hall.x1 : 495;
  // v66: every layer from next door's base (15 under the floor, survey_data.LEVELS), side by side
  const dr = H3 ? (H3.drive ?? -15) : 0, B0 = H3 ? dr - 6 : -4, gw = H3 ? hx1 - 12 : hx1;
  box(gx0, gx1, B0, dr, zf, zf + 550, "#b4afa5");                    // the drive
  box(gx1, gw, B0, dr - 1, zf, zf + 550, "#5d6a44");                 // the front lawn
  box(gw, gw + 12, dr - 1, dr + 40, zf, zf + 550, "#9a5a43");        // its low brick wall (on our side of the line)
  const ge = H3 ? -125 : gx0 - 160, ge1 = H3 ? hx1 : hx1 + 12;       // v66: from next door's end wall past the alley to the party line
  box(ge, gx0, B0, dr - 1, zf, zf + 550, "#5d6a44");                 // the strip by the alley
  { const t = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 10), mat("#5f7a3e")); t.position.copy(v3(gx0 - 80, dr + 140, zf + 380)); cur.add(t); box(gx0 - 84, gx0 - 76, dr - 1, dr + 60, zf + 376, zf + 384, "#6b5644"); }
  box(ge, ge1, B0, dr + 1, zf + 550, zf + 750, "#c9c5bd");           // the pavement
  box(ge, ge1, B0, dr - 2, zf + 750, zf + 1250, "#5b5b5e");          // the road
  if (H3) { box(ge, ge1, -275, B0, zf, zf + 1250, "#6e5b45"); box(-120, -28, -275, B0, 100, zf, "#6e5b45"); }   // v58: the ground the street stands on
  label(["The front garden", "the drive, the lawn · sizes to come"], (gx0 + hx1) / 2, 120, zf + 280);
  label(["The back garden", "about 25 m"], 240, -260 + 160, -309 - 900);
  /* v55, v66: the alley down the east side between the two end walls (ours at -28, next door's at -125): level from the street, then
     stairs down to the garden's level, the gate at the bottom. Rough until measured */
  const ax0 = H3 ? -120 : -115, ax1 = H3 ? -28 : -15, zb = R.WINDOW_Z - 30, zTop = 100, zBot = -180, N = 13, yTop = dr;
  box(ax0, ax1, B0, yTop, zTop, H3 ? zf : zf + 40, "#a7a299");                    // level along the front
  for (let i = 0; i < N; i++) { const za = zTop - (zTop - zBot) * i / N, zz = zTop - (zTop - zBot) * (i + 1) / N, y = yTop - (yTop + 260) * (i + 1) / N;
    box(ax0, ax1, -262, y, zz, za, "#a7a299"); }                                   // the stairs down
  box(ax0, ax1, -264, -260, zb, zBot, "#a7a299");                                  // the foot, by the back of the house
  if (!H3) box(ax0 - 6, ax0, -260, 180, zb, zf + 40, "#8a7f72");                    // the boundary on its far side
  else {                                                                            // v58: a close-board fence, 180 over the alley as it steps down
    box(ax0 - 5, ax0, yTop, yTop + 180, zTop, zf - 12, "#6b5644");
    for (let i = 0; i < N; i++) { const za = zTop - (zTop - zBot) * i / N, zz = zTop - (zTop - zBot) * (i + 1) / N, y = yTop - (yTop + 260) * (i + 1) / N; box(ax0 - 5, ax0, y, y + 180, zz, za, "#6b5644"); }
    box(ax0 - 5, ax0, -260, -80, zb, zBot, "#6b5644");
    // v66: the alley's close-board gate in line with the fronts, 180 high, on two posts
    const zg = zf - 6;
    box(ax0 - 5, ax0 + 5, yTop, yTop + 188, zg - 6, zg + 4, "#5a4636"); box(ax1 - 10, ax1, yTop, yTop + 188, zg - 6, zg + 4, "#5a4636");   // the posts
    box(ax0 + 6, ax1 - 11, yTop + 4, yTop + 182, zg, zg + 2.5, "#6b5644");                                           // the boards
    for (let x = ax0 + 15; x < ax1 - 12; x += 10) box(x, x + 0.6, yTop + 4, yTop + 182, zg + 2.5, zg + 2.9, "#4e3c2e");   // their joints
    for (const yy of [yTop + 25, yTop + 155]) box(ax0 + 8, ax1 - 13, yy, yy + 10, zg - 2.5, zg, "#6b5644");           // ledges inside
    box(ax1 - 22, ax1 - 16, yTop + 100, yTop + 112, zg + 2.9, zg + 4.5, "#26282a");                                 // the latch
  }
  label(["The alley", "stairs down to the garden"], (ax0 + ax1) / 2, 120, -40);
  cur = was; };
  finFloorApply();   // V2.7 (FINISHES F4): the floors chosen in the tray, on their rooms
  bakeApply();
}
/* N195: the baked light (house/bake.py, data/bake.json): each shell (walls, floors, ceilings) gets its second UVs and the day's or the
   evening's map, its live direct light kept (the map holds what bounces round the room: colour bleed, soft corners, the shade under each piece).
   A mesh of a baked material the bake didn't see points at the atlas' corner texel, the house's mean light */
function bakeApply() {
  if (!BAKE.use || BAKE.done) return;   // in hand before the house is built (start), never applied after
  BAKE.done = true; const j = BAKE.use, ld = u => { const x = new THREE.TextureLoader().load("tex/" + u, () => (need = true)); x.colorSpace = THREE.NoColorSpace; x.flipY = false; x.channel = 1; return x; };   // a fourth root of the light (bake.py write)
  BAKE.day = ld(j.day); BAKE.eve = ld(j.eve); BAKE.mats = new Set();
  let off = 0; const at = {}, pre = new Set(), v = new THREE.Vector3(); for (const [k, n] of j.meshes) { at[k] = [off, n]; off += n * 2; pre.add(k.slice(0, k.lastIndexOf(":"))); }
  houseG.updateMatrixWorld(true);   // each shell found by its material, its corners and where they are (bake.py's key), not by order
  houseG.traverse(m => { if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || !m.material.userData) return;
    const g = m.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count, k0 = (m.material.userData.hk || "") + ":" + n; if (!pre.has(k0)) return;
    let sx = 0; for (let c = 0; c < n; c++) { v.fromBufferAttribute(P, I ? I.getX(c) : c).applyMatrix4(m.matrixWorld); sx += v.x + 2 * v.y + 3 * v.z; }
    const e = at[k0 + ":" + Math.round(sx)]; if (!e) return;
    const src = j.buf.subarray(e[0], e[0] + e[1] * 2), uv = new Uint16Array(P.count * 2);   // each corner's UVs onto its vertex (the mesh keeps its index)
    for (let c = 0; c < n; c++) { const vi = I ? I.getX(c) : c; uv[vi * 2] = src[c * 2]; uv[vi * 2 + 1] = src[c * 2 + 1]; }
    g.setAttribute("uv1", new THREE.BufferAttribute(uv, 2, true)); BAKE.mats.add(m.material); });
  // the rest of a baked material's meshes (a part the bake didn't see) at the atlas' (0,0), the mean bounce; a piece laid later reads it too
  houseG.traverse(m => { if (m.isMesh && BAKE.mats.has(m.material) && !m.geometry.attributes.uv1) m.geometry.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(m.geometry.attributes.position.count * 2), 2, true)); });
  const gain = Math.PI * j.scale * (j.gain || 1) * (+(location.search.match(/[?&]bake=([\d.]+)/) || [])[1] || 1);   // ?bake=N to try a level
  for (const mt of BAKE.mats) { const pre = mt.onBeforeCompile, key = mt.customProgramCacheKey;
    mt.lightMap = S.tod === "evening" ? BAKE.eve : BAKE.day; mt.lightMapIntensity = gain;
    mt.onBeforeCompile = (sh, r) => { pre.call(mt, sh, r); sh.fragmentShader = sh.fragmentShader.replace("#include <lights_fragment_maps>", THREE.ShaderChunk.lights_fragment_maps.replace("lightMapTexel.rgb", "pow( lightMapTexel.rgb, vec3( 4.0 ) )")); };
    mt.customProgramCacheKey = () => key.call(mt) + "baked"; mt.needsUpdate = true; }
}
function bakeTod() { if (BAKE.mats) for (const mt of BAKE.mats) mt.lightMap = S.tod === "evening" ? BAKE.eve : BAKE.day; }
