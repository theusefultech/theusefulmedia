import asyncio
from playwright.async_api import async_playwright
pages=[("home","/library/"),("game","/library/game/"),("book","/library/books/atomic-habits/"),("idea","/library/ideas/the-2-minute-rule/"),("shelf","/library/shelf/"),("lost","/library/lost/"),("hub","/library/problems/"),("about","/library/about/"),("p1","/library/problems/cant-focus/"),("p2","/library/problems/overthinking/"),("p3","/library/problems/overspending/"),("books","/library/books/"),("ideas","/library/ideas/"),("habits","/library/habits/"),("money","/library/money/"),("privacy","/library/privacy/"),("b1","/library/books/deep-work/"),("b2","/library/books/meditations/"),("b3","/library/books/four-thousand-weeks/"),("b4","/library/books/your-money-or-your-life/"),("p4","/library/problems/start-investing/"),("b5","/library/books/the-little-book-of-common-sense-investing/"),("b6","/library/books/essentialism/")]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for w in [360,390,430,768,1024,1440]:
            for scheme in ["light","dark"]:
                ctx=await b.new_context(viewport={"width":w,"height":860},color_scheme=scheme,is_mobile=w<760,has_touch=w<760)
                pg=await ctx.new_page(); errs=[]
                pg.on("pageerror",lambda e: errs.append(str(e)))
                for n,u in pages:
                    await pg.goto("http://localhost:8765"+u); await pg.wait_for_timeout(700)
                    await pg.evaluate("Promise.race([Promise.all(document.getAnimations().filter(a=>a.effect&&a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>0))),new Promise(r=>setTimeout(r,2000))])")
                    ov=await pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
                    small=await pg.evaluate("""[...document.querySelectorAll('a,button,input')].filter(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!='hidden'&&(r.height<40)&&!e.closest('.lib-foot')&&!e.closest('p')&&e.offsetParent}).map(e=>(e.textContent||e.getAttribute('aria-label')||e.tagName).trim().slice(0,20)+':'+Math.round(e.getBoundingClientRect().height))""")
                    if ov>0 or (w<760 and small): print(w,scheme,n,"overflow",ov,"small",small[:6])
                    if w in (390,1440):
                        await pg.evaluate("document.querySelectorAll('.reveal,[data-observe]').forEach(e=>e.classList.add('in'))"); await pg.wait_for_timeout(500)
                        await pg.screenshot(path=f"/tmp/libqa_q-{n}-{w}-{scheme}.png",full_page=(scheme=='light'))
                if errs: print(w,scheme,errs)
                await ctx.close()
        await b.close()
asyncio.run(main())
