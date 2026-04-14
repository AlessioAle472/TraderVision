const cron = require('node-cron');
const aiBriefingService = require('./aiBriefingService');
const newsletterService = require('./newsletterService');

/**
 * AI Market Briefing Scheduler
 * Configures tasks to run at 06:00, 12:00, and 20:00 daily.
 */
const runBriefingCycle = async (time) => {
    console.log(`[${new Date().toISOString()}] AI Briefing Cycle (${time}) started...`);
    try {
        // 1. Fetch latest news
        const news = await aiBriefingService.fetchLatestNews();
        
        // 2. Generate AI Briefing
        const briefing = await aiBriefingService.generateAIBriefing(news);
        
        // 3. Send Emails to subscribers
        await newsletterService.sendBriefingEmail(briefing);
        
        console.log(`[${new Date().toISOString()}] AI Briefing Cycle (${time}) completed successfully.`);
        return { success: true, briefing };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] AI Briefing Cycle (${time}) failed:`, error);
        throw error;
    }
};

function initAIJobs() {
    console.log('--- Initializing AI Briefing Scheduler ---');

    // Job at 06:00
    cron.schedule('0 6 * * *', () => runBriefingCycle('06:00'));

    // Job at 12:00
    cron.schedule('0 12 * * *', () => runBriefingCycle('12:00'));

    // Job at 20:00
    cron.schedule('0 20 * * *', () => runBriefingCycle('20:00'));

    console.log('AI Briefing Jobs scheduled (06:00, 12:00, 20:00)');
}

module.exports = { initAIJobs, runBriefingCycle };
