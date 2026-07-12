require('dotenv').config();
const { fetchFinnhubCalendar } = require('./services/economicCalendar');
fetchFinnhubCalendar('today').then(console.log).catch(console.error);
