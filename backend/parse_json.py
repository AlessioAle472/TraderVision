import json
from bs4 import BeautifulSoup

with open("debug.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
script = soup.find("script", id="__NEXT_DATA__")
if script:
    data = json.loads(script.string)
    with open("dump.json", "w") as jf:
        json.dump(data, jf, indent=2)
