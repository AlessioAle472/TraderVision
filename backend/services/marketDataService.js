const axios = require('axios');
const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical'] });
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const macroCalculator = require('./macroCalculator');

class MarketDataService {
  constructor() {
    this.finnhubKey = process.env.FINNHUB_API_KEY;
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.lastKnownPrices = {}; 
  }

  async getTrendingTickers(count = 10) {
    try {
      // Try to get trending tickers from Yahoo Finance
      console.log('[MarketDataService] Fetching trending tickers from screener...');
      const result = await yf.screener({ scrIds: 'day_gainers' }, { count });
      
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
      const rawResults = await Promise.all(Object.entries(assets).map(async ([name, yahooTicker]) => {
        try {
          // 1. Fetch 7D history for sparkline
          const history = await yf.chart(yahooTicker, {
            period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            interval: '1d'
          }).catch(() => null);

          if (!history || !history.quotes || history.quotes.length < 2) {
            console.log(`Discarding ${name}: Insufficient history (${history?.quotes?.length || 0} quotes)`);
            return null;
          }
          const sparklineData = history.quotes.map(q => q.close).filter(c => c !== null);

          // 2. Call python script for Smart Score
          const scriptPath = path.join(__dirname, '../smart_score.py');
          const { stdout } = await execPromise(`python3 "${scriptPath}" "${yahooTicker}"`, { timeout: 60000 }); // Added timeout
          const parsedData = JSON.parse(stdout);
          
          if (parsedData.error || parsedData.score === undefined || !parsedData.raw_data || parsedData.raw_data.sma_200 === null) {
            console.log(`Discarding ${name}: Calculation failed or SMA200 missing. Error: ${parsedData.error || 'None'}`);
            return null;
          }

          const quote = await yf.quote(yahooTicker).catch(() => null);
          const currentPrice = parsedData.raw_data.price || (quote ? quote.regularMarketPrice : 0);
          const var1D = quote ? quote.regularMarketChangePercent : 0;
          const score = parsedData.score;
          
          console.log(`Keeping ${name}: Score ${score}`);

          let label = 'Hold';
          if (score >= 80) label = 'Strong Buy';
          else if (score >= 60) label = 'Buy';
          else if (score >= 40) label = 'Hold';
          else if (score >= 20) label = 'Sell';
          else label = 'Strong Sell';

          // (Rimossa sovrascrittura: SPY manterrà il suo score tecnico indipendente dal Global Macro Score)
          let finalScore = score;
          let finalLabel = label;

          const momentumVal = sparklineData.length >= 2 
            ? ((sparklineData[sparklineData.length - 1] - sparklineData[0]) / sparklineData[0]) * 100 
            : 0;

          return {
            ticker: name,
            name: name, // Ensure name is present for filtering
            prezzo: currentPrice,
            var1D: var1D,
            momentum: momentumVal,
            is7DUp: momentumVal >= 0,
            settore: parsedData.raw_data.asset_type_detected || 'Unknown',
            rsi: parsedData.raw_data.rsi ? parsedData.raw_data.rsi.toFixed(1) : '-',
            pe: parsedData.raw_data.asset_type_detected === 'EQUITY' ? (parsedData.raw_data.asset_specific_metric?.forward_pe?.toFixed(2) || '-') : '-',
            smartScore: finalScore,
            smartScoreLabel: finalLabel,
            sparkline: sparklineData,
            trend: parsedData.raw_data.trend,
            fib_level_touched: parsedData.raw_data.fib_level_touched,
            volume_vs_avg: parsedData.raw_data.volume_vs_avg,
            breakdown: {
              tech_score: parsedData.raw_data.tech_score || 0,
              seasonality_score: parsedData.raw_data.seasonality_score || 0,
              asset_score: parsedData.raw_data.asset_score || 0,
              macro_reason: parsedData.raw_data.macro_reason || null
            }
          };
        } catch (error) {
          console.error(`Error processing ${name}:`, error.message);
          return null;
        }
      }));

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
