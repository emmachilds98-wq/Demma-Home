/* Demma's Home V1: the app. Five places, always the same (Home · House · Projects · Shop · Measure); every room has one page; links open
   the same place (#/home, #/house/first, #/room/bathroom, #/room/bathroom/edit, #/measure, #/project/media-wall/build, #/shop).
   The design: docs/V1_PLAN.md sections 2 and 3 (the Claude Design canvas). Say less: what, where, one fact. */
import { store } from "./store.js";
import { viewer } from "./viewer.js";
import { esc, gbp, cm, m2, icon, toast, greeting } from "./ui.js";
import * as M from "./model.js";
import { renderEdit, leaveEdit, pickInEdit } from "./edit.js";

const $ = s => document.querySelector(s);
const page = () => $("#page");
const S = { route: null, houseFloor: "all", houseView: "angle", mode: {}, tab: {}, picked: null, sheetLow: false, projTab: "build", openPiece: null, sync: null };
export const app = { S, go, render, picked: setPicked };

/* ------------------------------------------------------------------ start */
async function start() {
  const t0 = performance.now();
  const [st] = await Promise.all([store.init(), M.load()]);
  if (!M.D.house) { page().innerHTML = `<div class="empty">The house file didn't load. Check your connection and try again.</div>`; return; }
  viewer.init($("#stage"));
  viewer.on("ready", () => { viewer.send("edits", { edits: M.engineEdits() }); app.loadMs = Math.round(performance.now() - t0); });
  viewer.on("pick", onPick);
  viewer.on("picture", savePicture);
  store.on(col => { if (col === "edits") viewer.send("edits", { edits: M.engineEdits() }); if (S.route && !S.typing) render(true); });
  if (st.fromLink) setTimeout(() => toast("Added what was in the link to this device"), 600);
  rail();
  document.querySelectorAll("[data-file]").forEach(a => { a.href = M.fileHref(a.getAttribute("href")); });
  addEventListener("hashchange", () => render());
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", e => { if (e.key === "/" && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); openSearch(); } if (e.key === "Escape") closeSearch(); });
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:" && !window.claude) navigator.serviceWorker.register("sw.js").catch(() => {});
}

function parse() {
  const h = (location.hash || "#/home").replace(/^#\/?/, "").split("?")[0];
  const [name = "home", a, b, c] = h.split("/");
  return { name: name || "home", a, b, c };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

/* ------------------------------------------------------------------ the shell */
const TABS = [["home", "Home", "home"], ["house", "House", "house"], ["projects", "Projects", "projects"], ["shop", "Shop", "shop"], ["measure", "Measure", "measure"]];
const TAB_OF = { home: "home", house: "house", room: "house", projects: "projects", project: "projects", shop: "shop", measure: "measure", perf: "home", settings: "home" };

function rail() {
  const byFloor = f => M.rooms().filter(r => r.floor === f && (r.w * r.d >= 5000 || r.id === "living"));
  const sub = f => byFloor(f).map(r => `<a class="sub" href="#/room/${r.id}" data-room="${r.id}">${esc(r.label)}</a>`).join("");
  $("#rail").innerHTML = TABS.map(([k, t]) => `<a href="#/${k}" data-tab="${k}">${t}</a>`).join("")
    + ["first", "ground", "lower"].map(f => `<span class="label">${M.FLOOR_NAME[f]}</span>${sub(f)}`).join("")
    + `<span class="label">This device</span><a class="sub" href="#/settings" data-tab="settings">Speed and quality</a>`;
  $("#tabbar").innerHTML = TABS.map(([k, t, ic]) => `<a href="#/${k}" data-tab="${k}"><span class="ib">${icon(ic)}</span>${t}</a>`).join("");
}

function setCurrent(r) {
  const tab = TAB_OF[r.name] || "home";
  document.querySelectorAll("[data-tab]").forEach(a => a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  document.querySelectorAll("#rail [data-room]").forEach(a => (r.name === "room" && a.dataset.room === r.a) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
}

function render(soft = false) {
  const r = parse(), prev = S.route;
  if (!soft && prev && prev.name === "room" && prev.b === "edit" && !(r.name === "room" && r.b === "edit")) leaveEdit();
  S.route = r;
  if (!soft) { S.picked = null; viewer.send("select", { box: null }); }
  setCurrent(r);
  const P = { home: pHome, house: pHouse, room: pRoom, projects: pProjects, project: pProject, shop: pShop, measure: pMeasure, perf: pSettings, settings: pSettings }[r.name] || pHome;
  const keep = soft ? document.activeElement && document.activeElement.id : null, sy = scrollY;
  P(r, soft);
  pickedPanel();
  if (soft) { if (keep && document.getElementById(keep)) document.getElementById(keep).focus(); scrollTo(0, sy); }
  else {
    scrollTo(0, 0); const h = page().querySelector("h1, h2") || document.querySelector("#stage-over h1");
    document.title = (h ? h.textContent + " · " : "") + "Demma's Home";
    if (h && prev) { h.tabIndex = -1; h.focus({ preventScroll: true }); }   // a screen reader hears the new screen's name (not on the first load)
  }
}

function stage(kind, poster) {
  if (kind) document.body.dataset.stage = kind; else delete document.body.dataset.stage;
  document.body.classList.toggle("sheet-low", kind === "house" && S.sheetLow);
  if (poster !== undefined) viewer.poster(poster);
  const over = $("#stage-over");
  over.className = ""; over.innerHTML = "";
  return over;
}

/* ------------------------------------------------------------------ Home */
function pHome() {
  stage(null);
  const D = M.D, pj = D.projects[0], open = M.measureRows().filter(m => !(M.answer(m.id) && M.answer(m.id).cm != null));
  const first = open[0], dec = (D.next.decide || [])[0];
  const busy = M.rooms().filter(r => r.id !== "living").sort((a, b) => M.openIn(b.id).length - M.openIn(a.id).length).slice(0, 2);
  const show = [M.room("living"), ...busy].filter(Boolean);
  page().innerHTML = `
    <h1 class="hello">${greeting()}, Emma &amp; Dave</h1>
    <div class="card housecard"><img src="${esc(M.still("house"))}" alt="" loading="eager">
      <div><h2>The whole house</h2><p class="second">Three floors, every room in 3D</p><a class="btn main" href="#/house">Open the house</a></div></div>
    <div class="sec"><h3>Next up</h3></div>
    <div class="next">
      ${first ? `<a class="measure" href="#/measure"><span class="label">Measure</span><b>${esc(first.what)}</b></a>` : `<a class="measure" href="#/measure"><span class="label">Measure</span><b>All measured</b></a>`}
      ${dec ? `<a class="decide" href="${esc(dec.href || "#/home")}"><span class="label">Decide</span><b>${esc(dec.what)}</b></a>` : ""}
      ${pj ? `<a class="buy" href="#/project/${pj.id}/shop"><span class="label">Buy</span><b>${pj.buy.length - M.projectProgress(pj).bought} things for ${esc(pj.name.replace(/^The /, "the "))}</b></a>` : ""}
    </div>
    <div class="sec"><h3>Rooms</h3><a href="#/house">All 3 floors</a></div>
    <div class="list">${show.map(roomRow).join("")}</div>
    <div class="sec"><h3>Projects</h3></div>
    <div class="list">${D.projects.map(projectRow).join("")}</div>
    <p style="margin-top:24px"><a class="btn" href="#/settings">Speed, quality and colours</a></p>
    ${M.edited() ? `<p class="second" style="margin-top:24px">${M.edited()} piece${M.edited() > 1 ? "s" : ""} changed in the app · <a href="#/measure">see what's waiting</a></p>` : ""}`;
}
function roomRow(r) {
  const n = M.openIn(r.id).length, pj = M.projectFor(r.id);
  const chip = pj ? `<span class="chip mint">Plan ready</span>` : n ? `<span class="chip butter">${n} to measure</span>` : "";
  const sub = pj ? `${M.FLOOR_NAME[r.floor].replace(" floor", "")} · ${esc(pj.name.replace(/^The /, "the "))} project` : `${M.FLOOR_NAME[r.floor].replace(" floor", "")} · about ${m2(r.w, r.d)}`;
  return `<a class="rowc" href="#/room/${r.id}"><img class="pic" src="${esc(M.still(r.id))}" alt="" loading="lazy"><span><span class="t">${esc(r.label)}</span><span class="s">${sub}</span></span>${chip || `<span class="chev">${icon("chev")}</span>`}</a>`;
}
function projectRow(pj) {
  const p = M.projectProgress(pj), pc = p.total ? Math.round(100 * p.done / p.total) : 0;
  return `<a class="rowc nopic" href="#/project/${pj.id}"><span><span class="t">${esc(pj.name)}</span><span class="s">${esc(M.room(pj.room).label)} · ${p.done} of ${p.total} jobs · ${gbp(...pj.cost)}</span></span><span class="ring" style="--p:${pc}">${pc}%</span></a>`;
}

/* ------------------------------------------------------------------ The house */
function pHouse(r) {
  if (r.a && M.FLOORS.some(f => f[0] === r.a)) S.houseFloor = r.a;
  const f = S.houseFloor, over = stage("house", M.still(f === "all" ? "house" : "floor_" + f) || M.still("house"));
  over.className = "over ovtop";
  over.innerHTML = `<div class="row"><h1>The house</h1><div class="seg" role="group" aria-label="How to look">${[["angle", "Angled"], ["top", "From above"]].map(([k, t]) => `<button type="button" data-hview="${k}" aria-pressed="${S.houseView === k}">${t}</button>`).join("")}</div></div>
    <div class="seg full" role="group" aria-label="Floor">${M.FLOORS.map(([k, t]) => `<button type="button" data-floor="${k}" aria-pressed="${f === k}">${t}</button>`).join("")}</div>`;
  viewer.go({ house: true, floor: f, fview: S.houseView });
  const list = f === "all" ? M.rooms().filter(x => ["living", "hall", "garage", "kitchen"].includes(x.id)) : M.rooms().filter(x => x.floor === f && (x.w * x.d >= 3000 || x.id === "living"));
  const head = f === "all" ? `The house · ${M.rooms().filter(x => x.w * x.d >= 5000).length} rooms` : `${M.FLOOR_NAME[f]} · ${list.length} rooms`;
  page().innerHTML = `<section class="sheet house-sheet${S.sheetLow ? " low" : ""}" aria-label="Rooms"><button type="button" class="handle" data-sheet aria-label="${S.sheetLow ? "Show the rooms" : "Hide the rooms"}"></button>
    <div class="sec" style="margin-top:0"><h3>${head}</h3><span class="second">Tap a room</span></div>
    <div class="tiles">${list.map(x => { const n = M.openIn(x.id).length, pj = M.projectFor(x.id);
      return `<a class="tile" href="#/room/${x.id}"><b>${esc(x.label)}</b><small>${pj ? esc(pj.name) : x.use && x.w * x.d < 9000 ? esc(cap(x.use)) : m2(x.w, x.d)}${n ? ` · ${n} to measure` : ""}</small></a>`; }).join("")}</div></section>`;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ A room */
function pRoom(r, soft) {
  const rm = M.room(r.a);
  if (!rm) { go("#/house"); return; }
  if (r.b === "edit") { renderEdit(rm, r.c, soft); return; }
  const living = rm.id === "living", mode = S.mode[rm.id] || (living ? "above" : "in"), tab = S.tab[rm.id] || r.b || "overview";
  const over = stage("room", M.still(rm.id));
  if (!soft) viewer.go({ room: rm.id, mode });
  over.innerHTML = `<div class="over tl"><a class="icon-btn" href="#/house/${rm.floor}" aria-label="Back to the house">${icon("back")}</a></div>
    <div class="over tr"><button type="button" class="btn" data-picture>${icon("picture")}<span>Take a picture</span></button></div>
    <div class="over bottom"><div class="seg" role="group" aria-label="How to see the room">${[["in", "In it"], ["above", "From above"], ["alone", "On its own"]].map(([k, t]) => `<button type="button" data-mode="${k}" aria-pressed="${mode === k}">${t}</button>`).join("")}</div></div>`;
  const pj = M.projectFor(rm.id), open = M.openIn(rm.id), its = M.itemsIn(rm.id);
  const T = [["overview", "Overview"], ["measure", "Measure"], ["photos", "Photos"], ["notes", "Notes"]];
  let body = "";
  if (tab === "overview") {
    body = (S.picked && S.picked.room === rm.id ? pickCard() : "")
      + (open.length ? `<div class="callout butter"><h3>${open.length} to measure</h3><p>${open.map(m => esc(m.what.replace(/^The /, "the ").replace(/^the /, s => s))).join(" · ")}</p><a href="#" data-tab-go="measure">Measure now</a></div>` : "")
      + (pj ? `<a class="rowc nopic" style="margin-top:12px" href="#/project/${pj.id}"><span><span class="t">${esc(pj.name)}</span><span class="s">${M.projectProgress(pj).done} of ${M.projectProgress(pj).total} jobs · ${gbp(...pj.cost)}</span></span><span class="chip mint">Plan ready</span></a>
          <div class="sec"><h3>Try</h3></div><div class="chips">${pj.moments.slice(0, 4).map(m => `<button type="button" class="btn" data-moment="${m.k}">${esc(m.name)}</button>`).join("")}<button type="button" class="btn" data-panel="look">Look</button><button type="button" class="btn" data-panel="room">Options</button></div>` : "")
      + photoBlock(rm, 4)
      + `<div class="sec"><h3>In this room</h3></div><p>${esc(listLine(its, rm)) || `<span class="second">Nothing drawn yet.</span>`}</p>`;
  } else if (tab === "measure") {
    body = measureList(M.measureRows().filter(m => m.room === rm.id)) || `<div class="empty">Nothing to measure here.</div>`;
  } else if (tab === "photos") {
    body = photoBlock(rm, 99);
  } else {
    const notes = store.list("notes").filter(n => n.room === rm.id).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
    body = `<form class="notes" data-note="${rm.id}"><label class="sr" for="note-${rm.id}">A note about the ${esc(rm.label)}</label><textarea id="note-${rm.id}" placeholder="A note about the ${esc(rm.label.toLowerCase())}"></textarea><p><button class="btn main" type="submit">Save the note</button></p></form>`
      + (notes.map(n => `<div class="note">${esc(n.text)}<br><small>${esc(n.item ? (M.item(n.item) || {}).name || "" : "")} ${new Date(n.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small></div>`).join("") || `<p class="second">No notes yet.</p>`);
  }
  page().innerHTML = `<div class="room-head"><div><h1>${esc(rm.label)}</h1><p class="second">${M.FLOOR_NAME[rm.floor]} · about ${m2(rm.w, rm.d)}</p></div>
      <a class="btn main" href="#/room/${rm.id}/edit">${icon("edit")}<span>Edit</span></a></div>
    <div class="tabs" role="tablist">${T.map(([k, t]) => `<button type="button" role="tab" data-rtab="${k}" aria-selected="${tab === k}">${t}</button>`).join("")}</div>
    <div role="tabpanel">${body}</div>`;
}
function listLine(its, rm) {
  const seen = new Set(), names = [];
  for (const i of its) { if (["switch", "socket", "light", "finish"].includes(i.kind) || i.id.startsWith("switch.")) continue; const n = i.name.replace(/^(The|A|An) /, ""); if (!seen.has(n)) { seen.add(n); names.push(n.charAt(0).toLowerCase() + n.slice(1)); } }
  if (rm.id === "living") return "The media wall in the alcove · the chimney breast · the dining cabinet by the stairs · the window and its radiator · the stairs up";
  return names.length ? cap(names.join(" · ")) : "";
}
function photoBlock(rm, n) {
  const ph = M.photosOf(rm.id);
  return `<div class="sec"><h3>Your photos</h3><label class="btn">${icon("camera")}<span>Add</span><input type="file" accept="image/*" class="sr" data-photo="${rm.id}"></label></div>
    ${ph.length ? `<div class="photos">${ph.slice(0, n).map(p => `<a href="${esc(p.full || p.src)}" target="_blank" rel="noopener"><img src="${esc(p.src)}" alt="${esc(p.label || rm.label)}" loading="lazy">${p.label ? `<span>${esc(p.label)}</span>` : ""}</a>`).join("")}</div>` : `<p class="second">No photos yet.</p>`}`;
}

/* ------------------------------------------------------------------ the picked piece (desktop: the right panel; phone: a card on the room page) */
function setPicked(p) { S.picked = p; pickedPanel(); if (S.route.name === "room" && S.route.b !== "edit" && innerWidth < 960) render(true); }
function pickFacts(p) {
  if (p.piece) { const pg = M.pieceProgress(p.piece);
    return { title: p.piece.title, sub: `Part of ${esc(p.project.name.replace(/^The /, "the "))} project`, rows: [["Finish", "Artisan oak"], ["Wall paint", "Pale mint"], ["Time", p.piece.time], ["Cost", gbp(...p.piece.cost)], ["Progress", `${pg.done} of ${pg.total} steps`]],
      acts: `<a class="btn main wide" href="#/project/${p.project.id}/build" data-open-piece="${p.piece.key}">Open its build steps</a><button type="button" class="btn wide" data-living-edit>Change its sizes</button>` }; }
  const it = p.item, c = M.now(it);
  return { title: it.name, sub: `${esc(M.room(it.room) ? M.room(it.room).label : "")}`, rows: [["Width", cm(c.w)], ["Height", cm(c.h)], ["Up from the floor", cm(c.up)], ["Size from", it.src]],
    acts: M.editable(it) ? `<a class="btn main wide" href="#/room/${it.room}/edit/${encodeURIComponent(it.id)}">Change its sizes</a>` : "" };
}
function pickCard() {
  const f = pickFacts(S.picked);
  return `<div class="card" style="margin-bottom:12px"><span class="label">Picked</span><h3 style="margin:4px 0 2px">${esc(f.title)}</h3><p class="second" style="margin:0 0 8px">${f.sub}</p>
    <p class="second" style="margin:0 0 12px">${f.rows.slice(0, 3).map(x => `${x[0]} ${esc(x[1])}`).join(" · ")}</p><div class="list">${f.acts}</div></div>`;
}
function pickedPanel() {
  const el = $("#picked"); if (!el) return;
  if (!S.picked) {
    const rm = S.route && S.route.name === "room" ? M.room(S.route.a) : null;
    el.innerHTML = `<div class="card"><span class="label">Picked</span><p class="second">${rm ? `Tap anything in the ${esc(rm.label.toLowerCase())} to see it here.` : "Tap a room in the house, or pick one on the left."}</p></div>`;
    return;
  }
  const f = pickFacts(S.picked);
  el.innerHTML = `<div class="card"><span class="label">Picked</span><h2 style="margin:6px 0 4px">${esc(f.title)}</h2><p class="second" style="margin:0 0 12px">${f.sub}</p>
    <dl class="facts">${f.rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl><div class="list" style="margin-top:16px">${f.acts}</div></div>`;
}
const LIVING_PIECE = { wall: "base", tv: "uprights", nowplay: "uprights", lbox: "uprights", cab: "cabinet", table: "cabinet", pc: "sidewall", beside: "bar", records: "uprights",
  "id:case": "glasscase", "sg:recordtable": "recordtable", "sg:ctable": "ctable", "id:ctable": "ctable", "sg:wallcabs": "wallcabs", "sg:alcoveshelves": "alcove", "sg:doorshelf": "doorshelf" };
function onPick(d) {
  const r = S.route; if (!r) return;
  if (r.name === "house") { if (d.room && M.room(d.room)) go(`#/room/${d.room}`); return; }
  if (r.name === "room" && r.b === "edit") { pickInEdit(d); return; }
  if (r.name !== "room" && r.name !== "project") return;
  if (d.id && d.id.startsWith("living:")) {
    const pj = M.projectFor("living"), key = LIVING_PIECE[d.id.slice(7)];
    const piece = pj && pj.places.flatMap(pl => pl.pieces).find(p => p.key === key);
    if (piece) { setPicked({ piece, project: pj, room: "living" }); if (r.name === "project") { S.openPiece = piece.key; render(true); } }
    else if (d.id === "living:hbed") setPicked({ item: M.item("master.bed"), room: "master" });
    return;
  }
  const it = d.id && M.item(d.id);
  if (it) setPicked({ item: it, room: it.room });
  else if (d.room && r.name === "room" && d.room !== r.a && M.room(d.room)) toast(`That's the ${M.room(d.room).label.toLowerCase()}: tap it in the house to go there`);
}

/* ------------------------------------------------------------------ Measure */
function measureList(rows) {
  if (!rows.length) return "";
  const groups = [...new Set(rows.map(m => m.room))];
  return groups.map(g => `<div class="sec"><span class="label">${esc((M.room(g) || { label: g }).label)}</span></div><div class="list">${rows.filter(m => m.room === g).map(mRow).join("")}</div>`).join("");
}
function mRow(m) {
  const a = M.answer(m.id) || {}, has = a.cm != null;
  return `<div class="mrow${has ? " done" : ""}"><div><span class="row-t">${esc(m.what)}</span><span class="second" style="display:block" title="${esc(cap(m.where))}">${m.drawn != null ? `Drawn ${cm(m.drawn)}` : "Not drawn yet"}</span></div>
    <label class="sr" for="m-${m.id}">${esc(m.what)}, in cm</label><input id="m-${m.id}" type="number" inputmode="decimal" min="0" step="0.5" placeholder="cm" value="${has ? esc(a.cm) : ""}" data-measure="${m.id}">
    <span class="icon-btn cam${a.photo ? " has" : ""}" title="${a.photo ? "Photo added" : "Add a photo"}">${icon(a.photo ? "check" : "camera")}<input type="file" accept="image/*" capture="environment" aria-label="A photo of ${esc(m.what.toLowerCase())}" data-mphoto="${m.id}"></span></div>`;
}
function pMeasure() {
  stage(null);
  const rows = M.measureRows(), done = rows.filter(m => M.answer(m.id) && M.answer(m.id).cm != null).length, sent = rows.filter(m => M.answer(m.id) && M.answer(m.id).sent).length;
  const ed = M.edited();
  page().innerHTML = `<h1 style="margin-top:8px">Measure</h1><p class="second">Each one replaces a size we guessed from a photo</p>
    <div class="sec" style="margin:16px 0 0"><span class="row-t">${done} of ${rows.length} measured</span><span class="second">The model updates when you send</span></div>
    <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${rows.length}" aria-valuenow="${done}"><i style="width:${rows.length ? 100 * done / rows.length : 0}%"></i></div>
    ${measureList(rows)}
    ${ed ? `<div class="sec"><span class="label">Changed in the app</span></div><div class="list">${Object.keys(M.engineEdits()).map(id => { const it = M.item(id); return `<a class="rowc nopic" href="#/room/${it.room}/edit/${encodeURIComponent(id)}"><span><span class="t">${esc(it.name)}</span><span class="s">${esc(M.room(it.room).label)} · ${M.now(it).removed ? "taken out" : `${cm(M.now(it).w)} wide, ${cm(M.now(it).up)} up`}</span></span><span class="chev">${icon("chev")}</span></a>`; }).join("")}</div>` : ""}
    <div class="sendbar"><button type="button" class="btn main wide" data-send ${done || ed ? "" : "disabled"}>Send to the plan</button>
    <p class="second note-line">${store.mode === "shared" ? (sent ? `${sent} sent · the next round puts them in` : "Saved for both of you as you type") : "Saved on this device · sending copies a link to share"}</p></div>`;
}

/* ------------------------------------------------------------------ Projects */
function pProjects() {
  stage(null);
  page().innerHTML = `<h1 style="margin-top:8px">Projects</h1><p class="second">A full plan only for what you ask for; the rest is to look at</p><div class="list" style="margin-top:16px">${M.D.projects.map(projectRow).join("")}</div>
    <div class="callout sky" style="margin-top:16px"><h3>Another room?</h3><p>Say which room and what you'd like: it gets its own plan, build and shop here.</p></div>`;
}
function pProject(r, soft) {
  const pj = M.project(r.a); if (!pj) { go("#/projects"); return; }
  const tab = r.b || S.projTab; S.projTab = tab;
  const over = stage("project", M.still(pj.room));
  if (!soft) viewer.go({ room: pj.room, mode: "above" });
  over.className = "over tl"; over.innerHTML = `<a class="icon-btn" href="#/room/${pj.room}" aria-label="Back to the ${esc(M.room(pj.room).label.toLowerCase())}">${icon("back")}</a>`;
  const prog = M.projectProgress(pj);
  let body = "";
  if (tab === "build") {
    body = `<div class="jobs-head"><span class="row-t">${prog.done} of ${prog.total} jobs done</span><a class="btn" href="${esc(M.fileHref(pj.files[1].href))}" target="_blank" rel="noopener">${icon("download")}<span>Build guide</span></a></div>`
      + pj.places.map(pl => { const ids = pl.pieces.flatMap(p => p.tasks.map(t => t.id).concat(p.buy)), dn = ids.filter(M.ticked).length;
        return `<div class="sec"><span class="label">${esc(pl.name)} · ${dn} of ${ids.length}</span></div><div class="list">${pl.pieces.map(p => pieceRow(pj, p)).join("")}</div>`; }).join("");
  } else if (tab === "plan") {
    const f = pj.fit;
    body = `<p style="margin-top:16px">${esc(pj.what)}</p>
      <div class="chips"><span class="chip mint">${f.fits} fit</span><span class="chip butter">${f.tight} tight</span><span class="chip sky">${f.check} to check on site</span>${f.no ? `<span class="chip plain">${f.no} don't fit</span>` : ""}</div>
      <div class="sec"><h3>The order, and what each costs</h3></div><div class="list">${pj.phases.map(p => `<div class="phase"><span><span class="row-t">${p.n}. ${esc(p.name)}</span><span class="second" style="display:block">${esc(p.biggest)}</span></span><span class="row-t">${p.hi ? gbp(p.lo, p.hi) : "—"}</span></div>`).join("")}</div>
      <div class="sec"><h3>The files</h3></div><div class="list">${pj.files.map(fl => `<a class="rowc nopic" href="${esc(M.fileHref(fl.href))}" target="_blank" rel="noopener"><span class="t">${esc(fl.name)}</span><span class="chev">${icon(fl.href.endsWith(".pdf") ? "download" : "chev")}</span></a>`).join("")}</div>
      <div class="sec"><h3>Other ideas, to look at</h3></div><div class="card" style="padding:0 0">${pj.options.map(o => `<div class="opt"><span class="row-t">${esc(o.name)}</span><span class="second" style="display:block">${esc(o.size)} · ${gbp(o.lo, o.hi)}</span></div>`).join("")}</div>`;
  } else {
    body = shopList(pj);
  }
  page().innerHTML = `<div style="margin-top:16px"><h1>${esc(pj.name)}</h1><p class="second">${esc(M.room(pj.room).label)} · about ${gbp(...pj.cost)} in all</p></div>
    <div class="seg full" role="group" aria-label="Plan, build or shop" style="margin-top:12px">${[["plan", "Plan"], ["build", "Build"], ["shop", "Shop"]].map(([k, t]) => `<button type="button" data-ptab="${k}" aria-pressed="${tab === k}">${t}</button>`).join("")}</div>
    ${body}`;
  if (S.openPiece) { const el = document.getElementById("pc-" + S.openPiece); if (el) el.scrollIntoView({ block: "center" }); }
}
function pieceRow(pj, p) {
  const pg = M.pieceProgress(p), open = S.openPiece === p.key, pc = pg.total ? Math.round(100 * pg.done / pg.total) : 0;
  const row = `<button type="button" class="rowc nopic" id="pc-${p.key}" data-piece="${p.key}" aria-expanded="${open}"><span><span class="t">${esc(p.title)}</span><span class="s">${esc([p.time, p.who.toLowerCase().replace(/^you/, "you"), p.cost[1] ? gbp(...p.cost) : ""].filter(Boolean).join(" · "))}</span></span><span class="ring" style="--p:${pc}">${pg.done}/${pg.total}</span></button>`;
  if (!open) return row;
  const buys = pj.buy.filter(b => p.buy.includes(b.id));
  return row + `<div class="piece-open"><p style="margin:0">${esc(p.what)}</p>${p.need ? `<p class="second" style="margin:0"><b>First:</b> ${esc(p.need)}</p>` : ""}
    ${p.checks.length ? `<div class="callout butter"><h3>Check first</h3><p>${p.checks.map(c => `${esc(c.item)}: ${esc(c.space)}`).join(" · ")}</p></div>` : ""}
    ${p.tasks.length ? `<span class="label">Build</span>${p.tasks.map(t => `<div class="task"><input type="checkbox" id="t-${esc(t.id)}" data-tick="${esc(t.id)}" ${M.ticked(t.id) ? "checked" : ""}><div><label class="tt" for="t-${esc(t.id)}">${esc(t.title)}</label>${t.how.length ? `<details><summary>How</summary><ol>${t.how.map(x => `<li>${esc(x)}</li>`).join("")}</ol></details>` : ""}</div></div>`).join("")}` : ""}
    ${buys.length ? `<span class="label">Buy</span><div class="list">${buys.map(buyRow).join("")}</div>` : ""}</div>`;
}
function buyRow(b) {
  const on = M.ticked(b.id);
  return `<div class="buyrow${on ? " done" : ""}"><input type="checkbox" id="b-${b.id}" data-tick="${b.id}" ${on ? "checked" : ""}><label for="b-${b.id}"><span class="t">${b.qty ? esc(b.qty) + " × " : ""}${esc(b.item)}</span><small>${esc(b.phase.replace(/^\d+\s+/, ""))}</small></label><span class="p">${b.hi ? gbp(b.lo, b.hi) : ""}</span></div>`;
}
function shopList(pj) {
  const left = pj.buy.filter(b => !M.ticked(b.id)), lo = left.reduce((a, b) => a + b.lo, 0), hi = left.reduce((a, b) => a + b.hi, 0);
  const phases = [...new Set(pj.buy.map(b => b.phase))];
  return `<div class="jobs-head"><span class="row-t">${pj.buy.length - left.length} of ${pj.buy.length} bought</span><span class="second">${gbp(lo, hi)} to go</span></div>`
    + phases.map(ph => `<div class="sec"><span class="label">${esc(ph.replace(/^\d+\s+/, ""))}</span></div><div class="list">${pj.buy.filter(b => b.phase === ph).map(buyRow).join("")}</div>`).join("");
}
function pShop() {
  stage(null);
  page().innerHTML = `<h1 style="margin-top:8px">Shop</h1><p class="second">Everything to buy, by project · tick it when it's bought</p>`
    + M.D.projects.map(pj => `<div class="sec"><h3>${esc(pj.name)}</h3><a href="#/project/${pj.id}/plan">The plan</a></div>${shopList(pj)}`).join("");
}

/* ------------------------------------------------------------------ Speed, quality and colours (#/settings; #/perf too: Phases 4 and 8) */
const pref = { get(k, d) { try { return localStorage.getItem("demma-v1:" + k) || d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("demma-v1:" + k, v); } catch (e) {} } };
function applyTheme(v = pref.get("theme", "auto")) { if (v === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v; }
applyTheme();
function deviceWords(p) {
  if (!p) return "Open the house once and this says how your device draws it.";
  const g = p.gpu || "", kind = /apple gpu/i.test(g) ? "an iPhone or iPad (Apple graphics)" : /rtx|geforce|nvidia/i.test(g) ? "an NVIDIA graphics card" : /radeon|amd/i.test(g) ? "an AMD graphics card" : /intel/i.test(g) ? "Intel graphics" : p.small ? "a phone or tablet" : "this computer";
  const how = p.big ? "It draws sharp, with shadows and soft light, from the start." : p.goodPhone ? "It starts quick and sharpens itself when it can keep up." : "It starts quick; Sharp asks more of it.";
  return `This is ${kind}. ${how}`;
}
function pSettings() {
  stage(null);
  const p = viewer.profile, q = p ? (p.picked ? p.quality : "auto") : "auto", th = pref.get("theme", "auto"), n = performance.getEntriesByType("navigation")[0] || {};
  const seg = (name, cur, opts) => `<div class="seg full" role="group" aria-label="${name}">${opts.map(([k, t]) => `<button type="button" data-${name.toLowerCase().replace(/ .*/, "")}="${k}" aria-pressed="${cur === k}">${t}</button>`).join("")}</div>`;
  page().innerHTML = `<h1 style="margin-top:8px">Speed and quality</h1><p class="second">For this device only</p>
    <div class="sec"><h3>The 3D</h3></div>${seg("Quality", q, [["auto", "Auto"], ["fast", "Quick"], ["hd", "Sharp"]])}
    <p class="second">${esc(deviceWords(p))}</p>
    <div class="sec"><h3>Colours</h3></div>${seg("Theme", th, [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]])}
    <div class="sec"><h3>The numbers</h3><span class="second">Send a screenshot</span></div>
    <div class="card perf"><pre id="perfbox">Page ready ${Math.round(n.domContentLoadedEventEnd || 0)} ms · the 3D ${app.loadMs ? `ready ${app.loadMs} ms after the page` : "not opened yet"}
${p ? `Graphics: ${p.gpu}\nQuality now: ${p.quality === "hd" ? "Sharp" : "Quick"} · drawn at ${p.ratio}×` : ""}
${navigator.userAgent}</pre></div>${viewer.ready ? "" : `<p><a class="btn" href="#/house">Open the house first, then come back</a></p>`}`;
  if (viewer.ready) { viewer.send("perf"); app._perfOff && app._perfOff(); app._perfOff = viewer.on("perf", d => { const b = $("#perfbox"); if (b && !b.dataset.done) { b.dataset.done = 1; b.textContent += `\n\n3D built in ${d.buildMs} ms\n` + Object.entries(d.perf).map(([k, v]) => `${k}: ${v}`).join("\n"); } }); }
}

/* ------------------------------------------------------------------ search: rooms, pieces, jobs */
function index() {
  if (app._idx) return app._idx;
  const out = [];
  for (const r of M.rooms()) out.push({ t: r.label, s: M.FLOOR_NAME[r.floor], h: `#/room/${r.id}` });
  for (const i of M.items()) if (!["switch", "socket", "light"].includes(i.kind)) out.push({ t: i.name, s: (M.room(i.room) || { label: "" }).label, h: M.editable(i) ? `#/room/${i.room}/edit/${encodeURIComponent(i.id)}` : `#/room/${i.room}` });
  for (const pj of M.D.projects) {
    out.push({ t: pj.name, s: "Project", h: `#/project/${pj.id}` });
    for (const pl of pj.places) for (const p of pl.pieces) { out.push({ t: p.title, s: `${pj.name} · ${pl.name}`, h: `#/project/${pj.id}/build`, piece: p.key });
      for (const t of p.tasks) out.push({ t: t.title, s: `${p.title}`, h: `#/project/${pj.id}/build`, piece: p.key }); }
    for (const b of pj.buy) out.push({ t: b.item, s: `To buy · ${pj.name}`, h: `#/project/${pj.id}/shop` });
  }
  for (const m of M.measureRows()) out.push({ t: m.what, s: `To measure · ${(M.room(m.room) || { label: "" }).label}`, h: "#/measure" });
  return (app._idx = out);
}
function openSearch() {
  closeSearch();
  const o = document.createElement("div"); o.className = "overlay"; o.id = "search"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Find");
  o.innerHTML = `<div class="box"><div class="searchin">${icon("search")}<label class="sr" for="q">Find a room, a piece or a job</label><input id="q" type="search" placeholder="Find a room, a piece or a job" autocomplete="off"><button type="button" class="icon-btn" data-close-search aria-label="Close">${icon("close")}</button></div><div class="results" id="results"></div></div>`;
  document.body.append(o);
  const q = o.querySelector("#q"), res = o.querySelector("#results");
  const run = () => { const v = q.value.trim().toLowerCase(); if (!v) { res.innerHTML = ""; return; }
    const hits = index().filter(x => (x.t + " " + x.s).toLowerCase().includes(v)).slice(0, 24);
    res.innerHTML = hits.map(x => `<a href="${x.h}" ${x.piece ? `data-open-piece="${x.piece}"` : ""}>${esc(x.t)}<small>${esc(x.s)}</small></a>`).join("") || `<p class="second" style="padding:12px">Nothing called that yet.</p>`; };
  q.addEventListener("input", run); q.focus();
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close-search]") || e.target.closest("a")) setTimeout(closeSearch, 0); });
}
function closeSearch() { const o = $("#search"); if (o) o.remove(); }

/* ------------------------------------------------------------------ actions */
async function savePicture(d) {
  const blob = await (await fetch(d.url)).blob(), name = (d.name || "Demma's Home picture.png");
  const dl = await store.downloads();
  if (dl) { try { await dl.save({ filename: name, data: blob }); toast("Saved"); return; } catch (e) { if (e && e.code === "declined") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  toast("Saved to your downloads");
}
async function share() {
  const url = store.mode === "shared" ? "https://claude.ai/artifact/8M7ZmKP8m1kEDTZnuL3cyK" : store.shareLink();   // the shared page's own link
  try { await navigator.clipboard.writeText(url); toast(store.mode === "shared" ? "Link copied" : "Link copied: it carries your changes"); }
  catch (e) { toast(url, 8000); }
}
async function addPhoto(input, roomId) {
  const f = input.files && input.files[0]; if (!f) return;
  const assets = await store.assets();
  if (!assets) { toast("Photos save on the shared page; here, send them in a message"); return; }
  try { const a = await assets.upload(f); await store.add("photos", { room: roomId, url: a.url, asset: a.id }); toast("Photo added"); }
  catch (e) { toast("That photo didn't upload"); }
}
let mT = {};
function onMeasureInput(el) {
  const id = el.dataset.measure, m = M.measureRows().find(x => x.id === id), v = el.value === "" ? null : +el.value;
  clearTimeout(mT[id]); S.typing = true;
  mT[id] = setTimeout(async () => {
    S.typing = false;
    const was = M.answer(id) || {};
    if (v == null && !was.photo) await store.del("measurements", id);
    else await store.put("measurements", id, { item: id, what: m.what, cm: v, photo: was.photo || null, sent: false });
  }, 600);
}
async function onClick(e) {
  const t = e.target.closest("button, a, input, [data-sheet]"); if (!t) return;
  const d = t.dataset;
  if (d.floor) { S.houseFloor = d.floor; go(`#/house/${d.floor}`); return; }
  if (d.quality) { viewer.send("quality", { q: d.quality }); const off = viewer.on("profile", () => { off(); render(true); }); if (!viewer.ready) toast("Open the house once first"); return; }
  if (d.theme) { pref.set("theme", d.theme); applyTheme(d.theme); render(true); return; }
  if (d.hview) { S.houseView = d.hview; render(true); viewer.go({ house: true, floor: S.houseFloor, fview: S.houseView }); return; }
  if (d.sheet !== undefined && t.classList.contains("handle")) { S.sheetLow = !S.sheetLow; document.body.classList.toggle("sheet-low", S.sheetLow); render(true); return; }
  if (d.mode) { const id = S.route.a; S.mode[id] = d.mode; viewer.go({ room: id, mode: d.mode }); render(true); return; }
  if (d.rtab) { S.tab[S.route.a] = d.rtab; render(true); return; }
  if (d.tabGo) { e.preventDefault(); S.tab[S.route.a] = d.tabGo; render(true); return; }
  if (d.ptab) { go(`#/project/${S.route.a}/${d.ptab}`); return; }
  if (d.piece) { S.openPiece = S.openPiece === d.piece ? null : d.piece; render(true); return; }
  if (d.openPiece) { S.openPiece = d.openPiece; return; }
  if (d.moment) { viewer.send("moment", { k: d.moment }); return; }
  if (d.panel) { viewer.send("panel", { k: d.panel }); toast(d.panel === "look" ? "Look: paints, lights and finishes are over the room" : "Options: try other pieces over the room"); return; }
  if (d.picture !== undefined) { toast("Taking an HD picture…"); viewer.send("picture"); return; }
  if (d.livingEdit !== undefined) { go("#/room/living/edit"); return; }
  if (t.id === "search-btn" || d.search !== undefined) { openSearch(); return; }
  if (d.share !== undefined) { share(); return; }
  if (d.tick) { const on = t.checked; if (on) await store.put("ticks", d.tick, { done: true }); else await store.del("ticks", d.tick); return; }
  if (d.send !== undefined) {
    const rows = M.measureRows().filter(m => M.answer(m.id) && M.answer(m.id).cm != null);
    for (const m of rows) await store.put("measurements", m.id, Object.assign({}, M.answer(m.id), { sent: true }));
    if (store.mode === "shared") toast(`Sent: ${rows.length} measurement${rows.length === 1 ? "" : "s"}${M.edited() ? ` and ${M.edited()} change${M.edited() === 1 ? "" : "s"}` : ""}. The next round puts them in.`);
    else share();
    render(true); return;
  }
}
document.addEventListener("input", e => { const el = e.target; if (el.dataset && el.dataset.measure) onMeasureInput(el); });
document.addEventListener("keydown", e => {   // the room's tabs and every switch: the arrow keys move along them
  const b = e.target.closest && e.target.closest('[role="tab"], .seg button'); if (!b || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const all = [...b.parentElement.querySelectorAll("button:not([disabled])")], i = all.indexOf(b), n = all[(i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
  e.preventDefault(); const key = n.dataset.rtab || n.dataset.mode || n.dataset.floor; n.click();
  requestAnimationFrame(() => { const m = document.querySelector(`[data-rtab="${key}"], [data-mode="${key}"], [data-floor="${key}"]`); (m || document.activeElement).focus(); });
});
document.addEventListener("change", async e => {
  const el = e.target;
  if (el.dataset.photo) addPhoto(el, el.dataset.photo);
  if (el.dataset.mphoto) { const id = el.dataset.mphoto, assets = await store.assets(), f = el.files && el.files[0]; if (!f) return;
    if (!assets) { toast("Photos save on the shared page; here, send them in a message"); return; }
    try { const a = await assets.upload(f), m = M.measureRows().find(x => x.id === id), was = M.answer(id) || {}; await store.put("measurements", id, { item: id, what: m.what, cm: was.cm ?? null, photo: a.url, sent: false }); toast("Photo added"); }
    catch (er) { toast("That photo didn't upload"); } }
});
document.addEventListener("submit", async e => {
  const f = e.target; if (!f.dataset.note) return; e.preventDefault();
  const tx = f.querySelector("textarea").value.trim(); if (!tx) return;
  await store.add("notes", { room: f.dataset.note, item: f.dataset.item || (S.picked && S.picked.item ? S.picked.item.id : null), text: tx }); toast("Note saved");
});

start();
