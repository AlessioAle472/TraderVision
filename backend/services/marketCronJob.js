const cron = require('node-cron');
const MarketConfig = require('../models/MarketConfig');
const PreloadedMarketData = require('../models/PreloadedMarketData');
const macroCalculator = require('./macroCalculator');
const economicCalendar = require('./economicCalendar');
const smartQuantEngine = require('./smartQuantEngine');
const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const path = require('path');

// Factor ETF proxies
const FACTOR_TICKERS = {
  'SPHB': 'High Beta',
  'VLUE': 'Value',
  'VUG': 'Growth',
  'MTUM': 'Momentum',
  'DEF': 'Defensive'
};

const mongoose = require('mongoose');
const marketsService = require('./marketsService');
const marketDataService = require('./marketDataService');

const DEFAULT_ASSET_GROUPS = {
  usa: { label: 'USA', tickers: { '^GSPC': 'S&P 500', '^IXIC': 'Nasdaq', '^DJI': 'Dow Jones', '^RUT': 'Russell 2000', '^VIX': 'VIX' } },
  europa: { label: 'Europa', tickers: { '^GDAXI': 'Germania', '^FCHI': 'Francia', '^FTSE': 'UK', 'FTSEMIB.MI': 'Italia', '^IBEX': 'Spagna', '^STOXX50E': 'Euro Stoxx 50' } },
  asia: { label: 'Asia', tickers: { '^N225': 'Giappone', '^HSI': 'Hong Kong', '000001.SS': 'Cina', '^STI': 'Singapore', '^BSESN': 'India' } },
  developed: { label: 'Developed', tickers: { '^GSPTSE': 'Canada', '^AS51': 'Australia', '^SSMI': 'Svizzera', '^OMX': 'Svezia', '^OSLO': 'Norvegia', '^TA125.TA': 'Israele' } },
  emergenti: { label: 'Emergenti', tickers: { 'EEM': 'MSCI EM', '^BVSP': 'Brasile', '^MXX': 'Messico', '^KS11': 'Corea', 'RSX': 'Russia' } },
  forex: { label: 'Forex', tickers: { 'USDCHF=X': 'USD/CHF', 'USDCAD=X': 'USD/CAD', 'USDJPY=X': 'USD/JPY', 'AUDJPY=X': 'AUD/JPY', 'CHFJPY=X': 'CHF/JPY', 'AUDUSD=X': 'AUD/USD', 'GBPUSD=X': 'GBP/USD', 'EURJPY=X': 'EUR/JPY', 'EURGBP=X': 'EUR/GBP', 'EURUSD=X': 'EUR/USD', 'NZDUSD=X': 'NZD/USD', 'EURAUD=X': 'EUR/AUD' } },
  crypto: { label: 'Crypto', tickers: { 'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum', 'SOL-USD': 'Solana', 'BNB-USD': 'BNB', 'XRP-USD': 'XRP', 'TRX-USD': 'Tron', 'ADA-USD': 'Cardano', 'LINK-USD': 'Chainlink', 'MATIC-USD': 'Polygon', 'AVAX-USD': 'Avalanche', 'DOGE-USD': 'Dogecoin', 'DOT-USD': 'Polkadot', 'TON-USD': 'Toncoin', 'HBAR-USD': 'Hedera', 'XLM-USD': 'Stellar', 'NEAR-USD': 'NEAR', 'UNI-USD': 'Uniswap', 'LTC-USD': 'Litecoin' } },
  commodities: { label: 'Commodities', tickers: { 'BZ=F': 'Brent Oil', 'CL=F': 'Crude Oil', 'NG=F': 'Nat Gas', 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'URA': 'Uranium ETF', 'DBA': 'Agriculture', 'DBC': 'Commodities', 'GSG': 'GSG Index' } }
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

      // 3. Sparkline (7-day) & Technical Quotes
      let sparkline = [];
      let validQuotes = [];
      try {
        const hist7 = await yf.chart(yahooTicker, {
          period1: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          interval: '1d'
        });
        validQuotes = (hist7?.quotes || []).filter(q => q.close !== null && q.close !== undefined);
        sparkline = validQuotes.slice(-7).map(q => q.close);
      } catch (e) {}

      // 4. Smart Score via Multi-Factor SmartQuant Engine
      let smartScore = 50;
      let smartScoreLabel = 'Hold';
      let momentum = (var1W * 0.4) + (var1M * 0.6);
      let tradeSetup = null;
      let breakdown = null;
      let pillars = null;
      
      try {
        const quantResult = smartQuantEngine.calculateSmartScore({
          ticker: displayName || yahooTicker,
          quote,
          quotes: validQuotes,
          sector: quote.quoteType || 'EQUITY'
        });

        smartScore = quantResult.smartScore;
        smartScoreLabel = quantResult.smartScoreLabel;
        tradeSetup = quantResult.tradeSetup;
        breakdown = quantResult.breakdown;
        pillars = quantResult.pillars;
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
        sparkline,
        tradeSetup,
        pillars,
        breakdown
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
    console.log('[MarketCronJob] Running massive market data calculations (Daily Preloaded Refresh)...');
    
    // 1. Get config
    let assetGroups = DEFAULT_ASSET_GROUPS;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        let config = await MarketConfig.findOne({ configId: 'default' });
        if (config && config.assetGroups) {
          assetGroups = config.assetGroups;
        }
      } catch (e) {
        console.warn('[MarketCronJob] Could not read MarketConfig from DB, using defaults.');
      }
    }

    const groupKeys = Object.keys(assetGroups);
    
    // Process groups in parallel
    const resultsPromises = groupKeys.map(async (key) => {
      const group = assetGroups[key];
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
    let totalAssetsFetched = 0;
    groupResults.forEach((res) => {
      sections[res.key] = res.data;
      totalAssetsFetched += (res.data.assets?.length || 0);
    });

    // Only overwrite preloaded data if we fetched a meaningful number of assets
    if (totalAssetsFetched > 5) {
      const marketsData = {
        sections,
        factors,
        generatedAt: new Date().toISOString()
      };

      await marketsService.saveMarketsData(marketsData, macroOutlook);
      console.log(`[MarketCronJob] ✅ Saved ${totalAssetsFetched} freshly calculated assets to preloaded cache.`);
    } else {
      console.warn(`[MarketCronJob] ⚠️ Calculations yielded only ${totalAssetsFetched} assets (network or provider throttling). Preserving existing preloaded cache.`);
    }
  }

  async init() {
    // Run daily at 06:00 AM UTC
    cron.schedule('0 6 * * *', async () => {
      console.log('[MarketCronJob] ⏰ Triggered by daily schedule at 06:00 AM.');
      try {
        await this.runCalculations();
      } catch (err) {
        console.error('[MarketCronJob] Daily run error:', err.message);
      }
    });
    console.log('[MarketCronJob] Scheduled daily update at 06:00 AM.');

    // Check if preloaded cache exists; if not, generate it immediately
    const existing = await marketsService.getMarketsData();
    if (!existing || !existing.sections || Object.keys(existing.sections).length === 0) {
      console.log('[MarketCronJob] No existing market data found in cache, generating initial preloaded dataset...');
      try {
        const { generateAll } = require('../seeds/seedPreloadedData');
        generateAll();
      } catch (e) {
        console.error('[MarketCronJob] Initial seed generation error:', e.message);
      }
    }
  }
}

module.exports = new MarketCronJob();
