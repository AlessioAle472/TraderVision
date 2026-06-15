const cron = require('node-cron');
const cotService = require('./cotService');

const init = () => {
  // Run every Saturday at 06:00 AM
  cron.schedule('0 6 * * 6', async () => {
    console.log('[CotCronJob] Running weekly CFTC COT data update...');
    try {
      await cotService.fetchAndProcessCotData();
      console.log('[CotCronJob] Weekly CFTC COT data update completed successfully.');
    } catch (error) {
      console.error('[CotCronJob] Error during weekly COT data update:', error);
    }
  });

  // Run once on startup if in development to seed the database immediately
  if (process.env.NODE_ENV === 'development') {
    console.log('[CotCronJob] Development mode detected. Seeding COT data on startup...');
    setTimeout(() => {
      cotService.fetchAndProcessCotData();
    }, 5000); // Wait 5 seconds after boot
  }
};

module.exports = { init };
