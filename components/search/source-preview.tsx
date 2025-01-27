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
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(6, sources.length) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs"
                />
              ))}
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