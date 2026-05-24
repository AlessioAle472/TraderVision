const mongoose = require('mongoose');

const marketConfigSchema = new mongoose.Schema({
  // Only one config document should exist usually, or we can use a key
  configId: { type: String, default: 'default', unique: true },
  assetGroups: {
    type: Object,
    default: {
      usa: { label: 'USA', tickers: { '^GSPC': 'S&P 500', '^IXIC': 'Nasdaq', '^DJI': 'Dow Jones', '^RUT': 'Russell 2000', '^VIX': 'VIX' } },
      europa: { label: 'Europa', tickers: { '^GDAXI': 'Germania', '^FCHI': 'Francia', '^FTSE': 'UK', 'FTSEMIB.MI': 'Italia', '^IBEX': 'Spagna', '^STOXX50E': 'Euro Stoxx 50' } },
      asia: { label: 'Asia', tickers: { '^N225': 'Giappone', '^HSI': 'Hong Kong', '000001.SS': 'Cina', '^STI': 'Singapore', '^BSESN': 'India' } },
      developed: { label: 'Developed', tickers: { '^GSPTSE': 'Canada', '^AS51': 'Australia', '^SSMI': 'Svizzera', '^OMX': 'Svezia', '^OSLO': 'Norvegia', '^TA125.TA': 'Israele' } },
      emergenti: { label: 'Emergenti', tickers: { 'EEM': 'MSCI EM', '^BVSP': 'Brasile', '^MXX': 'Messico', '^KS11': 'Corea', 'RSX': 'Russia' } },
      forex: { label: 'Forex', tickers: { 'USDCHF=X': 'USD/CHF', 'USDCAD=X': 'USD/CAD', 'USDJPY=X': 'USD/JPY', 'AUDJPY=X': 'AUD/JPY', 'CHFJPY=X': 'CHF/JPY', 'AUDUSD=X': 'AUD/USD', 'GBPUSD=X': 'GBP/USD', 'EURJPY=X': 'EUR/JPY', 'EURGBP=X': 'EUR/GBP', 'EURUSD=X': 'EUR/USD', 'NZDUSD=X': 'NZD/USD', 'EURAUD=X': 'EUR/AUD' } },
      crypto: { label: 'Crypto', tickers: { 'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum', 'SOL-USD': 'Solana', 'BNB-USD': 'BNB', 'XRP-USD': 'XRP', 'TRX-USD': 'Tron', 'ADA-USD': 'Cardano', 'LINK-USD': 'Chainlink', 'MATIC-USD': 'Polygon', 'AVAX-USD': 'Avalanche', 'DOGE-USD': 'Dogecoin', 'DOT-USD': 'Polkadot', 'TON-USD': 'Toncoin', 'HBAR-USD': 'Hedera', 'XLM-USD': 'Stellar', 'NEAR-USD': 'NEAR', 'UNI-USD': 'Uniswap', 'LTC-USD': 'Litecoin', 'XMR-USD': 'Monero', 'ETC-USD': 'Ethereum Classic', 'VET-USD': 'VeChain', 'USDT-USD': 'Tether', 'USDC-USD': 'USDC' } },
      commodities: { label: 'Commodities', tickers: { 'BZ=F': 'Brent Oil', 'CL=F': 'Crude Oil', 'NG=F': 'Nat Gas', 'GC=F': 'Gold', 'SI=F': 'Silver', 'HG=F': 'Copper', 'URA': 'Uranium ETF', 'DBA': 'Agriculture', 'DBC': 'Commodities', 'GSG': 'GSG Index' } }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('MarketConfig', marketConfigSchema);
