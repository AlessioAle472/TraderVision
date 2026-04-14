const macroDeepDiveService = require('./services/macroDeepDiveService');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    try {
        console.log('--- Testing Macro Deep Dive Service ---');
        const data = await macroDeepDiveService.getDeepDiveData();
        console.log('Fundamentals:', JSON.stringify(data.fundamentals, null, 2));
        console.log('Correlation Matrix (first few):', JSON.stringify(data.correlationMatrix, null, 2));
        console.log('Chart Data Length:', data.chart.length);
        console.log('SUCCESS');
    } catch (error) {
        console.error('TEST FAILED:', error.message);
        process.exit(1);
    }
}

test();
