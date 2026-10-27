/* Demma's Home V1: the house and its projects as the app knows them (data/house.json from house/export_house.py; data/projects/*.json
   from media-wall/src/export_project.py), with the client's own edits and numbers laid over them (store.js). */
import { store } from "./store.js";

/* the PDFs and the media wall's full page live on GitHub Pages; the shared page (the claude.ai artifact) links there */
export const PAGES = "https://emmachilds98-wq.github.io/Demma-Home/";
export const fileHref = h => (/^https?:/.test(h) || /github\.io$/.test(location.hostname) || location.protocol === "file:" || /^(localhost|127\.)/.test(location.hostname) ? h : PAGES + h);

export const D = { house: null, projects: [], media: { stills: {}, photos: {} }, next: { decide: [] } };

/* the rooms' names as the client says them (the plans' own are "Bedroom 3", "Store" ...) */
const NAME = { bed3: "Office", airing: "Boiler cupboard", porch: "Front door", front_store_w: "Bin cupboard, left", front_store_e: "Bin cupboard, right",
  lower_landing: "Lower landing", lower_stairs: "Lower stairs", hall: "Hall", lower_store: "Store", kitchen_cupboard: "Kitchen cupboard", secret: "The secret room" };
export const FLOORS = [["all", "Outside"], ["first", "First"], ["ground", "Ground"], ["lower", "Lower"]];
export const FLOOR_NAME = { first: "First floor", ground: "Ground floor", lower: "Lower floor" };

export async function load() {
  const j = async (u, d) => { try { const r = await fetch(u, { cache: "no-cache" }); return r.ok ? await r.json() : d; } catch (e) { return d; } };
  const [house, index, media, next] = await Promise.all([j("data/house.json", null), j("data/projects/index.json", []), j("data/media.json", D.media), j("data/next.json", D.next)]);
  D.house = house; D.media = media || D.media; D.next = next || D.next;
  D.projects = (await Promise.all(index.map(p => j(p.file, null)))).filter(Boolean);
  for (const r of D.house.rooms) r.label = NAME[r.id] || r.name;
  return D;
}

export const rooms = () => D.house.rooms;
export const room = id => D.house.rooms.find(r => r.id === id);
export const items = () => D.house.items;
export const item = id => D.house.items.find(i => i.id === id);
export const itemsIn = id => D.house.items.filter(i => i.room === id);
export const project = id => D.projects.find(p => p.id === id);
export const projectFor = roomId => D.projects.find(p => p.room === roomId);
export const still = id => D.media.stills[id] || D.media.stills.house || "";
export const photosOf = id => (D.media.photos[id] || []).concat(store.list("photos").filter(p => p.room === id).map(p => ({ src: p.url, label: "" })));

/* ---- measuring */
export const measureRows = () => D.house.measure;
export const answer = id => store.rows("measurements")[id];
export const openIn = roomId => D.house.measure.filter(m => m.room === roomId && !(answer(m.id) && answer(m.id).cm != null));

/* ---- editing (the same arithmetic as tools/pull_edits.py: a change moves and sizes the piece's box; along its wall for "along") */
export const EDITABLE = new Set(["furniture", "door", "window", "radiator", "appliance", "switch", "socket", "decor", "light", "fitting"]);
export const editable = it => it && EDITABLE.has(it.kind) && it.room !== "living" && !it.id.startsWith("living.");
const K = it => (it.axis === "z" ? 2 : 0);
export function baseAlong(it) {
  const r = room(it.room), k = K(it), a0 = it.opening ? it.opening.a : it.box[k];
  return Math.round((r ? a0 - r.box[k] : a0) * 10) / 10;
}
export function editsOf(id) {
  const out = {}; for (const [k, v] of Object.entries(store.rows("edits"))) if (v.item === id) out[v.field] = v.value;
  return out;
}
export function now(it) {
  const e = editsOf(it.id), s = it.size;
  return { w: e.w ?? s.w, h: e.h ?? s.h, up: e.up ?? s.up, along: e.along ?? baseAlong(it), removed: !!e.removed };
}
export function nowBox(it) {
  const c = now(it), s = it.size, k = K(it), b = it.box.slice();
  const dA = c.along - baseAlong(it), dW = c.w - s.w, dH = c.h - s.h, dU = c.up - s.up;
  b[k] += dA; b[k + 3] += dA + dW; b[1] += dU; b[4] += dU + dH;
  return b;
}
export function engineEdits() {
  const out = {};
  for (const it of D.house.items) {
    if (!editable(it)) continue;
    const c = now(it), s = it.size, dA = c.along - baseAlong(it), dW = c.w - s.w, dH = c.h - s.h, dU = c.up - s.up;
    if (!c.removed && !dA && !dW && !dH && !dU) continue;
    const E = { from: it.box, to: nowBox(it), removed: c.removed };
    if (it.opening) { const o = it.opening; E.op = { axis: o.axis, line: o.line, a: o.a, b: o.b, y0: o.y0, y1: o.y1, a2: o.a + dA, b2: o.b + dA + dW, y02: o.y0 + dU, y12: o.y1 + dU + dH }; }
    out[it.id] = E;
  }
  return out;
}
export const edited = () => Object.keys(engineEdits()).length;

/* ---- projects: progress from the ticks */
export const ticked = id => !!(store.rows("ticks")[id] && store.rows("ticks")[id].done);
export function pieceProgress(p) {
  const ids = p.tasks.map(t => t.id).concat(p.buy);
  return { done: ids.filter(ticked).length, total: ids.length };
}
export function projectProgress(pj) {
  const tasks = pj.places.flatMap(pl => pl.pieces.flatMap(p => p.tasks.map(t => t.id)));
  return { done: tasks.filter(ticked).length, total: tasks.length, bought: pj.buy.filter(b => ticked(b.id)).length };
}
