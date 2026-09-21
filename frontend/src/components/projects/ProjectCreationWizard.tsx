import { useState } from 'react'
import {
  X,
  HardDrive,
  Terminal,
  Container,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react'
import { getProviderIcon } from '@/components/ui/brand-icons'
import { api } from '@/lib/api'
import type { Project } from '@/types'

export type ProjectEnvironmentType = 'local' | 'ssh' | 'docker' | 'scratchpad'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (project: Project) => void
}

export function ProjectCreationWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [envType, setEnvType] = useState<ProjectEnvironmentType>('local')
  const [name, setName] = useState('')
  const [path, setPath] = useState('.')
  const [sshHost, setSshHost] = useState('')
  const [sshUser, setSshUser] = useState('')
  const [sshPort, setSshPort] = useState('22')
  const [dockerImage, setDockerImage] = useState('ubuntu:latest')
  const [harness, setHarness] = useState('claude')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const config: Record<string, any> = {}
      if (envType === 'ssh') {
        config.host = sshHost
        config.user = sshUser
        config.port = Number(sshPort) || 22
      } else if (envType === 'docker') {
        config.image = dockerImage
      }

      const res = await api.post<Project>('/api/projects', {
        name: name.trim(),
        root_path: envType === 'scratchpad' ? '/tmp/scratchpad' : path.trim() || '.',
        description: `${envType.toUpperCase()} Environment Project`,
        project_type: envType,
        connection_config: config,
      })

      // Create an initial thread in the project
      await api.post(`/api/projects/${res.id}/threads`, {
        title: 'Initial engineering thread',
        harness,
        model: 'claude-3-7-sonnet',
      })

      onCreated(res)
      onClose()
    } catch (_) {
      setError('Failed to create project. Please verify path/connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-elevated)]/60 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-[var(--color-accent)]" />
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                New Workspace Project
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Step {step} of 2 — {step === 1 ? 'Select Environment Architecture' : 'Configure Connection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Choose the execution target for your agent harness:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Local */}
                <div
                  onClick={() => setEnvType('local')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    envType === 'local'
                      ? 'border-[var(--color-accent)] bg-[var(--color-elevated)] shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                    {envType === 'local' && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Local Workspace
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    Direct binding to a local folder or Git repository on this machine.
                  </p>
                </div>

                {/* 2. SSH */}
                <div
                  onClick={() => setEnvType('ssh')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    envType === 'ssh'
                      ? 'border-[var(--color-accent)] bg-[var(--color-elevated)] shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Terminal className="w-5 h-5 text-amber-400" />
                    {envType === 'ssh' && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Remote SSH Session
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    Orchestrate agents on remote cloud instances, staging servers, or VPS.
                  </p>
                </div>

                {/* 3. Docker */}
                <div
                  onClick={() => setEnvType('docker')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    envType === 'docker'
                      ? 'border-[var(--color-accent)] bg-[var(--color-elevated)] shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Container className="w-5 h-5 text-cyan-400" />
                    {envType === 'docker' && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Cloud / Container
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    Sandboxed execution within an isolated Docker daemon or cloud runner.
                  </p>
                </div>

                {/* 4. Quick Scratchpad */}
                <div
                  onClick={() => setEnvType('scratchpad')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    envType === 'scratchpad'
                      ? 'border-[var(--color-accent)] bg-[var(--color-elevated)] shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    {envType === 'scratchpad' && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Quick Scratchpad
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    Zero-configuration ephemeral playground in temporary memory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. backend-api-service"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] outline-none font-mono"
                />
              </div>

              {envType === 'local' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Root Directory Path</label>
                  <input
                    type="text"
                    value={path}
                    onChange={e => setPath(e.target.value)}
                    placeholder="/path/to/repository or ."
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] outline-none font-mono"
                  />
                </div>
              )}

              {envType === 'ssh' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Host IP / Domain</label>
                    <input
                      type="text"
                      value={sshHost}
                      onChange={e => setSshHost(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Port</label>
                    <input
                      type="text"
                      value={sshPort}
                      onChange={e => setSshPort(e.target.value)}
                      placeholder="22"
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono outline-none"
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">SSH Username</label>
                    <input
                      type="text"
                      value={sshUser}
                      onChange={e => setSshUser(e.target.value)}
                      placeholder="ubuntu"
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono outline-none"
                    />
                  </div>
                </div>
              )}

              {envType === 'docker' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Container Image</label>
                  <input
                    type="text"
                    value={dockerImage}
                    onChange={e => setDockerImage(e.target.value)}
                    placeholder="node:20-alpine or python:3.11"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono outline-none"
                  />
                </div>
              )}

              {/* Initial Harness Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Primary Execution Harness</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['claude', 'antigravity', 'openai', 'deepseek'] as const).map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHarness(h)}
                      className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs capitalize cursor-pointer border transition-all ${
                        harness === h
                          ? 'border-[var(--color-accent)] bg-[var(--color-elevated)] font-medium text-[var(--color-text-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]/40'
                      }`}
                    >
                      {getProviderIcon(h, 'w-3.5 h-3.5', 14)}
                      <span>{h}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-elevated)]/40 border-t border-[var(--color-border)]">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              onClick={() => {
                if (!name) setName(envType === 'scratchpad' ? 'scratchpad-workspace' : '')
                setStep(2)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-95 cursor-pointer shadow-sm"
            >
              <span>Next: Configure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => void handleCreate()}
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-95 cursor-pointer disabled:opacity-40 shadow-sm"
            >
              <span>{loading ? 'Provisioning Environment…' : 'Create & Open Project'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
