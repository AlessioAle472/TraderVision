import { useEffect, useRef } from 'react';
import { AlertTriangle, Ban, X } from 'lucide-react';

const STRIKE_MESSAGES = [
  {
    title: '⚠️ Contenuto non consentito',
    desc: 'Il tuo messaggio contiene termini non ammessi dalla nostra policy. Per favore modifica il tuo post.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    title: '⚠️ Secondo avvertimento',
    desc: 'Questo è il tuo secondo avvertimento. Continuare a violare la policy potrebbe portare alla sospensione del tuo account.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
  },
  {
    title: '🚨 Terzo avvertimento — Attenzione!',
    desc: 'Stai accumulando strike. Al 5° strike il tuo account verrà sospeso temporaneamente. Rispetta le regole della community.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
  {
    title: '🚨 Penultimo avvertimento!',
    desc: 'Sei a un passo dalla sospensione. Il prossimo contenuto non conforme blockerà il tuo account. Questa è la tua ultima chance.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
  },
];

const BAN_STATE = {
  title: '🚫 Account Sospeso',
  desc: "Hai raggiunto il limite massimo di violazioni della policy. Il tuo account è stato temporaneamente sospeso e non puoi più pubblicare nella Community.",
  color: '#ef4444',
  bg: 'rgba(239,68,68,0.08)',
  border: 'rgba(239,68,68,0.35)',
};

/**
 * ModerationWarning
 * Props:
 *  - strikes: number (current strike count, 1-5)
 *  - isBanned: boolean
 *  - matchedTerm: string (the blocked word)
 *  - onClose: () => void
 */
const ModerationWarning = ({ strikes, isBanned, matchedTerm, onClose }) => {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const config = isBanned
    ? BAN_STATE
    : STRIKE_MESSAGES[Math.min(strikes - 1, STRIKE_MESSAGES.length - 1)];

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: '#0f172a',
          border: `1px solid ${config.border}`,
          boxShadow: `0 0 40px ${config.color}22`,
        }}
      >
        {/* Close button */}
        {!isBanned && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
          style={{ background: config.bg, border: `1px solid ${config.border}` }}
        >
          {isBanned
            ? <Ban className="w-7 h-7" style={{ color: config.color }} />
            : <AlertTriangle className="w-7 h-7" style={{ color: config.color }} />
          }
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          {config.title}
        </h2>

        {/* Strike badge */}
        {!isBanned && (
          <div className="flex justify-center mb-4">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
            >
              Strike {strikes} / 5
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-300 text-sm text-center leading-relaxed mb-2">
          {config.desc}
        </p>

        {/* Matched term info */}
        {matchedTerm && !isBanned && (
          <p className="text-xs text-gray-500 text-center mb-5">
            Termine rilevato:{' '}
            <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: config.bg, color: config.color }}>
              {matchedTerm}
            </span>
          </p>
        )}

        {/* Strike progress pips */}
        {!isBanned && (
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  background: i < strikes ? config.color : 'rgba(255,255,255,0.08)',
                  boxShadow: i < strikes ? `0 0 6px ${config.color}88` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: isBanned ? config.bg : `linear-gradient(135deg, ${config.color}, ${config.color}bb)`,
            color: isBanned ? config.color : '#fff',
            border: isBanned ? `1px solid ${config.border}` : 'none',
          }}
        >
          {isBanned ? 'Chiudi' : 'Ho capito'}
        </button>
      </div>
    </div>
  );
};

export default ModerationWarning;
