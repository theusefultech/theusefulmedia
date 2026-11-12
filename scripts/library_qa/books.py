import asyncio
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg=await b.new_page(viewport={"width":390,"height":844}); e=[]; pg.on("pageerror",lambda x:e.append(str(x)))
        await pg.goto("http://localhost:8765/library/books/four-thousand-weeks/"); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/libqa_bk_top.png")
        await pg.click(".cell >> nth=6"); await pg.wait_for_timeout(300)
        print("panel:", await pg.text_content("[data-t]"), "|", await pg.text_content("[data-v]"))
        await pg.evaluate("document.querySelector('#verdicts').scrollIntoView()"); await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/libqa_bk_cells.png")
        await pg.click("[data-shelf]"); 
        await pg.goto("http://localhost:8765/library/shelf/"); await pg.wait_for_timeout(500); print("shelf:", (await pg.inner_text("[data-sh-books]"))[:60].replace("\n"," "))
        await pg.goto("http://localhost:8765/library/"); await pg.fill("#q","Marcus Aurelius"); await pg.wait_for_timeout(300)
        print("search:", await pg.eval_on_selector_all(".suggest a","e=>e.slice(0,2).map(x=>x.innerText.split('\\n')[0]+' -> '+x.getAttribute('href'))"))
        await pg.goto("http://localhost:8765/library/books/"); await pg.wait_for_timeout(300)
        print("hub links:", await pg.eval_on_selector_all(".bcard","e=>e.map(x=>x.getAttribute('href')).filter(h=>h.indexOf('#')>0).length"), "anchored (should be 0)")
        print("errs",e); await b.close()
asyncio.run(m())
