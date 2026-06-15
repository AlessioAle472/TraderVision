const mongoose = require('mongoose');

const cotReportSchema = new mongoose.Schema({
  reportDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  markets: [
    {
      cftcCode: { type: String, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
      nonCommercial: {
        total: { type: Number, required: true },
        weeklyDelta: { type: Number, required: true },
        avg3m: { type: Number, required: true },
        avg3mPct: { type: Number, required: true },
        avg6m: { type: Number, required: true },
        avg6mPct: { type: Number, required: true },
        zScore: { type: Number, required: true }
      },
      commercial: {
        total: { type: Number, required: true },
        weeklyDelta: { type: Number, required: true },
        avg3m: { type: Number, required: true },
        avg3mPct: { type: Number, required: true },
        avg6m: { type: Number, required: true },
        avg6mPct: { type: Number, required: true },
        zScore: { type: Number, required: true }
      }
    }
  ]
});

// Create index on reportDate for faster querying
cotReportSchema.index({ reportDate: -1 });

module.exports = mongoose.model('CotReport', cotReportSchema);
