import { useState, useCallback, useEffect } from 'react'
import { useProviders, useProjects, useChat } from '@/hooks'
import type { Project, Thread } from '@/types'
import { ProjectsSidebar } from '@/components/sidebar/ProjectsSidebar'
import { ProvidersModal } from '@/components/providers/ProvidersModal'
import { MessageList } from '@/components/chat/MessageList'
import { Composer, AgentMode } from '@/components/chat/Composer'
import { FileExplorer } from '@/components/explorer/FileExplorer'
import { DiffViewer } from '@/components/explorer/DiffViewer'
import { ObservabilityDashboard } from '@/components/observability/ObservabilityDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ExecutionStep } from '@/components/chat/TaskStepTracker'
import { api } from '@/lib/api'
import {
  FolderTree,
  FileDiff,
  Activity,
  Sun,
  Moon,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

type RightPanelTab = 'explorer' | 'diff' | 'observe'

export function StudioPage() {
  const { providers, refresh: refreshProviders } = useProviders()
  const { projects, refresh: refreshProjects } = useProjects()

  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [sessionId, setSessionId] = useState<string>(genId())
  const [showProviders, setShowProviders] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanelTab>('explorer')
  const [activeArtifact, setActiveArtifact] = useState<{ title: string; content: string } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeSteps, setActiveSteps] = useState<ExecutionStep[]>([])

  // Auto-select initial project and thread
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
    setActiveSteps([])
  }

  const handleNewThread = useCallback(async (proj: Project) => {
    try {
      const thread = await api.post<Thread>(`/api/projects/${proj.id}/threads`, {
        title: 'New engineering thread',
        harness: providers.find(p => p.connected)?.id ?? 'claude',
      })
      await refreshProjects()
      setActiveProject(proj)
      setActiveThread(thread)
      setSessionId(thread.id)
      setActiveSteps([])
    } catch (e) {
      console.error('Failed to create thread', e)
    }
  }, [providers, refreshProjects])

  const handleNewProject = useCallback(async () => {
    const name = prompt('Enter project name:')
    if (!name?.trim()) return
    try {
      const proj = await api.post<Project>('/api/projects', {
        name,
        root_path: '.',
        description: 'Workspace Project',
      })
      await refreshProjects()
      setActiveProject(proj)
      setActiveThread(null)
      setSessionId(genId())
    } catch (e) {
      console.error('Failed to create project', e)
    }
  }, [refreshProjects])

  const handleSend = useCallback(
    (content: string, provider: string, model: string, mode: AgentMode) => {
      // Simulate real-time execution steps for AntiGravity feel
      const mockStep: ExecutionStep = {
        id: genId(),
        title: mode === 'plan' ? 'Synthesizing Architecture Plan' : `Executing with ${provider}`,
        toolName: mode === 'plan' ? 'view_file' : 'run_command',
        status: 'running',
        input: content.length > 60 ? `${content.slice(0, 60)}...` : content,
      }
      setActiveSteps([mockStep])

      sendMessage(content, provider, model)

      // Mark step completed after turn
      setTimeout(() => {
        setActiveSteps(prev =>
          prev.map(s => (s.id === mockStep.id ? { ...s, status: 'completed', durationMs: 420 } : s))
        )
      }, 1800)
    },
    [sendMessage]
  )

  const handleOpenArtifactInPanel = (content: string, title: string) => {
    setActiveArtifact({ title, content })
    setRightPanel('diff')
  }

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    localStorage.setItem('rezolotion-theme', next)
  }

  // Rate-limit resilience detection
  const lastMsg = messages[messages.length - 1]
  const rateLimited =
    lastMsg?.content?.toLowerCase().includes('rate limit') ||
    lastMsg?.content?.toLowerCase().includes('overloaded')

  return (
    <ErrorBoundary>
      <div
        className="flex h-screen overflow-hidden font-sans"
        style={{
          background: 'var(--color-base)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Left Column: Projects & Threads Sidebar */}
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

        {/* Center Column: Agent Execution Canvas */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <h3 className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {activeThread ? activeThread.title : 'Select or start a new thread'}
                </h3>
                {activeProject && (
                  <p className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
                    {activeProject.name} • {activeProject.root_path}
                  </p>
                )}
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              {/* Right Panel View Switcher */}
              <div className="flex items-center bg-[var(--color-elevated)] p-1 rounded-xl border border-[var(--color-border)]">
                <button
                  onClick={() => setRightPanel('explorer')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    rightPanel === 'explorer'
                      ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
                  title="File Explorer"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Files</span>
                </button>
                <button
                  onClick={() => setRightPanel('diff')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    rightPanel === 'diff'
                      ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
                  title="Diff & Artifact Viewer"
                >
                  <FileDiff className="w-3.5 h-3.5" />
                  <span>Diff</span>
                </button>
                <button
                  onClick={() => setRightPanel('observe')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    rightPanel === 'observe'
                      ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
                  title="LLM Observability Dashboard"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Observe</span>
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)] border border-[var(--color-border)] transition-colors cursor-pointer"
                title="Toggle Dark / Light Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Rate-limit Resilience Banner */}
          {rateLimited && (
            <div className="flex items-center justify-between px-6 py-2 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Rate-limit reached on primary model. Resilience manager queued automatic fallback turn.</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800/80 cursor-pointer font-mono text-[11px]">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Auto-resuming</span>
                </button>
              </div>
            </div>
          )}

          {/* Center Message Stream */}
          <MessageList
            messages={messages}
            streaming={streaming}
            streamText={streamText}
            activeSteps={activeSteps}
            onOpenArtifact={handleOpenArtifactInPanel}
          />

          {/* Bottom Floating Island Composer */}
          <Composer
            providers={providers}
            streaming={streaming}
            tokenCount={tokenCount}
            onSend={handleSend}
          />
        </div>

        {/* Right Column: Multi-Engine Panel */}
        {rightPanel === 'explorer' && (
          <FileExplorer
            projectPath={activeProject?.root_path ?? '.'}
            onOpenFile={(path, content) => {
              setActiveArtifact({ title: path.split('/').pop() || 'file', content })
            }}
          />
        )}

        {rightPanel === 'diff' && (
          <div className="w-80 flex-shrink-0 h-full">
            <DiffViewer
              filename={activeArtifact?.title || 'active-file.ts'}
              diffText={activeArtifact?.content}
              modifiedContent={activeArtifact?.content}
            />
          </div>
        )}

        {rightPanel === 'observe' && (
          <aside
            className="flex flex-col h-full border-l border-[var(--color-border)]"
            style={{
              background: 'var(--color-surface)',
              width: '340px',
              flexShrink: 0,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Grok LLM Observability
                </span>
              </div>
            </div>
            <ObservabilityDashboard />
          </aside>
        )}

        {/* Providers Authentication Hub Modal */}
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
