/* Skypane landing page: countdown, videos, live sky, chips, before/after, sticky bar, wallpaper gift, page snow. */
(function () {
  "use strict";
  var d = document, w = window;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var wide = w.matchMedia("(min-width: 761px)").matches;
  var calm = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {};
  var light = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");

  // ---------- countdown to the waitlist price (8 Dec, visitor's own midnight) ----------
  var cd = $("[data-countdown]");
  if (cd) {
    var end = new Date(cd.getAttribute("data-countdown")).getTime();
    var tick = function () {
      var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (!s) { cd.textContent = "today"; return; }
      var dd = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      cd.textContent = (dd ? dd + "d " : "") + p(hh) + "h " + p(mm) + "m" + (dd ? "" : " " + p(ss) + "s");
    };
    tick(); setInterval(tick, 1000);
  }

  // ---------- hero video: poster first, video after load ----------
  var hv = $("[data-hero-video]");
  if (hv && !light) {
    var startHero = function () {
      hv.src = wide ? hv.getAttribute("data-src-wide") : hv.getAttribute("data-src-phone");
      hv.addEventListener("playing", function () { hv.classList.add("on"); }, { once: true });
      var p = hv.play(); if (p && p.catch) p.catch(function () {});
    };
    if (d.readyState === "complete") startHero(); else w.addEventListener("load", startHero, { once: true });
  }

  // ---------- lazy videos: load near the screen, play only while visible ----------
  var vids = $$("video.lazy").filter(function (v) { return !v.closest("[hidden]"); });
  var load = function (v) { if (!v.src && v.getAttribute("data-src")) { v.src = v.getAttribute("data-src"); } };
  if ("IntersectionObserver" in w && !light) {
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { load(e.target); near.unobserve(e.target); } });
    }, { rootMargin: "600px 0px" });
    var vis = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { near.observe(v); vis.observe(v); });
  }

  // ---------- try a sky ----------
  var WORLD = {
    cabin: { src: "/skypane/m/world-sunset.mp4", poster: "/skypane/m/world-sunset.webp", label: "Alpine Cabin world with snow" },
    lake: { src: "/skypane/m/world-lake.mp4", poster: "/skypane/m/world-lake.webp", label: "Lake Village world with rain" },
    kyoto: { src: "/skypane/m/world-kyoto.mp4", poster: "/skypane/m/world-kyoto.webp", label: "Kyoto Rooftops world with falling petals" }
  };
  var sv = $("[data-sky-video]"), chips = $$("[data-world]"), meWorld = "kyoto";
  var pick = function (btn) {
    var key = btn.getAttribute("data-world"); if (key === "me") key = meWorld;
    chips.forEach(function (c) { c.setAttribute("aria-selected", c === btn ? "true" : "false"); });
    var wd = WORLD[key]; if (!sv || !wd) return;
    sv.poster = wd.poster; sv.setAttribute("aria-label", wd.label); sv.setAttribute("data-src", wd.src);
    if (!light) { sv.src = wd.src; var p = sv.play(); if (p && p.catch) p.catch(function () {}); }
    track("sky_" + key);
  };
  chips.forEach(function (c) { c.addEventListener("click", function () { pick(c); }); });

  // ---------- live sky: time zone city + Open-Meteo, no location prompt ----------
  var WX = function (c) {
    if (c === 0) return "clear"; if (c <= 2) return "a few clouds"; if (c === 3) return "cloudy"; if (c <= 48) return "fog";
    if (c <= 57) return "drizzle"; if (c <= 67) return "rain"; if (c <= 77) return "snow"; if (c <= 82) return "showers";
    if (c <= 86) return "snow showers"; return "thunderstorms";
  };
  var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var city = tz.indexOf("/") > 0 ? tz.split("/").pop().replace(/_/g, " ") : "";
  var chipText = $("[data-sky-text]"), skyNow = $("[data-sky-now]"), meChip = $('[data-world="me"]');
  var clock = function () { try { return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(/\s/g, " "); } catch (e) { return ""; } };
  if (city && w.fetch) {
    var fahr = /^en-US/.test(navigator.language || "") && /^America\//.test(tz);
    fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city))
      .then(function (r) { return r.json(); })
      .then(function (g) {
        var hit = g && g.results && g.results[0]; if (!hit) throw 0;
        return fetch("https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,is_day&timezone=auto" + (fahr ? "&temperature_unit=fahrenheit" : "") + "&latitude=" + hit.latitude + "&longitude=" + hit.longitude);
      })
      .then(function (r) { return r.json(); })
      .then(function (f) {
        var c = f && f.current; if (!c) throw 0;
        var t = Math.round(c.temperature_2m) + "°", wx = WX(c.weather_code);
        if (chipText) chipText.textContent = city + " · " + t + " · " + wx + " · " + clock();
        var code = c.weather_code, cold = fahr ? c.temperature_2m < 39 : c.temperature_2m < 4;
        meWorld = (code >= 71 && code <= 77) || code === 85 || code === 86 || cold ? "cabin" : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 ? "lake" : "kyoto";
        var names = { cabin: "Alpine Cabin with snow", lake: "Lake Village with rain", kyoto: "Kyoto Rooftops with petals" };
        if (skyNow) skyNow.textContent = city + " right now: " + t + " and " + wx + ". Skypane would show " + names[meWorld] + ".";
        if (meChip) { meChip.textContent = city + " · now"; meChip.hidden = false; }
      })
      .catch(function () { if (chipText) chipText.textContent = "Mac only · launches Thu 10 Dec"; });
  } else if (chipText) chipText.textContent = "Mac only · launches Thu 10 Dec";

  // ---------- before / after (shown once job 105's stills exist) ----------
  var baSec = $("[data-ba-section]");
  if (baSec && baSec.getAttribute("data-ba-ready") === "yes") {
    var probe = new Image();
    probe.onload = function () { baSec.hidden = false; };
    probe.src = wide ? "/skypane/m/after-16x9.jpg" : "/skypane/m/after-9x16.jpg";
    var range = $("[data-ba-range]"), before = $("[data-ba-before]"), handle = $("[data-ba-handle]"), used = false;
    if (range) range.addEventListener("input", function () {
      var v = range.value; before.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)"; handle.style.left = v + "%";
      if (!used) { used = true; track("before_after"); }
    });
  }

  // ---------- sticky bar: after the hero, hidden near the price and the last call ----------
  var bar = $("[data-bar]"), hero = $(".hero"), price = $("#price"), last = $("#join");
  if (bar && hero && "IntersectionObserver" in w) {
    var state = { hero: true, price: false, last: false };
    var upd = function () {
      var on = !state.hero && !state.price && !state.last;
      bar.classList.toggle("on", on); bar.setAttribute("aria-hidden", on ? "false" : "true");
      var a = bar.querySelector("a"); if (a) a.tabIndex = on ? 0 : -1;
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { state[e.target === hero ? "hero" : e.target === price ? "price" : "last"] = e.isIntersecting; });
      upd();
    }, { threshold: 0 });
    io.observe(hero); if (price) io.observe(price); if (last) io.observe(last);
  }
  $$('a[href="#join"]').forEach(function (a) {
    a.addEventListener("click", function () {
      track("cta_" + (a.closest("[data-bar]") ? "bar" : "strip"));
      setTimeout(function () { var i = $("#email-last"); if (i) i.focus({ preventScroll: true }); }, 650);
    });
  });

  // ---------- after signup: wallpapers (once job 104's files exist) ----------
  var gift = $("[data-gift]");
  d.addEventListener("signup:done", function (e) {
    var f = e.target, m = f.parentNode.querySelector(".signup-msg");
    track("signup_" + (f.getAttribute("data-medium") || "form"));
    $$("form[data-signup]").forEach(function (o) { o.classList.add("is-done"); var l = o.querySelector(".btn-label"); if (l) l.textContent = "You're on the list"; });
    var ok = function () {
      if (m) m.innerHTML = "You're on the list. Your $5 link arrives on Tue 8 Dec. <button type=\"button\" data-gift-open>Get the wallpapers</button>";
      var b = m && m.querySelector("[data-gift-open]"); if (b) b.addEventListener("click", openGift);
      openGift();
    };
    var t = new Image();
    t.onload = ok;
    t.onerror = function () { if (m) m.textContent = "You're on the list. Your $5 link and your 6 iPhone wallpapers arrive by email."; };
    t.src = "/skypane/w/alpine-day-t.webp";
  });
  var opener = null;
  function openGift() {
    if (!gift) return; opener = d.activeElement; gift.hidden = false; track("wallpapers");
    var x = $("[data-gift-close]", gift); if (x) x.focus();
  }
  function closeGift() { if (!gift) return; gift.hidden = true; if (opener && opener.focus) opener.focus(); }
  if (gift) {
    gift.addEventListener("click", function (e) { if (e.target === gift || e.target.closest("[data-gift-close]")) closeGift(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !gift.hidden) closeGift(); });
  }

  // ---------- events: Cloudflare Web Analytics custom events when present ----------
  function track(name) { try { if (w.zaraz && w.zaraz.track) w.zaraz.track(name); } catch (e) {} }

  // ---------- page snow ----------
  var cv = $("[data-snow]");
  if (!cv || calm || !cv.getContext) return;
  var ctx = cv.getContext("2d"), dpr = Math.min(w.devicePixelRatio || 1, 2), W = 0, H = 0;
  var flakes = [], ledges = [], BIN = 6, MAXP = 7;
  var landed = 0, pileCv = $("[data-pile]"), pctx = pileCv && pileCv.getContext("2d");
  var size = function () {
    W = w.innerWidth; H = w.innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (pileCv) { pileCv.width = pileCv.offsetWidth * dpr; pileCv.height = pileCv.offsetHeight * dpr; pctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  };
  size(); w.addEventListener("resize", size);
  var N = wide ? 36 : 16;
  var mk = function (y) { return { x: Math.random() * W, y: y == null ? Math.random() * H : y, r: .6 + Math.random() * 1.2, vy: .25 + Math.random() * .45, ph: Math.random() * 6.28, vx: 0, burst: 0 }; };
  for (var i = 0; i < N; i++) flakes.push(mk());

  $$("[data-ledge]").forEach(function (el) {
    var L = { el: el, bins: [], r: null };
    ledges.push(L);
    var shake = function () {
      if (!L.r) return;
      L.bins.forEach(function (h, k) {
        if (h > 1.5) for (var j = 0; j < Math.min(3, h / 2); j++) flakes.push({ x: L.r.left + k * BIN + Math.random() * BIN, y: L.r.top - Math.random() * h, r: 1 + Math.random() * 1.6, vy: 1.2 + Math.random(), ph: Math.random() * 6, vx: (Math.random() - .5) * 2.4, burst: 1, tmp: 1 });
      });
      L.bins = [];
    };
    el.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") shake(); });
    el.addEventListener("pointerdown", shake);
  });

  // double-tap or double-click the hero: snowglobe
  var hm = $("[data-hero]"), hint = $("[data-hint]");
  var globe = function (cx, cy) {
    for (var k = 0; k < (wide ? 260 : 160); k++) {
      var a = Math.random() * 6.28, sp = 2 + Math.random() * 7;
      flakes.push({ x: cx, y: cy, r: .8 + Math.random() * 2.2, vy: Math.sin(a) * sp - 2, vx: Math.cos(a) * sp, ph: Math.random() * 6, burst: 1, tmp: 1 });
    }
    track("snowglobe");
  };
  if (hm) {
    var lastTap = 0;
    hm.addEventListener("pointerup", function (e) {
      var now = Date.now();
      if (now - lastTap < 350) { globe(e.clientX, e.clientY); lastTap = 0; } else lastTap = now;
    });
    if (hint) { setTimeout(function () { hint.classList.add("on"); }, 2600); setTimeout(function () { hint.classList.remove("on"); }, 6200); }
  }

  var t0 = 0, running = true;
  d.addEventListener("visibilitychange", function () { running = !d.hidden; if (running) requestAnimationFrame(frame); });
  function frame(t) {
    if (!running) return;
    var dt = Math.min(2, t0 ? (t - t0) / 16.7 : 1); t0 = t;
    ctx.clearRect(0, 0, W, H);
    ledges.forEach(function (L) {
      var r = L.el.getBoundingClientRect();
      L.r = (r.bottom > 0 && r.top < H && r.width) ? r : null;
      if (L.r && L.bins.length !== Math.ceil(r.width / BIN)) { var n = Math.ceil(r.width / BIN), nb = []; for (var q = 0; q < n; q++) nb.push(L.bins[q] || 0); L.bins = nb; }
    });
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];
      f.ph += .02 * dt;
      if (f.burst) { f.vx *= Math.pow(.97, dt); f.vy += .06 * dt; if (f.vy > 1.6) f.vy = 1.6; f.x += f.vx * dt; f.y += f.vy * dt; }
      else { f.x += (Math.sin(f.ph) * .35) * dt; f.y += f.vy * dt; }
      var hit = false;
      if (!f.burst || f.vy > 0) for (var j = 0; j < ledges.length; j++) {
        var L = ledges[j], r = L.r; if (!r) continue;
        if (f.x > r.left + 6 && f.x < r.right - 6) {
          var k = Math.floor((f.x - r.left) / BIN), top = r.top - (L.bins[k] || 0);
          if (f.y >= top && f.y - f.vy * dt * 1.5 < top + 2) {
            if ((L.bins[k] || 0) < MAXP) { L.bins[k] = (L.bins[k] || 0) + f.r * 1.1; hit = true; }
            break;
          }
        }
      }
      if (hit || f.y > H + 4 || f.x < -20 || f.x > W + 20 || f.y < -300) {
        if (!hit && f.y > H) landed++;
        if (f.tmp) flakes.splice(i, 1); else { var n2 = mk(-6); flakes[i] = n2; }
        continue;
      }
      ctx.globalAlpha = f.burst ? .45 + f.r * .2 : .22 + f.r * .16;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    // piles on ledges
    ctx.globalAlpha = .95; ctx.fillStyle = "#f4f8ff";
    ledges.forEach(function (L) {
      var r = L.r; if (!r || !L.bins.length) return;
      var any = false; for (var q = 0; q < L.bins.length; q++) if (L.bins[q] > .4) { any = true; break; }
      if (!any) return;
      var rad = Math.min(14, parseFloat(getComputedStyle(L.el).borderTopLeftRadius) || 0) * .6;
      ctx.beginPath(); ctx.moveTo(r.left + rad, r.top + 1);
      for (var b = 0; b < L.bins.length; b++) {
        var h0 = (L.bins[b - 1] || L.bins[b]) * .3 + L.bins[b] * .4 + (L.bins[b + 1] || L.bins[b]) * .3;
        var edge = Math.min(1, b / 3, (L.bins.length - 1 - b) / 3);
        ctx.lineTo(Math.min(r.right - rad, Math.max(r.left + rad, r.left + b * BIN + BIN / 2)), r.top + 1 - h0 * edge);
      }
      ctx.lineTo(r.right - rad, r.top + 1); ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // the snow that fell while you scrolled piles up at the end
    if (pctx && landed) {
      var pw = pileCv.offsetWidth, ph = pileCv.offsetHeight, hh = Math.min(ph - 4, 4 + Math.sqrt(landed) * .9);
      pctx.clearRect(0, 0, pw, ph);
      var g = pctx.createLinearGradient(0, ph - hh, 0, ph); g.addColorStop(0, "#f6f9ff"); g.addColorStop(1, "#c9d6ea");
      pctx.fillStyle = g; pctx.beginPath(); pctx.moveTo(0, ph);
      for (var x = 0; x <= pw; x += 8) pctx.lineTo(x, ph - hh * (.82 + .18 * Math.sin(x / 37) * Math.cos(x / 91)));
      pctx.lineTo(pw, ph); pctx.closePath(); pctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
