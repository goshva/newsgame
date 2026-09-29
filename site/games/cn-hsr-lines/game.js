/* 高铁排排看 / Rank the rails: order the new lines by length, then by journey time. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage");
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  function intro() {
    stage.textContent = "";
    var sw = el("button", { type: "button", "class": "ng-btn ng-small", text: T("switch"), onclick: function () {
      NG.lang = NG.lang === "zh" ? "en" : "zh"; NG.applyUi(); intro();
    } });
    stage.appendChild(el("section", { "class": "ng-intro" }, [
      el("div", {}, [sw]),
      el("p", { text: T("intro") }),
      el("div", { "class": "track", "aria-hidden": "true" }),
      el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
    ]));
    stage.querySelector(".ng-main").focus();
  }
  intro();

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function play() {
    NG.start();
    var score = 0, max = 0;
    var rounds = [
      { title: T("r1"), items: data.lines.slice(), key: "km", label: function (l) { return l.km + " " + T("km"); } },
      { title: T("r2"), items: data.lines.filter(function (l) { return l.minutes; }), key: "minutes",
        label: function (l) { return (l.id === "hy" ? T("about") : "") + l.minutes + " " + T("min"); } }
    ];

    function round(ri) {
      var R = rounds[ri];
      var order = shuffle(R.items.slice());
      var correct = R.items.slice().sort(function (a, b) { return a[R.key] - b[R.key]; });
      if (order.every(function (l, i) { return l === correct[i]; })) order.reverse();
      stage.textContent = "";
      var list = el("ol", { "class": "list" });
      var fb = el("p", { "class": "fb", "aria-live": "polite" });
      var check = el("button", { type: "button", "class": "ng-btn ng-main", text: T("check") });
      stage.appendChild(el("p", { "class": "rt", text: R.title }));
      stage.appendChild(list);
      stage.appendChild(el("div", { "class": "row" }, [check]));
      stage.appendChild(fb);
      var locked = false;

      function render(focusId, focusDir) {
        list.textContent = "";
        order.forEach(function (l, i) {
          var up = el("button", { type: "button", "class": "ng-btn", text: "↑", "aria-label": T("up") + ": " + NG.t(l.name) });
          var dn = el("button", { type: "button", "class": "ng-btn", text: "↓", "aria-label": T("down") + ": " + NG.t(l.name) });
          if (i === 0 || locked) up.disabled = true;
          if (i === order.length - 1 || locked) dn.disabled = true;
          up.addEventListener("click", function () { move(i, -1); });
          dn.addEventListener("click", function () { move(i, 1); });
          var name = el("span", { "class": "nm" }, [NG.t(l.name)]);
          if (locked) name.appendChild(el("span", { "class": "val", text: R.label(l) }));
          var li = el("li", { "class": "item" + (locked ? (l === correct[i] ? " ok" : " bad") : "") }, [
            el("span", { "class": "n", text: String(i + 1) }), name, el("div", { "class": "mv" }, [up, dn])
          ]);
          list.appendChild(li);
          if (focusId === l.id) { var b = focusDir < 0 ? (i === 0 ? dn : up) : (i === order.length - 1 ? up : dn); b.focus(); }
        });
      }
      function move(i, d) {
        var j = i + d; if (j < 0 || j >= order.length) return;
        var t = order[i]; order[i] = order[j]; order[j] = t;
        render(t.id, d);
      }
      render();
      list.querySelector("button:not([disabled])").focus();

      check.addEventListener("click", function () {
        locked = true;
        var ok = order.filter(function (l, i) { return l === correct[i]; }).length;
        score += ok; max += order.length;
        render();
        check.remove();
        fb.textContent = ok + " " + T("of") + " " + order.length + " " + T("right") + ". " +
          NG.t(facts[ri === 0 ? "xs" : "hy"].text);
        var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () {
          if (ri + 1 < rounds.length) round(ri + 1); else finish();
        } });
        stage.appendChild(el("div", { "class": "row" }, [next]));
        next.focus();
      });
    }

    function finish() {
      NG.finish({
        score: score, max: max,
        kicker: T("kicker"),
        scoreText: score + " " + T("of") + " " + max,
        learned: NG.t(facts.network.text)
      });
    }
    round(0);
  }
});
