import { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext(null);

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem('tv_watchlist');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return Array.from(new Set(parsed.map((t) => String(t).trim().toUpperCase()).filter(Boolean)));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tv_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e);
    }
  }, [watchlist]);

  const toggleWatchlist = (ticker) => {
    if (!ticker) return;
    const clean = String(ticker).trim().toUpperCase();
    setWatchlist((prev) => {
      const exists = prev.some((t) => t.toUpperCase() === clean);
      return exists
        ? prev.filter((t) => t.toUpperCase() !== clean)
        : [clean, ...prev];
    });
  };

  const isWatched = (ticker) => {
    if (!ticker) return false;
    const clean = String(ticker).trim().toUpperCase();
    return watchlist.some((t) => t.toUpperCase() === clean);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, toggleWatchlist, isWatched }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
 const ctx = useContext(WatchlistContext);
 if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
 return ctx;
};
