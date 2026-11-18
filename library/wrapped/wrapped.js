/* Your 2026 in Books (Reading Wrapped) for The Useful Library (Raja, 18 Nov 2026, "4").
   Readers add the books they read this year (search, or a Goodreads or StoryGraph export), get a story of their reading year,
   and save or share the cards. Everything runs in the browser: the list stays on this device (localStorage lib:wrap:2026),
   only book searches go to Open Library. No Claude usage, no server. */
(function () {
  "use strict";
  var YEAR = 2026, KEY = "lib:wrap:" + YEAR, SITE = "https://theusefulmedia.com", PAGE = "/library/wrapped/";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_L = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var root = $("[data-wrap]"); if (!root) return;

  /* ---------- what a book is about: Open Library subjects to 12 shelves (the first 4 are the Library's own areas) ---------- */
  var AREAS = [
    ["habits", "Habits and discipline", /\bhabit|discipline|self-control|willpower|routine/],
    ["focus", "Focus and productivity", /productiv|time management|attention|focus|distract|getting things done|efficien/],
    ["money", "Money and wealth", /\bmoney|finance|wealth|invest|economics|saving|budget|rich\b|retire/],
    ["mindset", "Mindset and emotions", /self-help|self-actualization|happiness|emotion|mindful|stoic|meditation|motivation|success|conduct of life|resilien|self-realization|positive psychology/],
    ["mind", "Psychology and the brain", /psychology|neuroscience|brain|cognit|behavior|decision making/],
    ["biz", "Business and work", /business|management|leadership|entrepreneur|marketing|startup|career|negotiat|organizational/],
    ["hist", "History", /history|historical|war\b|ancient|civilization|empire/],
    ["sci", "Science and nature", /science|physics|biology|evolution|nature|astronomy|cosmolog|chemistry|mathemat|ecology|climate|animals/],
    ["life", "Lives and memoirs", /biography|autobiography|memoir|biographies/],
    ["phil", "Philosophy and ideas", /philosophy|ethics|religion|spiritual|theology/],
    ["health", "Health and body", /health|nutrition|diet|fitness|exercise|sleep|medicine|longevity|wellness/],
    ["story", "Fiction", /\bfiction|novel|fantasy|mystery|thriller|romance|literature|stories|science fiction/]
  ];
  var AREA = {}; AREAS.forEach(function (a) { AREA[a[0]] = a[1]; });
  function areasOf(subjects) {
    var s = (subjects || []).slice(0, 40).join(" | ").toLowerCase(), hit = [];
    AREAS.forEach(function (a) { if (a[2].test(s)) hit.push(a[0]); });
    // "Fiction" only wins when it isn't just 1 tag among many nonfiction ones
    if (hit.indexOf("story") >= 0 && hit.length > 2 && !/\bnovel|fantasy|thriller|romance|fiction, /.test(s)) hit.splice(hit.indexOf("story"), 1);
    return hit.slice(0, 3);
  }
  // the Library's own book pages, for the "next year" shelf
  var NEXT = {
    habits: [["atomic-habits", "Atomic Habits"], ["tiny-habits", "Tiny Habits"], ["the-power-of-habit", "The Power of Habit"]],
    focus: [["deep-work", "Deep Work"], ["indistractable", "Indistractable"], ["the-one-thing", "The One Thing"], ["four-thousand-weeks", "Four Thousand Weeks"]],
    money: [["the-psychology-of-money", "The Psychology of Money"], ["your-money-or-your-life", "Your Money or Your Life"], ["the-millionaire-next-door", "The Millionaire Next Door"]],
    mindset: [["the-courage-to-be-disliked", "The Courage to Be Disliked"], ["meditations", "Meditations"], ["the-obstacle-is-the-way", "The Obstacle Is the Way"], ["mans-search-for-meaning", "Man's Search for Meaning"]],
    mind: [["the-willpower-instinct", "The Willpower Instinct"], ["the-craving-mind", "The Craving Mind"]],
    biz: [["the-7-habits-of-highly-effective-people", "The 7 Habits of Highly Effective People"], ["essentialism", "Essentialism"]],
    phil: [["meditations", "Meditations"], ["four-thousand-weeks", "Four Thousand Weeks"]]
  };

  /* ---------- storage ---------- */
  var S = load();
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.books) return v; } catch (e) {} return { name: "", books: [] }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var uid = function () { return Math.random().toString(36).slice(2, 9); };
  var coverUrl = function (b, size) { return b.c ? "https://covers.openlibrary.org/b/id/" + b.c + "-" + (size || "M") + ".jpg" : b.ib ? "https://covers.openlibrary.org/b/isbn/" + b.ib + "-" + (size || "M") + ".jpg?default=false" : ""; };
  var hue = function (t) { var h = 0; String(t).split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; };
  var spine = function (b, cls) { return '<span class="wr-cv ' + (cls || "") + '" style="--h:' + hue(b.t) + '">' + (coverUrl(b) ? '<img src="' + esc(coverUrl(b)) + '" alt="" loading="lazy" decoding="async" crossorigin="anonymous" onerror="this.remove()">' : "") + '<i>' + esc(b.t) + "</i></span>"; };

  /* ---------- Open Library ---------- */
  var OL = "https://openlibrary.org/search.json";
  var FIELDS = "key,title,author_name,cover_i,number_of_pages_median,subject,first_publish_year";
  function olSearch(q, limit, tries) {
    tries = tries == null ? 1 : tries;
    return olOnce(q, limit).catch(function (e) { if (tries <= 0) throw e; return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return olSearch(q, limit, tries - 1); }); });
  }
  function olOnce(q, limit) {
    return fetch(OL + "?q=" + encodeURIComponent(q) + "&limit=" + (limit || 8) + "&fields=" + FIELDS + "&lang=en").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { return (j.docs || []).map(fromDoc); });
  }
  function fromDoc(d) { return { k: (d.key || "").replace("/works/", ""), t: d.title || "", a: (d.author_name || [])[0] || "", c: d.cover_i || 0, p: d.number_of_pages_median || 0, y: d.first_publish_year || 0, s: areasOf(d.subject) }; }

  /* ---------- the builder ---------- */
  var list = $("[data-wr-list]"), countEl = $("[data-wr-count]"), go = $("[data-wr-go]"), empty = $("[data-wr-empty]"), nameI = $("[data-wr-name]");
  nameI.value = S.name || "";
  nameI.addEventListener("input", function () { S.name = nameI.value.trim().slice(0, 24); save(); });
  function paint() {
    var n = S.books.length;
    countEl.textContent = n ? n + (n === 1 ? " book" : " books") + " · " + pages(S.books).toLocaleString("en-US") + " pages" : "No books yet";
    empty.hidden = n > 0; go.disabled = n < 3;
    $("[data-wr-need]").textContent = n < 3 ? "Add " + (3 - n) + " more to make your story" : "Ready when you are";
    list.innerHTML = S.books.map(function (b, i) {
      return '<li class="wr-row" data-id="' + b.id + '">' + spine(b, "sm")
        + '<div class="wr-rt"><b>' + esc(b.t) + "</b><small>" + esc([b.a, b.p ? b.p + " pages" : ""].filter(Boolean).join(" · ")) + "</small>"
        + '<div class="wr-ctl"><span class="wr-stars" role="radiogroup" aria-label="Your rating for ' + esc(b.t) + '">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" role="radio" aria-checked="' + (b.r === k) + '" aria-label="' + k + ' star' + (k > 1 ? "s" : "") + '" data-r="' + k + '" class="' + (b.r >= k ? "on" : "") + '">★</button>'; }).join("") + "</span>"
        + '<label class="wr-mo"><span class="vh">Month you finished ' + esc(b.t) + '</span><select data-m><option value="0">Month?</option>' + MONTHS.map(function (m, k) { return '<option value="' + (k + 1) + '"' + (b.m === k + 1 ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select></label>"
        + '<button type="button" class="wr-boty' + (b.b ? " on" : "") + '" data-b aria-pressed="' + !!b.b + '" title="My book of the year">' + (b.b ? "Book of the year" : "Book of the year?") + "</button>"
        + (b.p ? "" : '<label class="wr-pg"><span class="vh">Pages</span><input type="number" min="20" max="3000" inputmode="numeric" placeholder="Pages?" data-p></label>')
        + "</div></div>"
        + '<button type="button" class="wr-x" data-x aria-label="Remove ' + esc(b.t) + '">×</button></li>';
    }).join("");
    $$(".wr-row", list).forEach(function (row) {
      var b = find(row.dataset.id);
      $$("[data-r]", row).forEach(function (s) { s.addEventListener("click", function () { var r = +s.dataset.r; b.r = b.r === r ? 0 : r; save(); paint(); }); });
      $("[data-m]", row).addEventListener("change", function (e) { b.m = +e.target.value || 0; save(); });
      $("[data-b]", row).addEventListener("click", function () { var on = !b.b; S.books.forEach(function (x) { x.b = false; }); b.b = on; save(); paint(); });
      var pi = $("[data-p]", row); if (pi) pi.addEventListener("change", function () { var v = Math.round(+pi.value); if (v >= 20 && v <= 3000) { b.p = v; save(); paint(); } });
      $("[data-x]", row).addEventListener("click", function () { S.books = S.books.filter(function (x) { return x !== b; }); save(); paint(); });
    });
  }
  function find(id) { return S.books.filter(function (b) { return b.id === id; })[0]; }
  function has(b) { return S.books.some(function (x) { return (b.k && x.k === b.k) || norm(x.t) === norm(b.t); }); }
  var norm = function (t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" (")[0]; };
  function add(b, quiet) {
    if (has(b)) { if (!quiet) note(esc(b.t) + " is already on your list."); return false; }
    if (S.books.length >= 300) { note("That's 300 books. Wow. That's the most this page can hold."); return false; }
    b.id = uid(); S.books.unshift(b); save(); if (!quiet) { paint(); note("Added <b>" + esc(b.t) + "</b>."); }
    return true;
  }
  var noteT; function note(h) { var n = $("[data-wr-note]"); n.innerHTML = h; n.classList.add("on"); clearTimeout(noteT); noteT = setTimeout(function () { n.classList.remove("on"); }, 3200); }

  // search box with results under it
  var q = $("[data-wr-q]"), res = $("[data-wr-res]"), tm, seq = 0, hits = [];
  q.addEventListener("input", function () { clearTimeout(tm); var v = q.value.trim(); if (v.length < 3) { res.hidden = true; return; } tm = setTimeout(function () { search(v); }, 320); });
  q.addEventListener("keydown", function (e) {
    var items = $$("[data-hit]", res), at = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown" && items.length) { e.preventDefault(); items[0].focus(); }
    if (e.key === "Enter" && items.length) { e.preventDefault(); items[0].click(); }
    if (e.key === "Escape") res.hidden = true;
  });
  res.addEventListener("keydown", function (e) {
    var items = $$("[data-hit]", res), at = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (items[at + 1] || items[at]).focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); (at > 0 ? items[at - 1] : q).focus(); }
    if (e.key === "Escape") { res.hidden = true; q.focus(); }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-wr-find]")) res.hidden = true; });
  function search(v) {
    var my = ++seq; res.hidden = false; res.innerHTML = '<p class="wr-wait">Looking in Open Library…</p>';
    olSearch(v, 8).then(function (docs) {
      if (my !== seq) return;
      hits = docs.filter(function (d) { return d.t; });
      if (!hits.length) { res.innerHTML = '<p class="wr-wait">Nothing found. Try the title plus the author\'s last name.</p><button type="button" class="wr-hit" data-hit="-1"><span class="wr-cv sm" style="--h:' + hue(v) + '"><i>' + esc(v) + "</i></span><span><b>Add \"" + esc(v) + '" anyway</b><small>You can type its pages after</small></span></button>'; }
      else res.innerHTML = hits.map(function (d, i) { return '<button type="button" class="wr-hit" data-hit="' + i + '">' + spine(d, "sm") + "<span><b>" + esc(d.t) + "</b><small>" + esc([d.a, d.y, d.p ? d.p + " pages" : ""].filter(Boolean).join(" · ")) + "</small></span>" + (has(d) ? '<em>On your list</em>' : "") + "</button>"; }).join("");
      $$("[data-hit]", res).forEach(function (h) { h.addEventListener("click", function () { var i = +h.dataset.hit; var b = i < 0 ? { k: "", t: v, a: "", c: 0, p: 0, y: 0, s: [] } : hits[i]; if (add(Object.assign({ r: 0, m: 0, b: false }, b))) { q.value = ""; res.hidden = true; q.focus(); } }); });
    }).catch(function () { if (my === seq) res.innerHTML = '<p class="wr-wait">We couldn\'t reach Open Library. Check your connection and try again.</p>'; });
  }

  /* ---------- imports: Goodreads and StoryGraph exports (read here, never uploaded) ---------- */
  function csv(text) {
    var rows = [], row = [], f = "", i = 0, qd = false, c;
    for (; i < text.length; i++) {
      c = text[i];
      if (qd) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else qd = false; } else f += c; }
      else if (c === '"') qd = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    var h = (rows.shift() || []).map(function (x) { return x.trim(); });
    return rows.filter(function (r) { return r.length > 1; }).map(function (r) { var o = {}; h.forEach(function (k, j) { o[k] = (r[j] || "").trim(); }); return o; });
  }
  var yr = function (d) { var m = String(d || "").match(/(\d{4})[\/\-](\d{1,2})/); return m ? { y: +m[1], m: +m[2] } : null; };
  function readExport(rows) {
    var out = [], kind = "";
    if (rows.length && "Exclusive Shelf" in rows[0]) { kind = "Goodreads";
      rows.forEach(function (r) { if (r["Exclusive Shelf"] !== "read") return; var d = yr(r["Date Read"]) || null, d2 = yr(r["Date Added"]); var when = d || d2; if (!when || when.y !== YEAR) return;
        out.push({ k: "", t: r.Title.replace(/\s*\([^)]*#\d+[^)]*\)\s*$/, ""), a: r.Author, c: 0, p: +r["Number of Pages"] || 0, y: +r["Original Publication Year"] || +r["Year Published"] || 0, s: [], r: +r["My Rating"] || 0, m: d ? d.m : 0, b: false, isbn: (r.ISBN13 || r.ISBN || "").replace(/[^0-9X]/g, "") }); });
    } else if (rows.length && "Read Status" in rows[0]) { kind = "StoryGraph";
      rows.forEach(function (r) { if (r["Read Status"] !== "read") return; var d = yr(r["Last Date Read"]) || yr((r["Dates Read"] || "").split("-").pop()); if (!d || d.y !== YEAR) return;
        out.push({ k: "", t: r.Title, a: (r.Authors || "").split(",")[0], c: 0, p: 0, y: 0, s: [], r: Math.round(+r["Star Rating"] || 0), m: d.m, b: false, isbn: (r["ISBN/UID"] || "").replace(/[^0-9X]/g, "") }); });
    }
    return { kind: kind, books: out };
  }
  // fill in covers, pages and topics from Open Library, 2 at a time (Open Library turns busy callers away)
  function enrich(books, done) {
    var i = 0, live = 0, total = books.length, finished = 0;
    function next() {
      while (live < 2 && i < books.length) {
        (function (b) { live++;
          var qy = b.isbn && b.isbn.length >= 10 ? "isbn:" + b.isbn : "title:\"" + b.t + "\"" + (b.a ? " author:\"" + b.a.split(" ").pop() + "\"" : "");
          olSearch(qy, 1).catch(function () { return []; }).then(function (d) {
            if (!d.length && b.isbn) return olSearch(b.t + " " + (b.a || ""), 1).catch(function () { return []; });
            return d;
          }).then(function (d) { var x = d[0]; if (x) { b.k = x.k; b.c = x.c; b.p = b.p || x.p; b.y = b.y || x.y; b.s = x.s; }
            if (!b.c && b.isbn && b.isbn.length >= 10) b.ib = b.isbn; delete b.isbn; live--; finished++; done(finished, total); next(); });
        })(books[i++]);
      }
    }
    next();
  }
  $("[data-wr-file]").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = "";
    var st = $("[data-wr-imp]");
    f.text().then(function (t) {
      var got = readExport(csv(t));
      if (!got.kind) { st.textContent = "That file isn't a Goodreads or StoryGraph export. Check the steps above and try again."; return; }
      var fresh = got.books.filter(function (b) { return !has(b); });
      if (!got.books.length) { st.textContent = "We read your " + got.kind + " file, but it has no books marked read in " + YEAR + "."; return; }
      if (!fresh.length) { st.textContent = "All " + got.books.length + " of your " + YEAR + " books from " + got.kind + " are already on your list."; return; }
      st.textContent = "Found " + fresh.length + " books you read in " + YEAR + ". Getting covers and topics… 0 of " + fresh.length;
      enrich(fresh, function (n, tot) {
        st.textContent = "Found " + tot + " books you read in " + YEAR + ". Getting covers and topics… " + n + " of " + tot;
        if (n === tot) { fresh.reverse().forEach(function (b) { add(b, true); }); paint(); st.textContent = "Added " + tot + " books from " + got.kind + ". Check the pages and months below, then make your story."; }
      });
    }).catch(function () { st.textContent = "We couldn't read that file. Try again."; });
  });
  $$("[data-wr-tab]").forEach(function (b) { b.addEventListener("click", function () { $$("[data-wr-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === b); }); $$("[data-wr-pane]").forEach(function (p) { p.hidden = p.dataset.wrPane !== b.dataset.wrTab; }); }); });
  $("[data-wr-clear]").addEventListener("click", function () { if (!S.books.length) return; var keep = S.books.slice(); S.books = []; save(); paint(); note('List cleared. <button type="button" class="wr-undo">Undo</button>'); $(".wr-undo").addEventListener("click", function () { S.books = keep; save(); paint(); note("Back again."); }); });

  /* ---------- the numbers behind the story ---------- */
  function pages(bs) { return bs.reduce(function (n, b) { return n + (b.p || 0); }, 0); }
  function stats(bs, name) {
    var n = bs.length, withP = bs.filter(function (b) { return b.p; }), P = pages(bs), avg = withP.length ? Math.round(P / withP.length) : 0;
    var byP = withP.slice().sort(function (a, b) { return b.p - a.p; });
    var mo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; bs.forEach(function (b) { if (b.m) mo[b.m - 1]++; });
    var dated = mo.reduce(function (a, b) { return a + b; }, 0), best = mo.indexOf(Math.max.apply(null, mo));
    var ac = {}; bs.forEach(function (b) { (b.s || []).forEach(function (s) { ac[s] = (ac[s] || 0) + 1; }); });
    var areas = Object.keys(ac).map(function (k) { return { k: k, n: ac[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var tagged = bs.filter(function (b) { return (b.s || []).length; }).length;
    var rated = bs.filter(function (b) { return b.r; }), fives = bs.filter(function (b) { return b.r === 5; });
    var boty = bs.filter(function (b) { return b.b; })[0] || rated.slice().sort(function (a, b) { return b.r - a.r || (b.p || 0) - (a.p || 0); })[0] || byP[0] || bs[0];
    var yrs = bs.filter(function (b) { return b.y > 1000; }), oldest = yrs.slice().sort(function (a, b) { return a.y - b.y; })[0];
    var avgY = yrs.length ? Math.round(yrs.reduce(function (s, b) { return s + b.y; }, 0) / yrs.length) : 0;
    var story = (ac.story || 0) / Math.max(1, tagged);
    // reader type: the first rule that fits
    var top = areas[0], type;
    if (story >= .6) type = ["The Story Chaser", "Most of your year was spent inside other worlds. Fiction is how you think."];
    else if (n >= 40) type = ["The Marathoner", "You read like other people scroll. " + n + " books is about 1 every " + Math.max(1, Math.round(365 / n)) + " days."];
    else if (avg >= 380 && withP.length >= 3) type = ["The Deep Diver", "You pick the big ones. An average of " + avg + " pages a book means you stay for the whole argument."];
    else if (top && tagged >= 4 && top.n / tagged >= .5) type = ["The Specialist", "You went deep on 1 thing: " + AREA[top.k].toLowerCase() + ". " + Math.round(top.n / tagged * 100) + "% of your books touched it."];
    else if (areas.length >= 5) type = ["The Explorer", "You wandered across " + areas.length + " different shelves this year. Range is your edge."];
    else if (avgY && avgY < 1960) type = ["The Classicist", "Your books are, on average, from " + avgY + ". You read what has already survived."];
    else if (avgY >= 2019 && yrs.length >= 3) type = ["The Trend Reader", "You read what's new. Your average book came out in " + avgY + "."];
    else type = ["The Steady Reader", n + " books, 1 at a time. Most people don't finish 1 a year. You did " + n + "."];
    var stack = Math.round(P * 0.0075 * 10) / 10; // a page is about 0.075 mm, so cm = pages * 0.0075
    return { name: name, n: n, P: P, avg: avg, longest: byP[0], shortest: byP.length > 1 ? byP[byP.length - 1] : null, mo: mo, dated: dated, best: best, areas: areas, tagged: tagged,
      fives: fives, rated: rated.length, boty: boty, oldest: oldest, type: type, stack: stack, hours: Math.round(P / 40) };
  }
  var compare = function (cm) { // what the stack of pages is as tall as
    var L = [[30, "a cat"], [75, "a kitchen table"], [100, "a 5 year old"], [170, "an adult"], [230, "a door"], [450, "a giraffe"], [800, "a 2-storey house"]];
    for (var i = L.length - 1; i >= 0; i--) if (cm >= L[i][0]) return L[i][1];
    return "";
  };

  /* ---------- the story player ---------- */
  var dlg = $("[data-wr-story]"), stage = $("[data-wr-stage]"), bars = $("[data-wr-bars]"), foot = $("[data-wr-foot]");
  var slides = [], at = 0, timer = 0, paused = false, ST = null, SHARED = false;
  var DUR = 6500;
  function build(st) {
    var L = [], who = st.name ? esc(st.name) + "'s" : SHARED ? "A friend's" : "Your";
    var fan = st.bs.filter(function (b) { return coverUrl(b); }).slice(0, 7);
    L.push({ k: "intro", h: '<p class="wr-k">' + who + " " + YEAR + " in books</p><h2 class=\"wr-big\"><span data-count=\"" + st.n + '">0</span></h2><p class="wr-l">' + (st.n === 1 ? "book" : "books") + " finished. Let's look back.</p>"
      + '<div class="wr-fan">' + fan.map(function (b, i) { return '<span style="--i:' + i + ";--n:" + fan.length + '">' + spine(b) + "</span>"; }).join("") + "</div>" });
    if (st.P) L.push({ k: "pages", h: '<p class="wr-k">Pages turned</p><h2 class="wr-big"><span data-count="' + st.P + '">0</span></h2>'
      + '<div class="wr-stack" style="--hgt:' + Math.min(100, Math.max(18, st.stack / 2)) + '%"><i></i><i></i><i></i><i></i><i></i></div>'
      + '<p class="wr-l">Stacked up, that\'s ' + st.stack + " cm of paper" + (compare(st.stack) ? ", about as tall as " + compare(st.stack) : "") + ". Around " + st.hours + " hours of reading.</p>" });
    if (st.longest && st.longest.p) L.push({ k: "long", h: '<p class="wr-k">The big one</p><div class="wr-hero">' + spine(st.longest, "lg") + '</div><h3 class="wr-t">' + esc(st.longest.t) + '</h3><p class="wr-l">' + st.longest.p.toLocaleString("en-US") + " pages, your longest of the year."
      + (st.shortest && st.shortest.p < st.longest.p ? " Your shortest was " + esc(st.shortest.t) + " at " + st.shortest.p + "." : "") + "</p>" });
    if (st.dated >= 3) { var mx = Math.max.apply(null, st.mo);
      L.push({ k: "months", h: '<p class="wr-k">Your reading year</p><h3 class="wr-t">' + MONTHS_L[st.best] + " was your month.</h3>"
        + '<div class="wr-bars2">' + st.mo.map(function (v, i) { return '<span style="--v:' + (mx ? v / mx : 0) + ";--i:" + i + '"' + (i === st.best ? ' class="top"' : "") + "><b>" + (v || "") + "</b><i></i><small>" + MONTHS[i].charAt(0) + "</small></span>"; }).join("") + "</div>"
        + '<p class="wr-l">' + st.mo[st.best] + " books finished in " + MONTHS_L[st.best] + ".</p>" }); }
    if (st.areas.length && st.tagged >= 2) { var a3 = st.areas.slice(0, 4), mxA = a3[0].n;
      L.push({ k: "areas", h: '<p class="wr-k">What you read about</p><h3 class="wr-t">' + esc(AREA[a3[0].k]) + " led the way.</h3>"
        + '<ol class="wr-areas">' + a3.map(function (a, i) { return '<li style="--v:' + a.n / mxA + ";--i:" + i + '"><span>' + esc(AREA[a.k]) + "</span><b>" + a.n + "</b><i></i></li>"; }).join("") + "</ol>"
        + '<p class="wr-l">From ' + st.tagged + " books we could match to a shelf.</p>" }); }
    L.push({ k: "type", h: '<p class="wr-k">Your reader type</p><div class="wr-seal" aria-hidden="true">' + seal(st.type[0]) + '</div><h2 class="wr-t big">' + esc(st.type[0]) + '</h2><p class="wr-l">' + esc(st.type[1]) + "</p>" });
    if (st.boty) L.push({ k: "boty", h: '<p class="wr-k">' + (st.boty.b ? "Your book of the year" : st.boty.r ? "Your top-rated book" : "A book to remember") + '</p><div class="wr-hero glow">' + spine(st.boty, "lg") + '</div><h3 class="wr-t">' + esc(st.boty.t) + "</h3>"
      + '<p class="wr-l">' + esc(st.boty.a || "") + (st.fives.length > 1 ? (st.boty.a ? ". " : "") + st.fives.length + " books got 5 stars from you this year." : "") + "</p>" });
    L.push({ k: "sum", sum: true, h: summaryHtml(st) });
    return L;
  }
  function summaryHtml(st) {
    var grid = st.bs.slice(0, 12);
    return '<p class="wr-k">' + (st.name ? esc(st.name) + "'s " : "My ") + YEAR + " in books</p>"
      + '<div class="wr-grid g' + Math.min(12, grid.length) + '">' + grid.map(function (b) { return spine(b, "xs"); }).join("") + "</div>"
      + '<dl class="wr-sum"><div><dt>Books</dt><dd>' + st.n + "</dd></div><div><dt>Pages</dt><dd>" + st.P.toLocaleString("en-US") + "</dd></div>"
      + '<div class="w"><dt>Reader type</dt><dd>' + esc(st.type[0].replace(/^The /, "")) + "</dd></div>"
      + (st.areas.length ? '<div class="w"><dt>Top shelf</dt><dd>' + esc(AREA[st.areas[0].k]) + "</dd></div>" : "")
      + (st.boty ? '<div class="w"><dt>Book of the year</dt><dd>' + esc(st.boty.t) + "</dd></div>" : "") + "</dl>"
      + '<p class="wr-url">theusefulmedia.com/library/wrapped</p>';
  }
  function seal(t) {
    var w = t.replace(/^The /, "").toUpperCase();
    return '<svg viewBox="0 0 200 200"><defs><path id="wrsc" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1 -148 0"/></defs><circle cx="100" cy="100" r="94" fill="#B8913A"/><circle cx="100" cy="100" r="84" fill="none" stroke="#1C2B24" stroke-width="2" stroke-dasharray="3 6"/><circle cx="100" cy="100" r="58" fill="#1C2B24"/>'
      + '<text font-family="IBM Plex Mono, monospace" font-size="13" letter-spacing="3" fill="#1C2B24"><textPath href="#wrsc" startOffset="0">THE USEFUL LIBRARY · ' + YEAR + " · READER TYPE · </textPath></text>"
      + '<g transform="translate(100 100)"><path d="M-26 -22 H18 L26 -14 V26 H-26 Z" fill="#2F6B4F" stroke="#EEF0EC" stroke-width="3" stroke-linejoin="round"/><path d="M-4 26 V36 L0 32 L4 36 V26" fill="#B8913A" stroke="#EEF0EC" stroke-width="2.5" stroke-linejoin="round"/><path d="M-16 -6 H12 M-16 4 H8" stroke="#EEF0EC" stroke-width="3" stroke-linecap="round"/></g></svg>';
  }
  function open(st, shared) {
    ST = st; SHARED = !!shared; slides = build(st); at = 0;
    bars.innerHTML = slides.map(function () { return "<span><i></i></span>"; }).join("");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("wr-lock");
    show(0);
  }
  function close() { clearTimeout(timer); if (dlg.open) dlg.close ? dlg.close() : dlg.removeAttribute("open"); document.documentElement.classList.remove("wr-lock"); }
  function show(i) {
    at = Math.max(0, Math.min(slides.length - 1, i)); var s = slides[at];
    stage.className = "wr-stage s-" + s.k; stage.innerHTML = '<div class="wr-sl">' + s.h + "</div>";
    $$("span", bars).forEach(function (b, k) { b.className = k < at ? "done" : k === at ? "now" : ""; var bi = $("i", b); bi.style.animationDuration = DUR + "ms"; });
    $$("[data-count]", stage).forEach(countUp);
    foot.innerHTML = s.sum ? (SHARED ? '<a class="btn btn-green pill" href="' + PAGE + '">Make my ' + YEAR + " in books</a>" : '<button type="button" class="btn btn-green pill" data-sv="story">Save for Stories</button><button type="button" class="btn btn-line-light pill" data-sv="post">Save as post</button><button type="button" class="btn btn-line-light pill" data-sv="share">Share</button><button type="button" class="btn btn-line-light pill" data-sv="link">Copy my link</button>')
      : '<span class="wr-hint">Tap to go on</span>';
    $$("[data-sv]", foot).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); act(b.dataset.sv, b); }); });
    clearTimeout(timer); paused = false; stage.classList.remove("paused");
    if (!s.sum && !reduce) timer = setTimeout(function () { show(at + 1); }, DUR);
    if (s.sum) { $$("span", bars)[at].className = "done"; if (!SHARED) $("[data-wr-after]").hidden = false; }
  }
  function countUp(el) {
    var to = +el.dataset.count; if (reduce) { el.textContent = to.toLocaleString("en-US"); return; }
    var t0 = performance.now(), d = 1100;
    (function f(t) { var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString("en-US"); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  // tap left or right half, arrow keys, hold to pause
  var downAt = 0;
  stage.addEventListener("pointerdown", function () { downAt = Date.now(); clearTimeout(timer); paused = true; stage.classList.add("paused"); });
  stage.addEventListener("pointerup", function (e) {
    var held = Date.now() - downAt > 350; stage.classList.remove("paused");
    if (held) { if (!slides[at].sum && !reduce) timer = setTimeout(function () { show(at + 1); }, DUR / 2); return; }
    if (e.target.closest("a,button")) return;
    var r = stage.getBoundingClientRect(); if (e.clientX - r.left < r.width * .3) show(at - 1); else if (at < slides.length - 1) show(at + 1);
  });
  dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); if (at < slides.length - 1) show(at + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); } });
  $("[data-wr-close]").addEventListener("click", close);
  dlg.addEventListener("close", function () { clearTimeout(timer); document.documentElement.classList.remove("wr-lock"); });
  $("[data-wr-prev]").addEventListener("click", function () { show(at - 1); });
  $("[data-wr-next]").addEventListener("click", function () { if (at < slides.length - 1) show(at + 1); });

  go.addEventListener("click", function () {
    if (S.books.length < 3) return;
    var st = stats(S.books, S.name); st.bs = S.books; open(st);
    nextShelf(st);
  });

  /* ---------- after the story: the next-year shelf and the challenge ---------- */
  function nextShelf(st) {
    var read = {}; S.books.forEach(function (b) { read[norm(b.t)] = 1; });
    var picks = [], seen = {};
    st.areas.concat([{ k: "habits" }, { k: "focus" }, { k: "mindset" }, { k: "money" }]).forEach(function (a) { (NEXT[a.k] || []).forEach(function (x) { if (picks.length < 3 && !seen[x[0]] && !read[norm(x[1])]) { seen[x[0]] = 1; picks.push(x); } }); });
    $("[data-wr-next3]").innerHTML = picks.map(function (x) { return '<a class="wr-n3 card lift" href="/library/books/' + x[0] + '/"><img src="/library/img/covers/' + x[0] + '.webp" alt="" width="64" height="96" loading="lazy" onerror="this.remove()"><span><b>' + esc(x[1]) + "</b><small>Read, skim or skip? See our verdict</small></span></a>"; }).join("");
  }

  /* ---------- share images (drawn on a canvas, so covers come out sharp) ---------- */
  var imgCache = {};
  function loadImg(src) { if (!src) return Promise.resolve(null); if (imgCache[src]) return imgCache[src]; imgCache[src] = new Promise(function (res) { var im = new Image(); im.crossOrigin = "anonymous"; im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src; setTimeout(function () { res(null); }, 6000); }); return imgCache[src]; }
  function draw(kind) {
    var st = ST, W = 1080, H = kind === "story" ? 1920 : 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var x = cv.getContext("2d"), grid = st.bs.slice(0, kind === "story" ? 12 : 10);
    return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { return Promise.all(grid.map(function (b) { return loadImg(coverUrl(b, "L")); })); }).then(function (ims) {
      x.fillStyle = "#1C2B24"; x.fillRect(0, 0, W, H);
      var g = x.createRadialGradient(W * .8, 0, 40, W * .8, 0, W); g.addColorStop(0, "rgba(184,145,58,.35)"); g.addColorStop(1, "rgba(184,145,58,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = "rgba(238,240,236,.07)"; x.lineWidth = 2; for (var yy = 0; yy < H; yy += 48) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
      var pad = 84, y = kind === "story" ? 190 : 120;
      x.fillStyle = "#B8913A"; x.font = "500 30px 'IBM Plex Mono', monospace"; x.fillText(((st.name ? st.name + "'s " : "My ") + YEAR + " in books").toUpperCase(), pad, y);
      y += kind === "story" ? 150 : 120; x.fillStyle = "#EEF0EC"; x.font = "400 " + (kind === "story" ? 150 : 120) + "px 'DM Serif Display', Georgia, serif";
      x.fillText(st.n + (st.n === 1 ? " book" : " books"), pad, y);
      y += kind === "story" ? 72 : 60; x.font = "600 " + (kind === "story" ? 44 : 38) + "px Manrope, sans-serif"; x.fillStyle = "#CFD8D2";
      x.fillText(st.P.toLocaleString("en-US") + " pages · " + st.type[0], pad, y);
      // covers
      var cols = kind === "story" ? 4 : 5, gap = kind === "story" ? 22 : 18, cw = (W - pad * 2 - gap * (cols - 1)) / cols, ch = cw * 1.5, top = y + (kind === "story" ? 70 : 44);
      var rowsMax = kind === "story" ? 3 : 2;
      grid.slice(0, cols * rowsMax).forEach(function (b, i) {
        var cx = pad + (i % cols) * (cw + gap), cy = top + Math.floor(i / cols) * (ch + gap), im = ims[i];
        x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 24; x.shadowOffsetY = 10; rr(x, cx, cy, cw, ch, 10); x.fillStyle = "hsl(" + hue(b.t) + ",32%,34%)"; x.fill(); x.restore();
        x.save(); rr(x, cx, cy, cw, ch, 10); x.clip();
        if (im) { try { x.drawImage(im, cx, cy, cw, ch); } catch (e) { im = null; } }
        if (!im) { x.fillStyle = "#EEF0EC"; x.font = "400 30px 'DM Serif Display', Georgia, serif"; wrapT(x, b.t, cx + 18, cy + 50, cw - 36, 36, 5); }
        x.restore();
      });
      var by = top + Math.min(rowsMax, Math.ceil(grid.length / cols)) * (ch + gap) + (kind === "story" ? 50 : 26);
      // facts
      var facts = [];
      if (st.boty) facts.push(["Book of the year", st.boty.t]);
      if (st.areas.length) facts.push(["Top shelf", AREA[st.areas[0].k]]);
      if (st.dated >= 3) facts.push(["Best month", MONTHS_L[st.best]]);
      var room = Math.max(0, Math.floor((H - 190 - by + 20) / 128));
      if (kind === "story" && room > facts.length) by += Math.round((room - facts.length) * 128 / 2);
      facts.slice(0, Math.min(room, 3)).forEach(function (f) {
        x.fillStyle = "#9FB0A6"; x.font = "500 26px 'IBM Plex Mono', monospace"; x.fillText(f[0].toUpperCase(), pad, by);
        x.fillStyle = "#EEF0EC"; x.font = "400 46px 'DM Serif Display', Georgia, serif"; wrapT(x, f[1], pad, by + 56, W - pad * 2, 52, 1); by += 128;
      });
      x.fillStyle = "#B8913A"; rr(x, pad, H - 150, W - pad * 2, 86, 43); x.fill();
      x.fillStyle = "#1C2B24"; x.font = "700 34px Manrope, sans-serif"; x.textAlign = "center"; x.fillText("Make yours: theusefulmedia.com/library/wrapped", W / 2, H - 96); x.textAlign = "left";
      return cv;
    });
    function rr(c, a, b, w, h, r) { c.beginPath(); c.moveTo(a + r, b); c.arcTo(a + w, b, a + w, b + h, r); c.arcTo(a + w, b + h, a, b + h, r); c.arcTo(a, b + h, a, b, r); c.arcTo(a, b, a + w, b, r); c.closePath(); }
    function wrapT(c, t, a, b, w, lh, max) { var words = String(t).split(" "), line = "", n = 0; for (var i = 0; i < words.length; i++) { var tst = line ? line + " " + words[i] : words[i]; if (c.measureText(tst).width > w && line) { if (++n >= max) { c.fillText(line + "…", a, b); return; } c.fillText(line, a, b); b += lh; line = words[i]; } else line = tst; } c.fillText(line, a, b); }
  }
  function act(k, btn) {
    if (k === "link") { shareLink().then(function (u) { copy(u, btn); }); return; }
    var kind = k === "post" ? "post" : "story", old = btn.textContent; btn.textContent = "Making it…"; btn.disabled = true;
    draw(kind).then(function (cv) {
      btn.textContent = old; btn.disabled = false;
      cv.toBlob(function (blob) {
        var fname = "my-" + YEAR + "-in-books-" + kind + ".png";
        if (k === "share") {
          var file = blob && window.File ? new File([blob], fname, { type: "image/png" }) : null;
          shareLink().then(function (u) {
            var data = { title: "My " + YEAR + " in books", text: "My " + YEAR + " in books: " + ST.n + " books, " + ST.P.toLocaleString("en-US") + " pages. I'm " + ST.type[0] + ". Make yours:", url: u };
            if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share(Object.assign({ files: [file] }, data)).catch(function () {});
            else if (navigator.share) navigator.share(data).catch(function () {});
            else window.open("https://x.com/intent/post?text=" + encodeURIComponent(data.text + " " + u), "_blank", "noopener");
          });
          return;
        }
        var a = document.createElement("a"); a.download = fname; a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, "image/png");
    }).catch(function () { btn.textContent = old; btn.disabled = false; });
  }
  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
    function fb() { var t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); }
  }

  /* ---------- a link friends can open: the list packed into the address (#w=...), nothing stored on a server ---------- */
  function pack() { return JSON.stringify({ v: 1, n: S.name || "", b: S.books.slice(0, 60).map(function (b) { return [String(b.t).slice(0, 60), String(b.a || "").slice(0, 30), b.c || 0, b.p || 0, b.r || 0, b.m || 0, b.b ? 1 : 0, (b.s || []).join("."), b.y || 0, b.ib || ""]; }) }); }
  function b64(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function shareLink() {
    var raw = new TextEncoder().encode(pack());
    if (window.CompressionStream) return new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer().then(function (ab) { return SITE + PAGE + "#z=" + b64(new Uint8Array(ab)); }).catch(function () { return SITE + PAGE + "#w=" + b64(raw); });
    return Promise.resolve(SITE + PAGE + "#w=" + b64(raw));
  }
  function unpack(h) {
    var m = h.match(/^#(z|w)=([A-Za-z0-9_-]+)$/); if (!m) return Promise.resolve(null);
    var u = unb64(m[2]);
    var txt = m[1] === "z" && window.DecompressionStream ? new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text() : Promise.resolve(new TextDecoder().decode(u));
    return txt.then(function (t) { var j = JSON.parse(t); return { name: String(j.n || "").slice(0, 24), books: (j.b || []).slice(0, 60).map(function (r) { return { t: String(r[0] || ""), a: String(r[1] || ""), c: +r[2] || 0, p: +r[3] || 0, r: +r[4] || 0, m: +r[5] || 0, b: !!r[6], s: String(r[7] || "").split(".").filter(function (k) { return AREA[k]; }), y: +r[8] || 0, ib: String(r[9] || "").replace(/[^0-9X]/g, "") }; }).filter(function (b) { return b.t; }) }; }).catch(function () { return null; });
  }

  paint();
  // someone shared their year: play it, then invite this reader to make theirs
  if (/^#(z|w)=/.test(location.hash)) unpack(location.hash).then(function (d) {
    if (!d || d.books.length < 1) return;
    var st = stats(d.books, d.name); st.bs = d.books;
    var bn = $("[data-wr-friend]"); bn.hidden = false; $("b", bn).textContent = (d.name ? d.name + "'s" : "A friend's") + " " + YEAR + " in books";
    $("button", bn).addEventListener("click", function () { open(st, true); });
    open(st, true);
  });
})();
