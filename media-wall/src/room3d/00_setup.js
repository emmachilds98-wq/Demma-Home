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

const MOD_AT = performance.now();   // V1.31: when this script began (R3D.timing)
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
              plants: R.PLANT_LAYOUT || "breast", layout: {}, added: [], grow: true,
              chairs: "cupboard",   // v20: the chair cupboard beside the table (doors shut); "open", "hooks" or "away" (the garage)
              // v20, client: "give more decor variation and options": the rug, sofa cushions, the curtains, what's in the glass case and its frame
              decor: { rug: "yours", cushions: "none", curtains: "hessian", fill: "collect", frame: "oak", oak: "artisan", floor: "carpet", shelf: "black", pads: "olive", ceiling: "asis", plants: "mix", pots: "mine" },   // v26: the oak, the floor, your shelf; v31: the seat pads
              sugg: {},     // v21: the suggested furniture and decor, all off
              seat: "off",
              cab: "compact", cabw: "90", tdoor: false,   // v33: cabw, the compact cabinet's table: 90 wide (the plan) or 80 (10 shorter)
              cam: "orbit", pad: false, foot: false, beside: "clear", sofa: "mine", sbed: false,   // V3.71: your sofa or the green sofa bed; its bed out
              blind: "down", lp: false, trolley: "park", lid: false, barflap: false, ctop: false, sdraw: false, scopen: false };   // v37: the step drawers out   // v34: the blind (a suggestion) down or rolled up; a record lifted out of the vinyl stand; the trolley parked or at the table   // v31: what's beside the compact cabinet   // v31: a drag circles round a spot or looks round from where you stand; the move buttons on the room   // v30: the compact cabinet (the plan) or the sliding one; the table door open with the table folded   // v23: the fold-down seat at the stair end (an option): "off", "up" (folded) or "down"   // v20: the chair cupboard beside the table (doors shut); "open", "hooks" or "away" (the garage)
DEF.lamp = R.LAMP_DEFAULT || "sofa";
/* v38: the room opens on the client's plan (geometry.FIRM: their saved picks, the bar beside the cabinet, the sage-stripe rug); every
   other choice is an option to look at */
if (R.FIRM) { DEF.sugg = Object.fromEntries(R.FIRM.sugg.map(k => [k, true])); DEF.svar = Object.assign({}, R.FIRM.svar);
  DEF.beside = R.FIRM.beside; DEF.cabw = R.FIRM.cabw; DEF.decor = Object.assign({}, DEF.decor, R.FIRM.decor);
  DEF.ideas = Object.fromEntries((R.FIRM.ideas || []).map(k => [k, true])); }
/* N99, the client (10 Nov 2026): "The stairwell curtains are also missing I want them there just with the ability to draw them open and
   edit them": the stair curtain is up by default, drawn back so the stairs stay open to walk and see; its card draws it across, a colour */
if (R.STAIR_CURTAIN) { DEF.sugg.stairscurtain = true; DEF.scopen = true; }   // v43: the C-table is in the plan   // v18: the window corner holds the plant stand or the record shelf   // v16: the table by the stairs by default; the laser off
const KEY = "mw18-3d";
const S = Object.assign({}, DEF, store.get(KEY, {}));
if (!S.open147) { S.curtains = false; S.blinds = false; S.open147 = true; }   // V1.47, the client: "pull blinds up and open curtains in all rooms": once, whatever was saved
if (!S.v45) {   // v45, client: "stipple ceiling as default and cosy lighting": once, a saved room moves to them; your own choices stay after
  S.v45 = 1; S.scene = "cosy"; S.tod = "evening"; S.lv = null; S.decor = Object.assign({}, S.decor, { ceiling: "stipple" });
}
if (!S.v46) {   // v46, client: "default view could balance lighting throughout the room using all fixtures": once, a saved room moves to Evening
  S.v46 = 1; S.scene = "evening"; S.lv = null; S.master = 100; }
if (!S.v51) {   // v51, client: their phone plan is the main plan, "Switch to the pale mint": once, a saved room moves to it
  S.v51 = 1; S.paint = "mint"; S.walls = {}; S.ceil = "match"; S.skirt = "match"; S.ideas = Object.assign({}, S.ideas, DEF.ideas); }
if (!S.v314) {  // V3.14, client: "It's now definite I also want the plant shelf on the chimney breast and records on the left of the living room window": once, a saved room moves to it
  S.v314 = 1; S.plants = DEF.plants; for (const k of ["plants", "records"]) if (S.layout && S.layout[k]) delete S.layout[k]; if (S.sugg) S.sugg.alcoveshelves = false; }
if (!S.scback && R.STAIR_CURTAIN) {   // N99: once, a saved room gets the stair curtain back, drawn open
  S.scback = 1; S.sugg = Object.assign({}, S.sugg, { stairscurtain: true }); S.scopen = true; }
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
if (!/[?&]room\b/.test(location.search) && !/^#look-/.test(location.hash)) S.view = "house";
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

