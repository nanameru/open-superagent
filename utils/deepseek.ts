'use server';

import OpenAI from 'openai';

export async function generateSubQueries(userQuery: string): Promise<string[]> {
  try {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const prompt = `Given the search query: "${userQuery}", generate 3 alternative search queries that could help find relevant information. Format the response as a comma-separated list.`;
    
    const response = await client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    return content?.split(',').map(query => query.trim()) ?? [];
  } catch (error) {
    console.error('Error generating sub-queries:', error);
    return [];
  }
}
