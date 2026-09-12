import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, 
  Plus, RefreshCw, Calendar, Trash2, Edit3, Sparkles, 
  ArrowUpRight, ArrowDownRight, Shield, Award, Layers,
  Search, Filter, CheckCircle2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid 
} from 'recharts';
import portfolioService from '../services/portfolioService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ASSET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', 
  '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', 
  '#f97316', '#84cc16'
];

const TYPE_LABELS = {
  stock: 'Azione',
  etf: 'ETF',
  etc: 'ETC',
  crypto: 'Crypto',
  commodity: 'Materia Prima',
  forex: 'Forex / Valuta',
  index: 'Indice',
  other: 'Altro',
};

const Portfolio = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: {
      totalValue: 0,
      totalInvested: 0,
      totalUnrealizedPnL: 0,
      totalUnrealizedPnLPercent: 0,
      totalDailyPnL: 0,
      positionsCount: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      bestPerformer: null,
      worstPerformer: null,
    },
    allocations: { byAsset: [], byType: [] },
    positions: [],
  });

  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [chartMode, setChartMode] = useState('value'); // 'value' or 'pnl'
  const [allocationMode, setAllocationMode] = useState('asset'); // 'asset' or 'type'
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [modalForm, setModalForm] = useState({
    ticker: '',
    name: '',
    assetType: 'stock',
    buyDate: new Date().toISOString().split('T')[0],
    buyPrice: '',
    quantity: '',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load portfolio data
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await portfolioService.getPortfolio();
      setData(res);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      showToast('error', 'Impossibile caricare il portafoglio.');
    } finally {
      setLoading(false);
    }
  };

  // Load history data
  const fetchHistory = async (tf) => {
    try {
      setHistoryLoading(true);
      const res = await portfolioService.getPortfolioHistory(tf);
      setHistory(res);
    } catch (err) {
      console.error('Error fetching portfolio history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (data.positions.length > 0) {
      fetchHistory(timeframe);
    }
  }, [timeframe, data.positions.length]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  // Open modal for new position or edit
  const handleOpenModal = (pos = null) => {
    if (pos) {
      setEditingPosition(pos);
      setModalForm({
        ticker: pos.ticker,
        name: pos.name || '',
        assetType: pos.assetType || 'stock',
        buyDate: new Date(pos.buyDate).toISOString().split('T')[0],
        buyPrice: pos.buyPrice,
        quantity: pos.quantity,
        notes: pos.notes || '',
      });
    } else {
      setEditingPosition(null);
      setModalForm({
        ticker: '',
        name: '',
        assetType: 'stock',
        buyDate: new Date().toISOString().split('T')[0],
        buyPrice: '',
        quantity: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.ticker || !modalForm.buyPrice || !modalForm.quantity) {
      return showToast('error', 'Compila tutti i campi obbligatori.');
    }

    try {
      setFormSubmitting(true);
      if (editingPosition) {
        await portfolioService.updatePosition(editingPosition._id, modalForm);
        showToast('success', 'Posizione aggiornata con successo!');
      } else {
        await portfolioService.addPosition(modalForm);
        showToast('success', 'Nuova posizione aggiunta al portafoglio!');
      }
      setIsModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle delete position
  const handleDeletePosition = async (id, ticker) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la posizione su ${ticker}?`)) return;
    try {
      await portfolioService.deletePosition(id);
      showToast('success', `Posizione ${ticker} rimossa dal portafoglio.`);
      await fetchPortfolio();
    } catch (err) {
      showToast('error', 'Impossibile eliminare la posizione.');
    }
  };

  // Load sample portfolio
  const handleLoadSample = async () => {
    try {
      setLoading(true);
      await portfolioService.loadSamplePortfolio();
      showToast('success', 'Portafoglio dimostrativo caricato con successo!');
      await fetchPortfolio();
    } catch (err) {
      showToast('error', 'Errore durante il caricamento del portafoglio demo.');
      setLoading(false);
    }
  };

  // Filter positions
  const filteredPositions = useMemo(() => {
    return (data.positions || []).filter((pos) => {
      const matchType = filterType === 'all' || pos.assetType === filterType;
      const matchSearch = !searchQuery || 
        pos.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pos.name && pos.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [data.positions, filterType, searchQuery]);

  // Format currency helper
  const fmtMoney = (val, currency = '€') => {
    if (val == null || isNaN(val)) return `${currency}0.00`;
    return `${currency}${Number(val).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format percent helper
  const fmtPercent = (val) => {
    if (val == null || isNaN(val)) return '0.00%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${Number(val).toFixed(2)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
      
      {/* ── Top Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Live Asset & Yield Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Portafoglio Personale
          </h1>
          <p className="text-slate-400 font-medium text-xs md:text-sm mt-1">
            Monitora l'andamento in tempo reale dei tuoi titoli, il rendimento aggregato e l'allocazione patrimoniale.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPortfolio}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-all disabled:opacity-50"
            title="Ricarica quotazioni"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {data.positions.length === 0 && (
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Carica Portafoglio Demo
            </button>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Nuova Posizione
          </button>
        </div>
      </div>

      {/* Global Toast */}
      {feedback.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
          feedback.type === 'error' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <p className="font-semibold text-xs md:text-sm">{feedback.message}</p>
        </div>
      )}

      {/* ── HUD Stats Ribbon (6 Key Cards) ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Value */}
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valore Totale</p>
          <p className="text-xl md:text-2xl font-black text-white tracking-tight">
            {fmtMoney(data.summary.totalValue)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{data.summary.positionsCount} posizioni attive</span>
          </div>
        </div>

        {/* Total Invested */}
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Capitale Investito</p>
          <p className="text-xl md:text-2xl font-black text-slate-200 tracking-tight">
            {fmtMoney(data.summary.totalInvested)}
          </p>
          <p className="text-[11px] text-slate-400">Prezzo di carico aggregato</p>
        </div>

        {/* Total Unrealized PnL */}
        <div className={`p-4 rounded-2xl border backdrop-blur-xl space-y-1 ${
          data.summary.totalUnrealizedPnL >= 0 
            ? 'border-emerald-500/30 bg-emerald-500/[0.04]' 
            : 'border-red-500/30 bg-red-500/[0.04]'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">P&L Totale</p>
          <p className={`text-xl md:text-2xl font-black tracking-tight ${
            data.summary.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {fmtMoney(data.summary.totalUnrealizedPnL)}
          </p>
          <div className={`inline-flex items-center gap-1 text-[11px] font-bold ${
            data.summary.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {data.summary.totalUnrealizedPnL >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{fmtPercent(data.summary.totalUnrealizedPnLPercent)}</span>
          </div>
        </div>

        {/* Daily PnL */}
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">P&L Odierno (24h)</p>
          <p className={`text-xl md:text-2xl font-black tracking-tight ${
            data.summary.totalDailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {fmtMoney(data.summary.totalDailyPnL)}
          </p>
          <p className="text-[11px] text-slate-400">Variazione seduta odierna</p>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Win Rate</p>
          <p className="text-xl md:text-2xl font-black text-indigo-300 tracking-tight">
            {data.summary.winRate}%
          </p>
          <p className="text-[11px] text-slate-400">
            {data.summary.winCount}V / {data.summary.lossCount}P
          </p>
        </div>

        {/* Best Performer */}
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Performer</p>
          {data.summary.bestPerformer ? (
            <>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
                {data.summary.bestPerformer.ticker}
              </p>
              <p className="text-[11px] font-bold text-emerald-400">
                {fmtPercent(data.summary.bestPerformer.unrealizedPnLPercent)}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-500 mt-2">—</p>
          )}
        </div>
      </div>

      {/* ── Empty State Showcase (if 0 positions) ──────────────────────── */}
      {data.positions.length === 0 && !loading && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/[0.1] bg-slate-900/30 backdrop-blur-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <PieChartIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-white">Nessun titolo registrato nel tuo portafoglio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inizia inserendo il tuo primo asset (con data e prezzo di acquisto) per visualizzare l'andamento in tempo reale, grafici di rendimento e metriche di rischio.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Aggiungi il tuo Primo Titolo
            </button>
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.1] text-xs font-bold transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Carica Portafoglio Dimostrativo
            </button>
          </div>
        </div>
      )}

      {/* ── Visual Charts Showcase ────────────────────────────────────── */}
      {data.positions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Portfolio Equity Curve (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Equity Curve & Andamento Storico
                </h3>
                <p className="text-xs text-slate-400">
                  Crescita cumulativa del valore del portafoglio nel tempo
                </p>
              </div>

              {/* Timeframe & Mode Controls */}
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex bg-black/40 border border-white/[0.06] p-1 rounded-xl">
                  <button
                    onClick={() => setChartMode('value')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      chartMode === 'value' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Valore (€)
                  </button>
                  <button
                    onClick={() => setChartMode('pnl')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      chartMode === 'pnl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    P&L (%)
                  </button>
                </div>

                {/* Timeframe selector */}
                <div className="flex bg-black/40 border border-white/[0.06] p-1 rounded-xl">
                  {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                        timeframe === tf ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-[280px] w-full pt-2">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      tickFormatter={(val) => val.slice(5)} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => chartMode === 'value' ? `€${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)', 
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                      formatter={(val, name) => [
                        chartMode === 'value' ? fmtMoney(val) : `${val}%`,
                        name === 'totalValue' ? 'Valore Portafoglio' : 'Rendimento P&L'
                      ]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={chartMode === 'value' ? 'totalValue' : 'pnlPercent'} 
                      stroke={chartMode === 'value' ? '#6366f1' : '#10b981'} 
                      strokeWidth={2.5} 
                      fill={chartMode === 'value' ? 'url(#equityGradient)' : 'url(#pnlGradient)'} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {historyLoading ? 'Caricamento andamento storico...' : 'Dati storici non ancora disponibili per questo intervallo.'}
                </div>
              )}
            </div>
          </div>

          {/* Side Chart: Allocation Donut Chart (1 col) */}
          <div className="p-6 rounded-3xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-400" />
                  Asset Allocation
                </h3>
                <p className="text-xs text-slate-400">Ripartizione ponderata</p>
              </div>

              <div className="flex bg-black/40 border border-white/[0.06] p-0.5 rounded-lg">
                <button
                  onClick={() => setAllocationMode('asset')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    allocationMode === 'asset' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Titoli
                </button>
                <button
                  onClick={() => setAllocationMode('type')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    allocationMode === 'type' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Classi
                </button>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationMode === 'asset' ? data.allocations.byAsset : data.allocations.byType}
                    dataKey="value"
                    nameKey={allocationMode === 'asset' ? 'ticker' : 'type'}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(allocationMode === 'asset' ? data.allocations.byAsset : data.allocations.byType).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={ASSET_COLORS[idx % ASSET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}
                    formatter={(val, name, entry) => [
                      `${fmtMoney(val)} (${entry.payload.weight}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Totale</span>
                <span className="text-xs font-black text-white">{fmtMoney(data.summary.totalValue)}</span>
              </div>
            </div>

            {/* Legend breakdown list */}
            <div className="space-y-1.5 max-h-[90px] overflow-y-auto scrollbar-none pr-1 text-xs">
              {(allocationMode === 'asset' ? data.allocations.byAsset : data.allocations.byType).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }} 
                    />
                    <span className="font-bold text-white uppercase truncate max-w-[100px]">
                      {allocationMode === 'asset' ? item.ticker : (TYPE_LABELS[item.type] || item.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{fmtMoney(item.value)}</span>
                    <span className="font-black text-indigo-300">{item.weight}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings Table Section ────────────────────────────────────── */}
      {data.positions.length > 0 && (
        <div className="rounded-3xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl p-6 space-y-6">
          
          {/* Table Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Posizioni Attive nel Portafoglio
              </h2>
              <p className="text-xs text-slate-400">
                Prezzo d'acquisto, quotazione in tempo reale e rendimento aggiornato
              </p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cerca titolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Type Filter */}
              <div className="flex flex-wrap items-center gap-1 bg-black/40 border border-white/[0.06] p-1 rounded-xl">
                {[
                  { id: 'all', label: 'Tutti' },
                  { id: 'stock', label: 'Azioni' },
                  { id: 'etf', label: 'ETF' },
                  { id: 'etc', label: 'ETC' },
                  { id: 'crypto', label: 'Crypto' },
                  { id: 'commodity', label: 'Materie P.' },
                  { id: 'forex', label: 'Forex' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      filterType === f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Asset / Ticker</th>
                  <th className="py-3 px-3">Data Acquisto</th>
                  <th className="py-3 px-3 text-right">Quantità</th>
                  <th className="py-3 px-3 text-right">Prezzo Acquisto</th>
                  <th className="py-3 px-3 text-right">Prezzo Attuale</th>
                  <th className="py-3 px-3 text-right">Capitale</th>
                  <th className="py-3 px-3 text-right">Valore Attuale</th>
                  <th className="py-3 px-3 text-right">P&L Totale</th>
                  <th className="py-3 px-3 text-right">Var. 24h</th>
                  <th className="py-3 px-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredPositions.map((pos) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  return (
                    <tr key={pos._id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Ticker & Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Link 
                            to={`/ticker/${pos.ticker}`}
                            className="font-black text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
                          >
                            {pos.ticker}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] text-slate-300">
                            {TYPE_LABELS[pos.assetType] || pos.assetType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{pos.name}</p>
                      </td>

                      {/* Buy Date */}
                      <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                        {new Date(pos.buyDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-200">
                        {pos.quantity}
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                        {fmtMoney(pos.buyPrice)}
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {fmtMoney(pos.currentPrice)}
                      </td>

                      {/* Invested Capital */}
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                        {fmtMoney(pos.investedCapital)}
                      </td>

                      {/* Current Value */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {fmtMoney(pos.currentValue)}
                      </td>

                      {/* Total PnL */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMoney(pos.unrealizedPnL)}
                        </div>
                        <div className={`text-[10px] font-black ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                          {fmtPercent(pos.unrealizedPnLPercent)}
                        </div>
                      </td>

                      {/* 24h Change */}
                      <td className={`py-3.5 px-3 text-right font-mono font-semibold ${
                        pos.change24hPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {fmtPercent(pos.change24hPercent)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenModal(pos)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                            title="Modifica posizione"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePosition(pos._id, pos.ticker)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="Elimina posizione"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Nuova / Modifica Posizione ──────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 rounded-3xl border border-white/[0.1] bg-slate-900 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  {editingPosition ? `Modifica Posizione: ${editingPosition.ticker}` : 'Aggiungi Titolo al Portafoglio'}
                </h3>
                <p className="text-xs text-slate-400">
                  Inserisci i dettagli dell'operazione per monitorarne il rendimento
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Ticker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Ticker o Simbolo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es: AAPL, BTC, NVDA"
                    value={modalForm.ticker}
                    onChange={(e) => setModalForm({ ...modalForm, ticker: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm uppercase focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Asset Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Classe Asset</label>
                  <select
                    value={modalForm.assetType}
                    onChange={(e) => setModalForm({ ...modalForm, assetType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="stock">Azione (Stock)</option>
                    <option value="etf">ETF (Exchange Traded Fund)</option>
                    <option value="etc">ETC (Exchange Traded Commodity)</option>
                    <option value="crypto">Criptovaluta</option>
                    <option value="commodity">Materia Prima (Futures)</option>
                    <option value="forex">Forex / Valuta</option>
                    <option value="index">Indice</option>
                  </select>
                </div>
              </div>

              {/* Nome Opzionale */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nome Asset (Opzionale)</label>
                <input
                  type="text"
                  placeholder="Es: Apple Inc."
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Prezzo Acquisto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Prezzo di Acquisto Unitario *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs font-bold">€/$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.000001"
                      placeholder="150.00"
                      value={modalForm.buyPrice}
                      onChange={(e) => setModalForm({ ...modalForm, buyPrice: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Quantità */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Quantità Posseduta *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.00000001"
                    placeholder="10"
                    value={modalForm.quantity}
                    onChange={(e) => setModalForm({ ...modalForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Buy Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Data di Acquisto *</label>
                <input
                  type="date"
                  required
                  value={modalForm.buyDate}
                  onChange={(e) => setModalForm({ ...modalForm, buyDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Total preview calculation */}
              {modalForm.buyPrice && modalForm.quantity && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Controvalore Investito Iniziale:</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm">
                    {fmtMoney(Number(modalForm.buyPrice) * Number(modalForm.quantity))}
                  </span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                >
                  {formSubmitting ? 'Salvataggio...' : (editingPosition ? 'Aggiorna Posizione' : 'Aggiungi al Portafoglio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Portfolio;
