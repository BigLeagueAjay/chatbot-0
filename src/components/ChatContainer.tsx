import React from 'react'
import { cn } from '../lib/utils'

interface ChatContainerProps {
  children: React.ReactNode
  className?: string
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  return (
    <div className={cn(
      "flex flex-col h-screen max-h-screen bg-white dark:bg-gray-900",
      className
    )}>
      {children}
    </div>
  )
}