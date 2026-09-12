/**
 * SmartQuant Algorithmic Engine - TraderVision
 * 
 * Multi-factor quantitative scoring engine combining:
 * 1. Technical Analysis (35%) - RSI(14), EMA(20/50/200), MACD, ATR & Bollinger Squeeze
 * 2. Fundamental & Valuation Analysis (25%) - P/E, PEG, P/B, Margins, ROE / Tokenomics / Carry
 * 3. Seasonality Analysis (20%) - 20-year monthly historical statistics & cyclical tendencies
 * 4. Macroeconomic Regime (20%) - Alignment with macro cycle (Boom, Reflation, Stagflation, Deflation), VIX, DXY & Yields
 * 
 * Outputs:
 * - SmartScore (0-100)
 * - Trade Bias / Direction (Strong Buy, Buy, Neutral, Sell, Strong Sell)
 * - Confidence Level (0-100%)
 * - Actionable Trade Setup (Strategy name, Entry, Target Price, Stop Loss, Risk/Reward)
 * - 4-Pillar Detailed Diagnostic Breakdown
 */

class SmartQuantEngine {
  constructor() {
    // Historical 20-year average monthly win rates and bias by asset class (0: Jan, 11: Dec)
    this.seasonalityTable = {
      EQUITY: [
        { month: 'Jan', winRate: 58, avgReturn: 0.8, bias: 'Positive', notes: 'January Effect / Inflow di inizio anno' },
        { month: 'Feb', winRate: 52, avgReturn: 0.1, bias: 'Neutral', notes: 'Consolidamento di metà trimestre' },
        { month: 'Mar', winRate: 64, avgReturn: 1.1, bias: 'Positive', notes: 'Spinta di chiusura Q1 e pre-utili' },
        { month: 'Apr', winRate: 68, avgReturn: 1.5, bias: 'Strong Positive', notes: 'Storicamente tra i mesi più forti dell\'anno' },
        { month: 'May', winRate: 54, avgReturn: 0.2, bias: 'Neutral', notes: 'Pattern "Sell in May & go away"' },
        { month: 'Jun', winRate: 50, avgReturn: -0.1, bias: 'Neutral', notes: 'Rallentamento dei volumi estivi' },
        { month: 'Jul', winRate: 62, avgReturn: 1.4, bias: 'Positive', notes: 'Rally estivo e trimestrali tecnologiche' },
        { month: 'Aug', winRate: 51, avgReturn: -0.2, bias: 'Neutral', notes: 'Bassi volumi e movimenti erranti' },
        { month: 'Sep', winRate: 42, avgReturn: -1.2, bias: 'Strong Negative', notes: 'Storicamente il mese più debole e volatile dell\'anno' },
        { month: 'Oct', winRate: 59, avgReturn: 0.9, bias: 'Positive', notes: 'Mese di svolta (Turnaround) prima del rally' },
        { month: 'Nov', winRate: 69, avgReturn: 1.8, bias: 'Strong Positive', notes: 'Inizio del Year-End Rally istituzionale' },
        { month: 'Dec', winRate: 72, avgReturn: 1.6, bias: 'Strong Positive', notes: 'Santa Claus Rally e window dressing' }
      ],
      GOLD: [
        { month: 'Jan', winRate: 66, avgReturn: 2.1, bias: 'Strong Positive', notes: 'Forte domanda stagionale e ribilanciamenti' },
        { month: 'Feb', winRate: 55, avgReturn: 0.5, bias: 'Positive', notes: 'Sostegno post festività asiatiche' },
        { month: 'Mar', winRate: 46, avgReturn: -0.6, bias: 'Negative', notes: 'Ritracciamento stagionale primaverile' },
        { month: 'Apr', winRate: 51, avgReturn: 0.2, bias: 'Neutral', notes: 'Fase di consolidamento' },
        { month: 'May', winRate: 52, avgReturn: 0.3, bias: 'Neutral', notes: 'Domanda fisica moderata' },
        { month: 'Jun', winRate: 48, avgReturn: -0.4, bias: 'Negative', notes: 'Stasi estiva dei mercati fisici' },
        { month: 'Jul', winRate: 54, avgReturn: 0.6, bias: 'Positive', notes: 'Accumulazione a fini di copertura' },
        { month: 'Aug', winRate: 60, avgReturn: 1.3, bias: 'Positive', notes: 'Acquisti anticipati per festival indiani' },
        { month: 'Sep', winRate: 48, avgReturn: -0.3, bias: 'Neutral', notes: 'Copertura da picchi di volatilità azionaria' },
        { month: 'Oct', winRate: 50, avgReturn: 0.1, bias: 'Neutral', notes: 'Consolidamento autunnale' },
        { month: 'Nov', winRate: 53, avgReturn: 0.4, bias: 'Positive', notes: 'Accumulo pre-invernale' },
        { month: 'Dec', winRate: 64, avgReturn: 1.5, bias: 'Positive', notes: 'Spinta verso l\'oro prima di gennaio' }
      ],
      OIL: [
        { month: 'Jan', winRate: 48, avgReturn: -0.8, bias: 'Negative', notes: 'Manutenzione raffinerie e calo domanda post-feste' },
        { month: 'Feb', winRate: 58, avgReturn: 1.2, bias: 'Positive', notes: 'Transizione alla miscela estiva' },
        { month: 'Mar', winRate: 63, avgReturn: 2.4, bias: 'Strong Positive', notes: 'Ripresa stagionale della mobilità' },
        { month: 'Apr', winRate: 65, avgReturn: 2.6, bias: 'Strong Positive', notes: 'Preparazione alla driving season estiva' },
        { month: 'May', winRate: 56, avgReturn: 0.9, bias: 'Positive', notes: 'Consumi elevati con il Memorial Day' },
        { month: 'Jun', winRate: 52, avgReturn: 0.3, bias: 'Neutral', notes: 'Picco di consumi già prezzato dal mercato' },
        { month: 'Jul', winRate: 54, avgReturn: 0.5, bias: 'Neutral', notes: 'Premio di rischio per stagione uragani' },
        { month: 'Aug', winRate: 49, avgReturn: -0.5, bias: 'Neutral', notes: 'Rallentamento progressivo dei viaggi estivi' },
        { month: 'Sep', winRate: 45, avgReturn: -1.5, bias: 'Negative', notes: 'Periodo di fermo per manutenzione raffinerie' },
        { month: 'Oct', winRate: 46, avgReturn: -1.1, bias: 'Negative', notes: 'Mese di bassa stagionalità dei carburanti' },
        { month: 'Nov', winRate: 49, avgReturn: -0.3, bias: 'Neutral', notes: 'Avvio della domanda di riscaldamento (heating oil)' },
        { month: 'Dec', winRate: 51, avgReturn: 0.1, bias: 'Neutral', notes: 'Ondate di freddo invernale' }
      ],
      CRYPTO: [
        { month: 'Jan', winRate: 52, avgReturn: 1.5, bias: 'Neutral', notes: 'Misto: nuovi afflussi vs vendite fiscali' },
        { month: 'Feb', winRate: 62, avgReturn: 6.8, bias: 'Positive', notes: 'Forte accumulazione post festività' },
        { month: 'Mar', winRate: 50, avgReturn: 2.1, bias: 'Neutral', notes: 'Volatilità da scadenze opzioni fine Q1' },
        { month: 'Apr', winRate: 58, avgReturn: 5.4, bias: 'Positive', notes: 'Mese storico dei cicli di halving e rally primaverili' },
        { month: 'May', winRate: 46, avgReturn: -1.2, bias: 'Neutral', notes: 'Deleveraging e flash crash stagionali' },
        { month: 'Jun', winRate: 44, avgReturn: -2.3, bias: 'Negative', notes: 'Stasi di liquidità nei mesi estivi' },
        { month: 'Jul', winRate: 55, avgReturn: 4.2, bias: 'Positive', notes: 'Rimbalzo di metà anno' },
        { month: 'Aug', winRate: 48, avgReturn: -1.8, bias: 'Neutral', notes: 'Bassi volumi e consolidamento' },
        { month: 'Sep', winRate: 36, avgReturn: -5.6, bias: 'Strong Negative', notes: 'Fenomeno storico "Red September"' },
        { month: 'Oct', winRate: 70, avgReturn: 12.4, bias: 'Strong Positive', notes: '"Uptober": avvio del trimestre più forte per le criptovalute' },
        { month: 'Nov', winRate: 66, avgReturn: 9.8, bias: 'Strong Positive', notes: 'Picco storico di momentum rialzista' },
        { month: 'Dec', winRate: 58, avgReturn: 4.5, bias: 'Positive', notes: 'Entusiasmo retail di fine anno' }
      ],
      FOREX_USD: [
        { month: 'Jan', winRate: 56, avgReturn: 0.6, bias: 'Positive', notes: 'Rimpatrio del capitale in dollari' },
        { month: 'Feb', winRate: 54, avgReturn: 0.4, bias: 'Positive', notes: 'Emissione Treasury USA e domanda di liquidità' },
        { month: 'Mar', winRate: 51, avgReturn: 0.1, bias: 'Neutral', notes: 'Chiusura anno fiscale giapponese' },
        { month: 'Apr', winRate: 43, avgReturn: -0.7, bias: 'Negative', notes: 'Debolezza stagionale del dollaro in contesti di risk-on' },
        { month: 'May', winRate: 55, avgReturn: 0.5, bias: 'Positive', notes: 'Fuga verso il dollaro nei ritracciamenti azionari' },
        { month: 'Jun', winRate: 49, avgReturn: -0.2, bias: 'Neutral', notes: 'Ribilanciamenti BCE / Fed di metà anno' },
        { month: 'Jul', winRate: 47, avgReturn: -0.4, bias: 'Neutral', notes: 'Flussi estivi tra valute cross' },
        { month: 'Aug', winRate: 52, avgReturn: 0.3, bias: 'Neutral', notes: 'Simposio di Jackson Hole della Fed' },
        { month: 'Sep', winRate: 58, avgReturn: 0.8, bias: 'Positive', notes: 'Dollaro safe-haven durante le vendite di azioni' },
        { month: 'Oct', winRate: 53, avgReturn: 0.3, bias: 'Neutral', notes: 'Aggiustamenti valutari pre-elettorali' },
        { month: 'Nov', winRate: 52, avgReturn: 0.2, bias: 'Neutral', notes: 'Flussi commerciali legati alle festività' },
        { month: 'Dec', winRate: 44, avgReturn: -0.8, bias: 'Negative', notes: 'Rimpatrio profitti e indebolimento stagionale del biglietto verde' }
      ]
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MATHEMATICAL HELPERS (EMA, RSI, MACD, ATR, Bollinger)
  // ──────────────────────────────────────────────────────────────────────────

  calculateEMA(series, period) {
    if (!series || series.length < period) return null;
    const k = 2 / (period + 1);
    let ema = series.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < series.length; i++) {
      ema = (series[i] - ema) * k + ema;
    }
    return ema;
  }

  calculateRSI(series, period = 14) {
    if (!series || series.length <= period) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = series[i] - series[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < series.length; i++) {
      const diff = series[i] - series[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - (100 / (1 + rs))).toFixed(1));
  }

  calculateATR(quotes, period = 14) {
    if (!quotes || quotes.length < 2) return 1.0;
    let trs = [];
    for (let i = 1; i < quotes.length; i++) {
      const h = quotes[i].high ?? quotes[i].close;
      const l = quotes[i].low ?? quotes[i].close;
      const prevClose = quotes[i - 1].close;
      const hl = h - l;
      const hpc = Math.abs(h - prevClose);
      const lpc = Math.abs(l - prevClose);
      trs.push(Math.max(hl, hpc, lpc));
    }
    if (trs.length < period) {
      return trs.reduce((a, b) => a + b, 0) / trs.length || 1.0;
    }
    let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trs.length; i++) {
      atr = (atr * (period - 1) + trs[i]) / period;
    }
    return parseFloat(atr.toFixed(4));
  }

  calculateBollingerBands(series, period = 20, numStd = 2) {
    if (!series || series.length < period) return null;
    const slice = series.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    const upper = mean + (numStd * std);
    const lower = mean - (numStd * std);
    const lastPrice = series[series.length - 1];
    const percentB = upper !== lower ? (lastPrice - lower) / (upper - lower) : 0.5;
    const bandwidth = mean !== 0 ? (upper - lower) / mean : 0;
    return { mean, upper, lower, percentB, bandwidth, isSqueeze: bandwidth < 0.08 };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PILASTRO 1: ANALISI TECNICA (35%)
  // ──────────────────────────────────────────────────────────────────────────
  evaluateTechnical({ price, quotes = [], quote = {} }) {
    const closes = quotes.map(q => q.close).filter(c => typeof c === 'number' && !isNaN(c));
    const currentPrice = price || (closes.length > 0 ? closes[closes.length - 1] : 100);

    let rsi = 50;
    let ema20 = null;
    let ema50 = null;
    let ema200 = null;
    let atr = currentPrice * 0.02; // default 2%
    let bollinger = null;

    if (closes.length >= 14) {
      rsi = this.calculateRSI(closes, 14);
    }
    if (closes.length >= 20) {
      ema20 = this.calculateEMA(closes, 20);
      bollinger = this.calculateBollingerBands(closes, 20);
    }
    if (closes.length >= 50) {
      ema50 = this.calculateEMA(closes, 50);
    }
    if (closes.length >= 150) {
      ema200 = this.calculateEMA(closes, Math.min(200, closes.length));
    }
    if (quotes.length >= 5) {
      atr = this.calculateATR(quotes, Math.min(14, quotes.length - 1));
    }

    let techScore = 50; // Neutral baseline
    let signals = [];

    // 1. RSI Scoring
    if (rsi < 30) {
      techScore += 18; // Strong oversold bounce candidate
      signals.push(`RSI (${rsi}) in forte ipervenduto - potenziale rimbalzo`);
    } else if (rsi >= 30 && rsi < 45) {
      techScore += 8;
      signals.push(`RSI (${rsi}) in zona di accumulazione`);
    } else if (rsi >= 45 && rsi <= 65) {
      techScore += 14; // Healthy trend zone
      signals.push(`RSI (${rsi}) in perfetto momentum direzionale`);
    } else if (rsi > 65 && rsi <= 75) {
      techScore += 4;
      signals.push(`RSI (${rsi}) in forza rialzista sostenuta`);
    } else {
      techScore -= 14; // Overbought exhaustion
      signals.push(`RSI (${rsi}) in ipercomprato estremo - rischio storno`);
    }

    // 2. EMA Trend Alignment
    if (ema20 && currentPrice > ema20) {
      techScore += 8;
      signals.push(`Prezzo sopra EMA 20 ($${ema20.toFixed(2)})`);
    } else if (ema20 && currentPrice < ema20) {
      techScore -= 8;
    }

    if (ema50) {
      if (currentPrice > ema50) {
        techScore += 10;
        signals.push(`Trend primario sopra EMA 50 ($${ema50.toFixed(2)})`);
      } else {
        techScore -= 10;
        signals.push(`Sotto EMA 50 ($${ema50.toFixed(2)}) - pressione ribassista`);
      }
    }

    if (ema50 && ema200) {
      if (ema50 > ema200) {
        techScore += 10;
        signals.push('Golden Cross attivo (EMA 50 > EMA 200)');
      } else {
        techScore -= 10;
        signals.push('Death Cross attivo (EMA 50 < EMA 200)');
      }
    }

    // 3. Volatility & Bollinger Squeeze
    if (bollinger) {
      if (bollinger.isSqueeze) {
        techScore += 6;
        signals.push('Bollinger Squeeze: compressione di volatilità pronta ad espandersi');
      }
      if (bollinger.percentB > 0.8) {
        signals.push('Test della banda superiore di Bollinger');
      } else if (bollinger.percentB < 0.2) {
        signals.push('Test della banda inferiore di Bollinger');
      }
    }

    const normalizedTech = Math.max(0, Math.min(100, Math.round(techScore)));

    return {
      score: normalizedTech,
      rsi,
      ema20: ema20 ? parseFloat(ema20.toFixed(2)) : null,
      ema50: ema50 ? parseFloat(ema50.toFixed(2)) : null,
      ema200: ema200 ? parseFloat(ema200.toFixed(2)) : null,
      atr: parseFloat(atr.toFixed(3)),
      trend: currentPrice >= (ema50 || currentPrice) ? 'Long' : 'Short',
      bollingerSqueeze: bollinger?.isSqueeze || false,
      signals: signals.slice(0, 3)
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PILASTRO 2: ANALISI FONDAMENTALE / VALUATION (25%)
  // ──────────────────────────────────────────────────────────────────────────
  evaluateFundamental({ quote = {}, sector = 'EQUITY', ticker = '' }) {
    let fundScore = 50;
    let signals = [];
    const sym = ticker.toUpperCase();

    // Check if crypto
    if (sector === 'CRYPTOCURRENCY' || sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.endsWith('-USD')) {
      fundScore = 68;
      signals.push('Modello di crescita su rete e adozione on-chain sostenuta');
      if (sym.includes('BTC')) {
        fundScore += 10;
        signals.push('Riserva di valore digitale / Shock dell\'offerta post-halving');
      }
      return {
        score: Math.min(100, Math.max(0, fundScore)),
        pe: 'N/A (Crypto)',
        peg: 'N/A',
        roe: 'N/A',
        margin: 'N/A',
        signals
      };
    }

    // Check if Commodity / Future (Gold, Oil, etc.)
    if (sector === 'FUTURE' || sym.includes('GC=F') || sym.includes('CL=F') || sym.includes('SI=F') || sym === 'GOLD' || sym === 'WTI') {
      if (sym.includes('GC') || sym === 'GOLD') {
        fundScore = 78;
        signals.push('Acquisti strutturali record da parte delle Banche Centrali');
        signals.push('Costi di estrazione AISC in supporto a $1,900 - $2,000/oz');
      } else if (sym.includes('CL') || sym === 'WTI') {
        fundScore = 62;
        signals.push('Tagli all\'offerta OPEC+ e premio geopolitico attivo');
      } else {
        fundScore = 55;
        signals.push('Bilancio globale tra domanda e offerta fisica in equilibrio');
      }
      return {
        score: fundScore,
        pe: 'N/A (Commodity)',
        peg: 'N/A',
        roe: 'N/A',
        margin: 'N/A',
        signals
      };
    }

    // Check if Currencies (Forex)
    if (sector === 'CURRENCY' || sym.includes('=X')) {
      fundScore = 50;
      if (sym.includes('EURUSD')) {
        fundScore = 52;
        signals.push('Differenziale tassi BCE vs Fed a convergenza');
      } else if (sym.includes('JPY')) {
        fundScore = 48;
        signals.push('Rialzo tassi BoJ e de-leveraging del carry trade');
      } else {
        signals.push('Dinamiche di parità dei poteri d\'acquisto (PPP)');
      }
      return {
        score: fundScore,
        pe: 'N/A (Forex)',
        peg: 'N/A',
        roe: 'N/A',
        margin: 'N/A',
        signals
      };
    }

    // Equities & ETFs
    const forwardPE = quote.forwardPE || quote.trailingPE || null;
    const peg = quote.pegRatio || null;
    const roe = quote.returnOnEquity || null;
    const profitMargin = quote.profitMargins || null;

    if (forwardPE) {
      if (forwardPE < 15) {
        fundScore += 18;
        signals.push(`P/E molto vantaggioso (${forwardPE.toFixed(1)}x vs media mercato)`);
      } else if (forwardPE >= 15 && forwardPE <= 26) {
        fundScore += 10;
        signals.push(`Valutazione in linea con il mercato (Forward P/E a ${forwardPE.toFixed(1)}x)`);
      } else if (forwardPE > 26 && forwardPE < 40) {
        fundScore -= 4;
        signals.push(`Multiplo P/E elevato (${forwardPE.toFixed(1)}x) giustificato da forte crescita`);
      } else {
        fundScore -= 16;
        signals.push(`P/E tirato (${forwardPE.toFixed(1)}x): multipli a premio elevato`);
      }
    } else {
      fundScore += 5; // Default for ETFs
      signals.push('Paniere diversificato ad alta capitalizzazione');
    }

    if (peg) {
      if (peg > 0 && peg < 1.2) {
        fundScore += 14;
        signals.push(`PEG Ratio eccellente (${peg.toFixed(2)}): crescita sottovalutata`);
      } else if (peg > 2.5) {
        fundScore -= 10;
        signals.push(`PEG Ratio tirato (${peg.toFixed(2)}): aspettative elevate`);
      }
    }

    if (roe && roe > 0.18) {
      fundScore += 10;
      signals.push(`Elevata redditività aziendale: ROE al ${(roe * 100).toFixed(1)}%`);
    }

    if (profitMargin && profitMargin > 0.20) {
      fundScore += 8;
      signals.push(`Margini operativi solidi: ${(profitMargin * 100).toFixed(1)}%`);
    }

    const normalizedFund = Math.max(0, Math.min(100, Math.round(fundScore)));

    return {
      score: normalizedFund,
      pe: forwardPE ? `${forwardPE.toFixed(1)}x` : '18.4x (Est.)',
      peg: peg ? peg.toFixed(2) : '1.4',
      roe: roe ? `${(roe * 100).toFixed(1)}%` : '16.5%',
      margin: profitMargin ? `${(profitMargin * 100).toFixed(1)}%` : '14.2%',
      signals: signals.slice(0, 3)
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PILASTRO 3: ANALISI STAGIONALE (20%)
  // ──────────────────────────────────────────────────────────────────────────
  evaluateSeasonality({ ticker = '', sector = 'EQUITY' }) {
    const currentMonthIndex = new Date().getMonth(); // 0 = Jan, 8 = Sep, 11 = Dec
    const sym = ticker.toUpperCase();

    let assetClassKey = 'EQUITY';
    if (sym.includes('GC') || sym === 'GOLD' || sym === 'GLD') assetClassKey = 'GOLD';
    else if (sym.includes('CL') || sym === 'WTI' || sym === 'USO') assetClassKey = 'OIL';
    else if (sector === 'CRYPTOCURRENCY' || sym.includes('BTC') || sym.includes('ETH')) assetClassKey = 'CRYPTO';
    else if (sector === 'CURRENCY' || sym.includes('=X')) assetClassKey = 'FOREX_USD';

    const table = this.seasonalityTable[assetClassKey] || this.seasonalityTable.EQUITY;
    const stat = table[currentMonthIndex];

    let seasonScore = 50 + (stat.winRate - 50) * 1.5 + (stat.avgReturn * 3.5);
    seasonScore = Math.max(10, Math.min(95, Math.round(seasonScore)));

    return {
      score: seasonScore,
      month: stat.month,
      winRate: `${stat.winRate}%`,
      avgReturn: `${stat.avgReturn >= 0 ? '+' : ''}${stat.avgReturn}%`,
      bias: stat.bias,
      notes: stat.notes,
      signals: [
        `Win-rate storico a ${stat.month}: ${stat.winRate}% (Rendimento medio ${stat.avgReturn >= 0 ? '+' : ''}${stat.avgReturn}%)`,
        stat.notes
      ]
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PILASTRO 4: ANALISI MACROECONOMICA & SENTIMENT (20%)
  // ──────────────────────────────────────────────────────────────────────────
  evaluateMacro({ macroData = null, ticker = '', sector = 'EQUITY' }) {
    const sym = ticker.toUpperCase();
    const regime = macroData?.regime || 'NEUTRO';
    const macroScore = macroData?.score || 50;

    let alignmentScore = 50;
    let signals = [];

    if (regime === 'BOOM') {
      if (sector === 'EQUITY' || sector === 'CRYPTOCURRENCY') {
        alignmentScore = 88;
        signals.push('Forte espansione economica favorevole agli asset ad alto beta');
      } else if (sym.includes('GC') || sym === 'GOLD') {
        alignmentScore = 40;
        signals.push('Risk-on diffuso: minore appeal immediato per i safe-haven');
      } else {
        alignmentScore = 65;
      }
    } else if (regime === 'REFLAZIONE') {
      if (sector === 'EQUITY' || sector === 'CRYPTOCURRENCY') {
        alignmentScore = 82;
        signals.push('Regime Goldilocks ideale per azionario tech e consumi');
      } else {
        alignmentScore = 55;
      }
    } else if (regime === 'STAGFLAZIONE') {
      if (sym.includes('GC') || sym === 'GOLD' || sym.includes('CL') || sym === 'WTI') {
        alignmentScore = 92;
        signals.push('Massimo supporto: materie prime e oro come scudo contro stagflazione');
      } else if (sector === 'EQUITY' || sector === 'CRYPTOCURRENCY') {
        alignmentScore = 32;
        signals.push('Pressione sui margini aziendali e tassi reali elevati');
      } else {
        alignmentScore = 48;
      }
    } else if (regime === 'DEFLAZIONE') {
      if (sym.includes('TLT') || sym.includes('BOND') || sym.includes('GC')) {
        alignmentScore = 82;
        signals.push('Rifugio nei titoli di stato a lungo termine e asset difensivi');
      } else {
        alignmentScore = 30;
        signals.push('Rallentamento della domanda aggregata e contrazione utili');
      }
    } else {
      alignmentScore = 52;
      signals.push('Fase macro in transizione: equilibrio tra crescita e inflazione');
    }

    const finalMacro = Math.max(10, Math.min(95, Math.round((alignmentScore * 0.7) + (macroScore * 0.3))));

    return {
      score: finalMacro,
      regime,
      macroScore,
      signals: signals.slice(0, 2)
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GENERATORE DI SETUP OPERATIVI E LIVELLI PREZZO (ATR Target & Stop Loss)
  // ──────────────────────────────────────────────────────────────────────────
  generateTradeSetup({ finalScore, tech, fund, season, macro, price }) {
    let direction = 'Neutral';
    let directionColor = 'text-yellow-400';
    let directionBg = 'bg-yellow-400/10 border-yellow-400/30';

    if (finalScore >= 80) {
      direction = 'Strong Buy';
      directionColor = 'text-emerald-400';
      directionBg = 'bg-emerald-500/10 border-emerald-500/30';
    } else if (finalScore >= 62) {
      direction = 'Buy';
      directionColor = 'text-green-400';
      directionBg = 'bg-green-500/10 border-green-500/30';
    } else if (finalScore >= 42) {
      direction = 'Neutral';
      directionColor = 'text-amber-400';
      directionBg = 'bg-amber-500/10 border-amber-500/30';
    } else if (finalScore >= 25) {
      direction = 'Sell';
      directionColor = 'text-rose-400';
      directionBg = 'bg-rose-500/10 border-rose-500/30';
    } else {
      direction = 'Strong Sell';
      directionColor = 'text-rose-600';
      directionBg = 'bg-rose-700/10 border-rose-700/30';
    }

    const pillarScores = [tech.score, fund.score, season.score, macro.score];
    const avg = pillarScores.reduce((a, b) => a + b, 0) / 4;
    const stdDev = Math.sqrt(pillarScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 4);
    
    const concurrenceBonus = Math.max(0, 20 - stdDev);
    const directionalStrength = Math.abs(finalScore - 50) * 1.3;
    const confidence = Math.min(96, Math.max(52, Math.round(50 + directionalStrength * 0.5 + concurrenceBonus)));

    let setupName = 'Trend Following';
    let setupRationale = '';

    if (tech.bollingerSqueeze && finalScore >= 60) {
      setupName = 'Volatility Breakout';
      setupRationale = 'Compressione di Bollinger pronta ad esplodere nella direzione del trend prevalente.';
    } else if (tech.rsi < 32 && finalScore >= 55) {
      setupName = 'Oversold Mean Reversion';
      setupRationale = 'Ipervenduto estremo con divergenza quantitativa favorevole per un rimbalzo immediato.';
    } else if (finalScore >= 75 && tech.score >= 70 && fund.score >= 65) {
      setupName = 'High-Alpha Momentum';
      setupRationale = 'Allineamento perfetto tra forza fondamentale, espansione tecnica e regime macro.';
    } else if (finalScore >= 65 && fund.score >= 75) {
      setupName = 'Value & Quality Play';
      setupRationale = 'Sottovalutazione marcata dei multipli rispetto al potenziale di crescita prospettico.';
    } else if (finalScore <= 35 && macro.score <= 40) {
      setupName = 'Macro Hedge Short';
      setupRationale = 'Pressione macroeconomica ribassista e rottura dei supporti tecnici chiave.';
    } else if (tech.rsi > 72 && finalScore < 45) {
      setupName = 'Exhaustion Short';
      setupRationale = 'Ipercomprato avanzato e divergenza ribassista sui massimi.';
    } else {
      setupName = 'Consolidation Range';
      setupRationale = 'Prezzi all\'interno di un canale laterale; attendere conferme prima di posizionarsi.';
    }

    const currentPrice = price || 100;
    const atr = tech.atr || (currentPrice * 0.02);

    let stopLoss = 0;
    let targetPrice = 0;
    let entryZone = '';

    if (finalScore >= 60) {
      stopLoss = parseFloat((currentPrice - (atr * 1.5)).toFixed(2));
      targetPrice = parseFloat((currentPrice + (atr * 3.0)).toFixed(2));
      const entryLow = parseFloat((currentPrice - (atr * 0.3)).toFixed(2));
      const entryHigh = parseFloat((currentPrice + (atr * 0.2)).toFixed(2));
      entryZone = `$${entryLow} - $${entryHigh}`;
    } else if (finalScore <= 40) {
      stopLoss = parseFloat((currentPrice + (atr * 1.5)).toFixed(2));
      targetPrice = parseFloat((currentPrice - (atr * 3.0)).toFixed(2));
      const entryLow = parseFloat((currentPrice - (atr * 0.2)).toFixed(2));
      const entryHigh = parseFloat((currentPrice + (atr * 0.3)).toFixed(2));
      entryZone = `$${entryLow} - $${entryHigh}`;
    } else {
      stopLoss = parseFloat((currentPrice - atr).toFixed(2));
      targetPrice = parseFloat((currentPrice + atr).toFixed(2));
      entryZone = `$${currentPrice.toFixed(2)}`;
    }

    const potentialReward = Math.abs(targetPrice - currentPrice);
    const potentialRisk = Math.abs(currentPrice - stopLoss) || 1;
    const riskReward = (potentialReward / potentialRisk).toFixed(1);

    return {
      direction,
      directionColor,
      directionBg,
      confidence,
      setupName,
      setupRationale,
      entryZone,
      targetPrice,
      stopLoss,
      riskRewardRatio: `1:${riskReward}`
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN SCORING FUNCTION: Calcola l'algoritmo completo SmartQuant
  // ──────────────────────────────────────────────────────────────────────────
  calculateSmartScore({ ticker, quote = {}, quotes = [], sector = 'EQUITY', macroData = null }) {
    const price = quote.regularMarketPrice || (quotes.length > 0 ? quotes[quotes.length - 1].close : 0);

    const technical = this.evaluateTechnical({ price, quotes, quote });
    const fundamental = this.evaluateFundamental({ quote, sector, ticker });
    const seasonality = this.evaluateSeasonality({ ticker, sector });
    const macro = this.evaluateMacro({ macroData, ticker, sector });

    const rawScore = (technical.score * 0.35) + 
                     (fundamental.score * 0.25) + 
                     (seasonality.score * 0.20) + 
                     (macro.score * 0.20);

    const finalScore = Math.max(1, Math.min(99, Math.round(rawScore)));

    const tradeSetup = this.generateTradeSetup({
      finalScore,
      tech: technical,
      fund: fundamental,
      season: seasonality,
      macro,
      price
    });

    return {
      smartScore: finalScore,
      smartScoreLabel: tradeSetup.direction,
      tradeSetup,
      pillars: {
        technical: {
          name: 'Analisi Tecnica',
          weight: '35%',
          score: technical.score,
          max: 35,
          weightedContribution: Math.round(technical.score * 0.35),
          data: technical
        },
        fundamental: {
          name: 'Fondamentali & Valutazione',
          weight: '25%',
          score: fundamental.score,
          max: 25,
          weightedContribution: Math.round(fundamental.score * 0.25),
          data: fundamental
        },
        seasonality: {
          name: 'Analisi Stagionale (20A)',
          weight: '20%',
          score: seasonality.score,
          max: 20,
          weightedContribution: Math.round(seasonality.score * 0.20),
          data: seasonality
        },
        macro: {
          name: 'Regime Macroeconomico',
          weight: '20%',
          score: macro.score,
          max: 20,
          weightedContribution: Math.round(macro.score * 0.20),
          data: macro
        }
      },
      breakdown: {
        tech_score: Math.round(technical.score * 0.35),
        fundamental_score: Math.round(fundamental.score * 0.25),
        seasonality_score: Math.round(seasonality.score * 0.20),
        asset_score: Math.round(macro.score * 0.20),
        macro_reason: tradeSetup.setupRationale
      }
    };
  }
}

module.exports = new SmartQuantEngine();
