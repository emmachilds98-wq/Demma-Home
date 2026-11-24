/* world-sized UVs (metres over the texture's size), by the face's direction: floors and roofs from above, walls from the side; roof
   slopes measured along the slope (35°) so the tile rows keep their gauge */
/* V1.3: the gardens' plants (survey_data.PLANTS). A cordyline: a trunk forking into heads of long narrow leaves, the old ones arching
   down; one merged mesh for the trunks, one for the leaves */
function buildPlants(grp) {
  const PL = (R.HOUSE3 && R.HOUSE3.plants) || []; if (!PL.length || !grp) return;
  const bark = reg(new THREE.MeshStandardMaterial({ map: barkTex("cordy"), roughness: 0.95 })), leaf = reg(new THREE.MeshStandardMaterial({ color: "#5b7a38", vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }));   // N173: its corky bark; each leaf its own green
  bark.clippingPlanes = []; leaf.clippingPlanes = [];
  let sd = 4242, s2 = 4243; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, rn2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  const Y = new THREE.Vector3(0, 1, 0);
  buildTrees(grp, PL.filter(P => P.kind !== "cordyline"));                        // V1.4: the far end's trees
  for (const P of PL.filter(P => P.kind === "cordyline")) {
    const trunks = [], leaves = [], base = v3(P.x, P.y, P.z);
    const seg = (a, b, r0, r1) => { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, 8, 1, true);
      barkUV(g, L); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())); g.translate(a.x, a.y, a.z); trunks.push(g); };
    const strip = (o, yaw, pitch, len) => {   // a leaf: five segments bending down as it goes, tapering to a point
      const pos = [], col = [], idx = [], side = new THREE.Vector3(Math.cos(yaw + Math.PI / 2), 0, Math.sin(yaw + Math.PI / 2)), wd = 0.022;
      let p = o.clone(), a = pitch; const old = Math.max(0, Math.min(1, -pitch * 1.4)), lt = 0.78 + rn2() * 0.3;   // N173: the old hanging leaves olive and darker, the young ones up fresher; paler at the stalk
      for (let i = 0; i <= 5; i++) { const w = wd * (1 - i / 5.5), k = lt * (1.12 - i * 0.05) * (1 - old * 0.22); pos.push(p.x - side.x * w, p.y, p.z - side.z * w, p.x + side.x * w, p.y, p.z + side.z * w);
        for (let e = 0; e < 2; e++) col.push(k * (1 + old * 0.18), k, k * (1 - old * 0.25));
        if (i < 5) { const st = len / 5; p = p.clone().add(new THREE.Vector3(Math.cos(yaw) * Math.cos(a) * st, Math.sin(a) * st, Math.sin(yaw) * Math.cos(a) * st)); a -= 0.16 + (1 - Math.max(0, pitch)) * 0.08; } }
      for (let i = 0; i < 5; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); leaves.push(g.toNonIndexed()); };
    const fork = base.clone().add(new THREE.Vector3(0, P.fork * M, 0));
    seg(base, fork, P.r * M, P.r * 0.8 * M);
    for (let k = 0; k < P.heads; k++) {
      const ang = (k + rnd() * 0.5) / P.heads * Math.PI * 2, out = P.spread / 2 * M * (0.22 + rnd() * 0.16), up = (P.h - P.fork - P.leaf * 0.6) * M * (0.7 + rnd() * 0.3);   // short, stout branches
      const top = fork.clone().add(new THREE.Vector3(Math.cos(ang) * out, up, Math.sin(ang) * out));
      seg(fork, top, P.r * 0.75 * M, P.r * 0.55 * M);
      for (let j = 0; j < 110; j++) strip(top, rnd() * Math.PI * 2, -0.9 + rnd() * 2.3, P.leaf * M * (0.6 + rnd() * 0.4));   // a full head, the old leaves hanging
    }
    const tm = new THREE.Mesh(mergeGeometries(trunks.map(g => g.index ? g.toNonIndexed() : g)), bark), lm = new THREE.Mesh(mergeGeometries(leaves), leaf);
    for (const m of [tm, lm]) { m.castShadow = true; m.receiveShadow = true; m.raycast = () => {}; grp.add(m); }
  }
}
/* V1.4: the far end's trees (survey_data.PLANTS): pale stems with an airy crown, and a conifer; leaves drawn sprays on cards (alpha cut),
   one instanced mesh a kind */
const SPRAY = {};
/* N173: bark, drawn here: the cordyline's corky grey-brown with its rings of old leaf scars; the pale stems' smooth bark with dark
   lenticels across; the conifer's fissured brown. u round the stem, v up it, a tile 40 cm tall (barkUV) */
function barkTex(k) {
  if (SPRAY["b" + k]) return SPRAY["b" + k];
  let sd = 31 + k.length; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const [bg, dk, lt] = { cordy: ["#857a6c", "#5e5448", "#a39785"], pale: ["#b3ada3", "#4a4540", "#cfc9bf"], dark: ["#5b4b3d", "#3a2f26", "#74604d"] }[k];
  return (SPRAY["b" + k] = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = rnd() < 0.5 ? dk : lt; g.globalAlpha = 0.08 + rnd() * 0.12; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 4 + rnd() * 26); }   // the grain up the stem
    g.globalAlpha = 1;
    if (k === "cordy") for (let y = 4; y < h; y += 9 + rnd() * 8) { g.strokeStyle = dk; g.globalAlpha = 0.35 + rnd() * 0.25; g.lineWidth = 1.5 + rnd() * 1.5;   // the old leaves' scars, ringing it
      g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + (rnd() - 0.5) * 3); g.stroke(); }
    if (k === "pale") for (let i = 0; i < 46; i++) { g.fillStyle = dk; g.globalAlpha = 0.35 + rnd() * 0.4; const x = rnd() * w, y = rnd() * h; g.fillRect(x, y, 4 + rnd() * 18, 1 + rnd() * 2.5); }   // lenticels across
    if (k === "dark") for (let i = 0; i < 14; i++) { g.strokeStyle = dk; g.globalAlpha = 0.6; g.lineWidth = 1 + rnd() * 2.5; let x = rnd() * w;   // fissures up it
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 12) g.lineTo((x += (rnd() - 0.5) * 6), y); g.stroke(); }
    g.globalAlpha = 1; }));
}
function barkUV(g, L) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L / 0.4); }
/* N173: each leaf card's own shade: darker and cooler inside a head (the shade in a crown), warmer and lighter at its sunny outside,
   a little lighter up the tree; a second random stream so the trees keep their shape */
let TINT_SD = 6151;
function leafTint(depth, up, c = new THREE.Color()) {
  const r = (TINT_SD = (TINT_SD * 16807) % 2147483647) / 2147483647, d = Math.pow(Math.min(1, Math.max(0, depth)), 0.8), l = (0.48 + 0.56 * d) * (0.84 + 0.16 * up) * (0.92 + r * 0.16);
  return c.setRGB(Math.min(1.1, l * (0.92 + 0.1 * d)), Math.min(1.1, l * (0.97 + 0.04 * d)), l * (1.02 - 0.12 * d));
}
function sprayTex(k) {
  if (SPRAY[k]) return SPRAY[k];
  let sd = 77 + k.length; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const cols = { leaf: ["#5d7f35", "#4f7130", "#6b8c3c", "#45652b", "#789a45"], dark: ["#2f4d27", "#3a5a2c", "#28421f", "#456634"], needle: ["#2c4a26", "#36552c", "#22391d", "#3f5f31"], red: ["#8e2a1e", "#a8442a", "#5d6b33", "#4c5a2a", "#b5513a"] }[k];
  return (SPRAY[k] = canvasTex(256, 256, (g, w, h) => {
    if (k === "needle") {                                      // fronds: a stalk with short needles both sides
      for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, L = w * (0.25 + rnd() * 0.2), x0 = w / 2 + Math.cos(a) * w * 0.06, y0 = h / 2 + Math.sin(a) * h * 0.06;
        g.strokeStyle = cols[i % cols.length]; g.lineWidth = 3;
        for (let t = 0; t < 1; t += 0.06) { const x = x0 + Math.cos(a) * L * t, y = y0 + Math.sin(a) * L * t, n = 14 * (1 - t * 0.6);
          for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + sg * 0.9) * n, y + Math.sin(a + sg * 0.9) * n); g.stroke(); } } }
      return; }
    /* V3.59 (N114): a darker core of overlapping rounds, then leaves over it nearer the middle, so a crown reads as masses of leaf */
    const deep = { leaf: "#3d5a26", dark: "#22381c", red: "#4a2a1c" }[k];
    g.fillStyle = deep; for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * w * 0.17; g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, w * (0.1 + rnd() * 0.07), 0, 7); g.fill(); }
    for (let i = 0; i < 70; i++) {                             // leaves round the spray's middle, each a pointed oval with its midrib
      const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 0.7) * w * 0.34, x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r, L = w * (0.08 + rnd() * 0.05);
      g.save(); g.translate(x, y); g.rotate(rnd() * Math.PI * 2); g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * 0.42, L, 0); g.quadraticCurveTo(0, L * 0.42, -L, 0); g.fill();
      g.strokeStyle = "rgba(20,35,10,0.35)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke(); g.restore(); }
  }));
}
function buildTrees(grp, list) {
  if (!list.length) return;
  let sd = 9157; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const Y = new THREE.Vector3(0, 1, 0), stems = { pale: [], dark: [] }, cards = { leaf: [], dark: [], needle: [], red: [] };
  const seg = (to, a, b, r0, r1) => { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, 7, 1, true);
    barkUV(g, L); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())); g.translate(a.x, a.y, a.z); to.push(g.toNonIndexed()); };
  for (const P of list) {
    const base = v3(P.x, P.y, P.z), H = P.h * M, S = P.spread * M / 2, card = (P.leaf || 60) * M;
    if (P.kind === "conifer") {                                // the trunk to near the top, the fronds in a column narrowing upwards
      seg(stems.dark, base, base.clone().add(new THREE.Vector3(0, H * 0.95, 0)), P.r * M, P.r * 0.15 * M);
      for (let i = 0; i < 2200; i++) { const t = Math.pow(rnd(), 0.85), a = rnd() * Math.PI * 2, rr = S * Math.pow(1 - t, 0.8) * (0.45 + 0.55 * Math.sqrt(rnd()));
        cards.needle.push([base.x + Math.cos(a) * rr, base.y + H * (0.05 + 0.95 * t), base.z + Math.sin(a) * rr, card * (0.7 + rnd() * 0.5), leafTint(rr / Math.max(0.05, S * Math.pow(1 - t, 0.8)), t)]); }
      continue;
    }
    const ends = [];                                           // stems leaning out from one foot, each with branches up its top half
    for (let k = 0; k < (P.stems || 1); k++) {
      const a = (k + rnd() * 0.6) / (P.stems || 1) * Math.PI * 2, lean = S * 0.2 * (0.5 + rnd() * 0.5), r = P.r * M * (0.75 + rnd() * 0.4);
      const foot = base.clone().add(new THREE.Vector3(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12));
      const top = foot.clone().add(new THREE.Vector3(Math.cos(a) * lean, H * (0.84 + rnd() * 0.12), Math.sin(a) * lean));
      const mid = foot.clone().lerp(top, 0.5).add(new THREE.Vector3((rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3));
      seg(stems.pale, foot, mid, r, r * 0.7); seg(stems.pale, mid, top, r * 0.7, r * 0.2); ends.push(top);
      for (let j = 0; j < 7; j++) { const t = 0.42 + j * 0.075, s0 = t < 0.5 ? foot.clone().lerp(mid, t * 2) : mid.clone().lerp(top, (t - 0.5) * 2);
        const b = a + (rnd() - 0.5) * 2.6, L = S * (0.7 - j * 0.06) * (0.7 + rnd() * 0.4), e = s0.clone().add(new THREE.Vector3(Math.cos(b) * L, L * (0.45 + rnd() * 0.5), Math.sin(b) * L));
        seg(stems.pale, s0, e, r * 0.32 * (1 - t * 0.5), r * 0.07); ends.push(e); }
    }
    const per = Math.round((P.cards || 1400) * 0.45 / ends.length), to = cards[P.tone || (P.dark ? "dark" : "leaf")];   // V2.89 (N30): the red-tipped shrubs
    for (const e of ends) for (let i = 0; i < per; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * S * 0.4, q = Math.sqrt(1 - u * u);
      to.push([e.x + Math.cos(a) * q * rr, e.y + u * rr * 0.65, e.z + Math.sin(a) * q * rr, card * 1.5 * (0.7 + rnd() * 0.6), leafTint(rr / (S * 0.4) * (0.75 + 0.25 * u), (e.y - base.y) / H)]); }   // V3.59 (N114): fewer, larger clumps
  }
  for (const [k, list2] of Object.entries(stems)) if (list2.length) {
    const m = new THREE.Mesh(mergeGeometries(list2), reg(new THREE.MeshStandardMaterial({ map: barkTex(k), roughness: 0.95 })));   // N173: their bark
    m.material.clippingPlanes = []; m.castShadow = m.receiveShadow = true; m.raycast = () => {}; grp.add(m); }
  const o = new THREE.Object3D(), plane = new THREE.PlaneGeometry(1, 1);
  for (const [k, list2] of Object.entries(cards)) if (list2.length) {
    const mt = reg(new THREE.MeshStandardMaterial({ map: sprayTex(k), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 })); mt.clippingPlanes = [];
    const im = new THREE.InstancedMesh(plane, mt, list2.length);
    list2.forEach(([x, y, z, sz, c], i) => { o.position.set(x, y, z); o.rotation.set((rnd() - 0.5) * 1.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.6); o.scale.setScalar(sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c); });
    im.castShadow = im.receiveShadow = true; im.raycast = () => {}; grp.add(im); }
}
/* V1.4: past the far fence (survey_data.BEYOND): the low building with sheet roofs (with Gardens) and the hill opposite with its houses
   (with the land), hazy with distance */
function buildBeyond(grp, land) {
  const B = R.HOUSE3 && R.HOUSE3.beyond; if (!B) return;
  if (grp && B.building) {
    const W = B.building, [xa, xb] = W.x, [za, zb] = W.z, n = W.bays || 1, d = (za - zb) / n;
    const wall = reg(new THREE.MeshStandardMaterial({ color: "#8e938b", roughness: 0.9 })), sheet = sheetTex(), trim = reg(new THREE.MeshStandardMaterial({ color: "#b9bab4", roughness: 0.8 }));   // grey-green cladding, a pale fascia
    const roof = reg(new THREE.MeshStandardMaterial({ color: "#ffffff", map: sheet, roughness: 0.7, side: THREE.DoubleSide })); wall.clippingPlanes = []; roof.clippingPlanes = [];
    const bx = new THREE.Mesh(new THREE.BoxGeometry((xb - xa) * M, (W.eave - W.y0) * M, (za - zb) * M), wall);
    bx.position.copy(v3((xa + xb) / 2, (W.y0 + W.eave) / 2, (za + zb) / 2)); bx.castShadow = bx.receiveShadow = true; grp.add(bx);
    const fa = new THREE.Mesh(new THREE.BoxGeometry((xb - xa + 20) * M, 0.2, (za - zb + 20) * M), trim); fa.position.copy(v3((xa + xb) / 2, W.eave - 10, (za + zb) / 2)); grp.add(fa);   wall.clippingPlanes = trim.clippingPlanes = [];
    for (let i = 0; i < n; i++) {                               // each bay a shallow ridge across, the gables at the ends
      const z0 = za - i * d, z1 = z0 - d, sh = new THREE.Shape([new THREE.Vector2(z0 * M, W.eave * M), new THREE.Vector2((z0 + z1) / 2 * M, W.ridge * M), new THREE.Vector2(z1 * M, W.eave * M)]);
      const g = new THREE.ExtrudeGeometry(sh, { depth: (xb - xa) * M, bevelEnabled: false });
      g.rotateY(-Math.PI / 2); g.translate(-xa * M, 0, 0);    // the profile's x becomes z; extruded along the world's -x, from xa to xb (x flips)
      const uv = g.attributes.uv, P = g.attributes.position; for (let j = 0; j < P.count; j++) uv.setXY(j, P.getX(j) / 0.9, P.getZ(j) / 2);   // the sheets' ribs 90 apart
      const m = new THREE.Mesh(g, roof); m.castShadow = m.receiveShadow = true; grp.add(m); }
  }
  if (land && B.hill) {
    const Hh = B.hill, NA = 72, NR = 14, pos = [], uv = [], idx = [], [a0, a1] = Hh.a, T = Hh.top;
    const top = a => { for (let i = 1; i < T.length; i++) if (a <= T[i][0]) { const [p, q] = [T[i - 1], T[i]], t = (a - p[0]) / (q[0] - p[0]); return p[1] + (q[1] - p[1]) * t; } return T[T.length - 1][1]; };
    const ss = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) {
      const a = a0 + (a1 - a0) * i / NA, r = Hh.r0 + (Hh.r2 - Hh.r0) * j / NR, rad = a * Math.PI / 180;
      const rise = r < Hh.r1 ? ss(Hh.r0, Hh.r1, r) : 1 - 0.2 * ss(Hh.r1, Hh.r2, r), ends = ss(a0, a0 + 12, a) * ss(a1, a1 - 12, a);
      const y = Hh.base - 60 + (top(a) + 60) * rise * ends;   // its foot just under the ground, so the land meets it without a seam
      const p = v3(Hh.cx + Math.sin(rad) * r, y, Hh.cz - Math.cos(rad) * r); pos.push(p.x, p.y, p.z);
      uv.push(rad * r / 20000, (r + y * 4) / 16000); }      // the houses along the hill (a tile 200 m across), up its face
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const k = j * (NA + 1) + i; idx.push(k, k + 1, k + NA + 1, k + 1, k + NA + 2, k + NA + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const mt = reg(new THREE.MeshStandardMaterial({ map: townTex(), roughness: 1, side: THREE.DoubleSide })); mt.clippingPlanes = [];
    const m = new THREE.Mesh(g, mt); m.raycast = () => {}; m.name = "hill"; land.add(m);
  }
  if (land && B.trees) {                                        // the valley's trees between: clumps of big leaf cards, no trunks (too far to see)
    const Tr = B.trees, C = B.hill || { cx: 233, cz: -339 }, o = new THREE.Object3D(), list = { leaf: [], dark: [] };
    let sd = 2024; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < Tr.n; i++) {
      const a = (Tr.a[0] + (Tr.a[1] - Tr.a[0]) * rnd()) * Math.PI / 180, r = Tr.r[0] + (Tr.r[1] - Tr.r[0]) * rnd(), h = Tr.h[0] + (Tr.h[1] - Tr.h[0]) * rnd();
      const cx = C.cx + Math.sin(a) * r, cz = C.cz - Math.cos(a) * r, to = rnd() < 0.35 ? list.dark : list.leaf;
      for (let k = 0; k < 12; k++) { const u = rnd() * 2 - 1, b = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * h * 0.38, q = Math.sqrt(1 - u * u);   // V3.59 (N114): 12 larger clumps a tree (were 26 small)
        to.push([v3(cx + Math.cos(b) * q * rr, (B.hill ? B.hill.base : -262) + h * 0.62 + u * rr * 0.7, cz + Math.sin(b) * q * rr), leafTint(rr / (h * 0.38) * (0.75 + 0.25 * u), 0.5 + u * 0.5)]); } }
    const plane = new THREE.PlaneGeometry(1, 1);
    for (const [k, pts] of Object.entries(list)) {
      const mt = reg(new THREE.MeshStandardMaterial({ map: sprayTex(k), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 })); mt.clippingPlanes = [];
      const im = new THREE.InstancedMesh(plane, mt, pts.length);
      pts.forEach(([p, c], i) => { o.position.copy(p); im.setColorAt(i, c); o.rotation.set((rnd() - 0.5) * 1.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.2); o.scale.setScalar(3.6 + rnd() * 2.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.raycast = () => {}; land.add(im); }
  }
}
/* V3.44 (N81): out of the front rooms' windows a stand-in street (not the real one: no address, no photo): the road and pavements, a
   row of brick terraces opposite. One draw a finish, each on the ground's own shader (no shader of its own) */
function buildStreet(land) {
  const H = R.HOUSE3; if (!land || !H || H.front == null || !FIN.mat3) return false;
  const dr = H.drive ?? -15, zf = H.front, zr0 = zf + 750, zr1 = zf + 1250, zp = zr1 + 200, zF = zp + 550, DEP = 800, EAVE = dr + 520, RIDGE = dr + 790;
  const X0 = -4200, X1 = 5600, by = {}, put = (k, g) => (by[k] = by[k] || []).push(g);
  const box = (k, x0, y0, z0, x1, y1, z1) => { const g = new THREE.BoxGeometry(Math.abs(x1 - x0) * M, Math.abs(y1 - y0) * M, Math.abs(z1 - z0) * M);
    const c = v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.translate(c.x, c.y, c.z); put(k, g); };
  const tri = (k, pts, out) => {   // a flat face from house points (a triangle or a quad), its normal the way of out (house x, y, z)
    const P = pts.map(p => v3(...p)), n = new THREE.Vector3().subVectors(P[1], P[0]).cross(new THREE.Vector3().subVectors(P[2], P[0])).normalize(), o = v3(...out).normalize();
    if (n.dot(o) < 0) n.negate();
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P.flatMap(p => [p.x, p.y, p.z]), 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(P.flatMap(() => [n.x, n.y, n.z]), 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(P.flatMap(() => [0, 0]), 2));
    g.setIndex(P.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]); put(k, g); };
  let sd = 4517; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  // the road and our side's pavement on past our plot, the kerbs, the far pavement
  box("road", X0, dr - 6, zr0, X1, dr - 2, zr1);
  box("paving", X0, dr - 6, zf + 550, X1, dr + 1, zr0); box("paving", X0, dr - 6, zr1, X1, dr + 1, zp);
  box("kerb", X0, dr - 6, zr0 - 15, X1, dr + 2, zr0); box("kerb", X0, dr - 6, zr1, X1, dr + 2, zr1 + 15);
  // across the road: terraces of four, each house 500 wide, a gap between the blocks
  for (let b0 = X0 + 200; b0 + 2000 <= X1; b0 += 2450) {
    const b1 = b0 + 2000, brick = rnd() < 0.5 ? "brick" : "brick2";
    box(brick, b0, dr - 6, zF, b1, EAVE, zF + DEP);
    for (const x of [b0, b1]) tri(brick, [[x, EAVE, zF], [x, RIDGE, zF + DEP / 2], [x, EAVE, zF + DEP]], [x === b0 ? -1 : 1, 0, 0]);   // the gables
    const yE = EAVE - 12, zA = zF - 30, zB = zF + DEP + 30, xa = b0 - 15, xb = b1 + 15;
    tri("roof", [[xa, yE, zA], [xb, yE, zA], [xb, RIDGE, zF + DEP / 2], [xa, RIDGE, zF + DEP / 2]], [0, 1, -1]);
    tri("roof", [[xa, yE, zB], [xb, yE, zB], [xb, RIDGE, zF + DEP / 2], [xa, RIDGE, zF + DEP / 2]], [0, 1, 1]);
    box("frame", xa, yE - 18, zA - 2, xb, yE + 4, zA + 6);                                                       // the fascia and gutter
    for (let i = 0; i < 4; i++) {
      const a = b0 + i * 500, flip = i % 2 === 1, X = u => flip ? a + 500 - u : a + u;   // pairs mirrored: doors side by side
      if (i > 0 && i % 2 === 0) box(brick, a - 30, RIDGE - 40, zF + DEP / 2 - 45, a + 30, RIDGE + 110, zF + DEP / 2 + 45);   // a chimney on the party wall
      const win = (u0, u1, y0, y1) => { const x0 = Math.min(X(u0), X(u1)), x1 = Math.max(X(u0), X(u1));
        box("frame", x0, y0, zF - 5, x1, y1, zF); box(Math.abs(Math.round(x0 * 7 + y0 * 13)) % 3 === 0 ? "panelit" : "pane", x0 + 7, y0 + 7, zF - 6, x1 - 7, y1 - 7, zF - 5);   // V3.59: a third lit by evening (by place, so rnd()'s doors and hedges stay as they were)
        const m = (x0 + x1) / 2; box("frame", m - 3, y0, zF - 8, m + 3, y1, zF - 5);
        box("kerb", x0 - 6, y0 - 7, zF - 10, x1 + 6, y0, zF); };
      win(60, 250, dr + 90, dr + 215); win(60, 250, dr + 330, dr + 450); win(320, 450, dr + 330, dr + 450);
      const d0 = Math.min(X(345), X(440)), d1 = Math.max(X(345), X(440));
      box(rnd() < 0.5 ? "door" : "door2", d0, dr, zF - 4, d1, dr + 205, zF); box("frame", d0 - 6, dr, zF - 5, d1 + 6, dr + 211, zF - 3);
      box("frame", d0 - 25, dr + 225, zF - 70, d1 + 25, dr + 233, zF);                                            // the canopy over the door
      box("kerb", d0 - 10, dr - 6, zp, d1 + 10, dr + 1, zF);                                                      // the path
      const w0 = Math.min(X(0), X(320)), w1 = Math.max(X(0), X(320)), hedge = rnd() < 0.4;                     // the garden's wall or hedge
      if (hedge) box("hedge", w0 + 10, dr - 2, zp + 15, w1 - 10, dr + 95, zp + 70); else { box(brick, w0, dr - 2, zp, w1, dr + 55, zp + 23); box("kerb", w0 - 2, dr + 55, zp - 2, w1 + 2, dr + 61, zp + 25); }
    }
  }
  /* N271 (the review: the street had no cars, markings, trees or bins): generic ones, nothing from the real street. The centre line's
     dashes; cars parked along both kerbs (not across our drive), a body, its glass cabin and four wheels; trees in the far pavement
     between the lamp posts; a wheelie bin in each front garden opposite */
  const zc = (zr0 + zr1) / 2;
  for (let x = X0; x < X1; x += 900) box("line", x, dr - 2, zc - 5, x + 400, dr - 1.4, zc + 5);
  const car = (x, z, dir) => { const L = 400 + rnd() * 60, W = 176, c = "car" + Math.floor(rnd() * 4), y = dr - 2, z0 = z - W / 2, z1 = z + W / 2, xa = x, xb = x + L;
    box(c, xa, y + 22, z0, xb, y + 82, z1);                                                         // the body, the bonnet and boot under the cabin
    const f = dir > 0 ? [xa + 0.28 * L, xb - 0.38 * L] : [xa + 0.38 * L, xb - 0.28 * L];
    box("glass", f[0], y + 82, z0 + 8, f[1], y + 136, z1 - 8); box(c, f[0] + 6, y + 136, z0 + 10, f[1] - 6, y + 141, z1 - 10);   // the cabin, its roof
    for (const wx of [xa + 0.17 * L, xb - 0.17 * L]) for (const wz of [z0 + 2, z1 - 24]) box("tyre", wx - 32, y, wz, wx + 32, y + 62, wz + 22); };
  for (let x = X0 + 300; x < X1 - 500; x += 700 + rnd() * 900) { if (x > -700 && x < 700) continue; car(x, zr0 + 110, 1); }
  for (let x = X0 + 600; x < X1 - 500; x += 800 + rnd() * 1000) car(x, zr1 - 110, -1);
  for (let x = X0 + 2400; x < X1; x += 3000) {                                                       // the street trees, a tree pit each
    const h = 340 + rnd() * 120, r = 150 + rnd() * 60, t = new THREE.CylinderGeometry(11 * M, 15 * M, h * M, 8), c = v3(x, dr + h / 2, zr1 + 110);
    t.translate(c.x, c.y, c.z); put("trunk", t); box("kerb", x - 50, dr + 1, zr1 + 60, x + 50, dr + 2.5, zr1 + 160);
    for (let k = 0; k < 3; k++) { const g = new THREE.IcosahedronGeometry(r * (0.7 + rnd() * 0.3) * M, 1), q = v3(x + (rnd() - 0.5) * r, dr + h + r * (0.2 + rnd() * 0.5), zr1 + 110 + (rnd() - 0.5) * r); g.translate(q.x, q.y, q.z); put("crown", g); } }
  for (let b0 = X0 + 200; b0 + 2000 <= X1; b0 += 2450) for (let i = 0; i < 4; i++) {               // the bins, by each house's path
    const x = b0 + i * 500 + (i % 2 ? 140 : 300); box(rnd() < 0.6 ? "wbin" : "wbin2", x, dr, zF - 140, x + 58, dr + 107, zF - 66); }
  for (let x = X0 + 900; x < X1; x += 3000) {   // lamp posts on the far pavement
    box("post", x - 6, dr, zr1 + 45, x + 6, dr + 620, zr1 + 57); box("post", x - 5, dr + 608, zr1 - 60, x + 5, dr + 618, zr1 + 57); box("lamp", x - 14, dr + 596, zr1 - 75, x + 14, dr + 608, zr1 - 30); }
  /* each finish a copy of the house's own material (tinted where said, uncut): its program already built */
  const FIN_ = { road: ["road"], paving: ["paving"], kerb: ["concrete"], brick: ["brick"], brick2: ["brick_buff"], roof: ["tile"], frame: ["upvc"], pane: ["pane"], panelit: ["pane"],
    door: ["door_out", "#3c4a5c"], door2: ["door_out", "#6b2a2a"], hedge: ["ivy"], post: ["steel_dark"], lamp: ["upvc", "#fff3dd"],
    line: ["upvc", "#e9e7df"], car0: ["upvc", "#2d3e5c"], car1: ["upvc", "#9ea3a8"], car2: ["upvc", "#7a1f22"], car3: ["upvc", "#1e1f22"], glass: ["pane"], tyre: ["bin"],
    trunk: ["timber", "#5e5246"], crown: ["ivy", "#4f6b3a"], wbin: ["bin"], wbin2: ["recycle"] };   // N271
  const g = new THREE.Group(); g.name = "street";
  for (const [k, L] of Object.entries(by)) {
    const [hk, col] = FIN_[k], src = FIN.mat3(hk), geo = mergeGeometries(L); L.forEach(q => q.dispose());
    worldUV(geo, hk);
    const mt = reg(src.clone()); mt.onBeforeCompile = src.onBeforeCompile; mt.customProgramCacheKey = src.customProgramCacheKey; mt.userData = { street: k };
    if (col) mt.color.set(col); houseClip(mt, [], false);
    const glow = { lamp: [5, "#ffc77a"], panelit: [3, "#ffbf7a"] }[k];   // V3.59: lit by evening (09 streetTod): the lamps' sodium-warm heads, curtained rooms behind the panes
    if (glow) { mt.userData.glow = glow[0]; mt.userData.glowCol = glow[1]; STREET_LIT.push(mt); } if (k === "road") { mt.polygonOffset = true; mt.polygonOffsetFactor = 2; mt.polygonOffsetUnits = 2; }
    const m = new THREE.Mesh(geo, mt); m.receiveShadow = true; m.raycast = () => {}; m.name = "street_" + k; g.add(m); }
  land.add(g); streetTod(); return true;
}
/* V1.6: the gardens' things (survey_data.GARDEN_THINGS): ours with Gardens, next door's with Next door; and next door's lawns and
   fences for the living room's window */
function thingMat(c, o) { const m = reg(new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}))); m.clippingPlanes = []; return m; }
function buildThings(grp, own) {
  const L = ((R.HOUSE3 && R.HOUSE3.things) || []).filter(t => t.own === own); if (!L.length || !grp) return;
  const y0 = (R.HOUSE3.lawn ?? -260), add = (g, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.copy(v3(x, y, z)); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; o.raycast = () => {}; grp.add(o); return o; };
  const cyl = (r0, r1, h, n = 20) => new THREE.CylinderGeometry(r0 * M, r1 * M, h * M, n);
  const black = thingMat("#1c1d1f", { roughness: 0.35 }), steel = thingMat("#2a2b2d", { roughness: 0.5, metalness: 0.4 });
  for (const t of L) {
    if (t.kind === "table") {                                  // a round glass top on a pedestal
      add(cyl(t.d / 2, t.d / 2, 1.2, 32), thingMat("#151618", { roughness: 0.15 }), t.x, y0 + t.h, t.z);
      add(cyl(2.5, 2.5, t.h, 10), black, t.x, y0 + t.h / 2, t.z); add(cyl(24, 26, 3, 20), black, t.x, y0 + 1.5, t.z);
    } else if (t.kind === "chair") {                           // a folding chair: a seat and a back of cloth on a dark frame (a recliner leans back)
      const g = new THREE.Group(), cloth = thingMat(t.colour || "#e6e1d6", { roughness: 0.9, side: THREE.DoubleSide }), ry = (t.turn || 0) * Math.PI / 180;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.5), cloth); seat.position.set(0, 0.42, 0); g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, t.recline ? 0.95 : 0.55, 0.03), cloth); back.position.set(0, t.recline ? 0.85 : 0.7, -0.27); back.rotation.x = t.recline ? -0.45 : -0.12; g.add(back);
      for (const sx of [-0.25, 0.25]) for (const sz of [-0.24, 0.24]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 6), steel); l.position.set(sx, 0.21, sz); g.add(l); }
      g.position.copy(v3(t.x, y0, t.z)); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.raycast = () => {}; } }); grp.add(g);
    } else if (t.kind === "trampoline") {                      // the green pad round the black mat, its legs, the black net on poles
      const r = t.d / 2, h = 85;
      const pad = new THREE.Mesh(new THREE.TorusGeometry(r * M, 0.12, 8, 48), thingMat("#2f8f6a", { roughness: 0.6 })); pad.rotation.x = Math.PI / 2; pad.position.copy(v3(t.x, y0 + h, t.z)); pad.castShadow = true; pad.raycast = () => {}; grp.add(pad);
      const mat = new THREE.Mesh(new THREE.CircleGeometry((r - 10) * M, 40), thingMat("#111214", { roughness: 0.9, side: THREE.DoubleSide })); mat.rotation.x = -Math.PI / 2; mat.position.copy(v3(t.x, y0 + h - 2, t.z)); mat.raycast = () => {}; grp.add(mat);
      const net = new THREE.Mesh(new THREE.CylinderGeometry(r * M, r * M, 1.8, 40, 1, true), thingMat("#0e0f10", { roughness: 1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      net.position.copy(v3(t.x, y0 + h + 90, t.z)); net.raycast = () => {}; grp.add(net);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, px = t.x + Math.cos(a) * r, pz = t.z + Math.sin(a) * r;
        add(cyl(1.8, 1.8, h + 180, 6), steel, px, y0 + (h + 180) / 2, pz); }
    } else if (t.kind === "shed") {                            // walls, a pitched roof across, a door in its front
      const [xa, xb] = t.x, [za, zb] = t.z, w = xb - xa, d = Math.abs(za - zb), zm = (za + zb) / 2, wall = thingMat(t.wall, { roughness: 0.9 }), roof = thingMat(t.roof, { roughness: 0.95 });
      add(new THREE.BoxGeometry(w * M, (t.eave - y0) * M, d * M), wall, (xa + xb) / 2, (y0 + t.eave) / 2, zm);
      const z0 = Math.max(za, zb) + 12, z1 = Math.min(za, zb) - 12, sh = new THREE.Shape([new THREE.Vector2(z0 * M, t.eave * M), new THREE.Vector2(zm * M, t.ridge * M), new THREE.Vector2(z1 * M, t.eave * M)]);
      const g = new THREE.ExtrudeGeometry(sh, { depth: (w + 20) * M, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(-(xa - 10) * M, 0, 0);
      const m = new THREE.Mesh(g, roof); m.castShadow = m.receiveShadow = true; m.raycast = () => {}; grp.add(m);
      add(new THREE.BoxGeometry(80 * M, 180 * M, 0.02), thingMat("#5a4030", { roughness: 0.9 }), (xa + xb) / 2, y0 + 90, Math.max(za, zb) + 1);
    }
  }
}
function buildNextGardens(grp) {
  const N = R.HOUSE3 && R.HOUSE3.next_gardens; if (!N || !grp) return;
  for (const [k, list] of Object.entries(N)) { const T = houseTex(k), m = thingMat(T ? "#ffffff" : k === "lawn" ? "#5d6a44" : "#6b5644", { map: T ? T.map : null, roughness: 0.95 });
    for (const [x0, y0, z0, x1, y1, z1] of list) { const p = v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), g = new THREE.BoxGeometry(Math.abs(x1 - x0) * M, Math.abs(y1 - y0) * M, Math.abs(z1 - z0) * M);
      if (T) worldUV(g, k, p); const b = new THREE.Mesh(g, m); b.position.copy(p); b.receiveShadow = true; b.castShadow = k === "fence"; b.raycast = () => {}; grp.add(b); } }
}
function sheetTex() {   // grey sheet roofing: ribs, a little weathering
  return canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#4c5154"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += w / 4) { const gr = g.createLinearGradient(x, 0, x + w / 4, 0); gr.addColorStop(0, "rgba(255,255,255,0.12)"); gr.addColorStop(0.15, "rgba(0,0,0,0.18)"); gr.addColorStop(0.3, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x, 0, w / 4, h); }
    let sd = 31; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "40,42,40" : "150,150,140"},0.08)`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 4 + rnd() * 30); } });
}
function townTex() {    // the hill's face from across the valley: clusters of terraced houses (roofs over pale and brick walls) among trees and gardens
  return canvasTex(LOWD ? 512 : 1024, LOWD ? 512 : 1024, (g, w, h) => {
    let sd = 4711; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, sc = w / 1024;
    g.fillStyle = "#566a40"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = ["#475a33", "#617349", "#4f633a", "#6c7d52", "#3e5130"][i % 5]; g.globalAlpha = 0.55; g.beginPath(); g.arc(rnd() * w, rnd() * h, (5 + rnd() * 16) * sc, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const roofs = ["#6a4136", "#5c3a30", "#4f4d4e", "#704636", "#5e5a58"], walls = ["#a9a092", "#8e5c47", "#9d9484", "#82503d", "#b3ab9d"];
    g.globalAlpha = 0.72;   // V3.59 (N114): the houses softer into the green at 5 km (on a phone their rows read as a striped band)
    for (let c = 0; c < 16; c++) {                              // a cluster: a few short terraces stepping up the hill, not one long row
      const cx = rnd() * w, cy = rnd() * h, rows = 2 + Math.floor(rnd() * 4);
      for (let r = 0; r < rows; r++) { const y = cy + r * 26 * sc, n = 2 + Math.floor(rnd() * 4); let x = cx + (rnd() - 0.5) * 30 * sc;
        for (let k = 0; k < n; k++) { const run = (24 + rnd() * 50) * sc, rf = roofs[Math.floor(rnd() * roofs.length)], wl = walls[Math.floor(rnd() * walls.length)];
          for (const dx of [0, -w, w]) { const xx = (x + dx), yy = ((y % h) + h) % h;
            g.fillStyle = wl; g.fillRect(xx, yy + 7 * sc, run, 8 * sc); g.fillStyle = rf; g.fillRect(xx - 1.5 * sc, yy, run + 3 * sc, 8 * sc);
            g.fillStyle = "rgba(40,50,60,0.5)"; for (let q = xx + 4 * sc; q < xx + run - 3 * sc; q += 7 * sc) g.fillRect(q, yy + 9 * sc, 2.5 * sc, 3 * sc); }
          x += run + (4 + rnd() * 14) * sc; } } }
    g.globalAlpha = 1; for (let i = 0; i < 1100; i++) { g.fillStyle = ["#3b4f2d", "#4a6136", "#33462a", "#55693d"][i % 4]; g.beginPath(); g.arc(rnd() * w, rnd() * h, (4 + rnd() * 13) * sc, 0, 7); g.fill(); }   // trees in front of the houses (V3.59: more, breaking up the rows)
  });
}
const gridFrom = g => { g.computeBoundingBox(); const b = g.boundingBox; return { x: -b.min.x, y: -b.min.y, z: -b.min.z }; };   // N183: the WC's splashback's grid from its own corner (it ran from the house's, its grout stepping across the panel)
/* N236: a made oak piece's grain runs along each part's length, as the media wall's (03_materials boxGeo): each face's picture turned so its
   grain (up the picture) runs the longer way of that face, from the box's own size (houseBox's "grain" attribute, dropped here) */
const GRAIN_ALONG = new Set(["artisan"]);
function worldUV(geo, k, off) {
  const T = houseTex(k), G = geo.attributes.grain; if (!T) { if (G) geo.deleteAttribute("grain"); return geo; }
  const P = geo.attributes.position, N = geo.attributes.normal, uv = new Float32Array(P.count * 2), [sw, sh] = T.size, ox = off ? off.x : 0, oy = off ? off.y : 0, oz = off ? off.z : 0;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + ox, y = P.getY(i) + oy, z = P.getZ(i) + oz, nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i));
    let u, v;
    if (G && G.getX(i) + G.getY(i) > 0) { const dm = [G.getX(i), G.getY(i), G.getZ(i)], q = [x, y, z], ax = ny >= 0.7 ? [0, 2] : nx > nz ? [2, 1] : [0, 1], lg = dm[ax[1]] >= dm[ax[0]];
      u = q[lg ? ax[0] : ax[1]]; v = q[lg ? ax[1] : ax[0]]; }
    else if (ny > 0.3 && ny < 0.95 && (k === "tile" || k === "hung")) { const s2 = 1 / ny; if (nx > nz) { u = z; v = x * s2; } else { u = x; v = z * s2; } }   // v69: along the slope at its own pitch (the back is 50°)
    else if (ny >= 0.7) { u = x; v = z; }
    else if (nx > nz) { u = z; v = y; } else { u = x; v = y; }
    uv[2 * i] = u / sw; uv[2 * i + 1] = v / sh;
  }
  if (G) geo.deleteAttribute("grain");
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return geo;
}
