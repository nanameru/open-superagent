'use client';

interface QueryItem {
  query: string;
  query_type?: string;
  query_text?: string;
}

interface SubQueriesProps {
  queries: QueryItem[];
  onSelect?: (query: string) => void;
  isLoading?: boolean;
}

export default function SubQueries({ queries, onSelect, isLoading }: SubQueriesProps) {
  console.log('[SubQueries] Received queries:', queries);

  if (!queries || queries.length === 0) {
    console.log('[SubQueries] No queries to display');
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {queries.map((queryItem, index) => {
          // Clean up the query string
          const queryText = queryItem.query_text || queryItem.query;
          const cleanQuery = queryText
            .replace(/```json\s*\[?\s*/g, '')
            .replace(/\s*\]?\s*```\s*$/, '')
            .replace(/[{}"\\]/g, '')
            .replace(/^\s*query:\s*/, '')
            .replace(/,\s*$/, '')
            .replace(/^\s*\[\s*/, '')
            .replace(/\s*\]\s*$/, '')
            .trim();
            
          if (!cleanQuery || cleanQuery === '[]') return null;

          // Extract language for styling
          const lang = cleanQuery.match(/lang:(ja|en|zh)/)?.[1] as 'ja' | 'en' | 'zh' | undefined;
          const langLabel = {
            ja: '🇯🇵',
            en: '🇺🇸',
            zh: '🇨🇳',
          };
          const flagEmoji = lang ? langLabel[lang] : '';

          // 表示用のテキストからパラメータを除去
          const displayText = cleanQuery
            .replace(/\s*lang:(ja|en|zh)\s*/g, ' ')
            .replace(/\s*min_faves:\d+\s*/g, ' ')
            .replace(/\s*since:\S+\s*/g, ' ')
            .replace(/\s*until:\S+\s*/g, ' ')
            .trim();
          
          return (
            <button
              key={index}
              onClick={() => onSelect?.(cleanQuery)}
              className="group relative w-full px-3 py-2 bg-black/[0.02] hover:bg-black/[0.04] rounded-lg text-sm text-gray-900 transition-all duration-200 text-left backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5">
                {flagEmoji && (
                  <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    {flagEmoji}
                  </span>
                )}
                <span className="flex-1 text-xs">{displayText}</span>
                <svg 
                  className="w-3.5 h-3.5 text-black/20 group-hover:text-black/40 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/[0.04] group-hover:ring-black/[0.08] transition-all duration-200" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
