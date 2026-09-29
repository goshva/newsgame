/* Слово из новости: угадай слово за 6 попыток, три раунда. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage"), gen = NG.gen;
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });
  var ROWS = ["ЙЦУКЕНГШЩЗХ", "ФЫВАПРОЛДЖЭ", "ЯЧСМИТЬБЮ"];
  var TRIES = 6;

  stage.appendChild(el("section", { "class": "ng-intro" }, [
    el("p", { text: T("intro") }),
    el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
  ]));
  stage.querySelector("button").focus();

  function play() {
    NG.start();
    var r = 0, solvedCount = 0, points = 0;
    var keyHandler = null;

    function round() {
      var word = data.rounds[r].word, len = word.length;
      var row = 0, cur = "", done = false, keyState = {};
      stage.textContent = "";
      var board = el("div", { "class": "board", role: "grid" });
      var rows = [];
      for (var i = 0; i < TRIES; i++) {
        var size = Math.max(30, Math.min(46, Math.floor(((stage.clientWidth || 300) - (len - 1) * 6) / len)));
        var rw = el("div", { "class": "rowg", role: "row", style: "grid-template-columns:repeat(" + len + "," + size + "px)" });
        var tiles = [];
        for (var j = 0; j < len; j++) { var t = el("div", { "class": "tile", role: "gridcell", style: "width:" + size + "px;height:" + size + "px" }); tiles.push(t); rw.appendChild(t); }
        rows.push(tiles); board.appendChild(rw);
      }
      var msg = el("p", { "class": "msg", "aria-live": "polite" });
      var kb = el("div", { "class": "kb" });
      var keys = {};
      ROWS.forEach(function (letters, ri) {
        var kr = el("div", { "class": "kr" });
        if (ri === 2) kr.appendChild(el("button", { type: "button", "class": "key wide", text: T("enter"), onclick: submit }));
        letters.split("").forEach(function (ch) {
          var k = el("button", { type: "button", "class": "key", text: ch, "aria-label": ch, onclick: function () { type(ch); } });
          keys[ch] = k; kr.appendChild(k);
        });
        if (ri === 2) kr.appendChild(el("button", { type: "button", "class": "key wide", text: T("del"), onclick: back }));
        kb.appendChild(kr);
      });
      stage.appendChild(el("p", { "class": "round", text: T("round").replace("{n}", r + 1).replace("{total}", data.rounds.length) }));
      stage.appendChild(el("p", { "class": "hint", text: NG.t(data.rounds[r].hint) }));
      stage.appendChild(board);
      stage.appendChild(msg);
      stage.appendChild(kb);

      function paint() {
        rows[row].forEach(function (t, i) { t.textContent = cur[i] || ""; t.classList.toggle("filled", !!cur[i]); });
      }
      function type(ch) { if (done || cur.length >= len) return; cur += ch; paint(); }
      function back() { if (done) return; cur = cur.slice(0, -1); paint(); }
      function submit() {
        if (done) return;
        if (cur.length < len) { msg.textContent = T("short"); return; }
        msg.textContent = "";
        // Two passes so repeated letters are counted correctly.
        var res = new Array(len).fill("miss"), left = {};
        for (var i = 0; i < len; i++) { if (cur[i] === word[i]) res[i] = "hit"; else left[word[i]] = (left[word[i]] || 0) + 1; }
        for (i = 0; i < len; i++) { if (res[i] !== "hit" && left[cur[i]]) { res[i] = "near"; left[cur[i]]--; } }
        var spoken = [];
        rows[row].forEach(function (t, i) {
          t.classList.add(res[i]);
          t.setAttribute("aria-label", cur[i] + " — " + T(res[i]));
          spoken.push(cur[i] + " " + T(res[i]));
          var rank = { miss: 1, near: 2, hit: 3 };
          if (!keyState[cur[i]] || rank[res[i]] > rank[keyState[cur[i]]]) {
            keyState[cur[i]] = res[i];
            keys[cur[i]].className = "key " + res[i];
          }
        });
        var won = cur === word;
        row++; cur = "";
        if (won || row >= TRIES) {
          done = true;
          if (won) { solvedCount++; points += TRIES - row + 1; }
          msg.textContent = (won ? T("solved") : T("failed") + word) + " " + NG.t(facts[data.rounds[r].fact].text);
          var next = el("button", { type: "button", "class": "ng-btn ng-main", text: T("next"), onclick: function () {
            r++;
            if (r < data.rounds.length) round(); else finish();
          } });
          stage.appendChild(el("div", { style: "text-align:center;margin-top:12px" }, [next]));
          next.focus();
        } else {
          msg.textContent = spoken.join(", ");
        }
      }

      if (keyHandler) window.removeEventListener("keydown", keyHandler);
      keyHandler = function (e) {
        if (gen !== NG.gen) return window.removeEventListener("keydown", keyHandler);
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === "Enter") { if (!done) { e.preventDefault(); submit(); } return; }
        if (e.key === "Backspace") { e.preventDefault(); back(); return; }
        var ch = (e.key || "").toUpperCase().replace("Ё", "Е");
        if (ch.length === 1 && keys[ch]) { e.preventDefault(); type(ch); }
      };
      window.addEventListener("keydown", keyHandler);
    }

    function finish() {
      if (keyHandler) window.removeEventListener("keydown", keyHandler);
      NG.finish({
        score: points, max: data.rounds.length * TRIES,
        kicker: T("kicker"),
        scoreText: solvedCount + " " + T("of") + " " + data.rounds.length,
        note: T("words") + " · " + points + " " + T("points"),
        learned: NG.t(facts.species.text) + " " + NG.t(facts.iran.text)
      });
    }
    round();
  }
});
