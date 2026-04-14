import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  Activity, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  Globe, 
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const MacroDeepDive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [synthesis, setSynthesis] = useState('');
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/macro-deep-dive');
      setData(res.data);
      
      // Trigger AI Synthesis
      fetchSynthesis(res.data);
    } catch (error) {
      console.error('Error fetching macro deep dive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSynthesis = async (macroData) => {
    try {
      setSynthesisLoading(true);
      const res = await axios.post('/api/ai-synthesis', {
        chartData: macroData.chart,
        fundamentals: macroData.fundamentals,
        correlations: macroData.correlationMatrix.correlations,
        regime: 'Macro Divergence' // Placeholder for now or could be calculated
      });
      setSynthesis(res.data.synthesis);
    } catch (error) {
      console.error('Error fetching AI synthesis:', error);
      setSynthesis("Impossibile generare la sintesi AI al momento.");
    } finally {
      setSynthesisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Analisi Flussi Istituzionali in corso…</p>
      </div>
    );
  }

  const { chart, fundamentals, correlationMatrix } = data || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/')} 
            className="p-3 rounded-2xl bg-slate-800/40 border border-white/5 hover:bg-slate-700/50 text-gray-400 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              Macro Deep Dive
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Cross-Asset Divergence Analysis & Institutional Flows</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Terminal Active</span>
        </div>
      </div>

      {/* Top 3 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VIX */}
        <MetricCard 
          title="VIX Index" 
          subtitle="Market Fear/Volatility" 
          value={fundamentals?.vix?.price} 
          change={fundamentals?.vix?.change} 
          color="blue"
          icon={<ShieldAlert className="w-4 h-4" />}
        />
        {/* DXY */}
        <MetricCard 
          title="US Dollar (DXY)" 
          subtitle="Global Liquidity Proxy" 
          value={fundamentals?.dxy?.price} 
          change={fundamentals?.dxy?.change} 
          color="orange"
          icon={<Layers className="w-4 h-4" />}
        />
        {/* Yield Curve */}
        <MetricCard 
          title="Yield Spread (10Y-3M)" 
          subtitle="Recession Prob. Marker" 
          value={`${fundamentals?.yieldCurve?.price}%`} 
          change={`${fundamentals?.yieldCurve?.change} bps`} 
          isBps={true}
          color="emerald"
          icon={<Zap className="w-4 h-4" />}
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-500" /> divergence tracker
                </h2>
                <p className="text-xl font-bold text-white tracking-tight">Normalized 6-Month Asset Performance</p>
              </div>
              <div className="flex gap-2">
                 <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-gray-400 border border-white/5">Base 100</div>
              </div>
            </div>
            
            <div className="h-[450px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSPY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGLD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTLT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 5']} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '800' }}
                    labelStyle={{ marginBottom: '8px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '0' }} />
                  
                  <Area type="monotone" dataKey="SPY" name="Equities (SPY)" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSPY)" />
                  <Area type="monotone" dataKey="GLD" name="Gold (GLD)" stroke="#eab308" strokeWidth={4} fillOpacity={1} fill="url(#colorGLD)" />
                  <Area type="monotone" dataKey="TLT" name="Bonds (TLT)" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTLT)" />
                  <Area type="monotone" dataKey="USO" name="Oil (USO)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation Matrix Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-emerald-500" /> Correlation Matrix
                </h2>
                <p className="text-xl font-bold text-white tracking-tight">30-Day Asset Co-movement</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">Pearson (r)</div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-start-2 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">SPY</div>
              <div className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">GLD</div>
              <div className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">USO</div>
              
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">SPY</div>
              <CorrelationCell value={correlationMatrix?.correlations?.SPY?.SPY} />
              <CorrelationCell value={correlationMatrix?.correlations?.SPY?.GLD} />
              <CorrelationCell value={correlationMatrix?.correlations?.SPY?.USO} />

              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">GLD</div>
              <CorrelationCell value={correlationMatrix?.correlations?.GLD?.SPY} />
              <CorrelationCell value={correlationMatrix?.correlations?.GLD?.GLD} />
              <CorrelationCell value={correlationMatrix?.correlations?.GLD?.USO} />

              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">USO</div>
              <CorrelationCell value={correlationMatrix?.correlations?.USO?.SPY} />
              <CorrelationCell value={correlationMatrix?.correlations?.USO?.GLD} />
              <CorrelationCell value={correlationMatrix?.correlations?.USO?.USO} />
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Positive (&gt; 0.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Neutral (-0.2 / 0.2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Negative (&lt; -0.5)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Synthesis Column */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">AI Analysis</h2>
                  <p className="text-xl font-bold text-white tracking-tight">Regime Synthesis</p>
                </div>
            </div>
            
            <div className="flex-grow space-y-6">
              {synthesisLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sinergia dei Dati in corso…</p>
                </div>
              ) : (
                <div 
                  className="text-sm text-gray-300 leading-relaxed font-medium transition-all duration-500 animate-in fade-in"
                  dangerouslySetInnerHTML={{ __html: synthesis }}
                />
              )}
            </div>

            <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Macro Outlook Summary</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                I dati attuali indicano una divergenza significativa. L'oro mantiene una correlazione inversa con le azioni, confermando la sua funzione di "insurance policy" contro l'instabilità valutaria.
              </p>
              <button 
                onClick={() => navigate('/risk-report')}
                className="w-full flex items-center justify-between group py-2.5 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500 transition-colors duration-300 pointer-events-auto cursor-pointer"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-white">Full Risk Report</span>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sub-components
const MetricCard = ({ title, subtitle, value, change, color, icon, isBps = false }) => {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  const isPositive = typeof change === 'string' ? change.startsWith('+') : change > 0;
  
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-xl group hover:border-white/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-4xl font-black text-white tracking-tighter">{value || '--'}</span>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          <span className="text-xs font-black">{change || '0%'}</span>
        </div>
      </div>
    </div>
  );
};

const CorrelationCell = ({ value }) => {
  const getBg = (v) => {
    if (v >= 0.7) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (v >= 0.3) return 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/10';
    if (v <= -0.7) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (v <= -0.3) return 'bg-rose-500/10 text-rose-500/70 border-rose-500/10';
    return 'bg-white/5 text-gray-500 border-white/5';
  };

  return (
    <div className={`h-12 flex items-center justify-center rounded-xl border text-xs font-black transition-all ${getBg(value)}`}>
      {value !== undefined ? value.toFixed(2) : '--'}
    </div>
  );
};

export default MacroDeepDive;
