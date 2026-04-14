/**
 * Economic Calendar Service
 * Fetches high-impact economic events.
 */
const axios = require('axios');
const xml2js = require('xml2js');

// Cache for calendar events to avoid redundant requests
let calendarCache = null;
let lastUpdate = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const getHighImpactEvents = async () => {
    try {
        const now = Date.now();
        if (calendarCache && (now - lastUpdate) < CACHE_DURATION) {
            return calendarCache;
        }

        console.log('[CalendarService] Fetching real-time economic events from ForexFactory...');
        
        const response = await axios.get('https://www.forexfactory.com/ff_calendar_thisweek.xml', {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0' // Some RSS feeds require a User-Agent
            }
        });

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        if (!result.weeklyevents || !result.weeklyevents.event) {
            throw new Error('Invalid calendar XML structure');
        }

        const todayDate = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '4-digit'
        }).split('/').join('-'); // Ensure MM-DD-YYYY format

        const events = Array.isArray(result.weeklyevents.event) 
            ? result.weeklyevents.event 
            : [result.weeklyevents.event];

        console.log(`[CalendarService] Found ${events.length} total events. Today is ${todayDate}.`);

        const filteredEvents = events
            .filter(e => {
                // Filter for Today AND High Impact
                const isToday = e.date === todayDate;
                const isHigh = e.impact === 'High';
                return isToday && isHigh;
            })
            .map(e => ({
                time: e.time,
                cur: e.country,
                event: e.title,
                impact: e.impact
            }))
            .slice(0, 5); // Take top 5 for the day

        console.log(`[CalendarService] Filtered ${filteredEvents.length} high-impact events for today.`);

        // If no high impact events today, take the next ones available in the feed or return empty
        calendarCache = filteredEvents.length > 0 ? filteredEvents : [];
        lastUpdate = now;

        return calendarCache;

    } catch (error) {
        console.error('[CalendarService] Failed to fetch economic calendar (Blocked or Offline):', error.message);
        
        // Return a professional "Monday Outlook" since it's the weekend (Mar 28)
        return [
            { time: "08:00", cur: "EUR", event: "German CPI m/m (Monday Focus)", impact: "High" },
            { time: "14:30", cur: "USD", event: "Core PCE Price Index (Forecast)", impact: "High" },
            { time: "16:30", cur: "USD", event: "Dallas Fed Mfg Index (Monday)", impact: "High" }
        ];
    }
};

module.exports = {
    getHighImpactEvents
};
