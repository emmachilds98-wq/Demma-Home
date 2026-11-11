/* ---------------------------------------------------------------- textures, made here so nothing loads */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(BIG_GPU || GOOD_PHONE ? 16 : 8, gl.capabilities.getMaxAnisotropy());   // v44: as sharp at a slant as the card allows
  return t;
}
function rnd(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
/* oak: long streaks along u, with a few cathedral arcs and pores; drawn near white so it tints by the part's colour */
const OAK_TEX = canvasTex(1024, 512, (g, w, h) => {
  const r = rnd(11);
  g.fillStyle = "#e9e1d6"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    const y = r() * h, a = 0.05 + r() * 0.12, th = 0.6 + r() * 2.6;
    g.strokeStyle = r() < 0.75 ? `rgba(92,58,28,${a})` : `rgba(255,248,235,${a})`;
    g.lineWidth = th; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / (90 + r() * 60) + i) * (1 + r() * 2.5));
    g.stroke();
  }
  for (let k = 0; k < 7; k++) {          // cathedral figure
    const cx = r() * w, cy = r() * h, s = 40 + r() * 80;
    for (let j = 0; j < 9; j++) {
      g.strokeStyle = `rgba(110,70,35,${0.05 + r() * 0.07})`; g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(cx, cy, s * 3 + j * 14, s * 0.35 + j * 5, 0, 0, Math.PI * 2); g.stroke();
    }
  }
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(70,40,15,${0.08 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 5, 0.8); }
});
// v35: a plain white map and a flat bump stand in for "none", so a Look change never changes a material's shader (a recompile)
const BLANK = canvasTex(4, 4, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); });
const FLAT = canvasTex(4, 4, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); }, false);
const OAK_TEX_V = (() => { const tx = OAK_TEX.clone(); tx.rotation = Math.PI / 2; tx.center.set(0.5, 0.5); tx.needsUpdate = true; return tx; })();   // v29: upright grain, for tall doors

const OAK_BUMP = canvasTex(512, 256, (g, w, h) => {
  const r = rnd(5);
  g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 3 + r() * 9, 0.7); }
}, false);
const CARPET = canvasTex(512, 512, (g, w, h) => {   // v15: "soft grey carpet": a cool grey with a soft, fine pile
  const r = rnd(3);
  g.fillStyle = R.CARPET; g.fillRect(0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.04; }
  g.putImageData(im, 0, 0);
});
CARPET.repeat.set(7, 7);
/* v26: Look's floors: an oatmeal carpet and oak boards, besides your grey carpet */
const OATMEAL = canvasTex(512, 512, (g, w, h) => {
  const r = rnd(5); g.fillStyle = "#cdbfa8"; g.fillRect(0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 26; d[i] += n; d[i + 1] += n * 0.95; d[i + 2] += n * 0.85; }
  g.putImageData(im, 0, 0);
});
OATMEAL.repeat.set(7, 7);
const BOARDS = canvasTex(1024, 1024, (g, w, h) => {   // 14 cm boards, staggered joints, a little colour from board to board
  const r = rnd(12), bw = w / 8;
  for (let i = 0; i < 8; i++) {
    let y = -r() * h;
    while (y < h) { const len = h * (0.35 + r() * 0.4), t = r();
      g.fillStyle = `rgb(${152 + t * 30},${104 + t * 22},${64 + t * 16})`; g.fillRect(i * bw + 1, y + 1, bw - 2, len - 2);
      g.globalAlpha = 0.12; for (let k = 0; k < 9; k++) { g.fillStyle = r() < 0.5 ? "#7a5232" : "#e8c79c"; g.fillRect(i * bw + 2 + r() * (bw - 6), y, 1 + r() * 2, len); } g.globalAlpha = 1;
      y += len; }
  }
});
BOARDS.repeat.set(3.4, 2.5);
const PILE = canvasTex(256, 256, (g, w, h) => {      // the carpet's pile, for its bump
  const r = rnd(8); const im = g.createImageData(w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = 110 + r() * 40; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
}, false);
PILE.repeat.set(14, 14);
const CORD = canvasTex(64, 256, (g, w, h) => {      // v15: the sofa's corduroy: soft vertical ribs
  for (let x = 0; x < w; x++) { const v = 128 + 70 * Math.cos(x / w * Math.PI * 2 * 4); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); }
}, false);
CORD.repeat.set(36, 1);
/* v15: "a nice design rug that fits": cream ground, a deep blue border, big mid-century arches in rust, ochre and sage, a row of dots */
const RUG_TEX = canvasTex(1150, 800, (g, w, h) => {
  const [cream, rust, ochre, blue, sage] = R.RUG.cols, k = w / (R.RUG.x[1] - R.RUG.x[0]), b = R.RUG.border * k;
  g.fillStyle = blue; g.fillRect(0, 0, w, h);
  g.fillStyle = cream; g.fillRect(b, b, w - 2 * b, h - 2 * b);
  g.strokeStyle = ochre; g.lineWidth = 3; g.strokeRect(b + 14, b + 14, w - 2 * b - 28, h - 2 * b - 28);
  g.save(); g.beginPath(); g.rect(b, b, w - 2 * b, h - 2 * b); g.clip();
  const base = h - b - 90;
  for (const [cx, r, col] of [[0.27, 230, rust], [0.56, 290, ochre], [0.75, 200, sage], [0.49, 150, blue]]) {
    g.strokeStyle = col; g.lineCap = "butt";
    g.lineWidth = 44; g.beginPath(); g.arc(cx * w, base, r, Math.PI, 0); g.stroke();
    g.lineWidth = 18; g.beginPath(); g.arc(cx * w, base, r - 75, Math.PI, 0); g.stroke();
  }
  g.fillStyle = rust; g.fillRect(b + 30, base + 40, w - 2 * b - 60, 14);
  g.fillStyle = ochre; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(b + 90 + i * (w - 2 * b - 180) / 8, b + 120, 14, 0, Math.PI * 2); g.fill(); }
  g.restore();
  const r = rnd(21), im = g.getImageData(0, 0, w, h), d = im.data;   // wool: a little noise
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(im, 0, 0);
});
RUG_TEX.wrapS = RUG_TEX.wrapT = THREE.ClampToEdgeWrapping;
/* v20: other rugs to try (Decor), drawn when first picked: a flatweave jute, a deep blue with a cream border, sage and cream stripes */
const RUG_LOOKS = {
  jute: { edge: "#8f7650", draw(g, w, h) {
    g.fillStyle = "#b89a6c"; g.fillRect(0, 0, w, h);
    const r = rnd(33);
    for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(${90 + r() * 40},${70 + r() * 30},${40 + r() * 20},0.35)`; g.fillRect(0, y, w, 3); }
    for (let x = 0; x < w; x += 6) { g.fillStyle = "rgba(240,225,190,0.12)"; g.fillRect(x, 0, 2, h); }
    g.strokeStyle = "#8f7650"; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26); } },
  blue: { edge: "#22385a", draw(g, w, h) {
    g.fillStyle = "#2a4266"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e9e0cc"; g.lineWidth = 10; g.strokeRect(40, 40, w - 80, h - 80); g.lineWidth = 3; g.strokeRect(62, 62, w - 124, h - 124);
    g.strokeStyle = "rgba(233,224,204,0.35)"; g.lineWidth = 3;
    for (let x = 140; x < w - 120; x += 90) for (let y = 140; y < h - 120; y += 90) { g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 18, y); g.lineTo(x, y + 18); g.lineTo(x - 18, y); g.closePath(); g.stroke(); } } },
  stripes: { edge: "#5f6f52", draw(g, w, h) {
    g.fillStyle = "#ece4d2"; g.fillRect(0, 0, w, h);
    const band = [["#66775a", 95], ["#ece4d2", 28], ["#c7643a", 12], ["#ece4d2", 28], ["#66775a", 40], ["#ece4d2", 44]];
    let x = 0; while (x < w) for (const [c, bw] of band) { g.fillStyle = c; g.fillRect(x, 0, bw, h); x += bw; }
    g.fillStyle = "#5f6f52"; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); } },
};
let noiseTile = null;
function NOISE_TILE() {   // v39: a 128 square of grey noise, made once, for the rugs' wool (getImageData on a whole rug took 170 ms)
  if (noiseTile) return noiseTile;
  const c = noiseTile = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), im = g.createImageData(128, 128), d = im.data, r = rnd(22);
  for (let i = 0; i < d.length; i += 4) { const n = 128 + (r() - 0.5) * 32; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c;
}
function rugTex(k) {
  const L = RUG_LOOKS[k]; if (!L) return RUG_TEX;
  if (!L.tex) {
    L.tex = canvasTex(1150, 800, (g, w, h) => { L.draw(g, w, h);
      g.globalAlpha = 0.5; g.globalCompositeOperation = "overlay"; g.fillStyle = g.createPattern(NOISE_TILE(), "repeat"); g.fillRect(0, 0, w, h);   // v39: wool noise, tiled
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; });
    L.tex.wrapS = L.tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  return L.tex;
}
const WALL_BUMP = canvasTex(256, 256, (g, w, h) => {
  const r = rnd(9); const im = g.createImageData(w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = 120 + r() * 20; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
}, false);
WALL_BUMP.repeat.set(6, 6);
const SCREEN_TEX = canvasTex(1024, 576, (g, w, h) => {   // the TV's picture: the same dusk as the drawn renders
  const sky = g.createLinearGradient(0, 0, 0, h);
  [["#1b1638", 0], ["#4a2d5e", 0.45], ["#c0566a", 0.72], ["#f2a65e", 0.88], ["#f6c97c", 1]].forEach(([c, o]) => sky.addColorStop(o, c));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(w * 0.62, h * 0.69, 0, w * 0.62, h * 0.69, w * 0.22);
  sun.addColorStop(0, "rgba(255,242,196,1)"); sun.addColorStop(0.35, "rgba(255,214,138,0.7)"); sun.addColorStop(1, "rgba(255,176,112,0)");
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  const hills = [["#3a2550", [0, 44, 10, 36, 19, 41, 30, 30, 41, 39, 52, 33, 60, 38, 71, 28, 82, 37, 92, 32, 100, 36]],
                 ["#24183a", [0, 49, 12, 43, 25, 47, 38, 41, 50, 46, 63, 42, 76, 48, 88, 43, 100, 47]],
                 ["#150f24", [0, 53, 20, 50, 40, 53, 58, 50, 80, 54, 100, 51]]];
  for (const [c, p] of hills) {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, h);
    for (let i = 0; i < p.length; i += 2) g.lineTo(p[i] / 100 * w, p[i + 1] / 57.6 * h);
    g.lineTo(w, h); g.closePath(); g.fill();
  }
});
const ART_TEX = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, "#e9b44c"); gr.addColorStop(0.5, "#e2683c"); gr.addColorStop(1, "#7a2e5a");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const HESSIAN = canvasTex(256, 256, (g, w, h) => {   // v15: hessian's coarse, open weave
  const r = rnd(31);
  g.fillStyle = "#cfc4ae"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 4) { g.fillStyle = `rgba(90,70,40,${0.12 + r() * 0.14})`; g.fillRect(i, 0, 1.6, h); }
  for (let j = 0; j < h; j += 4) { g.fillStyle = `rgba(255,248,230,${0.08 + r() * 0.12})`; g.fillRect(0, j, w, 1.4); }
}, true);
HESSIAN.repeat.set(3, 9);
/* V1.1, the client: "i want better realism, quality and speed": CC0 photos (house/textures, house/SOURCES.md; inline in the data, as the
   house's) take over the drawn textures above as they arrive. The same texture objects, so no material changes and no new shaders. A
   colour photo is scaled to its drawn texture's average (at build, export3d.TINT), so every part keeps its colour (yours, the plan's) and only the grain, the
   weave and the pile are real. A phone without a capable chip keeps the drawn ones */
/* V1.9 (Phase 4): the photos come after the first picture (their own file on Pages, the page's last script on the shared page): until
   then each photo's texture is its mean colour (house/textures, photo_meta) and a flat relief, the same texture objects, so nothing
   recompiles when they land */
const PHOTO = {}, PMETA = (R.HOUSE3 && R.HOUSE3.photo_meta) || {}, PWAIT = [];
const PHOTOS = !(SMALL && !GOOD_PHONE) && !!(PMETA.lr_oak && PMETA.lr_oak.map);
let photosIn = null, photosDone = false;
function loadPhotos() {
  if (photosIn) return photosIn;
  const el = document.getElementById("photo-data"), src = el && el.dataset.src, txt = el && el.textContent.trim();
  return (photosIn = (txt ? Promise.resolve(txt) : src ? fetch(src).then(r => r.ok ? r.text() : "{}") : Promise.resolve("{}"))
    .then(t => JSON.parse(t)).catch(() => ({})).then(P => {
      for (const t of Object.values(P)) for (const f of ["map", "tmap", "nor", "rough"]) if (typeof t[f] === "string" && t[f][0] === "@") { const [k, g] = t[f].slice(1).split("."); t[f] = P[k][g]; if (P[k].half && P[k].half[g]) (t.half = t.half || {})[f] = P[k].half[g]; }   // a shared picture, sent once
      if (LOWD) for (const t of Object.values(P)) for (const f in t.half || {}) t[f] = t.half[f];   // V2.55 (N3): a phone without a strong chip takes the half-size set
      Object.assign(PHOTO, P); photosDone = true;
      /* V2.47 (speed, REAL_PLAN N2): each photo is a file of its own; the ones on what you can see now are fetched first, the rest
         a moment later, so the view you're on looks finished sooner on a phone's connection */
      const seen = onScreen(), now = w => w.k === "tile" || texSeen(w.tex, seen), all = PWAIT.splice(0), later = all.filter(w => !now(w));   // V3.57 (N114): the roof's tiles always first (the house opened under a flat beige roof)
      all.filter(now).sort((a, b) => (b.k === "tile") - (a.k === "tile")).forEach(w => w.go());
      setTimeout(() => (window.requestIdleCallback || (f => f()))(() => later.forEach(w => w.go()), { timeout: 2000 }), 1200);
    }));
}
function onScreen() { const seen = new Set(); scene.traverseVisible(o => { for (const m of [].concat(o.material || [])) for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) seen.add(t); }); return seen; }
const texSeen = (tex, seen) => !tex || [tex, ...(TEX_CLONES.get(tex) || [])].some(t => seen.has(t));
const whenPhoto = (k, f, fn, tex) => { if (!(PMETA[k] && PMETA[k][f])) return false; const go = () => PHOTO[k] && PHOTO[k][f] && fn(PHOTO[k][f]); photosDone ? go() : PWAIT.push({ go, tex, k }); return true; };
const TEX_CLONES = new WeakMap();   // a clone shares the picture but needs telling it changed (not in userData: three copies that as JSON)
const texClone = t => { const c = t.clone(); TEX_CLONES.has(t) ? TEX_CLONES.get(t).push(c) : TEX_CLONES.set(t, [c]); return c; };
TEX_CLONES.set(OAK_TEX, [OAK_TEX_V]);   // V1.12: the doors' upright oak, cloned before this list (it kept the drawn oak's texture: the site check's WebGL error)
/* V1.12: dispose first: WebGL2 keeps a texture at the size it was first sent (immutable storage), so a 1024 photo sent into its 4 × 4
   stand-in never showed (V1.9 to V1.11: the house's photos stayed their mean colour); disposed, it's made again at the photo's size */
function texPut(tex, img) { const bmp = typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap;   // V1.30: a bitmap comes flipped already
  const all = [tex, ...(TEX_CLONES.get(tex) || [])];
  all.forEach(t => t.dispose());   // every one first: a clone with the same settings shares the stand-in's storage until it's let go too
  for (const t of all) { t.image = img; t.flipY = !bmp; t.needsUpdate = true; gl.initTexture(t); } }
/* V2.64, the client: "freezing on load after first move": the photos landed together and three sent each to the graphics chip on the
   first frame that drew it. Now a photo waits its turn, each sent ahead of the frame that shows it (initTexture), the shadows redrawn
   once at the end. V2.67 (N15): "lag when moving": none while you move (it was one every 120 ms), as many as fit in 6 ms once you've
   been still 0.2 s; on a walk over 3 s, one a second, and only one on screen */
const UPQ = []; let upShade = false, upT = 0, upMv = 0, upGo = 0;
function texSet(tex, img, shade) { UPQ.push({ tex, img, shade }); }
function upStep(now, busy) {   // from the frame loop, every frame
  if (busy) { upGo = upGo || now; upMv = now; } else upGo = 0;
  if (!UPQ.length) { if (upShade && !busy) { upShade = false; reshadow(); dirty(); } return; }
  if (busy ? now - upGo < 3000 || now - upT < 1000 : now - upMv < 200) return;
  let i = 0;
  if (busy) { const seen = onScreen(); i = UPQ.findIndex(j => texSeen(j.tex, seen)); if (i < 0) { upT = now; return; } }
  const t0 = performance.now();
  do { const j = UPQ.splice(i, 1)[0]; i = 0; texPut(j.tex, j.img); if (j.shade) upShade = true; } while (UPQ.length && !busy && performance.now() - t0 < 6);
  upT = now; dirty();
}
/* V1.30 (U5): a photo decoded off the page's thread (createImageBitmap; it was decoded as it was first drawn, a stall each), flipped for
   WebGL as three expects; an <img> where that isn't there */
const DECODED = new Map();   // V2.47: a photo two textures share (the brick's, the pine's) is fetched and decoded once
function decodeImg(src) { if (!DECODED.has(src)) DECODED.set(src, decodeOnce(src)); return DECODED.get(src); }
function decodeOnce(src) {
  const tag = () => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  if (!window.createImageBitmap) return tag();
  return fetch(src).then(r => r.blob()).then(b => createImageBitmap(b, { imageOrientation: "flipY" })).catch(tag);
}
function photoInto(tex, k, f) {   // V2.67 (N15): the living room's colour match is in the photo (export3d.TINT), not done here
  if (PHOTOS) whenPhoto(k, f, src => decodeImg(src).then(im => texSet(tex, im)), tex);
}
const flatNormal = () => canvasTex(4, 4, (g, w, h) => { g.fillStyle = "#8080ff"; g.fillRect(0, 0, w, h); }, false);
const OAK_NRM = flatNormal(), CORD_NRM = flatNormal(), ARTEX_NRM = flatNormal();
CORD_NRM.repeat.set(1.44, 0.6);          // the photo's 100 ribs a copy: 144 across a cushion, as the drawn cord's
ARTEX_NRM.repeat.set(8, 8);              // V2.2: the living room's ceiling in artex (the house's stipple, 0.5 m a copy on a ~4 m piece)
photoInto(OAK_TEX, "lr_oak", "map"); photoInto(OAK_NRM, "lr_oak", "nor");
photoInto(HESSIAN, "lr_hessian", "map"); photoInto(CORD_NRM, "lr_cord", "nor"); photoInto(ARTEX_NRM, "artex", "nor");
photoInto(CARPET, "carpet_grey", "tmap"); photoInto(OATMEAL, "carpet", "tmap");   // the house's Carpet012, in your grey and the oatmeal
// v16: the client's light box is an IKEA OBEGRÄNSAD: a black panel with a 16 x 16 grid of white LEDs that shows blocky black-and-white
// pictures, "like pharmacy LED ads". Drawn showing a pixel music note; the unlit LEDs are dark grey dots on the black face.
// v16: the cap's embroidery. v37: drawn as rows of gold stitching in the shape of the client's cap (four lines on the crown, fourteen
// on the brim), not as words: on a transparent ground, laid over the green crown and the brown brim
const stitchTex = (w, h, rows) => canvasTex(w, h, (g, W, H) => {
  g.clearRect(0, 0, W, H); g.fillStyle = "#e2c06a"; const r = rnd(rows.length * 7), lh = H / (rows.length + 1);
  rows.forEach((f, i) => { const y = lh * (i + 0.75), lw = W * f; let x = (W - lw) / 2;
    while (x < (W + lw) / 2) { const ww = 6 + r() * 16; g.fillRect(x, y, Math.min(ww, (W + lw) / 2 - x), lh * 0.42); x += ww + (r() < 0.25 ? 9 : 3); } });   // stitched words
});
const CAP_CROWN_TEX = stitchTex(512, 220, [0.34, 0.5, 0.82, 0.9]);
const CAP_BRIM_TEX = stitchTex(512, 600, [0.86, 0.8, 0.8, 0.92, 0.6, 0.48, 0.66, 0.5, 0.6, 0.66, 0.84, 0.36, 0.36, 0.24]);
const NOTE = ["................", "......#######...", "......#######...", "......##....#...", "......#.....#...", "......#.....#...",
              "......#.....#...", "......#.....#...", "......#.....#...", "..####....####..", ".######..######.", ".######..######.",
              "..####....####..", "................", "................", "................"];
const LBOX_TEX = canvasTex(416, 416, (g, w, h) => {
  g.fillStyle = "#0b0b0c"; g.fillRect(0, 0, w, h);
  const n = 16, c = w / n;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
    const on = NOTE[r][k] === "#";
    if (on) { g.fillStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.arc((k + 0.5) * c, (r + 0.5) * c, c * 0.62, 0, 7); g.fill(); }
    g.fillStyle = on ? "#ffffff" : "#26262a"; g.beginPath(); g.arc((k + 0.5) * c, (r + 0.5) * c, c * 0.3, 0, 7); g.fill();
  }
});
