import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TerminalSquare } from 'lucide-react';

const MacroTicker = () => {
 const { t, i18n } = useTranslation();
 const [highImpactEvents, setHighImpactEvents] = useState([]);

 useEffect(() => {
 const fetchTickerData = async () => {
 const date = new Date();
 const year = date.getFullYear();
 const month = date.getMonth();
 const cacheKey =`calendar_events_v2_${year}_${month}`;
 const cacheTimeKey =`calendar_last_fetch_${year}_${month}`;

 const cachedData = localStorage.getItem(cacheKey);
 const lastFetch = localStorage.getItem(cacheTimeKey);

 let data = null;
 if (cachedData && lastFetch) {
 const ageInMs = Date.now() - parseInt(lastFetch, 10);
 if (ageInMs < 12 * 60 * 60 * 1000) {
 try {
 data = JSON.parse(cachedData);
 } catch(e) {}
 }
 }

 if (!data) {
 try {
 const startStr =`${year}-${String(month+1).padStart(2,'0')}-01`;
 const endStr =`${year}-${String(month+1).padStart(2,'0')}-${new Date(year, month+1, 0).getDate()}`;
 const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/calendar?start=${startStr}&end=${endStr}&lang=${i18n.language}`);
 if (res.ok) {
 data = await res.json();
 localStorage.setItem(cacheKey, JSON.stringify(data));
 localStorage.setItem(cacheTimeKey, Date.now().toString());
 }
 } catch(e) {}
 }

 if (data && Array.isArray(data)) {
 const high = data.filter(e => e.impact === 'high' && e.title);
 setHighImpactEvents([...high.slice(0, 15), ...high.slice(0, 15)]); 
 } else {
 setHighImpactEvents([]);
 }
 };

 fetchTickerData();
 
 // Listen to local refresh event (same tab)
 const handleRefresh = () => fetchTickerData();
 window.addEventListener('macro-refresh', handleRefresh);

 // Listen to localstorage updates from other tabs
 const handleStorage = (e) => {
 if (e.key && e.key.startsWith('calendar_events')) {
 fetchTickerData();
 }
 };
 window.addEventListener('storage', handleStorage);
 return () => {
 window.removeEventListener('storage', handleStorage);
 window.removeEventListener('macro-refresh', handleRefresh);
 };
 }, [i18n.language]);

 if (highImpactEvents.length === 0) return null;

 return (
 <div className="flex-1 overflow-hidden flex items-center h-10 mr-4 bg-slate-900/60 rounded-xl /50 px-2 relative hidden md:flex">
 <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 rounded-l-xl"></div>
 
 <div className="flex items-center gap-2 mr-6 z-20 bg-slate-800 px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-widest text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]">
 <TerminalSquare className="w-3.5 h-3.5 text-primary animate-pulse"/>
 Feed Macro in Tempo Reale
 </div>
 
 <div className="whitespace-nowrap flex animate-marquee">
 <div className="flex items-center gap-12 pr-12">
 {highImpactEvents.map((evt, idx) => (
 <div key={idx} className="flex items-center gap-2.5 text-xs">
 <span className="text-gray-500 font-mono tracking-tighter">{evt.time}</span>
 <span className="font-bold text-white uppercase bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{evt.country}</span>
 <span className="text-gray-300 font-medium pl-1">{evt.title}</span>
 
 {evt.ai_projection && (
 <span className="text-danger font-bold uppercase tracking-wider text-[9px] bg-danger/10 px-1.5 py-0.5 rounded flex items-center gap-1 ml-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
 <Sparkles className="w-2.5 h-2.5"/> Avviso Volatilità AI
 </span>
 )}
 </div>
 ))}
 </div>
 </div>
 
 <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10 rounded-r-xl"></div>
 </div>
 );
};

export default MacroTicker;
