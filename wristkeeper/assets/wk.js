/* Wristkeeper pages: theme, scroll reveals and the small demos. */
(function () {
  "use strict";
  window.__wk = true;
  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Theme: system, light or dark (shared key with the rest of the site) ----------
  var tbtn = $(".theme-btn");
  if (tbtn) {
    var KEY = "tumc-theme";
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var mode = saved === "light" || saved === "dark" ? saved : "system";
    var labels = { system: "Colour theme: match your device", light: "Colour theme: light", dark: "Colour theme: dark" };
    var paint = function () {
      tbtn.setAttribute("data-mode", mode);
      tbtn.setAttribute("aria-label", labels[mode]);
    };
    paint();
    tbtn.addEventListener("click", function () {
      var order = ["system", "light", "dark"];
      mode = order[(order.indexOf(mode) + 1) % 3];
      if (mode === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", mode);
      try { if (mode === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
      paint();
    });
  }

  // ---------- Header hairline once the page scrolls ----------
  var header = $(".wk-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---------- Scroll reveal ----------
  var reveals = $$("[data-reveal]");
  var watchers = [];
  var onView = function (el, fn) { watchers.push([el, fn]); };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        watchers.forEach(function (w) { if (w[0] === en.target && !w[2]) { w[2] = true; w[1](); } });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    // Elements that only run a demo once in view
    onView = function (el, fn) {
      watchers.push([el, fn]);
      if (el.hasAttribute("data-reveal")) return;
      io.observe(el);
    };
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    onView = function (el, fn) { fn(); };
  }

  // ---------- Number tween ----------
  var tween = function (from, to, ms, step) {
    if (reduce) { step(to); return; }
    var t0 = null;
    var tick = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      step(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---------- Daily pick demo ----------
  var pick = $("[data-pick]");
  if (pick) {
    var picks = {
      office: { name: "Field watch", why: "Rain after four. Last worn 12 days ago.", wx: "Rain 22°", icon: "rain", dial: "#2F4A3A", strap: "#5B4636", hh: "-62deg", mh: "48deg" },
      dinner: { name: "Dress watch", why: "A clear evening. Last worn 31 days ago.", wx: "Clear 24°", icon: "moon", dial: "#F1EDE4", strap: "#2B2C40", hh: "40deg", mh: "-160deg", light: true },
      weekend: { name: "Diver", why: "Sunny and 31°. Built for the pool.", wx: "Sunny 31°", icon: "sun", dial: "#1F3A5A", strap: "#3A3F55", hh: "120deg", mh: "-30deg" },
      travel: { name: "GMT", why: "Two time zones today. Last worn 18 days ago.", wx: "Cloudy 19°", icon: "cloud", dial: "#16172B", strap: "#6B2F3A", hh: "-120deg", mh: "90deg" }
    };
    var nameEl = $("[data-pick-name]", pick), whyEl = $("[data-pick-why]", pick), wxEl = $("[data-pick-wx]", pick);
    var watch = $(".pick-watch", pick);
    var swaps = $$(".swap", pick);
    var chips = $$(".chip", pick);
    var setPick = function (key) {
      var p = picks[key];
      if (!p) return;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-occ") === key ? "true" : "false"); });
      swaps.forEach(function (s) { s.classList.add("is-out"); });
      watch.style.setProperty("--dial", p.dial);
      watch.style.setProperty("--strap", p.strap);
      watch.style.setProperty("--hh", p.hh);
      watch.style.setProperty("--mh", p.mh);
      watch.classList.toggle("is-light", !!p.light);
      setTimeout(function () {
        nameEl.textContent = p.name;
        whyEl.textContent = p.why;
        wxEl.textContent = p.wx;
        $$("[data-wx]", pick).forEach(function (s) { s.style.display = s.getAttribute("data-wx") === p.icon ? "" : "none"; });
        swaps.forEach(function (s) { s.classList.remove("is-out"); });
      }, reduce ? 0 : 240);
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { setPick(c.getAttribute("data-occ")); }); });
  }

  // ---------- Log a wear demo ----------
  var log = $("[data-log]");
  if (log) {
    var price = 1200, base = 38;
    var btn = $(".log-btn", log), num = $("[data-cpw]", log), wears = $("[data-wears]", log), delta = $("[data-delta]", log);
    var today = $(".month i.today", log);
    var logged = false;
    var fmt = function (v) { return v.toFixed(2); };
    btn.addEventListener("click", function () {
      logged = !logged;
      btn.setAttribute("aria-pressed", logged ? "true" : "false");
      var a = price / (logged ? base : base + 1), b = price / (logged ? base + 1 : base);
      tween(a, b, 900, function (v) { num.textContent = fmt(v); });
      wears.textContent = (logged ? base + 1 : base) + " wears";
      today.classList.toggle("w", logged);
      delta.classList.toggle("show", logged);
    });
  }

  // ---------- Insight bars grow in ----------
  var bars = $("[data-bars]");
  if (bars && !reduce) {
    $$(".bar i", bars).forEach(function (i) { i.style.setProperty("--grow", "0"); });
    onView(bars, function () {
      $$(".bar i", bars).forEach(function (i, n) { setTimeout(function () { i.style.setProperty("--grow", "1"); }, 120 * n); });
    });
  }

  // ---------- Ask your collection: play the conversation once in view ----------
  var chat = $("[data-chat]");
  if (chat && !reduce && "IntersectionObserver" in window) {
    var msgs = $$(".msg", chat);
    var typing = $(".typing", chat);
    chat.classList.add("is-pending");
    onView(chat, function () {
      var t = 300;
      msgs.forEach(function (m) {
        if (m.classList.contains("ai")) {
          (function (at) {
            setTimeout(function () { m.parentNode.insertBefore(typing, m); typing.classList.add("is-on"); }, at);
          })(t);
          t += 1100;
        }
        (function (at) {
          setTimeout(function () { typing.classList.remove("is-on"); m.classList.add("is-shown"); }, at);
        })(t);
        t += m.classList.contains("ai") ? 900 : 700;
      });
    });
  }

  // ---------- Copy email ----------
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      var label = b.textContent;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = label; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  // ---------- Year ----------
  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
