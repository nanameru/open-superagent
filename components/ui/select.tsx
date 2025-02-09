'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
  show?: boolean
}

interface SelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
  onClick?: () => void
}

interface SelectValueProps {
  children?: React.ReactNode
  className?: string
  placeholder?: string
}

export function Select({ value, onValueChange, children, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
            value,
            onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({ children, className = '', onClick }: SelectTriggerProps) {
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={onClick}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectContent({ children, className = '', show = false }: SelectContentProps) {
  if (!show) return null

  return (
    <div className={`absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className}`}>
      {children}
    </div>
  )
}

export function SelectItem({ children, value, className = '', onClick }: SelectItemProps) {
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`}
      onClick={onClick}
      data-value={value}
    >
      {children}
    </div>
  )
}

export function SelectValue({ children, className = '', placeholder }: SelectValueProps) {
  return <span className={className}>{children || placeholder}</span>
}
