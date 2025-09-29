import React from 'react'
import { cn } from '../lib/utils'
import { Sparkles } from 'lucide-react'

interface PromptSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function PromptSuggestions({ suggestions, onSelect, className }: PromptSuggestionsProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center flex-1 p-8",
      className
    )}>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          How can I help you today?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a suggestion or type your own message
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className={cn(
              "text-left p-4 rounded-lg border transition-all",
              "border-gray-200 dark:border-gray-700",
              "hover:border-blue-500 hover:shadow-md",
              "bg-white dark:bg-gray-800"
            )}
          >
            <p className="text-gray-900 dark:text-gray-100">
              {suggestion}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}