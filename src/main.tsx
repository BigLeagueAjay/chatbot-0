import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ModernChatbot from './ModernChatbot.tsx'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ModernChatbot />
    </StrictMode>,
  )
}
