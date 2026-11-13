#!/usr/bin/env python3
"""Pulls book recommendations from the YouTube transcript engine (public feed on theusefulmedia.com/apps/api/yt/books)
into library/data/recs.json for scripts/library_recs.py. Runs daily in GitHub Actions."""
import json, os, re, urllib.request, datetime
FEED = "https://theusefulmedia.com/apps/api/yt/books"  # public read-only feed from the transcript engine
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with urllib.request.urlopen(urllib.request.Request(FEED, headers={"user-agent": "useful-library/1"}), timeout=60) as r:
    rows = json.load(r)["rows"]
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
          open(os.path.join(ROOT, "library", "data", "recs.json"), "w"), indent=1)
print(len(people), "people,", len(rank), "books")
