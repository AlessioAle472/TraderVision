const mongoose = require('mongoose');
require('dotenv').config();
const PreloadedMarketData = require('./models/PreloadedMarketData');
const macroCalculator = require('./services/macroCalculator');
const economicCalendar = require('./services/economicCalendar');

async function force() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const macro = await macroCalculator.calculateCurrentRegime();
  const events = await economicCalendar.getHighImpactEvents();
  console.log('Macro calculated:', macro !== null);
  
  const macroOutlook = { ...(macro || {}), events: events || [] };
  
  await PreloadedMarketData.findOneAndUpdate(
    { dataId: 'latest' },
    { macroOutlook, lastUpdated: new Date() },
    { upsert: true }
  );
  console.log('Updated PreloadedMarketData');
  process.exit(0);
}
force();
