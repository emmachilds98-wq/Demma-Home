async () => { const D = R3D._dbg, sl = ms => new Promise(r => setTimeout(r, ms)), M = 0.01, out = [];
  const at = () => { const c = D.camera.position; return [-c.x * 100, c.z * 100]; };
  const settle = async () => { await sl(300); for (let i = 0; i < 150 && D.flying; i++) await sl(200); await sl(300); };
  R3D.set({ view: "kitchen" }); await settle(); document.querySelector('[data-rmode="stand"]').click(); await settle();
  out.push("start " + at().map(Math.round) + " feet " + Math.round(D.WALK.feet ?? -1) + " " + D.S.view);
  for (const X of [400, 425, 445]) {
  // put at the foot of the lower flight
  D.camera.position.set(-X * M, (-260 + 160) * M, -60 * M); D.WALK.feet = -260; D.controls.target.set(-X * M, (-260 + 150) * M, 0); D.controls.update();
  let last = null;
  for (let i = 0; i < 200; i++) { const c = D.camera.position, dx = 0, dz = 1;
    D.controls.target.set(c.x, c.y - 0.05, c.z + 1); D.controls.update(); D.walkMove(0, 1, 0, 0.1);
    const a = at(); const s = a.map(Math.round).join(",") + " " + Math.round(D.WALK.feet);
    if (s === last) { out.push("X" + X + " stuck at " + s); const f = D.WALK.feet, x = a[0], z = a[1];
      for (const [h, r] of [[55,18],[105,18],[160,12]]) for (const dz2 of [0, 4, 8]) { const z2 = z + dz2, ff = Math.max(f, D.floorAtCm(x, z2, f));
        out.push(` h${h} dz${dz2} floor ${Math.round(D.floorAtCm(x, z2, f))} blocked ${D.bodyBlocked(x, ff, z2, [[h, r]])}`); }
      // which HSOLID part
      for (const [k, S_] of Object.entries(D.HSOLID)) { if (!S_.g) continue; const r = 18;
        for (const [h] of [[55],[105],[160]]) { const y = Math.max(f, D.floorAtCm(x, z + 6, f)) + h, zz = z + 6;
          for (const q of S_.wb) if (x > q[0] - r && x < q[3] + r && y > q[1] - r && y < q[4] + r && zz > q[2] - r && zz < q[5] + r) out.push(`box ${k} h${h} ${q.map(Math.round)}`);
          for (const P of S_.pb) { const [aa, uw] = P.axis === "x" ? [x, [zz, y]] : P.axis === "z" ? [zz, [x, y]] : [y, [x, zz]]; if (aa > P.a - r && aa < P.b + r) out.push(`prism? ${k} h${h} ${P.axis} ${Math.round(P.a)}..${Math.round(P.b)} m=${P.m} pts ${JSON.stringify(P.pts.map(q=>q.map(Math.round)))}`); } } }
      break; }
    last = s; }
  out.push("X" + X + " end " + last); }
  return out.filter((v, i, a) => a.indexOf(v) === i).slice(0, 80); }
