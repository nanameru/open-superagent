import { Plus, Command } from 'lucide-react'

export default function NewThread() {
  return (
    <div className="px-4 mt-2">
      <button className="w-full flex items-center justify-between px-5 py-3 text-sm glassmorphism rounded-xl hover-effect group">
        <div className="flex items-center space-x-3">
          <Plus className="w-4 h-4 text-gray-700 group-hover:text-black" />
          <span className="font-medium">New Thread</span>
        </div>
        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-black/5 group-hover:bg-black/10">
          <Command className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">N</span>
        </div>
      </button>
    </div>
  )
}
