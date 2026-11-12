#!/usr/bin/env python3
"""Builds the static pages of The Useful Library (theusefulmedia.com/library/). Run from anywhere: python3 scripts/build_library_site.py"""
import json, os, sys, html, hashlib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from library_illus import paper, plate
import library_art as A
from library_problems import PROBLEMS
from library_books import BOOKS as BOOKPAGES
from library_summaries import SUMMARIES
from library_takes import TAKES
R=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'library')
BASE='https://theusefulmedia.com'
def cov(slug):
    f=os.path.join(R,'img','covers',slug+'.webp')
    v=hashlib.md5(open(f,'rb').read()).hexdigest()[:8] if os.path.exists(f) else '0'
    return f'/library/img/covers/{slug}.webp?v={v}'

import hashlib
def ver(rel):
    fp=os.path.join(R,rel)
    try: return hashlib.md5(open(fp,'rb').read()).hexdigest()[:8]
    except Exception: return "1"
RAJA={"@type":"Person","@id":BASE+"/library/about/#raja","name":"Raja","alternateName":"Rajasekaran Ponnuchamy","url":BASE+"/library/about/","jobTitle":"Founder, The Useful Media Co","worksFor":{"@id":BASE+"/#org"},"knowsAbout":["Nonfiction books","Habits","Productivity","Personal finance","Stoicism"],"sameAs":["https://medium.com/@theusefultech","https://www.instagram.com/theuseful_life_/","https://x.com/UsefulCreator_",BASE+"/about/"]}
PUBLISHED="2026-11-12"
UPDATED={}  # path -> ISO date of the last real content change; default PUBLISHED
def nice(iso):
    import datetime; d=datetime.date.fromisoformat(iso); return f"{d.day} {d.strftime('%b %Y')}"
def byline(path=""):
    when=UPDATED.get(path,PUBLISHED)
    return f'<p class="byline"><a href="/library/about/"><span class="by-av" aria-hidden="true">R</span><span>By <b>Raja</b></span></a><span>Reads 70+ nonfiction books a year</span><span>Updated <time datetime="{when}">{nice(when)}</time></span></p>'
AREA_META={"habits":("Habits and discipline","Build what sticks. Break what doesn't."),"focus":("Focus and productivity","Do the 1 thing that matters."),
           "money":("Money and wealth mindset","Spend, save and think better about money."),"mindset":("Mindset and emotions","Calmer, steadier, less overthinking.")}
def crumbs(items):
    """items: [(label, path or None)], Library home is added first. Returns (html, ld)."""
    full=[("Library","/library/")]+items
    h='<nav class="crumbs" aria-label="Breadcrumb"><ol>'+"".join((f'<li><a href="{u}">{html.escape(l)}</a></li>' if u and i<len(full)-1 else f'<li aria-current="page">{html.escape(l)}</li>') for i,(l,u) in enumerate(full))+'</ol></nav>'
    ld={"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":l,**({"item":BASE+u} if u else {})} for i,(l,u) in enumerate(full)]}
    return h,ld
def toc(items):
    return '<nav class="toc" aria-label="On this page"><span class="mono">On this page</span>'+"".join(f'<a href="#{i}">{html.escape(l)}</a>' for i,l in items)+'</nav>'
def head(title, desc, path, extra_ld=None, og='/library/og.png'):
    ld=[{"@type":"Organization","@id":BASE+"/#org","name":"The Useful Media Co","url":BASE+"/"},
        RAJA,
        {"@type":"WebPage","@id":BASE+path,"url":BASE+path,"name":title,"description":desc,"isPartOf":{"@type":"WebSite","name":"The Useful Library","url":BASE+"/library/"},"publisher":{"@id":BASE+"/#org"},"author":{"@id":BASE+"/library/about/#raja"},"datePublished":PUBLISHED,"dateModified":UPDATED.get(path,PUBLISHED)}]
    if extra_ld: ld+=extra_ld
    t=html.escape(title); d=html.escape(desc)
    _ogf=os.path.join(R,'og',path.strip('/').replace('library','',1).strip('/').replace('/','-') or 'home')+'.png'
    if og=='/library/og.png' and os.path.exists(_ogf): og='/library/og/'+os.path.basename(_ogf)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>(function(){{try{{var t=JSON.parse(localStorage.getItem("lib:theme")||'"auto"');if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dk")}}catch(e){{}}}})()</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{BASE}{path}">
<meta name="robots" content="max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Useful Library">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{BASE}{og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#EEF0EC">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/library/manifest.webmanifest">
<link rel="alternate" type="application/atom+xml" title="The Useful Library: new pages" href="/library/feed.xml">
<script type="speculationrules">{{"prefetch":[{{"where":{{"href_matches":"/library/*"}},"eagerness":"moderate"}}]}}</script>
<link rel="apple-touch-icon" href="/library/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Library">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" href="/library/fonts/dm-serif-display-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/library/fonts/manrope-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/library/library.css?v={ver('library.css')}">
<script type="application/ld+json">{json.dumps({"@context":"https://schema.org","@graph":ld})}</script>
<script src="/library/library.js?v={ver('library.js')}" defer></script>
<script src="/apps/hit.js" defer></script>
'''

def nav(cur):
    def a(href,label,key):
        c=' aria-current="page"' if key==cur else ''
        return f'<a href="{href}"{c}>{label}</a>'
    ic={
     "home":'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
     "game":'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
     "search":'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
     "menu":'<path d="M4 7h16M4 12h16M4 17h10"/>',
     "shelf":'<path d="M5 4v16M9 4v16M13.5 4.5l4 15M3 20h18"/>'}
    def svg(k): return f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ic[k]}</svg>'
    def tab(href,label,key):
        c=' aria-current="page"' if key==cur else ''
        return f'<a href="{href}"{c}>{svg(key)}<span>{label}</span></a>'
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="wrap"><nav class="lib-nav" aria-label="The Useful Library">
<a class="lib-brand" href="/library/" aria-label="The Useful Library home"><svg width="38" height="38" viewBox="0 0 160 160" aria-hidden="true">{A.logo()}</svg><span>The Useful Library</span></a>
<div class="lib-links">{a("/library/problems/","Problems","problems")}{a("/library/books/","Books","book")}{a("/library/game/","Today&#39;s game","game")}{a("/library/ideas/","Ideas","idea")}{a("/library/shelf/","My shelf","shelf")}<a class="btn btn-ink pill" href="/library/#signup" style="min-height:44px;padding:10px 18px;font-size:15px">Get the free lessons</a></div>
<button class="lamp" type="button" data-lamp aria-label="Switch to dark mode"><svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path class="lamp-cord" d="M22 0 V22" stroke="currentColor" stroke-width="1.6"/><circle class="lamp-knob" cx="22" cy="24" r="2.6" fill="currentColor"/><path d="M10 0 V9" stroke="currentColor" stroke-width="2"/><path d="M3 20 Q10 6 17 20 Z" fill="var(--green)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle class="lamp-bulb" cx="10" cy="22" r="3.4"/><path class="lamp-glow" d="M2 24 L-4 40 H24 L18 24 Z"/></svg></button>
<button class="menu-btn" type="button" data-menu-open aria-haspopup="dialog" aria-label="Open menu">{svg("menu")}</button>
</nav></header>
<nav class="tabbar" aria-label="Quick links">{tab("/library/","Home","home")}{tab("/library/game/","Game","game")}<a href="/library/#q" data-search-open>{svg("search")}<span>Search</span></a>{tab("/library/shelf/","Shelf","shelf")}<button type="button" data-menu-open aria-haspopup="dialog">{svg("menu")}<span>Menu</span></button></nav>
<div class="sheet" data-sheet hidden><div class="sheet-backdrop" data-menu-close></div>
<div class="sheet-panel" role="dialog" aria-modal="true" aria-label="Menu"><div class="sheet-grip" aria-hidden="true"></div>
<a href="/library/">Home</a><a href="/library/problems/">Problems: 3 fixes from 3 books</a><a href="/library/books/">Books: what to read, skim or skip</a><a href="/library/game/">Today&#39;s game: Mystery Book</a><a href="/library/ideas/">Ideas: 1 idea, 2 minutes</a><a href="/library/about/">About the Library</a><a href="/library/shelf/">My shelf: stamps, streak, tests</a>
{STAY_BLOCK}
<button type="button" class="btn btn-line" data-menu-close>Close</button></div></div>'''

STAY_BLOCK='''<div class="stay" data-stay>
<p class="mono">Never miss a day</p>
<div class="stay-row">
<button type="button" class="stay-btn" data-install><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 8v6M9 11l3 3 3-3"/></svg><span><b>Add to home screen</b><small>Opens like an app</small></span></button>
<a class="stay-btn" href="/library/mystery-book.ics" data-cal><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M12 13.5v4M10 15.5h4"/></svg><span><b>Add a daily reminder</b><small>2 minutes in your calendar</small></span></a>
<button type="button" class="stay-btn" data-sync-open><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.6 4.5 4.5 0 0 0 7 18.5z"/><path d="M9.5 13.5l2 2 3.5-3.8"/></svg><span><b data-sync-label>Save my progress</b><small data-sync-sub>Keep your streak on every device</small></span></button>
<a class="stay-btn" href="/library/#signup" data-menu-close><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/></svg><span><b>Get the lessons by email</b><small>3 a week, free</small></span></a>
</div></div>'''
FOOT=f'''<script type="application/json" id="plates">{json.dumps({k:A.stamp(k) for k in A.STAMP_POSES})}</script><footer class="wrap"><div class="stay-foot">'''+STAY_BLOCK+'''</div><div class="lib-foot"><div>The Useful Library is part of The Useful Life, from <a href="/">The Useful Media Co</a>.</div><div><a href="/library/habits/">Habits</a> · <a href="/library/focus/">Focus</a> · <a href="/library/money/">Money</a> · <a href="/library/mindset/">Mindset</a> · <a href="/library/problems/">Problems</a> · <a href="/library/books/">Books</a> · <a href="/library/ideas/">Ideas</a> · <a href="/library/about/">About</a> · <a href="/library/privacy/">Privacy</a></div><div><a href="/library/game/">Daily game</a> · <a href="/tech/">The Useful Tech</a> · <a href="/contact/">Contact</a></div><div class="aff-note">As an Amazon Associate, The Useful Library earns from qualifying purchases.</div></div></footer>
<div class="sheet" data-sync-sheet hidden><div class="sheet-backdrop" data-sync-close></div>
<div class="sheet-panel sync-panel" role="dialog" aria-modal="true" aria-label="Save my progress"><div class="sheet-grip" aria-hidden="true"></div>
<div data-sync-out><p class="serif" style="font-size:28px;line-height:1.1">Save my progress</p>
<p class="sync-lede">Your streak, stamps, shelf and 30-day tests live on this device. Save them to your email with a 4-digit PIN. Enter the same email and PIN on any phone or laptop to bring them back.</p>
<form class="sync-form" data-sync-form novalidate>
<label for="sync-em">Email</label><input id="sync-em" type="email" autocomplete="email" placeholder="you@email.com" required>
<label for="sync-pin">4-digit PIN</label><input id="sync-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000" required>
<button class="btn btn-green" type="submit">Save my progress</button></form>
<p class="fine">New here? Saving also gets you The Useful Life lessons, 3 a week, free. Unsubscribe anytime. Forgot your PIN? <a href="/contact/">Contact us</a>. How we handle your data: <a href="/library/privacy/">Privacy</a>.</p></div>
<div data-sync-in hidden><p class="serif" style="font-size:28px;line-height:1.1">Progress saved</p>
<p class="sync-lede">Synced with <b data-sync-email></b>. Last saved <span data-sync-when></span>. On another device, open the menu, tap Save my progress and enter the same email and PIN.</p>
<button type="button" class="btn btn-line" data-sync-signout>Sign out on this device</button><button type="button" class="linkish" data-sync-delete>Delete my saved progress</button></div>
<p class="sync-msg" aria-live="polite"></p>
<button type="button" class="btn btn-line" data-sync-close>Close</button></div></div>
<div class="peek" data-peek hidden><span class="peek-dog">'''+A.peek()+'''</span><div class="peek-bubble" role="status"><button type="button" class="peek-x" data-peek-x aria-label="Hide">×</button><p data-peek-t></p><a data-peek-a class="more" href="/library/game/"></a></div></div>
<div class="sheet" data-ios-guide hidden><div class="sheet-backdrop" data-guide-close></div>
<div class="sheet-panel" role="dialog" aria-modal="true" aria-label="Add to home screen"><div class="sheet-grip" aria-hidden="true"></div>
<p class="serif" style="font-size:28px;line-height:1.1">Add the Library to your home screen</p>
<div class="guide-step"><span class="guide-n">1</span><span>Tap the <b>Share</b> button <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="bob"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v8.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V11"/></svg> in Safari&#39;s bar.</span></div>
<div class="guide-step"><span class="guide-n">2</span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></div>
<div class="guide-step"><span class="guide-n">3</span><span>Tap <b>Add</b>. The Library opens like an app, with today&#39;s game 1 tap away.</span></div>
<button type="button" class="btn btn-green" data-guide-close>Got it</button></div></div>
</body>
</html>
'''

LEAD='''<section id="signup" class="lead card reveal"><div class="lead-art" aria-hidden="true"><span class="lead-pdf"><b>READ ONLY THESE CHAPTERS</b><i></i><i></i><i></i><i></i><i></i><small>Every verdict, 1 page per book</small></span></div>
<div class="lead-main"><p class="mono">Free PDF</p><h2 style="font-size:32px">Every chapter verdict, in 1 PDF</h2><p style="color:var(--soft)">Which chapters to read, skim or skip for every book in the Library, updated as new books arrive. Plus The Useful Life lessons, 3 a week. Unsubscribe anytime.</p>
<form class="signup" data-life-signup data-campaign="CAMP" data-reward="/library/verdicts.pdf" novalidate><label class="vh" for="em-CAMP">Email address</label><input id="em-CAMP" type="email" autocomplete="email" placeholder="you@email.com" required><button class="btn btn-green" type="submit">Send me the PDF</button></form>
<div class="signup-msg" aria-live="polite"></div></div></section>'''
SIGNUP='''<section id="signup" class="card row reveal" style="align-items:center">
<div class="grow-main" style="display:flex;flex-direction:column;gap:8px"><h2 style="font-size:36px">Lessons from real books, 3 times a week</h2><p style="color:var(--soft)">The Useful Life newsletter: 1 lesson every Monday, a worksheet every Wednesday, 3 useful finds every Friday. Free.</p></div>
<div class="grow-side" style="display:flex;flex-direction:column;gap:8px">
<form class="signup" data-life-signup data-campaign="CAMP" novalidate><label class="vh" for="em-CAMP">Email address</label><input id="em-CAMP" type="email" autocomplete="email" placeholder="you@email.com" required><button class="btn btn-green" type="submit">Send me the lessons</button></form>
<div class="signup-msg" aria-live="polite"></div></div>
</section>'''

WRITTEN=set()
def write(path, s):
    WRITTEN.add("/"+os.path.relpath(os.path.dirname(path),os.path.dirname(R)).replace(os.sep,"/")+"/")
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path,'w').write(s)


def next3(here, area="habits", path=""):
    cards=[]
    nm=AREA_META[area][0]
    cards.append(f'<a class="n3 card lift" href="/library/{area}/"><p class="mono">Area hub</p><h3>More on {html.escape(nm.split(" and ")[0].lower())}</h3><p style="font-size:15px;color:var(--soft)">Every problem, book and idea about {html.escape(nm.lower())}.</p></a>')
    sib=[P for P in PROBLEMS if P["area"]==area and "/library/problems/"+P["slug"]+"/"!=path] or [P for P in PROBLEMS if "/library/problems/"+P["slug"]+"/"!=path]
    if sib:
        P=sib[0]; cards.append(f'<a class="n3 card lift" href="/library/problems/{P["slug"]}/"><p class="mono">Problem · 3 fixes</p><h3>{html.escape(P["problem"])}</h3><p style="font-size:15px;color:var(--soft)">{html.escape(", ".join(f["book"] for f in P["fixes"]))}</p></a>')
    if here!="game": cards.append('<a class="n3 lift gametile" href="/library/game/"><p class="mono" style="color:#CFE3D7">Daily game</p><h3>Guess today&#39;s book</h3><p style="font-size:15px;color:#E3EEE7">6 clues. Keep your streak going.</p></a>')
    else: cards.append('<a class="n3 card lift" href="/library/shelf/"><p class="mono">Your shelf</p><h3>See your stamps and streak</h3><p style="font-size:15px;color:var(--soft)">9 stamps to collect.</p></a>')
    return '<section class="reveal" style="display:flex;flex-direction:column;gap:16px"><h2 style="font-size:36px">Your next 3</h2><div class="grid n3-grid">'+"".join(cards[:3])+'</div></section>'


RTT='https://theusefultech.gumroad.com/l/read-to-transform?utm_source=theusefulmedia.com&utm_medium=library'
def plug(where, line):
    art=A.scene("read").replace('<svg class="art"','<svg class="art" width="96" height="96"')
    return f'<a class="plug lift reveal" href="{RTT}&utm_campaign={where}" rel="noopener"><span class="plug-art">{art}</span><span style="display:flex;flex-direction:column;gap:4px;flex:1 1 240px"><span class="mono">From The Useful Life</span><span class="serif" style="font-size:24px;line-height:1.15">Read to Transform</span><span style="font-size:15px;color:var(--soft)">{line}</span></span><span class="go" style="font-weight:800;color:var(--green)">See the journal</span></a>'
def faq(qs):
    return '<section class="faq reveal" id="faq"><h2 style="font-size:32px">Quick answers</h2>'+"".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in qs)+'</section>'
BQ=[('Is Atomic Habits worth reading?', 'Yes, but not cover to cover. 6 of its 20 chapters carry the whole system: {reads}. The rest repeats the same ideas with more stories.'), ('Which chapters of Atomic Habits should I read?', 'Read chapters {reads}. Skim the ones marked skim for their 1 rule, and skip the rest unless you enjoy the stories.'), ('What is the most useful idea in Atomic Habits?', 'The 2 minute rule in chapter 13: shrink any new habit until it takes 2 minutes, so starting is easy.')]
IQ=[('What is the 2 minute rule?', 'There are 2. In Atomic Habits, James Clear says a new habit should take under 2 minutes to start. In Getting Things Done, David Allen says any task under 2 minutes should be done right away.'), ('Which 2 minute rule should I use?', "Use James Clear's version for habits you never start. Use David Allen's for small tasks that pile up. They solve different problems, so you can use both.")]
# ---------------- HOME
problems=[
 {"text":"I keep procrastinating","area":"FOCUS","keys":"procrastinate procrastinating delay put putt putting off start lazy later","url":"/library/ideas/the-2-minute-rule/"},
 {"text":"I can't stick to new habits","area":"HABITS","keys":"habit habits stick routine discipline consistent","url":"/library/ideas/the-2-minute-rule/"},
 {"text":"I start strong, then quit","area":"HABITS","keys":"quit quitting motivation consistent give up","url":"/library/problems/start-strong-then-quit/"},
 {"text":"Small tasks pile up on me","area":"FOCUS","keys":"tasks pile emails chores todo to-do overwhelmed","url":"/library/ideas/the-2-minute-rule/"},
 {"text":"I overspend every month","area":"MONEY","keys":"money spend spending overspend save saving budget","url":"/library/problems/overspending/"},
 {"text":"I don't know how to start investing","area":"MONEY","keys":"invest investing stock stocks wealth retire money"},
 {"text":"I overthink everything","area":"MINDSET","keys":"overthink overthinking worry anxious stress mind calm","url":"/library/problems/overthinking/"},
 {"text":"I can't focus for long","area":"FOCUS","keys":"focus distract distracted phone attention concentrate","url":"/library/problems/cant-focus/"},
 {"text":"Small setbacks ruin my week","area":"MINDSET","keys":"setback setbacks resilience calm upset"},
]
catalog=[{"slug":"atomic-habits","t":"Atomic Habits","a":"habits"},{"slug":"the-power-of-habit","t":"The Power of Habit","a":"habits"},{"slug":"mindset","t":"Mindset","a":"mindset"},
 {"slug":"deep-work","t":"Deep Work","a":"focus"},{"slug":"essentialism","t":"Essentialism","a":"focus"},{"slug":"indistractable","t":"Indistractable","a":"focus"},{"slug":"the-7-habits-of-highly-effective-people","t":"The 7 Habits of Highly Effective People","a":"habits"},
 {"slug":"the-psychology-of-money","t":"The Psychology of Money","a":"money"},{"slug":"i-will-teach-you-to-be-rich","t":"I Will Teach You to Be Rich","a":"money"},
 {"slug":"mans-search-for-meaning","t":"Man's Search for Meaning","a":"mindset"},{"slug":"meditations","t":"Meditations","a":"mindset"},{"slug":"thinking-fast-and-slow","t":"Thinking, Fast and Slow","a":"money"},{"slug":"how-to-win-friends-and-influence-people","t":"How to Win Friends and Influence People","a":"mindset"},{"slug":"tiny-habits","t":"Tiny Habits","a":"habits"}]
ideas_daily=[
 {"area":"Habits","src":"Atomic Habits, ch. 13","slug":"the-2-minute-rule","keys":"procrastinate start starting lazy habit tiny small begin put putt putting off motivation read reading","t":"The 2 minute rule","d":"Shrink any new habit to a version that takes 2 minutes. \"Read 30 pages\" becomes \"read 1 page\". Starting is the hard part, so make starting tiny.","s":["Pick 1 habit you keep putting off.","Cut it to its first 2 minutes. Running becomes putting on your shoes.","Do only that today. Stop there, even if you want more."],"url":"/library/ideas/the-2-minute-rule/"},
 {"area":"Habits","src":"Atomic Habits, ch. 5","slug":"habit-stacking","keys":"habit routine remember forget new habit morning stick consistent","t":"Habit stacking","d":"Tie a new habit to one you already do every day: after I pour my morning coffee, I will write 1 line in my journal.","s":["List 5 things you already do every day without thinking.","Pick the one that happens at the right time and place for your new habit.","Write \"After I ___, I will ___\" and put it where you will see it."],"url":"/library/?idea=habit-stacking#today"},
 {"area":"Habits","src":"Atomic Habits, ch. 16","slug":"never-miss-twice","keys":"quit give up streak consistent miss skip relapse fail","t":"Never miss twice","d":"Missing a day happens. Missing 2 in a row is how a habit quietly dies. Treat the day after a miss as the one that counts.","s":["Pick the habit you most often drop.","Decide now what the smallest version is on a bad day.","If you miss today, put that tiny version first on tomorrow's list."],"url":"/library/?idea=never-miss-twice#today"},
 {"area":"Focus","src":"Essentialism","slug":"the-90-percent-rule","keys":"decide decision choice choices yes no busy overwhelmed priorities commit too much","t":"The 90 percent rule","d":"Score each option out of 100 on what matters most to you. Anything below 90 counts as a no. If it isn't a clear yes, it's a clear no.","s":["Pick 1 decision you have been putting off.","Write the 1 thing that matters most in it.","Score each option out of 100. Drop everything under 90."],"url":"/library/?idea=the-90-percent-rule#today"},
 {"area":"Focus","src":"Deep Work","slug":"the-shutdown-ritual","keys":"work stress evening switch off overwork burnout rest relax worry focus","t":"The shutdown ritual","d":"End every workday the same way: check what's left, plan tomorrow, then say a set phrase that tells your brain work is done.","s":["5 minutes before you stop, list what is still open.","Put each open item on tomorrow or a later date.","Close with the same short phrase every day, then stop checking work."],"url":"/library/?idea=the-shutdown-ritual#today"},
 {"area":"Money","src":"The Psychology of Money","slug":"wealth-is-what-you-dont-see","keys":"money spend spending save saving rich wealth buy shopping budget debt broke","t":"Wealth is what you don't see","d":"The money you didn't spend is the wealth. The nice car shows what someone spent, not what they have.","s":["Pick 1 thing you were about to buy to look good.","Skip it, and move that amount into savings today.","Name that savings pot after what it will buy you: time."],"url":"/library/?idea=wealth-is-what-you-dont-see#today"},
 {"area":"Habits","src":"The Power of Habit","slug":"keep-the-cue-swap-the-routine","keys":"bad habit break stop quit smoking phone scrolling snack craving urge addiction","t":"Keep the cue, swap the routine","d":"You can't delete a bad habit easily, but you can change what you do when the urge hits, as long as you still get a reward.","s":["Pick 1 habit you want to break.","Write down what sets it off: a time, place, feeling or person.","Choose a new routine for that moment that gives a similar reward."],"url":"/library/?idea=keep-the-cue-swap-the-routine#today"},
 {"area":"Mindset","src":"Meditations","slug":"spend-energy-on-what-you-control","keys":"worry anxious anxiety stress overthink control calm angry upset stoic peace","t":"Spend energy only on what you control","d":"Marcus Aurelius kept reminding himself that other people's actions are outside his control. His own choices and responses are not.","s":["Write down what is worrying you today.","Split it into 2 lists: what you control and what you don't.","Do 1 thing from the first list. Let the second list go for today."],"url":"/library/?idea=spend-energy-on-what-you-control#today"}]
areas=[(k,AREA_META[k][0],AREA_META[k][1],f"/library/{k}/","Open the "+k+" hub") for k in ("habits","focus","money","mindset")]
tiles="".join(f'''<a href="{u}" class="tile lift reveal" data-area="{k}">
<div class="art-box">{A.scene(k).replace('<svg class="art"','<svg class="art" width="150" height="150"')}</div>
<h3>{n}</h3><p style="font-size:15px;color:var(--soft)">{d}</p><span class="go">{g}</span></a>''' for k,n,d,u,g in areas)
home=head("The Useful Library: fix real problems with ideas from nonfiction books","Search by the problem you want to fix. Get the 1 idea from the best nonfiction books, which chapters to read, and a daily book guessing game.","/library/")+'</head>\n<body>\n'+nav("home")+f'''
<main id="main" class="wrap">
<section class="hero">
<div class="grow-main" style="display:flex;flex-direction:column;gap:20px">
<p class="mono rise">Nonfiction books, sorted by the problem they solve</p>
<h1 class="rise d1">What do you want to <em>fix</em> this week?</h1>
<form class="search rise d2" data-search role="search">
<label for="q" style="font-size:15px;color:var(--muted)">Describe it in your own words</label>
<div class="search-bar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="color:var(--ink)"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
<input id="q" type="text" autocomplete="off" placeholder="I keep procrastinating" data-examples="I keep procrastinating|I overspend every month|I can&#39;t stop overthinking|I lose focus after 10 minutes">
<button class="btn btn-green pill search-go" type="submit" aria-label="Find the idea"><span class="lbl">Find the idea</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
<button type="button" class="search-close" data-search-close>Cancel</button>
<div class="pills" data-pills aria-label="Popular problems"></div>
<div class="filters" data-filters hidden role="group" aria-label="Filter by area"><button type="button" aria-pressed="true" data-f="all">All</button><button type="button" aria-pressed="false" data-f="habits">Habits</button><button type="button" aria-pressed="false" data-f="focus">Focus</button><button type="button" aria-pressed="false" data-f="money">Money</button><button type="button" aria-pressed="false" data-f="mindset">Mindset</button></div>
<div class="suggest" hidden aria-live="polite"></div>

</form>
<script type="application/json" id="problems">{json.dumps(problems)}</script>
<script type="application/json" id="catalog">{json.dumps(catalog)}</script>
<script type="application/json" id="bookpages">{json.dumps([{"t":B["t"],"by":B["by"],"area":B["area"],"url":"/library/books/"+B["slug"]+"/","keys":" ".join(i[1] for i in B["ideas"])+" "+B["for"]} for B in BOOKPAGES]+[{"t":"Atomic Habits","by":"James Clear","area":"habits","url":"/library/books/atomic-habits/","keys":"habits 2 minute rule habit stacking identity never miss twice"}])}</script>
</div>
<div class="fan rise d3" data-covers aria-live="polite"><span class="hero-dog" data-tod-wrap>{"".join(f'<span class="tod" data-tod="{t}"{" hidden" if t!="day" else ""}>{A.hero(t)}</span>' for t in ("morning","day","evening","night"))}<span class="hero-bubble" data-tod-say>Hi. 1 idea today?</span></span><div class="float">
<img class="c1" src="{cov('atomic-habits')}" alt="Atomic Habits cover" width="150" height="228">
<img class="c2" src="{cov('the-psychology-of-money')}" alt="The Psychology of Money cover" width="150" height="228">
<img class="c3" src="{cov('mans-search-for-meaning')}" alt="Man&#39;s Search for Meaning cover" width="150" height="228">
</div></div>
</section>

<section class="firstvisit" data-firstvisit hidden><p class="mono">New here? The Library in 3 steps</p><ol><li><b>Type a problem</b> in your own words, like &quot;I overthink everything&quot;.</li><li><b>Get 3 fixes</b> from 3 nonfiction books, and pick the 1 that fits you.</li><li><b>Try it today</b>, then test it for 30 days and collect stamps.</li></ol><button type="button" class="linkish" data-firstvisit-x>Got it</button></section>
<section class="row">
<div class="flipcard" data-flip data-today id="today">
<div class="face card">
<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap" class="mono"><span>Today&#39;s idea · <span data-i-area>Habits</span></span><span data-i-src>Atomic Habits, ch. 13</span></div>
<h2 style="font-size:clamp(34px,4.5vw,46px)" data-i-t>The 2 minute rule</h2>
<p style="font-size:18px;color:var(--ink2);max-width:560px" data-i-d>Shrink any new habit to a version that takes 2 minutes. "Read 30 pages" becomes "read 1 page". Starting is the hard part, so make starting tiny.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-green" type="button" data-flip-btn>Show me how</button><a class="btn btn-line" href="/library/ideas/the-2-minute-rule/" data-i-url>Open the idea</a></div>
</div>
<div class="face dark" hidden>
<p class="mono" style="color:var(--brass)">Try it today · 3 steps</p>
<div class="steps3" data-i-steps><p><b>1.</b> Pick 1 habit you keep putting off.</p><p><b>2.</b> Cut it to its first 2 minutes. Running becomes putting on your shoes.</p><p><b>3.</b> Do only that today. Stop there, even if you want more.</p></div>
<div><button class="btn btn-line-light" type="button" data-flip-btn>Flip back</button></div>
</div>
<script type="application/json" id="ideas">{json.dumps(ideas_daily)}</script>
</div>
<a class="gametile lift" href="/library/game/">
<div style="display:flex;flex-direction:column;gap:8px"><p class="mono" style="color:#CFE3D7">Daily game</p><h2 style="font-size:36px">Mystery Book</h2><p style="color:#E3EEE7;font-size:16px">Guess today&#39;s book. Every wrong guess opens a new clue.</p></div>
<div style="display:flex;gap:6px" aria-hidden="true"><div class="sq pop d1" style="background:#B8913A"></div><div class="sq pop d2" style="background:#B8913A"></div><div class="sq pop d3" style="background:#4E8A6C"></div><div class="sq pop d4" style="background:#33463C"></div><div class="sq pop d5" style="background:#33463C"></div><div class="sq pop d5" style="background:#33463C"></div></div>
<span style="font-weight:800;font-size:17px">Play today&#39;s puzzle</span>
<span class="gt-art">{A.svg(A.dog(70,78,1,"o",A.BL,"right",'<circle cx="54" cy="-14" r="15" fill="#FBFBF8" fill-opacity=".7" stroke="#1C2B24" stroke-width="4"/><path d="M64 -3 L74 8" stroke="#1C2B24" stroke-width="6" stroke-linecap="round"/>'),"0 0 150 140","art")}</span>
</a>
</section>

<section style="display:flex;flex-direction:column;gap:20px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:8px"><h2>Start with what you want to change</h2><p style="font-size:15px;color:var(--muted)">4 areas to start. New books every week.</p></div>
<div class="grid">{tiles}</div>
</section>

<section class="dark row reveal" style="align-items:center;gap:32px;border-radius:28px;padding:40px">
{A.scene("read").replace('<svg class="art"','<svg class="art float" width="150" height="150"')}
<div class="grow-main" style="display:flex;flex-direction:column;gap:10px;flex-basis:420px">
<p class="mono" style="color:var(--brass)">Early-bird opens 1 Dec · $29 until 31 Dec, then $39</p>
<h2 style="font-size:clamp(30px,4vw,40px)">The Useful Reading Challenge 2027</h2>
<p style="color:#C6D1CA;max-width:560px">1 year of nonfiction, read to change something. Monthly prompts, a tracker, and a private Discord channel for the readers doing it with you.</p>
</div>
<a class="btn btn-brass" href="#signup" style="font-size:17px;padding:16px 26px">Get early access</a>
</section>
{LEAD.replace("CAMP","home")}
</main>
'''+FOOT
write(f'{R}/index.html',home)

# ---------------- GAME
game=head("Mystery Book: the daily nonfiction book guessing game","Guess today's nonfiction book from 6 clues. Every wrong guess opens the next clue. Share your grid. A new book every day.","/library/game/")+f'<script src="/library/game/game.js?v={ver("game/game.js")}" defer></script>\n</head>\n<body>\n'+nav("game")+f'''
<main id="main" class="wrap">
<section class="row" style="align-items:flex-start;gap:32px;padding-top:16px">
<div class="game grow-main" data-game>
<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">
<div style="display:flex;flex-direction:column;gap:4px"><p class="mono">Daily game · <span data-no>No. 1</span></p><h1 style="font-size:clamp(44px,6vw,56px)">Mystery Book</h1></div>
<div style="display:flex;gap:8px;align-items:center"><button type="button" class="sound-btn" data-sound aria-pressed="false" aria-label="Sound off. Turn sound on"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path class="s-on" d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/><path class="s-off" d="M17 9l5 6M22 9l-5 6"/></svg></button><p class="mono" data-counter style="background:var(--card);border-radius:999px;padding:10px 14px;box-shadow:0 1px 0 var(--line);color:var(--ink)">Clue 1/6</p></div>
</div>
<div class="clue-wrap"><div class="mcover" data-mcover hidden aria-hidden="true"><span class="mc-frame"><img alt="" width="96" height="146"></span><span class="mono">Clears with each clue</span></div><div data-clues style="display:flex;flex-direction:column;gap:8px;flex:1 1 0;min-width:0" aria-live="polite"></div></div>
<div data-play class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px">
<label for="guess" style="font-weight:700">Your guess</label>
<input id="guess" type="text" data-guess placeholder="Start typing a book title" autocomplete="off">
<div class="opts" data-opts></div>
<p data-note hidden style="font-size:15px;color:#7A5A12" aria-live="polite"></p>
</div>
<div data-done hidden style="display:flex;flex-direction:column;gap:14px">
<div class="dark result" data-r-card><span class="r-dog" data-r-dog="win" hidden>{A.react(True)}</span><span class="r-dog sulk" data-r-dog="lose" hidden>{A.react(False)}</span><div data-r-cover></div>
<div style="flex:1 1 240px;display:flex;flex-direction:column;gap:10px"><p class="mono" data-r-label style="color:var(--brass)"></p><h2 data-r-title style="font-size:34px"></h2><p data-r-by style="color:#C6D1CA;font-size:15px"></p><div class="grid6" data-r-grid aria-hidden="true"></div></div></div>
<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-green" type="button" data-share style="flex:1 1 200px">Share my grid</button><a class="btn btn-brass" data-buy data-r-buy href="#" rel="noopener" target="_blank">Get this book</a><a class="btn btn-line" href="#signup">Get a new book idea 3 times a week</a></div>
<div class="card" style="display:flex;flex-direction:column;gap:8px"><p class="mono">1 idea to take from it</p><p data-r-idea style="font-family:var(--serif);font-size:26px;line-height:1.2"></p><a data-r-link hidden href="#" style="font-weight:700">Open this idea</a></div>
<div class="card stats-card"><div class="stats" data-stats></div><p class="mono" style="margin-top:12px" data-next-line>Next book in <span data-countdown class="countdown">--:--:--</span></p><button type="button" class="btn btn-brass ready-btn" data-ready hidden>Today&#39;s new book is ready</button></div>
<div class="card teaser" data-teaser hidden><div class="teaser-cover" data-teaser-cover></div><div style="display:flex;flex-direction:column;gap:6px"><p class="mono">Tomorrow&#39;s book</p><p class="serif" style="font-size:24px;line-height:1.15" data-teaser-t>Can you guess it from the cover?</p><p style="font-size:15px;color:var(--soft)" data-freeze-line></p></div></div>
</div>
</div>
<aside class="grow-side" style="display:flex;flex-direction:column;gap:16px">
<div class="card" style="padding:22px;display:flex;flex-direction:column;gap:10px"><p class="mono">How it works</p><p style="font-size:15px">1 nonfiction book a day. You start with 1 clue. Every wrong guess opens the next. Solve it in as few clues as you can, then share your grid.</p>
<p style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted)"><span class="sq" style="width:16px;height:16px;border-radius:4px;background:#B8913A"></span>wrong guess<span class="sq" style="width:16px;height:16px;border-radius:4px;background:#4E8A6C;margin-left:10px"></span>solved</p></div>
<div class="dark" style="padding:22px;display:flex;align-items:center;gap:16px"><svg width="72" height="72" viewBox="0 0 160 160" aria-hidden="true">{A.stamp("streak-3")}</svg><div><p class="mono">Your streak</p><p class="serif" style="font-size:30px" data-streak>0 days</p></div></div>
<a class="card lift" href="/library/" style="padding:22px;text-decoration:none;color:var(--ink);display:flex;flex-direction:column;gap:6px"><p class="mono" style="color:var(--green)">The Useful Library</p><p class="serif" style="font-size:24px">Fix a real problem with a real book</p></a>
</aside>
</section>
{next3("game","habits","/library/game/")}
{SIGNUP.replace("CAMP","game")}
</main>
'''+FOOT
write(f'{R}/game/index.html',game)
print("home, game ok")

# ---------------- BOOK: Atomic Habits
R_,S_,X_='READ','SKIM','SKIP'
ch=[[R_,'The Surprising Power of Atomic Habits','The 1% better math, and why results lag behind effort. Sets up everything.'],
[R_,'How Your Habits Shape Your Identity (and Vice Versa)','The best idea in the book: change who you are, and habits follow.'],
[R_,'How to Build Better Habits in 4 Simple Steps','Cue, craving, response, reward. Every later chapter hangs on this.'],
[S_,"The Man Who Didn't Look Right",'A story about noticing cues. 1 point, many pages.'],
[R_,'The Best Way to Start a New Habit','Implementation intentions and habit stacking. The most usable chapter.'],
[S_,'Motivation Is Overrated; Environment Often Matters More','Change your space, not your willpower. The first half carries it.'],
[S_,'The Secret to Self-Control','Short point: remove the cue. The headings give you most of it.'],
[S_,'How to Make a Habit Irresistible','Temptation bundling is the takeaway. Skim for it.'],
[X_,'The Role of Family and Friends in Shaping Your Habits','Join groups where your habit is normal. You likely know this already.'],
[S_,'How to Find and Fix the Causes of Your Bad Habits','Reframing is useful. The examples run long.'],
[S_,'Walk Slowly, but Never Backward','Motion vs action. 1 strong idea, then repetition.'],
[S_,'The Law of Least Effort','Reduce friction. Chapter 13 makes the same point better.'],
[R_,'How to Stop Procrastinating by Using the Two-Minute Rule','The 2 minute rule. Read this one even if you read nothing else.'],
[S_,'How to Make Good Habits Inevitable and Bad Habits Impossible','Commitment devices. Skim the examples.'],
[S_,'The Cardinal Rule of Behavior Change','What is rewarded is repeated. Short and clear.'],
[R_,'How to Stick with Good Habits Every Day','Habit tracking and never missing twice. Keeps the system going.'],
[X_,'How an Accountability Partner Can Change Everything','Habit contracts. Useful for few readers.'],
[X_,"The Truth About Talent (When Genes Matter and When They Don't)","Interesting, but it won't change what you do tomorrow."],
[S_,'The Goldilocks Rule: How to Stay Motivated in Life and Work','Work at the edge of your ability. Skim for the rule.'],
[X_,'The Downside of Creating Good Habits',"A caveat chapter. Skip unless you're already deep in."]]
cells="".join(f'<button type="button" class="cell v-{c[0].lower()}" data-n="{i+1}" aria-pressed="{"true" if i==12 else "false"}" aria-label="Chapter {i+1}: {html.escape(c[1])}, {c[0].lower()}">{i+1}</button>' for i,c in enumerate(ch))
reads=", ".join(str(i+1) for i,c in enumerate(ch) if c[0]==R_)
ideas=[("Ch. 13","The 2 minute rule","Shrink a new habit until it takes 2 minutes.","/library/ideas/the-2-minute-rule/"),
       ("Ch. 5","Habit stacking","After [a habit you already do], I will [the new habit].",None),
       ("Ch. 2","Identity-based habits","Decide who you want to be, then prove it with small wins.",None),
       ("Ch. 16","Never miss twice","Missing once is an accident. Missing twice is the start of a new habit.",None)]
icards="".join((f'<a href="{u}" class="card lift reveal" style="text-decoration:none;color:var(--ink);display:flex;flex-direction:column;gap:10px;padding:24px">' if u else '<div class="card reveal" style="display:flex;flex-direction:column;gap:10px;padding:24px">')+f'<p class="mono">{c}</p><h3>{t}</h3><p style="font-size:15px;color:var(--soft)">{d}</p>'+(f'<span class="go" style="font-weight:700;font-size:14px;color:var(--green)">Open idea</span></a>' if u else '<span style="font-size:14px;color:var(--muted)">Full idea page soon</span></div>') for c,t,d,u in ideas)
bookld=[{"@type":"Book","name":"Atomic Habits","author":{"@type":"Person","name":"James Clear"},"datePublished":"2018","image":BASE+cov('atomic-habits')},
        {"@type":"Review","itemReviewed":{"@type":"Book","name":"Atomic Habits","author":{"@type":"Person","name":"James Clear"}},"author":{"@type":"Organization","name":"The Useful Library"},"reviewBody":f"Worth it, but not cover to cover. Read chapters {reads}; skim or skip the rest."},
        {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a.format(reads=reads)}} for q,a in BQ]}]
bc_h,bc_ld=crumbs([("Books","/library/books/"),("Atomic Habits",None)])
book=head("Atomic Habits: which chapters to read (and which to skip)",f"Atomic Habits by James Clear, chapter by chapter: read {len([c for c in ch if c[0]==R_])} of 20 chapters ({reads}), skim or skip the rest, and why. Plus the 4 ideas worth using.","/library/books/atomic-habits/",bookld+[bc_ld])+'</head>\n<body data-area="habits">\n'+nav("book")+f'''
<main id="main" class="wrap">
{bc_h}
<section class="book-hero" style="--cover:url({cov('atomic-habits')})">
<div class="bh-cover"><img class="rise" src="{cov('atomic-habits')}" alt="Atomic Habits cover" width="300" height="455" fetchpriority="high"></div>
<div class="bh-text">
<p class="mono rise">Book · Habits and discipline · 2018</p>
<h1 class="rise d1">Atomic Habits</h1>
<p class="rise d1" style="font-size:18px;color:var(--soft)">James Clear · 20 chapters</p>
<div class="rise d1">{byline()}</div>
<div class="card rise d2 row" style="padding:22px 24px;align-items:center;gap:20px">
<span class="stamp-box stamp d4">READ 6 OF 20</span>
<p style="flex:1 1 280px;font-size:17px"><b>The Useful verdict:</b> <span class="hl">worth it, but not cover to cover.</span> 6 chapters carry the whole system. The rest repeats it with stories.</p></div>
<div class="rise d3" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-green" href="https://jamesclear.com/atomic-habits" rel="noopener" data-buy="Atomic Habits James Clear">Get the book</a><button type="button" class="btn btn-line" data-shelf="atomic-habits">Add to my shelf</button></div>
</div>
</section>

{toc([("verdicts","Which chapters"),("ideas","4 ideas"),("faq","Quick answers")])}
<section class="card reveal" id="verdicts" style="display:flex;flex-direction:column;gap:18px;border-radius:28px;padding:34px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><h2>Read only these chapters</h2>
<div class="legend"><span><i style="background:var(--green)"></i>Read</span><span><i style="background:var(--brass)"></i>Skim</span><span><i style="background:var(--line2)"></i>Skip</span></div></div>
<p style="font-size:15px;color:var(--muted)">Tap any chapter. Read {reads}.</p>
<div class="cells">{cells}</div>
<div class="chap-panel" data-chap-panel aria-live="polite"><span class="verdict" data-v style="background:var(--green);color:#fff">READ</span>
<div style="flex:1 1 380px;display:flex;flex-direction:column;gap:6px"><p class="serif" data-t style="font-size:26px;line-height:1.15">Chapter 13: {ch[12][1]}</p><p data-w style="color:var(--ink2)">{ch[12][2]}</p></div></div>
<script type="application/json" id="chapters">{json.dumps(ch)}</script>
</section>

<a class="plug lift reveal" href="https://theusefultech.gumroad.com/l/read-to-transform?utm_source=theusefulmedia.com&utm_medium=library&utm_campaign=book-atomic-habits" rel="noopener"><span class="plug-art">{A.scene("read").replace('<svg class="art"','<svg class="art" width="96" height="96"')}</span><span style="display:flex;flex-direction:column;gap:4px;flex:1 1 240px"><span class="mono">From The Useful Life</span><span class="serif" style="font-size:24px;line-height:1.15">Read to Transform</span><span style="font-size:15px;color:var(--soft)">Pick 1 book, turn 1 idea into a 30-day pact, and change 1 real habit. A journal built for exactly what this page is about.</span></span><span class="go" style="font-weight:800;color:var(--green)">See the journal</span></a>
{faq([(q,a.format(reads=reads)) for q,a in BQ])}
<section id="ideas" style="display:flex;flex-direction:column;gap:18px"><h2>4 ideas from this book</h2><div class="grid">{icards}</div></section>

<section class="row">
<div class="card lift grow-main reveal" style="display:flex;flex-direction:column;gap:10px"><p class="mono">Where books disagree</p><p class="serif" style="font-size:26px;line-height:1.2">Atomic Habits says shrink a new habit to 2 minutes. Getting Things Done says do any task under 2 minutes right now. Same name, different rule.</p><a class="more" href="/library/ideas/the-2-minute-rule/">Compare them</a></div>
<a class="gametile lift grow-side" href="/library/game/"><div style="display:flex;flex-direction:column;gap:8px"><p class="mono" style="color:#CFE3D7">Daily game</p><h2 style="font-size:32px">Guess today&#39;s book</h2></div><span style="font-weight:800">Play</span></a>
</section>
{next3("book","habits","/library/books/atomic-habits/")}
{SIGNUP.replace("CAMP","book")}
</main>
'''+FOOT
BOOKPAGES.insert(0,{"slug":"atomic-habits","t":"Atomic Habits","by":"James Clear","year":2018,"area":"habits","unit":"Chapter",
  "verdict":"Worth it, but not cover to cover. 6 chapters carry the whole system; the rest repeats it with stories.",
  "units":[(c[0],f"{i+1}. {c[1]}",c[2]) for i,c in enumerate(ch)],
  "ideas":[(c,t,d) for c,t,d,u in ideas],
  "for":"You want to build or break a habit and keep quitting after a week.",
  "skip":"You already track your habits daily and they stick. Read chapter 13 and move on.",
  "note":("Where books disagree","Atomic Habits says shrink a new habit to 2 minutes. Getting Things Done says do any task under 2 minutes right now. Same name, different rule.","/library/ideas/the-2-minute-rule/","Compare them")})

# ---------------- IDEA: The 2 minute rule
days="".join(f'<button type="button" class="day" data-day="{i}" aria-pressed="false" aria-label="Day {i}">{i}</button>' for i in range(1,31))
check='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>'
steps=["Pick 1 habit you keep putting off.","Cut it to its first 2 minutes. Running becomes putting on your shoes.","Do only that today, then stop."]
stepsH="".join(f'<button type="button" class="check" aria-pressed="false"><span class="box">{check}</span><span class="t">{s}</span></button>' for s in steps)
ideald=[{"@type":"HowTo","name":"How to use the 2 minute rule","step":[{"@type":"HowToStep","text":s} for s in steps]},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in IQ]}]
ic_h,ic_ld=crumbs([("Ideas","/library/ideas/"),("The 2 minute rule",None)])
idea=head("The 2 minute rule: Atomic Habits vs Getting Things Done","There are 2 different 2 minute rules. James Clear's shrinks a new habit to 2 minutes. David Allen's says do any task under 2 minutes now. What each fixes, and how to try it today.","/library/ideas/the-2-minute-rule/",ideald+[ic_ld])+'</head>\n<body data-area="habits">\n'+nav("idea")+f'''
<main id="main" class="wrap">
{ic_h}
<section class="row" style="align-items:flex-start;gap:32px;padding-top:12px">
<div class="grow-main" style="display:flex;flex-direction:column;gap:16px">
<div class="rise" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">IDEA No. 0001</span><span class="tag green">HABITS · FOCUS</span><span class="tag brass">2 BOOKS · THEY DISAGREE</span></div>
<h1 class="rise d1">The 2 minute rule</h1>
<p class="lede rise d2">Same name, 2 different rules. Both work. <span class="hl">They fix different problems.</span></p>
<div class="rise d2">{byline()}</div>
</div>
{A.scene("habits").replace('<svg class="art"','<svg class="art rise d3 idea-plate" width="190" height="190"')}
</section>

<section class="card reveal" style="display:flex;flex-direction:column;gap:22px;border-radius:28px">
<div class="seg" data-seg data-side="0" role="tablist" aria-label="Which book">
<span class="knob" aria-hidden="true"></span>
<button type="button" role="tab" id="t-clear" aria-controls="p-clear" aria-selected="true">Atomic Habits</button>
<button type="button" role="tab" id="t-allen" aria-controls="p-allen" aria-selected="false">Getting Things Done</button>
</div>
<div id="p-clear" role="tabpanel" aria-labelledby="t-clear" class="row" style="gap:28px;align-items:flex-start">
<img src="{cov('atomic-habits')}" alt="Atomic Habits cover" width="110" height="166" style="width:110px;height:166px;object-fit:cover;border-radius:4px 10px 10px 4px;box-shadow:0 16px 30px -14px rgba(28,43,36,.5)">
<div class="grow-main" style="display:flex;flex-direction:column;gap:10px;flex-basis:420px"><h3 style="font-size:32px">Shrink the habit</h3><p style="font-size:18px;color:var(--ink2)">When you start a new habit, it should take less than 2 minutes. "Do 30 minutes of yoga" becomes "take out my yoga mat". Master showing up first. Grow it later.</p><p style="font-size:15px;color:var(--muted)">James Clear · <a href="/library/books/atomic-habits/">chapter 13 is the 1 to read</a></p><p style="font-weight:700;color:var(--green)"><span class="hl">Fixes: habits you never start.</span></p></div>
</div>
<div id="p-allen" role="tabpanel" aria-labelledby="t-allen" class="row" style="gap:28px;align-items:flex-start" hidden>
<div style="width:110px;height:166px;border-radius:4px 10px 10px 4px;background:var(--line2);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:14px;color:var(--muted)">GTD</div>
<div class="grow-main" style="display:flex;flex-direction:column;gap:10px;flex-basis:420px"><h3 style="font-size:32px">Just do it now</h3><p style="font-size:18px;color:var(--ink2)">If a task takes less than 2 minutes, do it the moment you notice it. Writing it down and tracking it would take longer than doing it.</p><p style="font-size:15px;color:var(--muted)">David Allen, Getting Things Done</p><p style="font-weight:700;color:var(--green)"><span class="hl">Fixes: small tasks that pile up.</span></p></div>
</div>
</section>

<section class="row">
<div class="card grow-main" style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<p class="mono">Try it today · tap each step when done</p>
<div data-checklist="2-minute-rule" style="display:flex;flex-direction:column;gap:10px">{stepsH}</div>
<p data-alldone hidden class="dark" style="padding:16px 18px;border-radius:16px">Done for today. That counts. Tomorrow, do the same 2 minutes again.</p>
</div>
<div class="dark grow-side" data-observe style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<p class="mono">Reader results</p>
<p class="serif" style="font-size:30px;line-height:1.15">Testing opens with the first readers.</p>
<p style="color:#C6D1CA;font-size:15px">Start your 30-day test below. On day 30 you tell us if you kept it, and this panel shows how many readers did.</p>
<div class="bars" aria-hidden="true" style="opacity:.35"><div style="height:100%"></div><div style="height:88%"></div><div style="height:79%"></div><div style="height:72%"></div><div style="height:68%"></div><div style="height:65%"></div><div style="height:63%"></div></div>
</div>
</section>

<section class="card reveal" data-test="2-minute-rule" style="display:flex;flex-direction:column;gap:18px;border-radius:28px">
<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
<div style="display:flex;flex-direction:column;gap:6px"><h2 style="font-size:38px">Test it for 30 days</h2><p style="color:var(--soft)">Tap each day you did your 2 minutes. Saved on this device.</p></div>
<button type="button" class="btn btn-green" data-start style="font-size:17px">Start my 30-day test</button>
<span class="stamp-box" data-started hidden style="border-color:var(--brass);color:#8A6A1E">DAY 1</span>
</div>
<div class="days">{days}</div>
<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line2);padding-top:18px">
<p style="font-weight:700">Day 30: did you keep it?</p>
<div data-vote-btns style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-green" data-vote="kept">I kept it</button><button type="button" class="btn btn-line" data-vote="dropped">I dropped it</button></div>
<div data-voted hidden style="display:flex;gap:12px;align-items:center"><svg class="stamp" width="64" height="64" viewBox="0 0 160 160" aria-hidden="true">{A.stamp("kept")}</svg><p data-msg></p></div>
</div>
</section>

<a class="plug lift reveal" href="https://theusefultech.gumroad.com/l/read-to-transform?utm_source=theusefulmedia.com&utm_medium=library&utm_campaign=idea-2-minute-rule" rel="noopener"><span class="plug-art">{A.scene("read").replace('<svg class="art"','<svg class="art" width="96" height="96"')}</span><span style="display:flex;flex-direction:column;gap:4px;flex:1 1 240px"><span class="mono">From The Useful Life</span><span class="serif" style="font-size:24px;line-height:1.15">Read to Transform</span><span style="font-size:15px;color:var(--soft)">Your 30-day test, on paper. Pick the idea, write the pact, and track the 30 days in a journal made for it.</span></span><span class="go" style="font-weight:800;color:var(--green)">See the journal</span></a>
{faq(IQ)}
<section style="display:flex;flex-direction:column;gap:16px"><h2 style="font-size:36px">Pairs well with</h2><div class="grid">
<a href="/library/books/atomic-habits/" class="card lift" style="text-decoration:none;color:var(--ink);display:flex;flex-direction:column;gap:8px;padding:22px"><p class="mono">Atomic Habits · ch. 5</p><h3>Habit stacking</h3><p style="font-size:15px;color:var(--soft)">Attach your 2 minutes to something you already do.</p></a>
<a href="/library/books/atomic-habits/" class="card lift" style="text-decoration:none;color:var(--ink);display:flex;flex-direction:column;gap:8px;padding:22px"><p class="mono">Atomic Habits · ch. 16</p><h3>Never miss twice</h3><p style="font-size:15px;color:var(--soft)">The rule that keeps a 30-day test alive.</p></a>
<a href="/library/game/" class="gametile lift" style="padding:22px"><p class="mono" style="color:#CFE3D7">Daily game</p><h3>Guess today&#39;s book</h3><p style="font-size:15px;color:#E3EEE7">6 clues. 1 book. Share your grid.</p></a>
</div></section>
{next3("idea","habits","/library/ideas/the-2-minute-rule/")}
{SIGNUP.replace("CAMP","idea")}
</main>
'''+FOOT
write(f'{R}/ideas/the-2-minute-rule/index.html',idea)
print("book, idea ok")

# ---------------- OFFLINE page (not indexed)
off=head("You're offline: The Useful Library","You're offline.","/library/offline/").replace('<meta name="description"','<meta name="robots" content="noindex">\n<meta name="description"')+'</head>\n<body>\n'+nav("home")+f'''
<main id="main" class="wrap"><section class="card" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;margin-top:20px">
{A.scene("sleep").replace('<svg class="art"','<svg class="art" width="160" height="160"')}<p class="mono">No connection</p><h1 style="font-size:44px">You're offline</h1><p class="lede">Pages you opened before still work. Today's game needs a connection to load.</p>
<a class="btn btn-green" href="/library/">Try again</a></section></main>
'''+FOOT
write(f'{R}/offline/index.html',off)
print("offline ok")

# ---------------- LOST (404 for /library/, not indexed)
lostp=head("Dog-Ear lost this page: The Useful Library","This page doesn't exist.","/library/lost/").replace('<meta name="description"','<meta name="robots" content="noindex">\n<meta name="description"')+'</head>\n<body>\n'+nav("home")+f'''
<main id="main" class="wrap"><section class="card" style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:44px 24px;border-radius:28px;margin-top:16px">
<span class="lost-art">{A.lost().replace('<svg class="art"','<svg class="art" width="200" height="200"')}</span>
<p class="mono">Error 404</p><h1 style="font-size:clamp(38px,6vw,56px)">Dog-Ear lost this page</h1>
<p class="lede" style="max-width:520px">It was here a minute ago. Probably. Try 1 of these instead, or tell the Library what you were looking for.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-green" href="/library/#q">Search the Library</a><a class="btn btn-line" href="/library/game/">Play today&#39;s game</a><a class="btn btn-line" href="/library/">Home</a></div>
</section></main>
'''+FOOT
write(f'{R}/lost/index.html',lostp)
print("lost ok")

# ---------------- SHELF (personal, not indexed)
shelf=head("My shelf: The Useful Library","Your stamps, streak, saved books and 30-day tests.","/library/shelf/").replace('<meta name="description"','<meta name="robots" content="noindex">\n<meta name="description"')+'</head>\n<body>\n'+nav("shelf")+f'''
<main id="main" class="wrap" data-shelf-page>
<section style="display:flex;flex-direction:column;gap:10px;padding-top:8px">
<p class="mono rise" data-sync-line>Saved on this device. Save it to your email to keep it everywhere.</p>
<h1 class="rise d1">My shelf</h1>
</section>
<section class="row">
<div class="dark grow-main" style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<p class="mono">Mystery Book</p>
<div class="stat-row" data-sh-stats></div>
<div class="dist" data-sh-dist aria-label="Solves by number of clues"></div>
<a class="btn btn-brass" href="/library/game/" style="align-self:flex-start">Play today&#39;s book</a>
</div>
<div class="card grow-side" style="display:flex;flex-direction:column;gap:12px;border-radius:28px"><p class="mono">Stay in the loop</p>{STAY_BLOCK}</div>
</section>
<section style="display:flex;flex-direction:column;gap:16px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:8px"><h2>Stamps</h2><p class="mono" data-sh-count></p></div>
<div class="stamps" data-sh-stamps></div>
</section>
<section class="row">
<div class="card grow-main" style="display:flex;flex-direction:column;gap:12px;border-radius:28px"><h2 style="font-size:32px">30-day tests</h2><div data-sh-tests style="display:flex;flex-direction:column;gap:10px"></div></div>
<div class="card grow-side" style="display:flex;flex-direction:column;gap:12px;border-radius:28px"><h2 style="font-size:32px">Saved books</h2><div data-sh-books style="display:flex;flex-direction:column;gap:10px"></div></div>
</section>
<script type="application/json" id="sh-meta">{json.dumps({"tests":dict({"2-minute-rule":{"t":"The 2 minute rule","url":"/library/ideas/the-2-minute-rule/"}},**{"p-"+p["slug"]:{"t":p["problem"],"url":"/library/problems/"+p["slug"]+"/"} for p in PROBLEMS}),"books":dict({"atomic-habits":{"t":"Atomic Habits","url":"/library/books/atomic-habits/","cover":cov("atomic-habits")}},**{B["slug"]:{"t":B["t"],"url":"/library/books/"+B["slug"]+"/","cover":cov(B["slug"])} for B in BOOKPAGES})})}</script>
</main>
'''+FOOT
write(f'{R}/shelf/index.html',shelf)
print("shelf ok")


# ---------------- PROBLEM PAGES: 1 problem, 3 fixes from 3 books
def problem_page(P):
    path=f"/library/problems/{P['slug']}/"
    fixes=P["fixes"]
    ld=[{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in P["faq"]]},
        {"@type":"ItemList","name":P["title"],"itemListElement":[{"@type":"ListItem","position":i+1,"item":{"@type":"Book","name":f["book"],"author":{"@type":"Person","name":f["by"]},"image":BASE+cov(f["cover"])}} for i,f in enumerate(fixes)]}]
    picks="".join(f'<button type="button" class="pick-btn" data-pick="{i}"><span class="pick-n">{i+1}</span>{html.escape(f["pick"])}</button>' for i,f in enumerate(fixes))
    cards=""
    for i,f in enumerate(fixes):
        cards+=f'''<article class="fix card reveal" id="fix-{i+1}" data-fix="{i}">
<div class="fix-cover"><img src="{cov(f["cover"])}" alt="{html.escape(f["book"])} cover" width="120" height="182" loading="lazy"></div>
<div class="fix-body">
<p class="mono">Fix {i+1} · {html.escape(f["book"])} · {html.escape(f["by"])}</p>
<h2 class="fix-t">{html.escape(f["idea"])}</h2>
<p class="fix-what">{html.escape(f["what"])}</p>
<p class="mono fix-where">{html.escape(f["where"])}</p>
<div class="fix-try"><p class="mono">Try it today</p><p>{html.escape(f["try"])}</p></div>
<p class="fix-fits"><b>Best if:</b> {html.escape(f["fits"])}</p>
<span style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-green" href="/library/books/{f["cover"]}/">Which chapters to read</a><a class="btn btn-line" href="#" data-buy="{html.escape(f["book"]+" "+f["by"].split(" and ")[0])}">Get the book</a></span>
</div></article>'''
    checks="".join(f'<button type="button" class="check" aria-pressed="false"><span class="box">{check}</span><span class="t"><b>{html.escape(f["book"])}:</b> {html.escape(f["try"])}</span></button>' for f in fixes)
    days30="".join(f'<button type="button" class="day" data-day="{i}" aria-pressed="false" aria-label="Day {i}">{i}</button>' for i in range(1,31))
    short=P["short"]; first,rest=short.split(". ",1)
    ch_h,ch_ld=crumbs([("Problems","/library/problems/"),(P["problem"],None)])
    page=head(P["title"]+": The Useful Library",P["desc"],path,ld+[ch_ld])+f'</head>\n<body data-area="{P["area"]}">\n'+nav("problems")+f'''
<main id="main" class="wrap">
{ch_h}
<section class="row" style="align-items:flex-start;gap:32px;padding-top:12px">
<div class="grow-main" style="display:flex;flex-direction:column;gap:16px">
<div class="rise" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">PROBLEM</span><span class="tag green">{P["area"].upper()}</span><span class="tag brass">3 BOOKS · 3 FIXES</span></div>
<h1 class="rise d1">{html.escape(P["problem"])}</h1>
<p class="lede rise d2"><span class="hl">{html.escape(first)}.</span> {html.escape(rest)}</p>
<div class="rise d2">{byline()}</div>
{toc([("pick","Find your fix"),("fixes","3 fixes"),("test","30-day test"),("faq","Quick answers")])}
</div>
{A.scene(P["area"]).replace('<svg class="art"','<svg class="art rise d3 idea-plate" width="190" height="190"')}
</section>
<section class="picker card reveal" id="pick" data-picker="{P["slug"]}"><p class="mono">Find your fix in 1 tap</p><h2 style="font-size:30px">{html.escape(P["picker"])}</h2><div class="pick-row">{picks}</div></section>
<section class="fixes" id="fixes">{cards}</section>
<section class="row">
<div class="card grow-main" style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<p class="mono">Try 1 today · tap it when done</p>
<div data-checklist="p-{P["slug"]}" style="display:flex;flex-direction:column;gap:10px">{checks}</div>
<p data-alldone hidden class="dark" style="padding:16px 18px;border-radius:16px">All 3 done. Now keep the 1 that worked best for 30 days.</p>
</div>
<div class="dark grow-side" data-observe style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<p class="mono">Reader results</p>
<p class="serif" style="font-size:30px;line-height:1.15">Testing opens with the first readers.</p>
<p style="color:#C6D1CA;font-size:15px">Start your 30-day test below. On day 30 you tell us if it worked, and this panel shows which fix readers kept.</p>
</div>
</section>
<section class="card reveal" id="test" data-test="p-{P["slug"]}" style="display:flex;flex-direction:column;gap:18px;border-radius:28px">
<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
<div style="display:flex;flex-direction:column;gap:6px"><h2 style="font-size:38px">Test your fix for 30 days</h2><p style="color:var(--soft)">Pick 1 fix. Tap each day you did it. Saved on this device.</p></div>
<button type="button" class="btn btn-green" data-start style="font-size:17px">Start my 30-day test</button>
<span class="stamp-box" data-started hidden style="border-color:var(--brass);color:#8A6A1E">DAY 1</span>
</div>
<div class="days">{days30}</div>
<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line2);padding-top:18px">
<p style="font-weight:700">Day 30: did it work?</p>
<div data-vote-btns style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-green" data-vote="kept">It worked</button><button type="button" class="btn btn-line" data-vote="dropped">It didn't</button></div>
<div data-voted hidden style="display:flex;gap:12px;align-items:center"><svg class="stamp" width="64" height="64" viewBox="0 0 160 160" aria-hidden="true">{A.stamp("kept")}</svg><p data-msg></p></div>
</div>
</section>
{plug("problem-"+P["slug"],"Pick the fix that fits, turn it into a 30-day pact, and track it on paper. A journal made for exactly this.")}
{faq(P["faq"])}
{next3("problem",P["area"],path)}
{SIGNUP.replace("CAMP","problem-"+P["slug"])}
</main>
'''+FOOT
    write(f'{R}/problems/{P["slug"]}/index.html',page)

for P in PROBLEMS: problem_page(P)

# ---------------- PROBLEMS HUB
covered={P["problem"]:P for P in PROBLEMS}
hub_cards="".join(f'''<a class="card lift reveal pcard" href="/library/problems/{P["slug"]}/"><span class="pcard-covers">{"".join(f'<img src="{cov(f["cover"])}" alt="" width="54" height="82" loading="lazy">' for f in P["fixes"])}</span><span class="mono">{P["area"].upper()} · 3 fixes</span><h3>{html.escape(P["problem"])}</h3><span class="go">See the 3 fixes</span></a>''' for P in PROBLEMS)
other=[p for p in problems if p["text"] not in covered]
others="".join(f'<a class="sh-row" href="{p.get("url") or "/library/#signup"}"><b>{html.escape(p["text"])}</b><span class="mono">{"OPEN" if p.get("url") else "SOON"}</span></a>' for p in other)
ph_h,ph_ld=crumbs([("Problems",None)])
hub=head("Problems: 3 fixes from 3 nonfiction books | The Useful Library","Pick a problem you want to fix. Each page gives you 3 fixes from 3 nonfiction books and 1 thing to try today.","/library/problems/",[{"@type":"ItemList","itemListElement":[{"@type":"ListItem","position":i+1,"url":BASE+"/library/problems/"+P["slug"]+"/","name":P["problem"]} for i,P in enumerate(PROBLEMS)]},ph_ld])+'</head>\n<body>\n'+nav("problems")+f'''
<main id="main" class="wrap">
{ph_h}
<section style="display:flex;flex-direction:column;gap:12px;padding-top:12px"><p class="mono rise">Problems</p><h1 class="rise d1">Pick what you want to fix</h1><p class="lede rise d2">Each page gives you 3 fixes from 3 nonfiction books, which version of the problem each fits, and 1 thing to try today.</p><div class="rise d2">{byline()}</div></section>
<section class="grid">{hub_cards}</section>
<section class="card reveal" style="display:flex;flex-direction:column;gap:10px;border-radius:28px"><h2 style="font-size:30px">More problems</h2><p style="color:var(--soft)">New problem pages go up every week. Search any problem in your own words on the <a href="/library/#q">home page</a>.</p>{others}</section>
{SIGNUP.replace("CAMP","problems")}
</main>
'''+FOOT
write(f'{R}/problems/index.html',hub)

# ---------------- ABOUT: Raja and how the Library works
ab_h,ab_ld=crumbs([("About",None)])
about=head("About The Useful Library and Raja","Who writes The Useful Library, how chapter verdicts and fixes are chosen, and how the site makes money.","/library/about/",[{"@type":"AboutPage","mainEntity":{"@id":BASE+"/library/about/#raja"}},ab_ld])+'</head>\n<body>\n'+nav("about")+f'''
<main id="main" class="wrap">
{ab_h}
<section class="row" style="align-items:center;gap:36px;padding-top:12px">
<div class="grow-main" style="display:flex;flex-direction:column;gap:16px">
<p class="mono rise">About</p>
<h1 class="rise d1">Hi, I&#39;m Raja.</h1>
<p class="lede rise d2">I read 70+ nonfiction books a year, and I run The Useful Library to answer 1 question about each of them: <span class="hl">what can you actually use from it this week?</span></p>
<p class="rise d2" style="color:var(--soft);max-width:640px">Most books are 1 good idea wearing a 300-page trenchcoat. The Library finds that idea, tells you which chapters carry it, and gives you 1 step to try today. I write from Chennai, India, under The Useful Life, part of The Useful Media Co.</p>
<div class="rise d3" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-green" href="/library/#signup">Get the free lessons</a><a class="btn btn-line" href="https://www.instagram.com/theuseful_life_/" rel="noopener">Instagram</a><a class="btn btn-line" href="/about/">More about me</a></div>
</div>
<span class="about-art rise d3">{A.scene("read").replace('<svg class="art"','<svg class="art float" width="220" height="220"')}</span>
</section>
<section class="grid about-stats">
<div class="card stat-card"><b class="serif">70+</b><span>nonfiction books I read every year</span></div>
<div class="card stat-card"><b class="serif">2016</b><span>the year I started writing online</span></div>
<div class="card stat-card"><b class="serif">78K+</b><span>readers following my writing on Medium</span></div>
</section>
<section class="card reveal" style="display:flex;flex-direction:column;gap:14px;border-radius:28px">
<h2 style="font-size:34px">How the Library works</h2>
<div class="how"><div><p class="mono">Chapter verdicts</p><p>Every chapter gets <b>Read</b>, <b>Skim</b> or <b>Skip</b>. Read means the chapter carries an idea you can use. Skim means 1 rule hides in a lot of stories. Skip means it won&#39;t change what you do tomorrow.</p></div>
<div><p class="mono">3 fixes from 3 books</p><p>Problem pages pick the 3 books that fix the problem in different ways, so you can choose the 1 that fits your version of it.</p></div>
<div><p class="mono">30-day tests</p><p>You can test any idea for 30 days and tell us if you kept it. Reader results appear once enough readers finish. Nothing on this site shows made-up numbers.</p></div>
<div><p class="mono">How it makes money</p><p>Some book links are Amazon affiliate links, and I sell a few reading tools like the Read to Transform journal. No publisher or author pays for a verdict.</p></div></div>
</section>
<section class="card reveal" style="display:flex;flex-direction:column;gap:10px;border-radius:28px"><h2 style="font-size:30px">Found a mistake?</h2><p style="color:var(--soft)">Tell me on the <a href="/contact/">contact page</a>. I fix errors and note the date on the page.</p></section>
{SIGNUP.replace("CAMP","about")}
</main>
'''+FOOT
write(f'{R}/about/index.html',about)
print("problems, hub, about ok")

# ---------------- HUBS: books, ideas and the 4 areas (pillar pages)
BOOKS={}
def addbook(slug,t,by,area,url,note,cover=True):
    if slug in BOOKS: return
    BOOKS[slug]={"t":t,"by":by,"area":area,"url":url,"note":note,"cover":cov(slug) if cover else ""}
addbook("atomic-habits","Atomic Habits","James Clear","habits","/library/books/atomic-habits/","Read 6 of 20 chapters")
for B in BOOKPAGES: addbook(B["slug"],B["t"],B["by"],B["area"],f"/library/books/{B['slug']}/",f"Read {len([u for u in B['units'] if u[0]=='READ'])} of {len(B['units'])} {B['unit'].lower()}s")
for P in PROBLEMS:
    for i,f in enumerate(P["fixes"]):
        addbook(f["cover"],f["book"],f["by"],P["area"],f"/library/problems/{P['slug']}/#fix-{i+1}",f"Fix for: {P['problem']}")
addbook("getting-things-done","Getting Things Done","David Allen","focus","/library/ideas/the-2-minute-rule/","The other 2 minute rule",cover=False)
IDEAS=[{"t":"The 2 minute rule","src":"Atomic Habits vs Getting Things Done","area":"habits","d":"2 books, 2 different rules. Shrink a new habit, or do small tasks now.","url":"/library/ideas/the-2-minute-rule/","page":True}]
for it in ideas_daily:
    if it["slug"]=="the-2-minute-rule": continue
    IDEAS.append({"t":it["t"],"src":it["src"],"area":it["area"].lower(),"d":it["d"],"url":it["url"]})
for P in PROBLEMS:
    for i,f in enumerate(P["fixes"]):
        IDEAS.append({"t":f["idea"],"src":f["book"],"area":P["area"],"d":f["try"],"url":f"/library/problems/{P['slug']}/#fix-{i+1}"})
def book_card(b):
    img=f'<img src="{b["cover"]}" alt="" width="64" height="97" loading="lazy">' if b["cover"] else '<span class="nocov">'+html.escape(b["t"][:3].upper())+'</span>'
    return f'<a class="card lift bcard" href="{b["url"]}">{img}<span><span class="mono">{html.escape(b["by"])}</span><b class="serif">{html.escape(b["t"])}</b><small>{html.escape(b["note"])}</small></span></a>'
def idea_card(it):
    return f'<a class="card lift icard" href="{it["url"]}"><span class="mono">{html.escape(it["src"])}</span><h3>{html.escape(it["t"])}</h3><p>{html.escape(it["d"])}</p>{"<span class=\"tag green\">FULL PAGE</span>" if it.get("page") else ""}</a>'
def prob_card(P):
    return f'''<a class="card lift reveal pcard" href="/library/problems/{P["slug"]}/"><span class="pcard-covers">{"".join(f'<img src="{cov(f["cover"])}" alt="" width="54" height="82" loading="lazy">' for f in P["fixes"])}</span><span class="mono">{P["area"].upper()} · 3 fixes</span><h3>{html.escape(P["problem"])}</h3><span class="go">See the 3 fixes</span></a>'''

# Books hub
bk_h,bk_ld=crumbs([("Books",None)])
books_by_area="".join(f'<section class="hub-sec" id="{k}"><h2>{html.escape(AREA_META[k][0])}</h2><div class="grid bgrid">'+"".join(book_card(b) for b in BOOKS.values() if b["area"]==k)+'</div></section>' for k in AREA_META if any(b["area"]==k for b in BOOKS.values()))
booksp=head("Books: what to read, skim or skip | The Useful Library","Every nonfiction book in The Useful Library, sorted by the part of life it helps with, with the verdict or fix it is used for.","/library/books/",[{"@type":"ItemList","itemListElement":[{"@type":"ListItem","position":i+1,"url":BASE+b["url"].split("#")[0],"name":b["t"]} for i,b in enumerate(BOOKS.values())]},bk_ld])+'</head>\n<body>\n'+nav("book")+f'''
<main id="main" class="wrap">
{bk_h}
<section style="display:flex;flex-direction:column;gap:12px;padding-top:4px"><p class="mono rise">Books</p><h1 class="rise d1">Books, and what to take from them</h1><p class="lede rise d2">Every book here is used for something: a chapter verdict, or a fix for a real problem. New books every week.</p><div class="rise d2">{byline()}</div></section>
{toc([(k,AREA_META[k][0].split(" and ")[0]) for k in AREA_META if any(b["area"]==k for b in BOOKS.values())])}
{books_by_area}
{LEAD.replace("CAMP","books")}
</main>
'''+FOOT
write(f'{R}/books/index.html',booksp)

# Ideas hub
id_h,id_ld=crumbs([("Ideas",None)])
ideas_by_area="".join(f'<section class="hub-sec" id="{k}"><h2>{html.escape(AREA_META[k][0])}</h2><div class="grid">'+"".join(idea_card(it) for it in IDEAS if it["area"]==k)+'</div></section>' for k in AREA_META if any(it["area"]==k for it in IDEAS))
ideasp=head("Ideas: 1 idea from a book, 2 minutes to try | The Useful Library","Single ideas from the best nonfiction books, each with 1 thing to try today, sorted by habits, focus, money and mindset.","/library/ideas/",[id_ld])+'</head>\n<body>\n'+nav("idea")+f'''
<main id="main" class="wrap">
{id_h}
<section style="display:flex;flex-direction:column;gap:12px;padding-top:4px"><p class="mono rise">Ideas</p><h1 class="rise d1">1 idea, 2 minutes to try</h1><p class="lede rise d2">The single most useful ideas from nonfiction books. Each one comes with something you can do today.</p><div class="rise d2">{byline()}</div></section>
{toc([(k,AREA_META[k][0].split(" and ")[0]) for k in AREA_META if any(it["area"]==k for it in IDEAS)])}
{ideas_by_area}
{SIGNUP.replace("CAMP","ideas")}
</main>
'''+FOOT
write(f'{R}/ideas/index.html',ideasp)

# Area hubs
for k,(nm,tag) in AREA_META.items():
    ah,ald=crumbs([(nm.split(" and ")[0],None)])
    probs=[P for P in PROBLEMS if P["area"]==k]
    soon=[p for p in problems if p["area"].lower()==k and not any(P["problem"]==p["text"] for P in PROBLEMS)]
    ids=[it for it in IDEAS if it["area"]==k]
    bks=[b for b in BOOKS.values() if b["area"]==k]
    psec=('<div class="grid">'+"".join(prob_card(P) for P in probs)+'</div>' if probs else '')+("".join(f'<a class="sh-row" href="{p.get("url") or "/library/#signup"}"><b>{html.escape(p["text"])}</b><span class="mono">{"OPEN" if p.get("url") else "SOON"}</span></a>' for p in soon))
    ap=head(f"{nm}: problems, books and ideas | The Useful Library",f"Everything in The Useful Library about {nm.lower()}: real problems with 3 fixes each, the books worth reading, and single ideas to try today.",f"/library/{k}/",[ald,{"@type":"CollectionPage","name":nm,"hasPart":[{"@type":"WebPage","url":BASE+"/library/problems/"+P["slug"]+"/","name":P["problem"]} for P in probs]}])+f'</head>\n<body data-area="{k}">\n'+nav("home")+f'''
<main id="main" class="wrap">
{ah}
<section class="row" style="align-items:center;gap:32px;padding-top:4px">
<div class="grow-main" style="display:flex;flex-direction:column;gap:12px"><p class="mono rise">Area</p><h1 class="rise d1">{html.escape(nm)}</h1><p class="lede rise d2">{html.escape(tag)} Real problems, the books that fix them, and ideas to try today.</p><div class="rise d2">{byline()}</div>{toc([("problems","Problems"),("ideas","Ideas"),("books","Books")])}</div>
<span class="tile in" style="background:none;box-shadow:none;padding:0"><span class="art-box" style="width:190px;height:190px;border-radius:32px">{A.scene(k).replace('<svg class="art"','<svg class="art" width="170" height="170"')}</span></span>
</section>
<section class="hub-sec" id="problems"><h2>Problems</h2>{psec or '<p style="color:var(--soft)">The first problem pages for this area go up this week.</p>'}</section>
<section class="hub-sec" id="ideas"><h2>Ideas</h2><div class="grid">{"".join(idea_card(it) for it in ids) or '<p style="color:var(--soft)">Ideas for this area are on the way.</p>'}</div></section>
<section class="hub-sec" id="books"><h2>Books</h2><div class="grid bgrid">{"".join(book_card(b) for b in bks) or '<p style="color:var(--soft)">Books for this area are on the way.</p>'}</div></section>
<a class="gametile lift" href="/library/game/" style="padding:26px"><div style="display:flex;flex-direction:column;gap:8px"><p class="mono" style="color:#CFE3D7">Daily game</p><h2 style="font-size:32px">Guess today&#39;s book</h2></div><span style="font-weight:800">Play</span></a>
{SIGNUP.replace("CAMP","area-"+k)}
</main>
'''+FOOT
    write(f'{R}/{k}/index.html',ap)
print("books, ideas, area hubs ok")


# ---------------- PRIVACY
pv_h,pv_ld=crumbs([("Privacy",None)])
privacy=head("Privacy: The Useful Library","What The Useful Library stores, why, where it goes, and how to delete it.","/library/privacy/",[pv_ld])+'</head>\n<body>\n'+nav("about")+f'''
<main id="main" class="wrap">
{pv_h}
<section class="card legal" style="display:flex;flex-direction:column;gap:14px;border-radius:28px;padding:34px">
<p class="mono">Privacy · Updated {nice(PUBLISHED)}</p>
<h1 style="font-size:clamp(36px,5vw,48px)">What the Library stores, and why</h1>
<p>The Useful Library is run by The Useful Media Co (Raja, Chennai, India). Questions or deletion requests: raja@theusefultech.com or the <a href="/contact/">contact page</a>.</p>
<h2>On your device</h2>
<p>Your game results, streak, stamps, shelf, checklists, 30-day tests and theme choice are saved in your browser&#39;s local storage. They never leave your device unless you choose Save my progress. Clearing your browser data removes them.</p>
<h2>Save my progress</h2>
<p>If you save your progress, we store your email, a scrambled version of your PIN (never the PIN itself) and your Library progress on Cloudflare, so you can load it on another device. You can delete it any time: open the menu, tap Save my progress, then Delete my saved progress.</p>
<h2>Email lessons</h2>
<p>If you sign up for the lessons, or save your progress for the first time, your email is added to The Useful Life newsletter on Beehiiv. Every email has a 1-click unsubscribe link.</p>
<h2>Search</h2>
<p>When you type into the search box, your words are sent to our search service on Cloudflare to find the best matches. We don&#39;t attach them to your name or email.</p>
<h2>Bot checks and analytics</h2>
<p>Signup forms use Cloudflare Turnstile to block bots. We use Cloudflare Web Analytics, which counts visits without cookies and without tracking you across sites.</p>
<h2>Book links</h2>
<p>Some book links go to Amazon. As an Amazon Associate, The Useful Library earns from qualifying purchases. Amazon handles anything you do on its site under its own privacy policy.</p>
<h2>Your rights</h2>
<p>You can ask to see, correct or delete any data we hold about you. Email raja@theusefultech.com and it will be handled within 30 days.</p>
</section>
</main>
'''+FOOT
write(f'{R}/privacy/index.html',privacy)

# ---------------- FEED (Atom) of Library pages
_feed=[("/library/about/","About The Useful Library and Raja","Who writes the Library and how verdicts are made.")]+[("/library/problems/"+P["slug"]+"/",P["title"],P["desc"]) for P in PROBLEMS]+[("/library/books/"+B["slug"]+"/",B["t"]+": which parts to read",B["verdict"]) for B in BOOKPAGES]+[("/library/ideas/the-2-minute-rule/","The 2 minute rule: Atomic Habits vs Getting Things Done","2 books, 2 different rules.")]
_entries="".join(f"<entry><title>{html.escape(t)}</title><link href=\"{BASE}{u}\"/><id>{BASE}{u}</id><updated>{UPDATED.get(u,PUBLISHED)}T00:00:00Z</updated><summary>{html.escape(d)}</summary><author><name>Raja</name></author></entry>" for u,t,d in _feed)
open(f'{R}/feed.xml','w').write(f'<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>The Useful Library</title><subtitle>Fix real problems with ideas from nonfiction books.</subtitle><link href="{BASE}/library/feed.xml" rel="self"/><link href="{BASE}/library/"/><id>{BASE}/library/</id><updated>{PUBLISHED}T00:00:00Z</updated>{_entries}</feed>')
print("privacy, feed ok")


# ---------------- BOOK PAGES (data-driven)
import re as _re
def ucell(u,i):
    t=u[1]; m=_re.match(r"^(\d+)\.",t)
    if m: return m.group(1)
    m=_re.match(r"^(Part|Rule|Book|Step) (\d+)",t)
    if m: return {"Part":"P","Rule":"R","Book":"","Step":""}[m.group(1)]+m.group(2)
    for k,v in (("Intro","In"),("Appendix","Ap"),("Afterword","Af"),("Conclusion","C"),("Final","F")):
        if t.startswith(k): return v
    return str(i+1)
def uname(u,unit):
    t=u[1]; m=_re.match(r"^(\d+)\.",t)
    if m: return ("ch. " if unit=="Chapter" else "")+m.group(1)
    m=_re.match(r"^(Part|Rule|Book|Step) (\d+)",t)
    if m: return m.group(1)+" "+m.group(2)
    for k,v in (("Intro","the introduction"),("Appendix","the appendix"),("Afterword","the afterword"),("Conclusion","the conclusion")):
        if t.startswith(k): return v
    return t
def andlist(xs): return xs[0] if len(xs)==1 else ", ".join(xs[:-1])+" and "+xs[-1]

def book_page(B):
    path=f"/library/books/{B['slug']}/"
    units=B["units"]; nread=len([u for u in units if u[0]=="READ"]); unit=B["unit"].lower()+("s" if len(units)!=1 else "")
    first_read=next(i for i,u in enumerate(units) if u[0]=="READ")
    cells="".join(f'<button type="button" class="cell v-{u[0].lower()}" data-n="{i+1}" aria-pressed="{"true" if i==first_read else "false"}" aria-label="{html.escape(u[1])}, {u[0].lower()}">{ucell(u,i)}</button>' for i,u in enumerate(units))
    reads=andlist([uname(u,B["unit"]) for u in units if u[0]=="READ"])
    used=[(P,i) for P in PROBLEMS for i,f in enumerate(P["fixes"]) if f["cover"]==B["slug"]]
    usedH="".join(f'<a class="card lift pcard" href="/library/problems/{P["slug"]}/#fix-{i+1}"><span class="mono">Fix {i+1} for</span><h3>{html.escape(P["problem"])}</h3><span class="go">See the fix</span></a>' for P,i in used)
    pairs=[b for b in BOOKPAGES if b["area"]==B["area"] and b["slug"]!=B["slug"]][:3]
    pairsH="".join(f'<a class="card lift bcard" href="/library/books/{b["slug"]}/"><img src="{cov(b["slug"])}" alt="" width="64" height="97" loading="lazy"><span><span class="mono">{html.escape(b["by"])}</span><b class="serif">{html.escape(b["t"])}</b><small>Read {len([u for u in b["units"] if u[0]=="READ"])} of {len(b["units"])}</small></span></a>' for b in pairs)
    ideasH="".join(f'<div class="card reveal icard inum"><span class="inum-n" aria-hidden="true">{n+1}</span><span class="mono">{html.escape(w)}</span><h3>{html.escape(t)}</h3><p>{html.escape(d)}</p></div>' for n,(w,t,d) in enumerate(B["ideas"]))
    sm=SUMMARIES.get(B["slug"])
    if not sm: raise SystemExit(f'Missing 60-second summary for {B["slug"]}: add it to scripts/library_summaries.py (see RUNBOOK)')
    if sm:
        nskim=len([u for u in units if u[0]=="SKIM"]); full=sm[1]/40; part=full*(nread+0.3*nskim)/len(units)
        r=lambda x: max(0.5,round(x*2)/2); fmt=lambda x: (str(int(x)) if x==int(x) else str(x))
        summary_block=f'''<section class="sum card reveal" id="summary"><div class="sum-main"><p class="mono">The book in 60 seconds</p><p class="sum-t">{html.escape(sm[0])}</p></div><div class="sum-time"><p class="mono">Your time</p><div class="tbar"><i style="width:{round(part/full*100)}%"></i></div><p><b>About {fmt(r(part))} hours</b> to read the parts that matter, instead of about {fmt(r(full))} hours for the whole book.</p><p class="fine">Based on about {sm[1]} pages at 40 pages an hour, with skimmed parts counted at a third.</p></div></section>'''
    else: summary_block=""
    tk=TAKES.get(B["slug"])
    if not tk: raise SystemExit(f'Missing Raja take for {B["slug"]}: add it to scripts/library_takes.py (see RUNBOOK)')
    summary_block+=f'<section class="take card reveal" id="take"><span class="take-av" aria-hidden="true">R</span><div><p class="mono">Raja&#39;s take</p><p class="take-t">{html.escape(tk)}</p></div></section>'
    nt=B.get("note")
    note_block=f'<section class="card lift reveal" style="display:flex;flex-direction:column;gap:10px;border-radius:28px"><p class="mono">{html.escape(nt[0])}</p><p class="serif" style="font-size:26px;line-height:1.2">{html.escape(nt[1])}</p><a class="more" href="{nt[2]}">{html.escape(nt[3])}</a></section>' if nt else ""
    q=[(f"Is {B['t']} worth reading?",f"Yes, but not all of it. Read {nread} of its {len(units)} {unit}: {reads}. {B['verdict'].split('. ',1)[-1] if '. ' in B['verdict'] else ''}".strip()),
       (f"Which parts of {B['t']} should I read?",f"Read {reads}. Skim the parts marked skim for their 1 idea, and skip the rest on a first read."),
       (f"Who is {B['t']} for?",B["for"]+" Skip it if: "+B["skip"])]
    bc_h2,bc_ld2=crumbs([("Books","/library/books/"),(B["t"],None)])
    ld=[{"@type":"Book","name":B["t"],"author":{"@type":"Person","name":B["by"]},"image":BASE+cov(B["slug"])},
        {"@type":"Review","itemReviewed":{"@type":"Book","name":B["t"],"author":{"@type":"Person","name":B["by"]}},"author":{"@id":BASE+"/library/about/#raja"},"reviewBody":B["verdict"]},
        {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":a,"acceptedAnswer":{"@type":"Answer","text":b}} for a,b in q]},bc_ld2]
    title=f"{B['t']}: which {unit} to read (and which to skip)"
    desc=f"{B['t']} by {B['by']}, part by part: read {nread} of {len(units)} {unit}, skim or skip the rest, and why. Plus the 4 ideas worth using."
    page=head(title,desc,path,ld)+f'</head>\n<body data-area="{B["area"]}">\n'+nav("book")+f'''
<main id="main" class="wrap">
{bc_h2}
<section class="book-hero" style="--cover:url({cov(B["slug"])})">
<div class="bh-cover"><img class="rise" src="{cov(B["slug"])}" alt="{html.escape(B["t"])} cover" width="300" height="455" fetchpriority="high"></div>
<div class="bh-text">
<p class="mono rise">Book · {html.escape(AREA_META[B["area"]][0])} · {B["year"]}</p>
<h1 class="rise d1">{html.escape(B["t"])}</h1>
<p class="rise d1" style="font-size:18px;color:var(--soft)">{html.escape(B["by"])} · {len(units)} {unit}</p>
<div class="rise d1">{byline(path)}</div>
<div class="card rise d2 row" style="padding:22px 24px;align-items:center;gap:20px">
<span class="stamp-box stamp d4">READ {nread} OF {len(units)}</span>
<p style="flex:1 1 280px;font-size:17px"><b>The Useful verdict:</b> <span class="hl">{html.escape(B["verdict"].split(". ")[0])}.</span> {html.escape(B["verdict"].split(". ",1)[1]) if ". " in B["verdict"] else ""}</p></div>
<div class="rise d3" style="display:flex;gap:10px;flex-wrap:wrap" data-hero-actions><a class="btn btn-green" href="#" data-buy="{html.escape(B["t"]+" "+B["by"].split(" and ")[0])}">Get the book</a><button type="button" class="btn btn-line" data-shelf="{B["slug"]}">Add to my shelf</button><button type="button" class="btn btn-line" data-share-card="/library/og/card-{B["slug"]}.png" data-share-title="{html.escape(B["t"])}: read {nread} of {len(units)}">Share the verdict</button></div>
</div>
</section>
{summary_block}
{toc([("summary","In 60 seconds"),("verdicts","Which "+unit),("ideas","4 ideas"),("fit","Is it for you?"),("faq","Quick answers")])}
<section class="card reveal" id="verdicts" style="display:flex;flex-direction:column;gap:18px;border-radius:28px;padding:34px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><h2>Read only these {unit}</h2>
<div class="legend"><span><i style="background:var(--green)"></i>Read</span><span><i style="background:var(--brass)"></i>Skim</span><span><i style="background:var(--line2)"></i>Skip</span></div></div>
<p style="font-size:15px;color:var(--muted)">Tap any {B["unit"].lower()}. Read: {html.escape(reads)}.</p>
<div class="cells">{cells}</div>
<div class="chap-panel" data-chap-panel aria-live="polite"><span class="verdict" data-v style="background:var(--green);color:#fff">READ</span>
<div style="flex:1 1 380px;display:flex;flex-direction:column;gap:6px"><p class="serif" data-t style="font-size:26px;line-height:1.15">{html.escape(units[first_read][1])}</p><p data-w style="color:var(--ink2)">{html.escape(units[first_read][2])}</p></div></div>
<script type="application/json" id="chapters" data-raw="1">{json.dumps([list(u) for u in units])}</script>
</section>
<section id="ideas" style="display:flex;flex-direction:column;gap:18px"><h2>4 ideas from this book</h2><div class="grid">{ideasH}</div></section>
{note_block}
<section class="row" id="fit">
<div class="card grow-main reveal" style="display:flex;flex-direction:column;gap:10px;border-radius:28px"><p class="mono">Read it if</p><p class="serif" style="font-size:24px;line-height:1.2">{html.escape(B["for"])}</p><p class="mono" style="margin-top:8px">Skip it if</p><p style="color:var(--soft)">{html.escape(B["skip"])}</p></div>
{('<div class="grow-side" style="display:flex;flex-direction:column;gap:12px"><p class="mono">Used to fix</p>'+usedH+'</div>') if used else ''}
</section>
{faq(q)}
{LEAD.replace("CAMP","verdicts-"+B["slug"])}
{('<section style="display:flex;flex-direction:column;gap:16px"><h2 style="font-size:36px">Pairs well with</h2><div class="grid bgrid">'+pairsH+'</div></section>') if pairs else ''}
{next3("book",B["area"],path)}
</main>
<div class="buybar" data-buybar aria-hidden="true"><img src="{cov(B["slug"])}" alt="" width="34" height="52"><span><b>{html.escape(B["t"])}</b><small>Read {nread} of {len(units)} {unit}</small></span><a class="btn btn-green" href="#" data-buy="{html.escape(B["t"]+" "+B["by"].split(" and ")[0])}" tabindex="-1">Get it</a></div>
'''+FOOT
    write(f'{R}/books/{B["slug"]}/index.html',page)
for B in BOOKPAGES: book_page(B)
print(len(BOOKPAGES),"book pages ok")

# ---------------- Keep sitemap.xml and llms.txt in step with every page written (new pages appear automatically)
_ROOT=os.path.dirname(R)
_sm=os.path.join(_ROOT,"sitemap.xml"); _s=open(_sm).read(); _add=""
for _p in sorted(WRITTEN):
    if "/lost/" in _p or "/shelf/" in _p or "/offline/" in _p: continue
    _u=BASE+_p
    if f"<loc>{_u}</loc>" not in _s: _add+=f"  <url><loc>{_u}</loc><lastmod>{UPDATED.get(_p,PUBLISHED)}</lastmod></url>\n"
if _add: open(_sm,"w").write(_s.replace("</urlset>",_add+"</urlset>"))
_lt=os.path.join(_ROOT,"llms.txt"); _l=open(_lt).read(); _new=""
for B in BOOKPAGES:
    if f"/library/books/{B['slug']}/" not in _l: _new+=f"- [{B['t']}: which parts to read]({BASE}/library/books/{B['slug']}/): {B['verdict']}\n"
for P in PROBLEMS:
    if f"/library/problems/{P['slug']}/" not in _l: _new+=f"- [{P['problem']}: 3 fixes]({BASE}/library/problems/{P['slug']}/): {P['desc']}\n"
if _new and "- [Books](https://theusefulmedia.com/library/books/)" in _l: open(_lt,"w").write(_l.replace("- [Books](https://theusefulmedia.com/library/books/)",_new+"- [Books](https://theusefulmedia.com/library/books/)",1))
print("sitemap +",_add.count("<url>"),"| llms +",_new.count("\n"))
