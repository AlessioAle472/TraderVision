import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const WidgetErrorFallback = ({ title ="Widget Error", onRetry }) => {
 return (
 <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-3xl h-full min-h-[200px]">
 <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
 <AlertCircle className="w-6 h-6 text-rose-500" />
 </div>
 <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
 <p className="text-xs text-gray-400 text-center max-w-[200px] mb-6">
 Non siamo riusciti a caricare i dati per questo widget.
 </p>
 
 {onRetry && (
 <button 
 onClick={onRetry}
 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 rounded-xl transition-colors"
 >
 <RefreshCw className="w-3 h-3" /> Riprova
 </button>
 )}
 </div>
 );
};

export default WidgetErrorFallback;
