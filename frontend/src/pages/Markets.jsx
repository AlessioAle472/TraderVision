import React, { useState, useRef } from 'react';
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
import Sparkline from '../components/Sparkline';
import { SkeletonCard, SkeletonRow } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useMarkets } from '../hooks/useApiQuery';
import ErrorBoundary from '../components/ErrorBoundary';
import WidgetErrorFallback from '../components/WidgetErrorFallback';

// Import extracted components
import AIInsightInline from '../components/ai/AIInsightInline';
import CryptoDivergenceInsights from '../components/ai/CryptoDivergenceInsights';
import MacroAlertBanner from '../components/ai/MacroAlertBanner';
import GlobalCapitalFlowBox from '../components/ai/GlobalCapitalFlowBox';

const Markets = () => {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('usa');
 const [searchTerm, setSearchTerm] = useState('');
 const stickyHeaderRef = useRef(null);

 const { data, isLoading: loading } = useMarkets();

 const sections = data?.sections || {};
 const currentAssets = sections[activeTab]?.assets || [];
 const heroAssets = sections.usa?.assets?.slice(0, 3) || [];

 const isInitialLoad = loading && !sections.usa;

 return (
 <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
 {/* Header */}
 <header className="space-y-2">
 <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-gradient">
 <Globe className="w-8 h-8 text-blue-500"/>
 Panoramica del Mercato
 </h1>
 <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Terminal — Cross-Asset Performance & Quant Signals</p>
 </header>
 
 {/* Global Macro Alert Banner */}
 <ErrorBoundary fallback={<WidgetErrorFallback title="Macro Alert Error" />}>
 <MacroAlertBanner />
 </ErrorBoundary>

 {/* Hero Cards Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {isInitialLoad ? (
 <>
 <SkeletonHeroCard />
 <SkeletonHeroCard />
 <SkeletonHeroCard />
 </>
 ) : (
 heroAssets.map((asset, i) => (
 <HeroCard key={asset.ticker} asset={asset} index={i} />
 ))
 )}
 </div>

 {/* Factors & Sectors Bar Grid */}
 <section className="space-y-6">
 <div className="flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-indigo-500"/>
 <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Relative Strength Factors</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
 {isInitialLoad ? (
 [...Array(5)].map((_, i) => (
 <div key={i} className="bg-white/[0.02] rounded-2xl p-4 space-y-3">
 <div className="skeleton w-20 h-3"/>
 <div className="skeleton w-full h-1.5 rounded-full"/>
 </div>
 ))
 ) : (
 data?.factors?.map((factor) => (
 <FactorBar key={factor.name} factor={factor} />
 ))
 )}
 </div>
 </section>

 {/* Global Capital Flow AI Engine */}
 <ErrorBoundary fallback={<WidgetErrorFallback title="Global Capital Flow Error" />}>
 <GlobalCapitalFlowBox />
 </ErrorBoundary>

 {/* Main Table Section */}
 <section className="space-y-6">
 <div 
 ref={stickyHeaderRef}
 className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20 py-4 -mx-4 px-4 flex items-center justify-between transition-all duration-300"
 >
 <div className="flex gap-2">
 {Object.entries(sections).map(([key, section]) => (
 <button
 key={key}
 onClick={() => setActiveTab(key)}
 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
 activeTab === key 
 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
 : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
 }`}
 >
 {section.label}
 </button>
 ))}
 </div>
 <div className="hidden md:flex items-center gap-4">
 <div className="relative">
 <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2"/>
 <input 
 type="text"
 placeholder="Cerca asset..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="bg-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus: focus:/50 transition-all w-48"
 />
 </div>
 <button className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
 <Filter className="w-4 h-4"/>
 </button>
 </div>
 </div>

 {activeTab === 'crypto' && (
   <ErrorBoundary fallback={<WidgetErrorFallback title="Crypto Insights Error" />}>
     <CryptoDivergenceInsights />
   </ErrorBoundary>
 )}

 <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
 <div className="table-scroll">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-white/[0.02]">
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
 {isInitialLoad ? (
 [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
 ) : (
 currentAssets.filter(a => (a.ticker || '').toLowerCase().includes(searchTerm.toLowerCase())).map((asset) => (
 <tr 
 key={asset.ticker}
 onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`)}
 className="group hover:bg-white/[0.04] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 relative z-10"
 >
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-black text-white shadow-xl">
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
 {asset.momentum >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
 {Math.abs(asset.momentum)}
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex justify-center">
 <SmartBadge score={asset.smartScore} label={asset.smartScoreLabel} />
 </div>
 </td>
 <td className="px-8 py-6 text-right pr-12">
 <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all"/>
 </td>
 </tr>
 ))
 )}
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
 <div className="glass-panel rounded-[2.2rem] p-8 relative overflow-hidden group hover:shadow-blue-500/20 transition-all duration-500">
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
 {isPositive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
 {Math.abs(asset.var1D)}%
 </span>
 </div>
 </div>
 <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${getScoreStyle(asset.smartScore).bgLight} ${getScoreStyle(asset.smartScore).text}`}>
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
 strokeWidth="12"
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
 <text x="50" y="55" textAnchor="middle" className="text-2xl font-black fill-white" dy=".3em">
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
 style={{ backgroundColor: bg }}
 >
 {isPos ? '+' : ''}{value}%
 </div>
 </td>
 );
};

const SmartBadge = ({ score, label }) => {
 const styles = getScoreStyle(score);
 
 return (
 <div className={`relative flex items-center justify-center p-0.5 rounded-xl shadow-lg ${styles.bgLight} overflow-hidden group/badge`}>
 {/* Neon Glow */}
 <div className={`absolute inset-0 blur-md opacity-20 ${styles.bg}`} />
 
 <div className="relative z-10 px-3 py-1 flex items-center gap-3">
 <span className={`text-sm font-black tracking-tighter text-white`}>
 {score}
 </span>
 <div className="w-px h-3 bg-white/10"/>
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
 <div className="bg-white/[0.02] rounded-2xl p-4 space-y-3 hover:bg-white/[0.04] transition-colors group shadow-lg shadow-black/10">
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
  if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-600', bgLight: 'bg-emerald-600/10' };
  if (score >= 60) return { text: 'text-green-400', bg: 'bg-green-500', bgLight: 'bg-green-500/10' };
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10' };
  if (score >= 20) return { text: 'text-rose-400', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10' };
  return { text: 'text-rose-600', bg: 'bg-rose-700', bgLight: 'bg-rose-700/10' };
};

const SkeletonHeroCard = () => (
 <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.2rem] p-8 relative overflow-hidden shadow-2xl">
 <div className="flex flex-col gap-8">
 <div className="flex justify-between items-start">
 <div className="space-y-3">
 <div className="skeleton w-16 h-3"/>
 <div className="skeleton w-32 h-8"/>
 </div>
 <div className="skeleton w-20 h-6 rounded-lg"/>
 </div>
 <div className="flex items-center gap-6">
 <div className="skeleton w-20 h-20 rounded-full"/>
 <div className="flex-grow space-y-3">
 <div className="skeleton w-full h-1 rounded-full"/>
 <div className="skeleton w-3/4 h-3"/>
 </div>
 </div>
 </div>
 </div>
);

export default Markets;
