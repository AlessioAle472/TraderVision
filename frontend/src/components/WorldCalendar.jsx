import React, { useEffect, useRef } from 'react';

/**
 * TradingView Economic Calendar Widget
 * @param {string} lang - Locale language (e.g. 'it', 'en')
 * @param {string} id - HTML ID for the container (useful for anchor scrolls)
 */
const WorldCalendar = ({ lang, id }) => {
  const container = useRef();

  useEffect(() => {
    // Clear previous widget content to avoid double mounting
    if (container.current) {
        container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
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
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sincronizzazione Calendario Mondiale</h3>
         </div>
         <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Powered by TradingView</span>
      </div>
      
      <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <span className="text-gray-500/50 font-black uppercase tracking-widest text-xs">
            Dati calendario non disponibili
          </span>
        </div>
        <div className="tradingview-widget-container" ref={container}>
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>
    </section>
  );
};

export default WorldCalendar;
