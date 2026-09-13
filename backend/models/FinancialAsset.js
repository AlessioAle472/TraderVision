const mongoose = require('mongoose');

const financialAssetSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['FOREX', 'INDICES', 'COMMODITIES', 'EQUITY', 'ETF'],
    uppercase: true,
    index: true
  },
  tvSymbol: {
    type: String,
    required: true,
    trim: true
  },
  yahooTicker: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  }
}, {
  timestamps: true
});

// Compound index for fast case-insensitive search
financialAssetSchema.index({ ticker: 1, name: 1 });

module.exports = mongoose.model('FinancialAsset', financialAssetSchema);
