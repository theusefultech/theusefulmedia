"""Adds Instagram posts to the link-in-bio grid without asking Instagram.

Instagram blocks GitHub's servers (HTTP 429), so the hourly job in build_links.py
can't see new posts. The posting program (useful-carousels Worker) knows every post
it publishes, so this script takes those posts and adds them to the grid directly.

Usage: python3 scripts/add_ig_posts.py posts.json
posts.json is a list of
  {"permalink": "https://www.instagram.com/p/CODE/", "caption": "...",
   "published_at": 1792567253, "reel": false, "image": "/path/to/cover.jpg"}

Each post is saved under its real Instagram code, so if Instagram ever lets the
hourly job through again, it just updates the same entries. Posts already on the
grid are skipped. Then the grid in links/index.html is rebuilt from the archive.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["IG_JSON"] = "none"  # render from the archive only, never call Instagram
import build_links as bl  # noqa: E402

THUMB = (640, 800)


def save_thumb(src, dest):
    try:
        from PIL import Image, ImageOps
        im = Image.open(src).convert("RGB")
        im = ImageOps.fit(im, THUMB, Image.LANCZOS)
        im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
    except ImportError:
        import shutil
        shutil.copyfile(src, dest)


def main():
    new = json.load(open(sys.argv[1]))
    archive_path = os.path.join("links", "ig-archive.json")
    archive = {p["code"]: p for p in json.load(open(archive_path))}
    os.makedirs(bl.IG_DIR, exist_ok=True)
    added = []
    for p in new:
        m = re.search(r"instagram\.com/(?:p|reel|reels)/([A-Za-z0-9_-]+)", p.get("permalink") or "")
        if not m:
            print("skipped, no permalink:", p.get("caption", "")[:60], file=sys.stderr)
            continue
        code = m.group(1)
        if code in archive:
            continue
        img = os.path.join(bl.IG_DIR, code + ".jpg")
        if not os.path.exists(img):
            save_thumb(p["image"], img)
        archive[code] = {"code": code, "caption": p.get("caption", ""), "reel": bool(p.get("reel")),
                         "taken": int(p.get("published_at") or 0)}
        added.append(code)
    json.dump(sorted(archive.values(), key=lambda x: x["taken"], reverse=True),
              open(archive_path, "w"), indent=1)
    page = open(bl.PAGE).read()
    out = bl.replace_block(page, "IG", bl.ig_block())
    if out != page:
        open(bl.PAGE, "w").write(out)
    print(f"Added {len(added)} post(s): {', '.join(added) or 'none'}")


if __name__ == "__main__":
    main()
