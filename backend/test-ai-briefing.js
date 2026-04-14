const aiBriefingService = require('./services/aiBriefingService');
require('dotenv').config();

async function test() {
    try {
        console.log('--- Testing AI Briefing with Real Gemini API ---');
        const news = await aiBriefingService.fetchLatestNews();
        if (news.length === 0) {
            console.log('No news found, check internet connection.');
            return;
        }
        console.log(`Fetched ${news.length} news items.`);
        const briefing = await aiBriefingService.generateAIBriefing(news);
        console.log('AI Briefing Result:', JSON.stringify(briefing, null, 2));
        console.log('SUCCESS');
    } catch (error) {
        console.error('TEST FAILED:', error.message);
    }
}

test();
