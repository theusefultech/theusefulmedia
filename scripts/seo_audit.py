"""Weekly SEO audit of every public page (theusefulmedia.com, /apps, textlore.app, Gumroad).

Usage: python3 scripts/seo_audit.py out.csv   (fetches all sitemaps itself)
Flags: status not 200, noindex, missing title/description/canonical/og:image/schema,
bad h1 count, images with empty alt, pages under 250 words.
"""
import sys, json, re, csv, concurrent.futures as cf
import requests
from bs4 import BeautifulSoup

def audit(url):
    r = {"url": url}
    try:
        resp = requests.get(url, timeout=25, headers={"User-Agent": "Mozilla/5.0 (SEO audit)"})
    except Exception as e:
        r["error"] = str(e)[:80]; return r
    r["status"] = resp.status_code
    r["final"] = resp.url
    r["xrobots"] = resp.headers.get("x-robots-tag", "")
    s = BeautifulSoup(resp.text, "lxml")
    t = s.title.string.strip() if s.title and s.title.string else ""
    r["title"] = t; r["title_len"] = len(t)
    def meta(**kw):
        m = s.find("meta", attrs=kw); return (m.get("content") or "").strip() if m else ""
    d = meta(name="description"); r["desc_len"] = len(d)
    r["robots"] = meta(name="robots")
    c = s.find("link", rel="canonical"); r["canonical"] = c.get("href") if c else ""
    r["og_image"] = bool(meta(property="og:image"))
    r["og_title"] = bool(meta(property="og:title"))
    r["twitter"] = bool(meta(name="twitter:card"))
    types = []
    for sc in s.find_all("script", type="application/ld+json"):
        try:
            j = json.loads(sc.string or "{}")
        except Exception:
            types.append("INVALID"); continue
        items = j if isinstance(j, list) else j.get("@graph", [j]) if isinstance(j, dict) else []
        for it in items:
            if isinstance(it, dict):
                tt = it.get("@type"); types += tt if isinstance(tt, list) else [tt]
    r["schema"] = ",".join(str(x) for x in types)
    r["h1"] = len(s.find_all("h1"))
    r["lang"] = (s.html.get("lang") if s.html else "") or ""
    imgs = s.find_all("img"); r["img_noalt"] = sum(1 for i in imgs if not i.get("alt"))
    for tag in s(["script", "style", "noscript"]): tag.decompose()
    r["words"] = len(s.get_text(" ").split())
    return r

SITEMAPS = ["https://theusefulmedia.com/sitemap.xml", "https://theusefulmedia.com/apps/sitemap.xml", "https://textlore.app/sitemap.xml"]
GUMROAD = ["https://theusefultech.gumroad.com/l/" + x for x in ("claude-app-playbook", "iphone-power-user-fix", "mac-setup-guide", "siri-prompts", "useful-studio", "useful-studio-pro", "first-sponsor-kit", "textlore")]
urls = [u for sm in SITEMAPS for u in re.findall(r"<loc>([^<]+)</loc>", requests.get(sm, timeout=25).text)] + GUMROAD
with cf.ThreadPoolExecutor(12) as ex:
    rows = list(ex.map(audit, urls))
keys = ["url","status","final","xrobots","title","title_len","desc_len","robots","canonical","og_image","og_title","twitter","schema","h1","lang","img_noalt","words","error"]
with open(sys.argv[1], "w", newline="") as f:
    w = csv.DictWriter(f, keys); w.writeheader(); [w.writerow(x) for x in rows]
print("done", len(rows))

bad = [r for r in rows if r.get("error") or r.get("status") != 200 or "noindex" in (r.get("robots","")+r.get("xrobots","")).lower() or not r.get("schema") or not r.get("canonical") or r.get("desc_len",0)==0]
print("pages", len(rows), "with problems", len(bad))
for r in bad: print("  ", r["url"], r.get("status"), r.get("error",""))
