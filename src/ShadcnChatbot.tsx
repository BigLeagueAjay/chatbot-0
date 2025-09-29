import React, { useState, useRef, useEffect } from 'react'
import { ollamaService } from './services/ollamaService'
import { cn } from './lib/cn'
import { Button } from './components/ui/button'
import {
  Send,
  Loader2,
  Plus,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
}

export default function ShadcnChatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentModel, setCurrentModel] = useState('llama3:latest')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New chat',
      messages: [],
      timestamp: new Date()
    }
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
    setMessages([])
    setInput('')
  }

  const selectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages)
    }
  }

  const deleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null)
      setMessages([])
    }
  }

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    if (messages.length === 0 && currentConversationId) {
      const title = input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '')
      setConversations(prev => prev.map(c =>
        c.id === currentConversationId ? { ...c, title } : c
      ))
    }

    try {
      const history = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      let fullContent = ''
      const stream = ollamaService.streamMessage(userMessage.content, history)

      for await (const chunk of stream) {
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      setStreamingContent('')

      if (currentConversationId) {
        setConversations(prev => prev.map(c =>
          c.id === currentConversationId
            ? { ...c, messages: finalMessages }
            : c
        ))
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure Ollama is running and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const suggestions = [
    "Explain quantum computing",
    "Write a Python function",
    "Creative birthday ideas",
    "Healthy recipe suggestions"
  ]

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 border-b">
          <Button
            onClick={createNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-accent",
                  currentConversationId === conv.id && "bg-accent"
                )}
              >
                <Bot className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isDarkMode ? 'Dark' : 'Light'} Mode
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            Powered by Ollama
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">AI Assistant</span>
              <span className="text-xs text-muted-foreground">({currentModel})</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">How can I help you today?</h1>
                  <p className="text-muted-foreground">Start a conversation or try one of these suggestions</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                  {suggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start text-left h-auto p-4"
                      onClick={() => setInput(suggestion)}
                    >
                      <span className="line-clamp-2">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-32">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 group",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "relative max-w-[70%] rounded-2xl px-4 py-3",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <div className="absolute -bottom-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => copyMessage(msg.content, msg.id)}
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="relative max-w-[70%] rounded-2xl px-4 py-3 bg-muted">
                      <p className="whitespace-pre-wrap break-words">
                        {streamingContent}
                        <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>
                )}

                {isLoading && !streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="relative max-w-[70%] rounded-2xl px-4 py-3 bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-card p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message..."
                  disabled={isLoading}
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-xl border bg-background px-4 py-3 pr-12",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "placeholder:text-muted-foreground disabled:opacity-50",
                    "min-h-[52px] max-h-[200px]"
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              AI can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}