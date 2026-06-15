import React, { useState, useEffect } from 'react';
import PremiumGate from '../components/PremiumGate';
import TradingViewWidget from '../components/TradingViewWidget';
import { Globe, Building2, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { SkeletonCard, SkeletonRow } from '../components/SkeletonLoader';

import { useCentralBanks, useMacroRegime } from '../hooks/useApiQuery';
import ErrorBoundary from '../components/ErrorBoundary';
import WidgetErrorFallback from '../components/WidgetErrorFallback';

const regionalTabs = {
 usa: { label: 'USA', ticker: 'SPY' },
 europe: { label: 'Europa', ticker: 'VGK' },
 japan: { label: 'Giappone', ticker: 'EWJ' },
 asia: { label: 'Asia (Cina/HK)', ticker: 'MCHI' },
 australia: { label: 'Australia', ticker: 'EWA' },
 canada: { label: 'Canada', ticker: 'EWC' }
};

// Fallback sectors just to keep the UI populated nicely until we build a real sector scraper per region
const fallbackSectors = [
 { name: 'Tecnologia / Export', score: 85, trend: 'Bull' },
 { name: 'Finanza / Banche', score: 72, trend: 'Neutral' },
 { name: 'Materie Prime / Energia', score: 45, trend: 'Bear' }
];

const getToneColor = (tone) => {
 switch (tone) {
 case 'Hawkish': return 'text-rose-400 bg-rose-400/10 /20';
 case 'Dovish': return 'text-emerald-400 bg-emerald-400/10 /20';
 default: return 'text-blue-400 bg-blue-400/10 /20';
 }
};

const getRegimeColor = (regime) => {
 switch (regime) {
 case 'Boom': return 'text-emerald-400';
 case 'Reflazione': return 'text-blue-400';
 case 'Stagflazione': return 'text-amber-400';
 case 'Deflazione': return 'text-rose-400';
 default: return 'text-gray-400';
 }
};

const GlobalMacro = () => {
 const [activeTab, setActiveTab] = useState('usa');
  const { data: centralBanksDict = {}, isLoading: cbLoading } = useCentralBanks();
  const { data: regimeData = {}, isLoading: regimeLoading } = useMacroRegime(activeTab);
  
  const loading = cbLoading || regimeLoading;
  
  const cbData = centralBanksDict[activeTab] || { name: 'Unknown', rate: '0.0%', tone: 'Neutral' };
  const macroData = {
    centralBank: cbData,
    regime: regimeData.regime || 'NEUTRO',
    sectors: fallbackSectors
  };

 const handleTabChange = (key) => {
 if (key === activeTab) return;
 setActiveTab(key);
 };

 const currentTabInfo = regionalTabs[activeTab];

 return (
 <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
 
 {/* Header */}
 <header className="space-y-2">
 <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-gradient">
 <Globe className="w-8 h-8 text-blue-500"/>
 Macro Globale
 </h1>
 <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
 Analisi Tassi, Banche Centrali e Regimi Macroeconomici Internazionali
 </p>
 </header>

 <PremiumGate>
 {/* Tabs */}
 <div className="sticky top-0 z-40 glass-panel rounded-2xl py-3 px-4 flex items-center justify-start gap-2 overflow-x-auto shadow-lg shadow-black/20 hide-scrollbar">
 {Object.entries(regionalTabs).map(([key, tabInfo]) => (
 <button
 key={key}
 onClick={() => handleTabChange(key)}
 className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
 activeTab === key 
 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
 : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
 }`}
 >
 {tabInfo.label}
 </button>
 ))}
 </div>

 {/* Grid Layout */}
 <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
 
 {/* Main Chart Panel (Left, spans 2 cols) */}
 <div className="xl:col-span-2 glass-panel rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
 <div className="p-5 flex justify-between items-center bg-white/[0.02]">
 <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-blue-400"/> 
 Grafico Benchmark ({currentTabInfo.ticker})
 </h2>
 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
 Live Data
 </span>
 </div>
 <div className="flex-1 w-full relative">
 {loading ? (
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="w-10 h-10 /20 -blue-500 rounded-full animate-spin"/>
 </div>
 ) : (
 <ErrorBoundary fallback={<WidgetErrorFallback title="TradingView Error" />}>
 <TradingViewWidget symbol={currentTabInfo.ticker} />
 </ErrorBoundary>
 )}
 </div>
 </div>

 {/* Side Panels (Right, spans 1 col) */}
 <div className="space-y-6 flex flex-col">
 
 {/* Central Bank Card */}
 <div className="glass-panel rounded-[2rem] p-6 shadow-2xl space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
 <Building2 className="w-5 h-5 text-purple-400"/>
 </div>
 <div>
 <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Banca Centrale</h3>
 {loading ? <div className="skeleton w-32 h-4 mt-1"/> : <div className="text-sm font-black text-white">{macroData.centralBank.name}</div>}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 mt-4">
 <div className="bg-white/5 rounded-xl p-4">
 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tasso Attuale</div>
 {loading ? <div className="skeleton w-16 h-6"/> : <div className="text-2xl font-black text-white">{macroData.centralBank.rate}</div>}
 </div>
 <div className="bg-white/5 rounded-xl p-4">
 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Tone</div>
 {loading ? (
 <div className="skeleton w-20 h-6 rounded-lg"/>
 ) : (
 <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getToneColor(macroData.centralBank.tone)}`}>
 {macroData.centralBank.tone}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Macro Regime Card */}
 <div className="glass-panel rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"/>
 <div className="flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
 <ShieldCheck className="w-5 h-5 text-blue-400"/>
 </div>
 <div>
 <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Regime Ciclico</h3>
 {loading ? <div className="skeleton w-24 h-5 mt-1"/> : <div className={`text-lg font-black tracking-tight uppercase ${getRegimeColor(macroData.regime)}`}>{macroData.regime}</div>}
 </div>
 </div>
 <Zap className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors"/>
 </div>
 </div>

 {/* Smart Score Sector Table */}
 <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
 <div className="p-5 bg-white/[0.02]">
 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500"/> Smart Score Settoriale
 </h3>
 </div>
 <div className="p-2 flex-1">
 <table className="w-full text-left">
 <tbody>
 {loading ? (
 [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
 ) : (
 macroData.sectors.map((sector, i) => (
 <tr key={i} className="group hover:bg-white/5 transition-colors last:">
 <td className="px-4 py-3 text-xs font-bold text-gray-300">{sector.name}</td>
 <td className="px-4 py-3 text-right">
 <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
 sector.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
 sector.score <= 40 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
 }`}>
 {sector.score}
 </span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 
 </div>
 </div>
 </PremiumGate>
 </div>
 );
};

export default GlobalMacro;
