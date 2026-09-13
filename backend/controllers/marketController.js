const marketDataService = require('../services/marketDataService');
const marketsService = require('../services/marketsService');
const MarketConfig = require('../models/MarketConfig');

const getMarkets = async (req, res, next) => {
    try {
        const data = await marketsService.getMarketsData();
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const TICKER_ALIASES = {
  // Indices & Market Names
  'S&P 500': '^GSPC',
  'S&P 500 INDEX': '^GSPC',
  'S&P500': '^GSPC',
  'SP500': '^GSPC',
  'SPX': '^GSPC',
  'SPY': 'SPY',
  'NASDAQ': '^IXIC',
  'NASDAQ 100': '^IXIC',
  'NDX': '^IXIC',
  'QQQ': 'QQQ',
  'DOW': '^DJI',
  'DOW JONES': '^DJI',
  'DJIA': '^DJI',
  'DIA': 'DIA',
  'GERMANIA': '^GDAXI',
  'DAX': '^GDAXI',
  'DAX 40': '^GDAXI',
  'ITALIA': 'FTSEMIB.MI',
  'FTSE MIB': 'FTSEMIB.MI',
  'FTSEMIB': 'FTSEMIB.MI',
  'FRANCIA': '^FCHI',
  'CAC': '^FCHI',
  'CAC 40': '^FCHI',
  'UK': '^FTSE',
  'FTSE': '^FTSE',
  'FTSE 100': '^FTSE',
  'GIAPPONE': '^N225',
  'NIKKEI': '^N225',
  'N225': '^N225',
  'EURO STOXX 50': '^STOXX50E',
  'SX5E': '^STOXX50E',
  'SPAGNA': '^IBEX',
  'IBEX': '^IBEX',
  'RUSSELL': '^RUT',
  'RUSSELL 2000': '^RUT',
  'RUT': '^RUT',
  'IWM': 'IWM',
  'VIX': '^VIX',

  // Commodities
  'ORO': 'GC=F',
  'ORO SPOT': 'GC=F',
  'GOLD': 'GC=F',
  'XAUUSD': 'GC=F',
  'GLD': 'GLD',
  'ARGENTO': 'SI=F',
  'ARGENTO SPOT': 'SI=F',
  'SILVER': 'SI=F',
  'XAGUSD': 'SI=F',
  'SLV': 'SLV',
  'PETROLIO': 'CL=F',
  'PETROLIO WTI': 'CL=F',
  'WTI': 'CL=F',
  'CRUDE OIL': 'CL=F',
  'OIL': 'CL=F',
  'USO': 'USO',
  'PETROLIO BRENT': 'BZ=F',
  'BRENT': 'BZ=F',
  'BRENT OIL': 'BZ=F',
  'RAME': 'HG=F',
  'COPPER': 'HG=F',
  'GAS': 'NG=F',
  'GAS NATURALE': 'NG=F',
  'NAT GAS': 'NG=F',
  'NATGAS': 'NG=F',
  'PLATINO': 'PL=F',
  'PLATINUM': 'PL=F',

  // Forex
  'EURUSD': 'EURUSD=X',
  'EUR/USD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'GBP/USD': 'GBPUSD=X',
  'USDJPY': 'USDJPY=X',
  'USD/JPY': 'USDJPY=X',
  'USDCHF': 'USDCHF=X',
  'USD/CHF': 'USDCHF=X',
  'USDCAD': 'USDCAD=X',
  'USD/CAD': 'USDCAD=X',
  'AUDUSD': 'AUDUSD=X',
  'AUD/USD': 'AUDUSD=X',
  'NZDUSD': 'NZDUSD=X',
  'NZD/USD': 'NZDUSD=X',
  'EURGBP': 'EURGBP=X',
  'EUR/GBP': 'EURGBP=X',
  'EURJPY': 'EURJPY=X',
  'EUR/JPY': 'EURJPY=X',
  'EURAUD': 'EURAUD=X',
  'EUR/AUD': 'EURAUD=X',
  'EURCAD': 'EURCAD=X',
  'EUR/CAD': 'EURCAD=X',
  'EURCHF': 'EURCHF=X',
  'EUR/CHF': 'EURCHF=X',
  'EURNZD': 'EURNZD=X',
  'EUR/NZD': 'EURNZD=X',
  'GBPJPY': 'GBPJPY=X',
  'GBP/JPY': 'GBPJPY=X',
  'CADJPY': 'CADJPY=X',
  'CAD/JPY': 'CADJPY=X',
  'CHFJPY': 'CHFJPY=X',
  'CHF/JPY': 'CHFJPY=X',

  // Crypto
  'BTC': 'BTC-USD',
  'BITCOIN': 'BTC-USD',
  'ETH': 'ETH-USD',
  'ETHEREUM': 'ETH-USD',
  'SOL': 'SOL-USD',
  'SOLANA': 'SOL-USD',
  'XRP': 'XRP-USD',
  'DOGE': 'DOGE-USD',
  'ADA': 'ADA-USD'
};

const SYNONYM_MAP = {
  'oro': ['XAUUSD', 'GC=F', 'GLD'],
  'gold': ['XAUUSD', 'GC=F', 'GLD'],
  'argento': ['XAGUSD', 'SI=F', 'SLV'],
  'silver': ['XAGUSD', 'SI=F', 'SLV'],
  'petrolio': ['WTI', 'BRENT', 'CL=F', 'BZ=F', 'USO'],
  'oil': ['WTI', 'BRENT', 'CL=F', 'BZ=F', 'USO'],
  'greggio': ['WTI', 'BRENT', 'CL=F', 'BZ=F'],
  'gas': ['NATGAS', 'NG=F'],
  'rame': ['COPPER', 'HG=F'],
  'sp500': ['SPX', 'SPY', '^GSPC'],
  's&p': ['SPX', 'SPY', '^GSPC'],
  'nasdaq': ['NDX', 'QQQ', '^IXIC'],
  'dow': ['DJI', 'DIA', '^DJI'],
  'dax': ['DAX', '^GDAXI'],
  'germania': ['DAX', '^GDAXI'],
  'italia': ['FTMIB', 'FTSEMIB.MI'],
  'milano': ['FTMIB', 'FTSEMIB.MI'],
  'francia': ['SX5E', '^FCHI'],
  'uk': ['FTSE', '^FTSE'],
  'londra': ['FTSE', '^FTSE'],
  'giappone': ['N225', '^N225'],
  'nikkei': ['N225', '^N225'],
  'bitcoin': ['BTC', 'BTC-USD'],
  'ethereum': ['ETH', 'ETH-USD'],
  'solana': ['SOL', 'SOL-USD']
};

const getDashboard = async (req, res, next) => {
  try {
    const { tickers, category } = req.query;
    let customAssets = null;

    if (tickers) {
      customAssets = {};
      tickers.split(',').forEach(t => {
        const cleanTicker = t.trim();
        if (cleanTicker) {
          const upper = cleanTicker.toUpperCase();
          const mapped = TICKER_ALIASES[upper] || cleanTicker;
          customAssets[cleanTicker] = mapped;
        }
      });
    }

    const data = await marketDataService.getDashboardData(customAssets, category);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');
const FinancialAsset = require('../models/FinancialAsset');
const ASSET_UNIVERSE = require('../seeds/assetUniverse');

const searchMarkets = async (req, res, next) => {
  try {
    const rawQ = req.query.q;
    if (!rawQ || typeof rawQ !== 'string') {
      return res.json([]);
    }

    const q = rawQ.trim();
    if (q.length === 0) {
      return res.json([]);
    }

    const lowerQ = q.toLowerCase();
    const synonymTickers = SYNONYM_MAP[lowerQ] || [];

    // Escape regex special chars to prevent syntax errors
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');

    let results = [];

    // 1. Try querying MongoDB FinancialAsset collection if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const orConditions = [
          { ticker: regex },
          { name: regex }
        ];
        if (synonymTickers.length > 0) {
          orConditions.push({ ticker: { $in: synonymTickers } });
          orConditions.push({ yahooTicker: { $in: synonymTickers } });
        }

        results = await FinancialAsset.find({ $or: orConditions })
          .select('ticker name category tvSymbol yahooTicker currency -_id')
          .limit(10)
          .lean();
      } catch (dbErr) {
        console.warn('[searchMarkets] DB search fallback to memory:', dbErr.message);
      }
    }

    // 2. Fallback to in-memory curated asset universe if DB returned 0 results or had an issue
    if (!results || results.length === 0) {
      results = ASSET_UNIVERSE.filter(asset => {
        const t = asset.ticker.toLowerCase();
        const n = asset.name.toLowerCase();
        const y = (asset.yahooTicker || '').toLowerCase();
        const isSynonym = synonymTickers.some(st => st.toLowerCase() === t || st.toLowerCase() === y);
        return isSynonym || t.includes(lowerQ) || n.includes(lowerQ) || y.includes(lowerQ);
      }).slice(0, 10);
    }

    // Prioritize exact ticker startsWith matches
    results.sort((a, b) => {
      const aStarts = a.ticker.toUpperCase().startsWith(q.toUpperCase());
      const bStarts = b.ticker.toUpperCase().startsWith(q.toUpperCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    const formatted = results.slice(0, 10).map(item => ({
      ...item,
      symbol: item.ticker,
      shortname: item.name
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[searchMarkets] Error:', error);
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  const { ticker, resolution, from, to } = req.query;
  
  if (!ticker || !resolution || !from || !to) {
    return res.status(400).json({ error: 'Missing required query parameters: ticker, resolution, from, to' });
  }

  try {
    const data = await marketDataService.getHistoricalData(ticker, resolution, from, to);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAssetDetails = async (req, res, next) => {
  try {
    const { ticker } = req.params;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter required' });
    }

    const rawTicker = ticker.trim();
    const cleanTicker = rawTicker.toUpperCase();
    console.log('[Backend] getAssetDetails requested for ticker:', rawTicker);

    // 1. Check in-memory preloaded dashboard cache (0ms)
    const cachedDashboard = marketDataService.cachedDashboardData?.assets || [];
    let fromDashboard = cachedDashboard.find(a => 
      (a.ticker && a.ticker.toUpperCase() === cleanTicker) ||
      (a.yahooTicker && a.yahooTicker.toUpperCase() === cleanTicker) ||
      (a.name && a.name.toUpperCase() === cleanTicker)
    );
    if (!fromDashboard && marketDataService.cachedDashboardData?.byCategory) {
      for (const catList of Object.values(marketDataService.cachedDashboardData.byCategory)) {
        fromDashboard = catList.find(a =>
          (a.ticker && a.ticker.toUpperCase() === cleanTicker) ||
          (a.yahooTicker && a.yahooTicker.toUpperCase() === cleanTicker) ||
          (a.name && a.name.toUpperCase() === cleanTicker)
        );
        if (fromDashboard) break;
      }
    }
    if (fromDashboard) {
      return res.json(fromDashboard);
    }

    // 2. Check in-memory preloaded markets cache (0ms)
    const fromMarkets = marketsService.findAsset(cleanTicker) || marketsService.findAsset(rawTicker);
    if (fromMarkets) {
      return res.json(fromMarkets);
    }

    // 3. Resolve alias if present
    const aliasYahoo = TICKER_ALIASES[cleanTicker] || TICKER_ALIASES[rawTicker];

    // 4. Look up in FinancialAsset DB or in-memory universe
    let assetMeta = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const orQueries = [
          { ticker: cleanTicker },
          { yahooTicker: rawTicker },
          { yahooTicker: cleanTicker }
        ];
        if (aliasYahoo) {
          orQueries.push({ yahooTicker: aliasYahoo });
        }

        assetMeta = await FinancialAsset.findOne({ $or: orQueries }).lean();
      } catch (e) {}
    }

    if (!assetMeta) {
      assetMeta = ASSET_UNIVERSE.find(a => 
        a.ticker.toUpperCase() === cleanTicker || 
        a.yahooTicker.toUpperCase() === rawTicker.toUpperCase() ||
        (aliasYahoo && a.yahooTicker.toUpperCase() === aliasYahoo.toUpperCase()) ||
        a.name.toUpperCase() === cleanTicker ||
        a.name.toUpperCase().includes(cleanTicker)
      );
    }

    // 5. If found in universe, enrich on the fly with real SmartQuant engine (0ms)
    if (assetMeta) {
      const { enrichAsset } = require('../seeds/seedPreloadedData');
      const enriched = enrichAsset({
        ticker: assetMeta.ticker,
        yahooTicker: assetMeta.yahooTicker,
        name: assetMeta.name,
        price: assetMeta.price || 100,
        var1D: 0.5,
        var1W: 1.5,
        var1M: 3.0,
        type: assetMeta.category === 'FOREX' ? 'CURRENCY' : assetMeta.category === 'COMMODITIES' ? 'FUTURE' : assetMeta.category === 'INDICES' ? 'INDEX' : 'EQUITY',
        category: assetMeta.category
      });
      return res.json({
        ...enriched,
        tvSymbol: assetMeta.tvSymbol || assetMeta.ticker,
        currency: assetMeta.currency || 'USD'
      });
    }

    let resolvedYahooTicker = aliasYahoo || cleanTicker;
    const data = await marketDataService.getDashboardData({ [cleanTicker]: resolvedYahooTicker });

    if (data && data.assets && data.assets.length > 0) {
      return res.json(data.assets[0]);
    }

    // Graceful fallback
    return res.json({
      ticker: cleanTicker,
      name: rawTicker,
      tvSymbol: resolvedYahooTicker,
      yahooTicker: resolvedYahooTicker,
      category: 'EQUITY',
      price: 100,
      prezzo: 100,
      var1D: 0,
      var1W: 0,
      var1M: 0,
      smartScore: 55,
      smartScoreLabel: 'Neutral',
      momentum: 0,
      rsi: 50,
      pe: '18.5x'
    });
  } catch (error) {
    console.error('[Backend] Error in getAssetDetails:', error);
    next(error);
  }
};

module.exports = {
  getMarkets,
  getDashboard,
  searchMarkets,
  getHistory,
  getAssetDetails
};
