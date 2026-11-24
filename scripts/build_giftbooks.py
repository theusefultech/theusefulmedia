"""Builds /library/gift/ (Gift a book) from the Library's own page chrome. Free: no Claude, no server.
Raja, 24 Nov 2026 (Season Plan L5, "A"): pick who you're buying for, get 3 Library books for them, each with a
1-line reason, a note to write inside the cover, and a /go/ book link (Amazon, the right store per country).
Usage: python3 scripts/build_giftbooks.py   (re-run after the Library chrome or a book cover changes)"""
import re, os, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.join(ROOT, "library")
src = open(os.path.join(L, "about", "index.html")).read()
PATH = "/library/gift/"
TITLE = "Gift a book: the right nonfiction book for everyone on your list · The Useful Library"
DESC = "Pick who you're buying for and get 3 nonfiction books that fit them, with why each one fits and a note to write inside the cover. Free, no sign-up."

PEOPLE = [
    ("goals", "The one with a big 2027 goal", "Every January, a fresh start.", [
        ("tiny-habits", "Starts with habits so small they can't fail, which is why the goal survives February.", "For the habit that finally sticks this year."),
        ("atomic-habits", "The most practical habit book there is. Short chapters, easy to dip into.", "1% better every day. I'll be checking in."),
        ("the-one-thing", "For the person with 9 goals. It makes them pick the 1 that moves the rest.", "Pick 1 thing. I believe you'll do it."),
    ]),
    ("busy", "The one who's always busy", "Never off, never done.", [
        ("four-thousand-weeks", "Gives them permission to stop trying to do everything. A relief to read.", "You don't have to do it all. Read this slowly."),
        ("rest", "Shows that rest is part of good work, not the opposite of it.", "This one is an order: take a break."),
        ("essentialism", "Teaches the polite no. They'll get hours back by March.", "Less, but better. Starting now."),
    ]),
    ("phone", "The one glued to their phone", "Screen time report: don't ask.", [
        ("digital-minimalism", "A 30-day phone reset that people actually finish. No guilt, just a plan.", "30 days. I'll do it with you."),
        ("indistractable", "Fixes the urge to check, not just the apps. Friendly, never preachy.", "For the hours we get back."),
        ("make-time", "Light, fun tactics they can try the same day. Great for non-readers.", "Pick 1 tactic tomorrow. Tell me how it goes."),
    ]),
    ("money", "The one starting out with money", "First job, first rent, first budget.", [
        ("the-psychology-of-money", "Short stories about money and behaviour. The book people pass on to friends.", "Read this before you read any budget."),
        ("i-will-teach-you-to-be-rich", "Sets up saving and spending on autopilot in a weekend.", "Future you says thanks."),
        ("broke-millennial", "Plain answers to the money questions they're too embarrassed to ask.", "No dumb questions in here. Ask me too."),
    ]),
    ("thinker", "The one who has everything", "Dads, mentors, deep thinkers.", [
        ("meditations", "2,000 years old and still the calmest book on any shelf. A gift that lasts.", "For the mornings with coffee."),
        ("thinking-fast-and-slow", "For the person who loves to know why people do what they do.", "For our next long argument."),
        ("the-little-book-of-common-sense-investing", "The simplest investing advice there is, from the man who invented index funds.", "Simple beats clever. Here's proof."),
    ]),
    ("hardyear", "The one who had a hard year", "A gift that says you noticed.", [
        ("the-obstacle-is-the-way", "Turns setbacks into next steps. Short, steady and practical.", "This year was hard. Next year is yours."),
        ("the-courage-to-be-disliked", "A conversation between 2 people that lightens a heavy mind.", "You're allowed to be happy. Read this."),
        ("mans-search-for-meaning", "The book people say changed how they see their worst days.", "For when you need a reason. You have plenty."),
    ]),
]


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s


def book(slug):
    h = open(os.path.join(L, "books", slug, "index.html")).read()
    title = html.unescape(re.search(r"<title>([^<:]*)", h).group(1)).strip()
    cover = re.search(r'<img[^>]+src="(/library/img/covers/[^"]+)"', h).group(1)
    m = re.search(r'"author": \{"@type": "Person", "name": "([^"]+)"', h)
    author = m.group(1) if m else ""
    first = re.split(r" with | and ", author)[0]
    go = "/go/" + slugify(title + " " + first)
    return title, author, cover, go


head, rest = src.split("</head>", 1)
head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(TITLE)}</title>", head, flags=re.S)
def meta(attr, key, val):
    global head
    head = re.sub(rf'<meta {attr}="{re.escape(key)}" content="[^"]*">', f'<meta {attr}="{key}" content="{html.escape(val, quote=True)}">', head)
meta("name", "description", DESC); meta("property", "og:title", "Gift a book"); meta("property", "og:description", DESC)
meta("property", "og:url", "https://theusefulmedia.com" + PATH)
head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://theusefulmedia.com{PATH}">', head)
FAQ = [
    ("How did you pick these books?", "Every book here has its own page in The Useful Library with a verdict, the ideas worth keeping and who should skip it. Each one is matched to the kind of person it suits best, not pulled from a bestseller list."),
    ("Where do the links go?", "To the book on Amazon, in the right store for your country. If you buy, The Useful Library may earn a small commission at no cost to you."),
    ("Can I send a book by email?", "Yes, many of these are on Kindle, and Amazon lets you send a Kindle book as a gift by email on the day you choose. Handy if the delivery date is too close."),
    ("What should I write inside?", "Each pick comes with a short note you can copy and write inside the cover. A personal line is what makes a book feel like a gift."),
]
ld = {"@context": "https://schema.org", "@graph": [
    {"@type": "WebPage", "name": "Gift a book", "url": "https://theusefulmedia.com" + PATH, "description": DESC, "publisher": {"@id": "https://theusefulmedia.com/#org"}},
    {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}]}
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld) + "</script>", head, flags=re.S)
head += """<style>
.gb-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;align-items:center;margin:18px 0 26px}
.gb-art svg{width:100%;max-width:340px;height:auto;display:block;margin:auto}
.gb-who{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}
.gb-p{all:unset;box-sizing:border-box;cursor:pointer;border:2px solid var(--ink,#1C2B24);border-radius:18px;padding:14px 16px;background:var(--paper,#FBFBF8);min-height:86px;display:flex;flex-direction:column;gap:4px;transition:transform .15s}
.gb-p b{font-size:17px}.gb-p span{font-size:14px;color:var(--muted,#5b6b62)}
.gb-p:hover{transform:translateY(-2px)}.gb-p:focus-visible{outline:3px solid #B8913A;outline-offset:3px}
.gb-p[aria-pressed=true]{background:#2F6B4F;color:#FBFBF8}.gb-p[aria-pressed=true] span{color:#DCE8E1}
.gb-out{margin-top:22px}
.gb-books{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}
.gb-b{display:flex;flex-direction:column;gap:10px;border:1px solid var(--line,#D9E0DB);border-radius:16px;padding:14px;background:var(--paper,#FBFBF8)}
.gb-top{display:flex;gap:14px;align-items:flex-start}
.gb-b img{width:84px;height:auto;border-radius:6px;box-shadow:0 6px 16px rgba(28,43,36,.18);flex:none}
.gb-t{font-weight:700;font-size:16px;margin:0 0 2px}.gb-a{font-size:13px;color:var(--muted,#5b6b62)}
.gb-w{font-size:14px;color:var(--soft,#3f4f46);margin-top:6px}
.gb-note{border:1px dashed #B8913A;border-radius:12px;padding:10px 12px;font-family:"DM Serif Display",Georgia,serif;font-size:16px;color:#1C2B24;background:#FFF9EC;display:flex;justify-content:space-between;gap:10px;align-items:center}
.gb-note button{all:unset;cursor:pointer;font:700 12px Manrope,system-ui,sans-serif;color:#2F6B4F;white-space:nowrap}
.gb-note button:focus-visible{outline:2px solid #B8913A;outline-offset:2px}
.gb-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.gb-acts{flex-wrap:nowrap}.gb-acts a{font-size:14px;padding:10px 14px;white-space:nowrap}
@media (max-width:760px){.gb-hero{grid-template-columns:1fr}.gb-art{order:-1}.gb-art svg{max-width:220px}.gb-who{grid-template-columns:1fr 1fr}.gb-books{grid-template-columns:1fr}}
</style>
"""

body_top, after = rest.split("<main", 1)
main_old, foot = after.split("</main>", 1)
body_top = body_top.replace(' aria-current="page"', "")

# hero art: a wrapped book with a ribbon and a gift tag (data-visual for scripts/visual_check.py)
art = ('<svg data-visual viewBox="0 0 340 300" role="img" aria-label="A book wrapped as a gift with a ribbon and a tag">'
       '<circle cx="170" cy="160" r="130" fill="var(--mint,#E3EEE7)"/>'
       '<g stroke="#1C2B24" stroke-width="3" stroke-linejoin="round">'
       '<rect x="80" y="96" width="170" height="150" rx="10" fill="#2F6B4F"/>'
       '<path d="M250 106c10 4 14 12 14 22v108c0 8-6 14-14 14" fill="#F3EBDD"/>'
       '<rect x="150" y="96" width="26" height="150" fill="#B8913A"/>'
       '<rect x="80" y="160" width="170" height="22" fill="#B8913A"/>'
       '<path d="M163 96c-26-34-62-20-46-2 10 10 34 6 46 2zM163 96c26-34 62-20 46-2-10 10-34 6-46 2z" fill="#C9A24A"/>'
       '<circle cx="163" cy="96" r="9" fill="#8A6B22"/>'
       '<g transform="translate(262 196) rotate(14)"><path d="M-44-18h62l14 18-14 18h-62z" fill="#FBFBF8"/><circle cx="20" cy="0" r="3.5" fill="#1C2B24"/>'
       '<text x="-14" y="5" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="15" fill="#1C2B24" stroke="none">for you</text></g>'
       '</g><g fill="#B8913A"><path d="M62 80l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M296 92l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g></svg>')

who_html, outs = [], []
for key, name, sub, picks in PEOPLE:
    who_html.append(f'<button type="button" class="gb-p" aria-pressed="false" data-gb="{key}"><b>{html.escape(name)}</b><span>{html.escape(sub)}</span></button>')
    cards = []
    for slug, why, note in picks:
        t, a, cover, go = book(slug)
        cards.append(
            f'<div class="gb-b"><div class="gb-top"><img src="{cover}" alt="{html.escape(t, quote=True)} cover" width="84" height="126" loading="lazy" decoding="async">'
            f'<div><p class="gb-t">{html.escape(t)}</p><p class="gb-a">{html.escape(a)}</p><p class="gb-w">{html.escape(why)}</p></div></div>'
            f'<div class="gb-note"><span>&ldquo;{html.escape(note)}&rdquo;</span><button type="button" data-gb-copy="{html.escape(note, quote=True)}" aria-label="Copy the note for {html.escape(t, quote=True)}">Copy note</button></div>'
            f'<div class="gb-acts"><a class="btn btn-green pill" href="{go}" rel="sponsored nofollow noopener" target="_blank" data-gb-get="{slug}">Get the book</a>'
            f'<a class="btn btn-line pill" href="/library/books/{slug}/?utm_source=giftbooks">Read the verdict</a></div></div>')
    outs.append(f'<div class="gb-books" data-gb-out="{key}" hidden>{"".join(cards)}</div>')

main = f'''<main id="main" class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/library/">Library</a></li><li aria-current="page">Gift a book</li></ol></nav>
<section class="gb-hero">
<div><p class="mono rise d1">Free · 1 minute</p>
<h1 class="rise d1">Gift a <em>book</em></h1>
<p class="lede rise d2" style="margin-top:14px">Pick who you're buying for. Get 3 nonfiction books that fit them, why each one fits, and a short note to write inside the cover.</p></div>
<div class="gb-art rise d2">{art}</div>
</section>

<section class="card" aria-labelledby="gb-pick"><h2 id="gb-pick" style="font-size:28px">1. Who's it for?</h2>
<div class="gb-who" role="group" aria-label="Who the gift is for">{"".join(who_html)}</div>
<div class="gb-out" data-gb-wrap hidden><h2 style="font-size:28px">2. Pick 1 of these 3</h2><p style="color:var(--soft);margin-top:4px">Tap <b>Copy note</b> to write it inside the cover. Short on time? Many are on Kindle, which Amazon lets you send by email on the day.</p>
{"".join(outs)}
</div></section>

<section class="card" style="margin-top:22px" aria-labelledby="gb-more"><h2 id="gb-more" style="font-size:28px">Not sure yet?</h2>
<p style="margin-top:8px;color:var(--ink2)">Every book here has a full page with the verdict, the ideas worth keeping and who should skip it. Browse <a href="/library/books/?utm_source=giftbooks">all the books</a>, or give them a plan with it: <a href="/library/2027/?utm_source=giftbooks">Your 2027 reading plan</a> picks 3 books for January to March.</p></section>

<section class="card" style="margin-top:22px" aria-labelledby="gb-faq"><h2 id="gb-faq" style="font-size:28px">Questions</h2>
{"".join(f'<details style="margin-top:14px"><summary style="font-weight:700;cursor:pointer">{html.escape(q)}</summary><p style="margin-top:8px;color:var(--ink2)">{html.escape(a)}</p></details>' for q, a in FAQ)}
</section>
<script>
(function(){{
var bs=[].slice.call(document.querySelectorAll("[data-gb]")),wrap=document.querySelector("[data-gb-wrap]");
function pick(k,scroll){{bs.forEach(function(b){{b.setAttribute("aria-pressed",b.dataset.gb===k)}});
[].forEach.call(document.querySelectorAll("[data-gb-out]"),function(p){{p.hidden=p.dataset.gbOut!==k}});
wrap.hidden=false;try{{history.replaceState(null,"","?for="+k)}}catch(e){{}}
if(scroll)wrap.scrollIntoView({{behavior:"smooth",block:"start"}});}}
bs.forEach(function(b){{b.addEventListener("click",function(){{pick(b.dataset.gb,true)}})}});
[].forEach.call(document.querySelectorAll("[data-gb-copy]"),function(c){{c.addEventListener("click",function(){{
var t=c.dataset.gbCopy;function ok(){{c.textContent="Copied";setTimeout(function(){{c.textContent="Copy note"}},1600)}}
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){{c.textContent="Select and copy"}});else c.textContent="Select and copy";}})}});
var g=(location.search.match(/[?&]for=([a-z]+)/)||[])[1];if(g&&document.querySelector('[data-gb="'+g+'"]'))pick(g,false);
}})();
</script>
'''
out = head + "</head>" + body_top + main + "</main>" + foot
os.makedirs(os.path.join(L, "gift"), exist_ok=True)
open(os.path.join(L, "gift", "index.html"), "w").write(out)
print("giftbooks ok", len(out))
