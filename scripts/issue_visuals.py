#!/usr/bin/env python3
"""Visuals and shorter paragraphs for Tech library issue pages (visual check, 24 Nov 2026, item 10 batch 3).

Free, rules only, no Claude usage. Runs after scripts/build_library.py writes the issue pages, and can be run on its own:
  python3 scripts/issue_visuals.py            every tech/library/<slug>/index.html
  python3 scripts/issue_visuals.py <slug>...  only these
What it does inside <div class="is-body">:
  1. Paragraphs over 45 words split at a sentence break into parts of about 35 words (same words, easier on a phone).
  2. The first time an app listed on The Useful Apps is named in a heading, bold text or a link, an app card
     (icon, name, 1 line, link to its listing) goes after that paragraph. Up to 6 per issue.
  3. Numbered sections (1. / 1) / #1 / 1️⃣ headings) get a number tile showing "3 of 5".
  4. Plug boxes that link a Gumroad product show its cover (assets/products/<id>.webp); tip, warning and correction
     boxes (💡 ⚠️ ✏️) get a drawn icon tile.
  5. Where about 200 words (about 1 phone screen) pass with no visual, the next subheading gets a drawn topic tile
     picked from its words (privacy, battery, storage, money, messages, Mac, iPhone, AI, settings, else a spark).
Idempotent: a page already marked data-iv is rebuilt from its saved original only when the build rewrote it.
"""
import html, json, os, re, sys, urllib.request
from bs4 import BeautifulSoup, NavigableString

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "tech", "library")
SITE = "https://theusefulmedia.com"
UA = "Mozilla/5.0 (UsefulIssueVisuals/1.0; +https://theusefulmedia.com)"
MAX_WORDS, TARGET = 45, 35
MAX_CARDS = 6
# app names that are also everyday words; they only match inside a link to the app
GENERIC = {"notes", "play", "things", "loop", "lens", "stats", "peek", "paste", "timing", "delta", "spark", "bear", "arc", "craft",
           "drafts", "streaks", "opal", "structured", "sofa", "merlin", "swish", "daily", "calendar", "reminders", "photos", "mail",
           "music", "safari", "shortcuts", "focus", "today", "clock", "weather", "files", "books", "home", "news", "tv", "camera"}
KEYCAP = re.compile(r"^\s*([1-9])️?⃣\s*")
NUMBERED = re.compile(r"^\s*#?([1-9]|1[0-9])(?:[.)]\s+|\s+(?=[A-Z]))")
SENT = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"“(])")


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()


def catalog():
    """Apps from The Useful Apps: a local build (../useful-apps/dist) if there is one, else the live site."""
    local = os.environ.get("USEFUL_APPS_DIST") or os.path.join(ROOT, "..", "useful-apps", "dist")
    try:
        if os.path.exists(os.path.join(local, "apps", "data", "index.json")):
            apps = json.load(open(os.path.join(local, "apps", "data", "index.json")))["apps"]
            has_icon = lambda s: os.path.exists(os.path.join(local, "apps", "img", f"{s}-icon.webp"))
        else:
            apps = json.loads(get(SITE + "/apps/data/index.json"))["apps"]
            def has_icon(s):
                try:
                    urllib.request.urlopen(urllib.request.Request(f"{SITE}/apps/img/{s}-icon.webp", method="HEAD", headers={"User-Agent": UA}), timeout=15)
                    return True
                except Exception:
                    return False
    except Exception as e:
        print("issue_visuals: app catalog unavailable, app cards skipped:", e)
        return [], lambda s: False
    return apps, has_icon


def words(s):
    return len(s.split())


def split_paragraphs(body, soup):
    n = 0
    for p in list(body.find_all("p")):
        if p.find(["p", "ul", "ol", "div", "figure", "img", "blockquote"]) or "btn-row" in (p.get("class") or []):
            continue
        if words(p.get_text(" ", strip=True)) <= MAX_WORDS:
            continue
        inner = p.decode_contents()
        parts = SENT.split(inner)
        if len(parts) < 2:
            continue
        chunks, cur = [], ""
        for s in parts:
            if cur and words(BeautifulSoup(cur + " " + s, "html.parser").get_text(" ")) > TARGET:
                chunks.append(cur); cur = s
            else:
                cur = (cur + " " + s).strip()
        if cur:
            chunks.append(cur)
        if len(chunks) < 2:
            continue
        # every chunk must stand alone as valid markup (no tag cut in half), else leave the paragraph as it is
        if any(str(BeautifulSoup(c, "html.parser")).replace(" ", "") != c.replace(" ", "") for c in chunks):
            continue
        new = [BeautifulSoup(f"<p>{c}</p>", "html.parser").p for c in chunks]
        p.replace_with(new[0])
        for a, b in zip(new, new[1:]):
            a.insert_after(b)
        n += 1
    return n


def number_tiles(body, soup):
    heads = [h for h in body.find_all(["h2", "h3"]) if KEYCAP.match(h.get_text()) or NUMBERED.match(h.get_text())]
    if len(heads) < 3:
        return 0
    total = len(heads)
    for h in heads:
        t = h.get_text()
        m = KEYCAP.match(t) or NUMBERED.match(t)
        k = m.group(1)
        # drop the leading "3." or 3️⃣ from the heading text, the tile shows it
        first = next((x for x in h.descendants if isinstance(x, NavigableString) and x.strip()), None)
        if first is not None:
            first.replace_with(KEYCAP.sub("", NUMBERED.sub("", str(first), count=1), count=1))
        tile = BeautifulSoup(f'<div class="iv-num" data-visual aria-hidden="true"><b>{k}</b><span>of {total}</span><i style="--p:{int(k) / total:.3f}"></i></div>', "html.parser").div
        h.insert_before(tile)
        h["class"] = (h.get("class") or []) + ["iv-h"]
    return total


def app_cards(body, soup, apps, has_icon):
    by_slug = {a["slug"]: a for a in apps}
    named = []
    for a in apps:
        n = a["name"]
        if len(n) < 4:
            continue
        rx = re.compile(r"(?<![\w-])" + re.escape(n) + r"(?![\w-])")
        named.append((rx, a, n.lower() in GENERIC))
    used, cards = set(), 0
    for el in body.find_all(["h2", "h3", "strong", "b", "a"]):
        if cards >= MAX_CARDS:
            break
        txt = el.get_text(" ", strip=True)
        href = el.get("href", "") if el.name == "a" else ""
        hit = None
        m = re.search(r"/apps/app/([a-z0-9-]+)/", href)
        if m and m.group(1) in by_slug:
            hit = by_slug[m.group(1)]
        else:
            for rx, a, generic in named:
                if not generic and rx.search(txt):
                    hit = a; break
        if not hit or hit["slug"] in used or not has_icon(hit["slug"]):
            continue
        used.add(hit["slug"])
        # place the card after the paragraph or list that holds the mention (after the next block for a heading)
        anchor = el
        while anchor.parent is not None and anchor.parent is not body:
            anchor = anchor.parent
        if anchor.name in ("h2", "h3"):
            nxt = anchor.find_next_sibling()
            if nxt is not None and nxt.name in ("p", "ul", "ol"):
                anchor = nxt
        s = hit["slug"]
        card = BeautifulSoup(
            f'<a class="iv-app" href="/apps/app/{s}/?utm_source=tech-library" data-visual>'
            f'<img src="/apps/img/{s}-icon.webp" alt="" width="60" height="60" loading="lazy" decoding="async">'
            f'<span class="iv-app-b"><b>{html.escape(hit["name"])}</b><small>{html.escape(hit.get("tag", ""))}</small></span>'
            f'<span class="iv-app-go">Price and alternatives</span></a>', "html.parser").a
        anchor.insert_after(card)
        cards += 1
    return cards


PRODUCTS = os.path.join(ROOT, "assets", "products")
ICONS = {  # drawn 40x40 icons for callout tiles
    "tip": '<path d="M20 6a10 10 0 0 0-6 18v4h12v-4A10 10 0 0 0 20 6z" fill="#FFD84D"/><rect x="15" y="30" width="10" height="3" rx="1.5" fill="#17172B"/><rect x="16.5" y="34.5" width="7" height="2.5" rx="1.25" fill="#17172B"/><path d="M17 20l3 3 3-3" stroke="#17172B" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    "warn": '<path d="M20 5 36 33H4z" fill="#FFB020" stroke="#17172B" stroke-width="1.6" stroke-linejoin="round"/><rect x="18.6" y="14" width="2.8" height="11" rx="1.4" fill="#17172B"/><circle cx="20" cy="29" r="1.7" fill="#17172B"/>',
    "fix": '<rect x="7" y="7" width="22" height="27" rx="3" fill="#fff" stroke="#17172B" stroke-width="1.6"/><path d="M11 14h14M11 19h14M11 24h8" stroke="#B9A6FF" stroke-width="2" stroke-linecap="round"/><path d="m25 31 9-13 3 2-9 13-4 1z" fill="#7C5CFC" stroke="#17172B" stroke-width="1.4" stroke-linejoin="round"/>',
}
KINDS = [("\U0001F4A1", "tip"), ("\u26a0", "warn"), ("\u270f", "fix")]


def callouts(body, soup):
    n = 0
    for q in body.find_all(["blockquote", "aside"]):
        if q.find(class_=["iv-cov", "iv-ico"]):
            continue
        link = next((a["href"] for a in q.find_all("a", href=True) if "gumroad.com/l/" in a["href"]), None)
        if link:
            pid = re.search(r"gumroad\.com/l/([\w-]+)", link).group(1).lower()
            if os.path.exists(os.path.join(PRODUCTS, pid + ".webp")):
                q.insert(0, BeautifulSoup(f'<a class="iv-cov" href="{html.escape(link)}" tabindex="-1" aria-hidden="true"><img src="/assets/products/{pid}.webp" alt="" width="640" height="400" loading="lazy" decoding="async"></a>', "html.parser").a)
                q["class"] = (q.get("class") or []) + ["iv-plug"]
                n += 1
                continue
        t = q.get_text(" ", strip=True)
        kind = next((k for e, k in KINDS if t.startswith(e)), None)
        if kind:
            # the tile replaces the leading emoji
            first = next((x for x in q.descendants if isinstance(x, NavigableString) and x.strip()), None)
            if first is not None:
                first.replace_with(re.sub(r"^\s*(\U0001F4A1|\u26a0\ufe0f?|\u270f\ufe0f?)\s*", "", str(first)))
            q.insert(0, BeautifulSoup(f'<span class="iv-ico iv-{kind}" data-visual aria-hidden="true"><svg viewBox="0 0 40 40" width="40" height="40">{ICONS[kind]}</svg></span>', "html.parser").span)
            q["class"] = (q.get("class") or []) + ["iv-call"]
            n += 1
    return n


TOPICS = [  # (words in the heading, drawn 40x40 icon)
    (r"privac|track|leak|ip address|hide|lock|secur|password|passkey|vpn|relay", '<rect x="9" y="18" width="22" height="17" rx="4" fill="#7C5CFC"/><path d="M14 18v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#17172B" stroke-width="2.4"/><circle cx="20" cy="26" r="2.6" fill="#fff"/>'),
    (r"batter|charg|power", '<rect x="6" y="13" width="25" height="14" rx="3" fill="#fff" stroke="#17172B" stroke-width="2"/><rect x="31" y="17" width="3" height="6" rx="1" fill="#17172B"/><rect x="9" y="16" width="15" height="8" rx="1.5" fill="#3DBE6A"/>'),
    (r"storage|gb|space|disk|free up|clean", '<rect x="7" y="10" width="26" height="8" rx="2.5" fill="#7C5CFC"/><rect x="7" y="22" width="26" height="8" rx="2.5" fill="#B9A6FF"/><circle cx="28" cy="14" r="1.6" fill="#fff"/><circle cx="28" cy="26" r="1.6" fill="#17172B"/>'),
    (r"\$|price|cost|pay|money|cheap|deal|subscri", '<circle cx="20" cy="20" r="13" fill="#FFD84D" stroke="#17172B" stroke-width="2"/><path d="M23.5 15.5c-.8-1.2-2.1-1.8-3.6-1.8-2 0-3.5 1-3.5 2.7 0 3.8 7.4 2 7.4 5.8 0 1.8-1.6 2.9-3.8 2.9-1.7 0-3.1-.7-3.9-2M20 11.5v2.2M20 25.1v2.4" fill="none" stroke="#17172B" stroke-width="2" stroke-linecap="round"/>'),
    (r"messag|text|chat|mail|email|imessage|note", '<path d="M7 11a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H17l-6 6v-6a4 4 0 0 1-4-4z" fill="#7C5CFC"/><path d="M13 14h14M13 19h9" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'),
    (r"\bmac\b|macbook|macos|desktop|laptop|finder|dock", '<rect x="6" y="8" width="28" height="19" rx="3" fill="#17172B"/><rect x="8.5" y="10.5" width="23" height="14" rx="1.5" fill="#B9A6FF"/><path d="M3 30h34l-2 3H5z" fill="#56566C"/>'),
    (r"iphone|phone|ios|app store|widget|screen", '<rect x="12" y="4" width="16" height="32" rx="4" fill="#17172B"/><rect x="14" y="8" width="12" height="23" rx="1.5" fill="#B9A6FF"/><rect x="17.5" y="5.6" width="5" height="1.4" rx=".7" fill="#56566C"/>'),
    (r"\bai\b|claude|siri|chatgpt|gemini|model|agent|prompt|automat", '<path d="M20 5l3.2 9.3L32 17.5l-8.8 3.2L20 30l-3.2-9.3L8 17.5l8.8-3.2z" fill="#7C5CFC"/><path d="M31 25l1.4 3.6L36 30l-3.6 1.4L31 35l-1.4-3.6L26 30l3.6-1.4z" fill="#FFD84D"/>'),
    (r"setting|switch|toggle|option|turn on|turn off|check|how to", '<circle cx="20" cy="20" r="7" fill="none" stroke="#17172B" stroke-width="3"/><path d="M20 5v6M20 29v6M5 20h6M29 20h6M9.4 9.4l4.2 4.2M26.4 26.4l4.2 4.2M9.4 30.6l4.2-4.2M26.4 13.6l4.2-4.2" stroke="#7C5CFC" stroke-width="3.2" stroke-linecap="round"/>'),
]
SPARK = '<path d="M20 6l3.5 10.5L34 20l-10.5 3.5L20 34l-3.5-10.5L6 20l10.5-3.5z" fill="#B9A6FF"/>'
GAP_WORDS = 200


def topic_tiles(body, soup):
    n, since = 0, 0
    for el in list(body.children):
        if not getattr(el, "name", None):
            continue
        cls = " ".join(el.get("class") or [])
        if el.name in ("figure", "img") or el.find("img") or "iv-" in cls or el.find(attrs={"data-visual": True}) or el.get("data-visual") is not None:
            since = 0
            continue
        if el.name in ("h2", "h3") and since >= GAP_WORDS:
            t = el.get_text(" ", strip=True).lower()
            icon = next((ic for rx, ic in TOPICS if re.search(rx, t)), SPARK)
            el.insert_before(BeautifulSoup(f'<div class="iv-top" data-visual aria-hidden="true"><svg viewBox="0 0 40 40" width="40" height="40">{icon}</svg></div>', "html.parser").div)
            el["class"] = (el.get("class") or []) + ["iv-h"]
            since, n = 0, n + 1
            continue
        since += words(el.get_text(" ", strip=True))
    return n


def process(path, apps, has_icon):
    raw = open(path, encoding="utf-8").read()
    start = raw.find('<div class="is-body">')
    if start < 0:
        return None
    end = raw.find("</article>", start)
    seg = raw[start:end]
    close = seg.rfind("</div>")
    if 'data-iv="1"' in seg[:80]:
        return None  # already done; build_library rewrites the page fresh when an issue changes
    soup = BeautifulSoup(seg[:close + 6], "html.parser")
    body = soup.div
    stats = (split_paragraphs(body, soup), app_cards(body, soup, apps, has_icon), number_tiles(body, soup), callouts(body, soup), topic_tiles(body, soup))
    body["data-iv"] = "1"
    out = raw[:start] + str(body) + seg[close + 6:] + raw[end:]
    open(path, "w", encoding="utf-8").write(out)
    return stats


def run(slugs=None):
    apps, has_icon = catalog()
    names = slugs or sorted(d for d in os.listdir(LIB) if os.path.isfile(os.path.join(LIB, d, "index.html")))
    done = 0
    for s in names:
        r = process(os.path.join(LIB, s, "index.html"), apps, has_icon)
        if r:
            done += 1
            print(f"{s}: {r[0]} paragraphs split, {r[1]} app cards, {r[2]} number tiles, {r[3]} boxes, {r[4]} topic tiles")
    print(f"issue_visuals: {done} issue pages updated")


if __name__ == "__main__":
    run(sys.argv[1:] or None)
