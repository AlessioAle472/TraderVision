import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * TradingView Economic Calendar Widget
 * @param {string} lang - Locale language (e.g. 'it', 'en')
 * @param {string} id - HTML ID for the container (useful for anchor scrolls)
 */
const WorldCalendar = ({ lang, id }) => {
  const container = useRef();
  const [error, setError] = useState(false);

  useEffect(() => {
    // Clear previous widget content to avoid double mounting
    if (container.current) {
        container.current.innerHTML = '';
    }
    setError(false);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.onerror = () => setError(true);
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": "600",
      "colorTheme": "dark",
      "isTransparent": true,
      "locale": lang || "it",
      "importanceFilter": "-1,0,1",
      "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,CHF"
    });
    
    container.current.appendChild(script);
  }, [lang]);

  return (
    <section id={id} className="space-y-6 pt-10 border-t border-white/5">
      <div className="flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-danger' : 'bg-emerald-500 animate-pulse'}`}></div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sincronizzazione Calendario Mondiale</h3>
         </div>
         <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Powered by TradingView</span>
      </div>
      
      <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl relative min-h-[100px]">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 gap-3">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="font-medium text-sm">Dati non disponibili al momento</p>
          </div>
        ) : (
          <div className="tradingview-widget-container" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WorldCalendar;
