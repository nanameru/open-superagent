'use client';

interface SourcePreviewProps {
  sources: string[];
  onShowAll?: () => void;
}

export const SourcePreview = ({ sources, onShowAll }: SourcePreviewProps) => {
  const previewSources = sources.slice(0, 4);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">参考文献</h2>
        {sources.length > 4 && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Show all
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(5, sources.length) }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-black flex items-center justify-center ring-2 ring-white">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              ))}
              {sources.length > 5 && (
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                  <span className="text-xs text-gray-600">+{sources.length - 5}</span>
                </div>
              )}
            </div>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {previewSources.map((source, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-sm text-gray-500">[{index + 1}]</span>
              <p className="text-sm text-gray-700 line-clamp-3">{source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 