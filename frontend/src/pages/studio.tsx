import { useState, useCallback, useEffect } from 'react'
import {
  useProviders,
  useProjects,
  useChat,
  deleteProject,
  renameProject,
  deleteThread,
  renameThread,
} from '@/hooks'
import type { Project, Thread, ModelOption } from '@/types'
import { ProjectsSidebar } from '@/components/sidebar/ProjectsSidebar'
import { ProvidersModal } from '@/components/providers/ProvidersModal'
import { ProjectCreationWizard } from '@/components/projects/ProjectCreationWizard'
import { AuthGate } from '@/components/auth/AuthGate'
import { MessageList } from '@/components/chat/MessageList'
import { Composer, AgentMode, ExecutionPipelineMode } from '@/components/chat/Composer'
import { FileExplorer } from '@/components/explorer/FileExplorer'
import { DiffViewer } from '@/components/explorer/DiffViewer'
import { ObservabilityDashboard } from '@/components/observability/ObservabilityDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
  const [showProjectWizard, setShowProjectWizard] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanelTab>('explorer')
  const [activeArtifact, setActiveArtifact] = useState<{ title: string; content: string } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

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

  const {
    messages,
    streaming,
    streamText,
    activeSteps,
    tokenCount,
    sendMessage,
    setActiveSteps,
  } = useChat(sessionId)

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
  }, [providers, refreshProjects, setActiveSteps])

  const handleProjectCreated = useCallback(
    async (newProj: Project) => {
      await refreshProjects()
      setActiveProject(newProj)
      setShowProjectWizard(false)
      if (newProj.threads && newProj.threads.length > 0) {
        setActiveThread(newProj.threads[0])
        setSessionId(newProj.threads[0].id)
      } else {
        setActiveThread(null)
        setSessionId(genId())
      }
      setActiveSteps([])
    },
    [refreshProjects, setActiveSteps]
  )

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteProject(projectId)
        await refreshProjects()
        if (activeProject?.id === projectId) {
          setActiveProject(null)
          setActiveThread(null)
          setSessionId(genId())
        }
      } catch (e) {
        console.error('Failed to delete project', e)
      }
    },
    [activeProject, refreshProjects]
  )

  const handleRenameProject = useCallback(
    async (projectId: string, newName: string) => {
      try {
        await renameProject(projectId, newName)
        await refreshProjects()
      } catch (e) {
        console.error('Failed to rename project', e)
      }
    },
    [refreshProjects]
  )

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      try {
        await deleteThread(threadId)
        await refreshProjects()
        if (activeThread?.id === threadId) {
          setActiveThread(null)
          setSessionId(genId())
        }
      } catch (e) {
        console.error('Failed to delete thread', e)
      }
    },
    [activeThread, refreshProjects]
  )

  const handleRenameThread = useCallback(
    async (threadId: string, newTitle: string) => {
      try {
        await renameThread(threadId, newTitle)
        await refreshProjects()
      } catch (e) {
        console.error('Failed to rename thread', e)
      }
    },
    [refreshProjects]
  )

  const handleLogout = () => {
    localStorage.removeItem('rezolotion_session_token')
    localStorage.removeItem('rezolotion_user')
    window.location.reload()
  }

  const handleSend = useCallback(
    (
      content: string,
      provider: string,
      model: string,
      mode: AgentMode,
      chatMode: ExecutionPipelineMode = 'single',
      models?: ModelOption[]
    ) => {
      sendMessage(content, provider, model, mode, chatMode, models)
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

  const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('rezolotion_guest_mode') === 'true'

  const handleExitGuestMode = () => {
    localStorage.setItem('rezolotion_guest_mode', 'false')
    localStorage.removeItem('rezolotion_session_token')
    window.location.reload()
  }

  return (
    <AuthGate>
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
          onNewProject={() => setShowProjectWizard(true)}
          onDeleteProject={id => void handleDeleteProject(id)}
          onRenameProject={(id, name) => void handleRenameProject(id, name)}
          onDeleteThread={id => void handleDeleteThread(id)}
          onRenameThread={(id, title) => void handleRenameThread(id, title)}
          onOpenProviders={() => setShowProviders(true)}
          onOpenObserve={() => setRightPanel('observe')}
          onLogout={handleLogout}
        />

        {/* Center Column: Agent Execution Canvas */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Guest Mode Notice Banner */}
          {isGuestMode && (
            <div className="flex items-center justify-between px-5 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-mono flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span>
                  <strong>Guest Mode (Clean Slate Simulation):</strong> 0 connected providers detected. Open Providers Hub to test onboarding or connect G-CAT / Custom API.
                </span>
              </div>
              <button
                onClick={handleExitGuestMode}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-sans font-medium transition-colors cursor-pointer ml-3 flex-shrink-0"
              >
                Exit Guest Mode
              </button>
            </div>
          )}

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
            onOpenProviders={() => setShowProviders(true)}
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

        {/* Project Creation Wizard Modal */}
        {showProjectWizard && (
          <ProjectCreationWizard
            open={showProjectWizard}
            onClose={() => setShowProjectWizard(false)}
            onCreated={proj => void handleProjectCreated(proj)}
          />
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
  </AuthGate>
  )
}
