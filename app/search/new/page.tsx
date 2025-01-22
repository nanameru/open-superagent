'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateSubQueries } from '@/utils/deepseek';
import SubQueries from '@/components/search/sub-queries';

export default function SearchNewPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>('');
  const [subQueries, setSubQueries] = useState<Array<{ query: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      setIsLoading(true);
      
      generateSubQueries(searchQuery)
        .then((response) => {
          // Transform string[] into Array<{ query: string }>
          const formattedQueries = response.map(query => ({ query }));
          setSubQueries(formattedQueries);
        })
        .catch((error) => {
          console.error('Error generating sub-queries:', error);
          setSubQueries([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight">{query}</h1>
        
        <div className="flex gap-6 mb-8 text-sm font-medium text-gray-600">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Web検索
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {subQueries.length}のソース
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            3言語
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Felo Reasoning
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_0_1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3 mb-8">
            <span className="flex items-center bg-black/[0.02] px-4 py-2 rounded-lg">
              <span className="text-gray-900 text-xl font-bold mr-1">Q</span>
              <span className="text-gray-900 font-bold">Pro</span>
              <span className="ml-1 font-medium">Search</span>
            </span>
            <span className="bg-black/[0.05] text-gray-900 text-xs px-2 py-1 rounded-md font-semibold">Beta</span>
            <span className="text-gray-600 font-medium">ディープサーチ</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-6 bg-black/[0.02] rounded-xl backdrop-blur-sm">
              <span className="mt-1 text-xl">💭</span>
              <div>
                <div className="font-semibold mb-2 text-gray-900">問題を理解する</div>
                <div className="text-gray-600">Web検索 "{query}"</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-black/[0.02] rounded-xl backdrop-blur-sm">
              <span className="mt-1 text-xl">💡</span>
              <div className="w-full">
                <div className="font-semibold mb-2 text-gray-900">質問を考えています</div>
                <div className="text-gray-600 mb-4">
                  {subQueries.length} 個のサブクエリに分解され、{subQueries.length} のソースが見つかり、3 言語
                </div>
                <div className="space-y-4">
                  <div className="text-gray-900 font-medium">最新のAIに関するニュースや情報を検索する。</div>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-black/20 border-t-black"></div>
                    </div>
                  ) : (
                    subQueries.length > 0 && (
                      <SubQueries 
                        queries={subQueries} 
                        onSelect={(selectedQuery) => {
                          const searchParams = new URLSearchParams(window.location.search);
                          searchParams.set('q', selectedQuery);
                          window.location.search = searchParams.toString();
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-black/[0.02] rounded-xl backdrop-blur-sm">
              <span className="mt-1 text-xl">✓</span>
              <div>
                <div className="font-semibold mb-2 text-gray-900">回答完了</div>
                <div className="text-gray-600">ソースを翻訳し、回答を生成</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
