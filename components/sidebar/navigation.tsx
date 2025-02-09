'use client'

import { useState, useEffect } from 'react'
import { Home, BookOpen, Library, Users, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import NavLink from './nav-link'

export default function Navigation() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('admin')
          .eq('id', user.id)
          .single()

        setIsAdmin(userData?.admin || false)
      }
    }

    checkAdminStatus()
  }, [])

  const baseNavItems = [
    { href: '/', icon: Home, label: 'ホーム' },
    { href: '/library', icon: BookOpen, label: '検索履歴' },
    { href: 'https://discord.com/invite/cKFVSJdy', icon: Users, label: 'コミュニティ', external: true },
  ]

  const adminNavItems = [
    { href: '/ai-library', icon: Library, label: 'AI図書館' },
    { href: '/admin', icon: Settings, label: '管理者' },
  ]

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems

  return (
    <nav className="mt-8 flex-1 px-4 space-y-2">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  )
}
