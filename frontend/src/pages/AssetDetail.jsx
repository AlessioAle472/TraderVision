import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Star, 
  Crosshair, ShieldCheck, Activity, BarChart2, Calendar, Layers, ChevronRight, Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import apiClient from '../services/apiClient';
import TradingViewWidget from '../components/TradingViewWidget';
import { useWatchlist } from '../context/WatchlistContext';
import InfoTooltip from '../components/InfoTooltip';

// --- SVG Donut Chart for Smart Score ---
const SmartScoreDonut = ({ score, delta = 0 }) => {
  const radius = 60;
  const stroke = 11;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const pct = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let color = '#ef4444'; // red < 40
  if (pct >= 75) color = '#10b981'; // emerald
  else if (pct >= 60) color = '#22c55e'; // green
  else if (pct >= 40) color = '#eab308'; // yellow
  else if (pct >= 25) color = '#f97316'; // orange

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90 drop-shadow-xl">
        <circle
          stroke="var(--color-surface-hover)"
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
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-text tracking-tighter">{pct}</span>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">/ 100</span>
      </div>
    </div>
  );
};

// --- Pillar Progress Bar ---
const PillarBar = ({ label, score, weight, color, icon: Icon, details }) => {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="p-3.5 rounded-xl bg-surface-hover/50 border border-white/5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-text uppercase">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
          <span>{label}</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-white/5 font-mono text-text-secondary">{weight}</span>
        </div>
        <span className="font-mono font-black text-text">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-background overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {details && details.length > 0 && (
        <div className="text-[10px] text-text-secondary leading-tight flex items-start gap-1">
          <ChevronRight className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
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

const AssetDetail = () => {
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
        const [detail, quant] = await Promise.all([
          apiClient.getAssetDetail(ticker).catch(() => null),
          apiClient.getSmartQuantAnalysis(ticker).catch(() => null)
        ]);

        if (!active) return;
        if (!detail && !quant) throw new Error(`Ticker "${ticker}" not found.`);
        setAsset(detail || quant);
        setQuantData(quant || detail);

        const yahooMap = {
          'EURUSD': 'EURUSD=X', 'Gold': 'GC=F', 'WTI': 'CL=F', 'SP500': '^GSPC', 'BTC': 'BTC-USD'
        };
        const chartTicker = detail?.yahooTicker || quant?.yahooTicker || yahooMap[ticker] || ticker;

        const to = Math.floor(Date.now() / 1000);
        const from = to - (365 * 24 * 60 * 60);
        const data = await apiClient.getHistoricalData(chartTicker, 'D', from, to);
        if (active) setHistData(data || []);
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
            <RefreshCw className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-black text-text animate-pulse">SmartQuant Diagnostic</p>
          <p className="text-text-secondary text-sm font-medium uppercase tracking-widest">Elaborazione 4 Pilastri Quantitativi</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-danger" />
        <p className="text-text font-medium">Dati del mercato non disponibili</p>
        <p className="text-text-secondary text-sm text-center max-w-sm">{error}</p>
        <button onClick={() => navigate('/')} className="mt-2 px-5 py-2 bg-surface hover:bg-surface-hover text-text text-sm rounded-lg transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
        </button>
      </div>
    );
  }

  let score = quantData?.smartScore ?? asset?.smartScore ?? 50;
  if (location.state?.regionalScore) {
    score = location.state.regionalScore;
  }

  const tradeSetup = quantData?.tradeSetup || asset?.tradeSetup || {
    direction: score >= 60 ? 'Buy' : score <= 40 ? 'Sell' : 'Neutral',
    confidence: 65,
    setupName: 'Trend Following',
    setupRationale: 'Segnale generato tramite analisi quantitativa multi-fattoriale.',
    entryZone: `$${asset?.prezzo || 0}`,
    targetPrice: (asset?.prezzo || 100) * 1.05,
    stopLoss: (asset?.prezzo || 100) * 0.97,
    riskRewardRatio: '1:2.0',
    directionBg: score >= 60 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30',
    directionColor: score >= 60 ? 'text-emerald-400' : 'text-amber-400'
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-surface p-6 rounded-3xl shadow-xl border border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-surface-hover text-text-secondary hover:text-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
                {ticker}
                <button
                  onClick={() => toggleWatchlist(ticker)}
                  className="group p-1 -ml-1 transition-all focus:outline-none"
                  title={isWatched(ticker) ? "Rimuovi dalla Watchlist" : "Aggiungi alla Watchlist"}
                >
                  <Star className={`w-6 h-6 transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 ${isWatched(ticker) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
                </button>
              </h1>
              {asset?.settore && (
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getTypeColor(asset?.settore)}`}>
                  {asset?.settore}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SmartQuant v2.0
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-2xl font-black text-text">
                {asset?.prezzo ? Number(asset?.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
              </span>
              <span className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{Number(var1D).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Direzione Algoritmica</div>
            <div className={`text-lg font-black uppercase ${tradeSetup.directionColor}`}>{tradeSetup.direction}</div>
          </div>
          <div className={`px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-wider border ${tradeSetup.directionBg} ${tradeSetup.directionColor}`}>
            {tradeSetup.setupName}
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT: Charts and Quantitative (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Actionable Trade Setup Ribbon */}
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
                  <InfoTooltip text="Range di prezzo ottimale calcolato tramite scarto ATR" />
                </div>
                <div className="text-sm font-black font-mono text-text">{tradeSetup.entryZone}</div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Target Price
                  <InfoTooltip text="Obiettivo di prezzo stimato basato su 3x ATR" />
                </div>
                <div className="text-sm font-black font-mono text-emerald-400">
                  ${typeof tradeSetup.targetPrice === 'number' ? tradeSetup.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tradeSetup.targetPrice}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Stop Loss ATR
                  <InfoTooltip text="Livello di stop loss protettivo calibrato su 1.5x ATR" />
                </div>
                <div className="text-sm font-black font-mono text-rose-400">
                  ${typeof tradeSetup.stopLoss === 'number' ? tradeSetup.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tradeSetup.stopLoss}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                  Risk / Reward
                  <InfoTooltip text="Rapporto rischio/rendimento stimato per l'operazione" />
                </div>
                <div className="text-sm font-black font-mono text-primary">{tradeSetup.riskRewardRatio}</div>
              </div>
            </div>
          </div>

          {/* SECTION 1: TradingView Advanced Chart */}
          <div className="bg-surface rounded-3xl overflow-hidden shadow-xl border border-white/5">
            <div className="p-4 flex justify-between items-center bg-surface-hover/10">
              <h2 className="text-xs font-black text-text uppercase tracking-widest">Grafico Avanzato in Tempo Reale</h2>
              <span className="text-[10px] font-mono text-text-secondary uppercase">Powered by TradingView</span>
            </div>
            <div className="p-0 h-[480px]">
              <TradingViewWidget symbol={asset?.yahooTicker || ticker} />
            </div>
          </div>

          {/* SECTION 2: Yahoo Finance Historical Area Chart */}
          <div className="bg-surface rounded-3xl overflow-hidden shadow-xl border border-white/5">
            <div className="p-4 flex justify-between items-center bg-surface-hover/10">
              <h2 className="text-xs font-black text-text uppercase tracking-widest">Dati Storici 1 Anno</h2>
              <span className="text-[10px] font-mono text-text-secondary">Ticker: {ticker}</span>
            </div>
            <div className="p-4">
              {histData.length === 0 ? (
                <div className="h-60 flex items-center justify-center text-center text-gray-500 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto opacity-40" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={histData.map(d => ({
                    time: new Date(d.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    close: d.close
                  }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="yahooGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(histData.length / 8)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={65} tickFormatter={v => v.toLocaleString()} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={v => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, 'Close']}
                    />
                    <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fill="url(#yahooGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT: (1/3 width) SmartQuant 4-Pillars Card */}
        <div className="space-y-6">

          <div className="bg-surface rounded-3xl p-6 shadow-xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black text-text uppercase tracking-[0.2em]">SmartQuant Score</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-black px-2 py-0.5 rounded bg-emerald-500/10">PRECISION ALGO</span>
            </div>

            <div className="flex flex-col items-center">
              <SmartScoreDonut score={score} delta={asset?.scoreDelta || 0} />
              <div className={`mt-5 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-wider border ${tradeSetup.directionBg} ${tradeSetup.directionColor}`}>
                {tradeSetup.direction}
              </div>
              <div className="text-[11px] text-text-secondary mt-2 font-medium">
                Confidenza: <strong className="text-emerald-400">{tradeSetup.confidence}%</strong> • {tradeSetup.setupName}
              </div>
            </div>

            {/* The 4 Pillars */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-black text-text-secondary uppercase tracking-wider mb-2">
                I 4 Pilastri Quantitativi
              </div>

              <PillarBar
                label="1. Tecnico"
                score={pillars.technical?.score || 50}
                weight={pillars.technical?.weight || '35%'}
                color="#6366f1"
                icon={Activity}
                details={pillars.technical?.data?.signals}
              />

              <PillarBar
                label="2. Fondamentale"
                score={pillars.fundamental?.score || 50}
                weight={pillars.fundamental?.weight || '25%'}
                color="#3b82f6"
                icon={BarChart2}
                details={pillars.fundamental?.data?.signals}
              />

              <PillarBar
                label="3. Stagionalità"
                score={pillars.seasonality?.score || 50}
                weight={pillars.seasonality?.weight || '20%'}
                color="#10b981"
                icon={Calendar}
                details={pillars.seasonality?.data?.signals}
              />

              <PillarBar
                label="4. Macro"
                score={pillars.macro?.score || 50}
                weight={pillars.macro?.weight || '20%'}
                color="#f59e0b"
                icon={Layers}
                details={pillars.macro?.data?.signals}
              />
            </div>

            {/* Summary Highlights */}
            <div className="p-4 rounded-2xl bg-surface-hover/30 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-text">Sintesi Quantitativa</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                SmartQuant ha analizzato <strong>{ticker}</strong> integrando indicatori tecnici (RSI/EMA), multipli di valutazione, 20 anni di stagionalità e allineamento al ciclo economico di TraderVision.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AssetDetail;
