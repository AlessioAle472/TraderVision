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

        print("Navigating...")
        await page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        await page.wait_for_timeout(3000)
        
        await page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
        
        print("Clicking Questa settimana...")
        try:
            await page.evaluate("let b=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='Questa settimana');if(b)b.click();")
            await page.wait_for_timeout(3000)
        except: pass

        rows = await page.locator("tr").all()
        events = []
        current_date = ""
        
        for row in rows:
            text = await row.inner_text()
            if "lunedì" in text.lower() or "martedì" in text.lower() or "mercoledì" in text.lower() or "giovedì" in text.lower() or "venerdì" in text.lower() or "sabato" in text.lower() or "domenica" in text.lower():
                # Date row usually has only 1 TD or TH
                tds = await row.locator("td, th").all()
                if len(tds) == 1:
                    current_date = (await tds[0].inner_text()).strip()
                    continue
            
            tds = await row.locator("td").all()
            if len(tds) >= 7:
                time = (await tds[0].inner_text()).strip()
                country = (await tds[1].inner_text()).strip()
                title = (await tds[2].inner_text()).strip()
                
                # Impact: count SVGs or paths in column 3
                # Investing uses stars. A muted star has fill #D9DCDF, an active one has fill #181C21.
                # Let's just output the HTML of column 3 for the first few
                svg_html = await tds[3].inner_html()
                
                # count occurrences of #181C21
                stars = svg_html.count('#181C21')
                if stars == 0 and svg_html.count('svg') > 0:
                   # Try to find another dark color if #181C21 changed
                   if "black" in svg_html.lower() or "#333" in svg_html.lower():
                       stars = svg_html.count('svg') # just guess
                
                impact = "low"
                if stars == 3: impact = "high"
                elif stars == 2: impact = "medium"
                
                actual = (await tds[4].inner_text()).strip()
                forecast = (await tds[5].inner_text()).strip()
                prev = (await tds[6].inner_text()).strip()
                
                if country and title:
                    events.append({
                        "date": current_date,
                        "time": time,
                        "country": country,
                        "title": title,
                        "impact": impact,
                        "stars": stars,
                        "actual": actual,
                        "forecast": forecast,
                        "previous": prev
                    })
        
        print(f"Parsed {len(events)} valid events.")
        for e in events[:5]:
             print(e)
            
        await browser.close()

asyncio.run(run())
