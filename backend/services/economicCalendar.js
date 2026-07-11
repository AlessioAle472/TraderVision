const axios = require('axios');
const xml2js = require('xml2js');
const { getCache, setCache } = require('../utils/cache');

const CACHE_FILENAME = 'economic_calendar_raw.json';
// Cache valida per 6 ore — FF aggiorna il feed una volta a settimana, quindi bastano anche 24h
// ma 6h ci dà un buon equilibrio tra freschezza e protezione dal rate limit
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Paesi supportati dal calendario (mappa country code → nome)
const COUNTRY_MAP = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA',
    AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN', CNH: 'CN',
    'US': 'US', 'EU': 'EU', 'GB': 'GB', 'JP': 'JP',
    'DE': 'DE', 'FR': 'FR', 'IT': 'IT', 'CA': 'CA',
    'AU': 'AU', 'NZ': 'NZ', 'CH': 'CH', 'CN': 'CN',
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

        return {
            id: index,
            time: ev.time || '--:--',
            country: ev.country || 'All',
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
    if (!cached || !cached.timestamp) return false;
    const age = Date.now() - new Date(cached.timestamp).getTime();
    return age < CACHE_TTL_MS;
};

// ─── Main Fetch con caching + multi-source fallback ──────────────────────────
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

    // 3. Prova le sorgenti in ordine
    const sources = [
        { name: 'ForexFactory', fn: fetchFromForexFactory },
        { name: 'FRED', fn: fetchFromFRED },
    ];

    for (const source of sources) {
        try {
            console.log(`[CalendarService] Trying source: ${source.name}`);
            const events = await source.fn();
            if (events && events.length > 0) {
                console.log(`[CalendarService] ✅ Fetched ${events.length} events from ${source.name}`);
                const cachePayload = { events, timestamp: new Date().toISOString(), source: source.name };
                setCache(CACHE_FILENAME, cachePayload);
                _inMemoryCache = cachePayload;
                return events;
            }
        } catch (err) {
            console.warn(`[CalendarService] ❌ ${source.name} failed: ${err.message}`);
        }
    }

    // 4. Tutte le sorgenti fallite — restituisce errore leggibile
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

    // Calcola le date locali per il filtro
    let localDates = [];
    if (timeframe === 'yesterday') {
        const d = new Date(); d.setDate(now.getDate() - 1);
        localDates.push(d.toLocaleDateString());
    } else if (timeframe === 'tomorrow') {
        const d = new Date(); d.setDate(now.getDate() + 1);
        localDates.push(d.toLocaleDateString());
    } else if (timeframe === 'this_week') {
        const day = now.getDay();
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        const d = new Date(now);
        d.setDate(diffToMonday);
        for (let i = 0; i < 7; i++) {
            const temp = new Date(d);
            temp.setDate(temp.getDate() + i);
            localDates.push(temp.toLocaleDateString());
        }
    } else {
        // today (default)
        localDates.push(now.toLocaleDateString());
    }

    const enriched = allEvents.map(ev => ({
        ...ev,
        isPast: new Date(ev.timestamp) < now,
    }));

    if (timeframe === 'this_week') {
        return enriched.sort((a, b) => a.timestamp - b.timestamp);
    }

    return enriched
        .filter(ev => localDates.includes(ev.localDateStr))
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
