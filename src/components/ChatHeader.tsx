import React from 'react'
import { Menu, Plus, Settings, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatHeaderProps {
  title?: string
  onNewChat?: () => void
  onToggleSidebar?: () => void
  onToggleTheme?: () => void
  isDarkMode?: boolean
  className?: string
}

export function ChatHeader({
  title = "AI Assistant",
  onNewChat,
  onToggleSidebar,
  onToggleTheme,
  isDarkMode = false,
  className
}: ChatHeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between px-4 py-3",
      "border-b border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-800",
      className
    )}>
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Toggle sidebar"
          >
            <Menu size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="New chat"
          >
            <Plus size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>
        )}

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Settings"
        >
          <Settings size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </header>
  )
}