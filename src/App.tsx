import React, { useState, useEffect } from 'react'
import { Chat } from './components/Chat'
import { useChat } from './hooks/useChat'
import './App.css'

function App() {
  console.log('App component rendering...')

  try {
    const [isDarkMode, setIsDarkMode] = useState(false)

    const {
      messages,
      input,
      handleInputChange,
      handleSubmit,
      isLoading,
      stop,
      append,
      clearMessages,
    } = useChat()

    useEffect(() => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }, [isDarkMode])

    const suggestions = [
      "📝 Help me write a professional email",
      "💡 Explain quantum computing in simple terms",
      "🌍 What are the latest developments in renewable energy?",
      "🎨 Generate creative ideas for a birthday party",
    ]

    return (
      <div className="h-screen">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isGenerating={isLoading}
          stop={stop}
          append={append}
          suggestions={suggestions}
          title="ChatBot Assistant"
          onNewChat={clearMessages}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in App component:', error)
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>ChatBot Loading...</h1>
        <p>If you see this message, please check the browser console for errors.</p>
        <p style={{ color: 'red' }}>Error: {error?.toString()}</p>
      </div>
    )
  }
}

export default App