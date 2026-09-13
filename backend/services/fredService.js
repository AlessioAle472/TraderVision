const axios = require('axios');

// Mapping of regions to FRED Series IDs for Interest Rates
const fredSeriesMap = {
  usa: 'FEDFUNDS',             // Effective Federal Funds Rate
  europe: 'ECBDFR',            // ECB Deposit Facility Rate for Euro Area
  uk: 'BOERUKM',               // Bank of England Rate
  japan: 'IRSTCB01JPM156N',    // Bank of Japan Target Rate
  asia: 'INTDSRCNM193N',       // China Interest Rate
  australia: 'IR3TIB01AUM156N',// Australia Rate proxy
  canada: 'IRSTCB01CAM156N',   // Bank of Canada Rate
  switzerland: 'IRSTCB01CHM156N' // Swiss National Bank Policy Rate
};

const getLatestRate = async (region) => {
  try {
    const seriesId = fredSeriesMap[region];
    if (!seriesId) return getFallbackRate(region);
    
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      return getFallbackRate(region);
    }

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    
    const response = await axios.get(url, { timeout: 4000 });
    if (response.data && response.data.observations && response.data.observations.length > 0) {
      const val = parseFloat(response.data.observations[0].value);
      return !isNaN(val) ? `${val.toFixed(2)}%` : getFallbackRate(region);
    }
    
    return getFallbackRate(region);
  } catch (error) {
    return getFallbackRate(region);
  }
};

const getFallbackRate = (region) => {
  const fallbacks = {
    usa: '4.50%',
    europe: '2.50%',
    uk: '4.50%',
    japan: '0.50%',
    asia: '3.10%',
    australia: '4.10%',
    canada: '3.00%',
    switzerland: '0.50%'
  };
  return fallbacks[region] || '3.50%';
};

module.exports = {
  getLatestRate
};
