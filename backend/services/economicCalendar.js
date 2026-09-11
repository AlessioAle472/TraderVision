const axios = require('axios');
const xml2js = require('xml2js');
const { getCache, setCache } = require('../utils/cache');

const CACHE_PREFIX = 'economic_calendar_';
// Cache valida per 60 secondi per garantire aggiornamenti in tempo reale dei dati effettivi (Actual)
const CACHE_TTL_MS = 60 * 1000;

// Mappatura codici paese
const COUNTRY_MAP = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA',
    AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN', CNH: 'CN',
    'US': 'US', 'EU': 'EU', 'GB': 'GB', 'JP': 'JP',
    'DE': 'DE', 'FR': 'FR', 'IT': 'IT', 'CA': 'CA',
    'AU': 'AU', 'NZ': 'NZ', 'CH': 'CH', 'CN': 'CN',
};

const formatVal = (val, scale) => {
    if (val === null || val === undefined) return '';
    return `${val}${scale || ''}`;
};

/**
 * Calcola l'intervallo temporale ISO per la query del calendario
 */
const getTimeframeRange = (timeframe = 'today') => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (timeframe === 'yesterday') {
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'tomorrow') {
        start.setDate(now.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else {
        // 'today' default
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { from: start.toISOString(), to: end.toISOString() };
};

/**
 * ─── Source 1 (Principale): Feed Live Eventi TradingView ───────────────────────
 * Fornisce dati in tempo reale con Actual live, Forecast, Previous, Country e Timezone.
 * 100% gratuito e coerente con Investing.com e le piattaforme istituzionali.
 */
const fetchFromTradingView = async (timeframe) => {
    const { from, to } = getTimeframeRange(timeframe);
    const url = `https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Origin': 'https://www.tradingview.com',
            'Referer': 'https://www.tradingview.com/',
            'Accept': 'application/json, text/plain, */*',
        },
        timeout: 8000,
    });

    const rawEvents = response.data?.result || [];
    const now = new Date();

    return rawEvents.map((e, index) => {
        const d = new Date(e.date);
        let impact = 'LOW';
        if (e.importance === 1) impact = 'HIGH';
        else if (e.importance === 0) impact = 'MEDIUM';

        const rawCountry = (e.country || 'US').trim().toUpperCase();
        const mappedCountry = COUNTRY_MAP[rawCountry] || rawCountry;

        const timeStr = d.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const dateStr = d.toLocaleDateString('it-IT', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });

        return {
            id: e.id || `tv-${index}`,
            time: timeStr,
            country: mappedCountry,
            event: e.title || e.indicator || 'Evento Macro',
            impact: impact,
            actual: formatVal(e.actual, e.scale),
            consensus: formatVal(e.forecast, e.scale),
            previous: formatVal(e.previous, e.scale),
            currency: e.currency || '',
            timestamp: d.getTime(),
            localDateStr: d.toLocaleDateString(),
            dateString: dateStr,
            dateKey: d.toISOString().split('T')[0],
            isPast: d < now,
        };
    }).sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * ─── Source 2 (Fallback): ForexFactory Feed XML ───────────────────────────────
 */
const fetchFromForexFactory = async () => {
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/xml,text/xml,*/*',
        },
        timeout: 8000,
    });

    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(response.data);
    const raw = Array.isArray(parsed?.weeklyevents?.event)
        ? parsed.weeklyevents.event
        : [parsed?.weeklyevents?.event].filter(Boolean);

    const now = new Date();

    return raw.map((ev, index) => {
        let eventTime = new Date();
        try {
            if (ev.date && typeof ev.date === 'string') {
                const parts = ev.date.split('-');
                if (parts.length === 3) {
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
            id: `ff-${index}`,
            time: ev.time || '--:--',
            country: mappedCountry,
            event: ev.title || '',
            impact: impactStr,
            actual: ev.actual || '',
            consensus: ev.forecast || '',
            previous: ev.previous || '',
            timestamp: eventTime.getTime(),
            localDateStr: eventTime.toLocaleDateString(),
            dateString: eventTime.toLocaleDateString('it-IT', { weekday: 'short', month: 'short', day: 'numeric' }),
            dateKey: eventTime.toISOString().split('T')[0],
            isPast: eventTime < now,
        };
    });
};

/**
 * Funzione principale esposta al controller del calendario economico
 */
const fetchFinnhubCalendar = async (timeframe = 'today') => {
    const cacheKey = `${CACHE_PREFIX}${timeframe}.json`;
    const cached = getCache(cacheKey);

    if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }

    try {
        console.log(`[CalendarService] Fetching real-time calendar from TradingView (${timeframe})...`);
        const events = await fetchFromTradingView(timeframe);
        
        if (events && events.length > 0) {
            setCache(cacheKey, { timestamp: Date.now(), data: events });
            console.log(`[CalendarService] ✅ Fetched ${events.length} live events with actuals.`);
            return events;
        }
    } catch (err) {
        console.warn(`[CalendarService] TradingView live fetch error: ${err.message}. Falling back to ForexFactory...`);
    }

    // Fallback su ForexFactory
    try {
        const ffEvents = await fetchFromForexFactory();
        if (ffEvents && ffEvents.length > 0) {
            setCache(cacheKey, { timestamp: Date.now(), data: ffEvents });
            return ffEvents;
        }
    } catch (ffErr) {
        console.error('[CalendarService] Fallback also failed:', ffErr.message);
    }

    // Se esiste una cache precedente anche scaduta, servila prima di dare errore
    if (cached && cached.data) {
        return cached.data;
    }

    return [{
        id: 'fallback-0',
        time: '--:--',
        country: 'ALL',
        event: 'Dati temporaneamente non disponibili - Riprova tra qualche istante',
        impact: 'LOW',
        actual: '',
        consensus: '',
        previous: '',
        isPast: false,
        timestamp: Date.now(),
        localDateStr: new Date().toLocaleDateString(),
        dateString: new Date().toLocaleDateString(),
        dateKey: new Date().toISOString().split('T')[0],
    }];
};

/**
 * getHighImpactEvents per i cron job e il briefing AI
 */
const getHighImpactEvents = async () => {
    try {
        const events = await fetchFinnhubCalendar('today');
        const high = events.filter(e => e.impact === 'HIGH');
        if (high.length > 0) return high.slice(0, 5);
        const weekEvents = await fetchFinnhubCalendar('this_week');
        return weekEvents.filter(e => e.impact === 'HIGH').slice(0, 5);
    } catch (error) {
        console.error('[CalendarService] Error fetching high impact events:', error.message);
        return [{ time: '--:--', country: 'USD', event: 'Calendario in aggiornamento', impact: 'HIGH' }];
    }
};

module.exports = {
    fetchFinnhubCalendar,
    getHighImpactEvents,
};
