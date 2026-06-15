const fs = require('fs');
const path = require('path');

/**
 * Reads JSON data from a file cache.
 * @param {string} filename The name of the file in the data directory (e.g. 'daily_macro.json')
 * @returns {Object|null} The parsed JSON object, or null if it fails/doesn't exist
 */
const getCache = (filename) => {
    const DATA_FILE = path.join(__dirname, '../data', filename);
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error(`[Cache] Failed to read ${filename}`, error);
    }
    return null;
};

/**
 * Writes JSON data to a file cache, adding a timestamp.
 * @param {string} filename The name of the file in the data directory (e.g. 'daily_macro.json')
 * @param {Object} data The data to store
 */
const setCache = (filename, data) => {
    const DATA_FILE = path.join(__dirname, '../data', filename);
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        data.timestamp = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`[Cache] Failed to store data in ${filename}:`, error);
    }
};

/**
 * Checks if the cached data is current (valid from 07:00 AM today, or yesterday if currently < 07:00 AM)
 * @param {Object} storedData The data retrieved from getCache
 * @returns {boolean} True if the data is current
 */
const isCacheCurrent = (storedData) => {
    if (!storedData || !storedData.timestamp) return false;
    
    const now = new Date();
    const storedDate = new Date(storedData.timestamp);
    
    // Valid from 07:00 AM today (or yesterday if currently < 07:00 AM)
    let cutoff = new Date(now);
    cutoff.setHours(7, 0, 0, 0);
    
    if (now < cutoff) {
        cutoff.setDate(cutoff.getDate() - 1);
    }
    
    return storedDate >= cutoff;
};

module.exports = {
    getCache,
    setCache,
    isCacheCurrent
};
