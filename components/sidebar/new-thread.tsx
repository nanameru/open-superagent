'use client'

import { Plus, Command } from 'lucide-react'
import { useState, useEffect } from 'react'
import SearchDialog from '../search/search-dialog'

export default function NewThread() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsDialogOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className="px-4 mt-2">
        <button 
          className="w-full flex items-center justify-between px-5 py-3 text-sm bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="flex items-center space-x-3">
            <Plus className="w-4 h-4 text-gray-900 dark:text-white" />
            <span className="font-medium text-gray-900 dark:text-white">新規スレッド</span>
          </div>
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <Command className="w-3.5 h-3.5 text-gray-600 dark:text-white" />
            <span className="text-xs font-medium text-gray-600 dark:text-white">K</span>
          </div>
        </button>
      </div>
      <SearchDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}
