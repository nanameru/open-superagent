'use server';

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

interface GenerateArticleResponse {
  content: string;
  error?: string;
}

export async function generateArticle(content: string): Promise<GenerateArticleResponse> {
  try {
    const prompt = `以下の投稿内容を要約して、重要なポイントをまとめた記事を生成してください：

${content}

要約は以下の形式で出力してください：
1. 全体の要約（3-4文）
2. 重要なポイント（箇条書き）
3. 結論`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "user" as const,
        content: prompt
      }
    ];

    const response = await client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: messages
    });

    const generatedContent = response.choices[0].message.content ?? '';

    return {
      content: generatedContent
    };

  } catch (error) {
    console.error('Error in generateArticle:', error);
    return {
      content: '',
      error: 'Failed to generate article'
    };
  }
}
