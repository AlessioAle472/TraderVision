// community_mock.js — In-memory mock database for the Community (Forum) feature

const users = [
  { id: 1, username: 'Alessandro_T', avatar: 'AT' },
  { id: 2, username: 'MarcoFX', avatar: 'MF' },
  { id: 3, username: 'cryptoQueen99', avatar: 'CQ' },
  { id: 4, username: 'TradingElite', avatar: 'TE' },
  { id: 5, username: 'ValentinaR', avatar: 'VR' },
  { id: 6, username: 'il_Macro', avatar: 'IM' },
];

const categories = [
  {
    id: 1,
    name: 'Analisi Macro',
    icon: '🌍',
    description: 'Discussioni su scenario macro globale, BCE, Fed e geopolitica.',
    color: '#6366f1',
    topicCount: 24,
  },
  {
    id: 2,
    name: 'Crypto',
    icon: '₿',
    description: 'Bitcoin, Ethereum, altcoin e tendenze DeFi.',
    color: '#f59e0b',
    topicCount: 41,
  },
  {
    id: 3,
    name: 'Operatività Daily',
    icon: '📊',
    description: 'Analisi tecniche, setup intraday e swing trading.',
    color: '#10b981',
    topicCount: 58,
  },
  {
    id: 4,
    name: 'Supporto',
    icon: '🛠️',
    description: 'Domande sulla piattaforma, bug report e suggerimenti.',
    color: '#64748b',
    topicCount: 12,
  },
];

const topics = [
  {
    id: 1,
    title: 'Fed Hawkish o Pivot? Le mie aspettative per Q2 2026',
    category_id: 1,
    author_id: 6,
    content:
      'Con l\'inflazione US ancora sopra il target, ci aspettiamo che Powell mantenga i tassi invariati fino a giugno. Ma i dati sul mercato del lavoro potrebbero cambiare le cose...',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
    replyCount: 14,
  },
  {
    id: 2,
    title: 'BTC rompe i $90k — Setup long in agguato?',
    category_id: 2,
    author_id: 3,
    content:
      'Stiamo vedendo una compressione importante sul daily. I volumi stanno aumentando e il funding rate è neutro. Classico setup pre-breakout...',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    replyCount: 27,
  },
  {
    id: 3,
    title: 'Setup EUR/USD — Supporto 1.0820 tiene?',
    category_id: 3,
    author_id: 2,
    content:
      'Sul daily siamo in zona supporto chiave. RSI oversold e divergenza bullish in formazione sul 4h. Target 1.0920 se rompiamo la trendline...',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
    replyCount: 9,
  },
  {
    id: 4,
    title: 'Gold ai massimi — Quanto può durare il rally?',
    category_id: 1,
    author_id: 1,
    content:
      'Il VIX sopra 20 e il dollaro debole stanno spingendo il Gold. Attenzione alla zona 2450: storicamente resistenza importante...',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
    replyCount: 18,
  },
  {
    id: 5,
    title: 'ETH 2.0 staking — Conviene ancora nel 2026?',
    category_id: 2,
    author_id: 4,
    content:
      'Il rendimento medio dello staking ETH è sceso al 3.8% APY. Considerando i rischi di slashing e la volatilità, ha ancora senso rispetto a bond sovrani?',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
    replyCount: 33,
  },
  {
    id: 6,
    title: 'Bug nella visualizzazione dello Smart Score su mobile',
    category_id: 4,
    author_id: 5,
    content:
      'Sul mobile Safari il grafico Smart Score non si ridimensiona correttamente. Succede anche a voi?',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22h ago
    replyCount: 5,
  },
  {
    id: 7,
    title: 'NAS100 — Piano di trading per la settimana',
    category_id: 3,
    author_id: 1,
    content:
      'Dopo l\'earnings stagione positiva, il Nasdaq potrebbe puntare ai nuovi massimi. Livelli chiave da monitorare e confluenze...',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26h ago
    replyCount: 21,
  },
  {
    id: 8,
    title: 'Suggerimento: aggiungere filtro per capitalizzazione',
    category_id: 4,
    author_id: 4,
    content:
      'Sarebbe molto utile poter filtrare gli asset nella tabella Markets per market cap. Al momento si può filtrare solo per settore.',
    timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(), // 47h ago
    replyCount: 7,
  },
];

const replies = [
  {
    id: 1,
    topic_id: 1,
    author_id: 2,
    content: 'Concordo, Powell è ancora attendista. I mercati si aspettano troppo in fretta.',
    timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    topic_id: 2,
    author_id: 1,
    content: 'Il funding rate neutro è un ottimo indicatore. Anche io sto guardando long sopra i 91.5k.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    topic_id: 4,
    author_id: 6,
    content: 'Attenzione che potremmo avere un retest prima del breakout definitivo.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

module.exports = { users, categories, topics, replies };
