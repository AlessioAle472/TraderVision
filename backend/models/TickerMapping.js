const mongoose = require('mongoose');

const tickerMappingSchema = new mongoose.Schema({
  yfSymbol: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  tvSymbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TickerMapping', tickerMappingSchema);
