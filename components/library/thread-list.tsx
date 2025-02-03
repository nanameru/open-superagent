'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Summary {
  id: string
  content: string
  created_at: string
}

interface Query {
  id: string
  query_title: string | null
  query_text: string
  created_at: string
  summary: Summary
}

interface ThreadListProps {
  initialQueries: Query[]
  searchTerm: string
}

export default function ThreadList({ initialQueries, searchTerm }: ThreadListProps) {
  const [queries] = useState(initialQueries)
  const router = useRouter()

  const filteredQueries = useMemo(() => {
    if (!searchTerm) return queries
    
    const lowerSearchTerm = searchTerm.toLowerCase()
    return queries.filter(query => 
      query.query_text.toLowerCase().includes(lowerSearchTerm) ||
      query.summary.content.toLowerCase().includes(lowerSearchTerm)
    )
  }, [queries, searchTerm])

  const handleQueryClick = (queryText: string) => {
    const encodedQuery = encodeURIComponent(queryText)
    router.push(`/search/new?q=${encodedQuery}`)
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'たった今'
    }
    
    const minutes = Math.floor(diffInSeconds / 60)
    if (minutes < 60) {
      return `${minutes}分前`
    }
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours}時間前`
    }
    
    const days = Math.floor(hours / 24)
    if (days < 7) {
      return `${days}日前`
    }
    
    if (days < 30) {
      return `${Math.floor(days / 7)}週間前`
    }
    
    const months = Math.floor(days / 30)
    if (months < 12) {
      return `${months}ヶ月前`
    }
    
    const years = Math.floor(months / 12)
    return `${years}年前`
  }

  return (
    <div className="space-y-4">
      {filteredQueries.length === 0 ? (
        <div className="text-gray-500 p-4">
          {searchTerm ? '検索結果が見つかりません' : '検索履歴がありません'}
        </div>
      ) : (
        filteredQueries.map((query) => (
          <div
            key={query.id}
            onClick={() => handleQueryClick(query.query_text)}
            className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
          >
            <div className="space-y-1">
              <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-black">
                {query.query_text}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {query.summary.content}
              </p>
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-400">
              <span>{formatRelativeTime(query.created_at)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
