'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAdmin(false)
          setIsLoading(false)
          router.push('/')
          return
        }

        // ユーザーのadmin権限を確認
        const { data: userData, error } = await supabase
          .from('users')
          .select('admin')
          .eq('id', user.id)
          .single()

        if (error || !userData) {
          setIsAdmin(false)
          setIsLoading(false)
          router.push('/')
          return
        }

        setIsAdmin(userData.admin)
        setIsLoading(false)

        // 管理者でない場合はホームにリダイレクト
        if (!userData.admin) {
          router.push('/')
        }
      } catch (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        setIsLoading(false)
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [router])

  return { isAdmin, isLoading }
}
