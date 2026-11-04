/* ---------------------------------------------------------------- V1: the bridge to the app (Demma's Home), only with ?embed
   The app (the page around this frame) says where to look and what's being edited; this frame says what was tapped. Messages are
   {src: "demma", cmd, ...} in and {src: "r3d", type, ...} out. Taps in the house name a piece by its id (house/export_house.py's items);
   in the living room they name its own parts ("living:wall", "living:cab" ...). */
if (EMBED) {
  root.classList.add("embed");
  EMBH = (() => {
    const post = (type, d = {}) => { try { parent.postMessage(Object.assign({ src: "r3d", type }, d), "*"); } catch (e) {} };
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
        post("pick", { id: housePiece(hits, cut), room: roomAt(hits[0] && hits[0].point) });
        return true;
      }
      const id = pickItem(e);
      const h = ray.intersectObjects(scene.children, true).find(x => x.object.isMesh && shown(x.object) && !cut(x.point));
      post("pick", { id: id ? "living:" + id : null, room: roomAt(h && h.point) || "living" });
      return true;
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
        else if (d.cmd === "select") selPiece(d);
        else if (d.cmd === "edits") applyHEdits(d.edits || {});
        else if (d.cmd === "moment") { playMoment(d.k); syncButtons(); }
        else if (d.cmd === "panel") { root.classList.toggle("emb-panel", !!d.k); if (window.DemmaTools) d.k ? window.DemmaTools.open(d.k) : window.DemmaTools.close(); }
        else if (d.cmd === "living-edit") { root.classList.toggle("emb-edit", !!d.on); setEdit(!!d.on); }
        else if (d.cmd === "picture") { const [w, h] = LOWD ? [2560, 1440] : [3840, 2160]; post("picture", { url: still(d.w || w, d.h || h), name: stillName() }); }
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
