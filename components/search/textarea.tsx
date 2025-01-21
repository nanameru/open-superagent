'use client';

import { Search } from 'lucide-react';

export default function SearchTextarea() {
  return (
    <div className="relative">
      <textarea
        placeholder="Ask anything..."
        rows={1}
        className="w-full py-4 px-4 pl-11 text-base rounded-lg glassmorphism resize-none h-[52px] outline-none focus:outline-none focus:ring-0 border-none"
      />
      <Search className="absolute left-4 top-[18px] text-gray-400 w-4 h-4" />
    </div>
  );
}
