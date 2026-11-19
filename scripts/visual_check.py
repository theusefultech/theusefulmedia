#!/usr/bin/env python3
"""Visual rule check (Raja, 17 Nov 2026, "every page gets a visual element, never walls of text"; gate added 19 Nov 2026).
Free, rules only, no Claude usage. Scans every indexable page in a built site and fails when a page has
no visual in its main content (an <img>, a <canvas>, a drawn <svg> bigger than an icon, or an element marked data-visual),
or when its page header (.band) has no illustration. Pages listed in the allow file are reported but don't fail
(the known backlog); fix them and delete their line. Usage: visual_check.py <site_dir> [<url_prefix>] [<allow_file>]"""
import glob, os, re, sys

root = sys.argv[1]
prefix = sys.argv[2] if len(sys.argv) > 2 else "/"
allow_f = sys.argv[3] if len(sys.argv) > 3 else ""
allow = set()
if allow_f and os.path.exists(allow_f):
    allow = {l.split("#")[0].strip() for l in open(allow_f) if l.split("#")[0].strip()}

def visuals(b):
    n = len(re.findall(r"<img\b", b)) + len(re.findall(r"<canvas\b", b)) + len(re.findall(r"data-visual", b))
    n += sum(1 for sv in re.findall(r"<svg\b.*?</svg>", b, re.S) if len(sv) > 600)
    n += len(re.findall(r"<video\b", b))
    return n

bad, known = [], []
for f in sorted(glob.glob(os.path.join(root, "**", "index.html"), recursive=True)):
    s = open(f, encoding="utf-8", errors="ignore").read()
    if re.search(r'<meta name="robots" content="noindex', s): continue
    if re.search(r'http-equiv="refresh"', s[:3000]): continue
    url = prefix + os.path.relpath(f, root).replace("index.html", "").replace(os.sep, "/")
    url = re.sub(r"/+", "/", url)
    m = re.search(r"<main\b.*?</main>", s, re.S)
    b = m.group(0) if m else s
    b = re.sub(r"<(header|footer|nav)\b.*?</\1>", "", b, flags=re.S)
    why = []
    if visuals(b) == 0: why.append("no visual in the page")
    if 'class="band-in solo"' in b: why.append("page header has no illustration")
    if why: (known if url in allow else bad).append((url, "; ".join(why)))

for u, w in known: print(f"backlog  {u}  ({w})")
for u, w in bad: print(f"FAIL     {u}  ({w})")
print(f"visual check: {len(bad)} failing, {len(known)} in the backlog")
sys.exit(1 if bad else 0)
