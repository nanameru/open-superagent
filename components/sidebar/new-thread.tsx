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
          className="w-full flex items-center justify-between px-5 py-3 text-sm glassmorphism rounded-xl hover-effect group"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="flex items-center space-x-3">
            <Plus className="w-4 h-4 text-gray-700 group-hover:text-black" />
            <span className="font-medium">新規スレッド</span>
          </div>
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-black/5 group-hover:bg-black/10">
            <Command className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">K</span>
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
