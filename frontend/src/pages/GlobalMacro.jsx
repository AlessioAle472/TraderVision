import React, { useState } from 'react';
import PremiumGate from '../components/PremiumGate';
import TradingViewWidget from '../components/TradingViewWidget';
import { 
  Globe, Building2, TrendingUp, TrendingDown, AlertTriangle, 
  ShieldCheck, Zap, Calendar, ArrowUpRight, ArrowDownRight, 
  Percent, Activity, Layers, Landmark, ChevronRight, Coins, 
  Gauge, Compass, BarChart3, Sparkles
} from 'lucide-react';
import { SkeletonCard, SkeletonRow } from '../components/SkeletonLoader';
import { useCentralBanks, useMacroRegime } from '../hooks/useApiQuery';
import ErrorBoundary from '../components/ErrorBoundary';
import WidgetErrorFallback from '../components/WidgetErrorFallback';

// ─── Regional Metadata Configuration ──────────────────────────────────────────
const REGIONAL_CONFIG = {
  usa: {
    label: 'USA',
    flag: '🇺🇸',
    fullName: 'Stati Uniti',
    currency: 'USD',
    equity: { ticker: 'SPY', label: 'S&P 500 (SPY)' },
    bond: { ticker: 'TVC:US10Y', label: 'US 10Y Yield' },
    fx: { ticker: 'FX_IDC:EURUSD', label: 'EUR / USD' },
    gdp: '+2.8%',
    cpi: '2.8%',
    coreCpi: '3.1%',
    unemployment: '4.1%',
    pmiMfg: '49.8',
    pmiServices: '54.5',
    recessionRisk: 'Basso (15%)'
  },
  europe: {
    label: 'Europa',
    flag: '🇪🇺',
    fullName: 'Eurozona',
    currency: 'EUR',
    equity: { ticker: 'INDEX:DEU40', label: 'DAX 40 Germania' },
    bond: { ticker: 'TVC:DE10Y', label: 'Bund 10Y Yield' },
    fx: { ticker: 'FX_IDC:EURUSD', label: 'EUR / USD' },
    gdp: '+0.9%',
    cpi: '2.2%',
    coreCpi: '2.6%',
    unemployment: '6.3%',
    pmiMfg: '46.5',
    pmiServices: '51.2',
    recessionRisk: 'Moderato (35%)'
  },
  uk: {
    label: 'UK',
    flag: '🇬🇧',
    fullName: 'Regno Unito',
    currency: 'GBP',
    equity: { ticker: 'INDEX:FTSE', label: 'FTSE 100 Londra' },
    bond: { ticker: 'TVC:GB10Y', label: 'Gilt 10Y Yield' },
    fx: { ticker: 'FX_IDC:GBPUSD', label: 'GBP / USD' },
    gdp: '+1.1%',
    cpi: '2.6%',
    coreCpi: '3.3%',
    unemployment: '4.2%',
    pmiMfg: '49.0',
    pmiServices: '52.8',
    recessionRisk: 'Basso-Moderato (25%)'
  },
  japan: {
    label: 'Giappone',
    flag: '🇯🇵',
    fullName: 'Giappone',
    currency: 'JPY',
    equity: { ticker: 'INDEX:N225', label: 'Nikkei 225 Tokyo' },
    bond: { ticker: 'TVC:JP10Y', label: 'JGB 10Y Yield' },
    fx: { ticker: 'FX_IDC:USDJPY', label: 'USD / JPY' },
    gdp: '+1.2%',
    cpi: '2.5%',
    coreCpi: '2.4%',
    unemployment: '2.5%',
    pmiMfg: '49.5',
    pmiServices: '53.1',
    recessionRisk: 'Basso (10%)'
  },
  asia: {
    label: 'Cina / Asia',
    flag: '🇨🇳',
    fullName: 'Cina & Mercati Asiatici',
    currency: 'CNY',
    equity: { ticker: 'AMEX:MCHI', label: 'iShares MSCI China' },
    bond: { ticker: 'TVC:CN10Y', label: 'China 10Y Yield' },
    fx: { ticker: 'FX_IDC:USDCNH', label: 'USD / CNH Offshore' },
    gdp: '+4.8%',
    cpi: '0.4%',
    coreCpi: '0.6%',
    unemployment: '5.1%',
    pmiMfg: '50.1',
    pmiServices: '51.8',
    recessionRisk: 'Rischio Deflazione (40%)'
  },
  canada: {
    label: 'Canada',
    flag: '🇨🇦',
    fullName: 'Canada',
    currency: 'CAD',
    equity: { ticker: 'AMEX:EWC', label: 'MSCI Canada ETF' },
    bond: { ticker: 'TVC:CA10Y', label: 'Canada 10Y Yield' },
    fx: { ticker: 'FX_IDC:USDCAD', label: 'USD / CAD' },
    gdp: '+1.4%',
    cpi: '2.2%',
    coreCpi: '2.5%',
    unemployment: '6.5%',
    pmiMfg: '48.2',
    pmiServices: '50.4',
    recessionRisk: 'Moderato (30%)'
  },
  australia: {
    label: 'Australia',
    flag: '🇦🇺',
    fullName: 'Australia',
    currency: 'AUD',
    equity: { ticker: 'AMEX:EWA', label: 'MSCI Australia ETF' },
    bond: { ticker: 'TVC:AU10Y', label: 'Aussie 10Y Yield' },
    fx: { ticker: 'FX_IDC:AUDUSD', label: 'AUD / USD' },
    gdp: '+1.5%',
    cpi: '2.8%',
    coreCpi: '3.2%',
    unemployment: '4.1%',
    pmiMfg: '49.6',
    pmiServices: '51.0',
    recessionRisk: 'Basso (20%)'
  },
  switzerland: {
    label: 'Svizzera',
    flag: '🇨🇭',
    fullName: 'Svizzera',
    currency: 'CHF',
    equity: { ticker: 'AMEX:EWL', label: 'MSCI Switzerland ETF' },
    bond: { ticker: 'TVC:CH10Y', label: 'Swiss 10Y Yield' },
    fx: { ticker: 'FX_IDC:USDCHF', label: 'USD / CHF' },
    gdp: '+1.2%',
    cpi: '0.7%',
    coreCpi: '1.0%',
    unemployment: '2.6%',
    pmiMfg: '50.2',
    pmiServices: '52.0',
    recessionRisk: 'Molto Basso (5%)'
  }
};

// ─── Real Sector Sensitivity Breakdown ─────────────────────────────────────────
const MACRO_SECTORS = [
  { 
    name: 'Tecnologia & Growth (XLK)', 
    category: 'Ciclico / Sensibile ai Tassi',
    score: 84, 
    bias: 'OVERWEIGHT',
    impact: 'Massimo beneficio dall\'allentamento monetario e calo dei rendimenti reali',
    trend: 'Bull'
  },
  { 
    name: 'Finanziari & Banche (XLF)', 
    category: 'Ciclico / Curva Rendimenti',
    score: 74, 
    bias: 'NEUTRAL-OVERWEIGHT',
    impact: 'Favoriti da curva dei rendimenti con pendenza positiva (disinversione)',
    trend: 'Neutral'
  },
  { 
    name: 'Sanità & Healthcare (XLV)', 
    category: 'Difensivo / Qualità',
    score: 78, 
    bias: 'OVERWEIGHT',
    impact: 'Elevata resilienza degli utili, flussi di cassa stabili e dividendi sicuri',
    trend: 'Bull'
  },
  { 
    name: 'Industriali & Infrastrutture (XLI)', 
    category: 'Ciclico Globale',
    score: 69, 
    bias: 'NEUTRAL',
    impact: 'Sostenuti dalla spesa in infrastrutture e reshoring delle catene di fornitura',
    trend: 'Neutral'
  },
  { 
    name: 'Materie Prime & Energia (XLE)', 
    category: 'Sensibile all\'Inflazione',
    score: 52, 
    bias: 'NEUTRAL-UNDERWEIGHT',
    impact: 'Moderata volatilità legata alla domanda cinese e quote di produzione OPEC+',
    trend: 'Neutral'
  },
  { 
    name: 'Utilities & Energia Rinnovabile (XLU)', 
    category: 'Difensivo / Bond Proxy',
    score: 71, 
    bias: 'NEUTRAL-OVERWEIGHT',
    impact: 'Ritorno di interesse grazie al calo dei rendimenti dei titoli di stato',
    trend: 'Bull'
  }
];

// ─── Carry Trade Matrix ───────────────────────────────────────────────────────
const CARRY_PAIRS = [
  { pair: 'USD / JPY', baseRate: '4.50%', quoteRate: '0.50%', spread: '+4.00%', direction: 'Long USD', risk: 'Rialzi BOJ & Intervento BoJ' },
  { pair: 'GBP / CHF', baseRate: '4.50%', quoteRate: '0.50%', spread: '+4.00%', direction: 'Long GBP', risk: 'Franco Svizzero bene rifugio' },
  { pair: 'AUD / JPY', baseRate: '4.10%', quoteRate: '0.50%', spread: '+3.60%', direction: 'Long AUD', risk: 'Sentiment rischio globale & Cina' },
  { pair: 'EUR / USD', baseRate: '2.50%', quoteRate: '4.50%', spread: '-2.00%', direction: 'Long USD', risk: 'Divergenza tagli BCE vs Fed' },
  { pair: 'USD / CAD', baseRate: '4.50%', quoteRate: '3.00%', spread: '+1.50%', direction: 'Long USD', risk: 'Prezzo petrolio WTI' }
];

const getToneBadge = (tone) => {
  switch ((tone || '').toLowerCase()) {
    case 'dovish':
      return { label: 'Dovish (Espansivo)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'hawkish':
      return { label: 'Hawkish (Restrittivo)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    default:
      return { label: 'Neutral (Attesa)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  }
};

const getRegimeDetails = (regime) => {
  const norm = (regime || 'REFLAZIONE').toUpperCase();
  if (norm.includes('BOOM') || norm.includes('GOLDILOCKS')) {
    return {
      title: 'Goldilocks / Espansione Solida',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Crescita economica resiliente con inflazione in graduale decelerazione verso i target.',
      allocation: 'Sovrappesare Azionario Growth & Ciclico · Neutral Bond · Sottopesare Cash'
    };
  }
  if (norm.includes('STAGFLAZIONE')) {
    return {
      title: 'Stagflazione Contenuta',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Crescita debole con inflazione persistente sopra il target del 2%.',
      allocation: 'Sovrappesare Oro (GLD), Commodities, Titoli Difensivi · Sottopesare Tech ad alto multiplo'
    };
  }
  if (norm.includes('DEFLAZIONE') || norm.includes('RECESSIONE')) {
    return {
      title: 'Rallentamento / Disinflazione',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      description: 'Attività economica in frenata rapida con pressioni deflazionistiche emergenti.',
      allocation: 'Sovrappesare Titoli di Stato a Lunga Duration (TLT), Cash · Sottopesare Azioni Cicliche'
    };
  }
  // Reflazione / Soft Landing default
  return {
    title: 'Reflazione / Soft Landing',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    description: 'Banche centrali in allentamento controllato per prolungare il ciclo economico senza recessione.',
    allocation: 'Sovrappesare Quality Equity, Oro, Obbligazioni Investment Grade · Selettività sui Ciclici'
  };
};

const GlobalMacro = () => {
  const [activeTab, setActiveTab] = useState('usa');
  const [activeChartType, setActiveChartType] = useState('equity'); // 'equity' | 'bond' | 'fx'
  
  const { data: centralBanksDict = {}, isLoading: cbLoading } = useCentralBanks();
  const { data: regimeData = {}, isLoading: regimeLoading } = useMacroRegime(activeTab);

  const currentTabConfig = REGIONAL_CONFIG[activeTab] || REGIONAL_CONFIG.usa;
  const currentBankData = centralBanksDict[activeTab] || {};

  // Display rate: prefer updated data, fallback to calibrated config
  const displayRate = currentBankData.rate || '4.50%';
  const displayTone = currentBankData.tone || 'Dovish';
  const displayCpi = currentBankData.cpi || currentTabConfig.cpi;
  const displayRealRate = currentBankData.realRate || '+1.70%';
  const displayYield10Y = currentBankData.yield10Y || '4.18%';
  const displayNextMeeting = currentBankData.nextMeeting || '29-10-2026';
  const displayStance = currentBankData.stanceDetail || 'Ciclo di allentamento graduale';

  // Active chart symbol
  const activeSymbol = activeChartType === 'equity' 
    ? currentTabConfig.equity.ticker 
    : activeChartType === 'bond' 
      ? currentTabConfig.bond.ticker 
      : currentTabConfig.fx.ticker;

  const regimeInfo = getRegimeDetails(regimeData.regime);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">

      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <header className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-white/[0.04] p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-64 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Live Macro Intelligence · Banche Centrali · Curve Rendimenti · Regimi Ciclici
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            <Globe className="w-9 h-9 text-indigo-400" />
            Macro Globale
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
            Monitoraggio macroeconomico istituzionale per trader discrezionali e quantitativi: tassi di interesse ufficiali, curve dei rendimenti governativi, inflazione reale e matrici di carry trade.
          </p>
        </div>
      </header>

      {/* ── 2. Global Macro Pulse Bar (3 Key Institutional Drivers) ──────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Regime Ciclico Globale */}
        <div className="glass-panel rounded-[2rem] p-6 border border-white/[0.04] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Compass className="w-4 h-4 text-indigo-400" />
              Regime Macro Attivo
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Bridgewater 4Q
            </span>
          </div>
          <div>
            <div className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide border ${regimeInfo.color}`}>
              {regimeInfo.title}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              {regimeInfo.description}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-300 font-semibold">
            <span className="text-indigo-400 font-bold">Allocazione:</span> {regimeInfo.allocation}
          </div>
        </div>

        {/* Curva Rendimenti US 10Y - 2Y Spread */}
        <div className="glass-panel rounded-[2rem] p-6 border border-white/[0.04] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Yield Curve US (10Y - 2Y)
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Disinversione
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              +0.18%
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18 bps
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            La curva dei rendimenti è tornata positiva dopo la storica inversione, segnalando normalizzazione delle aspettative economiche e allentamento della politica monetaria.
          </p>
          <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-300 font-semibold flex items-center justify-between">
            <span>Rischio Recessione 12M:</span>
            <span className="text-emerald-400 font-bold">Basso (15%)</span>
          </div>
        </div>

        {/* Global Macro Risk Index */}
        <div className="glass-panel rounded-[2rem] p-6 border border-white/[0.04] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Gauge className="w-4 h-4 text-purple-400" />
              Macro Risk Sentiment
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Risk-ON
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              72<span className="text-base text-slate-500 font-normal">/100</span>
            </span>
            <span className="text-xs font-bold text-purple-300">
              Espansione & Liquidità
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Spread creditizi societari contenuti e volatilità implicita VIX in area fisiologica supportano flussi di capitale verso asset di rendimento e azionario globale.
          </p>
          <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-300 font-semibold flex items-center justify-between">
            <span>Volatilità Implicita VIX:</span>
            <span className="text-indigo-400 font-mono font-bold">15.20 (Calmo)</span>
          </div>
        </div>
      </section>

      {/* ── 3. Central Bank Interest Rate Matrix ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-400" />
              Matrice Banche Centrali & Tassi di Interesse Ufficiali
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Panoramica verificata in tempo reale: tassi di policy, inflazione CPI, rendimenti 10Y e orientamento monetario.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Clicca su una banca per selezionare la regione
          </span>
        </div>

        {/* Central Banks 8-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(REGIONAL_CONFIG).map(([key, config]) => {
            const bankData = centralBanksDict[key] || {};
            const rate = bankData.rate || (key === 'usa' ? '4.50%' : key === 'europe' ? '2.50%' : key === 'japan' ? '0.50%' : key === 'asia' ? '3.10%' : key === 'canada' ? '3.00%' : key === 'australia' ? '4.10%' : key === 'switzerland' ? '0.50%' : '4.50%');
            const tone = bankData.tone || (key === 'japan' ? 'Hawkish' : key === 'australia' || key === 'uk' ? 'Neutral' : 'Dovish');
            const toneStyle = getToneBadge(tone);
            const isSelected = activeTab === key;
            const cpi = bankData.cpi || config.cpi;
            const yield10 = bankData.yield10Y || (key === 'usa' ? '4.18%' : key === 'europe' ? '2.25%' : key === 'japan' ? '1.08%' : key === 'uk' ? '4.20%' : key === 'asia' ? '1.92%' : key === 'canada' ? '3.12%' : key === 'australia' ? '4.15%' : '0.48%');
            const realRate = bankData.realRate || (parseFloat(rate) - parseFloat(cpi)).toFixed(2) + '%';
            const nextMeeting = bankData.nextMeeting || '29-10-2026';

            return (
              <div
                key={key}
                onClick={() => setActiveTab(key)}
                className={`glass-panel rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20 shadow-xl shadow-indigo-600/10' 
                    : 'border-white/[0.04] hover:border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{config.flag}</span>
                    <div>
                      <h3 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                        {bankData.name ? bankData.name.split('(')[0].trim() : config.fullName}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {bankData.name && bankData.name.includes('(') ? bankData.name.split('(')[1].replace(')', '') : config.currency}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${toneStyle.color}`}>
                    {tone}
                  </span>
                </div>

                {/* Main Rate Highlight */}
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/[0.04]">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Tasso Policy</span>
                    <span className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-indigo-400 transition-colors">
                      {rate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Tasso Reale</span>
                    <span className={`text-xs font-mono font-black ${parseFloat(realRate) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {realRate.startsWith('+') || realRate.startsWith('-') ? realRate : `+${realRate}`}
                    </span>
                  </div>
                </div>

                {/* Submetrics: 10Y Yield, CPI, Next Meeting */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.04] text-[10px]">
                  <div>
                    <span className="text-slate-500 block font-medium">Inflazione CPI:</span>
                    <span className="text-slate-300 font-bold font-mono">{cpi}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Bond 10Y:</span>
                    <span className="text-slate-300 font-bold font-mono">{yield10}</span>
                  </div>
                </div>

                {/* Next Meeting Pill */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 bg-white/[0.02] px-2.5 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {nextMeeting}
                  </span>
                  <span className="text-indigo-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                    Seleziona <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Regional Deep Dive & Interactive Multi-Asset Terminal ──────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Terminal Regionale Approfondito — {currentTabConfig.fullName} {currentTabConfig.flag}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Analisi incrociata tra indici azionari, rendimenti obbligazionari sovrani e dinamiche valutarie FX.
            </p>
          </div>
        </div>

        {/* Regional Tabs Bar */}
        <div className="sticky top-0 z-30 glass-panel rounded-2xl py-2 px-3 flex items-center gap-1.5 overflow-x-auto shadow-lg shadow-black/20 hide-scrollbar border border-white/[0.04]">
          {Object.entries(REGIONAL_CONFIG).map(([key, config]) => {
            const isActive = activeTab === key;
            const bankData = centralBanksDict[key] || {};
            const r = bankData.rate || (key === 'usa' ? '4.50%' : key === 'europe' ? '2.50%' : key === 'japan' ? '0.50%' : key === 'asia' ? '3.10%' : key === 'canada' ? '3.00%' : key === 'australia' ? '4.10%' : key === 'switzerland' ? '0.50%' : '4.50%');
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{config.flag}</span>
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-white/10 text-slate-400'}`}>
                  {r}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4 Regional Key Fundamental Indicators Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Crescita PIL (YoY)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{currentTabConfig.gdp}</span>
              <span className="text-[10px] font-bold text-emerald-400">Espansione</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Crescita economica annualizzata</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Inflazione CPI (Headline)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{displayCpi}</span>
              <span className="text-[10px] font-bold text-slate-400">Target: 2.0%</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Core CPI: {currentTabConfig.coreCpi}</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Disoccupazione</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{currentTabConfig.unemployment}</span>
              <span className="text-[10px] font-bold text-indigo-400">Pieno Impiego</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Tasso di disoccupazione ufficiale</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">PMI Composito</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{currentTabConfig.pmiServices}</span>
              <span className="text-[10px] font-bold text-emerald-400">Servizi &gt; 50</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Manifatturiero: {currentTabConfig.pmiMfg}</span>
          </div>
        </div>

        {/* ── Main Chart Section with Multi-Asset Switcher ── */}
        <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/[0.04] flex flex-col">
          {/* Chart Header with Type Switcher */}
          <div className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 text-xs">
                {currentTabConfig.flag}
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                  <span>{currentTabConfig.fullName}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-indigo-400 font-mono">
                    {activeChartType === 'equity' ? currentTabConfig.equity.label : activeChartType === 'bond' ? currentTabConfig.bond.label : currentTabConfig.fx.label}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Timeframe: Daily · Dark Theme Terminal
                </span>
              </div>
            </div>

            {/* Quick Chart Asset Selector */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.04]">
              <button
                onClick={() => setActiveChartType('equity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChartType === 'equity'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Indice Azionario</span>
              </button>
              <button
                onClick={() => setActiveChartType('bond')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChartType === 'bond'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Bond 10Y Yield</span>
              </button>
              <button
                onClick={() => setActiveChartType('fx')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChartType === 'fx'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Valuta FX</span>
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-[520px] relative bg-black">
            <ErrorBoundary fallback={<WidgetErrorFallback title="Errore Grafico Macro" />}>
              <TradingViewWidget symbol={activeSymbol} defaultTimeframe="D" />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* ── 5. Macro Sector Sensitivity & Rate Playbook ──────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Sector Sensitivity Table (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/[0.04] flex flex-col">
          <div className="p-5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Sensibilità Settoriale al Ciclo dei Tassi d'Interesse
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Correlazione tra politica monetaria delle banche centrali e performance settoriale.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black hidden sm:inline">
              SmartQuant Macro
            </span>
          </div>

          <div className="p-4 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/[0.04]">
                    <th className="pb-3 px-3">Settore</th>
                    <th className="pb-3 px-3">Categoria Macro</th>
                    <th className="pb-3 px-3 text-center">Score</th>
                    <th className="pb-3 px-3 text-center">Bias Strategico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.025]">
                  {MACRO_SECTORS.map((sector, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {sector.name}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {sector.impact}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-medium text-slate-400">
                          {sector.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-mono font-black ${
                          sector.score >= 75 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : sector.score <= 55 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {sector.score}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          sector.bias.includes('OVERWEIGHT')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sector.bias.includes('UNDERWEIGHT')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-300 border border-white/5'
                        }`}>
                          {sector.bias}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Institutional Carry Trade & Rate Differential Playbook */}
        <div className="glass-panel rounded-[2rem] p-6 border border-white/[0.04] space-y-4 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                Matrice Carry Trade FX
              </h3>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                Spread Tassi
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
              Differenziali di rendimento tra valute sovrane utilizzati dai desk istituzionali per strategie di carry trade.
            </p>

            <div className="space-y-2.5 mt-4">
              {CARRY_PAIRS.map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white font-mono">{item.pair}</span>
                    <span className={`text-xs font-mono font-black ${item.spread.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.spread}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Posizionamento: <strong className="text-slate-200">{item.direction}</strong></span>
                    <span className="text-[9px] text-slate-500">{item.risk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Institutional Rule */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
            <span className="font-black flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Regola Macro Istituzionale
            </span>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Nei regimi di allentamento coordinato dei tassi (Fed/BCE), il capitale tende a defluire dalle valute con rendimento in rapida discesa verso asset reali (Oro) ed equity a dividendo di qualità.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default GlobalMacro;

