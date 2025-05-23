'use client';

interface Source {
  title: string;
  url: string;
  content: string;
  source_title?: string;
}

interface SourcePreviewProps {
  sources: Source[];
  onShowAll?: () => void;
}

export const SourcePreview = ({ sources, onShowAll }: SourcePreviewProps) => {
  // User Queryを完全に除外した実際の参考文献のみを取得
  const filteredSources = sources.filter(source => 
    !source.title.includes('User Query')
  );
  const previewSources = filteredSources.slice(0, 4);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">参考文献</h2>
        {filteredSources.length > 4 && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
          >
            <span>すべて表示</span>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(4, filteredSources.length - 4) }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-6 h-6 rounded-full bg-black flex items-center justify-center ring-2 ring-white"
                >
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              ))}
              {filteredSources.length > 8 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                  <span className="text-xs text-gray-600">+{filteredSources.length - 8}</span>
                </div>
              )}
            </div>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {previewSources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="h-full p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 hover:bg-gray-100">
              <div className="flex items-start gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-mono text-sm">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
                    {source.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3 break-words">
                    {source.content}
                  </p>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};