'use server';

const INITIAL_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 5;  // リトライ回数を増やす
const MAX_BACKOFF = 60000; // 最大バックオフ時間 (1分)

// APIキーのチェック
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
  throw new Error('Gemini API key is not configured');
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
  error?: string | undefined;
}

// 入力データを整形し、各ポストに番号を割り振る関数
function formatInputData(content: string): string {
  const MAX_CONTENT_LENGTH = 30000; // 30KB制限
  
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const formattedLines = lines.map((line, index) => {
    const num = index + 1;
    return `[${num}] ${line}\n`;
  });
  
  let formattedContent = `参考文献一覧：\n\n${formattedLines.join('')}`;
  
  // コンテンツが長すぎる場合は切り詰める
  if (formattedContent.length > MAX_CONTENT_LENGTH) {
    console.warn(`Content length (${formattedContent.length}) exceeds limit (${MAX_CONTENT_LENGTH}). Truncating...`);
    // 最初の方のコンテンツを優先的に保持
    const truncatedLines = formattedLines.slice(0, Math.floor(lines.length * 0.7));
    formattedContent = `参考文献一覧：\n\n${truncatedLines.join('')}`;
  }
  
  return formattedContent;
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
      console.log(`Content length: ${formattedContent.length} characters`);
      
      const prompt = `あなたは学術的かつ論理的な文体に特化したAIアシスタントです。以下のすべての指示を厳密に守り、出力する文章に反映してください。

【全体方針】
1. 本文は学術的かつ論理的な文体で執筆し、下記のような明確な構成を設けること：
   - 序論
   - 本論（必要に応じて複数セクションに分割してもよい）
   - 結論
2. 本文中では、ユーザーが提示した入力データに記載の番号（[1], [2], [3], ...など）をそのまま使用し、対応する情報を引用すること。
   - 引用番号を変更したり、順番を入れ替えたりしないこと。
3. 引用は文末や文中で、複数の文献番号をまとめて引用すること（例：[1][3][5]）。
   -絶対に、[5, 6, 15, 16]のような感じで列挙しないこと省略せずに一つずつ[]で囲うこと（例：[1][3][5]）。
4. 必要に応じて客観的なデータや研究結果を含め、論理展開を行うこと。
5. 適切な専門用語の定義や説明を含め、学術レポートとしての完成度を高めること。
6. 指示や構成例を本文に再掲・列挙しないこと。
7. 指定があった場合、できる限り多くの参考文献（入力データ）を引用し、それらの情報を統合すること。
8. 本文の最後に参考文献一覧や番号のリストを付けないこと。
9. 出力はマークダウン形式で行い、以下の要素を含めること：
   - 見出しは「#」を使用（例：# 序論）
   - 小見出しは「##」を使用
   - 重要な用語は「**太字**」で強調（必要最小限にとどめること）
   - 箇条書きが必要な場合は「-」を使用
10. 出力時には \`\`\`markdown や \`\`\` などのコードブロック記法を含めないこと。

【入力データ】
${formattedContent}

【検索クエリ】
${searchQuery}

上記の入力データおよび検索クエリに基づいて、生成AI（生成的人工知能）に関する学術的レポートを作成してください。必ず以下の要件を守ってください：

- 学術的かつ論理的な文体
- 「序論」「本論」「結論」の構成（マークダウンの見出しを使用）
- 参考文献を引用する際は上記の番号をそのまま用いる
- 引用は文中で、複数の文献番号をできるだけまとめて引用（例：[1][3][5]）
- 客観的なデータ・研究に基づく記述を含む
- 必要に応じて専門用語の定義や説明を行う
- 可能な限り多くの参考文献を引用し、それらの情報を統合する
- 論理的かつ学術的な言い回し
- 本文の最後に参考文献一覧や番号のリストを付けない
- マークダウン形式での出力（見出し、強調、箇条書きを適切に使用）
- コードブロック記法（\`\`\`markdown や \`\`\`）は使用しない`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      let content = result.candidates[0].content.parts[0].text;
      
      // コードブロック記法を削除
      content = content.replace(/^```markdown\n/g, '');
      content = content.replace(/^```\n/g, '');
      content = content.replace(/\n```$/g, '');
      
      return {
        content,
        error: undefined
      };
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
