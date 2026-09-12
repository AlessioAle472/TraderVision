const axios = require('axios');
// yahoo-finance2 v3: default export is the class itself — must use `new`
const YahooFinance = require('yahoo-finance2').default;
// suppressNotices silences the survey prompt; validateResult is passed per-call
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const macroCalculator = require('./macroCalculator');
const smartQuantEngine = require('./smartQuantEngine');

class MarketDataService {
  constructor() {
    this.finnhubKey = process.env.FINNHUB_API_KEY;
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.lastKnownPrices = {};
    // Tracks the last-sent SmartScore per ticker to compute live variation (±1 pt)
    this.lastKnownScores = {};
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

  async getDashboardData(customAssets = null) {
    let assets = customAssets;
    if (!assets) {
      const trending = await this.getTrendingTickers(15); 
      if (trending.length > 0) {
        assets = {};
        trending.forEach(t => assets[t.name] = t.yahooTicker);
      } else {
        return { overview: null, assets: [] };
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

          if (!history || !history.quotes || history.quotes.length < 2) {
            console.log(`Discarding ${name}: Insufficient history (${history?.quotes?.length || 0} quotes)`);
            return null;
          }
          const validQuotes = history.quotes.filter(q => q.close !== null);
          const sparklineData = validQuotes.slice(-7).map(q => q.close);

          // 2. Quote and fundamentals
          const quote = await yf.quote(yahooTicker).catch(() => null);
          if (!quote || quote.regularMarketPrice === undefined) {
             console.log(`Discarding ${name}: Could not fetch quote`);
             return null;
          }
          
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
      results.sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0));
      console.log(`Dashboard generated with ${results.length} valid assets.`);
      
      const highScoresCount = results.filter(r => r.smartScore > 70).length;

      return {
        overview: { ...overview, highScoresCount },
        assets: results
      };
    } catch (error) {
      console.error('Critical error in getDashboardData:', error.message);
      return { overview: null, assets: [] };
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
      const result = await yf.chart(yahooTicker, {
        period1: new Date(from * 1000),
        period2: new Date(to * 1000),
        interval: '1d'
      });
      if (!result || !result.quotes || result.quotes.length === 0) {
        throw new Error('No historical data returned from Yahoo Finance');
      }
      return result.quotes.map(quote => ({
        time: Math.floor(new Date(quote.date).getTime() / 1000),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error.message);
      return [];
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
