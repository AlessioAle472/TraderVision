import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';

const ImpactBadge = ({ impact }) => {
  if (impact === 'HIGH') {
    return <span className="text-red-500 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded">HIGH</span>;
  }
  if (impact === 'MEDIUM') {
    return <span className="text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded">MEDIUM</span>;
  }
  return <span className="text-slate-400 font-bold text-xs bg-slate-500/10 px-2 py-0.5 rounded">LOW</span>;
};

const CustomCalendar = () => {
  // 2. Inizializzazione Sicura dello Stato
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('today'); 
  
  const TOP_COUNTRIES = ['US', 'EU', 'GB', 'DE', 'JP', 'CN', 'CH', 'CA', 'AU', 'NZ', 'All'];
  const [selectedImpacts, setSelectedImpacts] = useState(['HIGH', 'MEDIUM', 'LOW']);
  const [selectedCountries, setSelectedCountries] = useState(TOP_COUNTRIES);

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
      // 4. Try/Catch Inattaccabile sul Fetch
      if (result && Array.isArray(result)) {
         setEvents(result);
      } else {
         setEvents([]);
         console.warn("Dati calendario non sono un array:", result);
      }
    } catch (err) {
      console.error('Error fetching calendar data', err);
      setError('Impossibile caricare il calendario: ' + (err?.message || 'Errore di rete'));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(timeframe);
  }, [timeframe]);

  const toggleImpact = (impact) => {
    setSelectedImpacts(prev => prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact]);
  };

  const toggleCountry = (country) => {
    setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  };

  // 3. Ritorno Anticipato (Early Return) Infallibile
  if (error) return <div className="p-8 text-rose-500 bg-[#0B0E14] h-full min-h-screen">Errore di sistema: {error}</div>;
  if (isLoading) return <div className="p-8 text-white bg-[#0B0E14] h-full min-h-screen animate-pulse">Caricamento motore macro in corso...</div>;
  if (!events || !Array.isArray(events)) return <div className="p-8 text-white bg-[#0B0E14] h-full min-h-screen">Nessun dato formattato ricevuto.</div>;

  const filteredData = events.filter(row => {
    if (!row) return false;
    const rowImpact = row.impact || 'LOW';
    const rowCountry = row.country || 'All';
    return selectedImpacts.includes(rowImpact) && (selectedCountries.includes(rowCountry) || rowCountry === 'All');
  });

  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] bg-[#0B0E14] text-white p-6 font-sans rounded-xl shadow-2xl flex flex-col">
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
              {currentTime.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
          {['yesterday', 'today', 'tomorrow', 'this_week'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === tf ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

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
            {TOP_COUNTRIES.map(country => (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors border ${
                  selectedCountries.includes(country)
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-transparent text-neutral-500 border-white/5 hover:text-neutral-300 hover:border-white/20'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 border-b border-white/5">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Consensus</th>
              <th className="px-4 py-3 font-medium text-right">Previous</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-neutral-500">
                  Nessun evento macroeconomico in programma con i filtri attuali.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-5 text-neutral-400">
                    <div className="flex flex-col">
                      <span>{row.time || '--:--'}</span>
                      {(timeframe === 'this_week' || timeframe === 'yesterday' || timeframe === 'tomorrow') && (
                          <span className="text-[10px] text-neutral-600 uppercase mt-0.5">{row.dateString || ''}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="font-medium text-neutral-300">{row.country || 'ALL'}</span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-200 group-hover:text-white transition-colors">{row.event || 'Unknown Event'}</span>
                      <ImpactBadge impact={row.impact || 'LOW'} />
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right font-semibold text-white">
                    {row.actual || '--'}
                  </td>
                  <td className="px-4 py-5 text-right text-neutral-400">
                    {row.consensus || '--'}
                  </td>
                  <td className="px-4 py-5 text-right text-neutral-500">
                    {row.previous || '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomCalendar;
