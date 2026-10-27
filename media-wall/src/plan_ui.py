"""v33, from the design review (UPGRADE_PLAN_v33.md, "Design review of v32"), the client: "Happy with upgrade plan, please perform it".
The plan page's new parts, as data and markup for build_viewer.py; page.js runs them:
- one count: the things to buy (65), the 13 steps and the open choices, the same in Plan and Buy (the jobs counted apart);
- the Plan home's "Waiting on you", "Checks on site" (the fit proof's CHECK rows) and "Where the money goes" (costs.overview);
- Decide: the open choices, one per screen, with the renders already made, kept for both of you; the buy list follows the pick;
- the ideas shortlist: "+ Add to plan" on each idea and suggestion, a running +£ and the plan's new total;
- build day: a step as a phone screen, its room, its tasks to tick, its tools, its parts, Done.
Every number comes from geometry, fit, ideas, costs or the buy list."""
import html
import json

import geometry as G
import fit
import ideas as I


def _m(lo, hi):
    f = lambda v: f"{v:,.0f}" if float(v).is_integer() else f"{v:,.2f}"
    return f"£{f(lo)}" if lo == hi else f"£{f(lo)}–{f(hi).lstrip('£')}"


def decisions():
    """The four open choices (HANDOFF, "Waiting on the client"). Each option: v, label, note, art (a still), r3d (shown in the room),
    cost (what it adds to the plan: lo, hi)."""
    C, C8, B = G.CAB, G.CAB80, G.BESIDE
    base = {"site": "C", "dining": "folded", "tdoor": False, "chairs": "cupboard", "scene": "bright"}
    beside = dict(key="beside", title="What goes beside the cabinet", q=f"{B['len']:.0f} cm of wall between the cabinet and the pipe boxing",
                  options=[dict(v="clear", label="Leave it clear", note="The plan: the open door's landing, and a breathing space", art="3d_c_folded", r3d=dict(base, beside="clear", view="beside"), cost=[0, 0]),
                           dict(v="mirror", label="A tall mirror", note=f"IKEA NISSEDAL, {B['mirror']['w']:g} × {B['mirror']['h']:g}, black, £25: more light, no floor", art="3d_beside_mirror", r3d=dict(base, beside="mirror", view="beside"), cost=[25, 25]),
                           dict(v="trolley", label="A slim trolley", note=f"VASAGLE, {B['trolley']['w']:g} × {B['trolley']['d']:g} × {B['trolley']['h']:g}, £35.99: wheels out to the table", art="3d_beside_trolley", r3d=dict(base, beside="trolley", view="beside"), cost=[35.99, 35.99]),
                           dict(v="dresser", label="A low oak shelf", note=f"In the cabinet's ply, {B['dresser']['w']:g} × {B['dresser']['d']:g} × {B['dresser']['h']:g}: plates, glasses, bottles", art="3d_beside_dresser", r3d=dict(base, beside="dresser", view="beside"), cost=[40, 80])],
                  default="clear", buy="The beside piece goes on the buy list under the dining wall")
    six = dict(base, dining="six", view="dining")
    width = dict(key="cabw", title="The table: 90 or 80 wide",
                 q=f"80 makes the cabinet {C['len'] - C8['len']:.0f} shorter, but four chairs go inside, not six",
                 options=[dict(v="90", label=f"{C['top'][0]:g} wide (the plan)", note=f"{C['len']:.1f} long, six chairs inside, {C['top'][0] - 54:g} down the middle for dishes", art="3d_c_six", r3d=dict(six, cabw="90"), cost=[0, 0]),
                          dict(v="80", label=f"{C8['top'][0]:g} wide", note=f"{C8['len']:.1f} long, {C8['freed']:.1f} of wall back, four chairs inside, {C8['top'][0] - 54:g} down the middle", art="3d_c80_six", r3d=dict(six, cabw="80"), cost=[0, 0])],
                 default="90", buy="The dining wall's rows follow the width")
    switch = dict(key="switch", title="Where the light switch is", q="The scene button idea goes beside it; it's drawn on the chimney breast's side of the door frame",
                  options=[dict(v="breast", label="On the breast's side of the door", note="As drawn: the scene button goes just above it", art="3d_id_button", r3d={"view": "door"}, cost=[0, 0]),
                           dict(v="hinge", label="On the other side of the door", note="The hinge side: the button moves with it", r3d={"view": "door"}, cost=[0, 0]),
                           dict(v="check", label="We'll look and tell you", note="Nothing to buy changes", r3d={"view": "door"}, cost=[0, 0])],
                  default=None, buy="Nothing on the buy list changes")
    # v39: what goes beside the cabinet (the bar) and the table's width (90) are decided: they're the plan (geometry.FIRM). The one open
    # measurement is the side wall's socket, beside the record trays since the media wall swapped
    socket = dict(key="socket", title="The socket on the side wall", q="How far from the alcove's back wall, and how high? The record trays pull out beside it",
                  options=[dict(v="drawn", label="About 30 up, in front of the drawer", note="As drawn: the trays clear it", art="3d_wall_drawers", r3d={"view": "wall", "drawers": True}, cost=[0, 0]),
                           dict(v="measure", label="We'll measure it and tell you", note="Send the two numbers in your next message", r3d={"view": "wall", "drawers": True}, cost=[0, 0])],
                  default=None, buy="Nothing on the buy list changes")
    return [socket, switch]   # v33: the chairs are your padded ones, so the pads' colour went too


def shortlist():
    """Every idea and suggestion that can be added to the plan, by its card's key: name and cost."""
    out = {f"idea:{k}": dict(name=t, lo=c[0], hi=c[1]) for k, t, _s, c, *_ in I.IDEAS if c}
    out.update({f"sugg:{k}": dict(name=t, lo=c[0], hi=c[1]) for k, t, _s, c, *_ in I.SUGGEST if c})
    return out


STEP_ART = {1: ("3d_room", {"view": "room"}), 2: ("3d_pc_day", {"view": "pc"}), 3: ("3d_pc_lit", {"view": "pc", "pc": True}), 4: ("3d_window_bright", {"view": "window"}),
            5: ("3d_wall_film", {"view": "wall"}), 6: ("3d_wall_drawers", {"view": "wall", "drawers": True}), 7: ("3d_wall_film", {"view": "wall"}),
            8: ("3d_wall_drawers", {"view": "wall", "drawers": True}), 9: ("3d_sofa_cosy", {"view": "sofa"}), 10: ("3d_pc_day", {"view": "pc"}),
            11: ("3d_c_tdoor", {"showopen": "1"}), 12: ("3d_window_bright", {"view": "room", "scene": "bright"}), 13: ("3d_sofa_cosy", {"view": "sofa", "scene": "film"})}


def buildday(steps):
    """Each step as a phone screen: its tasks (the step's "do"), its tools, the buy list's phases it needs, its still and its room."""
    out = []
    for s in steps:
        art, r3d = STEP_ART.get(s["n"], ("3d_room", {"view": "room"}))
        out.append(dict(n=s["n"], title=s["title"], who=s["who"], time=s["time"], do=list(s["do"]), tools=list(s["tools"]), buy=list(s["buy"]),
                        art=art, r3d=r3d, watch="Watch it open" if "showopen" in r3d else "Show it in the room"))
    return out


def checks_html():
    """The fit proof's CHECK rows: the things to check on site."""
    rows = [(z[0], r[0], r[4]) for z in fit.firm_zones() for r in z[2] if r[-1] == fit.CHECK]
    lis = "".join(f'<li><b>{html.escape(item)}</b><span>{html.escape(left[0].upper() + left[1:])}</span></li>' for _zone, item, left in rows)
    return f'<ul class="checks">{lis}</ul>', len(rows)


def money_html(track):
    """Where the money goes: the cost overview's pieces as ranges on one scale, dearest first."""
    import costs
    ov = sorted(costs.overview(track), key=lambda p: -p[2])
    top = max(p[2] for p in ov)
    rows = "".join(f'<li><span class="mn">{html.escape(p)}</span><span class="mb"><i style="margin-left:{lo / top * 100:.1f}%;width:{max(1.2, (hi - lo) / top * 100):.1f}%"></i></span>'
                   f'<span class="mv">{_m(lo, hi)}</span></li>' for p, lo, hi, _items in ov)
    return f'<ul class="money">{rows}<li class="added" id="mo-added" hidden><span class="mn">Added by you</span><span class="mb"></span><span class="mv" id="mo-addv"></span></li></ul>'


def plan_home(ring, nbuy, nsteps):
    """The top of the Plan home: three rings (one count) and the three lists beside them."""
    chk, nchk = checks_html()
    return f"""<div class="next3" id="next3" aria-label="Your next three things"></div>
      <div class="rings rings3">{ring("build", 50, "tasks done", "build")}{ring("buy", 165, "things bought", "buy")}{ring("choice", 280, "choices made", "decide")}</div>
      <p class="caption" id="d-paid">£0 paid so far</p>
      <div class="home2">
        <section class="wait"><div class="sec-h"><h2>Waiting on you</h2><button type="button" class="btn" data-decide-open="0">Decide</button></div><ul class="waitl" id="waitl"></ul></section>
        <details class="fold mon"><summary>Where the money goes, by piece</summary>{{MONEY}}<p><a class="btn" href="#buy" data-go="buy">The buy list</a></p></details>
      </div>
      <details class="fold"><summary>Checks on site ({nchk}): the fit proof's “check” rows</summary>{chk}</details>"""


def overlays():
    """Decide and build day: full-screen cards over the page."""
    return """<div class="ov" id="decide" role="dialog" aria-modal="true" aria-labelledby="dc-h" hidden><div class="ovc">
  <div class="ovtop"><span class="ovn" id="dc-n"></span><button type="button" class="close" data-ov-close aria-label="Close"><span class="ms" aria-hidden="true">close</span></button></div>
  <h2 id="dc-h"></h2><p class="caption" id="dc-q"></p>
  <div class="dcopts" id="dc-opts" role="radiogroup" aria-labelledby="dc-h"></div>
  <p class="caption" id="dc-buy"></p>
  <div class="ovbar"><button type="button" class="btn" id="dc-prev">Back</button><button type="button" class="btn" id="dc-room"><span class="ms" aria-hidden="true">view_in_ar</span> Show it in the room</button><button type="button" class="btn primary" id="dc-next">Next</button></div>
</div></div>
<div class="ov" id="bday" role="dialog" aria-modal="true" aria-labelledby="bd-h" hidden><div class="ovc bdc">
  <div class="bdpic"><img id="bd-img" alt=""><button type="button" class="close" data-ov-close aria-label="Back to the build steps"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <button type="button" class="btn bdwatch" id="bd-watch"><span class="ms" aria-hidden="true">play_arrow</span> <span id="bd-watcht">Show it in the room</span></button></div>
  <div class="bdbody"><span class="ovn" id="bd-n"></span><h2 id="bd-h"></h2>
    <div class="bdbar" id="bd-bar" aria-hidden="true"></div>
    <ul class="bdtasks" id="bd-tasks"></ul>
    <span class="label">To hand for this step</span><div class="bdtools" id="bd-tools"></div></div>
  <div class="ovbar"><button type="button" class="btn" id="bd-parts"></button><button type="button" class="btn primary" id="bd-done"></button></div>
</div></div>"""
