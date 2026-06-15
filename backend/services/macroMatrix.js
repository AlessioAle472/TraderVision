const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical'] });

function calculatePearson(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a,b)=>a+b, 0), sumY = y.reduce((a,b)=>a+b, 0);
    const sumXSq = x.reduce((a,b)=>a+b*b, 0), sumYSq = y.reduce((a,b)=>a+b*b, 0);
    const pSum = x.reduce((a,b,i)=>a+b*y[i], 0);
    const num = pSum - (sumX * sumY / n);
    const den = Math.sqrt((sumXSq - sumX*sumX/n) * (sumYSq - sumY*sumY/n));
    if (den === 0) return 0;
    return num / den;
}

// Map prices to daily returns [ (p1-p0)/p0 ]
function toReturns(prices) {
    let ret = [];
    for(let i=1; i<prices.length; i++) {
        ret.push((prices[i] - prices[i-1])/prices[i-1]);
    }
    return ret;
}

async function getCorrelationMatrix() {
    try {
        const period1 = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days to get ~30 market days
        const tickers = ['SPY', 'GLD', 'USO'];
        let rawData = {};
        
        for (const t of tickers) {
            try {
                const h = await yf.chart(t, { period1, interval: '1d' });
                rawData[t] = h.quotes.filter(q => q.close !== null);
            } catch (e) {
                console.error(`Failed to fetch matrix data for ${t}: ${e.message}`);
                rawData[t] = [];
            }
        }

        // Align by date
        let dates = new Set(rawData['SPY'].map(q => new Date(q.date).toISOString().split('T')[0]));
        for (const t of tickers) {
            const tDates = new Set(rawData[t].map(q => new Date(q.date).toISOString().split('T')[0]));
            dates = new Set([...dates].filter(d => tDates.has(d)));
        }
        
        const sortedDates = [...dates].sort();
        let prices = { SPY: [], GLD: [], USO: [] };
        
        for (const t of tickers) {
            const map = {};
            rawData[t].forEach(q => map[new Date(q.date).toISOString().split('T')[0]] = q.close);
            sortedDates.forEach(d => prices[t].push(map[d]));
        }

        const returns = {
            SPY: toReturns(prices.SPY),
            GLD: toReturns(prices.GLD),
            USO: toReturns(prices.USO)
        };

        // Performance fallback logic
        const performance30d = {};
        for (const t of tickers) {
            if (!prices[t] || prices[t].length === 0) {
                performance30d[t] = 0;
            } else {
                const start = prices[t][0];
                const end = prices[t][prices[t].length - 1];
                performance30d[t] = parseFloat(((end - start) / start * 100).toFixed(2));
            }
        }

        const result = {
            correlations: {},
            performance30d
        };

        for (let i = 0; i < tickers.length; i++) {
            result.correlations[tickers[i]] = {};
            for (let j = 0; j < tickers.length; j++) {
                if (i === j) {
                    result.correlations[tickers[i]][tickers[j]] = 1.0;
                } else {
                    let c = 0;
                    try {
                        c = calculatePearson(returns[tickers[i]], returns[tickers[j]]);
                        if (isNaN(c)) throw new Error('NaN Correlation');
                    } catch (e) {
                        console.warn(`Correlation failed for ${tickers[i]}/${tickers[j]}, using 0 fallback.`);
                        c = 0; 
                    }
                    result.correlations[tickers[i]][tickers[j]] = parseFloat(c.toFixed(2));
                }
            }
        }
        return result;

    } catch(err) {
        console.error('Error computing Correlation Matrix:', err.message);
        return {
            correlations: {
                SPY: { SPY: 1, GLD: 0, USO: 0 },
                GLD: { SPY: 0, GLD: 1, USO: 0 },
                USO: { SPY: 0, GLD: 0, USO: 1 }
            },
            performance30d: { SPY: 0, GLD: 0, USO: 0 }
        };
    }
}

module.exports = { getCorrelationMatrix };
