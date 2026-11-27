/* Skypane waitlist page: live weather demo on a mock Mac desktop. 27 Nov 2026 */
(function () {
  "use strict";
  var desk = document.querySelector("[data-desk]");
  if (!desk) return;
  var cv = desk.querySelector("[data-fx]"), ctx = cv.getContext("2d");
  var win = desk.querySelector("[data-win]"), bar = desk.querySelector("[data-drag]");
  var dock = desk.querySelector("[data-dock]"), dockApp = desk.querySelector("[data-dockapp]");
  var hint = desk.querySelector("[data-hint]"), puff = desk.querySelector("[data-puff]");
  var mbSky = desk.querySelector("[data-mbsky]"), clock = desk.querySelector("[data-clock]");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1, BIN = 4, CAP = 12, MB = 22;
  var mode = "snow", t = 0, running = true, visible = true;
  var flakes = [], clumps = [], drops = [], shards = [], stars = [], icicles = [];
  var wd = new Float32Array(0), dd = new Float32Array(0); // window drift, dock drift
  var minimized = false, dragging = false, dragStart = null, spilled = false;
  var ptr = { x: -999, y: -999, vx: 0, vy: 0, on: false, lt: 0 }, flips = [], lastSign = 0;

  var MODES = {
    snow: { n: 1, sky: "❄︎ 2°", acc: true },
    rain: { n: 1.1, sky: "☂︎ 14°", acc: false },
    petals: { n: .45, sky: "✿ 18°", acc: true },
    stars: { n: 0, sky: "✦ 9°", acc: false }
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function winRect() { return { x: win.offsetLeft, y: win.offsetTop, w: win.offsetWidth, h: win.offsetHeight }; }
  function dockRect() { return { x: dock.offsetLeft - dock.offsetWidth / 2, y: dock.offsetTop, w: dock.offsetWidth }; }

  function resize() {
    var r = desk.getBoundingClientRect();
    var oldW = W;
    W = r.width; H = r.height; DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CAP = Math.max(7, Math.min(16, H * .03));
    if (oldW && win.style.left) { // keep the window inside after a resize
      var wr = winRect();
      win.style.left = Math.max(0, Math.min(W - wr.w, wr.x)) + "px";
      win.style.top = Math.max(MB + 4, Math.min(H - wr.h - 10, wr.y)) + "px";
    }
    var nw = Math.ceil(win.offsetWidth / BIN), nd = Math.ceil(dock.offsetWidth / BIN);
    if (wd.length !== nw) { var o = wd; wd = new Float32Array(nw); for (var i = 0; i < nw && o.length; i++) wd[i] = o[Math.floor(i * o.length / nw)] || 0; }
    if (dd.length !== nd) dd = new Float32Array(nd);
    makeFlakes(); makeIcicles(); makeStars();
  }

  function count() { var base = Math.round(W * H / 2600); if (reduce) base = Math.round(base / 3); return Math.round(base * MODES[mode].n); }
  function newFlake(top) {
    var z = Math.random();
    return { x: rnd(-20, W + 20), y: top ? rnd(-H, 0) : rnd(-20, H), z: z, r: mode === "petals" ? 2.2 + z * 2.4 : .8 + z * 2.1, s: rnd(.6, 1.2), ph: rnd(0, 6.3), rot: rnd(0, 6.3) };
  }
  function makeFlakes() { flakes = []; var n = count(); for (var i = 0; i < n; i++) flakes.push(newFlake(false)); }
  function makeIcicles() {
    icicles = []; var n = Math.max(6, Math.round(W / 34));
    var nl = W / 2 - Math.max(74, W * .15) / 2 - 6, nr = W / 2 + Math.max(74, W * .15) / 2 + 6;
    for (var i = 0; i < n; i++) { var x = (i + .5) * W / n + rnd(-6, 6); if (x > nl && x < nr) continue; icicles.push({ x: x, len: rnd(2, 10), max: rnd(8, 22), drip: rnd(0, 400) }); }
  }
  function makeStars() { stars = []; for (var i = 0; i < 70; i++) stars.push({ x: rnd(0, W), y: rnd(MB, H * .7), r: rnd(.4, 1.4), ph: rnd(0, 6.3) }); }

  function prefill() { for (var i = 0; i < wd.length; i++) wd[i] = CAP * (.55 + .25 * Math.sin(i * .35)) * (i < 2 || i > wd.length - 3 ? .4 : 1); for (var j = 0; j < dd.length; j++) dd[j] = CAP * .35 * (.7 + .3 * Math.sin(j * .5)); }

  function smooth(a) { for (var k = 0; k < 2; k++) for (var i = 1; i < a.length - 1; i++) { var m = (a[i - 1] + a[i + 1]) / 2; if (a[i] > m + 1.2) { var d = (a[i] - m - 1.2) * .5; a[i] -= d; a[i - 1] += d / 2; a[i + 1] += d / 2; } } }
  function add(a, x0, x, amt) { var i = Math.floor((x - x0) / BIN); if (i < 0 || i >= a.length) return false; a[i] = Math.min(CAP, a[i] + amt); return true; }

  function spill(dirx, toDock) {
    var wr = winRect(), dr = dockRect();
    for (var i = 0; i < wd.length; i += 1) {
      if (wd[i] < .6) continue;
      var x = wr.x + i * BIN + 2, y = wr.y - wd[i] / 2;
      var vx = toDock ? (dr.x + dr.w / 2 - x) / 55 + rnd(-.4, .4) : dirx * rnd(.15, .45) + rnd(-.6, .6);
      clumps.push({ x: x, y: y, vx: vx, vy: toDock ? rnd(-1.2, .2) : rnd(-1.4, .4), r: Math.max(1.4, wd[i] * rnd(.22, .4)), life: 1 });
      wd[i] = 0;
    }
  }
  function snowglobe() {
    var wr = winRect(), dr = dockRect(), i;
    for (i = 0; i < wd.length; i++) { if (wd[i] > .5 && !minimized) for (var k = 0; k < 2; k++) clumps.push({ x: wr.x + i * BIN, y: wr.y - 2, vx: rnd(-3, 3), vy: rnd(-7, -3), r: rnd(1, 2.4), life: 1 }); wd[i] = 0; }
    for (i = 0; i < dd.length; i++) { if (dd[i] > .5) clumps.push({ x: dr.x + i * BIN, y: dr.y - 2, vx: rnd(-2.5, 2.5), vy: rnd(-8, -4), r: rnd(1, 2.2), life: 1 }); dd[i] = 0; }
    for (i = 0; i < flakes.length; i++) { flakes[i].burst = rnd(3, 6); }
    done("shake");
  }

  function done(k) { var li = document.querySelector('[data-try="' + k + '"]'); if (li) li.classList.add("done"); }

  // Pointer: drag the window, melt snow, snap icicles, shake
  function local(e) { var r = desk.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function track(p) {
    var now = performance.now(), dt = Math.max(8, now - (ptr.lt || now - 16));
    ptr.vx = (p.x - ptr.x) * 16 / dt; ptr.vy = (p.y - ptr.y) * 16 / dt; ptr.x = p.x; ptr.y = p.y; ptr.lt = now;
    if (Math.abs(ptr.vx) > 9) { var s = ptr.vx > 0 ? 1 : -1; if (s !== lastSign) { flips.push(now); lastSign = s; } }
    flips = flips.filter(function (f) { return now - f < 700; });
    if (flips.length >= 4) { flips = []; snowglobe(); }
    if (p.y < MB + 26 && Math.abs(ptr.vx) > 5) {
      icicles.forEach(function (ic) { if (ic.len > 3 && Math.abs(ic.x - p.x) < 14 && p.y < MB + ic.len + 8) { shards.push({ x: ic.x, y: MB, len: ic.len, vy: 0, vx: ptr.vx * .15, rot: 0, vr: rnd(-.12, .12) }); ic.len = 0; done("ice"); } });
    }
  }
  desk.addEventListener("pointermove", function (e) { var p = local(e); ptr.on = true; track(p); if (dragging) moveWin(p); });
  desk.addEventListener("pointerleave", function () { if (!dragging) ptr.on = false; });
  bar.addEventListener("pointerdown", function (e) {
    if (e.target.hasAttribute("data-min")) return;
    var p = local(e), wr = winRect(); dragging = true; spilled = false; bar.setPointerCapture(e.pointerId);
    dragStart = { px: p.x, py: p.y, wx: wr.x, wy: wr.y }; ptr.x = p.x; ptr.y = p.y; ptr.lt = performance.now();
    win.style.left = wr.x + "px"; win.style.top = wr.y + "px"; hint.classList.add("gone");
  });
  bar.addEventListener("pointermove", function (e) { if (!dragging) return; var p = local(e); ptr.on = true; track(p); moveWin(p); });
  function endDrag() { dragging = false; }
  bar.addEventListener("pointerup", endDrag); bar.addEventListener("pointercancel", endDrag);
  function moveWin(p) {
    var wr = winRect();
    var nx = Math.max(-wr.w * .5, Math.min(W - wr.w * .5, dragStart.wx + p.x - dragStart.px));
    var ny = Math.max(MB + 2, Math.min(H - 40, dragStart.wy + p.y - dragStart.py));
    var dx = nx - wr.x, dy = ny - wr.y;
    win.style.left = nx + "px"; win.style.top = ny + "px";
    var fast = Math.abs(dx) > 7 || Math.abs(dy) > 7 || dy < -4;
    var far = Math.hypot(nx - dragStart.wx, ny - dragStart.wy) > Math.max(60, W * .12);
    if (!spilled && (fast || far)) { spill(dx * 2, false); spilled = true; done("drag"); }
    if (spilled && (fast || far)) spill(dx * 2, false);
  }
  var minBtn = desk.querySelector("[data-min]");
  function minimize() {
    if (minimized) return; minimized = true; spill(0, true); win.classList.add("min"); done("min");
    dockApp.classList.add("bounce");
    setTimeout(function () { dockApp.classList.remove("bounce"); }, 1100);
    setTimeout(function () { win.classList.remove("min"); minimized = false; }, 2600);
  }
  minBtn.addEventListener("click", minimize);
  minBtn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); minimize(); } });
  puff.addEventListener("click", function () { puff.classList.remove("wave"); void puff.offsetWidth; puff.classList.add("wave"); });

  document.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      mode = b.getAttribute("data-mode");
      document.querySelectorAll("[data-mode]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      desk.className = "desk mode-" + mode; mbSky.textContent = MODES[mode].sky; makeFlakes();
    });
  });

  // Simulation
  function step() {
    t += 1;
    var wr = minimized ? null : winRect(), dr = dockRect(), M = MODES[mode];
    var wind = Math.sin(t / 240) * .6 + (mode === "rain" ? 1.6 : 0);
    var melt = mode === "rain" || mode === "stars";
    var i, f;

    for (i = 0; i < flakes.length; i++) {
      f = flakes[i];
      if (mode === "rain") { f.x += wind * 1.6 + f.z; f.y += 9 + f.z * 7; }
      else if (mode === "petals") { f.rot += .03 * f.s; f.x += wind * .8 + Math.sin(t / 50 + f.ph) * .9; f.y += (.5 + f.z * .7) * f.s; }
      else { f.x += wind * (.3 + f.z * .6) + Math.sin(t / 60 + f.ph) * .35; f.y += (.35 + f.z * 1.05) * f.s; }
      if (f.burst) { f.y -= f.burst; f.burst *= .94; if (f.burst < .2) f.burst = 0; }
      if (ptr.on && !dragging && mode !== "rain" && Math.abs(f.x - ptr.x) < 22 && Math.abs(f.y - ptr.y) < 22) { drops.push({ x: f.x, y: f.y, vy: 1, life: 1 }); flakes[i] = newFlake(true); continue; }
      var hit = false;
      if (f.z > .35) {
        if (wr && f.x > wr.x && f.x < wr.x + wr.w) { var bi = Math.floor((f.x - wr.x) / BIN), top = wr.y - (wd[bi] || 0); if (f.y >= top && f.y < top + 12) { hit = true; if (M.acc) add(wd, wr.x, f.x, mode === "petals" ? .9 : .55); else splash(f.x, top); } }
        if (!hit && f.x > dr.x && f.x < dr.x + dr.w) { var di = Math.floor((f.x - dr.x) / BIN), dt2 = dr.y - (dd[di] || 0); if (f.y >= dt2 && f.y < dt2 + 12) { hit = true; if (M.acc) add(dd, dr.x, f.x, .45); else splash(f.x, dt2); } }
      }
      if (hit || f.y > H + 10 || f.x > W + 30 || f.x < -30) flakes[i] = newFlake(true);
    }
    if (melt) { for (i = 0; i < wd.length; i++) wd[i] = Math.max(0, wd[i] - .02); for (i = 0; i < dd.length; i++) dd[i] = Math.max(0, dd[i] - .02); }
    if (ptr.on && !dragging && wr && Math.abs(ptr.y - wr.y) < 16) { for (i = 0; i < wd.length; i++) { var cx = wr.x + i * BIN; if (Math.abs(cx - ptr.x) < 14) wd[i] = Math.max(0, wd[i] - .5); } }
    smooth(wd); smooth(dd);

    for (i = clumps.length - 1; i >= 0; i--) {
      var c = clumps[i]; c.vy += .22; c.vx *= .995; c.x += c.vx; c.y += c.vy;
      if (c.vy > 0 && c.x > dr.x && c.x < dr.x + dr.w && c.y > dr.y - 4 && c.y < dr.y + 10) { add(dd, dr.x, c.x, c.r * .9); clumps.splice(i, 1); continue; }
      if (c.vy > 0 && wr && !dragging && c.x > wr.x && c.x < wr.x + wr.w && c.y > wr.y - 4 && c.y < wr.y + 10) { add(wd, wr.x, c.x, c.r * .7); clumps.splice(i, 1); continue; }
      if (c.y > H + 20) clumps.splice(i, 1);
    }
    for (i = drops.length - 1; i >= 0; i--) { var d = drops[i]; d.vy += .25; d.y += d.vy; d.life -= .03; if (d.life <= 0 || d.y > H) drops.splice(i, 1); }
    for (i = shards.length - 1; i >= 0; i--) { var s = shards[i]; s.vy += .3; s.y += s.vy; s.x += s.vx; s.rot += s.vr; if (s.y > H + 30) shards.splice(i, 1); }
    icicles.forEach(function (ic) {
      if (mode === "snow") { ic.len = Math.min(ic.max, ic.len + .006); ic.drip -= 1; if (ic.drip < 0 && ic.len > 6) { drops.push({ x: ic.x, y: MB + ic.len, vy: .5, life: 1 }); ic.drip = rnd(250, 600); } }
      else ic.len = Math.max(0, ic.len - .05);
    });
    var want = count(); while (flakes.length < want) flakes.push(newFlake(true)); if (flakes.length > want) flakes.length = want;
  }
  function splash(x, y) { for (var k = 0; k < 2; k++) drops.push({ x: x + rnd(-2, 2), y: y - 1, vy: rnd(-2.4, -1), life: .8, sp: rnd(-1.2, 1.2) }); }

  function driftPath(a, x0, y0) {
    ctx.beginPath(); ctx.moveTo(x0 - 1, y0 + 1);
    for (var i = 0; i < a.length; i++) ctx.lineTo(x0 + i * BIN + BIN / 2, y0 - a[i]);
    ctx.lineTo(x0 + a.length * BIN + 1, y0 + 1); ctx.closePath();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var wr = minimized ? null : winRect(), dr = dockRect(), i, f;
    if (mode === "stars") {
      for (i = 0; i < stars.length; i++) { var st = stars[i]; ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t / 50 + st.ph)); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.3); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (t % 140 === 0) shards.push({ star: true, x: rnd(W * .2, W), y: rnd(MB + 10, H * .35), vx: -rnd(6, 9), vy: rnd(2, 3), life: 1 });
    }
    var dcol = mode === "petals" ? "#FFD3E0" : "#FFFFFF";
    if (wr) { driftPath(wd, wr.x, wr.y); ctx.fillStyle = dcol; ctx.shadowColor = "rgba(20,30,80,.25)"; ctx.shadowBlur = 4; ctx.fill(); ctx.shadowBlur = 0; }
    driftPath(dd, dr.x, dr.y); ctx.fillStyle = dcol; ctx.fill();
    // icicles
    ctx.fillStyle = "rgba(220,238,255,.9)";
    icicles.forEach(function (ic) { if (ic.len < 1) return; ctx.beginPath(); ctx.moveTo(ic.x - 3, MB); ctx.lineTo(ic.x + 3, MB); ctx.lineTo(ic.x + .3, MB + ic.len); ctx.closePath(); ctx.fill(); });
    // flakes
    for (i = 0; i < flakes.length; i++) {
      f = flakes[i];
      if (mode === "rain") { ctx.strokeStyle = "rgba(200,220,255," + (.25 + f.z * .45) + ")"; ctx.lineWidth = .6 + f.z; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 3 - f.z * 2, f.y - 10 - f.z * 10); ctx.stroke(); }
      else if (mode === "petals") { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = "rgba(255,190,210," + (.6 + f.z * .4) + ")"; ctx.beginPath(); ctx.ellipse(0, 0, f.r * 1.4, f.r * .8, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
      else if (mode === "snow") { ctx.fillStyle = "rgba(255,255,255," + (.45 + f.z * .55) + ")"; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.3); ctx.fill(); }
    }
    ctx.fillStyle = dcol;
    for (i = 0; i < clumps.length; i++) { var c = clumps[i]; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = "rgba(190,220,255,.85)";
    for (i = 0; i < drops.length; i++) { var d = drops[i]; ctx.globalAlpha = Math.max(0, d.life); if (d.sp) d.x += d.sp; ctx.beginPath(); ctx.arc(d.x, d.y, 1.2, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (i = 0; i < shards.length; i++) {
      var s = shards[i];
      if (s.star) { s.x += s.vx; s.y += s.vy; s.life -= .02; var g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8); g.addColorStop(0, "rgba(255,255,255," + Math.max(0, s.life) + ")"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8); ctx.stroke(); if (s.life <= 0) s.y = H + 100; continue; }
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = "rgba(220,238,255,.95)"; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(.3, s.len); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  function loop() { if (running && visible) { step(); draw(); } requestAnimationFrame(loop); }

  function tick() { var d = new Date(); clock.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  tick(); setInterval(tick, 30000);
  document.addEventListener("visibilitychange", function () { running = !document.hidden; });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(desk);
  window.addEventListener("resize", resize);
  resize(); prefill(); loop();
})();
