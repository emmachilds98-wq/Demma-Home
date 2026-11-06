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
  const big = LOWD ? 1024 : BIG_GPU ? 4096 : 2048;   // V1.11: a capable phone 2048   // v18: phones keep 1024 maps for the picture, and at most six spots cast shadows; v48: 4096 on a real card
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
  const [sw, sh] = LOWD ? [2560, 1440] : [3840, 2160];   // V1.11: a capable phone saves 4K too   // v18: phones save at 2560 × 1440 so the picture doesn't take the room down
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
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && shown(h.object) && !clippedAt(h) && h.object.material !== measMat);
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
  if (v) { goRoom(v[0]); if (window.DemmaTools) window.DemmaTools.close(); return; }   // V2.43: standing in it
  toast("Nothing by that name in the room");
}
qs("#r3d-find")?.addEventListener("focus", findList);
qs("#r3d-find")?.addEventListener("change", e => findGo(e.target.value));
qs("#r3d-find")?.addEventListener("keydown", e => { if (e.key === "Enter") findGo(e.target.value); });
qs("#r3d-findgo")?.addEventListener("click", () => findGo(qs("#r3d-find").value));

