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
const HTEX = {}, HI_T = new Set(["tile_w", "tile_f", "door_wood", "chalk"]);
/* V2.56 (REAL_PLAN R3): the finishes without a photo take one of ours (build_textures.finishes): uPVC's peel, gloss paint's strokes, brushed
   metal; these keep their own colour over a white detail map (TINT) */
const HTEX_AS = { artisan: "oak", frame_out: "upvc", door_out: "upvc", gutter: "upvc", sill_board: "upvc", skirting: "gloss", door_white: "joinery", door_cream: "joinery", door_wood: "joinery", newel: "joinery", rail_white: "gloss", steel: "brushed", steel_dark: "brushed", wardrobe: "melamine" };   // N142 (V4.12): the white units' foil
const HTEX_TINT = new Set(["upvc", "gloss", "brushed", "joinery", "melamine"]);   // N111: the doors' painted timber, its grain up the leaf (the skirting's strokes along it, gloss)
const BED_TINT = new Set(["duvet", "pillow", "artisan"]);   // V4.3: and artisan oak, a hair warmer than the oak it shares   // V3.66 (N113): the bedding's own colour over its cotton photo, a hair below white (it drew the photo at full white: clipped on a phone)
/* V3.36 (N87): the soft things still flat colour in their own colours over the cotton's white, each with a relief of its kind: the
   tapestry's dark border and the roller blinds woven as the chair-bed, the music room's felt panels knitted, the bath mats' pile as the
   carpet's (the rug, the fabric boxes and the tapestry keep their drawn weaves, T below) */
const SOFT_REL = { tapestry_dark: "lycksele", blind_cloth: "lycksele", panel: "check", bathmat: "carpet_grey" };
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
const FIN = { W: 234, H: 404, map: null, pal: null, rooms: [], kind: { paint: 0, ceiling: 1, artex: 1, duvet: 2, pillow: 2 }, inv: new THREE.Matrix4() };   // N5d: the bedding (palette slot 5; its room from where it is in the house, as a bed's lid moves)   // V2.8: not the stair wall: it's the living room's (Look)
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
    Object.assign(sh.uniforms, { finMap: { value: FIN.map }, finPal: { value: FIN.pal }, finKind: { value: FIN.kind[k] }, finRoom: { value: room }, finScale: { value: scale }, finInv: { value: FIN.inv } });
    sh.vertexShader = "uniform mat4 finInv;\nvarying vec3 vFinP;\nvarying vec3 vFinN;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vFinP = " + (FIN.kind[k] === 2 ? "(finInv * modelMatrix * vec4(transformed, 1.0)).xyz" : "transformed") + "; vFinN = objectNormal;");
    sh.fragmentShader = "uniform sampler2D finMap;\nuniform sampler2D finPal;\nuniform float finKind;\nuniform float finRoom;\nuniform float finScale;\nvarying vec3 vFinP;\nvarying vec3 vFinN;\n" +
      `int finAt(vec2 c, int fl) { ivec2 t = ivec2(int(clamp(floor(c.x / 2.0), 0.0, ${FIN.W - 1}.0)), int(clamp(floor((c.y + 309.0) / 2.0), 0.0, ${FIN.H - 1}.0)) + fl * ${FIN.H}); return int(texelFetch(finMap, t, 0).r * 255.0 + 0.5); }\n` +
      sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec3 finD = diffuse;
  { vec3 fn = normalize(vFinN); float xc = -vFinP.x * 100.0, zc = vFinP.z * 100.0, yc = vFinP.y * 100.0;
    int fl = yc < 0.0 ? 0 : (yc < 260.0 ? 1 : 2); int rm = int(finRoom);
    if (rm < 0) { float o = finKind < 0.5 ? 3.0 : 0.0;
      ivec2 t = ivec2(int(clamp(floor((xc - fn.x * o) / 2.0), 0.0, ${FIN.W - 1}.0)), int(clamp(floor((zc + fn.z * o + 309.0) / 2.0), 0.0, ${FIN.H - 1}.0)) + fl * ${FIN.H});
      rm = int(texelFetch(finMap, t, 0).r * 255.0 + 0.5); }
    if (rm > 0) { float nx = -fn.x, nz = fn.z; int sl = finKind > 1.5 ? 5 : finKind > 0.5 ? 4 : (abs(nx) > abs(nz) ? (nx > 0.0 ? 2 : 3) : (nz > 0.0 ? 0 : 1));
      vec4 fc = texelFetch(finPal, ivec2(sl, rm), 0); if (fc.a > 0.5) finD = fc.rgb * finScale;
      if (finKind > 1.5) rm = 0; }
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
      finD *= shd; } }
  vec4 diffuseColor = vec4( finD, opacity );`);
  };
  return m;
}
const FIN_SLOT = { back: [0], front: [1], east: [2], west: [3], walls: [0, 1, 2, 3], ceiling: [4], bedding: [5] };
function finish(room, surface, hex) {   // R3D.finish: a room's walls (or one side) or its ceiling to a colour; null puts it back as drawn; no room: every one
  if (!finSetup()) return false;
  const rows = room == null ? FIN.rooms.map((_, i) => i + 1) : [FIN.rooms.indexOf(room) + 1], slots = FIN_SLOT[surface || "walls"];
  if (!slots || rows.some(r => r < 1)) return false;
  const c = hex ? new THREE.Color(hex) : null, d = FIN.pal.image.data;   // linear, as the material's own colour
  for (const r of rows) for (const s of slots) { const i = (r * 8 + s) * 4;
    if (c) { d[i] = Math.round(Math.min(1, c.r) * 255); d[i + 1] = Math.round(Math.min(1, c.g) * 255); d[i + 2] = Math.round(Math.min(1, c.b) * 255); d[i + 3] = 255; } else d[i + 3] = 0; }
  FIN.pal.needsUpdate = true; dirty(); return true;
}
/* V3.44 (N96): the black things (the desk chairs, the stools, the monitors' backs, the handles) drew near pure black in every room, their
   shapes lost: a plain colour darker than #383838 is raised to it, its hue kept (black still black, its form now reads in the light). A
   screen, the glass and the shade where things meet stay as they are */
const BLACK_MIN = 0x38 / 255, BLACK_KEEP = new Set(["contact", "screen", "glass_dark", "pc_glow", "led"]);
function liftBlack(c) { const t = {}; c.getRGB(t, THREE.SRGBColorSpace); const mx = Math.max(t.r, t.g, t.b); if (mx >= BLACK_MIN) return c;
  if (mx < 1e-3) return c.setRGB(BLACK_MIN, BLACK_MIN, BLACK_MIN, THREE.SRGBColorSpace);
  const f = BLACK_MIN / mx; return c.setRGB(t.r * f, t.g * f, t.b * f, THREE.SRGBColorSpace); }
function houseTex(k) {
  if (k in HTEX) return HTEX[k];
  if (k === "paint") return (HTEX[k] = null);
  const rel = /^cloth\d$/.test(k) ? "check" : SOFT_REL[k];
  if (rel) { const J = houseTex(rel), W = houseTex("duvet");   // V3.32 (N82): the garments in their own colours over the poplin's white, with the knit's relief (they were flat card); a map and a relief, as the throw's: no shader of their own
    return (HTEX[k] = J && J.normal && W && W.map ? { map: W.map, normal: J.normal, size: J.size, bump: 0, rough: null, roughMean: 0, tint: true } : null); }   // V3.36 (N87): the other soft things the same way, each its own relief   // V2.2, the client: "ensure walls are all smooth": flat emulsion, no plaster relief
  /* v70 (BUILD_SPEC phase 3): CC0 photo-textures (Poly Haven, house/SOURCES.md) and our own (build_textures.py) where we have them; the drawn
     ones below for the rest (V2.37: the ones a photo replaced gone) */
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
  const cols = { leaf: ["#5d7f35", "#4f7130", "#6b8c3c", "#45652b", "#789a45"], dark: ["#2f4d27", "#3a5a2c", "#28421f", "#456634"], needle: ["#2c4a26", "#36552c", "#22391d", "#3f5f31"], red: ["#8e2a1e", "#a8442a", "#5d6b33", "#4c5a2a", "#b5513a"] }[k];
  return (SPRAY[k] = canvasTex(256, 256, (g, w, h) => {
    if (k === "needle") {                                      // fronds: a stalk with short needles both sides
      for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, L = w * (0.25 + rnd() * 0.2), x0 = w / 2 + Math.cos(a) * w * 0.06, y0 = h / 2 + Math.sin(a) * h * 0.06;
        g.strokeStyle = cols[i % cols.length]; g.lineWidth = 3;
        for (let t = 0; t < 1; t += 0.06) { const x = x0 + Math.cos(a) * L * t, y = y0 + Math.sin(a) * L * t, n = 14 * (1 - t * 0.6);
          for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + sg * 0.9) * n, y + Math.sin(a + sg * 0.9) * n); g.stroke(); } } }
      return; }
    /* V3.59 (N114): a soft clump, not a scatter: a dense darker core of overlapping rounds (the shade inside a crown), then leaves
       over it, more of them and nearer the middle, so a crown reads as masses of leaf, not salt and pepper */
    const deep = { leaf: "#3d5a26", dark: "#22381c", red: "#4a2a1c" }[k];
    g.fillStyle = deep; for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * w * 0.17; g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, w * (0.1 + rnd() * 0.07), 0, 7); g.fill(); }
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
    const per = Math.round((P.cards || 1400) * 0.45 / ends.length), to = cards[P.tone || (P.dark ? "dark" : "leaf")];   // V2.89 (N30): the red-tipped shrubs
    for (const e of ends) for (let i = 0; i < per; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * S * 0.4, q = Math.sqrt(1 - u * u);
      to.push([e.x + Math.cos(a) * q * rr, e.y + u * rr * 0.65, e.z + Math.sin(a) * q * rr, card * 1.5 * (0.7 + rnd() * 0.6)]); }   // V3.59 (N114): fewer, larger clumps
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
      for (let k = 0; k < 12; k++) { const u = rnd() * 2 - 1, b = rnd() * Math.PI * 2, rr = Math.cbrt(rnd()) * h * 0.38, q = Math.sqrt(1 - u * u);   // V3.59 (N114): 12 larger clumps a tree (were 26 small)
        to.push(v3(cx + Math.cos(b) * q * rr, (B.hill ? B.hill.base : -262) + h * 0.62 + u * rr * 0.7, cz + Math.sin(b) * q * rr)); } }
    const plane = new THREE.PlaneGeometry(1, 1);
    for (const [k, pts] of Object.entries(list)) {
      const mt = reg(new THREE.MeshStandardMaterial({ map: sprayTex(k), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 })); mt.clippingPlanes = [];
      const im = new THREE.InstancedMesh(plane, mt, pts.length);
      pts.forEach((p, i) => { o.position.copy(p); o.rotation.set((rnd() - 0.5) * 1.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.2); o.scale.setScalar(3.6 + rnd() * 2.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.raycast = () => {}; land.add(im); }
  }
}
/* V3.44 (N81), the client: "improve the graphics quality of other rooms to match like the living room": out of the front rooms' windows
   the land ran flat and green to the sky. Now a street: the road and its pavements both ways, and across it a row of brick terraces
   (front gardens, low walls, white windows, doors, tiled roofs, chimneys, lamp posts). A stand-in, not the real street (no address, no
   photo of it): it changes when the client says what's across the road. One draw a finish; every finish a photo and its relief on the
   ground's own shader (map and relief, both sides, no cut), so no shader of its own */
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
  for (let x = X0 + 900; x < X1; x += 3000) {   // lamp posts on the far pavement
    box("post", x - 6, dr, zr1 + 45, x + 6, dr + 620, zr1 + 57); box("post", x - 5, dr + 608, zr1 - 60, x + 5, dr + 618, zr1 + 57); box("lamp", x - 14, dr + 596, zr1 - 75, x + 14, dr + 608, zr1 - 30); }
  /* each finish the house's own material (a copy, its colour tinted where said, uncut): its program already built, so the street adds
     none (the phone's first picture has no shader to spare) */
  const FIN_ = { road: ["road"], paving: ["paving"], kerb: ["concrete"], brick: ["brick"], brick2: ["brick_buff"], roof: ["tile"], frame: ["upvc"], pane: ["pane"], panelit: ["pane"],
    door: ["door_out", "#3c4a5c"], door2: ["door_out", "#6b2a2a"], hedge: ["ivy"], post: ["steel_dark"], lamp: ["upvc", "#fff3dd"] };
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
function worldUV(geo, k, off) {
  const T = houseTex(k); if (!T) return geo;
  const P = geo.attributes.position, N = geo.attributes.normal, uv = new Float32Array(P.count * 2), [sw, sh] = T.size, ox = off ? off.x : 0, oy = off ? off.y : 0, oz = off ? off.z : 0;
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
  /* V3.35, the client: "obscure squares / lines" up the stairs: a band whose strip crosses a stairwell's opening (no floor, or no ceiling,
     there: model.stair_wells) hung in the air over the flight; each edge keeps only its parts clear of them */
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
/* V2.52 (REAL_PLAN R2, N8): the shade round each standing piece's foot (a band out from each open side, mitred at its corners) and up
   the wall beside a piece that stands against one (a wardrobe's sides, a fridge's), from the house file's outlines (model.piece_shade),
   so phones without ambient occlusion have it too; built with its floor, so it follows a piece the client moves. One mesh a floor, the
   shade's own material (houseShade's kind: no new shaders) */
function pieceShadeMat() {   // houseShade's kind of material (the same shader), its shade eased out to nothing: no edge to see
  const tex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
    for (const [t, a] of [[0, 0.24], [0.15, 0.15], [0.35, 0.07], [0.6, 0.025], [1, 0]]) gr.addColorStop(t, `rgba(0,0,0,${a})`);
    g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = reg(new THREE.MeshBasicMaterial({ color: "#000000", map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -10 }));
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
/* V3.63 (N112): the shade where a room's walls meet its floor, its ceiling and each other, on the walls (model.edge_shade): one mesh a
   floor, pieceShadeMat's kind of material (the same shader), its own key in the house's materials so the cuts (Above, On its own) cut it
   as the walls. Where the live shade (GTAO) draws this frame it isn't drawn: no doubled shade */
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
/* V2.98 (N37): the house from outside: a material's pieces on every floor one draw, not one a floor (each floor's span noted, and the
   floors shown are always a run, Lower, Lower and Ground, or all four, so one draw range); made when first wanted (09 houseJoin),
   dropped when a floor is built again */
let HJOIN = null;
const JOIN_FL = ["lower", "ground", "first", "roof"];
function joinBuild() {
  const by = new Map(), G = new THREE.Group(), list = [];
  for (const fk of JOIN_FL) for (const me of (HFLOOR[fk] || { children: [] }).children) if (me.userData.fm) { if (!by.has(me.material)) by.set(me.material, []); by.get(me.material).push(me); }
  for (const [m, L] of by) { if (L.length < 2) continue;
    const mixed = L.some(q => q.geometry.index) && L.some(q => !q.geometry.index), geos = L.map(q => mixed && q.geometry.index ? q.geometry.toNonIndexed() : q.geometry), span = [];
    let at = 0; for (let i = 0; i < L.length; i++) { const q = geos[i], n = q.index ? q.index.count : q.attributes.position.count; span.push([L[i].userData.fm, at, n, L[i]]); at += n; }
    const geo = mergeGeometries(geos); geos.forEach((q, i) => { if (q !== L[i].geometry) q.dispose(); }); if (!geo) continue;
    const me = new THREE.Mesh(geo, m); me.castShadow = L[0].castShadow; me.receiveShadow = true; me.visible = false; me.userData.span = span; G.add(me); list.push(me); }
  houseG.add(G); return (HJOIN = { G, list });
}
function joinDrop() {
  if (!HJOIN) return;
  for (const me of HJOIN.list) { me.geometry.dispose(); for (const sp of me.userData.span) sp[3].layers.enable(0); }
  houseG.remove(HJOIN.G); HJOIN = null;
}
function buildHouse() {
  const HS = R.HOUSE; if (!HS) return;
  houseG = new THREE.Group(); houseG.visible = false; scene.add(houseG);
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
    const m3 = {}, mat3 = k => m3[k] || (m3[k] = k === "contact" ? contactMat() : k === "stairpaint" ? stairMat() : (() => { const [c, r] = H3.mats[k] || ["#cccccc", 0.9], gl3 = k === "glass" || k === "glass_frost", T = houseTex(k);
      const m = reg(new THREE.MeshStandardMaterial({ color: T && !T.tint && !BED_TINT.has(k) ? "#ffffff" : c, map: T ? T.map : null, bumpMap: T && T.bump ? T.map : null, bumpScale: T ? T.bump : 1, normalMap: T && T.normal || null, roughness: T && T.rough ? Math.min(1, r / T.roughMean) : r, roughnessMap: T && T.rough || null, metalness: k === "brass" || k === "chrome" || k === "steel" ? 0.8 : k === "mirror" ? 0.25 : 0, transparent: gl3, opacity: gl3 ? (k === "glass" ? 0.14 : 0.86) : 1,   /* V1.13: clear (0.3 tinted the outside blue-green); V2.40: frosted, the light through */ depthWrite: !gl3, side: HOUSE_SIDE,
        emissive: { led: "#ffffff", pc_glow: "#cfe0ff", screen: "#1b2433", lamp_purple: "#8a45ff", bulb: "#ffc98a" }[k] || "#000000", emissiveIntensity: { led: 1.5, pc_glow: 0.9, screen: 0.12, lamp_purple: 2.2, bulb: 4 }[k] || 0 }));   // V3.76 (N116): a ceiling bulb lit, warm   // V2.48: the office's purple lamp   // v60: the kitchen's LED battens glow; v61: the PC's glass, the screens
      m.envMapIntensity = 0.15;   // v60: the reflections are the living room's (its LEDs tinted the kitchen's white walls pink)
      const NS = { paint: 0.3, ceiling: 0.3, brick: 0.7, party: 0.7, soldier: 0.7 }[k];   // V1.47, the client: "walls ... have a rugged non flat effect ... should be smooth or have less of that look": the relief turned down
      if (m.normalMap && NS) m.normalScale.set(NS, NS);
      if (!LOWD) { m.userData.hk = k; m.envMap = houseEnv(); m.envMapIntensity = finishEnv(m); }   // v73: one neutral room, made once (V1.13: the iPhones too)
      if (!m.map && !gl3 && !BLACK_KEEP.has(k)) liftBlack(m.color);   // V3.44 (N96): a black piece shows its shape (it drew as a hole)
      if (k === "mirror") { m.color.set("#ffffff"); m.map = MIRROR_SHEEN; }   // V1.17: the hall's and the bathroom's mirrors as the living room's (grey before; as metal, black)
      if (gl3) glassTod(m);
      const rk = (H3.depth_rank || {})[k] ?? 3;   // V1.31 (U6): where faces lie in one plane the higher rank is drawn (house/model.py depth_rank); constant, so nothing shows through at a slant
      if (rk) { m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -2 * rk; }
      houseClip(m, [], false); m.userData.hk = k; return finPatch(m, k); })());   // V2.64: 6 planes from the start (09_house_views)
    if (S.fin === undefined && R.HOUSE3.client_finishes && Object.keys(R.HOUSE3.client_finishes).length) finRestore(R.HOUSE3.client_finishes);   // V2.11: the scheme kept in the repo, until this device picks its own
    HMATS = m3; FIN.mat3 = mat3; blindsApply(); hceilApply(); finApplyAll();
    if (window.__finPending) { const p = window.__finPending; window.__finPending = null; finImport(p); }   // V2.11: from a Send link opened before the 3D was ready   // V2.7: (mat3 for a floor laid by the tray)   // V2.6: the colours kept for the house's rooms
    /* V2.71 (N16): each piece's room: the one room whose space holds it whole (walls, slabs, the stairs, the roof and what two rooms'
       outlines share: none, always drawn). A floor's mesh of a material keeps each room's pieces together, in the rooms' order, each
       room's span noted (userData.rooms: [room, first, count]), so standing in a room the rest can be left out (09 roomCull) */
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
      const me = new THREE.Mesh(worldUV(mergeGeometries(geos), m.userData.hk), m); me.receiveShadow = true;   // V2.8: the stair wall takes shadows as the living room's stair wall below it does (V2.2 took them off: two shades along the flight)
      if (rooms) me.userData.rooms = rooms;
      me.castShadow = !m.transparent; g.add(me); geos.forEach(q => q.dispose()); return me; };   // v69: the house's walls and pieces cast the sun's shadow (as the living room's)
    const mx = new THREE.Matrix4();
    /* v69 (B4), the client: "more realistic like our living room": furniture, fittings and soft things with rounded edges (cm by
       material: the whites and woods a little, the suite and cushions a lot); walls, floors and frames stay sharp */
    const ROUND = { pine: 0.8, pine_dark: 0.3, knob: 1.4, handle_black: 0.7, newel: 1.2, rail_white: 1.8, monitor_back: 1.5, mouse: 1.5, key_dark: 0.25, key_pink: 0.25, book0: 0.3, book1: 0.3, book2: 0.3, book3: 0.3, book4: 0.3, book5: 0.3, birch: 0.6, oak: 0.6, wardrobe: 0.5, gloss: 0.8, door_white: 0.4, door_wood: 0.4, fitting: 6, porcelain: 1, sanitary: 1,
      primrose: 4, duvet: 3, pot: 4, lycksele: 5, storebox: 1.5, leather: 2, check: 1, curtain: 1, mattress: 4, pillow: 6,
      /* V2.44, the client: "improve graphics again so current blocky new room furniture looks more real": every piece's edges catch the
         light (a bevel to its size): the black fittings, chairs and frames, the appliances, steel and chrome, the screens and the PC, the
         rugs and mats, the bins, the chalkboard; the worktop a little (its joins stay tight) */
      black: 0.6, black_app: 1.2, worktop: 0.4, steel: 0.5, steel_dark: 0.5, chrome: 0.4, screen: 0.4, glass_dark: 0.3, pc_white: 0.8, panel: 0.5,
      rug: 0.8, bathmat: 0.8, recycle: 1, bin: 1, bin_white: 1, tapestry: 0.6, tapestry_dark: 0.6, chalk: 0.3, mirror: 0.3, blind_cloth: 0.3 };
    const SOFT = { pillow: 4, mattress: 3, duvet: 3 };
    const CLOTH = { lycksele: 1, leather: 1, pillow: 1, mattress: 1, duvet: 1, cloth0: 1, cloth1: 1, cloth2: 1, cloth3: 1, cloth4: 1, cloth5: 1, cloth6: 1 };   // V2.17: drawn as cloth (clothBox)   // V1.20: the soft things' edges round in steps (one step read as a chamfer: slabs)
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
      /* V2.79 (N27): the rounding as fine as it shows: under 0.8 cm (the keys, books, handles, doors' arrises) one bevel an edge as the
         living room's boxes have (bevelBox, 44 triangles, not 108; like RoundedBoxGeometry, not indexed), under 2 cm (the knobs, the mouse, the rails) two steps, not four
         (108, not 300); the big curves (the fittings, the pots) as they were. The light rolls round each edge the same */
      const re = Math.max(0.0005, Math.min(r, Math.min(w, h, d) / 2 - 0.05));
      if (!SOFT[mk] && re < 0.8) {
        const { pos, nrm, face } = bevelBox([w * M / 2, h * M / 2, d * M / 2], re * M), AX = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]], H = [w, h, d], uv = [];
        for (let i = 0; i < face.length; i++) { const [ua, va] = AX[face[i]]; uv.push(pos[3 * i + ua] / (H[ua] * M) + 0.5, pos[3 * i + va] / (H[va] * M) + 0.5); }
        const b = new THREE.BufferGeometry(); b.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); b.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
        b.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); b.translate(c.x, c.y, c.z); return b; }
      const b = new RoundedBoxGeometry(w * M, h * M, d * M, SOFT[mk] || (re >= 2 ? 2 : 1), re * M);
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
    /* V1 (Phase 3): a floor can be built again with the client's edits (editedFloor: the edited pieces moved and sized, the walls round a
       door or a window following it); the floor keeps its group, so what's shown and hidden stays as it was */
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
      { const ps = pieceShade(F, m3.shade_piece || (m3.shade_piece = pieceShadeMat())); if (ps) cur.add(ps); }   // V2.52 (R2)
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
  /* N181, the client 13 Nov 2026: "open in pc and mobile without next door and gardens to lighten load": the gardens round the house (the
     plants, the low building, the table, the front, the alley) and next door's things are built the first time they show (Gardens or Next
     door on, or a room's windows: outNeed in 09_house_views), not with the house */
  HFLOOR.out = new THREE.Group(); houseG.add(HFLOOR.out); HFLOOR.nextThings = new THREE.Group(); houseG.add(HFLOOR.nextThings);
  OUTLAZY.nextThings = () => buildThings(HFLOOR.nextThings, "next");   // next door's, with Next door
  OUTLAZY.out = () => { const was = cur; cur = HFLOOR.out;
  buildPlants(cur);                                                               // V1.3: the cordyline in the back garden (with Gardens)
  buildBeyond(cur, null);                                                          // V1.4: the low building past the far fence
  buildThings(cur, "ours");                                                        // V1.6: the table and chairs
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
  label(["The front garden", "the drive, the lawn · sizes to come"], (gx0 + hx1) / 2, 120, zf + 280);
  label(["The back garden", "about 25 m"], 240, -260 + 160, -309 - 900);
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
  label(["The alley", "stairs down to the garden"], (ax0 + ax1) / 2, 120, -40);
  cur = was; };
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
  if (R.HOUSE3) for (let k = 0; k < 6; k++) { const l = new THREE.PointLight("#ffcf98", 0, 7, 2); l.visible = false; l.userData.houseLight = true; if (k >= 4) l.userData.hdOnly = true; scene.add(l); ROOMLIGHTS.push(l);   // v69 (B3): at the start, so the set never changes; V3.57 (N108): six (Fast four), every nearby room's on
    if (k < 3) { const w = new THREE.RectAreaLight("#eef0f2", 0, 1, 1); w.visible = false; w.userData.houseLight = w.userData.win = true; scene.add(w); WINLIGHTS.push(w); }   // V2.39: a window's daylight; V3.57: three
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
    requestAnimationFrame(() => { preDraw(); requestAnimationFrame(frame); requestAnimationFrame(() => setTimeout(loadPhotos, 30)); });   // V2.66 (N13): the shadows a frame ahead   // V1.9: the photos once the first picture is up
    if (!/[?&]nocompile\b/.test(location.search)) setTimeout(() => (window.requestIdleCallback || (f => f()))(warmRest, { timeout: 4000 }), 1500); };   // V2.72 (N14): the rest after
  /* V2.72 (N14), the client 7 Nov 2026: "Review if any further improvements could be made on the way you land into the site": the start
     built every shader in the scene before the first picture, 108 of them, though the house from outside draws 30 (the living room is
     hidden from outside, and its hidden parts too). Now it builds what the landing shows (the living room put away first, as the first
     frame would), and the rest a moment after the first picture, in parallel where the browser can */
  const warmRest = () => { const was = gl.getRenderTarget(); try { if (postLive() && PRE.rtAO) gl.setRenderTarget(PRE.rtAO); compileClipped(camera); } catch (e) {} finally { gl.setRenderTarget(was); } };
  precompile();                                                                         // v35: hidden parts' shaders, while the room's idle (listed before the living room is put away)
  livingFromOutside();                                                                  // V2.72 (N14): what the landing hides, hidden before its shaders are built
  if (gl.compileAsync && !/[?&]nocompile\b/.test(location.search)) {
    msg.textContent = "Building the house…"; msg.hidden = false;
    const was = gl.getRenderTarget();
    try {
      if (postLive()) { if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }); gl.setRenderTarget(PRE.rtAO); }
      texWarm(); Promise.race([Promise.all([compileClipped(camera, true), postWarm()]), new Promise(r => setTimeout(r, 8000))]).then(first, first);   // V2.66 (N13): the shade's and glow's too; the textures meanwhile   // V2.64: by cutting planes (01_renderer)
    } catch (e) { first(); } finally { gl.setRenderTarget(was); }
  } else first();
  lookFromHash();                                                                       // v28: a shared #look- link (after the first compile, so its note shows)
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
    still, finish, finishes: () => JSON.parse(JSON.stringify(finAll(false))), setFinishes: o => finImport(o), ready: true, buildMs: Math.round(performance.now() - t0), _dbg: { get flying() { return !!tween; }, get warming() { return { busy: !!WARMB, parts: PRE.busy, warmed: [...WARMED] }; }, openAct, finAll, get H3() { return R.HOUSE3; }, get RMODE() { return RMODE; }, spotAt, goStandAt: goStand, HPARTS, PICK, HEDITS, get actId() { return actId; }, swingDoor, WALK, walkMove, collide, bodyBlocked, floorAtCm, HSOLID, livSolids, livFloors,  swingAll, gl, scene, lights, get sun() { return sun; }, SUNCFG, get winGlass() { return winGlass; }, AO, ENV, envLevels, bloomLevels, roomEnv, THREE, S, MOV, floorHop, solidBoxes, leafTexture, UNDO, camera, controls, VIEWS, MATS, OAK_TEX, CABP, SUGG_G, IDEA_G, CATALOGUE, BES, WORK, precompile, PRE, AIMG, warmSwitch, WARMED },
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

