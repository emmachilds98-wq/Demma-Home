/* ---------------------------------------------------------------- materials */
const MATS = [];
/* v21: the cutaway: from above, what stands along the wall nearest the camera is cut off above CUT_H (both planes must agree:
   clipIntersection); updateCut() moves plane 0. */
const CUT_H = 95, CUT_IN = 32;
const CLIP = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e3), new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_H * 0.01)];
const clipMat = m => { m.clippingPlanes = CLIP; m.clipIntersection = true; m.clipShadows = true; return m; };
const glassLive = m => { if (m.transmission > 0) { m.userData.trans = m.transmission; m.transmission = 0; } return m; };   // v39: no live transmission (it draws the room twice a frame); still() puts it back for saved pictures
const reg = m => (MATS.push(clipMat(glassLive(grassy(m)))), m);
/* V2.68 (N22): every lawn without its repeat: a slow patchwork picks the photo or its larger turned copy, a slower one shades it; one
   program ("grass") */
function grassy(m) {
  if (!(m.map && m.map.userData.grass)) return m;
  m.customProgramCacheKey = () => "grass";
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", `#ifdef USE_MAP
    float ga = max(dot(textureLod(map, vec2(0.5), 12.0).rgb, vec3(0.333)), 0.01), gp = dot(texture2D(map, vMapUv * 0.061 + 0.23, 5.0).rgb, vec3(0.333)) / ga;
    vec4 sampledDiffuseColor = mix(texture2D(map, vMapUv), texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.43 + 0.37), smoothstep(0.9, 1.1, gp));
    sampledDiffuseColor.rgb *= clamp(dot(texture2D(map, vMapUv * 0.037 + 0.11, 4.0).rgb, vec3(0.333)) / ga, 0.8, 1.2); diffuseColor *= sampledDiffuseColor;
  #endif`); };
  return m;
}
const OAKS = new Set(["#c48c57", "#d9a46c", "#9c6a3f", "#a87443", "#cfa575", "#ddb78a", "#b08756", "#c79a6b", "#d8ad80", "#a37a50",
  "#b07a46", "#c89060", "#8a5c33", "#c08a52", "#c9a26a", "#c79a63", "#a8834f", "#d8c39f", "#e6d2ae", "#b99e78", "#cdb38a", "#d9c09a"]);
const PAINT_OLD = new Set(R.PAINT_OLD);
const lum = h => { const c = new THREE.Color(h); const o = {}; c.getHSL(o); return o.l; };
const BASE_L = lum(R.PAINT_BASE);
const paintMats = new Map();
function paintHex() { return S.paint === "custom" ? S.custom : R.PAINTS[S.paint].hex; }
/* v15: three paints: the walls, the ceiling, and the skirting with the door, its frame and the radiator ("match" = the walls' colour) */
function chHex(ch) {
  if (ch.startsWith("w:")) { const v = S.walls[ch.slice(2)]; if (/^#[0-9a-f]{6}$/i.test(v || "")) return v; }   // v38: one wall's own colour
  if (ch === "ceil" && S.ceil !== "match") return S.ceil;
  if (ch === "trim" && S.skirt !== "match") return S.skirt;
  return paintHex();
}
function paintColour(ratio, ch = "wall") {
  const c = new THREE.Color(chHex(ch)); const o = {}; c.getHSL(o);
  return new THREE.Color().setHSL(o.h, o.s, Math.min(0.94, o.l * Math.pow(ratio, 0.6)));
}
/* N172: the walls' emulsion, smooth but not computer-flat: a faint tone that drifts across a wall (about ±4%, a metre or so a patch) and
   its soft sheen, a little glossier in the roller's vertical laps (roughness about 0.76 to 0.95 of the paint's own). No relief, no picture:
   worked out from where the pixel is in the world, so it runs on across the living room's walls and the house's alike */
const PAINT_GRAIN = `varying vec3 vPgP;
float pgH(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pgN(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pgH(i), pgH(i + vec3(1, 0, 0)), f.x), mix(pgH(i + vec3(0, 1, 0)), pgH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(pgH(i + vec3(0, 0, 1)), pgH(i + vec3(1, 0, 1)), f.x), mix(pgH(i + vec3(0, 1, 1)), pgH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
`;
function paintGrain(sh) {
  sh.vertexShader = "varying vec3 vPgP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vPgP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  sh.fragmentShader = PAINT_GRAIN + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
  float pgT = 0.6 * pgN(vPgP * 0.9 + 3.1) + 0.4 * pgN(vPgP * 2.6 + 7.3);
  diffuseColor.rgb *= 1.0 + 0.09 * (pgT - 0.5);`).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
  roughnessFactor *= mix(0.76, 0.95, pgN(vec3(vPgP.x * 4.3, vPgP.y * 0.6, vPgP.z * 4.3) + 1.7));`);
}
function paintMat(ratio, eggshell, both, ch = "wall") {
  const k = ratio.toFixed(2) + (eggshell ? "e" : "") + (both ? "d" : "") + ch;
  // V2.2, the client: "ensure walls are all smooth but ceilings have the popcorn artex type ceiling": the walls flat emulsion, the ceilings artex
  const relief = eggshell || ch !== "ceil" ? {} : PHOTOS ? { normalMap: ARTEX_NRM, normalScale: new THREE.Vector2(0.8, 0.8) } : { bumpMap: WALL_BUMP, bumpScale: 0.6 };
  if (!paintMats.has(k)) paintMats.set(k, reg(new THREE.MeshStandardMaterial({ color: paintColour(ratio, ch), roughness: eggshell ? 0.45 : 0.92,
    ...relief, side: both ? THREE.DoubleSide : THREE.FrontSide, userData: { ratio, ch } })));   // (buildGroup's panels: twoFaced, not both)
  const m = paintMats.get(k);
  if (!eggshell && ch !== "ceil" && !m.userData.pg) { m.userData.pg = true; m.customProgramCacheKey = () => "paintwall"; m.onBeforeCompile = paintGrain; }   // N172
  return paintMats.get(k);
}
function repaint() { paintMats.forEach(m => m.color.copy(paintColour(m.userData.ratio, m.userData.ch))); reshadow(); }
const KIND = {};
/* v23: the stairs' side wall is brick (client): 0.6 m a repeat (GRAIN), eight 7.5 cm courses of 20 cm bricks, stretcher bond */
const BRICK_TEX = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#cbbca6"; g.fillRect(0, 0, w, h);
  const r = rnd(17), ch = h / 8, bw = w / 3;
  for (let row = 0; row < 8; row++) for (let k = -1; k < 4; k++) {
    const x = k * bw + (row % 2 ? bw / 2 : 0), t = r();
    g.fillStyle = `rgb(${150 + t * 30},${78 + t * 18},${55 + t * 12})`; g.fillRect(x + 2, row * ch + 2, bw - 4, ch - 4);
  }
});
function kindOf(fill, flags, size) {
  if (fill === "glass") return "glass";
  if (fill === "art") return "art";
  if (fill === "brick") return "brick";   // v23: the stairs' brick side wall
  if ((flags || "").includes("s") && ((flags || "").includes("g") || OAKS.has(fill))) return "stairs";   // v26: the stairs' wood keeps its own colour
  if (PAINT_OLD.has(fill)) return "paint";
  if ((flags || "").includes("o")) return "trans";
  const c = new THREE.Color(fill), o = {}; c.getHSL(o);
  if (size !== undefined && size < 1.6 && o.s > 0.6 && o.l > 0.45) return "led";
  if ((flags || "").includes("g") || OAKS.has(fill)) return "oak";
  return o.l < 0.12 ? "dark" : "plain";
}
const OAK_RELIEF = () => PHOTOS ? { normalMap: OAK_NRM, normalScale: new THREE.Vector2(0.5, 0.5) } : { bumpMap: OAK_BUMP, bumpScale: 0.35 };   // V1.1: the veneer's own
function kindMat(kind) {
  if (KIND[kind]) return KIND[kind];
  const m = {
    oak: () => new THREE.MeshStandardMaterial({ vertexColors: true, map: OAK_TEX, ...OAK_RELIEF(), roughness: 0.58 }),
    stairs: () => Object.assign(new THREE.MeshStandardMaterial({ vertexColors: true, map: OAK_TEX, ...OAK_RELIEF(), roughness: 0.58 }), { userData: { noTint: true } }),
    plain: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }),
    dark: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.05 }),
    fabric: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.9, ...(PHOTOS ? { normalMap: CORD_NRM, normalScale: new THREE.Vector2(0.9, 0.9) } : { bumpMap: CORD, bumpScale: 0.9 }), sheen: 0.45, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") }),   // v48 §4: the cord's soft sheen at the edges
    led: () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    glass: () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.04, transmission: 0, transparent: true, opacity: 0.16, depthWrite: false }),
    art: () => new THREE.MeshStandardMaterial({ map: ART_TEX, roughness: 0.5 }),
    brick: () => new THREE.MeshStandardMaterial({ map: BRICK_TEX, bumpMap: BRICK_TEX, bumpScale: 0.6, roughness: 0.92 }),   // V2.79: both faces in its shape (twoFaced)
    trans: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, transparent: true, opacity: 0.85 }),
  }[kind]();
  return KIND[kind] = reg(m);
}

/* ---------------------------------------------------------------- geometry from the plan's records */
const GRAIN = 0.6;   // metres of oak per texture repeat
const fillCol = f => new THREE.Color(f === "glass" || f === "art" || f === "brick" ? "#ffffff" : f);   // v35: kinds, not colours (the console's "Unknown color" warnings)
function colAttr(geo, cols) { geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); }
const SOFT = new Set([R.SOFA_CORD[0]]);   // v15: the blue corduroy sofa, upholstered rather than boxy
/* V3.86 (N139): your sofa upholstered as the sofa bed's (12's cushGeo): piped, swelling seats, plump backs; the cord at its old size */
function softGeo(b) {
  const [, x, y, z, w, h, d, f] = b, seat = h <= 14, back = Math.min(w, d) <= 16 && h <= 32 && !seat;
  const g = seat ? cushGeo(w, h, d, 1.6, 0.9, 3.5, 0.25, { welt: 0.45, bottom: true }) : back ? cushGeo(w, h, d, 2.2, 1.4, 6, 0.25, { welt: 0.45 })
    : cushGeo(w, h, d, 0.8, 0.6, 4, 0.2, { welt: 0.45 });
  g.translate(-(x + w / 2) * M, (y + h / 2) * M, (z + d / 2) * M);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.3, uv.getY(i) * 0.3);
  const c = fillCol(f), col = g.attributes.color;
  for (let i = 0; i < col.count; i++) { const k = col.getX(i); col.setXYZ(i, c.r * k, c.g * k, c.b * k); }
  return g;
}
/* V1.1: a box with rounded edges (EDGE cm): faces stop short, strips and corner triangles join them with each face's normal, so light
   rolls round the arris. 44 triangles; faces in BoxGeometry's order; sharp on a phone without a capable chip */
const EDGE = SMALL && !GOOD_PHONE ? 0 : 0.35;
function bevelBox(H, r) {            // H: half sizes (m); out: positions, normals and each vertex's face, three to a triangle
  const I = H.map(v => v - r), pos = [], nrm = [], face = [];
  const tri = (...V) => {             // V: [axis, sign, point]; wound to face out (the summed normals of its corners)
    const [a, b, c] = V.map(v => v[2]), u = b.map((q, i) => q - a[i]), w = c.map((q, i) => q - a[i]), n = [0, 0, 0];
    V.forEach(v => { n[v[0]] += v[1]; });
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) [V[1], V[2]] = [V[2], V[1]];
    for (const [ax, sg, p] of V) { pos.push(...p); const q = [0, 0, 0]; q[ax] = sg; nrm.push(...q); face.push(ax * 2 + (sg > 0 ? 0 : 1)); }
  };
  const pt = (ax, sg, o) => { const p = o.slice(); p[ax] = sg * H[ax]; return [ax, sg, p]; };   // o: the other two axes set, this one on its face
  for (let ax = 0; ax < 3; ax++) for (const sg of [1, -1]) {                                    // the faces
    const [b, c] = [0, 1, 2].filter(k => k !== ax), q = (sb, sc) => { const o = [0, 0, 0]; o[b] = sb * I[b]; o[c] = sc * I[c]; return pt(ax, sg, o); };
    tri(q(-1, -1), q(1, -1), q(1, 1)); tri(q(-1, -1), q(1, 1), q(-1, 1));
  }
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) for (const sa of [1, -1]) for (const sb of [1, -1]) {   // the edges
    const c = 3 - a - b, on = (ax, sc) => { const o = [0, 0, 0]; o[a] = sa * I[a]; o[b] = sb * I[b]; o[c] = sc * I[c]; return pt(ax, ax === a ? sa : sb, o); };
    tri(on(a, -1), on(a, 1), on(b, 1)); tri(on(a, -1), on(b, 1), on(b, -1));
  }
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {               // the corners
    const o = [sx * I[0], sy * I[1], sz * I[2]];
    tri(pt(0, sx, o), pt(1, sy, o), pt(2, sz, o));
  }
  return { pos, nrm, face };
}
function boxGeo(b) {
  const [, x, y, z, w, h, d, f, t, s] = b;
  if (SOFT.has(f)) return softGeo(b);
  const r = Math.min(EDGE, Math.min(w, h, d) * 0.2);
  if (r >= 0.05) return roundGeo(b, r);
  const g = new THREE.BoxGeometry(Math.max(w, 0.05) * M, Math.max(h, 0.05) * M, Math.max(d, 0.05) * M);
  g.translate(-(x + w / 2) * M, (y + h / 2) * M, (z + d / 2) * M);
  const uv = g.attributes.uv, span = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    const [su, sv] = span[face].map(v => v * M / GRAIN), rot = span[face][1] > span[face][0];
    const ox = ((x * 7.3 + z * 3.1) % 1), oy = ((y * 5.7 + face) % 1);
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k, u = uv.getX(i), v = uv.getY(i);
      if (rot) uv.setXY(i, v * sv + ox, u * su + oy); else uv.setXY(i, u * su + ox, v * sv + oy);
    }
  }
  const front = fillCol(f);
  const hue = c => { const o = {}; c.getHSL(o); return o; };
  const differs = c2 => { if (!c2) return false; const a = hue(front), b2 = hue(new THREE.Color(c2)); return Math.abs(a.h - b2.h) > 0.07 || Math.abs(a.s - b2.s) > 0.3; };
  const top = differs(t) ? new THREE.Color(t) : front, side = differs(s) ? new THREE.Color(s) : front;
  const faceCol = [side, side, top, top, front, front], cols = [];
  for (let face = 0; face < 6; face++) for (let k = 0; k < 4; k++) cols.push(faceCol[face].r, faceCol[face].g, faceCol[face].b);
  colAttr(g, cols);
  return g;
}
function boxLook(b) {                // the faces' colours (+x, -x, +y, -y, +z, -z) and grain (copies a side, offsets), as boxGeo's
  const [, x, y, z, w, h, d, f, t, s] = b;
  const front = fillCol(f);
  const hue = c => { const o = {}; c.getHSL(o); return o; };
  const differs = c2 => { if (!c2) return false; const a = hue(front), b2 = hue(new THREE.Color(c2)); return Math.abs(a.h - b2.h) > 0.07 || Math.abs(a.s - b2.s) > 0.3; };
  const top = differs(t) ? new THREE.Color(t) : front, side = differs(s) ? new THREE.Color(s) : front;
  const span = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  return { cols: [side, side, top, top, front, front], span, off: face => [((x * 7.3 + z * 3.1) % 1), ((y * 5.7 + face) % 1)] };
}
function roundGeo(b, r) {             // V1.1: boxGeo's box, its edges rounded (bevelBox), with the same colours and grain
  const [, x, y, z, w, h, d] = b, W = Math.max(w, 0.05), Hh = Math.max(h, 0.05), D = Math.max(d, 0.05);
  const H = [W * M / 2, Hh * M / 2, D * M / 2], { pos, nrm, face } = bevelBox(H, r * M), L = boxLook(b);
  const AX = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]], uvs = [], cols = [];   // each face's (u, v) axes, as the spans above
  for (let i = 0; i < face.length; i++) {
    const fc = face[i], [ua, va] = AX[fc], tu = (pos[3 * i + ua] + H[ua]) / (2 * H[ua]), tv = (pos[3 * i + va] + H[va]) / (2 * H[va]);
    const [su, sv] = L.span[fc].map(v => v * M / GRAIN), rot = L.span[fc][1] > L.span[fc][0], [ox, oy] = L.off(fc);
    if (rot) uvs.push(tv * sv + ox, tu * su + oy); else uvs.push(tu * su + ox, tv * sv + oy);
    cols.push(L.cols[fc].r, L.cols[fc].g, L.cols[fc].b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  colAttr(g, cols);
  g.translate(-(x + w / 2) * M, (y + h / 2) * M, (z + d / 2) * M);
  return g;
}
function polyGeo(p) {
  const c = p[1], n = c.length / 3, pts = [];
  for (let i = 0; i < n; i++) pts.push(v3(c[3 * i], c[3 * i + 1], c[3 * i + 2]));
  const pos = [], uvs = [], cols = [], col = new THREE.Color(p[2] && p[2][0] === "#" ? p[2] : "#ffffff");
  const nrm = new THREE.Vector3().crossVectors(pts[1].clone().sub(pts[0]), pts[2].clone().sub(pts[0]));
  const ax = Math.abs(nrm.x) > Math.abs(nrm.y) && Math.abs(nrm.x) > Math.abs(nrm.z) ? ["z", "y"] : Math.abs(nrm.y) > Math.abs(nrm.z) ? ["x", "z"] : ["x", "y"];
  const uvOf = q => [q[ax[0]] / GRAIN, q[ax[1]] / GRAIN];
  for (let i = 1; i < n - 1; i++) for (const q of [pts[0], pts[i], pts[i + 1]]) { pos.push(q.x, q.y, q.z); uvs.push(...uvOf(q)); cols.push(col.r, col.g, col.b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  colAttr(g, cols);
  g.computeVertexNormals();
  return g;
}
function frameMesh(f) {
  const [, x1, x2, top, z, holes, fill] = f;
  const sh = new THREE.Shape([new THREE.Vector2(-x1 * M, 0), new THREE.Vector2(-x2 * M, 0), new THREE.Vector2(-x2 * M, top * M), new THREE.Vector2(-x1 * M, top * M)]);
  for (const [a, b, yb] of holes) sh.holes.push(new THREE.Path([new THREE.Vector2(-a * M, yb * M), new THREE.Vector2(-a * M, (top - 2) * M), new THREE.Vector2(-b * M, (top - 2) * M), new THREE.Vector2(-b * M, yb * M)]));
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2 * M, bevelEnabled: false });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / GRAIN, uv.getY(i) / GRAIN);
  g.translate(0, 0, z * M);
  const c = fillCol(fill), cols = []; for (let i = 0; i < g.attributes.position.count; i++) cols.push(c.r, c.g, c.b);
  colAttr(g, cols);
  return new THREE.Mesh(g, kindMat(kindOf(fill, "g")));
}
function buildGroup(items, name) {
  const grp = new THREE.Group(); grp.name = name;
  const above = new THREE.Group(); above.name = "above"; grp.add(above);
  const buckets = {};
  for (const it of items) {
    if (it[0] === "f") { const m = frameMesh(it); shadow(m); grp.add(m); continue; }
    let geo, kind, fill = it[0] === "b" ? it[7] : it[2], flags = it[0] === "b" ? it[10] : it[3];
    if (fill === "screen" || fill === null) continue;
    if (it[0] === "b") { kind = SOFT.has(fill) ? "fabric" : kindOf(fill, flags, Math.max(it[4], it[5], it[6])); geo = boxGeo(it); }
    else { kind = kindOf(fill, flags); geo = polyGeo(it); }
    const high = it[0] === "p" && (Math.min(...it[1].filter((_, i) => i % 3 === 1)) >= R.CEIL - 0.5 || Math.min(...it[1].filter((_, i) => i % 3 === 2)) >= R.RECESS_Z + 0.5);   // V1.59: and a wall wholly past the room's back wall (the house has its own there)
    if (kind === "paint") {
      const st = (flags || "").includes("s");   // V2.0: the stair wall past the room in the room's own stair-wall paint (its 2D shade drew a line part-way up the stairs)
      const m = new THREE.Mesh(it[0] === "p" ? twoFaced(geo) : geo, paintMat((st && it[0] === "p" ? lum("#2d5a46") : lum(fill)) / BASE_L, it[0] === "b", false, st ? "w:stairs" : "wall"));
      shadow(m); (high ? above : grp).add(m); continue;
    }
    const key = kind + (it[0] === "p" ? "p" : "") + (high ? "h" : "");
    (buckets[key] = buckets[key] || { kind, poly: it[0] === "p", high, geos: [] }).geos.push(geo);
  }
  for (const b of Object.values(buckets)) {
    let geo = mergeGeometries(b.geos.map(g => g.index ? g.toNonIndexed() : g));
    if (b.poly || b.kind === "brick") geo = twoFaced(geo);   // V2.79 (N27): both faces in the shape, the kind's own one-sided material
    const m = new THREE.Mesh(geo, kindMat(b.kind)); shadow(m, b.kind !== "glass" && b.kind !== "led");
    (b.high ? above : grp).add(m);
  }
  return grp;
}
/* V2.79 (N27): a two-sided panel as two one-sided copies (the turned copy first), so it shares the boxes' shaders in one draw */
function twoFaced(g) {
  const s = g.index ? g.toNonIndexed() : g, n = s.attributes.position.count, out = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(s.attributes)) {
    const w = a.itemSize, src = a.array, dst = new src.constructor(src.length * 2), sg = k === "normal" ? -1 : 1;
    for (let i = 0; i + 2 < n; i += 3) for (let j = 0; j < 3; j++) { const f = (i + [0, 2, 1][j]) * w, t = (i + j) * w; for (let c = 0; c < w; c++) dst[t + c] = sg * src[f + c]; }
    dst.set(src, src.length); out.setAttribute(k, new THREE.BufferAttribute(dst, w, a.normalized));
  }
  return out;
}
function shadow(m, cast = true) { m.castShadow = cast; m.receiveShadow = true; return m; }

