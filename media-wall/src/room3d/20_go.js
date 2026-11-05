/* ---------------------------------------------------------------- go: built the first time the room is on screen (v14.1) */
let started = false;
/* v48 §6: the sun by day, through the window: it casts the frame, the bars and the sill's plants onto the sill, the sofa and the floor.
   Its direction (geometry.SUN: degrees round from straight out of the window towards the room's +x, and up): v49, 7 am in June, low from
   the right (the back faces 14° east of north: the only sun the room gets is on spring and summer mornings). Always in the scene (a light coming and going would rebuild every shader), dark by night
   and in Fast, which has no shadows. */
const SUNCFG = { lux: 80, out: 0.5 };   // tuned on stills: the bars' shadows read on the sofa, the ottoman and the rug, the floor not washed out; outside (V1.3), higher in the sky, half
/* v54, client: "You have rough measurements now and pictures so I'd like you to run the drafts" (every floor and both gardens): each
   floor laid out as a plan in 3D (floors, walls cut at 110 like a dolls' house, solid walls dark, windows blue, doors brown, each room
   named with its use and rough size), the ground floor round the real living room, the lower ground floor to the east and the first
   floor to the west at their own levels, the front drive and lawn. From house/house.py (the client's corrected plans, the agent's sizes) */
/* v59: real surfaces for the built house, drawn in the page (the shared page can't load picture files into the 3D room), sized to the
   world so a brick is a brick on every wall: stretcher-bond brick in the photos' reds, concrete roof tiles in rows, the dormer's hung
   tiles, lawn, concrete, paving, road, carpet, the kitchen's floor tiles, boards. Each: the canvas and the metres it covers */
const HTEX = {}, HI_T = new Set(["paint", "ceiling", "stone", "marble", "metro", "tile_w", "tile_f", "pine", "oak", "birch", "door_wood", "chalk"]);
/* V2.2, the client: "make sure ceilings are all white with ability to customise other than our living room picks so far": the house's
   ceilings (flat and artex) white, or the colour picked in View (the living room's ceiling keeps Look's) */
function hceilApply() {
  if (!HMATS) return; const hex = /^#[0-9a-f]{6}$/i.test(S.hceil || "") ? S.hceil : null;
  for (const k of ["ceiling", "artex"]) { const m = HMATS[k]; if (!m) continue;
    if (!m.userData.c0) m.userData.c0 = m.color.clone();
    if (hex) m.color.set(hex).multiplyScalar(m.map ? 1 / 0.95 : 1); else m.color.copy(m.userData.c0); }
}
/* V2.5 (docs/FINISHES_PLAN.md F2): the palette. A wall's or a ceiling's colour per room and per side, without a new draw or shader: a plan
   of the rooms (a picture, 2 cm a pixel, one band per floor: which room each spot is) and a palette (a picture, a row per room: back, front,
   east, west, ceiling). The walls' and ceilings' shader looks up the room 3 cm in front of each face and its side from the face's normal; a
   palette pixel with no colour leaves the face as drawn. R3D.finish(room, "walls" | side | "ceiling", "#hex" | null) writes one pixel. */
const FIN = { W: 234, H: 404, map: null, pal: null, rooms: [], kind: { paint: 0, ceiling: 1, artex: 1 } };   // V2.8: not the stair wall: it's the living room's (Look)
function finSetup() {
  if (FIN.map || !R.HOUSE3 || !R.HOUSE3.finish_pieces) return FIN.map;
  FIN.rooms = R.HOUSE3.finish_rooms;
  const W = FIN.W, H = FIN.H, d = new Uint8Array(W * H * 3);
  ["lower", "ground", "first"].forEach((f, fi) => { for (const [ri, x0, x1, z0, z1] of R.HOUSE3.finish_pieces[f] || []) {
    for (let j = Math.max(0, Math.floor((z0 + 309) / 2)); j < Math.min(H, Math.ceil((z1 + 309) / 2)); j++)
      for (let i = Math.max(0, Math.floor(x0 / 2)); i < Math.min(W, Math.ceil(x1 / 2)); i++) d[(fi * H + j) * W + i] = ri + 1; } });
  FIN.map = new THREE.DataTexture(d, W, H * 3, THREE.RedFormat, THREE.UnsignedByteType);
  FIN.pal = new THREE.DataTexture(new Uint8Array(8 * 64 * 4), 8, 64, THREE.RGBAFormat, THREE.UnsignedByteType);
  for (const t of [FIN.map, FIN.pal]) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; }
  return FIN.map;
}
function finPatch(m, k) {   // the walls' and ceilings' materials read the palette (their program keyed apart, so nothing else changes)
  if (!(k in FIN.kind) || !finSetup()) return m;
  const room = -1, scale = m.map ? 1 / 0.95 : 1;
  m.customProgramCacheKey = () => "finish" + FIN.kind[k] + (room > 0 ? "r" : "");
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { finMap: { value: FIN.map }, finPal: { value: FIN.pal }, finKind: { value: FIN.kind[k] }, finRoom: { value: room }, finScale: { value: scale } });
    sh.vertexShader = "varying vec3 vFinP;\nvarying vec3 vFinN;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vFinP = transformed; vFinN = objectNormal;");
    sh.fragmentShader = "uniform sampler2D finMap;\nuniform sampler2D finPal;\nuniform float finKind;\nuniform float finRoom;\nuniform float finScale;\nvarying vec3 vFinP;\nvarying vec3 vFinN;\n" +
      sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec3 finD = diffuse;
  { vec3 fn = normalize(vFinN); float xc = -vFinP.x * 100.0, zc = vFinP.z * 100.0, yc = vFinP.y * 100.0;
    int fl = yc < 0.0 ? 0 : (yc < 260.0 ? 1 : 2); int rm = int(finRoom);
    if (rm < 0) { float o = finKind < 0.5 ? 3.0 : 0.0;
      ivec2 t = ivec2(int(clamp(floor((xc - fn.x * o) / 2.0), 0.0, ${FIN.W - 1}.0)), int(clamp(floor((zc + fn.z * o + 309.0) / 2.0), 0.0, ${FIN.H - 1}.0)) + fl * ${FIN.H});
      rm = int(texelFetch(finMap, t, 0).r * 255.0 + 0.5); }
    if (rm > 0) { float nx = -fn.x, nz = fn.z; int sl = finKind > 0.5 ? 4 : (abs(nx) > abs(nz) ? (nx > 0.0 ? 2 : 3) : (nz > 0.0 ? 0 : 1));
      vec4 fc = texelFetch(finPal, ivec2(sl, rm), 0); if (fc.a > 0.5) finD = fc.rgb * finScale; } }
  vec4 diffuseColor = vec4( finD, opacity );`);
  };
  return m;
}
const FIN_SLOT = { back: [0], front: [1], east: [2], west: [3], walls: [0, 1, 2, 3], ceiling: [4] };
function finish(room, surface, hex) {   // R3D.finish: a room's walls (or one side) or its ceiling to a colour; null puts it back as drawn; no room: every one
  if (!finSetup()) return false;
  const rows = room == null ? FIN.rooms.map((_, i) => i + 1) : [FIN.rooms.indexOf(room) + 1], slots = FIN_SLOT[surface || "walls"];
  if (!slots || rows.some(r => r < 1)) return false;
  const c = hex ? new THREE.Color(hex) : null, d = FIN.pal.image.data;   // linear, as the material's own colour
  for (const r of rows) for (const s of slots) { const i = (r * 8 + s) * 4;
    if (c) { d[i] = Math.round(Math.min(1, c.r) * 255); d[i + 1] = Math.round(Math.min(1, c.g) * 255); d[i + 2] = Math.round(Math.min(1, c.b) * 255); d[i + 3] = 255; } else d[i + 3] = 0; }
  FIN.pal.needsUpdate = true; dirty(); return true;
}
function houseTex(k) {
  if (k in HTEX) return HTEX[k];
  if (k === "paint") return (HTEX[k] = null);   // V2.2, the client: "ensure walls are all smooth": flat emulsion, no plaster relief
  /* v70 (BUILD_SPEC phase 3): CC0 photo-textures (Poly Haven, house/SOURCES.md) where we have them, inline so the shared page shows them
     too (loading from elsewhere failed there in v50); the drawn ones below stay for everything else and as the fallback */
  const pkey = { party: "brick", soldier: "brick", pillow: "duvet", mattress: "duvet", ceiling: "artex", knob: "pine_dark" }[k] || k, pm = PMETA[pkey];   // V1.21: the bedding's one cotton
  if (pm && pm.map) {   // V1.9: its mean colour and a flat relief until the photos land (loadPhotos), then the photo in the same texture
    const img = (f, srgb, fill) => { const t = canvasTex(4, 4, g => { g.fillStyle = fill; g.fillRect(0, 0, 4, 4); }, srgb);   // V1.11: as sharp at a slant as the card allows (was 4)
      whenPhoto(pkey, f, src => { decodeImg(src).then(im => { texSet(t, im); reshadow(); dirty(); }); }); return t; };
    const rg = pm.rough ? Math.round(pm.rough * 255) : 0, grey = `rgb(${rg},${rg},${rg})`;   // V1.30 (U5): its roughness map, if it has one
    return (HTEX[k] = { map: img("map", true, pm.avg || "#888888"), normal: pm.nor ? img("nor", false, "#8080ff") : null, size: [pm.size, pm.size], bump: 0,
      rough: pm.rough && !LOWD ? img("rough", false, grey) : null, roughMean: pm.rough || 0 });
  }
  let s = 7 + k.length * 101; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const noise = (g, w, h, n, a, cols) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = a * rnd(); g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } g.globalAlpha = 1; };
  const T = {
    brick: [0.90, 0.60, (g, w, h) => {                 // 4 bricks × 8 courses (21.5 × 6.5 + 1 cm joints)
      g.fillStyle = "#c2b6a6"; g.fillRect(0, 0, w, h);
      const cw = w / 4, ch = h / 8, jx = cw * 1 / 22.5, jy = ch * 1 / 7.5, reds = ["#b4583d", "#a94f37", "#bb6244", "#9e4a34", "#c06a4b", "#a65a3f", "#b0533a"];
      for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
        const x = c * cw + (r % 2 ? cw / 2 : 0); g.fillStyle = reds[Math.floor(rnd() * reds.length)];
        g.fillRect(x + jx / 2, r * ch + jy / 2, cw - jx, ch - jy);
        g.fillStyle = "rgba(0,0,0,0.10)"; g.fillRect(x + jx / 2, r * ch + ch - jy * 1.5, cw - jx, jy);
      }
      noise(g, w, h, 9000, 0.25, ["#000", "#fff", "#5a2a1c"]); }],
    tile: [1.20, 0.68, (g, w, h) => {                  // interlocking concrete tiles: 4 across, 2 rows of 34 gauge
      const tw = w / 4, th = h / 2, b = ["#7c5e4f", "#755748", "#836453", "#6f5345"];
      for (let r = 0; r < 2; r++) for (let c = -1; c < 5; c++) {
        const x = c * tw + (r % 2 ? tw / 2 : 0), y = r * th, col = b[Math.floor(rnd() * b.length)];
        const gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, col); gr.addColorStop(0.85, col); gr.addColorStop(1, "#3e2e26");
        g.fillStyle = gr; g.fillRect(x, y, tw, th);
        g.fillStyle = "rgba(255,240,225,0.10)"; g.fillRect(x + tw * 0.62, y, tw * 0.12, th * 0.9);
        g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x, y, 2, th);
      }
      noise(g, w, h, 7000, 0.3, ["#000", "#d8c8b8", "#4b5a3a"]); }],
    hung: [0.90, 0.60, (g, w, h) => {                  // V1.47, the client: "a cladding type material maybe wood on the sides of that part of the roof"
      const n = 4, bh = h / n, b = ["#5b3b29", "#523422", "#634230", "#57392a"];   // (the back photo): dark-stained timber weatherboards, 15 high, lapped
      for (let r = 0; r < n; r++) { const y = r * bh; g.fillStyle = b[r % b.length]; g.fillRect(0, y, w, bh);
        for (let i = 0; i < 60; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.10)" : "rgba(255,220,190,0.06)"; g.fillRect(rnd() * w, y + rnd() * bh, 40 + rnd() * 160, 1 + rnd() * 1.5); }   // the grain, along the board
        const gr = g.createLinearGradient(0, y + bh - 10, 0, y + bh); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.45)"); g.fillStyle = gr; g.fillRect(0, y + bh - 10, w, 10);   // the shadow under the lap
        g.fillStyle = "rgba(255,230,200,0.10)"; g.fillRect(0, y, w, 2); }
      noise(g, w, h, 2500, 0.2, ["#000", "#8a6a50"]); }],
    lawn: [1.0, 1.0, (g, w, h) => { g.fillStyle = "#5c6d40"; g.fillRect(0, 0, w, h); noise(g, w, h, 26000, 0.55, ["#46582f", "#6f8350", "#7d8f55", "#3c4a28"]); }],
    concrete: [1.2, 1.2, (g, w, h) => { g.fillStyle = "#aaa59c"; g.fillRect(0, 0, w, h); noise(g, w, h, 20000, 0.35, ["#7d7a73", "#c8c4bb", "#918d85"]); }],
    paving: [1.2, 1.2, (g, w, h) => { g.fillStyle = "#c3beb4"; g.fillRect(0, 0, w, h); noise(g, w, h, 12000, 0.3, ["#8f8b84", "#dad6cd"]);
      g.fillStyle = "#8d887f"; for (let i = 0; i < 2; i++) { g.fillRect(i * w / 2, 0, 3, h); g.fillRect(0, i * h / 2, w, 3); } }],
    road: [1.5, 1.5, (g, w, h) => { g.fillStyle = "#58585b"; g.fillRect(0, 0, w, h); noise(g, w, h, 30000, 0.45, ["#2f2f31", "#7c7c80", "#46464a"]); }],
    carpet: [0.5, 0.5, (g, w, h) => { g.fillStyle = "#cbbda4"; g.fillRect(0, 0, w, h); noise(g, w, h, 20000, 0.25, ["#a99a80", "#e0d3bb"]); }],
    tile_f: [0.6, 0.6, (g, w, h) => { g.fillStyle = "#dcd7ce"; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, 0.2, ["#b8b2a6", "#fff"]);
      g.fillStyle = "#a9a296"; for (let i = 0; i < 2; i++) { g.fillRect(i * w / 2, 0, 3, h); g.fillRect(0, i * h / 2, w, 3); } }],
    board: [1.2, 0.6, (g, w, h) => { const pl = ["#c4b296", "#bba98b", "#cbb99c", "#b6a283"];
      for (let i = 0; i < 4; i++) { g.fillStyle = pl[i]; g.fillRect(0, i * h / 4, w, h / 4); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, i * h / 4, w, 2); g.fillRect(rnd() * w, i * h / 4, 2, h / 4); }
      noise(g, w, h, 6000, 0.2, ["#7a6448", "#e6d6bb"]); }],
    chipboard: [0.6, 0.6, (g, w, h) => { g.fillStyle = "#c8ad80"; g.fillRect(0, 0, w, h);   // V1.26: the garage's chipboard box: pressed flakes
      noise(g, w, h, 9000, 0.55, ["#a88a5a", "#ddc596", "#8d7046", "#e8d4ab", "#b49461"]); }],
  };
  // v60: the kitchen (the client's photos): black bevelled metro tiles, the black speckled worktop, the grey wood-effect floor, chalkboard
  T.metro = [0.40, 0.40, (g, w, h) => {              // 20 × 10 tiles, 2 across × 4 down, light grout
    g.fillStyle = "#77797b"; g.fillRect(0, 0, w, h);
    const tw = w / 2, th = h / 4;
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) {
      const x = c * tw + (r % 2 ? tw / 2 : 0), y = r * th;
      g.fillStyle = "#131416"; g.fillRect(x + 3, y + 3, tw - 6, th - 6);
      g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x + 3, y + 3, tw - 6, 7); g.fillRect(x + 3, y + 3, 7, th - 6);
      g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x + 3, y + th - 10, tw - 6, 7);
    } }];
  T.worktop = [0.6, 0.6, (g, w, h) => { g.fillStyle = "#24262a"; g.fillRect(0, 0, w, h); noise(g, w, h, 16000, 0.6, ["#4a4d52", "#6c7076", "#111", "#8a8d92"]); }];
  T.laminate = [1.2, 0.8, (g, w, h) => {             // grey oak planks 120 × 20
    const pl = ["#aaa49b", "#9f998f", "#b3ada4", "#a49d93"];
    for (let i = 0; i < 4; i++) { g.fillStyle = pl[i]; g.fillRect(0, i * h / 4, w, h / 4);
      for (let k = 0; k < 40; k++) { g.strokeStyle = "rgba(90,82,72," + (0.08 + rnd() * 0.12) + ")"; g.lineWidth = 1 + rnd() * 2; const yy = i * h / 4 + rnd() * h / 4; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + rnd() * 8 - 4, w * 0.6, yy + rnd() * 8 - 4, w, yy + rnd() * 6 - 3); g.stroke(); }
      g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(0, i * h / 4, w, 2); g.fillRect((i % 2 ? 0.5 : 0.1) * w, i * h / 4, 2, h / 4); } }];
  T.chalk = [0.8, 1.0, (g, w, h) => {                // chalkboard paint, chalk doodles (no words)
    g.fillStyle = "#1f2120"; g.fillRect(0, 0, w, h); noise(g, w, h, 8000, 0.15, ["#fff", "#000"]);
    const cs = ["#ff6fb5", "#7fc8ff", "#ffa04d", "#f4f4f4", "#c58bff", "#ff5a5a"];
    for (let i = 0; i < 26; i++) { g.strokeStyle = cs[i % cs.length]; g.globalAlpha = 0.55 + rnd() * 0.3; g.lineWidth = 2 + rnd() * 2; g.beginPath();
      const x = rnd() * w, y = rnd() * h, s = 20 + rnd() * 60;
      if (i % 3 === 0) g.arc(x, y, s / 2, 0, Math.PI * 2); else { g.moveTo(x, y); g.bezierCurveTo(x + s, y - s * rnd(), x - s * rnd(), y + s, x + s * rnd(), y + s * 1.2); }
      g.stroke(); }
    g.globalAlpha = 1; }];
  T.oak = [1.2, 0.7, (g, w, h) => {                  // v61: the office's oak desk, grain along its length
    g.fillStyle = "#b9864f"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) { g.strokeStyle = "rgba(110,70,35," + (0.08 + rnd() * 0.18) + ")"; g.lineWidth = 1 + rnd() * 2.5; const yy = rnd() * h; g.beginPath(); g.moveTo(0, yy);
      g.bezierCurveTo(w * 0.33, yy + rnd() * 14 - 7, w * 0.66, yy + rnd() * 14 - 7, w, yy + rnd() * 10 - 5); g.stroke(); }
    noise(g, w, h, 5000, 0.15, ["#7a5230", "#e0b07a"]); }];
  T.carpet_grey = [0.5, 0.5, (g, w, h) => { g.fillStyle = "#6e6e72"; g.fillRect(0, 0, w, h); noise(g, w, h, 22000, 0.3, ["#4f4f53", "#8c8c90"]); }];
  T.check = [0.6, 0.6, (g, w, h) => {                // v62: bedroom 2's grey check duvet
    g.fillStyle = "#8a8b92"; g.fillRect(0, 0, w, h);
    for (const [c, a, s, o] of [["#4d4e55", 0.55, 64, 0], ["#e9e7e1", 0.5, 64, 22], ["#5f6068", 0.35, 128, 40]])
      for (let k = o; k < w; k += s) { g.globalAlpha = a; g.fillStyle = c; g.fillRect(k, 0, s / 6, h); g.fillRect(0, k, w, s / 6); }
    g.globalAlpha = 1; }];
  T.marble = [1.2, 1.2, (g, w, h) => {              // v65: the bathroom's floor, black marble-effect 60 × 60, white veins
    g.fillStyle = "#121214"; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, 0.25, ["#2a2a2e", "#000"]);
    for (let i = 0; i < 9; i++) { g.strokeStyle = "rgba(235,235,240," + (0.25 + rnd() * 0.45) + ")"; g.lineWidth = 0.8 + rnd() * 1.8; g.beginPath();
      let x = rnd() * w, y = rnd() * h; g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (rnd() - 0.3) * 70; y += (rnd() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = "#4a4a4f"; for (let i = 0; i < 2; i++) { g.fillRect(i * w / 2, 0, 2, h); g.fillRect(0, i * h / 2, w, 2); } }];
  T.stone = [0.6, 0.6, (g, w, h) => {               // v65: the bathroom's walls, stone-effect grey 60 × 30, laid in courses
    g.fillStyle = "#cbc6bd"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) { g.strokeStyle = "rgba(150,142,130," + (0.12 + rnd() * 0.25) + ")"; g.lineWidth = 1 + rnd() * 2; const yy = rnd() * h; g.beginPath(); g.moveTo(0, yy);
      g.bezierCurveTo(w * 0.33, yy + rnd() * 6 - 3, w * 0.66, yy + rnd() * 6 - 3, w, yy + rnd() * 4 - 2); g.stroke(); }
    g.fillStyle = "#8f8a82"; g.fillRect(0, 0, w, 3); g.fillRect(0, h / 2, w, 3); g.fillRect(0, 0, 3, h / 2); g.fillRect(w / 2, h / 2, 3, h / 2); }];
  /* v69 (B2), the client: "more realistic like our living room": the surfaces still flat, drawn the same way (no downloads, so the
     shared page shows them too), with a fine bump where the real thing has texture */
  const grain = (g, w, h, base, line, n, wave) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < n; k++) { g.strokeStyle = line + (0.06 + rnd() * 0.16) + ")"; g.lineWidth = 1 + rnd() * 2.2; const yy = rnd() * h; g.beginPath(); g.moveTo(0, yy);
      g.bezierCurveTo(w * 0.33, yy + rnd() * wave - wave / 2, w * 0.66, yy + rnd() * wave - wave / 2, w, yy + rnd() * wave / 2 - wave / 4); g.stroke(); } };
  const weave = (g, w, h, base, cols, step, a) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < w; k += step) { g.globalAlpha = a; g.fillStyle = cols[(k / step) % cols.length | 0]; g.fillRect(k, 0, step / 2, h); g.fillRect(0, k, w, step / 2); }
    g.globalAlpha = 1; noise(g, w, h, 9000, 0.2, cols); };
  T.fence = [0.9, 1.8, (g, w, h) => {               // V1.3: the gardens' fences, as the back photo: weathered featheredge boards, 10 wide, a rail's shadow
    const n = 9, bw = w / n;
    for (let k = 0; k < n; k++) { const t = rnd(); g.fillStyle = `rgb(${128 + t * 30},${100 + t * 22},${72 + t * 16})`; g.fillRect(k * bw, 0, bw, h);
      const gr = g.createLinearGradient(k * bw, 0, (k + 1) * bw, 0); gr.addColorStop(0, "rgba(0,0,0,0.16)"); gr.addColorStop(0.18, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(255,240,220,0.08)");
      g.fillStyle = gr; g.fillRect(k * bw, 0, bw, h); }
    for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "70,55,40" : "200,180,150"},${0.06 + rnd() * 0.1})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 30 + rnd() * 140); }
    for (const yy of [0.12, 0.88]) { g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, h * yy, w, 6); } }];
  T.ceiling = [0.6, 0.6, (g, w, h) => { g.fillStyle = "#f3f2ee"; g.fillRect(0, 0, w, h); noise(g, w, h, 26000, 0.14, ["#d6d3cb", "#ffffff", "#e6e3dc"]); }];   // textured (the photos' artex)
  T.pine = [0.9, 0.5, (g, w, h) => { grain(g, w, h, "#c99a55", "rgba(140,90,40,", 80, 18);
    for (let i = 0; i < 3; i++) { const x = rnd() * w, y = rnd() * h; const r = g.createRadialGradient(x, y, 1, x, y, 10 + rnd() * 8); r.addColorStop(0, "rgba(90,55,25,0.8)"); r.addColorStop(1, "rgba(90,55,25,0)"); g.fillStyle = r; g.fillRect(x - 20, y - 20, 40, 40); } }];
  T.birch = [1.0, 0.6, (g, w, h) => grain(g, w, h, "#dcc8a2", "rgba(160,130,90,", 60, 10)];
  T.door_wood = [0.8, 1.0, (g, w, h) => grain(g, w, h, "#b0713f", "rgba(110,60,25,", 70, 12)];
  T.door_white = [0.8, 0.8, (g, w, h) => { g.fillStyle = "#efece5"; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, 0.05, ["#d8d4cb"]); }];
  T.wardrobe = [0.8, 0.8, (g, w, h) => { g.fillStyle = "#f2f1ec"; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, 0.04, ["#dcdad3"]); }];
  T.rug = [0.25, 0.25, (g, w, h) => weave(g, w, h, "#5b5e66", ["#4b4e56", "#6a6d75", "#545760"], 8, 0.5)];
  T.duvet = [0.3, 0.3, (g, w, h) => weave(g, w, h, "#e9e6df", ["#dcd8cf", "#f3f1ec"], 6, 0.35)];
  T.lycksele = [0.3, 0.3, (g, w, h) => weave(g, w, h, "#5b6b78", ["#4e5d69", "#687886"], 6, 0.45)];
  T.storebox = [0.3, 0.3, (g, w, h) => weave(g, w, h, "#c9c1b2", ["#b9b1a2", "#d6cfc1"], 8, 0.4)];
  T.tapestry = [0.4, 0.4, (g, w, h) => weave(g, w, h, "#d9892a", ["#c97a20", "#e39a3c", "#d08327"], 6, 0.35)];
  T.tile_w = [0.3, 0.3, (g, w, h) => { g.fillStyle = "#c9c7c0"; g.fillRect(0, 0, w, h);   // the WC's 15 × 15 white tiles, grey grout
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { g.fillStyle = "#f2f2ef"; g.fillRect(c * w / 2 + 3, r * h / 2 + 3, w / 2 - 6, h / 2 - 6);
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(c * w / 2 + 3, r * h / 2 + 3, w / 2 - 6, 6); } }];
  T.party = T.brick; T.soldier = T.brick;
  if (!T[k]) return (HTEX[k] = null);
  const [sw, sh, draw] = T[k], px = !SMALL && HI_T.has(k) ? 1024 : 512, tex = canvasTex(px, px, (g, w, h) => { g.scale(w / 512, h / 512); draw(g, 512, 512); });   // v72 (B3): the surfaces seen close drawn at 1k on a computer (the same drawing, crisper), 512 on a phone
  const BUMP = { paint: 0.4, ceiling: 1.2, pine: 0.4, birch: 0.3, door_wood: 0.4, rug: 1.5, duvet: 0.8, lycksele: 1.0, storebox: 1.0, tapestry: 0.9,
    tile_w: 0.8, carpet: 1.4, carpet_grey: 1.4, brick: 1.2, hung: 0.6, tile: 1.0, stone: 0.5, metro: 0.6, laminate: 0.4, oak: 0.4, marble: 0.3 };   // v69
  return (HTEX[k] = { map: tex, size: [sw, sh], bump: BUMP[k] || 0 });
}
/* world-sized UVs (metres over the texture's size), by the face's direction: floors and roofs from above, walls from the side; roof
   slopes measured along the slope (35°) so the tile rows keep their gauge */
/* V1.3: the gardens' plants (survey_data.PLANTS, from the client's photos). A cordyline: a grey-brown trunk forking into heads of long,
   narrow leaves, the young ones up, the old ones arching out and down; one merged mesh for the trunks, one for the leaves */
function buildPlants(grp) {
  const PL = (R.HOUSE3 && R.HOUSE3.plants) || []; if (!PL.length || !grp) return;
  const bark = reg(new THREE.MeshStandardMaterial({ color: "#8a7e70", roughness: 0.95 })), leaf = reg(new THREE.MeshStandardMaterial({ color: "#5b7a38", roughness: 0.6, side: THREE.DoubleSide }));
  bark.clippingPlanes = []; leaf.clippingPlanes = [];
  let sd = 4242; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const Y = new THREE.Vector3(0, 1, 0);
  buildTrees(grp, PL.filter(P => P.kind !== "cordyline"));                        // V1.4: the far end's trees
  for (const P of PL.filter(P => P.kind === "cordyline")) {
    const trunks = [], leaves = [], base = v3(P.x, P.y, P.z);
    const seg = (a, b, r0, r1) => { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, 8, 1, true);
      g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())); g.translate(a.x, a.y, a.z); trunks.push(g); };
    const strip = (o, yaw, pitch, len) => {   // a leaf: five segments bending down as it goes, tapering to a point
      const pos = [], idx = [], side = new THREE.Vector3(Math.cos(yaw + Math.PI / 2), 0, Math.sin(yaw + Math.PI / 2)), wd = 0.022;
      let p = o.clone(), a = pitch;
      for (let i = 0; i <= 5; i++) { const w = wd * (1 - i / 5.5); pos.push(p.x - side.x * w, p.y, p.z - side.z * w, p.x + side.x * w, p.y, p.z + side.z * w);
        if (i < 5) { const st = len / 5; p = p.clone().add(new THREE.Vector3(Math.cos(yaw) * Math.cos(a) * st, Math.sin(a) * st, Math.sin(yaw) * Math.cos(a) * st)); a -= 0.16 + (1 - Math.max(0, pitch)) * 0.08; } }
      for (let i = 0; i < 5; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); leaves.push(g.toNonIndexed()); };
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
/* V1.4: the far end's trees (survey_data.PLANTS, from the view photos): a clump of tall pale stems with branches and an airy crown,
   and a conifer, a dense dark column. Their leaves are drawn sprays on cards (cut out by their alpha), one instanced mesh a kind */
const SPRAY = {};
function sprayTex(k) {
  if (SPRAY[k]) return SPRAY[k];
  let sd = 77 + k.length; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const cols = { leaf: ["#5d7f35", "#4f7130", "#6b8c3c", "#45652b", "#789a45"], dark: ["#2f4d27", "#3a5a2c", "#28421f", "#456634"], needle: ["#2c4a26", "#36552c", "#22391d", "#3f5f31"] }[k];
  return (SPRAY[k] = canvasTex(256, 256, (g, w, h) => {
    if (k === "needle") {                                      // fronds: a stalk with short needles both sides
      for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, L = w * (0.25 + rnd() * 0.2), x0 = w / 2 + Math.cos(a) * w * 0.06, y0 = h / 2 + Math.sin(a) * h * 0.06;
        g.strokeStyle = cols[i % cols.length]; g.lineWidth = 3;
        for (let t = 0; t < 1; t += 0.06) { const x = x0 + Math.cos(a) * L * t, y = y0 + Math.sin(a) * L * t, n = 14 * (1 - t * 0.6);
          for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + sg * 0.9) * n, y + Math.sin(a + sg * 0.9) * n); g.stroke(); } } }
      return; }
    for (let i = 0; i < 34; i++) {                             // leaves round the spray's middle, each a pointed oval with its midrib
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * w * 0.36, x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r, L = w * (0.09 + rnd() * 0.05);
      g.save(); g.translate(x, y); g.rotate(rnd() * Math.PI * 2); g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * 0.42, L, 0); g.quadraticCurveTo(0, L * 0.42, -L, 0); g.fill();
      g.strokeStyle = "rgba(20,35,10,0.35)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke(); g.restore(); }
  }));
}
function buildTrees(grp, list) {
  if (!list.length) return;
  let sd = 9157; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const Y = new THREE.Vector3(0, 1, 0), stems = { pale: [], dark: [] }, cards = { leaf: [], dark: [], needle: [] };
  const seg = (to, a, b, r0, r1) => { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, 7, 1, true);
    g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())); g.translate(a.x, a.y, a.z); to.push(g.toNonIndexed()); };
  for (const P of list) {
    const base = v3(P.x, P.y, P.z), H = P.h * M, S = P.spread * M / 2, card = (P.leaf || 60) * M;
    if (P.kind === "conifer") {                                // the trunk to near the top, the fronds in a column narrowing upwards
      seg(stems.dark, base, base.clone().add(new THREE.Vector3(0, H * 0.95, 0)), P.r * M, P.r * 0.15 * M);
      for (let i = 0; i < 2200; i++) { const t = Math.pow(rnd(), 0.85), a = rnd() * Math.PI * 2, rr = S * Math.pow(1 - t, 0.8) * (0.45 + 0.55 * Math.sqrt(rnd()));
        cards.needle.push([base.x + Math.cos(a) * rr, base.y + H * (0.05 + 0.95 * t), base.z + Math.sin(a) * rr, card * (0.7 + rnd() * 0.5)]); }
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
    const per = Math.round((P.cards || 1400) / ends.length), to = P.dark ? cards.dark : cards.leaf;
    for (const e of ends) for (let i = 0; i < per; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * S * 0.4, q = Math.sqrt(1 - u * u);
      to.push([e.x + Math.cos(a) * q * rr, e.y + u * rr * 0.65, e.z + Math.sin(a) * q * rr, card * (0.7 + rnd() * 0.6)]); }
  }
  for (const [k, list2] of Object.entries(stems)) if (list2.length) {
    const m = new THREE.Mesh(mergeGeometries(list2), reg(new THREE.MeshStandardMaterial({ color: k === "pale" ? "#a59f95" : "#5b4b3d", roughness: 0.95 })));
    m.material.clippingPlanes = []; m.castShadow = m.receiveShadow = true; m.raycast = () => {}; grp.add(m); }
  const o = new THREE.Object3D(), plane = new THREE.PlaneGeometry(1, 1);
  for (const [k, list2] of Object.entries(cards)) if (list2.length) {
    const mt = reg(new THREE.MeshStandardMaterial({ map: sprayTex(k), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 })); mt.clippingPlanes = [];
    const im = new THREE.InstancedMesh(plane, mt, list2.length);
    list2.forEach(([x, y, z, sz], i) => { o.position.set(x, y, z); o.rotation.set((rnd() - 0.5) * 1.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.6); o.scale.setScalar(sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = im.receiveShadow = true; im.raycast = () => {}; grp.add(im); }
}
/* V1.4: past the far fence (survey_data.BEYOND, from the view photos): the long low building with grey sheet roofs (with Gardens), and
   the hill opposite with its rows of houses across the valley (with the ground: the land, always there outside), hazy with distance */
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
      for (let k = 0; k < 26; k++) { const u = rnd() * 2 - 1, b = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * h * 0.38, q = Math.sqrt(1 - u * u);
        to.push(v3(cx + Math.cos(b) * q * rr, (B.hill ? B.hill.base : -262) + h * 0.62 + u * rr * 0.7, cz + Math.sin(b) * q * rr)); } }
    const plane = new THREE.PlaneGeometry(1, 1);
    for (const [k, pts] of Object.entries(list)) {
      const mt = reg(new THREE.MeshStandardMaterial({ map: sprayTex(k), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 })); mt.clippingPlanes = [];
      const im = new THREE.InstancedMesh(plane, mt, pts.length);
      pts.forEach((p, i) => { o.position.copy(p); o.rotation.set((rnd() - 0.5) * 1.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.2); o.scale.setScalar(2.4 + rnd() * 1.6); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.raycast = () => {}; land.add(im); }
  }
}
/* V1.6: the things in the gardens (survey_data.GARDEN_THINGS, from the view photos): ours (the round table and its chairs, with Gardens)
   and next door's (the trampoline, the sheds, with Next door); and for the living room's window, next door's back lawns and fences */
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
    for (let c = 0; c < 22; c++) {                              // a cluster: a few short terraces stepping up the hill, not one long row
      const cx = rnd() * w, cy = rnd() * h, rows = 2 + Math.floor(rnd() * 4);
      for (let r = 0; r < rows; r++) { const y = cy + r * 26 * sc, n = 2 + Math.floor(rnd() * 4); let x = cx + (rnd() - 0.5) * 30 * sc;
        for (let k = 0; k < n; k++) { const run = (24 + rnd() * 50) * sc, rf = roofs[Math.floor(rnd() * roofs.length)], wl = walls[Math.floor(rnd() * walls.length)];
          for (const dx of [0, -w, w]) { const xx = (x + dx), yy = ((y % h) + h) % h;
            g.fillStyle = wl; g.fillRect(xx, yy + 7 * sc, run, 8 * sc); g.fillStyle = rf; g.fillRect(xx - 1.5 * sc, yy, run + 3 * sc, 8 * sc);
            g.fillStyle = "rgba(40,50,60,0.5)"; for (let q = xx + 4 * sc; q < xx + run - 3 * sc; q += 7 * sc) g.fillRect(q, yy + 9 * sc, 2.5 * sc, 3 * sc); }
          x += run + (4 + rnd() * 14) * sc; } } }
    for (let i = 0; i < 700; i++) { g.fillStyle = ["#3b4f2d", "#4a6136", "#33462a", "#55693d"][i % 4]; g.beginPath(); g.arc(rnd() * w, rnd() * h, (4 + rnd() * 11) * sc, 0, 7); g.fill(); }   // trees in front of the houses
  });
}
function worldUV(geo, k, off) {
  const T = houseTex(k); if (!T) return geo;
  const P = geo.attributes.position, N = geo.attributes.normal, uv = new Float32Array(P.count * 2), [sw, sh] = T.size, ox = off ? off.x : 0, oy = off ? off.y : 0, oz = off ? off.z : 0, sl = 1 / Math.cos(35 * Math.PI / 180);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + ox, y = P.getY(i) + oy, z = P.getZ(i) + oz, nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i));
    let u, v;
    if (ny > 0.3 && ny < 0.95 && (k === "tile" || k === "hung")) { const s2 = 1 / ny; if (nx > nz) { u = z; v = x * s2; } else { u = x; v = z * s2; } }   // v69: along the slope at its own pitch (the back is 50°)
    else if (ny >= 0.7) { u = x; v = z; }
    else if (nx > nz) { u = z; v = y; } else { u = x; v = y; }
    uv[2 * i] = u / sw; uv[2 * i + 1] = v / sh;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return geo;
}
/* V1.33 (U8, docs/UPGRADE_REVIEW.md), the client: "better in quality": the shade where things meet, made once: a soft dark band along
   every room's floor at its walls (and along its ceiling where the ceiling is flat: the lower and ground floors), and round the house
   where it meets the ground (the drive in front, the garden behind), so it sits on the ground and its rooms have corners. One mesh a
   floor; on every device (the live shade, GTAO, is only on the capable ones in HD); never in the way of a tap */
function houseShade(H3, m3) {
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(0,0,0,0.36)"); gr.addColorStop(0.35, "rgba(0,0,0,0.13)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mk = () => { const m = reg(new THREE.MeshBasicMaterial({ color: "#000000", alphaMap: null, map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -10 })); m.clippingPlanes = []; return m; };
  const matF = m3.shade_floor = mk(), matC = m3.shade_ceil = mk();
  const band = (pos, uv, a, b, inward, y, w, up) => {   // a quad from the edge a-b (room cm, at height y) w cm towards inward (unit [dx, dz])
    const P = [a, b, [b[0] + inward[0] * w, b[1] + inward[1] * w], [a[0] + inward[0] * w, a[1] + inward[1] * w]].map(([x, z]) => v3(x, y, z));
    const tri = up ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3], U = [[0, 1], [1, 1], [1, 0], [0, 0]];   // v 1 (the canvas's dark top) at the wall
    for (const i of tri) { pos.push(P[i].x, P[i].y, P[i].z); uv.push(U[i][0], U[i][1]); } };
  const mesh = (pos, uv, mat, into) => { if (!pos.length) return; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    const me = new THREE.Mesh(g, mat); me.raycast = () => {}; me.renderOrder = 1; into.add(me); };
  const FK = { "-260": "lower", "0": "ground", "260": "first" }, per = {};
  for (const [id, r] of Object.entries(H3.rooms || {})) {
    const fk = FK[String(r[4])]; if (!fk || !HFLOOR[fk]) continue;
    const [x0, x1, z0, z1, fy] = r, W = Math.min(26, (x1 - x0) / 3, (z1 - z0) / 3), P = per[fk] = per[fk] || { f: [[], []], c: [[], []] };
    const edges = [[[x0, z0], [x1, z0], [0, 1]], [[x1, z1], [x0, z1], [0, -1]], [[x0, z1], [x0, z0], [1, 0]], [[x1, z0], [x1, z1], [-1, 0]]];
    for (const [a, b, n] of edges) band(P.f[0], P.f[1], a, b, n, fy + 0.3, W, true);
    if (fk !== "first") for (const [a, b, n] of edges) band(P.c[0], P.c[1], a, b, n, fy + (H3.ceil || 235) - 0.3, W * 0.8, false);   // flat ceilings (the first floor's: below)
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
function buildHouse() {
  const HS = R.HOUSE; if (!HS) return;
  houseG = new THREE.Group(); houseG.visible = false; scene.add(houseG);
  let cur = houseG;                                                               // v55: each floor its own group (the floor picker)
  const TK = R.HOUSE3 ? { "#5d6a44": "lawn", "#b4afa5": "concrete", "#c9c5bd": "paving", "#5b5b5e": "road", "#a7a299": "paving", "#9a5a43": "brick", "#6b5644": "fence" } : {};   // v59; V1.3 the fences' boards
  const mats = {}, mat = c => mats[c] || (mats[c] = (() => { const T = TK[c] && houseTex(TK[c]); const m = reg(new THREE.MeshStandardMaterial({ color: T ? "#ffffff" : c, map: T ? T.map : null, normalMap: T && T.normal || null, roughness: 0.9 })); m.clippingPlanes = []; return m; })());   // v70: and the photo-textures' normals
  const box = (xa, xb, ya, yb, za, zb, c) => { const p = v3((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2), g = new THREE.BoxGeometry(Math.max(1, Math.abs(xb - xa)) * M, Math.max(1, Math.abs(yb - ya)) * M, Math.max(1, Math.abs(zb - za)) * M);
    if (TK[c]) worldUV(g, TK[c], p);
    const b = new THREE.Mesh(g, mat(c)); b.position.copy(p); b.receiveShadow = true; cur.add(b); return b; };
  const label = (lines, x, y, z, wcm) => {
    const cv = document.createElement("canvas"), g = cv.getContext("2d"); cv.width = 512; cv.height = 160;
    g.fillStyle = "rgba(255,252,245,0.92)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 152, 40) : g.rect(4, 4, 504, 152); g.fill();
    g.fillStyle = "#1d2a22"; g.textAlign = "center"; g.font = "600 52px Figtree, system-ui, sans-serif"; g.fillText(lines[0], 256, lines[1] ? 70 : 96);
    if (lines[1]) { g.font = "400 36px Figtree, system-ui, sans-serif"; g.fillStyle = "#4b5650"; g.fillText(lines[1], 256, 122); }
    if (SMALL) { cv.height = 112; g.clearRect(0, 0, 512, 160); g.fillStyle = "rgba(255,252,245,0.94)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 104, 52) : g.rect(4, 4, 504, 104); g.fill();
      g.fillStyle = "#1d2a22"; g.textAlign = "center"; g.font = "600 60px Figtree, system-ui, sans-serif"; g.fillText(lines[0], 256, 78); }   // V1.30: a phone shows the name only, larger
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    /* V1.30 (U3): the same size on screen however far off (they were a few pixels tall on a phone, from a floor's view) */
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false, sizeAttenuation: false })); sp.renderOrder = 999;
    const px = SMALL ? 30 : 46, asp = cv.width / cv.height;   // its height in screen pixels, whatever the lens
    sp.onBeforeRender = (r, sc, cam) => { const k = 2 * px / Math.max(200, canvas.clientHeight) * Math.tan((cam.fov || 50) * Math.PI / 360); if (sp.scale.y !== k) { sp.scale.set(k * asp, k, 1); sp.updateMatrixWorld(); } };
    sp.scale.set(0.05 * asp, 0.05, 1); sp.position.copy(v3(x, y, z)); sp.userData.hlabel = true; sp.userData.px = [px * asp, px]; cur.add(sp); };
  const FLOOR = { kitchen: "#d6cfc2", bathroom: "#c3d6dc", wc: "#c3d6dc", garage: "#aaa69e", secret: "#8d8880", porch: "#b9a58e" }, WALL = "#f2eee6", WH = 110;
  const H3 = R.HOUSE3;
  if (H3) {
    /* v58, client: "start the upgrade ... Use what you have to deduct sizing for now. Remember the living room sizes are accurate": the
       house built from house/model.py: walls full height with their windows and doors cut through, white uPVC frames and glass, brick
       outside, floors, the lower flight, the fittings, the tiled roof with the flat-roofed dormer. Merged per floor and material */
    /* v72 (B2): the contact shadows: a soft dark patch, darkest under the piece's middle, fading to nothing at its edge (each box's own
       0–1 UVs on its top), never writing depth (no flicker with the floor) */
    const contactMat = () => { const tex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
        gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.55, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const m = reg(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }));
      m.clippingPlanes = []; m.userData.hk = "contact"; return m; };
    // V2.0: the stair wall up to the landing in the living room's own stair-wall paint (a copy, so Look's colour follows it up the stairs)
    const stairMat = () => { const m = paintMat(lum("#2d5a46") / BASE_L, false, false, "w:stairs").clone(); paintMats.set("house:stairs", reg(m));
      const rk = (H3.depth_rank || {}).stairpaint ?? 2; m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -2 * rk;
      m.clippingPlanes = []; m.userData.hk = "stairpaint"; return m; };   // V2.8, the client: "first floor landing west wall should match the living room west wall and act as one wall": never the landing's palette
    const m3 = {}, mat3 = k => m3[k] || (m3[k] = k === "contact" ? contactMat() : k === "stairpaint" ? stairMat() : (() => { const [c, r] = H3.mats[k] || ["#cccccc", 0.9], gl3 = k === "glass", T = houseTex(k);
      const m = reg(new THREE.MeshStandardMaterial({ color: T ? "#ffffff" : c, map: T ? T.map : null, bumpMap: T && T.bump ? T.map : null, bumpScale: T ? T.bump : 1, normalMap: T && T.normal || null, roughness: T && T.rough ? Math.min(1, r / T.roughMean) : r, roughnessMap: T && T.rough || null, metalness: k === "brass" || k === "chrome" || k === "steel" ? 0.8 : k === "mirror" ? 0.25 : 0, transparent: gl3, opacity: gl3 ? 0.14 : 1,   /* V1.13: clear (0.3 tinted the outside blue-green) */ depthWrite: !gl3, side: HOUSE_SIDE,
        emissive: { led: "#ffffff", pc_glow: "#cfe0ff", screen: "#1b2433" }[k] || "#000000", emissiveIntensity: { led: 1.5, pc_glow: 0.9, screen: 0.6 }[k] || 0 }));   // v60: the kitchen's LED battens glow; v61: the PC's glass, the screens
      m.envMapIntensity = 0.15;   // v60: the reflections are the living room's (its LEDs tinted the kitchen's white walls pink)
      const NS = { paint: 0.3, ceiling: 0.3, brick: 0.7, party: 0.7, soldier: 0.7 }[k];   // V1.47, the client: "walls ... have a rugged non flat effect ... should be smooth or have less of that look": the relief turned down
      if (m.normalMap && NS) m.normalScale.set(NS, NS);
      if (!LOWD) { m.userData.hk = k; m.envMap = houseEnv(); m.envMapIntensity = finishEnv(m); }   // v73: one neutral room, made once (V1.13: the iPhones too)
      if (k === "mirror") { m.color.set("#ffffff"); m.map = MIRROR_SHEEN; }   // V1.17: the hall's and the bathroom's mirrors as the living room's (grey before; as metal, black)
      const rk = (H3.depth_rank || {})[k] ?? 3;   // V1.31 (U6): where faces lie in one plane the higher rank is drawn (house/model.py depth_rank); constant, so nothing shows through at a slant
      if (rk) { m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -2 * rk; }
      m.clippingPlanes = []; m.userData.hk = k; return finPatch(m, k); })());
    if (S.fin === undefined && R.HOUSE3.client_finishes && Object.keys(R.HOUSE3.client_finishes).length) S.fin = finClean(R.HOUSE3.client_finishes);   // V2.11: the scheme kept in the repo, until this device picks its own
    HMATS = m3; FIN.mat3 = mat3; blindsApply(); hceilApply(); finApplyAll();
    if (window.__finPending) { const p = window.__finPending; window.__finPending = null; finImport(p); }   // V2.11: from a Send link opened before the 3D was ready   // V2.7: (mat3 for a floor laid by the tray)   // V2.6: the colours kept for the house's rooms
    const put = (g, geos, m) => { if (!geos.length) return; const me = new THREE.Mesh(worldUV(mergeGeometries(geos), m.userData.hk), m); me.receiveShadow = true;   // V2.8: the stair wall takes shadows as the living room's stair wall below it does (V2.2 took them off: two shades along the flight)
      me.castShadow = !m.transparent; g.add(me); geos.forEach(q => q.dispose()); };   // v69: the house's walls and pieces cast the sun's shadow (as the living room's)
    const mx = new THREE.Matrix4();
    /* v69 (B4), the client: "more realistic like our living room": furniture, fittings and soft things with rounded edges (cm by
       material: the whites and woods a little, the suite and cushions a lot); walls, floors and frames stay sharp */
    const ROUND = { pine: 0.8, pine_dark: 0.3, knob: 1.4, birch: 0.6, oak: 0.6, wardrobe: 0.5, gloss: 0.8, door_white: 0.4, door_wood: 0.4, fitting: 6, porcelain: 1,
      primrose: 4, duvet: 3, pot: 4, lycksele: 3, storebox: 1.5, leather: 2, check: 1, curtain: 1, mattress: 4, pillow: 6 };
    const SOFT = { pillow: 4, mattress: 3, duvet: 3 };
    const CLOTH = { pillow: 1, mattress: 1, duvet: 1, cloth0: 1, cloth1: 1, cloth2: 1, cloth3: 1, cloth4: 1, cloth5: 1, cloth6: 1 };   // V2.17: drawn as cloth (clothBox)   // V1.20: the soft things' edges round in steps (one step read as a chamfer: slabs)
    /* v78: a face that exactly meets a neighbour's (two pieces of one wall, side by side) is never seen, but drawn it showed edge-on
       as a bright hairline up the wall (the landing's, above each door). The faces two square pieces share, from opposite sides: */
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
      const b = new RoundedBoxGeometry(w * M, h * M, d * M, SOFT[mk] || 1, Math.max(0.0005, Math.min(r, Math.min(w, h, d) / 2 - 0.05)) * M);
      b.translate(c.x, c.y, c.z); return b; };
    /* V2.17 (docs/REAL_PLAN.md R4, the master bedroom first; the client: "increase quality and functions inc rendering items in hd"): the
       soft things as cloth, not slabs: a finely divided box, its edges rounded, then shaped: a pillow plumped (full in the middle, thin at
       its edges), a duvet in soft folds (two crossing waves along the bed, by where it lies, so a bed's folds stay put), a mattress's top
       crowned, a hanging garment narrowing to its shoulders with a fall of folds */
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
        if (mk === "pillow") { y *= 1 - 0.38 * (Math.pow(Math.abs(sx), 3) + Math.pow(Math.abs(sz), 3)) * 0.5 - 0.12 * Math.abs(sx * sz); }
        else if (mk === "mattress") { if (ny > 0.5) y += 0.9 * (1 - sx * sx) * (1 - sz * sz); }
        else if (mk === "duvet") { const wx = cx + x, wz = cz + z;
          const f = 1.25 * Math.sin(wx * 0.15 + Math.sin(wz * 0.045) * 1.9) * Math.sin(wz * 0.11 + 0.6) + 0.45 * Math.sin(wx * 0.41 - wz * 0.27) + 0.2 * Math.sin(wz * 0.9 + wx * 0.2);
          x += nx * f * (ny > 0.5 ? 0.6 : 1); y += ny * f; z += nz * f * (ny > 0.5 ? 0.6 : 1); }
        pos[i] = -(cx + x) * M; pos[i + 1] = (cy + y) * M; pos[i + 2] = (cz + z) * M;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx.map((v, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]));   // x is mirrored into the world (v3), so each face is wound back
      g.computeVertexNormals(); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); return g; };
    /* V1 (Phase 3): a floor can be built again with the client's edits (editedFloor: the edited pieces moved and sized, the walls round a
       door or a window following it); the floor keeps its group, so what's shown and hidden stays as it was */
    HBUILD = (fk, F) => {
      cur = HFLOOR[fk];
      if (cur) { for (const c of [...cur.children]) { if (c.userData.hlabel) continue; cur.remove(c); c.traverse(o => o.geometry && o.geometry.dispose()); } }
      else { cur = HFLOOR[fk] = new THREE.Group(); houseG.add(cur); }
      const fresh = !cur.userData.built; cur.userData.built = true;
      SHARED = sharedFaces(F);
      /* V2.15 (FINISHES F5): each room's ceiling light (its item "light.<room>") its own group, so a fitting chosen in the tray can stand in for it */
      const tg = F.tags || [], lid = t => (t != null && t >= 0 && typeof tg[t] === "string" && tg[t].startsWith("light.")) ? tg[t].slice(6) : null, LG = {};
      const lgOf = r => LG[r] || (LG[r] = (() => { const g = new THREE.Group(); g.userData.finLight = r; cur.add(g); FIN_PEND[r] = g; return g; })());
      for (const [mk, list] of Object.entries(F.boxes)) { const bt = (F.bt || {})[mk] || [], main = [], by = {};
        list.forEach((q, i) => { const r = lid(bt[i]); (r ? (by[r] = by[r] || []) : main).push(q); });
        put(cur, main.map(([x0, y0, z0, x1, y1, z1]) => houseBox(mk, x0, y0, z0, x1, y1, z1)), mat3(mk));
        for (const [r, L] of Object.entries(by)) put(lgOf(r), L.map(([x0, y0, z0, x1, y1, z1]) => houseBox(mk, x0, y0, z0, x1, y1, z1)), mat3(mk)); }
      SHARED = new Set();
      const byMat = {};
      const prismGeo = P => {                         // a profile extruded: along x the profile is (z, y), along z it is (x, y)
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(P.pts.map(([u, w]) => new THREE.Vector2(u * M, w * M))), { depth: (P.b - P.a) * M, bevelEnabled: false });
        if (P.axis === "x") mx.set(0, 0, -1, -P.a * M, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
        else if (P.axis === "y") mx.set(-1, 0, 0, 0, 0, 0, 1, P.a * M, 0, 1, 0, 0, 0, 0, 0, 1);   // V1.14: a plan shape (x, z) raised from a to b (a chair's star base)
        else mx.set(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, P.a * M, 0, 0, 0, 1);
        g.applyMatrix4(mx);
        if (P.axis === "z") { const A = Object.values(g.attributes);   // V1.31 (U6): mirrored (x flipped), so its faces turned inside out: wound back
          for (let i = 0; i + 2 < g.attributes.position.count; i += 3) for (const a of A) for (let c = 0; c < a.itemSize; c++) { const t = a.array[(i + 1) * a.itemSize + c]; a.array[(i + 1) * a.itemSize + c] = a.array[(i + 2) * a.itemSize + c]; a.array[(i + 2) * a.itemSize + c] = t; } }
        return g; };
      for (const P of F.prisms) (byMat[P.m] = byMat[P.m] || []).push(prismGeo(P));
      for (const [mk, geos] of Object.entries(byMat)) put(cur, geos, mat3(mk));
      const byL = {}, lL = {};                        // v70: the suite's turned shapes (pans, seats, bowls); V2.15: a room's light's in its group
      for (const L of F.lathes || []) { const g = new THREE.LatheGeometry(L.p.map(([r, h]) => new THREE.Vector2(r * M, h * M)), LOWD ? 12 : 28);
        g.scale(L.s[0], 1, L.s[1]); const c = v3(L.c[0], L.c[1], L.c[2]); g.translate(c.x, c.y, c.z); const r = lid(L.t);
        const into = r ? (lL[r] = lL[r] || {}) : byL; (into[L.m] = into[L.m] || []).push(g); }
      for (const [mk, geos] of Object.entries(byL)) put(cur, geos, mat3(mk));
      for (const [r, by] of Object.entries(lL)) for (const [mk, geos] of Object.entries(by)) put(lgOf(r), geos, mat3(mk));
      if (fresh) for (const L of F.labels || []) { label([L.name, [L.use, `about ${L.w.toFixed(1)} × ${L.d.toFixed(1)} m`].filter(Boolean).join(" · ")], L.x, L.y, L.z, 190);
        cur.children[cur.children.length - 1].userData.area = L.w * L.d; }   // V1.35: the bigger room's name wins where two overlap
      const partG = (P, into, at) => {                 // a part's group on its pivot, its own parts inside it (V1.26b: a bifold's second panel)
        const pv = v3(...P.pivot), g = new THREE.Group(); g.position.copy(pv).sub(at); into.add(g);
        for (const [mk, list] of Object.entries(P.boxes)) put(g, list.map(([x0, y0, z0, x1, y1, z1]) => houseBox(mk, x0, y0, z0, x1, y1, z1).translate(-pv.x, -pv.y, -pv.z)), mat3(mk));
        const pm = {}; for (const Q of P.prisms || []) (pm[Q.m] = pm[Q.m] || []).push(prismGeo(Q).translate(-pv.x, -pv.y, -pv.z));
        for (const [mk, geos] of Object.entries(pm)) put(g, geos, mat3(mk));
        const kids = Object.values(P.parts || {}).map(Q => Object.assign(partG(Q, g, pv), { angle: Q.angle, axis: Q.axis }));
        return { g, kids };
      };
      for (const [pk, P] of Object.entries(F.parts || {})) {   // v68: a piece that moves, its boxes round its hinge (V1.26: the doors too)
        const { g, kids } = partG(P, cur, new THREE.Vector3());
        const was = HPARTS[pk], kept = (S.doors || {})[pk];   // V1.26b: a door stays as you left it (this device)
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
      if (r.name) label([r.name, [r.use, `${r.w.toFixed(1)} × ${r.d.toFixed(1)} m`].filter(Boolean).join(" · ")], (r.x0 + r.x1) / 2, F.y + WH + 40, (r.z0 + r.z1) / 2, Math.min(260, Math.max(150, r.x1 - r.x0)));
    }
    for (const s of F.solids) box(s.x0, s.x1, F.y, F.y + WH + 20, s.z0, s.z1, "#4a463f");
    for (const f of F.fixtures || []) box(f.x0 + 2, f.x1 - 2, F.y, F.y + f.h, f.z0 + 2, f.z1 - 2, "#f4f3ef");   // v57: the fittings the client marked
    for (const s of F.slopes || []) {                                // v57, client: the roof comes into the room (rooms in the roof): low at the east wall
      const b = box(s.x0, s.x1, F.y, F.y + WH + 20, s.z0, s.z1, "#cfc6b6"), pa = b.geometry.attributes.position, h = (WH + 20) * M;
      for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0 && pa.getX(i) > 0) pa.setY(i, -h / 2 + 40 * M);   // three's +x is the east (x flipped)
      pa.needsUpdate = true; b.geometry.computeVertexNormals();
      if (s.name) label([s.name, s.use], (s.x0 + s.x1) / 2, F.y + WH + 40, (s.z0 + s.z1) / 2, 150);
    }
    for (const w of F.windows) box(w.x0, w.x1, F.y + 70, F.y + WH + 8, w.side === "n" ? F.zn - 4 : F.zs - 6, w.side === "n" ? F.zn + 6 : F.zs + 4, "#9ccbe6");
    for (const d of F.doors) box(d.x0, d.x1, F.y, F.y + 4, d.side === "n" ? F.zn - 8 : F.zs - 4, d.side === "n" ? F.zn + 4 : F.zs + 8, "#8a6a4a");
    const xs = F.rooms.map(r => [r.x0, r.x1]).flat();
    label([F.title.split(" · ")[0], F.title.split(" · ")[1] || ""], (Math.min(...xs) + Math.max(...xs)) / 2, F.y + WH + 160, F.zn - 120, 420);
  }
  cur = HFLOOR.out = new THREE.Group(); houseG.add(cur);
  buildPlants(cur);                                                               // V1.3: the cordyline in the back garden (with Gardens)
  buildBeyond(cur, null);                                                          // V1.4: the low building past the far fence
  buildThings(cur, "ours");                                                        // V1.6: the table and chairs
  HFLOOR.nextThings = new THREE.Group(); houseG.add(HFLOOR.nextThings); buildThings(HFLOOR.nextThings, "next");   // and next door's, with Next door
  // the front: the drive in front of the garage, the small lawn left of it (from the street) with its low brick wall, a strip of lawn
  // by the neighbour's fence with a young tree, the pavement and the close (house/HOUSE.md, the agent's photo of the front)
  const G0 = HS.find(F => F.id === "ground"), zf = H3 ? H3.front : G0 ? G0.zs + 20 : 530, gar = G0 && G0.rooms.find(r => r.id === "garage"), hall = G0 && G0.rooms.find(r => r.id === "hall");
  const gx0 = H3 ? H3.garage[0] : gar ? gar.x0 : 0, gx1 = H3 ? H3.garage[1] : gar ? gar.x1 : 290, hx1 = H3 ? H3.hall[1] : hall ? hall.x1 : 495;
  // v66, the client: "entrance step up is still clipping and the alleyway": the front sat at the floor's level (0), 15 above the drive
  // the house and next door stand on (house/survey_data.LEVELS); now every layer from next door's base, side by side
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
  label(["The front garden", "the drive, the lawn · sizes to come"], (gx0 + hx1) / 2, 120, zf + 280, 260);
  label(["The back garden", "about 25 m"], 240, -260 + 160, -309 - 900, 380);
  /* v55, client: "The alley has stairs down": down the side of the house (the gate side, the east), level from the street along the
     front, then stairs down to the garden's level by the back, the gate at the bottom. Rough until measured. v66: between the two end
     walls (ours at -28, next door's at -125), from the drive's level */
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
    // v66, the client: "add the alleyway gate inbetween my house and next door to cover the alley": a close-board timber gate in line
    // with the houses' fronts, 180 high, on two posts (next door's in the front photo is the same kind)
    const zg = zf - 6;
    box(ax0 - 5, ax0 + 5, yTop, yTop + 188, zg - 6, zg + 4, "#5a4636"); box(ax1 - 10, ax1, yTop, yTop + 188, zg - 6, zg + 4, "#5a4636");   // the posts
    box(ax0 + 6, ax1 - 11, yTop + 4, yTop + 182, zg, zg + 2.5, "#6b5644");                                           // the boards
    for (let x = ax0 + 15; x < ax1 - 12; x += 10) box(x, x + 0.6, yTop + 4, yTop + 182, zg + 2.5, zg + 2.9, "#4e3c2e");   // their joints
    for (const yy of [yTop + 25, yTop + 155]) box(ax0 + 8, ax1 - 13, yy, yy + 10, zg - 2.5, zg, "#6b5644");           // ledges inside
    box(ax1 - 22, ax1 - 16, yTop + 100, yTop + 112, zg + 2.9, zg + 4.5, "#26282a");                                 // the latch
  }
  label(["The alley", "stairs down to the garden"], (ax0 + ax1) / 2, 120, -40, 220);
  finFloorApply();   // V2.7 (FINISHES F4): the floors chosen in the tray, on their rooms
}
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
  if (R.HOUSE3) for (let k = 0; k < 2; k++) { const l = new THREE.PointLight("#ffcf98", 0, 7, 2); l.visible = false; l.userData.houseLight = true; scene.add(l); ROOMLIGHTS.push(l);   // v69 (B3): at the start, so the set never changes
    /* V2.17 (REAL_PLAN R1, the client: "rendering items in hd"): the room's own light casts its shadows in HD (the bed under its
       light, the walls keeping it in its room); drawn only when the room changes (autoUpdate off), from the start (no shader rebuilds) */
    if (k === 0) { l.castShadow = true; const ms = BIG_GPU ? 1024 : 512; l.shadow.mapSize.set(ms, ms); l.shadow.bias = -0.002; l.shadow.normalBias = 0.03; l.shadow.radius = 4;
      l.shadow.camera.near = 0.05; l.shadow.camera.far = 7; } }
}
const START_MS = {};
function start() {
  started = true;
  const t0 = performance.now();
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = ENV.studio = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  buildSun();
  gl.localClippingEnabled = true;
  scene.add(lightRig);                                                                  // v35: the fixed set of lights
  const TM = START_MS, tm = k => { TM[k] = Math.round(performance.now() - t0); }; TM.modAt = Math.round(MOD_AT); TM.startAt = Math.round(t0);   // V1.31 (U4): where the start's time goes (R3D.timing)
  tm("env"); buildShell(); tm("shell"); buildLights(); tm("lights"); buildFurniture(); tm("furniture"); buildSuggest(); tm("suggest"); buildSeatAndPouf();   // v69 (B6): the house is built the first time it's looked at
  bar1 = buildBar(R.BAR1, lights.bar1, "bar1"); tm("bar");
  scene.children.forEach(o => { if (!o.isLight && o !== lightRig && o !== sun && o !== sun.target) LIVING.push(o); });   // V1.31: the living room's own
  gl.shadowMap.enabled = S.quality === "hd";
  cabSnap = true; applyState(); cabSnap = false;          // v30: the doors start where they are, no swing
  syncButtons();
  scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) [].concat(o.material).forEach(m => m && !m.clippingPlanes && clipMat(m)); });   // v21: the cutaway
  tm("state"); setView(S.view, true); tm("view");
  applyCam(S.cam === "look"); applyPad();                                               // v31
  sizeRenderer();
  // v81: no gl.compile here: it ran before the cutaway's clipping was set, so its 28 programs never matched the first frame's (which made
  // its own): 60 compiled for 32 used, about 1.7 s of a 15 s start here (more on a phone)
  root.classList.add("ready");
  /* V1.31 (U4): two thirds of the start was building shaders, all at the first frame (the page froze). Now they're built first with
     compileAsync: in parallel where the browser can (KHR_parallel_shader_compile), the page still answering meanwhile; then the first
     frame. For the right ones: after the cutaway's clipping is set (v81's lesson), and into a target like the shade's composer when it's
     on (its shaders differ from the screen's). Never more than 8 s' wait */
  const first = () => { if (first.done) return; first.done = true; START_MS.compiled = Math.round(performance.now() - t0); msg.hidden = true;
    requestAnimationFrame(frame); requestAnimationFrame(() => setTimeout(loadPhotos, 30)); };   // V1.9: the photos once the first picture is up
  if (gl.compileAsync && !/[?&]nocompile\b/.test(location.search)) {
    msg.textContent = "Building the house…"; msg.hidden = false;
    const was = gl.getRenderTarget();
    try {
      if (aoLive()) { if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }); gl.setRenderTarget(PRE.rtAO); }
      Promise.race([gl.compileAsync(scene, camera), new Promise(r => setTimeout(r, 8000))]).then(first, first);
    } catch (e) { first(); } finally { gl.setRenderTarget(was); }
  } else first();
  precompile();                                                                         // v35: hidden parts' shaders, while the room's idle
  lookFromHash();                                                                       // v28: a shared #look- link (after the first compile, so its note shows)
  try {                                                                                 // v30: once, say the room's things can be tapped
    if (EMBED) {}                                                                       // V1: the app gives its own hints
    else if (!localStorage.getItem("mw41-taphint") && !/^#look-/.test(location.hash)) { setTimeout(() => toast("Tap things to work them. Double-tap the floor to walk."), 1800); localStorage.setItem("mw41-taphint", "1"); localStorage.setItem("mw31-camhint", "1"); }
    else if (!localStorage.getItem("mw31-camhint") && !/^#look-/.test(location.hash)) { setTimeout(() => toast("View → Move round sets your eye height"), 1800); localStorage.setItem("mw31-camhint", "1"); }   // v31
  } catch (e) {}
  // for the headless stills (shot3d.py): set the options and a view, then take a picture
  window.R3D = {
    set(o) { const aim = o.aim; o = Object.assign({}, o); delete o.aim; if (SH) showStop(false);   // v32: "aim", a piece's own close look
      const lay = "added" in o ? { layout: o.layout || {}, added: o.added } : null; delete o.added; if (lay) delete o.layout;   // v32: pieces added for a still
      const addp = o.addpiece; delete o.addpiece;                                    // v32: the plan page's "Add it to my room": one more piece
      const showat = o.showat; delete o.showat;                                      // v34: a still part way through "Watch it open"
      if (o.merge) { delete o.merge; for (const k of ["sugg", "ideas", "decor"]) if (o[k]) o[k] = Object.assign({}, S[k], o[k]); }   // v32: "Show it in my room" keeps what's already on
      oldScene(o); Object.assign(S, o); S.decor = Object.assign({}, DEF.decor, o.decor || S.decor); if (o.scene && !o.lv) S.lv = Object.assign({}, SCENES[o.scene].levels); if (o.quality) S.picked = true; cabSnap = true; applyState(); cabSnap = false; syncButtons(); if (lay) { cabSnap = true; restoreLayout(lay); cabSnap = false; }
      if (addp && CATALOGUE[addp.type]) { const a = { id: "a" + Date.now().toString(36), type: addp.type, x: addp.x, z: addp.z }; pushUndo(); addThing(a); if (addp.rot) setLayout(a.id, { rot: addp.rot }); placeAll(); store.set(KEY, S); dirty(); }
      if (showat != null) { showOpen(); if (SH) { SH.own = true; SH.paused = true; SH.t = showat; showPose(SH.t); showCard(); qs("#r3d-show").hidden = true; } }
      if (o.view) setView(o.view, true); if (aim) flyTo(aim.eye, aim.at, aim.fov || 55, !!aim.above, true); },   // v58: "above" lets a look stand off (the house)
    still, finish, finishes: () => JSON.parse(JSON.stringify(S.fin || {})), setFinishes: o => finImport(o), ready: true, buildMs: Math.round(performance.now() - t0), _dbg: { get flying() { return !!tween; }, get H3() { return R.HOUSE3; }, get RMODE() { return RMODE; }, spotAt, goStandAt: goStand, HPARTS, PICK, HEDITS, get actId() { return actId; }, swingDoor, WALK, walkMove, collide, bodyBlocked, floorAtCm, HSOLID, livSolids, livFloors,  swingAll, gl, scene, lights, get sun() { return sun; }, SUNCFG, get winGlass() { return winGlass; }, AO, ENV, envLevels, bloomLevels, roomEnv, THREE, S, MOV, floorHop, collide, solidBoxes, leafTexture, UNDO, camera, controls, VIEWS, MATS, OAK_TEX, CABP, SUGG_G, IDEA_G, CATALOGUE, BES, WORK, precompile, PRE, AIMG },
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
  if (EMBH) EMBH.ready();
}
window.addEventListener("r3d-set", e => { if (window.R3D) window.R3D.set(e.detail); else window.__r3dPending = e.detail; });

