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

      const fetchSelectedSources = async () => {
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
            .eq('query_id', parentQueryId)
            .order('rank', { ascending: true });

          if (ragsError) {
            throw ragsError;
          }

          if (!rags || rags.length === 0) {
            setError('');
            setIsGenerating(false);
            return;
          }

          setSelectedSources(rags);

          // User Queryを除外し、contentを抽出
          const filteredContents = rags
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

          // 配列を文字列に結合（番号付け不要、formatInputDataで処理される）
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
            setContent(response.content);
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

      fetchSelectedSources();
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
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              {getPhaseText(currentPhase)}
            </div>
          ) : content ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">回答</h2>
                <CopyButton text={content} />
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                    p: ({ children }) => {
                      if (typeof children === 'string') {
                        // 引用番号のパターンを検出（連続する[n]も対応）
                        const parts = children.split(/(\[\d+\](?:\[\d+\])*)/);
                        
                        return (
                          <p className="my-3">
                            {parts.map((part, i) => {
                              if (part.match(/\[\d+\](?:\[\d+\])*$/)) {
                                // 連続する引用番号を個別に処理
                                const citations = Array.from(part.matchAll(/\[(\d+)\]/g));
                                return (
                                  <span key={`citations-${i}`} className="inline-flex gap-0.5">
                                    {citations.map((citation, j) => {
                                      const index = parseInt(citation[1], 10);
                                      const sourceUrl = urlMap.get(index);
                                      if (sourceUrl) {
                                        return (
                                          <CitationButton 
                                            key={`citation-${i}-${j}`}
                                            index={index} 
                                            url={sourceUrl} 
                                          />
                                        );
                                      }
                                      return citation[0];
                                    })}
                                  </span>
                                );
                              }
                              return <span key={`text-${i}`}>{part}</span>;
                            })}
                          </p>
                        );
                      }
                      return <p className="my-3">{children}</p>;
                    },
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
