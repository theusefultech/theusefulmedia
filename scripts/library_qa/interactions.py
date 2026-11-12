import asyncio,json,time
from playwright.async_api import async_playwright
B="http://localhost:8765"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        c=await b.new_context(viewport={"width":390,"height":844}); pg=await c.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.goto(B+"/library/"); await pg.wait_for_timeout(800)
        vis=await pg.eval_on_selector_all("[data-tod]","e=>e.filter(x=>!x.hidden).map(x=>x.dataset.tod)")
        print("hero tod:",vis, await pg.text_content("[data-tod-say]"))
        await pg.evaluate("window.scrollTo(0,1400)"); await pg.wait_for_timeout(900)
        print("tiles in:", await pg.eval_on_selector_all(".tile","e=>e.filter(x=>x.classList.contains('in')).length"))
        # lamp
        d0=await pg.evaluate("document.documentElement.classList.contains('dk')")
        await pg.click("[data-lamp]"); await pg.wait_for_timeout(500)
        d1=await pg.evaluate("document.documentElement.classList.contains('dk')")
        await pg.reload(); await pg.wait_for_timeout(400)
        d2=await pg.evaluate("document.documentElement.classList.contains('dk')")
        print("lamp:",d0,d1,d2)
        await pg.screenshot(path="/tmp/libqa_p1_home_dark.png")
        await pg.click("[data-lamp]"); await pg.wait_for_timeout(400)
        # streak logic
        r=await pg.evaluate("""()=>{const S=window.LibStamps.streakInfo;const g=n=>({no:n,won:true});
          const a=S([1,2,3,4,5,6,7,8,10,11].map(g),11);   // miss day 9, freeze covers
          const b2=S([1,2,3,8,9].map(g),9);               // no freeze, break
          const c2=S([1,2,3,4,5,6,7,8,10,12].map(g),12);  // 2 misses, 1 freeze -> break at 11
          const d=S([1,2].map(g),3); // today 3 not played -> streak 2
          return [a.cur,a.freezes,b2.cur,c2.cur,d.cur]}""")
        print("streak tests (exp 10,0 2 1 2):",r)
        # resume
        await pg.evaluate("localStorage.setItem('lib:last',JSON.stringify({u:'/library/books/atomic-habits/',t:'Atomic Habits',p:0.4,at:Date.now()-3600000}))")
        await pg.reload(); await pg.wait_for_timeout(500)
        print("resume:", (await pg.inner_text(".resume")).replace("\n"," | ") if await pg.query_selector(".resume") else None)
        await pg.screenshot(path="/tmp/libqa_p1_home.png")
        # book page
        await pg.goto(B+"/library/books/atomic-habits/#resume"); await pg.wait_for_timeout(1200)
        print("book: ribbon", bool(await pg.query_selector(".ribbon")), "scrollY", await pg.evaluate("Math.round(scrollY)"), "faq", await pg.eval_on_selector_all(".faq details","e=>e.length"), "plug", bool(await pg.query_selector(".plug")))
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(1500)
        print("hl on:", await pg.eval_on_selector_all(".hl","e=>e.map(x=>x.classList.contains('on'))"))
        await pg.evaluate("window.scrollTo(0,document.body.scrollHeight/2)"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/tmp/libqa_p1_book.png")
        # game
        await pg.goto(B+"/library/game/"); await pg.wait_for_timeout(700)
        print("mcover:", await pg.evaluate("(()=>{const m=document.querySelector('[data-mcover]');return [m.hidden,m.style.getPropertyValue('--blur')]})()"))
        await pg.click("[data-sound]"); print("sound:", await pg.get_attribute("[data-sound]","aria-pressed"))
        ans=await pg.evaluate("document.querySelector('[data-r-title]')&&0")
        opts=await pg.eval_on_selector_all(".opt","e=>e.map(x=>x.textContent)")
        await pg.click(f".opt:has-text('{[o for o in opts if o!='The Psychology of Money'][0]}')"); await pg.wait_for_timeout(500)
        print("after miss blur:", await pg.evaluate("document.querySelector('[data-mcover]').style.getPropertyValue('--blur')"))
        await pg.screenshot(path="/tmp/libqa_p1_game.png")
        await pg.fill("[data-guess]","Psychology"); await pg.wait_for_timeout(200); await pg.click(".opt >> nth=0"); await pg.wait_for_timeout(2200)
        print("dog:", await pg.eval_on_selector_all("[data-r-dog]","e=>e.filter(x=>!x.hidden).map(x=>x.dataset.rDog)"), "teaser:", await pg.is_visible("[data-teaser]"), await pg.text_content("[data-freeze-line]"))
        await pg.screenshot(path="/tmp/libqa_p1_game_done.png", full_page=True)
        # lost
        await pg.goto(B+"/library/lost/"); await pg.wait_for_timeout(400); print("lost h1:", await pg.text_content("h1"))
        # peek
        await pg.goto(B+"/library/idea/".replace("idea/","ideas/the-2-minute-rule/")); await pg.wait_for_timeout(23500)
        print("peek on:", await pg.evaluate("document.querySelector('[data-peek]').classList.contains('on')"), await pg.text_content("[data-peek-t]"))
        await pg.screenshot(path="/tmp/libqa_p1_peek.png")
        print("errs",errs)
        await b.close()
asyncio.run(main())
