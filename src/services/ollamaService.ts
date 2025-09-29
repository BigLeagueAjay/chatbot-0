// Ollama API Service for local LLM integration

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OllamaResponse {
  model: string
  created_at: string
  response?: string
  message?: {
    role: string
    content: string
  }
  done: boolean
}

export class OllamaService {
  private baseUrl = 'http://localhost:11434'
  private model = 'llama3:latest' // You can change this to any model you have

  async sendMessage(message: string, history: OllamaMessage[] = []): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...history,
            { role: 'user', content: message }
          ],
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data: OllamaResponse = await response.json()
      return data.message?.content || 'No response from model'
    } catch (error) {
      console.error('Ollama service error:', error)
      throw error
    }
  }

  async* streamMessage(message: string, history: OllamaMessage[] = []) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...history,
            { role: 'user', content: message }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line)
            if (data.message?.content) {
              yield data.message.content
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      console.error('Ollama streaming error:', error)
      throw error
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch (error) {
      console.error('Failed to list models:', error)
      return []
    }
  }

  setModel(modelName: string) {
    this.model = modelName
  }

  getModel(): string {
    return this.model
  }
}

export const ollamaService = new OllamaService()