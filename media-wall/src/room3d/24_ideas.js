/* N244, the client (23 Nov 2026): "I just want the option to add more storage and look through ideas for things. Just make it easy to use
   and view different configs of storage and furniture in rooms." The Ideas pill in a room: ‹ › through whole-room set-ups, the plan's
   first, then a few made from what the room offers: its storage ideas (R.HOUSE3.storage, each a spot with the shops' buys) and the
   catalogue's pieces (HCAT_ADD) where they fit (spotFor: back to a wall, clear of the walls, the slope, the swings, the space kept clear
   and each other). Read as data, so more spots and pieces (N243) drop in. Each shown at once over hers, set aside as a look is (N222):
   nothing saved till Keep it on the pill; Keep this saves it in Your looks (N221) to hold and compare; a piece's card ‹ › what fits
   its spot; + Add storage the nearest free spot's. Options only: nothing is a build or a buy row till she picks */
const IX = { room: null, i: 0, L: null, p: "ix", n: 0, k: 0, fit: null, col: true };
const IX_THEMES = [   // a set-up: the room's storage ideas whose words match re (a shop's buy that matches, else the plan's), then a piece of each kind
  { n: "Records wall", why: "Records face-out at eye height, a chair and a lamp to listen by", pal: { w: "pigeon", rug: "blue", cu: "rust", k: "2700" }, re: /record|vinyl|\bLPs?\b|face-out/i, add: [["shelves", /kallax|cube|record|vinyl/i], ["seat", /armchair|lounge/i], ["lamp", /floor/i]] },
  { n: "Reading corner", why: "A chair, a lamp at its shoulder and a table in reach", pal: { w: "plaster", rug: "jute", cu: "linen", k: "2700" }, re: /book|ledge|float/i, no: /bath|wc|kitchen|garage|store|hall/, add: [["seat", /armchair/i], ["lamp", /floor/i], ["table", /side/i], ["shelves", /book/i]] },
  { n: "Tidy office", why: "The desk with 90 cm behind it for the chair; cooler light to work", pal: { w: "french", rug: "jute", cu: "sage", k: "4000" }, re: /drawer|peg|book|desk/i, no: /bath|wc|kitchen|garage|store|hall|landing/, add: [["desk", null], ["shelves", /cube|kallax/i], ["chest", null]] },
  { n: "More storage", why: "Storage on the walls, room kept in front of each to open it", pal: { w: "lime", cu: "linen" }, re: /./, shop: true, no: /wc/, add: [["shelves", null], ["chest", null], ["shoes", null], ["wardrobe", null]] },
  { n: "On show", why: "Glass and open shelves lit and kept apart, one plant to soften", pal: { w: "skim", rug: "stripes", cu: "charcoal" }, re: /glass|display|ledge|case/i, no: /bath|wc|garage/, add: [["unit", /glass|display|cabinet/i], ["shelves", /ladder|display/i], ["plant", null]] },
  { n: "Calm bedroom", why: "Low pieces, soft colours, warm light: drawers with room to open", pal: { w: "pigeon", rug: "jute", cu: "linen", bed: "#f4f1eb", k: "2700" }, re: /drawer|bedside|ledge|wardrobe|box/i, only: /master|bed/, add: [["bedside", /rattan|oak|pine/i], ["chest", /drawer/i], ["lamp", /floor/i]] },   // N276
  { n: "Oak and cane", why: "Warm wood and woven cane on a soft white", pal: { w: "school", rug: "jute", cu: "sage", bed: "#8b9878" }, re: /oak|shelf|ledge|record/i, no: /bath|wc|garage|store|kitchen/, add: [["unit", /rattan|cane|oak|pine/i], ["shelves", /ladder|oak|edin/i], ["seat", /rattan|cane|oak/i]] },   // N276
  { n: "Bathroom shelves", why: "Shelves and a cabinet clear of the door and the bath", pal: { w: "lime" }, re: /shelf|cabinet|box|basket|towel/i, only: /bath/, add: [["unit", /bathroom|single|double|zander|sonderborg/i], ["chest", /bamboo|bathroom/i], ["shelves", /tallboy|glass/i]] },   // N277
  { n: "Media and games", why: "Dark walls cut the screen's glare; a chair and a rug to sit on", pal: { w: "hague", rug: "blue", cu: "charcoal", k: "2700" }, re: /media|tv|game|record|console/i, no: /bath|wc|kitchen|garage|store|hall|landing/, add: [["unit", /tv|media/i], ["seat", /armchair|chair/i], ["rug", /wool|jute/i]] },   // N277
  { n: "Dining corner", why: "90 cm behind each chair to pull it out", pal: { w: "plaster", rug: "jute", cu: "linen", k: "2700" }, re: /dining|table|plate|glass|shelf/i, only: /kitchen|bed3/, add: [["table", /dining|seater|folding|extending/i], ["dchair", /oak|rattan/i], ["dchair", /oak|rattan/i], ["trolley", null], ["lamp", /floor/i]] },   // N278, N279
  { n: "Garden dining", yard: true, re: /^$/, add: [["gtable", /patio|dining|seater/i], ["gchair", null], ["gchair", null], ["gchair", null]] },   // N280: the garden's
  { n: "Garden lounge", yard: true, re: /^$/, add: [["gsofa", /sofa/i], ["gchair", null], ["gtable", /sofa|coffee|low/i]] },
  { n: "Bistro for two", yard: true, re: /^$/, add: [["gtable", /bistro/i], ["gchair", /bistro/i], ["gchair", /bistro/i], ["gchair", /bench/i]] },
  { n: "Coats and shoes", why: "Pegs and shoes by the door, a bench to sit on", pal: { w: "skim" }, re: /peg|hook|coat|hat|shoe/i, only: /hall|porch|landing/, add: [["shoes", null], ["seat", /bench/i]] },
];
const IX_STORE = ["shelves", "chest", "shoes", "wardrobe", "unit"], IX_YARD = ["gsofa", "gtable", "gchair"];   // N280: + Add in the garden   // + Add storage, a kind each press
/* N282, the client (24 Nov 2026): "a better ui for trying ideas and for them to fit and look better ... real home improvement with research
   and knowledge of design and decor". The room kept clear in front of each kind (cm; docs/DESIGN.md has the rules and their sources:
   90 to walk past or open a wardrobe, 75 to open drawers and stand, 60 at shelves, 90 behind a desk's or a table's chair) and each
   set-up's colours, 60-30-10: the walls, then the rug and curtains, then one accent; warm 2700 K to relax, 4000 K to work */
const DZ = { wardrobe: [90, "wardrobe"], chest: [75, "drawers"], sideboard: [75, "sideboard"], unit: [60, "unit"], shelves: [60, "shelves"], shoes: [60, "shoe rack"],
  desk: [90, "desk"], table: [90, "table"], gtable: [90, "table"], seat: [45, "chair"], gsofa: [45, "sofa"], trolley: [50, "trolley"], bedside: [0, ""] };
const IX_PAINTS = [["#e6dfcd", "School House White"], ["#d6cdc0", "Skimming Stone"], ["#ddb9a5", "Setting Plaster"], ["#b9b6a2", "French Grey"],
  ["#8f9a91", "Pigeon"], ["#31404b", "Hague Blue"], ["#ddd8cb", "Slaked Lime"]];   // approximate screen colours of Farrow & Ball's and Little Greene's paints
const IX_PK = { school: 0, skim: 1, plaster: 2, french: 3, pigeon: 4, hague: 5, lime: 6 };
const ixAt = (...a) => HPL ? placeSpot(...a) : spotFor(...a);   // N287: only a place that takes it (N286's places), spotFor only without the data
function ixSpot(room, q, x, z, y, self, more, skip, maxD = Infinity) {   // the nearest spot with its kind's room in front, else the nearest (marked tight)
  const cl = (DZ[(HCAT[q] || {}).k] || [0])[0], a = cl ? ixAt(room, q, x, z, y, self, more, skip, maxD, cl) : null;
  if (a) return Object.assign(a, { cl }); const b = ixAt(room, q, x, z, y, self, more, skip, maxD); return b && Object.assign(b, { cl: 0, tight: !!cl });
}
function ixNotes(s) {   // the set-up's design in a line: its colours, the room in front of each piece, a lamp by the chair
  const out = [], P = s.pal; if (P && IX.col) out.push([IX_PAINTS[IX_PK[P.w]][1] + " walls", P.rug && "a " + upNm(FIN_RUGS, P.rug).toLowerCase() + " rug", P.cu && upNm(FIN_CURT, P.cu).toLowerCase() + " curtains",
    P.k && (P.k === "2700" ? "warm" : "cool") + ` ${P.k} K`].filter(Boolean).join(", "));
  const ok = [], tight = []; for (const [q, , , f] of s.adds) { const d = DZ[(HCAT[q] || {}).k]; if (!d || !d[0]) continue; (f ? tight : ok).push(d); }
  if (ok.length) out.push("✓ " + [...new Map(ok.map(d => [d[1], d])).values()].map(d => `${d[0]} cm at the ${d[1]}`).join(", "));
  if (tight.length) out.push("Tight at the " + [...new Set(tight.map(d => d[1]))].join(", ") + ": less than the room to open it");
  const seat = s.adds.find(([q]) => /seat|gsofa/.test((HCAT[q] || {}).k)), lamp = s.adds.find(([q]) => (HCAT[q] || {}).k === "lamp");
  if (seat && lamp) out.push(Math.hypot(seat[1] - lamp[1], seat[2] - lamp[2]) < 110 ? "✓ a lamp by the chair" : "The lamp's away from the chair");
  return out;
}
const ixOn = () => !!(ASIDE && ASIDE.ix);
const ixMine = k => ixOn() && String(k).startsWith("add." + IX.p);
function ixRoom() {   // the house's room you're in (not the living room: its own pieces), or null
  if (R.HOUSE3 && S.view === "house" && !INSIDE() && (R.HOUSE3.yard || {}).garden) return "garden";   // N280: the whole house from outside: the garden's
  if (!R.HOUSE3 || !ROOMV()) return null; const r = (GS.RMODE === "stand" && GS.hereRoom) || VIEW_ROOM[S.view];
  return r && r !== LIVR && (R.HOUSE3.rooms || {})[r] ? r : null;
}
function ixPill() {
  const b = qs("#r3d-ideas"); if (!b) return; b.hidden = !ixRoom(); b.setAttribute("aria-pressed", String(ixOn()));
  if (!ixOn() && /^ixp?:/.test(GS.actId || "")) closeAct();
}
const ixTakes = (room, q) => !HPL || placesFor(room, q).length > 0;   // N287: a place in the room takes it and it fits
const ixCands = (kind, re, used = new Set(), room = IX.room) => { const sc = q => (re && re.test(HCAT[q].n) ? 0 : 2) + (used.has(q) ? 4 : 0) + (HCAT[q].shop ? 0 : 1);   // its words first, then not used yet, then a shop's
  return [...new Set(HCAT_ADD)].filter(q => HCAT[q] && HCAT[q].k === kind && !HCAT[q].own && (!room || ixTakes(room, q))).sort((a, b) => sc(a) - sc(b)); };
function ixSetups(room) {   // [{n, ideas: {id: shop key or ""}, adds: [[key, x, z]]}], the plan's first
  const r = H3R(room), m2 = (r[1] - r[0]) * (r[3] - r[2]) / 1e4, cap = Math.max(2, Math.min(5, Math.round(m2 / 2.5)));
  const skip = k => String(k).startsWith("add." + IX.p) || !!(HIT(k) || {}).idea, out = [{ n: "The plan's", ideas: {}, adds: [] }], seen = new Set(), used = new Set();
  for (const th of IX_THEMES) { if (out.length > 7) break; if ((th.only && !th.only.test(room)) || (th.no && th.no.test(room)) || (room === "garden") !== !!th.yard) continue;
    const s = { n: th.n, why: th.why, pal: th.pal, ideas: {}, adds: [] }, more = []; let n = 0;
    for (const I of ideasIn(room)) { if (n >= cap) break; const O = I.o || [];
      if (!th.re.test(`${I.n} ${I.line}`) && !O.some(o => th.re.test(o[3]))) continue;
      const o = th.shop ? O[0] : O.find(q => th.re.test(q[3])), hk = o && ideaOptKey(I, o[0]); s.ideas[I.id] = o ? o[0] : "";
      I.parts.forEach((p, j) => { if (hk ? !j || I.each : HCAT[p.cat]) more.push(hk ? optBox(p, HCAT[hk], r) : p.b.slice()); });
      n += hk && !I.each ? 1 : I.parts.length; }
    let at = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2];   // the first from the room's middle, each next by the last
    let main = true;
    for (const [kind, re] of th.add) { if (n >= cap) break; const before = s.adds.length;
      for (const q of ixCands(kind, re, used, room).slice(0, 6)) { const sp = ixSpot(room, q, at[0], at[1], r[4], null, more, skip); if (!sp) continue;
        s.adds.push([q, sp[0], sp[1], sp.tight ? 1 : 0]); more.push(sp[4] || sp[3]); used.add(q); at = [(sp[3][0] + sp[3][3]) / 2, (sp[3][2] + sp[3][5]) / 2]; n++; break; }
      if (kind === th.add[0][0] && s.adds.length === before && HPL) { main = false; break; } }   // N287: its main piece has no place here: not shown
    if (!main) continue;
    const sig = JSON.stringify([s.ideas, s.adds.map(a => a[0])]); if (!n || seen.has(sig)) continue; seen.add(sig); out.push(s); }
  return out;
}
const heArr = v => [v.item, v.field, v.value, ...(v.field === "add" ? [v.room, v.x, v.z, v.y] : [])];
function ixShow(room, i) {   // set-up i over hers: her colours, edits and pieces, the room's storage ideas and the set-up's pieces its own
  const s = IX.L[i], r = H3R(room); if (!s) return; IX.i = i;
  if (!ASIDE) lookAside(s.n); if (!ASIDE || !ASIDE.real) return; ASIDE.ix = room; ASIDE.plan = false; ASIDE.title = `Ideas: ${s.n}`;
  S.fin = JSON.parse(JSON.stringify(JSON.parse(ASIDE.s).fin || {}));
  const o = S.fin[room] = S.fin[room] || {}, v = Object.entries(s.ideas).map(([id, k]) => k ? `${id}:${k}` : id).join(",");
  if (v) o[28] = v; else delete o[28];
  const P = IX.col && s.pal; if (P) { [0, 1, 2, 3].forEach(j => { o[j] = IX_PAINTS[IX_PK[P.w]][0]; }); if (P.rug) o[18] = P.rug; if (P.cu) o[19] = P.cu; if (P.bed && /bed|master/.test(room)) o[20] = P.bed; if (P.k) o[6] = P.k; }   // N282: its colours
  if (!Object.keys(o).length) delete S.fin[room];
  const mine = Object.values(ASIDE.real.rows("edits") || {}).filter(heOk).map(heArr);
  heWear([...mine, ...s.adds.map(([k, x, z], j) => [`add.${IX.p}${j}`, "add", k, room, cmR(x), cmR(z), r[4]])], DS()); IX.n = s.adds.length;
  finApplyAll(); storeEdits(); lookPill();
}
/* N245 (its first part): the catalogue's pieces (N243's data, data/ideas.json: N219's, N242's and N243's shops, 230 and more) fetched once,
   when Ideas first opens or a kept piece needs one, into HCAT and + Add's list: not in the page, so a first visit doesn't carry them */
let IXD = null;
function ixData() {
  return IXD || (IXD = fetch("data/ideas.json").then(r => r.ok ? r.json() : null).then(j => { if (j && j.v >= 1) ixLoad(j); return j && j.v >= 1 ? j : null; }).catch(() => null));
}
function ixLoad(j) {
  if (Array.isArray(j.places)) HPL = j.places;   // N286's places (v2)
  for (const [key, k, look, n, shop, w, d, h, p, url, m, m2, c] of j.pieces || []) { if (HCAT[key] || k === "idea" || !HCAT_KINDS[k] && !/^(gtable|gchair|gsofa)$/.test(k)) continue;
    HCAT[key] = { n, k, w, d, h: Math.max(h, k === "rug" ? 0.6 : 1), ref: key, src: `${shop}, ${n}`, shop, p, url, b: hcMake(k, look, m, m2, c) }; HCAT_ADD.push(key); }
}
function ixOpen(room) {   // the pill: the room's set-ups (made once a visit), the first idea shown at once, its card
  if (!DS() || !R.HOUSE3) { toast("One moment: the plan's still loading"); return; }
  if (!IXD) { toast("Loading the shops' pieces…"); ixData().then(() => ixOpen(room)); return; }   // N245: the catalogue first (then as before, without it if the fetch failed)
  if (!(ixOn() && ASIDE.ix === room && IX.room === room)) {
    if (ASIDE) lookMine(); IX.p = "ix" + Math.random().toString(36).slice(2, 6); IX.room = room; IX.k = 0; IX.fit = null; IX.L = ixSetups(room);
    ixShow(room, IX.L.length > 1 ? 1 : 0); if (!ixOn()) return; toast(IX.L.length > 1 ? `${IX.L[IX.i].n} · ‹ › for more` : "No set-ups fit here: + Add"); }
  openAct("ix:" + room, [stage.clientWidth / 2, stage.clientHeight * 0.3]);
}
function ixNow(room) {   // what the set-up shown has in the room now: its pieces and rough cost
  let n = 0, lo = 0, hi = 0; const put = (c, k = 1) => { n += k; lo += (c || [0, 0])[0]; hi += (c || [0, 0])[1]; };
  for (const q of ideaVals(room)) { const [id, key] = q.split(":"), I = IDEAS().find(i => i.id === id && i.room === room); if (I) put(ideaCost(I, key), key && !I.each ? 1 : I.parts.length); }
  for (const v of Object.values(DS() ? DS().rows("edits") || {} : {})) if (v && v.field === "add" && v.room === room && ixMine(v.item) && HCAT[v.value]) put(upCat(v.value, HCAT[v.value]));
  return { n, lo: Math.round(lo), hi: Math.round(hi) };
}
function ixCard(room) {   // "Records wall · 4 pieces · £320–480": ‹ ›, Keep this, a chip a set-up and + Add storage
  if (!ixOn() || ASIDE.ix !== room || !IX.L) return null; const s = IX.L[IX.i], t = ixNow(room), nx = ixAddWhat(room);
  const line = `${s.n} · ${t.n ? `${t.n} piece${t.n === 1 ? "" : "s"}${t.hi ? " · " + upRange(t.lo, t.hi) : ""}` : "as planned"}`;
  return [`Ideas · ${roomName(room)}`, line, [...hcNav(room, IX.i, "ixset"), btn("Keep this", { ixkeep: room }, true), btn("Back to mine", { lookmine: "1" })], null,
    // N284: one element (renderAct puts in the tray's first and removes .r3d-fin): the why inside it, or the chips and + Add storage were lost
    `<div class="r3d-fin">` + (s.why ? `<p class="r3d-ixwhy"><b>${s.why}.</b>${ixNotes(s).map(t => `<span>${t}</span>`).join("")}</p>` : "")
    + `<div class="r3d-finsc" role="group" aria-label="Set-ups">${IX.L.map((q, j) => `<button type="button" data-ixset="${room}:${j}" aria-pressed="${j === IX.i}">${q.n}</button>`).join("")}`
    + (nx ? `<button type="button" data-ixadd="${room}" aria-pressed="false">+ Add ${nx}</button>` : "")
    + (s.pal ? `<button type="button" data-ixcol="${room}" aria-pressed="${IX.col}">Its colours</button>` : "") + `</div></div>`];
}
function ixFits(k, row) {   // its kind's pieces that stand where it does (their middle within 60 cm), clear of the rest; kept while its card is
  const kind = HCAT[row.value].k; if (IX.fit && IX.fit.k === k && IX.fit.kind === kind && IX.fit.L.includes(row.value)) return IX.fit.L;
  const b = pieceBox(k), c = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2];
  const L = ixCands(kind, null, new Set(), row.room).filter(q => q === row.value || ixAt(row.room, q, c[0], c[1], +row.y, k, [], null, 60));
  IX.fit = { k, kind, L }; return L;
}
function ixPieceCard(k) {   // the house piece's card for a set-up's piece: ‹ › what fits its spot, its size, fit, price and shop, its page
  const ds = DS(), row = ds && ds.rows("edits")[k + "~add"], C = row && HCAT[row.value]; if (!C) return null;
  const L = ixFits(k, row), i = Math.max(0, L.indexOf(row.value));
  const pb = pieceBox(k), pl = placeAt(row.room, (pb[0] + pb[3]) / 2, (pb[2] + pb[5]) / 2, C.k), cl = (DZ[C.k] || [0])[0];   // N287: the place it's in
  return [C.n, (pl ? `${pl.n}${cl && pl.clr ? ` · ${Math.min(pl.clr, cl)} cm to open it` : ""} · ` : "") + hcLine(k, C), [...hcNav(k, i, "ixgo"), btn("Keep it", { actopen: "ix:" + row.room }, true), btn("Move or resize", { actopen: "hsize:" + k }), btn("Remove", { hremove: k })], null,
    `<div class="r3d-fin">${hcShopTray(k, L, C, "ixgo")}</div>`];
}
function ixKeep(room) {   // Keep this: the set-up as one of Your looks (her colours and pieces with it), to hold and compare from hers
  const name = `${IX.L[IX.i].n}, ${roomName(room)}`.slice(0, 24), L = finSchemes().filter(x => x.name !== name); L.push(Object.assign({ name }, lookNow()));
  try { localStorage.setItem(FSK, JSON.stringify(L.slice(-LOOK_MAX))); } catch (e) { toast("That didn't save: this device is full"); return; }
  finSchDraw(); toast(`Kept in Your looks: ${name}`);
}
function ixAdd(room) {   // + Add storage: the room's nearest storage idea not shown (the plan's), else a storage piece in the nearest free spot
  const r = H3R(room), ds = DS(), cam = [-camera.position.x / M, camera.position.z / M], far = b => Math.hypot((b[0] + b[3]) / 2 - cam[0], (b[2] + b[5]) / 2 - cam[1]);
  const vals = ideaVals(room).map(q => q.split(":")), off = ideasIn(room).filter(I => I.parts.length && !vals.some(([id]) => id === I.id)).sort((a, b) => far(a.parts[0].b) - far(b.parts[0].b));
  if (off.length) { const ids = Object.fromEntries(vals.map(([id, k]) => [id, k || ""])); ids[off[0].id] = ""; ideaKeep(room, ids); toast(`${off[0].n}: added`); return true; }
  const nx = ixNext(room); if (!nx) { toast("Nothing more belongs here"); return false; }
  const [q, sp, n] = nx, id = `add.${IX.p}${IX.n++}`; IX.k += n + 1; ds.put("edits", id + "~add", { item: id, field: "add", value: q, room, x: cmR(sp[0]), z: cmR(sp[1]), y: r[4] });
  toast(`${HCAT[q].n}${HCAT[q].shop ? " · " + HCAT[q].shop : ""} · ${sp[5] ? sp[5].n.replace(/^The /, "the ") : "added"}`); return true;
}
function ixAddWhat(room) {   // what + Add adds next: the room's storage idea not shown, else a piece in a free place that takes it, else nothing
  const vals = ideaVals(room).map(q => q.split(":")[0]), off = ideasIn(room).find(I => I.parts.length && !vals.includes(I.id));
  if (off) return off.n.charAt(0).toLowerCase() + off.n.slice(1); const nx = ixNext(room); return nx ? IX_A[HCAT[nx[0]].k] || HCAT[nx[0]].n.toLowerCase() : "";
}
const IX_A = { shelves: "shelves", chest: "a chest of drawers", shoes: "a shoe rack", wardrobe: "a wardrobe", unit: "a unit", gsofa: "a garden seat", gtable: "a garden table", gchair: "a garden chair" };
function ixNext(room) {   // N287: + Add's next piece, [key, spot, n] in a free place that takes it (the next kind each press), or null
  const r = H3R(room), cam = [-camera.position.x / M, camera.position.z / M], KS = room === "garden" ? IX_YARD : IX_STORE;
  for (let n = 0; n < KS.length; n++) { const kind = KS[(IX.k + n) % KS.length];
    for (const q of ixCands(kind, null, new Set(), room).slice(0, 8)) { const sp = ixSpot(room, q, cam[0], cam[1], r[4], null); if (sp) return [q, sp, n]; } }
  return null;
}
qs("#r3d-ideas")?.addEventListener("click", () => { const rm = ixRoom(); if (rm) ixOpen(rm); });
if (act) act.addEventListener("click", e => {   // the cards' own buttons (before 16_cards' handler)
  const b = e.target.closest("[data-ixset],[data-ixadd],[data-ixkeep],[data-ixgo],[data-ixcol]"); if (!b || performance.now() - actAt < 350) return; e.stopPropagation(); const d = b.dataset;
  if (d.ixset) { const [room, x] = d.ixset.split(":"), n = (IX.L || []).length; if (!n || !ixOn()) return; ixShow(room, ((+x % n) + n) % n); GS.actId = "ix:" + room; renderAct(); return; }
  if (d.ixadd) { if (ixOn()) ixAdd(d.ixadd); renderAct(); return; }
  if (d.ixcol) { if (!ixOn()) return; IX.col = !IX.col; ixShow(d.ixcol, IX.i); GS.actId = "ix:" + d.ixcol; renderAct(); return; }   // N282: its colours or hers
  if (d.ixkeep) { if (ixOn()) ixKeep(d.ixkeep); return; }
  const [k, x] = d.ixgo.split(":"), ds = DS(), row = ds && ds.rows("edits")[k + "~add"]; if (!row) return;
  const L = ixFits(k, row), v = L[((+x % L.length) + L.length) % L.length], pb = pieceBox(k), sp = ixAt(row.room, v, (pb[0] + pb[3]) / 2, (pb[2] + pb[5]) / 2, +row.y, k, [], null, 60);
  ds.put("edits", k + "~add", Object.assign({}, row, { value: v }, sp ? { x: cmR(sp[0]), z: cmR(sp[1]) } : {})).then(() => { if (GS.actId) renderAct(); });
}, true);
