import { useState, useEffect } from 'react';
import MarketTable from '../components/MarketTable';
import MacroCards from '../components/MacroCards';
import WorldCalendar from '../components/WorldCalendar';
import AIMarketBriefing from '../components/AIMarketBriefing';
import GoogleAd from '../components/GoogleAd';
import apiClient from '../services/apiClient';
import { useWatchlist } from '../context/WatchlistContext';
import { TrendingUp, Activity, Shield, RefreshCw, Target } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';
import PremiumGate from '../components/PremiumGate';

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
 regime:"STAGFLAZIONE",
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



 const overview = data.overview;

 return (
 <div className="max-w-7xl mx-auto space-y-8">
 <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
 <div className="space-y-3 flex-1">
 <div className="flex items-center gap-4 flex-wrap">
 <h1 className="text-3xl font-black text-text tracking-tight">Terminale di Mercato</h1>
 <div className="group relative">
 <span className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 /20 text-xs font-black tracking-widest uppercase flex items-center gap-2 cursor-help shadow-lg shadow-orange-500/5">
 <Target className="w-3.5 h-3.5"/>
 {macroData?.regime || 'ATTESA'}
 <span className="text-orange-100 bg-orange-500 px-1.5 py-0.5 rounded-md leading-none">{macroData?.score || 0}/100</span>
 </span>
 <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-surface text-xs text-text-secondary rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
 Il regime macroeconomico quantitativo stimato è <em>{macroData?.regime}</em>. Indica la direzione generale dei flussi di capitale istituzionale.
 </div>
 </div>
 </div>
 <p className="text-text-secondary font-medium">Panoramica quantitativa professionale e segnali di tendenza.</p>
 </div>
 <div className="flex items-center gap-4 w-full md:w-auto">
 <button 
 onClick={() => { fetchDashboardData(); fetchBriefing(); fetchMacroOutlook(); }}
 className="p-3 rounded-2xl bg-surface hover: text-text-secondary hover:text-text transition-all shadow-xl group shrink-0"
 disabled={loading}
 >
 <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
 </button>
 </div>
 </header>

 <section className="mb-10">
 <PremiumGate>
 <AIMarketBriefing 
 data={briefing} 
 loading={briefingLoading}
 onSubscribe={() => window.location.href = '/daily-news'} 
 />
 </PremiumGate>
 </section>

 <section className="mb-10">
 <GoogleAd />
 </section>

 {/* KPI Bar */}
 <div className="relative pt-2 pb-6 transition-colors duration-300">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {loading && !overview ? (
 <>
 <SkeletonCard />
 <SkeletonCard />
 <SkeletonCard />
 </>
 ) : (
 <>
 <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
 <TrendingUp className="w-12 h-12 text-primary"/>
 </div>
 <h3 className="text-text-secondary font-medium text-sm mb-2 flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-primary"/> Indice S&P 500
 </h3>
 <div className="flex items-baseline gap-3">
 <div className="text-2xl font-bold text-text">
 {overview?.sp500?.price ? Number(overview.sp500.price).toLocaleString() : '---'}
 </div>
 <div className={`text-sm font-semibold ${overview?.sp500?.isUp ? 'text-success' : 'text-danger'}`}>
 {overview?.sp500?.change ?`${overview.sp500.isUp ? '+' : ''}${overview.sp500.change.toFixed(2)}%`: '0.00%'}
 </div>
 </div>
 <p className="text-[10px] text-text-secondary/50 mt-2 uppercase tracking-wider font-bold">Indice S&P 500</p>
 </div>

 <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
 <Activity className="w-12 h-12 text-yellow-500"/>
 </div>
 <h3 className="text-text-secondary font-medium text-sm mb-2 flex items-center gap-2">
 <Activity className="w-4 h-4 text-yellow-500"/> VIX (Indice di Paura)
 </h3>
 <div className="flex items-baseline gap-3">
 <div className="text-2xl font-bold text-text">
 {overview?.vix?.price ? overview.vix.price.toFixed(2) : '---'}
 </div>
 <div className={`text-sm px-2 py-0.5 rounded-full font-bold ${overview?.vix?.isScary ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
 {overview?.vix?.isScary ? 'Alta Volatilità' : 'Stabile'}
 </div>
 </div>
 <p className="text-[10px] text-text-secondary/50 mt-2 uppercase tracking-wider font-bold">Indice di Volatilità del Mercato</p>
 </div>

 <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
 <Shield className="w-12 h-12 text-success"/>
 </div>
 <h3 className="text-text-secondary font-medium text-sm mb-2 flex items-center gap-2">
 <Shield className="w-4 h-4 text-success"/> Opportunità Alpha
 </h3>
 <div className="flex items-baseline gap-3">
 <div className="text-2xl font-bold text-text">
 {overview?.highScoresCount ?? 0}
 </div>
 <div className="text-sm text-text-secondary">
 Score ≥ 70
 </div>
 </div>
 <p className="text-[10px] text-text-secondary/50 mt-2 uppercase tracking-wider font-bold">Rilevamento Segnali Quantitativi</p>
 </div>
 </>
 )}
 </div>
 </div>

 <MacroCards data={macroData} overview={overview} />

 <section className="mb-12">
 <MarketTable 
 assets={filteredAssets} 
 loading={loading} 
 activeCategory={activeCategory}
 onCategoryChange={setActiveCategory}
 />
 </section>

 <section className="mb-12">
 <GoogleAd />
 </section>

 <WorldCalendar id="world-calendar"lang="it"/>
 </div>
 );
};

export default Dashboard;
