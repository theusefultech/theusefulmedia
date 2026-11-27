/* Grouped menus and the page finder for theusefulmedia.com (18 Nov 2026, Raja "A").
   Loaded from inside the Main nav, so every page that copies the nav from index.html gets it.
   Without JavaScript the plain nav links stay. The page finder (⌘K, / or the search button) also lists The Useful Apps pages.
   A page added in the last 7 days gets a dot and a "New" tag; the dot drops off on its own. */
(function () {
  var doc = document, nav = doc.currentScript && doc.currentScript.closest('nav[aria-label="Main"]');
  if (!nav || nav.hasAttribute("data-tmn")) return;
  nav.setAttribute("data-tmn", "1");
  var css = doc.createElement("link"); css.rel = "stylesheet"; css.href = "/assets/menu.css?v=2"; doc.head.appendChild(css);

  var IC = {mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>',archive:'<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10h14V9M10 13h4"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>',gift:'<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8C9 8 7 4 9.5 4S12 8 12 8s.5-4 2.5-4S15 8 12 8"/>',grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.5"/>',medal:'<circle cx="12" cy="15" r="5"/><path d="M8.5 11 6 3h4l2 5 2-5h4l-2.5 8"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',watch:'<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2l1.5 1"/>',bubble:'<path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-5 4v-4a3 3 0 0 1-2-3z"/>',stack:'<rect x="5" y="4" width="14" height="4" rx="2"/><rect x="4" y="10" width="16" height="4" rx="2"/><rect x="6" y="16" width="12" height="4" rx="2"/>',guide:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>',film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/>',mega:'<path d="M4 10v4l3 1 2 5h3l-1-4 9 3V5L7 9z"/>',code:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',net:'<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7 6 16M13 7l5 9M7 18h10"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',at:'<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5"/>',list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',joy:'<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4M15 12h.01M17 14h.01"/>',scale:'<path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',bolt:'<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',desk:'<path d="M3 10h18M5 10v10M19 10v10M8 4h8v6H8z"/>',device:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',swap:'<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',plus:'<path d="M12 5v14M5 12h14"/>',radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',price:'<path d="M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8"/>',abc:'<path d="M4 18 7 6l3 12M5 14h4M13 6h3a3 3 0 0 1 0 6h-3zM13 12h4a3 3 0 0 1 0 6h-4z"/>',cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',lemon:'<ellipse cx="12" cy="12" rx="8" ry="6" transform="rotate(-30 12 12)"/><path d="M8 16 16 8"/>',ad:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15l2-6 2 6M7.6 13h2.8M14 9v6h1.5a3 3 0 0 0 0-6z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',save:'<path d="M6 3h12v18l-6-4-6 4z"/>'};
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || "") + "</svg>"; };
  var CHEV = '<svg class="tmn-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // [title, url, 1 line, icon, date added (YYYY-MM-DD), extra search words]
  var GROUPS = [
    { k: "Read", d: "Newsletters, book ideas and free guides", items: [["Newsletter", "/tech/", "The Useful Tech: 3 short Apple emails a week", "mail", "2026-10-06", "subscribe email"], ["Past issues", "/tech/library/", "Every issue, searchable", "archive", "2026-10-06", "archive newsletter"], ["The Useful Library", "/library/", "Ideas from nonfiction books, new every day", "book", "2026-11-12", "books life"], ["Reading Challenge 2027", "/library/challenge/", "Opens 1 Dec. $29 early-bird price", "trophy", "2026-11-12", "challenge reading"], ["Free guides", "/free/", "Cheat sheets and checklists to download", "gift", "2026-10-12", "freebies download"]] },
    { k: "Find apps", d: "The Useful Apps: the right app for any job", items: [["The Useful Apps", "/apps/", "Find the right Mac or iPhone app for any job", "grid", "2026-10-13", "discover directory"], ["Best-of guides", "/apps/best/", "1 winner per job, plus the best free pick", "medal", "2026-10-13", "best"], ["New Mac apps", "/apps/new-mac-apps/", "Every new Mac app this week", "spark", "2026-11-18", "new launches"], ["The Usefuls 2026", "/apps/usefuls/", "Nominate and vote for the apps of the year", "trophy", "2026-11-18", "awards vote nominate"], ["Setups", "/apps/setups/", "The apps tech creators actually use", "desk", "2026-11-13", "youtubers"], ["Apps for your device", "/apps/devices/", "The best apps and gear for each Apple device", "device", "2026-11-17", "iphone mac lineup"]] },
    { k: "Made by me", d: "My apps and the guides I sell", items: ["Apps", ["Wristkeeper", "/wristkeeper/", "Picks which watch to wear each morning. iPhone", "watch", "2026-09-16", "watch app"], ["Textlore", "https://textlore.app/", "Search your whole Messages history on Mac", "bubble", "2026-10-01", "imessage"], ["Tinystack", "/stack/", "Trade brain rot for a brain stack. Waitlist open", "stack", "2026-11-18", "brain rot waitlist"], "Guides and tools", ["Guides", "/products/", "Step-by-step guides for your Mac and iPhone", "guide", "2026-09-16", "gumroad buy"], ["Useful Studio", "/studio/", "Make videos with Claude Code", "film", "2026-10-08", "video claude"]] },
    { k: "Work with me", d: "Sponsors, developers, creators, and who I am", items: [["Advertise", "/work-with-me/", "Sponsor The Useful Tech: Medium, newsletter, The Useful Apps", "mega", "2026-11-13", "sponsor media kit"], ["For app developers", "/apps/developers/", "Free tools and launch help", "code", "2026-10-29", "developer"], ["Submit your app", "/apps/submit/", "Get listed on The Useful Apps", "up", "2026-11-06", "submit list"], ["The Useful Network", "/network/", "For Apple newsletter creators: get more sponsors", "net", "2026-11-04", "creators"], ["About Raja", "/about/", "1 person in Chennai, behind every brand here", "person", "2026-09-16", "raja"], ["Contact", "/contact/", "Email and how to reach me", "at", "2026-09-16", "email"]] }
  ];
  var PROMO = { t: "Black Friday deals", u: "/apps/deals/", until: "2026-12-03" }, CTA = ["Get the newsletter", "/tech/"];
  // Searchable only: pages on both sites that live outside the 4 menus
  var MORE = [["Books", "/library/books/", "What to read, skim or skip", "book", "", "library"], ["Bookshelves", "/library/people/", "Books famous people recommend", "book", "2026-11-15", "library people"], ["Most recommended books", "/library/recommended/", "The books named most", "star", "2026-11-18", "library"], ["Problems", "/library/problems/", "3 fixes from 3 books", "list", "", "library procrastination focus"], ["Ideas", "/library/ideas/", "1 idea, 2 minutes", "spark", "", "library"], ["Today's game: Mystery Book", "/library/game/", "A daily book puzzle", "joy", "", "library game"], ["Habits", "/library/habits/", "Ideas from books on habits", "book", "", "library discipline"], ["Focus", "/library/focus/", "Ideas from books on focus", "book", "", "library productivity"], ["Money", "/library/money/", "Ideas from books on money", "book", "", "library wealth"], ["Mindset", "/library/mindset/", "Ideas from books on mindset", "book", "", "library emotions"], ["My shelf", "/library/shelf/", "Your saved books, streak and badges", "save", "", "library badges"],
    ["Black Friday deals", "/apps/deals/", "Checked app deals, up to 50% off", "tag", "", "sale discount"], ["Collections", "/apps/collections/", "Short lists, about 10 apps each", "list", "", ""], ["All apps", "/apps/browse/", "Every app, filter by device and price", "grid", "", "browse"], ["Compare apps", "/apps/compare/", "Put any 2 to 4 apps side by side", "scale", "", "vs"], ["Apple Arcade", "/apps/arcade/", "Every Arcade game: new, coming, leaving", "joy", "", "games"], ["Sherlocked", "/apps/sherlocked/", "Apps Apple copied, and who survived", "eye", "", "apple copied"], ["Apple award recaps", "/apps/awards/", "Every Apple award winner, year by year", "star", "", "design awards"], ["Most used", "/apps/most-used/", "The apps on the most creator setups", "bolt", "", "popular"], ["Switches", "/apps/switches/", "What creators switched from, and to", "swap", "", "switch"], ["Build your setup", "/apps/setups/build/", "Make your own setup and share it", "plus", "", "my setup"], ["Review radar", "/apps/developers/review-radar/", "New reviews and rival changes, daily email", "radar", "", "reviews developer"], ["App Store pricing", "/apps/developers/app-pricing/", "What top paid apps charge, 14 countries", "price", "", "price developer"], ["App name checker", "/apps/developers/app-name-checker/", "Is your app name taken?", "abc", "", "name developer"], ["Launch planner", "/apps/developers/launch-planner/", "Pick a launch day around Apple events", "cal", "", "launch date developer"], ["Leaving Lemon Squeezy", "/apps/developers/lemon-squeezy-alternatives/", "8 ways to sell your Mac app, with fees", "lemon", "", "payments paddle developer"], ["Where apps advertise", "/apps/developers/where-to-advertise/", "The creators Mac and iPhone apps sponsor", "ad", "", "ads sponsor developer"], ["The Lineup: iPhone", "/apps/devices/iphone/", "Best apps and gear for iPhone", "device", "", "iphone"], ["The Lineup: HomeView", "/apps/devices/homeview/", "Best apps and gear for HomeView", "device", "", "homeview"]];

  var today = new Date().toISOString().slice(0, 10);
  var isNew = function (d) { return d && (Date.parse(today) - Date.parse(d)) / 864e5 < 7; };
  var here = location.pathname;
  var best = "";
  GROUPS.forEach(function (g) { g.items.forEach(function (i) { if (typeof i !== "string" && i[1].charAt(0) === "/" && i[1] !== "/" && here.indexOf(i[1]) === 0 && i[1].length > best.length) best = i[1]; }); });
  var isCur = function (u) { return u === best; };
  var item = function (i) {
    if (typeof i === "string") return '<p class="tmn-sub">' + esc(i) + "</p>";
    var ext = i[1].charAt(0) !== "/";
    return '<a class="tmn-it" href="' + i[1] + '"' + (isCur(i[1]) ? ' aria-current="page"' : "") + (ext ? ' rel="noopener"' : "") + '><span class="tmn-ic">' + svg(i[3]) + '</span><span><b>' + esc(i[0]) + (isNew(i[4]) ? '<span class="tmn-new">New</span>' : "") + "</b><small>" + esc(i[2]) + "</small></span></a>";
  };
  var hasNew = function (g) { return g.items.some(function (i) { return typeof i !== "string" && isNew(i[4]); }); };
  var hasCur = function (g) { return g.items.some(function (i) { return typeof i !== "string" && isCur(i[1]); }); };
  var promoOn = today <= PROMO.until;

  function build() {
    var header = nav.closest("header");
    if (!header) return;
    // pages with their own main button (Subscribe free, Book a spot) keep it and skip ours
    var ownCta = header.querySelector(".is-head-cta, .tum-cta, a[data-subscribe]");
    header.classList.add("tmn-h");
    nav.innerHTML = GROUPS.map(function (g, i) { return '<button class="tmn-tb" type="button" aria-expanded="false" aria-controls="tmn-p' + i + '" data-g="' + i + '"' + (hasCur(g) ? ' data-cur' : "") + ">" + esc(g.k) + (hasNew(g) ? '<span class="tmn-dot" aria-hidden="true"></span>' : "") + CHEV + "</button>"; }).join("");
    var tools = doc.createElement("div"); tools.className = "tmn-tools";
    tools.innerHTML = '<button class="tmn-go" type="button" data-tmn-pal aria-label="Go to any page">' + svg("search") + '<span>Go to</span><kbd>⌘K</kbd></button>' +
      (promoOn ? '<a class="tmn-promo" href="' + PROMO.u + '">' + svg("tag") + esc(PROMO.t) + "</a>" : "") +
      (ownCta ? "" : '<a class="tmn-cta" href="' + CTA[1] + '">' + esc(CTA[0]) + "</a>") +
      '<button class="tmn-ib" type="button" data-tmn-pal aria-label="Go to any page">' + svg("search") + "</button>" +
      '<button class="tmn-ib tmn-mb" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="tmn-sheet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button>';
    nav.insertAdjacentElement("afterend", tools);
    var wrap = doc.createElement("div"); wrap.className = "tmn-panels";
    wrap.innerHTML = GROUPS.map(function (g, i) { return '<div class="tmn-panel" id="tmn-p' + i + '" role="region" aria-label="' + esc(g.k) + '"><div class="tmn-ph"><b>' + esc(g.k) + "</b><span>" + esc(g.d) + "</span></div>" + g.items.map(item).join("") + "</div>"; }).join("");
    header.appendChild(wrap);
    var sheet = doc.createElement("div"); sheet.id = "tmn-sheet"; sheet.className = "tmn-sheet"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Menu");
    sheet.innerHTML = '<div class="tmn-sh-body">' + (promoOn ? '<a class="tmn-promo" href="' + PROMO.u + '">' + svg("tag") + esc(PROMO.t) + "</a>" : "") + '<button class="tmn-go" type="button" data-tmn-pal>' + svg("search") + "<span>Go to any page</span></button>" +
      GROUPS.map(function (g) { return "<details" + (hasCur(g) ? " open" : "") + "><summary>" + esc(g.k) + (hasNew(g) ? '<span class="tmn-dot" aria-hidden="true"></span>' : "") + '<span class="tmn-sp"></span>' + CHEV + "</summary>" + g.items.map(item).join("") + "</details>"; }).join("") +
      '<a class="tmn-cta" href="' + CTA[1] + '">' + esc(CTA[0]) + "</a></div>";
    doc.body.appendChild(sheet);
    var pal = doc.createElement("div"); pal.className = "tmn-pal"; pal.hidden = true; pal.setAttribute("role", "dialog"); pal.setAttribute("aria-modal", "true"); pal.setAttribute("aria-label", "Go to any page");
    pal.innerHTML = '<div class="tmn-pbox"><div class="tmn-pin">' + svg("search") + '<input type="text" placeholder="Go to any page… try deals, pricing, books" aria-label="Search pages" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="tmn-pres"></div><div class="tmn-pres" id="tmn-pres" role="listbox"></div><div class="tmn-pfoot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div></div>';
    doc.body.appendChild(pal);
    wire(header, wrap, sheet, pal, tools);
  }

  function wire(header, wrap, sheet, pal, tools) {
    var tbs = [].slice.call(nav.querySelectorAll(".tmn-tb")), panels = [].slice.call(wrap.querySelectorAll(".tmn-panel"));
    var openI = -1, hoverT = null, openedAt = 0, fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
    var setPanel = function (i) {
      tbs.forEach(function (b, j) { b.setAttribute("aria-expanded", String(j === i)); });
      panels.forEach(function (p, j) { p.classList.toggle("on", j === i); });
      if (i >= 0 && i !== openI) openedAt = Date.now();
      openI = i;
    };
    tbs.forEach(function (b, i) {
      b.addEventListener("click", function () { if (openI === i && Date.now() - openedAt < 500) return; setPanel(openI === i ? -1 : i); });
      if (fine) { b.addEventListener("mouseenter", function () { clearTimeout(hoverT); hoverT = setTimeout(function () { setPanel(i); }, openI >= 0 ? 0 : 140); }); b.addEventListener("mouseleave", function () { clearTimeout(hoverT); }); }
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var n = tbs[(i + (e.key === "ArrowRight" ? 1 : tbs.length - 1)) % tbs.length]; n.focus(); if (openI >= 0) setPanel(+n.dataset.g); }
        if (e.key === "ArrowDown") { e.preventDefault(); setPanel(i); var f = panels[i].querySelector(".tmn-it"); if (f) f.focus(); }
      });
    });
    panels.forEach(function (p, i) {
      p.addEventListener("keydown", function (e) { if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return; e.preventDefault(); var its = [].slice.call(p.querySelectorAll(".tmn-it")), k = its.indexOf(doc.activeElement); its[(k + (e.key === "ArrowDown" ? 1 : its.length - 1)) % its.length].focus(); });
      if (fine) p.addEventListener("mouseleave", function (e) { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".tmn-tb,.tmn-panel")) setPanel(-1); });
    });
    if (fine) nav.addEventListener("mouseleave", function (e) { clearTimeout(hoverT); if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".tmn-panel,.tmn-tb")) setPanel(-1); });
    doc.addEventListener("click", function (e) { if (openI >= 0 && !e.target.closest(".tmn-tb,.tmn-panel")) setPanel(-1); });
    // phone sheet
    var mb = tools.querySelector(".tmn-mb");
    var setSheet = function (o) { sheet.hidden = !o; mb.setAttribute("aria-expanded", String(o)); mb.setAttribute("aria-label", o ? "Close menu" : "Open menu"); doc.documentElement.classList.toggle("tmn-lock", o); };
    mb.addEventListener("click", function () { setSheet(sheet.hidden); });
    matchMedia("(min-width: 961px)").addEventListener("change", function (m) { if (m.matches) setSheet(false); });
    // page finder
    var ALL = [], seen = {};
    GROUPS.forEach(function (g) { g.items.forEach(function (i) { if (typeof i !== "string" && !seen[i[1]]) { seen[i[1]] = 1; ALL.push({ t: i[0], u: i[1], d: i[2], i: i[3], n: isNew(i[4]), x: (i[5] || "") + " " + g.k }); } }); });
    MORE.forEach(function (i) { if (!seen[i[1]]) { seen[i[1]] = 1; ALL.push({ t: i[0], u: i[1], d: i[2], i: i[3], n: isNew(i[4]), x: i[5] || "" }); } });
    var inp = pal.querySelector("input"), box = pal.querySelector(".tmn-pres"), sel = 0, res = [], last = null;
    var score = function (p, q) { var t = p.t.toLowerCase(), hay = (p.t + " " + p.d + " " + p.x).toLowerCase(); if (t.indexOf(q) === 0) return 3; if (t.indexOf(q) > -1) return 2; return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; }) ? 1 : 0; };
    var render = function () {
      var q = inp.value.trim().toLowerCase();
      res = q ? ALL.map(function (p) { return [score(p, q), p]; }).filter(function (x) { return x[0]; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; }).slice(0, 12)
        : ALL.filter(function (p) { return p.n; }).concat(ALL.filter(function (p) { return !p.n; })).slice(0, 9);
      sel = Math.min(sel, Math.max(res.length - 1, 0));
      if (!res.length) { box.innerHTML = '<p class="tmn-pempty">No page matches “' + esc(inp.value) + '”. Try a shorter word, like “deal” or “book”.</p>'; inp.removeAttribute("aria-activedescendant"); return; }
      box.innerHTML = '<p class="tmn-grp">' + (q ? "Pages" : "New and popular") + "</p>" + res.map(function (p, i) { return '<a class="tmn-it" role="option" id="tmn-o' + i + '" aria-selected="' + (i === sel) + '" href="' + p.u + '" data-i="' + i + '"><span class="tmn-ic">' + svg(p.i) + "</span><span><b>" + esc(p.t) + (p.n ? '<span class="tmn-new">New</span>' : "") + "</b><small>" + esc(p.d) + '</small></span><span class="tmn-site">' + (p.u.indexOf("/apps/") === 0 ? "Useful Apps" : p.u.indexOf("/library/") === 0 ? "Library" : "") + "</span></a>"; }).join("");
      inp.setAttribute("aria-activedescendant", "tmn-o" + sel);
    };
    var openPal = function () { setPanel(-1); setSheet(false); last = doc.activeElement; pal.hidden = false; inp.value = ""; sel = 0; render(); inp.focus({ preventScroll: true }); doc.documentElement.classList.add("tmn-lock"); };
    var closePal = function () { pal.hidden = true; doc.documentElement.classList.remove("tmn-lock"); if (last && last.focus) last.focus({ preventScroll: true }); };
    doc.querySelectorAll("[data-tmn-pal]").forEach(function (b) { b.addEventListener("click", openPal); });
    pal.addEventListener("click", function (e) { if (e.target === pal) closePal(); });
    inp.addEventListener("input", function () { sel = 0; render(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (res.length) { sel = (sel + (e.key === "ArrowDown" ? 1 : res.length - 1)) % res.length; render(); var o = doc.getElementById("tmn-o" + sel); if (o) o.scrollIntoView({ block: "nearest" }); } }
      if (e.key === "Enter" && res[sel]) { e.preventDefault(); location.href = res[sel].u; }
    });
    box.addEventListener("mousemove", function (e) { var a = e.target.closest("[data-i]"); if (a && +a.dataset.i !== sel) { sel = +a.dataset.i; render(); } });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (!pal.hidden) closePal(); else if (openI >= 0) { var b = tbs[openI]; setPanel(-1); b.focus(); } else if (!sheet.hidden) { setSheet(false); mb.focus(); } return; }
      var typing = /INPUT|TEXTAREA|SELECT/.test(doc.activeElement.tagName) || doc.activeElement.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
      else if (e.key === "/" && !typing && pal.hidden) { e.preventDefault(); openPal(); }
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", build); else build();
})();
