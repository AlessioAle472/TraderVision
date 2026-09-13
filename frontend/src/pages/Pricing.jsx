import React from 'react';
import { CheckCircle2, X, Zap, Lock, TrendingUp, Globe, BarChart3, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Feature comparison data ──────────────────────────────────────────────────

const FEATURES = [
  {
    label: 'Asset monitorati',
    free: '3 per categoria',
    pro: 'Illimitati (120+)',
    proHighlight: true,
  },
  {
    label: 'Smart Quant Score',
    free: 'Solo punteggio',
    pro: 'Score + Bias + Setup',
    proHighlight: true,
  },
  {
    label: 'COT Report completo',
    free: false,
    pro: true,
  },
  {
    label: 'Calendario Economico',
    free: 'Limitato',
    pro: 'Completo + High Impact',
    proHighlight: true,
  },
  {
    label: 'Pubblicità',
    free: 'Presente',
    pro: 'Zero annunci',
    proHighlight: true,
  },
  {
    label: 'Segnali AI & Insight',
    free: false,
    pro: true,
  },
  {
    label: 'Geopolitica OSINT',
    free: false,
    pro: true,
  },
  {
    label: 'Aggiornamento dati',
    free: 'Ritardato',
    pro: 'Tempo reale',
    proHighlight: true,
  },
  {
    label: 'Supporto prioritario',
    free: false,
    pro: true,
  },
];

const PRO_HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Accesso a tutti i 120+ asset multi-mercato' },
  { icon: BarChart3, text: 'COT Report CFTC completo, non censurato' },
  { icon: Zap, text: 'Smart Quant + Bias + Setup strategy in tempo reale' },
  { icon: Globe, text: 'Segnali macro, OSINT e Capital Flow AI' },
  { icon: Bell, text: 'Nessuna pubblicità, interfaccia pulita' },
  { icon: Lock, text: 'Tutti gli strumenti futuri inclusi nel piano' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureRow = ({ label, free, pro, proHighlight }) => (
  <div className="grid grid-cols-3 gap-4 py-3.5 border-b border-white/[0.04] last:border-0 items-center">
    <span className="text-sm text-slate-300 font-medium">{label}</span>

    {/* Free */}
    <div className="flex justify-center">
      {free === false ? (
        <X className="w-4 h-4 text-slate-600" />
      ) : (
        <span className="text-xs text-slate-500 font-medium text-center">{free}</span>
      )}
    </div>

    {/* Pro */}
    <div className="flex justify-center">
      {pro === true ? (
        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
      ) : (
        <span className={`text-xs font-bold text-center ${proHighlight ? 'text-indigo-300' : 'text-slate-300'}`}>
          {pro}
        </span>
      )}
    </div>
  </div>
);

// ─── Pricing Page ─────────────────────────────────────────────────────────────

const Pricing = () => {
  const navigate = useNavigate();
  const { effectivePlan, user } = useAuth();
  const isAlreadyPro = effectivePlan === 'pro';

  const [loading, setLoading] = React.useState(false);
  const [interval, setInterval] = React.useState('month'); // 'month' or 'year'

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = (() => {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        return url.endsWith('/api') ? url : `${url}/api`;
      })();
      const res = await fetch(`${apiBase}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interval })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Errore durante il checkout.');
      }
    } catch (err) {
      alert('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Monetizzazione Trader Vision
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
          Un unico terminale quantitativo.<br />
          <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Tutto ciò che ti serve per il trading.
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-base font-medium leading-relaxed">
          Inizia con <strong>7 giorni di prova gratuita</strong>. Sblocca oltre 120+ asset, Smart Quant score,
          COT Report CFTC in tempo reale e AI insights — senza pubblicità.
        </p>

        {/* Interval Selector Toggle */}
        <div className="pt-4 flex justify-center">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-white/[0.08]">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                interval === 'month' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fatturazione Mensile
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                interval === 'year' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Fatturazione Annuale</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                -25%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

        {/* Free Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl p-8 space-y-6">
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Piano Free</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">€0</span>
              <span className="text-slate-500 text-sm">/per sempre</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Ideale per dare uno sguardo iniziale alla piattaforma.</p>
          </div>

          <ul className="space-y-3">
            {[
              'Accesso a soli 3 asset per categoria',
              'Smart Quant Score di base',
              'Calendario economico limitato',
              'Dashboard informativa',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm text-slate-500 line-through">
              <X className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              Nessuna pubblicità
            </li>
          </ul>

          <button
            disabled
            className="w-full py-3 rounded-xl bg-white/5 text-slate-500 text-sm font-black cursor-not-allowed"
          >
            {isAlreadyPro ? 'Piano precedente' : 'Piano attuale'}
          </button>
        </div>

        {/* PRO Card */}
        <div className="relative rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-slate-900/70 backdrop-blur-xl p-8 space-y-6 shadow-2xl shadow-indigo-900/25">
          {/* Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
              {interval === 'year' ? 'Miglior Valore (-25%)' : '7 Giorni di Prova Inclusi'}
            </span>
          </div>

          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/15 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative">
            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Trader Vision PRO</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">
                {interval === 'year' ? '€99,99' : '€16,99'}
              </span>
              <span className="text-slate-400 text-sm">
                {interval === 'year' ? '/anno (€8,33/m)' : '/mese'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              7 giorni gratuiti inclusi. Cancella in qualsiasi momento con un clic.
            </p>
          </div>

          <ul className="space-y-3 relative">
            {PRO_HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-sm text-slate-200">
                <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>

          {isAlreadyPro ? (
            <div className="relative w-full py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-black text-center">
              ✓ Sei già abbonato a PRO
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Elaborazione...' : `Inizia la prova gratuita (${interval === 'year' ? '€99,99/anno' : '€16,99/mese'})`}
            </button>
          )}

          <p className="text-[10px] text-slate-400 text-center relative">
            7 giorni gratuiti — nessuna spesa fino al termine del periodo di prova.
          </p>
        </div>
      </div>

      {/* ── Feature comparison table ───────────────────────────────────── */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-lg font-black text-white text-center">Confronto dettagliato</h2>
        <div className="rounded-2xl border border-white/[0.05] bg-slate-900/40 backdrop-blur-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/[0.05]">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Funzionalità</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Free</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">PRO</span>
          </div>
          <div className="px-6">
            {FEATURES.map((f) => (
              <FeatureRow key={f.label} {...f} />
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ note ──────────────────────────────────────────────────── */}
      <div className="text-center space-y-3 pb-8">
        <p className="text-slate-500 text-sm font-medium">
          Domande? Scrivici a{' '}
          <a href="mailto:support@tradervision.app" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            support@tradervision.app
          </a>
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Torna alla Dashboard
        </button>
      </div>
    </div>
  );
};

export default Pricing;
