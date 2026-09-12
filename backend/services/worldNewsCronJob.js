const cron = require('node-cron');
const worldNewsService = require('./worldNewsService');

class WorldNewsCronJob {
  constructor() {
    this.isJobRunning = false;
    this.lastHourlyRun = null;
  }

  async runHourlyUpdate() {
    if (this.isJobRunning) {
      console.log('[WorldNewsCronJob] Aggiornamento già in corso, salto questo ciclo.');
      return;
    }

    this.isJobRunning = true;
    console.log('[WorldNewsCronJob] ⏰ Avvio ciclo orario di scraping e aggregazione notizie multi-provider...');

    try {
      const refreshedStories = await worldNewsService.refreshAllProviders();
      this.lastHourlyRun = new Date().toISOString();
      console.log(`[WorldNewsCronJob] ✅ Aggiornamento orario completato con successo: ${refreshedStories.length} dispacci archiviati.`);
    } catch (err) {
      console.error('[WorldNewsCronJob] ❌ Errore durante l\'aggiornamento orario delle notizie:', err.message);
    } finally {
      this.isJobRunning = false;
    }
  }

  init() {
    // Esegui allo scoccare di ogni ora: '0 * * * *'
    cron.schedule('0 * * * *', async () => {
      console.log('[WorldNewsCronJob] Trigger cron scattato allo scoccare dell\'ora.');
      await this.runHourlyUpdate();
    });
    console.log('[WorldNewsCronJob] ✅ Cron job notizie orarie schedulato (ogni ora a :00).');

    // Avvio iniziale asincrono all'avvio del server
    setTimeout(() => {
      this.runHourlyUpdate().catch(e => {
        console.warn('[WorldNewsCronJob] Aggiornamento iniziale terminato con avviso:', e.message);
      });
    }, 4000);
  }
}

module.exports = new WorldNewsCronJob();
