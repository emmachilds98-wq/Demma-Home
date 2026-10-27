"""v39 (item 13, "fewer sheets to buy"): every ply part in the cutting list nested onto whole sheets, so the guide orders the fewest
boards and says what the offcuts are for. A shelf (guillotine) packer: parts sorted by their longer side, laid in strips along the
sheet's length, a 4 mm saw cut between them; a part may turn unless its grain shows (the oak-faced ply's faces)."""
import re

SHEET = (244.0, 122.0)        # a full 8 × 4 sheet, cm
SIZES = [SHEET, (122.0, 122.0), (122.0, 61.0)]   # full, half and quarter sheets, as most merchants sell them
KERF = 0.4
NUM = r"(\d+(?:\.\d+)?)"


def parse(size, qty):
    """'a × b · c × d' with qty '2 · 1' (or 'x · y, both × z') -> [(a, b, n), ...]; None if a row isn't flat panels."""
    m = re.match(rf"{NUM} · {NUM}, both × {NUM}", size)
    if m:
        a, b, z = map(float, m.groups())
        return [(a, z, 1), (b, z, 1)]
    sizes, qtys = [s.strip() for s in size.split(" · ")], [q.strip() for q in str(qty).split(" · ")]
    if len(qtys) == 1:
        qtys *= len(sizes)
    out = []
    for s, q in zip(sizes, qtys):
        m = re.match(rf"{NUM} × {NUM}", s)
        qn = re.match(r"(\d+)", q)
        if not m or not qn:
            return None
        out.append((float(m.group(1)), float(m.group(2)), int(qn.group(1))))
    return out


def pack(parts, turn=True, sheet=SHEET):
    """parts: [(name, L, W)] -> sheets: [[(name, x, y, l, w)]]; each part's long side along the sheet unless it can't fit."""
    L, W = sheet
    items = []
    for name, a, b in parts:
        l, w = (max(a, b), min(a, b)) if turn else (a, b)
        if l > L or w > W:
            if turn and w <= L and l <= W:
                l, w = w, l
            else:
                raise ValueError(f"{name} {a} × {b} is bigger than a sheet")
        items.append((name, l, w))
    items.sort(key=lambda p: (-p[2], -p[1]))
    sheets = []                                                 # each: {"strips": [[y, h, x_used]], "parts": []}
    for name, l, w in items:
        placed = False
        for s in sheets:
            for st in s["strips"]:
                if w <= st[1] and st[2] + l <= L:
                    s["parts"].append((name, st[2], st[0], l, w)); st[2] += l + KERF; placed = True; break
            if not placed:
                y = sum(st[1] + KERF for st in s["strips"])
                if y + w <= W:
                    s["strips"].append([y, w, l + KERF]); s["parts"].append((name, 0.0, y, l, w)); placed = True
            if placed:
                break
        if not placed:
            sheets.append({"strips": [[0.0, w, l + KERF]], "parts": [(name, 0.0, 0.0, l, w)]})
    return sheets


def offcuts(sheet, size=SHEET):
    """The usable pieces left: the strip ends and the band past the last strip (only those over 10 × 5)."""
    L, W = size
    out = [(L - st[2], st[1]) for st in sheet["strips"] if L - st[2] > 10 and st[1] > 5]
    y = sum(st[1] + KERF for st in sheet["strips"])
    if W - y > 5:
        out.append((L, W - y))
    return out


def svg(sheet, size=SHEET, scale=1.6):
    L, W = size
    r = [f'<svg viewBox="0 0 {L * scale + 2:.0f} {W * scale + 2:.0f}" width="100%" role="img" aria-label="Sheet layout">'
         f'<rect x="1" y="1" width="{L * scale:.1f}" height="{W * scale:.1f}" fill="#f4efe6" stroke="#8a7f70"/>']
    for name, x, y, l, w in sheet["parts"]:
        r.append(f'<rect x="{1 + x * scale:.1f}" y="{1 + y * scale:.1f}" width="{l * scale:.1f}" height="{w * scale:.1f}" fill="#d9b98c" stroke="#5a4632" stroke-width="0.8"/>')
        if l * scale > 40 and w * scale > 12:
            fs = min(11, w * scale * 0.45)
            r.append(f'<text x="{1 + (x + l / 2) * scale:.1f}" y="{1 + (y + w / 2) * scale + fs / 3:.1f}" font-size="{fs:.1f}" text-anchor="middle" fill="#2a2430">{name}</text>')
    r.append("</svg>")
    return "".join(r)
