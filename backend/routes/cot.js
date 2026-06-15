const express = require('express');
const router = express.Router();
const { getCotData, forceUpdateCotData } = require('../controllers/cotController');

// GET /api/cot-data
// Retrieves the latest COT report
router.get('/cot-data', getCotData);

// GET /api/cot/force-update
// Manually triggers the fetching and processing of COT data
router.get('/cot/force-update', forceUpdateCotData);

module.exports = router;
