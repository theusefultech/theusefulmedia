// The Useful Library: small interactions. No dependencies.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("lib:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("lib:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var phone = window.matchMedia("(max-width: 760px)");
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

  // Home search: plain-language matching across problems and ideas, pills, area filters, never a dead end
  var search = $("[data-search]");
  if (search) {
    var input = $("input", search), box = $(".suggest", search), pillsEl = $("[data-pills]", search), filt = $("[data-filters]", search);
    var examples = (input.getAttribute("data-examples") || "").split("|");
    var exI = 0;
    if (examples.length > 1 && !reduce) setInterval(function () {
      if (document.activeElement === input || input.value) return;
      exI = (exI + 1) % examples.length; input.placeholder = examples[exI];
    }, 2400);
    var problems = JSON.parse($("#problems").textContent);
    var ideasAll = JSON.parse(($("#ideas") || { textContent: "[]" }).textContent);
    // What people say -> which area it belongs to
    var AREA_WORDS = {
      focus: "focus distract distraction phone scroll scrolling social media instagram youtube notification attention concentrate concentration deep work busy productive productivity procrastinate procrastination deadline overwhelm overwhelmed prioritize priority time waste wasting decide decision",
      habits: "habit habits routine discipline consistent consistency motivation lazy gym workout exercise morning wake early read reading streak quit start stick goal goals tiny",
      money: "money spend spending save saving savings debt loan broke salary budget invest investing investment stock stocks rich wealth retire retirement buy shopping expensive afford",
      mindset: "stress stressed anxious anxiety worry worried overthink overthinking calm angry anger sad upset fear confidence meaning purpose boss setback failure lonely peace mind emotion emotions"
    };
    var STOP = " i im i'm my me a an the to and or of in on at for with is are be it this that so but just keep always never really very can cant can't dont don't how what why want need feel get do too ";
    function words(t) {
      return t.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(function (w) { return w && STOP.indexOf(" " + w + " ") === -1; })
        .map(function (w) { return w.replace(/'s$/, "").replace(/(ing|ed|es|s)$/, function (m, x, i, str) { return str.length > 4 ? "" : m; }); });
    }
    function hit(w, hay) { return hay.indexOf(" " + w) !== -1 || (w.length > 4 && hay.indexOf(" " + w.slice(0, 5)) !== -1); }
    var items = problems.map(function (p) { return { kind: "Problem", title: p.text, area: p.area.toLowerCase(), url: p.url || "", hay: " " + (p.text + " " + p.keys).toLowerCase() + " " }; })
      .concat(ideasAll.map(function (it) { return { kind: "Idea", title: it.t, sub: it.src, area: it.area.toLowerCase(), url: it.url, hay: " " + (it.t + " " + it.keys + " " + it.d + " " + it.src).toLowerCase() + " " }; }));
    var area = "all", lastQ = "";
    function guessArea(ws) {
      var best = null, n = 0;
      Object.keys(AREA_WORDS).forEach(function (k) { var h = " " + AREA_WORDS[k] + " ", c = ws.filter(function (w) { return hit(w, h); }).length; if (c > n) { n = c; best = k; } });
      return best;
    }
    function row(it, why) {
      var a = document.createElement("a");
      a.href = it.url || "#signup";
      a.innerHTML = '<span class="r-main"><span class="r-t"></span><span class="r-s"></span></span><span class="tag"></span>';
      $(".r-t", a).textContent = it.title;
      $(".r-s", a).textContent = why || it.sub || (it.url ? "" : "Not covered yet. Get it by email when it is.");
      $(".tag", a).textContent = it.url ? (it.kind + " · " + it.area.toUpperCase()) : "SOON";
      if (!it.url) $(".tag", a).className = "tag soon";
      a.addEventListener("click", function () { document.body.classList.remove("searching"); });
      return a;
    }
    function render() {
      var q = input.value.trim();
      lastQ = q;
      if (!q) { box.hidden = true; filt.hidden = true; return; }
      var ws = words(q);
      var scored = items.map(function (it) {
        var sc = ws.reduce(function (n, w) { return n + (hit(w, it.hay) ? (it.title.toLowerCase().indexOf(w) !== -1 ? 3 : 1) : 0); }, 0);
        return { it: it, sc: sc ? sc + (it.url ? 1 : 0) : 0 };
      }).filter(function (x) { return x.sc > 0 && (area === "all" || x.it.area === area); })
        .sort(function (x, y) { return y.sc - x.sc || (y.it.url ? 1 : 0) - (x.it.url ? 1 : 0); });
      box.innerHTML = "";
      filt.hidden = false;
      if (scored.length) {
        scored.slice(0, 6).forEach(function (x) { box.appendChild(row(x.it)); });
      } else {
        var g = area !== "all" ? area : guessArea(ws);
        var near = items.filter(function (it) { return it.url && (!g || it.area === g); }).slice(0, 3);
        var head = document.createElement("p"); head.className = "r-head";
        head.textContent = g ? "Nothing exact yet. Closest ideas for " + g + ":" : "Nothing exact yet. Start with these:";
        box.appendChild(head);
        near.forEach(function (it) { box.appendChild(row(it)); });
        var ask = document.createElement("a"); ask.href = "#signup"; ask.className = "r-ask";
        ask.innerHTML = '<span class="r-main"><span class="r-t">Ask the Library to cover this</span><span class="r-s">Join the free lessons. New problems get covered every week.</span></span><span class="tag">ASK</span>';
        ask.addEventListener("click", function () { document.body.classList.remove("searching"); try { sessionStorage.setItem("lib:req", q); } catch (e) {} });
        box.appendChild(ask);
      }
      box.hidden = false;
      box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop");
    }
    input.addEventListener("input", render);
    search.addEventListener("submit", function (e) { e.preventDefault(); var first = $("a", box); if (!input.value.trim()) { input.focus(); return; } render(); first = $("a", box); if (first) location.href = first.getAttribute("href"); });
    // Pills: 6 a day, picked from a larger set
    var PILLS = ["Procrastination", "Phone addiction", "Saving money", "Overthinking", "Morning routine", "Too busy", "No motivation", "Stress at work", "Reading more", "Investing basics", "Breaking a bad habit", "Focus at work", "Hard decisions", "Self-discipline", "Staying calm", "Overspending"];
    var dI = (function () { var d = new Date(); d.setHours(0, 0, 0, 0); return Math.round((d - new Date(2026, 10, 12)) / 86400000); })();
    var todays = PILLS.map(function (p, i) { return { p: p, r: Math.sin((dI + 1) * 97 + i * 13) }; }).sort(function (a, b) { return a.r - b.r; }).slice(0, 6);
    todays.forEach(function (x, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "pill-btn"; b.textContent = x.p; b.style.animationDelay = (0.3 + i * 0.05) + "s";
      b.addEventListener("click", function () { input.value = x.p; input.dispatchEvent(new Event("input")); if (phone.matches) document.body.classList.add("searching"); });
      pillsEl.appendChild(b);
    });
    $$("button", filt).forEach(function (b) {
      b.addEventListener("click", function () { area = b.getAttribute("data-f"); $$("button", filt).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); }); render(); input.focus(); });
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
    var ideas = JSON.parse(ideasEl.textContent), want = (location.search.match(/[?&]idea=([a-z0-9-]+)/) || [])[1], it = ideas.filter(function (x) { return x.slug === want; })[0] || ideas[((dayIndex() % ideas.length) + ideas.length) % ideas.length];
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
  function bindSignup(f) {
    var input = $("input[type=email]", f), btn = $("button[type=submit]", f) || $("button", f), msg = f.parentNode.querySelector(".signup-msg"), label = btn.textContent;
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
        var w = widgets.get(f); try { if (w && window.turnstile) { w.token = ""; window.turnstile.reset(w.id); } } catch (er) {}
        btn.disabled = false; btn.textContent = label;
        if (res && res.ok) {
          store.set("subscribed", true);
          f.hidden = true;
          msg.innerHTML = '<span class="stamp-box stamp">CARD ISSUED</span> ' + (res.existing ? "You were already on the list. Next lesson soon." : "You&#39;re in. Your first lesson lands with the next issue.");
          return;
        }
        if (res && res.code === "typo" && res.suggestion) { input.value = res.suggestion; say("Did you mean " + res.suggestion + "? We fixed it. Press the button again."); return; }
        say(MSG[res && res.code] || MSG.server);
      }).catch(function (er) { try { console.warn("Library signup fell back", er); } catch (x) {} fallback(email); });
    });
  }
  forms.forEach(bindSignup);
  window.LibBindSignup = function (f) { forms.push(f); bindSignup(f); loadTS(); setTimeout(initTS, 50); };
  // ---------- Celebrations ----------
  window.LibConfetti = function (el) {
    if (reduce || !el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + Math.min(r.height / 2, 120);
    var colors = ["#2F6B4F", "#B8913A", "#4E8A6C", "#E3EEE7", "#7A4A78", "#3A5BA0"];
    for (var i = 0; i < 34; i++) {
      var p = document.createElement("i");
      var sz = 6 + Math.random() * 6;
      p.style.cssText = "position:fixed;z-index:120;pointer-events:none;left:" + cx + "px;top:" + cy + "px;width:" + sz + "px;height:" + (sz * (Math.random() > .5 ? 1 : 2.2)) + "px;border-radius:" + (Math.random() > .6 ? "50%" : "2px") + ";background:" + colors[i % colors.length];
      document.body.appendChild(p);
      var a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220, dx = Math.cos(a) * v, dy = Math.sin(a) * v - 160;
      var an = p.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(" + dx + "px," + (dy + 380) + "px) rotate(" + (Math.random() * 720 - 360) + "deg)", opacity: 0 }], { duration: 1100 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" });
      an.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  };

  // ---------- Stamps you collect ----------
  function games() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i), m = k && k.match(/^lib:game:(\d+)$/); if (m) { var v = JSON.parse(localStorage.getItem(k)); if (v) { v.no = +m[1]; out.push(v); } } } } catch (e) {}
    return out.sort(function (a, b) { return a.no - b.no; });
  }
  function bestStreak(gs) { var best = 0, cur = 0, last = null; gs.forEach(function (g) { if (g.won) { cur = (last !== null && g.no === last + 1) ? cur + 1 : 1; last = g.no; best = Math.max(best, cur); } else { cur = 0; last = g.no; } }); return best; }
  function anyKey(prefix, test) { try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("lib:" + prefix) === 0) { var v = JSON.parse(localStorage.getItem(k)); if (test(v)) return true; } } } catch (e) {} return false; }
  var STAMPS = [
    { id: "first-solve", name: "First solve", how: "Solve your first Mystery Book", art: "habits", ok: function () { return games().some(function (g) { return g.won; }); } },
    { id: "ace", name: "1 clue wonder", how: "Solve a Mystery Book on the first clue", art: "focus", ok: function () { return games().some(function (g) { return g.won && g.wrong.length === 0; }); } },
    { id: "streak-3", name: "3 day streak", how: "Solve 3 days in a row", art: "mindset", ok: function () { return bestStreak(games()) >= 3; } },
    { id: "streak-7", name: "7 day streak", how: "Solve 7 days in a row", art: "money", ok: function () { return bestStreak(games()) >= 7; } },
    { id: "checklist", name: "Did the thing", how: "Finish a try-it-today checklist", art: "habits", ok: function () { return anyKey("check:", function (v) { return v && v.length >= 3 && v.every(Boolean); }); } },
    { id: "tester", name: "Tester", how: "Start a 30-day test", art: "focus", ok: function () { return anyKey("test:", function (v) { return v && v.start; }); } },
    { id: "kept", name: "Kept it", how: "Keep an idea for 30 days", art: "mindset", ok: function () { return anyKey("test:", function (v) { return v && v.vote === "kept"; }); } },
    { id: "regular", name: "Regular", how: "Add the Library to your home screen or calendar", art: "money", ok: function () { return store.get("did:install", false) || store.get("did:cal", false); } },
    { id: "reader", name: "On the list", how: "Get the lessons by email", art: "habits", ok: function () { return store.get("subscribed", false); } }
  ];
  var plates = {};
  try { plates = JSON.parse($("#plates").textContent); } catch (e) {}
  function toast(st) {
    var t = document.createElement("div"); t.className = "stamp-toast"; t.setAttribute("role", "status");
    t.innerHTML = '<svg class="stamp" width="64" height="64" viewBox="0 0 160 160" aria-hidden="true">' + (plates[st.art] || "") + '</svg><span><small>New stamp</small><b></b></span>';
    $("b", t).textContent = st.name;
    document.body.appendChild(t); window.LibConfetti(t);
    t.addEventListener("click", function () { location.href = "/library/shelf/"; });
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 400); }, 3600);
  }
  var checking = null;
  window.LibStamps = {
    list: STAMPS, games: games, bestStreak: bestStreak,
    check: function (quiet) {
      var have = store.get("stamps", []), fresh = [];
      STAMPS.forEach(function (s) { if (have.indexOf(s.id) === -1 && s.ok()) { have.push(s.id); fresh.push(s); } });
      if (!fresh.length) return;
      store.set("stamps", have, true);
      if (!quiet) fresh.forEach(function (s, i) { setTimeout(function () { toast(s); }, 700 + i * 1800); });
    }
  };
  var setRaw = store.set;
  store.set = function (k, v, skip) { setRaw(k, v); if (skip) return; clearTimeout(checking); checking = setTimeout(function () { window.LibStamps.check(); }, 500); };
  window.LibStamps.check(store.get("stamps", null) === null);

  // ---------- My shelf page ----------
  var shelfPage = $("[data-shelf-page]");
  if (shelfPage) {
    var gs = window.LibStamps.games(), wins = gs.filter(function (g) { return g.won; });
    var played = gs.filter(function (g) { return g.won || g.lost; }).length;
    var cur = (function () { var d = new Date(); d.setHours(0, 0, 0, 0); var no = Math.round((d - new Date(2026, 10, 12)) / 86400000) + 1; var map = {}; gs.forEach(function (g) { map[g.no] = g; }); var n = 0, k = map[no] && map[no].won ? no : no - 1; while (map[k] && map[k].won) { n++; k--; } return n; })();
    var stats = [["Played", played], ["Win %", played ? Math.round(wins.length / played * 100) : 0], ["Streak", cur], ["Best", window.LibStamps.bestStreak(gs)]];
    $("[data-sh-stats]").innerHTML = stats.map(function (s) { return '<div class="stat"><b data-count="' + s[1] + '">0</b><span>' + s[0] + '</span></div>'; }).join("");
    $$("[data-sh-stats] [data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    var dist = [0, 0, 0, 0, 0, 0]; wins.forEach(function (g) { dist[Math.min(5, g.wrong.length)]++; });
    var mx = Math.max.apply(null, dist.concat([1]));
    $("[data-sh-dist]").innerHTML = dist.map(function (n, i) { return '<div><span>' + (i + 1) + '</span><i style="width:' + (8 + n / mx * 82) + '%">' + n + '</i></div>'; }).join("");
    var have = store.get("stamps", []);
    $("[data-sh-count]").textContent = have.length + " of " + window.LibStamps.list.length + " collected";
    $("[data-sh-stamps]").innerHTML = window.LibStamps.list.map(function (s) {
      var got = have.indexOf(s.id) !== -1;
      return '<div class="stamp-card ' + (got ? "earned" : "locked") + '"><svg viewBox="0 0 160 160" aria-hidden="true">' + (plates[s.art] || "") + '</svg><b>' + s.name + '</b><small>' + (got ? "Collected" : s.how) + '</small></div>';
    }).join("");
    var meta = JSON.parse($("#sh-meta").textContent);
    var tests = Object.keys(meta.tests).map(function (k) { var v = store.get("test:" + k, null); return v && v.start ? { k: k, v: v } : null; }).filter(Boolean);
    $("[data-sh-tests]").innerHTML = tests.length ? tests.map(function (t) { var n = Object.keys(t.v.days || {}).filter(function (d) { return t.v.days[d]; }).length; var m = meta.tests[t.k]; return '<a class="sh-row" href="' + m.url + '"><b>' + m.t + '</b><span class="bar"><i style="width:' + Math.round(n / 30 * 100) + '%"></i></span><span class="mono">' + n + '/30</span></a>'; }).join("")
      : '<p class="empty">No tests yet. <a href="/library/ideas/the-2-minute-rule/">Start with the 2 minute rule</a>.</p>';
    var books = Object.keys(meta.books).filter(function (k) { return store.get("shelf:" + k, false); });
    $("[data-sh-books]").innerHTML = books.length ? books.map(function (k) { var b = meta.books[k]; return '<a class="sh-row" href="' + b.url + '"><img src="' + b.cover + '" alt="" width="40" height="60" style="width:40px;height:60px;object-fit:cover;border-radius:3px 6px 6px 3px"><b style="flex:1">' + b.t + '</b><span class="mono">Open</span></a>'; }).join("")
      : '<p class="empty">Nothing saved yet. Tap "Add to my shelf" on any book.</p>';
  }

  // ---------- Come back tomorrow: home screen, calendar, email ----------
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/library/sw.js", { scope: "/library/" }).catch(function () {}); });
  }
  var ua = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) store.set("did:install", true);
  var deferredInstall = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredInstall = e; });
  window.addEventListener("appinstalled", function () { store.set("did:install", true); paintStay(); });
  var guide = $("[data-ios-guide]");
  function openGuide() { if (!guide) return; guide.hidden = false; document.body.classList.add("lock"); var b = $("[data-guide-close].btn", guide); if (b) b.focus(); }
  $$("[data-guide-close]").forEach(function (b) { b.addEventListener("click", function () { guide.hidden = true; document.body.classList.remove("lock"); }); });
  function install() {
    if (standalone) return;
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.then(function (c) { if (c.outcome === "accepted") { store.set("did:install", true); paintStay(); } deferredInstall = null; }); return; }
    if (isIOS) { closeSheet(); openGuide(); return; }
    openDeskTip();
  }
  function openDeskTip() {
    var t = document.createElement("div"); t.className = "ask pop"; t.setAttribute("role", "status");
    t.style.cssText = "position:fixed;left:16px;right:16px;bottom:24px;z-index:95;max-width:520px;margin:0 auto";
    t.innerHTML = '<div class="ask-t"><b>Bookmark the Library</b><span>Press ' + (/Mac/.test(ua) ? "Cmd" : "Ctrl") + ' + D now, or use your browser menu to install it as an app.</span></div><div class="ask-go"><button type="button" class="btn btn-green">Got it</button></div>';
    document.body.appendChild(t); $("button", t).addEventListener("click", function () { t.remove(); });
    store.set("did:install", true); setTimeout(function () { if (t.parentNode) t.remove(); }, 9000); paintStay();
  }
  function calendar(e) {
    store.set("did:cal", true); paintStay();
    if (isAndroid) {
      e.preventDefault();
      var d = new Date(); d.setDate(d.getDate() + 1);
      var ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
      location.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Mystery Book: guess today's book") +
        "&dates=" + ymd + "T083000/" + ymd + "T083500&recur=" + encodeURIComponent("RRULE:FREQ=DAILY") +
        "&details=" + encodeURIComponent("2 minutes. 6 clues. 1 nonfiction book. https://theusefulmedia.com/library/game/");
    }
  }
  function paintStay() {
    $$("[data-install]").forEach(function (b) { b.classList.toggle("done", !!store.get("did:install", false)); });
    $$("[data-cal]").forEach(function (b) { b.classList.toggle("done", !!store.get("did:cal", false)); });
  }
  $$("[data-install]").forEach(function (b) { b.addEventListener("click", install); });
  $$("[data-cal]").forEach(function (b) { b.addEventListener("click", calendar); });
  paintStay();

  // The ask: 1 per visit, only after a moment of value, never repeated within 14 days of a "Not now"
  var ICONS = {
    install: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 8v6M9 11l3 3 3-3"/></svg>',
    cal: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
    email: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/></svg>'
  };
  function snoozed(k) { var t = store.get("snooze:" + k, 0); return t && Date.now() - t < 14 * 86400000; }
  function asked() { try { return sessionStorage.getItem("lib:asked") === "1"; } catch (e) { return false; } }
  window.LibAsk = function (anchor, moment) {
    if (!anchor || asked()) return;
    var copy = {
      win: { install: ["Make tomorrow's book 1 tap away", "Add the Library to your home screen. It opens like an app."], cal: ["Keep your streak alive", "Add a 2-minute daily reminder for Mystery Book."], email: ["Get a new book idea 3 times a week", "The Useful Life newsletter. Free."] },
      test: { cal: ["Day 7 is where most tests die", "Add a daily 2-minute reminder so you don't miss twice."], install: ["Track your test from your home screen", "Add the Library. Tick each day in 1 tap."], email: ["Get 1 more idea to test, 3 times a week", "The Useful Life newsletter. Free."] },
      done: { email: ["Liked that? Get 3 more a week", "Lessons from real books, by email. Free."], install: ["Come back to it anytime", "Add the Library to your home screen."], cal: ["Make it a habit", "Add a daily 2-minute reminder."] }
    }[moment] || {};
    var order = moment === "test" ? ["cal", "install", "email"] : (moment === "done" ? ["email", "install", "cal"] : (isIOS || isAndroid ? ["install", "email", "cal"] : ["email", "cal", "install"]));
    var pick = null;
    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      if (snoozed(k)) continue;
      if (k === "install" && (standalone || store.get("did:install", false))) continue;
      if (k === "cal" && store.get("did:cal", false)) continue;
      if (k === "email" && store.get("subscribed", false)) continue;
      pick = k; break;
    }
    if (!pick || !copy[pick]) return;
    try { sessionStorage.setItem("lib:asked", "1"); } catch (e) {}
    var c = document.createElement("div"); c.className = "ask rise"; c.setAttribute("role", "region"); c.setAttribute("aria-label", "Stay in the loop");
    var go = pick === "install" ? '<button type="button" class="btn btn-green" data-a="install">' + (isIOS ? "Show me how" : "Add it") + '</button>'
      : pick === "cal" ? '<a class="btn btn-green" data-a="cal" href="/library/mystery-book.ics">Add reminder</a>' : '';
    c.innerHTML = '<div class="ask-ic">' + ICONS[pick] + '</div><div class="ask-t"><b></b><span></span></div><div class="ask-go">' + go + '<button type="button" class="later">Not now</button></div>' +
      (pick === "email" ? '<form data-life-signup data-campaign="ask-' + moment + '" novalidate><label class="vh" for="ask-em">Email address</label><input id="ask-em" type="email" autocomplete="email" placeholder="you@email.com" required><button class="btn btn-green" type="submit">Send me the lessons</button></form><div class="signup-msg" aria-live="polite"></div>' : '');
    $(".ask-t b", c).textContent = copy[pick][0]; $(".ask-t span", c).textContent = copy[pick][1];
    anchor.parentNode.insertBefore(c, anchor.nextSibling);
    var b = $("[data-a=install]", c); if (b) b.addEventListener("click", function () { install(); c.remove(); });
    var cl = $("[data-a=cal]", c); if (cl) cl.addEventListener("click", function (e) { calendar(e); setTimeout(function () { c.remove(); }, 300); });
    $(".later", c).addEventListener("click", function () { store.set("snooze:" + pick, Date.now()); c.remove(); });
    var f = $("form", c); if (f && window.LibBindSignup) window.LibBindSignup(f);
  };
  // Checklist finished and 30-day test started trigger the ask
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-start]");
    if (t) setTimeout(function () { window.LibAsk(t.closest("[data-test]"), "test"); }, 600);
  });
  var allDone = $("[data-alldone]");
  if (allDone) new MutationObserver(function () { if (!allDone.hidden) setTimeout(function () { window.LibAsk(allDone, "done"); }, 500); }).observe(allDone, { attributes: true, attributeFilter: ["hidden"] });
})();
