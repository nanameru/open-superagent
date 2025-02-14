'use server';

export async function generateSubQueries(userQuery: string): Promise<string[]> {
  const MAX_RETRIES = 3;
  const TIMEOUT = 60000; // 60 seconds に延長

  const makeRequest = async (attempt: number = 1): Promise<string[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      console.log(`[Gemini API] Attempt ${attempt} - Starting request`);
      
      // APIキーのチェックを強化
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('[Gemini API] No API key found in environment variables');
        throw new Error('API key is not configured');
      }
      
      console.log(`[Gemini API] Using API key: ${apiKey ? '✓ Present' : '✗ Missing'}`);

      const currentDate = new Date().toISOString().split('T')[0];
      const prompt = `
あなたは「PitattoAI」のサブクエリ生成アシスタントです。
あなたの役割は、ユーザーの入力から「X(Twitter)検索で多くヒットしそうなサブクエリ」を自動生成することです。

最終出力は **1つのJSON配列**（要素数6～10個）のみで、各要素は \`{"query": "..."} \` という形式にし、解説や文章は一切付けない。

【基本ルール】
1. **言語指定の判断**  
   - ユーザー入力に言語指定がある場合、その言語**のみ**のクエリを作る。  
   - **言語指定がない場合**は下記の割合でクエリを作成（合計6～10個）。  
     - 日本語 (lang:ja): 40% → min_faves:100  
     - 英語 (lang:en): 30% → min_faves:250  
     - 中国語 (lang:zh): 30% → min_faves:100

2. **キーワードの言語変換・選択**  
   - **必ずクエリのlangに合わせた言語表記のキーワードを使う**。  
   - 例）  
     - lang:enの場合: 英語表現だけ  
     - lang:jaの場合: 日本語表現だけ  
     - lang:zhの場合: 中国語表現だけ  
     - ただし、英語の固有名詞（例：「Goku AI」「ChatGPT」など）がユーザー入力に含まれる場合は、そのままの表記を使用し、他言語に翻訳しない。

3. **min_favesの設定**  
   - lang:ja → min_faves:100  
   - lang:en → min_faves:250  
   - lang:zh → min_faves:100

4. **日付指定の扱い**  
   - ユーザーの入力に「最新の～」「最近の～」といった曖昧な期間指定がある場合、直近1週間（例：since:YYYY-MM-DD until:YYYY-MM-DD）を付与する。  
   - ユーザーが具体的な年月日や「2024年9月」「2023/09」などの期間を指定した場合、その指定に従い、since:YYYY-MM-DD until:YYYY-MM-DD の形式で期間を設定する。  
   - 「1日前のAI情報を教えて」や「10月中のAI情報を教えて」のようなユーザーの入力があった場合には、その指定に沿って、since:YYYY-MM-DD until:YYYY-MM-DD の形式で期間を設定する。 
   - ユーザーが月のみを指定し、その月が現在の月より未来の場合は、直前の年のその月として解釈する。（例：現在が2025年3月で「9月の情報」と指定された場合、2024年9月として扱う）

5. **クエリ形式**  
   \`"<キーワード(1～2語)> [追加語] min_faves:X lang:xx [since:YYYY-MM-DD until:YYYY-MM-DD]"\`

以下のクエリから、X(Twitter)検索用のサブクエリを生成してください：

<<USER_QUERY>> = "${userQuery}"
<<CURRENT_DATE>> = ${currentDate}

【手順】
1. キーワード抽出（1語）
   - 検索意図を示す主要キーワードを1語に短縮
   - なるべく多くの投稿がヒットしそうな広義かつ一般的な単語を選択

2. 期間指定
   - 「最新の～」「最近の～」→ 1週間分の期間指定を追加
   - 具体的な日付指定があれば適宜since/untilを追加
   - ユーザーが具体的な日付・年月を指定した場合は、その指定に従いsince:YYYY-MM-DD until:YYYY-MM-DDを設定

3. 最終出力形式
   [
     {"query": "AI development min_faves:250 lang:en"},
     {"query": "ChatGPT min_faves:100 lang:ja since:2025-01-26 until:2025-02-02"},
     ...
   ]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Gemini API] Error response:', errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      console.log('[Gemini API] Final content:', content);

      if (!content) {
        console.error('[Gemini API] No content in response');
        return [];
      }
      
      try {
        console.log('[Gemini API] Attempting to parse response content:', content);
        
        // コードブロックと配列の装飾を削除
        const cleanContent = content
          .replace(/```json\s*|\s*```/g, '')  // コードブロックの削除
          .trim();
        
        let queries;
        try {
          queries = JSON.parse(cleanContent);
          
          // 配列の場合、実際のクエリオブジェクトのみをフィルタリング
          if (Array.isArray(queries)) {
            queries = queries.filter(q => {
              if (!q || typeof q !== 'object') return false;
              if (!q.query || typeof q.query !== 'string') return false;
              return true;
            });
          }
        } catch (e) {
          console.error('[Gemini API] Failed to parse response as JSON:', e);
          console.error('[Gemini API] Raw content that failed to parse:', cleanContent);
          return [];
        }

        // クエリが配列でない場合は配列に変換
        if (!Array.isArray(queries)) {
          queries = [queries];
        }

        // クエリオブジェクトから文字列を抽出
        const results = queries
          .map((q: any) => {
            if (!q || typeof q !== 'object') return null;
            return q.query || null;
          })
          .filter((q): q is string => q !== null);

        console.log('[Gemini API] Successfully parsed queries:', results);
        return results;
      } catch (e) {
        console.error('[Gemini API] Failed to parse response:', e);
        console.error('[Gemini API] Raw content that failed to parse:', content);
        return [];
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[Gemini API] Error on attempt ${attempt}:`, error);
      
      if (error instanceof Error) {
        console.error('[Gemini API] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        // AbortError（タイムアウト）の場合は特別なハンドリング
        if (error.name === 'AbortError') {
          console.error('[Gemini API] Request timed out');
          if (attempt < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            console.log(`[Gemini API] Retrying after timeout in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeRequest(attempt + 1);
          }
        }
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // exponential backoff
        console.log(`[Gemini API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }
      
      console.error('[Gemini API] Max retries reached, failing');
      return [];
    }
  };

  return makeRequest();
}
