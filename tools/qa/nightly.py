#!/usr/bin/env python3
"""Nightly site check (27 Nov 2026, plan A layer 4). Free: rules only, no Claude usage, runs in GitHub Actions.

Reads results.json from check.mjs and compares every problem with known.json (last night's list).
- Problems that are new tonight: 1 alert email to raja@theusefultech.com through the Watchdog (/api/alert).
- Problems that were there before: no email (they are already on the fix list).
- known.json is then replaced with tonight's list, so a fixed problem drops off and comes back as new if it returns.
First run (no known.json yet): writes the baseline and sends nothing.
"""
import json, os, re, sys, time, urllib.request
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
KNOWN = os.path.join(HERE, "known.json")
# noisy or not about how the page looks to a reader
SKIP = {"tap-target-small", "space-before-punctuation", "repeated-word"}


def sig(url, run, issue):
    path = re.sub(r"^https://theusefulmedia\.com", "", url) or "/"
    el = re.sub(r"\d[\d,.]*", "#", issue.get("el", ""))[:70]
    det = issue.get("detail", "") if issue["type"] in ("em-dash", "slop-phrase", "adblock-risk-name", "adblock-risk-url", "image-broken", "font-not-approved") else ""
    det = re.sub(r"\d[\d,.]*", "#", det)[:70]
    return f"{path} | {run['W']}{'' if run['scheme'] == 'light' else ' dark'} | {issue['type']} | {el}{(' | ' + det) if det else ''}"


def collect(results):
    out = set()
    for rec in results:
        for run in rec["runs"]:
            if run.get("error"):
                out.add(f"{rec['url']} | {run['W']} | page-failed-to-load | {run['error'][:60]}")
            if run.get("status", 200) >= 400:
                out.add(f"{rec['url']} | {run['W']} | http-{run['status']} |")
            for f in run.get("failed", []):
                if re.match(r"4\d\d ", f):
                    out.add(f"{rec['url']} | any | broken-link-or-file | {f[:110]}")
            for i in run.get("issues", []):
                if i["type"] not in SKIP:
                    out.add(sig(rec["url"], run, i))
    return out


def alert(new):
    key = os.environ.get("UPLOAD_KEY")
    kinds = Counter(s.split(" | ")[2] for s in new)
    top = "\n".join(sorted(new)[:25])
    text = f"{len(new)} new problems on the live site tonight ({', '.join(f'{n} {k}' for k, n in kinds.most_common(5))}):\n{top}"
    print(text)
    if not key:
        return print("no UPLOAD_KEY, alert not sent")
    body = json.dumps({"key": "nightly-qa:" + time.strftime("%Y-%m-%d"), "task": "Nightly site check", "urgent": False, "what": text,
                       "fix": "Open the run in theusefultech/theusefulmedia Actions (Nightly site check), look at shots/ for each page, fix the cause in the template, and add a check so it can't return (QA.md rule 8)."}).encode()
    req = urllib.request.Request("https://useful-carousels.raja-822.workers.dev/api/alert", data=body, method="POST",
                                 headers={"content-type": "application/json", "x-key": key, "User-Agent": "UsefulNightlyQA/1.0"})
    try:
        urllib.request.urlopen(req, timeout=20); print("alert filed")
    except Exception as e:
        print("alert failed:", e)


def main():
    results = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "results.json"))
    now = collect(results)
    if len(results) < 20:
        return print(f"only {len(results)} pages checked, not trusting this run")
    if os.path.exists(KNOWN):
        old = set(json.load(open(KNOWN)))
        new = now - old
        print(f"{len(now)} problems, {len(new)} new, {len(old - now)} fixed since last night")
        if new:
            alert(new)
    else:
        print(f"first run: {len(now)} problems saved as the baseline, no email")
    json.dump(sorted(now), open(KNOWN, "w"), indent=0)


if __name__ == "__main__":
    main()
