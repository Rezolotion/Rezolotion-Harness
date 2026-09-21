import { useState } from 'react'
import { FileCode2, Copy, Check, Download, ExternalLink } from 'lucide-react'

interface Props {
  title: string
  language?: string
  content: string
  onOpenInPanel?: (content: string, title: string) => void
}

export function ArtifactCard({ title, language = 'typescript', content, onOpenInPanel }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = title || 'artifact.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const lineCount = content.split('\n').length

  return (
    <div
      className="my-3 rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200 hover:border-[var(--color-border-hover)]"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
          <span className="text-xs font-mono font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-base)] text-[var(--color-text-muted)] border border-[var(--color-border)] flex-shrink-0">
            {language}
          </span>
          <span className="text-[11px] font-mono text-[var(--color-text-muted)] flex-shrink-0">
            {lineCount} lines
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onOpenInPanel && (
            <button
              onClick={() => onOpenInPanel(content, title)}
              className="p-1.5 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Open in Side Panel"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => void handleCopy()}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer with Line Numbers */}
      <div className="p-3 bg-[var(--color-base)] overflow-x-auto max-h-80 font-mono text-xs leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {content.split('\n').map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="pr-4 select-none text-right text-[var(--color-text-muted)] opacity-40 font-mono text-[11px] w-8">
                  {idx + 1}
                </td>
                <td className="text-[var(--color-text-primary)] whitespace-pre font-mono text-[12px]">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
