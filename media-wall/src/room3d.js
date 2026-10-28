/* v14: the room in 3D. The furniture is the plan's own geometry (export3d.py records every box, polygon and face frame the
   HD renderer draws); the shell, the lights, the TV picture, shelf B and the floor lamp are built here from the same numbers.
   Room coordinates are cm: x from the side (east) wall, y up, z from the room (negative) to the alcove's back. Three.js uses
   metres with x mirrored so the picture isn't flipped. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { Sky } from "three/addons/objects/Sky.js";   // V1.3: the sky over the whole house   // v48 §5: the lights' glow

const root = document.getElementById("r3d");
const SC = JSON.parse(document.getElementById("scene3d-data").textContent);
const R = SC.room;
/* v37, client: "The shelf on the wall alongside the stairs must always end 10cm short of the right-hand wall, regardless of any other
   sizing or positioning logic": the black shelf's window end is pinned to the pipe boxing's face plus its gap, whatever the data says */
{ const sb = R.SHELF_B, gap = 10, len = Math.abs(sb.z[0] - sb.z[1]), end = R.PIPE_BOX.z[1] + gap; sb.gap = gap; sb.z = [end + len, end]; }
const M = 0.01;
const v3 = (x, y, z) => new THREE.Vector3(-x * M, y * M, z * M);
const qs = s => root.querySelector(s), qsa = s => [...root.querySelectorAll(s)];
const msg = qs("#r3d-msg");

const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
/* v35: an error trap. Anything that goes wrong in the room (a script error, a failed promise, three's own console errors: a shader
   that won't compile, a lost graphics context) shows a small note and is kept: the last 20 in this browser (R3D.errors() lists them)
   and, on the deck, in its database ("errors"), so the next round can read what you saw, on which device */
const ERRS = { t: 0, busy: false, db: null };
function noteError(kind, m, stack) {
  if (ERRS.busy) return; ERRS.busy = true;
  try {
    const c = gl && gl.getContext && gl.getContext(), dbg = c && c.getExtension("WEBGL_debug_renderer_info");
    const e = { at: new Date().toISOString(), kind, msg: String(m || "").slice(0, 400), stack: String(stack || "").slice(0, 1200),
      ua: navigator.userAgent, dpr: devicePixelRatio, size: [innerWidth, innerHeight], frame: window.top !== window ? "embedded" : "page",
      gpu: dbg ? String(c.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "", state: (() => { try { return JSON.stringify(S).slice(0, 3000); } catch (x) { return ""; } })() };
    const log = store.get("r3d-errors", []); log.push(e); store.set("r3d-errors", log.slice(-20));
    if (window.sharedStore && window.sharedStore.use) (ERRS.db || (ERRS.db = window.sharedStore.use("db"))).then(db => db && db.doc("errors/" + e.at.replace(/[^0-9]/g, "")).set(e)).catch(() => {});
    if (performance.now() - ERRS.t > 10000) { ERRS.t = performance.now(); toast("Something went wrong in the 3D room: it's been noted. " + e.msg.slice(0, 90)); }
  } catch (x) {} finally { ERRS.busy = false; }
}
addEventListener("error", e => { if (e.error || e.message) noteError("error", e.message, e.error && e.error.stack); });
addEventListener("unhandledrejection", e => { const r = e.reason || {}; noteError("promise", r.message || r, r.stack); });
{ const ce = console.error.bind(console); console.error = (...a) => { ce(...a); noteError("console", a.map(x => (x && x.message) || String(x)).join(" "), a.find(x => x && x.stack) && a.find(x => x && x.stack).stack); }; }
const SMALL = window.matchMedia && matchMedia("(pointer: coarse), (max-width: 700px)").matches;   // phones and tablets start on Fast
const WARM = "#ffe2b8";
const DEF = { site: "C", dining: "folded",   // v27: the dining cabinet is the plan
              scene: "evening", tod: "evening", paint: "mint", custom: "#dbffc8",   /* v51: the client's pale mint */ lamp: "corner", drawers: false,   // v45: Cosy first
              quality: SMALL ? "fast" : "hd", view: "room",   // v21: the whole room first
              // v15: every light on a slider (the scenes fill them in), the smart bars and the lamp in any colour, ceiling and skirting paints
              lv: null, master: 100, warm: 25, col: { strips: WARM, bar1: WARM, bar2: WARM, lamp0: R.LAMP_RGB[0], lamp1: R.LAMP_RGB[1], lamp2: R.LAMP_RGB[2] },
              ceil: "match", skirt: "match", laser: false, lbox: true, curtains: false, pc: true, ideas: {},   // v17: ideas all off
              // v18: the plant stand and the record shelf's layout, your own moves (edit mode) and the things you've added; the grow lights
              plants: "corner", layout: {}, added: [], grow: true,
              chairs: "cupboard",   // v20: the chair cupboard beside the table (doors shut); "open", "hooks" or "away" (the garage)
              // v20, client: "give more decor variation and options": the rug, sofa cushions, the curtains, what's in the glass case and its frame
              decor: { rug: "yours", cushions: "none", curtains: "hessian", fill: "collect", frame: "oak", oak: "artisan", floor: "carpet", shelf: "black", pads: "olive", ceiling: "asis", plants: "mix", pots: "mine" },   // v26: the oak, the floor, your shelf; v31: the seat pads
              sugg: {},     // v21: the suggested furniture and decor, all off
              seat: "off",
              cab: "compact", cabw: "90", tdoor: false,   // v33: cabw, the compact cabinet's table: 90 wide (the plan) or 80 (10 shorter)
              cam: "orbit", pad: false, foot: false, beside: "clear",
              blind: "down", lp: false, trolley: "park", lid: false, barflap: false, ctop: false, sdraw: false };   // v37: the step drawers out   // v34: the blind (a suggestion) down or rolled up; a record lifted out of the vinyl stand; the trolley parked or at the table   // v31: what's beside the compact cabinet   // v31: a drag circles round a spot or looks round from where you stand; the move buttons on the room   // v30: the compact cabinet (the plan) or the sliding one; the table door open with the table folded   // v23: the fold-down seat at the stair end (an option): "off", "up" (folded) or "down"   // v20: the chair cupboard beside the table (doors shut); "open", "hooks" or "away" (the garage)
DEF.lamp = R.LAMP_DEFAULT || "sofa";
/* v38: the room opens on the client's plan (geometry.FIRM: their saved picks, the bar beside the cabinet, the sage-stripe rug); every
   other choice is an option to look at */
if (R.FIRM) { DEF.sugg = Object.fromEntries(R.FIRM.sugg.map(k => [k, true])); DEF.svar = Object.assign({}, R.FIRM.svar);
  DEF.beside = R.FIRM.beside; DEF.cabw = R.FIRM.cabw; DEF.decor = Object.assign({}, DEF.decor, R.FIRM.decor);
  DEF.ideas = Object.fromEntries((R.FIRM.ideas || []).map(k => [k, true])); }   // v43: the C-table is in the plan   // v18: the window corner holds the plant stand or the record shelf   // v16: the table by the stairs by default; the laser off
const KEY = "mw18-3d";
const S = Object.assign({}, DEF, store.get(KEY, {}));
if (!S.v45) {   // v45, client: "stipple ceiling as default and cosy lighting": once, a saved room moves to them; your own choices stay after
  S.v45 = 1; S.scene = "cosy"; S.tod = "evening"; S.lv = null; S.decor = Object.assign({}, S.decor, { ceiling: "stipple" });
}
if (!S.v46) {   // v46, client: "default view could balance lighting throughout the room using all fixtures": once, a saved room moves to Evening
  S.v46 = 1; S.scene = "evening"; S.lv = null; S.master = 100; }
if (!S.v51) {   // v51, client: their phone plan is the main plan, "Switch to the pale mint": once, a saved room moves to it
  S.v51 = 1; S.paint = "mint"; S.walls = {}; S.ceil = "match"; S.skirt = "match"; S.ideas = Object.assign({}, S.ideas, DEF.ideas); }
if (!S.v50) {   // v50, client: "make the natural default light a bit cosier and less overly light washed": once, a saved room moves to the new Evening
  S.v50 = 1; S.scene = "evening"; S.lv = null; S.master = 100; S.warm = DEF.warm; }

S.col = Object.assign({}, DEF.col, S.col || {});
if (!S.ideas || typeof S.ideas !== "object") S.ideas = {};
if (!S.sugg || typeof S.sugg !== "object") S.sugg = {};
if (!S.svar || typeof S.svar !== "object" || Array.isArray(S.svar)) S.svar = {};   // v28: each suggestion's version (its first by default)
S.decor = Object.assign({}, DEF.decor, (S.decor && typeof S.decor === "object") ? S.decor : {});
if (!Number.isFinite(S.nowp)) S.nowp = 0;   // v39: the LP facing out on the ledge
if (!S.picked) S.quality = "fast";   // v35: every device starts in Fast; HD follows if its first frames are quick (autoQuality)
if (!S.layout || typeof S.layout !== "object" || Array.isArray(S.layout)) S.layout = {};
if (!Array.isArray(S.added)) S.added = [];
if (!(S.plants in R.PLANT_LAYOUTS)) S.plants = DEF.plants;
S.edit = false;
if (!S.seen21) { S.view = "room"; S.seen21 = true; }   // v21: everyone starts once on the new whole-room view
// V1.2, the client (28 Oct 2026): "Old style, rebuilt" and "The whole house in 3D" first: the page opens on the house, not the room it was
// left in (?room opens the living room; a #look- link opens its look as before)
if (!/[?&](embed|room)\b/.test(location.search) && !/^#look-/.test(location.hash)) S.view = "house";
if (!S.seen27) { if (S.site === "B") S.site = "C"; S.seen27 = true; }   // v27: the dining cabinet is the plan now: the old default moves to it once
if (S.dining === "eight") S.dining = "six";                              // v27: the cabinet seats six (v26 had eight)
if (!(S.paint in R.PAINTS) && S.paint !== "custom") S.paint = DEF.paint;
/* v38, client: "I want ability to change each walls colour individually": each wall is a named surface; S.walls holds a colour for any
   wall that differs from the rest ("match" or missing: the walls' paint) */
const WALLS = [["media", "Media wall"], ["breast", "Chimney breast"], ["door", "Door wall"], ["stairs", "Stairs wall"], ["window", "Window wall"], ["pc", "PC wall"]];
const WALL_NAME = Object.fromEntries(WALLS);
if (!S.walls || typeof S.walls !== "object") S.walls = {};
/* v38, client: "Turning the light fixture as a whole as well as the light heads": each fixture (the two spot bars on their ceiling roses,
   the red lamp on its base) turns as a whole, S.fix[id] in degrees from the plan's; each head, S.head["bar1:0"], has its own on/off,
   level, colour and aim (turn and tilt, in degrees from its plan aim). A turn or an aim rebuilds that fixture with the same number of
   lights, so the graphics card makes no new shaders (v35) */
if (!S.fix || typeof S.fix !== "object" || Array.isArray(S.fix)) S.fix = {};
if (!S.head || typeof S.head !== "object" || Array.isArray(S.head)) S.head = {};
const FIX_NAME = { bar1: "Spot bar 1, over the sofa", bar2: "Spot bar 2, over the table", lamp: "Your red lamp" };
const HEAD_COLS = [[null, "Its own colour"], ["#ffe2b8", "Warm white"], ["#f2f5ff", "Cool white"], ["#ffb35c", "Amber"], ["#ff7fb6", "Pink"], ["#7fd6ff", "Blue"], ["#8cf09a", "Green"]];
const fixDeg = id => +(S.fix[id] || 0);
const headOf = k => S.head[k] || {};
const fixKey = id => JSON.stringify([fixDeg(id), Object.entries(S.head).filter(([k]) => k.startsWith(id + ":")).map(([k, h]) => [k, h.yaw || 0, h.tilt || 0])]);
function aimDir(dir, rad, h) {          // a head's aim (world): its plan aim, turned with its fixture, then its own turn and tilt
  const Y = new THREE.Vector3(0, 1, 0), d = dir.clone().applyAxisAngle(Y, rad);
  if (h.yaw) d.applyAxisAngle(Y, h.yaw * Math.PI / 180);
  if (h.tilt) { const ax = new THREE.Vector3().crossVectors(d, Y); if (ax.lengthSq() > 1e-6) d.applyAxisAngle(ax.normalize(), h.tilt * Math.PI / 180); }
  if (d.y > -0.05) d.y = -0.05;          // a head can aim level, not at the ceiling
  return d.normalize();
}
let lookWall = "all";            // Look's paint row: all the walls, or one
function setWall(id, v) {        // a paint's key, a colour, or "match"; the walls' own paint counts as "match"
  const h = v === "match" ? null : R.PAINTS[v] ? R.PAINTS[v].hex : v;
  if (h && /^#[0-9a-f]{6}$/i.test(h) && h.toLowerCase() !== paintHex().toLowerCase()) S.walls[id] = h; else delete S.walls[id];
}

/* ---------------------------------------------------------------- the lighting presets (scenes.py) and their two rules
   v25: three presets (bright, cosy, film); dinner is a rule (the table open lifts bar 2), daytime a switch (S.tod) that works with any
   preset. Saved choices from the old six buttons map across once. */
const SCENES = JSON.parse(document.getElementById("scenes-data").textContent);
const LIGHT_RULES = JSON.parse((document.getElementById("lightrules-data") || {}).textContent || '{"boost":{"bar2_min":45,"bar2_max":55,"bar1_max":15,"strip_max":40,"bias":0},"old":{}}');
const OLD_SCENE = LIGHT_RULES.old || {};
function oldScene(o) {               // an old scene key in o (saved state, a link, a still) becomes a preset, with daytime as a switch
  if (o.scene && !(o.scene in SCENES) && o.scene in OLD_SCENE) { if (o.scene === "day") o.tod = "day"; o.scene = OLD_SCENE[o.scene]; if (o === S) S.lv = null; }
  return o;
}
oldScene(S);
if (!(S.scene in SCENES)) S.scene = DEF.scene;
if (S.tod !== "day") S.tod = "evening";
const LAYERS = ["strip", "uprights", "bias", "bar1", "bar2", "lamp", "accent"];   // v46: accent, the glass case, the bar, the PC and the like
if (!S.lv) S.lv = Object.assign({}, SCENES[S.scene].levels);
if (S.lv.accent === undefined) S.lv.accent = SCENES[S.scene].levels.accent ?? 70;      // v46: a room saved before Accents
const tableOpen = () => S.dining && S.dining !== "folded";
function lvl(k) {                     // a layer's level: the slider, the table rule when the flip-top is open, then the master slider
  let v = S.lv[k] ?? 0;
  if (tableOpen()) { const B = LIGHT_RULES.boost; if (k === "bar2") v = Math.min(Math.max(v, B.bar2_min), B.bar2_max ?? 100); else if (k === "strip") v = Math.min(v, B.strip_max ?? 100); else if (k === "bar1") v = Math.min(v, B.bar1_max); else if (k === "bias") v = B.bias; }
  return Math.max(0, Math.min(100, v * S.master / 100));
}

/* ---------------------------------------------------------------- renderer */
let canvas = qs("canvas");
let gl;
try {
  gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  root.classList.add("nogl");
  msg.innerHTML = 'Your browser can’t show the 3D room here (no WebGL). The <a href="#views" data-go="views">drawn views</a> show every option.';
  throw e;
}
gl.outputColorSpace = THREE.SRGBColorSpace;
gl.toneMapping = THREE.AgXToneMapping;   // v44: AgX over ACES: the wall reads nearer Card Room Green and the glass case and window keep their highlights
/* v39, client: "PC should be using GPU in order to speed up and keep frames high since most PCs will have 1060 or higher": the renderer
   asks for the high-performance GPU; a PC whose browser reports a real graphics card starts in HD (no Fast-then-HD second set of shaders
   to build) and keeps full resolution while you move unless its frames actually slow down. */
const GPU = (() => { try { const c = gl.getContext(), e = c.getExtension("WEBGL_debug_renderer_info"); return String(e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER)); } catch (e) { return ""; } })();
const BIG_GPU = !SMALL && /nvidia|geforce|rtx|gtx|quadro|radeon\s*(rx|pro|r9)|radeon\(tm\) rx|intel.*\barc\b|apple m\d/i.test(GPU) && !/swiftshader|llvmpipe|software|basic render/i.test(GPU);
if (BIG_GPU && !S.picked) S.quality = "hd";
/* v39, client: "Mobile ... is slow and doesn't render full quality expected". Phones drew at 0.85 of a CSS pixel (a third of a 3× screen's
   sharpness) and never left Fast. Now a phone draws at its own sharpness (2× on a capable chip, 1.5× otherwise; halved only while you
   move), and a capable chip (any iPhone's Apple GPU, Adreno 6xx and up, Mali-G57 and up, Immortalis, Xclipse) goes on to HD when its
   first frames are quick, and back to Fast if HD runs slow. */
const GOOD_PHONE = SMALL && /apple gpu|adreno[^0-9]*([6-9]\d{2})|mali-g(5[7-9]|6\d|7\d|[1-9]\d{2})|immortalis|xclipse/i.test(GPU);
const LIVE_SHADOW = BIG_GPU ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap, LIVE_MAP = BIG_GPU ? 2048 : 1024;   // v44: a real graphics card gets the pictures' soft 2048 shadows live
gl.shadowMap.type = LIVE_SHADOW;   // v14.1: PCF while you look round; the saved HD pictures use soft shadows
gl.shadowMap.autoUpdate = false;          // v14.1: shadows don't move with the camera, so they're redrawn only when the room changes
const reshadow = () => { gl.shadowMap.needsUpdate = true; };
/* v35, client: "it currently still crashes in the shared version ... it also is a bit slow on the render sometimes becoming HD".
   three.js builds every material's shader for the number of lights it can see and how many cast shadows, so each light switched on or
   off (a scene, the table rule, a suggestion, a hidden group with a light in it) rebuilt about 20 shaders: 10 s for "Film", 21 s to open
   the table. Now, while you use the room, the lights the renderer sees are a fixed set for each quality (Fast leaves out the area lights
   and every other bar head, as before), a light that's "off" is turned down to nothing, and only one head on each spot bar casts a
   shadow (HD). A light inside something that can be hidden (an idea, a suggestion, the cabinet's bars) moves to an always-shown rig that
   follows it: always in HD's set (at nothing while hidden), never in Fast's (their glowing materials still show). While still() renders a picture (LIVE false) every light
   behaves as it always did, so the saved pictures don't change. */
let LIVE = true;
const lightRig = new THREE.Group(); lightRig.name = "lightRig";
const RIGGED = [];
function shownChain(o) { for (; o && o.parent; o = o.parent) if (!o.visible) return false; return true; }
function lightIn(l) {                 // in the renderer's set for this quality
  /* v73, the client: "still extremely slow" on a PC: in the house's views the living room's 36 lights (spot heads, area lights, LEDs),
     turned down to nothing, were still in every pixel's sums, two of them drawing shadows. There, only the sky, the sun and the room's
     own two ceiling lights are in the set (the shaders change once, going between the living room and the house) */
  if (LIVE && R.HOUSE3 && HOUSEV(S.view)) return !!(l.isHemisphereLight || l.userData.sun || l.userData.houseLight);
  const hd = S.quality === "hd";
  if (l.userData.owner) return hd;     // an idea's or a suggestion's light: always in HD's set (at nothing while it's hidden), never in Fast's
  if (l.isRectAreaLight) return hd;
  if (l.userData.fill) return !hd;      // v46: Fast's stand-ins for the area lights
  if (!hd && l.userData.barIx !== undefined) return l.userData.barIx % 2 === 0;
  return true;
}
function adoptLight(l, scn) {
  if (l.userData.adopted) return;
  l.userData.adopted = true;
  let v = l.visible, i = l.intensity, cs = l.castShadow;
  const owner = l.parent && l.parent !== scn && l.parent !== fixtures ? l.parent : null;
  if (owner) { l.userData.owner = owner; l.userData.lp = l.position.clone(); lightRig.add(l); RIGGED.push(l); }
  const on = () => v && (!owner || shownChain(owner));
  Object.defineProperty(l, "visible", { configurable: true, get: () => (LIVE ? lightIn(l) : on()), set: x => { v = x; } });
  Object.defineProperty(l, "intensity", { configurable: true, get: () => (on() ? i : 0), set: x => { i = x; } });
  Object.defineProperty(l, "castShadow", { configurable: true, set: x => { cs = x; },
    get: () => (LIVE ? S.quality === "hd" && ((l.isSpotLight && (l === lights.bar1[0] || l === lights.bar2[0])) || !!l.userData.sun) : cs) });   // v48: and the sun
}
function adoptLights(scn) {           // after anything that builds lights (the start, applyState, Edit room's add)
  const found = []; scn.traverse(o => { if (o.isLight && !o.userData.adopted) found.push(o); });
  found.forEach(l => adoptLight(l, scn));
}
/* v35: the first time the table opened, 18 shaders compiled for the parts that had been hidden (the open table, the chairs round it,
   the plates): 18 s here, a freeze on a phone. three's compile() can't make them ahead (it doesn't set up the cutaway's clipping, so
   its shaders don't match), so once the room is on screen and still, each hidden part is drawn on its own (camera layer 31: the part
   and every light) into a 1 × 1 target that three treats like the screen (same colour space and tone mapping, so the same shaders):
   its shaders are then ready when you open the table or switch something on. Nothing on screen changes, so there's no redraw after.
   One part at a time, only after a second with no taps or drags; again after a quality change */
const PRE = { queue: [], done: 0, rt: null, idleT: 0 };
function precompile() {
  PRE.queue.length = 0;
  const hiddenUp = o => { for (let p = o.parent; p; p = p.parent) if (!p.visible) return true; return false; };
  scene.traverse(o => { if (!o.isLight && o.visible === false && !hiddenUp(o)) PRE.queue.push(o); });
}
function precompileStep() {           // from the frame loop, when nothing's moving: one hidden part, drawn off screen
  if (!PRE.queue.length || !LIVE || (gl.shadowMap.enabled && gl.shadowMap.needsUpdate)) return false;   // never while the shadows are due a redraw
  const o = PRE.queue.shift(), shown = [], tagged = [];
  if (o.visible !== false || !o.parent) return true;
  if (!PRE.rt) { PRE.rt = new THREE.WebGLRenderTarget(1, 1); PRE.rt.isXRRenderTarget = true; PRE.rt.texture.colorSpace = gl.outputColorSpace; }
  if (!PRE.rtAO) PRE.rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });   // v40: like the composer's (AO live)
  scene.traverse(c => { if (c.isLight) c.layers.enable(31); });
  o.traverse(c => { if (!c.isLight) { if (c.visible === false) { shown.push(c); c.visible = true; } if (!c.layers.isEnabled(31)) { tagged.push(c); c.layers.enable(31); } } });
  const mask = camera.layers.mask, was = gl.getRenderTarget();
  camera.layers.set(31); gl.setRenderTarget(aoLive() ? PRE.rtAO : PRE.rt);
  try { gl.render(scene, camera); } finally {
    gl.setRenderTarget(was); camera.layers.mask = mask;
    shown.forEach(c => { c.visible = false; }); tagged.forEach(c => c.layers.disable(31));
  }
  PRE.done++;
  return true;
}
/* v40, client: "better rendering and graphics": ambient occlusion (three's GTAO), the soft shade where things meet. Always in the HD
   pictures; live in HD on a real graphics card (aoLive). With it the room draws into the composer's target (linear, tone-mapped at the
   end), so the warm-up draws into a target of the same kind and the shaders match. */
const AO = { c: null, g: null };
/* v73 (B): if the house still runs under 25 frames a second in HD (the gaps while it moves), it drops its ambient occlusion and draws at
   1× (the living room keeps its HD); once, for this visit (?houselite forces it, for a check) */
let houseLite = /[?&]houselite\b/.test(location.search);
/* V1.1, the client's iPhones (15 Pro, 16): a capable phone in HD whose frames are quick (under 14 ms) gets the PCs' shade and glow too
   (phoneAO, from autoQuality), lighter (8 samples, 2× anti-aliasing); off again for the visit if its frames then pass 30 ms */
let phoneAO = false, phoneAOoff = false;
const aoLive = () => S.quality === "hd" && (BIG_GPU || phoneAO || /[?&]ao\b/.test(location.search)) && !/[?&]noao\b/.test(location.search) && !(houseLite && R.HOUSE3 && HOUSEV(S.view));   // ?ao tries it anywhere
function aoComposer(w, h, pr) {
  if (!AO.c) {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: SMALL ? (GOOD_PHONE ? 2 : 0) : 4 });   // anti-aliased, as on screen
    AO.c = new EffectComposer(gl, rt); AO.c.addPass(new RenderPass(scene, camera));
    AO.g = new GTAOPass(scene, camera, w, h); AO.g.blendIntensity = 0.9;
    AO.g.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: SMALL ? 8 : 16, distanceFallOff: 1 });
    AO.g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: SMALL ? 8 : 16 });
    clipMat(AO.g.normalMaterial);                                    // the cutaway cuts the depth it shades from, too
    AO.c.addPass(AO.g);
    // v48 §5, client: "improving the renders graphics and quality": a soft glow round what's brighter than white (the LED strips, the lamp's
    // shades, the lit spot heads, the screen), in HD on a real graphics card and in every saved picture; the phone's Fast view has none
    AO.b = new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.4, 2.2); AO.c.addPass(AO.b); bloomLevels(S.tod === "day");
    AO.c.addPass(new OutputPass());
  }
  AO.c.setPixelRatio(pr); AO.c.setSize(w, h);
  return AO.c;
}
function draw() {                     // a frame: through the composer with AO, or straight to the screen
  if (aoLive()) { const sz = gl.getSize(new THREE.Vector2()); if (!AO.c || AO.w !== sz.x || AO.h !== sz.y || AO.pr !== gl.getPixelRatio()) { aoComposer(sz.x, sz.y, gl.getPixelRatio()); AO.w = sz.x; AO.h = sz.y; AO.pr = gl.getPixelRatio(); }
    gl.info.autoReset = false; gl.info.reset(); AO.c.render(); gl.info.autoReset = true; }   // the count covers every pass
  else gl.render(scene, camera);
}
function syncRig() {                  // each frame: a rigged light follows its owner, and leaves with it (a rebuilt cabinet)
  for (let k = RIGGED.length - 1; k >= 0; k--) {
    const l = RIGGED[k], o = l.userData.owner;
    let top = o; while (top && top.parent) top = top.parent;
    if (!l.parent || !o || top !== scene) { lightRig.remove(l); RIGGED.splice(k, 1); continue; }
    o.updateWorldMatrix(true, false); l.position.copy(l.userData.lp).applyMatrix4(o.matrixWorld);
  }
}
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0d100e");
scene.fog = new THREE.Fog("#cbd8e3", 1e4, 2e4);   // V1.3: the haze over the whole house (outdoor()); here from the start, so turning it up builds no shaders
const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 120);   // v54: far enough for the whole house and the garden
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.maxDistance = 6;          // v17: 6 m inside the room (the views from above lift it), never closer than 30 cm
controls.minDistance = 0.3;
controls.screenSpacePanning = false;   // v17: a right-drag slides along the floor
// v31, client: "make camera movement easier ... sometimes the movement is quite uncontrollable": it stops soon after you let go,
// and a drag, a pinch or a scroll moves it about half as far
controls.dampingFactor = 0.2;
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.6; controls.panSpeed = 0.6;
controls.addEventListener("change", () => { dirty(); if (typeof syncEye === "function") syncEye(); });

/* ---------------------------------------------------------------- textures, made here so nothing loads */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(BIG_GPU ? 16 : 8, gl.capabilities.getMaxAnisotropy());   // v44: as sharp at a slant as the card allows
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
   colour photo is scaled to its drawn texture's average first, so every part keeps its colour (yours, the plan's) and only the grain, the
   weave and the pile are real. A phone without a capable chip keeps the drawn ones */
const PHOTO = (R.HOUSE3 && R.HOUSE3.photo_tex) || {};
for (const t of Object.values(PHOTO)) for (const f of ["map", "nor"]) if (typeof t[f] === "string" && t[f][0] === "@") { const [k, g] = t[f].slice(1).split("."); t[f] = PHOTO[k][g]; }   // a shared picture, sent once
const PHOTOS = !(SMALL && !GOOD_PHONE) && !!(PHOTO.lr_oak && PHOTO.lr_oak.map);
function photoInto(tex, src, match = true) {
  if (!PHOTOS || !src) return;
  const im = new Image();
  im.onload = () => {
    let out = im;
    if (match && tex.image && tex.image.getContext) {
      const avg = d => { const t = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) { t[0] += d[i]; t[1] += d[i + 1]; t[2] += d[i + 2]; } return t.map(v => v / (d.length / 4) || 1); };
      const was = tex.image, want = avg(was.getContext("2d").getImageData(0, 0, was.width, was.height).data);
      out = document.createElement("canvas"); out.width = im.naturalWidth; out.height = im.naturalHeight;
      const g = out.getContext("2d"); g.drawImage(im, 0, 0);
      const px = g.getImageData(0, 0, out.width, out.height), d = px.data, k = avg(d).map((v, i) => want[i] / v);
      for (let i = 0; i < d.length; i += 4) { d[i] *= k[0]; d[i + 1] *= k[1]; d[i + 2] *= k[2]; }   // clamped at 255 by the array
      g.putImageData(px, 0, 0);
    }
    tex.image = out; tex.needsUpdate = true; dirty();
  };
  im.src = src;
}
const flatNormal = () => canvasTex(4, 4, (g, w, h) => { g.fillStyle = "#8080ff"; g.fillRect(0, 0, w, h); }, false);
const OAK_NRM = flatNormal(), CORD_NRM = flatNormal(), PLASTER_NRM = flatNormal();
CORD_NRM.repeat.set(1.44, 0.6);          // the photo's 100 ribs a copy: 144 across a cushion, as the drawn cord's
PLASTER_NRM.repeat.set(0.625, 0.625);    // 1.6 m of plaster a copy
const PH = k => PHOTO[k] || {};
photoInto(OAK_TEX, PH("lr_oak").map); photoInto(OAK_NRM, PH("lr_oak").nor, false);
photoInto(HESSIAN, PH("lr_hessian").map); photoInto(CORD_NRM, PH("lr_cord").nor, false); photoInto(PLASTER_NRM, PH("lr_plaster").nor, false);
photoInto(CARPET, PH("carpet_grey").map); photoInto(OATMEAL, PH("carpet").map);   // the house's Carpet012, in your grey and the oatmeal
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
function skyTex(day) {
  return canvasTex(512, 256, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h);
    if (day) { s.addColorStop(0, "#c9d9e8"); s.addColorStop(0.7, "#e8eef2"); s.addColorStop(1, "#b8c2b4"); }
    else { s.addColorStop(0, "#0a1024"); s.addColorStop(0.75, "#1a2240"); s.addColorStop(1, "#2b2a35"); }
    g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.fillStyle = day ? "#9aa596" : "#141418";               // the houses opposite
    for (let x = 0; x < w; x += 70) g.fillRect(x, h * 0.62 + (x % 140 ? 8 : 0), 62, h);
    if (!day) { g.fillStyle = "#f5c46a"; for (let x = 18; x < w; x += 70) if (x % 3) g.fillRect(x, h * 0.72, 10, 8); }
  });
}
const SKY = { day: skyTex(true), night: skyTex(false) };
/* v47.1, client (with a video through the window): "Can we somehow make the room look less dark through it and not just a blank black
   window": the garden itself (art/garden_day, from the video; art/garden_dusk, the same at blue hour for the evening), in place of the
   drawn sky as soon as each picture arrives. Same material, so no new shader */
/* v56, client: "fix the living room only view it has a random room clipped on where you've added the garden view ... keep it blank if
   need be through the window for now until the model of the whole house is done": the garden photo is off (GARDEN_ON); the window shows
   a plain sky, light by day, dusk by evening. Turn it back on when the whole house and its garden are modelled (UPGRADE_PLAN_v56.md) */
const GARDEN_ON = false;
{ const IMG = (typeof DATA !== "undefined" && DATA.img) || {};
  if (GARDEN_ON) for (const [k, slot] of [["garden_day", "day"], ["garden_dusk", "night"]]) if (IMG[k])
    new THREE.TextureLoader().load(IMG[k], t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; SKY[slot] = t;
      if (view && (slot === "day") === (S.tod === "day")) { view.material.map = t; view.material.needsUpdate = true; dirty(); } }); }

/* ---------------------------------------------------------------- materials */
const MATS = [];
/* v21: the dolls'-house cutaway. From outside the room (the views from above), whatever stands along the wall nearest the camera (curtains,
   the window frame, the plant stand, the stairs) is cut off above CUT_H, like a section drawing, so nothing blocks the room. Every material
   carries the same two planes; clipIntersection cuts only where both agree (near that wall AND above CUT_H); updateCut() moves plane 0. */
const CUT_H = 95, CUT_IN = 32;
const CLIP = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e3), new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_H * 0.01)];
const clipMat = m => { m.clippingPlanes = CLIP; m.clipIntersection = true; m.clipShadows = true; return m; };
/* v39, client: "the render is still slow on PC ... lag and frame drop on movement": a material with transmission (the bar's bottles and
   glasses) makes three draw the whole room a second time, every frame, to see through it (984 draw calls instead of about 500). In the
   live room glass is plain see-through; still() puts the transmission back for the saved pictures. */
const glassLive = m => { if (m.transmission > 0) { m.userData.trans = m.transmission; m.transmission = 0; } return m; };
const reg = m => (MATS.push(clipMat(glassLive(m))), m);
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
function paintMat(ratio, eggshell, both, ch = "wall") {
  const k = ratio.toFixed(2) + (eggshell ? "e" : "") + (both ? "d" : "") + ch;
  const relief = eggshell ? {} : PHOTOS ? { normalMap: PLASTER_NRM, normalScale: new THREE.Vector2(0.35, 0.35) } : { bumpMap: WALL_BUMP, bumpScale: 0.6 };   // V1.1: real plaster
  if (!paintMats.has(k)) paintMats.set(k, reg(new THREE.MeshStandardMaterial({ color: paintColour(ratio, ch), roughness: eggshell ? 0.45 : 0.92,
    ...relief, side: both ? THREE.DoubleSide : THREE.FrontSide, userData: { ratio, ch } })));
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
    brick: () => new THREE.MeshStandardMaterial({ map: BRICK_TEX, bumpMap: BRICK_TEX, bumpScale: 0.6, roughness: 0.92, side: THREE.DoubleSide }),
    trans: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, transparent: true, opacity: 0.85 }),
  }[kind]();
  return KIND[kind] = reg(m);
}

/* ---------------------------------------------------------------- geometry from the plan's records */
const GRAIN = 0.6;   // metres of oak per texture repeat
const fillCol = f => new THREE.Color(f === "glass" || f === "art" || f === "brick" ? "#ffffff" : f);   // v35: kinds, not colours (the console's "Unknown color" warnings)
function colAttr(geo, cols) { geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); }
const SOFT = new Set([R.SOFA_CORD[0]]);   // v15: the blue corduroy sofa, upholstered rather than boxy
function softGeo(b) {
  const [, x, y, z, w, h, d, f] = b, r = Math.min(4, Math.min(w, h, d) / 2.6);
  const g = new RoundedBoxGeometry(w * M, h * M, d * M, 3, r * M);
  g.translate(-(x + w / 2) * M, (y + h / 2) * M, (z + d / 2) * M);
  const c = fillCol(f), cols = [];
  for (let i = 0; i < g.attributes.position.count; i++) cols.push(c.r, c.g, c.b);
  colAttr(g, cols);
  return g;
}
/* V1.1: a box with its edges rounded off (EDGE cm, real joinery's arris): each face stops short of its edges, a strip joins each pair
   of faces and a triangle each corner, and every vertex keeps its own face's normal, so the light rolls round the edge as on a real
   board instead of stopping at a hard line. 44 triangles (a plain box 12). Faces in BoxGeometry's order (+x, -x, +y, -y, +z, -z) for the
   colours and the grain; a strip's or a corner's vertex takes the colour and grain of the face it sits on. Sharp on a phone without a
   capable chip */
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
    const high = it[0] === "p" && Math.min(...it[1].filter((_, i) => i % 3 === 1)) >= R.CEIL - 0.5;
    if (kind === "paint") {
      const m = new THREE.Mesh(geo, paintMat(lum(fill) / BASE_L, it[0] === "b", it[0] === "p", (flags || "").includes("s") ? "w:stairs" : "wall"));
      shadow(m); (high ? above : grp).add(m); continue;
    }
    const key = kind + (it[0] === "p" ? "p" : "") + (high ? "h" : "");
    (buckets[key] = buckets[key] || { kind, poly: it[0] === "p", high, geos: [] }).geos.push(geo);
  }
  for (const b of Object.values(buckets)) {
    const geo = mergeGeometries(b.geos.map(g => g.index ? g.toNonIndexed() : g));
    let mat = kindMat(b.kind);
    if (b.poly) { mat = mat.clone(); mat.side = THREE.DoubleSide; reg(mat); }
    const m = new THREE.Mesh(geo, mat); shadow(m, b.kind !== "glass" && b.kind !== "led");
    (b.high ? above : grp).add(m);
  }
  return grp;
}
function shadow(m, cast = true) { m.castShadow = cast; m.receiveShadow = true; return m; }

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
  const [dx0, dx1] = R.DOOR_X, [sx0, sx1] = R.STAIR_X, [wx0, wx1] = R.WINDOW_X, [wy0, wy1] = R.WINDOW_Y;
  wall("x", 0, WZ, 0, 0, C, [1, 0, 0], wP("pc"));                                 // the side (east) wall: the PC wall
  wall("x", 0, 0, AD, 0, C, [1, 0, 0], wP("media"));                              // ... and into the alcove, with the media wall
  wall("z", AD, 0, A, 0, C, [0, 0, -1], wP("media"));                             // the alcove's back
  wall("x", B0, 0, AD, 0, C, [-1, 0, 0], rP("media"));                             // the breast's reveal
  wall("z", 0, B0, B1, 0, C, [0, 0, -1], wP("breast"));                            // the chimney breast
  wall("x", B1, 0, RZ, 0, C, [1, 0, 0], rP("breast"));                             // the recess's side (the breast's return)
  wall("z", RZ, B1, Wd, 0, C, [0, 0, -1], rP("door"), [[dx0, dx1, 0, R.DOOR_H], [sx0, Wd, 0, C]]);   // the door wall, open over the stairs
  wall("x", Wd, WZ, RZ, 0, C, [-1, 0, 0], wP("stairs"));                           // the stairs (west) wall
  wall("z", WZ, 0, Wd, 0, C, [0, 0, 1], wP("window"), [[wx0, wx1, wy0, wy1]]);     // the window wall
  // v16: the hollow pipe boxing in the window's west corner, floor to ceiling, painted with the walls
  const PX = R.PIPE_BOX;
  cube(PX.x[0], 0, PX.z[0], PX.x[1] - PX.x[0], C, PX.z[1] - PX.z[0], wallP);
  // floor (carpet) and ceiling (painted, with the opening over the stairs)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wd * M, (RZ - WZ) * M), floorMat = reg(new THREE.MeshStandardMaterial({ map: CARPET, roughness: 1, bumpMap: PILE, bumpScale: 0.5 })));
  floor.rotation.x = -Math.PI / 2; floor.position.copy(v3(Wd / 2, 0, (RZ + WZ) / 2)); floor.receiveShadow = true; shell.add(floor);
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
  for (const [xa, xb, za, zb] of [[0, wx, WZ, RZ], [wx, Wd, WZ, front]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry((xb - xa) * M, (zb - za) * M), ceilMat);
    m.rotation.x = Math.PI / 2; m.position.copy(v3((xa + xb) / 2, C, (za + zb) / 2)); m.receiveShadow = true; m.castShadow = true; shell.add(m);   // v48: and the ceiling
  }
  // skirting, eggshell in the wall colour
  const sk = R.SKIRT_H, st = 2;
  [[0, WZ, st, sk, AD - WZ], [B1, 0, st, sk, RZ]].forEach(([x, z, w, h, d]) => cube(x, 0, z, w, h, d, egg, false));
  [[0, AD - st, A], [B0, -st, B1 - B0], [B1, RZ - st, dx0 - 6 - B1], [dx1 + 6, RZ - st, sx0 - dx1 - 6], [0, WZ, Wd]].forEach(([x, z, w]) => cube(x, 0, z, w, sk, st, egg, false));
  cube(Wd - st, 0, WZ, st, sk, R.STAIR_FRONT - WZ, egg, false);
  // the door, shut, with its frame and handle
  // v20, client: "door of room is also white": the door and its frame stay white satin, not the wall colour
  const doorW = reg(new THREE.MeshStandardMaterial({ color: "#efece5", roughness: 0.35 })), frameW = reg(new THREE.MeshStandardMaterial({ color: "#f3f1eb", roughness: 0.4 }));
  cube(dx0 - 6, 0, RZ - 1.5, 6, R.DOOR_H + 6, 2, frameW); cube(dx1, 0, RZ - 1.5, 6, R.DOOR_H + 6, 2, frameW);
  cube(dx0 - 6, R.DOOR_H, RZ - 1.5, dx1 - dx0 + 12, 6, 2, frameW);
  cube(dx0, 0, RZ + 1, dx1 - dx0, R.DOOR_H, 4, doorW);
  for (const [y0, y1] of [[14, 98], [112, 186]]) cube(dx0 + 9, y0, RZ + 0.6, dx1 - dx0 - 18, y1 - y0, 0.5, doorW);
  const brass = reg(new THREE.MeshStandardMaterial({ color: "#c9b58a", metalness: 0.9, roughness: 0.3 }));
  cube(dx1 - 12, 100, RZ - 1.6, 9, 1.4, 2.6, brass);
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
     middle, at standing height), straight out and level (garden_window.py), so hung square-on at d from that eye, at the size its angles
     give, it lines up: the lawn well below the sill, the trees and the hill across the valley at eye level, from anywhere in the room */
  const GV = R.GARDEN_VIEW || { eye: [mid, 150, WZ + 60], d: 1000, tan: [2.747, 0.839, 2.145] }, [tx, tu, td] = GV.tan;
  view = new THREE.Mesh(new THREE.PlaneGeometry(2 * GV.d * tx * M, GV.d * (tu + td) * M), new THREE.MeshBasicMaterial({ map: SKY.night, toneMapped: false }));
  view.position.copy(v3(GV.eye[0], GV.eye[1] + GV.d * (tu - td) / 2, GV.eye[2] - GV.d)); shell.add(view);
  /* v53, client: "Can you make the garden visible through the window at any angle ... both gardens": from above (Whole room, Bird's eye,
     Dolls' house) the back garden is ground under the room: the house's back wall down to the lawn, the patio, the lawn, the path down
     the left, the fences, 25 m out (geometry.GARDEN). Looking out from inside, the photo stays (it carries the real garden) */
  { const GD = R.GARDEN || { drop: 260, length: 2500, patio: 0, path: 90, fence: 180, fence_r: 120 }, y0 = -GD.drop, z0 = WZ - 30, z1 = z0 - GD.length, x0 = -12, x1 = Wd + 12;
    garden3d = new THREE.Group(); garden3d.visible = false; scene.add(garden3d);   // v55: in the scene, so it stays when Lower takes the room off
    const mat = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
    const flat = (xa, xb, za, zb, y, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(xb - xa) * M, Math.abs(zb - za) * M), m);
      p.rotation.x = -Math.PI / 2; p.position.copy(v3((xa + xb) / 2, y, (za + zb) / 2)); p.receiveShadow = true; garden3d.add(p); };
    const box = (xa, xb, ya, yb, za, zb, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(xb - xa) * M, Math.abs(yb - ya) * M, Math.abs(zb - za) * M), m);
      b.position.copy(v3((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2)); b.castShadow = b.receiveShadow = true; garden3d.add(b); };
    const zp = z0 - GD.patio;
    if (GD.patio > 0) flat(x0, x1, z0, zp, y0 + 2, mat("#a59f94"));                // a patio by the house (none: the lawn runs to the wall)
    const texd = (k, c, w, d) => { const T = R.HOUSE3 && houseTex(k); if (!T) return mat(c); const tx = T.map.clone(); tx.needsUpdate = true; tx.repeat.set(w / 100 / T.size[0], d / 100 / T.size[1]);
      return reg(new THREE.MeshStandardMaterial({ map: tx, roughness: 0.95 })); };   // v59: lawn and concrete, at their size
    flat(x0, x1 - GD.path, zp, z1, y0, texd("lawn", "#55613f", x1 - GD.path - x0, zp - z1));     // the lawn
    flat(x1 - GD.path, x1, zp, z1, y0 + 1, texd("concrete", "#9b958a", GD.path, zp - z1));      // the path down the left (looking out)
    const fence = h => { const T = R.HOUSE3 && houseTex("fence"); if (!T) return mat("#6b5644"); const tx = T.map.clone(); tx.needsUpdate = true;   // V1.3: boarded, each board 10 wide
      tx.repeat.set(GD.length / 100 / T.size[0], h / 100 / T.size[1]); return reg(new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9 })); };
    box(x0 - 4, x0, y0, y0 + (GD.fence_r || GD.fence), z0 - 100, z1, fence(GD.fence_r || GD.fence)); box(x1, x1 + 4, y0, y0 + GD.fence, z0, z1, fence(GD.fence));   // the right one lower, its gate by the house box(x0 - 4, x1 + 4, y0, y0 + GD.fence, z1, z1 - 4, fence);
    if (!R.HOUSE3) box(x0, x1, y0, 0, z0 + 30, z0, mat("#9a5a43"));               // the house's back wall below the room (brick), down to the lawn (v58: the built house has its own)
  }
  sillPlants(wx0, wx1, SL.y, FZ + 2, WZ + SL.nose - 1);
  // the radiator under the window, painted in
  const [rx0, rx1] = R.RADIATOR_X, [ry0, ry1] = R.RADIATOR_Y, radP = paintMat(lum("#3b6e56") / BASE_L, true, false, "trim");
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
  const [sx0, sx1] = R.STAIR_X, n = R.STAIR_N || 13, r = R.STAIR_RISE, gq = R.STAIR_GOING, tb = 2.2, nose = 1.5;
  const z0 = R.STAIR_FRONT + 6, zl = z0 + (n - 1) * gq, zl1 = zl + (R.LANDING_D || 90), top = n * r;
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
  solid(prof, sx0 + 0.2, sx1 - 0.2, body);
  for (let i = 1; i < n; i++) solid([[z0 + (i - 1) * gq - nose, i * r - tb], [z0 + i * gq, i * r - tb], [z0 + i * gq, i * r], [z0 + (i - 1) * gq - nose, i * r]], sx0, sx1, oak);
  solid([[zl - nose, top - tb], [zl1, top - tb], [zl1, top], [zl - nose, top]], sx0, sx1, oak);   // the landing's boards
  const pitch = z => r + (z - z0) / gq * r, zf = z0 + (21 - r) / r * gq;   // the string: 24 deep along the pitch line, capped 3 over it
  solid([[z0, 0], [zf, 0], [zl, top - 21], [zl1, top - 21], [zl1, top + 3], [zl, top + 3], [z0, pitch(z0) + 3]], sx0 - 2.2, sx0 - 0.2, str);
}
/* v40: the flip-top's chair cupboard, its hooks and the fold-down seat are gone (never shown since the dining cabinet became the only
   table in v33; the code is in git history, v40) */
function placeChairs() { placeOptC(); }

/* v26: option C, the dining cabinet; v27: the plan, made for six; v29: two sliding doors (OPTC). v30, client: "is there anyway you can
   optimise the dining cabinet build to fit the chairs in a better way so the cabinet doesnt have to be so big", "show me both versions":
   the compact cabinet (CAB) is the plan, the sliding one the alternative. S.site "C"; S.cab "compact" / "sliding"; S.dining folded /
   four / six; S.chairs "open" opens the chair door (the table folded); S.tdoor opens the table door with the table still folded.
   The doors move by tween (cabTween), so a tap in the room swings or slides them; a still (R3D.set) snaps them. */
const cabC = () => (S.cab === "sliding" ? R.OPTC : S.cabw === "80" && R.CAB80 ? R.CAB80 : R.CAB);   // v30: the cabinet on show; v33: its 80-wide version
/* v32: everything in the cabinets that moves is an "anim": one number p, 0 to 1, and what it does to the model (a door's swing or
   slide, a chair drawn out, the table's joints); twTo eases p, the show sets it from its own clock */
const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const anim = (fn, p = 0) => { const a = { p, set(v) { a.p = v; fn(v); } }; a.set(p); return a; };
const RIG = [0, 0.2, 0.35, 0.55, 0.8, 0.9, 1];   // the table's p at: tilted out, first legs down, level, second half over, its legs down, flat
let CK = null;
function cabKit() {      // the parts both cabinets share: materials, the table standing up and open, the chairs round it and folded
  if (CK) return CK;
  const mat = o => reg(new THREE.MeshStandardMaterial(o));
  const K = {
    oak: mat({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }),
    oakV: mat({ color: "#c48c57", map: OAK_TEX_V, roughness: 0.55 }),     // the doors and the ends: the grain upright
    oakIn: mat({ color: "#b5845a", map: OAK_TEX, roughness: 0.65 }),
    oakEnd: mat({ color: "#b98250", map: OAK_TEX, roughness: 0.55 }),     // the breadboard ends, a touch darker
    dark: mat({ color: "#241f1b", roughness: 0.9 }),
    beech: mat({ color: "#d4b58c", map: OAK_TEX, roughness: 0.6 }),       // the folding chairs
    pad: mat({ color: "#8e9a80", roughness: 0.95 }),                      // sage linen seat pads
    linen: mat({ color: "#8f7d69", roughness: 0.97 }),                    // v33: the padded chairs' linen, the colour of your photo
    linenBtn: mat({ color: "#6e5f4f", roughness: 0.8 }),                  // their buttons
    alu: mat({ color: "#b9bcc0", roughness: 0.35, metalness: 0.8 }),
    steel: mat({ color: "#c9cbcd", roughness: 0.3, metalness: 0.9 }),     // v30: the piano hinges' knuckles
    plate: mat({ color: "#f4f1ea", roughness: 0.35 }),
    cloth: ["#efe7d8", "#8e9a80", "#c7643a"].map(c => mat({ color: c, roughness: 0.95 })),
  };
  K.bx = (g, x, y, z, w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), m); me.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); g.add(shadow(me)); return me; };
  K.rbx = (g, x, y, z, w, h, d, m, r = 0.6) => { const me = new THREE.Mesh(new RoundedBoxGeometry(w * M, h * M, d * M, 2, Math.min(r, Math.min(w, h, d) / 2.2) * M), m); me.position.copy(v3(x + w / 2, y + h / 2, z + d / 2)); g.add(shadow(me)); return me; };
  // v32, client: "slow down the playback of the table opening to show clearly how it puts together and opens": the table jointed as it
  // is built. The first half turns on the piano hinge at the rail (C.pivot), the second on the flip-top hinges at the joint (folded,
  // it lies face down on the first), each leg on its bracket under its apron. One number runs it (rig.p): 0 folded, standing on the
  // rail; 1 open on its four legs. On the way (RIG): the pair tilts out, the first legs fold down, it lowers onto them, the second half
  // flips over, its legs fold down, it lies flat.
  K.tableRig = C => {
    const root = new THREE.Group(), [tw, , tt] = C.top, [tz0, tz1] = C.tz, ap = C.apron, [px, py] = C.pivot, [tx0, tx1] = C.tx, jx = C.joint_x;
    const hinge = new THREE.Group(), joint = new THREE.Group(), half = [new THREE.Group(), new THREE.Group()], legs = [[], []];
    hinge.position.copy(v3(px, py, 0)); joint.position.copy(v3(jx, py + tt + 0.15, 0)).sub(hinge.position);
    root.add(hinge); hinge.add(joint);
    // built open in room cm, the first half (by the rail) then the second: each a centre of staves between two breadboard ends, the
    // corners eased; its aprons
    [[jx, tx1], [tx0, jx - 0.15]].forEach(([a, b], i) => {
      K.rbx(half[i], a + 7, py, tz1, b - a - 14, tt, tw, K.oak, 0.5);
      for (const e of [a, b - 7]) K.rbx(half[i], e, py, tz1, 7, tt, tw, K.oakEnd, 0.6);
    });
    [[jx + 0.2, tx1 - ap], [tx0 + 3, jx - 3]].forEach(([a, b], i) => {
      for (const z of [tz1 + 4, tz0 - 6]) K.bx(half[i], a, py - ap, z, b - a, ap, 2, K.oakIn);
      for (const x of [a, b - 2]) K.bx(half[i], x, py - ap, tz1 + 6, 2, ap, tw - 12, K.oakIn);
    });
    // the four tapered legs, each turning at its bracket (half the apron up) towards its half's hinge
    const lp = py - ap / 2, legGeo = (() => { const lg = new THREE.CylinderGeometry(3.9 * M, 2.7 * M, lp * M, 4, 1); lg.rotateY(Math.PI / 4); lg.scale(C.leg[0] / 5.5, 1, C.leg[1] / 5.5); return lg; })();
    for (const [lx, lz] of C.legs) {
      const i = lx > jx ? 0 : 1, l = new THREE.Group(), m = shadow(new THREE.Mesh(legGeo, K.oakIn));
      l.position.copy(v3(lx, lp, lz)); m.position.y = -lp / 2 * M; l.add(m); half[i].add(l); legs[i].push(l);
    }
    const off = [hinge.position.clone(), hinge.position.clone().add(joint.position)];
    half.forEach((h, i) => [...h.children].forEach(o => { o.position.sub(off[i]); (i ? joint : hinge).add(o); }));
    const at = (p, a, b) => ease(Math.min(1, Math.max(0, (p - RIG[a]) / (RIG[a + 1] - RIG[a]))));
    root.userData.rig = anim(p => {
      hinge.rotation.z = Math.PI / 2 - Math.PI / 4 * (at(p, 0) + at(p, 2));
      joint.rotation.z = Math.PI - (Math.PI - 0.35) * at(p, 3) - 0.35 * at(p, 5);
      legs[0].forEach(l => { l.rotation.z = -Math.PI / 2 * (1 - at(p, 1)); });
      legs[1].forEach(l => { l.rotation.z = -Math.PI / 2 * (1 - at(p, 4)); });
    });
    return root;
  };
  // the chairs at the table: slatted beech folding chairs with sage pads, the back legs rising to a two-rail back; a plate at each
  K.seats = C => {
    const out = {}, [tz0, tz1] = C.tz, tx0 = C.tx[0], py = C.pivot[1], tt = C.top[2];
    const chairOpen = (g, x, z, face) => {
      if (R.CHAIR_PADDED) return paddedOpen(g, x, z, face);   // v33: your grey padded chairs are the plan's
      const c = new THREE.Group(), sw = R.CHAIR[0], sd = R.CHAIR[1], sh = R.CHAIR[3], bh = R.CHAIR[2];
      for (let i = 0; i < 4; i++) lb(c, 0, sh - 2.2, -sd / 2 + 6 + i * 9.4, sw - 4, 2.2, 8.2, K.beech);         // the seat's slats
      for (const xx of [-sw / 2 + 1.5, sw / 2 - 1.5]) {
        const back = lb(c, xx, 0, sd / 2 - 5, 2.6, bh, 3, K.beech); back.rotation.x = -0.06;              // the back legs, rising to the back
        lb(c, xx, 0, -sd / 2 + 4, 2.6, sh - 2.2, 2.6, K.beech);                                           // the front legs
        lb(c, xx, sh - 5, 0, 2.2, 3, sd - 6, K.beech);                                                    // the seat's side rails
      }
      for (const y of [bh - 9, bh - 21]) lb(c, 0, y, sd / 2 - 5.5, sw - 3, 7, 1.8, K.beech);             // two back rails
      lb(c, 0, 14, -sd / 2 + 4, sw - 5, 2.2, 2.2, K.beech);                                               // the stretcher
      const [pw, , pt] = R.CAB.pad;                                                                      // v31: a 40 × 40 tie-on pad, tied to the back legs
      const p = new THREE.Mesh(new RoundedBoxGeometry(pw * M, pt * M, pw * M, 2, 0.012), K.pad); p.position.copy(v3(0, sh + pt / 2, -1)); c.add(shadow(p));
      for (const xx of [-sw / 2 + 1.5, sw / 2 - 1.5]) lb(c, xx, sh - 7, sd / 2 - 7.5, 1.4, 8, 1.4, K.pad);   // the ties round the back legs
      c.position.copy(v3(x, 0, z));
      c.rotation.y = { n: 0, w: Math.PI, e: Math.PI / 2 }[face] || 0;                                     // the back away from the table (local +z is the back)
      g.add(c);
    };
    // v33: your padded folding chairs (Brayden Studio), drawn from the photo you sent (inputs/chairs_padded_listing_photo.webp): bent-wood
    // sides, each back upright curving forward at the seat into the front leg, the back leg crossing it under the seat; a thick buttoned
    // cushion on the seat (47 × 47, 6.5) and a buttoned pad between the uprights, reclined to 110°
    const seg = (c, x, y1, z1, y2, z2, w, d, mat) => {
      const L = Math.hypot(y2 - y1, z2 - z1), m = new THREE.Mesh(new THREE.BoxGeometry(w * M, L * M, d * M), mat);
      m.position.copy(v3(x, (y1 + y2) / 2, (z1 + z2) / 2)); m.rotation.x = Math.atan2(z2 - z1, y2 - y1); c.add(shadow(m)); return m;
    };
    const BTN = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 10);
    const buttons = (mesh, cols, rows, w, h, face) => {     // buttons on a cushion's face (its own frame: x across, y up or z along)
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const b = new THREE.Mesh(BTN, K.linenBtn), u = ((i + 0.5) / cols - 0.5) * w * M, v = ((j + 0.5) / rows - 0.5) * h * M;
        if (face === "top") b.position.set(u, 0, v); else { b.position.set(u, v, 0); b.rotation.x = Math.PI / 2; }
        b.position[face === "top" ? "y" : "z"] = face === "top" ? mesh.userData.t / 2 * M : -mesh.userData.t / 2 * M;
        mesh.add(b);
      }
    };
    const paddedOpen = (g, x, z, face) => {
      const P = R.CHAIR_PADDED, c = new THREE.Group(), sw = P.w, sh = P.seat_h, bh = P.h, [cw, cd] = P.seat, cu = P.cushion;
      for (const sd of [-1, 1]) {
        const xx = sd * (sw / 2 - 1.5);
        seg(c, xx, bh, 24, 56, 19.5, 2.6, 3.2, K.beech);           // the back upright, leaning back
        seg(c, xx, 56.6, 19.6, 48.5, 15.6, 2.6, 3.2, K.beech);     // the bend forward at the seat
        seg(c, xx, 49.2, 16.2, 42, 9.5, 2.6, 3.2, K.beech);
        seg(c, xx, 42.6, 10.2, 0, -26, 2.6, 3.4, K.beech);         // on down into the front leg
        seg(c, xx * 0.92, 40, -16, 0, 22, 2.6, 3.4, K.beech);      // the back leg, crossing it under the seat
      }
      seg(c, 0, 37.5, -20, 37.5, 16, sw - 6, 1.4, K.dark);         // the seat's board, under the cushion
      const seat = new THREE.Mesh(new RoundedBoxGeometry((cw - 1) * M, cu * M, (cd - 1) * M, 3, 0.022), K.linen);
      seat.userData.t = cu; seat.position.copy(v3(0, sh - cu / 2, -3)); c.add(shadow(seat)); buttons(seat, 3, 3, cw - 13, cd - 13, "top");
      const back = new THREE.Mesh(new RoundedBoxGeometry((sw - 5.6) * M, 22 * M, 5 * M, 3, 0.02), K.linen);
      back.userData.t = 5; back.position.copy(v3(0, 67.5, 20.6)); back.rotation.x = Math.atan2(4.5, 22.7); c.add(shadow(back)); buttons(back, 3, 2, sw - 18, 12, "front");
      c.position.copy(v3(x, 0, z)); c.rotation.y = { n: 0, w: Math.PI, e: Math.PI / 2 }[face] || 0; g.add(c);
    };
    for (const [k, list] of Object.entries(C.seats)) {
      const g = new THREE.Group(); g.userData.chairs = [];
      for (const [x, z, f] of list) {
        chairOpen(g, x, z, f);
        const c = g.children[g.children.length - 1], pz = f === "n" ? tz0 - 16 : f === "w" ? tz1 + 16 : C.cz, pxp = f === "e" ? tx0 + 16 : x;
        const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.008, 28), K.plate); pl.position.copy(v3(pxp, py + tt + 0.4, pz)); g.add(pl);
        const home = c.position.clone(), back = new THREE.Vector3(Math.sin(c.rotation.y), 0, Math.cos(c.rotation.y));   // v32: drawn in along its back's line
        g.userData.chairs.push(anim(v => { c.position.copy(home).addScaledVector(back, 0.35 * v); c.visible = v < 0.999; pl.visible = v < 0.5; }, 1));
      }
      out[k] = g;
    }
    return out;
  };
  // a folded chair standing up, its room-side face at x0 (cz its centre along the wall)
  // v33: a folded chair standing up (your grey padded ones, 47 wide, 10 thick, 90 tall), its room-side face at x0, cz its centre along the wall
  const FOLD = () => (R.CHAIR_PADDED ? R.CHAIR_PADDED.folded : R.CHAIR_FOLDED);
  K.fchair = (g, x0, y0, cz) => {
    const [cw, cdep, ch] = FOLD();
    for (const sd of [-1, 1]) {
      K.bx(g, x0 + cdep - 2.8, y0, cz + sd * (cw / 2 - 1.4) - 1.4, 2.8, ch, 2.8, K.beech);                // the back legs
      K.bx(g, x0 + 0.3, y0 + 2, cz + sd * (cw / 2 - 4.2) - 1.4, 2.8, ch - 16, 2.8, K.beech);           // the front legs, folded up against them
    }
    K.rbx(g, x0 + 2.4, y0 + 22, cz - (cw / 2 - 4.5), cdep - 5.4, 46, cw - 9, K.linen, 1.5);              // the seat's cushion, folded up
    K.rbx(g, x0 + cdep - 4.6, y0 + ch - 34, cz - (cw / 2 - 3.5), 2.0, 28, cw - 7, K.linen, 0.8);          // the padded back
  };
  // a folded chair lying on its side (the table box's base): its length along the wall, its room-side face at x0
  K.fchairLying = (g, x0, y0, cz) => {
    const [cw, cdep, ch] = FOLD(), zA = cz - ch / 2;
    for (const sd of [-1, 1]) {
      K.bx(g, x0 + cdep - 2.8, y0 + cw / 2 + sd * (cw / 2 - 1.4) - 1.4, zA, 2.8, 2.8, ch, K.beech);
      K.bx(g, x0 + 0.3, y0 + cw / 2 + sd * (cw / 2 - 4.2) - 1.4, zA + 2, 2.8, 2.8, ch - 16, K.beech);
    }
    K.rbx(g, x0 + 2.4, y0 + 4.5, zA + 22, cdep - 5.4, cw - 9, 46, K.linen, 1.5);
    K.rbx(g, x0 + cdep - 4.6, y0 + 3.5, zA + ch - 34, 2.0, cw - 7, 28, K.linen, 0.8);
  };
  CK = K;
  return K;
}

let optC = null;                                     // v39: the sliding cabinet isn't built any more (see below)
/* v32: each cabinet's moving parts (cabP() the one on show): its table door and chair door, the chairs in the chair box (stand) and in
   the base (base), the pads on the table door, the table (rig), the chairs at the table (seats) */
const CABP = {};
const cabP = () => (S.cab === "sliding" ? CABP.sliding : CABP.compact);
function slideOut(parent, d = 60) {      // a folded chair (or the pads) drawn straight out of the cabinet into the room, then put down
  return fill => { const g = new THREE.Group(); fill(g); parent.add(g); return anim(v => { g.position.x = d * M * v; g.visible = v < 0.999; }); };
}
/* v39: the sliding cabinet (v29's buildOptC) is gone: since v33 every state opens on the compact cabinet (applyState), so it was built
   and never shown. Its numbers stay in geometry.OPTC; the code is in git history, v39. */

/* v30: the compact cabinet, two boxes side by side: the table box at the stair end (the table on its hinge rail, two chairs lying on
   their sides in the base under it, the linen shelf over it, the six seat pads on the door's back) and the chair box (four chairs, two
   deep on its floor and two deep on its shelf). Inset doors, each on a full-height piano hinge with its knuckle on the front: the table
   door turns 180° towards the window and lies back over the chair door and the wall beyond; the chair door turns 180° towards the
   stairs and lies back over the table door. */
let cab = null, cabRig = null, cabSeats = {}, cabIn = null, cabDoor = {}, cabPads = null, cabLit = [];
function buildCab(C = cabC()) {
  if (!C) return;
  const K = cabKit(), bx = K.bx, W = R.W, t = C.t, xf = C.front, xi = C.inner, deepIn = C.in_d;
  const [cw, cdep] = R.CHAIR_FOLDED;
  cab = new THREE.Group(); cab.name = "cab"; cab.userData.w = C.top[0];
  const cbox = new THREE.Group(), packs = true;   // v33: the chair box in its own group
  // two carcasses: each two ends, a top, a floor on a plinth set 2.5 back (a shadow line), a back; the boxes screwed together
  for (const [a, b] of [C.z_t, C.z_c]) {
    const span = a - b - 2 * t, tg = a === C.z_c[0] ? cbox : cab;
    bx(tg, xf, 0, b, C.d, C.h, t, K.oakV); bx(tg, xf, 0, a - t, C.d, C.h, t, K.oakV);
    bx(tg, xf, C.h - C.t_top, b + t, C.d, C.t_top, span, K.oak);
    bx(tg, xf, C.plinth - t, b + t, C.d, t, span, K.oak);
    bx(tg, xf + 2.5, 0, b + t, C.d - 2.5, C.plinth - t, span, K.dark);
    bx(tg, W - C.back, C.plinth, b + t, C.back, C.h - C.plinth - C.t_top, span, K.oakIn);
  }
  const [bt0, bt1] = C.bay_tz, [bc0, bc1] = C.bay_cz;
  bx(cab, C.rail_x[0], C.rail[0], bt1, C.rail_x[1] - C.rail_x[0], 7, bt0 - bt1, K.oak);         // the hinge rail (v31: set back behind the pads)
  bx(cab, xi + C.pads, C.linen[0] - t, bt1, C.linen_d, t, bt0 - bt1, K.oakIn);                    // the linen shelf (v31: the same)
  bx(cbox, xi, C.shelf_y, bc1, deepIn, t, bc0 - bc1, K.oakIn);                                    // the chair bay's shelf
  [[0, 0], [1, 1], [2, 2]].forEach(([i, c]) => bx(cab, xi + C.pads + 1 + i * 0.4, C.linen[0] + i * 3.2, bt1 + 8 + i * 6, deepIn - C.pads - 2, 3, 34, K.cloth[c]));   // the cloth, napkins, runner
  // the chairs: two lying in the base, two deep; four standing in the chair bay, two deep on its floor and on its shelf
  cabIn = new THREE.Group();
  const out = slideOut(cabIn), base = [], stand = [];
  for (let j = 0; j < C.chairs_base; j++) base.push(out(g => K.fchairLying(g, xi + 0.3 + j * (cdep + 0.3), C.base[0], C.cz)));
  for (const x0 of [...C.chair_x].sort((a, b) => a - b)) for (const y0 of [C.plinth, C.shelf_y + t]) stand.push(out(g => K.fchair(g, x0, y0, C.chair_z)));
  cab.add(cabIn);
  cabRig = K.tableRig(C); cab.add(cabRig);
  cabSeats = K.seats(C); Object.values(cabSeats).forEach(g => cab.add(g));
  // the doors: each a group at its hinge's axis, so turning it is a rotation; the door panel, a routed finger slot near its free edge,
  // the piano hinge's knuckle; the table door carries the six seat pads on its back (a child of the door, so they swing with it)
  cabDoor = {};
  const ax = xf - C.knuckle;
  const door = (key, z0, z1, hz) => {
    const g = new THREE.Group(); g.position.copy(v3(ax, 0, hz));
    const loc = (x, z) => [x - ax, z - hz];                                       // room cm to the door's own frame (x into the cabinet, z along it)
    const [lx, lz0] = loc(xf, Math.min(z0, z1)), lz1 = loc(xf, Math.max(z0, z1))[1];
    bx(g, lx, C.plinth + C.gap, lz0, C.door, C.door_h, lz1 - lz0, K.oakV);
    const free = Math.abs(z0 - hz) > Math.abs(z1 - hz) ? z0 : z1, sz = free > hz ? -1 : 1;
    bx(g, lx - 0.05, 92, loc(xf, free + sz * 5 - (sz < 0 ? 0 : 2.5))[1], 0.12, 26, 2.5, K.dark);   // the finger slot, 5 in from its free edge
    const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * M, 0.28 * M, 180 * M, 8), K.steel); kn.position.copy(v3(0, C.plinth + C.gap + C.door_h / 2, 0)); g.add(kn);
    cab.add(g); cabDoor[key] = g; return g;
  };
  door("T", C.door_t[0], C.door_t[1], C.door_t[1] - C.hinge_gap / 2);
  door("C", C.door_c[0], C.door_c[1], C.door_c[0] + C.hinge_gap / 2); cbox.add(cabDoor.C);
  cbox.visible = packs; cabIn.visible = packs; cab.add(cbox);
  // the six pads on the table door's back, two across and three high, from the hinge rail's underside up (v31: 40 × 40 tie-on pads,
  // their ties hanging; the rail and the linen shelf stand back so they can)
  cabPads = new THREE.Group();
  const hzT = C.door_t[1] - C.hinge_gap / 2, mid = (C.door_t[0] + C.door_t[1]) / 2, [pw, ph, pt] = C.pad;
  for (let r = 0; r < 3; r++) for (const s of [-1, 1]) {
    const y0 = C.pad_zone[0] + 0.3 + r * (ph + 0.2), z0 = mid + s * (pw / 2 + 0.2) - pw / 2 - hzT;
    K.rbx(cabPads, xf + C.door + 0.4 - ax, y0, z0, pt, ph, pw, K.pad, 1.2);
    for (const e of [0.2, 0.8]) bx(cabPads, xf + C.door + 0.4 - ax, y0 + ph - 1, z0 + pw * e - 0.6, 0.4, 9, 1.2, K.pad);   // its two ties, on the hook
  }
  cabDoor.T.add(cabPads);
  // v32 (a suggestion): a 40 cm motion-sensing light bar under each box's top, at the front, lit while its door is open
  { const g = SUGG_G.cablights = new THREE.Group(), barM = reg(new THREE.MeshStandardMaterial({ color: "#eeebe4", roughness: 0.4 }));
    const glowC = new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false }); SVAR_MATS.cablights = [glowC];
    cabLit = [];
    for (const [a_, b_] of [C.z_t, C.z_c]) {
      const zc = (a_ + b_) / 2, y = C.h - C.t_top, lit = new THREE.Group();
      ibox(g, xi + 1, y - 1.2, zc - 20, 2.2, 1.2, 40, barM);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.002, 0.38), glowC); led.position.copy(v3(xi + 2.1, y - 1.25, zc)); lit.add(led);
      const pl = new THREE.PointLight("#ffd29a", 1.6, 1.6, 2); pl.userData.accent = 1.6; pl.position.copy(v3(xi + 4, y - 6, zc)); lit.add(pl); SVAR_MATS.cablights.push(pl);
      g.add(lit); cabLit.push(lit);
    }
    cab.add(g); }
  // v32: the pads lift off the door's back (into the room once it's open), the doors each turn 180°
  CABP.compact = { sl: false, C, doorT: anim(v => { cabDoor.T.rotation.y = Math.PI * v; cabLit[0].visible = v > 0.04; }), doorC: anim(v => { cabDoor.C.rotation.y = -Math.PI * v; cabLit[1].visible = v > 0.04; }),
                   stand, base, pads: anim(v => { cabPads.position.x = -0.25 * v; cabPads.visible = false; }), rig: cabRig.userData.rig,
                   seats: { four: cabSeats.four.userData.chairs, six: cabSeats.six.userData.chairs } };
  scene.add(cab);
}
/* v33: the 80-wide version is the same build round a narrower table: swap the whole cabinet when the width changes */
function rebuildCab() {
  CAB_TW.clear();
  scene.remove(cab); cab.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  buildCab(cabC()); clipGroup(cab); applySuggest();
  const was = cabSnap; cabSnap = true; cabGo(CABP.compact); cabSnap = was;
}
/* the cabinets' tween: each entry eases an anim's p to a target, after a wait (delay) if it has one; a still snaps them (cabSnap) */
const CAB_TW = new Map();
let cabSnap = false;
function twTo(a, to, dur = 700, delay = 0, lin = false) {
  if (!a) return;
  if (cabSnap || REDUCE_M || Math.abs(a.p - to) < 1e-4 || (dur <= 0 && delay <= 0)) { CAB_TW.delete(a); a.set(to); return; }
  CAB_TW.set(a, { from: a.p, to, t0: performance.now() + delay, dur, lin });
}
function cabTween(now) {     // from the frame loop: true while anything is still moving (or waiting to)
  if (!CAB_TW.size) return false;
  let moved = false;
  for (const [a, w] of CAB_TW) {
    if (now < w.t0) continue;
    const k = w.dur > 0 ? Math.min(1, (now - w.t0) / w.dur) : 1;
    a.set(w.from + (w.to - w.from) * (w.lin ? k : ease(k))); moved = true;
    if (k >= 1) CAB_TW.delete(a);
  }
  if (moved) reshadow();
  return true;
}
const REDUCE_M = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function cabDoors() {        // which doors stand open: the table door with the table out (or S.tdoor), the chair door with S.chairs "open"
  const folded = S.dining === "folded";
  return { table: !folded || !!S.tdoor, chairs: folded && S.chairs === "open" && !S.tdoor };
}
/* v32: the cabinet goes to S one part after another, each waiting for the one before, so nothing passes through anything: opening, the
   chair door shuts, the table door opens, the pads come off it, the two chairs in the base come out, the table unfolds (2.6 s), the
   chairs come in round it; folding away, the same backwards. A part already where it should be takes no time. */
function cabGo(P) {
  const folded = S.dining === "folded", n = S.dining === "six" ? "six" : "four", dr = cabDoors();
  let t = 0;
  const seq = (list, to, ms, gap = 0, lin = false) => {
    let k = 0, end = 0;
    for (const a of list.filter(Boolean)) {
      const d = ms * Math.abs(a.p - to);
      if (d < 1) { twTo(a, to, 0, 0); continue; }
      twTo(a, to, d, t + k * gap, lin); end = Math.max(end, k * gap + d); k++;
    }
    t += end;
  };
  const now = (list, to) => list.forEach(a => twTo(a, to, 0, t));     // behind a shut door: no need to watch
  if (!folded) {
    seq(P.seats[n === "six" ? "four" : "six"], 1, 300);
    if (P.doorC.p > 0.01) seq(P.stand, 1, 500, 90); else now(P.stand, 1);
    seq([P.doorC], 0, 700);
    seq([P.doorT], 1, 700);
    seq([P.pads], 1, 400);
    seq(P.base, 1, 500, 120);
    seq([P.rig], 1, 2600, 0, true);
    seq(P.seats[n], 0, 500, 90);
  } else {
    seq([...P.seats.four, ...P.seats.six], 1, 400, 60);
    seq([P.rig], 0, 2600, 0, true);
    seq(P.base, 0, 500, 120);
    seq([P.pads], 0, 400);
    if (!dr.table) seq([P.doorT], 0, 700);
    if (!dr.chairs) { seq([P.doorC], 0, 700); now(P.stand, 0); }
    else if (P.doorC.p > 0.99) seq(P.stand, 0, 500, 90); else now(P.stand, 0);
    if (dr.table) seq([P.doorT], 1, 700);
    if (dr.chairs) seq([P.doorC], 1, 700);
  }
  cabStill = performance.now() + t;                      // v34: the trolley waits for it
}
let cabStill = 0;
function placeOptC() {
  const on = S.site === "C", sliding = S.cab === "sliding";
  if (optC) optC.visible = on && sliding;
  if (cab) cab.visible = on && !sliding;
  const P = cabP();
  if (on && P && !SH) cabGo(P);                        // v32: while "Watch it open" runs, its clock moves the cabinet
  placeFoot(); placeBeside();
}
/* v31: beside the compact cabinet (Layout, "Beside the cabinet"): left clear, a tall mirror, a slim trolley or a low oak shelf. All of
   them stand no deeper than the cabinet, behind the open table door's line */
let beside = null;
const BES = {};
function buildBeside() {
  const B = R.BESIDE; if (!B) return;
  const K = cabKit(), bx = K.bx, mat = o => reg(new THREE.MeshStandardMaterial(o)), W = R.W;
  beside = new THREE.Group(); beside.name = "beside"; scene.add(beside);
  const zc = (B.z[0] + B.z[1]) / 2;
  // the mirror: IKEA NISSEDAL, black frame, on the wall, centred in the gap
  if (B.mirror) {
    const m = B.mirror, g = new THREE.Group(); g.name = "mirror"; BES.mirror = g; beside.add(g);
    bx(g, W - m.t, m.y0, zc - m.w / 2, m.t, m.h, m.w, K.dark);
    // the glass: no live reflection (it would draw the room twice), a soft daylight sheen with two diagonal highlights reads as a mirror
    const glass = new THREE.Mesh(new THREE.PlaneGeometry((m.w - 4) * M, (m.h - 4) * M), mat({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.12, metalness: 0.25 }));
    glass.rotation.y = Math.PI / 2; glass.position.copy(v3(W - m.t - 0.05, m.y0 + m.h / 2, zc)); g.add(glass);
  }
  // the low oak shelf: the chair box's width, table height, open to the room: plates face-out, bowls, glasses, a few bottles
  if (B.dresser) {
    const d = B.dresser, g = new THREE.Group(); g.name = "dresser"; BES.dresser = g; beside.add(g);
    const z0 = B.z[0] - d.w, x0 = W - d.d, t = d.t;
    bx(g, x0, 0, z0, d.d, d.h, t, K.oakV); bx(g, x0, 0, B.z[0] - t, d.d, d.h, t, K.oakV);        // the two ends
    bx(g, x0, d.h - t, z0 + t, d.d, t, d.w - 2 * t, K.oak); bx(g, x0, 1.2, z0 + t, d.d, t, d.w - 2 * t, K.oakIn);   // the top and the floor
    bx(g, W - 0.6, 3, z0 + t, 0.6, d.h - t - 3, d.w - 2 * t, K.oakIn);                            // the back
    bx(g, x0 + 0.5, d.shelf, z0 + t, d.d - 1.1, t, d.w - 2 * t, K.oakIn);                         // the shelf
    for (let i = 0; i < 6; i++) {                                                                  // six plates on edge, one behind the other
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(13.5 * M, 13.5 * M, 1.2 * M, 32), K.plate);
      pl.rotation.z = Math.PI / 2; pl.position.copy(v3(x0 + 3 + i * 2.4, d.shelf + t + 13.7, zc + 2)); g.add(shadow(pl));
    }
    const glassM = mat({ color: "#dfe9ee", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 4; i++) { const gl2 = new THREE.Mesh(new THREE.CylinderGeometry(3.6 * M, 3 * M, 11 * M, 18), glassM); gl2.position.copy(v3(x0 + 5 + (i % 2) * 9, 3 + 5.5 + 1.8, z0 + 8 + Math.floor(i / 2) * 9)); g.add(gl2); }
    const bottle = mat({ color: "#2f4a2c", roughness: 0.2, metalness: 0.2 });
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(3.7 * M, 3.7 * M, 30 * M, 18), bottle); b.position.copy(v3(x0 + 10, 3 + 15 + 1.8, B.z[0] - 9 - i * 8.5)); g.add(shadow(b)); }
    const carafe = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 5 * M, 24 * M, 20), glassM); carafe.position.copy(v3(x0 + 11, d.h + 12, zc + 6)); g.add(carafe);
  }
  // v36: an oak blanket rail: two oak uprights on the wall, four 28 mm oak dowels 12 off it, a folded blanket over each (two on the lowest)
  if (B.rail) {
    const ra = B.rail, g = new THREE.Group(); g.name = "rail"; BES.rail = g; beside.add(g);
    const z0 = zc - ra.w / 2;
    for (const z of [z0, zc + ra.w / 2 - ra.up[0]]) bx(g, W - ra.up[1], 5, z, ra.up[1], ra.h, ra.up[0], K.oakV);
    const cols = ["#efe7d8", "#a65a38", "#8b9878", "#d9a441", "#34507f"].map(c => mat({ color: c, roughness: 1, bumpMap: HESSIAN, bumpScale: 1.2 }));
    ra.rails.forEach((y, i) => {
      for (const z of [z0 + 1, zc + ra.w / 2 - 3]) bx(g, W - ra.off - 1.4, y - 1.4, z, ra.off - ra.up[1] + 1.4, 2.8, 2, K.oak);   // the arms
      const dw = new THREE.Mesh(new THREE.CylinderGeometry(ra.dowel / 2 * M, ra.dowel / 2 * M, ra.w * M, 16), K.oak);
      dw.rotation.x = Math.PI / 2; dw.position.copy(v3(W - ra.off, y, zc)); g.add(shadow(dw));
      for (let j = 0; j < (i === 0 ? 2 : 1); j++) {                                                  // a blanket folded over it: both sides and the fold
        const c = cols[(i + j * 4) % cols.length], hang = 26 - j * 5, th = 2.4, wd = ra.w - 7, off = j * 2.6;
        bx(g, W - ra.off - 1.6 - th - off, y - hang, zc - wd / 2, th, hang, wd, c);
        bx(g, W - ra.off + 1.6 + off * 0.3, y - hang + 4, zc - wd / 2, th, hang - 4, wd, c);
        const fold = new THREE.Mesh(new THREE.CylinderGeometry((1.6 + th + off) * M, (1.6 + th + off) * M, wd * M, 16), c);
        fold.rotation.x = Math.PI / 2; fold.position.copy(v3(W - ra.off, y, zc)); g.add(shadow(fold));
      }
    });
  }
  /* v37, client: "Add a new 'Bar' option ... next to the dining cabinet ... a fixed, built-in counter-style unit (permanent joinery attached
     to the wall/floor), not a freestanding or wheeled trolley": a back-bar scribed between the cabinet's end and the pipe boxing, no deeper
     than the open table door's line. A cupboard on a recessed plinth (two doors, twenty bottles on two shelves), an oak counter at 90, a
     mirror back, an oak shelf at 135 with a glass rail under it, a display shelf at 165. Its doors open with the other bars (S.barflap) */
  if (R.BAR_BUILT) {
    const b = R.BAR_BUILT, g = new THREE.Group(); g.name = "bar"; BES.bar = g; beside.add(g);
    const [z0, z1] = b.z, w = z0 - z1, t = b.t, d = b.d, x0 = W - d, ct = b.counter - b.top_t;
    const own = c => reg(new THREE.MeshStandardMaterial({ color: c, map: OAK_TEX, roughness: 0.55 })), outer = own("#c48c57"); SVAR_MATS.barbuilt = [outer];
    bx(g, x0 + b.recess, 0, z1 + t, d - b.recess - b.back, b.plinth, w - 2 * t, K.dark);                      // the recessed plinth
    bx(g, x0, 0, z1, d, ct, t, outer); bx(g, x0, 0, z0 - t, d, ct, t, outer);                                // the two ends, scribed
    bx(g, x0 + b.door, b.plinth, z1 + t, d - b.door, t, w - 2 * t, K.oakIn);                                  // the floor
    bx(g, x0 + b.door + 0.4, b.mid, z1 + t, d - b.door - 0.4 - b.back, t, w - 2 * t, K.oakIn);                // the shelf inside
    bx(g, W - b.back, b.plinth, z1 + t, b.back, ct - b.plinth, w - 2 * t, K.oakIn);                            // the back
    bx(g, W - b.front, ct, z1, b.front, b.top_t, w, K.oak);                                                    // the oak counter
    const mir = new THREE.Mesh(new THREE.PlaneGeometry((w - 1) * M, (b.shelf2[0] - b.counter) * M), mat({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.1, metalness: 0.3 }));
    mir.rotation.y = Math.PI / 2; mir.position.copy(v3(W - b.mirror - 0.05, (b.counter + b.shelf2[0]) / 2, (z0 + z1) / 2)); g.add(mir);   // the acrylic mirror back
    // v38: over the counter, an IKEA ENHET wall frame (40 × 15 × 75, steel, two shelves) from 112: glasses and bottles stand on it
    const [ew, ed, eh] = R.ENHET, ey = b.enhet_y0, ez0 = (z0 + z1) / 2 - ew / 2, steelE = mat({ color: "#3a3b3d", roughness: 0.45, metalness: 0.5 });
    for (const zz of [ez0, ez0 + ew - 1.2]) bx(g, W - ed, ey, zz, ed, eh, 1.2, steelE);                       // its two sides
    for (const yy of [ey, ey + eh / 3, ey + eh * 2 / 3, ey + eh - 1.2]) bx(g, W - ed, yy, ez0, ed, 1.2, ew, steelE);   // bottom, two shelves, top
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.004, (ew - 6) * M), new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false }));
    led.position.copy(v3(W - ed + 3, ey - 0.25, (z0 + z1) / 2)); g.add(led);                                  // a warm strip under it, over the counter
    { const bl = new THREE.PointLight("#ffd59a", 1, 0.9, 2); bl.position.copy(v3(W - ed + 2, ey - 3, (z0 + z1) / 2)); bl.userData.accent = 1.1; g.add(bl); }   // v46: it lights the counter (Accents)
    const clear = reg(new THREE.MeshPhysicalMaterial({ color: "#eef3f4", roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.5 }));
    const glassGeo = new THREE.LatheGeometry([[0.0, 0], [3.6, 0], [3.6, 0.3], [0.35, 0.6], [0.35, 10], [2.2, 11.2], [4.2, 15.5], [4.0, 21], [3.6, R.BAR_GLASS_H]].map(([r, y]) => new THREE.Vector2(r * M, y * M)), 20);
    for (let i = 0; i < 3; i++) { const gl2 = new THREE.Mesh(glassGeo, clear); gl2.position.copy(v3(W - 7.5, ey + 1.2, ez0 + 8 + i * 12)); g.add(gl2); }   // three wine glasses on the bottom
    const steel = mat({ color: "#c9cbcd", roughness: 0.25, metalness: 0.9 });
    const bottleGeo = new THREE.LatheGeometry([[0, 0], [4.2, 0], [4.4, 1], [4.4, 21], [3.6, 24], [1.4, 27.5], [1.4, 32], [1.6, 32.5], [1.6, 34], [0, 34]].map(([r, y]) => new THREE.Vector2(r * M, y * M)), 16);
    const glassC = ["#3f6b3a", "#c48a3a", "#e8eef0", "#6b2e1f", "#2f4e6e", "#d9c27a"].map(c => reg(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.88 })));
    const r = rnd(41), pitch = (w - 2 * t) / b.across;
    for (const y of [b.floor, b.mid + t]) for (let i = 0; i < b.across; i++) {                                 // the front row of each shelf
      const bo = new THREE.Mesh(bottleGeo, glassC[(i + (y > 20 ? 3 : 0)) % glassC.length]), k = 0.78 + r() * 0.22; bo.scale.set(1, k, 1);
      bo.position.copy(v3(x0 + b.door + 6, y, z1 + t + pitch * (i + 0.5))); g.add(bo); }
    for (const [dz, k] of [[-12, 0.62], [-2, 0.55], [9, 0.6]]) { const bo = new THREE.Mesh(bottleGeo, glassC[(dz + 20) % 6]); bo.scale.set(1, k, 1);
      bo.position.copy(v3(W - 7, ey + eh / 3 + 1.2, (z0 + z1) / 2 + dz)); g.add(bo); }                          // three short bottles on its first shelf
    const shaker = new THREE.Mesh(new THREE.CylinderGeometry(3.4 * M, 4 * M, 20 * M, 18), steel); shaker.position.copy(v3(W - 9, b.counter + 10, z1 + 9)); g.add(shaker);
    bx(g, W - 16, b.counter, (z0 + z1) / 2 - 12, 12, 1.2, 24, K.oakIn);                                        // a small oak tray
    for (const dz of [-6, 4]) { const tu = new THREE.Mesh(new THREE.CylinderGeometry(3.8 * M, 3.3 * M, 9 * M, 18), clear); tu.position.copy(v3(W - 10, b.counter + 1.2 + 4.5, (z0 + z1) / 2 + dz)); g.add(tu); }
    // the two doors, each hinged at its outer end, brass knobs at the meeting edge
    const dw = (w - 2 * t - 0.6) / 2, dh = ct - b.plinth - 0.4, brass = mat({ color: "#b8913f", roughness: 0.3, metalness: 0.8 }), leaves = [];
    for (const [hz, s_] of [[z1 + t + 0.15, 1], [z0 - t - 0.15, -1]]) {
      const pv = new THREE.Group(); pv.position.copy(v3(x0, b.plinth + 0.2, hz)); g.add(pv);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(b.door * M, dh * M, dw * M), outer); leaf.position.set(-b.door / 2 * M, dh / 2 * M, s_ * dw / 2 * M); pv.add(shadow(leaf));
      const kn = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), brass); kn.position.set(0.01, (dh - 8) * M, s_ * (dw - 3) * M); pv.add(kn);
      leaves.push([pv, s_]); }
    WORK.barflap3 = anim(v => { for (const [pv, s_] of leaves) pv.rotation.y = s_ * 1.75 * v; });
  }
  // v37: shoe storage, two IKEA TRONES stacked in the same slot (wall-fixed, as IKEA says), 18 deep: their fronts tip down to open
  if (R.TRONES && B.shoes) {
    const [tw, td, th] = R.TRONES, g = new THREE.Group(); g.name = "shoes"; BES.shoes = g; beside.add(g);
    const body = mat({ color: "#ece8e0", roughness: 0.5 }), seam = mat({ color: "#cfc9bd", roughness: 0.6 });
    for (let i = 0; i < B.shoes.n; i++) { const y = B.shoes.y0 + i * (th + B.shoes.gap), z0 = zc - tw / 2;
      bx(g, W - td, y, z0, td, th, tw, body);                                                                   // the cabinet
      bx(g, W - td - 0.3, y + 2, z0 + 1, 0.3, th - 4, tw - 2, seam);                                             // the tip-down front's line
      bx(g, W - td - 0.6, y + th - 7, zc - 6, 0.6, 1.2, 12, seam); }                                            // its finger-pull
  }
  // the slim trolley: three trays on a frame, four castors; it parks along the wall and pulls out for dinner (v34: WORK.trolley)
  if (B.trolley) {
    const tr = B.trolley, g = new THREE.Group(); g.name = "trolley"; BES.trolley = g; beside.add(g);
    const body = mat({ color: tr.col || "#2b2b2b", roughness: 0.5, metalness: 0.3 }), x0 = W - 1.5 - tr.d, z0 = zc - tr.w / 2;
    for (const [xx, zz] of [[x0, z0], [x0 + tr.d - 1.2, z0], [x0, z0 + tr.w - 1.2], [x0 + tr.d - 1.2, z0 + tr.w - 1.2]]) bx(g, xx, 4, zz, 1.2, tr.h - 4, 1.2, body);
    for (const y of tr.tiers) { bx(g, x0, y, z0, tr.d, 0.8, tr.w, body); bx(g, x0, y, z0, tr.d, 4, 0.6, body); bx(g, x0, y, z0 + tr.w - 0.6, tr.d, 4, 0.6, body); }
    for (const [xx, zz] of [[x0 + 1, z0 + 1], [x0 + tr.d - 1, z0 + 1], [x0 + 1, z0 + tr.w - 1], [x0 + tr.d - 1, z0 + tr.w - 1]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(2 * M, 2 * M, 1.5 * M, 14), K.dark); w.rotation.x = Math.PI / 2; w.position.copy(v3(xx, 2, zz)); g.add(w); }
    const cup = mat({ color: "#efe7d8", roughness: 0.5 });
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 3.4 * M, 9 * M, 16), cup); c.position.copy(v3(x0 + tr.d / 2, tr.tiers[tr.tiers.length - 1] + 5.3, z0 + 8 + i * (tr.w - 16) / 2)); g.add(c); }
    // v34: the slim trolley as a drinks trolley (a suggestion): bottles on the top tray, glasses, mixers and an ice bucket below
    { const dk = SUGG_G.bartrolley = new THREE.Group(), r = rnd(23), xm = x0 + tr.d / 2, [t1, t2, t3, t4] = tr.tiers;
      const tint = reg(new THREE.MeshPhysicalMaterial({ color: "#3f6b3a", roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.88 })), clear = reg(new THREE.MeshPhysicalMaterial({ color: "#e8eef0", roughness: 0.06, transmission: 0.6, transparent: true, opacity: 0.55 }));
      SVAR_MATS.bartrolley = [tint];
      for (let i = 0; i < 4; i++) { const bh = 26 + r() * 7, br = 3.7 + r() * 0.8, zz = z0 + 5.5 + i * (tr.w - 11) / 3;
        const b_ = new THREE.Mesh(new THREE.CylinderGeometry(br * M, br * M, bh * 0.7 * M, 16), i % 2 ? clear : tint); b_.position.copy(v3(xm, t4 + 0.8 + bh * 0.35, zz)); dk.add(b_);
        const n_ = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * M, br * 0.9 * M, bh * 0.3 * M, 12), i % 2 ? clear : tint); n_.position.copy(v3(xm, t4 + 0.8 + bh * 0.85, zz)); dk.add(n_); }
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(3.8 * M, 3.3 * M, 9 * M, 16), clear); c.position.copy(v3(xm, t3 + 0.8 + 4.5, z0 + 6 + i * 10.4)); dk.add(c); }
      const steel = reg(new THREE.MeshStandardMaterial({ color: "#c9cbcd", roughness: 0.25, metalness: 0.9 }));
      const ice = new THREE.Mesh(new THREE.CylinderGeometry(7.5 * M, 6.5 * M, 17 * M, 22), steel); ice.position.copy(v3(xm, t2 + 0.8 + 8.5, z0 + 12)); dk.add(ice);
      for (let i = 0; i < 3; i++) { const cn = new THREE.Mesh(new THREE.CylinderGeometry(3.3 * M, 3.3 * M, 11.5 * M, 14), reg(new THREE.MeshStandardMaterial({ color: ["#e9e4da", "#c7643a", "#8e9a80"][i], roughness: 0.4, metalness: 0.4 })));
        cn.position.copy(v3(xm, t2 + 0.8 + 5.75, z0 + 26 + i * 7)); dk.add(cn); }
      g.add(dk); }
    // v34: "Pull it out for dinner": it slides along the wall to 1.3 clear of the plant stand's corner (z -234 .. -277.2, wherever the
    // cabinet's width put it), then rolls 119.5 straight out, to x 326 .. 346: past the table door's whole swing (90.5 from its hinge),
    // 13 behind the window-side chairs, clear of the lamp and the sofa. It can't reach the table's far end: with six sat down the sofa's
    // end and the chairs leave no way past. It comes out, and goes back, only with the table door shut (the open door lies over its spot)
    WORK.trolley = anim(v => {
      const zT = -255.6, dz = zT - (zc + beside.position.z / M), a = Math.min(1, v / 0.15), b = Math.max(0, (v - 0.15) / 0.85);
      g.position.set(119.5 * ease(b) * M, 0, dz * ease(a) * M); });
  }
  clipGroup(beside);
}
function placeWork() {      // v34
  twTo(WORK.blind, S.blind === "up" ? 0 : 1, 1800);
  twTo(WORK.barflap, S.barflap ? 1 : 0, 1400);
  twTo(WORK.barflap2, S.barflap ? 1 : 0, 1400);                                                    // v36: the bar by the sofa opens with it
  twTo(WORK.ctop, S.ctop ? 1 : 0, 1200);
  if (WORK.rlid) twTo(WORK.rlid, S.ctop ? 1 : 0, 1200);                                          // v38: the record table's lid
  twTo(WORK.barflap3, S.barflap ? 1 : 0, 1400);                                                    // v37: the built-in bar's doors open with it
  twTo(WORK.sdraw, S.sdraw ? 1 : 0, 1500);                                                          // v37: the drawers in the bottom steps
  twTo(WORK.lid, S.lid ? 1 : 0, 1500);
  twTo(WORK.lp, S.lp ? 1 : 0, 1300);
  // the trolley parks behind the table door's line: back it goes once the door has shut (the open door lies over its spot)
  if (WORK.trolley) {
    if (S.beside !== "trolley") twTo(WORK.trolley, 0, 0);
    else if (!cabSnap && S.site === "C" && S.cab === "compact" && cabDoors().table && cabP() && cabP().doorT.p > 0.02) {}   // the door's over its spot: it waits (a still or a link just puts it there)
    else twTo(WORK.trolley, S.trolley === "out" ? 1 : 0, 3200, Math.max(0, cabStill - performance.now()));
  }
}
function placeBeside() {
  if (!beside) return;
  const on = S.site === "C" && S.cab === "compact";
  for (const [k, g] of Object.entries(BES)) g.visible = on && S.beside === k;
  beside.position.z = S.cabw === "80" && R.CAB80 ? (R.CAB.z[1] - R.CAB80.z[1]) / 2 * M : 0;   // v33: centred in the longer gap
}
/* v31: "Show the space it needs, open": with the table folded, the floor it takes when it's out for six: the table, the six chairs
   and (the compact one) the table door's swing, drawn flat on the floor */
let foot = null, footKey = "";
function buildFoot(C) {
  const g = new THREE.Group(); g.name = "foot";
  const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
  const edge = new THREE.LineBasicMaterial({ color: "#1f4a38" });
  const flat = (geo, m, x, z, y = 0.6) => { const p = new THREE.Mesh(geo, m); p.rotation.x = -Math.PI / 2; p.position.copy(v3(x, y, z)); p.renderOrder = 2; g.add(p); return p; };
  const rect = (x0, x1, z0, z1, m, y) => { const p = flat(new THREE.PlaneGeometry(Math.abs(x1 - x0) * M, Math.abs(z1 - z0) * M), m, (x0 + x1) / 2, (z0 + z1) / 2, y);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry), edge); e.rotation.copy(p.rotation); e.position.copy(p.position); g.add(e); };
  if (C.door_tw) {   // the compact cabinet: the table door turns through a half circle in front of the boxes as it opens
    const hz = C.door_t[1] - C.hinge_gap / 2, hx = C.front - C.knuckle;
    flat(new THREE.CircleGeometry(C.door_tw * M, 48, -Math.PI / 2, Math.PI), mat("#34507f", 0.16), hx, hz, 0.4);
  }
  rect(C.tx[0], C.tx[1], C.tz[1], C.tz[0], mat("#2f7d5b", 0.32), 0.7);
  const cm = mat("#c7643a", 0.26), [cw, cd] = R.CHAIR;
  for (const [x, z] of C.seats.six) rect(x - cw / 2, x + cw / 2, z - cd / 2, z + cd / 2, cm, 0.8);
  return g;
}
function placeFoot() {
  const want = !!S.foot && S.site === "C" && S.dining === "folded";
  const fk = S.cab + S.cabw;
  if (want && footKey !== fk) { if (foot) scene.remove(foot); foot = buildFoot(cabC()); clipGroup(foot); scene.add(foot); footKey = fk; }
  if (foot) foot.visible = want;
}
function clipGroup(g) { g.traverse(o => { if (o.isMesh || o.isLine) [].concat(o.material).forEach(m => m && !m.clippingPlanes && clipMat(m)); }); }
/* v31: suggested set-ups (Layout): several choices at once, then a flight to the view that shows them */
const MOMENTS = {
  dinner:  { set: { site: "C", dining: "six", tdoor: false, scene: "cosy", tod: "evening", curtains: true }, view: "dining",
             say: "Dinner for six: the table out, the curtains drawn, the lights low, bar 2 up over the table" },
  four:    { set: { site: "C", dining: "four", tdoor: false, scene: "bright", tod: "day", curtains: false }, view: "sit",
             say: "Lunch for four: the table out, two a side, from your seat at the end" },
  film:    { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "film", tod: "evening", curtains: true }, view: "sofa",
             say: "Film night: everything packed away, the lights down" },
  morning: { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "bright", tod: "day", curtains: false }, view: "room",
             say: "An everyday morning: the cabinet shut, the room clear" },
  // v37: the ottoman's games out, cosy; and drinks at the bar built in beside the cabinet, its doors open (v38: the record table's lid stays down to play on)
  games:   { set: { dining: "folded", tdoor: false, chairs: "cupboard", scene: "cosy", tod: "evening", curtains: true, lid: true, ctop: false },
             aim: { eye: [300, 150, -60], at: [200, 35, -170], fov: 52 }, say: "Games night: the ottoman's lid off, the lights cosy" },
  drinks:  { set: { site: "C", cab: "compact", dining: "folded", tdoor: false, chairs: "cupboard", scene: "cosy", tod: "evening", beside: "bar", barflap: true },
             aim: { eye: [345, 138, -180], at: [460, 108, -262], fov: 46 }, say: "Drinks: the bar beside the cabinet open, glasses down from the rail" },
};
function playMoment(k) {
  const m = MOMENTS[k]; if (!m) return;
  showStop(false); const { sugg, ...set } = m.set; Object.assign(S, set);
  if (sugg) S.sugg = Object.assign({}, S.sugg, { [sugg.slice(1)]: true });                       // v37: "+key" switches a suggestion on
  if (set.beside) extrasRule("beside", set.beside, true);
  if (m.set.scene) { S.lv = Object.assign({}, SCENES[m.set.scene].levels); S.master = 100; }
  applyState(); syncButtons(); if (m.aim) flyTo(m.aim.eye, m.aim.at, m.aim.fov); else setView(m.view); toast(m.say);
}
/* v31: "Watch it open". v32, client: "slow down the playback of the table opening to show clearly how it puts together and opens in a
   slow and clear manner": thirteen steps, about forty seconds, on the show's own clock, each step on a card (what you do, a bar; back,
   pause, next, stop). Every part's place is worked out from the clock, so pausing or stepping back and on is exact. Looking round
   doesn't stop it (the camera then stays where you put it); Stop, Esc or any other button does, and leaves the table out for six. */
let SH = null;
function showSteps(P) {
  const C = P.C, st = [], add = (title, text, dur, acts, view) => { if (acts === null) return; st.push({ title, text, dur, acts, view }); };
  const each = (list, to, gap, ms, from = 0) => list.map((a, i) => [a, to, from + i * gap, ms]);
  const rig = (a, b, ms) => [[P.rig, RIG[b], 0, ms, true]];
  if (P.sl) {
    add("Packed away", "The table stands folded on its hinge rail behind door A; the six chairs and their pads are behind door B.", 2.6, [], "chairs");
    add("Slide door B open", "It runs on the back track, in behind door A.", 3, [[P.doorC, 1, 0, 2.4]]);
    add("Take out the pads and the chairs", "The six pads first, then the chairs, the front ones first. Folded, each is 9 deep.", 1.6 + P.stand.length * 0.55, each(P.stand, 1, 0.55, 1.2));
    add("Slide door B shut", "", 2.6, [[P.doorC, 0, 0, 2.1]]);
    add("Slide door A open", "It runs on the front track, over door B. The table is behind it, folded face to face.", 3.3, [[P.doorT, 1, 0, 2.7]], "dining");
  } else {
    add("Packed away", `Everything is inside: the table on its hinge rail and the six padded chairs, in a cabinet ${Math.round(C.len)} long and ${C.d} deep.`, 2.6, [], "chairs");
    add("Open the chair door", "It turns right round on its piano hinge and lies back against the table door.", 3.2, [[P.doorC, 1, 0, 2.6]]);
    add("Take out four chairs", "Two from the floor and two from the shelf, the front ones first. Folded, each is 10 thick.", 4.1, each(P.stand, 1, 0.7, 1.4));
    add("Shut the chair door", "", 2.7, [[P.doorC, 0, 0, 2.2]]);
    add("Open the table door", "It turns the other way, towards the window. The folded table is behind it.", 3.4, [[P.doorT, 1, 0, 2.8]], "dining");
    if (P.base.length) add("Take out two more chairs", "The two lying in the base slide out, the front one first.", 3.2, each(P.base, 1, 0.7, 1.4));
  }
  add("Tilt the table out", "Both halves together, folded face to face, turn out on the piano hinge at the rail.", 3.3, rig(0, 1, 2.8), "unfold");
  add("Fold down the first two legs", "They swing down from under the first half and lock on their brackets.", 2.7, rig(1, 2, 2.2));
  add("Lower it onto them", "The first half comes down level, held by the hinge at the rail and its two legs.", 3.1, rig(2, 3, 2.6));
  add("Flip the second half over", "It turns over on the three flip-top hinges at the joint, its own legs still folded under it.", 3.9, rig(3, 4, 3.4));
  add("Fold down its two legs", "", 2.3, rig(4, 5, 1.8));
  add("Lay it flat", `The joint closes flush: the table is ${Math.round(C.len_open || C.len)} long and ${Math.round(C.top[0])} wide.`, 2.6, rig(5, 6, 1.8));
  add("Six sit down", "The padded chairs unfold round it.", 4.6, each(P.seats.six, 0, 0.35, 1.2));
  return st;
}
function showOpen() {
  showStop(false); if (tourSt) tourEnd(); closeAct();
  Object.assign(S, { site: "C", dining: "folded", tdoor: false, chairs: "cupboard" });
  cabSnap = true; applyState(); cabSnap = false; syncButtons();
  const P = cabP(); if (!P) return;
  CAB_TW.clear();
  // each part's keyframes: [time s, p, linear], held between its moves
  const steps = showSteps(P), tracks = new Map();
  let T = 0;
  for (const s of steps) {
    s.t0 = T;
    for (const [a, to, at, ms, lin] of s.acts) {
      if (!tracks.has(a)) tracks.set(a, [[0, a.p, false]]);
      const tr = tracks.get(a), from = tr[tr.length - 1][1];
      tr.push([T + at, from, false], [T + at + ms, to, !!lin]);
    }
    T += s.dur;
  }
  SH = { P, steps, tracks, T, t: 0, i: -1, paused: false, last: performance.now(), own: false };
  root.classList.add("touring"); qs("#r3d-show").hidden = false;
  showCard(); dirty();
}
function showPose(t) {
  for (const [a, tr] of SH.tracks) {
    let v = tr[tr.length - 1][1];
    for (let j = 1; j < tr.length; j++) if (t < tr[j][0]) {
      const [t0, v0] = tr[j - 1], [t1, v1, lin] = tr[j], k = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
      v = v0 + (v1 - v0) * (lin ? k : ease(k)); break;
    }
    a.set(v);
  }
  reshadow();
}
function showCard() {
  const i = SH.steps.reduce((n, s, j) => (SH.t >= s.t0 ? j : n), 0), s = SH.steps[i];
  qs("#r3d-showbar").style.width = `${Math.min(100, SH.t / SH.T * 100)}%`;
  if (i === SH.i) return;
  SH.i = i;
  qs("#r3d-shown").textContent = `Step ${i + 1} of ${SH.steps.length}`;
  qs("#r3d-showh").textContent = s.title; qs("#r3d-showp").textContent = s.text; qs("#r3d-showp").hidden = !s.text;
  if (s.view && !SH.own) setView(s.view, false, 1600);
}
function showTick(now) {         // from the frame loop
  if (!SH) return false;
  const dt = Math.min(100, now - SH.last); SH.last = now;
  if (!SH.paused) SH.t += dt / 1000;
  if (SH.t >= SH.T) { SH.t = SH.T; showPose(SH.T); showStop(true); return true; }
  showPose(SH.t); showCard();
  return true;
}
function showCtl(c) {
  if (!SH) return;
  if (c === "stop") { showStop(true); return; }
  if (c === "pause") {
    SH.paused = !SH.paused; const b = qs('[data-show="pause"]');
    b.setAttribute("aria-label", SH.paused ? "Carry on" : "Pause"); b.querySelector(".ms").textContent = SH.paused ? "play_arrow" : "pause";
    return;
  }
  const i = SH.i, s = SH.steps;
  if (c === "next") { if (i + 1 >= s.length) { showStop(true); return; } SH.t = s[i + 1].t0; }
  if (c === "prev") SH.t = s[Math.max(0, SH.t - s[i].t0 < 1 ? i - 1 : i)].t0;
  showPose(SH.t); showCard(); dirty();
}
function showStop(finish = true) {
  if (!SH) return;
  SH = null; root.classList.remove("touring"); qs("#r3d-show").hidden = true;
  const b = qs('[data-show="pause"]'); if (b) { b.setAttribute("aria-label", "Pause"); b.querySelector(".ms").textContent = "pause"; }
  if (finish) { Object.assign(S, { site: "C", dining: "six", tdoor: false, chairs: "cupboard" }); applyState(); syncButtons(); }
}
/* v17: the ideas (ideas.py), each its own group, all hidden until its button is on */
const IDEA_G = {};
let ideaLed;
/* v20: the decor to try (S.decor): set by applyDecor() */
let rugMesh, curtCloth, caseFrameM, cushG, coffeeG, floorMat, shelfMat;
/* v21: suggested furniture and decor (ideas.SUGGEST, the same keys), each on or off (S.sugg); the floor pieces move in Edit room */
const SUGG_G = {};
/* v34, client: "i like the large glass display case on the chimney breast": it's in the plan, so it's on the breast whenever the table
   isn't (the flip-top's site A, set aside) */
const caseOn = () => S.site !== "A" && S.plants !== "breast";   // layout B's plant stand (158 tall) stands in front of the breast
/* v34: more things that work from a tap (placeWork): the blind rolls up and down, the front records lift out of the vinyl stand, the
   trolley beside the cabinet pulls out for dinner; each an anim, eased by the cabinets' tween */
const WORK = {};
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
  const floor = (k, label, w, d, x, z, build, mats = []) => { const g = new THREE.Group(); build(g); SUGG_G[k] = movable("sg_" + k, label, g, () => ({ x, z, rot: 0 }), w, d, mats, false, { when: () => !!S.sugg[k] && !(k === "floorplant" && (S.sugg.blanketbasket || S.sugg.cotswoldbasket)) }); };   // v36: the blanket basket takes the floor plant's corner
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
  { const g = SUGG_G.art = new THREE.Group(), z0 = -298, oak = ownOak(); SVAR_MATS.art = [oak];
    ibox(g, 0, 110, z0, 3, 55, 80, oak);
    const print = reg(new THREE.MeshStandardMaterial({ map: PRINT_TEX, roughness: 0.8 }));
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.47), print); pl.position.copy(v3(3.1, 137.5, z0 + 40)); pl.rotation.y = -Math.PI / 2; g.add(pl);
    shell.add(g); }
  { const g = SUGG_G.clock = new THREE.Group(), cx = (R.DOOR_X[0] + R.DOOR_X[1]) / 2, cy = R.DOOR_H + (R.CEIL - R.DOOR_H) / 2, zf = R.RECESS_Z;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 40), mat("#f3f1eb")); face.rotation.x = Math.PI / 2; face.position.copy(v3(cx, cy, zf - 1.5)); g.add(face);
    const rimM = SVAR_MATS.clock = [ownOak()], rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 40), rimM[0]); rim.position.copy(v3(cx, cy, zf - 3)); g.add(rim);
    const ink = mat("#1f1f21");
    for (const [len, a] of [[10, 0.6], [7, 2.4]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.006, len * M, 0.003), ink);
      h.geometry.translate(0, len * M / 2, 0); h.position.copy(v3(cx, cy, zf - 3.2)); h.rotation.z = a; g.add(h); }
    shell.add(g); }
  { const g = SUGG_G.tray = new THREE.Group(), oak = ownOak(); SVAR_MATS.tray = [oak];
    lb(g, 12, 42, 0, 40, 1.6, 26, oak);
    lb(g, 18, 43.6, 0, 22, 3, 16, mat("#2f4a6e")); lb(g, 18, 46.6, 0, 20, 2.4, 15, mat("#c7643a"));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 20), reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.12 })));
    c.position.copy(v3(2, 43.6 + 4.5, 2)); g.add(shadow(c));
    (coffeeG || shell).add(g); }
  // v23: six more
  const glow = new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false });
  { const g = SUGG_G.fairy = new THREE.Group(), CU = R.CURTAIN, [wx0, wx1] = R.WINDOW_X, x0 = wx0 - CU.ext + 2, x1 = wx1 + CU.ext - 2, gs = [];
    for (let x = x0; x <= x1; x += 6) { const sp = new THREE.SphereGeometry(0.0045, 6, 4), q = v3(x, CU.rail_y + CU.pole / 2 - 1.6 - 1.2 * Math.abs(Math.sin((x - x0) / 23)), CU.z + 2.6); sp.translate(q.x, q.y, q.z); gs.push(sp); }
    SVAR_MATS.fairy = [ownGlow("#ffd59a")]; g.add(new THREE.Mesh(mergeGeometries(gs), SVAR_MATS.fairy[0])); shell.add(g); }
  { const g = SUGG_G.hanger = new THREE.Group(), CU = R.CURTAIN, x = R.WINDOW_X[0] + 34, z = CU.z + 1, yp = CU.rail_y - 72;
    const cord = mat("#e9e1cf");
    for (const a of [0, 2.1, 4.2]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.7, 4), cord);
      c.position.copy(v3(x + Math.cos(a) * 4, yp + 46, z + Math.sin(a) * 4)); c.rotation.z = Math.cos(a) * 0.08; c.rotation.x = Math.sin(a) * 0.08; g.add(c); }
    SVAR_MATS.hanger = [mat("#c46c45")]; potPlant(g, x, yp, z, 7, 8, 3, rnd(81), SVAR_MATS.hanger[0], leaf); shell.add(g); }
  { const g = SUGG_G.trail = new THREE.Group(); SVAR_MATS.trail = [mat("#ece6da")]; potPlant(g, 172, 196, 22, 7, 10, 4, rnd(83), SVAR_MATS.trail[0], leaf); shell.add(g); }
  { const g = SUGG_G.throw = new THREE.Group(), knit = reg(new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 1, bumpMap: HESSIAN, bumpScale: 1.4 })); SVAR_MATS.throw = [knit];
    const ze = R.SOFA.end;
    ibox(g, 22, 52, ze - 46, 70, 2.2, 46, knit);                 // folded over the seat at the open end
    ibox(g, 22, 18, ze - 0.2, 70, 36, 2.2, knit);                // and hanging over the end
    shell.add(g); }
  { const g = SUGG_G.pclamp = new THREE.Group(), y = R.PC_SHELF_TOP, z = -198, x = 13;
    const pm = SVAR_MATS.pclamp = [mat("#e8e2d4"), reg(new THREE.MeshStandardMaterial({ color: "#f3e7cf", emissive: "#ffcf8a", emissiveIntensity: 0.6, roughness: 0.6 }))];
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.2, 20), pm[0]); base.position.copy(v3(x, y + 10, z)); g.add(shadow(base));
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), pm[1]);
    shade.position.copy(v3(x, y + 19, z)); g.add(shadow(shade)); shell.add(g); }
  // v26: six more
  { const g = SUGG_G.candles = new THREE.Group(), sb = R.SHELF_B, wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.18 })); SVAR_MATS.candles = [wax];
    [[10, -262], [12.5, -252], [15, -243]].forEach(([h, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0375, 0.0375, h * M, 20), wax); c.position.copy(v3(R.W - sb.d / 2 - 2, sb.top + h / 2, z)); g.add(shadow(c));
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), glow); f.scale.y = 1.8; f.position.copy(v3(R.W - sb.d / 2 - 2, sb.top + h + 1.2, z)); g.add(f); });
    shell.add(g); }
  { const g = SUGG_G.runner = new THREE.Group(), linen = mat("#e6dccb"); SVAR_MATS.runner = [linen];
    lb(g, 0, 0, 0, 180, 0.4, 33, linen);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 18), reg(new THREE.MeshStandardMaterial({ color: "#7a8a6a", roughness: 0.35 }))); v.position.copy(v3(0, 10.4, 0)); g.add(shadow(v));
    for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.18, 4), leaf); st.position.copy(v3((i - 2) * 1.2, 27, (i % 2) * 1.5)); st.rotation.z = (i - 2) * 0.12; g.add(st);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat(["#efe7d8", "#d9a441", "#c7643a"][i % 3])); fl.position.copy(v3((i - 2) * 3.4, 36, (i % 2) * 1.5)); g.add(fl); }
    shell.add(g); }
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
  { const g = SUGG_G.mirror = new THREE.Group(), z = R.WINDOW_Z + 1.2, x0 = 14, w = 50, y0 = 108, h = 90;
    const glass = reg(new THREE.MeshStandardMaterial({ color: "#cfdbe0", roughness: 0.05, metalness: 0.6 }));
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w, h - w / 2); sh.absarc(w / 2, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(0, 0);
    SVAR_MATS.mirror = [ownOak()]; const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }), SVAR_MATS.mirror[0]); fr.scale.set(-M, M, M); fr.position.copy(v3(x0, y0, z)); g.add(shadow(fr));
    const inner = new THREE.Shape(); const iw = w - 6, ih = h - 6; inner.moveTo(0, 0); inner.lineTo(iw, 0); inner.lineTo(iw, ih - iw / 2); inner.absarc(iw / 2, ih - iw / 2, iw / 2, 0, Math.PI, false); inner.lineTo(0, 0);
    const gl_ = new THREE.Mesh(new THREE.ShapeGeometry(inner), glass); gl_.scale.set(-M, M, M); gl_.position.copy(v3(x0 + 3, y0 + 3, z + 2.4)); g.add(gl_);
    shell.add(g); }
  { const g = SUGG_G.shelfled = new THREE.Group(), sb = R.SHELF_B;
    SVAR_MATS.shelfled = [ownGlow("#ffd59a")]; const strip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.004, (sb.z[0] - sb.z[1] - 4) * M), SVAR_MATS.shelfled[0]); strip.position.copy(v3(R.W - sb.d + 2, sb.top - sb.t - 0.3, (sb.z[0] + sb.z[1]) / 2)); g.add(strip);
    const pl = new THREE.PointLight("#ffd29a", 1.2, 2.2, 2); pl.userData.accent = 1.2; SVAR_MATS.shelfled.push(pl); pl.position.copy(v3(R.W - sb.d / 2, sb.top - sb.t - 8, (sb.z[0] + sb.z[1]) / 2)); g.add(pl);
    shell.add(g); }
  SVAR_MATS.basket = [mat("#b89a6c")];
  floor("basket", "Seagrass basket (suggested)", 40, 40, 322, -70, g => {
    const sea = SVAR_MATS.basket[0], b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.4, 28, 1, true), sea); sea.side = THREE.DoubleSide; b.position.y = 0.2; g.add(shadow(b));
    lb(g, 0, 0, 0, 32, 1, 32, sea);
    const roll = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat("#7a8a6a")); roll.scale.set(1, 0.6, 1); roll.position.y = 0.41; g.add(shadow(roll)); }, SVAR_MATS.basket);
  // v32, client: "add anything else you haven't already suggested": three more
  // picture lights over the two framed LPs (a 27.9 shade, 12.5 out on its arm from a 10.6 × 7 back plate), each washing its LP
  // v35: the picture lights went with the two framed LPs (v34): not built
  // a blackout roller blind, face-fixed just above the window and down to the sill's nose, in front of the reveal (its plants stay behind it)
  { const g = SUGG_G.blind = new THREE.Group(), [wx0, wx1] = R.WINDOW_X, [wy0, wy1] = R.WINDOW_Y, z = R.WINDOW_Z + 3.2, bw = wx1 - wx0 + 4;
    const cloth = reg(new THREE.MeshStandardMaterial({ color: "#cdbf9f", roughness: 0.95, side: THREE.DoubleSide })); SVAR_MATS.blind = [cloth];
    const white_ = reg(new THREE.MeshStandardMaterial({ color: "#eeebe4", roughness: 0.45 }));
    ibox(g, wx0 - 4, wy1 + 4, R.WINDOW_Z + 0.2, bw + 4, 8, 6, white_);                    // the cassette over the window
    const top = wy1 + 4, bot = wy0 + R.SILL.t + 1;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(bw * M, (top - bot) * M), cloth); pane.position.copy(v3((wx0 + wx1) / 2, (top + bot) / 2, z)); g.add(shadow(pane));
    const bar = ibox(g, wx0 - 2, bot - 1.6, z - 0.6, bw, 1.6, 1.2, white_), bar0 = bar.position.y;   // the bottom bar
    WORK.blind = anim(v => { const k = Math.max(0.03, v); pane.scale.y = k; pane.position.y = (top - (top - bot) * k / 2) * M; bar.position.y = bar0 + (top - bot) * (1 - k) * M; }, 1);   // v34: down (1) or rolled up
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.7, 6), white_); cord.position.copy(v3(wx1 - 4, top - 35, z - 1.2)); g.add(cord);
    shell.add(g); }
  // v34, client: "maybe integrating a wall bar in here for drinks/spirits": a drinks cabinet under the glass case, the case's width, 20
  // deep (geometry.BAR). An inset oak fall-front on a piano hinge drops onto two soft-close stays to a counter at 98; inside, nine 70 cl
  // bottles on a mirror back, lit from under the top. Its front (S.barflap) is a tween like the cabinet's doors
  if (R.DRINKS) { SUGG_G.barcase = drinksCab(R.DRINKS, R.DRINKS.x[0], R.DRINKS.x[1], "barcase", "barflap", 71); shell.add(SUGG_G.barcase); }
  // v36: C, the same cabinet on the side wall by the sofa's open end: built facing the breast's way, then turned to face the room from x 0
  if (R.BAR_SIDE) { const B = R.BAR_SIDE, pv = SUGG_G.barside = new THREE.Group(); pv.add(drinksCab(B, B.z[1], B.z[0], "barside", "barflap2", 73)); pv.rotation.y = Math.PI / 2; shell.add(pv); }
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
    const g = new THREE.Group(), w = B.w, d = B.d, h = B.h, t = 1.2;
    lb(g, 0, 0, 0, w, 1.5, d, weave);                                                                     // its floor
    for (const [x, z, ww, dd] of [[-w / 2 + t / 2, 0, t, d], [w / 2 - t / 2, 0, t, d], [0, -d / 2 + t / 2, w - 2 * t, t], [0, d / 2 - t / 2, w - 2 * t, t]]) {
      lb(g, x, 1.5, z, ww, h - 1.5, dd, weave);
      lb(g, x * 1.01, h - 5, z * 1.01, ww + (ww > t ? 0 : 0.6), 5, dd + (dd > t ? 0 : 0.6), lining); }  // the lining over the rim
    const th = R.THROW_LONG || [47, 25, 8.5], cols = ["#efe7d8", "#a65a38", "#8b9878", "#d9a441", "#34507f"];
    for (let k = 0; k < 5; k++) lb(g, 0, 1.5 + k * th[2], 0, th[1] - (k % 2), th[2] - 0.3, th[0] - (k % 2), own(cols[k]));   // the throws, flat
    const top = own(cols[4]); lb(g, 1, h, 0, w - 2, 0.8, 22, top); lb(g, w / 2 + 0.5, h - 16, 0, 0.8, 16.8, 22, top);   // the top throw over the rim, hanging down the room side
    const cx = (B.x[0] + B.x[1]) / 2, cz = (B.z[0] + B.z[1]) / 2;
    SUGG_G.blanketbasket = movable("sg_blanketbasket", "Blanket basket", g, () => ({ x: cx, z: cz, rot: 0 }), B.w, B.d, [weave], false, { when: () => !!S.sugg.blanketbasket }); }
  // the fallback: the tall lidded seagrass basket (The Cotswold Company), in the same corner
  if (R.BLANKET_COTSWOLD) { const B = R.BLANKET_COTSWOLD, weave = reg(new THREE.MeshStandardMaterial({ color: "#b89a6c", roughness: 1, bumpMap: HESSIAN, bumpScale: 2.2 }));
    SVAR_MATS.cotswoldbasket = [weave];
    const g = new THREE.Group(), body = new THREE.Mesh(new RoundedBoxGeometry(B.w * M, (B.h - 6) * M, B.d * M, 3, 0.03), weave);
    body.position.y = (B.h - 6) / 2 * M; g.add(shadow(body));
    const lid = new THREE.Mesh(new RoundedBoxGeometry((B.w + 1.5) * M, 6 * M, (B.d + 1.5) * M, 3, 0.025), weave); lid.position.y = (B.h - 3) * M; g.add(shadow(lid));
    const knob = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20), weave); knob.position.y = (B.h + 1.5) * M; g.add(knob);
    const throwC = ["#efe7d8", "#a65a38"].map(c => own(c));                                              // the top of the stack, peeking under the lid's edge
    for (let i = 0; i < 2; i++) { const t_ = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.004), throwC[i]); t_.position.set(0, (B.h - 6.6 + i * 0.8) * M, (B.d / 2 + 0.1) * M); g.add(t_); }
    const cx = (B.x[0] + B.x[1]) / 2, cz = (B.z[0] + B.z[1]) / 2;
    SUGG_G.cotswoldbasket = movable("sg_cotswoldbasket", "Lidded seagrass basket (an option)", g, () => ({ x: cx, z: cz, rot: 0 }), B.w, B.d, [weave], false, { when: () => !!S.sugg.cotswoldbasket }); }
  // v38 (the plan): the record table in the coffee table's place: two KALLAX cubes on their backs on a ply base and castors, LPs
  // spine-up in the two bins, an oak lid on a piano hinge along the TV side (+z here; the sofa is -z) that lifts on two stays
  if (R.RECORD_TABLE && R.KALLAX && coffeeG) { const T = R.RECORD_TABLE, K = R.KALLAX, g = SUGG_G.recordtable = new THREE.Group();
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
    g.visible = false; coffeeG.add(g); }
  // the lift-top coffee table, in the coffee table's place (it goes where the coffee table goes); the top lifts and comes towards the sofa
  if (R.LIFT_COFFEE && coffeeG) { const L = R.LIFT_COFFEE, g = SUGG_G.liftcoffee = new THREE.Group(), body = own("#b07d4f"); SVAR_MATS.liftcoffee = [body];
    const dark = own("#2a2724"), w = L.w, d = L.d, legH = 6, top = 2.2, sh = L.h - legH - top;
    for (const [x, z] of [[-w / 2 + 4, -d / 2 + 4], [w / 2 - 4, -d / 2 + 4], [-w / 2 + 4, d / 2 - 4], [w / 2 - 4, d / 2 - 4]]) lb(g, x, 0, z, 4, legH, 4, body);
    lb(g, 0, legH, 0, w, 2, d, body);                                                                    // the shelf under the box
    lb(g, 0, legH + sh - L.inside, 0, w - 4, 1.2, d - 4, dark);                                           // the compartment's floor
    for (const [x, z, ww, dd] of [[0, -d / 2 + 1, w, 2], [0, d / 2 - 1, w, 2], [-w / 2 + 1, 0, 2, d - 4], [w / 2 - 1, 0, 2, d - 4]]) lb(g, x, legH + sh - L.inside - 1, z, ww, L.inside + 1, dd, body);
    for (const [x, y, z, ww, hh, dd, c] of [[-28, 0, -8, 4, 2, 15, "#1f1f21"], [-20, 0, -6, 4, 2, 17, "#1f1f21"], [-6, 0, -9, 15, 5, 10, "#e9e4da"], [14, 0, -10, 6.5, 1.8, 9.2, "#b3262b"], [22, 0, -10, 6.5, 1.8, 9.2, "#2f4e6e"], [30, 0, 6, 9, 3, 13, "#ece8e0"]])
      lb(g, x, legH + sh - L.inside + 1.2 + y, z, ww, hh, dd, own(c));                                  // remotes, a controller, decks of cards
    const tg = new THREE.Group(); g.add(tg); lb(tg, 0, L.h - top, 0, w, top, d, body);
    WORK.ctop = anim(v => { tg.position.set(0, (L.lift - L.h) * v * M, -16 * v * M); });                 // up 5.5 and 16 towards the sofa
    g.visible = false; coffeeG.add(g); }
  // the oak shelf over the hall door, two lidded boxes on it
  if (R.DOOR_SHELF) { const D = R.DOOR_SHELF, K = R.KUGGIS, g = SUGG_G.doorshelf = new THREE.Group(), zf = R.RECESS_Z, box = own("#ece8e0"); SVAR_MATS.doorshelf = [box];
    const oakS = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
    ibox(g, D.x[0], D.y, zf - D.d, D.x[1] - D.x[0], D.t, D.d, oakS);
    for (const x of [D.x[0] + 8, D.x[1] - 10]) ibox(g, x, D.y - 12, zf - 2, 2, 12, 2, oakS);           // two oak brackets' upright legs
    const mid = (D.x[0] + D.x[1]) / 2;
    kuggis(g, mid - K[0] - 3, D.top, zf - K[1] - 0.5, K[0], K[1], K[2], box, false); kuggis(g, mid + 3, D.top, zf - K[1] - 0.5, K[0], K[1], K[2], box, false);
    shell.add(g); }
  // two of the same boxes on your black shelf, either side of the laser, 1 over its front
  if (R.SHELF_BOXES) { const K = R.KUGGIS, sb = R.SHELF_B, g = SUGG_G.shelfboxes = new THREE.Group(), box = own("#ece8e0"); SVAR_MATS.shelfboxes = [box];
    for (const [za, zb] of R.SHELF_BOXES) kuggis(g, W - K[1] - 0.5, sb.top, zb, K[0], K[1], K[2], box, true);
    shell.add(g); }
  buildStorage37(own, mat);                                                                         // v37
  for (const k of ["doorshelf", "shelfboxes", "alcoveshelves", "wallcabs", "wardrobe", "overdoor", "windowseat", "stairdrawers"])   // v39: fewer draws;
    if (SUGG_G[k] && SUGG_G[k].isGroup) mergeStatic(SUGG_G[k]);                                    // the step drawers' moving boxes are nested, so they stay
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
  if (R.STAIR_DRAWERS) { const D = R.STAIR_DRAWERS, g = SUGG_G.stairdrawers = new THREE.Group(), [sx0, sx1] = R.STAIR_X, front = oakOf("#c48c57"), box = oakOf("#d8b48a");
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
    WORK.sdraw = anim(v => moves.forEach((dg, i) => dg.position.z = -(D.depth - 8) * v * M * (1 - i * 0.12)));
    shell.add(g); }
  // two oak floating shelves in the window corner, over the plant stand
  if (R.ALCOVE_SHELVES) { const A = R.ALCOVE_SHELVES, g = SUGG_G.alcoveshelves = new THREE.Group(), wood = oakOf("#c48c57"); SVAR_MATS.alcoveshelves = [wood];
    const r = rnd(57), cols = ["#a65a38", "#2f4e6e", "#d9a441", "#8b9878", "#efe7d8", "#34507f"].map(c => own(c));
    for (const top of A.tops) { ibox(g, A.x[0], top - A.t, WZ, A.w, A.t, A.d, wood);
      let x = A.x[0] + 4;
      if (top === A.tops[0]) { while (x < A.x[0] + 46) { const bw = 2 + r() * 2.5, bh = 18 + r() * 6; ibox(g, x, top, WZ + 3, bw, bh, 15 + r() * 3, cols[Math.floor(r() * cols.length)]); x += bw + 0.2; } }
      potPlant(g, A.x[1] - 18, top, WZ + 11, 6.5, top === A.tops[0] ? 6 : 9, top === A.tops[0] ? 3 : 0, r, own(top === A.tops[0] ? "#c46c45" : "#e9e4da"), null, { edgeZ: WZ + A.d });   // v40
      if (top === A.tops[1]) { const vase = new THREE.Mesh(new THREE.CylinderGeometry(4 * M, 3 * M, 16 * M, 16), own("#2f4e6e")); vase.position.copy(v3(A.x[0] + 22, top + 8, WZ + 10)); g.add(shadow(vase)); } }
    shell.add(g); }
  // the storage window seat: an oak box with a lift-up lid, a seat cushion, two back cushions against the window wall
  if (R.WINDOW_SEAT) { const S_ = R.WINDOW_SEAT, g = SUGG_G.windowseat = new THREE.Group(), wood = oakOf("#c48c57"), cush = cloth("#d9a441"); SVAR_MATS.windowseat = [cush];
    const [xa, xb] = S_.x, w = xb - xa;
    ibox(g, xa + 1.5, 0, WZ + 1.5, w - 3, 6, S_.d - 3.5, own("#3a2e24"));                                     // a recessed plinth
    ibox(g, xa, 6, WZ, w, S_.box_h - 6, S_.d, wood);                                                          // the box
    ibox(g, xa + 0.5, S_.box_h - 1.8, WZ + 0.5, w - 1, 1.8, S_.d - 0.5, oakOf("#b5845a"));                    // the lid, its line
    const seat = new THREE.Mesh(new RoundedBoxGeometry((w - 2) * M, S_.cushion * M, (S_.d - 2) * M, 3, 0.02), cush); seat.position.copy(v3((xa + xb) / 2, S_.box_h + S_.cushion / 2, WZ + S_.d / 2)); g.add(shadow(seat));
    for (const xc of [xa + w * 0.27, xa + w * 0.73]) { const bc = new THREE.Mesh(new RoundedBoxGeometry(S_.back_cush[0] * M, 38 * M, S_.back_cush[1] * M, 3, 0.04), cloth("#e9e1cf"));
      bc.position.copy(v3(xc, S_.h + 18, WZ + S_.back_cush[1] / 2 + 1)); bc.rotation.x = 0.12; g.add(shadow(bc)); }
    shell.add(g); }
  // the bench with cubbies: ten open cubbies (shoes, a basket) under a padded seat; free-standing, so it moves in Edit room
  if (R.HALL_BENCH) { const H = R.HALL_BENCH, body = own("#b07d4f"), pad = cloth("#8f8a80"); SVAR_MATS.hallbench = [body];
    const g = new THREE.Group(), [nx, ny] = H.cubbies, t = 1.5, ch = (H.h - H.pad - 4 - (ny + 1) * t) / ny, cw = (H.w - (nx + 1) * t) / nx;
    lb(g, 0, 0, 0, H.w - 2, 4, H.d - 2, own("#2a2724"));                                                     // the plinth
    lb(g, 0, 4, -H.d / 2 + 0.4, H.w, H.h - H.pad - 4, 0.8, body);                                            // the back
    for (let j = 0; j <= ny; j++) lb(g, 0, 4 + j * (ch + t), 0, H.w, t, H.d, body);                          // the shelves
    for (let i = 0; i <= nx; i++) lb(g, -H.w / 2 + t / 2 + i * (cw + t), 4, 0, t, H.h - H.pad - 4, H.d, body);   // the dividers
    const p_ = new THREE.Mesh(new RoundedBoxGeometry(H.w * M, H.pad * M, H.d * M, 3, 0.015), pad); p_.position.y = (H.h - H.pad / 2) * M; g.add(shadow(p_));
    const shoeC = ["#2a2a2c", "#efe7d8", "#7a4a2a", "#34507f", "#a65a38", "#2a2a2c", "#d9a441"].map(c => own(c)), r = rnd(61);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { if (r() < 0.25) continue; const cx = -H.w / 2 + t + cw * (i + 0.5) + i * t, y = 4 + t + j * (ch + t);
      if (i === 2 && j === 1) { lb(g, cx, y, 0, cw - 2, ch - 2, H.d - 6, cloth("#b89a6c")); continue; }      // a basket
      const m_ = shoeC[Math.floor(r() * shoeC.length)]; for (const dx of [-4.5, 4.5]) lb(g, cx + dx, y, 2, 7.5, 7, 22, m_); }   // a pair of shoes
    const cx = (H.x[0] + H.x[1]) / 2, cz = WZ + H.d / 2 + 0.5;
    SUGG_G.hallbench = movable("sg_hallbench", "Bench with cubbies (suggested)", g, () => ({ x: cx, z: cz, rot: 0 }), H.w, H.d, [body], false, { when: () => !!S.sugg.hallbench }); }
  // the built-in cupboard: floor to ceiling, hanging depth, two hinged doors, a plinth, a scribed filler to the ceiling
  if (R.WARDROBE) { const D = R.WARDROBE, g = SUGG_G.wardrobe = new THREE.Group(), doors = oakOf("#c48c57"), carc = oakOf("#b5845a"); SVAR_MATS.wardrobe = [doors];
    const [xa, xb] = D.x, w = xb - xa, zf = WZ + D.d;
    ibox(g, xa, 0, WZ, D.t, D.h, D.d, carc); ibox(g, xb - D.t, 0, WZ, D.t, D.h, D.d, carc);                  // the ends
    ibox(g, xa + D.t, 0, zf - D.door - 4, w - 2 * D.t, D.plinth, 2, own("#3a2e24"));                          // the plinth
    const gap = 0.3, dw = (w - 3 * gap) / 2, dh = D.h - D.plinth - 1.5;
    for (let i = 0; i < 2; i++) { const x = xa + gap + i * (dw + gap); ibox(g, x, D.plinth + 0.5, zf - D.door, dw, dh, D.door, doors);
      ibox(g, x + (i ? 3 : dw - 4.2), 90, zf - 0.2, 1.2, 40, 1.4, own("#2a2724")); }                         // two long bar handles
    shell.add(g); }
  // two EKET wall cabinets with glass doors over the sofa's corner, on the side wall
  if (R.WALL_CABS) { const C = R.WALL_CABS, [ew, ed, eh] = R.EKET, g = SUGG_G.wallcabs = new THREE.Group(), body = own("#6e4a2e"); SVAR_MATS.wallcabs = [body];
    const glass = reg(new THREE.MeshPhysicalMaterial({ color: "#dfeef0", roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false })), r = rnd(67);
    for (let i = 0; i < C.n; i++) { const z0 = C.z[0] - (i + 1) * ew;
      ibox(g, 0, C.y0, z0, ed, 1.5, ew, body); ibox(g, 0, C.y0 + eh - 1.5, z0, ed, 1.5, ew, body);
      ibox(g, 0, C.y0, z0, ed, eh, 1.5, body); ibox(g, 0, C.y0, z0 + ew - 1.5, ed, eh, 1.5, body);
      for (let k = 0; k < 4; k++) ibox(g, 4, C.y0 + 1.5, z0 + 3 + k * 7, 14 + r() * 8, 8 + r() * 14, 5, own(["#efe7d8", "#2f4e6e", "#a65a38", "#d9a441"][(k + i) % 4]));
      const gd = new THREE.Mesh(new THREE.PlaneGeometry((ew - 3) * M, (eh - 3) * M), glass); gd.rotation.y = -Math.PI / 2; gd.position.copy(v3(ed - 0.4, C.y0 + eh / 2, z0 + ew / 2)); g.add(gd); }
    shell.add(g); }
  // the six-hook rail over the hall door's top, on its room side, with a bag and a scarf
  if (R.OVERDOOR) { const O = R.OVERDOOR, g = SUGG_G.overdoor = new THREE.Group(), metal = reg(new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.35, metalness: 0.6 })); SVAR_MATS.overdoor = [metal];
    const zf = R.RECESS_Z - 0.6, cx = (R.DOOR_X[0] + R.DOOR_X[1]) / 2, x0 = cx - O.w / 2, top = R.DOOR_H;
    ibox(g, x0, top - O.h, zf - 1.2, O.w, 2.5, 0.6, metal);                                                    // the bar on the door's face
    ibox(g, x0 + 3, top - 1, zf - 1.2, 2.5, 1, O.door_t + 1.8, metal); ibox(g, x0 + O.w - 5.5, top - 1, zf - 1.2, 2.5, 1, O.door_t + 1.8, metal);   // the hooks over the top
    for (let i = 0; i < O.hooks; i++) ibox(g, x0 + 3 + i * (O.w - 6) / (O.hooks - 1) - 0.5, top - O.h - 4, zf - 4, 1, 4, 3, metal);
    ibox(g, x0 + 6, top - O.h - 42, zf - 7, 26, 36, 5, cloth("#b89a6c"));                                      // a canvas tote
    ibox(g, x0 + 35, top - O.h - 58, zf - 3.2, 9, 56, 1.4, cloth("#a65a38"));                                   // a scarf
    shell.add(g); }
  // v43, client: "suggest improvements and more item options": motors on the curtain pole, LP ledges on the side wall (options)
  { const CU = R.CURTAIN, g = SUGG_G.curtainmotor = new THREE.Group(), body = own("#efefec"), [wx0, wx1] = R.WINDOW_X; SVAR_MATS.curtainmotor = [body];
    for (const x of [wx0 - CU.ext + CU.stack, wx1 + CU.ext - CU.stack]) ibox(g, x - 3.65, CU.rail_y - 17.5, CU.z - 1, 7.3, 20.5, 8.4, body);   // SwitchBot Curtain 3, at each curtain's leading edge
    shell.add(g); }
  /* v78, the client: "we're thinking of fitting a curtain there at the bottom of the steps attached to the overhang ceiling" (an option,
     geometry.STAIR_CURTAIN): a white ceiling-fix track on the bulkhead's underside over the bottom step, one thermal pencil-pleat panel
     drawn across, gathered (168 on a 67 track), 4 off the floor */
  if (R.STAIR_CURTAIN) { const SC = R.STAIR_CURTAIN, g = SUGG_G.stairscurtain = new THREE.Group(), C = R.CEIL, [x0, x1] = SC.x, w = x1 - x0;
    const cl = own("#cbb994"); cl.side = THREE.DoubleSide; cl.roughness = 0.95; cl.bumpMap = HESSIAN; cl.bumpScale = 0.5; SVAR_MATS.stairscurtain = [cl];
    const tm = reg(new THREE.MeshStandardMaterial({ color: "#f1f0ec", roughness: 0.4, metalness: 0.2 })), top = C - SC.track_h;
    const panel = (len, at, ry) => { const folds = Math.round(len / 9.5), geo = new THREE.PlaneGeometry(len * M, SC.drop * M, folds * 8, 1), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) / (len * M) * Math.PI * 2 * folds) * 3.2 * M);   // pleats about 9.5 apart, 3.2 deep
      geo.computeVertexNormals(); const pm = new THREE.Mesh(geo, cl); pm.position.copy(at); pm.rotation.y = ry; g.add(shadow(pm)); };
    ibox(g, x0, C - 0.7, SC.z - SC.track_w, w, 0.7, SC.track_w, tm);                      // across the foot, on the bulkhead's underside
    panel(w, v3((x0 + x1) / 2, top - SC.drop / 2, SC.z - SC.track_w / 2), 0);
    if (SC.side) { const [s0, s1] = SC.side;                                              // v81: and along the open side, to the door's wall
      ibox(g, x0, C - 0.7, s0, SC.track_w, 0.7, s1 - s0, tm);
      panel(s1 - s0, v3(x0 + SC.track_w / 2, top - SC.drop / 2, (s0 + s1) / 2), Math.PI / 2); }
    shell.add(g); }
  { const g = SUGG_G.lpledges = new THREE.Group(), wood = own("#c48c57"), y = 108; SVAR_MATS.lpledges = [wood];
    const covers = ["#d94f2b", "#2f4e6e", "#e9c46a", "#1b1c1f"].map(c => own(c));
    [-171, -251].forEach((zc, j) => { const z0 = zc - 27.5;                                                   // under the PC shelf, under the wall cabinets
      ibox(g, 0, y - 2, z0, 12, 2, 55, wood); ibox(g, 10.5, y, z0, 1.5, 3.5, 55, wood);                       // MOSSLANDA: the shelf and its lip
      ibox(g, 1.2, y, z0 + 0.5, 0.4, 31.4, 31.4, covers[j * 2]); ibox(g, 1.8, y, z0 + 23, 0.4, 31.4, 31.4, covers[j * 2 + 1]); });   // two covers, face-out
    shell.add(g); }
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
  { const g = IDEA_G.glass = new THREE.Group(), GL = I.glass, [wx0, wx1] = GL.x, FZ = R.WINDOW_Z - R.WINDOW_REVEAL, wz = R.WINDOW_Z, mid = (wx0 + wx1) / 2;
    for (const y of GL.ys) {
      ibox(g, wx0, y - GL.t, wz - GL.d, wx1 - wx0, GL.t, GL.d - 0.5, glassM, false);
      for (const x of [wx0 + 0.5, wx1 - 1.5]) ibox(g, x, y - GL.t - 0.8, wz - GL.d / 2 - 1, 1, 0.8, 2, steel, false);
      [0.12, 0.3, 0.52, 0.7, 0.88].forEach((t, i) => plant(g, wx0 + 8 + t * (wx1 - wx0 - 16), y, wz - GL.d / 2, 4 + (i % 2) * 1.5, i % 2 ? 3 : 1));
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, (R.WINDOW_Y[1] - GL.ys[0] + GL.t) * M, 8), steel);
    rod.position.copy(v3(mid, (R.WINDOW_Y[1] + GL.ys[0] - GL.t) / 2, wz - GL.d + 1.5)); g.add(rod);
    shell.add(g); }
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
  { const g = IDEA_G.sync = new THREE.Group(), [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y, cx = (tx0 + tx1) / 2, cy = (ty0 + ty1) / 2;
    const tex = canvasTex(640, 400, (c, w, h) => {
      c.globalCompositeOperation = "lighter";
      for (const [x, y, col] of [[0.18, 0.5, "40,215,196"], [0.82, 0.5, "255,138,61"], [0.35, 0.16, "217,77,255"], [0.68, 0.16, "255,196,80"], [0.5, 0.86, "60,110,255"]]) {
        const gr = c.createRadialGradient(x * w, y * h, 10, x * w, y * h, w * 0.32);
        gr.addColorStop(0, `rgba(${col},0.95)`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      } });
    const glowM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry((tx1 - tx0 + 56) * M, (ty1 - ty0 + 40) * M), glowM); pl.position.copy(v3(cx, cy, R.ALC_D - 0.3)); pl.rotation.y = Math.PI; g.add(pl);
    for (const [x, col] of [[tx0 + 6, "#2fd8c4"], [tx1 - 6, "#ff8a3d"]]) { const l = new THREE.PointLight(col, 1.4, 1.5, 2); l.position.copy(v3(x, cy, R.TV_Z + 3)); g.add(l); }
    shell.add(g); }
  // 5. a smart scene button by the door: on the breast's side, at switch height
  { const g = IDEA_G.button = new THREE.Group(), xb = R.BREAST_X[1], zc = R.RECESS_Z - 9;
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.1 * M, 5.6 * M, 5.6 * M, 2, 0.006), reg(new THREE.MeshStandardMaterial({ color: "#f4f2ed", roughness: 0.4 })));
    body.position.copy(v3(xb + 0.55, 120, zc)); g.add(shadow(body));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 * M, 0.12 * M, 8, 28), reg(new THREE.MeshStandardMaterial({ color: "#c9c5bd", roughness: 0.5 })));
    ring.position.copy(v3(xb + 1.15, 120, zc)); ring.rotation.y = Math.PI / 2; g.add(ring);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.25 * M, 12), new THREE.MeshBasicMaterial({ color: "#7fd1ff", toneMapped: false }));
    dot.position.copy(v3(xb + 1.16, 122.2, zc)); dot.rotation.y = -Math.PI / 2; g.add(dot);
    shell.add(g); }
  // 6. motion nightlights on the stairs: a warm strip under each tread's nose, lighting the riser below it
  { const g = IDEA_G.night = new THREE.Group(), [sx0, sx1] = R.STAIR_X, front = R.STAIR_FRONT;
    const stripM = new THREE.MeshBasicMaterial({ color: "#ffcf8a", toneMapped: false });
    const wash = canvasTex(8, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,200,130,0.85)"); gr.addColorStop(1, "rgba(255,200,130,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const washM = new THREE.MeshBasicMaterial({ map: wash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (let i = 0; i < 11; i++) {
      const yb = R.STAIR_RISE * (i + 1) - 2.2, zn = front + 4.5 + R.STAIR_GOING * i;   // the tread board's underside (2.2 thick), its nose
      const st = new THREE.Mesh(new THREE.BoxGeometry((sx1 - sx0 - 6) * M, 0.003, 0.012), stripM); st.position.copy(v3((sx0 + sx1) / 2, yb - 0.2, zn + 0.9)); g.add(st);
      const w_ = new THREE.Mesh(new THREE.PlaneGeometry((sx1 - sx0 - 4) * M, 14 * M), washM); w_.position.copy(v3((sx0 + sx1) / 2, yb - 7.2, zn + 1.45)); w_.rotation.y = Math.PI; g.add(w_);
    }
    const l = new THREE.PointLight("#ffcf8a", 0.7, 1.2, 2); l.userData.accent = 0.7; l.position.copy(v3((sx0 + sx1) / 2, 14, front - 6)); g.add(l);
    shell.add(g); }
  // 7. the rug's non-slip pad: the corner by the door turned back to show it (the pad trimmed 2.5 inside the rug's edge)
  if (MOV.rug) { const g = IDEA_G.rugpad = new THREE.Group(), RG = R.RUG, hx = (RG.x[1] - RG.x[0]) / 2, hz = (RG.z[1] - RG.z[0]) / 2, L = 46;
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
    fold.position.set(-(hx - L / 2) * M, 0.0125, (hz - L / 2) * M); fold.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, -1).normalize()); g.add(fold);
    MOV.rug.pivot.children[0].add(g); }
  Object.values(IDEA_G).forEach(gr => gr.visible = false);
}
let garden3d = null;   // v53: the back garden as ground, in the views from above
let HBUILD = null;     // V1: builds (or rebuilds, with edits) one floor of the house
/* V1 (Demma's Home): the room as a component of the app. ?embed hides every control of this page (the app has its own); the app drives it
   with messages (EMB below) and hears back what was tapped */
const EMBED = /[?&]embed\b/.test(location.search);
let EMBH = null;       // V1: the app's bridge (set at the end of this file when ?embed)
const HEDITS = {};     // V1 (Phase 3): the client's edits, {item id: {from: box, to: box, op?: the opening's old and new edges}}
const mapAx = (v, f0, f1, t0, t1) => (f1 - f0 < 0.01 ? v + (t0 - f0) : t0 + (v - f0) * (t1 - t0) / (f1 - f0));
function editXf(E) {   // one edited piece's boxes: a door or window keeps its frames' widths (piecewise along its wall), the rest scale
  const op = E.op;
  if (E.removed) return () => null;                                         // taken out (Remove): its boxes aren't drawn
  return b => {
    const out = b.slice();
    for (let k = 0; k < 3; k++) {
      let f0 = E.from[k], f1 = E.from[k + 3], t0 = E.to[k], t1 = E.to[k + 3];
      if (op && ((k === 0 && op.axis === "x") || (k === 2 && op.axis === "z"))) { f0 = op.a; f1 = op.b; t0 = op.a2; t1 = op.b2; }
      else if (op && k === 1) { f0 = op.y0; f1 = op.y1; t0 = op.y02; t1 = op.y12; }
      const m = v => (op && v <= f0 + 0.01) ? v + (t0 - f0) : (op && v >= f1 - 0.01) ? v + (t1 - f1) : mapAx(v, f0, f1, t0, t1);
      out[k] = m(b[k]); out[k + 3] = m(b[k + 3]);
    }
    return out.map(v => Math.round(v * 10) / 10);
  };
}
function followOps(b, ops) {   // a wall's pieces round an opening: their edges at the opening's old edges go to its new ones
  let out = null;
  for (const op of ops) {
    const k = op.axis === "x" ? 0 : 2, c = op.axis === "x" ? 2 : 0;
    if (b[c + 3] < op.line - 16 || b[c] > op.line + 16) continue;
    if (b[4] < op.y0 - 30 || b[1] > op.y1 + 400) continue;
    const o = out || (out = b.slice());
    if (Math.abs(o[k + 3] - op.a) < 0.25) o[k + 3] = op.a2;
    if (Math.abs(o[k] - op.a) < 0.25) o[k] = op.a2;
    if (Math.abs(o[k] - op.b) < 0.25) o[k] = op.b2;
    if (Math.abs(o[k + 3] - op.b) < 0.25) o[k + 3] = op.b2;
    if (o[k] > op.a - 0.25 && o[k + 3] < op.b + 0.25 || (o[k] >= op.a2 - 0.25 && o[k + 3] <= op.b2 + 0.25)) {   // over or under the opening
      if (Math.abs(o[1] - op.y1) < 0.25) o[1] = op.y12;
      if (Math.abs(o[4] - op.y0) < 0.25) o[4] = op.y02;
    }
  }
  return out || b;
}
function editedFloor(fk, F) {
  const tags = F.tags || [], ids = Object.keys(HEDITS).filter(id => tags.includes(id));
  if (!ids.length) return F;
  const xf = {}; ids.forEach(id => { xf[tags.indexOf(id)] = editXf(HEDITS[id]); });
  const ops = ids.map(id => HEDITS[id].op).filter(Boolean);
  const mapList = (list, bt) => { const ob = [], ot = [];                    // the boxes and their tags, kept side by side
    list.forEach((b, i) => { const t = bt ? bt[i] : -1, nb = xf[t] ? xf[t](b) : ops.length ? followOps(b, ops) : b; if (nb) { ob.push(nb); ot.push(t); } });
    return [ob, ot]; };
  const boxes = {}, bt = {};
  for (const [m, list] of Object.entries(F.boxes)) [boxes[m], bt[m]] = mapList(list, (F.bt || {})[m]);
  const lathes = (F.lathes || []).filter(L => !(xf[L.t] && HEDITS[tags[L.t]].removed)).map(L => { const f = xf[L.t]; if (!f) return L; const E = HEDITS[tags[L.t]];
    const sx = (E.to[3] - E.to[0]) / Math.max(0.1, E.from[3] - E.from[0]), sz = (E.to[5] - E.to[2]) / Math.max(0.1, E.from[5] - E.from[2]);
    const c = f([L.c[0], L.c[1], L.c[2], L.c[0], L.c[1], L.c[2]]); return Object.assign({}, L, { c: [c[0], c[1], c[2]], s: [L.s[0] * sx, L.s[1] * sz] }); });
  const prisms = (F.prisms || []).filter(P => !(xf[P.t] && HEDITS[tags[P.t]].removed)).map(P => { const f = xf[P.t]; if (!f) return P;
    const pts = P.pts.map(([u, w]) => { const q = P.axis === "x" ? f([0, w, u, 0, w, u]) : f([u, w, 0, u, w, 0]); return P.axis === "x" ? [q[2], q[1]] : [q[0], q[1]]; });
    const ab = P.axis === "x" ? f([P.a, 0, 0, P.b, 0, 0]) : f([0, 0, P.a, 0, 0, P.b]); return Object.assign({}, P, { pts, a: P.axis === "x" ? ab[0] : ab[2], b: P.axis === "x" ? ab[3] : ab[5] }); });
  const parts = {}; for (const [k, P] of Object.entries(F.parts || {})) { const pb = {}, pt = {}; for (const [m, list] of Object.entries(P.boxes)) [pb[m], pt[m]] = mapList(list, (P.bt || {})[m]); parts[k] = Object.assign({}, P, { boxes: pb, bt: pt }); }
  return Object.assign({}, F, { boxes, bt, lathes, prisms, parts });
}
let houseG = null;     // v54: the whole house, drafted (The whole house view)
const HOUSEV = n => n === "house" || (!!R.HOUSE3 && !!(VIEWS[n] || {}).box);   // v60: the views that show the built house (a room's own, from inside it)
const ROOMV = () => R.HOUSE3 && (VIEWS[S.view] || {}).box;                       // v61: in one of the house's rooms: its walls keep the eye in
/* v78b, the client: "add the viewing buttons to the living room also, it doesnt have the in it, above, on its own buttons like all other
   rooms": the living room is drawn on its own (not in the house), so its three are its own views: from the window, the whole room from
   above, and the room from the hall's corner with its ceiling off */
const LIV_RMODE = { in: "window", above: "room", alone: "livalone" };
const LIVV = () => !HOUSEV(S.view) && !!VIEWS[S.view];
function syncRmode() {
  const rm = qs("#r3d-rmode"); if (!rm) return;
  const liv = LIVV(), cur = liv ? (S.view === "room" ? "above" : S.view === "livalone" ? "alone" : "in") : RMODE;
  rm.hidden = !(ROOMV() || liv); qsa("[data-rmode]", rm).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.rmode === cur)));
}
const HFLOOR = {};     // v55: its floors (lower, ground, first) and the outside (gardens, the alley), for the floor picker
let hfloor = "all", hidReal = [], hidLay = [], hfview = "angle";   // v74: a floor seen from an angle or from straight above
const ROOMLIGHTS = [];   // v69 (B3): two warm ceiling lights that go to the room you're in (a fixed set: no shader rebuilds)
let roomKey = "";
/* v69, the client: "increasing the render quality to be more realistic like our living room version": in a room of the house, its
   ceiling lights on (the nearest two to the view), and the sun's shadow box moved over that room (it covered the living room only) */
function placeRoomLights() {
  if (!ROOMLIGHTS.length || !sun) return;
  const v = VIEWS[S.view] || {}, b = R.HOUSE3 && v.box, list = [];
  if (b) { const cx = (b[0] + b[1]) / 2, cz = (b[4] + b[5]) / 2;
    for (const F of Object.values(R.HOUSE3.floors)) for (const L of F.lights || [])
      if (L.x >= b[0] - 30 && L.x <= b[1] + 30 && L.z >= b[4] - 30 && L.z <= b[5] + 30 && L.y > b[2] && L.y < b[3] + 60) list.push(L);
    list.sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz)); }
  const day = S.tod === "day";
  const rr = b && R.HOUSE3.rooms && R.HOUSE3.rooms[VIEW_ROOM[S.view]], area = rr ? (rr[1] - rr[0]) * (rr[3] - rr[2]) / 1e4 : 10;
  const ks = Math.min(1.3, Math.max(0.75, Math.sqrt(area / 10)));   // v72 (B2): a big room's light reaches its corners, a small one doesn't glare
  ROOMLIGHTS.forEach((l, k) => { const L = list[k]; l.visible = !!L; if (L) { l.position.copy(v3(L.x, L.y - 40, L.z)); l.intensity = (day ? 1.2 : 3.2) * ks; } });
  const key = b ? b.join() : "";
  if (key === roomKey) return; roomKey = key;
  const d = b ? v3((b[0] + b[1]) / 2, 0, (b[4] + b[5]) / 2).sub(sun.userData.t0).setY(0) : new THREE.Vector3();
  sun.position.copy(sun.userData.p0).add(d); sun.target.position.copy(sun.userData.t0).add(d); sun.target.updateMatrixWorld();
  reshadow();
}
/* v69 (B3) had each room's own reflections caught when you entered it (a cube camera round the whole scene, then every house material
   recompiled). v73, the client: "consistent crashing on PC when accessing rooms": that froze the page for seconds each time (and leaked
   a texture a visit), long enough for a PC's graphics driver to give up; phones never ran it. Now one neutral room reflection, made once,
   is on the house's materials from the start (no recompiles), each surface reflecting by its finish */
let HMATS = null, HENV = null;
function houseEnv() {
  if (!HENV) { const pm = new THREE.PMREMGenerator(gl), rs = new RoomEnvironment(); HENV = pm.fromScene(rs, 0.04).texture; pm.dispose(); rs.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  return HENV;
}
const finishEnv = m => m.userData.hk === "glass" ? 0.3 : m.roughness <= 0.3 ? 0.9 : m.roughness <= 0.6 ? 0.6 : 0.45;   // v72 (B3): gloss, satin, matt
let RMODE = "in", hidMode = [], RPLANES = [];   // v71: how a room of the house is seen (in it, above, on its own) and what that put away
const HPARTS = {};     // v68: the house's moving pieces (the master bedroom's ottoman lid), each its own group on its hinge
/* v55: the floor picker. All lifts the floors apart (the first floor up, the lower ground floor down) so each one shows; First, Ground and
   Lower show the house up to that floor, the ones above taken off (Lower takes the living room itself off too); only the top floor's
   labels show, or every floor's in All */
function applyFloors() {
  if (!houseG) return;
  const on = S.view === "house", sel = on ? hfloor : "all", ex = sel === "all" && !R.HOUSE3 ? 330 : 0;   // v58: Outside, the house closed (no lifting)
  if (HFLOOR.roof) HFLOOR.roof.visible = sel === "all";
  if (HFLOOR.first) { HFLOOR.first.position.y = ex * M; HFLOOR.first.visible = sel === "all" || sel === "first"; }
  if (HFLOOR.lower) HFLOOR.lower.position.y = -ex * M;
  if (HFLOOR.ground) HFLOOR.ground.visible = sel !== "lower";
  const top = sel === "all" ? null : sel;
  for (const k of ["lower", "ground", "first", "out"]) if (HFLOOR[k]) HFLOOR[k].traverse(o => { if (o.userData.hlabel) o.visible = labelsOn && (k === "out" ? on : (top ? top === k : !R.HOUSE3)); });   // v57: Hide labels hides these too
  if (rmodeG) rmodeG.traverse(o => { if (o.userData.rlabel) o.visible = labelsOn; });   // v72 (B5): the room's name in Above
  hidReal.forEach(o => o.visible = true); hidReal = []; hidLay.forEach(o => o.layers.enable(0)); hidLay = [];
  if (on && sel === "lower") scene.children.forEach(o => { if (o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o.visible) { o.visible = false; hidReal.push(o); } });
  qsa("[data-hfloor]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfloor === hfloor)));
  const fl = qs("#r3d-floors"); if (fl) fl.hidden = !on;
  // v64, client: "make sure I can take this off when needed so I can look at just my own house" and "whole house plus gardens": in
  // The whole house the gardens (both, the alley, the street in front) and next door only when switched on; inside a room, the gardens
  // show through its windows
  const showG = !on || !!S.hgarden;
  if (HFLOOR.out) HFLOOR.out.visible = showG;
  if (garden3d && houseG.visible) garden3d.visible = showG;
  if (HFLOOR.street) HFLOOR.street.visible = !!S.hstreet;
  qsa("[data-htog]").forEach(b => b.setAttribute("aria-pressed", String(!!S[b.dataset.htog])));
  const fv = qs("#r3d-fview"); if (fv) { fv.hidden = !on; qsa("[data-hfview]", fv).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hfview === hfview))); }   // v74
  const pk = qs("#r3d-pick"), mini = qs(".r3d-mini"); if (pk && mini) { const off = on && mini.classList.contains("pickoff"); if (!on) mini.classList.remove("pickoff");
    pk.setAttribute("aria-pressed", String(off)); pk.querySelector(".ms").textContent = off ? "unfold_more" : "unfold_less"; pk.querySelector(".t").textContent = off ? "Show buttons" : "Hide buttons"; }
  syncRmode();   // v71
  /* v73, the client: "still extremely slow": standing in a room, only what can be seen from it is drawn: its own floor, the group with
     its ceiling (the lower floor's are in the ground floor's, the first floor's in the roof's), the floor its stairs lead to (the landing,
     the hall), the outside through its windows; the living room only from the landing (v81: down the stairwell) */
  if (ROOMV() && RMODE === "in" && R.HOUSE3.rooms) {
    const rid = VIEW_ROOM[S.view], rr = R.HOUSE3.rooms[rid];
    if (rr) {
      const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(rr[4])];
      const see = new Set(["out", "street", fk, { lower: "ground", ground: "first", first: "roof" }[fk]]);
      if (rid === "landing") see.add("ground");
      if (rid === "hall") see.add("lower");
      for (const [k, g] of Object.entries(HFLOOR)) if (!see.has(k) && g.visible) { g.visible = false; hidReal.push(g); }
      // v81: the hall and the garage don't see it either (its door is shut; the hall has the door's own face): 600 draws there, now 160
      const lr = o => o !== houseG && o !== garden3d && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o !== view && o.visible;
      if (rid !== "landing") scene.children.forEach(o => { if (lr(o)) { o.visible = false; hidReal.push(o); } });
      else {   // v81: from the landing (its eye at x 402 or less) the living room shows only down the stairwell (from 408): each piece clear of
        // the flight's side is left out of the camera's layer (not hidden, so a switch on or off meanwhile still holds): 556 draws, now about 250
        const lim = -(R.STAIR_X[0] - 3) * M, bb = new THREE.Box3(); scene.updateMatrixWorld();
        scene.children.forEach(o => { if (lr(o)) o.traverse(m => { if ((m.isMesh || m.isPoints || m.isLine) && !m.isInstancedMesh && m.layers.isEnabled(0)) {
          const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
          if (bb.copy(g.boundingBox).applyMatrix4(m.matrixWorld).min.x > lim) { m.layers.disable(0); hidLay.push(m); } } }); }); }
    }
  }
  drawRooms(); brandPlace(); outdoor();
  dirty();
}
/* V1.2: the brand's second line says where you are: the whole house, a floor, a room */
function brandPlace() {
  const el = document.getElementById("brand-place"); if (!el) return;
  let t = "The living room";
  if (S.view === "house") t = { first: "The first floor", ground: "The ground floor", lower: "The lower floor" }[hfloor] || "The whole house";
  else if (ROOMV()) { const id = VIEW_ROOM[S.view], L = id && id !== "living" && Object.values(R.HOUSE3.floors).flatMap(F => F.labels || []).find(l => l.id === id); t = (L && L.name) || (VIEWS[S.view] || {}).label || t; }
  el.textContent = t;
}
/* v64, client: "by floor individually where you can choose to pick a room to focus on": on a floor, its rooms as buttons; a room with
   its own view goes into it, the others are looked at from above */
const ROOM_VIEW = { living: "room", kitchen: "kitchen", bed3: "office", bed2: "bed2", master: "master", bathroom: "bath",
  landing: "landing", hall: "hall", garage: "garage", wc: "wc" };   // v66: every room a person stands in has its own view
/* v74, the client: "let me view overhead and the default view for each floor as a whole too": a floor picked (or the whole house),
   Angled looks at it from the house view's direction, Overhead from straight above, each far enough to take in all its rooms */
function floorCam() {
  if (S.view !== "house" || !R.HOUSE3) return;
  if (hfloor === "all" && hfview === "angle") { setView("house"); return; }
  const fy = { first: 260, ground: 0, lower: -260 }[hfloor] ?? 0;
  // v80: the living room too (it's drawn on its own, not in the house's rooms): the ground floor's Overhead left it out of the picture
  const rs = [...Object.values(R.HOUSE3.rooms || {}), [0, R.W, R.WINDOW_Z, R.RECESS_Z, 0]].filter(r => hfloor === "all" || r[4] === fy);
  if (!rs.length) return;
  const x0 = Math.min(...rs.map(r => r[0])), x1 = Math.max(...rs.map(r => r[1])), z0 = Math.min(...rs.map(r => r[2])), z1 = Math.max(...rs.map(r => r[3]));
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, y = hfloor === "all" ? 540 : fy;
  const fit = (fov, sx, sy) => { const v = fov * Math.PI / 360, h = Math.atan(Math.tan(v) * camera.aspect); return 1.1 * Math.max(sx / 2 / Math.tan(h), sy / 2 / Math.tan(v)); };
  if (hfview === "top") { flyTo([cx, y + 60 + fit(45, w, d), cz + 1], [cx, y, cz], 45, true); return; }
  const H = VIEWS.house, dir = new THREE.Vector3(H.eye[0] - H.at[0], H.eye[1] - H.at[1], H.eye[2] - H.at[2]).normalize();
  const r = 0.5 * Math.hypot(w, d, 235), v = 25 * Math.PI / 180, hh = Math.atan(Math.tan(v) * camera.aspect), D = (camera.aspect < 1 ? 0.62 : 0.9) * r / Math.sin(Math.min(v, hh));   // the floors below show under it too
  flyTo([cx + dir.x * D, y + dir.y * D, cz + dir.z * D], [cx, y + 40, cz], 50, true);
}
function drawRooms() {
  const box = qs("#r3d-hrooms"); if (!box) return;
  const on = S.view === "house" && hfloor !== "all" && !!R.HOUSE3;
  box.hidden = !on; if (!on) return;
  const list = ((R.HOUSE3.floors[hfloor] || {}).labels || []).slice();
  if (hfloor === "ground") list.unshift({ id: "living", name: "Living room" });
  const key = hfloor + list.length;
  if (box.dataset.k === key) return;
  box.dataset.k = key;
  box.innerHTML = list.map(L => `<button type="button" data-hroom="${L.id}">${L.name}</button>`).join("");
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-hfloor]"); if (b) { hfloor = b.dataset.hfloor; applyFloors(); floorCam(); return; }
  const fvb = e.target.closest("[data-hfview]"); if (fvb) { hfview = fvb.dataset.hfview; applyFloors(); floorCam(); return; }   // v74
  if (e.target.closest("#r3d-pick")) { qs(".r3d-mini")?.classList.toggle("pickoff"); applyFloors(); return; }
  const tg = e.target.closest("[data-htog]"); if (tg) { S[tg.dataset.htog] = !S[tg.dataset.htog]; store.set(KEY, S); applyFloors(); return; }
  const r = e.target.closest("[data-hroom]"); if (!r || !R.HOUSE3) return;
  const id = r.dataset.hroom, v = ROOM_VIEW[id];
  if (v) { setView(v); return; }
  const L = ((R.HOUSE3.floors[hfloor] || {}).labels || []).find(l => l.id === id); if (!L) return;
  flyTo([L.x + 30, L.y + 520, L.z + 280], [L.x, L.y - 150, L.z], 50, true);
});
let winGlass, sun, view, ledMat, ceilGlow, ceilMat, lboxFace, laserDots, runLed, curtOpen, curtShut, pcGlow, pcLight;
// v17: the PC lit up behind its clear side window: glowing fan rings (three front, one rear), an RGB strip along the top, a light inside
function pcLit() {
  const [cw, ch, cd] = R.PC_CASE, [cz1, cz0] = R.PC_Z, st = R.PC_SHELF_TOP, x = 2.5 + cw - 4.2;
  pcGlow = new THREE.Group();
  const ringM = new THREE.MeshBasicMaterial({ color: "#3fe3b0", toneMapped: false }), rgbM = new THREE.MeshBasicMaterial({ color: "#b46cff", toneMapped: false });
  const ring = (y, z, r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r * M, 0.0035, 8, 32), ringM); m.position.copy(v3(x, y, z)); m.rotation.y = Math.PI / 2; pcGlow.add(m); };
  for (const y of [st + 11, st + 23.5, st + 36]) ring(y, cz1 - 2.6, 5.2);
  ring(st + 36, cz0 + 2.2, 4.8);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, (cd - 6) * M), rgbM); strip.position.copy(v3(2.5 + cw - 1.5, st + ch - 2, (cz0 + cz1) / 2)); pcGlow.add(strip);
  const ramM = new THREE.MeshBasicMaterial({ color: "#ff5ad1", toneMapped: false });
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.007), ramM); r.position.copy(v3(4.5, st + 37.2, cz0 + 21.85 + k * 1.3)); pcGlow.add(r); }
  shell.add(pcGlow);
  pcLight = new THREE.PointLight("#9d7bff", 3, 0.6, 2); pcLight.userData.accent = 3; pcLight.position.copy(v3(2.5 + cw / 2, st + ch / 2, (cz0 + cz1) / 2)); shell.add(pcLight);
}
// v17: "i also have deep window sills that allow for lots of plants there": a row of pots along the sill, upright and trailing
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

/* ---------------------------------------------------------------- lights */
const lights = { strip: [], uprights: [], bias: [], bar1: [], bar2: [], lamp: [], tv: [], fill: [] };
const hemi = new THREE.HemisphereLight("#e2e0da", "#b39a7c", 0.05); scene.add(hemi);
// v58: daylight on the outside of the house (The whole house only; kept in the scene at 0 otherwise, so no shader rebuilds): the sky's
// fill and the sun from the south-west over the front (the back faces 14° east of north)
const skyFill = new THREE.HemisphereLight("#dfe8f1", "#5d5446", 0); scene.add(skyFill);
const dayLight = new THREE.DirectionalLight("#fff1dc", 0); dayLight.position.copy(v3(700, 1400, 1100)); dayLight.target.position.copy(v3(233, 0, 80)); scene.add(dayLight, dayLight.target);
/* V1.3, the client: "continue upgrading the 3d model of the house" (BUILD_SPEC phase 4, the start of 5): outside, the house stands under
   a real sky (three's Sky, its sun where the day light comes from) on ground that runs to a hazy horizon: the street's level in front of
   the back wall, the garden's behind it, as the land steps down. Only in The whole house from outside (a floor shown keeps its cutaway
   clear); built the first time */
const OUT = { sky: null, ground: null };
function outdoor() {
  const on = !!(R.HOUSE3 && S.view === "house" && hfloor === "all");
  if (on && !OUT.sky) {
    const sky = OUT.sky = new Sky(); sky.scale.setScalar(100); sky.name = "sky";
    const u = sky.material.uniforms; u.turbidity.value = 3.5; u.rayleigh.value = 1.1; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.copy(dayLight.position).sub(dayLight.target.position).normalize();
    sky.raycast = () => {}; scene.add(sky);
    const H = R.HOUSE3, g = OUT.ground = new THREE.Group(); g.name = "ground";
    const mat = reg(new THREE.MeshStandardMaterial({ color: "#56633f", roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 })); mat.clippingPlanes = [];
    const yt = (H.drive ?? -15) - 2, yb = (H.lawn ?? -260) - 2, A0 = -125, A1 = -28, E = 8000, zf = H.front, zb = H.back;   // the alley (x -125 to -28)
    const quad = (x0, x1, z0, y0, z1, y1, alley) => {   // a strip of ground from (z0, y0) to (z1, y1), level across x
      const g2 = new THREE.BufferGeometry(), P = [x0, y0, z0, x1, y0, z0, x1, y1, z1, x0, y1, z1].map((v, i) => i % 3 === 0 ? -v * M : v * M);
      g2.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g2.setIndex([0, 1, 2, 0, 2, 3]);
      g2.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));   // lit as level ground: the slope doesn't read as a lighter band
      const m = new THREE.Mesh(g2, mat); m.receiveShadow = true; m.raycast = () => {}; m.userData.alley = !!alley; g.add(m); };
    quad(-E, E, -E, yb, zb, yb);                                                                    // the gardens' side, a storey down
    quad(-E, A0, zb, yb, zf, yt); quad(A0, A1, zb, yb, zf, yt, true); quad(A1, E, zb, yb, zf, yt);   // the slope the terrace is built into (hidden inside the house; by it, the alley's own steps with Gardens on)
    quad(-E, E, zf, yt, E, yt);                                                                     // the street's side, out to the horizon
    scene.add(g);
  }
  if (OUT.sky) { OUT.sky.visible = on; OUT.ground.visible = on; OUT.ground.children.forEach(m => { if (m.userData.alley) m.visible = !S.hgarden; }); }   // with Gardens on the alley steps down there
  scene.fog.near = on ? 30 : 1e4; scene.fog.far = on ? 110 : 2e4;
}
function area(color, w, h, pos, look) {
  const l = new THREE.RectAreaLight(color, 1, w * M, h * M);
  l.position.copy(v3(...pos)); l.lookAt(v3(...look)); scene.add(l); return l;
}
function buildLights() {
  const C = R.CEIL, Wd = R.W, WZ = R.WINDOW_Z, AD = R.ALC_D;
  const warm = "#ffe0bf";
  // the strip washes each wall from the ceiling's edge
  lights.strip.push(area(warm, AD - WZ, 6, [4, C - 4, (AD + WZ) / 2], [4, 0, (AD + WZ) / 2]));
  lights.strip.push(area(warm, Wd, 6, [Wd / 2, C - 4, WZ + 4], [Wd / 2, 0, WZ + 4]));
  lights.strip.push(area(warm, R.STAIR_FRONT - WZ, 6, [Wd - 4, C - 4, (R.STAIR_FRONT + WZ) / 2], [Wd - 4, 0, (R.STAIR_FRONT + WZ) / 2]));
  lights.strip.push(area(warm, R.WELL_X0, 6, [R.WELL_X0 / 2, C - 4, -4], [R.WELL_X0 / 2, 0, -4]));
  lights.strip.forEach(l => { l.userData.k = 520; l.userData.warm = true; });
  // the uprights' grooves wash the wall either side of the TV
  for (const x of [(R.UP_L[0] + R.UP_L[1]) / 2, (R.UP_R[0] + R.UP_R[1]) / 2]) { const l = area("#ffcf96", 2, 112, [x, 134, 22], [x, 134, 40]); l.userData.k = 3500; l.userData.colKey = "strips"; lights.uprights.push(l); }
  // v15: the side run's strip washes the side wall below it
  const SR = R.SIDE_RUN, zr0 = SR.edge[0][1], zr1 = SR.edge[SR.edge.length - 1][1];
  const sw = area("#ffcf96", zr0 - zr1, 3, [9, SR.under - 1, (zr0 + zr1) / 2], [0, SR.under - 60, (zr0 + zr1) / 2]); sw.userData.k = 260; sw.userData.colKey = "strips"; lights.uprights.push(sw);
  /* v46: Fast (most phones) leaves out the area lights above, so the media wall and the sofa fell dark while the spot heads lit the
     floor six times brighter. Five plain point lights stand in for them in Fast only (no shadows): four along the strip's walls, one
     in front of the uprights; each follows its layer's slider */
  const fillSpot = (pos, at, k, fill, colKey, ang) => { const f = new THREE.SpotLight("#ffe0bf", 1, 0, ang, 1.0, 2); f.position.copy(v3(...pos)); f.target.position.copy(v3(...at));
    f.userData = { k, fill, warm: !colKey, colKey }; scene.add(f, f.target); lights.fill.push(f); };
  fillSpot([40, C - 12, (AD + WZ) / 2], [0, 40, (AD + WZ) / 2], 75, "strip", null, 1.25);                          // the PC's side wall
  fillSpot([Wd / 2, C - 12, WZ + 45], [Wd / 2, 40, WZ], 75, "strip", null, 1.25);                                  // the window wall
  fillSpot([Wd - 45, C - 12, (R.STAIR_FRONT + WZ) / 2], [Wd, 40, (R.STAIR_FRONT + WZ) / 2], 60, "strip", null, 1.25);   // the stairs wall
  fillSpot([R.WELL_X0 / 2, C - 12, -45], [R.WELL_X0 / 2, 40, AD], 40, "strip", null, 1.25);                       // the media wall and the breast
  fillSpot([R.ALC_W / 2, 200, -90], [R.ALC_W / 2, 125, AD], 85, "uprights", "strips", 1.0);                       // the uprights' wash
  // bias light behind the TV, onto the wall
  const [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y;
  const b = area("#e9efff", tx1 - tx0 - 10, ty1 - ty0 - 10, [(tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z + 5], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, 60]);
  b.userData.k = 90; lights.bias.push(b);
  // the TV's own light into the room when it's on
  const tvl = area("#ff9d7a", tx1 - tx0, ty1 - ty0, [(tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z - 0.5], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, -300]);
  tvl.userData.k = 60; lights.tv.push(tvl);
  // the window's daylight (north light, no sun) and the night sky's faint blue
  win = area("#dfe9ff", R.WINDOW_X[1] - R.WINDOW_X[0], R.WINDOW_Y[1] - R.WINDOW_Y[0], [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 150, WZ + 1], [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 140, 0]);
}
let win;
const fixtures = new THREE.Group(); scene.add(fixtures);
const white = new THREE.MeshStandardMaterial({ color: "#f2f0eb", roughness: 0.4 });
const toppers = new THREE.MeshStandardMaterial({ color: "#d6a873", roughness: 0.5, map: OAK_TEX });
const HEADS = {};
function headMat(col) { return HEADS[col] || (HEADS[col] = reg(new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, side: THREE.DoubleSide }))); }
function spotHead(group, apex, dir, col, lightList, kSpot, colKey, shadeMat, barIx) {
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.075, 0.13, 28, 1, true), shadeMat || headMat(col));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.019, 0.038, 16), shadeMat || toppers);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ color: "#fff3dc", toneMapped: false }));   // one each: it dims with its own light
  const head = new THREE.Group();
  shade.position.y = -0.065 - 0.038; cap.position.y = -0.019; glow.position.y = -0.155; glow.rotation.x = Math.PI / 2;
  head.add(shade, cap, glow); shadow(shade); shadow(cap, true);
  head.position.copy(apex);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  group.add(head);
  // v15: "make lighting less spotty": a wider beam with a fully soft edge (was 0.42 rad, penumbra 0.85)
  const sp = new THREE.SpotLight(WARM, 1, 0, 0.66, 1.0, 2);
  sp.position.copy(apex.clone().add(dir.clone().multiplyScalar(0.14)));
  sp.target.position.copy(apex.clone().add(dir.clone().multiplyScalar(3)));
  sp.shadow.mapSize.set(LIVE_MAP, LIVE_MAP); sp.shadow.bias = -0.0004; sp.shadow.normalBias = 0.02; sp.shadow.camera.near = 0.05; sp.shadow.radius = 6;
  sp.userData = { k: kSpot, glow, colKey, barIx };   // v35: barIx, its place on a spot bar (Fast lights every other one)
  scene.add(sp, sp.target); lightList.push(sp);
}
function buildBar(spec, list, colKey) {   // v15: the bar runs along z (TV to window) when spec.axis is "z"
  const g = new THREE.Group(); g.name = "bar";
  const C = R.CEIL, along = spec.axis === "z", th = fixDeg(colKey) * Math.PI / 180, c = Math.cos(th), s_ = Math.sin(th);
  const at = dx => { const [ox, oz] = along ? [0, dx] : [dx, 0]; return [spec.x + ox * c - oz * s_, spec.z + ox * s_ + oz * c]; };   // v38: the bar turns on its rose
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 28), white); rose.position.copy(v3(spec.x, C - 1.25, spec.z)); g.add(rose);
  const barM = new THREE.Mesh(along ? new THREE.BoxGeometry(0.022, 0.013, 0.84) : new THREE.BoxGeometry(0.84, 0.013, 0.022), white);
  barM.position.copy(v3(spec.x, C - 3.2, spec.z)); barM.rotation.y = th; g.add(shadow(barM));
  spec.heads.forEach((h, i) => {
    const [hx0, hz0] = along ? [spec.x, spec.z + h.dx] : [spec.x + h.dx, spec.z], [hx, hz] = at(h.dx);
    const apex = v3(hx, C - 6.5, hz), plan = v3(...h.tgt).sub(v3(hx0, C - 6.5, hz0)).normalize();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8), headMat(h.stem));
    stem.position.copy(v3(hx, C - 5, hz)); g.add(stem);
    spotHead(g, apex, aimDir(plan, th, headOf(`${colKey}:${i}`)), h.col, list, 140, colKey, undefined, i);
    list[list.length - 1].userData.hk = `${colKey}:${i}`;
  });
  g.userData.spec = spec; fixtures.add(g); return g;
}
let lamp;
const LAMP_RED = new THREE.MeshStandardMaterial({ color: R.LAMP_BODY, roughness: 0.28, metalness: 0.35 });   // v15: "the lamp is bright red"
function buildLamp() {   // three adjustable heads on a red pole, with colour bulbs: green on top, pink, then purple going down
  if (lamp) drop(lamp, lights.lamp);
  const L = S.layout.lamp || {}, d0 = R.LAMP_SPOTS[S.lamp] || R.LAMP_SPOTS[DEF.lamp];
  const spot = { x: L.x ?? d0.x, z: L.z ?? d0.z };                                    // v18: wherever you've dragged it
  const g = new THREE.Group(); lamp = g; g.userData.movId = "lamp"; g.visible = !L.off;
  const red = LAMP_RED;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 32), red); base.position.copy(v3(spot.x, 1.25, spot.z)); g.add(shadow(base));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, R.LAMP.h * M, 12), red); pole.position.copy(v3(spot.x, R.LAMP.h / 2, spot.z)); g.add(shadow(pole));
  const toward = new THREE.Vector3(...[233 - spot.x, 0, -135 - spot.z]).normalize();      // the room's middle, in room coords
  const th = fixDeg("lamp") * Math.PI / 180, pivotW = v3(spot.x, 0, spot.z), Yax = new THREE.Vector3(0, 1, 0);   // v38: the lamp turns on its base
  const turnP = p => p.sub(pivotW).applyAxisAngle(Yax, th).add(pivotW), turned = [];
  // v17, client: "green lamp should face down more slightly, its looking at the ceiling, face at the shelf wall": the top head aims at a
  // point on the stairs wall 30 below its own height, along the shelf (it was aimed 110 up, at the ceiling)
  const sbz = R.SHELF_B.z, wz = Math.min(Math.max(spot.z + 30, Math.min(sbz[0], sbz[1])), Math.max(sbz[0], sbz[1]));
  const aims = [[R.LAMP.h - 8, [R.W - spot.x, -22, wz - spot.z]], [R.LAMP.h - 45, [toward.x * 160, -40, toward.z * 160]], [R.LAMP.h - 80, [toward.x * 90, -110, toward.z * 90]]];
  aims.forEach(([y, off], i) => {
    const apex = v3(spot.x + toward.x * 9, y, spot.z + toward.z * 9);
    const tgt = v3(spot.x + off[0], y + off[1], spot.z + off[2]);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), red); arm.position.copy(v3(spot.x + toward.x * 5, y, spot.z + toward.z * 5));
    arm.rotation.z = Math.PI / 2; arm.rotation.y = Math.atan2(toward.z, -toward.x); g.add(arm); turned.push(arm);
    spotHead(g, turnP(apex.clone()), aimDir(tgt.clone().sub(apex).normalize(), th, headOf("lamp:" + i)), R.LAMP_BODY, lights.lamp, 55, "lamp" + i, red);
    lights.lamp[lights.lamp.length - 1].userData.hk = "lamp:" + i;
  });
  // v16, the client's photo ("Hat"): the hats live on the lamp: the graduation cap sits on the pole's top, tipped, and the navy cap with
  // the poem printed under its peak hangs on the pole below the top head, peak down, crown out
  if (R.HATS) {
    const H = R.HATS, felt = reg(new THREE.MeshStandardMaterial({ color: "#16171b", roughness: 0.85 }));
    const mb = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.07, 28), felt); skull.position.y = -0.035;
    const board = new THREE.Mesh(new THREE.BoxGeometry(H.board * M, 0.008, H.board * M), felt); board.rotation.y = Math.PI / 4;
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12), felt); button.position.y = 0.007;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.11, 8), reg(new THREE.MeshStandardMaterial({ color: "#1d1e22", roughness: 0.9 })));
    tassel.position.set(0.1, -0.05, 0.02);
    mb.add(shadow(skull), shadow(board), button, tassel);
    mb.position.copy(v3(spot.x, R.LAMP.h + 5, spot.z)); mb.rotation.z = -0.22; mb.rotation.x = 0.12; g.add(mb); turned.push(mb);
    const perp = new THREE.Vector3(-toward.z, 0, toward.x);                         // room coords: across the heads
    const out = new THREE.Vector3(-perp.x, 0, perp.z).normalize(), up = new THREE.Vector3(0, 1, 0);   // world
    const cap = buildCap(H);                                                         // v37: a structured baseball cap, not a beret
    const xAxis = new THREE.Vector3().crossVectors(out, up), tilt = 0.4;               // v37: tipped so the stiff brim kicks out from the pole
    const yAx = out.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt)), zAx = up.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(out, -Math.sin(tilt));
    cap.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAx, zAx));
    cap.position.copy(v3(spot.x, H.cap_y, spot.z)).add(out.clone().multiplyScalar(0.02)); g.add(cap); turned.push(cap);
  }
  const q = new THREE.Quaternion().setFromAxisAngle(Yax, th);
  turned.forEach(o => { turnP(o.position); o.quaternion.premultiply(q); });
  fixtures.add(g);
}

/* v37, client: "It should be a baseball cap: a fitted, structured, rounded crown with a flat, stiff brim that projects forward. Make the
   brim noticeably oversized (roughly 1.5-2x a normal proportion)". In the cap's own frame (metres): the crown up +y, the brim forward -z.
   Six panels on an oval base, a seam down the middle of the front and five more, a button on top, an eyelet in each panel; a flat brim
   1.8 times a usual one, stiff (an edged slab), with the gold stitching on its top and across the crown's front (geometry.HATS) */
function buildCap(H) {
  const cap = new THREE.Group(), cm = M, a = H.crown_w / 2, b = H.crown_l / 2, h = H.crown_h;
  const green = reg(new THREE.MeshStandardMaterial({ color: H.crown_col, roughness: 0.85, side: THREE.DoubleSide }));
  const brown = reg(new THREE.MeshStandardMaterial({ color: H.brim_col, roughness: 0.8 }));
  const seamM = reg(new THREE.MeshStandardMaterial({ color: "#1f3327", roughness: 0.9 }));
  const prof = [[1, 0], [1.0, 0.22], [0.975, 0.45], [0.9, 0.66], [0.76, 0.82], [0.55, 0.93], [0.3, 0.985], [0, 1]];   // firm sides, a rounded top
  const pts = prof.map(([r, y]) => new THREE.Vector2(r * a * cm, y * h * cm));
  const crown = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), green); crown.scale.z = b / a; cap.add(shadow(crown));
  // the seams: one down the front's middle (phi = PI), the rest every 60 degrees, a little proud of the cloth
  for (let i = 0; i < 6; i++) { const phi = Math.PI + i * Math.PI / 3;
    const path = new THREE.CatmullRomCurve3(prof.slice(0, -1).map(([r, y]) => new THREE.Vector3(r * a * Math.sin(phi) * cm * 1.004, y * h * cm, r * b * Math.cos(phi) * cm * 1.004)).concat([new THREE.Vector3(0, h * cm, 0)]));
    cap.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.0009, 5), seamM)); }
  const button = new THREE.Mesh(new THREE.SphereGeometry(1.0 * cm, 14, 8), green); button.scale.y = 0.5; button.position.y = h * cm; cap.add(button);
  for (let i = 0; i < 6; i++) { const phi = Math.PI + Math.PI / 6 + i * Math.PI / 3, k = 0.76, ye = 0.82 * h;   // an eyelet high on each panel
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.35 * cm, 12), seamM); const p_ = new THREE.Vector3(k * a * Math.sin(phi) * 1.01 * cm, ye * cm, k * b * Math.cos(phi) * 1.01 * cm);
    e.position.copy(p_); e.lookAt(p_.clone().multiply(new THREE.Vector3(2, 1.3, 2))); cap.add(e); }
  // the gold stitching across the crown's front: a patch of the same surface, a hair proud
  const rAt = t => { for (let i = 1; i < prof.length; i++) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; if (t <= y1) return r0 + (r1 - r0) * (t - y0) / (y1 - y0); } return 0; };
  const fpts = [0.16, 0.3, 0.45, 0.58, 0.68].map(t => new THREE.Vector2(rAt(t) * a * cm * 1.006, t * h * cm));
  const front = new THREE.Mesh(new THREE.LatheGeometry(fpts, 24, Math.PI - 0.8, 1.6), reg(new THREE.MeshStandardMaterial({ map: CAP_CROWN_TEX, transparent: true, alphaTest: 0.35, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide })));
  front.scale.z = b / a; cap.add(front);
  // the brim: a flat stiff slab off the crown's front, 1.8 times a usual one, the stitching on its top
  const t1 = 1.25, W = H.brim_w / 2, L = H.brim_len, shape = new THREE.Shape(), steps = 24;
  for (let i = 0; i <= steps; i++) { const th = -t1 + 2 * t1 * i / steps; const x = a * Math.sin(th), y = b * Math.cos(th); i ? shape.lineTo(x, y) : shape.moveTo(x, y); }   // along the crown
  for (let i = steps; i >= 0; i--) { const sx = -1 + 2 * i / steps, y0 = b * Math.cos(t1); shape.lineTo(sx * W, y0 + (b + L - y0) * Math.pow(1 - Math.pow(Math.abs(sx), 2.6), 1 / 2.6)); }   // its rounded front edge
  const slab = new THREE.ExtrudeGeometry(shape, { depth: H.brim_t, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.12, bevelSegments: 1, curveSegments: 4 });
  slab.rotateX(-Math.PI / 2); slab.scale(cm, cm, cm);
  const brim = new THREE.Mesh(slab, brown); brim.position.y = -0.1 * cm; cap.add(shadow(brim));
  const top = new THREE.ShapeGeometry(shape, 4), uv = top.attributes.uv, ps = top.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (W - ps.getX(i)) / (2 * W), 1 - (ps.getY(i) - b * Math.cos(t1)) / (b + L - b * Math.cos(t1)));   // read from the front, the first row at the crown
  top.rotateX(-Math.PI / 2); top.scale(cm, cm, cm);
  const stitch = new THREE.Mesh(top, reg(new THREE.MeshStandardMaterial({ map: CAP_BRIM_TEX, transparent: true, alphaTest: 0.35, roughness: 0.55, metalness: 0.25 })));
  stitch.position.y = (H.brim_t + 0.1) * cm; cap.add(stitch);
  return cap;
}

/* ---------------------------------------------------------------- the furniture, by state */
const G = {};
let tvScreen;
function buildFurniture() {
  for (const [k, v] of Object.entries(SC.groups)) { G[k] = buildGroup(v, k); G[k].visible = false; scene.add(G[k]); }
  G.fixed.visible = G.frames.visible = true;
  const [tx0, tx1] = R.TV_X, [ty0, ty1] = R.TV_Y;
  tvScreen = new THREE.Mesh(new THREE.PlaneGeometry((tx1 - tx0 - 1.2) * M, (ty1 - ty0 - 1.2) * M), new THREE.MeshStandardMaterial({ color: "#050506", roughness: 0.12, metalness: 0.2 }));
  tvScreen.position.copy(v3((tx0 + tx1) / 2, (ty0 + ty1) / 2, R.TV_Z - 0.1)); tvScreen.rotation.y = Math.PI; scene.add(tvScreen);
  if (G.sofa) {      // v19: the sofa moves too: its group recentred on its footprint and handed to edit mode
    const so = R.SOFA, cx = (so.x[0] + so.x[1]) / 2, cz = (so.back + so.end) / 2, g = G.sofa;
    buildCushions(g);                                                                // v20: cushions to try (Decor), off by default
    scene.remove(g); g.position.set(cx * M, 0, -cz * M); g.visible = true; delete G.sofa;
    movable("sofa", "Your sofa", g, () => ({ x: cx, z: cz, rot: 0 }), so.x[1] - so.x[0], so.end - so.back, []);
  }
}
let bar1, bar2;

/* ---------------------------------------------------------------- apply the options */
function drop(group, list) {   // take a fixture and its lights out of the scene, freeing their GPU memory
  fixtures.remove(group);
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  list.forEach(l => { scene.remove(l, l.target); if (l.shadow && l.shadow.map) l.shadow.map.dispose(); });
  list.length = 0;
}
let built = {};
function applyState() {
  solidDirty();
  S.site = "C"; S.cab = "compact"; if (S.cabw !== "80") S.cabw = "90";   // v33, client: "the compact cabinet is our only choice for the table now"
  if (cab && cab.userData.w !== cabC().top[0]) rebuildCab();
  for (const k of Object.keys(G)) if (/^[AB]_/.test(k)) G[k].visible = k === `${S.site}_${S.dining}`;
  G.unit_in.visible = !S.drawers; G.unit_out.visible = S.drawers;
  const b2 = `${S.site === "C" ? "B" : S.site}_${S.site === "C" ? (S.dining === "folded" ? "folded" : "six") : S.dining}`;   // v26: C lights like B
  const b2k = b2 + fixKey("bar2"), b1k = fixKey("bar1");
  if (built.bar2 !== b2k) { if (bar2) drop(bar2, lights.bar2); bar2 = buildBar(R.BAR2[b2], lights.bar2, "bar2"); built.bar2 = b2k; }
  if (bar1 && built.bar1 !== b1k) { drop(bar1, lights.bar1); bar1 = buildBar(R.BAR1, lights.bar1, "bar1"); }   // v38: turned or aimed
  built.bar1 = b1k;
  const lk = S.lamp + JSON.stringify(S.layout.lamp || {}) + fixKey("lamp");
  if (built.lamp !== lk) { buildLamp(); built.lamp = lk; }
  if (G.now_ledge) G.now_ledge.visible = S.site !== "A" && S.plants !== "breast" && !(S.sugg.barcase && caseOn());   // v18: with the plants on the breast the ledge comes off; v34: the drinks cabinet takes its place
  placeChairs();                                                                   // v20: the chair cupboard, its doors, the chairs in it
  placeWork();                                                                     // v34: the blind, the records, the trolley
  applyDecor();                                                                    // v20: the rug, cushions, curtains, the case's fill and frame
  applySvar();                                                                     // v28: the suggestions' versions
  placeAll();
  repaint();
  applyLight();
  adoptLights(scene);                                                              // v35: new lights (a rebuilt bar or lamp) join the fixed set
  updateCaption();
  store.set(KEY, S);
  try { applyNow(); } catch (e) {}                                       // v39: the ledge's LP
  dirty();
}
/* v46, client: "default view could balance lighting throughout the room using all fixtures ... then optimise and upgrade settings":
   Warmth, one setting for every warm-white light (candle-warm to neutral white; the middle is the bulbs' warm white), unless you've
   given a light its own colour */
const WARMTH = [new THREE.Color("#ffbf86"), new THREE.Color(WARM), new THREE.Color("#fff3e4")];   // candle-warm, the bulbs' warm white, neutral
function warmColour() { const w = Math.max(0, Math.min(100, S.warm ?? 50)) / 50; return w <= 1 ? WARMTH[0].clone().lerp(WARMTH[1], w) : WARMTH[1].clone().lerp(WARMTH[2], w - 1); }
/* v44: the room's reflections by surface: glass, the TV and gloss pots catch more of them, matte paint and fabric less. v48 §2: the window
   by night is a faint mirror of the lit room over the dusk garden (as real glass is), by day a light sky sheen */
function envLevels(day) {
  const own = ENV.tex && scene.environment === ENV.tex, g = own ? ENV.gain : 1;
  if (winGlass) { winGlass.userData.envK = day ? 0.4 : 1.2; winGlass.opacity = day ? 0.06 : 0.1; }
  MATS.forEach(m => { if (!("envMapIntensity" in m)) return;
    if (m.userData.envK === undefined) m.userData.envK = m.roughness < 0.25 ? 2.4 : m.roughness < 0.5 ? 1.5 : m.roughness > 0.85 ? 0.7 : 1;
    m.envMapIntensity = (day ? 0.16 : 0.12) * m.userData.envK * g; });   // v50: day 0.25 → 0.16, less washed
}
/* v48 §3: reflections from the room itself, not a stock studio. A cube camera in the middle of the room takes it in six directions once
   the room has changed and settled (1.2 s), in HD on a real graphics card (where the room already draws into a target of the same kind,
   so no new shaders) and in every saved picture; phones and Fast keep the studio. */
const ENV = { rt: null, cam: null, pm: null, tex: null, studio: null, t: 0, gain: 0.8, use: true };
function roomEnv() {
  if (!started || !ENV.use) return;
  if (S.tod === "day") { if (ENV.studio && scene.environment !== ENV.studio) { scene.environment = ENV.studio; envLevels(true); } return; }   // by day the bright garden in the window swamped it: the studio stays
  if (!ENV.rt) { ENV.rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType }); ENV.cam = new THREE.CubeCamera(0.05, 40, ENV.rt); ENV.pm = new THREE.PMREMGenerator(gl); }
  ENV.cam.position.copy(v3(R.W / 2, 125, (R.WINDOW_Z + R.RECESS_Z) / 2));
  const clip = gl.localClippingEnabled; gl.localClippingEnabled = false;   // the whole room, not the cutaway
  const sunI = sun ? sun.intensity : 0; if (sun) sun.intensity = 0;            // the sun's patch stays out of the reflections (it lit the room twice)
  try { ENV.cam.update(gl, scene); } finally { gl.localClippingEnabled = clip; if (sun) sun.intensity = sunI; }
  const t = ENV.pm.fromCubemap(ENV.rt.texture).texture;
  if (ENV.tex) ENV.tex.dispose();
  ENV.tex = t; scene.environment = t; envLevels(S.tod === "day"); dirty();
}
const BLOOM = [16, 0.3, 0.3];   // threshold (linear, before exposure), strength, radius
function bloomLevels(day) {   // only the light sources glow: by evening, above the brightest lit wall; never by day (the walls are brighter)
  if (AO.b) { const [th, st, rad] = AO.bt || BLOOM; AO.b.enabled = !day && AO.bloom !== false; AO.b.threshold = th; AO.b.strength = st; AO.b.radius = rad; }
}
function envSoon() {
  clearTimeout(ENV.t);
  if (started && aoLive()) ENV.t = setTimeout(roomEnv, 1200);
  else if (ENV.studio && scene.environment !== ENV.studio) { scene.environment = ENV.studio; envLevels(S.tod === "day"); }
}
function applyLight() {
  placeRoomLights();                                          // v69: a room of the house: its ceiling lights, day or evening
  const day = S.tod === "day" || S.view === "house", hd = S.quality === "hd";   // V1.3: the whole house by day (inside, the rooms keep the time you set)
  const L = {}; LAYERS.forEach(k => L[k] = lvl(k));          // v15: the sliders (a scene button fills them in), times the master
  const warmC = warmColour();                                 // v46: Warmth
  const set = (list, lv) => list.forEach(l => {
    l.intensity = (l.userData.k || 1) * Math.pow(lv / 100, 1.6);
    l.visible = lv > 0;
    if (l.userData.colKey) { const c = S.col[l.userData.colKey]; if (c && c !== WARM) l.color.set(c); else l.color.copy(warmC); }   // the smart bulbs' colour, or Warmth
    else if (l.userData.warm) l.color.copy(warmC);
    if (l.isSpotLight) { l.castShadow = hd && lv > 0; if (l.userData.glow) l.userData.glow.material.color.set(lv > 0 ? (S.col[l.userData.colKey] || "#fff3dc") : "#3a3a3a"); }
  });
  const area = hd ? 1 : 0;      // Fast leaves out the area lights (the most expensive) and lifts the fill to make up
  set(lights.strip, L.strip * area); set(lights.uprights, L.uprights * area); set(lights.bias, L.bias * area); set(lights.bar1, L.bar1); set(lights.bar2, L.bar2);
  if (!hd) for (const bar of [lights.bar1, lights.bar2]) bar.forEach((l, i) => {   // v22: Fast lights each bar with two of its four heads (v46: 1.6 times as bright, the fill does the rest)
    if (i % 2) l.visible = false; else l.intensity *= 1.6; });
  lights.fill.forEach(l => { const lv = hd ? 0 : L[l.userData.fill]; l.intensity = l.userData.k * Math.pow(lv / 100, 1.6); l.visible = lv > 0;
    if (l.userData.colKey) { const c = S.col[l.userData.colKey]; l.color.copy(c && c !== WARM ? new THREE.Color(c) : warmC); } else l.color.copy(warmC); });
  set(lights.lamp, (S.layout.lamp || {}).off ? 0 : L.lamp);  // v15: the lamp's colour bulbs dim in their app (v18: or it's been removed)
  scene.traverse(o => { if (o.isLight && o.userData.accent) o.intensity = o.userData.accent * 1.5 * Math.pow(L.accent / 100, 1.6); });   // v46: Accents (70 is about the old fixed level)
  for (const l of [...lights.bar1, ...lights.bar2, ...lights.lamp]) {   // v38: each head's own switch, level and colour
    const h = headOf(l.userData.hk); if (!l.userData.hk || !Object.keys(h).length) continue;
    const g = l.userData.glow;
    if (h.on === false) { l.intensity = 0; if (g) g.material.color.set("#3a3a3a"); continue; }
    if (h.lv !== undefined) l.intensity = l.intensity * Math.pow(Math.max(0, Math.min(100, h.lv)) / 100, 1.6);
    if (h.col) { l.color.set(h.col); if (g && l.intensity > 0) g.material.color.set(h.col); }
  }
  capShadows(hd ? SHADOW_CAP : 0);                            // v18: never more shadowed spots than the graphics card can take
  if (growGlow) growGlow.forEach(m => m.visible = !!S.grow);
  set(lights.tv, L.bias > 0 && hd ? 100 : 0);
  ledMat.color.set(L.strip > 0 ? "#ffd9a8" : "#5a5248").multiplyScalar(L.strip > 0 ? 0.6 + L.strip / 100 * 1.4 : 1);
  runLed.color.set(L.uprights > 0 ? (S.col.strips || "#ffd9a8") : "#5a5248").multiplyScalar(L.uprights > 0 ? 0.6 + L.uprights / 100 * 1.4 : 1);   // v16: smart colour strips
  ceilMat.emissiveIntensity = 0.55 * Math.pow(L.strip / 100, 1.2);
  tvScreen.material = S.ideas.sync ? screenFilm : L.bias > 0 ? screenOn : screenOff;   // v32: the backlight idea plays a film
  lboxFace.material.color.set(S.lbox && !day ? "#ffffff" : "#5a5a5e");
  laserDots.visible = S.laser && !day;
  if (pcGlow) { pcGlow.visible = !!S.pc; pcLight.visible = !!S.pc; }
  for (const [k, g] of Object.entries(IDEA_G)) g.visible = k === "case" ? caseOn() : !!S.ideas[k];          // v17: ideas, off by default
  if (G.frames) G.frames.visible = !caseOn();                                                                 // the case replaces the frames
  if (G.frames) G.frames.position.y = S.site !== "A" && S.plants === "breast" ? 0.3 : 0;                        // v18.1: up 30 over the 158 plant stand
  if (ideaLed) ideaLed.color.set(day ? "#8a8578" : "#fff1d6");
  curtShut.visible = !!S.curtains; curtOpen.visible = !S.curtains;
  win.intensity = day ? 70 : 11; win.color.set(day ? "#eef0f2" : "#7d89b8");   // v47.1: dusk light, not black (v50: a softer, less blue day)
  view.material.map = GARDEN_ON ? (day ? SKY.day : SKY.night) : null; view.material.color.set(GARDEN_ON ? "#ffffff" : day ? "#dfe6ec" : "#1d2535"); view.material.needsUpdate = true;   // v56: a plain sky for now
  // bounce light: a real room's walls relight it; this stands in for that, in proportion to what's on. v15: more of it, so the room
  // reads evenly lit rather than as pools under each head
  const on = (L.strip * 1.0 + L.uprights * 0.3 + L.bar1 * 0.5 + L.bar2 * 0.5 + L.lamp * 0.35 + L.accent * 0.06 + (L.bias > 0 ? 8 : 0) + (S.lbox ? 4 : 0)) / 100;
  hemi.intensity = day ? 0.3 + (hd ? 0 : 0.25) : 0.04 + on * 0.26 + (hd ? 0 : (L.strip * 0.0075 + L.uprights * 0.0015 + (L.bias > 0 ? 0.08 : 0)));   // v50: less bounce, more shape
  win.visible = hd || day;
  envLevels(day); bloomLevels(day);
  if (sun) sun.intensity = day && hd ? SUNCFG.lux : 0;                                   // v48 §6: the sun, by day in HD
  envSoon();
  gl.toneMappingExposure = day ? (HOUSEV(S.view) && R.HOUSE3 ? 0.32 : 0.4) : 0.58;      // v50: cosier, not washed out; V1.3: outside a little lower (mean 153 → in 110–170)
  const outside = HOUSEV(S.view);                                                    // v58: the built house in daylight
  skyFill.intensity = outside ? (day ? 2.6 : 0.5) : 0; dayLight.intensity = outside && day ? 3.2 : 0;
  const inK = !!ROOMV();                                                                // v60: in a room of the house, light off its pale floor and walls,
  skyFill.groundColor.set(inK ? "#d9d3c9" : "#5d5446");                                 // and the living room's own lights stay upstairs
  if (inK) { scene.traverse(l => { if (l.isLight && l !== skyFill && l !== dayLight) l.intensity = 0; }); hemi.intensity = 0.5; }   // every light of the living room's, the spots too
  scene.background.set(outside && R.HOUSE3 ? (day ? "#c6d6e3" : "#1b2233") : "#0d100e");             // and a sky behind it
  if (gl.shadowMap.enabled !== hd) { gl.shadowMap.enabled = hd; MATS.forEach(m => m.needsUpdate = true); sizeRenderer(); if (LIVE && started) precompile(); }
  reshadow();
  dirty();
}
const screenOff = new THREE.MeshStandardMaterial({ color: "#050506", roughness: 0.12, metalness: 0.2 });
const screenOn = new THREE.MeshBasicMaterial({ map: SCREEN_TEX, toneMapped: false, color: "#d8d8d8" });
const screenFilm = new THREE.MeshBasicMaterial({ map: FILM_TEX, toneMapped: false, color: "#d8d8d8" });

/* ---------------------------------------------------------------- v18: things you can move (edit mode)
   Each movable thing is a group built round the centre of its footprint (room cm, its front towards local +z), on a pivot that
   edit mode drags across the floor and turns. Where it stands, its turn, its colour and whether it's removed live in S.layout[id];
   the things you add live in S.added. The red lamp is rebuilt where you drop it, so its lights move with it. */
const MOV = {};
const movers = new THREE.Group(); scene.add(movers);
function rlb(g, x, y, z, w, h, d, mat, r = 3) {           // v32: the same, its edges rounded (upholstery)
  const m = new THREE.Mesh(new RoundedBoxGeometry(w * M, h * M, d * M, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2) * M), mat);
  m.position.copy(v3(x, y + h / 2, z)); g.add(shadow(m)); return m;
}
function fabric(m, k = 0.6) { m.roughness = 0.95; m.bumpMap = HESSIAN; m.bumpScale = k; return m; }   // v34: a woven cover (its colour stays Edit room's)
function fabricMat(c) { return fabric(reg(new THREE.MeshStandardMaterial({ color: c }))); }
function pipe(g, x, y, z, len, mat, across = false) {      // v34: piping along an upholstered edge (along z, or across x)
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len * M, 8), mat); p.position.copy(v3(x, y, z));
  if (across) p.rotation.z = Math.PI / 2; else p.rotation.x = Math.PI / 2;
  g.add(p); return p;
}
function taperLeg(g, x, z, h, mat) {                        // v32: a round tapered leg under upholstery
  const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.011, h * M, 12), mat); l.position.copy(v3(x, h / 2, z)); g.add(shadow(l)); return l;
}
function lb(g, x, y, z, w, h, d, mat, cast = true) {      // a box in a movable's own coordinates: x, z its centre, y its bottom
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), mat);
  m.position.copy(v3(x, y + h / 2, z)); g.add(shadow(m, cast)); return m;
}
/* v22: fewer draws: a static group's direct child meshes become one mesh per material (your plant stand was 152 meshes, the vinyl stand 45).
   Nested groups (the sofa's cushions, the coffee table's tray, the chair cupboard's doors) are left alone, so their own switches still work. */
function mergeStatic(g) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), by = new Map();
  for (const o of g.children) if (o.isMesh && !o.children.length && o.visible && !Array.isArray(o.material) && !o.isInstancedMesh && !o.isSkinnedMesh && !o.userData.flora) {
    const k = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
    if (!by.has(k)) by.set(k, []); by.get(k).push(o);
  }
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const geos = list.map(o => { const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); q.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return q; });
    const names = Object.keys(geos[0].attributes).sort().join();
    if (!geos.every(q => Object.keys(q.attributes).sort().join() === names)) continue;
    const merged = mergeGeometries(geos); if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow;
    list.forEach(o => g.remove(o)); g.add(m);
  }
  return g;
}
function movable(id, label, g, def, w, d, mats, flat = false, extra = {}) {
  if (!extra.added && id !== "lamp") mergeStatic(g);   // v22
  const pivot = new THREE.Group(); pivot.add(g); pivot.userData.movId = id;
  movers.add(pivot);
  MOV[id] = Object.assign({ id, label, pivot, def, w, d, mats, flat, base: mats.map(m => "#" + m.color.getHexString()) }, extra);
  return MOV[id];
}
function spotOf(id) {
  const it = MOV[id], L = S.layout[id] || {}, d0 = it.def();
  return { x: L.x ?? d0.x, z: L.z ?? d0.z, rot: L.rot ?? d0.rot ?? 0 };
}
function placeAll() {
  solidDirty();                                                                     // v41: the furniture's boxes again
  for (const it of Object.values(MOV)) {
    if (it.lamp) continue;                                  // the lamp is rebuilt where it stands (buildLamp)
    if (it.fixed) { it.pivot.visible = !(S.layout[it.id] || {}).off && (!it.when || it.when()); continue; }   // v27: built in where it stands
    const L = S.layout[it.id] || {}, p = spotOf(it.id);
    it.pivot.position.copy(v3(p.x, 0, p.z)); it.pivot.rotation.y = p.rot * Math.PI / 180;
    it.pivot.visible = !L.off && (!it.when || it.when());
    it.mats.forEach((m, i) => m.color.set(L.col && i === 0 ? L.col : it.base[i]));
  }
  if (selBox) selBox.update();
  reshadow();
}
const SHADOW_CAP = Math.max(0, Math.min(4, (gl.capabilities.maxTextures || 16) - 11));   // v48: the sun's shadow takes one texture unit
function capShadows(n) {   // the brightest n spotlights cast shadows; the rest light without them
  const sp = Object.values(lights).flat().filter(l => l.isSpotLight && l.visible).sort((a, b) => b.intensity - a.intensity);
  sp.forEach((l, i) => { l.castShadow = i < n; });
}
// a pot with a plant in it, in a movable's coordinates
/* v15's hanging plant, as a builder (v36): a pot centred at x (room cm) on a shelf whose top is at top, its strands falling from the
   edges in edges (each strand picks one: the shelf's front, or v36's gap behind the plant shelf) */
let plantBG = null;
function hangPlant(par, x, top, z, edges, seed, gapZ) {   // v38: gapZ [the shelf's end, the boxing's face]: the strands fall through that gap
  const PB = R.PLANT_B, pot = FLORA_POTS !== "mine" ? potFinish(FLORA_POTS) : (hangPlant.pot = hangPlant.pot || reg(new THREE.MeshStandardMaterial({ color: "#e9e4da", roughness: 0.3 })));   // v40: a glazed pot, a real pothos
  const hold = { userData: {} }, B = floraBatch(hold), pg = potGeo(PB.pot / 2, 12); pg.translate(-x * M, top * M, z * M); floraAdd(B, pot, pg);
  const soil = new THREE.CircleGeometry(PB.pot / 2 * 0.93 * M, 20); soil.rotateX(-Math.PI / 2); soil.translate(-x * M, (top + 10.3) * M, z * M); floraAdd(B, floraMat("soil"), soil, null, "soil");
  const r = rnd(seed);
  for (let k = 0; k < PB.strands; k++) {
    const e = edges[k % edges.length], dir = e > x ? 1 : -1;   // behind the pot (towards the wall) or in front of it
    const len = PB.trail[0] + r() * (PB.trail[1] - PB.trail[0]);
    let pts;
    if (gapZ) {                                     // over the shelf's end, then down the gap between it and the boxing
      const zg = gapZ[0] - 1.5 - r() * (gapZ[0] - gapZ[1] - 3), xg = x + (r() - 0.5) * 16;
      pts = [v3(x + (r() - 0.5) * 6, top + 10, z + (r() - 0.5) * 6), v3(xg, top + 2, gapZ[0] + 1)];
      for (let j = 1; j <= 5; j++) pts.push(v3(xg + Math.sin(j + k) * 1.5, top - len * j / 5, zg + Math.sin(j * 1.3 + k) * 1.2));
    } else {
    const z0 = z + (r() - 0.5) * 12, x0 = e + dir * r() * 3;
    pts = [v3(x + dir * 2 + (r() - 0.5) * 6, top + 10, z0), v3(x0 - dir * 2, top + 2, z0 + (r() - 0.5) * 4)];
    for (let j = 1; j <= 5; j++) pts.push(v3(x0 + dir * (j * 0.6 + r() * 1.5) * (dir > 0 ? 0.3 : 1), top - len * j / 5, z0 + Math.sin(j + k) * 4));
    }
    vineAlong(B, pts, r, 6);
  }
  FLORA_BUILD.pothos(B, v3(x, top + 10.3, z), 20, r, PB.pot / 2);
  floraFlush(hold, par);
}
let growGlow = [];
const GLOW_TEX = canvasTex(128, 128, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(255,214,160,0.75)"); gr.addColorStop(1, "rgba(255,214,160,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
function buildPlantsAndRecords() {
  const r = rnd(73), PS = R.PLANT_STAND, RS = R.RECORD_SHELF;
  const pots = ["#ece6da", "#c9c2b4", "#b5643f", "#7f8f72", "#2f2f2f"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 })));
  // v18.1: the plant stand from the client's listing: 98 × 29.5 × 158, slatted wood, two five-tier towers and an open middle with two shelves
  { const g = new THREE.Group(), wood = reg(new THREE.MeshStandardMaterial({ color: PS.col, map: OAK_TEX, roughness: 0.6 })); wood.userData.noTint = true;
    const w = PS.w, d = PS.d, h = PS.h, [cl, cm, cr] = PS.cols, pt = PS.post;
    const xs = [-w / 2 + pt / 2, -w / 2 + cl, w / 2 - cr, w / 2 - pt / 2];                  // the four post lines across
    for (const x of xs) for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, x, 0, z, pt, h, pt, wood);
    const standPots = [];                                                                       // v40: where the stand's pots go; its plants are a spot
    const tier = (xa, xb, y, plants) => {                                                    // slats front to back, rails at front and back
      for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, (xa + xb) / 2, y - 2, z, xb - xa, 2, pt, wood);
      const n = Math.max(4, Math.round((xb - xa) / 4.5));
      for (let k = 0; k < n; k++) lb(g, xa + 1.5 + k * (xb - xa - 3) / (n - 1), y, 0, 2.2, 1.2, d - 3, wood);
      for (let j = 0; j < plants; j++) {
        const rad = 5 + r() * 3.5, px = xa + (j + 0.5) * (xb - xa) / plants;
        const pm = Math.floor(r() * pots.length);
        standPots.push([px, y + 1.2, (r() - 0.5) * 6, rad, Math.round(4 + r() * 8), r() < 0.35 ? 2 : 0, pm]);
      }
    };
    const L = [xs[0] - pt / 2, xs[1]], Rr = [xs[2], xs[3] + pt / 2], Mi = [xs[1], xs[2]];
    PS.tower.forEach(y => { tier(L[0], L[1], y, 0); tier(Rr[0], Rr[1], y, 0); });
    PS.middle.forEach(y => tier(Mi[0], Mi[1], y, 0));
    for (const z of [-d / 2 + pt / 2, d / 2 - pt / 2]) lb(g, 0, h - 2, z, w, 2, pt, wood);  // the top rails across the open middle
    /* v43, client: "the plant shelf is not built yet give it what you think will look best": one plant a tier so each reads, trailing
       pothos and spider plants up top spilling down the towers, a monstera in the tall open middle and a snake plant over it, calathea
       and fern lower down, a small snake plant and a ficus at the bottom. [x, tier top, radius, how tall, kind, strands, pot] */
    const cx = t => (t[0] + t[1]) / 2, TOP = y => y + 1.2;
    [[L, 4, 6.5, 7, "pothos", 3, 0], [Rr, 4, 7, 12, "spider", 0, 3], [L, 3, 7, 12, "spider", 0, 0], [Rr, 3, 6, 6, "pothos", 2, 2],
     [L, 2, 6.5, 9, "calathea", 0, 1], [Rr, 2, 6, 8, "fern", 0, 3], [L, 1, 6, 8, "fern", 0, 4], [Rr, 1, 6.5, 9, "calathea", 0, 0],
     [L, 0, 7, 12, "snake", 0, 4], [Rr, 0, 7, 11, "ficus", 0, 1]]
      .forEach(([t, ti, rad, hh, kind, tr, pm]) => standPots.push([cx(t), TOP(PS.tower[ti]), 0, rad, hh, tr, pm, kind]));
    standPots.push([0, TOP(PS.middle[0]), 0, 9.5, 24, 0, 0, "monstera"], [0, TOP(PS.middle[1]), 0, 7.5, 18, 0, 4, "snake"]);
    { const gl_ = SUGG_G.growlights = new THREE.Group(), glow = new THREE.MeshBasicMaterial({ color: "#ffe3b0", toneMapped: false });   // v43: an option
      const case_ = reg(new THREE.MeshStandardMaterial({ color: "#1d1e20", roughness: 0.5 })); SVAR_MATS.growlights = [glow];
      for (const t of [L, Rr]) for (const ti of [2, 4]) { const cxx = (t[0] + t[1]) / 2, y = PS.tower[ti] - 2;
        lb(gl_, cxx, y - 1.2, 2, 30, 1.2, 2.4, case_, false); lb(gl_, cxx, y - 1.4, 2, 28, 0.25, 1.8, glow, false);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), new THREE.MeshBasicMaterial({ map: GLOW_TEX, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        pool.position.copy(v3(cxx, y - 18, -d / 2 + 0.6)); gl_.add(pool); }                      // the warm wash on the wall behind, as in the stand's photo
      g.add(gl_); }
    floraSpot(g, () => { const rr = rnd(173); g.userData.floraHold = true;
      for (const [px, py, pz, rad, h, tr, pm, kind] of standPots) potPlant(g, px, py, pz, rad, h, tr, rr, pots[pm], null,
        { terracotta: pm === 2, edgeZ: d / 2, kind: FLORA_STYLE === "easy" ? undefined : kind });
      g.userData.floraHold = false; floraFlush(g); });
    movable("plants", "Your plant stand", g, () => { const [x, z, f] = R.PLANT_LAYOUTS[S.plants].plants; return { x, z, rot: f < 0 ? 180 : 0 }; }, w, d, [wood], false, { when: () => !cornerHides("plants") });   // v37: a window-corner pick takes its place
    // v32: the idea of an uplight on the floor under the stand's open middle, throwing the leaves up the wall behind
    const upl = IDEA_G.plantlight = new THREE.Group(), blk = reg(new THREE.MeshStandardMaterial({ color: "#1b1c1f", roughness: 0.45 }));
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.1, 18), blk); can.position.set(0, 0.05, -0.06); can.rotation.x = -0.35; upl.add(shadow(can));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 18), new THREE.MeshBasicMaterial({ color: "#fff1d6", toneMapped: false })); lens.position.set(0, 0.1, -0.075); lens.rotation.x = -Math.PI / 2 - 0.35; upl.add(lens);
    const sp = new THREE.SpotLight("#ffd9a8", 22, 3, 0.7, 0.6, 2); sp.position.set(0, 0.12, -0.08); sp.target.position.set(0, 1.9, -0.32);
    sp.castShadow = true; sp.shadow.mapSize.set(512, 512); sp.shadow.bias = -0.0004; sp.shadow.camera.near = 0.04; upl.add(sp, sp.target);
    MOV.plants.pivot.add(upl); }
  // v18.1: the client's vinyl stand (their listing): 70 × 32 × 78, black steel, rustic wood; two face-out bays on top, wires below
  { const g = new THREE.Group(), wood = reg(new THREE.MeshStandardMaterial({ color: RS.col, map: OAK_TEX, roughness: 0.65 })); wood.userData.noTint = true;
    const steel = reg(new THREE.MeshStandardMaterial({ color: RS.steel, roughness: 0.45, metalness: 0.6 }));
    const w = RS.w, d = RS.d, h = RS.h, ft = RS.frame_top, p = 2, sy = RS.shelf_y, yb = RS.bottom_y;
    for (const x of [-w / 2 + p / 2, w / 2 - p / 2]) {
      lb(g, x, 0, d / 2 - p / 2, p, ft, p, steel);                                             // front posts to 63 (front is local +z)
      lb(g, x, 0, -d / 2 + p / 2, p, h, p, steel);                                             // rear posts to 78
      const sl = new THREE.Mesh(new THREE.BoxGeometry(p * M, Math.hypot(h - ft, d - p) * M, p * M), steel);   // the slope between them
      sl.position.copy(v3(x, (ft + h) / 2, 0)); sl.rotation.x = -Math.atan2(d - p, h - ft); g.add(shadow(sl));
    }
    lb(g, 0, ft - 6, d / 2 - 1, w, 1.2, 1.2, steel);                                           // the front rail
    lb(g, 0, yb, 0, w - 2 * p, 2, d, wood); lb(g, 0, yb + 2, -d / 2 + 1, w - 2 * p, 10, 1.6, wood);   // bottom shelf and its back board
    lb(g, 0, sy, 0, w - 2 * p, 2, d, wood); lb(g, 0, sy + 2, d / 2 - 0.8, w - 2 * p, RS.lip, 1.6, wood);   // upper shelf and its 10 cm front board
    lb(g, 0, sy + 2, -2, 2, h - sy - 6, d - 8, wood);                                          // the divider between the two bays
    for (const y of [h - 10, h - 22]) lb(g, 0, y, -d / 2 + 1.5, w, 6, 1.6, wood);              // back boards
    const sleeves = ["#e9e3d3", "#2f3e5c", "#d24b33", "#1f1f1f", "#14806d", "#f0c24b", "#7a4fb0", "#e8603c"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })));
    const lp = R.LP, front = new THREE.Group(), lifts = [];                                    // v34: the front LP of each bay lifts out (a group: not merged)
    for (const bx of [-w / 4, w / 4]) for (let k = 0; k < 5; k++) {                            // top bays: LPs leaning back, face-out
      const m = new THREE.Mesh(new THREE.BoxGeometry((RS.bay - 2) * M * 0.97, lp * M, 0.004), sleeves[Math.floor(r() * sleeves.length)]);
      m.position.copy(v3(bx, sy + 2 + lp / 2, d / 2 - 6 - k * 3.2)); m.rotation.x = -0.3; (k ? g : front).add(shadow(m));
      if (!k) { const y0 = m.position.y, z0 = m.position.z; lifts.push(v => { m.position.y = y0 + 0.24 * v; m.position.z = z0 + 0.07 * v; m.rotation.x = -0.3 + 0.38 * v; }); }
    }
    g.add(front);
    WORK.lp = anim(v => lifts.forEach((f, i) => f(Math.min(1, Math.max(0, v * 1.4 - i * 0.4)))));   // the left bay's first, then the right's
    for (let k = 0; k < RS.wires; k++) {                                                        // the wire dividers, and LPs between them
      const zz = d / 2 - 3 - k * (d - 6) / (RS.wires - 1);
      for (const x of [-w / 2 + 12, w / 2 - 12]) lb(g, x, yb + 2, zz, 0.5, RS.wire_h, 0.5, steel, false);
      lb(g, 0, yb + 2 + RS.wire_h - 0.5, zz, w - 24, 0.5, 0.5, steel, false);
      if (k < RS.wires - 1) for (let j = 0; j < 3; j++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(lp * M, lp * M, 0.004), sleeves[Math.floor(r() * sleeves.length)]);
        m.position.copy(v3(0, yb + 2 + lp / 2, zz - 2 - j * 2.5)); m.rotation.x = -0.12; g.add(shadow(m));
      }
    }
    movable("records", "Your vinyl stand", g, () => { const [x, z, f] = R.PLANT_LAYOUTS[S.plants].records; return { x, z, rot: f < 0 ? 180 : 0 }; }, w, d, [wood], false, { when: () => !cornerHides("records") });
    // v32: the idea of a record-care caddy at the end of the bottom shelf, outside the wire dividers: brush, stylus brush, fluid
    const cady = IDEA_G.clean = new THREE.Group(), cad = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 })), xc = -w / 2 + p + 4.6;
    lb(cady, xc, yb + 2, 0, 8.4, 0.8, 26, cad); for (const x of [xc - 3.9, xc + 3.9]) lb(cady, x, yb + 2, 0, 0.6, 8, 26, cad); for (const z of [-12.7, 12.7]) lb(cady, xc, yb + 2, z, 8.4, 8, 0.6, cad);
    lb(cady, xc, yb + 2.8, 7, 3, 12, 2.4, reg(new THREE.MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.8 })));                   // the carbon brush, on end
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.11, 16), reg(new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.3 })));
    bt.position.copy(v3(xc, yb + 2.8 + 5.5, -4)); cady.add(shadow(bt));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.025, 12), reg(new THREE.MeshStandardMaterial({ color: "#2f6fb5", roughness: 0.4 }))); cap.position.copy(v3(xc, yb + 2.8 + 12.2, -4)); cady.add(cap);
    lb(cady, xc + 1.5, yb + 2.8, -9.5, 0.8, 9, 0.8, reg(new THREE.MeshStandardMaterial({ color: "#c9a24b", roughness: 0.5 })));       // the stylus brush
    MOV.records.pivot.add(cady); }
  // the red lamp and the C-table idea are movable too
  MOV.lamp = { id: "lamp", label: "Your red lamp", lamp: true, w: 30, d: 30, mats: [], base: [],
    def: () => { const p = R.LAMP_SPOTS[S.lamp] || R.LAMP_SPOTS[DEF.lamp]; return { x: p.x, z: p.z, rot: 0 }; } };
  Object.defineProperty(MOV.lamp, "pivot", { get: () => lamp });
  if (IDEA_G.ctable) {
    const T = R.IDEAS.ctable, cx = (T.x[0] + T.x[1]) / 2, cz = R.SOFA.end;
    shell.remove(IDEA_G.ctable); IDEA_G.ctable.position.copy(v3(-cx, 0, -cz)); IDEA_G.ctable.position.x = cx * M; IDEA_G.ctable.visible = true;
    movable("ctable", "The C-table", IDEA_G.ctable, () => ({ x: cx, z: cz, rot: 0 }), T.x[1] - T.x[0], T.depth, [], false, { when: () => !!S.ideas.ctable });
    delete IDEA_G.ctable;
  }
  S.added.forEach(a => addThing(a, false));
}
/* things to add: simple stand-ins at real-world sizes, each with its own colour */
const CATALOGUE = {
  armchair: { label: "Armchair", w: 80, d: 80, col: "#b5643f", build(g, m, oak) {     // v32: upholstered, rounded, on tapered oak legs
    fabric(m);                                                                             // v34: a woven cover, piped edges, a scatter cushion
    rlb(g, 0, 14, 2, 74, 14, 72, m, 4); rlb(g, 0, 28, 6, 60, 13, 62, m, 5);                // the base and the seat cushion
    rlb(g, 0, 28, -31, 72, 46, 14, m, 5); rlb(g, 0, 40, -22, 58, 32, 10, m, 4.5).rotation.x = -0.1;   // the back and its cushion, leaning back
    for (const x of [-31, 31]) { rlb(g, x, 28, 2, 12, 34, 72, m, 5); pipe(g, x, 61.8, 2, 58, m); }   // the arms, piped along the top's flat
    pipe(g, 0, 39.5, 35.5, 50, m, true); pipe(g, 0, 26.8, 36.8, 66, m, true);              // on the rounded front edges of the seat and the base
    const sc = rlb(g, 0, 41, -13, 40, 38, 11, fabricMat("#d8c9ad"), 5); sc.rotation.set(-0.32, 0, 0.07);   // an oatmeal linen scatter cushion
    for (const [x, z] of [[-31, -31], [31, -31], [-31, 33], [31, 33]]) taperLeg(g, x, z, 14, oak); } },
  sidetable: { label: "Side table", w: 45, d: 45, col: "#c48c57", build(g, m) {
    lb(g, 0, 48, 0, 45, 2.5, 45, m); for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) lb(g, x, 0, z, 3.5, 48, 3.5, m); } },
  plant: { label: "Tall floor plant", w: 40, d: 40, col: "#d8cfc0", build(g, m) {
    potPlant(g, 0, 0, 0, 16, 26, 0, rnd(5), m, null); } },
  bookcase: { label: "Slim bookcase", w: 60, d: 30, col: "#c48c57", build(g, m) {
    // v34: closer to a real one: a recessed plinth, an overhanging top, books of every size (some leaning, a stack lying flat), two
    // baskets on the bottom shelf, a trailing plant, a framed print, a vase and a candle
    m.map = OAK_TEX; m.color.set("#c48c57"); m.roughness = 0.55;
    lb(g, -29, 0, 0, 2, 178, 30, m); lb(g, 29, 0, 0, 2, 178, 30, m); lb(g, 0, 6, -14.5, 56, 172, 1, m);   // the sides, the back
    lb(g, 0, 0, 11.5, 56, 6, 2, m); lb(g, 0, 178, 0.5, 62, 2.4, 31.5, m);                  // the kick board, set back; the top
    for (const y of [6, 42, 78, 114, 150]) lb(g, 0, y, 0, 56, 2, 30, m);
    const r = rnd(9), mt = c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.62 }));
    const spines = ["#2f3e5c", "#d24b33", "#e9e3d3", "#14806d", "#f0c24b", "#6b4f7a", "#1f1f21", "#b98250", "#8b9878"].map(mt), pages = mt("#efe9dc");
    const book = (x, y, bw, bh, bd, lean = 0) => {
      const b = lb(g, x, y, 13 - bd / 2 - r() * 1.2, bw, bh, bd, spines[Math.floor(r() * spines.length)]);
      if (lean) { b.rotation.z = lean; b.position.x -= Math.sin(lean) * bh / 2 * M; b.position.y -= (1 - Math.cos(lean)) * bh / 2 * M; }
      return b;
    };
    const row = (y, x0, x1) => { let x = x0; while (x < x1) { const bw = 1.8 + r() * 3.2; book(x + bw / 2, y, bw, 19 + r() * 11, 15 + r() * 7); x += bw + 0.2; } return x; };
    // the bottom shelf: two seagrass baskets
    const sea = reg(new THREE.MeshStandardMaterial({ color: "#b89a6c", roughness: 1, bumpMap: HESSIAN, bumpScale: 1.2 }));
    for (const x of [-13.5, 13.5]) { lb(g, x, 8, 0, 25, 24, 26, sea); lb(g, x, 31, 0, 25.6, 1.4, 26.6, sea); }
    // books upright, then two leaning on them
    let x = row(44, -26, 12); book(x + 3.2, 44, 2.6, 27, 19, 0.32); book(x + 7.4, 44, 3, 24, 17, 0.34);
    // a stack lying flat, a small trailing plant, a framed print
    for (let i = 0, yy = 80; i < 4; i++) { const bh = 2.2 + r() * 2; lb(g, -18 + (r() - 0.5) * 2, yy, 2, 22 - i * 1.5, bh, 17 - i, spines[(i * 3 + 1) % spines.length]); yy += bh; }
    potPlant(g, 2, 80, 4, 6, 6, 3, rnd(41), mt("#d8cfc0"), null);
    const fr = lb(g, 18, 80, -10, 17, 22, 1.6, mt("#1f1f21")); fr.rotation.x = 0.12;
    lb(g, 18, 82.4, -9.0, 13, 17, 0.2, mt("#e7c9a0")).rotation.x = 0.12;
    // books again, and a bookend
    x = row(116, -26, 14); lb(g, x + 2, 116, 4, 1, 14, 10, mt("#2a2a2c"));
    // the top shelf: a vase, a candle, a few books
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 20), mt("#c46c45")); vase.position.copy(v3(-17, 162, 2)); g.add(shadow(vase));
    const wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.12 }));
    const cdl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 18), wax); cdl.position.copy(v3(-5, 157, 4)); g.add(shadow(cdl));
    row(152, 4, 25); } },
  beanbag: { label: "Beanbag", w: 80, d: 80, col: "#40609a", build(g, m) {     // v32: slumped, with a hollow to sit in
    fabric(m, 1);                                                                          // v34: a cord cover, a welted seam, a carry handle
    const geo = new THREE.SphereGeometry(0.4, 48, 28), q = geo.attributes.position;
    for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x);
      const sag = 1 + 0.035 * Math.sin(a * 6) * Math.max(0, 1 - Math.abs(y) / 0.4);          // soft folds where the cover slumps
      q.setX(i, x * sag); q.setZ(i, z * sag);
      q.setY(i, y > 0 ? y * 0.78 - 0.1 * Math.max(0, 1 - r / 0.22) * (y / 0.4) : y * 0.62); }
    geo.computeVertexNormals(); const b = new THREE.Mesh(geo, m); b.position.y = 0.25; g.add(shadow(b));
    const ring = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, rr = 0.4 * (1 + 0.035 * Math.sin(a * 6)) + 0.002; ring.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
    const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 144, 0.006, 6, true), m); seam.position.y = 0.25; g.add(seam);   // on the folds, round its widest
    const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 18, Math.PI), m); hdl.position.set(0, 0.45, -0.31); hdl.rotation.x = -0.7; g.add(hdl); } },
  footstool: { label: "Footstool", w: 50, d: 50, col: "#34507f", build(g, m, oak) {
    rlb(g, 0, 12, 0, 50, 28, 50, m, 5); for (const [x, z] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) taperLeg(g, x, z, 12, oak); } },
  cushion: { label: "Floor cushion", w: 60, d: 60, col: "#e2a33a", build(g, m) { rlb(g, 0, 0, 0, 60, 14, 60, m, 5); } },
  crate: { label: "Record crate", w: 36, d: 36, col: "#c49a6c", build(g, m) {
    lb(g, 0, 0, 0, 36, 2, 36, m); lb(g, -17, 0, 0, 2, 30, 36, m); lb(g, 17, 0, 0, 2, 30, 36, m); lb(g, 0, 0, -17, 36, 30, 2, m); lb(g, 0, 0, 17, 36, 14, 2, m);
    const cols = ["#e9e3d3", "#2f3e5c", "#d24b33", "#1f1f1f", "#14806d"].map(c => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })));
    for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.004), cols[k]); s.position.copy(v3(0, 17, 12 - k * 5)); s.rotation.x = -0.15; g.add(s); } } },
};
/* v20: more decor to add; v21: more furniture */
Object.assign(CATALOGUE, {
  rattan: { label: "Rattan armchair", w: 70, d: 72, col: "#c7a26e", build(g, m, oak) {
    const seat = reg(new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.95 }));
    lb(g, 0, 38, 2, 62, 10, 60, seat);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.42, 28, 1, true, Math.PI * 0.15, Math.PI * 1.7), m);
    shell.material.side = THREE.DoubleSide; shell.position.set(0, 0.6, 0.03); shell.rotation.y = Math.PI; g.add(shadow(shell));
    for (const [x, z] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) lb(g, x, 0, z, 3, 38, 3, oak); } },
  ladder: { label: "Blanket ladder (oak)", w: 45, d: 30, col: "#c48c57", build(g, m) {
    const f = new THREE.Group(); lb(f, -20, 0, 0, 3, 165, 3, m); lb(f, 20, 0, 0, 3, 165, 3, m);
    for (const y of [30, 70, 110, 150]) lb(f, 0, y, 0, 40, 2.5, 2.5, m);
    const th = reg(new THREE.MeshStandardMaterial({ color: "#7a8a6a", roughness: 1 })); lb(f, 0, 96, 1.5, 36, 26, 1.2, th);
    f.rotation.x = 0.16; f.position.z = -0.1; g.add(f); } },
  bench: { label: "Oak bench", w: 100, d: 35, col: "#c48c57", build(g, m) {
    lb(g, 0, 40, 0, 100, 4, 35, m); for (const x of [-44, 44]) lb(g, x, 0, 0, 4, 40, 31, m); } },
  arclamp: { label: "Arc floor lamp", w: 40, d: 40, col: "#1f1f21", build(g, m) {
    lb(g, 0, 0, 0, 34, 3, 34, m);
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * 0.9, 0.03 + Math.sin(t * Math.PI * 0.62) * 1.8, 0)); }
    const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.009, 8), m); g.add(arc);
    const end = pts[pts.length - 1], shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 28, 1, true), reg(new THREE.MeshStandardMaterial({ color: "#e9e3d3", side: THREE.DoubleSide, emissive: "#ffd9a8", emissiveIntensity: 0.25 })));
    shade.position.set(end.x, end.y - 0.12, 0); g.add(shade); } },
  vase: { label: "Floor vase with grasses", w: 30, d: 30, col: "#d9cfbf", build(g, m) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 24), m); v.position.y = 0.275; g.add(shadow(v));
    const stem = reg(new THREE.MeshStandardMaterial({ color: "#c9b48a", roughness: 0.9 })), r = rnd(13);
    for (let k = 0; k < 14; k++) { const h = 0.55 + r() * 0.45, c = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.003, h, 4), stem);
      c.position.set((r() - 0.5) * 0.08, 0.55 + h / 2, (r() - 0.5) * 0.08); c.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5); g.add(c);
      const plume = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), stem); plume.scale.set(0.6, 2.2, 0.6); plume.position.copy(c.position).add(new THREE.Vector3(0, h / 2, 0).applyEuler(c.rotation)); g.add(plume); } } },
  pouffe: { label: "Knitted pouffe", w: 50, d: 50, col: "#c7643a", build(g, m) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 32), m); b.position.y = 0.2; g.add(shadow(b));
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 8, 32), m); t.rotation.x = Math.PI / 2; t.position.y = 0.39; g.add(t); } },
  basket: { label: "Seagrass basket (throws)", w: 45, d: 45, col: "#b89a6c", build(g, m) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.19, 0.42, 28, 1, true), m); b.material.side = THREE.DoubleSide; b.position.y = 0.21; g.add(shadow(b));
    lb(g, 0, 0, 0, 36, 1, 36, m);
    const th = reg(new THREE.MeshStandardMaterial({ color: "#e9e3d3", roughness: 1 })), roll = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), th);
    roll.scale.set(1, 0.55, 1); roll.position.y = 0.42; g.add(shadow(roll)); } },
  mirror: { label: "Floor mirror (oak)", w: 60, d: 8, col: "#c48c57", build(g, m) {
    const glass = reg(new THREE.MeshStandardMaterial({ color: "#ffffff", map: MIRROR_SHEEN, roughness: 0.12, metalness: 0.25 }));   // v32: was black (metal with nothing to reflect)
    const f = new THREE.Group(); lb(f, 0, 0, 0, 60, 170, 3, m); const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.62), glass); gl.position.set(0, 0.85, 0.016); f.add(gl);
    f.rotation.x = -0.12; f.position.z = 0.04; g.add(f); } },
  lantern: { label: "Lantern and candles", w: 25, d: 25, col: "#1f1f21", build(g, m) {
    lb(g, 0, 0, 0, 24, 1.5, 24, m); lb(g, 0, 44, 0, 24, 2, 24, m);
    for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) lb(g, x, 0, z, 1.5, 45, 1.5, m);
    const wax = reg(new THREE.MeshStandardMaterial({ color: "#f3ecdc", roughness: 0.8, emissive: "#ffb35a", emissiveIntensity: 0.15 }));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16), wax); c.position.y = 0.115; g.add(c); } },
});
function addThing(a, fresh = true) {
  const C = CATALOGUE[a.type]; if (!C) return;
  const m = reg(new THREE.MeshStandardMaterial({ color: C.col, roughness: 0.7 })), oak = reg(new THREE.MeshStandardMaterial({ color: "#c48c57", map: OAK_TEX, roughness: 0.55 }));
  const g = new THREE.Group(); C.build(g, m, oak);
  movable(a.id, C.label, g, () => ({ x: a.x, z: a.z, rot: 0 }), C.w, C.d, [m], false, { added: true });
  if (fresh) { S.added.push(a); placeAll(); store.set(KEY, S); }
}
/* ---------------------------------------------------------------- edit mode: tap to pick, drag to move, the panel to turn, colour, remove */
const ray = new THREE.Raycaster(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let selId = null, selBox = null, selSurf = null, drag = null, preEditView = null, downXY = null;
function ndc(e) { const r = canvas.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
function hitMovable(e) {
  ray.setFromCamera(ndc(e), camera);
  const roots = Object.values(MOV).map(it => it.pivot).filter(p => p && p.visible);
  const hit = ray.intersectObjects(roots, true).find(h => shown(h.object));
  if (!hit) return null;
  let o = hit.object; while (o && !o.userData.movId) o = o.parent;
  return o ? o.userData.movId : null;
}
function hitSurface(e) {
  ray.setFromCamera(ndc(e), camera);
  for (const h of ray.intersectObjects([shell, fixtures, ...Object.values(G)], true)) {
    if (!shown(h.object)) continue;
    const m = h.object.material; if (!m || Array.isArray(m)) return null;
    if (m.userData && m.userData.ratio !== undefined) { const ch = m.userData.ch; return ch === "ceil" ? "ceil" : ch === "trim" ? "skirt" : ch.startsWith("w:") ? ch : "walls"; }   // v38: a wall by name
    return null;                                   // something else is in front
  }
  return null;
}
function floorAt(e) { ray.setFromCamera(ndc(e), camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(floorPlane, p) ? { x: -p.x / M, z: p.z / M } : null; }
function halfOf(it, rot) {   // a piece's half-width along x and z when turned to rot
  const q = ((rot % 180) + 180) % 180, hx = q === 90 ? it.d / 2 : q === 0 ? it.w / 2 : Math.max(it.w, it.d) / 2, hz = q === 90 ? it.w / 2 : q === 0 ? it.d / 2 : hx;
  return { hx, hz };
}
const zmaxAt = (x, hx) => x + hx <= R.ALC_W ? R.ALC_D : x - hx >= R.BREAST_X[1] ? R.RECESS_Z : 0;   // the wall in front of the window: the alcove, the breast or the recess
function clampItem(it, x, z, rot) {
  const { hx, hz } = halfOf(it, rot);
  x = Math.min(Math.max(x, hx), R.W - hx);
  const zmax = zmaxAt(x, hx);
  z = Math.min(Math.max(z, R.WINDOW_Z + hz), zmax - hz);
  // v19: within 5 cm of a wall, it goes flush against it
  if (x - hx < SNAP) x = hx; else if (R.W - hx - x < SNAP) x = R.W - hx;
  if (z - hz - R.WINDOW_Z < SNAP) z = R.WINDOW_Z + hz; else if (zmax - hz - z < SNAP) z = zmax - hz;
  return { x: Math.round(x), z: Math.round(z) };
}
const SNAP = 15;   // v27: within 15 cm of a wall it goes flush (was 5): "make it easier to clip an item somewhere like a wall"
function wallsTouched(it, p) {   // which walls a piece is flush against now
  const { hx, hz } = halfOf(it, p.rot), zmax = zmaxAt(p.x, hx);
  return { x0: p.x - hx < 1.5, xW: R.W - p.x - hx < 1.5, zmin: p.z - hz - R.WINDOW_Z < 1.5, zmax: zmax - p.z - hz < 1.5 };
}
function turnItem(id, step) {    // v27: a turn keeps a piece against whichever walls it was against
  const it = MOV[id], p = spotOf(id), on = wallsTouched(it, p), rot = ((p.rot + step) % 360 + 360) % 360, { hx, hz } = halfOf(it, rot);
  let x = p.x, z = p.z;
  if (on.x0) x = hx; if (on.xW) x = R.W - hx;
  if (on.zmin) z = R.WINDOW_Z + hz; if (on.zmax) z = zmaxAt(x, hx) - hz;
  const c = clampItem(it, x, z, rot); setLayout(id, { rot, x: c.x, z: c.z });
}
function backToWall(id) {       // v27: to the nearest wall, its back to it (a piece's back is its -z side: the armchair's back, the bookcase's back panel)
  const it = MOV[id], p = spotOf(id), h0 = halfOf(it, p.rot);
  const walls = [{ d: p.x - h0.hx, rot: 270, k: "x0" }, { d: R.W - p.x - h0.hx, rot: 90, k: "xW" },
                 { d: p.z - h0.hz - R.WINDOW_Z, rot: 0, k: "zmin" }, { d: zmaxAt(p.x, h0.hx) - p.z - h0.hz, rot: 180, k: "zmax" }];
  const w = walls.sort((a, b) => a.d - b.d)[0], { hx, hz } = halfOf(it, w.rot);
  let x = p.x, z = p.z;
  if (w.k === "x0") x = hx; else if (w.k === "xW") x = R.W - hx; else if (w.k === "zmin") z = R.WINDOW_Z + hz; else z = zmaxAt(x, hx) - hz;
  const c = clampItem(it, x, z, w.rot); setLayout(id, { rot: w.rot, x: c.x, z: c.z });
}
/* v19: undo, the last ten changes to the layout (moves, turns, colours, removals, additions) */
const UNDO = [];
function snapshot() { return JSON.stringify({ layout: S.layout, added: S.added }); }
function pushUndo() { UNDO.push(snapshot()); if (UNDO.length > 10) UNDO.shift(); undoBtn(); }
function undoBtn() { const b = qs("#r3d-undo"); if (b) b.disabled = !UNDO.length; }
function restoreLayout(o) {
  S.added.forEach(a => { const it = MOV[a.id]; if (it) { movers.remove(it.pivot); delete MOV[a.id]; } });
  S.added = []; S.layout = JSON.parse(JSON.stringify(o.layout || {}));
  (o.added || []).forEach(a => addThing(Object.assign({}, a), true));
  if (o.plants && R.PLANT_LAYOUTS[o.plants]) S.plants = o.plants;
  select(null); built.lamp = null; applyState(); syncButtons();
}
function undo() { const prev = UNDO.pop(); if (!prev) return; restoreLayout(JSON.parse(prev)); undoBtn(); }
function setLayout(id, patch) { S.layout[id] = Object.assign({}, S.layout[id], patch); if (MOV[id] && MOV[id].added) { const a = S.added.find(a => a.id === id); if (a) Object.assign(a, patch); } }
function select(id) {
  selId = id; selSurf = null;
  if (selBox) { scene.remove(selBox); selBox = null; }
  if (id && MOV[id] && MOV[id].pivot) { selBox = new THREE.BoxHelper(MOV[id].pivot, 0xffc46b); scene.add(selBox); }
  editPanel(); dirty();
}
function editPanel() {
  const P = qs("#r3d-sel"); if (!P) return;
  P.hidden = !(selId || selSurf);
  if (selSurf) {
    const one = selSurf.startsWith("w:") ? selSurf.slice(2) : null;
    const lab = one ? WALL_NAME[one] : { walls: "All walls", ceil: "Ceiling", skirt: "Skirting and radiator" }[selSurf];
    qs("#r3d-selname").textContent = lab;
    const wallHex = paintHex(), key = selSurf === "ceil" ? "ceil" : "skirt";
    const cur = one ? chHex(selSurf) : selSurf === "walls" || S[key] === "match" ? wallHex : S[key];
    qs("#r3d-selcol").value = cur; qs("#r3d-swatches").hidden = false;
    const chips = Object.entries(R.PAINTS).map(([k, { hex: h, name: n }]) => `<button type="button" class="chip" data-swatch="${k}"><span class="dot" style="background:${h}"></span>${n.replace(/ No\..*/, "").replace("Farrow & Ball ", "").replace("Little Greene ", "")}</button>`).join("");
    qs("#r3d-swatches").innerHTML = (one ? `<button type="button" class="chip" data-swatch="match">Same as the others</button>` + chips : selSurf === "walls" ? chips
      : `<button type="button" class="chip" data-swatch="match">Same as the walls</button><button type="button" class="chip" data-swatch="${selSurf === "ceil" ? "#f2f0ea" : "#ece8dd"}">${selSurf === "ceil" ? "White" : "Off-white"}</button>`);
    qsa("[data-sel=turn],[data-sel=turn45],[data-sel=turn15],[data-sel=wall],[data-sel=remove],[data-sel=copy]").forEach(b => b.hidden = true); qs("#r3d-selsize").textContent = "";
    return;
  }
  if (!selId) return;
  const it = MOV[selId], L = S.layout[selId] || {};
  qs("#r3d-selname").textContent = it.label;
  qs("#r3d-selsize").textContent = it.w && it.d ? `${Math.round(it.w)} × ${Math.round(it.d)} cm` : "";   // v19: its footprint
  qsa("[data-sel=copy]").forEach(b => b.hidden = !it.added);
  qs("#r3d-swatches").hidden = true;
  qsa("[data-sel=turn],[data-sel=turn45],[data-sel=turn15],[data-sel=wall]").forEach(b => b.hidden = !!it.lamp || !!it.fixed);
  qsa("[data-sel=remove]").forEach(b => b.hidden = false);
  qs("#r3d-selcol").parentElement.hidden = !it.mats.length;
  if (it.mats.length) qs("#r3d-selcol").value = L.col || it.base[0];
}
function setEdit(on) {
  S.edit = on; root.classList.toggle("editing", on);
  qs("#r3d-editbtn").setAttribute("aria-pressed", String(on));
  qs("#r3d-editbar").hidden = !on;
  if (on) { preEditView = S.view; if (!(VIEWS[S.view] || {}).above) setView("room"); const pn = document.getElementById("r3d-panel"); if (pn) pn.hidden = true; closePop(); }   // v21: edit from the whole room, cut away (v25: the Tools panel steps aside)
  else { select(null); qs("#r3d-addlist").hidden = true; if (preEditView && preEditView !== S.view) setView(preEditView); }
  dirty();
}
function addList() {
  const removed = Object.values(MOV).filter(it => !it.added && (S.layout[it.id] || {}).off);
  qs("#r3d-addlist").innerHTML = removed.map(it => `<button type="button" class="chip" data-putback="${it.id}">↩ ${it.label}</button>`).join("")
    + Object.entries(CATALOGUE).map(([k, c]) => `<button type="button" class="chip" data-add="${k}">${c.label}</button>`).join("");
}
canvas.addEventListener("pointerdown", e => {
  if (!S.edit || e.button > 0) return;
  downXY = [e.clientX, e.clientY];
  const id = hitMovable(e);
  if (!id) return;
  select(id);
  const it = MOV[id], p = spotOf(id), f = floorAt(e);
  if (!f || it.fixed) { downXY = null; return; }        // v27: built-in pieces are selected, not dragged (and the tap isn't a wall's)
  drag = { id, dx: p.x - f.x, dz: p.z - f.z, x0: p.x, z0: p.z, moved: false, before: snapshot() };
  controls.enabled = false; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", e => {
  if (!drag) return;
  const f = floorAt(e); if (!f) return;
  const it = MOV[drag.id], p = spotOf(drag.id), c = clampItem(it, f.x + drag.dx, f.z + drag.dz, p.rot);
  drag.moved = true; drag.x = c.x; drag.z = c.z;
  if (it.lamp) { lamp.position.set(-(c.x - drag.x0) * M, 0, (c.z - drag.z0) * M); }
  else it.pivot.position.copy(v3(c.x, 0, c.z));
  if (selBox) selBox.update(); dirty();
});
function endDrag(e) {
  if (drag) {
    const d = drag; drag = null; controls.enabled = true;
    if (d.moved) { UNDO.push(d.before); if (UNDO.length > 10) UNDO.shift(); undoBtn(); setLayout(d.id, { x: d.x, z: d.z }); if (MOV[d.id].lamp) { lamp.position.set(0, 0, 0); built.lamp = null; applyState(); select(d.id); } else { placeAll(); store.set(KEY, S); } }
    return;
  }
  if (S.edit && downXY && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) < 6) {   // a tap on nothing movable: a surface to paint?
    const surf = hitSurface(e);
    select(null); selSurf = surf; editPanel();
  }
  downXY = null;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { if (drag) { drag = null; controls.enabled = true; placeAll(); } });
qs("#r3d-editbtn").addEventListener("click", () => setEdit(!S.edit));
qs("#r3d-editdone")?.addEventListener("click", () => setEdit(false));   // v26: a way out of Edit room with the Tools panel shut
qs("#r3d-addfrom")?.addEventListener("click", () => {   // v26: Extras' "Add a piece of furniture": Edit room, its list open
  if (window.DemmaTools) window.DemmaTools.close(); if (!S.edit) setEdit(true); addList(); qs("#r3d-addlist").hidden = false; });
qs(".r3d-edit").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.closest("#r3d-sel") || b.id === "r3d-editbtn") return;
  if (b.id === "r3d-add") { addList(); const l = qs("#r3d-addlist"); l.hidden = !l.hidden; return; }
  if (b.id === "r3d-undo") { undo(); return; }
  if (b.id === "r3d-share") { shareLayout(); return; }
  if (b.id === "r3d-useshared") { if (sharedDoc) { pushUndo(); restoreLayout(sharedDoc); qs("#r3d-sharest").textContent = "Using the shared layout (↶ Undo goes back)."; } return; }
  if (b.id === "r3d-layreset") { if (!confirm("Put everything back where the plan has it, and take out what you've added?")) return;
    pushUndo();
    S.added.forEach(a => { const it = MOV[a.id]; if (it) { movers.remove(it.pivot); delete MOV[a.id]; } }); S.added = []; S.layout = {};
    select(null); built.lamp = null; applyState(); return; }
  if (b.dataset.putback) { pushUndo(); setLayout(b.dataset.putback, { off: false }); qs("#r3d-addlist").hidden = true; if (MOV[b.dataset.putback].lamp) built.lamp = null; applyState(); select(b.dataset.putback); return; }
  if (b.dataset.add) {
    const t = controls.target, c = clampItem(CATALOGUE[b.dataset.add], -t.x / M, Math.min(t.z / M, -40), 0);
    const a = { id: "a" + Date.now().toString(36), type: b.dataset.add, x: c.x, z: c.z };
    pushUndo(); addThing(a); qs("#r3d-addlist").hidden = true; select(a.id); applyState();
  }
});
qs("#r3d-sel").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const k = b.dataset.sel;
  if (b.dataset.swatch) {
    const v = b.dataset.swatch;
    if (selSurf.startsWith("w:")) setWall(selSurf.slice(2), v);
    else if (selSurf === "walls") S.paint = v; else S[selSurf === "ceil" ? "ceil" : "skirt"] = v;
    repaint(); syncButtons(); updateCaption(); store.set(KEY, S); dirty(); editPanel(); return;
  }
  if (k === "done") { select(null); return; }
  if (!selId) return;
  const it = MOV[selId];
  if (k === "turn" || k === "turn45" || k === "turn15" || k === "wall" || k === "remove" || k === "copy") pushUndo();
  if (k === "copy" && it.added) {     // v19: another of the same, a little way off, turned and coloured the same
    const src = S.added.find(a => a.id === selId), p = spotOf(selId), L = S.layout[selId] || {}, c = clampItem(it, p.x + 25, p.z + 25, p.rot);
    const a = { id: "a" + Date.now().toString(36), type: src.type, x: c.x, z: c.z };
    addThing(a); setLayout(a.id, { rot: p.rot, col: L.col }); placeAll(); store.set(KEY, S); select(a.id); applyState(); return;
  }
  if (k === "turn" || k === "turn45") { turnItem(selId, k === "turn" ? 90 : 45); placeAll(); store.set(KEY, S); }   // v27: a quarter turn, or an eighth
  if (k === "turn15") { turnItem(selId, e && e.shiftKey ? 5 : 15); placeAll(); store.set(KEY, S); }                  // v38: finer, 5° with Shift
  if (k === "wall") { backToWall(selId); placeAll(); store.set(KEY, S); }
  if (k === "remove") {
    if (it.added) { movers.remove(it.pivot); delete MOV[selId]; S.added = S.added.filter(a => a.id !== selId); delete S.layout[selId]; }
    else { setLayout(selId, { off: true }); if (it.lamp) built.lamp = null; if (it.fixed) placeChairs(); }
    select(null); applyState();
  }
});
qs("#r3d-selcol").addEventListener("pointerdown", () => { if (selId) pushUndo(); });   // one undo step per colour pick
qs("#r3d-selcol").addEventListener("input", e => {
  const v = e.target.value;
  if (selSurf && selSurf.startsWith("w:")) { setWall(selSurf.slice(2), v); repaint(); syncButtons(); updateCaption(); }
  else if (selSurf === "walls") { S.paint = "custom"; S.custom = v; repaint(); syncButtons(); updateCaption(); }
  else if (selSurf) { S[selSurf === "ceil" ? "ceil" : "skirt"] = v; repaint(); }
  else if (selId) { setLayout(selId, { col: v }); placeAll(); }
  store.set(KEY, S); dirty();
});
document.addEventListener("keydown", e => { if (S.edit && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); } });
/* v19: one layout for both of you, kept in the plan page's shared database (only where the page has one) */
let ldb = null, sharedDoc = null, sharing = Promise.resolve();
(async () => {
  try { ldb = (window.sharedStore && window.sharedStore.use) ? await window.sharedStore.use("db") : null; } catch (e) { ldb = null; }
  if (!ldb) return;
  qsa(".r3d-share").forEach(b => b.hidden = false);
  if (qs("#r3d-picksave")) qs("#r3d-picksave").hidden = false;   // v22: picks can be saved for the next round
  ldb.doc("layouts/shared").onSnapshot(snap => { sharedDoc = snap.exists ? snap.data() : null; shareStatus(); }, () => { qsa(".r3d-share").forEach(b => b.hidden = true); });
  ldb.collection("setups").onSnapshot(snap => {   // v52: the plans saved for us, to open again
    snap.docChanges().forEach(ch => { if (ch.type === "removed") delete SETUPS[ch.doc.id]; else SETUPS[ch.doc.id] = ch.doc.data(); });
    drawSetups(); }, () => {});
})();
/* v52: Your saved plans: each one saved for us (Save my plan, then Save for us), newest first, opens the room just as it was saved */
const SETUPS = {};
function drawSetups() {
  const box = qs("#r3d-setups"); if (!box) return;
  const L = Object.entries(SETUPS).filter(([, d]) => d && d.look).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).slice(0, 8);
  box.hidden = !L.length;
  const esc = t => String(t || "").replace(/[<&"]/g, "");
  box.innerHTML = '<span class="label">Your saved plans</span>' + L.map(([id, d]) => {
    let when = ""; try { when = new Date(d.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch (e) {}
    return `<button type="button" class="chip" data-setup="${esc(id)}">${esc(d.name) || "A plan"}${when ? ` · ${when}` : ""}</button>`; }).join("");
}
qs("#r3d-setups")?.addEventListener("click", e => { const b = e.target.closest("[data-setup]"); if (!b) return; const d = SETUPS[b.dataset.setup];
  if (d && d.look && applyLook(b64u(JSON.stringify(d.look)))) toast(`Opened: ${d.name || "your plan"}`); });
function shareStatus() {
  const st = qs("#r3d-sharest"), use = qs("#r3d-useshared"); if (!st) return;
  use.disabled = !sharedDoc;
  if (!sharedDoc) { st.textContent = "No shared layout yet."; return; }
  let when = ""; try { when = new Date(sharedDoc.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) {}
  st.textContent = `Shared layout saved ${when}.`;
}
function shareLayout() {
  if (!ldb) return;
  const st = qs("#r3d-sharest"); st.textContent = "Saving…";
  const body = JSON.parse(JSON.stringify({ layout: S.layout, added: S.added, plants: S.plants, at: new Date().toISOString() }));
  sharing = sharing.then(() => ldb.doc("layouts/shared").set(body)).then(() => { st.textContent = "Saved: you'll both see this layout under “Use the shared layout”."; },
    e => { st.textContent = e && e.code === "invalid_argument" ? "This view can't save (read-only)." : "Couldn't save. Try again in a moment."; });
}
/* v22: "Your picks": the ideas, suggestions and decor switched on, their rough cost added up, copied or saved as a note */
const PD = (() => { try { return JSON.parse(document.getElementById("picks-data").textContent); } catch (e) { return { ideas: {}, sugg: {}, decor: {} }; } })();
function picks() {
  const items = [];
  for (const [k, on] of Object.entries(S.ideas)) if (on && PD.ideas[k]) items.push({ kind: "Idea", name: PD.ideas[k][0], lo: PD.ideas[k][1], hi: PD.ideas[k][2], plan: !!DEF.ideas[k] });
  for (const [k, on] of Object.entries(S.sugg)) if (on && PD.sugg[k]) {
    const ver = PD.svar && PD.svar[k] && PD.svar[k][svarOf(k)];   // v28: which version
    items.push({ kind: "Suggestion", name: PD.sugg[k][0] + (ver ? ` (${ver.toLowerCase()})` : ""), lo: PD.sugg[k][1], hi: PD.sugg[k][2],
                 plan: !!DEF.sugg[k] && svarOf(k) === ((DEF.svar || {})[k] || SVAR[k]?.[0][0]) }); }
  for (const k of Object.keys(DEF.decor)) if (S.decor[k] !== DEF.decor[k] && PD.decor[k]) {
    const [lab, names] = PD.decor[k], c = k === "cushions" && PD.ideas.cushions;
    items.push({ kind: "Decor", name: `${lab}: ${names[S.decor[k]] || S.decor[k]}`, lo: c ? c[1] : 0, hi: c ? c[2] : 0 });
  }
  return items;
}
const pickText = items => items.map(i => `${i.kind}: ${i.name}${i.hi ? ` (about £${i.lo}–${i.hi})` : ""}`).join("\n");
function updatePicks() {
  updatePlanBar();                                                        // v39
  const el = qs("#r3d-picklist"); if (!el) return;
  const items = picks(), lo = items.reduce((a, i) => a + i.lo, 0), hi = items.reduce((a, i) => a + i.hi, 0);
  el.innerHTML = items.length ? items.map(i => `<b>${i.name}</b>${i.hi ? ` <span class="r3d-cost">£${i.lo}–${i.hi}</span>` : ""}`).join(" · ")
      + (hi ? `<br>About £${lo}–${hi} together, none of it in the plan's costs.` : "")
    : "Nothing switched on yet: turn on an idea, a suggestion or a decor choice and it shows here.";
  qs("#r3d-pickcopy").disabled = qs("#r3d-picksave").disabled = !items.length;
}
qs("#r3d-pickcopy")?.addEventListener("click", () => {
  const items = picks(), st = qs("#r3d-pickst"), text = "Our picks from the 3D room:\n" + pickText(items);
  const done = () => { st.textContent = "Copied: paste it into your next message."; };
  try { navigator.clipboard.writeText(text).then(done, () => { qs("#r3d-picklist").textContent = text; st.textContent = "Select the list above to copy it."; }); }
  catch (e) { qs("#r3d-picklist").textContent = text; st.textContent = "Select the list above to copy it."; }
});
qs("#r3d-picksave")?.addEventListener("click", () => {
  if (!ldb) return;
  const items = picks(), st = qs("#r3d-pickst"); st.textContent = "Saving…";
  ldb.doc("layouts/picks").set(JSON.parse(JSON.stringify({ items, text: pickText(items), at: new Date().toISOString() })))
    .then(() => { st.textContent = "Saved for the next round."; }, e => { st.textContent = e && e.code === "invalid_argument" ? "This view can't save (read-only)." : "Couldn't save. Try again in a moment."; });
});
/* v18: if the graphics card gives up (most often HD with shadows on a phone), say so and come back in Fast. v35: the browser usually
   gives the context back within a second or two: then the room rebuilds itself in Fast where it was, no reload; the button stays as
   the way out if it doesn't come back */
let glLost = false;
canvas.addEventListener("webglcontextlost", e => {
  e.preventDefault(); glLost = true; S.quality = "fast"; S.picked = true; store.set(KEY, S);
  msg.hidden = false; root.classList.remove("ready");
  msg.innerHTML = 'The 3D room ran out of graphics memory; bringing it back in Fast… <button type="button" class="btn" onclick="location.reload()">Reload it</button>';
  noteError("context", "WebGL context lost");
});
canvas.addEventListener("webglcontextrestored", () => {
  glLost = false; msg.hidden = true; root.classList.add("ready");
  applyLight(); syncButtons(); if (gl.shadowMap.enabled) gl.shadowMap.needsUpdate = true; precompile(); dirty();
  toast("The 3D room is back, in Fast");
});

/* ---------------------------------------------------------------- views */
const VIEWS = {
  // v21, client: "the default 3D room render to be at the best viewing to see most if not all the room without clipping or obstruction":
  // from above the window side, the window wall cut away (updateCut): the media wall, the breast, the door, the stairs, the table's wall,
  // the PC wall, the sofa and the rug in one picture
  room:    { label: "The whole room", eye: [250, 440, -540], at: [238, 60, -118], fov: 50, above: true },
  livalone: { label: "The living room on its own", eye: [-170, 520, 230], at: [240, 40, -140], fov: 46, above: true },   // v78b: from the hall's corner, the ceiling off
  landing: { label: "Landing", eye: [330, 425, 250], at: [345, 330, -60], fov: 80, box: [288, 402, 275, 485, -72, 256] },     // v66: from the top of the stairs
  hall:    { label: "Entrance hall", eye: [372, 160, 413], at: [352, 95, 60], fov: 80, box: [310, 398, 15, 225, 50, 416] },   // v69: the wall moved to 303.5   // v66: in from the front door
  garage:  { label: "Garage", eye: [250, 145, 483], at: [100, 40, 120], fov: 80, box: [8, 284, -10, 215, 52, 493] },          // v66: from inside its door
  wc:      { label: "WC", eye: [420, -95, -142], at: [420, -190, -290], fov: 80, box: [380, 462, -255, -30, -304, -140] },      // v66: from its door
  bath:    { label: "Bathroom", eye: [325, 424, -48], at: [410, 318, -240], fov: 84, box: [288, 462, 275, 485, -282, -44] },   // v75/v76/v77: from its door (v77 in the corner)   // v65: from its door, as the client's photos
  master:  { label: "Master bedroom", eye: [262, 428, 200], at: [20, 330, 300], fov: 80, box: [10, 266, 275, 485, 126, 494] },   // v72: past the 1 m cupboard   // v63: from its door, the bed facing you
  bed2:    { label: "Music room", eye: [44, 428, 30], at: [222, 318, -205], fov: 80, box: [12, 262, 275, 485, -280, 48] },   // v72: bigger behind the master   // v66: the music room from over the day bed: the keyboard, the desk under the window, the guitars
  office:  { label: "The office", eye: [298, 440, 282], at: [445, 340, 440], fov: 74, box: [290, 460, 275, 485, 282, 492] },   // v68: 225 deep   // v61: bedroom 3 from its door, the new desk ahead
  kitchen: { label: "The kitchen", eye: [215, -92, -292], at: [165, -140, 20], fov: 74, box: [8, 356, -245, -35, -300, 28] },   // v60: where the client's wide photo was taken: the L, the fridge, the cubby, the door
  house:   { label: "The whole house", eye: [-400, 1200, 1300], at: [230, 40, 40], fov: 50, above: true },   // v55: from the front, the alley side   // v54: every floor and both gardens, a draft
  // v21: the window view moved to the window's middle, over the sofa's back (it stood behind your red lamp)
  window:  { label: "From the window", eye: [190, 192, -298], at: [214, 82, -10], fov: 68 },
  wall:    { label: "The media wall", eye: [140, 128, -285], at: [93, 108, 20], fov: 52 },
  sofa:    { label: "From the sofa", eye: [85, 108, -250], at: [72, 112, 20], fov: 58 },
  door:    { label: "From the door", eye: [372, 165, -6], at: [110, 85, -210], fov: 64 },
  stairs:  { label: "From the stairs", eye: [438, 205, 4], at: [190, 70, -205], fov: 62 },
  dining:  { label: "The dining table", A: { eye: [250, 140, -262], at: [246, 88, 0] }, B: { eye: [250, 150, -150], at: [467, 112, -185] }, C: { eye: [196, 175, -232], at: [430, 78, -130] }, Cs: { eye: [196, 175, -232], at: [430, 78, -130] }, fov: 60 },   // v21: back from the lamp
  unfold:  { label: "The table unfolding", C: { eye: [168, 200, -262], at: [392, 84, -138] }, Cs: { eye: [164, 200, -262], at: [388, 84, -138] }, eye: [168, 200, -262], at: [392, 84, -138], fov: 60 },   // v32: "Watch it open", the whole table in view
  chairs:  { label: "The chair cupboard", eye: [255, 200, -190], at: [460, 95, -262], C: { eye: [262, 170, -120], at: [462, 92, -200] }, Cs: { eye: [228, 178, -150], at: [462, 92, -232] }, fov: 54 },   // v20; v21 clear of the lamp; v30 the compact's chair bay
  windowwall: { label: "Out of the window", eye: [236, 150, -70], at: [236, 120, -309], fov: 66 },   // v17: for the ideas' stills
  breast:  { label: "The chimney breast", eye: [246, 140, -250], at: [246, 120, 0], fov: 54 },   // v17: for the ideas' stills
  pc:      { label: "The PC side wall", eye: [345, 135, -168], at: [0, 112, -168], fov: 56 },
  // v31: sitting at the open table's far end, looking at the cabinet; the wall beside the cabinet, by the pipe boxing
  sit:     { label: "Sitting at the table", eye: [258, 115, -128], at: [455, 98, -150], fov: 62 },
  beside:  { label: "Beside the cabinet", eye: [236, 152, -112], at: [462, 84, -262], fov: 60 },
  plan:    { label: "Bird’s eye", eye: [233.5, 1050, -135], at: [233.5, 0, -134.9], fov: 30, above: true },   // v21: closer, the room fills it
  doll:    { label: "Dolls’ house", eye: [610, 450, -560], at: [228, 55, -125], fov: 44, above: true },      // v21: closer, cut away
};
let tween = null;
/* v17: the camera stays in the room: x, y and z inside its walls, in front of the chimney breast, the alcove only within it */
let walked = false;
const freeAbove = () => (RMODE !== "in") || ((VIEWS[S.view] || {}).above && !walked);   // v71: Above and On its own orbit freely
function clampRoom(p, target = false) {   // the target (what you orbit round) may sit on a wall's face or a little past it
  const KB = ROOMV();                                                          // v60: in the kitchen (v61: any room of the house), its own walls
  if (KB) { const [x0, x1, y0, y1, z0, z1] = KB, g = target ? 15 : 0, q = v3(Math.min(Math.max(-p.x / M, x0 - g), x1 + g), Math.min(Math.max(p.y / M, y0 - g), y1 + g), Math.min(Math.max(p.z / M, z0 - g), z1 + g));
    const moved = q.distanceToSquared(p) > 1e-10; p.copy(q); return moved; }
  const lo = target ? -10 : 4, x = Math.min(Math.max(-p.x / M, lo), R.W - lo), y = Math.min(Math.max(p.y / M, target ? 0 : 20), R.CEIL - (target ? 0 : 8));
  const zmax = target ? R.RECESS_Z + 10 : x <= R.ALC_W ? R.ALC_D - 4 : x <= R.BREAST_X[1] + 4 ? -4 : R.RECESS_Z - 4;
  const z = Math.min(Math.max(p.z / M, R.WINDOW_Z + (target ? -30 : 6)), zmax);
  const q = v3(x, y, z), moved = q.distanceToSquared(p) > 1e-10;
  p.copy(q); return moved;
}
/* v41, client: "the camera stops you passing through walls or furniture": the furniture's boxes (each piece that stands in the room,
   whichever is showing), worked out again when something moves; the eye is pushed out of any it's inside, unless it's above that
   piece (you can still look down over the sofa) or under it (a shelf over your head) */
let SOLID = null;
const solidDirty = () => { SOLID = null; };
function solidBoxes() {
  if (SOLID) return SOLID;
  const objs = [G.sofa, S.drawers ? G.unit_out : G.unit_in, cab, ...Object.values(MOV).map(m => m && m.pivot), ...Object.values(BES || {}), ...Object.values(SUGG_G)];
  SOLID = [];
  for (const o of objs) {
    if (!o || !o.isObject3D || !shown(o)) continue;
    const b = new THREE.Box3(), t = new THREE.Box3(); o.updateWorldMatrix(true, true);
    o.traverseVisible(c => { if (!c.isMesh || !c.geometry) return; if (!c.geometry.boundingBox) c.geometry.computeBoundingBox(); b.union(t.copy(c.geometry.boundingBox).applyMatrix4(c.matrixWorld)); });   // only what's showing (not the folded table's hidden parts)
    if (b.isEmpty()) continue;
    const sz = b.getSize(new THREE.Vector3()); if (sz.x > 4 || sz.z > 4) continue;   // never a whole-room group
    SOLID.push(b.expandByVector(new THREE.Vector3(0.12, 0, 0.12)));                  // 12 cm round each: the eye stays off the surface
  }
  return SOLID;
}
function collide(p = camera.position) {    // true if it moved the eye
  let moved = false;
  if (ROOMV()) return false;   // v60: the living room's furniture isn't in the other rooms
  for (const b of solidBoxes()) {
    if (p.y > b.max.y + 0.05 || p.y < b.min.y - 0.2) continue;
    if (p.x <= b.min.x || p.x >= b.max.x || p.z <= b.min.z || p.z >= b.max.z) continue;
    const dx0 = p.x - b.min.x, dx1 = b.max.x - p.x, dz0 = p.z - b.min.z, dz1 = b.max.z - p.z, m = Math.min(dx0, dx1, dz0, dz1);
    if (m === dx0) p.x = b.min.x; else if (m === dx1) p.x = b.max.x; else if (m === dz0) p.z = b.min.z; else p.z = b.max.z;
    moved = true;
  }
  return moved;
}
/* v41, client: "a double-tap on the floor flies you to that spot, looking across the room": stand there at eye height (155), facing the
   room's middle (or the media wall from the middle itself) */
let lastTap = null;
function floorHop(e) {
  ray.setFromCamera(ndc(e), camera);
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h.point));
  const f = floorAt(e); if (!f || (hit && hit.point.y > 0.03)) return false;     // only the floor itself
  const p = v3(f.x, 155, f.z); clampRoom(p); collide(p); const x = -p.x / M, z = p.z / M;
  const cx = R.W / 2, cz = (R.WINDOW_Z + R.ALC_D) / 2, far = Math.hypot(x - cx, z - cz) < 60;
  const at = far ? [R.ALC_W / 2, 110, R.ALC_D] : [cx, 100, cz];
  if (S.cam === "look") { S.cam = "orbit"; applyCam(false); syncButtons(); }
  flyTo([x, 155, z], at, 60, false, false, 900); walked = true;
  return true;
}
function walk(kind, k = 1) {        // about 15 cm a press on the floor plane; turns 10°; v31: up and down 10 cm; k < 1 while a button's held
  if (tween) return;
  walked = true; controls.maxDistance = 6;
  const fwd = controls.target.clone().sub(camera.position); fwd.y = 0;
  if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1);
  fwd.normalize();
  const side = new THREE.Vector3(-fwd.z, 0, fwd.x), step = 0.15 * k;
  if (kind === "tl" || kind === "tr") {
    const off = controls.target.clone().sub(camera.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), (kind === "tl" ? 1 : -1) * Math.PI / 18 * k);
    controls.target.copy(camera.position).add(off);
  } else if (kind === "u" || kind === "dn") {
    const dy = (kind === "u" ? 1 : -1) * 0.1 * k, y = camera.position.y + dy;
    if (y / M < 30 || y / M > R.CEIL - 10) return;
    camera.position.y = y; controls.target.y += dy;
  } else {
    const d = kind === "f" ? fwd.multiplyScalar(step) : kind === "b" ? fwd.multiplyScalar(-step) : kind === "r" ? side.multiplyScalar(step) : side.multiplyScalar(-step);
    camera.position.add(d); controls.target.add(d);
  }
  clampRoom(camera.position); clampRoom(controls.target, true); collide();
  controls.update(); dirty(); syncEye();
}
const WALK_KEYS = { w: "f", arrowup: "f", s: "b", arrowdown: "b", a: "l", arrowleft: "l", d: "r", arrowright: "r", q: "tl", e: "tr",
                    r: "u", f: "dn", pageup: "u", pagedown: "dn" };   // v31: R and F (or Page Up and Down) go up and down
/* v31: the camera's height, how a drag moves it, and the move buttons on the room */
function lift(cm) {          // the eye to a height in cm, still looking the same way
  tween = null; walked = true; controls.maxDistance = 6;
  const y = Math.max(30, Math.min(R.CEIL - 10, cm)) * M, dy = y - camera.position.y;
  camera.position.y = y; controls.target.y += dy;
  clampRoom(camera.position); clampRoom(controls.target, true); controls.update(); dirty(); syncEye();
}
function levelView() {       // look straight ahead, no tilt
  const d = controls.target.clone().sub(camera.position); d.y = 0;
  if (d.lengthSq() < 1e-6) return;
  controls.target.y = camera.position.y; controls.update(); dirty();
}
function seatLook() {        // "look round from here": the point you turn round sits just in front of your eye; circling: 2.2 m on
  const d = controls.target.clone().sub(camera.position);
  if (d.lengthSq() < 1e-8) d.set(0, 0, 1);
  controls.target.copy(camera.position).addScaledVector(d.normalize(), S.cam === "look" ? 0.35 : 2.2);
  clampRoom(controls.target, true); controls.update(); dirty();
}
function applyCam(reseat = true) {
  const look = S.cam === "look";
  controls.enableZoom = !look; controls.rotateSpeed = look ? 0.4 : 0.55;
  if (reseat) seatLook();
}
let eyeT = 0;
function syncEye() {         // the height slider follows the camera
  const now = performance.now(); if (now - eyeT < 80) return; eyeT = now;
  const i = qs("#r3d-eye"), o = qs("#r3d-eyeout"); if (!i || document.activeElement === i) return;
  const cm = Math.round(camera.position.y / M); i.value = Math.min(220, Math.max(40, cm)); if (o) o.textContent = cm > 220 ? "above the room" : `${cm} cm`;
}
function applyPad() { const p = qs("#r3d-pad"); if (p) p.hidden = !S.pad; }
let wheelAcc = 0;            // looking round, the wheel (or a two-finger scroll) walks
canvas.addEventListener("wheel", e => {
  if (S.cam !== "look") return;
  e.preventDefault(); wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) >= 60) { walk(wheelAcc < 0 ? "f" : "b"); wheelAcc = 0; }
}, { passive: false });
["pointerdown", "pointermove", "keydown", "wheel"].forEach(t => root.addEventListener(t, e => { if (t !== "pointermove" || e.buttons) PRE.idleT = performance.now(); }, { passive: true, capture: true }));   // v39: a mouse just moving over the room doesn't hold up the warm-up   // v35: the shader warm-up waits while you use the room
let padT = null;             // a move button held down keeps moving, in smaller steps
const padStop = () => { if (padT) { clearTimeout(padT.t); clearInterval(padT.i); padT = null; } };
root.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-walk]"); if (!b) return;
  e.preventDefault(); padStop(); const k = b.dataset.walk; walk(k);
  padT = { t: setTimeout(() => { if (padT) padT.i = setInterval(() => walk(k, 0.4), 60); }, 300) };
});
["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, padStop)); window.addEventListener("blur", padStop);
root.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey || /^(input|select|textarea)$/i.test(e.target.tagName)) return;
  if (e.target.tagName === "BUTTON" && !e.target.dataset.walk && e.key.startsWith("Arrow")) return;   // arrows still move between buttons
  const k = WALK_KEYS[e.key.toLowerCase()]; if (!k) return;
  e.preventDefault(); walk(k);
});
canvas.addEventListener("pointerdown", () => { canvas.focus({ preventScroll: true }); if (tourSt) tourEnd(); if (SH) SH.own = true; });   // v28: touching the room ends the tour; v32: "Watch it open" carries on, the camera yours
function setView(name, instant, dur) {
  const v = VIEWS[name] || VIEWS.window, wasHouse = HOUSEV(S.view); S.view = name;
  if (RMODE !== "in") setRmode("in", true);                               // v71: a new view starts in the room
  let p = (S.site === "C" && S.cab === "sliding" && v.Cs) || v[S.site] || v;   // v30: "Cs", the sliding cabinet's own eye
  if (name === "house" && camera.aspect < 1.2) { const f = Math.min(1.25, 0.6 / camera.aspect);   // v54: a phone stands further back to take in every floor
    p = { eye: p.at.map((a, i) => a + (p.eye[i] - a) * f), at: p.at }; }
  flyTo(p.eye, p.at, R.HOUSE3 && v.box ? Math.max(v.fov, 82) : v.fov, !!v.above, instant, dur);   // v71: the house's rooms wide
  if (!houseG && R.HOUSE && HOUSEV(name)) { buildHouse(); reshadow(); }   // v69 (B6): built the first time (the living room starts without it)
  if (houseG) { houseG.visible = HOUSEV(name); view.visible = !v.above; applyFloors(); setAbove(!v.above); }   // v56: the sky only from inside
  if ((wasHouse !== HOUSEV(name) || EMBED) && started) { applyLight(); sizeRenderer(); }   // V1: in the app the house is by day, its rooms as they are   // v58: the outside's daylight on or off; v73: and the house's resolution
  placeRoomLights();                                                        // v69: the room's own lights, the sun's shadows over it
  if (garden3d) garden3d.visible = HOUSEV(name) && (name !== "house" || !!S.hgarden);   // v64: in The whole house only when Gardens is on                             // v56: the garden ground only with the whole house (in the room's own views it read as a room clipped on) // v54: the whole house, a draft (the garden photo steps aside: the lawn and fences show it)
  qsa("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
  syncRmode();                                                              // v78b: the living room's three too
  store.set(KEY, S); updateCaption(); brandPlace();
}
/* the camera to an eye and a point to look at (room cm); v32: also a piece's own close look (R3D.set's "aim") */
function flyTo(e, a, fov, above, instant, dur) {
  walked = false; controls.maxDistance = above ? (S.view === "house" ? 90 : 16) : 6;   // v54: the whole house from further off
  const eye = v3(...e), at = v3(...a);
  const from = { eye: camera.position.clone(), at: controls.target.clone(), fov: camera.fov };
  setAbove(!above);
  baseFov = fov;
  if (instant) { tween = null; camera.position.copy(eye); controls.target.copy(at);   // v30: an instant view stops any flight still under way
                camera.fov = fitFov(fov); camera.updateProjectionMatrix(); controls.update(); if (S.cam === "look") seatLook(); dirty(); syncEye(); }
  else tween = { t0: performance.now(), from, to: { eye, at, fov: fitFov(fov) }, dur: dur || 900 };
}
/* ---------------------------------------------------------------- v28: the guided tour (room3d_page.tour)
   Each stop flies to its view (slower than a tap) and shows its caption; a stop's own choices (the cabinet open) are put back after it.
   Touching the room, Esc or End stops it. Reduced motion: no flying, the same stops. */
const TOURD = JSON.parse((document.getElementById("tour-data") || {}).textContent || '{"stops":[]}');
const REDUCE = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const FLY = 2200, DWELL = 5200;
let tourSt = null;
function tourStart() {
  if (!TOURD.stops.length) return;
  if (S.edit) qs("#r3d-editdone")?.click();
  window.DemmaTools?.close(); closePop();
  tourSt = { i: -1, keep: {}, timer: 0, paused: false, t0: 0 };
  root.classList.add("touring"); qs("#r3d-tour").hidden = false;
  tourGo(0);
}
function tourGo(i) {
  if (!tourSt) return;
  const stops = TOURD.stops; clearTimeout(tourSt.timer);
  if (i >= stops.length) { tourEnd(); return; }
  i = Math.max(0, i); tourSt.i = i;
  const st = stops[i], keep = tourSt.keep;
  for (const k of Object.keys(keep)) if (!(st.set && k in st.set)) { S[k] = keep[k]; delete keep[k]; }   // put back the last stop's choices
  if (st.set) for (const [k, v] of Object.entries(st.set)) { if (!(k in keep)) keep[k] = S[k]; S[k] = v; }
  applyState(); syncButtons();
  setView(st.view, REDUCE, FLY);
  qs("#r3d-tourn").textContent = `Stop ${i + 1} of ${stops.length}`;
  qs("#r3d-tourh").textContent = st.title; qs("#r3d-tourp").textContent = st.text;
  qs("#r3d-tourbar").style.width = `${(i + 1) / stops.length * 100}%`;
  tourSt.t0 = performance.now();
  if (!tourSt.paused) tourSt.timer = setTimeout(() => tourGo(i + 1), (REDUCE ? 0 : FLY) + DWELL);
}
function tourCtl(c) {
  if (!tourSt) return;
  if (c === "stop") { tourEnd(); return; }
  if (c === "next") { tourGo(tourSt.i + 1); return; }
  if (c === "prev") { tourGo(tourSt.i - 1); return; }
  if (c === "pause") {
    tourSt.paused = !tourSt.paused; const b = qs('[data-tour="pause"]');
    b.setAttribute("aria-label", tourSt.paused ? "Carry on" : "Pause"); b.querySelector(".ms").textContent = tourSt.paused ? "play_arrow" : "pause";
    clearTimeout(tourSt.timer); if (!tourSt.paused) tourSt.timer = setTimeout(() => tourGo(tourSt.i + 1), DWELL);
  }
}
function tourEnd() {
  if (!tourSt) return;
  clearTimeout(tourSt.timer);
  const keep = tourSt.keep; tourSt = null;
  if (Object.keys(keep).length) { Object.assign(S, keep); applyState(); syncButtons(); }
  root.classList.remove("touring"); qs("#r3d-tour").hidden = true;
  qs("#r3d-tourbtn")?.focus({ preventScroll: true });
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && tourSt) { e.preventDefault(); tourEnd(); } else if (e.key === "Escape" && SH) { e.preventDefault(); showStop(true); } });

/* ---------------------------------------------------------------- v28: "copy link to this view"
   The look (where you stand and every choice, not Edit room's moves) as a plain #look-<token> (base64url JSON), which the page's
   router leaves alone. The link is always the GitHub Pages page, so anyone can open it. */
const LOOK_STR = { site: ["A", "B", "C"], dining: ["folded", "four", "six"], chairs: null, plants: null, seat: ["off", "up", "down"], scene: null, tod: ["evening", "day"], paint: null, lamp: null, cab: ["compact", "sliding"], cabw: ["90", "80"], beside: null,
                   blind: ["down", "up"], trolley: ["park", "out"] };   // v30: which cabinet; v31: beside it; v34: the blind, the trolley
const LOOK_BOOL = ["drawers", "curtains", "lbox", "laser", "pc", "grow", "tdoor", "foot", "lp", "lid", "barflap", "ctop", "sdraw"];   // v37: the step drawers   // v31: the open table's floor; v34: a record lifted out
const HEX = /^#[0-9a-f]{6}$/i;
const cm = v => [-v.x / M, v.y / M, v.z / M].map(n => Math.round(n));
function lookOf() {
  const o = { v: S.view, c: [...cm(camera.position), ...cm(controls.target), Math.round(baseFov)] };
  for (const k of Object.keys(LOOK_STR)) o[k] = S[k];
  for (const k of LOOK_BOOL) if (S[k] !== DEF[k]) o[k] = S[k] ? 1 : 0;
  if (S.paint === "custom") o.custom = S.custom;
  if (S.ceil !== "match") o.ceil = S.ceil;
  const ws = Object.fromEntries(Object.entries(S.walls).filter(([k, v]) => k in WALL_NAME && HEX.test(v || ""))); if (Object.keys(ws).length) o.walls = ws;   // v38
  if (S.skirt !== "match") o.skirt = S.skirt;
  const dd = {}; for (const k of Object.keys(DEF.decor)) if (S.decor[k] !== DEF.decor[k]) dd[k] = S.decor[k];
  if (Object.keys(dd).length) o.decor = dd;
  const on = m => Object.keys(m).filter(k => m[k]);
  if (on(S.sugg).length) o.sugg = on(S.sugg);
  if (on(S.ideas).length) o.ideas = on(S.ideas);
  const sv = {}; for (const k of on(S.sugg)) if (svarOf(k) !== SVAR[k]?.[0][0]) sv[k] = svarOf(k);
  if (Object.keys(sv).length) o.svar = sv;
  if (!(sameAsScene() && S.master === 100)) { o.lv = S.lv; o.master = S.master; o.col = S.col; }
  if (Object.keys(S.fix).length) o.fix = S.fix;                                                     // v38: each fixture's turn
  if (Object.keys(S.head).length) o.head = S.head;                                                  //       and each head's settings
  if ((S.warm ?? 50) !== DEF.warm) o.warm = S.warm;                                                  // v50: Warmth, and Edit room's moves
  if (Object.keys(S.layout).length) o.layout = S.layout;                                             //      and added pieces
  if (S.added.length) o.added = S.added;
  return o;
}
const b64u = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = t => decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/"))));
function lookUrl() {
  const here = location.href.split("#")[0], local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /github\.io$/.test(location.hostname);
  return (local ? here : TOURD.pages) + "#look-" + b64u(JSON.stringify(lookOf()));
}
function toast(t) {   // the clock starts once two frames have drawn (applying a look can recompile the room first)
  const el = qs("#r3d-toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t);
  requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3200); }));
}
function copyLook() {
  const url = lookUrl(), st = qs("#r3d-linkst");
  const shown = () => { st.innerHTML = ""; const i = document.createElement("input"); i.readOnly = true; i.value = url; i.className = "r3d-linkbox"; i.setAttribute("aria-label", "The link to this view"); st.append("Copy this link: ", i); i.focus(); i.select(); };
  const done = () => { st.textContent = "Copied. Paste it into a message: it opens the room just like this."; toast("Link copied"); };
  try { navigator.clipboard.writeText(url).then(done, shown); } catch (e) { shown(); }
}
function applyLook(tok) {
  let o; try { o = JSON.parse(unb64u(tok)); } catch (e) { return false; }
  if (!o || typeof o !== "object") return false;
  const ok = (k, v) => typeof v === "string" && (LOOK_STR[k] ? LOOK_STR[k].includes(v) : k === "scene" ? v in SCENES : k === "plants" ? v in R.PLANT_LAYOUTS : k === "paint" ? (v in R.PAINTS || v === "custom") : /^[a-z0-9_]{1,24}$/i.test(v));
  for (const k of Object.keys(LOOK_STR)) if (ok(k, o[k])) S[k] = o[k];
  for (const k of LOOK_BOOL) if (k in o) S[k] = !!o[k];
  if (HEX.test(o.custom || "")) S.custom = o.custom;
  S.walls = {}; if (o.walls && typeof o.walls === "object") for (const [k, v] of Object.entries(o.walls)) if (k in WALL_NAME && HEX.test(v || "")) S.walls[k] = v;   // v38
  S.ceil = HEX.test(o.ceil || "") ? o.ceil : "match"; S.skirt = HEX.test(o.skirt || "") ? o.skirt : "match";
  S.decor = Object.assign({}, DEF.decor); if (o.decor && typeof o.decor === "object") for (const k of Object.keys(DEF.decor)) if (typeof o.decor[k] === "string") S.decor[k] = o.decor[k];
  const set = a => Object.fromEntries((Array.isArray(a) ? a : []).filter(k => typeof k === "string").map(k => [k, true]));
  S.sugg = set(o.sugg); S.ideas = set(o.ideas);
  S.svar = {}; if (o.svar && typeof o.svar === "object") for (const [k, v] of Object.entries(o.svar)) if (SVAR[k]?.some(x => x[0] === v)) S.svar[k] = v;
  if (o.lv && typeof o.lv === "object") { S.lv = Object.assign({}, SCENES[S.scene].levels); for (const k of LAYERS) if (Number.isFinite(+o.lv[k])) S.lv[k] = Math.max(0, Math.min(100, +o.lv[k])); S.master = Number.isFinite(+o.master) ? Math.max(0, Math.min(100, +o.master)) : 100; }
  else { S.lv = Object.assign({}, SCENES[S.scene].levels); S.master = 100; }
  if (o.col && typeof o.col === "object") for (const k of Object.keys(DEF.col)) if (HEX.test(o.col[k] || "")) S.col[k] = o.col[k];
  S.fix = {}; if (o.fix && typeof o.fix === "object") for (const k of Object.keys(FIX_NAME)) if (Number.isFinite(+o.fix[k])) S.fix[k] = Math.max(-180, Math.min(180, +o.fix[k]));   // v38
  S.head = {}; if (o.head && typeof o.head === "object") for (const [k, h] of Object.entries(o.head)) {
    if (!/^(bar1|bar2|lamp):[0-5]$/.test(k) || !h || typeof h !== "object") continue;
    const c = {}; if (h.on === false) c.on = false;
    for (const [f, lo, hi] of [["lv", 0, 100], ["yaw", -90, 90], ["tilt", -60, 60]]) if (Number.isFinite(+h[f])) c[f] = Math.max(lo, Math.min(hi, +h[f]));
    if (HEX.test(h.col || "")) c.col = h.col; if (Object.keys(c).length) S.head[k] = c; }
  if (Number.isFinite(+o.warm)) S.warm = Math.max(0, Math.min(100, +o.warm)); else S.warm = DEF.warm;   // v50
  if (o.layout || o.added) {   // v50: the furniture moved or added in Edit room
    const ID = /^[a-z0-9_:-]{1,40}$/i, lay = {}, add = [];
    if (o.layout && typeof o.layout === "object") for (const [id, L] of Object.entries(o.layout)) { if (!ID.test(id) || !L || typeof L !== "object") continue;
      const c = {}; for (const f of ["x", "z", "rot"]) if (Number.isFinite(+L[f])) c[f] = +L[f]; if (HEX.test(L.col || "")) c.col = L.col; if (L.off) c.off = true; lay[id] = c; }
    if (Array.isArray(o.added)) for (const a of o.added.slice(0, 40)) if (a && CATALOGUE[a.type] && ID.test(a.id || "") && Number.isFinite(+a.x) && Number.isFinite(+a.z))
      add.push({ type: a.type, id: a.id, x: +a.x, z: +a.z, ...(Number.isFinite(+a.rot) ? { rot: +a.rot } : {}), ...(HEX.test(a.col || "") ? { col: a.col } : {}) });
    restoreLayout({ layout: lay, added: add });
  }
  applyState(); syncButtons();
  setView(o.v in VIEWS ? o.v : "room", true);
  const c = Array.isArray(o.c) && o.c.length === 7 && o.c.every(Number.isFinite) ? o.c : null;
  if (c) { camera.position.copy(v3(c[0], c[1], c[2])); controls.target.copy(v3(c[3], c[4], c[5])); baseFov = Math.max(20, Math.min(90, c[6])); camera.fov = fitFov(baseFov); camera.updateProjectionMatrix(); controls.update(); updateCut(); dirty(); }
  store.set(KEY, S);
  return true;
}
function lookFromHash() {
  const m = (location.hash || "").match(/^#look-([A-Za-z0-9_-]+)$/); if (!m) return;
  if (applyLook(m[1])) toast("Opened the shared view");
  try { history.replaceState(history.state, "", "#room"); } catch (e) {}
}
addEventListener("hashchange", () => { if (started) lookFromHash(); });

let cutSide = "";
function updateCut() {        // which wall the camera is outside of, if any (only in the views from above, before you walk)
  let side = "", best = 0;
  if (freeAbove()) {
    const x = -camera.position.x / M, z = camera.position.z / M;
    for (const [k, v] of Object.entries({ win: R.WINDOW_Z - z, stairs: x - R.W, pc: -x, wall: z - R.ALC_D })) if (v > best) { best = v; side = k; }
  }
  if (side === cutSide) return false;
  cutSide = side; const A = CLIP[0], n = A.normal;
  if (side === "win") { n.set(0, 0, 1); A.constant = -(R.WINDOW_Z + CUT_IN) * M; }
  else if (side === "stairs") { n.set(1, 0, 0); A.constant = (R.W - CUT_IN) * M; }
  else if (side === "pc") { n.set(-1, 0, 0); A.constant = -CUT_IN * M; }
  else if (side === "wall") { n.set(0, 0, -1); A.constant = -12 * M; }
  else { n.set(0, 0, 1); A.constant = 1e3; }
  reshadow();
  return true;
}
/* ---------------------------------------------------------------- v25: the numbered stickers on the room
   Each has an anchor in room cm (room3d_page.hotspots). Every frame the camera moves it is projected to the stage; a sticker behind
   the camera or off the picture hides; one on a wall seen from behind (and not opened by the cutaway) fades. Tapping one opens the
   popover under it: Open in the plan (the page's Plan sheet, at that chapter) and Fly here (the matching view). */
const HOTS = JSON.parse((document.getElementById("hotspots-data") || {}).textContent || "[]");
const stickEls = {}; qsa(".stk").forEach(b => { stickEls[b.dataset.hot] = b; });
const pop = qs("#r3d-pop"), stage = qs(".r3d-stage");
let popId = null;
const _p = new THREE.Vector3();
let labelsOn = true; try { labelsOn = localStorage.getItem("mw26-labels") !== "off"; } catch (e) {}
if (EMBED) labelsOn = false;                                                  // V1: no words over the 3D in the app (its lists are the labels)
function setLabels(on) {
  labelsOn = on; try { localStorage.setItem("mw26-labels", on ? "on" : "off"); } catch (e) {}
  if (!on) { closePop(); Object.values(stickEls).forEach(el => { el.hidden = true; }); }
  document.getElementById("r3d")?.classList.toggle("nolabels", !on);
  qsa("[data-labels]").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.labels === "on") === on)));
  applyFloors();
  const t = qs("#r3d-lbl"); if (t) { t.setAttribute("aria-pressed", String(on)); t.querySelector(".ms").textContent = on ? "label_off" : "label"; t.querySelector(".t").textContent = on ? "Hide labels" : "Show labels"; }
  dirty();
}
document.addEventListener("click", e => { const b = e.target.closest("#r3d-lbl, [data-labels]"); if (!b) return; setLabels(b.id === "r3d-lbl" ? !labelsOn : b.dataset.labels === "on"); });
// v35: each label's size is read once (and again after a resize or the fonts arriving), not every frame: reading it straight after
// moving the labels made the browser lay the page out again for each label, each frame
const stickSz = el => el._sz || (el.offsetWidth ? (el._sz = [el.offsetWidth, el.offsetHeight]) : [140, 40]);
const stickReset = () => { for (const k in stickEls) if (stickEls[k]) stickEls[k]._sz = null; };
addEventListener("resize", stickReset); if (document.fonts) document.fonts.ready.then(() => { stickReset(); dirty(); });
function placeStickers() {
  if (!HOTS.length || !started || !labelsOn) return;
  const w = stage.clientWidth, h = stage.clientHeight, cx = -camera.position.x / M, cz = camera.position.z / M;
  const placed = [];   // v26: labels never sit on top of each other (each one moves down clear of those already placed)
  for (const H of HOTS) {
    const el = stickEls[H.id]; if (!el) continue;
    _p.copy(v3(...H.at)).project(camera);
    const off = HOUSEV(S.view) || _p.z > 1 || _p.z < -1 || Math.abs(_p.x) > 1.02 || Math.abs(_p.y) > 1.02;   // v54: the house's own labels in The whole house
    if (el.hidden !== off) el.hidden = off;
    if (off) { if (popId === H.id) closePop(); continue; }
    const [ew, eh] = stickSz(el), hw = ew / 2 + 6, x = Math.max(hw + railR, Math.min(w - hw, (_p.x + 1) / 2 * w)); let y = Math.max(28, Math.min(h - 28, (1 - _p.y) / 2 * h));   // kept whole on screen
    if (cover && x + hw > cover.left && x - hw < cover.right && y + 20 > cover.top && y - 20 < cover.bottom) { el.hidden = true; if (popId === H.id) closePop(); continue; }   // v26: not under the Tools panel
    for (let k = 0; k < 8; k++) {
      const hit = placed.find(q => Math.abs(x - q.x) < (ew + q.w) / 2 + 4 && Math.abs(y - q.y) < (eh + q.h) / 2 + 4);
      if (!hit) break;
      y = hit.y + (eh + hit.h) / 2 + 4;
    }
    placed.push({ x, y, w: ew, h: eh });
    el.style.left = x + "px"; el.style.top = y + "px";
    const behind = H.nrm && !(H.cut && H.cut === cutSide) && ((cx - H.at[0]) * H.nrm[0] + (cz - H.at[2]) * H.nrm[1]) < 0;
    el.classList.toggle("behind", !!behind);
    if (popId === H.id) placePop(el);
  }
}
function placePop(el) {
  const sw = stage.clientWidth, x = parseFloat(el.style.left), y = parseFloat(el.style.top), pw = 290;
  const left = Math.max(12, Math.min(sw - pw - 12, x - pw / 2));
  pop.style.left = left + "px"; pop.style.top = (y + 30) + "px"; pop.style.setProperty("--ax", (x - left) + "px");
}
function openPop(id) {
  const H = HOTS.find(h => h.id === id); if (!H) return;
  if (popId) stickEls[popId].setAttribute("aria-expanded", "false");
  popId = id; const el = stickEls[id]; el.setAttribute("aria-expanded", "true");
  pop.style.setProperty("--h", H.hue);
  qs("#r3d-pop-h").textContent = H.name;                                 // v39: three places, no numbers
  const ul = qs(".facts", pop); ul.textContent = "";
  H.facts.forEach(f => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
  const pcs = qs(".r3d-pcs", pop); pcs.textContent = "";                // v46: its pieces, each opening its card in Build
  (H.pieces || []).forEach(([cid, title]) => { const li = document.createElement("li"), b = document.createElement("button"), pr = window.PIECEP && PIECEP.of(cid);
    b.type = "button"; b.dataset.mk = cid; b.innerHTML = `<span>${title}</span><small>${pr ? `${pr.done} of ${pr.total}` : ""}</small><i class="ms" aria-hidden="true">chevron_right</i>`;
    li.appendChild(b); pcs.appendChild(li); });
  pop.hidden = false; placePop(el); (qs(".r3d-pcs button", pop) || qs(".acts button", pop)).focus({ preventScroll: true }); syncPlaces();
}
function closePop() { if (popId && stickEls[popId]) stickEls[popId].setAttribute("aria-expanded", "false"); popId = null; if (pop) pop.hidden = true; try { syncPlaces(); } catch (e) {} }
qsa(".stk").forEach(b => b.addEventListener("click", e => { e.stopPropagation();
  if (tryOpts && placeOpts(b.dataset.hot).length) { const r = stage.getBoundingClientRect(), q = b.getBoundingClientRect(); openAct(`opt:${b.dataset.hot}:${placeIx(b.dataset.hot)}`, [q.left + q.width / 2 - r.left, q.bottom - r.top]); return; }   // v39
  popId === b.dataset.hot ? closePop() : openPop(b.dataset.hot); }));
if (pop) pop.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const H = HOTS.find(h => h.id === popId);
  if (b.classList.contains("x")) { const was = popId; closePop(); if (was) stickEls[was].focus(); return; }
  if (!H) return;
  if (b.dataset.popgo === "fly") { setView(H.view); closePop(); }
  else if (b.dataset.popgo === "plan") { closePop(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan", chapter: H.chapter } })); }
});
canvas.addEventListener("pointerdown", () => { if (popId) closePop(); });
document.addEventListener("click", e => { if (e.target.closest("#r3d-pop [data-mk]")) closePop(); }, true);   // v46: a piece opens in Build
/* v33, the phone home: the places strip under the room; a tap flies to the place and opens its card, docked above the dock */
qsa("[data-place]").forEach(b => b.addEventListener("click", e => {
  e.stopPropagation(); const H = HOTS.find(h => h.id === b.dataset.place); if (!H) return;
  if (popId === H.id) { closePop(); return; }
  if (SH) showStop(true); setView(H.view); if (!labelsOn) setLabels(true);
  setTimeout(() => { placeStickers(); if (stickEls[H.id] && !stickEls[H.id].hidden) openPop(H.id); else openPopAt(H.id); }, 950);
}));
function openPopAt(id) {    // the place's pin is off the picture: the card still opens (docked on a phone)
  const el = stickEls[id]; if (!el) return; el.style.left = (stage.clientWidth / 2) + "px"; el.style.top = "60px"; openPop(id);
}
function syncPlaces() { qsa("[data-place]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.place === popId))); root.classList.toggle("popped", !!popId); }
document.addEventListener("keydown", e => { if (e.key === "Escape" && popId) { const was = popId; closePop(); stickEls[was].focus(); } });
new ResizeObserver(() => placeStickers()).observe(stage);
/* ---------------------------------------------------------------- v30, client: "make function so say i click the dining cabinet i can
   manage options to open it, close it etc as goes for drawers and other items i can interact with". A tap on the room (not a drag, not
   in Edit room) finds what's under it and opens a card of what it can do. The card's buttons are the room's own controls (data-dining,
   data-chairs, data-drawers, data-tog...), so they work, and stay in step with the Tools panel, exactly as its buttons do. */
const act = qs("#r3d-act");
let actId = null, actXY = null, tapDown = null;
const clippedAt = p => CLIP.every(pl => pl.distanceToPoint(p) < 0);           // the cutaway hides what's on the far side of both planes
const under = (o, g) => { if (!g) return false; for (; o; o = o.parent) if (o === g) return true; return false; };
function pickItem(e) {
  ray.setFromCamera(ndc(e), camera);
  const cutAway = q => RPLANES.some(pl => pl.distanceToPoint(q) < 0);             // v71: not what a room's view has cut away
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h.point) && !(selBox && h.object === selBox) && !cutAway(h.point));
  if (!hit) return null;
  const o = hit.object, p = hit.point;
  const near = (obj, r) => !!obj && obj.getWorldPosition(new THREE.Vector3()).distanceTo(p) < r * M;
  const BL = HPARTS.bed_lift;                                                    // v71: the master's ottoman bed: its card
  if (BL && houseG && houseG.visible) { const bx = new THREE.Box3().setFromObject(BL.g); bx.min.y -= 0.6; bx.expandByScalar(0.03); if (bx.containsPoint(p)) return "hbed"; }
  if (S.site === "C" && (under(o, cab) || under(o, optC))) return "cab";
  if (under(o, lamp)) return "lamp";
  if (under(o, bar1)) return "bar1";
  if (under(o, bar2)) return "bar2";
  if (under(o, curtOpen) || under(o, curtShut)) return "curtains";
  if (o === tvScreen) return "tv";
  if (o === lboxFace) return "lbox";
  if (under(o, pcGlow)) return "pc";
  for (const g of Object.values(BES)) if (under(o, g)) return "beside";       // v34: more things work from a tap
  const obj = g => (g && g.isObject3D ? g : g && g.pivot);                  // a floor suggestion is a movable (its pivot)
  for (const [k, g] of Object.entries(IDEA_G)) if (under(o, obj(g))) return "id:" + k;
  for (const [k, g] of Object.entries(SUGG_G)) if (under(o, obj(g))) return "sg:" + k;
  if (MOV.records && under(o, MOV.records.pivot)) return "records";
  let m = o; while (m && !m.userData.movId) m = m.parent;
  if (m && MOV[m.userData.movId]) return "mov:" + m.userData.movId;
  for (const [k, g] of Object.entries(G)) if (under(o, g)) {
    if (k === "unit_in" || k === "unit_out") return "wall";
    if (k === "now_ledge") return "nowplay";                                   // v39: the LP facing out on the ledge
    if (/^[AB]_/.test(k)) return "table";
    if (near(tvScreen, 70)) return "tv";                                       // the TV's own frame and stand are in the room's fixed parts
    if (near(lboxFace, 30)) return "lbox";
    if (near(pcLight, 40)) return "pc";
    return null;
  }
  return null;
}
const btn = (label, attrs, on, cls, aria) => ({ label, attrs, on, cls, aria });
const MAKE_CARD = { recordtable: "mk-recordtable", ctable: "mk-ctable", wallcabs: "mk-wallcabs", alcoveshelves: "mk-alcove", doorshelf: "mk-doorshelf", shelfboxes: "mk-doorshelf" };   // v44
function actItems(id) {     // [title, how it is now, buttons]
  const folded = S.dining === "folded", lv = k => (S.lv[k] ?? 0) > 0;
  if (id === "hbed") { const P_ = HPARTS.bed_lift, up = !!(P_ && (P_.tw ? P_.tw.to === 1 : P_.t > 0.5));   // v71, the client: the bed as a card, like the living room's
    return ["Your ottoman bed", up ? "Lifted on its struts: four storage boxes inside" : "Pine, the base lifts from the foot", [
      btn(up ? "Lower the bed" : "Lift the bed", { hbed: up ? "down" : "up" }), ...(ROOMV() && RMODE !== "above" ? [btn("See it from above", { rmode: "above" })] : [])]]; }
  if (id === "nowplay") return ["Now playing, on the ledge", `${NOWP[S.nowp % NOWP.length].name}`, [   // v39: which LP faces out
      btn("‹", { nowp: "-1" }, false, "q", "The one before"), btn("›", { nowp: "1" }, false, "q", "The next one"),
      btn("A photo of yours", { nowpic: "1" }), btn("Look at it", { view: "breast" })]];
  if (id === "measure") { const d = MEAS.d;                               // v39: measure in 3D
    return ["Measure", d ? `${d.toFixed(1)} cm between them (${MEAS.dh.toFixed(1)} across, ${MEAS.dv.toFixed(1)} up)` : MEAS.a ? "Now tap the second point" : "Tap the first point in the room", [
      btn("Measure again", { measure: "again" }), btn("Done", { measure: "done" })]]; }
  if (id.startsWith("opt:")) {                                            // v39: Try options' card: this place's options, ‹ › through them
    const [, pl, ix] = id.split(":"), L = placeOpts(pl); if (!L.length) return null;
    const i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i], on = optOn(it), firm = isFirm(it);
    return [it.title + (firm ? " (your plan)" : ""), `${g.title} · ${i + 1} of ${L.length} · ${it.size}${it.cost ? ` · £${it.cost[0]}–${it.cost[1]}` : ""}`, [
      btn("‹", { optcyc: `${pl}:${i - 1}` }, false, "q", "The one before"), btn("›", { optcyc: `${pl}:${i + 1}` }, false, "q", "The next one"),
      on ? btn("Keep it", { optkeep: "1" }, true) : btn("Try it", { optcyc: `${pl}:${i}` }),
      ...(it.aim ? [btn("See it", { optsee: g.k })] : []), btn("Back to my plan", { optclear: "1" })]];
  }
  if (id === "cab" && S.site !== "C") id = "table";
  if (id === "table" && S.site === "C") id = "cab";
  if (id === "cab") {
    const sl = S.cab === "sliding", d = cabDoors();
    const st = !folded ? `Open for ${S.dining}: the table is out` : d.table ? "Packed away, the table door open" : d.chairs ? "Packed away, the chair door open" : (S.cabw === "80" ? "Packed away: the table and four of the six chairs inside" : "Packed away: the table and the six chairs inside");
    return [S.cabw === "80" ? "The dining cabinet, 80-wide table" : "The dining cabinet", st, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded away" : "Fold it away", { dining: "folded" }, folded),
      ...(folded ? [btn(d.table ? "Shut the table door" : "Open the table door", { tdoor: d.table ? "shut" : "open" }),
                    btn(d.chairs ? "Shut the chair door" : "Open the chair door", { chairs: d.chairs ? "cupboard" : "open" })] : []),
      btn("Watch it open, step by step", { showopen: "1" }),
      btn(S.cabw === "80" ? "Show the 90-wide table (the plan)" : "Show the 80-wide version (10 shorter)", { cabw: S.cabw === "80" ? "90" : "80" }),
      btn("Look at it", { view: "dining" }), btn("How to make it", { actmk: "mk-cabinet" }), btn("Read about it", { actgo: "dining" })]];
  }
  if (id === "table") return [S.site === "A" ? "The flip-top on the breast (the alternative)" : "The flip-top by the stairs (the alternative)", folded ? "Folded" : `Open for ${S.dining}`, [
      btn("Open for six", { dining: "six" }, S.dining === "six"), btn("Open for four", { dining: "four" }, S.dining === "four"),
      btn(folded ? "Folded" : "Fold it", { dining: "folded" }, folded), btn("Show the dining cabinet", { site: "C" }), btn("Look at it", { view: "dining" })]];
  if (id === "wall") return ["The media wall", S.drawers ? "Every drawer pulled out" : "Drawers shut", [
      btn(S.drawers ? "Push the drawers in" : "Pull the drawers out", { drawers: S.drawers ? "in" : "out" }),
      btn(lv("bias") ? "TV off" : "TV on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"),
      btn("Choose the LP on the ledge", { actopen: "nowplay" }),               // v39: "a now playing swap: tap the turntable"
      btn("Look at it", { view: "wall" }), btn("How to make it", { actmk: "mk-base" }), btn("Read about it", { actgo: "wall" })]];
  if (id === "tv") return ["The TV", lv("bias") ? "On, its bias light behind it" : "Off", [
      btn(lv("bias") ? "Turn it off" : "Turn it on", { layer: "bias:" + (lv("bias") ? "off" : "on") }), btn("Film lights", { scene: "film" }, S.scene === "film"), btn("Look at it", { view: "sofa" })]];
  if (id === "lamp" || id === "bar1" || id === "bar2") return fixCard(id, lv(id));
  if (id === "curtains") return ["The curtains", S.curtains ? "Drawn" : "Open", [btn(S.curtains ? "Open them" : "Draw them", { tog: "curtains" })]];
  if (id === "lbox") return ["Your OBEGRÄNSAD light box", S.lbox ? "On" : "Off", [btn(S.lbox ? "Turn it off" : "Turn it on", { tog: "lbox" })]];
  if (id === "pc") return ["Your PC", S.pc ? "Lit" : "Dark", [btn(S.pc ? "Lights off" : "Lights on", { tog: "pc" }), btn("Look at it", { view: "pc" }), btn("How to make it", { actmk: "mk-sidewall" }), btn("Read about it", { actgo: "side" })]];
  if (id === "beside") { const B = R.BESIDE, cur = S.beside;           // v34
    return ["Beside the cabinet", (B.opts[cur] || {}).name || cur, [
      ...Object.entries(B.opts).map(([k, o]) => btn(o.name, { beside: k }, cur === k)),
      ...(cur === "bar" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),   // v37
      ...(cur === "trolley" ? [btn(S.trolley === "out" ? (cabDoors().table ? "Park it by the wall (once the table is folded)" : "Park it by the wall") : (cabDoors().table ? "Pull it out (once the table is folded)" : "Pull it out for dinner"), { trolley: S.trolley === "out" ? "park" : "out" })] : []),
      ...(cur === "bar" ? [btn("How to make it", { actmk: "mk-bar" })] : []), btn("Look at it", { view: "beside" }), btn("Read about it", { actgo: "dining" })]]; }
  if (id === "records") return ["Your vinyl stand", S.lp ? "The front record of each bay lifted out" : "Two face-out bays on top, LPs filed below", [
      btn(S.lp ? "Put the records back" : "Lift out the front records", { lp: S.lp ? "in" : "out" }),
      btn(S.ideas.clean ? "Take away the record-care caddy" : "Add a record-care caddy (an idea)", { idea: "clean" }, !!S.ideas.clean),
      btn("Move it", { actedit: "records" })]];
  if (id.startsWith("sg:") || id.startsWith("id:")) {
    const sg = id.startsWith("sg:"), k = id.slice(3), nm = ((sg ? PD.sugg : PD.ideas)[k] || [k])[0], it = sg && MOV["sg_" + k];
    if (!(sg ? S.sugg : S.ideas)[k]) return null;                        // taken away: the card closes
    const firm = R.FIRM && (sg ? R.FIRM.sugg : R.FIRM.ideas || []).includes(k);   // v38: the client's picks are the plan (v43: the C-table too)
    return [nm, firm ? "In your plan" : sg ? "An option: not in the plan's costs" : "An idea: not in the plan's costs", [
      ...(firm && MAKE_CARD[k] ? [btn("How to make it", { actmk: MAKE_CARD[k] })] : []),   // v44: its card in Build
      ...(k === "blind" ? [btn(S.blind === "up" ? "Pull it down" : "Roll it up", { blind: S.blind === "up" ? "down" : "up" })] : []),
      ...(k === "barcase" || k === "barside" ? [btn(S.barflap ? "Close the bar" : "Open the bar", { barflap: S.barflap ? "shut" : "open" })] : []),
      ...(k === "liftcoffee" ? [btn(S.ctop ? "Put the top down" : "Lift the top", { ctop: S.ctop ? "down" : "up" })] : []),
      ...(k === "recordtable" ? [btn(S.ctop ? "Close the lid" : "Lift the lid", { ctop: S.ctop ? "down" : "up" })] : []),   // v38
      ...(k === "stairdrawers" ? [btn(S.sdraw ? "Push the drawers in" : "Pull the drawers out", { sdraw: S.sdraw ? "in" : "out" })] : []),   // v37
      ...(sg ? (SVAR[k] || []).map(([v, n]) => btn(n, { svar: `${k}:${v}` }, svarOf(k) === v)) : []),
      ...(it && !it.fixed ? [btn("Move it", { actedit: it.id })] : []),
      btn("Take it away", sg ? { sugg: k } : { idea: k }), btn("See its card", { actideas: (sg ? "sugg-" : "idea-") + k })]]; }
  if (id === "mov:pouf") return ["Your storage ottoman", S.lid ? "The lid off: your board games in three layers, the cards along one side" : "Navy velvet, its padded lid on: your games and cards inside", [   // v34
      btn(S.lid ? "Put the lid back" : "Lift the lid", { lid: S.lid ? "on" : "off" }), btn("Move it", { actedit: "pouf" }), btn("Read about it", { actgo: "c-room" })]];
  if (id.startsWith("mov:")) { const it = MOV[id.slice(4)]; if (!it) return null;
    return [it.label, it.fixed ? "Built in: it can come off, but not move" : "Drag it in Edit room, or change its colour", [btn(it.fixed ? "Take it off or put it back" : "Move it", { actedit: it.id })]]; }
  return null;
}
/* v38: a fixture's card: on or off, turn it as a whole (15° a tap, 5° with Shift held), then one head at a time */
const actHead = { bar1: 0, bar2: 0, lamp: 0 };
function headNames(id) {
  if (id === "lamp") return ["Top (green)", "Middle (pink)", "Bottom (purple)"];
  const spec = id === "bar1" ? R.BAR1 : (bar2 && bar2.userData.spec) || R.BAR1, names = { "#a9c7ab": "Sage", "#a7d0d8": "Blue", "#e8b53f": "Mustard", "#e79c95": "Pink" };
  return spec.heads.map((h, i) => names[(h.col || "").toLowerCase()] || `Head ${i + 1}`);
}
/* v39 (item 6's floor line): while a fixture's card is open, a line from its chosen head to where its beam lands, and a ring there */
const AIMG = { g: null, k: "" };
function clearAim() { if (AIMG.g) { scene.remove(AIMG.g); AIMG.g.traverse(o => o.geometry && o.geometry.dispose()); AIMG.g = null; AIMG.k = ""; dirty(); } }
function showAim(k) {
  clearAim(); const id = k.split(":")[0], l = (lights[id] || []).find(x => x.userData.hk === k); if (!l || !l.isSpotLight) return;
  scene.updateMatrixWorld(); const p = l.getWorldPosition(new THREE.Vector3()), dir = l.target.getWorldPosition(new THREE.Vector3()).sub(p).normalize();
  const near0 = ray.near; ray.set(p, dir); ray.near = 0.2;
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && h.object.material !== measMat && !clippedAt(h.point)); ray.near = near0;
  const end = hit ? hit.point : p.clone().addScaledVector(dir, p.y / Math.max(0.05, -dir.y)), len = end.distanceTo(p);
  const g = AIMG.g = new THREE.Group(); g.renderOrder = 998;
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, len, 6), measMat); line.position.copy(p).add(end).multiplyScalar(0.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); line.renderOrder = 998; g.add(line);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 32), measMat), nrm = hit && hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
  ring.position.copy(end).addScaledVector(nrm, 0.005); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm); ring.renderOrder = 998; g.add(ring);
  scene.add(g); AIMG.k = k; dirty();
}
function fixCard(id, on) {
  const d = fixDeg(id), names = headNames(id), i = Math.min(actHead[id] || 0, names.length - 1), k = `${id}:${i}`, h = headOf(k);
  requestAnimationFrame(() => { if (actId) showAim(k); });                 // v39: where this head lands
  const ci = HEAD_COLS.findIndex(c => c[0] === (h.col || null)), aim = [h.yaw ? `${h.yaw > 0 ? "right" : "left"} ${Math.abs(h.yaw)}°` : "", h.tilt ? `${h.tilt > 0 ? "up" : "down"} ${Math.abs(h.tilt)}°` : ""].filter(Boolean).join(", ");
  const st = `${on ? "On" : "Off"} · ${d ? `turned ${d}°` : "at the plan's angle"} · ${names[i]}: ${h.on === false ? "off" : `${h.lv ?? 100}%`}${aim ? `, aimed ${aim}` : ""}`;
  return [FIX_NAME[id], st, [
    btn(on ? "Turn it off" : "Turn it on", { layer: id + ":" + (on ? "off" : "on") }),
    { sep: "Turn the whole fixture" },
    btn("⟲ 15°", { fixturn: `${id}:-15` }, undefined, "sm", "Turn it 15° anticlockwise (Shift: 5°)"), btn("⟳ 15°", { fixturn: `${id}:15` }, undefined, "sm", "Turn it 15° clockwise (Shift: 5°)"),
    ...(d || Object.keys(S.head).some(x => x.startsWith(id + ":")) ? [btn("Reset", { fixreset: id }, undefined, "sm", "Back to the plan's angle and aims")] : []),
    { sep: "Each head" },
    ...names.map((n, j) => btn(n, { headsel: `${id}:${j}` }, j === i)),
    { sep: names[i] },
    btn(h.on === false ? "On" : "Off", { headtog: k }, undefined, "sm", h.on === false ? "Switch this head on" : "Switch this head off"),
    btn("−", { headlv: `${k}:-20` }, undefined, "sm", "Dim this head"), btn("+", { headlv: `${k}:20` }, undefined, "sm", "Brighten this head"),
    btn("←", { headaim: `${k}:yaw:-10` }, undefined, "q", "Aim it left"), btn("→", { headaim: `${k}:yaw:10` }, undefined, "q", "Aim it right"),
    btn("↑", { headaim: `${k}:tilt:10` }, undefined, "q", "Aim it up"), btn("↓", { headaim: `${k}:tilt:-10` }, undefined, "q", "Aim it down"),
    btn(`Colour: ${HEAD_COLS[Math.max(0, ci)][1]}`, { headcol: k }),
    ...(id === "lamp" ? [btn("Move it", { actedit: "lamp" })] : [])]];
}
function fixAct(d, fine) {             // the card's fixture and head buttons; true if one was handled
  const keyOf = v => v.split(":").slice(0, 2).join(":"), edit = (k, f) => { const h = Object.assign({}, headOf(k)); f(h); if (Object.keys(h).length) S.head[k] = h; else delete S.head[k]; };
  if (d.fixturn) { const [id, st] = d.fixturn.split(":"); const step = fine ? Math.sign(+st) * 5 : +st; S.fix[id] = (((fixDeg(id) + step) % 360) + 540) % 360 - 180; if (!S.fix[id]) delete S.fix[id]; }
  else if (d.fixreset) { delete S.fix[d.fixreset]; for (const k of Object.keys(S.head)) if (k.startsWith(d.fixreset + ":")) delete S.head[k]; }
  else if (d.headsel) { const [id, i] = d.headsel.split(":"); actHead[id] = +i; renderAct(); return true; }
  else if (d.headtog) edit(d.headtog, h => { if (h.on === false) delete h.on; else h.on = false; });
  else if (d.headlv) { const k = keyOf(d.headlv), st = +d.headlv.split(":")[2]; edit(k, h => { const v = Math.max(0, Math.min(100, (h.lv ?? 100) + st)); if (v === 100) delete h.lv; else h.lv = v; if (v > 0) delete h.on; }); }
  else if (d.headaim) { const [id, i, ax, st] = d.headaim.split(":"), k = `${id}:${i}`, lim = ax === "tilt" ? 60 : 90;
    edit(k, h => { const v = Math.max(-lim, Math.min(lim, (h[ax] || 0) + (fine ? Math.sign(+st) * 5 : +st))); if (v) h[ax] = v; else delete h[ax]; }); }
  else if (d.headcol) edit(d.headcol, h => { const ci = HEAD_COLS.findIndex(c => c[0] === (h.col || null)), nx = HEAD_COLS[(Math.max(0, ci) + 1) % HEAD_COLS.length][0]; if (nx) h.col = nx; else delete h.col; });
  else return false;
  applyState(); syncButtons(); return true;
}
function renderAct() {
  const items = actId && actItems(actId);
  if (!items) { closeAct(); return; }
  const [title, st, bs] = items;
  qs("#r3d-act-h").textContent = title; qs("#r3d-act-st").textContent = st;
  qsa(".r3d-actmore", act).forEach(m => m.remove());
  const box = qs("#r3d-acts"); box.textContent = "";
  // v39 (the approved redesign): a card shows its first three buttons; everything else sits under Details
  let shownN = 0, into = box, more = null;
  for (const b of bs) {
    if (shownN >= 3 && !more) { more = document.createElement("details"); more.className = "r3d-actmore"; more.open = actMoreOpen;
      more.innerHTML = '<summary>Details</summary><div class="acts"></div>'; more.addEventListener("toggle", () => { actMoreOpen = more.open; placeAct(); }); box.after(more); into = more.querySelector(".acts"); }
    if (b.sep) { const h = document.createElement("span"); h.className = "r3d-actsep"; h.textContent = b.sep; (shownN >= 3 ? into : box).appendChild(h); continue; }   // v38
    shownN++;
    const el = document.createElement("button"); el.type = "button"; el.textContent = b.label;
    for (const [k, v] of Object.entries(b.attrs)) el.dataset[k] = v;
    if (b.cls) el.className = b.cls; if (b.aria) { el.setAttribute("aria-label", b.aria); el.title = b.aria; }
    if (b.on !== undefined) el.setAttribute("aria-pressed", String(!!b.on));
    into.appendChild(el);
  }
  placeAct();
}
function placeAct() {
  if (!actXY) return;
  const sw = stage.clientWidth, sh = stage.clientHeight, pw = act.offsetWidth || 300, ph = act.offsetHeight || 200;
  const left = Math.max(12, Math.min(sw - pw - 12, actXY[0] - pw / 2));
  const below = actXY[1] + 22 + ph < sh - 90, top = below ? actXY[1] + 22 : Math.max(12, actXY[1] - ph - 22);
  act.style.left = left + "px"; act.style.top = top + "px"; act.style.setProperty("--ax", (actXY[0] - left) + "px");
  act.classList.toggle("above", !below);
}
let actMoreOpen = false;
function openAct(id, xy) {
  if (popId) closePop(); clearAim();
  if (String(id).split(":").slice(0, 2).join(":") !== String(actId || "").split(":").slice(0, 2).join(":")) actMoreOpen = false;   // v39: a new card opens folded
  actId = id; actXY = xy; act.hidden = false; renderAct();
  if (!act.hidden) { const f = qs("#r3d-acts button"); if (f) f.focus({ preventScroll: true }); }
}
function closeAct() { actId = null; if (act) act.hidden = true; clearAim(); }
if (act) {
  act.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("x")) { closeAct(); return; }
    const d = b.dataset;
    if (d.actgo) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "plan", chapter: d.actgo } })); return; }
    if (d.actmk) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "build", mk: d.actmk } })); return; }   // v44
    if (d.actideas) { closeAct(); window.dispatchEvent(new CustomEvent("demma-open", { detail: { sheet: "ideas", item: d.actideas } })); return; }   // v34
    if (d.actedit) { const id = d.actedit; closeAct(); setEdit(true); select(id); return; }
    if (fixAct(d, e.shiftKey)) return;                                   // v38: a fixture's turn, its heads
    if (d.optcyc) { const [pl, ix] = d.optcyc.split(":"), L = placeOpts(pl), i = ((+ix % L.length) + L.length) % L.length, [g, it] = L[i];   // v39
      if (!optOn(it)) optPick(g.k, it.v); actId = `opt:${pl}:${i}`; renderAct(); return; }
    if (d.optkeep) { closeAct(); return; }
    if (d.actopen) { actId = d.actopen; renderAct(); return; }
    if (d.nowp) { S.nowp = ((S.nowp || 0) + +d.nowp + NOWP.length) % NOWP.length; applyNow(); store.set(KEY, S); renderAct(); return; }
    if (d.nowpic) { pickNowPic(); return; }
    if (d.measure) { if (d.measure === "done") { endMeasure(); closeAct(); } else { clearMeasure(); renderAct(); } return; }
    if (d.view) setTimeout(closeAct, 0);                     // the room flies there; the card has done its job
  });
  canvas.addEventListener("pointerdown", e => { tapDown = (S.edit || e.button > 0) ? null : [e.clientX, e.clientY, e.timeStamp]; if (actId) closeAct(); });   // review after v48: the touch's own time, so a slow frame between down and up can't turn a tap into a long press
  canvas.addEventListener("pointerup", e => {
    const t = tapDown; tapDown = null;
    if (!t || S.edit || Math.hypot(e.clientX - t[0], e.clientY - t[1]) > 6 || e.timeStamp - t[2] > 600) return;
    if (MEAS.on) { measureTap(e); return; }                                   // v39: measure in 3D
    const now = e.timeStamp, dbl = lastTap && now - lastTap.t < 380 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    lastTap = dbl ? null : { t: now, x: e.clientX, y: e.clientY };
    if (dbl && floorHop(e)) return;                                           // v41: a double-tap on the floor flies you there
    if (EMBH) { EMBH.tap(e); return; }                                        // V1: in the app, a tap names the piece to the app
    let id = pickItem(e); if (!id) return;
    const r = stage.getBoundingClientRect();
    if (tryOpts) { const pl = placeOf(id); if (pl) id = `opt:${pl}:${placeIx(pl, id)}`; }             // v39: Try options: what else could go here
    openAct(id, [e.clientX - r.left, e.clientY - r.top]);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && actId) closeAct(); });
}
function setAbove(show) {   // the floor above (the stairwell's upper walls) hides in the views from above
  const hs = houseG && houseG.visible;                                         // v72: in the house the house's own stairwell stands there (the
  scene.traverse(o => { if (o.name === "above") o.visible = show && !hs; });   // living room's green upper wall showed through the landing)
  if (view) view.visible = show;                                               // v56: the plain sky only from inside (from above it read as a pale slab)
}
/* v53, client: "Can you make the garden visible through the window at any angle": the garden picture stays in every view, the views from
   above too (v52 showed it only once the camera was inside the room) */

/* ---------------------------------------------------------------- render loop, only when something changed */
let need = 2, moving = false, still_t = 0, lowRes = false, dragT = 0, slowDev = !BIG_GPU;   // v35: slowDev until the speed check says otherwise (v39: not on a real graphics card)
const MV = []; let mvLast = 0;   // v39: the gaps between frames while the room moves: slow ones turn on the lower resolution while you drag
function dirty() { need = Math.max(need, 2); }
function fullRatio() { const d = window.devicePixelRatio || 1; if (SMALL) return Math.min(d, GOOD_PHONE ? 2 : 1.5); if (S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view)) return houseLite ? 1 : Math.min(d, 1.5);   // v73: the house at the screen's own sharpness (no supersampling: it's many times the living room's drawing)
  return S.quality === "hd" ? (BIG_GPU ? Math.min(Math.max(d, 1.5), 2) : Math.min(d, 1.5)) : Math.min(d, 1); }   // v39: phones at their own sharpness; v44: a real graphics card draws HD at 1.5–2×; v50: Fast on a PC at full size (was 0.85×)
/* v21: narrower screens (phones show the room at 4:3) widen the field of view so every view takes in as much of the room across as at 16:9 */
let baseFov = 50;
const fitFov = (fov, asp = camera.aspect) => asp >= 16 / 9 ? fov : Math.min(95, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * (asp < 0.8 ? 1.45 : 16 / 9) / asp) * 180 / Math.PI);   // v33: portrait, tighter
function sizeRenderer() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (!started) { start(); return; }
  // v14.1: while you drag, the picture renders at a lower resolution; it sharpens again as soon as you stop
  gl.setPixelRatio(lowRes ? Math.max(0.5, fullRatio() * 0.5) : fullRatio());
  gl.setSize(w, h, false);
  camera.aspect = w / h; if (!tween) camera.fov = fitFov(baseFov); applyShift(); dirty();
}
/* v26: with the Tools panel open, the room slides into the space beside it (laptop: left of the panel; phone: above it, half way) */
const shift = { x: 0, y: 0 }; let cover = null;   // cover: the open panel's box, so stickers under it hide
function applyShift() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w && h && (shift.x || shift.y)) camera.setViewOffset(w, h, shift.x, shift.y, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
let railR = 0;   // the right edge of the page's section rail (laptop), so stickers stay clear of it
function measureShift(open) {
  const p = document.getElementById("r3d-panel"), w = canvas.clientWidth, h = canvas.clientHeight, rail = document.querySelector(".rail");
  railR = rail && getComputedStyle(rail).display !== "none" ? rail.getBoundingClientRect().right + 6 : 0;
  shift.x = shift.y = 0; cover = null;
  if (open && p && !p.hidden && w) {
    const r = p.getBoundingClientRect(); cover = r;
    if (innerWidth >= 900) shift.x = Math.round(Math.max(0, w - r.left - railR) / 2);
    else shift.y = Math.round(Math.max(0, h - r.top) / 4);
  }
  applyShift(); dirty();
}
addEventListener("demma-tools", e => requestAnimationFrame(() => measureShift(!!e.detail)));
addEventListener("resize", () => measureShift(!!(window.DemmaTools && window.DemmaTools.isOpen())));
requestAnimationFrame(() => { measureShift(false); setLabels(labelsOn); });
new ResizeObserver(sizeRenderer).observe(canvas);
controls.addEventListener("start", () => { moving = true; });
controls.addEventListener("end", () => { moving = false; });
function frame(now) {
  requestAnimationFrame(frame);
  if (!canvas.clientWidth) return;
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / (tween.dur || 900)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(tween.from.eye, tween.to.eye, e);
    controls.target.lerpVectors(tween.from.at, tween.to.at, e);
    camera.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * e; camera.updateProjectionMatrix();
    if (k >= 1) { tween = null; if (S.cam === "look") seatLook(); syncEye(); }   // v31: looking round, the turning point comes back in front of you
    need = 2;
  }
  const changed = controls.update();
  if (changed) { need = 2; lostCheck(); }
  if (cabTween(now)) need = 2;                                    // v30: the cabinet's doors swinging or sliding
  if (liftTick(now)) need = 2;                                    // v68: Lift the bed
  if (showTick(now)) need = 2;                                    // v32: "Watch it open"
  if (!tween && !freeAbove() && (clampRoom(camera.position) | clampRoom(controls.target, true) | collide())) need = 2;   // v17: never outside the room; v41: nor in the furniture
  const active = moving || changed || !!tween;
  if (active && mvLast && now - mvLast < 250) { MV.push(now - mvLast); if (MV.length >= 24) { const m = MV.sort((a, b) => a - b)[12]; MV.length = 0;
    if (m > 28) slowDev = true; else if (m < 14 && !lowRes && BIG_GPU) slowDev = false;
    if (m > 40 && !houseLite && S.quality === "hd" && R.HOUSE3 && HOUSEV(S.view)) { houseLite = true; sizeRenderer(); toast("A lighter drawing for the house on this computer"); } } }
  mvLast = active ? now : 0;
  // v35: the lower resolution only while you hold and drag the room on a slow device, and only once the drag has lasted a moment:
  // each switch resizes the canvas (a new drawing buffer), which cost more than it saved after a tap, a fly-to or a Look change
  if (moving && slowDev) { if (!dragT) dragT = now; still_t = now; if (!lowRes && now - dragT > 150) { lowRes = true; sizeRenderer(); } }
  else { dragT = 0; if (active) still_t = now; else if (lowRes && now - still_t > 250) { lowRes = false; sizeRenderer(); } }
  if (updateCut()) need = 2;
  if (probe > 0 && !lowRes) need = Math.max(need, 1);                 // v35: the speed check's three frames come first, at the start
  if (need === 0 && !active && !SH && probe === 0 && now - preT > 120 && now - PRE.idleT > 400) {   // v35: hidden parts' shaders, off screen
    const t0 = performance.now(); while (precompileStep() && performance.now() - t0 < 10) {} preT = now; }   // v39: as many as fit in 10 ms, sooner
  if (glLost || (document.body.classList.contains("sheet-open") && !SH && !tween)) return;   // v35: nothing drawn behind the Plan's sheets (the last picture stays)
  if (need > 0) {
    const t = probe > 0 && !lowRes ? performance.now() : 0;
    const f0 = performance.now(); syncRig(); draw(); FT.calls = gl.info.render.calls; FT.tris = gl.info.render.triangles; need--; placeStickers(); FT[FT.n++ % 60] = performance.now() - f0;
    if (t) { const c = gl.getContext(); c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, PX); probeT.push(performance.now() - t); probe--; if (!probe) autoQuality(); }
  }
}
// v14.1: if this device takes too long over a full HD frame, drop to Fast (unless you picked a quality yourself)
let probe = 3; const probeT = [], PX = new Uint8Array(4);
let preT = 0;
const FT = []; FT.n = 0;   // v35: the last 60 frames' times, for R3D.perf()
function perfInfo() {   // v35: the counts to watch each round (R3D.perf())
  const i = gl.info, ls = [], ms = FT.slice().sort((a, b) => a - b);
  scene.traverseVisible(o => { if (o.isLight) ls.push(o); });
  return { calls: FT.calls, triangles: FT.tris, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length,
    lights: ls.length, shadows: ls.filter(l => l.castShadow).length, quality: S.quality, ratio: gl.getPixelRatio(), frameMs: ms.length ? +ms[ms.length >> 1].toFixed(1) : null,
    warm: PRE.queue.length, errors: store.get("r3d-errors", []).length, gpu: GPU.slice(0, 80), bigGpu: BIG_GPU, ao: aoLive(), goodPhone: GOOD_PHONE, slowDev };   // v39: which graphics card, and whether it starts in HD
}
if (/[?&]perf\b/.test(location.search)) {   // v35: ?perf in the address shows the counts in a corner (for a screenshot)
  const box = document.createElement("div"); box.className = "r3d-perf";
  box.style.cssText = "position:absolute;left:8px;bottom:8px;z-index:30;padding:6px 9px;border-radius:10px;background:rgba(0,0,0,.72);color:#fff;font:12px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre";
  root.append(box); let n0 = FT.n, t0 = performance.now();
  setInterval(() => { if (!gl || !started) return; const p = perfInfo(), t = performance.now(), fps = (FT.n - n0) * 1000 / (t - t0); n0 = FT.n; t0 = t;
    box.textContent = `${p.quality} · ${fps.toFixed(0)} frames/s · ${p.frameMs} ms\ncalls ${p.calls} · tris ${Math.round(p.triangles / 1000)}k · shaders ${p.programs}\nlights ${p.lights} · shadows ${p.shadows} · ratio ${p.ratio} · errors ${p.errors}`; }, 1000);
}
function autoQuality() {
  const ms = probeT.sort((a, b) => a - b)[1];
  if (S.quality === "fast") slowDev = ms > 30;
  if (S.quality === "hd" && GOOD_PHONE && !BIG_GPU) {   // V1.1: the shade and glow on a quick phone (also when you picked HD), measured again with them on
    if (phoneAO && ms > 30) { phoneAO = false; phoneAOoff = true; dirty(); return; }
    if (!phoneAO && !phoneAOoff && ms < 14) { phoneAO = true; dirty(); probe = 3; probeT.length = 0; return; }
  }
  if (S.picked) return;
  if (S.quality === "fast" && (!SMALL || GOOD_PHONE) && ms < (SMALL ? 18 : 20)) {   // v35: quick in Fast: on to HD, once, while the room is still (v39: capable phones too)
    S.quality = "hd"; applyLight(); syncButtons(); probe = 3; probeT.length = 0;
  } else if (ms > (SMALL ? 45 : 70) && S.quality === "hd") {   // v39: a phone goes back sooner
    S.quality = "fast"; applyLight(); syncButtons();
    qs("#r3d-savest").textContent = "Switched to Fast for this device; pick HD for shadows (saved pictures always have them).";
  }
}

/* ---------------------------------------------------------------- caption and HD save */
function updateCaption() {
  try { updatePicks(); } catch (e) {}   // v22
  const sc = SCENES[S.scene];
  const site = S.cabw === "80" ? "The compact dining cabinet, its 80-wide table" : "The compact dining cabinet";   // v33: the only table
  const cl = (cabC().len_open || cabC().len);
  const din = S.site === "C" ? { folded: S.cabw === "80" ? "folded away, four chairs inside" : "folded away, the six chairs inside", four: `open, ${cl} long, for four`, six: `open, ${cl} long, for six` }[S.dining]
    : { folded: "folded on the wall", four: "open on its gate leg, for four", six: "open on its gate leg, for six" }[S.dining];
  const paint = S.paint === "custom" ? `your colour ${S.custom}` : R.PAINTS[S.paint].name;
  const lights = sameAsScene() && S.master === 100 ? sc.name : `your lighting (from ${sc.name})`;
  qs("#r3d-cap").textContent = `${(VIEWS[S.view] || VIEWS.window).label} · ${site}, ${din} · ${lights} · ${paint}${S.drawers ? " · drawers out" : ""}${Object.values(S.ideas).some(Boolean) ? " · ideas shown (not in the plan)" : ""}${Object.keys(DEF.decor).some(k => S.decor[k] !== DEF.decor[k]) ? " · decor tried" : ""}${Object.values(S.sugg).some(Boolean) ? " · suggestions shown" : ""}`;
}
function still(w, h) {
  if (!started) start();
  const pr = gl.getPixelRatio(), size = gl.getSize(new THREE.Vector2()), asp = camera.aspect;
  const fov0 = camera.fov;
  gl.setPixelRatio(1); gl.setSize(w, h, false); camera.aspect = w / h; camera.fov = fitFov(baseFov); camera.clearViewOffset(); camera.updateProjectionMatrix();
  LIVE = false; syncRig();                                                                 // v35: the lights as they always were, for the picture
  const was = gl.shadowMap.enabled, wasQ = S.quality; gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  if (wasQ !== "hd") { S.quality = "hd"; applyLight(); gl.shadowMap.enabled = true; }
  const big = SMALL ? 1024 : BIG_GPU ? 4096 : 2048;   // v18: phones keep 1024 maps for the picture, and at most six spots cast shadows; v48: 4096 on a real card
  Object.values(lights).flat().forEach(l => { if (l.isSpotLight && l.visible) { l.castShadow = true; l.shadow.mapSize.set(big, big); if (l.shadow.map) { l.shadow.map.dispose(); l.shadow.map = null; } } });
  capShadows(Math.max(0, Math.min(6, (gl.capabilities.maxTextures || 16) - 11)));
  MATS.forEach(m => { m.needsUpdate = true; if (m.userData.trans) m.transmission = m.userData.trans; });   // v39: real glass in the pictures
  updateCut(); reshadow();
  roomEnv();                                                                              // v48 §3: the room's own reflections in every picture
  const ss = SMALL ? 1 : 2;                                                               // v48 §7: drawn at twice the size, then halved: smoother edges
  gl.setPixelRatio(ss); gl.setSize(w, h, false);
  const comp = aoComposer(w, h, ss); bloomLevels(S.tod === "day"); comp.render();         // v40: ambient occlusion in every picture (v48: and the glow, set for this picture)
  MATS.forEach(m => { if (m.userData.trans) m.transmission = 0; });
  let url;
  if (ss > 1) { const c2 = document.createElement("canvas"); c2.width = w; c2.height = h; const g2 = c2.getContext("2d"); g2.imageSmoothingQuality = "high"; g2.drawImage(canvas, 0, 0, w, h); url = c2.toDataURL("image/png"); }
  else url = canvas.toDataURL("image/png");
  gl.shadowMap.type = LIVE_SHADOW; S.quality = wasQ;
  gl.shadowMap.enabled = was;
  MATS.forEach(m => m.needsUpdate = true);
  Object.values(lights).flat().forEach(l => { if (l.isSpotLight) { l.shadow.mapSize.set(LIVE_MAP, LIVE_MAP); if (l.shadow.map) { l.shadow.map.dispose(); l.shadow.map = null; } } });
  LIVE = true;
  applyLight();
  gl.setPixelRatio(pr); gl.setSize(size.x, size.y, false); camera.aspect = asp; camera.fov = fov0; applyShift(); dirty();
  return url;
}
function stillName() {
  const site = `stairs wall (the compact cabinet${S.cabw === "80" ? ", 80 wide" : ""})`;
  return `Demma's Home ${R.VERSION || ""} - ${(VIEWS[S.view] || VIEWS.window).label.replace(/[’']/g, "")} - table on the ${site}, ${S.dining} - ${SCENES[S.scene].name}.png`;
}
qs("#r3d-save").addEventListener("click", async () => {
  const st = qs("#r3d-savest");
  const [sw, sh] = SMALL ? [2560, 1440] : [3840, 2160];   // v18: phones save at 2560 × 1440 so the picture doesn't take the room down
  st.textContent = `Rendering ${sw} × ${sh}…`;
  await new Promise(r => setTimeout(r, 30));
  const url = still(sw, sh);
  const blob = await (await fetch(url)).blob();
  const dl = (window.sharedStore && window.sharedStore.use) ? await window.sharedStore.use("downloads") : null;
  if (dl) {
    try { await dl.save({ filename: stillName(), data: blob }); st.textContent = "Saved."; }
    catch (e) { st.textContent = e && e.code === "declined" ? "Not saved." : "Couldn’t save here: right-click the picture instead."; }
  } else if (!window.sharedStore) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = stillName(); a.click(); st.textContent = "Saved.";
  } else st.textContent = "Saving isn’t available in this view.";
});

/* v39, UPGRADE_PLAN_v38 item 13 ("measure in 3D: tap two points to read the distance, so you can check a gap yourselves") */
const MEAS = { on: false, a: null, d: 0, dh: 0, dv: 0, g: null };
function clearMeasure() { MEAS.a = null; MEAS.d = 0; if (MEAS.g) { scene.remove(MEAS.g); MEAS.g.traverse(o => o.geometry && o.geometry.dispose()); MEAS.g = null; } dirty(); }
function endMeasure() { MEAS.on = false; clearMeasure(); root.classList.remove("measuring"); }
function startMeasure() { if (window.DemmaTools) window.DemmaTools.close(); MEAS.on = true; clearMeasure(); root.classList.add("measuring");
  openAct("measure", [stage.clientWidth / 2, 80]); }
const measMat = new THREE.MeshBasicMaterial({ color: "#ffcc33", depthTest: false, toneMapped: false });
function measureTap(e) {
  ray.setFromCamera(ndc(e), camera);
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h.point) && h.object.material !== measMat);
  if (!hit) return;
  if (!MEAS.g || MEAS.d) { clearMeasure(); MEAS.g = new THREE.Group(); MEAS.g.renderOrder = 999; scene.add(MEAS.g); }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), measMat); dot.position.copy(hit.point); dot.renderOrder = 999; MEAS.g.add(dot);
  if (!MEAS.a) MEAS.a = hit.point.clone();
  else { const a = MEAS.a, b = hit.point, d = b.clone().sub(a);
    MEAS.d = d.length() / M; MEAS.dh = Math.hypot(d.x, d.z) / M; MEAS.dv = Math.abs(d.y) / M;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, d.length(), 6), measMat);
    line.position.copy(a).add(b).multiplyScalar(0.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); line.renderOrder = 999; MEAS.g.add(line); }
  dirty(); actId = "measure"; act.hidden = false; renderAct();
}
/* v39, item 13 ("a now playing swap: tap the turntable to choose which LP faces out on the ledge"): the left LP on the breast's ledge
   wears one of these covers, or a photo of one of yours (kept on this device) */
const NOWP = [{ name: "Sunburst", draw: (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w * 0.7); gr.addColorStop(0, "#ffd36b"); gr.addColorStop(1, "#c8452f"); g.fillStyle = gr; g.fillRect(0, 0, w, w); } },
  { name: "Blue stripes", draw: (g, w) => { g.fillStyle = "#1f2f4f"; g.fillRect(0, 0, w, w); g.fillStyle = "#7fb2e5"; for (let i = 0; i < 8; i++) g.fillRect(0, i * w / 8 + w / 32, w, w / 32); } },
  { name: "Moon", draw: (g, w) => { g.fillStyle = "#121318"; g.fillRect(0, 0, w, w); g.fillStyle = "#f2efe8"; g.beginPath(); g.arc(w * 0.6, w * 0.4, w * 0.22, 0, 7); g.fill(); g.fillStyle = "#121318"; g.beginPath(); g.arc(w * 0.68, w * 0.36, w * 0.2, 0, 7); g.fill(); } },
  { name: "Green grid", draw: (g, w) => { g.fillStyle = "#e8e2d0"; g.fillRect(0, 0, w, w); g.fillStyle = "#3f6b3a"; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) g.fillRect(i * w / 6, j * w / 6, w / 6, w / 6); } },
  { name: "Pink waves", draw: (g, w) => { g.fillStyle = "#ffd6e5"; g.fillRect(0, 0, w, w); g.strokeStyle = "#d24b7a"; g.lineWidth = w / 40; for (let i = 0; i < 9; i++) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, i * w / 8 + Math.sin(x / 30) * 10); g.stroke(); } } },
  { name: "Plain black", draw: (g, w) => { g.fillStyle = "#151515"; g.fillRect(0, 0, w, w); g.fillStyle = "#c8a24a"; g.font = `bold ${w / 9}px sans-serif`; g.fillText("33⅓", w * 0.08, w * 0.9); } },
  { name: "Your photo", draw: null }];
let nowMesh = null, nowPic = null;
function applyNow() {
  if (!G.now_ledge) return;
  if (!nowMesh) {                       // a cover over the ledge's left LP (its corners from the plan's drawing)
    const c = [[194.82, 104.008, -5.059], [226.22, 104.008, -5.059], [226.22, 135.098, -0.689], [194.82, 135.098, -0.689]].map(p => v3(p[0], p[1], p[2] + 0.15));
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(c.flatMap(v => [v.x, v.y, v.z]), 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals();
    nowMesh = new THREE.Mesh(geo, reg(new THREE.MeshStandardMaterial({ roughness: 0.55, side: THREE.DoubleSide }))); G.now_ledge.add(nowMesh);
  }
  const k = (S.nowp || 0) % NOWP.length, P = NOWP[k];
  if (!P.tex) P.tex = P.draw ? canvasTex(256, 256, (g, w) => P.draw(g, w)) : null;
  const t = P.draw ? P.tex : nowPic;
  nowMesh.visible = !!t; if (t && nowMesh.material.map !== t) { nowMesh.material.map = t; nowMesh.material.needsUpdate = true; } dirty();
}
function pickNowPic() {                 // a photo of one of your records: scaled to 512 square, kept on this device
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const img = new Image(); img.onload = () => {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d"), s0 = Math.min(img.width, img.height);
    g.drawImage(img, (img.width - s0) / 2, (img.height - s0) / 2, s0, s0, 0, 0, 512, 512);
    try { localStorage.setItem("mw39-nowpic", c.toDataURL("image/jpeg", 0.85)); } catch (e) {}
    nowPic = new THREE.CanvasTexture(c); nowPic.colorSpace = THREE.SRGBColorSpace; S.nowp = NOWP.length - 1; applyNow(); store.set(KEY, S); renderAct(); };
    img.src = URL.createObjectURL(f); }; inp.click();
}
try { const u = localStorage.getItem("mw39-nowpic"); if (u) { const img = new Image(); img.onload = () => { nowPic = new THREE.Texture(img); nowPic.colorSpace = THREE.SRGBColorSpace; nowPic.needsUpdate = true; applyNow(); }; img.src = u; } } catch (e) {}
/* v39, item 13 ("your own light scenes: save a set of fixture angles and head settings as a named scene next to the presets"), kept on
   this device; and "Save my plan": your picks and a link to this room, to paste to us */
const MYK = "mw39-scenes";
function myScenes() { try { return JSON.parse(localStorage.getItem(MYK) || "[]"); } catch (e) { return []; } }
function drawMyScenes() {
  const box = qs("#r3d-myscl"); if (!box) return; const L = myScenes();
  box.innerHTML = L.length ? L.map((x, i) => `<span class="r3d-mysc"><button type="button" data-myscene="${i}">${x.name.replace(/[<&"]/g, "")}</button><button type="button" class="r3d-myx" data-mydel="${i}" aria-label="Delete ${x.name.replace(/[<&"]/g, "")}">×</button></span>`).join("")
    : '<span class="caption">None yet: set the lights, name it, save.</span>';
}
function saveMyScene() {
  const inp = qs("#r3d-myname"), name = (inp && inp.value.trim()) || `Scene ${myScenes().length + 1}`;
  const L = myScenes().filter(x => x.name !== name); L.push({ name, scene: S.scene, tod: S.tod, lv: S.lv, master: S.master, col: S.col, fix: S.fix, head: S.head });
  try { localStorage.setItem(MYK, JSON.stringify(L.slice(-12))); } catch (e) {} if (inp) inp.value = ""; drawMyScenes(); toast(`Saved: ${name}`);
}
function useMyScene(i) {
  const x = myScenes()[i]; if (!x) return;
  if (x.scene in SCENES) S.scene = x.scene; if (x.tod) S.tod = x.tod;
  S.lv = Object.assign({}, S.lv, x.lv || {}); S.master = Number.isFinite(+x.master) ? +x.master : 100; S.col = Object.assign({}, S.col, x.col || {});
  S.fix = Object.assign({}, x.fix || {}); S.head = JSON.parse(JSON.stringify(x.head || {}));
  applyState(); syncButtons(); toast(x.name);
}
/* v50, client: "Improve the save copy paste criteria and selection to get better info if needed now we have a lot of custom options":
   Save my plan opens a chooser. What goes in is ticked (picks and costs, the set-up, colours and decor, lights, furniture moved or added,
   the link); each line names the choice and marks what differs from the plan. Share (the phone's share sheet), Copy, and on the shared
   page Save for us, which stores it with a name and the date in the page's database (setups), where we read it directly */
const SETUP_KEYS = ["site", "dining", "cab", "cabw", "tdoor", "chairs", "beside", "plants", "seat", "lamp", "drawers", "curtains", "blind", "trolley", "ctop", "lid", "barflap", "sdraw", "foot", "lp", "laser", "lbox", "pc", "grow"];
const LAYER_NAME = { strip: "Ceiling strip", uprights: "Uprights and side shelf", bias: "TV backlight", bar1: "Spot bar 1", bar2: "Spot bar 2", lamp: "Red lamp", accent: "Accents" };
const word = v => v === true ? "on" : v === false ? "off" : String(v);
const SETUP_NAME = { site: "Where the table is", dining: "The table", cab: "The dining cabinet", cabw: "The table's width", tdoor: "The table door",
  chairs: "The chairs", beside: "Beside the cabinet", plants: "The plant stand", seat: "The fold-down seat", lamp: "The red lamp", drawers: "Media wall drawers",
  curtains: "Curtains drawn", blind: "The blind", trolley: "The trolley", ctop: "The record table's lid", lid: "The record lifted out", barflap: "The bar's flap",
  sdraw: "The step drawers", foot: "The floor the open table needs", lp: "The ledge's LP", laser: "The laser lights", lbox: "The light box", pc: "The PC's glow", grow: "The grow lights" };
const SETUP_VAL = { site: { A: "on the chimney breast (flip-top)", B: "by the stairs (flip-top)", C: "the dining cabinet by the stairs" } };
function btnName(key, val) {   // the page's own words for a choice where it has a button for it
  if (SETUP_VAL[key] && SETUP_VAL[key][val]) return [SETUP_NAME[key], SETUP_VAL[key][val]];
  const tries = typeof val === "boolean" ? (val ? ["on", "out", "up", "open", "show"] : ["off", "in", "down", "shut", "hide"]) : [val];
  let b = null; for (const t of tries) { b = qs(`[data-${key}="${t}"]`); if (b) break; }
  return [SETUP_NAME[key] || key, b ? b.textContent.trim() : word(val)];
}
function planReport(inc) {
  const only = inc.changed, out = [], ch = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  const line = (txt, changed) => { if (!only || changed) out.push(`- ${txt}${changed ? "  (changed from the plan)" : ""}`); };
  const head = t => { out.push("", t.toUpperCase()); return out.length; };
  const end = n => { if (out.length === n) out.push("- as the plan"); };
  if (inc.picks) { const n = head("Picks and costs"); const it = picks(); it.forEach(i => line(`${i.kind}: ${i.name}${i.hi ? ` (about £${i.lo}–${i.hi})` : ""}${i.plan && !/plan\)/.test(i.name) ? " (in the plan)" : ""}`, !i.plan));
    const add = it.filter(i => !i.plan), lo = add.reduce((a, i) => a + i.lo, 0), hi = add.reduce((a, i) => a + i.hi, 0);
    if (hi) out.push(`- Added to the plan's costs: about £${lo}–${hi}`); end(n); }
  if (inc.setup) { const n = head("The room's set-up");
    for (const k of SETUP_KEYS) if (k in S) { const [lab, v] = btnName(k, S[k]); line(`${lab}: ${v}`, ch(S[k], DEF[k])); }
    line(`Time of day: ${S.tod === "day" ? "daytime" : "evening"}`, S.tod !== DEF.tod); end(n); }
  if (inc.colours) { const n = head("Colours and decor");
    line(`Walls: ${S.paint === "custom" ? `your colour ${S.custom}` : R.PAINTS[S.paint].name}`, S.paint !== DEF.paint || (S.paint === "custom"));
    for (const [k, name] of WALLS) if (S.walls[k]) line(`${name}: ${S.walls[k]}`, true);
    line(`Ceiling: ${S.ceil === "match" ? "as the walls' set" : S.ceil}`, S.ceil !== DEF.ceil); line(`Skirting: ${S.skirt === "match" ? "as the walls' set" : S.skirt}`, S.skirt !== DEF.skirt);
    for (const k of Object.keys(DEF.decor)) { const d = PD.decor[k]; if (d) line(`${d[0]}: ${d[1][S.decor[k]] || S.decor[k]}`, S.decor[k] !== DEF.decor[k]); }
    end(n); }
  if (inc.lights) { const n = head("Lights"), sc = SCENES[S.scene];
    line(`Preset: ${sc ? sc.name : S.scene}${sameAsScene() ? "" : ", adjusted"}`, S.scene !== DEF.scene || !sameAsScene());
    line(`Brightness: ${S.master}%`, S.master !== 100); line(`Warmth: ${S.warm ?? 50} (0 candle-warm, 50 warm white, 100 neutral)`, (S.warm ?? 50) !== DEF.warm);
    const lv = S.lv || (sc && sc.levels) || {}; for (const k of LAYERS) if (k in lv) line(`${LAYER_NAME[k]}: ${lv[k]}%`, sc && lv[k] !== sc.levels[k]);
    for (const [k, c] of Object.entries(S.col)) if (c !== DEF.col[k]) line(`${k} colour: ${c}`, true);
    for (const [k, d] of Object.entries(S.fix)) if (+d) line(`${FIX_NAME[k] || k}: turned ${d}°`, true);
    for (const [k, h] of Object.entries(S.head)) { const [f, i] = k.split(":"), bits = [];
      if (h.on === false) bits.push("off"); if (h.lv !== undefined) bits.push(`${h.lv}%`); if (h.col) bits.push(h.col);
      if (h.yaw) bits.push(`turned ${h.yaw}°`); if (h.tilt) bits.push(`tilted ${h.tilt}°`);
      if (bits.length) line(`${FIX_NAME[f] || f}, head ${+i + 1}: ${bits.join(", ")}`, true); }
    end(n); }
  if (inc.moves) { const n = head("Furniture moved or added");
    for (const [id, L] of Object.entries(S.layout)) { const it = MOV[id]; if (!it || it.added) continue; const bits = [];
      if (L.off) bits.push("taken out"); else { if (L.x !== undefined) bits.push(`moved to ${Math.round(L.x)} from the east wall, ${Math.round(L.z - R.WINDOW_Z)} from the window`); if (L.rot) bits.push(`turned ${Math.round(L.rot)}°`); }
      if (L.col) bits.push(`colour ${L.col}`); if (bits.length) line(`${it.label}: ${bits.join(", ")}`, true); }
    for (const a of S.added) { const C = CATALOGUE[a.type], L = S.layout[a.id] || a;
      line(`Added: ${C ? C.label : a.type}, at ${Math.round(L.x ?? a.x)} from the east wall, ${Math.round((L.z ?? a.z) - R.WINDOW_Z)} from the window${L.rot ? `, turned ${Math.round(L.rot)}°` : ""}${L.col ? `, ${L.col}` : ""}`, true); }
    end(n); }
  if (inc.link) out.push("", "THE ROOM, JUST LIKE THIS", lookUrl());
  return out.join("\n").trim();
}
const planInc = () => Object.fromEntries(qsa("[data-inc]").map(b => [b.dataset.inc, b.checked]));
function planText() {
  const name = (qs("#r3d-planname")?.value || "").trim();
  return `${name || "Our plan"} (from the 3D room, ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, v${PD.version || ""})\n\n` + planReport(planInc());
}
function drawPlanText() { const t = qs("#r3d-plantext"); if (t && !qs("#r3d-planbox").hidden) t.value = planText(); }
function saveMyPlan() {
  const box = qs("#r3d-planbox"), btn = qs("[data-myplan]"); if (!box) return;
  box.hidden = !box.hidden; if (btn) btn.setAttribute("aria-expanded", String(!box.hidden));
  const sh = qs("#r3d-planshare"); if (sh) sh.hidden = !navigator.share;
  const sv = qs("#r3d-plansave"); if (sv) sv.hidden = !ldb;
  drawPlanText();
}
const planSt = t => { const st = qs("#r3d-myplanst"); if (st) st.textContent = t; };
qs("#r3d-planbox")?.addEventListener("change", drawPlanText);
qs("#r3d-planname")?.addEventListener("input", drawPlanText);
qs("#r3d-plancopy")?.addEventListener("click", () => { const text = planText(), t = qs("#r3d-plantext");
  const shown = () => { if (t) { t.value = text; t.focus(); t.select(); } planSt("Select the text above and copy it."); };
  try { navigator.clipboard.writeText(text).then(() => { planSt("Copied: paste it into your next message to us."); toast("Plan copied"); }, shown); } catch (e) { shown(); } });
qs("#r3d-planshare")?.addEventListener("click", () => { const text = planText();
  navigator.share({ title: (qs("#r3d-planname")?.value || "").trim() || "Our plan", text }).then(() => planSt("Sent."), e => { if (e && e.name !== "AbortError") planSt("Couldn't open sharing: use Copy."); }); });
qs("#r3d-plansave")?.addEventListener("click", () => { if (!ldb) return;
  const name = (qs("#r3d-planname")?.value || "").trim() || "Our plan", at = new Date().toISOString();
  const state = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k]) => !["edit", "picked"].includes(k)))));
  planSt("Saving…");
  ldb.doc("setups/" + at.replace(/[^0-9]/g, "").slice(0, 14)).set({ name, at, text: planText(), look: lookOf(), state, version: PD.version || "" })
    .then(() => { planSt(`Saved for us as “${name}”.`); toast("Saved for us"); }, e => planSt(e && e.code === "invalid_argument" ? "This view can't save (read-only): use Copy." : "Couldn't save. Try again, or use Copy.")); });
qs("#r3d-mysave")?.addEventListener("click", saveMyScene);
qs("#r3d-myname")?.addEventListener("keydown", e => { if (e.key === "Enter") saveMyScene(); });
qs("#r3d-myscl")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.mydel) { const L = myScenes(); L.splice(+b.dataset.mydel, 1); try { localStorage.setItem(MYK, JSON.stringify(L)); } catch (er) {} drawMyScenes(); }
  else if (b.dataset.myscene) useMyScene(+b.dataset.myscene); });
qsa("[data-myplan]").forEach(b => b.addEventListener("click", saveMyPlan));
qs("#r3d-measure")?.addEventListener("click", startMeasure);
drawMyScenes();

/* v39 (the approved redesign): Find: type a piece or a view and the room flies to it */
function findList() {
  const names = new Set(Object.values(VIEWS).map(v => v.label));
  for (const m of Object.values(MOV)) if (m.label && shown(m.pivot)) names.add(m.label.replace(/ \(suggested\)$/, ""));
  const dl = qs("#r3d-findlist"); if (dl) dl.innerHTML = [...names].sort().map(n => `<option value="${n.replace(/"/g, "&quot;")}"></option>`).join("");
}
function findGo(q) {
  q = (q || "").trim().toLowerCase(); if (!q) return;
  const v = Object.entries(VIEWS).find(([, V]) => V.label.toLowerCase() === q) || Object.entries(VIEWS).find(([, V]) => V.label.toLowerCase().includes(q));
  const m = Object.values(MOV).find(x => x.label && shown(x.pivot) && x.label.toLowerCase().startsWith(q)) || Object.values(MOV).find(x => x.label && shown(x.pivot) && x.label.toLowerCase().includes(q));
  if (m && (!v || !v[1].label.toLowerCase().startsWith(q))) {
    const b = new THREE.Box3().setFromObject(m.pivot), c = b.getCenter(new THREE.Vector3()), at = [-c.x / M, c.y / M, c.z / M];
    const room = [R.W / 2, 0, -150], dx = room[0] - at[0], dz = room[2] - at[2], k = 170 / Math.max(1, Math.hypot(dx, dz));
    flyTo([at[0] + dx * k, Math.max(120, at[1] + 70), at[2] + dz * k], at, 50); if (window.DemmaTools) window.DemmaTools.close(); return;
  }
  if (v) { setView(v[0]); if (window.DemmaTools) window.DemmaTools.close(); return; }
  toast("Nothing by that name in the room");
}
qs("#r3d-find")?.addEventListener("focus", findList);
qs("#r3d-find")?.addEventListener("change", e => findGo(e.target.value));
qs("#r3d-find")?.addEventListener("keydown", e => { if (e.key === "Enter") findGo(e.target.value); });
qs("#r3d-findgo")?.addEventListener("click", () => findGo(qs("#r3d-find").value));

/* ---------------------------------------------------------------- the controls */
function press(attr, val) { qsa(`[data-${attr}]`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === String(val)))); }
const sameAsScene = () => LAYERS.every(k => (S.lv[k] ?? 0) === (SCENES[S.scene].levels[k] ?? 0));
/* v36, client: "make sure its clear how to manage all these options in the 3D room": Extras opens on a row per need (ideas.OPTION_GROUPS):
   a bar (pick one of three places), the games in the ottoman, the blankets (pick one), more storage (any), the plant shelf. Picking
   shows it and flies the camera there; the row's caption says where it goes, its size and a rough cost */
const OPT = JSON.parse((document.getElementById("opt-data") || {}).textContent || '{"groups":[]}');
const optGroup = k => OPT.groups.find(g => g.k === k);
function optOn(it) {
  if (it.set.sugg) return !!S.sugg[it.set.sugg] && (it.set.sugg !== "bartrolley" || S.beside === "trolley");
  if (it.set.beside) return S.site === "C" && S.beside === it.set.beside;
  if ("lid" in it.set) return !!S.lid === it.set.lid;
  return false;
}
/* v37: one thing per place. The window corner takes one of the seat, the bench or the cupboard; the cupboard fills the corner the
   alcove shelves would hang in, and leaves only a slot to reach the far end of the wall beside the dining cabinet, so it and the
   beside pieces (the built-in bar, the shoe cabinets, the rail, the trolley...) take turns */
function extrasRule(kind, k, on) {
  if (!on) return;
  const off = (...ks) => { S.sugg = Object.assign({}, S.sugg); ks.forEach(x => { if (x !== k) S.sugg[x] = false; }); };
  if (kind === "sugg") {
    if (["windowseat", "hallbench", "wardrobe"].includes(k)) off("windowseat", "hallbench", "wardrobe");
    if (k === "wardrobe") { off("alcoveshelves", "bartrolley"); if (S.beside !== "clear") { S.beside = "clear"; toast("The cupboard takes the wall beside the cabinet"); } }
    if (k === "alcoveshelves") off("wardrobe");
  }
  if (kind === "beside" && k !== "clear") { if (S.sugg.wardrobe) off("wardrobe"); if (k !== "trolley") off("bartrolley"); }
}
function optSet(it, on) {
  if (it.set.sugg) { S.sugg = Object.assign({}, S.sugg, { [it.set.sugg]: on }); if (on && S.layout["sg_" + it.set.sugg]) delete S.layout["sg_" + it.set.sugg].off; }
  if (it.set.beside) S.beside = on ? it.set.beside : (S.beside === it.set.beside ? "clear" : S.beside);
  if ("lid" in it.set && on) S.lid = it.set.lid;
  if (on && (it.set.beside || it.set.sugg === "bartrolley")) { S.site = "C"; S.cab = "compact"; }
  if (on && it.set.sugg === "bartrolley") S.beside = "trolley";                                    // the slim trolley, dressed as a bar
  if (on && it.set.beside && S.sugg.bartrolley) S.sugg = Object.assign({}, S.sugg, { bartrolley: false });   // the rail takes its place
  if (on && it.set.sugg === "barcase" && S.plants === "breast") S.plants = "corner";
  if (it.set.sugg) extrasRule("sugg", it.set.sugg, on); else if (it.set.beside) extrasRule("beside", it.set.beside, on);   // v37
}
function optPick(gk, v) {
  const g = optGroup(gk); if (!g) return;
  const it = g.items.find(i => i.v === v);
  if (g.mode === "one") { for (const o of g.items) if (o !== it && optOn(o)) optSet(o, false); if (it) optSet(it, true); }
  else if (g.mode === "any" && it) optSet(it, !optOn(it));
  else if (it) optSet(it, true);
  applyState();
  if (it && optOn(it)) optSee(gk, it);
}
/* v39 (the approved redesign): the room opens on your plan; Try options shows what else could go in each place (tap a place or a piece,
   then ‹ › on its card), and the plan bar says how many options are on and what they add to the plan or take off it. Back to my plan
   (or Try options off) puts everything back. */
let tryOpts = false;
const FIRMS = new Set((R.FIRM && R.FIRM.sugg) || []);
const PLACE_GROUPS = { wall: ["storage"], dining: ["bar"], sofa: ["coffee", "blankets", "corner"] };
const placeOpts = pl => (PLACE_GROUPS[pl] || []).flatMap(gk => { const g = optGroup(gk); return g ? g.items.map(it => [g, it]) : []; });
const isFirm = it => (it.set.sugg && FIRMS.has(it.set.sugg)) || (it.set.beside && R.FIRM && it.set.beside === R.FIRM.beside);
function placeOf(id) {                    // the place whose options include the piece you tapped
  const k = id.startsWith("sg:") ? id.slice(3) : null;
  for (const pl of Object.keys(PLACE_GROUPS)) for (const [, it] of placeOpts(pl)) {
    if (k && it.set.sugg === k) return pl;
    if ((id === "beside" || id.startsWith("bes")) && it.set.beside) return pl;
  }
  if (id === "cab") return "dining";
  return null;
}
function placeIx(pl, id) {                // which option the card opens on: the one you tapped, else the one that's on, else the first
  const L = placeOpts(pl), k = id && id.startsWith("sg:") ? id.slice(3) : null;
  let i = k ? L.findIndex(([, it]) => it.set.sugg === k) : -1;
  if (i < 0) i = L.findIndex(([, it]) => optOn(it));
  return Math.max(0, i);
}
const besideCost = k => { for (const g of OPT.groups) for (const it of g.items) if (it.set.beside === k && it.cost) return it.cost; return [0, 0]; };
function optDelta() {
  let n = 0, lo = 0, hi = 0;
  for (const [k, on] of Object.entries(S.sugg)) if (on && !FIRMS.has(k) && PD.sugg[k]) { n++; lo += PD.sugg[k][1]; hi += PD.sugg[k][2]; }
  let off = 0; for (const k of FIRMS) if (!S.sugg[k] && PD.sugg[k]) { off++; lo -= PD.sugg[k][1]; hi -= PD.sugg[k][2]; }   // a pick taken away: a swap counts once
  const FI = new Set((R.FIRM && R.FIRM.ideas) || []);                                           // v43: the C-table is in the plan
  for (const [k, on] of Object.entries(S.ideas)) if (on && !FI.has(k) && PD.ideas[k]) { n++; lo += PD.ideas[k][1]; hi += PD.ideas[k][2]; }
  for (const k of FI) if (!S.ideas[k] && PD.ideas[k]) { off++; lo -= PD.ideas[k][1]; hi -= PD.ideas[k][2]; }
  const fb = R.FIRM ? R.FIRM.beside : "clear";
  if (S.beside !== fb) { n++; const c = besideCost(S.beside), f = besideCost(fb); lo += c[0] - f[0]; hi += c[1] - f[1]; }
  return { n: Math.max(n, off), lo, hi };
}
const gbp = v => "£" + Math.round(Math.abs(v)).toLocaleString("en-GB");
function updatePlanBar() {
  const el = qs("#r3d-plansum"); if (!el) return;
  const P = PD.plan || [0, 0];
  if (!tryOpts) { el.textContent = `Your plan · ${gbp(P[0])}–${gbp(P[1]).slice(1)}`; return; }
  const d = optDelta();
  if (!d.n) { el.textContent = "Tap a place to try something"; return; }
  const sign = (d.lo + d.hi) / 2 >= 0 ? "+" : "−", a = Math.min(Math.abs(d.lo), Math.abs(d.hi)), b = Math.max(Math.abs(d.lo), Math.abs(d.hi));
  el.textContent = `${d.n} option${d.n > 1 ? "s" : ""} on · ${sign}${gbp(a)}–${gbp(b).slice(1)}`;
}
/* v40.2: back to a good view whenever you're lost, orbiting (not looking round from a spot); v68, the client: "take out the whole room
   button for a whole house button": the whole house, every floor; pick a floor, then a room */
function wholeRoom() {
  if (SH) showStop(true);
  if (actId) closeAct();
  if (S.cam === "look") { S.cam = "orbit"; applyCam(false); syncButtons(); }
  if (R.HOUSE) hfloor = "all";
  setView(R.HOUSE ? "house" : "room"); qs("#r3d-home")?.classList.remove("lost");
}
/* v68, the client: the lift-up bed: Lift the bed raises the ottoman's lid from the foot on its struts (the four boxes inside), again lowers it */
function liftBed(on) {
  const P = HPARTS.bed_lift; if (!P) return;
  P.tw = { a: P.t, to: on ? 1 : 0, t0: performance.now() }; dirty();
  if (actId === "hbed") renderAct();                             // v71: the card follows (where the lid is going)
}
function liftTick(now) {   // each frame while a part moves (the frame loop, like the cabinet's doors)
  let on = false;
  for (const P of Object.values(HPARTS)) { if (!P.tw) continue;
    const k = Math.max(0, Math.min(1, (now - P.tw.t0) / 900)), e = k * k * (3 - 2 * k); P.t = P.tw.a + (P.tw.to - P.tw.a) * e;
    P.g.rotation.z = -P.t * P.angle * Math.PI / 180; on = true; if (k >= 1) P.tw = null; }   // three's x is flipped: the foot rises
  return on;
}
/* v71, the client: "three ways to view the room": in it (wide), from above (the ceiling and the floors over it cut away), and the room on
   its own (the house cut to the room's walls, everything else put away), so nothing clips into it */
const VIEW_ROOM = Object.fromEntries(Object.entries(ROOM_VIEW).map(([r, v]) => [v, r]));
/* v72 (B5): Above writes the room's name over its floor, faint (Hide labels hides it); On its own lays a soft shadow under the room so it
   doesn't float. One small group in the house, rebuilt on each change */
let rmodeG = null;
function rmodeDress(rr, rid) {
  if (rmodeG) { rmodeG.traverse(o => { if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); o.geometry.dispose(); } }); rmodeG.parent && rmodeG.parent.remove(rmodeG); rmodeG = null; }
  if (!rr || !houseG || RMODE === "in") return;
  const [x0, x1, z0, z1, fy] = rr, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  rmodeG = new THREE.Group(); houseG.add(rmodeG);
  const flat = (tex, sw, sd, y, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sw * M, sd * M), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.copy(v3(cx, y, cz)); m.raycast = () => {}; rmodeG.add(m); return m; };   // never in a tap's way
  if (RMODE === "alone") {
    const tex = canvasTex(256, 256, (g, W, H) => { g.clearRect(0, 0, W, H);   // a pale floor fading out, the room's shadow darker in its middle
      let gr = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2); gr.addColorStop(0, "rgba(226,221,211,0.9)"); gr.addColorStop(0.55, "rgba(226,221,211,0.55)"); gr.addColorStop(1, "rgba(226,221,211,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      gr = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W * 0.36); gr.addColorStop(0, "rgba(40,36,30,0.55)"); gr.addColorStop(0.7, "rgba(40,36,30,0.3)"); gr.addColorStop(1, "rgba(40,36,30,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    flat(tex, w * 2.2 + 80, d * 2.2 + 80, fy - 31, 1).renderOrder = -1;
  } else if (RMODE === "above") {
    const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(fy)], Ls = ((R.HOUSE3.floors[fk] || {}).labels || []);
    const L = Ls.filter(l => l.x >= x0 - 5 && l.x <= x1 + 5 && l.z >= z0 - 5 && l.z <= z1 + 5).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
    const name = (L && L.name) || rid; if (!name) return;
    const tex = canvasTex(1024, 256, (g, W, H) => { g.clearRect(0, 0, W, H); g.font = "600 120px Figtree, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.lineWidth = 14; g.strokeStyle = "rgba(20,24,22,0.55)"; g.strokeText(name, W / 2, H / 2); g.fillStyle = "rgba(255,252,245,0.95)"; g.fillText(name, W / 2, H / 2); });
    const tw = Math.min(w * 0.8, d * 0.8 * 4, 260), lab = flat(tex, tw, tw / 4, fy + 100, 0.75);   // over the furniture, under the camera
    lab.material.depthTest = false; lab.renderOrder = 998; lab.userData.rlabel = true; lab.visible = labelsOn;
  }
}
function setRmode(m, quiet) {
  RMODE = ROOMV() && m !== "in" ? m : "in";
  const rid = VIEW_ROOM[S.view], rr = RMODE !== "in" && R.HOUSE3 && (R.HOUSE3.rooms || {})[rid];
  const planes = [];
  if (rr) { const [x0, x1, z0, z1, fy] = rr, top = fy + (R.HOUSE3.ceil || 235) - 3, g = 15, P = (x, y, z, c) => new THREE.Plane(new THREE.Vector3(x, y, z), c * M);
    planes.push(P(0, -1, 0, top));                                                    // the ceiling and everything over it off
    if (RMODE === "alone") planes.push(P(1, 0, 0, x1 + g), P(-1, 0, 0, -(x0 - g)), P(0, 1, 0, -(fy - 30)), P(0, 0, 1, -(z0 - g)), P(0, 0, -1, z1 + g)); }
  RPLANES = planes;
  for (const m_ of Object.values(HMATS || {})) { m_.clippingPlanes = planes; m_.clipIntersection = false; m_.clipShadows = planes.length > 0; m_.needsUpdate = true; }   // union: outside any plane goes
  for (const k of ["tile", "ceiling"]) if (HMATS && HMATS[k]) HMATS[k].visible = !rr;   // v81: the roof's tiles off too (its low eaves lay over the bathroom's corner from above); v82 the ceilings and slopes below the cut (the bathroom's dormer ceiling)
  hidMode.forEach(o => o.visible = true); hidMode = []; applyFloors();
  if (rr && (RMODE === "alone" || rr[4] < 0)) scene.children.forEach(o => { if (o !== houseG && o !== lightRig && !o.isLight && o !== (sun && sun.target) && o.visible) { o.visible = false; hidMode.push(o); } });
  if (rr && RMODE === "alone") { const fk = { "-260": "lower", "0": "ground", "260": "first" }[String(rr[4])];   // only the room's own floor
    for (const [k, g] of Object.entries(HFLOOR)) if (k !== fk && g.visible) { g.visible = false; hidMode.push(g); } }
  rmodeDress(rr, rid);
  if (rr) { const [x0, x1, z0, z1, fy] = rr, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    // far enough that the room fills the screen, whatever its shape (a phone stands it up the screen's long side)
    const fit = (fov, sx, sy) => { const v = fov * Math.PI / 360, h = Math.atan(Math.tan(v) * camera.aspect); return 1.12 * Math.max(sx / 2 / Math.tan(h), sy / 2 / Math.tan(v)); };
    if (RMODE === "above") flyTo([cx, fy + 40 + fit(50, w, d), cz + d * 0.08], [cx, fy, cz], 50, true);
    else { const r = 0.5 * Math.hypot(w, d, 235), v = 22.5 * Math.PI / 180, h = Math.atan(Math.tan(v) * camera.aspect), D = (camera.aspect < 1 ? 0.62 : 0.85) * r / Math.sin(Math.min(v, h));   // the room's sphere in the narrower side (v72: a phone stands closer)
      const sx = Math.sign(233 - cx) || 1, sz = Math.sign(95 - cz) || 1;   // from the house's middle: over its inside walls, the outside wall behind
      flyTo([cx + sx * D * 0.4, fy + 60 + D * 0.78, cz + sz * D * 0.48], [cx, fy + 50, cz], 45, true); } }
  else if (!quiet) setView(S.view);
  reshadow(); dirty();
}
qs("#r3d-home")?.addEventListener("click", wholeRoom);
qs("#r3d-wallsel")?.addEventListener("change", e => { lookWall = e.target.value; syncButtons(); });   // v41: which wall the paints go on
document.addEventListener("keydown", e => { if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName)) wholeRoom(); });
let lostT = 0;
function lostCheck() {   // inside the room and nearly facing a wall, or looking at the floor or ceiling close up: the button glows, once a while
  const now = performance.now(); if (now - lostT < 1500 || S.edit) return; lostT = now;
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  const dist = camera.position.distanceTo(controls.target), tooSteep = Math.abs(d.y) > 0.93 && camera.position.y < R.CEIL * M;
  const b = qs("#r3d-home"); if (!b) return;
  if ((dist < 0.12 || tooSteep) && !b.classList.contains("lost")) { b.classList.add("lost"); setTimeout(() => b.classList.remove("lost"), 5000); }
}
function backToPlan() {                   // the plan: your picks, the bar beside the cabinet, no ideas
  S.sugg = Object.assign({}, DEF.sugg); S.svar = Object.assign({}, DEF.svar); S.ideas = Object.assign({}, DEF.ideas); S.beside = DEF.beside;
  S.barflap = S.lid = S.ctop = S.sdraw = false; S.trolley = "park"; applySvar(); applyState();
}
function setTry(on) {
  tryOpts = !!on; root.classList.toggle("trying", tryOpts);
  const t = qs("#r3d-try"); if (t) t.setAttribute("aria-checked", String(tryOpts));
  const bk = qs("#r3d-back"); if (bk) bk.hidden = !tryOpts;
  if (!tryOpts) { closeAct(); backToPlan(); } else { window.DemmaTools?.close(); toast("Tap a place to see what else could go there"); }
  updatePlanBar();
}
qs("#r3d-try")?.addEventListener("click", () => setTry(!tryOpts));
qs("#r3d-back")?.addEventListener("click", () => setTry(false));
function optSee(gk, it) {
  const g = optGroup(gk); it = it || (g && g.items.find(optOn));
  if (!it) { toast("Pick one first: the room shows it"); return; }
  if (it.aim && it.aim.view) setView(it.aim.view); else if (it.aim) flyTo(it.aim.eye, it.aim.at, it.aim.fov || 55);
}
function syncOpts() {
  for (const g of OPT.groups) {
    const on = g.items.filter(optOn);
    qsa(`[data-opt^="${g.k}:"]`).forEach(b => { const v = b.dataset.opt.split(":")[1], it = g.items.find(i => i.v === v);
      b.setAttribute("aria-pressed", String(v === "none" ? !on.length : !!(it && optOn(it)))); });
    const cap = qs(`[data-optcap="${g.k}"]`); if (!cap) continue;
    const say = it => `${it.title} (${it.size}${it.cost ? `; about £${it.cost[0]}–${it.cost[1]}` : ""}). ${it.where}`;
    cap.textContent = on.length ? on.map(say).join(" ") + (g.mode === "any" ? "" : " " + g.note.split(".").slice(1).join(".").trim()) : g.note;
  }
}
function syncButtons() {
  press("site", S.site); press("dining", S.dining); press("scene", S.scene); press("tod", S.tod);
  qsa("[data-scene]").forEach(b => b.classList.toggle("adjusted", b.dataset.scene === S.scene && !(sameAsScene() && S.master === 100)));   // v25: "Bright · adjusted"
  const ln = qs("#r3d-litst"); if (ln) ln.textContent = SCENES[S.scene].name + (sameAsScene() && S.master === 100 ? "" : " · adjusted") + (S.tod === "day" ? " · daytime" : "");
  const bn = qs("#r3d-boost"); if (bn) bn.hidden = !tableOpen(); press("lamp", S.lamp);
  const wh = (lookWall === "all" ? paintHex() : chHex("w:" + lookWall)).toLowerCase();                 // v38: the paint row shows the chosen wall's paint
  qsa("[data-paint]").forEach(b => b.setAttribute("aria-pressed", String(lookWall === "all" ? S.paint === b.dataset.paint : R.PAINTS[b.dataset.paint].hex.toLowerCase() === wh)));
  const ws = qs("#r3d-wallsel"); if (ws && ws.value !== lookWall) ws.value = lookWall;   // v41: the wall picker is a list now
  qsa("[data-lookwall]").forEach(b => { const k = b.dataset.lookwall; b.setAttribute("aria-pressed", String(k === lookWall)); const i = b.querySelector("i"); if (i) i.style.setProperty("--c", k === "all" ? paintHex() : chHex("w:" + k)); });
  const wm = qs("[data-wallmatch]"); if (wm) { wm.hidden = lookWall === "all"; wm.disabled = !S.walls[lookWall]; }
  press("drawers", S.drawers ? "out" : "in"); press("quality", S.quality); press("view", S.view);
  press("ceil", S.ceil); press("skirt", S.skirt); press("plants", S.plants); press("chairs", S.chairs); press("seat", S.seat);
  press("cab", S.cab); press("cabw", S.cabw); press("tdoor", S.tdoor ? "open" : "shut");                                   // v30
  press("cam", S.cam); press("pad", S.pad ? "on" : "off"); press("foot", S.foot ? "on" : "off"); press("beside", S.beside); syncEye();   // v31
  qsa("[data-tog]").forEach(b => b.setAttribute("aria-pressed", String(!!S[b.dataset.tog])));
  qsa("[data-idea]").forEach(b => b.setAttribute("aria-pressed", String(!!S.ideas[b.dataset.idea])));
  qsa("[data-sugg]").forEach(b => b.setAttribute("aria-pressed", String(!!S.sugg[b.dataset.sugg])));
  qsa("[data-svar]").forEach(b => { const [k, v] = b.dataset.svar.split(":"); b.setAttribute("aria-pressed", String(svarOf(k) === v)); });   // v28
  let anyOn = false; qsa("[data-svrow]").forEach(r => { const on = !!S.sugg[r.dataset.svrow]; r.hidden = !on; anyOn = anyOn || on; });
  const svn = qs("#r3d-svnone"); if (svn) svn.hidden = anyOn;
  qsa("[data-decor]").forEach(b => { const [k, v] = b.dataset.decor.split(":"); b.setAttribute("aria-pressed", String(S.decor[k] === v)); });
  qs("#r3d-custom").value = lookWall === "all" ? S.custom : chHex("w:" + lookWall);
  qsa("[data-paintcustom]").forEach(b => b.setAttribute("aria-pressed", String(lookWall === "all" ? S.paint === "custom" && S.custom.toLowerCase() === b.dataset.paintcustom.toLowerCase() : wh === b.dataset.paintcustom.toLowerCase())));
  if (S.ceil !== "match" && qs("#r3d-ceil")) qs("#r3d-ceil").value = S.ceil;
  if (S.skirt !== "match" && qs("#r3d-skirt")) qs("#r3d-skirt").value = S.skirt;
  const warmWord = w => w < 25 ? "candle" : w < 45 ? "warm" : w <= 55 ? "warm white" : w < 80 ? "soft white" : "neutral";
  qsa("[data-lv]").forEach(i => { const k = i.dataset.lv, v = k === "master" ? S.master : k === "warm" ? (S.warm ?? 50) : (S.lv[k] ?? 0); i.value = v;
    qs(`[data-lvout="${k}"]`).textContent = k === "warm" ? warmWord(v) : `${Math.round(v)}%`; });
  qsa("[data-col]").forEach(i => { i.value = S.col[i.dataset.col] || WARM; });
  syncOpts();                                                                                       // v36
  if (actId) renderAct();                                                                           // v30: the item's card follows
}
root.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !root.contains(b)) return;
  const d = b.dataset;
  if (d.show) { showCtl(d.show); return; }
  if (SH) { if (d.view || d.walk || d.eye || d.level || b.id === "r3d-reset" || b.id === "r3d-full") SH.own = true; else if (!d.showopen) showStop(true); }   // v32: the camera's buttons leave the show running
  if (d.view) { setView(d.view); return; }
  if (d.rmode) { if (LIVV()) setView(LIV_RMODE[d.rmode]); else setRmode(d.rmode); if (actId) closeAct(); return; }   // v71: in it, from above, on its own (v78b: the living room's views)
  if (d.hbed) { liftBed(d.hbed === "up"); return; }                          // v71: the bed's card
  if (d.walk) { if (e.detail === 0) walk(d.walk); return; }   // v31: a pointer moves on pointerdown (held, it repeats); Enter or Space here
  if (d.eye) { lift(+d.eye); return; }
  if (d.level) { levelView(); return; }
  if (d.site) { S.site = d.site; applyState(); if (S.view === "dining") setView("dining"); }
  else if (d.dining) { S.dining = d.dining; S.tdoor = false; applyState(); if (S.view === "dining") setView("dining"); }   // v30: folding it shuts the door too
  else if (d.cab) { S.cab = d.cab; S.site = "C"; applyState(); if (S.view === "dining" || S.view === "chairs") setView(S.view); }   // v30: the compact or the sliding cabinet
  else if (d.cabw) { S.cabw = d.cabw; applyState(); if (S.view === "dining" || S.view === "chairs") setView(S.view); }              // v33: the table 90 or 80 wide
  else if (d.tdoor) { S.tdoor = d.tdoor === "open"; if (S.tdoor && S.chairs === "open") S.chairs = "cupboard"; applyState(); }
  else if (d.scene) S.scene = d.scene, S.lv = Object.assign({}, SCENES[d.scene].levels), S.master = 100, applyLight(), updateCaption(), store.set(KEY, S);   // tapping the tile again resets it
  else if (d.tod) S.tod = d.tod, applyLight(), updateCaption(), store.set(KEY, S);
  else if (d.ceil) S.ceil = d.ceil, repaint(), store.set(KEY, S), dirty();
  else if (d.skirt) S.skirt = d.skirt, repaint(), store.set(KEY, S), dirty();
  else if (d.colreset) S.col[d.colreset] = WARM, applyLight(), store.set(KEY, S);
  else if (d.tog) S[d.tog] = !S[d.tog], applyLight(), store.set(KEY, S);
  else if (d.layer) { const [k, v] = d.layer.split(":"); S.lv = Object.assign({}, S.lv, { [k]: v === "on" ? (SCENES[S.scene].levels[k] || 60) : 0 }); applyLight(); updateCaption(); store.set(KEY, S); }   // v30: a light on or off from a card
  else if (d.opt) { const [gk, v] = d.opt.split(":"); optPick(gk, v); }                            // v36: the option rows
  else if (d.optsee) { optSee(d.optsee); return; }
  else if (d.ctop) { S.ctop = d.ctop === "up"; applyState(); }                                       // v36: the lift-top coffee table
  else if (d.sugg || d.suggall) {     // v21: a suggestion on or off (a piece you'd removed in Edit room comes back), or all of them
    const keys = d.sugg ? [d.sugg] : qsa("[data-sugg]").map(x => x.dataset.sugg), on = d.sugg ? !S.sugg[d.sugg] : d.suggall === "on";
    S.sugg = Object.assign({}, S.sugg); keys.forEach(k => { S.sugg[k] = on; if (S.layout["sg_" + k]) delete S.layout["sg_" + k].off; });
    if (on && keys.includes("bartrolley")) { S.beside = "trolley"; S.site = "C"; S.cab = "compact"; }   // v34: it's the slim trolley, dressed
    if (on && keys.includes("barcase") && S.plants === "breast") S.plants = "corner";                  // v34: under the case, on a free breast
    if (d.sugg) extrasRule("sugg", d.sugg, on);                                                        // v37: one thing per place
    else if (on) { S.sugg.hallbench = S.sugg.wardrobe = false; S.sugg.windowseat = true; S.sugg.alcoveshelves = true; }   // all on: the corner takes the seat
    applyState(); }
  else if (d.optclear) {                                                                               // v37: every extra off, back to the plan
    backToPlan(); closeAct(); toast("Back to your plan"); }                                            // v39: your picks stay (they're the plan)
  else if (d.svar) { const [k, v] = d.svar.split(":"); S.svar = Object.assign({}, S.svar, { [k]: v }); applySvar(); placeAll(); updateCaption(); store.set(KEY, S); dirty(); }   // v28
  else if (d.tour) { tourCtl(d.tour); return; }
  else if (b.id === "r3d-tourbtn") { tourStart(); return; }
  else if (b.id === "r3d-link") { copyLook(); return; }
  else if (d.decor) {           // v20: decor; picking what's in the case (or its frame) shows the case, which hangs with the table by the stairs
    const [k, v] = d.decor.split(":"), was = caseOn(); S.decor = Object.assign({}, S.decor, { [k]: v });
    if ((k === "fill" || k === "frame") && S.site === "A") S.site = "C";                              // v27: the case needs the breast free (v34: it's the plan)
    applyState(); if ((k === "fill" || k === "frame") && !was) setView("breast"); }
  else if (d.idea) S.ideas = Object.assign({}, S.ideas, { [d.idea]: !S.ideas[d.idea] }), applyLight(), placeAll(), updateCaption(), store.set(KEY, S);
  else if (d.plants) {           // v18: the layout puts the stand and the shelf back on their spots for it
    S.plants = d.plants; for (const k of ["plants", "records"]) if (S.layout[k]) { delete S.layout[k].x; delete S.layout[k].z; delete S.layout[k].rot; }
    applyState(); }
  else if (d.feature) {                                                                                // v39, item 13: feature-wall presets
    S.walls = {}; if (d.feature !== "none") S.walls[d.feature] = "#5e6a5b"; repaint(); updateCaption(); store.set(KEY, S); dirty(); }
  else if (d.lookwall) lookWall = d.lookwall;                                                        // v38: which wall the paints go on
  else if (d.wallmatch) setWall(lookWall, "match"), repaint(), updateCaption(), store.set(KEY, S), dirty();
  else if (d.paint) (lookWall === "all" ? (S.paint = d.paint) : setWall(lookWall, d.paint)), repaint(), updateCaption(), store.set(KEY, S), dirty();
  else if (d.lamp) S.lamp = d.lamp, applyState();
  else if (d.drawers) S.drawers = d.drawers === "out", applyState();
  else if (d.chairs) { S.chairs = d.chairs; if (d.chairs === "open") S.tdoor = false; applyState(); }   // v30: one door open at a time
  else if (d.seat) S.seat = d.seat, applyState();
  else if (d.cam) S.cam = d.cam, applyCam(), store.set(KEY, S);
  else if (d.moment) { playMoment(d.moment); return; }                                              // v31
  else if (d.showopen) { showOpen(); return; }
  else if (d.blind) { S.blind = d.blind; applyState(); }
  else if (d.barflap) { S.barflap = d.barflap === "open"; applyState(); }                          // v34: the drinks cabinet's front
  else if (d.lid) { S.lid = d.lid === "off"; applyState(); }                                       // v34: the storage ottoman's lid                                          // v34
  else if (d.lp) { S.lp = d.lp === "out"; applyState(); }
  else if (d.trolley) { S.trolley = d.trolley; if (d.trolley === "out") { S.beside = "trolley"; S.site = "C"; S.cab = "compact"; } applyState(); }
  else if (d.beside) { S.beside = d.beside; if (d.beside !== "clear") { S.site = "C"; S.cab = "compact"; } extrasRule("beside", d.beside, true); applyState(); }   // v31; v37: one thing per place
  else if (d.sdraw) { S.sdraw = d.sdraw === "out"; applyState(); }                                // v37: the drawers in the bottom steps
  else if (d.foot) { S.foot = d.foot === "on"; if (S.foot) { S.site = "C"; S.dining = "folded"; } applyState(); }
  else if (d.pad) S.pad = d.pad === "on", applyPad(), store.set(KEY, S);
  else if (d.quality) S.quality = d.quality, S.picked = true, applyLight(), store.set(KEY, S);
  else if (b.id === "r3d-full") { const st = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.())?.catch?.(() => {}); return; }
  else if (d.paintcustom) (lookWall === "all" ? (S.custom = d.paintcustom, S.paint = "custom") : setWall(lookWall, d.paintcustom)), repaint(), updateCaption(), store.set(KEY, S), dirty();   // v25: Deep green, a ready-made custom colour
  else if (b.id === "r3d-reset") { setView(S.view); return; }
  else return;
  syncButtons();
});
qs("#r3d-custom").addEventListener("input", e => { if (lookWall === "all") { S.custom = e.target.value; S.paint = "custom"; } else setWall(lookWall, e.target.value); repaint(); syncButtons(); updateCaption(); store.set(KEY, S); dirty(); });
// v15: the sliders, the colour bulbs, and the ceiling and skirting paints
root.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (d.lv) { const v = +t.value; if (d.lv === "master") S.master = v; else if (d.lv === "warm") S.warm = v; else S.lv[d.lv] = v; syncButtons(); applyLight(); updateCaption(); store.set(KEY, S); }
  else if (d.col) { S.col[d.col] = t.value; applyLight(); }
  else if (t.id === "r3d-ceil") { S.ceil = t.value; press("ceil", ""); repaint(); dirty(); }
  else if (t.id === "r3d-skirt") { S.skirt = t.value; press("skirt", ""); repaint(); dirty(); }
  else if (t.id === "r3d-eye") { lift(+t.value); const o = qs("#r3d-eyeout"); if (o) o.textContent = `${t.value} cm`; return; }   // v31
  else return;
  store.set(KEY, S);
});

/* ---------------------------------------------------------------- go: built the first time the room is on screen (v14.1) */
let started = false;
/* v48 §6: the sun by day, through the window: it casts the frame, the bars and the sill's plants onto the sill, the sofa and the floor.
   Its direction (geometry.SUN: degrees round from straight out of the window towards the room's +x, and up): v49, 7 am in June, low from
   the right (the back faces 14° east of north: the only sun the room gets is on spring and summer mornings). Always in the scene (a light coming and going would rebuild every shader), dark by night
   and in Fast, which has no shadows. */
const SUNCFG = { lux: 80 };   // tuned on stills: the bars' shadows read on the sofa, the ottoman and the rug, the floor not washed out
/* v54, client: "You have rough measurements now and pictures so I'd like you to run the drafts" (every floor and both gardens): each
   floor laid out as a plan in 3D (floors, walls cut at 110 like a dolls' house, solid walls dark, windows blue, doors brown, each room
   named with its use and rough size), the ground floor round the real living room, the lower ground floor to the east and the first
   floor to the west at their own levels, the front drive and lawn. From house/house.py (the client's corrected plans, the agent's sizes) */
/* v59: real surfaces for the built house, drawn in the page (the shared page can't load picture files into the 3D room), sized to the
   world so a brick is a brick on every wall: stretcher-bond brick in the photos' reds, concrete roof tiles in rows, the dormer's hung
   tiles, lawn, concrete, paving, road, carpet, the kitchen's floor tiles, boards. Each: the canvas and the metres it covers */
const HTEX = {}, HI_T = new Set(["paint", "ceiling", "stone", "marble", "metro", "tile_w", "tile_f", "pine", "oak", "birch", "door_wood", "chalk"]);
function houseTex(k) {
  if (k in HTEX) return HTEX[k];
  /* v70 (BUILD_SPEC phase 3): CC0 photo-textures (Poly Haven, house/SOURCES.md) where we have them, inline so the shared page shows them
     too (loading from elsewhere failed there in v50); the drawn ones below stay for everything else and as the fallback */
  const PT = PHOTO, pk = PT[{ party: "brick", soldier: "brick" }[k] || k];
  if (pk && pk.map) {
    const img = (src, srgb) => { const t = new THREE.Texture(), im = new Image(); t.image = im; t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; im.onload = () => { t.needsUpdate = true; reshadow(); dirty(); }; im.src = src; return t; };
    return (HTEX[k] = { map: img(pk.map, true), normal: pk.nor ? img(pk.nor, false) : null, size: [pk.size, pk.size], bump: 0 });
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
    hung: [0.66, 0.40, (g, w, h) => {                  // plain tiles hung on the dormer, 16.5 × 10 gauge
      const tw = w / 4, th = h / 4, b = ["#6f4636", "#653f31", "#78503e"];
      for (let r = 0; r < 4; r++) for (let c = -1; c < 5; c++) {
        const x = c * tw + (r % 2 ? tw / 2 : 0); g.fillStyle = b[Math.floor(rnd() * 3)]; g.fillRect(x, r * th, tw, th);
        g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(x, r * th + th - 3, tw, 3); g.fillRect(x, r * th, 2, th);
      }
      noise(g, w, h, 3000, 0.25, ["#000", "#caa"]); }],
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
      const gr = g.createLinearGradient(k * bw, 0, (k + 1) * bw, 0); gr.addColorStop(0, "rgba(0,0,0,0.28)"); gr.addColorStop(0.18, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(255,240,220,0.08)");
      g.fillStyle = gr; g.fillRect(k * bw, 0, bw, h); }
    for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "70,55,40" : "200,180,150"},${0.06 + rnd() * 0.1})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 30 + rnd() * 140); }
    for (const yy of [0.12, 0.88]) { g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, h * yy, w, 6); } }];
  T.paint = [0.8, 0.8, (g, w, h) => { g.fillStyle = "#f1ede5"; g.fillRect(0, 0, w, h);   // emulsion, a roller's stipple
    for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 90, gr = g.createRadialGradient(x, y, 1, x, y, r);   // v72 (B3): the roller's faint laps
      gr.addColorStop(0, rnd() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(200,192,178,0.04)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    noise(g, w, h, 16000, 0.06, ["#d9d3c7", "#ffffff"]); }];
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
    tile_w: 0.8, carpet: 1.4, carpet_grey: 1.4, brick: 1.2, hung: 1.0, tile: 1.0, stone: 0.5, metro: 0.6, laminate: 0.4, oak: 0.4, marble: 0.3 };   // v69
  return (HTEX[k] = { map: tex, size: [sw, sh], bump: BUMP[k] || 0 });
}
/* world-sized UVs (metres over the texture's size), by the face's direction: floors and roofs from above, walls from the side; roof
   slopes measured along the slope (35°) so the tile rows keep their gauge */
/* V1.3: the gardens' plants (survey_data.PLANTS, from the client's photos). A cordyline: a grey-brown trunk forking into heads of long,
   narrow leaves, the young ones up, the old ones arching out and down; one merged mesh for the trunks, one for the leaves */
function buildPlants(grp) {
  const PL = (R.HOUSE3 && R.HOUSE3.plants) || []; if (!PL.length || !grp) return;
  const bark = reg(new THREE.MeshStandardMaterial({ color: "#6f6253", roughness: 0.95 })), leaf = reg(new THREE.MeshStandardMaterial({ color: "#5b7a38", roughness: 0.6, side: THREE.DoubleSide }));
  bark.clippingPlanes = []; leaf.clippingPlanes = [];
  let sd = 4242; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const Y = new THREE.Vector3(0, 1, 0);
  for (const P of PL) {
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
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); sp.renderOrder = 999;
    sp.scale.set(wcm * M, wcm * M * 160 / 512, 1); sp.position.copy(v3(x, y, z)); sp.userData.hlabel = true; cur.add(sp); };
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
    const m3 = {}, mat3 = k => m3[k] || (m3[k] = k === "contact" ? contactMat() : (() => { const [c, r] = H3.mats[k] || ["#cccccc", 0.9], gl3 = k === "glass", T = houseTex(k);
      const m = reg(new THREE.MeshStandardMaterial({ color: T ? "#ffffff" : c, map: T ? T.map : null, bumpMap: T && T.bump ? T.map : null, bumpScale: T ? T.bump : 1, normalMap: T && T.normal || null, roughness: r, metalness: k === "brass" || k === "chrome" || k === "steel" ? 0.8 : 0, transparent: gl3, opacity: gl3 ? 0.3 : 1, depthWrite: !gl3, side: THREE.DoubleSide,
        emissive: { led: "#ffffff", pc_glow: "#cfe0ff", screen: "#1b2433" }[k] || "#000000", emissiveIntensity: { led: 1.5, pc_glow: 0.9, screen: 0.6 }[k] || 0 }));   // v60: the kitchen's LED battens glow; v61: the PC's glass, the screens
      m.envMapIntensity = 0.15;   // v60: the reflections are the living room's (its LEDs tinted the kitchen's white walls pink)
      if (!SMALL) { m.userData.hk = k; m.envMap = houseEnv(); m.envMapIntensity = finishEnv(m); }   // v73: one neutral room, made once
      m.clippingPlanes = []; m.userData.hk = k; return m; })());
    HMATS = m3;
    const put = (g, geos, m) => { if (!geos.length) return; const me = new THREE.Mesh(worldUV(mergeGeometries(geos), m.userData.hk), m); me.receiveShadow = true;
      me.castShadow = !m.transparent; g.add(me); geos.forEach(q => q.dispose()); };   // v69: the house's walls and pieces cast the sun's shadow (as the living room's)
    const mx = new THREE.Matrix4();
    /* v69 (B4), the client: "more realistic like our living room": furniture, fittings and soft things with rounded edges (cm by
       material: the whites and woods a little, the suite and cushions a lot); walls, floors and frames stay sharp */
    const ROUND = { pine: 0.8, pine_dark: 0.3, birch: 0.6, oak: 0.6, wardrobe: 0.5, gloss: 0.8, door_white: 0.4, door_wood: 0.4, fitting: 6, porcelain: 1,
      primrose: 4, duvet: 3, pot: 4, lycksele: 3, storebox: 1.5, leather: 2, check: 1, curtain: 1, mattress: 4 };
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
      const b = new RoundedBoxGeometry(w * M, h * M, d * M, 1, Math.max(0.0005, Math.min(r, Math.min(w, h, d) / 2 - 0.05)) * M);
      b.translate(c.x, c.y, c.z); return b; };
    /* V1 (Phase 3): a floor can be built again with the client's edits (editedFloor: the edited pieces moved and sized, the walls round a
       door or a window following it); the floor keeps its group, so what's shown and hidden stays as it was */
    HBUILD = (fk, F) => {
      cur = HFLOOR[fk];
      if (cur) { for (const c of [...cur.children]) { if (c.userData.hlabel) continue; cur.remove(c); c.traverse(o => o.geometry && o.geometry.dispose()); } }
      else { cur = HFLOOR[fk] = new THREE.Group(); houseG.add(cur); }
      const fresh = !cur.userData.built; cur.userData.built = true;
      SHARED = sharedFaces(F);
      for (const [mk, list] of Object.entries(F.boxes)) put(cur, list.map(([x0, y0, z0, x1, y1, z1]) => houseBox(mk, x0, y0, z0, x1, y1, z1)), mat3(mk));
      SHARED = new Set();
      const byMat = {};
      for (const P of F.prisms) {                     // a profile extruded: along x the profile is (z, y), along z it is (x, y)
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(P.pts.map(([u, w]) => new THREE.Vector2(u * M, w * M))), { depth: (P.b - P.a) * M, bevelEnabled: false });
        if (P.axis === "x") mx.set(0, 0, -1, -P.a * M, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1); else mx.set(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, P.a * M, 0, 0, 0, 1);
        g.applyMatrix4(mx); (byMat[P.m] = byMat[P.m] || []).push(g);
      }
      for (const [mk, geos] of Object.entries(byMat)) put(cur, geos, mat3(mk));
      const byL = {};                                 // v70: the suite's turned shapes (pans, seats, bowls)
      for (const L of F.lathes || []) { const g = new THREE.LatheGeometry(L.p.map(([r, h]) => new THREE.Vector2(r * M, h * M)), SMALL ? 12 : 28);
        g.scale(L.s[0], 1, L.s[1]); const c = v3(L.c[0], L.c[1], L.c[2]); g.translate(c.x, c.y, c.z); (byL[L.m] = byL[L.m] || []).push(g); }
      for (const [mk, geos] of Object.entries(byL)) put(cur, geos, mat3(mk));
      if (fresh) for (const L of F.labels || []) label([L.name, [L.use, `about ${L.w.toFixed(1)} × ${L.d.toFixed(1)} m`].filter(Boolean).join(" · ")], L.x, L.y, L.z, 190);
      for (const [pk, P] of Object.entries(F.parts || {})) {   // v68: a piece that moves, its boxes round its hinge
        const pv = v3(...P.pivot), g = new THREE.Group(); g.position.copy(pv); cur.add(g);
        for (const [mk, list] of Object.entries(P.boxes)) put(g, list.map(([x0, y0, z0, x1, y1, z1]) => houseBox(mk, x0, y0, z0, x1, y1, z1).translate(-pv.x, -pv.y, -pv.z)), mat3(mk));
        const was = HPARTS[pk]; HPARTS[pk] = { g, angle: P.angle, t: was ? was.t : 0 };
        if (was && was.t) g.rotation.z = was.g.rotation.z;
      }
      if (EMBH) EMBH.pickable(fk, F);
    };
    for (const [fk, F] of Object.entries(H3.floors)) HBUILD(fk, editedFloor(fk, F));
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
}
function buildSun() {
  const SN = R.SUN || { az: -12, el: 45 }, az = SN.az * Math.PI / 180, el = SN.el * Math.PI / 180;
  const wc = [(R.WINDOW_X[0] + R.WINDOW_X[1]) / 2, 120, R.WINDOW_Z], L = 700;
  sun = new THREE.DirectionalLight("#fff0d8", 0); sun.userData.sun = true;
  sun.position.copy(v3(wc[0] + Math.sin(az) * Math.cos(el) * L, wc[1] + Math.sin(el) * L, wc[2] - Math.cos(az) * Math.cos(el) * L));
  sun.target.position.copy(v3(wc[0] - Math.sin(az) * 160, 0, wc[2] + 160));
  sun.userData.p0 = sun.position.clone(); sun.userData.t0 = sun.target.position.clone();   // v69: where it sits for the living room
  sun.castShadow = true; sun.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  const c = sun.shadow.camera; c.left = -5.5; c.right = 5.5; c.top = 5.5; c.bottom = -5.5; c.near = 0.5; c.far = 16; c.updateProjectionMatrix();   // the whole room: outside it the sun shone through walls
  scene.add(sun, sun.target);
  if (R.HOUSE3) for (let k = 0; k < 2; k++) { const l = new THREE.PointLight("#ffcf98", 0, 7, 2); l.visible = false; l.userData.houseLight = true; scene.add(l); ROOMLIGHTS.push(l); }   // v69 (B3): at the start, so the set never changes
}
function start() {
  started = true;
  const t0 = performance.now();
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = ENV.studio = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  buildSun();
  gl.localClippingEnabled = true;
  scene.add(lightRig);                                                                  // v35: the fixed set of lights
  buildShell(); buildLights(); buildFurniture(); buildSuggest(); buildSeatAndPouf();   // v69 (B6): the house is built the first time it's looked at
  bar1 = buildBar(R.BAR1, lights.bar1, "bar1");
  gl.shadowMap.enabled = S.quality === "hd";
  cabSnap = true; applyState(); cabSnap = false;          // v30: the doors start where they are, no swing
  syncButtons();
  scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) [].concat(o.material).forEach(m => m && !m.clippingPlanes && clipMat(m)); });   // v21: the cutaway
  setView(S.view, true);
  applyCam(S.cam === "look"); applyPad();                                               // v31
  sizeRenderer();
  // v81: no gl.compile here: it ran before the cutaway's clipping was set, so its 28 programs never matched the first frame's (which made
  // its own): 60 compiled for 32 used, about 1.7 s of a 15 s start here (more on a phone)
  msg.hidden = true;
  root.classList.add("ready");
  requestAnimationFrame(frame);
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
    still, ready: true, buildMs: Math.round(performance.now() - t0), _dbg: { gl, scene, lights, get sun() { return sun; }, SUNCFG, get winGlass() { return winGlass; }, AO, ENV, envLevels, bloomLevels, roomEnv, THREE, S, MOV, floorHop, collide, solidBoxes, leafTexture, UNDO, camera, controls, VIEWS, MATS, OAK_TEX, CABP, SUGG_G, IDEA_G, CATALOGUE, BES, WORK, precompile, PRE, AIMG },
    errors: () => store.get("r3d-errors", []),                                       // v35: what the trap kept
    perf: perfInfo,                                                                   // v35: the counts to watch each round
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

/* ---------------------------------------------------------------- V1: the bridge to the app (Demma's Home), only with ?embed
   The app (the page around this frame) says where to look and what's being edited; this frame says what was tapped. Messages are
   {src: "demma", cmd, ...} in and {src: "r3d", type, ...} out. Taps in the house name a piece by its id (house/export_house.py's items);
   in the living room they name its own parts ("living:wall", "living:cab" ...). */
if (EMBED) {
  root.classList.add("embed");
  EMBH = (() => {
    const post = (type, d = {}) => { try { parent.postMessage(Object.assign({ src: "r3d", type }, d), "*"); } catch (e) {} };
    const PICK = {};
    const wbox = b => new THREE.Box3(new THREE.Vector3(-b[3] * M, b[1] * M, b[2] * M), new THREE.Vector3(-b[0] * M, b[4] * M, b[5] * M));
    function pickable(fk, F) {
      const tags = F.tags || [], list = [];
      for (const [m, boxes] of Object.entries(F.boxes)) { if (m === "contact") continue; const bt = (F.bt || {})[m] || [];
        boxes.forEach((b, i) => { if (bt[i] >= 0) list.push({ id: tags[bt[i]], b: wbox(b) }); }); }
      for (const L of F.lathes || []) if (L.t >= 0) { const r = Math.max(...L.p.map(q => q[0])), h = Math.max(...L.p.map(q => q[1]));
        list.push({ id: tags[L.t], b: wbox([L.c[0] - r * L.s[0], L.c[1], L.c[2] - r * L.s[1], L.c[0] + r * L.s[0], L.c[1] + h, L.c[2] + r * L.s[1]]) }); }
      for (const P of Object.values(F.parts || {})) for (const [m, boxes] of Object.entries(P.boxes)) { const bt = (P.bt || {})[m] || [];
        boxes.forEach((b, i) => { if (bt[i] >= 0) list.push({ id: tags[bt[i]], b: wbox(b) }); }); }
      PICK[fk] = list;
    }
    const FK = { "-260": "lower", "0": "ground", "260": "first" };
    function roomAt(p) {
      if (!p || !R.HOUSE3) return null; const x = -p.x / M, y = p.y / M, z = p.z / M;
      if (!(houseG && houseG.visible) && x >= 0 && x <= R.W && z >= R.WINDOW_Z && z <= R.ALC_D && y > -5 && y < 240) return "living";
      for (const [id, r] of Object.entries(R.HOUSE3.rooms || {})) if (x >= r[0] - 5 && x <= r[1] + 5 && z >= r[2] - 5 && z <= r[3] + 5 && y >= r[4] - 30 && y <= r[4] + 250) return id;
      if (x >= 0 && x <= R.W && z >= R.WINDOW_Z && z <= R.ALC_D && y > -5 && y < 240) return "living";
      return null;
    }
    function tap(e) {
      ray.setFromCamera(ndc(e), camera);
      const inHouse = o => under(o, houseG);                                   // the house's materials ignore the living room's cutaway (CLIP)
      const cut = (q, o) => RPLANES.some(pl => pl.distanceToPoint(q) < 0) || (!(o && inHouse(o)) && clippedAt(q));
      if (houseG && houseG.visible && R.HOUSE3) {
        const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.isMesh && shown(h.object) && h.object.material && h.object.material.visible !== false
          && !["contact", "glass"].includes(h.object.material.userData.hk) && !cut(h.point, h.object) && !(SEL.g && under(h.object, SEL.g)));
        const d0 = hits.length ? hits[0].distance : Infinity; let best = null; const q = new THREE.Vector3();
        for (const [fk, list] of Object.entries(PICK)) { const g = HFLOOR[fk]; if (!g || !shown(g)) continue;
          for (const it of list) { if (!ray.ray.intersectBox(it.b, q) || cut(q, g)) continue; const d = ray.ray.origin.distanceTo(q);
            if (d <= d0 + 0.05 && (!best || d < best.d)) best = { id: it.id, d }; } }
        post("pick", { id: best ? best.id : null, room: roomAt(hits[0] && hits[0].point) });
        return true;
      }
      const id = pickItem(e);
      const h = ray.intersectObjects(scene.children, true).find(x => x.object.isMesh && shown(x.object) && !cut(x.point));
      post("pick", { id: id ? "living:" + id : null, room: roomAt(h && h.point) || "living" });
      return true;
    }
    /* the picked piece: a dashed outline round its box and its size on a tag (the design's Edit mode) */
    const SEL = { g: null };
    function clearSel() { if (!SEL.g) return; scene.remove(SEL.g); SEL.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } }); SEL.g = null; dirty(); }
    function select(o) {
      clearSel(); if (!o || !o.box) return;
      const b = o.box, g = new THREE.Group(), bx = wbox(b), size = bx.getSize(new THREE.Vector3()), c = bx.getCenter(new THREE.Vector3());
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.02, size.y + 0.02, size.z + 0.02));
      const line = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: "#fff1bf", dashSize: 0.04, gapSize: 0.025, depthTest: false, transparent: true, toneMapped: false }));
      line.computeLineDistances(); line.position.copy(c); line.renderOrder = 997; g.add(line);
      if (o.label) {
        const cv = document.createElement("canvas"), x = cv.getContext("2d"); cv.width = 320; cv.height = 112;
        x.fillStyle = "#fff1bf"; x.beginPath(); x.roundRect ? x.roundRect(4, 4, 312, 104, 52) : x.rect(4, 4, 312, 104); x.fill();
        x.fillStyle = "#1d2a22"; x.font = "600 54px Figtree, system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(o.label, 160, 60);
        const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, toneMapped: false })); sp.renderOrder = 999;
        const d = camera.position.distanceTo(c), s = Math.max(0.12, Math.min(0.9, d * 0.09)); sp.scale.set(s, s * 112 / 320, 1);
        sp.position.set(c.x, bx.min.y - s * 0.28, c.z); g.add(sp);
      }
      g.traverse(q => { q.raycast = () => {}; }); SEL.g = g; scene.add(g); dirty();
    }
    /* edits: rebuild only the floors whose pieces changed */
    let pend = null;
    function edits(map) {
      const before = new Set(Object.keys(HEDITS));
      for (const k of Object.keys(HEDITS)) if (!map[k]) delete HEDITS[k];
      Object.assign(HEDITS, map);
      const touched = new Set([...before, ...Object.keys(map)]);
      if (!houseG || !HBUILD) return;
      for (const [fk, F] of Object.entries(R.HOUSE3.floors)) if ((F.tags || []).some(id => touched.has(id))) (pend = pend || new Set()).add(fk);
      if (pend) requestAnimationFrame(() => { const fs = pend; pend = null; if (!fs) return;
        for (const fk of fs) HBUILD(fk, editedFloor(fk, R.HOUSE3.floors[fk])); solidDirty(); reshadow(); dirty(); });
    }
    function go(o) {
      if (o.house) {
        if (S.view !== "house") setView("house", !!o.instant);
        hfloor = o.floor || "all"; hfview = o.fview || "angle"; applyFloors();
        if (hfloor === "all" && hfview === "angle") {   // the whole house framed to the app's frame, whatever its shape (VIEWS.house is for a full screen)
          const H = VIEWS.house, dir = new THREE.Vector3(H.eye[0] - H.at[0], H.eye[1] - H.at[1], H.eye[2] - H.at[2]).normalize(), c = [233, 270, 95];
          const r = 0.5 * Math.hypot(560, 870, 1060), v = 25 * Math.PI / 180, hh = Math.atan(Math.tan(v) * camera.aspect), D = (camera.aspect < 1 ? 0.72 : 0.74) * r / Math.sin(Math.min(v, hh));
          flyTo([c[0] + dir.x * D, c[1] + dir.y * D, c[2] + dir.z * D], [c[0], c[1] + 30, c[2]], 50, !!o.instant);
        } else floorCam();
        return;
      }
      if (o.room === "living") { setView(LIV_RMODE[o.mode || "above"] || "room", !!o.instant); return; }
      if (o.room) {
        const v = ROOM_VIEW[o.room], rr = (R.HOUSE3.rooms || {})[o.room];
        if (v) { if (S.view !== v) setView(v, !!o.instant); if ((o.mode || "in") !== RMODE) setRmode(o.mode || "in"); return; }
        if (!rr) return;
        if (S.view !== "house") setView("house", true);
        hfloor = FK[String(rr[4])] || "all"; applyFloors();
        const cx = (rr[0] + rr[1]) / 2, cz = (rr[2] + rr[3]) / 2;
        flyTo([cx + 30, rr[4] + 520, cz + 280], [cx, rr[4], cz], 50, true); return;
      }
      if (o.view) setView(o.view, !!o.instant);
    }
    addEventListener("message", ev => {
      const d = ev.data; if (!d || d.src !== "demma") return;
      try {
        if (d.cmd === "go") go(d);
        else if (d.cmd === "select") select(d);
        else if (d.cmd === "edits") edits(d.edits || {});
        else if (d.cmd === "moment") { playMoment(d.k); syncButtons(); }
        else if (d.cmd === "panel") { root.classList.toggle("emb-panel", !!d.k); if (window.DemmaTools) d.k ? window.DemmaTools.open(d.k) : window.DemmaTools.close(); }
        else if (d.cmd === "living-edit") { root.classList.toggle("emb-edit", !!d.on); setEdit(!!d.on); }
        else if (d.cmd === "picture") { const [w, h] = SMALL ? [2560, 1440] : [3840, 2160]; post("picture", { url: still(d.w || w, d.h || h), name: stillName() }); }
        else if (d.cmd === "perf") post("perf", { perf: perfInfo(), buildMs: window.R3D && window.R3D.buildMs });
        else if (d.cmd === "lift") liftBed(!!d.on);
        else if (d.cmd === "resize") sizeRenderer();
        else if (d.cmd === "quality") {   // Auto (the speed check decides, as before), or Quick / Sharp kept on this device
          if (d.q === "auto") { S.picked = false; probe = 3; probeT.length = 0; } else { S.quality = d.q; S.picked = true; probe = 3; probeT.length = 0; }   // V1.1: timed again (a quick phone's shade)
          store.set(KEY, S); applyLight(); sizeRenderer(); syncButtons(); post("profile", { profile: profile() }); }
      } catch (err) { post("error", { msg: String(err && err.message || err) }); }
    });
    document.addEventListener("click", e => { if (e.target.closest("[data-tools-toggle]") && root.classList.contains("emb-panel")) setTimeout(() => { if (!(window.DemmaTools && window.DemmaTools.isOpen())) { root.classList.remove("emb-panel"); post("panel", { k: null }); } }, 0); });
    function profile() { return { gpu: GPU.slice(0, 90), big: BIG_GPU, goodPhone: GOOD_PHONE, small: SMALL, quality: S.quality, picked: !!S.picked, ratio: +gl.getPixelRatio().toFixed(2) }; }
    return { pickable, tap, ready() { post("ready", { buildMs: window.R3D && window.R3D.buildMs, small: SMALL, profile: profile() }); } };
  })();
}
