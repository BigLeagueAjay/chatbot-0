import React, { useState, useRef, useEffect } from 'react'
import { ollamaService } from './services/ollamaService'

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

export default function ChatGPTClone() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentModel, setCurrentModel] = useState('llama3:latest')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
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

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null)
      setMessages([])
    }
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

    // Update conversation title if it's the first message
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

      // Update conversation
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .cursor-blink {
          animation: blink 1s infinite;
        }

        .message-appear {
          animation: messageAppear 0.3s ease-out;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hover-button {
          transition: background-color 0.2s;
        }
      `}</style>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-white">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors ${
                  currentConversationId === conversation.id ? 'bg-gray-800' : ''
                }`}
                onClick={() => selectConversation(conversation.id)}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                </svg>
                <span className="flex-1 text-sm text-gray-300 truncate">
                  {conversation.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm text-white">U</span>
            </div>
            <span className="text-sm text-gray-300">User</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold">ChatGPT (Ollama - {currentModel})</span>
          </div>
          <button
            onClick={createNewChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <h1 className="text-3xl font-semibold mb-8">How can I help you today?</h1>
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {[
                      "Explain quantum computing in simple terms",
                      "Got any creative ideas for a 10 year old's birthday?",
                      "How do I make an HTTP request in Javascript?",
                      "What are the key differences between Python and JavaScript?"
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(prompt)}
                        className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-32">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-appear py-8 px-4 ${
                      msg.role === 'assistant' ? 'bg-gray-50 dark:bg-gray-800' : ''
                    }`}
                  >
                    <div className="max-w-3xl mx-auto flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}>
                          {msg.role === 'user' ? 'U' : 'AI'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === 'assistant' && (
                          <div className="mt-4 flex gap-2">
                            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>
                            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {streamingContent && (
                  <div className="message-appear py-8 px-4 bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-3xl mx-auto flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-sm flex items-center justify-center">
                          AI
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap">
                            {streamingContent}
                            <span className="inline-block w-2 h-5 bg-gray-900 dark:bg-gray-100 ml-1 cursor-blink"></span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 pt-6 pb-6">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4">
            <div className="relative flex items-end bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none outline-none p-4 pr-12 bg-transparent max-h-52 overflow-y-auto"
                style={{ minHeight: '56px' }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`absolute right-2 bottom-3 p-2 rounded-lg transition-colors ${
                  isLoading || !input.trim()
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 ${
                    isLoading || !input.trim()
                      ? 'text-gray-400'
                      : 'text-white dark:text-gray-900'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-center mt-2 text-gray-500">
              Powered by Ollama • Model: {currentModel}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}