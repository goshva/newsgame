/* Young scientist memory: 12 cards, 6 pairs. */
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

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function play() {
    NG.start();
    var cards = [];
    data.pairs.forEach(function (p, idx) {
      cards.push({ pair: idx, kind: "a", text: NG.t(p.a) });
      cards.push({ pair: idx, kind: "b", text: NG.t(p.b) });
    });
    shuffle(cards);

    var moves = 0, found = 0, open = [], busy = false;
    var movesEl = el("span"), pairsEl = el("span");
    var grid = el("div", { "class": "grid" });
    var toast = el("p", { "class": "ng-toast", "aria-live": "polite" });
    stage.textContent = "";
    stage.appendChild(el("div", { "class": "stats" }, [movesEl, pairsEl]));
    stage.appendChild(grid);
    stage.appendChild(toast);

    function stats() {
      movesEl.textContent = T("moves") + ": " + moves;
      pairsEl.textContent = T("pairs") + ": " + found + " / " + data.pairs.length;
    }

    function face(btn, c, show) {
      btn.textContent = "";
      if (show) { btn.appendChild(document.createTextNode(c.text)); btn.setAttribute("aria-label", c.text); }
      else { btn.appendChild(el("span", { "class": "back", "aria-hidden": "true" })); btn.setAttribute("aria-label", T("card")); }
      btn.classList.toggle("open", show);
    }

    cards.forEach(function (c) {
      var b = el("button", { type: "button", "class": "mc kind-" + c.kind });
      c.btn = b;
      face(b, c, false);
      b.addEventListener("click", function () {
        if (busy || c.done || open.indexOf(c) >= 0 || gen !== NG.gen) return;
        face(b, c, true);
        open.push(c);
        if (open.length < 2) return;
        moves++;
        var x = open[0], y = open[1];
        if (x.pair === y.pair) {
          x.done = y.done = true;
          x.btn.classList.add("done"); y.btn.classList.add("done");
          x.btn.setAttribute("aria-disabled", "true"); y.btn.setAttribute("aria-disabled", "true");
          found++;
          toast.textContent = T("match") + " " + NG.t(facts[data.pairs[x.pair].fact].text);
          open = [];
          stats();
          if (found === data.pairs.length) setTimeout(finish, 900);
        } else {
          busy = true;
          stats();
          setTimeout(function () {
            if (gen !== NG.gen) return;
            face(x.btn, x, false); face(y.btn, y, false);
            open = []; busy = false;
          }, 1100);
        }
      });
      grid.appendChild(b);
    });
    stats();
    cards[0].btn.focus();

    function finish() {
      if (gen !== NG.gen) return;
      NG.finish({
        score: Math.max(0, 100 - (moves - data.pairs.length) * 5), max: 100,
        kicker: T("kicker"),
        scoreText: moves + " " + T("in"),
        learned: NG.t(facts.award.text) + " " + NG.t(facts.people.text)
      });
    }
  }
});
