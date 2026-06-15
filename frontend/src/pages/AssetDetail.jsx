import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import apiClient from '../services/apiClient';
import TradingViewWidget from '../components/TradingViewWidget';
import { useWatchlist } from '../context/WatchlistContext';
import InfoTooltip from '../components/InfoTooltip';

// --- SVG Donut Chart for Smart Score ---
const SmartScoreDonut = ({ score }) => {
 const radius = 52;
 const stroke = 10;
 const normalizedRadius = radius - stroke / 2;
 const circumference = normalizedRadius * 2 * Math.PI;
 const pct = Math.max(0, Math.min(100, score));
 const strokeDashoffset = circumference - (pct / 100) * circumference;

 let color = '#ef4444'; // red < 40
 if (pct >= 70) color = '#22c55e'; // green
 else if (pct >= 40) color = '#eab308'; // yellow

 return (
 <div className="relative flex items-center justify-center">
 <svg height={radius * 2} width={radius * 2} className="-rotate-90">
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
 style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
 strokeLinecap="round"
 r={normalizedRadius}
 cx={radius}
 cy={radius}
 />
 </svg>
 <div className="absolute flex flex-col items-center">
 <span className="text-2xl font-bold text-text">{pct}</span>
 <span className="text-xs text-text-secondary">/ 100</span>
 </div>
 </div>
 );
};

// --- Pillar Progress Bar ---
const PillarBar = ({ label, value, max, color }) => {
 const pct = Math.round((value / max) * 100);
 return (
 <div className="space-y-1">
 <div className="flex justify-between text-sm">
 <span className="text-text-secondary">{label}</span>
 <span className="font-semibold text-text">{value} <span className="text-text-secondary/50 font-normal">/ {max}</span></span>
 </div>
 <div className="h-2 rounded-full bg-background overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-700"
 style={{ width:`${pct}%`, background: color }}
 />
 </div>
 </div>
 );
};

// --- Asset type badge color ---
const getTypeColor = (type) => {
 switch (type) {
 case 'EQUITY': return 'text-blue-400 bg-blue-400/10 /20';
 case 'CRYPTOCURRENCY': return 'text-orange-400 bg-orange-400/10 /20';
 case 'FUTURE': return 'text-purple-400 bg-purple-400/10 /20';
 case 'CURRENCY': return 'text-teal-400 bg-teal-400/10 /20';
 case 'INDEX': return 'text-indigo-400 bg-indigo-400/10 /20';
 default: return 'text-gray-400 bg-gray-400/10 /20';
 }
};

const AssetDetail = () => {
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

 // Resolve yahoo ticker for chart - use raw for yahoo chart
 const yahooMap = {
 'EURUSD': 'EURUSD=X', 'Gold': 'GC=F', 'WTI': 'CL=F',
 'SP500': '^GSPC', 'BTC': 'BTC-USD'
 };
 const chartTicker = detail.yahooTicker || yahooMap[ticker] || ticker;

 const to = Math.floor(Date.now() / 1000);
 const from = to - (365 * 24 * 60 * 60);
 const data = await apiClient.getHistoricalData(chartTicker, 'D', from, to);
 if (active) setHistData(data);
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
 <div className="w-16 h-16 rounded-full -primary animate-spin"></div>
 <div className="absolute inset-0 flex items-center justify-center">
 <RefreshCw className="w-6 h-6 text-primary animate-pulse"/>
 </div>
 </div>
 <div className="flex flex-col items-center gap-2">
 <p className="text-xl font-black text-text animate-pulse">Caricamento Asset...</p>
 <p className="text-text-secondary text-sm font-medium uppercase tracking-widest">Recupero dati di mercato</p>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
 <AlertCircle className="w-10 h-10 text-danger"/>
 <p className="text-text font-medium">Dati del mercato non disponibili</p>
 <p className="text-text-secondary text-sm text-center max-w-sm">{error}</p>
 <button onClick={() => navigate('/')} className="mt-2 px-5 py-2 bg-surface hover:bg-surface-hover text-text text-sm rounded-lg transition-colors flex items-center gap-2">
 <ArrowLeft className="w-4 h-4"/> Torna alla Dashboard
 </button>
 </div>
 );
 }

 let score = asset?.smartScore ?? 0;
 // Override from navigation state (used by regional Macro Cards)
 if (location.state?.regionalScore) {
 score = location.state.regionalScore;
 }
 
 const bd = asset?.breakdown ?? { tech_score: 0, seasonality_score: 0, asset_score: 0 };
 const var1D = asset?.var1D ?? 0;
 const isPositive = var1D >= 0;

 let scoreLabel = 'Hold';
 if (score >= 80) scoreLabel = 'Strong Buy';
 else if (score >= 60) scoreLabel = 'Buy';
 else if (score >= 40) scoreLabel = 'Hold';
 else if (score >= 20) scoreLabel = 'Sell';
 else scoreLabel = 'Strong Sell';

 let scoreLabelColor = 'text-yellow-400';
 if (score >= 70) scoreLabelColor = 'text-success';
 else if (score < 40) scoreLabelColor = 'text-danger';

 const donutData = [
 { name: 'Technical', value: bd.tech_score, fill: '#6366f1' },
 { name: 'Seasonality', value: bd.seasonality_score, fill: '#22c55e' },
 { name: 'Asset/Fundamental', value: bd.asset_score, fill: '#f59e0b' },
 { name: 'Remaining', value: Math.max(0, 100 - score), fill: '#1e293b' }
 ];

 return (
 <div className="max-w-7xl mx-auto space-y-6">

 {/* --- Header --- */}
 <div className="flex items-center gap-4">
 <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text transition-colors">
 <ArrowLeft className="w-5 h-5"/>
 </button>
 <div className="flex-1">
 <div className="flex items-center gap-3 flex-wrap">
 <h1 className="text-3xl font-bold text-text tracking-tight flex items-center gap-3">
 {ticker}
 <button
 onClick={() => toggleWatchlist(ticker)}
 className="group p-1 -ml-1 transition-all focus:outline-none"
 title={isWatched(ticker) ?"Rimuovi dalla Watchlist":"Aggiungi alla Watchlist"}
 >
 <Star className={`w-6 h-6 transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 ${isWatched(ticker) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
 </button>
 </h1>
 {asset?.settore && (
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getTypeColor(asset?.settore)}`}>
 {asset?.settore}
 </span>
 )}
 {asset?.offline && (
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger/20 text-danger">
 Offline
 </span>
 )}
 </div>
 <div className="flex items-baseline gap-3 mt-1 flex-wrap">
 <span className="text-2xl font-semibold text-text">
 {asset?.prezzo ? Number(asset?.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
 </span>
 <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
 {isPositive ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
 {isPositive ? '+' : ''}{Number(var1D).toFixed(2)}%
 </span>
 </div>
 </div>
 </div>

 {/* --- Main Content Grid --- */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

 {/* LEFT: Charts and Quantitative (2/3 width) */}
 <div className="xl:col-span-2 space-y-6">
 
 {/* SECTION 1: TradingView Advanced Chart */}
 <div className="bg-surface rounded-2xl overflow-hidden shadow-xl">
 <div className="p-4 flex justify-between items-center">
 <h2 className="text-base font-semibold text-text">Grafico Avanzato in Tempo Reale</h2>
 <span className="text-xs text-gray-500">Powered by TradingView</span>
 </div>
 <div className="p-0 h-[500px]">
 <TradingViewWidget symbol={asset?.yahooTicker || ticker} />
 </div>
 </div>

 {/* SECTION 2: Yahoo Finance Historical Area Chart */}
 <div className="bg-surface rounded-2xl overflow-hidden shadow-xl">
 <div className="p-4 flex justify-between items-center bg-surface-hover/10">
 <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Dati Storici</h2>
 <span className="text-xs text-text-secondary/50">Ticker: {ticker}</span>
 </div>
 <div className="p-4">
 {histData.length === 0 ? (
 <div className="h-64 flex items-center justify-center text-center space-y-2 text-gray-500 text-sm">
 <RefreshCw className="w-5 h-5 animate-spin mx-auto opacity-40"/>
 <p>Caricamento dati storici…</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%"height={260}>
 <AreaChart data={histData.map(d => ({ 
 time: new Date(d.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
 close: d.close 
 }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
 <defs>
 <linearGradient id="yahooGradient"x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor="#94a3b8"stopOpacity={0.15} />
 <stop offset="95%"stopColor="#94a3b8"stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3"stroke="rgba(51,65,85,0.2)"vertical={false} />
 <XAxis dataKey="time"tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(histData.length / 8)} />
 <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={65} tickFormatter={v => v.toLocaleString()} />
 <Tooltip
 contentStyle={{ background: '#0f172a', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
 labelStyle={{ color: '#94a3b8' }}
 itemStyle={{ color: '#f1f5f9' }}
 formatter={v => [Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }), 'Close']}
 />
 <Area type="monotone"dataKey="close"stroke="#94a3b8"strokeWidth={1.5} fill="url(#yahooGradient)"dot={false} />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 {/* SECTION 3: Quantitative Analysis Parameters */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Smart Score Card */}
 <div className="bg-surface rounded-2xl p-6 shadow-xl space-y-1">
 <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 text-center md:text-left">Smart Score Quant</h2>
 <div className="flex items-center justify-between gap-6">
 <SmartScoreDonut score={score} />
 <div className="flex-1 text-right">
 <div className={`text-2xl font-bold ${scoreLabelColor}`}>{scoreLabel}</div>
 <div className="text-xs text-gray-500 mt-1">
 {location.state?.regionalScore 
 ? 'Basato su Divergenza Macro' 
 : 'Basato su Trend tecnico'}
 </div>
 <div className="mt-4 space-y-1">
 {asset?.rsi && asset.rsi !== '-' && (
 <div className="text-sm text-text-secondary">RSI (14D) <span className="text-text font-semibold">{asset?.rsi}</span></div>
 )}
 {asset?.pe && asset.pe !== '-' && (
 <div className="text-sm text-text-secondary">Fwd P/E Ratio <span className="text-text font-semibold">{asset?.pe}</span></div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Score Breakdown Pillars */}
 <div className="bg-surface rounded-2xl p-6 shadow-xl">
 <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5">Analisi Score</h2>
 <div className="space-y-4">
 <PillarBar label="🔬 Pillar 1: Technical Analysis (EMA/Fib)"value={bd.tech_score} max={40} color="#6366f1"/>
 <PillarBar label="🗓️ Pillar 2: Seasonal Trends"value={bd.seasonality_score} max={30} color="#22c55e"/>
 <PillarBar 
 label="💼 Pillar 3: Asset & Macro Context"
 value={bd.asset_score} max={30} color="#f59e0b"
 />
 
 {/* Technical Detail Badges */}
 <div className="mt-6 grid grid-cols-2 gap-3">
 <div className="p-3 rounded-xl bg-surface-hover">
 <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 flex items-center">
 EMA 50 Trend
 <InfoTooltip text="Media Mobile Esponenziale a 50 periodi: indica la direzione del trend"/>
 </div>
 <div className={`text-sm font-bold ${asset?.trend === 'Long' ? 'text-success' : asset?.trend === 'Short' ? 'text-danger' : 'text-text-secondary'}`}>
 {asset?.trend || 'Neutral'}
 </div>
 </div>
 <div className="p-3 rounded-xl bg-surface-hover">
 <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 flex items-center">
 Fib Zone
 <InfoTooltip text="Livelli di ritracciamento di Fibonacci"/>
 </div>
 <div className="text-sm font-bold text-text">
 {asset?.fib_level_touched || 'None'}
 </div>
 </div>
 <div className="p-3 rounded-xl bg-surface-hover">
 <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 flex items-center">
 Volume vs Avg
 <InfoTooltip text="Volume odierno rispetto alla media 20 giorni"/>
 </div>
 <div className={`text-sm font-bold ${asset?.volume_vs_avg > 1 ? 'text-primary' : 'text-text-secondary'}`}>
 {asset?.volume_vs_avg ?`${asset?.volume_vs_avg}x`: '1.0x'}
 </div>
 </div>
 <div className="p-3 rounded-xl bg-surface-hover">
 <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 flex items-center">
 Relative Strength
 <InfoTooltip text="Relative Strength Index (RSI a 14 giorni)"/>
 </div>
 <div className="text-sm font-bold text-text">{asset?.rsi || '--'}</div>
 </div>
 </div>

 {asset?.settore === 'FUTURE' && bd.macro_reason && (
 <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${bd.macro_reason.includes('Safe Haven') ? 'bg-amber-500/10 /25 text-amber-300' : 'bg-surface-hover text-text-secondary'}`}>
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bd.macro_reason.includes('Safe Haven') ? 'bg-amber-400' : 'bg-text-secondary/50'}`} />
 <em className="not-italic leading-snug">{bd.macro_reason}</em>
 </div>
 )}
 </div>
 </div>

 </div>
 </div>

 {/* RIGHT: (1/3 width) Summary / Sidebar Card */}
 <div className="space-y-6">
 <div className="bg-surface rounded-2xl p-6 shadow-xl">
 <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Riepilogo Investimento</h2>
 <p className="text-text-secondary text-sm leading-relaxed">
 Analisi di <strong>{ticker}</strong> tramite il nostro Algoritmo Quantitativo a 3 Pilastri. 
 Il punteggio tecnico attuale è <strong>{bd.tech_score}/40</strong>, valutando il trend EMA 50, i ritracciamenti di Fibonacci a 30 giorni e il momentum del volume.
 Smart Score complessivo di <strong>{score}</strong> suggerisce una visione <strong>{scoreLabel}</strong>.
 </p>
 <div className="mt-6 p-4 rounded-xl bg-surface-hover flex items-center gap-3">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scoreLabelColor} bg-white/5 font-bold text-lg`}>
 {score}
 </div>
 <div className="text-xs text-text-secondary">
 <div className="font-semibold text-text underline decoration-primary underline-offset-4 mb-0.5">Segnale Quant Edge</div>
 Algoritmo: Pillar 1 (Tecnico) Attivo.
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
};

export default AssetDetail;
