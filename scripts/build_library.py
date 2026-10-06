#!/usr/bin/env python3
"""Builds theusefulmedia.com/tech/library from the published Beehiiv issues.

Reads the public Beehiiv sitemap, pulls each issue page, strips Beehiiv's
markup and ad-network blocks, and writes clean static pages in the site's own
design:
  tech/library/index.html          the library
  tech/library/<slug>/index.html   one page per issue
  tech/issues/...                  forwarding pages for the old URLs
Run from the repo root:  python3 scripts/build_library.py
"""
import hashlib, html, json, os, re, sys, time, urllib.request
from datetime import datetime, timezone
from bs4 import BeautifulSoup, NavigableString, Tag

BASE = "https://newsletter.theusefultech.com"
SITE = "https://theusefulmedia.com"
OUT = os.path.join("tech", "library")
OLD = os.path.join("tech", "issues")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"

FORMATS = {
    "The Useful Find": {"key": "find", "day": "Monday", "short": "Useful Find"},
    "The Deep Dive": {"key": "dive", "day": "Wednesday", "short": "Deep Dive"},
    "The Useful Five": {"key": "five", "day": "Friday", "short": "Useful Five"},
}
TITLE_RE = re.compile(r"^\W*\s*(The Useful Find|The Deep Dive|The Useful Five)\s*#\s*0*(\d+)\s*:\s*(.+)$")
EMOJI_RE = re.compile("[0-9#*]\uFE0F?\u20E3|[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u20E3]+")


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xml"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa
            if i == tries - 1:
                raise
            time.sleep(2 + i * 3)


def esc(s):
    return html.escape(s or "", quote=True)


def clean_text(s):
    return re.sub(r"\s+", " ", EMOJI_RE.sub("", s or "")).strip()


def parse_meta(soup, url):
    def meta(prop):
        t = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        return t.get("content", "").strip() if t else ""
    raw_title = meta("og:title") or (soup.title.string if soup.title else "")
    raw_title = re.sub(r"[0-9#*]\uFE0F?\u20E3", "", raw_title)
    m = TITLE_RE.match(raw_title.strip())
    if m:
        fmt_name, num, title = m.group(1), int(m.group(2)), clean_text(m.group(3))
        fmt = FORMATS[fmt_name]
        fmt = {**fmt, "name": fmt_name}
    else:
        fmt, num, title = {"key": "extra", "day": "", "short": "Extra", "name": "Extra"}, None, clean_text(raw_title)
    image = meta("og:image")
    has_thumb = bool(image) and "/publication/logo/" not in image
    published = meta("article:published_time")
    try:
        dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.now(timezone.utc)
    slug = url.rstrip("/").split("/p/")[-1]
    return {
        "slug": slug, "url": url, "title": title, "raw_title": raw_title,
        "subtitle": clean_text(meta("og:description")), "image": image if has_thumb else "",
        "format": fmt, "num": num, "date": dt.isoformat(), "date_label": dt.strftime("%b %-d, %Y"),
    }


# ---------- content cleaning ----------
AD_MARKERS = ("_bhiiv=opp", "bhcl_id=", "beehiiv.com/ads", "utm_campaign=ad_network")
KEEP_INLINE = {"a", "strong", "b", "em", "i", "code", "br", "s", "u", "sup", "sub"}


def has_ad(tag):
    for a in tag.find_all("a", href=True):
        if any(mk in a["href"] for mk in AD_MARKERS):
            return True
    return False


def block_kind(tag):
    cls = " ".join(tag.get("class") or [])
    if "imageBlock" in cls or tag.find("img"):
        return "image"
    if tag.find(["h1", "h2", "h3", "h4"]) and len(tag.find_all(True)) <= 6:
        return "heading"
    if not tag.get_text(strip=True) and not tag.find("img"):
        return "empty" if not tag.find("hr") else "break"
    return "other"


def inline(node):
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(esc(str(c)))
        elif isinstance(c, Tag):
            name = c.name
            inner = inline(c)
            if name == "a" and c.get("href"):
                href = c["href"]
                if "{{" in href:
                    out.append(inner)
                    continue
                ext = not href.startswith(SITE)
                out.append(f'<a href="{esc(href)}"' + (' target="_blank" rel="noopener"' if ext else "") + f">{inner}</a>")
            elif name in ("strong", "b"):
                out.append(f"<strong>{inner}</strong>")
            elif name in ("em", "i"):
                out.append(f"<em>{inner}</em>")
            elif name == "code":
                out.append(f"<code>{inner}</code>")
            elif name == "br":
                out.append("<br>")
            elif name in ("s", "u", "sup", "sub"):
                out.append(f"<{name}>{inner}</{name}>")
            else:
                out.append(inner)
    return "".join(out)


def render_block(tag):
    cls = " ".join(tag.get("class") or [])
    parts = []
    if "blockquote" in cls.lower() or tag.find("blockquote"):
        txt = inline(tag.find("blockquote") or tag)
        txt = re.sub(r"^\s*[❝“\"]\s*", "", txt)
        txt = re.sub(r"\s*[“”\"]\s*(&mdash;|—|-)?\s*$", "", txt)
        return f"<blockquote><p>{txt.strip()}</p></blockquote>"
    for el in tag.find_all(["h1", "h2", "h3", "h4", "p", "ul", "ol", "img", "hr", "table", "figcaption", "a"]):
        if el.name == "a":
            if el.find_parent(["p", "li", "h1", "h2", "h3", "h4", "td", "th", "figcaption"]) or not el.get("href") or "{{" in el["href"]:
                continue
            t = clean_text(el.get_text(" ", strip=True))
            if t and not el.find("img"):
                parts.append(f'<p class="btn-row"><a class="is-btn" href="{esc(el["href"])}" target="_blank" rel="noopener">{esc(t)}</a></p>')
            continue
        # only top-most matching elements
        if el.find_parent(["ul", "ol", "table"]) and el.name not in ("ul", "ol", "table"):
            continue
        if el.name in ("ul", "ol") and el.find_parent(["ul", "ol"]):
            continue
        if el.name == "p" and el.find_parent(["li", "td", "th"]):
            continue
        if el.name in ("h1", "h2", "h3", "h4"):
            lvl = {"h1": "h2", "h2": "h2", "h3": "h3", "h4": "h4"}[el.name]
            t = inline(el).strip()
            if t:
                parts.append(f"<{lvl}>{t}</{lvl}>")
        elif el.name == "p":
            t = inline(el).strip()
            if t and t not in ("&nbsp;",):
                parts.append(f"<p>{t}</p>")
        elif el.name in ("ul", "ol"):
            items = []
            for li in el.find_all("li", recursive=False):
                items.append(f"<li>{inline(li).strip()}</li>")
            if items:
                parts.append(f"<{el.name}>{''.join(items)}</{el.name}>")
        elif el.name == "img" and el.get("src"):
            alt = esc(el.get("alt", ""))
            parts.append(f'<figure><img src="{esc(el["src"])}" alt="{alt}" loading="lazy"></figure>')
        elif el.name == "figcaption":
            t = inline(el).strip()
            if t:
                parts.append(f'<p class="caption">{t}</p>')
        elif el.name == "hr":
            parts.append("<hr>")
        elif el.name == "table":
            rows = []
            for tr in el.find_all("tr"):
                cells = "".join(f"<{c.name}>{inline(c).strip()}</{c.name}>" for c in tr.find_all(["td", "th"]))
                rows.append(f"<tr>{cells}</tr>")
            parts.append(f'<div class="table-wrap"><table>{"".join(rows)}</table></div>')
    return "".join(parts)


def extract_content(soup):
    root = soup.find(id="content-blocks")
    doc = root.find(class_="dream-post-content-doc") if root else None
    if not doc:
        return ""
    blocks = [b for b in doc.find_all(recursive=False) if isinstance(b, Tag)]
    drop = set()
    for i, b in enumerate(blocks[:3]):
        t = b.get_text(" ", strip=True)
        if t.lower().startswith("in partnership with"):
            drop.add(i)
        elif "THE USEFUL" in t and ("ISSUE" in t.upper()) and len(t) < 160:
            drop.add(i)  # the email masthead
    ad_idx = [i for i, b in enumerate(blocks) if i not in drop and has_ad(b)]
    if ad_idx:
        # group consecutive ad regions (gap of up to 4 blocks counts as the same ad)
        groups, start, prev = [], ad_idx[0], ad_idx[0]
        for i in ad_idx[1:]:
            if i - prev <= 4:
                prev = i
            else:
                groups.append((start, prev)); start = prev = i
        groups.append((start, prev))
        for s, e in groups:
            while s - 1 >= 0 and block_kind(blocks[s - 1]) in ("heading", "image", "empty") and (s - 1) not in drop:
                s -= 1
                if block_kind(blocks[s]) == "heading":
                    break
            while e + 1 < len(blocks) and block_kind(blocks[e + 1]) == "empty":
                e += 1
            drop.update(range(s, e + 1))
    out = []
    for i, b in enumerate(blocks):
        if i in drop:
            continue
        cls = " ".join(b.get("class") or [])
        kind = block_kind(b)
        if kind == "empty":
            if b.find("hr") or (not b.get_text(strip=True) and not b.find(["p", "img"])):
                out.append("<hr>")
            continue
        if "_1gqvddm0" in cls:
            inner = render_block(b)
            if inner:
                out.append(f'<aside class="callout">{inner}</aside>')
            continue
        r = render_block(b)
        if r:
            out.append(r)
    body = "".join(out)
    body = re.sub(r"(<hr>\s*){2,}", "<hr>", body)
    body = re.sub(r"^(<hr>)+|(<hr>)+$", "", body)
    body = re.sub(r"\{\{[^}]+\}\}", "", body)
    return body


# ---------- page templates ----------
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try{{var t=localStorage.getItem("tumc-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="The Useful Tech">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FAFAF8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E1C" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css">
<link rel="stylesheet" href="/tech/tech.css">
<link rel="stylesheet" href="/tech/library/library.css">
<script src="/assets/site.js" defer></script>
<script src="/tech/tech.js" defer></script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tutTurnstileReady" async defer></script>
{extra_head}
</head>
<body class="nl is-{bodyclass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/tech/" aria-label="The Useful Tech newsletter"><svg class="mark" viewBox="0 0 30 19.5" aria-hidden="true"><rect x="0" y="0" width="9" height="9" rx="1.6"/><rect x="10.5" y="0" width="9" height="9" rx="1.6"/><rect x="21" y="0" width="9" height="9" rx="1.6"/><rect x="0" y="10.5" width="9" height="9" rx="1.6"/><rect x="10.5" y="10.5" width="9" height="9" rx="1.6"/><rect x="21" y="10.5" width="9" height="9" rx="1.6"/></svg><span class="brand-name">The Useful Tech</span></a>
    <div class="header-end">
      <a class="is-head-link" href="/tech/library/">Library</a>
      <a class="is-head-cta" href="/tech/#join">Subscribe free</a>
      <button class="theme-toggle" type="button" data-mode="system" aria-label="Colour theme: match your device" data-cursor="Theme">
        <svg class="t-system" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path class="half" d="M12 4a8 8 0 0 1 0 16z"/></svg>
        <svg class="t-light" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><g class="rays"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>
        <svg class="t-dark" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
      </button>
    </div>
  </div>
</header>
<main id="main">
"""

FOOT = """</main>
<footer class="nl-footer">
  <div class="wrap">
    <span>&copy; {year} The Useful Media Co. Chennai, India.</span>
    <nav aria-label="Footer"><a href="/tech/">Subscribe</a><a href="/tech/library/">Library</a><a href="/">theusefulmedia.com</a></nav>
  </div>
</footer>
<div class="progress" aria-hidden="true"></div>
<div class="toast" role="status" aria-live="polite"></div>
</body>
</html>
"""


def signup_form(idx):
    return f"""<div class="signup">
      <form class="signup-form" data-signup novalidate>
        <label class="visually-hidden" for="email-{idx}">Email address</label>
        <input id="email-{idx}" type="email" name="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@email.com" required>
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit"><span class="btn-label">Send me the next issue</span></button>
      </form>
      <div class="signup-msg" aria-live="polite"></div>
      <div class="ts-slot"></div>
    </div>"""


GLYPH = {
    "find": '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="27" cy="27" r="15" fill="none" stroke="currentColor" stroke-width="6"/><path d="M38 38l13 13" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg>',
    "dive": '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 18h44M14 30h36M18 42h28M24 54h16" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>',
    "five": '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="16" cy="22" r="6" fill="currentColor"/><circle cx="32" cy="22" r="6" fill="currentColor"/><circle cx="48" cy="22" r="6" fill="currentColor"/><circle cx="24" cy="42" r="6" fill="currentColor"/><circle cx="40" cy="42" r="6" fill="currentColor"/></svg>',
    "extra": '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" fill="currentColor"/></svg>',
}


def thumb(issue, size="card"):
    k = issue["format"]["key"]
    if issue["image"]:
        return f'<img src="{esc(issue["image"])}" alt="" loading="lazy" width="1200" height="630">'
    return f'<span class="thumb-fallback f-{k}">{GLYPH[k]}</span>'


def label(issue):
    f = issue["format"]
    n = f" #{issue['num']:03d}" if issue["num"] else ""
    return f'<span class="fmt f-{f["key"]}">{esc(f["short"])}{n}</span>'


def card(issue, featured=False):
    k = issue["format"]["key"]
    cls = "issue-card is-featured" if featured else "issue-card"
    search = esc((issue["title"] + " " + issue["subtitle"]).lower())
    return f"""<a class="{cls}" href="/tech/library/{esc(issue['slug'])}/" data-format="{k}" data-search="{search}">
      <span class="ic-thumb">{thumb(issue)}</span>
      <span class="ic-body">
        <span class="ic-meta">{label(issue)}<span class="ic-date">{esc(issue['date_label'])}</span></span>
        <span class="ic-title">{esc(issue['title'])}</span>
        <span class="ic-sub">{esc(issue['subtitle'])}</span>
      </span>
    </a>"""


def build_archive(issues):
    count = len(issues)
    head = HEAD.format(title=f"{count} Apple and AI fixes you can use today | The Useful Tech library", desc=f"Every issue of The Useful Tech in one library: {count} hidden iPhone, Mac and AI features, with a new one every Monday, Wednesday and Friday.",
                       canonical=f"{SITE}/tech/library/", ogtype="website", image=f"{SITE}/tech/og.png", extra_head="", bodyclass="library")
    featured = card(issues[0], True) if issues else ""
    cards = "\n".join(card(i) for i in issues[1:])
    counts = {k: sum(1 for i in issues if i["format"]["key"] == k) for k in ("find", "dive", "five")}
    body = f"""
<section class="ar-hero wrap" aria-labelledby="ar-title">
  <div class="ar-hero-copy">
    <h1 id="ar-title">{count} Apple and AI fixes you can use today</h1>
    <p class="ar-lede">Every issue of The Useful Tech, free to read. A new one lands every Monday, Wednesday and Friday.</p>
  </div>
  <div class="ar-signup" id="join">
    <p class="ar-signup-k">Get the next one in your inbox</p>
    {signup_form('ar')}
  </div>
</section>

<section class="wrap ar-latest" aria-label="Latest issue">
  {featured}
</section>

<section class="wrap ar-list" aria-labelledby="ar-list-title">
  <div class="ar-bar">
    <h2 id="ar-list-title" class="visually-hidden">The library</h2>
    <div class="ar-tabs" role="tablist" aria-label="Filter by format">
      <button class="ar-tab is-on" type="button" data-filter="all" role="tab" aria-selected="true">All <span>{count}</span></button>
      <button class="ar-tab" type="button" data-filter="find" role="tab" aria-selected="false">Useful Find <span>{counts['find']}</span></button>
      <button class="ar-tab" type="button" data-filter="dive" role="tab" aria-selected="false">Deep Dive <span>{counts['dive']}</span></button>
      <button class="ar-tab" type="button" data-filter="five" role="tab" aria-selected="false">Useful Five <span>{counts['five']}</span></button>
    </div>
    <label class="ar-search"><span class="visually-hidden">Search the library</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" placeholder="Search the library" data-search-input></label>
  </div>
  <div class="ar-grid" data-grid>
{cards}
  </div>
  <p class="ar-empty" data-empty hidden>Nothing in the library matches that search.</p>
</section>
<script src="/tech/library/library.js" defer></script>
"""
    return head + body + FOOT.format(year=datetime.now().year)


def build_issue(issue, content, prev_i, next_i):
    desc = issue["subtitle"] or issue["title"]
    ld = {
        "@context": "https://schema.org", "@type": "Article", "headline": issue["title"], "description": desc,
        "datePublished": issue["date"], "image": issue["image"] or f"{SITE}/tech/og.png",
        "author": {"@type": "Person", "name": "Raja"}, "publisher": {"@type": "Organization", "name": "The Useful Media Co"},
        "mainEntityOfPage": f"{SITE}/tech/library/{issue['slug']}/",
    }
    extra = f'<script type="application/ld+json">{json.dumps(ld)}</script>'
    head = HEAD.format(title=f"{issue['title']} | The Useful Tech", desc=esc(desc), canonical=f"{SITE}/tech/library/{issue['slug']}/",
                       ogtype="article", image=esc(issue["image"] or f"{SITE}/tech/og.png"), extra_head=extra, bodyclass="issue")
    hero_img = f'<figure class="is-hero-img">{thumb(issue)}</figure>' if issue["image"] else ""
    nav = []
    if next_i:
        nav.append(f'<a class="is-nav-card" href="/tech/library/{esc(next_i["slug"])}/"><span class="is-nav-k">Newer</span><span class="is-nav-t">{esc(next_i["title"])}</span></a>')
    if prev_i:
        nav.append(f'<a class="is-nav-card is-older" href="/tech/library/{esc(prev_i["slug"])}/"><span class="is-nav-k">Older</span><span class="is-nav-t">{esc(prev_i["title"])}</span></a>')
    day = issue["format"].get("day")
    body = f"""
<article class="is-article wrap">
  <header class="is-head">
    <p class="is-meta">{label(issue)}<span class="ic-date">{esc(issue['date_label'])}</span></p>
    <h1>{esc(issue['title'])}</h1>
    {f'<p class="is-sub">{esc(issue["subtitle"])}</p>' if issue['subtitle'] else ''}
  </header>
  {hero_img}
  <div class="is-body">
{content}
  </div>
</article>

<section class="wrap is-cta" aria-labelledby="is-cta-title">
  <div class="nl-cta">
    <h2 id="is-cta-title">Get the next issue in your inbox</h2>
    {signup_form('is')}
    <p class="nl-cta-note">Free. Monday, Wednesday and Friday. Unsubscribe in one click.</p>
  </div>
</section>

<nav class="wrap is-nav" aria-label="More from the library">
  {''.join(nav)}
  <a class="is-all" href="/tech/library/">Browse the library</a>
</nav>
"""
    return head + body + FOOT.format(year=datetime.now().year)


FORWARD = """<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved to the library</title>
<link rel="canonical" href="{url}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={url}">
<script>location.replace("{url}")</script></head><body><p><a href="{url}">Continue to the library</a></p></body></html>"""


def write_forwards(issues):
    """The library first launched at /tech/issues. Keep those URLs forwarding."""
    os.makedirs(OLD, exist_ok=True)
    with open(os.path.join(OLD, "index.html"), "w") as f:
        f.write(FORWARD.format(url="/tech/library/"))
    for it in issues:
        d = os.path.join(OLD, it["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w") as f:
            f.write(FORWARD.format(url=f"/tech/library/{it['slug']}/"))
    for fn in ("issues.css", "issues.js", "issues.json"):
        p = os.path.join(OLD, fn)
        if os.path.exists(p):
            os.remove(p)


def main():
    sm = fetch(f"{BASE}/sitemap.xml")
    urls = re.findall(r"<loc>(https?://[^<]+/p/[^<]+)</loc>", sm)
    urls = list(dict.fromkeys(urls))
    print(f"{len(urls)} issues in sitemap")
    issues, contents = [], {}
    for u in urls:
        try:
            soup = BeautifulSoup(fetch(u), "lxml")
        except Exception as e:
            print("skip", u, e, file=sys.stderr)
            continue
        meta = parse_meta(soup, u)
        content = extract_content(soup)
        if not content:
            print("no content", u, file=sys.stderr)
            continue
        issues.append(meta)
        contents[meta["slug"]] = content
        time.sleep(0.4)
    if len(issues) < max(3, len(urls) // 2):
        sys.exit(f"Only {len(issues)} of {len(urls)} issues fetched; not overwriting the archive.")
    issues.sort(key=lambda i: i["date"], reverse=True)
    os.makedirs(OUT, exist_ok=True)
    keep = set()
    for idx, it in enumerate(issues):
        newer = issues[idx - 1] if idx > 0 else None
        older = issues[idx + 1] if idx + 1 < len(issues) else None
        d = os.path.join(OUT, it["slug"])
        os.makedirs(d, exist_ok=True)
        keep.add(it["slug"])
        with open(os.path.join(d, "index.html"), "w") as f:
            f.write(build_issue(it, contents[it["slug"]], older, newer))
    with open(os.path.join(OUT, "index.html"), "w") as f:
        f.write(build_archive(issues))
    with open(os.path.join(OUT, "library.json"), "w") as f:
        json.dump([{k: v for k, v in i.items() if k != "raw_title"} for i in issues], f, indent=1)
    # remove pages for issues that no longer exist on Beehiiv
    for name in os.listdir(OUT):
        p = os.path.join(OUT, name)
        if os.path.isdir(p) and name not in keep:
            for fn in os.listdir(p):
                os.remove(os.path.join(p, fn))
            os.rmdir(p)
    write_forwards(issues)
    print(f"Built {len(issues)} library pages")


if __name__ == "__main__":
    main()
