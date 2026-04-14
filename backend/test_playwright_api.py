import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def handle_response(response):
            if "investing.com" in response.url and ("json" in response.url or "api" in response.url or "_next/data" in response.url or "economic-calendar" in response.url):
                pass
                #print(f"Response: {response.url}")
        
        async def handle_request(request):
            if request.method == "POST" or "timeFrame" in request.url or "date" in request.url:
               print(f"Interesting Request: {request.method} {request.url}")
               print(f"Headers: {request.headers}")
               try:
                   print(f"PostData: {request.post_data}")
               except: pass

        page.on("response", handle_response)
        page.on("request", handle_request)
        
        print("Navigating...")
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)
        
        print("Accepting cookies...")
        try:
             await page.locator("#onetrust-accept-btn-handler").click(timeout=5000)
             await page.wait_for_timeout(2000)
             print("Cookies accepted.")
        except Exception as e:
             print("No cookie banner or error:", e)

        print("Clicking buttons to trigger data load...")
        try:
             # Look for "Questo mese" or button inside a dropdown
             await page.get_by_text("Questa settimana", exact=True).click(timeout=3000)
             print("Clicked: Questa settimana")
             await page.wait_for_timeout(2000)
        except Exception as e:
             print("Failed 'Questa settimana':", e)
             
        # Also try to click the start date or end date directly
        
        await browser.close()

asyncio.run(run())
