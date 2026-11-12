"""Render share cards (1080x1350, library/og/card-<slug>.png) and the verdicts PDF (library/verdicts.pdf) for every book page.
Needs the site served at http://localhost:8765 and Playwright with Chrome. Run after adding or changing a book."""
import asyncio, os, sys, html, re
sys.path.insert(0, os.path.dirname(__file__))
from library_books import BOOKS
import library_art as A
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library")
AC = {"habits": "#2F6B4F", "focus": "#3A5BA0", "money": "#8A6A1E", "mindset": "#7A4A78"}
def books():
    # Atomic Habits lives in the builder; read its verdict data from the built page
    out = list(BOOKS)
    s = open(os.path.join(LIB, "books", "atomic-habits", "index.html"), encoding="utf-8").read()
    import json
    m = re.search(r'<script type="application/json" id="chapters"[^>]*>(.*?)</script>', s, re.S)
    if m:
        units = [tuple(u) for u in json.loads(m.group(1))]
        out.insert(0, {"slug": "atomic-habits", "t": "Atomic Habits", "by": "James Clear", "area": "habits", "unit": "Chapter", "units": units,
                       "verdict": "Worth it, but not cover to cover. 6 chapters carry the whole system."})
    return out
def short(u):
    t = u[1]; m = re.match(r"^(\d+)\.\s*(.*)", t)
    return (m.group(1) + ". " + m.group(2)) if m else t
def card(B):
    reads = [u for u in B["units"] if u[0] == "READ"]; n = len(B["units"]); ac = AC.get(B["area"], "#2F6B4F")
    lis = "".join(f"<li>{html.escape(short(u))}</li>" for u in reads[:7])
    return f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/library/library.css"><style>
body{{margin:0;width:1080px;height:1350px;background:#EEF0EC;font-family:var(--sans);display:flex;flex-direction:column;padding:80px;box-sizing:border-box;position:relative;overflow:hidden}}
.top{{display:flex;gap:56px;align-items:flex-start}}.top img{{width:330px;height:500px;object-fit:cover;border-radius:6px 18px 18px 6px;box-shadow:0 40px 60px -24px rgba(0,0,0,.5)}}
.stamp{{display:inline-block;border:6px solid {ac};color:{ac};font-family:var(--mono);font-weight:500;font-size:44px;letter-spacing:.06em;padding:14px 24px;border-radius:14px;transform:rotate(-6deg);margin-top:30px}}
h1{{font-family:var(--serif);font-weight:400;font-size:72px;line-height:1.02;color:#1C2B24;margin:34px 0 10px}}.by{{font-size:30px;color:#4A5A52}}
h2{{font-family:var(--mono);font-size:26px;letter-spacing:.06em;color:{ac};margin:64px 0 18px;font-weight:500}}
ol{{margin:0;padding-left:40px;font-size:34px;line-height:1.5;color:#1C2B24}}
.foot{{position:absolute;left:80px;right:80px;bottom:70px;display:flex;align-items:center;gap:16px;font-size:28px;font-weight:700;color:#4A5A52}}.foot svg{{width:64px;height:64px}}
.bar{{position:absolute;left:0;right:0;bottom:0;height:18px;background:{ac}}}
</style></head><body><div class="top"><img src="/library/img/covers/{B["slug"]}.webp"><div><span class="stamp">READ {len(reads)} OF {n}</span><h1>{html.escape(B["t"])}</h1><div class="by">{html.escape(B["by"])}</div></div></div>
<h2>READ ONLY THESE</h2><ol>{lis}</ol><div class="foot"><svg viewBox="0 0 160 160">{A.logo()}</svg>The Useful Library · theusefulmedia.com/library</div><div class="bar"></div></body></html>'''
def pdf(bs):
    rows = ""
    for B in bs:
        reads = ", ".join(short(u) for u in B["units"] if u[0] == "READ")
        skims = ", ".join(short(u) for u in B["units"] if u[0] == "SKIM")
        rows += f'''<section><img src="/library/img/covers/{B["slug"]}.webp"><div><h2>{html.escape(B["t"])}</h2><p class="by">{html.escape(B["by"])} · read {len([u for u in B["units"] if u[0]=="READ"])} of {len(B["units"])}</p>
<p><b class="r">READ</b> {html.escape(reads)}</p>{f'<p><b class="s">SKIM</b> {html.escape(skims)}</p>' if skims else ''}<p class="v">{html.escape(B["verdict"])}</p><p class="u">theusefulmedia.com/library/books/{B["slug"]}/</p></div></section>'''
    return f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/library/library.css"><style>
@page{{size:A4;margin:16mm}}body{{background:#fff;font-family:var(--sans);color:#1C2B24;font-size:11pt}}
header{{border-bottom:3px solid #2F6B4F;padding-bottom:10px;margin-bottom:14px}}header h1{{font-family:var(--serif);font-weight:400;font-size:30pt;margin:0}}header p{{color:#4A5A52;margin:4px 0 0}}
section{{display:flex;gap:16px;padding:12px 0;border-bottom:1px solid #DDE3DE;break-inside:avoid}}section img{{width:62px;height:94px;object-fit:cover;border-radius:2px 6px 6px 2px}}
h2{{font-family:var(--serif);font-weight:400;font-size:17pt;margin:0}}.by{{color:#4A5A52;margin:2px 0 6px}}p{{margin:3px 0}}
b.r,b.s{{font-family:var(--mono);font-size:8.5pt;padding:2px 6px;border-radius:4px;margin-right:6px}}b.r{{background:#2F6B4F;color:#fff}}b.s{{background:#F2EAD6;color:#6B5212}}.v{{color:#3C4A43;font-style:italic}}.u{{font-family:var(--mono);font-size:8pt;color:#2F6B4F}}
</style></head><body><header><h1>Read only these chapters</h1><p>Every chapter verdict from The Useful Library. {len(bs)} books. By Raja, who reads 70+ nonfiction books a year.</p></header>{rows}
<p style="margin-top:14px;color:#4A5A52">New verdicts every week at theusefulmedia.com/library</p></body></html>'''
async def main():
    from playwright.async_api import async_playwright
    bs = books(); tmp = os.path.join(LIB, "_card_tmp.html")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = await b.new_page(viewport={"width": 1080, "height": 1350})
        for B in bs:
            open(tmp, "w").write(card(B)); await pg.goto("http://localhost:8765/library/_card_tmp.html"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=os.path.join(LIB, "og", f"card-{B['slug']}.png"))
        open(tmp, "w").write(pdf(bs)); await pg.goto("http://localhost:8765/library/_card_tmp.html"); await pg.wait_for_timeout(800)
        await pg.pdf(path=os.path.join(LIB, "verdicts.pdf"), format="A4", print_background=True)
        await b.close()
    os.remove(tmp); print(len(bs), "cards + verdicts.pdf")
asyncio.run(main())
