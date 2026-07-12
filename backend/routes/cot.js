const express = require('express');
const router = express.Router();
const { getCotData, forceUpdateCotData } = require('../controllers/cotController');
const { protect, master } = require('../middleware/authMiddleware');
const { softRequirePro, FREE_LIMIT } = require('../middleware/requirePro');

// GET /api/cot-data
// Free users receive only the first FREE_LIMIT instruments + a paywall flag.
// PRO users receive the full dataset.
router.get('/cot-data', protect, softRequirePro, async (req, res, next) => {
  try {
    // Delegate actual data fetch to the controller via a helper
    // We wrap the response to truncate for free users
    const original_json = res.json.bind(res);
    res.json = (data) => {
      if (!req.isPro && data && data.data && Array.isArray(data.data)) {
        const truncated = data.data.slice(0, FREE_LIMIT);
        return original_json({
          ...data,
          data: truncated,
          paywalled: true,
          totalCount: data.data.length,
          freeLimit: FREE_LIMIT,
          message: `Mostrando ${FREE_LIMIT} di ${data.data.length} strumenti. Passa a PRO per vedere tutti i dati COT.`,
        });
      }
      return original_json(data);
    };
    return getCotData(req, res, next);
  } catch (err) {
    next(err);
  }
});

// GET /api/cot/force-update — master only
router.get('/cot/force-update', protect, master, forceUpdateCotData);

module.exports = router;
