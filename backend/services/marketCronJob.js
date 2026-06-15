const cron = require('node-cron');
const MarketConfig = require('../models/MarketConfig');
const PreloadedMarketData = require('../models/PreloadedMarketData');
const macroCalculator = require('./macroCalculator');
const economicCalendar = require('./economicCalendar');
const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

// Factor ETF proxies
const FACTOR_TICKERS = {
  'SPHB': 'High Beta',
  'VLUE': 'Value',
  'VUG': 'Growth',
  'MTUM': 'Momentum',
  'DEF': 'Defensive'
};

class MarketCronJob {
  async _fetchAsset(yahooTicker, displayName) {
    try {
      // 1. Quote data
      const quote = await yf.quote(yahooTicker).catch(() => null);
      if (!quote || quote.regularMarketPrice === undefined) return null;

      const price = quote.regularMarketPrice;
      const var1D = quote.regularMarketChangePercent || 0;

      // 2. Period changes: attempt 1W and 1M from chart history
      let var1W = 0;
      let var1M = 0;
      try {
        const history1M = await yf.chart(yahooTicker, {
          period1: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          interval: '1d'
        });
        const quotes = history1M?.quotes || [];
        if (quotes.length >= 2) {
          const lastClose = quotes[quotes.length - 1].close;
          const weekIdx = Math.max(0, quotes.length - 6);
          const weekClose = quotes[weekIdx]?.close;
          if (weekClose && lastClose) var1W = ((lastClose - weekClose) / weekClose) * 100;
          const monthClose = quotes[0]?.close;
          if (monthClose && lastClose) var1M = ((lastClose - monthClose) / monthClose) * 100;
        }
      } catch (e) {
        // Silently use 0s
      }

      // 3. Sparkline (7-day)
      let sparkline = [];
      try {
        const hist7 = await yf.chart(yahooTicker, {
          period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          interval: '1d'
        });
        sparkline = (hist7?.quotes || []).map(q => q.close).filter(c => c !== null && c !== undefined);
      } catch (e) {}

      // 4. Smart Score via JS (No Python)
      let smartScore = 50;
      let smartScoreLabel = 'Hold';
      let momentum = 0;
      
      try {
        // Simple momentum proxy based on 1W and 1M returns
        // Normally RSI is used, but we can approximate momentum
        momentum = (var1W * 0.4) + (var1M * 0.6);
        
        // Base score 50, add momentum scaled
        // For example, if var1M is 5%, momentum is ~5.
        // Let's map momentum (-10 to 10) to score (0 to 100)
        smartScore = Math.min(100, Math.max(0, Math.round(50 + (momentum * 5))));
        
        if (smartScore >= 80) smartScoreLabel = 'Strong Buy';
        else if (smartScore >= 60) smartScoreLabel = 'Buy';
        else if (smartScore > 40) smartScoreLabel = 'Hold';
        else if (smartScore > 20) smartScoreLabel = 'Sell';
        else smartScoreLabel = 'Strong Sell';
        
      } catch (e) {
        console.error(`[MarketCronJob] Smart score failed for ${yahooTicker}: ${e.message}`);
      }

      return {
        ticker: displayName,
        yahooTicker,
        price,
        var1D: parseFloat(var1D.toFixed(2)),
        var1W: parseFloat(var1W.toFixed(2)),
        var1M: parseFloat(var1M.toFixed(2)),
        momentum: parseFloat(momentum.toFixed(2)),
        smartScore,
        smartScoreLabel,
        sparkline
      };
    } catch (error) {
      console.error(`[MarketCronJob] Error fetching ${yahooTicker}:`, error.message);
      return null;
    }
  }

  async _processInChunks(items, chunkSize, asyncFn) {
    const results = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(item => asyncFn(item)));
      results.push(...chunkResults);
    }
    return results;
  }

  async _fetchFactors() {
    try {
      const tickers = Object.keys(FACTOR_TICKERS);
      const quotes = await yf.quote(tickers).catch(() => []);
      return Object.entries(FACTOR_TICKERS).map(([ticker, label]) => {
        const q = (Array.isArray(quotes) ? quotes : [quotes]).find(x => x?.symbol === ticker);
        const change = q?.regularMarketChangePercent || 0;
        const normalized = Math.min(100, Math.max(0, 50 + (change / 3) * 50));
        return {
          name: label,
          ticker,
          change: parseFloat(change.toFixed(2)),
          value: Math.round(normalized)
        };
      });
    } catch (error) {
      return Object.values(FACTOR_TICKERS).map(label => ({ name: label, ticker: '', change: 0, value: 50 }));
    }
  }

  async runCalculations() {
    console.log('[MarketCronJob] Running massive market data calculations (Zero Lag Cache Gen)...');
    
    // 1. Get config
    let config = await MarketConfig.findOne({ configId: 'default' });
    if (!config) {
        // Fallback or create default
        config = new MarketConfig();
        await config.save();
    }

    const groupKeys = Object.keys(config.assetGroups);
    
    // Process groups in parallel
    const resultsPromises = groupKeys.map(async (key) => {
      const group = config.assetGroups[key];
      const entries = Object.entries(group.tickers);
      const groupAssets = await this._processInChunks(entries, 5, ([ticker, name]) => this._fetchAsset(ticker, name));
      return {
        key,
        data: {
          label: group.label,
          assets: groupAssets.filter(r => r !== null).sort((a, b) => b.smartScore - a.smartScore)
        }
      };
    });

    console.log('[MarketCronJob] Fetching market assets, factors, and macro outlook in parallel...');
    
    // Clear cache for macro
    try {
      const fs = require('fs');
      const DATA_FILE = path.join(__dirname, '../data/daily_macro.json');
      if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
    } catch(e) {}

    const [groupResults, factors, macroOutlook] = await Promise.all([
      Promise.all(resultsPromises),
      this._fetchFactors(),
      (async () => {
        let macro = null;
        let events = [];
        try {
          macro = await macroCalculator.calculateCurrentRegime();
          events = await economicCalendar.getHighImpactEvents();
        } catch(e) {
          console.error('[MarketCronJob] Error calculating macro:', e.message);
        }
        return { ...(macro || {}), events: events || [] };
      })()
    ]);

    const sections = {};
    groupResults.forEach((res) => {
        sections[res.key] = res.data;
    });

    const marketsData = {
        sections,
        factors,
        generatedAt: new Date().toISOString()
    };

    // 3. Save to PreloadedMarketData
    await PreloadedMarketData.findOneAndUpdate(
      { dataId: 'latest' },
      { marketsData, macroOutlook, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    console.log('[MarketCronJob] Finished calculations and saved to database successfully.');
  }

  init() {
    // Run every day at 06:00 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('[MarketCronJob] Triggered by cron schedule at 06:00 AM.');
      await this.runCalculations();
    });
    console.log('[MarketCronJob] Scheduled at 06:00 AM daily.');
  }
}

module.exports = new MarketCronJob();
