'use client';

import { useState } from 'react';

interface SourceListProps {
  sources: string[];
  compact?: boolean;
  onShowAll?: () => void;
}

export const SourceList = ({ sources, compact = false, onShowAll }: SourceListProps) => {
  const displaySources = compact ? sources.slice(0, 4) : sources;

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">参考文献一覧</h2>
      <div className="space-y-2">
        {displaySources.map((source, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="font-mono text-sm text-gray-500 mt-0.5">[{index + 1}]</span>
            <p className="text-sm text-gray-700">{source}</p>
          </div>
        ))}
      </div>
      {compact && sources.length > 4 && (
        <button
          onClick={onShowAll}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          Show all ({sources.length})
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}; 