'use client';

import { useEffect } from 'react';
import SubQueries from './sub-queries';
import PostList from './post-list';
import ParsedPosts from './parsed-posts';
import { FormattedResponse } from '@/utils/coze';

interface ProcessDetailsProps {
  query: string;
  status: 'understanding' | 'thinking' | 'processing' | 'generating' | 'completed';
  subQueries: string[];
  isLoading: boolean;
  isProcessExpanded: boolean;
  onToggleExpand: () => void;
  cozeResults?: FormattedResponse[];
}

export default function ProcessDetails({ 
  query, 
  status, 
  subQueries, 
  isLoading,
  isProcessExpanded,
  onToggleExpand,
  cozeResults
}: ProcessDetailsProps) {
  useEffect(() => {
    // 回答生成完了時にプロセス詳細を閉じる
    if (status === 'completed' && isProcessExpanded) {
      onToggleExpand();
    }
    // Debug output with styling
    if (status === 'processing') {
      console.log(
        '%c🤖 Coze APIを起動しました！検索を開始します... %c\n',
        'background: #4CAF50; color: white; font-size: 14px; padding: 8px; border-radius: 4px; font-weight: bold;',
        'font-size: 0'
      );
    }
    if (cozeResults) {
      console.log(
        '%c📊 検索結果が届きました！ %c\n',
        'background: #2196F3; color: white; font-size: 14px; padding: 8px; border-radius: 4px; font-weight: bold;',
        'font-size: 0'
      );
      console.log('結果:', cozeResults);
    }
  }, [status, onToggleExpand, isProcessExpanded, cozeResults]);

  return (
    <div className="space-y-4">
      <button
        onClick={onToggleExpand}
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
          ${isProcessExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="space-y-4">
          {/* Understanding status */}
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className={`absolute inset-0 ${status === 'understanding' ? 'animate-ping' : ''} rounded-full bg-blue-400 opacity-20`}></div>
              <span className="relative">💭</span>
            </div>
            <span className="text-sm text-[#444444]">"{query}"の意図を理解しています...</span>
          </div>

          {/* Thinking status */}
          {status !== 'understanding' && (
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className={`absolute inset-0 ${status === 'thinking' ? 'animate-ping' : ''} rounded-full bg-blue-400 opacity-20`}></div>
                <span className="relative">💡</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#444444]">関連する質問を生成中</span>
                <span className="text-xs px-2 py-1 rounded-md bg-[#F8F8F8] text-[#666666]">
                  {subQueries.length} 件
                </span>
              </div>
            </div>
          )}

          {/* サブクエリ一覧 */}
          {subQueries.length > 0 && (
            <div className="mt-4">
              <SubQueries queries={subQueries.map(query => ({ query }))} isLoading={isLoading} />
            </div>
          )}

          {/* パース結果の表示 */}
          {status === 'processing' && cozeResults && cozeResults.some(result => result.posts.length > 0) && (
            <div className="mt-4">
              <ParsedPosts results={cozeResults} />
            </div>
          )}

          {/* 回答生成中の表示 */}
          {status === 'generating' && (
            <div className="mt-4 flex items-center gap-3">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
                <span className="relative">✍️</span>
              </div>
              <div className="text-sm text-gray-600">
                回答を生成しています...
              </div>
            </div>
          )}

          {/* 検索結果の詳細表示（折りたたみ可能） */}
          {cozeResults && cozeResults.length > 0 && cozeResults.some(result => result.posts.length > 0) && (
            <div className="mt-6">
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <span>{isProcessExpanded ? '▼' : '▶'}</span>
                <span>検索結果の詳細を{isProcessExpanded ? '閉じる' : '表示'}</span>
              </button>
              
              {isProcessExpanded && (
                <div className="mt-4">
                  <PostList posts={cozeResults.flatMap(result => result.posts)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
