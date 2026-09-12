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
// Free users: each section limited to FREE_LIMIT assets + paywalled flag
router.get('/markets', optionalAuth, softRequirePro, async (req, res, next) => {
  try {
    const original_json = res.json.bind(res);
    res.json = (data) => {
      if (!req.isPro && data && data.sections) {
        const truncatedSections = {};
        let anyTruncated = false;
        for (const [key, section] of Object.entries(data.sections)) {
          if (section.assets && section.assets.length > FREE_LIMIT) {
            truncatedSections[key] = {
              ...section,
              assets: section.assets.slice(0, FREE_LIMIT),
              totalCount: section.assets.length,
              paywalled: true,
            };
            anyTruncated = true;
          } else {
            truncatedSections[key] = section;
          }
        }
        return original_json({
          ...data,
          sections: truncatedSections,
          paywalled: anyTruncated,
          freeLimit: FREE_LIMIT,
        });
      }
      return original_json(data);
    };
    return getMarkets(req, res, next);
  } catch (err) {
    next(err);
  }
});

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
    const smartQuantEngine = require('../services/smartQuantEngine');
    const YahooFinance = require('yahoo-finance2').default;
    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const macroCalculator = require('../services/macroCalculator');

    // Resolve symbol
    let yfSymbol = ticker.toUpperCase();
    const mapping = await TickerMapping.findOne({ yfSymbol }).catch(() => null);
    if (mapping && mapping.yfSymbol) yfSymbol = mapping.yfSymbol;

    const [quote, history, macroData] = await Promise.all([
      yf.quote(yfSymbol).catch(() => null),
      yf.chart(yfSymbol, {
        period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        interval: '1d'
      }).catch(() => null),
      macroCalculator.calculateCurrentRegime().catch(() => null)
    ]);

    if (!quote) {
      return res.status(404).json({ error: `Ticker ${ticker} not found` });
    }

    const validQuotes = (history?.quotes || []).filter(q => q.close !== null);
    const result = smartQuantEngine.calculateSmartScore({
      ticker,
      quote,
      quotes: validQuotes,
      sector: quote.quoteType || 'EQUITY',
      macroData
    });

    res.json({
      ticker,
      name: quote.shortName || quote.longName || ticker,
      price: quote.regularMarketPrice,
      currency: quote.currency || 'USD',
      change24h: quote.regularMarketChangePercent || 0,
      ...result
    });
  } catch (err) {
    console.error(`Error in /api/smart-quant/${req.params.ticker}:`, err);
    res.status(500).json({ error: 'Failed to calculate SmartQuant diagnostics', details: err.message });
  }
});

// GET /api/quick-insight/:ticker — returns a quick AI insight using Gemini
router.get('/quick-insight/:ticker', protect, verifyAdmin, aiLimiter, async (req, res) => {
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
router.get('/crypto-divergence', protect, verifyAdmin, aiLimiter, async (req, res) => {
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
router.get('/stagflation-alert', protect, verifyAdmin, aiLimiter, async (req, res) => {
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
router.get('/capital-flow', protect, verifyAdmin, aiLimiter, async (req, res) => {
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
      response[region] = {
        name: centralBanksData[region].name,
        tone: centralBanksData[region].tone,
        nextMeeting: centralBanksData[region].nextMeeting,
        rate: rates[index]
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
      japan: ['EWJ', 'TLT', 'GLD', 'USO', '^VIX'],
      asia: ['MCHI', 'TLT', 'GLD', 'USO', '^VIX'],
      australia: ['EWA', 'TLT', 'GLD', 'USO', '^VIX'],
      canada: ['EWC', 'TLT', 'GLD', 'USO', '^VIX']
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
