import React from 'react'

interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
}

export function ScrollArea({ children, className = '' }: ScrollAreaProps) {
  return (
    <div className={`relative overflow-auto ${className}`}>
      {children}
    </div>
  )
}

interface ScrollBarProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function ScrollBar({ orientation = 'vertical', className = '' }: ScrollBarProps) {
  return (
    <div
      className={`absolute ${
        orientation === 'vertical'
          ? 'right-0 top-0 h-full w-2'
          : 'bottom-0 left-0 h-2 w-full'
      } flex touch-none select-none ${className}`}
    >
      <div className="relative flex-1 rounded-full bg-border"></div>
    </div>
  )
}
