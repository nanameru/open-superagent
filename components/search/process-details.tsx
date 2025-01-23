'use client';

import { useEffect } from 'react';
import SubQueries from './sub-queries';
import PostList from './post-list';
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
  }, [status, cozeResults]);

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

      <div className={isProcessExpanded ? '' : 'hidden'}>
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

          {/* Xからの検索結果 */}
          {status === 'processing' && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
                  <span>🔍</span>
                </div>
                <span className="text-sm text-gray-600">Xから検索中...</span>
              </div>

              {/* 検索結果の表示 */}
              {cozeResults && cozeResults.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📊</span>
                    <span>
                      合計 {cozeResults.reduce((sum, result) => sum + (result.posts?.length || 0), 0)} 件の投稿を取得
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {cozeResults.flatMap((result, resultIndex) => 
                      (result.posts || []).map((post, postIndex) => (
                        <div 
                          key={`${resultIndex}-${postIndex}`}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {post.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 検索完了後の結果表示 */}
          {status !== 'processing' && cozeResults && cozeResults.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-4">
                <span>✅</span>
                <span className="text-sm text-gray-600">検索結果</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>📊</span>
                  <span>
                    合計 {cozeResults.reduce((sum, result) => sum + (result.posts?.length || 0), 0)} 件の投稿を取得
                  </span>
                </div>
                
                <div className="space-y-3">
                  {cozeResults.flatMap((result, resultIndex) => 
                    (result.posts || []).map((post, postIndex) => (
                      <div 
                        key={`${resultIndex}-${postIndex}`}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {post.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
