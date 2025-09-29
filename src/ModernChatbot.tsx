import React, { useState, useRef, useEffect } from 'react'
import { ollamaService } from './services/ollamaService'
import SimpleMessageFormatter from './components/SimpleMessageFormatter'
import MemoryService from './services/memoryService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ModernChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollArrow, setShowScrollArrow] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const memoryService = useRef(new MemoryService({
    maxSessionMessages: 50,
    maxStoredConversations: 30,
    autoSave: true
  }))


  // Load session memory on mount
  useEffect(() => {
    const sessionMessages = memoryService.current.loadSessionMemory()
    if (sessionMessages.length > 0) {
      setMessages(sessionMessages)
    }
  }, [])

  // Save to session storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      memoryService.current.saveToSession(messages)

      // Auto-save to long-term storage after each exchange
      if (messages.length >= 2 && messages[messages.length - 1].role === 'assistant') {
        if (currentConversationId) {
          memoryService.current.saveConversation(messages, currentConversationId)
        }
      }
    }
  }, [messages, currentConversationId])

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Check if there's more content below viewport
  useEffect(() => {
    const checkScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const hasMoreContent = scrollHeight - scrollTop - clientHeight > 100
        setShowScrollArrow(hasMoreContent)
      }
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      checkScroll() // Check initially
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll)
      }
    }
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  // Auto-focus on mount and after sending messages
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading, messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build context with memory - include session context for continuity
      const contextMessages = memoryService.current.buildContext(messages, true)
      const history = contextMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      let fullContent = ''
      const stream = ollamaService.streamMessage(userMessage.content, history)

      for await (const chunk of stream) {
        fullContent += chunk
        // Just accumulate the content, don't display it yet
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure Ollama is running and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleScrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#343541',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif'
    }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #565869;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #6e7080;
        }


        .message-fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }



        textarea {
          scrollbar-width: thin;
          scrollbar-color: #565869 transparent;
        }
      `}</style>

      {/* Main Chat Area */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            maxWidth: '768px',
            width: '100%',
            padding: '0 20px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '34px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '40px'
            }}>
              ModBot
            </h1>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
              width: '100%',
              maxWidth: '600px'
            }}>
              {[
                'Explain quantum computing in simple terms',
                'Got any creative ideas for a 10 year old\'s birthday?',
                'How do I make an HTTP request in JavaScript?',
                'Help me write a story about a magic system'
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #565869',
                    backgroundColor: 'transparent',
                    color: '#c5c5d2',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#40414f'
                    e.currentTarget.style.borderColor = '#40414f'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#565869'
                  }}
                >
                  "{example}" →
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', paddingBottom: '120px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className="message-fade-in"
                style={{
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: '768px',
                  margin: '0 auto',
                  padding: '24px 20px',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: msg.role === 'user' ? '70%' : '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {msg.role === 'user' ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: '20px',
                        padding: '14px 20px',
                        boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                          pointerEvents: 'none'
                        }}></div>
                        <div style={{
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '15px',
                          fontWeight: '400',
                          color: '#ffffff',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          color: '#ececf1',
                          fontSize: '16px',
                          lineHeight: '1.75'
                        }}>
                          <SimpleMessageFormatter content={msg.content} />
                        </div>
                        <div style={{
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #565869',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#c5c5d2',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#40414f'
                              e.currentTarget.style.borderColor = '#40414f'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.borderColor = '#565869'
                            }}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleScrollToMessage(msg.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #565869',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#c5c5d2',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#40414f'
                              e.currentTarget.style.borderColor = '#40414f'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.borderColor = '#565869'
                            }}
                            title="Scroll to top of message"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="19" x2="12" y2="5"></line>
                              <polyline points="5 12 12 5 19 12"></polyline>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Scroll Arrow Indicator */}
      {showScrollArrow && (
        <div
          style={{
            position: 'absolute',
            bottom: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(52, 53, 65, 0.9)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid #565869',
            zIndex: 3,
            transition: 'opacity 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          onClick={() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              })
            }
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ececf1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(52, 53, 65, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid #565869',
        padding: '12px 0',
        zIndex: 2
      }}>
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: '768px',
            margin: '0 auto',
            padding: '0 20px'
          }}
        >
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            backgroundColor: '#40414f',
            borderRadius: '12px',
            border: '1px solid #565869',
            padding: '8px 8px 8px 16px',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)'
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: '#ececf1',
                fontSize: '15px',
                lineHeight: '24px',
                maxHeight: '200px',
                minHeight: '24px',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif',
                fontWeight: '400',
                padding: '4px 0'
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '8px',
                backgroundColor: isLoading || !input.trim() ? 'transparent' : '#19c37d',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !input.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                opacity: isLoading || !input.trim() ? 0.4 : 1
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isLoading || !input.trim() ? '#8e8ea0' : 'white'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#8e8ea0',
          marginTop: '8px'
        }}>
          ModBot can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}