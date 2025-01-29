'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateSubQueries } from '@/utils/meta-llama-3-70b-instruct-turbo';
import { executeCozeQueries } from '@/utils/coze';
import { TwitterPost } from '@/utils/coze';
import SubQueries from '@/components/search/sub-queries';
import GeneratedAnswer from '@/components/search/generated-answer';
import ProcessDetails from '@/components/search/process-details';
import { SourceSidebar } from '@/components/search/source-sidebar';
import { createClient } from '@/utils/supabase/client';

export default function SearchNewPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>('');
  const [subQueries, setSubQueries] = useState<Array<{ query: string }>>([]);
  const [cozeResults, setCozeResults] = useState<any[]>([]);
  const [aggregatedPosts, setAggregatedPosts] = useState<Set<TwitterPost>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'understanding' | 'thinking' | 'processing' | 'generating' | 'completed'>('understanding');
  const [isProcessExpanded, setIsProcessExpanded] = useState(true);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [processedResults, setProcessedResults] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(false);
  const [languageCount, setLanguageCount] = useState<number>(0);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      // 新しい検索クエリをSupabaseに保存
      const saveQuery = async () => {
        const supabase = createClient();
        
        try {
          console.log('[SearchNewPage] Initializing query save...');
          
          // セッションからユーザー情報を取得
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log('[SearchNewPage] Session data:', session);
          console.log('[SearchNewPage] Session error:', sessionError);
          
          if (sessionError) {
            console.error('[SearchNewPage] Session error:', sessionError);
            return;
          }

          if (!session?.user?.id) {
            console.error('[SearchNewPage] No user session found');
            return;
          }

          console.log('[SearchNewPage] Attempting to save query with user_id:', session.user.id);

          const { data, error } = await supabase
            .from('queries')
            .insert({
              user_id: session.user.id,
              query_text: searchQuery,
              query_type: 'user',
              parent_query_id: null
            })
            .select();

          if (error) {
            console.error('[SearchNewPage] Database error:', error);
            return;
          }

          console.log('[SearchNewPage] Query saved successfully:', data);
        } catch (error) {
          console.error('[SearchNewPage] Unexpected error:', error);
          if (error instanceof Error) {
            console.error('[SearchNewPage] Error details:', error.message);
            console.error('[SearchNewPage] Error stack:', error.stack);
          }
        }
      };

      // 直接実行
      saveQuery();

      // 新しい検索開始時にデータをクリア
      setAggregatedPosts(new Set());
      setSubQueries([]);
      setCozeResults([]);
      setProcessedResults(new Set());
      
      setQuery(searchQuery);
      setIsLoading(true);
      setStatus('understanding');
      
      setTimeout(() => {
        setStatus('thinking');
        setTimeout(() => {
          // 新しい投稿を集約する関数
          const aggregatePostsFunc = (newResults: any[]) => {
            setAggregatedPosts(prevPosts => {
              const updatedPosts = new Set(prevPosts);
              newResults.forEach(result => {
                result.posts.forEach((post: TwitterPost) => {
                  // URLとドメイン情報を追加
                  const postWithUrl = {
                    ...post,
                    url: `https://x.com/${post.author.username}/status/${post.id}`,
                    domain: 'x.com'
                  } as TwitterPost & { url: string; domain: string };
                  updatedPosts.add(postWithUrl);
                });
              });
              return updatedPosts;
            });
          };

          generateSubQueries(searchQuery)
            .then(async (response) => {
              const formattedQueries = response.map(query => ({ query }));
              setSubQueries(formattedQueries);
              setStatus('processing');

              // 親クエリのIDを取得
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();
              const { data: parentQuery } = await supabase
                .from('queries')
                .select('id')
                .eq('query_text', searchQuery)
                .eq('query_type', 'user')
                .eq('user_id', session?.user?.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              // サブクエリを保存
              if (parentQuery?.id) {
                const saveSubQueries = formattedQueries.map(async (q) => {
                  try {
                    const { error } = await supabase
                      .from('queries')
                      .insert({
                        user_id: session?.user?.id,
                        query_text: q.query,
                        query_type: 'auto',
                        parent_query_id: parentQuery.id
                      });

                    if (error) {
                      console.error('[SearchNewPage] Error saving sub-query:', error);
                    }
                  } catch (error) {
                    console.error('[SearchNewPage] Unexpected error saving sub-query:', error);
                  }
                });

                await Promise.all(saveSubQueries);
              }
              
              // Execute Coze queries in parallel
              return executeCozeQueries(formattedQueries.map(q => q.query));
            })
            .then((results) => {
              setCozeResults(results);
              aggregatePostsFunc(results);
              setStatus('generating');
              setTimeout(() => {
                setStatus('completed');
              }, 1000);
            })
            .catch((error) => {
              console.error('Error generating sub-queries:', error);
              setSubQueries([]);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }, 1000);
      }, 1000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'completed') {
      setIsProcessExpanded(false);
    }
  }, [status]);

  useEffect(() => {
    // cozeResultsが更新されるたびに実行
    if (cozeResults && cozeResults.length > 0) {
      // 新しい結果のみを処理
      const newResults = cozeResults.filter(result => {
        // クエリをIDとして使用
        const resultId = result.query;
        if (!processedResults.has(resultId)) {
          setProcessedResults(prev => new Set(Array.from(prev).concat(resultId)));
          return true;
        }
        return false;
      });

      if (newResults.length > 0) {
        const newTotal = newResults.reduce((sum, result) => {
          return sum + (result?.metadata?.total_count || 0);
        }, 0);
        
        console.log('New posts found:', newTotal); // デバッグ用
        setTotalPosts(prev => prev + newTotal);
      }
    }
  }, [cozeResults]);

  useEffect(() => {
    if (searchParams.get('q')) {
      setTotalPosts(0);
      setProcessedResults(new Set());
    }
  }, [searchParams]);

  const updateLanguageCount = (queries: Array<{ query: string }>) => {
    const languages = new Set<string>();
    queries.forEach(queryItem => {
      const lang = queryItem.query.match(/lang:(ja|en|zh)/)?.[1];
      if (lang) languages.add(lang);
    });
    setLanguageCount(languages.size);
  };

  useEffect(() => {
    updateLanguageCount(subQueries);
  }, [subQueries]);

  const statusSteps = [
    { key: 'understanding', icon: '💭', label: '理解' },
    { key: 'thinking', icon: '💡', label: '分析' },
    { key: 'processing', icon: '🔄', label: '処理中' },
    { key: 'generating', icon: '✍️', label: '生成' },
    { key: 'completed', icon: '✨', label: '完了' }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === status);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-center mb-12">
          <div className="w-2/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-900/10 blur-md opacity-20"></div>
                  <span className="relative bg-gray-900/10 text-gray-900 px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-wide border border-gray-900/20">
                    Pro Search
                  </span>
                </div>
                <h1 className="text-xl font-medium tracking-tight text-gray-900">
                  {query}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-900"></span>
                  {totalPosts}ソース
                </span>
                <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-900"></span>
                  {languageCount}言語
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツを横並びに */}
        <div className={`flex gap-8 ${!showSidebar ? 'justify-center' : ''}`}>
          {/* 左カラム: プロセスの詳細 */}
          <div className="w-2/3 transition-all duration-300">
            {/* プロセスの詳細セクション */}
            <div className="relative mb-8">
              <button
                onClick={() => setIsProcessExpanded(!isProcessExpanded)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-[#EEEEEE] text-sm text-[#444444] hover:bg-black/[0.02] transition-colors"
              >
                <span>プロセスの詳細</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${isProcessExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isProcessExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="space-y-4">
                  <div className={`transition-all duration-500 ${status === 'understanding' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                        <div className="flex items-center gap-3">
                          <div className="relative w-6 h-6 flex items-center justify-center">
                            {status === 'understanding' || status === 'thinking' || status === 'generating' ? (
                              <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-[#444444]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-[#333333]">"{query}" の意図を理解しています...</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`transition-all duration-500 ${status === 'thinking' ? 'opacity-100' : status === 'understanding' ? 'opacity-0 translate-y-4' : 'opacity-60'}`}>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative w-6 h-6 flex items-center justify-center">
                                {status === 'thinking' || status === 'generating' ? (
                                  <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : status === 'completed' ? (
                                  <svg className="w-3.5 h-3.5 text-[#444444]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                ) : null}
                              </div>
                              <span className="text-sm font-medium text-black">関連する質問を生成中</span>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-md bg-[#F8F8F8] text-[#666666]">
                              {subQueries.length} 件
                            </span>
                          </div>
                          <SubQueries queries={subQueries} isLoading={isLoading} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Xからの検索結果 */}
                  {status === 'processing' && (
                    <div className={`transition-all duration-500 ${status === 'processing' ? 'opacity-100' : status === 'thinking' ? 'opacity-0 translate-y-4' : 'opacity-60'}`}>
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-6 h-6 flex items-center justify-center">
                                <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                              </div>
                              <span className="text-sm font-medium text-black">Xから検索中...</span>
                            </div>
                            {cozeResults && cozeResults.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded-md bg-[#F8F8F8] text-[#666666]">
                                {totalPosts} 件
                              </span>
                            )}
                          </div>

                          {/* 検索結果の表示 */}
                          {cozeResults && cozeResults.length > 0 && (
                            <div className="space-y-3 mt-2">
                              {cozeResults.flatMap((result, resultIndex) => 
                                (result.posts || []).map((post: TwitterPost, postIndex: number) => (
                                  <div 
                                    key={`${resultIndex}-${postIndex}`}
                                    className="p-3 bg-[#F8F8F8] rounded-lg hover:bg-[#F0F0F0] transition-colors"
                                  >
                                    <p className="text-sm text-[#333333] whitespace-pre-wrap">
                                      {post.text}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`transition-all duration-500 ${status === 'generating' ? 'opacity-100' : status === 'understanding' || status === 'thinking' ? 'opacity-0 translate-y-4' : 'opacity-60'}`}>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                      <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-6 h-6 flex items-center justify-center">
                              {status === 'generating' ? (
                                <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                              ) : status === 'completed' ? (
                                <svg className="w-3.5 h-3.5 text-[#444444]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              ) : null}
                            </div>
                            <span className="text-sm font-medium text-black">回答を生成しています</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-md bg-[#F8F8F8] text-[#666666]">
                            情報を整理中...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 生成された回答 */}
            <GeneratedAnswer 
              isCompleted={status === 'completed'} 
              posts={aggregatedPosts}
              searchQuery={query}
              onShowSidebar={() => setShowSidebar(true)}
            />
          </div>

          {/* 右カラム: ソースサイドバー */}
          {showSidebar && (
            <div className="w-1/3 relative">
              <div className="sticky top-8">
                <SourceSidebar
                  sources={Array.from(aggregatedPosts).map(post => ({
                    text: post.text,
                    url: `https://x.com/${post.author.username}/status/${post.id}`,
                    domain: 'x.com',
                    author: {
                      username: post.author.username,
                      profile_image_url: post.author.profile_image_url
                    }
                  }))}
                  isVisible={showSidebar}
                  onClose={() => setShowSidebar(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
