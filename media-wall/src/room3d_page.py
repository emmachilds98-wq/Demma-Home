"""v14: the 3D room's piece of the plan page: its controls, its data and its script (room3d.js), plus a standalone copy for
the headless stills (shot3d.py). Three.js comes from jsDelivr, pinned."""
import html, json, pathlib
import scenes
import ideas
import render as R
import geometry as G

HERE = pathlib.Path(__file__).parent
THREE = "https://cdn.jsdelivr.net/npm/three@0.160.0/"
IMPORTMAP = ('<script type="importmap">' + json.dumps({"imports": {"three": THREE + "build/three.module.js",
                                                                   "three/addons/": THREE + "examples/jsm/"}}) + "</script>")

VIEWS = [("room", "The whole room"), ("house", "The whole house"), ("kitchen", "The kitchen"), ("office", "The office"), ("bed2", "Music room"), ("master", "Master bedroom"), ("bath", "Bathroom"), ("windowwall", "Out of the window"), ("window", "From the window"), ("wall", "The media wall"), ("sofa", "From the sofa"), ("door", "From the door"),
         ("stairs", "From the stairs"), ("dining", "The dining cabinet"), ("chairs", "Where the chairs live"), ("sit", "Sitting at the table"),
         ("beside", "Beside the cabinet"), ("breast", "The chimney breast"),
         ("pc", "The PC side wall"), ("plan", "Bird’s eye"), ("doll", "Dolls’ house")]   # v21: the whole room first; v31: sitting down, beside the cabinet

CSS = """
/* v25 (Demma, option 1c): the room is the home screen, full screen; one Tools pill holds every control; numbered stickers sit on
   the room. Tokens come from build_viewer's STYLE (with fallbacks here, for the standalone page the stills use). */
.r3d { --cream: #fbf6ec; --ink: #2b2638; --mut: #645d73; --soft: #f1ebde; --shade: 0 14px 34px -12px #000a;
  --spring: cubic-bezier(.3,1.6,.5,1); font-family: Figtree, system-ui, sans-serif; }
.r3d-stage { position: fixed; inset: 0; height: 100vh; height: 100dvh; background: #0c0a10; overflow: hidden; z-index: 0; }
.r3d-stage canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; outline: none; }
.r3d-stage canvas:active { cursor: grabbing; }
.r3d-msg { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: #f4efe6; font-size: 15px; text-shadow: 0 1px 4px #000; }
.r3d-msg a { color: oklch(0.9 0.08 70); }
.r3d-msg[hidden] { display: none; }
.r3d-poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .75; pointer-events: none; }
.r3d.ready .r3d-poster, .r3d-poster:not([src]) { display: none; }
.sr-only { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ms { font-family: "Material Symbols Rounded"; font-weight: normal; font-style: normal; font-size: 22px; line-height: 1; display: inline-block;
  font-variation-settings: "FILL" 1, "wght" 500; -webkit-font-smoothing: antialiased; text-transform: none; letter-spacing: 0; white-space: nowrap; direction: ltr; }
/* the stickers on the room and the popover under the one you tap */
.r3d-stickers { position: absolute; inset: 0; pointer-events: none; }
.stk { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%) rotate(var(--tilt, -2deg)); pointer-events: auto; display: inline-flex; align-items: center; gap: 8px;
  border: 0; border-radius: 999px; padding: 6px 14px 6px 6px; background: oklch(0.92 0.06 var(--h)); color: var(--ink); font: 600 14px Fredoka, system-ui, sans-serif;
  box-shadow: var(--shade); cursor: pointer; transition: opacity .25s, transform .3s var(--spring); min-height: 44px; }
.stk b { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: oklch(0.8 0.11 var(--h)); font-weight: 600; }
.stk:hover, .stk[aria-expanded=true] { transform: translate(-50%, -50%) rotate(0deg) scale(1.06); }
.stk.behind { opacity: .35; }
.stk[hidden] { display: none; }
.r3d.editing .r3d-stickers, .r3d.nogl .r3d-stickers { display: none; }
.r3d-pop { position: absolute; width: 290px; background: var(--cream); color: var(--ink); border-radius: 24px; padding: 16px 16px 14px; box-shadow: var(--shade); z-index: 6; }
.r3d-pop[hidden] { display: none; }
.r3d-pop::before { content: ""; position: absolute; top: -7px; left: var(--ax, 50%); width: 16px; height: 16px; background: var(--cream); transform: translateX(-50%) rotate(45deg); border-radius: 3px; }
.r3d-pop h3 { margin: 0 34px 8px 0; font: 600 19px Fredoka, system-ui, sans-serif; }
.r3d-pop .facts { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; padding: 0; list-style: none; }
.r3d-pop .facts li { background: oklch(0.92 0.06 var(--h)); border-radius: 999px; padding: 5px 11px; font-size: 13px; font-weight: 600; }
.r3d-pcs { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 6px; }
.r3d-pcs button { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto 20px; gap: 8px; align-items: center; min-height: 44px; padding: 6px 8px 6px 14px; border: 0; border-radius: 14px; background: oklch(0.95 0.04 var(--h)); color: var(--ink); font: 600 14.5px Figtree, system-ui, sans-serif; text-align: left; cursor: pointer; }
.r3d-pcs small { font-weight: 500; color: var(--mut); white-space: nowrap; }
.r3d-pcs .ms { font-size: 20px; }
.r3d-pop .acts { display: flex; gap: 8px; }
.r3d-pop .acts button { flex: 1; min-height: 44px; border: 0; border-radius: 999px; font: 600 14px Fredoka, system-ui, sans-serif; cursor: pointer; background: var(--soft); color: var(--ink); }
.r3d-pop .acts button.go { background: oklch(0.8 0.11 var(--h)); }
.r3d-pop .x { position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--soft); color: var(--ink); cursor: pointer; display: grid; place-items: center; }
/* v30: the card for an item you tap in the room: what it is, how it is now, and its controls */
.r3d-act { width: 300px; --h: 50; }
.r3d-act .st { margin: -2px 34px 12px 0; font-size: 13.5px; color: var(--mut); }
.r3d-act .acts { flex-wrap: wrap; }
.r3d-act .acts button { flex: 1 1 calc(50% - 4px); padding: 0 12px; }
.r3d-act .acts button[aria-pressed=true] { background: var(--ink); color: var(--cream); }
.r3d-act .acts { max-height: min(56vh, 420px); overflow-y: auto; }
.r3d-act .acts button.sm { flex: 1 1 calc(33.3% - 6px); }
.r3d-act .acts button.q { flex: 1 1 calc(25% - 6px); padding: 0; font-size: 18px; }
.r3d-actsep { flex: 1 1 100%; margin: 6px 0 -2px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--mut); }
.r3d-act.above::before { top: auto; bottom: -7px; }
.r3d.editing .r3d-act { display: none; }
/* the tools and their panel. v32, client: "make tools always appear in 3D view": the six buttons are always on the room, in a pill;
   tapping one opens its panel, tapping it again closes it */
.r3d-dock { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; gap: 10px; align-items: center; z-index: 30;
  padding: 6px 12px 4px; border-radius: 999px; background: color-mix(in oklab, var(--cream) 92%, transparent); box-shadow: var(--shade); }
.r3d-toolsbtn { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 22px 0 16px; border: 0; border-radius: 999px; background: var(--cream); color: var(--ink);
  font: 600 17px Fredoka, system-ui, sans-serif; box-shadow: var(--shade); cursor: pointer; transition: transform .3s var(--spring); }
.r3d-toolsbtn:hover { transform: scale(1.05); }
.r3d-bubbles { display: flex; gap: 8px; }
.r3d-toolsbtn { display: none; }
.r3d-bub { display: grid; justify-items: center; gap: 2px; width: 58px; padding: 0; border: 0; background: none; color: var(--ink); font: 600 11.5px Figtree, system-ui, sans-serif; cursor: pointer; }
.r3d-bub i { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: oklch(0.92 0.06 var(--h)); color: var(--ink); transition: transform .3s var(--spring), background .2s; font-style: normal; }
.r3d-bub:hover i { transform: translateY(-3px) scale(1.06); }
.r3d-bub[aria-selected=true] i, .r3d-bub[aria-pressed=true] i { background: oklch(0.8 0.11 var(--h)); }
.r3d-panel { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); width: min(430px, calc(100vw - 24px)); max-height: min(560px, calc(100dvh - 140px));
  display: flex; flex-direction: column; overflow: hidden; background: var(--cream); color: var(--ink); border-radius: 30px; box-shadow: var(--shade); z-index: 29; }
.r3d-panel[hidden] { display: none; }
/* v26: the title and the foot stay put; only the middle scrolls (and it starts at the top on every tab) */
.r3d-pscroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 0 18px 8px; scrollbar-width: thin; }
.r3d-panel h2 { position: sticky; top: 0; z-index: 2; margin: 0 -18px 2px; padding: 16px 60px 10px 18px; background: var(--cream); font: 600 20px Fredoka, system-ui, sans-serif; }
/* v26: the labels switch, top right of the room (left of the panel when it's docked on a laptop) */
.r3d-lbl { position: fixed; top: 16px; right: 16px; z-index: 31; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px 0 12px; border: 0; border-radius: 999px;
  background: var(--cream); color: var(--ink); font: 600 14px Fredoka, system-ui, sans-serif; box-shadow: var(--shade); cursor: pointer; transition: transform .3s var(--spring), right .3s; }
.r3d-lbl:hover { transform: scale(1.05); }
.r3d-lbl .ms { font-size: 20px; }
.r3d.nogl .r3d-lbl, .r3d.editing .r3d-lbl { display: none; }
@media (min-width: 900px) { .r3d.tools-open .r3d-lbl { right: calc(min(420px, 38vw) + 32px); } }
@media (max-width: 899px) { .r3d-lbl { top: 12px; right: 12px; min-height: 44px; }
  .stk { font-size: 12.5px; gap: 6px; padding: 4px 11px 4px 4px; min-height: 40px; white-space: nowrap; } .stk b { width: 28px; height: 28px; flex: none; } }
.r3d-px { position: absolute; top: 10px; right: 10px; z-index: 3; width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--soft); color: var(--ink); cursor: pointer; display: grid; place-items: center; }
.r3d-px:hover { background: #e9dfcc; }
.r3d-panel .r3d-gal { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.r3d-panel .r3d-gal figure { gap: 0; }
.r3d-panel .r3d-gal button { border: 0; border-radius: 14px; }
.r3d-panel .r3d-gal figcaption { display: none; }
.r3d-dpanel[hidden] { display: none; }
.r3d-dpanel { display: grid; gap: 14px; }
.r3d-ui .grp { display: grid; gap: 6px; min-width: 0; }
.r3d-ui .label { font: 600 13px Figtree, system-ui, sans-serif; color: var(--mut); }
.r3d-ui .seg { display: flex; flex-wrap: wrap; gap: 6px; }
.r3d-ui .seg button, .r3d-ui .chip, .r3d-ui .btn, .r3d-foot button { min-height: 40px; border: 0; border-radius: 999px; padding: 8px 14px; background: var(--soft); color: var(--ink);
  font: 500 14px Figtree, system-ui, sans-serif; cursor: pointer; transition: transform .25s var(--spring), background .2s; }
.r3d-ui .seg button:hover, .r3d-ui .chip:hover { transform: scale(1.04); }
.r3d-ui .seg button[aria-pressed=true], .r3d-ui .chip[aria-pressed=true] { background: var(--ink); color: var(--cream); }
.r3d-ui .btn.primary { background: oklch(0.8 0.11 235); color: var(--ink); font-weight: 700; }
.r3d-views { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.r3d-views .chip { background: oklch(0.92 0.06 235); text-align: left; }
.r3d-views .chip[aria-pressed=true] { background: oklch(0.8 0.11 235); color: var(--ink); font-weight: 700; }
.r3d-hint2, .r3d-ui .caption { font-size: 13px; color: var(--mut); }
.r3d-gal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.r3d-gal figure { margin: 0; }
.r3d-gal button { padding: 0; border: 0; border-radius: 14px; overflow: hidden; cursor: zoom-in; background: #0c0a10; display: block; width: 100%; }
.r3d-gal img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.r3d-gal figcaption { display: none; }
/* Lights: three big tiles, the time-of-day switch, the table rule, the sliders folded */
.r3d-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.r3d-top { margin: 4px 0 10px; }
.r3d-warm { accent-color: #e8a25a; background: linear-gradient(90deg, #ffbf86, #ffe2b8, #fff3e4); border-radius: 999px; }
.r3d-tiles button { display: grid; gap: 4px; justify-items: start; text-align: left; min-height: 96px; padding: 12px; border: 0; border-radius: 22px; background: oklch(0.94 0.07 95); color: var(--ink);
  cursor: pointer; transition: transform .3s var(--spring); font: 500 12.5px Figtree, system-ui, sans-serif; }
.r3d-tiles button .ms { font-size: 26px; }
.r3d-tiles button b { font: 600 17px Fredoka, system-ui, sans-serif; }
.r3d-tiles button[aria-pressed=true] { background: oklch(0.8 0.11 95); box-shadow: inset 0 0 0 2px var(--ink); }
.r3d-tiles button.adjusted b::after { content: " · adjusted"; font: 500 12px Figtree, system-ui, sans-serif; color: var(--mut); }
.r3d-tiles button:hover { transform: translateY(-2px); }
.r3d-boost { margin: 0; padding: 8px 12px; border-radius: 16px; background: oklch(0.92 0.06 50); font-size: 13.5px; }
.r3d-boost[hidden] { display: none; }
details.r3d-more > summary { cursor: pointer; font-weight: 600; font-size: 14px; padding: 6px 0; list-style: none; }
details.r3d-more > summary::before { content: "+ "; }
details.r3d-more[open] > summary::before { content: "– "; }
.r3d-lvs { display: grid; gap: 10px; }
.r3d-lv { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "lab out" "range range" "cols cols"; gap: 2px 10px; align-items: center; min-width: 0; }
.r3d-lv label { grid-area: lab; font-size: 13.5px; }
.r3d-lv input[type=range] { grid-area: range; width: 100%; accent-color: oklch(0.7 0.13 95); }
.r3d-lv output { grid-area: out; font-variant-numeric: tabular-nums; font-size: 13px; color: var(--mut); }
.r3d-lv .r3d-cols { grid-area: cols; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.r3d-lv .r3d-cols:empty { display: none; }
.r3d-ui input[type=color] { width: 40px; height: 32px; padding: 0; border: 0; border-radius: 10px; background: none; cursor: pointer; }
.r3d-master label { font-weight: 700; }
/* Look: the paints as round swatches */
.r3d-swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.r3d-swatches button, .r3d-swatches label { display: grid; justify-items: center; gap: 4px; width: 64px; border: 0; background: none; padding: 0; cursor: pointer; font: 500 12px Figtree, system-ui, sans-serif; color: var(--ink); text-align: center; }
.r3d-swatches i { width: 46px; height: 46px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 3px #fff8; transition: transform .3s var(--spring); }
.r3d-swatches button[aria-pressed=true] i { box-shadow: 0 0 0 3px var(--cream), 0 0 0 5px var(--ink); }
.r3d-swatches label i { position: relative; overflow: hidden; background: conic-gradient(oklch(0.8 0.11 25), oklch(0.8 0.11 95), oklch(0.8 0.11 165), oklch(0.8 0.11 235), oklch(0.8 0.11 300), oklch(0.8 0.11 25)); }
.r3d-swatches label input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.r3d-decrow { display: grid; gap: 4px; }
.r3d-anycol { display: inline-flex; align-items: center; gap: 8px; }
.r3d-anycol input { width: 28px; height: 24px; }
.r3d-decrow > span { font-size: 13px; color: var(--mut); font-weight: 600; }
.r3d-picklist { margin: 0; font-size: 14px; }
.r3d-cost { font-size: 13px; color: var(--mut); font-variant-numeric: tabular-nums; }
.r3d-foot { flex: none; display: flex; gap: 8px; justify-content: flex-end; margin: 0 18px; padding: 10px 0 14px; border-top: 2px dashed #e5dccb; flex-wrap: wrap; align-items: center; }
.r3d-foot .r3d-litst { margin-right: auto; font-size: 13px; color: var(--mut); }
.r3d.nogl .r3d-dock, .r3d.nogl .r3d-panel { display: none; }
/* Edit room: the bar, the add list and the selection panel over the canvas, as cream pills */
.r3d-edit { position: absolute; top: 84px; left: 50%; transform: translateX(-50%); width: min(760px, calc(100% - 24px)); display: grid; gap: 8px; justify-items: center; pointer-events: none; z-index: 5; }
.r3d-edit > * { pointer-events: auto; }
.r3d-edit button, .r3d-edit .chip { min-height: 40px; border: 0; border-radius: 999px; padding: 8px 14px; background: var(--soft); color: var(--ink); font: 500 14px Figtree, system-ui, sans-serif; cursor: pointer; }
.r3d-edit button[aria-pressed=true] { background: var(--ink); color: var(--cream); }
.r3d-edit button.primary { background: var(--ink); color: var(--cream); font-weight: 600; }
.r3d-edit button:disabled { opacity: .5; cursor: default; }
.r3d-editbar, .r3d-sel, .r3d-addlist { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; background: var(--cream); color: var(--ink); padding: 8px; border-radius: 26px; box-shadow: var(--shade); max-width: 100%; }
.r3d-editbar[hidden], .r3d-sel[hidden], .r3d-addlist[hidden], .r3d-sel [hidden], .r3d-share[hidden] { display: none; }
.r3d-hint { color: var(--mut); font-size: 12.5px; line-height: 1.3; max-width: 34em; }
.r3d-sel b { font: 600 16px Fredoka, system-ui, sans-serif; margin: 0 4px 0 8px; }
.r3d-sel label { font-size: 13px; display: inline-flex; gap: 6px; align-items: center; }
.r3d-sel .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
.r3d-wallpick { margin-bottom: 8px; } .r3d-wallpick .dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; vertical-align: -2px; background: var(--c, #2c5643); box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
.r3d-size { font-size: 12.5px; color: var(--mut); font-variant-numeric: tabular-nums; }
.r3d.editing canvas { cursor: pointer; }
@media (min-width: 900px) {
  .r3d-panel { left: auto; right: 16px; top: 16px; bottom: 104px; transform: none; width: min(420px, 38vw); max-height: none; }
}
@media (max-width: 899px) {
  .r3d-dock { left: 8px; right: 8px; transform: none; bottom: max(8px, env(safe-area-inset-bottom)); justify-content: center; padding: 6px 4px 4px; border-radius: 28px; }
  .r3d-bubbles { gap: 2px; width: 100%; justify-content: space-between; }
  .r3d-bub { width: auto; flex: 1; min-width: 0; }
  .r3d-bub i { width: 42px; height: 42px; }
  .r3d-panel { left: 12px; right: 12px; transform: none; width: auto; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 78px); max-height: calc(50dvh - 20px); border-radius: 26px; }
  .r3d-edit { top: 74px; }
  .r3d-hint { display: none; }
  .r3d-addlist, .r3d-sel { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; justify-content: flex-start; } .r3d-addlist > *, .r3d-sel > * { flex: none; }
  .r3d-pop { left: 12px !important; right: 12px; top: auto !important; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 82px); width: auto; }
  .r3d-pop::before { display: none; }
  body.sheet-open .r3d-stickers, body.tools-open .r3d-stickers { display: none; }
}
/* v33, the phone home ("On a phone the room is small and buried"): numbered pins, the places in a strip, the set-ups as chips, Menu in the dock */
.r3d-phone, .r3d-menub { display: none !important; }
@media (max-width: 599px) {
  .stk { padding: 8px 12px; gap: 6px; min-height: 40px; } .stk b { width: 9px; height: 9px; } .stk .t { display: inline; }   /* v39: three named places */
  .r3d-lbl { padding: 0; width: 44px; justify-content: center; } .r3d-lbl .t { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .r3d-phone { display: grid !important; position: fixed; left: 0; right: 0; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 76px); z-index: 5; gap: 6px; pointer-events: none; }
  .r3d-moms, .r3d-places { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 2px 10px; pointer-events: auto; }
  .r3d-moms::-webkit-scrollbar, .r3d-places::-webkit-scrollbar { display: none; }
  .r3d-moms button, .r3d-places button { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 13px 0 8px; border: 0; border-radius: 999px;
    background: var(--cream); color: var(--ink); font: 600 13px Fredoka, system-ui, sans-serif; box-shadow: var(--shade); cursor: pointer; }
  .r3d-moms button { background: rgba(43, 38, 56, .82); color: var(--cream); padding: 0 13px 0 10px; } .r3d-moms .ms { font-size: 17px; }
  .r3d-places b { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: oklch(0.8 0.11 var(--h)); font-weight: 600; }
  .r3d-places button[aria-pressed=true] { background: oklch(0.92 0.06 var(--h)); box-shadow: 0 0 0 2px var(--ink); }
  .r3d-menub:not([hidden]) { display: grid !important; }
  .r3d-pop { bottom: calc(max(8px, env(safe-area-inset-bottom)) + 76px) !important; z-index: 7; }
  body:not(.sheet-open) .rail:not(.open) { display: none; }
  body:not(.sheet-open) .rail.open { top: auto; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 80px); left: 8px; }
  body:not(.sheet-open) .rail.open .rail-tog { display: none; }
  body:not(.sheet-open) .rail.open .rail-list { border-top: 0; padding-top: 0; }
  .r3d.tools-open .r3d-phone, body.sheet-open .r3d-phone, .r3d.touring .r3d-phone, .r3d.editing .r3d-phone, .r3d.nogl .r3d-phone, .r3d.popped .r3d-phone, .r3d:has(.r3d-act:not([hidden])) .r3d-phone { display: none !important; }
}
/* v28: the tour's card, the link's toast, the versions */
.r3d-tour { position: fixed; left: 50%; bottom: 104px; transform: translateX(-50%); width: min(520px, calc(100vw - 24px)); z-index: 32; background: var(--cream); color: var(--ink);
  border-radius: 26px; padding: 14px 18px 16px; box-shadow: var(--shade); display: grid; gap: 6px; }
.r3d-tour[hidden] { display: none; }
.r3d-tourn { font: 600 12.5px Figtree, system-ui, sans-serif; color: var(--mut); }
.r3d-tour h3 { margin: 0; font: 600 20px Fredoka, system-ui, sans-serif; }
.r3d-tour p { margin: 0; font-size: 14.5px; line-height: 1.4; }
.r3d-tour .acts { display: flex; gap: 6px; align-items: center; margin-top: 4px; }
.r3d-tour .acts button { min-width: 44px; min-height: 44px; border: 0; border-radius: 999px; background: var(--soft); color: var(--ink); cursor: pointer; display: grid; place-items: center; font: 600 14px Fredoka, system-ui, sans-serif; }
.r3d-tour .acts button.end { margin-left: auto; padding: 0 16px; background: oklch(0.8 0.11 235); }
.r3d-tourbar { display: block; height: 5px; border-radius: 999px; background: var(--soft); overflow: hidden; }
.r3d-tourbar b { display: block; height: 100%; width: 0; background: oklch(0.8 0.11 235); }
.r3d.touring .r3d-dock, .r3d.touring .r3d-lbl { visibility: hidden; }
.r3d-toast { position: fixed; left: 50%; top: 18px; transform: translateX(-50%); z-index: 40; background: var(--ink); color: var(--cream); border-radius: 999px; padding: 10px 18px;
  font: 600 14px Fredoka, system-ui, sans-serif; box-shadow: var(--shade); max-width: calc(100vw - 24px); }
.r3d-toast[hidden] { display: none; }
.r3d-sub { margin: 6px 0 -4px; font: 600 16px Fredoka, system-ui, sans-serif; color: var(--ink); }
/* v36: Extras' option rows: a row per need, its mode tag, a line between rows. v37, client: "Some buttons in the Extras tab are slightly
   misaligned": each row is a grid (the heading and its tag, See it pinned on the right, the options in even columns, the caption under);
   the heading's -4 bottom margin (it ran into the buttons) is gone here; the tag sits on the heading's centre line, not nudged 2px */
.r3d-optrow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "head see" "btns btns" "cap cap"; gap: 8px 10px;
  align-items: center; padding: 12px 0; border-top: 1px solid var(--line, rgba(0,0,0,.08)); }
.r3d-opts > .r3d-optclear + .r3d-optrow, .r3d-opts > .r3d-opthow + .r3d-optrow { border-top: 0; }
.r3d-optrow > .r3d-sub { grid-area: head; margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; line-height: 1.25; min-width: 0; }
.r3d-optrow > .r3d-optsee { grid-area: see; align-self: start; }
.r3d-optrow > .seg { grid-area: btns; }
.r3d-optrow > .caption { grid-area: cap; margin: 0; }
.r3d-optmode { display: inline-flex; align-items: center; height: 22px; padding: 0 9px; border-radius: 999px; font: 500 11.5px system-ui, sans-serif; letter-spacing: .02em;
  background: var(--chip, rgba(0,0,0,.06)); color: var(--muted, #6b6560); }
.r3d-opthow { margin: 2px 0 6px; }
/* v37: every list of choices in Extras on one column grid, so the buttons line up row to row; words start at the same left padding */
.r3d-ui .seg.r3d-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 148px), 1fr)); gap: 6px; }
.r3d-ui .seg.r3d-grid-s { grid-template-columns: repeat(auto-fill, minmax(min(100%, 112px), 1fr)); }
.r3d-ui .seg.r3d-grid > button { width: 100%; text-align: left; line-height: 1.25; }
#r3d-dp-extras .chip { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
#r3d-dp-extras .chip .ms { vertical-align: 0; }
.r3d-allrow { margin-top: 2px; }
.r3d-moments button .ms, .r3d-ui .chip .ms { font-size: 18px; vertical-align: -4px; }
/* v31: the camera: its height, and the move buttons on the room (hold one to keep moving) */
.r3d-eyerow { display: grid; grid-template-columns: auto 1fr 5.5em; gap: 10px; align-items: center; font-size: 14px; }
.r3d-eyerow input { width: 100%; accent-color: oklch(0.55 0.12 235); }
.r3d-eyerow output { font-variant-numeric: tabular-nums; color: var(--mut); text-align: right; }
.r3d-pad { position: fixed; left: 16px; bottom: 22px; z-index: 30; display: grid; grid-template-columns: repeat(3, 44px) 44px; gap: 6px; padding: 8px;
  border-radius: 22px; background: color-mix(in oklab, var(--cream) 88%, transparent); box-shadow: var(--shade); touch-action: none; user-select: none; }
.r3d-pad[hidden] { display: none; }
.r3d-pad button { width: 44px; height: 44px; border: 0; border-radius: 14px; background: var(--soft); color: var(--ink); cursor: pointer; display: grid; place-items: center; }
.r3d-pad button:nth-child(4), .r3d-pad button:nth-child(8) { background: oklch(0.92 0.06 235); }
.r3d-pad button:active { background: var(--ink); color: var(--cream); }
.r3d-pad .ms { font-size: 22px; }
@media (min-width: 900px) { .r3d-pad { bottom: 104px; } }
@media (max-width: 899px) { .r3d-pad { left: 10px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 84px); } .r3d.tools-open .r3d-pad { display: none; } }
.r3d.editing .r3d-pad { display: none; }
@media (max-width: 899px) { .r3d-toast { top: 132px; max-width: calc(100vw - 32px); text-align: center; } }   /* v32: under the Menu button too */   /* v30: under the brand pill and the labels switch on a phone */
.r3d-tourgo .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; font-size: 16px; }
.r3d-ui .chip .ms, .r3d-ui .btn .ms { font-size: 19px; vertical-align: -4px; }
.r3d-svars [hidden] { display: none; }
.r3d-planbox { display: grid; gap: 8px; margin: 4px 0 10px; }
.r3d-planbox[hidden], .r3d-setups[hidden] { display: none; }
.r3d-setups { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.r3d-setups .label { width: 100%; }
.r3d-planbox input[type=text], .r3d-planbox textarea { width: 100%; box-sizing: border-box; border: 0; border-radius: 12px; padding: 8px 10px; background: var(--soft); color: var(--ink); font: 500 13px/1.4 Figtree, system-ui, sans-serif; }
.r3d-planbox textarea { resize: vertical; min-height: 140px; white-space: pre-wrap; }
.r3d-planinc { border: 0; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
.r3d-planinc legend { width: 100%; padding: 0; }
.r3d-planinc label { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; font-size: 14px; }
.r3d-linkbox { width: 100%; margin-top: 4px; min-height: 40px; border: 0; border-radius: 12px; padding: 6px 10px; background: var(--soft); color: var(--ink); font: 500 13px Figtree, system-ui, sans-serif; }
@media (max-width: 899px) { .r3d-tour { left: 12px; right: 12px; transform: none; width: auto; bottom: 92px; } }
@media (prefers-reduced-motion: reduce) { .r3d *, .stk { transition: none !important; } }

/* v39 (the approved redesign): three places as cream pins with a coloured dot; the plan bar (your plan's total, or what the options on add)
   and the Try options switch above the dock; Back to my plan while trying; a card's extra buttons under Details; panels' More folds */
.stk { background: var(--cream); padding: 10px 16px; gap: 8px; transform: translate(-50%, -50%); }
.stk b { width: 10px; height: 10px; background: oklch(0.6 0.12 var(--h)); }
.stk:hover, .stk[aria-expanded=true] { transform: translate(-50%, -50%) scale(1.06); }
.r3d-planbar { position: absolute; left: 50%; transform: translateX(-50%); bottom: 104px; z-index: 6; display: flex; gap: 8px; align-items: center; width: min(560px, calc(100% - 24px)); justify-content: space-between; pointer-events: none; }
.r3d-planbar > * { pointer-events: auto; }
.r3d-plansum { background: color-mix(in oklab, var(--cream) 94%, transparent); border-radius: 999px; padding: 12px 16px; font: 600 14px Figtree, system-ui, sans-serif; box-shadow: var(--shade); }
.r3d-try { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 10px 0 16px; border: 0; border-radius: 999px; background: var(--ink); color: var(--cream); font: 700 14px Figtree, system-ui, sans-serif; cursor: pointer; box-shadow: var(--shade); }
.r3d-try i { width: 40px; height: 24px; border-radius: 999px; background: #57505e; position: relative; transition: background .2s; }
.r3d-try i::after { content: ""; position: absolute; left: 2px; top: 2px; width: 20px; height: 20px; border-radius: 50%; background: var(--cream); transition: transform .25s var(--spring); }
.r3d-try[aria-checked=true] i { background: oklch(0.72 0.13 150); }
.r3d-try[aria-checked=true] i::after { transform: translateX(16px); }
.r3d.trying .r3d-plansum { background: var(--ink); color: var(--cream); }
/* v40.2, client: "take your plan price off and make a button for getting a good view of the room again if I'm positioned wrong and getting
   lost": the total shows only while trying options (as the change they make); Whole room flies back to the view from above */
.r3d:not(.trying) .r3d-plansum, .r3d:not(.trying) .r3d-planbar { display: none; }
.r3d-planbar { justify-content: center; }
.r3d-minib.lost { animation: r3dLost 1.6s ease-in-out 3; }
.r3d-tryrow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.r3d-painth { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.r3d-wallsel { min-height: 40px; border: 0; border-radius: 999px; padding: 0 14px; background: #efe7d8; color: var(--ink); font: 600 14px Figtree, system-ui, sans-serif; }
#r3d-lightsh .r3d-litst { font: 500 13px Figtree, system-ui, sans-serif; color: var(--mut); margin-left: 6px; }
/* v45, client: "Make whole room and remove labels button smaller buttons on the room not a part of the navigations tab buttons":
   two small pills under the Plan/Build/Buy bar, icon only on a phone */
.r3d-floors { display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--surface, #fbf8f1); box-shadow: 0 4px 14px rgba(0,0,0,.18); }
.r3d-floors[hidden] { display: none; }
/* v64: the switches (Gardens, Next door) and a floor's rooms: wrap on a phone */
.r3d-floors { flex-wrap: wrap; justify-content: flex-end; max-width: min(94vw, 560px); border-radius: 18px; }
.r3d-floors .sep { width: 1px; margin: 5px 3px; background: rgba(0,0,0,.15); }
.r3d-floors .tog[aria-pressed="true"] { background: #3c6e57; color: #fff; }
.r3d-hrooms { margin-top: 6px; }
/* v74, the client: "make it possible to temporarily remove the room picker buttons so i can view where i currently am": Hide buttons
   folds the floors and the rooms away (the view pair and the button to bring them back stay) */
.r3d-mini.pickoff #r3d-floors, .r3d-mini.pickoff #r3d-hrooms { display: none; }
.r3d-hrooms button { min-height: 30px; padding: 0 10px; font-size: 12.5px; }
.r3d-floors button { min-height: 32px; padding: 0 11px; border: 0; border-radius: 999px; background: transparent; color: var(--ink, #1d2a22); font: 600 13px Figtree, system-ui, sans-serif; cursor: pointer; }
.r3d-floors button[aria-pressed="true"] { background: var(--ink, #1d2a22); color: #fff; }
/* v71, the client: three ways to see a room, small and smooth (icons only on a phone) */
.r3d-rmode { flex-wrap: nowrap; border-radius: 999px; }
.r3d-rmode button { display: inline-flex; align-items: center; gap: 5px; transition: background .2s, color .2s; }
.r3d-rmode .ms { font-size: 17px; }
@media (max-width: 640px) { .r3d-rmode .t { display: none; } .r3d-rmode button { padding: 0 9px; } }
.r3d-mini { position: fixed; top: max(72px, calc(env(safe-area-inset-top) + 60px)); right: 16px; z-index: 31; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; transition: right .3s; }
.r3d .r3d-mini .r3d-minib { position: static; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px 0 9px; border: 0; border-radius: 999px;
  background: color-mix(in oklab, var(--cream) 92%, transparent); color: var(--ink); font: 600 13px Figtree, system-ui, sans-serif; box-shadow: var(--shade); cursor: pointer; transition: transform .25s var(--spring); }
.r3d .r3d-mini .r3d-minib:hover { transform: scale(1.05); }
.r3d .r3d-mini .r3d-minib[hidden] { display: none; }
.r3d .r3d-mini .r3d-minib .ms { font-size: 18px; }
.r3d.nogl .r3d-mini, .r3d.editing .r3d-mini { display: none; }
.r3d.touring .r3d-mini { visibility: hidden; }
@media (min-width: 900px) { .r3d.tools-open .r3d-mini { right: calc(min(420px, 38vw) + 32px); } }
@media (max-width: 899px) { .r3d-mini { top: max(64px, calc(env(safe-area-inset-top) + 52px)); right: 12px; }
  .r3d .r3d-mini .r3d-minib { width: 40px; height: 40px; min-height: 40px; padding: 0; justify-content: center; }
  .r3d .r3d-mini .r3d-minib .t { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); } }
/* V1.2, the client: "too many lists and menus": on a phone the floors and a floor's rooms are one row each, sliding sideways, not blocks */
@media (max-width: 899px) { .r3d-floors:not(.r3d-rmode) { flex-wrap: nowrap; overflow-x: auto; max-width: calc(100vw - 24px); scrollbar-width: none; justify-content: flex-start; border-radius: 999px; }
  .r3d-floors:not(.r3d-rmode)::-webkit-scrollbar { display: none; } .r3d-floors button { flex: none; white-space: nowrap; } }
.ms-row { display: grid; grid-template-columns: minmax(0, 1fr) 84px 44px; gap: 8px; align-items: center; padding: 8px 8px 8px 12px; border-radius: 16px; background: #fff; }
.ms-row .t { font: 600 14px Figtree, system-ui, sans-serif; color: var(--ink); }
.ms-row small { display: block; font-weight: 500; font-size: 12.5px; color: var(--mut); }
.ms-row input[type=number] { box-sizing: border-box; min-width: 0; width: 100%; min-height: 44px; border: 0; border-radius: 12px; padding: 0 10px; background: var(--soft); color: var(--ink); font: 600 16px Figtree, system-ui, sans-serif; text-align: right; }
.ms-row.done { background: oklch(0.95 0.05 150); }
.ms-cam { position: relative; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--soft); color: var(--ink); cursor: pointer; }
.ms-cam.has { background: oklch(0.85 0.1 150); }
.ms-cam input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.ms-go { border: 0; padding: 0; background: none; color: inherit; font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
.ms-go .ms { font-size: 16px; }
@keyframes r3dLost { 50% { box-shadow: 0 0 0 6px oklch(0.8 0.12 85 / .55), var(--shade); } }
.r3d-back { position: absolute; left: 16px; top: max(84px, calc(env(safe-area-inset-top) + 72px)); z-index: 6; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--cream); color: var(--ink); font: 700 14px Figtree, system-ui, sans-serif; box-shadow: var(--shade); cursor: pointer; }
.r3d-back[hidden] { display: none; }
.r3d.tools-open .r3d-planbar, .r3d.editing .r3d-planbar, .r3d.touring .r3d-planbar, .r3d.nogl .r3d-planbar { display: none; }
.r3d-actmore { margin-top: 8px; }
.r3d-actmore > summary { cursor: pointer; list-style: none; text-align: center; min-height: 40px; display: grid; place-items: center; border: 1.5px solid #e1d6c2; border-radius: 999px; font: 700 14px Figtree, system-ui, sans-serif; }
.r3d-actmore > summary::after { content: " ▾"; }
.r3d-actmore[open] > summary::after { content: " ▴"; }
.r3d-actmore .acts { margin-top: 8px; }
.r3d-fold { border-top: 2px dashed #e5dccb; padding-top: 6px; }
.r3d-fold > summary { min-height: 44px; display: flex; align-items: center; }
.r3d-momrow { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.r3d-momrow button { flex: none; }
@media (max-width: 899px) { .r3d-planbar { bottom: calc(max(8px, env(safe-area-inset-bottom)) + 84px); } }
@media (min-width: 900px) { .r3d-panel { top: 80px; } }   /* v39: under Plan · Build · Buy */
.r3d-find .seg { flex-wrap: nowrap; } .r3d-find input { flex: 1; min-width: 0; min-height: 44px; border: 1.5px solid #e1d6c2; border-radius: 999px; padding: 0 16px; font: 500 15px Figtree, system-ui, sans-serif; background: #fff; color: var(--ink); }
.r3d-mysc { display: inline-flex; } .r3d-mysc button:first-child { border-radius: 999px 0 0 999px !important; } .r3d-myx { border-radius: 0 999px 999px 0 !important; padding: 0 12px !important; }
.r3d.measuring canvas { cursor: crosshair; }
"""


def scenes_json():
    return json.dumps({k: {"name": n, "levels": lv} for k, n, _, lv, _ in scenes.SCENES})


def rules_json():
    """v25: the table rule and where the old scene keys went (room3d.js maps saved choices with it)."""
    return json.dumps({"boost": scenes.TABLE_BOOST, "old": scenes.OLD_TO_NEW})


LIGHTS = [("strip", "Ceiling LED strip", None), ("uprights", "Upright grooves and the side shelf (smart colour strips)", "strips"), ("bias", "TV bias light", None),
          ("bar1", "Bar 1, TV to window (smart colour)", "bar1"), ("bar2", "Bar 2, by the stairs (smart colour)", "bar2"),
          ("lamp", "Red lamp: top, middle, bottom", "lamp"), ("accent", "Accents: the glass case, the bar, the PC", None)]   # v46
CEIL_PRESETS = [("match", "Same as the walls"), ("#f2f0ea", "White")]
SKIRT_PRESETS = [("match", "Same as the walls"), ("#ece8dd", "Off-white"), ("#5e6a5b", "Green Smoke")]
# v25: the five Tools tabs (were v22's drawers): (key, name, icon, hue)
# v37, client: "Relocate the lights controls so they sit under 'View' in the main buttons menu": four tabs, the lights in Views
DRAWERS = [("views", "View", "photo_camera", 235), ("room", "Room", "chair", 50), ("look", "Look", "palette", 165),
           ("measure", "Measure", "straighten", 95)]   # V1.2: what's still a guess, to measure (measure.js saves it)
ROOM_NAMES = {"bed3": "Office", "airing": "Boiler cupboard", "porch": "Front door", "lower_landing": "Lower landing", "lower_stairs": "Lower stairs",
              "lower_store": "Store", "kitchen_cupboard": "Kitchen cupboard", "secret": "The secret room", "living": "Living room"}
WALK_IN = {"living", "kitchen", "bed3", "bed2", "master", "bathroom", "landing", "hall", "garage", "wc"}   # room3d.js ROOM_VIEW: a room with its own view


def measure_panel():
    """V1.2: the sizes still guessed (house/measure.py, through the house file), by room: a number in cm and a photo each. measure.js saves
    them (the shared page's database, or this device and a link) for tools/pull_edits.py, as the V1 app did; a room's name flies there"""
    import sys
    sys.path.insert(0, str(HERE.parents[1] / "house"))
    import export_house
    h = export_house.house()
    names = {r["id"]: ROOM_NAMES.get(r["id"], r["name"]) for r in h["rooms"]}
    rows = h["measure"]
    out = [f'<p class="caption">Each one replaces a size guessed from a photo. <b id="ms-count">0 of {len(rows)} measured</b></p>']
    for room in dict.fromkeys(m["room"] for m in rows):
        nm = html.escape(names.get(room, room))
        head = f'<button type="button" class="ms-go" data-hroom="{room}">{nm} <span class="ms" aria-hidden="true">arrow_forward</span></button>' if room in WALK_IN else nm
        out.append(f'<div class="grp"><span class="label">{head}</span>')
        for m in rows:
            if m["room"] != room:
                continue
            what = html.escape(m["what"])
            drawn = f'Drawn {m["drawn"]:g} cm' if m.get("drawn") is not None else "Not drawn yet"
            out.append(f'<div class="ms-row" data-row="{m["id"]}"><span class="t">{what}<small>{drawn} · {html.escape(m["where"])}</small></span>'
                       f'<input type="number" inputmode="decimal" min="0" step="0.5" placeholder="cm" data-measure="{m["id"]}" data-what="{what}" aria-label="{what}, in cm">'
                       f'<label class="ms-cam" title="Add a photo"><span class="ms" aria-hidden="true">photo_camera</span>'
                       f'<input type="file" accept="image/*" capture="environment" data-mphoto="{m["id"]}" aria-label="A photo of {what.lower()}"></label></div>')
        out.append("</div>")
    out.append('<div class="grp"><div class="seg"><button type="button" class="btn primary" id="ms-send"><span class="ms" aria-hidden="true">send</span> Send to the plan</button></div>'
               '<span class="caption" id="ms-st" aria-live="polite">Saved on this device as you type.</span></div>')
    return "".join(out)
# v39 (the redesign the client approved, 23 Oct): four dock buttons, View, Room, Look and Edit. Room holds Layout and Extras, grouped by
# place; each panel opens on its main choices with everything else under a More fold
# One Tools button holds every 3D control: the pill (on a laptop) or the bottom bar's Tools button (on a phone, [data-tools-toggle])
# opens the bubble row; a bubble opens its panel. The last tab is remembered (mw22-drawer); Esc and the pill close it.
DRAWER_JS = """(() => { const r = document.getElementById("r3d"); if (!r) return;
  const K = "mw22-drawer", tabs = [...r.querySelectorAll("[data-drawer]")], panel = document.getElementById("r3d-panel"), btns = [...document.querySelectorAll("[data-tools-toggle]")];
  let cur = "room", shown = ""; try { cur = localStorage.getItem(K) || "room"; } catch (e) {}
  if (cur === "lights") cur = "views";                                   // v37: the lights moved into Views
  if (cur === "layout" || cur === "extras") cur = "room";                // v39: Layout and Extras are Room
  if (!tabs.some(t => t.dataset.drawer === cur)) cur = "room";
  const sync = open => { r.classList.toggle("tools-open", open); document.body.classList.toggle("tools-open", open);
    document.querySelectorAll("[data-tools-toggle]").forEach(b => { b.setAttribute("aria-expanded", String(open)); const i = b.querySelector(".ms"); if (i) i.textContent = open ? "close" : "tune"; }); };
  const showing = () => !panel.hidden;
  const show = k => { cur = k; tabs.forEach(t => { const on = t.dataset.drawer === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on || panel.hidden ? 0 : -1;
      document.getElementById("r3d-dp-" + t.dataset.drawer).hidden = !on; });
    const sc = panel.querySelector(".r3d-pscroll"); if (sc && k !== shown) sc.scrollTop = 0; shown = k;
    if (typeof arts === "function") arts(document.getElementById("r3d-dp-" + k));
    panel.hidden = false; panel.setAttribute("aria-labelledby", "r3d-dt-" + k); try { localStorage.setItem(K, k); } catch (e) {} };
  const open = k => { sync(true); show(k || cur); window.dispatchEvent(new CustomEvent("demma-tools", { detail: true })); };
  const close = () => { sync(false); panel.hidden = true; tabs.forEach(t => { t.setAttribute("aria-selected", "false"); t.tabIndex = 0; }); window.dispatchEvent(new CustomEvent("demma-tools", { detail: false })); };
  window.DemmaTools = { open, close, toggle() { r.classList.contains("tools-open") ? close() : open(); }, isOpen: () => r.classList.contains("tools-open") };
  document.addEventListener("click", e => { if (e.target.closest("[data-tools-toggle]")) window.DemmaTools.toggle(); });   // the phone's bottom bar comes later in the page
  // v32: the bubbles are always on the room: one opens its panel (and marks the tools open), the open one again closes it
  tabs.forEach((t, i) => { t.addEventListener("click", () => { if (showing() && cur === t.dataset.drawer) close(); else open(t.dataset.drawer); });
    t.addEventListener("keydown", e => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); show(n.dataset.drawer); }); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && r.classList.contains("tools-open") && !document.body.classList.contains("sheet-open")) close(); });
  sync(false); panel.hidden = true;
})();"""
SUGG_SHORT = {"floorplant": "Tall floor plant", "sidetable": "Round side table", "pouffe": "Knitted pouffe", "art": "Print over the sofa",
              "clock": "Clock over the door", "tray": "Coffee-table tray",
              "fairy": "Fairy lights on the pole", "hanger": "Hanging plant in the window", "trail": "Trailing plant, top shelf",
              "throw": "Knit throw on the sofa", "pclamp": "Mushroom lamp, PC shelf", "basket": "Seagrass basket",
              "candles": "LED candles on the shelf", "runner": "Table runner and vase", "floorcush": "Floor cushions",
              "lantern": "Rattan floor lantern", "mirror": "Arched mirror", "shelfled": "LED strip under the shelf",
              "barcase": "Drinks cabinet, breast", "bartrolley": "Drinks trolley", "blind": "Blackout blind", "cablights": "Lights in the cabinet",
              "barside": "Drinks cabinet, by the sofa", "blanketbasket": "Blanket basket", "cotswoldbasket": "Lidded seagrass basket", "recordtable": "Record table", "liftcoffee": "Lift-top coffee table", "doorshelf": "Shelf over the door",
              "shelfboxes": "Boxes on your shelf",
              "stairdrawers": "Drawers in the steps", "alcoveshelves": "Alcove shelves", "windowseat": "Storage window seat", "hallbench": "Bench with cubbies",
              "wardrobe": "Built-in cupboard", "wallcabs": "Wall cabinets, sofa", "overdoor": "Hook rail over the door",
              "growlights": "Grow lights, plant stand", "curtainmotor": "Curtain motors", "lpledges": "LP ledges, side wall", "cordlamp": "Lamp on the C-table", "stairscurtain": "Curtain round the stairs"}   # v43   # v37   # v36   # v32   # v26   # v23   # v21: the buttons' words for ideas.SUGGEST
IDEA_SHORT = {"case": "Glass case on the breast", "glass": "Glass plant shelves", "ctable": "Sofa C-table", "sync": "TV backlight, picture sync",
              "cushions": "Cushions and a throw", "plantlight": "Uplight under the plants", "rugpad": "Rug pad (corner turned back)",
              "button": "Scene button by the door", "night": "Stair nightlights", "clean": "Record-care caddy"}   # v32: every idea in the room
# v20: decor to try in the 3D room (room3d.js S.decor; the keys match its RUG_LOOKS, CUSHION_COLS, CURTAIN_COLS, the case's PRESETS, CASE_FRAMES)
DECOR = [("rug", "Rug", [("yours", "Arches (the plan's)"), ("jute", "Jute flatweave"), ("blue", "Deep blue"), ("stripes", "Sage stripes"), ("none", "No rug")]),
         ("cushions", "Sofa cushions", [("none", "None"), ("rust", "Rust and ochre"), ("blues", "Blues"), ("sage", "Sage and cream")]),
         ("curtains", "Curtains", [("hessian", "Your hessian"), ("linen", "White linen"), ("sage", "Sage"), ("blue", "Deep blue"), ("rust", "Rust")]),
         ("fill", "In the glass case", [("collect", "Collectibles"), ("games", "Retro games"), ("singles", "7-inch singles and tapes"), ("plants", "Plants and ceramics"), ("mixed", "A bit of each")]),
         ("frame", "The case's frame", [("oak", "Oak"), ("black", "Black"), ("white", "White")]),
         # v26: more to try: the oak's finish (every new oak piece), the floor, your black shelf
         ("oak", "The oak, on everything new", [("artisan", "Artisan oak (the plan)"), ("pale", "Pale, white-oiled"), ("smoked", "Smoked oak"), ("walnut", "Walnut")]),
         ("floor", "The floor", [("carpet", "Your grey carpet"), ("oatmeal", "Oatmeal carpet"), ("boards", "Oak floorboards")]),
         ("shelf", "Your shelf by the stairs", [("black", "Black (yours)"), ("oak", "Oak"), ("white", "White")]),
         # v38 (item 12): ceiling designs to try, for later (an option, not the plan)
         # v40: plants and pots to try (the plan keeps your mix)
         ("plants", "Plant style", [("mix", "Your mix (the plan)"), ("lush", "Lush"), ("easy", "Easy care")]),
         ("pots", "Pots", [("mine", "As they are"), ("terracotta", "Terracotta"), ("white", "White glazed"), ("black", "Matte black")]),
         ("ceiling", "Design", [("asis", "As it is"), ("smooth", "Smooth"), ("stipple", "Artex stipple"), ("swirl", "Artex swirl"), ("fan", "Artex fan"),
                                ("basket", "Basket weave"), ("beams", "Oak-effect beams"), ("coffers", "Coffers"), ("cove", "LED cove")]),
]
# v38: one line each on what a ceiling design takes and costs (fit.SOURCES: skimartex, artextest, pubeam, orac)
CEIL_NOTE = ("Smooth £300–700; a pattern £200–600; beams about £1,050; coffers £450–900; an LED cove £750–850. "
             "Test old Artex for asbestos first.")   # v33: the tie-on seat pads went with the FRÖSVI (your padded chairs need none)
DECOR_GROUPS = [("Plants", ("plants", "pots")), ("Wood and floor", ("oak", "floor", "shelf")), ("Soft things", ("cushions", "curtains")), ("The glass case on the breast", ("fill", "frame"))]   # v39: the ceiling and the rug lead Look


def tour():
    """v28, from the optimisation plan: "a guided tour": the room's main views in turn, a caption each (numbers from geometry, so they
    follow the next round). set: choices shown for that stop only (put back after it)."""
    g = G
    s = g.summary()
    return [
        dict(view="room", title="The whole room", text=f"From above the window, the near wall cut away: the media wall, the breast, the door, the stairs and the dining cabinet, under a {g.CEIL:g} ceiling."),
        dict(view="wall", title="The media wall", text=f"Artisan oak in your pale mint across the {g.ALC_W:g} cm alcove: the TV in line with the sofa, the turntable and the LP crates on the left, the consoles under the TV."),
        dict(view="dining", title="The dining cabinet, open", set={"site": "C", "dining": "six", "cab": "compact"},
             text=f"The table door swings back flat and the table folds down to {g.CAB['len_open']:g} × {g.CAB['top'][0]:g} for six. Folded, the table and all six chairs pack into {g.CAB['len']:.0f} cm of wall."),
        dict(view="sofa", title="From the sofa", text=f"About {s['view_dist'] / 100:.2f} m from the screen: the 55-inch fills about {s['view_angle']:.0f}° of your view, right for films and games."),
        dict(view="plan", title="From above", text="Everything to scale from the plan's own measurements. Drag to look round when the tour ends."),
    ]


PAGES_URL = "https://emmachilds98-wq.github.io/Demma-Home/plan.html"   # v28: "Copy link to this view" always gives a link anyone can open


def svar_json():
    """v28: each suggestion's versions for room3d.js (colours) and Your picks (names)."""
    return json.dumps({k: [[v, n, c] for v, n, c in vs] for k, vs in ideas.SUGG_VARS.items()}, separators=(",", ":"))


def controls(gallery=""):
    """v25: the Tools panels. Same data-* hooks as v24's drawers (room3d.js binds to them), new containers: pill rows, preset tiles,
    round paint swatches. gallery: the HD pictures (build_viewer.gallery3d), shown under Views."""
    seg = lambda attr, items, lab, extra="": (f'<div class="grp"><span class="label">{lab}</span><div class="seg" role="group" aria-label="{html.escape(lab)}">'
                                              + "".join(f'<button type="button" data-{attr}="{k}" aria-pressed="false">{v}</button>' for k, v in items) + extra + "</div></div>")
    rows = []
    for k, lab, col in LIGHTS:
        cols = ""
        if col == "lamp":
            cols = "".join(f'<input type="color" data-col="lamp{i}" value="{c}" aria-label="Lamp bulb {n} colour">' for i, (c, n) in enumerate(zip(G.LAMP_HEADS_RGB, ("top", "middle", "bottom"))))
        elif col:
            cols = f'<input type="color" data-col="{col}" value="#ffe2b8" aria-label="{html.escape(lab)} colour"><button type="button" class="chip" data-colreset="{col}">Warm white</button>'
        rows.append(f'<div class="r3d-lv"><label for="lv-{k}">{html.escape(lab)}</label><input type="range" id="lv-{k}" min="0" max="100" step="1" data-lv="{k}">'
                    f'<output data-lvout="{k}">0%</output><span class="r3d-cols">{cols}</span></div>')
    TILE_SUB = {"evening": "Every light, low and warm", "bright": "Everything up", "cosy": "Low and warm", "film": "Films and games"}   # v26: the tiles' second line, whole
    icons = {"evening": "wb_twilight", "bright": "light_mode", "cosy": "local_fire_department", "film": "movie"}
    tiles = "".join(f'<button type="button" data-scene="{k}" aria-pressed="false"><span class="ms" aria-hidden="true">{icons.get(k, "lightbulb")}</span><b>{html.escape(n)}</b>'
                    f'<span>{html.escape(TILE_SUB.get(k, d.split(":")[0].split(",")[0]))}</span></button>' for k, n, d, *_ in scenes.SCENES)
    lights = (f'<div class="grp"><span class="label">Presets (tap again to undo your changes)</span><div class="r3d-tiles" role="group" aria-label="Lighting presets">{tiles}</div></div>'
              # v46: the whole room in two moves, before the light-by-light sliders
              '<div class="r3d-lvs r3d-top"><div class="r3d-lv r3d-master"><label for="lv-master">Brightness</label><input type="range" id="lv-master" min="0" max="100" step="1" data-lv="master"><output data-lvout="master">100%</output><span></span></div>'
              '<div class="r3d-lv r3d-master"><label for="lv-warm">Warmth</label><input type="range" id="lv-warm" min="0" max="100" step="1" data-lv="warm" class="r3d-warm"><output data-lvout="warm">warm white</output><span></span></div></div>'
              # v39, item 13: your own scenes, next to the presets (this device)
              '<div class="grp" id="r3d-myscenes"><span class="label">Your own scenes</span><div class="seg" id="r3d-myscl"></div>'
              '<div class="seg r3d-find"><input type="text" id="r3d-myname" placeholder="Our evening" aria-label="Name for these lights" maxlength="24">'
              '<button type="button" class="chip" id="r3d-mysave">Save these lights</button></div></div>'
              f'<p class="r3d-boost" id="r3d-boost" hidden><span class="ms" aria-hidden="true">restaurant</span> The table\'s open, so bar 2 lights it.</p>'
              + seg("tod", scenes.TOD, "Time of day")
              + '<details class="r3d-more"><summary>Fine-tune each light</summary>'
              '<div class="r3d-lvs">' + "".join(rows) + '</div></details>'
              '<div class="grp"><span class="label">Switch on or off</span><div class="seg" role="group" aria-label="Light box, laser, PC and curtains"><button type="button" data-tog="lbox" aria-pressed="false">IKEA light box</button>'
              '<button type="button" data-tog="laser" aria-pressed="false">Laser</button>'
              '<button type="button" data-tog="pc" aria-pressed="false">PC lit</button>'
              '<button type="button" data-tog="curtains" aria-pressed="false">Curtains drawn</button></div></div>')
    ideas_g = ('<div class="grp"><span class="label">Ideas (not in the plan)</span>'
               '<div class="seg r3d-grid" role="group" aria-label="Ideas, not in the plan">'
               + "".join(f'<button type="button" data-idea="{k}" aria-pressed="false" title="{html.escape(size)}">{html.escape(IDEA_SHORT[k])}</button>'
                         for k, _t, size, *_ in ideas.idea_options() if k != "cushions")      # the cushions are Decor's
               + '</div></div>')
    dec = {k: (lab, opts) for k, lab, opts in DECOR}
    MAIN_DECOR = (("ceiling", "The ceiling (to try, for later)"), ("rug", "The rug"))   # v39: Look opens on the walls, the ceiling and the rug
    decor_main = "".join(f'<div class="grp r3d-decor"><span class="label">{html.escape(t)}</span><div class="seg" role="group" aria-label="{html.escape(t)}">'
                         + "".join(f'<button type="button" data-decor="{k}:{v}" aria-pressed="false">{html.escape(n)}</button>' for v, n in dec[k][1]) + '</div>'
                         + (f'<p class="r3d-hint2">{html.escape(CEIL_NOTE)}</p>' if k == "ceiling" else "") + '</div>' for k, t in MAIN_DECOR)
    decor_g = "".join('<div class="grp r3d-decor"><span class="label">' + html.escape(title) + '</span>'
               + "".join(f'<div class="r3d-decrow"><span>{html.escape(dec[k][0])}</span><div class="seg" role="group" aria-label="{html.escape(dec[k][0])}">'
                         + "".join(f'<button type="button" data-decor="{k}:{v}" aria-pressed="false">{html.escape(n)}</button>' for v, n in dec[k][1]) + '</div></div>'
                         for k in keys) + (f'<p class="r3d-hint2">{html.escape(CEIL_NOTE)}</p>' if "ceiling" in keys else "") + '</div>' for title, keys in DECOR_GROUPS)
    # v26: the ceiling and the skirting (with the door and its frame) back in Look: the walls' colour, white, or any colour
    trims = "".join(f'<div class="grp"><span class="label">{lab}</span><div class="seg" role="group" aria-label="{lab}">'
                    f'<button type="button" data-{key}="match" aria-pressed="false">Same as the walls</button><button type="button" data-{key}="#f2efe8" aria-pressed="false">White</button>'
                    f'<label class="chip r3d-anycol">Any colour <input type="color" id="r3d-{key}" value="#f2efe8" aria-label="{lab}: any colour"></label></div></div>'
                    for key, lab in (("ceil", "The ceiling"), ("skirt", "Skirting, the door and its frame")))
    sugg_g = ('<div class="grp"><span class="label">Every suggestion, one by one (not in the plan)</span>'
              '<div class="seg r3d-grid" role="group" aria-label="Suggested furniture and decor">'
              + "".join(f'<button type="button" data-sugg="{k}" aria-pressed="false" title="{html.escape(size)}">{html.escape(SUGG_SHORT[k])}</button>' for k, _t, size, *_ in ideas.SUGGEST)
              + '</div><div class="seg r3d-allrow"><button type="button" class="chip" data-suggall="on">All on</button><button type="button" class="chip" data-suggall="off">All off</button></div></div>'
              # v28: two or three versions of each, a row for every suggestion that's switched on
              '<div class="grp r3d-svars" id="r3d-svars"><span class="label">Choose a version</span>'
              '<p class="caption" id="r3d-svnone">Switch a suggestion on and its versions show here.</p>'
              + "".join(f'<div class="r3d-decrow" data-svrow="{k}" hidden><span>{html.escape(SUGG_SHORT[k])}</span><div class="seg r3d-grid r3d-grid-s" role="group" aria-label="{html.escape(SUGG_SHORT[k])}: version">'
                        + "".join(f'<button type="button" data-svar="{k}:{v}" aria-pressed="false">{html.escape(n)}</button>' for v, n, _c in ideas.SUGG_VARS[k]) + '</div></div>'
                        for k, *_ in ideas.SUGGEST)
              + '</div>'
              '<div class="grp"><span class="label">Something of your own</span><div class="seg"><button type="button" class="chip" id="r3d-addfrom">'
              '<span class="ms" aria-hidden="true">add</span> Add a piece of furniture</button></div>'
              '<span class="caption">Opens Edit room with its list: an armchair, a bookcase, a bench and more. Drag it where you like.</span></div>')
    views = "".join(f'<button type="button" class="chip" data-view="{k}" aria-pressed="false">{v}</button>' for k, v in VIEWS)
    # v31, client: "explore what could go next to the dining cabinet in the compact version": the wall between it and the pipe boxing
    BESIDE_SEG = ('<h3 class="r3d-sub">Beside the cabinet</h3>'
                  + seg("beside", [(k, v["name"]) for k, v in G.BESIDE["opts"].items()], f"The {G.BESIDE['len']:.0f} cm of wall by the pipe boxing")
                  + '<p class="caption">The open table door covers this wall, so keep it slim: '
                  f'{G.BESIDE["depth"]:g} cm deep at most. <button type="button" class="chip" data-view="beside">See it</button></p>')
    picks = ('<div class="grp r3d-picks" id="r3d-picks"><span class="label">Your picks</span>'
             '<p class="r3d-picklist" id="r3d-picklist" aria-live="polite">Nothing switched on yet: turn on an idea, a suggestion or a decor choice and it shows here.</p>'
             '<div class="seg"><button type="button" class="chip" id="r3d-pickcopy">Copy as a note</button>'
             '<button type="button" class="chip" id="r3d-picksave" hidden>Save for the next round</button><span class="r3d-hint2" id="r3d-pickst" aria-live="polite"></span></div></div>')
    paints = [(k, h, n.split(" No.")[0].replace("Farrow & Ball ", "").replace("Little Greene ", "")) for k, (h, n) in R.PAINTS.items()]
    walls = [("all", "All walls"), ("media", "Media wall"), ("breast", "Chimney breast"), ("door", "Door wall"), ("stairs", "Stairs wall"), ("window", "Window wall"), ("pc", "PC wall")]   # v38
    swatches = ('<div class="grp"><div class="r3d-painth"><span class="label">Paint</span>'   # v41: the paints first; one wall from the list
                '<select id="r3d-wallsel" class="r3d-wallsel" aria-label="Which wall">' + "".join(f'<option value="{k}">{n}</option>' for k, n in walls) + '</select>'
                '<button type="button" class="chip" data-wallmatch="1" hidden>Same as the others</button></div>'
                '<div class="r3d-swatches" role="group" aria-label="Wall paint">'
                + "".join(f'<button type="button" data-paint="{k}" aria-pressed="false"><i style="--c:{h}"></i>{html.escape(n)}</button>' for k, h, n in paints)
                + '<button type="button" data-paintcustom="#2c5643" aria-pressed="false"><i style="--c:#2c5643"></i>Deep green</button>'
                '<label><i><input type="color" id="r3d-custom" value="#899081" aria-label="Any colour for the walls"></i>Any colour</label></div></div>')
    return {
        # v39 (the approved redesign): Find flies to any piece or view, so nobody hunts through menus
        "views": '<div class="grp r3d-find"><label class="label" for="r3d-find">Find something in the room</label><div class="seg">'
                 '<input type="search" id="r3d-find" list="r3d-findlist" placeholder="The record table, the bar, the lamp…" autocomplete="off">'
                 '<button type="button" class="chip" id="r3d-findgo">Go</button></div><datalist id="r3d-findlist"></datalist></div>'
                 # v39, item 13: measure in 3D
                 + '<div class="grp"><div class="seg"><button type="button" class="chip" id="r3d-measure"><span class="ms" aria-hidden="true">straighten</span> Measure: tap two points</button></div></div>'
                 + f'<div class="grp r3d-tourgo"><div class="seg"><button class="chip" type="button" id="r3d-tourbtn" title="{len(tour())} stops, about a minute"><span class="ms" aria-hidden="true">play_circle</span> Take the tour</button>'
                 '<button type="button" class="chip" id="r3d-full"><span class="ms" aria-hidden="true">fullscreen</span> Full screen</button></div></div>'
                 + f'<div class="grp"><span class="label">Where you look from</span><div class="r3d-views" role="group" aria-label="Camera">{views}</div></div>'
                 # v37: the lights live here now (they were their own tab): the presets, daytime, every light's slider and colour, the quality
                 + '<h3 class="r3d-sub" id="r3d-lightsh">Lights <span class="r3d-litst" id="r3d-litst"></span></h3>' + lights
                 + '<details class="r3d-more r3d-fold"><summary>More: quality, moving round, sharing, pictures</summary>'
                 + seg("quality", [("hd", "HD, with shadows"), ("fast", "Fast")], "Quality")
                 + '<h3 class="r3d-sub">Moving round and sharing</h3>'
                 # v31, client: "make camera movement easier within the 3d render. being able to adjust height would be good"
                 + '<div class="grp r3d-move"><span class="label">Move round</span>'
                 '<div class="r3d-eyerow"><label for="r3d-eye">Eye height</label><input type="range" id="r3d-eye" min="40" max="220" step="5" value="160">'
                 '<output id="r3d-eyeout" for="r3d-eye">160 cm</output></div>'
                 '<div class="seg" role="group" aria-label="Eye height"><button type="button" data-eye="115">Sitting, 115</button><button type="button" data-eye="160">Standing, 160</button>'
                 '<button type="button" data-eye="210">High, 210</button><button type="button" data-level="1">Level the view</button></div></div>'
                 + seg("cam", [("orbit", "Circle round a spot"), ("look", "Look round from here")], "Dragging the room")
                 + seg("pad", [("on", "Show"), ("off", "Hide")], "Move buttons on the room")
                 + seg("labels", [("on", "Show"), ("off", "Hide")], "The numbered labels on the room")
                 + '<div class="grp r3d-sharegrp"><span class="label">Share this view</span><div class="seg"><button type="button" class="chip" id="r3d-link"><span class="ms" aria-hidden="true">link</span> Copy link to this view</button></div>'
                 '<span class="caption" id="r3d-linkst" aria-live="polite">The link opens the room on this view, with your table, lights, paint, decor and suggestions.</span></div>'
                 + '<div class="grp r3d-save"><button class="btn primary" type="button" id="r3d-save">Save as HD picture</button>'
                 '<span class="caption" id="r3d-savest" aria-live="polite">3840 × 2160, with shadows</span></div>'
                 + (f'<div class="grp"><span class="label">HD pictures (tap one to see it big)</span>{gallery.replace(chr(34) + "gallery" + chr(34), chr(34) + "gallery r3d-gal" + chr(34), 1)}</div>' if gallery else "")
                 + '<p class="caption"><b>Tap something in the room to work it:</b> doors open, drawers pull out, lights switch, the blind rolls up.</p>'
                 + '<p class="caption">Drag to look round, pinch to zoom. Keys: WASD walk, Q E turn, R F up and down.</p></details>',
        # v31, client: "upgrade the views and layouts area of the site to ensure it reflects our recent upgrades": grouped, the compact cabinet
        # first, with what goes beside it, how it opens, the floor it needs, and ready-made set-ups to try
        # v39: Room, by place (the approved redesign): the set-ups, then one main choice for each place; the rest under More
        "room": "".join([
            '<div class="grp r3d-tryrow"><button type="button" class="r3d-try" id="r3d-try" role="switch" aria-checked="false">Try options <i aria-hidden="true"></i></button>'
            '<span class="caption">What else could go in each place</span></div>',
            '<div class="seg r3d-moments r3d-momrow" role="group" aria-label="Try a set-up">'
            '<button type="button" data-moment="dinner">Dinner for six</button><button type="button" data-moment="film">Film night</button>'
            '<button type="button" data-moment="games">Games night</button><button type="button" data-moment="drinks">Drinks</button>'
            '<button type="button" data-moment="four">Lunch for four</button><button type="button" data-moment="morning">Morning</button></div>',
            seg("dining", [("folded", "Folded"), ("four", "Four"), ("six", "Six")], "Dining wall and bar · the table"),
            seg("drawers", [("in", "In"), ("out", "Out")], "Media wall · the drawers"),
            seg("ctop", [("down", "Lid down"), ("up", "Lid up")], "The sofa · the record table"),
            seg("plants", [(k, {"corner": "In the corner", "breast": "By the breast"}.get(k, v["name"])) for k, v in G.PLANT_LAYOUTS.items()], "Window corner · the plant stand"),
            '<details class="r3d-more r3d-fold"><summary>More: the chair door, watch it open, the curtains</summary>',
            seg("cabw", [("90", f"{G.CAB['top'][0]:g} wide (the plan)"), ("80", f"{G.CAB80['top'][0]:g} wide, four chairs")], "The table's width"),
            seg("tdoor", [("shut", "Shut"), ("open", "Open")], "The table door"),
            seg("chairs", [("cupboard", "Shut"), ("open", "Open")], "The chair door"),
            '<div class="grp"><div class="seg"><button type="button" class="chip" data-showopen="1"><span class="ms" aria-hidden="true">play_arrow</span> Watch it open</button></div></div>',
            seg("foot", [("off", "Hide"), ("on", "Show")], "The floor it needs, open"),
            '<div class="grp"><div class="seg"><button type="button" data-tog="curtains" aria-pressed="false">Curtains drawn</button></div></div>',
            BESIDE_SEG,
            '</details>',
            '<details class="r3d-more r3d-fold" id="r3d-optfold"><summary>Options, ideas and your own furniture</summary>',
            opts_html(), picks, ideas_g, sugg_g,
            '<p class="caption"><button type="button" class="chip" data-nav="ideas">Every idea, with pictures</button></p></details>',
            # v39, item 13: "Save my plan"; v50, client: "Improve the save copy paste criteria and selection to get better info ... now
            # we have a lot of custom options": choose what goes in, read it, then share, copy or save it for us
            '<div class="grp"><div class="seg"><button type="button" class="btn primary" data-myplan="1" aria-expanded="false" aria-controls="r3d-planbox"><span class="ms" aria-hidden="true">send</span> Save my plan</button></div>'
            '<span class="caption" id="r3d-myplanst" aria-live="polite">Everything you\'ve set, to send us.</span></div>'
            '<div class="r3d-planbox" id="r3d-planbox" hidden>'
            '<div class="r3d-setups" id="r3d-setups" hidden></div>'
            '<input type="text" id="r3d-planname" maxlength="60" placeholder="Name it, e.g. Our plan, 24 Oct" aria-label="A name for this plan">'
            '<fieldset class="r3d-planinc"><legend class="label">Put in</legend>'
            + "".join(f'<label><input type="checkbox" data-inc="{k}" checked> {t}</label>' for k, t in (
                ("picks", "Picks and costs"), ("setup", "The room's set-up"), ("colours", "Colours and decor"), ("lights", "Lights"),
                ("moves", "Furniture moved or added"), ("link", "A link to the room")))
            + '<label><input type="checkbox" data-inc="changed"> Only what differs from the plan</label></fieldset>'
            '<textarea id="r3d-plantext" rows="9" readonly aria-label="What will be sent"></textarea>'
            '<div class="seg"><button type="button" class="btn primary" id="r3d-planshare" hidden><span class="ms" aria-hidden="true">ios_share</span> Share</button>'
            '<button type="button" class="btn" id="r3d-plancopy"><span class="ms" aria-hidden="true">content_copy</span> Copy</button>'
            '<button type="button" class="btn" id="r3d-plansave" hidden><span class="ms" aria-hidden="true">cloud_upload</span> Save for us</button></div></div>']),
        "measure": measure_panel(),
        "look": swatches + '<div class="grp"><span class="label">A feature wall</span><div class="seg" role="group" aria-label="A feature wall">'
                 '<button type="button" data-feature="breast">The breast in Green Smoke</button><button type="button" data-feature="media">The media wall in Green Smoke</button>'
                 '<button type="button" data-feature="none">All one colour</button></div></div>' + decor_main + '<details class="r3d-more r3d-fold"><summary>More: the oak, the floor, cushions, curtains</summary>' + trims + decor_g + '</details>',
    }


def opts_json():
    """v36: the option groups (ideas.OPTION_GROUPS) with what each item is, where it goes, its size and cost, and where to look."""
    import item_shots
    sug = {k: (t, size, c, where) for k, t, size, c, _why, where in ideas.SUGGEST}
    B = G.BESIDE
    extra = {"rail": ("An oak blanket rail beside the dining cabinet", f"{B['rail']['w']:g} wide, four 28 mm oak rails, 12 off the wall", (25, 45),
                      "On the wall beside the dining cabinet, under your black shelf: the open table door lies back over it while you eat."),
             "on": ("Your storage ottoman, the lid on", "76 × 76 × 45", None, "On the rug by the coffee table."),
             "off": ("Your storage ottoman, the lid off", f"{G.OTTO_GAMES['games']} square games and the cards inside", None, "On the rug by the coffee table."),
             # v37: built in beside the cabinet, and the shoe cabinets in the same place
             "barbeside": ("A bar built in beside the dining cabinet", f"{G.BAR_BUILT['w']:g} wide, an oak counter at {G.BAR_BUILT['counter']:g}, {G.BAR_BUILT['front']:g} deep; {G.BAR_BUILT['bottles']} bottles", (110, 200),
                           "Between the dining cabinet and the pipe boxing, fixed to the wall and the floor. Set the drinks out before you open the table: the open table door lies back over it."),
             "shoes": ("Two shoe cabinets beside the dining cabinet", f"two IKEA TRONES {G.TRONES[0]:g} × {G.TRONES[1]:g} × {G.TRONES[2]:g}, about eight pairs", (25, 30),
                       "On the wall between the dining cabinet and the pipe boxing, behind the open table door's line.")}
    view = {"rail": dict(view="beside"), "barbeside": dict(view="beside"), "shoes": dict(view="beside"), "on": dict(eye=[300, 150, -60], at=[238, 30, -157], fov=50), "off": dict(eye=[300, 150, -60], at=[238, 30, -157], fov=50)}
    groups = []
    for key, title, mode, note, items in ideas.OPTION_GROUPS:
        its = []
        for v, label, setv in items:
            t, size, cost, where = sug[v] if v in sug else extra[v]
            a = item_shots.AIM.get(f"3d_sg_{v}")
            aim = view.get(v) or (dict(eye=a[0], at=a[1], fov=a[2]) if a else None)
            its.append(dict(v=v, label=label, set=setv, title=t, size=size, cost=list(cost) if cost else None, where=where, aim=aim))
        groups.append(dict(k=key, title=title, mode=mode, note=note, items=its))
    return json.dumps(dict(groups=groups), separators=(",", ":"))


def opts_html():
    """v36, client: "make sure its clear how to manage all these options in the 3D room": Extras opens on one row per need."""
    rows = ""
    for key, title, mode, note, items in ideas.OPTION_GROUPS:
        btns = ('<button type="button" data-opt="%s:none" aria-pressed="false">None</button>' % key) if mode == "one" else ""
        btns += "".join(f'<button type="button" data-opt="{key}:{v}" aria-pressed="false">{html.escape(label)}</button>' for v, label, _s in items)
        how = {"one": "Pick one", "any": "Switch on any", "lid": "Open or shut"}[mode]
        rows += (f'<div class="r3d-optrow" data-optgrp="{key}"><h3 class="r3d-sub">{html.escape(title)} <span class="r3d-optmode">{how}</span></h3>'
                 f'<button type="button" class="chip r3d-optsee" data-optsee="{key}" aria-label="See it: {html.escape(title)}"><span class="ms" aria-hidden="true">visibility</span> See it</button>'
                 f'<div class="seg r3d-grid" role="group" aria-label="{html.escape(title)}">{btns}</div>'
                 f'<p class="caption" data-optcap="{key}" aria-live="polite">{html.escape(note)}</p></div>')
    return ('<div class="grp r3d-opts" id="r3d-opts"><span class="label">Storage and a bar: your options</span>'
            '<p class="caption r3d-opthow">Pick one and the room shows it; <b>None</b> takes it away. Your picks and their cost show below.</p>'
            # v37: everything off in one go, back to the plan as it is
            '<div class="seg r3d-optclear"><button type="button" class="chip" data-optclear="1"><span class="ms" aria-hidden="true">restart_alt</span> Clear all extras</button></div>'
            + rows + '</div>')


def picks_json():
    """v22: what "Your picks" needs to name and cost what's switched on (ideas.IDEAS and ideas.SUGGEST)."""
    out = {"ideas": {k: [t, c[0], c[1]] for k, t, _s, c, *_ in ideas.IDEAS},
           "sugg": {k: [t, c[0], c[1]] for k, t, _s, c, *_ in ideas.SUGGEST},
           "decor": {k: [lab, dict(opts)] for k, lab, opts in DECOR},
           "svar": {k: {v: n for v, n, _c in vs} for k, vs in ideas.SUGG_VARS.items()}}   # v28
    import costs, build_doc                                                              # v39: the plan's total, for the plan bar
    ov = costs.overview(build_doc.TRACK); out["plan"] = [sum(r[1] for r in ov), sum(r[2] for r in ov)]
    out["version"] = build_doc.VERSION                                                     # v50: named in a saved plan
    return json.dumps(out, separators=(",", ":"))


def _money(lo, hi):
    return f"£{lo:,}–{hi:,}"


def hotspots():
    """v25: the six numbered stickers on the room. at: the anchor in room cm; n: the wall's normal (room coords, the side the camera
    must be on to see it face on; None for the sofa); cut: the dolls'-house cutaway that opens that wall (room3d.js updateCut);
    view: Fly here; chapter: Open in the plan. Facts come from geometry, ideas and the buy list, so they follow the next round."""
    import build_doc as B
    def ph(*names):
        lo = sum(r[4] for r in B.TRACK if r[2] in names and r[4] is not None); hi = sum(r[5] for r in B.TRACK if r[2] in names and r[5] is not None)
        return _money(lo, hi)
    g = G
    pc_z = (g.PC_Z[0] + g.PC_Z[1]) / 2
    rug_w, rug_d = g.RUG["x"][1] - g.RUG["x"][0], g.RUG["z"][1] - g.RUG["z"][0]
    pl = g.PLANT_LAYOUTS["corner"]["plants"]
    PS = g.PLANT_STAND
    # v46, client: "drill down into tasks for each piece of the room when I click on them": six places, each card lists its pieces
    import pieces as P, chapters as C
    out = []
    for pid, name, hue, at, nrm, cut, view, chapter in P.PLACES:
        ps = [p for p in P.PIECES if p["place"] == pid]
        lo = sum(r[3] for p in ps for r in C.buy_rows(p["buy"])); hi = sum(r[4] for p in ps for r in C.buy_rows(p["buy"]))
        out.append(dict(id=pid, short=name, n=len(out) + 1, name=name, hue=hue, at=at, nrm=nrm, cut=cut, view=view, chapter=chapter,
                        facts=[f"{len(ps)} {'piece' if len(ps) == 1 else 'pieces'}", _money(lo, hi)],
                        pieces=[[("job-" if p.get("job") else "mk-") + p["key"], p["title"]] for p in ps]))
    return out


def section(gallery=""):
    """v25: the room as the home screen. The stage fills the screen; the stickers sit on it; the Tools pill (laptop) or the bottom
    bar's Tools button (phone, in build_viewer) opens the five panels; Edit room is a bubble beside them."""
    panels = controls(gallery)
    bubbles = "".join(f'<button type="button" class="r3d-bub" role="tab" id="r3d-dt-{k}" aria-controls="r3d-dp-{k}" aria-selected="false" data-drawer="{k}" style="--h:{h}">'
                      f'<i class="ms" aria-hidden="true">{ic}</i>{html.escape(n)}</button>' for k, n, ic, h in DRAWERS)
    drawers = "".join(f'<div class="r3d-ui r3d-dpanel" role="tabpanel" id="r3d-dp-{k}" aria-labelledby="r3d-dt-{k}" hidden><h2>{html.escape(n)}</h2>{panels[k]}</div>' for k, n, *_ in DRAWERS)
    stickers = "".join(f'<button type="button" class="stk" data-hot="{h["id"]}" style="--h:{h["hue"]};--tilt:0deg" aria-expanded="false" aria-controls="r3d-pop" aria-label="{html.escape(h["name"])}" hidden>'
                       f'<b aria-hidden="true"></b><span class="t">{html.escape(h["name"])}</span></button>' for h in hotspots())
    # v33, the phone home: a strip of the places (tap one to fly there and open its card) and the set-ups as chips, under the room
    places = "".join(f'<button type="button" data-place="{h["id"]}" style="--h:{h["hue"]}"><b>{h["n"]}</b>{html.escape(h.get("short", h["name"]))}</button>' for h in hotspots())
    moments = "".join(f'<button type="button" data-moment="{k}"><span class="ms" aria-hidden="true">{ic}</span>{t}</button>'
                      for k, ic, t in (("dinner", "dinner_dining", "Dinner for six"), ("four", "lunch_dining", "Lunch for four"), ("film", "movie", "Film night"), ("morning", "wb_sunny", "Morning"),
                                     ("games", "casino", "Games night"), ("drinks", "local_bar", "Drinks")))   # v37
    data = json.dumps(json.loads((HERE / "scene3d.json").read_text()), separators=(",", ":"))
    return f"""<div class="r3d" id="r3d">
  <div class="r3d-stage"><canvas tabindex="0" aria-label="The living room in 3D: drag to look round, scroll or pinch to zoom; WASD or the arrow keys walk, Q and E turn"></canvas>
    <img class="r3d-poster" data-art="3d_room" alt="" aria-hidden="true">
    <div class="r3d-msg" id="r3d-msg">Loading the 3D room…</div>
    <p class="r3d-cap sr-only" id="r3d-cap"></p>
    <div class="r3d-stickers" id="r3d-stickers">{stickers}</div>
    <!-- v39: your plan and its total; Try options shows what else could go in each place, with the change to the total -->
    <div class="r3d-planbar" id="r3d-planbar"><span class="r3d-plansum" id="r3d-plansum" aria-live="polite">Your plan</span></div>
    <button type="button" class="r3d-back" id="r3d-back" hidden><span class="ms" aria-hidden="true">arrow_back</span> Back to my plan</button>
    <div class="r3d-tour" id="r3d-tour" role="region" aria-label="Tour of the room" aria-live="polite" hidden><span class="r3d-tourn" id="r3d-tourn"></span><h3 id="r3d-tourh"></h3><p id="r3d-tourp"></p>
      <div class="acts"><button type="button" data-tour="prev" aria-label="Back one stop"><span class="ms" aria-hidden="true">skip_previous</span></button><button type="button" data-tour="pause" aria-label="Pause"><span class="ms" aria-hidden="true">pause</span></button><button type="button" data-tour="next" aria-label="Next stop"><span class="ms" aria-hidden="true">skip_next</span></button><button type="button" class="end" data-tour="stop">End the tour</button></div>
      <i class="r3d-tourbar"><b id="r3d-tourbar"></b></i></div>
    <div class="r3d-tour r3d-show" id="r3d-show" role="region" aria-label="Watch it open" aria-live="polite" hidden><span class="r3d-tourn" id="r3d-shown"></span><h3 id="r3d-showh"></h3><p id="r3d-showp"></p>
      <div class="acts"><button type="button" data-show="prev" aria-label="Back a step"><span class="ms" aria-hidden="true">skip_previous</span></button><button type="button" data-show="pause" aria-label="Pause"><span class="ms" aria-hidden="true">pause</span></button><button type="button" data-show="next" aria-label="Next step"><span class="ms" aria-hidden="true">skip_next</span></button><button type="button" class="end" data-show="stop">Stop</button></div>
      <i class="r3d-tourbar"><b id="r3d-showbar"></b></i></div>
    <div class="r3d-toast" id="r3d-toast" role="status" hidden></div>
    <div class="r3d-pad" id="r3d-pad" role="group" aria-label="Move the camera (hold a button to keep moving)" hidden><button type="button" data-walk="tl" aria-label="Turn left" title="Turn left"><span class="ms" aria-hidden="true">rotate_left</span></button><button type="button" data-walk="f" aria-label="Walk forward" title="Walk forward"><span class="ms" aria-hidden="true">arrow_upward</span></button><button type="button" data-walk="tr" aria-label="Turn right" title="Turn right"><span class="ms" aria-hidden="true">rotate_right</span></button><button type="button" data-walk="u" aria-label="Up" title="Up"><span class="ms" aria-hidden="true">keyboard_arrow_up</span></button><button type="button" data-walk="l" aria-label="Step left" title="Step left"><span class="ms" aria-hidden="true">arrow_back</span></button><button type="button" data-walk="b" aria-label="Walk back" title="Walk back"><span class="ms" aria-hidden="true">arrow_downward</span></button><button type="button" data-walk="r" aria-label="Step right" title="Step right"><span class="ms" aria-hidden="true">arrow_forward</span></button><button type="button" data-walk="dn" aria-label="Down" title="Down"><span class="ms" aria-hidden="true">keyboard_arrow_down</span></button></div>
    <div class="r3d-mini" role="group" aria-label="The view"><button type="button" class="r3d-minib" id="r3d-home" title="The whole house: pick a floor, then a room (H)"><span class="ms" aria-hidden="true">home</span><span class="t">Whole house</span></button><button type="button" class="r3d-minib r3d-lbl" id="r3d-lbl" aria-pressed="true" title="Show or hide the labels on the room"><span class="ms" aria-hidden="true">label_off</span><span class="t">Hide labels</span></button><div class="r3d-floors r3d-rmode" id="r3d-rmode" role="group" aria-label="How to see the room" hidden><button type="button" data-rmode="in" aria-pressed="true" title="In the room, wide"><span class="ms" aria-hidden="true">visibility</span><span class="t">In it</span></button><button type="button" data-rmode="above" aria-pressed="false" title="From above, the ceiling off"><span class="ms" aria-hidden="true">map</span><span class="t">Above</span></button><button type="button" data-rmode="alone" aria-pressed="false" title="The room on its own, the rest of the house away"><span class="ms" aria-hidden="true">deployed_code</span><span class="t">On its own</span></button></div><div class="r3d-floors r3d-rmode" id="r3d-fview" role="group" aria-label="How to see the floor" hidden><button type="button" data-hfview="angle" aria-pressed="true" title="The whole floor from an angle"><span class="ms" aria-hidden="true">view_in_ar</span><span class="t">Angled</span></button><button type="button" data-hfview="top" aria-pressed="false" title="The whole floor from straight above"><span class="ms" aria-hidden="true">map</span><span class="t">Overhead</span></button><button type="button" id="r3d-pick" aria-pressed="false" title="Hide the floor and room buttons to see more (tap again to bring them back)"><span class="ms" aria-hidden="true">unfold_less</span><span class="t">Hide buttons</span></button></div><div class="r3d-floors" id="r3d-floors" role="group" aria-label="Floors" hidden><button type="button" data-hfloor="all" aria-pressed="true">Outside</button><button type="button" data-hfloor="first" aria-pressed="false">First</button><button type="button" data-hfloor="ground" aria-pressed="false">Ground</button><button type="button" data-hfloor="lower" aria-pressed="false">Lower</button><span class="sep" aria-hidden="true"></span><button type="button" class="tog" data-htog="hgarden" aria-pressed="false">Gardens</button><button type="button" class="tog" data-htog="hstreet" aria-pressed="false">Next door</button></div><div class="r3d-floors r3d-hrooms" id="r3d-hrooms" role="group" aria-label="Rooms" hidden></div></div>
    <div class="r3d-pop" id="r3d-pop" role="dialog" aria-modal="false" aria-labelledby="r3d-pop-h" hidden><button type="button" class="x" aria-label="Close"><span class="ms" aria-hidden="true">close</span></button>
      <h3 id="r3d-pop-h"></h3><ul class="facts"></ul><ul class="r3d-pcs" aria-label="Its pieces"></ul><div class="acts"><button type="button" data-popgo="fly">Fly here</button><button type="button" data-popgo="plan">Read about it</button></div></div>
    <div class="r3d-pop r3d-act" id="r3d-act" role="dialog" aria-modal="false" aria-labelledby="r3d-act-h" hidden><button type="button" class="x" aria-label="Close"><span class="ms" aria-hidden="true">close</span></button>
      <h3 id="r3d-act-h"></h3><p class="st" id="r3d-act-st" aria-live="polite"></p><div class="acts" id="r3d-acts"></div></div>
    <div class="r3d-edit">
      <div class="r3d-editbar" id="r3d-editbar" hidden><button type="button" id="r3d-editdone" class="primary">✓ Done</button><button type="button" id="r3d-add">+ Add</button><button type="button" id="r3d-undo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button type="button" id="r3d-layreset">Reset layout</button>
        <button type="button" class="r3d-share" id="r3d-share" hidden title="Save this layout so Emma and Dave both see it">Save for both of you</button><button type="button" class="r3d-share" id="r3d-useshared" hidden>Use the shared layout</button><span class="r3d-hint" id="r3d-sharest" aria-live="polite"></span>
        <span class="r3d-hint">Drag a thing to move it (it snaps to a wall within 15 cm); tap it to turn, recolour, copy or remove it. Tap a wall, the ceiling or the skirting to paint it.</span></div>
      <div class="r3d-addlist" id="r3d-addlist" hidden></div>
      <div class="r3d-sel" id="r3d-sel" hidden><b id="r3d-selname"></b><span class="r3d-size" id="r3d-selsize"></span><button type="button" data-sel="turn" title="A quarter turn; against a wall it stays against it">⟳ Turn</button><button type="button" data-sel="turn45" title="An eighth of a turn">45°</button><button type="button" data-sel="turn15" title="15°; hold Shift for 5°">15°</button><button type="button" data-sel="wall" title="Push it to the nearest wall, its back to the wall">⇥ Back to the wall</button>
        <label>Colour <input type="color" id="r3d-selcol" value="#888888"></label><span id="r3d-swatches" hidden></span>
        <button type="button" data-sel="copy" hidden>Copy</button><button type="button" data-sel="remove">Remove</button><button type="button" data-sel="done">Done</button></div></div>
  </div>
  <div class="r3d-dock"><button type="button" class="r3d-toolsbtn" data-tools-toggle aria-expanded="false" aria-controls="r3d-panel"><span class="ms" aria-hidden="true">tune</span>Tools</button>
    <div class="r3d-bubbles" role="tablist" aria-label="3D room controls"><button type="button" class="r3d-bub r3d-menub" id="r3d-menub" aria-expanded="false" aria-controls="rail-list" style="--h:280" hidden><i class="ms" aria-hidden="true">menu</i>Menu</button>{bubbles}
      <button type="button" class="r3d-bub" id="r3d-editbtn" aria-pressed="false" style="--h:25" title="Move, turn, recolour, remove and add things; tap a wall to paint it"><i class="ms" aria-hidden="true">edit</i>Edit</button></div></div>
  <div class="r3d-panel" id="r3d-panel" role="region" aria-label="3D room controls" hidden><button type="button" class="r3d-px" data-tools-toggle aria-label="Close the tools"><span class="ms" aria-hidden="true">close</span></button>
    <div class="r3d-pscroll">{drawers}</div>
    </div>
</div>
<script type="application/json" id="picks-data">{picks_json()}</script>
<script type="application/json" id="scene3d-data">{data}</script>
<script type="application/json" id="scenes-data">{scenes_json()}</script>
<script type="application/json" id="lightrules-data">{rules_json()}</script>
<script type="application/json" id="svar-data">{svar_json()}</script>
<script type="application/json" id="opt-data">{opts_json()}</script>
<script type="application/json" id="tour-data">{json.dumps(dict(stops=tour(), pages=PAGES_URL), separators=(",", ":"))}</script>
<script type="application/json" id="hotspots-data">{json.dumps(hotspots(), separators=(",", ":"))}</script>
<script type="module">{(HERE / "room3d.js").read_text()}</script>
<script type="module">{(HERE / "measure.js").read_text()}</script>
<script>{DRAWER_JS}</script>
<script>setTimeout(() => {{ const r = document.getElementById("r3d"), m = document.getElementById("r3d-msg");
  if (r && !r.classList.contains("ready") && !r.classList.contains("nogl")) m.innerHTML = 'The 3D room needs a moment, or your connection blocked its 3D library. The <a href="#plan" data-go="views">drawn views</a> show every option.'; }}, 20000);</script>"""


def standalone(path=HERE / "room3d_test.html"):
    css = "body{margin:0;background:#fbf6ec;font:15px system-ui}"
    path.write_text(f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                    f'<title>Room in 3D</title>{IMPORTMAP}<style>{css}{CSS}</style></head><body><div class="wrap">{section()}</div></body></html>')
    return path


EMBED_CSS = """
/* V1 (Demma's Home): the room as the app's 3D component (?embed): none of this page's own controls; the app's sheets and tabs do it all.
   Look and Room (the living room's paints, lights and options) open this page's own panel on request, over the room. */
html, body { margin: 0; height: 100%; background: #e9e4d8; overflow: hidden; }
.r3d.embed .r3d-stage { background: #e9e4d8; }
.r3d.embed .r3d-dock, .r3d.embed .r3d-mini, .r3d.embed .r3d-stickers, .r3d.embed .r3d-planbar, .r3d.embed .r3d-back, .r3d.embed #r3d-pop,
.r3d.embed #r3d-act, .r3d.embed #r3d-tour, .r3d.embed .r3d-toast, .r3d.embed .r3d-pad, .r3d.embed .r3d-cap { display: none !important; }
.r3d.embed:not(.emb-panel) .r3d-panel { display: none !important; }
.r3d.embed:not(.emb-edit) .r3d-edit { display: none !important; }
.r3d.embed .r3d-msg { color: #1d2a22; text-shadow: none; font: 600 15px Figtree, system-ui, sans-serif; }
.r3d.embed .r3d-poster { opacity: 1; }
"""


def embed(path, art="../art/"):
    """V1: the 3D room as its own page for the app's frame (_site/room/index.html): the room and the house, driven by messages (room3d.js,
    the bridge at its end). The pictures its panels show come from `art`.
    V1 (Phase 4, load in parts): the 3D's data and script are files of their own, named by their contents (scene.<hash>.json,
    room3d.<hash>.js), so a phone keeps them (the service worker, the browser's cache) until a round changes them: the page itself is
    small, and a second visit starts without downloading 2 MB again."""
    import hashlib
    out = pathlib.Path(path).parent; out.mkdir(parents=True, exist_ok=True)
    for old in list(out.glob("scene.*.json")) + list(out.glob("room3d.*.js")):
        old.unlink()
    data = json.dumps(json.loads((HERE / "scene3d.json").read_text()), separators=(",", ":"))
    js = (HERE / "room3d.js").read_text()
    h = lambda s: hashlib.sha256(s.encode()).hexdigest()[:10]
    scene, script = f"scene.{h(data)}.json", f"room3d.{h(js)}.js"
    (out / scene).write_text(data); (out / script).write_text(js)
    body = section()
    i = body.index('<script type="application/json" id="scene3d-data">'); j = body.index("</script>", i)
    body = body[:i] + '<script type="application/json" id="scene3d-data">' + body[j:]
    boot = (f'<script type="module">const r = await fetch({json.dumps(scene)}); document.getElementById("scene3d-data").textContent = await r.text();'
            f' await import({json.dumps("./" + script)});</script>')
    i = body.index('<script type="module">'); j = body.index("</script>", i) + len("</script>")
    body = body[:i] + boot + body[j:]
    head = (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            f'<title>Demma\'s Home: the 3D room</title>{IMPORTMAP}'
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fredoka:wght@500;600&display=swap">'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,500,1,0&display=block">'
            f'<style>{CSS}{EMBED_CSS}</style>'
            f'<script>function arts(el) {{ if (el) el.querySelectorAll("img[data-art]:not([src])").forEach(im => {{ im.src = {json.dumps(art)} + im.dataset.art + ".webp"; }}); }}'
            'document.addEventListener("DOMContentLoaded", () => arts(document.body));</script></head><body>')
    pathlib.Path(path).write_text(head + body.replace('<div class="r3d" id="r3d">', '<div class="r3d embed" id="r3d">', 1) + "</body></html>")
    return path


if __name__ == "__main__":
    print(standalone())
