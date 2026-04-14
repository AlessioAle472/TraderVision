const { calculateCurrentRegime } = require('./services/macroCalculator');
calculateCurrentRegime().then(res => console.log('Final Result:', res));
