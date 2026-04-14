const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listNames() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await resp.json();
        if (data.models) {
            console.log('Available Model Names:');
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log('No models found or error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

listNames();
