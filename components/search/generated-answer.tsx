'use client';

import { useEffect, useState } from 'react';
import { TwitterPost } from '@/utils/coze';
import { generateDetailedArticle } from '@/utils/meta-llama-3-70b-instruct-turbo-article';
import { SourceList } from './source-list';
import { SourcePreview } from './source-preview';
import { createClient } from '@/utils/supabase/client';

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

          const sourcesContent = rags
            .map(rag => rag.fetched_data?.content)
            .filter(Boolean)
            .join('\n');

          console.log('Starting article generation with query:', searchQuery);
          console.log('Selected sources count:', rags.length);
          
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
            <div className="whitespace-pre-wrap">{content}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
