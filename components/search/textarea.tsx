'use client';

import { Search } from 'lucide-react';

export default function SearchTextarea() {
  return (
    <div className="relative">
      <textarea
        placeholder="Ask anything..."
        rows={1}
        className="w-full py-3.5 px-4 pl-11 text-base rounded-lg glassmorphism input-focus-ring hover-effect resize-none overflow-hidden"
        style={{ minHeight: '44px' }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
        }}
      />
      <Search className="absolute left-4 top-[14px] text-gray-400 w-4 h-4" />
    </div>
  );
}
