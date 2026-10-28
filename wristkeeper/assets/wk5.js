/* Wristkeeper landing v5: the hero demo, the box, the pinned phone, the calculator, the report video, the dock and the signup. */
(function () {
  "use strict";
  var doc = document, win = window;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in win;

  // ---------- Where the buttons go ----------
  // Launch day: set APP_STORE_URL and the buttons become App Store downloads.
  var APP_STORE_URL = "";
  var BETA = "https://testflight.apple.com/join/s1WWcVCV";

  // ---------- Headline A/B test (50/50, sticky per visitor; ?v=a or ?v=b to force) ----------
  var v = (location.search.match(/[?&]v=([ab])/) || [])[1];
  if (!v) { try { v = localStorage.getItem("wk-v"); } catch (e) {} }
  if (v !== "a" && v !== "b") v = Math.random() < 0.5 ? "a" : "b";
  try { localStorage.setItem("wk-v", v); } catch (e) {}
  $$("[data-headline] [data-v]").forEach(function (s) { s.hidden = s.getAttribute("data-v") !== v; });
  // Each variant's clicks go through its own counted page, then on to TestFlight.
  $$("[data-cta]").forEach(function (a) {
    if (APP_STORE_URL) {
      a.href = APP_STORE_URL;
      var l = $("[data-cta-label]", a);
      if (l) l.textContent = l.textContent === "Join" ? "Get it" : "Download free";
    } else {
      a.href = "/wristkeeper/go/" + v + "/";
    }
  });

  var yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Header hairline ----------
  var top = $("[data-top]");
  function onScroll() { if (top) top.classList.toggle("scrolled", win.scrollY > 8); }
  win.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---------- 01 The demo ----------
  var W = "/wristkeeper/assets/v2/watches/";
  var picks = {
    rain:   { img: "invicta-pro-diver", name: "Invicta Pro Diver", why: "200m and a bracelet in the rain.", price: 110, wears: 4 },
    work:   { img: "seiko-alpinist", name: "Seiko Alpinist Green", why: "Not worn in 7 days. Its turn.", price: 450, wears: 9 },
    dinner: { img: "seiko-speedtimer", name: "Seiko Speedtimer", why: "Your sharpest dial, for tonight.", price: 520, wears: 12 },
    gym:    { img: "casio-gshock", name: "Casio G-Shock", why: "Built for knocks and sweat.", price: 99, wears: 31 },
    travel: { img: "fortis-flieger", name: "Fortis Flieger", why: "Big numerals, easy to read on the move.", price: 1200, wears: 8 }
  };
  // Warm the other renders once the page is idle.
  setTimeout(function () { Object.keys(picks).forEach(function (k) { var i = new Image(); i.src = W + picks[k].img + "-520.webp"; }); }, 1500);
  var cur = "rain", worn = {};
  var img = $("[data-watch]"), nm = $("[data-name]"), why = $("[data-why]"), wr = $("[data-wears]"), cp = $("[data-cpw]");
  var wearBtn = $("[data-wear]"), toast = $("[data-toast]"), chips = $(".ph-chips"), hint = $("[data-hint]");
  var day = $("[data-day]"); if (day) day.textContent = new Date().toLocaleDateString("en-US", { weekday: "long" });
  function money(n) { return n >= 100 ? "$" + Math.round(n).toLocaleString("en-US") : "$" + n.toFixed(2); }
  function times(n) { return "Worn " + n + (n === 1 ? " time" : " times"); }
  function paint(k) {
    var p = picks[k];
    nm.textContent = p.name; why.textContent = p.why;
    wr.textContent = times(p.wears); cp.textContent = money(p.price / p.wears);
    img.alt = p.name;
    wearBtn.classList.toggle("done", !!worn[k]);
    wearBtn.textContent = worn[k] ? "On your wrist today ✓" : "Wear this today";
  }
  function roll(el, a, b, ms) {
    var id = el._roll = (el._roll || 0) + 1;
    if (reduce) { el.textContent = money(b); return; }
    var t0 = performance.now();
    (function step(t) {
      if (el._roll !== id) return;
      var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = money(a + (b - a) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var touched = false;
  function firstTouch() {
    if (touched) return; touched = true;
    if (chips) chips.classList.remove("hinting");
    if (hint) hint.classList.add("gone");
  }
  if (chips) {
    chips.classList.add("hinting");
    $$("button", chips).forEach(function (b) {
      b.addEventListener("click", function () {
        firstTouch();
        var k = b.getAttribute("data-occ");
        if (k === cur) { k = "rain"; }
        $$("button", chips).forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-occ") === k); });
        cur = k;
        toast.classList.remove("on");
        if (reduce) { img.src = W + picks[k].img + "-520.webp"; paint(k); return; }
        img.classList.remove("in"); img.classList.add("out");
        setTimeout(function () {
          img.src = W + picks[k].img + "-520.webp";
          paint(k);
          img.classList.remove("out"); void img.offsetWidth; img.classList.add("in");
        }, 260);
      });
    });
  }
  var toastT;
  if (wearBtn) wearBtn.addEventListener("click", function () {
    firstTouch();
    var p = picks[cur];
    if (worn[cur]) { toast.innerHTML = "Already logged for today. Come back tomorrow for a new pick."; toast.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("on"); }, 2600); return; }
    var before = p.price / p.wears;
    p.wears += 1; worn[cur] = true;
    var after = p.price / p.wears;
    wr.textContent = times(p.wears);
    roll(cp, before, after, 900);
    wearBtn.classList.add("done"); wearBtn.textContent = "On your wrist today ✓";
    toast.innerHTML = "Logged. Cost per wear <b>" + money(before) + " → " + money(after) + "</b>. That's the whole job.";
    toast.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("on"); }, 3600);
  });
  var tryLink = $("[data-try]");
  if (tryLink) tryLink.addEventListener("click", function () { if (chips) setTimeout(function () { chips.classList.add("hinting"); touched = false; }, 400); });

  // ---------- Reveals, the box, the pinned phone ----------
  if (IO) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("seen"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    $$(".reveal").forEach(function (el) { rio.observe(el); });

    var box = $("[data-box]");
    if (box) {
      var bio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { setTimeout(function () { box.classList.add("gone"); }, reduce ? 0 : 500); bio.disconnect(); }
      }, { threshold: 0.45 });
      bio.observe(box);
    }

    var shots = $$("[data-shot]"), steps = $$("[data-step]");
    if (shots.length) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var n = e.target.getAttribute("data-step");
          steps.forEach(function (s) { s.classList.toggle("on", s === e.target); });
          shots.forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-shot") === n); });
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach(function (s) { sio.observe(s); });
      steps[0].classList.add("on");
    }
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("seen"); });
  }

  // ---------- 05 Calculator ----------
  var calc = $("[data-calc]");
  if (calc) {
    var price = 450, out = $("[data-out]", calc), range = $("[data-range]", calc), wo = $("[data-wears-out]", calc);
    var next = $("[data-next]", calc), own = $("[data-own]", calc), shown = price / 96;
    function nextLine(w) {
      var now = price / w, target;
      // The next round figure below today's cost per wear.
      var steps = [1000, 750, 500, 400, 300, 250, 200, 150, 100, 75, 50, 40, 30, 25, 20, 15, 10, 7.5, 5, 4, 3, 2.5, 2, 1.5, 1, 0.75, 0.5, 0.25];
      for (var i = 0; i < steps.length; i++) { if (steps[i] < now) { target = steps[i]; break; } }
      if (!target) return "That's about as good as value gets.";
      var need = Math.floor(price / target) + 1 - w;
      if (need <= 0) need = 1;
      return "Wear it " + need + " more " + (need === 1 ? "time" : "times") + " and it drops under " + money(target) + ".";
    }
    function update(animate) {
      var w = +range.value, val = price / w;
      wo.textContent = w;
      range.style.setProperty("--fill", ((w - 1) / 364 * 100) + "%");
      if (animate) roll(out, shown, val, 500); else { out._roll = (out._roll || 0) + 1; out.textContent = money(val); }
      shown = val;
      next.textContent = nextLine(w);
    }
    $$("[data-price]", calc).forEach(function (b) {
      b.addEventListener("click", function () {
        price = +b.getAttribute("data-price"); own.value = "";
        $$("[data-price]", calc).forEach(function (x) { x.classList.toggle("on", x === b); });
        update(true);
      });
    });
    own.addEventListener("input", function () {
      var n = parseFloat(own.value);
      if (n > 0) { price = n; $$("[data-price]", calc).forEach(function (x) { x.classList.remove("on"); }); update(false); }
    });
    range.addEventListener("input", function () { update(false); });
    update(false);

    // Share card: a 1080x1350 image for a story or a post.
    var shareBtn = $("[data-share]", calc);
    shareBtn.addEventListener("click", function () {
      var c = doc.createElement("canvas"); c.width = 1080; c.height = 1350;
      var x = c.getContext("2d"), w = +range.value;
      var g = x.createRadialGradient(780, 300, 50, 600, 600, 1100);
      g.addColorStop(0, "#3A2A6A"); g.addColorStop(0.55, "#0C0B12"); g.addColorStop(1, "#0C0B12");
      x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
      x.fillStyle = "#B6A4FF"; x.font = "500 30px 'Geist Mono', monospace"; x.fillText("MY WATCH, BY THE WEAR", 90, 170);
      x.fillStyle = "#F2EEE6"; x.font = "400 92px 'Instrument Serif', serif"; x.fillText("It cost me", 90, 330);
      x.fillStyle = "#D4F75C"; x.font = "700 250px Geist, sans-serif"; x.fillText(money(price / w), 80, 590);
      x.fillStyle = "#F2EEE6"; x.font = "italic 400 92px 'Instrument Serif', serif"; x.fillText("a wear.", 90, 720);
      x.fillStyle = "#CFCADB"; x.font = "400 40px Geist, sans-serif";
      x.fillText(money(price) + " watch, worn " + w + (w === 1 ? " time." : " times."), 90, 830);
      x.fillStyle = "#2B2838"; x.fillRect(90, 1110, 900, 2);
      x.fillStyle = "#F2EEE6"; x.font = "600 44px Geist, sans-serif"; x.fillText("Wristkeeper", 90, 1200);
      x.fillStyle = "#9C97AE"; x.font = "400 32px Geist, sans-serif"; x.fillText("theusefulmedia.com/wristkeeper", 90, 1252);
      c.toBlob(function (blob) {
        if (!blob) return;
        var file;
        try { file = new File([blob], "wristkeeper-cost-per-wear.png", { type: "image/png" }); } catch (e) {}
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: "My watch costs " + money(price / w) + " a wear. theusefulmedia.com/wristkeeper" }).catch(function () {});
        } else {
          var a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wristkeeper-cost-per-wear.png";
          doc.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        }
      }, "image/png");
    });
  }

  // ---------- 06 Report video: plays in view, sound on request ----------
  var video = $("[data-video]"), snd = $("[data-sound]");
  if (video) {
    var inView = false;
    if (IO) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!inView) video.pause();
      }, { threshold: 0.35 }).observe(video);
    }
    if (snd) snd.addEventListener("click", function () {
      var on = video.muted;
      video.muted = !on;
      if (on) { video.volume = 1; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      snd.setAttribute("aria-pressed", on ? "true" : "false");
      $("[data-sound-label]", snd).textContent = on ? "Sound on" : "Tap for sound";
    });
  }

  // ---------- Feature cards lean toward the pointer ----------
  if (!reduce && win.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(700px) rotateX(" + (-dy * 6) + "deg) rotateY(" + (dx * 8) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  // ---------- The dock: up after the hero, down at the final call ----------
  var dock = $("[data-dock]"), hero = $(".hero"), join = $("[data-join]");
  if (dock && hero && IO) {
    var pastHero = false, atJoin = false;
    function setDock() {
      var on = pastHero && !atJoin;
      dock.classList.toggle("on", on);
      dock.setAttribute("aria-hidden", on ? "false" : "true");
      var a = $("a", dock); if (a) a.tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; setDock(); }).observe(hero);
    if (join) new IntersectionObserver(function (es) { atJoin = es[0].isIntersecting; setDock(); }, { threshold: 0.2 }).observe(join);
  }

  // ---------- Signup: The Useful Tech Worker and Turnstile, loaded when near ----------
  var form = $("form[data-signup]");
  if (form) {
    var loaded = false, ready = false, pending = false;
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
    if (IO) {
      var fio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fio.disconnect(); loadSignup(); } }, { rootMargin: "600px 0px" });
      fio.observe(form);
    } else loadSignup();
    form.addEventListener("focusin", loadSignup);
    doc.addEventListener("signup:done", function (e) {
      var m = e.target.parentNode.querySelector(".signup-msg");
      m.className = "signup-msg is-done";
      m.textContent = e.detail && e.detail.existing ? "You're already on the list. See you on launch day." : "You're in. Check your inbox for a welcome note.";
    });
  }
})();
