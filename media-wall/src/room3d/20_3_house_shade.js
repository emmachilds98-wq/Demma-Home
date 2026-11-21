/* V1.33 (U8): the shade where things meet, made once: a soft band along each room's floor at its walls (and flat ceilings), and round
   the house at the ground. One mesh a floor, on every device, never in a tap's way */
function houseShade(H3, m3) {
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(0,0,0,0.36)"); gr.addColorStop(0.35, "rgba(0,0,0,0.13)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mk = () => { const m = reg(new THREE.MeshBasicMaterial({ color: "#000000", alphaMap: null, map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, forceSinglePass: true,
    polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -10 })); m.clippingPlanes = []; return m; };   // N193: black, so both sides one draw (either order blends the same)
  const matF = m3.shade_floor = mk(), matC = m3.shade_ceil = mk();
  const band = (pos, uv, a, b, inward, y, w, up) => {   // a quad from the edge a-b (room cm, at height y) w cm towards inward (unit [dx, dz])
    const P = [a, b, [b[0] + inward[0] * w, b[1] + inward[1] * w], [a[0] + inward[0] * w, a[1] + inward[1] * w]].map(([x, z]) => v3(x, y, z));
    const tri = up ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3], U = [[0, 1], [1, 1], [1, 0], [0, 0]];   // v 1 (the canvas's dark top) at the wall
    for (const i of tri) { pos.push(P[i].x, P[i].y, P[i].z); uv.push(U[i][0], U[i][1]); } };
  const mesh = (pos, uv, mat, into) => { if (!pos.length) return; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    const me = new THREE.Mesh(g, mat); me.raycast = () => {}; me.renderOrder = 1; me.userData.fm = Object.keys(HFLOOR).find(k => HFLOOR[k] === into); into.add(me); };   // N193: a floor's in the join
  /* V3.35: a band's strip over a stairwell's opening (model.stair_wells) keeps only its parts clear of it */
  const WL = H3.wells || { floor: [], ceil: [] };
  const clear = (holes, y, a, b, n, w) => { const ax = n[0] === 0, k = ax ? 0 : 1, c = 1 - k, lo = Math.min(a[c], a[c] + n[c] * w), hi = Math.max(a[c], a[c] + n[c] * w);
    let seg = [[Math.min(a[k], b[k]), Math.max(a[k], b[k])]];
    for (const h of holes || []) { if (Math.abs(h[4] - y) > 2) continue; const [h0, h1] = ax ? [h[0], h[1]] : [h[2], h[3]], [c0, c1] = ax ? [h[2], h[3]] : [h[0], h[1]];
      if (hi > c0 + 0.5 && lo < c1 - 0.5) seg = seg.flatMap(([s0, s1]) => [[s0, Math.min(s1, h0)], [Math.max(s0, h1), s1]]).filter(([s0, s1]) => s1 - s0 > 2); }
    const pt = v => ax ? [v, a[1]] : [a[0], v];
    return seg.map(([s0, s1]) => b[k] >= a[k] ? [pt(s0), pt(s1)] : [pt(s1), pt(s0)]); };
  const FK = { "-260": "lower", "0": "ground", "260": "first" }, per = {};
  for (const r of Object.values(H3.rooms || {})) {
    const fk = FK[String(r[4])]; if (!fk || !HFLOOR[fk]) continue;
    const [x0, x1, z0, z1, fy] = r, W = Math.min(26, (x1 - x0) / 3, (z1 - z0) / 3), P = per[fk] = per[fk] || { f: [[], []], c: [[], []] };
    const edges = [[[x0, z0], [x1, z0], [0, 1]], [[x1, z1], [x0, z1], [0, -1]], [[x0, z1], [x0, z0], [1, 0]], [[x1, z0], [x1, z1], [-1, 0]]];
    for (const [a, b, n] of edges) for (const [p, q] of clear(WL.floor, fy, a, b, n, W)) band(P.f[0], P.f[1], p, q, n, fy + 0.3, W, true);
    if (fk !== "first") for (const [a, b, n] of edges) for (const [p, q] of clear(WL.ceil, fy + (H3.ceil || 235), a, b, n, W * 0.8)) band(P.c[0], P.c[1], p, q, n, fy + (H3.ceil || 235) - 0.3, W * 0.8, false);   // flat ceilings (the first floor's: below)
  }
  for (const [fk, P] of Object.entries(per)) { mesh(P.f[0], P.f[1], matF, HFLOOR[fk]); mesh(P.c[0], P.c[1], matC, fk === "lower" ? HFLOOR.ground : HFLOOR[fk] === HFLOOR.ground ? (HFLOOR.first || HFLOOR.ground) : HFLOOR[fk]); }
  if (H3.shade_ceil && HFLOOR.first) {   // V1.39 (Next 5): the first floor's ceiling where it's flat along the walls, the back slope's crease, the dormer's sides (model.ceiling_shade)
    const pc = [], uc = [], y = 260 + (H3.ceil || 235) - 0.3;
    for (const [ax, az, bx, bz, nx, nz] of H3.shade_ceil) band(pc, uc, [ax, az], [bx, bz], [nx, nz], y, 20, false);
    mesh(pc, uc, matC, HFLOOR.roof || HFLOOR.first); }
  // round the house, on the ground: the drive's level in front, the garden's behind (the outline's outer faces, zfight.OUTER)
  const pos = [], uv = [], fr = H3.front || 527.4, bk = H3.back || -337, dr = (H3.drive ?? -15) + 0.3, lw = (H3.lawn ?? -260) + 0.3;
  band(pos, uv, [482, fr], [-28, fr], [0, 1], dr, 70, true); band(pos, uv, [-28, bk], [482, bk], [0, -1], lw, 90, true);
  mesh(pos, uv, mk(), houseG);
}
/* V2.52 (R2, N8): the shade round each standing piece's foot and up the wall beside one against it (model.piece_shade), so phones
   without AO have it; built with its floor, so it follows a moved piece. One mesh a floor, houseShade's kind (no new shader) */
function pieceShadeMat() {   // houseShade's kind of material (the same shader), its shade eased out to nothing: no edge to see
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    for (const [t, a] of [[0, 0.24], [0.15, 0.15], [0.35, 0.07], [0.6, 0.025], [1, 0]]) gr.addColorStop(t, `rgba(0,0,0,${a})`);
    g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = reg(new THREE.MeshBasicMaterial({ color: "#000000", map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -10 }));
  m.clippingPlanes = []; return m;
}
function pieceShade(F, mat) {
  const rooms = Object.values(R.HOUSE3.rooms || {}), pos = [], uv = [], U = [[0, 1], [1, 1], [1, 0], [0, 0]];   // V3.34: v 1 (the canvas's dark top: CanvasTexture flips it, as houseShade's) at the piece; it was v 0, the shade dark at its far edge, a pale square with a dark rim round every piece
  const quad = P => { for (const i of [0, 1, 2, 0, 2, 3]) { const q = v3(...P[i]); pos.push(q.x, q.y, q.z); uv.push(U[i][0], U[i][1]); } };
  for (const [, x0, z0, x1, z1, y0, h] of F.shade || []) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, g = Math.max(5, Math.min(11, Math.min(x1 - x0, z1 - z0) * 0.22)), y = y0 + 0.35, hb = Math.min(h, 210);
    const rm = rooms.filter(r => r[4] === y0 && cx >= r[0] && cx <= r[1] && cz >= r[2] && cz <= r[3]).sort((a, b) => (a[1] - a[0]) * (a[3] - a[2]) - (b[1] - b[0]) * (b[3] - b[2]))[0];
    const at = { x0: !!rm && x0 - rm[0] < 5, x1: !!rm && rm[1] - x1 < 5, z0: !!rm && z0 - rm[2] < 5, z1: !!rm && rm[3] - z1 < 5 };
    // [from, to, outward, this side, the side at its start, at its end]
    for (const [ax, az, bx, bz, nx, nz, k, ka, kb] of [[x0, z0, x1, z0, 0, -1, "z0", "x0", "x1"], [x1, z1, x0, z1, 0, 1, "z1", "x1", "x0"], [x0, z1, x0, z0, -1, 0, "x0", "z1", "z0"], [x1, z0, x1, z1, 1, 0, "x1", "z0", "z1"]]) {
      const tx = Math.sign(bx - ax), tz = Math.sign(bz - az), ea = at[ka] ? 0 : g, eb = at[kb] ? 0 : g;
      if (!at[k]) { quad([[ax, y, az], [bx, y, bz], [bx + nx * g + tx * eb, y, bz + nz * g + tz * eb], [ax + nx * g - tx * ea, y, az + nz * g - tz * ea]]); continue; }
      const wx = nx ? (nx < 0 ? rm[0] + 0.3 : rm[1] - 0.3) : 0, wz = nz ? (nz < 0 ? rm[2] + 0.3 : rm[3] - 0.3) : 0, W = (u, yy) => nx ? [wx, yy, u] : [u, yy, wz];
      const ua = nx ? az : ax, ub = nx ? bz : bx, d = Math.sign(ub - ua);   // up the wall beside each end that's open, narrowing to its top
      if (!at[ka]) quad([W(ua, y0), W(ua, y0 + hb), W(ua - d * g * 0.35, y0 + hb), W(ua - d * g, y0)]);
      if (!at[kb]) quad([W(ub, y0), W(ub, y0 + hb), W(ub + d * g * 0.35, y0 + hb), W(ub + d * g, y0)]);
    }
  }
  if (!pos.length) return null;
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, mat); me.raycast = () => {}; me.renderOrder = 1; me.name = "pieceShade"; return me;
}
/* V3.63 (N112): the shade where a room's walls meet floor, ceiling and each other (model.edge_shade): one mesh a floor, pieceShadeMat's
   shader, its own key so the cuts cut it; not drawn where GTAO draws this frame */
function edgeShadeMat() {
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);   // deeper than a piece's: a corner's shade reads across a room
    for (const [t, a] of [[0, 0.42], [0.2, 0.25], [0.45, 0.11], [0.75, 0.035], [1, 0]]) gr.addColorStop(t, `rgba(0,0,0,${a})`);
    g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = pieceShadeMat(); m.map.dispose(); m.map = tex; return m;
}
function edgeShade(F, mat) {
  const pos = [], uv = [], U = [[0, 1], [1, 1], [1, 0], [0, 0]];   // v 1 (the canvas's dark top) along the line
  for (const [ax, ay, az, bx, by, bz, vx, vy, vz, w] of F.edge || []) {
    const P = [[ax, ay, az], [bx, by, bz], [bx + vx * w, by + vy * w, bz + vz * w], [ax + vx * w, ay + vy * w, az + vz * w]];
    for (const i of [0, 1, 2, 0, 2, 3]) { const q = v3(...P[i]); pos.push(q.x, q.y, q.z); uv.push(U[i][0], U[i][1]); }
  }
  if (!pos.length) return null;
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, mat); me.raycast = () => {}; me.renderOrder = 1; me.name = "edgeShade"; let on = true;
  Object.defineProperty(me, "visible", { get: () => on && !(postLive() && aoLive()), set: v => { on = v; } });   // not drawn at all while GTAO draws
  return me;
}
/* V2.98 (N37): from outside a material's pieces on every floor one draw (the floors shown always a run); made when first wanted
   (houseJoin), dropped when a floor is built again */
let HJOIN = null;
const JOIN_FL = ["lower", "ground", "first", "roof"];
function joinBuild() {
  const by = new Map(), G = new THREE.Group(), list = [], add = me => { if (!by.has(me.material)) by.set(me.material, []); by.get(me.material).push(me); };
  for (const fk of JOIN_FL) for (const me of (HFLOOR[fk] || { children: [] }).children) if (me.userData.fm) add(me);
  /* N193: and the parts at rest (doors, lids) at their pose; one that moves leaves (joinOut) */
  for (const P of Object.values(HPARTS)) { const F = HFLOOR[P.floor]; P.joined = false; if (!F || P.tw || !JOIN_FL.includes(P.floor)) continue; F.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(F.matrixWorld).invert();
    P.g.traverseVisible(me => { if (!me.isMesh || me.material.transparent || !me.layers.isEnabled(0)) return;
      me.userData.jp = P; me.userData.jm = new THREE.Matrix4().multiplyMatrices(inv, me.matrixWorld); add(me); P.joined = true; }); }
  const fl = q => JOIN_FL.indexOf(q.userData.jp ? q.userData.jp.floor : q.userData.fm);
  for (const [m, L] of by) { if (L.length < 2) continue; L.sort((p, q) => fl(p) - fl(q));   // by floor, so the floors shown are one run
    if (L.some(q => q.geometry.attributes.uv1)) for (const q of L) if (!q.geometry.attributes.uv1) q.geometry.setAttribute("uv1", new THREE.BufferAttribute(new Uint16Array(q.geometry.attributes.position.count * 2), 2, true));   // N195: a part the bake didn't see joins at the atlas' mean texel
    const mixed = L.some(q => q.geometry.index) && L.some(q => !q.geometry.index), geos = L.map(q => { const g = mixed && q.geometry.index ? q.geometry.toNonIndexed() : q.geometry; return q.userData.jm ? (g === q.geometry ? g.clone() : g).applyMatrix4(q.userData.jm) : g; }), span = [];
    let at = 0; for (let i = 0; i < L.length; i++) { const q = geos[i], n = q.index ? q.index.count : q.attributes.position.count; span.push([JOIN_FL[fl(L[i])], at, n, L[i]]); at += n; }
    const geo = mergeGeometries(geos); geos.forEach((q, i) => { if (q !== L[i].geometry) q.dispose(); }); if (!geo) continue;
    const me = new THREE.Mesh(geo, m); me.castShadow = L[0].castShadow; me.receiveShadow = L[0].receiveShadow; me.renderOrder = L[0].renderOrder; me.raycast = L[0].raycast; me.visible = false; me.userData.span = span; G.add(me); list.push(me); }
  houseG.add(G); return (HJOIN = { G, list });
}
function joinDrop() {
  if (!HJOIN) return;
  for (const me of HJOIN.list) { me.geometry.dispose(); for (const sp of me.userData.span) sp[3].layers.enable(0); }
  houseG.remove(HJOIN.G); HJOIN = null;
}
function joinOut(P) {   // N193: a part about to move: its span in the join emptied (degenerate), its own meshes drawn
  if (!HJOIN || !P.joined) return; P.joined = false;
  for (const me of HJOIN.list) { const g = me.geometry, sp = me.userData.span;
    for (let i = sp.length - 1; i >= 0; i--) { const [, at, n, src] = sp[i]; if (src.userData.jp !== P) continue;
      if (g.index) { g.index.array.fill(g.index.array[at], at, at + n); g.index.addUpdateRange(at, n); g.index.needsUpdate = true; }
      else { const a = g.attributes.position; for (let j = at + 1; j < at + n; j++) a.array.copyWithin(3 * j, 3 * at, 3 * at + 3); a.addUpdateRange(3 * at, 3 * n); a.needsUpdate = true; }
      src.layers.enable(0); sp.splice(i, 1); } }
}
const joinSrc = h => { const sp = h.object.userData.span, i = h.faceIndex * 3; if (sp) for (const s of sp) if (i >= s[1] && i < s[1] + s[2]) return s[3]; return h.object; };   // N193: a tap on the join: the piece under it
