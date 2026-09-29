/* NewsGame widget loader v1.
   Usage on a publisher page:
     <div class="news-game" data-placement="article-end" data-article-id="us-elias-2-24b" data-lang="en"></div>
     <script async src=".../widget/v1.js" data-site="demo-us"></script>
   Finds .news-game containers, reads catalog.json, shows a teaser when the block nears the viewport,
   and opens the game in a sandboxed iframe only after a click. Any failure hides the block. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var base = new URL("../", script.src);
  var site = script.getAttribute("data-site") || "";
  var eventsUrl = script.getAttribute("data-events");
  var preview = script.getAttribute("data-preview") === "1";
  var TIMEOUT = 5000;
  var TYPES = { ready: 1, resize: 1, start: 1, complete: 1, error: 1, exit: 1 };
  var catalogPromise;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

  function emit(type, box, extra) {
    var e = { time: new Date().toISOString(), type: type, site: site, articleId: box.getAttribute("data-article-id"),
              placement: box.getAttribute("data-placement") || "", preview: preview };
    if (extra) for (var k in extra) e[k] = extra[k];
    if (window.console && console.table) console.table([e]);
    try { document.dispatchEvent(new CustomEvent("newsgame:event", { detail: e })); } catch (err) { /* old browser */ }
    if (eventsUrl) {
      try { fetch(eventsUrl, { method: "POST", body: JSON.stringify(e), headers: { "Content-Type": "application/json" }, keepalive: true }).catch(function () {}); } catch (err) { /* ignore */ }
    }
  }

  function hide(box) { box.style.display = "none"; box.setAttribute("aria-hidden", "true"); }

  function catalog() {
    if (!catalogPromise) {
      catalogPromise = fetch(new URL("catalog.json", base).href, { credentials: "omit" })
        .then(function (r) { if (!r.ok) throw new Error("catalog " + r.status); return r.json(); });
    }
    return catalogPromise;
  }

  function pick(map, lang) {
    lang = (lang || "").toLowerCase();
    if (map[lang]) return { lang: lang, t: map[lang] };
    var p = lang.slice(0, 2);
    for (var k in map) if (k.slice(0, 2) === p) return { lang: k, t: map[k] };
    var first = Object.keys(map)[0];
    return { lang: first, t: map[first] };
  }

  var CSS =
    ":host{display:block;margin:32px 0;font:inherit;color:inherit}" +
    ".t{display:grid;gap:8px;padding:18px 20px 20px;border-top:4px solid currentColor;border-radius:0 0 10px 10px;" +
      "background:var(--ng-surface,rgba(127,127,127,.08))}" +
    ".l{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ng-accent,#2f4de0)}" +
    ".i{display:grid;grid-template-columns:repeat(2,6px);gap:2px}.i b{width:6px;height:6px;background:var(--ng-accent,#2f4de0)}.i b:last-child{background:var(--ng-pop,#ffcc33)}" +
    "h3{margin:0;font-size:1.3em;line-height:1.25}p{margin:0;opacity:.8}" +
    ".f{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:4px}" +
    "button{font:inherit;font-weight:700;min-height:44px;padding:0 20px;border:0;border-radius:999px;cursor:pointer;" +
      "background:var(--ng-pop,#ffcc33);color:#14182b}" +
    "button:focus-visible{outline:2px solid var(--ng-accent,#2f4de0);outline-offset:3px}" +
    ".n{font-size:13px;opacity:.65}" +
    "iframe{display:block;width:100%;border:0;border-radius:10px;background:transparent;height:460px}" +
    "@media (prefers-reduced-motion:no-preference){iframe{transition:height .2s ease}}";

  function setup(box) {
    if (box.getAttribute("data-ng-ready")) return;
    box.setAttribute("data-ng-ready", "1");
    var articleId = box.getAttribute("data-article-id");
    var pageLang = box.getAttribute("data-lang") || document.documentElement.lang || "en";
    emit("config_request", box);

    catalog().then(function (cat) {
      var s = cat.sites && cat.sites[site];
      var g = cat.games && cat.games[articleId];
      var expired = g && g.expires && new Date(g.expires + "T23:59:59Z") < new Date();
      if (!s || !s.enabled || !g || !g.enabled || expired) { hide(box); return; }
      var chosen = pick(g.teaser, pageLang);

      var shown = false;
      function show() {
        if (shown) return;
        shown = true;
        renderTeaser(box, g, chosen, articleId);
      }
      if (!("IntersectionObserver" in window)) return show();
      var near = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { near.disconnect(); show(); }
      }, { rootMargin: "400px 0px" });
      near.observe(box);
    }).catch(function (err) {
      hide(box);
      if (window.console) console.warn("[newsgame] widget unavailable:", err && err.message);
    });
  }

  function renderTeaser(box, g, chosen, articleId) {
    var root = box.shadowRoot || box.attachShadow({ mode: "open" });
    var t = chosen.t;
    root.innerHTML = "";
    var style = document.createElement("style"); style.textContent = CSS;
    var wrap = document.createElement("div"); wrap.className = "t"; wrap.setAttribute("lang", chosen.lang);
    wrap.innerHTML = '<div class="l"><span class="i" aria-hidden="true"><b></b><b></b><b></b><b></b></span><span></span></div><h3></h3><p></p><div class="f"><button type="button"></button><span class="n"></span></div>';
    wrap.querySelector(".l span:last-child").textContent = t.label;
    wrap.querySelector("h3").textContent = t.title;
    wrap.querySelector("p").textContent = t.text;
    wrap.querySelector("button").textContent = t.cta;
    wrap.querySelector(".n").textContent = t.note || "";
    root.appendChild(style);
    root.appendChild(wrap);

    if ("IntersectionObserver" in window) {
      var vis = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.intersectionRatio >= 0.5; })) { vis.disconnect(); emit("visible", box, { gameId: articleId }); }
      }, { threshold: [0.5] });
      vis.observe(box);
    }

    wrap.querySelector("button").addEventListener("click", function () { launch(box, root, wrap, g, chosen.lang, articleId); });
  }

  function launch(box, root, teaser, g, lang, articleId) {
    var sid = uid();
    emit("launch", box, { gameId: articleId, sessionId: sid });
    var src = new URL(g.path, base);
    src.searchParams.set("origin", location.origin);
    src.searchParams.set("lang", lang);
    src.searchParams.set("sid", sid);
    if (preview) src.searchParams.set("preview", "1");

    var frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("title", teaser.querySelector("h3").textContent);
    frame.src = src.href;
    teaser.style.display = "none";
    root.appendChild(frame);

    var gameOrigin = base.origin;
    var ready = false;
    var timer = setTimeout(function () {
      if (!ready) { cleanup(); hide(box); emit("error", box, { gameId: articleId, sessionId: sid, payload: { message: "timeout" } }); if (window.console) console.warn("[newsgame] game did not answer in time"); }
    }, TIMEOUT);

    function onMessage(e) {
      if (e.source !== frame.contentWindow) return;
      if (e.origin !== "null" && e.origin !== gameOrigin) return;
      var d = e.data;
      if (!d || d.ns !== "newsgame" || d.v !== 1 || !TYPES[d.type] || d.sessionId !== sid) return;
      if (d.type === "ready") { ready = true; clearTimeout(timer); frame.focus(); }
      if (d.type === "resize" && d.payload && d.payload.height > 0) {
        frame.style.height = Math.min(Math.ceil(d.payload.height) + 2, Math.round(window.innerHeight * 0.9)) + "px";
        return;
      }
      emit(d.type, box, { gameId: d.gameId, sessionId: sid, payload: d.payload });
      if (d.type === "error") { cleanup(); hide(box); }
      if (d.type === "exit") {
        cleanup();
        teaser.style.display = "";
        teaser.querySelector("button").focus();
      }
    }
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    }
    window.addEventListener("message", onMessage);
  }

  function init() {
    var boxes = document.querySelectorAll(".news-game");
    for (var i = 0; i < boxes.length; i++) setup(boxes[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
