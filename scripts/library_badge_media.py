"""The Useful Library badge images and GIFs for the badge emails (Raja, 18 Nov 2026). Free: Playwright + ffmpeg, no Claude or API credit.
Run from the repo root:  python3 scripts/library_badge_media.py [--only-png] [keys...]
Writes library/badges/img/ (served at /library/badges/img/):
  {id}-{pb|hc|cb|fe}.png, {id}-vel.png, {id}-plate.png   every badge in its bindings (transparent), for the "earned" row
  {id}-sketch.png, {id}-almost.png                       the half-inked pencil outline, for Collection saved and Almost there
  ribbon-slip.png, ribbon-hold.png, ribbon-off.png, fresh-hero.png   email heroes (1120 px)
  {key}.gif, {key}-card.jpg   Pop-up Book GIF (finished badge as the first frame, under 600 KB) and the share card for every big unlock:
                              First Edition of each badge, the 5 secret and limited badges, and the 30/100/365-day titles
"""
import asyncio, base64, glob, http.server, json, os, shutil, subprocess, sys, tempfile, threading
from functools import partial
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "library", "badges", "img")
COUNTED = ["marg", "dog", "cat", "field", "lend", "habit", "dnd", "interest", "weather", "twist", "shelfl", "turner", "wings"]
SPECIAL = [("flower", "vel"), ("exlib", "vel"), ("oil", "vel"), ("fresh", "plate"), ("last", "plate")]
TITLES = [(30, "Regular"), (100, "Librarian"), (365, "Archivist")]
FIN = ["pb", "hc", "cb", "fe"]
CHROME = os.environ.get("CHROME") or shutil.which("google-chrome") or shutil.which("chromium")

def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), partial(Q, directory=ROOT))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s.server_address[1]

HARNESS = """<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/library/library.css"><link rel="stylesheet" href="/library/badges/badges.css">
<style>html,body{margin:0;background:transparent!important}#s{display:inline-block;padding:20px 30px 34px}
.paper{background:#FBF8F0;border-radius:6px;padding:8px;width:300px;box-shadow:0 2px 10px rgba(0,0,0,.12);--pencil:#5F635C;--inkc:#1D2420;--note:#6C716A}
.hero{width:1120px;height:420px;display:flex;align-items:center;justify-content:center;background:#ECE8DE;position:relative;font-family:Manrope,sans-serif;color:#1D2420}
.plank2{position:absolute;left:60px;right:60px;top:60px;height:22px;border-radius:3px;background:linear-gradient(180deg,#8A6C55,#6B5240 40%,#4E3B2E);box-shadow:0 10px 16px -8px rgba(0,0,0,.5)}
.rb{position:absolute;left:300px;top:82px;width:60px;background:linear-gradient(90deg,#5E1426,#9A2840 50%,#5E1426);clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 16px),0 100%)}
.num{position:absolute;left:400px;font-family:"DM Serif Display",serif;font-size:150px;line-height:1}.num span{font-family:Manrope;font-size:34px;color:#5E6660;margin-left:14px}
.note{position:absolute;left:406px;font-family:Kalam,cursive;font-size:38px;color:#6C716A}
.ys-pu .ctrl,.ys-pu .ytag,.ys-pu .evb,.ys-pu .yalso,.ys-pu .ytitle p{display:none!important}</style></head>
<body class="ys"><div id="s"></div>
<script type="module">import * as A from "/library/badges/art.js";window.A=A;await document.fonts.load('400 30px "DM Serif Display"');await document.fonts.load('400 20px Kalam');window.ready=1;</script></body></html>"""

async def pngs(b, base):
    pg = await b.new_page(viewport={"width": 1200, "height": 900}, device_scale_factor=2)
    await pg.goto(base); await pg.wait_for_function("window.ready")
    async def shot(name, js, sel="#s", omit=True):
        await pg.evaluate(js); await pg.wait_for_timeout(200)
        await pg.locator(sel).screenshot(path=os.path.join(OUT, name), omit_background=omit)
    S = "document.getElementById('s').innerHTML="
    for i in COUNTED:
        for f in FIN: await shot(f"{i}-{f}.png", f"{S}A.solid('{i}','{f}',1)")
    for i, f in SPECIAL: await shot(f"{i}-{f}.png", f"{S}A.solid('{i}','{f}',1)")
    for i in COUNTED + [x for x, _ in SPECIAL]:
        await shot(f"{i}-sketch.png", f"{S}'<div class=paper>'+A.sketch('{i}',60)+'</div>'", omit=False)
        await shot(f"{i}-almost.png", f"{S}`<div class=hero><div class=paper style='width:420px;transform:rotate(-1.5deg)'>${{A.sketch('{i}',75)}}</div></div>`", "#s .hero", False)
    rib = lambda h, n, note, extra="": f"{S}`<div class=hero><div class=plank2></div><div class=rb style='height:{h}px;{extra}'></div><div class=num style='top:120px'>{n}<span>day streak</span></div><div class=note style='top:290px'>{note}</div></div>`"
    await shot("ribbon-slip.png", rib(230, 12, "slipping, not read today", "transform:translateY(34px);opacity:.92"), "#s .hero", False)
    await shot("ribbon-hold.png", rib(250, 12, "Hold My Place kept it", ""), "#s .hero", False)
    await shot("ribbon-off.png", rib(90, 12, "slipped off the shelf: 2 reads bring it back", "top:310px;left:250px;transform:rotate(-80deg);transform-origin:50% 50%"), "#s .hero", False)
    await shot("fresh-hero.png", f"{S}`<div class=hero>${{A.solid('fresh','plate',2.2)}}</div>`", "#s .hero", False)
    await pg.close()

def bigs():
    out = [(i, "fe", f"{i}-fe", None) for i in COUNTED] + [(i, f, f"{i}-{f}", None) for i, f in SPECIAL]
    return out + [("ribbon", "fe", f"title-{d}", n) for d, n in TITLES]

async def cards(b, base):
    pg = await b.new_page(viewport={"width": 600, "height": 600})
    await pg.goto(base); await pg.wait_for_function("window.ready")
    for i, f, key, title in bigs():
        line = f"{[d for d, n in TITLES if n == title][0]} days of reading in a row" if title else ""
        u = await pg.evaluate(f"(async()=>{{const c=await A.shareCanvas('{i}','{f}',{json.dumps(line)},{json.dumps({'name': title} if title else {})});return c.toDataURL('image/jpeg',.86)}})()")
        open(os.path.join(OUT, f"{key}-card.jpg"), "wb").write(base64.b64decode(u.split(",", 1)[1]))
    await pg.close()

async def gifs(b, base, only=None):
    tmp = tempfile.mkdtemp()
    for i, f, key, title in bigs():
        if only and key not in only: continue
        d = os.path.join(tmp, key)
        ctx = await b.new_context(viewport={"width": 560, "height": 560}, record_video_dir=d, record_video_size={"width": 560, "height": 560})
        pg = await ctx.new_page(); await pg.goto(base); await pg.wait_for_function("window.ready")
        await pg.evaluate("(()=>{const oa=Element.prototype.animate;Element.prototype.animate=function(k,o){if(o&&o.iterations===Infinity)return oa.call(this,[k[0],k[0]],{duration:1});return oa.call(this,k,o)}})()")
        name = f"You are now a {title}" if title else (None if f in ("pb", "hc", "cb", "fe") else "is yours")
        t = name if title else (f"' + A.B['{i}'].name + ' is yours" if name else f"' + A.B['{i}'].name + ' is now a First Edition")
        await pg.evaluate(f"A.popup('{i}','{f}','{t}','',[],{json.dumps({'name': title} if title else {})})")
        await pg.wait_for_timeout(6200)
        await ctx.close()
        vid = glob.glob(os.path.join(d, "*.webm"))[0]
        gif = os.path.join(OUT, key + ".gif")
        for w, fps, colors in [(420, 10, 80), (420, 9, 64), (380, 8, 48)]:
            pal = os.path.join(tmp, "pal.png")
            # last frame first, so mail apps that only show frame 1 (Outlook) still show the finished badge
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-sseof", "-0.2", "-i", vid, "-frames:v", "1", os.path.join(tmp, "last.png")], check=True)
            flt = f"fps={fps},scale={w}:-1:flags=lanczos"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "0.6", "-i", vid, "-vf", f"{flt},palettegen=max_colors={colors}", pal], check=True)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", "0.6", "-i", os.path.join(tmp, "last.png"), "-ss", "0.6", "-i", vid, "-i", pal,
                "-filter_complex", f"[0:v]{flt}[a];[1:v]{flt}[b];[a][b]concat=n=2:v=1[c];[c][2:v]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", gif], check=True)
            if os.path.getsize(gif) < 600_000: break
        print(key, os.path.getsize(gif) // 1024, "KB")
    shutil.rmtree(tmp, ignore_errors=True)

async def main():
    os.makedirs(OUT, exist_ok=True)
    h = os.path.join(ROOT, "library", "badges", "_render.html"); open(h, "w").write(HARNESS)
    port = serve(); base = f"http://127.0.0.1:{port}/library/badges/_render.html"
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
            await pngs(b, base); await cards(b, base)
            if "--only-png" not in sys.argv:
                only = [a for a in sys.argv[1:] if not a.startswith("--")]
                await gifs(b, base, only or None)
            await b.close()
    finally:
        os.remove(h)

asyncio.run(main())
