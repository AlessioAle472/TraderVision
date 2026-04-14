import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        async def handle_request(request):
            if "graphql" in request.url or "api" in request.url or "json" in request.url or "economic-calendar" in request.url:
               try: 
                   post = request.post_data
                   if post and "timeFrame" in post or "date" in post or "query" in post:
                        print(f"API Match: {request.url}")
                        print(f"PostData: {post}")
               except: pass

        page.on("request", handle_request)
        
        print("Navigating...")
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)

        # Remove OneTrust completely
        await page.evaluate("""
            let ot = document.getElementById('onetrust-consent-sdk');
            if(ot) ot.remove();
        """)
        
        print("Clicking Questa settimana...")
        try:
            # Force click on button with Questa settimana
            await page.evaluate("""
                let b = Array.from(document.querySelectorAll('button')).find(e => e.textContent === 'Questa settimana');
                if (b) { b.click(); console.log('Successfully clicked Questa settimana'); }
            """)
            await page.wait_for_timeout(3000)
        except Exception as e:
            print("Failed eval:", e)
            
        await browser.close()

asyncio.run(run())
