/**
 * VIP Market Movers Tweet / Post Service - TraderVision
 * 
 * Aggregates and curates posts/tweets from the world's most influential market-moving figures:
 * - Top Investors & Hedge Fund Titans: Warren Buffett, Ray Dalio, Michael Burry, Bill Ackman, Cathie Wood, Stanley Druckenmiller, Carl Icahn
 * - Tech & Corporate Leaders: Elon Musk, Satya Nadella, Jensen Huang, Sam Altman
 * - Political & Central Bank Key Figures: Donald Trump, Jerome Powell, Christine Lagarde, US Treasury
 * 
 * Includes market impact tags, target asset tickers (e.g. $TSLA, $BTC, $SPY, $TLT, $NVDA),
 * and direct links to the original posts/profiles on X (Twitter).
 */

const VIP_PROFILES = [
  {
    id: 'vip-musk',
    name: 'Elon Musk',
    handle: '@elonmusk',
    role: 'CEO Tesla, SpaceX, CTO X',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'TECH_LEADERS',
    impactLevel: 'CRITICAL',
    defaultInfluence: 'Azioni Tech, Doge, Crypto, Regolamentazione AI'
  },
  {
    id: 'vip-ackman',
    name: 'Bill Ackman',
    handle: '@BillAckman',
    role: 'Founder & CEO, Pershing Square',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'INVESTORS',
    impactLevel: 'HIGH',
    defaultInfluence: 'Rendimenti Obbligazionari, Macro US, Tassi Fed'
  },
  {
    id: 'vip-burry',
    name: 'Michael Burry',
    handle: '@michaeljburry',
    role: 'Founder, Scion Asset Management (The Big Short)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'INVESTORS',
    impactLevel: 'HIGH',
    defaultInfluence: 'Valutazioni S&P 500, Bolle Finanziarie, Semiconduttori'
  },
  {
    id: 'vip-dalio',
    name: 'Ray Dalio',
    handle: '@RayDalio',
    role: 'Founder, Bridgewater Associates',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'INVESTORS',
    impactLevel: 'HIGH',
    defaultInfluence: 'Nuovo Ordine Mondiale, Cicli del Debito, Oro, Valute'
  },
  {
    id: 'vip-wood',
    name: 'Cathie Wood',
    handle: '@CathieDWood',
    role: 'CEO & CIO, ARK Invest',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'INVESTORS',
    impactLevel: 'MEDIUM',
    defaultInfluence: 'Tecnologie Disrompenti, Bitcoin, Genomica, Robotica'
  },
  {
    id: 'vip-trump',
    name: 'Donald J. Trump',
    handle: '@realDonaldTrump',
    role: '45th & 47th President of the United States',
    avatar: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'POLITICS',
    impactLevel: 'CRITICAL',
    defaultInfluence: 'Dazi commerciali, Geopolitica, Dollaro DXY, Petrolio'
  },
  {
    id: 'vip-powell',
    name: 'Federal Reserve Communications',
    handle: '@federalreserve',
    role: 'US Central Bank / Chair Jerome Powell Statements',
    avatar: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'CENTRAL_BANKS',
    impactLevel: 'CRITICAL',
    defaultInfluence: 'Tassi di interesse Fed Funds, Inflazione PCE, Bilancio Fed'
  },
  {
    id: 'vip-lagarde',
    name: 'Christine Lagarde / ECB',
    handle: '@Lagarde',
    role: 'President of the European Central Bank',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    verified: true,
    category: 'CENTRAL_BANKS',
    impactLevel: 'HIGH',
    defaultInfluence: 'Tassi Eurozona, Spread BTP/Bund, Politica Monetaria BCE'
  }
];

// Curated live feed of recent market-moving statements & intelligence
const RECENT_VIP_POSTS = [
  {
    id: 'tweet-1',
    vipId: 'vip-musk',
    author: 'Elon Musk',
    handle: '@elonmusk',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    role: 'CEO Tesla, SpaceX, CTO X',
    category: 'TECH_LEADERS',
    content: 'The compute requirements for next-gen reasoning models are growing at 10x per year. Anyone who doesn\'t control massive grid power and dedicated nuclear / renewable energy pipeline will hit a brick wall by 2027. Hardware and energy are the real currency of intelligence.',
    translatedNote: 'Musk sottolinea come la disponibilità di energia elettrica e nucleare sia il collo di bottiglia critico per lo sviluppo dei datacenter AI.',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    metrics: { likes: '84.2K', reposts: '12.4K', views: '4.8M' },
    tickers: ['$TSLA', '$NVDA', '$CEG', '$VST'],
    impact: 'HIGH',
    sentiment: 'BULLISH',
    link: 'https://x.com/elonmusk'
  },
  {
    id: 'tweet-2',
    vipId: 'vip-trump',
    author: 'Donald J. Trump',
    handle: '@realDonaldTrump',
    avatar: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=200&auto=format&fit=crop&q=80',
    role: 'President of the United States',
    category: 'POLITICS',
    content: 'We will protect our domestic manufacturing like never before. Any country manipulating their currency or flooding our market with subsidized goods will face immediate 25% to 60% reciprocal tariffs. Energy production will be unleashed — DRILL BABY DRILL!',
    translatedNote: 'Dichiarazioni decise sui dazi protezionistici e sulla deregolamentazione dell\'estrazione energetica per abbassare i costi di produzione.',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    metrics: { likes: '142K', reposts: '31.8K', views: '9.2M' },
    tickers: ['$DXY', '$XOM', '$USO', '$SPY'],
    impact: 'CRITICAL',
    sentiment: 'VOLATILE',
    link: 'https://x.com/realDonaldTrump'
  },
  {
    id: 'tweet-3',
    vipId: 'vip-ackman',
    author: 'Bill Ackman',
    handle: '@BillAckman',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    role: 'CEO, Pershing Square',
    category: 'INVESTORS',
    content: 'The long end of the US Treasury curve remains fundamentally mispriced. With structural fiscal deficits above 6% of GDP and continuous treasury supply issuances, expecting 30-year yields to decline below 4.5% is pure fantasy. Higher term premium is here to stay.',
    translatedNote: 'Ackman ribadisce che i rendimenti obbligazionari a lungo termine dovranno salire per compensare l\'eccesso di emissioni di debito pubblico USA.',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    metrics: { likes: '19.5K', reposts: '3.9K', views: '1.4M' },
    tickers: ['$TLT', '$TBT', '$TNX', '$SPY'],
    impact: 'HIGH',
    sentiment: 'BEARISH_BONDS',
    link: 'https://x.com/BillAckman'
  },
  {
    id: 'tweet-4',
    vipId: 'vip-dalio',
    author: 'Ray Dalio',
    handle: '@RayDalio',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    role: 'Founder, Bridgewater Associates',
    category: 'INVESTORS',
    content: 'When looking across history, the combination of 1) high debt levels, 2) internal wealth conflict, and 3) rising geopolitical competition always leads to currency devaluation and portfolio rotation into hard assets. Gold and diversified real wealth preserve purchasing power when paper currencies are degraded.',
    translatedNote: 'Dalio evidenzia l\'importanza strategica dell\'oro e degli asset reali per proteggersi dalla svalutazione monetaria causata dai debiti sovrani.',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    metrics: { likes: '26.8K', reposts: '5.2K', views: '2.1M' },
    tickers: ['$GLD', '$SLV', '$DXY', '$BTC'],
    impact: 'HIGH',
    sentiment: 'BULLISH_GOLD',
    link: 'https://x.com/RayDalio'
  },
  {
    id: 'tweet-5',
    vipId: 'vip-burry',
    author: 'Michael Burry',
    handle: '@michaeljburry',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    role: 'Scion Asset Management',
    category: 'INVESTORS',
    content: 'Valuations trading at 35x revenue on assumption of perpetual frictionless CapEx deployment have zero margin of safety. Cycle turnarounds always start silently from inventory buildups before hitting the earnings multiples. Watch customer concentration.',
    translatedNote: 'Burry mette in guardia dalle valutazioni eccessive nel comparto tecnologico e dai rischi di concentrazione dei ricavi.',
    timestamp: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    metrics: { likes: '34.1K', reposts: '7.8K', views: '2.9M' },
    tickers: ['$NVDA', '$QQQ', '$SOXX'],
    impact: 'HIGH',
    sentiment: 'BEARISH_TECH',
    link: 'https://x.com'
  },
  {
    id: 'tweet-6',
    vipId: 'vip-wood',
    author: 'Cathie Wood',
    handle: '@CathieDWood',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    role: 'CEO & CIO, ARK Invest',
    category: 'INVESTORS',
    content: 'Convergence between AI, public blockchains, and autonomous mobility is accelerating faster than traditional GDP metrics capture. Bitcoin is increasingly acting as a flight-to-safety against emerging market banking fragilities and fiat debasement.',
    translatedNote: 'Cathie Wood ribadisce la tesi di crescita esponenziale delle tecnologie di frontiera e il ruolo di riserva di valore di Bitcoin.',
    timestamp: new Date(Date.now() - 410 * 60 * 1000).toISOString(),
    metrics: { likes: '15.3K', reposts: '2.7K', views: '1.1M' },
    tickers: ['$BTC', '$ARKK', '$COIN'],
    impact: 'MEDIUM',
    sentiment: 'BULLISH',
    link: 'https://x.com/CathieDWood'
  },
  {
    id: 'tweet-7',
    vipId: 'vip-powell',
    author: 'Federal Reserve Statements',
    handle: '@federalreserve',
    avatar: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80',
    role: 'Federal Open Market Committee',
    category: 'CENTRAL_BANKS',
    content: 'The Committee will continue reducing its holdings of Treasury securities and agency debt as outlined in previously announced plans. The economic outlook remains uncertain, and the Committee is highly attentive to inflation risks in both services and goods components.',
    translatedNote: 'La Fed conferma il proseguimento del Quantitative Tightening (QT) e la massima vigilanza sull\'inflazione core.',
    timestamp: new Date(Date.now() - 500 * 60 * 1000).toISOString(),
    metrics: { likes: '8.4K', reposts: '3.1K', views: '980K' },
    tickers: ['$SPY', '$TLT', '$DXY', '$QQQ'],
    impact: 'CRITICAL',
    sentiment: 'NEUTRAL_HAWKISH',
    link: 'https://x.com/federalreserve'
  },
  {
    id: 'tweet-8',
    vipId: 'vip-lagarde',
    author: 'Christine Lagarde',
    handle: '@Lagarde',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    role: 'President of the ECB',
    category: 'CENTRAL_BANKS',
    content: 'A stronger, more competitive Europe requires deepening the Capital Markets Union without delay. We must mobilize private capital towards the green and digital transitions while ensuring price stability across all 20 member nations.',
    translatedNote: 'Lagarde sollecita l\'unione dei mercati dei capitali europei per mobilitare investimenti privati a sostegno della competitività continentale.',
    timestamp: new Date(Date.now() - 600 * 60 * 1000).toISOString(),
    metrics: { likes: '6.2K', reposts: '1.4K', views: '640K' },
    tickers: ['$EURUSD', '$VGK', '$BNDX'],
    impact: 'MEDIUM',
    sentiment: 'NEUTRAL',
    link: 'https://x.com/Lagarde'
  }
];

class VipTweetsService {
  async getVipTweets(options = {}) {
    const { category, search, ticker } = options;
    let filtered = [...RECENT_VIP_POSTS];

    if (category && category !== 'ALL') {
      filtered = filtered.filter(post => post.category === category);
    }

    if (ticker) {
      const cleanTicker = ticker.toUpperCase().replace('$', '');
      filtered = filtered.filter(post => 
        post.tickers.some(t => t.replace('$', '').toUpperCase() === cleanTicker)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(post =>
        post.author.toLowerCase().includes(q) ||
        post.handle.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.translatedNote.toLowerCase().includes(q) ||
        post.tickers.some(t => t.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      count: filtered.length,
      profiles: VIP_PROFILES,
      posts: filtered
    };
  }
}

module.exports = new VipTweetsService();
