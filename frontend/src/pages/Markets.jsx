import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Sparkline from '../components/Sparkline';
import { SkeletonCard, SkeletonRow } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useMarkets } from '../hooks/useApiQuery';
import ErrorBoundary from '../components/ErrorBoundary';
import WidgetErrorFallback from '../components/WidgetErrorFallback';
import AIInsightInline from '../components/ai/AIInsightInline';
import CryptoDivergenceInsights from '../components/ai/CryptoDivergenceInsights';
import MacroAlertBanner from '../components/ai/MacroAlertBanner';
import GlobalCapitalFlowBox from '../components/ai/GlobalCapitalFlowBox';
import ProPaywall from '../components/ProPaywall';
import AdBanner from '../components/AdBanner';

// ─── Utilities ────────────────────────────────────────────────────────────────

const getScoreStyle = (score) => {
  if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', glow: 'shadow-emerald-500/30', label: 'BUY', color: '#10b981' };
  if (score >= 60) return { text: 'text-green-400', bg: 'bg-green-500', bgLight: 'bg-green-500/10', glow: 'shadow-green-500/20', label: 'BUY', color: '#22c55e' };
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', glow: 'shadow-amber-500/20', label: 'NEUTRAL', color: '#f59e0b' };
  if (score >= 20) return { text: 'text-rose-400', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', glow: 'shadow-rose-500/20', label: 'SELL', color: '#f43f5e' };
  return { text: 'text-rose-600', bg: 'bg-rose-700', bgLight: 'bg-rose-700/10', glow: 'shadow-rose-700/20', label: 'SELL', color: '#e11d48' };
};

// Setup strategy mapping from momentum/score
const getSetupLabel = (score, momentum) => {
  if (score >= 70 && momentum >= 2) return 'Trend Following';
  if (score >= 60 && momentum >= 0) return 'Momentum Burst';
  if (score >= 40 && score < 60) return 'Mean Reversion';
  if (score < 40 && momentum < 0) return 'Short Bias';
  if (momentum > 1.5) return 'Breakout';
  return 'Consolidation';
};

// ─── SmartQuant Indicator (Circle + Label) ────────────────────────────────────

const SmartQuantIndicator = ({ score, label }) => {
  const styles = getScoreStyle(score);
  const circumference = 2 * Math.PI * 18; // r=18
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      {/* SVG Circle */}
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" strokeWidth="3.5" stroke="rgba(255,255,255,0.05)" fill="none" />
          <circle
            cx="22" cy="22" r="18"
            strokeWidth="3.5"
            stroke={styles.color}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${styles.color}80)`, transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
          {score}
        </span>
      </div>
      {/* Label */}
      <span className={`text-[10px] font-black uppercase tracking-wider ${styles.text}`}>
        {styles.label}
      </span>
    </div>
  );
};

// ─── Bias Pill ────────────────────────────────────────────────────────────────

const BiasPill = ({ score }) => {
  const styles = getScoreStyle(score);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles.bgLight} ${styles.text}`}>
      {score >= 60 ? <TrendingUp className="w-2.5 h-2.5" /> : score >= 40 ? <Minus className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      Bias: {styles.label} ({score}%)
    </span>
  );
};

// ─── Setup Badge ──────────────────────────────────────────────────────────────

const SetupBadge = ({ score, momentum }) => {
  const label = getSetupLabel(score, momentum);
  const colorMap = {
    'Trend Following': 'text-indigo-400 bg-indigo-400/10',
    'Momentum Burst':  'text-purple-400 bg-purple-400/10',
    'Mean Reversion':  'text-amber-400 bg-amber-400/10',
    'Short Bias':      'text-rose-400 bg-rose-400/10',
    'Breakout':        'text-cyan-400 bg-cyan-400/10',
    'Consolidation':   'text-slate-400 bg-slate-400/10',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${colorMap[label] || 'text-slate-400 bg-slate-400/10'}`}>
      {label}
    </span>
  );
};

// ─── HeatMap Cell ─────────────────────────────────────────────────────────────

const HeatMapCell = ({ value }) => {
  const isPos = value >= 0;
  const absVal = Math.abs(value);
  const magnitude = Math.min(absVal / 2, 1);
  const opacity = 0.05 + magnitude * 0.18;
  const bg = isPos ? `rgba(16,185,129,${opacity})` : `rgba(244,63,94,${opacity})`;
  const text = isPos ? 'text-emerald-400' : 'text-rose-400';

  return (
    <td className="px-4 py-6 text-center">
      <div
        className={`inline-block px-3 py-1.5 rounded-lg text-xs font-mono font-black ${text} transition-all duration-300 group-hover:scale-105`}
        style={{ backgroundColor: bg }}
      >
        {isPos ? '+' : ''}{value}%
      </div>
    </td>
  );
};

// ─── Expandable Table Row ─────────────────────────────────────────────────────

const AssetRow = ({ asset }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const styles = getScoreStyle(asset.smartScore);

  return (
    <>
      <tr
        className="group hover:bg-white/[0.035] transition-all duration-200 cursor-pointer relative"
        onClick={() => navigate(`/asset/${encodeURIComponent(asset.ticker)}`)}
      >
        {/* Asset + Bias pill */}
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-black text-white text-xs shadow-lg">
              {asset.ticker.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                {asset.ticker}
              </div>
              <BiasPill score={asset.smartScore} />
            </div>
          </div>
        </td>

        {/* 1G % */}
        <HeatMapCell value={asset.var1D} />

        {/* Momentum */}
        <td className="px-4 py-5 text-center">
          <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg ${asset.momentum >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
            {asset.momentum >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(asset.momentum).toFixed(2)}%
          </div>
        </td>

        {/* Smart Quant */}
        <td className="px-4 py-5 text-center">
          <div className="flex justify-center">
            <SmartQuantIndicator score={asset.smartScore} label={asset.smartScoreLabel} />
          </div>
        </td>

        {/* Setup */}
        <td className="px-4 py-5 text-center">
          <SetupBadge score={asset.smartScore} momentum={asset.momentum} />
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-5 text-center" onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-600 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </td>
      </tr>

      {/* Expanded row: dettagli aggiuntivi */}
      {expanded && (
        <tr className="bg-white/[0.015]">
          <td colSpan="6" className="px-6 py-4">
            <div className="flex items-center gap-8 text-xs">
              {/* Sparkline */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-wider font-black text-[9px]">Trend 7G</span>
                <div className="w-24 h-6 opacity-70">
                  <Sparkline data={asset.sparkline} isPositive={asset.var1D >= 0} />
                </div>
              </div>
              {/* 1W */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-wider font-black text-[9px]">1 Sett.</span>
                <span className={`font-black font-mono ${asset.var1W >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.var1W >= 0 ? '+' : ''}{asset.var1W}%
                </span>
              </div>
              {/* 1M */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-wider font-black text-[9px]">1 Mese</span>
                <span className={`font-black font-mono ${asset.var1M >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.var1M >= 0 ? '+' : ''}{asset.var1M}%
                </span>
              </div>
              {/* Prezzo */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-wider font-black text-[9px]">Prezzo</span>
                <span className="font-black font-mono text-white">
                  {(asset.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {/* AI Insight se score alto */}
              {asset.smartScore >= 80 && (
                <div className="ml-auto">
                  <AIInsightInline ticker={asset.yahooTicker} price={asset.price} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Hero Card ────────────────────────────────────────────────────────────────

const HeroCard = ({ asset }) => {
  const isPositive = asset.var1D >= 0;
  const styles = getScoreStyle(asset.smartScore);

  return (
    <div className="glass-panel rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkline data={asset.sparkline} isPositive={isPositive} />
      </div>
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{asset.ticker}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tighter">
                {(asset.price || 0).toLocaleString()}
              </span>
              <span className={`text-xs font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(asset.var1D)}%
              </span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] ${styles.bgLight} ${styles.text}`}>
            {styles.label}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini circle */}
          <SmartQuantIndicator score={asset.smartScore} />
          <div className="flex-grow space-y-2">
            <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
              <span>Signal Strength</span>
              <span>{asset.smartScore}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${styles.bg}`}
                style={{ width: `${asset.smartScore}%` }}
              />
            </div>
            {/* Setup invece di testo generico */}
            <SetupBadge score={asset.smartScore} momentum={asset.momentum || 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Factor Bar ───────────────────────────────────────────────────────────────

const FactorBar = ({ factor }) => (
  <div className="bg-white/[0.02] rounded-2xl p-4 space-y-3 hover:bg-white/[0.04] transition-colors group shadow-lg shadow-black/10">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
        {factor.name}
      </span>
      <span className={`text-[10px] font-black ${factor.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {factor.change >= 0 ? '+' : ''}{factor.change}%
      </span>
    </div>
    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 h-full transition-all duration-1000 ease-out ${factor.value >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
        style={{
          left: factor.value >= 50 ? '50%' : `${factor.value}%`,
          width: `${Math.abs(factor.value - 50)}%`,
        }}
      />
    </div>
  </div>
);

// ─── Skeleton Hero Card ───────────────────────────────────────────────────────

const SkeletonHeroCard = () => (
  <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] p-6 overflow-hidden shadow-2xl">
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="skeleton w-12 h-2" />
          <div className="skeleton w-28 h-7" />
        </div>
        <div className="skeleton w-16 h-5 rounded-lg" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-grow space-y-2">
          <div className="skeleton w-full h-1 rounded-full" />
          <div className="skeleton w-2/3 h-3" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Markets Page ─────────────────────────────────────────────────────────────

const Markets = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usa');
  const [searchTerm, setSearchTerm] = useState('');
  const stickyHeaderRef = useRef(null);

  const { data, isLoading: loading } = useMarkets();

  const sections = data?.sections || {};
  const currentAssets = sections[activeTab]?.assets || [];
  const heroAssets = sections.usa?.assets?.slice(0, 3) || [];
  const isInitialLoad = loading && !sections.usa;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-white/[0.04] p-8 md:p-12 shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-48 bg-blue-600/8 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Live · Multi-Asset Quant Terminal
          </div>

          {/* H1 */}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-white">
            Terminale quantitativo per{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              trader discrezionali
            </span>{' '}
            e sistematici.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
            Segnali multi-asset, bias direzionale e forza del segnale in tempo reale per
            indici, forex, crypto e commodities.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Zap className="w-4 h-4" />
              Provalo gratis per 7 giorni
            </button>
            <span className="text-slate-500 text-xs font-medium">
              Nessuna carta richiesta.
            </span>
          </div>
        </div>
      </section>

      {/* ── Macro Alert Banner ───────────────────────────────────────────── */}
      <ErrorBoundary fallback={<WidgetErrorFallback title="Macro Alert Error" />}>
        <MacroAlertBanner />
      </ErrorBoundary>

      <div className="mb-4">
        <AdBanner />
      </div>

      {/* ── Hero Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {isInitialLoad ? (
          <>
            <SkeletonHeroCard />
            <SkeletonHeroCard />
            <SkeletonHeroCard />
          </>
        ) : (
          heroAssets.map((asset) => (
            <HeroCard key={asset.ticker} asset={asset} />
          ))
        )}
      </div>

      {/* ── Relative Strength Factors ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Relative Strength Factors
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {isInitialLoad
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/[0.02] rounded-2xl p-4 space-y-3">
                  <div className="skeleton w-20 h-3" />
                  <div className="skeleton w-full h-1.5 rounded-full" />
                </div>
              ))
            : data?.factors?.map((factor) => (
                <FactorBar key={factor.name} factor={factor} />
              ))}
        </div>
      </section>

      {/* ── Global Capital Flow ──────────────────────────────────────────── */}
      <ErrorBoundary fallback={<WidgetErrorFallback title="Global Capital Flow Error" />}>
        <GlobalCapitalFlowBox />
      </ErrorBoundary>

      {/* ── Main Table Section ───────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Sticky tab bar */}
        <div
          ref={stickyHeaderRef}
          className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl py-3 -mx-4 px-4 flex items-center justify-between gap-4 shadow-lg shadow-black/20 transition-all duration-300"
        >
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all w-44"
              />
            </div>
          </div>
        </div>

        {/* Crypto-specific insight */}
        {activeTab === 'crypto' && (
          <ErrorBoundary fallback={<WidgetErrorFallback title="Crypto Insights Error" />}>
            <CryptoDivergenceInsights />
          </ErrorBoundary>
        )}

        {/* Table */}
        <ProPaywall isPaywalled={sections[activeTab]?.paywalled}>
          <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl border border-white/[0.03]">
            <div className="table-scroll">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Asset
                    </th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                      1G %
                    </th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                      Momentum
                    </th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                      Smart Quant
                    </th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                      Setup
                    </th>
                    <th className="px-4 py-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.025]">
                  {isInitialLoad ? (
                    [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                  ) : currentAssets
                      .filter((a) => (a.ticker || '').toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((asset) => (
                        <AssetRow key={asset.ticker} asset={asset} />
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </ProPaywall>
      </section>
    </div>
  );
};

export default Markets;
