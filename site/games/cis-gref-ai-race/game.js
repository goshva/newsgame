/* ИИ-гонка: верю / не верю — swipe cards. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage"), gen = NG.gen;
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  stage.appendChild(el("section", { "class": "ng-intro" }, [
    el("p", { text: T("intro") }),
    el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
  ]));
  stage.querySelector("button").focus();

  function play() {
    NG.start();
    var i = 0, score = 0, locked = false;
    var counter = el("p", { "class": "counter" });
    var deck = el("div", { "class": "deck" });
    var yes = el("button", { type: "button", "class": "ng-btn", text: T("yes") });
    var no = el("button", { type: "button", "class": "ng-btn", text: T("no") });
    var verdict = el("div", { "class": "verdict", "aria-live": "polite", hidden: "" });
    stage.textContent = "";
    stage.appendChild(counter);
    stage.appendChild(deck);
    stage.appendChild(el("div", { "class": "choices" }, [no, yes]));
    stage.appendChild(verdict);

    yes.addEventListener("click", function () { answer(true); });
    no.addEventListener("click", function () { answer(false); });
    function onKey(e) {
      if (gen !== NG.gen) return window.removeEventListener("keydown", onKey);
      if (e.key === "ArrowRight") answer(true);
      if (e.key === "ArrowLeft") answer(false);
    }
    window.addEventListener("keydown", onKey);

    var card;
    function show() {
      locked = false;
      verdict.hidden = true;
      yes.disabled = no.disabled = false;
      counter.textContent = T("card") + " " + (i + 1) + " " + T("of") + " " + data.cards.length;
      deck.textContent = "";
      card = el("div", { "class": "card", text: data.cards[i].text });
      deck.appendChild(card);
      drag(card);
      yes.focus();
    }

    function drag(c) {
      var x0 = null, dx = 0;
      c.addEventListener("pointerdown", function (e) { if (locked) return; x0 = e.clientX; dx = 0; c.setPointerCapture(e.pointerId); c.classList.add("dragging"); });
      c.addEventListener("pointermove", function (e) {
        if (x0 === null) return;
        dx = e.clientX - x0;
        c.style.transform = "translateX(" + dx + "px) rotate(" + dx / 25 + "deg)";
        c.classList.toggle("yes", dx > 40); c.classList.toggle("no", dx < -40);
      });
      function release() {
        if (x0 === null) return;
        x0 = null; c.classList.remove("dragging");
        if (Math.abs(dx) > 90) answer(dx > 0);
        else { c.style.transform = ""; c.classList.remove("yes", "no"); }
      }
      c.addEventListener("pointerup", release);
      c.addEventListener("pointercancel", release);
    }

    function answer(val) {
      if (locked) return;
      locked = true;
      yes.disabled = no.disabled = true;
      var q = data.cards[i], right = val === q.answer;
      if (right) score++;
      card.classList.add(val ? "yes" : "no");
      card.style.transform = "translateX(" + (val ? 30 : -30) + "px)";
      card.style.opacity = ".55";
      verdict.textContent = "";
      verdict.appendChild(el("p", { "class": right ? "ok" : "bad", text: right ? T("right") : T("wrong") }));
      verdict.appendChild(el("p", { text: NG.t(facts[q.fact].text) }));
      var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () {
        i++;
        if (i < data.cards.length) show(); else { window.removeEventListener("keydown", onKey); finish(); }
      } });
      verdict.appendChild(el("div", {}, [next]));
      verdict.hidden = false;
      next.focus();
    }

    function finish() {
      NG.finish({
        score: score, max: data.cards.length,
        kicker: T("kicker"),
        scoreText: score + " " + T("of") + " " + data.cards.length,
        note: T("score"),
        learned: NG.t(facts.gap.text) + " " + NG.t(facts.reason.text)
      });
    }
    show();
  }
});
