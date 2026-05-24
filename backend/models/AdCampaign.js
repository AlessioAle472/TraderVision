const mongoose = require('mongoose');

const adCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  targetUrl: {
    type: String,
    required: true
  },
  sponsorName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('AdCampaign', adCampaignSchema);
