import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Star, Activity, BarChart2, Target } from 'lucide-react';
import apiClient from '../services/apiClient';
import LightweightChart from '../components/LightweightChart';
import { useWatchlist } from '../context/WatchlistContext';
import AnimatedCounter from '../components/AnimatedCounter';
import { SkeletonBlock } from '../components/SkeletonLoader';
import InfoTooltip from '../components/InfoTooltip';

// --- SVG Donut Chart for Smart Score ---
const SmartScoreDonut = ({ score }) => {
 const radius = 64;
 const stroke = 12;
 const normalizedRadius = radius - stroke / 2;
 const circumference = normalizedRadius * 2 * Math.PI;
 const pct = Math.max(0, Math.min(100, score));
 const strokeDashoffset = circumference - (pct / 100) * circumference;

 let color ='#ef4444'; // red < 40
 if (pct >= 70) color ='#22c55e'; // green
 else if (pct >= 40) color ='#eab308'; // yellow

 return (
 <div className="relative flex items-center justify-center">
 <svg height={radius * 2} width={radius * 2} className="-rotate-90 drop-shadow-xl">
 <circle
 stroke="rgba(30, 41, 59, 0.5)"
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
 style={{ strokeDashoffset, transition:'stroke-dashoffset 1.5s ease-out' }}
 strokeLinecap="round"
 r={normalizedRadius}
 cx={radius}
 cy={radius}
 />
 </svg>
 <div className="absolute flex flex-col items-center">
 <span className="text-4xl font-black text-text tracking-tighter">
 <AnimatedCounter value={pct} duration={1500} />
 </span>
 <span className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">/ 100</span>
 </div>
 </div>
 );
};

// --- Pillar Progress Bar ---
const PillarBar = ({ label, value, max, color }) => {
 const pct = Math.round((value / max) * 100);
 return (
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs font-bold tracking-wide">
 <span className="text-text-secondary uppercase">{label}</span>
 <span className="text-text">{value} <span className="text-text-secondary/50 font-medium">/ {max}</span></span>
 </div>
 <div className="h-2.5 rounded-full bg-background overflow-hidden shadow-inner">
 <div
 className="h-full rounded-full transition-all duration-1000 ease-out"
 style={{ width:`${pct}%`, background: color }}
 />
 </div>
 </div>
 );
};

// --- Asset type badge color ---
const getTypeColor = (type) => {
 switch (type) {
 case'EQUITY': return'text-blue-400 bg-blue-400/10';
 case'CRYPTOCURRENCY': return'text-orange-400 bg-orange-400/10';
 case'FUTURE': return'text-purple-400 bg-purple-400/10';
 case'CURRENCY': return'text-teal-400 bg-teal-400/10';
 case'INDEX': return'text-indigo-400 bg-indigo-400/10';
 default: return'text-gray-400 bg-gray-400/10';
 }
};

const TickerAnalysis = () => {
 const { ticker } = useParams();
 const navigate = useNavigate();
 const location = useLocation();
 const { isWatched, toggleWatchlist } = useWatchlist();

 const [asset, setAsset] = useState(null);
 const [histData, setHistData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
 let active = true;
 const loadData = async () => {
 setLoading(true);
 setError(null);

 try {
 const detail = await apiClient.getAssetDetail(ticker);
 if (!active) return;
 if (!detail) throw new Error(`Ticker"${ticker}"not found in dashboard data.`);
 setAsset(detail);

 // Resolve yahoo ticker for chart
 const yahooMap = {'EURUSD':'EURUSD=X','Gold':'GC=F','WTI':'CL=F','SP500':'^GSPC','BTC':'BTC-USD'
 };
 const chartTicker = yahooMap[ticker] || ticker;

 const to = Math.floor(Date.now() / 1000);
 const from = to - (365 * 24 * 60 * 60); // 1 year
 const data = await apiClient.getHistoricalData(chartTicker,'D', from, to);
 if (active && data) {
 // Map to Lightweight Charts format
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
 <Activity className="w-6 h-6 text-primary"/>
 </div>
 </div>
 <div className="flex flex-col items-center gap-2">
 <p className="text-xl font-black text-text animate-pulse">Analisi in corso...</p>
 <p className="text-text-secondary text-sm font-medium uppercase tracking-widest">Sincronizzazione dati quantitativi</p>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-surface rounded-3xl shadow-2xl p-8 max-w-md mx-auto mt-10 text-center">
 <AlertCircle className="w-16 h-16 text-danger opacity-80"/>
 <h2 className="text-xl font-black text-text">Errore nel caricamento</h2>
 <p className="text-text-secondary text-sm">{error}</p>
 <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-primary/25">
 Torna alla Dashboard
 </button>
 </div>
 );
 }

 let score = asset?.smartScore ?? 0;
 if (location.state?.regionalScore) {
 score = location.state.regionalScore;
 }
 
 const bd = asset?.breakdown ?? { tech_score: 0, seasonality_score: 0, asset_score: 0 };
 const var1D = asset?.var1D ?? 0;
 const isPositive = var1D >= 0;

 let scoreLabel ='Mantieni';
 if (score >= 80) scoreLabel ='Forte Acquisto';
 else if (score >= 60) scoreLabel ='Acquisto';
 else if (score >= 40) scoreLabel ='Mantieni';
 else if (score >= 20) scoreLabel ='Vendi';
 else scoreLabel ='Forte Vendita';

 let scoreLabelColor ='text-yellow-400';
 if (score >= 70) scoreLabelColor ='text-success';
 else if (score < 40) scoreLabelColor ='text-danger';

 // Finnhub websocket key setup - ideally from env
 const finnhubKey = import.meta.env.VITE_FINNHUB_KEY || '';

 return (
 <div className="max-w-7xl mx-auto space-y-8">

 {/* --- Header --- */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-6 rounded-3xl shadow-xl relative overflow-hidden">
 {/* Glow effect based on trend */}
 <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-10 ${isPositive ?'bg-success' :'bg-danger'}`}></div>
 
 <div className="flex items-center gap-4 relative z-10">
 <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-surface-hover hover:text-text-secondary hover:text-text transition-all shadow-md">
 <ArrowLeft className="w-5 h-5"/>
 </button>
 <div>
 <div className="flex items-center gap-3 flex-wrap">
 <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-2">
 {ticker}
 <button
 onClick={() => toggleWatchlist(ticker)}
 className="group p-1 -ml-1 transition-all focus:outline-none"
 title={isWatched(ticker) ?"Rimuovi dalla Watchlist":"Aggiungi alla Watchlist"}
 >
 <Star className={`w-6 h-6 transition-transform duration-300 transform group-hover:scale-110 group-active:scale-95 ${isWatched(ticker) ?'fill-yellow-400 text-yellow-400' :'text-slate-600 hover:text-yellow-400'}`} />
 </button>
 </h1>
 {asset?.settore && (
 <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getTypeColor(asset.settore)}`}>
 {asset.settore}
 </span>
 )}
 </div>
 <div className="text-sm font-medium text-text-secondary mt-0.5">{asset?.name || 'Ticker Detail'}</div>
 </div>
 </div>
 
 <div className="flex flex-col md:items-end relative z-10">
 <div className="flex items-baseline gap-3">
 <span className="text-4xl font-black text-text tracking-tighter">
 {asset?.prezzo ? Number(asset.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) :'---'}
 </span>
 <span className="text-text-secondary text-sm font-bold uppercase tracking-widest">USD</span>
 </div>
 <span className={`flex items-center gap-1.5 text-base font-bold px-3 py-1 rounded-full mt-2 ${isPositive ?'bg-success/10 text-success' :'bg-danger/10 text-danger'}`}>
 {isPositive ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
 {isPositive ?'+' :''}{Number(var1D).toFixed(2)}% (24H)
 </span>
 </div>
 </div>

 {/* --- Main Content Grid --- */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

 {/* LEFT: Charts and Indicators (2/3 width) */}
 <div className="xl:col-span-2 space-y-6">
 
 {/* Lightweight Chart Section */}
 <div className="bg-surface rounded-3xl overflow-hidden shadow-xl p-1 relative group">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
 <BarChart2 className="w-24 h-24 text-primary"/>
 </div>
 <div className="px-5 pt-5 pb-2 flex justify-between items-center">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
 <h2 className="text-xs font-black text-text uppercase tracking-widest">Grafico Interattivo</h2>
 </div>
 <span className="text-[10px] text-text-secondary uppercase font-bold">1D Interval</span>
 </div>
 <div className="p-2">
 {histData.length > 0 ? (
 <LightweightChart symbol={ticker} data={histData} finnhubKey={finnhubKey} />
 ) : (
 <div className="h-[360px] flex items-center justify-center">
 <RefreshCw className="w-8 h-8 text-slate-600 animate-spin border-4 border-primary border-t-transparent"/>
 </div>
 )}
 </div>
 </div>

 {/* Technical Detail Badges Grid */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between group hover:transition-colors">
 <div className="flex items-center gap-2 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
 <TrendingUp className="w-4 h-4 text-primary"/>
 <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
 Trend EMA 50
 <InfoTooltip text="Media Mobile Esponenziale a 50 periodi: indica la direzione del trend di medio periodo"/>
 </div>
 </div>
 <div className={`text-xl font-black ${asset?.trend ==='Long' ?'text-success' : asset?.trend ==='Short' ?'text-danger' :'text-text-secondary'}`}>
 {asset?.trend || 'Neutral'}
 </div>
 </div>
 <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between group hover:transition-colors">
 <div className="flex items-center gap-2 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
 <Target className="w-4 h-4 text-emerald-500"/>
 <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
 Fibonacci Zone
 <InfoTooltip text="Livelli di ritracciamento di Fibonacci (38.2%, 50%, 61.8%): zone chiave di supporto/resistenza"/>
 </div>
 </div>
 <div className="text-xl font-black text-text">
 {asset?.fib_level_touched || 'None'}
 </div>
 </div>
 <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between group hover:transition-colors">
 <div className="flex items-center gap-2 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
 <BarChart2 className="w-4 h-4 text-purple-500"/>
 <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
 Volume (vs Avg)
 <InfoTooltip text="Volume odierno rispetto alla media 20 giorni: valori >1x indicano interesse crescente"/>
 </div>
 </div>
 <div className={`text-xl font-black ${asset?.volume_vs_avg > 1 ?'text-purple-400' :'text-text-secondary'}`}>
 {asset?.volume_vs_avg ?`${asset.volume_vs_avg}x`:'1.0x'}
 </div>
 </div>
 <div className="bg-surface p-5 rounded-3xl shadow-lg flex flex-col justify-between group hover:transition-colors">
 <div className="flex items-center gap-2 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
 <Activity className="w-4 h-4 text-orange-500"/>
 <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest flex items-center">
 RSI (14D)
 <InfoTooltip text="Relative Strength Index: misura la velocità dei movimenti di prezzo. <30 = ipervenduto, >70 = ipercomprato"/>
 </div>
 </div>
 <div className="text-xl font-black text-text">
 {asset?.rsi || '--'}
 </div>
 </div>
 </div>
 </div>

 {/* RIGHT: Quantitative Score (1/3 width) */}
 <div className="space-y-6">
 
 <div className="bg-surface rounded-3xl p-8 shadow-xl relative overflow-hidden">
 <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
 
 <h2 className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] mb-8 text-center">Smart Quant Score</h2>
 
 <div className="flex flex-col items-center mb-8">
 <SmartScoreDonut score={score} />
 <div className={`mt-6 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest ${scoreLabelColor} ${scoreLabelColor.replace('text-','bg-')}/10 ${scoreLabelColor.replace('text-','-')}/20`}>
 {scoreLabel}
 </div>
 </div>

 <div className="space-y-6 pt-6">
 <PillarBar label="1. Tecnico (EMA/Fib)"value={bd.tech_score} max={40} color="#6366f1"/>
 <PillarBar label="2. Stagionalità"value={bd.seasonality_score} max={30} color="#22c55e"/>
 <PillarBar label="3. Asset & Macro"value={bd.asset_score} max={30} color="#f59e0b"/>
 </div>

 {asset?.settore ==='FUTURE' && bd.macro_reason && (
 <div className={`mt-8 flex items-start gap-3 p-4 rounded-xl text-xs ${bd.macro_reason.includes('Safe Haven') ?'bg-amber-500/10 text-amber-300' :'bg-surface-hover text-text-secondary'}`}>
 <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${bd.macro_reason.includes('Safe Haven') ?'text-amber-400' :'text-text-secondary/50'}`} />
 <p className="leading-relaxed font-medium italic">{bd.macro_reason}</p>
 </div>
 )}
 </div>
 
 </div>

 </div>
 </div>
 );
};

export default TickerAnalysis;
