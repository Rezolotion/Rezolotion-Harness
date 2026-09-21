import { useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'

interface Props {
  messages: ChatMessage[]
  streaming: boolean
  streamText: string
}

const ROLE_LABEL: Record<string, string> = {
  user: 'You',
  assistant: 'Agent',
  tool: 'Tool',
  system: 'System',
}

function ToolTrace({ content }: { content: string }) {
  const lines = content.split('\n').filter(Boolean)
  return (
    <details className="text-xs">
      <summary
        className="cursor-pointer select-none py-0.5 px-1 rounded"
        style={{ color: 'var(--color-text-muted)', listStyle: 'none' }}
      >
        ▶ {lines[0] ?? 'Tool output'}
      </summary>
      <pre
        className="mt-1 px-3 py-2 rounded-lg overflow-x-auto text-xs"
        style={{
          background: 'var(--color-base)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--color-border)',
        }}
      >
        {content}
      </pre>
    </details>
  )
}

export function MessageList({ messages, streaming, streamText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ background: 'var(--color-elevated)' }}
        >
          R
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Rezolotion Harness
        </p>
        <p className="text-xs text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
          Connect your providers, select a project, and start a thread
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map(msg => (
        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
            style={{
              background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-elevated)',
              color: msg.role === 'user' ? '#000' : 'var(--color-text-primary)',
            }}
          >
            {msg.role === 'user' ? 'U' : (ROLE_LABEL[msg.role] ?? 'A').charAt(0)}
          </div>

          {/* Content */}
          <div
            className="max-w-[75%] space-y-1"
            style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}
          >
            {/* Thinking block */}
            {msg.thinking && (
              <details className="text-xs mb-1">
                <summary
                  className="cursor-pointer select-none"
                  style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}
                >
                  thinking...
                </summary>
                <div
                  className="mt-1 px-3 py-2 rounded-lg text-xs italic"
                  style={{
                    background: 'var(--color-elevated)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {msg.thinking}
                </div>
              </details>
            )}

            {/* Message bubble */}
            {msg.role === 'tool' ? (
              <ToolTrace content={msg.content} />
            ) : (
              <div
                className="px-3.5 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-elevated)',
                  color: msg.role === 'user' ? '#000' : 'var(--color-text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {msg.content}
              </div>
            )}

            {/* Meta */}
            <div
              className="flex items-center gap-2 text-xs"
              style={{
                color: 'var(--color-text-muted)',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.provider && <span>{msg.provider}</span>}
              {msg.model && <span className="font-mono">{msg.model}</span>}
              {msg.tokens_used && <span>{msg.tokens_used.toLocaleString()} tok</span>}
            </div>
          </div>
        </div>
      ))}

      {/* Streaming bubble */}
      {streaming && streamText && (
        <div className="flex gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-primary)' }}
          >
            A
          </div>
          <div
            className="max-w-[75%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
            style={{
              background: 'var(--color-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {streamText}
            <span
              className="inline-block w-1.5 h-3 ml-0.5 align-text-bottom animate-pulse rounded-sm"
              style={{ background: 'var(--color-accent)' }}
            />
          </div>
        </div>
      )}

      {/* Streaming spinner (no text yet) */}
      {streaming && !streamText && (
        <div className="flex gap-3 items-center">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-primary)' }}
          >
            A
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{
                  background: 'var(--color-text-muted)',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
