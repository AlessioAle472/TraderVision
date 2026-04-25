const express = require('express');
const router = express.Router();
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
const { generateSynthesis } = require('../services/aiSynthesisService');
const { generateRiskReport } = require('../services/riskReportService');
const marketsService = require('../services/marketsService');

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
    const [macro, events] = await Promise.all([
      macroCalculator.calculateCurrentRegime(),
      economicCalendar.getHighImpactEvents()
    ]);

    res.json({
      ...macro,
      events
    });
  } catch (error) {
    console.error('Error fetching macro outlook:', error);
    res.status(500).json({ error: 'Failed to fetch macro outlook data' });
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

module.exports = router;
