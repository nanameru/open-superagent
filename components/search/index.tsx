'use client';

import SearchTextarea from './textarea';
import SearchActions from './actions';

export default function SearchInput() {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-400/20 via-fuchsia-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
      <div className="relative bg-white dark:bg-black rounded-xl shadow-2xl shadow-black/5 ring-1 ring-slate-700/5">
        <SearchTextarea />
        <SearchActions />
      </div>
    </div>
  );
}
