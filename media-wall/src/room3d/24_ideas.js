/* N244, the client (23 Nov 2026): "I just want the option to add more storage and look through ideas for things. Just make it easy to use
   and view different configs of storage and furniture in rooms." The Ideas pill in a room: ‹ › through whole-room set-ups, the plan's
   first, then a few made from what the room offers: its storage ideas (R.HOUSE3.storage, each a spot with the shops' buys) and the
   catalogue's pieces (HCAT_ADD) where they fit (spotFor: back to a wall, clear of the walls, the slope, the swings, the space kept clear
   and each other). Read as data, so more spots and pieces (N243) drop in. Each shown at once over hers, set aside as a look is (N222):
   nothing saved till Keep it on the pill; Keep this saves it in Your looks (N221) to hold and compare; a piece's card ‹ › what fits
   its spot; + Add storage the nearest free spot's. Options only: nothing is a build or a buy row till she picks */
const IX = { room: null, i: 0, L: null, p: "ix", n: 0, k: 0, fit: null };
const IX_THEMES = [   // a set-up: the room's storage ideas whose words match re (a shop's buy that matches, else the plan's), then a piece of each kind
  { n: "Records wall", re: /record|vinyl|\bLPs?\b|face-out/i, add: [["shelves", /kallax|cube|record|vinyl/i], ["seat", /armchair|lounge/i], ["lamp", /floor/i]] },
  { n: "Reading corner", re: /book|ledge|float/i, no: /bath|wc|kitchen|garage|store|hall/, add: [["seat", /armchair/i], ["lamp", /floor/i], ["table", /side/i], ["shelves", /book/i]] },
  { n: "Tidy office", re: /drawer|peg|book|desk/i, no: /bath|wc|kitchen|garage|store|hall|landing/, add: [["desk", null], ["shelves", /cube|kallax/i], ["chest", null]] },
  { n: "More storage", re: /./, shop: true, no: /wc/, add: [["shelves", null], ["chest", null], ["shoes", null], ["wardrobe", null]] },
  { n: "On show", re: /glass|display|ledge|case/i, no: /bath|wc|garage/, add: [["unit", /glass|display|cabinet/i], ["shelves", /ladder|display/i], ["plant", null]] },
  { n: "Calm bedroom", re: /drawer|bedside|ledge|wardrobe|box/i, only: /master|bed/, add: [["bedside", /rattan|oak|pine/i], ["chest", /drawer/i], ["lamp", /floor/i]] },   // N276
  { n: "Oak and cane", re: /oak|shelf|ledge|record/i, no: /bath|wc|garage|store|kitchen/, add: [["unit", /rattan|cane|oak|pine/i], ["shelves", /ladder|oak|edin/i], ["seat", /rattan|cane|oak/i]] },   // N276
  { n: "Bathroom shelves", re: /shelf|cabinet|box|basket|towel/i, only: /bath/, add: [["unit", /bathroom|single|double|zander|sonderborg/i], ["chest", /bamboo|bathroom/i], ["shelves", /tallboy|glass/i]] },   // N277
  { n: "Media and games", re: /media|tv|game|record|console/i, no: /bath|wc|kitchen|garage|store|hall|landing/, add: [["unit", /tv|media/i], ["seat", /armchair|chair/i], ["rug", /wool|jute/i]] },   // N277
  { n: "Dining corner", re: /dining|table|plate|glass|shelf/i, only: /kitchen|bed3/, add: [["table", /dining|seater|folding|extending/i], ["lamp", /floor/i], ["shelves", /ladder|display/i]] },   // N278
  { n: "Coats and shoes", re: /peg|hook|coat|hat|shoe/i, only: /hall|porch|landing/, add: [["shoes", null], ["seat", /bench/i]] },
];
const IX_STORE = ["shelves", "chest", "shoes", "wardrobe", "unit"];   // + Add storage, a kind each press
const ixOn = () => !!(ASIDE && ASIDE.ix);
const ixMine = k => ixOn() && String(k).startsWith("add." + IX.p);
function ixRoom() {   // the house's room you're in (not the living room: its own pieces), or null
  if (!R.HOUSE3 || !ROOMV()) return null; const r = (GS.RMODE === "stand" && GS.hereRoom) || VIEW_ROOM[S.view];
  return r && r !== LIVR && (R.HOUSE3.rooms || {})[r] ? r : null;
}
function ixPill() {
  const b = qs("#r3d-ideas"); if (!b) return; b.hidden = !ixRoom(); b.setAttribute("aria-pressed", String(ixOn()));
  if (!ixOn() && /^ixp?:/.test(GS.actId || "")) closeAct();
}
const ixCands = (kind, re, used = new Set()) => { const sc = q => (re && re.test(HCAT[q].n) ? 0 : 2) + (used.has(q) ? 4 : 0) + (HCAT[q].shop ? 0 : 1);   // its words first, then not used yet, then a shop's
  return [...new Set(HCAT_ADD)].filter(q => HCAT[q] && HCAT[q].k === kind && !HCAT[q].own).sort((a, b) => sc(a) - sc(b)); };
function ixSetups(room) {   // [{n, ideas: {id: shop key or ""}, adds: [[key, x, z]]}], the plan's first
  const r = R.HOUSE3.rooms[room], m2 = (r[1] - r[0]) * (r[3] - r[2]) / 1e4, cap = Math.max(2, Math.min(5, Math.round(m2 / 2.5)));
  const skip = k => String(k).startsWith("add." + IX.p) || !!(HIT(k) || {}).idea, out = [{ n: "The plan's", ideas: {}, adds: [] }], seen = new Set(), used = new Set();
  for (const th of IX_THEMES) { if (out.length > 7) break; if ((th.only && !th.only.test(room)) || (th.no && th.no.test(room))) continue;
    const s = { n: th.n, ideas: {}, adds: [] }, more = []; let n = 0;
    for (const I of ideasIn(room)) { if (n >= cap) break; const O = I.o || [];
      if (!th.re.test(`${I.n} ${I.line}`) && !O.some(o => th.re.test(o[3]))) continue;
      const o = th.shop ? O[0] : O.find(q => th.re.test(q[3])), hk = o && ideaOptKey(I, o[0]); s.ideas[I.id] = o ? o[0] : "";
      I.parts.forEach((p, j) => { if (hk ? !j || I.each : HCAT[p.cat]) more.push(hk ? optBox(p, HCAT[hk], r) : p.b.slice()); });
      n += hk && !I.each ? 1 : I.parts.length; }
    let at = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2];   // the first from the room's middle, each next by the last
    for (const [kind, re] of th.add) { if (n >= cap) break;
      for (const q of ixCands(kind, re, used).slice(0, 6)) { const sp = spotFor(room, q, at[0], at[1], r[4], null, more, skip); if (!sp) continue;
        s.adds.push([q, sp[0], sp[1]]); more.push(sp[3]); used.add(q); at = [(sp[3][0] + sp[3][3]) / 2, (sp[3][2] + sp[3][5]) / 2]; n++; break; } }
    const sig = JSON.stringify([s.ideas, s.adds.map(a => a[0])]); if (!n || seen.has(sig)) continue; seen.add(sig); out.push(s); }
  return out;
}
const heArr = v => [v.item, v.field, v.value, ...(v.field === "add" ? [v.room, v.x, v.z, v.y] : [])];
function ixShow(room, i) {   // set-up i over hers: her colours, edits and pieces, the room's storage ideas and the set-up's pieces its own
  const s = IX.L[i], r = R.HOUSE3.rooms[room]; if (!s) return; IX.i = i;
  if (!ASIDE) lookAside(s.n); if (!ASIDE || !ASIDE.real) return; ASIDE.ix = room; ASIDE.plan = false; ASIDE.title = `Ideas: ${s.n}`;
  S.fin = JSON.parse(JSON.stringify(JSON.parse(ASIDE.s).fin || {}));
  const o = S.fin[room] = S.fin[room] || {}, v = Object.entries(s.ideas).map(([id, k]) => k ? `${id}:${k}` : id).join(",");
  if (v) o[28] = v; else delete o[28]; if (!Object.keys(o).length) delete S.fin[room];
  const mine = Object.values(ASIDE.real.rows("edits") || {}).filter(heOk).map(heArr);
  heWear([...mine, ...s.adds.map(([k, x, z], j) => [`add.${IX.p}${j}`, "add", k, room, cmR(x), cmR(z), r[4]])], DS()); IX.n = s.adds.length;
  finApplyAll(); storeEdits(); lookPill();
}
function ixOpen(room) {   // the pill: the room's set-ups (made once a visit), the first idea shown at once, its card
  if (!DS() || !R.HOUSE3) { toast("One moment: the plan's still loading"); return; }
  if (!(ixOn() && ASIDE.ix === room && IX.room === room)) {
    if (ASIDE) lookMine(); IX.p = "ix" + Math.random().toString(36).slice(2, 6); IX.room = room; IX.k = 0; IX.fit = null; IX.L = ixSetups(room);
    ixShow(room, IX.L.length > 1 ? 1 : 0); if (!ixOn()) return; toast(IX.L.length > 1 ? `${IX.L[IX.i].n} · ‹ › for more` : "No set-ups fit here: + Add storage"); }
  openAct("ix:" + room, [stage.clientWidth / 2, stage.clientHeight * 0.3]);
}
function ixNow(room) {   // what the set-up shown has in the room now: its pieces and rough cost
  let n = 0, lo = 0, hi = 0; const put = (c, k = 1) => { n += k; lo += (c || [0, 0])[0]; hi += (c || [0, 0])[1]; };
  for (const q of ideaVals(room)) { const [id, key] = q.split(":"), I = IDEAS().find(i => i.id === id && i.room === room); if (I) put(ideaCost(I, key), key && !I.each ? 1 : I.parts.length); }
  for (const v of Object.values(DS() ? DS().rows("edits") || {} : {})) if (v && v.field === "add" && v.room === room && ixMine(v.item) && HCAT[v.value]) put(upCat(v.value, HCAT[v.value]));
  return { n, lo: Math.round(lo), hi: Math.round(hi) };
}
function ixCard(room) {   // "Records wall · 4 pieces · £320–480": ‹ ›, Keep this, a chip a set-up and + Add storage
  if (!ixOn() || ASIDE.ix !== room || !IX.L) return null; const s = IX.L[IX.i], t = ixNow(room);
  const line = `${s.n} · ${t.n ? `${t.n} piece${t.n === 1 ? "" : "s"}${t.hi ? " · " + upRange(t.lo, t.hi) : ""}` : "as planned"}`;
  return [`Ideas · ${roomName(room)}`, line, [...hcNav(room, IX.i, "ixset"), btn("Keep this", { ixkeep: room }, true), btn("Back to mine", { lookmine: "1" })], null,
    `<div class="r3d-fin"><div class="r3d-finsc" role="group" aria-label="Set-ups">${IX.L.map((q, j) => `<button type="button" data-ixset="${room}:${j}" aria-pressed="${j === IX.i}">${q.n}</button>`).join("")}`
    + `<button type="button" data-ixadd="${room}" aria-pressed="false">+ Add storage</button></div></div>`];
}
function ixFits(k, row) {   // its kind's pieces that stand where it does (their middle within 60 cm), clear of the rest; kept while its card is
  const kind = HCAT[row.value].k; if (IX.fit && IX.fit.k === k && IX.fit.kind === kind && IX.fit.L.includes(row.value)) return IX.fit.L;
  const b = pieceBox(k), c = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2];
  const L = ixCands(kind, null).filter(q => q === row.value || spotFor(row.room, q, c[0], c[1], +row.y, k, [], null, 60));
  IX.fit = { k, kind, L }; return L;
}
function ixPieceCard(k) {   // the house piece's card for a set-up's piece: ‹ › what fits its spot, its size, fit, price and shop, its page
  const ds = DS(), row = ds && ds.rows("edits")[k + "~add"], C = row && HCAT[row.value]; if (!C) return null;
  const L = ixFits(k, row), i = Math.max(0, L.indexOf(row.value));
  return [C.n, hcLine(k, C), [...hcNav(k, i, "ixgo"), btn("Keep it", { actopen: "ix:" + row.room }, true), btn("Move or resize", { actopen: "hsize:" + k }), btn("Remove", { hremove: k })], null,
    `<div class="r3d-fin">${hcShopTray(k, L, C, "ixgo")}</div>`];
}
function ixKeep(room) {   // Keep this: the set-up as one of Your looks (her colours and pieces with it), to hold and compare from hers
  const name = `${IX.L[IX.i].n}, ${roomName(room)}`.slice(0, 24), L = finSchemes().filter(x => x.name !== name); L.push(Object.assign({ name }, lookNow()));
  try { localStorage.setItem(FSK, JSON.stringify(L.slice(-LOOK_MAX))); } catch (e) { toast("That didn't save: this device is full"); return; }
  finSchDraw(); toast(`Kept in Your looks: ${name}`);
}
function ixAdd(room) {   // + Add storage: the room's nearest storage idea not shown (the plan's), else a storage piece in the nearest free spot
  const r = R.HOUSE3.rooms[room], ds = DS(), cam = [-camera.position.x / M, camera.position.z / M], far = b => Math.hypot((b[0] + b[3]) / 2 - cam[0], (b[2] + b[5]) / 2 - cam[1]);
  const vals = ideaVals(room).map(q => q.split(":")), off = ideasIn(room).filter(I => I.parts.length && !vals.some(([id]) => id === I.id)).sort((a, b) => far(a.parts[0].b) - far(b.parts[0].b));
  if (off.length) { const ids = Object.fromEntries(vals.map(([id, k]) => [id, k || ""])); ids[off[0].id] = ""; ideaKeep(room, ids); toast(`${off[0].n}: added`); return true; }
  for (let n = 0; n < IX_STORE.length; n++) { const kind = IX_STORE[(IX.k + n) % IX_STORE.length];
    for (const q of ixCands(kind, null).slice(0, 8)) { const sp = spotFor(room, q, cam[0], cam[1], r[4], null); if (!sp) continue;
      const id = `add.${IX.p}${IX.n++}`; IX.k += n + 1; ds.put("edits", id + "~add", { item: id, field: "add", value: q, room, x: cmR(sp[0]), z: cmR(sp[1]), y: r[4] });
      toast(`${HCAT[q].n}${HCAT[q].shop ? " · " + HCAT[q].shop : ""}: added`); return true; } }
  toast("No free spot for more storage here"); return false;
}
qs("#r3d-ideas")?.addEventListener("click", () => { const rm = ixRoom(); if (rm) ixOpen(rm); });
if (act) act.addEventListener("click", e => {   // the cards' own buttons (before 16_cards' handler)
  const b = e.target.closest("[data-ixset],[data-ixadd],[data-ixkeep],[data-ixgo]"); if (!b || performance.now() - actAt < 350) return; e.stopPropagation(); const d = b.dataset;
  if (d.ixset) { const [room, x] = d.ixset.split(":"), n = (IX.L || []).length; if (!n || !ixOn()) return; ixShow(room, ((+x % n) + n) % n); GS.actId = "ix:" + room; renderAct(); return; }
  if (d.ixadd) { if (ixOn()) ixAdd(d.ixadd); renderAct(); return; }
  if (d.ixkeep) { if (ixOn()) ixKeep(d.ixkeep); return; }
  const [k, x] = d.ixgo.split(":"), ds = DS(), row = ds && ds.rows("edits")[k + "~add"]; if (!row) return;
  const L = ixFits(k, row), v = L[((+x % L.length) + L.length) % L.length], pb = pieceBox(k), sp = spotFor(row.room, v, (pb[0] + pb[3]) / 2, (pb[2] + pb[5]) / 2, +row.y, k, [], null, 60);
  ds.put("edits", k + "~add", Object.assign({}, row, { value: v }, sp ? { x: cmR(sp[0]), z: cmR(sp[1]) } : {})).then(() => { if (GS.actId) renderAct(); });
}, true);
