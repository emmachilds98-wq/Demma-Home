/* N224 (REAL_PLAN section 29): the kitchen's units hers: their fronts' colour (S.fin.kitchen[92]), the handles' finish ([93]) and the
   worktop ([94]), from a tap on a unit, a handle or the worktop. The units and their handles are their own materials (house/model.py
   `kunit`, `khandle`: the bathroom's vanity and the fridge keep `gloss`), so a colour or finish is the material's own colour, metal and
   shine (no new shader); an oak front and the worktops swap the material's own maps, as the tiles do. Costed by the fronts counted and
   the worktop's run (fit.SOURCES n224units) */
const KIT_FRONTS = [["white", "White gloss", "#ebeae6", 0], ["cream", "Cream", "#e6dcc4", 53], ["sage", "Reed green", "#7f8d72", 53], ["navy", "Midnight navy", "#2e3a4e", 61],
  ["slate", "Slate grey", "#5c6166", 67], ["oakwood", "Oak effect", "#b8844f", 102]];   // key, name, colour, £ a door (B&Q GoodHome, a 500 × 715 front)
const KIT_HANDLES = [["black", "Matt black", "#151517", 0.0, 0.4], ["brass", "Brushed brass", "#b08d57", 0.85, 0.35], ["nickel", "Brushed nickel", "#a9a9a4", 0.85, 0.3], ["steel", "Stainless", "#c8cacc", 0.9, 0.22]];
const KIT_TOPS = [["black", "Black granite-effect", 95], ["oakwood", "Solid oak", 190], ["quartz", "White quartz-effect", 160], ["cement", "Cement-effect", 190]];   // £ a 3 m length
const KIT_HANDLE_P = [4, 10], KIT0 = new WeakMap(), KIT_TEX = {};
const kitOk = (room, k, v) => room === "bathroom" ? bathOk(room, k, v) : room === "kitchen" && ((k === 92 && KIT_FRONTS.some(([q]) => q === v)) || (k === 93 && KIT_HANDLES.some(([q]) => q === v)) || (k === 94 && KIT_TOPS.some(([q]) => q === v)));
const kitNow = () => ({ f: finGet("kitchen", 92) || slotPlan(92), h: finGet("kitchen", 93) || slotPlan(93), t: finGet("kitchen", 94) || slotPlan(94) });   // the plan's: 23_finish.js SLOTS
function kitAt(hit) { const m = hit && hit.object && hit.object.material, hk = m && !Array.isArray(m) && (m.userData || {}).hk; return hk === "kunit" || hk === "khandle" || hk === "worktop" ? { room: "kitchen", slot: 92 } : null; }
function kitCount() {   // [fronts, handles, the worktop's run in m] from the house file's kitchen boxes
  const H = R.HOUSE3 || {}, r = (H.rooms || {}).kitchen, F = r && (H.floors || {})[HCFK[String(r[4])]], B = (F && F.boxes) || {}, dims = b => [b[3] - b[0], b[4] - b[1], b[5] - b[2]].sort((p, q) => p - q);
  return [(B.kunit || []).filter(b => { const d = dims(b); return d[0] <= 2.2 && d[1] > 20; }).length, (B.khandle || []).length, (B.worktop || []).reduce((t, b) => t + dims(b)[2] / 100, 0)];
}
function kitUps(add) {   // Changes: new fronts a door each, the handles, the worktop by its 3 m lengths
  const q = kitNow(), [nf, nh, run] = kitCount(), f = KIT_FRONTS.find(([k]) => k === q.f), t = KIT_TOPS.find(([k]) => k === q.t), lens = Math.ceil(run / 3);
  if (q.f !== "white") add(`92=${q.f}`, `Unit fronts: ${f[1]}, ${nf}`, [nf * f[3], nf * f[3] * 1.2]);
  if (q.h !== "black") add(`93=${q.h}`, `Handles: ${upNm(KIT_HANDLES, q.h).toLowerCase()}, ${nh}`, KIT_HANDLE_P.map(p => p * nh));
  if (q.t !== "black") add(`94=${q.t}`, `Worktop: ${t[1].toLowerCase()}, ${run.toFixed(1)} m`, [lens * t[2], lens * t[2] * 1.5]);   // up to half again for joints, cut-outs and a fitter's day
}
function kitTex(k, hk) {   // the maps for an oak front or a worktop: the house's own photos (cloned, scaled to this material's metres) or a quartz drawn here
  const key = k + "." + hk; if (KIT_TEX[key]) return KIT_TEX[key];
  const own = houseTex(hk) || {}, size = (own.size || [1, 1])[0];
  if (k === "quartz") { const px = SMALL ? 256 : 512; let s = 77; const rn = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const map = canvasTex(px, px, (g, w, h) => { g.fillStyle = "#eeece6"; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 40; i++) { const c = 170 + rn() * 70 | 0; g.fillStyle = `rgba(${c},${c},${c - 6},${0.25 + rn() * 0.5})`; g.fillRect(rn() * w, rn() * h, 1 + rn() * 1.6, 1 + rn() * 1.6); } });
    map.repeat.set(size / 0.5, size / 0.5); return (KIT_TEX[key] = { map, rough: 0.25 }); }
  const T = houseTex(k === "cement" ? "concrete" : "oak"); if (!T || !T.map) return null; const rep = size / T.size[0];
  const cl = t => { if (!t) return null; const c = texClone(t); c.repeat.set(rep, rep); c.needsUpdate = true; return c; };
  return (KIT_TEX[key] = { map: cl(T.map), normalMap: cl(T.normal), roughnessMap: cl(T.rough), rough: k === "cement" ? 0.6 : 0.45 });
}
function kitSwap(m, T) {   // a material's maps swapped (only those it has: no new program), or its own back
  if (!m) return; if (!KIT0.has(m)) KIT0.set(m, { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: m.roughness, color: m.color.clone(), metalness: m.metalness });
  const o = KIT0.get(m); for (const f of ["map", "normalMap", "roughnessMap"]) if (o[f]) m[f] = T && T[f] ? T[f] : o[f];
  m.roughness = T && T.rough != null ? (o.roughnessMap && T.roughnessMap ? 1 : T.rough) : o.roughness;
}
function kitApply() {   // the units' colour (an oak front its photo), the handles' finish, the worktop
  if (!HMATS || !FIN.mat3) return; const q = finHeld ? { f: "white", h: "black", t: "black" } : kitNow(), U = HMATS.kunit || FIN.mat3("kunit"), Hd = HMATS.khandle || FIN.mat3("khandle"), W = HMATS.worktop || FIN.mat3("worktop");
  if (U) { kitSwap(U, q.f === "oakwood" ? kitTex("oakwood", "kunit") : null); const o = KIT0.get(U); if (q.f === "white" || q.f === "oakwood") U.color.copy(q.f === "oakwood" ? new THREE.Color("#ffffff") : o.color); else capWhite(U.color.set((KIT_FRONTS.find(([k]) => k === q.f) || [])[2])); }
  if (Hd) { kitSwap(Hd, null); const o = KIT0.get(Hd), h = KIT_HANDLES.find(([k]) => k === q.h); if (q.h === "black") { Hd.color.copy(o.color); Hd.metalness = o.metalness; Hd.roughness = o.roughness; } else { Hd.color.set(h[2]); Hd.metalness = h[3]; Hd.roughness = h[4]; } }
  if (W) kitSwap(W, q.t === "black" ? null : kitTex(q.t, "worktop"));
  dirty();
}
function kitSet(slot, v) {   // her choice (the plan's: none kept)
  finWrite("kitchen", { [slot]: v }); const q = kitNow();
  toast(`Kitchen: ${slot === 92 ? upNm(KIT_FRONTS, q.f).toLowerCase() + " fronts" : slot === 93 ? upNm(KIT_HANDLES, q.h).toLowerCase() + " handles" : upNm(KIT_TOPS, q.t).toLowerCase() + " worktop"}`);
}
function kitCard() {   // [title, now, buttons, -, the tray]: the fronts, the handles, the worktop; the splashback a tap away
  const q = kitNow(), plan = q.f === "white" && q.h === "black" && q.t === "black", L = roomUps("kitchen").filter(u => /^9[234]=/.test(u.k)), lo = L.reduce((a, u) => a + u.lo, 0), hi = L.reduce((a, u) => a + u.hi, 0);
  const st = plan ? "The plan's: white gloss, black handles, black worktop" : [`${upNm(KIT_FRONTS, q.f)}, ${upNm(KIT_HANDLES, q.h).toLowerCase()} handles, ${upNm(KIT_TOPS, q.t).toLowerCase()} worktop`, hi ? upRange(lo, hi) : ""].filter(Boolean).join(" · ");
  const bs = finButtons(!plan && ["The plan's", { kitplan: "1" }], "the units as planned", [btn("Splashback", { actopen: "fin:kitchen:90" })]);
  const topCol = { black: "#26282a", oakwood: "#b8844f", quartz: "#eeece6", cement: "#9c9a95" };
  return ["Kitchen: the units", st, bs, null, `<div class="r3d-fin">${finTray("Fronts", KIT_FRONTS.map(([k, t, c]) => finSwatch("kitf", k, t, c, q.f === k)).join(""))}`
    + finTray("Handles", KIT_HANDLES.map(([k, t, c]) => finSwatch("kith", k, t, c, q.h === k)).join(""))
    + finTray("Worktop", KIT_TOPS.map(([k, t]) => finSwatch("kitt", k, t, topCol[k], q.t === k)).join("")) + `</div>`];
}
cardOn("[data-kitf],[data-kith],[data-kitt],[data-kitplan]", id => id === "fin:kitchen:92", d => {   // N254: through the cards' router
  if (d.kitplan) { finWrite("kitchen", { 92: null, 93: null, 94: null }); toast("Kitchen: the plan's units"); }
  else if (d.kitf) kitSet(92, d.kitf); else if (d.kith) kitSet(93, d.kith); else kitSet(94, d.kitt); });
