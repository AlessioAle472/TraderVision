const AdmZip = require('adm-zip');
const { parseCsvData } = require('../utils/csvParser');
const { exec } = require('child_process');
const fs = require('fs');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const CotReport = require('../models/CotReport');
const { calculateSMA, calculatePctDiff, calculateZScore } = require('../utils/math');

// Key Markets to track (CFTC Contract Market Codes)
// S&P 500 = 13874A, NASDAQ 100 = 209742, EURO FX = 099741, GOLD = 088691, Crude Oil = 067651, 10-Year T-Note = 043602, Bitcoin = 133741
const TARGET_MARKETS = {
  // Indices
  '13874A': { name: 'S&P 500', category: 'Indices' },
  '209742': { name: 'NASDAQ-100', category: 'Indices' },
  '124603': { name: 'DOW JONES', category: 'Indices' },
  '239742': { name: 'RUSSELL 2000', category: 'Indices' },
  '1170E1': { name: 'VIX', category: 'Indices' },

  // Currencies
  '099741': { name: 'EURO FX', category: 'Currencies' },
  '097741': { name: 'JAPANESE YEN', category: 'Currencies' },
  '096742': { name: 'BRITISH POUND', category: 'Currencies' },
  '092741': { name: 'SWISS FRANC', category: 'Currencies' },
  '232741': { name: 'AUSTRALIAN DOLLAR', category: 'Currencies' },
  '090741': { name: 'CANADIAN DOLLAR', category: 'Currencies' },

  // Commodities
  '088691': { name: 'GOLD', category: 'Commodities' },
  '084691': { name: 'SILVER', category: 'Commodities' },
  '067651': { name: 'CRUDE OIL', category: 'Commodities' },
  '023651': { name: 'NATURAL GAS', category: 'Commodities' },
  '085692': { name: 'COPPER', category: 'Commodities' },
  '002602': { name: 'CORN', category: 'Commodities' },
  '005602': { name: 'SOYBEANS', category: 'Commodities' },

  // Financials
  '043602': { name: '10-YEAR T-NOTE', category: 'Financials' },
  '042601': { name: '2-YEAR T-NOTE', category: 'Financials' },

  // Crypto
  '133741': { name: 'BITCOIN', category: 'Crypto' }
};



/**
 * Downloads and parses a CFTC annual zip file.
 */
const downloadAndParseYear = async (year) => {
  const url = `https://www.cftc.gov/files/dea/history/deahistfo${year}.zip`;
  const tmpPath = path.join('/tmp', `deahistfo${year}.zip`);
  
  try {
    // We use curl because axios gets blocked by Cloudflare 403
    const curlCommand = `curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\
      -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \\
      -H "Accept-Language: en-US,en;q=0.9" \\
      -H "Cache-Control: no-cache" \\
      -H "Connection: keep-alive" \\
      -H "Upgrade-Insecure-Requests: 1" \\
      -s -o ${tmpPath} -w "%{http_code}" ${url}`;

    const { stdout } = await execPromise(curlCommand);
    
    if (stdout.trim() !== '200') {
      throw new Error(`CFTC returned HTTP ${stdout.trim()}`);
    }

    const zipBuffer = fs.readFileSync(tmpPath);
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    
    if (zipEntries.length === 0) throw new Error('ZIP is empty');
    
    // Legacy futures-only txt is usually annualof.txt or similar
    const txtEntry = zipEntries.find(e => e.entryName.endsWith('.txt'));
    if (!txtEntry) throw new Error('No TXT file found in ZIP');
    
    const txtData = zip.readFile(txtEntry);
    
    // Clean up tmp file
    fs.unlinkSync(tmpPath);
    
    const safeInt = (val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    return parseCsvData(txtData, (data) => {
        const code = data['CFTC Contract Market Code'] || data['CFTC Contract Market Code (Quotes)'];
        if (code && TARGET_MARKETS[code.trim()]) {
            const dateStr = data['As of Date in Form YYYY-MM-DD'] || data['Report_Date_as_YYYY-MM-DD'];
            if (!dateStr) return undefined;
            
            const ncLong = safeInt(data['Noncommercial Positions-Long (All)']);
            const ncShort = safeInt(data['Noncommercial Positions-Short (All)']);
            const cLong = safeInt(data['Commercial Positions-Long (All)']);
            const cShort = safeInt(data['Commercial Positions-Short (All)']);
            
            return {
                code: code.trim(),
                date: new Date(dateStr),
                ncNet: ncLong - ncShort,
                cNet: cLong - cShort
            };
        }
        return undefined;
    });
  } catch (error) {
    console.error(`Failed to process COT year ${year}:`, error.message);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    return [];
  }
};

/**
 * Main routine: Downloads data, calculates stats, saves to DB
 */
const fetchAndProcessCotData = async () => {
  console.log('Starting COT Data Fetch & Process...');
  try {
    const currentYear = new Date().getFullYear();
    
    // Download current and previous year to ensure we have at least 52 weeks of history
    const [dataCurrentYear, dataPrevYear] = await Promise.all([
      downloadAndParseYear(currentYear),
      downloadAndParseYear(currentYear - 1)
    ]);
    
    const allData = [...dataCurrentYear, ...dataPrevYear];
    if (allData.length === 0) {
      console.warn('No COT data fetched. Skipping update.');
      return;
    }

    // Group by Market Code, then sort by Date descending
    const marketGroups = {};
    Object.keys(TARGET_MARKETS).forEach(code => { marketGroups[code] = []; });
    
    allData.forEach(row => {
      if (marketGroups[row.code]) {
        marketGroups[row.code].push(row);
      }
    });

    // We only care about saving the most recent report date we have
    // Find the global most recent date across all tracked markets
    let latestReportDate = new Date(0);
    
    const finalReportMarkets = [];

    for (const [code, rows] of Object.entries(marketGroups)) {
      if (rows.length === 0) continue;
      
      // Sort descending (latest week first)
      rows.sort((a, b) => b.date - a.date);
      
      const latestRow = rows[0];
      if (latestRow.date > latestReportDate) {
        latestReportDate = latestRow.date;
      }

      // Arrays for SMAs
      const ncHistory = rows.map(r => r.ncNet);
      const cHistory = rows.map(r => r.cNet);



      const ncCurrent = ncHistory[0] || 0;
      const ncPrev = ncHistory[1] || 0;
      const cCurrent = cHistory[0] || 0;
      const cPrev = cHistory[1] || 0;

      const ncAvg3m = calculateSMA(ncHistory, 13);
      const ncAvg6m = calculateSMA(ncHistory, 26);
      const cAvg3m = calculateSMA(cHistory, 13);
      const cAvg6m = calculateSMA(cHistory, 26);

      finalReportMarkets.push({
        cftcCode: code,
        name: TARGET_MARKETS[code].name,
        category: TARGET_MARKETS[code].category,
        nonCommercial: {
          total: ncCurrent,
          weeklyDelta: ncCurrent - ncPrev,
          avg3m: ncAvg3m,
          avg3mPct: calculatePctDiff(ncCurrent, ncAvg3m),
          avg6m: ncAvg6m,
          avg6mPct: calculatePctDiff(ncCurrent, ncAvg6m),
          zScore: calculateZScore(ncHistory, ncCurrent, 52)
        },
        commercial: {
          total: cCurrent,
          weeklyDelta: cCurrent - cPrev,
          avg3m: cAvg3m,
          avg3mPct: calculatePctDiff(cCurrent, cAvg3m),
          avg6m: cAvg6m,
          avg6mPct: calculatePctDiff(cCurrent, cAvg6m),
          zScore: calculateZScore(cHistory, cCurrent, 52)
        }
      });
    }

    if (finalReportMarkets.length > 0) {
      // Upsert the report for the latest date
      // We use findOneAndUpdate with upsert to prevent duplicates if the cron runs twice
      // and the CFTC hasn't updated the data yet.
      await CotReport.findOneAndUpdate(
        { reportDate: latestReportDate },
        { 
          reportDate: latestReportDate,
          markets: finalReportMarkets
        },
        { upsert: true, new: true }
      );
      console.log(`COT Data for ${latestReportDate.toISOString().split('T')[0]} processed and saved successfully.`);
    }

  } catch (error) {
    console.error('Fatal error in fetchAndProcessCotData:', error);
  }
};

module.exports = {
  fetchAndProcessCotData
};
