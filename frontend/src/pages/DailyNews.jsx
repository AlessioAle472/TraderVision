import { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, Sparkles, TrendingUp, TrendingDown, Clock, 
  ExternalLink, Flame, Globe, Filter, Search, RefreshCw, 
  Radio, ShieldAlert, ChevronRight, Bookmark, Share2, Layers
} from 'lucide-react';
import apiClient from '../services/apiClient';

const CATEGORIES = [
  { id: 'ALL', label: 'Tutte le Notizie', icon: Globe },
  { id: 'GEOPOLITICS', label: 'Geopolitica & Mondo', icon: ShieldAlert },
  { id: 'MARKETS', label: 'Mercati & Finanza', icon: TrendingUp },
  { id: 'ECONOMY', label: 'Economia & Banche Centrali', icon: Layers },
  { id: 'TECH', label: 'Tech & AI', icon: Sparkles },
  { id: 'COMMODITIES', label: 'Materie Prime', icon: Flame },
  { id: 'CRYPTO', label: 'Crypto Assets', icon: Radio }
];

const DailyNews = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getWorldNews();
      if (data && data.stories) {
        setStories(data.stories);
        setLastUpdated(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load world news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 3 * 60 * 1000); // 3m auto-refresh
    return () => clearInterval(interval);
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesCat = activeCategory === 'ALL' || story.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        story.title.toLowerCase().includes(q) || 
        story.summary.toLowerCase().includes(q) ||
        story.source.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [stories, activeCategory, searchQuery]);

  // Breaking / Lead Top Story (First breaking or first high impact)
  const leadStory = useMemo(() => {
    if (filteredStories.length === 0) return null;
    return filteredStories.find(s => s.isBreaking) || filteredStories[0];
  }, [filteredStories]);

  // Secondary highlights (next 2-3 stories)
  const secondaryStories = useMemo(() => {
    if (!leadStory) return [];
    return filteredStories.filter(s => s.id !== leadStory.id).slice(0, 3);
  }, [filteredStories, leadStory]);

  // Remaining editorial grid stories
  const streamStories = useMemo(() => {
    if (!leadStory) return [];
    const usedIds = new Set([leadStory.id, ...secondaryStories.map(s => s.id)]);
    return filteredStories.filter(s => !usedIds.has(s.id));
  }, [filteredStories, leadStory, secondaryStories]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* ── 1. Sky TG24-Style Broadcast Banner Header ─────────────────────── */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 p-6 md:p-8 border border-red-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-red-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                SKY TG TRADERVISION 24
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 text-[10px] font-black tracking-widest uppercase font-mono">
                EDIZIONE CONTINUA IN TEMPO REALE
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Quotidiano Notizie del Mondo
            </h1>
            <p className="text-xs md:text-sm text-white/70 max-w-2xl font-medium">
              Le notizie più calde e rilevanti dal pianeta: geopolitica, decisioni dei governi, banche centrali e mercati globali in presa diretta.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {lastUpdated && (
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Ultimo Dispaccio</div>
                <div className="text-xs font-mono font-bold text-white">{lastUpdated}</div>
              </div>
            )}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 shadow-xl group"
              title="Aggiorna Notizie"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
            </button>
          </div>
        </div>

        {/* Breaking News Ticker Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3 text-xs overflow-hidden">
          <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shrink-0 flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-white" /> FLASH ORA
          </span>
          <div className="truncate font-medium text-white/90">
            {leadStory ? leadStory.title : 'Aggiornamento costante dei flussi d\'agenzia Reuters, Bloomberg e internazionali.'}
          </div>
        </div>
      </div>

      {/* ── 2. Category Filter Ribbon & Live Search ───────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-surface border border-white/5 shadow-xl">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary/40' 
                    : 'bg-surface-hover text-text-secondary hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per evento o parola..."
            className="w-full bg-background border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Lead Breaking Editorial Broadcast Section ──────────────────── */}
      {leadStory && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Giant Front-Page Story */}
          <div 
            onClick={() => window.open(leadStory.url, '_blank')}
            className="lg:col-span-2 relative rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/10 shadow-2xl bg-black min-h-[420px] flex flex-col justify-end p-6 md:p-10 transition-all hover:border-primary/40"
          >
            {/* Background Picture with Cinema Gradient */}
            <img 
              src={leadStory.image} 
              alt={leadStory.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Flame className="w-3 h-3 fill-white" /> PRIMA PAGINA MONDO
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest font-mono border border-white/10">
                  {leadStory.source}
                </span>
                <span className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(leadStory.publishedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                {leadStory.title}
              </h2>

              <p className="text-sm md:text-base text-white/80 line-clamp-2 max-w-3xl leading-relaxed">
                {leadStory.summary}
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary group-hover:underline">
                <span>Leggi l'articolo integrale</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Secondary Editorial Hot Highlights */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary flex items-center gap-2 px-2">
              <Sparkles className="w-4 h-4 text-primary" /> Dispacci del Momento
            </div>

            {secondaryStories.map((story) => (
              <div
                key={story.id}
                onClick={() => window.open(story.url, '_blank')}
                className="p-5 rounded-3xl bg-surface border border-white/5 hover:border-primary/30 transition-all cursor-pointer group shadow-xl flex gap-4 items-start"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-black/40 border border-white/10">
                  <img 
                    src={story.image} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-primary font-mono">{story.source}</span>
                    <span className="text-[9px] font-mono text-text-secondary">
                      {new Date(story.publishedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-xs md:text-sm font-black text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {story.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ── 4. Main Newspaper Editorial Stream (Grid) ─────────────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black text-text tracking-tight uppercase">
              Tutte le Notizie in Tempo Reale ({filteredStories.length})
            </h2>
          </div>
          <span className="text-xs text-text-secondary font-mono">
            Filtrate per: <strong className="text-white">{CATEGORIES.find(c => c.id === activeCategory)?.label}</strong>
          </span>
        </div>

        {streamStories.length === 0 && !leadStory ? (
          <div className="p-16 text-center text-text-secondary bg-surface rounded-3xl border border-white/5">
            <p className="text-base font-bold">Nessuna notizia corrispondente alla ricerca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streamStories.map((story) => {
              const isBullish = story.sentiment === 'BULLISH';
              const isBearish = story.sentiment === 'BEARISH';

              return (
                <div
                  key={story.id}
                  onClick={() => window.open(story.url, '_blank')}
                  className="rounded-3xl bg-surface border border-white/5 hover:border-primary/40 transition-all duration-300 shadow-xl overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative h-48 overflow-hidden bg-black">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent"></div>

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white border border-white/10 font-mono">
                        {story.category}
                      </span>
                      {story.sentiment && story.sentiment !== 'NEUTRAL' && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono border ${isBullish ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                          {story.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono">
                        <span className="font-black uppercase text-primary">{story.source}</span>
                        <span>{new Date(story.publishedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                      </div>

                      <h3 className="text-base font-black text-text leading-snug group-hover:text-primary transition-colors line-clamp-3">
                        {story.title}
                      </h3>

                      <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-primary">
                      <span>Approfondisci</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default DailyNews;
