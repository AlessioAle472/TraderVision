import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Star, SlidersHorizontal, X } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import Sparkline from './Sparkline';

// Smart Score ranges for filtering
const SCORE_RANGES = [
  { label: 'All', min: 0, max: 100 },
  { label: 'Strong Buy ≥ 80', min: 80, max: 100 },
  { label: 'Buy 60-79', min: 60, max: 79 },
  { label: 'Hold 40-59', min: 40, max: 59 },
  { label: 'Sell < 40', min: 0, max: 39 },
];

const MARKET_LABELS = {
  EQUITY: '📈 Equity',
  CRYPTO: '₿ Crypto',
  FUTURE: '🛢️ Futures',
  FOREX: '💱 Forex',
  CURRENCY: '💱 Forex',
  COMMODITIES: '🛢️ Commodities',
  INDICES: '📊 Indices',
};

const MomentumBar = ({ value }) => {
  const isPositive = value >= 0;
  const absValue = Math.min(Math.abs(value), 5); // Max 5% for visual scaling
  const width = (absValue / 5) * 50; // 50% relative to center

  return (
    <div className="flex items-center justify-center w-24 h-5 relative">
      <div className="absolute left-1/2 w-px h-full bg-slate-700/50 -translate-x-1/2 z-10" />
      <div className="w-full flex">
        <div className="w-1/2 flex justify-end">
          {!isPositive && (
            <div 
              className="h-1.5 bg-danger rounded-l-full shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
              style={{ width: `${width}%` }} 
            />
          )}
        </div>
        <div className="w-1/2 flex justify-start">
          {isPositive && (
            <div 
              className="h-1.5 bg-success rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
              style={{ width: `${width}%` }} 
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
  const categories = ['EQUITY', 'FOREX', 'CRYPTO', 'COMMODITIES', 'INDICES'];

  const filteredAssets = useMemo(() => {
    const range = SCORE_RANGES[scoreFilter];
    return assets.filter((a) => {
      return a.smartScore >= range.min && a.smartScore <= range.max;
    });
  }, [assets, scoreFilter]);

  const hasActiveFilters = activeCategory !== 'EQUITY' || scoreFilter !== 0;

  const resetFilters = () => {
    onCategoryChange('EQUITY');
    setScoreFilter(0);
  };

  const getSmartScoreColor = (score) => {
    if (score > 70) return 'text-success bg-success/10 border-success/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]';
    if (score >= 40) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  if (loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 py-24 bg-surface rounded-2xl border border-slate-700/50">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-gray-400 font-medium tracking-wide">Synchronizing terminal data...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      {/* Table Header Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-700/30 bg-slate-800/20 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                  : 'bg-slate-800/60 text-gray-400 border-slate-700/50 hover:border-slate-500 hover:text-white'
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
              className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-tighter font-black border transition-all duration-300 ${
                scoreFilter === i
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-800/60 text-gray-500 border-slate-700/50 hover:border-slate-500 hover:text-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] uppercase font-bold text-gray-400 hover:text-white bg-slate-800 border border-slate-700 transition-all"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 border-b border-slate-700/50">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Asset</th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right">24H %</th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Momentum</th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Trend (7D)</th>
              <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Smart Quant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-gray-500 bg-slate-800/10">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="font-medium">Nessun asset corrispondente ai criteri di ricerca.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr
                  key={asset.ticker}
                  className="hover:bg-indigo-500/5 transition-all group cursor-pointer border-l-2 border-transparent hover:border-primary"
                  onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`)}
                >
                  <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleWatchlist(asset.ticker)} className="focus:outline-none">
                      <Star className={`w-4 h-4 transition-all ${isWatched(asset.ticker) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-[12px] text-white border border-white/5">
                        {asset.ticker.substring(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-bold tracking-tight text-white group-hover:text-primary transition-colors">{asset.ticker}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter opacity-60">{asset.settore}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-white font-medium">
                    {typeof asset.prezzo === 'number' ? `$${asset.prezzo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '---'}
                  </td>
                  <td className="p-4 text-right">
                    <div className={`inline-flex items-center gap-1 font-mono text-sm font-bold ${asset.var1D >= 0 ? 'text-success' : 'text-danger'}`}>
                      {asset.var1D >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
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
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black border tracking-wider transition-all ${getSmartScoreColor(asset.smartScore)}`}>
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
