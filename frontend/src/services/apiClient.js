import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = {
  getDashboardData: async (tickers = null) => {
    try {
      const params = tickers ? { tickers: tickers.join(',') } : {};
      const response = await axios.get(`${API_BASE_URL}/dashboard`, { params });
      return response.data;
    } catch (error) {
      console.error('API integration error formatting:', error);
      throw error;
    }
  },

  searchAssets: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search for assets', error);
      throw error;
    }
  },
  
  getConfig: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/config`);
      return response.data;
    } catch (error) {
      console.error('Failed to load frontend config variables', error);
      throw error;
    }
  },

  getHistoricalData: async (ticker, resolution, from, to) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`, {
        params: { ticker, resolution, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to load historical data', error);
      throw error;
    }
  },
  getAssetDetail: async (ticker) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/asset-details/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Failed to load specific asset detail via direct API', error);
      throw error;
    }
  },
  getMacroOutlook: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/macro-outlook`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch macro outlook', error);
      throw error;
    }
  },
  getMarketsData: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch markets data', error);
      throw error;
    }
  },
  getInsight: async (ticker, price) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/quick-insight/${ticker}`, { params: { price } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quick insight', error);
      throw error;
    }
  },
  getCryptoDivergence: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/crypto-divergence`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch crypto divergence', error);
      throw error;
    }
  },
  getStagflationAlert: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stagflation-alert`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stagflation alert', error);
      throw error;
    }
  },
  getCapitalFlow: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/capital-flow`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch global capital flow calculation', error);
      throw error;
    }
  }
};

export default apiClient;
