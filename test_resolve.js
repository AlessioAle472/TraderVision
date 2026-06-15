const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/trader_vision', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const MarketConfig = require('./backend/models/MarketConfig');
    const ticker = "S&P 500";
    let resolvedYahooTicker = ticker;
    let resolvedName = ticker;
    const config = await MarketConfig.findOne({ configId: 'default' });
    if (config && config.assetGroups) {
      for (const group of Object.values(config.assetGroups)) {
        for (const [yTicker, name] of Object.entries(group.tickers)) {
          if (name === ticker || yTicker === ticker) {
            resolvedYahooTicker = yTicker;
            resolvedName = name;
            break;
          }
        }
      }
    }
    console.log({ resolvedYahooTicker, resolvedName });
    process.exit(0);
  });
