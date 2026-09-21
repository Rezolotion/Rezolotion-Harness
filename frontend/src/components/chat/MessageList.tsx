import { useRef, useEffect, useState } from 'react'
import type { ChatMessage } from '@/types'
import { User, Sparkles, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { getProviderIcon } from '@/components/ui/brand-icons'
import { TaskStepTracker, ExecutionStep } from '@/components/chat/TaskStepTracker'
import { ArtifactCard } from '@/components/chat/ArtifactCard'

interface Props {
  messages: ChatMessage[]
  streaming: boolean
  streamText: string
  activeSteps?: ExecutionStep[]
  onOpenArtifact?: (content: string, title: string) => void
}

function parseArtifactsAndText(content: string) {
  const codeBlockRegex = /```([a-zA-Z0-9_\-\.]+)?\n([\s\S]*?)```/g
  const parts: Array<{ type: 'text' | 'code'; text: string; language?: string; title?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) })
    }
    const rawLang = match[1] || ''
    const code = match[2]
    // Check if filename is in language e.g. ```tsx:App.tsx or ```python
    let language = rawLang
    let title = 'snippet'
    if (rawLang.includes(':')) {
      const split = rawLang.split(':')
      language = split[0]
      title = split[1]
    } else if (rawLang) {
      language = rawLang
      title = `code.${rawLang}`
    }
    parts.push({ type: 'code', text: code, language, title })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) })
  }

  return parts
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="mb-3 rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200"
      style={{ background: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2 bg-[var(--color-elevated)]/60 text-left cursor-pointer select-none hover:bg-[var(--color-elevated)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-300">
            Thought Process & Reasoning
          </span>
        </div>
        <div className="text-[var(--color-text-muted)]">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap border-t border-[var(--color-border)] max-h-60 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  )
}

export function MessageList({
  messages,
  streaming,
  streamText,
  activeSteps,
  onOpenArtifact,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText, activeSteps])

  if (messages.length === 0 && !streaming && (!activeSteps || activeSteps.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-[var(--color-border)]"
          style={{ background: 'var(--color-elevated)' }}
        >
          <Sparkles className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Rezolotion Agentic Studio
          </h2>
          <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Multi-harness workspace with Zero-Risk native CLI execution, Claude Artifacts, and real-time observability.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {messages.map(msg => {
        const isUser = msg.role === 'user'
        const parts = parseArtifactsAndText(msg.content)

        return (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-[var(--color-border)] shadow-sm"
              style={{
                background: isUser ? 'var(--color-accent)' : 'var(--color-elevated)',
                color: isUser ? '#fff' : 'var(--color-text-primary)',
              }}
            >
              {isUser ? (
                <User className="w-4 h-4 text-black" />
              ) : msg.provider ? (
                getProviderIcon(msg.provider, 'w-4 h-4', 16)
              ) : (
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              )}
            </div>

            {/* Content Body */}
            <div className={`flex-1 min-w-0 space-y-2 ${isUser ? 'items-end text-right' : 'items-start'}`}>
              {/* Reasoning Card */}
              {msg.thinking && <ThinkingBlock content={msg.thinking} />}

              {/* Message Content */}
              {isUser ? (
                <div
                  className="inline-block px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-sans text-left shadow-sm"
                  style={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-3">
                  {parts.map((p, idx) =>
                    p.type === 'code' ? (
                      <ArtifactCard
                        key={idx}
                        title={p.title || 'snippet'}
                        language={p.language}
                        content={p.text}
                        onOpenInPanel={onOpenArtifact}
                      />
                    ) : (
                      <div
                        key={idx}
                        className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-[var(--color-text-primary)]"
                      >
                        {p.text}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Meta tags */}
              <div
                className={`flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-muted)] ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.provider && <span>{msg.provider}</span>}
                {msg.model && <span>• {msg.model}</span>}
                {msg.tokens_used && <span>• {msg.tokens_used.toLocaleString()} tok</span>}
              </div>
            </div>
          </div>
        )
      })}

      {/* Real-time Agent Steps Tracker */}
      {activeSteps && activeSteps.length > 0 && (
        <div className="max-w-4xl mx-auto pl-10">
          <TaskStepTracker steps={activeSteps} />
        </div>
      )}

      {/* Streaming Bubble */}
      {streaming && streamText && (
        <div className="flex gap-3.5 max-w-4xl mx-auto">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-[var(--color-border)]"
            style={{ background: 'var(--color-elevated)' }}
          >
            <Sparkles className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-[var(--color-text-primary)]">
              {streamText}
              <span
                className="inline-block w-1.5 h-3 ml-1 align-middle animate-pulse rounded-sm"
                style={{ background: 'var(--color-accent)' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
