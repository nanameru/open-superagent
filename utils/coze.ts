const WORKFLOW_ID = '7462445424055746578';
const API_URL = 'https://api.coze.com/v1/workflow/stream_run';
const BATCH_SIZE = 3; // Process 3 queries at a time
const RETRY_DELAY = 10000; // 10 seconds delay between retries
const MAX_RETRIES = 3; // Maximum number of retry attempts
const BATCH_DELAY = 15000; // 15 seconds delay between batches

// レート制限とクォータ制限の管理のための定数
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 30,
  QUOTA_RESET_INTERVAL: 60 * 1000, // 1分
};

// リクエストの追跡
let requestCount = 0;
let lastResetTime = Date.now();

// レート制限のチェックと管理
function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastResetTime >= RATE_LIMIT.QUOTA_RESET_INTERVAL) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestCount++;
  return true;
}

export interface TwitterPost {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
    verified?: boolean;
  };
  metrics: {
    retweets: number;
    replies: number;
    likes: number;
    quotes: number;
    impressions: number;
  };
  created_at: string;
  urls?: {
    url: string;
    expanded_url: string;
    title?: string;
    description?: string;
    image?: string;
  }[];
  media?: {
    type: 'photo' | 'video' | 'gif';
    url: string;
    preview_url?: string;
    alt_text?: string;
  }[];
  referenced_tweets?: {
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
  }[];
  language?: string;
  source?: string;
  context_annotations?: {
    domain: { id: string; name: string; };
    entity: { id: string; name: string; };
  }[];
}

export interface FormattedResponse {
  query: string;
  posts: TwitterPost[];
  metadata: {
    total_count: number;
    newest_id?: string;
    oldest_id?: string;
    processing_time: number;
  };
  error?: string;
}

function formatTwitterPost(rawPost: any): TwitterPost {
  // 日付の安全な処理
  let created_at = rawPost.created_at;
  try {
    if (created_at) {
      // タイムスタンプの場合の処理
      if (typeof created_at === 'number') {
        created_at = new Date(created_at * 1000).toISOString();
      } else {
        // 文字列の場合の処理
        const date = new Date(created_at);
        if (!isNaN(date.getTime())) {
          created_at = date.toISOString();
        } else {
          // 無効な日付の場合は現在時刻を使用
          created_at = new Date().toISOString();
        }
      }
    } else {
      created_at = new Date().toISOString();
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    created_at = new Date().toISOString();
  }

  return {
    id: rawPost.id || rawPost.rest_id,
    text: rawPost.text || rawPost.full_text,
    author: {
      id: rawPost.author_id || rawPost.user?.rest_id,
      username: rawPost.username || rawPost.user?.screen_name,
      name: rawPost.name || rawPost.user?.name,
      profile_image_url: rawPost.profile_image_url || rawPost.user?.profile_image_url,
      verified: rawPost.verified || rawPost.user?.verified
    },
    metrics: {
      retweets: rawPost.public_metrics?.retweet_count || rawPost.retweet_count || 0,
      replies: rawPost.public_metrics?.reply_count || rawPost.reply_count || 0,
      likes: rawPost.public_metrics?.like_count || rawPost.favorite_count || 0,
      quotes: rawPost.public_metrics?.quote_count || 0,
      impressions: rawPost.public_metrics?.impression_count || 0
    },
    created_at,
    urls: rawPost.entities?.urls?.map((u: any) => ({
      url: u.url,
      expanded_url: u.expanded_url,
      title: u.title,
      description: u.description,
      image: u.images?.[0]?.url
    })) || [],
    media: rawPost.media?.map((m: any) => ({
      type: m.type,
      url: m.url || m.media_url_https,
      preview_url: m.preview_image_url || m.display_url,
      alt_text: m.alt_text
    })) || [],
    referenced_tweets: rawPost.referenced_tweets || [],
    language: rawPost.lang,
    source: rawPost.source,
    context_annotations: rawPost.context_annotations || []
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ストリームコンテンツをパースするヘルパー関数
function parseStreamContent(content: string): any {
  console.log('\n=== parseStreamContent ===');
  console.log('Input content:', content);

  try {
    // イベントメッセージをスキップ
    if (content.trim().startsWith('event:')) {
      console.log('Skipping event message');
      return null;
    }

    // データ部分を抽出（より柔軟な処理に）
    const dataPrefix = 'data:';
    if (!content.includes(dataPrefix)) {
      // IDのみの行は正常なケース
      if (content.trim().startsWith('id:')) {
        return null;
      }
      console.log('No data prefix found in content:', content);
      return null;
    }

    // データ部分の抽出を改善
    const startIndex = content.indexOf(dataPrefix) + dataPrefix.length;
    let jsonStr = content.slice(startIndex).trim();

    // 空のデータをスキップ
    if (!jsonStr || jsonStr === '{}') {
      console.log('Empty data, skipping');
      return null;
    }

    // debug_urlのみの応答は処理をスキップ
    try {
      const quickParse = JSON.parse(jsonStr);
      if (quickParse && Object.keys(quickParse).length === 1 && quickParse.debug_url) {
        console.log('Skipping debug_url only response');
        return null;
      }
    } catch (e) {
      // パースエラーは無視して続行
    }

    // 二重エスケープされたJSONを完全に正規化する関数
    const unescapeJsonString = (str: string): string => {
      if (typeof str !== 'string') {
        return str;
      }

      // 文字列が引用符で囲まれている場合は取り除く
      if (str.startsWith('"') && str.endsWith('"')) {
        str = str.slice(1, -1);
      }

      // エスケープシーケンスを正規化
      let result = str;
      
      // エスケープ解除を繰り返し適用（深いネストに対応）
      let prevResult;
      do {
        prevResult = result;
        result = result
          // バックスラッシュの解除
          .replace(/\\\\/g, '\\')
          // クォートの解除
          .replace(/\\"/g, '"')
          // 改行文字の解除
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          // 不要な空白の削除
          .replace(/\s+/g, ' ')
          // 制御文字の削除
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      } while (result !== prevResult); // 変更がなくなるまで繰り返す

      return result.trim();
    };

    // JSONオブジェクトを再帰的に処理する関数
    const processJsonObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return unescapeJsonString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(item => processJsonObject(item));
      }
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = processJsonObject(value);
        }
        return result;
      }
      return obj;
    };

    try {
      // 最初のJSONパース
      const parsed = JSON.parse(jsonStr);

      // contentプロパティの特別処理
      if (parsed.content) {
        try {
          const unescapedContent = unescapeJsonString(parsed.content);
          
          // JSONとしてパース可能か確認
          try {
            const contentObj = JSON.parse(unescapedContent);
            // パースできた場合は、さらにオブジェクト内の文字列を処理
            return processJsonObject(contentObj);
          } catch {
            // パースできない場合は、エスケープ解除された文字列を返す
            return unescapedContent;
          }
        } catch (contentError) {
          console.error('Content processing error:', contentError);
          return parsed.content;
        }
      }

      // content以外のプロパティも処理
      return processJsonObject(parsed);
    } catch (error) {
      console.error('JSON parse error:', error);
      if (error instanceof SyntaxError) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const context = jsonStr.substring(Math.max(0, pos - 50), pos) +
            ' >>> ' + jsonStr.charAt(pos) + ' <<< ' +
            jsonStr.substring(pos + 1, pos + 50);
          console.error('Error context:', context);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in parseStreamContent:', error);
    console.error('Problematic content:', content);
    return null;
  }
}

async function processStreamResponse(response: Response, query: string): Promise<FormattedResponse> {
  const startTime = Date.now();
  console.log('\n=== Starting processStreamResponse ===');
  console.log('Query:', query);

  const formattedResponse: FormattedResponse = {
    query,
    posts: [],
    metadata: {
      total_count: 0,
      processing_time: 0
    }
  };

  try {
    const responseText = await response.text();
    console.log('\n=== Raw Response ===');
    console.log(responseText);

    const allPosts: TwitterPost[] = [];
    let newestId: string | undefined;
    let oldestId: string | undefined;

    // レスポンステキストを行ごとに処理
    const lines = responseText.split('\n').filter(line => line.trim());
    console.log('\n=== Processing', lines.length, 'lines ===');

    for (const line of lines) {
      try {
        const parsedContent = parseStreamContent(line);
        if (!parsedContent) continue;

        console.log('\n=== Parsed Content Structure ===');
        console.log(JSON.stringify(parsedContent, null, 2));

        // 投稿データの抽出を改善
        let posts: any[] = [];

        // output配列の処理
        if (parsedContent.output && Array.isArray(parsedContent.output)) {
          // 各outputアイテムを処理
          parsedContent.output.forEach((item: CozeOutputItem, index: number) => {
            console.log(`\n=== Processing output[${index}] freeBusy ===`);
            if (item?.freeBusy?.post) {
              const currentPosts = Array.isArray(item.freeBusy.post)
                ? item.freeBusy.post
                : [item.freeBusy.post];
              posts.push(...currentPosts);
            }
          });
        }
        // 直接のfreeBusy処理
        else if (parsedContent.freeBusy?.post) {
          console.log('\n=== Processing direct freeBusy ===');
          const directPosts = Array.isArray(parsedContent.freeBusy.post)
            ? parsedContent.freeBusy.post
            : [parsedContent.freeBusy.post];
          posts.push(...directPosts);
        }

        console.log(`\n=== Found ${posts.length} posts to process ===`);

        // 各投稿の処理
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          try {
            console.log(`\n=== Processing post ${i + 1} of ${posts.length} ===`);
            console.log(`Post ID: ${post.rest_id || 'unknown'}`);
            console.log('Raw post:', JSON.stringify(post, null, 2));

            const formattedPost = formatTwitterPost(post);
            console.log('Formatted post:', JSON.stringify(formattedPost, null, 2));

            // 重複チェック
            const isDuplicate = allPosts.some(p => p.id === formattedPost.id);
            if (!isDuplicate) {
              allPosts.push(formattedPost);
              console.log(`Added post ${formattedPost.id} to results`);

              if (!newestId || formattedPost.id > newestId) newestId = formattedPost.id;
              if (!oldestId || formattedPost.id < oldestId) oldestId = formattedPost.id;
            } else {
              console.log(`Skipping duplicate post ${formattedPost.id}`);
            }
          } catch (postError) {
            console.error(`Error processing post ${i + 1}:`, postError);
          }
        }
      } catch (lineError) {
        console.error('Error processing line:', lineError);
        continue;
      }
    }

    formattedResponse.posts = allPosts;
    formattedResponse.metadata = {
      total_count: allPosts.length,
      newest_id: newestId,
      oldest_id: oldestId,
      processing_time: Date.now() - startTime
    };

    console.log('\n=== Final Response ===');
    console.log('Total posts:', allPosts.length);
    console.log('Posts:', JSON.stringify(allPosts, null, 2));
    console.log('Metadata:', JSON.stringify(formattedResponse.metadata, null, 2));

  } catch (error) {
    console.error('Error in processStreamResponse:', error);
    formattedResponse.error = error instanceof Error ? error.message : String(error);
  }

  console.log('\n=== End processStreamResponse ===');
  console.log('Processing time:', Date.now() - startTime, 'ms');
  return formattedResponse;
}

// Coze API output item interface
interface CozeOutputItem {
  freeBusy?: {
    post: any | any[];  // Can be single post or array of posts
  };
}

export async function executeCozeQueries(subQueries: string[]): Promise<FormattedResponse[]> {
  const results: FormattedResponse[] = [];
  
  // Split queries into batches
  for (let i = 0; i < subQueries.length; i += BATCH_SIZE) {
    const batch = subQueries.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(subQueries.length / BATCH_SIZE)}`);
    
    // Process queries in parallel within each batch
    const batchPromises = batch.map(async (query) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          // レート制限のチェック
          if (!checkRateLimit()) {
            console.log('Rate limit reached, waiting for reset...');
            await sleep(RATE_LIMIT.QUOTA_RESET_INTERVAL);
            continue;
          }

          const cleanQuery = query
            .replace(/```json\s*\[?\s*/g, '')
            .replace(/\s*\]?\s*```\s*$/, '')
            .replace(/[{}"\\]/g, '')
            .replace(/^\s*query:\s*/, '')
            .replace(/,\s*$/, '')
            .trim();

          console.log(`Executing query: ${cleanQuery}`);
          const requestBody = {
            parameters: { input: cleanQuery },
            workflow_id: WORKFLOW_ID
          };

          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_COZE_API_KEY}`,
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error_code === 4009 || 
                errorData.error_message?.includes('QUOTA_BYTES quota exceeded')) {
              console.log(`API limit reached, waiting ${RETRY_DELAY/1000} seconds before retry...`);
              await sleep(RETRY_DELAY);
              retries++;
              continue;
            }
            throw new Error(`API error: ${response.statusText}`);
          }

          return await processStreamResponse(response, query);
        } catch (error) {
          console.error(`Error processing query (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
          if (retries === MAX_RETRIES - 1) {
            return {
              query,
              posts: [],
              metadata: { total_count: 0, processing_time: 0 },
              error: error instanceof Error ? error.message : String(error)
            };
          }
          await sleep(RETRY_DELAY);
          retries++;
        }
      }
      
      return {
        query,
        posts: [],
        metadata: { total_count: 0, processing_time: 0 },
        error: 'Max retries reached'
      };
    });

    // バッチ内のクエリを並列実行
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // バッチ間の待機
    if (i + BATCH_SIZE < subQueries.length) {
      console.log(`Waiting ${BATCH_DELAY/1000} seconds before processing next batch...`);
      await sleep(BATCH_DELAY);
    }
  }

  return results;
}
