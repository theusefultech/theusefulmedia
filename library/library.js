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
        a.addEventListener("click", function () { document.body.classList.remove("searching"); });
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

  // Menu sheet
  var sheet = $("[data-sheet]"), lastFocus = null;
  function openSheet() { if (!sheet) return; lastFocus = document.activeElement; sheet.hidden = false; document.body.classList.add("lock"); var f = $(".sheet-panel a", sheet); if (f) f.focus(); }
  function closeSheet() { if (!sheet || sheet.hidden) return; sheet.hidden = true; document.body.classList.remove("lock"); if (lastFocus) lastFocus.focus(); }
  $$("[data-menu-open]").forEach(function (b) { b.addEventListener("click", openSheet); });
  $$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", closeSheet); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSheet(); document.body.classList.remove("searching"); } });

  // Phone search: full screen while typing
  var phone = window.matchMedia("(max-width: 760px)");
  if (search) {
    var sInput = $("input", search);
    sInput.addEventListener("focus", function () { if (phone.matches) document.body.classList.add("searching"); });
    var sc = $("[data-search-close]", search);
    if (sc) sc.addEventListener("click", function () { document.body.classList.remove("searching"); sInput.value = ""; sInput.dispatchEvent(new Event("input")); sInput.blur(); });
  }
  $$("[data-search-open]").forEach(function (a) {
    a.addEventListener("click", function (e) { var i = $("[data-search] input"); if (i) { e.preventDefault(); i.focus(); } });
  });
  if (location.hash === "#q") { var qi = $("[data-search] input"); if (qi) setTimeout(function () { qi.focus(); }, 300); }

  // Day number shared by rotations (local midnight)
  function dayIndex() { var d = new Date(); d.setHours(0, 0, 0, 0); return Math.round((d - new Date(2026, 10, 12)) / 86400000); }
  function seeded(n) { var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }

  // Rotating covers: new set each day, unseen books first, and they follow the problem you type
  var fan = $("[data-covers]"), catEl = $("#catalog");
  if (fan && catEl) {
    var cat = JSON.parse(catEl.textContent), imgs = $$("img", fan);
    var seen = store.get("seen", []);
    function pickDaily() {
      var day = dayIndex();
      var order = cat.map(function (b, i) { return { b: b, r: seeded(day * 31 + i) + (seen.indexOf(b.slug) !== -1 ? 1 : 0) }; })
        .sort(function (a, b) { return a.r - b.r; }).map(function (x) { return x.b; });
      return order.slice(0, 3);
    }
    var current = [];
    function show(list) {
      var key = list.map(function (b) { return b.slug; }).join();
      if (key === current.map(function (b) { return b.slug; }).join()) return;
      current = list;
      imgs.forEach(function (im, i) {
        var b = list[i]; if (!b) return;
        if (reduce) { im.src = "/library/img/covers/" + b.slug + ".webp"; im.alt = b.t + " cover"; return; }
        im.classList.add("out");
        setTimeout(function () {
          im.src = "/library/img/covers/" + b.slug + ".webp"; im.alt = b.t + " cover";
          im.onload = function () { im.classList.remove("out"); };
          setTimeout(function () { im.classList.remove("out"); }, 400);
        }, 180 + i * 70);
      });
      list.forEach(function (b) { if (seen.indexOf(b.slug) === -1) seen.push(b.slug); });
      if (seen.length > cat.length - 3) seen = seen.slice(-3);
      store.set("seen", seen);
    }
    var daily = pickDaily();
    show(daily);
    if (search) {
      var t = null;
      $("input", search).addEventListener("input", function () {
        clearTimeout(t);
        var q = this.value.trim().toLowerCase();
        t = setTimeout(function () {
          var probs = JSON.parse($("#problems").textContent);
          var hit = probs.filter(function (p) { return q && ((p.text + " " + p.keys).toLowerCase().indexOf(q) !== -1 || q.split(/\s+/).some(function (w) { return w.length > 2 && p.keys.indexOf(w.slice(0, 5)) !== -1; })); })[0];
          if (!hit) { show(daily); return; }
          var area = hit.area.toLowerCase();
          var pool = cat.filter(function (b) { return b.a === area; });
          cat.forEach(function (b) { if (pool.length < 3 && pool.indexOf(b) === -1) pool.push(b); });
          show(pool.slice(0, 3));
        }, 220);
      });
    }
  }

  // Today's idea: a new one each day
  var today = $("[data-today]"), ideasEl = $("#ideas");
  if (today && ideasEl) {
    var ideas = JSON.parse(ideasEl.textContent), it = ideas[((dayIndex() % ideas.length) + ideas.length) % ideas.length];
    $("[data-i-area]", today).textContent = it.area;
    $("[data-i-src]", today).textContent = it.src;
    $("[data-i-t]", today).textContent = it.t;
    $("[data-i-d]", today).textContent = it.d;
    var lk = $("[data-i-url]", today); lk.href = it.url;
    lk.textContent = it.url.indexOf("/ideas/") !== -1 ? "Open the idea" : (it.url.indexOf("/books/") !== -1 ? "Open the book" : "Play today's game");
    var st = $("[data-i-steps]", today); st.innerHTML = "";
    it.s.forEach(function (x, i) { var p = document.createElement("p"); p.innerHTML = "<b>" + (i + 1) + ".</b> "; p.appendChild(document.createTextNode(x)); st.appendChild(p); });
  }

  // Newsletter signup: adds the reader to The Useful Life through the signup Worker.
  // Falls back to The Useful Life's Beehiiv page if the Worker can't be reached.
  var ENDPOINT = "https://useful-signup.raja-822.workers.dev/";
  var WORKER_READY = true; // true once the Worker accepts list: "life"
  var SITEKEY = "0x4AAAAAAFPMggcqkSSP8L92";
  var LIFE = "https://the-useful-life.beehiiv.com/subscribe";
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MSG = {
    format: "That email looks off. Check it and try again.",
    disposable: "Throwaway inboxes can't get the lessons. Use your real email.",
    no_mail: "That email's domain can't receive mail. Check the spelling.",
    bot: "We couldn't confirm you're a person. Refresh and try once more.",
    server: "Something went wrong on our side. Try again in a minute."
  };
  var forms = $$("form[data-life-signup]");
  var widgets = new Map();
  function initTS() {
    if (!window.turnstile) return;
    forms.forEach(function (f) {
      if (widgets.has(f)) return;
      var slot = document.createElement("div"); f.parentNode.appendChild(slot);
      var st = { token: "", id: null };
      st.id = window.turnstile.render(slot, { sitekey: SITEKEY, appearance: "interaction-only",
        callback: function (t) { st.token = t; }, "expired-callback": function () { st.token = ""; }, "error-callback": function () { st.token = ""; } });
      widgets.set(f, st);
    });
  }
  window.libTurnstileReady = initTS;
  function loadTS() {
    if (window.turnstile || document.querySelector('script[src*="turnstile/v0/api.js"]')) return;
    var sc = document.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=libTurnstileReady";
    sc.async = true; document.head.appendChild(sc);
  }
  if (forms.length && "IntersectionObserver" in window) {
    var tio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { tio.disconnect(); loadTS(); } }, { rootMargin: "600px 0px" });
    forms.forEach(function (f) { tio.observe(f); });
  } else if (forms.length) loadTS();
  function token(f, ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function poll() { var w = widgets.get(f); if (w && w.token) return res(w.token); if (Date.now() - t0 > ms) return res(""); setTimeout(poll, 150); })();
    });
  }
  forms.forEach(function (f) {
    var input = $("input[type=email]", f), btn = $("button", f), msg = f.parentNode.querySelector(".signup-msg"), label = btn.textContent;
    f.addEventListener("focusin", loadTS);
    function say(t) { msg.textContent = t; f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); }
    function fallback(email) { location.href = LIFE + "?email=" + encodeURIComponent(email) + "&utm_source=theusefulmedia.com&utm_medium=library"; }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      var email = input.value.trim().toLowerCase();
      if (!RE.test(email)) { say(MSG.format); input.focus(); return; }
      if (!WORKER_READY) { msg.innerHTML = '<span class="stamp-box stamp">CARD ISSUED</span> Taking you to confirm on The Useful Life.'; setTimeout(function () { fallback(email); }, 900); return; }
      btn.disabled = true; btn.textContent = "Checking your email"; msg.textContent = "";
      loadTS();
      token(f, 6000).then(function (tk) {
        return fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, token: tk, list: "life", utm_source: "theusefulmedia.com", utm_medium: "library", utm_campaign: f.getAttribute("data-campaign") || "library" }) })
          .then(function (r) { return r.json(); });
      }).then(function (res) {
        var w = widgets.get(f); if (w && window.turnstile) { w.token = ""; window.turnstile.reset(w.id); }
        btn.disabled = false; btn.textContent = label;
        if (res && res.ok) {
          f.hidden = true;
          msg.innerHTML = '<span class="stamp-box stamp">CARD ISSUED</span> ' + (res.existing ? "You were already on the list. Next lesson soon." : "You&#39;re in. Your first lesson lands with the next issue.");
          return;
        }
        if (res && res.code === "typo" && res.suggestion) { input.value = res.suggestion; say("Did you mean " + res.suggestion + "? We fixed it. Press the button again."); return; }
        say(MSG[res && res.code] || MSG.server);
      }).catch(function () { fallback(email); });
    });
  });
})();
