import OpenAI from 'openai';

// export const openai = new OpenAI({
//     baseURL: 'https://openrouter.ai/api/v1',
//     apiKey: process.env.OPENROUTER_API_KEY,
// });

export const openai = new OpenAI({
    baseURL:"https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
});


