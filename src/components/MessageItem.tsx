import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'prism-react-renderer'
import { User, Bot, Copy, Check, RotateCcw } from 'lucide-react'
import { Message } from '../types/chat'
import { cn } from '../lib/utils'
import { useState } from 'react'

interface MessageItemProps {
  message: Message
  onRetry?: (message: Message) => void
}

export function MessageItem({ message, onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      "flex gap-3 group",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser
          ? "bg-blue-600 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2 max-w-[80%] relative",
          isUser
            ? "bg-blue-600 text-white ml-auto"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose dark:prose-invert max-w-none"
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={{}}
                      customStyle={{
                        backgroundColor: 'transparent',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="text-xs bg-white/10 rounded px-2 py-1"
                >
                  📎 {attachment.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "justify-end" : "justify-start"
        )}>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
            title="Copy message"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {!isUser && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
              title="Retry"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <time className={cn(
          "text-xs text-gray-500",
          isUser ? "text-right block" : "text-left block"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </time>
      </div>
    </div>
  )
}