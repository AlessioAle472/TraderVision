import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def handle_request(request):
            if request.method == "POST" or "api" in request.url or "graphql" in request.url:
               print(f"API Request: {request.method} {request.url}")
               if request.method == "POST":
                   try: print(f"PostData: {request.post_data}")
                   except: pass

        page.on("request", handle_request)
        
        print("Navigating...")
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)

        print("Clicking 'Questa settimana' via JS...")
        try:
            # Force click on span containing Questa settimana
            await page.evaluate("""
                let el = Array.from(document.querySelectorAll('span')).find(e => e.textContent === 'Questa settimana');
                if (el) { el.click(); console.log('Clicked settimana span'); }
                else {
                    let parent = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Questa settimana'));
                    if (parent) { parent.click(); console.log('Clicked settimana button'); }
                }
            """)
            await page.wait_for_timeout(3000)
        except Exception as e:
            print("Failed eval:", e)
            
        print("Clicking calendar icon to find 'Questo mese'...")
        try:
            # The calendar button usually contains an SVG or text for dates like "23 mag - 23 mag"
            # We can find a button that contains '-' and '202' (for year) or just try to click all buttons that look like date pickers
            await page.evaluate("""
                let btns = Array.from(document.querySelectorAll('button'));
                let dateBtn = btns.find(b => b.textContent.includes('202') && b.textContent.includes('-'));
                if (dateBtn) {
                   dateBtn.click();
                   console.log('Clicked Date Picker Dropdown');
                }
            """)
            await page.wait_for_timeout(2000)
            
            # Now click Questo mese if it exists
            await page.evaluate("""
                let mese = Array.from(document.querySelectorAll('li, span, button')).find(e => e.textContent.includes('Questo mese') || e.textContent.includes('Mese corrente'));
                if (mese) { mese.click(); console.log('Clicked Questo Mese'); }
            """)
            await page.wait_for_timeout(5000)
        except Exception as e:
             print("Failed clicking calendar:", e)

        html = await page.content()
        if "Questo mese" in html or "Mese corrente" in html:
            print("Found mese in HTML")
            
        await browser.close()

asyncio.run(run())
