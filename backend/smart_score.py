import yfinance as yf
import pandas as pd
import json
import datetime
import math
import warnings

# Disable pandas warnings
warnings.filterwarnings('ignore')

def _clamp(val, lo, hi):
    """Clamp a value to [lo, hi]."""
    return max(lo, min(hi, val))

def calculate_smart_score(ticker_symbol):
    """
    Calcola lo Smart Score completo (100 punti) con granularità 1:1.
    Ogni sub-score usa interpolazione continua per massima precisione.
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
        
        # --- 1a. EMA Proximity Score (0..10) ---
        # Score is proportional to how far the price deviates from EMA50.
        # 0% deviation = 0 pts; >=3% deviation = 10 pts (linear scale).
        ema_pct_diff = abs(current_price - ema_50) / ema_50 if ema_50 > 0 else 0
        ema_score = _clamp(ema_pct_diff / 0.03, 0, 1) * 10

        trend = "Neutral"
        if current_price > (ema_50 * 1.001):
            trend = "Long"
        elif current_price < (ema_50 * 0.999):
            trend = "Short"

        # --- 1b. Fibonacci Score (0..15) ---
        last_30 = hist.iloc[-30:]
        low_30 = float(last_30['Low'].min())
        high_30 = float(last_30['High'].max())
        diff_30 = high_30 - low_30
        fib_score = 0.0
        fib_level_touched = None

        if diff_30 > 0 and trend != "Neutral":
            levels = {
                "38.2%": high_30 - 0.382 * diff_30 if trend == "Long" else low_30 + 0.382 * diff_30,
                "50.0%": high_30 - 0.5 * diff_30 if trend == "Long" else low_30 + 0.5 * diff_30,
                "61.8%": high_30 - 0.618 * diff_30 if trend == "Long" else low_30 + 0.618 * diff_30
            }
            # Give graduated points based on proximity to nearest Fibonacci level
            # Exact touch = 15 pts; 2% away = ~7 pts; >4% away = ~0 pts
            tolerance_pct = 0.04 * current_price  # 4% price window
            for name, val in levels.items():
                distance = abs(current_price - val)
                if distance <= tolerance_pct:
                    proximity = 1.0 - (distance / tolerance_pct)
                    level_score = proximity * 15
                    if level_score > fib_score:
                        fib_score = level_score
                        fib_level_touched = name

        # --- 1c. Volume & RSI Momentum Score (0..15) ---
        delta = hist_2y['Close'].diff()
        gain = delta.where(delta > 0, 0).ewm(alpha=1/14, adjust=False).mean()
        loss = (-delta.where(delta < 0, 0)).ewm(alpha=1/14, adjust=False).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs.iloc[-1])) if rs.iloc[-1] != -1 else 50
        vol_sma20 = float(hist_2y['Volume'].rolling(window=20).mean().iloc[-1])

        # RSI contribution (0..8): sigmoid-like mapping
        # Long trend: RSI 50→70 maps 0→8; Short trend: RSI 50→30 maps 0→8
        rsi_score = 0.0
        if trend == "Long":
            rsi_score = _clamp((rsi - 50) / 20, 0, 1) * 8
        elif trend == "Short":
            rsi_score = _clamp((50 - rsi) / 20, 0, 1) * 8

        # Volume contribution (0..7): proportional to volume above average
        vol_ratio = (current_volume / vol_sma20) if vol_sma20 > 0 else 1.0
        vol_score = _clamp((vol_ratio - 1.0) / 1.5, 0, 1) * 7  # 2.5x avg = full 7 pts

        momentum_score = rsi_score + vol_score

        tech_score = ema_score + fib_score + momentum_score

        # --- PILLAR 2: FONDAMENTALI / MACRO (MAX 30) ---
        fundamental_score = 0.0

        if asset_type == 'EQUITY':
            # Free Cash Flow score (0..10): proportional to FCF margin
            revenue = info.get('totalRevenue', 0) or 0
            fcf = info.get('freeCashflow', 0) or 0
            if revenue > 0 and fcf > 0:
                fcf_margin = fcf / revenue
                fundamental_score += _clamp(fcf_margin / 0.15, 0, 1) * 10  # 15% FCF margin = full 10
            
            # Debt/Equity score (0..10): lower is better
            debt_to_equity = info.get('debtToEquity')
            if debt_to_equity is None:
                fundamental_score += 8  # No debt reported = assume good
            else:
                # D/E 0 = 10pts, D/E 200+ = 0pts
                fundamental_score += _clamp(1 - (debt_to_equity / 200), 0, 1) * 10

            # Earnings Growth score (0..10): proportional to growth rate
            eg = info.get('earningsGrowth', 0) or 0
            # 0% growth = 0pts, >=30% growth = 10pts
            fundamental_score += _clamp(eg / 0.30, 0, 1) * 10

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
                    # Interest rate differential: -4..+4 range → 0..30 pts
                    fundamental_score = _clamp((diff + 4) / 8, 0, 1) * 30
                else:
                    fundamental_score = 15
            except:
                fundamental_score = 15
        else:  # Crypto / Other
            # For crypto: use 52w performance as proxy
            if len(hist) >= 252:
                hist_1y = hist.iloc[-252:]
                yr_return = (float(hist_1y['Close'].iloc[-1]) / float(hist_1y['Close'].iloc[0])) - 1
                # -50% return → 0pts, +100% return → 30pts
                fundamental_score = _clamp((yr_return + 0.5) / 1.5, 0, 1) * 30
            else:
                fundamental_score = 15

        # --- PILLAR 3: STAGIONALITA & SENTIMENT (MAX 30) ---
        
        # --- 3a. Seasonality (0..15): proportional to average historical monthly return ---
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
        
        seasonality_score = 0.0
        if monthly_returns:
            avg_return = sum(monthly_returns) / len(monthly_returns)
            # -5% avg return → 0pts; +5% avg return → 15pts
            seasonality_score = _clamp((avg_return + 0.05) / 0.10, 0, 1) * 15
            
        # --- 3b. Sentiment (0..15): continuous mapping ---
        sentiment_score = 0.0
        if asset_type == 'EQUITY':
            rec = info.get('recommendationMean')
            if rec is not None:
                # rec: 1.0 (Strong Buy) → 15pts; 3.0 (Hold) → 0pts
                sentiment_score = _clamp((3.0 - rec) / 2.0, 0, 1) * 15
        else:
            # 52w Range position for non-equity: linear 0..15
            hist_1y = hist.iloc[-252:] if len(hist) >= 252 else hist
            low_52 = float(hist_1y['Low'].min())
            high_52 = float(hist_1y['High'].max())
            if (high_52 - low_52) > 0:
                pos = (current_price - low_52) / (high_52 - low_52)
                sentiment_score = pos * 15

        pillar3_score = seasonality_score + sentiment_score

        # --- FINAL ASSEMBLY ---
        total_score = int(round(tech_score + fundamental_score + pillar3_score))
        total_score = _clamp(total_score, 0, 100)
        
        hist_2y['SMA_200'] = hist_2y['Close'].rolling(window=200).mean()
        sma_200 = float(hist_2y['SMA_200'].iloc[-1]) if len(hist_2y) >= 200 else None

        result = {
            "score": total_score,
            "scoreBreakdown": {
                "tech_score": round(tech_score, 1),
                "fundamental_score": round(fundamental_score, 1),
                "seasonality_score": round(pillar3_score, 1)
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
                "tech_score": round(tech_score, 1),
                "seasonality_score": round(pillar3_score, 1),
                "asset_score": round(fundamental_score, 1)
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
