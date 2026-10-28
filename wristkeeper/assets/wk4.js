/* Wristkeeper landing v4: the live dial, the power reserve gauge, the preview video and the signup. */
(function () {
  "use strict";
  window.__wk2 = true; window.__wk4 = true;
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var reduce = mq.matches;

  // ---------- App Store badge ----------
  // Launch day: put the App Store link between the quotes, for example
  // "https://apps.apple.com/app/id6819904928". Every badge then reads
  // "Download on the App Store" and links there. Also uncomment the
  // apple-itunes-app meta tag in /wristkeeper/index.html.
  var APP_STORE_URL = "";
  if (APP_STORE_URL) {
    $$("[data-store]").forEach(function (b) {
      b.setAttribute("href", APP_STORE_URL);
      b.removeAttribute("role");
      b.setAttribute("aria-label", "Download Wristkeeper on the App Store");
      var line = $("[data-store-line]", b);
      if (line) line.textContent = "Download on the"; else b.textContent = "Download on the App Store";
    });
  }

  $$("[data-year]").forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

  // ---------- Header ----------
  var top = $("[data-top]");
  var onTop = function () { if (top) top.classList.toggle("is-solid", window.scrollY > 24); };
  window.addEventListener("scroll", onTop, { passive: true });
  onTop();

  // ---------- The live dial ----------
  // The hero watch keeps the visitor's own time. The seconds hand ticks at
  // 8 beats a second, like an automatic movement; with reduced motion the
  // hands move once a minute.
  var hH = $("[data-hand=h]"), hM = $("[data-hand=m]"), hS = $("[data-hand=s]"), dateEl = $("[data-date]");
  if (hH && hM && hS) {
    var set = function (el, deg) { el.setAttribute("transform", "rotate(" + deg.toFixed(2) + " 200 200)"); };
    var tick = function () {
      var d = new Date(), ms = d.getMilliseconds(), s = d.getSeconds(), m = d.getMinutes(), h = d.getHours() % 12;
      var sec = reduce ? 0 : s + Math.floor(ms / 125) / 8;
      set(hS, sec * 6);
      set(hM, (m + s / 60) * 6);
      set(hH, (h + m / 60) * 30);
      if (dateEl) dateEl.textContent = String(d.getDate());
    };
    tick();
    if (reduce) setInterval(tick, 30000);
    else { var loop = function () { tick(); setTimeout(function () { requestAnimationFrame(loop); }, 125); }; loop(); }
    if (reduce) hS.style.display = "none";
  }

  // ---------- Power reserve: cost per wear ----------
  var gauge = $("[data-gauge]");
  if (gauge) {
    var needle = $("[data-needle]", gauge.parentNode.parentNode) || $("[data-needle]");
    var range = $("#wears"), outN = $("[data-wears]"), outV = $("[data-cpw]"), picks = $$("[data-price]");
    var price = 450;
    var fmt = function (v) { return "$" + (v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2)); };
    var paint = function () {
      var n = Math.max(1, parseInt(range.value, 10) || 1);
      var per = price / n;
      outN.textContent = String(n) + (n === 1 ? " time" : " times");
      outV.textContent = fmt(per);
      range.setAttribute("aria-valuetext", n + " wears, " + fmt(per) + " a wear");
      // 1 wear: the needle rests on "Full price"; it swings toward "Almost free" as wears add up.
      var f = 1 - 1 / n;
      needle.setAttribute("transform", "rotate(" + (-120 + 240 * f).toFixed(1) + " 200 210)");
    };
    picks.forEach(function (b) {
      b.addEventListener("click", function () {
        price = parseFloat(b.getAttribute("data-price"));
        picks.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        paint();
      });
    });
    range.addEventListener("input", paint);
    paint();
  }

  // ---------- Preview video ----------
  var video = $("[data-video]"), sound = $("[data-sound]");
  if (video) {
    if (reduce) {
      video.setAttribute("controls", "");
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
          else video.pause();
        });
      }, { threshold: 0.35 }).observe(video);
    }
    if (sound) sound.addEventListener("click", function () {
      var on = video.muted;
      video.muted = !on;
      sound.setAttribute("aria-pressed", on ? "true" : "false");
      $("span", sound).textContent = on ? "Sound off" : "Sound on";
      if (on && video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }

  // ---------- Signup ----------
  // The Useful Tech signup (the same Worker and Turnstile check as /tech/),
  // loaded only when the form comes near, tagged utm_source=wristkeeper.
  var form = $("form[data-signup]");
  if (form) {
    var loaded = false, ready = false, pending = false;
    // Until tech.js is in, hold a submit and replay it once it loads.
    form.addEventListener("submit", function (e) { if (!ready) { e.preventDefault(); pending = true; loadSignup(); } });
    var loadSignup = function () {
      if (loaded) return;
      loaded = true;
      var s1 = doc.createElement("script");
      s1.src = "/tech/tech.js";
      s1.onload = function () {
        ready = true;
        if (pending && form.requestSubmit) form.requestSubmit();
        var s2 = doc.createElement("script");
        s2.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tutTurnstileReady";
        s2.async = true;
        doc.head.appendChild(s2);
      };
      doc.head.appendChild(s1);
    };
    if ("IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sio.disconnect(); loadSignup(); } }, { rootMargin: "600px 0px" });
      sio.observe(form);
    } else loadSignup();
    form.addEventListener("focusin", loadSignup);
    doc.addEventListener("signup:done", function (e) {
      var m = e.target.parentNode.querySelector(".signup-msg");
      m.className = "signup-msg is-done";
      m.textContent = e.detail && e.detail.existing ? "You're already on the list. See you on launch day." : "You're in. Check your inbox for a welcome note.";
    });
  }
})();
