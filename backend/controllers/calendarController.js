const { fetchFinnhubCalendar } = require('../services/economicCalendar');
const { FREE_LIMIT } = require('../middleware/requirePro');

const getEconomicCalendar = async (req, res, next) => {
  try {
    const { timeframe = 'today' } = req.query;
    let events = await fetchFinnhubCalendar(timeframe);
    
    let paywalled = false;
    // req.isPro is set by softRequirePro
    if (req.isPro === false && events.length > 3) {
      events = events.slice(0, 3);
      paywalled = true;
    }

    res.json({ events, paywalled });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEconomicCalendar
};
