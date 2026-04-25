const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

// Curated asset groups
const ASSET_GROUPS = {
  usa: {
    label: 'USA',
    tickers: {
      '^GSPC': 'S&P 500',
      '^IXIC': 'Nasdaq',
      '^DJI': 'Dow Jones',
      '^RUT': 'Russell 2000',
      '^VIX': 'VIX'
    }
  },
  europa: {
    label: 'Europa',
    tickers: {
      '^GDAXI': 'Germania',
      '^FCHI': 'Francia',
      '^FTSE': 'UK',
      'FTSEMIB.MI': 'Italia',
      '^IBEX': 'Spagna',
      '^STOXX50E': 'Euro Stoxx 50'
    }
  },
  asia: {
    label: 'Asia',
    tickers: {
      '^N225': 'Giappone',
      '^HSI': 'Hong Kong',
      '000001.SS': 'Cina',
      '^STI': 'Singapore',
      '^BSESN': 'India'
    }
  },
  developed: {
    label: 'Developed',
    tickers: {
      '^GSPTSE': 'Canada',
      '^AS51': 'Australia',
      '^SSMI': 'Svizzera',
      '^OMX': 'Svezia',
      '^OSLO': 'Norvegia',
      '^TA125.TA': 'Israele'
    }
  },
  emergenti: {
    label: 'Emergenti',
    tickers: {
      'EEM': 'MSCI EM',
      '^BVSP': 'Brasile',
      '^MXX': 'Messico',
      '^KS11': 'Corea',
      'RSX': 'Russia'
    }
  },
  forex: {
    label: 'Forex',
    tickers: {
      'USDCHF=X': 'USD/CHF',
      'USDCAD=X': 'USD/CAD',
      'USDJPY=X': 'USD/JPY',
      'AUDJPY=X': 'AUD/JPY',
      'CHFJPY=X': 'CHF/JPY',
      'AUDUSD=X': 'AUD/USD',
      'GBPUSD=X': 'GBP/USD',
      'EURJPY=X': 'EUR/JPY',
      'EURGBP=X': 'EUR/GBP',
      'EURUSD=X': 'EUR/USD',
      'NZDUSD=X': 'NZD/USD',
      'EURAUD=X': 'EUR/AUD'
    }
  },
  crypto: {
    label: 'Crypto',
    tickers: {
      'BTC-USD': 'Bitcoin',
      'ETH-USD': 'Ethereum',
      'SOL-USD': 'Solana',
      'BNB-USD': 'BNB',
      'XRP-USD': 'XRP',
      'TRX-USD': 'Tron',
      'ADA-USD': 'Cardano',
      'LINK-USD': 'Chainlink',
      'MATIC-USD': 'Polygon',
      'AVAX-USD': 'Avalanche',
      'DOGE-USD': 'Dogecoin',
      'DOT-USD': 'Polkadot',
      'TON-USD': 'Toncoin',
      'HBAR-USD': 'Hedera',
      'XLM-USD': 'Stellar',
      'NEAR-USD': 'NEAR',
      'UNI-USD': 'Uniswap',
      'LTC-USD': 'Litecoin',
      'XMR-USD': 'Monero',
      'ETC-USD': 'Ethereum Classic',
      'VET-USD': 'VeChain',
      'USDT-USD': 'Tether',
      'USDC-USD': 'USDC'
    }
  },
  commodities: {
    label: 'Commodities',
    tickers: {
      'BZ=F': 'Brent Oil',
      'CL=F': 'Crude Oil',
      'NG=F': 'Nat Gas',
      'GC=F': 'Gold',
      'SI=F': 'Silver',
      'HG=F': 'Copper',
      'URA': 'Uranium ETF',
      'DBA': 'Agriculture',
      'DBC': 'Commodities',
      'GSG': 'GSG Index'
    }
  }
};

// Factor ETF proxies
const FACTOR_TICKERS = {
  'SPHB': 'High Beta',
  'VLUE': 'Value',
  'VUG': 'Growth',
  'MTUM': 'Momentum',
  'DEF': 'Defensive'
};

class MarketsService {

  /**
   * Fetch a single asset's quote, sparkline, and smart score.
   */
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
          // 1W
          const weekIdx = Math.max(0, quotes.length - 6);
          const weekClose = quotes[weekIdx]?.close;
          if (weekClose && lastClose) var1W = ((lastClose - weekClose) / weekClose) * 100;
          // 1M
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
      } catch (e) { /* empty sparkline */ }

      // 4. Smart Score via python
      let smartScore = 50;
      let smartScoreLabel = 'Hold';
      let momentum = 0;
      try {
        const scriptPath = path.join(__dirname, '../smart_score.py');
        const { stdout } = await execPromise(`python3 "${scriptPath}" "${yahooTicker}"`, { timeout: 45000, windowsHide: true });
        const parsed = JSON.parse(stdout);
        if (!parsed.error && parsed.score !== undefined) {
          smartScore = parsed.score;
          if (smartScore >= 80) smartScoreLabel = 'Strong Buy';
          else if (smartScore >= 60) smartScoreLabel = 'Buy';
          else if (smartScore > 40) smartScoreLabel = 'Hold';
          else if (smartScore > 20) smartScoreLabel = 'Sell';
          else smartScoreLabel = 'Strong Sell';
        }
        // Momentum from raw data if available
        if (parsed.raw_data) {
          const rsi = parsed.raw_data.rsi || 50;
          momentum = ((rsi - 50) / 50) * 100; // Normalize RSI to -100..+100 range
        }
      } catch (e) {
        console.error(`[MarketsService] Smart score failed for ${yahooTicker}: ${e.message}`);
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
      console.error(`[MarketsService] Error fetching ${yahooTicker}:`, error.message);
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

  /**
   * Fetch all assets for a specific group.
   */
  async _fetchGroup(groupKey) {
    const group = ASSET_GROUPS[groupKey];
    if (!group) return { label: groupKey, assets: [] };

    const entries = Object.entries(group.tickers);
    
    // Process assets in chunks of 5 to avoid spawning too many Python processes
    const results = await this._processInChunks(entries, 5, ([ticker, name]) => this._fetchAsset(ticker, name));

    return {
      label: group.label,
      assets: results.filter(r => r !== null).sort((a, b) => b.smartScore - a.smartScore)
    };
  }

  /**
   * Compute Factor Relative Strength bars.
   * Returns an array of { name, value (0-100), label }.
   */
  async _fetchFactors() {
    try {
      const tickers = Object.keys(FACTOR_TICKERS);
      const quotes = await yf.quote(tickers).catch(() => []);

      return Object.entries(FACTOR_TICKERS).map(([ticker, label]) => {
        const q = (Array.isArray(quotes) ? quotes : [quotes]).find(x => x?.symbol === ticker);
        const change = q?.regularMarketChangePercent || 0;
        // Map from typical daily range (-3% to +3%) into 0-100 bar
        const normalized = Math.min(100, Math.max(0, 50 + (change / 3) * 50));
        return {
          name: label,
          ticker,
          change: parseFloat(change.toFixed(2)),
          value: Math.round(normalized)
        };
      });
    } catch (error) {
      console.error('[MarketsService] Error fetching factors:', error.message);
      return Object.values(FACTOR_TICKERS).map(label => ({
        name: label,
        ticker: '',
        change: 0,
        value: 50
      }));
    }
  }

  /**
   * Main entry point: fetch all market sections + factors.
   */
  async getMarketsData() {
    console.log('[MarketsService] Fetching full markets data...');
    const start = Date.now();

    const groupKeys = Object.keys(ASSET_GROUPS);
    // Process groups sequentially to avoid massive CPU spikes on the server
    const results = [];
    for (const key of groupKeys) {
      results.push(await this._fetchGroup(key));
    }
    const factors = await this._fetchFactors();

    // Reconstruct sections object
    const sections = {};
    groupKeys.forEach((key, index) => {
        sections[key] = results[index];
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[MarketsService] Done in ${elapsed}s`);

    return {
      sections,
      factors,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new MarketsService();
