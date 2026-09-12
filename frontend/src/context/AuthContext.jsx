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
 try {
 const res = await axios.get(`${API_BASE_URL}/auth/dev-token`);
 if (res.data?.token) {
 localStorage.setItem('token', res.data.token);
 setUser(res.data.user);
 setLoading(false);
 return;
 }
 } catch (e) {
 console.warn('Could not fetch dev token:', e.message);
 }
 setUser({ name: 'Admin', email: 'admin@local.dev', isMaster: true, role: 'admin', plan: 'pro', theme: 'dark' });
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

 const refreshUser = async () => {
 const token = localStorage.getItem('token');
 if (!token) return;
 try {
 const res = await axios.get(`${API_BASE_URL}/auth/me`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 setUser(res.data);
 } catch (err) {
 console.warn('Failed to refresh user:', err.message);
 }
 };

 const updateProfile = async (profileData) => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.data?.user) {
 setUser(prev => ({ ...prev, ...res.data.user }));
 }
 return { success: true, message: res.data.message };
 } catch (error) {
 return { success: false, message: error.response?.data?.message || 'Errore durante l\'aggiornamento del profilo' };
 }
 };

 const changePassword = async (currentPassword, newPassword) => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.put(`${API_BASE_URL}/auth/change-password`, {
 currentPassword,
 newPassword
 }, {
 headers: { Authorization: `Bearer ${token}` }
 });
 return { success: true, message: res.data.message };
 } catch (error) {
 return { success: false, message: error.response?.data?.message || 'Errore durante la modifica della password' };
 }
 };

 const updatePreferences = async (preferencesData) => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.put(`${API_BASE_URL}/auth/preferences`, preferencesData, {
 headers: { Authorization: `Bearer ${token}` }
 });
 setUser(prev => ({ ...prev, preferences: res.data.preferences, theme: res.data.theme || prev.theme }));
 return { success: true, message: res.data.message };
 } catch (error) {
 return { success: false, message: error.response?.data?.message || 'Errore salvataggio preferenze' };
 }
 };

 const changeSubscription = async (action, interval = 'month') => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.post(`${API_BASE_URL}/auth/subscription/change`, { action, interval }, {
 headers: { Authorization: `Bearer ${token}` }
 });
 await refreshUser();
 return { success: true, message: res.data.message, data: res.data };
 } catch (error) {
 return { success: false, message: error.response?.data?.message || 'Errore gestione abbonamento' };
 }
 };

 const exportUserData = async () => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.get(`${API_BASE_URL}/auth/export-data`, {
 headers: { Authorization: `Bearer ${token}` },
 responseType: 'blob'
 });
 const blob = new Blob([res.data], { type: 'application/json' });
 const url = window.URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `tradervision_gdpr_export_${user?._id || 'user'}.json`;
 document.body.appendChild(a);
 a.click();
 window.URL.revokeObjectURL(url);
 document.body.removeChild(a);
 return { success: true };
 } catch (error) {
 return { success: false, message: 'Errore durante l\'esportazione dei dati' };
 }
 };

 const deleteAccount = async (password) => {
 try {
 const token = localStorage.getItem('token');
 const res = await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
 headers: { Authorization: `Bearer ${token}` },
 data: { password }
 });
 logout();
 return { success: true, message: res.data.message };
 } catch (error) {
 return { success: false, message: error.response?.data?.message || 'Errore eliminazione account' };
 }
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

 // Check 7-day trial validity
 const isTrialActive = Boolean(user?.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now());
 const trialDaysRemaining = isTrialActive 
 ? Math.max(1, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
 : 0;

 // Effective plan calculation
 const hasProPrivileges = Boolean(
 user?.isMaster || 
 user?.role === 'admin' || 
 user?.plan === 'pro' || 
 user?.subscriptionPlan === 'pro' || 
 user?.subscriptionStatus === 'active' || 
 isTrialActive
 );

 const effectivePlan = simulatedPlan ? simulatedPlan : (hasProPrivileges ? 'pro' : 'free');
 const effectiveIsMaster = simulatedPlan ? false : (user?.isMaster || user?.role === 'admin');

 return (
 <AuthContext.Provider value={{ 
 user, loading, login, logout, theme, changeTheme, updateSettings, 
 updateProfile, changePassword, updatePreferences, changeSubscription,
 exportUserData, deleteAccount, refreshUser,
 isTrialActive, trialDaysRemaining,
 simulatedPlan, setSimulatedPlan, effectivePlan, effectiveIsMaster
 }}>
 {!loading && children}
 </AuthContext.Provider>
 );
};
