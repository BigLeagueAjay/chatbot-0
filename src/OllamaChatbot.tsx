import React, { useState, useRef, useEffect } from 'react'
import { ollamaService } from './services/ollamaService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function OllamaChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentModel, setCurrentModel] = useState('llama3:latest')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Load available models
    ollamaService.listModels().then(models => {
      setAvailableModels(models)
      if (models.length > 0 && !models.includes(currentModel)) {
        setCurrentModel(models[0])
        ollamaService.setModel(models[0])
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

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
    setStreamingContent('')

    try {
      // Create message history for context
      const history = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      // Stream the response
      let fullContent = ''
      const stream = ollamaService.streamMessage(userMessage.content, history)

      for await (const chunk of stream) {
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      // Add complete message to history
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingContent('')
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

  const handleModelChange = (model: string) => {
    setCurrentModel(model)
    ollamaService.setModel(model)
  }

  const clearChat = () => {
    setMessages([])
    setStreamingContent('')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#1e293b',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          🤖 Ollama Chatbot
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={currentModel}
            onChange={(e) => handleModelChange(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: '#334155',
              color: 'white',
              border: '1px solid #475569'
            }}
          >
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <button
            onClick={clearChat}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.length === 0 && !streamingContent ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            margin: 'auto'
          }}>
            <h2>Welcome to Ollama Chatbot!</h2>
            <p>Using model: <strong>{currentModel}</strong></p>
            <p>Type a message below to start chatting with your local AI</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: msg.role === 'user' ? '#3b82f6' : '#10b981',
                    color: 'white',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div>
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: msg.role === 'user' ? '#3b82f6' : 'white',
                      color: msg.role === 'user' ? 'white' : '#1f2937',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.content}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      marginTop: '0.25rem'
                    }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#1f2937',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {streamingContent}
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '16px',
                      backgroundColor: '#3b82f6',
                      marginLeft: '2px',
                      animation: 'blink 1s infinite'
                    }} />
                  </div>
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <span>Thinking</span>
                  <span style={{ display: 'flex', gap: '2px' }}>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}>.</span>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}>.</span>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out both' }}>.</span>
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              backgroundColor: isLoading ? '#f9fafb' : 'white'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: isLoading || !input.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}