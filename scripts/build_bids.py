#!/usr/bin/env python3
"""Bid Desk page data (27 Nov 2026). Free, rules only, no Claude usage.

Turns the lead data in theusefulmedia/useful-posts (branch leads, folder leads/bids) into the small public files
that https://theusefulmedia.com/bids/ reads:
  bids/d/index.json      per state: terms ending within 180 days, total value, live bids, count per trade
  bids/d/s/<ST>.json     that state's live bids and contract terms
  bids/d/f/<slug>.json   1 file per pitchable firm: name, home state, states of work, trades, UEI, latest award
Only public federal data goes out (SAM.gov notices, USAspending awards). Never an email, owner name or website.

Usage: python3 scripts/build_bids.py <path to leads/bids>      (run again after every bids/run_all.py refresh)
"""
import csv, glob, json, os, re, shutil, sys

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "bids", "d")
TRADES = ["561720", "561730", "561210", "562111", "561621", "561710", "238220", "811310"]
SMALL = {"of", "the", "and", "for", "at", "in", "to", "on", "a", "an", "by", "with", "or", "from", "per"}
KEEP = {"LLC", "USA", "US", "HVAC", "VA", "FAA", "USCG", "GSA", "AFB", "NAS", "BPA", "IDIQ", "FY", "II", "III", "IV",
        "DBA", "LP", "LLP", "PC", "JV", "NW", "NE", "SW", "SE", "USDA", "DOI", "BLM", "NPS", "USACE", "TSA", "ATCT", "MCRD",
        "PM", "QC", "IT", "AC", "A/C", "CO", "NOAA", "FBI", "DEA", "ICE", "CBP", "FEMA", "IRS", "SSA", "BOP", "FCI", "USP",
        "VAMC", "CBOC", "JBSA", "NSA", "DLA", "BIA", "IHS", "USFS", "USGS", "FWS", "NWS", "ARS", "NIH", "CDC", "DC"}
STATES = {"AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
          "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","PR","GU","VI"}


NEED = {"SDVOSBC": ["sdvosb"], "SDVOSBS": ["sdvosb"], "8A": ["8a"], "8AN": ["8a"], "WOSB": ["wosb"], "WOSBSS": ["wosb"],
        "EDWOSB": ["wosb"], "EDWOSBSS": ["wosb"], "VSA": ["vosb", "sdvosb"], "VSS": ["vosb", "sdvosb"], "HZC": ["hubzone"], "HZS": ["hubzone"]}


def nice(s, limit=0):
    """ALL CAPS federal text to readable title case, acronyms kept."""
    s = re.sub(r"\s+", " ", (s or "").strip())
    if not s:
        return ""
    if sum(c.isupper() for c in s) < 0.6 * max(1, sum(c.isalpha() for c in s)):
        out = s  # already mixed case
    else:
        words = []
        for i, w in enumerate(s.split(" ")):
            core = re.sub(r"[^A-Za-z0-9/&]", "", w)
            if core.upper() in KEEP or (core.upper() in STATES and i and words and words[-1].endswith(",")):
                words.append(w.upper())
            elif re.search(r"\d", core) or (len(core) <= 5 and core.isalpha() and not re.search(r"[AEIOUY]", core.upper())):
                words.append(w.upper())
            elif i and core.lower() in SMALL:
                words.append(w.lower())
            else:
                words.append(re.sub(r"[A-Za-z]+", lambda m: m.group(0)[0].upper() + m.group(0)[1:].lower(), w))
        out = " ".join(words)
    out = re.sub(r"\bLlc\b", "LLC", out)
    out = re.sub(r"(?<=[a-z])'S\b", "'s", out)
    out = re.sub(r"\b(\d+)(ST|ND|RD|TH)\b", lambda m: m.group(1) + m.group(2).lower(), out)
    out = re.sub(r"\S+@\S+", "", out).replace("  ", " ").strip()
    if limit and len(out) > limit:
        out = out[:limit].rsplit(" ", 1)[0].rstrip(",.;:-| ") + "…"
    return out


def title_clean(t):
    t = re.sub(r"^\s*[A-Z]\d{3}\s*--\s*", "", t or "")          # "S201--" product code prefix
    t = re.sub(r"^\s*[A-Z]\s*-{1,2}\s*", "", t)                  # "S--", "S - "
    t = re.sub(r"\*{2,}[^*]*\*{2,}\s*", "", t)                   # "*****UPDATE SOW*****"
    return nice(t)


shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(os.path.join(OUT, "s"))
os.makedirs(os.path.join(OUT, "f"))

# live bids by state
live = {}
for b in csv.DictReader(open(os.path.join(SRC, "bids.csv"), encoding="utf-8")):
    st = b["state"]
    if not st or b["naics"] not in TRADES:
        continue
    extra = {}
    p = os.path.join(SRC, "bids", b["notice"] + ".json")
    if os.path.exists(p):
        extra = json.load(open(p, encoding="utf-8"))
    live.setdefault(st, []).append({
        "id": b["notice"], "sol": b["sol"], "t": title_clean(b["title"]), "ag": nice(b["sub"] or b["agency"]),
        "off": re.sub(r"\s+", " ", b["office"]).strip(), "due": b["due"], "dl": extra.get("deadline", ""), "sa": b["setaside_label"],
        "sac": b["setaside"], "p": b["posted"], "k": b["naics"], "city": nice(b["city"]), "link": b["link"]})
for st in live:
    live[st].sort(key=lambda x: x["due"])

index = {"states": {}}
made = ""
allamt = []
for f in sorted(glob.glob(os.path.join(SRC, "radar", "*.json"))):
    r = json.load(open(f, encoding="utf-8"))
    st = r["state"]
    made = max(made, r.get("made", ""))
    rows, per = [], {}
    for c in r["contracts"]:
        if c["naics"] not in TRADES:
            continue
        per[c["naics"]] = per.get(c["naics"], 0) + 1
        ag = c["sub"] if c["sub"] and c["sub"] != c["agency"] else c["agency"]
        rows.append([TRADES.index(c["naics"]), nice(c["holder"]), c["uei"], int(c["amount"]), nice(ag), c["ends"],
                     nice(c["desc"], 120), c["url"].rsplit("/", 1)[-1]])
    allamt += [x[3] for x in rows]
    json.dump({"st": st, "made": r.get("made", ""), "live": live.get(st, []), "c": rows},
              open(os.path.join(OUT, "s", st + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    index["states"][st] = {"n": len(rows), "t": sum(x[3] for x in rows), "l": len(live.get(st, [])),
                           "k": [per.get(k, 0) for k in TRADES]}
for st in live:  # a state with live bids but no radar file still gets a page
    if st not in index["states"]:
        json.dump({"st": st, "made": made, "live": live[st], "c": []},
                  open(os.path.join(OUT, "s", st + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        index["states"][st] = {"n": 0, "t": 0, "l": len(live[st]), "k": [0] * 8}
index["made"] = made
allamt.sort()
index["med"] = allamt[len(allamt) // 2] if allamt else 0
index["terms"] = sum(v["n"] for v in index["states"].values())
index["live"] = sum(v["l"] for v in index["states"].values())
json.dump(index, open(os.path.join(OUT, "index.json"), "w"), separators=(",", ":"))

# 1 file per pitchable firm
n = 0
for row in csv.DictReader(open(os.path.join(SRC, "firms.csv"), encoding="utf-8")):
    if row["ok"] != "True":
        continue
    p = os.path.join(SRC, "data", row["slug"] + ".json")
    d = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
    aw = sorted(d.get("awards", []), key=lambda a: a.get("start", ""), reverse=True)
    states = [row["state"]] + [a.get("state", "") for a in aw]
    states = [s for i, s in enumerate(states) if s and s in index["states"] and s not in states[:i]]
    ks = [k for k in row["naics"].split("|") if k in TRADES]
    has = [x for x in row["statuses"].split("|") if x]
    # open on the state where a bid they can hold is live right now, so the page matches the pitch
    def can(b):
        need = NEED.get(b["sac"])
        return b["k"] in ks and (not need or any(x in has for x in need))
    hot = [st for st in states if any(can(b) for b in live.get(st, []))]
    states = hot + [st for st in states if st not in hot]
    json.dump({"n": nice(row["name"]), "city": nice(row["city"]), "st": row["state"], "sts": states[:6], "k": ks,
               "u": row["uei"], "has": has},
              open(os.path.join(OUT, "f", row["slug"] + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    n += 1
print("states", len(index["states"]), "terms", index["terms"], "live bids", index["live"], "firms", n, "made", made)
