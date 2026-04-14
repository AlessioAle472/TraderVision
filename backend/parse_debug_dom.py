from bs4 import BeautifulSoup

with open("debug_dom.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
rows = soup.find_all("tr")
for i, row in enumerate(rows[:10]):
    print(f"Row {i}: {row.get_text(strip=True)[:100]}")
    # Print the impact column (index 3 usually)
    tds = row.find_all("td")
    if len(tds) >= 4:
        print(f"Impact HTML: {tds[3]}")
