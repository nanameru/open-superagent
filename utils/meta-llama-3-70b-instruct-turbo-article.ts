'use server';

const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// APIキーのチェック
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
if (!TOGETHER_API_KEY) {
  console.error('TOGETHER_API_KEY is not set');
  throw new Error('Together API key is not configured');
}

export interface GenerateArticleResponse {
  content: string;
  error?: string;
}

// 入力データを整形し、各ポストに番号を割り振る関数
function formatInputData(content: string): string {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const formattedLines = lines.map((line, index) => {
    const num = index + 1;
    return `[${num}] ${line}\n`;
  });
  
  return `参考文献一覧：\n\n${formattedLines.join('')}`;
}

// 3段階のReasoning(推論)を経て学術的レポートを生成する
export async function generateDetailedArticle(
  content: string,
  searchQuery: string
): Promise<GenerateArticleResponse> {
  let attempt = 0;

  // 入力データを整形
  const formattedContent = formatInputData(content);

  while (attempt < MAX_RETRIES) {
    attempt++;
    console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);

    try {
      console.log("Setting up messages for article generation...");
      
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          messages: [
            {
              role: 'system',
              content: 'あなたは学術的な文体に特化したAIアシスタントです。以下のすべての指示を厳密に守り、出力する文章に反映してください。\n\n【全体方針】\n1. 本文は学術的かつ論理的な文体で執筆し、下記のような明確な構成を設けること：\n   - 序論\n   - 本論（必要に応じて複数セクションに分割してもよい）\n   - 結論\n2. 本文中では、必ず提示された入力データの番号（[1], [2], [3]... など）をそのまま使用し、対応する情報を引用すること。\n3. 引用番号を変更したり、順番を入れ替えたりしないこと。\n4. 必要に応じて客観的なデータや研究結果を含め、論理展開を行うこと。\n5. 適切な専門用語の定義や説明を含め、学術レポートとしての完成度を高めること。\n6. 指示や構成例を本文に再掲・列挙しないこと（本文中で「以下の要件～」などは書かず、指定された内容に沿ったレポートのみを提示すること）。\n7. 指定があった場合、できる限り多くの参考文献（入力データ）を引用し、それらの情報を統合すること。\n\n以上の指示に従い、ユーザーから提示される入力データと検索クエリに基づいた**学術的レポートのみ**を作成してください。'
            },
            {
              role: 'user',
              content: `【入力データ】
${formattedContent}

【検索クエリ】
${searchQuery}

上記の入力データおよび検索クエリに基づいて、生成AI（生成的人工知能）に関する学術的レポートを作成してください。必ず以下の要件を守ってください：

- 学術的かつ論理的な文体
- 「序論」「本論」「結論」の構成
- 参考文献を引用する際は上記の番号をそのまま用いる
- 客観的なデータ・研究に基づく記述を含む
- 必要に応じて専門用語の定義や説明を行う
- 可能な限り多くの参考文献を引用し、それらの情報を統合する
- 論理的かつ学術的な言い回し

以上の条件を満たす文章を出力してください。`
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        return {
          content: '',
          error: `Together API request failed: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Llamaからのレスポンスを処理
      if (data.choices && data.choices[0].message) {
        const generatedContent = data.choices[0].message.content;
        return {
          content: generatedContent
        };
      } else {
        return {
          content: '',
          error: '記事の生成に失敗しました。'
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        return {
          content: '',
          error: '全ての生成試行が失敗しました。'
        };
      }
    }
  }

  return {
    content: '',
    error: '予期せぬエラーが発生しました。'
  };
} 