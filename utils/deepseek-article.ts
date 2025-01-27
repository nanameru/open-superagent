'use server';

import OpenAI from 'openai';

const TIMEOUT = 30000; // 30 seconds

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY as string,
  baseURL: "https://api.deepseek.com",
  timeout: TIMEOUT,
  maxRetries: 3,
});

// APIクライアントの状態をチェック
if (!client) {
  console.error('OpenAI client initialization failed');
  throw new Error('Failed to initialize OpenAI client');
}

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('DEEPSEEK_API_KEY is not set');
  throw new Error('DeepSeek API key is not configured');
}

export interface GenerateArticleResponse {
  content: string;
  error?: string;
}

// DeepSeek APIのための拡張型定義
interface DeepSeekDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

interface DeepSeekChoice extends Omit<OpenAI.Chat.Completions.ChatCompletionChunk.Choice, 'delta'> {
  delta: DeepSeekDelta;
}

interface DeepSeekChunk extends Omit<OpenAI.Chat.Completions.ChatCompletionChunk, 'choices'> {
  choices: DeepSeekChoice[];
}

// 3段階のReasoning(推論)を経て約1万文字規模の学術的レポートを生成する例
export async function generateDetailedArticle(
  content: string,
  searchQuery: string,
  onChunk: (chunk: { content: string }) => void
): Promise<void> {
  // 入力サイズの制限を設定（日本語の場合、1トークンあたり約1-2文字）
  const MAX_CONTENT_SIZE = 4000; // 約2000トークン相当
  if (content.length > MAX_CONTENT_SIZE) {
    console.warn(`Content size (${content.length}) exceeds maximum allowed size (${MAX_CONTENT_SIZE})`);
    const truncatedContent = content.slice(0, MAX_CONTENT_SIZE);
    console.log(`Content truncated to ${truncatedContent.length} characters`);
    content = truncatedContent;
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  // Initialize OpenAI client with error handling
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY as string,
    baseURL: "https://api.deepseek.com"
  });

  // API connection test
  try {
    console.log("Testing DeepSeek API connection...");
    const testResponse = await client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: "test" }],
      stream: false
    });
    console.log("DeepSeek API connection test successful");
  } catch (error) {
    console.error("DeepSeek API connection test failed:", error);
    throw new Error(`DeepSeek API connection failed: ${error}`);
  }

  while (attempt < MAX_RETRIES) {
    attempt++;
    console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);

    try {
      console.log("Setting up messages for Round 1...");
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `あなたは学術的な文章を書くAIアシスタントです。
以下の要件に従って文章を生成してください：

1. 学術的・論理的な文体を使用
2. 明確な構造（序論・本論・結論）
3. 客観的なデータや研究に基づく記述
4. 適切な引用や参考文献の提示
5. 専門用語の適切な説明
6. 参考文献一覧の形式（APA, MLA など）は後の段階で明示する予定
7. できる限り論理的・学術的な言い回しを意識する
`
        },
        {
          role: "user",
          content: `以下の内容を元に、「${searchQuery}」というテーマで学術的な文章を生成してください：

${content}`
        }
      ];

      console.log("Creating stream for Round 1...");
      const stream = await client.chat.completions.create({
        model: "deepseek-reasoner",
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000, // トークン数を制限
      });

      let contentRound1 = "";
      let reasoningContent = "";
      let chunkCount = 0;
      
      try {
        console.log("Starting stream processing for Round 1...");
        for await (const chunk of stream as AsyncIterable<DeepSeekChunk>) {
          if (!chunk || !chunk.choices || chunk.choices.length === 0) {
            console.warn("Received invalid chunk:", chunk);
            continue;
          }

          // クォータ制限エラーのチェック
          if (chunk.choices[0]?.delta?.content?.includes("QUOTA_BYTES quota exceeded")) {
            throw new Error("API quota exceeded. Please try with smaller input or contact support.");
          }

          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || '';
          const reasoning = chunk.choices[0]?.delta?.reasoning_content;
          
          console.log(`Processing chunk ${chunkCount}:`, {
            hasContent: !!content,
            hasReasoning: !!reasoning,
            chunkSize: content.length + (reasoning?.length || 0)
          });

          if (reasoning) {
            reasoningContent += reasoning;
            console.log(`Chunk ${chunkCount} reasoning:`, reasoning);
          } else if (content) {
            contentRound1 += content;
            onChunk({ content });
            console.log(`Chunk ${chunkCount} content:`, content);
          }
        }
        console.log("Round 1 stream processing completed");

        // Round 2の処理も同様に改善
        console.log("Setting up messages for Round 2...");
        messages.push({ role: "assistant", content: contentRound1 });
        messages.push({
          role: "user",
          content: "前回の内容を踏まえて、さらに詳しく説明を展開してください。特に重要なポイントや具体例を追加してください。"
        });

        console.log("Creating stream for Round 2...");
        const stream2 = await client.chat.completions.create({
          model: "deepseek-reasoner",
          messages: messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000, // トークン数を制限
        });

        let contentRound2 = "";
        let chunkCount2 = 0;

        try {
          console.log("Starting stream processing for Round 2...");
          for await (const chunk of stream2 as AsyncIterable<DeepSeekChunk>) {
            if (!chunk || !chunk.choices || chunk.choices.length === 0) {
              console.warn("Received invalid chunk in Round 2:", chunk);
              continue;
            }

            // クォータ制限エラーのチェック
            if (chunk.choices[0]?.delta?.content?.includes("QUOTA_BYTES quota exceeded")) {
              throw new Error("API quota exceeded. Please try with smaller input or contact support.");
            }

            chunkCount2++;
            const content = chunk.choices[0]?.delta?.content || '';
            const reasoning = chunk.choices[0]?.delta?.reasoning_content;
            
            console.log(`Processing chunk ${chunkCount2} in Round 2:`, {
              hasContent: !!content,
              hasReasoning: !!reasoning,
              chunkSize: content.length + (reasoning?.length || 0)
            });

            if (reasoning) {
              reasoningContent += reasoning;
              console.log(`Chunk ${chunkCount2} reasoning:`, reasoning);
            } else if (content) {
              contentRound2 += content;
              onChunk({ content });
              console.log(`Chunk ${chunkCount2} content:`, content);
            }
          }
          console.log("Round 2 stream processing completed");

          // Round 3の処理も同様に改善
          console.log("Setting up messages for Round 3...");
          messages.push({ role: "assistant", content: contentRound2 });
          messages.push({
            role: "user",
            content: "これまでの内容を踏まえて、結論部分を充実させ、全体をまとめてください。また、必要に応じて参考文献も追加してください。"
          });

          console.log("Creating stream for Round 3...");
          const stream3 = await client.chat.completions.create({
            model: "deepseek-reasoner",
            messages: messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000, // トークン数を制限
          });

          let contentRound3 = "";
          let chunkCount3 = 0;

          try {
            console.log("Starting stream processing for Round 3...");
            for await (const chunk of stream3 as AsyncIterable<DeepSeekChunk>) {
              if (!chunk || !chunk.choices || chunk.choices.length === 0) {
                console.warn("Received invalid chunk in Round 3:", chunk);
                continue;
              }

              // クォータ制限エラーのチェック
              if (chunk.choices[0]?.delta?.content?.includes("QUOTA_BYTES quota exceeded")) {
                throw new Error("API quota exceeded. Please try with smaller input or contact support.");
              }

              chunkCount3++;
              const content = chunk.choices[0]?.delta?.content || '';
              const reasoning = chunk.choices[0]?.delta?.reasoning_content;
              
              console.log(`Processing chunk ${chunkCount3} in Round 3:`, {
                hasContent: !!content,
                hasReasoning: !!reasoning,
                chunkSize: content.length + (reasoning?.length || 0)
              });

              if (reasoning) {
                reasoningContent += reasoning;
                console.log(`Chunk ${chunkCount3} reasoning:`, reasoning);
              } else if (content) {
                contentRound3 += content;
                onChunk({ content });
                console.log(`Chunk ${chunkCount3} content:`, content);
              }
            }
            console.log("Round 3 stream processing completed");
            console.log("Article generation completed successfully");
            return;
          } catch (error) {
            console.error("Error in Round 3 stream processing:", error);
            throw error;
          }
        } catch (error) {
          console.error("Error in Round 2 stream processing:", error);
          throw error;
        }
      } catch (error) {
        console.error("Error in Round 1 stream processing:", error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${error}`);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
