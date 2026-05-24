const PreloadedMarketData = require('../models/PreloadedMarketData');

class MarketsService {
  /**
   * Main entry point: fetch all market sections + factors from the zero-lag cache.
   */
  async getMarketsData() {
    console.log('[MarketsService] Fetching full markets data from preloaded zero-lag cache...');
    const start = Date.now();

    const latest = await PreloadedMarketData.findOne({ dataId: 'latest' });
    
    if (!latest || !latest.marketsData) {
      console.warn('[MarketsService] No preloaded data found. Triggering cron calculation...');
      // If we don't have data, we might optionally trigger a background run, but return empty for now
      // Or we can just trigger it and wait, but that defeats zero-lag for the first request
      return {
        sections: {},
        factors: [],
        generatedAt: new Date().toISOString(),
        error: 'Data is being generated for the first time. Please refresh in a few minutes.'
      };
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`[MarketsService] Done in ${elapsed}s (Zero-Lag)`);

    return latest.marketsData;
  }
}

module.exports = new MarketsService();
