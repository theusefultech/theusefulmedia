"""Builds /library/wrapped/ (Your 2026 in Books, Reading Wrapped) from the Library's own page chrome.
Raja, 18 Nov 2026 ("4"): a free, shareable year-in-books story for The Useful Life readers. Runs in the browser, no server.
Usage: python3 scripts/build_wrapped.py   (re-run after the Library chrome changes)"""
import re, hashlib, os, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.join(ROOT, "library")
src = open(os.path.join(L, "about", "index.html")).read()
YEAR = 2026
PATH = "/library/wrapped/"
TITLE = f"Your {YEAR} in Books: a free Reading Wrapped for book lovers · The Useful Library"
DESC = f"Add the books you read in {YEAR}, or import Goodreads or StoryGraph, and get a story of your reading year: pages, best month, reader type, book of the year. Free, no sign-up."
def ver(rel):
    return hashlib.md5(open(os.path.join(ROOT, rel.lstrip("/")), "rb").read()).hexdigest()[:8]

head, rest = src.split("</head>", 1)
# swap the page-specific head tags
head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(TITLE)}</title>", head, flags=re.S)
def meta(attr, key, val):
    global head
    head = re.sub(rf'<meta {attr}="{re.escape(key)}" content="[^"]*">', f'<meta {attr}="{key}" content="{html.escape(val, quote=True)}">', head)
meta("name", "description", DESC); meta("property", "og:title", f"Your {YEAR} in Books"); meta("property", "og:description", DESC)
meta("property", "og:url", "https://theusefulmedia.com" + PATH); meta("property", "og:image", "https://theusefulmedia.com/library/wrapped/og.png")
head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://theusefulmedia.com{PATH}">', head)
ld = {"@context": "https://schema.org", "@graph": [
    {"@type": "WebApplication", "name": f"Your {YEAR} in Books", "alternateName": f"Reading Wrapped {YEAR}", "url": "https://theusefulmedia.com" + PATH, "applicationCategory": "LifestyleApplication", "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "description": DESC, "publisher": {"@id": "https://theusefulmedia.com/#org"}},
    {"@type": "FAQPage", "mainEntity": []}]}
FAQ = [
    ("Is it free?", "Yes. No sign-up, no email needed to make your story."),
    ("Where does my list go?", "Nowhere. It stays in this browser on this device. Only the book searches go to Open Library to find covers and page counts. Your share link carries the list inside the link itself."),
    ("How do I import from Goodreads?", "On the Goodreads website, open My Books, then Import and export, then Export Library. Download the file and pick it here. We keep the books on your Read shelf with a {} date.".format(YEAR)),
    ("How do I import from StoryGraph?", "On the StoryGraph website, open your profile menu, then Manage Account, then Export StoryGraph Library. Download the file from the email and pick it here."),
    ("How is my reader type picked?", "By simple rules on your list: how many books, how long they are, how old they are and what they're about. Nothing is guessed by AI."),
]
ld["@graph"][1]["mainEntity"] = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld) + "</script>", head, flags=re.S)
# PREVIEW until Raja approves: keep it out of search; flip to False to go live
PREVIEW = False
if PREVIEW: head = head.replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"', 1)
head += f'<link rel="stylesheet" href="/library/wrapped/wrapped.css?v={ver("library/wrapped/wrapped.css")}">\n<script src="/library/wrapped/wrapped.js?v={ver("library/wrapped/wrapped.js")}" defer></script>\n'

body_top, after = rest.split("<main", 1)
main_old, foot = after.split("</main>", 1)
body_top = body_top.replace(' aria-current="page"', "")

# hero art: a stack of books with a brass 2026 ribbon
spines = [("#2F6B4F", 250, 0), ("#B8913A", 228, -3), ("#4E8A6C", 262, 2), ("#6B3A3A", 236, -2), ("#3A5BA0", 254, 3), ("#E3EEE7", 222, -1)]
art = ['<svg class="wr-shelfart" viewBox="0 0 400 400" role="img" aria-label="A stack of books tied with a 2026 ribbon">',
       '<circle cx="200" cy="210" r="170" fill="var(--mint)"/>',
       '<g stroke="#1C2B24" stroke-width="3" stroke-linejoin="round">']
y = 330
for i, (c, w, r) in enumerate(spines):
    x = 200 - w / 2
    art.append(f'<g transform="rotate({r} 200 {y})" style="animation:rise .6s var(--ease) {i*0.08:.2f}s both"><rect x="{x:.0f}" y="{y-34}" width="{w}" height="34" rx="5" fill="{c}"/><path d="M{x+18:.0f} {y-34}V{y}" stroke-width="1.5" opacity=".4"/><path d="M{x+w-50:.0f} {y-22}h28" stroke="{"#1C2B24" if c=="#E3EEE7" else "#FBFBF8"}" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>')
    y -= 36
art.append("</g>")
art.append(f'<g transform="translate(200 128)"><path d="M-112 -4 L-86 -22 L-86 28 L-112 14 Z M112 -4 L86 -22 L86 28 L112 14 Z" fill="#8A6B22" stroke="#1C2B24" stroke-width="3" stroke-linejoin="round"/><rect x="-92" y="-26" width="184" height="52" rx="8" fill="#B8913A" stroke="#1C2B24" stroke-width="3"/><text x="0" y="13" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="38" fill="#1C2B24">{YEAR}</text></g>')
art.append('<g fill="#B8913A"><path d="M66 96l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/><path d="M336 74l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M344 200l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g></svg>')
art = "".join(art)

search_ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
main = f'''<main id="main" class="wrap" data-wrap>
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/library/">Library</a></li><li aria-current="page">Your {YEAR} in books</li></ol></nav>
<div class="wr-friend" data-wr-friend hidden><b>A friend's {YEAR} in books</b><button type="button" class="btn btn-ink pill">Play it again</button></div>
<section class="wr-hero-sec">
<div><p class="mono rise d1">Free · {YEAR} reading recap</p>
<h1 class="rise d1">Your {YEAR} <em>in books</em></h1>
<p class="lede rise d2" style="margin-top:14px">Add the books you finished this year and get a story of your reading year: pages turned, your best month, your reader type and your book of the year. Then save it for Instagram Stories or send a friend your link.</p>
<div class="wr-ph rise d3"><a class="btn btn-green pill" href="#add">Add my books</a><a class="btn btn-line pill" href="#add" data-wr-goimport>Import from Goodreads</a></div>
<p class="wr-trust rise d3"><span>No sign-up</span><span>Stays on your device</span><span>Goodreads and StoryGraph</span></p></div>
<div class="wr-art rise d2">{art}</div>
</section>

<section id="add" class="wr-build" aria-label="Your books">
<div>
<div class="wr-tabs" role="tablist" aria-label="How to add books"><button type="button" role="tab" aria-selected="true" data-wr-tab="search">Search books</button><button type="button" role="tab" aria-selected="false" data-wr-tab="import">Import a file</button></div>
<div data-wr-pane="search"><div class="wr-find" data-wr-find>{search_ic}<label class="vh" for="wr-q">Search a book you read in {YEAR}</label><input id="wr-q" type="search" autocomplete="off" placeholder="Type a book you finished in {YEAR}" data-wr-q><div class="wr-res" data-wr-res hidden></div></div>
<p style="font-size:14px;color:var(--muted);margin-top:8px">Covers and page counts come from Open Library. Add a star rating and the month you finished it for a better story.</p></div>
<div data-wr-pane="import" hidden>
<ol class="wr-steps"><li><b>Goodreads:</b> My Books, then Import and export, then Export Library. Download the file.</li><li><b>StoryGraph:</b> Manage Account, then Export StoryGraph Library. The file comes by email.</li><li>Pick the file here. It's read on this device, never uploaded.</li></ol>
<label class="wr-file"><input type="file" accept=".csv,text/csv" data-wr-file><span>Choose your export file (.csv)</span></label><p class="wr-imp" role="status" aria-live="polite" data-wr-imp></p></div>
<div class="wr-head"><h3>Books I finished in {YEAR}</h3><span class="wr-count" data-wr-count>No books yet</span></div>
<p class="wr-empty" data-wr-empty>Your list is empty. Search a book above, or import your Goodreads or StoryGraph file.</p>
<ul class="wr-list" data-wr-list></ul>
<p style="margin-top:12px"><button type="button" class="wr-clear" data-wr-clear>Clear my list</button></p>
</div>
<aside class="wr-side">
<div class="dark"><p class="mono">Your story</p><h3 style="margin-top:6px">8 cards about your year</h3>
<ul class="wr-get"><li>Books and pages, as a stack</li><li>Your longest read</li><li>Your best month</li><li>What you read about</li><li>Your reader type</li><li>Your book of the year</li></ul>
<label class="wr-nm">Your first name for the cards <small style="font-weight:400;color:#A9B8AF">optional</small><input type="text" maxlength="24" autocomplete="given-name" placeholder="Leave empty for &quot;My&quot;" data-wr-name></label>
<button type="button" class="btn btn-green pill wr-go" data-wr-go disabled>Make my {YEAR} in books</button><p class="wr-need" data-wr-need>Add 3 books to make your story</p></div>
</aside>
</section>

<section class="wr-after" data-wr-after hidden aria-label="After your story">
<div class="card"><p class="mono">Next year's shelf</p><h3 style="margin-top:6px">3 books to start {YEAR+1}</h3><p style="font-size:15px;color:var(--soft);margin-top:6px">Picked from what you read most this year, minus what you've already read.</p><div class="wr-n3s" data-wr-next3></div></div>
<div class="dark"><p class="mono">Read more in {YEAR+1}</p><h3 style="margin-top:6px;color:var(--paper)">The Useful Reading Challenge {YEAR+1}</h3><p style="margin-top:8px;color:#CFD8D2;font-size:16px">12 monthly prompts, a tracker that shows your progress, and a small group of readers doing it with you. Beat this year's number.</p><a class="btn btn-green pill" style="margin-top:16px" href="/library/challenge/?utm_source=wrapped">See the challenge</a></div>
</section>

<section class="card" aria-labelledby="wr-faq"><h2 id="wr-faq" style="font-size:32px">Questions</h2>
{"".join(f'<details style="margin-top:14px"><summary style="font-weight:700;cursor:pointer">{html.escape(q)}</summary><p style="margin-top:8px;color:var(--ink2)">{html.escape(a)}</p></details>' for q, a in FAQ)}
</section>

<dialog class="wr-story" data-wr-story aria-label="Your {YEAR} in books">
<div class="wr-shell"><button type="button" class="wr-nav p" data-wr-prev aria-label="Previous card">‹</button>
<div class="wr-frame"><div class="wr-bars" data-wr-bars aria-hidden="true"></div>
<div class="wr-top"><span>The Useful Library</span><button type="button" data-wr-close aria-label="Close the story">×</button></div>
<div class="wr-stage" data-wr-stage aria-live="polite"></div>
<div class="wr-foot" data-wr-foot></div></div>
<button type="button" class="wr-nav n" data-wr-next aria-label="Next card">›</button></div>
</dialog>
<div class="wr-note" data-wr-note role="status" aria-live="polite"></div>
'''
# the "Import from Goodreads" hero button opens the import tab
main = main.replace("</dialog>", "</dialog>\n<script>document.addEventListener('click',function(e){var b=e.target.closest('[data-wr-goimport]');if(b){var t=document.querySelector('[data-wr-tab=import]');if(t)t.click();}});</script>", 1)
out = head + "</head>" + body_top + main + "</main>" + foot
os.makedirs(os.path.join(L, "wrapped"), exist_ok=True)
open(os.path.join(L, "wrapped", "index.html"), "w").write(out)
print("wrapped ok", len(out))
