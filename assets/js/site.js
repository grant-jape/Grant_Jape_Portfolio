/* Shared behaviour for every page. Each feature runs only if its element exists. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- theme toggle (remembers the choice per browser) ---------- */
  function storedTheme() { try { return localStorage.getItem("theme"); } catch (e) { return null; } }
  function saveTheme(t) { try { localStorage.setItem("theme", t); } catch (e) { /* private mode */ } }
  var initial = storedTheme();
  if (initial === "light" || initial === "dark") root.setAttribute("data-theme", initial);

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      saveTheme(next);
      redrawAll();
    });
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", function () { redrawAll(); });
  }

  function token(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  var redrawers = [];
  function redrawAll() { redrawers.forEach(function (f) { f(); }); }
  window.addEventListener("resize", function () { clearTimeout(redrawAll._t); redrawAll._t = setTimeout(redrawAll, 120); });

  function setupCanvas(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }
  var money = function (v) { return "$" + Math.round(v).toLocaleString("en-US"); };

  /* ---------- hero: 1,338 real policyholders, age vs charges ---------- */
  var scatter = document.getElementById("claims-scatter");
  if (scatter) {
    var tip = document.getElementById("claims-tip");
    var points = [], screen = [];
    var pad = { l: 52, r: 12, t: 10, b: 30 };
    var X = { min: 18, max: 64 }, Y = { min: 0, max: 65000 };

    var drawScatter = function () {
      if (!points.length) return;
      var c = setupCanvas(scatter), ctx = c.ctx, w = c.w, h = c.h;
      var sx = function (v) { return pad.l + (v - X.min) / (X.max - X.min) * (w - pad.l - pad.r); };
      var sy = function (v) { return h - pad.b - (v - Y.min) / (Y.max - Y.min) * (h - pad.t - pad.b); };
      var ink = token("--muted"), rule = token("--rule"), teal = token("--teal"), amber = token("--amber");
      ctx.clearRect(0, 0, w, h);
      ctx.font = "11px " + token("--font-mono");
      ctx.lineWidth = 1;
      // grid + y labels
      [0, 20000, 40000, 60000].forEach(function (v) {
        ctx.strokeStyle = rule; ctx.beginPath(); ctx.moveTo(pad.l, sy(v) + 0.5); ctx.lineTo(w - pad.r, sy(v) + 0.5); ctx.stroke();
        ctx.fillStyle = ink; ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(v === 0 ? "$0" : "$" + v / 1000 + "k", pad.l - 8, sy(v));
      });
      [20, 30, 40, 50, 60].forEach(function (v) {
        ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(v, sx(v), h - pad.b + 8);
      });
      ctx.textAlign = "left"; ctx.fillText("age", w - pad.r - 22, h - pad.b + 8);
      // points: non-smokers first so the smoker band sits on top
      screen = [];
      [false, true].forEach(function (smoker) {
        ctx.fillStyle = smoker ? amber : teal;
        ctx.globalAlpha = smoker ? 0.8 : 0.55;
        points.forEach(function (p) {
          if (p.smoker !== smoker) return;
          var x = sx(p.age + p.jitter), y = sy(p.charges);
          ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
          screen.push({ x: x, y: y, p: p });
        });
      });
      ctx.globalAlpha = 1;
      // mean charge by age, per group (a plain average, no model)
      [false, true].forEach(function (smoker) {
        var by = {};
        points.forEach(function (p) { if (p.smoker === smoker) { (by[p.age] = by[p.age] || []).push(p.charges); } });
        var ages = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
        ctx.strokeStyle = smoker ? amber : teal; ctx.lineWidth = 2; ctx.beginPath();
        ages.forEach(function (a, i) {
          // 5-year centred rolling mean keeps the line readable
          var vals = [];
          for (var d = -2; d <= 2; d++) if (by[a + d]) vals = vals.concat(by[a + d]);
          var m = vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
          if (i === 0) ctx.moveTo(sx(a), sy(m)); else ctx.lineTo(sx(a), sy(m));
        });
        ctx.stroke();
      });
    };
    redrawers.push(drawScatter);

    scatter.addEventListener("mousemove", function (e) {
      var r = scatter.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, best = null, bd = 144;
      screen.forEach(function (s) { var d = (s.x - mx) * (s.x - mx) + (s.y - my) * (s.y - my); if (d < bd) { bd = d; best = s; } });
      if (!best) { tip.hidden = true; return; }
      var p = best.p;
      tip.textContent = "age " + p.age + " · BMI " + p.bmi + " · " + (p.smoker ? "smoker" : "non-smoker") + " · " + money(p.charges);
      tip.style.left = best.x + "px"; tip.style.top = best.y + "px"; tip.hidden = false;
    });
    scatter.addEventListener("mouseleave", function () { tip.hidden = true; });

    fetch(scatter.getAttribute("data-src"))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var lines = text.trim().split(/\r?\n/), head = lines.shift().split(",");
        var ix = function (k) { return head.indexOf(k); };
        lines.forEach(function (line, i) {
          var c = line.split(",");
          points.push({
            age: +c[ix("age")], bmi: +c[ix("bmi")], smoker: c[ix("smoker")] === "yes", charges: +c[ix("charges")],
            jitter: ((i * 9301 + 49297) % 233280) / 233280 * 0.7 - 0.35 // fixed jitter so dots don't stack
          });
        });
        var n = document.getElementById("claims-n");
        if (n) n.textContent = points.length.toLocaleString("en-US");
        drawScatter();
      })
      .catch(function () {
        var box = scatter.parentNode;
        box.innerHTML = '<img src="projects/claims-model/charts/scatterplots.png" alt="Age and BMI against insurance charges, coloured by smoker status">';
      });
  }

  /* ---------- horizontal bar chart from data-bars='[[label, value], ...]' ---------- */
  document.querySelectorAll(".bars[data-bars]").forEach(function (el) {
    var data = JSON.parse(el.getAttribute("data-bars"));
    var fmt = el.getAttribute("data-format") || "money";
    var W = 640, labelW = 150, valW = 70, rowH = 34, top = 6, H = top * 2 + data.length * rowH;
    var min = Math.min(0, Math.min.apply(null, data.map(function (d) { return d[1]; })));
    var max = Math.max(0, Math.max.apply(null, data.map(function (d) { return d[1]; })));
    var x0 = labelW + valW, x1 = W - valW;
    var sx = function (v) { return x0 + (v - min) / (max - min) * (x1 - x0); };
    var show = function (v) { return fmt === "money" ? (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-US") : v; };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + (el.getAttribute("aria-label") || "Bar chart") + '">';
    data.forEach(function (d, i) {
      var y = top + i * rowH, v = d[1], a = sx(Math.min(0, v)), b = sx(Math.max(0, v));
      s += '<text x="0" y="' + (y + rowH / 2) + '" dominant-baseline="middle">' + d[0] + "</text>";
      s += '<rect class="' + (v < 0 ? "neg" : "pos") + '" x="' + a + '" y="' + (y + 7) + '" width="' + Math.max(2, b - a) + '" height="' + (rowH - 14) + '" rx="3"></rect>';
      var tx = v < 0 ? a - 6 : b + 6;
      s += '<text x="' + tx + '" y="' + (y + rowH / 2) + '" dominant-baseline="middle" text-anchor="' + (v < 0 ? "end" : "start") + '">' + show(v) + "</text>";
    });
    s += '<line class="zero" x1="' + sx(0) + '" x2="' + sx(0) + '" y1="0" y2="' + H + '"></line></svg>';
    el.innerHTML = s;
  });

  /* ---------- adstock explorer ---------- */
  var ad = document.getElementById("adstock-canvas");
  if (ad) {
    var slider = document.getElementById("adstock-lambda"), out = document.getElementById("adstock-out"), half = document.getElementById("adstock-half");
    // Illustrative flighting plan: two bursts and a sustained low weight (not the project data).
    var spend = [0, 0, 100, 100, 0, 0, 0, 0, 0, 0, 0, 60, 60, 60, 0, 0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 20];
    var drawAd = function () {
      var lam = +slider.value;
      out.textContent = lam.toFixed(2);
      half.textContent = lam > 0 ? (Math.log(0.5) / Math.log(lam)).toFixed(1) + " weeks" : "0 weeks";
      var a = [], prev = 0;
      spend.forEach(function (x) { prev = x + lam * prev; a.push(prev); });
      var sat = a.map(function (v) { return Math.log(v + 1); });
      var c = setupCanvas(ad), ctx = c.ctx, w = c.w, h = c.h, pl = 8, pr = 8, pt = 10, pb = 22;
      var bw = (w - pl - pr) / spend.length;
      var maxA = Math.max.apply(null, a.concat(spend)) || 1, maxS = Math.log(maxA + 1);
      var y = function (v, m) { return h - pb - v / m * (h - pt - pb); };
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = token("--rule");
      spend.forEach(function (x, i) { if (x) ctx.fillRect(pl + i * bw + 2, y(x, maxA), bw - 4, h - pb - y(x, maxA)); });
      var line = function (arr, m, col, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash(dash || []); ctx.beginPath();
        arr.forEach(function (v, i) { var px = pl + i * bw + bw / 2; if (i) ctx.lineTo(px, y(v, m)); else ctx.moveTo(px, y(v, m)); });
        ctx.stroke(); ctx.setLineDash([]);
      };
      line(a, maxA, token("--teal"));
      line(sat, maxS, token("--amber"), [5, 4]);
      ctx.fillStyle = token("--muted"); ctx.font = "11px " + token("--font-mono"); ctx.textAlign = "center"; ctx.textBaseline = "top";
      [1, 6, 11, 16, 21, 26].forEach(function (wk) { ctx.fillText("wk " + wk, pl + (wk - 1) * bw + bw / 2, h - pb + 6); });
    };
    slider.addEventListener("input", drawAd);
    redrawers.push(drawAd);
    drawAd();
  }

  // copy-to-clipboard for the email address
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy"), label = btn.textContent;
      var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = label; }, 1600); };
      // If the clipboard is unavailable the address is still shown as selectable text beside the button.
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  redrawAll();
})();
