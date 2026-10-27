/* Wristkeeper landing v3: entrances, the 3D hero, the step carousel, the preview video and the signup. */
(function () {
  "use strict";
  window.__wk2 = true; window.__wk3 = true;
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
      if (line) line.textContent = "Download on the";
    });
  }

  $$("[data-year]").forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

  // ---------- Header ----------
  var top = $("[data-top]");
  var onTop = function () { if (top) top.classList.toggle("is-solid", window.scrollY > 24); };
  window.addEventListener("scroll", onTop, { passive: true });
  onTop();

  // ---------- Entrances ----------
  var ins = $$("[data-in]");
  if (reduce || !("IntersectionObserver" in window)) {
    ins.forEach(function (n) { n.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    ins.forEach(function (n) { io.observe(n); });
  }

  // ---------- Cost per wear ----------
  var cpw = $("[data-cpw]");
  if (cpw) {
    var range = $("input", cpw), outN = $("[data-cpw-n]", cpw), outV = $("[data-cpw-v]", cpw);
    var paint = function () {
      var n = Math.max(1, parseInt(range.value, 10) || 1);
      outN.textContent = String(n);
      outV.textContent = "$" + (25 / n).toFixed(2);
      range.setAttribute("aria-valuetext", n + " wears, $" + (25 / n).toFixed(2) + " a wear");
    };
    range.addEventListener("input", paint);
    paint();
  }

  // ---------- Step carousel (phones) ----------
  var steps = $("[data-steps]"), dots = $$("[data-step-dot]");
  if (steps && dots.length && "IntersectionObserver" in window) {
    var cards = $$("[data-step]", steps);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.intersectionRatio > 0.6) {
          var i = cards.indexOf(e.target);
          dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
        }
      });
    }, { root: steps, threshold: [0.6] });
    cards.forEach(function (c) { so.observe(c); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { cards[k].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" }); }); });
  }

  // ---------- The 3D hero ----------
  // Loads only where it will run well: WebGL, motion allowed, no data saver,
  // not a slow connection, a device with some headroom. Starts after the page
  // has loaded and the reader moves, scrolls or waits a moment, so the still
  // carries the first paint.
  var stage = $("[data-hero]");
  function canRun3D() {
    if (reduce) return false;
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 3) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
    try {
      var t = doc.createElement("canvas");
      return !!(t.getContext("webgl2") || t.getContext("webgl"));
    } catch (e) { return false; }
  }
  if (stage && canRun3D()) {
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      ["pointermove", "touchstart", "scroll", "keydown", "wheel"].forEach(function (ev) { window.removeEventListener(ev, go); });
      import("/wristkeeper/assets/hero/hero.js").then(function (m) { return m.start(stage); }).catch(function () { /* the still stays */ });
    };
    var arm = function () {
      ["pointermove", "touchstart", "scroll", "keydown", "wheel"].forEach(function (ev) { window.addEventListener(ev, go, { passive: true, once: true }); });
      // Wide screens also start on their own after a moment; phones wait for
      // the first touch or scroll, to keep the first seconds light.
      if (window.innerWidth >= 960) setTimeout(go, 3500);
    };
    if (doc.readyState === "complete") arm(); else window.addEventListener("load", arm);
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
