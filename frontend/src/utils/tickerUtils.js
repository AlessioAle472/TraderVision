/**
 * Smart Symbol Resolver for TradingView
 * Translates Yahoo Finance tickers to the most reliable TradingView equivalent.
 */
export const resolveTVSymbol = (yfSymbol) => {
    if (!yfSymbol) return 'NASDAQ:AAPL';
    
    // 1. Forex (e.g., EURUSD=X -> FX_IDC:EURUSD)
    // FX_IDC is generally the most comprehensive and stable feed on TV for Forex.
    if (yfSymbol.endsWith('=X')) {
        const pair = yfSymbol.replace('=X', '');
        return `FX_IDC:${pair}`;
    }
    
    // 2. Crypto (e.g., BTC-USD -> BINANCE:BTCUSDT)
    if (yfSymbol.includes('-USD')) {
        const crypto = yfSymbol.split('-')[0];
        return `BINANCE:${crypto}USDT`;
    }

    // 3. Indices (e.g., ^GSPC -> SP:SPX)
    if (yfSymbol.startsWith('^')) {
        const indexMap = {
            '^GSPC': 'SP:SPX',     // S&P 500
            '^IXIC': 'NASDAQ:NDX', // Nasdaq 100
            '^DJI': 'DJ:DJI',      // Dow Jones
            '^RUT': 'RUSSELL:RUT', // Russell 2000
            '^VIX': 'CBOE:VIX',    // Volatility Index
            '^N225': 'TVC:NI225',  // Nikkei 225
            '^FTSE': 'TVC:UKX',    // FTSE 100
            '^GDAXI': 'XETR:DAX',  // DAX
            '^FCHI': 'EURONEXT:PX1'// CAC 40
        };
        return indexMap[yfSymbol] || yfSymbol.replace('^', '');
    }

    // 4. Commodities (e.g., GC=F -> COMEX:GC1!)
    if (yfSymbol.endsWith('=F')) {
        const commMap = {
            'GC=F': 'COMEX:GC1!',  // Gold
            'CL=F': 'NYMEX:CL1!',  // Crude Oil WTI
            'SI=F': 'COMEX:SI1!',  // Silver
            'HG=F': 'COMEX:HG1!',  // Copper
            'BZ=F': 'TVC:UKOIL',   // Brent Crude
            'NG=F': 'NYMEX:NG1!'   // Natural Gas
        };
        return commMap[yfSymbol] || yfSymbol.replace('=F', '');
    }
    
    // 5. Standard Equities / Default
    // Assuming standard US equities if no special characters are present.
    // TradingView is usually smart enough to resolve 'AAPL' or 'MSFT' directly without an exchange prefix.
    return yfSymbol;
};
