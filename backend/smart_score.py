import yfinance as yf
import pandas as pd
import json
import datetime
import math
import warnings

# Disable pandas warnings
warnings.filterwarnings('ignore')

def calculate_smart_score(ticker_symbol):
    """
    Calcola lo Smart Score completo (100 punti)
    - Pillar 1: Analisi Tecnica (Max 40)
    - Pillar 2: Fondamentali / Macro (Max 30)
    - Pillar 3: Stagionalità / Sentiment (Max 30)
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        # Fetch 5 years to handle seasonality and 52w range
        hist = ticker.history(period="5y")

        if hist.empty:
            return json.dumps({"error": f"Nessun dato trovato per {ticker_symbol}"})

        current_price = float(hist['Close'].iloc[-1])
        current_volume = float(hist['Volume'].iloc[-1])
        info = ticker.info # Slow but needed for Pillar 2/3
        asset_type = info.get('quoteType', 'Unknown')

        # --- PILLAR 1: ANALISI TECNICA (MAX 40) ---
        hist_2y = hist.iloc[-504:].copy() # roughly 2 years of trading days
        hist_2y['EMA_50'] = hist_2y['Close'].ewm(span=50, adjust=False).mean()
        ema_50 = float(hist_2y['EMA_50'].iloc[-1])
        
        tech_score = 0
        trend = "Neutral"
        if current_price > (ema_50 * 1.001):
            tech_score += 10
            trend = "Long"
        elif current_price < (ema_50 * 0.999):
            tech_score += 10
            trend = "Short"

        # Fibonacci (30 days)
        last_30 = hist.iloc[-30:]
        low_30 = float(last_30['Low'].min())
        high_30 = float(last_30['High'].max())
        diff_30 = high_30 - low_30
        fib_score = 0
        fib_level_touched = None
        if diff_30 > 0 and trend != "Neutral":
            levels = {
                "38.2%": high_30 - 0.382 * diff_30 if trend == "Long" else low_30 + 0.382 * diff_30,
                "50.0%": high_30 - 0.5 * diff_30 if trend == "Long" else low_30 + 0.5 * diff_30,
                "61.8%": high_30 - 0.618 * diff_30 if trend == "Long" else low_30 + 0.618 * diff_30
            }
            tolerance = 0.005 * current_price
            for name, val in levels.items():
                if abs(current_price - val) <= tolerance:
                    fib_score = 15
                    fib_level_touched = name
                    break
        tech_score += fib_score

        # Volume & Momentum
        delta = hist_2y['Close'].diff()
        gain = delta.where(delta > 0, 0).ewm(alpha=1/14, adjust=False).mean()
        loss = (-delta.where(delta < 0, 0)).ewm(alpha=1/14, adjust=False).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs.iloc[-1])) if rs.iloc[-1] != -1 else 50
        vol_sma20 = float(hist_2y['Volume'].rolling(window=20).mean().iloc[-1])
        momentum_score = 0
        if fib_score > 0:
            if trend == "Long" and rsi > 50 and current_volume > vol_sma20:
                momentum_score = 15
            elif trend == "Short" and rsi < 50 and current_volume > vol_sma20:
                momentum_score = 15
        tech_score += momentum_score

        # --- PILLAR 2: FONDAMENTALI / MACRO (MAX 30) ---
        fundamental_score = 0
        if asset_type == 'EQUITY':
            if info.get('freeCashflow', 0) > 0: fundamental_score += 10
            debt_to_equity = info.get('debtToEquity')
            if debt_to_equity is None or debt_to_equity < 100: fundamental_score += 10
            if info.get('earningsGrowth', 0) > 0: fundamental_score += 10
        elif asset_type == 'CURRENCY':
            rates = {'USD': 5.5, 'EUR': 4.5, 'GBP': 5.25, 'JPY': 0.1, 'CHF': 1.75, 'AUD': 4.35, 'NZD': 5.5, 'CAD': 5.0}
            try:
                clean_ticker = ticker_symbol.replace('=X', '')
                c1 = clean_ticker[:3]
                c2 = clean_ticker[3:6]
                r1 = rates.get(c1)
                r2 = rates.get(c2)
                if r1 is not None and r2 is not None:
                    diff = r1 - r2
                    if diff >= 2.0: fundamental_score = 30
                    elif diff > 0: fundamental_score = 20
                    elif diff > -2.0: fundamental_score = 10
                    else: fundamental_score = 0
                else: fundamental_score = 15
            except:
                fundamental_score = 15
        else: # Crypto / Other
            fundamental_score = 15

        # --- PILLAR 3: STAGIONALITA & SENTIMENT (MAX 30) ---
        pillar3_score = 0
        # Seasonality (15 pts)
        now = datetime.datetime.now()
        current_month = now.month
        hist['Month'] = hist.index.month
        hist['Year'] = hist.index.year
        monthly_returns = []
        for year in range(now.year - 5, now.year):
            month_data = hist[(hist['Year'] == year) & (hist['Month'] == current_month)]
            if not month_data.empty and len(month_data) > 1:
                ret = (month_data['Close'].iloc[-1] / month_data['Close'].iloc[0]) - 1
                monthly_returns.append(ret)
        
        if monthly_returns and (sum(monthly_returns) / len(monthly_returns)) > 0:
            pillar3_score += 15
            
        # Sentiment (15 pts)
        sentiment_score = 0
        if asset_type == 'EQUITY':
            rec = info.get('recommendationMean')
            if rec is not None and rec <= 2.5: sentiment_score = 15
        else:
            # 52w Range position
            hist_1y = hist.iloc[-252:]
            low_52 = float(hist_1y['Low'].min())
            high_52 = float(hist_1y['High'].max())
            if (high_52 - low_52) > 0:
                pos = (current_price - low_52) / (high_52 - low_52)
                if pos > 0.5: sentiment_score = 15
        pillar3_score += sentiment_score

        # --- FINAL ASSEMBLY ---
        total_score = int(tech_score + fundamental_score + pillar3_score)
        
        hist_2y['SMA_200'] = hist_2y['Close'].rolling(window=200).mean()
        sma_200 = float(hist_2y['SMA_200'].iloc[-1]) if len(hist_2y) >= 200 else None

        result = {
            "score": total_score,
            "scoreBreakdown": {
                "tech_score": tech_score,
                "fundamental_score": fundamental_score,
                "seasonality_score": pillar3_score
            },
            "raw_data": {
                "price": round(current_price, 4),
                "rsi": round(float(rsi), 2),
                "ema_50": round(ema_50, 4),
                "sma_200": round(sma_200, 4) if sma_200 else None,
                "fib_level_touched": fib_level_touched,
                "trend": trend,
                "volume_vs_avg": round(current_volume / vol_sma20, 2) if vol_sma20 > 0 else 0,
                "asset_type_detected": asset_type,
                "tech_score": tech_score,
                "seasonality_score": pillar3_score,
                "asset_score": fundamental_score
            }
        }
        
        return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    import sys
    test_tickers = sys.argv[1:] if len(sys.argv) > 1 else ["AAPL", "BTC-USD", "EURUSD=X"]
    for t in test_tickers:
        print(calculate_smart_score(t))
