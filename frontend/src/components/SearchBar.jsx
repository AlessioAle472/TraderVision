import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, TrendingUp, BarChart3, Coins } from 'lucide-react';
import apiClient from '../services/apiClient';

const SearchBar = ({ onAddTicker, onSearch }) => {
 const navigate = useNavigate();
 const [query, setQuery] = useState('');
 const [results, setResults] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef(null);

 // Real-time filtering for Dashboard
 useEffect(() => {
 if (onSearch) {
 onSearch(query);
 }
 }, [query, onSearch]);

 // Debounce logic for server-side search
 useEffect(() => {
 if (!query.trim() || query.length < 2) {
 setResults([]);
 return;
 }

 const handler = setTimeout(async () => {
 setLoading(true);
 try {
 const data = await apiClient.searchAssets(query);
 setResults(data);
 setIsOpen(true);
 } catch (error) {
 console.error('Search failed:', error);
 } finally {
 setLoading(false);
 }
 }, 300);

 return () => clearTimeout(handler);
 }, [query]);

 // Close dropdown on click outside
 useEffect(() => {
 const handleClickOutside = (event) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleSelect = (result) => {
 navigate(`/asset/${encodeURIComponent(result.ticker)}`);
 setQuery('');
 setIsOpen(false);
 };

 const getTypeIcon = (type) => {
 const t = type.toLowerCase();
 if (t.includes('equity') || t.includes('stock')) return <BarChart3 className="w-4 h-4 text-blue-400"/>;
 if (t.includes('crypto')) return <Coins className="w-4 h-4 text-orange-400"/>;
 return <TrendingUp className="w-4 h-4 text-emerald-400"/>;
 };

 return (
 <div className="relative w-full max-w-md group"ref={dropdownRef}>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors"/>
 <input
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onFocus={() => query.length >= 2 && setIsOpen(true)}
 placeholder="Cerca ticker (es. AAPL, BTC, Oro)..."
 className="w-full bg-surface rounded-xl py-2 pl-10 pr-10 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus: focus: focus: transition-all backdrop-blur-sm"
 />
 {loading ? (
 <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin"/>
 ) : query && (
 <button
 onClick={() => setQuery('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-hover rounded-md transition-colors"
 >
 <X className="w-3.5 h-3.5 text-text-secondary"/>
 </button>
 )}
 </div>

 {isOpen && results.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="max-h-[320px] overflow-y-auto py-2">
 {results.map((result) => (
 <button
 key={result.ticker}
 onClick={() => handleSelect(result)}
 className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left group/item"
 >
 <div className="flex items-center gap-3">
 <div className="p-2 bg-background rounded-lg group-hover/item:bg-surface transition-colors">
 {getTypeIcon(result.type)}
 </div>
 <div>
 <div className="font-bold text-text group-hover/item:text-primary transition-colors">
 {result.ticker}
 </div>
 <div className="text-xs text-text-secondary truncate max-w-[200px]">
 {result.name}
 </div>
 </div>
 </div>
 <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-background px-2 py-0.5 rounded group-hover/item: group-hover/item:text-text">
 {result.type}
 </div>
 </button>
 ))}
 </div>
 <div className="px-4 py-2 bg-background text-[10px] text-text-secondary text-center uppercase tracking-widest">
 Premi Invio per selezionare
 </div>
 </div>
 )}
 </div>
 );
};

export default SearchBar;
