"""Site-wide wiring for every page of theusefulmedia.com. Idempotent: running it twice changes nothing.

  1. Real-visitor counter: adds <script src="/apps/hit.js" defer> to every HTML page (the Worker at
     /apps/api/hit counts people, drops bots, stores no IP). Redirect stubs get it too, so the
     source of a /wristkeeper/from/x/ or newsletter issue link is carried to the page it opens.
  2. Newsletter: public pages with no link to /tech/ get a small sign-up line before </footer>
     (or before </body> when the page has no footer).
  3. Directory links: public pages that never link to /apps/ get a short "More from The Useful
     Media Co" line pointing at The Useful Apps and its most useful guides.

Usage: python3 scripts/site_wiring.py
"""
import os, re

SKIP_DIRS = {".git", ".github", "scripts", "assets", "node_modules", "files", "ig"}
BEACON = '<script src="/apps/hit.js" defer></script>'
MARK_NL = "data-tum-nl"
MARK_APPS = "data-tum-apps"
NL = ('<p %s style="margin:18px 0 0;font-size:14px">Free: <a href="/tech/?utm_source=site&amp;utm_medium=footer&amp;utm_campaign=%s">'
      'The Useful Tech newsletter</a>, the Mac and iPhone apps and settings worth your time, Monday, Wednesday and Friday.</p>')
APPS = ('<p %s style="margin:10px 0 0;font-size:14px">More from The Useful Media Co: <a href="/apps/">The Useful Apps</a>, '
        'Mac and iPhone apps worth paying for and where they cost least, with guides to the '
        '<a href="/apps/collections/new-mac/">first apps for a new Mac</a> and the <a href="/apps/best/">best app for each job</a>.</p>')


def is_stub(h):
    return "location.replace(" in h[:3000] or 'http-equiv="refresh"' in h[:4000].lower()


def is_noindex(h):
    return bool(re.search(r'<meta[^>]+name="robots"[^>]+noindex', h[:5000]))


def insert_before_footer_end(h, snippet):
    i = h.rfind("</footer>")
    if i == -1:
        i = h.rfind("</body>")
    if i == -1:
        return h
    # inside the footer's last wrapping div when there is one, so it picks up the footer's padding
    j = h.rfind("</div>", 0, i)
    k = h.rfind("<footer", 0, i)
    if k != -1 and j > k and h[j:i].strip() == "</div>":
        i = j
    return h[:i] + snippet + "\n" + h[i:]


def process(fp, path):
    h = open(fp, encoding="utf-8").read()
    if "<html" not in h[:500].lower():
        return False
    orig = h
    if "/apps/hit.js" not in h:
        h = h.replace("</head>", BEACON + "\n</head>", 1) if "</head>" in h else h.replace("</body>", BEACON + "\n</body>", 1)
    if not is_stub(h) and not is_noindex(h) and path != "/404.html":
        section = path.strip("/").split("/")[0] or "home"
        if not re.search(r'href="(https://theusefulmedia\.com)?/tech/[?"]', h) and MARK_NL not in h:
            h = insert_before_footer_end(h, NL % (MARK_NL, section))
        if not re.search(r'href="(https://theusefulmedia\.com)?/apps/', h) and MARK_APPS not in h:
            h = insert_before_footer_end(h, APPS % MARK_APPS)
    if h != orig:
        open(fp, "w", encoding="utf-8").write(h)
        return True
    return False


def main():
    changed = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith(".html") or f.startswith("google"):
                continue
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, ".").replace(os.sep, "/")
            path = "/" + (rel[: -len("index.html")] if rel.endswith("index.html") else rel)
            if process(fp, path):
                changed.append(path)
    print(f"site_wiring: updated {len(changed)} pages")


if __name__ == "__main__":
    main()
