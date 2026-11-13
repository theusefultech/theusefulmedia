#!/usr/bin/env python3
"""Fills the homepage "New this week" row (Raja approved 13 Nov 2026, "ok redo").

4 cards, newest first, so the homepage never goes stale:
  1. The newest The Useful Tech newsletter issue (tech/library/library.json, links to our own library page)
  2. The newest Useful Library page (library/feed.xml, skipping the About page)
  3. The best live Black Friday or app deal (theusefulmedia.com/apps/llms.txt "Black Friday" section)
  4. The newest compare page on The Useful Apps (theusefulmedia.com/apps/sitemap.xml)
Writes between <!-- fresh:start --> and <!-- fresh:end --> in index.html. If a source can't be read,
that card keeps what it had. Run daily by .github/workflows/refresh-facts.yml.
"""
import datetime as dt, html, json, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
SITE = "https://theusefulmedia.com"
TODAY = dt.date.today().isoformat()


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "theusefulmedia-home-fresh"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "ignore")


def card(kind, k_label, title, sub, href, cta, ext=False):
    t = ' target="_blank" rel="noopener"' if ext else ""
    return (f'<a class="fresh-card fresh--{kind}" href="{html.escape(href)}"{t} data-fresh="{kind}">'
            f'<span class="fresh-k">{html.escape(k_label)}</span>'
            f'<span class="fresh-t">{html.escape(title)}</span>'
            f'<span class="fresh-s">{html.escape(sub)}</span>'
            f'<span class="fresh-c">{html.escape(cta)} <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9 9 3M4 3h5v5"/></svg></span></a>')


def issue():
    d = json.loads((ROOT / "tech/library/library.json").read_text())
    x = sorted(d, key=lambda i: i.get("date", ""), reverse=True)[0]
    return card("issue", f"Newsletter, {x.get('date_label') or x['date'][:10]}", x["title"], x.get("subtitle", ""),
                f"/tech/library/{x['slug']}/", "Read the issue")


def library():
    s = (ROOT / "library/feed.xml").read_text()
    entries = re.findall(r"<entry>(.*?)</entry>", s, re.S)
    best = None
    for e in entries:
        link = re.search(r'<link href="([^"]+)"', e).group(1)
        if link.rstrip("/").endswith("/about"):
            continue
        upd = re.search(r"<updated>([^<]+)", e).group(1)
        if best is None or upd > best[0]:
            best = (upd, html.unescape(re.search(r"<title>([^<]+)", e).group(1)),
                    html.unescape((re.search(r"<summary>([^<]*)", e) or [None, ""])[1]), link)
    _, title, summ, link = best
    return card("library", "The Useful Library", title, summ[:120], link.replace(SITE, ""), "Open it")


def deal():
    txt = get(SITE + "/apps/llms.txt")
    sec = re.search(r"## Black Friday[^\n]*\n(.*?)(?:\n## |\Z)", txt, re.S)
    if not sec:
        raise ValueError("no deals section")
    live, soon = [], []
    for line in sec.group(1).splitlines():
        m = re.match(r"- ([^:]+): (.+?)\. (https://\S+)", line.strip())
        if not m:
            continue
        name, what, url = m.groups()
        starts = re.search(r"from (\d{4}-\d{2}-\d{2})", what)
        ends = re.search(r"until (\d{4}-\d{2}-\d{2})", what)
        if ends and ends.group(1) < TODAY:
            continue
        clean = re.sub(r", (from|until) \d{4}-\d{2}-\d{2}", "", what)
        (soon if starts and starts.group(1) > TODAY else live).append((name, clean, url))
    pick = (live or soon)[0]
    label = "Black Friday deal" if live else "Black Friday deal, starts soon"
    return card("deal", label, f"{pick[0]}: {pick[1]}", f"Plus every other confirmed Mac and iPhone app deal, checked daily.",
                "/apps/deals/", "See all deals")


def compare():
    xml = get(SITE + "/apps/sitemap.xml")
    rows = re.findall(r"<loc>(https://theusefulmedia.com/apps/compare/([^<]+?)/)</loc><lastmod>([^<]+)</lastmod>", xml)
    url, key, _ = sorted(rows, key=lambda r: r[2], reverse=True)[0]
    a, b = key.split("-vs-", 1)
    nice = lambda s: " ".join(w.capitalize() for w in s.split("-"))
    return card("compare", "New on The Useful Apps", f"{nice(a)} vs {nice(b)}",
                "Which one to pick, with real prices and what each does better.", url.replace(SITE, ""), "Compare them")


def main():
    s = INDEX.read_text()
    m = re.search(r"<!-- fresh:start -->(.*?)<!-- fresh:end -->", s, re.S)
    if not m:
        raise SystemExit("fresh markers missing in index.html")
    old = {k: c for c, k in re.findall(r'(<a class="fresh-card fresh--(\w+)".*?</a>)', m.group(1), re.S)}
    cards = []
    for kind, fn in (("issue", issue), ("library", library), ("deal", deal), ("compare", compare)):
        try:
            cards.append(fn())
        except Exception as e:  # keep the old card
            print(kind, "kept:", e)
            if kind in old:
                cards.append(old[kind])
    new = "<!-- fresh:start -->\n" + "\n".join(cards) + "\n<!-- fresh:end -->"
    books = len([d for d in (ROOT / "library/books").iterdir() if d.is_dir()])
    s = re.sub(r"(<b data-books>)\d+(</b>)", rf"\g<1>{books}\2", s)
    m = re.search(r"<!-- fresh:start -->(.*?)<!-- fresh:end -->", s, re.S)
    out = s[:m.start()] + new + s[m.end():]
    if out != INDEX.read_text():
        INDEX.write_text(out)
        print("home fresh updated")
    else:
        print("home fresh unchanged")


if __name__ == "__main__":
    main()
