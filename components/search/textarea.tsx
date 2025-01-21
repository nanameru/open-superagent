'use client';

import { Search } from 'lucide-react';

export default function SearchTextarea() {
  return (
    <div className="relative">
      <textarea
        placeholder="Ask anything..."
        rows={1}
        className="w-full py-4 px-4 pl-12 text-base text-gray-900 dark:text-gray-100 bg-transparent rounded-xl resize-none h-[52px] outline-none focus:outline-none focus:ring-0 border-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />
      <Search className="absolute left-4 top-[18px] text-gray-400 dark:text-gray-500 w-4 h-4 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400" />
    </div>
  );
}
