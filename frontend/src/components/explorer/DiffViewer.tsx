import { useState } from 'react'
import { FileDiff, Copy, Check, Split, Columns } from 'lucide-react'

interface Props {
  filename?: string
  diffText?: string
  originalContent?: string
  modifiedContent?: string
}

export function DiffViewer({
  filename = 'changes.diff',
  diffText,
  modifiedContent = '',
}: Props) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diffText || modifiedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  // Parse lines for unified diff representation
  const lines = (diffText || modifiedContent).split('\n')

  return (
    <div
      className="flex flex-col h-full overflow-hidden border-l border-[var(--color-border)]"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <FileDiff className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-xs font-mono font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[var(--color-base)] p-0.5 rounded border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('unified')}
              className={`p-1 rounded text-xs cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
              title="Unified diff"
            >
              <Split className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1 rounded text-xs cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
              title="Split view"
            >
              <Columns className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => void handleCopy()}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Copy diff"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diff Content Body */}
      <div className="flex-1 overflow-y-auto p-2 bg-[var(--color-base)] font-mono text-[11px] leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const isAdded = line.startsWith('+') && !line.startsWith('+++')
              const isRemoved = line.startsWith('-') && !line.startsWith('---')
              const isMeta = line.startsWith('@@') || line.startsWith('diff')

              const rowBg = isAdded
                ? 'bg-emerald-950/30 text-emerald-300'
                : isRemoved
                ? 'bg-rose-950/30 text-rose-300'
                : isMeta
                ? 'bg-blue-950/20 text-blue-300 font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-white/[0.02]'

              return (
                <tr key={idx} className={rowBg}>
                  <td className="pr-3 pl-2 select-none text-right text-[var(--color-text-muted)] opacity-30 w-8 border-r border-[var(--color-border)]">
                    {idx + 1}
                  </td>
                  <td className="pl-3 pr-2 whitespace-pre font-mono">
                    {line || ' '}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
