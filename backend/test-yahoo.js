const { YahooFinance } = require('yahoo-finance2');
const yf = new YahooFinance();

async function test() {
  try {
    const res = await yf.historical('AAPL', { period1: '2025-01-01', period2: '2026-03-01' });
    console.log(res[0]);
  } catch(e) {
    console.error(e.message);
  }
}
test();
