'use client';

import { useEffect, useState } from 'react';
import { TwitterPost } from '@/utils/coze';
import { generateDetailedArticle } from '@/utils/meta-llama-3-70b-instruct-turbo-article';
import { SourceList } from './source-list';
import { SourcePreview } from './source-preview';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import CopyButton from "@/components/copy-button";
import CitationButton from "@/components/citation-button";

interface GeneratedAnswerProps {
  isCompleted?: boolean;
  posts?: Set<TwitterPost>;
  searchQuery: string;
  parentQueryId: string; 
  onShowSidebar?: () => void;
}

export default function GeneratedAnswer({ 
  isCompleted, 
  posts, 
  searchQuery,
  parentQueryId, 
  onShowSidebar 
}: GeneratedAnswerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'writing' | 'refining' | null>(null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<any[]>([]);
  const [urlMap, setUrlMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (isCompleted && parentQueryId) {
      setIsGenerating(true);
      setCurrentPhase(null);
      setContent('');
      setError('');

      const fetchData = async () => {
        const supabase = createClient();
        let filteredContents: { content: string; url: string }[] = [];
        
        try {
          // まず、保存された要約があるか確認
          console.log('Checking for existing summary...');
          const { data: summaries, error: summaryError } = await supabase
            .from('summaries')
            .select('summary_text')
            .eq('query_id', parentQueryId)
            .limit(1);

          // ソースを取得
          console.log('Fetching sources...');
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
            .eq('query_id', parentQueryId)
            .order('rank', { ascending: true });

          if (ragsError) {
            throw ragsError;
          }

          if (rags && rags.length > 0) {
            setSelectedSources(rags);

            // User Queryを除外し、contentを抽出
            filteredContents = rags
              .map(rag => rag.fetched_data)
              .filter(data => data && data.source_title !== "User Query")
              .map(data => ({
                content: data?.content,
                url: data?.source_url
              }))
              .filter(item => item.content && item.url);

            // URLマップを作成（インデックスとURLの対応）
            const newUrlMap = new Map(
              filteredContents.map((item, index) => [index + 1, item.url])
            );
            setUrlMap(newUrlMap);
          }

          // 既存の要約があれば表示
          if (summaryError) {
            console.error('Error fetching summary:', summaryError);
          } else if (summaries && summaries.length > 0) {
            console.log('Found existing summary');
            setContent(summaries[0].summary_text);
            setIsGenerating(false);
            return;
          }

          // 保存された要約がない場合は、新しく生成
          console.log('No existing summary found, checking sources...');
          
          if (!rags || rags.length === 0) {
            console.log('No sources found, cannot generate summary');
            setError('ソースが見つかりませんでした');
            setIsGenerating(false);
            return;
          }

          if (filteredContents.length === 0) {
            console.log('No valid sources found after filtering');
            setError('有効なソースが見つかりませんでした');
            setIsGenerating(false);
            return;
          }

          console.log('Generating new summary...');
          // 配列を文字列に結合
          const sourcesContent = filteredContents.map(item => item.content).join('\n');

          console.log('Starting article generation with query:', searchQuery);
          console.log('Selected sources count:', filteredContents.length);
          
          const response = await generateDetailedArticle(sourcesContent, searchQuery);
          
          if (response.error) {
            console.error('Error in article generation:', response.error);
            setError(response.error);
            setContent('');
          } else {
            console.log('Article generation completed successfully');
            console.log('Generated content length:', response.content.length);
            setContent(response.content);
            
            // Save to database
            try {
              console.log('Starting database save operation...');
              console.log('Query ID:', parentQueryId);
              console.log('Content preview:', response.content.substring(0, 100) + '...');

              const supabase = createClient();
              console.log('Supabase client created');

              console.log('Attempting to insert data into summaries table...');
              const { data, error: insertError } = await supabase
                .from('summaries')
                .insert({
                  query_id: parentQueryId,
                  summary_text: response.content,
                  source_references: null
                })
                .select();

              if (insertError) {
                console.error('Error saving to database:', insertError);
                console.error('Error details:', {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                });
              } else {
                console.log('Successfully saved to database');
                console.log('Saved data:', data);
              }
            } catch (dbError) {
              console.error('Database operation failed');
              console.error('Error type:', dbError?.constructor?.name);
              console.error('Full error:', dbError);
            }
          }
        } catch (error) {
          console.error('Error fetching selected sources:', error);
          setError('');
          setContent('');
        } finally {
          setIsGenerating(false);
          setCurrentPhase(null);
        }
      };

      fetchData();
    }
  }, [isCompleted, parentQueryId, searchQuery]);

  const getPhaseText = (phase: 'planning' | 'writing' | 'refining' | null) => {
    switch (phase) {
      case 'planning':
        return '構成を計画中...';
      case 'writing':
        return '記事を執筆中...';
      case 'refining':
        return '記事を推敲中...';
      default:
        return '回答を生成中...';
    }
  };

  if (!isCompleted) return null;

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        
        <div className="prose prose-sm max-w-none">
          {selectedSources.length > 0 && (
            <div className="mb-8">
              <SourcePreview
                sources={selectedSources.map(rag => ({
                  title: rag.fetched_data?.source_title || '',
                  url: rag.fetched_data?.source_url || '',
                  content: rag.fetched_data?.content || '',
                  score: rag.score,
                  rank: rag.rank
                }))}
                onShowAll={onShowSidebar}
              />
            </div>
          )}

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black dark:bg-white animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-3 h-3 rounded-full bg-black dark:bg-white animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-3 h-3 rounded-full bg-black dark:bg-white animate-[bounce_1s_infinite_400ms]"></div>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {currentPhase ? (
                  <div className="flex items-center gap-2">
                    <span>{getPhaseText(currentPhase)}</span>
                    <svg className="animate-spin h-4 w-4 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <span>回答を生成中...</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              {content && (
                <div className="relative group">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">回答</h2>
                    <div className="absolute -right-2 -top-2">
                      <CopyButton text={content} />
                    </div>
                  </div>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        const text = children?.toString() || '';
                        // 数字のリストのパターンを検出して除外
                        if (/^\d+(\s+\d+)*$/.test(text.trim())) {
                          return null;
                        }
                        // 引用番号のパターン（[数字]）を検出
                        const parts = text.split(/(\[\d+\])/g);
                        return (
                          <p>
                            {parts.map((part, index) => {
                              const match = part.match(/\[(\d+)\]/);
                              if (match) {
                                const citationNumber = parseInt(match[1]);
                                const url = urlMap.get(citationNumber);
                                return url ? (
                                  <CitationButton
                                    key={`inline-citation-${index}`}
                                    index={citationNumber}
                                    url={url}
                                    inline={true}
                                  />
                                ) : part;
                              }
                              return part;
                            })}
                          </p>
                        );
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
