import { useState, useCallback, useEffect } from 'react'
import { useProviders, useProjects, useChat } from '@/hooks'
import type { Project, Thread } from '@/types'
import { ProjectsSidebar } from '@/components/sidebar/ProjectsSidebar'
import { ProvidersModal } from '@/components/providers/ProvidersModal'
import { MessageList } from '@/components/chat/MessageList'
import { Composer } from '@/components/chat/Composer'
import { FileExplorer } from '@/components/explorer/FileExplorer'
import { ObservabilityDashboard } from '@/components/observability/ObservabilityDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { api } from '@/lib/api'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

type RightPanel = 'explorer' | 'observe'

export function StudioPage() {
  const { providers, refresh: refreshProviders } = useProviders()
  const { projects, refresh: refreshProjects } = useProjects()

  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [sessionId, setSessionId] = useState<string>(genId())
  const [showProviders, setShowProviders] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanel>('explorer')

  // Auto-select initial project and thread when available
  useEffect(() => {
    if (!activeProject && Array.isArray(projects) && projects.length > 0) {
      const first = projects[0]
      setActiveProject(first)
      if (Array.isArray(first.threads) && first.threads.length > 0) {
        setActiveThread(first.threads[0])
        setSessionId(first.threads[0].id)
      }
    }
  }, [projects, activeProject])

  const { messages, streaming, streamText, tokenCount, sendMessage } = useChat(sessionId)

  const handleSelectThread = (proj: Project, thread: Thread) => {
    setActiveProject(proj)
    setActiveThread(thread)
    setSessionId(thread.id)
  }

  const handleNewThread = useCallback(async (proj: Project) => {
    try {
      const thread = await api.post<Thread>(`/api/projects/${proj.id}/threads`, {
        title: 'New thread',
        harness: providers.find(p => p.connected)?.id ?? 'claude',
      })
      await refreshProjects()
      setActiveProject(proj)
      setActiveThread(thread)
      setSessionId(thread.id)
    } catch (e) {
      console.error('Failed to create thread', e)
    }
  }, [providers, refreshProjects])

  const handleNewProject = useCallback(async () => {
    const name = prompt('Project name:')
    if (!name?.trim()) return
    try {
      const proj = await api.post<Project>('/api/projects', {
        name,
        root_path: '.',
        description: '',
      })
      await refreshProjects()
      setActiveProject(proj)
      setActiveThread(null)
      setSessionId(genId())
    } catch (e) {
      console.error('Failed to create project', e)
    }
  }, [refreshProjects])

  const handleSend = useCallback((content: string, provider: string, model: string) => {
    sendMessage(content, provider, model)
  }, [sendMessage])

  // Rate-limit banner (if last message suggests it)
  const lastMsg = messages[messages.length - 1]
  const rateLimited = lastMsg?.content?.toLowerCase().includes('rate limit') ||
                      lastMsg?.content?.toLowerCase().includes('overloaded')

  return (
    <ErrorBoundary>
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: 'var(--color-base, #111)',
          color: 'var(--color-text-primary, #fff)',
        }}
      >
        {/* Left: sidebar */}
        <ProjectsSidebar
          providers={providers}
          projects={projects}
          activeProject={activeProject}
          activeThread={activeThread}
          onSelectThread={handleSelectThread}
          onNewThread={proj => void handleNewThread(proj)}
          onNewProject={() => void handleNewProject()}
          onOpenProviders={() => setShowProviders(true)}
          onOpenObserve={() => setRightPanel('observe')}
        />

        {/* Center: chat */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {/* Thread title */}
            <div className="flex-1 min-w-0">
              {activeThread ? (
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {activeThread.title}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Select or create a thread
                </p>
              )}
              {activeProject && (
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {activeProject.name}
                </p>
              )}
            </div>

            {/* Right panel switcher */}
            <div className="flex gap-1">
              {(['explorer', 'observe'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setRightPanel(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer"
                  style={{
                    background: rightPanel === v ? 'var(--color-elevated)' : 'transparent',
                    color: rightPanel === v ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {v === 'observe' ? 'Observe' : 'Files'}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => {
                const cur = document.documentElement.getAttribute('data-theme')
                const next = cur === 'light' ? 'dark' : 'light'
                document.documentElement.setAttribute('data-theme', next)
                document.documentElement.classList.remove('light', 'dark')
                document.documentElement.classList.add(next)
                localStorage.setItem('rezolotion-theme', next)
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs cursor-pointer transition-colors"
              style={{
                color: 'var(--color-text-muted)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title="Toggle theme"
            >
              ◑
            </button>
          </div>

          {/* Rate-limit banner */}
          {rateLimited && (
            <div
              className="flex items-center gap-2.5 px-4 py-2 text-xs"
              style={{
                background: 'oklch(0.25 0.07 75 / 0.4)',
                borderBottom: '1px solid oklch(0.45 0.15 75 / 0.35)',
                color: 'oklch(0.78 0.18 75)',
              }}
            >
              <span>⚠</span>
              <span>Rate limit detected — waiting to auto-resume</span>
              <span className="ml-auto animate-pulse">●</span>
            </div>
          )}

          {/* Message list */}
          <MessageList messages={messages} streaming={streaming} streamText={streamText} />

          {/* Composer */}
          <Composer
            providers={providers}
            streaming={streaming}
            tokenCount={tokenCount}
            onSend={handleSend}
          />
        </div>

        {/* Right panel */}
        {rightPanel === 'explorer' ? (
          <FileExplorer projectPath={activeProject?.root_path ?? '.'} />
        ) : (
          <aside
            className="flex flex-col h-full overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              width: '320px',
              flexShrink: 0,
            }}
          >
            <div
              className="px-4 py-2.5 text-xs font-semibold flex-shrink-0"
              style={{
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              System Observability
            </div>
            <ObservabilityDashboard />
          </aside>
        )}

        {/* Providers modal */}
        {showProviders && (
          <ProvidersModal
            providers={providers}
            onClose={() => setShowProviders(false)}
            onRefresh={() => void refreshProviders()}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
