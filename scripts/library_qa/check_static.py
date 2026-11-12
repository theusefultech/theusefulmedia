"""Static checks for every Library page: 1 h1, canonical, valid JSON-LD, share image exists,
every internal /library/ link and image points to a real file, no em dashes in visible text.
Exit code 1 on any failure. Usage: python3 scripts/library_qa/check_static.py"""
import os, re, json, sys, glob, html
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
bad = []
def exists(url):
    u = url.split("#")[0].split("?")[0]
    if not u.startswith("/"): return True
    p = os.path.join(ROOT, u.lstrip("/"))
    return os.path.exists(p) or os.path.exists(os.path.join(p, "index.html"))
for f in glob.glob(os.path.join(ROOT, "library", "**", "index.html"), recursive=True):
    rel = os.path.relpath(f, ROOT); s = open(f, encoding="utf-8").read()
    if len(re.findall(r"<h1[\s>]", s)) != 1: bad.append(f"{rel}: needs exactly 1 h1")
    if 'rel="canonical"' not in s: bad.append(f"{rel}: no canonical")
    for m in re.findall(r'<script type="application/(?:ld\+)?json"[^>]*>(.*?)</script>', s, re.S):
        try: json.loads(m)
        except Exception as e: bad.append(f"{rel}: bad JSON block ({e})")
    og = re.search(r'og:image" content="https://theusefulmedia.com([^"]+)"', s)
    if og and not exists(og.group(1)): bad.append(f"{rel}: share image missing {og.group(1)}")
    for u in re.findall(r'(?:href|src)="(/[^"]*)"', s):
        if u.startswith("/library/") and not exists(u): bad.append(f"{rel}: broken link {u}")
    body = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", s, flags=re.S)
    if "—" in html.unescape(body): bad.append(f"{rel}: em dash in text")
print("\n".join(bad) if bad else "static checks: all pages ok")
sys.exit(1 if bad else 0)
