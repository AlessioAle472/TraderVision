require('dotenv').config();
const { fetchFinnhubCalendar } = require('./services/economicCalendar');
fetchFinnhubCalendar('this_week').then(console.log).catch(console.error);
