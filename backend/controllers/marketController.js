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

const getDashboard = async (req, res, next) => {
  try {
    const { tickers } = req.query;
    let customAssets = null;

    if (tickers) {
      customAssets = {};
      tickers.split(',').forEach(t => {
        const cleanTicker = t.trim();
        if (cleanTicker) {
          customAssets[cleanTicker] = cleanTicker;
        }
      });
    }

    const data = await marketDataService.getDashboardData(customAssets);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const searchMarkets = async (req, res, next) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await marketDataService.search(q);
    res.json(results);
  } catch (error) {
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
    console.log("[Backend] getAssetDetails requested for ticker:", ticker);

    let config = null;
    try {
      config = await MarketConfig.findOne({ configId: 'default' });
    } catch (dbErr) {
      console.warn("[Backend] MarketConfig fetch skipped in getAssetDetails:", dbErr.message);
    }
    let resolvedYahooTicker = ticker;
    let resolvedName = ticker;
    
    if (config && config.assetGroups) {
      for (const group of Object.values(config.assetGroups)) {
        for (const [yTicker, name] of Object.entries(group.tickers)) {
          if (name === ticker || yTicker === ticker) {
            resolvedYahooTicker = yTicker;
            resolvedName = name;
            break;
          }
        }
      }
    }

    // Fallback dictionary for common tickers in case DB is missing them
    if (resolvedYahooTicker === ticker) {
      const fallbackMap = {
        'EURUSD': 'EURUSD=X', 'Gold': 'GC=F', 'WTI': 'CL=F',
        'SP500': '^GSPC', 'BTC': 'BTC-USD', 'ETH': 'ETH-USD',
        'SPY': 'SPY', 'VGK': 'VGK', 'EWC': 'EWC', 'MCHI': 'MCHI', 'EWA': 'EWA'
      };
      if (fallbackMap[ticker]) {
        resolvedYahooTicker = fallbackMap[ticker];
      }
    }
    
    console.log(`[Backend] getAssetDetails mapping: ${ticker} -> Yahoo: ${resolvedYahooTicker}`);
    
    const data = await marketDataService.getDashboardData({ [resolvedName]: resolvedYahooTicker });

    if (!data || !data.assets || data.assets.length === 0) {
      console.log(`[Backend] getAssetDetails failed: No data returned from marketDataService for ${resolvedYahooTicker}`);
      return res.status(404).json({ error: 'Asset data calculation failed or unsupported.' });
    }
    
    res.json(data.assets[0]);
  } catch (error) {
    console.error("[Backend] Error in getAssetDetails:", error);
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
