import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Navigating...")
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Remove cookie banner
        await page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
        
        # Click Questa settimana
        print("Clicking Questa settimana...")
        try:
            await page.evaluate("let b=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='Questa settimana');if(b)b.click();")
            await page.wait_for_timeout(3000)
        except: pass

        rows = await page.locator("tr").all()
        # Row 0 is header, Row 1 is Date, Row 2 is Event
        for i in range(2, 6):
             html = await rows[i].inner_html()
             print(f"Row {i} HTML:\n{html}\n---")
            
        await browser.close()

asyncio.run(run())
