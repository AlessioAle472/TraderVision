import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { 
  User, Lock, Mail, Shield, CreditCard, Sparkles, Clock, 
  Calendar, CheckCircle2, AlertTriangle, Download, Trash2, 
  Sliders, Bell, DollarSign, FileText, ChevronRight, RefreshCw,
  ExternalLink, Check, AlertCircle, XCircle
} from 'lucide-react';

const Settings = () => {
  const { 
    user, effectivePlan, isTrialActive, trialDaysRemaining,
    updateProfile, changePassword, updatePreferences, changeSubscription,
    exportUserData, deleteAccount, refreshUser
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');

  // Status & Feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loadingAction, setLoadingAction] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences form
  const [preferencesForm, setPreferencesForm] = useState({
    currency: 'EUR',
    emailBriefing: true,
    macroAlerts: true,
    communityMentions: true,
  });

  // Billing & Subscription state
  const [selectedInterval, setSelectedInterval] = useState('month'); // 'month' or 'year'
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
      if (user.preferences) {
        setPreferencesForm({
          currency: user.preferences.currency || 'EUR',
          emailBriefing: user.preferences.notifications?.emailBriefing ?? true,
          macroAlerts: user.preferences.notifications?.macroAlerts ?? true,
          communityMentions: user.preferences.notifications?.communityMentions ?? true,
        });
      }
      if (user.billingInterval) {
        setSelectedInterval(user.billingInterval);
      }
    }
  }, [user]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 5000);
  };

  // ── Handle Profile Update ──────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const res = await updateProfile({
      name: profileForm.name,
      username: profileForm.username,
    });
    setLoadingAction(false);
    if (res.success) {
      showToast('success', 'Profilo aggiornato con successo.');
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Password Change ────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showToast('error', 'Le nuove password non corrispondono.');
    }
    if (passwordForm.newPassword.length < 8) {
      return showToast('error', 'La nuova password deve contenere almeno 8 caratteri.');
    }

    setLoadingAction(true);
    const res = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setLoadingAction(false);

    if (res.success) {
      showToast('success', 'Password modificata con successo.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Preferences Save ────────────────────────────────────────────────
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const res = await updatePreferences({
      currency: preferencesForm.currency,
      notifications: {
        emailBriefing: preferencesForm.emailBriefing,
        macroAlerts: preferencesForm.macroAlerts,
        communityMentions: preferencesForm.communityMentions,
      }
    });
    setLoadingAction(false);
    if (res.success) {
      showToast('success', 'Preferenze salvate con successo.');
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Subscription Interval Switch ────────────────────────────────────
  const handleSwitchInterval = async (interval) => {
    setSelectedInterval(interval);
    setLoadingAction(true);
    const res = await changeSubscription('switch_interval', interval);
    setLoadingAction(false);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Subscription Cancel / Reactivate ────────────────────────────────
  const handleToggleCancelSubscription = async () => {
    const isCurrentlyCanceled = user?.cancelAtPeriodEnd;
    const action = isCurrentlyCanceled ? 'reactivate' : 'cancel';
    
    if (!isCurrentlyCanceled) {
      const confirmCancel = window.confirm(
        "Sei sicuro di voler disattivare il rinnovo automatico? Manterrai l'accesso a tutte le funzionalità PRO fino al termine del periodo pagato."
      );
      if (!confirmCancel) return;
    }

    setLoadingAction(true);
    const res = await changeSubscription(action);
    setLoadingAction(false);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Stripe Checkout or Portal ───────────────────────────────────────
  const handleStripeCheckout = async () => {
    try {
      setLoadingAction(true);
      const data = await apiClient.createCheckoutSession(selectedInterval);
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('error', data.error || 'Impossibile inizializzare il pagamento Stripe.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Errore durante la connessione con Stripe.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenStripePortal = async () => {
    try {
      setLoadingAction(true);
      const data = await apiClient.createPortalSession();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('error', data.error || 'Impossibile aprire il Portale Clienti Stripe.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Portale Stripe al momento non disponibile.');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Handle GDPR Export ─────────────────────────────────────────────────────
  const handleExportData = async () => {
    setLoadingAction(true);
    const res = await exportUserData();
    setLoadingAction(false);
    if (res.success) {
      showToast('success', 'Download dell\'archivio dati GDPR avviato.');
    } else {
      showToast('error', res.message);
    }
  };

  // ── Handle Delete Account ──────────────────────────────────────────────────
  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      return showToast('error', 'Inserisci la password di conferma.');
    }
    setLoadingAction(true);
    const res = await deleteAccount(deleteConfirmPassword);
    setLoadingAction(false);
    if (!res.success) {
      showToast('error', res.message);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profilo & Sicurezza', icon: User },
    { id: 'subscription', label: 'Abbonamento & Billing', icon: CreditCard, badge: isTrialActive ? `${trialDaysRemaining}g Trial` : null },
    { id: 'preferences', label: 'Preferenze Terminale', icon: Sliders },
    { id: 'privacy', label: 'Privacy & Dati GDPR', icon: Shield },
    { id: 'legal', label: 'Disclaimer & Note Legali', icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          Impostazioni Account
        </h1>
        <p className="text-slate-400 font-medium text-sm mt-1">
          Gestisci profilo, piano di abbonamento, preferenze di mercato e conformità legale.
        </p>
      </div>

      {/* Global Notification Toast */}
      {feedback.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
          feedback.type === 'error' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
          <p className="font-semibold text-sm">{feedback.message}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/[0.08] overflow-x-auto gap-2 pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.04]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: PROFILO & SICUREZZA ────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Informazioni Profilo */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Dettagli Profilo
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              I dati visibili nella community e utilizzati per le comunicazioni di servizio.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Mario Rossi"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Username Community</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm font-bold">@</span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="mariorossi"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Indirizzo Email (Accesso)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-500">L'email dell'account non può essere modificata direttamente per motivi di sicurezza.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loadingAction ? 'Salvataggio...' : 'Salva Profilo'}
                </button>
              </div>
            </form>
          </div>

          {/* Cambio Password */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Sicurezza & Password
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Aggiorna la tua password periodicamente per proteggere il tuo account.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password Attuale</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nuova Password (min. 8 caratteri)</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Conferma Nuova Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loadingAction ? 'Modifica...' : 'Aggiorna Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Master Admin Note */}
          {user?.isMaster && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">Privilegi Master Attivi</h3>
                  <p className="text-xs text-amber-200/70">
                    Il tuo account possiede autorizzazioni amministrative globali e accesso illimitato a tutti i mercati e dati protetti.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ABBONAMENTO & FATTURAZIONE ─────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="space-y-8">
          {/* Status Box */}
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900/60 p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Piano Attuale: {effectivePlan === 'pro' ? 'PRO' : 'FREE'}
                  </span>
                  
                  {isTrialActive && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Prova Gratuita: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Giorno' : 'Giorni'} Rimasti
                    </span>
                  )}

                  {user?.cancelAtPeriodEnd && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-red-500/20 border border-red-500/40 text-red-300">
                      Rinnovo Disattivato
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white">
                  {effectivePlan === 'pro' 
                    ? (isTrialActive ? 'Sei nel tuo periodo di prova gratuita di 7 giorni' : 'Abbonamento TraderVision PRO attivo')
                    : 'Attualmente sei sul piano Base gratuito'}
                </h2>

                <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                  {effectivePlan === 'pro' 
                    ? 'Hai accesso senza limitazioni a oltre 120+ ticker, Smart Quant score, COT report CFTC in tempo reale, geopolitica OSINT e nessun annuncio pubblicitario.'
                    : 'Passa a TraderVision PRO per sbloccare l\'intero terminale con tutti i segnali quantitativi e macroeconomici.'}
                </p>

                {isTrialActive && user?.trialEndsAt && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-200/90 pt-1">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    La tua prova gratuita scade il: {new Date(user.trialEndsAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {user?.stripeCustomerId && (
                  <button
                    onClick={handleOpenStripePortal}
                    disabled={loadingAction}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/[0.08]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Portale Fatture Stripe
                  </button>
                )}

                {effectivePlan === 'pro' && !user?.isMaster && (
                  <button
                    onClick={handleToggleCancelSubscription}
                    disabled={loadingAction}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      user?.cancelAtPeriodEnd
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {user?.cancelAtPeriodEnd ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Riattiva Rinnovo Automatico
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Disdici Rinnovo Automatico
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Selector & Plans */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Scegli la frequenza di fatturazione</h3>
                <p className="text-xs text-slate-400">Modifica o seleziona l'intervallo con cui desideri pagare.</p>
              </div>

              {/* Toggle Monthly / Yearly */}
              <div className="flex items-center bg-black/40 border border-white/[0.08] p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => handleSwitchInterval('month')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    selectedInterval === 'month' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mensile
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchInterval('year')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    selectedInterval === 'year' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annuale</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    -25%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: Monthly */}
              <div className={`p-6 rounded-2xl border transition-all ${
                selectedInterval === 'month' 
                  ? 'border-indigo-500 bg-indigo-500/[0.05] shadow-lg shadow-indigo-500/10' 
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white text-base">PRO Mensile</h4>
                    <p className="text-xs text-slate-400">Massima flessibilità, disdici quando vuoi</p>
                  </div>
                  {selectedInterval === 'month' && (
                    <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-3xl font-black text-white">€10,99</span>
                  <span className="text-slate-400 text-xs font-medium">/mese con IVA</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    7 Giorni di Prova Gratuita inclusi
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    Rinnovo mensile automatico
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    Tutti i 120+ asset quantitativi
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInterval('month');
                    handleStripeCheckout();
                  }}
                  disabled={loadingAction}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30"
                >
                  {isTrialActive ? 'Conferma Mensile al termine del Trial' : 'Attiva Piano Mensile'}
                </button>
              </div>

              {/* Option 2: Yearly */}
              <div className={`p-6 rounded-2xl border relative transition-all ${
                selectedInterval === 'year' 
                  ? 'border-indigo-500 bg-indigo-500/[0.05] shadow-lg shadow-indigo-500/10' 
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}>
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black shadow-md">
                    Risparmia il 25%
                  </span>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white text-base">PRO Annuale</h4>
                    <p className="text-xs text-slate-400">Il piano più vantaggioso per trader attivi</p>
                  </div>
                  {selectedInterval === 'year' && (
                    <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black text-white">€99,99</span>
                  <span className="text-slate-400 text-xs font-medium">/anno (pari a soli €8,33/mese)</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold mb-5">Risparmi oltre €31 all'anno rispetto al mensile</p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    7 Giorni di Prova Gratuita inclusi
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Accesso prioritario ai futuri modelli AI
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Tutti i dati COT & Geopolitica OSINT
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInterval('year');
                    handleStripeCheckout();
                  }}
                  disabled={loadingAction}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30"
                >
                  {isTrialActive ? 'Conferma Annuale al termine del Trial' : 'Attiva Piano Annuale (-25%)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PREFERENZE TERMINALE ──────────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Configurazione Display & Valuta
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Personalizza le unità di calcolo e i canali di notifica del terminale.
            </p>

            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              {/* Currency */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Valuta Base del Portafoglio / Terminale</label>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  {['EUR', 'USD', 'GBP'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPreferencesForm({ ...preferencesForm, currency: curr })}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        preferencesForm.currency === curr 
                          ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  Notifiche & Alert Automatici
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">Daily AI Market Briefing</p>
                      <p className="text-xs text-slate-400">Ricevi una sintesi quantitativa dei mercati ogni mattina alle 07:30 CET.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.emailBriefing}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, emailBriefing: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">Alert Notizie Macro ad Alto Impatto</p>
                      <p className="text-xs text-slate-400">Notifiche istantanee per CPI, NFP, decisioni tassi FED/BCE.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.macroAlerts}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, macroAlerts: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">Menzioni & Interazioni Community</p>
                      <p className="text-xs text-slate-400">Avvisi quando altri trader rispondono o citano le tue analisi.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.communityMentions}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, communityMentions: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loadingAction ? 'Salvataggio...' : 'Salva Preferenze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 4: PRIVACY & DATI GDPR ────────────────────────────────────────── */}
      {activeTab === 'privacy' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Gestione Dati Personali (Regolamento UE 2016/679 - GDPR)
              </h2>
              <p className="text-xs text-slate-400">
                TraderVision garantisce la massima trasparenza sul trattamento dei tuoi dati e la piena conformità alle normative europee.
              </p>
            </div>

            {/* Export data */}
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Diritto alla Portabilità dei Dati (Art. 20 GDPR)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scarica una copia completa in formato JSON di tutti i tuoi dati archiviati (profilo, post, commenti, preferenze).
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={loadingAction}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/[0.08] flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Scarica i Miei Dati (.JSON)
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Diritto all'Oblio & Cancellazione Account (Art. 17 GDPR)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  L'eliminazione dell'account è immediata e irreversibile. Verranno rimossi in modo definitivo il tuo profilo, l'eventuale abbonamento attivo e tutti i contributi condivisi nella community.
                </p>
              </div>

              {!showDeleteModal ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  Elimina Account Definitivamente
                </button>
              ) : (
                <form onSubmit={handleDeleteAccountSubmit} className="p-4 rounded-xl bg-black/40 border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Conferma inserendo la tua password attuale:
                  </div>
                  <input
                    type="password"
                    required
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    placeholder="La tua password attuale"
                    className="w-full px-3.5 py-2 bg-white/[0.05] border border-red-500/30 rounded-xl text-white text-xs focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50"
                    >
                      {loadingAction ? 'Eliminazione...' : 'Conferma e Cancella Dati'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DISCLAIMER & NOTE LEGALI ──────────────────────────────────── */}
      {activeTab === 'legal' && (
        <div className="space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Main Risk Disclosure Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-amber-300 uppercase tracking-wide">
                  Avviso Generale sul Rischio nei Mercati Finanziari (Risk Disclosure)
                </h2>
                <p className="text-[11px] text-amber-200/70">
                  Conformità al D.Lgs. 24 febbraio 1998 n. 58 (TUF) e Direttiva Europea 2014/65/UE (MiFID II)
                </p>
              </div>
            </div>

            <p>
              Il trading di strumenti finanziari, inclusi a titolo esemplificativo azioni, indici azionari, materie prime, valute (Forex) e criptovalute, <strong>comporta un elevatissimo livello di rischio</strong> e può determinare la perdita parziale o totale del capitale investito. Gli strumenti a leva finanziaria (come derivati e CFD) amplificano la volatilità e possono generare perdite rapide e consistenti.
            </p>
            <p>
              L'utente riconosce e accetta che nessun investimento o operazione di trading deve essere intrapresa senza una preventiva e approfondita comprensione della natura dello strumento e dell'entità del rischio a esso associato.
            </p>
          </div>

          {/* Legal Clauses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Nessuna Sollecitazione né Consulenza Finanziaria
              </h3>
              <p>
                Tutti i contenuti, gli indicatori quantitativi, gli Smart Quant score, le analisi geopolitiche OSINT e le informazioni aggregate forniti da TraderVision hanno <strong>scopo puramente didattico, informativo e di supporto all'analisi statistica</strong>.
              </p>
              <p>
                In nessun caso quanto esposto all'interno della piattaforma costituisce sollecitazione al pubblico risparmio, né consulenza finanziaria personalizzata ai sensi della normativa vigente. TraderVision non gestisce conti terzi né riceve ordini esecutivi di compravendita.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Termini dell'Abbonamento & Periodo di Prova
              </h3>
              <p>
                I nuovi utenti registrati hanno diritto a un <strong>periodo di prova gratuito di 7 (sette) giorni</strong>, decorrente dal momento della registrazione, con pieno accesso alle funzionalità PRO.
              </p>
              <p>
                Al termine della prova gratuita o in qualsiasi momento, l'utente può attivare o disattivare il rinnovo dell'abbonamento con addebito mensile (€10,99/mese) o annuale (€99,99/anno). L'annullamento del rinnovo automatico può essere effettuato in qualunque momento dalle presenti impostazioni senza penali.
              </p>
            </div>
          </div>

          {/* Performance Disclaimer */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Esclusione di Garanzia sui Rendimenti Passati
            </h3>
            <p>
              I rendimenti passati e i risultati di backtest mostrati nel terminale <strong>non costituiscono in alcun modo indicatore o garanzia di rendimenti futuri</strong>. Le quotazioni e i dati di mercato provengono da provider terzi e fonti open data e, pur compiendo ogni ragionevole sforzo per verificarne l'accuratezza, TraderVision non si assume alcuna responsabilità per eventuali ritardi, imprecisioni od omissioni.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
