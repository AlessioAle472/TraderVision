import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Admin() {
 const { user } = useAuth();
 const [config, setConfig] = useState(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');

 useEffect(() => {
 if (user && user.isMaster) {
 fetchConfig();
 }
 }, [user]);

 const fetchConfig = async () => {
 try {
 const res = await axios.get('http://localhost:49152/api/admin/config', {
 headers: { Authorization:`Bearer ${localStorage.getItem('token')}`}
 });
 setConfig(res.data.assetGroups);
 setLoading(false);
 } catch (err) {
 console.error(err);
 setMsg('Failed to load config');
 setLoading(false);
 }
 };

 const handleSave = async () => {
 setSaving(true);
 setMsg('');
 try {
 await axios.post('http://localhost:49152/api/admin/config', { assetGroups: config }, {
 headers: { Authorization:`Bearer ${localStorage.getItem('token')}`}
 });
 setMsg('Configuration saved successfully!');
 } catch (err) {
 console.error(err);
 setMsg('Failed to save config');
 }
 setSaving(false);
 };

 const handleForceRefresh = async () => {
 try {
 setMsg('Triggering zero-lag refresh...');
 const res = await axios.post('http://localhost:49152/api/admin/force-refresh', {}, {
 headers: { Authorization:`Bearer ${localStorage.getItem('token')}`}
 });
 setMsg(res.data.message);
 } catch (err) {
 console.error(err);
 setMsg('Failed to force refresh');
 }
 };

 const updateTicker = (groupKey, oldYf, newYf, newLabel) => {
 const updated = { ...config };
 const groupTickers = { ...updated[groupKey].tickers };
 delete groupTickers[oldYf];
 groupTickers[newYf] = newLabel;
 updated[groupKey].tickers = groupTickers;
 setConfig(updated);
 };

 const addTicker = (groupKey) => {
 const updated = { ...config };
 updated[groupKey].tickers['NEW_TICKER'] = 'New Label';
 setConfig(updated);
 };

 const removeTicker = (groupKey, yf) => {
 const updated = { ...config };
 delete updated[groupKey].tickers[yf];
 setConfig(updated);
 };

 if (!user || !user.isMaster) {
 return (
 <div className="flex h-screen items-center justify-center bg-gray-900 text-red-500 p-6">
 <h1 className="text-2xl">Access Denied. Master user only.</h1>
 </div>
 );
 }

 if (loading) return <div className="text-white p-6">Loading config...</div>;

 return (
 <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 font-sans">
 <div className="max-w-6xl mx-auto space-y-8">
 
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
 Admin Configuration
 </h1>
 <p className="text-gray-400 mt-2 text-sm">
 Manage preloaded crosses and assets for the Zero-Lag Market Engine (updates at 06:00 AM daily).
 </p>
 </div>
 <div className="flex gap-4">
 <button 
 onClick={handleForceRefresh}
 className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg shadow font-semibold transition"
 >
 Force Background Refresh
 </button>
 <button 
 onClick={handleSave}
 disabled={saving}
 className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow font-semibold transition"
 >
 {saving ? 'Saving...' : 'Save Config'}
 </button>
 </div>
 </div>

 {msg && (
 <div className="p-4 bg-gray-800 rounded-xl text-green-400">
 {msg}
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {config && Object.keys(config).map(groupKey => (
 <div key={groupKey} className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-md">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-xl font-bold text-gray-200 capitalize">{config[groupKey].label}</h2>
 <button 
 onClick={() => addTicker(groupKey)}
 className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 transition"
 >
 + Add Asset
 </button>
 </div>
 <div className="space-y-3">
 {Object.keys(config[groupKey].tickers).map(yf => (
 <div key={yf} className="flex gap-3 items-center bg-gray-950 p-2 rounded-lg">
 <input 
 type="text"
 value={yf}
 onChange={(e) => updateTicker(groupKey, yf, e.target.value, config[groupKey].tickers[yf])}
 className="bg-transparent text-yellow-400 w-1/3 focus:outline-none focus:"
 placeholder="Yahoo Ticker"
 />
 <input 
 type="text"
 value={config[groupKey].tickers[yf]}
 onChange={(e) => updateTicker(groupKey, yf, yf, e.target.value)}
 className="bg-transparent text-gray-300 w-full focus:outline-none focus:"
 placeholder="Display Name"
 />
 <button 
 onClick={() => removeTicker(groupKey, yf)}
 className="text-red-500 hover:text-red-400 font-bold px-2"
 >
 ×
 </button>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

export default Admin;
