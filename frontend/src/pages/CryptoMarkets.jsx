import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../services/apiClient';

const AsyncSmartQuantCell = ({ ticker }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const cellRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cellRef.current) observer.observe(cellRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let isMounted = true;
    const fetchScore = async () => {
      try {
        // Piccolo ritardo randomico (0-2s) per evitare un "thundering herd" sul backend e socket exhaustion
        await new Promise(res => setTimeout(res, Math.random() * 2000));
        const data = await apiClient.getAssetDetail(ticker);
        if (isMounted) {
          setScore(data.smartScore || 0);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setScore(0);
          setLoading(false);
        }
      }
    };
    fetchScore();
    return () => { isMounted = false; };
  }, [ticker, isVisible]);

  const getSmartScoreColor = (s) => {
    if (s > 70) return 'text-success bg-success/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]';
    if (s >= 40) return 'text-yellow-400 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.15)]';
    return 'text-danger bg-danger/10 ';
  };

  if (loading) {
    return <div ref={cellRef} className="h-6 w-12 bg-slate-700/50 rounded-xl animate-pulse mx-auto"></div>;
  }

  return (
    <span ref={cellRef} className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all ${getSmartScoreColor(score)}`}>
      {score}
    </span>
  );
};

const CryptoMarkets = () => {
  const [cryptos, setCryptos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
        );
        setCryptos(response.data);
      } catch (err) {
        console.error('Error fetching crypto data:', err);
        setError('Errore nel caricamento dei dati crypto.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCryptos();
  }, []);

  const handleRowClick = (symbol) => {
    // Trasforma in formato es. BTC-USD
    const formattedTicker = `${symbol.toUpperCase()}-USD`;
    navigate(`/asset/${formattedTicker}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatMarketCap = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text tracking-tight">Criptovalute</h1>
        <p className="text-text-secondary mt-1">
          Monitora in tempo reale le principali criptovalute per capitalizzazione di mercato.
        </p>
      </div>

      <div className="bg-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-text-secondary text-sm border-b border-white/5">
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium text-right">Prezzo</th>
                <th className="px-6 py-4 font-medium text-right">Variaz. 24h</th>
                <th className="px-6 py-4 font-medium text-right">Market Cap</th>
                <th className="px-6 py-4 font-medium text-center">Smart Quant</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton Loaders
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index} className="border-b border-white/5 last:border-none">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700/50 animate-pulse"></div>
                        <div>
                          <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-12 bg-slate-700/50 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 w-12 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-danger">
                    {error}
                  </td>
                </tr>
              ) : (
                cryptos.map((coin) => (
                  <tr
                    key={coin.id}
                    onClick={() => handleRowClick(coin.symbol)}
                    className="group border-b border-white/5 last:border-none hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-semibold text-text group-hover:text-primary transition-colors">
                            {coin.name}
                          </div>
                          <div className="text-xs text-text-secondary uppercase">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-text">
                      {formatCurrency(coin.current_price)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${
                        coin.price_change_percentage_24h >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-text-secondary">
                      {formatMarketCap(coin.market_cap)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AsyncSmartQuantCell ticker={`${coin.symbol.toUpperCase()}-USD`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CryptoMarkets;
