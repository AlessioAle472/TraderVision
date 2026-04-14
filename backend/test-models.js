const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // SDK doesn't have a direct listModels, but we can try to guess or use a script
        console.log('Testing gemini-1.5-flash and gemini-1.5-pro...');
        
        async function testModel(name) {
            try {
                const model = genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent('Hi');
                console.log(`Model ${name} works!`);
                return true;
            } catch (e) {
                console.log(`Model ${name} failed: ${e.message}`);
                return false;
            }
        }

        await testModel('gemini-1.5-flash');
        await testModel('gemini-1.5-pro');
        await testModel('gemini-pro');
    } catch (error) {
        console.error('List models failed:', error.message);
    }
}

listModels();
