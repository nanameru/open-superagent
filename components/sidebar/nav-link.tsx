import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
}

export default function NavLink({ href, icon: Icon, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center px-5 py-3 text-sm rounded-xl hover:bg-black/5 group transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-4 h-4 text-gray-700 group-hover:text-black" />
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  )
}
