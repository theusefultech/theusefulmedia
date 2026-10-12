#!/usr/bin/env python3
"""Refreshes the "Latest" block on theusefulmedia.com/links (The Useful Tech link in bio).

Pulls the newest story from The Useful Tech publication on Medium and the newest
newsletter issue from tech/library/library.json (built by build_library.py),
then rewrites the block between <!--LATEST:START--> and <!--LATEST:END--> in
links/index.html. If Medium can't be reached, the existing block is kept.
Run from the repo root:  python3 scripts/build_links.py
"""
import html, json, os, re, sys, urllib.request
from email.utils import parsedate_to_datetime

FEED = "https://medium.com/feed/the-useful-tech"
PAGE = os.path.join("links", "index.html")
LIB = os.path.join("tech", "library", "library.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
UTM = "utm_source=instagram&utm_medium=linkinbio&utm_campaign=tut"


def esc(s):
    return html.escape(s or "", quote=True)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def cdata(s):
    m = re.match(r"\s*<!\[CDATA\[(.*)\]\]>\s*$", s or "", re.S)
    return (m.group(1) if m else html.unescape(s or "")).strip()


def latest_story():
    xml = fetch(FEED)
    item = re.search(r"<item>(.*?)</item>", xml, re.S)
    if not item:
        return None
    it = item.group(1)
    get = lambda tag: cdata((re.search(rf"<{tag}>(.*?)</{tag}>", it, re.S) or [None, ""])[1])
    link = get("link").split("?")[0]
    body = get("content:encoded")
    img = re.search(r'<img[^>]+src="([^"]+)"', body)
    when = parsedate_to_datetime(get("pubDate"))
    return {
        "title": get("title"),
        "url": link,
        "image": img.group(1) if img else "",
        "date": when.strftime("%b %-d"),
    }


def latest_issue():
    try:
        issues = json.load(open(LIB))
    except Exception:
        return None
    if not issues:
        return None
    i = issues[0]
    m = re.match(r"(the-useful-find|the-deep-dive|the-useful-five)-(\d+)", i["slug"])
    if m:
        label = m.group(1).replace("-", " ").title() + " #" + m.group(2)
    else:
        label = "Newsletter"
    return {
        "title": i.get("title", ""),
        "url": "https://theusefulmedia.com/tech/library/" + i["slug"] + "/",
        "image": i.get("image", ""),
        "label": label,
        "date": i.get("date_label", "").rsplit(",", 1)[0],
    }


def card(kind, item):
    sep = "&" if "?" in item["url"] else "?"
    url = item["url"] + sep + UTM
    thumb = f'<img src="{esc(item["image"])}" alt="" loading="lazy" decoding="async">' if item.get("image") else ""
    return (
        f'<a class="post" href="{esc(url)}" data-go>'
        f'<span class="post-thumb">{thumb}</span>'
        f'<span class="post-copy"><span class="post-kicker mono">{esc(kind)} · {esc(item["date"])}</span>'
        f'<span class="post-title">{esc(item["title"])}</span></span>'
        f'<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6"/></svg></a>'
    )


def main():
    page = open(PAGE).read()
    start, end = "<!--LATEST:START-->", "<!--LATEST:END-->"
    if start not in page or end not in page:
        sys.exit("Markers missing in links/index.html")
    try:
        story = latest_story()
    except Exception as e:  # keep the old block if Medium is unreachable
        print("Medium feed failed:", e, file=sys.stderr)
        return
    issue = latest_issue()
    parts = []
    if story:
        parts.append(card("Latest on Medium", story))
    if issue:
        parts.append(card(issue["label"], issue))
    if not parts:
        return
    block = start + "\n" + "\n".join(parts) + "\n" + end
    new = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, page, flags=re.S)
    if new != page:
        open(PAGE, "w").write(new)
        print("Updated latest block")
    else:
        print("No change")


if __name__ == "__main__":
    main()
