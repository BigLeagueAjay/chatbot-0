// Mock API service for demonstration
// Replace this with your actual API integration

const mockResponses = [
  "That's an interesting question! Let me help you with that.",
  "Based on my understanding, here's what I can tell you...",
  "I understand what you're asking. Here's my response...",
  "Let me break this down for you step by step...",
  "Here's a comprehensive answer to your query...",
]

export async function sendMessage(message: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Return a mock response
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  // Add some context based on the message
  if (message.toLowerCase().includes('hello')) {
    return "Hello! How can I assist you today? I'm here to help with any questions or tasks you might have."
  }

  if (message.toLowerCase().includes('help')) {
    return "I'm here to help! I can assist you with:\n\n• Answering questions\n• Providing explanations\n• Helping with tasks\n• General conversation\n\nWhat would you like help with?"
  }

  if (message.toLowerCase().includes('code')) {
    return `Here's a simple example in JavaScript:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

This function takes a name as input and returns a greeting message.`
  }

  return `${randomResponse}\n\nRegarding "${message}", I've processed your input and here's my thoughtful response. In a real implementation, this would connect to an actual AI service like OpenAI, Claude, or your custom backend.`
}

// For streaming responses (optional)
export async function* streamMessage(message: string) {
  const response = await sendMessage(message)
  const words = response.split(' ')

  for (const word of words) {
    await new Promise(resolve => setTimeout(resolve, 50))
    yield word + ' '
  }
}