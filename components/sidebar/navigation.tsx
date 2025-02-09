import { Home, BookOpen, Library, Users } from 'lucide-react'
import NavLink from './nav-link'

const navItems = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/library', icon: BookOpen, label: '検索履歴' },
  { href: '/ai-library', icon: Library, label: 'AI図書館' },
  { href: 'https://discord.com/invite/cKFVSJdy', icon: Users, label: 'コミュニティ', external: true },
]

export default function Navigation() {
  return (
    <nav className="mt-8 flex-1 px-4">
      <div className="space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  )
}
