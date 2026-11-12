import asyncio,json,time,urllib.request
from playwright.async_api import async_playwright
SYNC="https://library-sync.raja-822.workers.dev/"
def real(body):
    req=urllib.request.Request(SYNC,data=body,headers={"Origin":"https://theusefulmedia.com","Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
    try: return 200,urllib.request.urlopen(req).read().decode()
    except urllib.error.HTTPError as e: return e.code,e.read().decode()
async def h(route):
    st,b=real(route.request.post_data.encode()); await route.fulfill(status=st,headers={"Access-Control-Allow-Origin":"*","Content-Type":"application/json"},body=b)
EMAIL=f"qa-sync-{int(time.time())}@example.com"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        errs=[]
        # Device A: phone with progress
        A=await b.new_context(viewport={"width":390,"height":844}); pa=await A.new_page(); pa.on("pageerror",lambda e: errs.append("A "+str(e)))
        await pa.route(SYNC,h)
        await pa.goto("http://localhost:8765/library/shelf/"); await pa.wait_for_timeout(400)
        await pa.evaluate("""()=>{localStorage.setItem('lib:shelf:atomic-habits','true');localStorage.setItem('lib:game:1',JSON.stringify({shown:2,wrong:['Deep Work'],won:true}));}""")
        await pa.reload(); await pa.wait_for_timeout(500)
        print("A line:", await pa.text_content("[data-sync-line]"))
        await pa.click("[data-sync-open]:visible >> nth=0"); await pa.wait_for_timeout(300)
        await pa.screenshot(path="/tmp/libqa_sync_dbg.png"); print("hidden?", await pa.evaluate("document.querySelector('[data-sync-sheet]').hidden"), errs)
        await pa.fill("#sync-em",EMAIL); await pa.fill("#sync-pin","1234"); 
        print("pin filtered:", await pa.input_value("#sync-pin"))
        await pa.click("[data-sync-form] button"); await pa.wait_for_timeout(2500)
        print("A msg:", await pa.text_content(".sync-msg"))
        await pa.screenshot(path="/tmp/libqa_sync_a.png")
        print("A line after:", await pa.text_content("[data-sync-line]"))
        # Device B: fresh laptop
        B=await b.new_context(viewport={"width":1280,"height":900}); pb=await B.new_page(); pb.on("pageerror",lambda e: errs.append("B "+str(e)))
        await pb.route(SYNC,h)
        await pb.goto("http://localhost:8765/library/shelf/#save"); await pb.wait_for_timeout(800)
        await pb.fill("#sync-em",EMAIL); await pb.fill("#sync-pin","9999"); await pb.click("[data-sync-form] button"); await pb.wait_for_timeout(2000)
        print("B wrong:", await pb.text_content(".sync-msg"))
        await pb.fill("#sync-pin","1234"); await pb.click("[data-sync-form] button"); await pb.wait_for_timeout(1000)
        print("B ok:", await pb.text_content(".sync-msg"))
        await pb.wait_for_timeout(2500)
        print("B shelf key:", await pb.evaluate("localStorage.getItem('lib:shelf:atomic-habits')"), await pb.evaluate("localStorage.getItem('lib:game:1')"))
        print("B books:", (await pb.inner_text("[data-sh-books]"))[:80].replace("\n"," | "))
        # B removes book; A should lose it after sync
        await pb.evaluate("localStorage.setItem('lib:shelf:atomic-habits','false')")
        await pb.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        await pb.goto("http://localhost:8765/library/"); await pb.wait_for_timeout(2500)
        await pa.goto("http://localhost:8765/library/shelf/"); await pa.wait_for_timeout(3000)
        print("A shelf after B removed:", await pa.evaluate("localStorage.getItem('lib:shelf:atomic-habits')"))
        await pa.click("[data-sync-open]:visible >> nth=0"); await pa.wait_for_timeout(300)
        await pa.screenshot(path="/tmp/libqa_sync_in.png")
        print("errs",errs)
        await b.close()
asyncio.run(main())
