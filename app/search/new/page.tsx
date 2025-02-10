'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { generateSubQueries as generateSubQueriesGemini } from '@/utils/gemini-2.0-flash-001';
import { executeCozeQueries, rerankSimilarDocuments, storeDataWithEmbedding } from '@/utils/coze';
import { TwitterPost } from '@/utils/coze';
import SubQueries from '@/components/search/sub-queries';
import GeneratedAnswer from '@/components/search/generated-answer';
import ProcessDetails from '@/components/search/process-details';
import { SourceSidebar } from '@/components/search/source-sidebar';
import { Analytics } from "@vercel/analytics/react";

// 型定義を追加
type FetchedData = {
  id: string;
  content: string;
  source_title: string;
  source_url: string;
  metadata?: Record<string, any>;
};

type SubQuery = {
  query_text: string;
  fetched_data?: FetchedData[];
};

enum QueryType {
  USER = 'user',
  AUTO = 'auto'
}

// デバウンス用のカスタムフック
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function SearchNewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>('');
  const [subQueries, setSubQueries] = useState<SubQuery[]>([]);
  const [cozeResults, setCozeResults] = useState<any[]>([]);
  const [aggregatedPosts, setAggregatedPosts] = useState<Set<TwitterPost>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'understanding' | 'thinking' | 'processing' | 'generating' | 'completed' | 'error'>('understanding');
  const [isProcessExpanded, setIsProcessExpanded] = useState(true);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [processedResults, setProcessedResults] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(false);
  const [languageCount, setLanguageCount] = useState<number>(0);
  const [parentQueryData, setParentQueryData] = useState<any>(null);
  const [dbSubQueries, setDbSubQueries] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<any[]>([]);
  const [processedQueries, setProcessedQueries] = useState<number>(0);
  const [totalQueries, setTotalQueries] = useState<number>(0);
  const [visualProgress, setVisualProgress] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const createNewParentQuery = useCallback(async (searchQuery: string, userId: string | undefined) => {
    setQuery(searchQuery);
    const supabase = createClient();
    
    // ロックキーの設定
    const lockKey = `query_lock_${userId}_${searchQuery}`;
    const lockTimeout = 5000; // 5秒

    // ロックチェック
    if (localStorage.getItem(lockKey)) {
      console.log('Query creation is locked');
      return;
    }

    try {
      localStorage.setItem(lockKey, 'true');
      
      // 日付範囲の設定
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 既存のクエリをチェック
      const { data: existingQuery, error: checkError } = await supabase
        .from('queries')
        .select('*')
        .eq('query_text', searchQuery)
        .eq('query_type', QueryType.USER)
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing query:', checkError);
        return;
      }

      let queryToUse = existingQuery;

      if (!existingQuery) {
        const { data: newQuery, error: insertError } = await supabase
          .from('queries')
          .insert({
            user_id: userId,
            query_text: searchQuery,
            query_type: QueryType.USER,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating new query:', insertError);
          return;
        }

        queryToUse = newQuery;
        
        // 新規クエリの場合のみ、新しいサブクエリと回答を生成
        await storeDataWithEmbedding(
          searchQuery,
          [{
            sourceTitle: 'User Query',
            sourceUrl: '',
            content: searchQuery,
            metadata: {
              type: 'user_query',
              timestamp: new Date().toISOString()
            }
          }],
          userId
        );

        generateNewSubQueries(searchQuery, userId, queryToUse.id);
      } else {
        // 既存のクエリが見つかった場合、関連データを取得
        
        // サブクエリを取得
        const { data: existingSubQueries, error: subQueryError } = await supabase
          .from('queries')
          .select('*')
          .eq('parent_query_id', queryToUse.id)
          .eq('query_type', QueryType.AUTO)
          .order('created_at', { ascending: true });

        if (subQueryError) {
          console.error('Error fetching existing sub-queries:', subQueryError);
        } else if (existingSubQueries) {
          setDbSubQueries(existingSubQueries);
          setSubQueries(existingSubQueries.map(sq => ({
            id: sq.id,
            query_text: sq.query_text,
            fetched_data: []
          })));
        }

        // 回答を取得
        const { data: existingResults, error: resultsError } = await supabase
          .from('query_results')
          .select('*')
          .eq('query_id', queryToUse.id)
          .order('created_at', { ascending: true });

        if (resultsError) {
          console.error('Error fetching existing results:', resultsError);
        } else if (existingResults) {
          const posts = new Set<TwitterPost>();
          existingResults.forEach(result => {
            try {
              const parsedPosts = JSON.parse(result.content);
              parsedPosts.forEach((post: TwitterPost) => {
                posts.add(post);
              });
            } catch (e) {
              console.error('Error parsing result content:', e);
            }
          });
          setAggregatedPosts(posts);
          setTotalPosts(posts.size);
        }

        // プロセスステータスを完了に設定
        setStatus('completed');
      }

      if (queryToUse) {
        setParentQueryData(queryToUse);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error creating parent query:', error);
    } finally {
      // 処理完了後にロックを解除（タイムアウト付き）
      setTimeout(() => {
        localStorage.removeItem(lockKey);
      }, lockTimeout);
    }
  }, []);

  // デバウンスされたクエリ作成関数
  const debouncedCreateQuery = useDebounce(createNewParentQuery, 1000);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery && !isLoading) {
      const fetchQueriesFromDb = async () => {
        const supabase = createClient();

        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            return;
          }

          if (!session?.user?.id) {
            console.error('No user session found');
            return;
          }

          debouncedCreateQuery(searchQuery, session.user.id);
        } catch (error) {
          console.error('Unexpected error:', error);
          setQuery(searchQuery);
        }
      };

      fetchQueriesFromDb();

      // 新しい検索開始時にデータをクリア
      setAggregatedPosts(new Set());
      setCozeResults([]);
      setProcessedResults(new Set());
      
      setIsLoading(true);
    }
  }, [searchParams, debouncedCreateQuery, isLoading]);

  useEffect(() => {
    if (status === 'completed') {
      setIsProcessExpanded(false);
    }
  }, [status]);

  useEffect(() => {
    const fetchTotalPosts = async () => {
      if (!parentQueryData?.id) {
        console.log('No parentQueryData.id available');
        return;
      }

      console.log('Fetching posts for parent query ID:', parentQueryData.id);
      const supabase = createClient();
      const { count, error } = await supabase
        .from('fetched_data')
        .select('*', { count: 'exact', head: true })
        .eq('query_id', parentQueryData.id);

      if (error) {
        console.error('Error fetching total posts:', error);
        return;
      }

      console.log('Total posts found:', count);
      setTotalPosts(count || 0);
    };

    fetchTotalPosts();
  }, [parentQueryData?.id]);

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
    const updateLanguageCount = (queries: SubQuery[]) => {
      const languages = new Set<string>();
      queries.forEach(queryItem => {
        const lang = queryItem.query_text.match(/lang:(ja|en|zh)/)?.[1];
        if (lang) languages.add(lang);
      });
      setLanguageCount(languages.size);
    };

    updateLanguageCount(subQueries);
  }, [subQueries]);

  useEffect(() => {
    if (status === 'processing') {
      setVisualProgress(0);
      setIsSearching(false);  // 初期状態ではfalse
      setProcessedQueries(0); // processedQueriesもリセット
    }
  }, [status]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (status === 'processing' && isSearching) {  // processedQueries > 0 の条件を削除
      // 実際の進捗
      const actualProgress = totalQueries > 0 ? (processedQueries / totalQueries) * 100 : 0;
      
      intervalId = setInterval(() => {
        setVisualProgress(current => {
          // 実際の進捗より少し先まで進める（最大90%まで）
          const target = Math.min(actualProgress + 10, 90);
          if (current < target) {
            // 1秒で10%進むように設定（100ms間隔で1%進む）
            return current + 1;
          }
          return current;
        });
      }, 100);
    } else if (status !== 'processing') {
      // 処理が完了したら100%にする
      if (processedQueries > 0) {  // 処理が実際に行われた場合のみ100%にする
        setVisualProgress(100);
      }
      setIsSearching(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, processedQueries, totalQueries, isSearching]);

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

  const generateNewSubQueries = async (searchQuery: string, userId: string | undefined, parentId: string) => {
    setStatus('understanding');
    const supabase = createClient();
    
    try {
      setStatus('thinking');
      const response = await generateSubQueriesGemini(searchQuery);
      const formattedQueries = response.map(query => ({ query_text: query, fetched_data: [] }));
      setSubQueries(formattedQueries);
      setStatus('processing');

      // サブクエリを保存
      const saveSubQueries = formattedQueries.map(async (q) => {
        try {
          const { error } = await supabase
            .from('queries')
            .insert({
              user_id: userId,
              query_text: q.query_text,
              query_type: QueryType.AUTO,
              parent_query_id: parentId
            });

          if (error) {
            console.error('Error saving sub query:', error);
            return;
          }
        } catch (error) {
          console.error('Error in saveSubQueries:', error);
        }
      });

      await Promise.all(saveSubQueries);

      // Cozeクエリを実行
      try {
        setTotalQueries(formattedQueries.length);  // 総クエリ数を設定
        setProcessedQueries(0);  // 処理数を0にリセット
        setIsSearching(true);    // 検索開始状態に設定
        setVisualProgress(0);    // プログレスバーを0%に設定
        
        const results = await executeCozeQueries(
          formattedQueries.map(q => q.query_text),
          userId,
          parentId,
          (processed) => {
            setProcessedQueries(processed);  // 処理済みクエリ数を更新
          }
        );
        setCozeResults(results);
        
        // ランク付けを実行
        try {
          await rerankSimilarDocuments(parentId);
        } catch (error) {
          console.error('Error reranking documents:', error);
        }

        setStatus('completed');
      } catch (error) {
        console.error('Error executing Coze queries:', error);
        setStatus('completed');
      }
    } catch (error) {
      console.error('Error generating sub queries:', error);
      setStatus('completed');
    }
  };

  // 選定されたソースを取得する関数
  const fetchSelectedSources = async (queryId: string) => {
    const supabase = createClient();
    try {
      const { data: rags, error: ragsError } = await supabase
        .from('rags')
        .select(`
          *,
          fetched_data (
            content,
            source_title,
            source_url
          )
        `)
        .eq('query_id', queryId)
        .order('rank', { ascending: true });

      if (ragsError) {
        console.error('Error fetching selected sources:', ragsError);
        return;
      }

      if (rags) {
        setSelectedSources(rags);
      }
    } catch (error) {
      console.error('Error in fetchSelectedSources:', error);
    }
  };

  useEffect(() => {
    if (parentQueryData?.id && status === 'completed') {
      fetchSelectedSources(parentQueryData.id);
    }
  }, [parentQueryData?.id, status]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-center mb-12">
          <div className="w-[75%]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gray-900/10 blur-md opacity-20"></div>
                  <span className="relative bg-gray-900/10 text-gray-900 px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-wide border border-gray-900/20 whitespace-nowrap">
                    Pro Search
                  </span>
                </div>
                {parentQueryData && (
                  <h1 className="text-xl font-medium tracking-tight text-gray-900 truncate">
                    {parentQueryData.query_text}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs flex-shrink-0 ml-4">
                <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-900"></span>
                  {totalPosts}ソース
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツを横並びに */}
        <div className={`flex gap-8 ${!showSidebar ? 'justify-center' : ''}`}>
          {/* 左カラム: プロセスの詳細 */}
          <div className="w-[75%] transition-all duration-300">
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
                      <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE] min-h-[72px] flex items-center">
                        <div className="flex items-center gap-3 w-full">
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
                              {Math.max(0, subQueries.length - 1)} 件
                            </span>
                          </div>
                          <SubQueries 
                            queries={subQueries.map(sq => ({ 
                              query: sq.query_text,
                              query_text: sq.query_text
                            }))} 
                            isLoading={isLoading} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Xからの検索結果 */}
                  {status === 'processing' && (
                    <div className={`transition-all duration-500 ${status === 'processing' ? 'opacity-100' : status === 'thinking' ? 'opacity-0 translate-y-4' : 'opacity-60'}`}>
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE] min-h-[72px]">
                          <div className="flex flex-col gap-3 w-full">
                            {/* 上部: 検索状態と総件数 */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                  <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <span className="text-sm font-medium text-black">Xから検索中...</span>
                                <span className="text-sm text-gray-500">
                                  {processedQueries}/{totalQueries} クエリ完了
                                </span>
                              </div>
                              {cozeResults && cozeResults.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded-md bg-[#F8F8F8] text-[#666666]">
                                  {totalPosts} 件
                                </span>
                              )}
                            </div>
                            
                            {/* 下部: プログレスバー */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-black transition-all duration-300 rounded-full"
                                style={{ 
                                  width: `${visualProgress}%` 
                                }}
                              />
                            </div>
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
                      <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE] min-h-[72px] flex items-center">
                        <div className="flex items-center justify-between w-full">
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
              parentQueryId={parentQueryData?.id}
              onShowSidebar={() => setShowSidebar(true)}
            />
          </div>

          {/* 右カラム: ソースサイドバー */}
          {showSidebar && (
            <div className="w-[25%] relative">
              <div className="sticky top-8">
                <SourceSidebar
                  sources={selectedSources.map(rag => ({
                    title: rag.fetched_data?.source_title || '',
                    url: rag.fetched_data?.source_url || '',
                    content: rag.fetched_data?.content || '',
                    score: rag.score,
                    rank: rag.rank
                  }))}
                  isVisible={showSidebar}
                  onClose={() => setShowSidebar(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col h-full">
        <Analytics />
      </div>
    </div>
  );
}
