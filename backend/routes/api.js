const express = require('express');
const router = express.Router();
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
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
const { protect, master } = require('../middleware/authMiddleware');

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

// POST /api/briefing/force-send — manually trigger the briefing cycle (Fetch -> AI -> Email)
router.post('/briefing/force-send', async (req, res) => {
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
    const mapping = await TickerMapping.findOne({ yfSymbol: req.params.yfSymbol.toUpperCase() });
    res.json({ tvSymbol: mapping ? mapping.tvSymbol : null });
  } catch (error) {
    console.error('API Error in GET /ticker-mapping:', error);
    res.status(500).json({ error: 'Failed to fetch mapping' });
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
router.get('/markets', async (req, res) => {
    try {
        const data = await marketsService.getMarketsData();
        res.json(data);
    } catch (error) {
        console.error('API Error in /markets:', error.message);
        res.status(500).json({ error: 'Failed to fetch markets data' });
    }
});

// POST /api/ai-synthesis
router.post('/ai-synthesis', async (req, res) => {
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
router.post('/risk/report', async (req, res) => {
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
router.get('/briefing/latest', async (req, res) => {
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
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await marketDataService.search(q);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/search:', error);
    res.status(500).json({ error: 'Failed to search for assets' });
  }
});

// GET /api/dashboard — returns dashboard data, supports optional ?tickers=...
router.get('/dashboard', async (req, res) => {
  try {
    const { tickers } = req.query;
    let customAssets = null;

    if (tickers) {
      // Expecting tickers=AAPL,BTC-USD,GC=F
      customAssets = {};
      tickers.split(',').forEach(t => {
        const cleanTicker = t.trim();
        if (cleanTicker) {
          // We use the ticker as the name too for custom assets
          customAssets[cleanTicker] = cleanTicker;
        }
      });
    }

    const data = await marketDataService.getDashboardData(customAssets);
    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Endpoint to provide safe API configuration to frontend
router.get('/config', (req, res) => {
  res.json({
    finnhubKey: process.env.FINNHUB_API_KEY || ''
  });
});

// Endpoint to get historical stock/forex data for charts
router.get('/history', async (req, res) => {
  const { ticker, resolution, from, to } = req.query;
  
  if (!ticker || !resolution || !from || !to) {
    return res.status(400).json({ error: 'Missing required query parameters: ticker, resolution, from, to' });
  }

  try {
    const data = await marketDataService.getHistoricalData(ticker, resolution, from, to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// GET /api/calendar — retrieves real economic events via Python script
router.get('/calendar', async (req, res) => {
  const { start, end, lang = 'en' } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end date parameters' });
  }

  try {
    const scriptPath = path.join(__dirname, '../daily_news.py');
    const { stdout, stderr } = await execPromise(`python3 "${scriptPath}" --lang "${lang}"`, { windowsHide: true });
    
    // Find the first occurrence of { and parse from there to ignore warnings
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      throw new Error(`Invalid output from script: ${stdout}`);
    }
    const jsonStr = stdout.substring(jsonStart);
    const parsedData = JSON.parse(jsonStr);
    
    if (parsedData.error) {
      throw new Error(parsedData.error);
    }
    
    res.json(parsedData.events || []);
  } catch (error) {
    console.error('Error fetching economic calendar from python script:', error.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

// GET /api/economic-calendar — fetch live economic calendar via Finnhub
router.get('/economic-calendar', async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query;
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) throw new Error("Finnhub API key missing");

    const now = new Date();
    let fromDate = new Date(now);
    let toDate = new Date(now);
    let localDates = []; // array of local date strings to filter by

    if (timeframe === 'yesterday') {
      fromDate.setDate(now.getDate() - 1);
      toDate = new Date(fromDate);
      localDates.push(fromDate.toLocaleDateString());
    } else if (timeframe === 'tomorrow') {
      fromDate.setDate(now.getDate() + 1);
      toDate = new Date(fromDate);
      localDates.push(fromDate.toLocaleDateString());
    } else if (timeframe === 'this_week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      fromDate.setDate(diffToMonday);
      toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 6);
      
      // Populate localDates for the whole week
      for(let i=0; i<7; i++) {
        let d = new Date(fromDate);
        d.setDate(d.getDate() + i);
        localDates.push(d.toLocaleDateString());
      }
    } else {
      // today
      localDates.push(now.toLocaleDateString());
    }

    // Add padding to Finnhub request to handle UTC conversions safely
    const fetchFrom = new Date(fromDate);
    fetchFrom.setDate(fetchFrom.getDate() - 1);
    const fetchTo = new Date(toDate);
    fetchTo.setDate(fetchTo.getDate() + 1);
    
    const fromStr = fetchFrom.toISOString().split('T')[0];
    const toStr = fetchTo.toISOString().split('T')[0];

    const response = await axios.get(`https://finnhub.io/api/v1/calendar/economic?from=${fromStr}&to=${toStr}&token=${apiKey}`);
    
    const events = response.data.economicCalendar || [];
    
    const mappedEvents = events.map((ev, index) => {
      // Finnhub times are in UTC "YYYY-MM-DD HH:MM:SS"
      const eventTime = new Date(ev.time + " UTC");
      const isPast = eventTime < now;
      const timeString = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      return {
        id: index,
        time: timeString,
        country: ev.country, // ISO2 code (e.g. US, EU, JP)
        event: ev.event,
        impact: ev.impact ? ev.impact.toUpperCase() : 'LOW',
        actual: ev.actual !== null ? String(ev.actual) : "",
        consensus: ev.estimate !== null ? String(ev.estimate) : "",
        previous: ev.prev !== null ? String(ev.prev) : "",
        isPast: isPast,
        timestamp: eventTime.getTime(),
        localDateStr: eventTime.toLocaleDateString(),
        dateString: eventTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      };
    });

    // Filter only events that fall exactly in our desired dates locally
    const filteredEvents = mappedEvents.filter(ev => {
      return localDates.includes(ev.localDateStr);
    }).sort((a, b) => a.timestamp - b.timestamp);

    res.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching economic calendar:", error.message);
    res.status(500).json({ error: "Failed to fetch calendar data" });
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
    const latest = await PreloadedMarketData.findOne({ dataId: 'latest' });
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
    res.status(500).json({ error: 'Failed to fetch macro outlook data' });
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
router.get('/asset-details/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    // We send a single asset dictionary payload, reusing the python logic core
    const data = await marketDataService.getDashboardData({ [ticker]: ticker });
    
    if (!data || !data.assets || data.assets.length === 0) {
      return res.status(404).json({ error: 'Asset data calculation failed or unsupported.' });
    }
    
    res.json(data.assets[0]);
  } catch (error) {
    console.error(`Error fetching single asset details for ${req.params.ticker}:`, error);
    res.status(500).json({ error: 'Failed to fetch specific asset details' });
  }
});

// GET /api/quick-insight/:ticker — returns a quick AI insight using Gemini for assets crossing the >80 smart score
router.get('/quick-insight/:ticker', async (req, res) => {
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
router.get('/crypto-divergence', async (req, res) => {
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

// GET /api/stagflation-alert — checks if stagflation macro conditions are met and returns AI warning
router.get('/stagflation-alert', async (req, res) => {
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
router.get('/capital-flow', async (req, res) => {
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
