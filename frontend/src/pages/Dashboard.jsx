import { useState, useEffect } from 'react';
import MarketTable from '../components/MarketTable';
import MacroCards from '../components/MacroCards';
import WorldCalendar from '../components/WorldCalendar';
import AIMarketBriefing from '../components/AIMarketBriefing';
import SearchBar from '../components/SearchBar';
import apiClient from '../services/apiClient';
import { useWatchlist } from '../context/WatchlistContext';
import { TrendingUp, Activity, Shield, RefreshCw } from 'lucide-react';

const TAB_CONFIG = {
  EQUITY: null, // default trending
  FOREX: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCAD=X'],
  CRYPTO: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD'],
  COMMODITIES: ['GC=F', 'SI=F', 'CL=F', 'HG=F', 'NG=F'],
  INDICES: ['^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX']
};

const Dashboard = () => {
  const { watchlist } = useWatchlist();
  const [data, setData] = useState({ overview: null, assets: [] });
  const [activeCategory, setActiveCategory] = useState('EQUITY');
  const [searchTerm, setSearchTerm] = useState('');
  const [macroData, setMacroData] = useState({
    regime: "STAGFLAZIONE",
    score: 59,
    recommendations: { prefer: [], avoid: [] },
    trend6m: [],
    events: []
  });
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let tickers = TAB_CONFIG[activeCategory];
      if (activeCategory === 'EQUITY' && watchlist.length > 0) {
        tickers = watchlist;
      }
      
      const res = await apiClient.getDashboardData(tickers);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMacroOutlook = async () => {
    try {
      const macro = await apiClient.getMacroOutlook();
      setMacroData(macro);
    } catch (err) {
      console.error('Failed to fetch macro outlook', err);
    }
  };

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/briefing/latest`);
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error("Failed to fetch briefing:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [watchlist, activeCategory]);

  useEffect(() => {
    fetchMacroOutlook();
    fetchBriefing();
  }, []);

  const filteredAssets = (data.assets || []).filter(asset => {
    const search = (searchTerm || '').toLowerCase();
    const ticker = (asset.ticker || '').toLowerCase();
    const name = (asset.name || '').toLowerCase();
    return ticker.includes(search) || name.includes(search);
  });

  console.log(`[Dashboard] Search: "${searchTerm}", Visible: ${filteredAssets.length}/${data.assets.length}`);

  const overview = data.overview;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Market Terminal</h1>
          <p className="text-gray-500 font-medium">Professional quantitative overview and trending signals.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <SearchBar onSearch={setSearchTerm} />
          <button 
            onClick={() => { fetchDashboardData(); fetchBriefing(); }}
            className="p-3 rounded-2xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-gray-400 hover:text-white transition-all shadow-xl group shrink-0"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
          </button>
        </div>
      </header>

      <section className="mb-10">
        <AIMarketBriefing 
          data={briefing} 
          loading={briefingLoading}
          onSubscribe={() => window.location.href = '/daily-news'} 
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> S&P 500 Index
          </h3>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-white">
              {overview?.sp500?.price ? Number(overview.sp500.price).toLocaleString() : '---'}
            </div>
            <div className={`text-sm font-semibold ${overview?.sp500?.isUp ? 'text-success' : 'text-danger'}`}>
              {overview?.sp500?.change ? `${overview.sp500.isUp ? '+' : ''}${overview.sp500.change.toFixed(2)}%` : '0.00%'}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-bold">Standard & Poor's 500</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-yellow-500" />
          </div>
          <h3 className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-500" /> VIX (Fear Index)
          </h3>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-white">
              {overview?.vix?.price ? overview.vix.price.toFixed(2) : '---'}
            </div>
            <div className={`text-sm px-2 py-0.5 rounded-full font-bold ${overview?.vix?.isScary ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
              {overview?.vix?.isScary ? 'High Volatility' : 'Stable'}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-bold">Market Volatility Index</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-12 h-12 text-success" />
          </div>
          <h3 className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" /> Alpha Opportunities
          </h3>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-white">
              {overview?.highScoresCount ?? 0}
            </div>
            <div className="text-sm text-gray-500">
              Score ≥ 70
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-bold">Quant Signal Detection</p>
        </div>
      </div>

      <MacroCards data={macroData} />

      <section className="mb-12">
        <MarketTable 
          assets={filteredAssets} 
          loading={loading} 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </section>

      <WorldCalendar id="world-calendar" lang="it" />
    </div>
  );
};

export default Dashboard;
