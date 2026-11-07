/* v28: the suggestions' versions (ideas.SUGG_VARS): colour i goes on SVAR_MATS[k][i], a material or a light of that piece's own */
const SVAR = JSON.parse((document.getElementById("svar-data") || {}).textContent || "{}");
const SVAR_MATS = {};
const svarOf = k => (SVAR[k] && SVAR[k].some(x => x[0] === S.svar[k])) ? S.svar[k] : (SVAR[k] ? SVAR[k][0][0] : "");
function applySvar() {
  for (const [k, mats] of Object.entries(SVAR_MATS)) {
    const ver = (SVAR[k] || []).find(x => x[0] === svarOf(k)); if (!ver) continue;
    const it = MOV["sg_" + k];
    mats.forEach((m, i) => { const c = ver[2][Math.min(i, ver[2].length - 1)]; m.color.set(c);
      const j = it ? it.mats.indexOf(m) : -1; if (j >= 0) it.base[j] = c; });   // a floor piece: placeAll recolours it (and Edit room's colour still wins)
  }
}
/* N25 (a lighter start): a suggestion or an idea is built the first time it's shown, not at the start (most never are). Its group (or
   a floor piece's pivot) stands empty and hidden till then; built, it's merged where it was before, clipped for the cutaway like the rest,
   and the room's state applied over it once more (its versions, its doors' tweens, its lights, its shadows) */
let lazyQ = false;
function lazyVis(o, build, merge = false) {
  let v = false, made = false;
  Object.defineProperty(o, "visible", { configurable: true, enumerable: true, get: () => v, set(x) {
    v = !!x; if (!v || made) return; made = true; build(); if (merge) mergeStatic(o); clipGroup(o);
    if (!lazyQ) { lazyQ = true; queueMicrotask(lazyApply); } } });
  return o;
}
/* applyState shows the living room's parts again; from outside they're put away (livingFromOutside), so put them back the same way
   (a piece built at the start would otherwise bring the living room into the house's first picture: 8 more shaders, ~90 more draws) */
function lazyApply() {
  lazyQ = false; const was = cabSnap, out = livOut; cabSnap = true;
  if (out) { livOut = false; for (const o of LIVING) if (o.userData.livWas !== undefined) { o.visible = o.userData.livWas; delete o.userData.livWas; } }
  try { applyState(); } finally { cabSnap = was; if (out) livingFromOutside(); }
}
/* a mirror's glass: no live reflection (it would draw the room twice); a soft daylight sheen with two diagonal highlights reads as one */
const MIRROR_SHEEN = canvasTex(128, 512, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#eef3f4"); gr.addColorStop(0.55, "#cdd8db"); gr.addColorStop(1, "#aab7bb");
  c.fillStyle = gr; c.fillRect(0, 0, w, h); c.globalAlpha = 0.35; c.fillStyle = "#ffffff";
  for (const [y, t] of [[90, 60], [230, 26]]) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y - 70); c.lineTo(w, y - 70 + t); c.lineTo(0, y + t); c.fill(); }
});
const FILM_TEX = canvasTex(640, 360, (g, w, h) => {      // v32: a film on the TV (the backlight idea): a dusk sky, a sun, hills
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#2a3c8f"); sky.addColorStop(0.45, "#c44fb0"); sky.addColorStop(0.75, "#ff8a3d"); sky.addColorStop(1, "#ffcf6a");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffe39a"; g.beginPath(); g.arc(w * 0.5, h * 0.7, 48, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1d6f74"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.72); g.quadraticCurveTo(w * 0.2, h * 0.58, w * 0.42, h * 0.8); g.lineTo(w * 0.42, h); g.fill();
  g.fillStyle = "#16434f"; g.beginPath(); g.moveTo(w, h); g.lineTo(w, h * 0.66); g.quadraticCurveTo(w * 0.75, h * 0.6, w * 0.5, h * 0.86); g.lineTo(w * 0.45, h); g.fill();
});
const PRINT_TEX = canvasTex(720, 500, (g, w, h) => {      // a mid-century print: an ochre sun, a rust hill, a sage arch on cream
  g.fillStyle = "#efe7d8"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#d9a441"; g.beginPath(); g.arc(w * 0.68, h * 0.34, 82, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#c7643a"; g.beginPath(); g.ellipse(w * 0.36, h, 260, 230, 0, Math.PI, 0); g.fill();
  g.strokeStyle = "#7a8a6a"; g.lineWidth = 34; g.beginPath(); g.arc(w * 0.74, h, 150, Math.PI, 0); g.stroke();
  g.fillStyle = "#2f4a6e"; g.fillRect(0, h - 26, w, 26);
});
function buildSuggest() {
  const oak = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
  const leaf = reg(new THREE.MeshStandardMaterial({ color: "#3f7a3a", roughness: 0.6, side: THREE.DoubleSide }));   // the vase's grass stems (the plants bring their own leaves)
  const mat = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  // the floor pieces: movable, shown only while switched on
  const floor = (k, label, w, d, x, z, build, mats = []) => { const g = new THREE.Group(); SUGG_G[k] = movable("sg_" + k, label, g, () => ({ x, z, rot: 0 }), w, d, mats, false, { when: () => !!S.sugg[k] && !(k === "floorplant" && (S.sugg.blanketbasket || S.sugg.cotswoldbasket)) }); lazyVis(SUGG_G[k].pivot, () => { build(g); mergeStatic(g); }); };   // v36: the blanket basket takes the floor plant's corner
  const ownOak = () => reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));   // v28: each piece's own, for its versions
  const ownGlow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  { const pot = mat("#d8cfc0"); SVAR_MATS.floorplant = [pot];
    floor("floorplant", "Floor plant (suggested)", 40, 40, 24, -92, g => {
      const hold = { userData: {} }, B = floraBatch(hold), r = rnd(61), pg = potGeo(15, 32); floraAdd(B, pot, pg);   // v40: a rubber plant on its trunk
      const soil = new THREE.CircleGeometry(0.14, 20); soil.rotateX(-Math.PI / 2); soil.translate(0, 0.28, 0); floraAdd(B, floraMat("soil"), soil, null, "soil");
      stemAlong(B, [new THREE.Vector3(0, 0.27, 0), new THREE.Vector3(0.01, 0.8, 0), new THREE.Vector3(-0.01, 1.3, 0.01)], 0.012, "#6b5238");
      for (let i = 0; i < 30; i++) { const y = 0.62 + r() * 0.85, a = r() * Math.PI * 2, rr = 0.03 + r() * 0.12 * (1.5 - (y - 0.6)), p = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
        stemAlong(B, [new THREE.Vector3(0, y - 0.04, 0), p], 0.002, "#5d6b3a");
        leafAt(B, "ficus", p, dirOf(a, 0.1 + r() * 0.5), (16 + r() * 10) * M, r, { fold: 0.12, curl: 0.1 }); }
      floraFlush(hold, g); }, [pot]); }
  { const oak = ownOak(); SVAR_MATS.sidetable = [oak];
  floor("sidetable", "Side table (suggested)", 40, 40, 76, -108, g => {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 32), oak); top.position.y = 0.4875; g.add(shadow(top));
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.475, 16), oak); col.position.y = 0.2375; g.add(shadow(col));
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.02, 32), oak); foot.position.y = 0.01; g.add(shadow(foot)); }, [oak]); }
  { const knit = mat("#d9a441"); SVAR_MATS.pouffe = [knit];
    floor("pouffe", "Pouffe (suggested)", 50, 50, 175, -95, g => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 32), knit); b.position.y = 0.2; g.add(shadow(b));
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 8, 32), knit); t.rotation.x = Math.PI / 2; t.position.y = 0.39; g.add(t); }, [knit]); }
  // on the walls and the coffee table: fixed, shown only while switched on
  { const g = SUGG_G.art = new THREE.Group(); shell.add(g); lazyVis(g, () => { const z0 = -298, oak = ownOak(); SVAR_MATS.art = [oak];
    ibox(g, 0, 110, z0, 3, 55, 80, oak);
    const print = reg(new THREE.MeshStandardMaterial({ map: PRINT_TEX, roughness: 0.8 }));
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.47), print); pl.position.copy(v3(3.1, 137.5, z0 + 40)); pl.rotation.y = -Math.PI / 2; g.add(pl); }); }
  { const g = SUGG_G.clock = new THREE.Group(); shell.add(g); lazyVis(g, () => { const cx = (R.DOOR_X[0] + R.DOOR_X[1]) / 2, cy = R.DOOR_H + (R.CEIL - R.DOOR_H) / 2, zf = R.RECESS_Z;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 40), mat("#f3f1eb")); face.rotation.x = Math.PI / 2; face.position.copy(v3(cx, cy, zf - 1.5)); g.add(face);
    const rimM = SVAR_MATS.clock = [ownOak()], rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 40), rimM[0]); rim.position.copy(v3(cx, cy, zf - 3)); g.add(rim);
    const ink = mat("#1f1f21");
    for (const [len, a] of [[10, 0.6], [7, 2.4]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.006, len * M, 0.003), ink);
      h.geometry.translate(0, len * M / 2, 0); h.position.copy(v3(cx, cy, zf - 3.2)); h.rotation.z = a; g.add(h); } }); }
  { const g = SUGG_G.tray = new THREE.Group(); (coffeeG || shell).add(g); lazyVis(g, () => { const oak = ownOak(); SVAR_MATS.tray = [oak];
    lb(g, 12, 42, 0, 40, 1.6, 26, oak);
    lb(g, 18, 43.6, 0, 22, 3, 16, mat("#2f4a6e")); lb(g, 18, 46.6, 0, 20, 2.4, 15, mat("#c7643a"));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 20), reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.12 })));
    c.position.copy(v3(2, 43.6 + 4.5, 2)); g.add(shadow(c)); }); }
  // v23: six more
  const glow = new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false });
  { const g = SUGG_G.fairy = new THREE.Group(); shell.add(g); lazyVis(g, () => { const CU = R.CURTAIN, [wx0, wx1] = R.WINDOW_X, x0 = wx0 - CU.ext + 2, x1 = wx1 + CU.ext - 2, gs = [];
    for (let x = x0; x <= x1; x += 6) { const sp = new THREE.SphereGeometry(0.0045, 6, 4), q = v3(x, CU.rail_y + CU.pole / 2 - 1.6 - 1.2 * Math.abs(Math.sin((x - x0) / 23)), CU.z + 2.6); sp.translate(q.x, q.y, q.z); gs.push(sp); }
    SVAR_MATS.fairy = [ownGlow("#ffd59a")]; g.add(new THREE.Mesh(mergeGeometries(gs), SVAR_MATS.fairy[0])); }); }
  { const g = SUGG_G.hanger = new THREE.Group(); shell.add(g); lazyVis(g, () => { const CU = R.CURTAIN, x = R.WINDOW_X[0] + 34, z = CU.z + 1, yp = CU.rail_y - 72;
    const cord = mat("#e9e1cf");
    for (const a of [0, 2.1, 4.2]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.7, 4), cord);
      c.position.copy(v3(x + Math.cos(a) * 4, yp + 46, z + Math.sin(a) * 4)); c.rotation.z = Math.cos(a) * 0.08; c.rotation.x = Math.sin(a) * 0.08; g.add(c); }
    SVAR_MATS.hanger = [mat("#c46c45")]; potPlant(g, x, yp, z, 7, 8, 3, rnd(81), SVAR_MATS.hanger[0], leaf); }); }
  { const g = SUGG_G.trail = new THREE.Group(); shell.add(g); lazyVis(g, () => { SVAR_MATS.trail = [mat("#ece6da")]; potPlant(g, 172, 196, 22, 7, 10, 4, rnd(83), SVAR_MATS.trail[0], leaf); }); }
  { const g = SUGG_G.throw = new THREE.Group(); shell.add(g); lazyVis(g, () => { const knit = reg(new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 1, bumpMap: HESSIAN, bumpScale: 1.4 })); SVAR_MATS.throw = [knit];
    const ze = R.SOFA.end;
    ibox(g, 22, 52, ze - 46, 70, 2.2, 46, knit);                 // folded over the seat at the open end
    ibox(g, 22, 18, ze - 0.2, 70, 36, 2.2, knit);                // and hanging over the end
    }); }
  { const g = SUGG_G.pclamp = new THREE.Group(); shell.add(g); lazyVis(g, () => { const y = R.PC_SHELF_TOP, z = -198, x = 13;
    const pm = SVAR_MATS.pclamp = [mat("#e8e2d4"), reg(new THREE.MeshStandardMaterial({ color: "#f3e7cf", emissive: "#ffcf8a", emissiveIntensity: 0.6, roughness: 0.6 }))];
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.2, 20), pm[0]); base.position.copy(v3(x, y + 10, z)); g.add(shadow(base));
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), pm[1]);
    shade.position.copy(v3(x, y + 19, z)); g.add(shadow(shade)); }); }
  // v26: six more
  { const g = SUGG_G.candles = new THREE.Group(); shell.add(g); lazyVis(g, () => { const sb = R.SHELF_B, wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.18 })); SVAR_MATS.candles = [wax];
    [[10, -262], [12.5, -252], [15, -243]].forEach(([h, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0375, 0.0375, h * M, 20), wax); c.position.copy(v3(R.W - sb.d / 2 - 2, sb.top + h / 2, z)); g.add(shadow(c));
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), glow); f.scale.y = 1.8; f.position.copy(v3(R.W - sb.d / 2 - 2, sb.top + h + 1.2, z)); g.add(f); }); }); }
  { const g = SUGG_G.runner = new THREE.Group(); shell.add(g); lazyVis(g, () => { const linen = mat("#e6dccb"); SVAR_MATS.runner = [linen];
    lb(g, 0, 0, 0, 180, 0.4, 33, linen);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 18), reg(new THREE.MeshStandardMaterial({ color: "#7a8a6a", roughness: 0.35 }))); v.position.copy(v3(0, 10.4, 0)); g.add(shadow(v));
    for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.18, 4), leaf); st.position.copy(v3((i - 2) * 1.2, 27, (i % 2) * 1.5)); st.rotation.z = (i - 2) * 0.12; g.add(st);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat(["#efe7d8", "#d9a441", "#c7643a"][i % 3])); fl.position.copy(v3((i - 2) * 3.4, 36, (i % 2) * 1.5)); g.add(fl); } }); }
  { const a = mat("#d9a441"), b = mat("#c7643a"); SVAR_MATS.floorcush = [a, b];
    floor("floorcush", "Floor cushions (suggested)", 60, 60, 118, -98, g => {
      const c1 = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.12, 0.6, 3, 0.04), a); c1.position.y = 0.06; g.add(shadow(c1));
      const c2 = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.12, 0.58, 3, 0.04), b); c2.position.y = 0.18; c2.rotation.y = 0.2; g.add(shadow(c2)); }, [a, b]); }
  { const rattan = mat("#b98f5c"), weave = reg(new THREE.MeshStandardMaterial({ color: "#b98f5c", roughness: 0.9, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));
    SVAR_MATS.lantern = [rattan, weave];
    floor("lantern", "Rattan lantern (suggested)", 30, 30, 325, -283, g => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.48, 24, 1, true), weave);
      body.position.y = 0.26; g.add(body);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.07, 24), rattan); top.position.y = 0.535; g.add(shadow(top));
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", emissive: "#ffb35a", emissiveIntensity: 0.9 }))); c.position.y = 0.08; g.add(c); }, [rattan, weave]); }
  { const g = SUGG_G.mirror = new THREE.Group(); shell.add(g); lazyVis(g, () => { const z = R.WINDOW_Z + 1.2, x0 = 14, w = 50, y0 = 108, h = 90;
    const glass = reg(new THREE.MeshStandardMaterial({ color: "#cfdbe0", roughness: 0.05, metalness: 0.6 }));
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w, h - w / 2); sh.absarc(w / 2, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(0, 0);
    SVAR_MATS.mirror = [ownOak()]; const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }), SVAR_MATS.mirror[0]); fr.scale.set(-M, M, M); fr.position.copy(v3(x0, y0, z)); g.add(shadow(fr));
    const inner = new THREE.Shape(); const iw = w - 6, ih = h - 6; inner.moveTo(0, 0); inner.lineTo(iw, 0); inner.lineTo(iw, ih - iw / 2); inner.absarc(iw / 2, ih - iw / 2, iw / 2, 0, Math.PI, false); inner.lineTo(0, 0);
    const gl_ = new THREE.Mesh(new THREE.ShapeGeometry(inner), glass); gl_.scale.set(-M, M, M); gl_.position.copy(v3(x0 + 3, y0 + 3, z + 2.4)); g.add(gl_); }); }
  { const g = SUGG_G.shelfled = new THREE.Group(); shell.add(g); lazyVis(g, () => { const sb = R.SHELF_B;
    SVAR_MATS.shelfled = [ownGlow("#ffd59a")]; const strip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.004, (sb.z[0] - sb.z[1] - 4) * M), SVAR_MATS.shelfled[0]); strip.position.copy(v3(R.W - sb.d + 2, sb.top - sb.t - 0.3, (sb.z[0] + sb.z[1]) / 2)); g.add(strip);
    const pl = new THREE.PointLight("#ffd29a", 1.2, 2.2, 2); pl.userData.accent = 1.2; SVAR_MATS.shelfled.push(pl); pl.position.copy(v3(R.W - sb.d / 2, sb.top - sb.t - 8, (sb.z[0] + sb.z[1]) / 2)); g.add(pl); }); }
  SVAR_MATS.basket = [mat("#b89a6c")];
  floor("basket", "Seagrass basket (suggested)", 40, 40, 322, -70, g => {
    const sea = SVAR_MATS.basket[0], b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.4, 28, 1, true), sea); sea.side = THREE.DoubleSide; b.position.y = 0.2; g.add(shadow(b));
    lb(g, 0, 0, 0, 32, 1, 32, sea);
    const roll = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat("#7a8a6a")); roll.scale.set(1, 0.6, 1); roll.position.y = 0.41; g.add(shadow(roll)); }, SVAR_MATS.basket);
  // v32, client: "add anything else you haven't already suggested": three more
  // picture lights over the two framed LPs (a 27.9 shade, 12.5 out on its arm from a 10.6 × 7 back plate), each washing its LP
  // v35: the picture lights went with the two framed LPs (v34): not built
  // a blackout roller blind, face-fixed just above the window and down to the sill's nose, in front of the reveal (its plants stay behind it)
  { const g = SUGG_G.blind = new THREE.Group(); shell.add(g); lazyVis(g, () => { const [wx0, wx1] = R.WINDOW_X, [wy0, wy1] = R.WINDOW_Y, z = R.WINDOW_Z + 3.2, bw = wx1 - wx0 + 4;
    const cloth = reg(new THREE.MeshStandardMaterial({ color: "#cdbf9f", roughness: 0.95, side: THREE.DoubleSide })); SVAR_MATS.blind = [cloth];
    const white_ = reg(new THREE.MeshStandardMaterial({ color: "#eeebe4", roughness: 0.45 }));
    ibox(g, wx0 - 4, wy1 + 4, R.WINDOW_Z + 0.2, bw + 4, 8, 6, white_);                    // the cassette over the window
    const top = wy1 + 4, bot = wy0 + R.SILL.t + 1;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(bw * M, (top - bot) * M), cloth); pane.position.copy(v3((wx0 + wx1) / 2, (top + bot) / 2, z)); g.add(shadow(pane));
    const bar = ibox(g, wx0 - 2, bot - 1.6, z - 0.6, bw, 1.6, 1.2, white_), bar0 = bar.position.y;   // the bottom bar
    WORK.blind = anim(v => { const k = Math.max(0.03, v); pane.scale.y = k; pane.position.y = (top - (top - bot) * k / 2) * M; bar.position.y = bar0 + (top - bot) * (1 - k) * M; }, 1);   // v34: down (1) or rolled up
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.7, 6), white_); cord.position.copy(v3(wx1 - 4, top - 35, z - 1.2)); g.add(cord); }); }
  // v34, client: "maybe integrating a wall bar in here for drinks/spirits": a drinks cabinet under the glass case, the case's width, 20
  // deep (geometry.BAR). An inset oak fall-front on a piano hinge drops onto two soft-close stays to a counter at 98; inside, nine 70 cl
  // bottles on a mirror back, lit from under the top. Its front (S.barflap) is a tween like the cabinet's doors
  if (R.DRINKS) { const g = SUGG_G.barcase = new THREE.Group(); shell.add(g); lazyVis(g, () => g.add(drinksCab(R.DRINKS, R.DRINKS.x[0], R.DRINKS.x[1], "barcase", "barflap", 71))); }
  // v36: C, the same cabinet on the side wall by the sofa's open end: built facing the breast's way, then turned to face the room from x 0
  if (R.BAR_SIDE) { const B = R.BAR_SIDE, pv = SUGG_G.barside = new THREE.Group(); lazyVis(pv, () => pv.add(drinksCab(B, B.z[1], B.z[0], "barside", "barflap2", 73))); pv.rotation.y = Math.PI / 2; shell.add(pv); }
  buildStorage(oak, mat);
}
/* v36, client: "explore any more bar ideas and where we could put it as well as more storage and where we could put it ... a small 10cm
   gap from wall shelf with the hanging plant from the right side wall. add storage solution options for our blankets also, around 5
   blankets": the storage suggestions (the third bar is drinksCab above; the blanket rail is a "beside" option, buildBeside) */
let coffeePlain = null;
function buildStorage(oak, mat) {
  const W = R.W, own = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })), bamboo = reg(new THREE.MeshStandardMaterial({ color: "#c9a46a", roughness: 0.55 }));
  const kuggis = (g, x0, y, z0, along, deep, h, m, alongZ) => {     // a lidded box: its body, a bamboo lid 1 thick
    if (alongZ) { ibox(g, x0, y, z0, deep, h - 1, along, m); ibox(g, x0 - 0.2, y + h - 1, z0 - 0.2, deep + 0.4, 1, along + 0.4, bamboo); }
    else { ibox(g, x0, y, z0, along, h - 1, deep, m); ibox(g, x0 - 0.2, y + h - 1, z0 - 0.2, along + 0.4, 1, deep + 0.4, bamboo); } };
  // v38 (the plan): Dibor's Lakelyn basket for the blankets at the sofa's open end, 29 out from the wall and 51 along it, no lid: its
  // cotton lining turned over the rim and the five throws, folded long, stacked flat inside (a floor piece: it moves in Edit room)
  if (R.BLANKET_BASKET) { const B = R.BLANKET_BASKET, weave = reg(new THREE.MeshStandardMaterial({ color: "#9a7a50", roughness: 1, bumpMap: HESSIAN, bumpScale: 2.6 }));
    const lining = own("#e9e2d2"); SVAR_MATS.blanketbasket = [weave];
    const g = new THREE.Group(), cx = (B.x[0] + B.x[1]) / 2, cz = (B.z[0] + B.z[1]) / 2;
    SUGG_G.blanketbasket = movable("sg_blanketbasket", "Blanket basket", g, () => ({ x: cx, z: cz, rot: 0 }), B.w, B.d, [weave], false, { when: () => !!S.sugg.blanketbasket });
    lazyVis(SUGG_G.blanketbasket.pivot, () => { const w = B.w, d = B.d, h = B.h, t = 1.2;
    lb(g, 0, 0, 0, w, 1.5, d, weave);                                                                     // its floor
    for (const [x, z, ww, dd] of [[-w / 2 + t / 2, 0, t, d], [w / 2 - t / 2, 0, t, d], [0, -d / 2 + t / 2, w - 2 * t, t], [0, d / 2 - t / 2, w - 2 * t, t]]) {
      lb(g, x, 1.5, z, ww, h - 1.5, dd, weave);
      lb(g, x * 1.01, h - 5, z * 1.01, ww + (ww > t ? 0 : 0.6), 5, dd + (dd > t ? 0 : 0.6), lining); }  // the lining over the rim
    const th = R.THROW_LONG || [47, 25, 8.5], cols = ["#efe7d8", "#a65a38", "#8b9878", "#d9a441", "#34507f"];
    for (let k = 0; k < 5; k++) lb(g, 0, 1.5 + k * th[2], 0, th[1] - (k % 2), th[2] - 0.3, th[0] - (k % 2), own(cols[k]));   // the throws, flat
    const top = own(cols[4]); lb(g, 1, h, 0, w - 2, 0.8, 22, top); lb(g, w / 2 + 0.5, h - 16, 0, 0.8, 16.8, 22, top);   // the top throw over the rim, hanging down the room side
    mergeStatic(g); }); }
  // the fallback: the tall lidded seagrass basket (The Cotswold Company), in the same corner
  if (R.BLANKET_COTSWOLD) { const B = R.BLANKET_COTSWOLD, weave = reg(new THREE.MeshStandardMaterial({ color: "#b89a6c", roughness: 1, bumpMap: HESSIAN, bumpScale: 2.2 }));
    SVAR_MATS.cotswoldbasket = [weave];
    const g = new THREE.Group(), cx = (B.x[0] + B.x[1]) / 2, cz = (B.z[0] + B.z[1]) / 2;
    SUGG_G.cotswoldbasket = movable("sg_cotswoldbasket", "Lidded seagrass basket (an option)", g, () => ({ x: cx, z: cz, rot: 0 }), B.w, B.d, [weave], false, { when: () => !!S.sugg.cotswoldbasket });
    lazyVis(SUGG_G.cotswoldbasket.pivot, () => { const body = new THREE.Mesh(new RoundedBoxGeometry(B.w * M, (B.h - 6) * M, B.d * M, 3, 0.03), weave);
    body.position.y = (B.h - 6) / 2 * M; g.add(shadow(body));
    const lid = new THREE.Mesh(new RoundedBoxGeometry((B.w + 1.5) * M, 6 * M, (B.d + 1.5) * M, 3, 0.025), weave); lid.position.y = (B.h - 3) * M; g.add(shadow(lid));
    const knob = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20), weave); knob.position.y = (B.h + 1.5) * M; g.add(knob);
    const throwC = ["#efe7d8", "#a65a38"].map(c => own(c));                                              // the top of the stack, peeking under the lid's edge
    for (let i = 0; i < 2; i++) { const t_ = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.004), throwC[i]); t_.position.set(0, (B.h - 6.6 + i * 0.8) * M, (B.d / 2 + 0.1) * M); g.add(t_); } mergeStatic(g); }); }
  // v38 (the plan): the record table in the coffee table's place: two KALLAX cubes on their backs on a ply base and castors, LPs
  // spine-up in the two bins, an oak lid on a piano hinge along the TV side (+z here; the sofa is -z) that lifts on two stays
  if (R.RECORD_TABLE && R.KALLAX && coffeeG) { const g = SUGG_G.recordtable = new THREE.Group(); coffeeG.add(g); lazyVis(g, () => { const T = R.RECORD_TABLE, K = R.KALLAX;
    const carc = own("#8d8780"), oakL = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 })), dark = own("#2a2724"), ply = own("#d9c29a");
    SVAR_MATS.recordtable = [oakL, carc];
    const cw = T.carcass[0], cd = T.carcass[1], y0 = T.castor + T.base, tx = (K.w - K.inner) / 2, tz = (cd - K.inner) / 2;
    for (const [x, z] of [[-cw / 2 + 4, -cd / 2 + 4], [cw / 2 - 4, -cd / 2 + 4], [-cw / 2 + 4, cd / 2 - 4], [cw / 2 - 4, cd / 2 - 4]]) {
      lb(g, x, 0, z, 3.6, T.castor - 1, 3.6, dark); lb(g, x, T.castor - 1, z, 5, 1, 5, dark); }         // the castors and their plates
    lb(g, 0, T.castor, 0, cw + 1, T.base, cd + 0.3, ply);                                                // the 12 mm ply base
    const sl = new THREE.BoxGeometry(T.lp * M, T.lp * M, 0.0036), per = T.per_bin, rows = [];
    for (let u = 0; u < T.units; u++) { const x = (u - (T.units - 1) / 2) * K.w;
      lb(g, x - K.w / 2 + tx / 2, y0, 0, tx, K.d, cd, carc); lb(g, x + K.w / 2 - tx / 2, y0, 0, tx, K.d, cd, carc);
      lb(g, x, y0, -cd / 2 + tz / 2, K.inner, K.d, tz, carc); lb(g, x, y0, cd / 2 - tz / 2, K.inner, K.d, tz, carc);
      for (let k = 0; k < per; k++) rows.push([x, -K.inner / 2 + 0.4 + k * (K.inner - 0.8) / per]); }
    const lps = new THREE.InstancedMesh(sl, reg(new THREE.MeshStandardMaterial({ roughness: 0.55 })), rows.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
    const sc = ["#e9e3d3", "#2f3e5c", "#d24b33", "#1f1f1f", "#14806d", "#f0c24b", "#7a4fb0", "#e8603c"];
    rows.forEach(([x, z], k) => { m4.makeRotationX(((k * 7919) % 9 - 4) * 0.006); m4.setPosition(x * M, (y0 + T.lp / 2) * M, z * M); lps.setMatrixAt(k, m4); lps.setColorAt(k, col.set(sc[(k * 5 + (k >> 3)) % sc.length])); });
    lps.castShadow = false; lps.receiveShadow = true; g.add(lps);                                        // the LPs, spine-up (one draw call)
    const pg = new THREE.Group(); pg.position.set(0, (y0 + K.d) * M, cd / 2 * M); g.add(pg);             // the hinge, on the TV side's top edge
    lb(pg, 0, 0, -T.d / 2 + (T.d / 2 - cd / 2), T.w, T.lid, T.d, oakL);                                   // the oak lid, 90 × 50, centred over the pair
    WORK.rlid = anim(v => { pg.rotation.x = 1.4 * v; });                                                  // up about 80°, on its stays
    }); }
  // the lift-top coffee table, in the coffee table's place (it goes where the coffee table goes); the top lifts and comes towards the sofa
  if (R.LIFT_COFFEE && coffeeG) { const g = SUGG_G.liftcoffee = new THREE.Group(); coffeeG.add(g); lazyVis(g, () => { const L = R.LIFT_COFFEE, body = own("#b07d4f"); SVAR_MATS.liftcoffee = [body];
    const dark = own("#2a2724"), w = L.w, d = L.d, legH = 6, top = 2.2, sh = L.h - legH - top;
    for (const [x, z] of [[-w / 2 + 4, -d / 2 + 4], [w / 2 - 4, -d / 2 + 4], [-w / 2 + 4, d / 2 - 4], [w / 2 - 4, d / 2 - 4]]) lb(g, x, 0, z, 4, legH, 4, body);
    lb(g, 0, legH, 0, w, 2, d, body);                                                                    // the shelf under the box
    lb(g, 0, legH + sh - L.inside, 0, w - 4, 1.2, d - 4, dark);                                           // the compartment's floor
    for (const [x, z, ww, dd] of [[0, -d / 2 + 1, w, 2], [0, d / 2 - 1, w, 2], [-w / 2 + 1, 0, 2, d - 4], [w / 2 - 1, 0, 2, d - 4]]) lb(g, x, legH + sh - L.inside - 1, z, ww, L.inside + 1, dd, body);
    for (const [x, y, z, ww, hh, dd, c] of [[-28, 0, -8, 4, 2, 15, "#1f1f21"], [-20, 0, -6, 4, 2, 17, "#1f1f21"], [-6, 0, -9, 15, 5, 10, "#e9e4da"], [14, 0, -10, 6.5, 1.8, 9.2, "#b3262b"], [22, 0, -10, 6.5, 1.8, 9.2, "#2f4e6e"], [30, 0, 6, 9, 3, 13, "#ece8e0"]])
      lb(g, x, legH + sh - L.inside + 1.2 + y, z, ww, hh, dd, own(c));                                  // remotes, a controller, decks of cards
    const tg = new THREE.Group(); g.add(tg); lb(tg, 0, L.h - top, 0, w, top, d, body);
    WORK.ctop = anim(v => { tg.position.set(0, (L.lift - L.h) * v * M, -16 * v * M); });                 // up 5.5 and 16 towards the sofa
    }); }
  // the oak shelf over the hall door, two lidded boxes on it
  if (R.DOOR_SHELF) { const g = SUGG_G.doorshelf = new THREE.Group(); shell.add(g); lazyVis(g, () => { const D = R.DOOR_SHELF, K = R.KUGGIS, zf = R.RECESS_Z, box = own("#ece8e0"); SVAR_MATS.doorshelf = [box];
    const oakS = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
    ibox(g, D.x[0], D.y, zf - D.d, D.x[1] - D.x[0], D.t, D.d, oakS);
    for (const x of [D.x[0] + 8, D.x[1] - 10]) ibox(g, x, D.y - 12, zf - 2, 2, 12, 2, oakS);           // two oak brackets' upright legs
    const mid = (D.x[0] + D.x[1]) / 2;
    kuggis(g, mid - K[0] - 3, D.top, zf - K[1] - 0.5, K[0], K[1], K[2], box, false); kuggis(g, mid + 3, D.top, zf - K[1] - 0.5, K[0], K[1], K[2], box, false); }, true); }
  // two of the same boxes on your black shelf, either side of the laser, 1 over its front
  if (R.SHELF_BOXES) { const g = SUGG_G.shelfboxes = new THREE.Group(); shell.add(g); lazyVis(g, () => { const K = R.KUGGIS, sb = R.SHELF_B, box = own("#ece8e0"); SVAR_MATS.shelfboxes = [box];
    for (const [za, zb] of R.SHELF_BOXES) kuggis(g, W - K[1] - 0.5, sb.top, zb, K[0], K[1], K[2], box, true); }, true); }
  buildStorage37(own, mat);                                                                         // v37
  // v39: fewer draws: doorshelf, shelfboxes, alcoveshelves, wallcabs, wardrobe, overdoor, windowseat and stairdrawers merged as each is built
  // (lazyVis; the step drawers' moving boxes are nested, so they stay)
}
/* v37, client: "more storage options in Extras ... under-stair drawers, alcove shelving, window seat with storage, wall-mounted
   cabinets, built-in wardrobes, shoe storage, a hallway bench with cubbies, and over-door racks". The window corner (between the
   curtains' stack and the pipe boxing) takes one of the seat, the bench or the cupboard (cornerTaken: the stand standing there hides) */
function cornerTaken() { return ["windowseat", "hallbench", "wardrobe"].some(k => S.sugg[k]); }
function cornerHides(id) {             // your plant stand or your vinyl stand, whichever stands in the window corner, unless you've moved it
  const inCorner = id === "plants" ? S.plants === "corner" : S.plants === "breast", L = S.layout[id] || {};
  return inCorner && cornerTaken() && L.x === undefined;
}
function buildStorage37(own, mat) {
  const W = R.W, WZ = R.WINDOW_Z, oakOf = c => reg(new THREE.MeshStandardMaterial({ color: c, map: OAK_TEX, roughness: 0.55 }));
  const cloth = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, bumpMap: HESSIAN, bumpScale: 0.8 }));
  // drawers in the bottom three risers: the first riser 6 behind the stair's front edge, a tread 2.2 thick over each
  if (R.STAIR_DRAWERS) { const g = SUGG_G.stairdrawers = new THREE.Group(); shell.add(g); lazyVis(g, () => { const D = R.STAIR_DRAWERS, [sx0, sx1] = R.STAIR_X, front = oakOf("#c48c57"), box = oakOf("#d8b48a");
    SVAR_MATS.stairdrawers = [front];
    const dark = own("#1c1a18"), moves = [];
    for (let i = 0; i < D.n; i++) {
      const zr = R.STAIR_FRONT + 6 + R.STAIR_GOING * i, y = R.STAIR_RISE * i + 1.4, x0 = sx0 + D.inset, dg = new THREE.Group(); g.add(dg);
      ibox(g, x0 - 0.3, y - 0.3, zr - 0.05, D.w + 0.6, D.h + 0.6, 0.1, dark, false);                     // the opening's shadow line
      ibox(dg, x0, y, zr - 1.8, D.w, D.h, 1.8, front);                                                      // the front, flush with the riser
      ibox(dg, x0 + 3, y + D.h - 2.2, zr - 1.9, D.w - 6, 0.6, 0.1, dark, false);                           // its finger-pull groove
      ibox(dg, x0 + 1, y + 1, zr, 1.2, D.h - 3, D.depth - 2, box); ibox(dg, x0 + D.w - 2.2, y + 1, zr, 1.2, D.h - 3, D.depth - 2, box);   // the box's sides
      ibox(dg, x0 + 1, y + 0.6, zr, D.w - 2, 0.6, D.depth - 2, box);                                        // its floor
      const things = [["#2f4e6e", 18, 4, 10], ["#a65a38", 12, 6, 14], ["#8b9878", 9, 3, 9]][i];
      ibox(dg, x0 + 5, y + 1.2, zr + 4, things[1], things[2], things[3], own(things[0]));                    // slippers, a lead, chargers
      mergeStatic(dg); moves.push(dg); }                                                                    // v39: each drawer moves whole, so one mesh per material
    WORK.sdraw = anim(v => moves.forEach((dg, i) => dg.position.z = -(D.depth - 8) * v * M * (1 - i * 0.12))); }, true); }
  // two oak floating shelves in the window corner, over the plant stand
  if (R.ALCOVE_SHELVES) { const g = SUGG_G.alcoveshelves = new THREE.Group(); shell.add(g); lazyVis(g, () => { const A = R.ALCOVE_SHELVES, wood = oakOf("#c48c57"); SVAR_MATS.alcoveshelves = [wood];
    const r = rnd(57), cols = ["#a65a38", "#2f4e6e", "#d9a441", "#8b9878", "#efe7d8", "#34507f"].map(c => own(c));
    for (const top of A.tops) { ibox(g, A.x[0], top - A.t, WZ, A.w, A.t, A.d, wood);
      let x = A.x[0] + 4;
      if (top === A.tops[0]) { while (x < A.x[0] + 46) { const bw = 2 + r() * 2.5, bh = 18 + r() * 6; ibox(g, x, top, WZ + 3, bw, bh, 15 + r() * 3, cols[Math.floor(r() * cols.length)]); x += bw + 0.2; } }
      potPlant(g, A.x[1] - 18, top, WZ + 11, 6.5, top === A.tops[0] ? 6 : 9, top === A.tops[0] ? 3 : 0, r, own(top === A.tops[0] ? "#c46c45" : "#e9e4da"), null, { edgeZ: WZ + A.d });   // v40
      if (top === A.tops[1]) { const vase = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 3 * M, 16 * M, 16), own("#2f4e6e")); vase.position.copy(v3(A.x[0] + 22, top + 8, WZ + 10)); g.add(shadow(vase)); } } }, true); }
  // the storage window seat: an oak box with a lift-up lid, a seat cushion, two back cushions against the window wall
  if (R.WINDOW_SEAT) { const g = SUGG_G.windowseat = new THREE.Group(); shell.add(g); lazyVis(g, () => { const S_ = R.WINDOW_SEAT, wood = oakOf("#c48c57"), cush = cloth("#d9a441"); SVAR_MATS.windowseat = [cush];
    const [xa, xb] = S_.x, w = xb - xa;
    ibox(g, xa + 1.5, 0, WZ + 1.5, w - 3, 6, S_.d - 3.5, own("#3a2e24"));                                     // a recessed plinth
    ibox(g, xa, 6, WZ, w, S_.box_h - 6, S_.d, wood);                                                          // the box
    ibox(g, xa + 0.5, S_.box_h - 1.8, WZ + 0.5, w - 1, 1.8, S_.d - 0.5, oakOf("#b5845a"));                    // the lid, its line
    const seat = new THREE.Mesh(new RoundedBoxGeometry((w - 2) * M, S_.cushion * M, (S_.d - 2) * M, 3, 0.02), cush); seat.position.copy(v3((xa + xb) / 2, S_.box_h + S_.cushion / 2, WZ + S_.d / 2)); g.add(shadow(seat));
    for (const xc of [xa + w * 0.27, xa + w * 0.73]) { const bc = new THREE.Mesh(new RoundedBoxGeometry(S_.back_cush[0] * M, 38 * M, S_.back_cush[1] * M, 3, 0.04), cloth("#e9e1cf"));
      bc.position.copy(v3(xc, S_.h + 18, WZ + S_.back_cush[1] / 2 + 1)); bc.rotation.x = 0.12; g.add(shadow(bc)); } }, true); }
  // the bench with cubbies: ten open cubbies (shoes, a basket) under a padded seat; free-standing, so it moves in Edit room
  if (R.HALL_BENCH) { const H = R.HALL_BENCH, body = own("#b07d4f"), pad = cloth("#8f8a80"); SVAR_MATS.hallbench = [body];
    const g = new THREE.Group(), cx = (H.x[0] + H.x[1]) / 2, cz = WZ + H.d / 2 + 0.5;
    SUGG_G.hallbench = movable("sg_hallbench", "Bench with cubbies (suggested)", g, () => ({ x: cx, z: cz, rot: 0 }), H.w, H.d, [body], false, { when: () => !!S.sugg.hallbench });
    lazyVis(SUGG_G.hallbench.pivot, () => { const [nx, ny] = H.cubbies, t = 1.5, ch = (H.h - H.pad - 4 - (ny + 1) * t) / ny, cw = (H.w - (nx + 1) * t) / nx;
    lb(g, 0, 0, 0, H.w - 2, 4, H.d - 2, own("#2a2724"));                                                     // the plinth
    lb(g, 0, 4, -H.d / 2 + 0.4, H.w, H.h - H.pad - 4, 0.8, body);                                            // the back
    for (let j = 0; j <= ny; j++) lb(g, 0, 4 + j * (ch + t), 0, H.w, t, H.d, body);                          // the shelves
    for (let i = 0; i <= nx; i++) lb(g, -H.w / 2 + t / 2 + i * (cw + t), 4, 0, t, H.h - H.pad - 4, H.d, body);   // the dividers
    const p_ = new THREE.Mesh(new RoundedBoxGeometry(H.w * M, H.pad * M, H.d * M, 3, 0.015), pad); p_.position.y = (H.h - H.pad / 2) * M; g.add(shadow(p_));
    const shoeC = ["#2a2a2c", "#efe7d8", "#7a4a2a", "#34507f", "#a65a38", "#2a2a2c", "#d9a441"].map(c => own(c)), r = rnd(61);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { if (r() < 0.25) continue; const cx = -H.w / 2 + t + cw * (i + 0.5) + i * t, y = 4 + t + j * (ch + t);
      if (i === 2 && j === 1) { lb(g, cx, y, 0, cw - 2, ch - 2, H.d - 6, cloth("#b89a6c")); continue; }      // a basket
      const m_ = shoeC[Math.floor(r() * shoeC.length)]; for (const dx of [-4.5, 4.5]) lb(g, cx + dx, y, 2, 7.5, 7, 22, m_); }   // a pair of shoes
    mergeStatic(g); }); }
  // the built-in cupboard: floor to ceiling, hanging depth, two hinged doors, a plinth, a scribed filler to the ceiling
  if (R.WARDROBE) { const g = SUGG_G.wardrobe = new THREE.Group(); shell.add(g); lazyVis(g, () => { const D = R.WARDROBE, doors = oakOf("#c48c57"), carc = oakOf("#b5845a"); SVAR_MATS.wardrobe = [doors];
    const [xa, xb] = D.x, w = xb - xa, zf = WZ + D.d;
    ibox(g, xa, 0, WZ, D.t, D.h, D.d, carc); ibox(g, xb - D.t, 0, WZ, D.t, D.h, D.d, carc);                  // the ends
    ibox(g, xa + D.t, 0, zf - D.door - 4, w - 2 * D.t, D.plinth, 2, own("#3a2e24"));                          // the plinth
    const gap = 0.3, dw = (w - 3 * gap) / 2, dh = D.h - D.plinth - 1.5;
    for (let i = 0; i < 2; i++) { const x = xa + gap + i * (dw + gap); ibox(g, x, D.plinth + 0.5, zf - D.door, dw, dh, D.door, doors);
      ibox(g, x + (i ? 3 : dw - 4.2), 90, zf - 0.2, 1.2, 40, 1.4, own("#2a2724")); }                         // two long bar handles
    }, true); }
  // two EKET wall cabinets with glass doors over the sofa's corner, on the side wall
  if (R.WALL_CABS) { const g = SUGG_G.wallcabs = new THREE.Group(); shell.add(g); lazyVis(g, () => { const C = R.WALL_CABS, [ew, ed, eh] = R.EKET, body = own("#6e4a2e"); SVAR_MATS.wallcabs = [body];
    const glass = reg(new THREE.MeshPhysicalMaterial({ color: "#dfeef0", roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false })), r = rnd(67);
    for (let i = 0; i < C.n; i++) { const z0 = C.z[0] - (i + 1) * ew;
      ibox(g, 0, C.y0, z0, ed, 1.5, ew, body); ibox(g, 0, C.y0 + eh - 1.5, z0, ed, 1.5, ew, body);
      ibox(g, 0, C.y0, z0, ed, eh, 1.5, body); ibox(g, 0, C.y0, z0 + ew - 1.5, ed, eh, 1.5, body);
      for (let k = 0; k < 4; k++) ibox(g, 4, C.y0 + 1.5, z0 + 3 + k * 7, 14 + r() * 8, 8 + r() * 14, 5, own(["#efe7d8", "#2f4e6e", "#a65a38", "#d9a441"][(k + i) % 4]));
      const gd = new THREE.Mesh(new THREE.PlaneGeometry((ew - 3) * M, (eh - 3) * M), glass); gd.rotation.y = -Math.PI / 2; gd.position.copy(v3(ed - 0.4, C.y0 + eh / 2, z0 + ew / 2)); g.add(gd); } }, true); }
  // the six-hook rail over the hall door's top, on its room side, with a bag and a scarf
  if (R.OVERDOOR) { const g = SUGG_G.overdoor = new THREE.Group(); shell.add(g); lazyVis(g, () => { const O = R.OVERDOOR, metal = reg(new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.35, metalness: 0.6 })); SVAR_MATS.overdoor = [metal];
    const zf = R.RECESS_Z - 0.6, cx = (R.DOOR_X[0] + R.DOOR_X[1]) / 2, x0 = cx - O.w / 2, top = R.DOOR_H;
    ibox(g, x0, top - O.h, zf - 1.2, O.w, 2.5, 0.6, metal);                                                    // the bar on the door's face
    ibox(g, x0 + 3, top - 1, zf - 1.2, 2.5, 1, O.door_t + 1.8, metal); ibox(g, x0 + O.w - 5.5, top - 1, zf - 1.2, 2.5, 1, O.door_t + 1.8, metal);   // the hooks over the top
    for (let i = 0; i < O.hooks; i++) ibox(g, x0 + 3 + i * (O.w - 6) / (O.hooks - 1) - 0.5, top - O.h - 4, zf - 4, 1, 4, 3, metal);
    ibox(g, x0 + 6, top - O.h - 42, zf - 7, 26, 36, 5, cloth("#b89a6c"));                                      // a canvas tote
    ibox(g, x0 + 35, top - O.h - 58, zf - 3.2, 9, 56, 1.4, cloth("#a65a38"));                                   // a scarf
    }, true); }
  // v43, client: "suggest improvements and more item options": motors on the curtain pole, LP ledges on the side wall (options)
  { const g = SUGG_G.curtainmotor = new THREE.Group(); shell.add(g); lazyVis(g, () => { const CU = R.CURTAIN, body = own("#efefec"), [wx0, wx1] = R.WINDOW_X; SVAR_MATS.curtainmotor = [body];
    for (const x of [wx0 - CU.ext + CU.stack, wx1 + CU.ext - CU.stack]) ibox(g, x - 3.65, CU.rail_y - 17.5, CU.z - 1, 7.3, 20.5, 8.4, body);   // SwitchBot Curtain 3, at each curtain's leading edge
    }); }
  /* v78, the client: "we're thinking of fitting a curtain there at the bottom of the steps attached to the overhang ceiling" (an option,
     geometry.STAIR_CURTAIN): a white ceiling-fix track on the bulkhead's underside over the bottom step, one thermal pencil-pleat panel
     drawn across, gathered (168 on a 67 track), 4 off the floor */
  if (R.STAIR_CURTAIN) { const g = SUGG_G.stairscurtain = new THREE.Group(); shell.add(g); lazyVis(g, () => { const SC = R.STAIR_CURTAIN, C = R.CEIL, [x0, x1] = SC.x, w = x1 - x0;
    const cl = own("#cbb994"); cl.side = THREE.DoubleSide; cl.roughness = 0.95; cl.bumpMap = HESSIAN; cl.bumpScale = 0.5; SVAR_MATS.stairscurtain = [cl];
    const tm = reg(new THREE.MeshStandardMaterial({ color: "#f1f0ec", roughness: 0.4, metalness: 0.2 })), top = C - SC.track_h;
    const panel = (len, at, ry) => { const folds = Math.round(len / 9.5), geo = new THREE.PlaneGeometry(len * M, SC.drop * M, folds * 8, 1), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) / (len * M) * Math.PI * 2 * folds) * 3.2 * M);   // pleats about 9.5 apart, 3.2 deep
      geo.computeVertexNormals(); const pm = new THREE.Mesh(geo, cl); pm.position.copy(at); pm.rotation.y = ry; g.add(shadow(pm)); };
    ibox(g, x0, C - 0.7, SC.z - SC.track_w, w, 0.7, SC.track_w, tm);                      // across the foot, on the bulkhead's underside
    panel(w, v3((x0 + x1) / 2, top - SC.drop / 2, SC.z - SC.track_w / 2), 0);
    if (SC.side) { const [s0, s1] = SC.side;                                              // v81: and along the open side, to the door's wall
      ibox(g, x0, C - 0.7, s0, SC.track_w, 0.7, s1 - s0, tm);
      panel(s1 - s0, v3(x0 + SC.track_w / 2, top - SC.drop / 2, (s0 + s1) / 2), Math.PI / 2); } }); }
  { const g = SUGG_G.lpledges = new THREE.Group(); shell.add(g); lazyVis(g, () => { const wood = own("#c48c57"), y = 108; SVAR_MATS.lpledges = [wood];
    const covers = ["#d94f2b", "#2f4e6e", "#e9c46a", "#1b1c1f"].map(c => own(c));
    [-171, -251].forEach((zc, j) => { const z0 = zc - 27.5;                                                   // under the PC shelf, under the wall cabinets
      ibox(g, 0, y - 2, z0, 12, 2, 55, wood); ibox(g, 10.5, y, z0, 1.5, 3.5, 55, wood);                       // MOSSLANDA: the shelf and its lip
      ibox(g, 1.2, y, z0 + 0.5, 0.4, 31.4, 31.4, covers[j * 2]); ibox(g, 1.8, y, z0 + 23, 0.4, 31.4, 31.4, covers[j * 2 + 1]); });   // two covers, face-out
    }); }
}
/* v34's drinks cabinet as a builder (v36): against a wall at z 0, from x0 to x1, its front at -B.d; its versions SVAR_MATS[key]; its
   fall-front WORK[work] */
function drinksCab(B, x0, x1, key, work, seed) {
  { const g = new THREE.Group(), [y0, y1] = B.y, t = B.t, d = B.d, w = x1 - x0;
    const outer = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 })), inner = reg(new THREE.MeshStandardMaterial({ color: "#b5845a", map: OAK_TEX, roughness: 0.65 }));
    SVAR_MATS[key] = [outer];
    ibox(g, x0, y0, -d, t, y1 - y0, d, outer); ibox(g, x1 - t, y0, -d, t, y1 - y0, d, outer);        // the two ends
    ibox(g, x0 + t, y1 - t, -d, w - 2 * t, t, d, outer); ibox(g, x0 + t, y0, -d, w - 2 * t, t, d, outer);   // the top and the floor
    ibox(g, x0 + t, y0 + t, -1.2, w - 2 * t, y1 - y0 - 2 * t, 0.9, inner);                          // the back
    const mir = new THREE.Mesh(new THREE.PlaneGeometry((w - 2 * t) * M, (y1 - y0 - 2 * t) * M), reg(new THREE.MeshStandardMaterial({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.1, metalness: 0.3 })));
    mir.rotation.y = Math.PI; mir.position.copy(v3((x0 + x1) / 2, (y0 + y1) / 2, -1.2 - (B.mirror ?? 0.3))); g.add(mir);   // the acrylic mirror on the back
    const led = new THREE.Mesh(new THREE.BoxGeometry((w - 2 * t - 4) * M, 0.004, 0.008), new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false }));
    led.position.copy(v3((x0 + x1) / 2, y1 - t - 0.3, -d + 3)); g.add(led);
    const glow = new THREE.PointLight("#ffcf94", 1.2, 0.9, 2); glow.position.copy(v3((x0 + x1) / 2, y1 - t - 4, -d + 6)); g.add(glow);
    const glassC = ["#3f6b3a", "#c48a3a", "#e8eef0", "#6b2e1f", "#2f4e6e", "#d9c27a", "#e8eef0", "#4a3a2a", "#8a9a5b"].map(c =>
      reg(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, metalness: 0, transmission: 0.35, transparent: true, opacity: 0.88 })));
    const cap = reg(new THREE.MeshStandardMaterial({ color: "#1f1f21", roughness: 0.4 })), label = reg(new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.8 }));
    const r = rnd(seed), pitch = (w - 2 * t) / B.n;
    for (let i = 0; i < B.n; i++) {                                                                   // nine 70 cl bottles: tall, round, squat
      const bh = 24 + r() * 10, br = 3.6 + r() * 1.1, cx = x0 + t + pitch * (i + 0.5), cz = -d / 2 - 1, yb = y0 + t;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(br * M, br * M, bh * 0.68 * M, 18), glassC[i % glassC.length]); body.position.copy(v3(cx, yb + bh * 0.34, cz)); g.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * M, br * 0.95 * M, bh * 0.26 * M, 14), glassC[i % glassC.length]); neck.position.copy(v3(cx, yb + bh * 0.81, cz)); g.add(neck);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * M, 1.5 * M, bh * 0.06 * M, 12), cap); top.position.copy(v3(cx, yb + bh * 0.97, cz)); g.add(top);
      const lab = new THREE.Mesh(new THREE.CylinderGeometry((br + 0.05) * M, (br + 0.05) * M, bh * 0.25 * M, 18, 1, true, -0.9, 1.8), label); lab.position.copy(v3(cx, yb + bh * 0.3, cz)); lab.rotation.y = Math.PI; g.add(lab);
    }
    // the fall-front: hinged along the floor's front edge, it turns down onto its stays; two tumblers and a jigger stand on it once it's down
    const flap = new THREE.Group(); flap.position.copy(v3(0, y0 + t, -d)); g.add(flap);
    const fl = new THREE.Mesh(new THREE.BoxGeometry((w - 2 * t - 0.4) * M, B.inner_h * M, t * M), outer); fl.position.set(-(x0 + x1) / 2 * M, B.inner_h / 2 * M, t / 2 * M); flap.add(shadow(fl));
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 14), reg(new THREE.MeshStandardMaterial({ color: "#b8913f", roughness: 0.3, metalness: 0.8 })));
    knob.rotation.x = Math.PI / 2; knob.position.set(-(x0 + x1) / 2 * M, (B.inner_h - 4) * M, -0.01); flap.add(knob);
    const onTop = new THREE.Group(); flap.add(onTop);
    const tumbler = reg(new THREE.MeshPhysicalMaterial({ color: "#eef3f4", roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.5 }));
    for (const [dx, h_, rr] of [[-14, 9, 4], [-4, 9, 4], [10, 5, 2]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rr * M, rr * 0.85 * M, h_ * M, 18), tumbler);
      c.position.set(-((x0 + x1) / 2 + dx) * M, (B.inner_h - 10) * M, (t + h_ / 2) * M); c.rotation.x = Math.PI / 2; onTop.add(c); }   // on its inside face: the top, once it's down
    const stays = new THREE.Group(); g.add(stays);
    for (const xs of [x0 + t + 2, x1 - t - 2]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.3), reg(new THREE.MeshStandardMaterial({ color: "#b9bcc0", roughness: 0.35, metalness: 0.8 })));
      st.position.copy(v3(xs, y0 + t + 8, -d - 9)); st.rotation.x = 0.5; stays.add(st); }
    WORK[work] = anim(v => { flap.rotation.x = -Math.PI / 2 * v; onTop.visible = v > 0.98; stays.visible = v > 0.9; });
    return g; }
}
/* the sofa's square ottoman (v23's fold-down seat beside it went with the flip-top in v40) */
function buildSeatAndPouf() {
  // the ottoman, movable in Edit room. v34, client: "we'd like to get a new ottoman that is actually a storage ottoman ... similar size to
  // what we have right now and would match the room or current sofa": navy velvet, a padded lid that lifts off (S.lid), a box inside
  const P_ = R.SOFA_POUF, O = R.OTTOMAN || { w: P_.w, d: P_.d, h: P_.h, lid: 10, inner_h: 28, wall: 3, col: R.SOFA_CORD[0] };
  const velvet = reg(new THREE.MeshPhysicalMaterial({ color: O.col, roughness: 0.75, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color("#8fa3d6") }));
  const leg = reg(new THREE.MeshStandardMaterial({ color: "#5a3a22", roughness: 0.5 }));
  const g = new THREE.Group(), legH = 4, boxH = O.h - O.lid - legH;
  // a hollow box: an upholstered floor under the storage and four walls, a dark lining inside, seen with the lid off
  rlb(g, 0, legH, 0, O.w, boxH - O.inner_h, O.d, velvet, 2);
  for (const [x, z, w_, d_] of [[0, -(O.d - O.wall) / 2, O.w, O.wall], [0, (O.d - O.wall) / 2, O.w, O.wall], [-(O.w - O.wall) / 2, 0, O.wall, O.d - 2 * O.wall], [(O.w - O.wall) / 2, 0, O.wall, O.d - 2 * O.wall]])
    rlb(g, x, legH + boxH - O.inner_h - 0.5, z, w_, O.inner_h + 0.5, d_, velvet, 1.2);
  const inside = reg(new THREE.MeshStandardMaterial({ color: "#1d2236", roughness: 0.95 }));
  lb(g, 0, legH + boxH - O.inner_h + 0.05, 0, O.w - 2 * O.wall - 0.2, 0.2, O.d - 2 * O.wall - 0.2, inside, false);
  // v36, client: "in the ottoman we will likely have games and cards": square board games, 2 × 2 in three layers, and a row of decks of
  // cards along one side (geometry.OTTO_GAMES); seen with the lid off
  if (R.OTTO_GAMES) { const GB = R.GAME_BOX, OG = R.OTTO_GAMES, CD = R.CARD_DECK, y0 = legH + boxH - O.inner_h + 0.3, in0 = -OG.inner / 2;
    const boxC = ["#2f4e6e", "#c7643a", "#e9e4da", "#3f6b3a", "#d9a441", "#7a3b52", "#1f1f21", "#8b9878", "#b3262b", "#efe7d8", "#34507f", "#a65a38"];
    for (let l = 0; l < OG.layers; l++) for (let a_ = 0; a_ < OG.across; a_++) for (let b_ = 0; b_ < OG.across; b_++) {
      const c = boxC[(l * 4 + a_ * 2 + b_) % boxC.length];
      lb(g, in0 + GB[0] * (a_ + 0.5), y0 + l * GB[2], in0 + GB[1] * (b_ + 0.5), GB[0] - 0.4, GB[2] - 0.2, GB[1] - 0.4, reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })), false); }
    const deckC = ["#b3262b", "#2f4e6e", "#1f1f21", "#3f6b3a", "#d9a441"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })));
    const xs = in0 + OG.across * GB[0] + OG.strip / 2;
    for (let i = 0; i < 30; i++) lb(g, xs, y0, in0 + 1 + i * (CD[2] + 0.4) + CD[2] / 2, CD[0], CD[1], CD[2], deckC[i % deckC.length], false);   // a row of decks on edge
  }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) taperLeg(g, x * (O.w / 2 - 5), z * (O.d / 2 - 5), legH, leg);
  const lidG = new THREE.Group(), lid = new THREE.Mesh(new RoundedBoxGeometry(O.w * M, O.lid * M, O.d * M, 4, 0.035), velvet);
  lid.position.y = (legH + boxH + O.lid / 2) * M; lidG.add(shadow(lid));
  const welt = new THREE.Mesh(new THREE.BoxGeometry((O.w - 1) * M, 0.006, (O.d - 1) * M), velvet); welt.position.y = (legH + boxH + 0.3) * M; lidG.add(welt);
  g.add(lidG);                                                                                    // a group: kept out of the merge, so it can lift
  WORK.lid = anim(v => { lidG.position.set(0.18 * Math.max(0, v - 0.4) / 0.6, 0.22 * Math.min(1, v / 0.4), 0); lidG.rotation.z = -0.28 * Math.max(0, v - 0.4) / 0.6; });   // up, then over to lean on its side
  movable("pouf", "Your storage ottoman", g, () => { const D_ = P_.dinner, d = D_ && tableOpen();   // v38: while the table's out it moves clear (its dinner spot)
      return d ? { x: (D_.x[0] + D_.x[1]) / 2, z: (D_.z[0] + D_.z[1]) / 2, rot: 0 } : { x: (P_.x[0] + P_.x[1]) / 2, z: (P_.z[0] + P_.z[1]) / 2, rot: 0 }; }, P_.w, P_.d, [velvet], false,
          { when: () => !(S.site === "C" && S.dining !== "folded") });   // v26: it moves aside while the cabinet's table is out
  // v27, client: "add my surround speakers to the build that exist standing behind the sofa": the soundbar's two rears on slim stands
  // behind the sofa's long side, movable in Edit room (drawn to the AX5100G's published size until your photo)
  if (R.REAR_SPK) {
    const [sw, sh, sd] = R.REAR_SPK, ST = R.REAR_STAND, blk = reg(new THREE.MeshStandardMaterial({ color: "#1d1e21", roughness: 0.6 }));
    const grille = reg(new THREE.MeshStandardMaterial({ color: "#2b2c30", roughness: 0.95 })), steel = reg(new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.4, metalness: 0.6 }));
    R.REAR_SPOTS.forEach(([x, z], i) => {
      const g = new THREE.Group();
      // v39: the speaker sits in front of the curtains; its pole stands in the gap behind the sofa, its flat base under the radiator
      const pz = ST.pole_z !== undefined ? ST.pole_z - z : 0, bz = ST.base_z ? [ST.base_z[0] - z, ST.base_z[1] - z] : [-ST.base[1] / 2, ST.base[1] / 2];
      lb(g, 0, 0, (bz[0] + bz[1]) / 2, ST.base[0], ST.base[2], bz[1] - bz[0], steel);  // the weighted base
      lb(g, 0, ST.base[2], pz, ST.pole, ST.top - ST.base[2] - 0.8, ST.pole, steel);  // the pole
      lb(g, 0, ST.top - 0.8, 0, sw + 1, 0.8, sd, steel);                             // the top plate
      lb(g, 0, ST.top, 0, sw, sh, sd, blk);                                          // the speaker
      lb(g, 0, ST.top + 0.8, sd / 2 - 0.2, sw - 1.2, sh - 1.6, 0.6, grille);         // its grille, facing the room
      movable("rear" + (i + 1), i ? "Rear speaker, right" : "Rear speaker, left", g, () => ({ x, z, rot: 0 }), Math.max(ST.base[0], sw), Math.max(ST.base[1], sd), [blk]);
    });
  }
}
function applySuggest() {
  for (const k of ["art", "clock", "tray", "fairy", "hanger", "trail", "throw", "pclamp", "candles", "mirror", "shelfled", "blind", "cablights", "bartrolley"]) if (SUGG_G[k]) SUGG_G[k].visible = !!S.sugg[k];
  if (SUGG_G.barcase) SUGG_G.barcase.visible = !!S.sugg.barcase && caseOn();                          // v34: under the case
  for (const k of ["barside", "doorshelf", "shelfboxes"]) if (SUGG_G[k]) SUGG_G[k].visible = !!S.sugg[k];   // v36
  for (const k of ["stairdrawers", "alcoveshelves", "windowseat", "wardrobe", "wallcabs", "overdoor"]) if (SUGG_G[k]) SUGG_G[k].visible = !!S.sugg[k];   // v37
  for (const k of ["growlights", "curtainmotor", "lpledges", "cordlamp", "stairscurtain"]) if (SUGG_G[k]) SUGG_G[k].visible = !!S.sugg[k];   // v43: the four new options; v78 the stair curtain
  if (SUGG_G.alcoveshelves && S.sugg.wardrobe) SUGG_G.alcoveshelves.visible = false;                  // v37: the cupboard fills that corner
  if (SUGG_G.clock && S.sugg.doorshelf) SUGG_G.clock.visible = false;                                 // the shelf takes the clock's place
  { const lc = !!(SUGG_G.liftcoffee && S.sugg.liftcoffee), rt = !!(SUGG_G.recordtable && S.sugg.recordtable && !lc);   // v38: the record table is the plan's; the lift-top the option
    if (SUGG_G.liftcoffee) SUGG_G.liftcoffee.visible = lc; if (SUGG_G.recordtable) SUGG_G.recordtable.visible = rt;
    if (coffeePlain) coffeePlain.visible = !lc && !rt;
    if (SUGG_G.tray) SUGG_G.tray.position.y = lc ? (R.LIFT_COFFEE.h - 42) * M : rt ? (R.RECORD_TABLE.h - 42) * M : 0; }
  if (SUGG_G.piclights) { SUGG_G.piclights.visible = !!S.sugg.piclights && !caseOn();   // v32: over the two framed LPs, while they hang
    SUGG_G.piclights.position.y = S.site !== "A" && S.plants === "breast" ? 0.3 : 0; }
  // v26: the runner lies down the middle of whichever table is open
  const rn = SUGG_G.runner;
  if (rn) {
    rn.visible = !!S.sugg.runner && S.dining !== "folded";
    const y = 76.3;
    if (S.site === "C") { const C = cabC(); rn.position.copy(v3((C.tx[0] + C.tx[1]) / 2, y, C.cz)); rn.rotation.y = 0; rn.scale.set((C.len_open || C.len) / 225, 1, 1); }
    else if (S.site === "B") { rn.position.copy(v3((R.TABLE_B_OPEN_X[0] + R.TABLE_B_OPEN_X[1]) / 2, y, R.TABLE_B.cz)); rn.rotation.y = 0; rn.scale.set(0.78, 1, 1); }
    else { rn.position.copy(v3(R.TABLE_A.cx, y, (R.OPEN_Z[0] + R.OPEN_Z[1]) / 2)); rn.rotation.y = Math.PI / 2; rn.scale.set(0.78, 1, 1); }
  }
}
const CASE_FILLS = {}, cushM = [];
const CUSHION_COLS = { rust: ["#c7643a", "#d9a441", "#efe7d8"], blues: ["#2f4a6e", "#9fb4cc", "#e9e3d3"], sage: ["#7a8a6a", "#efe7d8", "#b9a47f"] };
const PAD_COLS = { olive: "#7c7a4c", honey: "#c99a4c", ivory: "#e8e0cd", blue: "#6d8cac" };   // v31: the seat pads
const CURTAIN_COLS = { hessian: R.CURTAIN.col, linen: "#e6e0d2", sage: "#8b9878", blue: "#34507f", rust: "#a65a38" };
const CASE_FRAMES = { oak: ["#c48c57", true, 0.55], black: ["#1f1f21", false, 0.45], white: ["#eeebe4", false, 0.5] };
function pillow(w, h, t) {          // a plump cushion: a box whose faces swell in the middle and pinch at the seams
  const g = new THREE.BoxGeometry(w * M, h * M, t * M, 10, 10, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w * M / 2), v = p.getY(i) / (h * M / 2); p.setZ(i, p.getZ(i) * (1 - 0.7 * Math.max(u * u, v * v))); }
  g.computeVertexNormals(); return g;
}
function buildCushions(sofa) {      // three scatter cushions and a throw over the arm, in the colourway picked (or none)
  const so = R.SOFA, zf = so.back + 36, st = 52;
  cushG = new THREE.Group(); cushM.length = 0;
  for (let i = 0; i < 3; i++) cushM.push(reg(new THREE.MeshStandardMaterial({ color: "#c7643a", roughness: 0.95, map: HESSIAN })));
  const put = (x, z, col, ry, tilt) => { const m = new THREE.Mesh(pillow(42, 42, 14), cushM[col]); m.position.copy(v3(x, st + 19, z));
    m.rotation.order = "YXZ"; m.rotation.y = ry; m.rotation.x = tilt; cushG.add(shadow(m)); };
  put(so.chaise_x[1] + 26, zf + 6, 0, 0, -0.32); put(so.chaise_x[1] + 72, zf + 6, 1, 0.12, -0.3);   // the long side's two seats
  put(so.x[1] - 48, zf + 6, 2, -0.1, -0.3);
  put(so.x[0] + 45, (zf + so.front) / 2 + 30, 1, -Math.PI / 2, -0.32);                                // the corner, leaning on the return's back
  const th = new THREE.Mesh(new THREE.BoxGeometry(24 * M, 0.012, 46 * M), cushM[2]); th.position.copy(v3(so.x[1] - 10, 62.6, so.back + 50)); cushG.add(shadow(th));
  const hang = new THREE.Mesh(new THREE.BoxGeometry(0.012, 30 * M, 46 * M), cushM[2]); hang.position.copy(v3(so.x[1] + 0.8, 48, so.back + 50)); cushG.add(shadow(hang));
  sofa.add(cushG);
}
/* v38 (item 12), client: "include option to view ceiling [Artex] in differing designs so we can decide if we want it in future": the
   ceiling's texture is one of these bump maps (ceilMat always has one, so no new shaders), and the feature ceilings are hidden groups */
const CEIL_G = {};
const bumpTex = draw => { const t = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); draw(g, w, h); }, false); t.repeat.set(4, 3.5); return t; };
const CEIL_BUMPS = {
  smooth: bumpTex(() => {}),
  stipple: bumpTex((g, w, h) => { const r = rnd(31);                                                  // peaks pulled up off a brush
    for (let i = 0; i < 2600; i++) { const x = r() * w, y = r() * h, s = 3 + r() * 7, v = 150 + r() * 100 | 0, gr = g.createRadialGradient(x, y, 0, x, y, s);
      gr.addColorStop(0, `rgb(${v},${v},${v})`); gr.addColorStop(1, "rgba(128,128,128,0)"); g.fillStyle = gr; g.fillRect(x - s, y - s, 2 * s, 2 * s); } }),
  swirl: bumpTex((g, w, h) => { const r = rnd(5); g.lineCap = "round";                                // overlapping part-circles, a comb's ridges
    for (let y = -40, row = 0; y < h + 60; y += 56, row++) for (let x = -40 + (row % 2) * 28; x < w + 60; x += 56) { const a0 = r() * 6.28;
      for (let k = 0; k < 6; k++) { g.strokeStyle = k % 2 ? "#5c5c5c" : "#c4c4c4"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 6 + k * 6, a0, a0 + 3.8); g.stroke(); } } }),
  fan: bumpTex((g, w, h) => { g.lineCap = "round";                                                   // rows of half-circle fans, each over the last
    for (let y = 0, row = 0; y < h + 96; y += 48, row++) for (let x = (row % 2) * 48; x < w + 96; x += 96)
      for (let k = 9; k >= 1; k--) { g.strokeStyle = k % 2 ? "#5c5c5c" : "#c4c4c4"; g.lineWidth = 4; g.beginPath(); g.arc(x, y, k * 9, Math.PI, 2 * Math.PI); g.stroke(); } }),
  basket: bumpTex((g, w, h) => { const s = 64;                                                       // squares of combed lines, turned each time
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) for (let k = 4; k < s; k += 10) {
      g.fillStyle = "#c4c4c4"; if ((x + y) / s % 2) g.fillRect(x + k, y + 3, 4, s - 6); else g.fillRect(x + 3, y + k, s - 6, 4); } }),
};
const CEIL_SCALE = { asis: 0.6, smooth: 0, stipple: 2.6, swirl: 2.2, fan: 2.2, basket: 1.8, beams: 0, coffers: 0, cove: 0 };
function applyCeiling(k) {
  if (!ceilMat) return; if (!(k in CEIL_SCALE)) k = "asis";
  const t = CEIL_BUMPS[k] || (k === "asis" ? WALL_BUMP : CEIL_BUMPS.smooth);                         // the feature ceilings go on a skimmed one
  if (ceilMat.bumpMap !== t) ceilMat.bumpMap = t; ceilMat.bumpScale = CEIL_SCALE[k];
  for (const [n, g] of Object.entries(CEIL_G)) g.visible = n === k;
}
function applyDecor() {
  const D = S.decor;
  if ((D.plants || "mix") !== FLORA_STYLE || (D.pots || "mine") !== FLORA_POTS) { FLORA_STYLE = D.plants || "mix"; FLORA_POTS = D.pots || "mine"; if (FLORA_SPOTS.length) floraRebuild(); }   // v40
  applyCeiling(D.ceiling);
  if (rugMesh) { rugMesh.visible = D.rug !== "none"; const top = rugMesh.material[2], t = rugTex(D.rug), edge = (RUG_LOOKS[D.rug] || {}).edge || R.RUG.cols[3];
    if (top.map !== t) { top.map = t; top.needsUpdate = true; } rugMesh.material.forEach((m, i) => { if (i !== 2) m.color.set(edge); }); }
  if (curtCloth) curtCloth.color.set(CURTAIN_COLS[D.curtains] || CURTAIN_COLS.hessian);
  if (cushG) { const c = CUSHION_COLS[D.cushions]; cushG.visible = !!c; if (c) cushM.forEach((m, i) => m.color.set(c[i])); }
  if (CK) CK.pad.color.set(PAD_COLS[D.pads] || PAD_COLS.olive);                                   // v31: the chairs' tie-on pads (Dunelm Esme's colours)
  applySuggest();
  for (const [k, g] of Object.entries(CASE_FILLS)) g.visible = k === (D.fill in CASE_FILLS ? D.fill : "collect");
  if (caseFrameM) { const [col, oakMap, ro] = CASE_FRAMES[D.frame] || CASE_FRAMES.oak, mp = oakMap ? OAK_TEX : BLANK;
    caseFrameM.color.set(col); caseFrameM.roughness = ro; if (caseFrameM.map !== mp) { caseFrameM.map = mp; caseFrameM.needsUpdate = true; } }
  // v26: the oak's finish on every new oak piece (not your plant stand, vinyl stand, curtain pole or the stairs)
  const tint = OAK_TINTS[D.oak] || OAK_TINTS.artisan;
  for (const m of MATS) if ((m.map === OAK_TEX || m.map === OAK_TEX_V) && !m.userData.noTint && m !== caseFrameM) {
    if (!m.userData.oakBase) m.userData.oakBase = m.color.clone();
    m.color.copy(m.userData.oakBase).multiply(tint);
  }
  if (floorMat) { const f = FLOORS[D.floor] || FLOORS.carpet; if (floorMat.map !== f[0]) { floorMat.map = f[0]; floorMat.bumpMap = f[1]; floorMat.roughness = f[2]; floorMat.needsUpdate = true; } }
  if (shelfMat) { const [c, ro, oakM] = SHELF_COLS[D.shelf] || SHELF_COLS.black, mp = oakM ? OAK_TEX : BLANK;
    shelfMat.color.set(c).multiply(oakM ? tint : new THREE.Color(1, 1, 1)); shelfMat.roughness = ro; if (shelfMat.map !== mp) { shelfMat.map = mp; shelfMat.needsUpdate = true; } }
}
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);   // the tints as you'd see them, not in linear light
const OAK_TINTS = { artisan: srgb(1, 1, 1), pale: srgb(1.12, 1.09, 1.03), smoked: srgb(0.66, 0.57, 0.5), walnut: srgb(0.55, 0.42, 0.34) };
const FLOORS = { carpet: [CARPET, PILE, 1], oatmeal: [OATMEAL, PILE, 1], boards: [BOARDS, FLAT, 0.55] };
const SHELF_COLS = { black: ["#1a1a1b", 0.55, false], oak: ["#c48c57", 0.55, true], white: ["#eeebe4", 0.5, false] };
function ibox(grp, x, y, z, w, h, d, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), mat);
  m.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); grp.add(shadow(m, cast)); return m;
}
function buildIdeas() {
  const I = R.IDEAS, oak = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
  const glassM = reg(new THREE.MeshPhysicalMaterial({ color: "#dfeef0", roughness: 0.04, transparent: true, opacity: 0.22, depthWrite: false }));
  const steel = reg(new THREE.MeshStandardMaterial({ color: "#9a9ea3", metalness: 0.8, roughness: 0.35 }));
  const potM = reg(new THREE.MeshStandardMaterial({ color: "#e4ddcf", roughness: 0.7 })), potT = reg(new THREE.MeshStandardMaterial({ color: "#b5643f", roughness: 0.75 }));
  const r = rnd(41);
  const plant = (grp, x, y, z, rad, trail) => { const t = r() < 0.5; potPlant(grp, x, y, z, rad, 6 + r() * 4, trail, r, t ? potT : potM, null, { terracotta: t }); };   // v40
  // 1. the tall glass display case on the breast (it faces the room: the breast's face is z = 0). v20, client: "make glass display
  // cabinet on wall taller and give more decor variation and options": 85 tall (was 50), three glass shelves, five things to put in
  // it and three frame finishes (Decor), each fill built once and shown on its own
  { const g = IDEA_G.case = new THREE.Group(), C = I.case, [x0, x1] = C.x, [y0, y1] = C.y, d = C.d, f = C.frame, z0 = -d;
    caseFrameM = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
    ibox(g, x0, y0, -1, x1 - x0, y1 - y0, 1, caseFrameM);                            // the back
    ibox(g, x0, y0, z0, f, y1 - y0, d - 1, caseFrameM); ibox(g, x1 - f, y0, z0, f, y1 - y0, d - 1, caseFrameM);
    ibox(g, x0, y0, z0, x1 - x0, f, d - 1, caseFrameM); ibox(g, x0, y1 - f, z0, x1 - x0, f, d - 1, caseFrameM);
    for (const y of C.shelves) ibox(g, x0 + f, y - 0.3, z0 + 1, x1 - x0 - 2 * f, 0.6, d - 2, glassM, false);   // three 6 mm glass shelves
    ibox(g, x0, y0, z0 - 0.4, x1 - x0, y1 - y0, 0.4, glassM, false);                       // the toughened glass front
    ideaLed = new THREE.MeshBasicMaterial({ color: "#fff1d6", toneMapped: false });
    ibox(g, x0 + f, y1 - f - 0.5, z0 + 2, x1 - x0 - 2 * f, 0.5, 1.2, ideaLed, false);
    { const cl = new THREE.PointLight("#ffe6c4", 1, 1.1, 2); cl.position.copy(v3((x0 + x1) / 2, y1 - f - 3, z0 + 4)); cl.userData.accent = 1.4; g.add(cl); }   // v46: its LED lights the shelves (Accents)
    const pal = ["#1d2a4a", "#a33b2b", "#e2c35a", "#2f6b5a", "#d9d4c7", "#d0682f", "#6c4a8a", "#1b1c1f", "#f2efe6", "#3a78b5"]
      .map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })));
    const glaze = ["#e8e2d4", "#9bb0a0", "#c7643a", "#2f4a6e", "#d9a441"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })));
    const disc = reg(new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.35 }));
    const xa = x0 + f + 1.5, xb = x1 - f - 1.5, bases = [y0 + f, ...C.shelves.map(y => y + 0.3)];
    const tops = [...C.shelves.map(y => y - 0.3), y1 - f - 0.6], zb = -2, rr = rnd(77);
    const cyl = (grp, x, y, z, rt, rb, h, mat, seg = 18) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt * M, rb * M, h * M, seg), mat); m.position.copy(v3(x, y + h / 2, z)); grp.add(shadow(m)); return m; };
    const ball = (grp, x, y, z, rad, mat, sy = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad * M, 16, 12), mat); m.scale.y = sy; m.position.copy(v3(x, y + rad * sy, z)); grp.add(shadow(m)); return m; };
    const TIER = {
      figs(grp, yb, h, i) {             // boxed figures and a few out of their boxes
        let x = xa + 2; for (let k = 0; x < xb - 10; k++) { const w = 7 + (k % 3) * 2, hh = Math.min(h - 2, 11 + ((k + i) % 3) * 3);
          if (k % 2) { ibox(grp, x, yb, z0 + 3, w, hh, 5, pal[(k + i) % 10]); ibox(grp, x + 1, yb + 2, z0 + 2.9, w - 2, hh - 5, 0.1, glassM, false); }
          else { cyl(grp, x + w / 2, yb, -6, 2.4, 2.8, hh - 5, pal[(k + i + 3) % 10]); ball(grp, x + w / 2, yb + hh - 5, -6, 2.4, pal[4]); }
          x += w + 4; } },
      cap(grp, yb, h, i) {              // a cap on its button top, and two figures
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), pal[0]); cap.position.copy(v3(xa + 16, yb, -6.5)); grp.add(shadow(cap));
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.05), pal[0]); brim.position.copy(v3(xa + 16, yb + 0.3, z0 + 3)); grp.add(brim);
        for (const [x, c] of [[xa + 42, 1], [xa + 58, 3]]) { cyl(grp, x, yb, -6, 2.6, 3, 9, pal[c]); ball(grp, x, yb + 9, -6, 2.6, pal[4]); }
        ibox(grp, xa + 68, yb, z0 + 3, 12, 14, 5, pal[2]); },
      games(grp, yb, h, i) {            // boxed games face-out on little stands, a label band on each
        let x = xa + 1; for (let k = 0; x < xb - 14; k++) { const c = pal[(k * 3 + i) % 10];
          const m = ibox(grp, x, yb, -5.5, 13.5, Math.min(h - 1.5, 17), 1.6, c); m.rotation.x = -0.12;
          ibox(grp, x + 1, yb + 12, -5.65, 11.5, 2.4, 0.1, pal[k % 2 ? 8 : 7], false); x += 16.5; } },
      console(grp, yb, h, i) {          // a handheld, its cartridges, a pad
        ibox(grp, xa + 6, yb, -7, 9, 15, 3, pal[4]); ibox(grp, xa + 7.5, yb + 8, -7.1, 6, 5, 0.1, disc, false);
        for (let k = 0; k < 6; k++) ibox(grp, xa + 22 + k * 6.5, yb, -8, 5.7, 6.5, 0.8, pal[(k + 1) % 10]);
        ibox(grp, xa + 64, yb, -9, 15, 3, 6, pal[7]); ball(grp, xa + 66, yb + 1, -6, 2.4, pal[7], 0.6); ball(grp, xa + 76, yb + 1, -6, 2.4, pal[7], 0.6); },
      singles(grp, yb, h, i) {          // 7-inch singles face-out, a record peeking out of one
        for (let k = 0; k < 4; k++) { const x = xa + 1 + k * 21.5, m = ibox(grp, x, yb, -5, 18, 18, 0.4, pal[(k * 2 + i * 3 + 1) % 10]); m.rotation.x = -0.1;
          if ((k + i) % 3 === 0) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0875, 0.0875, 0.002, 28), disc); r.rotation.x = Math.PI / 2; r.position.copy(v3(x + 13, yb + 9.4, -3.6)); grp.add(r); } } },
      tapes(grp, yb, h, i) {            // cassettes stacked flat and a row stood up, and a small speaker
        for (let s = 0; s < 3; s++) for (let k = 0; k < 6 - s; k++) ibox(grp, xa + 2 + s * 13, yb + k * 1.75, -9, 11, 1.7, 7, pal[(k + s * 2) % 10]);
        for (let k = 0; k < 6; k++) ibox(grp, xa + 44 + k * 2, yb, -8, 1.7, 11, 7, pal[(k + 5) % 10]);
        ibox(grp, xa + 62, yb, -9, 14, 14, 7, pal[7]); cyl(grp, xa + 69, yb + 4, -9.1, 3.5, 3.5, 0.2, pal[4]); },
      plants(grp, yb, h, i) {           // small pots, two trailing over the shelf's edge
        [0.08, 0.3, 0.55, 0.78, 0.95].forEach((t, k) => plant(grp, xa + 4 + t * (xb - xa - 8), yb, -6, 3.2 + (k % 2), k === 0 || k === 4 ? 1 : 0)); },
      ceramics(grp, yb, h, i) {         // vases, a bud vase and a bowl in mixed glazes
        let x = xa + 4; for (let k = 0; x < xb - 6; k++) { const gz = glaze[(k + i) % glaze.length], kind = (k + i) % 3;
          if (kind === 0) { cyl(grp, x + 3, yb, -6, 2.2, 3.4, Math.min(h - 2, 14), gz); x += 12; }
          else if (kind === 1) { ball(grp, x + 4, yb, -6, 4, gz, 1.1); cyl(grp, x + 4, yb + 8.4, -6, 1, 1.2, 3, gz); x += 13; }
          else { cyl(grp, x + 5, yb, -6, 5, 3, 4, gz); x += 14; } } },
    };
    const PRESETS = { collect: ["figs", "cap", "figs", "ceramics"], games: ["console", "games", "games", "games"], singles: ["tapes", "singles", "singles", "singles"],
                      plants: ["ceramics", "plants", "ceramics", "plants"], mixed: ["singles", "cap", "plants", "games"] };
    for (const [k, tiers] of Object.entries(PRESETS)) {
      const fg = CASE_FILLS[k] = new THREE.Group();
      tiers.forEach((t, i) => TIER[t](fg, bases[i], tops[i] - bases[i], i));
      fg.visible = k === "collect"; g.add(fg);
    }
    shell.add(g); }
  // 2. glass plant shelves across the window's reveal, on studs and a slim rod from the head
  { const g = IDEA_G.glass = new THREE.Group(); shell.add(g); lazyVis(g, () => { const GL = I.glass, [wx0, wx1] = GL.x, FZ = R.WINDOW_Z - R.WINDOW_REVEAL, wz = R.WINDOW_Z, mid = (wx0 + wx1) / 2;
    for (const y of GL.ys) {
      ibox(g, wx0, y - GL.t, wz - GL.d, wx1 - wx0, GL.t, GL.d - 0.5, glassM, false);
      for (const x of [wx0 + 0.5, wx1 - 1.5]) ibox(g, x, y - GL.t - 0.8, wz - GL.d / 2 - 1, 1, 0.8, 2, steel, false);
      [0.12, 0.3, 0.52, 0.7, 0.88].forEach((t, i) => plant(g, wx0 + 8 + t * (wx1 - wx0 - 16), y, wz - GL.d / 2, 4 + (i % 2) * 1.5, i % 2 ? 3 : 1));
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, (R.WINDOW_Y[1] - GL.ys[0] + GL.t) * M, 8), steel);
    rod.position.copy(v3(mid, (R.WINDOW_Y[1] + GL.ys[0] - GL.t) / 2, wz - GL.d + 1.5)); g.add(rod); }); }
  // 3. the oak C-table over the sofa's open end: its top reaches over the seat, its foot on the floor beside it
  { const g = IDEA_G.ctable = new THREE.Group(), T = I.ctable, [x0, x1] = T.x, ze = R.SOFA.end, t = T.t;
    const zo = ze + T.depth - T.over, [pw, pd, pt] = T.plate, fy = pt + T.felt;   // the upright's outer face, out from the sofa's end
    ibox(g, x0, T.top - t, ze - T.over, x1 - x0, t, T.depth, oak);                // the top
    ibox(g, x0, fy + t, zo - t, x1 - x0, T.top - fy - 2 * t, t, oak);             // the upright, on the foot
    ibox(g, x0, fy, ze - 3, x1 - x0, t, zo - ze + 3, oak);                        // the foot, from 3 under the sofa's edge to the upright
    ibox(g, (x0 + x1 - pw) / 2, T.felt, ze - 2, pw, pt, pd, reg(new THREE.MeshStandardMaterial({ color: "#2b2c2e", roughness: 0.5, metalness: 0.6 })));   // v43: the steel plate under it
    const glassCup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 16), glassM); glassCup.position.copy(v3(x0 + 14, T.top + 5, ze - 2)); g.add(glassCup);
    ibox(g, x1 - 20, T.top, ze - 6, 15, 4, 10, reg(new THREE.MeshStandardMaterial({ color: "#1b1c1f", roughness: 0.5 })));   // a pad
    { const lg = SUGG_G.cordlamp = new THREE.Group(), lm = reg(new THREE.MeshStandardMaterial({ color: "#a99886", roughness: 0.45, metalness: 0.2 })); SVAR_MATS.cordlamp = [lm];
      const lx = x1 - 10, lz = ze + 10, ly = T.top;                                   // v43: an option, Habitat's mushroom lamp, 31 tall
      const part = (geo, y) => { const m = new THREE.Mesh(geo, lm); m.position.copy(v3(lx, ly + y, lz)); lg.add(shadow(m)); };
      part(new THREE.CylinderGeometry(4.5 * M, 4.5 * M, 1.5 * M, 24), 0.75); part(new THREE.CylinderGeometry(0.6 * M, 0.6 * M, 22.5 * M, 12), 12.75);
      part(new THREE.SphereGeometry(7 * M, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), 24);
      const glowD = new THREE.Mesh(new THREE.CircleGeometry(6.6 * M, 24), new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false })); glowD.rotation.x = Math.PI / 2; glowD.position.copy(v3(lx, ly + 23.95, lz)); lg.add(glowD);
      g.add(lg); }
    shell.add(g); }
  // v32, client: "i want all suggested extra items, furniture and more to have full renders": the other six ideas in the room too.
  // 4. the TV's backlight following the picture: the wall behind it glows in the screen's colours (and the screen shows a film)
  { const g = IDEA_G.sync = new THREE.Group(); shell.add(g); lazyVis(g, () => { const [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y, cx = (tx0 + tx1) / 2, cy = (ty0 + ty1) / 2;
    const tex = canvasTex(640, 400, (c, w, h) => {
      c.globalCompositeOperation = "lighter";
      for (const [x, y, col] of [[0.18, 0.5, "40,215,196"], [0.82, 0.5, "255,138,61"], [0.35, 0.16, "217,77,255"], [0.68, 0.16, "255,196,80"], [0.5, 0.86, "60,110,255"]]) {
        const gr = c.createRadialGradient(x * w, y * h, 10, x * w, y * h, w * 0.32);
        gr.addColorStop(0, `rgba(${col},0.95)`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      } });
    const glowM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry((tx1 - tx0 + 56) * M, (ty1 - ty0 + 40) * M), glowM); pl.position.copy(v3(cx, cy, R.ALC_D - 0.3)); pl.rotation.y = Math.PI; g.add(pl);
    for (const [x, col] of [[tx0 + 6, "#2fd8c4"], [tx1 - 6, "#ff8a3d"]]) { const l = new THREE.PointLight(col, 1.4, 1.5, 2); l.position.copy(v3(x, cy, R.TV_Z + 3)); g.add(l); } }); }
  // 5. a smart scene button by the door: on the breast's side, at switch height
  { const g = IDEA_G.button = new THREE.Group(); shell.add(g); lazyVis(g, () => { const xb = R.BREAST_X[1], zc = R.RECESS_Z - 9;
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.1 * M, 5.6 * M, 5.6 * M, 2, 0.006), reg(new THREE.MeshStandardMaterial({ color: "#f4f2ed", roughness: 0.4 })));
    body.position.copy(v3(xb + 0.55, 120, zc)); g.add(shadow(body));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 * M, 0.12 * M, 8, 28), reg(new THREE.MeshStandardMaterial({ color: "#c9c5bd", roughness: 0.5 })));
    ring.position.copy(v3(xb + 1.15, 120, zc)); ring.rotation.y = Math.PI / 2; g.add(ring);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.25 * M, 12), new THREE.MeshBasicMaterial({ color: "#7fd1ff", toneMapped: false }));
    dot.position.copy(v3(xb + 1.16, 122.2, zc)); dot.rotation.y = -Math.PI / 2; g.add(dot); }); }
  // 6. motion nightlights on the stairs: a warm strip under each tread's nose, lighting the riser below it
  { const g = IDEA_G.night = new THREE.Group(); shell.add(g); lazyVis(g, () => { const [sx0, sx1] = R.STAIR_X, front = R.STAIR_FRONT;
    const stripM = new THREE.MeshBasicMaterial({ color: "#ffcf8a", toneMapped: false });
    const wash = canvasTex(8, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,200,130,0.85)"); gr.addColorStop(1, "rgba(255,200,130,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const washM = new THREE.MeshBasicMaterial({ map: wash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (let i = 0; i < 11; i++) {
      const yb = R.STAIR_RISE * (i + 1) - 2.2, zn = front + 4.5 + R.STAIR_GOING * i;   // the tread board's underside (2.2 thick), its nose
      const st = new THREE.Mesh(new THREE.BoxGeometry((sx1 - sx0 - 6) * M, 0.003, 0.012), stripM); st.position.copy(v3((sx0 + sx1) / 2, yb - 0.2, zn + 0.9)); g.add(st);
      const w_ = new THREE.Mesh(new THREE.PlaneGeometry((sx1 - sx0 - 4) * M, 14 * M), washM); w_.position.copy(v3((sx0 + sx1) / 2, yb - 7.2, zn + 1.45)); w_.rotation.y = Math.PI; g.add(w_);
    }
    const l = new THREE.PointLight("#ffcf8a", 0.7, 1.2, 2); l.userData.accent = 0.7; l.position.copy(v3((sx0 + sx1) / 2, 14, front - 6)); g.add(l); }); }
  // 7. the rug's non-slip pad: the corner by the door turned back to show it (the pad trimmed 2.5 inside the rug's edge)
  if (MOV.rug) { const g = IDEA_G.rugpad = new THREE.Group(); MOV.rug.pivot.children[0].add(g); lazyVis(g, () => { const RG = R.RUG, hx = (RG.x[1] - RG.x[0]) / 2, hz = (RG.z[1] - RG.z[0]) / 2, L = 46;
    const tri = (pts, y, mat) => { const geo = new THREE.BufferGeometry();
      const [p0, p1, p2] = pts.map(([x, z]) => [-x, z]);                                                         // wound to face up (three's x runs the other way)
      if ((p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]) > 0) pts = [pts[0], pts[2], pts[1]];
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap(([x, z]) => [-x * M, y * M, z * M]), 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(pts.flatMap(([x, z]) => [x / 60, z / 60]), 2));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(pts.flatMap(() => [0, 1, 0]), 3));          // facing up, whichever way round
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; g.add(m); return m; };
    const C = [hx, hz], A = [hx - L, hz], B = [hx, hz - L], F = [hx - L, hz - L];
    tri([C, A, B], 0.95, Object.assign(floorMat.clone(), { side: THREE.DoubleSide }));                           // the carpet under the corner
    tri([[hx - 2.5, hz - 2.5], [hx - L + 2.5, hz - 2.5], [hx - 2.5, hz - L + 2.5]], 1.05, reg(new THREE.MeshStandardMaterial({ color: "#5f5b55", roughness: 1, side: THREE.DoubleSide })));   // the pad
    tri([A, B, F], 1.55, reg(new THREE.MeshStandardMaterial({ color: "#a88a58", roughness: 1, side: THREE.DoubleSide })));   // the rug's jute back, folded over
    const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L * Math.SQRT2 * M, 10), reg(new THREE.MeshStandardMaterial({ color: R.RUG.cols[3], roughness: 1 })));
    fold.position.set(-(hx - L / 2) * M, 0.0125, (hz - L / 2) * M); fold.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, -1).normalize()); g.add(fold); }); }
  Object.values(IDEA_G).forEach(gr => gr.visible = false);
}
