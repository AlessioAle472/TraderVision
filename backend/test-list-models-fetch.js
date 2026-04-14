const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listAllModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // listModels is not on the genAI instance directly in some versions
        // but we can try to fetch it if we know the endpoint or use a different client
        console.log('API Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
        
        // Let's try to use fetch directly to see if the key works at all
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await resp.json();
        console.log('List Models Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch models failed:', error.message);
    }
}

listAllModels();
