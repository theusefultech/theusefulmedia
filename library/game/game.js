// Mystery Book: 1 nonfiction book a day, 6 clues.
(function () {
  "use strict";
  var START = new Date(2026, 10, 12); // puzzle No. 1 = 12 Nov 2026, local time
  var P = [
    { a: "The Psychology of Money", by: "Morgan Housel, 2020", cover: "the-psychology-of-money", idea: "Wealth is what you don't see. The money you didn't spend is the wealth.", clues: ["Published in 2020.", "Built from 19 short stories about how people think about money.", "The author was a partner at a venture capital firm.", "Big idea: doing well with money depends more on behavior than on intelligence.", "One chapter says the hardest financial skill is getting the goalpost to stop moving.", "Subtitle: timeless lessons on wealth, greed, and happiness."] },
    { a: "Atomic Habits", by: "James Clear, 2018", cover: "atomic-habits", idea: "The 2 minute rule: shrink a new habit until it takes 2 minutes.", url: "/library/ideas/the-2-minute-rule/", clues: ["Published in 2018.", "The author built a large email newsletter before writing it.", "Built around 4 laws of behavior change.", "Argues that getting 1% better each day compounds into big results.", "Says to focus on systems instead of goals.", "Subtitle: an easy and proven way to build good habits and break bad ones."] },
    { a: "Deep Work", by: "Cal Newport, 2016", cover: "deep-work", idea: "Book deep work blocks in your calendar like meetings, and protect them.", clues: ["Published in 2016.", "The author is a computer science professor at Georgetown University.", "Gives a name to low-value tasks done while distracted: shallow work.", "The second half is a set of 4 rules.", "One of those rules tells you to quit social media.", "Subtitle: rules for focused success in a distracted world."] },
    { a: "Man’s Search for Meaning", by: "Viktor Frankl, 1946", cover: "mans-search-for-meaning", idea: "You can't always choose what happens to you, but you can choose how you respond.", clues: ["First published in German in 1946.", "The author was a psychiatrist from Vienna.", "Part 1 describes his years in Nazi concentration camps.", "Part 2 explains the therapy he founded, logotherapy.", "Argues the main human drive is the search for purpose.", "The last word of the title is Meaning."] },
    { a: "Mindset", by: "Carol Dweck, 2006", cover: "mindset", idea: "Praise effort and strategy, not talent.", clues: ["Published in 2006.", "The author is a psychology professor at Stanford.", "Compares 2 beliefs about whether ability can change.", "Its research found that praising intelligence can make children avoid challenges.", "Applies the idea to parenting, business, school and relationships.", "Subtitle: the new psychology of success."] },
    { a: "The Power of Habit", by: "Charles Duhigg, 2012", cover: "the-power-of-habit", idea: "Keep the cue and the reward. Swap only the routine.", clues: ["Published in 2012.", "The author was a reporter at The New York Times.", "Describes a 3 part loop: cue, routine, reward.", "Introduces keystone habits that set off other changes.", "Tells how Alcoa's CEO focused the whole company on worker safety.", "Subtitle: why we do what we do in life and business."] },
    { a: "Essentialism", by: "Greg McKeown, 2014", cover: "essentialism", idea: "If it isn't a clear yes, it's a clear no.", clues: ["Published in 2014.", "Its motto is less, but better.", "Suggests scoring options and dropping anything below 90 out of 100.", "Warns that if you don't prioritize your life, someone else will.", "Treats saying no gracefully as a skill to practice.", "Subtitle: the disciplined pursuit of less."] },
    { a: "Meditations", by: "Marcus Aurelius, about 170 to 180 AD", cover: "meditations", idea: "Spend your energy only on what is in your control.", clues: ["Written about 1,850 years ago.", "The author never meant it to be published. It was a private notebook.", "Written in Greek by a Roman.", "The author ruled an empire while writing it.", "Split into 12 short books.", "A founding text for modern readers of Stoicism."] },
    { a: "I Will Teach You to Be Rich", by: "Ramit Sethi, 2009", cover: "i-will-teach-you-to-be-rich", idea: "Automate your saving so it happens on payday without willpower.", clues: ["First published in 2009.", "Laid out as a 6 week program.", "Big idea: automate your money so good choices happen by default.", "Says spend lavishly on what you love and cut hard on what you don't.", "Calls its budget a conscious spending plan.", "The title is a promise to make you rich."] },
    { a: "Thinking, Fast and Slow", by: "Daniel Kahneman, 2011", cover: "thinking-fast-and-slow", idea: "Before a big decision, check if you're anchored on the first number you heard.", clues: ["Published in 2011.", "The author was a psychologist who won the Nobel Prize in economics.", "Describes 2 systems of thought: 1 quick and intuitive, 1 slow and deliberate.", "Covers biases like anchoring and loss aversion.", "Separates the experiencing self from the remembering self.", "The title names 2 speeds."] },
    { a: "The 7 Habits of Highly Effective People", by: "Stephen R. Covey, 1989", cover: "the-7-habits-of-highly-effective-people", idea: "Begin with the end in mind: write what you want said about you, then work back.", clues: ["First published in 1989.", "Moves from private victory to public victory.", "One habit: begin with the end in mind.", "Another: seek first to understand, then to be understood.", "The last habit is called sharpen the saw.", "There is a number in the title."] },
    { a: "How to Win Friends and Influence People", by: "Dale Carnegie, 1936", cover: "how-to-win-friends-and-influence-people", idea: "Use people's names. It tells them they matter to you.", clues: ["First published in 1936.", "Grew out of the author's public speaking courses.", "Advises never to criticize, condemn or complain.", "Says a person's name is the sweetest sound to them.", "Tells you to become genuinely interested in other people.", "The title mentions friends."] },
    { a: "Indistractable", by: "Nir Eyal, 2019", cover: "indistractable", idea: "Timebox your day. Plan your time, not just your to-do list.", clues: ["Published in 2019.", "The author's earlier book taught companies to build habit-forming products.", "Argues distraction starts with internal triggers, not with your phone.", "Recommends timeboxing your calendar.", "Suggests pacts that make getting distracted harder.", "Subtitle: how to control your attention and choose your life."] },
    { a: "Rich Dad Poor Dad", by: "Robert T. Kiyosaki, 1997", cover: "", idea: "Buy things that put money in your pocket before things that take it out.", clues: ["First published in 1997.", "Co-written with an accountant, Sharon Lechter.", "Compares the money lessons of 2 father figures.", "Defines an asset as something that puts money in your pocket.", "Says the rich don't work for money.", "The title names 2 dads."] },
    { a: "The Millionaire Next Door", by: "Thomas J. Stanley and William D. Danko, 1996", cover: "the-millionaire-next-door", idea: "Wealth is mostly what you keep, not what you earn or show.", clues: ["Published in 1996.", "Written by 2 researchers who surveyed actual millionaires.", "Found many wealthy people live well below their means.", "Splits people into prodigious and under accumulators of wealth.", "Says high income and real wealth are often different people.", "Subtitle: the surprising secrets of America's wealthy."] },
    { a: "Grit", by: "Angela Duckworth, 2016", cover: "grit", idea: "Pick 1 top goal and let it organize the smaller ones.", clues: ["Published in 2016.", "The author is a psychology professor at the University of Pennsylvania.", "Studies which West Point cadets survive their first summer.", "Includes a short self-scoring scale you can take.", "Argues effort counts twice: once for skill, once for results.", "Subtitle: the power of passion and perseverance."] },
    { a: "Tiny Habits", by: "BJ Fogg, 2019", cover: "tiny-habits", idea: "After an existing habit, do a tiny new one, then celebrate right away.", clues: ["Published at the very end of 2019.", "The author founded a behavior design lab at Stanford.", "Sums up behavior as B = MAP.", "Famous example: floss just 1 tooth.", "Calls the good feeling after a small win Shine.", "Subtitle: the small changes that change everything."] },
    { a: "The Obstacle Is the Way", by: "Ryan Holiday, 2014", cover: "the-obstacle-is-the-way", idea: "Ask what this problem lets you practice, then act on that.", clues: ["Published in 2014.", "The author was once marketing director at American Apparel.", "Built on 3 disciplines: perception, action and will.", "Draws on the Stoics, especially Marcus Aurelius.", "Its title comes from a line in Meditations.", "Subtitle: the timeless art of turning trials into triumph."] },
    { a: "Four Thousand Weeks", by: "Oliver Burkeman, 2021", cover: "four-thousand-weeks", idea: "You will never get it all done, so choose what to neglect on purpose.", clues: ["Published in 2021.", "The author wrote a long-running Guardian column on psychology.", "Argues that productivity tricks make busyness worse.", "Its title is roughly the length of an average human life.", "Suggests deciding in advance what you will fail at.", "Subtitle: time management for mortals."] },
    { a: "The One Thing", by: "Gary Keller with Jay Papasan, 2013", cover: "the-one-thing", idea: "Ask: what's the 1 thing I can do such that everything else gets easier?", clues: ["Published in 2013.", "The lead author co-founded a large real estate company.", "Uses falling dominoes to explain how small wins grow.", "Built around a single focusing question.", "Tells you to time block your most important work.", "Its title is a number and a noun."] },
    { a: "The Simple Path to Wealth", by: "JL Collins, 2016", cover: "the-simple-path-to-wealth", idea: "Spend less than you earn and put the rest in low-cost index funds.", clues: ["Published in 2016.", "Began as letters the author wrote to his daughter.", "Recommends broad, low-cost stock index funds.", "Talks about building enough money to say no to a bad job.", "The foreword is by Mr. Money Mustache.", "Subtitle: your road map to financial independence and a rich, free life."] },
    { a: "Your Money or Your Life", by: "Vicki Robin and Joe Dominguez, 1992", cover: "your-money-or-your-life", idea: "Price things in hours of your life, using your real hourly wage.", clues: ["First published in 1992.", "Laid out as a 9 step program.", "Has you work out your real hourly wage after work costs.", "Calls money something you trade your life energy for.", "Helped start the financial independence movement.", "The title is a robber's demand."] },
    { a: "Make Time", by: "Jake Knapp and John Zeratsky, 2018", cover: "make-time", idea: "Pick 1 Highlight each day and protect time for it.", clues: ["Published in 2018.", "Both authors designed products at Google.", "They also wrote a book about running 5 day sprints.", "Each day starts by choosing a Highlight.", "The method has 4 parts: Highlight, Laser, Energize, Reflect.", "Subtitle: how to focus on what matters every day."] },
    { a: "Digital Minimalism", by: "Cal Newport, 2019", cover: "digital-minimalism", idea: "Take 30 days off optional tech, then add back only what earns its place.", clues: ["Published in 2019.", "The author also wrote a famous book about deep focus.", "Proposes a 30 day digital declutter.", "Warns about solitude deprivation.", "Argues for using fewer apps on purpose, not more.", "Subtitle: choosing a focused life in a noisy world."] },
    { a: "Influence", by: "Robert B. Cialdini, 1984", cover: "influence", idea: "Notice when reciprocity is being used on you: a small gift before a big ask.", clues: ["First published in 1984.", "The author is a psychology professor at Arizona State University.", "He went undercover in sales jobs to research it.", "Names principles like reciprocity, scarcity and social proof.", "A later edition added a seventh principle, unity.", "Subtitle: the psychology of persuasion."] },
    { a: "The Almanack of Naval Ravikant", by: "Eric Jorgenson, 2020", cover: "the-almanack-of-naval-ravikant", idea: "Build specific knowledge: skills that feel like play to you and work to others.", clues: ["Published in 2020.", "Compiled from tweets, podcasts and essays by someone else.", "Its subject co-founded AngelList.", "Has 2 halves: wealth and happiness.", "Was also given away as a free ebook.", "The title says it's an almanack."] },
    { a: "Quiet", by: "Susan Cain, 2012", cover: "quiet", idea: "Plan recovery time after social events, like you would after exercise.", clues: ["Published in 2012.", "The author was a corporate lawyer before writing it.", "Her TED talk on the topic is one of the most watched.", "Questions why schools and offices reward the loudest voice.", "Is about introverts.", "Subtitle: the power of introverts in a world that can't stop talking."] },
    { a: "Ikigai", by: "Hector Garcia and Francesc Miralles, 2016", cover: "ikigai", idea: "Stop eating when you're about 80% full.", clues: ["First published in 2016.", "The 2 authors visited a village known for long lives in Okinawa.", "Explains a Japanese idea for your reason to get up each morning.", "Mentions hara hachi bu: eat until 80% full.", "Draws on logotherapy and flow.", "Subtitle: the Japanese secret to a long and happy life."] },
    { a: "Getting Things Done", by: "David Allen, 2001", cover: "", idea: "If a task takes under 2 minutes, do it now.", url: "/library/ideas/the-2-minute-rule/", clues: ["First published in 2001.", "Built around 5 steps: capture, clarify, organize, reflect, engage.", "Has a famous rule about tasks that take under 2 minutes.", "Asks you to do a weekly review of everything on your plate.", "Aims for a calm state the author calls mind like water.", "Subtitle: the art of stress-free productivity."] }
  ];
  var EXTRA = ["Can't Hurt Me", "The Power of Now", "Sapiens", "Range", "Show Your Work", "The War of Art", "Feeling Good", "Mastery", "Never Split the Difference", "Start With Why"];
  var ALL = P.map(function (p) { return p.a; }).concat(EXTRA).sort();

  var root = document.querySelector("[data-game]");
  if (!root) return;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dayN = Math.max(0, Math.round((today - START) / 86400000));
  var no = dayN + 1, pz = P[dayN % P.length];
  var key = "lib:game:" + no;
  var s; try { s = JSON.parse(localStorage.getItem(key)) || null; } catch (e) { s = null; }
  s = s || { shown: 1, wrong: [], won: false, lost: false };

  var $ = function (q) { return root.querySelector(q); };
  function rnd(n) { var x = Math.sin(n * 7919 + no * 104729) * 10000; return x - Math.floor(x); }
  var others = ALL.filter(function (b) { return b !== pz.a; }).map(function (b, i) { return { b: b, r: rnd(i + 1) }; })
    .sort(function (x, y) { return x.r - y.r; }).slice(0, 7).map(function (x) { return x.b; });
  var starters = others.concat([pz.a]).map(function (b, i) { return { b: b, r: rnd(i + 50) }; })
    .sort(function (x, y) { return x.r - y.r; }).map(function (x) { return x.b; });
  $("[data-no]").textContent = "No. " + no;
  var cluesEl = $("[data-clues]"), counter = $("[data-counter]"), input = $("[data-guess]"), opts = $("[data-opts]");
  var playEl = $("[data-play]"), doneEl = $("[data-done]"), note = $("[data-note]");

  function save() { try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {} }
  function done() { return s.won || s.lost; }

  function renderClues(newIdx) {
    cluesEl.innerHTML = "";
    pz.clues.forEach(function (t, i) {
      var open = i < s.shown || done();
      var d = document.createElement("div");
      d.className = "clue" + (open ? "" : " locked") + (i === newIdx ? " rise" : "");
      var n = document.createElement("span"); n.className = "n"; n.textContent = String(i + 1).padStart(2, "0");
      var tx = document.createElement("span"); tx.textContent = open ? t : "Opens after a wrong guess";
      d.appendChild(n); d.appendChild(tx); cluesEl.appendChild(d);
    });
    counter.textContent = "Clue " + (done() ? 6 : s.shown) + "/6";
    var mc = document.querySelector("[data-mcover]");
    if (mc) {
      if (!pz.cover || done()) { mc.hidden = true; }
      else {
        var im = mc.querySelector("img"); if (!im.getAttribute("src")) im.src = "/library/img/covers/" + pz.cover + ".webp";
        var B = [24, 19, 15, 11, 8, 5][Math.min(5, s.shown - 1)], Z = [1.55, 1.45, 1.35, 1.25, 1.15, 1.05][Math.min(5, s.shown - 1)];
        mc.style.setProperty("--blur", B + "px"); mc.style.setProperty("--zoom", Z); mc.hidden = false;
      }
    }
  }
  function renderOpts() {
    var q = input.value.trim().toLowerCase();
    var list = q ? ALL.filter(function (b) { return b.toLowerCase().indexOf(q) !== -1; }).slice(0, 8) : starters;
    opts.innerHTML = "";
    list.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "opt"; btn.textContent = b;
      if (s.wrong.indexOf(b) !== -1) btn.disabled = true;
      btn.addEventListener("click", function () { guess(b); });
      opts.appendChild(btn);
    });
    if (!list.length) opts.innerHTML = '<p style="color:var(--muted);font-size:15px">No match. Try a shorter word.</p>';
  }
  function grid() {
    var used = s.won ? s.wrong.length + 1 : 6, out = [];
    for (var i = 0; i < 6; i++) out.push(s.won && i === s.wrong.length ? "win" : (i < used ? "miss" : "none"));
    return out;
  }
  function renderDone(animate) {
    playEl.hidden = true; doneEl.hidden = false;
    $("[data-r-label]").textContent = s.won ? "SOLVED IN " + (s.wrong.length + 1) + " OF 6 CLUES" : "NOT TODAY. HERE IT IS";
    $("[data-r-title]").textContent = pz.a;
    $("[data-r-by]").textContent = pz.by;
    var cv = $("[data-r-cover]");
    cv.innerHTML = pz.cover ? '<img src="/library/img/covers/' + pz.cover + '.webp" alt="' + pz.a.replace(/"/g, "") + ' cover" width="110" height="168">' : '<div class="nocover">' + pz.a + "</div>";
    var g = $("[data-r-grid]"); g.innerHTML = "";
    grid().forEach(function (k, i) {
      var d = document.createElement("div"); d.className = "sq" + (animate ? " pop" : "");
      d.style.background = k === "win" ? "#4E8A6C" : (k === "miss" ? "#B8913A" : "#33463C");
      d.style.animationDelay = (0.25 + i * 0.09).toFixed(2) + "s"; g.appendChild(d);
    });
    $("[data-r-idea]").textContent = pz.idea;
    var buy = document.querySelector("[data-r-buy]"); if (buy) { buy.setAttribute("data-buy", pz.a + " " + pz.by.split(",")[0]); if (window.LibBuy) window.LibBuy(buy); }
    var link = $("[data-r-link]");
    if (pz.url) { link.href = pz.url; link.hidden = false; } else link.hidden = true;
    if (animate) { var c = $("[data-r-card]"); c.classList.remove("flipin"); void c.offsetWidth; c.classList.add("flipin");
      setTimeout(function () { if (window.LibAsk) window.LibAsk(c.parentNode.children[1], "win"); }, 1400); }
    document.querySelectorAll("[data-r-dog]").forEach(function (d) { d.hidden = d.getAttribute("data-r-dog") !== (s.won ? "win" : "lose"); });
    var st = streak(); document.querySelector("[data-streak]").textContent = st + (st === 1 ? " day" : " days");
    var nx = P[(dayN + 1) % P.length], tz = document.querySelector("[data-teaser]");
    if (tz) {
      tz.hidden = false;
      document.querySelector("[data-teaser-cover]").innerHTML = nx.cover ? '<img src="/library/img/covers/' + nx.cover + '.webp" alt="" width="70" height="106">' : "?";
      document.querySelector("[data-teaser-t]").textContent = nx.cover ? "Can you guess it from the cover?" : "No cover clue for this one. Good luck.";
      var si = window.LibStamps && window.LibStamps.streakInfo ? window.LibStamps.streakInfo() : null, fl = document.querySelector("[data-freeze-line]");
      if (fl && si) fl.innerHTML = si.freezes ? '<span class="freeze-chip">' + si.freezes + (si.freezes === 1 ? " streak freeze" : " streak freezes") + '</span> Miss a day and your streak stays.' : "Solve 7 days in a row to earn a streak freeze.";
    }
    var gsAll = window.LibStamps ? window.LibStamps.games() : [];
    var pl = gsAll.filter(function (g) { return g.won || g.lost; }).length, wn = gsAll.filter(function (g) { return g.won; }).length;
    var sEl = $("[data-stats]");
    if (sEl) sEl.innerHTML = [["Played", pl], ["Win %", pl ? Math.round(wn / pl * 100) : 0], ["Streak", st], ["Best", window.LibStamps ? window.LibStamps.bestStreak(gsAll) : st]]
      .map(function (x) { return '<div class="stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join("");
    if (animate) {
      if (window.LibStamps) window.LibStamps.check();
      if (s.won && window.LibConfetti) setTimeout(function () { window.LibConfetti($("[data-r-card]")); }, 350);
    }
    tick();
  }
  function tick() {
    var el = $("[data-countdown]"); if (!el) return;
    var n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
    var sec = Math.max(0, Math.floor((m - n) / 1000));
    el.textContent = [Math.floor(sec / 3600), Math.floor(sec % 3600 / 60), sec % 60].map(function (x) { return String(x).padStart(2, "0"); }).join(":");
    if (!tick.t) tick.t = setInterval(tick, 1000);
    if (sec === 0 && !tick.ready) {
      tick.ready = true; clearInterval(tick.t);
      var rb = document.querySelector("[data-ready]"), nl = document.querySelector("[data-next-line]");
      if (rb) { rb.hidden = false; if (nl) nl.textContent = "A new book just arrived."; rb.addEventListener("click", function () { location.reload(); }); if (window.LibSound) window.LibSound.play("pop"); }
      else location.reload();
    }
  }
  function streak() {
    if (window.LibStamps && window.LibStamps.streakInfo) return window.LibStamps.streakInfo(null, no).cur;
    function won(d) { try { var v = JSON.parse(localStorage.getItem("lib:game:" + d)); return !!(v && v.won); } catch (e) { return false; } }
    var n = 0, d = won(no) ? no : no - 1;
    while (d >= 1 && won(d)) { n++; d--; }
    return n;
  }
  function guess(b) {
    if (done() || s.wrong.indexOf(b) !== -1) return;
    input.value = "";
    if (b === pz.a) { s.won = true; save(); renderClues(); renderDone(true); if (window.LibSound) window.LibSound.play("win"); return; }
    s.wrong.push(b);
    if (s.shown >= 6) { s.lost = true; save(); renderClues(); renderDone(true); return; }
    s.shown++; save(); if (window.LibSound) window.LibSound.play("miss");
    renderClues(s.shown - 1); renderOpts();
    note.hidden = false; note.textContent = "Not " + b + ". A new clue just opened.";
    note.classList.remove("pop"); void note.offsetWidth; note.classList.add("pop");
    root.classList.remove("shake"); void root.offsetWidth; root.classList.add("shake");
  }
  input.addEventListener("input", renderOpts);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = opts.querySelector(".opt:not([disabled])"); if (f) f.click(); } });
  $("[data-share]").addEventListener("click", function () {
    var sq = grid().map(function (k) { return k === "win" ? "🟩" : (k === "miss" ? "🟨" : "⬜"); }).join("");
    var text = "Mystery Book No. " + no + "  " + (s.won ? (s.wrong.length + 1) : "X") + "/6\n" + sq + "\ntheusefulmedia.com/library/game/";
    var btn = this;
    function ok() { btn.textContent = "Copied. Paste it anywhere"; }
    if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { navigator.share({ text: text }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, ok); else ok();
  });

  var sb = document.querySelector("[data-sound]");
  if (sb && window.LibSound) {
    var paintS = function () { var on = window.LibSound.on(); sb.setAttribute("aria-pressed", String(on)); sb.setAttribute("aria-label", on ? "Sound on. Turn sound off" : "Sound off. Turn sound on"); };
    paintS(); sb.addEventListener("click", function () { window.LibSound.set(!window.LibSound.on()); paintS(); });
  }
  renderClues(); renderOpts();
  if (done()) renderDone(false);
  else { var st0 = streak(); document.querySelector("[data-streak]").textContent = st0 + (st0 === 1 ? " day" : " days"); }
})();
