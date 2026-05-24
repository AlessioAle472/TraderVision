import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { Settings, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { resolveTVSymbol } from '../utils/tickerUtils';

const TradingViewWidget = ({ symbol }) => {
 const container = useRef();
 const { user, effectiveIsMaster, effectivePlan } = useAuth();
 const [currentTvSymbol, setCurrentTvSymbol] = useState(null);
 const [isEditing, setIsEditing] = useState(false);
 const [editValue, setEditValue] = useState('');
 const [isLoadingMapping, setIsLoadingMapping] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [widgetError, setWidgetError] = useState(false);
 const [mappingVersion, setMappingVersion] = useState(0);

 useEffect(() => {
 let active = true;

 const loadWidget = async () => {
 setIsLoadingMapping(true);
 setWidgetError(false);

 // 1. Smart Resolver Fallback
 const smartMap = resolveTVSymbol(symbol);
 let finalSymbol = smartMap;

 // 2. Fetch remote Admin mapping override (Priority 1)
 try {
 const mapping = await apiClient.getTickerMapping(symbol);
 if (active && mapping && mapping.tvSymbol) {
 finalSymbol = mapping.tvSymbol;
 }
 } catch (err) {
 console.error("Failed to fetch mapping", err);
 }

 if (!active) return;
 setCurrentTvSymbol(finalSymbol);
 setEditValue(finalSymbol);
 setIsLoadingMapping(false);

 // Clean up previous script if any
 if (container.current) {
 container.current.innerHTML = '';
 }

 const script = document.createElement("script");
 script.src ="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
 script.type ="text/javascript";
 script.async = true;
 script.onerror = () => {
 if (active) setWidgetError(true);
 };
 
 const hideTopToolbar = effectivePlan !== 'pro';

 // HARDCODED LOCKDOWN CONFIGURATION
 script.innerHTML = JSON.stringify({
"autosize": true,
"symbol": finalSymbol,
"interval":"D",
"timezone":"Etc/UTC",
"theme":"dark",
"style":"1",
"locale":"en",
"enable_publishing": false,
"allow_symbol_change": false,
"hide_top_toolbar": hideTopToolbar,
"hide_side_toolbar": hideTopToolbar,
"hide_legend": false,
"save_image": false,
"details": false,
"calendar": false,
"studies": effectivePlan === 'pro' ? [
"RSI@tv-basicstudies",
"MACD@tv-basicstudies",
"MASimple@tv-basicstudies"
 ] : [],
"support_host":"https://www.tradingview.com"
 });
 
 if (container.current) {
 container.current.appendChild(script);
 }
 };

 loadWidget();
 return () => { active = false; };
 }, [symbol, mappingVersion, effectivePlan]);

 const handleSaveMapping = async () => {
 setIsSaving(true);
 try {
 await apiClient.saveTickerMapping(symbol, editValue);
 setIsEditing(false);
 setMappingVersion(v => v + 1);
 } catch (error) {
 const errorMsg = error.response?.data?.error || error.message || 'Errore di rete o server non raggiungibile';
 alert(`Salvataggio fallito: ${errorMsg}`);
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <div className="relative h-full w-full">
 {effectiveIsMaster && (
 <div className="absolute top-2 right-2 z-50">
 {!isEditing ? (
 <button 
 onClick={() => setIsEditing(true)}
 className="p-2 bg-surface/80 hover:bg-surface text-text-secondary hover:text-text rounded-lg backdrop-blur-sm shadow-xl transition-all"
 title="Admin: Fix TradingView Symbol"
 >
 <Settings className="w-4 h-4"/>
 </button>
 ) : (
 <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-xl shadow-2xl backdrop-blur-md">
 <input 
 type="text"
 value={editValue} 
 onChange={(e) => setEditValue(e.target.value)}
 className="bg-background text-text text-xs px-3 py-1.5 rounded-lg focus:outline-none focus: w-40"
 placeholder="e.g. BINANCE:BTCUSDT"
 />
 <button disabled={isSaving} onClick={handleSaveMapping} className="p-1.5 bg-success/20 text-success hover:bg-success/30 rounded-md transition-colors disabled:opacity-50">
 {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
 </button>
 <button disabled={isSaving} onClick={() => setIsEditing(false)} className="p-1.5 bg-danger/20 text-danger hover:bg-danger/30 rounded-md transition-colors disabled:opacity-50">
 <X className="w-4 h-4"/>
 </button>
 </div>
 )}
 </div>
 )}
 
 {isLoadingMapping && (
 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center min-h-[500px] bg-slate-900 rounded-lg">
 <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4"/>
 <span className="text-gray-400 text-sm font-medium animate-pulse">Risoluzione ticker in corso...</span>
 </div>
 )}
 
 {widgetError && (
 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center min-h-[500px] bg-background rounded-lg">
 <AlertCircle className="w-10 h-10 text-danger mb-4 opacity-80"/>
 <span className="text-gray-300 font-bold mb-2">Grafico in aggiornamento</span>
 <span className="text-gray-500 text-xs">Stiamo ripristinando il feed dati per {symbol}</span>
 </div>
 )}

 {/* Il container DEVE essere sempre nel DOM, così il ref è disponibile quando React completa l'update dello stato */}
 <div className="relative h-full w-full"style={{ minHeight: '500px' }}>
 {/* Fallback visibile mentre l'iframe di TV carica (dietro le quinte) */}
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/30 rounded-lg -z-10">
 <RefreshCw className="w-6 h-6 text-slate-500 animate-spin mb-3 opacity-50"/>
 <span className="text-slate-500 text-sm font-medium">Inizializzazione grafico per {currentTvSymbol || symbol}...</span>
 </div>
 
 <div className="tradingview-widget-container h-full w-full absolute inset-0"ref={container}>
 <div className="tradingview-widget-container__widget h-full w-full"></div>
 </div>
 </div>
 </div>
 );
};

export default TradingViewWidget;
