"""Build sponsor/media-kit.pdf from sponsor/facts.json (14 Nov 2026).

Every number comes from facts.json, which refresh_facts.py keeps current, so the kit never goes stale.
Run: python3 scripts/build_media_kit.py   (needs playwright with chromium)
"""
import base64, json, pathlib, datetime as dt
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
F = json.loads((ROOT / "sponsor/facts.json").read_text())
ICONS = sorted((ROOT / "sponsor/icons").glob("*.jpg"))
FONT = lambda n: base64.b64encode((ROOT / "assets/fonts" / n).read_bytes()).decode()
img = lambda p: "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode()
pct = lambda s: s.rstrip("%")
day = dt.date.fromisoformat(F["updated"]).strftime("%-d %b %Y")
MARK = '<svg viewBox="0 0 30 19.5"><g fill="#17172B">' + "".join(f'<rect x="{x}" y="{y}" width="9" height="9" rx="1.6"/>' for y in (0, 10.5) for x in (0, 10.5, 21)) + "</g></svg>"

stats = [
    (F["followers"], "Medium followers"),
    (F["views"], f'Views across {F["posts"]} posts'),
    (F["readRatio"], "Read ratio (people who read to the end)"),
    (F["topPostViews"], "Views on the top roundup"),
    (F["newsletterSubs"], f'Newsletter subscribers, {F["openRate"]} open rate'),
    (F["sponsors"], f'Apps that paid for a spot since {F.get("sponsorsSince", "September 2026")}'),
]
PRICES = {"Top spot in a roundup": "From $200", "Spot in a roundup": "From $100", "Dedicated review": "From $500", "Newsletter feature": "From $150", "Full campaign": "Quote"}
EXAMPLES = [
    ("Mic Drop", "#1 in 4 Mac Apps That Make Every Video Call a Little Less Awkward", "https://medium.com/the-useful-tech/4-mac-apps-that-make-every-video-call-a-little-less-awkward-8289e20cf309"),
    ("App Cleaner & Uninstaller", "#1 in 4 Mac Apps That Free Up Gigabytes Even After You Empty the Trash", "https://medium.com/the-useful-tech/4-mac-apps-that-free-up-gigabytes-even-after-you-empty-the-trash-2c47e8735f4d"),
    ("Sortio", "#1 in 5 Mac Apps That Clean Up Your Downloads Folder So You Never Have To", "https://theusefultech.com/5-mac-apps-that-clean-up-your-downloads-folder-so-you-never-have-to-1c15322c869c"),
]
place = [
    ("Top spot in a roundup", "Your app at #1 with its own section, screenshots and your tracked link, plus a newsletter feature."),
    ("Spot in a roundup", "Your app with its own section in a roundup of Mac or iPhone apps. Stays up for good."),
    ("Dedicated review", "A full post about your app alone, plus a newsletter feature."),
    ("Newsletter feature", f'Your app in front of {F["newsletterSubs"]} subscribers with a {F["openRate"]} open rate and {F["clickRate"]} click rate.'),
    ("Full campaign", "2 dedicated posts plus a newsletter issue, an Instagram carousel, and X and LinkedIn posts."),
]
bars = [("US readers", F["usShare"]), ("Read on a Mac", F["macShare"]), ("Read on an iPhone", F["iphoneShare"])]

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:SG;src:url(data:font/woff2;base64,{FONT('space-grotesk.woff2')}) format('woff2');font-weight:300 700}}
@font-face{{font-family:JB;src:url(data:font/woff2;base64,{FONT('jetbrains-mono.woff2')}) format('woff2')}}
@page{{size:A4;margin:0}}*{{box-sizing:border-box;margin:0}}
body{{font-family:SG;color:#17172B;background:#FAFAF8}}
.pg{{width:210mm;height:297mm;padding:18mm 16mm 14mm;position:relative;page-break-after:always;overflow:hidden}}
.top{{display:flex;gap:10px;align-items:center;font-weight:600;font-size:13px}}.top svg{{width:22px;height:15px}}
h1{{font-size:38px;line-height:1.08;letter-spacing:-.03em;margin:26px 0 14px;font-weight:600}}h1 em{{font-style:normal;color:#5638E6}}
.lede{{font-size:13.5px;line-height:1.55;color:#5A5A73;max-width:150mm}}
.stats{{display:grid;grid-template-columns:1fr 1fr;gap:20px 30px;margin:26px 0 24px}}
.stats b{{display:block;font-size:34px;letter-spacing:-.03em;font-weight:600}}.stats span{{font-size:11.5px;color:#5A5A73}}
h2{{font-size:24px;letter-spacing:-.02em;margin:0 0 14px;font-weight:600}}h3{{font-size:13px;margin:0 0 10px}}
.icons{{display:flex;flex-wrap:wrap;gap:7px}}.icons img{{width:34px;height:34px;border-radius:9px;object-fit:cover}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:12mm;display:flex;justify-content:space-between;font-family:JB;font-size:9.5px;color:#8A89A3}}
.bar{{margin:0 0 12px}}.bar p{{font-size:11.5px;color:#5A5A73;margin-bottom:5px}}.bar i{{display:block;height:7px;border-radius:9px;background:#E9E5F7;position:relative}}
.bar i::after{{content:"";position:absolute;inset:0 auto 0 0;width:var(--w);border-radius:9px;background:#7C5CFC}}
.note{{font-size:11px;color:#5A5A73;margin:6px 0 20px}}
.pl{{display:grid;grid-template-columns:52mm 1fr;gap:6px 18px;border-top:1px solid #E6E3EF;padding:10px 0}}.pl b{{font-size:13px}}.pl em{{display:block;font-style:normal;color:#5638E6;font-size:12px;margin-top:3px}}
.ex{{display:grid;grid-template-columns:44mm 1fr auto;gap:12px;align-items:center;text-decoration:none;color:#17172B;border:1px solid #E6E3EF;border-radius:12px;padding:10px 14px;margin-bottom:8px;background:#fff}}.ex b{{font-size:12.5px}}.ex span{{font-size:11.5px;color:#5A5A73}}.ex i{{font-style:normal;font-size:11px;color:#5638E6;font-weight:600}}.pl span{{font-size:12px;color:#5A5A73;line-height:1.5}}
.how{{background:#17172B;color:#F1F0F7;border-radius:16px;padding:16px 20px;margin-top:16px}}.how h2{{color:#fff;font-size:20px;margin-bottom:8px}}
.how p{{font-size:12px;line-height:1.6;color:#C9C8DD}}.how .m{{font-family:JB;font-size:11px;color:#fff;margin-top:10px}}
</style></head><body>
<section class="pg"><div class="top">{MARK}The Useful Tech · Media kit</div>
<h1>Put your app in front of <em>{F["followers"]}<br>Apple users</em> who pay for apps</h1>
<p class="lede">The Useful Tech is a Medium publication and newsletter about Mac and iPhone apps. Readers come to decide what to install next. Every sponsored post is written from real use: I install your app and use it before I write a word. Sponsored posts are free to read and stay up for good.</p>
<div class="stats">{"".join(f'<div><b>{v}</b><span>{l}</span></div>' for v, l in stats)}</div>
<h3>Apps I have worked with</h3><div class="icons">{"".join(f'<img src="{img(p)}">' for p in ICONS)}</div>
<div class="foot"><a style="color:inherit;text-decoration:none" href="https://theusefulmedia.com/advertise/">theusefulmedia.com/advertise · book a spot</a><span>Numbers as of {day}</span></div></section>
<section class="pg"><h2>Who reads</h2>
{"".join(f'<div class="bar"><p>{l} · {v}</p><i style="--w:{pct(v)}%"></i></div>' for l, v in bars)}
<p class="note">{F["appleShare"]} of newsletter readers are on Apple devices (Beehiiv, last 3 months)</p>
<h2>Placements</h2>{"".join(f'<div class="pl"><b>{a}<em>{PRICES[a]}</em></b><span>{b}</span></div>' for a, b in place)}
<h2 style="margin-top:22px">See a live sponsored post</h2>{"".join(f'<a class="ex" href="{u}"><b>{n}</b><span>{t}</span><i>Read it</i></a>' for n, t, u in EXAMPLES)}
<div class="how"><h2>How it works</h2><p>Book and pay, then send your link and a code. The draft arrives within 5 days, and you approve every line before it goes live. Every link carries your tracking tags. PayPal invoice outside India, UPI or bank transfer in rupees inside India. Book and pay online at <a style="color:#fff" href="https://theusefulmedia.com/advertise/#build">theusefulmedia.com/advertise</a>.</p>
<p class="m"><a style="color:#fff;text-decoration:none" href="mailto:raja@theusefultech.com">raja@theusefultech.com</a> · <a style="color:#fff;text-decoration:none" href="https://theusefulmedia.com/advertise/">theusefulmedia.com/advertise</a></p></div>
<div class="foot"><span>The Useful Tech by Raja</span><span>Page 2</span></div></section>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.set_content(HTML, wait_until="load"); pg.wait_for_timeout(300)
    pg.pdf(path=str(ROOT / "sponsor/media-kit.pdf"), format="A4", print_background=True)
    b.close()
print("media kit built", day)
