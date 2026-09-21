import { useState } from 'react'
import type { Provider, Project, Thread } from '@/types'
import { StatusDot } from '@/components/ui/status-dot'

const PROVIDER_ICONS: Record<string, string> = {
  claude: '◆',
  antigravity: '✦',
  openai: '⬡',
  deepseek: '◈',
  openrouter: '⊕',
  hermes: '⊞',
  ninerouter: '⊛',
}

interface Props {
  providers: Provider[]
  projects: Project[]
  activeProject: Project | null
  activeThread: Thread | null
  onSelectThread: (project: Project, thread: Thread) => void
  onNewThread: (project: Project) => void
  onNewProject: () => void
  onOpenProviders: () => void
}


export function ProjectsSidebar({
  providers,
  projects,
  activeProject,
  activeThread,
  onSelectThread,
  onNewThread,
  onNewProject,
  onOpenProviders,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'projects' | 'observability'>('projects')

  const connectedCount = providers.filter(p => p.connected).length

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        width: '220px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--color-accent)', color: '#000' }}
        >
          R
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Rezolotion
        </span>
      </div>

      {/* Nav tabs */}
      <div className="flex px-2 pt-2 gap-1">
        {(['projects', 'observability'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer"
            style={{
              background: view === v ? 'var(--color-elevated)' : 'transparent',
              color: view === v ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {v === 'observability' ? 'Observe' : v}
          </button>
        ))}
      </div>

      {/* New project button */}
      {view === 'projects' && (
        <div className="px-2 pt-2">
          <button
            onClick={onNewProject}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: 'transparent',
              border: '1px dashed var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            + New project
          </button>
        </div>
      )}

      {/* Project list */}
      {view === 'projects' && (
        <div className="flex-1 overflow-y-auto py-2">
          {projects.map(proj => {
            const isExpanded = expanded[proj.id] ?? true
            const isActive = activeProject?.id === proj.id
            return (
              <div key={proj.id}>
                {/* Project header */}
                <button
                  onClick={() => toggle(proj.id)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors text-left"
                  style={{
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: 'transparent',
                  }}
                >
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <span className="text-xs font-medium truncate flex-1">{proj.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onNewThread(proj) }}
                    className="px-1.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ color: 'var(--color-text-muted)', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '' }}
                  >
                    +
                  </button>
                </button>

                {/* Threads */}
                {isExpanded && proj.threads.map(thread => {
                  const isActiveThread = activeThread?.id === thread.id
                  return (
                    <button
                      key={thread.id}
                      onClick={() => onSelectThread(proj, thread)}
                      className="w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-left transition-colors cursor-pointer"
                      style={{
                        background: isActiveThread ? 'var(--color-elevated)' : 'transparent',
                        color: isActiveThread ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      }}
                      onMouseEnter={e => {
                        if (!isActiveThread) e.currentTarget.style.background = 'var(--color-elevated)'
                      }}
                      onMouseLeave={e => {
                        if (!isActiveThread) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span className="text-xs leading-none opacity-50">{PROVIDER_ICONS[thread.provider] ?? '○'}</span>
                      <span className="text-xs truncate flex-1">{thread.title}</span>
                    </button>
                  )
                })}

                {/* New thread CTA inside project */}
                {isExpanded && (
                  <button
                    onClick={() => onNewThread(proj)}
                    className="w-full flex items-center pl-7 pr-3 py-1 text-left cursor-pointer"
                    style={{ color: 'var(--color-text-muted)', background: 'transparent', fontSize: '11px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    + New thread
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Observability mini-stats */}
      {view === 'observability' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Open the Observe panel in the right column
          </p>
        </div>
      )}

      {/* Bottom: providers bar */}
      <div
        className="px-3 py-3 space-y-2"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={onOpenProviders}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          style={{
            background: 'var(--color-elevated)',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          <span>Providers</span>
          <span className="ml-auto text-xs font-mono" style={{ color: connectedCount > 0 ? 'oklch(0.72 0.19 145)' : 'var(--color-text-muted)' }}>
            {connectedCount}/{providers.length}
          </span>
        </button>

        {/* Provider dots */}
        <div className="flex gap-1.5 px-1">
          {providers.map(p => (
            <StatusDot key={p.id} connected={p.connected} size="sm" title={p.name} />
          ))}
        </div>
      </div>
    </aside>
  )
}
