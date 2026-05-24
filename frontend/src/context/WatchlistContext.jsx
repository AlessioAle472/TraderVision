import { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext(null);

export const WatchlistProvider = ({ children }) => {
 const [watchlist, setWatchlist] = useState(() => {
 try {
 const stored = localStorage.getItem('tv_watchlist');
 return stored ? JSON.parse(stored) : [];
 } catch {
 return [];
 }
 });

 useEffect(() => {
 localStorage.setItem('tv_watchlist', JSON.stringify(watchlist));
 }, [watchlist]);

 const toggleWatchlist = (ticker) => {
 setWatchlist((prev) =>
 prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [ticker, ...prev]
 );
 };

 const isWatched = (ticker) => watchlist.includes(ticker);

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
