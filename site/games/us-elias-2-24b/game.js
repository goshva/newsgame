/* Grow a newborn planet: one-button orbit arcade. */
NG.boot(function (NG, data) {
  var T = function (k) { return NG.t(data.text[k]); };
  var el = NG.el, stage = document.getElementById("stage"), gen = NG.gen;
  var cfg = data.config;

  stage.appendChild(el("section", { "class": "ng-intro" }, [
    el("p", { text: T("intro") }),
    el("p", { "class": "ng-muted", text: T("controls") }),
    el("div", {}, [el("button", { type: "button", "class": "ng-btn ng-main", text: T("start"), onclick: play })])
  ]));
  stage.querySelector("button").focus();

  function play() {
    stage.textContent = "";
    NG.start();
    var barFill = el("i");
    var massTxt = el("span"), timeTxt = el("span");
    var hud = el("div", { "class": "hud" }, [massTxt, el("div", { "class": "bar", "aria-hidden": "true" }, [barFill]), timeTxt]);
    var canvas = el("canvas", { tabindex: "0", role: "img", "aria-label": T("canvas") });
    var holdBtn = el("button", { type: "button", "class": "ng-btn holdbtn", text: T("hold") });
    var toast = el("p", { "class": "ng-toast", "aria-live": "polite" });
    var live = el("p", { "class": "sr-only", "aria-live": "polite" });
    stage.appendChild(hud);
    stage.appendChild(el("div", { "class": "field" }, [canvas]));
    stage.appendChild(holdBtn);
    stage.appendChild(toast);
    stage.appendChild(live);

    var ctx = canvas.getContext("2d");
    var W, H, cx, cy, rIn, rOut, dpr;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = Math.round(Math.min(W * 0.72, 400));
      canvas.style.height = H + "px";
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      var m = Math.min(W, H) / 2;
      rIn = m * 0.32; rOut = m * 0.9;
    }
    size();
    window.addEventListener("resize", size);

    var holding = false;
    function down(e) { if (e) e.preventDefault(); holding = true; }
    function up() { holding = false; }
    canvas.addEventListener("pointerdown", down);
    holdBtn.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    function key(e, v) {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") { e.preventDefault(); holding = v; }
      if (v && e.code === "KeyP") NG.setPaused(!NG.paused);
    }
    function kd(e) { key(e, true); } function ku(e) { key(e, false); }
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    canvas.focus();

    var angle = -Math.PI / 2, r = (rIn + rOut) / 2, mass = cfg.startMass, left = cfg.duration;
    var items = [], spawn = 0, factIdx = 0, lastTs = 0, stars = [];
    for (var i = 0; i < 70; i++) stars.push([Math.random(), Math.random(), Math.random() * 1.2 + .3]);
    var shown = [30, 60, 90];

    NG.onPause(function () { lastTs = 0; });
    NG.onResume(function () { requestAnimationFrame(loop); });

    function add() {
      var roll = Math.random();
      items.push({
        a: angle + 0.9 + Math.random() * 1.8,
        r: rIn + Math.random() * (rOut - rIn),
        kind: roll < 0.72 ? "gas" : roll < 0.84 ? "dust" : "flare",
        life: 7
      });
    }

    function hudText() {
      var pct = Math.min(100, Math.round(mass / cfg.goal * 100));
      massTxt.textContent = T("mass") + " " + pct + "%";
      timeTxt.textContent = T("time") + " " + Math.ceil(left) + "s";
      barFill.style.width = pct + "%";
      return pct;
    }

    function end(win) {
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", size);
      var pct = Math.min(100, Math.round(mass / cfg.goal * 100));
      NG.finish({
        score: pct, max: 100,
        kicker: win ? T("win") : T("timeup"),
        scoreText: pct + "% " + T("ofJupiter"),
        learned: NG.t(data.facts[0].text) + " " + NG.t(data.facts[3].text)
      });
    }

    function loop(ts) {
      if (gen !== NG.gen || NG.paused) return;
      var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;
      left -= dt;
      angle += dt * 1.05;
      r += (holding ? 1 : -1) * dt * (rOut - rIn) * 0.95;
      r = Math.max(rIn, Math.min(rOut, r));
      spawn -= dt;
      if (spawn <= 0) { add(); spawn = 0.28; }

      var px = cx + Math.cos(angle) * r, py = cy + Math.sin(angle) * r;
      var pr = 5 + mass * 0.09;
      items = items.filter(function (it) {
        it.life -= dt;
        var ix = cx + Math.cos(it.a) * it.r, iy = cy + Math.sin(it.a) * it.r;
        var d = Math.hypot(ix - px, iy - py);
        if (d < pr + (it.kind === "flare" ? 7 : 5)) {
          mass = Math.max(1, mass + (it.kind === "gas" ? 3 : it.kind === "dust" ? 5 : -9));
          return false;
        }
        return it.life > 0;
      });

      var pct = hudText();
      if (factIdx < shown.length && pct >= shown[factIdx]) {
        toast.textContent = NG.t(data.facts[[1, 2, 3][factIdx]].text);
        live.textContent = pct + "%";
        factIdx++;
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#070a18"; ctx.fillRect(0, 0, W, H);
      stars.forEach(function (s) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(s[0] * W, s[1] * H, s[2], s[2]); });
      var g = ctx.createRadialGradient(cx, cy, rIn * 0.6, cx, cy, rOut * 1.05);
      g.addColorStop(0, "rgba(255,190,110,.10)"); g.addColorStop(0.6, "rgba(160,120,255,.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rOut * 1.05, 0, Math.PI * 2); ctx.fill();
      var glow = NG.reducedMotion ? 0 : Math.sin(ts / 300) * 2;
      ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(cx, cy, rIn * 0.35 + glow, 0, Math.PI * 2); ctx.fill();
      items.forEach(function (it) {
        var ix = cx + Math.cos(it.a) * it.r, iy = cy + Math.sin(it.a) * it.r;
        ctx.globalAlpha = Math.min(1, it.life);
        ctx.fillStyle = it.kind === "gas" ? "#8fd3ff" : it.kind === "dust" ? "#ffe08a" : "#ff5a4f";
        ctx.beginPath(); ctx.arc(ix, iy, it.kind === "flare" ? 6 : 4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#c9a27a"; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.5; ctx.stroke();

      if (mass >= cfg.goal) return end(true);
      if (left <= 0) return end(false);
      requestAnimationFrame(loop);
    }
    hudText();
    requestAnimationFrame(loop);
  }
});
