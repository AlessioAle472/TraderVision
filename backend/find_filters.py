from bs4 import BeautifulSoup

with open("debug.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
for button in soup.find_all("button"):
    text = button.get_text().strip().lower()
    if "mese" in text or "settimana" in text or "oggi" in text:
        print("Found filter button:", button.get_text().strip(), "Classes:", button.get("class"), "ID:", button.get("id"))
