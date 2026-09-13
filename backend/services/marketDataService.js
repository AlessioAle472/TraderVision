const fs = require('fs');
const path = require('path');
const axios = require('axios');
// yahoo-finance2 v3: default export is the class itself — must use `new`
const YahooFinance = require('yahoo-finance2').default;
// suppressNotices silences the survey prompt; validateResult is passed per-call
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const macroCalculator = require('./macroCalculator');
const smartQuantEngine = require('./smartQuantEngine');

const LOCAL_DASHBOARD_FILE = path.join(__dirname, '../data/preloadedDashboard.json');

class MarketDataService {
  constructor() {
    this.finnhubKey = process.env.FINNHUB_API_KEY;
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.lastKnownPrices = {};
    // Tracks the last-sent SmartScore per ticker to compute live variation (±1 pt)
    this.lastKnownScores = {};
    this.cachedDashboardData = null;
    this.lastMtime = 0;
    this._loadDiskDashboardCache();
  }

  _loadDiskDashboardCache() {
    try {
      if (fs.existsSync(LOCAL_DASHBOARD_FILE)) {
        const stats = fs.statSync(LOCAL_DASHBOARD_FILE);
        const raw = fs.readFileSync(LOCAL_DASHBOARD_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.assets && parsed.assets.length > 0) {
          this.cachedDashboardData = parsed;
          this.lastMtime = stats.mtimeMs;
          console.log(`[MarketDataService] ✅ In-memory dashboard cache primed (${parsed.assets.length} assets)`);
        }
      }
    } catch (err) {
      console.warn('[MarketDataService] Could not read local dashboard cache:', err.message);
    }
  }

  async getTrendingTickers(count = 10) {
    try {
      console.log('[MarketDataService] Fetching trending tickers from screener...');
      // validateResult: false — disables strict JSON schema check that fails when
      // Yahoo adds new fields not yet reflected in yahoo-finance2's bundled schema
      const result = await yf.screener('day_gainers', { count }, { validateResult: false });
      
      if (result && result.quotes && result.quotes.length > 0) {
        return result.quotes.map(q => ({
          name: q.symbol,
          yahooTicker: q.symbol
        }));
      }
      
      console.warn('[MarketDataService] Screener returned no results. Using fallback list.');
      throw new Error('Empty screener results');
    } catch (error) {
      console.error('[MarketDataService] Error fetching trending tickers, using defaults:', error.message);
      
      // Critical Fallback: Key assets to ensure the dashboard is NEVER empty
      const fallbacks = [
        'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 
        'BTC-USD', 'ETH-USD', 'XRP-USD', 
        'GC=F', 'SI=F', 'CL=F', 
        'EURUSD=X', 'GBPUSD=X', 'JPY=X'
      ];
      
      return fallbacks.slice(0, count).map(ticker => ({
        name: ticker,
        yahooTicker: ticker
      }));
    }
  }

  async getMarketOverview() {
    try {
      const symbols = ['^GSPC', '^VIX'];
      const quotes = await yf.quote(symbols);
      const sp500 = quotes.find(q => q.symbol === '^GSPC');
      const vix = quotes.find(q => q.symbol === '^VIX');
      return {
        sp500: {
          price: sp500?.regularMarketPrice || 0,
          change: sp500?.regularMarketChangePercent || 0,
          isUp: (sp500?.regularMarketChangePercent || 0) >= 0
        },
        vix: {
          price: vix?.regularMarketPrice || 0,
          change: vix?.regularMarketChangePercent || 0,
          isScary: (vix?.regularMarketPrice || 0) > 20
        }
      };
    } catch (error) {
      console.error('Error fetching market overview:', error.message);
      // Return bare minimum overview to avoid crashes
      return {
        sp500: { price: 0, change: 0, isUp: false },
        vix: { price: 0, change: 0, isScary: false }
      };
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

  async getDashboardData(customAssets = null, category = null) {
    if (!this.cachedDashboardData) {
      this._loadDiskDashboardCache();
    }

    // 1. If category requested and available in byCategory cache, serve in 0ms!
    if (category && this.cachedDashboardData?.byCategory && this.cachedDashboardData.byCategory[category]) {
      let catAssets = this.cachedDashboardData.byCategory[category];
      if (category === 'EQUITY') {
        catAssets = catAssets.filter(a => 
          (a.category === 'EQUITY' || !a.category) && 
          a.ticker !== 'GC=F' && a.ticker !== 'GLD' && a.ticker !== 'XAUUSD' && a.ticker !== 'SI=F' && a.ticker !== 'SLV' && a.ticker !== 'USO' &&
          !a.name?.toLowerCase().includes('oro spot') && !a.name?.toLowerCase().includes('gold spot')
        );
      }
      return {
        overview: this.cachedDashboardData.overview || {
          sp500: { price: 5648.40, change: 0.45, isUp: true },
          vix: { price: 15.20, change: -3.40, isScary: false },
          highScoresCount: catAssets.filter(a => (a.smartScore || 0) >= 65).length
        },
        assets: catAssets,
        byCategory: this.cachedDashboardData.byCategory
      };
    }

    // 2. If default dashboard requested (no customAssets filter), serve from preloaded cache in 0ms!
    if (!customAssets) {
      try {
        if (fs.existsSync(LOCAL_DASHBOARD_FILE)) {
          const stats = fs.statSync(LOCAL_DASHBOARD_FILE);
          if (!this.cachedDashboardData || stats.mtimeMs > (this.lastMtime || 0)) {
            this._loadDiskDashboardCache();
          }
        }
      } catch (e) {}

      if (this.cachedDashboardData && this.cachedDashboardData.assets && this.cachedDashboardData.assets.length > 0) {
        return this.cachedDashboardData;
      }
    }

    // 3. If customAssets requested (e.g. category tabs, MacroCards regional cards, or watchlist)
    if (customAssets && typeof customAssets === 'object') {
      const requestedKeys = Object.keys(customAssets);
      const requestedYahoo = Object.values(customAssets);
      const allPreloaded = (this.cachedDashboardData?.assets || []);
      const byCat = this.cachedDashboardData?.byCategory || {};
      const marketsService = require('./marketsService');
      const ASSET_UNIVERSE = require('../seeds/assetUniverse');
      const { enrichAsset } = require('../seeds/seedPreloadedData');
      const matched = [];

      for (let i = 0; i < requestedKeys.length; i++) {
        const key = requestedKeys[i];
        const yTicker = requestedYahoo[i] || key;
        const keyUpper = key.toUpperCase();
        const yUpper = yTicker.toUpperCase();

        // Check A: Main dashboard assets
        let found = allPreloaded.find(a => 
          (a.ticker && a.ticker.toUpperCase() === keyUpper) ||
          (a.yahooTicker && a.yahooTicker.toUpperCase() === yUpper) ||
          (a.yahooTicker && a.yahooTicker.toUpperCase() === keyUpper) ||
          (a.name && a.name.toUpperCase() === keyUpper)
        );

        // Check B: byCategory pools
        if (!found) {
          for (const catList of Object.values(byCat)) {
            found = catList.find(a =>
              (a.ticker && a.ticker.toUpperCase() === keyUpper) ||
              (a.yahooTicker && a.yahooTicker.toUpperCase() === yUpper) ||
              (a.yahooTicker && a.yahooTicker.toUpperCase() === keyUpper) ||
              (a.name && a.name.toUpperCase() === keyUpper)
            );
            if (found) break;
          }
        }

        // Check C: marketsService
        if (!found) {
          found = marketsService.findAsset(key) || marketsService.findAsset(yTicker);
        }

        // Check D: ASSET_UNIVERSE metadata with live SmartQuant enrichment (0ms)
        if (!found) {
          const meta = ASSET_UNIVERSE.find(a =>
            a.ticker.toUpperCase() === keyUpper ||
            a.yahooTicker.toUpperCase() === yUpper ||
            a.yahooTicker.toUpperCase() === keyUpper
          );
          if (meta) {
            found = enrichAsset({
              ticker: meta.ticker,
              name: meta.name,
              yahooTicker: meta.yahooTicker,
              price: 100,
              var1D: 0.5,
              var1W: 1.5,
              var1M: 3.0,
              type: meta.category === 'FOREX' ? 'CURRENCY' : meta.category === 'COMMODITIES' ? 'FUTURE' : meta.category === 'INDICES' ? 'INDEX' : 'EQUITY',
              category: meta.category
            });
          }
        }

        if (found) {
          matched.push(found);
        }
      }

      // Return matched results immediately from cache in 0ms (no hanging on Yahoo Finance!)
      return {
        overview: this.cachedDashboardData?.overview || {
          sp500: { price: 5648.40, change: 0.45, isUp: true },
          vix: { price: 15.20, change: -3.40, isScary: false },
          highScoresCount: matched.filter(a => (a.smartScore || 0) >= 65).length
        },
        assets: matched.sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0))
      };
    }

    // 3. Fallback: try to fetch from Yahoo Finance (only works with network access)
    let assets = customAssets;
    if (!assets) {
      const trending = await this.getTrendingTickers(15); 
      if (trending.length > 0) {
        assets = {};
        trending.forEach(t => assets[t.name] = t.yahooTicker);
      } else {
        return this.cachedDashboardData || { overview: null, assets: [] };
      }
    }

    try {
      const overview = await this.getMarketOverview();
      const assetEntries = Object.entries(assets);
      const rawResults = await this._processInChunks(assetEntries, 4, async ([name, yahooTicker]) => {
        try {
          // 1. Fetch 60D history for sparkline and technical analysis
          const history = await yf.chart(yahooTicker, {
            period1: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            interval: '1d'
          }).catch(() => null);

          // 2. Quote and fundamentals
          const quote = await yf.quote(yahooTicker).catch(() => null);
          if (!quote || quote.regularMarketPrice === undefined) {
             console.log(`Discarding ${name}: Could not fetch quote`);
             return null;
          }

          // For default trending screener, require >= 2 history quotes. For custom requested assets, accept available quotes
          if (!customAssets && (!history || !history.quotes || history.quotes.length < 2)) {
            console.log(`Discarding ${name}: Insufficient history (${history?.quotes?.length || 0} quotes)`);
            return null;
          }

          const validQuotes = (history && history.quotes) ? history.quotes.filter(q => q.close !== null) : [];
          const sparklineData = validQuotes.length > 0 
            ? validQuotes.slice(-7).map(q => q.close) 
            : [quote.regularMarketPrice, quote.regularMarketPrice];
          
          let var1W = 0; let var1M = 0;
          if (validQuotes.length >= 2) {
             const last = validQuotes[validQuotes.length - 1].close;
             const week = validQuotes[Math.max(0, validQuotes.length - 6)].close;
             const month = validQuotes[0].close;
             if (week) var1W = (last - week) / week * 100;
             if (month) var1M = (last - month) / month * 100;
          }
          
          const momentumVal = (var1W * 0.4) + (var1M * 0.6);
          const currentPrice = quote.regularMarketPrice;
          const var1D = quote.regularMarketChangePercent || 0;

          // 3. Multi-Factor SmartQuant Engine Scoring
          let macroData = null;
          try {
            macroData = await macroCalculator.calculateCurrentRegime();
          } catch (e) {}

          const quantResult = smartQuantEngine.calculateSmartScore({
            ticker: name,
            quote,
            quotes: validQuotes,
            sector: quote.quoteType || 'EQUITY',
            macroData
          });

          const score = quantResult.smartScore;
          const label = quantResult.smartScoreLabel;

          // ── SmartScore Variation Logic ────────────────────────────────────
          const prevScore = this.lastKnownScores[name];
          const scoreDelta = (prevScore !== undefined) ? (score - prevScore) : 0;
          this.lastKnownScores[name] = score; // persist for next refresh

          if (scoreDelta !== 0) {
            console.log(`[SmartQuant] ${name}: Score ${prevScore} → ${score} (${scoreDelta > 0 ? '+' : ''}${scoreDelta}) | Bias: ${label} | Setup: ${quantResult.tradeSetup.setupName}`);
          } else {
            console.log(`Keeping ${name}: Score ${score} | ${label}`);
          }

          return {
            ticker: name,
            yahooTicker: yahooTicker,
            name: name,
            prezzo: currentPrice,
            var1D: var1D,
            momentum: parseFloat(momentumVal.toFixed(2)),
            is7DUp: momentumVal >= 0,
            settore: quote.quoteType || 'EQUITY',
            rsi: quantResult.pillars.technical.data.rsi || '-',
            pe: quantResult.pillars.fundamental.data.pe || '-',
            smartScore: score,
            smartScoreLabel: label,
            scoreDelta: scoreDelta,
            sparkline: sparklineData,
            trend: quantResult.pillars.technical.data.trend || (momentumVal >= 0 ? 'Long' : 'Short'),
            fib_level_touched: 'None',
            volume_vs_avg: 1.0,
            tradeSetup: quantResult.tradeSetup,
            pillars: quantResult.pillars,
            breakdown: quantResult.breakdown
          };
        } catch (error) {
          console.error(`Error processing ${name}:`, error.message);
          return null;
        }
      });

      const results = rawResults.filter(r => r !== null);
      if (results.length === 0 && this.cachedDashboardData) {
        console.log('[MarketDataService] Live fetch yielded 0 assets, serving preloadedDashboard cache');
        return this.cachedDashboardData;
      }
      results.sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0));
      console.log(`Dashboard generated with ${results.length} valid assets.`);
      
      const highScoresCount = results.filter(r => r.smartScore > 70).length;

      const output = {
        overview: { ...overview, highScoresCount },
        assets: results
      };

      if (results.length > 0) {
        this.cachedDashboardData = output;
      }

      return output;
    } catch (error) {
      console.error('Critical error in getDashboardData:', error.message);
      return this.cachedDashboardData || { overview: null, assets: [] };
    }
  }

  saveDashboardData(dashboardData) {
    if (!dashboardData || !dashboardData.assets) return;
    this.cachedDashboardData = dashboardData;
    try {
      fs.writeFileSync(LOCAL_DASHBOARD_FILE, JSON.stringify(dashboardData, null, 2), 'utf-8');
      console.log('[MarketDataService] ✅ Saved updated dashboardData to preloadedDashboard.json');
    } catch (err) {
      console.error('[MarketDataService] Error saving dashboardData to disk:', err.message);
    }
  }

  async getHistoricalData(ticker, resolution, from, to) {
    let yahooTicker = ticker;
    try {
      if (ticker.includes('XAUUSD')) {
        yahooTicker = 'GC=F';
      } else if (ticker.includes(':')) {
        yahooTicker = ticker.split(':')[1];
      }

      // Race with a 1200ms timeout so chart fetching never hangs the user
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('YF timeout')), 1200));
      const chartPromise = yf.chart(yahooTicker, {
        period1: new Date(from * 1000),
        period2: new Date(to * 1000),
        interval: '1d'
      });

      const result = await Promise.race([chartPromise, timeoutPromise]);
      if (!result || !result.quotes || result.quotes.length === 0) {
        throw new Error('No historical data returned from Yahoo Finance');
      }
      return result.quotes.filter(q => q.close !== null).map(quote => ({
        time: Math.floor(new Date(quote.date).getTime() / 1000),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close
      }));
    } catch (error) {
      console.warn(`[getHistoricalData] Serving realistic fallback history for ${ticker} (${error.message})`);
      const marketsService = require('./marketsService');
      const seedData = require('../seeds/seedPreloadedData');
      const clean = ticker.trim().toUpperCase();

      const asset = (this.cachedDashboardData?.assets || []).find(a => 
        (a.ticker && a.ticker.toUpperCase() === clean) ||
        (a.yahooTicker && a.yahooTicker.toUpperCase() === clean)
      ) || marketsService.findAsset(clean);

      const basePrice = asset?.price || asset?.prezzo || 100;
      const var1D = asset?.var1D || 0;
      const var1W = asset?.var1W || 0;
      const var1M = asset?.var1M || 0;

      const realisticQuotes = seedData.generateRealisticHistory(basePrice, var1D, var1W, var1M, 60);
      return realisticQuotes.map(q => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close
      }));
    }
  }

  async search(query) {
    try {
      const result = await yf.search(query, { newsCount: 0, quotesCount: 5 });
      if (!result || !result.quotes) return [];
      return result.quotes.map(q => ({
        ticker: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType || q.typeDisp || 'Unknown'
      }));
    } catch (error) {
      console.error(`Error searching for ${query}:`, error.message);
      return [];
    }
  }
}

module.exports = new MarketDataService();
