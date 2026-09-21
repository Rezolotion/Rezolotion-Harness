import { useState, useEffect } from 'react'
import {
  FileText,
  Zap,
  Search,
  ShieldCheck,
  GitCommit,
  Cpu,
} from 'lucide-react'

export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: '/plan',
    label: '/plan',
    description: 'Switch to architectural planning & design review',
    icon: <FileText className="w-4 h-4 text-blue-400" />,
  },
  {
    id: '/build',
    label: '/build',
    description: 'Direct code implementation and tool execution',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  {
    id: '/search',
    label: '/search',
    description: 'Deep semantic and grep search across codebase',
    icon: <Search className="w-4 h-4 text-purple-400" />,
  },
  {
    id: '/review',
    label: '/review',
    description: 'Security, performance, and best-practice audit',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: '/commit',
    label: '/commit',
    description: 'Inspect staged diff and generate atomic commit',
    icon: <GitCommit className="w-4 h-4 text-rose-400" />,
  },
  {
    id: '/mcp',
    label: '/mcp',
    description: 'Inspect active MCP tool servers and capabilities',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
  },
]

interface Props {
  filter: string
  onSelect: (command: SlashCommand) => void
  onClose: () => void
}

export function SlashCommandMenu({ filter, onSelect, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const cleanFilter = filter.toLowerCase().replace(/^\//, '')
  const filtered = SLASH_COMMANDS.filter(c =>
    c.id.toLowerCase().includes(cleanFilter) || c.description.toLowerCase().includes(cleanFilter)
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, onSelect, onClose])

  if (filtered.length === 0) return null

  return (
    <div
      className="absolute bottom-full mb-2 left-4 w-80 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-2xl z-30"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
        Quick Commands
      </div>
      <div className="py-1 max-h-56 overflow-y-auto">
        {filtered.map((cmd, idx) => {
          const isSelected = idx === selectedIndex
          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors ${
                isSelected ? 'bg-[var(--color-elevated)]' : 'hover:bg-[var(--color-elevated)]/60'
              }`}
            >
              <div className="flex-shrink-0">{cmd.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {cmd.label}
                </div>
                <div className="text-[11px] truncate text-[var(--color-text-muted)]">
                  {cmd.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
