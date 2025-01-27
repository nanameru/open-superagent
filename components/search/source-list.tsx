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
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>Show all</span>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(5, sources.length) }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-600" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              ))}
              {sources.length > 5 && (
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                  <span className="text-xs text-gray-600">+{sources.length - 5}</span>
                </div>
              )}
            </div>
            <span className="text-gray-500">({sources.length})</span>
          </div>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}; 