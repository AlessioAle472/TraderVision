const mongoose = require('mongoose');

const preloadedMarketDataSchema = new mongoose.Schema({
  dataId: { type: String, default: 'latest', unique: true },
  
  // Entire markets data payload (sections, factors, generatedAt)
  marketsData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Macro outlook payload (Stagflation, Reflation, etc.)
  macroOutlook: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('PreloadedMarketData', preloadedMarketDataSchema);
