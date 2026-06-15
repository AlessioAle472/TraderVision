import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import PremiumGate from '../PremiumGate';
import DOMPurify from 'dompurify';

const CryptoDivergenceInsights = () => {
 const { user } = useAuth();
 const [insight, setInsight] = useState(null);
 const [loading, setLoading] = useState(false);

 const fetchDivergence = async () => {
 setLoading(true);
 try {
 const res = await apiClient.getCryptoDivergence();
 setInsight(DOMPurify.sanitize ? DOMPurify.sanitize(res.insight) : res.insight);
 } catch (err) {
 console.error('Failed to fetch crypto divergence', err);
 } finally {
 setLoading(false);
 }
 };

 if (user?.role !== 'admin') return null;

 return (
 <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 mb-6 shadow-2xl relative overflow-hidden group">
 {/* Background effects */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"/>
 
 <PremiumGate>
 <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
 <div>
 <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tighter">
 <Sparkles className="w-4 h-4 text-emerald-400"/> AI Crypto Divergence
 </h3>
 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
 Analisi strutturale Bitcoin vs Altcoin Dominance
 </p>
 </div>

 {!insight && !loading && (
 <button 
 onClick={fetchDivergence}
 className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg"
 >
 Analizza Divergenza Altcoin
 </button>
 )}

 {loading && (
 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
 <Loader2 className="w-3 h-3 animate-spin"/> Elaborazione modello quantitativo...
 </div>
 )}
 </div>

 {insight && (
 <div 
 className="mt-4 pt-4 text-sm font-medium text-gray-300 leading-relaxed animate-in fade-in slide-in-from-top-2"
 dangerouslySetInnerHTML={{ __html: insight }}
 />
 )}
 </PremiumGate>
 </div>
 );
};

export default CryptoDivergenceInsights;
