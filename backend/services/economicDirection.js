const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical'] });

function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    let ema = [];
    
    let sum = 0;
    for (let i = 0; i < period && i < data.length; i++) {
        sum += data[i];
        ema.push(null); 
    }
    if (data.length < period) return ema;
    
    let currentEma = sum / period;
    ema[period - 1] = currentEma;

    for (let i = period; i < data.length; i++) {
        currentEma = (data[i] - currentEma) * k + currentEma;
        ema.push(currentEma);
    }
    return ema;
}

function calculateATR(highs, lows, closes, period = 14) {
    let trs = [0]; 
    for (let i = 1; i < highs.length; i++) {
        const hl = highs[i] - lows[i];
        const hpc = Math.abs(highs[i] - closes[i - 1]);
        const lpc = Math.abs(lows[i] - closes[i - 1]);
        trs.push(Math.max(hl, hpc, lpc));
    }
    
    let atr = [];
    let sum = 0;
    for (let i = 0; i < period && i < trs.length; i++) {
        sum += trs[i];
        atr.push(null);
    }
    if (trs.length < period) return atr;
    
    let currentAtr = sum / period;
    atr[period - 1] = currentAtr;
    
    for (let i = period; i < trs.length; i++) {
        currentAtr = ((currentAtr * (period - 1)) + trs[i]) / period;
        atr.push(currentAtr);
    }
    return atr;
}

async function getEconomicDirection() {
    try {
        const history = await yf.chart('SPY', {
            period1: new Date(Date.now() - 600 * 24 * 60 * 60 * 1000), 
            interval: '1d'
        });

        const quotes = history.quotes.filter(q => q.close !== null && q.high !== null && q.low !== null);
        if (quotes.length < 200) return [];

        const closes = quotes.map(q => q.close);
        const highs = quotes.map(q => q.high);
        const lows = quotes.map(q => q.low);

        const ema20 = calculateEMA(closes, 20);
        const ema200 = calculateEMA(closes, 200);
        const atr14 = calculateATR(highs, lows, closes, 14);

        let trend6m = [];
        const requiredCalculated = 126;

        for (let i = 0; i < quotes.length; i++) {
            if (ema20[i] !== null && ema200[i] !== null && atr14[i] !== null && atr14[i] > 0) {
                const normalizedSpread = (ema20[i] - ema200[i]) / atr14[i];
                trend6m.push(Math.round(normalizedSpread * 100) / 100); 
            }
        }
        
        // Return exactly the last 126 items
        return trend6m.slice(-requiredCalculated);
    } catch (error) {
        console.error('[EconomicDirection] Failed to calculate:', error.message);
        return [];
    }
}

module.exports = { getEconomicDirection };
