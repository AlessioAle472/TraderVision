/**
 * Economic Calendar Service
 * Fetches high-impact economic events from ForexFactory (primary) or
 * Trading Economics RSS (fallback if 403/blocked).
 */
const axios = require('axios');
const xml2js = require('xml2js');

// Cache for calendar events to avoid redundant requests
let calendarCache = null;
let lastUpdate = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Realistic browser User-Agent pool — rotated randomly to avoid blocks
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const commonHeaders = () => ({
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
});

// ── Primary source: ForexFactory XML feed ────────────────────────────────────
const fetchFromForexFactory = async () => {
    const response = await axios.get('https://www.forexfactory.com/ff_calendar_thisweek.xml', {
        timeout: 8000,
        headers: commonHeaders(),
    });

    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    if (!result.weeklyevents || !result.weeklyevents.event) {
        throw new Error('Invalid ForexFactory XML structure');
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '4-digit'
    }).split('/').join('-'); // MM-DD-YYYY

    const events = Array.isArray(result.weeklyevents.event)
        ? result.weeklyevents.event
        : [result.weeklyevents.event];

    console.log(`[CalendarService] ForexFactory: ${events.length} total events. Today: ${todayDate}`);

    const filtered = events
        .filter(e => e.date === todayDate && e.impact === 'High')
        .map(e => ({
            time: e.time,
            cur: e.country,
            event: e.title,
            impact: e.impact,
        }))
        .slice(0, 5);

    console.log(`[CalendarService] ForexFactory: ${filtered.length} high-impact events for today`);
    return filtered;
};

// ── Fallback source: Trading Economics RSS ────────────────────────────────────
const fetchFromTradingEconomics = async () => {
    // TE provides a public RSS feed with major economic releases
    const response = await axios.get('https://tradingeconomics.com/rss/calendar.aspx', {
        timeout: 8000,
        headers: commonHeaders(),
    });

    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    const items = result?.rss?.channel?.item;
    if (!items) throw new Error('Invalid Trading Economics RSS structure');

    const list = Array.isArray(items) ? items : [items];

    // TE RSS items use pubDate; filter to "today" by matching ISO date prefix
    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const filtered = list
        .filter(item => {
            const pub = new Date(item.pubDate);
            return pub.toISOString().startsWith(todayISO);
        })
        .map(item => ({
            time: new Date(item.pubDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            cur: 'USD',  // TE RSS doesn't always expose currency; default USD
            event: item.title || 'Economic Event',
            impact: 'High',
        }))
        .slice(0, 5);

    console.log(`[CalendarService] TradingEconomics fallback: ${filtered.length} events for today`);
    return filtered;
};

// ── Dynamic placeholder (last resort) ────────────────────────────────────────
const buildPlaceholderEvents = () => {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const label = isWeekend ? 'Weekend — Markets Closed' : 'Calendar Unavailable';

    return [
        { time: '--:--', cur: 'USD', event: `${label}: Check Investing.com for live data`, impact: 'High' },
    ];
};

// ── Public API ────────────────────────────────────────────────────────────────
const getHighImpactEvents = async () => {
    try {
        const now = Date.now();
        if (calendarCache && (now - lastUpdate) < CACHE_DURATION) {
            return calendarCache;
        }

        let events = null;

        // 1. Try ForexFactory (primary)
        try {
            console.log('[CalendarService] Fetching from ForexFactory...');
            events = await fetchFromForexFactory();
        } catch (ffError) {
            console.warn(`[CalendarService] ForexFactory failed (${ffError.message}). Trying Trading Economics fallback...`);

            // 2. Try Trading Economics (secondary)
            try {
                events = await fetchFromTradingEconomics();
            } catch (teError) {
                console.warn(`[CalendarService] TradingEconomics fallback also failed (${teError.message}). Using placeholder.`);
                events = buildPlaceholderEvents();
            }
        }

        calendarCache = events;
        lastUpdate = now;
        return calendarCache;

    } catch (error) {
        console.error('[CalendarService] Unexpected error:', error.message);
        return buildPlaceholderEvents();
    }
};

module.exports = {
    getHighImpactEvents
};
