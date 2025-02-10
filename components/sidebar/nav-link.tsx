import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
  external?: boolean
  isCollapsed?: boolean
}

export default function NavLink({ href, icon: Icon, label, external, isCollapsed }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center transition-colors",
        isCollapsed ? "justify-center px-2 py-3" : "px-5 py-3",
        "text-sm rounded-xl",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-gray-100 dark:bg-gray-800"
      )}
      {...linkProps}
    >
      <div className={cn(
        "flex items-center",
        !isCollapsed && "space-x-3"
      )}>
        <Icon className={cn(
          isCollapsed ? "w-5 h-5" : "w-4 h-4",
          isActive 
            ? "text-gray-900 dark:text-white" 
            : "text-gray-700 dark:text-white"
        )} />
        {!isCollapsed && (
          <span className={cn(
            "font-medium",
            isActive 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-700 dark:text-white"
          )}>
            {label}
          </span>
        )}
      </div>
    </Link>
  )
}
