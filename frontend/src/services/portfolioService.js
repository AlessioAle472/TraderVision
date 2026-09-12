import axios from 'axios';

const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return url.endsWith('/api') ? url : `${url}/api`;
})();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const portfolioService = {
  getPortfolio: async () => {
    const res = await axios.get(`${API_BASE_URL}/portfolio`, getAuthHeaders());
    return res.data;
  },

  getPortfolioHistory: async (timeframe = '1M') => {
    const res = await axios.get(`${API_BASE_URL}/portfolio/history`, {
      ...getAuthHeaders(),
      params: { timeframe },
    });
    return res.data;
  },

  addPosition: async (positionData) => {
    const res = await axios.post(`${API_BASE_URL}/portfolio`, positionData, getAuthHeaders());
    return res.data;
  },

  updatePosition: async (id, positionData) => {
    const res = await axios.put(`${API_BASE_URL}/portfolio/${id}`, positionData, getAuthHeaders());
    return res.data;
  },

  deletePosition: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}/portfolio/${id}`, getAuthHeaders());
    return res.data;
  },

  loadSamplePortfolio: async () => {
    const res = await axios.post(`${API_BASE_URL}/portfolio/sample`, {}, getAuthHeaders());
    return res.data;
  },

  searchTicker: async (query) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/search`, {
        ...getAuthHeaders(),
        params: { q: query },
      });
      return res.data;
    } catch (e) {
      return [];
    }
  },
};

export default portfolioService;
