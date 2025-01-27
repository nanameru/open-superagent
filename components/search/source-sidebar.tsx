'use client';

import { SourceList } from './source-list';

interface SourceSidebarProps {
  sources: string[];
  isVisible: boolean;
  onClose: () => void;
}

export const SourceSidebar = ({ sources, isVisible, onClose }: SourceSidebarProps) => {
  if (!isVisible) return null;

  return (
    <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">全ての参考文献</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <SourceList sources={sources} />
    </div>
  );
}; 