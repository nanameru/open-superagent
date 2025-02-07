'use server';

const INITIAL_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 5;  // リトライ回数を増やす
const MAX_BACKOFF = 60000; // 最大バックオフ時間 (1分)

// APIキーのチェック
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
  throw new Error('OpenAI API key is not configured');
}

// 指定時間待機する関数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// エクスポネンシャルバックオフ時間を計算
const getBackoffTime = (attempt: number): number => {
  const backoff = Math.min(
    MAX_BACKOFF,
    INITIAL_TIMEOUT * Math.pow(2, attempt - 1) + Math.random() * 1000
  );
  return backoff;
};

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
  const formattedContent = formatInputData(content);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);

    try {
      console.log("Setting up messages for article generation...");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'o3-mini',
          messages: [
            {
              "role": "system",
              "content": "あなたは学術的かつ論理的な文体に特化したAIアシスタントです。以下のすべての指示を厳密に守り、出力する文章に反映してください。\n\n【全体方針】\n1. 本文は学術的かつ論理的な文体で執筆し、下記のような明確な構成を設けること：\n   - 序論\n   - 本論（必要に応じて複数セクションに分割してもよい）\n   - 結論\n2. 本文中では、ユーザーが提示した入力データに記載の番号（[1], [2], [3], ...など）をそのまま使用し、対応する情報を引用すること。\n   - 引用番号を変更したり、順番を入れ替えたりしないこと。\n3. 引用は文末や文中で、複数の文献番号をまとめて引用すること（例：[1][3][5]）。\n4. 必要に応じて客観的なデータや研究結果を含め、論理展開を行うこと。\n5. 適切な専門用語の定義や説明を含め、学術レポートとしての完成度を高めること。\n6. 指示や構成例を本文に再掲・列挙しないこと。\n7. 指定があった場合、できる限り多くの参考文献（入力データ）を引用し、それらの情報を統合すること。\n8. 本文の最後に参考文献一覧や番号のリストを付けないこと。\n\n以上の指示に従い、ユーザーから提示される入力データおよび検索クエリに基づいた学術的レポートのみを作成してください。"
            },
            {
              "role": "user",
              "content": `【入力データ】\n${formattedContent}\n\n【検索クエリ】\n${searchQuery}\n\n上記の入力データおよび検索クエリに基づいて、生成AI（生成的人工知能）に関する学術的レポートを作成してください。必ず以下の要件を守ってください：\n\n- 学術的かつ論理的な文体\n- 「序論」「本論」「結論」の構成\n- 参考文献を引用する際は上記の番号をそのまま用いる\n- 引用の際は、一つの文章の中で複数の文献を同時に示す（例：[3][10][11]）\n- 客観的なデータ・研究に基づく記述を含む\n- 必要に応じて専門用語の定義や説明を行う\n- 可能な限り多くの参考文献を引用し、それらの情報を統合する\n- 論理的かつ学術的な言い回し\n- 本文の最後に参考文献一覧や番号のリストを付けない\n\n以上の条件を満たす文章を出力してください。`
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          reasoning_effort: "medium"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API request failed: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      
      // OpenAIからのレスポンスを処理
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
      console.error(`Error in attempt ${attempt}:`, error);
      
      if (attempt === MAX_RETRIES) {
        return {
          content: '',
          error: `Error in article generation: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      // エクスポネンシャルバックオフを適用
      const backoffTime = getBackoffTime(attempt);
      console.log(`Retrying in ${backoffTime/1000} seconds...`);
      await wait(backoffTime);
    }
  }

  return {
    content: '',
    error: 'Maximum retries exceeded'
  };
}
