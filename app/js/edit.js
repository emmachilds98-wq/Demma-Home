/* Demma's Home V1: Edit mode (docs/V1_PLAN.md 2.3, Phase 3). Tap anything in a room, change its size or its place with a stepper (1 cm)
   or a typed number, see it move; every change is one row in store.js's "edits" (saved for both of you on the shared page). Undo and
   Redo at the top; Done goes back to the room. tools/pull_edits.py folds the rows into house/survey_data.py with the source "the
   client, in the app, <date>". The living room keeps its own edit mode (move, turn, add from a catalogue: media-wall/src/room3d.js). */
import { store } from "./store.js";
import { viewer } from "./viewer.js";
import { esc, cm, icon, toast } from "./ui.js";
import * as M from "./model.js";

const $ = s => document.querySelector(s);
const ST = { undo: [], redo: [], room: null, item: null, living: false };
const FIELDS = [["w", "Width"], ["h", "Height"], ["up", "Up from the floor"], ["along", "Along the wall"]];
const WHERE = { furniture: "", door: "a door", window: "a window", radiator: "a radiator", switch: "a light switch", socket: "a socket", light: "a light", fitting: "", decor: "", appliance: "" };

export function leaveEdit() {
  if (ST.living) { viewer.send("living-edit", { on: false }); ST.living = false; }
  viewer.send("select", { box: null });
  ST.item = null;
}

export function pickInEdit(d) {
  if (!d.id || d.id.startsWith("living:")) return;
  const it = M.item(d.id);
  if (!it || !M.editable(it)) { if (it) toast(`${it.name}: not one to change here`); return; }
  location.hash = `#/room/${it.room}/edit/${encodeURIComponent(it.id)}`;
}

function select(it) {
  if (!it) { viewer.send("select", { box: null }); return; }
  const c = M.now(it);
  viewer.send("select", { box: c.removed ? null : M.nowBox(it), label: `${Math.round(c.w)} × ${Math.round(c.h)}` });
}

function wallWords(it, rm) {
  const kind = WHERE[it.kind] || "";
  const ax = it.axis === "z" ? "side" : "end";
  return [kind && kind.charAt(0).toUpperCase() + kind.slice(1), `in the ${rm.label.toLowerCase()}`, it.axis ? `on its ${ax} wall` : ""].filter(Boolean).join(", ")
    .replace(/^in/, "In");
}

async function set(it, field, value, record = true) {
  const id = `${it.id}~${field}`, before = (store.rows("edits")[id] || {}).value;
  const base = field === "along" ? M.baseAlong(it) : field === "removed" ? false : it.size[field];
  if (record) { ST.undo.push({ item: it.id, field, before, after: value }); ST.redo = []; }
  if (value === base || value == null) await store.del("edits", id);
  else await store.put("edits", id, { item: it.id, field, value });
}

export function renderEdit(rm, itemId, soft) {
  const living = rm.id === "living";
  document.body.dataset.stage = "edit";
  viewer.poster(M.still(rm.id));
  const over = $("#stage-over"); over.className = ""; over.innerHTML = "";
  const it = itemId ? M.item(decodeURIComponent(itemId)) : null;
  if (!soft) {
    if (living) { viewer.go({ room: "living", mode: "above" }); viewer.send("living-edit", { on: true }); ST.living = true; }
    else viewer.go({ room: rm.id, mode: "in" });
  }
  ST.item = it;
  select(it && M.editable(it) ? it : null);
  const top = `<div class="edit-top"><button type="button" class="icon-btn ghost" data-undo aria-label="Undo" ${ST.undo.length ? "" : "disabled"}>${icon("undo")}</button>
      <button type="button" class="icon-btn ghost" data-redo aria-label="Redo" ${ST.redo.length ? "" : "disabled"}>${icon("redo")}</button>
      <h1>Editing the ${esc(rm.label.toLowerCase())}</h1><a class="btn tint" href="#/room/${rm.id}">Done</a></div>`;
  let sheet;
  if (living) {
    sheet = `<h2>The living room's pieces</h2><p class="second">Drag a piece to move it (it snaps to a wall within 15 cm); tap it to turn, recolour, copy or remove it; Add brings more from the catalogue. Tap a wall to paint it.</p>
      <p class="second note-line">Saved on this device; Save for both of you is in the bar over the room</p>`;
  } else if (!it || !M.editable(it)) {
    const list = M.itemsIn(rm.id).filter(M.editable).filter(i => !["switch", "socket", "light"].includes(i.kind));
    sheet = `<h2>Tap a piece to change it</h2><p class="second">Or pick one here</p><div class="list" style="margin-top:12px">${list.map(i => `<a class="rowc nopic" href="#/room/${rm.id}/edit/${encodeURIComponent(i.id)}"><span><span class="t">${esc(i.name)}</span><span class="s">${cm(M.now(i).w)} wide${M.now(i).removed ? " · taken out" : ""}${i.measure ? " · a guess" : ""}</span></span><span class="chev">${icon("chev")}</span></a>`).join("") || `<p class="second">Nothing here to change yet.</p>`}</div>`;
  } else {
    const c = M.now(it), op = !!it.opening, door = it.kind === "door";
    const lock = { h: door, up: door };
    sheet = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><h2>${esc(it.name)}</h2><p class="second" style="margin:2px 0 0">${esc(wallWords(it, rm))}</p></div>
        <a class="btn" href="#/room/${rm.id}/edit">All pieces</a></div>
      ${c.removed ? `<div class="callout butter" style="margin-top:12px"><h3>Taken out</h3><p>It's gone from the room in the app; the next round asks if it's for good.</p><button type="button" class="btn" data-restore>Put it back</button></div>` : `
      <div class="fields">${FIELDS.map(([k, t]) => `<div class="field"><label for="f-${k}">${t}</label><div class="stepper"><button type="button" data-step="${k}" data-by="-1" aria-label="${t} down 1 cm" ${lock[k] ? "disabled" : ""}>−</button>
        <span class="val"><input id="f-${k}" type="number" inputmode="decimal" step="1" value="${Math.round(c[k] * 10) / 10}" data-field="${k}" ${lock[k] ? "disabled" : ""}><span class="u">cm</span></span>
        <button type="button" data-step="${k}" data-by="1" aria-label="${t} up 1 cm" ${lock[k] ? "disabled" : ""}>+</button></div></div>`).join("")}</div>`}
      <div class="acts3"><button type="button" class="btn" data-enote>Add a note</button><button type="button" class="btn" data-copy>Copy</button><button type="button" class="btn remove" data-remove ${op || c.removed ? "disabled" : ""}>Remove</button></div>
      <form id="enote" class="notes" data-note="${rm.id}" data-item="${esc(it.id)}" hidden style="margin-top:12px"><label class="sr" for="enote-t">A note about ${esc(it.name.toLowerCase())}</label><textarea id="enote-t" placeholder="A note about ${esc(it.name.toLowerCase())}"></textarea><p><button class="btn main" type="submit">Save the note</button></p></form>
      <p class="second note-line">${store.mode === "shared" ? (store.readOnly ? "You can look; only editors save changes" : "Saves to your shared plan as you go") : "Saves on this device · Share sends it"}${it.measure ? " · its size is a guess: measure it" : ""}</p>
      ${door || op ? `<p class="second note-line">The wall round it moves with it.</p>` : ""}`;
  }
  over.innerHTML = top;                                                        // over the 3D (a bar fixed at the top on a phone)
  $("#page").innerHTML = `<section class="sheet edit-sheet" aria-label="Change it">${sheet}</section>`;
}

/* ---- the sheet's controls */
const clamp = (k, v) => Math.max(k === "along" || k === "up" ? -500 : 1, Math.min(1000, v));
let typeT = 0;
document.addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b || document.body.dataset.stage !== "edit") return;
  const it = ST.item, d = b.dataset;
  if (d.step && it) { const c = M.now(it); await set(it, d.step, clamp(d.step, Math.round((c[d.step] + +d.by) * 10) / 10)); select(it); return; }
  if (d.undo !== undefined || d.redo !== undefined) {
    const from = d.undo !== undefined ? ST.undo : ST.redo, to = d.undo !== undefined ? ST.redo : ST.undo, st = from.pop(); if (!st) return;
    to.push(st); const t = M.item(st.item); await set(t, st.field, d.undo !== undefined ? st.before : st.after, false);
    if (ST.item && ST.item.id === st.item) select(ST.item); else location.hash = `#/room/${t.room}/edit/${encodeURIComponent(t.id)}`;
    return;
  }
  if (d.remove !== undefined && it) { await set(it, "removed", true); select(null); toast(`${it.name}: taken out`); return; }
  if (d.restore !== undefined && it) { await set(it, "removed", false); select(it); return; }
  if (d.copy !== undefined && it) {
    const c = M.now(it), txt = `${it.name} (${M.room(it.room).label}): ${cm(c.w)} wide, ${cm(c.h)} high, ${cm(c.up)} up from the floor, ${cm(c.along)} along the wall`;
    try { await navigator.clipboard.writeText(txt); toast("Its sizes are copied"); } catch (er) { toast(txt, 5000); }
    return;
  }
  if (d.enote !== undefined && it) { const f = document.getElementById("enote"); if (f) { f.hidden = !f.hidden; if (!f.hidden) f.querySelector("textarea").focus(); } return; }
});
document.addEventListener("input", e => {
  const el = e.target; if (!el.dataset || !el.dataset.field || !ST.item) return;
  const it = ST.item, k = el.dataset.field, v = parseFloat(el.value);
  if (!isFinite(v)) return;
  clearTimeout(typeT); typeT = setTimeout(async () => { await set(it, k, clamp(k, Math.round(v * 10) / 10)); select(it); }, 450);
});
document.addEventListener("keydown", e => {
  if (document.body.dataset.stage !== "edit" || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
  e.preventDefault(); const b = document.querySelector(e.shiftKey ? "[data-redo]" : "[data-undo]"); if (b && !b.disabled) b.click();
});
