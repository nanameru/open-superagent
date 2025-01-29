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
              content: 'あなたは学術的な文章を書くAIアシスタントです。'
            },
            {
              role: 'user',
              content: `以下の要件と構成に従って、入力データと検索クエリに基づく学術的レポートを作成してください。

【重要な指示】
• 本文中で参考文献を引用する際は、必ず入力データに付与された番号（[1], [2], [3]...）をそのまま使用してください
• 引用番号を変更したり、順番を変えたりしないでください
• 各引用は、必ず対応する入力データの番号と一致させてください

【要件】
1. 学術的・論理的な文体を使用すること
2. 明確な構造（「序論」「本論」「結論」）を設けること
3. 客観的なデータや研究に基づく記述を含めること
4. 適切な引用を行うこと（入力データの番号をそのまま使用）
5. 必要に応じて専門用語の定義や説明を含めること
6. できる限り多くの参考文献を引用し、それらの情報を統合すること
7. 論理的・学術的な言い回しを心がけること

【文章構成例】

1. 序論
• テーマ（最新のAI情報とトレンド）の背景や重要性
• レポートの目的と概要

2. 本論
2.1. AIの統合と応用
• ビジネスプロセスへのAI統合事例や効果
• 需要予測、プロセス自動化、分散コンピューティングの活用事例など

2.2. 新しいAIアーキテクチャ
• 小規模言語モデル（SLM）やモデルマージ技術
• 環境負荷を低減する「グリーンAI」の概念

2.3. AIの進化と応用分野
• 教育、金融、ヘルスケア、高齢者支援などの領域での活用事例
• 実証実験や導入事例の紹介

2.4. AIの倫理と課題
• 倫理的課題（プライバシー、バイアス、雇用への影響）
• AIガバナンスや法的規制に関する議論

2.5. 最新のAI技術
• 主要な言語モデルの進化（パラメーター数や学習データの公開など）
• 画像・映像AI技術の産業応用

3. 結論
• 全体の総括と今後の展望
• 今後の研究や技術開発の方向性に関する見解

【入力データ】
${formattedContent}

【検索クエリ】
${searchQuery}

上記の構成に従い、学術的・論理的な文体で最新のAI情報やトレンドについて包括的に論じてください。
必ず入力データの番号をそのまま使用して引用を行い、番号の対応関係を維持してください。
例えば、1番目の参考文献を引用する場合は必ず [1] を使用し、2番目の参考文献には必ず [2] を使用するようにしてください。`
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