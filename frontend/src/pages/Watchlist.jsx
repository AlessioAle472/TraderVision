import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowUpRight, ArrowDownRight, RefreshCw, Flame, X, BarChart2, Activity } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import TradingViewWidget from '../components/TradingViewWidget';

const Watchlist = () => {
 const navigate = useNavigate();
 const { watchlist, toggleWatchlist, isWatched } = useWatchlist();
 const { user } = useAuth();
  const [allAssets, setAllAssets] = useState([]);
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    if (watchlist.length === 0) {
      setAllAssets([]);
      setLoading(false);
      if (!macroData) {
        apiClient.getMacroOutlook()
          .then((data) => setMacroData(data))
          .catch((err) => console.error("Error loading macro outlook:", err));
      }
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      apiClient.getDashboardData(watchlist),
      macroData ? Promise.resolve(macroData) : apiClient.getMacroOutlook().catch(() => null)
    ])
      .then(([dashboardData, macroOutlook]) => {
        if (!isMounted) return;

        const normalizedAssets = Array.isArray(dashboardData)
          ? dashboardData
          : (dashboardData?.assets || []);

        const assetMap = new Map();
        normalizedAssets.forEach((a) => {
          if (a) {
            if (a.ticker) assetMap.set(String(a.ticker).trim().toUpperCase(), a);
            if (a.yahooTicker) assetMap.set(String(a.yahooTicker).trim().toUpperCase(), a);
            if (a.name) assetMap.set(String(a.name).trim().toUpperCase(), a);
          }
        });

        // Ensure every single ticker in watchlist is included
        const combined = watchlist.map((sym) => {
          const cleanSym = String(sym).trim().toUpperCase();
          const found = assetMap.get(cleanSym);
          if (found) {
            return {
              ...found,
              ticker: found.ticker || cleanSym
            };
          }
          return {
            ticker: cleanSym,
            name: cleanSym,
            settore: 'EQUITY',
            prezzo: 0,
            var1D: 0,
            momentum: 0,
            smartScore: 50,
            smartScoreLabel: 'NEUTRAL',
            sparkline: []
          };
        });

        setAllAssets(combined);
        if (macroOutlook) setMacroData(macroOutlook);
      })
      .catch((err) => {
        console.error("Error loading watchlist data:", err);
        if (isMounted) {
          const fallback = watchlist.map((sym) => ({
            ticker: String(sym).trim().toUpperCase(),
            name: String(sym).trim().toUpperCase(),
            settore: 'EQUITY',
            prezzo: 0,
            var1D: 0,
            momentum: 0,
            smartScore: 50,
            smartScoreLabel: 'NEUTRAL',
            sparkline: []
          }));
          setAllAssets(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watchlist.join(','), refreshKey]);

  const watchedAssets = allAssets.filter((a) =>
    watchlist.some((w) => w.toUpperCase() === (a.ticker || '').toUpperCase())
  );

 const getSmartScoreColor = (score) => {
 if (score > 70) return'text-success bg-success/10';
 if (score >= 40) return'text-yellow-400 bg-yellow-400/10';
 return'text-danger bg-danger/10';
 };

 const getMacroCorrelation = (asset) => {
 if (!macroData?.recommendations) return { status:'neutral', message:'Nessun dato macro disponibile' };
 
 // Check Prefer arrays
 const prefers = macroData.recommendations.prefer || [];
 const avoids = macroData.recommendations.avoid || [];
 
 // Compare sector or ticker loosely
 const matchStr =`${asset.ticker} ${asset.settore}`.toLowerCase();
 
 const isPreferred = prefers.some(p => matchStr.includes(p.toLowerCase()));
 if (isPreferred) return { status:'prefer', message:`Asset favorito nel regime globale: ${macroData.regime}`};
 
 const isAvoided = avoids.some(a => matchStr.includes(a.toLowerCase()));
 if (isAvoided) return { status:'avoid', message:`Alta rischiosità in un regime di ${macroData.regime}`};
 
 return { status:'neutral', message:`Nessuna forte correlazione con il regime di ${macroData.regime}`};
 };

 const getSocialTrending = (ticker) => {
 // Deterministic simulation based on string hash
 const seed = ticker.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
 return Math.abs(seed) % 300 + 50;
 };

 return (
 <div className="max-w-7xl mx-auto space-y-8 relative pb-10">
 <header>
 <h1 className="text-3xl font-bold text-white mb-2">Watchlist</h1>
 <p className="text-gray-400">I tuoi asset preferiti con insight sociali e macroeconomici in real-time.</p>
 </header>

 {loading ? (
 <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-2xl gap-4">
 <RefreshCw className="w-8 h-8 text-primary animate-spin border-4 border-primary border-t-transparent"/>
 <p className="text-gray-400 font-medium">Sincronizzazione portafoglio...</p>
 </div>
 ) : watchedAssets.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-2xl text-center gap-4">
 <Star className="w-12 h-12 text-yellow-500/30"/>
 <p className="text-gray-400 font-medium">La tua watchlist è vuota</p>
 <p className="text-sm text-gray-600 max-w-sm">
 Clicca sulla stellina ★ accanto a qualsiasi ticker nella dashboard per monitorarne la correlazione macro in tempo reale.
 </p>
 <button
 onClick={() => navigate('/markets')}
 className="mt-2 px-5 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-sm font-medium transition-colors"
 >
 Esplora Mercati
 </button>
 </div>
 ) : (
 <div className="bg-surface rounded-2xl overflow-hidden shadow-xl">
 <div className="p-6 flex items-center justify-between bg-slate-800/20">
 <div className="flex items-center gap-3">
 <Star className="w-5 h-5 fill-yellow-400 text-yellow-400"/>
 <h2 className="text-xl font-bold text-white tracking-tight">
 Portafoglio Personale
 </h2>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={() => setRefreshKey((k) => k + 1)}
 className="px-3 py-1.5 rounded-xl bg-slate-700/40 hover:bg-slate-700 text-gray-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 border border-white/5"
 title="Aggiorna dati di mercato"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
 <span>Aggiorna</span>
 </button>
 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{watchedAssets.length} Tickers Attivi</span>
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-slate-800/50">
 <tr>
 <th className="p-4 w-10"></th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ticker</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Prezzo</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Var 1D%</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Settore</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Macro Status</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Community</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Smart Score</th>
 <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Azione</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/50">
 {watchedAssets.map((asset) => (
 <tr
 key={asset.ticker}
 className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
 onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`)}
 >
 <td className="p-4 w-10"onClick={(e) => e.stopPropagation()}>
 <button
 onClick={() => toggleWatchlist(asset.ticker)}
 className="transition-transform hover:scale-125 active:scale-95 focus:outline-none"
 title="Rimuovi dalla watchlist"
 >
 <Star className={`w-4 h-4 transition-colors duration-150 fill-yellow-400 text-yellow-400 hover:text-rose-500 hover:fill-rose-500`} />
 </button>
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
 {asset.ticker.substring(0, 1)}
 </div>
 <div>
 <span className="font-bold text-white group-hover:text-primary transition-colors">
 {asset.ticker}
 </span>
 <span className="text-[10px] text-gray-500 block hidden sm:block uppercase tracking-wider">{asset.settore}</span>
 </div>
 </div>
 </td>
  <td className="p-4 text-right font-medium text-white">
    {asset.prezzo && Number(asset.prezzo) > 0
      ? `$${Number(asset.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
      : '---'}
  </td>
 <td className="p-4 text-right">
 <div className={`inline-flex items-center gap-1 font-bold text-sm ${asset.var1D >= 0 ?'text-success' :'text-danger'}`}>
 {asset.var1D >= 0 ? <ArrowUpRight className="w-3.5 h-3.5"/> : <ArrowDownRight className="w-3.5 h-3.5"/>}
 {Math.abs(asset.var1D)?.toFixed(2) || '0.00'}%
 </div>
 </td>
 <td className="p-4 text-gray-400 hidden md:table-cell text-xs">{asset.settore}</td>
 
 {/* Macro Correlazione */}
 <td className="p-4 text-center">
 {(() => {
 const { status, message } = getMacroCorrelation(asset);
 const colors = {
 prefer:'bg-emerald-500/10 text-emerald-400/20',
 avoid:'bg-rose-500/10 text-rose-400/20',
 neutral:'bg-yellow-500/10 text-yellow-500/20'
 };
 const labels = { prefer:'Favorevole', avoid:'Rischioso', neutral:'Neutro' };
 return (
 <span 
 title={message}
 className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest cursor-help ${colors[status]}`}
 >
 {labels[status]}
 </span>
 );
 })()}
 </td>

 {/* Community Social Trending */}
 <td className="p-4 text-center">
 <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 min-w-[70px]">
 <Flame className="w-3 h-3 text-orange-500"/>
 <span className="text-[10px] font-bold text-gray-300">{getSocialTrending(asset.ticker)}</span>
 </div>
 </td>

 <td className="p-4 text-center">
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getSmartScoreColor(asset.smartScore)}`}>
 {asset.smartScore || 0}
 </span>
 </td>

 {/* Quick Insight Action */}
 <td className="p-4 text-center"onClick={(e) => e.stopPropagation()}>
 <button 
 onClick={() => setSelectedAsset(asset)}
 className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors hover:scale-105 active:scale-95 mx-auto block"
 title="Apri Quick Insight"
 >
 <BarChart2 className="w-4 h-4"/>
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Quick Insight Drawer */}
 {selectedAsset && (
 <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
 {/* Backdrop */}
 <div 
 className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
 onClick={() => setSelectedAsset(null)} 
 />
 
 {/* Drawer Panel */}
 <div className="w-full sm:w-[500px] bg-slate-900 h-full z-10 p-6 flex flex-col relative shadow-2xl animate-in slide-in-from-right duration-300">
 {/* Header */}
 <div className="flex justify-between items-center mb-6 pb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white text-xl shadow-inner">
 {selectedAsset.ticker.substring(0, 1)}
 </div>
 <div className="flex flex-col">
 <h2 className="text-2xl font-black text-white leading-tight">{selectedAsset.ticker}</h2>
 <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">{selectedAsset.settore}</span>
 </div>
 </div>
 <button 
 onClick={() => setSelectedAsset(null)} 
 className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
 title="Chiudi"
 >
 <X className="w-5 h-5"/>
 </button>
 </div>

 {/* AI Summary Block */}
 {user?.role ==='admin' && (
 <div className="bg-primary/5 rounded-2xl p-5 mb-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.02)]">
 <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
 <Activity className="w-3.5 h-3.5"/> AI Quick Insight
 </h3>
 <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAsset.ticker} registra uno Smart Score di <b className="text-white">{selectedAsset.smartScore}</b>. 
 {getMacroCorrelation(selectedAsset).status ==='prefer' 
 ?`L'allineamento eccezionale con il regime macro attuale (${macroData?.regime}) ne rafforza fortemente la stabilità tecnica.`
 : getMacroCorrelation(selectedAsset).status ==='avoid' 
 ?`Il contesto macroeconomico sfavorevole (${macroData?.regime}) suggerisce estrema prudenza nel posizionamento e pesature ridotte.`
 :`L'asset mostra dinamiche largamente indipendenti dall'attuale ciclo macroeconomico, dominato da metriche isolate.`}"
 </p>
 </div>
 )}

 {/* Price Key Metrics */}
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Spot Price</span>
 <span className="text-xl font-black text-white">
    {selectedAsset.prezzo && Number(selectedAsset.prezzo) > 0
      ? `$${Number(selectedAsset.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
      : '---'}
  </span>
 </div>
 <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Momentum (1D)</span>
 <span className={`text-xl font-black ${selectedAsset.var1D >= 0 ?'text-success' :'text-danger'}`}>
 {selectedAsset.var1D > 0 &&'+'}{selectedAsset.var1D}%
 </span>
 </div>
 </div>

 {/* Mini Chart Area */}
 <div className="flex-grow rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
 <div className="absolute inset-0">
 <TradingViewWidget symbol={selectedAsset.ticker} />
 </div>
 </div>
 
 <button 
 onClick={() => navigate(`/asset/${encodeURIComponent(selectedAsset.ticker)}`)}
 className="mt-6 w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors shadow-lg shadow-primary/20"
 >
 Full Analysis
 </button>
 </div>
 </div>
 )}
 </div>
 );
};

export default Watchlist;

