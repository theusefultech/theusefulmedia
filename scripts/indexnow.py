"""Ping IndexNow (Bing, which feeds ChatGPT search and Copilot, plus Yandex,
Seznam and Naver) with pages that changed, so they get recrawled within hours
instead of weeks.

Usage:
  python3 scripts/indexnow.py <git-range>   ping pages whose index.html changed in that range
  python3 scripts/indexnow.py --all         ping every URL in sitemap.xml
"""
import glob, json, os, re, subprocess, sys, urllib.request

SITE = "theusefulmedia.com"
KEY = [os.path.basename(p)[:-4] for p in glob.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}\.txt", os.path.basename(p))][0]


def sitemap_urls():
    return re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml").read())


def changed_urls(rng):
    out = subprocess.run(["git", "diff", "--name-only", rng], capture_output=True, text=True).stdout.split()
    known = set(sitemap_urls())
    urls = []
    for f in out:
        if f.endswith("index.html"):
            path = os.path.dirname(f)
            u = f"https://{SITE}/" + (path + "/" if path else "")
            if u in known:
                urls.append(u)
    return urls


def ping(urls):
    if not urls:
        print("indexnow: nothing to ping"); return
    body = json.dumps({"host": SITE, "key": KEY, "keyLocation": f"https://{SITE}/{KEY}.txt", "urlList": urls[:10000]}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"indexnow: {r.status} for {len(urls)} urls")
    except urllib.error.HTTPError as e:
        print(f"indexnow: HTTP {e.code} {e.read()[:200]}")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "--all"
    ping(sitemap_urls() if arg == "--all" else changed_urls(arg))
