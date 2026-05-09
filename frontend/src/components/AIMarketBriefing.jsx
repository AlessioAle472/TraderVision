import React from 'react';
import { Zap, Clock, Mail, ChevronRight } from 'lucide-react';

/**
 * AIMarketBriefing - Reusable AI insight component
 * @param {Object} data - Briefing object {title, bullets, timestamp}
 * @param {boolean} loading - Loading state
 * @param {function} onSubscribe - Handler for subscription button
 * @param {function} onForceSend - Handler for force-send button (optional)
 */
const AIMarketBriefing = ({ data, loading, onSubscribe, onForceSend }) => {
  if (loading) {
    return (
      <div className="w-full h-[280px] rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-md animate-pulse flex items-center justify-center">
         <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Analisi AI in corso...</span>
         </div>
      </div>
    );
  }

  // Return null if there is no actual data
  if (!data?.title && (!Array.isArray(data?.bullets) || data.bullets.length === 0)) {
    return null;
  }

  // Fallback data if incomplete
  const title = data?.title || "Mercati in Stasi: Nessun Aggiornamento Rilevante";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : ["Attendendo dati macro dall'AI..."];
  const timestamp = data?.timestamp || "---";

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-2xl transition-all hover:border-indigo-500/30">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="flex flex-col lg:flex-row">
        {/* Cover Section (Compact for Dashboard) */}
        <div className="lg:w-1/4 h-32 lg:h-auto relative overflow-hidden bg-slate-800/50">
          <img 
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80" 
            alt="Finance" 
            className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r lg:bg-gradient-to-l from-slate-900 via-transparent to-transparent"></div>
          <div className="absolute top-4 left-4">
             <div className="flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-400">
                <Zap className="w-3 h-3 fill-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Macro Alpha</span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 lg:p-8 relative z-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] mb-3 uppercase tracking-widest font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Ultimo aggiornamento: {timestamp}</span>
          </div>
          
          <h2 className="text-xl lg:text-2xl font-black text-white mb-4 italic leading-tight">
            "{title}"
          </h2>

          <div className="space-y-2 mb-6">
            {bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  {bullet}
                </p>
              </div>
            ))}
          </div>

          {onForceSend && (
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={onForceSend}
                className="px-5 py-2.5 rounded-xl font-black text-gray-500 border border-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all text-[10px] uppercase tracking-widest"
              >
                Sync Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMarketBriefing;
