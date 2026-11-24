"""Builds /library/2026/ (Books that defined 2026) from the Library's own page chrome. Free: no Claude, no server.
Raja, 24 Nov 2026 (Season Plan L3, "A"): 20 nonfiction books of 2026 that people talked about most, sorted into
the Library's areas, each with 1 idea to keep, who it's for, and a /go/ book link (Amazon, the right store per country).
Goes live by itself on 1 Dec 2026 (IST): .github/workflows/library-2026.yml runs this script that morning.
Before then it writes nothing unless you pass --preview PATH.
Usage: python3 scripts/build_books2026.py            (writes library/2026/ only on or after 1 Dec 2026 IST)
       python3 scripts/build_books2026.py --preview /tmp/b26.html"""
import re, os, sys, json, html, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.join(ROOT, "library")
PATH = "/library/2026/"
LIVE_ON = datetime.date(2026, 12, 1)
TITLE = "Books that defined 2026: the 20 nonfiction books worth your time · The Useful Library"
DESC = ("The 20 nonfiction books of 2026 people talked about most, sorted by what they help with: habits, focus, money, "
        "mindset and people. 1 idea to keep from each, and who it's for.")

# area key, label, colour, cover ink
AREAS = [
    ("habits", "Habits", "#2F6B4F", "#FBFBF8"),
    ("focus", "Focus, screens & AI", "#2D4A6B", "#FBFBF8"),
    ("money", "Money", "#B8913A", "#1C2B24"),
    ("mindset", "Mindset", "#7A3E48", "#FBFBF8"),
    ("people", "Confidence & people", "#5B5A8C", "#FBFBF8"),
]

# title, subtitle, author, month, area, idea to keep, best for, signal (only what the lists say), start-here flag
BOOKS = [
    ("Situated", "Find the People and Places That Bring Out Your Best", "Angela Duckworth", "Sep", "habits",
     "Change the room before you change yourself. Your desk, your people and your defaults do more work than willpower.",
     "Anyone tired of being told to try harder", "Bestseller", True),
    ("Intentional", "How to Finish What You Start", "Chris Bailey", "Jan", "habits",
     "Finishing is not a willpower problem. Decide in advance, shape your space, and let go of goals that were never yours.",
     "The person with 5 half-done projects", "Globe and Mail bestseller", False),
    ("The Way of Excellence", "A Guide to True Greatness and Deep Satisfaction in a Chaotic World", "Brad Stulberg", "Jan", "habits",
     "Excellence is a practice you come back to every day, not a trophy. Care about the process and the results follow.",
     "High achievers running close to burnout", "", False),
    ("Protocols", "An Operating Manual for the Human Body", "Andrew D. Huberman", "Sep", "habits",
     "Small daily routines for sleep, light, stress and focus add up. Start with sunlight soon after you wake.",
     "People who like a checklist", "#1 New York Times bestseller", False),

    ("Dopamine Kids", "A Science-Based Plan to Rewire Your Child's Brain", "Michaeleen Doucleff", "Mar", "focus",
     "Dopamine drives wanting, not pleasure. Swap the screen craving for things that actually satisfy, for kids and adults.",
     "Parents losing the screen-time battle", "Amazon editors' pick", False),
    ("Artificial Intimacy", "Who We Become When We Talk to Machines", "Sherry Turkle", "Sep", "focus",
     "Chatbots give you connection without the hard parts. The hard parts are where people grow, so keep them.",
     "Anyone who talks to AI every day", "FT best tech books of 2026", True),
    ("A World Appears", "A Journey into Consciousness", "Michael Pollan", "Feb", "focus",
     "Science still can't explain why you're aware at all. Noticing that makes plain attention feel like a gift.",
     "Curious minds who want a big idea", "Goodreads Choice nominee", False),
    ("The Infinity Machine", "Demis Hassabis, DeepMind, and the Quest for Superintelligence", "Sebastian Mallaby", "Mar", "focus",
     "The clearest story of how today's AI got built, told by the people racing to build it, safety worries included.",
     "People who want to understand the AI they use", "New York Times bestseller", False),

    ("Well Endowed", "The Secrets to Strategic Spending and Lasting Wealth", "Vivian Tu", "Feb", "money",
     "Spend on purpose. Point your money at the big milestones first, before lifestyle creep gets there.",
     "Your late 20s and 30s: home, partner, family", "B&N most anticipated", True),
    ("Planet Money", "A Guide to the Economic Forces That Shape Your Life", "Alex Mayyasi", "Apr", "money",
     "Prices, pay and even dating follow economic rules. Learn the rules and everyday choices get easier.",
     "People who think economics is boring", "New York Times bestseller", False),
    ("Worth the Risk", "The Seven Myths That Keep Us from Taking the Chances We Need to Take", "Allison Schrager", "Sep", "money",
     "Playing it safe has a cost too. Most of us take too few smart risks, not too many.",
     "Someone weighing a big move", "Next Big Idea must-read", False),
    ("The Almighty Dollar", "500 Years of the World's Most Powerful Money", "Brendan Greeley", "May", "money",
     "The dollar started as a silver coin long before America existed. Money is less fixed than it looks.",
     "History fans who like a money story", "Marginal Revolution best of 2026", False),

    ("The Other Side of Change", "Who We Become When Life Makes Other Plans", "Maya Shankar", "Jan", "mindset",
     "A change you didn't want can show you who you're becoming, not only what you lost.",
     "Anyone whose plan just broke", "Bloomberg best book of 2026", True),
    ("The Meaning of Your Life", "Finding Purpose in an Age of Emptiness", "Arthur C. Brooks", "Mar", "mindset",
     "Success and comfort won't fill the gap. Meaning comes from asking why, on purpose and often.",
     "The restless high achiever", "#1 New York Times bestseller", False),
    ("The Power of Real Optimism", "A Practical, Science-Based Guide to Staying Resilient", "Deepika Chopra", "Mar", "mindset",
     "Optimism is a skill, not a mood. It means staying open when things are hard, not pretending they're fine.",
     "Lifelong pessimists", "National bestseller", False),
    ("Beyond Belief", "The Science-Backed Way to Stop Limiting Yourself", "Nir Eyal", "Mar", "mindset",
     "Your beliefs are tools, not facts. Swap the ones that hold you back for ones that help.",
     "People who quit just before it works", "New York Times bestseller", False),

    ("Vibe", "The Secrets of Strong Connections in a Lonely World", "Adam Grant", "Oct", "people",
     "You don't need to be alike to click. Chemistry can be built, and faster than you think.",
     "Teams, couples and new friends", "Goodreads Choice nominee", True),
    ("A Little More Social", "How Small Choices Create Unexpected Happiness, Health, and Connection", "Nicholas Epley", "May", "people",
     "People are friendlier than you predict. Say the hello you were about to skip.",
     "Introverts who still want more connection", "", False),
    ("Worth", "The New Science of Self-Esteem and Secure Attachment", "Marisa G. Franco", "Sep", "people",
     "Self-worth is a skill. Looking back at old memories with kinder eyes can change the story you tell about yourself.",
     "Anyone who needs praise to feel OK", "Next Big Idea must-read", False),
    ("Big Trust", "Rewire Self-Doubt, Find Your Confidence, and Fuel Success", "Shadé Zahrai", "Jan", "people",
     "Self-doubt gets quieter when you back yourself in small moments first.",
     "Second-guessers and people-pleasers", "Next Big Idea must-read", False),
]
AREA = {a[0]: a for a in AREAS}
assert len(BOOKS) == 20 and all(sum(1 for b in BOOKS if b[4] == a[0] and b[8]) == 1 for a in AREAS)


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def go(title, author):
    return "/go/" + slugify(title + " " + author)


def tcls(t):
    longest = max(len(w) for w in t.split())
    return " xl" if longest >= 11 or len(t) > 22 else (" l" if longest >= 9 or len(t) > 14 else "")


def cover(t, a, area, size="card"):
    """Typographic cover drawn in CSS: an original design in the area colour, never the real jacket."""
    _, _, bg, ink = AREA[area]
    return (f'<div class="b26-cv b26-{size}" style="--bg:{bg};--ink:{ink}" aria-hidden="true" data-visual>'
            f'<span class="b26-cv-t{tcls(t)}">{html.escape(t)}</span><span class="b26-cv-a">{html.escape(a)}</span></div>')


def page():
    src = open(os.path.join(L, "about", "index.html")).read()
    head, rest = src.split("</head>", 1)
    head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(TITLE)}</title>", head, flags=re.S)

    def meta(attr, key, val):
        nonlocal head
        head = re.sub(rf'<meta {attr}="{re.escape(key)}" content="[^"]*">',
                      f'<meta {attr}="{key}" content="{html.escape(val, quote=True)}">', head)
    meta("name", "description", DESC); meta("property", "og:title", "Books that defined 2026")
    meta("property", "og:description", DESC); meta("property", "og:url", "https://theusefulmedia.com" + PATH)
    head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://theusefulmedia.com{PATH}">', head)

    FAQ = [
        ("How did you pick these 20?", "From the 2026 lists readers and editors talked about most: the bestseller lists, the Goodreads Choice Awards, Amazon and Barnes & Noble picks, and the big book clubs. Then only books that help with habits, focus, money, mindset or people made the cut. Memoirs and politics are left out."),
        ("Which one should I read first?", "Pick the area you most want to fix in 2027, then start with the book marked Start here. Each one is the easiest way into its area."),
        ("Where do the links go?", "To the book on Amazon, in the right store for your country. If you buy, The Useful Library may earn a small commission at no cost to you."),
        ("Are these summaries?", "No. Each book gets 1 idea to keep, in our own words, so you can decide if it's worth your time. Read the book for the rest."),
    ]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": "Books that defined 2026", "url": "https://theusefulmedia.com" + PATH,
         "description": DESC, "datePublished": "2026-12-01", "publisher": {"@id": "https://theusefulmedia.com/#org"}},
        {"@type": "ItemList", "name": "Books that defined 2026", "numberOfItems": 20, "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "Book", "name": b[0], "author": {"@type": "Person", "name": b[2]}, "datePublished": "2026"}}
            for i, b in enumerate(BOOKS)]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}]}
    head = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + json.dumps(ld) + "</script>", head, flags=re.S)
    head += """<style>
.b26-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:center;margin:18px 0 22px}
.b26-shelf{width:100%;max-width:420px;height:auto;display:block;margin:auto}
.b26-shelf a{cursor:pointer}.b26-shelf a:focus-visible rect{stroke:#B8913A;stroke-width:4}
.b26-shelf a:hover rect.sp{transform:translateY(-6px)}.b26-shelf rect.sp{transition:transform .15s}
.b26-key{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:14px;font-size:13px;color:var(--soft,#3f4f46)}
.b26-key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.b26-pills{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.b26-pills::-webkit-scrollbar{display:none}
.b26-pill{all:unset;box-sizing:border-box;cursor:pointer;white-space:nowrap;border:2px solid var(--ink,#1C2B24);border-radius:999px;padding:9px 15px;font:700 14px Manrope,system-ui,sans-serif;background:var(--paper,#FBFBF8)}
.b26-pill[aria-pressed=true]{background:#1C2B24;color:#FBFBF8}
.b26-pill:focus-visible{outline:3px solid #B8913A;outline-offset:2px}
.b26-pill b{font-weight:500;opacity:.7;margin-left:4px}
.b26-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:6px}
.b26-b{display:flex;gap:14px;border:1px solid var(--line,#D9E0DB);border-radius:16px;padding:14px;background:var(--paper,#FBFBF8);scroll-margin-top:90px}
.b26-b[hidden]{display:none}
.b26-b:target{box-shadow:0 0 0 3px #B8913A}
.b26-cv{flex:none;display:flex;flex-direction:column;justify-content:space-between;background:var(--bg);color:var(--ink);border-radius:4px 8px 8px 4px;box-shadow:inset 6px 0 0 rgba(0,0,0,.16),0 6px 16px rgba(28,43,36,.18);padding:10px 8px 8px 13px;position:relative;overflow:hidden}
.b26-cv:after{content:"";position:absolute;right:-18px;top:-18px;width:56px;height:56px;border-radius:50%;border:2px solid currentColor;opacity:.22}
.b26-card{width:86px;height:128px}
.b26-cv-t{font-family:"DM Serif Display",Georgia,serif;font-size:15px;line-height:1.08;word-break:normal;overflow-wrap:normal}.b26-cv-t.l{font-size:12.5px}.b26-cv-t.xl{font-size:11px}
.b26-cv-a{font:700 8px/1.2 Manrope,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.03em;opacity:.85;overflow-wrap:anywhere}
.b26-txt{min-width:0;display:flex;flex-direction:column;gap:4px}
.b26-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font:600 12px "IBM Plex Mono",ui-monospace,monospace;color:var(--muted,#5b6b62)}
.b26-tag{border-radius:999px;padding:2px 8px;background:var(--mint,#E3EEE7);color:#1C2B24;font-family:Manrope,system-ui,sans-serif;font-weight:700}
.b26-start{background:#B8913A;color:#1C2B24}
.b26-t{font-weight:800;font-size:17px;line-height:1.2;margin:2px 0 0}
.b26-s{font-size:13px;color:var(--muted,#5b6b62);margin:0}
.b26-idea{font-family:"DM Serif Display",Georgia,serif;font-size:17px;line-height:1.35;color:#1C2B24;margin:6px 0 0}
.b26-for{font-size:13px;color:var(--soft,#3f4f46);margin:2px 0 0}
.b26-for b{font-weight:700}
.b26-acts{display:flex;gap:8px;margin-top:8px}.b26-acts a{font-size:14px;padding:9px 14px;white-space:nowrap}
.b26-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 0}
.b26-stats div{border:1px solid var(--line,#D9E0DB);border-radius:14px;padding:10px 12px;background:var(--paper,#FBFBF8)}
.b26-stats b{display:block;font:400 28px/1 "DM Serif Display",Georgia,serif}.b26-stats span{font-size:12px;color:var(--muted,#5b6b62)}
.b26-next{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.b26-next a.card{display:block;text-decoration:none;color:inherit}
@media (max-width:760px){.b26-hero{grid-template-columns:1fr;gap:6px;margin-top:6px}.b26-art{order:-1}.b26-shelf{max-width:250px}.b26-key{justify-content:center;font-size:12px;margin-top:6px;gap:4px 10px}.b26-grid,.b26-next{grid-template-columns:1fr}.b26-b{padding:12px;gap:12px}.b26-card{width:68px;height:102px;padding:8px 6px 6px 11px}.b26-cv-t{font-size:13px}.b26-cv-t.l{font-size:11px}.b26-cv-t.xl{font-size:9.5px}.b26-cv-a{font-size:7px}.b26-s .sub{display:none}.b26-idea{font-size:16px}.b26-stats b{font-size:24px}}
</style>
"""
    body_top, after = rest.split("<main", 1)
    _, foot = after.split("</main>", 1)
    body_top = body_top.replace(' aria-current="page"', "")

    # hero: a shelf of 20 spines, 1 per book, coloured by area; each spine jumps to its card
    sp, x = [], 22
    heights = [150, 168, 140, 176, 158, 146, 172, 152, 164, 138, 170, 156, 144, 174, 150, 162, 142, 168, 154, 160]
    for i, b in enumerate(BOOKS):
        _, _, bg, ink = AREA[b[4]]
        h = heights[i]; w = 16 if len(b[0]) < 12 else 18
        y = 236 - h
        sp.append(f'<a href="#b-{slugify(b[0])}" aria-label="{html.escape(b[0], quote=True)}"><rect class="sp" x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="{bg}" stroke="#1C2B24" stroke-width="2"/>'
                  f'<rect x="{x+3}" y="{y+10}" width="{w-6}" height="3" fill="{ink}" opacity=".55"/><rect x="{x+3}" y="{y+h-16}" width="{w-6}" height="3" fill="{ink}" opacity=".55"/></a>')
        x += w + 2
    shelf = ('<svg class="b26-shelf" data-visual viewBox="0 0 420 300" role="img" aria-label="A shelf of the 20 books, coloured by area. Tap a spine to jump to that book.">'
             '<circle cx="210" cy="150" r="140" fill="var(--mint,#E3EEE7)"/>'
             '<text x="210" y="52" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="30" fill="#1C2B24">2026</text>'
             + "".join(sp) +
             '<rect x="12" y="236" width="396" height="14" rx="3" fill="#8A6B22" stroke="#1C2B24" stroke-width="2"/>'
             '<rect x="30" y="250" width="12" height="26" fill="#8A6B22" stroke="#1C2B24" stroke-width="2"/><rect x="378" y="250" width="12" height="26" fill="#8A6B22" stroke="#1C2B24" stroke-width="2"/>'
             '<g fill="#B8913A"><path d="M60 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M356 82l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g></svg>')
    key = "".join(f'<span><i style="background:{c}"></i>{html.escape(n)}</span>' for _, n, c, _ in AREAS)

    pills = ['<button type="button" class="b26-pill" aria-pressed="true" data-b26="all">All<b>20</b></button>']
    for k, n, _, _ in AREAS:
        pills.append(f'<button type="button" class="b26-pill" aria-pressed="false" data-b26="{k}">{html.escape(n)}<b>4</b></button>')

    cards = []
    for t, sub, a, mon, area, idea, best, sig, start in BOOKS:
        tags = f'<span>{mon} 2026</span>'
        if start:
            tags += '<span class="b26-tag b26-start">Start here</span>'
        if sig:
            tags += f'<span class="b26-tag">{html.escape(sig)}</span>'
        cards.append(
            f'<article class="b26-b" id="b-{slugify(t)}" data-area="{area}">{cover(t, a, area)}'
            f'<div class="b26-txt"><div class="b26-meta">{tags}</div>'
            f'<h3 class="b26-t">{html.escape(t)}</h3><p class="b26-s">{html.escape(a)}<span class="sub"> · {html.escape(sub)}</span></p>'
            f'<p class="b26-idea">{html.escape(idea)}</p>'
            f'<p class="b26-for"><b>Best for:</b> {html.escape(best)}</p>'
            f'<div class="b26-acts"><a class="btn btn-green pill" href="{go(t, a)}" rel="sponsored nofollow noopener" target="_blank" data-b26-get="{slugify(t)}">Get the book</a></div>'
            f'</div></article>')

    main = f'''<main id="main" class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/library/">Library</a></li><li aria-current="page">Books that defined 2026</li></ol></nav>
<section class="b26-hero">
<div><p class="mono rise d1">The year in books · 3 minute read</p>
<h1 class="rise d1">Books that defined <em>2026</em></h1>
<p class="lede rise d2" style="margin-top:14px">The 20 nonfiction books people talked about most this year, sorted by what they help with. 1 idea to keep from each, so you know which ones are worth your time.</p>
<div class="b26-stats rise d2"><div><b>20</b><span>books</span></div><div><b>5</b><span>life areas</span></div><div><b>1</b><span>idea each</span></div></div></div>
<div class="b26-art rise d2">{shelf}<div class="b26-key" aria-hidden="true">{key}</div></div>
</section>

<section aria-labelledby="b26-list"><h2 id="b26-list" style="font-size:28px">Pick an area</h2>
<p style="color:var(--soft);margin:4px 0 10px">Each area has 1 book marked <b>Start here</b>: the easiest way in.</p>
<div class="b26-pills" role="group" aria-label="Filter by area">{"".join(pills)}</div>
<div class="b26-grid">{"".join(cards)}</div>
</section>

<section style="margin-top:26px" aria-labelledby="b26-next"><h2 id="b26-next" style="font-size:28px">Make 2027 your reading year</h2>
<div class="b26-next" style="margin-top:12px">
<a class="card" href="/library/challenge/?utm_source=books2026"><p class="mono">For January</p><h3 style="font-size:22px;margin-top:6px">The Useful Reading Challenge 2027</h3><p style="margin-top:6px;color:var(--ink2)">A book a month with prompts and a tracker, so the books on this page actually get read.</p></a>
<a class="card" href="/library/wrapped/?utm_source=books2026"><p class="mono">Free · 2 minutes</p><h3 style="font-size:22px;margin-top:6px">Your 2026 in books</h3><p style="margin-top:6px;color:var(--ink2)">Add what you read this year and get your own reading wrap-up to share.</p></a>
</div></section>

<section class="card" style="margin-top:22px" aria-labelledby="b26-faq"><h2 id="b26-faq" style="font-size:28px">Questions</h2>
{"".join(f'<details style="margin-top:14px"><summary style="font-weight:700;cursor:pointer">{html.escape(q)}</summary><p style="margin-top:8px;color:var(--ink2)">{html.escape(a)}</p></details>' for q, a in FAQ)}
</section>
<script>
(function(){{
var ps=[].slice.call(document.querySelectorAll("[data-b26]")),cs=[].slice.call(document.querySelectorAll(".b26-b"));
function pick(k){{ps.forEach(function(p){{p.setAttribute("aria-pressed",p.dataset.b26===k)}});
cs.forEach(function(c){{c.hidden=!(k==="all"||c.dataset.area===k)}});
try{{history.replaceState(null,"",k==="all"?location.pathname:"?area="+k)}}catch(e){{}}}}
ps.forEach(function(p){{p.addEventListener("click",function(){{pick(p.dataset.b26)}})}});
document.querySelector(".b26-pills").addEventListener("keydown",function(e){{
if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;var i=ps.indexOf(document.activeElement);if(i<0)return;
e.preventDefault();var n=ps[(i+(e.key==="ArrowRight"?1:ps.length-1))%ps.length];n.focus();n.click();
n.scrollIntoView({{block:"nearest",inline:"nearest"}});}});
[].forEach.call(document.querySelectorAll(".b26-shelf a"),function(a){{a.addEventListener("click",function(){{
var c=document.querySelector(a.getAttribute("href"));if(c&&c.hidden)pick("all");}})}});
var g=(location.search.match(/[?&]area=([a-z]+)/)||[])[1];if(g&&document.querySelector('[data-b26="'+g+'"]'))pick(g);
}})();
</script>
'''
    return head + "</head>" + body_top + main + "</main>" + foot


if __name__ == "__main__":
    if "--preview" in sys.argv:
        dest = sys.argv[sys.argv.index("--preview") + 1]
        open(dest, "w").write(page()); print("preview ok", dest); sys.exit(0)
    today_ist = (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) + datetime.timedelta(hours=5, minutes=30)).date()
    if today_ist < LIVE_ON:
        print(f"books2026: not live until {LIVE_ON} IST (today {today_ist}); nothing written"); sys.exit(0)
    os.makedirs(os.path.join(L, "2026"), exist_ok=True)
    out = page()
    open(os.path.join(L, "2026", "index.html"), "w").write(out)
    print("books2026 ok", len(out))
