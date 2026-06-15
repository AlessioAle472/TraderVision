import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import axios from 'axios';

// The baseUrl from apiClient needs to be duplicated or we can just rely on apiClient methods directly.
// In this case, we use apiClient methods directly for queries.

export const useDashboardData = (tickers = null) => {
  return useQuery({
    queryKey: ['dashboardData', tickers],
    queryFn: () => apiClient.getDashboardData(tickers),
  });
};

export const useMacroOutlook = () => {
  return useQuery({
    queryKey: ['macroOutlook'],
    queryFn: () => apiClient.getMacroOutlook(),
  });
};

export const useMarkets = () => {
  return useQuery({
    queryKey: ['marketsData'],
    queryFn: () => apiClient.getMarketsData(),
  });
};

export const useCotData = (asset = null) => {
  return useQuery({
    queryKey: ['cotData', asset],
    queryFn: async () => {
      // Direct call since apiClient doesn't have getCotData yet
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      const response = await axios.get(`${baseUrl}/cot-data`, { params: asset ? { asset } : {} });
      return response.data;
    },
  });
};

export const useCalendar = (timeframe = 'today') => {
  return useQuery({
    queryKey: ['economicCalendar', timeframe],
    queryFn: () => apiClient.getEconomicCalendar(timeframe),
  });
};

export const useCentralBanks = () => {
  return useQuery({
    queryKey: ['centralBanks'],
    queryFn: () => apiClient.getCentralBanks(),
  });
};

export const useMacroRegime = (region) => {
  return useQuery({
    queryKey: ['macroRegime', region],
    queryFn: () => apiClient.getRegionalRegime(region),
    enabled: !!region,
  });
};

export const useMacroDeepDive = () => {
  return useQuery({
    queryKey: ['macroDeepDive'],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      const response = await axios.get(`${baseUrl}/macro-deep-dive`);
      return response.data;
    },
  });
};

export const useAiBriefing = () => {
  return useQuery({
    queryKey: ['aiBriefingLatest'],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      // Must include token if applicable
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${baseUrl}/briefing/latest`, { headers });
      return response.data;
    },
  });
};
