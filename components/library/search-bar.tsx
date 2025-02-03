'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (searchTerm: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded-md border border-gray-200">
          ⌘K
        </kbd>
      </div>
      <input
        type="text"
        placeholder="検索履歴を検索 (⌘K)"
        onChange={handleChange}
        className="w-full pl-10 pr-16 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm 
        placeholder:text-gray-400
        transition-all duration-200
        focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400
        hover:border-gray-300 hover:bg-white
        group-hover:shadow-sm"
      />
    </div>
  )
}
