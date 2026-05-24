const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const marketCronJob = require('./services/marketCronJob');

async function force() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB, running calculations...');
  await marketCronJob.runCalculations();
  console.log('Calculations finished');
  process.exit(0);
}
force();
