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
    { a: "Getting Things Done", by: "David Allen, 2001", cover: "", idea: "If a task takes under 2 minutes, do it now.", url: "/library/ideas/the-2-minute-rule/", clues: ["First published in 2001.", "Built around 5 steps: capture, clarify, organize, reflect, engage.", "Has a famous rule about tasks that take under 2 minutes.", "Asks you to do a weekly review of everything on your plate.", "Aims for a calm state the author calls mind like water.", "Subtitle: the art of stress-free productivity."] }
  ];
  var EXTRA = ["Rich Dad Poor Dad", "The Millionaire Next Door", "Tiny Habits", "Grit", "The Obstacle Is the Way", "Four Thousand Weeks", "The One Thing", "Your Money or Your Life", "The Simple Path to Wealth", "Can't Hurt Me"];
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
  }
  function renderOpts() {
    var q = input.value.trim().toLowerCase();
    var list = ALL.filter(function (b) { return !q || b.toLowerCase().indexOf(q) !== -1; }).slice(0, q ? 8 : 6);
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
    var link = $("[data-r-link]");
    if (pz.url) { link.href = pz.url; link.hidden = false; } else link.hidden = true;
    if (animate) { var c = $("[data-r-card]"); c.classList.remove("flipin"); void c.offsetWidth; c.classList.add("flipin"); }
    var st = streak(); document.querySelector("[data-streak]").textContent = st + (st === 1 ? " day" : " days");
  }
  function streak() {
    function won(d) { try { var v = JSON.parse(localStorage.getItem("lib:game:" + d)); return !!(v && v.won); } catch (e) { return false; } }
    var n = 0, d = won(no) ? no : no - 1;
    while (d >= 1 && won(d)) { n++; d--; }
    return n;
  }
  function guess(b) {
    if (done() || s.wrong.indexOf(b) !== -1) return;
    input.value = "";
    if (b === pz.a) { s.won = true; save(); renderClues(); renderDone(true); return; }
    s.wrong.push(b);
    if (s.shown >= 6) { s.lost = true; save(); renderClues(); renderDone(true); return; }
    s.shown++; save();
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

  renderClues(); renderOpts();
  if (done()) renderDone(false);
  else { var st0 = streak(); document.querySelector("[data-streak]").textContent = st0 + (st0 === 1 ? " day" : " days"); }
})();
