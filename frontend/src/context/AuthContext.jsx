import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE_URL = (() => {
 const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
 return url.endsWith('/api') ? url :`${url}/api`;
})();

const AuthContext = createContext();

export const useAuth = () => {
 return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
 const [simulatedPlan, setSimulatedPlan] = useState(null);

 const [theme] = useState('dark');
 useEffect(() => {
 const fetchUser = async () => {
 if (import.meta.env.DEV) {
 setUser({ name: 'Admin', email: 'admin@local.dev', isMaster: true, plan: 'pro', theme: 'dark' });
 setLoading(false);
 return;
 }

 const token = localStorage.getItem('token');
 if (token) {
 try {
 const res = await axios.get(`${API_BASE_URL}/auth/me`, {
 headers: { Authorization:`Bearer ${token}`}
 });
 setUser(res.data);
 if (res.data.theme) {
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
 document.documentElement.classList.add('dark');
 }, []);

 const changeTheme = (newTheme) => {
 // Theme is locked to dark
 localStorage.setItem('theme', 'dark');
 };

 const login = (userData, token) => {
 localStorage.setItem('token', token);
 setUser(userData);
 if (userData.theme) {
 localStorage.setItem('theme', userData.theme);
 }
 };

 const logout = () => {
 localStorage.removeItem('token');
 setUser(null);
 localStorage.setItem('theme', 'dark');
 };

 const updateSettings = async (settingsData) => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.put(`${API_BASE_URL}/auth/settings`, settingsData, {
 headers: { Authorization:`Bearer ${token}`}
 });
 setUser(res.data);
 if (res.data.token) {
 localStorage.setItem('token', res.data.token);
 }
 if (res.data.theme) {
 localStorage.setItem('theme', res.data.theme);
 }
 return { success: true };
 } catch (error) {
 console.error('Error updating settings', error);
 return { success: false, message: error.response?.data?.message || 'Error updating settings' };
 }
 };

  const effectivePlan = simulatedPlan ? simulatedPlan : (user?.isMaster || user?.role === 'admin' ? 'pro' : user?.plan);
  const effectiveIsMaster = simulatedPlan ? false : (user?.isMaster || user?.role === 'admin');

 return (
 <AuthContext.Provider value={{ 
 user, loading, login, logout, theme, changeTheme, updateSettings, 
 simulatedPlan, setSimulatedPlan, effectivePlan, effectiveIsMaster
 }}>
 {!loading && children}
 </AuthContext.Provider>
 );
};
