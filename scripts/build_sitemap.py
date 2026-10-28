#!/usr/bin/env python3
"""Rebuilds sitemap.xml from every public page in the repo.

Includes every index.html except redirect stubs (pages that only forward with
location.replace or meta refresh) and pages marked noindex. lastmod is the
date of the last git commit that touched the page, falling back to today.
Run from the repo root:  python3 scripts/build_sitemap.py
"""
import datetime, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://theusefulmedia.com"
SKIP_DIRS = {".git", ".github", "scripts", "assets", "node_modules"}
PRIORITY = ["", "sponsor/", "tech/", "products/", "free/", "studio/", "rosewood/", "wristkeeper/", "about/", "contact/", "links/"]


def last_commit(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(path)], cwd=ROOT,
                             capture_output=True, text=True, timeout=20).stdout.strip()
        return out or None
    except Exception:
        return None


def is_public(text):
    head = text[:4000].lower()
    if 'name="robots"' in head and "noindex" in head:
        return False
    if "location.replace(" in text[:3000] or 'http-equiv="refresh"' in head:
        return False
    return True


def main():
    today = datetime.date.today().isoformat()
    urls = []
    for page in sorted(ROOT.rglob("index.html")):
        rel = page.relative_to(ROOT)
        if set(rel.parts) & SKIP_DIRS:
            continue
        text = page.read_text(encoding="utf-8", errors="ignore")
        if not is_public(text):
            continue
        path = "" if str(rel.parent) == "." else str(rel.parent).replace("\\", "/") + "/"
        urls.append((path, last_commit(page) or today))
    rank = {p: i for i, p in enumerate(PRIORITY)}
    urls.sort(key=lambda u: (rank.get(u[0], len(PRIORITY)), u[0]))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, mod in urls:
        lines.append(f"  <url><loc>{SITE}/{path}</loc><lastmod>{mod}</lastmod></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"sitemap.xml: {len(urls)} pages")


if __name__ == "__main__":
    main()
