'use client';

interface QueryItem {
  query: string;
}

interface SubQueriesProps {
  queries: QueryItem[];
  onSelect: (query: string) => void;
}

export default function SubQueries({ queries, onSelect }: SubQueriesProps) {
  console.log('[SubQueries] Received queries:', queries);

  if (!queries || queries.length === 0) {
    console.log('[SubQueries] No queries to display');
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {queries.map((queryItem, index) => {
          // Clean up the query string
          const cleanQuery = queryItem.query
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
          
          return (
            <button
              key={index}
              onClick={() => onSelect(cleanQuery)}
              className="group relative w-full px-4 py-3 bg-black/[0.02] hover:bg-black/[0.04] rounded-xl text-sm text-gray-900 transition-all duration-200 text-left backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                {flagEmoji && (
                  <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    {flagEmoji}
                  </span>
                )}
                <span className="flex-1">{cleanQuery}</span>
                <svg 
                  className="w-4 h-4 text-black/20 group-hover:text-black/40 transition-colors" 
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
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.04] group-hover:ring-black/[0.08] transition-all duration-200" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
