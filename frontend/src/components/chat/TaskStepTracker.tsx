import { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Terminal,
  FileCode2,
  Search,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'

export interface ExecutionStep {
  id: string
  title: string
  toolName?: string
  status: 'running' | 'completed' | 'failed' | 'pending'
  durationMs?: number
  input?: string
  output?: string
  diffSummary?: { added: number; removed: number }
}

interface Props {
  steps: ExecutionStep[]
}

function getToolIcon(toolName?: string) {
  if (!toolName) return <Sparkles className="w-3.5 h-3.5 text-blue-400" />
  const lower = toolName.toLowerCase()
  if (lower.includes('command') || lower.includes('bash') || lower.includes('terminal')) {
    return <Terminal className="w-3.5 h-3.5 text-amber-400" />
  }
  if (lower.includes('grep') || lower.includes('search') || lower.includes('find')) {
    return <Search className="w-3.5 h-3.5 text-purple-400" />
  }
  if (lower.includes('view') || lower.includes('read') || lower.includes('file')) {
    return <FileText className="w-3.5 h-3.5 text-cyan-400" />
  }
  return <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
}

export function TaskStepTracker({ steps }: Props) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!steps || steps.length === 0) return null

  const completedCount = steps.filter(s => s.status === 'completed').length
  const isAllDone = completedCount === steps.length

  return (
    <div
      className="my-3 rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-elevated)] border-b border-[var(--color-border)]"
      >
        <div className="flex items-center gap-2">
          {isAllDone ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Execution Plan
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[var(--color-base)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
            {completedCount}/{steps.length} steps
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-[var(--color-border)]">
        {steps.map(step => {
          const isExpanded = expandedIds[step.id] ?? (step.status === 'running')
          const hasDetails = Boolean(step.input || step.output)

          return (
            <div key={step.id} className="transition-colors hover:bg-[var(--color-elevated)]/40">
              <div
                onClick={() => hasDetails && toggle(step.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 select-none ${hasDetails ? 'cursor-pointer' : ''}`}
              >
                {/* Status icon */}
                {step.status === 'running' && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                )}
                {step.status === 'completed' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
                {step.status === 'failed' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                )}
                {step.status === 'pending' && (
                  <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] flex-shrink-0" />
                )}

                {/* Tool Icon */}
                <div className="flex-shrink-0">{getToolIcon(step.toolName)}</div>

                {/* Title */}
                <span
                  className="text-xs font-mono truncate flex-1"
                  style={{
                    color: step.status === 'failed' ? '#f87171' : 'var(--color-text-primary)',
                  }}
                >
                  {step.title}
                </span>

                {/* Diff badges */}
                {step.diffSummary && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-emerald-400">+{step.diffSummary.added}</span>
                    <span className="text-rose-400">-{step.diffSummary.removed}</span>
                  </div>
                )}

                {/* Duration */}
                {step.durationMs !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--color-text-muted)]">
                    <Clock className="w-3 h-3" />
                    {step.durationMs > 1000
                      ? `${(step.durationMs / 1000).toFixed(1)}s`
                      : `${step.durationMs}ms`}
                  </span>
                )}

                {/* Accordion toggle */}
                {hasDetails && (
                  <div className="text-[var(--color-text-muted)]">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible output details */}
              {isExpanded && hasDetails && (
                <div className="px-3.5 pb-2.5 pt-1 space-y-1.5 text-xs font-mono">
                  {step.input && (
                    <div className="p-2 rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-secondary)] whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                      <span className="text-[var(--color-accent)] font-semibold">$ </span>
                      {step.input}
                    </div>
                  )}
                  {step.output && (
                    <pre className="p-2.5 rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-muted)] overflow-x-auto text-[11px] max-h-48 leading-relaxed">
                      {step.output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
