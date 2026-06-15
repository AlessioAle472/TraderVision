const axios = require('axios');
const { getCache, setCache, isCacheCurrent } = require('../utils/cache');

const CACHE_FILENAME = 'economic_calendar.json';

const xml2js = require('xml2js');

const fetchFinnhubCalendar = async (timeframe = 'today') => {
    // Switch to XML feed to bypass aggressive JSON Cloudflare caching/blocking
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*; q=0.01'
    };

    let eventsRaw = [];
    try {
        const response = await axios.get(url, { headers });
        const parser = new xml2js.Parser({ explicitArray: false });
        const parsed = await parser.parseStringPromise(response.data);
        if (parsed && parsed.weeklyevents && parsed.weeklyevents.event) {
            eventsRaw = Array.isArray(parsed.weeklyevents.event) ? parsed.weeklyevents.event : [parsed.weeklyevents.event];
        }
    } catch (err) {
        console.warn('[CalendarService] XML Fetch failed:', err.message);
        return [{
            id: 999,
            time: '--:--',
            country: 'All',
            event: 'API Unavailable - Riprova più tardi',
            impact: 'HIGH',
            actual: 'ERR',
            consensus: '',
            previous: '',
            isPast: false,
            timestamp: new Date().getTime(),
            localDateStr: new Date().toLocaleDateString(),
            dateString: new Date().toLocaleDateString()
        }];
    }

    const now = new Date();
    
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
        for(let i=0; i<7; i++) {
            let temp = new Date(d);
            temp.setDate(temp.getDate() + i);
            localDates.push(temp.toLocaleDateString());
        }
    } else {
        localDates.push(now.toLocaleDateString()); // 'today'
    }

    const mappedEvents = eventsRaw.map((ev, index) => {
        // Parse date "MM-DD-YYYY" and time "9:15am"
        let eventTime = new Date();
        try {
            if (ev.date && typeof ev.date === 'string') {
                const parts = ev.date.split('-');
                if (parts.length === 3) {
                    // new Date(YYYY, MM-1, DD)
                    eventTime = new Date(parts[2], parseInt(parts[0])-1, parts[1]);
                }
            }
        } catch(e) {}
        
        let impactStr = 'LOW';
        if (ev.impact === 'High') impactStr = 'HIGH';
        else if (ev.impact === 'Medium') impactStr = 'MEDIUM';
        
        return {
            id: index,
            time: ev.time || '--:--',
            country: ev.country || 'All',
            event: ev.title || '',
            impact: impactStr,
            actual: ev.actual || "",
            consensus: ev.forecast || "",
            previous: ev.previous || "",
            isPast: eventTime < now,
            timestamp: eventTime.getTime(),
            localDateStr: eventTime.toLocaleDateString(),
            dateString: eventTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        };
    });

    if (timeframe === 'this_week') {
        return mappedEvents.sort((a, b) => a.timestamp - b.timestamp);
    }

    return mappedEvents.filter(ev => localDates.includes(ev.localDateStr)).sort((a, b) => a.timestamp - b.timestamp);
};

const getHighImpactEvents = async () => {
    try {
        const cached = getCache(CACHE_FILENAME);
        if (isCacheCurrent(cached)) {
            return cached.events;
        }

        const events = await fetchFinnhubCalendar('today');
        const highImpact = events.filter(e => e.impact === 'HIGH').slice(0, 5);

        setCache(CACHE_FILENAME, { events: highImpact, timestamp: new Date().toISOString() });
        return highImpact;
    } catch (error) {
        console.error('[CalendarService] Error fetching high impact events:', error.message);
        return [{ time: '--:--', country: 'USD', event: 'Calendar Unavailable', impact: 'HIGH' }];
    }
};

module.exports = {
    fetchFinnhubCalendar,
    getHighImpactEvents
};
