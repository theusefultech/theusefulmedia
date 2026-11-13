#!/usr/bin/env python3
"""Keeps the public numbers on theusefulmedia.com current.

1. Reads The Useful Tech's public Medium stats from mymedium.info/@theusefultech
   (followers, total articles, total views, read ratio) and writes them to
   sponsor/facts.json. If the page can't be read, the old numbers stay.
2. Rewrites every place those numbers are typed into the site (homepage, about,
   sponsor, studio, llms.txt and any data-fact span), so nothing is left stale.
   facts.json is the single source: change a number there and every page follows.
3. Drops booked sponsor dates that are already in the past from sponsor/slots.json.

Run by .github/workflows/refresh-facts.yml once a day. Safe to run any time.

Numbers the daily job can't read (Beehiiv and HQ need sign-in) come in as arguments,
from Repo pickup when the Daily site stats email task hands them over:
  python3 scripts/refresh_facts.py --newsletter 1,340 --book 2026-11-17,2026-11-23
--newsletter replaces the subscriber count everywhere; --book adds booked sponsor dates.
"""
import argparse
import datetime as dt
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FACTS = ROOT / "sponsor" / "facts.json"
SLOTS = ROOT / "sponsor" / "slots.json"
STATS_URL = "https://mymedium.info/@theusefultech/"
PAGES = ["index.html", "about/index.html", "advertise/index.html", "studio/index.html",
         "products/index.html", "network/index.html", "tech/index.html", "llms.txt"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (theusefulmedia.com facts refresh)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def num(s):
    return int(re.sub(r"[^\d]", "", s))


def read_medium():
    h = fetch(STATS_URL)
    t = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", h)
    t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))
    out = {}
    m = re.search(r"Followers:\s*([\d,]+)", t)
    if m: out["followers"] = num(m.group(1))
    m = re.search(r"Total Articles\s*([\d,]+)", t)
    if m: out["posts"] = num(m.group(1))
    m = re.search(r"Total Views\s*([\d,]+)", t)
    if m: out["views"] = num(m.group(1))
    m = re.search(r"Read Ratio\s*([\d.]+)%", t)
    if m: out["readRatio"] = float(m.group(1))
    # sanity: never write a number that looks broken
    if out.get("followers", 0) < 50000 or out.get("posts", 0) < 400 or out.get("views", 0) < 3_000_000:
        raise ValueError(f"stats look wrong: {out}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--newsletter", help="Beehiiv The Useful Tech active subscribers, e.g. 1,340")
    ap.add_argument("--book", help="comma-separated YYYY-MM-DD dates with a committed sponsored post")
    args = ap.parse_args()
    facts = json.loads(FACTS.read_text())
    old = dict(facts)
    if args.newsletter:
        n = num(args.newsletter)
        if 500 <= n <= 100000:
            facts["newsletterSubs"] = f"{n:,}"
    try:
        m = read_medium()
        facts["followers"] = f"{m['followers']:,}"
        facts["posts"] = str(m["posts"])
        facts["views"] = f"{m['views'] / 1e6:.2f}M"
        if "readRatio" in m:
            facts["readRatio"] = f"{m['readRatio']:.1f}%"
        print("medium:", m)
    except Exception as e:  # keep old numbers, still fix the pages and slots
        print("medium stats not read, keeping old numbers:", e, file=sys.stderr)

    followers = num(facts["followers"])
    posts = int(facts["posts"])
    k = followers // 1000                      # 78
    rounded = f"{k},000"                       # 78,000
    posts_plus = f"{posts // 10 * 10}+"        # 470+

    changed = False
    pretty_day = dt.date.today().strftime("%-d %b %Y")  # 11 Nov 2026, the date shown on the sponsor page
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        s0 = s = p.read_text()
        # exact values typed into the page (old value -> new value)
        for key in ("followers", "views", "newsletterSubs", "readRatio", "openRate", "clickRate"):
            a, b = old.get(key), facts.get(key)
            if a and b and a != b and re.search(r"\d", a) and len(a) >= 3:
                s = s.replace(a, b)
        # every <x data-fact="key">value</x>
        s = re.sub(r'(data-fact="(\w+)">)([^<]*)(<)',
                   lambda mm: mm.group(1) + (mm.group(3) if mm.group(2) == "updated" else facts.get(mm.group(2), mm.group(3))) + mm.group(4), s)
        if s != s0:  # numbers moved, so the "as of" date moves too
            s = re.sub(r'(data-fact="updated">)[^<]*(<)', rf"\g<1>{pretty_day}\2", s)
        # rounded follower counts: 78,000 / 78,000+ / 78K+ / data-count="78" data-suffix="K+"
        s = re.sub(r"\b\d{2},000(?=\+?\s+(?:Apple users|readers|followers|Mac users|people|Apple Watch|MacBook|iPhone))", rounded, s)
        s = re.sub(r"\b\d{2},000\+ followers", rounded + "+ followers", s)
        s = re.sub(r"\b\d{2}K\+", f"{k}K+", s)
        s = re.sub(r'data-count="\d{2}" data-suffix="K\+"', f'data-count="{k}" data-suffix="K+"', s)
        # rounded post counts: 460+ posts / data-count="460" data-suffix="+">460+
        s = re.sub(r'data-count="\d{3}" data-suffix="\+">\d{3}\+',
                   f'data-count="{posts // 10 * 10}" data-suffix="+">{posts_plus}', s)
        s = re.sub(r"\b\d{3}\+ (posts|articles|stories)", rf"{posts_plus} \1", s)
        s = re.sub(r'(aria-label=")\d{2}K\+:', rf"\g<1>{k}K+:", s)
        if s != s0:
            p.write_text(s)
            changed = True
            print("updated", rel)

    # booked dates: keep today and later only
    slots = json.loads(SLOTS.read_text())
    today = dt.date.today().isoformat()
    extra = [d.strip() for d in (args.book or "").split(",") if re.fullmatch(r"\d{4}-\d{2}-\d{2}", d.strip())]
    keep = sorted(set(d for d in slots.get("booked", []) + extra if d >= today))
    if keep != slots.get("booked"):
        slots["booked"] = keep
        changed = True

    if facts != old or changed:
        facts["updated"] = today
        slots["updated"] = today
        FACTS.write_text(json.dumps(facts, indent=2, ensure_ascii=False) + "\n")
        SLOTS.write_text(json.dumps(slots, indent=2, ensure_ascii=False) + "\n")
    print("done")


if __name__ == "__main__":
    main()
