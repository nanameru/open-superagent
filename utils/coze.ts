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

async function processStreamResponse(response: Response, query: string): Promise<FormattedResponse> {
  const startTime = Date.now();
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
    console.log('Raw response text:', responseText);

    const lines = responseText.split('\n').filter(line => line.trim());
    console.log('Filtered lines:', lines);

    const allPosts: TwitterPost[] = [];
    let newestId: string | undefined;
    let oldestId: string | undefined;

    for (const line of lines) {
      try {
        const cleanedLine = line.trim();
        console.log('\nProcessing line:', cleanedLine);

        if (!cleanedLine || cleanedLine === '[DONE]') {
          console.log('Skipping empty or DONE line');
          continue;
        }

        // Handle event lines
        if (cleanedLine.startsWith('event:')) {
          const eventType = cleanedLine.replace('event:', '').trim();
          console.log('Event type:', eventType);
          if (eventType === 'Error') {
            console.warn('Error event received from stream');
            formattedResponse.error = 'Error event received from stream';
          }
          continue;
        }

        // Handle data lines
        if (!cleanedLine.startsWith('data:')) {
          console.log('Skipping non-data line');
          continue;
        }

        const dataContent = cleanedLine.replace('data:', '').trim();
        console.log('Data content:', dataContent);

        const data = JSON.parse(dataContent);
        console.log('Parsed data:', JSON.stringify(data, null, 2));

        if (data.content) {
          try {
            const content = JSON.parse(data.content);
            console.log('Parsed content:', JSON.stringify(content, null, 2));

            if (content.output?.[0]?.freeBusy?.post) {
              const posts = Array.isArray(content.output[0].freeBusy.post)
                ? content.output[0].freeBusy.post
                : [content.output[0].freeBusy.post];

              console.log('Found posts:', posts.length);
              
              for (const post of posts) {
                console.log('Processing post:', post);
                try {
                  const formattedPost = formatTwitterPost(post);
                  console.log('Formatted post:', formattedPost);
                  allPosts.push(formattedPost);

                  if (!newestId || formattedPost.id > newestId) newestId = formattedPost.id;
                  if (!oldestId || formattedPost.id < oldestId) oldestId = formattedPost.id;
                } catch (postError) {
                  console.error('Error formatting post:', postError);
                }
              }
            } else {
              console.log('No posts found in content');
            }
          } catch (contentError) {
            console.error('Error parsing content:', contentError);
            formattedResponse.error = `Error parsing content: ${contentError instanceof Error ? contentError.message : String(contentError)}`;
          }
        } else if (data.response) {
          // Handle text response
          console.log('Found text response:', data.response);
          const post = formatTwitterPost({
            id: Date.now().toString(),
            text: data.response,
            created_at: new Date().toISOString(),
            author: {
              id: 'coze',
              username: 'Coze AI',
              name: 'Coze AI',
              verified: true
            }
          });
          allPosts.push(post);
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

    console.log('Final formatted response:', JSON.stringify(formattedResponse, null, 2));
  } catch (error) {
    console.error('Error in processStreamResponse:', error);
    formattedResponse.error = error instanceof Error ? error.message : String(error);
  }

  return formattedResponse;
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
