import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { 
  TrendingUp, TrendingDown, AlertCircle, Calendar, 
  ArrowUpRight, ArrowDownRight, Target, Zap, Layers, 
  Activity, ChevronRight, Globe, Clock, ShieldCheck,
  Compass, Radio, Sparkles, Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, YAxis, AreaChart, Area, Tooltip
} from 'recharts';

const MacroCards = ({ data, overview }) => {
  const navigate = useNavigate();
  if (!data) return null;

  const { regime, score, recommendations, trend6m, historicAvg } = data;
  
  // Format sparkline data
  const sparklineData = (trend6m || []).map((val, idx) => ({ 
    value: val, 
    baseline: historicAvg !== undefined ? historicAvg : (trend6m.reduce((a, b) => a + b, 0) / trend6m.length),
    id: idx 
  }));

  const isTrendUp = data.percentChange6m !== undefined ? data.percentChange6m >= 0 : (trend6m && trend6m.length > 0 ? trend6m[trend6m.length - 1] >= 0 : true);
  const trendPercent = data.percentChange6m !== undefined ? data.percentChange6m : 0;

  // Dynamic Risk Score Logic
  let dynamicScore = score || 50;
  let scoreColor = 'text-text';
  let riskStatus = regime || 'ATTESA';
  let riskBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  let riskGlow = 'shadow-amber-500/10';
  
  if (overview && overview.vix && overview.sp500) {
    if (overview.vix.price < 20 && overview.sp500.isUp) {
      dynamicScore = 85;
      scoreColor = 'text-emerald-400';
      riskStatus = 'RISK-ON';
      riskBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      riskGlow = 'shadow-emerald-500/20';
    } else if (overview.vix.price > 25 || !overview.sp500.isUp) {
      dynamicScore = 35;
      scoreColor = 'text-rose-400';
      riskStatus = 'RISK-OFF';
      riskBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      riskGlow = 'shadow-rose-500/20';
    } else {
      dynamicScore = 60;
      scoreColor = 'text-yellow-400';
      riskStatus = 'NEUTRAL';
      riskBg = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      riskGlow = 'shadow-yellow-500/20';
    }
  }

  // Central Banks Events
  const [cbEvents, setCbEvents] = useState([]);
  useEffect(() => {
    const fetchCB = async () => {
      try {
        const banks = await apiClient.getCentralBanks();
        const arr = Object.values(banks).map(cb => {
          let cur = 'USD';
          if (cb.name.includes('ECB')) cur = 'EUR';
          if (cb.name.includes('BOJ')) cur = 'JPY';
          if (cb.name.includes('PBOC')) cur = 'CNY';
          if (cb.name.includes('RBA')) cur = 'AUD';
          if (cb.name.includes('BOC')) cur = 'CAD';
          
          let formattedTime = cb.nextMeeting || 'TBA';
          if (formattedTime !== 'TBA') {
            const parts = formattedTime.split('-');
            const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            if (parts.length >= 2) {
              formattedTime = `${parseInt(parts[0], 10)} ${monthNames[parseInt(parts[1], 10) - 1]}`;
            }
          }
          
          const bankShort = cb.name.includes('(') ? cb.name.split('(')[1].replace(')','') : cb.name;
          return {
            cur,
            event: `${bankShort} Rate Decision`,
            time: formattedTime,
            tone: cb.tone
          };
        });
        setCbEvents(arr.slice(0, 2));
      } catch(e) {
        console.error('Failed to fetch central banks for events', e);
      }
    };
    fetchCB();
  }, []);

  const [globalData, setGlobalData] = useState([]);
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const res = await apiClient.getDashboardData(['VGK', 'EWC', 'MCHI', 'EWA']);
        if (res && res.assets) {
          const mapped = [
            { name: 'Europa', region: 'europe', ticker: 'VGK', color: 'bg-blue-500' },
            { name: 'Canada', region: 'canada', ticker: 'EWC', color: 'bg-red-500' },
            { name: 'Cina', region: 'china', ticker: 'MCHI', color: 'bg-yellow-500' },
            { name: 'Australia', region: 'australia', ticker: 'EWA', color: 'bg-emerald-500' }
          ].map(base => {
            const assetData = res.assets.find(a => a.ticker === base.ticker);
            const s = assetData?.smartScore || 50;
            const changeRaw = assetData?.var1D || 0;
            const isPos = assetData?.var1D >= 0 || changeRaw >= 0;
            const changeStr = (isPos && changeRaw !== 0 ? '+' : '') + changeRaw.toFixed(2) + '%';
            return { ...base, score: s, change: changeStr, data: assetData };
          });
          setGlobalData(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch global mini cards', e);
      }
    };
    fetchGlobal();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Macro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Stato dei Mercati (Enhanced Pro Gauge) */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-surface to-slate-950 p-6 rounded-3xl shadow-2xl flex flex-col justify-between border border-white/10 group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-secondary font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Stato dei Mercati
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shadow-lg ${riskBg} ${riskGlow}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                {riskStatus}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3 mb-2">
              <span className={`text-6xl font-black ${scoreColor} leading-none tracking-tighter font-mono`}>
                {dynamicScore}
              </span>
              <span className="text-text-secondary font-bold text-sm tracking-widest uppercase">/ 100 PTS</span>
            </div>
            
            <div className="text-[10px] text-text-secondary font-black tracking-widest uppercase mb-4">
              Regime: <strong className="text-text">{regime || 'ATTESA'}</strong> • Sincronizzazione Real-Time
            </div>

            {/* Score Slider with glowing pin */}
            <div className="relative w-full pt-2 pb-1">
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 w-full rounded-full opacity-90"></div>
              </div>
              <div 
                className="absolute top-1/2 transition-all duration-1000 ease-out z-10"
                style={{ left: `${dynamicScore}%`, transform: 'translate(-50%, -20%)' }}
              >
                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] border-2 border-slate-900" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/5 mt-4">
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="text-[9px] uppercase tracking-widest font-black text-emerald-400 mb-0.5 flex items-center gap-1">
                🟢 Asset Favoriti dal Regime
              </div>
              <p className="text-xs text-text font-bold truncate">{recommendations?.prefer?.join(' • ') || 'Diversified ETF • Value'}</p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <div className="text-[9px] uppercase tracking-widest font-black text-rose-400 mb-0.5 flex items-center gap-1">
                🔴 Asset a Rischio
              </div>
              <p className="text-xs text-text font-bold truncate">{recommendations?.avoid?.join(' • ') || 'Altissima Volatilità'}</p>
            </div>

            <button 
              onClick={() => navigate('/asset/SPY')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-hover hover:bg-white/10 text-xs font-black uppercase tracking-wider text-text-secondary hover:text-text transition-all mt-1"
            >
              <span>Esplora Diagnostica Macro</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Card 2: 6M Macro Trend & Spread */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-surface to-slate-950 p-6 rounded-3xl shadow-2xl flex flex-col justify-between border border-white/10 group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-secondary font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Direzione Economia (6M)
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono border ${isTrendUp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {isTrendUp ? 'BULLISH SPREAD' : 'BEARISH SPREAD'}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3 mb-1">
              <span className={`text-4xl font-black font-mono tracking-tight ${isTrendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(2)}%
              </span>
              <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Spread EMA20/200</span>
            </div>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-4">
              Divergenza normalizzata con volatilità ATR
            </p>

            <div className="h-28 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="macroGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isTrendUp ? "#10b981" : "#ef4444"} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={isTrendUp ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Area 
                    type="monotone"
                    dataKey="value"
                    stroke={isTrendUp ? "#10b981" : "#ef4444"} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#macroGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4">
            <button 
              onClick={() => navigate('/macro-deep-dive')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-hover hover:bg-white/10 text-xs font-black uppercase tracking-wider text-text-secondary hover:text-text transition-all"
            >
              <span>Macro Deep Dive Completo</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Card 3: Banche Centrali & Catalizzatori */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-surface to-slate-950 p-6 rounded-3xl shadow-2xl flex flex-col justify-between border border-white/10 group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-secondary font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" /> Banche Centrali
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 font-black">
                LIVE POLICY
              </span>
            </div>

            <div className="space-y-3">
              {cbEvents && cbEvents.length > 0 ? cbEvents.map((event, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase font-mono">
                        {event.cur}
                      </span>
                      <span className="text-xs text-text font-black uppercase">{event.event}</span>
                    </div>
                    <div className="text-[10px] text-text-secondary font-mono flex items-center gap-1">
                      <span>Riunione: <strong>{event.time}</strong></span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono border ${event.tone === 'Hawkish' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : event.tone === 'Dovish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                    {event.tone}
                  </span>
                </div>
              )) : (
                <div className="p-6 text-center text-text-secondary text-xs">
                  Nessun evento policy imminente registrato
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4">
            <button 
              onClick={() => navigate('/calendar')}
              className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>Vedi Tutti gli Eventi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Global Outlook Ribbons (4 Geo Spheres) ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {globalData.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(`/macro-analysis/${item.region}`, { state: { regionalScore: item.score, change: item.change, data: item } })}
            className="p-4 rounded-2xl bg-surface border border-white/5 hover:border-primary/30 transition-all shadow-xl cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_rgba(255,255,255,0.4)]`} />
                <span className="text-xs font-black text-text uppercase tracking-wider group-hover:text-primary transition-colors">{item.name}</span>
              </div>
              <span className={`text-xs font-mono font-black ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.change}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-text-secondary uppercase font-bold font-mono">
                <span>Quant Score</span>
                <span className="text-text font-black">{item.score}/100</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden p-0.2">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${item.score >= 60 ? 'bg-emerald-500' : item.score <= 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroCards;
