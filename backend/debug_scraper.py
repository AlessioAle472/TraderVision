import sys
import json
from playwright.sync_api import sync_playwright

def test():
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 720}
            )
            page = context.new_page()
            
            print("Navigating to Investing.com...")
            page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
            
            # Take early screenshot
            page.screenshot(path="debug_1_initial.png")
            
            print("Waiting for table...")
            try:
                page.wait_for_selector("table", timeout=15000)
                print("Table found.")
            except:
                print("Table NOT found within 15s.")
            
            page.screenshot(path="debug_2_after_wait.png")
            
            print("Removing OneTrust...")
            page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
            
            print("Clicking 'Questa settimana'...")
            page.evaluate("let b=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='Questa settimana');if(b)b.click();")
            
            print("Waiting for data to refresh...")
            page.wait_for_timeout(4000)
            page.screenshot(path="debug_3_after_click.png")
            
            rows = page.locator("tr").all()
            print(f"Total rows found: {len(rows)}")
            
            if len(rows) > 0:
                 print(f"First row text: {rows[0].inner_text().strip()}")
            
            with open("debug_dom.html", "w") as f:
                f.write(page.content())
            
            browser.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
