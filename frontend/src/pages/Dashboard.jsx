import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketTable from '../components/MarketTable';
import MacroCards from '../components/MacroCards';
import CustomCalendar from '../components/ExperimentalCalendar/CustomCalendar';
import AIMarketBriefing from '../components/AIMarketBriefing';
import GoogleAd from '../components/GoogleAd';
import { useWatchlist } from '../context/WatchlistContext';
import { 
  TrendingUp, TrendingDown, Activity, Shield, RefreshCw, Target, 
  Zap, Crosshair, Sparkles, Compass, ArrowUpRight, ArrowDownRight, 
  Layers, BarChart2, CheckCircle2, ChevronRight, Gauge, Radio
} from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';
import PremiumGate from '../components/PremiumGate';
import { useAuth } from '../context/AuthContext';
import { useDashboardData, useMacroOutlook, useAiBriefing } from '../hooks/useApiQuery';
import ErrorBoundary from '../components/ErrorBoundary';
import WidgetErrorFallback from '../components/WidgetErrorFallback';
import InfoTooltip from '../components/InfoTooltip';

const TAB_CONFIG = {
  EQUITY: [
    'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BRK-B', 'LLY', 'AVGO', 
    'JPM', 'V', 'WMT', 'XOM', 'MA', 'AMD', 'NFLX', 'ORCL', 'PLTR', 'TSM', 
    'ASML', 'BABA', 'NVO', 'RACE', 'COST', 'HD', 'BAC', 'DIS', 'CRM', 'ADBE', 
    'INTC', 'QCOM', 'UBER', 'NOW', 'IBM', 'GS', 'MS', 'MCD', 'NKE', 'PG',
    'KO', 'PEP', 'UNH', 'JNJ', 'ABBV', 'MRK', 'CVX', 'CAT', 'GE', 'BA',
    'SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VUG', 'SMH', 'XLK', 'XLF', 'XLV'
  ],
  FOREX: [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'USDCAD=X', 'AUDUSD=X', 'NZDUSD=X',
    'EURGBP=X', 'EURJPY=X', 'EURCHF=X', 'EURCAD=X', 'EURAUD=X', 'EURNZD=X',
    'GBPJPY=X', 'GBPCHF=X', 'GBPCAD=X', 'GBPAUD=X', 'GBPNZD=X',
    'AUDJPY=X', 'AUDCAD=X', 'AUDCHF=X', 'AUDNZD=X',
    'NZDJPY=X', 'NZDCAD=X', 'NZDCHF=X',
    'CADJPY=X', 'CADCHF=X', 'CHFJPY=X'
  ],
  CRYPTO: [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'LINK-USD', 'AVAX-USD',
    'DOGE-USD', 'DOT-USD', 'NEAR-USD', 'UNI-USD', 'LTC-USD', 'POL-USD', 'TON-USD'
  ],
  COMMODITIES: [
    'GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F', 'PL=F', 'PA=F', 'ALI=F', 'URA', 'DBA', 'DBC', 'GLD', 'SLV', 'USO'
  ],
  INDICES: [
    '^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX', '^GDAXI', '^FCHI', '^FTSE', 'FTSEMIB.MI', '^IBEX', '^STOXX50E',
    '^N225', '^HSI', '000001.SS', '^STI', '^BSESN', '^GSPTSE', '^AS51', '^SSMI', '^OMX', '^OSLO', '^BVSP', '^MXX', '^KS11', 'EEM'
  ]
};

const Dashboard = () => {
  const { watchlist } = useWatchlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('EQUITY');
  const [searchTerm, setSearchTerm] = useState('');

  // Azioni tab is NEVER hijacked by watchlist; Watchlist has its own dedicated tab view!
  const isWatchlistTab = activeCategory === 'WATCHLIST';
  const tickers = isWatchlistTab ? (watchlist && watchlist.length > 0 ? watchlist : ['NVDA', 'AAPL']) : TAB_CONFIG[activeCategory];
  const queryCategory = isWatchlistTab ? null : activeCategory;

  const { data, isLoading: loading, refetch: refetchDashboard } = useDashboardData(tickers, queryCategory);
  const { data: macroData, refetch: refetchMacro } = useMacroOutlook();
  const { data: briefing, isLoading: briefingLoading, refetch: refetchBriefing } = useAiBriefing();

  const handleRefresh = () => {
    refetchDashboard();
    refetchMacro();
    refetchBriefing();
  };

  const assets = data?.assets || [];
  const overview = data?.overview;

  const filteredAssets = assets.filter(asset => {
    const search = (searchTerm || '').toLowerCase();
    const ticker = (asset.ticker || '').toLowerCase();
    const name = (asset.name || '').toLowerCase();
    const matchesSearch = ticker.includes(search) || name.includes(search);
    if (!matchesSearch) return false;

    // Professional Category Precision:
    // Strictly isolate asset classes so Gold, VIX, currencies, and crypto NEVER appear under Azioni!
    if (activeCategory === 'EQUITY') {
      if (asset.category && asset.category !== 'EQUITY') return false;
      const t = (asset.ticker || '').toUpperCase();
      const yt = (asset.yahooTicker || '').toUpperCase();
      const nm = (asset.name || '').toLowerCase();
      // Absolute prohibition of gold, silver, oil, commodities, forex, crypto, or VIX in Azioni
      if (t === 'GC=F' || t === 'SI=F' || t === 'CL=F' || t === 'BZ=F' || t === 'NG=F' || t === 'HG=F' || t === 'PL=F' || t === 'PA=F' || t === 'ALI=F' ||
          t === 'XAUUSD' || t === 'XAGUSD' || t === 'GLD' || t === 'SLV' || t === 'USO' || t === 'URA' || t === 'DBA' || t === 'DBC' || t === 'VIX' || t === '^VIX' ||
          yt.includes('GC=F') || yt.includes('SI=F') || yt.includes('CL=F') || yt.includes('=X') || yt.includes('-USD') ||
          nm.includes('oro spot') || nm.includes('gold spot') || nm === 'oro' || nm === 'gold' || nm.includes('silver spot') || nm.includes('argento spot') || nm.includes('petrolio') || nm.includes('crude oil')) {
        return false;
      }
    } else if (activeCategory === 'FOREX') {
      if (asset.category && asset.category !== 'FOREX') return false;
    } else if (activeCategory === 'CRYPTO') {
      if (asset.category && asset.category !== 'CRYPTO') return false;
    } else if (activeCategory === 'COMMODITIES') {
      if (asset.category && asset.category !== 'COMMODITIES') return false;
    } else if (activeCategory === 'INDICES') {
      if (asset.category && asset.category !== 'INDICES') return false;
    } else if (activeCategory === 'WATCHLIST') {
      // In watchlist tab, show assets that match watched tickers
      if (watchlist && watchlist.length > 0) {
        const isWatched = watchlist.some(w => w.toUpperCase() === (asset.ticker || '').toUpperCase() || w.toUpperCase() === (asset.yahooTicker || '').toUpperCase());
        if (!isWatched) return false;
      }
    }

    return true;
  });

  // Top Ranked Opportunities by SmartQuant Score (bound to currently filtered assets)
  const topQuantPick = useMemo(() => {
    if (!filteredAssets || filteredAssets.length === 0) return null;
    const sorted = [...filteredAssets].sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0));
    return sorted[0];
  }, [filteredAssets]);

  // Market Breadth: Percentage of assets with Bullish/Bearish bias (bound to currently filtered assets)
  const marketSentiment = useMemo(() => {
    if (!filteredAssets || filteredAssets.length === 0) return { bullishPct: 60, bearishPct: 40, neutralCount: 0, bullishCount: 0, bearishCount: 0 };
    const bullish = filteredAssets.filter(a => (a.smartScore || 0) >= 60).length;
    const bearish = filteredAssets.filter(a => (a.smartScore || 0) <= 40).length;
    const neutral = filteredAssets.length - bullish - bearish;
    const bullishPct = filteredAssets.length ? Math.round((bullish / filteredAssets.length) * 100) : 0;
    const bearishPct = filteredAssets.length ? Math.round((bearish / filteredAssets.length) * 100) : 0;
    return { bullishPct, bearishPct, neutralCount: neutral, bullishCount: bullish, bearishCount: bearish };
  }, [filteredAssets]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── 1. Hero Terminal Ribbon ────────────────────────────────────────── */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-surface to-slate-950 p-6 md:p-8 border border-white/10 shadow-2xl overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                QUANT ENGINE LIVE v2.0
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-primary animate-pulse" />
                4-PILLAR PRECISION
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-text tracking-tight flex items-baseline gap-3">
              Terminale Quantitativo
            </h1>
            <p className="text-sm md:text-base text-text-secondary max-w-2xl font-medium leading-relaxed">
              Algoritmo multi-fattoriale istantaneo a 4 pilastri: <strong className="text-text">Tecnico (35%)</strong>, <strong className="text-text">Fondamentale (25%)</strong>, <strong className="text-text">Stagionalità (20%)</strong> e <strong className="text-text">Macro (20%)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Regime Macro Badge */}
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Regime Globale</div>
                <div className="text-lg font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
                  {macroData?.regime || 'ATTESA'}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {macroData?.score || 50}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={handleRefresh}
              className="p-4 rounded-3xl bg-surface-hover hover:bg-primary/20 text-text-secondary hover:text-primary transition-all border border-white/5 shadow-xl group"
              title="Aggiorna tutti i calcoli quantitativi"
              disabled={loading}
            >
              <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin text-primary' : ''} group-hover:rotate-180 transition-transform duration-500`} />
            </button>
          </div>
        </div>

        {/* ── Algorithmic Ticker Ribbon ────────────────────────────────────── */}
        {topQuantPick && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider text-text-secondary">Top Alpha Setup Rilevato: </span>
                <strong className="text-white font-mono text-sm ml-1 cursor-pointer hover:underline" onClick={() => navigate(`/asset/${topQuantPick.ticker}`)}>
                  {topQuantPick.ticker} ({topQuantPick.smartScoreLabel} - {topQuantPick.smartScore} pts)
                </strong>
                <span className="ml-2 text-primary font-medium">[{topQuantPick.tradeSetup?.setupName || 'High-Alpha Breakout'}]</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-secondary font-mono">
              <span>Target: <strong className="text-emerald-400">${topQuantPick.tradeSetup?.targetPrice || '---'}</strong></span>
              <span className="opacity-40">•</span>
              <span>Stop Loss: <strong className="text-rose-400">${topQuantPick.tradeSetup?.stopLoss || '---'}</strong></span>
              <button 
                onClick={() => navigate(`/asset/${topQuantPick.ticker}`)}
                className="ml-3 px-3 py-1 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1 shadow-lg shadow-primary/20"
              >
                Esamina Setup <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Real-time Market HUD (4 Core Cards) ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: S&P 500 Benchmark */}
        <div className="bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/5 group hover:border-primary/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16 text-primary" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">Benchmark Globale</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${overview?.sp500?.isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
              {overview?.sp500?.isUp ? 'BULL' : 'BEAR'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-text tracking-tighter">
              {overview?.sp500?.price ? Number(overview.sp500.price).toLocaleString() : '---'}
            </span>
            <span className="text-xs text-text-secondary uppercase font-bold">SPY</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${overview?.sp500?.isUp ? 'text-success' : 'text-danger'}`}>
            {overview?.sp500?.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {overview?.sp500?.change ? `${overview.sp500.isUp ? '+' : ''}${overview.sp500.change.toFixed(2)}%` : '0.00%'} (24H)
          </div>
        </div>

        {/* Card 2: VIX Fear Index */}
        <div className="bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/5 group hover:border-yellow-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-16 h-16 text-yellow-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">Indice di Paura (VIX)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${overview?.vix?.isScary ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
              {overview?.vix?.isScary ? 'ELEVATO' : 'COMPRESSO'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-text tracking-tighter">
              {overview?.vix?.price ? overview.vix.price.toFixed(2) : '---'}
            </span>
            <span className="text-xs text-text-secondary uppercase font-bold">PTS</span>
          </div>
          <div className="text-xs text-text-secondary font-medium">
            {overview?.vix?.price < 16 ? 'Clima ideale per Risk-On & Long' : overview?.vix?.price > 22 ? 'Volatilità alta: proteggere posizioni' : 'Volatilità nella norma istituzionale'}
          </div>
        </div>

        {/* Card 3: SmartQuant Alpha Signals */}
        <div className="bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/5 group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">Opportunità Alpha</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400">
              SCORE ≥ 65
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-emerald-400 tracking-tighter font-mono">
              {filteredAssets.filter(a => (a.smartScore || 0) >= 65).length}
            </span>
            <span className="text-xs text-text-secondary uppercase font-bold">Setup Attivi</span>
          </div>
          <div className="text-xs text-text-secondary font-medium">
            Segnali con allineamento favorevole dei 4 Pilastri
          </div>
        </div>

        {/* Card 4: Algorithmic Market Breadth */}
        <div className="bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/5 group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Gauge className="w-16 h-16 text-purple-500" />
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">Market Breadth</span>
            <span className="text-[10px] font-mono text-purple-400 font-bold">{marketSentiment.bullishPct}% BULL</span>
          </div>

          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex my-2 border border-white/5">
            <div 
              className="bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${marketSentiment.bullishPct}%` }}
              title={`Bullish: ${marketSentiment.bullishCount}`}
            />
            <div 
              className="bg-rose-500 transition-all duration-1000" 
              style={{ width: `${marketSentiment.bearishPct}%` }}
              title={`Bearish: ${marketSentiment.bearishCount}`}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono font-bold text-text-secondary mt-1">
            <span className="text-emerald-400">{marketSentiment.bullishCount} Long</span>
            <span className="text-text-secondary">{marketSentiment.neutralCount} Hold</span>
            <span className="text-rose-400">{marketSentiment.bearishCount} Short</span>
          </div>
        </div>
      </div>

      {/* ── 3. AI Briefing Section (Master/Admin) ─────────────────────────── */}
      {user?.role === 'admin' && (
        <section className="mb-8">
          <PremiumGate>
            <ErrorBoundary fallback={<WidgetErrorFallback title="AI Market Briefing Error" />}>
              <AIMarketBriefing 
                data={briefing} 
                loading={briefingLoading}
                onSubscribe={() => window.location.href = '/daily-news'} 
              />
            </ErrorBoundary>
          </PremiumGate>
        </section>
      )}

      {/* ── 4. Global Macro Cards ────────────────────────────────────────── */}
      <ErrorBoundary fallback={<WidgetErrorFallback title="Macro Cards Error" />}>
        <MacroCards 
          data={macroData || { regime: 'ATTESA', score: 0, recommendations: { prefer: [], avoid: [] }, trend6m: [], events: [] }} 
          overview={overview} 
        />
      </ErrorBoundary>

      {/* ── 5. Market Scanner & SmartQuant Table ──────────────────────────── */}
      <section className="mb-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" />
              Scanner Multimercato SmartQuant
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              Filtra gli asset per classe e livello di segnale quantitativo. Clicca su un titolo per il breakdown completo dei 4 pilastri.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca asset o ticker..."
                className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary w-48 md:w-64"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <ErrorBoundary fallback={<WidgetErrorFallback title="Market Table Error" />}>
          <MarketTable 
            assets={filteredAssets} 
            loading={loading} 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </ErrorBoundary>
      </section>

      {/* ── 6. Ad Banner ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <GoogleAd />
      </section>

      {/* ── 7. Real-Time Economic Calendar ───────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              Calendario Economico Istituzionale
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              Eventi macro in tempo reale ad alto impatto con dati effettivi (Actuals) sincronizzati.
            </p>
          </div>
        </div>

        <ErrorBoundary fallback={<WidgetErrorFallback title="Custom Calendar Error" />}>
          <CustomCalendar />
        </ErrorBoundary>
      </section>
    </div>
  );
};

export default Dashboard;
