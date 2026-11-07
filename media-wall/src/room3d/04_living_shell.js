/* ---------------------------------------------------------------- the room's shell */
const shell = new THREE.Group(); scene.add(shell);
const aboveAll = [];
function rect(cx, cy, cz, w, h, normal, mat) {     // a wall patch w × h (cm) centred at (cx, cy, cz), facing `normal` (room coords)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * M, h * M), mat);
  m.position.copy(v3(cx, cy, cz));
  const n = new THREE.Vector3(-normal[0], normal[1], normal[2]);
  m.lookAt(m.position.clone().add(n));
  m.receiveShadow = true; m.castShadow = true;   // v48 §6: walls keep the sun out (it came through every wall but the window's)
  const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 100, uv.getY(i) * h / 100);
  shell.add(m); return m;
}
/* V1.39, the client: "Build in our living room properly too": the living room gets the house's soft shade where its floor meets the
   walls (V1.33's houseShade): bands along every wall, the alcove, the breast, the flight's side and foot; on every device (the live
   shade, GTAO, only runs on the capable ones in HD); cut away with the room. Not its ceiling: the LED strip's glow is brightest there */
let livShadeG = null;
function livShade() {
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(0,0,0,0.34)"); gr.addColorStop(0.35, "rgba(0,0,0,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mat = () => reg(new THREE.MeshBasicMaterial({ color: "#000000", map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -10 }));
  const E = R.HOUSE3.living.edges.map(([ax, az, bx, bz, nx, nz]) => [[ax, az], [bx, bz], [nx, nz]]);   // V1.44: each wall's foot from the house file
  const band = (pos, uv, [a, b, n], y, w) => {
    const P = [a, b, [b[0] + n[0] * w, b[1] + n[1] * w], [a[0] + n[0] * w, a[1] + n[1] * w]].map(([x, z]) => v3(x, y, z)), U = [[0, 1], [1, 1], [1, 0], [0, 0]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(P[i].x, P[i].y, P[i].z); uv.push(U[i][0], U[i][1]); } };
  const mesh = (list, y, w) => { const pos = [], uv = []; for (const e of list) band(pos, uv, e, y, w);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    const me = new THREE.Mesh(g, mat()); me.raycast = () => {}; me.renderOrder = 1; livShadeG.add(me); };
  livShadeG = new THREE.Group(); livShadeG.name = "livShade"; shell.add(livShadeG);
  mesh(E, 0.3, 24);
}
/* a wall on the plane axis = c, spanning u0..u1 along the other horizontal axis and y0..y1, with rectangular holes */
function wall(axis, c, u0, u1, y0, y1, normal, mat, holes = []) {
  const cuts = [...new Set([u0, u1, ...holes.flatMap(h => [h[0], h[1]])])].filter(u => u >= u0 && u <= u1).sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
    const hs = holes.filter(h => h[0] <= mid && h[1] >= mid).sort((p, q) => p[2] - q[2]);
    let y = y0; const spans = [];
    for (const h of hs) { if (h[2] > y) spans.push([y, h[2]]); y = Math.max(y, h[3]); }
    if (y < y1) spans.push([y, y1]);
    for (const [ya, yb] of spans) {
      if (axis === "x") rect(c, (ya + yb) / 2, mid, b - a, yb - ya, normal, mat);
      else rect(mid, (ya + yb) / 2, c, b - a, yb - ya, normal, mat);
    }
  }
}
const BUCKET = new Map();   // v14.1: the shell's small parts, merged into one mesh per material
function cube(x, y, z, w, h, d, mat, cast = true) {
  const g = new THREE.BoxGeometry(w * M, h * M, d * M);
  g.translate(-(x + w / 2) * M, (y + h / 2) * M, (z + d / 2) * M);
  const k = mat.uuid + (cast ? "c" : "");
  if (!BUCKET.has(k)) BUCKET.set(k, { mat, cast, geos: [] });
  BUCKET.get(k).geos.push(g);
  return null;
}
function flushCubes(parent) {
  for (const b of BUCKET.values()) parent.add(shadow(new THREE.Mesh(mergeGeometries(b.geos), b.mat), b.cast));
  BUCKET.clear();
}
function buildShell() {
  const wP = id => paintMat(lum("#2d5a46") / BASE_L, false, false, "w:" + id), rP = id => paintMat(lum("#264c3a") / BASE_L, false, false, "w:" + id);   // v38: per wall
  const wallP = wP("window"), recP = rP("door"), ceilP = paintMat(lum("#33604a") / BASE_L, false, false, "ceil");
  const egg = paintMat(lum("#346650") / BASE_L, true, false, "trim");
  const C = R.CEIL, Wd = R.W, A = R.ALC_W, AD = R.ALC_D, [B0, B1] = R.BREAST_X, RZ = R.RECESS_Z, WZ = R.WINDOW_Z;
  const LD = R.HOUSE3.living.door, LW = R.HOUSE3.living.window, [dx0, dx1] = [LD.a, LD.b], DH = LD.h, [wx0, wx1] = LW.x, [wy0, wy1] = LW.y;   // V1.46: the door and the window from the house file
  // V1.45 (V1_PLAN phase 5): the walls from the house file (model.living_shell): the PC wall, into the alcove, the alcove's back, the
  // breast's reveal, the breast, the recess's side, the door wall (open over the stairs), the stairs wall, the window wall
  for (const w of R.HOUSE3.living.walls) wall(w.axis, w.c, w.u[0], w.u[1], w.y[0], w.y[1], w.n, (w.tone === "r" ? rP : wP)(w.paint), w.holes);
  // v16: the hollow pipe boxing in the window's west corner, floor to ceiling, painted with the walls
  const PX = R.HOUSE3.living.pipe_box;   // V1.48: from the house file
  cube(PX.x[0], 0, PX.z[0], PX.x[1] - PX.x[0], C, PX.z[1] - PX.z[0], wallP);
  // floor (carpet) and ceiling (painted, with the opening over the stairs)
  const LS = R.HOUSE3.living, [fx0, fz0, fx1, fz1] = LS.floor;   // V1.45: the floor, the ceiling's pieces and the skirting from the house file
  const floor = new THREE.Mesh(new THREE.PlaneGeometry((fx1 - fx0) * M, (fz1 - fz0) * M), floorMat = reg(new THREE.MeshStandardMaterial({ map: CARPET, roughness: 1, bumpMap: PILE, bumpScale: 0.5 })));
  floor.rotation.x = -Math.PI / 2; floor.position.copy(v3((fx0 + fx1) / 2, 0, (fz0 + fz1) / 2)); floor.receiveShadow = true; shell.add(floor);
  const wx = R.WELL_X0, front = R.STAIR_FRONT;
  ceilGlow = canvasTex(512, 512, (g, w, h) => {     // the strip's glow on the ceiling, brightest at the edges
    g.fillStyle = "#2c261f"; g.fillRect(0, 0, w, h);    // the bounce over the whole ceiling, then the glow along each edge
    const e = 150;
    for (const [x0, y0, x1, y1, gx0, gy0, gx1, gy1] of [[0, 0, w, e, 0, 0, 0, e], [0, h - e, w, h, 0, h, 0, h - e], [0, 0, e, h, 0, 0, e, 0], [w - e, 0, w, h, w, 0, w - e, 0]]) {
      const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, "rgba(255,226,190,0.9)"); gr.addColorStop(1, "rgba(255,226,190,0)");
      g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  });
  ceilGlow.wrapS = ceilGlow.wrapT = THREE.ClampToEdgeWrapping;
  ceilMat = ceilP.clone(); ceilMat.emissiveMap = ceilGlow; ceilMat.emissive = new THREE.Color("#ffe2c0"); ceilMat.userData = { ratio: ceilP.userData.ratio, ch: "ceil" };
  paintMats.set("ceilglow", reg(ceilMat));
  for (const [xa, xb, za, zb] of LS.ceiling) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry((xb - xa) * M, (zb - za) * M), ceilMat);
    m.rotation.x = Math.PI / 2; m.position.copy(v3((xa + xb) / 2, C, (za + zb) / 2)); m.receiveShadow = true; m.castShadow = true; shell.add(m);   // v48: and the ceiling
  }
  livShade();
  // skirting, eggshell in the wall colour
  for (const [x0, y0, z0, x1, y1, z1] of LS.skirting) cube(x0, y0, z0, x1 - x0, y1 - y0, z1 - z0, egg, false);
  // the door, shut, with its frame and handle
  // v20, client: "door of room is also white": the door and its frame stay white satin, not the wall colour
  const doorW = reg(new THREE.MeshStandardMaterial({ color: "#efece5", roughness: 0.35 })), frameW = reg(new THREE.MeshStandardMaterial({ color: "#f3f1eb", roughness: 0.4 }));
  cube(dx0 - 6, 0, RZ - 1.5, 6, DH + 6, 2, frameW); cube(dx1, 0, RZ - 1.5, 6, DH + 6, 2, frameW);
  cube(dx0 - 6, DH, RZ - 1.5, dx1 - dx0 + 12, 6, 2, frameW);
  // V1.38: the leaf on its hinge at the breast's end (the house's door.living_door turns it: a walk opens it, or a tap)
  const brass = reg(new THREE.MeshStandardMaterial({ color: "#c9b58a", metalness: 0.9, roughness: 0.3 }));
  livLeaf = new THREE.Group(); livLeaf.name = "livLeaf"; livLeaf.position.copy(v3(dx0, 0, RZ + 1)); shell.add(livLeaf);
  const leafBox = (x, y, z, w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), m); me.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)).sub(livLeaf.position); livLeaf.add(shadow(me)); };
  leafBox(dx0, 0, RZ + 1, dx1 - dx0, DH, 4, doorW);
  for (const [y0, y1] of [[14, 98], [112, 186]]) leafBox(dx0 + 9, y0, RZ + 0.6, dx1 - dx0 - 18, y1 - y0, 0.5, doorW);
  leafBox(dx1 - 12, 100, RZ - 1.6, 9, 1.4, 2.6, brass);
  // the window: white frame, glass, a sill, the view out
  const white = reg(new THREE.MeshStandardMaterial({ color: "#f1efe9", roughness: 0.45 }));
  const fw = 6, mid = (wx0 + wx1) / 2;
  // v17: the frame sits back in a deep reveal (the jambs and head in the wall paint), with a deep white sill for the plants
  const REV = R.WINDOW_REVEAL, FZ = WZ - REV;
  /* v47.2, from the client's photo of the back of the house: three sections (narrow sides, a wide middle), a row of top lights, and white
     Georgian bars on the glass: two panes across in each side, three in the middle, three down under the top lights */
  const WD = R.WINDOW_DESIGN || { sections: [0.5, 0.5], top: 0.68, cols: [1, 1], rows: 1, frame: fw, mullion: 6, transom: 5, bar: 1.6 };
  const ww = wx1 - wx0, wh = wy1 - wy0, ty = wy0 + WD.top * wh;
  const parts = [[wx0, wy0, WD.frame, wh], [wx1 - WD.frame, wy0, WD.frame, wh], [wx0, wy0, ww, WD.frame], [wx0, wy1 - WD.frame, ww, WD.frame], [wx0, ty - WD.transom / 2, ww, WD.transom]];
  let sx = wx0; const secs = WD.sections.map(f => { const a = sx; sx += f * ww; return [a, sx]; });
  secs.slice(0, -1).forEach(([, b]) => parts.push([b - WD.mullion / 2, wy0, WD.mullion, wh]));
  parts.forEach(([x, y, w, h]) => cube(x, y, FZ - 4, w, h, 7, white));
  secs.forEach(([a, b], i) => {                                                                    // the bars, on the room side of the glass
    const x0 = a + (i ? WD.mullion / 2 : WD.frame), x1 = b - (i < secs.length - 1 ? WD.mullion / 2 : WD.frame), n = WD.cols[i] || 1;
    for (let k = 1; k < n; k++) cube(x0 + (x1 - x0) * k / n - WD.bar / 2, wy0 + WD.frame, FZ - 0.8, WD.bar, wh - 2 * WD.frame, 1.2, white);
    const y0 = wy0 + WD.frame, y1 = ty - WD.transom / 2;
    for (let r = 1; r < WD.rows; r++) cube(x0, y0 + (y1 - y0) * r / WD.rows - WD.bar / 2, FZ - 0.8, x1 - x0, WD.bar, 1.2, white);
  });
  cube(wx0 - 2, wy0, FZ, 2, wy1 - wy0, REV, wallP); cube(wx1, wy0, FZ, 2, wy1 - wy0, REV, wallP);   // the reveal's jambs
  cube(wx0 - 2, wy1, FZ, wx1 - wx0 + 4, 2, REV, wallP);                                          // ... and its head
  const SL = R.SILL;
  cube(wx0 - 4, SL.y - SL.t, FZ - 1, wx1 - wx0 + 8, SL.t, REV + 1 + SL.nose, white);              // the deep sill
  const glass = winGlass = reg(new THREE.MeshPhysicalMaterial({ color: "#dfe8ee", roughness: 0.02, transparent: true, opacity: 0.06, depthWrite: false }));
  glass.userData.envK = 0.4;   // review after v48: v44's glossy-surface reflections (2.4×) laid a white veil over the garden; the pane stays faint
  const pane = new THREE.Mesh(new THREE.PlaneGeometry((wx1 - wx0) * M, (wy1 - wy0) * M), glass);
  pane.position.copy(v3(mid, (wy0 + wy1) / 2, FZ - 1)); shell.add(pane);
  /* v48, client: "It's a floor up so take perspective into account": the garden picture is made from one eye in the room (the window's
     middle, at standing height), straight out and level (v48's garden_window.py, in git history), so hung square-on at d from that eye, at the size its angles
     give, it lines up: the lawn well below the sill, the trees and the hill across the valley at eye level, from anywhere in the room */
  const GV = R.GARDEN_VIEW || { eye: [mid, 150, WZ + 60], d: 1000, tan: [2.747, 0.839, 2.145] }, [tx, tu, td] = GV.tan;
  view = new THREE.Mesh(new THREE.PlaneGeometry(2 * GV.d * tx * M, GV.d * (tu + td) * M), new THREE.MeshBasicMaterial({ color: "#1d2535", toneMapped: false }));
  view.position.copy(v3(GV.eye[0], GV.eye[1] + GV.d * (tu - td) / 2, GV.eye[2] - GV.d)); shell.add(view);
  /* v53, client: "Can you make the garden visible through the window at any angle ... both gardens": from above (Whole room, Bird's eye,
     Dolls' house) the back garden is ground under the room: the house's back wall down to the lawn, the patio, the lawn, the path down
     the left, the fences, 25 m out (geometry.GARDEN). Looking out from inside, the photo stays (it carries the real garden) */
  { const GD = R.GARDEN || { drop: 260, length: 2500, patio: 0, path: 90, fence: 180, fence_r: 120 }, BG = R.HOUSE3 && R.HOUSE3.garden, y0 = -GD.drop, z0 = WZ - 30, z1 = z0 - GD.length, x0 = BG ? BG.x[0] : -12, x1 = BG ? BG.x[1] : Wd + 12;
    garden3d = new THREE.Group(); garden3d.visible = false; scene.add(garden3d);   // v55: in the scene, so it stays when Lower takes the room off
    const mat = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
    const flat = (xa, xb, za, zb, y, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(xb - xa) * M, Math.abs(zb - za) * M), m);
      p.rotation.x = -Math.PI / 2; p.position.copy(v3((xa + xb) / 2, y, (za + zb) / 2)); p.receiveShadow = true; garden3d.add(p); };
    const box = (xa, xb, ya, yb, za, zb, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(xb - xa) * M, Math.abs(yb - ya) * M, Math.abs(zb - za) * M), m);
      b.position.copy(v3((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2)); b.castShadow = b.receiveShadow = true; garden3d.add(b); };
    const zp = z0 - GD.patio;
    if (GD.patio > 0) flat(x0, x1, z0, zp, y0 + 2, mat("#a59f94"));                // a patio by the house (none: the lawn runs to the wall)
    const texd = (k, c, w, d) => { const T = R.HOUSE3 && houseTex(k); if (!T) return mat(c); const tx = texClone(T.map); tx.needsUpdate = true; tx.repeat.set(w / 100 / T.size[0], d / 100 / T.size[1]);
      return reg(new THREE.MeshStandardMaterial({ map: tx, roughness: 0.95 })); };   // v59: lawn and concrete, at their size
    const fence = (h, len = GD.length) => { const T = R.HOUSE3 && houseTex("fence"); if (!T) return mat("#6b5644"); const tx = texClone(T.map); tx.needsUpdate = true;   // V1.3: boarded, each board 10 wide
      tx.repeat.set(len / 100 / T.size[0], h / 100 / T.size[1]); return reg(new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9 })); };
    box(x0 - 4, x1 + 4, y0, y0 + GD.fence, z1, z1 - 4, fence(GD.fence, x1 - x0 + 8));   // V1.4: the far fence, 25 m out (the view photos)
    if (BG) {   /* V2.89 (N30), as the photos (survey_data.BACK_GARDEN): looking out from the west fence, the border, the path, its muscari
                   strip, the lawn to the trees, leaf litter under them; the east bed; the pad from the back door to the path */
      const xb = x1 - BG.border, xp = xb - BG.path, xe = xp - BG.edge, xl = x0 + BG.border_e, zl = z0 - BG.lawn_end, zd = z0 - BG.pad.d, FW = BG.fence_w;
      const bed = (n, ...cs) => canvasTex(256, 256, (g, w, h) => { const r = rnd(n); g.fillStyle = "#4a3b2c"; g.fillRect(0, 0, w, h);   // a metre of soil, leaves and flowers
          for (let i = 0; i < 260; i++) { g.fillStyle = cs[i % cs.length]; g.globalAlpha = 0.5 + r() * 0.5; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * (i % 3 ? 9 : 4), 0, 7); g.fill(); } }),
        PT = bed(11, "#4f6b34", "#5d7a3c", "#3f5a2c", "#56743a", "#4a3fb0", "#48662f", "#5d7a3c", "#3f5a2c", "#d9cf86"), LT = bed(23, "#5a4632", "#6b5a3e", "#3d4a2a", "#7a6646");
      const at = (T, w, d) => { const tx = texClone(T); tx.needsUpdate = true; tx.repeat.set(w / 100, d / 100); return reg(new THREE.MeshStandardMaterial({ map: tx, roughness: 0.95 })); };
      flat(xl, BG.pad.x0, z0, zd, y0, texd("lawn", "#55613f", BG.pad.x0 - xl, BG.pad.d));       // the lawn, beside the pad
      flat(xl, xe, zd, zl, y0, texd("lawn", "#55613f", xe - xl, BG.lawn_end - BG.pad.d));         // and to the trees
      flat(BG.pad.x0, xb, z0, zd, y0 + 1, texd("concrete", "#9b958a", xb - BG.pad.x0, BG.pad.d));  // the pad by the back door
      flat(xp, xb, zd, zl, y0 + 1, texd("concrete", "#9b958a", BG.path, BG.lawn_end));           // the path down the left (looking out)
      for (const [xa, xc, za] of [[xe, xp, zd], [xb, x1, z0], [x0, xl, z0]]) flat(xa, xc, za, zl, y0 + 0.5, at(PT, xc - xa, za - zl));   // the beds
      flat(x0, x1, zl, z1, y0 + 0.3, at(LT, x1 - x0, zl - z1));                                    // under the trees
      box(x0 - 4, x0, y0, y0 + BG.fence_e, z0 - 100, z1, fence(BG.fence_e));                       // the east fence, lower, its gate by the house
      box(x1, x1 + 4, y0, y0 + FW.low, z0, z0 - FW.low_to, fence(FW.low, FW.low_to)); box(x1, x1 + 4, y0, y0 + FW.h, z0 - FW.low_to, z1, fence(FW.h, GD.length - FW.low_to));   // the west, low by the house
    } else {
      flat(x0, x1 - GD.path, zp, z1, y0, texd("lawn", "#55613f", x1 - GD.path - x0, zp - z1));     // the lawn
      flat(x1 - GD.path, x1, zp, z1, y0 + 1, texd("concrete", "#9b958a", GD.path, zp - z1));      // the path down the left (looking out)
      box(x0 - 4, x0, y0, y0 + (GD.fence_r || GD.fence), z0 - 100, z1, fence(GD.fence_r || GD.fence)); box(x1, x1 + 4, y0, y0 + GD.fence, z0, z1, fence(GD.fence));   // the right one lower, its gate by the house
    }
    if (!R.HOUSE3) box(x0, x1, y0, 0, z0 + 30, z0, mat("#9a5a43"));               // the house's back wall below the room (brick), down to the lawn (v58: the built house has its own)
  }
  sillPlants(wx0, wx1, SL.y, FZ + 2, WZ + SL.nose - 1);
  // the radiator under the window, painted in
  const [rx0, rx1] = R.HOUSE3.living.radiator.x, [ry0, ry1] = R.HOUSE3.living.radiator.y, radP = paintMat(lum("#3b6e56") / BASE_L, true, false, "trim");
  for (let x = rx0; x < rx1 - 2; x += 5) cube(x, ry0, WZ + 3, 3.4, ry1 - ry0, 7, radP);
  // the coffee table (its footprint from the plan; drawn as a plain low table)
  const cof = R.COFFEE, cofM = reg(new THREE.MeshStandardMaterial({ color: "#2c2a28", roughness: 0.5 }));
  { const cw = cof.x[1] - cof.x[0], cd = cof.z[1] - cof.z[0], g = coffeeG = new THREE.Group();     // v18: movable in edit mode
    const pl = coffeePlain = new THREE.Group(); g.add(pl);                                            // v36: hidden while the lift-top stands here
    lb(pl, 0, 38, 0, cw, 4, cd, cofM);
    for (const [x, z] of [[-cw / 2 + 5, -cd / 2 + 5], [cw / 2 - 5, -cd / 2 + 5], [-cw / 2 + 5, cd / 2 - 5], [cw / 2 - 5, cd / 2 - 5]]) lb(pl, x, 0, z, 4, 38, 4, cofM);
    movable("coffee", "Coffee table", g, () => ({ x: (cof.x[0] + cof.x[1]) / 2, z: (cof.z[0] + cof.z[1]) / 2, rot: 0 }), cw, cd, [cofM]); }   // v27: it stays put (v26 moved it for an eighth seat)
  // v15: the rug, 230 × 160 in front of the sofa (geometry.RUG), with its design and a little thickness
  const RG = R.RUG, rugW = RG.x[1] - RG.x[0], rugD = RG.z[1] - RG.z[0];
  const rug = new THREE.Mesh(new THREE.BoxGeometry(rugW * M, 0.008, rugD * M),
    [0, 1, 2, 3, 4, 5].map(i => i === 2 ? reg(new THREE.MeshStandardMaterial({ map: RUG_TEX, roughness: 0.97, bumpMap: PILE, bumpScale: 0.35 }))
                                        : reg(new THREE.MeshStandardMaterial({ color: RG.cols[3], roughness: 1 }))));
  rug.position.y = 0.004; rug.rotation.y = Math.PI; rug.receiveShadow = true; rugMesh = rug;
  { const g = new THREE.Group(); g.add(rug);
    movable("rug", "Rug", g, () => ({ x: (RG.x[0] + RG.x[1]) / 2, z: (RG.z[0] + RG.z[1]) / 2, rot: 0 }), rugW, rugD, [], true); }
  // v15: the curtains, from the client's photo: long pencil-pleat panels to the floor in oatmeal, on a rail just under the ceiling strip
  // running 30 past the window each side; open (stacked either side) or drawn across (S.curtains)
  // "hessian curtains from dunelm with a wood rail": a coarse natural weave, on a 28 mm wooden pole with rings and ball finials
  const CU = R.CURTAIN, cloth = curtCloth = reg(new THREE.MeshStandardMaterial({ color: CU.col, roughness: 1, side: THREE.DoubleSide, map: HESSIAN, bumpMap: HESSIAN, bumpScale: 0.8 }));
  const wood = reg(new THREE.MeshStandardMaterial({ color: CU.pole_col, map: OAK_TEX, roughness: 0.5 }));  wood.userData.noTint = true;   // v26: yours, not the new oak
  const poleL = wx1 - wx0 + 2 * CU.ext, pole = new THREE.Mesh(new THREE.CylinderGeometry(CU.pole / 2 * M, CU.pole / 2 * M, poleL * M, 16), wood);
  pole.rotation.z = Math.PI / 2; pole.position.copy(v3((wx0 + wx1) / 2, CU.rail_y + CU.pole / 2, CU.z + 1)); shell.add(shadow(pole));
  for (const xf of [wx0 - CU.ext - CU.finial / 2, wx1 + CU.ext + CU.finial / 2]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(CU.finial / 2 * M, 16, 12), wood); f.position.copy(v3(xf, CU.rail_y + CU.pole / 2, CU.z + 1)); shell.add(shadow(f));
  }
  { const rings = [];                                                     // rings, one every 10 cm (v22: one mesh)
    for (let x = wx0 - CU.ext + 3; x < wx1 + CU.ext - 2; x += 10) {
      const g = new THREE.TorusGeometry(0.02, 0.0035, 6, 16); g.rotateY(Math.PI / 2); const q = v3(x, CU.rail_y + CU.pole / 2, CU.z + 1); g.translate(q.x, q.y, q.z); rings.push(g); }
    shell.add(new THREE.Mesh(mergeGeometries(rings), wood)); }
  const panel = (x0, w, folds) => {
    const g = new THREE.PlaneGeometry(w * M, (CU.rail_y - CU.drop_to) * M, Math.round(folds * 8), 1), pos = g.attributes.position;
    // v39: folds CU.amp deep (clear of the radiator's face); behind each rear speaker's pole the cloth lies flat at the stand's dent
    const amp = (CU.amp || 2.6) * M, ST = R.REAR_STAND, dentZ = ST && ST.dent !== undefined ? (CU.z - ST.dent) * M : 0, hw = (R.REAR_SPK ? R.REAR_SPK[0] / 2 : 0) + 2;
    for (let i = 0; i < pos.count; i++) {
      const rx = x0 + w / 2 + pos.getX(i) / M, fold = Math.sin(pos.getX(i) / (w * M) * Math.PI * 2 * folds / 2) * amp;
      let k = 0; if (ST && ST.dent !== undefined) for (const [sx] of R.REAR_SPOTS) { const d = Math.abs(rx - sx); k = Math.max(k, d <= hw ? 1 : d < hw + 6 ? 1 - (d - hw) / 6 : 0); }
      pos.setZ(i, fold * (1 - k) + dentZ * k); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, cloth); m.position.copy(v3(x0 + w / 2, (CU.rail_y + CU.drop_to) / 2, CU.z)); m.rotation.y = Math.PI;
    return shadow(m);
  };
  curtOpen = new THREE.Group(); curtShut = new THREE.Group();
  curtOpen.add(panel(wx0 - CU.ext, CU.stack, CU.folds), panel(wx1 + CU.ext - CU.stack, CU.stack, CU.folds));
  const half = (wx1 - wx0) / 2 + CU.ext;
  curtShut.add(panel(wx0 - CU.ext, half, CU.folds * 2.2), panel(wx0 - CU.ext + half, half, CU.folds * 2.2));
  shell.add(curtOpen, curtShut);
  // shelf B: the client's 2 m black floating shelf on the stairs wall
  const sb = R.SHELF_B, black = shelfMat = reg(new THREE.MeshStandardMaterial({ color: "#1a1a1b", map: BLANK, roughness: 0.55 }));
  cube(Wd - sb.d, sb.top - sb.t, sb.z[1], sb.d, sb.t, sb.z[0] - sb.z[1], black);
  // v16: "on the left of that shelf is my ikea light box" ... "black not white": the OBEGRÄNSAD panel, black, standing landscape against
  // the wall at the shelf's stair end; its 16 x 16 LEDs fill a square in the middle of the face
  const LB = R.LIGHTBOX, lbBlack = reg(new THREE.MeshStandardMaterial({ color: "#121213", roughness: 0.5 }));
  cube(Wd - 1 - LB.d, sb.top, LB.z[1], LB.d, LB.h, LB.z[0] - LB.z[1], lbBlack);
  const lbS = LB.h - 4;
  lboxFace = new THREE.Mesh(new THREE.PlaneGeometry(lbS * M, lbS * M), new THREE.MeshBasicMaterial({ map: LBOX_TEX, toneMapped: false }));
  lboxFace.position.copy(v3(Wd - 1 - LB.d - 0.15, sb.top + LB.h / 2, (LB.z[0] + LB.z[1]) / 2)); lboxFace.rotation.y = Math.PI / 2; shell.add(lboxFace);   // v16: faces the room (it faced the wall)
  // v15: "add my small laser from the middle": a small star projector on the shelf; its dots land on the ceiling over the room
  const LZ = R.LASER, [lw, lh, ld] = LZ.size;
  cube(Wd - 6 - lw, sb.top, LZ.z - ld / 2, lw, lh, ld, reg(new THREE.MeshStandardMaterial({ color: "#202124", roughness: 0.35, metalness: 0.3 })));
  const dots = [], dcol = [], rr = rnd(17), gcol = new THREE.Color("#39ff7a"), bcol = new THREE.Color("#4d7dff"), rcol = new THREE.Color("#ff3b5c");
  for (let i = 0; i < 260; i++) {                 // a fan of dots from the projector, over the ceiling and the top of the walls
    const a = (rr() - 0.5) * 2.4, d = 60 + Math.pow(rr(), 0.6) * 340;
    let x = Wd - 10 - Math.cos(a) * d, z = LZ.z + Math.sin(a) * d * 1.2, y = C - 0.4;
    if (x < 2 || z < WZ + 2 || z > AD - 2) continue;
    dots.push(-x * M, y * M, z * M);
    const c = rr() < 0.7 ? gcol : rr() < 0.5 ? bcol : rcol; dcol.push(c.r, c.g, c.b);
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3)); dg.setAttribute("color", new THREE.Float32BufferAttribute(dcol, 3));
  laserDots = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.018, vertexColors: true, toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false }));
  shell.add(laserDots);
  // v15: "make the hanging plant on the wall shelf actually hang": a pot at the window end, its strands trailing down off the shelf.
  // v36: its own group (plantBG). v37: it stays here, at the shelf's window end, now 10 short of the boxing (v36's plant shelf is gone)
  plantBG = new THREE.Group(); shell.add(plantBG);
  floraSpot(plantBG, () => hangPlant(plantBG, Wd - sb.d / 2 - 1, sb.top, R.PLANT_B.z, [Wd - sb.d - 1], 4, R.PLANT_THROUGH_GAP ? [sb.z[1], R.PIPE_BOX.z[1]] : null));   // v40: rebuilt with Look's plants   // v38: through the 10 cm gap
  // v15: "either add my hat there or give it a wallstand": an oak peg on the stairs wall with the hat on it. v16: off until the photo
  if (R.HAT_PEG) {
  const HP = R.HAT_PEG, oakM = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, HP.d * M, 20), oakM); peg.rotation.z = Math.PI / 2; peg.position.copy(v3(Wd - HP.d / 2, HP.y, HP.z)); shell.add(shadow(peg));
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 24), oakM); rose.rotation.z = Math.PI / 2; rose.position.copy(v3(Wd - 0.6, HP.y, HP.z)); shell.add(rose);
  const felt = reg(new THREE.MeshStandardMaterial({ color: "#6b5a48", roughness: 0.95 })), band = reg(new THREE.MeshStandardMaterial({ color: "#2b2622", roughness: 0.6 }));
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.008, 40), felt);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.11, 32), felt); crown.position.y = 0.058;
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.0905, 0.0915, 0.022, 32), band); ribbon.position.y = 0.016;
  hat.add(shadow(brim), shadow(crown), ribbon);
  // resting on the peg, crown up and tipped a little towards the room, as a hat sits on a hook
  hat.rotation.z = -0.22; hat.position.copy(v3(Wd - 15, HP.y + 1.5, HP.z)); shell.add(hat);
  }
  // ceiling LED strip: an emissive line round the room's edge
  ledMat = new THREE.MeshBasicMaterial({ color: "#ffd9a8", toneMapped: false });
  const ly = R.LED_Y - 0.8;
  [[0.5, WZ + 1, 1, AD - WZ - 2], [Wd - 1.5, WZ + 1, 1, front - WZ - 2]].forEach(([x, z, w, d]) => cube(x, ly, z, w, 0.8, d, ledMat, false));
  [[1, WZ + 0.5, Wd - 2], [1, AD - 1.5, A - 2], [B0, -1.5, B1 - B0], [B1, RZ - 1.5, wx - B1]].forEach(([x, z, w]) => cube(x, ly, z, w, 0.8, 1, ledMat, false));
  // v38 (item 12): the feature ceilings to try (Look → The ceiling): hidden groups, shown by applyCeiling()
  if (R.CEIL_DESIGNS) { const CD = R.CEIL_DESIGNS, put = (grp, x, y, z, w, h, d, mat) => {          // a box from its min corner, in a group
      const m = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), mat); m.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); m.receiveShadow = true; grp.add(m); };
    const beamM = reg(new THREE.MeshStandardMaterial({ color: "#8a5f3c", map: OAK_TEX, roughness: 0.7, bumpMap: WALL_BUMP, bumpScale: 1.2 }));
    CEIL_G.beams = new THREE.Group(); CEIL_G.coffers = new THREE.Group(); CEIL_G.cove = new THREE.Group();
    const B = CD.beams; for (const [x, z0, z1] of B.runs) put(CEIL_G.beams, x - B.w / 2, C - B.d, z0, B.w, B.d, z1 - z0, beamM);
    const K = CD.coffers; for (const [x, z0, z1] of K.runs) put(CEIL_G.coffers, x - K.w / 2, C - K.d, z0, K.w, K.d, z1 - z0, ceilP);
    for (const z of K.z) put(CEIL_G.coffers, 0, C - K.d, z - K.w / 2, K.x_to, K.d, K.w, ceilP);
    const V = CD.cove, cv = CEIL_G.cove;                                                                // the coving round the walls, its LED on top
    // where it fits: the window wall, the side wall to the alcove, the breast, the recess (not the alcove: the media wall's uprights reach the ceiling; not the stairs wall: the light box)
    for (const [x, z, w, d] of [[0, WZ + V.d, V.d, -WZ - V.d], [0, WZ, Wd, V.d], [B0, -V.d, B1 - B0, V.d], [B1, RZ - V.d, wx - B1, V.d]]) {
      put(cv, x, C - V.h, z, w, V.h - 2, d, ceilP);
      const lx = w > d ? x : x + (x < 1 ? V.d - 1 : 0), lz = w > d ? z + (z === WZ ? V.d - 1 : 0) : z;
      put(cv, lx, C - 2, lz, w > d ? w : 1, 0.6, w > d ? 1 : d, ledMat); }
    for (const g of Object.values(CEIL_G)) { g.visible = false; shell.add(g); } }
  // v15: the side run's LED strip, under its front edge (on the uprights' driver)
  runLed = new THREE.MeshBasicMaterial({ color: "#ffd9a8", toneMapped: false });
  const SR = R.SIDE_RUN;
  for (let i = 0; i < SR.edge.length - 1; i++) {
    const [d1, z1] = SR.edge[i], [d2, z2] = SR.edge[i + 1];
    cube(Math.min(d1, d2) - 2, SR.under - 0.5, z2, Math.abs(d1 - d2) + 0.8, 0.5, z1 - z2, runLed, false);
  }
  pcLit();
  buildIdeas();
  buildPlantsAndRecords();
  buildCab(); buildBeside();                                                      // v26; v30: the compact cabinet; v31: beside it
  for (const k of ["mirror", "dresser", "rail", "bar", "shoes"]) if (BES[k]) mergeStatic(BES[k]);   // v39: fewer draws (doors and the trolley move: nested or left out)
  buildStairs();
  flushCubes(shell);
}
/* v38, client: "Make the stairs solid until the landing": the flight as one solid, a stepped profile run across its width, 13 risers
   up to a landing at the first floor, oak treads and a closed oak string on the open side. A stand-in shape (the stairs will change).
   The cutaway leaves it whole (its materials carry no clipping planes), so it never shows in slices. */
function buildStairs() {
  const FL = R.HOUSE3.living.flight, sx0 = FL.x0, sx1 = FL.x1, n = FL.n, r = FL.r, gq = FL.g, tb = 2.2, nose = 1.5;   // V1.46: the flight from the house file
  const z0 = FL.z0, zl = FL.zl, zl1 = FL.zl1, top = n * r;
  const noClip = m => { m.clippingPlanes = []; return m; };
  const body = noClip(paintMat(lum("#2d5a46") / BASE_L, true, false, "w:stairs").clone()); paintMats.set("stairbody", reg(body));
  const oak = noClip(reg(new THREE.MeshStandardMaterial({ color: "#b07a46", map: OAK_TEX, roughness: 0.55 })));
  const str = noClip(reg(new THREE.MeshStandardMaterial({ color: (R.BANISTER || {}).col ? R.BANISTER.col[0] : "#ece9e2", roughness: 0.45 })));   // v41: the string painted white, as in your photo
  const g = new THREE.Group(); g.name = "stairs"; shell.add(g);
  const solid = (pts, xa, xb, mat) => {     // a profile in (z, y), run across x from xa to xb
    const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z * M, y * M)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: (xb - xa) * M, bevelEnabled: false });
    geo.rotateY(-Math.PI / 2); geo.translate(-xa * M, 0, 0);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / GRAIN, uv.getY(i) / GRAIN);
    g.add(shadow(new THREE.Mesh(geo, mat)));
  };
  const prof = [[z0, 0]];                    // the body: risers and treads (under the boards) down to the floor, the landing on top
  for (let i = 1; i < n; i++) prof.push([z0 + (i - 1) * gq, i * r - tb], [z0 + i * gq, i * r - tb]);
  prof.push([zl, top - tb], [zl1, top - tb], [zl1, 0]);
  /* V1.59, the client: "when on ground floor view and looking down the stairs there is strange clipping and green blocks": past the living
     room's back wall the flight runs on over the hall and the lower stairs, where the house has its own walls round it; there its body
     fought those walls and showed the living room's green. That part is the hall's off-white now, and drawn behind the house's walls */
  const RZ = R.RECESS_Z, steps = prof.slice(1, -1), yAt = z => { let y = 0; for (const [pz, py] of steps) if (pz <= z + 1e-6) y = py; return y; };
  const inner = [[z0, 0], ...steps.filter(([pz]) => pz < RZ), [RZ, yAt(RZ)], [RZ, 0]];
  const outer = [[RZ, 0], [RZ, yAt(RZ)], ...steps.filter(([pz]) => pz > RZ), [zl1, 0]];
  solid(inner, sx0 + 0.2, sx1 - 0.2, body);
  const hallSide = noClip(reg(new THREE.MeshStandardMaterial({ color: "#e9e5dd", roughness: 0.85, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 })));
  solid(outer, sx0 + 0.6, sx1 - 0.6, hallSide);
  for (let i = 1; i < n; i++) solid([[z0 + (i - 1) * gq - nose, i * r - tb], [z0 + i * gq, i * r - tb], [z0 + i * gq, i * r], [z0 + (i - 1) * gq - nose, i * r]], sx0, sx1, oak);
  solid([[zl - nose, top - tb], [zl1, top - tb], [zl1, top], [zl - nose, top]], sx0, sx1, oak);   // the landing's boards
  const pitch = z => r + (z - z0) / gq * r, zf = z0 + (21 - r) / r * gq;   // the string: 24 deep along the pitch line, capped 3 over it
  solid([[z0, 0], [zf, 0], [zl, top - 21], [zl1, top - 21], [zl1, top + 3], [zl, top + 3], [z0, pitch(z0) + 3]], sx0 - 2.2, sx0 - 0.2, str);
}
/* v40: the flip-top's chair cupboard, its hooks and the fold-down seat are gone (never shown since the dining cabinet became the only
   table in v33; the code is in git history, v40) */
function placeChairs() { placeOptC(); }

