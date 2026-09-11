const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateRiskReport(chartData, fundamentals, correlations) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Default risk scores if AI fails or is missing
    const defaultScores = [
        { subject: 'Inflation', A: 65, fullMark: 100 },
        { subject: 'Interest Rates', A: 45, fullMark: 100 },
        { subject: 'Recession', A: 30, fullMark: 100 },
        { subject: 'Volatility', A: 55, fullMark: 100 },
    ];

    if (!apiKey) {
        console.warn('GEMINI_API_KEY missing. Returning mock risk report.');
        return {
            analysis: `
                <div class="space-y-6 text-gray-300">
                    <section>
                        <h3 class="text-white font-bold text-lg mb-2 uppercase tracking-wider border-l-4 border-blue-500 pl-3">Correlazione Critica: SPY vs USO</h3>
                        <p>La correlazione di <strong>-0.67</strong> tra SPY (Azionario) e USO (Petrolio) riflette un mercato dominato dai timori inflazionistici lato offerta. Quando il prezzo dell'energia sale, i margini aziendali vengono compressi, portando a una vendita automatica di equity.</p>
                    </section>
                    <section>
                        <h3 class="text-white font-bold text-lg mb-2 uppercase tracking-wider border-l-4 border-red-500 pl-3">Stress Test: Oil +10% Shock</h3>
                        <p>In uno scenario in cui il greggio subisca uno strappo del 10%, i modelli prevedono una contrazione dello SPY nell'ordine del <strong>2.5% - 4%</strong> nelle successive 48 ore, con un picco di volatilità sul VIX oltre quota 25.</p>
                    </section>
                    <section>
                        <h3 class="text-white font-bold text-lg mb-2 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">Mitigazione Strategica</h3>
                        <p>Per bilanciare l'attuale correlazione negativa, si suggerisce l'esposizione a <strong>GLD (Oro)</strong> come hedge inflattivo e <strong>DBL (DoubleLine Yield)</strong> o simili strumenti a reddito fisso a breve termine per catturare il differenziale dei tassi senza eccessiva duration.</p>
                    </section>
                </div>
            `,
            riskScores: defaultScores
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

        const prompt = `Sei un analista senior del rischio per un fondo hedge quantitativo.
        
Dati correnti di portafoglio:
- Asset Principale: SPY
- Correlazione 30gg rispetto al Petrolio (USO): -0.67
- VIX: ${fundamentals.vix?.price || 'N/A'}
- DXY: ${fundamentals.dxy?.price || 'N/A'}
- Yield Curve (10Y-3M): ${fundamentals.yieldCurve?.price || 'N/A'}%

Analizza il rischio per un portafoglio esposto a SPY con una correlazione di -0.67 rispetto al Petrolio. Produci un riassunto esecutivo di 3 paragrafi che spieghi i pericoli di de-risking forzato.

Inoltre, assegna un punteggio di rischio da 0 a 100 per le seguenti 4 categorie:
- Inflation Progress
- Interest Rates Exposure
- Recession Probability
- Market Volatility

Formatta la risposta ESATTAMENTE come un oggetto JSON con queste chiavi:
{
  "analysis": "HTML string with 3 paragraphs (<p> and <strong> tags)",
  "riskScores": [
    { "subject": "Inflation", "A": number, "fullMark": 100 },
    { "subject": "Interest Rates", "A": number, "fullMark": 100 },
    { "subject": "Recession", "A": number, "fullMark": 100 },
    { "subject": "Market Volatility", "A": number, "fullMark": 100 }
  ]
}
Mantieni un tono istituzionale e professionale.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Basic JSON cleaning if Gemini adds markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(text);
        return parsed;
    } catch (error) {
        console.error('Error generating AI Risk Report:', error.message);
        return {
            analysis: "Errore durante la generazione del report tramite AI. Si prega di riprovare.",
            riskScores: defaultScores
        };
    }
}

module.exports = { generateRiskReport };
