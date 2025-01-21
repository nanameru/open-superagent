'use client';

import SearchTextarea from './textarea';
import SearchActions from './actions';

export default function SearchInput() {
  return (
    <div className="relative group w-full max-w-xl mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-lg blur-md opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative">
        <SearchTextarea />
        <SearchActions />
      </div>
    </div>
  );
}
