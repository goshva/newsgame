/* Crew-13 briefing: assign seats, then three mission questions. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage");
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  stage.appendChild(el("section", { "class": "ng-intro" }, [
    el("p", { text: T("intro") }),
    el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: roster })])
  ]));
  stage.querySelector("button").focus();

  var score = 0, seatScore = 0;

  function roster() {
    NG.start();
    score = 0;
    var picked = null, placed = {}; // slot id -> crew index
    stage.textContent = "";
    var names = el("div", { "class": "names", role: "group", "aria-label": T("step1") });
    var seats = el("div", { "class": "seats" });
    var check = el("button", { type: "button", "class": "ng-btn ng-main", text: T("check"), disabled: "" });
    var fb = el("p", { "class": "fb", "aria-live": "polite" });
    stage.appendChild(el("p", { "class": "step", text: T("step1") }));
    stage.appendChild(names);
    stage.appendChild(seats);
    stage.appendChild(el("div", { "class": "row" }, [check]));
    stage.appendChild(fb);

    var nameBtns = data.crew.map(function (c, i) {
      var b = el("button", { type: "button", "class": "ng-btn name", "aria-pressed": "false", text: c.name });
      b.addEventListener("click", function () {
        picked = picked === i ? null : i;
        nameBtns.forEach(function (x, j) { x.setAttribute("aria-pressed", String(j === picked)); });
      });
      names.appendChild(b);
      return b;
    });

    var seatBtns = {};
    data.slots.forEach(function (s) {
      var b = el("button", { type: "button", "class": "seat" });
      seatBtns[s.id] = b;
      b.addEventListener("click", function () {
        if (picked === null) {
          if (placed[s.id] !== undefined) { delete placed[s.id]; render(); }
          return;
        }
        Object.keys(placed).forEach(function (k) { if (placed[k] === picked) delete placed[k]; });
        placed[s.id] = picked;
        picked = null;
        render();
      });
      seats.appendChild(b);
    });

    function render() {
      data.slots.forEach(function (s) {
        var b = seatBtns[s.id], who = placed[s.id];
        b.textContent = "";
        b.appendChild(el("small", { text: NG.t(s.label) }));
        b.appendChild(el("strong", { text: who === undefined ? T("empty") : data.crew[who].name }));
        b.classList.toggle("filled", who !== undefined);
      });
      var used = Object.keys(placed).map(function (k) { return placed[k]; });
      nameBtns.forEach(function (x, j) { x.classList.toggle("used", used.indexOf(j) >= 0); x.setAttribute("aria-pressed", "false"); });
      if (Object.keys(placed).length === data.slots.length) check.removeAttribute("disabled"); else check.setAttribute("disabled", "");
    }
    render();
    nameBtns[0].focus();

    check.addEventListener("click", function () {
      seatScore = 0;
      data.slots.forEach(function (s) {
        var ok = data.crew[placed[s.id]].slot === s.id;
        if (ok) seatScore++;
        seatBtns[s.id].classList.add(ok ? "ok" : "bad");
        seatBtns[s.id].disabled = true;
      });
      nameBtns.forEach(function (b) { b.disabled = true; });
      check.remove();
      score = seatScore;
      fb.textContent = seatScore + " " + T("of") + " " + data.slots.length + " " + T("seats") + ". " + NG.t(facts.crew.text);
      var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () { question(0); } });
      stage.appendChild(el("div", { "class": "row" }, [next]));
      next.focus();
    });
  }

  function question(i) {
    var q = data.questions[i];
    stage.textContent = "";
    var fb = el("p", { "class": "fb", "aria-live": "polite" });
    var opts = el("div", { "class": "opts" });
    stage.appendChild(el("p", { "class": "step", text: T("step2") + " · " + (i + 1) + "/" + data.questions.length }));
    stage.appendChild(el("p", { "class": "q", text: NG.t(q.q) }));
    stage.appendChild(opts);
    stage.appendChild(fb);
    var btns = q.options.map(function (o, j) {
      var b = el("button", { type: "button", "class": "ng-btn opt", text: NG.t(o) });
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.disabled = true; });
        var ok = j === q.answer;
        if (ok) score++;
        b.classList.add(ok ? "ok" : "bad");
        btns[q.answer].classList.add("ok");
        fb.textContent = (ok ? T("correct") : T("wrong")) + " " + NG.t(facts[q.fact].text);
        var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () {
          if (i + 1 < data.questions.length) question(i + 1); else finish();
        } });
        stage.appendChild(el("div", { "class": "row" }, [next]));
        next.focus();
      });
      opts.appendChild(b);
      return b;
    });
    btns[0].focus();
  }

  function finish() {
    var max = data.slots.length + data.questions.length;
    NG.finish({
      score: score, max: max,
      kicker: T("kicker"),
      scoreText: score + " " + T("of") + " " + max,
      learned: NG.t(facts.leak.text) + " " + NG.t(facts.pad.text)
    });
  }
});
