from bs4 import BeautifulSoup

with open("debug_dom.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
rows = soup.find_all("tr")
# Find the header row to confirm indices
header = soup.find("thead")
if header:
    ths = header.find_all("th")
    for i, th in enumerate(ths):
        print(f"Header {i}: {th.get_text(strip=True)}")

print("\n--- Row 6 Details ---")
target_row = rows[6]
tds = target_row.find_all("td")
for i, td in enumerate(tds):
    print(f"TD {i} Text: {td.get_text(strip=True)}")
    print(f"TD {i} HTML: {td}\n")
