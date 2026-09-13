import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Loader2, TrendingUp, BarChart3, 
  Coins, Globe, Flame, PieChart, Star, CornerDownLeft 
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useWatchlist } from '../context/WatchlistContext';
import { searchClientAssets } from '../data/assetUniverse';

const SearchBar = ({ onAddTicker, onSearch, onSelectAsset }) => {
  const navigate = useNavigate();
  const { isWatched, toggleWatchlist } = useWatchlist();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize optional local filter for parent components
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (onSearchRef.current) {
      onSearchRef.current(query);
    }
  }, [query]);

  // Instant local search + debounced server sync
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    // 1. INSTANT 0ms local client match (guaranteed instant response)
    const instantLocal = searchClientAssets(trimmed);
    if (instantLocal.length > 0) {
      setResults(instantLocal);
      setIsOpen(true);
    }

    // 2. Parallel debounced server query (for remote DB search & freshest data)
    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const data = await apiClient.searchAssets(trimmed);
        if (Array.isArray(data) && data.length > 0) {
          // Merge server results with local matches, avoiding duplicates
          const seen = new Set();
          const combined = [];
          for (const item of [...data, ...instantLocal]) {
            const key = item.ticker.toUpperCase();
            if (!seen.has(key)) {
              seen.add(key);
              combined.push(item);
            }
          }
          setResults(combined.slice(0, 10));
          setIsOpen(true);
        } else if (instantLocal.length > 0) {
          setResults(instantLocal);
          setIsOpen(true);
        }
      } catch (error) {
        console.warn('Backend search fallback to local dataset:', error?.message);
        if (instantLocal.length > 0) {
          setResults(instantLocal);
          setIsOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (asset) => {
    if (!asset) return;
    
    if (onSelectAsset) {
      onSelectAsset(asset);
    }

    navigate(`/asset/${encodeURIComponent(asset.ticker)}`, {
      state: {
        asset,
        tvSymbol: asset.tvSymbol,
        category: asset.category
      }
    });

    setQuery('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Keyboard navigation: ArrowDown, ArrowUp, Enter, Escape
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryConfig = (cat = '') => {
    switch (cat.toUpperCase()) {
      case 'FOREX':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-sky-400" />,
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        };
      case 'INDICES':
        return {
          icon: <BarChart3 className="w-3.5 h-3.5 text-purple-400" />,
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
      case 'COMMODITIES':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'EQUITY':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'ETF':
        return {
          icon: <PieChart className="w-3.5 h-3.5 text-indigo-400" />,
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        };
      default:
        return {
          icon: <Coins className="w-3.5 h-3.5 text-slate-400" />,
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
    }
  };

  return (
    <div className="relative w-full max-w-md group" ref={dropdownRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cerca asset (es. EURUSD, SPX, Oro, AAPL, SPY)..."
          className="w-full bg-surface/90 hover:bg-surface focus:bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl py-2 pl-10 pr-10 text-xs sm:text-sm text-text placeholder-text-secondary/50 focus:outline-none transition-all shadow-inner"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}

          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1 hover:bg-white/10 rounded-md transition-colors text-text-secondary hover:text-white"
              title="Cancella"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Results Box */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {results.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto py-1.5 divide-y divide-white/[0.04]">
                {results.map((result, idx) => {
                  const catCfg = getCategoryConfig(result.category);
                  const isSelected = selectedIndex === idx;
                  const watched = isWatched(result.ticker);

                  return (
                    <div
                      key={result.ticker}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors cursor-pointer group/item ${
                        isSelected ? 'bg-primary/15' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Left: Icon, Ticker, Full Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                          {catCfg.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs sm:text-sm text-white group-hover/item:text-primary transition-colors tracking-tight">
                              {result.ticker}
                            </span>
                            {result.tvSymbol && (
                              <span className="text-[10px] font-mono text-text-secondary/60 hidden sm:inline">
                                {result.tvSymbol}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-secondary truncate max-w-[180px] sm:max-w-[240px]">
                            {result.name}
                          </div>
                        </div>
                      </div>

                      {/* Right: Category Tag & Watchlist Star */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${catCfg.badge}`}>
                          {result.category}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(result.ticker);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-transform active:scale-90"
                          title={watched ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                        >
                          <Star className={`w-3.5 h-3.5 transition-colors ${
                            watched ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'
                          }`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer hint */}
              <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-text-secondary font-medium">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3 text-primary" /> Seleziona per aprire il grafico
                </span>
                <span>Max 10 risultati</span>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-text-secondary text-xs">
              Nessun asset corrispondente nell'universo selezionato.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
