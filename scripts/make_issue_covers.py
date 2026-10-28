#!/usr/bin/env python3
"""Makes a 1200x630 og.jpg for every library issue that has no Beehiiv thumbnail.

Run from the repo root after build_library.py, on a machine with Playwright:
  python3 scripts/make_issue_covers.py && python3 scripts/build_library.py
Existing covers are kept, so it only renders new issues.
"""
import html, json, os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB = ROOT / "tech" / "library"
FONT = (ROOT / "assets" / "fonts" / "space-grotesk.woff2").as_uri()
LABEL = {"find": "The Useful Find", "dive": "The Deep Dive", "five": "The Useful Five"}
BG = {"find": "#17172B", "dive": "#6A47F5", "five": "#ECE7FF"}
FG = {"find": "#FAFAF8", "dive": "#FFFFFF", "five": "#17172B"}

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:SG;src:url({font})}}*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:{bg};color:{fg};font-family:SG;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}}
.top{{display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:600}}
.mark{{display:grid;grid-template-columns:repeat(3,12px);gap:5px}}.mark i{{width:12px;height:12px;border-radius:3px;background:currentColor;opacity:.9}}.mark i:nth-child(5){{background:#B9A6FF;opacity:1}}
.brand{{display:flex;gap:14px;align-items:center}}
h1{{font-size:{size}px;line-height:1.04;letter-spacing:-1.5px;font-weight:700;max-width:1050px}}
.foot{{font-size:24px;opacity:.75}}
</style></head><body><div class="top"><div class="brand"><div class="mark"><i></i><i></i><i></i><i></i><i></i><i></i></div>The Useful Tech</div><div>{label} {num}</div></div>
<h1>{title}</h1><div class="foot">3 emails a week that make your iPhone and Mac more useful</div></body></html>"""


def main():
    issues = json.load(open(LIB / "library.json"))
    todo = [i for i in issues if not i.get("image") and not (LIB / i["slug"] / "og.jpg").exists()]
    if not todo:
        print("No new covers needed")
        return
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for i in todo:
            k = i["format"].get("key", "find")
            k = k if k in LABEL else "find"
            t = i["title"]
            page = PAGE.format(font=FONT, bg=BG[k], fg=FG[k], label=LABEL[k], num=f"#{i['num']:03d}" if i.get("num") else "",
                               title=html.escape(t), size=78 if len(t) < 50 else 64 if len(t) < 80 else 54)
            tmp = LIB / i["slug"] / "_cover.html"
            tmp.write_text(page, encoding="utf-8")
            pg.goto(tmp.as_uri()); pg.wait_for_timeout(250)
            pg.screenshot(path=str(LIB / i["slug"] / "og.jpg"), type="jpeg", quality=82)
            tmp.unlink()
            print("cover", i["slug"])
        b.close()


if __name__ == "__main__":
    main()
