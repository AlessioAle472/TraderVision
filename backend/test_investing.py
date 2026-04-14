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
        await page.wait_for_timeout(5000)
        html = await page.content()
        with open("debug.html", "w") as f:
            f.write(html)
        await browser.close()

asyncio.run(run())
