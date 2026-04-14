const Parser = require('rss-parser');
const parser = new Parser();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const economicCalendar = require('./economicCalendar');

/**
 * Fetch latest financial news from Yahoo Finance RSS
 */
async function fetchLatestNews() {
    try {
        const feed = await parser.parseURL('https://finance.yahoo.com/news/rss');
        return feed.items.slice(0, 10).map(item => ({
            title: item.title,
            content: item.contentSnippet || item.content || ""
        }));
    } catch (error) {
        console.error('Error fetching RSS news:', error);
        return [];
    }
}

/**
 * Generate AI Briefing using Gemini 1.5 Flash
 */
async function generateAIBriefing(newsData) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 1. Fetch upcoming macro events for context
    const calendarEvents = await economicCalendar.getHighImpactEvents().catch(() => []);
    const topEvents = calendarEvents.slice(0, 3);
    const calendarContext = topEvents.map(e => `${e.time} (${e.cur}): ${e.event}`).join(', ');

    if (!apiKey) {
        console.warn('GEMINI_API_KEY missing. Returning fallback briefing.');
        return {
            title: newsData[0]?.title || "Mercati in Stasi",
            bullets: [
                "Focus Macro: Occhi puntati sugli eventi del calendario.",
                newsData[1]?.title || "Volatilità contenuta sui mercati globali.",
                "Consigliata prudenza operativa."
            ],
            timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const newsContext = newsData.slice(0, 6).map((n, i) => `${i+1}. ${n.title}`).join('\n');
        
        const prompt = `Sei un analista macro per trader. Analizza queste notizie e riassumile in 4 punti chiave brevi e incisivi, evidenziando l'impatto sui mercati (Bullish/Bearish). Usa un tono professionale in italiano.
        
Notizie:
${newsContext}

Prossimi Eventi Macro: ${calendarContext || "Nessuno rilevante"}

Ritorna solo i 4 punti come una lista puntata (•), senza introduzioni o conclusioni.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const bullets = text.split('\n')
            .map(line => line.replace(/^[•\-\*]\s?/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 4);

        return {
            title: newsData[0]?.title || "Focus di Mercato",
            bullets: bullets.length > 0 ? bullets : ["Analisi in corso..."],
            timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (error) {
        console.error('Error in AI briefing generation:', error.message);
        return {
            title: "Errore Analisi AI",
            bullets: ["Impossibile generare la sintesi live."],
            timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    }
}

module.exports = {
    fetchLatestNews,
    generateAIBriefing
};
