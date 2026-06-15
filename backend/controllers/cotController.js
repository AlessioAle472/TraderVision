const CotReport = require('../models/CotReport');
const cotService = require('../services/cotService');

const getCotData = async (req, res, next) => {
  try {
    const latestReport = await CotReport.findOne().sort({ reportDate: -1 });

    if (!latestReport) {
      return res.status(404).json({ message: 'No COT data available yet.' });
    }

    const responseData = {
      asOfDate: latestReport.reportDate,
      data: latestReport.markets.map(market => ({
        id: market._id || market.cftcCode,
        category: market.category,
        name: market.name,
        code: market.cftcCode,
        nonCommercial: market.nonCommercial,
        commercial: market.commercial
      }))
    };

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

const forceUpdateCotData = async (req, res, next) => {
  try {
    await cotService.fetchAndProcessCotData();
    res.json({ message: 'COT data forced update completed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCotData,
  forceUpdateCotData
};
