'use client'

import { useState } from 'react'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import Logo from './logo'
import NewThread from './new-thread'
import Navigation from './navigation'
import AuthButtons from './auth-buttons'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const CollapseButton = () => (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className={cn(
        "p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors",
        "flex items-center justify-center"
      )}
    >
      {isCollapsed ? (
        <PanelLeft className="w-5 h-5" />
      ) : (
        <PanelLeftClose className="w-5 h-5" />
      )}
    </button>
  )

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full",
      isCollapsed ? 'w-[64px]' : 'w-[280px]',
      "bg-[#f9f9f9] dark:bg-[#000000] z-50 flex flex-col transition-all duration-300"
    )}>
      <div className="flex-none">
        {isCollapsed ? (
          <Logo isCollapsed={isCollapsed} />
        ) : (
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <Logo isCollapsed={isCollapsed} />
            </div>
            <CollapseButton />
          </div>
        )}
      </div>

      <div className="flex-1">
        {!isCollapsed && <NewThread />}
        <Navigation isCollapsed={isCollapsed} />
      </div>

      <div className={cn(
        "flex-none border-t border-gray-200 dark:border-gray-800",
        "transition-opacity duration-300"
      )}>
        <AuthButtons isCollapsed={isCollapsed} />
        {isCollapsed && (
          <div className="p-4 flex justify-center">
            <CollapseButton />
          </div>
        )}
      </div>
    </div>
  )
}
