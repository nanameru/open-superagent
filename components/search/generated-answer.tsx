'use client';

import { useEffect, useState } from 'react';
import { TwitterPost } from '@/utils/coze';
import { generateDetailedArticle } from '@/utils/deepseek-article';

interface GeneratedAnswerProps {
  isCompleted?: boolean;
  posts?: Set<TwitterPost>;
  searchQuery: string;
}

export default function GeneratedAnswer({ isCompleted, posts, searchQuery }: GeneratedAnswerProps) {
  const [generatedAnswer, setGeneratedAnswer] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isCompleted && posts && posts.size > 0) {
      setIsGenerating(true);
      const postsArray = Array.from(posts);
      const postsContent = postsArray.map(post => post.text).join('\n');
      
      generateDetailedArticle(postsContent, searchQuery)
        .then((response) => {
          if (response.error) {
            console.error('Error generating article:', response.error);
            setGeneratedAnswer('申し訳ありません。記事の生成中にエラーが発生しました。');
          } else {
            setGeneratedAnswer(response.content);
          }
        })
        .catch((error) => {
          console.error('Error generating article:', error);
          setGeneratedAnswer('申し訳ありません。記事の生成中にエラーが発生しました。');
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [isCompleted, posts, searchQuery]);

  if (!isCompleted) return null;

  return (
    <div className="flex items-start gap-4 p-6 bg-black/[0.02] rounded-xl backdrop-blur-sm">
      <div className="w-full">
        <div className="text-gray-600">
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <span>回答を生成中...</span>
              <div className="animate-spin h-4 w-4 border-2 border-gray-600 rounded-full border-t-transparent"></div>
            </div>
          ) : generatedAnswer ? (
            <div className="whitespace-pre-wrap">{generatedAnswer}</div>
          ) : (
            '回答を生成しました！'
          )}
        </div>
      </div>
    </div>
  );
}
