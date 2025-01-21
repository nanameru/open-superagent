'use client';

import { Command, Sparkles } from 'lucide-react';

export default function SearchActions() {
  return (
    <div className="absolute right-3 top-[14px] flex items-center space-x-3">
      <button className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-black/5 hover:bg-black/10 transition-colors button-effect">
        <Command className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-xs font-medium text-gray-600">K</span>
      </button>
      <span className="text-gray-300 text-sm">|</span>
      <button className="text-sm text-gray-500 hover:text-gray-900 flex items-center space-x-1.5 button-effect">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">Focus</span>
      </button>
    </div>
  );
}
