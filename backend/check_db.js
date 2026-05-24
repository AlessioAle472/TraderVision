const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const PreloadedMarketData = require('./models/PreloadedMarketData');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const latest = await PreloadedMarketData.findOne({ dataId: 'latest' }).lean();
  console.log(Object.keys(latest));
  if(latest.marketsData) {
      console.log('marketsData keys:', Object.keys(latest.marketsData));
  } else {
      console.log('marketsData is missing!');
  }
  process.exit(0);
}
check();
