const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const PortfolioPosition = require('../models/PortfolioPosition');
const { protect } = require('../middleware/authMiddleware');

// Helper to normalize ticker for Yahoo Finance
const normalizeYahooTicker = (ticker) => {
  if (!ticker) return 'SPY';
  let t = ticker.trim().toUpperCase();
  if (t === 'BTC') return 'BTC-USD';
  if (t === 'ETH') return 'ETH-USD';
  if (t === 'SOL') return 'SOL-USD';
  if (t === 'GOLD') return 'GC=F';
  if (t === 'OIL' || t === 'WTI') return 'CL=F';
  if (t === 'SP500' || t === 'S&P500') return '^GSPC';
  if (t === 'NASDAQ') return '^IXIC';
  if (t === 'EURUSD') return 'EURUSD=X';
  if (t === 'GBPUSD') return 'GBPUSD=X';
  return t;
};

// Helper to detect asset type from ticker
const detectAssetType = (ticker) => {
  const t = ticker.toUpperCase();
  if (t.includes('-USD') || t.includes('-EUR') || ['BTC', 'ETH', 'SOL', 'XRP'].includes(t)) return 'crypto';
  if (t.includes('=F') || ['GC=F', 'CL=F', 'SI=F', 'GOLD', 'WTI'].includes(t)) return 'commodity';
  if (t.includes('=X') || ['EURUSD', 'GBPUSD', 'USDJPY'].includes(t)) return 'forex';
  if (t.startsWith('^')) return 'index';
  return 'stock';
};

// ── GET /api/portfolio ─────────────────────────────────────────────────────
// Retrieve all positions for the authenticated user, enriched with live quotes
router.get('/', protect, async (req, res) => {
  try {
    const positions = await PortfolioPosition.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (positions.length === 0) {
      return res.json({
        summary: {
          totalValue: 0,
          totalInvested: 0,
          totalUnrealizedPnL: 0,
          totalUnrealizedPnLPercent: 0,
          totalDailyPnL: 0,
          positionsCount: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
          bestPerformer: null,
          worstPerformer: null,
        },
        allocations: {
          byAsset: [],
          byType: [],
        },
        positions: [],
      });
    }

    // Fetch live quotes for unique tickers
    const uniqueTickers = [...new Set(positions.map((p) => normalizeYahooTicker(p.ticker)))];
    const quotesMap = {};

    await Promise.all(
      uniqueTickers.map(async (yTicker) => {
        try {
          const quote = await yf.quote(yTicker, {
            fields: ['regularMarketPrice', 'regularMarketChangePercent', 'regularMarketChange', 'shortName', 'longName', 'currency'],
          });
          if (quote) {
            quotesMap[yTicker] = {
              price: quote.regularMarketPrice ?? null,
              changePercent: quote.regularMarketChangePercent ?? 0,
              change: quote.regularMarketChange ?? 0,
              name: quote.shortName || quote.longName || yTicker,
              currency: quote.currency || 'USD',
            };
          }
        } catch (err) {
          console.warn(`[Portfolio] Failed to fetch quote for ${yTicker}:`, err.message);
        }
      })
    );

    let totalValue = 0;
    let totalInvested = 0;
    let totalDailyPnL = 0;
    let winCount = 0;
    let lossCount = 0;

    const enrichedPositions = positions.map((pos) => {
      const yTicker = normalizeYahooTicker(pos.ticker);
      const quote = quotesMap[yTicker] || {};

      const currentPrice = typeof quote.price === 'number' && quote.price > 0 ? quote.price : pos.buyPrice;
      const change24hPercent = quote.changePercent || 0;
      const investedCapital = Number((pos.buyPrice * pos.quantity).toFixed(2));
      const currentValue = Number((currentPrice * pos.quantity).toFixed(2));
      const unrealizedPnL = Number((currentValue - investedCapital).toFixed(2));
      const unrealizedPnLPercent = investedCapital > 0 ? Number((((currentValue - investedCapital) / investedCapital) * 100).toFixed(2)) : 0;
      
      const dailyPriceChange = quote.change || (currentPrice * (change24hPercent / 100));
      const dailyPnL = Number((dailyPriceChange * pos.quantity).toFixed(2));

      totalValue += currentValue;
      totalInvested += investedCapital;
      totalDailyPnL += dailyPnL;

      if (unrealizedPnL >= 0) {
        winCount++;
      } else {
        lossCount++;
      }

      return {
        _id: pos._id,
        ticker: pos.ticker,
        yahooTicker: yTicker,
        name: pos.name || quote.name || pos.ticker,
        assetType: pos.assetType || detectAssetType(pos.ticker),
        buyDate: pos.buyDate,
        buyPrice: pos.buyPrice,
        quantity: pos.quantity,
        currentPrice: Number(currentPrice.toFixed(4)),
        investedCapital,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        dailyPnL,
        change24hPercent: Number(change24hPercent.toFixed(2)),
        currency: quote.currency || pos.currency || 'USD',
        notes: pos.notes || '',
        targetPrice: pos.targetPrice,
        stopLoss: pos.stopLoss,
        createdAt: pos.createdAt,
      };
    });

    const totalUnrealizedPnL = Number((totalValue - totalInvested).toFixed(2));
    const totalUnrealizedPnLPercent = totalInvested > 0 ? Number((((totalValue - totalInvested) / totalInvested) * 100).toFixed(2)) : 0;
    const winRate = positions.length > 0 ? Number(((winCount / positions.length) * 100).toFixed(1)) : 0;

    // Find best and worst performer
    const sortedByPnL = [...enrichedPositions].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent);
    const bestPerformer = sortedByPnL[0] || null;
    const worstPerformer = sortedByPnL[sortedByPnL.length - 1] || null;

    // Compute allocations (% of totalValue)
    const byAsset = enrichedPositions.map((p) => ({
      ticker: p.ticker,
      name: p.name,
      value: p.currentValue,
      weight: totalValue > 0 ? Number(((p.currentValue / totalValue) * 100).toFixed(1)) : 0,
      pnlPercent: p.unrealizedPnLPercent,
      assetType: p.assetType,
    }));

    const typeBuckets = {};
    enrichedPositions.forEach((p) => {
      typeBuckets[p.assetType] = (typeBuckets[p.assetType] || 0) + p.currentValue;
    });

    const byType = Object.entries(typeBuckets).map(([type, val]) => ({
      type,
      value: Number(val.toFixed(2)),
      weight: totalValue > 0 ? Number(((val / totalValue) * 100).toFixed(1)) : 0,
    }));

    res.json({
      summary: {
        totalValue: Number(totalValue.toFixed(2)),
        totalInvested: Number(totalInvested.toFixed(2)),
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent,
        totalDailyPnL: Number(totalDailyPnL.toFixed(2)),
        positionsCount: positions.length,
        winCount,
        lossCount,
        winRate,
        bestPerformer,
        worstPerformer,
      },
      allocations: {
        byAsset,
        byType,
      },
      positions: enrichedPositions,
    });
  } catch (error) {
    console.error('[Portfolio] GET / error:', error);
    res.status(500).json({ error: 'Errore durante il recupero del portafoglio' });
  }
});

// ── GET /api/portfolio/history ─────────────────────────────────────────────
// Generate aggregate portfolio equity curve over requested timeframe
router.get('/history', protect, async (req, res) => {
  try {
    const { timeframe = '1M' } = req.query;
    const positions = await PortfolioPosition.find({ user: req.user._id });

    if (positions.length === 0) {
      return res.json([]);
    }

    // Determine days back based on timeframe
    let daysBack = 30;
    if (timeframe === '1W') daysBack = 7;
    else if (timeframe === '1M') daysBack = 30;
    else if (timeframe === '3M') daysBack = 90;
    else if (timeframe === '6M') daysBack = 180;
    else if (timeframe === '1Y') daysBack = 365;
    else if (timeframe === 'ALL') daysBack = 730;

    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const toDate = new Date();

    // Fetch daily historical bars for each unique ticker
    const uniqueTickers = [...new Set(positions.map((p) => normalizeYahooTicker(p.ticker)))];
    const tickerHistoryMap = {};

    await Promise.all(
      uniqueTickers.map(async (yTicker) => {
        try {
          const chartData = await yf.chart(yTicker, {
            period1: fromDate,
            period2: toDate,
            interval: daysBack > 180 ? '1d' : '1d',
          });
          if (chartData && chartData.quotes && chartData.quotes.length > 0) {
            tickerHistoryMap[yTicker] = chartData.quotes.filter((q) => q.close != null);
          }
        } catch (err) {
          console.warn(`[Portfolio] Error fetching history for ${yTicker}:`, err.message);
        }
      })
    );

    // Build unique timeline date strings (YYYY-MM-DD)
    const dateSet = new Set();
    Object.values(tickerHistoryMap).forEach((quotes) => {
      quotes.forEach((q) => {
        const dStr = new Date(q.date).toISOString().split('T')[0];
        dateSet.add(dStr);
      });
    });

    const sortedDates = Array.from(dateSet).sort();

    if (sortedDates.length === 0) {
      // Fallback: produce a simulated steady line from total invested to current
      return res.json([]);
    }

    // For each date, calculate portfolio total equity & invested capital
    const timeline = sortedDates.map((dateStr) => {
      const targetDate = new Date(dateStr);
      let dayTotalValue = 0;
      let dayTotalInvested = 0;

      positions.forEach((pos) => {
        const buyDate = new Date(pos.buyDate);
        // Only include positions that had already been bought by this date
        if (buyDate <= targetDate) {
          const yTicker = normalizeYahooTicker(pos.ticker);
          const quotes = tickerHistoryMap[yTicker] || [];
          // Find quote for this date or closest prior
          let matchQuote = quotes.find((q) => new Date(q.date).toISOString().split('T')[0] === dateStr);
          if (!matchQuote) {
            // find closest previous quote
            const priorQuotes = quotes.filter((q) => new Date(q.date) <= targetDate);
            matchQuote = priorQuotes[priorQuotes.length - 1];
          }

          const price = matchQuote ? matchQuote.close : pos.buyPrice;
          const posVal = price * pos.quantity;
          const posCost = pos.buyPrice * pos.quantity;

          dayTotalValue += posVal;
          dayTotalInvested += posCost;
        }
      });

      const pnl = Number((dayTotalValue - dayTotalInvested).toFixed(2));
      const pnlPercent = dayTotalInvested > 0 ? Number(((pnl / dayTotalInvested) * 100).toFixed(2)) : 0;

      return {
        date: dateStr,
        totalValue: Number(dayTotalValue.toFixed(2)),
        investedCapital: Number(dayTotalInvested.toFixed(2)),
        pnl,
        pnlPercent,
      };
    });

    // Filter out initial dates before any position was active (totalInvested == 0)
    const activeTimeline = timeline.filter((point) => point.investedCapital > 0);

    res.json(activeTimeline);
  } catch (error) {
    console.error('[Portfolio] GET /history error:', error);
    res.status(500).json({ error: 'Errore durante il calcolo dello storico portafoglio' });
  }
});

// ── POST /api/portfolio ────────────────────────────────────────────────────
// Add a new position to the portfolio
router.post('/', protect, async (req, res) => {
  try {
    const { ticker, buyDate, buyPrice, quantity, name, assetType, notes, targetPrice, stopLoss } = req.body;

    if (!ticker || buyPrice == null || quantity == null) {
      return res.status(400).json({ error: 'Ticker, prezzo di acquisto e quantità sono obbligatori' });
    }

    if (Number(buyPrice) <= 0 || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Prezzo e quantità devono essere maggiori di zero' });
    }

    const cleanTicker = ticker.trim().toUpperCase();
    const finalAssetType = assetType || detectAssetType(cleanTicker);
    let finalName = name ? name.trim() : cleanTicker;

    // Try to fetch short name if not provided
    if (!name) {
      try {
        const q = await yf.quote(normalizeYahooTicker(cleanTicker), { fields: ['shortName', 'longName'] });
        if (q && (q.shortName || q.longName)) {
          finalName = q.shortName || q.longName;
        }
      } catch (e) {}
    }

    const position = await PortfolioPosition.create({
      user: req.user._id,
      ticker: cleanTicker,
      name: finalName,
      assetType: finalAssetType,
      buyDate: buyDate ? new Date(buyDate) : new Date(),
      buyPrice: Number(buyPrice),
      quantity: Number(quantity),
      notes: notes || '',
      targetPrice: targetPrice ? Number(targetPrice) : null,
      stopLoss: stopLoss ? Number(stopLoss) : null,
    });

    res.status(201).json({ success: true, message: 'Posizione aggiunta con successo', position });
  } catch (error) {
    console.error('[Portfolio] POST / error:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio della posizione' });
  }
});

// ── PUT /api/portfolio/:id ─────────────────────────────────────────────────
// Update an existing position
router.put('/:id', protect, async (req, res) => {
  try {
    const position = await PortfolioPosition.findOne({ _id: req.params.id, user: req.user._id });
    if (!position) {
      return res.status(404).json({ error: 'Posizione non trovata o non autorizzato' });
    }

    const { ticker, buyDate, buyPrice, quantity, name, assetType, notes, targetPrice, stopLoss } = req.body;

    if (ticker) position.ticker = ticker.trim().toUpperCase();
    if (buyPrice != null) position.buyPrice = Number(buyPrice);
    if (quantity != null) position.quantity = Number(quantity);
    if (buyDate) position.buyDate = new Date(buyDate);
    if (name !== undefined) position.name = name.trim();
    if (assetType) position.assetType = assetType;
    if (notes !== undefined) position.notes = notes;
    if (targetPrice !== undefined) position.targetPrice = targetPrice ? Number(targetPrice) : null;
    if (stopLoss !== undefined) position.stopLoss = stopLoss ? Number(stopLoss) : null;

    await position.save();

    res.json({ success: true, message: 'Posizione aggiornata con successo', position });
  } catch (error) {
    console.error('[Portfolio] PUT /:id error:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento della posizione' });
  }
});

// ── DELETE /api/portfolio/:id ──────────────────────────────────────────────
// Delete a position
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await PortfolioPosition.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ error: 'Posizione non trovata o non autorizzato' });
    }
    res.json({ success: true, message: 'Posizione eliminata con successo' });
  } catch (error) {
    console.error('[Portfolio] DELETE /:id error:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione della posizione' });
  }
});

// ── POST /api/portfolio/sample ─────────────────────────────────────────────
// Preload a realistic demo portfolio for testing
router.post('/sample', protect, async (req, res) => {
  try {
    // Delete existing positions for user if any
    await PortfolioPosition.deleteMany({ user: req.user._id });

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const samplePositions = [
      {
        user: req.user._id,
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        assetType: 'stock',
        buyDate: new Date(now - 120 * dayMs),
        buyPrice: 112.50,
        quantity: 25,
        notes: 'Target IA e datacenter',
        targetPrice: 160,
        stopLoss: 98,
      },
      {
        user: req.user._id,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        buyDate: new Date(now - 90 * dayMs),
        buyPrice: 195.00,
        quantity: 20,
        notes: 'Posizione core tech dividend',
        targetPrice: 240,
        stopLoss: 175,
      },
      {
        user: req.user._id,
        ticker: 'BTC-USD',
        name: 'Bitcoin USD',
        assetType: 'crypto',
        buyDate: new Date(now - 60 * dayMs),
        buyPrice: 61500,
        quantity: 0.35,
        notes: 'Halving cycle accumulation',
        targetPrice: 85000,
        stopLoss: 52000,
      },
      {
        user: req.user._id,
        ticker: 'GC=F',
        name: 'Gold Futures',
        assetType: 'commodity',
        buyDate: new Date(now - 45 * dayMs),
        buyPrice: 2380.00,
        quantity: 3,
        notes: 'Hedge inflazione e geopolitica',
        targetPrice: 2600,
        stopLoss: 2280,
      },
      {
        user: req.user._id,
        ticker: 'EURUSD=X',
        name: 'EUR/USD Forex',
        assetType: 'forex',
        buyDate: new Date(now - 30 * dayMs),
        buyPrice: 1.0820,
        quantity: 20000,
        notes: 'Carry trade breve termine',
        targetPrice: 1.1050,
        stopLoss: 1.0700,
      },
    ];

    await PortfolioPosition.insertMany(samplePositions);

    res.json({ success: true, message: 'Portafoglio dimostrativo caricato con successo!' });
  } catch (error) {
    console.error('[Portfolio] POST /sample error:', error);
    res.status(500).json({ error: 'Errore durante il caricamento del portafoglio dimostrativo' });
  }
});

module.exports = router;
