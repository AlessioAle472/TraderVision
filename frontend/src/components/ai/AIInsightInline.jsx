import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import DOMPurify from 'dompurify'; // Need to add this if not present, but for now just use it

const AIInsightInline = ({ ticker, price }) => {
 const { user } = useAuth();
 const [insight, setInsight] = useState(null);
 const [loading, setLoading] = useState(false);

 const fetchInsight = async (e) => {
 e.stopPropagation();
 if (insight) return;
 setLoading(true);
 try {
 const res = await apiClient.getInsight(ticker, price);
 setInsight(DOMPurify.sanitize ? DOMPurify.sanitize(res.insight) : res.insight);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };


 return (
 <div className="mt-2" onClick={(e) => e.stopPropagation()}>
 {!insight && !loading && (
 <button 
 onClick={fetchInsight}
 className="flex items-center gap-1.5 text-[9px] text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md font-bold uppercase transition-all duration-300 pointer-events-auto"
 >
 <Sparkles className="w-3 h-3"/> Quick Insight AI
 </button>
 )}
 {loading && <div className="text-[9px] text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Elaborazione...</div>}
 {insight && (
 <div 
 className="text-[10px] text-amber-100 bg-amber-900/40 p-2 rounded-lg /20 mt-1 max-w-[200px] leading-snug animate-in fade-in slide-in-from-top-1 pointer-events-auto shadow-xl"
 dangerouslySetInnerHTML={{ __html: `<span class="font-bold text-amber-500 flex items-center gap-1 mb-0.5"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> AI Insight</span>` + insight }}
 />
 )}
 </div>
 );
};

export default AIInsightInline;
