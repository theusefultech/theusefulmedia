#!/usr/bin/env python3
"""Builds the free download pages at theusefulmedia.com/free.

Source: free/free.json (one entry per freebie). A page is built only when its
file is in free/files/<slug>/, so nothing goes live that can't be delivered.
Pass --preview to build every page anyway (for local screenshots only).

  free/index.html          all free downloads
  free/<slug>/index.html   one landing page per freebie
Run from the repo root:  python3 scripts/build_free.py [--preview]
"""
import html, json, os, sys, urllib.parse

SITE = "https://theusefulmedia.com"
DATA = os.path.join("free", "free.json")
PREVIEW = "--preview" in sys.argv

SHOP = {
    "iPhone-setup-guide": ("The Ultimate iPhone Setup Guide", "The settings, apps and hidden features most iPhone owners never find.", "iphone-setup-guide"),
    "siri-prompts": ("100 Siri AI Prompts", "The Siri prompts you will use again and again, sorted by what you're doing.", "siri-prompts"),
    "mac-setup-guide": ("The Mac Setup Guide", "Go from unboxing to a Mac set up exactly how you want it in one weekend.", "mac-setup-guide"),
    "iphone-power-user-fix": ("The iPhone Power User Fix Book", "45 fixes for the annoying things stock iOS apps do, organised by app.", "iphone-power-user-fix"),
    "apple-bundle": ("The Ultimate Apple Productivity Bundle", "4 of the most popular Apple guides, together in one bundle.", "apple-bundle"),
    "cowork-mastery-guide": ("Cowork Mastery", "Set up Claude Cowork on your Mac so it does the work instead of waiting for prompts.", "cowork-mastery-guide"),
    "exmyz": ("The Daily Shift Wallpaper System", "36 iPhone wallpapers that change on their own with the time of day.", "exmyz"),
}
TAGS = {"iphone": "iPhone", "mac": "Mac", "ipad": "iPad", "watch": "Apple Watch", "siri": "Siri AI", "ai": "AI", "notes": "Notes",
        "ios27": "iOS 27", "macos27": "macOS 27", "apps": "Apps", "money": "Save money", "travel": "Travel"}

ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>'
MARK = ('<svg class="mark" viewBox="0 0 30 19.5" aria-hidden="true"><rect x="0" y="0" width="9" height="9" rx="1.6"/>'
        '<rect x="10.5" y="0" width="9" height="9" rx="1.6"/><rect x="21" y="0" width="9" height="9" rx="1.6"/>'
        '<rect x="0" y="10.5" width="9" height="9" rx="1.6"/><rect x="10.5" y="10.5" width="9" height="9" rx="1.6"/>'
        '<rect x="21" y="10.5" width="9" height="9" rx="1.6"/></svg>')


def esc(s):
    return html.escape(s or "", quote=True)


def size(n):
    return f"{n / 1048576:.1f} MB" if n >= 1048576 else f"{max(1, round(n / 1024))} KB"


def has_file(p):
    if p.get("link"):
        return True
    return os.path.exists(os.path.join("free", "files", p["slug"], p["file"]))


def head(title, desc, url, image, extra=""):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try{{var t=localStorage.getItem("tumc-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Useful Tech">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">{extra}
<meta name="theme-color" content="#FAFAF8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E1C" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css">
<link rel="stylesheet" href="/free/free.css">
<script src="/assets/site.js" defer></script>
'''


HEADER = f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="The Useful Media Co home">{MARK}<span class="brand-name">The Useful Media Co</span></a>
    <div class="header-end">
      <nav class="nav" aria-label="Main"><a href="/tech/">Newsletter</a><a href="/free/" aria-current="page">Free</a><a href="/products/">Products</a><a href="/apps/">Apps</a><a href="/sponsor/">Sponsor</a><a href="/about/">About</a></nav>
      <button class="theme-toggle" type="button" data-mode="system" aria-label="Colour theme: match your device">
        <svg class="t-system" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path class="half" d="M12 4a8 8 0 0 1 0 16z"/></svg>
        <svg class="t-light" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><g class="rays"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>
        <svg class="t-dark" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
      </button>
    </div>
  </div>
</header>
'''

FOOTER = '''<footer class="fr-foot wrap">
  <span>Made by Raja at <a href="/tech/">The Useful Tech</a>, the #1 Apple blog on Medium.</span>
  <a href="/">theusefulmedia.com</a>
</footer>
'''


def card(p):
    tags = " ".join(p["tags"])
    proof = f'<span class="fc-proof mono">{p["downloads"]} downloads</span>' if p["downloads"] >= 20 else '<span class="fc-proof mono">New</span>'
    return (f'<li class="fc" data-tags="{esc(tags)}"><a href="/free/{p["slug"]}/">'
            f'<span class="fc-cover"><img src="/free/img/{p["slug"]}.webp" alt="" loading="lazy" decoding="async"></span>'
            f'<span class="fc-body"><span class="fc-name">{esc(p["name"])}</span>{proof}</span></a></li>')


def og_img(slug):
    """1200x630 JPG for link previews (webp is not shown everywhere); falls back to the webp."""
    jpg = os.path.join("free", "img", f"{slug}-og.jpg")
    return f"{SITE}/free/img/{slug}-og.jpg" if os.path.exists(jpg) else f"{SITE}/free/img/{slug}.webp"


def page(p, items):
    url = f'{SITE}/free/{p["slug"]}/'
    img = og_img(p["slug"])
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["name"], "description": p["sub"],
          "image": img, "url": url, "brand": {"@type": "Organization", "name": "The Useful Media Co"},
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": url}}
    ld_tag = '\n<script type="application/ld+json">' + json.dumps(ld) + '</script>'
    file_url = f'/free/files/{p["slug"]}/{urllib.parse.quote(p["file"])}'
    meta = f'Free · {esc(p["kind"])}' if p.get("link") else f'Free · {esc(p["kind"])} · {size(p["size"])}'
    proof = (f'<p class="proof"><span class="proof-cells" aria-hidden="true"><i></i><i></i><i></i></span>'
             f'{p["downloads"]} readers have already downloaded it</p>') if p["downloads"] >= 20 else ""
    inside = "".join(f'<li style="--n:{i}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg><span>{esc(x)}</span></li>'
                     for i, x in enumerate(p["inside"]))
    up = SHOP.get(p.get("upsell"))
    upsell = ""
    if up:
        upsell = (f'<a class="upsell" href="https://theusefultech.gumroad.com/l/{p["upsell"]}?utm_source=free&utm_medium=freebie&utm_campaign={p["slug"]}">'
                  f'<span class="upsell-cover"><img src="/assets/products/{up[2]}.webp" alt="" loading="lazy"></span>'
                  f'<span class="upsell-copy"><span class="kicker">From the shop</span><span class="upsell-name">{esc(up[0])}</span>'
                  f'<span class="upsell-line">{esc(up[1])}</span><span class="upsell-cta">Take a look{ARROW}</span></span></a>')
    same = [q for q in items if q["slug"] != p["slug"] and set(q["tags"]) & set(p["tags"])]
    rest = [q for q in items if q["slug"] != p["slug"] and q not in same]
    related = (same + rest)[:3]
    if p.get("link"):
        dl_link = f'<a class="dl-btn" href="{esc(p["link"])}" target="_blank" rel="noopener" data-file>Open {esc(p["name"])}'
    else:
        label = "Download the PDF" if p["kind"] == "PDF" else "Download the files"
        dl_link = f'<a class="dl-btn" href="{file_url}" download data-file>{label}'
    title = f'{p["name"]}: free download from The Useful Tech'
    return head(title, p["sub"], url, img, ld_tag) + f'''<script src="/tech/tech.js" defer></script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tutTurnstileReady" async defer></script>
<script src="/free/free.js" defer></script>
</head>
<body class="fr">
{HEADER}<main id="main">
<section class="fr-hero wrap">
  <div class="fr-art" aria-hidden="true"><div class="fr-cover" data-tilt><img src="/free/img/{p["slug"]}.webp" alt="" fetchpriority="high"></div></div>
  <div class="fr-copy">
    <p class="kicker rise">{meta}</p>
    <h1 class="rise">{esc(p["title"])}</h1>
    <p class="fr-sub rise rise-2">{esc(p["sub"])}</p>
    <div class="fr-get rise rise-3" data-get>
      <div class="signup">
        <form class="signup-form" data-signup data-next="stay" data-campaign="free-{p["slug"]}" novalidate>
          <label class="visually-hidden" for="email-free">Email address</label>
          <input id="email-free" type="email" name="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@email.com" required>
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit"><span class="btn-label">{esc(p["cta"])}</span></button>
        </form>
        <div class="signup-msg" aria-live="polite"></div>
        <div class="ts-slot"></div>
      </div>
      <p class="fine">You'll also get The Useful Tech newsletter, 3 emails a week. Unsubscribe in one click.</p>
      {proof}
    </div>
    <div class="fr-done" data-done hidden tabindex="-1">
      <p class="kicker">It's yours</p>
      <p class="done-name">{esc(p["name"])}</p>
      {dl_link}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"/></svg></a>
      <p class="fine">Your welcome email from The Useful Tech is on its way too.</p>
    </div>
  </div>
</section>

<section class="fr-inside wrap" aria-labelledby="inside-h">
  <h2 id="inside-h">What's inside</h2>
  <ul class="ticks">{inside}</ul>
</section>

{f'<section class="wrap fr-up">{upsell}</section>' if upsell else ""}

<section class="fr-more wrap" aria-labelledby="more-h">
  <div class="fr-more-head"><h2 id="more-h">More free downloads</h2><a href="/free/">See all {len(items)}</a></div>
  <ul class="fgrid">{"".join(card(q) for q in related)}</ul>
</section>
</main>
{FOOTER}<div class="burst" aria-hidden="true"></div>
</body>
</html>
'''


def index(items):
    used = []
    for p in items:
        for t in p["tags"]:
            if t not in used:
                used.append(t)
    order = [t for t in ["iphone", "mac", "ipad", "siri", "ios27", "macos27", "watch", "notes", "ai", "apps", "money", "travel"] if t in used]
    chips = '<button class="chip-f" type="button" data-f="all" aria-pressed="true">All</button>' + "".join(
        f'<button class="chip-f" type="button" data-f="{t}" aria-pressed="false">{TAGS[t]}</button>' for t in order)
    total = sum(p["downloads"] for p in items)
    return head("Free downloads from The Useful Tech", "Free guides, checklists and cheat sheets for your iPhone, iPad and Mac.",
                f"{SITE}/free/", og_img(items[0]['slug'])) + f'''<script src="/free/free.js" defer></script>
</head>
<body class="fr">
{HEADER}<main id="main">
<section class="fr-index-head wrap">
  <p class="kicker rise">Free · {len(items)} guides</p>
  <h1 class="rise">Free guides, checklists and cheat sheets for your iPhone, iPad and Mac.</h1>
  <p class="fr-sub rise rise-2">Readers have downloaded these {total:,} times. Pick one, and it's yours in seconds.</p>
  <div class="chips-f rise rise-3" role="group" aria-label="Filter downloads">{chips}</div>
</section>
<section class="wrap">
  <ul class="fgrid fgrid--all">{"".join(card(p) for p in items)}</ul>
</section>
</main>
{FOOTER}</body>
</html>
'''


def main():
    items = json.load(open(DATA))
    items.sort(key=lambda p: p["downloads"], reverse=True)
    live = items if PREVIEW else [p for p in items if has_file(p)]
    keep = set()
    for p in live:
        d = os.path.join("free", p["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w").write(page(p, live))
        keep.add(p["slug"])
    # remove pages whose file is gone (never in preview)
    for name in os.listdir("free"):
        d = os.path.join("free", name)
        if os.path.isdir(d) and name not in ("img", "files") and name not in keep and os.path.exists(os.path.join(d, "index.html")):
            os.remove(os.path.join(d, "index.html"))
            if not os.listdir(d):
                os.rmdir(d)
    idx = os.path.join("free", "index.html")
    if live:
        open(idx, "w").write(index(live))
    elif os.path.exists(idx):
        os.remove(idx)
    print(f"{len(live)} of {len(items)} free pages built" + (" (preview)" if PREVIEW else ""))


if __name__ == "__main__":
    main()
