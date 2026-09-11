import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Star, SlidersHorizontal, X } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import Sparkline from './Sparkline';
import { SkeletonRow } from './SkeletonLoader';
import InfoTooltip from './InfoTooltip';

// Smart Score ranges for filtering
const SCORE_RANGES = [
 { label:'Tutti', min: 0, max: 100 },
 { label:'Forte Acquisto ≥ 80', min: 80, max: 100 },
 { label:'Acquisto 60-79', min: 60, max: 79 },
 { label:'Mantieni 40-59', min: 40, max: 59 },
 { label:'Vendi < 40', min: 0, max: 39 },
];

const MARKET_LABELS = {
 EQUITY:'📈 Equity',
 CRYPTO:'₿ Crypto',
 FUTURE:'🛢️ Futures',
 FOREX:'💱 Forex',
 CURRENCY:'💱 Forex',
 COMMODITIES:'🛢️ Commodities',
 INDICES:'📊 Indices',
};

const MomentumBar = ({ value }) => {
 const isPositive = value >= 0;
 const absValue = Math.min(Math.abs(value), 5); // Max 5% for visual scaling
 const width = (absValue / 5) * 50; // 50% relative to center

 return (
 <div className="flex items-center justify-center w-24 h-5 relative">
 <div className="absolute left-1/2 w-px h-full bg-slate-700/50 -translate-x-1/2 z-10"/>
 <div className="w-full flex">
 <div className="w-1/2 flex justify-end">
 {!isPositive && (
 <div 
 className="h-1.5 bg-danger rounded-l-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"
 style={{ width:`${width}%`}} 
 />
 )}
 </div>
 <div className="w-1/2 flex justify-start">
 {isPositive && (
 <div 
 className="h-1.5 bg-success rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"
 style={{ width:`${width}%`}} 
 />
 )}
 </div>
 </div>
 </div>
 );
};

const MarketTable = ({ assets = [], loading = false, activeCategory, onCategoryChange }) => {
 const navigate = useNavigate();
 const { toggleWatchlist, isWatched } = useWatchlist();

 // Score Filters (Still relevant for secondary filtering)
 const [scoreFilter, setScoreFilter] = useState(0);

 // Available categories (using fixed list or dynamic)
 const categories = ['EQUITY','FOREX','CRYPTO','COMMODITIES','INDICES'];

 const filteredAssets = useMemo(() => {
 const range = SCORE_RANGES[scoreFilter];
 return assets.filter((a) => {
 return a.smartScore >= range.min && a.smartScore <= range.max;
 });
 }, [assets, scoreFilter]);

 const hasActiveFilters = activeCategory !=='EQUITY' || scoreFilter !== 0;

 const resetFilters = () => {
 onCategoryChange('EQUITY');
 setScoreFilter(0);
 };

 const getSmartScoreColor = (score) => {
 if (score > 70) return'text-success bg-success/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]';
 if (score >= 40) return'text-yellow-400 bg-yellow-400/10';
 return'text-danger bg-danger/10';
 };

 // Removed early return for loading to handle it inside the table body

 return (
 <div className="bg-surface rounded-2xl overflow-hidden shadow-2xl">
 {/* Table Header Filter Bar */}
 <div className="px-6 py-4 bg-background flex flex-wrap gap-4 items-center justify-between">
 <div className="flex flex-wrap gap-1.5">
 {categories.map((cat) => (
 <button
 key={cat}
 onClick={() => onCategoryChange(cat)}
 className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
 activeCategory === cat
 ?'bg-primary text-white shadow-lg shadow-primary/30'
 :'bg-background text-text-secondary hover:text-text'
 }`}
 >
 {MARKET_LABELS[cat] ?? cat}
 </button>
 ))}
 </div>

 <div className="flex flex-wrap gap-1.5">
 {SCORE_RANGES.map((range, i) => (
 <button
 key={range.label}
 onClick={() => setScoreFilter(i)}
 className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-tighter font-black transition-all duration-300 ${
 scoreFilter === i
 ?'bg-surface-hover text-text'
 :'bg-background text-text-secondary hover:text-text'
 }`}
 >
 {range.label}
 </button>
 ))}
 {hasActiveFilters && (
 <button
 onClick={resetFilters}
 className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] uppercase font-bold text-text-secondary hover:text-text bg-surface transition-all"
 >
 <X className="w-3 h-3"/>
 Azzera
 </button>
 )}
 </div>
 </div>

 {/* Table Content */}
 <div className="table-scroll"style={{ WebkitOverflowScrolling:'touch' }}>
 <table className="w-full text-left min-w-[800px]">
 <thead className="bg-surface-hover">
 <tr>
 <th className="p-4 w-10"></th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Asset</th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-right">Prezzo</th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-right">24H %</th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-center">
 Momentum
 <InfoTooltip text="Variazione percentuale dei prezzi negli ultimi 7 giorni"/>
 </th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-center">Trend (7G)</th>
 <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-center">
 Smart Quant
 <InfoTooltip text="Punteggio quantitativo proprietario 0-100 basato su analisi tecnica, fondamentali e stagionalità"/>
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {loading && assets.length === 0 ? (
 // Mostra 8 righe skeleton durante il caricamento iniziale
 [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
 ) : filteredAssets.length === 0 ? (
 <tr>
 <td colSpan="7"className="p-12 text-center text-text-secondary bg-surface-hover/10">
 <div className="flex flex-col items-center gap-2">
 <AlertCircle className="w-8 h-8 opacity-20"/>
 <p className="font-medium">Nessun asset corrispondente ai criteri di ricerca.</p>
 </div>
 </td>
 </tr>
 ) : (
 filteredAssets.map((asset) => (
 <tr
 key={asset.ticker}
 className="hover:bg-primary/5 transition-all group cursor-pointer"
 onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`)}
 >
 <td className="p-4 w-10"onClick={(e) => e.stopPropagation()}>
 <button onClick={() => toggleWatchlist(asset.ticker)} className="focus:outline-none">
 <Star className={`w-4 h-4 transition-all ${isWatched(asset.ticker) ?'fill-yellow-400 text-yellow-400' :'text-slate-600 hover:text-yellow-400'}`} />
 </button>
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center font-black text-[12px] text-text">
 {asset.ticker.substring(0, 1)}
 </div>
 <div>
 <div className="text-sm font-bold tracking-tight text-text group-hover:text-primary transition-colors">{asset.ticker}</div>
 <div className="text-[10px] text-text-secondary uppercase font-black tracking-tighter opacity-60">{asset.settore}</div>
 </div>
 </div>
 </td>
 <td className="p-4 text-right font-mono text-sm text-text font-medium">
 {typeof asset.prezzo ==='number' ?`$${asset.prezzo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`:'---'}
 </td>
 <td className="p-4 text-right">
 <div className={`inline-flex items-center gap-1 font-mono text-sm font-bold ${asset.var1D >= 0 ?'text-success' :'text-danger'}`}>
 {asset.var1D >= 0 ? <ArrowUpRight className="w-3.5 h-3.5"/> : <ArrowDownRight className="w-3.5 h-3.5"/>}
 {Math.abs(asset.var1D).toFixed(2)}%
 </div>
 </td>
 <td className="p-4">
 <div className="flex justify-center">
 <MomentumBar value={asset.momentum || 0} />
 </div>
 </td>
 <td className="p-4">
 <div className="flex justify-center">
 <Sparkline data={asset.sparkline} isPositive={asset.is7DUp} />
 </div>
 </td>
 <td className="p-4 text-center">
 <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all ${getSmartScoreColor(asset.smartScore)}`}>
 {asset.smartScore || 0}
 </span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default MarketTable;
