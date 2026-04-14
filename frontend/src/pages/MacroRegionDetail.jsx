import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Globe, TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import apiClient from '../services/apiClient';
import TradingViewWidget from '../components/TradingViewWidget';

// Mapping Region to Benchmark ETF
const REGION_TICKERS = {
  europa: 'FEZ',      // Euro Stoxx 50
  cina: 'FXI',        // iShares China Large-Cap
  australia: 'EWA',   // MSCI Australia
  canada: 'EWC',      // MSCI Canada
};

// Fallback Mock Data in case navigated directly without state
const FALLBACK_SCORES = {
  europa: { score: 53, change: '+1.2' },
  canada: { score: 58, change: '+0.5' },
  cina: { score: 43, change: '-2.1' },
  australia: { score: 61, change: '+0.8' },
};

const MacroRegionDetail = () => {
  const { region } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [assetData, setAssetData] = useState(null);
  const [error, setError] = useState(null);

  const regionKey = region?.toLowerCase() || '';
  const ticker = REGION_TICKERS[regionKey];
  
  // Extract specific macro score passed via state or use fallback
  const macroScore = location.state?.score || FALLBACK_SCORES[regionKey]?.score || 50;
  const macroChange = location.state?.change || FALLBACK_SCORES[regionKey]?.change || '0.0';
  const isPositiveMacro = macroChange.startsWith('+');

  const regionName = regionKey.charAt(0).toUpperCase() + regionKey.slice(1);

  useEffect(() => {
    let active = true;
    
    const fetchRegionData = async () => {
      if (!ticker) {
        if (active) {
          setError(`Regione '${regionName}' non supportata o ticker mancante.`);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        // Fetch Real Quant Data from backend for this regional benchmark
        const data = await apiClient.getAssetDetail(ticker);
        if (active) {
          if (data) {
            setAssetData(data);
          } else {
            setError(`Impossibile recuperare i dati quantitativi per il benchmark ${ticker}`);
          }
        }
      } catch (err) {
        if (active) setError(err.message || 'Errore di connessione API Centrale');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRegionData();
    return () => { active = false; };
  }, [ticker, regionName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-400 font-medium">Sincronizzazione API Centrali {regionName} ({ticker})…</p>
      </div>
    );
  }

  if (error || !ticker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <Globe className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-white font-bold text-xl">Macro Analysis Failed</p>
        <p className="text-gray-400 text-sm max-w-sm text-center">{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const var1D = assetData?.var1D ?? 0;
  const isPositivePrice = var1D >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Globe className="w-7 h-7 text-emerald-500" />
              Outlook {regionName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Benchmark: {ticker}
              </span>
              <span className="text-sm text-gray-400">Analisi quantitativa e regime regionale.</span>
            </div>
          </div>
        </div>
        
        {/* Right Header Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Global Macro Index</div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className="text-2xl font-black text-white">{macroScore}</span>
              <span className={`text-sm font-bold flex items-center ${isPositiveMacro ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositiveMacro ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {macroChange}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Real-Time TV Chart */}
        <div className="lg:col-span-2 bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Price Action ({ticker})
              </h2>
            </div>
            
            {/* Live Pricing from backend payload */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {assetData?.prezzo ? Number(assetData.prezzo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-bold ${isPositivePrice ? 'text-success' : 'text-danger'}`}>
                {isPositivePrice ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositivePrice ? '+' : ''}{Number(var1D).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex-1 w-full bg-slate-900">
            {/* Embedded Live Chart */}
            <TradingViewWidget symbol={ticker} />
          </div>
        </div>

        {/* Right Side: Quant Score & Fundamentals */}
        <div className="space-y-6 h-full flex flex-col">
          <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-xl flex-1">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" /> Analisi Quantitativa
            </h2>
            
            <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 mb-6">
              <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Smart Score</div>
              <div className={`text-6xl font-black ${assetData?.smartScore >= 70 ? 'text-emerald-500' : assetData?.smartScore < 40 ? 'text-rose-500' : 'text-yellow-500'}`}>
                {assetData?.smartScore || '--'}
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-gray-300 border border-slate-700 mt-3 uppercase tracking-wider">
                {assetData?.smartScoreLabel || 'N/A'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">RSI (14D)</span>
                <span className="text-sm font-bold text-white">{assetData?.rsi || '--'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trend 50D</span>
                <span className={`text-sm font-bold ${assetData?.trend === 'Long' ? 'text-emerald-400' : assetData?.trend === 'Short' ? 'text-rose-400' : 'text-gray-400'}`}>
                  {assetData?.trend || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Relative Vol.</span>
                <span className={`text-sm font-bold ${assetData?.volume_vs_avg > 1 ? 'text-purple-400' : 'text-gray-400'}`}>
                  {assetData?.volume_vs_avg ? `${assetData.volume_vs_avg}x` : '--'}
                </span>
              </div>
            </div>
            
            {assetData?.breakdown?.macro_reason && (
               <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-medium italic">
                 {assetData.breakdown.macro_reason}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroRegionDetail;
