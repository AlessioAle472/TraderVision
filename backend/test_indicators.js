const YF = require('yahoo-finance2').default;

async function test() {
    try {
        const history = await YF.chart('SPY', {
            period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year of daily data
            interval: '1d'
        });
        const quotes = history.quotes.filter(q => q.close !== null);
        console.log('Quotes loaded:', quotes.length);
        
        // Simple EMA
        const calcEMA = (data, period) => {
            let ema = [];
            let multiplier = 2 / (period + 1);
            let prevEma = data[0]; 
            // In reality, should seed with SMA
            let sum = 0;
            for(let i=0; i<period; i++) sum += data[i];
            prevEma = sum / period;
            
            for(let i=0; i<period; i++) ema.push(null); // padding
            ema.push(prevEma);
            
            for(let i=period; i<data.length; i++) {
                let currentEma = (data[i] - prevEma) * multiplier + prevEma;
                ema.push(currentEma);
                prevEma = currentEma;
            }
            return ema;
        }
        
    } catch(e) { console.error(e); }
}
test();
