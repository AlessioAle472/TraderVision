import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol }) => {
  const container = useRef();

  useEffect(() => {
    // Function to map Yahoo Finance tickers to TradingView symbols
    const mapTickerToTV = (t) => {
      if (!t) return 'NASDAQ:AAPL';
      
      // Forex: EURUSD=X -> FXCM:EURUSD
      if (t.endsWith('=X')) return `FXCM:${t.replace('=X', '')}`;
      
      // Indices
      if (t === '^GSPC') return 'SPX';
      if (t === '^IXIC') return 'NAS100';
      if (t === '^DJI') return 'DJI';
      
      // Commodities
      if (t === 'GC=F') return 'COMEX:GC1!';
      if (t === 'CL=F') return 'NYMEX:CL1!';
      if (t === 'SI=F') return 'COMEX:SI1!';
      if (t === 'HG=F') return 'COMEX:HG1!';
      
      // Crypto
      if (t.endsWith('-USD')) return `BINANCE:${t.replace('-USD', 'USDT')}`;

      return t;
    };

    const finalSymbol = mapTickerToTV(symbol);

    // Clean up previous script if any
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // HARDCODED LOCKDOWN CONFIGURATION
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": finalSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": false,
      "hide_top_toolbar": true,
      "hide_side_toolbar": true,
      "withdateranges": false,
      "save_image": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container} style={{ minHeight: '500px' }}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

export default TradingViewWidget;
