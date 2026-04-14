require('dotenv').config();
const axios = require('axios');

async function testApi() {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  console.log('Testing Finnhub Key:', finnhubKey.substring(0, 5) + '...');
  
  try {
    const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${finnhubKey}`);
    console.log('Finnhub Quote Response:', res.status, res.data);
  } catch (error) {
    console.error('Finnhub Error:', error.response ? error.response.status : error.message);
    if (error.response) console.error(error.response.data);
  }
}

testApi();
