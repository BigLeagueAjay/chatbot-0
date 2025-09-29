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
  createdAt: Date
  updatedAt: Date
  isPinned?: boolean
}

interface MemoryConfig {
  maxSessionMessages?: number
  maxStoredConversations?: number
  maxMessagesPerConversation?: number
  autoSave?: boolean
  storageKey?: string
}

class MemoryService {
  private config: Required<MemoryConfig>
  private currentSessionId: string
  private sessionMessages: Message[] = []

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxSessionMessages: config.maxSessionMessages || 100,
      maxStoredConversations: config.maxStoredConversations || 50,
      maxMessagesPerConversation: config.maxMessagesPerConversation || 1000,
      autoSave: config.autoSave !== undefined ? config.autoSave : true,
      storageKey: config.storageKey || 'modbot-conversations'
    }

    this.currentSessionId = this.generateSessionId()
    this.loadSessionMemory()
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2)}`
  }

  private generateConversationTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    }
    return `Conversation ${new Date().toLocaleDateString()}`
  }

  // Session Storage - Temporary memory within browser session
  saveToSession(messages: Message[]): void {
    try {
      this.sessionMessages = messages.slice(-this.config.maxSessionMessages)
      sessionStorage.setItem(this.currentSessionId, JSON.stringify(this.sessionMessages))
    } catch (error) {
      console.error('Failed to save to session storage:', error)
    }
  }

  loadSessionMemory(): Message[] {
    try {
      const stored = sessionStorage.getItem(this.currentSessionId)
      if (stored) {
        this.sessionMessages = JSON.parse(stored)
        return this.sessionMessages
      }
    } catch (error) {
      console.error('Failed to load from session storage:', error)
    }
    return []
  }

  getSessionContext(limit: number = 10): Message[] {
    return this.sessionMessages.slice(-limit)
  }

  // Local Storage - Long-term memory across sessions
  saveConversation(messages: Message[], conversationId?: string): string {
    try {
      const conversations = this.getAllConversations()
      const id = conversationId || `conv-${Date.now()}`

      const conversation: Conversation = {
        id,
        title: this.generateConversationTitle(messages),
        messages: messages.slice(-this.config.maxMessagesPerConversation),
        createdAt: conversationId ? conversations.find(c => c.id === id)?.createdAt || new Date() : new Date(),
        updatedAt: new Date(),
        isPinned: conversations.find(c => c.id === id)?.isPinned || false
      }

      // Update existing or add new
      const index = conversations.findIndex(c => c.id === id)
      if (index >= 0) {
        conversations[index] = conversation
      } else {
        conversations.unshift(conversation)
      }

      // Limit stored conversations (keep pinned ones)
      const pinned = conversations.filter(c => c.isPinned)
      const unpinned = conversations.filter(c => !c.isPinned)
      const limited = [...pinned, ...unpinned.slice(0, this.config.maxStoredConversations - pinned.length)]

      localStorage.setItem(this.config.storageKey, JSON.stringify(limited))
      return id
    } catch (error) {
      console.error('Failed to save conversation:', error)
      throw error
    }
  }

  loadConversation(conversationId: string): Conversation | null {
    try {
      const conversations = this.getAllConversations()
      return conversations.find(c => c.id === conversationId) || null
    } catch (error) {
      console.error('Failed to load conversation:', error)
      return null
    }
  }

  getAllConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
    return []
  }

  deleteConversation(conversationId: string): boolean {
    try {
      const conversations = this.getAllConversations()
      const filtered = conversations.filter(c => c.id !== conversationId)
      localStorage.setItem(this.config.storageKey, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  }

  pinConversation(conversationId: string): boolean {
    try {
      const conversations = this.getAllConversations()
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        conversation.isPinned = !conversation.isPinned
        localStorage.setItem(this.config.storageKey, JSON.stringify(conversations))
        return true
      }
    } catch (error) {
      console.error('Failed to pin conversation:', error)
    }
    return false
  }

  searchConversations(query: string): Conversation[] {
    const conversations = this.getAllConversations()
    const lowercaseQuery = query.toLowerCase()

    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(lowercaseQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Context building for AI
  buildContext(currentMessages: Message[], includeSession: boolean = true): Message[] {
    const context: Message[] = []

    // Add relevant session context if requested
    if (includeSession && this.sessionMessages.length > 0) {
      // Get last few exchanges from session
      const sessionContext = this.getSessionContext(6)
      context.push(...sessionContext)
    }

    // Add current conversation
    context.push(...currentMessages)

    // Remove duplicates based on ID
    const seen = new Set<string>()
    return context.filter(msg => {
      if (seen.has(msg.id)) return false
      seen.add(msg.id)
      return true
    })
  }

  // Clear methods
  clearSession(): void {
    this.sessionMessages = []
    sessionStorage.removeItem(this.currentSessionId)
  }

  clearAllConversations(): void {
    localStorage.removeItem(this.config.storageKey)
  }

  clearAll(): void {
    this.clearSession()
    this.clearAllConversations()
  }

  // Export/Import for backup
  exportConversations(): string {
    const conversations = this.getAllConversations()
    return JSON.stringify(conversations, null, 2)
  }

  importConversations(jsonString: string): boolean {
    try {
      const conversations = JSON.parse(jsonString)
      if (Array.isArray(conversations)) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(conversations))
        return true
      }
    } catch (error) {
      console.error('Failed to import conversations:', error)
    }
    return false
  }

  // Statistics
  getStatistics() {
    const conversations = this.getAllConversations()
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)

    return {
      totalConversations: conversations.length,
      pinnedConversations: conversations.filter(c => c.isPinned).length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 ? Math.round(totalMessages / conversations.length) : 0,
      oldestConversation: conversations.length > 0 ? new Date(Math.min(...conversations.map(c => new Date(c.createdAt).getTime()))) : null,
      newestConversation: conversations.length > 0 ? new Date(Math.max(...conversations.map(c => new Date(c.updatedAt).getTime()))) : null
    }
  }
}

export default MemoryService
export type { Message, Conversation, MemoryConfig }