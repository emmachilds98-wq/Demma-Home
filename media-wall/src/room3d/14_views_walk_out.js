/* N310, the client 27 Nov 2026: "make it possible to walk onto the drive and into back garden": Be there walks out of the front door onto
   the drive and the front lawn, down the alley's steps and out of the back door into the back garden. The ground out there is a floor to
   walk on (the drive's, the garden's and each alley step's tops, as 20_4 and garden3d draw them), its edges where our plot ends (no ground
   past them, so a walk stops), the fences and the low wall solid. Out of every room the view is Outside: the whole house drawn round you */
VIEWS.outside = { label: "Outside", eye: [385, 160, 700], at: [385, 150, 420], fov: STAND_FOV, box: [-120, 480, -245, 400, -2820, 1080] };
const OUTSIDE_V = "outside";
function outWalkSet() {                     // the outside's floors and solids, as hsolidSet's (room cm [x0, y0, z0, x1, y1, z1], the top y1)
  const H = R.HOUSE3; if (!H || HSOLID.outside || !houseG) return;
  const dr = H.drive ?? -15, lw = H.lawn ?? -260, zf = H.front, zb = H.back, hx1 = H.hall ? H.hall[1] : 482, gx0 = H.garage ? H.garage[0] : 0;
  const G = H.garden || { x: [-12, 479], length: 2500 }, gz1 = (R.WINDOW_Z - 30) - (G.length || 2500) + 20;
  const ax0 = -120, ax1 = -28, zTop = 100, zBot = -180, N = 13, zab = R.WINDOW_Z - 30;
  const fl = [
    [ax0, dr - 6, zf - 30, hx1, dr, zf + 750],          // the front: the alley's end, the strip, the drive, the lawn, the pavement (to the road's kerb)
    [ax0, dr - 6, zTop, ax1, dr, zf],                   // the alley, level along the house's end
    [ax0, lw - 4, gz1, G.x[1], lw, zb + 2],             // the back garden, the alley's foot to the far fence
    [ax0, lw - 4, zab - 2, ax1, lw, zBot + 2],          // the alley's foot, by the back of the house
  ];
  for (let i = 0; i < N; i++) { const za = zTop - (zTop - zBot) * i / N, zz = zTop - (zTop - zBot) * (i + 1) / N, y = dr - (dr - lw) * (i + 1) / N;
    fl.push([ax0, y - 4, zz, ax1, y, za]); }           // the alley's steps down
  const gw = hx1 - 12, b = [
    [gw, dr - 1, zf, gw + 12, dr + 40, zf + 550],       // the front lawn's low brick wall (on our side of the line)
    [ax0 - 6, dr - 300, gz1 - 10, ax0, dr + 200, zf + 750],   // the alley's fence, our east edge
    [G.x[1], lw - 4, gz1 - 10, G.x[1] + 6, lw + 180, zb],     // the west fence (next door's garden past it)
    [ax0, lw - 4, gz1 - 10, G.x[1], lw + 180, gz1],     // the far fence
  ];
  HSOLID.outside = { b: b.concat(fl), w: b, p: [], pw: [], wb: b, fl, pb: [], g: houseG }; hLast = null;
}
/* outside the house's walls (the eye's plan point clear of every room, and of the house's outline): Outside's view */
function outHere(x, feet, z) {
  const H = R.HOUSE3; if (!H) return false;
  return x < -28 || x > (H.hall ? H.hall[1] : 482) + 2 || z > H.front - 22 || z < H.back - 2;
}
