/* Wristkeeper landing v2: entrances, the strap, the 3D hero, the preview video and the signup. */
(function () {
  "use strict";
  window.__wk2 = true;
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

  // ---------- The strap ----------
  // One leather strap runs from the hero watch down through every phone to
  // the buckle above the signup. Drawn from the anchors' real positions, so
  // it follows the layout at every width. It runs out as you scroll.
  var svg = $("[data-strap]");
  var main = $("#main");
  var strap = null;
  function buildStrap() {
    if (!svg || !main) return;
    var anchors = $$("[data-strap-anchor]");
    if (anchors.length < 2) return;
    var mr = main.getBoundingClientRect();
    var W = main.clientWidth, H = main.scrollHeight;
    // Below 960 px the hero stacks, so the strap keeps to the right edge.
    var narrow = W < 960;
    var sw = W < 760 ? 16 : narrow ? 24 : 34;
    var pts = anchors.map(function (a, i) {
      var r = a.getBoundingClientRect();
      var x = r.left - mr.left + r.width / 2, y = r.top - mr.top + r.height / 2;
      if (a.getAttribute("data-strap-anchor") === "start") y = r.top - mr.top + r.height * 0.78;
      if (a.getAttribute("data-strap-anchor") === "end") y = r.top - mr.top + r.height / 2;
      // On phones the strap hugs the right edge, clear of the text, and only
      // comes in to the centre at the hero watch and at the buckle.
      if (narrow && a.getAttribute("data-strap-anchor") !== "end") x = W - 13 + (i % 2 ? -4 : 4);
      if (narrow && i === 0) y = r.top - mr.top + r.height * 0.5;
      return [x, y];
    });
    // Catmull-Rom through the anchors, as cubic Beziers.
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var t = 0.5;
      var c1 = [p1[0] + (p2[0] - p0[0]) * t / 3 * 1.6, p1[1] + (p2[1] - p0[1]) * t / 3];
      var c2 = [p2[0] - (p3[0] - p1[0]) * t / 3 * 1.6, p2[1] - (p3[1] - p1[1]) * t / 3];
      d += " C" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.style.height = H + "px";
    var set = function (cls, w) { var p = $("." + cls, svg); p.setAttribute("d", d); p.setAttribute("stroke-width", w); return p; };
    set("strap-edge", sw + 2);
    set("strap-body", sw);
    set("strap-stitch", sw - 7);
    set("strap-top", sw - 10);
    var sheen = set("strap-sheen", 2);
    sheen.setAttribute("transform", "translate(-" + (sw * 0.18).toFixed(1) + " 0)");
    var mask = set("strap-mask", sw + 8);
    var len = mask.getTotalLength();
    // Length along the path for each y, for the scroll reveal.
    var table = [], N = 240;
    for (var k = 0; k <= N; k++) { var l = len * k / N; table.push([mask.getPointAtLength(l).y, l]); }
    strap = { mask: mask, len: len, table: table, top: mr.top + window.scrollY, shown: strap && strap.len ? strap.shown * len / strap.len : 0 };
    mask.style.strokeDasharray = len + " " + len;
    revealStrap();
  }
  function lengthAt(y) {
    var t = strap.table, best = 0;
    for (var i = 0; i < t.length; i++) { if (t[i][0] <= y) best = Math.max(best, t[i][1]); }
    return best;
  }
  var strapTick = false;
  function revealStrap() {
    strapTick = false;
    if (!strap) return;
    if (reduce) { strap.mask.style.strokeDashoffset = "0"; return; }
    var y = window.scrollY + window.innerHeight * 0.72 - strap.top;
    // Once run out, the strap stays: it never pulls back up.
    strap.shown = Math.max(strap.shown || 0, lengthAt(y));
    strap.mask.style.strokeDashoffset = String(strap.len - strap.shown);
  }
  if (svg) {
    window.addEventListener("scroll", function () { if (!strapTick) { strapTick = true; requestAnimationFrame(revealStrap); } }, { passive: true });
    var rb;
    var rebuild = function () { clearTimeout(rb); rb = setTimeout(buildStrap, 150); };
    window.addEventListener("resize", rebuild);
    window.addEventListener("load", buildStrap);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(buildStrap);
    if ("ResizeObserver" in window && main) new ResizeObserver(rebuild).observe(main);
    buildStrap();
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
