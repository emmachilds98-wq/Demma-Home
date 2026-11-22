/* ---------------------------------------------------------------- go: built the first time the room is on screen (v14.1) */
/* v48 §6, v49: the sun through the window casts the frame, bars and sill plants onto the sill, sofa and floor; its direction geometry.SUN
   (7 am in June, low from the right: the back faces 14° east of north). Always in the scene (no shader rebuilds), dark by night and in Fast */
const SUNCFG = { lux: 80, out: 0.5 };   // tuned on stills: the bars' shadows read on the sofa, the ottoman and the rug, the floor not washed out; outside (V1.3), higher in the sky, half
/* v54: each floor laid out from house/house.py round the real living room, the lower ground floor to the east and the first floor to the
   west at their own levels, the front drive and lawn */
/* v59: real surfaces drawn in the page, sized to the world (a brick a brick on every wall): brick, roof tiles, the dormer's hung tiles,
   lawn, concrete, paving, road, carpet, tiles, boards. Each: the canvas and the metres it covers */
const HTEX = {}, HI_T = new Set(["tile_w", "tile_f", "door_wood", "chalk"]);
/* V2.56 (R3): finishes without a photo take one of ours (build_textures.finishes), their own colour over a white detail map (TINT) */
const HTEX_AS = { artisan: "oak", frame_out: "upvc", door_out: "upvc", gutter: "upvc", sill_board: "upvc", skirting: "gloss", door_white: "joinery", door_cream: "joinery", door_wood: "joinery", woodwork: "upvc", newel: "joinery", rail_white: "gloss", steel: "brushed", steel_dark: "brushed", wardrobe: "melamine" };   // N142 (V4.12): the white units' foil
const HTEX_TINT = new Set(["upvc", "gloss", "brushed", "joinery", "melamine"]);   // N111: the doors' painted timber, its grain up the leaf (the skirting's strokes along it, gloss)
const BED_TINT = new Set(["duvet", "pillow", "artisan"]);   // V4.3: and artisan oak, a hair warmer than the oak it shares   // V3.66 (N113): the bedding's own colour over its cotton photo, a hair below white (it drew the photo at full white: clipped on a phone)
/* V3.36 (N87): the soft things in their own colours over the cotton's white, each with a relief of its kind (blinds woven, felt knitted,
   mats' pile); the rug, fabric boxes and tapestry keep their drawn weaves */
const SOFT_REL = { tapestry_dark: "lycksele", blind_cloth: "lycksele", panel: "check", bathmat: "carpet_grey" };
/* V2.2: the house's ceilings white, or the colour picked in View (the living room's keeps Look's) */
function hceilApply() {
  if (!HMATS) return; const hex = /^#[0-9a-f]{6}$/i.test(S.hceil || "") ? S.hceil : null;
  for (const k of ["ceiling", "artex"]) { const m = HMATS[k]; if (!m) continue;
    if (!m.userData.c0) m.userData.c0 = m.color.clone();
    if (hex) m.color.set(hex).multiplyScalar(m.map ? 1 / 0.95 : 1); else m.color.copy(m.userData.c0); }
}
/* V2.5 (F2): the palette: a wall's or ceiling's colour per room and side with no new draw or shader: a plan of the rooms (2 cm a pixel, a
   band a floor) and a palette (a row a room: back, front, east, west, ceiling); the shader looks up the room 3 cm in front of a face and its
   side from its normal; an empty pixel leaves it as drawn. R3D.finish(room, "walls" | side | "ceiling", "#hex" | null) writes one */
const FIN = { W: 234, H: 404, map: null, pal: null, rooms: [], kind: { paint: 0, ceiling: 1, artex: 1, duvet: 2, pillow: 2, skirting: 3, door_white: 3, woodwork: 3 }, inv: new THREE.Matrix4() };   // N5d: the bedding (palette slot 5; its room from where it is in the house, as a bed's lid moves)   // V2.8: not the stair wall: it's the living room's (Look)
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
    Object.assign(sh.uniforms, { finMap: { value: FIN.map }, finPal: { value: FIN.pal }, finKind: { value: FIN.kind[k] }, finRoom: { value: room }, finScale: { value: scale }, finInv: { value: FIN.inv } , finGar: { value: garageAt() } });
    sh.vertexShader = "uniform mat4 finInv;\nvarying vec3 vFinP;\nvarying vec3 vFinN;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vFinP = " + (FIN.kind[k] === 2 ? "(finInv * modelMatrix * vec4(transformed, 1.0)).xyz" : FIN.kind[k] === 3 ? "(finInv * modelMatrix * vec4(transformed, 1.0)).xyz; vFinN = (finInv * modelMatrix * vec4(objectNormal, 0.0)).xyz" : "transformed") + (FIN.kind[k] === 3 ? ";" : "; vFinN = objectNormal;"));   // N216: a door's leaf swings: its room from where it is
    sh.fragmentShader = "uniform vec2 finGar;\nuniform sampler2D finMap;\nuniform sampler2D finPal;\nuniform float finKind;\nuniform float finRoom;\nuniform float finScale;\nvarying vec3 vFinP;\nvarying vec3 vFinN;\n" +
      `int finAt(vec2 c, int fl) { ivec2 t = ivec2(int(clamp(floor(c.x / 2.0), 0.0, ${FIN.W - 1}.0)), int(clamp(floor((c.y + 309.0) / 2.0), 0.0, ${FIN.H - 1}.0)) + fl * ${FIN.H}); return int(texelFetch(finMap, t, 0).r * 255.0 + 0.5); }\n` +
      sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec3 finD = diffuse;
  { vec3 fn = normalize(vFinN); float xc = -vFinP.x * 100.0, zc = vFinP.z * 100.0, yc = vFinP.y * 100.0;
    int fl = yc < 0.0 ? 0 : (yc < 260.0 ? 1 : 2); int rm = int(finRoom);
    if (rm < 0) { float o = finKind < 0.5 || finKind > 2.5 ? 3.0 : 0.0;
      ivec2 t = ivec2(int(clamp(floor((xc - fn.x * o) / 2.0), 0.0, ${FIN.W - 1}.0)), int(clamp(floor((zc + fn.z * o + 309.0) / 2.0), 0.0, ${FIN.H - 1}.0)) + fl * ${FIN.H});
      rm = int(texelFetch(finMap, t, 0).r * 255.0 + 0.5); }
    if (rm > 0) { float nx = -fn.x, nz = fn.z; int sl = finKind > 2.5 ? 6 : finKind > 1.5 ? 5 : finKind > 0.5 ? 4 : (abs(nx) > abs(nz) ? (nx > 0.0 ? 2 : 3) : (nz > 0.0 ? 0 : 1));
      vec4 fc = texelFetch(finPal, ivec2(sl, rm), 0); if (fc.a > 0.5) finD = fc.rgb * finScale;
      if (finKind > 1.5) rm = 0; }   // the bedding and the woodwork (N216): their colour, no room shade
    if (rm > 0) {
      /* V2.23 (REAL_PLAN R2): the shade a real room has where its surfaces meet: a wall darker at its foot, a little at its top and into
         a corner; a ceiling a little at its edges (where the room ends in the plan the palette reads); worked out here, nothing baked */
      float hh = yc - (fl == 0 ? -260.0 : (fl == 1 ? 0.0 : 260.0)), shd = 1.0, cn = 0.0;
      vec2 c0 = vec2(xc - fn.x * (finKind < 0.5 ? 3.0 : 0.0), zc + fn.z * (finKind < 0.5 ? 3.0 : 0.0));
      if (finKind < 0.5) {
        shd -= 0.11 * exp(-max(hh, 0.0) / 14.0) + 0.07 * exp(-max(235.0 - hh, 0.0) / 16.0);
        vec2 tg = abs(fn.x) > abs(fn.z) ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
        for (int d = 3; d >= 1; d--) { float dd = float(d) * 7.0; if (finAt(c0 + tg * dd, fl) != rm || finAt(c0 - tg * dd, fl) != rm) cn = 1.0 - float(d - 1) / 3.0; }
        shd -= 0.09 * cn;
      } else {
        for (int d = 3; d >= 1; d--) { float dd = float(d) * 8.0;
          if (finAt(c0 + vec2(dd, 0.0), fl) != rm || finAt(c0 - vec2(dd, 0.0), fl) != rm || finAt(c0 + vec2(0.0, dd), fl) != rm || finAt(c0 - vec2(0.0, dd), fl) != rm) cn = 1.0 - float(d - 1) / 3.0; }
        shd -= 0.08 * cn;
      }
      ${FIN.kind[k] < 2 ? "{ float wm = max(finD.r, max(finD.g, finD.b)); if (wm > WMX) finD *= WMX / wm; }".replace(/WMX/g, Math.pow(WHITE_MAX, 2.2).toFixed(4)) : ""}
      finD *= shd;${FIN.kind[k] === 0 ? `
      if (rm == int(finGar.x)) { float gh = yc - finGar.y, gm = pgN(vPgP * 0.8 + 11.0), gd = pgN(vec3(xc, yc * 0.3, zc) * 0.05);
        finD *= vec3(0.95, 0.95, 0.96) * (0.94 + 0.1 * gm) * (1.0 - (0.08 + 0.08 * gd) * exp(-max(gh + 15.0, 0.0) / 30.0)); }` : ""} } }
  vec4 diffuseColor = vec4( finD, opacity );`);
    if (FIN.kind[k] === 0) paintGrain(sh);   // N172: the emulsion's tone and sheen
  };
  return m;
}
/* N172 (the garage): its room in the palette's numbering and its floor's height (the room's; its slab lies 15 lower, by the step down from the hall); its walls a cooler masonry paint, its mottle and the dust
   and scuffs at their foot (still smooth) (above), its floor's slab (garageFloor) */
function garageAt() { const r = ((R.HOUSE3 || {}).rooms || {}).garage; return new THREE.Vector2(r ? FIN.rooms.indexOf("garage") + 1 : -1, r ? r[4] : 0); }
/* the garage's slab, the concrete's own photo kept: a saw-cut joint across it towards the door (clear of the cover), the dust along the walls, the tyres' two tracks a
   shade darker and polished, an old oil mark where an engine stood, darker and glossier. Only inside the garage's outline (the drive
   shares the concrete); one program ("garagefloor"), worked out from where the pixel is */
function garageFloor(m) {
  const r = ((R.HOUSE3 || {}).rooms || {}).garage; if (!r) return m;
  /* in the living room's own view (its 2 planes, cut where both cut) the garage is never seen: there the concrete keeps the plain program
     the house's photos share, warmed with that view (its own was built mid-walk on a PC) */
  const plain = THREE.Material.prototype.onBeforeCompile.toString();
  m.customProgramCacheKey = () => m.clipIntersection ? plain : "garagefloor";
  m.onBeforeCompile = sh => { if (m.clipIntersection) return;
    sh.uniforms.gR = { value: new THREE.Vector4(r[0], r[1], r[2], r[3]) }; sh.uniforms.gY = { value: r[4] };
    sh.vertexShader = "varying vec3 vPgP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vPgP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = PAINT_GRAIN + "uniform vec4 gR;\nuniform float gY;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
  float gfR = 1.0;
  { vec2 c = vec2(-vPgP.x * 100.0, vPgP.z * 100.0);
    if (c.x > gR.x && c.x < gR.y && c.y > gR.z && c.y < gR.w && abs(vPgP.y * 100.0 - gY) < 20.0) {
      float W = gR.y - gR.x, L = gR.w - gR.z, u = c.x - gR.x, v = c.y - gR.z, n = pgN(vPgP * 9.0), n2 = pgN(vPgP * 1.6 + 5.0), k = 1.0;
      k *= mix(0.5, 1.0, smoothstep(0.2, 0.55, abs(v - L * 0.7) + (n - 0.5) * 0.25));
      float e = min(min(u, W - u), min(v, L - v));
      k *= 1.0 - 0.1 * exp(-e / 12.0) * (0.6 + 0.8 * n2);
      float tr = 0.0; for (int s = -1; s <= 1; s += 2) tr = max(tr, 1.0 - smoothstep(5.0, 13.0, abs(u - W * 0.5 - float(s) * 76.0)));
      tr *= smoothstep(L * 0.12, L * 0.3, v) * (0.5 + 0.5 * n2);
      k *= 1.0 - 0.1 * tr; gfR *= 1.0 - 0.25 * tr;
      float od = length(vec2(u - W * 0.5, (v - L * 0.27) * 0.8)) + (n2 - 0.5) * 24.0 + (n - 0.5) * 6.0, oil = 1.0 - smoothstep(14.0, 30.0, od);
      k *= 1.0 - 0.3 * oil; gfR *= 1.0 - 0.45 * oil;
      diffuseColor.rgb *= k; } }`).replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor *= gfR;");
  };
  return m;
}
const FIN_SLOT = { back: [0], front: [1], east: [2], west: [3], walls: [0, 1, 2, 3], ceiling: [4], bedding: [5], woodwork: [6] };   // N216: skirting, doors, frames, radiators
function finish(room, surface, hex) {   // R3D.finish: a room's walls (or one side) or its ceiling to a colour; null puts it back as drawn; no room: every one
  if (!finSetup()) return false;
  const rows = room == null ? FIN.rooms.map((_, i) => i + 1) : [FIN.rooms.indexOf(room) + 1], slots = FIN_SLOT[surface || "walls"];
  if (!slots || rows.some(r => r < 1)) return false;
  const c = hex ? new THREE.Color(hex) : null, d = FIN.pal.image.data;   // linear, as the material's own colour
  for (const r of rows) for (const s of slots) { const i = (r * 8 + s) * 4;
    if (c) { d[i] = Math.round(Math.min(1, c.r) * 255); d[i + 1] = Math.round(Math.min(1, c.g) * 255); d[i + 2] = Math.round(Math.min(1, c.b) * 255); d[i + 3] = 255; } else d[i + 3] = 0; }
  FIN.pal.needsUpdate = true; dirty(); return true;
}
/* V3.44 (N96): a plain colour darker than #383838 is raised to it, its hue kept, so black pieces show their form; screens, glass and
   the shade stay as they are */
const BLACK_MIN = 0x38 / 255, BLACK_KEEP = new Set(["contact", "screen", "glass_dark", "pc_glow", "led"]);
function liftBlack(c) { const t = {}; c.getRGB(t, THREE.SRGBColorSpace); const mx = Math.max(t.r, t.g, t.b); if (mx >= BLACK_MIN) return c;
  if (mx < 1e-3) return c.setRGB(BLACK_MIN, BLACK_MIN, BLACK_MIN, THREE.SRGBColorSpace);
  const f = BLACK_MIN / mx; return c.setRGB(t.r * f, t.g * f, t.b * f, THREE.SRGBColorSpace); }
/* N184: the other end: a white over #dc is held to it, its hue kept, so the small rooms' baths, units, walls and ceilings keep their
   shading under the clip as the living room's do (the light the same; only how much a white sends back) */
const WHITE_MAX = 0xdc / 255, WHITE_KEEP = new Set(["led", "bulb", "pc_glow", "mirror", "glass", "glass_frost", "contact"]);
function capWhite(c) { const t = {}; c.getRGB(t, THREE.SRGBColorSpace); const mx = Math.max(t.r, t.g, t.b); if (mx <= WHITE_MAX) return c;
  const f = WHITE_MAX / mx; return c.setRGB(t.r * f, t.g * f, t.b * f, THREE.SRGBColorSpace); }
function houseTex(k) {
  if (k in HTEX) return HTEX[k];
  if (k === "paint") return (HTEX[k] = null);
  const rel = /^cloth\d$/.test(k) ? "check" : SOFT_REL[k];
  if (rel) { const J = houseTex(rel), W = houseTex("duvet");   // V3.32 (N82): the garments in their own colours over the poplin's white, with the knit's relief (they were flat card); a map and a relief, as the throw's: no shader of their own
    return (HTEX[k] = J && J.normal && W && W.map ? { map: W.map, normal: J.normal, size: J.size, bump: 0, rough: null, roughMean: 0, tint: true } : null); }   // V3.36 (N87): the other soft things the same way, each its own relief   // V2.2, the client: "ensure walls are all smooth": flat emulsion, no plaster relief
  /* v70: CC0 photos (house/SOURCES.md) and our own (build_textures.py) where we have them; the drawn ones below for the rest */
  const pkey = { party: "brick", soldier: "brick", pillow: "duvet", mattress: "duvet", ceiling: "artex", knob: "pine_dark", ...HTEX_AS }[k] || k, pm = PMETA[pkey];   // V1.21: the bedding's one cotton
  if (pkey !== k && pm && pm.map) return (HTEX[k] = houseTex(pkey));   // V2.56: one texture per finish, shared
  if (pm && pm.map) {   // V1.9: its mean colour and a flat relief until the photos land (loadPhotos), then the photo in the same texture
    const img = (f, srgb, fill) => { const t = canvasTex(4, 4, g => { g.fillStyle = fill; g.fillRect(0, 0, 4, 4); }, srgb);   // V1.11: as sharp at a slant as the card allows (was 4)
      whenPhoto(pkey, f, src => { decodeImg(src).then(im => texSet(t, im, true)); }, t); return t; };   // V2.64: queued (upStep)
    const rg = pm.rough ? Math.round(pm.rough * 255) : 0, grey = `rgb(${rg},${rg},${rg})`;   // V1.30 (U5): its roughness map, if it has one
    const map = img("map", true, pm.avg || "#888888"); map.userData.grass = pkey === "lawn";   // V2.68 (N22): its materials take the lawn's patchwork (03_materials grassy)
    return (HTEX[k] = { map, normal: pm.nor ? img("nor", false, "#8080ff") : null, size: [pm.size, pm.size], bump: 0,
      rough: pm.rough && !LOWD ? img("rough", false, grey) : null, roughMean: pm.rough || 0, tint: HTEX_TINT.has(k) });
  }
  let s = 7 + k.length * 101; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const noise = (g, w, h, n, a, cols) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = a * rnd(); g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } g.globalAlpha = 1; };
  const T = {
    tile_f: [0.6, 0.6, (g, w, h) => { g.fillStyle = "#dcd7ce"; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, 0.2, ["#b8b2a6", "#fff"]);
      g.fillStyle = "#a9a296"; for (let i = 0; i < 2; i++) { g.fillRect(i * w / 2, 0, 3, h); g.fillRect(0, i * h / 2, w, 3); } }],
    board: [1.2, 0.6, (g, w, h) => { const pl = ["#c4b296", "#bba98b", "#cbb99c", "#b6a283"];
      for (let i = 0; i < 4; i++) { g.fillStyle = pl[i]; g.fillRect(0, i * h / 4, w, h / 4); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, i * h / 4, w, 2); g.fillRect(rnd() * w, i * h / 4, 2, h / 4); }
      noise(g, w, h, 6000, 0.2, ["#7a6448", "#e6d6bb"]); }],
    chipboard: [0.6, 0.6, (g, w, h) => { g.fillStyle = "#c8ad80"; g.fillRect(0, 0, w, h);   // V1.26: the garage's chipboard box: pressed flakes
      noise(g, w, h, 9000, 0.55, ["#a88a5a", "#ddc596", "#8d7046", "#e8d4ab", "#b49461"]); }],
  };
  T.chalk = [0.8, 1.0, (g, w, h) => {                // chalkboard paint, chalk doodles (no words)
    g.fillStyle = "#1f2120"; g.fillRect(0, 0, w, h); noise(g, w, h, 8000, 0.15, ["#fff", "#000"]);
    const cs = ["#ff6fb5", "#7fc8ff", "#ffa04d", "#f4f4f4", "#c58bff", "#ff5a5a"];
    for (let i = 0; i < 26; i++) { g.strokeStyle = cs[i % cs.length]; g.globalAlpha = 0.55 + rnd() * 0.3; g.lineWidth = 2 + rnd() * 2; g.beginPath();
      const x = rnd() * w, y = rnd() * h, s = 20 + rnd() * 60;
      if (i % 3 === 0) g.arc(x, y, s / 2, 0, Math.PI * 2); else { g.moveTo(x, y); g.bezierCurveTo(x + s, y - s * rnd(), x - s * rnd(), y + s, x + s * rnd(), y + s * 1.2); }
      g.stroke(); }
    g.globalAlpha = 1; }];
  /* v69 (B2): a fine bump where the real thing has texture */
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
  T.door_wood = [0.8, 1.0, (g, w, h) => grain(g, w, h, "#b0713f", "rgba(110,60,25,", 70, 12)];
  T.door_white = [0.8, 0.8, (g, w, h) => { g.fillStyle = "#efece5"; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, 0.05, ["#d8d4cb"]); }];
  T.rug = [0.25, 0.25, (g, w, h) => weave(g, w, h, "#8e4a32", ["#7a3d28", "#a35a3e", "#86452e"], 8, 0.5)];   // V3.73: the music room's rug, rust
  T.storebox = [0.3, 0.3, (g, w, h) => weave(g, w, h, "#c9c1b2", ["#b9b1a2", "#d6cfc1"], 8, 0.4)];
  T.tapestry = [0.4, 0.4, (g, w, h) => weave(g, w, h, "#d9892a", ["#c97a20", "#e39a3c", "#d08327"], 6, 0.35)];
  T.tile_w = [0.3, 0.3, (g, w, h) => { g.fillStyle = "#c9c7c0"; g.fillRect(0, 0, w, h);   // the WC's 15 × 15 white tiles, grey grout
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { g.fillStyle = "#f2f2ef"; g.fillRect(c * w / 2 + 3, r * h / 2 + 3, w / 2 - 6, h / 2 - 6);
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(c * w / 2 + 3, r * h / 2 + 3, w / 2 - 6, 6); } }];
  if (!T[k]) return (HTEX[k] = null);
  const [sw, sh, draw] = T[k], px = !SMALL && HI_T.has(k) ? 1024 : 512, tex = canvasTex(px, px, (g, w, h) => { g.scale(w / 512, h / 512); draw(g, 512, 512); });   // v72 (B3): the surfaces seen close drawn at 1k on a computer (the same drawing, crisper), 512 on a phone
  const BUMP = { door_wood: 0.4, rug: 1.5, storebox: 1.0, tapestry: 0.9, tile_w: 0.8 };   // v69
  return (HTEX[k] = { map: tex, size: [sw, sh], bump: BUMP[k] || 0 });
}
