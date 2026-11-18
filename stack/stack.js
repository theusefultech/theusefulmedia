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
  var WHY = { read: "Quiet focus, no screen", make: "Hands busy, head quiet", mind: "Wakes your brain up", music: "Uses your hands and ears",
    move: "Gets you moving", home: "Something real to show for it", calm: "Winds you down", people: "Time away from your own head", own: "One of your own" };

  // ---------- Storage (fails quietly in private mode) ----------
  var KEY = "tinystack-v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ a: state.answers, p: Array.from(state.picks), c: state.custom, done: state.done, joined: state.joined })); } catch (e) {}
  }
  var saved = load();
  var state = {
    answers: Object.assign({ minutes: "40", energy: "1", place: "in", company: "solo" }, saved.a || {}),
    picks: new Set(saved.p || []),
    custom: Array.isArray(saved.c) ? saved.c.filter(function (c) { return c && c.id && c.name; }).slice(0, 30) : [],
    done: saved.done || 0,
    joined: !!saved.joined,
    filter: "all", query: "", seed: 1, stack: null, archetype: null
  };
  function all() { return BUILTIN.concat(state.custom); }
  function byId(id) { return all().filter(function (a) { return a.id === id; })[0]; }
  // Drop picks that point at nothing (a custom item removed in another tab).
  state.picks.forEach(function (id) { if (!byId(id)) state.picks.delete(id); });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function minLabel(m) { m = +m; return m === 60 ? "1 hour" : m + " minutes"; }

  // ---------- Toast ----------
  var toastEl = $(".toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

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
    if (step === 3) { if (state.picks.size < 3) { go(2); return; } buildStack(); }
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
    var opts = [{ id: "all", name: "All 60" }].concat(CATS.map(function (c) { return { id: c.id, name: c.e + " " + c.name }; }));
    if (state.custom.length) opts.push({ id: "own", name: "⭐ Your own (" + state.custom.length + ")" });
    if (state.picks.size) opts.push({ id: "picked", name: "✓ Picked (" + state.picks.size + ")" });
    if (!opts.some(function (o) { return o.id === state.filter; })) state.filter = "all";
    catRow.innerHTML = "";
    opts.forEach(function (o) {
      var b = el("button", "", o.name);
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
      b.appendChild(el("span", "e", a.e)); b.appendChild(el("span", "n", a.name)); b.appendChild(el("span", "m", meta(a)));
      b.addEventListener("click", function () {
        if (state.picks.has(a.id)) state.picks.delete(a.id); else state.picks.add(a.id);
        b.setAttribute("aria-pressed", String(state.picks.has(a.id)));
        save(); updateCount();
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
    nextBtn.firstChild.textContent = n < 3 ? "Pick " + (3 - n) + " more " : "Build my stack ";
    var pickedTab = $$("button", catRow).filter(function (b) { return b.textContent.indexOf("✓ Picked") === 0; })[0];
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

  // ---------- Step 3: build the stack (same rules engine as the app's fallback) ----------
  function rnd(seed, s) { var h = 2166136261 ^ seed; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  function buildStack() {
    var T = +state.answers.minutes, E = +state.answers.energy, P = state.answers.place, C = state.answers.company;
    var pool = Array.from(state.picks).map(byId).filter(Boolean);
    var n = T <= 20 ? 2 : T <= 60 ? 3 : 4;
    n = Math.min(n, pool.length);
    var scored = pool.map(function (a) {
      var s = 3 + rnd(state.seed, a.id) * 1.6, hard = false;
      var d = a.energy - E;
      if (d > 0) s -= 2 * d; else if (d === 0) s += 1; else s -= 0.4 * -d;
      if (P === "in" && a.place === "out") { s -= 6; hard = true; }
      if (P === "out") s += a.place === "out" ? 2 : a.place === "in" ? -1.5 : 0;
      if (C === "solo" && a.company === "social") { s -= 6; hard = true; }
      if (C === "social") s += a.company === "solo" ? -1 : 1.5;
      if (a.min >= 2 * T) s -= 1.5;
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
    var units = T / 5, w = chosen.map(function (x) { return x.a.min; }), sum = w.reduce(function (p, c) { return p + c; }, 0);
    var alloc = w.map(function (v) { return Math.max(1, Math.floor(units * v / sum)); });
    var left = units - alloc.reduce(function (p, c) { return p + c; }, 0);
    var order = w.map(function (v, i) { return { i: i, f: units * v / sum - Math.floor(units * v / sum) }; }).sort(function (x, y) { return y.f - x.f; });
    for (var k = 0; left > 0; k++, left--) alloc[order[k % order.length].i]++;
    while (left < 0) { var big = alloc.indexOf(Math.max.apply(null, alloc)); if (alloc[big] <= 1) break; alloc[big]--; left++; }

    state.stack = chosen.map(function (x, i) {
      var why = WHY[x.a.cat];
      if (i === 0 && chosen.length > 1) why = x.a.energy === 1 ? "Easy start, no setup" : "Starts you off with energy";
      else if (i === chosen.length - 1 && chosen.length > 1 && (x.a.cat === "calm" || x.a.cat === "read")) why = "Ends on a quiet note";
      var base = why;
      if (alloc[i] * 5 < x.a.min * 0.6) why += " · shorter than usual";
      return { a: x.a, min: alloc[i] * 5, why: why, base: base };
    });

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
    $("[data-archetype]").textContent = "Your brain stack · " + state.archetype[0];
    $("[data-title]").textContent = minLabel(T) + ", " + ENERGY_WORD[E] + " energy";
    var list = $("[data-stacklist]"); list.innerHTML = "";
    state.stack.forEach(function (s) {
      var li = el("li", "c-" + s.a.cat);
      li.appendChild(el("span", "e", s.a.e));
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
      if (state.stack.map(function (s) { return s.a.id + s.min; }).join() !== before) return;
    }
    toast("That's the best mix for your picks. Add more picks for variety.");
  });

  // ---------- Share card (1080 x 1350 image) ----------
  var SHARE_URL = "https://theusefulmedia.com/stack/?utm_campaign=tinystack-share";
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  var TINT = { read: "#DCE8DF", make: "#F2DDE2", mind: "#DEE4F2", music: "#E9DFF3", move: "#D9EEEE", home: "#F2E8C6", calm: "#E1E8F3", people: "#E8E1D3", own: "#ECE6DA" };
  function fit(ctx, text, max) { if (ctx.measureText(text).width <= max) return text; while (text.length > 1 && ctx.measureText(text + "…").width > max) text = text.slice(0, -1); return text + "…"; }
  function drawCard() {
    var c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
    var x = c.getContext("2d"), serif = "Fraunces, Georgia, serif", sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
    x.fillStyle = "#1E1B26"; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = "#E7D36A"; x.font = "700 30px " + sans; x.fillText(("Your brain stack · " + state.archetype[0]).toUpperCase(), 90, 150);
    x.fillStyle = "#F5F0E6"; x.font = "600 84px " + serif; x.fillText(fit(x, minLabel(state.answers.minutes) + ",", 900), 90, 260);
    x.fillText(ENERGY_WORD[state.answers.energy] + " energy", 90, 355);
    var y = 430, h = state.stack.length > 3 ? 150 : 170;
    state.stack.forEach(function (s) {
      x.fillStyle = TINT[s.a.cat] || "#ECE6DA"; rr(x, 90, y, 900, h, 44); x.fill();
      x.font = "72px " + sans; x.textBaseline = "middle"; x.fillText(s.a.e, 130, y + h / 2);
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
    ready.catch(function () {}).then(function () {
      var c = drawCard();
      c.toBlob(function (blob) {
        if (!blob) { toast("Couldn't make the image. Try again."); return; }
        var file = new File([blob], "my-brain-stack.png", { type: "image/png" });
        var text = "My brain stack for tonight. Build yours free:";
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
    run = null; runner.hidden = true; document.documentElement.style.overflow = ""; document.title = baseTitle;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function startItem(i) {
    run.i = i; var s = run.items[i];
    run.total = s.min * 60000; run.endAt = Date.now() + run.total; run.paused = null;
    $("[data-run-step]").textContent = (i + 1) + " of " + run.items.length;
    $("[data-run-emoji]").textContent = s.a.e; $("[data-run-name]").textContent = s.a.name;
    $("[data-run-next]").textContent = i + 1 < run.items.length ? "Next: " + run.items[i + 1].a.name : "Last one";
    $("[data-run-pause]").textContent = "Pause";
    tick();
  }
  function tick() {
    if (!run) return;
    var left = run.paused != null ? run.paused : run.endAt - Date.now();
    $("[data-run-left]").textContent = fmt(left);
    $("[data-run-bar]").style.strokeDashoffset = String(C * (1 - Math.max(0, left) / run.total));
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
    var mins = Math.round(run.spent / 60000);
    if (complete) chime(true);
    live.hidden = true; done.hidden = false; document.title = baseTitle;
    $("[data-done-title]").textContent = mins >= 1 ? mins + (mins === 1 ? " minute" : " minutes") + " offline." : "Stack ended.";
    $("[data-done-result]").textContent = "";
    scale($("[data-scale='after']"));
    if (complete || mins >= 5) { state.done++; save(); }
    run.timer = null;
  }
  function afterScore(v) {
    var b = run && run.before;
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
    run.timer = setInterval(tick, 250);
    $("[data-run-pause]").focus();
  });
  $("[data-run-pause]").addEventListener("click", function () {
    if (!run) return;
    if (run.paused == null) { run.paused = Math.max(0, run.endAt - Date.now()); this.textContent = "Resume"; }
    else { run.endAt = Date.now() + run.paused; run.paused = null; this.textContent = "Pause"; }
    tick();
  });
  $("[data-run-skip]").addEventListener("click", function () { if (run) next(false); });
  $("[data-run-end]").addEventListener("click", function () {
    if (!run) return;
    run.spent += Math.max(0, run.total - (run.paused != null ? run.paused : run.endAt - Date.now()));
    finish(false);
  });
  $("[data-run-sound]").addEventListener("click", function () {
    soundOn = !soundOn; this.setAttribute("aria-pressed", String(soundOn)); this.textContent = soundOn ? "🔔 Chime on" : "🔕 Chime off";
  });
  $$("[data-run-close]").forEach(function (b) { b.addEventListener("click", closeRunner); });
  document.addEventListener("keydown", function (e) {
    if (runner.hidden || e.key !== "Escape") return;
    if (!live.hidden) return; // mid-stack, End is explicit
    closeRunner();
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });

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
  $$("[data-tip]").forEach(function (t) {
    t.setAttribute("aria-describedby", "tip");
    t.addEventListener("mouseenter", function () { showTip(t); });
    t.addEventListener("mouseleave", hideTip);
    t.addEventListener("focus", function () { showTip(t); });
    t.addEventListener("blur", hideTip);
    t.addEventListener("click", function (e) { e.preventDefault(); if (tipFor === t && !tip.hidden && Date.now() - shownAt > 400) hideTip(); else showTip(t); });
  });
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
    state.joined = true; save();
    markJoined(e.detail && e.detail.email, e.detail && e.detail.existing);
    toast("You're on the Tinystack waitlist");
  });

  // ---------- Start ----------
  if (state.picks.size) updateCount();
  if (state.joined) markJoined(null, "returning");
})();
