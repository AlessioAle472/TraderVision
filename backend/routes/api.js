const express = require('express');
const router = express.Router();
const axios = require('axios');
const marketDataService = require('../services/marketDataService');
const aiBriefingService = require('../services/aiBriefingService');
const newsletterService = require('../services/newsletterService');
const { runBriefingCycle } = require('../services/aiBriefingJob');
const macroCalculator = require('../services/macroCalculator');
const economicCalendar = require('../services/economicCalendar');
const communityMock = require('../data/community_mock');
const macroDeepDiveService = require('../services/macroDeepDiveService');
const fredService = require('../services/fredService');
const centralBanksData = require('../data/centralBanks.json');
const { generateSynthesis } = require('../services/aiSynthesisService');
const { generateRiskReport } = require('../services/riskReportService');
const marketsService = require('../services/marketsService');
const TickerMapping = require('../models/TickerMapping');
const MarketConfig = require('../models/MarketConfig');
const PreloadedMarketData = require('../models/PreloadedMarketData');
const { protect, optionalAuth, master, verifyAdmin } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { softRequirePro, FREE_LIMIT } = require('../middleware/requirePro');
const { getEconomicCalendar } = require('../controllers/calendarController');
const { getMarkets, getDashboard, searchMarkets, getHistory, getAssetDetails } = require('../controllers/marketController');
// POST /api/newsletter/subscribe — subscribes a user to the daily briefing email
router.post('/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const result = newsletterService.addSubscriber(email);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// POST /api/briefing/force-send — manually trigger the briefing cycle (master only)
router.post('/briefing/force-send', protect, master, async (req, res) => {
  try {
    const result = await runBriefingCycle('MANUAL_TEST');
    res.json(result);
  } catch (error) {
    console.error('Error in /api/briefing/force-send:', error);
    res.status(500).json({ error: 'Failed to force-send briefing' });
  }
});

// GET /api/ticker-mapping/:yfSymbol
router.get('/ticker-mapping/:yfSymbol', async (req, res) => {
  try {
    const mapping = await TickerMapping.findOne({ yfSymbol: req.params.yfSymbol.toUpperCase() }).catch(() => null);
    res.json({ tvSymbol: mapping ? mapping.tvSymbol : null });
  } catch (error) {
    console.error('API Error in GET /ticker-mapping:', error);
    res.json({ tvSymbol: null });
  }
});

// POST /api/ticker-mapping
router.post('/ticker-mapping', protect, master, async (req, res) => {
  try {
    const { yfSymbol, tvSymbol } = req.body;
    if (!yfSymbol || !tvSymbol) {
      return res.status(400).json({ error: 'Both yfSymbol and tvSymbol are required' });
    }
    const mapping = await TickerMapping.findOneAndUpdate(
      { yfSymbol: yfSymbol.toUpperCase() },
      { tvSymbol: tvSymbol.toUpperCase() },
      { upsert: true, new: true }
    );
    res.json(mapping);
  } catch (error) {
    console.error('API Error in POST /ticker-mapping:', error);
    res.status(500).json({ error: 'Failed to save mapping' });
  }
});

// GET /api/macro-deep-dive
router.get('/macro-deep-dive', async (req, res) => {
    try {
        const data = await macroDeepDiveService.getDeepDiveData();
        res.json(data);
    } catch (error) {
        console.error('API Error in /macro-deep-dive:', error.message);
        res.status(500).json({ error: 'Failed to fetch deep dive data' });
    }
});

// GET /api/markets — full multi-section markets data
router.get('/markets', getMarkets);

// POST /api/ai-synthesis
router.post('/ai-synthesis', protect, verifyAdmin, aiLimiter, async (req, res) => {
    try {
        const { chartData, fundamentals, correlations, regime } = req.body;
        const synthesis = await generateSynthesis(chartData, fundamentals, correlations, regime);
        res.json(synthesis);
    } catch (error) {
        console.error('API Error in /ai-synthesis:', error.message);
        res.status(500).json({ error: 'Failed to generate AI synthesis' });
    }
});

// POST /api/risk/report
router.post('/risk/report', protect, verifyAdmin, aiLimiter, async (req, res) => {
    try {
        const { chartData, fundamentals, correlations } = req.body;
        const report = await generateRiskReport(chartData, fundamentals, correlations);
        res.json(report);
    } catch (error) {
        console.error('API Error in /api/risk/report:', error.message);
        res.status(500).json({ error: 'Failed to generate Risk Report' });
    }
});

// GET /api/briefing/latest — returns the latest AI-generated market briefing
router.get('/briefing/latest', protect, verifyAdmin, async (req, res) => {
  try {
    const news = await aiBriefingService.fetchLatestNews();
    const briefing = await aiBriefingService.generateAIBriefing(news);
    res.json(briefing);
  } catch (error) {
    console.error('Error in /api/briefing/latest:', error);
    res.status(500).json({ error: 'Failed to generate AI briefing' });
  }
});

// GET /api/search?q={query} — search for assets via Yahoo Finance
router.get('/search', searchMarkets);

// GET /api/dashboard — returns dashboard data, supports optional ?tickers=...
router.get('/dashboard', getDashboard);

// NOTE: The Finnhub API key is intentionally NOT exposed to the frontend.
// All Finnhub calls are made server-side. If the frontend needs market config,
// expose only non-sensitive, computed data.

// Endpoint to get historical stock/forex data for charts
router.get('/history', getHistory);

// GET /api/economic-calendar — fetch live economic calendar via Finnhub
router.get('/economic-calendar', optionalAuth, softRequirePro, getEconomicCalendar);

// GET /api/world-news — breaking international & financial newspaper stories
router.get('/world-news', async (req, res) => {
  try {
    const worldNewsService = require('../services/worldNewsService');
    const { category, search, limit } = req.query;
    const stories = await worldNewsService.getLatestWorldNews({
      category,
      search,
      limit: parseInt(limit, 10) || 60
    });
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: stories.length,
      stories
    });
  } catch (err) {
    console.error('Error fetching world news:', err);
    res.status(500).json({ error: 'Failed to fetch world news', details: err.message });
  }
});

// GET /api/vip-tweets — market moving tweets & statements from top investors and politicians
router.get('/vip-tweets', async (req, res) => {
  try {
    const vipTweetsService = require('../services/vipTweetsService');
    const { category, search, ticker } = req.query;
    const result = await vipTweetsService.getVipTweets({ category, search, ticker });
    res.json(result);
  } catch (err) {
    console.error('Error fetching VIP tweets:', err);
    res.status(500).json({ error: 'Failed to fetch VIP tweets', details: err.message });
  }
});

// GET /api/community — returns mock community data
router.get('/community', (req, res) => {
  res.json({
    categories: communityMock.categories,
    topics: communityMock.topics,
    users: communityMock.users,
  });
});

// GET /api/community/topic/:id — returns a single topic with its replies and users
router.get('/community/topic/:id', (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  const topic = communityMock.topics.find((t) => t.id === topicId);

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  const replies = communityMock.replies.filter((r) => r.topic_id === topicId);
  const category = communityMock.categories.find((c) => c.id === topic.category_id);

  // Collect all referenced user IDs and build a users map
  const userIds = new Set([topic.author_id, ...replies.map((r) => r.author_id)]);
  const users = communityMock.users.filter((u) => userIds.has(u.id));

  res.json({ topic, replies, category, users });
});

// GET /api/macro-outlook — returns aggregated macro data and economic events
router.get('/macro-outlook', async (req, res) => {
  try {
    const latest = await PreloadedMarketData.findOne({ dataId: 'latest' }).catch(() => null);
    if (!latest || !latest.macroOutlook) {
        return res.status(202).json({
            regime: "CALCULATING",
            score: 50,
            recommendations: { prefer: [], avoid: [] },
            trend6m: [0, 0, 0, 0, 0, 0],
            events: []
        });
    }
    res.json(latest.macroOutlook);
  } catch (error) {
    console.error('Error fetching macro outlook:', error);
    res.status(202).json({
        regime: "CALCULATING",
        score: 50,
        recommendations: { prefer: [], avoid: [] },
        trend6m: [0, 0, 0, 0, 0, 0],
        events: []
    });
  }
});

// GET /api/admin/config
router.get('/admin/config', protect, master, async (req, res) => {
  try {
    let config = await MarketConfig.findOne({ configId: 'default' });
    if (!config) {
      config = new MarketConfig();
      await config.save();
    }
    res.json(config);
  } catch (error) {
    console.error('Error in GET /admin/config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// POST /api/admin/config
router.post('/admin/config', protect, master, async (req, res) => {
  try {
    const { assetGroups } = req.body;
    let config = await MarketConfig.findOneAndUpdate(
      { configId: 'default' },
      { assetGroups },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (error) {
    console.error('Error in POST /admin/config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// POST /api/admin/force-refresh
router.post('/admin/force-refresh', protect, master, async (req, res) => {
  try {
    const marketCronJob = require('../services/marketCronJob');
    // Run it asynchronously so we don't block the request for 30s
    marketCronJob.runCalculations().catch(e => console.error("Force refresh error:", e));
    res.json({ message: 'Refresh started in background. Data will update in a few minutes.' });
  } catch (error) {
    console.error('Error in POST /admin/force-refresh:', error);
    res.status(500).json({ error: 'Failed to force refresh' });
  }
});

// GET /api/asset-details/:ticker — completely standalone endpoint for Full Analysis page
router.get('/asset-details/:ticker', getAssetDetails);

// GET /api/smart-quant/:ticker — deep quantitative diagnostic breakdown
router.get('/smart-quant/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const cleanTicker = ticker.trim().toUpperCase();
    const marketDataService = require('../services/marketDataService');
    const marketsService = require('../services/marketsService');

    // 1. Fast cache check from preloaded dashboard & byCategory (0ms)
    let fromDashboard = (marketDataService.cachedDashboardData?.assets || []).find(a =>
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
    if (fromDashboard && fromDashboard.pillars) {
      return res.json({
        ticker: fromDashboard.ticker,
        name: fromDashboard.name,
        price: fromDashboard.price || fromDashboard.prezzo,
        currency: 'USD',
        change24h: fromDashboard.var1D || 0,
        smartScore: fromDashboard.smartScore,
        smartScoreLabel: fromDashboard.smartScoreLabel,
        tradeSetup: fromDashboard.tradeSetup,
        pillars: fromDashboard.pillars,
        breakdown: fromDashboard.breakdown
      });
    }

    // 2. Fast cache check from preloaded markets sections (0ms)
    const fromMarkets = marketsService.findAsset(cleanTicker);
    if (fromMarkets && fromMarkets.pillars) {
      return res.json({
        ticker: fromMarkets.ticker,
        name: fromMarkets.name,
        price: fromMarkets.price || fromMarkets.prezzo,
        currency: 'USD',
        change24h: fromMarkets.var1D || 0,
        smartScore: fromMarkets.smartScore,
        smartScoreLabel: fromMarkets.smartScoreLabel,
        tradeSetup: fromMarkets.tradeSetup,
        pillars: fromMarkets.pillars,
        breakdown: fromMarkets.breakdown
      });
    }

    // 3. Universe lookup and instant enrichment (0ms)
    const ASSET_UNIVERSE = require('../seeds/assetUniverse');
    const assetMeta = ASSET_UNIVERSE.find(a =>
      a.ticker.toUpperCase() === cleanTicker ||
      a.yahooTicker.toUpperCase() === cleanTicker ||
      a.name.toUpperCase() === cleanTicker
    );

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
        ticker: assetMeta.ticker,
        name: assetMeta.name,
        price: enriched.price,
        currency: assetMeta.currency || 'USD',
        change24h: enriched.var1D,
        smartScore: enriched.smartScore,
        smartScoreLabel: enriched.smartScoreLabel,
        tradeSetup: enriched.tradeSetup,
        pillars: enriched.pillars,
        breakdown: enriched.breakdown
      });
    }

    // 4. Fallback: compute default SmartQuant diagnostic with engine
    const smartQuantEngine = require('../services/smartQuantEngine');
    const defaultCalc = smartQuantEngine.calculateSmartScore({
      ticker: cleanTicker,
      quote: { regularMarketPrice: 100, regularMarketChangePercent: 0, quoteType: 'EQUITY' },
      quotes: [],
      sector: 'EQUITY',
      macroData: { regime: 'REFLAZIONE', score: 68 }
    });

    return res.json({
      ticker: cleanTicker,
      name: cleanTicker,
      price: 100,
      currency: 'USD',
      change24h: 0,
      ...defaultCalc
    });
  } catch (err) {
    console.error(`Error in /api/smart-quant/${req.params.ticker}:`, err);
    res.status(500).json({ error: 'Failed to calculate SmartQuant diagnostics', details: err.message });
  }
});

// GET /api/quick-insight/:ticker — returns a quick AI insight using Gemini
router.get('/quick-insight/:ticker', optionalAuth, softRequirePro, aiLimiter, async (req, res) => {
  try {
    const { ticker } = req.params;
    const { price } = req.query; // optional
    const { generateQuickInsight } = require('../services/aiSynthesisService');
    const result = await generateQuickInsight(ticker, price || 'corrente');
    res.json(result);
  } catch (error) {
    console.error(`Error fetching quick insight for ${req.params.ticker}:`, error);
    res.status(500).json({ error: 'Failed to fetch quick insight' });
  }
});

// GET /api/crypto-divergence — returns an AI analysis of crypto divergence
router.get('/crypto-divergence', optionalAuth, softRequirePro, aiLimiter, async (req, res) => {
  try {
    const { generateCryptoDivergence } = require('../services/aiSynthesisService');
    const marketsData = await marketsService.getMarketsData();
    const cryptoAssets = marketsData.sections.crypto?.assets || [];
    const result = await generateCryptoDivergence(cryptoAssets);
    res.json(result);
  } catch (error) {
    console.error(`Error fetching crypto divergence:`, error);
    res.status(500).json({ error: 'Failed to fetch crypto divergence' });
  }
});

// GET /api/stagflation-alert — checks if stagflation macro conditions are met
router.get('/stagflation-alert', optionalAuth, softRequirePro, aiLimiter, async (req, res) => {
  try {
    const marketsData = await marketsService.getMarketsData();
    const usa = marketsData.sections.usa?.assets || [];
    const commodities = marketsData.sections.commodities?.assets || [];
    
    // Find SPY
    const spy = usa.find(a => a.yahooTicker === '^GSPC');
    // Find Oil (Brent or Crude, whichever is higher score or either > 80)
    const brent = commodities.find(a => a.yahooTicker === 'BZ=F');
    const crude = commodities.find(a => a.yahooTicker === 'CL=F');
    const oil = (brent?.smartScore >= crude?.smartScore) ? brent : crude;

    if (spy && oil && oil.smartScore >= 80 && spy.smartScore < 60) {
      const { generateStagflationAlert } = require('../services/aiSynthesisService');
      const result = await generateStagflationAlert(oil.ticker, oil.smartScore, spy.smartScore);
      res.json(result);
    } else {
      res.json({ insight: null });
    }
  } catch (error) {
    console.error(`Error checking stagflation alert:`, error);
    res.status(500).json({ error: 'Failed to verify stagflation patterns' });
  }
});

// GET /api/capital-flow
router.get('/capital-flow', optionalAuth, softRequirePro, aiLimiter, async (req, res) => {
  try {
    const marketsData = await marketsService.getMarketsData();
    
    const getAvg = (groupName) => {
      const assets = marketsData.sections[groupName]?.assets || [];
      if (assets.length === 0) return 0;
      const sum = assets.reduce((acc, curr) => acc + curr.smartScore, 0);
      return Math.round(sum / assets.length);
    };

    const averages = {
      usa: getAvg('usa'),
      europa: getAvg('europa'),
      asia: getAvg('asia'),
      developed: getAvg('developed'),
      emergenti: getAvg('emergenti')
    };

    const { generateCapitalFlow } = require('../services/aiSynthesisService');
    const result = await generateCapitalFlow(averages);
    res.json(result);
  } catch (error) {
    console.error(`Error fetching capital flow:`, error);
    res.status(500).json({ error: 'Failed to fetch capital flow' });
  }
});

// GET /api/macro/central-banks — Fetches Central Banks tones and FRED rates
router.get('/macro/central-banks', async (req, res) => {
  try {
    const response = {};
    const regions = Object.keys(centralBanksData);
    
    // Fetch rates in parallel
    const ratePromises = regions.map(region => fredService.getLatestRate(region));
    const rates = await Promise.all(ratePromises);

    regions.forEach((region, index) => {
      const bank = centralBanksData[region] || {};
      response[region] = {
        ...bank,
        rate: rates[index] || bank.rate || '0.00%'
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching central banks data:', error);
    res.status(500).json({ error: 'Failed to fetch central banks data' });
  }
});

// GET /api/macro/regime/:region — Calculates macro regime based on regional equity proxy
router.get('/macro/regime/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    // Map regions to custom equity tickers
    // [Equity, Bond, Gold, Oil, Vix]
    const regionalMapping = {
      usa: ['SPY', 'TLT', 'GLD', 'USO', '^VIX'],
      europe: ['VGK', 'TLT', 'GLD', 'USO', '^VIX'],
      uk: ['EWU', 'TLT', 'GLD', 'USO', '^VIX'],
      japan: ['EWJ', 'TLT', 'GLD', 'USO', '^VIX'],
      asia: ['MCHI', 'TLT', 'GLD', 'USO', '^VIX'],
      australia: ['EWA', 'TLT', 'GLD', 'USO', '^VIX'],
      canada: ['EWC', 'TLT', 'GLD', 'USO', '^VIX'],
      switzerland: ['EWL', 'TLT', 'GLD', 'USO', '^VIX']
    };

    const tickers = regionalMapping[region];
    if (!tickers) {
      return res.status(400).json({ error: 'Unsupported region' });
    }

    const regimeData = await macroCalculator.calculateCurrentRegime(tickers);
    res.json(regimeData);
  } catch (error) {
    console.error(`Error fetching regime for ${req.params.region}:`, error);
    res.status(500).json({ error: 'Failed to fetch regional macro regime' });
  }
});

module.exports = router;
