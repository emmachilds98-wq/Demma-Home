/* N225 (REAL_PLAN section 29): the bathroom's and the WC's tiles her own: a tile (S.fin[room][90]) and its grout ([91]), from a tap on the
   tiles. Drawn by swapping the tiled material's own maps (the bathroom's walls `stone`, the WC's splashback `tile_w`: only those rooms have
   them) for ones drawn here at the tile's size and bond, so no new shader; the plan's back on The plan's, while held and As it is. Costed
   by the tiled area +10%, the grout and a tiler (fit.SOURCES n225tiles). The toilets and basins swap as pieces (08_house_catalogue.js) */
const TILE_ROOMS = { bathroom: "stone", wc: "tile_w", kitchen: "metro" }, TILE_PLAN = { bathroom: "stone-effect 60 × 30", wc: "white 15 × 15", kitchen: "black metro 20 × 10" };   // N224: the kitchen's splashback too
const TILE_STYLES = [["metro", "White metro", 15, 7.5, "#f1f0ec", 0.5, 0, 23], ["sage", "Sage metro", 15, 7.5, "#a3b39b", 0.5, 0, 21.33],
  ["square", "White square", 10, 10, "#f2f2ef", 0, 0, 48], ["zellige", "Zellige", 10, 10, "#eeece4", 0, 1, 36.86], ["large", "Large white", 60, 30, "#efeeea", 0, 0, 16],
  ["gsage", "Sage glass", 60, 75, "#95a38a", 0, 2, 231], ["gcream", "Cream glass", 60, 75, "#ebe3cf", 0, 2, 200], ["gblack", "Black glass", 60, 75, "#1e1f21", 0, 2, 178]];   // key, name, W × H cm, face, bond, handmade (2: a glass panel, the kitchen's), £ a m² (fit.SOURCES n225tiles, n224glass)
const tileStyles = room => TILE_STYLES.filter(q => q[6] !== 2 || room === "kitchen");
const TILE_GROUT = [["white", "White", "#ecebe6"], ["grey", "Grey", "#a3a29d"], ["charcoal", "Charcoal", "#4a4b4d"]], TILE_FIT = [20, 50], TILE_BAG = [10, 11];   // a tiler £ a m²; a bag of grout
const TILE_TEX = {}, TILE0 = new WeakMap();   // the drawn maps by tile, grout and material; each material's own (not in userData: three copies that as JSON)
const tileOk = (room, k, v) => !!TILE_ROOMS[room] && (k === 90 ? tileStyles(room).some(([q]) => q === v) : k === 91 && TILE_GROUT.some(([q]) => q === v));
function tileOf(room) { const st = tileStyles(room).find(([q]) => q === finGet(room, 90)); return st ? { st, g: TILE_GROUT.find(([q]) => q === finGet(room, 91)) || TILE_GROUT[0] } : null; }
function tileAt(hit) {   // a tap on the tiles: their room's card
  const m = hit && hit.object && hit.object.material, hk = m && !Array.isArray(m) && m.userData && m.userData.hk;
  const room = hk && Object.keys(TILE_ROOMS).find(r => TILE_ROOMS[r] === hk); return room ? { room, slot: 90 } : null;
}
function tileArea(room) {   // m² tiled: each tile box's face (its two longest sides), on its room's floor
  const H = R.HOUSE3 || {}, r = (H.rooms || {})[room], F = r && (H.floors || {})[HCFK[String(r[4])]], L = (F && (F.boxes || {})[TILE_ROOMS[room]]) || [];
  return L.reduce((t, b) => { const d = [b[3] - b[0], b[4] - b[1], b[5] - b[2]].sort((p, q) => q - p); return t + d[0] * d[1] / 1e4; }, 0);
}
function tileUps(room, add) {   // Changes: the tiles by their area (+10% for cuts), a bag of grout, a tiler
  const q = tileOf(room); if (!q) return; const A = tileArea(room) || 2;
  if (q.st[6] === 2) { add(`90=${q.st[0]}`, `Splashback: ${q.st[1]}, ${A.toFixed(1)} m²`, [A * q.st[7], A * q.st[7] * 1.25]); return; }   // N224: glass, self-adhesive (made to measure costs more)
  add(`90=${q.st[0]}.${q.g[0]}`, `Tiles: ${q.st[1]}, ${q.g[1].toLowerCase()} grout, ${A.toFixed(1)} m²`, [A * 1.1 * q.st[7] + TILE_BAG[0] + A * TILE_FIT[0], A * 1.1 * q.st[7] + TILE_BAG[1] + A * TILE_FIT[1]]);
}
/* a square of whole tiles about 60 cm a side, drawn at the tile's size as build_textures.tiles draws the plan's: the grout 2 mm and sunk,
   each tile's glazed edge rounded and a hair its own shade and level; the handmade ones wavier and more mottled */
function tileTex(st, g, hk) {
  const key = `${st[0]}.${g[0]}.${hk}`; if (TILE_TEX[key]) return TILE_TEX[key];
  const [, , tw0, th0, face, bond, hand] = st, glass = hand === 2, tw = glass ? 60 : tw0, th = glass ? 60 : th0, n = Math.max(1, Math.round(60 / tw)), span = n * tw, rows = Math.round(span / th);
  const px = SMALL ? 512 : 1024, cm = span / px, gw = glass ? 0.04 : 0.1, bev = hand ? 0.3 : 0.12, hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), F = hex(face), G = hex(g[2]);
  let s = 9 + st[0].length * 31; const rn = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const T = Array.from({ length: rows * n }, () => [rn(), rn(), rn(), rn()]);   // each tile: its shade, its tilt both ways, its wave
  const hgt = new Float32Array(px * px), col = new Uint8ClampedArray(px * px * 4), rgh = new Uint8ClampedArray(px * px * 4), nrm = new Uint8ClampedArray(px * px * 4);
  for (let j = 0; j < px; j++) { const y = (j + 0.5) * cm, row = Math.floor(y / th), ly = y - row * th, off = (row % 2) * tw * bond;
    for (let i = 0; i < px; i++) { const xx = (i + 0.5) * cm - off, c = Math.floor(xx / tw), lx = xx - c * tw, t = T[row * n + ((c % n) + n) % n];
      const d = glass ? Math.min(lx, tw - lx) : Math.min(lx, tw - lx, ly, th - ly), p = j * px + i, q = p * 4; let k, r;
      if (d < gw) { if (glass) { r = 0.2; hgt[p] = 0.1; for (let e = 0; e < 3; e++) col[q + e] = F[e] * 0.7; col[q + 3] = 255; rgh[q] = rgh[q + 1] = rgh[q + 2] = r * 255; rgh[q + 3] = 255; continue; }   // a panel's seam
        k = (0.82 + 0.18 * Math.min(1, d / gw * 1.4)) * (0.95 + rn() * 0.08); r = 0.9; hgt[p] = rn() * 0.01; for (let e = 0; e < 3; e++) col[q + e] = G[e] * k; }
      else if (glass) { hgt[p] = 0.3; const k = 0.97 + 0.05 * (ly / th); r = 0.04; for (let e = 0; e < 3; e++) col[q + e] = F[e] * k; }   // N224: the panel's face, a hair lighter up
      else { const e1 = Math.min(1, (d - gw) / bev), mot = hand ? Math.sin(lx * 1.3 + t[3] * 9) * Math.sin(ly * 1.1 + t[0] * 7) : 0;
        hgt[p] = (1 - (1 - e1) * (1 - e1)) * 0.3 + (t[1] - 0.5) * 0.02 * (lx - tw / 2) + (t[2] - 0.5) * 0.02 * (ly - th / 2) + mot * (hand ? 0.05 : 0);
        k = (hand ? 0.88 + t[0] * 0.14 + mot * 0.03 : 0.97 + t[0] * 0.05) * (1 - 0.14 * Math.pow(Math.max(0, 1 - (d - gw) / 0.35), 2));   // the edge darker into the joint
        r = hand ? 0.12 + t[3] * 0.06 : 0.07 + t[3] * 0.03; for (let e = 0; e < 3; e++) col[q + e] = F[e] * k; }
      col[q + 3] = 255; rgh[q] = rgh[q + 1] = rgh[q + 2] = r * 255; rgh[q + 3] = 255; } }
  for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) {   // the relief: its slope, rows down the picture (as build_textures)
    const h = (a, b) => hgt[((b + px) % px) * px + (a + px) % px], gx = (h(i + 1, j) - h(i - 1, j)) / (2 * cm), gy = (h(i, j + 1) - h(i, j - 1)) / (2 * cm), l = Math.hypot(gx, gy, 1), q = (j * px + i) * 4;
    nrm[q] = (-gx / l + 1) * 127.5; nrm[q + 1] = (gy / l + 1) * 127.5; nrm[q + 2] = (1 / l + 1) * 127.5; nrm[q + 3] = 255; }
  const rep = ((houseTex(hk) || {}).size || [0.6, 0.6]).map(v => v * 100 / span);   // the photo's metres a repeat over the pattern's
  const tex = (a, srgb) => { const t = canvasTex(px, px, gc => gc.putImageData(new ImageData(a, px, px), 0, 0), srgb); t.repeat.set(rep[0], rep[1]); return t; };
  return (TILE_TEX[key] = { map: tex(col, true), normalMap: tex(nrm, false), roughnessMap: tex(rgh, false) });
}
function tileApply() {   // each tiled room's material: her tiles' maps, or its own (only the maps it has: no new program)
  if (!HMATS || !FIN.mat3) return;
  for (const [room, hk] of Object.entries(TILE_ROOMS)) { const m = HMATS[hk] || FIN.mat3(hk); if (!m || !m.map) continue;
    if (!TILE0.has(m)) TILE0.set(m, { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: m.roughness });
    const o = TILE0.get(m), q = !finHeld && tileOf(room), T = q && tileTex(q.st, q.g, hk);
    for (const f of ["map", "normalMap", "roughnessMap"]) if (o[f]) m[f] = T ? T[f] : o[f];
    m.roughness = T && o.roughnessMap ? 1 : o.roughness; }
  dirty();
}
function tileSet(room, style, grout) {   // her tile (null: the plan's, its grout with it), a grout with it
  finPush(); S.fin = S.fin || {}; const o = S.fin[room] = S.fin[room] || {};
  if (style) { o[90] = style; if (grout) o[91] = grout; } else { delete o[90]; delete o[91]; }
  if (!Object.keys(o).length) delete S.fin[room];
  store.set(KEY, S); tileApply(); finSchDraw(); const q = tileOf(room);
  toast(`${roomName(room)}: ${q ? (q.st[6] === 2 ? `${q.st[1].toLowerCase()} splashback` : `${q.st[1].toLowerCase()} tiles, ${q.g[1].toLowerCase()} grout`) : "the plan's tiles"}`);
}
function tileCard(room) {   // [title, now, buttons, -, the tray]: the tiles, then their grout
  const q = tileOf(room), u = q && roomUps(room).find(x => x.k.startsWith("90="));
  const glass = q && q.st[6] === 2, st = q ? [glass ? q.st[1] : `${q.st[1]}, ${q.g[1].toLowerCase()} grout`, u ? upRange(u.lo, u.hi) : ""].filter(Boolean).join(" · ") : `The plan's: ${TILE_PLAN[room]}`;
  const bs = [...(FIN_UNDO.length ? [btn("Undo", { finundo: "1" })] : []), ...(q ? [btn("The plan's", { tileplan: "1" })] : []), btn("Hold to compare", { finhold: "1" }, undefined, "", "Hold to compare: the tiles as planned till you let go"), ...(room === "kitchen" ? [btn("The units", { actopen: "fin:kitchen:92" })] : [])];   // N224
  const sw = (at, k, t, c, now) => `<button type="button" class="sw" data-${at}="${k}" style="--c:${c}" aria-pressed="${now === k}" title="${t}" aria-label="${t}"><i></i><span>${t.split(",")[0]}</span></button>`;
  return [`${roomName(room)}: ${room === "kitchen" ? "the splashback" : "the tiles"}`, st, bs, null, `<div class="r3d-fin"><div class="r3d-fintray" role="group" aria-label="Tiles">${tileStyles(room).map(([k, t, w, h, c]) => sw("tile", k, `${t}, ${w} × ${h} cm`, c, q && q.st[0])).join("")}</div>`
    + (q && !glass ? `<span class="r3d-finlab">Grout</span><div class="r3d-fintray" role="group" aria-label="Grout">${TILE_GROUT.map(([k, t, c]) => sw("grout", k, t, c, q.g[0])).join("")}</div>` : "") + `</div>`];
}
if (act) act.addEventListener("click", e => { const b = e.target.closest("[data-tile],[data-grout],[data-tileplan]");
  if (!b || !GS.actId || !/^fin:[a-z0-9_]+:90$/.test(GS.actId)) return; e.stopPropagation(); const room = GS.actId.split(":")[1], d = b.dataset;
  tileSet(room, d.tileplan ? null : d.tile || finGet(room, 90), d.grout || null); renderAct(); }, true);
