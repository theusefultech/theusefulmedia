#!/usr/bin/env python3
"""Pulls book recommendations from the YouTube transcript engine (Cloudflare D1 useful-apps, table yt_mentions)
into library/data/recs.json for scripts/library_recs.py. Runs in GitHub Actions with CLOUDFLARE_API_TOKEN."""
import json, os, re, urllib.request, datetime
DB = "2d537ca2-0fc2-4c23-ad31-e36e24df8e9a"
TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def api(method, path, body=None):
    req = urllib.request.Request("https://api.cloudflare.com/client/v4" + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"authorization": "Bearer " + TOKEN, "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.load(r)
    if not j.get("success"): raise SystemExit(str(j.get("errors"))[:300])
    return j["result"]
acc = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or "8228f116d9475a10166686e7391f95ef"  # The Useful Media Co Cloudflare account
rows = api("POST", f"/accounts/{acc}/d1/database/{DB}/query", {"sql": "SELECT person, channel, entity, ekey, note, video_id, ts, vdate FROM yt_mentions WHERE etype = 'book' AND mtype IN ('recommends','uses','mentions') ORDER BY vdate DESC, id DESC"})[0]["results"]
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
    p["books"].append({"title": title.strip(), "author": author.strip(), "note": r["note"] or "", "video": r["video_id"], "ts": r["ts"] or 0, "date": r["vdate"]})
    k = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
    x = rank.setdefault(k, {"title": title.strip(), "author": author.strip(), "people": []})
    if p["slug"] not in x["people"]: x["people"].append(p["slug"])
for p in people.values(): p.pop("_seen")
os.makedirs(os.path.join(ROOT, "library", "data"), exist_ok=True)
json.dump({"updated": datetime.date.today().isoformat(), "people": list(people.values()), "ranking": list(rank.values())},
          open(os.path.join(ROOT, "library", "data", "recs.json"), "w"), indent=1)
print(len(people), "people,", len(rank), "books")
