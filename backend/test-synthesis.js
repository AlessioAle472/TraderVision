const { generateSynthesis } = require('./services/aiSynthesisService');
require('dotenv').config();

async function test() {
    try {
        console.log('--- Testing Regime Synthesis ---');
        const fundamentals = { 
            vix: { price: 24.44 }, 
            dxy: { price: 99.48 }, 
            yieldCurve: { price: 0.71 } 
        };
        const correlations = { SPY: { GLD: 0.12, USO: -0.45 }, GLD: { SPY: 0.12, USO: 0.1 }, USO: { SPY: -0.45, GLD: 0.1 } };
        const result = await generateSynthesis([], fundamentals, correlations, 'Macro Divergence');
        console.log('Synthesis Result:', JSON.stringify(result, null, 2));
        console.log('SUCCESS');
    } catch (error) {
        console.error('TEST FAILED:', error.message);
    }
}

test();
