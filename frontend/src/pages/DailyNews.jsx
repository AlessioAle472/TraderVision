import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Sparkles, Clock, Mail, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import WorldCalendar from '../components/WorldCalendar';
import AIMarketBriefing from '../components/AIMarketBriefing';

// ── Components ────────────────────────────────────────────────────────────

/**
 * Newsletter Subscription Modal
 */
const SubscriptionModal = ({ isOpen, onClose, onConfirm }) => {
  const [email, setEmail] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-md rounded-3xl border border-slate-700/50 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Ricevi il Market Briefing</h3>
            <p className="text-gray-400 text-sm">Inserisci la tua email per iscriverti.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Sparkles className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="email" 
              placeholder="tuonome@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
          <button 
            disabled={!email || !email.includes('@')}
            onClick={() => { onConfirm(email); setEmail(''); }}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Conferma Iscrizione
          </button>
        </div>

        <p className="mt-6 text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">
          Nessuno Spam. Solo Macro Alpha. Disiscriviti quando vuoi.
        </p>
      </div>
    </div>
  );
};

/**
 * Simple Toast Notification
 */
const Toast = ({ message, visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed bottom-8 right-8 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-right duration-500 flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-white fill-white" />
      </div>
      {message}
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────

const DailyNews = () => {
  const { t, i18n } = useTranslation();
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  
  // Newsletter States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/briefing/latest`);
        const data = await res.json();
        setBriefing(data);
      } catch (err) {
        console.error("Failed to fetch briefing:", err);
      } finally {
        setBriefingLoading(false);
      }
    };
    fetchBriefing();
  }, []);

  const handleSubscribe = async (email) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsModalOpen(false);
        setToast({ visible: true, message: 'Iscrizione confermata! Riceverai il prossimo briefing.' });
        setTimeout(() => setToast({ visible: false, message: '' }), 5000);
      }
    } catch (err) {
      console.error("Newsletter subscription failure:", err);
    }
  };

  const handleForceSend = async () => {
    try {
      setToast({ visible: true, message: 'Flusso AI avviato! Controlla il terminale o la casella email.' });
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/briefing/force-send`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error("Force-send failure:", err);
    } finally {
      setTimeout(() => setToast({ visible: false, message: '' }), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-calendar-gradient shadow-xl shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('sidebar.dailyNews')}</h1>
          </div>
          <p className="text-gray-400 font-medium">
            Analisi macroeconomica avanzata e calendario mercati globali.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
           <Sparkles className="w-4 h-4 text-primary" />
           <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Premium AI Analysis Enabled</span>
        </div>
      </header>

      {/* ── AI Daily Briefing Section ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-4">
           <Zap className="w-4 h-4 text-primary fill-primary" />
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">AI Market Briefing</h3>
        </div>
        <AIMarketBriefing 
          data={briefing} 
          loading={briefingLoading} 
          onSubscribe={() => setIsModalOpen(true)}
          onForceSend={handleForceSend}
        />
      </section>

      {/* ── TradingView Calendar Section ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Real-Time World Calendar</h3>
           </div>
           <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Powered by TradingView</span>
        </div>
        
        <div className="bg-surface rounded-3xl border border-slate-700/50 p-6 shadow-2xl relative">
          <WorldCalendar lang={i18n.language} />
        </div>
      </section>

      {/* ── Modals & Notifications ── */}
      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubscribe} 
      />
      
      <Toast message={toast.message} visible={toast.visible} />

      {/* ── Footer / Legal ── */}
      <footer className="text-center">
        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">
          Trader Vision Advanced Macro Analytics Hub • 2026
        </p>
      </footer>
    </div>
  );
};

export default DailyNews;
