'use client';

import { useEffect } from 'react';
import SubQueries from './sub-queries';

interface ProcessDetailsProps {
  query: string;
  status: 'understanding' | 'thinking' | 'generating' | 'completed';
  subQueries: string[];
  isLoading: boolean;
  isProcessExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ProcessDetails({ 
  query, 
  status, 
  subQueries, 
  isLoading,
  isProcessExpanded,
  onToggleExpand 
}: ProcessDetailsProps) {
  useEffect(() => {
    // 回答生成完了時にプロセス詳細を閉じる
    if (status === 'completed' && isProcessExpanded) {
      onToggleExpand();
    }
  }, [status, onToggleExpand, isProcessExpanded]);

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

          {/* Sub queries */}
          {status !== 'understanding' && status !== 'thinking' && (
            <SubQueries queries={subQueries.map(query => ({ query }))} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
