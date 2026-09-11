import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumGate = ({ children }) => {
 const { loading, effectivePlan } = useAuth();
 const navigate = useNavigate();

 if (loading) return null;

 const hasAccess = effectivePlan === 'pro';

 if (hasAccess) {
 return <>{children}</>;
 }

 // Utente free (o non loggato) -> Blur e Paywall
 return (
 <div className="relative group overflow-hidden rounded-3xl">
 <div className="filter blur-md opacity-50 pointer-events-none select-none transition-all duration-500 group-hover:blur-lg">
 {children}
 </div>
 
 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]">
 <div className="bg-surface/95 p-6 sm:p-8 rounded-3xl shadow-2xl text-center max-w-md transform transition-transform duration-300 scale-95 group-hover:scale-100">
 <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
 <Lock className="w-6 h-6 text-primary"/>
 </div>
 <h3 className="text-xl font-bold text-text mb-2 flex items-center justify-center gap-2">
 Funzionalità Premium <Sparkles className="w-4 h-4 text-yellow-500"/>
 </h3>
 <p className="text-sm text-text-secondary mb-6 leading-relaxed">
 Sblocca l'analisi macroeconomica avanzata e l'intelligenza artificiale quantitativa passando al piano Pro.
 </p>
 <button 
 onClick={() => navigate('/pricing')}
 className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
 >
 Sblocca Accesso
 </button>
 </div>
 </div>
 </div>
 );
};

export default PremiumGate;
