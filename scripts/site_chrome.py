"""Give newsletter pages (tech/**) the main site menu and footer (14 Nov 2026, Raja: no dead ends).

Source of truth is index.html: its Main nav and its sf2 footer. Idempotent.
Run: python3 scripts/site_chrome.py   (build_library.py also calls run() at the end).
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAV_RE = re.compile(r'<nav class="nav" aria-label="Main">.*?</nav>', re.S)
FOOT_RE = re.compile(r'<footer class="site-footer sf2">.*?</footer>', re.S)


def parts():
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    nav = re.sub(r' aria-current="page"', "", NAV_RE.search(home).group(0))
    foot = FOOT_RE.search(home).group(0)
    return nav, foot


def apply(html, nav, foot, current="/tech/"):
    navc = nav.replace(f'<a href="{current}">', f'<a href="{current}" aria-current="page">', 1)
    if 'aria-label="Main"' in html:
        html = NAV_RE.sub(lambda m: navc, html, count=1)
    else:
        html = html.replace('<a class="is-head-link" href="/tech/library/">Library</a>\n', "", 1)
        html = re.sub(r'(<div class="header-end">\s*)', lambda m: m.group(1) + navc + "\n      ", html, count=1)
    html = re.sub(r'<footer class="nl-footer">.*?</footer>', lambda m: foot, html, count=1, flags=re.S)
    html = FOOT_RE.sub(lambda m: foot, html, count=1)
    return html


def run():
    nav, foot = parts()
    n = 0
    for p in (ROOT / "tech").rglob("index.html"):
        s = p.read_text(encoding="utf-8")
        if '<header class="site-header">' not in s:
            continue
        t = apply(s, nav, foot)
        if t != s:
            p.write_text(t, encoding="utf-8"); n += 1
    for p in ROOT.rglob("*.html"):
        if ".git" in p.parts or "tech" in p.parts[len(ROOT.parts):len(ROOT.parts)+1]:
            continue
        s = p.read_text(encoding="utf-8")
        if '<footer class="site-footer sf2">' in s and p.name != "index.html" or (p.name == "index.html" and p.parent != ROOT and FOOT_RE.search(s)):
            t = FOOT_RE.sub(lambda m: foot, s, count=1)
            if t != s:
                p.write_text(t, encoding="utf-8"); n += 1
    print(f"site_chrome: updated {n} pages")


if __name__ == "__main__":
    run()
