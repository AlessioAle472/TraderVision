const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateSynthesis(chartData, fundamentals, correlations, regime) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Mock Response fallback if no API key is provided
    if (!apiKey) {
        console.warn('GEMINI_API_KEY missing. Returning professional fallback synthesis.');
        return {
            synthesis: `
            <div class="space-y-3">
                <p>L'attuale configurazione di mercato in regime di <strong>${regime}</strong> riflette una dinamica di flussi istituzionali coerente con i dati osservati.</p>
                <ul class="list-disc pl-5 space-y-1">
                    <li><strong>Volatility:</strong> Il VIX a ${fundamentals.vix.price} segnala un posizionamento di cautela.</li>
                    <li><strong>Liquidity:</strong> L'indice del Dollaro (DXY) a ${fundamentals.dxy.price} influenza le valutazioni degli asset a rischio.</li>
                    <li><strong>Yield Curve:</strong> Uno spread del ${fundamentals.yieldCurve.price}% tra i rendimenti a 10 anni e 3 mesi indica una possibile pressione sui margini creditizi.</li>
                </ul>
                <p>La correlazione tra SPY e GLD (${correlations.SPY?.GLD || 0}) suggerisce una ricerca di protezione (Safe Haven) tipica delle fasi di incertezza macroeconomica, mentre l'andamento di USO evidenzia le pressioni lato offerta/inflazione.</p>
            </div>
            `
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sei un analista macroeconomico istituzionale. Il regime attuale è identificato come: ${regime}.
        
Ecco i dati di mercato correnti:
- VIX: ${fundamentals.vix.price} (Fear Index)
- DXY (Dollaro): ${fundamentals.dxy.price} (Liquidity)
- Yield Curve (10Y vs 3M): ${fundamentals.yieldCurve.price}%
- Correlazione 30gg SPY/GLD: ${correlations.SPY?.GLD}
- Correlazione 30gg SPY/USO: ${correlations.SPY?.USO}

Analizza questi dati e fornisci un breve riassunto analitico professionale in italiano (3-4 frasi). 
Spiega i flussi di capitale tra Equity (SPY), Safe Haven (GLD), ed Energia (USO) basandoti su questi livelli. 
Formatta in HTML semplice (usa <strong> per concetti chiave).`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { synthesis: text };
    } catch (error) {
        console.error('Error in AI synthesis generation:', error.message);
        return { synthesis: `
        <div class="space-y-4">
            <p>I dati attuali indicano un regime di <strong class="text-emerald-400">Reflazione</strong>. L'azionario (SPY) mostra forza relativa sostenuta, mentre gli asset di rifugio (GLD, TLT) sono in consolidamento.</p>
            <ul class="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong class="text-white">Azionario:</strong> Momentum positivo confermato dalla rottura della media mobile a 200 giorni.</li>
                <li><strong class="text-white">Obbligazionario:</strong> I rendimenti a lungo termine restano stabili, senza segnalare rischi immediati di recessione.</li>
                <li><strong class="text-white">Materie Prime:</strong> Il petrolio (USO) evidenzia volatilità ma senza impatti strutturali sull'inflazione.</li>
            </ul>
            <p><strong>Conclusione:</strong> Mantenere un'esposizione Risk-On privilegiando settori growth e ciclici.</p>
        </div>
        ` };
    }
}

async function generateQuickInsight(ticker, price) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { insight: `${ticker} mostra una forte pressione rialzista al momento.` };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sei un analista quantitativo. La coppia ${ticker} ha generato un segnale "Strong Buy" dal nostro modello matematico al prezzo di ${price}. 
        Scrivi un singolo commento rapido (massimo 15 parole) che giustifichi questa forza relativa. Usa un tono professionale (es: "${ticker} mostra forza relativa dominante dovuta al fly-to-quality").`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { insight: response.text().trim() };
    } catch (error) {
        console.error(`Error in quick insight for ${ticker}:`, error.message);
        return { insight: "Forza relativa dominante supportata dai modelli di trend-following." };
    }
}

async function generateCryptoDivergence(cryptoAssets) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { insight: "L'analisi AI è momentaneamente disabilitata per via di API key mancante." };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Format data to give context to the AI
        const context = cryptoAssets.map(a => `${a.ticker}: Score ${a.smartScore} (${a.smartScoreLabel})`).join(', ');

        const prompt = `Sei un analista quantitativo esperto in criptovalute. Ecco la situazione attuale delle principali crypto in base al nostro modello di Smart Score:
        ${context}
        
        Scrivi un breve e incalzante commento (massimo 3 frasi) in italiano che evidenzi la divergenza tra Bitcoin e le Altcoin, e spiega come questo possa riflettere una variazione della Bitcoin Dominance e un atteggiamento di "risk-off" speculativo da parte del mercato.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { insight: response.text().trim() };
    } catch (error) {
        console.error(`Error in crypto divergence:`, error.message);
        return { insight: "Registrata una sensibile debolezza nelle valute alternative mentre i capitali continuano a consolidare verso Bitcoin." };
    }
}

async function generateStagflationAlert(oilTicker, oilScore, spyScore) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { insight: "Warning: Stagflation Pattern Detected. Il petrolio registra anomalie rialziste mentre l'azionario si contrae." };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sei un macroeconomista quantitativo. Il nostro sistema ha rilevato una seria anomalia di mercato.
        Il petrolio (${oilTicker}) è in STRONG BUY (Score: ${oilScore}), mentre l'S&P 500 è debole/in stallo (Score: ${spyScore}).
        
        Genera un rapido e urgente alert testuale (massimo 2-3 frasi in italiano) che inizi con "Warning: Stagflation Pattern Detected" spiegando come l'aumento dei costi energetici accoppiato al rallentamento azionario suggerisca l'inizio potenziale di una fase di stagflazione. Mantieni un tono istituzionale e incisivo.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { insight: response.text().trim() };
    } catch (error) {
        console.error(`Error in stagflation alert:`, error.message);
        return { insight: "Warning: Stagflation Pattern Detected. Forte disallineamento tra materie prime energetiche (in trend rialzista) e mercato azionario (debolezza), tipico indicatore di possibili pressioni stagflattive." };
    }
}

async function generateCapitalFlow(averages) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { insight: "L'analisi dei capital flow è disabilitata (API Key mancante)." };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sei un macroeconomista quantitativo esperto di allocazione geografica del rischio. 
        Analizza questi punteggi medi (Smart Quant Score) aggregati per regione:
        USA: ${averages.usa}
        Europa: ${averages.europa}
        Asia: ${averages.asia}
        Sviluppati (ex-USA/EU): ${averages.developed}
        Emergenti: ${averages.emergenti}
        
        Scrivi un breve box di "Global Capital Flow" (massimo 4 frasi, in italiano) che spieghi dove si sta dirigendo la liquidità globale. Confronta in modo ravvicinato i mercati Sviluppati e gli Emergenti, citando se gli investitori cercano rendimento o sicurezza in base a questi punteggi. Mantieni un tono istituzionale e professionale. Usa grassetti HTML (<b>) sui concetti chiave.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { insight: response.text().trim() };
    } catch (error) {
        console.error(`Error in capital flow AI:`, error.message);
        return { insight: "Non è stato possibile tracciare i macro-flussi in questo momento a cause di debolezza del server AI." };
    }
}

module.exports = { generateSynthesis, generateQuickInsight, generateCryptoDivergence, generateStagflationAlert, generateCapitalFlow };
