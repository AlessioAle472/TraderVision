import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Clock, LayoutList, Radio, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import ProPaywall from '../ProPaywall';

const ImpactBadge = ({ impact }) => {
  if (impact === 'HIGH') {
    return <span className="text-red-500 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">HIGH</span>;
  }
  if (impact === 'MEDIUM') {
    return <span className="text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">MEDIUM</span>;
  }
  return <span className="text-slate-400 font-bold text-xs bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">LOW</span>;
};

const TradingViewStreamWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: '650',
      locale: 'it',
      importanceFilter: '0,1',
      countryFilter: 'us,eu,gb,de,fr,it,jp,ch,ca,au'
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#0D1117] border border-white/10 p-2 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 text-xs text-neutral-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-medium">Feed Ufficiale TradingView</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">Streaming WebSocket Zero-Latency</span>
        </span>
        <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Identico a Investing.com</span>
      </div>
      <div ref={containerRef} className="tradingview-widget-container min-h-[650px] w-full" />
    </div>
  );
};

const CustomCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('today');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'stream'
  
  const TOP_COUNTRIES = ['US', 'EU', 'GB', 'DE', 'FR', 'IT', 'JP', 'CN', 'CH', 'CA', 'AU', 'NZ', 'All'];
  const [selectedImpacts, setSelectedImpacts] = useState(['HIGH', 'MEDIUM', 'LOW']);
  const [selectedCountries, setSelectedCountries] = useState(TOP_COUNTRIES);
  const [isPaywalled, setIsPaywalled] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCalendarData = async (selectedTimeframe = timeframe, silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const result = await apiClient.getEconomicCalendar(selectedTimeframe);
      if (result && result.events && Array.isArray(result.events)) {
         setEvents(result.events);
         setIsPaywalled(result.paywalled);
      } else if (result && Array.isArray(result)) {
         setEvents(result);
      } else if (!silent) {
         setEvents([]);
         console.warn("Dati calendario invalidi:", result);
      }
    } catch (err) {
      console.error('Error fetching calendar data', err);
      if (!silent) {
        setError('Impossibile caricare il calendario: ' + (err?.message || 'Errore di rete'));
        setEvents([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCalendarData(timeframe, false);
    // Polling automatico ogni 30 secondi per aggiornare i dati Actual in tempo reale
    const interval = setInterval(() => {
      fetchCalendarData(timeframe, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const toggleImpact = (impact) => {
    setSelectedImpacts(prev => prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact]);
  };

  const toggleCountry = (country) => {
    if (country === 'All') {
      if (selectedCountries.includes('All')) {
        setSelectedCountries([]);
      } else {
        setSelectedCountries(TOP_COUNTRIES);
      }
      return;
    }
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country && c !== 'All');
      } else {
        const next = [...prev, country];
        if (TOP_COUNTRIES.filter(c => c !== 'All').every(c => next.includes(c))) {
          return [...next, 'All'];
        }
        return next;
      }
    });
  };

  if (error) return <div className="p-8 text-rose-500 bg-[#0B0E14] h-full min-h-screen">Errore di sistema: {error}</div>;
  if (isLoading) return <div className="p-8 text-white bg-[#0B0E14] h-full min-h-screen animate-pulse">Caricamento motore macro in tempo reale...</div>;
  if (!events || !Array.isArray(events)) return <div className="p-8 text-white bg-[#0B0E14] h-full min-h-screen">Nessun dato formattato ricevuto.</div>;

  const COUNTRY_MAP = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA',
    AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN', CNH: 'CN',
  };

  const filteredData = events.filter(row => {
    if (!row) return false;
    const rowImpact = row.impact || 'LOW';
    let rowCountry = (row.country || 'All').trim().toUpperCase();
    if (COUNTRY_MAP[rowCountry]) rowCountry = COUNTRY_MAP[rowCountry];
    const isImpactMatch = selectedImpacts.includes(rowImpact);
    const isCountryMatch = selectedCountries.includes('All') || selectedCountries.includes(rowCountry) || rowCountry === 'ALL';
    return isImpactMatch && isCountryMatch;
  });

  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] bg-[#0B0E14] text-white p-6 font-sans rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            CALENDARIO ECONOMICO
          </h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider flex items-center gap-2">
            <span>Market Movers</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Clock className="w-3 h-3 animate-pulse" />
              {currentTime.toLocaleTimeString()} • DATI REALI (ACTUAL) LIVE
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selettore Vista */}
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Tabella TraderVision
            </button>
            <button
              onClick={() => setViewMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'stream' ? 'bg-primary text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Live Streaming Widget
            </button>
          </div>

          {/* Timeframe solo per vista tabella */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {[
                { id: 'yesterday', label: 'IERI' },
                { id: 'today', label: 'OGGI' },
                { id: 'tomorrow', label: 'DOMANI' },
                { id: 'this_week', label: 'QUESTA SETTIMANA' }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeframe === tf.id ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
              <button
                onClick={() => fetchCalendarData(timeframe, false)}
                title="Ricarica ora i dati macro"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-1 border-l border-white/10 pl-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vista Streaming Widget TradingView */}
      {viewMode === 'stream' ? (
        <TradingViewStreamWidget />
      ) : (
        <>
          {/* Filtri Impatto e Paesi */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Impatto Volatilità</span>
              <div className="flex flex-wrap gap-2">
                {['HIGH', 'MEDIUM', 'LOW'].map(impact => (
                  <button
                    key={impact}
                    onClick={() => toggleImpact(impact)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors border ${
                      selectedImpacts.includes(impact)
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-transparent text-neutral-500 border-white/5 hover:text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    {impact}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Paesi Selezionati</span>
              <div className="flex flex-wrap gap-1.5">
                {TOP_COUNTRIES.map(country => (
                  <button
                    key={country}
                    onClick={() => toggleCountry(country)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors border ${
                      selectedCountries.includes(country)
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-transparent text-neutral-500 border-white/5 hover:text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabella Dati */}
          <ProPaywall isPaywalled={isPaywalled}>
            <div className="overflow-x-auto relative rounded-xl border border-white/5 bg-[#0D1117]/50">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 bg-white/[0.02] border-b border-white/10">
                    <th className="px-4 py-3 font-medium">Ora</th>
                    <th className="px-4 py-3 font-medium">Paese</th>
                    <th className="px-4 py-3 font-medium">Evento Macroeconomico</th>
                    <th className="px-4 py-3 font-medium text-right text-emerald-400">Effettivo (Actual)</th>
                    <th className="px-4 py-3 font-medium text-right">Previsione (Consensus)</th>
                    <th className="px-4 py-3 font-medium text-right text-neutral-400">Precedente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-neutral-500">
                        Nessun evento macroeconomico in programma per i filtri selezionati.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-4 py-4 text-neutral-300 font-mono text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold">{row.time || '--:--'}</span>
                            {(timeframe === 'this_week' || timeframe === 'yesterday' || timeframe === 'tomorrow') && (
                              <span className="text-[10px] text-neutral-500 uppercase mt-0.5">{row.dateString || ''}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-xs uppercase bg-slate-800 border border-slate-700 text-slate-200 px-2 py-0.5 rounded">
                            {row.country || 'ALL'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{row.event || 'Evento Macro'}</span>
                            <ImpactBadge impact={row.impact || 'LOW'} />
                          </div>
                        </td>
                        <td className={`px-4 py-4 text-right font-mono font-bold text-sm ${row.actual ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          {row.actual ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              {row.actual}
                            </span>
                          ) : (
                            <span>--</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-neutral-300">
                          {row.consensus || '--'}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-neutral-500">
                          {row.previous || '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ProPaywall>
        </>
      )}
    </div>
  );
};

export default CustomCalendar;
