'use client'

import { Search } from 'lucide-react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThreadList from '@/components/library/thread-list'
import SearchBar from '@/components/library/search-bar'
import { createClient } from '@/utils/supabase/client'

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [queries, setQueries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('Auth error:', userError)
          redirect('/login')
          return
        }

        const { data: queriesData, error: queriesError } = await supabase
          .from('queries')
          .select(`
            id,
            query_text,
            query_type,
            created_at,
            summaries (
              id,
              summary_text,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('query_type', 'user')
          .is('parent_query_id', null)
          .order('created_at', { ascending: false })

        if (queriesError) {
          console.error('Error fetching queries:', queriesError)
          return
        }

        // サマリーが存在するクエリのみをフィルタリング＆整形
        const formattedQueries = (queriesData || [])
          .filter(query => query.summaries && query.summaries.length > 0)
          .map(query => ({
            id: query.id,
            query_title: null,
            query_text: query.query_text,
            created_at: query.created_at,
            summary: {
              id: query.summaries[0].id,
              content: query.summaries[0].summary_text,
              created_at: query.summaries[0].created_at
            }
          }))

        setQueries(formattedQueries)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <span className="text-gray-900">検索履歴</span>
          </h1>
          <div className="w-[400px]">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
        <div className="text-gray-500 p-4">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          <span className="text-gray-900">検索履歴</span>
        </h1>
        <div className="w-[400px]">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
      <ThreadList initialQueries={queries} searchTerm={searchTerm} />
    </div>
  )
}
