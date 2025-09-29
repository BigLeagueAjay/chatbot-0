export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  metadata?: Record<string, any>
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}