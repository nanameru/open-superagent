import Link from 'next/link'
import { Command } from 'lucide-react'
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
      className="flex items-center justify-between px-5 py-3 text-sm rounded-xl hover:bg-black/5 group transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-4 h-4 text-gray-700 group-hover:text-black" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Command className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </Link>
  )
}
