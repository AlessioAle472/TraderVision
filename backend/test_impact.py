import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)
        await page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
        
        rows = await page.locator("tr").all()
        for i in range(2, 6):
             tds = await rows[i].locator("td").all()
             if len(tds) >= 4:
                 html = await tds[3].inner_html()
                 print(f"Row {i} impact TD HTML:\n{html}\n---")
            
        await browser.close()

asyncio.run(run())
