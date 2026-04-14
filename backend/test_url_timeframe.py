import asyncio
import json
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        url = "https://it.investing.com/economic-calendar/?timeFrame=month"
        print(f"Navigating to {url}")
        
        await page.goto(url, timeout=60000)
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        count = 0
        if script:
            data = json.loads(script.string)
            eventsByDate = data.get('props',{}).get('pageProps',{}).get('state',{}).get('economicCalendarStore', {}).get('calendarEventsByDate', {})
            dates = list(eventsByDate.keys())
            print(f"Found {len(dates)} dates in data.")
            for d in dates:
                count += len(eventsByDate[d])
            print(f"Total events found: {count}")
        else:
            print("No NEXT DATA found!")
        
        await browser.close()

asyncio.run(run())
