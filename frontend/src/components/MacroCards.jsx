import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { 
 TrendingUp, 
 TrendingDown, 
 AlertCircle, 
 Calendar, 
 ArrowUpRight, 
 ArrowDownRight,
 Target,
 Zap,
 Layers,
 Activity,
 ChevronRight,
 Globe,
 Clock
} from 'lucide-react';
import { 
 ResponsiveContainer, 
 YAxis,
 AreaChart,
 Area
} from 'recharts';

const MacroCards = ({ data, overview }) => {
 const navigate = useNavigate();
 if (!data) return null;

 const { regime, score, recommendations, trend6m, events, historicAvg } = data;
 
 // Format sparkline data
 const sparklineData = (trend6m || []).map((val, idx) => ({ 
 value: val, 
 baseline: historicAvg !== undefined ? historicAvg : (trend6m.reduce((a, b) => a + b, 0) / trend6m.length),
 id: idx 
 }));
  // isTrendUp ora controlla se lo spread matematico (EMA20-EMA200) attuale è positivo rispetto allo zero.
  const isTrendUp = data.percentChange6m !== undefined ? data.percentChange6m >= 0 : (trend6m && trend6m.length > 0 ? trend6m[trend6m.length - 1] >= 0 : true);
  const trendPercent = data.percentChange6m !== undefined ? data.percentChange6m : 0;

 // Dynamic Risk Score Logic
 let dynamicScore = score || 50;
 let scoreColor = 'text-text';
 let riskStatus = regime || 'ATTESA';
 
 if (overview && overview.vix && overview.sp500) {
 if (overview.vix.price < 20 && overview.sp500.isUp) {
 dynamicScore = 85;
 scoreColor = 'text-emerald-500';
 riskStatus = 'RISK-ON';
 } else if (overview.vix.price > 25 || !overview.sp500.isUp) {
 dynamicScore = 35;
 scoreColor = 'text-rose-500';
 riskStatus = 'RISK-OFF';
 } else {
 dynamicScore = 60;
 scoreColor = 'text-yellow-500';
 riskStatus = 'NEUTRAL';
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
            const isPos = assetData?.var1D >= 0 || changeRaw >= 0; // var1D can be positive or negative
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

  const handleScrollToCalendar = () => {
    navigate('/calendar');
  };

 return (
 <div className="flex flex-col gap-6 mb-8">
 {/* Main Macro Grid */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Card 1: Economic Regime & Score */}
 <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col justify-between group transition-all duration-300">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl transition-colors duration-500"/>
 
 <div>
 <h3 className="text-text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
 <Target className="w-3.5 h-3.5 text-orange-500"/> Stato dei Mercati
 </h3>
 
 <div className="mb-4">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 /20 mb-4">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
 </span>
 <span className="text-xs font-black tracking-widest uppercase">{riskStatus}</span>
 </div>
 <div className="flex items-end gap-2 mb-2">
 <span className={`text-6xl font-black ${scoreColor} leading-none tracking-tighter`}>{dynamicScore}</span>
 <span className="text-text-secondary font-bold text-lg mb-1">/ 100</span>
 </div>
 <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase mb-6">
 Sentiment Dinamico
 </div>

 {/* Score Slider */}
 <div className="relative w-full px-1">
 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex backdrop-blur-sm">
 <div className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-emerald-500 w-full opacity-80"></div>
 </div>
 <div 
 className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-10"
 style={{ left:`${dynamicScore}%`, transform: 'translate(-50%, -50%)' }}
 >
 <div className="w-1.5 h-4 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"/>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-4 pt-6">
 <div className="flex flex-col gap-1">
 <span className="text-[9px] uppercase tracking-widest font-black text-emerald-500/70">🟢 Asset Preferiti</span>
 <p className="text-sm text-text font-semibold leading-relaxed">{recommendations.prefer?.join(' • ') || 'N/A'}</p>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[9px] uppercase tracking-widest font-black text-rose-500/70">🔴 Da Evitare</span>
 <p className="text-sm text-text font-semibold leading-relaxed">{recommendations.avoid?.join(' • ') || 'N/A'}</p>
 </div>
 
 <button 
 onClick={() => navigate('/asset/SPY')}
 className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text transition-all duration-300 hover:scale-105 cursor-pointer pt-2 group/btn"
 >
 Dettagli <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1"/>
 </button>
 </div>
 </div>

 {/* Card 2: 6M Macro Trend */}
 <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col group transition-all duration-300">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-colors duration-500"/>
 
 <h3 className="text-text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
 <Activity className="w-3.5 h-3.5 text-blue-500"/> Direzione Economia (6M)
 </h3>
 
 <div className="flex-grow min-h-[140px] -mx-2">
 <ResponsiveContainer width="100%"height="100%">
 <AreaChart data={sparklineData}>
 <defs>
 <linearGradient id="colorValue"x1="0"y1="0"x2="0"y2="1">
 <stop offset="5%"stopColor={isTrendUp ?"#10b981":"#ef4444"} stopOpacity={0.3}/>
 <stop offset="95%"stopColor={isTrendUp ?"#10b981":"#ef4444"} stopOpacity={0}/>
 </linearGradient>
 </defs>
 <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
 
 {/* Historical Baseline */}
 <Area 
 type="monotone"
 dataKey="baseline"
 stroke="#64748b"
 strokeWidth={1} 
 strokeDasharray="5 5"
 fill="transparent"
 animationDuration={100}
 />

 <Area 
 type="monotone"
 dataKey="value"
 stroke={isTrendUp ?"#10b981":"#ef4444"} 
 strokeWidth={3} 
 fillOpacity={1} 
 fill="url(#colorValue)"
 animationDuration={2000}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 <div className="mt-4 pt-6">
 <div className="flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Var 6M</span>
 <span className="text-xs text-text font-mono">{trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(2)}%</span>
 </div>
 <div className={`flex flex-col items-end ${isTrendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
 <div className="flex items-center gap-1 font-black">
 {isTrendUp ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
 <span className="text-sm">VAR</span>
 </div>
 <span className="text-[9px] uppercase tracking-widest opacity-60">Status: {isTrendUp ? 'BULLISH' : 'BEARISH'}</span>
 </div>
 </div>
 
 <button 
 onClick={() => navigate('/macro-deep-dive')}
 className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text transition-all duration-300 hover:scale-105 cursor-pointer pt-4 group/btn"
 >
 Analisi <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1"/>
 </button>
 </div>
 </div>

 {/* Card 3: Prossimi Eventi */}
 <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col group transition-all duration-300">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl transition-colors duration-500"/>
 
 <h3 className="text-text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
 <Clock className="w-3.5 h-3.5 text-purple-500"/> Prossimi Eventi
 </h3>
 
 <div className="flex flex-col gap-4 flex-grow">
 {cbEvents && cbEvents.length > 0 ? cbEvents.map((event, i) => (
 <div key={i} className="flex items-center gap-4 group/item">
 <div className="flex flex-col items-center">
 <span className="text-[10px] font-black text-white/50">{event.time}</span>
 <div className="w-px h-4 bg-white/10 my-1"/>
 </div>
 <div className="flex-grow">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="px-1.5 py-0.5 rounded-sm bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase">{event.cur}</span>
 <span className="text-[10px] text-text-secondary font-bold uppercase truncate max-w-[120px]">{event.event}</span>
 </div>
 <div className={`text-[8px] uppercase tracking-widest font-black ${event.tone === 'Hawkish' ? 'text-rose-400' : event.tone === 'Dovish' ? 'text-emerald-400' : 'text-yellow-400'}`}>
 {event.tone}
 </div>
 </div>
 <Zap className="w-1.5 h-1.5 rounded-full text-yellow-500 opacity-50"/>
 </div>
 )) : (
 <div className="flex flex-col items-center justify-center flex-grow opacity-50">
 <Layers className="w-6 h-6 text-text-secondary mb-2 opacity-30"/>
 <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">Nessun evento rilevante</p>
 </div>
 )}
 </div>

 <button 
 onClick={handleScrollToCalendar}
 className="mt-6 w-full py-3 rounded-xl bg-purple-500/10 /20 text-purple-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-purple-500 hover:text-white group/btn"
 >
 Calendario Completo <ChevronRight className="inline w-3 h-3 ml-1 transition-transform group-hover/btn:translate-x-1"/>
 </button>
 </div>
 </div>

 {/* Global Outlook Section */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {globalData.map((item, idx) => (
 <div key={idx} className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl flex flex-col gap-3 group transition-colors shadow-xl">
 <div className="flex lg:items-center justify-between gap-2 flex-col lg:flex-row">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
 <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{item.name}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-lg font-black text-text">{item.score}</span>
 <span className={`text-[10px] font-bold ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
 {item.change}
 </span>
 </div>
 </div>
 
 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
 <div className="h-full bg-white/20"style={{ width:`${item.score}%`}} />
 </div>

 <button 
 onClick={() => navigate(`/macro-analysis/${item.region}`, { state: { regionalScore: item.score, change: item.change, data: item } })}
 className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-text transition-all duration-300 hover:scale-105 cursor-pointer self-start group/btn"
 >
 Dettagli <ChevronRight className="w-2.5 h-2.5 transition-transform group-hover/btn:translate-x-1"/>
 </button>
 </div>
 ))}
 </div>
 </div>
 );
};

export default MacroCards;
