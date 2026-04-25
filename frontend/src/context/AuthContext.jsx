import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          if (res.data.theme) {
            setTheme(res.data.theme);
            localStorage.setItem('theme', res.data.theme);
          }
        } catch (error) {
          console.error('Error fetching user info', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const applyTheme = (currentTheme) => {
      const root = document.documentElement;
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (currentTheme === 'dark' || (currentTheme === 'auto' && isSystemDark)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    if (userData.theme) {
      setTheme(userData.theme);
      localStorage.setItem('theme', userData.theme);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
  };

  const updateSettings = async (settingsData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/auth/settings`, settingsData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data.theme) {
        setTheme(res.data.theme);
        localStorage.setItem('theme', res.data.theme);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating settings', error);
      return { success: false, message: error.response?.data?.message || 'Error updating settings' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, theme, updateSettings }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
