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
  console.log('Input content length:', content.length);

  try {
    // イベントメッセージをスキップ
    if (content.trim().startsWith('event:')) {
      console.log('Skipping event message:', content.trim());
      return null;
    }

    // データ部分を抽出
    const dataPrefix = 'data:';
    if (!content.includes(dataPrefix)) {
      if (content.trim().startsWith('id:')) {
        console.log('Skipping ID-only line:', content.trim());
        return null;
      }
      console.log('No data prefix found in content');
      return null;
    }

    // データ部分の抽出
    const startIndex = content.indexOf(dataPrefix) + dataPrefix.length;
    let jsonStr = content.slice(startIndex).trim();
    console.log('First parse - extracted JSON string length:', jsonStr.length);

    try {
      // 最初のJSONパース
      const firstParse = JSON.parse(jsonStr);
      
      // contentプロパティが文字列として存在する場合は二重パース
      if (firstParse.content && typeof firstParse.content === 'string') {
        console.log('Found nested content, performing second parse');
        const secondParse = JSON.parse(firstParse.content);
        console.log('Second parse successful, data structure:', 
          Object.keys(secondParse));
        return secondParse;
      }

      // debug_urlのみの応答は処理をスキップ
      if (firstParse && Object.keys(firstParse).length === 1 && firstParse.debug_url) {
        console.log('Skipping debug_url only response');
        return null;
      }

      // エラーレスポンスの確認
      if (firstParse.error_code) {
        console.log('Error response detected:', firstParse.error_message);
        return null;
      }

      return firstParse;
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      return null;
    }
  } catch (e) {
    console.error('Error in parseStreamContent:', e);
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
    console.log('Response text length:', responseText.length);

    const allPosts: TwitterPost[] = [];
    let newestId: string | undefined;
    let oldestId: string | undefined;

    // レスポンステキストを行ごとに処理
    const lines = responseText.split('\n').filter(line => line.trim());
    console.log('\n=== Processing', lines.length, 'lines ===');

    for (const line of lines) {
      try {
        const parsedContent = parseStreamContent(line);
        if (!parsedContent) {
          continue;
        }

        // outputの配列を処理
        if (parsedContent.output && Array.isArray(parsedContent.output)) {
          console.log('Processing output array, length:', parsedContent.output.length);
          
          for (const item of parsedContent.output) {
            if (item?.freeBusy?.post) {
              const posts = Array.isArray(item.freeBusy.post) 
                ? item.freeBusy.post 
                : [item.freeBusy.post];
              
              console.log(`Found ${posts.length} posts in output item`);
              
              for (const post of posts) {
                try {
                  const formattedPost = formatTwitterPost(post);
                  if (!allPosts.some(p => p.id === formattedPost.id)) {
                    allPosts.push(formattedPost);
                    console.log(`Added post ${formattedPost.id} to results (total: ${allPosts.length})`);

                    if (!newestId || formattedPost.id > newestId) newestId = formattedPost.id;
                    if (!oldestId || formattedPost.id < oldestId) oldestId = formattedPost.id;
                  }
                } catch (postError) {
                  console.error('Error formatting post:', postError);
                }
              }
            }
          }
        }
      } catch (lineError) {
        console.error('Error processing line:', lineError);
      }
    }

    // 結果を設定
    formattedResponse.posts = allPosts;
    formattedResponse.metadata = {
      total_count: allPosts.length,
      processing_time: Date.now() - startTime,
      newest_id: newestId,
      oldest_id: oldestId
    };

    console.log('\n=== Final Response ===');
    console.log('Total posts:', allPosts.length);
    console.log('Processing time:', formattedResponse.metadata.processing_time, 'ms');

    return formattedResponse;
  } catch (error) {
    console.error('Error in processStreamResponse:', error);
    throw error;
  }
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
