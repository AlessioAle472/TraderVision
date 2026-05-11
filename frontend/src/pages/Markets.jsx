import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity, 
  Globe, 
  Zap, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Filter,
  BarChart3,
  Waves,
  Coins,
  Cpu,
  Loader2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../services/apiClient';
import Sparkline from '../components/Sparkline';
import PremiumGate from '../components/PremiumGate';

const Markets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ sections: {}, factors: [] });
  const [activeTab, setActiveTab] = useState('usa');
  const stickyHeaderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getMarketsData();
        setData(res);
      } catch (err) {
        console.error('Failed to fetch markets data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sections = data.sections || {};
  const currentAssets = sections[activeTab]?.assets || [];
  const heroAssets = sections.usa?.assets?.slice(0, 3) || [];

  if (loading && !data.sections.usa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Synchronizing Market Pulse…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-500" />
          Panoramica del Mercato
        </h1>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Terminal — Cross-Asset Performance & Quant Signals</p>
      </header>
      
      {/* Global Macro Alert Banner */}
      <MacroAlertBanner />

      {/* Hero Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {heroAssets.map((asset, i) => (
          <HeroCard key={asset.ticker} asset={asset} index={i} />
        ))}
      </div>

      {/* Factors & Sectors Bar Grid */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Relative Strength Factors</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.factors.map((factor) => (
                <FactorBar key={factor.name} factor={factor} />
            ))}
        </div>
      </section>

      {/* Global Capital Flow AI Engine */}
      <GlobalCapitalFlowBox />

      {/* Main Table Section */}
      <section className="space-y-6">
        <div 
          ref={stickyHeaderRef}
          className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-y border-white/5 py-4 -mx-4 px-4 flex items-center justify-between transition-all duration-300"
        >
          <div className="flex gap-2">
            {Object.entries(sections).map(([key, section]) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === key 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 text-gray-500 hover:text-white border border-white/5 hover:border-white/10'
                    }`}
                >
                    {section.label}
                </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                  <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Cerca asset..." 
                    className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all w-48"
                  />
              </div>
              <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
              </button>
          </div>
        </div>

        {activeTab === 'crypto' && <CryptoDivergenceInsights />}

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Prezzo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Trend (7G)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">1G %</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">1S %</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">1M %</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Momentum</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Smart Quant</th>
                  <th className="px-8 py-5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {currentAssets.map((asset) => (
                  <tr 
                    key={asset.ticker}
                    onClick={() => navigate(`/ticker/${encodeURIComponent(asset.yahooTicker)}`)}
                    className="group hover:bg-white/[0.04] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 relative z-10"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-white shadow-xl">
                          {asset.ticker.charAt(0)}
                        </div>
                        <div className="space-y-0.5 relative">
                          <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{asset.ticker}</div>
                          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Liquid Asset</div>
                          {asset.smartScore >= 80 && <AIInsightInline ticker={asset.yahooTicker} price={asset.price} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-sm font-black text-white tracking-tight font-mono">
                        {asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-8 py-6 w-32">
                        <div className="h-8 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                            <Sparkline data={asset.sparkline} isPositive={asset.var1D >= 0} />
                        </div>
                    </td>
                    <HeatMapCell value={asset.var1D} />
                    <HeatMapCell value={asset.var1W} />
                    <HeatMapCell value={asset.var1M} />
                    <td className="px-8 py-6 text-center">
                       <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${asset.momentum >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          {asset.momentum >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(asset.momentum)}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        <SmartBadge score={asset.smartScore} label={asset.smartScoreLabel} />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right pr-12">
                      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

/* Sub-components */

const HeroCard = ({ asset, index }) => {
  const isPositive = asset.var1D >= 0;
  
  return (
    <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.2rem] p-8 relative overflow-hidden group shadow-2xl hover:border-white/10 transition-all duration-500">
      {/* Background Sparkline Gradient */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
         <Sparkline data={asset.sparkline} isPositive={isPositive} />
      </div>
      
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{asset.ticker}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tighter">
                        {asset.price.toLocaleString()}
                    </span>
                    <span className={`text-xs font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(asset.var1D)}%
                    </span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border ${getScoreStyle(asset.smartScore).border} ${getScoreStyle(asset.smartScore).text}`}>
                {asset.smartScoreLabel}
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="relative h-20 w-20">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle 
                        className="text-white/5" 
                        strokeWidth="10" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                    />
                    <circle 
                        className={getScoreStyle(asset.smartScore).text} 
                        strokeWidth="10" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (asset.smartScore / 100) * 251.2}
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                        transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="55" textAnchor="middle" className="text-lg font-black fill-white" dy=".3em">
                        {asset.smartScore}
                    </text>
                </svg>
            </div>
            <div className="flex-grow space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">
                        <span>Signal strength</span>
                        <span>{asset.smartScore}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getScoreStyle(asset.smartScore).bg}`} 
                            style={{ width: `${asset.smartScore}%` }}
                        />
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    Quantitative analysis identifies a structural {asset.smartScoreLabel.toLowerCase()} bias for {asset.ticker}.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

const HeatMapCell = ({ value }) => {
  const isPos = value >= 0;
  const absVal = Math.abs(value);
  
  // Calculate opacity based on magnitude (cap at 2%)
  const magnitude = Math.min(absVal / 2, 1);
  const opacity = 0.05 + (magnitude * 0.2);
  
  const bg = isPos 
    ? `rgba(16, 185, 129, ${opacity})` 
    : `rgba(244, 63, 94, ${opacity})`;
  
  const text = isPos ? 'text-emerald-400' : 'text-rose-400';
  
  return (
    <td className="px-8 py-6 text-center">
      <div 
        className={`inline-block px-4 py-2 rounded-xl text-xs font-mono font-black ${text} transition-all duration-300 group-hover:scale-105`}
        style={{ backgroundColor: bg, border: `1px solid ${isPos ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}` }}
      >
        {isPos ? '+' : ''}{value}%
      </div>
    </td>
  );
};

const SmartBadge = ({ score, label }) => {
  const styles = getScoreStyle(score);
  
  return (
    <div className={`relative flex items-center justify-center p-0.5 rounded-xl shadow-lg border ${styles.border} ${styles.bgLight} overflow-hidden group/badge`}>
        {/* Neon Glow */}
        <div className={`absolute inset-0 blur-md opacity-20 ${styles.bg}`} />
        
        <div className="relative z-10 px-3 py-1 flex items-center gap-3">
            <span className={`text-sm font-black tracking-tighter text-white`}>
                {score}
            </span>
            <div className="w-px h-3 bg-white/10" />
            <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>
                {label}
            </span>
        </div>
    </div>
  );
};

const FactorBar = ({ factor }) => {
    // Relative strength: 0 is extreme weakness (left), 100 is extreme strength (right)
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 hover:bg-white/[0.04] transition-colors group">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">{factor.name}</span>
                <span className={`text-[10px] font-black ${factor.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {factor.change >= 0 ? '+' : ''}{factor.change}%
                </span>
            </div>
            
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Horizontal Bar starting from center (50%) */}
                <div 
                    className={`absolute inset-y-0 h-full transition-all duration-1000 ease-out z-10 ${factor.value >= 50 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                    style={{ 
                        left: factor.value >= 50 ? '50%' : `${factor.value}%`,
                        width: `${Math.abs(factor.value - 50)}%`
                    }}
                />
            </div>
        </div>
    );
};

const getScoreStyle = (score) => {
  if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-600', bgLight: 'bg-emerald-600/10', border: 'border-emerald-600/20' };
  if (score >= 60) return { text: 'text-green-400', bg: 'bg-green-500', bgLight: 'bg-green-500/10', border: 'border-green-500/20' };
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', border: 'border-amber-500/20' };
  if (score >= 20) return { text: 'text-rose-400', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', border: 'border-rose-500/20' };
  return { text: 'text-rose-600', bg: 'bg-rose-700', bgLight: 'bg-rose-700/10', border: 'border-rose-700/20' };
};

const AIInsightInline = ({ ticker, price }) => {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchInsight = async (e) => {
        e.stopPropagation();
        if (insight) return;
        setLoading(true);
        try {
            const res = await apiClient.getInsight(ticker, price);
            setInsight(res.insight);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {!insight && !loading && (
                <button 
                  onClick={fetchInsight}
                  className="flex items-center gap-1.5 text-[9px] text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md font-bold uppercase transition-all duration-300 pointer-events-auto"
                >
                    <Sparkles className="w-3 h-3" /> Quick Insight AI
                </button>
            )}
            {loading && <div className="text-[9px] text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Elaborazione...</div>}
            {insight && (
                <div className="text-[10px] text-amber-100 bg-amber-900/40 p-2 rounded-lg border border-amber-500/20 mt-1 max-w-[200px] leading-snug animate-in fade-in slide-in-from-top-1 pointer-events-auto shadow-xl">
                    <span className="font-bold text-amber-500 flex items-center gap-1 mb-0.5"><Sparkles className="w-3 h-3" /> AI Insight</span>
                    {insight}
                </div>
            )}
        </div>
    );
};

const CryptoDivergenceInsights = () => {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDivergence = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getCryptoDivergence();
            setInsight(res.insight);
        } catch (err) {
            console.error('Failed to fetch crypto divergence', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-6 mb-6 shadow-2xl relative overflow-hidden group">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <PremiumGate>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tighter">
                            <Sparkles className="w-4 h-4 text-emerald-400" /> AI Crypto Divergence
                        </h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Analisi strutturale Bitcoin vs Altcoin Dominance
                        </p>
                    </div>

                    {!insight && !loading && (
                        <button 
                            onClick={fetchDivergence}
                            className="px-4 py-2 bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg"
                        >
                            Analizza Divergenza Altcoin
                        </button>
                    )}

                    {loading && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                            <Loader2 className="w-3 h-3 animate-spin" /> Elaborazione modello quantitativo...
                        </div>
                    )}
                </div>

                {insight && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-sm font-medium text-gray-300 leading-relaxed animate-in fade-in slide-in-from-top-2">
                        {insight}
                    </div>
                )}
            </PremiumGate>
        </div>
    );
};

const MacroAlertBanner = () => {
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const checkAlert = async () => {
            try {
                const res = await apiClient.getStagflationAlert();
                if (res && res.insight) {
                    setAlert(res.insight);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkAlert();
    }, []);

    if (!alert) return null;

    return (
        <div className="bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.1)] flex gap-4 items-start animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[60px] rounded-full pointer-events-none" />
            
            <PremiumGate>
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-rose-500/20 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>
                    
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-sm font-black text-rose-400 capitalize tracking-wide flex items-center gap-2">
                            Alert Macroeconomico Rilevato
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-medium">
                            {alert}
                        </p>
                    </div>
                </div>
            </PremiumGate>
        </div>
    );
};

const GlobalCapitalFlowBox = () => {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchFlow = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getCapitalFlow();
            setInsight(res.insight);
        } catch (err) {
            console.error('Failed to fetch global capital flow', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-50" />
            
            <PremiumGate>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                            <Globe className="w-6 h-6 text-blue-400" />
                            Global Capital Flow Engine
                        </h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                            Tracking liquidità istituzionale tra Economie Sviluppate ed Emergenti
                        </p>
                    </div>

                    {!insight && !loading && (
                        <button 
                            onClick={fetchFlow}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            Analizza Macro Flussi
                        </button>
                    )}

                    {loading && (
                        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-400">
                            <Loader2 className="w-4 h-4 animate-spin" /> Elaborazione Aggregati...
                        </div>
                    )}
                </div>

                {insight && (
                    <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                        <div 
                            className="text-sm font-medium text-gray-300 leading-relaxed space-y-2 animate-in fade-in slide-in-from-top-4"
                            dangerouslySetInnerHTML={{ __html: insight }}
                        />
                    </div>
                )}
            </PremiumGate>
        </div>
    );
};

export default Markets;
