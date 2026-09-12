const mongoose = require('mongoose');

const worldNewsArchiveSchema = new mongoose.Schema({
  dataId: { type: String, default: 'latest_world_news', unique: true },
  
  // List of aggregated news stories
  stories: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },

  totalCount: {
    type: Number,
    default: 0
  },

  providersCount: {
    type: Number,
    default: 0
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WorldNewsArchive', worldNewsArchiveSchema);
