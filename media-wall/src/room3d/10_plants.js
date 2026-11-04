/* ---------------------------------------------------------------- v40: the plants, in HD
   Client: "more HD realistic plants". Every leaf is a shaped mesh (a grid along its outline, folded on the midrib and curled to the tip)
   with a painted texture (midrib, veins, variegation) and its own shade of green; six kinds suit the room's spots. Each group's leaves
   merge into one mesh a material and its pots into one a finish, so a shelf of plants is a handful of draw calls. */
const FLORA_KINDS = {     // outline (half-width over the length, a fraction of it), texture, roughness, cut-outs
  pothos: { w: t => 0.44 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.7) + (t < 0.1 ? 0.06 : 0), rough: 0.55 },
  snake: { w: t => 0.075 * (1 - Math.pow(t, 4)) * (0.75 + 0.25 * Math.sin(Math.PI * t)) + 0.004, rough: 0.5, rows: 12 },
  monstera: { w: t => 0.44 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8) + 0.02, rough: 0.34, cut: true },
  fern: { w: t => 0.15 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 0.01, rough: 0.7, cut: true, rows: 12 },
  spider: { w: t => 0.035 * (1 - t * t) + 0.003, rough: 0.6, rows: 12 },
  calathea: { w: t => 0.3 * Math.pow(Math.sin(Math.PI * t), 0.9) + 0.01, rough: 0.48 },
  ficus: { w: t => 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.8) + 0.01, rough: 0.3 },
};
function leafTexture(kind) {         // u across the leaf (0 and 1 its edges, 0.5 the midrib), v from stem (0) to tip (1)
  const W = 256, H = 512;
  return canvasTex(W, H, (g, w, h) => {
    const r = rnd(kind.length * 977 + 13), vy = v => h - v * h;
    const base = { pothos: ["#2f6a2c", "#4f9a3c"], snake: ["#264d2c", "#3d6b3a"], monstera: ["#1f4f24", "#2f6d2f"], fern: ["#3f7f32", "#68a84a"],
      spider: ["#3f8a3a", "#5aa24a"], calathea: ["#24502f", "#2f6a3c"], ficus: ["#1d3d22", "#2c5a2e"] }[kind];
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]);
    const cut = FLORA_KINDS[kind].cut;
    if (!cut) { g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    if (kind === "fern") {            // leaflets (pinnae) either side of the rachis, slanting towards the tip; clear between
      g.fillStyle = gr;
      for (let v = 0.04; v < 0.98; v += 0.045) for (const s of [-1, 1]) {
        g.save(); g.translate(w / 2, vy(v)); g.rotate(s * 1.05); g.beginPath(); g.ellipse(s * w * 0.24, 0, w * 0.25, h * 0.016, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
      g.fillStyle = "#5d8f3a"; g.fillRect(w / 2 - 3, 0, 6, h);
      return;
    }
    if (kind === "monstera") {        // the leaf, then the splits from the edge towards the midrib and a row of holes, cut out
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      for (let v = 0.16; v < 0.9; v += 0.1 + r() * 0.03) for (const s of [-1, 1]) {
        const x0 = s < 0 ? 0 : w, x1 = w / 2 + s * w * (0.1 + r() * 0.1), y0 = vy(v), y1 = vy(v + 0.06);
        g.beginPath(); g.moveTo(x0, y0 - h * 0.012); g.lineTo(x1, y1); g.lineTo(x0, y0 + h * 0.012); g.closePath(); g.fill();
      }
      for (let v = 0.22; v < 0.7; v += 0.12) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * w * 0.14, vy(v), w * 0.025, h * 0.02, 0, 0, Math.PI * 2); g.fill(); }
      g.globalCompositeOperation = "source-over";
    }
    // the edge a touch darker, the midrib lighter, the veins
    const eg = g.createLinearGradient(0, 0, w, 0); eg.addColorStop(0, "rgba(10,30,10,0.35)"); eg.addColorStop(0.08, "rgba(10,30,10,0)");
    eg.addColorStop(0.92, "rgba(10,30,10,0)"); eg.addColorStop(1, "rgba(10,30,10,0.35)");
    g.globalCompositeOperation = "source-atop"; g.fillStyle = eg; g.fillRect(0, 0, w, h);
    if (kind === "snake") {           // wavy bands across, and the yellow edges of a 'Laurentii'
      for (let v = 0; v < 1; v += 0.035 + r() * 0.02) { g.strokeStyle = r() < 0.5 ? "rgba(140,180,120,0.35)" : "rgba(15,40,20,0.45)"; g.lineWidth = 3 + r() * 6;
        g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, vy(v) + Math.sin(x / 30 + v * 40) * 6); g.stroke(); }
      g.fillStyle = "#d8c75a"; g.fillRect(0, 0, w * 0.1, h); g.fillRect(w * 0.9, 0, w * 0.1, h);
    }
    if (kind === "spider") { g.fillStyle = "#f1efd2"; g.fillRect(w * 0.36, 0, w * 0.28, h); g.fillStyle = "rgba(90,160,70,0.6)"; g.fillRect(w * 0.47, 0, w * 0.06, h); }
    if (kind === "calathea") {        // the feathered pale pattern along the midrib, dark between
      for (let v = 0.06; v < 0.94; v += 0.07) for (const s of [-1, 1]) { g.fillStyle = "rgba(170,205,140,0.55)";
        g.beginPath(); g.ellipse(w / 2 + s * w * 0.18, vy(v), w * 0.16, h * 0.018, s * 0.5, 0, Math.PI * 2); g.fill(); }
    }
    g.strokeStyle = kind === "spider" ? "rgba(0,0,0,0)" : "rgba(200,222,160,0.4)"; g.lineWidth = kind === "snake" ? 0 : 4;
    g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
    if (kind === "pothos" || kind === "calathea" || kind === "ficus" || kind === "monstera") {
      g.strokeStyle = "rgba(190,215,150,0.2)"; g.lineWidth = 2;
      for (let v = 0.08; v < 0.9; v += 0.11) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, vy(v)); g.quadraticCurveTo(w / 2 + s * w * 0.25, vy(v + 0.05), w / 2 + s * w * 0.46, vy(v + 0.14)); g.stroke(); }
    }
    if (kind === "pothos") {          // golden pothos: cream-yellow streaks
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(220,205,110,${0.12 + r() * 0.22})`; g.lineWidth = 3 + r() * 8; const v = r(), s = r() < 0.5 ? -1 : 1;
        g.beginPath(); g.moveTo(w / 2 + s * r() * w * 0.1, vy(v)); g.lineTo(w / 2 + s * w * (0.2 + r() * 0.3), vy(v + 0.04 + r() * 0.08)); g.stroke(); }
    }
    const sh = g.createLinearGradient(0, h, 0, 0); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.6, "rgba(255,255,240,0.05)"); sh.addColorStop(1, "rgba(255,255,240,0.12)");
    g.fillStyle = sh; g.fillRect(0, 0, w, h);    // new growth lighter towards the tip
    g.globalCompositeOperation = "source-over";
  });
}
const FLORA = new Map(), ATLAS_KINDS = ["pothos", "snake", "monstera", "fern", "spider", "calathea", "ficus"];
/* every leaf kind, the stalks and the soil share one texture (four cells by two: the kinds, then a cell half stalk grey, half soil),
   so a group's greenery is one mesh, one draw call */
let FLORA_ATLAS = null;
function floraAtlas() {
  if (FLORA_ATLAS) return FLORA_ATLAS;
  const tex = canvasTex(1024, 1024, (g, w, h) => {
    ATLAS_KINDS.forEach((k, i) => { const t = leafTexture(k); g.drawImage(t.image, (i % 4) * 256, (1 - Math.floor(i / 4)) * 512); t.dispose(); });
    g.fillStyle = "#d9d9d4"; g.fillRect(768, 256, 256, 256);                                 // the stalks (their colour is per vertex)
    g.drawImage(SOIL_TEX.image, 768, 0, 256, 256);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, alphaTest: 0.5 });
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  return FLORA_ATLAS = clipMat(reg(m));
}
function atlasUV(geo, kind) {        // a kind's (u, v) into its cell
  const uv = geo.attributes.uv, i = ATLAS_KINDS.indexOf(kind);
  for (let k = 0; k < uv.count; k++) {
    let u = uv.getX(k), v = uv.getY(k);
    if (i >= 0) { u = ((i % 4) + 0.02 + u * 0.96) / 4; v = (Math.floor(i / 4) + 0.01 + v * 0.98) / 2; }
    else if (kind === "stem") { u = 0.8 + u * 0.15; v = 0.53 + (v % 1) * 0.2; }
    else { u = 0.76 + u * 0.23; v = 0.76 + v * 0.23; }                                      // the soil
    uv.setXY(k, u, v);
  }
}
function floraMat(kind) {            // the atlas for leaves, stalks and soil; terracotta its own
  if (kind !== "terracotta") return floraAtlas();
  if (!FLORA.has(kind)) FLORA.set(kind, clipMat(reg(new THREE.MeshStandardMaterial({ map: TERRACOTTA, roughness: 0.88, color: "#ffffff" }))));
  return FLORA.get(kind);
}
const SOIL_TEX = canvasTex(128, 128, (g, w, h) => { const r = rnd(7); g.fillStyle = "#3a2a1f"; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { const c = 30 + r() * 50; g.fillStyle = `rgb(${c + 18},${c + 6},${c - 4})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(220,215,200,0.6)"; g.fillRect(r() * w, r() * h, 2, 2); } });   // a little perlite
const TERRACOTTA = canvasTex(256, 128, (g, w, h) => { const r = rnd(11); g.fillStyle = "#b8653f"; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 700; k++) { const a = r() * 0.12; g.fillStyle = r() < 0.5 ? `rgba(90,40,20,${a})` : `rgba(240,200,170,${a})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 4); }
  g.fillStyle = "rgba(235,225,205,0.25)"; for (let k = 0; k < 12; k++) g.fillRect(r() * w, h * (0.7 + r() * 0.3), 6 + r() * 30, 3 + r() * 8); });   // mineral bloom near the foot
function floraBatch(g) { return g.userData.flora || (g.userData.flora = new Map()); }
function floraAdd(B, mat, geo, col, kind) {
  if (geo.index) geo = geo.toNonIndexed();
  if (kind && !col) col = new THREE.Color(1, 1, 1);
  if (col) { const n = geo.attributes.position.count, a = new Float32Array(n * 3), uv = geo.attributes.uv, leaf = ATLAS_KINDS.includes(kind);
    for (let i = 0; i < n; i++) { const k = leaf ? 0.8 + 0.2 * uv.getY(i) : 1; a[i * 3] = col.r * k; a[i * 3 + 1] = col.g * k; a[i * 3 + 2] = col.b * k; }   // darker at the stalk
    geo.setAttribute("color", new THREE.BufferAttribute(a, 3)); }
  if (kind) atlasUV(geo, kind);
  if (!B.has(mat)) B.set(mat, []); B.get(mat).push(geo);
}
function floraFlush(g, parent = g) {     // the group's plants, merged: one mesh a material
  const B = g.userData.flora; if (!B) return;
  for (const [mat, geos] of B) {
    const keep = ["position", "normal", "uv", "color"].filter(k => geos.every(q => q.attributes[k]));
    geos.forEach(q => Object.keys(q.attributes).forEach(k => { if (!keep.includes(k)) q.deleteAttribute(k); }));
    const m = new THREE.Mesh(mergeGeometries(geos), mat); m.userData.flora = true;
    if (mat.userData.depth) m.customDepthMaterial = mat.userData.depth;
    parent.add(shadow(m)); geos.forEach(q => q.dispose());
  }
  g.userData.flora = null;
}
function leafGeo(kind, len, fold, curl, twist = 0) {   // a leaf len metres long along +y, its face +z, folded and curled
  const K = FLORA_KINDS[kind], NL = K.rows || 9, NC = 4, P = [], U = [], I = [];
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, w = K.w(t) * len;
    for (let j = 0; j <= NC; j++) {
      const s = j / NC * 2 - 1, x = s * w, z = fold * Math.abs(s) * w - curl * len * t * t, c = Math.cos(twist * t), sn = Math.sin(twist * t);
      P.push(x * c - z * sn, t * len, x * sn + z * c); U.push(0.5 + s * 0.5, t);
    }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
  geo.setIndex(I); geo.computeVertexNormals(); return geo;
}
const _fx = new THREE.Vector3(), _fz = new THREE.Vector3(), _fm = new THREE.Matrix4();
function leafAt(B, kind, pos, dir, len, r, o = {}) {   // a leaf from pos (world) pointing along dir, face up, rolled a little at random
  const Y = dir.clone().normalize(), ref = Math.abs(Y.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  _fx.crossVectors(Y, ref).normalize(); _fz.crossVectors(_fx, Y).normalize();
  const roll = o.roll ?? (r() - 0.5) * 0.7; _fx.applyAxisAngle(Y, roll); _fz.applyAxisAngle(Y, roll);
  const geo = leafGeo(kind, len, o.fold ?? 0.25, o.curl ?? 0.12, o.twist ?? 0);
  geo.applyMatrix4(_fm.makeBasis(_fx, Y, _fz).setPosition(pos));
  const tone = o.tone ?? (0.74 + r() * 0.3), hue = (r() - 0.5) * 0.06;
  floraAdd(B, floraMat(kind), geo, new THREE.Color(tone * (1 + hue), tone, tone * (1 - hue)), kind);
}
function stemAlong(B, pts, rad, col) {   // a stalk or a vine through world points
  const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, Math.max(6, pts.length * 5), rad, 5, false);
  floraAdd(B, floraMat("stem"), geo, new THREE.Color(col), "stem"); return curve;
}
const dirOf = (az, el) => new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
/* the kinds; base is the soil's centre (world), size the plant's reach in cm, spread the pot's radius in cm */
const FLORA_BUILD = {
  pothos(B, base, size, r, spread) {          // a mound of heart-shaped leaves on short stalks
    const n = 12 + Math.round(size / 1.6);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, rr = (0.2 + r() * 0.85) * spread * M, h = (1 + r() * size * 0.22) * M;   // a low mound, spilling over the rim
      const p = base.clone().add(new THREE.Vector3(Math.cos(a) * rr, h, Math.sin(a) * rr));
      stemAlong(B, [base.clone().add(new THREE.Vector3(Math.cos(a) * rr * 0.2, 0, Math.sin(a) * rr * 0.2)), p], 0.0015, "#5f7d3a");
      leafAt(B, "pothos", p, dirOf(a + (r() - 0.5) * 0.8, -0.35 + r() * 0.75), (4.5 + r() * 4) * M, r, { fold: 0.1, curl: 0.22 }); }
  },
  snake(B, base, size, r, spread) {           // upright banded blades
    const n = 5 + Math.round(r() * 4);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, rr = r() * spread * 0.45 * M;
      const p = base.clone().add(new THREE.Vector3(Math.cos(a) * rr, -0.01, Math.sin(a) * rr));
      leafAt(B, "snake", p, dirOf(a, Math.PI / 2 - 0.08 - r() * 0.22), (size * (0.6 + r() * 0.4)) * M, r, { fold: 0.35, curl: 0.02, twist: (r() - 0.5) * 1.2 }); }
  },
  monstera(B, base, size, r) {                // split leaves on long stalks, arching out
    const n = 5 + Math.round(r() * 3);
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + r() * 0.6, el = 0.55 + r() * 0.6, L = size * (0.45 + r() * 0.35) * M;
      const end = base.clone().add(dirOf(a, el).multiplyScalar(L)), mid = base.clone().add(dirOf(a, el + 0.25).multiplyScalar(L * 0.5));
      stemAlong(B, [base.clone(), mid, end], 0.0035, "#3f6b30");
      leafAt(B, "monstera", end, dirOf(a + (r() - 0.5) * 0.4, -0.1 + r() * 0.35), size * (0.32 + r() * 0.14) * M, r, { fold: 0.12, curl: 0.12 }); }
  },
  ficus(B, base, size, r) {                   // v43: a rubber plant: one upright stem, broad glossy leaves spiralling up it
    const H = size * 0.95 * M, lean = r() * Math.PI * 2, top = base.clone().add(new THREE.Vector3(Math.cos(lean) * 0.015, H, Math.sin(lean) * 0.015));
    stemAlong(B, [base.clone(), base.clone().add(new THREE.Vector3(0, H * 0.5, 0)), top], 0.004, "#5b4a32");
    const n = 9 + Math.round(size / 6);
    for (let k = 0; k < n; k++) { const t = 0.25 + 0.75 * k / (n - 1), a = k * 2.4, p = base.clone().lerp(top, t);
      const tip = p.clone().add(dirOf(a, 0.5).multiplyScalar(0.02)); stemAlong(B, [p, tip], 0.0015, "#4a5a30");
      leafAt(B, "ficus", tip, dirOf(a + (r() - 0.5) * 0.3, 0.15 + t * 0.45 + r() * 0.2), size * (0.3 - t * 0.08) * M, r, { fold: 0.08, curl: 0.1 }); }
  },
  fern(B, base, size, r) {                    // arching fronds all round
    const n = 14 + Math.round(r() * 8);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2;
      leafAt(B, "fern", base.clone().add(new THREE.Vector3(0, 0.01, 0)), dirOf(a, 0.5 + r() * 0.8), size * (0.6 + r() * 0.4) * M, r, { fold: 0.05, curl: 0.45 + r() * 0.3, roll: 0 }); }
  },
  spider(B, base, size, r) {                  // arching striped blades
    const n = 18 + Math.round(r() * 10);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2;
      leafAt(B, "spider", base.clone(), dirOf(a, 0.7 + r() * 0.7), size * (0.5 + r() * 0.5) * M, r, { fold: 0.3, curl: 0.5 + r() * 0.4, twist: (r() - 0.5) * 0.8 }); }
  },
  calathea(B, base, size, r) {                // oval patterned leaves on upright stalks
    const n = 7 + Math.round(r() * 5);
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, el = 1.0 + r() * 0.45, L = size * (0.35 + r() * 0.3) * M;
      const end = base.clone().add(dirOf(a, el).multiplyScalar(L));
      stemAlong(B, [base.clone(), end], 0.0018, "#4f6b34");
      leafAt(B, "calathea", end, dirOf(a + (r() - 0.5) * 0.3, 0.5 + r() * 0.6), size * (0.3 + r() * 0.12) * M, r, { fold: 0.15, curl: 0.06 }); }
  },
};
/* a trailing pothos vine through world points, its leaves alternating along it */
function vineAlong(B, pts, r, leafCm = 5) {
  const curve = stemAlong(B, pts, 0.0018, "#5f7d3a"), L = curve.getLength(), step = (leafCm * 0.75) * M;
  let side = 1;
  for (let d = 0.04; d < L; d += step * (0.8 + r() * 0.5)) {
    const t = d / L, p = curve.getPointAt(t), tg = curve.getTangentAt(t), out = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(side);
    const dir = out.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, -0.35 - r() * 0.4, 0)).add(tg.clone().multiplyScalar(0.3));
    leafAt(B, "pothos", p, dir, leafCm * (0.65 + r() * 0.5) * (1 - 0.35 * t) * M, r, { fold: 0.1, curl: 0.15, tone: 0.85 + r() * 0.28 }); side = -side;
  }
}
function potGeo(rad, h) {            // a turned pot (cm): a rolled rim, a slight taper, its inner lip
  const p = [[0, 0], [rad * 0.78, 0], [rad * 0.8, h * 0.04], [rad * 0.95, h * 0.82], [rad * 1.04, h * 0.84], [rad * 1.05, h], [rad * 0.94, h], [rad * 0.93, h * 0.88], [0, h * 0.88]];
  return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x * M, y * M)), 28);
}
let FLORA_STYLE = "mix", FLORA_POTS = "mine";   // Look's plant style ("mix", the plan; "lush"; "easy") and pot finish ("mine" or one for all)
const POT_FINISH = { white: ["#f1eee8", 0.25], black: ["#26262a", 0.85] };
function potFinish(k) { if (k === "terracotta") return floraMat("terracotta"); const key = "pot_" + k;
  if (!FLORA.has(key)) FLORA.set(key, clipMat(reg(new THREE.MeshStandardMaterial({ color: POT_FINISH[k][0], roughness: POT_FINISH[k][1] })))); return FLORA.get(key); }
const FLORA_SPOTS = [];              // the plan's plants (the stand, the sill, the shelf's pothos): rebuilt when the style or the pots change
function floraSpot(g, build) { FLORA_SPOTS.push({ g, build }); build(); }
function floraRebuild() {
  for (const { g, build } of FLORA_SPOTS) { [...g.children].forEach(c => { if (c.userData.flora) { g.remove(c); c.geometry.dispose(); } }); build(); }
  reshadow(); dirty();
}
function floraKind(r, big, h) {      // which kind for a pot, by its size and the style
  if (FLORA_STYLE === "easy") return big ? "snake" : r() < 0.5 ? "snake" : "pothos";
  if (big) return FLORA_STYLE === "lush" || r() < 0.6 ? "monstera" : "snake";
  const pick = r(); return h > 9 ? (pick < 0.5 ? "snake" : "calathea") : pick < 0.3 ? "fern" : pick < 0.55 ? "spider" : pick < 0.8 ? "calathea" : "pothos";
}
/* a pot at (x, y, z) room cm, rad its radius, h how tall the plant grows, trail strands over its front: the plant's kind is picked to
   suit; potM the pot's own material (its versions recolour it). Into g's batch: floraFlush(g) once the group's plants are in */
function potPlant(g, x, y, z, rad, h, trail, r, potM, leafM, o = {}) {
  const B = floraBatch(g), ph = rad * 1.5, pot = potGeo(rad, ph); pot.translate(-x * M, y * M, z * M);
  floraAdd(B, FLORA_POTS !== "mine" ? potFinish(FLORA_POTS) : o.terracotta ? floraMat("terracotta") : potM, pot);
  const soil = new THREE.CircleGeometry(rad * 0.93 * M, 20); soil.rotateX(-Math.PI / 2); soil.translate(-x * M, (y + ph * 0.86) * M, z * M); floraAdd(B, floraMat("soil"), soil, null, "soil");
  const base = v3(x, y + ph * 0.86, z), lush = FLORA_STYLE === "lush" ? 1.25 : 1;
  const kind = o.kind || (trail > 0 ? "pothos" : floraKind(r, rad >= 9 || h >= 20, h));
  FLORA_BUILD[kind](B, base, Math.max(10, h * 2.2) * lush, r, rad);
  for (let s = 0; s < Math.round(trail * lush); s++) {
    const a = (r() - 0.5) * 2.2 + (o.trailAz ?? Math.PI / 2), len = 14 + r() * 24 * lush, ex = x + Math.cos(a) * rad * 1.05, ez = z + Math.sin(a) * rad * 1.05;
    const pts = [v3(x + Math.cos(a) * rad * 0.4, y + ph + 1, z + Math.sin(a) * rad * 0.4), v3(ex, y + ph + 1.5, ez)];
    let fx = ex, fz = ez, fy = y + ph;
    if (o.edgeZ !== undefined) { fx = ex + (r() - 0.5) * 4; fz = o.edgeZ + 1.2; fy = y + 0.5; pts.push(v3((ex + fx) / 2, y + ph * 0.5 + 1, (ez + fz) / 2), v3(fx, fy + 0.8, fz)); }   // over the shelf's front, then down
    for (let j = 1; j <= 4; j++) pts.push(v3(fx + Math.cos(a) * j * 0.6 + Math.sin(j + s) * 1.2, fy - len * j / 4, fz + (o.edgeZ !== undefined ? 0.6 * j : Math.sin(a) * j * 0.9)));
    vineAlong(B, pts, r);
  }
  if (!g.userData.floraHold) floraFlush(g);
}

/* v43, client: "we have taller ones in the middle, spider plants on the right and some smaller ones on left" (the window sill, from the
   room). The room's x runs right to left as you face the window, so the spider plants are at the low-x end; no pot stands behind a
   rear speaker. */
const SILL_ROW = [   // [from the sill's low-x end (cm), radius, how tall it grows, kind, strands over the nose]
  [12, 7, 12, "spider", 0], [36, 7.5, 13, "spider", 0], [60, 7, 12, "spider", 0],      // on the right: spider plants, full
  [92, 7.5, 18, "snake", 0], [122, 8, 20, "ficus", 0],                                 // in the middle: the tall ones
  [160, 5, 6, "calathea", 0], [210, 5, 5, "fern", 0], [226, 5.5, 5, "pothos", 2],     // on the left: the smaller ones
];
function sillPlants(x0, x1, y, zBack, zFront) {
  const potCols = ["#d8cfc0", "#b5643f", "#2f2f2f", "#e9e4da", "#8a9a7b"], potMs = potCols.map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: c === "#e9e4da" ? 0.3 : 0.7 })));
  const g = new THREE.Group(); g.name = "sillplants"; shell.add(g);
  const clear = x => !(R.REAR_SPOTS || []).some(([sx, sz]) => Math.abs(sx - x) < 14 && sz > zBack - 5);   // keep clear of the rear speakers
  floraSpot(g, () => {
    const r = rnd(29), hold = { userData: { floraHold: true } }, zc = (zBack + zFront) / 2;
    SILL_ROW.forEach(([dx, rad, h, kind, trail], i) => {
      let x = Math.min(x1 - rad - 2, x0 + dx); while (!clear(x) && x > x0 + rad) x -= 4;
      potPlant(hold, x, y, zc + (r() - 0.5) * 3, rad, h, trail, r, potMs[i % potMs.length], null, { terracotta: i % potMs.length === 1, edgeZ: zFront, kind });
    });
    floraFlush(hold, g); });
}

