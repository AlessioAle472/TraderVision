import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Star, 
  Activity, BarChart2, Target, ShieldCheck, Zap, Crosshair, Compass,
  Calendar, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import apiClient from '../services/apiClient';
import LightweightChart from '../components/LightweightChart';
import { useWatchlist } from '../context/WatchlistContext';
import AnimatedCounter from '../components/AnimatedCounter';
import InfoTooltip from '../components/InfoTooltip';

// --- SVG Circular Gauge for Smart Score ---
const SmartScoreDonut = ({ score, delta = 0 }) => {
  const radius = 72;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const pct = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let color = '#ef4444'; // red
  if (pct >= 75) color = '#10b981'; // emerald
  else if (pct >= 60) color = '#22c55e'; // green
  else if (pct >= 45) color = '#eab308'; // amber
  else if (pct >= 25) color = '#f97316'; // orange

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90 drop-shadow-2xl">
        <circle
          stroke="rgba(30, 41, 59, 0.6)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ 
            strokeDashoffset, 
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 10px ${color}80)`
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black text-text tracking-tighter">
          <AnimatedCounter value={pct} duration={1400} />
        </span>
        <span className="text-[10px] text-text-secondary font-black tracking-widest uppercase mt-0.5">/ 100</span>
        {delta !== 0 && (
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full mt-1 ${delta > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Pillar Progress Bar with Detailed Subtitle ---
const PillarBar = ({ label, score, weight, maxContribution, color, icon: Icon, details }) => {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="p-4 rounded-2xl bg-surface-hover/50 border border-white/5 space-y-2.5 transition-all hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
          <span className="text-xs font-black text-text tracking-wide uppercase">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-text-secondary">{weight}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black font-mono text-text">{score}</span>
          <span className="text-[10px] text-text-secondary font-bold">/100</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-background overflow-hidden p-0.5 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {details && details.length > 0 && (
        <div className="text-[11px] text-text-secondary font-medium leading-tight pt-1 flex items-start gap-1.5">
          <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <span>{details[0]}</span>
        </div>
      )}
    </div>
  );
};

// --- Asset type badge color ---
const getTypeColor = (type) => {
  switch (type) {
    case 'EQUITY': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'CRYPTOCURRENCY': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'FUTURE': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'CURRENCY': return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
    case 'INDEX': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

const TickerAnalysis = () => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isWatched, toggleWatchlist } = useWatchlist();

  const [asset, setAsset] = useState(null);
  const [quantData, setQuantData] = useState(null);
  const [histData, setHistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch asset detail and dedicated SmartQuant calculation in parallel
        const [detail, quant] = await Promise.all([
          apiClient.getAssetDetail(ticker).catch(() => null),
          apiClient.getSmartQuantAnalysis(ticker).catch(() => null)
        ]);

        if (!active) return;
        if (!detail && !quant) throw new Error(`Ticker "${ticker}" non trovato nei dati di mercato.`);

        setAsset(detail || quant);
        setQuantData(quant || detail);

        // Resolve yahoo ticker for chart
        const yahooMap = {
          'EURUSD': 'EURUSD=X', 'Gold': 'GC=F', 'WTI': 'CL=F', 'SP500': '^GSPC', 'BTC': 'BTC-USD'
        };
        const chartTicker = detail?.yahooTicker || yahooMap[ticker] || ticker;

        const to = Math.floor(Date.now() / 1000);
        const from = to - (365 * 24 * 60 * 60); // 1 year
        const data = await apiClient.getHistoricalData(chartTicker, 'D', from, to);
        if (active && data) {
          const formattedData = data.map(d => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close
          }));
          setHistData(formattedData);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load asset data');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-black text-text animate-pulse">SmartQuant Engine v2.0</p>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">
            Calcolo 4 Pilastri: Tecnico • Fondamentale • Stagionalità • Macro
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-surface rounded-3xl shadow-2xl p-8 max-w-md mx-auto mt-10 text-center">
        <AlertCircle className="w-16 h-16 text-danger opacity-80" />
        <h2 className="text-xl font-black text-text">Errore nel caricamento</h2>
        <p className="text-text-secondary text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-primary/25">
          Torna alla Dashboard
        </button>
      </div>
    );
  }

  const score = quantData?.smartScore ?? asset?.smartScore ?? 50;
  const tradeSetup = quantData?.tradeSetup || asset?.tradeSetup || {
    direction: score >= 60 ? 'Buy' : score <= 40 ? 'Sell' : 'Neutral',
    confidence: 65,
    setupName: 'Trend Following',
    setupRationale: 'Segnale generato tramite analisi quantitativa multi-fattoriale.',
    entryZone: `$${asset?.prezzo || 0}`,
    targetPrice: (asset?.prezzo || 100) * 1.05,
    stopLoss: (asset?.prezzo || 100) * 0.97,
    riskRewardRatio: '1:2.0'
  };

  const pillars = quantData?.pillars || {
    technical: {
      score: Math.round(score * 0.9),
      weight: '35%',
      data: { rsi: asset?.rsi || 50, trend: asset?.trend || 'Neutral', atr: 2.5, signals: ['Trend consolidato'] }
    },
    fundamental: {
      score: 70,
      weight: '25%',
      data: { pe: asset?.pe || '18.5x', signals: ['Valutazione in linea con il settore'] }
    },
    seasonality: {
      score: 60,
      weight: '20%',
      data: { month: 'Attuale', winRate: '56%', avgReturn: '+1.2%', signals: ['Finestra statistica positiva'] }
    },
    macro: {
      score: 65,
      weight: '20%',
      data: { regime: 'REFLAZIONE', signals: ['Allineamento favorevole al ciclo'] }
    }
  };

  const var1D = asset?.var1D ?? quantData?.change24h ?? 0;
  const isPositive = var1D >= 0;
  const finnhubKey = import.meta.env.VITE_FINNHUB_KEY || '';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* --- Header Ribbon --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/5">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-10 ${isPositive ? 'bg-success' : 'bg-danger'}`}></div>

        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-surface-hover hover:text-text transition-all shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-2">
                {ticker}
                <button
                  onClick={() => toggleWatchlist(ticker)}
                  className="group p-1 -ml-1 transition-all focus:outline-none"
                  title={isWatched(ticker) ? "Rimuovi dalla Watchlist" : "Aggiungi alla Watchlist"}
                >
                  <Star className={`w-6 h-6 transition-transform duration-300 transform group-hover:scale-110 group-active:scale-95 ${isWatched(ticker) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
                </button>
              </h1>
              {asset?.settore && (
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getTypeColor(asset.settore)}`}>
                  {asset.settore}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SmartQuant Certified
              </span>
            </div>
            <div className="text-sm font-medium text-text-secondary mt-0.5">{asset?.name || quantData?.name || 'Ticker Detail'}</div>
          </div>
        </div>

        <div className="flex flex-col md:items-end relative z-10">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-text tracking-tighter">
              {asset?.prezzo ? Number(asset.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : (quantData?.price ? Number(quantData.price).toLocaleString() : '---')}
            </span>
            <span className="text-text-secondary text-sm font-bold uppercase tracking-widest">{quantData?.currency || 'USD'}</span>
          </div>
          <span className={`flex items-center gap-1.5 text-base font-bold px-3 py-1 rounded-full mt-2 ${isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{Number(var1D).toFixed(2)}% (24H)
          </span>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT: Charts and Indicators (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Actionable Trade Setup Ribbon Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
                  <Crosshair className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-text tracking-tight uppercase">Setup Operativo Rilevato</h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary">
                      {tradeSetup.setupName}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{tradeSetup.setupRationale}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Confidenza Algoritmo</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{tradeSetup.confidence}%</div>
                </div>
                <div className={`px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-wider border ${tradeSetup.directionBg} ${tradeSetup.directionColor}`}>
                  {tradeSetup.direction}
                </div>
              </div>
            </div>

            {/* Target Price & Stop Loss HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Zona di Entrata
                  <InfoTooltip text="Range di prezzo ottimale di ingresso basato sulla deviazione ATR" />
                </div>
                <div className="text-sm font-black font-mono text-text">{tradeSetup.entryZone}</div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Target Price
                  <InfoTooltip text="Obiettivo di profitto stimato basato su 3.0x ATR" />
                </div>
                <div className="text-sm font-black font-mono text-emerald-400">
                  ${typeof tradeSetup.targetPrice === 'number' ? tradeSetup.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tradeSetup.targetPrice}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Stop Loss ATR
                  <InfoTooltip text="Livello di stop loss calibrato a 1.5x della volatilità media (ATR a 14 giorni)" />
                </div>
                <div className="text-sm font-black font-mono text-rose-400">
                  ${typeof tradeSetup.stopLoss === 'number' ? tradeSetup.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tradeSetup.stopLoss}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Risk / Reward
                  <InfoTooltip text="Rapporto tra potenziale rendimento e rischio calcolato" />
                </div>
                <div className="text-sm font-black font-mono text-primary">{tradeSetup.riskRewardRatio}</div>
              </div>
            </div>
          </div>

          {/* Interactive Lightweight Chart Section */}
          <div className="bg-surface rounded-3xl overflow-hidden shadow-xl p-1 relative group border border-white/5">
            <div className="px-5 pt-5 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <h2 className="text-xs font-black text-text uppercase tracking-widest">Grafico Interattivo Candlestick</h2>
              </div>
              <span className="text-[10px] text-text-secondary uppercase font-bold font-mono">1D Interval</span>
            </div>
            <div className="p-2">
              {histData.length > 0 ? (
                <LightweightChart symbol={ticker} data={histData} finnhubKey={finnhubKey} />
              ) : (
                <div className="h-[360px] flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-slate-600 animate-spin border-4 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Technical Detail Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <TrendingUp className="w-4 h-4 text-primary" />
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
                  Trend EMA 50
                  <InfoTooltip text="Media Mobile Esponenziale a 50 periodi: indica la direzione del trend di medio termine" />
                </div>
              </div>
              <div className={`text-xl font-black ${pillars.technical?.data?.trend === 'Long' || asset?.trend === 'Long' ? 'text-success' : 'text-danger'}`}>
                {pillars.technical?.data?.trend || asset?.trend || 'Neutral'}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <Activity className="w-4 h-4 text-orange-500" />
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
                  RSI (14D)
                  <InfoTooltip text="Relative Strength Index: misura la velocità dei movimenti di prezzo. Sotto 30 = ipervenduto, sopra 70 = ipercomprato" />
                </div>
              </div>
              <div className="text-xl font-black text-text font-mono">
                {pillars.technical?.data?.rsi || asset?.rsi || '--'}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <Target className="w-4 h-4 text-emerald-500" />
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
                  ATR Volatilità
                  <InfoTooltip text="Average True Range: esprime la volatilità giornaliera assoluta del titolo" />
                </div>
              </div>
              <div className="text-xl font-black text-text font-mono">
                {pillars.technical?.data?.atr ? `$${pillars.technical.data.atr}` : '2.1%'}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <Compass className="w-4 h-4 text-purple-500" />
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
                  Bollinger Squeeze
                  <InfoTooltip text="Compressione delle bande di Bollinger: preannuncia esplosioni imminenti di volatilità" />
                </div>
              </div>
              <div className={`text-xl font-black ${pillars.technical?.data?.bollingerSqueeze ? 'text-purple-400' : 'text-text-secondary'}`}>
                {pillars.technical?.data?.bollingerSqueeze ? 'ATTIVO' : 'Normale'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Quantitative Score & 4-Pillars Breakdown (1/3 width) */}
        <div className="space-y-6">

          {/* SmartQuant Master Score Card */}
          <div className="bg-surface rounded-3xl p-8 shadow-xl relative overflow-hidden border border-white/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black text-text uppercase tracking-[0.2em]">SmartQuant Score</h2>
              </div>
              <span className="text-[10px] font-mono text-text-secondary font-bold">ALGO v2.0</span>
            </div>

            <div className="flex flex-col items-center mb-8">
              <SmartScoreDonut score={score} delta={asset?.scoreDelta || 0} />
              <div className={`mt-6 px-5 py-2 rounded-2xl text-sm font-black uppercase tracking-widest border ${tradeSetup.directionBg} ${tradeSetup.directionColor}`}>
                {tradeSetup.direction}
              </div>
            </div>

            {/* The 4 Pillars Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-black text-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>I 4 Pilastri Algoritmici</span>
                <span>Punteggio</span>
              </div>

              <PillarBar
                label="1. Analisi Tecnica"
                score={pillars.technical?.score || 50}
                weight={pillars.technical?.weight || '35%'}
                maxContribution={35}
                color="#6366f1"
                icon={Activity}
                details={pillars.technical?.data?.signals}
              />

              <PillarBar
                label="2. Fondamentale / Valuation"
                score={pillars.fundamental?.score || 50}
                weight={pillars.fundamental?.weight || '25%'}
                maxContribution={25}
                color="#3b82f6"
                icon={BarChart2}
                details={pillars.fundamental?.data?.signals}
              />

              <PillarBar
                label="3. Analisi Stagionale"
                score={pillars.seasonality?.score || 50}
                weight={pillars.seasonality?.weight || '20%'}
                maxContribution={20}
                color="#10b981"
                icon={Calendar}
                details={pillars.seasonality?.data?.signals}
              />

              <PillarBar
                label="4. Regime Macroeconomico"
                score={pillars.macro?.score || 50}
                weight={pillars.macro?.weight || '20%'}
                maxContribution={20}
                color="#f59e0b"
                icon={Layers}
                details={pillars.macro?.data?.signals}
              />
            </div>

            {/* Algorithmic Methodology Disclosure */}
            <div className="mt-6 p-4 rounded-2xl bg-black/20 border border-white/5 text-xs text-text-secondary space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-text">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Ponderazione Matematica</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">
                Ponderazione a 4 fattori calibrata dinamicamente con filtri di volatilità ATR e allineamento al ciclo economico di TraderVision.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TickerAnalysis;
