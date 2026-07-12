import { Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ProPaywall
 *
 * Wrap a container (e.g. a table or list wrapper) with this component.
 * If `isPaywalled` is true, it adds a faded lock overlay at the bottom.
 *
 * Props:
 *   children      – React nodes (the truncated content)
 *   isPaywalled   – if true, shows the upgrade overlay at the bottom
 *   title         – headline inside the paywall box
 *   subtitle      – subtext inside the paywall box
 */
const ProPaywall = ({
  children,
  isPaywalled = false,
  title = 'Vedi tutti i 120+ asset e i dati Smart Quant con Trader Vision Pro',
  subtitle = 'Accesso illimitato a tutti i mercati, indicatori quantitativi, COT Report e zero pubblicità.',
}) => {
  const navigate = useNavigate();

  if (!isPaywalled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Visible content (truncated by backend) */}
      {children}

      {/* Paywall overlay appended below the content */}
      <div className="relative mt-2">
        {/* Fake blurred rows for visual effect */}
        <div className="h-48 bg-slate-900/20 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden flex flex-col gap-2 p-4 opacity-50 select-none pointer-events-none" aria-hidden="true">
          <div className="h-10 bg-white/5 rounded-lg w-full" />
          <div className="h-10 bg-white/5 rounded-lg w-full" />
          <div className="h-10 bg-white/5 rounded-lg w-full" />
        </div>

        {/* Gradient fade from top */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0B0E14] to-transparent pointer-events-none" />

        {/* Paywall box */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="mx-4 max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl shadow-indigo-900/30 text-center space-y-5">
            {/* Lock icon */}
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-white leading-tight">{title}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{subtitle}</p>
            </div>

            {/* Feature list */}
            <ul className="text-left space-y-2">
              {[
                'Accesso illimitato a tutti gli asset',
                'Nessuna pubblicità',
                'Indicatori quantitativi e COT completi',
                'Segnali Smart Quant in tempo reale',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4" />
              Passa a PRO a 10,99€/mese
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-slate-500">Nessuna carta richiesta per i primi 7 giorni.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProPaywall;
