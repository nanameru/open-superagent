'use client';

import { useEffect, useState } from 'react';
import { TwitterPost } from '@/utils/coze';
import { generateDetailedArticle as generateDetailedArticleGemini } from '@/utils/gemini-2.0-flash-001-article';
import { SourceList } from './source-list';
import { SourcePreview } from './source-preview';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import CopyButton from "@/components/copy-button";
import CitationButton from "@/components/citation-button";
import ReferenceButton from "./reference-button";

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

          // ソースの内容を文字列として結合
          const sourceContents = filteredContents
            .map((item, index) => {
              if (!item.content) return '';
              // 各ソースの内容を1行にまとめる（改行を空白に置換）
              const content = item.content.replace(/\n/g, ' ').trim();
              return content;
            })
            .filter(Boolean)
            .join('\n');

          // generateDetailedArticleを呼び出し
          if (sourceContents) {
            try {
              console.log('Generating detailed article...');
              
              // データの保存完了後に少し待機
              console.log('Waiting for data processing to complete...');
              await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒待機

              console.log('Starting article generation...');
              const { content: generatedContent, error: genError } = await generateDetailedArticleGemini(
                sourceContents,
                searchQuery
              );
              
              if (genError) {
                console.error('Error generating article:', genError);
                setError('記事の生成中にエラーが発生しました。');
              } else if (generatedContent) {
                // 生成された記事を保存
                const { error: insertError } = await supabase
                  .from('summaries')
                  .insert({
                    query_id: parentQueryId,
                    summary_text: generatedContent
                  });

                if (insertError) {
                  console.error('Error saving summary:', insertError);
                }

                setContent(generatedContent);
              }
            } catch (error) {
              console.error('Error in article generation:', error);
              setError('記事の生成中にエラーが発生しました。');
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

          <div className="flex flex-col flex-grow p-8 bg-white dark:bg-[#141414] text-gray-900 dark:text-[#E0E0E0]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">回答</h2>
              <div className="flex items-center space-x-2">
                <CopyButton text={content} />
              </div>
            </div>
            {isGenerating ? (
              <div className="space-y-4">
                {currentPhase === 'planning' && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-[#808080]">
                    <span className="loading loading-dots"></span>
                    <span>回答を計画中...</span>
                  </div>
                )}
                {currentPhase === 'writing' && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-[#808080]">
                    <span className="loading loading-dots"></span>
                    <span>回答を生成中...</span>
                  </div>
                )}
                {currentPhase === 'refining' && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-[#808080]">
                    <span className="loading loading-dots"></span>
                    <span>回答を改善中...</span>
                  </div>
                )}
                {!currentPhase && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-[#808080]">
                    <span className="loading loading-dots"></span>
                    <span>準備中...</span>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="text-red-500 dark:text-red-400">{error}</div>
            ) : content ? (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mt-4 mb-3">{children}</h2>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 my-2">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="my-1">{children}</li>
                    ),
                    p: ({ children }) => {
                      // childrenが配列の場合は文字列に変換
                      const processChildren = (child: any): string => {
                        if (typeof child === 'string') return child;
                        if (Array.isArray(child)) return child.map(processChildren).join('');
                        // ReactElementの場合は空文字を返す（[object Object]の表示を防ぐ）
                        return '';
                      };

                      const text = Array.isArray(children) 
                        ? children.map(processChildren).join('')
                        : processChildren(children);

                      // 数字のリストのパターンを検出して除外
                      if (/^\d+(\s+\d+)*$/.test(text.trim())) {
                        return null;
                      }

                      // 引用番号のパターン（[数字]）を検出
                      const parts = text.split(/(\[\d+\])/g);
                      return (
                        <p className="my-2">
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
