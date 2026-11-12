"""Render 1200x630 share images for Library pages into library/og/<key>.png.
Needs the site served at http://localhost:8765 and Playwright with Chrome. Run, then rebuild the site so pages pick them up."""
import asyncio, sys, os, html
sys.path.insert(0, os.path.dirname(__file__))
from library_problems import PROBLEMS
import library_art as A
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "library", "og")
AREA = {"habits": "#2F6B4F", "focus": "#3A5BA0", "money": "#8A6A1E", "mindset": "#7A4A78"}
PAGES = [("home", "THE USEFUL LIBRARY", "Fix real problems with ideas from nonfiction books", ["atomic-habits", "the-psychology-of-money", "mans-search-for-meaning"], "habits"),
 ("game", "DAILY GAME", "Mystery Book: guess today's book from 6 clues", [], "focus"),
 ("books", "BOOKS", "Books, and what to take from them", ["atomic-habits", "deep-work", "the-psychology-of-money"], "habits"),
 ("ideas", "IDEAS", "1 idea from a book, 2 minutes to try", ["tiny-habits", "meditations", "indistractable"], "mindset"),
 ("problems", "PROBLEMS", "Pick what you want to fix. 3 fixes from 3 books.", [f["cover"] for f in PROBLEMS[0]["fixes"]], "focus"),
 ("about", "ABOUT", "Hi, I'm Raja. 70+ nonfiction books a year.", [], "habits"),
 ("books-atomic-habits", "BOOK VERDICT", "Atomic Habits: read only 6 of 20 chapters", ["atomic-habits"], "habits"),
 ("ideas-the-2-minute-rule", "IDEA", "The 2 minute rule: 2 books, 2 different rules", ["atomic-habits"], "habits")]
PAGES += [("problems-" + P["slug"], "PROBLEM · 3 FIXES FROM 3 BOOKS", P["problem"], [f["cover"] for f in P["fixes"]], P["area"]) for P in PROBLEMS]
PAGES += [(k, "AREA", n, [], k) for k, n in [("habits", "Habits and discipline"), ("focus", "Focus and productivity"), ("money", "Money and wealth mindset"), ("mindset", "Mindset and emotions")]]
def tpl(kicker, title, covers, area):
    art = A.scene(area if area in AREA else "habits") if not covers else ""
    cv = "".join(f'<img src="/library/img/covers/{c}.webp" style="transform:rotate({(i-(len(covers)-1)/2)*7}deg) translateY({abs(i-(len(covers)-1)/2)*14}px)">' for i, c in enumerate(covers))
    return f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/library/library.css"><style>
body{{margin:0;width:1200px;height:630px;background:#EEF0EC;display:flex;align-items:center;gap:40px;padding:0 70px;box-sizing:border-box;font-family:var(--sans);overflow:hidden}}
.l{{flex:1;display:flex;flex-direction:column;gap:22px}}.k{{font-family:var(--mono);font-size:22px;letter-spacing:.06em;color:{AREA.get(area,'#2F6B4F')}}}
h1{{font-family:var(--serif);font-weight:400;font-size:{78 if len(title)<34 else 64}px;line-height:1.02;color:#1C2B24;margin:0}}
.b{{display:flex;align-items:center;gap:14px;font-size:24px;color:#4A5A52;font-weight:700}}.b svg{{width:58px;height:58px}}
.r{{flex:0 0 400px;display:flex;justify-content:center;align-items:center}}.r img{{width:190px;height:288px;object-fit:cover;border-radius:5px 14px 14px 5px;box-shadow:0 30px 50px -20px rgba(0,0,0,.5)}}.r img+img{{margin-left:-80px}}
.r svg{{width:360px;height:360px}}.bar{{position:absolute;left:0;right:0;bottom:0;height:14px;background:{AREA.get(area,'#2F6B4F')}}}
</style></head><body><div class="l"><div class="k">{html.escape(kicker)}</div><h1>{html.escape(title)}</h1><div class="b"><svg viewBox="0 0 160 160">{A.logo()}</svg>theusefulmedia.com/library</div></div><div class="r">{cv or art}</div><div class="bar"></div></body></html>'''
async def main():
    from playwright.async_api import async_playwright
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(os.path.dirname(OUT), "_og_tmp.html")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = await b.new_page(viewport={"width": 1200, "height": 630})
        for key, k, t, c, a in PAGES:
            open(tmp, "w").write(tpl(k, t, c, a))
            await pg.goto("http://localhost:8765/library/_og_tmp.html"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=os.path.join(OUT, key + ".png"))
        await b.close()
    os.remove(tmp)
    print(len(PAGES), "share images")
asyncio.run(main())
