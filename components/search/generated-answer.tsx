'use client';

import { useEffect, useState } from 'react';
import { TwitterPost } from '@/utils/coze';
import { generateDetailedArticle } from '@/utils/gemini-article';
import { SourceList } from './source-list';
import { SourcePreview } from './source-preview';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface GeneratedAnswerProps {
  isCompleted?: boolean;
  posts?: Set<TwitterPost>;
  searchQuery: string;
  onShowSidebar?: () => void;
}

export default function GeneratedAnswer({ 
  isCompleted, 
  posts, 
  searchQuery,
  onShowSidebar 
}: GeneratedAnswerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'writing' | 'refining' | null>(null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isCompleted && posts && posts.size > 0) {
      setIsGenerating(true);
      setCurrentPhase(null);
      setContent('');
      setError('');
      
      const postsArray = Array.from(posts);
      let postsContent = postsArray.map(post => post.text).join('\n');
      
      try {
        console.log('Starting article generation with query:', searchQuery);
        console.log('Posts content length:', postsContent.length);
        
        generateDetailedArticle(
          postsContent, 
          searchQuery,
          (chunk) => {
            if (!chunk || !chunk.content) {
              console.warn('Received invalid chunk:', chunk);
              return;
            }
            
            setContent(prev => {
              const newContent = prev + chunk.content;
              console.log('Current content length:', newContent.length);
              return newContent;
            });
          }
        )
        .then(() => {
          console.log('Article generation completed successfully');
          setIsGenerating(false);
          setCurrentPhase(null);
        })
        .catch((error) => {
          console.error('Detailed error in article generation:', error);
          console.error('Error stack:', error.stack);
          setContent('申し訳ありません。記事の生成中にエラーが発生しました。');
          setIsGenerating(false);
          setCurrentPhase(null);
        });
      } catch (error) {
        console.error('Error in useEffect:', error);
        setContent('申し訳ありません。予期せぬエラーが発生しました。');
        setIsGenerating(false);
        setCurrentPhase(null);
      }
    }
  }, [isCompleted, posts, searchQuery]);

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

  const sourceArray = posts ? Array.from(posts).map(post => post.text) : [];

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {isGenerating && (
            <>
              <span className="text-gray-600">{getPhaseText(currentPhase)}</span>
              <div className="animate-spin h-4 w-4 border-2 border-gray-600 rounded-full border-t-transparent"></div>
            </>
          )}
          {!isGenerating && <span className="text-green-600">生成完了</span>}
        </div>
        
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        
        <div className="prose prose-sm max-w-none">
          {sourceArray.length > 0 && (
            <div className="mb-8">
              <SourcePreview
                sources={sourceArray}
                onShowAll={onShowSidebar}
              />
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}
