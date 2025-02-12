'use client';

import { Search, ArrowRight, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function FooterInput() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    const encodedQuery = encodeURIComponent(value.trim());
    router.push(`/search/new?q=${encodedQuery}`);
    setValue('');
  };

  // Command + Kでフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('#footer-search-input');
        input?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative group">
        <div 
          className={`relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border ${
            isFocused 
              ? 'border-gray-400 dark:border-gray-500 shadow-lg ring-1 ring-gray-200 dark:ring-gray-800' 
              : 'border-gray-200 dark:border-gray-800 shadow-md'
          } transition-all duration-200 ease-in-out transform ${
            isFocused ? 'scale-[1.01]' : 'hover:scale-[1.005]'
          }`}
        >
          <div className="flex items-center">
            <div className="pl-4">
              <Search className={`w-5 h-5 transition-colors duration-200 ${
                isFocused ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
              }`} />
            </div>
            <input
              id="footer-search-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask follow-up"
              className="w-full py-4 pl-3 pr-32 text-base bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <Command className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">K</span>
              </div>
              <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg bg-black dark:bg-white group-hover:pr-3 transition-all">
                <span className="text-xs font-semibold text-white dark:text-black">Pro</span>
                <ArrowRight className="w-3.5 h-3.5 text-white dark:text-black transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-0 transition duration-500" style={{ zIndex: -1 }} />
      </div>
    </form>
  );
}
