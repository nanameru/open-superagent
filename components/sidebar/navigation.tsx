import { Home, Compass, FolderOpen, BookOpen } from 'lucide-react'
import NavLink from './nav-link'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/spaces', icon: FolderOpen, label: 'Spaces' },
  { href: '/library', icon: BookOpen, label: 'Library' },
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
