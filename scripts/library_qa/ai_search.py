import asyncio,json,urllib.request
from playwright.async_api import async_playwright
Q=["my boss stresses me out","I start things and never finish","I never have enough money at the end of the month","banana bread recipe","I can't save money"]
def real(body):
    req=urllib.request.Request("https://library-search.raja-822.workers.dev/",data=body,headers={"Origin":"https://theusefulmedia.com","Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
    return urllib.request.urlopen(req).read().decode()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        calls=[]
        async def h(route):
            calls.append(1); await route.fulfill(status=200,headers={"Access-Control-Allow-Origin":"*","Content-Type":"application/json"},body=real(route.request.post_data.encode()))
        await pg.route("https://library-search.raja-822.workers.dev/",h)
        await pg.goto("http://localhost:8765/library/"); await pg.wait_for_timeout(500)
        await pg.click("#q") if await pg.is_visible("#q") else None
        for q in Q:
            await pg.fill("#q",q); await pg.wait_for_timeout(2500)
            r=await pg.eval_on_selector_all(".suggest a, .suggest .r-head","e=>e.map(x=>x.innerText.replace(/\\n/g,' | '))")
            print(q,"=>",r[:5])
        await pg.fill("#q","my boss stresses me out"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/tmp/libqa_aisearch.png")
        # failure path: worker down
        await pg.unroute("https://library-search.raja-822.workers.dev/")
        await pg.route("https://library-search.raja-822.workers.dev/",lambda r: r.abort())
        await pg.fill("#q","I keep putting things off"); await pg.wait_for_timeout(1500)
        print("offline =>",await pg.eval_on_selector_all(".suggest a, .suggest .r-head","e=>e.map(x=>x.innerText.replace(/\\n/g,' | '))"))
        print("calls",len(calls),"errs",errs)
        await b.close()
asyncio.run(main())
