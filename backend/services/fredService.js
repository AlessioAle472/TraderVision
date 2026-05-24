const axios = require('axios');

// Mapping of regions to FRED Series IDs for Interest Rates
const fredSeriesMap = {
  usa: 'FEDFUNDS',             // Effective Federal Funds Rate
  europe: 'ECBDFR',            // ECB Deposit Facility Rate for Euro Area
  japan: 'IRSTCB01JPM156N',    // Bank of Japan Target Rate (or proxy)
  asia: 'INTDSRCNM193N',       // China Interest Rate
  australia: 'IR3TIB01AUM156N',// Australia Rate proxy
  canada: 'IRSTCB01CAM156N'    // Bank of Canada Rate
};

const getLatestRate = async (region) => {
  try {
    const seriesId = fredSeriesMap[region];
    if (!seriesId) throw new Error(`No FRED series mapped for region: ${region}`);
    
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      console.warn('[FRED Service] No FRED_API_KEY found, returning fallback mock data.');
      return getFallbackRate(region);
    }

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    
    const response = await axios.get(url);
    if (response.data && response.data.observations && response.data.observations.length > 0) {
      const val = parseFloat(response.data.observations[0].value);
      return !isNaN(val) ? `${val.toFixed(2)}%` : getFallbackRate(region);
    }
    
    return getFallbackRate(region);
  } catch (error) {
    console.error(`[FRED Service] Error fetching rate for ${region}:`, error.message);
    return getFallbackRate(region);
  }
};

const getFallbackRate = (region) => {
  const fallbacks = {
    usa: '5.25%',
    europe: '4.00%',
    japan: '0.10%',
    asia: '3.45%',
    australia: '4.35%',
    canada: '5.00%'
  };
  return fallbacks[region] || '0.00%';
};

module.exports = {
  getLatestRate
};
