import sys
import json
import time
import re
import argparse
import warnings
from datetime import datetime
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator

# Suppress all warnings to stderr to avoid polluting stdout JSON
warnings.filterwarnings("ignore")
if not sys.warnoptions:
    warnings.simplefilter("ignore")

# Local simple cache for translations to avoid redundant API calls
_translation_cache = {}

def log_debug(msg):
    print(f"DEBUG: {msg}", file=sys.stderr)

def translate_it_to_en(text):
    if not text: return ""
    if text in _translation_cache:
        return _translation_cache[text]
    try:
        translated = GoogleTranslator(source='it', target='en').translate(text)
        _translation_cache[text] = translated
        return translated
    except:
        return text

def parse_val(val_str):
    """Clean percentage or K/M/B strings into floats for comparison."""
    if not val_str or val_str == '-' or val_str == '预计': return None
    try:
        # Remove %, commas for thousands, replace decimal comma with dot
        s = val_str.replace('%', '').replace(',', '').replace('.', '').replace(',', '.') # Handle European 1.234,56
        # Wait, simple replace for now
        s = re.sub(r'[^\d\.\-]', '', val_str.replace(',', '.'))
        return float(s)
    except:
        return None

def generate_ai_projection(event):
    """
    Simulates AI analysis of real data vs consensus.
    """
    title = event.get('title', '')
    actual_raw = event.get('actual', '')
    forecast_raw = event.get('forecast', '')
    
    actual = parse_val(actual_raw)
    forecast = parse_val(forecast_raw)
    
    is_inflation = any(x in title.lower() for x in ['cpi', 'inflazione', 'ppi', 'prezzi'])
    is_employment = any(x in title.lower() for x in ['disoccupazione', 'payroll', 'occupati', 'lavoro'])
    is_rates = any(x in title.lower() for x in ['tasso', 'interesse', 'fed', 'bce', 'rate'])

    bullish = "Trend di mercato positivo atteso se il dato supera le aspettative."
    bearish = "Rischio di correzione se il dato delude il consensus."
    summary = "Monitorare la volatilità sui peer cross correlati."

    if actual is not None and forecast is not None:
        diff = actual - forecast
        if is_inflation:
            if diff > 0:
                bullish = f"Inflazione ({actual_raw}) superiore al previsto ({forecast_raw}). Scenari: Dollaro in rafforzamento su aspettative di tassi alti."
                bearish = "Azionario e Oro sotto pressione per paura di politiche restrittive."
                summary = "Sentiment 'Hawkish'. Attenzione a sell-off su asset a rischio."
            else:
                bullish = f"Inflazione ({actual_raw}) inferiore al previsto ({forecast_raw}). Supporto per i mercati azionari."
                bearish = "Il Dollaro potrebbe indebolirsi su prospettive 'Dovish'."
                summary = "Dato rinfrescante per l'economia. Propensione al rischio in aumento."
        elif is_employment:
            if diff > 0: # More jobs
                bullish = f"Dato occupazione ({actual_raw}) batte le stime ({forecast_raw}). Economia resiliente."
                bearish = "Possibile timore inflazionistico se i salari spingono troppo."
                summary = "Mercato del lavoro forte. Segnale di stabilità per l'indice domestico."
            else:
                bullish = "Possibile pivot delle banche centrali più vicino."
                bearish = f"Occupazione ({actual_raw}) peggiore del previsto ({forecast_raw}). Segnale di rallentamento."
                summary = "Rischio recessivo. Gli investitori cercano rifugio nei bond."
        else:
            if diff > 0:
                summary = f"Dato reale ({actual_raw}) superiore al consensus ({forecast_raw}). Momentum rialzista."
            else:
                summary = f"Dato reale ({actual_raw}) inferiore al consensus ({forecast_raw}). Sentiment cauto."

    return {
        "bullish": bullish,
        "bearish": bearish,
        "summary": summary
    }

def scrape_investing_calendar(lang='it'):
    """
    Uses Playwright to scrape Investing.com economic calendar.
    Uses sync mode for simpler output capture in Node.js.
    """
    events = []
    
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080}
            )
            page = context.new_page()
            
            # Navigazione
            url = "https://it.investing.com/economic-calendar/"
            page.goto(url, timeout=90000)
            
            # Attesa caricamento tabella e rimozione ostacoli
            try:
                page.wait_for_selector("tr.datatable-v2_row__hkEus", timeout=20000)
            except:
                pass
            
            # Rimuovi Cookie Banner
            page.evaluate("let ot=document.getElementById('onetrust-consent-sdk');if(ot)ot.remove();")
            
            # Seleziona l'intero mese
            try:
                # 1. Prova il click diretto sul filtro "Questo mese" (se appare)
                selector_this_month = "#timeFrame_thisMonth"
                this_month_btn = page.query_selector(selector_this_month)
                
                if this_month_btn:
                    log_debug("Found #timeFrame_thisMonth, clicking...")
                    this_month_btn.click()
                else:
                    # 2. Fallback: Prova a cercare il testo nei bottoni
                    page.evaluate("""
                        let b = Array.from(document.querySelectorAll('button, a, span'))
                                     .find(e => e.innerText.includes('Questo mese') || e.innerText.includes('This month'));
                        if (b) b.click();
                    """)
                
                # 3. Fallback Estremo: Usa il Date Picker personalizzato se ancora non abbiamo il mese
                # Verifichiamo se siamo ancora in modalità "Oggi" o "Settimana" (opzionale, semplifichiamo forzando il range se possibile)
                # Calcoliamo inizio e fine mese corrente
                now = datetime.now()
                first_day = now.replace(day=1).strftime("%d/%m/%Y")
                import calendar
                last_day_num = calendar.monthrange(now.year, now.month)[1]
                last_day = now.replace(day=last_day_num).strftime("%d/%m/%Y")
                
                log_debug(f"Setting custom range: {first_day} - {last_day}")
                
                # Apri il picker se non è aperto
                if not page.is_visible("#startDate"):
                    page.click("#customDatePicker") # ID comune per il trigger del picker, o clicca il pulsante "Personalizza"
                    page.wait_for_timeout(1000)
                
                # Inserisci le date (usando evaluate per bypassare restrizioni di input)
                page.evaluate(f"""
                    document.getElementById('startDate').value = '{first_day}';
                    document.getElementById('endDate').value = '{last_day}';
                    let applyBtn = document.getElementById('applyBtn');
                    if (applyBtn) applyBtn.click();
                """)
                
                # Attesa refresh AJAX
                page.wait_for_timeout(8000)
                page.wait_for_selector("tr.datatable-v2_row__hkEus", timeout=15000)
            except Exception as e:
                log_debug(f"Warning during month selection: {e}")

            html = page.content()
            soup = BeautifulSoup(html, 'html.parser')
            browser.close()

            # Estrazione Righe
            rows = soup.find_all("tr", class_=re.compile(r"datatable-v2_row__hkEus"))
            
            current_date = ""
            for row in rows:
                # Caso Riga Data: martedì 17 marzo 2026
                if "colspan" in str(row):
                    date_text = row.get_text(strip=True)
                    # Normalizza in YYYY-MM-DD (simulato per il frontend)
                    # Es: "lunedì 16 marzo 2026"
                    match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})', date_text)
                    if match:
                        d, m_name, y = match.groups()
                        months_it = {
                            'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
                            'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
                            'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12',
                            'january': '01', 'february': '02', 'march': '03', 'april': '04',
                            'may': '05', 'june': '06', 'july': '07', 'august': '08',
                            'september': '09', 'october': '10', 'november': '11', 'december': '12'
                        }
                        m = months_it.get(m_name.lower(), '01')
                        current_date = f"{y}-{m}-{d.zfill(2)}"
                    continue

                # Caso Riga Evento
                tds = row.find_all("td")
                # Warren UI Indexing: 1=Ora, 2=Valuta, 3=Evento, 4=Impatto, 5=Attuale, 6=Previsto, 7=Precedente
                if len(tds) >= 8:
                    evt_time = tds[1].get_text(strip=True)
                    country = tds[2].get_text(strip=True)
                    
                    # Titolo (TD 3 ha il link)
                    title_div = tds[3].find("div", class_=re.compile("max-w"))
                    title = title_div.get_text(strip=True) if title_div else tds[3].get_text(strip=True)
                    
                    # Pulizia titolo (rimuove Att: Prev: mobili se presenti)
                    title = title.split("Att:")[0].strip()

                    # Impatto (TD 4 ha le stelle)
                    # Cerchiamo gli SVG con opacity-60 (attivi)
                    impact_td = tds[4]
                    active_stars = len(impact_td.find_all("svg", class_=re.compile("opacity-60")))
                    impact_map = {1: 'low', 2: 'medium', 3: 'high'}
                    impact = impact_map.get(active_stars, 'low')

                    # Dati Numerici
                    actual = tds[5].get_text(strip=True)
                    forecast = tds[6].get_text(strip=True)
                    prev = tds[7].get_text(strip=True)

                    event_obj = {
                        "date": current_date,
                        "time": evt_time,
                        "country": country,
                        "title": title,
                        "impact": impact,
                        "actual": actual,
                        "estimate": forecast,
                        "prev": prev
                    }

                    # Se High Impact, genera AI Projection
                    if impact == 'high':
                        # Traduci in IT se necessario (già in IT da it.investing.com)
                        # Ma per logica AI English interna potremmo voler EN.
                        # Qui facciamo IT -> IT Projection direttamente.
                        event_obj["ai_projection"] = generate_ai_projection(event_obj)

                    events.append(event_obj)

        except Exception as e:
            print(f"DEBUG SCRAPER ERROR: {str(e)}", file=sys.stderr)
            return []

    return events

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="it")
    # Ignoriamo start/end/key ma li accettiamo per compatibilità con api.js legacy
    parser.add_argument("--start", help="Ignored")
    parser.add_argument("--end", help="Ignored")
    parser.add_argument("--key", help="Ignored")
    args = parser.parse_args()

    results = scrape_investing_calendar(lang=args.lang)
    print(json.dumps({"success": True, "events": results}))
