/* Solar-Lückentext: pick a tile, then a gap. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage");
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  function answerOf(s) { return NG.lang === "en" ? data.answersEn[s.answer] : s.answer; }

  function intro() {
    stage.textContent = "";
    var sw = el("button", { type: "button", "class": "ng-btn ng-small", text: T("switch"), onclick: function () {
      NG.lang = NG.lang === "de" ? "en" : "de"; NG.applyUi(); intro();
    } });
    stage.appendChild(el("section", { "class": "ng-intro" }, [
      el("div", { "class": "row" }, [el("div", { "class": "sun", "aria-hidden": "true" }), sw]),
      el("p", { text: T("intro") }),
      el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
    ]));
    stage.querySelector(".ng-main").focus();
  }
  intro();

  function play() {
    NG.start();
    var chips = data.chips[NG.lang].slice().sort(function () { return Math.random() - 0.5; });
    var picked = null, filled = {}, locked = false; // gap index -> chip index
    stage.textContent = "";
    var list = el("ol", { "class": "sents" });
    var chipBox = el("div", { "class": "chips", role: "group", "aria-label": T("tiles") });
    var check = el("button", { type: "button", "class": "ng-btn ng-main", text: T("check"), disabled: "" });
    var fb = el("p", { "class": "ng-toast", "aria-live": "polite" });
    stage.appendChild(list);
    stage.appendChild(el("p", { "class": "lbl", text: T("tiles") }));
    stage.appendChild(chipBox);
    stage.appendChild(el("div", { "class": "row" }, [check]));
    stage.appendChild(fb);

    var gapBtns = data.sentences.map(function (s, i) {
      var g = el("button", { type: "button", "class": "gap" });
      g.addEventListener("click", function () {
        if (locked) return;
        if (picked !== null) {
          Object.keys(filled).forEach(function (k) { if (filled[k] === picked) delete filled[k]; });
          filled[i] = picked; picked = null;
        } else if (filled[i] !== undefined) {
          delete filled[i];
        }
        render();
      });
      list.appendChild(el("li", {}, [NG.t(s.before) + " ", g, " " + NG.t(s.after)]));
      return g;
    });
    var chipBtns = chips.map(function (c, i) {
      var b = el("button", { type: "button", "class": "ng-btn chip", "aria-pressed": "false", text: c });
      b.addEventListener("click", function () { if (locked) return; picked = picked === i ? null : i; render(); if (picked !== null) gapBtns[firstEmpty()].focus(); });
      chipBox.appendChild(b);
      return b;
    });
    function firstEmpty() { for (var i = 0; i < gapBtns.length; i++) if (filled[i] === undefined) return i; return 0; }

    function render() {
      var used = Object.keys(filled).map(function (k) { return filled[k]; });
      gapBtns.forEach(function (g, i) {
        var c = filled[i];
        g.textContent = c === undefined ? "…" : chips[c];
        g.classList.toggle("filled", c !== undefined);
        g.setAttribute("aria-label", T("gap") + " " + (i + 1) + ": " + (c === undefined ? T("empty") : chips[c]));
      });
      chipBtns.forEach(function (b, i) {
        b.classList.toggle("used", used.indexOf(i) >= 0);
        b.setAttribute("aria-pressed", String(picked === i));
      });
      if (used.length === gapBtns.length) check.removeAttribute("disabled"); else check.setAttribute("disabled", "");
    }
    render();
    chipBtns[0].focus();

    check.addEventListener("click", function () {
      locked = true;
      var ok = 0;
      data.sentences.forEach(function (s, i) {
        var right = chips[filled[i]] === answerOf(s);
        if (right) ok++;
        gapBtns[i].classList.add(right ? "ok" : "bad");
        if (!right) gapBtns[i].parentNode.appendChild(el("span", { "class": "fix", text: " → " + answerOf(s) }));
      });
      check.remove();
      chipBox.hidden = true;
      fb.textContent = ok + " " + T("of") + " " + data.sentences.length + " " + T("right") + ". " + NG.t(facts.pace.text);
      var next = el("button", { type: "button", "class": "ng-btn ng-main", text: "→", "aria-label": T("kicker"), onclick: function () {
        NG.finish({
          score: ok, max: data.sentences.length,
          kicker: T("kicker"),
          scoreText: ok + " " + T("of") + " " + data.sentences.length,
          note: T("right"),
          learned: NG.t(facts.record.text) + " " + NG.t(facts.share.text)
        });
      } });
      stage.appendChild(el("div", { "class": "row" }, [next]));
      next.focus();
    });
  }
});
