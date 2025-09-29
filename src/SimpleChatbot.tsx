import React, { useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function SimpleChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `You said: "${input}". This is a demo response!`
    }

    setMessages(prev => [...prev, userMessage, botMessage])
    setInput('')
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
        backgroundColor: '#2563eb',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        🤖 Simple Chatbot
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '2rem'
          }}>
            <h2>Welcome to Simple Chatbot!</h2>
            <p>Type a message below to start chatting</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: msg.role === 'user' ? '#2563eb' : '#e5e5e5',
                color: msg.role === 'user' ? 'white' : 'black'
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderTop: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}