#!/usr/bin/env python3
"""Visual pass for The Useful Library (visual check, 24 Nov 2026, item 10 batch 4).

Free, rules only. Runs at the end of scripts/build_library_site.py and scripts/library_recs.py, so a rebuild never
drops it, and can be run on its own:  python3 scripts/library_visuals.py
Every change uses what the Library already has (its drawn scenes in scripts/library_art.py and the book covers):
  - area sections on hubs get that area's drawn scene beside the heading
  - long idea grids become swipe rows on phones (assets/hrow.js: swipe, buttons, drag, arrow keys)
  - problem cards' book covers and the people list's covers count as visuals; each person shows their top 3 covers
  - /library/books/ gets the shelf scene in its first screen; book and problem pages get a scene mid-page
  - paragraphs over 45 words split at a sentence break
A page carries data-lv once done; rebuilt pages lose it and get the pass again.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import library_art as A

LIB = os.path.join(ROOT, "library")
AREAS = {"Habits and discipline": "habits", "Focus and productivity": "focus", "Money and wealth mindset": "money",
         "Mindset and emotions": "mindset", "Ideas": None, "Problems": None}
SENT = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"“(])")
HROW = '<script src="/assets/hrow.js" defer></script>'
# long lists: the first n show, then "Show all"; every item stays in the HTML for search engines
MORE = ('<script>document.querySelectorAll("[data-lv-more]").forEach(function(g){var n=+g.dataset.lvMore,k=[].slice.call(g.children);'
        'if(k.length<=n+3)return;k.slice(n).forEach(function(c){c.style.display="none"});var b=document.createElement("button");'
        'b.type="button";b.className="btn btn-line lv-more";b.textContent="Show all "+k.length+" books";b.onclick=function(){'
        'k.forEach(function(c){c.style.display=""});b.remove();var f=k[n].querySelector("a,button");if(f)f.focus()};g.after(b)})</script>')


def words(s):
    return len(re.sub(r"<[^>]+>", " ", s).split())


def art(name, cls):
    return f'<span class="{cls}" data-visual aria-hidden="true">{A.scene(name)}</span>'


def split_long(seg):
    """Paragraphs over 45 words split at a sentence break; skipped when a split would cut an inline tag."""
    def fix(m):
        attrs, inner = m.group(1) or "", m.group(2)
        if words(inner) <= 45 or re.search(r"<(p|div|ul|ol|img|br)\b", inner):
            return m.group(0)
        parts = SENT.split(inner)
        chunks, cur = [], ""
        for x in parts:
            if cur and words(cur + " " + x) > 35:
                chunks.append(cur); cur = x
            else:
                cur = (cur + " " + x).strip()
        if cur:
            chunks.append(cur)
        ok = lambda c: len(re.findall(r"<[a-z]", c)) == len(re.findall(r"</[a-z]", c))
        if len(chunks) < 2 or not all(ok(c) for c in chunks):
            return m.group(0)
        return "".join(f"<p{attrs}>{c}</p>" for c in chunks)
    return re.sub(r"<p((?:\s[^>]*)?)>(.*?)</p>", fix, seg, flags=re.S)


def page_area(raw):
    m = re.search(r'data-area="(habits|focus|money|mindset)"', raw)
    return m.group(1) if m else "read"


def person_covers(href):
    """First 3 book covers on a person's page: real covers, or the drawn covers used for books without one."""
    f = os.path.join(ROOT, href.strip("/"), "index.html")
    if not os.path.exists(f):
        return []
    m = re.search(r"<main\b.*?</main>", open(f, encoding="utf-8").read(), re.S)
    out = []
    for c in re.finditer(r'<img src="(/library/img/covers/[^"]+)"[^>]*>|<svg class="dcover".*?</svg>', m.group(0) if m else "", re.S):
        if c.group(1):
            out.append(f'<img src="{c.group(1)}" alt="" width="40" height="61" loading="lazy">')
        else:
            out.append(re.sub(r'width="64" height="97"', 'width="40" height="61"', c.group(0), count=1).replace(" data-visual", "").replace('role="img"', 'aria-hidden="true"'))
        if len(out) == 3:
            break
    return out


def head_art(seg, h2_rx, scene):
    """Wrap the first <h2> matching h2_rx with the area scene beside it."""
    return re.sub(r"(<h2[^>]*>(?:" + h2_rx + r")</h2>)", lambda m: f'<div class="hub-h">{m.group(1)}{art(scene, "hub-art")}</div>', seg, count=1)


def process(path):
    raw = open(path, encoding="utf-8").read()
    m = re.search(r"<main\b[^>]*>.*?</main>", raw, re.S)
    if not m or 'data-lv="1"' in m.group(0)[:300]:
        return False
    seg = m.group(0)
    rel = "/" + os.path.relpath(os.path.dirname(path), ROOT).replace(os.sep, "/") + "/"
    seg = seg.replace('class="pcard-covers">', 'class="pcard-covers" data-visual>')
    # hubs already draw the area scene at 64px, just under what counts as a visual: show it at 84px
    seg = re.sub(r'(<section class="hub-sec"[^>]*><div[^>]*><span class="art-box")', r'\1 data-visual', seg)
    # area sections on hubs: the area's scene beside the heading
    for title, scene in AREAS.items():
        if scene:
            seg = re.sub(r'(<section class="hub-sec"[^>]*>)(<h2[^>]*>' + re.escape(title) + r"</h2>)",
                         lambda mm: f'{mm.group(1)}<div class="hub-h">{mm.group(2)}{art(scene, "hub-art")}</div>', seg)
    # long idea grids: swipe rows on phones
    rows = False
    def rowify(mm):
        nonlocal rows
        body = mm.group(0)
        if body.count("icard") > 4:
            rows = True
            return body.replace('<div class="grid">', '<div class="grid irow" data-hrow>', 1)
        return body
    seg = re.sub(r'<section class="hub-sec".*?</section>', rowify, seg, flags=re.S)
    if rel in ("/library/books/", "/library/problems/"):
        scene = "shelf" if rel == "/library/books/" else "habits"
        seg = re.sub(r"(<section\b)([^>]*)(>.*?)(</section>)", lambda mm: f'{mm.group(1)} data-hero-art{mm.group(2)}{mm.group(3)}{art(scene, "hub-art hub-art-lg")}{mm.group(4)}', seg, count=1, flags=re.S)
    if rel == "/library/people/":
        def cov(mm):
            imgs = "".join(person_covers(mm.group(3)))
            if not imgs:
                return mm.group(0)
            return f'{mm.group(1)} pp-card{mm.group(2)}<span class="pcard-covers pp-covers" data-visual>{imgs}</span>'
        seg = re.sub(r'(<a class="card lift)("[^>]*?href="(/library/people/[^"/]+/)"[^>]*>)', lambda mm: cov(mm), seg)
    seg = seg.replace('<div class="cells">', '<div class="cells" data-visual>').replace('<div class="sum-time">', '<div class="sum-time" data-visual>')
    if rel.startswith("/library/books/") and rel.count("/") == 4:
        seg = head_art(seg, r"\d+ ideas from this book", page_area(raw))
        # the "Read it if" card gets the reading scene, so the second half of the page isn't text only
        seg = seg.replace('<p class="mono">Read it if</p>', f'<div class="hub-h"><p class="mono">Read it if</p>{art("read", "hub-art")}</div>', 1)
        seg = split_long(seg)
    if rel.startswith("/library/problems/") and rel.count("/") == 4:
        seg = head_art(seg, r"Test your fix[^<]*", page_area(raw))
        seg = split_long(seg)
    more = False
    if rel == "/library/recommended/":
        seg, k = re.subn(r'(<section class="hub-sec"><div)', r'\1 data-lv-more="15"', seg, count=1)
        more = bool(k)
    seg = re.sub(r"<main\b", '<main data-lv="1"', seg, count=1)
    out = raw[:m.start()] + seg + raw[m.end():]
    if more and "data-lv-more" in out and MORE not in out:
        out = out.replace("</body>", MORE + "\n</body>", 1)
    if rows and HROW not in out:
        out = out.replace("</body>", HROW + "\n</body>", 1)
    if out != raw:
        open(path, "w", encoding="utf-8").write(out)
        return True
    return False


def run():
    n = sum(process(p) for p in glob.glob(os.path.join(LIB, "**", "index.html"), recursive=True))
    print(f"library_visuals: {n} pages updated")


if __name__ == "__main__":
    run()
