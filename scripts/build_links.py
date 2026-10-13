#!/usr/bin/env python3
"""Refreshes theusefulmedia.com/links (The Useful Tech link in bio).

1. Posts grid: pulls the 9 newest @theusefultech Instagram posts, saves their
   thumbnails to links/ig/, and sends each tile to the link its caption promises
   (Useful Studio, the free App Library, Siri AI Daily Ten and so on). Captions
   with no promise go to the newsletter. links/ig-overrides.json can force a
   destination for any shortcode: {"SHORTCODE": {"url": "...", "label": "..."}}.
2. Latest: the newest Medium story and newsletter issue.
Each block is only rewritten when its source answers, so a failed fetch keeps
the page as it was.
Run from the repo root:  python3 scripts/build_links.py
"""
import glob, html, json, os, re, sys, urllib.request
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


IG_API = "https://i.instagram.com/api/v1/users/web_profile_info/?username=theusefultech"
IG_DIR = os.path.join("links", "ig")
FREE = "https://newsletter.theusefultech.com/products/"
NEWSLETTER = ("https://theusefulmedia.com/tech/", "Newsletter")
RULES = [  # first match wins; matched against the lower-cased caption
    (("textlore",), ("https://textlore.app/", "Textlore")),
    (("useful studio",), ("https://theusefulmedia.com/studio/", "Useful Studio")),
    (("100 siri ai prompts",), ("https://theusefultech.gumroad.com/l/siri-prompts", "100 Siri AI Prompts")),
    (("iphone setup guide",), ("https://theusefultech.gumroad.com/l/iPhone-setup-guide", "iPhone Setup Guide")),
    (("mac setup guide",), ("https://theusefultech.gumroad.com/l/mac-setup-guide", "Mac Setup Guide")),
    (("claude app playbook",), ("https://theusefultech.gumroad.com/l/claude-app-playbook", "Claude App Playbook")),
    (("cowork mastery",), ("https://theusefultech.gumroad.com/l/cowork-mastery-guide", "Cowork Mastery")),
    (("app library",), (FREE + "the-useful-tech-app-library", "Free App Library")),
    (("daily ten", "siri ai prompts", "siri prompts", "10 siri"), (FREE + "siri-ai-daily-ten-prompts", "Free Siri prompts")),
    (("settings checklist",), (FREE + "the-ios-27-settings-checklist", "Free checklist")),
    (("macos 27 feature list", "macos 27 features list"), (FREE + "everything-new-in-macos-27-the-complete-feature-list", "Free macOS 27 list")),
    (("ios 27 feature list",), (FREE + "everything-new-in-ios-27-the-complete-feature-list", "Free iOS 27 list")),
    (("ipad cheat sheet",), (FREE + "ipad-cheat-sheet", "Free iPad sheet")),
    (("watch face",), (FREE + "apple-watch-face-sheet", "Free watch sheet")),
    (("notes features",), (FREE + "25-hidden-apple-notes-features", "Free Notes guide")),
    (("subscription swap",), (FREE + "the-subscription-swap-sheet", "Free swap sheet")),
]


def fetch_bytes(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def destination(code, caption, overrides):
    if code in overrides:
        o = overrides[code]
        return o["url"], o.get("label", "Open")
    text = caption.lower()
    for keys, (url, label) in RULES:
        if any(k in text for k in keys):
            # once a freebie has its own page on the site, send people there instead of Beehiiv
            if url.startswith(FREE):
                slug = url[len(FREE):]
                if os.path.exists(os.path.join("free", slug, "index.html")):
                    url = f"https://theusefulmedia.com/free/{slug}/"
            return url, label
    return NEWSLETTER


def ig_block():
    """Merges the newest posts into links/ig-archive.json (so older posts stay on
    the page after they drop out of Instagram's first page) and renders tiles."""
    cached = os.environ.get("IG_JSON")  # optional: a saved copy of the API response
    if cached == "none":  # rebuild the grid from the archive only (Instagram blocked)
        raw = b'{"data":{"user":{"edge_owner_to_timeline_media":{"edges":[]}}}}'
    else:
        raw = open(cached, "rb").read() if cached else fetch_bytes(IG_API, {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "x-ig-app-id": "936619743392459"})
    edges = json.loads(raw)["data"]["user"]["edge_owner_to_timeline_media"]["edges"]
    try:
        overrides = json.load(open(os.path.join("links", "ig-overrides.json")))
    except Exception:
        overrides = {}
    archive_path = os.path.join("links", "ig-archive.json")
    try:
        archive = {p["code"]: p for p in json.load(open(archive_path))}
    except Exception:
        archive = {}
    os.makedirs(IG_DIR, exist_ok=True)
    for e in edges:
        n = e["node"]
        code = n["shortcode"]
        caps = n.get("edge_media_to_caption", {}).get("edges") or []
        caption = caps[0]["node"]["text"] if caps else ""
        img = os.path.join(IG_DIR, code + ".jpg")
        if not os.path.exists(img):
            src = n.get("thumbnail_tall_src") or n.get("thumbnail_src") or n["display_url"]
            try:
                open(img, "wb").write(fetch_bytes(src))
            except Exception as err:
                print("thumbnail failed", code, err, file=sys.stderr)
        archive[code] = {"code": code, "caption": caption, "reel": bool(n.get("is_video")),
                         "taken": n.get("taken_at_timestamp", 0)}
    # A post added by hand (while Instagram blocked us) is dropped once the real one arrives:
    # any fetched post from the same time or later that goes to the same place replaces it.
    fetched = [archive[e["node"]["shortcode"]] for e in edges]
    for code, p in list(archive.items()):
        if p.get("manual") and any(
                f["taken"] >= p["taken"] - 86400 and destination(f["code"], f["caption"], overrides)[0]
                == destination(code, p["caption"], overrides)[0] for f in fetched):
            del archive[code]
    posts = sorted(archive.values(), key=lambda p: p["taken"], reverse=True)
    json.dump(posts, open(archive_path, "w"), indent=1)
    tiles = []
    for i, p in enumerate(posts):
        code, caption = p["code"], p["caption"]
        url, label = destination(code, caption, overrides)
        custom = overrides.get(code, {}).get("image")
        src_attr = custom or f"/links/ig/{code}.jpg"
        first = re.split(r"(?<=[.!?])\s", caption.strip().split("\n")[0], maxsplit=1)[0][:140]
        sep = "&" if "?" in url else "?"
        cls = "tile" if i < 9 else "tile is-old"
        tiles.append(
            f'<a class="{cls}" href="{esc(url + sep + UTM)}" data-go aria-label="{esc(first)}. Opens {esc(label)}">'
            f'<img src="{esc(src_attr)}" alt="" loading="lazy" decoding="async">'
            + ('<svg class="tile-reel" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z"/></svg>' if p["reel"] else "")
            + f'<span class="tile-label">{esc(label)}</span></a>'
        )
    return "\n".join(tiles)


def replace_block(page, name, inner):
    start, end = f"<!--{name}:START-->", f"<!--{name}:END-->"
    if start not in page or end not in page:
        sys.exit(f"{name} markers missing in links/index.html")
    block = start + "\n" + inner + "\n" + end
    return re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, page, flags=re.S)


def main():
    page = open(PAGE).read()
    new = page
    try:
        new = replace_block(new, "IG", ig_block())
    except Exception as e:  # Instagram often refuses datacenter IPs; keep the old grid
        print("Instagram fetch failed:", e, file=sys.stderr)
    try:
        story = latest_story()
    except Exception as e:
        print("Medium feed failed:", e, file=sys.stderr)
        story = None
    issue = latest_issue()
    parts = []
    if story:
        parts.append(card("Latest on Medium", story))
    if issue:
        parts.append(card(issue["label"], issue))
    if story and parts:
        new = replace_block(new, "LATEST", "\n".join(parts))
    if new != page:
        open(PAGE, "w").write(new)
        print("Updated links page")
    else:
        print("No change")


if __name__ == "__main__":
    main()
