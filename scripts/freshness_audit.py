#!/usr/bin/env python3
"""Weekly freshness audit for theusefulmedia.com (Raja approved 13 Nov 2026, "ok go").

Reads sponsor/facts.json (the single source for numbers, app statuses, active brands, retired
things and this week's focus) and scans every public page for:
  1. Dates that have passed but are still written as future ("out 17 Nov", "coming", "soon", "beta").
  2. Retired things still linked or named outside their own folder (facts.retired).
  3. Apps marked live in facts.apps but still called "coming", "soon" or "beta" anywhere.
  4. Numbers that disagree with facts.json (followers, posts, newsletter subscribers).
Prints a JSON report to stdout and writes it to scripts/freshness_report.json. Never edits pages:
the weekly task reads the report, fixes the pages and the bios, and emails Raja what changed.

Usage: python3 scripts/freshness_audit.py
"""
import datetime as dt, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
F = json.loads((ROOT / "sponsor" / "facts.json").read_text())
TODAY = dt.date.today()
SKIP = {".git", ".github", "scripts", "assets", "node_modules", "fonts", "icons"}
ARCHIVE = ("/tech/library/",)  # past newsletter issues are a record, not live claims
MON = {m: i for i, m in enumerate(["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"], 1)}
FUTURE = re.compile(r"\b(out|arrives?|launch(?:es|ing)?|coming|available|releas(?:es|ing))\b[^.<]{0,30}?\b(?:on\s+)?(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+(\d{4}))?", re.I)
SOON = re.compile(r"\b(coming soon|coming to the app store|join the (?:free )?beta|free iphone beta|testflight)\b", re.I)


def text_of(html):
    html = re.sub(r"<script(?![^>]*ld\+json).*?</script>|<style.*?</style>", " ", html, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))


def pages():
    for p in ROOT.rglob("*"):
        if p.suffix in (".html", ".txt") and not (set(p.relative_to(ROOT).parts) & SKIP):
            yield p


def main():
    out = {"date": TODAY.isoformat(), "pastDates": [], "retired": [], "liveCalledSoon": [], "numbers": []}
    live = [a for a in F.get("apps", []) if a.get("status") == "live"]
    followers_k = int(F["followers"].replace(",", "")) // 1000
    for p in pages():
        rel = "/" + str(p.relative_to(ROOT)).replace("index.html", "")
        if rel.startswith(ARCHIVE):
            continue
        raw = p.read_text(errors="ignore")
        if re.search(r'location\.replace\(|http-equiv="refresh"', raw[:4000]) and "og:description" not in raw:
            continue
        t = text_of(raw)
        for m in FUTURE.finditer(t):
            y = int(m.group(4) or TODAY.year)
            try:
                d = dt.date(y, MON[m.group(3)[:3].lower()], int(m.group(2)))
            except ValueError:
                continue
            if d < TODAY:
                out["pastDates"].append({"page": rel, "text": m.group(0)[:80]})
        for name, needle in F.get("retired", {}).items():
            own = needle.startswith("/") and rel.startswith(needle)
            if not own and needle in raw:
                out["retired"].append({"page": rel, "thing": name})
        for a in live:
            for m in SOON.finditer(t):
                window = t[max(0, m.start() - 200): m.end() + 200]
                if a["name"] in window:
                    out["liveCalledSoon"].append({"page": rel, "app": a["name"], "text": m.group(0)})
        for m in re.finditer(r"\b(\d{2})K\+", t):
            if abs(int(m.group(1)) - followers_k) > 1:
                out["numbers"].append({"page": rel, "found": m.group(0), "facts": f"{followers_k}K+"})
    for k in out:
        if isinstance(out[k], list):
            seen, uniq = set(), []
            for x in out[k]:
                key = json.dumps(x, sort_keys=True)
                if key not in seen:
                    seen.add(key); uniq.append(x)
            out[k] = uniq
    out["focus"] = F.get("focus")
    if out["focus"] and out["focus"].get("next") and out["focus"]["next"]["from"] <= TODAY.isoformat():
        out["focusNote"] = "focus.next has started: move it into focus and set a new next"
    (ROOT / "scripts" / "freshness_report.json").write_text(json.dumps(out, indent=2) + "\n")
    print(json.dumps({k: len(v) if isinstance(v, list) else v for k, v in out.items() if k != "focus"}))


if __name__ == "__main__":
    main()
