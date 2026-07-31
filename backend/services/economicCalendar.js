const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const { getCache, setCache } = require('../utils/cache');

const CACHE_FILENAME = 'economic_calendar_raw.json';
// Cache valida per 1 minuto per aggiornare in tempo reale i dati in uscita (Actual)
const CACHE_TTL_MS = 1 * 60 * 1000;

// Paesi supportati dal calendario (mappa country code → nome)
const COUNTRY_MAP = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA',
    AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN', CNH: 'CN',
    'US': 'US', 'EU': 'EU', 'GB': 'GB', 'JP': 'JP',
    'DE': 'DE', 'FR': 'FR', 'IT': 'IT', 'CA': 'CA',
    'AU': 'AU', 'NZ': 'NZ', 'CH': 'CH', 'CN': 'CN',
};

const MYFXBOOK_COUNTRY_MAP = {
    'united-states': 'US',
    'euro-area': 'EU',
    'germany': 'DE',
    'france': 'FR',
    'italy': 'IT',
    'spain': 'ES',
    'united-kingdom': 'GB',
    'japan': 'JP',
    'china': 'CN',
    'switzerland': 'CH',
    'canada': 'CA',
    'australia': 'AU',
    'new-zealand': 'NZ',
    'singapore': 'SG',
    'hong-kong': 'HK',
    'south-korea': 'KR',
    'india': 'IN',
    'brazil': 'BR',
    'mexico': 'MX',
    'south-africa': 'ZA',
    'norway': 'NO',
    'sweden': 'SE',
    'denmark': 'DK',
    'netherlands': 'NL',
    'belgium': 'BE',
    'austria': 'AT',
    'finland': 'FI',
    'ireland': 'IE',
    'portugal': 'PT',
    'greece': 'GR',
    'russia': 'RU',
    'turkey': 'TR',
    'indonesia': 'ID',
    'malaysia': 'MY',
    'thailand': 'TH',
    'philippines': 'PH',
    'taiwan': 'TW',
    'poland': 'PL',
    'czech-republic': 'CZ',
    'hungary': 'HU',
    'romania': 'RO',
    'chile': 'CL',
    'colombia': 'CO',
    'peru': 'PE',
    'argentina': 'AR',
    'israel': 'IL',
    'egypt': 'EG',
    'saudi-arabia': 'SA',
    'united-arab-emirates': 'AE',
};

// ─── Source 1: ForexFactory XML Feed ──────────────────────────────────────────
const fetchFromForexFactory = async () => {
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    };

    const response = await axios.get(url, { headers, timeout: 10000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(response.data);

    if (!parsed?.weeklyevents?.event) {
        throw new Error('XML vuoto o struttura inattesa');
    }

    const raw = Array.isArray(parsed.weeklyevents.event)
        ? parsed.weeklyevents.event
        : [parsed.weeklyevents.event];

    return raw.map((ev, index) => {
        let eventTime = new Date();
        try {
            if (ev.date && typeof ev.date === 'string') {
                const parts = ev.date.split('-');
                if (parts.length === 3) {
                    // Formato: MM-DD-YYYY
                    eventTime = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
            }
        } catch (_) {}

        let impactStr = 'LOW';
        if (ev.impact === 'High') impactStr = 'HIGH';
        else if (ev.impact === 'Medium') impactStr = 'MEDIUM';

        const rawCountry = (ev.country || 'All').trim().toUpperCase();
        const mappedCountry = COUNTRY_MAP[rawCountry] || rawCountry;

        return {
            id: index,
            time: ev.time || '--:--',
            country: mappedCountry,
            event: ev.title || '',
            impact: impactStr,
            actual: ev.actual || '',
            consensus: ev.forecast || '',
            previous: ev.previous || '',
            timestamp: eventTime.getTime(),
            localDateStr: eventTime.toLocaleDateString(),
            dateString: eventTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        };
    });
};

// ─── Source 2: Myfxbook Economic Calendar RSS (Real-Time Live Actuals) ────────
const fetchFromMyFxBookRSS = async () => {
    const url = 'https://www.myfxbook.com/rss/forex-economic-calendar-events';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
    };

    const response = await axios.get(url, { headers, timeout: 15000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(response.data);

    const items = parsed?.rss?.channel?.item;
    if (!items) {
        throw new Error('Myfxbook RSS vuoto o non valido');
    }

    const raw = Array.isArray(items) ? items : [items];

    return raw.map((item, idx) => {
        const pubDate = new Date(item.pubDate || Date.now());
        let countrySlug = '';
        if (item.link && typeof item.link === 'string') {
            countrySlug = item.link.split('/')[4]?.toLowerCase() || '';
        }
        const mappedCountry = MYFXBOOK_COUNTRY_MAP[countrySlug] || (countrySlug ? countrySlug.slice(0, 2).toUpperCase() : 'US');

        let impact = 'LOW';
        let previous = '';
        let consensus = '';
        let actual = '';

        if (item.description && typeof item.description === 'string') {
            try {
                const $ = cheerio.load(item.description);
                const tds = $('td');
                if (tds.length >= 5) {
                    const impactHtml = tds.eq(1).html() || '';
                    if (impactHtml.includes('high-impact')) impact = 'HIGH';
                    else if (impactHtml.includes('medium-impact')) impact = 'MEDIUM';
                    else impact = 'LOW';

                    previous = tds.eq(2).text().replace(/\s+/g, ' ').trim();
                    consensus = tds.eq(3).text().replace(/\s+/g, ' ').trim();
                    actual = tds.eq(4).text().replace(/\s+/g, ' ').trim();
                }
            } catch (_) {}
        }

        const hours = pubDate.getHours();
        const mins = String(pubDate.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        const h12 = hours % 12 || 12;

        return {
            id: idx + 5000,
            time: `${h12}:${mins}${ampm}`,
            country: mappedCountry,
            event: (item.title || '').trim(),
            impact,
            actual: actual || '',
            consensus: consensus || '',
            previous: previous || '',
            timestamp: pubDate.getTime(),
            localDateStr: pubDate.toLocaleDateString(),
            dateString: pubDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        };
    });
};



// ─── Source 3: FRED (Federal Reserve Economic Data) — solo eventi USA ─────────
const fetchFromFRED = async () => {
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const FRED_API_KEY = process.env.FRED_API_KEY;

    if (!FRED_API_KEY) throw new Error('FRED_API_KEY non configurata');

    const url = `https://api.stlouisfed.org/fred/releases/dates?realtime_start=${fmt(weekStart)}&realtime_end=${fmt(weekEnd)}&api_key=${FRED_API_KEY}&file_type=json`;
    const response = await axios.get(url, { timeout: 20000 });

    if (!response.data?.release_dates) throw new Error('Risposta FRED non valida');

    // Nomi chiave → impatto (euristica)
    const highImpactKeywords = ['CPI', 'GDP', 'NFP', 'Nonfarm', 'FOMC', 'Federal Funds', 'Unemployment', 'PCE', 'Retail Sales', 'PPI'];
    const mediumImpactKeywords = ['ISM', 'PMI', 'Housing', 'Durable', 'Trade', 'Consumer', 'Manufacturing', 'Industrial'];

    return response.data.release_dates.map((ev, index) => {
        const eventTime = new Date(ev.date + 'T12:00:00');
        const name = ev.release_name || '';

        let impact = 'LOW';
        if (highImpactKeywords.some(k => name.includes(k))) impact = 'HIGH';
        else if (mediumImpactKeywords.some(k => name.includes(k))) impact = 'MEDIUM';

        return {
            id: 1000 + index,
            time: '12:00',
            country: 'US',
            event: name,
            impact,
            actual: '',
            consensus: '',
            previous: '',
            timestamp: eventTime.getTime(),
            localDateStr: eventTime.toLocaleDateString(),
            dateString: eventTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        };
    });
};

// ─── Cache Check ──────────────────────────────────────────────────────────────
const isCacheValid = (cached) => {
    if (!cached || !cached.timestamp || !Array.isArray(cached.events)) return false;
    // Invalida istantaneamente cache vecchie che contengono codici non normalizzati (es. AUD, CNY, JPY)
    const hasOldCountryCode = cached.events.some(e => ['AUD', 'CNY', 'JPY', 'USD', 'EUR', 'GBP', 'CAD', 'NZD', 'CHF'].includes(e.country));
    if (hasOldCountryCode) return false;
    const age = Date.now() - new Date(cached.timestamp).getTime();
    return age < CACHE_TTL_MS;
};

// ─── Main Fetch con caching + multi-source fallback e Live Actuals ──────────
let _inMemoryCache = null; // Cache in-memory aggiuntiva per ridurre I/O su file

const fetchRawWeekEvents = async () => {
    // 1. Controlla cache in-memory
    if (_inMemoryCache && isCacheValid(_inMemoryCache)) {
        console.log('[CalendarService] Serving from in-memory cache');
        return _inMemoryCache.events;
    }

    // 2. Controlla cache su file
    const fileCached = getCache(CACHE_FILENAME);
    if (isCacheValid(fileCached)) {
        console.log('[CalendarService] Serving from file cache');
        _inMemoryCache = fileCached;
        return fileCached.events;
    }

    // 3. Multiprova e Unione Sorgenti in tempo reale
    let ffEvents = [];
    let myfxEvents = [];

    try {
        console.log('[CalendarService] Fetching ForexFactory schedule...');
        ffEvents = await fetchFromForexFactory();
    } catch (err) {
        console.warn(`[CalendarService] ❌ ForexFactory failed: ${err.message}`);
    }

    try {
        console.log('[CalendarService] Fetching Myfxbook live actuals...');
        myfxEvents = await fetchFromMyFxBookRSS();
    } catch (err) {
        console.warn(`[CalendarService] ❌ Myfxbook RSS failed: ${err.message}`);
    }

    // Se abbiamo almeno una sorgente funzionante
    if (ffEvents.length > 0 || myfxEvents.length > 0) {
        let mergedEvents = [...ffEvents];

        // Arricchisci il calendario di ForexFactory con i valori LIVE Actual, Consensus e Previous da Myfxbook RSS
        if (myfxEvents.length > 0 && ffEvents.length > 0) {
            mergedEvents = ffEvents.map(ffe => {
                const ffeDateStr = new Date(ffe.timestamp).toISOString().slice(0, 10);
                const match = myfxEvents.find(my => {
                    const myDateStr = new Date(my.timestamp).toISOString().slice(0, 10);
                    if (ffeDateStr !== myDateStr || my.country !== ffe.country) return false;
                    const cleanFfe = ffe.event.toLowerCase().replace(/australia|china|japan|germany|us|uk|euro|eu|m\/m|y\/y|q\/q|\s+/gi, ' ').trim();
                    const cleanMy = my.event.toLowerCase().replace(/australia|china|japan|germany|us|uk|euro|eu|m\/m|y\/y|q\/q|\s+/gi, ' ').trim();
                    return ffe.event.toLowerCase().includes(cleanMy) || my.event.toLowerCase().includes(cleanFfe) || (ffe.time === my.time && ffe.time !== '--:--');
                });
                if (match && match.actual) {
                    return {
                        ...ffe,
                        actual: match.actual,
                        consensus: match.consensus || ffe.consensus,
                        previous: match.previous || ffe.previous,
                        impact: match.impact || ffe.impact
                    };
                }
                return ffe;
            });
        }

        // Aggiungi tutti gli eventi odierni di Myfxbook che potrebbero non essere in ForexFactory (così da visualizzare sempre ogni dato Actual pubblicato)
        myfxEvents.forEach(my => {
            const myDateStr = new Date(my.timestamp).toISOString().slice(0, 10);
            const exists = mergedEvents.some(ffe => {
                const ffeDateStr = new Date(ffe.timestamp).toISOString().slice(0, 10);
                return ffeDateStr === myDateStr && ffe.country === my.country && ffe.time === my.time;
            });
            if (!exists) {
                mergedEvents.push(my);
            }
        });

        // Ordina temporalmente gli eventi
        mergedEvents.sort((a, b) => a.timestamp - b.timestamp);

        console.log(`[CalendarService] ✅ Merged ${mergedEvents.length} events (FF: ${ffEvents.length}, Myfxbook: ${myfxEvents.length})`);
        const cachePayload = { events: mergedEvents, timestamp: new Date().toISOString(), source: 'Merged(FF+Myfxbook)' };
        setCache(CACHE_FILENAME, cachePayload);
        _inMemoryCache = cachePayload;
        return mergedEvents;
    }

    // 4. Se ForexFactory e Myfxbook falliscono entrambi, tenta fallback su FRED
    try {
        console.log('[CalendarService] Trying fallback source: FRED');
        const fredEvents = await fetchFromFRED();
        if (fredEvents && fredEvents.length > 0) {
            const cachePayload = { events: fredEvents, timestamp: new Date().toISOString(), source: 'FRED' };
            setCache(CACHE_FILENAME, cachePayload);
            _inMemoryCache = cachePayload;
            return fredEvents;
        }
    } catch (err) {
        console.warn(`[CalendarService] ❌ FRED failed: ${err.message}`);
    }

    // 5. Tutte le sorgenti fallite — restituisce errore leggibile
    throw new Error('Tutte le sorgenti del calendario economico sono temporaneamente non disponibili.');
};

// ─── Funzione pubblica esposta al controller ──────────────────────────────────
const fetchFinnhubCalendar = async (timeframe = 'today') => {
    let allEvents;
    try {
        allEvents = await fetchRawWeekEvents();
    } catch (err) {
        console.error('[CalendarService] Fatal fetch error:', err.message);
        return [{
            id: 999,
            time: '--:--',
            country: 'All',
            event: 'Dati temporaneamente non disponibili - Riprova tra qualche minuto',
            impact: 'LOW',
            actual: '',
            consensus: '',
            previous: '',
            isPast: false,
            timestamp: Date.now(),
            localDateStr: new Date().toLocaleDateString(),
            dateString: new Date().toLocaleDateString(),
        }];
    }

    const now = new Date();
    const formatKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Calcola le date YYYY-MM-DD per il filtro
    const targetKeys = [];
    if (timeframe === 'yesterday') {
        const d = new Date(); d.setDate(now.getDate() - 1);
        targetKeys.push(formatKey(d));
    } else if (timeframe === 'tomorrow') {
        const d = new Date(); d.setDate(now.getDate() + 1);
        targetKeys.push(formatKey(d));
    } else if (timeframe === 'this_week') {
        const day = now.getDay();
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        const d = new Date(now);
        d.setDate(diffToMonday);
        for (let i = 0; i < 7; i++) {
            const temp = new Date(d);
            temp.setDate(temp.getDate() + i);
            targetKeys.push(formatKey(temp));
        }
    } else {
        // today (default)
        targetKeys.push(formatKey(now));
    }

    const enriched = allEvents.map(ev => {
        const rawCountry = (ev.country || 'All').trim().toUpperCase();
        const mappedCountry = COUNTRY_MAP[rawCountry] || rawCountry;
        const dObj = new Date(ev.timestamp || Date.now());
        const dateKey = formatKey(dObj);
        return {
            ...ev,
            country: mappedCountry,
            dateKey,
            isPast: dObj < now,
        };
    });

    return enriched
        .filter(ev => targetKeys.includes(ev.dateKey))
        .sort((a, b) => a.timestamp - b.timestamp);
};

// ─── getHighImpactEvents per i cron job ──────────────────────────────────────
const getHighImpactEvents = async () => {
    try {
        const events = await fetchFinnhubCalendar('today');
        return events.filter(e => e.impact === 'HIGH').slice(0, 5);
    } catch (error) {
        console.error('[CalendarService] Error fetching high impact events:', error.message);
        return [{ time: '--:--', country: 'USD', event: 'Calendar Unavailable', impact: 'HIGH' }];
    }
};

module.exports = {
    fetchFinnhubCalendar,
    getHighImpactEvents,
};
