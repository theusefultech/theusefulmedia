#!/usr/bin/env python3
"""27 Nov 2026 (Raja's AI slop ban, docs/ai-slop-banned.md in useful-posts): the last pass on built pages.

Only visible text changes, never tags, attributes, scripts or quotes (blockquote, q, code, pre, textarea,
anything marked data-noslop), so quoted reviews and book quotes keep their own words.
- "a; b" becomes "a. B" (HTML entities like &amp; are left alone, "tl;dv" too)
- the filler word "actually" is dropped
Same rules as site/src/deslop.js in theusefultech/useful-apps.

Usage: python3 scripts/deslop.py            # every .html file in the repo
       python3 scripts/deslop.py a.html ...  # only these
Prints the files it changed. Free, no API.
"""
import os, re, sys

SKIP = {"script", "style", "blockquote", "q", "code", "pre", "textarea", "noscript", "svg"}
TAG = re.compile(r"<(/?)([a-zA-Z][\w-]*)([^>]*)>|<!--[\s\S]*?-->")
LEGAL = ("privacy", "terms")  # legal pages keep their exact wording


def cap(c):
    return c[:1].upper() + c[1:]


def fix_text(t):
    t = re.sub(r";\s+(\S)", lambda m: ". " + cap(m.group(1)), t)
    t = re.sub(r"\bactually\s+", "", t)
    t = re.sub(r"\s+actually\b", "", t)
    t = re.sub(r"\bActually,?\s+(\S)", lambda m: cap(m.group(1)), t)
    return t


def _entity_safe(t):
    # protect entities such as &amp; &#39; before the semicolon rule runs
    return re.sub(r"&(#?\w{1,8});", lambda m: "&" + m.group(1) + "\x00", t)


def deslop(html):
    out, i, skip = [], 0, []
    low = html.lower()
    pos = 0
    while True:
        m = TAG.search(html, pos)
        if not m:
            break
        text = html[i:m.start()]
        out.append(text if skip else fix_text(_entity_safe(text)).replace("\x00", ";"))
        out.append(m.group(0))
        i = pos = m.end()
        if not m.group(2):
            continue
        tag, close, attrs = m.group(2).lower(), m.group(1) == "/", m.group(3)
        if close:
            if skip and skip[-1] == tag:
                skip.pop()
            continue
        if attrs.rstrip().endswith("/"):
            continue
        if tag in SKIP or re.search(r"\sdata-noslop\b", attrs):
            skip.append(tag)
            if tag in ("script", "style"):
                end = low.find("</" + tag, i)
                if end > -1:
                    out.append(html[i:end])
                    i = pos = end
        elif skip and skip[-1] == tag:
            skip.append(tag)
    rest = html[i:]
    out.append(rest if skip else fix_text(_entity_safe(rest)).replace("\x00", ";"))
    return "".join(out)


def files(args):
    if args:
        return args
    found = []
    for root, dirs, names in os.walk("."):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", "workers", "plans")]
        found += [os.path.join(root, n) for n in names if n.endswith(".html")]
    return found


def main(args):
    changed = 0
    for f in files(args):
        if any(f"/{p}/" in f.replace("\\", "/") for p in LEGAL):
            continue
        s = open(f, encoding="utf-8").read()
        t = deslop(s)
        if t != s:
            open(f, "w", encoding="utf-8").write(t)
            print(f)
            changed += 1
    print(f"{changed} file(s) changed", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1:])
