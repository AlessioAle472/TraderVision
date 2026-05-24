import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import apiClient from '../../services/apiClient';

const getCountryIcon = (countryCode) => {
  const map = {
    'US': { flag: '🇺🇸', currency: 'USD' },
    'EU': { flag: '🇪🇺', currency: 'EUR' },
    'GB': { flag: '🇬🇧', currency: 'GBP' },
    'DE': { flag: '🇩🇪', currency: 'EUR' },
    'JP': { flag: '🇯🇵', currency: 'JPY' },
    'AU': { flag: '🇦🇺', currency: 'AUD' },
    'CA': { flag: '🇨🇦', currency: 'CAD' },
    'CH': { flag: '🇨🇭', currency: 'CHF' },
    'CN': { flag: '🇨🇳', currency: 'CNY' },
    'NZ': { flag: '🇳🇿', currency: 'NZD' },
  };
  return map[countryCode] || { flag: '🌐', currency: countryCode };
};

const ImpactBadge = ({ impact }) => {
  if (impact === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        HIGH
      </span>
    );
  }
  if (impact === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        MEDIUM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      LOW
    </span>
  );
};

const CustomCalendar = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('today'); // 'yesterday', 'today', 'tomorrow', 'this_week'
  
  const TOP_COUNTRIES = ['US', 'EU', 'GB', 'DE', 'JP', 'CN', 'CH', 'CA', 'AU', 'NZ'];
  const [selectedImpacts, setSelectedImpacts] = useState(['HIGH', 'MEDIUM', 'LOW']);
  const [selectedCountries, setSelectedCountries] = useState(TOP_COUNTRIES);

  const toggleImpact = (impact) => {
    setSelectedImpacts(prev => prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact]);
  };

  const toggleCountry = (country) => {
    setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCalendarData = async (selectedTimeframe = timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.getEconomicCalendar(selectedTimeframe);
      setData(result);
    } catch (err) {
      console.error('Error fetching calendar data', err);
      setError('Unable to load calendar data at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(timeframe);
  }, [timeframe]);

  const getActualColor = (actual, consensus, event) => {
    if (!actual || !consensus || actual === consensus) return 'text-white';
    
    const act = parseFloat(actual.replace(/[^0-9.-]+/g, ""));
    const cons = parseFloat(consensus.replace(/[^0-9.-]+/g, ""));
    if (isNaN(act) || isNaN(cons)) return 'text-white';
    
    // Simplification for jobless claims/unemployment where lower is better
    const isJobless = event.toLowerCase().includes('jobless') || event.toLowerCase().includes('unemployment');
    if (act > cons) return isJobless ? 'text-rose-500' : 'text-emerald-500';
    if (act < cons) return isJobless ? 'text-emerald-500' : 'text-rose-500';
    return 'text-white';
  };

  const filteredData = data.filter(row => {
    return selectedImpacts.includes(row.impact) && selectedCountries.includes(row.country);
  });

  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] bg-[#0B0E14] text-white p-6 font-sans rounded-xl shadow-2xl flex flex-col">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
            ECONOMIC CALENDAR
          </h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider flex items-center gap-2">
            <span>Market Movers</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
            <span className="flex items-center gap-1 text-emerald-400/80">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
          {['yesterday', 'today', 'tomorrow', 'this_week'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === tf 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchCalendarData(timeframe)}
            disabled={isLoading}
            className="p-2 hover:bg-white/5 rounded-md transition-colors border border-transparent hover:border-white/5 text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Impact</span>
          <div className="flex flex-wrap gap-2">
            {['HIGH', 'MEDIUM', 'LOW'].map(impact => (
              <button
                key={impact}
                onClick={() => toggleImpact(impact)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors border ${
                  selectedImpacts.includes(impact)
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-transparent text-neutral-500 border-white/5 hover:text-neutral-300 hover:border-white/20'
                }`}
              >
                {impact}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Countries</span>
          <div className="flex flex-wrap gap-2">
            {TOP_COUNTRIES.map(country => {
              const { flag } = getCountryIcon(country);
              return (
                <button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors border flex items-center gap-1.5 ${
                    selectedCountries.includes(country)
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-neutral-500 border-white/5 hover:text-neutral-300 hover:border-white/20'
                  }`}
                >
                  <span>{flag}</span> {country}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 border-b border-white/5">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Currency</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Consensus</th>
              <th className="px-4 py-3 font-medium text-right">Previous</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-12"></div></td>
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-16"></div></td>
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-48"></div></td>
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-12 ml-auto"></div></td>
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-12 ml-auto"></div></td>
                  <td className="px-4 py-6"><div className="h-3 bg-white/5 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : (
              filteredData.map((row) => {
                const { flag, currency } = getCountryIcon(row.country);
                
                // Calculate if imminent (between 0 and 30 minutes away)
                const timeDiffMs = row.timestamp - currentTime.getTime();
                const isImminent = timeDiffMs > 0 && timeDiffMs <= 30 * 60 * 1000;

                return (
                  <tr key={row.id} className={`hover:bg-white/[0.02] transition-colors group ${row.isPast ? 'opacity-40 hover:opacity-70' : ''} ${isImminent ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-5 text-neutral-400">
                      <div className="flex flex-col">
                        <span>{row.time}</span>
                        {(timeframe === 'this_week' || timeframe === 'yesterday' || timeframe === 'tomorrow') && (
                          <span className="text-[10px] text-neutral-600 uppercase mt-0.5">{row.dateString}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 flex items-center gap-2">
                      <span className="text-lg">{flag}</span>
                      <span className="font-medium text-neutral-300">{currency}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-200 group-hover:text-white transition-colors">{row.event}</span>
                          <ImpactBadge impact={row.impact} />
                        </div>
                        {isImminent && (
                          <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider animate-pulse bg-amber-500/10 w-fit px-2 py-0.5 rounded-sm border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Rilascio imminente, attenzione!!
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-5 text-right font-semibold ${getActualColor(row.actual, row.consensus, row.event)}`}>
                      {row.actual || '--'}
                    </td>
                    <td className="px-4 py-5 text-right text-neutral-400">
                      {row.consensus || '--'}
                    </td>
                    <td className="px-4 py-5 text-right text-neutral-500">
                      {row.previous || '--'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {error && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-danger/80 mb-3" />
            <p className="text-danger/80 font-medium">{error}</p>
            <button onClick={() => fetchCalendarData(timeframe)} className="mt-4 text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-md transition-colors text-white">Try Again</button>
          </div>
        )}

        {!isLoading && !error && filteredData.length === 0 && (
          <div className="py-12 text-center text-neutral-500">
            No economic events found matching the selected filters.
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomCalendar;
