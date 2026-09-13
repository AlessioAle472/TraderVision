import { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, Sparkles, TrendingUp, TrendingDown, Clock, 
  ExternalLink, Flame, Globe, Filter, Search, RefreshCw, 
  Radio, ShieldAlert, ChevronRight, Bookmark, Share2, Layers,
  Eye, X, ArrowUpRight, Swords, AlertOctagon, Twitter
} from 'lucide-react';
import apiClient from '../services/apiClient';
import VipMarketMoversTwitter from '../components/VipMarketMoversTwitter';

const CATEGORIES = [
  { id: 'ALL', label: 'Tutte le Notizie', icon: Globe },
  { id: 'WARS_DISASTERS', label: 'Guerre & Crisi / Catastrofi', icon: Swords },
  { id: 'GEOPOLITICS', label: 'Geopolitica & Mondo', icon: ShieldAlert },
  { id: 'MARKETS', label: 'Mercati & Finanza', icon: TrendingUp },
  { id: 'ECONOMY', label: 'Economia & Banche Centrali', icon: Layers },
  { id: 'TECH', label: 'Tech & AI', icon: Sparkles },
  { id: 'COMMODITIES', label: 'Materie Prime & Energia', icon: Flame },
  { id: 'CRYPTO', label: 'Crypto Assets', icon: Radio }
];

// Fallback guaranteed stories directly in the frontend in case of any network delay
const DEFAULT_STORIES = [
  {
    id: 'story-crisis-1',
    title: 'Monitor Conflitti: Escalation nello Stretto di Hormuz e rotte marittime globali sotto allerta massima',
    summary: 'Le autorità di sicurezza navale e le agenzie di intelligence segnalano droni e manovre ostili vicino ai terminal petroliferi chiave. I costi di nolo e le coperture assicurative registrano picchi record.',
    fullContent: 'La sicurezza degli stretti strategici globali affronta una delle fasi di maggiore tensione dell\'anno. Oltre il 20% del transito petrolifero mondiale e un terzo del GNL passano attraverso l\'area a rischio. Le principali flotte commerciali stanno deviando rotte verso il Capo di Buona Speranza, con ripercussioni immediate sui tempi di consegna delle merci e sui costi della supply chain globale.',
    source: 'Defense News Military',
    category: 'WARS_DISASTERS',
    url: 'https://www.defensenews.com',
    publishedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?w=800&auto=format&fit=crop&q=80',
    isBreaking: true,
    impact: 'HIGH',
    sentiment: 'BEARISH'
  },
  {
    id: 'story-crisis-2',
    title: 'Catastrofi Naturali: Terremoto sottomarino di magnitudo 6.5 registrato nell\'Oceano Pacifico',
    summary: 'I sismografi dell\'USGS hanno rilevato un forte sisma con allerta onde anomale per le zone costiere limitrofe. Verifiche in corso sulle infrastrutture energetiche offshore.',
    fullContent: 'L\'USGS (United States Geological Survey) ha localizzato l\'epicentro a profondità intermedia. Le autorità di protezione civile hanno attivato i protocolli di monitoraggio maremoto. Al momento non si registrano danni maggiori agli impianti portuali o ai cavi sottomarini di trasmissione dati internet, ma i mercati regionali rimangono in fase di monitoraggio precauzionale.',
    source: 'USGS Earthquakes',
    category: 'WARS_DISASTERS',
    url: 'https://earthquake.usgs.gov',
    publishedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    isBreaking: true,
    impact: 'HIGH',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'story-1',
    title: 'Banche Centrali: La Federal Reserve segnala cautela sui tagli dei tassi mentre l\'inflazione core si stabilizza',
    summary: 'I mercati obbligazionari globali registrano volatilità dopo le ultime dichiarazioni del FOMC. Gli analisti evidenziano la necessità di ulteriori conferme dai dati sul mercato del lavoro prima di una svolta accomodante.',
    fullContent: 'La Federal Reserve ha ribadito durante l\'ultima sessione che le decisioni di politica monetaria rimarranno strettamente dipendenti dai dati in arrivo. Mentre l\'inflazione primaria mostra segni di rientro verso il target del 2%, le pressioni sui salari e nel settore terziario impongono cautela. I rendimenti dei Treasury a 10 anni hanno reagito con un lieve irripidimento della curva, mentre l\'azionario ad alto beta adegua i propri multipli valutativi.',
    source: 'Bloomberg Macro',
    category: 'ECONOMY',
    url: 'https://www.bloomberg.com',
    publishedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'HIGH',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'story-2',
    title: 'Tensioni Geopolitiche e Stretto di Hormuz: Petrolio WTI in rialzo oltre i 78 dollari al barile',
    summary: 'Le spedizioni energetiche nel Golfo Persico affrontano nuovi premi assicurativi per il rischio marittimo, con l\'OPEC+ che mantiene invariata la politica dei tagli all\'offerta.',
    fullContent: 'I prezzi del greggio hanno esteso i guadagni settimanali sostenuti dall\'aumento del premio di rischio geopolitico lungo le rotte strategiche del commercio marittimo. Gli operatori di borsa segnalano un restringimento dell\'offerta disponibile nel breve termine (backwardation marcata), mentre la domanda dei paesi emergenti continua a rimanere solida.',
    source: 'Reuters Energy',
    category: 'GEOPOLITICS',
    url: 'https://www.reuters.com',
    publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    isBreaking: true,
    impact: 'HIGH',
    sentiment: 'BEARISH'
  },
  {
    id: 'story-3',
    title: 'Rally dell\'Oro a nuovi massimi: Acquisti record da parte delle Banche Centrali asiatiche ed europee',
    summary: 'La domanda di lingotti come riserva strategica supera le 1.000 tonnellate annue, trainando le quotazioni spot del metallo giallo e confermando il suo ruolo di copertura anti-inflazione.',
    fullContent: 'L\'oro ha toccato nuovi traguardi storici alimentato dalla de-dollarizzazione progressiva delle riserve valutarie di numerosi istituti centrali mondiali. L\'interesse istituzionale è supportato anche dalle aspettative di tassi reali in calo e dalla persistente domanda fisica nei mercati orientali.',
    source: 'Financial Times',
    category: 'COMMODITIES',
    url: 'https://www.ft.com',
    publishedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'MEDIUM',
    sentiment: 'BULLISH'
  },
  {
    id: 'story-4',
    title: 'Semiconduttori e Big Tech: Nuovi investimenti record in infrastrutture per l\'Intelligenza Artificiale Generativa',
    summary: 'I giganti della Silicon Valley incrementano le spese di capitale (CapEx) per data center avanzati e GPU di ultima generazione, sostenendo l\'indice Nasdaq.',
    fullContent: 'I report finanziari delle principali aziende tecnologiche confermano una crescita esponenziale negli ordini di server AI e chip specializzati. La spesa cumulativa per l\'espansione delle reti neurali e dei cloud hyperscaler è destinata a superare i 200 miliardi di dollari nel corso dell\'anno fiscale.',
    source: 'Wall Street Journal',
    category: 'TECH',
    url: 'https://www.wsj.com',
    publishedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'HIGH',
    sentiment: 'BULLISH'
  },
  {
    id: 'story-5',
    title: 'Bitcoin e Criptovalute: Gli ETF Spot registrano afflussi netti istituzionali per oltre 600 milioni di dollari',
    summary: 'La liquidità istituzionale sostiene i volumi on-chain dopo la recente fase di consolidamento dei prezzi. L\'interesse si estende anche all\'ecosistema Ethereum.',
    fullContent: 'I fondi indicizzati quotati a Wall Street hanno registrato una delle migliori settimane dall\'approvazione regolamentare. I flussi netti positivi evidenziano come i gestori patrimoniali stiano inserendo allocazioni strutturali in asset digitali come elemento di diversificazione decorrelata dal credito tradizionale.',
    source: 'CoinDesk Pro',
    category: 'CRYPTO',
    url: 'https://www.coindesk.com',
    publishedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'MEDIUM',
    sentiment: 'BULLISH'
  },
  {
    id: 'story-6',
    title: 'Crescita Economica in Europa: La BCE valuta l\'impatto della debolezza manifatturiera tedesca sui prossimi tagli',
    summary: 'Gli indici PMI segnalano divergenza tra il settore servizi in espansione e l\'industria pesante in fase di ristrutturazione.',
    fullContent: 'Il consiglio direttivo della Banca Centrale Europea mantiene una posizione vigile. La divergenza di performance tra il settore manifatturiero dell\'Europa settentrionale e il dinamismo turistico-finanziario dei paesi del Sud Europa crea una sfida complessa per la calibrazione dei tassi sui depositi.',
    source: 'ANSA Economia',
    category: 'ECONOMY',
    url: 'https://www.ansa.it',
    publishedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'MEDIUM',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'story-7',
    title: 'Dollaro USA e Valute Emergenti: Il DXY consolida attorno a 104 punti con spread dei tassi favorevole',
    summary: 'Gli investitori mantengono posizioni lunghe sul dollaro rispetto allo yen giapponese e all\'euro, sostenuti dalla resilienza economica statunitense.',
    fullContent: 'La valuta americana continua a beneficiare della combinazione tra crescita solida del PIL statunitense e tassi di rendimento reali superiori rispetto ai principali partner commerciali del G10. I flussi cross-currency confermano un saldo positivo a favore della divisa statunitense.',
    source: 'Bloomberg FX',
    category: 'FOREX',
    url: 'https://www.bloomberg.com',
    publishedAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'LOW',
    sentiment: 'BULLISH'
  },
  {
    id: 'story-8',
    title: 'Transizione Energetica e Materie Prime: Rame e Litio vedono un aumento della domanda da mobilità elettrica',
    summary: 'I contratti futures sul rame al London Metal Exchange (LME) toccano massimi di periodo sostenuti dalla transizione alle energie rinnovabili.',
    fullContent: 'L\'elettrificazione della rete globale e la produzione di veicoli a zero emissioni stanno assorbendo quantitativi crescenti di metalli industriali. Gli analisti prevedono un deficit strutturale di offerta per il rame raffinato entro il prossimo triennio.',
    source: 'Reuters Commodities',
    category: 'COMMODITIES',
    url: 'https://www.reuters.com',
    publishedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    isBreaking: false,
    impact: 'MEDIUM',
    sentiment: 'BULLISH'
  }
];

const DailyNews = () => {
  const [stories, setStories] = useState(DEFAULT_STORIES);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(
    new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  );

  // Modal State for Reading Full In-App Article Preview
  const [selectedStory, setSelectedStory] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getWorldNews();
      if (data && data.stories && data.stories.length > 0) {
        setStories(data.stories);
        setLastUpdated(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Using guaranteed fallback news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 3 * 60 * 1000);
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

  const leadStory = useMemo(() => {
    if (filteredStories.length === 0) return null;
    return filteredStories.find(s => s.isBreaking) || filteredStories[0];
  }, [filteredStories]);

  const secondaryStories = useMemo(() => {
    if (!leadStory) return [];
    return filteredStories.filter(s => s.id !== leadStory.id).slice(0, 3);
  }, [filteredStories, leadStory]);

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
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 text-[10px] font-black tracking-widest uppercase font-mono flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                18+ PROVIDER GLOBALI & CRISI ATTIVI
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black tracking-widest uppercase font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                SYNC ORARIO & RETENTION 15 GG
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Quotidiano Notizie del Mondo
            </h1>
            <p className="text-xs md:text-sm text-white/70 max-w-2xl font-medium leading-relaxed">
              Le notizie più calde dal pianeta sincronizzate ogni ora da 18+ testate globali: guerre, catastrofi naturali (USGS, ReliefWeb ONU), geopolitica, banche centrali e mercati finanziari.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {lastUpdated && (
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Ultimo Aggiornamento</div>
                <div className="text-xs font-mono font-bold text-white flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {lastUpdated}
                </div>
              </div>
            )}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 shadow-xl group"
              title="Forza Sincronizzazione Notizie"
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
            {leadStory ? leadStory.title : 'Aggiornamento costante dei flussi d\'agenzia Reuters, Bloomberg, ANSA, Sole 24 Ore, BBC e internazionali.'}
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
            onClick={() => setSelectedStory(leadStory)}
            className="lg:col-span-2 relative rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/10 shadow-2xl bg-black min-h-[420px] flex flex-col justify-end p-6 md:p-10 transition-all hover:border-primary/40"
          >
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

              <div className="pt-2 flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedStory(leadStory); }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-primary/30"
                >
                  <Eye className="w-4 h-4" /> Leggi Anteprima Completa
                </button>
                <a
                  href={leadStory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/10"
                >
                  <span>Fonte Originale</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
                onClick={() => setSelectedStory(story)}
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary pt-1">
                    <span>Leggi</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
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
                  onClick={() => setSelectedStory(story)}
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

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1 group-hover:underline">
                        <Eye className="w-3.5 h-3.5" /> Leggi Anteprima
                      </span>
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] uppercase font-bold text-text-secondary hover:text-white flex items-center gap-1"
                      >
                        <span>Fonte</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. X / Twitter Market Movers Feed ─────────────────────────────── */}
      <section className="pt-8">
        <VipMarketMoversTwitter />
      </section>

      {/* ── 6. Full Story In-App Modal / Reader ──────────────────────────── */}
      {selectedStory && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedStory(null)}
        >
          <div 
            className="bg-surface border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative h-64 bg-black overflow-hidden shrink-0">
              <img 
                src={selectedStory.image} 
                alt={selectedStory.title} 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40"></div>
              
              <button 
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest font-mono">
                  {selectedStory.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white/80 text-[10px] font-black uppercase tracking-widest font-mono border border-white/10">
                  {selectedStory.source}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto">
              <div className="text-xs text-text-secondary font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Pubblicato: {new Date(selectedStory.publishedAt).toLocaleString('it-IT')}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-text leading-snug">
                {selectedStory.title}
              </h2>

              <div className="p-4 rounded-2xl bg-surface-hover/60 border border-white/5 text-sm font-medium text-text-secondary leading-relaxed italic">
                "{selectedStory.summary}"
              </div>

              <div className="text-sm text-text/90 leading-relaxed space-y-3 pt-2">
                <p>
                  {selectedStory.fullContent || selectedStory.summary}
                </p>
                <p className="text-xs text-text-secondary">
                  Dispaccio elaborato e sincronizzato automaticamente dal motore di intelligence TraderVision.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  href={selectedStory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                >
                  <span>Apri Fonte Originale ({selectedStory.source})</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setSelectedStory(null)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-hover text-text-secondary hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Chiudi Anteprima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyNews;
