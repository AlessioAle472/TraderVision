import { X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdBanner
 *
 * Renders a placeholder ad banner only for Free users.
 * PRO users never see this component (returns null).
 *
 * Props:
 *   variant  – 'horizontal' (default) | 'compact'
 *   dismissible – allow user to close for the session (default true)
 */
const AdBanner = ({ variant = 'horizontal', dismissible = true }) => {
  const { effectivePlan } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Never render for PRO users
  if (effectivePlan === 'pro') return null;
  if (dismissed) return null;

  if (variant === 'compact') {
    return (
      <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800/60 border border-white/5 rounded-xl text-xs text-slate-500 backdrop-blur-sm">
        <span className="font-medium">
          📢 <span className="text-slate-400">Spazio Pubblicitario</span> —{' '}
          <button
            onClick={() => navigate('/pricing')}
            className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 transition-colors"
          >
            Rimuovi con il piano PRO
          </button>
        </span>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-0.5 text-slate-600 hover:text-slate-300 transition-colors"
            aria-label="Chiudi banner"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className="relative flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-900/60 border border-white/[0.04] backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/20 to-transparent pointer-events-none" />

      {/* Ad placeholder visual */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-700/50 border border-white/5 flex items-center justify-center text-slate-500 text-lg">
        📢
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
          Spazio Pubblicitario
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          Questo spazio è visibile solo agli utenti Free. Aggiorna il tuo piano per rimuoverlo.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/pricing')}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-black transition-all hover:shadow-lg hover:shadow-indigo-600/20"
      >
        <Zap className="w-3 h-3" />
        Rimuovi
      </button>

      {/* Dismiss */}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Chiudi banner pubblicitario"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AdBanner;
