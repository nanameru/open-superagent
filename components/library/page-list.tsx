'use client'

import { MoreHorizontal, Plus } from 'lucide-react'

const pages = [
  {
    id: 1,
    title: 'AIの最新トレンド分析',
    excerpt: '2025年のAI業界における主要なトレンドと、それらが各産業に与える影響について詳しく分析しています。',
    date: '2 days ago'
  },
  {
    id: 2,
    title: '効率的な文字数削減テクニック',
    excerpt: '日本語の文章を効率的に短縮する方法と、その実践的な適用例をまとめています。',
    date: '4 days ago'
  }
]

export default function PageList() {
  return (
    <div className="space-y-4">
      {pages.map((page) => (
        <div
          key={page.id}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-black">
                {page.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {page.excerpt}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-400">
            <span>{page.date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
