from bs4 import BeautifulSoup

with open("debug.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
btns = soup.find_all(["button", "a"])
print("Found buttons/links texts:")
for b in btns:
    text = b.get_text(strip=True)
    if any(k in text.lower() for k in ["mese", "settimana", "oggi", "ieri", "domani", "data", "calendario", "filtri", "2026", "2024", "2025", "-"]):
         print(f"Tag: {b.name}, Text: '{text}', ID: {b.get('id')}, Class: {b.get('class')}")
