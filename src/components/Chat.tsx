import React from 'react'
import { Message } from '../types/chat'
import { ChatContainer } from './ChatContainer'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { PromptSuggestions } from './PromptSuggestions'
import { cn } from '../lib/utils'

interface ChatProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isGenerating?: boolean
  stop?: () => void
  append?: (content: string) => void
  suggestions?: string[]
  title?: string
  onNewChat?: () => void
  onToggleSidebar?: () => void
  onToggleTheme?: () => void
  isDarkMode?: boolean
  className?: string
}

export function Chat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isGenerating,
  stop,
  append,
  suggestions = [],
  title,
  onNewChat,
  onToggleSidebar,
  onToggleTheme,
  isDarkMode,
  className
}: ChatProps) {
  const isEmpty = messages.length === 0
  const lastMessage = messages[messages.length - 1]
  const isTyping = isGenerating || (lastMessage?.role === 'user' && isGenerating)

  const handleSuggestionSelect = (suggestion: string) => {
    if (append) {
      append(suggestion)
    }
  }

  return (
    <ChatContainer className={className}>
      <ChatHeader
        title={title}
        onNewChat={onNewChat}
        onToggleSidebar={onToggleSidebar}
        onToggleTheme={onToggleTheme}
        isDarkMode={isDarkMode}
      />

      {isEmpty && suggestions.length > 0 ? (
        <PromptSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
        />
      ) : (
        <MessageList
          messages={messages}
          isTyping={isTyping}
        />
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            stop={stop}
            placeholder="Type your message..."
          />
        </div>
      </div>
    </ChatContainer>
  )
}