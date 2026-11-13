#!/usr/bin/env python3
"""Bookshelves for The Useful Library (Raja, 13 Nov 2026, "A").
Builds "Books {person} recommends" pages and the most-recommended ranking from library/data/recs.json,
which the library-recs workflow pulls from the YouTube transcript engine (Cloudflare D1, yt_mentions).
Pages reuse the live shell of /library/books/ so they always match the site. Facts only: each pick links to
the exact video moment; notes are short paraphrases. No photos of people.
Thresholds: a person page needs 3+ books; the ranking needs 10+ people with pages."""
import html, json, os, re, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from library_books import BOOKS as BOOKPAGES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library")
BASE = "https://theusefulmedia.com"
DATA = os.path.join(LIB, "data", "recs.json")
MIN_BOOKS, MIN_PEOPLE = 3, 10
e = html.escape
norm = lambda s: re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()
OWN = {norm(b["t"]): b for b in BOOKPAGES}
OWN[norm("Atomic Habits")] = {"slug": "atomic-habits", "t": "Atomic Habits", "by": "James Clear"}
yt = lambda v, t: f"https://www.youtube.com/watch?v={v}&amp;t={int(t or 0)}s"
mmss = lambda t: f"{int(t or 0)//60}:{int(t or 0)%60:02d}"
def nice(iso):
    d = datetime.date.fromisoformat(iso); return f"{d.day} {d.strftime('%b %Y')}"

TPL = open(os.path.join(LIB, "books", "index.html")).read()
def shell(path, title, desc, main):
    h = TPL
    h = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", h, count=1, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(desc)}">', h, count=1)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{BASE}{path}">', h, count=1)
    for k, v in (("og:title", title), ("og:description", desc), ("og:url", BASE + path), ("twitter:title", title), ("twitter:description", desc)):
        h = re.sub(rf'(<meta (?:property|name)="{k}" content=")[^"]*(">)', lambda m: m.group(1) + e(v) + m.group(2), h, count=1)
    crumbs = [("Library", "/library/"), ("Bookshelves", "/library/people/")] + ([] if path == "/library/people/" else [(title.split(" | ")[0], path)])
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(crumbs)]}
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', f'<script type="application/ld+json">{json.dumps(ld)}</script>', h, count=1, flags=re.S)
    h = re.sub(r'<main id="main" class="wrap">.*?</main>', lambda m: f'<main id="main" class="wrap">{main}</main>', h, count=1, flags=re.S)
    return h

def crumbs_html(items):
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + "".join(f'<li aria-current="page">{e(n)}</li>' if i == len(items) - 1 else f'<li><a href="{u}">{e(n)}</a></li>' for i, (n, u) in enumerate(items)) + "</ol></nav>"

def hero(kicker, h1, lede, date):
    return f'<section style="display:flex;flex-direction:column;gap:12px;padding-top:4px"><p class="mono rise">{e(kicker)}</p><h1 class="rise d1">{e(h1)}</h1><p class="lede rise d2">{lede}</p><p class="mono rise d2" style="color:var(--soft)">Updated {nice(date)}</p></section>'

def book_card(b, extra=""):
    own = OWN.get(norm(b["title"]))
    cover = f'<img src="/library/img/covers/{own["slug"]}.webp" alt="" width="64" height="97" loading="lazy">' if own and os.path.exists(os.path.join(LIB, "img", "covers", own["slug"] + ".webp")) else ""
    by = b.get("author") or (own or {}).get("by", "")
    link = f'<a class="btn btn-line" href="/library/books/{own["slug"]}/">Which chapters to read</a>' if own else ""
    buy = f'<a class="btn btn-green" href="#" data-buy="{e((b["title"] + " " + by).strip())}">Get the book</a>'
    return f'<div class="card bcard" style="display:flex;gap:14px;align-items:flex-start;padding:16px">{cover}<span style="display:flex;flex-direction:column;gap:6px;min-width:0">{f"<span class=mono>{e(by)}</span>" if by else ""}<b class="serif" style="font-size:20px">{e(b["title"])}</b>{extra}<span style="display:flex;gap:8px;flex-wrap:wrap">{buy}{link}</span></span></div>'

def main():
    if not os.path.exists(DATA):
        print("no recs.json yet"); return
    D = json.load(open(DATA))
    people = [p for p in D.get("people", []) if len(p["books"]) >= MIN_BOOKS]
    people.sort(key=lambda p: (-len(p["books"]), p["name"]))
    by_slug = {p["slug"]: p for p in people}
    written = []
    def write(path, h):
        f = os.path.join(ROOT, path.strip("/"), "index.html"); os.makedirs(os.path.dirname(f), exist_ok=True)
        old = open(f).read() if os.path.exists(f) else ""
        if old != h: open(f, "w").write(h)
        written.append(path)
    upd = D.get("updated") or datetime.date.today().isoformat()
    if not people:
        print("no person has", MIN_BOOKS, "books yet: nothing published"); return
    for p in people:
        path = f"/library/people/{p['slug']}/"
        cards = "".join(book_card(b, f'<small style="color:var(--soft)">{e(b.get("note") or "")}</small><small class="mono"><a href="{yt(b["video"], b["ts"])}" rel="nofollow noopener" target="_blank">Watch at {mmss(b["ts"])}</a> · {nice(b["date"])}</small>') for b in p["books"])
        main_html = crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/"), (p["name"], path)]) + hero("Bookshelf", f"Books {p['name']} recommends", f"{len(p['books'])} nonfiction books {e(p['name'])} has recommended on {e(', '.join(p.get('channels') or ['YouTube']))}, each linked to the moment they said it.", p["books"][0]["date"]) + f'<section class="hub-sec"><div class="grid" style="display:grid;gap:12px">{cards}</div></section><p class="lede" style="font-size:15px;color:var(--soft)">How this page is made: we read what guests and hosts say in their videos and list the books they recommend, with a link to the exact moment. Nothing here is paid for.</p>'
        write(path, shell(path, f"Books {p['name']} recommends | The Useful Library", f"Every book {p['name']} has recommended on video, {len(p['books'])} so far, each linked to the exact moment.", main_html))
    rows = "".join(f'<a class="card lift" style="display:flex;justify-content:space-between;gap:12px;padding:14px 16px" href="/library/people/{p["slug"]}/"><b class="serif" style="font-size:20px">{e(p["name"])}</b><span class="mono">{len(p["books"])} books</span></a>' for p in people)
    rank = [r for r in D.get("ranking", []) if len([x for x in r["people"] if x in by_slug]) >= 2]
    rank_link = '<p><a class="btn btn-green" href="/library/recommended/">The most-recommended books</a></p>' if len(people) >= MIN_PEOPLE and rank else ""
    write("/library/people/", shell("/library/people/", "Bookshelves: the books famous people recommend | The Useful Library", f"{len(people)} founders, scientists and authors and the nonfiction books they recommend, each linked to the moment they said it.",
          crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/")]) + hero("Bookshelves", "The books they recommend", "Founders, scientists and authors on the books that changed how they work and live, taken from what they said on video.", upd) + rank_link + f'<section class="hub-sec"><div style="display:grid;gap:10px">{rows}</div></section>'))
    if rank_link:
        rank = sorted(rank, key=lambda r: (-len([x for x in r["people"] if x in by_slug]), r["title"]))[:50]
        cards = "".join(book_card(r, f'<small class="mono">#{i + 1}</small><small style="color:var(--soft)">Recommended by {len([x for x in r["people"] if x in by_slug])} people: ' + ", ".join(f'<a href="/library/people/{x}/">{e(by_slug[x]["name"])}</a>' for x in r["people"] if x in by_slug) + "</small>") for i, r in enumerate(rank))
        write("/library/recommended/", shell("/library/recommended/", f"The most-recommended nonfiction books ({upd[:4]}) | The Useful Library", f"The {len(rank)} nonfiction books most often recommended by {len(people)} founders, scientists and authors, counted by how many different people named them.",
              crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/"), ("Most recommended", "/library/recommended/")]) + hero("Ranking", "The most-recommended nonfiction books", f"Counted by how many of the {len(people)} people we follow named each book. Updated every month.", upd) + f'<section class="hub-sec"><div style="display:grid;gap:12px">{cards}</div></section>'))
    sm = os.path.join(ROOT, "sitemap.xml"); s = open(sm).read(); add = ""
    for path in written:
        if f"<loc>{BASE}{path}</loc>" not in s: add += f"  <url><loc>{BASE}{path}</loc><lastmod>{upd}</lastmod></url>\n"
    if add: open(sm, "w").write(s.replace("</urlset>", add + "</urlset>"))
    print(len(people), "bookshelves,", "ranking" if rank_link else "no ranking yet", "| sitemap +", add.count("<url>"))

if __name__ == "__main__":
    main()
