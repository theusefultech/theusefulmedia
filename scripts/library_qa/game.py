import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        bad=[]
        for day in range(29):
            ctx=await b.new_context(viewport={"width":390,"height":844})
            await ctx.add_init_script(f"""(()=>{{const D=Date;const t=new D(2026,10,12+{day},9,0,0).getTime();class F extends D{{constructor(...a){{if(a.length)super(...a);else super(t)}} static now(){{return t}}}};window.Date=F;}})()""")
            pg=await ctx.new_page(); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
            await pg.goto("http://localhost:8765/library/game/"); await pg.wait_for_timeout(400)
            opts=await pg.eval_on_selector_all(".opt","e=>e.map(x=>x.textContent)")
            ans=await pg.evaluate("document.querySelector('[data-no]').textContent")
            # answer = first clue page? check via win: click each option until solved
            solved=False
            for i in range(8):
                o=await pg.eval_on_selector_all(".opt:not([disabled])","e=>e.map(x=>x.textContent)")
                if not o: break
                await pg.click(f".opt:not([disabled]) >> nth=0"); await pg.wait_for_timeout(150)
                if await pg.is_visible("[data-done]"):
                    lab=await pg.text_content("[data-r-label]"); solved="SOLVED" in lab; break
            title=await pg.text_content("[data-r-title]") if await pg.is_visible("[data-done]") else None
            if title not in opts or errs or len(opts)!=8: bad.append((day,ans,title,opts,errs))
            await ctx.close()
        print("bad:",bad)
        await b.close()
asyncio.run(main())
