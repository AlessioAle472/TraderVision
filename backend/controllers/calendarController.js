const { fetchFinnhubCalendar } = require('../services/economicCalendar');

const getEconomicCalendar = async (req, res, next) => {
  try {
    const { timeframe = 'today' } = req.query;
    const events = await fetchFinnhubCalendar(timeframe);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEconomicCalendar
};
