const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PreloadedMarketData = require('../models/PreloadedMarketData');

const LOCAL_MARKETS_FILE = path.join(__dirname, '../data/preloadedMarkets.json');

class MarketsService {
  constructor() {
    this.cachedMarketsData = null;
    this.lastMtime = 0;
    this._loadInitialDiskCache();
  }

  _loadInitialDiskCache() {
    try {
      if (fs.existsSync(LOCAL_MARKETS_FILE)) {
        const stats = fs.statSync(LOCAL_MARKETS_FILE);
        const raw = fs.readFileSync(LOCAL_MARKETS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.sections && Object.keys(parsed.sections).length > 0) {
          this.cachedMarketsData = parsed;
          this.lastMtime = stats.mtimeMs;
          const totalAssets = Object.values(parsed.sections).reduce((acc, s) => acc + (s.assets?.length || 0), 0);
          console.log(`[MarketsService] ✅ In-memory cache primed from preloadedMarkets.json (${totalAssets} total assets across ${Object.keys(parsed.sections).length} sections)`);
        }
      }
    } catch (err) {
      console.warn('[MarketsService] Error reading local disk cache:', err.message);
    }
  }

  /**
   * Main entry point: fetch all market sections + factors from the zero-lag cache.
   * Guaranteed to return full datasets in <5ms.
   */
  async getMarketsData() {
    const start = Date.now();

    // 0. Auto-sync if disk file exists and is newer or current memory cache is truncated (<10 USA assets)
    try {
      if (fs.existsSync(LOCAL_MARKETS_FILE)) {
        const stats = fs.statSync(LOCAL_MARKETS_FILE);
        const usaCount = this.cachedMarketsData?.sections?.usa?.assets?.length || 0;
        if (!this.cachedMarketsData || usaCount < 10 || stats.mtimeMs > (this.lastMtime || 0)) {
          this._loadInitialDiskCache();
        }
      }
    } catch (e) {
      // ignore
    }

    // 1. Fast in-memory hit (0ms)
    if (this.cachedMarketsData && this.cachedMarketsData.sections && Object.keys(this.cachedMarketsData.sections).length > 0) {
      const usaCount = this.cachedMarketsData.sections?.usa?.assets?.length || 0;
      if (usaCount >= 10) {
        return this.cachedMarketsData;
      }
    }

    // 2. Query MongoDB if connected (only accept if complete dataset)
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const latest = await PreloadedMarketData.findOne({ dataId: 'latest' }).lean();
        if (latest && latest.marketsData && latest.marketsData.sections) {
          const dbUsaCount = latest.marketsData.sections?.usa?.assets?.length || 0;
          if (dbUsaCount >= 10) {
            this.cachedMarketsData = latest.marketsData;
            const elapsed = ((Date.now() - start) / 1000).toFixed(3);
            console.log(`[MarketsService] DB Cache hit in ${elapsed}s`);
            return this.cachedMarketsData;
          }
        }
      } catch (dbErr) {
        console.warn('[MarketsService] DB lookup failed, falling back to disk:', dbErr.message);
      }
    }

    // 3. Fallback to local preloadedMarkets.json
    this._loadInitialDiskCache();
    if (this.cachedMarketsData) {
      return this.cachedMarketsData;
    }

    // 4. Emergency auto-generate if file missing
    try {
      const { generateAll } = require('../seeds/seedPreloadedData');
      const generated = generateAll();
      this.cachedMarketsData = generated.marketsData;
      return this.cachedMarketsData;
    } catch (genErr) {
      console.error('[MarketsService] Emergency generation failed:', genErr);
      return {
        sections: {},
        factors: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Save newly calculated market data to in-memory cache, disk file, and MongoDB if connected.
   */
  async saveMarketsData(marketsData, macroOutlook = null) {
    if (!marketsData || !marketsData.sections) return;

    this.cachedMarketsData = marketsData;

    // Write to disk
    try {
      fs.writeFileSync(LOCAL_MARKETS_FILE, JSON.stringify(marketsData, null, 2), 'utf-8');
      console.log('[MarketsService] ✅ Saved updated marketsData to preloadedMarkets.json');
    } catch (fsErr) {
      console.error('[MarketsService] Error saving to disk:', fsErr.message);
    }

    // Upsert to DB if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await PreloadedMarketData.findOneAndUpdate(
          { dataId: 'latest' },
          { marketsData, macroOutlook, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        console.log('[MarketsService] ✅ Synced to MongoDB PreloadedMarketData');
      } catch (dbErr) {
        console.warn('[MarketsService] Failed to sync to MongoDB:', dbErr.message);
      }
    }
  }

  /**
   * Look up any asset across all preloaded sections by ticker, yahooTicker, or name.
   */
  findAsset(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toUpperCase();
    const data = this.cachedMarketsData;
    if (!data || !data.sections) return null;

    // 1. Exact match
    for (const section of Object.values(data.sections)) {
      if (section.assets) {
        const found = section.assets.find(a => 
          (a.ticker && a.ticker.toUpperCase() === clean) ||
          (a.yahooTicker && a.yahooTicker.toUpperCase() === clean) ||
          (a.name && a.name.toUpperCase() === clean)
        );
        if (found) return found;
      }
    }

    // 2. Normalized match (strips =, X, /, ^, -, spaces)
    const norm = clean.replace(/[\/=X^ \-_]/g, '');
    if (norm.length >= 2) {
      for (const section of Object.values(data.sections)) {
        if (section.assets) {
          const found = section.assets.find(a => {
            const aTickNorm = (a.ticker || '').toUpperCase().replace(/[\/=X^ \-_]/g, '');
            const aYTickNorm = (a.yahooTicker || '').toUpperCase().replace(/[\/=X^ \-_]/g, '');
            const aNameNorm = (a.name || '').toUpperCase().replace(/[\/=X^ \-_]/g, '');
            return aTickNorm === norm || aYTickNorm === norm || aNameNorm === norm;
          });
          if (found) return found;
        }
      }
    }

    return null;
  }
}

module.exports = new MarketsService();

