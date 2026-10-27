/* Demma's Home V1: the 3D, one component for the whole app (docs/V1_PLAN.md Phase 2.3, 4).
   One frame (room/index.html?embed: the room and the house, media-wall/src/room3d.js) made the first time a screen needs it, never
   moved in the page (a moved frame reloads), placed by CSS per screen. A still of the place shows at once; the 3D fades in over it when
   it's ready. Messages: {src: "demma", cmd} out, {src: "r3d", type} in. */
const subs = {};
let stage = null, frame = null, ready = false, queue = [], last = null, posterEl = null;

export const viewer = {
  get ready() { return ready; },
  init(el) {
    stage = el; posterEl = el.querySelector(".poster");
    addEventListener("message", ev => {
      const d = ev.data; if (!d || d.src !== "r3d" || (frame && ev.source !== frame.contentWindow)) return;
      if (d.type === "ready") {
        ready = true; stage.classList.add("live");
        if (last) post(last); queue.splice(0).forEach(post);
      }
      (subs[d.type] || []).forEach(fn => fn(d));
    });
  },
  ensure() {
    if (frame) return;
    frame = document.createElement("iframe");
    frame.title = "The house in 3D: drag to look round, pinch or scroll to zoom";
    frame.setAttribute("allow", "fullscreen");
    frame.src = "room/index.html?embed" + (/[?&]perf\b/.test(location.search) ? "&perf" : "");
    stage.prepend(frame);
  },
  poster(src) {
    if (!posterEl) return;
    if (src && posterEl.getAttribute("src") !== src) posterEl.src = src;
    if (!src) posterEl.removeAttribute("src");
  },
  go(o) { this.ensure(); last = Object.assign({ cmd: "go" }, o); if (ready) post(last); },
  send(cmd, o = {}) { const m = Object.assign({ cmd }, o); if (ready) post(m); else if (cmd !== "go") queue.push(m); },
  on(type, fn) { (subs[type] = subs[type] || []).push(fn); return () => { subs[type] = subs[type].filter(f => f !== fn); }; },
};

function post(m) { try { frame.contentWindow.postMessage(Object.assign({ src: "demma" }, m), "*"); } catch (e) {} }
