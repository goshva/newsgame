(function () {
  "use strict";

  var FORMSPREE = "https://formspree.io/f/mqpawjlp";
  var LANGS = ["en", "ru", "hi", "zh", "de"];
  var HTML_LANG = { en: "en", ru: "ru", hi: "hi", zh: "zh-CN", de: "de" };
  var current = "en";

  function t(key) {
    var dict = window.I18N[current] || window.I18N.en;
    return dict[key] != null ? dict[key] : (window.I18N.en[key] || "");
  }

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }

  function detectLang() {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(fromUrl) >= 0) return fromUrl;
    var saved = storageGet("ng-lang");
    if (LANGS.indexOf(saved) >= 0) return saved;
    var nav = (navigator.languages || [navigator.language || "en"]);
    for (var i = 0; i < nav.length; i++) {
      var p = String(nav[i]).toLowerCase().slice(0, 2);
      if (p === "ru" || p === "uk" || p === "be" || p === "kk" || p === "uz" || p === "ky") return "ru";
      if (LANGS.indexOf(p) >= 0) return p;
    }
    return "en";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function teaserCard(data) {
    var tile = el("span", { "class": "tile", "aria-hidden": "true" }, [el("i"), el("i"), el("i"), el("i")]);
    var play = el("button", { type: "button", "class": "btn play", text: data.cta });
    play.addEventListener("click", function () { openQuiz(data); });
    return el("article", { "class": "teaser", lang: HTML_LANG[data.lang] }, [
      el("div", { "class": "teaser-top" }, [tile, el("span", { text: data.label })]),
      el("h3", { text: data.title }),
      el("p", { text: data.text }),
      el("div", { "class": "teaser-foot" }, [play, data.sponsor ? el("span", { "class": "sponsor", text: data.sponsor }) : null])
    ]);
  }

  function renderTeasers() {
    var box = document.getElementById("teasers");
    box.textContent = "";
    window.TEASERS.forEach(function (d) {
      var cap = el("div", { "class": "cap" }, [
        el("span", { "class": "chip", text: t("name." + d.region) }),
        el("span", { "class": "chip chip-lang", text: d.lang.toUpperCase() }),
        el("span", {}, [document.createTextNode(t("ex.source") + ": "), el("a", { href: d.url, target: "_blank", rel: "noopener", text: d.source })])
      ]);
      box.appendChild(el("div", { "class": "teaser-wrap" }, [cap, teaserCard(d)]));
    });
    var heroId = window.HERO_TEASER[current];
    var hero = window.TEASERS.filter(function (d) { return d.id === heroId; })[0];
    var slot = document.getElementById("hero-teaser");
    slot.textContent = "";
    slot.appendChild(teaserCard(hero));
  }

  function applyLang(lang) {
    current = lang;
    document.documentElement.lang = HTML_LANG[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    document.querySelectorAll(".langs button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    document.querySelectorAll('input[name="language"]').forEach(function (i) { i.value = lang; });
    document.title = "NewsGame — " + t("hero.eyebrow");
    renderTeasers();
    storageSet("ng-lang", lang);
    var url = new URL(location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
  }

  // Demo quiz: three true/false questions in the teaser's own language.
  var dialog = document.getElementById("quiz");
  var lastFocus = null;

  function openQuiz(data) {
    lastFocus = document.activeElement;
    var ui = window.QUIZ_UI[data.lang];
    var box = dialog.querySelector(".quiz-in");
    dialog.setAttribute("lang", HTML_LANG[data.lang]);
    var step = 0, score = 0;

    function close() { dialog.close(); }

    function head() {
      var prog = el("div", { "class": "quiz-progress", "aria-hidden": "true" });
      data.quiz.forEach(function (_, i) { prog.appendChild(el("i", { "class": i < step ? "done" : "" })); });
      var x = el("button", { type: "button", "class": "x", "aria-label": ui.back, text: "×" });
      x.addEventListener("click", close);
      return el("div", { "class": "quiz-head" }, [el("strong", { id: "quiz-title", text: data.title }), prog, x]);
    }

    function question() {
      box.textContent = "";
      var q = data.quiz[step];
      var fb = el("p", { "class": "quiz-fb", role: "status", "aria-live": "polite" });
      var bt = el("button", { type: "button", "class": "btn", text: ui.t });
      var bf = el("button", { type: "button", "class": "btn", text: ui.f });
      function answer(val) {
        bt.disabled = bf.disabled = true;
        var right = val === q[1];
        if (right) score++;
        fb.className = "quiz-fb " + (right ? "ok" : "err");
        fb.textContent = (right ? ui.right : ui.wrong) + (q[2] ? " " + q[2] : "");
        setTimeout(function () { step++; step < data.quiz.length ? question() : result(); }, q[2] ? 2200 : 1100);
      }
      bt.addEventListener("click", function () { answer(true); });
      bf.addEventListener("click", function () { answer(false); });
      box.appendChild(head());
      box.appendChild(el("p", { "class": "quiz-q", text: q[0] }));
      box.appendChild(el("div", { "class": "quiz-btns" }, [bt, bf]));
      box.appendChild(fb);
      bt.focus();
    }

    function result() {
      box.textContent = "";
      var again = el("button", { type: "button", "class": "btn btn-ghost", text: ui.again });
      again.addEventListener("click", function () { step = 0; score = 0; question(); });
      var back = el("button", { type: "button", "class": "btn btn-main", text: ui.back });
      back.addEventListener("click", close);
      var src = el("a", { href: data.url, target: "_blank", rel: "noopener", text: data.source + " ↗" });
      box.appendChild(head());
      box.appendChild(el("p", { text: ui.score }));
      box.appendChild(el("p", { "class": "quiz-score", text: data.lang === "zh" ? score + " / " + data.quiz.length : score + " " + ui.of + " " + data.quiz.length }));
      box.appendChild(el("p", {}, [src]));
      box.appendChild(el("div", { "class": "ctas" }, [back, again]));
      back.focus();
    }

    question();
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
  }

  dialog.addEventListener("close", function () { if (lastFocus) lastFocus.focus(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

  // Forms: posted to Formspree with fetch so the visitor stays on the page.
  function wireForm(form) {
    var status = form.querySelector(".status");
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelectorAll("[aria-invalid]").forEach(function (n) { n.removeAttribute("aria-invalid"); });
      var invalid = Array.prototype.filter.call(form.elements, function (n) { return n.willValidate && !n.checkValidity(); });
      if (invalid.length) {
        invalid.forEach(function (n) { n.setAttribute("aria-invalid", "true"); });
        invalid[0].focus();
        invalid[0].reportValidity();
        return;
      }
      submit.disabled = true;
      status.className = "status";
      status.textContent = t("form.sending");

      fetch(FORMSPREE, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; });
        })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            form.querySelectorAll('input[name="language"]').forEach(function (i) { i.value = current; });
            status.className = "status ok";
            status.textContent = t(form.getAttribute("data-ok"));
            return;
          }
          var errs = (r.body && r.body.errors) || [];
          errs.forEach(function (er) {
            if (er.field && form.elements[er.field]) form.elements[er.field].setAttribute("aria-invalid", "true");
          });
          status.className = "status err";
          status.textContent = errs.length ? errs.map(function (er) { return er.message; }).join(" ") : t("form.err");
        })
        .catch(function () {
          status.className = "status err";
          status.textContent = t("form.err");
        })
        .then(function () { submit.disabled = false; });
    });
  }

  document.querySelectorAll(".langs button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });
  wireForm(document.getElementById("apply-form"));
  wireForm(document.getElementById("feedback-form"));
  applyLang(detectLang());
})();
