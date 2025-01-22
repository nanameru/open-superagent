'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateSubQueries } from '@/utils/deepseek';
import SubQueries from '@/components/search/sub-queries';
import GeneratedAnswer from '@/components/search/generated-answer';

export default function SearchNewPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>('');
  const [subQueries, setSubQueries] = useState<Array<{ query: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'understanding' | 'thinking' | 'generating' | 'completed'>('understanding');
  const [isProcessExpanded, setIsProcessExpanded] = useState(true);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      setIsLoading(true);
      setStatus('understanding');
      
      setTimeout(() => {
        setStatus('thinking');
        setTimeout(() => {
          generateSubQueries(searchQuery)
            .then((response) => {
              const formattedQueries = response.map(query => ({ query }));
              setSubQueries(formattedQueries);
              setStatus('generating');
              setTimeout(() => {
                setStatus('completed');
              }, 1000);
            })
            .catch((error) => {
              console.error('Error generating sub-queries:', error);
              setSubQueries([]);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }, 1000);
      }, 1000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'completed') {
      setIsProcessExpanded(false);
    }
  }, [status]);

  const statusSteps = [
    { key: 'understanding', icon: '💭', label: '理解' },
    { key: 'thinking', icon: '💡', label: '分析' },
    { key: 'generating', icon: '✍️', label: '生成' },
    { key: 'completed', icon: '✨', label: '完了' }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === status);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-900/10 blur-md opacity-20"></div>
              <span className="relative bg-gray-900/10 text-gray-900 px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-wide border border-gray-900/20">
                Pro Search
              </span>
            </div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              {query}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600">
              <span className="w-1 h-1 rounded-full bg-gray-900"></span>
              {subQueries.length}ソース
            </span>
            <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600">
              <span className="w-1 h-1 rounded-full bg-gray-900"></span>
              3言語
            </span>
          </div>
        </div>

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
                  <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                    <div className="flex items-center gap-3">
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
                          {subQueries.length} 件
                        </span>
                      </div>
                      <SubQueries queries={subQueries} isLoading={isLoading} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`transition-all duration-500 ${status === 'generating' ? 'opacity-100' : status === 'understanding' || status === 'thinking' ? 'opacity-0 translate-y-4' : 'opacity-60'}`}>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
                    <div className="flex items-center justify-between">
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
        <div 
          className={`
            transition-all duration-700 ease-out transform
            ${status === 'completed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div className="relative bg-white rounded-xl p-4 backdrop-blur-sm border border-[#EEEEEE]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#444444]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-black">回答を生成しました</span>
                </div>
              </div>
              <GeneratedAnswer isCompleted={status === 'completed'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
