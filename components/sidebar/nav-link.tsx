import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
  external?: boolean
}

export default function NavLink({ href, icon: Icon, label, external }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-5 py-3 text-sm rounded-xl transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-gray-100 dark:bg-gray-800"
      )}
      {...linkProps}
    >
      <div className="flex items-center space-x-3">
        <Icon className={cn(
          "w-4 h-4",
          isActive 
            ? "text-gray-900 dark:text-white" 
            : "text-gray-700 dark:text-white"
        )} />
        <span className={cn(
          "font-medium",
          isActive 
            ? "text-gray-900 dark:text-white" 
            : "text-gray-700 dark:text-white"
        )}>
          {label}
        </span>
      </div>
    </Link>
  )
}
