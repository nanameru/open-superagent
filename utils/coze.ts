const WORKFLOW_ID = '7462445424055746578';
const API_URL = 'https://api.coze.com/v1/workflow/stream_run';
const BATCH_SIZE = 10;        // 5→10に増やしてさらに処理効率を向上
const RETRY_DELAY = 3000;    // 5秒→3秒にさらに短縮
const MAX_RETRIES = 2;       // 2回のまま維持
const BATCH_DELAY = 5000;    // 8秒→5秒にさらに短縮

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

async function processStreamResponse(
  response: Response,
  query: string,
  userId?: string,
  parentQueryId?: string
): Promise<FormattedResponse> {
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

    // 結果をDBに保存（Embedding付き）
    if (allPosts.length > 0) {
      await storeDataWithEmbedding(
        query,
        allPosts.map(post => ({
          sourceTitle: `Twitter Post by ${post.author.username}`,
          sourceUrl: `https://twitter.com/${post.author.username}/status/${post.id}`,
          content: post.text,
          metadata: {
            author: post.author,
            metrics: post.metrics,
            created_at: post.created_at,
            urls: post.urls,
            media: post.media,
            referenced_tweets: post.referenced_tweets,
            language: post.language,
          },
        })),
        userId,
        parentQueryId
      );
    } else {
      console.log('No posts to save, skipping embedding generation and storage');
    }

    return formattedResponse;
  } catch (error) {
    console.error('Error in processStreamResponse:', error);
    throw error;
  }
}

// ============== Cohere多言語Embeddingの設定 =============
// Supabase設定
import { createClient } from './supabase/client'
const supabase = createClient();

// Cohere API設定
const COHERE_API_URL = 'https://api.cohere.com/v2/embed';
const COHERE_API_KEY = process.env.NEXT_PUBLIC_CO_API_KEY;

/**
 * Cohere API（embed-multilingual-v3.0）を使って
 * テキストのEmbedding(1024次元)を一括で取得するヘルパー関数
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (!COHERE_API_KEY) {
        throw new Error('COHERE_API_KEY is not set');
      }

      const truncatedTexts = texts.map(text => text.slice(0, 8000));
      
      const requestBody = {
        texts: truncatedTexts,
        model: 'embed-multilingual-v3.0',
        input_type: 'search_document',
        embedding_types: ['float']
      };

      const response = await fetch(COHERE_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${COHERE_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return responseData.embeddings.float;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Failed to get embeddings after all retries');
}

async function getCurrentQueryId(searchQuery: string, userId: string): Promise<string | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: queryData, error } = await supabase
      .from('queries')
      .select('id')
      .eq('user_id', userId)
      .eq('query_text', searchQuery)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('クエリ検索エラー:', error);
      return null;
    }
    return queryData?.[0]?.id || null;
  } catch (error) {
    console.error('getCurrentQueryIdでエラー:', error);
    return null;
  }
}

// コサイン類似度を計算する関数をエクスポート
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (norm1 * norm2);
}

// データをランク付けする関数をエクスポート
export function rankByEmbeddingSimilarity(userQueryEmbedding: number[], dataEmbeddings: number[][]): number[] {
  // 各データとユーザークエリとの類似度を計算
  const similarities = dataEmbeddings.map(embedding => 
    calculateCosineSimilarity(userQueryEmbedding, embedding)
  );

  // 類似度に基づいてインデックスをソート
  const indexesWithSimilarities = similarities.map((sim, index) => ({ sim, index }));
  indexesWithSimilarities.sort((a, b) => b.sim - a.sim); // 降順ソート

  // ランクを割り当て（1から始まる）
  const ranks = new Array(similarities.length).fill(0);
  indexesWithSimilarities.forEach(({ index }, rank) => {
    ranks[index] = rank + 1;
  });

  return ranks;
}

// 特定の親クエリに紐づくデータのランクを更新する関数を追加
export async function updateRankingsForParentQuery(
  parentQueryId: string,
  supabase: any
): Promise<void> {
  try {
    // 1. 親クエリのデータを取得
    const { data: parentQuery, error: parentQueryError } = await supabase
      .from('queries')
      .select('query_text, fetched_data_ids')
      .eq('id', parentQueryId)
      .single();

    if (parentQueryError) throw parentQueryError;
    if (!parentQuery?.fetched_data_ids?.length) return;

    // 2. 親クエリのテキストのEmbeddingを取得
    const parentQueryEmbedding = await getEmbeddings([parentQuery.query_text]);
    if (!parentQueryEmbedding?.[0]) {
      console.error('Failed to get embedding for parent query');
      return;
    }

    // 3. 紐づく全てのfetched_dataを取得
    const { data: fetchedData, error: fetchedDataError } = await supabase
      .from('fetched_data')
      .select('id, embedding')
      .in('id', parentQuery.fetched_data_ids);

    if (fetchedDataError) throw fetchedDataError;
    if (!fetchedData?.length) return;

    // 4. 類似度に基づいてランク付け
    const embeddings = fetchedData.map((d: { embedding: string | number[] }) => {
      // If embedding is stored as a string, parse it
      return typeof d.embedding === 'string' ? JSON.parse(d.embedding) : d.embedding;
    });
    const ranks = rankByEmbeddingSimilarity(parentQueryEmbedding[0], embeddings);

    // 5. ランクを更新
    const updates = fetchedData.map((data: { id: string, embedding: string | number[] }, index: number) => ({
      id: data.id,
      rank: ranks[index]
    }));

    // 一括更新
    const { error: updateError } = await supabase
      .from('fetched_data')
      .upsert(updates);

    if (updateError) throw updateError;

    console.log('Rankings updated successfully for parent query:', parentQueryId);
  } catch (error) {
    console.error('Error updating rankings:', error);
    throw error;
  }
}

/**
 * fetched_dataテーブルに、Embedding付きで複数の投稿を一括保存する関数。
 * CohereのgetEmbeddings()で Embeddingを一括取得して保存します。
 */
export async function storeDataWithEmbedding(
  searchQuery: string,
  items: Array<{
    sourceTitle: string;
    sourceUrl: string;
    content: string;
    metadata: any;
  }>,
  userId?: string,
  queryId?: string
): Promise<void> {
  try {
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (sessionError) throw sessionError;
        if (!user?.id) throw new Error('ユーザーがログインしていません');
        actualUserId = user.id;
      } catch (error: unknown) {
        const err = error as Error;
        console.error('セッション取得エラー:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          error: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
        throw new Error(`セッション取得に失敗しました: ${err.message}`);
      }
    }

    // queryIdが渡されていない場合のみgetCurrentQueryIdを使用
    const actualQueryId = queryId || await getCurrentQueryId(searchQuery, actualUserId);
    if (!actualQueryId) {
      throw new Error(`対応するクエリが見つかりませんでした。Query: ${searchQuery}, UserId: ${actualUserId}`);
    }

    // 全てのコンテンツのembeddingを一括取得
    const contents = items.map(item => item.content);
    const embeddings = await getEmbeddings(contents);

    console.log('Saving embeddings in batch:', {
      queryId: actualQueryId,
      itemCount: items.length,
      embeddingLengths: embeddings.map(emb => emb.length)
    });

    // 各embeddingの検証
    embeddings.forEach((embedding, index) => {
      if (!embedding || embedding.length !== 1024) {
        throw new Error(`Invalid embedding at index ${index}: expected 1024 dimensions, got ${embedding?.length}`);
      }
    });

    // ユーザークエリのembeddingを取得（items[0]がユーザークエリの場合）
    const userQueryEmbedding = embeddings[0];
    
    // ランクを計算
    const ranks = rankByEmbeddingSimilarity(userQueryEmbedding, embeddings);

    // データを一括で保存するための準備
    const now = new Date().toISOString();
    const dataToInsert = items.map((item, index) => ({
      id: crypto.randomUUID(),  // UUIDを生成
      content: item.content,
      source_title: item.sourceTitle,
      source_url: item.sourceUrl,
      metadata: item.metadata,
      embedding: embeddings[index],
      created_at: now,
      updated_at: now,
      query_id: actualQueryId
    }));

    const { error: insertError } = await supabase
      .from('fetched_data')
      .insert(dataToInsert);

    if (insertError) {
      console.error('データの保存エラー:', insertError);
      throw new Error(`データの保存に失敗しました: ${insertError.message}`);
    }

    // クエリを更新してfetched_data_idsを設定
    const { data: currentQuery, error: queryError } = await supabase
      .from('queries')
      .select('*')
      .eq('id', actualQueryId)
      .single();

    if (queryError) {
      console.error('クエリの取得エラー:', queryError);
      throw new Error(`クエリの取得に失敗しました: ${queryError.message}`);
    }

    const existingIds = currentQuery?.fetched_data_ids || [];
    const newFetchedDataIds = dataToInsert.map(item => item.id);

    // クエリを更新
    const { error: updateError } = await supabase
      .from('queries')
      .update({
        fetched_data_ids: [...existingIds, ...newFetchedDataIds],
        updated_at: now
      })
      .eq('id', actualQueryId);

    if (updateError) {
      console.error('クエリの更新エラー:', updateError);
      throw new Error(`クエリの更新に失敗しました: ${updateError.message}`);
    }

    console.log('保存されたデータ:', {
      savedCount: dataToInsert.length,
      queryId: actualQueryId,
      newFetchedDataIds
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('データ保存エラー:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      error: JSON.stringify(err, Object.getOwnPropertyNames(err))
    });
    throw err;
  }
}

export async function executeCozeQueries(
  subQueries: string[],
  userId?: string,
  parentQueryId?: string
): Promise<FormattedResponse[]> {
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

          return await processStreamResponse(response, query, userId, parentQueryId);
        } catch (error) {
          const err = error as Error;
          console.error(`Error processing query (attempt ${retries + 1}/${MAX_RETRIES}):`, err);
          if (retries === MAX_RETRIES - 1) {
            return {
              query,
              posts: [],
              metadata: { total_count: 0, processing_time: 0 },
              error: err.message
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
