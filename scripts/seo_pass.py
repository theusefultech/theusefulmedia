"""SEO and AI-search pass over every built page.

Run after the build scripts. It is idempotent: running it twice changes nothing.

  1. Pages with no JSON-LD get a WebPage + BreadcrumbList block, so Google and
     AI assistants can tell what each page is and where it sits on the site.
  2. Every page without a breadcrumb gets a BreadcrumbList added to its head.
  3. Content images with empty alt text get a description built from the file
     name (watch photos, app screenshots), so they can rank in image search.
     Icons and decorative images (marked aria-hidden or role=presentation, or
     under 48px) keep alt="".

Usage: python3 scripts/seo_pass.py
"""
import json, os, re

SITE = "https://theusefulmedia.com"
ORG = {"@type": "Organization", "name": "The Useful Media Co", "url": SITE + "/"}
SKIP_DIRS = {".git", ".github", "scripts", "assets", "node_modules"}
LABELS = {
    "free": "Free downloads", "tech": "The Useful Tech newsletter", "library": "Library",
    "studio": "Useful Studio", "wristkeeper": "Wristkeeper", "rosewood": "Rosewood Music Box",
    "sponsor": "Sponsor", "about": "About", "contact": "Contact", "products": "Products",
    "privacy": "Privacy policy", "support": "Support", "terms": "Terms of use",
    "press": "Press kit", "credits": "Credits", "links": "Links",
}
LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)


def label(slug):
    return LABELS.get(slug) or slug.replace("-", " ").capitalize()


def crumbs(path, title):
    parts = [p for p in path.strip("/").split("/") if p]
    items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}]
    for i, p in enumerate(parts):
        url = SITE + "/" + "/".join(parts[: i + 1]) + "/"
        name = title if i == len(parts) - 1 else label(p)
        items.append({"@type": "ListItem", "position": i + 2, "name": name, "item": url})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}


def meta(html, attr, key):
    m = re.search(r'<meta[^>]+%s="%s"[^>]+content="([^"]*)"' % (attr, re.escape(key)), html)
    return m.group(1) if m else ""


CASING = {"iphone": "iPhone", "ipad": "iPad", "ios": "iOS", "macos": "macOS", "ai": "AI",
          "imessage": "iMessage", "icloud": "iCloud", "mac": "Mac", "apple": "Apple", "siri": "Siri",
          "claude": "Claude", "whatsapp": "WhatsApp", "pdf": "PDF"}


def looks_random(name):
    # Upload hashes like "zzcmrn" or "1bd23b1d": one short token, no separators.
    return not re.search(r"[-_ ]", name) and (len(name) <= 8 or re.search(r"\d", name))


def alt_from_src(src):
    name = os.path.splitext(os.path.basename(src.split("?")[0]))[0]
    name = re.sub(r"[-_](\d{2,4}(w|x\d+)?|@\dx)$", "", name)  # drop size suffixes
    if not name or looks_random(name):
        return ""
    words = [CASING.get(w.lower(), w) for w in re.split(r"[-_]+", name) if w]
    text = " ".join(words)
    if words[0] in CASING.values():
        return text
    return text[:1].upper() + text[1:]


def nearby_heading(html, pos):
    m = re.search(r"<h[2-4][^>]*>(.*?)</h[2-4]>", html[pos:pos + 800], re.S)
    return re.sub(r"<[^>]+>|\s+", " ", m.group(1)).strip() if m else ""


def fix_alts(html, page_hint):
    out, last = [], 0
    for m in re.finditer(r'<img\b[^>]*\balt=""[^>]*>', html):
        tag = m.group(0)
        new = tag
        src = re.search(r'src="([^"]+)"', tag)
        w = re.search(r'width="(\d+)"', tag)
        decorative = (re.search(r'aria-hidden="true"|role="presentation"', tag) or (w and int(w.group(1)) < 48)
                      or not src or "icon" in src.group(1).lower() or src.group(1).split("?")[0].endswith(".svg"))
        if not decorative:
            s = src.group(1)
            text = alt_from_src(s) or nearby_heading(html, m.end())
            if text:
                if "/watches/" in s:
                    text = f"{text} watch in the Wristkeeper app"
                elif "/assets/products/" in s or "/free/img/" in s:
                    text = f"{text} cover"
                elif page_hint:
                    text = f"{text}, {page_hint}"
                new = tag.replace('alt=""', 'alt="%s"' % text.replace('"', "")[:120])
        out.append(html[last:m.start()]); out.append(new); last = m.end()
    out.append(html[last:])
    return "".join(out)


def process(fp, path):
    html = open(fp, encoding="utf-8").read()
    if re.search(r'<meta[^>]+name="robots"[^>]+noindex', html) or "http-equiv=\"refresh\"" in html:
        return False
    orig = html
    title = re.sub(r"\s*\|.*$", "", (re.search(r"<title>([^<]*)", html) or [None, ""])[1]).strip()
    blocks = LD_RE.findall(html)
    add = []
    if not blocks:
        add.append({
            "@context": "https://schema.org", "@type": "WebPage", "name": title,
            "description": meta(html, "name", "description"),
            "url": SITE + path, "inLanguage": "en", "publisher": ORG,
        })
    if path != "/" and not any("BreadcrumbList" in b for b in blocks):
        add.append(crumbs(path, title))
    if add:
        tags = "".join('\n<script type="application/ld+json">%s</script>' % json.dumps(a, ensure_ascii=False) for a in add)
        html = html.replace("</head>", tags + "\n</head>", 1)
    hint = {"wristkeeper": "Wristkeeper app screen", "rosewood": "Rosewood Music Box app",
            "studio": "made with Useful Studio"}.get(path.strip("/").split("/")[0], "")
    html = fix_alts(html, hint)
    if html != orig:
        open(fp, "w", encoding="utf-8").write(html)
        return True
    return False


def main():
    changed = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if "index.html" in files:
            rel = os.path.relpath(root, ".")
            path = "/" if rel == "." else "/" + rel.replace(os.sep, "/") + "/"
            if process(os.path.join(root, "index.html"), path):
                changed.append(path)
    print(f"seo_pass: updated {len(changed)} pages")
    for p in changed:
        print("  ", p)


if __name__ == "__main__":
    main()
