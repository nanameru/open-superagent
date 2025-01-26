'use server';

import OpenAI from 'openai';

const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,  // DeepSeek APIキー（環境変数で指定）
  baseURL: "https://api.deepseek.com",    // DeepSeek API エンドポイント
  timeout: TIMEOUT
});

interface GenerateArticleResponse {
  content: string;
  error?: string;
}

/**
 * 3段階のReasoning(推論)を経て約1万文字規模の学術的レポートを生成する例
 */
export async function generateDetailedArticle(content: string, searchQuery: string): Promise<GenerateArticleResponse> {
  const makeRequest = async (attempt: number = 1): Promise<GenerateArticleResponse> => {
    try {
      // APIキーのチェック
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not configured');
      }

      // ─────────────────────────────────────
      // Round 1: 粗い下書きを作る
      // ─────────────────────────────────────
      let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: `
あなたは今から約400の学術ソースを参照し、以下のユーザーの検索クエリと関連投稿内容をもとに詳細なレポートを執筆します。
まずは第1段階として、引用元から抽出した情報も踏まえた「粗い下書き」を書いてください。

【ユーザーの検索クエリ】
${searchQuery}

【関連する投稿内容】
${content}

【要件】
1. ユーザーの検索クエリに直接関連する情報を優先的に取り上げる
2. 400ソースを想定し、投稿内容を俯瞰して重要ポイントを抽出する
3. 専門的な背景知識や基本的な定義を簡潔に補足する
4. 研究・文献調査の方向性や全体の構成案を示す（序論・本論・結論の流れ）
5. 完成版は1万文字規模を目指すが、この段階では概要レベルの下書きでOK
6. 参考文献一覧の形式（APA, MLA など）は後の段階で明示する予定
7. できる限り論理的・学術的な言い回しを意識する
`
        }
      ];

      let response = await client.chat.completions.create({
        model: "deepseek-reasoner",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      // Round 1 の出力
      let contentRound1 = response.choices[0].message.content ?? '';

      // ─────────────────────────────────────
      // Round 2: 学術的に深掘り・文章量を増やす
      // ─────────────────────────────────────
      messages.push({ role: "assistant", content: contentRound1 });
      messages.push({
        role: "user",
        content: `
以下は第1段階の下書きです。これをベースに、より学術的かつ詳細に深掘りしたレポートへと拡張してください。

【要件】
1. 専門用語や学術的な概念をより丁寧に解説する（読者に背景知識がない場合を想定）
2. 論文や書籍などの具体的な文献を複数引用し、信頼性を高める（文献番号や著者名などを仮の形でもよいので示す）
3. データや統計値などを交えて説得力を持たせる
4. 最終的な1万文字規模に近づけるため、この段階で文章量を大幅に増やす
5. 序論・本論・結論の各セクションに見出しを設定し、それぞれ内容を厚くする
6. 読者が興味を持つような具体例や事例研究を追加し、イメージを深める
`
      });

      response = await client.chat.completions.create({
        model: "deepseek-reasoner",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      // Round 2 の出力
      let contentRound2 = response.choices[0].message.content ?? '';

      // ─────────────────────────────────────
      // Round 3: 最終仕上げ（1万文字規模の完成版）
      // ─────────────────────────────────────
      messages.push({ role: "assistant", content: contentRound2 });
      messages.push({
        role: "user",
        content: `
以下は第2段階で深掘りされた素案です。最終版として以下の点を反映し、1万文字規模の完成稿に仕上げてください。

【最終仕上げ要件】
1. **1万文字程度**のボリュームを目指す（序論・本論・結論のバランスを保ちつつ充実化）
2. 引用文献をさらに明確化する（著者名、出版年、論文タイトル、ジャーナル名など）。実在しないものでもいいので、学術的スタイルに近づけて示す
3. 必要に応じて図表やグラフを参照するような文章表現を含める（実際のグラフ画像は不要）
4. 結論・考察パートで主張を簡潔に要約し、今後の課題や展望に触れる
5. 数値や事例をもう少し増やして具体性・説得力を強化する
6. 全体を通して誤字脱字を減らし、学術論文調の文体を維持

【追加指示】
- 参考文献を本文末尾に列挙する形で示し、すべて番号を振る（例: [1] 著者名, タイトル,...）
- 脚注や余談として補足情報を挟むのも可
- 文献情報は実在しなくても構わないが、形式は学術的な形を保つ
`
      });

      response = await client.chat.completions.create({
        model: "deepseek-reasoner",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      // Round 3 (最終記事) の出力
      let finalContent = response.choices[0].message.content ?? '';

      return {
        content: finalContent
      };

    } catch (error) {
      console.error(`[DeepSeek Article] Error on attempt ${attempt}:`, error);
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // exponential backoff
        console.log(`[DeepSeek Article] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }

      return {
        content: '',
        error: error instanceof Error ? error.message : '記事の生成中にエラーが発生しました'
      };
    }
  };

  return makeRequest();
}
