const Parser = require('rss-parser');
const parser = new Parser();
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Fetch financial news from Yahoo Finance RSS
 */
async function fetchFinancialNews() {
    try {
        const feed = await parser.parseURL('https://finance.yahoo.com/news/rss');
        return feed.items.slice(0, 8).map(item => ({
            title: item.title,
            snippet: item.contentSnippet || item.content || ""
        }));
    } catch (error) {
        console.error('Error fetching Yahoo Finance RSS:', error.message);
        return [];
    }
}

/**
 * Generate AI Market Briefing using Gemini 1.5 Flash
 */
async function generateMarketBriefing(news) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing');
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const newsContext = news.map((n, i) => `${i+1}. ${n.title}: ${n.snippet}`).join('\n');
        
        const prompt = `Analizza queste notizie finanziarie e riassumile in 4 punti chiave per un trader, evidenziando l'impatto sui mercati (Bullish/Bearish). Usa un tono professionale in italiano.
        
Notizie:
${newsContext}

Ritorna solo i 4 punti come una lista puntata, senza introduzioni.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse bullets
        const bullets = text.split('\n')
            .map(line => line.replace(/^[-*•]\s?/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 4);

        return {
            title: news[0]?.title || "Aggiornamento Mercati",
            bullets: bullets.length > 0 ? bullets : ["Analisi in corso..."],
            timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (error) {
        console.error('Error in AI briefing generation:', error.message);
        return {
            title: "Errore Analisi AI",
            bullets: ["Impossibile generare la sintesi al momento."],
            timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    }
}

module.exports = {
    fetchFinancialNews,
    generateMarketBriefing
};
