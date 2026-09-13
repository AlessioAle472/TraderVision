import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import PremiumGate from '../PremiumGate';
import DOMPurify from 'dompurify';

const GlobalCapitalFlowBox = () => {
 const { user } = useAuth();
 const [insight, setInsight] = useState(null);
 const [loading, setLoading] = useState(false);

 const fetchFlow = async () => {
 setLoading(true);
 try {
 const res = await apiClient.getCapitalFlow();
 setInsight(DOMPurify.sanitize ? DOMPurify.sanitize(res.insight) : res.insight);
 } catch (err) {
 console.error('Failed to fetch global capital flow', err);
 } finally {
 setLoading(false);
 }
 };


 return (
 <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-50"/>
 
 <PremiumGate>
 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
 <div>
 <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
 <Globe className="w-6 h-6 text-blue-400"/>
 Global Capital Flow Engine
 </h3>
 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
 Tracking liquidità istituzionale tra Economie Sviluppate ed Emergenti
 </p>
 </div>

 {!insight && !loading && (
 <button 
 onClick={fetchFlow}
 className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
 >
 Analizza Macro Flussi
 </button>
 )}

 {loading && (
 <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-400">
 <Loader2 className="w-4 h-4 animate-spin"/> Elaborazione Aggregati...
 </div>
 )}
 </div>

 {insight && (
 <div className="mt-6 pt-6 relative z-10">
 <div 
 className="text-sm font-medium text-gray-300 leading-relaxed space-y-2 animate-in fade-in slide-in-from-top-4"
 dangerouslySetInnerHTML={{ __html: insight }}
 />
 </div>
 )}
 </PremiumGate>
 </div>
 );
};

export default GlobalCapitalFlowBox;
