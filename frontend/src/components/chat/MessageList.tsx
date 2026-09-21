import { useRef, useEffect, useState } from 'react'
import type { ChatMessage, MultiModelResponseItem, AgentTeamRoleOutput } from '@/types'
import {
  User,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronRight,
  Columns2,
  Users2,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react'
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

// ── Multi-Model Parallel Compare Grid Component ─────────────────────────────

function MultiModelCompareGrid({
  responses,
  onOpenArtifact,
}: {
  responses: MultiModelResponseItem[]
  onOpenArtifact?: (content: string, title: string) => void
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
        <Columns2 className="w-3.5 h-3.5 text-cyan-400" />
        <span>Multi-Model Comparative Evaluation ({responses.length} models)</span>
      </div>

      <div
        className={`grid grid-cols-1 ${
          responses.length === 2
            ? 'md:grid-cols-2'
            : responses.length >= 3
            ? 'md:grid-cols-3'
            : ''
        } gap-3.5 w-full`}
      >
        {responses.map((resp, i) => {
          const parts = parseArtifactsAndText(resp.content)
          const cleanName = resp.model.includes('/') ? resp.model.split('/').pop()! : resp.model

          return (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] flex flex-col shadow-md transition-all hover:border-[var(--color-border-hover)]"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-shrink-0">{getProviderIcon(resp.provider, 'w-3.5 h-3.5', 14)}</div>
                  <span className="text-xs font-mono font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {cleanName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {resp.tokens_used ? (
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {resp.tokens_used.toLocaleString()} tok
                    </span>
                  ) : null}
                  <button
                    onClick={() => handleCopy(i, resp.content)}
                    className="p-1 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-3 text-xs leading-relaxed space-y-2.5 overflow-y-auto max-h-[440px]">
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Multi-Agent Collaborative Team Pipeline Component ───────────────────────

function MultiAgentTeamReport({
  reports,
  onOpenArtifact,
}: {
  reports: AgentTeamRoleOutput[]
  onOpenArtifact?: (content: string, title: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'architect' | 'coder' | 'reviewer'>('all')

  const architect = reports.find(r => r.role === 'architect')
  const coder = reports.find(r => r.role === 'coder')
  const reviewer = reports.find(r => r.role === 'reviewer')

  return (
    <div className="space-y-3 w-full rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)] shadow-lg">
      {/* Team Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Users2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Autonomous Multi-Agent Team Execution
            </h4>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
              Architect ➔ Engineer (Coder) ➔ Security Auditor (Reviewer)
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-[var(--color-base)] p-0.5 rounded-lg border border-[var(--color-border)] text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeTab === 'all'
                ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            All Roles
          </button>
          {architect && (
            <button
              onClick={() => setActiveTab('architect')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeTab === 'architect'
                  ? 'bg-blue-500/20 text-blue-300 font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-blue-400'
              }`}
            >
              Architect
            </button>
          )}
          {coder && (
            <button
              onClick={() => setActiveTab('coder')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeTab === 'coder'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-emerald-400'
              }`}
            >
              Coder
            </button>
          )}
          {reviewer && (
            <button
              onClick={() => setActiveTab('reviewer')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeTab === 'reviewer'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-amber-400'
              }`}
            >
              Reviewer
            </button>
          )}
        </div>
      </div>

      {/* Role 1: Architect Card */}
      {architect && (activeTab === 'all' || activeTab === 'architect') && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-950/30 border-b border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold tracking-wider">
                Phase 1 • Architect
              </span>
              <span className="text-xs font-medium text-blue-200">System Blueprint & Decomposition</span>
            </div>
            <span className="text-[10px] font-mono text-blue-300/70">{architect.model}</span>
          </div>
          <div className="p-3 text-xs leading-relaxed text-blue-100/90 whitespace-pre-wrap font-sans">
            {architect.content}
          </div>
        </div>
      )}

      {/* Role 2: Coder Card */}
      {coder && (activeTab === 'all' || activeTab === 'coder') && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold tracking-wider">
                Phase 2 • Engineer
              </span>
              <span className="text-xs font-medium text-emerald-200">Implementation & Deliverables</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300/70">{coder.model}</span>
          </div>
          <div className="p-3 text-xs leading-relaxed space-y-2">
            {parseArtifactsAndText(coder.content).map((p, idx) =>
              p.type === 'code' ? (
                <ArtifactCard
                  key={idx}
                  title={p.title || 'implementation'}
                  language={p.language}
                  content={p.text}
                  onOpenInPanel={onOpenArtifact}
                />
              ) : (
                <div key={idx} className="whitespace-pre-wrap font-sans text-emerald-100/90">
                  {p.text}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Role 3: Auditor / Reviewer Card */}
      {reviewer && (activeTab === 'all' || activeTab === 'reviewer') && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-amber-950/30 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold tracking-wider">
                Phase 3 • Auditor
              </span>
              <span className="text-xs font-medium text-amber-200">Security Audit & Verification</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PASSED</span>
            </div>
          </div>
          <div className="p-3 text-xs leading-relaxed text-amber-100/90 whitespace-pre-wrap font-sans">
            {reviewer.content}
          </div>
        </div>
      )}
    </div>
  )
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
              ) : msg.multi_model_responses && msg.multi_model_responses.length > 0 ? (
                <MultiModelCompareGrid
                  responses={msg.multi_model_responses}
                  onOpenArtifact={onOpenArtifact}
                />
              ) : msg.agent_team_report && msg.agent_team_report.length > 0 ? (
                <MultiAgentTeamReport
                  reports={msg.agent_team_report}
                  onOpenArtifact={onOpenArtifact}
                />
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
