import React, { useEffect, useRef } from 'react'
import { Message } from '../types/chat'
import { MessageItem } from './MessageItem'
import { cn } from '../lib/utils'

interface MessageListProps {
  messages: Message[]
  isTyping?: boolean
  className?: string
}

export function MessageList({ messages, isTyping, className }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={cn(
      "flex-1 overflow-y-auto px-4 py-8",
      className
    )}>
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <span className="animate-bounce animation-delay-0">●</span>
              <span className="animate-bounce animation-delay-200">●</span>
              <span className="animate-bounce animation-delay-400">●</span>
            </div>
            <span className="text-sm">Assistant is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}