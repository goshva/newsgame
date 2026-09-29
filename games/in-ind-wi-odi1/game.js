/* Chase 296: one tap per over, timing decides the runs. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage"), gen = NG.gen, cfg = data.config;
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });

  stage.appendChild(el("section", { "class": "ng-intro" }, [
    el("p", { text: NG.t(facts.wi.text) }),
    el("p", { text: T("intro") }),
    el("p", { "class": "ng-muted", text: T("controls") }),
    el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
  ]));
  stage.querySelector("button").focus();

  function play() {
    NG.start();
    var runs = 0, wkts = 0, overs = 0;
    var score = el("div", { "class": "score" }), ov = el("div", { "class": "ov" }), need = el("div", { "class": "need", "aria-live": "polite" });
    var pitch = el("div", { "class": "pitch", role: "img", "aria-label": T("pitch") });
    var ball = el("div", { "class": "ball" }), zone = el("div", { "class": "zone" }), crease = el("div", { "class": "crease" }), shot = el("div", { "class": "shot" });
    pitch.appendChild(zone); pitch.appendChild(crease); pitch.appendChild(ball); pitch.appendChild(shot);
    var hitBtn = el("button", { type: "button", "class": "ng-btn ng-main hitbtn", text: T("hit") });
    var toast = el("p", { "class": "ng-toast", "aria-live": "polite" });
    stage.textContent = "";
    stage.appendChild(el("div", { "class": "board" }, [score, ov, need]));
    stage.appendChild(pitch);
    stage.appendChild(hitBtn);
    stage.appendChild(toast);

    var H = 240, LINE = 200, BALL = 18;
    zone.style.top = (LINE - 17) + "px";
    crease.style.top = LINE + "px";

    var y = -BALL, speed, phase = "bowl", wait = 0, lastTs = 0;
    function newBall() {
      y = -BALL;
      speed = (170 + Math.min(overs, 40) * 3) * (0.85 + Math.random() * 0.35); // px per second
      phase = "bowl";
      shot.textContent = "";
    }

    function board() {
      score.textContent = "IND " + runs + "/" + wkts;
      ov.textContent = overs + " / " + cfg.overs + " " + T("overs");
      var left = Math.max(0, cfg.target - runs);
      need.textContent = T("need") + " " + left + " " + T("from") + " " + (cfg.overs - overs) + " " + T("overs");
    }

    function result(r, out, label) {
      overs++;
      runs += r;
      if (out) wkts++;
      shot.textContent = label;
      board();
      if (overs === 10) toast.textContent = NG.t(facts.kuldeep.text);
      if (overs === 20) toast.textContent = NG.t(facts.kohli.text);
      if (overs === 30) toast.textContent = NG.t(facts.venue.text);
      phase = "pause"; wait = NG.reducedMotion ? 0.9 : 0.7;
    }

    function swing() {
      if (phase !== "bowl" || NG.paused) return;
      var err = Math.abs((y + BALL / 2) - LINE) / 90; // 0 = perfect
      if (err < 0.12) result(12, false, "+12");
      else if (err < 0.3) result(8, false, "+8");
      else if (err < 0.55) result(5, false, "+5");
      else if (err < 0.8) result(2, false, "+2");
      else result(1, true, T("out"));
    }

    pitch.addEventListener("pointerdown", function (e) { e.preventDefault(); swing(); });
    hitBtn.addEventListener("click", swing);
    function onKey(e) {
      if (gen !== NG.gen) return window.removeEventListener("keydown", onKey);
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); swing(); }
      if (e.code === "KeyP") NG.setPaused(!NG.paused);
    }
    window.addEventListener("keydown", onKey);

    NG.onPause(function () { lastTs = 0; });
    NG.onResume(function () { requestAnimationFrame(loop); });

    function done() {
      window.removeEventListener("keydown", onKey);
      var won = runs >= cfg.target;
      NG.finish({
        score: runs, max: cfg.target,
        kicker: won ? T("won") : T("lost"),
        scoreText: runs + "/" + wkts + " · " + overs + " " + T("overs"),
        note: won ? T("youIn") + " " + overs + " " + T("overs") + ". " + T("india") : T("india"),
        learned: NG.t(facts.result.text) + " " + NG.t(facts.kohli.text)
      });
    }

    function loop(ts) {
      if (gen !== NG.gen || NG.paused) return;
      var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;
      if (phase === "bowl") {
        y += speed * dt;
        if (y > H) result(0, false, T("maiden"));
      } else {
        wait -= dt;
        if (wait <= 0) {
          if (runs >= cfg.target || wkts >= cfg.wickets || overs >= cfg.overs) return done();
          newBall();
        }
      }
      ball.style.top = y + "px";
      requestAnimationFrame(loop);
    }

    board();
    newBall();
    hitBtn.focus();
    requestAnimationFrame(loop);
  }
});
