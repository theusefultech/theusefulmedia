"""Builds /library/2027/ (Your 2027 reading plan) from the Library's own page chrome. Free: no Claude, no server.
Raja, 24 Nov 2026 (web estate item 29, "A"): pick 1 goal, get the 3 Library books to start 2027 with (Jan, Feb, Mar),
then the paid Reading Challenge ($29 until 31 Dec, $39 after). A free taste of the Challenge, never the full 12 books.
The rabbit hole link (theusefulmedia.com/apps, live 26 Dec) shows from 26 Dec only, so it never points at a missing page.
Usage: python3 scripts/build_plan2027.py   (re-run after the Library chrome or a book cover changes)"""
import re, os, json, html, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.join(ROOT, "library")
src = open(os.path.join(L, "about", "index.html")).read()
PATH = "/library/2027/"
TITLE = "Your 2027 reading plan: 1 goal, 3 books to start the year · The Useful Library"
DESC = "Pick 1 goal for 2027: better habits, more focus, better money or a steadier mind. Get the 3 books to read in January, February and March, with the chapters that matter. Free."

GOALS = [
    ("habits", "Build habits that last", "For the goal you've set 3 years running.", [
        ("tiny-habits", "Start so small you can't fail. Read it in the first week of January."),
        ("atomic-habits", "Stack and track the habits from January, so they survive February."),
        ("the-power-of-habit", "Find the cue behind the 1 habit you still can't break."),
    ]),
    ("focus", "Get your focus back", "For the year you finally finish the big thing.", [
        ("indistractable", "Fix what pulls you away before you try to work harder."),
        ("deep-work", "Book 2 to 4 hours of real work a day and protect them."),
        ("four-thousand-weeks", "Drop the plan to do everything and pick what matters."),
    ]),
    ("money", "Sort out your money", "For the year your money stops being a worry.", [
        ("the-psychology-of-money", "Why you spend the way you do. Read this before any budget."),
        ("i-will-teach-you-to-be-rich", "Automate saving and spending in 1 weekend."),
        ("the-little-book-of-common-sense-investing", "The simplest way to invest what you save, and leave it alone."),
    ]),
    ("mindset", "Steady your mind", "For the year hard days stop knocking you over.", [
        ("the-obstacle-is-the-way", "Turn the next setback into the next step."),
        ("mindset", "Swap \"I'm not good at this\" for \"not yet\"."),
        ("mans-search-for-meaning", "Find the why that carries you through the rest of the year."),
    ]),
]
MONTHS = ["January", "February", "March"]


def book(slug):
    h = open(os.path.join(L, "books", slug, "index.html")).read()
    title = html.unescape(re.search(r"<title>([^<:]*)", h).group(1)).strip()
    cover = re.search(r'<img[^>]+src="(/library/img/covers/[^"]+)"', h).group(1)
    return title, cover


head, rest = src.split("</head>", 1)
head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(TITLE)}</title>", head, flags=re.S)
def meta(attr, key, val):
    global head
    head = re.sub(rf'<meta {attr}="{re.escape(key)}" content="[^"]*">', f'<meta {attr}="{key}" content="{html.escape(val, quote=True)}">', head)
meta("name", "description", DESC); meta("property", "og:title", "Your 2027 reading plan"); meta("property", "og:description", DESC)
meta("property", "og:url", "https://theusefulmedia.com" + PATH); meta("property", "og:image", "https://theusefulmedia.com/library/og/challenge.png")
head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://theusefulmedia.com{PATH}">', head)
FAQ = [
    ("Is it free?", "Yes. Pick a goal and the plan is yours. No sign-up."),
    ("Why only 3 books?", "3 books in 3 months is a plan people finish. Each book page tells you which chapters to read and which to skip, so each one takes a few evenings."),
    ("What about the rest of 2027?", "The Useful Reading Challenge 2027 gives you 12 books, 1 a month, with a monthly prompt, a tracker and a small group reading with you."),
]
ld = {"@context": "https://schema.org", "@graph": [
    {"@type": "WebPage", "name": "Your 2027 reading plan", "url": "https://theusefulmedia.com" + PATH, "description": DESC, "publisher": {"@id": "https://theusefulmedia.com/#org"}},
    {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}]}
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld) + "</script>", head, flags=re.S)
head += """<style>
.p27-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;align-items:center;margin:18px 0 26px}
.p27-art svg{width:100%;max-width:360px;height:auto;display:block;margin:auto}
.p27-goals{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:8px}
.p27-goal{all:unset;box-sizing:border-box;cursor:pointer;border:2px solid var(--ink,#1C2B24);border-radius:18px;padding:14px 16px;background:var(--paper,#FBFBF8);min-height:96px;display:flex;flex-direction:column;gap:4px;transition:transform .15s}
.p27-goal b{font-size:17px}.p27-goal span{font-size:14px;color:var(--muted,#5b6b62)}
.p27-goal:hover{transform:translateY(-2px)}.p27-goal:focus-visible{outline:3px solid #B8913A;outline-offset:3px}
.p27-goal[aria-pressed=true]{background:#2F6B4F;color:#FBFBF8}.p27-goal[aria-pressed=true] span{color:#DCE8E1}
.p27-plan{margin-top:22px}
.p27-books{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}
.p27-b{display:flex;gap:14px;align-items:flex-start;text-decoration:none;color:inherit;border:1px solid var(--line,#D9E0DB);border-radius:16px;padding:12px;background:var(--paper,#FBFBF8)}
.p27-b img{width:76px;height:auto;border-radius:6px;box-shadow:0 6px 16px rgba(28,43,36,.18);flex:none}
.p27-m{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#B8913A}
.p27-t{font-weight:700;font-size:16px;margin:2px 0 4px}.p27-w{font-size:14px;color:var(--soft,#3f4f46)}
.p27-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.p27-rh{margin-top:18px}
@media (max-width:760px){.p27-hero{grid-template-columns:1fr}.p27-art{order:-1}.p27-art svg{max-width:240px}.p27-goals{grid-template-columns:1fr 1fr}.p27-books{grid-template-columns:1fr}}
</style>
"""

body_top, after = rest.split("<main", 1)
main_old, foot = after.split("</main>", 1)
body_top = body_top.replace(' aria-current="page"', "")

# hero art: 3 books standing on a shelf with a 2027 tag (data-visual for scripts/visual_check.py)
art = ('<svg data-visual viewBox="0 0 360 300" role="img" aria-label="3 books on a shelf with a 2027 tag">'
       '<circle cx="180" cy="160" r="135" fill="var(--mint,#E3EEE7)"/>'
       '<g stroke="#1C2B24" stroke-width="3" stroke-linejoin="round">'
       '<rect x="88" y="92" width="52" height="160" rx="6" fill="#2F6B4F"/><path d="M100 92v160" stroke-width="1.5" opacity=".4"/>'
       '<rect x="146" y="72" width="58" height="180" rx="6" fill="#B8913A"/><path d="M158 72v180" stroke-width="1.5" opacity=".4"/>'
       '<rect x="210" y="104" width="50" height="148" rx="6" fill="#6B3A3A" transform="rotate(8 235 252)"/>'
       '<rect x="60" y="252" width="240" height="14" rx="4" fill="#8A6B22"/>'
       '<g transform="translate(250 70) rotate(10)"><rect x="-44" y="-20" width="88" height="40" rx="8" fill="#FBFBF8"/>'
       '<text x="0" y="10" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="28" fill="#1C2B24" stroke="none">2027</text></g>'
       '</g><g fill="#B8913A"><path d="M62 82l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M312 170l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g></svg>')

goals_html, plans = [], {}
for key, name, sub, picks in GOALS:
    goals_html.append(f'<button type="button" class="p27-goal" aria-pressed="false" data-p27="{key}"><b>{html.escape(name)}</b><span>{html.escape(sub)}</span></button>')
    cards = []
    for i, (slug, why) in enumerate(picks):
        t, cover = book(slug)
        cards.append(f'<a class="p27-b" href="/library/books/{slug}/?utm_source=plan2027"><img src="{cover}" alt="{html.escape(t, quote=True)} cover" width="76" height="114" loading="lazy" decoding="async">'
                     f'<span><span class="p27-m">{MONTHS[i]}</span><span class="p27-t" style="display:block">{html.escape(t)}</span><span class="p27-w">{html.escape(why)}</span></span></a>')
    plans[key] = (name, "".join(cards))

plan_html = "".join(f'<div class="p27-books" data-p27-plan="{k}" hidden>{c}</div>' for k, (n, c) in plans.items())
main = f'''<main id="main" class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/library/">Library</a></li><li aria-current="page">Your 2027 reading plan</li></ol></nav>
<section class="p27-hero">
<div><p class="mono rise d1">Free · 2 minutes</p>
<h1 class="rise d1">Your 2027 <em>reading plan</em></h1>
<p class="lede rise d2" style="margin-top:14px">Pick the 1 thing you want to change in 2027. Get the 3 books to read in January, February and March, in the order that works, with only the chapters that matter.</p></div>
<div class="p27-art rise d2">{art}</div>
</section>

<section class="card" aria-labelledby="p27-pick"><h2 id="p27-pick" style="font-size:28px">1. Pick your goal for 2027</h2>
<div class="p27-goals" role="group" aria-label="Goals">{"".join(goals_html)}</div>
<div class="p27-plan" data-p27-out hidden><h2 style="font-size:28px">2. Your first 3 books</h2><p style="color:var(--soft);margin-top:4px" data-p27-sum></p>
{plan_html}
<div class="p27-acts"><button type="button" class="btn btn-line pill" data-p27-save>Save my plan</button><a class="btn btn-line pill" data-p27-cal href="#">Add January's book to my calendar</a></div>
<p class="p27-rh" data-p27-rh hidden>Want an app to keep the goal going? <a href="https://theusefulmedia.com/apps/rabbit-holes/apps-for-your-2027-goals/?utm_source=plan2027">Apps for your 2027 goals</a></p>
</div></section>

<section class="dark" style="margin-top:22px;padding:26px;border-radius:24px" aria-label="The Useful Reading Challenge 2027">
<p class="mono">The other 9 months</p><h2 style="margin-top:6px;color:var(--paper);font-size:30px">The Useful Reading Challenge 2027</h2>
<p style="margin-top:8px;color:#CFD8D2;font-size:16px">12 books, 1 a month, each with 1 idea to test for 30 days. A monthly prompt, a tracker and a small group of readers doing it with you.</p>
<a class="btn btn-green pill" style="margin-top:16px" href="/library/challenge/?utm_source=plan2027" data-p27-price>Join for $29 until 31 Dec</a>
<p style="margin-top:8px;color:#A9B8AF;font-size:14px" data-p27-after>$39 from 1 January.</p></section>

<section class="card" style="margin-top:22px" aria-labelledby="p27-faq"><h2 id="p27-faq" style="font-size:28px">Questions</h2>
{"".join(f'<details style="margin-top:14px"><summary style="font-weight:700;cursor:pointer">{html.escape(q)}</summary><p style="margin-top:8px;color:var(--ink2)">{html.escape(a)}</p></details>' for q, a in FAQ)}
</section>
<script>
(function(){{
var T=new Date(),D=T.getFullYear()*1e4+(T.getMonth()+1)*100+T.getDate(),K="lib:plan2027";
var bs=[].slice.call(document.querySelectorAll("[data-p27]")),out=document.querySelector("[data-p27-out]"),sum=document.querySelector("[data-p27-sum]");
var cal=document.querySelector("[data-p27-cal]"),save=document.querySelector("[data-p27-save]"),cur=null;
if(D>=20261226)document.querySelector("[data-p27-rh]").hidden=false;
if(D>=20270101){{var p=document.querySelector("[data-p27-price]");p.textContent="Join for $39";document.querySelector("[data-p27-after]").textContent="12 books for 2027, 1 a month.";}}
function pick(k,scroll){{cur=k;bs.forEach(function(b){{b.setAttribute("aria-pressed",b.dataset.p27===k)}});
[].forEach.call(document.querySelectorAll("[data-p27-plan]"),function(p){{p.hidden=p.dataset.p27Plan!==k}});
out.hidden=false;var b=document.querySelector('[data-p27="'+k+'"] b');sum.textContent="Goal: "+b.textContent+". 1 book a month, January to March.";
var first=document.querySelector('[data-p27-plan="'+k+'"] .p27-t').textContent;
var ics="BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//The Useful Library//2027 plan//EN\\r\\nBEGIN:VEVENT\\r\\nUID:plan2027-"+k+"@theusefulmedia.com\\r\\nDTSTAMP:20261201T000000Z\\r\\nDTSTART;VALUE=DATE:20270102\\r\\nDTEND;VALUE=DATE:20270103\\r\\nSUMMARY:Start reading "+first.replace(/[,;]/g,"")+"\\r\\nDESCRIPTION:Your 2027 reading plan: https://theusefulmedia.com/library/2027/\\r\\nEND:VEVENT\\r\\nEND:VCALENDAR\\r\\n";
cal.href="data:text/calendar;charset=utf-8,"+encodeURIComponent(ics);cal.setAttribute("download","2027-reading-plan.ics");
if(scroll)out.scrollIntoView({{behavior:"smooth",block:"start"}});}}
bs.forEach(function(b){{b.addEventListener("click",function(){{pick(b.dataset.p27,true)}})}});
save.addEventListener("click",function(){{try{{localStorage.setItem(K,cur);save.textContent="Saved on this device"}}catch(e){{save.textContent="Bookmark this page to keep it"}}}});
var g=(location.search.match(/[?&]goal=([a-z]+)/)||[])[1];try{{var s=g||localStorage.getItem(K);if(s&&document.querySelector('[data-p27="'+s+'"]'))pick(s,false)}}catch(e){{}}
}})();
</script>
'''
out = head + "</head>" + body_top + main + "</main>" + foot
os.makedirs(os.path.join(L, "2027"), exist_ok=True)
open(os.path.join(L, "2027", "index.html"), "w").write(out)
print("plan2027 ok", len(out))
