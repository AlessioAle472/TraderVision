import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = (() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return url.endsWith('/api') ? url : `${url}/api`;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      return setError('È necessario accettare i Termini e prendere visione del Disclaimer sul rischio.');
    }

    if (password !== confirmPassword) {
      return setError('Le password non corrispondono');
    }

    if (password.length < 8) {
      return setError('La password deve contenere almeno 8 caratteri');
    }

    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/register`, { 
        email, 
        password,
        name: name || undefined,
        acceptedTerms: true
      });
      login(data, data.token);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Errore durante la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text font-inter p-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/10 via-background to-background"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-surface/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
            Trader Vision
          </h1>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Quant Terminal & Market Intelligence</p>
        </div>

        {/* 7-Day Trial Offer Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-indigo-500/5 border border-indigo-500/30 text-indigo-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                7 Giorni di Prova Gratuita PRO Inclusi
              </p>
              <p className="text-indigo-200/80 leading-relaxed">
                Nessuna carta di credito richiesta alla registrazione. Accesso immediato a tutti i 120+ asset quant, COT Report e segnali AI.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nome (opzionale)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="Mario Rossi"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email aziendale o personale</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="mario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password (min. 8 caratteri)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Conferma Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Legal Acceptance Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-400 leading-snug">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/[0.2] bg-white/[0.05] accent-indigo-600 shrink-0 cursor-pointer"
              />
              <span>
                Dichiaro di aver letto e accettato i <Link to="/settings" className="text-indigo-400 hover:underline">Termini di Servizio</Link>, l'Informativa Privacy e prendo visione dell'<strong className="text-slate-300">Avviso sul Rischio Finanziario (TUF / MiFID II)</strong>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creazione account...' : 'Inizia la prova gratuita di 7 giorni'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Hai già un account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">
            Accedi qui
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
