import { Home, BookOpen } from 'lucide-react'
import NavLink from './nav-link'

const navItems = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/library', icon: BookOpen, label: '検索履歴' },
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
