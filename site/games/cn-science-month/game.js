/* 猜数字 / Guess the number: slider estimates, score by closeness. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage");
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  function fmt(n, round) {
    if (round.scale === "percent") return Math.round(n) + "%";
    n = Math.round(n);
    if (NG.lang === "zh" && n >= 10000) {
      var w = n / 10000;
      return (w >= 100 ? Math.round(w) : Math.round(w * 10) / 10) + " 万";
    }
    return n.toLocaleString("en-US");
  }
  // Slider position 0..1000 <-> value
  function toValue(p, r) {
    if (r.scale === "percent") return r.min + (r.max - r.min) * p / 1000;
    var a = Math.log(r.min), b = Math.log(r.max);
    return Math.exp(a + (b - a) * p / 1000);
  }
  function points(g, r) {
    if (r.scale === "percent") return Math.round(100 * Math.max(0, 1 - Math.abs(g - r.answer) / 25));
    return Math.round(100 * Math.max(0, 1 - Math.abs(Math.log(g / r.answer)) / Math.log(4)));
  }

  function intro() {
    stage.textContent = "";
    var sw = el("button", { type: "button", "class": "ng-btn ng-small langswitch", text: T("switch"), onclick: function () {
      NG.lang = NG.lang === "zh" ? "en" : "zh";
      document.documentElement.lang = NG.lang === "zh" ? "zh-CN" : "en";
      NG.applyUi();
      intro();
    } });
    stage.appendChild(el("section", { "class": "ng-intro" }, [
      el("div", { "class": "row" }, [sw]),
      el("p", { text: T("intro") }),
      el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
    ]));
    stage.querySelector(".ng-main").focus();
  }
  intro();

  function play() {
    NG.start();
    var i = 0, total = 0;

    function round() {
      var r = data.rounds[i];
      stage.textContent = "";
      var value = el("p", { "class": "value", "aria-hidden": "true" });
      var slider = el("input", { type: "range", min: "0", max: "1000", step: "1", value: "500", "aria-label": T("slider") });
      function upd() { var v = fmt(toValue(+slider.value, r), r); value.textContent = v; slider.setAttribute("aria-valuetext", v); }
      slider.addEventListener("input", upd);
      var go = el("button", { type: "button", "class": "ng-btn ng-main", text: T("guess") });
      var reveal = el("div", { "class": "reveal", "aria-live": "polite", hidden: "" });
      go.addEventListener("click", function () {
        slider.disabled = true; go.disabled = true;
        var g = toValue(+slider.value, r), p = points(g, r);
        total += p;
        reveal.appendChild(el("p", {}, [T("answer"), el("strong", { text: fmt(r.answer, r) }), "  ·  " + T("yours") + fmt(g, r)]));
        reveal.appendChild(el("p", { "class": "pts", text: "+" + p + " " + T("points") }));
        reveal.appendChild(el("p", { text: NG.t(facts[r.fact].text) }));
        var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () {
          i++;
          if (i < data.rounds.length) round(); else finish();
        } });
        reveal.appendChild(el("div", {}, [next]));
        reveal.hidden = false;
        next.focus();
      });
      stage.appendChild(el("p", { "class": "round", text: T("round").replace("{n}", i + 1).replace("{total}", data.rounds.length) }));
      stage.appendChild(el("p", { "class": "prompt", text: NG.t(r.prompt) }));
      stage.appendChild(value);
      stage.appendChild(slider);
      stage.appendChild(go);
      stage.appendChild(reveal);
      upd();
      slider.focus();
    }

    function finish() {
      var max = data.rounds.length * 100;
      NG.finish({
        score: total, max: max,
        kicker: T("kicker"),
        scoreText: total + " / " + max,
        learned: NG.t(facts.museums.text) + " " + NG.t(facts.literacy.text)
      });
    }
    round();
  }
});
