import { useState } from 'react'
import type { Provider, Project, Thread } from '@/types'
import { StatusDot } from '@/components/ui/status-dot'
import { useTelemetry } from '@/hooks'
import { getProviderIcon } from '@/components/ui/brand-icons'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import {
  FolderGit2,
  ChevronDown,
  ChevronRight,
  Plus,
  Activity,
  Layers,
  SlidersHorizontal,
  Trash2,
  Edit2,
  LogOut,
  Terminal,
  Container,
  Zap,
} from 'lucide-react'

interface Props {
  providers: Provider[]
  projects: Project[]
  activeProject: Project | null
  activeThread: Thread | null
  onSelectThread: (project: Project, thread: Thread) => void
  onNewThread: (project: Project) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => void
  onRenameProject: (projectId: string, newName: string) => void
  onDeleteThread: (threadId: string) => void
  onRenameThread: (threadId: string, newTitle: string) => void
  onOpenProviders: () => void
  onOpenObserve?: () => void
  onLogout?: () => void
}

export function ProjectsSidebar({
  providers,
  projects,
  activeProject,
  activeThread,
  onSelectThread,
  onNewThread,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  onDeleteThread,
  onRenameThread,
  onOpenProviders,
  onOpenObserve,
  onLogout,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'projects' | 'observability'>('projects')
  const { stats } = useTelemetry()

  // Confirm Modal state
  const [confirmTarget, setConfirmTarget] = useState<{
    open: boolean
    type: 'project' | 'thread'
    id: string
    title: string
  }>({ open: false, type: 'project', id: '', title: '' })

  const connectedCount = providers.filter(p => p.connected).length

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSwitchToObserve = () => {
    setView('observability')
    onOpenObserve?.()
  }

  const handleConfirmDelete = () => {
    if (confirmTarget.type === 'project') {
      onDeleteProject(confirmTarget.id)
    } else {
      onDeleteThread(confirmTarget.id)
    }
    setConfirmTarget({ open: false, type: 'project', id: '', title: '' })
  }

  const promptRenameProject = (proj: Project) => {
    const newName = prompt('Rename project:', proj.name)
    if (newName && newName.trim() && newName !== proj.name) {
      onRenameProject(proj.id, newName.trim())
    }
  }

  const promptRenameThread = (thread: Thread) => {
    const newTitle = prompt('Rename thread:', thread.title)
    if (newTitle && newTitle.trim() && newTitle !== thread.title) {
      onRenameThread(thread.id, newTitle.trim())
    }
  }

  const getEnvBadge = (type?: string) => {
    switch (type) {
      case 'ssh':
        return <span title="SSH Remote Session"><Terminal className="w-3 h-3 text-amber-400" /></span>
      case 'docker':
        return <span title="Docker Container"><Container className="w-3 h-3 text-cyan-400" /></span>
      case 'scratchpad':
        return <span title="Quick Scratchpad"><Zap className="w-3 h-3 text-purple-400" /></span>
      default:
        return <span title="Local Workspace"><FolderGit2 className="w-3 h-3 text-[var(--color-accent)]" /></span>
    }
  }

  return (
    <>
      <aside
        className="flex flex-col h-full border-r border-[var(--color-border)] select-none"
        style={{
          background: 'var(--color-surface)',
          width: '240px',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-elevated)]/30">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              R
            </div>
            <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Rezolotion Studio
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-[var(--color-elevated)] transition-colors cursor-pointer"
              title="Sign out of workspace"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nav Switcher */}
        <div className="flex px-3 pt-3 gap-1">
          <button
            onClick={() => setView('projects')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              view === 'projects'
                ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>
          <button
            onClick={handleSwitchToObserve}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              view === 'observability'
                ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Observe</span>
          </button>
        </div>

        {/* New project CTA */}
        {view === 'projects' && (
          <div className="px-3 pt-2.5">
            <button
              onClick={onNewProject}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)]/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Workspace Project</span>
            </button>
          </div>
        )}

        {/* Project list */}
        {view === 'projects' && (
          <div className="flex-1 overflow-y-auto py-2 px-1">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--color-text-muted)]">
                No active projects. Click above to create one.
              </div>
            ) : (
              projects.map(proj => {
                const isExpanded = expanded[proj.id] ?? true
                const isActive = activeProject?.id === proj.id
                return (
                  <div key={proj.id} className="mb-1">
                    {/* Project Header */}
                    <div
                      onClick={() => toggle(proj.id)}
                      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-elevated)]"
                    >
                      <span className="text-[var(--color-text-muted)]">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </span>
                      {getEnvBadge((proj as any).project_type)}
                      <span
                        className="text-xs font-mono font-medium truncate flex-1"
                        style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
                      >
                        {proj.name}
                      </span>

                      {/* Project Action Icons */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            onNewThread(proj)
                          }}
                          className="p-1 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                          title="New thread"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            promptRenameProject(proj)
                          }}
                          className="p-1 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                          title="Rename project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setConfirmTarget({
                              open: true,
                              type: 'project',
                              id: proj.id,
                              title: proj.name,
                            })
                          }}
                          className="p-1 rounded hover:bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-rose-400 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Project Threads */}
                    {isExpanded && Array.isArray(proj.threads) && (
                      <div className="ml-4 pl-2 border-l border-[var(--color-border)] space-y-0.5 my-1">
                        {proj.threads.map(thread => {
                          const isActiveThread = activeThread?.id === thread.id
                          return (
                            <div
                              key={thread.id}
                              className={`group/th w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-all cursor-pointer relative ${
                                isActiveThread
                                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] font-medium shadow-sm'
                                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)]/50'
                              }`}
                              onClick={() => onSelectThread(proj, thread)}
                            >
                              {isActiveThread && (
                                <div
                                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
                                  style={{ background: 'var(--color-accent)' }}
                                />
                              )}
                              <div className="flex-shrink-0">
                                {getProviderIcon(thread.provider, 'w-3 h-3', 12)}
                              </div>
                              <span className="text-xs truncate flex-1 font-sans">{thread.title}</span>

                              {/* Thread actions */}
                              <div className="opacity-0 group-hover/th:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    promptRenameThread(thread)
                                  }}
                                  className="p-0.5 rounded hover:text-[var(--color-text-primary)]"
                                  title="Rename thread"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    setConfirmTarget({
                                      open: true,
                                      type: 'thread',
                                      id: thread.id,
                                      title: thread.title,
                                    })
                                  }}
                                  className="p-0.5 rounded hover:text-rose-400"
                                  title="Delete thread"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        <button
                          onClick={() => onNewThread(proj)}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New thread</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Observability Mini Summary */}
        {view === 'observability' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)]">
              <p className="text-[11px] text-[var(--color-text-muted)]">Tokens Recorded</p>
              <p className="text-lg font-semibold font-mono text-[var(--color-accent)]">
                {stats ? `${((stats.total_tokens || 0) / 1_000_000).toFixed(2)}M` : '…'}
              </p>
              <p className="text-[10px] mt-0.5 text-[var(--color-text-muted)]">
                Across {stats?.total_sessions ?? 0} sessions
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] space-y-1.5">
              <p className="text-[11px] text-[var(--color-text-muted)]">Latency & Errors</p>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)]">p95 Turn</span>
                <span>{stats?.p95_duration_ms ?? 0}ms</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)]">Errors</span>
                <span style={{ color: (stats?.total_errors || 0) > 0 ? '#f87171' : 'inherit' }}>
                  {stats?.total_errors ?? 0}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenObserve}
              className="w-full py-2 rounded-xl text-xs font-medium cursor-pointer border border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-card)] transition-colors shadow-sm"
            >
              Open Full Dashboard →
            </button>
          </div>
        )}

        {/* Bottom Providers Hub Button */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-elevated)]/30 space-y-2">
          <button
            onClick={onOpenProviders}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer bg-[var(--color-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-primary)] shadow-sm"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Providers Hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-emerald-400">
                {connectedCount}/{providers.length}
              </span>
            </div>
          </button>

          {/* Live Provider status dots */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {providers.map(p => (
                <StatusDot
                  key={p.id}
                  connected={p.connected}
                  size="sm"
                  title={`${p.name}: ${p.connected ? 'Active' : 'Offline'}`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Zero-Risk CLI</span>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmTarget.open}
        title={`Delete ${confirmTarget.type === 'project' ? 'Project' : 'Thread'}?`}
        description={`Are you sure you want to permanently delete "${confirmTarget.title}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget({ open: false, type: 'project', id: '', title: '' })}
      />
    </>
  )
}
