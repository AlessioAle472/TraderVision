/**
 * Smart Symbol Resolver for TradingView
 * Curated Catalog of world financial assets mapped to 100% embeddable,
 * real-time, non-restricted TradingView symbols (eliminating 'Symbol available only on TradingView' warnings).
 */

export const TRADINGVIEW_CATALOG = {
  // ==========================================
  // 1. MAJOR INDICES (US & GLOBAL)
  // ==========================================
  '^GSPC': 'FOREXCOM:SPXUSD',      // S&P 500 (Free public embeddable real-time CFD)
  'SP500': 'FOREXCOM:SPXUSD',
  'SPX': 'FOREXCOM:SPXUSD',
  'SPY': 'AMEX:SPY',
  '^IXIC': 'FOREXCOM:NSXUSD',     // Nasdaq 100
  'NASDAQ': 'FOREXCOM:NSXUSD',
  'NDX': 'FOREXCOM:NSXUSD',
  'QQQ': 'NASDAQ:QQQ',
  '^DJI': 'FOREXCOM:DJI',         // Dow Jones 30
  'DOW': 'FOREXCOM:DJI',
  'DJIA': 'FOREXCOM:DJI',
  'DIA': 'AMEX:DIA',
  '^RUT': 'FOREXCOM:RUT',         // Russell 2000
  'RUSSELL': 'FOREXCOM:RUT',
  'RUT': 'FOREXCOM:RUT',
  'IWM': 'AMEX:IWM',
  '^VIX': 'TVC:VIX',              // Volatility Index
  'VIX': 'TVC:VIX',
  '^GDAXI': 'INDEX:DEU40',        // Germany DAX 40
  'DAX': 'INDEX:DEU40',
  'DEU40': 'INDEX:DEU40',
  '^FTSE': 'OANDA:UK100GBP',      // UK FTSE 100
  'FTSE': 'OANDA:UK100GBP',
  'UKX': 'OANDA:UK100GBP',
  '^FCHI': 'OANDA:FR40EUR',       // France CAC 40
  'CAC': 'OANDA:FR40EUR',
  'PX1': 'OANDA:FR40EUR',
  'FTSEMIB.MI': 'INDEX:FTMIB',    // Italy FTSE MIB
  'FTSEMIB': 'INDEX:FTMIB',
  'FTMIB': 'INDEX:FTMIB',
  '^STOXX50E': 'OANDA:EU50EUR',   // Euro Stoxx 50
  'STOXX50E': 'OANDA:EU50EUR',
  'SX5E': 'OANDA:EU50EUR',
  '^IBEX': 'OANDA:ES35EUR',       // Spain IBEX 35
  'IBEX': 'OANDA:ES35EUR',
  '^N225': 'TVC:NI225',           // Japan Nikkei 225
  'N225': 'TVC:NI225',
  'NIKKEI': 'TVC:NI225',
  '^HSI': 'OANDA:HK33HKD',        // Hong Kong Hang Seng
  'HSI': 'OANDA:HK33HKD',
  '000001.SS': 'SSE:000001',      // China Shanghai Composite
  'SHCOMP': 'SSE:000001',
  '^STI': 'SGX:STI',              // Singapore Straits Times
  'STI': 'SGX:STI',
  '^BSESN': 'BSE:SENSEX',         // India Sensex
  'SENSEX': 'BSE:SENSEX',
  '^GSPTSE': 'TSX:OSPTX',         // Canada TSX
  'TSX': 'TSX:OSPTX',
  '^AS51': 'OANDA:AU200AUD',      // Australia ASX 200
  'AS51': 'OANDA:AU200AUD',
  '^SSMI': 'SIX:SMI',             // Switzerland SMI
  'SSMI': 'SIX:SMI',
  '^BVSP': 'BMFBOVESPA:IBOV',     // Brazil Bovespa
  'BVSP': 'BMFBOVESPA:IBOV',
  '^MXX': 'BMV:ME',               // Mexico IPC
  'MXX': 'BMV:ME',
  '^KS11': 'KRX:KOSPI',           // Korea KOSPI
  'KOSPI': 'KRX:KOSPI',

  // ==========================================
  // 2. COMMODITIES (GOLD, OIL, METALS, AGRI)
  // ==========================================
  'GC=F': 'OANDA:XAUUSD',         // Gold Spot (Universal public embed)
  'GOLD': 'OANDA:XAUUSD',
  'XAUUSD': 'OANDA:XAUUSD',
  'GLD': 'AMEX:GLD',
  'SI=F': 'OANDA:XAGUSD',         // Silver Spot (Universal public embed)
  'SILVER': 'OANDA:XAGUSD',
  'XAGUSD': 'OANDA:XAGUSD',
  'SLV': 'AMEX:SLV',
  'CL=F': 'TVC:USOIL',            // WTI Crude Oil
  'OIL': 'TVC:USOIL',
  'WTI': 'TVC:USOIL',
  'USOIL': 'TVC:USOIL',
  'USO': 'AMEX:USO',
  'BZ=F': 'TVC:UKOIL',            // Brent Crude Oil
  'BRENT': 'TVC:UKOIL',
  'UKOIL': 'TVC:UKOIL',
  'BCO': 'TVC:UKOIL',
  'NG=F': 'TVC:NATGAS',           // Natural Gas
  'NATGAS': 'TVC:NATGAS',
  'GAS': 'TVC:NATGAS',
  'UNG': 'AMEX:UNG',
  'HG=F': 'TVC:COPPER',           // Copper
  'COPPER': 'TVC:COPPER',
  'PL=F': 'TVC:PLATINUM',         // Platinum
  'PA=F': 'TVC:PALLADIUM',        // Palladium
  'URA': 'AMEX:URA',              // Uranium ETF
  'DBA': 'AMEX:DBA',              // Agriculture Fund
  'DBC': 'AMEX:DBC',              // Commodity Index
  'GSG': 'AMEX:GSG',

  // ==========================================
  // 3. FOREX (28 MAJOR & CROSS PAIRS)
  // ==========================================
  'EURUSD': 'OANDA:EURUSD',
  'EURUSD=X': 'OANDA:EURUSD',
  'GBPUSD': 'OANDA:GBPUSD',
  'GBPUSD=X': 'OANDA:GBPUSD',
  'USDJPY': 'OANDA:USDJPY',
  'USDJPY=X': 'OANDA:USDJPY',
  'USDCHF': 'OANDA:USDCHF',
  'USDCHF=X': 'OANDA:USDCHF',
  'USDCAD': 'OANDA:USDCAD',
  'USDCAD=X': 'OANDA:USDCAD',
  'AUDUSD': 'OANDA:AUDUSD',
  'AUDUSD=X': 'OANDA:AUDUSD',
  'NZDUSD': 'OANDA:NZDUSD',
  'NZDUSD=X': 'OANDA:NZDUSD',
  // Euro Crosses
  'EURGBP': 'OANDA:EURGBP',
  'EURGBP=X': 'OANDA:EURGBP',
  'EURJPY': 'OANDA:EURJPY',
  'EURJPY=X': 'OANDA:EURJPY',
  'EURCHF': 'OANDA:EURCHF',
  'EURCHF=X': 'OANDA:EURCHF',
  'EURCAD': 'OANDA:EURCAD',
  'EURCAD=X': 'OANDA:EURCAD',
  'EURAUD': 'OANDA:EURAUD',
  'EURAUD=X': 'OANDA:EURAUD',
  'EURNZD': 'OANDA:EURNZD',
  'EURNZD=X': 'OANDA:EURNZD',
  // Pound Crosses
  'GBPJPY': 'OANDA:GBPJPY',
  'GBPJPY=X': 'OANDA:GBPJPY',
  'GBPCHF': 'OANDA:GBPCHF',
  'GBPCHF=X': 'OANDA:GBPCHF',
  'GBPCAD': 'OANDA:GBPCAD',
  'GBPCAD=X': 'OANDA:GBPCAD',
  'GBPAUD': 'OANDA:GBPAUD',
  'GBPAUD=X': 'OANDA:GBPAUD',
  'GBPNZD': 'OANDA:GBPNZD',
  'GBPNZD=X': 'OANDA:GBPNZD',
  // Aussie Crosses
  'AUDJPY': 'OANDA:AUDJPY',
  'AUDJPY=X': 'OANDA:AUDJPY',
  'AUDCAD': 'OANDA:AUDCAD',
  'AUDCAD=X': 'OANDA:AUDCAD',
  'AUDCHF': 'OANDA:AUDCHF',
  'AUDCHF=X': 'OANDA:AUDCHF',
  'AUDNZD': 'OANDA:AUDNZD',
  'AUDNZD=X': 'OANDA:AUDNZD',
  // Kiwi Crosses
  'NZDJPY': 'OANDA:NZDJPY',
  'NZDJPY=X': 'OANDA:NZDJPY',
  'NZDCAD': 'OANDA:NZDCAD',
  'NZDCAD=X': 'OANDA:NZDCAD',
  'NZDCHF': 'OANDA:NZDCHF',
  'NZDCHF=X': 'OANDA:NZDCHF',
  // CAD & CHF Crosses
  'CADJPY': 'OANDA:CADJPY',
  'CADJPY=X': 'OANDA:CADJPY',
  'CADCHF': 'OANDA:CADCHF',
  'CADCHF=X': 'OANDA:CADCHF',
  'CHFJPY': 'OANDA:CHFJPY',
  'CHFJPY=X': 'OANDA:CHFJPY',
  'DXY': 'TVC:DXY',               // US Dollar Index
  'USDX': 'TVC:DXY',
  'DX-Y.NYB': 'TVC:DXY',

  // ==========================================
  // 4. CRYPTOCURRENCIES (BINANCE VERIFIED FEEDS)
  // ==========================================
  'BTC-USD': 'BINANCE:BTCUSDT',
  'BTC': 'BINANCE:BTCUSDT',
  'BTCUSD': 'BINANCE:BTCUSDT',
  'ETH-USD': 'BINANCE:ETHUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'ETHUSD': 'BINANCE:ETHUSDT',
  'SOL-USD': 'BINANCE:SOLUSDT',
  'SOL': 'BINANCE:SOLUSDT',
  'BNB-USD': 'BINANCE:BNBUSDT',
  'BNB': 'BINANCE:BNBUSDT',
  'XRP-USD': 'BINANCE:XRPUSDT',
  'XRP': 'BINANCE:XRPUSDT',
  'ADA-USD': 'BINANCE:ADAUSDT',
  'ADA': 'BINANCE:ADAUSDT',
  'DOGE-USD': 'BINANCE:DOGEUSDT',
  'DOGE': 'BINANCE:DOGEUSDT',
  'AVAX-USD': 'BINANCE:AVAXUSDT',
  'AVAX': 'BINANCE:AVAXUSDT',
  'LINK-USD': 'BINANCE:LINKUSDT',
  'LINK': 'BINANCE:LINKUSDT',
  'DOT-USD': 'BINANCE:DOTUSDT',
  'DOT': 'BINANCE:DOTUSDT',
  'MATIC-USD': 'BINANCE:POLUSDT',
  'POL-USD': 'BINANCE:POLUSDT',
  'MATIC': 'BINANCE:POLUSDT',
  'POL': 'BINANCE:POLUSDT',
  'TON-USD': 'BINANCE:TONUSDT',
  'TON': 'BINANCE:TONUSDT',
  'NEAR-USD': 'BINANCE:NEARUSDT',
  'NEAR': 'BINANCE:NEARUSDT',
  'UNI-USD': 'BINANCE:UNIUSDT',
  'UNI': 'BINANCE:UNIUSDT',
  'LTC-USD': 'BINANCE:LTCUSDT',
  'LTC': 'BINANCE:LTCUSDT',
  'SUI-USD': 'BINANCE:SUIUSDT',
  'SUI': 'BINANCE:SUIUSDT',
  'TRX-USD': 'BINANCE:TRXUSDT',
  'TRX': 'BINANCE:TRXUSDT',
  'XLM-USD': 'BINANCE:XLMUSDT',
  'XLM': 'BINANCE:XLMUSDT',
  'HBAR-USD': 'BINANCE:HBARUSDT',
  'HBAR': 'BINANCE:HBARUSDT',
  'ETC-USD': 'BINANCE:ETCUSDT',
  'ETC': 'BINANCE:ETCUSDT',
  'XMR-USD': 'BINANCE:XMRUSDT',
  'XMR': 'BINANCE:XMRUSDT',
  'VET-USD': 'BINANCE:VETUSDT',
  'VET': 'BINANCE:VETUSDT',

  // ==========================================
  // 5. FACTOR & THEMATIC ETFS
  // ==========================================
  'SPHB': 'AMEX:SPHB',            // High Beta
  'VLUE': 'AMEX:VLUE',            // Value
  'VUG': 'AMEX:VUG',              // Growth
  'MTUM': 'AMEX:MTUM',            // Momentum
  'DEF': 'AMEX:DEF',              // Defensive
  'TLT': 'NASDAQ:TLT',            // 20+ Y Treasury
  'HYG': 'AMEX:HYG',              // High Yield Bond
  'LQD': 'AMEX:LQD',              // Corp Bond
  'EEM': 'AMEX:EEM',              // Emerging Markets
  'VWO': 'AMEX:VWO',
  'VGK': 'AMEX:VGK',              // Europe ETF
  'EWJ': 'AMEX:EWJ',              // Japan ETF
  'MCHI': 'NASDAQ:MCHI',          // China ETF
  'FXI': 'AMEX:FXI',
  'EWA': 'AMEX:EWA',              // Australia ETF
  'EWC': 'AMEX:EWC',              // Canada ETF
  'EWG': 'AMEX:EWG',              // Germany ETF
  'EWI': 'AMEX:EWI',              // Italy ETF
  'EWU': 'AMEX:EWU',              // UK ETF
  'EWQ': 'AMEX:EWQ',              // France ETF
  'EWZ': 'AMEX:EWZ',              // Brazil ETF

  // ==========================================
  // 6. MEGA-CAP EQUITIES (TECH & LEADERS)
  // ==========================================
  'AAPL': 'NASDAQ:AAPL',
  'MSFT': 'NASDAQ:MSFT',
  'NVDA': 'NASDAQ:NVDA',
  'AMZN': 'NASDAQ:AMZN',
  'GOOGL': 'NASDAQ:GOOGL',
  'GOOG': 'NASDAQ:GOOGL',
  'META': 'NASDAQ:META',
  'TSLA': 'NASDAQ:TSLA',
  'BRK-B': 'NYSE:BRK.B',
  'BRK.B': 'NYSE:BRK.B',
  'LLY': 'NYSE:LLY',
  'AVGO': 'NASDAQ:AVGO',
  'JPM': 'NYSE:JPM',
  'V': 'NYSE:V',
  'WMT': 'NYSE:WMT',
  'XOM': 'NYSE:XOM',
  'MA': 'NYSE:MA',
  'AMD': 'NASDAQ:AMD',
  'NFLX': 'NASDAQ:NFLX',
  'ORCL': 'NYSE:ORCL',
  'PLTR': 'NASDAQ:PLTR',
  'TSM': 'NYSE:TSM',
  'ASML': 'NASDAQ:ASML',
  'BABA': 'NYSE:BABA',
  'NVO': 'NYSE:NVO',
  'RACE': 'NYSE:RACE',

  // ==========================================
  // 7. SOVEREIGN YIELDS
  // ==========================================
  'US10Y': 'TVC:US10Y',
  '^TNX': 'TVC:US10Y',
  'TNX': 'TVC:US10Y',
  'US02Y': 'TVC:US02Y',
  'US30Y': 'TVC:US30Y',
  '^TYX': 'TVC:US30Y',
  'TYX': 'TVC:US30Y',
  'DE10Y': 'TVC:DE10Y',
  'IT10Y': 'TVC:IT10Y',

  // ==========================================
  // 8. MARKET SECTION NAMES & ITALIAN ALIASES
  // ==========================================
  'S&P 500': 'FOREXCOM:SPXUSD',
  'S&P 500 INDEX': 'FOREXCOM:SPXUSD',
  'GERMANIA': 'INDEX:DEU40',
  'ITALIA': 'INDEX:FTMIB',
  'FRANCIA': 'OANDA:FR40EUR',
  'UK': 'OANDA:UK100GBP',
  'GIAPPONE': 'TVC:NI225',
  'ORO': 'OANDA:XAUUSD',
  'ORO SPOT': 'OANDA:XAUUSD',
  'ARGENTO': 'OANDA:XAGUSD',
  'ARGENTO SPOT': 'OANDA:XAGUSD',
  'PETROLIO': 'TVC:USOIL',
  'PETROLIO WTI': 'TVC:USOIL',
  'PETROLIO BRENT': 'TVC:UKOIL',
  'BRENT OIL': 'TVC:UKOIL',
  'CRUDE OIL': 'TVC:USOIL',
  'NAT GAS': 'TVC:NATGAS',
  'GAS NATURALE': 'TVC:NATGAS',
  'EUR/USD': 'OANDA:EURUSD',
  'GBP/USD': 'OANDA:GBPUSD',
  'USD/JPY': 'OANDA:USDJPY',
  'USD/CHF': 'OANDA:USDCHF',
  'USD/CAD': 'OANDA:USDCAD',
  'AUD/USD': 'OANDA:AUDUSD',
  'NZD/USD': 'OANDA:NZDUSD',
  'EUR/GBP': 'OANDA:EURGBP',
  'EUR/JPY': 'OANDA:EURJPY',
  'EUR/AUD': 'OANDA:EURAUD',
  'EUR/CAD': 'OANDA:EURCAD',
  'EUR/CHF': 'OANDA:EURCHF',
  'EUR/NZD': 'OANDA:EURNZD',
  'BITCOIN': 'BINANCE:BTCUSDT',
  'ETHEREUM': 'BINANCE:ETHUSDT',
  'SOLANA': 'BINANCE:SOLUSDT',

  // Mega-cap Equities & Sector ETFs
  'INTC': 'NASDAQ:INTC',
  'QCOM': 'NASDAQ:QCOM',
  'CRM': 'NYSE:CRM',
  'ADBE': 'NASDAQ:ADBE',
  'UBER': 'NYSE:UBER',
  'NOW': 'NYSE:NOW',
  'IBM': 'NYSE:IBM',
  'BAC': 'NYSE:BAC',
  'GS': 'NYSE:GS',
  'MS': 'NYSE:MS',
  'COST': 'NASDAQ:COST',
  'HD': 'NYSE:HD',
  'MCD': 'NYSE:MCD',
  'NKE': 'NYSE:NKE',
  'PG': 'NYSE:PG',
  'KO': 'NYSE:KO',
  'PEP': 'NASDAQ:PEP',
  'DIS': 'NYSE:DIS',
  'UNH': 'NYSE:UNH',
  'JNJ': 'NYSE:JNJ',
  'ABBV': 'NYSE:ABBV',
  'MRK': 'NYSE:MRK',
  'CVX': 'NYSE:CVX',
  'CAT': 'NYSE:CAT',
  'GE': 'NYSE:GE',
  'BA': 'NYSE:BA',
  'VOO': 'AMEX:VOO',
  'SMH': 'NASDAQ:SMH',
  'XLK': 'AMEX:XLK',
  'XLF': 'AMEX:XLF',
  'XLV': 'AMEX:XLV',

  // Crypto & Commodities additions
  'POL': 'BINANCE:POLUSDT',
  'POL-USD': 'BINANCE:POLUSDT',
  'TON': 'OKX:TONUSDT',
  'TON-USD': 'OKX:TONUSDT',
  'PLATINUM': 'TVC:PLATINUM',
  'PALLADIUM': 'TVC:PALLADIUM',
  'ALUMINUM': 'TVC:ALUMINUM',
  'ALI=F': 'TVC:ALUMINUM',
  'DJI': 'FOREXCOM:DJI',
  'OMX': 'NASDAQ:OMXS30',
  'OSLO': 'OSL:OBX'
};

/**
 * Translates any input ticker to the most reliable, unrestricted TradingView equivalent.
 */
export const resolveTVSymbol = (symbol) => {
  if (!symbol) return 'NASDAQ:AAPL';

  const clean = String(symbol).trim().toUpperCase();

  // 1. Direct Catalog Match
  if (TRADINGVIEW_CATALOG[clean]) {
    return TRADINGVIEW_CATALOG[clean];
  }

  // 2. Already contains exchange prefix
  if (clean.includes(':')) {
    return clean;
  }

  // 3. Forex endings
  if (clean.endsWith('=X')) {
    const pair = clean.replace('=X', '');
    return `OANDA:${pair}`;
  }

  // 4. Crypto endings
  if (clean.endsWith('-USD')) {
    const coin = clean.replace('-USD', '');
    return `BINANCE:${coin}USDT`;
  }
  if (clean.endsWith('-USDT')) {
    const coin = clean.replace('-USDT', '');
    return `BINANCE:${coin}USDT`;
  }

  // 5. Commodity futures
  if (clean.endsWith('=F')) {
    const base = clean.replace('=F', '');
    return `TVC:${base}`;
  }

  // 6. European / Regional stock suffixes
  if (clean.endsWith('.MI')) {
    return `MIL:${clean.replace('.MI', '')}`;
  }
  if (clean.endsWith('.DE')) {
    return `XETR:${clean.replace('.DE', '')}`;
  }
  if (clean.endsWith('.PA')) {
    return `EURONEXT:${clean.replace('.PA', '')}`;
  }
  if (clean.endsWith('.L')) {
    return `LSE:${clean.replace('.L', '')}`;
  }

  // 7. Strip index carat prefix
  if (clean.startsWith('^')) {
    const stripped = clean.substring(1);
    if (TRADINGVIEW_CATALOG[stripped]) {
      return TRADINGVIEW_CATALOG[stripped];
    }
    return `TVC:${stripped}`;
  }

  // 8. Default fallback
  return clean;
};
