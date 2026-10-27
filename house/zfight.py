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


def outside(ps):
    return [p for p in ps if (p[1][0], p[1][1]) in OUTER or "street" in (p[1][2], p[1][4])]


if __name__ == "__main__":
    ps = pairs()
    for a, key, eg in ps[:int(sys.argv[1]) if len(sys.argv) > 1 else 40]:
        print(f"{a:9.0f}", key, eg)
    print(len(ps), "pairs,", len(outside(ps)), "on the outside")
