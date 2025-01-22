const WORKFLOW_ID = '7462445424055746578';
const API_URL = 'https://api.coze.com/v1/workflow/stream_run';

interface CozeResponse {
  // レスポンスの型は実際のAPIレスポンスに合わせて定義してください
  data: any;
}

export async function executeCozeQueries(subQueries: string[]): Promise<CozeResponse[]> {
  const apiKey = process.env.COZE_API_KEY;
  if (!apiKey) {
    throw new Error('COZE_API_KEY is not set in environment variables');
  }

  // すべてのクエリを並列実行
  const promises = subQueries.map(async (query) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parameters: {
          input: query
        },
        workflow_id: WORKFLOW_ID
      })
    });

    if (!response.ok) {
      throw new Error(`Coze API error: ${response.statusText}`);
    }

    return response.json();
  });

  // すべてのリクエストの完了を待つ
  return Promise.all(promises);
}

// 使用例：
// const subQueries = ['AI min_faves:100', '人工知能 min_faves:100'];
// const results = await executeCozeQueries(subQueries);
