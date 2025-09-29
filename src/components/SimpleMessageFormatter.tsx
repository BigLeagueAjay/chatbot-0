import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SimpleMessageFormatterProps {
  content: string
}

const SimpleMessageFormatter = memo(function SimpleMessageFormatter({ content }: SimpleMessageFormatterProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Simple code formatting
        code({ inline, children, ...props }: any) {
          return inline ? (
            <code
              style={{
                backgroundColor: 'rgba(110, 118, 129, 0.2)',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                color: '#f0f0f0'
              }}
              {...props}
            >
              {children}
            </code>
          ) : (
            <pre style={{
              backgroundColor: '#1e1e1e',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              margin: '16px 0',
              border: '1px solid rgba(110, 118, 129, 0.3)'
            }}>
              <code style={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#d4d4d4'
              }} {...props}>
                {children}
              </code>
            </pre>
          )
        },
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#58a6ff', textDecoration: 'underline' }}
          >
            {children}
          </a>
        ),
        // Preserve paragraph styling
        p: ({ children }) => (
          <p style={{
            marginBottom: '1.25em',
            lineHeight: '1.75',
            fontSize: '16px',
            color: '#ececf1',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif',
            fontWeight: '400'
          }}>{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul style={{
            marginLeft: '1.5em',
            marginBottom: '1em',
            lineHeight: '1.75',
            color: '#ececf1',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif'
          }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{
            marginLeft: '1.5em',
            marginBottom: '1em',
            lineHeight: '1.75',
            color: '#ececf1',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Roboto, Ubuntu, sans-serif'
          }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{
            marginBottom: '0.5em',
            fontSize: '16px',
            fontWeight: '400'
          }}>{children}</li>
        ),
        // Bold
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600 }}>{children}</strong>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: '4px solid #565869',
            paddingLeft: '16px',
            margin: '12px 0',
            color: '#b0b0bd'
          }}>
            {children}
          </blockquote>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
})

export default SimpleMessageFormatter