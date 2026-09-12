const mongoose = require('mongoose');

const PortfolioPositionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    assetType: {
      type: String,
      enum: ['stock', 'crypto', 'commodity', 'forex', 'etf', 'etc', 'index', 'other'],
      default: 'stock',
    },
    buyDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.00000001,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    targetPrice: {
      type: Number,
      default: null,
    },
    stopLoss: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PortfolioPositionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PortfolioPosition', PortfolioPositionSchema);
