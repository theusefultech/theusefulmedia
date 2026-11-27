#!/usr/bin/env python3
"""Layout check: nothing may spill out of its card or off the screen (Raja, 24 Nov 2026, after the "N setups"
pill ran past the edge of app cards: "you should have automatic checks before or after every new change or deploy").

Free, rules only, no Claude usage. Opens built pages in headless Chrome at phone (390px) and desktop (1280px) width
and fails when:
  - the page scrolls sideways (something wider than the screen), or
  - a pill, tag, label, button or line of text sticks out past the edge of the card or box it sits in, or
  - a shortened blurb ("...") shows a half-cut extra line under it, or
  - text is hidden under another element (27 Nov 2026), or a short heading or label is squeezed into 3+ narrow lines on a phone.
Sideways scroll rows (carousels) are allowed to hold more than fits; only what pokes out of a card inside them counts.

Before deploy:  layout_check.py --dir dist          (serves the built site locally; deploy stops on a failure)
After deploy:   layout_check.py --live --all --alert (daily: every live page; files 1 alert email on a failure)
Options: --all checks every page instead of a sample of each template (the daily 06:00 run does this on the live site).
--only <path> checks 1 page. --shard k/n splits the pages for parallel runs.
"""
import argparse, asyncio, functools, http.server, json, os, re, socketserver, sys, threading, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTHS = [(390, 844), (1280, 900)]
PER_TYPE = 2
# measure the finished layout, not a frame of a fade-in or slide animation
SETTLE = "*,*::before,*::after{animation:none!important;transition:none!important} .rv,.js .rv{opacity:1!important;transform:none!important}"  # pages checked per template when sampling

JS = r"""() => {
 const out = [], seen = new Set(), W = document.documentElement.clientWidth;
 const css = e => getComputedStyle(e);
 const deco = e => !!e.closest('[aria-hidden="true"],[data-visual],svg');
 /* drawn mockups tilted or scaled on purpose (e.g. a rotated phone) can't be measured with screen boxes; skip them */
 const tilted = e => { for (let p = e; p && p != document.body; p = p.parentElement) { const t = css(p).transform;
   if (t && t != 'none') { const m = t.match(/matrix\(([^)]+)\)/); if (!m) return true; const v = m[1].split(',').map(Number);
     if (Math.abs(v[1]) > 0.001 || Math.abs(v[0] - 1) > 0.001 || Math.abs(v[3] - 1) > 0.001) return true; } } return false; };
 const shown = e => { const s = css(e); if (s.display == 'none' || s.visibility == 'hidden' || +s.opacity === 0) return false;
   const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
 const label = e => { let s = e.tagName.toLowerCase(); if (e.className && typeof e.className == 'string') s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.');
   const t = (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40); return t ? s + ' "' + t + '"' : s; };
 const scroller = e => { const s = css(e); return /(auto|scroll)/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1; };
 /* a "box" is something drawn as a card: a border or a background, with rounded corners or a border */
 const isBox = e => { const s = css(e); const bw = parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth);
   const bg = s.backgroundColor != 'rgba(0, 0, 0, 0)' && s.backgroundColor != 'transparent' || s.backgroundImage != 'none';
   return (bw > 0 || bg) && (bw > 0 || parseFloat(s.borderTopLeftRadius) >= 8) && e.getBoundingClientRect().width < W * 0.98; };
 // 1. sideways scroll of the whole page
 const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
 if (sw > W + 2) {
   let worst = null, wr = W;
   for (const e of document.body.querySelectorAll('*')) { if (!shown(e)) continue; const s = css(e); if (s.position == 'fixed') continue;
     let p = e.parentElement, inScroll = false; while (p && p != document.body) { if (scroller(p) || /hidden|clip/.test(css(p).overflowX)) { inScroll = true; break; } p = p.parentElement; }
     if (inScroll) continue; const r = e.getBoundingClientRect(); if (r.right > wr + 2) { wr = r.right; worst = e; } }
   out.push({kind: 'page scrolls sideways', px: Math.round(sw - W), el: worst ? label(worst) : '?'});
 }
 // 2. leaf items poking out of their card
 const leaves = [...document.querySelectorAll('main *, body > div *')].filter(e => {
   if (!shown(e) || e.closest('svg') && e.tagName.toLowerCase() != 'svg') return false;
   if (tilted(e)) return false;
   const s = css(e); if (s.position == 'absolute' || s.position == 'fixed' || s.position == 'sticky') return false;
   if (e.closest('[aria-hidden="true"],[data-overhang],dialog,[role=dialog],.tabbar,[hidden]')) return false;
   const dd = e.closest('details:not([open])'); if (dd && !e.closest('summary')) return false;  // closed dropdown content isn't drawn
   const hasText = [...e.childNodes].some(n => n.nodeType == 3 && n.textContent.trim());
   return hasText || ['img', 'svg', 'button', 'input', 'select'].includes(e.tagName.toLowerCase()) || isBox(e);
 });
 for (const e of leaves) {
   let box = null, p = e.parentElement, clipped = false;
   while (p && p != document.body) {
     const s = css(p);
     if (scroller(p)) break;                    // carousels may hold more than fits; stop at the row
     if (/hidden|clip/.test(s.overflowX) && !isBox(p)) { clipped = true; break; }  // cut off on purpose (e.g. "..."); the clipping box is checked itself
     if (s.position == 'absolute' || s.position == 'fixed') { box = null; break; }
     if (isBox(p) && p.getBoundingClientRect().width > e.getBoundingClientRect().width + 4) { box = p; break; }
     p = p.parentElement;
   }
   if (!box || clipped) continue;
   const r = e.getBoundingClientRect(), b = box.getBoundingClientRect();
   const over = Math.max(r.right - b.right, b.left - r.left);
   if (over > 2 && !seen.has(box)) { seen.add(box); out.push({kind: 'sticks out of its card', px: Math.round(over), el: label(e), box: label(box)}); }
 }
 // 3. a clamped blurb ("...") stretched taller than its lines shows a half-cut extra line
 for (const e of document.querySelectorAll('main *')) {
   const c = css(e), n = parseInt(c.webkitLineClamp); if (!n || !shown(e) || tilted(e)) continue;
   const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.2, hgt = e.offsetHeight - parseFloat(c.paddingTop) - parseFloat(c.paddingBottom);
   if (hgt > n * lh + 3 && e.scrollHeight > hgt + 3) { out.push({kind: 'text cut mid-line', px: Math.round(hgt - n * lh), el: label(e)}); break; }
 }
 // 5. a short heading or label squeezed into 3+ narrow lines on a phone
 if (W < 800) for (const e of document.querySelectorAll('main h2, main h3, main th, main dt, main label, main b, main strong')) {
   if (!shown(e) || tilted(e) || deco(e) || e.querySelector('input,select,textarea') || e.closest('.visually-hidden,[class*=sr-only]')) continue; const t = (e.innerText || '').trim(); if (t.length < 6 || t.length > 40) continue;
   const tops = new Set(), w2 = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); for (let tn; (tn = w2.nextNode());) { if (!tn.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(tn); for (const r of rg.getClientRects()) if (r.width > 2 && r.height > 4) tops.add(Math.round(r.top + r.height / 2)); }
   const lines = [...tops].sort((a, b) => a - b).filter((v, i, arr) => !i || v - arr[i - 1] > 6).length;
   if (lines >= 3 && t.length / lines < 8) { out.push({kind: 'label squeezed', px: lines, el: label(e)}); break; }
 }
 return out.slice(0, 8);
}"""


COVER_JS = r"""() => {
 const out = [], W = document.documentElement.clientWidth;
 const css = e => getComputedStyle(e);
 const deco = e => !!e.closest('[aria-hidden="true"],[data-visual],svg');
 /* drawn mockups tilted or scaled on purpose (e.g. a rotated phone) can't be measured with screen boxes; skip them */
 const tilted = e => { for (let p = e; p && p != document.body; p = p.parentElement) { const t = css(p).transform;
   if (t && t != 'none') { const m = t.match(/matrix\(([^)]+)\)/); if (!m) return true; const v = m[1].split(',').map(Number);
     if (Math.abs(v[1]) > 0.001 || Math.abs(v[0] - 1) > 0.001 || Math.abs(v[3] - 1) > 0.001) return true; } } return false; };
 const shown = e => { const s = css(e); if (s.display == 'none' || s.visibility == 'hidden' || +s.opacity === 0) return false;
   const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
 const label = e => { let s = e.tagName.toLowerCase(); if (e.className && typeof e.className == 'string') s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.');
   const t = (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40); return t ? s + ' "' + t + '"' : s; };
 const scroller = e => { const s = css(e); return /(auto|scroll)/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1; };
 // 4. (27 Nov 2026, the hero-card-over-headline and tour-tip bugs) text hidden under another element that paints something
 const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim().length > 2 ? 1 : 2 });
 const hidUnder = new Set(); let nCov = 0;
 for (let n; (n = tw.nextNode()) && nCov < 4;) {
   const el = n.parentElement; if (!el || ['SCRIPT', 'STYLE', 'OPTION', 'NOSCRIPT'].includes(el.tagName) || !shown(el) || tilted(el) || deco(el) || hidUnder.has(el)) continue;
   if (!(el.innerText || '').trim()) continue;  // text the browser does not draw (inside a closed or hidden block)
   { let faded = false; for (let p = el; p && p != document.body; p = p.parentElement) if (+css(p).opacity < 0.05 || css(p).visibility == 'hidden') { faded = true; break; } if (faded) continue; }
   { const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue; const er = el.getBoundingClientRect(); if (er.width <= 2 || er.height <= 2 || /rect\(0/.test(css(el).clip) || css(el).clipPath.includes('inset(50%')) continue; }
   let fixedUp = false; for (let p = el; p && p != document.body; p = p.parentElement) { const ps = css(p).position; if (ps == 'fixed' || ps == 'sticky') { fixedUp = true; break; } if (scroller(p)) { fixedUp = true; break; } } if (fixedUp) continue;
   // only the lines that are drawn: drop lines cut away by a "..." clamp or an overflow-hidden box
   let cl = -1e9, ct = -1e9, cr = 1e9, cb = 1e9;
   for (let p = el; p && p != document.body; p = p.parentElement) { const ps = css(p); if (/(hidden|clip|auto|scroll)/.test(ps.overflow + ps.overflowX + ps.overflowY) || parseInt(ps.webkitLineClamp)) { const q = p.getBoundingClientRect(); cl = Math.max(cl, q.left); ct = Math.max(ct, q.top); cr = Math.min(cr, q.right); cb = Math.min(cb, q.bottom); } }
   const rg = document.createRange(); rg.selectNodeContents(n); const rs = [...rg.getClientRects()].filter(r => r.width > 3 && r.height > 5 && r.top + r.height / 2 > ct && r.top + r.height / 2 < cb && r.left < cr && r.right > cl).slice(0, 4); if (!rs.length) continue;
   let tot = 0, cov = 0, by = null;
   for (const r of rs) for (const fx of [0.2, 0.5, 0.8]) { const x = r.left + r.width * fx, y = r.top + r.height / 2; if (x < 0 || x > W || y < 0 || y > innerHeight) continue; tot++;
     const t = document.elementFromPoint(x, y); if (!t || t === el || el.contains(t) || t.contains(el) || t.closest('.tour-tip,.tour-ring,[role=dialog],dialog,.toast') || +css(t).opacity < 0.05 || tilted(t) || (t.closest('svg') && (t.closest('[aria-hidden="true"],[data-visual]') || t.closest('svg').getAttribute('aria-hidden') == 'true'))) continue;
     let paints = false; for (let q = t; q && !q.contains(el); q = q.parentElement) { const qs = css(q); if ((qs.backgroundColor && !/rgba\(.*, 0\)$|transparent/.test(qs.backgroundColor)) || qs.backgroundImage != 'none' || ['IMG', 'CANVAS', 'VIDEO', 'svg'].includes(q.tagName)) { paints = true; break; } }
     let fixedT = false; for (let q = t; q && q != document.body; q = q.parentElement) { const qp = css(q).position; if (qp == 'fixed' || qp == 'sticky') { fixedT = true; break; } }
     if (paints && !fixedT) { cov++; by = t; } }
   if (tot && cov / tot >= 0.34) { hidUnder.add(el); nCov++; out.push({kind: 'text hidden under another element', px: Math.round(100 * cov / tot), el: label(el), box: label(by)}); }
 }
 return out;
}"""


def template(path):
    parts = [p for p in path.strip("/").split("/") if p]
    if len(parts) <= 1: return path
    return "/".join(parts[:2]) + ("/*" if len(parts) > 2 else "")


def pages_from_dir(d, base):
    found = []
    for root, _, files in os.walk(d):
        if "index.html" not in files: continue
        rel = os.path.relpath(root, d).replace(os.sep, "/")
        url = "/" if rel == "." else "/" + rel + "/"
        if url.startswith(("/assets", "/api")): continue
        head = open(os.path.join(root, "index.html"), encoding="utf-8", errors="ignore").read(4000)
        if 'http-equiv="refresh"' in head: continue
        found.append(url)
    return sorted(found)


def pages_live(host):
    urls = []
    for sm in [host + "/apps/sitemap.xml", host + "/sitemap.xml"]:
        try:
            x = urllib.request.urlopen(urllib.request.Request(sm, headers={"User-Agent": "UsefulLayoutCheck/1.0"}), timeout=30).read().decode()
            urls += [re.sub(r"^https?://[^/]+", "", u) for u in re.findall(r"<loc>([^<]+)</loc>", x)]
        except Exception as e:
            print("sitemap", sm, e)
    return sorted(set(urls))


def sample(urls, size=None):
    by = {}
    for u in urls: by.setdefault(template(u), []).append(u)
    out = []
    for k in sorted(by):
        v = by[k]
        # first, middle and last page of each template, plus the biggest page (longest names, prices and tag lists)
        pick = [v[0], v[len(v) // 2], v[-1]] if len(v) > 2 else list(v)
        if size and len(v) > 3: pick.append(max(v, key=size))
        out += list(dict.fromkeys(pick))
    return out


def serve(d):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=d)
    class Srv(socketserver.ThreadingTCPServer):
        daemon_threads = True
        def handle_error(self, *a): pass  # browser closed a connection early; harmless
    srv = Srv(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{srv.server_address[1]}"


def alert(text):
    key = os.environ.get("UPLOAD_KEY")
    if not key: return print("no UPLOAD_KEY, alert not sent")
    import time
    body = json.dumps({"key": "layout-check:" + time.strftime("%Y-%m-%d"), "task": "Layout check", "urgent": True, "what": text,
                       "fix": "Run python3 scripts/layout_check.py --live in theusefultech/useful-apps, fix the CSS for each listed element, push with [deploy now]."}).encode()
    req = urllib.request.Request("https://useful-carousels.raja-822.workers.dev/api/alert", data=body, method="POST",
                                 headers={"content-type": "application/json", "x-key": key, "User-Agent": "UsefulLayoutCheck/1.0"})
    try: urllib.request.urlopen(req, timeout=20); print("alert filed")
    except Exception as e: print("alert failed:", e)


async def run(base, urls, conc=4):
    from playwright.async_api import async_playwright
    fails, skipped = [], []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for w, h in WIDTHS:
            ctx = await br.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, reduced_motion="reduce",
                                       is_mobile=w < 500, has_touch=w < 500)
            await ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1|theusefulmedia\.com).*"), lambda r: r.abort())  # no outside calls
            q = asyncio.Queue()
            for u in urls: q.put_nowait(u)
            async def worker():
                pg = await ctx.new_page()
                while not q.empty():
                    u = q.get_nowait()
                    for attempt in (1, 2):
                        try:
                            async def one():
                                await pg.goto(base + u, wait_until="domcontentloaded", timeout=45000)
                                await pg.evaluate("Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))])")
                                await pg.add_style_tag(content=SETTLE); await pg.wait_for_timeout(400)
                                # 27 Nov 2026: the whole page in 1 tall viewport, so the "hidden under" check sees every line
                                found = await pg.evaluate(JS)
                                # 27 Nov 2026: "hidden under" is checked screen by screen down the page (a tall window would stretch vh sections)
                                full, seen_el = await pg.evaluate("Math.min(document.documentElement.scrollHeight, 15000)"), set()
                                for y in range(0, full, h - 100):
                                    await pg.evaluate(f"window.scrollTo(0, {y})"); await pg.wait_for_timeout(60)
                                    for c in await pg.evaluate(COVER_JS):
                                        if c["el"] not in seen_el and len(seen_el) < 4: seen_el.add(c["el"]); found.append(c)
                                return found[:10]
                            for f in await asyncio.wait_for(one(), 60): fails.append({"page": u, "width": w, **f})  # never hang on 1 page
                            break
                        except Exception as e:
                            try: await pg.close()
                            except Exception: pass
                            pg = await ctx.new_page()  # a crashed tab stays crashed; start a fresh one
                            if attempt == 2: print("could not open", u, w, str(e).splitlines()[0][:120]); skipped.append(u)
                await pg.close()
            await asyncio.gather(*[worker() for _ in range(conc)])
            await ctx.close()
        await br.close()
    if skipped: print(f"{len(skipped)} page views could not be opened")
    return sorted(fails, key=lambda f: (f["page"], f["width"]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir"); ap.add_argument("--live", action="store_true"); ap.add_argument("--host", default="https://theusefulmedia.com")
    ap.add_argument("--all", action="store_true"); ap.add_argument("--only"); ap.add_argument("--alert", action="store_true"); ap.add_argument("--shard", default="0/1")
    a = ap.parse_args()
    if a.live: base, urls = a.host, pages_live(a.host)
    else:
        d = os.path.abspath(a.dir or os.path.join(ROOT, "dist")); base, urls = serve(d), pages_from_dir(d, "/")
    size = (lambda u: os.path.getsize(os.path.join(d, u.strip("/"), "index.html"))) if not a.live else None
    urls = [a.only] if a.only else (urls if a.all else sample(urls, size))
    k, n = map(int, a.shard.split("/")); urls = urls[k::n]
    fails = asyncio.run(run(base, urls))
    for f in fails:
        print(f"FAIL {f['page']} @{f['width']}px  {f['kind']} by {f['px']}px: {f['el']}" + (f"  in {f['box']}" if f.get("box") else ""))
    print(f"layout check: {len(urls)} pages x {len(WIDTHS)} widths, {len(fails)} problems")
    if fails and a.alert:
        top = "\n".join(f"{f['page']} ({f['width']}px): {f['kind']}, {f['el']}" for f in fails[:10])
        alert(f"{len(fails)} layout problems on the live site after the last deploy:\n{top}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
