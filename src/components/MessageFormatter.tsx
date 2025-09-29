import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageFormatterProps {
  content: string
  isStreaming?: boolean
}

export default function MessageFormatter({ content, isStreaming = false }: MessageFormatterProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-content"
      components={{
        // Code blocks with syntax highlighting
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '')

          if (!inline && match) {
            return (
              <div style={{
                margin: '16px 0',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#1e1e1e'
              }}>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            )
          }

          return (
            <code
              className={className}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
              }}
              {...props}
            >
              {children}
            </code>
          )
        },

        // Headings
        h1: ({ children }) => (
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '20px 0 12px', color: '#ececf1' }}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '16px 0 10px', color: '#ececf1' }}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '14px 0 8px', color: '#ececf1' }}>
            {children}
          </h3>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p style={{ marginBottom: '12px', lineHeight: '1.7' }}>
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul style={{
            marginLeft: '20px',
            marginBottom: '12px',
            listStyleType: 'disc'
          }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{
            marginLeft: '20px',
            marginBottom: '12px',
            listStyleType: 'decimal'
          }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: '4px', lineHeight: '1.7' }}>
            {children}
          </li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#58a6ff',
              textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderBottomColor = '#58a6ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: '4px solid #565869',
            paddingLeft: '16px',
            margin: '12px 0',
            color: '#b0b0bd',
            fontStyle: 'italic'
          }}>
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children }) => (
          <div style={{
            overflowX: 'auto',
            marginBottom: '16px',
            border: '1px solid #565869',
            borderRadius: '6px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th style={{
            padding: '8px 12px',
            textAlign: 'left',
            borderBottom: '1px solid #565869',
            fontWeight: 600
          }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(86, 88, 105, 0.3)'
          }}>
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => (
          <hr style={{
            border: 'none',
            borderTop: '1px solid #565869',
            margin: '20px 0'
          }} />
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600, color: '#ffffff' }}>
            {children}
          </strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic' }}>
            {children}
          </em>
        ),

        // Strikethrough
        del: ({ children }) => (
          <del style={{ textDecoration: 'line-through', opacity: 0.7 }}>
            {children}
          </del>
        ),

        // Task lists
        input: ({ type, checked, ...props }) => {
          if (type === 'checkbox') {
            return (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                style={{
                  marginRight: '8px',
                  transform: 'translateY(2px)'
                }}
                {...props}
              />
            )
          }
          return <input type={type} {...props} />
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}