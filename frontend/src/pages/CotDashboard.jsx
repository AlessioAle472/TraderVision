import React, { useState } from 'react';
import { Calendar, FileText, Sparkles, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useCotData } from '../hooks/useApiQuery';
import ProPaywall from '../components/ProPaywall';
import AdBanner from '../components/AdBanner';

// --- MOCK DATA ---
const MOCK_COT_DATA = [
  {
    id: '1',
    category: 'Indices',
    name: 'NASDAQ-100',
    code: '209742',
    nonCommercial: {
      total: 12450,
      weeklyDelta: 2400,
      avg3m: 9500,
      avg3mPct: 15,
      avg6m: 8000,
      avg6mPct: 22,
      zScore: 1.8
    },
    commercial: {
      total: -14200,
      weeklyDelta: -1200,
      avg3m: -10500,
      avg3mPct: -12,
      avg6m: -9000,
      avg6mPct: -18,
      zScore: -1.6
    }
  },
  {
    id: '2',
    category: 'Indices',
    name: 'S&P 500',
    code: '13874A',
    nonCommercial: {
      total: -4500,
      weeklyDelta: -500,
      avg3m: -2000,
      avg3mPct: -8,
      avg6m: -1500,
      avg6mPct: -10,
      zScore: -0.8
    },
    commercial: {
      total: 6200,
      weeklyDelta: 800,
      avg3m: 4500,
      avg3mPct: 10,
      avg6m: 3800,
      avg6mPct: 14,
      zScore: 0.9
    }
  },
  {
    id: '3',
    category: 'Currencies',
    name: 'EURO FX',
    code: '099741',
    nonCommercial: {
      total: 85000,
      weeklyDelta: 12000,
      avg3m: 65000,
      avg3mPct: 8,
      avg6m: 45000,
      avg6mPct: 12,
      zScore: 2.1
    },
    commercial: {
      total: -92000,
      weeklyDelta: -15000,
      avg3m: -75000,
      avg3mPct: -10,
      avg6m: -50000,
      avg6mPct: -15,
      zScore: -2.3
    }
  },
  {
    id: '4',
    category: 'Commodities',
    name: 'GOLD',
    code: '088691',
    nonCommercial: {
      total: 210000,
      weeklyDelta: -5000,
      avg3m: 230000,
      avg3mPct: -5,
      avg6m: 180000,
      avg6mPct: 10,
      zScore: 1.2
    },
    commercial: {
      total: -240000,
      weeklyDelta: 8000,
      avg3m: -260000,
      avg3mPct: 4,
      avg6m: -210000,
      avg6mPct: -8,
      zScore: -1.1
    }
  }
];

const CotDashboard = () => {
  const [activeTab, setActiveTab] = useState('Tutti gli Asset');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: cotResponse, isLoading: loading } = useCotData();
  const data = cotResponse?.data || [];
  const lastUpdate = cotResponse?.asOfDate 
    ? new Date(cotResponse.asOfDate).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const TABS = ['Tutti gli Asset', 'Indices', 'Currencies', 'Commodities', 'Financials'];

  const filteredData = data.filter(item => {
    const matchesTab = activeTab === 'Tutti gli Asset' || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const significantZScoresCount = data.filter(item => 
    Math.abs(item.nonCommercial.zScore) > 1.5 || Math.abs(item.commercial.zScore) > 1.5
  ).length;

  const ValueBadge = ({ value, showSign = true }) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const displayValue = showSign && isPositive ? `+${value.toLocaleString()}` : value.toLocaleString();
    
    let baseClasses = "px-2 py-1 rounded-md text-sm font-semibold whitespace-nowrap ";
    if (isPositive) baseClasses += "bg-green-500/20 text-green-400";
    else if (isNegative) baseClasses += "bg-red-500/20 text-red-400";
    else baseClasses += "bg-gray-500/20 text-gray-400";

    return <span className={baseClasses}>{displayValue}</span>;
  };

  const ZScoreBadge = ({ value }) => {
    const isExtreme = Math.abs(value) > 1.5;
    const isPositive = value > 0;
    const isNegative = value < 0;
    
    let baseClasses = "flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm font-semibold whitespace-nowrap ";
    if (isPositive) baseClasses += "bg-green-500/20 text-green-400";
    else if (isNegative) baseClasses += "bg-red-500/20 text-red-400";
    else baseClasses += "bg-gray-500/20 text-gray-400";

    return (
      <span className={baseClasses}>
        {isExtreme && <Sparkles className="w-3 h-3" />}
        {value.toFixed(2)}
      </span>
    );
  };

  const AvgCell = ({ avg, pct }) => (
    <div className="flex items-center gap-2">
      <span className="text-white font-medium">{avg.toLocaleString()}</span>
      <span className="text-xs text-gray-500">({pct > 0 ? '+' : ''}{pct}%)</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-6 font-sans">
      
      {/* 1. Layout Generale e Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-blue-400 tracking-tight">Commitment of Traders</h1>
          <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Ultimo aggiornamento: {lastUpdate || 'Caricamento...'}</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Strumenti Totali</div>
              <div className="text-2xl font-black">{data.length}</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]">
            <div className="bg-amber-500/20 p-3 rounded-lg">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Z-Score Significativi</div>
              <div className="text-2xl font-black">{significantZScoresCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <AdBanner />
      </div>

      {/* 2. Navigazione a Schede e Ricerca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white text-[#0B0E14] shadow-lg' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Cerca ticker o codice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold">{activeTab}</h2>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-gray-300">
          {filteredData.length} strumenti
        </span>
      </div>

      {/* 3. Struttura della Tabella Complessa */}
      <ProPaywall isPaywalled={cotResponse?.paywalled}>
        <div className="relative overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-10 bg-[#0B0E14]/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <div className="text-blue-400 font-medium">Scaricamento Dati CFTC in corso...</div>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Livello Superiore Header */}
              <tr>
                <th className="p-4 border-b border-r border-white/10 bg-white/5"></th>
                <th colSpan="5" className="p-4 text-center font-black tracking-widest text-xs uppercase border-b border-r border-white/10 bg-blue-900/30 text-blue-300">
                  Non Commerciale
                </th>
                <th colSpan="5" className="p-4 text-center font-black tracking-widest text-xs uppercase border-b border-white/10 bg-red-900/20 text-red-300">
                  Commerciale
                </th>
              </tr>
              {/* Livello Inferiore Header */}
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-r border-white/10 bg-white/5">Strumento</th>
                
                {/* Non Commercial Cols */}
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.03] group cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">Totale <ChevronUp className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.03] group cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">Δ Sett. <ChevronDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.03]">Media 3M</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.03]">Media 6M</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-r border-white/10 bg-white/[0.03]">Z-Score</th>

                {/* Commercial Cols */}
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.01] group cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">Totale <ChevronUp className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.01] group cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">Δ Sett. <ChevronDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.01]">Media 3M</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.01]">Media 6M</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.01]">Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    {/* 4. Stile delle Righe */}
                    <td className="p-4 border-r border-white/10 bg-white/[0.01]">
                      <div className="font-black text-white text-base">{row.name}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{row.code}</div>
                    </td>

                    {/* Non Commercial Data */}
                    <td className="p-4 whitespace-nowrap"><ValueBadge value={row.nonCommercial.total} showSign={false} /></td>
                    <td className="p-4 whitespace-nowrap"><ValueBadge value={row.nonCommercial.weeklyDelta} /></td>
                    <td className="p-4 whitespace-nowrap"><AvgCell avg={row.nonCommercial.avg3m} pct={row.nonCommercial.avg3mPct} /></td>
                    <td className="p-4 whitespace-nowrap"><AvgCell avg={row.nonCommercial.avg6m} pct={row.nonCommercial.avg6mPct} /></td>
                    <td className="p-4 whitespace-nowrap border-r border-white/10"><ZScoreBadge value={row.nonCommercial.zScore} /></td>

                    {/* Commercial Data */}
                    <td className="p-4 whitespace-nowrap"><ValueBadge value={row.commercial.total} showSign={false} /></td>
                    <td className="p-4 whitespace-nowrap"><ValueBadge value={row.commercial.weeklyDelta} /></td>
                    <td className="p-4 whitespace-nowrap"><AvgCell avg={row.commercial.avg3m} pct={row.commercial.avg3mPct} /></td>
                    <td className="p-4 whitespace-nowrap"><AvgCell avg={row.commercial.avg6m} pct={row.commercial.avg6mPct} /></td>
                    <td className="p-4 whitespace-nowrap"><ZScoreBadge value={row.commercial.zScore} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="p-12 text-center text-gray-500">
                    Nessuno strumento trovato per questa ricerca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ProPaywall>

    </div>
  );
};

export default CotDashboard;
