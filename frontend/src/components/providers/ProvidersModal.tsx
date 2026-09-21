import { useState } from 'react'
import type { Provider } from '@/types'
import { api } from '@/lib/api'
import { StatusDot } from '@/components/ui/status-dot'
import { getProviderIcon } from '@/components/ui/brand-icons'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react'

interface Props {
  providers: Provider[]
  onClose: () => void
  onRefresh: () => void
}

interface ConfigResult {
  success: boolean
  message: string
}

interface TestResult {
  success: boolean
  message: string
}

export function ProvidersModal({ providers, onClose, onRefresh }: Props) {
  const [selected, setSelected] = useState<string>(providers[0]?.id ?? 'claude')
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copiedCli, setCopiedCli] = useState(false)

  const selectedProvider = providers.find(p => p.id === selected)

  const handleTest = async () => {
    if (!selectedProvider) return
    setLoading(true)
    setStatus('Testing connection latency…')
    try {
      const res = await api.post<TestResult>('/api/auth/test', {
        provider_id: selected,
        api_key: keyInput || undefined,
      })
      setStatus(res.success ? 'Connected successfully' : `Failed: ${res.message}`)
    } catch (_) {
      setStatus('Failed: Request timed out or server unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProvider || !keyInput.trim()) return
    setLoading(true)
    setStatus('Writing to environment…')
    try {
      const res = await api.post<ConfigResult>('/api/auth/configure', {
        provider_id: selected,
        api_key: keyInput,
      })
      setStatus(res.success ? 'Key saved to .env' : `Save failed: ${res.message}`)
      onRefresh()
      setKeyInput('')
    } catch (_) {
      setStatus('Save failed: Disk write error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCli = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  const cliCmd =
    selected === 'claude'
      ? 'claude auth login'
      : selected === 'antigravity'
      ? 'gcloud auth application-default login'
      : 'ollama serve'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col border border-[var(--color-border)] shadow-2xl"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-elevated)]/50 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)]" />
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Multi-Provider Authentication Hub
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Native zero-risk CLI sessions and direct LLM API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Provider Selection Column */}
          <div className="w-56 flex-shrink-0 overflow-y-auto py-2 border-r border-[var(--color-border)] bg-[var(--color-base)]/40">
            {providers.map(p => {
              const isSelected = selected === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p.id)
                    setKeyInput('')
                    setStatus('')
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-[var(--color-elevated)] font-medium' : 'hover:bg-[var(--color-elevated)]/50'
                  }`}
                  style={{
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  <div className="flex-shrink-0">{getProviderIcon(p.id, 'w-4 h-4', 16)}</div>
                  <span className="text-xs truncate flex-1">{p.name}</span>
                  <StatusDot connected={p.connected} size="sm" />
                </button>
              )
            })}
          </div>

          {/* Right: Configuration & Status Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {selectedProvider && (
              <>
                {/* Active Connection Banner */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{
                    background: selectedProvider.connected
                      ? 'oklch(0.20 0.04 145 / 0.3)'
                      : 'var(--color-elevated)',
                    borderColor: selectedProvider.connected
                      ? 'oklch(0.40 0.12 145 / 0.4)'
                      : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StatusDot connected={selectedProvider.connected} size="md" />
                    <div>
                      <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {selectedProvider.connected ? 'Active Session Connected' : 'Offline / Not Configured'}
                      </h4>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        {selectedProvider.note || 'Ready for configuration'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-base)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                    {selectedProvider.mode}
                  </span>
                </div>

                {/* CLI Native Instructions */}
                {selectedProvider.mode === 'cli' && (
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-primary)]">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span>Zero-Risk Native CLI Execution</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Rezolotion uses your local official CLI session directly without reverse-proxy scrapers or session hijacking.
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-base)] border border-[var(--color-border)] font-mono text-xs">
                      <span className="text-emerald-400">$ {cliCmd}</span>
                      <button
                        onClick={() => void handleCopyCli(cliCmd)}
                        className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCli ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* API Key Form */}
                {selectedProvider.mode !== 'cli' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedProvider.env_var || 'API Key'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={keyInput}
                        onChange={e => setKeyInput(e.target.value)}
                        placeholder="sk-••••••••••••••••••••••••"
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono outline-none bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={() => void handleTest()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-primary)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Test Latency</span>
                  </button>

                  {selectedProvider.mode !== 'cli' && (
                    <button
                      onClick={() => void handleSave()}
                      disabled={loading || !keyInput.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span>Save Key</span>
                    </button>
                  )}
                </div>

                {/* Status Feedback */}
                {status && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {status.includes('successfully') || status.includes('saved') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : status.includes('Failed') ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    )}
                    <span
                      style={{
                        color:
                          status.includes('successfully') || status.includes('saved')
                            ? '#34d399'
                            : status.includes('Failed')
                            ? '#f87171'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
