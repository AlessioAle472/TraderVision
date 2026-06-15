const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical'] });
const { getCorrelationMatrix } = require('./macroMatrix');

async function getDeepDiveData() {
    try {
        const period1 = new Date(Date.now() - 185 * 24 * 60 * 60 * 1000); // ~6 months
        const tickers = ['SPY', 'GLD', 'USO', 'TLT'];
        let chartData = {};

        // 1. Fetch 6M History for main chart
        for (const t of tickers) {
            try {
                const h = await yf.chart(t, { period1, interval: '1mo' });
                chartData[t] = h.quotes.filter(q => q.close !== null);
            } catch (e) {
                console.error(`Failed to fetch deep dive chart for ${t}: ${e.message}`);
                chartData[t] = [];
            }
        }

        // Align chart data by date and normalize to base 100
        let dates = new Set(chartData['SPY'].map(q => new Date(q.date).toISOString().split('T')[0].substring(0,7))); // YYYY-MM
        const normalizedChart = [];
        
        // Find common months or just use SPY's months
        const spyMonths = chartData['SPY'].map(q => ({
            date: new Date(q.date).toISOString().split('T')[0].substring(0,7),
            close: q.close
        }));

        let basePrices = {
            SPY: chartData['SPY'][0]?.close || 1,
            GLD: chartData['GLD'][0]?.close || 1,
            USO: chartData['USO'][0]?.close || 1,
            TLT: chartData['TLT'][0]?.close || 1,
        };

        for (let i = 0; i < spyMonths.length; i++) {
            const monthStr = spyMonths[i].date;
            
            // find closest quote in others
            const getPrice = (t) => {
                const q = chartData[t].find(x => new Date(x.date).toISOString().startsWith(monthStr));
                return q ? q.close : basePrices[t]; // fallback to base if missing
            };

            normalizedChart.push({
                date: monthStr,
                SPY: Math.round((getPrice('SPY') / basePrices.SPY) * 100),
                GLD: Math.round((getPrice('GLD') / basePrices.GLD) * 100),
                USO: Math.round((getPrice('USO') / basePrices.USO) * 100),
                TLT: Math.round((getPrice('TLT') / basePrices.TLT) * 100),
            });
        }

        // 2. Fetch Fundamentals: VIX, DXY, 10Y (^TNX), 3M (^IRX)
        const fundTickers = ['^VIX', 'DX-Y.NYB', '^TNX', '^IRX'];
        const quotes = await yf.quote(fundTickers);
        
        const getQ = (sym) => {
            const q = quotes.find(q => q.symbol === sym) || {};
            return {
                price: parseFloat(q.regularMarketPrice) || 0,
                change: parseFloat(q.regularMarketChangePercent) || 0
            };
        };
        
        const vix = getQ('^VIX');
        const dxy = getQ('DX-Y.NYB');
        const tnx = getQ('^TNX');
        const irx = getQ('^IRX');

        // Yield Spread: 10Y - 3M
        const yieldSpread = tnx.price - irx.price;
        
        // Approximation of previous spread to calculate change in bps
        const prevTnx = tnx.price / (1 + (tnx.change/100));
        const prevIrx = irx.price / (1 + (irx.change/100));
        const prevSpread = prevTnx - prevIrx;
        const spreadChange = (yieldSpread - prevSpread) * 100; // in basis points approx

        const fundamentals = {
            vix: {
                price: vix.price.toFixed(2),
                change: vix.change.toFixed(2)
            },
            dxy: {
                price: dxy.price.toFixed(2),
                change: dxy.change.toFixed(2)
            },
            yieldCurve: {
                price: yieldSpread.toFixed(3),
                change: spreadChange.toFixed(0) // bps
            }
        };

        // 3. Correlation Matrix
        const correlationMatrix = await getCorrelationMatrix();

        return {
            chart: normalizedChart,
            fundamentals,
            correlationMatrix
        };

    } catch (error) {
        console.error('Error fetching Deep Dive data:', error.message);
        throw error;
    }
}

module.exports = { getDeepDiveData };
