#!/usr/bin/env python3
"""Pulls book recommendations from the YouTube transcript engine (public feed on theusefulmedia.com/apps/api/yt/books)
into library/data/recs.json for scripts/library_recs.py. Runs daily in GitHub Actions."""
import json, os, re, urllib.request, datetime
FEED = "https://theusefulmedia.com/apps/api/yt/books"  # public read-only feed from the transcript engine
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys, time
OUT = os.path.join(ROOT, "library", "data", "recs.json")
def last_good():
    try: return json.load(open(OUT))
    except Exception: return None
rows, err = None, None
for attempt in range(4):  # self-heal: retry blips (403/5xx/timeouts) before giving up
    try:
        with urllib.request.urlopen(urllib.request.Request(FEED, headers={"user-agent": "useful-library/1"}), timeout=60) as r:
            rows = json.load(r)["rows"]
        break
    except Exception as e:
        err = e; print(f"feed attempt {attempt+1} failed: {e}"); time.sleep(20 * (attempt + 1))
prev = last_good()
if rows is None or (not rows and prev and prev.get("people")):
    # Keep the last good bookshelves instead of failing or wiping them. Only fail (email Raja) if data is 3+ days stale.
    age = (datetime.date.today() - datetime.date.fromisoformat(prev["updated"])).days if prev else None
    print(f"feed unavailable or empty ({err}); keeping last good data, age {age} days")
    sys.exit(1 if (age is None and rows is None) or (age is not None and age >= 3) else 0)
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")[:60]
people, rank = {}, {}
for r in rows:
    name = (r["person"] or r["channel"] or "").strip()
    if not name: continue
    p = people.setdefault(slug(name), {"slug": slug(name), "name": name, "channels": [], "books": [], "_seen": set()})
    if r["channel"] and r["channel"] not in p["channels"]: p["channels"].append(r["channel"])
    if r["ekey"] in p["_seen"]: continue
    p["_seen"].add(r["ekey"])
    title, author = r["entity"], ""
    m = re.match(r"^(.*?)\s+by\s+(.+)$", title)
    if m: title, author = m.group(1), m.group(2)
    p["books"].append({"title": title.strip(), "author": author.strip(), "note": r["note"] or "", "video": r["video_id"], "url": r.get("url"), "ts": r["ts"] or 0, "date": r["vdate"]})
    k = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
    x = rank.setdefault(k, {"title": title.strip(), "author": author.strip(), "people": []})
    if p["slug"] not in x["people"]: x["people"].append(p["slug"])
for p in people.values(): p.pop("_seen")
os.makedirs(os.path.join(ROOT, "library", "data"), exist_ok=True)
json.dump({"updated": datetime.date.today().isoformat(), "people": list(people.values()), "ranking": list(rank.values())},
          open(OUT, "w"), indent=1)
print(len(people), "people,", len(rank), "books")
