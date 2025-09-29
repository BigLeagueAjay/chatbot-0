import React, { useRef, useEffect, useState } from 'react'
import { Send, Paperclip, X, Square } from 'lucide-react'
import { cn } from '../lib/utils'
import { Attachment } from '../types/chat'

interface MessageInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isGenerating?: boolean
  stop?: () => void
  placeholder?: string
  allowAttachments?: boolean
  className?: string
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  isGenerating,
  stop,
  placeholder = "Type a message...",
  allowAttachments = true,
  className
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
    }))

    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative", className)}>
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300">
                📎 {attachment.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
              title="Attach files"
            >
              <Paperclip size={20} />
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isGenerating}
          className={cn(
            "flex-1 resize-none outline-none bg-transparent",
            "text-gray-900 dark:text-gray-100",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "min-h-[24px] max-h-[200px]",
            "disabled:opacity-50"
          )}
          rows={1}
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={stop}
            className="text-white bg-red-600 hover:bg-red-700 rounded-lg p-2"
            title="Stop generating"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim() || isGenerating}
            className={cn(
              "text-white rounded-lg p-2 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              value.trim()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </form>
  )
}