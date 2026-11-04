"""v65: flicker finder. Two faces in one plane, facing the same way and overlapping, flicker in the 3D room (the client: "fix any of the
houses flickering walls"). pairs() lists every such pair in model.export(); outside() keeps those a visitor can see from out there (on
the house's outside faces, the roof or the street). check_model.py fails on any outside pair; the rest sit inside walls and floors.

python3 house/zfight.py [n]   prints the n largest pairs"""
import collections, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import model as Mo

OUTER = {("x", -28.0), ("x", 482.0), ("z", -337.0), ("z", 499.0)}       # the house's outside faces


def _faces(ex):
    faces = collections.defaultdict(list)                     # (axis, plane, direction) -> [(material, group, rect)]
    add = lambda g, m, ax, p, d, r: faces[(ax, round(p, 1), d)].append((m, g, r))
    for g, F in ex.items():
        for m, lst in F["boxes"].items():
            for x0, y0, z0, x1, y1, z1 in lst:
                add(g, m, "x", x0, -1, (y0, y1, z0, z1)); add(g, m, "x", x1, 1, (y0, y1, z0, z1))
                add(g, m, "y", y0, -1, (x0, x1, z0, z1)); add(g, m, "y", y1, 1, (x0, x1, z0, z1))
                add(g, m, "z", z0, -1, (x0, x1, y0, y1)); add(g, m, "z", z1, 1, (x0, x1, y0, y1))
        for P in F["prisms"]:                                 # their straight edges only (along the axes)
            pts, a, b, ax = P["pts"], P["a"], P["b"], P["axis"]
            if ax == "y":                                     # V1.14: a plan shape raised (a chair's base): its top and bottom only
                us, vs = [p[0] for p in pts], [p[1] for p in pts]
                add(g, P["m"], "y", a, -1, (min(us), max(us), min(vs), max(vs))); add(g, P["m"], "y", b, 1, (min(us), max(us), min(vs), max(vs)))
                continue
            cu = sum(p[0] for p in pts) / len(pts); cv = sum(p[1] for p in pts) / len(pts)
            for (u1, v1), (u2, v2) in zip(pts, pts[1:] + pts[:1]):
                if abs(u1 - u2) < 0.05 and abs(v1 - v2) > 0.2:
                    lo, hi = sorted((v1, v2)); d = 1 if u1 > cu else -1
                    add(g, P["m"], "z", u1, d, (a, b, lo, hi)) if ax == "x" else add(g, P["m"], "x", u1, d, (lo, hi, a, b))
                elif abs(v1 - v2) < 0.05 and abs(u1 - u2) > 0.2:
                    lo, hi = sorted((u1, u2)); d = 1 if v1 > cv else -1
                    add(g, P["m"], "y", v1, d, (a, b, lo, hi)) if ax == "x" else add(g, P["m"], "y", v1, d, (lo, hi, a, b))
    return faces


def pairs(ex=None, min_area=20.0):
    ex = ex or Mo.export()["floors"]
    hits, eg = collections.Counter(), {}
    for k, L in _faces(ex).items():
        for i in range(len(L)):
            for j in range(i + 1, len(L)):
                (m1, g1, r1), (m2, g2, r2) = L[i], L[j]
                if m1 == m2:
                    continue
                a = max(0, min(r1[1], r2[1]) - max(r1[0], r2[0])) * max(0, min(r1[3], r2[3]) - max(r1[2], r2[2]))
                if a > min_area:
                    key = (k[0], k[1], g1, m1, g2, m2); hits[key] += a; eg.setdefault(key, (r1, r2))
    return [(a, key, eg[key]) for key, a in hits.most_common()]


def visible(ps, ex=None):
    """V1.31 (U6, docs/UPGRADE_REVIEW.md): the pairs a camera can see: a pair is hidden when the space just in front of its overlap is
    inside another box (a wall's two halves meeting, a skin behind a skirting); 3 × 3 points over the overlap, 0.5 cm in front"""
    ex = ex or Mo.export()["floors"]
    allb = [b for F in ex.values() for lst in F["boxes"].values() for b in lst]
    def solid(x, y, z):
        return any(b[0] < x < b[3] and b[1] < y < b[4] and b[2] < z < b[5] for b in allb)
    out = []
    for a, key, (r1, r2) in ps:
        ax, plane = key[0], key[1]
        lo1, hi1, lo2, hi2 = max(r1[0], r2[0]), min(r1[1], r2[1]), max(r1[2], r2[2]), min(r1[3], r2[3])
        seen = False
        for d in (-1, 1):                                    # either side (the pair faces one way, but which is in the key's faces)
            for u in (0.15, 0.5, 0.85):
                for v in (0.15, 0.5, 0.85):
                    s_, t_ = lo1 + (hi1 - lo1) * u, lo2 + (hi2 - lo2) * v
                    q = {"x": (plane + d * 0.5, s_, t_), "y": (s_, plane + d * 0.5, t_), "z": (s_, t_, plane + d * 0.5)}[ax]
                    if not solid(*q):
                        seen = True
        if seen:
            out.append((a, key, (r1, r2)))
    return out


def outside(ps):
    return [p for p in ps if (p[1][0], p[1][1]) in OUTER or "street" in (p[1][2], p[1][4])]


if __name__ == "__main__":
    ps = pairs()
    for a, key, eg in ps[:int(sys.argv[1]) if len(sys.argv) > 1 else 40]:
        print(f"{a:9.0f}", key, eg)
    vis = visible(ps)
    print("seen:"); [print(f"{a:9.0f}", key, eg) for a, key, eg in vis[:int(sys.argv[1]) if len(sys.argv) > 1 else 40]]
    rk = Mo.depth_rank(); tie = [v for v in vis if rk.get(v[1][3]) == rk.get(v[1][5])]
    print("seen and tied:"); [print(f"{a:9.0f}", key, eg) for a, key, eg in tie]
    print(len(ps), "pairs,", len(outside(ps)), "on the outside,", len(vis), "can be seen,", len(tie), "of them tied (they flicker)")
