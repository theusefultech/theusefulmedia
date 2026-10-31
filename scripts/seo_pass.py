"""SEO and AI-search pass over every built page.

Run after the build scripts. It is idempotent: running it twice changes nothing.

  1. Pages with no JSON-LD get a WebPage + BreadcrumbList block, so Google and
     AI assistants can tell what each page is and where it sits on the site.
  2. Every page without a breadcrumb gets a BreadcrumbList added to its head.
  3. Content images with empty alt text get a description built from the file
     name (watch photos, app screenshots), so they can rank in image search.
     Icons and decorative images (marked aria-hidden or role=presentation, or
     under 48px) keep alt="".
  4. Local JPG and PNG images get a smaller WebP copy and the page points to
     it (og:image tags stay JPG/PNG for social cards). Images with no width
     and height get their real size, so the layout never jumps while loading.

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


# ---------- Images: WebP and explicit sizes ----------
try:
    from PIL import Image
except ImportError:  # the workflow installs Pillow; skip quietly elsewhere
    Image = None

_size_cache = {}


def local_file(src, page_dir):
    src = src.split("?")[0].split("#")[0]
    if not src or src.startswith(("http:", "https:", "data:", "//")):
        return None
    fp = os.path.normpath(os.path.join(".", src.lstrip("/")) if src.startswith("/") else os.path.join(page_dir, src))
    return fp if os.path.isfile(fp) else None


def to_webp(fp):
    """Make a .webp copy next to a JPG or PNG. Returns its path if it is smaller."""
    base, ext = os.path.splitext(fp)
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        return None
    out = base + ".webp"
    if not os.path.exists(out):
        if Image is None:
            return None
        try:
            im = Image.open(fp)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "transparency" in im.info or im.mode in ("LA", "P") else "RGB")
            im.save(out, "WEBP", quality=82, method=6)
        except Exception:
            return None
    if os.path.getsize(out) >= os.path.getsize(fp):
        return None
    return out


def dims(fp):
    if fp not in _size_cache:
        try:
            with Image.open(fp) as im:
                _size_cache[fp] = im.size
        except Exception:
            _size_cache[fp] = None
    return _size_cache[fp]


def web_path(src, fp, new_fp):
    return src[: len(src) - len(os.path.basename(fp))] + os.path.basename(new_fp) if src.endswith(os.path.basename(fp)) else src


def fix_images(html, page_dir):
    def one(m):
        tag = m.group(0)
        sm = re.search(r'\bsrc="([^"]+)"', tag)
        if not sm:
            return tag
        src = sm.group(1)
        if "media.beehiiv.com/cdn-cgi/image/" in tag and "format=" not in tag:
            # Beehiiv's image CDN serves AVIF or WebP to browsers that take them.
            tag = tag.replace("/cdn-cgi/image/", "/cdn-cgi/image/format=auto,")
            return tag
        fp = local_file(src, page_dir)
        if not fp:
            return tag
        if Image is None:
            return tag
        webp = to_webp(fp)
        if webp:
            tag = tag.replace('src="%s"' % src, 'src="%s"' % web_path(src.split("?")[0], fp, webp), 1)
            fp = webp
        ss = re.search(r'\bsrcset="([^"]+)"', tag)
        if ss:
            parts = []
            for cand in ss.group(1).split(","):
                bits = cand.strip().split(" ", 1)
                cf = local_file(bits[0], page_dir)
                cw = to_webp(cf) if cf else None
                if cw:
                    bits[0] = web_path(bits[0], cf, cw)
                parts.append(" ".join(bits))
            tag = tag.replace(ss.group(0), 'srcset="%s"' % ", ".join(parts), 1)
        if not fp.lower().endswith(".svg") and not (re.search(r'\bwidth="', tag) and re.search(r'\bheight="', tag)):
            d = dims(fp)
            if d and not re.search(r'\b(width|height)="', tag):
                tag = tag.replace("<img", '<img width="%d" height="%d"' % d, 1)
        return tag

    return re.sub(r"<img\b[^>]*>", one, html)


def process(fp, path):
    html = open(fp, encoding="utf-8").read()
    if re.search(r'<meta[^>]+name="robots"[^>]+noindex', html) or "http-equiv=\"refresh\"" in html:
        # Not for search, but still served to people: keep images light.
        new = fix_images(html, os.path.dirname(fp))
        if new != html:
            open(fp, "w", encoding="utf-8").write(new)
            return True
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
    html = fix_images(html, os.path.dirname(fp))
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
