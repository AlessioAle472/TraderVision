from bs4 import BeautifulSoup

with open("debug.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
tables = soup.find_all("table")
print(f"Found {len(tables)} tables")
for t in tables:
    print(f"Table ID: {t.get('id')}, Class: {t.get('class')}")

# Try to find headers like 'Attuale', 'Previsto'
for el in soup.find_all(string=lambda text: text and "Attuale" in text):
    print("Found 'Attuale' inside:", el.parent.name, el.parent.attrs)
