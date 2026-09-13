import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import PremiumGate from '../PremiumGate';
import DOMPurify from 'dompurify';

const MacroAlertBanner = () => {
 const { user } = useAuth();
 const [alert, setAlert] = useState(null);

 useEffect(() => {
 const checkAlert = async () => {
 try {
 const res = await apiClient.getStagflationAlert();
 if (res && res.insight) {
 setAlert(DOMPurify.sanitize ? DOMPurify.sanitize(res.insight) : res.insight);
 }
 } catch (err) {
 console.error(err);
 }
 };
 checkAlert();
 }, [user]);

 if (!alert) return null;

 return (
 <div className="bg-rose-500/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.1)] flex gap-4 items-start animate-in fade-in slide-in-from-top-4">
 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[60px] rounded-full pointer-events-none"/>
 
 <PremiumGate>
 <div className="flex gap-4 items-start">
 <div className="p-3 bg-rose-500/20 rounded-xl">
 <AlertTriangle className="w-6 h-6 text-rose-500"/>
 </div>
 
 <div className="space-y-1 relative z-10">
 <h3 className="text-sm font-black text-rose-400 capitalize tracking-wide flex items-center gap-2">
 Alert Macroeconomico Rilevato
 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"/>
 </h3>
 <p 
 className="text-sm text-gray-300 leading-relaxed font-medium"
 dangerouslySetInnerHTML={{ __html: alert }}
 />
 </div>
 </div>
 </PremiumGate>
 </div>
 );
};

export default MacroAlertBanner;
