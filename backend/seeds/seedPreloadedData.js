const fs = require('fs');
const path = require('path');
const smartQuantEngine = require('../services/smartQuantEngine');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Sparkline generator helper
function generateSparkline(basePrice, var1D, length = 7) {
  const points = [];
  let current = basePrice * (1 - (var1D / 100) * 0.8);
  for (let i = 0; i < length - 1; i++) {
    const drift = (Math.random() - 0.48) * (basePrice * 0.008);
    current += drift;
    points.push(parseFloat(current.toFixed(2)));
  }
  points.push(basePrice);
  return points;
}

// ── 1. DEFINITION OF RAW ASSETS FOR MARKETS SECTIONS ──────────────────────────

const SECTIONS_CONFIG = {
  usa: {
    label: 'USA',
    assets: [
      { ticker: 'S&P 500', yahooTicker: '^GSPC', price: 5648.40, var1D: 0.45, var1W: 1.85, var1M: 3.20, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Nasdaq 100', yahooTicker: '^IXIC', price: 17688.30, var1D: 0.82, var1W: 2.40, var1M: 4.10, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Dow Jones', yahooTicker: '^DJI', price: 40830.50, var1D: 0.15, var1W: 0.90, var1M: 1.80, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Russell 2000', yahooTicker: '^RUT', price: 2180.20, var1D: 1.10, var1W: 2.80, var1M: 4.50, category: 'INDICES', type: 'INDEX' },
      { ticker: 'VIX', yahooTicker: '^VIX', price: 15.20, var1D: -3.40, var1W: -8.50, var1M: -12.00, category: 'INDICES', type: 'INDEX' },
      { ticker: 'SPY', yahooTicker: 'SPY', price: 564.20, var1D: 0.42, var1W: 1.80, var1M: 3.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'QQQ', yahooTicker: 'QQQ', price: 485.60, var1D: 0.78, var1W: 2.30, var1M: 4.00, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'IWM', yahooTicker: 'IWM', price: 218.40, var1D: 1.05, var1W: 2.75, var1M: 4.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'DIA', yahooTicker: 'DIA', price: 408.20, var1D: 0.18, var1W: 0.95, var1M: 1.85, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'NVDA', yahooTicker: 'NVDA', price: 119.50, var1D: 2.15, var1W: 5.40, var1M: 8.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'AAPL', yahooTicker: 'AAPL', price: 222.80, var1D: 0.85, var1W: 2.10, var1M: 4.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'MSFT', yahooTicker: 'MSFT', price: 428.60, var1D: 0.65, var1W: 1.80, var1M: 3.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'AMZN', yahooTicker: 'AMZN', price: 186.40, var1D: 1.40, var1W: 3.20, var1M: 5.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'GOOGL', yahooTicker: 'GOOGL', price: 158.20, var1D: 0.45, var1W: 1.20, var1M: -0.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'META', yahooTicker: 'META', price: 518.30, var1D: 1.80, var1W: 4.60, var1M: 7.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'TSLA', yahooTicker: 'TSLA', price: 230.10, var1D: 3.10, var1W: 7.50, var1M: 11.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'BRK-B', yahooTicker: 'BRK-B', price: 450.20, var1D: 0.25, var1W: 0.90, var1M: 2.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'LLY', yahooTicker: 'LLY', price: 924.50, var1D: 1.20, var1W: 3.50, var1M: 7.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'AVGO', yahooTicker: 'AVGO', price: 165.80, var1D: 2.40, var1W: 5.80, var1M: 9.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'JPM', yahooTicker: 'JPM', price: 212.80, var1D: 0.35, var1W: 1.10, var1M: 2.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'V', yahooTicker: 'V', price: 284.50, var1D: 0.50, var1W: 1.40, var1M: 3.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'WMT', yahooTicker: 'WMT', price: 78.40, var1D: 0.40, var1W: 1.20, var1M: 3.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'XOM', yahooTicker: 'XOM', price: 114.20, var1D: -0.30, var1W: 0.80, var1M: -1.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'MA', yahooTicker: 'MA', price: 485.60, var1D: 0.60, var1W: 1.80, var1M: 4.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'AMD', yahooTicker: 'AMD', price: 152.40, var1D: 2.60, var1W: 6.10, var1M: 9.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'NFLX', yahooTicker: 'NFLX', price: 698.50, var1D: 1.10, var1W: 3.40, var1M: 6.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'ORCL', yahooTicker: 'ORCL', price: 162.30, var1D: 1.70, var1W: 4.20, var1M: 12.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'PLTR', yahooTicker: 'PLTR', price: 34.80, var1D: 3.80, var1W: 8.50, var1M: 18.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'COST', yahooTicker: 'COST', price: 885.00, var1D: 0.45, var1W: 1.50, var1M: 3.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'HD', yahooTicker: 'HD', price: 375.40, var1D: 0.30, var1W: 1.10, var1M: 2.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'BAC', yahooTicker: 'BAC', price: 39.80, var1D: 0.40, var1W: 1.30, var1M: 2.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'DIS', yahooTicker: 'DIS', price: 92.50, var1D: 0.60, var1W: 1.90, var1M: 1.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'CRM', yahooTicker: 'CRM', price: 254.20, var1D: 1.05, var1W: 2.80, var1M: 4.60, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'ADBE', yahooTicker: 'ADBE', price: 540.60, var1D: 0.85, var1W: 2.20, var1M: 3.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'INTC', yahooTicker: 'INTC', price: 21.50, var1D: 1.15, var1W: 2.80, var1M: -4.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'QCOM', yahooTicker: 'QCOM', price: 168.20, var1D: 1.45, var1W: 3.40, var1M: 5.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'UBER', yahooTicker: 'UBER', price: 72.80, var1D: 2.10, var1W: 4.80, var1M: 9.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'NOW', yahooTicker: 'NOW', price: 885.00, var1D: 1.25, var1W: 3.60, var1M: 7.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'IBM', yahooTicker: 'IBM', price: 215.40, var1D: 0.65, var1W: 2.10, var1M: 6.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'GS', yahooTicker: 'GS', price: 485.20, var1D: 0.85, var1W: 2.40, var1M: 5.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'MS', yahooTicker: 'MS', price: 102.50, var1D: 0.70, var1W: 1.90, var1M: 4.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'MCD', yahooTicker: 'MCD', price: 298.50, var1D: 0.40, var1W: 1.10, var1M: 3.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'NKE', yahooTicker: 'NKE', price: 82.40, var1D: 0.55, var1W: 1.40, var1M: -1.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'PG', yahooTicker: 'PG', price: 174.20, var1D: 0.25, var1W: 0.85, var1M: 2.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'KO', yahooTicker: 'KO', price: 71.80, var1D: 0.30, var1W: 0.90, var1M: 2.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'PEP', yahooTicker: 'PEP', price: 176.50, var1D: 0.35, var1W: 0.80, var1M: 1.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'UNH', yahooTicker: 'UNH', price: 588.40, var1D: 0.60, var1W: 1.80, var1M: 4.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'JNJ', yahooTicker: 'JNJ', price: 165.20, var1D: 0.20, var1W: 0.70, var1M: 1.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'ABBV', yahooTicker: 'ABBV', price: 194.50, var1D: 0.50, var1W: 1.50, var1M: 3.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'MRK', yahooTicker: 'MRK', price: 116.80, var1D: 0.35, var1W: 1.10, var1M: 2.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'CVX', yahooTicker: 'CVX', price: 146.50, var1D: -0.20, var1W: 0.90, var1M: -0.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'CAT', yahooTicker: 'CAT', price: 372.40, var1D: 1.10, var1W: 3.10, var1M: 6.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'GE', yahooTicker: 'GE', price: 188.60, var1D: 1.30, var1W: 3.50, var1M: 7.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'BA', yahooTicker: 'BA', price: 156.20, var1D: -0.80, var1W: -2.10, var1M: -5.40, category: 'EQUITY', type: 'EQUITY' }
    ]
  },
  europa: {
    label: 'Europa',
    assets: [
      { ticker: 'DAX 40', yahooTicker: '^GDAXI', price: 18650.20, var1D: 0.55, var1W: 1.60, var1M: 2.80, category: 'INDICES', type: 'INDEX' },
      { ticker: 'CAC 40', yahooTicker: '^FCHI', price: 7490.80, var1D: 0.32, var1W: 1.10, var1M: 1.90, category: 'INDICES', type: 'INDEX' },
      { ticker: 'FTSE 100', yahooTicker: '^FTSE', price: 8275.40, var1D: 0.28, var1W: 0.85, var1M: 1.40, category: 'INDICES', type: 'INDEX' },
      { ticker: 'FTSE MIB', yahooTicker: 'FTSEMIB.MI', price: 33700.10, var1D: 0.65, var1W: 1.90, var1M: 3.40, category: 'INDICES', type: 'INDEX' },
      { ticker: 'IBEX 35', yahooTicker: '^IBEX', price: 11450.60, var1D: 0.42, var1W: 1.30, var1M: 2.20, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Euro Stoxx 50', yahooTicker: '^STOXX50E', price: 4850.30, var1D: 0.48, var1W: 1.45, var1M: 2.60, category: 'INDICES', type: 'INDEX' },
      { ticker: 'ASML', yahooTicker: 'ASML', price: 810.00, var1D: 1.15, var1W: 2.90, var1M: 4.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Novo Nordisk', yahooTicker: 'NVO', price: 132.80, var1D: 0.50, var1W: 1.60, var1M: 3.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Ferrari', yahooTicker: 'RACE', price: 442.00, var1D: 0.90, var1W: 2.80, var1M: 5.60, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'SAP', yahooTicker: 'SAP', price: 198.50, var1D: 0.75, var1W: 2.20, var1M: 4.30, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'LVMH', yahooTicker: 'MC.PA', price: 652.00, var1D: -0.40, var1W: 0.80, var1M: 1.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Siemens', yahooTicker: 'SIE.DE', price: 172.40, var1D: 0.60, var1W: 1.80, var1M: 3.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'TotalEnergies', yahooTicker: 'TTE.PA', price: 62.10, var1D: -0.25, var1W: 0.60, var1M: -0.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Sanofi', yahooTicker: 'SAN.PA', price: 104.20, var1D: 0.35, var1W: 1.10, var1M: 2.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Allianz', yahooTicker: 'ALV.DE', price: 284.00, var1D: 0.50, var1W: 1.40, var1M: 3.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Schneider Electric', yahooTicker: 'SU.PA', price: 238.50, var1D: 0.80, var1W: 2.40, var1M: 4.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Airbus', yahooTicker: 'AIR.PA', price: 135.20, var1D: 0.40, var1W: 1.20, var1M: 2.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Enel', yahooTicker: 'ENEL.MI', price: 6.95, var1D: 0.30, var1W: 0.90, var1M: 2.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Eni', yahooTicker: 'ENI.MI', price: 14.30, var1D: -0.15, var1W: 0.50, var1M: -0.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Intesa Sanpaolo', yahooTicker: 'ISP.MI', price: 3.78, var1D: 0.70, var1W: 2.10, var1M: 4.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'UniCredit', yahooTicker: 'UCG.MI', price: 38.20, var1D: 1.10, var1W: 3.20, var1M: 6.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Stellantis', yahooTicker: 'STLAM.MI', price: 13.80, var1D: -0.60, var1W: -1.80, var1M: -3.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Bayer', yahooTicker: 'BAYN.DE', price: 28.50, var1D: 0.20, var1W: 0.50, var1M: 1.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'BASF', yahooTicker: 'BAS.DE', price: 45.30, var1D: 0.35, var1W: 1.00, var1M: 1.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Mercedes-Benz', yahooTicker: 'MBG.DE', price: 58.90, var1D: -0.30, var1W: 0.40, var1M: -1.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'BMW', yahooTicker: 'BMW.DE', price: 78.40, var1D: -0.20, var1W: 0.60, var1M: -0.90, category: 'EQUITY', type: 'EQUITY' }
    ]
  },
  asia: {
    label: 'Asia',
    assets: [
      { ticker: 'Nikkei 225', yahooTicker: '^N225', price: 36580.00, var1D: 1.20, var1W: 3.10, var1M: 2.50, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Hang Seng', yahooTicker: '^HSI', price: 17420.00, var1D: 0.75, var1W: 1.80, var1M: 1.10, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Shanghai Comp', yahooTicker: '000001.SS', price: 2720.00, var1D: 0.20, var1W: 0.60, var1M: -0.80, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Straits Times', yahooTicker: '^STI', price: 3530.00, var1D: 0.35, var1W: 1.20, var1M: 2.10, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Nifty 50', yahooTicker: '^BSESN', price: 82890.00, var1D: 0.40, var1W: 1.50, var1M: 3.80, category: 'INDICES', type: 'INDEX' },
      { ticker: 'TSMC', yahooTicker: 'TSM', price: 172.50, var1D: 1.90, var1W: 4.80, var1M: 7.60, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Alibaba', yahooTicker: 'BABA', price: 84.50, var1D: 0.80, var1W: 2.40, var1M: 5.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Toyota Motor', yahooTicker: 'TM', price: 182.40, var1D: 0.60, var1W: 1.80, var1M: 2.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Sony Group', yahooTicker: 'SONY', price: 92.50, var1D: 0.75, var1W: 2.20, var1M: 3.80, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Tencent Holdings', yahooTicker: 'TCEHY', price: 48.20, var1D: 1.10, var1W: 3.40, var1M: 6.20, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Meituan', yahooTicker: 'MPNGF', price: 15.60, var1D: 1.40, var1W: 4.10, var1M: 8.50, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Infosys', yahooTicker: 'INFY', price: 23.40, var1D: 0.50, var1W: 1.60, var1M: 3.10, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'JD.com', yahooTicker: 'JD', price: 26.80, var1D: 1.25, var1W: 3.80, var1M: 5.90, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'Baidu', yahooTicker: 'BIDU', price: 86.20, var1D: 0.70, var1W: 2.10, var1M: 3.40, category: 'EQUITY', type: 'EQUITY' },
      { ticker: 'PDD Holdings', yahooTicker: 'PDD', price: 98.40, var1D: 2.10, var1W: 5.60, var1M: 9.80, category: 'EQUITY', type: 'EQUITY' }
    ]
  },
  forex: {
    label: 'Forex',
    assets: [
      { ticker: 'EUR/USD', yahooTicker: 'EURUSD=X', price: 1.1085, var1D: 0.18, var1W: 0.45, var1M: 1.20, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/USD', yahooTicker: 'GBPUSD=X', price: 1.3140, var1D: 0.22, var1W: 0.60, var1M: 1.50, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'USD/JPY', yahooTicker: 'USDJPY=X', price: 141.80, var1D: -0.45, var1W: -1.80, var1M: -3.20, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'USD/CHF', yahooTicker: 'USDCHF=X', price: 0.8490, var1D: -0.15, var1W: -0.50, var1M: -1.10, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'USD/CAD', yahooTicker: 'USDCAD=X', price: 1.3570, var1D: -0.12, var1W: -0.40, var1M: -0.90, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'AUD/USD', yahooTicker: 'AUDUSD=X', price: 0.6725, var1D: 0.35, var1W: 1.10, var1M: 2.10, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'NZD/USD', yahooTicker: 'NZDUSD=X', price: 0.6190, var1D: 0.28, var1W: 0.95, var1M: 1.80, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/GBP', yahooTicker: 'EURGBP=X', price: 0.8435, var1D: -0.05, var1W: -0.15, var1M: -0.30, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/JPY', yahooTicker: 'EURJPY=X', price: 157.20, var1D: -0.28, var1W: -1.35, var1M: -2.10, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/CHF', yahooTicker: 'EURCHF=X', price: 0.9410, var1D: 0.05, var1W: -0.20, var1M: -0.60, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/CAD', yahooTicker: 'EURCAD=X', price: 1.5040, var1D: 0.08, var1W: 0.15, var1M: 0.40, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/AUD', yahooTicker: 'EURAUD=X', price: 1.6480, var1D: -0.18, var1W: -0.65, var1M: -0.90, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'EUR/NZD', yahooTicker: 'EURNZD=X', price: 1.7910, var1D: -0.10, var1W: -0.50, var1M: -0.70, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/JPY', yahooTicker: 'GBPJPY=X', price: 186.30, var1D: -0.22, var1W: -1.20, var1M: -1.80, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/CHF', yahooTicker: 'GBPCHF=X', price: 1.1155, var1D: 0.06, var1W: 0.10, var1M: 0.35, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/CAD', yahooTicker: 'GBPCAD=X', price: 1.7820, var1D: 0.12, var1W: 0.25, var1M: 0.60, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/AUD', yahooTicker: 'GBPAUD=X', price: 1.9540, var1D: -0.14, var1W: -0.45, var1M: -0.60, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'GBP/NZD', yahooTicker: 'GBPNZD=X', price: 2.1230, var1D: -0.08, var1W: -0.30, var1M: -0.45, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'AUD/JPY', yahooTicker: 'AUDJPY=X', price: 95.35, var1D: -0.10, var1W: -0.70, var1M: -1.10, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'AUD/CAD', yahooTicker: 'AUDCAD=X', price: 0.9125, var1D: 0.22, var1W: 0.65, var1M: 1.15, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'AUD/CHF', yahooTicker: 'AUDCHF=X', price: 0.5710, var1D: 0.18, var1W: 0.55, var1M: 0.95, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'AUD/NZD', yahooTicker: 'AUDNZD=X', price: 1.0865, var1D: 0.08, var1W: 0.20, var1M: 0.30, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'NZD/JPY', yahooTicker: 'NZDJPY=X', price: 87.75, var1D: -0.15, var1W: -0.85, var1M: -1.35, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'NZD/CAD', yahooTicker: 'NZDCAD=X', price: 0.8400, var1D: 0.15, var1W: 0.45, var1M: 0.80, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'NZD/CHF', yahooTicker: 'NZDCHF=X', price: 0.5255, var1D: 0.12, var1W: 0.38, var1M: 0.65, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'CAD/JPY', yahooTicker: 'CADJPY=X', price: 104.50, var1D: -0.32, var1W: -1.40, var1M: -2.25, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'CAD/CHF', yahooTicker: 'CADCHF=X', price: 0.6255, var1D: -0.05, var1W: -0.12, var1M: -0.22, category: 'FOREX', type: 'CURRENCY' },
      { ticker: 'CHF/JPY', yahooTicker: 'CHFJPY=X', price: 167.05, var1D: -0.30, var1W: -1.30, var1M: -2.10, category: 'FOREX', type: 'CURRENCY' }
    ]
  },
  crypto: {
    label: 'Crypto',
    assets: [
      { ticker: 'Bitcoin', yahooTicker: 'BTC-USD', price: 60450.00, var1D: 2.80, var1W: 6.50, var1M: 8.90, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Ethereum', yahooTicker: 'ETH-USD', price: 2420.00, var1D: 2.10, var1W: 5.20, var1M: 6.40, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Solana', yahooTicker: 'SOL-USD', price: 138.50, var1D: 3.90, var1W: 9.80, var1M: 14.20, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'BNB', yahooTicker: 'BNB-USD', price: 552.00, var1D: 1.80, var1W: 4.10, var1M: 5.90, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'XRP', yahooTicker: 'XRP-USD', price: 0.5850, var1D: 2.40, var1W: 5.80, var1M: 7.20, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Cardano', yahooTicker: 'ADA-USD', price: 0.3550, var1D: 2.10, var1W: 4.90, var1M: 6.10, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Chainlink', yahooTicker: 'LINK-USD', price: 11.20, var1D: 3.40, var1W: 8.10, var1M: 11.50, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Avalanche', yahooTicker: 'AVAX-USD', price: 24.80, var1D: 4.20, var1W: 10.50, var1M: 15.80, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Dogecoin', yahooTicker: 'DOGE-USD', price: 0.1060, var1D: 2.90, var1W: 7.20, var1M: 9.50, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Polkadot', yahooTicker: 'DOT-USD', price: 4.35, var1D: 1.90, var1W: 4.50, var1M: 5.80, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'NEAR', yahooTicker: 'NEAR-USD', price: 4.45, var1D: 4.80, var1W: 11.20, var1M: 16.90, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Uniswap', yahooTicker: 'UNI-USD', price: 6.90, var1D: 3.10, var1W: 7.40, var1M: 10.20, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Litecoin', yahooTicker: 'LTC-USD', price: 65.50, var1D: 1.40, var1W: 3.20, var1M: 4.50, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Polygon POL', yahooTicker: 'POL-USD', price: 0.38, var1D: 2.20, var1W: 5.10, var1M: 7.80, category: 'CRYPTO', type: 'CRYPTOCURRENCY' },
      { ticker: 'Toncoin', yahooTicker: 'TON-USD', price: 5.45, var1D: 3.10, var1W: 6.80, var1M: 11.20, category: 'CRYPTO', type: 'CRYPTOCURRENCY' }
    ]
  },
  commodities: {
    label: 'Commodities',
    assets: [
      { ticker: 'Oro Spot', yahooTicker: 'GC=F', price: 2585.50, var1D: 0.75, var1W: 2.10, var1M: 4.80, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Argento Spot', yahooTicker: 'SI=F', price: 30.80, var1D: 1.45, var1W: 3.90, var1M: 7.20, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Petrolio WTI', yahooTicker: 'CL=F', price: 69.20, var1D: 1.10, var1W: 2.40, var1M: -2.50, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Petrolio Brent', yahooTicker: 'BZ=F', price: 72.80, var1D: 1.05, var1W: 2.30, var1M: -2.20, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Gas Naturale', yahooTicker: 'NG=F', price: 2.32, var1D: 2.20, var1W: 5.40, var1M: 8.10, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Rame', yahooTicker: 'HG=F', price: 4.24, var1D: 0.85, var1W: 2.20, var1M: 3.50, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Platino Spot', yahooTicker: 'PL=F', price: 995.00, var1D: 0.60, var1W: 1.80, var1M: 3.10, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Palladio Spot', yahooTicker: 'PA=F', price: 1040.00, var1D: 0.70, var1W: 1.90, var1M: 3.40, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Alluminio', yahooTicker: 'ALI=F', price: 2540.00, var1D: 0.50, var1W: 1.40, var1M: 2.80, category: 'COMMODITIES', type: 'FUTURE' },
      { ticker: 'Uranium ETF', yahooTicker: 'URA', price: 28.90, var1D: 1.60, var1W: 4.20, var1M: 6.80, category: 'COMMODITIES', type: 'COMMODITIES' },
      { ticker: 'Agriculture', yahooTicker: 'DBA', price: 24.60, var1D: 0.40, var1W: 1.10, var1M: 2.30, category: 'COMMODITIES', type: 'COMMODITIES' },
      { ticker: 'Commodities Index', yahooTicker: 'DBC', price: 22.10, var1D: 0.80, var1W: 1.90, var1M: 1.20, category: 'COMMODITIES', type: 'COMMODITIES' },
      { ticker: 'SPDR Gold ETF', yahooTicker: 'GLD', price: 238.40, var1D: 0.72, var1W: 2.05, var1M: 4.70, category: 'COMMODITIES', type: 'COMMODITIES' },
      { ticker: 'iShares Silver ETF', yahooTicker: 'SLV', price: 28.20, var1D: 1.40, var1W: 3.80, var1M: 7.10, category: 'COMMODITIES', type: 'COMMODITIES' },
      { ticker: 'US Oil Fund', yahooTicker: 'USO', price: 74.20, var1D: 1.00, var1W: 2.20, var1M: -2.30, category: 'COMMODITIES', type: 'COMMODITIES' }
    ]
  },
  developed: {
    label: 'Developed',
    assets: [
      { ticker: 'Canada TSX', yahooTicker: '^GSPTSE', price: 23580.00, var1D: 0.30, var1W: 1.10, var1M: 2.30, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Australia ASX', yahooTicker: '^AS51', price: 8120.00, var1D: 0.45, var1W: 1.35, var1M: 2.60, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Svizzera SMI', yahooTicker: '^SSMI', price: 12080.00, var1D: 0.25, var1W: 0.80, var1M: 1.50, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Svezia OMX', yahooTicker: '^OMX', price: 2570.00, var1D: 0.50, var1W: 1.40, var1M: 2.20, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Norvegia OSE', yahooTicker: '^OSLO', price: 1430.00, var1D: 0.38, var1W: 1.15, var1M: 1.90, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Europa ETF', yahooTicker: 'VGK', price: 68.40, var1D: 0.40, var1W: 1.20, var1M: 2.50, category: 'INDICES', type: 'EQUITY' },
      { ticker: 'Canada ETF', yahooTicker: 'EWC', price: 42.10, var1D: 0.25, var1W: 0.90, var1M: 1.80, category: 'INDICES', type: 'EQUITY' },
      { ticker: 'Australia ETF', yahooTicker: 'EWA', price: 26.30, var1D: 0.35, var1W: 1.10, var1M: 2.20, category: 'INDICES', type: 'EQUITY' },
      { ticker: 'Cina ETF', yahooTicker: 'MCHI', price: 45.20, var1D: 0.60, var1W: 1.40, var1M: 1.10, category: 'INDICES', type: 'EQUITY' }
    ]
  },
  emergenti: {
    label: 'Emergenti',
    assets: [
      { ticker: 'MSCI EM ETF', yahooTicker: 'EEM', price: 44.80, var1D: 0.60, var1W: 1.70, var1M: 2.40, category: 'INDICES', type: 'EQUITY' },
      { ticker: 'Brasile Bovespa', yahooTicker: '^BVSP', price: 134800.00, var1D: 0.70, var1W: 2.10, var1M: 3.50, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Messico IPC', yahooTicker: '^MXX', price: 52100.00, var1D: 0.40, var1W: 1.20, var1M: 1.80, category: 'INDICES', type: 'INDEX' },
      { ticker: 'Corea KOSPI', yahooTicker: '^KS11', price: 2580.00, var1D: 0.55, var1W: 1.60, var1M: 1.90, category: 'INDICES', type: 'INDEX' }
    ]
  }
};

const FACTORS_DATA = [
  { name: 'High Beta', ticker: 'SPHB', change: 1.45, value: 72 },
  { name: 'Value', ticker: 'VLUE', change: 0.65, value: 58 },
  { name: 'Growth', ticker: 'VUG', change: 1.15, value: 68 },
  { name: 'Momentum', ticker: 'MTUM', change: 1.80, value: 81 },
  { name: 'Defensive', ticker: 'DEF', change: -0.35, value: 44 }
];

// ── Per-asset realistic fundamental data for SmartQuant scoring ──────────────
const FUNDAMENTALS_MAP = {
  'NVDA':  { forwardPE: 32.5, pegRatio: 0.95, returnOnEquity: 0.85, profitMargins: 0.55 },
  'AAPL':  { forwardPE: 28.2, pegRatio: 2.80, returnOnEquity: 1.47, profitMargins: 0.26 },
  'MSFT':  { forwardPE: 30.1, pegRatio: 2.10, returnOnEquity: 0.38, profitMargins: 0.36 },
  'AMZN':  { forwardPE: 38.5, pegRatio: 1.45, returnOnEquity: 0.22, profitMargins: 0.08 },
  'GOOGL': { forwardPE: 21.4, pegRatio: 1.10, returnOnEquity: 0.28, profitMargins: 0.25 },
  'META':  { forwardPE: 22.8, pegRatio: 0.88, returnOnEquity: 0.32, profitMargins: 0.34 },
  'TSLA':  { forwardPE: 58.0, pegRatio: 3.20, returnOnEquity: 0.20, profitMargins: 0.11 },
  'SPY':   { forwardPE: 21.0, pegRatio: 1.50, returnOnEquity: 0.18, profitMargins: 0.12 },
  'QQQ':   { forwardPE: 26.0, pegRatio: 1.40, returnOnEquity: 0.24, profitMargins: 0.16 },
  'AMD':   { forwardPE: 42.3, pegRatio: 1.30, returnOnEquity: 0.04, profitMargins: 0.06 },
  'NFLX':  { forwardPE: 33.5, pegRatio: 1.55, returnOnEquity: 0.30, profitMargins: 0.22 },
  'JPM':   { forwardPE: 11.2, pegRatio: 1.80, returnOnEquity: 0.15, profitMargins: 0.35 },
  'V':     { forwardPE: 25.8, pegRatio: 1.90, returnOnEquity: 0.44, profitMargins: 0.52 },
  'BRK-B': { forwardPE: 19.5, pegRatio: 1.40, returnOnEquity: 0.14, profitMargins: 0.20 },
  'BRK.B': { forwardPE: 19.5, pegRatio: 1.40, returnOnEquity: 0.14, profitMargins: 0.20 },
  'LLY':   { forwardPE: 34.0, pegRatio: 1.25, returnOnEquity: 0.48, profitMargins: 0.28 },
  'AVGO':  { forwardPE: 27.5, pegRatio: 1.15, returnOnEquity: 0.26, profitMargins: 0.38 },
  'WMT':   { forwardPE: 26.0, pegRatio: 2.40, returnOnEquity: 0.21, profitMargins: 0.03 },
  'XOM':   { forwardPE: 13.5, pegRatio: 1.60, returnOnEquity: 0.18, profitMargins: 0.12 },
  'MA':    { forwardPE: 28.0, pegRatio: 1.70, returnOnEquity: 0.52, profitMargins: 0.45 },
  'ORCL':  { forwardPE: 24.5, pegRatio: 1.35, returnOnEquity: 0.35, profitMargins: 0.25 },
  'PLTR':  { forwardPE: 65.0, pegRatio: 2.10, returnOnEquity: 0.18, profitMargins: 0.16 },
  'TSM':   { forwardPE: 19.8, pegRatio: 0.92, returnOnEquity: 0.28, profitMargins: 0.40 },
  'ASML':  { forwardPE: 29.5, pegRatio: 1.40, returnOnEquity: 0.42, profitMargins: 0.28 },
  'BABA':  { forwardPE: 10.2, pegRatio: 0.85, returnOnEquity: 0.14, profitMargins: 0.16 },
  'NVO':   { forwardPE: 27.0, pegRatio: 1.30, returnOnEquity: 0.60, profitMargins: 0.34 },
  'RACE':  { forwardPE: 42.0, pegRatio: 2.50, returnOnEquity: 0.45, profitMargins: 0.24 },
  'COST':  { forwardPE: 46.0, pegRatio: 3.80, returnOnEquity: 0.29, profitMargins: 0.03 },
  'HD':    { forwardPE: 23.0, pegRatio: 2.10, returnOnEquity: 0.30, profitMargins: 0.10 },
  'BAC':   { forwardPE: 12.0, pegRatio: 1.50, returnOnEquity: 0.11, profitMargins: 0.26 },
  'DIS':   { forwardPE: 18.0, pegRatio: 1.20, returnOnEquity: 0.08, profitMargins: 0.07 },
  'CRM':   { forwardPE: 25.0, pegRatio: 1.45, returnOnEquity: 0.12, profitMargins: 0.14 },
  'ADBE':  { forwardPE: 26.5, pegRatio: 1.60, returnOnEquity: 0.32, profitMargins: 0.29 },
  'IWM':   { forwardPE: 18.2, pegRatio: 1.10, returnOnEquity: 0.12, profitMargins: 0.08 },
  'DIA':   { forwardPE: 19.5, pegRatio: 1.30, returnOnEquity: 0.22, profitMargins: 0.15 },
  'INTC':  { forwardPE: 21.0, pegRatio: 1.80, returnOnEquity: 0.05, profitMargins: 0.04 },
  'QCOM':  { forwardPE: 15.8, pegRatio: 1.10, returnOnEquity: 0.35, profitMargins: 0.24 },
  'UBER':  { forwardPE: 28.5, pegRatio: 1.15, returnOnEquity: 0.16, profitMargins: 0.08 },
  'NOW':   { forwardPE: 45.0, pegRatio: 1.60, returnOnEquity: 0.18, profitMargins: 0.14 },
  'IBM':   { forwardPE: 18.2, pegRatio: 2.10, returnOnEquity: 0.22, profitMargins: 0.12 },
  'GS':    { forwardPE: 12.4, pegRatio: 1.30, returnOnEquity: 0.12, profitMargins: 0.24 },
  'MS':    { forwardPE: 14.2, pegRatio: 1.40, returnOnEquity: 0.13, profitMargins: 0.20 },
  'MCD':   { forwardPE: 22.0, pegRatio: 2.40, returnOnEquity: 0.80, profitMargins: 0.32 },
  'NKE':   { forwardPE: 24.5, pegRatio: 1.90, returnOnEquity: 0.30, profitMargins: 0.10 },
  'PG':    { forwardPE: 23.8, pegRatio: 2.50, returnOnEquity: 0.32, profitMargins: 0.18 },
  'KO':    { forwardPE: 22.5, pegRatio: 2.60, returnOnEquity: 0.40, profitMargins: 0.24 },
  'PEP':   { forwardPE: 20.8, pegRatio: 2.20, returnOnEquity: 0.48, profitMargins: 0.11 },
  'UNH':   { forwardPE: 19.5, pegRatio: 1.45, returnOnEquity: 0.26, profitMargins: 0.06 },
  'JNJ':   { forwardPE: 16.0, pegRatio: 1.90, returnOnEquity: 0.22, profitMargins: 0.19 },
  'ABBV':  { forwardPE: 15.5, pegRatio: 1.35, returnOnEquity: 0.35, profitMargins: 0.15 },
  'MRK':   { forwardPE: 13.8, pegRatio: 1.20, returnOnEquity: 0.25, profitMargins: 0.22 },
  'CVX':   { forwardPE: 12.8, pegRatio: 1.70, returnOnEquity: 0.15, profitMargins: 0.10 },
  'CAT':   { forwardPE: 16.2, pegRatio: 1.40, returnOnEquity: 0.45, profitMargins: 0.16 },
  'GE':    { forwardPE: 26.0, pegRatio: 1.50, returnOnEquity: 0.18, profitMargins: 0.11 },
  'BA':    { forwardPE: 32.0, pegRatio: 2.00, returnOnEquity: -0.10, profitMargins: -0.04 },
  'VOO':   { forwardPE: 21.0, pegRatio: 1.50, returnOnEquity: 0.18, profitMargins: 0.12 },
  'VUG':   { forwardPE: 28.0, pegRatio: 1.60, returnOnEquity: 0.25, profitMargins: 0.18 },
  'SMH':   { forwardPE: 26.5, pegRatio: 1.10, returnOnEquity: 0.35, profitMargins: 0.28 },
  'XLK':   { forwardPE: 27.2, pegRatio: 1.35, returnOnEquity: 0.30, profitMargins: 0.22 },
  'XLF':   { forwardPE: 14.5, pegRatio: 1.50, returnOnEquity: 0.14, profitMargins: 0.25 },
  'XLV':   { forwardPE: 17.5, pegRatio: 1.60, returnOnEquity: 0.20, profitMargins: 0.12 }
};

// Generate realistic 60-day OHLC price history with proper trends
function generateRealisticHistory(basePrice, var1D, var1W, var1M, length = 60) {
  const quotes = [];
  const startPrice = basePrice / (1 + (var1M || 0) / 100);
  const dailyDrift = (basePrice - startPrice) / length;

  let price = startPrice;
  const volatility = basePrice * 0.012;

  for (let i = 0; i < length; i++) {
    const noise = (Math.random() - 0.46) * volatility;
    price += dailyDrift + noise;
    price = Math.max(price, basePrice * 0.65);

    const dayVol = price * (0.006 + Math.random() * 0.014);
    const high = price + dayVol * (0.5 + Math.random() * 0.5);
    const low = Math.max(price - dayVol * (0.5 + Math.random() * 0.5), 0.01);
    const open = price - dailyDrift * 0.4 + (Math.random() - 0.5) * volatility * 0.4;

    quotes.push({
      date: new Date(Date.now() - (length - i) * 86400000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
    });
  }
  quotes[quotes.length - 1].close = basePrice;
  quotes[quotes.length - 1].high = Math.max(quotes[quotes.length - 1].high, basePrice);
  return quotes;
}

// Helper to compute SmartScore using real engine with realistic data
function enrichAsset(raw) {
  const momentum = parseFloat((((raw.var1W || 0) * 0.4) + ((raw.var1M || 0) * 0.6)).toFixed(2));
  const sparkline = generateSparkline(raw.price, raw.var1D || 0, 7);

  const realisticQuotes = generateRealisticHistory(raw.price, raw.var1D, raw.var1W, raw.var1M, 60);

  const tickerFundamentals = FUNDAMENTALS_MAP[raw.ticker] || {};
  const mockQuote = {
    regularMarketPrice: raw.price,
    regularMarketChangePercent: raw.var1D || 0,
    quoteType: raw.type || 'EQUITY',
    trailingPE: tickerFundamentals.forwardPE || 22.4,
    forwardPE: tickerFundamentals.forwardPE || null,
    pegRatio: tickerFundamentals.pegRatio || null,
    returnOnEquity: tickerFundamentals.returnOnEquity || null,
    profitMargins: tickerFundamentals.profitMargins || null,
    priceToBook: 3.1
  };

  const quantResult = smartQuantEngine.calculateSmartScore({
    ticker: raw.ticker,
    quote: mockQuote,
    quotes: realisticQuotes,
    sector: raw.type || 'EQUITY',
    macroData: { regime: 'REFLAZIONE', score: 68, growthScore: 68, inflationScore: 52 }
  });

  return {
    ticker: raw.ticker,
    yahooTicker: raw.yahooTicker,
    name: raw.name || raw.ticker,
    price: raw.price,
    prezzo: raw.price,
    var1D: raw.var1D || 0,
    var1W: raw.var1W || 0,
    var1M: raw.var1M || 0,
    momentum: momentum,
    is7DUp: momentum >= 0,
    settore: raw.type || 'EQUITY',
    category: raw.category || 'EQUITY',
    rsi: quantResult.pillars.technical.data.rsi || 55,
    pe: quantResult.pillars.fundamental.data.pe || '-',
    smartScore: quantResult.smartScore,
    smartScoreLabel: quantResult.smartScoreLabel,
    scoreDelta: (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
    sparkline: sparkline,
    trend: quantResult.pillars.technical.data.trend || (momentum >= 0 ? 'Long' : 'Short'),
    fib_level_touched: 'None',
    volume_vs_avg: 1.15,
    tradeSetup: quantResult.tradeSetup,
    pillars: quantResult.pillars,
    breakdown: quantResult.breakdown
  };
}

function buildMarketsData() {
  const sections = {};
  for (const [key, sectionConfig] of Object.entries(SECTIONS_CONFIG)) {
    sections[key] = {
      label: sectionConfig.label,
      assets: sectionConfig.assets.map(enrichAsset).sort((a, b) => b.smartScore - a.smartScore)
    };
  }

  return {
    sections,
    factors: FACTORS_DATA,
    generatedAt: new Date().toISOString()
  };
}

// ── 2. DEFINITION OF DASHBOARD DATA (STRICTLY EQUITIES - NO VIX/GOLD IN EQUITIES) ───

const DASHBOARD_EQUITIES = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', yahooTicker: 'NVDA', price: 119.50, var1D: 2.15, var1W: 5.40, var1M: 8.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'AAPL', name: 'Apple Inc.', yahooTicker: 'AAPL', price: 222.80, var1D: 0.85, var1W: 2.10, var1M: 4.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', yahooTicker: 'MSFT', price: 428.60, var1D: 0.65, var1W: 1.80, var1M: 3.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', yahooTicker: 'AMZN', price: 186.40, var1D: 1.40, var1W: 3.20, var1M: 5.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', yahooTicker: 'GOOGL', price: 158.20, var1D: 0.45, var1W: 1.20, var1M: -0.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'META', name: 'Meta Platforms Inc.', yahooTicker: 'META', price: 518.30, var1D: 1.80, var1W: 4.60, var1M: 7.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'TSLA', name: 'Tesla Inc.', yahooTicker: 'TSLA', price: 230.10, var1D: 3.10, var1W: 7.50, var1M: 11.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'BRK-B', name: 'Berkshire Hathaway', yahooTicker: 'BRK-B', price: 450.20, var1D: 0.25, var1W: 0.90, var1M: 2.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', yahooTicker: 'LLY', price: 924.50, var1D: 1.20, var1W: 3.50, var1M: 7.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', yahooTicker: 'AVGO', price: 165.80, var1D: 2.40, var1W: 5.80, var1M: 9.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', yahooTicker: 'JPM', price: 212.80, var1D: 0.35, var1W: 1.10, var1M: 2.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'V', name: 'Visa Inc.', yahooTicker: 'V', price: 284.50, var1D: 0.50, var1W: 1.40, var1M: 3.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'WMT', name: 'Walmart Inc.', yahooTicker: 'WMT', price: 78.40, var1D: 0.40, var1W: 1.20, var1M: 3.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', yahooTicker: 'XOM', price: 114.20, var1D: -0.30, var1W: 0.80, var1M: -1.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'MA', name: 'Mastercard Incorporated', yahooTicker: 'MA', price: 485.60, var1D: 0.60, var1W: 1.80, var1M: 4.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', yahooTicker: 'AMD', price: 152.40, var1D: 2.60, var1W: 6.10, var1M: 9.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'NFLX', name: 'Netflix Inc.', yahooTicker: 'NFLX', price: 698.50, var1D: 1.10, var1W: 3.40, var1M: 6.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'ORCL', name: 'Oracle Corporation', yahooTicker: 'ORCL', price: 162.30, var1D: 1.70, var1W: 4.20, var1M: 12.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc.', yahooTicker: 'PLTR', price: 34.80, var1D: 3.80, var1W: 8.50, var1M: 18.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', yahooTicker: 'TSM', price: 172.50, var1D: 1.90, var1W: 4.80, var1M: 7.60, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'ASML', name: 'ASML Holding N.V.', yahooTicker: 'ASML', price: 810.00, var1D: 1.15, var1W: 2.90, var1M: 4.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'BABA', name: 'Alibaba Group Holding', yahooTicker: 'BABA', price: 84.50, var1D: 0.80, var1W: 2.40, var1M: 5.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'NVO', name: 'Novo Nordisk A/S', yahooTicker: 'NVO', price: 132.80, var1D: 0.50, var1W: 1.60, var1M: 3.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'RACE', name: 'Ferrari N.V.', yahooTicker: 'RACE', price: 442.00, var1D: 0.90, var1W: 2.80, var1M: 5.60, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'COST', name: 'Costco Wholesale Corp.', yahooTicker: 'COST', price: 885.00, var1D: 0.45, var1W: 1.50, var1M: 3.90, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'HD', name: 'The Home Depot Inc.', yahooTicker: 'HD', price: 375.40, var1D: 0.30, var1W: 1.10, var1M: 2.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'BAC', name: 'Bank of America Corp.', yahooTicker: 'BAC', price: 39.80, var1D: 0.40, var1W: 1.30, var1M: 2.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'DIS', name: 'The Walt Disney Company', yahooTicker: 'DIS', price: 92.50, var1D: 0.60, var1W: 1.90, var1M: 1.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'CRM', name: 'Salesforce Inc.', yahooTicker: 'CRM', price: 254.20, var1D: 1.05, var1W: 2.80, var1M: 4.60, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'ADBE', name: 'Adobe Inc.', yahooTicker: 'ADBE', price: 540.60, var1D: 0.85, var1W: 2.20, var1M: 3.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', yahooTicker: 'SPY', price: 564.20, var1D: 0.42, var1W: 1.80, var1M: 3.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', yahooTicker: 'QQQ', price: 485.60, var1D: 0.78, var1W: 2.30, var1M: 4.00, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', yahooTicker: 'IWM', price: 218.40, var1D: 1.05, var1W: 2.75, var1M: 4.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', yahooTicker: 'DIA', price: 408.20, var1D: 0.18, var1W: 0.95, var1M: 1.85, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'INTC', name: 'Intel Corporation', yahooTicker: 'INTC', price: 21.50, var1D: 1.15, var1W: 2.80, var1M: -4.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'QCOM', name: 'QUALCOMM Incorporated', yahooTicker: 'QCOM', price: 168.20, var1D: 1.45, var1W: 3.40, var1M: 5.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'UBER', name: 'Uber Technologies Inc.', yahooTicker: 'UBER', price: 72.80, var1D: 2.10, var1W: 4.80, var1M: 9.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'NOW', name: 'ServiceNow Inc.', yahooTicker: 'NOW', price: 885.00, var1D: 1.25, var1W: 3.60, var1M: 7.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'IBM', name: 'International Business Machines', yahooTicker: 'IBM', price: 215.40, var1D: 0.65, var1W: 2.10, var1M: 6.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'GS', name: 'The Goldman Sachs Group', yahooTicker: 'GS', price: 485.20, var1D: 0.85, var1W: 2.40, var1M: 5.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'MS', name: 'Morgan Stanley', yahooTicker: 'MS', price: 102.50, var1D: 0.70, var1W: 1.90, var1M: 4.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'MCD', name: "McDonald's Corporation", yahooTicker: 'MCD', price: 298.50, var1D: 0.40, var1W: 1.10, var1M: 3.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'NKE', name: 'NIKE Inc.', yahooTicker: 'NKE', price: 82.40, var1D: 0.55, var1W: 1.40, var1M: -1.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'PG', name: 'The Procter & Gamble Company', yahooTicker: 'PG', price: 174.20, var1D: 0.25, var1W: 0.85, var1M: 2.10, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'KO', name: 'The Coca-Cola Company', yahooTicker: 'KO', price: 71.80, var1D: 0.30, var1W: 0.90, var1M: 2.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', yahooTicker: 'PEP', price: 176.50, var1D: 0.35, var1W: 0.80, var1M: 1.90, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'UNH', name: 'UnitedHealth Group Incorporated', yahooTicker: 'UNH', price: 588.40, var1D: 0.60, var1W: 1.80, var1M: 4.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', yahooTicker: 'JNJ', price: 165.20, var1D: 0.20, var1W: 0.70, var1M: 1.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', yahooTicker: 'ABBV', price: 194.50, var1D: 0.50, var1W: 1.50, var1M: 3.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'MRK', name: 'Merck & Co. Inc.', yahooTicker: 'MRK', price: 116.80, var1D: 0.35, var1W: 1.10, var1M: 2.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'CVX', name: 'Chevron Corporation', yahooTicker: 'CVX', price: 146.50, var1D: -0.20, var1W: 0.90, var1M: -0.80, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', yahooTicker: 'CAT', price: 372.40, var1D: 1.10, var1W: 3.10, var1M: 6.50, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'GE', name: 'GE Aerospace', yahooTicker: 'GE', price: 188.60, var1D: 1.30, var1W: 3.50, var1M: 7.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'BA', name: 'The Boeing Company', yahooTicker: 'BA', price: 156.20, var1D: -0.80, var1W: -2.10, var1M: -5.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', yahooTicker: 'VOO', price: 518.20, var1D: 0.44, var1W: 1.82, var1M: 3.15, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'VUG', name: 'Vanguard Growth ETF', yahooTicker: 'VUG', price: 374.50, var1D: 0.72, var1W: 2.20, var1M: 3.90, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'SMH', name: 'VanEck Semiconductor ETF', yahooTicker: 'SMH', price: 238.40, var1D: 2.30, var1W: 5.60, var1M: 8.90, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR', yahooTicker: 'XLK', price: 224.60, var1D: 1.20, var1W: 3.10, var1M: 5.40, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'XLF', name: 'Financial Select Sector SPDR', yahooTicker: 'XLF', price: 44.80, var1D: 0.45, var1W: 1.30, var1M: 3.20, type: 'EQUITY', category: 'EQUITY' },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR', yahooTicker: 'XLV', price: 152.10, var1D: 0.35, var1W: 1.10, var1M: 2.80, type: 'EQUITY', category: 'EQUITY' }
];

function buildDashboardData(marketsData) {
  // STRICT CATEGORY PRECISION: Dashboard assets array contains ONLY Equities!
  // No VIX, no Gold, no Forex, no Crypto mixed in the equities dashboard!
  const equityAssets = DASHBOARD_EQUITIES.map(enrichAsset).sort((a, b) => b.smartScore - a.smartScore);

  const highScores = equityAssets.filter(a => (a.smartScore || 0) >= 65).length;

  // Multi-category index for instant category queries
  const byCategory = {
    EQUITY: equityAssets,
    FOREX: (marketsData?.sections?.forex?.assets || []),
    CRYPTO: (marketsData?.sections?.crypto?.assets || []),
    COMMODITIES: (marketsData?.sections?.commodities?.assets || []),
    INDICES: [
      ...(marketsData?.sections?.usa?.assets || []),
      ...(marketsData?.sections?.europa?.assets || []),
      ...(marketsData?.sections?.asia?.assets || []),
      ...(marketsData?.sections?.developed?.assets || []),
      ...(marketsData?.sections?.emergenti?.assets || [])
    ]
  };

  return {
    overview: {
      sp500: { price: 5648.40, change: 0.45, isUp: true },
      vix: { price: 15.20, change: -3.40, isScary: false },
      highScoresCount: highScores
    },
    assets: equityAssets,
    byCategory,
    generatedAt: new Date().toISOString()
  };
}

// ── 3. EXECUTE & WRITE FILES ──────────────────────────────────────────────────

function generateAll() {
  console.log('[Seed] Generating preloaded markets data...');
  const marketsData = buildMarketsData();
  const marketsPath = path.join(DATA_DIR, 'preloadedMarkets.json');
  fs.writeFileSync(marketsPath, JSON.stringify(marketsData, null, 2), 'utf-8');
  console.log(`[Seed] ✅ preloadedMarkets.json written (${Object.keys(marketsData.sections).length} sections, ${marketsData.factors.length} factors)`);

  console.log('[Seed] Generating preloaded dashboard data...');
  const dashboardData = buildDashboardData(marketsData);
  const dashboardPath = path.join(DATA_DIR, 'preloadedDashboard.json');
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboardData, null, 2), 'utf-8');
  console.log(`[Seed] ✅ preloadedDashboard.json written (${dashboardData.assets.length} strictly equity assets, 0 cross-category contamination)`);

  return { marketsData, dashboardData };
}

if (require.main === module) {
  generateAll();
}

module.exports = { 
  generateAll, 
  enrichAsset, 
  generateRealisticHistory, 
  buildMarketsData, 
  buildDashboardData, 
  SECTIONS_CONFIG, 
  FACTORS_DATA, 
  DASHBOARD_EQUITIES 
};
