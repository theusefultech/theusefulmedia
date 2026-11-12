// The Useful Library: small interactions. No dependencies.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("lib:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("lib:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal on scroll, count-ups and bar charts
  function countUp(el) {
    var to = +el.getAttribute("data-count"), t0 = 0;
    if (reduce) { el.textContent = to.toLocaleString(); return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      if (e.target.hasAttribute("data-count")) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 }) : null;
  $$(".reveal,[data-observe]").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  // Home search: rotating examples + matching problems
  var search = $("[data-search]");
  if (search) {
    var input = $("input", search), box = $(".suggest", search), none = $("[data-nomatch]", search);
    var examples = (input.getAttribute("data-examples") || "").split("|");
    var i = 0;
    if (examples.length > 1 && !reduce) setInterval(function () {
      if (document.activeElement === input || input.value) return;
      i = (i + 1) % examples.length; input.placeholder = examples[i];
    }, 2400);
    var problems = JSON.parse($("#problems").textContent);
    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) { box.hidden = true; none.hidden = true; return; }
      var words = q.split(/\s+/).filter(function (w) { return w.length > 2; });
      var m = problems.filter(function (p) {
        var hay = (p.text + " " + p.keys).toLowerCase();
        return hay.indexOf(q) !== -1 || words.some(function (w) { return p.keys.indexOf(w.slice(0, 5)) !== -1; });
      }).slice(0, 4);
      box.innerHTML = "";
      m.forEach(function (p) {
        var a = document.createElement("a");
        a.href = p.url || "#signup";
        a.innerHTML = '<span></span><span class="tag"></span>';
        a.firstChild.textContent = p.text;
        a.lastChild.textContent = p.url ? p.area : "Coming soon";
        if (!p.url) a.lastChild.className = "tag soon";
        box.appendChild(a);
      });
      box.hidden = !m.length;
      none.hidden = m.length > 0 || q.length < 3;
      if (m.length) { box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop"); }
    }
    input.addEventListener("input", render);
    search.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = $("a", box);
      if (first && !box.hidden) location.href = first.getAttribute("href");
    });
  }

  // Flip card
  $$("[data-flip]").forEach(function (wrap) {
    var faces = $$(".face", wrap);
    $$("[data-flip-btn]", wrap).forEach(function (b) {
      b.addEventListener("click", function () {
        faces.forEach(function (f) {
          f.hidden = !f.hidden;
          if (!f.hidden) { f.classList.remove("flipin"); void f.offsetWidth; f.classList.add("flipin"); var fb = $("[data-flip-btn]", f); if (fb) fb.focus(); }
        });
      });
    });
  });

  // Chapter strip
  var chapData = $("#chapters");
  if (chapData) {
    var chs = JSON.parse(chapData.textContent);
    var panel = $("[data-chap-panel]");
    var colors = { READ: ["var(--green)", "#fff"], SKIM: ["var(--brass)", "var(--ink)"], SKIP: ["var(--line2)", "var(--muted)"] };
    function show(n) {
      var c = chs[n - 1];
      $$(".cell").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-n") === n)); });
      var v = $("[data-v]", panel);
      v.textContent = c[0]; v.style.background = colors[c[0]][0]; v.style.color = colors[c[0]][1];
      $("[data-t]", panel).textContent = "Chapter " + n + ": " + c[1];
      $("[data-w]", panel).textContent = c[2];
      panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    }
    $$(".cell").forEach(function (b) { b.addEventListener("click", function () { show(+b.getAttribute("data-n")); }); });
  }

  // Segmented tabs
  $$("[data-seg]").forEach(function (seg) {
    var tabs = $$("button", seg);
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () {
        seg.setAttribute("data-side", String(idx));
        tabs.forEach(function (o, j) {
          o.setAttribute("aria-selected", String(j === idx));
          var p = document.getElementById(o.getAttribute("aria-controls"));
          p.hidden = j !== idx;
          if (j === idx) { p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap"); }
        });
      });
    });
  });

  // Checklists (remembered per device)
  $$("[data-checklist]").forEach(function (list) {
    var key = "check:" + list.getAttribute("data-checklist");
    var state = store.get(key, []);
    var done = $("[data-alldone]", list.parentNode);
    var btns = $$(".check", list);
    function sync() {
      var all = btns.every(function (b) { return b.getAttribute("aria-pressed") === "true"; });
      if (done) { if (all && done.hidden) { done.hidden = false; done.classList.remove("pop"); void done.offsetWidth; done.classList.add("pop"); } if (!all) done.hidden = true; }
    }
    btns.forEach(function (b, i) {
      if (state[i]) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        state[i] = on; store.set(key, state); sync();
      });
    });
    sync();
  });

  // 30 day test
  $$("[data-test]").forEach(function (box) {
    var key = "test:" + box.getAttribute("data-test");
    var s = store.get(key, { start: null, days: {}, vote: null });
    var days = $$(".day", box), startBtn = $("[data-start]", box), startedStamp = $("[data-started]", box);
    var voteBtns = $("[data-vote-btns]", box), voted = $("[data-voted]", box);
    function fmt(ts) { return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase(); }
    function paint(animate) {
      days.forEach(function (d) { d.setAttribute("aria-pressed", String(!!s.days[d.getAttribute("data-day")])); });
      if (s.start) {
        startBtn.hidden = true; startedStamp.hidden = false;
        startedStamp.textContent = "DAY 1 · STARTED " + fmt(s.start);
        if (animate) { startedStamp.classList.remove("stamp"); void startedStamp.offsetWidth; startedStamp.classList.add("stamp"); }
      }
      if (s.vote) {
        voteBtns.hidden = true; voted.hidden = false;
        $("[data-msg]", voted).textContent = s.vote === "kept" ? "Stamped. Thanks for testing it." : "Thanks. Dropped ideas teach us too.";
      }
    }
    function begin() { if (!s.start) { s.start = Date.now(); s.days["1"] = true; } store.set(key, s); paint(true); }
    startBtn.addEventListener("click", begin);
    days.forEach(function (d) {
      d.addEventListener("click", function () {
        var k = d.getAttribute("data-day"); s.days[k] = !s.days[k];
        if (!s.start) s.start = Date.now();
        store.set(key, s); paint(!startedStamp.hidden ? false : true);
      });
    });
    $$("[data-vote]", box).forEach(function (b) {
      b.addEventListener("click", function () { s.vote = b.getAttribute("data-vote"); store.set(key, s); paint(); var st = $(".stamp", voted); if (st) { st.classList.remove("stamp"); void st.offsetWidth; st.classList.add("stamp"); } });
    });
    paint(false);
  });

  // Add to shelf
  $$("[data-shelf]").forEach(function (b) {
    var key = "shelf:" + b.getAttribute("data-shelf");
    function paint() { var on = store.get(key, false); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "On your shelf" : "Add to my shelf"; b.className = on ? "btn btn-ink" : "btn btn-line"; }
    b.addEventListener("click", function () { store.set(key, !store.get(key, false)); paint(); });
    paint();
  });

  // Newsletter signup: hands the email to The Useful Life on Beehiiv
  var LIFE = "https://the-useful-life.beehiiv.com/subscribe";
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$("form[data-life-signup]").forEach(function (f) {
    var input = $("input[type=email]", f), msg = f.parentNode.querySelector(".signup-msg");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!RE.test(email)) { msg.textContent = "That email looks off. Check it and try again."; f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); input.focus(); return; }
      msg.innerHTML = '<span class="stamp-box stamp">CARD ISSUED</span> Taking you to confirm on The Useful Life.';
      setTimeout(function () { location.href = LIFE + "?email=" + encodeURIComponent(email) + "&utm_source=theusefulmedia.com&utm_medium=library&utm_campaign=" + encodeURIComponent(f.getAttribute("data-campaign") || "library"); }, 900);
    });
  });
})();
