/* NewsGame runtime v1: shared shell for every game.
   Loads game.json, draws the header (restart / pause / back), talks to the widget loader over postMessage,
   reports its height and shows loading and error states. A game registers itself with NG.boot(fn). */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var embedded = window.parent !== window;
  var ALLOWED_PARENTS = [/^https:\/\/goshva\.github\.io$/, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
  var target = params.get("origin");
  if (!target || !ALLOWED_PARENTS.some(function (r) { return r.test(target); })) target = null;
  var sessionId = params.get("sid") || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  var gameId = document.documentElement.getAttribute("data-game");

  var UI = {
    en: { back: "Back to the article", restart: "Restart", pause: "Pause", resume: "Resume", loading: "Loading the game…",
          error: "The game could not load.", source: "Source", learned: "What you learned", again: "Play again", paused: "Paused" },
    ru: { back: "Вернуться к статье", restart: "Заново", pause: "Пауза", resume: "Продолжить", loading: "Загружаем игру…",
          error: "Игра не загрузилась.", source: "Источник", learned: "Что вы узнали", again: "Сыграть ещё", paused: "Пауза" },
    zh: { back: "返回文章", restart: "重新开始", pause: "暂停", resume: "继续", loading: "正在加载游戏…",
          error: "游戏加载失败。", source: "来源", learned: "你学到了", again: "再玩一次", paused: "已暂停" }
  };

  var NG = {
    embedded: embedded,
    sessionId: sessionId,
    lang: "en",
    data: null,
    ui: UI.en,
    _pause: [], _resume: [], _restart: null, paused: false
  };

  NG.send = function (type, payload) {
    if (!embedded || !target) return;
    parent.postMessage({ ns: "newsgame", v: 1, type: type, gameId: gameId, sessionId: sessionId, payload: payload || {} }, target);
  };

  // Pick the current language from a {lang: text} object, or return plain strings as they are.
  NG.t = function (v) {
    if (v == null || typeof v !== "object") return v;
    return v[NG.lang] != null ? v[NG.lang] : v[Object.keys(v)[0]];
  };

  NG.el = function (tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  };

  var started = false;
  NG.start = function () { if (!started) { started = true; NG.send("start"); } };
  NG.complete = function (score, max) { NG.send("complete", { score: score, max: max }); started = false; };

  NG.exit = function () {
    NG.send("exit");
    if (!embedded) location.href = NG.data && NG.data.demo ? NG.data.demo : "../";
  };

  NG.onPause = function (fn) { NG._pause.push(fn); pauseBtn.hidden = false; };
  NG.onResume = function (fn) { NG._resume.push(fn); };
  NG.setPaused = function (p) {
    if (p === NG.paused) return;
    NG.paused = p;
    pauseBtn.textContent = p ? NG.ui.resume : NG.ui.pause;
    pauseBtn.setAttribute("aria-pressed", String(p));
    (p ? NG._pause : NG._resume).forEach(function (fn) { fn(); });
  };

  // Final screen shared by all games: score, one learned fact, source link, back and replay.
  NG.finish = function (opts) {
    NG.complete(opts.score, opts.max);
    var stage = document.getElementById("stage");
    stage.textContent = "";
    var src = NG.data.article;
    stage.appendChild(NG.el("section", { "class": "ng-final", "aria-live": "polite" }, [
      NG.el("p", { "class": "ng-kicker", text: opts.kicker || "" }),
      NG.el("p", { "class": "ng-score", text: opts.scoreText }),
      opts.note ? NG.el("p", { "class": "ng-note", text: opts.note }) : null,
      NG.el("div", { "class": "ng-learned" }, [
        NG.el("strong", { text: NG.ui.learned }),
        NG.el("p", { text: opts.learned })
      ]),
      // Inside the sandboxed widget links cannot open new tabs, and the reader is already on the article.
      NG.el("p", { "class": "ng-src" }, [NG.ui.source + ": ", embedded
        ? NG.el("span", { text: src.publisher + " — " + NG.t(src.title) })
        : NG.el("a", { href: src.url, target: "_blank", rel: "noopener", text: src.publisher + " — " + NG.t(src.title) })]),
      NG.el("div", { "class": "ng-actions" }, [
        NG.el("button", { type: "button", "class": "ng-btn ng-main", text: NG.ui.back, onclick: NG.exit }),
        NG.el("button", { type: "button", "class": "ng-btn", text: NG.ui.again, onclick: function () { NG._restart(); } })
      ])
    ]));
    stage.querySelector(".ng-main").focus();
  };

  // Header
  var header, titleEl, pauseBtn, restartBtn, backBtn;
  function buildShell() {
    titleEl = NG.el("h1", { "class": "ng-title" });
    pauseBtn = NG.el("button", { type: "button", "class": "ng-btn ng-small", "aria-pressed": "false", hidden: "", onclick: function () { NG.setPaused(!NG.paused); } });
    restartBtn = NG.el("button", { type: "button", "class": "ng-btn ng-small", onclick: function () { NG.setPaused(false); if (NG._restart) NG._restart(); } });
    backBtn = NG.el("button", { type: "button", "class": "ng-btn ng-small ng-back", onclick: NG.exit });
    header = NG.el("header", { "class": "ng-head" }, [titleEl, NG.el("div", { "class": "ng-tools" }, [pauseBtn, restartBtn, backBtn])]);
    document.body.insertBefore(header, document.body.firstChild);
    var stage = document.getElementById("stage");
    stage.appendChild(NG.el("p", { "class": "ng-state", text: "…" }));
  }

  function applyUi() {
    NG.ui = UI[NG.lang] || UI.en;
    document.documentElement.lang = NG.lang === "zh" ? "zh-CN" : NG.lang;
    titleEl.textContent = NG.t(NG.data.title);
    document.title = NG.t(NG.data.title);
    pauseBtn.textContent = NG.paused ? NG.ui.resume : NG.ui.pause;
    restartBtn.textContent = NG.ui.restart;
    backBtn.textContent = NG.ui.back;
  }

  function showError(msg) {
    NG.send("error", { message: String(msg || "error").slice(0, 200) });
    var stage = document.getElementById("stage");
    stage.textContent = "";
    stage.appendChild(NG.el("div", { "class": "ng-state ng-error", role: "alert" }, [
      NG.el("p", { text: NG.ui.error }),
      NG.el("button", { type: "button", "class": "ng-btn ng-main", text: NG.ui.back, onclick: NG.exit })
    ]));
  }

  // Height reporting for the iframe
  var lastH = 0, queued = false;
  function reportSize() {
    queued = false;
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (Math.abs(h - lastH) > 2) { lastH = h; NG.send("resize", { height: h }); }
  }
  function queueSize() { if (!queued) { queued = true; requestAnimationFrame(reportSize); } }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !e.data || e.data.ns !== "newsgame" || e.data.v !== 1) return;
    if (e.data.type === "pause") NG.setPaused(true);
    if (e.data.type === "resume") NG.setPaused(false);
  });
  window.addEventListener("error", function (e) { showError(e.message); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && NG._pause.length) NG.setPaused(true); });

  NG.applyUi = function () { applyUi(); };

  NG.reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  NG.boot = function (run) {
    buildShell();
    document.querySelector(".ng-state").textContent = (UI[(params.get("lang") || "en").slice(0, 2)] || UI.en).loading;
    if ("ResizeObserver" in window) new ResizeObserver(queueSize).observe(document.documentElement);
    fetch("game.json")
      .then(function (r) { if (!r.ok) throw new Error("game.json " + r.status); return r.json(); })
      .then(function (data) {
        NG.data = data;
        var want = (params.get("lang") || "").slice(0, 2).toLowerCase();
        NG.lang = data.langs.indexOf(want) >= 0 ? want : data.langs[0];
        applyUi();
        NG._restart = function () {
          started = false;
          NG.gen = (NG.gen || 0) + 1; // games stop their loops when the generation changes
          NG._pause = []; NG._resume = []; NG.paused = false;
          pauseBtn.hidden = true; pauseBtn.textContent = NG.ui.pause; pauseBtn.setAttribute("aria-pressed", "false");
          document.getElementById("stage").textContent = "";
          run(NG, data);
          queueSize();
        };
        NG._restart();
        NG.send("ready", { lang: NG.lang });
      })
      .catch(showError);
  };

  window.NG = NG;
})();
