import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { Settings, Check, X, RefreshCw, AlertCircle, Lock, ShieldCheck, Activity } from 'lucide-react';
import { resolveTVSymbol } from '../utils/tickerUtils';

const TIMEFRAME_OPTIONS = [
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D', isDefault: true },
  { label: '1W', value: 'W' },
  { label: '1M', value: 'M' }
];

const TradingViewWidget = ({ symbol, defaultTimeframe = 'D' }) => {
  const container = useRef();
  const { effectiveIsMaster } = useAuth();
  const [currentTvSymbol, setCurrentTvSymbol] = useState(null);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
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

      // 1. Smart Resolver Fallback from curated catalog
      const smartMap = resolveTVSymbol(symbol);
      let finalSymbol = smartMap;

      // 2. Fetch remote Admin mapping override (Priority 1)
      try {
        const mapping = await apiClient.getTickerMapping(symbol);
        if (active && mapping && mapping.tvSymbol) {
          finalSymbol = mapping.tvSymbol;
        }
      } catch (err) {
        console.error('Failed to fetch custom mapping:', err);
      }

      if (!active) return;
      setCurrentTvSymbol(finalSymbol);
      setEditValue(finalSymbol);
      setIsLoadingMapping(false);

      // Clean up previous script/iframe if any and ensure container has .tradingview-widget-container__widget child
      if (container.current) {
        container.current.innerHTML = '';
        const widgetChild = document.createElement('div');
        widgetChild.className = 'tradingview-widget-container__widget';
        widgetChild.style.height = '100%';
        widgetChild.style.width = '100%';
        widgetChild.style.backgroundColor = '#000000';
        container.current.appendChild(widgetChild);
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onerror = () => {
        if (active) setWidgetError(true);
      };

      // INSTITUTIONAL CONFIGURATION WITH PRELOADED DAILY TF & PURE BLACK THEME
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: finalSymbol,
        interval: timeframe,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'it',
        backgroundColor: '#000000',
        gridColor: 'rgba(255, 255, 255, 0.04)',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_top_toolbar: false,
        hide_side_toolbar: true,
        hide_legend: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: 'https://www.tradingview.com'
      });

      if (container.current) {
        container.current.appendChild(script);
      }
    };

    loadWidget();
    return () => {
      active = false;
    };
  }, [symbol, mappingVersion, timeframe]);

  const handleSaveMapping = async () => {
    setIsSaving(true);
    try {
      await apiClient.saveTickerMapping(symbol, editValue);
      setIsEditing(false);
      setMappingVersion((v) => v + 1);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Errore di rete o server non raggiungibile';
      alert(`Salvataggio fallito: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Institutional Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/95 border-b border-white/10 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Live Feed Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Feed
          </div>

          {/* Resolved TV Symbol Badge */}
          <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-text font-mono text-xs font-bold tracking-tight">
            {currentTvSymbol || symbol}
          </div>

          {/* Quick Timeframe Switcher (Default: Daily) */}
          <div className="flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-lg border border-white/10">
            {TIMEFRAME_OPTIONS.map(tf => {
              const isActive = timeframe === tf.value;
              return (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Timeframe ${tf.label} (Precaricato: Daily)`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Indicator Presets Pill */}
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-text-secondary bg-black/50 px-2.5 py-1 rounded-md border border-white/10">
            <span className="text-sky-400 font-bold">MA 50</span>
            <span className="text-white/20">•</span>
            <span className="text-indigo-400 font-bold">RSI 14</span>
            <span className="text-white/20">•</span>
            <span className="text-emerald-400 font-bold">Vol</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Info Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-zinc-900 border border-white/10" title="Timeframe precaricato: Daily">
            <Activity className="w-2.5 h-2.5 text-indigo-400" />
            <span>TF: {TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label || timeframe}</span>
          </div>

          {/* Admin Override Settings */}
          {effectiveIsMaster && (
            <div className="relative">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-lg transition-all"
                  title="Admin: Modifica simbolo TradingView"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900 rounded-lg shadow-2xl border border-white/15">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-black text-white text-xs px-2.5 py-1 rounded focus:outline-none w-36 font-mono border border-white/10"
                    placeholder="e.g. OANDA:XAUUSD"
                  />
                  <button
                    disabled={isSaving}
                    onClick={handleSaveMapping}
                    className="p-1 bg-success/20 text-success hover:bg-success/30 rounded transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={() => setIsEditing(false)}
                    className="p-1 bg-danger/20 text-danger hover:bg-danger/30 rounded transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoadingMapping && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black rounded-2xl gap-3">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase animate-pulse">
            Sincronizzazione Grafico Quant...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {widgetError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black rounded-2xl gap-3">
          <AlertCircle className="w-9 h-9 text-danger opacity-80" />
          <span className="text-text font-bold text-sm">Grafico in riallineamento</span>
          <span className="text-text-secondary text-xs">Ripristino feed dati per {symbol}</span>
        </div>
      )}

      {/* TradingView Container */}
      <div className="relative flex-1 w-full overflow-hidden bg-black" style={{ minHeight: '480px' }}>
        {/* Background placeholder while iframe loads */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black -z-10 gap-2">
          <RefreshCw className="w-5 h-5 text-slate-600 animate-spin opacity-40" />
          <span className="text-slate-600 text-xs font-medium">Caricamento interfaccia quantitativa...</span>
        </div>

        <div className="tradingview-widget-container h-full w-full absolute inset-0 bg-black" ref={container}>
          <div className="tradingview-widget-container__widget h-full w-full bg-black"></div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewWidget;
