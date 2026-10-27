"""V1 (Phase 6): the media wall as a project the app reads: projects/<id>.json.

python3 export_project.py [out.json]

A project is: where it is (the room), what it costs, its places and pieces (each with its time, who, cost, tasks with their how, what to
buy and what to check first), the buy list, the plan's phases and the options to look at (one line each: the core-plan rule). The ids are
the old page's, so a tick keeps its meaning: buy rows "t…" (build_viewer.track_rows), tasks "<piece>:<step>:<n>" (pieces.tasks).
The words are the plan's own (build_doc, chapters, pieces, ideas, fit); this only reshapes them."""
import html, json, pathlib, re, sys
import build_doc as B
import build_viewer as V
import pieces as P
import ideas
import fit

HERE = pathlib.Path(__file__).parent


V13 = {"drawers": "art_drawers_mint", "join_clean": "art_join_mint", "join_key_scene": "key_join", "side": "art_side_mint",
       "dining_four": "art_four_mint", "dining_six": "art_six_mint"}   # the drawn renders' pictures in art/ (make_images)


def pic_of(name):
    stem = re.sub(r"^render_v\d+_", "", pathlib.Path(name).stem)
    return "media-wall/src/art/" + V13.get(stem, stem) + ".webp"


def plain(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", str(s)))).strip()


def project():
    rows = V.track_rows()
    buy = [dict(id=r["id"], phase=r["phase"], item=V._short_item(r["item"]), detail=plain(r["item"]), qty=r["qty"], lo=r["lo"], hi=r["hi"])
           for r in rows if r["kind"] == "buy"]
    jobs = [dict(id=r["id"], phase=r["phase"], item=plain(r["item"])) for r in rows if r["kind"] == "job"]
    buyof = lambda pre: [b["id"] for b in buy if any(b["detail"].startswith(x) for x in pre)]
    places = []
    ntasks = 0
    for pid, name, ps in P.by_place():
        pcs = []
        for p in ps:
            ids = buyof(p["buy"])
            lo = sum(b["lo"] for b in buy if b["id"] in ids); hi = sum(b["hi"] for b in buy if b["id"] in ids)
            tasks = [dict(id=tid, title=plain(t), how=[plain(x) for x in items]) for tid, t, items, _n in P.tasks(p)]
            ntasks += len(tasks)
            pcs.append(dict(key=p["key"], title=p["title"], what=p["what"], time=p["time"], who=p["who"], cost=[lo, hi], buy=ids,
                            tasks=tasks, need=P.NEEDS.get(p["key"]), job=bool(p.get("job")),
                            checks=[dict(item=plain(i), space=plain(s), spare=plain(sp)) for i, s, sp in P.checks(p["key"])],
                            pic=pic_of(p["pic"]) if p.get("pic") else None))
        places.append(dict(id=pid, name=name, pieces=pcs))
    phases = []
    for ph in B.PHASES:
        lo = sum(r[4] for r in B.TRACK if r[2] == ph and r[4] is not None)
        hi = sum(r[5] for r in B.TRACK if r[2] == ph and r[5] is not None)
        phases.append(dict(name=re.sub(r"^\d+\s+", "", ph), n=int(ph.split()[0]), lo=lo, hi=hi, biggest=plain(B.BIGGEST.get(ph, ""))))
    c = fit.counts()
    tl = sum(p["lo"] for p in phases); th = sum(p["hi"] for p in phases)
    opts = [dict(key=k, name=n, size=sz, lo=cost[0], hi=cost[1], where=plain(where)) for k, n, sz, cost, _why, where in ideas.SUGGEST]
    return dict(id="media-wall", name="The media wall", room="living", version=B.LABEL, cost=[tl, th],
                what="The artisan oak media wall in the alcove, the compact dining cabinet by the stairs, the PC side wall, in your pale mint.",
                fit=dict(fits=c[fit.PASS], tight=c[fit.TIGHT], check=c[fit.CHECK], no=c[fit.NO]),
                files=[dict(name="The plan (PDF)", href=f"media-wall/out/{B.PDF_NAME}"), dict(name="The build guide (PDF)", href=f"media-wall/out/{B.GUIDE_NAME}"),
                       dict(name="The plan, phone edition", href=f"media-wall/out/{B.PDF_NAME.replace('.pdf', '_phone.pdf')}"),
                       dict(name="The build guide, phone edition", href=f"media-wall/out/{B.GUIDE_NAME.replace('.pdf', '_phone.pdf')}"),
                       dict(name="The full media wall page", href="plan.html")],
                places=places, tasks=ntasks, buy=buy, jobs=jobs, phases=phases, options=opts,
                moments=[dict(k=k, name=n) for k, n in (("dinner", "Dinner for six"), ("film", "Film night"), ("four", "Lunch for four"), ("morning", "Morning"), ("games", "Games night"), ("drinks", "Drinks"))])


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parents[1] / "_site/data/projects/media-wall.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    pj = project()
    out.write_text(json.dumps(pj, ensure_ascii=False, separators=(",", ":")))
    print(f"project {pj['id']}: {sum(len(p['pieces']) for p in pj['places'])} pieces, {pj['tasks']} tasks, {len(pj['buy'])} to buy, "
          f"£{pj['cost'][0]:,}–{pj['cost'][1]:,}, {out.stat().st_size // 1024} KB")
