const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testV1() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('Testing gemini-2.0-flash-exp...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent('Hi');
        console.log('Success with gemini-2.0-flash-exp!');
    } catch (e) {
        console.log('Failed with gemini-2.0-flash-exp: ' + e.message);
    }
}

testV1();
