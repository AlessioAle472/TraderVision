from bs4 import BeautifulSoup

with open("debug_dom.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
rows = soup.find_all("tr")
for i, row in enumerate(rows):
    text = row.get_text(strip=True)
    if "2026" in text or "marzo" in text.lower():
        print(f"Potential Date Row {i}: {text}")
        print(f"Row HTML: {row}\n")
