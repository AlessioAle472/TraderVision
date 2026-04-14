import asyncio
import json
import re
import sys
from playwright.sync_api import sync_playwright

def parse_number(val_str):
    if not val_str or val_str == '-': return None
    val_str = val_str.replace(',', '.')
    m = re.search(r'[-+]?\d*\.\d+|\d+', val_str)
    if m:
        try: return float(m.group())
        except: return None
    return None

def generate_ai_projection(event):
    title = event.get('title', '').lower()
    actual_str = event.get('actual', '')
    forecast_str = event.get('estimate', '')
    actual_val = parse_number(actual_str)
    forecast_val = parse_number(forecast_str)
    
    bullish = "Dato in linea con le attese, il mercato prezza la pre-stabilità."
    bearish = "Possibile presa di profitto se i dati tecnici interni deludono."
    summary = "L'algoritmo rileva volatilità standard. Attenzione ai falsi breakout."
    
    if actual_val is not None and forecast_val is not None:
        diff = actual_val - forecast_val
        is_beat = diff > 0
        
        if "inflazion" in title or "cpi" in title or "pce" in title or "prezzi" in title:
            if is_beat:
                bullish = "Surprise Inflattiva! Il Dollaro (USD) potrebbe schizzare a rialzo."
                bearish = "L'azionario subirà Pressione Ribassista per paura di tassi alti."
                summary = f"Scostamento rispetto alle attese: {diff:+.2f}. Inflazione ostica."
            elif diff < 0:
                bullish = "Inflazione in calo: l'Azionario (Tech) e Cripto festeggiano."
                bearish = "Il Dollaro Index (DXY) scende rapidamente, rompendo i supporti."
                summary = f"Scostamento: {diff:+.2f}. Disinflazione confermata."
                
        elif "disoccupazion" in title or "sussidi" in title or "jobless" in title:
            if is_beat:
                bullish = "Bad news is Good news: chance di tassi inferiori in futuro."
                bearish = "Dollaro sotto pressione per prospettive macro in raffreddamento."
                summary = f"Scostamento: {diff:+.2f}. Mercato del lavoro in frenata netta."
            elif diff < 0:
                bullish = "Economia rovente (Dollaro UP). Nessun taglio tassi imminente."
                bearish = "Azionario in ritracciamento per via del lavoro troppo forte."
                summary = f"Scostamento: {diff:+.2f}. Dati occupazionali granitici."
                
        elif "pil" in title or "gdp" in title or "pmi" in title or "vendite" in title or "produzione" in title or "occupati" in title:
            if is_beat:
                bullish = "Soft Landing confermato: Bid su asset rischiosi e Cripto."
                bearish = "Flussi parziali in uscita dai beni rifugio strategici (Bonds)."
                summary = f"Scostamento positivo: {diff:+.2f}. Forza in espansione."
            elif diff < 0:
                bullish = "Possibile pivot delle Banche Centrali per sostenere la crescita."
                bearish = "Spettro recessivo. Oro e Titoli di Stato in forte accumulo."
                summary = f"Scostamento negativo: {diff:+.2f}. Rallentamento macro."
    return {
        "bullish": bullish,
        "bearish": bearish,
        "summary": summary
    }

def scrape_investing_calendar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()
        page.goto("https://it.investing.com/economic-calendar/", timeout=60000)
        page.wait_for_timeout(3000)
        page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
        try:
            page.evaluate("let b=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='Questa settimana');if(b)b.click();")
            page.wait_for_timeout(3000)
        except: pass
        
        events = []
        rows = page.locator("tr").all()
        current_date = ""
        for row in rows:
            text = row.inner_text().lower()
            if any(day in text for day in ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]):
                tds = row.locator("td, th").all()
                if len(tds) == 1:
                    current_date = tds[0].inner_text().strip()
                    continue
            tds = row.locator("td").all()
            if len(tds) >= 7:
                time = tds[0].inner_text().strip()
                country = tds[1].inner_text().strip()
                title = tds[2].inner_text().strip()
                impact_html = tds[3].inner_html()
                stars = impact_html.count('#181C21')
                impact = "low"
                if stars >= 3: impact = "high"
                elif stars == 2: impact = "medium"
                
                actual = tds[4].inner_text().strip()
                forecast = tds[5].inner_text().strip()
                prev = tds[6].inner_text().strip()
                
                if country and title:
                    norm_event = {
                        "date": current_date,
                        "time": time,
                        "country": country,
                        "title": title,
                        "impact": impact,
                        "actual": actual if actual else "-",
                        "estimate": forecast if forecast else "-",
                        "prev": prev if prev else "-" 
                    }
                    if impact == "high":
                        norm_event['ai_projection'] = generate_ai_projection(norm_event)
                    events.append(norm_event)
        browser.close()
        return events

print(f"Scraping...")
evs = scrape_investing_calendar()
print(f"Found {len(evs)} events.")
if len(evs) > 0:
    for e in evs:
         if e['impact'] == 'high':
             print(f"HIGH IMPACT: {e['title']}\n AI: {e['ai_projection']}\n")
