import axios from 'axios';

const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return url.endsWith('/api') ? url : `${url}/api`;
})();

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

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
  getSmartQuantAnalysis: async (ticker) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/smart-quant/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Failed to load smart quant analysis via direct API', error);
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
  },
  getTickerMapping: async (yfSymbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ticker-mapping/${encodeURIComponent(yfSymbol)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ticker mapping', error);
      return { tvSymbol: null }; // Silent fail, just use fallback
    }
  },
  saveTickerMapping: async (yfSymbol, tvSymbol) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ticker-mapping`, { yfSymbol, tvSymbol });
      return response.data;
    } catch (error) {
      console.error('Failed to save ticker mapping', error);
      throw error;
    }
  },
  getCentralBanks: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/macro/central-banks`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch central banks data', error);
      throw error;
    }
  },
  getRegionalRegime: async (region) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/macro/regime/${region}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch regional macro regime', error);
      throw error;
    }
  },
  getEconomicCalendar: async (timeframe = 'today') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/economic-calendar`, { params: { timeframe } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch economic calendar', error);
      throw error;
    }
  },
  
  // SOCIAL ENDPOINTS
  getFeed: async (page = 1, limit = 20, groupId = null, ticker = null, search = null) => {
    try {
      let url = `${API_BASE_URL}/social/posts?page=${page}&limit=${limit}`;
      if (groupId) {
        url += `&groupId=${encodeURIComponent(groupId)}`;
      }
      if (ticker) {
        url += `&ticker=${encodeURIComponent(ticker)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch social feed', error);
      throw error;
    }
  },
  createPost: async (formData) => {
    // formData is used because we might send an image (multipart/form-data)
    try {
      const response = await axios.post(`${API_BASE_URL}/social/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create post', error);
      throw error;
    }
  },
  reactToPost: async (id, type) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/social/posts/${id}/react`, { type });
      return response.data;
    } catch (error) {
      console.error('Failed to react to post', error);
      throw error;
    }
  },
  repostPost: async (id, data = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/social/posts/${id}/repost`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to repost post', error);
      throw error;
    }
  },
  deletePost: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/social/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete post', error);
      throw error;
    }
  },
  getComments: async (postId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/social/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch comments', error);
      throw error;
    }
  },
  createComment: async (postId, content) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/social/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error('Failed to create comment', error);
      throw error;
    }
  },
  reportPost: async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/social/posts/${id}/report`);
      return response.data;
    } catch (error) {
      console.error('Failed to report post', error);
      throw error;
    }
  },
  
  // GROUPS & ADS
  createGroup: async (groupData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/groups`, groupData);
      return response.data;
    } catch (error) {
      console.error('Failed to create group', error);
      throw error;
    }
  },
  searchGroups: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groups/search`, { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Failed to search groups', error);
      throw error;
    }
  },
  getMyGroups: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groups/my-groups`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch my groups', error);
      throw error;
    }
  },
  joinGroup: async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/groups/${id}/join`);
      return response.data;
    } catch (error) {
      console.error('Failed to join group', error);
      throw error;
    }
  },
  getActiveAds: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ads/active`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ads', error);
      throw error;
    }
  },

  // STRIPE & SUBSCRIPTION
  createCheckoutSession: async (interval = 'month') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/stripe/create-checkout-session`, { interval });
      return response.data;
    } catch (error) {
      console.error('Failed to create checkout session', error);
      throw error;
    }
  },

  createPortalSession: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/stripe/create-portal-session`);
      return response.data;
    } catch (error) {
      console.error('Failed to create portal session', error);
      throw error;
    }
  }
};

export default apiClient;
