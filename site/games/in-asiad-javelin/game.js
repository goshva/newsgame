/* Javelin final: two taps per throw (power, then angle), best of three against the real medal marks. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage"), gen = NG.gen;
  var facts = {};
  data.facts.forEach(function (f) { facts[f.id] = f; });
  var COLORS = { gold: "#f4c430", silver: "#d6dbe4", bronze: "#cd7f32", none: "#ffffff" };

  function intro() {
    stage.textContent = "";
    var sw = el("button", { type: "button", "class": "ng-btn ng-small", lang: NG.lang === "en" ? "hi" : "en", text: T("lang"), onclick: function () {
      NG.lang = NG.lang === "en" ? "hi" : "en";
      NG.applyUi();
      intro();
    } });
    stage.appendChild(el("section", { "class": "ng-intro" }, [
      el("div", { "class": "row" }, [sw]),
      el("p", { text: T("intro") }),
      el("p", { "class": "ng-muted", text: T("controls") }),
      el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
    ]));
    stage.querySelector(".ng-main").focus();
  }
  intro();

  function play() {
    NG.start();
    var throwNo = 1, best = 0, phase = "power", power = 0, angle = 0, dir = 1, lastTs = 0, flight = null, results = [];
    stage.textContent = "";
    var info = el("div", { "class": "top" }), tn = el("span"), bestEl = el("span");
    info.appendChild(tn); info.appendChild(bestEl);
    var canvas = el("canvas", { role: "img", "aria-label": T("field") });
    var pBar = el("i"), aBar = el("i"), pVal = el("span"), aVal = el("span");
    var act = el("button", { type: "button", "class": "ng-btn ng-main act" });
    var toast = el("p", { "class": "ng-toast", "aria-live": "polite" });
    stage.appendChild(info);
    stage.appendChild(canvas);
    stage.appendChild(el("div", { "class": "meter" }, [el("span", { text: T("power") }), el("div", { "class": "track" }, [pBar]), pVal]));
    stage.appendChild(el("div", { "class": "meter" }, [el("span", { text: T("angle") }), el("div", { "class": "track angle" }, [aBar]), aVal]));
    stage.appendChild(act);
    stage.appendChild(toast);

    var ctx = canvas.getContext("2d"), W, H;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = 170;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    // Field shows 60–95 m; x in metres maps to pixels.
    function X(m) { return 24 + (m - 60) / 35 * (W - 48); }

    function draw(jav) {
      ctx.fillStyle = "#2f6b3a"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center";
      for (var m = 60; m <= 95; m += 5) {
        ctx.beginPath(); ctx.moveTo(X(m), 30); ctx.lineTo(X(m), H - 18); ctx.stroke();
        ctx.fillText(m + " " + T("m"), X(m), H - 5);
      }
      data.marks.forEach(function (mk, i) {
        ctx.strokeStyle = COLORS[mk.medal]; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(X(mk.m), 38 + i * 4); ctx.lineTo(X(mk.m), H - 22); ctx.stroke();
        ctx.fillStyle = COLORS[mk.medal];
        ctx.beginPath(); ctx.arc(X(mk.m), 34 + i * 4, 4, 0, Math.PI * 2); ctx.fill();
      });
      results.forEach(function (d) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X(Math.max(60, Math.min(95, d))) - 1.5, H - 30, 3, 10);
      });
      if (jav) {
        ctx.save();
        ctx.translate(jav.x, jav.y);
        ctx.rotate(jav.rot);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke();
        ctx.restore();
      }
    }

    function hud() {
      tn.textContent = T("throwN").replace("{n}", Math.min(throwNo, 3));
      bestEl.textContent = T("best") + ": " + (best ? best.toFixed(2) + " " + T("m") : "—");
      pBar.style.width = power + "%"; pVal.textContent = Math.round(power) + "%";
      aBar.style.width = ((angle - 15) / 45 * 100) + "%"; aVal.textContent = Math.round(angle) + "°";
      act.textContent = phase === "power" ? T("setPower") : phase === "angle" ? T("setAngle") : T("next");
    }

    function distance(p, a) {
      var d = 93 * Math.pow(p / 100, 1.15) * Math.exp(-Math.pow((a - 35) / 17, 2));
      return Math.max(0, d + (Math.random() - 0.5) * 1.2);
    }

    function press() {
      if (NG.paused || gen !== NG.gen) return;
      if (phase === "power") { phase = "angle"; angle = 15; dir = 1; }
      else if (phase === "angle") {
        phase = "flight";
        var d = distance(power, angle);
        flight = { d: d, t: 0, dur: NG.reducedMotion ? 0.01 : 1.1 };
        act.disabled = true;
      } else if (phase === "done") {
        throwNo++;
        if (throwNo > 3) return finish();
        phase = "power"; power = 0; dir = 1;
      }
      hud();
    }

    function landed(d) {
      results.push(d);
      if (d > best) best = d;
      var passed = data.marks.filter(function (mk) { return d > mk.m; }).map(function (mk) { return NG.t(mk.name); });
      toast.textContent = d.toFixed(2) + " " + T("m") + (passed.length ? " · " + T("beat") + " " + passed.join(", ") : "") +
        " · " + NG.t(facts[["silver", "bronze", "nadeem"][throwNo - 1]].text);
      phase = "done";
      act.disabled = false;
      hud();
      act.focus();
    }

    act.addEventListener("click", press);
    function onKey(e) {
      if (gen !== NG.gen) return window.removeEventListener("keydown", onKey);
      if (e.code === "Space") { e.preventDefault(); press(); }
    }
    window.addEventListener("keydown", onKey);
    NG.onPause(function () { lastTs = 0; });
    NG.onResume(function () { requestAnimationFrame(loop); });

    function loop(ts) {
      if (gen !== NG.gen || NG.paused) return;
      var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;
      var jav = null;
      if (phase === "power") { power += dir * dt * 140; if (power >= 100) { power = 100; dir = -1; } if (power <= 0) { power = 0; dir = 1; } }
      if (phase === "angle") { angle += dir * dt * 55; if (angle >= 60) { angle = 60; dir = -1; } if (angle <= 15) { angle = 15; dir = 1; } }
      if (phase === "flight" && flight) {
        flight.t += dt / flight.dur;
        var k = Math.min(1, flight.t), x0 = 10, x1 = X(Math.max(60, Math.min(95, flight.d)));
        var peak = 20 + angle * 1.4;
        jav = { x: x0 + (x1 - x0) * k, y: (H - 24) - Math.sin(Math.PI * k) * Math.min(peak, H - 40), rot: -Math.cos(Math.PI * k) * 0.8 };
        if (k >= 1) { var d = flight.d; flight = null; landed(d); }
      }
      if (phase !== "done" || jav) hud();
      draw(jav);
      requestAnimationFrame(loop);
    }

    function finish() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", size);
      var place = 1 + data.marks.filter(function (mk) { return mk.m >= best; }).length;
      NG.finish({
        score: Math.round(best * 100) / 100, max: data.marks[0].m,
        kicker: T("kicker"),
        scoreText: best.toFixed(2) + " " + T("m"),
        note: T("place").replace("{n}", place),
        learned: NG.t(facts.gold.text) + " " + NG.t(facts.venue.text)
      });
    }

    hud();
    act.focus();
    requestAnimationFrame(loop);
  }
});
