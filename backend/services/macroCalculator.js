const YF = require('yahoo-finance2').default;
const yf = new YF({ suppressNotices: ['ripHistorical'] });
const fs = require('fs');
const path = require('path');
const { getEconomicDirection } = require('./economicDirection');

const DATA_FILE = path.join(__dirname, '../data/daily_macro.json');

// Memory fallback structure
const defaultMacro = {
    regime: "NEUTRO",
    score: 0,
    recommendations: {
        prefer: ["Diversified ETF", "Market Watch"],
        avoid: ["Extreme Volatility", "Concentrated Bets"]
    },
    trend6m: [0, 0, 0, 0, 0, 0]
};

const getStoredMacroData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error('[MacroService] Failed to read daily_macro.json', error);
    }
    return null;
};

const storeMacroData = (data) => {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        data.timestamp = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[MacroService] Failed to store macro data:', error);
    }
};

const isDataCurrent = (storedData) => {
    if (!storedData || !storedData.timestamp) return false;
    
    const now = new Date();
    const storedDate = new Date(storedData.timestamp);
    
    // Valid from 07:00 AM today (or yesterday if currently < 07:00 AM)
    let cutoff = new Date(now);
    cutoff.setHours(7, 0, 0, 0);
    
    if (now < cutoff) {
        cutoff.setDate(cutoff.getDate() - 1);
    }
    
    return storedDate >= cutoff;
};

const calculateCurrentRegime = async () => {
    try {
        const storedData = getStoredMacroData();
        
        // 1. Check if we have valid, current data (calculated after 07:00 AM)
        if (isDataCurrent(storedData)) {
            console.log(`[MacroService] Returning daily frozen macro data from JSON (Created: ${storedData.timestamp})...`);
            return storedData;
        }

        console.log('[MacroService] 07:00 AM threshold passed. Fetching new historical data from Yahoo Finance...');
        
        const tickers = ['SPY', 'TLT', 'GLD', 'USO', '^VIX'];
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); 

        const results = await Promise.all(tickers.map(async (ticker) => {
            try {
                const history = await yf.chart(ticker, {
                    period1: sixtyDaysAgo,
                    interval: '1d'
                });

                if (!history || !history.quotes || history.quotes.length < 25) {
                    throw new Error(`Insufficient data for ${ticker}`);
                }

                return { ticker, quotes: history.quotes.filter(q => q.close !== null) };
            } catch (err) {
                console.error(`[MacroService] Failed to fetch data for ${ticker}:`, err.message);
                return null;
            }
        }));

        // Filter out failed fetches
        const validResults = results.filter(r => r !== null);
        if (validResults.length < 5) {
            console.warn('[MacroService] Could not fetch all required tickers. Using stored data fallback.');
            return storedData || defaultMacro;
        }

        // Map data for easier access
        const histories = {};
        validResults.forEach(r => histories[r.ticker] = r.quotes);

        // --- Math Helpers ---
        const round2 = (num) => Math.round(num * 100) / 100;

        // --- Smoothing Logic ---
        const calcTrendForDay = (tickerQuotes, offset = 0) => {
            const currentIdx = tickerQuotes.length - 1 - offset;
            const startIdx = Math.max(0, currentIdx - 20); // 30-day window (20 trading days)
            const currentPrice = tickerQuotes[currentIdx].close;
            const startPrice = tickerQuotes[startIdx].close;
            return ((currentPrice - startPrice) / startPrice) * 100;
        };

        const calcSmoothedTrend = (ticker) => {
            const quotes = histories[ticker];
            let sum = 0;
            const daysToSmooth = 3; // 3 Days for high reactivity
            
            // Fixed Reference Price: start from i=1 to skip today's live/intraday price
            for (let i = 1; i <= daysToSmooth; i++) {
                sum += calcTrendForDay(quotes, i);
            }
            return round2(sum / daysToSmooth);
        };

        const spy = calcSmoothedTrend('SPY');
        const tlt = calcSmoothedTrend('TLT');
        const gld = calcSmoothedTrend('GLD');
        const uso = calcSmoothedTrend('USO');
        
        // Also use yesterday's close for VIX to maintain temporal consistency
        const currentVix = round2(histories['^VIX'][histories['^VIX'].length - 2].close);

        // --- Log for Debugging ---
        console.log(`[MacroService] Institutional Trends (Yesterday Close) - SPY: ${spy}%, TLT: ${tlt}%, GLD: ${gld}%, USO: ${uso}%`);

        // --- Outlier Capping (Rounded) ---
        const cap = (val) => round2(Math.max(-15, Math.min(15, val)));
        const cSpy = cap(spy);
        const cTlt = cap(tlt);
        const cGld = cap(gld);
        const cUso = cap(uso);

        // --- Regime Algorithm Implementation ---
        let regime = "NEUTRO";
        let recommendations = { prefer: [], avoid: [] };

        if (cSpy < 0 && cTlt > 0) {
            regime = "DEFLAZIONE";
            recommendations = {
                prefer: ["Bonds (Long Term)", "Cash", "Consumer Staples"],
                avoid: ["Industriali", "Banche", "Materie Prime"]
            };
        } else if (cSpy < 0 && (cGld > 0 || cUso > 0)) {
            regime = "STAGFLAZIONE";
            recommendations = {
                prefer: ["Oro (GLD)", "Commodities", "Healthcare", "Utilities"],
                avoid: ["Tech Growth", "Consumi Discrezionali"]
            };
        } else if (cSpy > 0 && cTlt < 0) {
            regime = "REFLAZIONE"; // Goldilocks
            recommendations = {
                prefer: ["Tech", "Consumi Discrezionali", "Financials"],
                avoid: ["Obbligazioni", "Oro"]
            };
        } else if (cSpy > 0 && cTlt > 0) {
            regime = "BOOM";
            recommendations = {
                prefer: ["Azioni (All Cap)", "Small Caps", "Emerging Markets"],
                avoid: ["Cash", "Inverse ETFs"]
            };
        }

        // --- Dynamic Score Calibration (Logarithmic Normalization) ---
        let baseScore = 0;
        
        if (regime === "STAGFLAZIONE") {
            // Trend Azionario (-30%), Prezzo Materie Prime (+30%), Aspettative Inflazione/GLD (+20%), VIX (+20%)
            // cSpy is usually negative in stagflation.
            const spyScore = Math.min(100, Math.max(0, -cSpy * 10)); 
            const usoScore = Math.min(100, Math.max(0, cUso * 10));  
            const infScore = Math.min(100, Math.max(0, cGld * 10));  
            const vixScore = Math.min(100, Math.max(0, (currentVix - 15) * 5)); 
            
            let stagScore = (spyScore * 0.3) + (usoScore * 0.3) + (infScore * 0.2) + (vixScore * 0.2);
            
            // "Se la divergenza tra SPY e USO supera il 5% mensile, moltiplicatore 1.2x"
            // Note: cUso e cSpy represent percentage change. cUso - cSpy measures divergence.
            if ((cUso - cSpy) > 5) {
                stagScore *= 1.2;
            }
            
            baseScore = Math.min(100, stagScore);
        } else {
            // Normalizzazione Logaritmica: divergenza 2% ~ 50 pt, >15% ~ 99 pt
            let totalDivergence = Math.abs(cSpy) + Math.abs(cTlt);
            baseScore = 100 * (1 - Math.exp(-0.35 * totalDivergence));
        }

        // VIX Integration: Moltiplicatore di incertezza moderato (non applicato due volte in Stagflazione)
        let vixBias = 0;
        if (regime !== "STAGFLAZIONE") {
            if (currentVix >= 30) {
                vixBias = 10;
            } else if (currentVix >= 20) {
                vixBias = 5;
            }
        }

        const rawScore = Math.min(100, Math.round(baseScore + vixBias));  
        
        // --- Il valore viene poi salvato definitivamente fino alle 07:00 del giorno dopo ---
        let finalScore = rawScore;

        // --- Sparkline Data ---
        let trend6m = await getEconomicDirection();
        if (!trend6m || trend6m.length === 0) {
            trend6m = storedData?.trend6m || [0, 0, 0, 0, 0, 0];
        }

        // The Baseline in UI is 0
        const historicAvg = 0; 

        const freshData = {
            regime,
            score: finalScore,
            recommendations,
            trend6m,
            historicAvg
        };

        storeMacroData(freshData);
        
        console.log(`[MacroService] New Daily Calculation complete. Raw: ${rawScore}, Final: ${finalScore} (${regime})`);
        return freshData;

    } catch (error) {
        console.error('[MacroService] Critical error in smoothed calculation:', error);
        return getStoredMacroData() || defaultMacro;
    }
};

module.exports = {
    calculateCurrentRegime
};
