const mds = require('./services/marketDataService');
mds.getDashboardData({'SPY': 'SPY'}).then(res => console.log('Final Result:', JSON.stringify(res.assets[0].smartScore, null, 2)));
