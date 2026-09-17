// The Useful Media Co: interaction layer. No libraries.
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  // ---------- Year ----------
  var y = $("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Toast ----------
  var toastEl = $(".toast"), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  // ---------- Scroll progress + back to top ----------
  var progress = $(".progress"), toTop = $(".to-top"), lastY = 0, ticker = $(".ticker"), ticking = false;
  function onScroll() {
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progress) progress.style.setProperty("--p", p.toFixed(4));
    if (toTop) {
      toTop.style.setProperty("--p", p.toFixed(4));
      toTop.classList.toggle("is-on", window.scrollY > 600);
    }
    lastY = window.scrollY;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  // ---------- Split text ----------
  $$('[data-split="chars"]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    var i = 0;
    el.innerHTML = text.split(" ").map(function (word) {
      var chars = Array.from(word).map(function (c) {
        return '<span class="ch" style="--i:' + (i++) + '">' + c + "</span>";
      }).join("");
      i++;
      return '<span class="word" aria-hidden="true">' + chars + "</span>";
    }).join(" ");
    el.classList.add("is-split");
  });
  $$('[data-split="words"]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(" ").map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
  });

  // ---------- Kinetic headline: letters get heavier near the pointer ----------
  var kinetic = $(".kinetic");
  if (kinetic && fine && !reduce) {
    var chars = $$(".ch", kinetic), centers = [];
    var measure = function () {
      centers = chars.map(function (c) {
        var r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY };
      });
    };
    setTimeout(measure, 1200);
    window.addEventListener("resize", measure);
    var hero = kinetic.closest("section");
    var raf = 0, px = -9999, py = -9999;
    var paint = function () {
      raf = 0;
      for (var k = 0; k < chars.length; k++) {
        var c = centers[k]; if (!c) continue;
        var dx = c.x - px, dy = c.y - (py + window.scrollY);
        var d = Math.sqrt(dx * dx + dy * dy);
        var t = Math.max(0, 1 - d / 190);
        chars[k].style.fontWeight = Math.round(500 + 200 * t);
        chars[k].style.transform = t > 0 ? "translateY(" + (-6 * t).toFixed(1) + "px)" : "";
        chars[k].classList.toggle("is-hot", t > 0.72);
      }
    };
    hero.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (!centers.length) measure();
      if (!raf) raf = requestAnimationFrame(paint);
    });
    hero.addEventListener("pointerleave", function () {
      px = py = -9999;
      if (!raf) raf = requestAnimationFrame(paint);
    });
  }

  // ---------- In-view observer: counters, word reveals, sparkline ----------
  function countUp(el) {
    var end = Number(el.getAttribute("data-count"));
    var from = Number(el.getAttribute("data-from") || 0);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = end + suffix; return; }
    var start = null, dur = 1400;
    var step = function (ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(from + (end - from) * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = from + suffix;
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute("data-count")) setTimeout(function () { countUp(el); }, 700);
        else el.classList.add(el.classList.contains("cell") ? "in-view" : "in");
        io.unobserve(el);
      });
    }, { threshold: 0.35 });
    $$("[data-count], [data-split='words'], .cell--creator").forEach(function (el) { io.observe(el); });
  } else {
    $$("[data-split='words']").forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- Header mark mirrors the brand cells ----------
  var headRects = $$(".site-header .mark rect");
  $$("[data-cell]").forEach(function (cell) {
    var i = Number(cell.getAttribute("data-cell"));
    var on = function () { if (headRects[i]) headRects[i].classList.add("is-lit"); };
    var off = function () { if (headRects[i]) headRects[i].classList.remove("is-lit"); };
    cell.addEventListener("mouseenter", on);
    cell.addEventListener("mouseleave", off);
    cell.addEventListener("focusin", on);
    cell.addEventListener("focusout", off);
  });

  // ---------- Cells: spotlight follows pointer, gentle 3D tilt ----------
  $$(".cell").forEach(function (cell) {
    cell.addEventListener("pointermove", function (e) {
      var r = cell.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, yy = (e.clientY - r.top) / r.height;
      cell.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      cell.style.setProperty("--my", (yy * 100).toFixed(1) + "%");
      if (fine && !reduce) {
        var max = cell.classList.contains("cell--apps") ? 1.2 : 3;
        cell.style.transform = "perspective(900px) rotateX(" + ((0.5 - yy) * max).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * max).toFixed(2) + "deg)";
      }
    });
    cell.addEventListener("pointerleave", function () { cell.style.transform = ""; });
  });

  // ---------- Live watch dial: automatic sweep at 8 beats per second ----------
  var dial = $(".dial");
  if (dial) {
    var hh = $(".hand-h", dial), mm = $(".hand-m", dial), ss = $(".hand-s", dial);
    var sweep = function () {
      var n = new Date();
      var sec = n.getSeconds() + n.getMilliseconds() / 1000;
      var beat = reduce ? Math.floor(sec) : Math.floor(sec * 8) / 8;
      var min = n.getMinutes() + sec / 60;
      var hr = (n.getHours() % 12) + min / 60;
      hh.style.transform = "rotate(" + (hr * 30).toFixed(3) + "deg)";
      mm.style.transform = "rotate(" + (min * 6).toFixed(3) + "deg)";
      ss.style.transform = "rotate(" + (beat * 6).toFixed(3) + "deg)";
      requestAnimationFrame(sweep);
    };
    requestAnimationFrame(sweep);
  }

  // ---------- The six-cell toy ----------
  var toy = $(".toy");
  if (toy) {
    var cells = $$(".toy-cell", toy), count = $(".toy-count", toy), lit = 0, idleTimer;
    var names = ["The Useful Tech", "The Useful Life", "The Useful Creator", "The Useful Gaming", "Products", "Wristkeeper"];
    var update = function () {
      lit = cells.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; }).length;
      if (count) count.textContent = lit + " of 6";
    };
    cells.forEach(function (c) {
      c.addEventListener("click", function () {
        var on = c.getAttribute("aria-pressed") !== "true";
        c.setAttribute("aria-pressed", String(on));
        c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
        update();
        var target = $('[data-cell="' + c.getAttribute("data-i") + '"]');
        if (on && target) { target.classList.remove("is-flash"); void target.offsetWidth; target.classList.add("is-flash"); }
        if (on && lit < 6) toast(names[Number(c.getAttribute("data-i"))] + " lit. " + (6 - lit) + " to go.");
        if (lit === 6) {
          toast("All six lit. That is the whole company.");
          confetti(toy);
          setTimeout(function () {
            cells.forEach(function (x, k) { setTimeout(function () { x.setAttribute("aria-pressed", "false"); update(); }, k * 90); });
          }, 2600);
        }
      });
      if (fine && !reduce) {
        c.addEventListener("pointermove", function (e) {
          var r = c.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = "translate(" + (dx * 8).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px) rotateX(" + (-dy * 18).toFixed(1) + "deg) rotateY(" + (dx * 18).toFixed(1) + "deg)";
        });
        c.addEventListener("pointerleave", function () { c.style.transform = ""; });
      }
    });
    // Idle shimmer: one cell blinks now and then until someone plays
    if (!reduce) {
      idleTimer = setInterval(function () {
        if (lit > 0) return;
        var c = cells[Math.floor(Math.random() * cells.length)];
        c.classList.add("is-idle");
        setTimeout(function () { c.classList.remove("is-idle"); }, 650);
      }, 1600);
    }
  }

  function confetti(origin) {
    if (reduce) return;
    var r = origin.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 3;
    var colors = ["#7C5CFC", "#17172B", "#ECE7FF", "#9A82FF", "#FAFAF8"];
    for (var i = 0; i < 60; i++) {
      var p = doc.createElement("span");
      p.className = "confetti";
      p.style.background = colors[i % colors.length];
      if (i % 5 === 4) p.style.boxShadow = "0 0 0 1px #17172B";
      p.style.left = ox + "px"; p.style.top = oy + "px";
      doc.body.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 260;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 120;
      var anim = p.animate([
        { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
        { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (Math.random() * 540) + "deg) scale(1)", opacity: 1, offset: 0.55 },
        { transform: "translate(" + dx * 1.15 + "px," + (dy + 260) + "px) rotate(" + (Math.random() * 900) + "deg) scale(.6)", opacity: 0 }
      ], { duration: 1500 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)" });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }

  // ---------- Magnetic buttons ----------
  if (fine && !reduce) {
    $$(".btn, .chip, .copy").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.28).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  // ---------- Cursor companion ----------
  if (fine && !reduce) {
    var cur = doc.createElement("div");
    cur.className = "cursor is-hidden";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = "<span></span>";
    doc.body.appendChild(cur);
    var label = cur.firstChild, tx = -100, ty = -100, cx = -100, cy = -100;
    doc.addEventListener("pointermove", function (e) { tx = e.clientX + 18; ty = e.clientY + 22; cur.classList.remove("is-hidden"); });
    doc.addEventListener("pointerleave", function () { cur.classList.add("is-hidden"); });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.setProperty("--cx", cx.toFixed(1) + "px");
      cur.style.setProperty("--cy", cy.toFixed(1) + "px");
      requestAnimationFrame(loop);
    })();
    var labelFor = function (el) {
      if (el.hasAttribute("data-cursor")) return el.getAttribute("data-cursor");
      if (el.classList.contains("toy-cell")) return el.getAttribute("aria-pressed") === "true" ? "Turn off" : "Light it";
      if (el.classList.contains("copy")) return "Copy";
      if (el.classList.contains("vbtn")) return el.getAttribute("data-dir") === "1" ? "Next" : "Back";
      if (el.classList.contains("footer-mark")) return "Shuffle";
      if (el.classList.contains("to-top")) return "Top";
      var href = el.getAttribute("href") || "";
      if (href.indexOf("mailto:") === 0) return "Email";
      if (el.target === "_blank") return "Visit";
      return "Open";
    };
    doc.addEventListener("pointerover", function (e) {
      var el = e.target.closest("a, button");
      if (el) { label.textContent = labelFor(el); cur.classList.add("is-label"); }
    });
    doc.addEventListener("pointerout", function (e) {
      var el = e.target.closest("a, button");
      if (el && !el.contains(e.relatedTarget)) cur.classList.remove("is-label");
    });
    doc.addEventListener("click", function (e) {
      var el = e.target.closest(".toy-cell");
      if (el) label.textContent = labelFor(el);
    });
  }

  // ---------- Copy email ----------
  $$(".copy").forEach(function (b) {
    var lab = $(".copy-label", b);
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      var done = function () {
        b.classList.add("is-done"); lab.textContent = "Copied";
        toast(text + " copied to your clipboard.");
        setTimeout(function () { b.classList.remove("is-done"); lab.textContent = "Copy email"; }, 2200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  });
  function fallbackCopy(text) {
    var t = doc.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    doc.body.appendChild(t); t.select();
    try { doc.execCommand("copy"); } catch (err) {}
    t.remove();
  }

  // ---------- Footer mark shuffle ----------
  var fm = $(".footer-mark");
  if (fm) {
    var fr = $$("rect", fm), clicks = 0;
    fm.addEventListener("click", function () {
      clicks++;
      fr.forEach(function (r) { r.classList.remove("is-lit"); });
      fr[Math.floor(Math.random() * fr.length)].classList.add("is-lit");
      if (clicks === 6) { toast("Six shuffles. You found the footer toy."); confetti(fm); clicks = 0; }
    });
  }

  // ---------- Rotating hook word ----------
  var rotator = $(".rotator");
  if (rotator) {
    var words = $$(".rot", rotator), idx = 0;
    var fit = function () { rotator.style.width = words[idx].getBoundingClientRect().width + "px"; };
    setTimeout(function () { fit(); rotator.classList.add("is-drawn"); }, 400);
    window.addEventListener("resize", fit);
    if (!reduce) {
      setInterval(function () {
        var prev = words[idx];
        prev.classList.remove("is-on"); prev.classList.add("is-out");
        setTimeout(function () { prev.classList.remove("is-out"); }, 650);
        idx = (idx + 1) % words.length;
        words[idx].classList.add("is-on");
        fit();
      }, 2400);
    }
  }

  // ---------- Creator growth chart: plays in view once, loops on hover ----------
  var growth = $(".growth"), creator = $(".cell--creator");
  if (growth && creator) {
    var stopT, hovering = false;
    var play = function (ms) {
      clearTimeout(stopT);
      growth.classList.remove("play"); void growth.offsetWidth; growth.classList.add("play");
      if (ms) stopT = setTimeout(function () { if (!hovering) growth.classList.remove("play"); }, ms);
    };
    creator.addEventListener("mouseenter", function () { hovering = true; play(0); });
    creator.addEventListener("mouseleave", function () { hovering = false; stopT = setTimeout(function () { growth.classList.remove("play"); }, 2600); });
    if ("IntersectionObserver" in window) {
      var gio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { play(2600); gio.disconnect(); }
      }, { threshold: 0.5 });
      gio.observe(creator);
    }
    creator.addEventListener("click", function (e) { if (!e.target.closest("a")) play(5200); });
  }

  // ---------- Reader quotes: a swipeable card deck ----------
  var deck = $(".deck");
  if (deck) {
    var voices = deck.closest(".voices");
    var qcards = $$(".qcard", deck), order = qcards.map(function (_, i) { return i; });
    var bars = $$(".vbars span", voices), countB = $(".vcount b", voices);
    var DUR = 7000, autoT = null, paused = false;
    var fit = function () {
      var h = 0;
      qcards.forEach(function (c) { c.style.minHeight = "0"; h = Math.max(h, c.offsetHeight); c.style.minHeight = ""; });
      deck.style.setProperty("--deck-h", (h + 48) + "px");
    };
    var layout = function () {
      order.forEach(function (idx, k) {
        var c = qcards[idx];
        c.classList.toggle("is-top", k === 0);
        c.setAttribute("aria-hidden", String(k !== 0));
        c.style.zIndex = String(20 - k);
        if (!c.classList.contains("is-drag")) {
          var rot = k === 0 ? 0 : (k % 2 ? 3 : -3) * Math.min(k, 2);
          c.style.transform = "translate3d(0," + (k * 16) + "px,0) scale(" + (1 - k * 0.05) + ") rotate(" + rot + "deg)";
          c.style.opacity = k > 2 ? "0" : "1";
        }
      });
      var cur = order[0];
      bars.forEach(function (bar, i) {
        bar.classList.remove("now", "done");
        if (i < cur) bar.classList.add("done");
      });
      if (bars[cur]) { void bars[cur].offsetWidth; bars[cur].classList.add("now"); }
      if (countB) { countB.textContent = cur + 1; countB.classList.remove("bump"); void countB.offsetWidth; countB.classList.add("bump"); }
    };
    var schedule = function () {
      clearTimeout(autoT);
      if (reduce || paused) return;
      autoT = setTimeout(function () { go(1, 1); }, DUR);
    };
    var go = function (dir, flingX) {
      var top = qcards[order[0]];
      if (dir > 0) {
        var fx = (flingX >= 0 ? 1 : -1);
        top.style.transform = "translate3d(" + (fx * 120) + "%, -30px, 0) rotate(" + (fx * 18) + "deg)";
        top.style.opacity = "0";
        setTimeout(function () {
          order.push(order.shift());
          top.style.transition = "none"; layout(); void top.offsetWidth; top.style.transition = "";
        }, reduce ? 0 : 320);
        setTimeout(layout, reduce ? 0 : 340);
      } else {
        order.unshift(order.pop());
        var incoming = qcards[order[0]];
        incoming.style.transition = "none";
        incoming.style.transform = "translate3d(-120%, -30px, 0) rotate(-18deg)"; incoming.style.opacity = "0";
        incoming.style.zIndex = "30";
        void incoming.offsetWidth; incoming.style.transition = "";
        layout();
      }
      schedule();
    };
    var jump = function (i) {
      while (order[0] !== i) order.push(order.shift());
      layout(); schedule();
    };
    // Dragging the top card
    var sx = 0, sy = 0, dx = 0, dragging = null;
    deck.addEventListener("pointerdown", function (e) {
      var top = qcards[order[0]];
      if (!top.contains(e.target) || e.target.closest("a")) return;
      dragging = top; sx = e.clientX; sy = e.clientY; dx = 0;
      top.classList.add("is-drag"); top.setPointerCapture(e.pointerId);
      clearTimeout(autoT);
    });
    deck.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - sx; var dy = (e.clientY - sy) * 0.25;
      dragging.style.transform = "translate3d(" + dx + "px," + dy + "px,0) rotate(" + (dx * 0.05) + "deg)";
    });
    var release = function () {
      if (!dragging) return;
      var c = dragging; dragging = null; c.classList.remove("is-drag");
      if (Math.abs(dx) > 90) go(1, dx); else { layout(); schedule(); }
    };
    deck.addEventListener("pointerup", release);
    deck.addEventListener("pointercancel", release);
    // Controls
    $$(".vbtn", voices).forEach(function (btn) {
      btn.addEventListener("click", function () { go(Number(btn.getAttribute("data-dir")), 1); });
    });
    bars.forEach(function (bar, i) { bar.addEventListener("click", function () { jump(i); }); });
    deck.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1, 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1, -1); }
    });
    voices.addEventListener("mouseenter", function () { paused = true; voices.classList.add("is-paused"); clearTimeout(autoT); });
    voices.addEventListener("mouseleave", function () { paused = false; voices.classList.remove("is-paused"); schedule(); });
    // Only auto-advance while the section is on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { voices.classList.remove("is-paused"); if (!paused) schedule(); }
        else { clearTimeout(autoT); voices.classList.add("is-paused"); }
      }, { threshold: 0.4 }).observe(voices);
    }
    fit(); layout();
    window.addEventListener("resize", function () { fit(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  // ---------- Gaming card: tiny runner ----------
  var runner = $(".runner");
  if (runner) {
    var cv = $("canvas", runner), ctx = cv.getContext("2d"), scoreEl = $(".runner-score", runner), hint = $(".runner-hint");
    var gcell = runner.closest(".cell");
    var W, H, ground, dpr = Math.min(2, window.devicePixelRatio || 1);
    var size = function () {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height; ground = H - 6;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); window.addEventListener("resize", size);
    var g = { y: 0, vy: 0, obs: [], t: 0, speed: 3, score: 0, best: 0, running: false, manual: false, over: 0, spawn: 60, squash: 0 };
    var P = { x: 26, s: 18 };
    var ink, purple, lilac, paperC;
    var readColors = function () {
      var cs = getComputedStyle(gcell);
      ink = cs.getPropertyValue("--ink").trim() || "#17172B";
      purple = cs.getPropertyValue("--purple").trim() || "#7C5CFC";
      lilac = cs.getPropertyValue("--lilac").trim() || "#ECE7FF";
      paperC = cs.getPropertyValue("--paper").trim() || "#FAFAF8";
    };
    readColors();
    doc.addEventListener("themechange", function () { readColors(); if (typeof draw === "function") draw(); });
    var jump = function () { if (g.y === 0 && !g.over) { g.vy = 7.6; g.squash = 1; } };
    var reset = function () { g.obs = []; g.t = 0; g.speed = 3; g.score = 0; g.over = 0; g.spawn = 50; g.y = 0; g.vy = 0; };
    var setScore = function () {
      var s = String(Math.floor(g.score)).padStart(3, "0");
      if (scoreEl.textContent !== s) {
        scoreEl.textContent = s;
        if (Math.floor(g.score) % 50 === 0 && g.score > 1) { scoreEl.classList.remove("bump"); void scoreEl.offsetWidth; scoreEl.classList.add("bump"); }
      }
    };
    var rr = function (x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      // far background cells drift slowly
      ctx.fillStyle = lilac;
      for (var cI = 0; cI < 4; cI++) {
        var cx0 = ((cI * 97 + 40 - g.t * g.speed * 0.25) % (W + 40) + (W + 40)) % (W + 40) - 20;
        rr(cx0, 10 + (cI % 2) * 14, 16 - (cI % 2) * 6, 10 - (cI % 2) * 4, 3, lilac);
      }
      // dashes on the ground move with speed
      ctx.fillStyle = ink; ctx.globalAlpha = 0.25;
      for (var k = 0; k < W; k += 22) ctx.fillRect(((k - g.t * g.speed) % W + W) % W, ground + 2, 8, 2);
      ctx.globalAlpha = 1;
      // obstacles are little cells, some stacked
      g.obs.forEach(function (o) {
        for (var q = 0; q < o.h; q++) rr(o.x, ground - (q + 1) * 13, 12, 11, 2.5, q === o.h - 1 && o.p ? purple : ink);
      });
      // player: purple cell with eyes, squashes on landing
      var sq = g.squash * 0.25;
      var pw = P.s * (1 + sq), ph = P.s * (1 - sq);
      var py = ground - ph - g.y;
      rr(P.x - (pw - P.s) / 2, py, pw, ph, 5, g.over ? ink : purple);
      ctx.fillStyle = g.over ? lilac : paperC;
      var blink = (g.t % 140) < 6;
      if (g.over) {
        ctx.font = "600 9px ui-monospace, monospace"; ctx.fillText("x x", P.x + 1, py + 11);
      } else if (!blink) {
        ctx.fillRect(P.x + 9, py + 5, 3, 4); ctx.fillRect(P.x + 14, py + 5, 3, 4);
      }
      if (g.over) {
        ctx.fillStyle = ink; ctx.font = "500 11px ui-monospace, monospace";
        ctx.fillText("Game over. Click to retry.", Math.max(60, W / 2 - 70), 18);
      }
    };
    var step = function () {
      if (!g.running) return;
      g.t++;
      if (!g.over) {
        g.speed = Math.min(7, 3 + g.t / 900);
        g.score += 0.12 * g.speed;
        setScore();
        g.spawn--;
        if (g.spawn <= 0) {
          g.obs.push({ x: W + 10, h: Math.random() < 0.3 ? 2 : 1, p: Math.random() < 0.4, passed: false });
          g.spawn = 55 + Math.random() * 60 - g.speed * 3;
        }
        g.obs.forEach(function (o) { o.x -= g.speed; });
        g.obs = g.obs.filter(function (o) { return o.x > -20; });
        // autopilot jumps until the visitor takes over
        if (!g.manual) {
          var next = g.obs.find(function (o) { return o.x > P.x; });
          if (next && next.x - P.x < 20 + g.speed * 7.5) jump();
        }
        g.vy -= 0.55; g.y = Math.max(0, g.y + g.vy);
        if (g.y === 0 && g.vy < 0) { if (g.squash === 0 && g.vy < -3) g.squash = 0.8; g.vy = 0; }
        g.squash *= 0.8; if (g.squash < 0.02) g.squash = 0;
        // collisions
        g.obs.forEach(function (o) {
          var top = ground - o.h * 13;
          var pb = ground - g.y;
          if (o.x < P.x + P.s - 3 && o.x + 12 > P.x + 3 && pb > top + 2) {
            g.over = 1; g.manual = false;
            if (hint) hint.textContent = "Score " + Math.floor(g.score) + ". Click to play again.";
          }
        });
      }
      draw();
      requestAnimationFrame(step);
    };
    var start = function () { if (g.running) return; g.running = true; if (!W) size(); requestAnimationFrame(step); };
    gcell.addEventListener("mouseenter", function () { if (!reduce) start(); });
    gcell.addEventListener("mouseleave", function () {
      g.running = false; g.manual = false;
      if (g.over) reset();
      if (hint) hint.textContent = "Hover to play. Click to jump.";
      draw();
    });
    gcell.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (reduce) return;
      start();
      if (g.over) { reset(); g.manual = false; if (hint) hint.textContent = "Hover to play. Click to jump."; return; }
      g.manual = true;
      if (hint) hint.textContent = "You are in control. Click to jump.";
      jump();
    });
    draw();
  }

  // ---------- Rows: floating preview card follows the cursor ----------
  var peek = $(".peek");
  if (peek && fine) {
    var tx2 = 0, ty2 = 0, x2 = 0, y2 = 0, on = false, scaleT = 0.6, sc = 0.6, lastX = 0;
    var loop2 = function () {
      x2 += (tx2 - x2) * 0.16; y2 += (ty2 - y2) * 0.16;
      sc += (scaleT - sc) * 0.18;
      var rot = Math.max(-12, Math.min(12, (tx2 - x2) * 0.12));
      peek.style.setProperty("--px", x2.toFixed(1) + "px");
      peek.style.setProperty("--py", y2.toFixed(1) + "px");
      peek.style.setProperty("--pr", rot.toFixed(2) + "deg");
      peek.style.setProperty("--ps", sc.toFixed(3));
      if (on || sc > 0.62) requestAnimationFrame(loop2);
    };
    $$(".row[data-peek]").forEach(function (row) {
      row.addEventListener("mouseenter", function (e) {
        var tpl = $('template[data-tpl="' + row.getAttribute("data-peek") + '"]', peek);
        $$(".pk", peek).forEach(function (n) { n.remove(); });
        if (tpl) peek.appendChild(tpl.content.cloneNode(true));
        peek.classList.remove("is-on"); void peek.offsetWidth; peek.classList.add("is-on");
        tx2 = x2 = e.clientX + 30; ty2 = y2 = e.clientY - 150;
        scaleT = 1; if (!on) { on = true; requestAnimationFrame(loop2); }
      });
      row.addEventListener("mousemove", function (e) {
        var btn = $(".btn", row), br = btn.getBoundingClientRect();
        var nearBtn = e.clientX > br.left - 280;
        tx2 = nearBtn ? e.clientX - 290 : e.clientX + 30;
        ty2 = e.clientY - 150;
      });
      row.addEventListener("mouseleave", function () {
        on = false; scaleT = 0.6; peek.classList.remove("is-on");
      });
    });
  }

  // ---------- Nav: sliding pill ----------
  var nav = $(".nav");
  if (nav && fine) {
    var pill = doc.createElement("span"); pill.className = "nav-pill"; nav.appendChild(pill);
    var moveTo = function (a) {
      var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
      pill.style.setProperty("--nx", (ar.left - nr.left) + "px");
      pill.style.setProperty("--nw", ar.width + "px");
    };
    $$("a", nav).forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        if (!nav.classList.contains("has-pill")) { pill.style.transition = "none"; moveTo(a); void pill.offsetWidth; pill.style.transition = ""; }
        moveTo(a); nav.classList.add("has-pill");
      });
    });
    nav.addEventListener("mouseleave", function () { nav.classList.remove("has-pill"); });
  }

  // Facts re-count on hover
  $$(".facts li").forEach(function (li) {
    var n = $(".num[data-count]", li), busy = false;
    li.addEventListener("mouseenter", function () {
      if (busy || !n) return; busy = true; countUp(n); setTimeout(function () { busy = false; }, 1500);
    });
  });

  // ---------- Products: filter, search, sort ----------
  var grid = $(".pgrid");
  if (grid) {
    var cards = $$(".pcard", grid), filters = $$(".filter"), input = $(".search input"), sortSel = $(".sort select");
    var countEl = $(".result-count"), empty = $(".empty"), current = "all";
    filters.forEach(function (f) {
      var cat = f.getAttribute("data-cat");
      var n = cat === "all" ? cards.length : cards.filter(function (c) { return (" " + c.getAttribute("data-cats") + " ").indexOf(" " + cat + " ") > -1; }).length;
      $(".count", f).textContent = n;
    });
    var fbox = $(".filters"), fpill = doc.createElement("span");
    fpill.className = "filter-pill"; fbox.appendChild(fpill);
    var placePill = function (btn, instant) {
      if (instant) fpill.style.transition = "none";
      fpill.style.setProperty("--fx", btn.offsetLeft + "px");
      fpill.style.setProperty("--fy", btn.offsetTop + "px");
      fpill.style.setProperty("--fw", btn.offsetWidth + "px");
      fpill.style.setProperty("--fh", btn.offsetHeight + "px");
      if (instant) { void fpill.offsetWidth; fpill.style.transition = ""; }
    };
    var selBtn = function () { return $('.filter[aria-selected="true"]'); };
    setTimeout(function () { placePill(selBtn(), true); }, 60);
    window.addEventListener("resize", function () { placePill(selBtn(), true); });

    var apply = function () {
      var q = (input.value || "").trim().toLowerCase();
      var visible = cards.filter(function (c) {
        var okCat = current === "all" || (" " + c.getAttribute("data-cats") + " ").indexOf(" " + current + " ") > -1;
        var okQ = !q || c.getAttribute("data-name").indexOf(q) > -1;
        c.hidden = !(okCat && okQ);
        return okCat && okQ;
      });
      var mode = sortSel.value;
      var sorted = cards.slice().sort(function (a, b) {
        if (mode === "low") return a.dataset.price - b.dataset.price || a.dataset.rank - b.dataset.rank;
        if (mode === "high") return b.dataset.price - a.dataset.price || a.dataset.rank - b.dataset.rank;
        return a.dataset.rank - b.dataset.rank;
      });
      sorted.forEach(function (c) { grid.appendChild(c); });
      if (countEl.textContent !== String(visible.length)) {
        countEl.textContent = visible.length;
        countEl.classList.remove("bump"); void countEl.offsetWidth; countEl.classList.add("bump");
      }
      empty.hidden = visible.length > 0;
    };
    var run = function (fn) {
      if (doc.startViewTransition && !reduce) doc.startViewTransition(fn);
      else fn();
    };
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        filters.forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        f.setAttribute("aria-selected", "true");
        current = f.getAttribute("data-cat");
        placePill(f);
        run(apply);
      });
    });
    var qt;
    input.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { run(apply); }, 140); });
    sortSel.addEventListener("change", function () { run(apply); });
    var clr = $("[data-clear]");
    if (clr) clr.addEventListener("click", function () { input.value = ""; run(apply); input.focus(); });
    apply();

    // Cover tilt follows the pointer
    if (fine && !reduce) {
      cards.forEach(function (c) {
        var cover = $(".cover", c), img = $("img", c);
        cover.addEventListener("pointermove", function (e) {
          var r = cover.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          img.style.setProperty("--ry", (x * 16).toFixed(1) + "deg");
          img.style.setProperty("--rx", (-y * 16).toFixed(1) + "deg");
        });
        cover.addEventListener("pointerleave", function () { img.style.setProperty("--ry", "0deg"); img.style.setProperty("--rx", "0deg"); });
      });
    }
  }
  var feature = $(".feature");
  if (feature) feature.addEventListener("pointermove", function (e) {
    var r = feature.getBoundingClientRect();
    feature.style.setProperty("--mx", (e.clientX - r.left) + "px");
    feature.style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  // ---------- About: flip cards and journey line ----------
  var flipsBox = $(".flips");
  if (flipsBox) {
    $$(".flip", flipsBox).forEach(function (f) {
      f.addEventListener("click", function () { f.classList.toggle("is-flipped"); });
    });
    setTimeout(function () { flipsBox.classList.add("wiggle"); }, 1600);
  }
  var journey = $(".journey");
  if (journey) {
    var stops = $$(".stop", journey);
    var jFill = function () {
      var r = journey.getBoundingClientRect(), vh = window.innerHeight;
      var f = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
      journey.style.setProperty("--fill", f.toFixed(3));
      stops.forEach(function (s) {
        var sr = s.getBoundingClientRect();
        s.classList.toggle("is-lit", sr.top < vh * 0.62 || reduce);
      });
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(jFill); }, { passive: true });
    window.addEventListener("resize", jFill); jFill();
  }

  // ---------- Contact: topic picker types a draft ----------
  var composer = $(".composer");
  if (composer) {
    var topics = $$(".topic", composer), card2 = $(".mail-card"), subjEl = $(".mail-subject"), bodyEl = $(".mail-body");
    var send = $(".mail-send"), alt = $(".mail-alt"), typeTimer, email = "raja@theusefultech.com";
    var typeOut = function (subject, body) {
      clearInterval(typeTimer);
      if (reduce) { subjEl.textContent = subject; bodyEl.textContent = body; return; }
      subjEl.textContent = ""; bodyEl.textContent = "";
      var i = 0, j = 0;
      typeTimer = setInterval(function () {
        if (i < subject.length) { subjEl.textContent += subject.charAt(i++); return; }
        if (j < body.length) { var n = Math.min(body.length, j + 2); bodyEl.textContent += body.slice(j, n); j = n; return; }
        clearInterval(typeTimer);
      }, 16);
    };
    var choose = function (t) {
      topics.forEach(function (x) { x.setAttribute("aria-checked", String(x === t)); });
      var isProduct = t.getAttribute("data-topic") === "product";
      card2.classList.toggle("is-alt", isProduct);
      alt.hidden = !isProduct;
      card2.classList.remove("bump"); void card2.offsetWidth; card2.classList.add("bump");
      if (!isProduct) {
        var subject = t.getAttribute("data-subject"), body = t.getAttribute("data-body");
        typeOut(subject, body);
        send.setAttribute("href", "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));
      }
    };
    topics.forEach(function (t) { t.addEventListener("click", function () { choose(t); }); });
    choose(topics[0]);
  }

  // ---------- Wristkeeper: rotate today's pick ----------
  var pick = $(".pick");
  if (pick) {
    var items = $$(".pick-item", pick), pi = 0, auto;
    var nextPick = function () {
      items[pi].classList.remove("is-on");
      pi = (pi + 1) % items.length;
      items[pi].classList.add("is-on");
    };
    if (!reduce) auto = setInterval(nextPick, 2800);
    var demo = $(".wk-demo");
    $(".pick-next", pick).addEventListener("click", function () { clearInterval(auto); nextPick(); });
    demo.addEventListener("click", function (e) { if (!e.target.closest(".pick-next")) { clearInterval(auto); nextPick(); } });
  }
  var promise = $(".promise");
  if (promise && "IntersectionObserver" in window) {
    var pio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { promise.classList.add("in"); pio.disconnect(); } }, { threshold: 0.4 });
    pio.observe(promise);
  } else if (promise) promise.classList.add("in");

  // ---------- Privacy: table of contents follows the reader ----------
  var toc = $(".toc");
  if (toc) {
    var links = $$("a", toc), secs = $$(".policy-sec");
    var spy = function () {
      var cur = secs[0];
      secs.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = s; });
      links.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + cur.id); });
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(spy); }, { passive: true }); spy();
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        var target = $(a.getAttribute("href"));
        if (target) setTimeout(function () { target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash"); }, 350);
      });
    });
  }

  // ---------- Theme: system, light, or dark ----------
  var tbtn = $(".theme-toggle");
  if (tbtn) {
    var KEY = "tumc-theme";
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var mode = saved === "light" || saved === "dark" ? saved : "system";
    var labels = { system: "Colour theme: match your device", light: "Colour theme: light", dark: "Colour theme: dark" };
    var msgs = { system: "Matching your device's light or dark setting.", light: "Light mode on.", dark: "Dark mode on." };
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var paint = function () {
      tbtn.setAttribute("data-mode", mode);
      tbtn.setAttribute("aria-label", labels[mode]);
      doc.dispatchEvent(new Event("themechange"));
    };
    var applyMode = function () {
      if (mode === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", mode);
      try { if (mode === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
      paint();
    };
    paint();
    mq.addEventListener && mq.addEventListener("change", function () { if (mode === "system") paint(); });
    tbtn.addEventListener("click", function (e) {
      var order = ["system", "light", "dark"];
      var next = order[(order.indexOf(mode) + 1) % 3];
      var effectiveBefore = mode === "system" ? (mq.matches ? "dark" : "light") : mode;
      var effectiveAfter = next === "system" ? (mq.matches ? "dark" : "light") : next;
      mode = next;
      var r = tbtn.getBoundingClientRect();
      var x = r.left + r.width / 2, yy = r.top + r.height / 2;
      if (doc.startViewTransition && !reduce && effectiveBefore !== effectiveAfter) {
        root.classList.add("theming");
        var vt = doc.startViewTransition(applyMode);
        vt.ready.then(function () {
          var rad = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(yy, window.innerHeight - yy));
          root.animate({ clipPath: ["circle(0px at " + x + "px " + yy + "px)", "circle(" + rad + "px at " + x + "px " + yy + "px)"] },
            { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
        });
        vt.finished.then(function () { root.classList.remove("theming"); });
      } else {
        applyMode();
      }
      toast(msgs[mode]);
    });
  }

  // Topics get their stagger index
  $$(".topics li").forEach(function (li, i) { li.style.setProperty("--n", i); });
})();
