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
    h = re.sub(r"<title>.*?</title>", lambda m: f"<title>{e(title)}</title>", h, count=1, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{e(desc)}">', h, count=1)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', lambda m: f'<link rel="canonical" href="{BASE}{path}">', h, count=1)
    for k, v in (("og:title", title), ("og:description", desc), ("og:url", BASE + path), ("twitter:title", title), ("twitter:description", desc)):
        h = re.sub(rf'(<meta (?:property|name)="{k}" content=")[^"]*(">)', lambda m: m.group(1) + e(v) + m.group(2), h, count=1)
    crumbs = [("Library", "/library/"), ("Bookshelves", "/library/people/")] + ([] if path == "/library/people/" else [(title.split(" | ")[0], path)])
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(crumbs)]}
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: f'<script type="application/ld+json">{json.dumps(ld)}</script>', h, count=1, flags=re.S)
    h = re.sub(r'<main id="main" class="wrap">.*?</main>', lambda m: f'<main id="main" class="wrap">{main}</main>', h, count=1, flags=re.S)
    return h


# 19 Nov 2026 (Raja: every page needs a visual): a drawn cover for books without a real cover image, and a shelf of spines for each hero.
def _hue(t):
    h = 0
    for ch in norm(t): h = (h * 31 + ord(ch)) % 3600
    return h % 360
def _lines(t, n, w):
    out, cur = [], ""
    for word in str(t).split():
        if len(cur) + len(word) + 1 > w and cur: out.append(cur); cur = word
        else: cur = (cur + " " + word).strip()
    if cur: out.append(cur)
    if len(out) > n: out = out[:n]; out[-1] = out[-1][: w - 1].rstrip() + "…"
    return out
def drawn_cover(title, by=""):
    h = _hue(title); tl = _lines(title, 4, 11); bl = _lines(by, 1, 13)
    txt = "".join(f'<text x="8" y="{24 + i * 11}" font-size="9.5" font-weight="700">{e(l)}</text>' for i, l in enumerate(tl))
    auth = f'<text x="8" y="88" font-size="7" opacity=".8">{e(bl[0])}</text>' if bl else ""
    return (f'<svg class="dcover" style="flex:none;border-radius:4px" width="64" height="97" viewBox="0 0 64 97" role="img" aria-label="{e(title)} cover" data-visual>'
            f'<rect width="64" height="97" rx="4" fill="hsl({h} 42% 34%)"/><rect width="5" height="97" rx="2" fill="hsl({h} 42% 24%)"/>'
            f'<rect x="8" y="9" width="22" height="3" rx="1.5" fill="hsl({(h + 40) % 360} 80% 72%)"/>'
            f'<g fill="#fff" font-family="Georgia, serif">{txt}{auth}</g></svg>')
def shelf(titles):
    xs, x, parts = [], 6, []
    for i, t in enumerate(titles[:12]):
        h = _hue(t); w = 18 + (len(t) % 4) * 4; ht = 84 + (len(t) * 7 % 26)
        if x + w > 314: break
        lean = ' transform="rotate(-8 %d %d)"' % (x + w, 120) if i == len(titles[:12]) - 1 and x + w + 30 < 314 else ""
        parts.append(f'<g{lean}><rect x="{x}" y="{120 - ht}" width="{w}" height="{ht}" rx="3" fill="hsl({h} 45% 38%)"/><rect x="{x + 3}" y="{128 - ht}" width="{w - 6}" height="3" rx="1.5" fill="hsl({(h + 40) % 360} 80% 74%)"/><rect x="{x + 3}" y="{110}" width="{w - 6}" height="3" rx="1.5" fill="hsl({(h + 40) % 360} 80% 74%)" opacity=".7"/></g>')
        x += w + 3
    return (f'<svg class="rshelf rise d2" viewBox="0 0 320 132" width="320" height="132" role="img" aria-label="A shelf of {len(titles)} books" data-visual>'
            f'{"".join(parts)}<rect x="0" y="120" width="320" height="8" rx="3" fill="currentColor" opacity=".25"/></svg>')

def crumbs_html(items):
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + "".join(f'<li aria-current="page">{e(n)}</li>' if i == len(items) - 1 else f'<li><a href="{u}">{e(n)}</a></li>' for i, (n, u) in enumerate(items)) + "</ol></nav>"

def hero(kicker, h1, lede, date, art=""):
    return f'<section style="display:flex;flex-direction:column;gap:12px;padding-top:4px">{art}<p class="mono rise">{e(kicker)}</p><h1 class="rise d1">{e(h1)}</h1><p class="lede rise d2">{lede}</p><p class="mono rise d2" style="color:var(--soft)">Updated {nice(date)}</p></section>'

def book_card(b, extra=""):
    own = OWN.get(norm(b["title"]))
    by = b.get("author") or (own or {}).get("by", "")
    cover = f'<img src="/library/img/covers/{own["slug"]}.webp" alt="" width="64" height="97" loading="lazy">' if own and os.path.exists(os.path.join(LIB, "img", "covers", own["slug"] + ".webp")) else drawn_cover(b["title"], by)
    link = f'<a class="btn btn-line" href="/library/books/{own["slug"]}/">Which chapters to read</a>' if own else ""
    buy = f'<a class="btn btn-green" href="#" data-buy="{e((b["title"] + " " + by).strip())}">Get the book</a>'
    return f'<div class="card bcard" style="display:flex;gap:14px;align-items:flex-start;padding:16px">{cover}<span style="display:flex;flex-direction:column;gap:6px;min-width:0">{f"<span class=mono>{e(by)}</span>" if by else ""}<b class="serif" style="font-size:20px">{e(b["title"])}</b>{extra}<span style="display:flex;gap:8px;flex-wrap:wrap">{buy}{link}</span></span></div>'

# 20 Nov 2026 (master plan M12): "Most recommended {topic} books, by N people" lists, counted from the same
# bookshelf data. Curated so fiction never lands in a topic. Each entry: title, author, other spellings seen in the data.
TOPICS = {
  "habits": ("habit", "Habits and discipline", [
    ("Atomic Habits", "James Clear"), ("The Power of Habit", "Charles Duhigg"), ("Tiny Habits", "BJ Fogg"),
    ("Breaking the Habit of Being Yourself", "Joe Dispenza"), ("The Miracle Morning", "Hal Elrod", "Miracle Morning"),
    ("The 7 Habits of Highly Effective People", "Stephen Covey", "The Seven Habits of Highly Effective People"),
    ("Grit", "Angela Duckworth"), ("Can't Hurt Me", "David Goggins"), ("The War of Art", "Steven Pressfield"),
    ("Dopamine Nation", "Anna Lembke"), ("The Willpower Instinct", "Kelly McGonigal"), ("The Craving Mind", "Judson Brewer"),
    ("Mastery", "Robert Greene")]),
  "focus": ("productivity", "Focus and productivity", [
    ("Deep Work", "Cal Newport"), ("Slow Productivity", "Cal Newport"), ("Getting Things Done", "David Allen"),
    ("Essentialism", "Greg McKeown"), ("Flow", "Mihaly Csikszentmihalyi"), ("Feel Good Productivity", "Ali Abdaal"),
    ("The Shallows", "Nicholas Carr"), ("It Doesn't Have to Be Crazy at Work", "Jason Fried"),
    ("The Effective Executive", "Peter Drucker"), ("The 80/20 Principle", "Richard Koch"),
    ("The Organized Mind", "Daniel Levitin"), ("Rest", "Alex Soojung-Kim Pang"), ("The Anxious Generation", "Jonathan Haidt"),
    ("The ONE Thing", "Gary Keller"), ("Indistractable", "Nir Eyal"), ("Make Time", "Jake Knapp"),
    ("The 4-Hour Workweek", "Tim Ferriss", "The 4-Hour Work Week", "The Four Hour Workweek"),
    ("Four Thousand Weeks", "Oliver Burkeman"), ("Digital Minimalism", "Cal Newport")]),
  "money": ("money", "Money", [
    ("The Psychology of Money", "Morgan Housel"), ("Rich Dad Poor Dad", "Robert Kiyosaki"),
    ("Rich Dad's Cashflow Quadrant", "Robert Kiyosaki"), ("Die With Zero", "Bill Perkins"),
    ("Think and Grow Rich", "Napoleon Hill"), ("The Millionaire Fastlane", "MJ DeMarco", "The Millionaire Fast Lane"),
    ("Same as Ever", "Morgan Housel"), ("Money: A Story of Humanity", "David McWilliams"),
    ("The Bitcoin Standard", "Saifedean Ammous"), ("Million Dollar Weekend", "Noah Kagan"),
    ("Fooled by Randomness", "Nassim Nicholas Taleb", "Fooled"), ("I Will Teach You to Be Rich", "Ramit Sethi"),
    ("Your Money or Your Life", "Vicki Robin"), ("The Millionaire Next Door", "Thomas J. Stanley"),
    ("The Total Money Makeover", "Dave Ramsey"), ("The Little Book of Common Sense Investing", "John C. Bogle"),
    ("Broke Millennial", "Erin Lowry"), ("Happy Sexy Millionaire", "Steven Bartlett")]),
  "mindset": ("mindset", "Mindset", [
    ("Mindset", "Carol Dweck"), ("Man's Search for Meaning", "Viktor Frankl"),
    ("Meditations", "Marcus Aurelius", "The Meditations", "Meditations (Gregory Hays translation)"),
    ("The Daily Stoic", "Ryan Holiday"), ("The Obstacle Is the Way", "Ryan Holiday"),
    ("The Courage to Be Disliked", "Ichiro Kishimi"),
    ("The Subtle Art of Not Giving a F*ck", "Mark Manson", "The Subtle Art of Not Giving a F***"),
    ("The Mountain Is You", "Brianna Wiest"), ("How to Be a Stoic", "Massimo Pigliucci"),
    ("Thinking, Fast and Slow", "Daniel Kahneman"), ("Thinking in Bets", "Annie Duke"), ("The Chimp Paradox", "Steve Peters"),
    ("The Laws of Human Nature", "Robert Greene"), ("The 48 Laws of Power", "Robert Greene"),
    ("Don't Believe Everything You Think", "Joseph Nguyen"), ("The Magic of Thinking Big", "David J. Schwartz"),
    ("The Power of Positive Thinking", "Norman Vincent Peale"), ("A New Earth", "Eckhart Tolle"),
    ("The Surrender Experiment", "Michael A. Singer"), ("Stumbling on Happiness", "Daniel Gilbert"),
    ("Think Again", "Adam Grant"), ("The Upside of Stress", "Kelly McGonigal"),
    ("The Enchiridion", "Epictetus", "The Enchiridion (The Handbook)"), ("Superforecasting", "Philip Tetlock"),
    ("From Strength to Strength", "Arthur C. Brooks", "Strength to Strength")]),
  "health": ("health", "Health", [
    ("Outlive", "Peter Attia"), ("Why We Sleep", "Matthew Walker"), ("The Obesity Code", "Jason Fung"),
    ("Breath", "James Nestor"), ("The 4-Hour Body", "Tim Ferriss"), ("Healing Back Pain", "John E. Sarno"),
    ("Back Mechanic", "Stuart McGill"), ("The Great Nerve", "Kevin J. Tracey"), ("Good Energy", "Casey Means")]),
  "business": ("business", "Business", [
    ("Zero to One", "Peter Thiel"), ("The Lean Startup", "Eric Ries"), ("$100M Offers", "Alex Hormozi"),
    ("The Innovator's Dilemma", "Clayton Christensen"), ("Traction", "Gino Wickman"), ("The Goal", "Eliyahu Goldratt"),
    ("The Everything Store", "Brad Stone"), ("Steve Jobs", "Walter Isaacson"), ("Never Split the Difference", "Chris Voss"),
    ("Influence", "Robert Cialdini"), ("Scorecard Marketing", "Daniel Priestley"), ("Ready, Fire, Aim", "Michael Masterson"),
    ("How to Fail at Almost Everything and Still Win Big", "Scott Adams"), ("The Practice", "Seth Godin"),
    ("Million Dollar Weekend", "Noah Kagan"), ("The 4-Hour Workweek", "Tim Ferriss", "The 4-Hour Work Week", "The Four Hour Workweek")]),
  "relationships": ("relationship", "Relationships", [
    ("Attached", "Amir Levine"), ("Secure", "Amir Levine"), ("How to Win Friends and Influence People", "Dale Carnegie"),
    ("The Seven Principles for Making Marriage Work", "John Gottman"), ("Crucial Conversations", "Kerry Patterson"),
    ("Never Split the Difference", "Chris Voss"), ("Set Boundaries, Find Peace", "Nedra Glover Tawwab"),
    ("All About Love", "bell hooks"), ("The Science of Happily Ever After", "Ty Tashiro"),
    ("Lost Connections", "Johann Hari"), ("How to Not Die Alone", "Logan Ury")]),
}
HUBS = ("habits", "focus", "money", "mindset")
MIN_TOPIC = 5

def topic_lists(D, by_slug):
    """Per topic: ranked [{title, author, people:[slugs], note}] counting only people with a bookshelf page."""
    seen = {}
    for p in by_slug.values():
        for b in p["books"]:
            seen.setdefault(norm(b["title"]), []).append((p["slug"], b.get("note") or ""))
    out = {}
    for k, (noun, label, items) in TOPICS.items():
        rows = []
        for it in items:
            t, a, alts = it[0], it[1], it[2:]
            hits = [h for n in {norm(x) for x in (t,) + alts} for h in seen.get(n, [])]
            ppl = list(dict.fromkeys(s for s, _ in hits))
            if ppl:
                rows.append({"title": t, "author": a, "people": ppl, "note": next((n for _, n in hits if n), "")})
        rows.sort(key=lambda r: (-len(r["people"]), r["title"]))
        if len(rows) >= MIN_TOPIC:
            out[k] = rows
    return out

def topic_title(noun, nb, np):
    t = f"The {nb} most-recommended {noun} books, by {np} people"
    return t + " | The Useful Library" if len(t) <= 40 else t

def topic_chips(lists, here=""):
    if not lists: return ""
    return ('<nav aria-label="Lists by topic" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span class="mono">Lists by topic</span>'
            + "".join(f'<a class="tag{" green" if k == here else ""}" href="/library/recommended/{k}/"{" aria-current=page" if k == here else ""}>{e(TOPICS[k][1])}</a>' for k in lists) + "</nav>")

def hub_block(k, rows, np):
    top = "".join(f'<div class="card" style="display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 16px;flex-wrap:wrap"><span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="mono">#{i + 1} · named by {len(r["people"])}</span><b class="serif" style="font-size:18px">{e(r["title"])}</b><small style="color:var(--soft)">{e(r["author"])}</small></span><a class="btn btn-green" href="#" data-buy="{e(r["title"] + " " + r["author"])}">Get the book</a></div>' for i, r in enumerate(rows[:3]))
    return (f'<!--toplist--><section class="hub-sec" id="most-recommended"><h2>Most recommended by {np} people</h2>'
            f'<p class="lede" style="font-size:16px">The {TOPICS[k][0]} books founders, scientists and authors name most on video.</p>'
            f'<div style="display:grid;gap:10px">{top}</div><p><a class="btn btn-line" href="/library/recommended/{k}/">See all {len(rows)} books</a></p></section><!--/toplist-->')

def inject_hubs(lists, people_n):
    changed = []
    for k in HUBS:
        f = os.path.join(LIB, k, "index.html")
        if not os.path.exists(f): continue
        h0 = open(f).read()
        h = re.sub(r"<!--toplist-->.*?<!--/toplist-->", "", h0, flags=re.S)
        h = h.replace('<a href="#most-recommended">Most recommended</a>', "")
        if k in lists:
            rows = lists[k]; np = len({s for r in rows for s in r["people"]})
            block = hub_block(k, rows, np)
            h = h.replace('<section class="hub-sec" id="books">', block + '<section class="hub-sec" id="books">', 1) if 'id="books"' in h else h.replace("</main>", block + "</main>", 1)
            h = h.replace('<a href="#books">Books</a></nav>', '<a href="#books">Books</a><a href="#most-recommended">Most recommended</a></nav>', 1)
        if h != h0: open(f, "w").write(h); changed.append(k)
    return changed

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
        cards = "".join(book_card(b, f'<small style="color:var(--soft)">{e(b.get("note") or "")}</small><small class="mono"><a href="{e(b["url"]) if b.get("url") else yt(b["video"], b["ts"])}" rel="nofollow noopener" target="_blank">{("Listen to the episode" if not b["ts"] else "Listen from " + mmss(b["ts"])) if b.get("url") else "Watch at " + mmss(b["ts"])}</a> · {nice(b["date"])}</small>') for b in p["books"])
        main_html = crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/"), (p["name"], path)]) + hero("Bookshelf", f"Books {p['name']} recommends", f"{len(p['books'])} nonfiction books {e(p['name'])} has recommended on {e(', '.join([c for c in (p.get('channels') or []) if not str(c).strip().isdigit()] or ['video']))}, each linked to the moment they said it.", p["books"][0]["date"], shelf([b["title"] for b in p["books"]])) + f'<section class="hub-sec"><div class="grid" style="display:grid;gap:12px">{cards}</div></section><p class="lede" style="font-size:15px;color:var(--soft)">How this page is made: we read what guests and hosts say in their videos and list the books they recommend, with a link to the exact moment. Nothing here is paid for.</p>'
        write(path, shell(path, f"Books {p['name']} recommends | The Useful Library", f"Every book {p['name']} has recommended on video, {len(p['books'])} so far, each linked to the exact moment.", main_html))
    rows = "".join(f'<a class="card lift" style="display:flex;justify-content:space-between;gap:12px;padding:14px 16px" href="/library/people/{p["slug"]}/"><b class="serif" style="font-size:20px">{e(p["name"])}</b><span class="mono">{len(p["books"])} books</span></a>' for p in people)
    rank = [r for r in D.get("ranking", []) if len([x for x in r["people"] if x in by_slug]) >= 2]
    rank_link = '<p><a class="btn btn-green" href="/library/recommended/">The most-recommended books</a></p>' if len(people) >= MIN_PEOPLE and rank else ""
    write("/library/people/", shell("/library/people/", "Bookshelves: the books famous people recommend | The Useful Library", f"{len(people)} founders, scientists and authors and the nonfiction books they recommend, each linked to the moment they said it.",
          crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/")]) + hero("Bookshelves", "The books they recommend", "Founders, scientists and authors on the books that changed how they work and live, taken from what they said on video.", upd, shelf([r["title"] for r in D.get("ranking", [])][:12] or [b["title"] for q in people for b in q["books"]][:12])) + rank_link + f'<section class="hub-sec"><div style="display:grid;gap:10px">{rows}</div></section>'))
    if rank_link:
        rank = sorted(rank, key=lambda r: (-len([x for x in r["people"] if x in by_slug]), r["title"]))[:50]
        cards = "".join(book_card(r, f'<small class="mono">#{i + 1}</small><small style="color:var(--soft)">Recommended by {len([x for x in r["people"] if x in by_slug])} people: ' + ", ".join(f'<a href="/library/people/{x}/">{e(by_slug[x]["name"])}</a>' for x in r["people"] if x in by_slug) + "</small>") for i, r in enumerate(rank))
        write("/library/recommended/", shell("/library/recommended/", f"The most-recommended nonfiction books ({upd[:4]}) | The Useful Library", f"The {len(rank)} nonfiction books most often recommended by {len(people)} founders, scientists and authors, counted by how many different people named them.",
              crumbs_html([("Library", "/library/"), ("Bookshelves", "/library/people/"), ("Most recommended", "/library/recommended/")]) + hero("Ranking", "The most-recommended nonfiction books", f"Counted by how many of the {len(people)} people we follow named each book. Updated every month.", upd, shelf([r["title"] for r in rank][:12])) + f'<section class="hub-sec"><div style="display:grid;gap:12px">{cards}</div></section>'))
    lists = topic_lists(D, by_slug) if rank_link else {}
    for k, rows in lists.items():
        noun, label, _ = TOPICS[k]; path = f"/library/recommended/{k}/"
        np = len({s for r in rows for s in r["people"]}); top = rows[0]
        cards = "".join(book_card({"title": r["title"], "author": r["author"]}, f'<small class="mono">#{i + 1} · named by {len(r["people"])}</small>' + (f'<small style="color:var(--soft)">{e(r["note"])}</small>' if r["note"] else "") + '<small style="color:var(--soft)">Recommended by: ' + ", ".join(f'<a href="/library/people/{x}/">{e(by_slug[x]["name"])}</a>' for x in r["people"]) + "</small>") for i, r in enumerate(rows))
        short = f'#1 is {e(top["title"])} by {e(top["author"])}, named by {len(top["people"])} of the {np} people.' + (f' Next: {e(rows[1]["title"])} ({len(rows[1]["people"])}) and {e(rows[2]["title"])} ({len(rows[2]["people"])}).' if len(rows) > 2 else "")
        faq = [(f"What is the most recommended {noun} book?", f'{top["title"]} by {top["author"]}. {len(top["people"])} of the {np} people on our bookshelves named it on video.'),
               ("How is this list made?", f"We read what founders, scientists and authors say in their videos and podcasts, list every nonfiction book they recommend, and count how many different people named each one. Nobody pays to be on it. It updates every night.")]
        faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}
        main_html = (crumbs_html([("Library", "/library/"), ("Most recommended", "/library/recommended/"), (label, path)])
            + hero("Ranking", f"The most-recommended {noun} books", f"{len(rows)} {noun} books named by {np} founders, scientists and authors on video, ranked by how many of them named each one.", upd, shelf([r["title"] for r in rows][:12]))
            + f'<div class="card" style="padding:16px 18px;border-left:4px solid var(--green)"><span class="mono">In short</span><p style="margin:6px 0 0">{short}</p></div>'
            + topic_chips(lists, k)
            + f'<section class="hub-sec"><div style="display:grid;gap:12px">{cards}</div></section>'
            + '<section class="hub-sec"><h2>Questions</h2>' + "".join(f'<details class="card" style="padding:14px 16px"><summary><b>{e(q)}</b></summary><p style="margin-top:8px;color:var(--soft)">{e(a)}</p></details>' for q, a in faq) + "</section>"
            + f'<script type="application/ld+json">{json.dumps(faq_ld)}</script>')
        write(path, shell(path, topic_title(noun, len(rows), np), f"The {len(rows)} {noun} books most often recommended by {np} founders, scientists and authors, ranked by how many named each one. #1: {top['title']}.", main_html))
    hubs = inject_hubs(lists, len(people))
    if lists:
        for f in ("/library/recommended/", "/library/people/"):
            fp = os.path.join(ROOT, f.strip("/"), "index.html"); h0 = open(fp).read()
            h = re.sub(r"<!--topics-->.*?<!--/topics-->", "", h0, flags=re.S)
            h = h.replace('<section class="hub-sec">', "<!--topics-->" + topic_chips(lists) + "<!--/topics-->" + '<section class="hub-sec">', 1)
            if h != h0: open(fp, "w").write(h)
    sm = os.path.join(ROOT, "sitemap.xml"); s = open(sm).read(); add = ""
    for path in written:
        if f"<loc>{BASE}{path}</loc>" not in s: add += f"  <url><loc>{BASE}{path}</loc><lastmod>{upd}</lastmod></url>\n"
    if add: open(sm, "w").write(s.replace("</urlset>", add + "</urlset>"))
    print(len(people), "bookshelves,", "ranking" if rank_link else "no ranking yet", "| topic lists:", ", ".join(f"{k} {len(v)}" for k, v in lists.items()) or "none", "| hubs:", ",".join(hubs) or "none", "| sitemap +", add.count("<url>"))

if __name__ == "__main__":
    main()
    # 24 Nov 2026 (visual check): Library visual pass after the recommendation sections change
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import library_visuals; library_visuals.run()
