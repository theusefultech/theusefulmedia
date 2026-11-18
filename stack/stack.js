// Tinystack waitlist page: stack builder, runner, share card, scroll rows, tips.
// theusefulmedia.com/stack · 18 Nov 2026. Signup itself is handled by /tech/tech.js.
(function () {
  "use strict";

  // ---------- Data: the same 60 activities as the app (energy 1 low, 2 some, 3 high) ----------
  var CATS = [
    { id: "read", name: "Read and write", e: "📖" },
    { id: "make", name: "Make", e: "🎨" },
    { id: "mind", name: "Mind games", e: "🧩" },
    { id: "music", name: "Music", e: "🎵" },
    { id: "move", name: "Move", e: "🚶" },
    { id: "home", name: "Home and food", e: "🍳" },
    { id: "calm", name: "Calm", e: "🌙" },
    { id: "people", name: "People and outside", e: "🎲" }
  ];
  // [id, name, emoji, category, minutes, energy, place in|out|any, company solo|social|any]
  var RAW = [
    ["book", "Book", "📖", "read", 20, 1, "any", "solo"], ["magazine", "Magazine", "📰", "read", 15, 1, "in", "solo"],
    ["poetry", "Poetry", "🪶", "read", 10, 1, "any", "solo"], ["journal", "Journal", "📓", "read", 10, 1, "any", "solo"],
    ["gratitude", "Gratitude list", "🙏", "read", 5, 1, "any", "solo"], ["letter", "Write a letter", "✉️", "read", 20, 1, "in", "solo"],
    ["creative", "Creative writing", "🖋️", "read", 25, 2, "in", "solo"], ["plan", "Plan tomorrow", "🗓️", "read", 10, 1, "in", "solo"],
    ["language", "Language workbook", "🗣️", "read", 20, 2, "in", "solo"], ["calligraphy", "Calligraphy", "✒️", "read", 20, 2, "in", "solo"],
    ["knitting", "Knitting", "🧶", "make", 30, 1, "in", "any"], ["crochet", "Crochet", "🪝", "make", 30, 1, "in", "any"],
    ["embroidery", "Embroidery", "🪡", "make", 30, 1, "in", "solo"], ["mending", "Mending", "🧵", "make", 20, 1, "in", "solo"],
    ["sketching", "Sketching", "✏️", "make", 20, 1, "any", "solo"], ["colouring", "Colouring", "🖍️", "make", 20, 1, "in", "any"],
    ["watercolour", "Watercolour", "🎨", "make", 30, 2, "any", "solo"], ["pbn", "Paint by numbers", "🖼️", "make", 30, 1, "in", "solo"],
    ["collage", "Collage", "✂️", "make", 30, 2, "in", "any"], ["origami", "Origami", "🦢", "make", 15, 1, "in", "any"],
    ["clay", "Clay", "🏺", "make", 40, 2, "in", "any"], ["lego", "Lego", "🧱", "make", 40, 2, "in", "any"],
    ["models", "Model kits", "✈️", "make", 40, 2, "in", "solo"], ["woodwork", "Woodwork", "🪚", "make", 60, 3, "any", "solo"],
    ["crossword", "Crossword", "🔤", "mind", 15, 1, "any", "any"], ["logic", "Logic puzzles", "🧠", "mind", 15, 2, "any", "solo"],
    ["jigsaw", "Jigsaw", "🧩", "mind", 40, 1, "in", "any"], ["chess", "Chess", "♟️", "mind", 30, 2, "in", "any"],
    ["cube", "Rubik's cube", "🧊", "mind", 10, 2, "any", "solo"], ["cards", "Card games", "🃏", "mind", 20, 1, "in", "any"],
    ["wordsearch", "Word search", "🔎", "mind", 10, 1, "any", "solo"],
    ["instrument", "Play an instrument", "🎹", "music", 20, 2, "in", "any"], ["sing", "Sing", "🎤", "music", 10, 2, "any", "any"],
    ["vinyl", "A full album on vinyl", "💿", "music", 40, 1, "in", "any"], ["byear", "Learn a song by ear", "🎸", "music", 30, 2, "in", "solo"],
    ["radio", "Radio", "📻", "music", 20, 1, "in", "any"],
    ["walk", "Walk without earbuds", "🚶", "move", 20, 2, "out", "any"], ["yoga", "Yoga", "🧘", "move", 20, 2, "in", "any"],
    ["stretch", "Stretching", "🤸", "move", 10, 1, "in", "any"], ["run", "Running", "🏃", "move", 30, 3, "out", "any"],
    ["swim", "Swimming", "🏊", "move", 40, 3, "out", "any"], ["cycle", "Cycling", "🚲", "move", 40, 3, "out", "any"],
    ["dance", "Dancing", "💃", "move", 15, 3, "in", "any"], ["workout", "Home workout", "🏋️", "move", 20, 3, "in", "any"],
    ["recipe", "Cook a new recipe", "🍳", "home", 45, 2, "in", "any"], ["baking", "Baking", "🥐", "home", 60, 2, "in", "any"],
    ["tea", "Tea ritual", "🍵", "home", 10, 1, "in", "any"], ["drawer", "Tidy a drawer", "🗄️", "home", 15, 2, "in", "solo"],
    ["plants", "Plant care", "🪴", "home", 10, 1, "any", "solo"], ["garden", "Gardening", "🌱", "home", 30, 2, "out", "any"],
    ["mealprep", "Meal prep", "🥗", "home", 40, 2, "in", "any"],
    ["meditate", "Meditation", "🕯️", "calm", 10, 1, "any", "solo"], ["breathe", "Breathing", "🌬️", "calm", 5, 1, "any", "solo"],
    ["sky", "Sky watching", "☁️", "calm", 10, 1, "out", "any"], ["stars", "Stargazing", "✨", "calm", 20, 1, "out", "any"],
    ["bath", "A slow bath", "🛁", "calm", 30, 1, "in", "solo"],
    ["boardgames", "Board games", "🎲", "people", 45, 2, "in", "social"], ["kidspets", "Play with kids or pets", "🐕", "people", 20, 2, "any", "social"],
    ["birding", "Film photos or birdwatching", "📷", "people", 40, 2, "out", "any"], ["museum", "Library or museum", "🏛️", "people", 60, 2, "out", "any"]
  ];
  var BUILTIN = RAW.map(function (r) { return { id: r[0], name: r[1], e: r[2], cat: r[3], min: r[4], energy: r[5], place: r[6], company: r[7] }; });
  var ENERGY_WORD = { 1: "low", 2: "some", 3: "high" };
  var ARCHETYPE = { read: ["The Reader", "reader"], make: ["The Maker", "maker"], mind: ["The Puzzler", "puzzler"], music: ["The Musician", "musician"],
    move: ["The Mover", "mover"], home: ["The Home Cook", "homecook"], calm: ["The Calm One", "calm"], people: ["The Explorer", "explorer"], own: ["The Original", "original"] };
  var CHAR_LINE = { reader: "You recharge with pages, not posts.", maker: "Busy hands, quiet head.", puzzler: "Your brain wants a problem, not a feed.",
    musician: "You'd rather play it than scroll past it.", mover: "Your best thinking happens on your feet.", homecook: "You like something real to show for your time.",
    calm: "You know slow is a skill.", explorer: "You collect places and people, not likes.", original: "Your stack is like nobody else's." };
  var WHY = { read: "Quiet focus, no screen", make: "Hands busy, head quiet", mind: "Wakes your brain up", music: "Uses your hands and ears",
    move: "Gets you moving", home: "Something real to show for it", calm: "Winds you down", people: "Time away from your own head", own: "One of your own" };

  // ---------- Storage (fails quietly in private mode) ----------
  var KEY = "tinystack-v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ a: state.answers, p: Array.from(state.picks), c: state.custom, done: state.done, joined: state.joined, h: state.history.slice(-60) })); } catch (e) {}
  }
  var saved = load();
  var state = {
    answers: Object.assign({ minutes: "40", energy: "1", place: "in", company: "solo" }, saved.a || {}),
    picks: new Set(saved.p || []),
    custom: Array.isArray(saved.c) ? saved.c.filter(function (c) { return c && c.id && c.name; }).slice(0, 30) : [],
    done: saved.done || 0,
    joined: !!saved.joined,
    history: Array.isArray(saved.h) ? saved.h.filter(function (x) { return x && x.d && x.m >= 0; }) : [],
    filter: "all", query: "", seed: 1, stack: null, archetype: null
  };
  function all() { return BUILTIN.concat(state.custom); }
  function byId(id) { return all().filter(function (a) { return a.id === id; })[0]; }
  // Drop picks that point at nothing (a custom item removed in another tab).
  state.picks.forEach(function (id) { if (!byId(id)) state.picks.delete(id); });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function icoSrc(a) { return "/stack/i/" + (a.cat === "own" ? "own" : a.id) + ".webp"; }
  function ico(a, cls) {
    var w = el("span", cls || "e"), im = new Image();
    im.src = icoSrc(a); im.alt = ""; im.decoding = "async"; im.loading = "lazy"; im.width = 64; im.height = 64;
    im.onerror = function () { w.textContent = a.e; };
    w.appendChild(im); return w;
  }
  var imgCache = {};
  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src; });
    return imgCache[src];
  }
  function minLabel(m) { m = +m; return m === 60 ? "1 hour" : m + " minutes"; }

  // ---------- Toast ----------
  var toastEl = $(".toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }


  // ---------- Hero: brain rot feed vs brain stack ----------
  (function () {
    var screen = $("[data-phone]"), phone = $(".phone"), swap = $(".swap"), meter = $("[data-scrolled]");
    if (!screen || !swap) return;
    var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var touched = false, secs = 3 * 3600 + 12 * 60;
    function set(mode, user) {
      if (user) touched = true;
      var rot = mode === "rot";
      if (screen.classList.contains("is-rot") === rot && swap.getAttribute("data-on") === mode) return;
      screen.classList.toggle("is-rot", rot);
      swap.setAttribute("data-on", mode);
      $$("button", swap).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-swap") === mode)); });
      phone.classList.remove("flip"); void phone.offsetWidth; phone.classList.add("flip");
    }
    $$("button", swap).forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-swap"), true); }); });
    swap.setAttribute("data-on", "rot");
    setInterval(function () {
      if (!screen.classList.contains("is-rot")) return;
      secs += 7;
      meter.textContent = Math.floor(secs / 3600) + "h " + Math.floor((secs % 3600) / 60) + "m";
    }, 1000);
    if (reduced) { set("stack"); return; }
    // Flip on its own 3 seconds after the phone is actually on screen (it sits below the fold on phones).
    var armed = false;
    function arm() { if (armed) return; armed = true; setTimeout(function () { if (!touched) set("stack"); }, 3000); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting && es[0].intersectionRatio > 0.5) { arm(); io.disconnect(); } }, { threshold: [0, 0.5, 0.8] });
      io.observe(phone);
    } else arm();
  })();


  // ---------- Screen time calculator ----------
  (function () {
    var r = $("#scroll-hours"); if (!r) return;
    var nums = { books: 5, sketch: 20, songs: 3, walks: 0.5 }, shown = {};
    function fmtH(h) { var m = Math.round(h * 60); return (m >= 60 ? Math.floor(m / 60) + "h" : "") + (m % 60 ? (m >= 60 ? " " : "") + (m % 60) + "m" : ""); }
    function count(node, to) {
      var from = shown[node.getAttribute("data-n") || "year"] || 0, t0 = performance.now(), key = node.getAttribute("data-n") || "year";
      shown[key] = to; cancelAnimationFrame(node._raf);
      (function step(t) { var k = Math.min(1, (t - t0) / 450), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); node.textContent = v.toLocaleString("en-US"); if (k < 1) node._raf = requestAnimationFrame(step); })(t0);
    }
    var last = {};
    function update() {
      var h = +r.value, year = Math.round(h * 365);
      $("[data-hours]").textContent = fmtH(h);
      r.setAttribute("aria-valuetext", fmtH(h).replace("h", " hours").replace("m", " minutes") + " a day");
      r.style.setProperty("--p", ((h - 0.5) / 7.5 * 100) + "%");
      count($("[data-year]"), year);
      Object.keys(nums).forEach(function (k) {
        var n = Math.floor(year / nums[k]), node = $("[data-n='" + k + "']");
        if (last[k] != null && n !== last[k]) { var tile = node.parentNode; tile.classList.remove("bump"); void tile.offsetWidth; tile.classList.add("bump"); }
        last[k] = n; count(node, n);
      });
      $("[data-swap-books]").textContent = Math.floor(0.5 * 365 / nums.books);
    }
    r.addEventListener("input", update);
    if ("IntersectionObserver" in window && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      var seen = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { update(); seen.disconnect(); } }, { threshold: 0.35 });
      seen.observe($(".calc-out"));
    } else update();
  })();

  // ---------- Step 1: questions ----------
  $$(".chips[data-q]").forEach(function (group) {
    var q = group.getAttribute("data-q");
    var btns = $$("button", group);
    function sync() { btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === String(state.answers[q]))); }); }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { state.answers[q] = b.getAttribute("data-v"); sync(); save(); });
    });
    sync();
  });

  // ---------- Steps ----------
  var builder = $(".builder");
  function go(step) {
    step = +step;
    if (step === 3) { if (state.picks.size < 3) { go(2); return; } buildStack(); think(); }
    builder.setAttribute("data-step", step);
    $$("[data-pane]").forEach(function (p) { p.hidden = +p.getAttribute("data-pane") !== step; });
    $$(".steps li").forEach(function (li) {
      var s = +li.getAttribute("data-s");
      li.classList.toggle("on", s === step); li.classList.toggle("done", s < step);
      if (s === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (step === 2) { renderCats(); renderGrid(); }
    var top = $("#build").getBoundingClientRect().top;
    if (top < -40 || top > window.innerHeight * 0.5) $("#build").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-go]");
    if (g && !g.disabled) go(g.getAttribute("data-go"));
  });

  // ---------- Step 2: picker ----------
  var catRow = $(".cat-row"), grid = $("[data-grid]"), countEl = $("[data-count]"), nextBtn = $("[data-need-picks]");
  function renderCats() {
    var CI = { read: "book", make: "watercolour", mind: "jigsaw", music: "instrument", move: "walk", home: "recipe", calm: "meditate", people: "boardgames" };
    var opts = [{ id: "all", name: "All 60" }].concat(CATS.map(function (c) { return { id: c.id, name: c.name, i: CI[c.id] }; }));
    if (state.custom.length) opts.push({ id: "own", name: "Your own (" + state.custom.length + ")", i: "own" });
    if (state.picks.size) opts.push({ id: "picked", name: "✓ Picked (" + state.picks.size + ")" });
    if (!opts.some(function (o) { return o.id === state.filter; })) state.filter = "all";
    catRow.innerHTML = "";
    opts.forEach(function (o) {
      var b = el("button", o.id === "picked" ? "picked-tab" : "");
      if (o.i) { var im = new Image(); im.src = "/stack/i/" + o.i + ".webp"; im.alt = ""; im.width = 22; im.height = 22; im.className = "chip-ico"; b.appendChild(im); }
      b.appendChild(el("span", "lbl", o.name));
      b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(o.id === state.filter));
      b.addEventListener("click", function () { state.filter = o.id; state.query = ""; $("#act-search").value = ""; renderCats(); renderGrid(); });
      catRow.appendChild(b);
    });
    updateArrows(catRow);
  }
  function visible() {
    var q = state.query.trim().toLowerCase();
    return all().filter(function (a) {
      if (q) return a.name.toLowerCase().indexOf(q) !== -1;
      if (state.filter === "all") return a.cat !== "own";
      if (state.filter === "picked") return state.picks.has(a.id);
      return a.cat === state.filter;
    });
  }
  function meta(a) { return a.min + " min · " + ENERGY_WORD[a.energy] + " energy" + (a.place === "out" ? " · outside" : ""); }
  function renderGrid() {
    var list = visible();
    grid.innerHTML = "";
    list.forEach(function (a) {
      var cell = el("div", "cell");
      var b = el("button", "act c-" + a.cat);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.picks.has(a.id)));
      b.setAttribute("aria-label", a.name + ", " + meta(a));
      b.appendChild(ico(a)); b.appendChild(el("span", "n", a.name)); b.appendChild(el("span", "m", meta(a)));
      b.addEventListener("click", function () {
        var adding = !state.picks.has(a.id);
        if (adding) state.picks.add(a.id); else state.picks.delete(a.id);
        b.setAttribute("aria-pressed", String(adding));
        save();
        if (adding) flyToTower($(".e", b), a); else renderTower();
        updateCount();
        if (state.filter === "picked" && !state.picks.has(a.id)) renderGrid();
      });
      cell.appendChild(b);
      if (a.cat === "own") {
        var rm = el("button", "rm", "✕"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + a.name);
        rm.addEventListener("click", function () {
          state.custom = state.custom.filter(function (c) { return c.id !== a.id; });
          state.picks.delete(a.id); save(); updateCount(); renderCats(); renderGrid(); toast("Removed " + a.name);
        });
        cell.appendChild(rm);
      }
      grid.appendChild(cell);
    });
    $(".empty-search").hidden = list.length > 0;
    if (!list.length && state.query) $("#custom-name").value = state.query.slice(0, 40);
    updateCount();
  }
  function updateCount() {
    var n = state.picks.size;
    countEl.textContent = n;
    $(".picked-count").classList.toggle("ready", n >= 3);
    nextBtn.disabled = n < 3;
    if (towerN && parseInt(towerN.textContent || "0", 10) !== n && !document.querySelector(".flyer")) renderTower();
    nextBtn.firstChild.textContent = n < 3 ? "Pick " + (3 - n) + " more " : "Build my stack ";
    var pickedTab = $(".picked-tab .lbl", catRow);
    if (pickedTab) pickedTab.textContent = "✓ Picked (" + n + ")";
    else if (n && $("[data-pane='2']") && !$("[data-pane='2']").hidden) renderCats();
  }
  var searchT;
  $("#act-search").addEventListener("input", function (e) {
    clearTimeout(searchT);
    searchT = setTimeout(function () { state.query = e.target.value; renderGrid(); }, 80);
  });

  // Custom activities
  var customForm = $("[data-custom]"), customMsg = $(".custom-msg");
  customForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#custom-name").value.replace(/\s+/g, " ").trim();
    customMsg.className = "custom-msg";
    if (!name) { customMsg.textContent = "Type a name first, like \"Piano practice\"."; $("#custom-name").focus(); return; }
    if (name.length > 40) name = name.slice(0, 40);
    var same = all().filter(function (a) { return a.name.toLowerCase() === name.toLowerCase(); })[0];
    if (same) {
      state.picks.add(same.id); save(); updateCount(); renderGrid();
      customMsg.className = "custom-msg ok"; customMsg.textContent = same.name + " is already in the list, so we picked it for you.";
      return;
    }
    if (state.custom.length >= 30) { customMsg.textContent = "You've added 30 of your own. Remove one to add another."; return; }
    var a = { id: "u_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: name, e: "⭐", cat: "own",
      min: +$("#custom-min").value, energy: +$("#custom-energy").value, place: $("#custom-place").value, company: "any" };
    state.custom.push(a); state.picks.add(a.id); save();
    $("#custom-name").value = "";
    if (["all", "own", "picked"].indexOf(state.filter) === -1 || state.filter === "all") state.filter = "own";
    state.query = ""; $("#act-search").value = "";
    renderCats(); renderGrid();
    customMsg.className = "custom-msg ok"; customMsg.textContent = "Added and picked: " + name + ".";
  });


  // ---------- Pick tower ----------
  var towerPile = $("[data-tower-pile]"), towerN = $("[data-tower-n]");
  var reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TINT_CSS = { read: "c-read", make: "c-make", mind: "c-mind", music: "c-music", move: "c-move", home: "c-home", calm: "c-calm", people: "c-people", own: "c-own" };
  function renderTower(newId) {
    if (!towerPile) return;
    var ids = Array.from(state.picks).filter(byId), show = ids.slice(-4);
    towerPile.innerHTML = "";
    if (!show.length) towerPile.appendChild(el("span", "empty", "Your stack"));
    show.forEach(function (id, i) {
      var a = byId(id), w = el("span", "tw " + TINT_CSS[a.cat]), im = new Image();
      im.src = icoSrc(a); im.alt = ""; im.width = 24; im.height = 24; w.appendChild(im);
      w.style.zIndex = i + 1;
      if (id === newId && i === show.length - 1) w.classList.add("new");
      towerPile.appendChild(w);
    });
    towerN.textContent = ids.length ? ids.length + " picked" : "";
  }
  function flyToTower(fromEl, a) {
    if (reducedMotion || !towerPile || !fromEl || !fromEl.getBoundingClientRect) { renderTower(a.id); return; }
    var r1 = fromEl.getBoundingClientRect(), r2 = towerPile.getBoundingClientRect();
    if (!r1.width || r2.bottom < 0 || r2.top > innerHeight) { renderTower(a.id); return; }
    var f = new Image(); f.src = icoSrc(a); f.alt = ""; f.className = "flyer";
    f.style.left = r1.left + "px"; f.style.top = r1.top + "px"; document.body.appendChild(f);
    var tr = (towerPile.lastElementChild || towerPile).getBoundingClientRect(), dx = tr.right - 20 - r1.left, dy = tr.top + tr.height / 2 - 20 - r1.top;
    var anim = f.animate([
      { transform: "translate(0,0) scale(1)" },
      { transform: "translate(" + dx * 0.5 + "px," + (dy * 0.5 - 120) + "px) scale(1.3) rotate(-12deg)", offset: 0.5 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(.85)" }
    ], { duration: 560, easing: "cubic-bezier(.4,.1,.3,1)" });
    anim.onfinish = function () { f.remove(); renderTower(a.id); };
  }
  $("[data-tower]").addEventListener("click", function () {
    if (!state.picks.size) { toast("Pick something you enjoy first"); return; }
    state.filter = "picked"; state.query = ""; $("#act-search").value = ""; renderCats(); renderGrid();
    $(".pick-head").scrollIntoView({ behavior: "smooth", block: "start" });
  });



  // ---------- Ambient sound (generated in the browser, no files) ----------
  var ambMode = "off", amb = null;
  try { ambMode = localStorage.getItem("tinystack-amb") || "off"; } catch (e) {}
  function noiseBuffer(ctx, kind) {
    var len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  function ambient(mode, pauseOnly) {
    if (!ac) return;
    if (amb) {
      var old = amb; amb = null;
      try { old.gain.gain.setTargetAtTime(0, ac.currentTime, 0.25); } catch (e) {}
      clearInterval(old.timer); setTimeout(function () { old.nodes.forEach(function (n) { try { n.stop ? n.stop() : 0; n.disconnect(); } catch (e) {} }); }, 1200);
    }
    if (pauseOnly || !mode || mode === "off") return;
    var g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination);
    var nodes = [], timer = null;
    function loop(kind, type, freq, q, vol) {
      var src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, kind); src.loop = true;
      var f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
      var v = ac.createGain(); v.gain.value = vol;
      src.connect(f); f.connect(v); v.connect(g); src.start(); nodes.push(src, f, v); return v;
    }
    function blip(freq, dur, vol, type) {
      var o = ac.createOscillator(), v = ac.createGain(), t = ac.currentTime;
      o.type = type || "sine"; o.frequency.value = freq; v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(v); v.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
    if (mode === "rain") {
      loop("white", "lowpass", 1400, 0.5, 0.22); loop("brown", "lowpass", 400, 0.7, 0.5);
      timer = setInterval(function () { if (Math.random() < 0.6) blip(2400 + Math.random() * 2400, 0.04, 0.02 + Math.random() * 0.03, "triangle"); }, 70);
    } else if (mode === "fire") {
      loop("brown", "lowpass", 520, 0.8, 0.85);
      timer = setInterval(function () { if (Math.random() < 0.35) { var n = 1 + Math.floor(Math.random() * 3); for (var k = 0; k < n; k++) blip(900 + Math.random() * 2600, 0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.08, "square"); } }, 110);
    } else if (mode === "cafe") {
      var hum = loop("brown", "bandpass", 450, 0.6, 1.1);
      timer = setInterval(function () {
        hum.gain.setTargetAtTime(0.8 + Math.random() * 0.6, ac.currentTime, 0.6);
        if (Math.random() < 0.06) { var f = 1800 + Math.random() * 1600; blip(f, 0.6, 0.03); blip(f * 1.5, 0.4, 0.015); }
      }, 400);
    }
    g.gain.setTargetAtTime(0.5, ac.currentTime, 0.6);
    amb = { gain: g, nodes: nodes, timer: timer };
  }
  $$("[data-amb]").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-amb") === ambMode));
    b.addEventListener("click", function () {
      ambMode = b.getAttribute("data-amb");
      try { localStorage.setItem("tinystack-amb", ambMode); } catch (e) {}
      $$("[data-amb]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      if (run && run.paused == null && !$("[data-run-live]").hidden) ambient(ambMode);
    });
  });


  // ---------- Character card ----------
  function renderChar() {
    var slug = state.archetype[1];
    $("[data-archetype]").textContent = state.archetype[0];
    $("[data-char-line]").textContent = CHAR_LINE[slug];
    var img = $("[data-char-img]"), fresh = img.cloneNode(); fresh.src = "/stack/i/ch-" + slug + ".webp"; img.replaceWith(fresh);
    var prop = $("[data-char-prop]"); prop.innerHTML = "";
    var top = state.stack && state.stack[0]; if (top) prop.appendChild(ico(top.a, "pi"));
    var row = $("[data-types]"); row.innerHTML = "";
    Object.keys(ARCHETYPE).forEach(function (k) {
      var t = ARCHETYPE[k], b = el("button", t[1] === slug ? "me" : ""), im = new Image();
      b.type = "button"; im.src = "/stack/i/ch-" + t[1] + ".webp"; im.alt = ""; im.width = 30; im.height = 30; b.appendChild(im);
      b.setAttribute("aria-label", t[0] + (t[1] === slug ? " (you)" : ""));
      b.setAttribute("data-tip", t[0] + (t[1] === slug ? " (you)" : "") + ": " + CHAR_LINE[t[1]]);
      bindTip(b); row.appendChild(b);
    });
  }

  // ---------- Thinking reveal ----------
  var thinkT = [];
  function think() {
    var result = $(".result"), list = $("[data-think-steps]");
    thinkT.forEach(clearTimeout); thinkT = [];
    if (reducedMotionGlobal()) { result.classList.remove("is-thinking"); return; }
    var T = +state.answers.minutes, E = ENERGY_WORD[+state.answers.energy];
    var where = { in: "indoors", out: "outside", any: "inside or out" }[state.answers.place];
    var lines = [
      "Reading your " + state.picks.size + " picks",
      "Matching " + E + " energy, " + where,
      "Fitting " + minLabel(T),
      state.stack.length > 1 ? "Ordering: easy start, calm finish" : "Picking your best one"
    ];
    list.innerHTML = "";
    var items = lines.map(function (t) { var li = el("li"); li.appendChild(el("i", "", "")); li.appendChild(el("span", "", t)); list.appendChild(li); return li; });
    result.classList.add("is-thinking");
    var step = 380;
    items.forEach(function (li, i) {
      thinkT.push(setTimeout(function () { li.classList.add("show"); }, i * step));
      thinkT.push(setTimeout(function () { li.classList.add("done"); $("i", li).textContent = "✓"; }, i * step + step - 40));
    });
    thinkT.push(setTimeout(function () {
      result.classList.remove("is-thinking");
      var card = $("[data-card]"); card.classList.remove("landed"); void card.offsetWidth; card.classList.add("landed");
    }, items.length * step + 220));
  }
  function reducedMotionGlobal() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

  // ---------- Step 3: build the stack (same rules engine as the app's fallback) ----------
  function rnd(seed, s) { var h = 2166136261 ^ seed; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  // Shared rules engine (same idea as the app's fallback). o: { T, E, P, C, pool, seed, boost }
  function plan(o) {
    var T = o.T, E = o.E, P = o.P, C = o.C, pool = o.pool, boost = o.boost || {};
    var n = T < 10 ? 1 : T <= 20 ? 2 : T <= 60 ? 3 : 4;
    n = Math.min(n, pool.length);
    var scored = pool.map(function (a) {
      var s = 3 + rnd(o.seed, a.id) * 1.6, hard = false;
      var d = a.energy - E;
      if (d > 0) s -= 2 * d; else if (d === 0) s += 1; else s -= 0.4 * -d;
      if (P === "in" && a.place === "out") { s -= 6; hard = true; }
      if (P === "out") s += a.place === "out" ? 2 : a.place === "in" ? -1.5 : 0;
      if (C === "solo" && a.company === "social") { s -= 6; hard = true; }
      if (C === "social") s += a.company === "solo" ? -1 : 1.5;
      if (a.min > 2 * T) s -= 1.5 + Math.min(4, a.min / T / 2);
      if (boost[a.id]) { s += 8; hard = false; }
      return { a: a, s: s, hard: hard };
    }).sort(function (x, y) { return y.s - x.s; });
    var chosen = [], usedCats = {}, relaxed = false;
    var soft = scored.filter(function (x) { return !x.hard; });
    var hardOnes = scored.filter(function (x) { return x.hard; });
    while (chosen.length < n && soft.length) {
      soft.forEach(function (x) { x.adj = x.s - (usedCats[x.a.cat] ? 1.5 : 0); });
      soft.sort(function (x, y) { return y.adj - x.adj; });
      var pick = soft.shift(); chosen.push(pick); usedCats[pick.a.cat] = 1;
    }
    while (chosen.length < n && hardOnes.length) { chosen.push(hardOnes.shift()); relaxed = true; }

    // Order: easy start, active middle, calm finish.
    function slot(a) {
      if (a.cat === "calm" || (a.cat === "read" && a.energy === 1) || a.id === "tea") return 2;
      if (a.cat === "move" || a.energy === 3) return 1;
      return 0;
    }
    chosen.sort(function (x, y) { return slot(x.a) - slot(y.a) || x.a.energy - y.a.energy; });
    if (chosen.length > 1 && slot(chosen[0].a) === 2 && slot(chosen[chosen.length - 1].a) === 2) {
      chosen.sort(function (x, y) { return x.a.energy - y.a.energy; });
    }

    // Minutes: 5-minute units, weighted by each activity's usual length, at least 5 each.
    var units = Math.max(chosen.length, Math.round(T / 5)), w = chosen.map(function (x) { return x.a.min; }), sum = w.reduce(function (p, c) { return p + c; }, 0) || 1;
    var alloc = w.map(function (v) { return Math.max(1, Math.floor(units * v / sum)); });
    var left = units - alloc.reduce(function (p, c) { return p + c; }, 0);
    var order = w.map(function (v, i) { return { i: i, f: units * v / sum - Math.floor(units * v / sum) }; }).sort(function (x, y) { return y.f - x.f; });
    for (var k = 0; left > 0 && order.length; k++, left--) alloc[order[k % order.length].i]++;
    while (left < 0) { var big = alloc.indexOf(Math.max.apply(null, alloc)); if (alloc[big] <= 1) break; alloc[big]--; left++; }

    var stack = chosen.map(function (x, i) {
      var why = WHY[x.a.cat];
      if (boost[x.a.id]) why = "You asked for it";
      else if (i === 0 && chosen.length > 1) why = x.a.energy === 1 ? "Easy start, no setup" : "Starts you off with energy";
      else if (i === chosen.length - 1 && chosen.length > 1 && (x.a.cat === "calm" || x.a.cat === "read")) why = "Ends on a quiet note";
      var base = why;
      if (alloc[i] * 5 <= x.a.min * 0.5 && x.a.min >= 30) why += " · a short one";
      return { a: x.a, min: alloc[i] * 5, why: why, base: base };
    });
    return { stack: stack, relaxed: relaxed };
  }

  function buildStack() {
    var pool = Array.from(state.picks).map(byId).filter(Boolean);
    var r = plan({ T: +state.answers.minutes, E: +state.answers.energy, P: state.answers.place, C: state.answers.company, pool: pool, seed: state.seed });
    state.stack = r.stack; var relaxed = r.relaxed;

    // Archetype from everything picked, not just this stack.
    var counts = {};
    pool.forEach(function (a) { counts[a.cat] = (counts[a.cat] || 0) + 1; });
    var top = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0] || "read";
    state.archetype = ARCHETYPE[top];
    $$("form[data-signup]").forEach(function (f) { f.setAttribute("data-medium", "stack-" + state.archetype[1]); });

    renderResult(relaxed);
  }
  function renderResult(relaxed) {
    var T = +state.answers.minutes, E = +state.answers.energy;
    renderChar();
    $("[data-title]").textContent = minLabel(T) + ", " + ENERGY_WORD[E] + " energy";
    var list = $("[data-stacklist]"); list.innerHTML = "";
    state.stack.forEach(function (s) {
      var li = el("li", "c-" + s.a.cat);
      li.appendChild(ico(s.a));
      var mid = el("span"); mid.appendChild(el("span", "n", s.a.name)); mid.appendChild(el("span", "w", s.why)); li.appendChild(mid);
      var t = el("span", "t", String(s.min)); t.appendChild(el("small", "", " min")); li.appendChild(t);
      list.appendChild(li);
    });
    var where = { in: "Indoors", out: "Outside", any: "Inside or out" }[state.answers.place];
    var who = state.answers.company === "solo" ? "just you" : "with someone";
    var why = "Fits your " + minLabel(T) + " and " + ENERGY_WORD[E] + " energy. " + where + ", " + who + ".";
    if (state.stack.length > 1) why += " Starts easy, ends calm.";
    if (relaxed) why += " A few of your picks didn't match where or who, so add more picks for a better fit.";
    $("[data-why]").textContent = why;
  }
  $("[data-shuffle]").addEventListener("click", function () {
    var before = state.stack.map(function (s) { return s.a.id + s.min; }).join();
    for (var i = 0; i < 12; i++) {
      state.seed++; buildStack();
      if (state.stack.map(function (s) { return s.a.id + s.min; }).join() !== before) {
        var l = $("[data-stacklist]"); l.classList.remove("spin"); void l.offsetWidth; l.classList.add("spin");
        return;
      }
    }
    toast("That's the best mix for your picks. Add more picks for variety.");
  });

  // ---------- Share card (1080 x 1350 image) ----------
  var SHARE_URL = "https://theusefulmedia.com/stack/?utm_campaign=tinystack-share";
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  var TINT = { read: "#DCE8DF", make: "#F2DDE2", mind: "#DEE4F2", music: "#E9DFF3", move: "#D9EEEE", home: "#F2E8C6", calm: "#E1E8F3", people: "#E8E1D3", own: "#ECE6DA" };
  function fit(ctx, text, max) { if (ctx.measureText(text).width <= max) return text; while (text.length > 1 && ctx.measureText(text + "…").width > max) text = text.slice(0, -1); return text + "…"; }
  var cardChar = null;
  function drawCard() {
    var c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
    var x = c.getContext("2d"), serif = "Fraunces, Georgia, serif", sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
    x.fillStyle = "#1E1B26"; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = "#E7D36A"; x.font = "700 30px " + sans; x.fillText("MY BRAIN STACK · I'M", 90, 130);
    x.fillStyle = "#F5F0E6"; x.font = "600 92px " + serif; x.fillText(fit(x, state.archetype[0], 680), 90, 230);
    x.fillStyle = "#CFC8BB"; x.font = "500 34px " + sans;
    (function (words, maxW) {
      var lines = [""], i;
      for (i = 0; i < words.length; i++) { var tryL = (lines[lines.length - 1] + " " + words[i]).trim(); if (x.measureText(tryL).width > maxW && lines[lines.length - 1]) lines.push(words[i]); else lines[lines.length - 1] = tryL; }
      lines.slice(0, 2).forEach(function (l, k) { x.fillText(fit(x, l, maxW), 90, 285 + k * 42); });
    })(CHAR_LINE[state.archetype[1]].split(" "), 620);
    if (cardChar) { x.save(); x.globalAlpha = .35; x.fillStyle = "#E7D36A"; x.beginPath(); x.arc(875, 190, 125, 0, Math.PI * 2); x.fill(); x.restore(); x.drawImage(cardChar, 765, 80, 220, 220); }
    x.fillStyle = "#E7D36A"; x.font = "700 30px " + sans; x.fillText((minLabel(state.answers.minutes) + " · " + ENERGY_WORD[state.answers.energy] + " energy").toUpperCase(), 90, 400);
    var y = 440, h = state.stack.length > 3 ? 148 : 168;
    state.stack.forEach(function (s) {
      x.fillStyle = TINT[s.a.cat] || "#ECE6DA"; rr(x, 90, y, 900, h, 44); x.fill();
      x.textBaseline = "middle"; if (s.img) x.drawImage(s.img, 116, y + h / 2 - 46, 92, 92); else { x.font = "72px " + sans; x.fillText(s.a.e, 130, y + h / 2); }
      x.fillStyle = "#1E1B26"; x.font = "700 44px " + sans; x.fillText(fit(x, s.a.name, 560), 240, y + h / 2 - 22);
      x.fillStyle = "#4F4A57"; x.font = "500 30px " + sans; x.fillText(fit(x, s.base, 560), 240, y + h / 2 + 28);
      x.fillStyle = "#1E1B26"; x.font = "600 64px " + serif; x.textAlign = "right"; x.fillText(String(s.min), 900, y + h / 2 - 6);
      x.font = "600 26px " + sans; x.fillText("min", 955, y + h / 2 + 2); x.textAlign = "left"; x.textBaseline = "alphabetic";
      y += h + 22;
    });
    x.fillStyle = "#6FB592"; rr(x, 90, 1170, 64, 22, 11); x.fill(); x.fillStyle = "#E7D36A"; rr(x, 100, 1144, 44, 22, 11); x.fill(); x.fillStyle = "#F5F0E6"; rr(x, 110, 1118, 24, 22, 11); x.fill();
    x.fillStyle = "#F5F0E6"; x.font = "600 44px " + serif; x.fillText("Tinystack", 175, 1192);
    x.fillStyle = "#CFC8BB"; x.font = "500 30px " + sans; x.fillText("Build yours free: theusefulmedia.com/stack", 90, 1262);
    return c;
  }
  $("[data-share]").addEventListener("click", function () {
    if (!state.stack) return;
    var ready = document.fonts && document.fonts.load ? document.fonts.load("600 84px Fraunces") : Promise.resolve();
    Promise.all([ready.catch(function () {})].concat(state.stack.map(function (st) { return loadImg(icoSrc(st.a)).then(function (im) { st.img = im; }); })).concat([loadImg("/stack/i/ch-" + state.archetype[1] + ".webp").then(function (im) { cardChar = im; })])).then(function () {
      var c = drawCard();
      c.toBlob(function (blob) {
        if (!blob) { toast("Couldn't make the image. Try again."); return; }
        var file = new File([blob], "my-brain-stack.png", { type: "image/png" });
        var text = "I'm " + state.archetype[0] + ". My brain stack for tonight. Find your type:";
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "My brain stack", text: text + " " + SHARE_URL }).catch(function () {});
          return;
        }
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-brain-stack.png";
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        if (navigator.clipboard) navigator.clipboard.writeText(SHARE_URL).then(function () { toast("Image saved. Link copied too."); }, function () { toast("Image saved."); });
        else toast("Image saved.");
      }, "image/png");
    });
  });

  // ---------- Runner ----------
  var runner = $("[data-runner]"), pre = $("[data-run-pre]"), live = $("[data-run-live]"), done = $("[data-run-done]");
  var run = null, ac = null, soundOn = true, lastFocus = null, baseTitle = document.title, C = 565.49;
  function scale(box) {
    box.innerHTML = "";
    for (var i = 1; i <= 10; i++) (function (v) {
      var b = el("button", "", String(v)); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", v + " out of 10");
      b.addEventListener("click", function () { $$("button", box).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); }); box.setAttribute("data-value", v); if (box.getAttribute("data-scale") === "after") afterScore(v); });
      box.appendChild(b);
    })(i);
    box.removeAttribute("data-value");
  }
  function chime(last) {
    if (!soundOn || !ac) return;
    try {
      var t = ac.currentTime;
      (last ? [523.25, 659.25, 783.99] : [659.25, 880]).forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.18); g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 1.6);
        o.connect(g); g.connect(ac.destination); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 1.7);
      });
    } catch (e) {}
  }
  function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function openRunner() {
    if (!state.stack) return;
    lastFocus = document.activeElement;
    runner.hidden = false; pre.hidden = false; live.hidden = true; done.hidden = true;
    document.documentElement.style.overflow = "hidden";
    scale($("[data-scale='before']"));
    setTimeout(function () { $("[data-run-start]").focus(); }, 30);
  }
  function closeRunner() {
    if (run && run.timer) clearInterval(run.timer);
    ambient(null, true);
    run = null; runner.hidden = true; document.documentElement.style.overflow = ""; document.title = baseTitle;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function startItem(i) {
    run.i = i; var s = run.items[i];
    run.total = s.min * 60000; run.endAt = Date.now() + run.total; run.paused = null;
    var cd = $("[data-candle]"); cd.classList.remove("paused"); $$("g", cd).forEach(function (g) { g.style.transition = "none"; });
    cd.style.setProperty("--left", "1"); void cd.offsetWidth; $$("g", cd).forEach(function (g) { g.style.transition = ""; });
    $("[data-run-step]").textContent = (i + 1) + " of " + run.items.length;
    var re = $("[data-run-emoji]"); re.innerHTML = ""; re.appendChild(ico(s.a, "run-ico")); $("[data-run-name]").textContent = s.a.name;
    $("[data-run-next]").textContent = i + 1 < run.items.length ? "Next: " + run.items[i + 1].a.name : "Last one";
    $("[data-run-pause]").textContent = "Pause";
    tick();
  }
  function tick() {
    if (!run) return;
    var left = run.paused != null ? run.paused : run.endAt - Date.now();
    $("[data-run-left]").textContent = fmt(left);
    $("[data-candle]").style.setProperty("--left", String(Math.max(0, Math.min(1, left / run.total))));
    document.title = fmt(left) + " · " + run.items[run.i].a.name;
    if (left <= 0 && run.paused == null) next(true);
  }
  function next(auto) {
    run.spent += auto ? run.total : Math.max(0, run.total - (run.paused != null ? run.paused : run.endAt - Date.now()));
    if (run.i + 1 < run.items.length) { chime(false); startItem(run.i + 1); }
    else finish(true);
  }
  function finish(complete) {
    if (run.timer) clearInterval(run.timer);
    ambient(null, true);
    var mins = Math.round(run.spent / 60000);
    if (complete) chime(true);
    live.hidden = true; done.hidden = false; document.title = baseTitle;
    $("[data-done-title]").textContent = mins >= 1 ? mins + (mins === 1 ? " minute" : " minutes") + " offline." : "Stack ended.";
    $("[data-done-result]").textContent = "";
    scale($("[data-scale='after']"));
    $("[data-done-saved]").hidden = true;
    if (complete || mins >= 5) { state.done++; save(); recordSession(Math.max(mins, 1)); }
    run.timer = null;
  }
  function afterScore(v) {
    var b = run && run.before;
    var lastH = state.history[state.history.length - 1];
    if (lastH && run && Date.now() - lastH.t < 15 * 60000) { lastH.a = v; save(); renderShelf(); }
    var out = $("[data-done-result]");
    if (!b) out.textContent = "Logged. Next time, rate it before too and you'll see the change.";
    else if (v < b) out.textContent = "Your head went from " + b + " to " + v + ". That's the brain stack working.";
    else if (v === b) out.textContent = "Same as before: " + v + ". Some days are like that. Try another mix tomorrow.";
    else out.textContent = "Busier than before (" + b + " to " + v + "). Try a calmer mix next time.";
  }
  $("[data-run]").addEventListener("click", openRunner);
  $("[data-run-start]").addEventListener("click", function () {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) { ac = null; }
    run = { items: state.stack.slice(), i: 0, spent: 0, before: +($("[data-scale='before']").getAttribute("data-value") || 0) || null };
    pre.hidden = true; live.hidden = false;
    startItem(0);
    ambient(ambMode);
    run.timer = setInterval(tick, 250);
    $("[data-run-pause]").focus();
  });
  $("[data-run-pause]").addEventListener("click", function () {
    if (!run) return;
    if (run.paused == null) { run.paused = Math.max(0, run.endAt - Date.now()); this.textContent = "Resume"; $("[data-candle]").classList.add("paused"); ambient(null, true); }
    else { run.endAt = Date.now() + run.paused; run.paused = null; this.textContent = "Pause"; $("[data-candle]").classList.remove("paused"); ambient(ambMode); }
    tick();
  });
  $("[data-run-skip]").addEventListener("click", function () { if (run) next(false); });
  $("[data-run-end]").addEventListener("click", function () {
    if (!run) return;
    run.spent += Math.max(0, run.total - (run.paused != null ? run.paused : run.endAt - Date.now()));
    finish(false);
  });
  $("[data-run-sound]").addEventListener("click", function () {
    soundOn = !soundOn; this.setAttribute("aria-pressed", String(soundOn)); this.textContent = soundOn ? "🔔 Chime between items: on" : "🔕 Chime between items: off";
  });
  $$("[data-run-close]").forEach(function (b) { b.addEventListener("click", closeRunner); });
  document.addEventListener("keydown", function (e) {
    if (runner.hidden || e.key !== "Escape") return;
    if (!live.hidden) return; // mid-stack, End is explicit
    closeRunner();
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });


  // ---------- Type and see: plain words to a stack (rules preview of the app's AI) ----------
  var SYN = [
    [/\b(read|reading|book|books|novel)\b/, "book"], [/\bjournal(ing)?\b/, "journal"], [/\b(write|writing|story)\b/, "creative"], [/\bletters?\b/, "letter"],
    [/\b(draw|drawing|sketch|sketching|doodle)\b/, "sketching"], [/\b(paint|painting|watercolou?r)\b/, "watercolour"], [/\b(colou?r|colou?ring)\b/, "colouring"],
    [/\bknit(ting)?\b/, "knitting"], [/\bcrochet\b/, "crochet"], [/\b(sew|sewing|embroider\w*)\b/, "embroidery"], [/\blego\b/, "lego"], [/\b(origami|paper crafts?)\b/, "origami"],
    [/\b(puzzle|puzzles|jigsaw)\b/, "jigsaw"], [/\bcrosswords?\b/, "crossword"], [/\bchess\b/, "chess"], [/\bcards?\b/, "cards"],
    [/\b(piano|guitar|violin|veena|keyboard|instrument|practice music)\b/, "instrument"], [/\b(sing|singing|karaoke)\b/, "sing"], [/\b(vinyl|record|album)\b/, "vinyl"],
    [/\b(walk|walking|stroll)\b/, "walk"], [/\b(run|running|jog|jogging)\b/, "run"], [/\b(swim|swimming)\b/, "swim"], [/\b(cycle|cycling|bike|biking)\b/, "cycle"],
    [/\byoga\b/, "yoga"], [/\bstretch(ing)?\b/, "stretch"], [/\bdanc(e|ing)\b/, "dance"], [/\b(workout|gym|exercise)\b/, "workout"],
    [/\b(cook|cooking)\b/, "recipe"], [/\bbak(e|ing)\b/, "baking"], [/\btea\b/, "tea"], [/\bplants?\b/, "plants"], [/\bgarden(ing)?\b/, "garden"],
    [/\b(meditat\w*)\b/, "meditate"], [/\bbreath\w*\b/, "breathe"], [/\bbath\b/, "bath"], [/\bstars?\b/, "stars"], [/\bboard ?games?\b/, "boardgames"],
    [/\b(dog|pet|pets|cat|kid|kids|son|daughter|children)\b/, "kidspets"], [/\b(museum|library)\b/, "museum"], [/\b(photo|photos|photography|birds?|birdwatching)\b/, "birding"]
  ];
  function parseAsk(text) {
    var t = " " + text.toLowerCase().replace(/[’']/g, "") + " ", m, mins = null;
    if (/hour and a half|1\.5 ?h/.test(t)) mins = 90;
    else if (/half an? hour|half hour|30 ?min/.test(t)) mins = 30;
    else if (/quarter of an hour/.test(t)) mins = 15;
    else if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/))) mins = parseFloat(m[1]) * 60;
    else if ((m = t.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/))) mins = +m[1];
    else if (/\b(an|one) hour\b/.test(t)) mins = 60;
    else if (/\b(\d+)\b/.test(t) && +t.match(/\b(\d+)\b/)[1] >= 5 && +t.match(/\b(\d+)\b/)[1] <= 180) mins = +t.match(/\b(\d+)\b/)[1];
    var guessed = mins == null; if (guessed) mins = 30;
    mins = Math.max(5, Math.min(180, Math.round(mins / 5) * 5));
    var E = 2;
    if (/\b(tired|exhausted|sleepy|lazy|drained|low energy|wiped|wind down|before bed|bedtime|after work|cosy|cozy|chill)\b/.test(t)) E = 1;
    if (/\b(energetic|full of energy|lots of energy|high energy|pumped|restless|active|wired|hyper)\b/.test(t)) E = 3;
    var P = "any";
    if (/\b(rain|raining|rainy|cold|snow\w*|storm\w*|inside|indoors|at home|home|hot|humid|night)\b/.test(t)) P = "in";
    if (/\b(sunny|outside|outdoors|park|nice weather|beach|lovely day)\b/.test(t)) P = "out";
    var C = /\bwith (my |a |the )?(kid|kids|son|daughter|friend|friends|partner|wife|husband|family|mom|mum|dad|someone|roommate|girlfriend|boyfriend|parents|sister|brother)\b|\btogether\b|\bdate\b/.test(t) ? "social" : "solo";
    var boost = {}, named = [];
    SYN.forEach(function (pair) { if (pair[0].test(t) && !boost[pair[1]]) { boost[pair[1]] = 1; named.push(pair[1]); } });
    state.custom.forEach(function (c) { if (t.indexOf(" " + c.name.toLowerCase()) !== -1) { boost[c.id] = 1; named.push(c.id); } });
    return { T: mins, E: E, P: P, C: C, boost: boost, named: named, guessed: guessed };
  }
  var askOut = $("[data-ask-out]"), askStack = null, askSeed = 1;
  function runAsk(text) {
    text = (text || "").trim();
    if (!text) { askOut.hidden = true; return; }
    var q = parseAsk(text);
    var pool = state.picks.size >= 3 ? Array.from(state.picks).map(byId).filter(Boolean) : all().filter(function (a) { return a.cat !== "own" || q.boost[a.id]; });
    q.named.forEach(function (id) { var a = byId(id); if (a && pool.indexOf(a) === -1) pool.push(a); });
    var r = plan({ T: q.T, E: q.E, P: q.P, C: q.C, pool: pool, seed: askSeed++, boost: q.boost });
    askStack = r.stack;
    var read = $("[data-ask-read]"); read.innerHTML = "";
    [(q.guessed ? "~" : "") + q.T + " min", ENERGY_WORD[q.E] + " energy", { in: "indoors", out: "outside", any: "inside or out" }[q.P], q.C === "social" ? "with someone" : "just you"]
      .concat(q.named.slice(0, 2).map(function (id) { return "wants " + (id === "kidspets" ? "kids or pets" : byId(id).name.toLowerCase()); }))
      .concat(state.picks.size >= 3 ? ["from your picks"] : [])
      .forEach(function (x) { read.appendChild(el("span", "", x)); });
    var list = $("[data-ask-list]"); list.innerHTML = "";
    askStack.forEach(function (st) {
      var li = el("li", "c-" + st.a.cat); li.appendChild(ico(st.a));
      var mid = el("span"); mid.appendChild(el("span", "n", st.a.name)); mid.appendChild(el("span", "w", st.why)); li.appendChild(mid);
      var tm = el("span", "t", String(st.min)); tm.appendChild(el("small", "", " min")); li.appendChild(tm);
      list.appendChild(li);
    });
    askOut.hidden = false;
  }
  var askIn = $("#ask-in"), askT;
  $("[data-ask-form]").addEventListener("submit", function (e) { e.preventDefault(); runAsk(askIn.value); });
  askIn.addEventListener("input", function () { clearTimeout(askT); askT = setTimeout(function () { if (askIn.value.trim().length >= 8) runAsk(askIn.value); }, 450); });
  $$(".ask-chips button").forEach(function (b) {
    b.addEventListener("click", function () { askIn.value = b.textContent; runAsk(b.textContent); });
  });
  $("[data-ask-run]").addEventListener("click", function () {
    if (!askStack || !askStack.length) return;
    state.stack = askStack.slice();
    if (!state.archetype) {
      var cnt = {}; state.stack.forEach(function (st) { cnt[st.a.cat] = (cnt[st.a.cat] || 0) + 1; });
      state.archetype = ARCHETYPE[Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; })[0]];
    }
    openRunner();
  });


  // ---------- Shelf and streak (stored on this device only) ----------
  function dayKey(dt) { dt = dt || new Date(); return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
  function streak() {
    var days = {}; state.history.forEach(function (h) { days[h.d] = 1; });
    var dt = new Date(), n = 0;
    if (!days[dayKey(dt)]) dt.setDate(dt.getDate() - 1); // today not done yet: streak still alive from yesterday
    while (days[dayKey(dt)]) { n++; dt.setDate(dt.getDate() - 1); }
    return { n: n, today: !!days[dayKey()] };
  }
  function renderShelf() {
    var sec = $("#shelf"); if (!sec) return;
    if (!state.history.length) { sec.hidden = true; return; }
    sec.hidden = false;
    var st = streak();
    $("[data-streak]").classList.toggle("cold", st.n === 0);
    $("[data-streak-n]").textContent = st.n;
    $("[data-streak-lbl]").textContent = st.n === 1 ? "day streak" : "day streak";
    var wk = $("[data-week]"); wk.innerHTML = "";
    var now = new Date(), monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    var days = {}; state.history.forEach(function (h) { days[h.d] = 1; });
    ["M", "T", "W", "T", "F", "S", "S"].forEach(function (lbl, i) {
      var d = new Date(monday); d.setDate(monday.getDate() + i);
      var k = dayKey(d), cell = el("div", (days[k] ? "on " : "") + (k === dayKey() ? "today" : ""));
      cell.appendChild(el("i")); cell.appendChild(el("span", "", lbl)); cell.setAttribute("aria-label", d.toDateString() + (days[k] ? ": done" : ""));
      wk.appendChild(cell);
    });
    $("[data-tot-stacks]").textContent = state.history.length;
    $("[data-tot-mins]").textContent = state.history.reduce(function (p, h) { return p + h.m; }, 0).toLocaleString("en-US");
    var row = $("[data-shelf]"); row.innerHTML = "";
    state.history.slice().reverse().slice(0, 20).forEach(function (h) {
      var c = el("article", "spine");
      var when = new Date(h.t || h.d);
      c.appendChild(el("p", "when", h.d === dayKey() ? "Today" : when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })));
      var ic = el("div", "icons");
      (h.i || []).slice(0, 4).forEach(function (id) { var a = byId(id) || { id: "own", cat: "own" }; var w = el("span", "c-" + a.cat), im = new Image(); im.src = icoSrc(a); im.alt = ""; im.width = 24; im.height = 24; w.appendChild(im); ic.appendChild(w); });
      c.appendChild(ic);
      var m = el("p", "mins", String(h.m)); m.appendChild(el("small", "", " min offline")); c.appendChild(m);
      var mind = el("p", "mind");
      if (h.b && h.a) { mind.textContent = "Head: " + h.b + " → "; mind.appendChild(el("b", "", String(h.a))); } else mind.textContent = (h.i || []).length + " activities";
      c.appendChild(mind);
      row.appendChild(c);
    });
    row.scrollLeft = 0; updateArrows(row);
    $("[data-shelf-msg]").textContent = st.today ? "Done for today. Come back tomorrow to make it " + (st.n + 1) + " days." : st.n ? "Do a stack today to make it " + (st.n + 1) + " days." : "Start a new streak today.";
  }
  function recordSession(mins) {
    if (!run) return;
    state.history.push({ d: dayKey(), t: Date.now(), m: mins, i: run.items.map(function (x) { return x.a.id; }), b: run.before || null, a: null });
    if (state.history.length > 60) state.history = state.history.slice(-60);
    save(); renderShelf();
    var st = streak(), sv = $("[data-done-saved]");
    $("span", sv).textContent = "Saved to your shelf · " + st.n + (st.n === 1 ? " day streak" : " day streak");
    sv.hidden = false;
  }
  $("[data-ics]").addEventListener("click", function () {
    var t = new Date(); t.setDate(t.getDate() + 1); t.setSeconds(0, 0);
    var end = new Date(t.getTime() + 30 * 60000);
    function f(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tinystack//Waitlist//EN", "BEGIN:VEVENT", "UID:" + Date.now() + "@tinystack", "DTSTAMP:" + f(new Date()),
      "DTSTART:" + f(t), "DTEND:" + f(end), "SUMMARY:Brain stack time", "DESCRIPTION:Phone away. Build or run your stack: https://theusefulmedia.com/stack/",
      "URL:https://theusefulmedia.com/stack/", "BEGIN:VALARM", "TRIGGER:-PT0M", "ACTION:DISPLAY", "DESCRIPTION:Brain stack time", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "brain-stack-tomorrow.ics";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("Calendar reminder saved for this time tomorrow");
  });

  // ---------- Horizontal rows: arrows, mouse drag, arrow keys ----------
  function updateArrows(row) {
    var wrap = row.closest(".row-wrap"); if (!wrap) return;
    var max = row.scrollWidth - row.clientWidth - 2;
    var p = $(".prev", wrap), n = $(".next", wrap);
    if (p) p.disabled = row.scrollLeft <= 2;
    if (n) n.disabled = row.scrollLeft >= max;
  }
  $$(".row-wrap").forEach(function (wrap) {
    var row = $(".scroll-row", wrap);
    $(".prev", wrap).addEventListener("click", function () { row.scrollBy({ left: -row.clientWidth * 0.8 }); });
    $(".next", wrap).addEventListener("click", function () { row.scrollBy({ left: row.clientWidth * 0.8 }); });
    row.addEventListener("scroll", function () { updateArrows(row); }, { passive: true });
    window.addEventListener("resize", function () { updateArrows(row); });
    row.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var dir = e.key === "ArrowRight" ? 1 : -1;
      var items = $$(":scope > button, :scope > article", row);
      var cur = items.indexOf(document.activeElement);
      if (cur !== -1 && document.activeElement.tagName === "BUTTON") {
        var t = items[Math.max(0, Math.min(items.length - 1, cur + dir))];
        t.focus(); t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      } else row.scrollBy({ left: dir * 280 });
      e.preventDefault();
    });
    var down = null, moved = false;
    row.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = { x: e.clientX, left: row.scrollLeft }; moved = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - down.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; row.classList.add("dragging"); }
      if (moved) row.scrollLeft = down.left - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = null; row.classList.remove("dragging");
      if (moved) { var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); }; row.addEventListener("click", stop, { capture: true, once: true }); setTimeout(function () { row.removeEventListener("click", stop, { capture: true }); }, 50); }
    });
    updateArrows(row);
  });

  // ---------- Tooltips ----------
  var tip = $(".tip"), tipFor = null, shownAt = 0;
  function showTip(t) {
    if (tip.hidden || tipFor !== t) shownAt = Date.now();
    tipFor = t; tip.textContent = t.getAttribute("data-tip"); tip.hidden = false;
    var r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
    var top = r.bottom + 10; if (top + h > window.innerHeight - 12) top = r.top - h - 10;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  function hideTip() { tip.hidden = true; tipFor = null; }
  function bindTip(t) {
    if (t._tip) return; t._tip = 1;
    t.setAttribute("aria-describedby", "tip");
    t.addEventListener("mouseenter", function () { showTip(t); });
    t.addEventListener("mouseleave", hideTip);
    t.addEventListener("focus", function () { showTip(t); });
    t.addEventListener("blur", hideTip);
    t.addEventListener("click", function (e) { e.preventDefault(); if (tipFor === t && !tip.hidden && Date.now() - shownAt > 400) hideTip(); else showTip(t); });
  }
  $$("[data-tip]").forEach(bindTip);
  tip.id = "tip";
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
  window.addEventListener("scroll", hideTip, { passive: true });

  // ---------- Signup results (tech.js posts the email; this shows our own message) ----------
  var heroForm = $(".hero-signup form"); if (heroForm && !heroForm.getAttribute("data-medium")) heroForm.setAttribute("data-medium", "hero");
  function markJoined(email, existing) {
    $$(".signup").forEach(function (box) {
      var form = $("form", box), msg = $(".signup-msg", box);
      if (!form) return;
      form.classList.add("is-done");
      var lbl = $(".btn-label", form); if (lbl) lbl.textContent = "You're in";
      if (email) $("input[type=email]", form).value = email;
      msg.className = "signup-msg is-ok";
      msg.textContent = existing === "returning" ? "You're on the list. See you on 28 Dec." : existing ? "You're already on the list. See you on 28 Dec." : "You're on the list. 1 email on 28 Dec with the founding price. Your first Useful Life email is on its way.";
    });
  }
  document.addEventListener("signup:done", function (e) {
    if (!(e.detail && e.detail.existing)) confetti();
    state.joined = true; save();
    markJoined(e.detail && e.detail.email, e.detail && e.detail.existing);
    toast("You're on the Tinystack waitlist");
  });


  // ---------- Polish: reveals, count-ups, magnetic buttons, confetti, tap sounds ----------
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function reveals() {
    var groups = [".sec-head", ".calc-box", ".how-card", ".ai .row-wrap", ".mode", ".sci", ".note", ".plan", ".faq details", ".final > *", ".ask", ".shelf-box"];
    var els = [];
    groups.forEach(function (sel) { $$(sel).forEach(function (n, i) { n.classList.add("reveal"); n.style.setProperty("--d", i % 6); els.push(n); }); });
    if (!("IntersectionObserver" in window) || RM) { els.forEach(function (n) { n.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (n) { io.observe(n); });
  })();
  (function countUps() {
    var nums = $$("[data-count-to]"); if (!nums.length) return;
    function run(n) {
      var to = +n.getAttribute("data-count-to"), t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1100); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
    }
    if (!("IntersectionObserver" in window) || RM) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    nums.forEach(function (n) { n.textContent = "0"; io.observe(n); });
  })();
  (function magnetic() {
    if (RM || !(window.matchMedia && matchMedia("(pointer: fine)").matches)) return;
    $$(".hero .btn, .final .btn, [data-run], .ask .btn, .calc-out .btn").forEach(function (b) {
      b.classList.add("mag");
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = "translate(" + (dx * 10).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  })();
  function confetti() {
    if (RM) return;
    var cv = $("[data-confetti]"), cx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.scale(dpr, dpr);
    var cols = ["#2F6B4F", "#6FB592", "#E7D36A", "#F2DDE2", "#DEE4F2", "#1E1B26"], ps = [];
    for (var i = 0; i < 140; i++) ps.push({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * 0.55, vx: (Math.random() - .5) * 14, vy: -Math.random() * 16 - 6,
      w: 6 + Math.random() * 8, h: 8 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - .5) * 0.4, c: cols[i % cols.length], round: Math.random() < 0.3 });
    var t0 = performance.now();
    (function frame(t) {
      var k = (t - t0) / 1000; cx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(function (p) {
        p.vy += 0.42; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.globalAlpha = Math.max(0, 1 - k / 2.2); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        if (p.round) { cx.beginPath(); cx.arc(0, 0, p.w / 2, 0, 6.3); cx.fill(); } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.6);
        cx.restore();
      });
      if (k < 2.3) requestAnimationFrame(frame); else cx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }
  var tapOn = true, tapAc = null;
  try { tapOn = localStorage.getItem("tinystack-tap") !== "off"; } catch (e) {}
  function syncSnd() { var b = $("[data-snd]"); if (!b) return; b.setAttribute("aria-pressed", String(tapOn)); b.textContent = tapOn ? "🔈" : "🔇"; b.setAttribute("data-tip", tapOn ? "Soft tap sounds while you pick. Tap to turn them off." : "Tap sounds are off. Tap to turn them on."); }
  function tap(pitch) {
    if (!tapOn) return;
    try {
      tapAc = tapAc || new (window.AudioContext || window.webkitAudioContext)();
      var t = tapAc.currentTime, o = tapAc.createOscillator(), g = tapAc.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(pitch || 660, t); o.frequency.exponentialRampToValueAtTime((pitch || 660) * 1.5, t + 0.05);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(tapAc.destination); o.start(t); o.stop(t + 0.14);
    } catch (e) {}
  }
  $("[data-snd]").addEventListener("click", function () { tapOn = !tapOn; try { localStorage.setItem("tinystack-tap", tapOn ? "on" : "off"); } catch (e) {} syncSnd(); if (tapOn) tap(880); });
  syncSnd();
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".act, .chips button, .cat-row button, .swap button, .ask-chips button, .types-row button, .scale button, [data-shuffle]");
    if (!b) return;
    var on = b.getAttribute("aria-pressed");
    tap(b.classList.contains("act") ? (on === "true" ? 784 : 523) : 660);
  });

  // ---------- Start ----------
  renderTower();
  renderShelf();
  if (state.picks.size) updateCount();
  if (state.joined) markJoined(null, "returning");
})();
