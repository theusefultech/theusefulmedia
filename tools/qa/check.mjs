// Free site checker: every page at phone and desktop widths, light and dark. Rules only, no Claude usage.
// Usage: node check.mjs pages.txt [concurrency]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

const pages = fs.readFileSync(process.argv[2] || 'pages.txt', 'utf8').split('\n').filter(Boolean);
const CONC = +(process.argv[3] || 4);
const WIDTHS = [375, 393, 430, 1440];
const FONTS_OK = ['space grotesk', 'jetbrains mono'];
const slop = fs.existsSync('slop.txt') ? fs.readFileSync('slop.txt', 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(s => s.length > 4) : [];
fs.mkdirSync('shots', { recursive: true });

const SETTLE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
.rv,.js .rv,[data-reveal]{opacity:1!important;transform:none!important}`;

// Runs inside the page. Returns a list of issues.
const PAGE_JS = ({ W, fontsOk, slop }) => {
  const out = [];
  const add = (type, el, detail) => out.push({ type, el: el ? label(el) : '', detail });
  const cs = e => getComputedStyle(e);
  function label(e) {
    let s = e.tagName.toLowerCase();
    if (e.id) s += '#' + e.id;
    if (typeof e.className == 'string' && e.className.trim()) s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.');
    const t = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return t ? `${s} "${t}"` : s;
  }
  const shown = e => { if (e.closest && e.closest('details:not([open])') && !e.closest('summary')) return false; for (let p = e; p && p.nodeType == 1; p = p.parentElement) { const s = cs(p); if (s.display == 'none' || s.visibility == 'hidden' || +s.opacity < 0.05) return false; }
    const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const inScroller = e => { for (let p = e.parentElement; p && p != document.body; p = p.parentElement) { const s = cs(p); if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 2) return true; } return false; };
  const transformed = e => { for (let p = e; p && p != document.body; p = p.parentElement) { const t = cs(p).transform; if (t && t != 'none') { const m = t.match(/matrix\(([^)]+)\)/); if (!m) return true; const v = m[1].split(',').map(Number); if (Math.abs(v[1]) > .001 || Math.abs(v[0] - 1) > .001) return true; } } return false; };
  const isDeco = e => { for (let p = e; p && p != document.body; p = p.parentElement) { if (p.getAttribute('aria-hidden') == 'true' || p.hasAttribute('data-visual') || p.tagName == 'svg' || p.tagName == 'SVG') return true; } return false; };

  // 1. sideways scroll
  const sw = document.documentElement.scrollWidth;
  if (sw > W + 1) add('page-scrolls-sideways', null, `page is ${sw}px wide on a ${W}px screen`);

  // text nodes as line boxes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim().length > 1 ? 1 : 2 });
  const textEls = new Map();
  for (let n; (n = walker.nextNode());) { const el = n.parentElement; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'OPTION'].includes(el.tagName)) continue; if (!shown(el)) continue;
    if (!textEls.has(el)) textEls.set(el, []); textEls.get(el).push(n); }

  const clipOf = e => { let c = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }; for (let p = e.parentElement; p && p != document.body; p = p.parentElement) { const st = cs(p); if (/(hidden|clip|auto|scroll)/.test(st.overflow + st.overflowX + st.overflowY)) { const q = p.getBoundingClientRect(); c = { l: Math.max(c.l, q.left), t: Math.max(c.t, q.top), r: Math.min(c.r, q.right), b: Math.min(c.b, q.bottom) }; } } return c; };
  const seen = new Set();
  for (const [el, nodes] of textEls) {
    if (inScroller(el) || transformed(el)) continue;
    const range = document.createRange();
    const rects = [];
    for (const n of nodes) { range.selectNodeContents(n); for (const r of range.getClientRects()) if (r.width > 2 && r.height > 4) rects.push(r); }
    { const c = clipOf(el); const s2 = cs(el); const own = /(hidden|clip)/.test(s2.overflow) ? el.getBoundingClientRect() : null;
      for (let k = rects.length - 1; k >= 0; k--) { const r = rects[k]; const cy = r.top + r.height / 2;
        if (cy < c.t || cy > c.b || (own && (cy < own.top || cy > own.bottom))) rects.splice(k, 1); } }
    if (!rects.length) continue;
    // 2. text off screen
    for (const r of rects) if ((r.right > W + 2 && r.left < W) || (r.left < -2 && r.right > 0)) { if (!seen.has('off' + label(el))) { seen.add('off' + label(el)); add('text-off-screen', el, `text runs to x=${Math.round(r.right)} on a ${W}px screen`); } break; }
    // 3. text covered by another element (the hero-card-over-headline bug)
    if (!isDeco(el)) {
      let covered = 0, total = 0, by = null;
      for (const r of rects.slice(0, 6)) for (const fx of [0.15, 0.5, 0.85]) {
        const x = r.left + r.width * fx, y = r.top + r.height / 2; if (x < 0 || x > W || y < 0) continue; total++;
        const top = document.elementFromPoint(x, y);
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          // ignore see-through overlays: only count it if the covering thing paints something
          let paints = false; for (let p = top; p && !p.contains(el); p = p.parentElement) { const s = cs(p); if ((s.backgroundColor && !/rgba\(.*, 0\)$|transparent/.test(s.backgroundColor)) || s.backgroundImage != 'none' || ['IMG', 'SVG', 'CANVAS', 'VIDEO', 'svg'].includes(p.tagName) || (p.innerText || '').trim()) { paints = true; break; } }
          if (paints) { covered++; by = top; }
        }
      }
      if (total && covered / total >= 0.34 && !seen.has('cov' + label(el))) { seen.add('cov' + label(el)); add('text-covered', el, `${Math.round(100 * covered / total)}% of this text is hidden under ${label(by)}`); }
    }
    // 4. text cut by its box (no ellipsis)
    const s = cs(el);
    if ((s.overflow + s.overflowX + s.overflowY).match(/hidden|clip/) && s.textOverflow != 'ellipsis' && !s.webkitLineClamp?.match(/\d/) && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 3) && !inScroller(el))
      add('text-cut-off', el, `content ${el.scrollWidth}x${el.scrollHeight} in a ${el.clientWidth}x${el.clientHeight} box`);
    // 5. squeezed text: a short title wrapped into 3+ narrow lines
    const lines = new Set(rects.map(r => Math.round(r.top))).size;
    const txt = (el.innerText || '').trim();
    if (lines >= 3 && txt.length < 40 && txt.length / lines < 10 && W < 800) add('text-squeezed', el, `${txt.length} characters wrapped into ${lines} lines`);
    // 6. fonts
    const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    window.__fams = window.__fams || {}; window.__fams[fam] = (window.__fams[fam] || 0) + 1;
  }

  // 7. form fields too narrow or off screen
  if (W < 800) for (const f of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]):not([type=color]),textarea,select')) {
    if (!shown(f) || inScroller(f) || transformed(f)) continue; const r = f.getBoundingClientRect(); { const c = clipOf(f); if (r.left > c.r || r.right < c.l) continue; } const p = f.parentElement.getBoundingClientRect();
    if (r.right > W + 1) add('field-off-screen', f, `field runs to x=${Math.round(r.right)}`);
    else if (r.width < W * 0.5 && p.width > W * 0.7 && ![...f.parentElement.children].some(c => c !== f && shown(c) && Math.abs(c.getBoundingClientRect().top - r.top) < r.height)) add('field-too-narrow', f, `field is ${Math.round(r.width)}px in a ${Math.round(p.width)}px row`);
  }
  // 8. tap targets
  if (W < 800) for (const a of document.querySelectorAll('a,button,[role=button]')) {
    if (!shown(a) || inScroller(a)) continue; const s = cs(a); if (s.display == 'inline' && a.closest('p,li,td')) continue;
    const r = a.getBoundingClientRect(); if (r.height < 30 || r.width < 30) add('tap-target-small', a, `${Math.round(r.width)}x${Math.round(r.height)}px`);
  }
  // 9. broken images
  for (const img of document.images) if (shown(img) && img.complete && img.naturalWidth == 0) add('image-broken', img, img.currentSrc || img.src);
  // 10. copy rules
  const body = document.body.innerText;
  const lower = body.toLowerCase();
  if (body.includes('—')) add('em-dash', null, body.split('\n').find(l => l.includes('—')).slice(0, 90));
  for (const m of body.matchAll(/\S\s+[.,!?;:](?=\s|$)/g)) { add('space-before-punctuation', null, body.slice(Math.max(0, m.index - 30), m.index + 5).replace(/\s+/g, ' ')); break; }
  for (const p of slop) if (lower.includes(p)) add('slop-phrase', null, p);
  for (const m of body.matchAll(/\b(\w+) \1\b/gi)) if (!/^(\d+|that|had|ha|bye|no|so)$/i.test(m[1])) { add('repeated-word', null, m[0]); break; }
  // 11. ad-blocker trigger words in links, ids and classes
  const risky = /(^|[\/_\-\s.#])(ad|ads|advert|advertise|advertising|sponsor|sponsored|banner|promo|promoted|popup|affiliate|adbox|ad-slot)([\/_\-\s.]|$)/i;
  const hits = new Set();
  for (const e of document.querySelectorAll('[class],[id]')) { const k = (e.id || '') + ' ' + (typeof e.className == 'string' ? e.className : ''); if (risky.test(' ' + k + ' ') && shown(e)) hits.add(label(e).slice(0, 60)); }
  for (const a of document.querySelectorAll('a[href]')) { try { const u = new URL(a.href); if (u.host == location.host && risky.test(u.pathname)) hits.add('link ' + u.pathname); } catch {} }
  if (risky.test(location.pathname)) add('adblock-risk-url', null, location.pathname);
  for (const h of [...hits].slice(0, 8)) add('adblock-risk-name', null, h);
  // 12. facts used on the page
  const facts = [];
  for (const m of body.matchAll(/(\d[\d,.]*\s?[KkM]?\+?)\s+(apps? listed|apps|categories|followers|Medium followers|Apple readers|readers|subscribers|page views|views|reviews|articles)/g)) facts.push(m[1].replace(/\s/g, '') + ' ' + m[2]);
  for (const [f, n] of Object.entries(window.__fams || {})) if (!fontsOk.includes(f) && !/emoji|symbol|apple-system|system-ui|blinkmacsystemfont|sf pro/.test(f)) add('font-not-approved', null, `${f} on ${n} text blocks`);
  return { fams: window.__fams, issues: out, facts: [...new Set(facts)], links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href.split('#')[0]).filter(h => h.startsWith(location.origin)))] };
};

const results = [];
async function checkPage(browser, url) {
  const slug = url.replace('https://theusefulmedia.com/', '').replace(/\/$/, '').replace(/\//g, '__') || 'home';
  const rec = { url, slug, runs: [] };
  for (const scheme of ['light', 'dark']) for (const W of (scheme == 'dark' ? [393] : WIDTHS)) {
    const ctx = await browser.newContext({ viewport: { width: W, height: W < 800 ? 852 : 900 }, deviceScaleFactor: W < 800 ? 2 : 1, colorScheme: scheme, isMobile: W < 800, hasTouch: W < 800,
      userAgent: W < 800 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1 UsefulQA' : undefined });
    const page = await ctx.newPage();
    const run = { W, scheme, console: [], failed: [], issues: [] };
    page.on('console', m => { if (m.type() == 'error' && !/challenges\.cloudflare|Content Security Policy|%c%d/.test(m.text())) run.console.push(m.text().slice(0, 160)); });
    page.on('pageerror', e => run.console.push('JS error: ' + e.message.slice(0, 160)));
    page.on('requestfailed', r => { if (!/hit\.js|analytics|beacon|cloudflareinsights|challenges\.cloudflare/.test(r.url())) run.failed.push(r.url().slice(0, 140) + ' ' + (r.failure()?.errorText || '')); });
    page.on('response', r => { if (r.status() >= 400 && r.url().includes('theusefulmedia.com')) run.failed.push(r.status() + ' ' + r.url().slice(0, 140)); });
    try {
      await page.route(/challenges\.cloudflare\.com|turnstile/, r => r.abort());
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      run.status = resp ? resp.status() : 0;
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.addStyleTag({ content: SETTLE });
      // load lazy content, then go back to the top
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      // fixed and sticky bars are checked on their own; hide them for the overlap check
      const fullH = await page.evaluate(() => { for (const e of document.querySelectorAll('*')) { const p = getComputedStyle(e).position; if (p == 'fixed' || p == 'sticky') e.setAttribute('data-qa-fixed', p); } return Math.min(document.documentElement.scrollHeight, 16000); });
      // screenshot first (with bars), then measure
      if (scheme == 'light' && (W == 393 || W == 1440)) await page.screenshot({ path: `shots/${slug}--${W}.jpg`, fullPage: true, type: 'jpeg', quality: 60 }).catch(() => {});
      if (scheme == 'dark') await page.screenshot({ path: `shots/${slug}--${W}-dark.jpg`, fullPage: true, type: 'jpeg', quality: 60 }).catch(() => {});
      await page.addStyleTag({ content: '[data-qa-fixed]{visibility:hidden!important}' });
      await page.setViewportSize({ width: W, height: fullH });
      await page.waitForTimeout(250);
      const r = await page.evaluate(PAGE_JS, { W, fontsOk: FONTS_OK, slop });
      run.issues = r.issues; run.facts = r.facts; run.fams = r.fams; if (W == 393 && scheme == 'light') { rec.links = r.links; fs.mkdirSync('texts',{recursive:true}); fs.writeFileSync(`texts/${slug}.txt`, await page.evaluate(() => document.body.innerText)); }
      if (W == 393) {
        const axe = await new AxeBuilder({ page }).withRules(['color-contrast', 'image-alt', 'label', 'button-name', 'link-name', 'duplicate-id-aria']).analyze().catch(() => null);
        for (const v of axe?.violations || []) for (const n of v.nodes.slice(0, 6)) run.issues.push({ type: 'a11y-' + v.id, el: n.target.join(' '), detail: (n.any[0]?.message || v.help).slice(0, 140) });
      }
    } catch (e) { run.error = e.message.slice(0, 200); }
    rec.runs.push(run);
    await ctx.close();
  }
  return rec;
}

const browser = await chromium.launch();
let i = 0;
async function worker() { while (i < pages.length) { const u = pages[i++]; const r = await checkPage(browser, u); results.push(r); process.stdout.write(`${results.length}/${pages.length} ${r.slug}\n`); fs.writeFileSync('results.json', JSON.stringify(results)); } }
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close();
