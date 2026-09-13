import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowDownRight, Star, AlertCircle, 
  X, ChevronRight, Zap, Filter, SlidersHorizontal, 
  Search, ArrowUpDown, TrendingUp, TrendingDown, Target, Lock
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import InfoTooltip from './InfoTooltip';

// Mini Sparkline SVG
const Sparkline = ({ data, isPositive }) => {
  if (!data || data.length < 2) return <div className="h-6 w-20 bg-white/5 rounded-md"></div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 84;
  const height = 26;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${isPositive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${isPositive ? 'pos' : 'neg'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MARKET_LABELS = {
  EQUITY: 'Azioni',
  FOREX: 'Valute FX',
  CRYPTO: 'Criptovalute',
  COMMODITIES: 'Materie Prime',
  INDICES: 'Indici Macro',
  WATCHLIST: '★ Watchlist'
};

const SCORE_RANGES = [
  { label: 'Tutti', min: 0, max: 100 },
  { label: 'Strong Buy (≥80)', min: 80, max: 100 },
  { label: 'Buy (60-79)', min: 60, max: 79 },
  { label: 'Neutral (40-59)', min: 40, max: 59 },
  { label: 'Sell (<40)', min: 0, max: 39 }
];

const MarketTable = ({ assets = [], loading, activeCategory, onCategoryChange }) => {
  const navigate = useNavigate();
  const { effectivePlan } = useAuth();
  const isPro = effectivePlan === 'pro';
  const { isWatched, toggleWatchlist } = useWatchlist();
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState('smartScore'); // 'smartScore', 'var1D', 'prezzo'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc', 'asc'

  const categories = ['EQUITY', 'FOREX', 'CRYPTO', 'COMMODITIES', 'INDICES', 'WATCHLIST'];

  const filteredAndSortedAssets = useMemo(() => {
    let result = [...assets];
    const range = SCORE_RANGES[scoreFilter];
    result = result.filter(a => (a.smartScore || 0) >= range.min && (a.smartScore || 0) <= range.max);

    result.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;
      if (typeof valA === 'string') valA = parseFloat(valA) || 0;
      if (typeof valB === 'string') valB = parseFloat(valB) || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [assets, scoreFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSmartScoreBadge = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'STRONG BUY', glow: 'shadow-emerald-500/20' };
    if (score >= 60) return { bg: 'bg-green-500/10 border-green-500/30 text-green-400', label: 'BUY', glow: 'shadow-green-500/20' };
    if (score >= 40) return { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'NEUTRAL', glow: 'shadow-amber-500/20' };
    if (score >= 25) return { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', label: 'SELL', glow: 'shadow-rose-500/20' };
    return { bg: 'bg-rose-700/10 border-rose-700/30 text-rose-500', label: 'STRONG SELL', glow: 'shadow-rose-700/20' };
  };

  return (
    <div className="bg-gradient-to-b from-surface via-surface to-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
      
      {/* ── Filter Bar Header ─────────────────────────────────────────────── */}
      <div className="p-6 bg-slate-900/60 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Asset Class Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0 ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary/50'
                  : 'bg-black/30 text-text-secondary hover:text-white border border-white/5'
              }`}
            >
              {MARKET_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Quant Score Range Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Filtro Score:
          </span>
          {SCORE_RANGES.map((range, i) => (
            <button
              key={range.label}
              onClick={() => setScoreFilter(i)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all shrink-0 ${
                scoreFilter === i
                  ? 'bg-white/10 text-white border border-white/20 shadow-md'
                  : 'bg-black/20 text-text-secondary hover:text-white border border-white/5'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Content ─────────────────────────────────────────────────── */}
      <div className="table-scroll overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-black/30 border-b border-white/5">
            <tr>
              <th className="p-4 w-12 text-center">★</th>
              <th className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest">
                Strumento / Asset
              </th>
              <th 
                className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-right cursor-pointer hover:text-text"
                onClick={() => handleSort('prezzo')}
              >
                <span className="inline-flex items-center gap-1">
                  Prezzo Live <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th 
                className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-right cursor-pointer hover:text-text"
                onClick={() => handleSort('var1D')}
              >
                <span className="inline-flex items-center gap-1">
                  Var 24H <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center">
                Trend & Sparkline
              </th>
              <th 
                className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center cursor-pointer hover:text-text"
                onClick={() => handleSort('smartScore')}
              >
                <span className="inline-flex items-center gap-1">
                  SmartQuant Score <ArrowUpDown className="w-3 h-3 text-primary" />
                </span>
              </th>
              <th className="p-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center">
                Setup Operativo Rilevato
              </th>
              <th className="p-4 w-12 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 font-medium">
            {loading && assets.length === 0 ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="8" className="p-6 bg-white/[0.01]">
                    <div className="h-8 bg-white/5 rounded-2xl w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredAndSortedAssets.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-16 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-10 h-10 text-text-secondary/30" />
                    <p className="text-sm font-bold">Nessun asset corrispondente ai criteri quantitativi selezionati.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedAssets.map((asset) => {
                const badge = getSmartScoreBadge(asset.smartScore || 0);
                const isPositive = (asset.var1D || 0) >= 0;

                return (
                  <tr
                    key={asset.ticker}
                    onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`, {
                      state: {
                        asset,
                        tvSymbol: asset.tvSymbol || asset.yahooTicker || asset.ticker,
                        category: asset.category
                      }
                    })}
                    className="hover:bg-primary/[0.06] transition-all cursor-pointer group"
                  >
                    {/* Watchlist Star */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => toggleWatchlist(asset.ticker)} 
                        className="focus:outline-none p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Star className={`w-4 h-4 transition-all ${isWatched(asset.ticker) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
                      </button>
                    </td>

                    {/* Asset Name and Ticker */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center font-black text-sm text-white shadow-lg group-hover:border-primary/40 transition-colors">
                          {asset.ticker.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-black tracking-tight text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {asset.ticker}
                          </div>
                          <div className="text-[10px] text-text-secondary uppercase font-mono tracking-wider">
                            {asset.settore || 'EQUITY'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="p-4 text-right font-mono text-sm font-bold text-white">
                      {typeof asset.prezzo === 'number' ? `$${asset.prezzo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '---'}
                    </td>

                    {/* 24H Change */}
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono text-xs font-black px-2 py-1 rounded-lg ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(asset.var1D || 0).toFixed(2)}%
                      </span>
                    </td>

                    {/* Sparkline & Direction */}
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Sparkline data={asset.sparkline} isPositive={isPositive} />
                      </div>
                    </td>

                    {/* SmartQuant Score & Pill */}
                    <td className="p-4 text-center">
                      {isPro ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-md shadow-lg transition-all group-hover:scale-105" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <span className={`text-base font-black font-mono tracking-tighter ${badge.bg.split(' ')[2]}`}>
                            {asset.smartScore || 0}
                          </span>
                          <div className="h-3 w-px bg-white/10" />
                          <span className={`text-[10px] font-black uppercase tracking-wider ${badge.bg.split(' ')[2]}`}>
                            {asset.smartScoreLabel || badge.label}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold" title="SmartQuant riservato al piano PRO">
                          <Lock className="w-3 h-3" />
                          <span>PRO</span>
                        </div>
                      )}
                    </td>

                    {/* Setup Detected */}
                    <td className="p-4 text-center">
                      {isPro ? (
                        asset.tradeSetup?.setupName ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-sm">
                              {asset.tradeSetup.setupName}
                            </span>
                            {asset.tradeSetup?.targetPrice && (
                              <span className="text-[9px] font-mono text-text-secondary mt-0.5">
                                TP: ${asset.tradeSetup.targetPrice}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-secondary uppercase font-mono">Consolidamento</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-indigo-400" /> Riservato
                        </span>
                      )}
                    </td>

                    {/* Action Chevron */}
                    <td className="p-4 text-center text-text-secondary group-hover:text-primary transition-colors">
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketTable;
