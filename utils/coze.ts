const WORKFLOW_ID = '7462445424055746578';
const API_URL = 'https://api.coze.com/v1/workflow/stream_run';
const BATCH_SIZE = 3; // Reduce batch size to avoid quota issues
const RETRY_DELAY = 10000; // Increase delay between retries to 10 seconds
const MAX_RETRIES = 3; // Maximum number of retry attempts
const BATCH_DELAY = 15000; // Add delay between batches to avoid rate limits

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

async function collectStreamData(response: Response): Promise<string[]> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is null');

  const chunks: string[] = [];
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer) chunks.push(buffer);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      chunks.push(...lines.filter(line => line.trim()));
    }
  } finally {
    reader.releaseLock();
  }

  return chunks;
}

function formatTwitterPost(rawPost: any): TwitterPost {
  return {
    id: rawPost.id,
    text: rawPost.text,
    author: {
      id: rawPost.author_id,
      username: rawPost.username,
      name: rawPost.name,
      profile_image_url: rawPost.profile_image_url,
      verified: rawPost.verified
    },
    metrics: {
      retweets: rawPost.public_metrics?.retweet_count || 0,
      replies: rawPost.public_metrics?.reply_count || 0,
      likes: rawPost.public_metrics?.like_count || 0,
      quotes: rawPost.public_metrics?.quote_count || 0,
      impressions: rawPost.public_metrics?.impression_count || 0
    },
    created_at: new Date(rawPost.created_at).toISOString(),
    urls: rawPost.entities?.urls?.map((u: any) => ({
      url: u.url,
      expanded_url: u.expanded_url,
      title: u.title,
      description: u.description,
      image: u.images?.[0]?.url
    })),
    media: rawPost.media?.map((m: any) => ({
      type: m.type,
      url: m.url,
      preview_url: m.preview_image_url,
      alt_text: m.alt_text
    })),
    referenced_tweets: rawPost.referenced_tweets,
    language: rawPost.lang,
    source: rawPost.source,
    context_annotations: rawPost.context_annotations
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function executeCozeQueries(subQueries: string[]): Promise<FormattedResponse[]> {
  const results: FormattedResponse[] = [];
  
  // Split queries into batches
  for (let i = 0; i < subQueries.length; i += BATCH_SIZE) {
    const batch = subQueries.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(subQueries.length / BATCH_SIZE)}`);
    
    for (const query of batch) {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          // Clean up the query string before sending
          const cleanQuery = query
            .replace(/```json\s*\[?\s*/g, '')
            .replace(/\s*\]?\s*```\s*$/, '')
            .replace(/[{}"\\]/g, '')
            .replace(/^\s*query:\s*/, '')
            .replace(/,\s*$/, '')
            .trim();

          const requestBody = {
            parameters: {
              input: cleanQuery
            },
            workflow_id: WORKFLOW_ID
          };
          console.log('Request body:', JSON.stringify(requestBody, null, 2));
          
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
            if (errorData.error_code === 4009) {
              console.log(`Rate limit reached, waiting ${RETRY_DELAY/1000} seconds before retry...`);
              await sleep(RETRY_DELAY);
              retries++;
              continue;
            }
            // Handle quota exceeded error
            if (errorData.error_message?.includes('QUOTA_BYTES quota exceeded')) {
              console.log('Quota limit reached, waiting before retry...');
              await sleep(RETRY_DELAY * 2); // Wait longer for quota reset
              retries++;
              continue;
            }
            throw new Error(`Coze API error: ${response.statusText}`);
          }

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
            // Log the raw response
            const responseText = await response.text();
            console.log('Raw API Response:', responseText);

            // Parse response as lines
            const lines = responseText.split('\n').filter(line => line.trim());
            console.log('Response lines:', lines);

            // Process each line
            const allPosts: TwitterPost[] = [];
            let newestId: string | undefined;
            let oldestId: string | undefined;

            for (const line of lines) {
              try {
                // Remove data: prefix if exists and clean the line
                const cleanedLine = line.trim();
                console.log('Processing line:', cleanedLine);

                // Skip empty lines and [DONE] messages
                if (!cleanedLine || cleanedLine === '[DONE]') {
                  console.log('Skipping empty or DONE line');
                  continue;
                }

                // Handle different message types
                if (cleanedLine.startsWith('event:')) {
                  const eventType = cleanedLine.replace('event:', '').trim();
                  console.log('Received event:', eventType);
                  if (eventType === 'Error') {
                    console.warn('Error event received from stream');
                  }
                  continue;
                }

                // Handle data messages
                if (!cleanedLine.startsWith('data:')) {
                  console.log('Skipping non-data line:', cleanedLine);
                  continue;
                }

                const dataContent = cleanedLine.replace('data:', '').trim();
                
                // Try to parse as JSON
                let data;
                try {
                  data = JSON.parse(dataContent);
                  if (data.content) {
                    try {
                      const contentData = JSON.parse(data.content);
                      if (contentData.output && contentData.output[0]?.freeBusy?.post) {
                        const posts = contentData.output[0].freeBusy.post;
                        posts.forEach((post: any) => {
                          const formattedPost = {
                            id: post.rest_id,
                            created_at: post.created_at,
                            text: post.full_text,
                            author: {
                              id: post.user.rest_id,
                              username: post.user.screen_name,
                              name: post.user.name,
                              description: post.user.description,
                              followers_count: post.user.followers_count,
                              location: post.user.location
                            },
                            metrics: {
                              retweets: post.retweet_count || 0,
                              likes: post.favorite_count || 0,
                              replies: 0,
                              quotes: 0,
                              impressions: 0
                            },
                            media: post.media ? post.media.map((m: any) => ({
                              type: m.type,
                              url: m.media_url_https,
                              preview_url: m.display_url,
                              alt_text: m.expanded_url
                            })) : []
                          };
                          console.log('Formatted post:', JSON.stringify(formattedPost, null, 2));
                          allPosts.push(formattedPost);
                        });
                      }
                    } catch (contentError) {
                      console.error('Error parsing content:', contentError);
                    }
                  }
                  console.log('Successfully parsed JSON:', data);
                } catch (parseError: unknown) {
                  console.error('Failed to parse data content:', dataContent);
                  if (parseError instanceof Error) {
                    console.error('Parse error:', parseError.message);
                  } else {
                    console.error('Unknown parse error occurred');
                  }
                  continue;
                }

                if (data?.response) {
                  // If it's a text response, create a simple post
                  const post = {
                    id: Date.now().toString(),
                    text: data.response,
                    author: {
                      id: 'coze',
                      username: 'Coze AI',
                      name: 'Coze AI',
                      profile_image_url: undefined,
                      verified: true
                    },
                    metrics: {
                      retweets: 0,
                      replies: 0,
                      likes: 0,
                      quotes: 0,
                      impressions: 0
                    },
                    created_at: new Date().toISOString(),
                    urls: [],
                    media: [],
                    referenced_tweets: [],
                    language: 'ja',
                    source: 'Coze AI',
                    context_annotations: []
                  };
                  allPosts.push(post);
                }
              } catch (e) {
                console.error('Error processing line:', e);
                continue;
              }
            }

            // Update response with processed posts
            formattedResponse.posts = allPosts;
            formattedResponse.metadata = {
              total_count: allPosts.length,
              newest_id: newestId,
              oldest_id: oldestId,
              processing_time: Date.now() - startTime
            };
          } catch (error) {
            formattedResponse.error = error instanceof Error ? error.message : String(error);
          }

          results.push(formattedResponse);
          await sleep(1000); // Add a small delay between queries in the same batch
          break; // Exit retry loop on success
        } catch (error) {
          console.error(`Error processing query (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
          if (retries === MAX_RETRIES - 1) {
            results.push({
              query,
              posts: [],
              metadata: {
                total_count: 0,
                processing_time: 0
              },
              error: error instanceof Error ? error.message : String(error)
            });
          } else {
            await sleep(RETRY_DELAY);
            retries++;
          }
        }
      }
    }
    
    // Add delay between batches
    if (i + BATCH_SIZE < subQueries.length) {
      console.log(`Waiting between batches to avoid rate limits...`);
      await sleep(BATCH_DELAY);
    }
  }
  
  return results;
}
