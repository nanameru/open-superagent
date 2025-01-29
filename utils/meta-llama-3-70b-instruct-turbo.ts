'use server';

export async function generateSubQueries(userQuery: string): Promise<string[]> {
  const MAX_RETRIES = 3;
  const TIMEOUT = 60000; // 60 seconds に延長

  const makeRequest = async (attempt: number = 1): Promise<string[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      console.log(`[Llama API] Attempt ${attempt} - Starting request`);
      
      // APIキーのチェックを強化
      const apiKey = process.env.TOGETHER_API_KEY;
      if (!apiKey) {
        console.error('[Llama API] No API key found in environment variables');
        throw new Error('API key is not configured');
      }
      
      console.log(`[Llama API] Using API key: ${apiKey ? '✓ Present' : '✗ Missing'}`);

      const currentDate = new Date().toISOString().split('T')[0];
      const systemPrompt = `あなたは「PitattoAI」のサブクエリ生成アシスタントです。`;
      
      const userPrompt = `
<<USER_QUERY>> = "${userQuery}"
<<CURRENT_DATE>> = ${currentDate}

1. ユーザーの入力(<<USER_QUERY>>)を1～2語にし、Xで多く使われそうなキーワードのみを採用（例：「AI」）。
2. **言語指定**（「◯語で」など）や**地域名（例:「中国の」）があれば、その言語だけで作成。**。  
   - 例: 「中国のAI情報を教えて」→ 中国語で（lang:zh）でキーワードは「AI」等  
   - 例: 「中国語でAI情報を教えて」→ 中国語（lang:zh）でキーワードは「AI」など  
   - 指定がなければデフォルト割合で (ja=40%, en=30%, zh=30%)。
3. 「最新の…」が含まれれば、<<CURRENT_DATE>>から1週間分のみ検索（\`since:\`/\`until:\`）。その他の相対/絶対日付指定も同様に反映。
4. クエリ構成:
   \`\`\`
   "キーワード(1～2語) + [追加語] min_faves:X lang:xx [since:YYYY-MM-DD until:YYYY-MM-DD]"
   \`\`\`
   - lang:ja → min_faves:100
   - lang:en → min_faves:500
   - lang:zh → min_faves:300
5. 出力は **1つのJSON配列** のみ、要素数6～10個。各要素は \`{"query": "..."} \` のみ。解説や文章は一切付けない。キーワードに国名は入れない。`;

      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Llama API] Error response:', errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log('[Llama API] Final content:', content);

      if (!content) {
        console.error('[Llama API] No content in response');
        return [];
      }
      
      try {
        console.log('[Llama API] Attempting to parse response content:', content);
        
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
          console.error('[Llama API] Failed to parse response as JSON:', e);
          console.error('[Llama API] Raw content that failed to parse:', cleanContent);
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

        console.log('[Llama API] Successfully parsed queries:', results);
        return results;
      } catch (e) {
        console.error('[Llama API] Failed to parse response:', e);
        console.error('[Llama API] Raw content that failed to parse:', content);
        return [];
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[Llama API] Error on attempt ${attempt}:`, error);
      
      if (error instanceof Error) {
        console.error('[Llama API] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        // AbortError（タイムアウト）の場合は特別なハンドリング
        if (error.name === 'AbortError') {
          console.error('[Llama API] Request timed out');
          if (attempt < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            console.log(`[Llama API] Retrying after timeout in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeRequest(attempt + 1);
          }
        }
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // exponential backoff
        console.log(`[Llama API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }
      
      console.error('[Llama API] Max retries reached, failing');
      return [];
    }
  };

  return makeRequest();
} 