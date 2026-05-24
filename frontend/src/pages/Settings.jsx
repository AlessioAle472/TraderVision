import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Moon, Sun, Monitor, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const Settings = () => {
 const { user, updateSettings } = useAuth();
 
 const [formData, setFormData] = useState({
 email: '',
 password: '',
 confirmPassword: '',
 });
 

 const [status, setStatus] = useState({ type: '', message: '' });
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
 if (user) {
 setFormData(prev => ({ ...prev, email: user.email }));
 }
 }, [user]);

 const handleChange = (e) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };



 const handleSubmit = async (e) => {
 e.preventDefault();
 setStatus({ type: '', message: '' });

 if (formData.password && formData.password !== formData.confirmPassword) {
 setStatus({ type: 'error', message: 'Le password non coincidono.' });
 return;
 }

 setIsLoading(true);

 const updateData = {};
 if (formData.email !== user?.email) updateData.email = formData.email;
 if (formData.password) updateData.password = formData.password;

 if (Object.keys(updateData).length === 0) {
 setStatus({ type: 'info', message: 'Nessuna modifica da salvare.' });
 setIsLoading(false);
 return;
 }

 const result = await updateSettings(updateData);
 
 if (result.success) {
 setStatus({ type: 'success', message: 'Impostazioni aggiornate con successo!' });
 setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
 } else {
 setStatus({ type: 'error', message: result.message || 'Errore durante l\'aggiornamento.' });
 }
 
 setIsLoading(false);
 };

 if (!user) {
 return <div className="p-8 text-center text-gray-500">Effettua l'accesso per visualizzare le impostazioni.</div>;
 }

 return (
 <div className="max-w-4xl mx-auto space-y-8 pb-12">
 <header className="mb-10">
 <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
 <User className="w-8 h-8 text-primary"/>
 Impostazioni Profilo
 </h1>
 <p className="text-gray-500 font-medium mt-2">
 Gestisci le tue preferenze, l'account e l'aspetto dell'applicazione.
 </p>
 </header>

 {status.message && (
 <div className={`p-4 rounded-xl flex items-center gap-3 ${
 status.type === 'error' ? 'bg-danger/10 text-danger ' : 
 status.type === 'success' ? 'bg-success/10 text-success ' : 
 'bg-primary/10 text-primary '
 }`}>
 {status.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
 <p className="font-medium">{status.message}</p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-8">
 


 {/* Account Details Section */}
 <section className="bg-surface p-6 rounded-2xl /30 dark:/50 shadow-sm">
 <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
 Credenziali
 </h2>
 
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-medium text-text">Indirizzo Email</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Mail className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="email"
 name="email"
 value={formData.email}
 onChange={handleChange}
 className="w-full pl-10 pr-4 py-3 bg-background /20 dark: rounded-xl focus:outline-none focus: focus: text-text transition-colors"
 placeholder="La tua email"
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-sm font-medium text-text">Nuova Password</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Lock className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="password"
 name="password"
 value={formData.password}
 onChange={handleChange}
 className="w-full pl-10 pr-4 py-3 bg-background /20 dark: rounded-xl focus:outline-none focus: focus: text-text transition-colors"
 placeholder="Lascia vuoto per non modificare"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium text-text">Conferma Nuova Password</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Lock className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="password"
 name="confirmPassword"
 value={formData.confirmPassword}
 onChange={handleChange}
 className="w-full pl-10 pr-4 py-3 bg-background /20 dark: rounded-xl focus:outline-none focus: focus: text-text transition-colors"
 placeholder="Conferma la password"
 />
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Master User Badge */}
 {user?.isMaster && (
 <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 rounded-2xl /20">
 <h3 className="text-amber-500 font-bold flex items-center gap-2 mb-2">
 Privilegi Master Attivi
 </h3>
 <p className="text-sm text-gray-600 dark:text-gray-400">
 Il tuo account ha accesso completo a tutte le funzionalità della piattaforma senza restrizioni.
 </p>
 </section>
 )}

 <div className="flex justify-end pt-4">
 <button
 type="submit"
 disabled={isLoading}
 className="flex items-center gap-2 py-3 px-8 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
 >
 <Save className="w-5 h-5"/>
 {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default Settings;
