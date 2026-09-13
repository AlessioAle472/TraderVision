import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, Repeat, Share2, ExternalLink, CheckCircle2, 
  TrendingUp, TrendingDown, AlertTriangle, Filter, Search, Sparkles, 
  Flame, RefreshCw, Radio
} from 'lucide-react';
import apiClient from '../services/apiClient';

const CATEGORIES = [
  { id: 'ALL', label: 'Tutti i Market Movers' },
  { id: 'INVESTORS', label: 'Grandi Investitori' },
  { id: 'TECH_LEADERS', label: 'Leader Tech & AI' },
  { id: 'POLITICS', label: 'Politica Globale' },
  { id: 'CENTRAL_BANKS', label: 'Banche Centrali' }
];

export const VipMarketMoversTwitter = () => {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedTicker, setSelectedTicker] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTweets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVipTweets();
      if (data && data.posts) {
        setPosts(data.posts);
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.warn('Errore caricamento tweet VIP:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTweets();
  }, []);

  const allTickers = Array.from(
    new Set(posts.flatMap(p => p.tickers || []))
  );

  const filteredPosts = posts.filter(post => {
    const matchesCat = activeCategory === 'ALL' || post.category === activeCategory;
    const matchesTicker = selectedTicker === 'ALL' || (post.tickers && post.tickers.includes(selectedTicker));
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      post.author.toLowerCase().includes(q) ||
      post.handle.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      (post.translatedNote && post.translatedNote.toLowerCase().includes(q)) ||
      post.tickers.some(t => t.toLowerCase().includes(q));

    return matchesCat && matchesTicker && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Section Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-text tracking-tight uppercase">
                  X / Twitter Market Movers
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/30">
                  LIVE INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-text-secondary font-medium">
                Dichiarazioni, post e alert dei più grandi investitori mondiali, leader politici e banchieri che muovono i mercati.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadTweets}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 rounded-2xl bg-surface-hover hover:bg-surface text-text hover:text-white border border-white/5 text-xs font-bold flex items-center gap-2 transition-all shadow-md group"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
          <span>Aggiorna Feed X</span>
        </button>
      </div>

      {/* Profiles Quick-Scroll Ribbon */}
      <div className="p-4 rounded-3xl bg-surface/70 border border-white/5 shadow-lg">
        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary/70 mb-3 flex items-center gap-2 font-mono">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Figure Chiave Monitorate (Hedge Funds, Presidenti & CEO)</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {profiles.map(p => (
            <a
              key={p.id}
              href={`https://x.com/${p.handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-background border border-white/5 hover:border-sky-500/40 transition-all shrink-0 group shadow-sm hover:shadow-sky-500/10"
            >
              <img 
                src={p.avatar} 
                alt={p.name} 
                className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform" 
              />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-text group-hover:text-sky-400 transition-colors">
                    {p.name}
                  </span>
                  <CheckCircle2 className="w-3 h-3 text-sky-400 fill-sky-400/20 shrink-0" />
                </div>
                <div className="text-[10px] text-text-secondary font-mono">
                  {p.handle}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Filters: Categories + Tickers Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                activeCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per autore, ticker o parola..."
            className="w-full bg-background border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-sky-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Tickers Tag Bar */}
      {allTickers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary font-mono mr-1">
            Filtra Asset Correlato:
          </span>
          <button
            onClick={() => setSelectedTicker('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono uppercase tracking-wider transition-all ${
              selectedTicker === 'ALL'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-white border border-white/5'
            }`}
          >
            Tutti gli Asset
          </button>
          {allTickers.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTicker(selectedTicker === t ? 'ALL' : t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono uppercase tracking-wider transition-all ${
                selectedTicker === t
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'bg-surface text-text-secondary hover:text-white border border-white/5 hover:border-sky-500/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Posts Cards Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center text-text-secondary bg-surface rounded-3xl border border-white/5">
          <p className="text-sm font-bold">Nessun tweet o dichiarazione corrispondente ai filtri selezionati.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map(post => {
            const isCritical = post.impact === 'CRITICAL';
            const isBullish = post.sentiment.includes('BULLISH');
            const isBearish = post.sentiment.includes('BEARISH');

            return (
              <div
                key={post.id}
                className="p-5 rounded-3xl bg-surface border border-white/5 hover:border-sky-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {isCritical && (
                  <div className="absolute top-0 right-0 px-3 py-0.5 bg-red-600/20 text-red-400 border-b border-l border-red-500/30 rounded-bl-xl text-[9px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    IMPATTO CRITICO MERCATI
                  </div>
                )}

                <div>
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={post.avatar}
                        alt={post.author}
                        className="w-11 h-11 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-text truncate">
                            {post.author}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                          <span className="text-[11px] font-mono text-text-secondary truncate">
                            {post.handle}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-secondary/80 font-medium truncate">
                          {post.role}
                        </div>
                      </div>
                    </div>

                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-surface-hover hover:bg-sky-500/20 text-text-secondary hover:text-sky-400 transition-all border border-white/5 shrink-0"
                      title="Vedi post originale su X"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Post Content */}
                  <div className="mt-3.5 text-xs text-text leading-relaxed font-normal">
                    {post.content}
                  </div>

                  {/* Quant Translation & Market Takeaway */}
                  {post.translatedNote && (
                    <div className="mt-3 p-3 rounded-2xl bg-background/80 border border-white/5 space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3" />
                        <span>Impatto Operativo SmartQuant:</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                        {post.translatedNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Tickers, Sentiment Badge & Metrics */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.tickers?.map(ticker => (
                      <span
                        key={ticker}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-black font-mono text-text border border-white/10"
                      >
                        {ticker}
                      </span>
                    ))}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border ${
                      isBullish 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : (isBearish ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20')
                    }`}>
                      {post.sentiment}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary/70">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" /> {post.metrics.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-emerald-400" /> {post.metrics.reposts}
                    </span>
                    <span>{new Date(post.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default VipMarketMoversTwitter;
