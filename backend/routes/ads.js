const express = require('express');
const router = express.Router();
const AdCampaign = require('../models/AdCampaign');
const { protect } = require('../middleware/authMiddleware');

// GET /api/ads/active - Ottieni ads attive per il feed
router.get('/active', protect, async (req, res) => {
  try {
    const activeAds = await AdCampaign.find({ isActive: true });
    res.json(activeAds);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

module.exports = router;
