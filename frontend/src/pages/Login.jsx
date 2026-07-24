import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const { login } = useAuth();
 const navigate = useNavigate();

 const API_BASE_URL = (() => {
 const url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
 return url.endsWith('/api') ? url :`${url}/api`;
 })();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setIsLoading(true);
 setError('');

 try {
 const { data } = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
 login(data, data.token);
 navigate('/');
 } catch (error) {
 setError(error.response?.data?.error || error.response?.data?.message || 'Errore di connessione al server');
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-background text-text font-inter">
 <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
 
 <div className="relative z-10 w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl /20 dark: rounded-2xl shadow-2xl">
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">Trader Vision</h1>
 <p className="text-gray-500 dark:text-slate-400">Bentornato, inserisci le tue credenziali</p>
 </div>

 {error && (
 <div className="mb-4 p-3 bg-danger/10 rounded-lg text-danger text-sm text-center">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-300">Email</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Mail className="h-5 w-5 text-slate-500"/>
 </div>
 <input
 type="email"
 required
 className="w-full pl-10 pr-4 py-2 bg-background /20 dark: rounded-lg focus:outline-none focus: focus: text-text transition"
 placeholder="mario@email.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-300">Password</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Lock className="h-5 w-5 text-slate-500"/>
 </div>
 <input
 type="password"
 required
 className="w-full pl-10 pr-4 py-2 bg-background /20 dark: rounded-lg focus:outline-none focus: focus: text-text transition"
 placeholder="••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
 >
 {isLoading ? 'Accesso in corso...' : 'Accedi'}
 </button>
 </form>

 <div className="mt-6 text-center text-sm text-slate-400">
 Non hai un account?{' '}
 <Link to="/register"className="text-indigo-400 hover:text-indigo-300 font-medium">
 Registrati
 </Link>
 </div>
 </div>
 </div>
 );
};

export default Login;
